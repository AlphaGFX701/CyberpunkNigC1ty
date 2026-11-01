export type EntryCue = 'rain' | 'relay' | 'alarm' | 'static' | 'connect' | 'confirm'
export type EntryAudioStatus = {
  music: 'idle' | 'playing' | 'blocked' | 'error'
  sfxAvailable: boolean
}

const level = (value: number) => (Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0)
const noop = () => {}

/** One music transport and a separately muted, cancellable bus for original procedural effects. */
export class EntryAudio {
  private music: HTMLAudioElement | null = null
  private context: AudioContext | null = null
  private effects: GainNode | null = null
  private musicLevel = 0.35
  private effectsLevel = 0.6
  private unlocked = false
  private disposed = false
  private musicActive = false
  private playPending: Promise<void> | null = null
  private cancellations = new Set<() => void>()
  private lastTalkAt = -Infinity
  private talkPitch = 0
  private status: EntryAudioStatus = { music: 'idle', sfxAvailable: false }
  private onStatus?: (status: EntryAudioStatus) => void
  private onMusicError = () => this.publish({ music: 'error' })

  constructor(onStatus?: (status: EntryAudioStatus) => void) {
    this.onStatus = onStatus
  }

  private publish(next: Partial<EntryAudioStatus>): void {
    if (this.disposed) return
    const status = { ...this.status, ...next }
    if (status.music === this.status.music && status.sfxAvailable === this.status.sfxAvailable)
      return
    this.status = status
    this.onStatus?.({ ...status })
  }

  private reportPlaybackError(reason: unknown): void {
    const name = reason && typeof reason === 'object' && 'name' in reason ? reason.name : ''
    this.publish({ music: name === 'NotAllowedError' ? 'blocked' : 'error' })
  }

  /** Call directly from a click/key gesture; rejected autoplay never rejects the game action. */
  async unlock(): Promise<void> {
    if (this.disposed) return
    this.unlocked = true
    if (!this.music && typeof Audio !== 'undefined') {
      try {
        this.music = new Audio('/assets/theme.wav')
        this.music.loop = true
        this.music.preload = 'metadata'
        this.music.volume = this.musicLevel
        this.music.hidden = true
        this.music.setAttribute?.('data-testid', 'music-transport')
        this.music.setAttribute?.('data-techcare-music', '')
        this.music.setAttribute?.('aria-hidden', 'true')
        this.music.addEventListener?.('error', this.onMusicError)
        if (typeof document !== 'undefined') document.body.append(this.music)
      } catch {
        this.publish({ music: 'error' })
      }
    }
    if (!this.music) this.publish({ music: 'error' })
    if (!this.context) {
      try {
        const scope = globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext }
        const Constructor = scope.AudioContext ?? scope.webkitAudioContext
        if (Constructor) {
          this.context = new Constructor()
          this.effects = this.context.createGain()
          this.effects.gain.value = this.effectsLevel
          this.effects.connect(this.context.destination)
        }
      } catch {
        this.context = null
        this.effects = null
      }
    }
    const resume =
      this.context?.state === 'suspended'
        ? this.context
            .resume()
            .then(() => {
              this.publish({ sfxAvailable: this.context?.state === 'running' })
            })
            .catch(() => this.publish({ sfxAvailable: false }))
        : Promise.resolve(this.publish({ sfxAvailable: this.context?.state === 'running' }))
    // Start both transports within the original activation event, before awaiting either.
    await Promise.all([resume, this.syncMusic()])
  }

  setLevels(music: number, sfx: number): void {
    this.musicLevel = level(music)
    this.effectsLevel = level(sfx)
    if (this.music) this.music.volume = this.musicLevel
    if (this.effects) this.effects.gain.value = this.effectsLevel
  }

  setMusicActive(active: boolean): void {
    if (this.disposed) return
    this.musicActive = active
    void this.syncMusic()
  }

  private syncMusic(): Promise<void> {
    const audio = this.music
    if (!audio || this.disposed || !this.unlocked) return Promise.resolve()
    if (!this.musicActive) {
      audio.pause()
      if (this.status.music !== 'error') this.publish({ music: 'idle' })
      return Promise.resolve()
    }
    if (this.playPending) return this.playPending
    if (!audio.paused) return Promise.resolve()
    try {
      this.playPending = Promise.resolve(audio.play())
        .then(() => this.publish({ music: this.musicActive ? 'playing' : 'idle' }))
        .catch((reason) => this.reportPlaybackError(reason))
        .finally(() => {
          this.playPending = null
          // A menu transition/dispose may have happened while play() was pending.
          if (this.disposed || !this.musicActive) audio.pause()
        })
      return this.playPending
    } catch (reason) {
      this.reportPlaybackError(reason)
      return Promise.resolve()
    }
  }

  /** A soft syllable for revealed text, using the same gesture-unlocked effects bus. */
  playTalkBlip(): () => void {
    const ctx = this.context,
      bus = this.effects
    if (
      !this.unlocked ||
      this.disposed ||
      !ctx ||
      !bus ||
      ctx.state !== 'running' ||
      this.effectsLevel === 0 ||
      ctx.currentTime - this.lastTalkAt < 0.125
    )
      return noop

    let source: OscillatorNode | undefined
    let gain: GainNode | undefined
    let cancelled = false
    const cancel = () => {
      if (cancelled) return
      cancelled = true
      this.cancellations.delete(cancel)
      if (source) {
        source.onended = null
        try {
          source.stop()
        } catch {
          /* The scheduled 22ms blip may already have ended. */
        }
        source.disconnect()
      }
      gain?.disconnect()
    }
    try {
      source = ctx.createOscillator()
      gain = ctx.createGain()
      const at = ctx.currentTime + 0.004
      source.type = 'triangle'
      source.frequency.value = [290, 326, 308][this.talkPitch % 3]
      gain.gain.setValueAtTime(0, at)
      gain.gain.linearRampToValueAtTime(0.055, at + 0.003)
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.022)
      source.connect(gain)
      gain.connect(bus)
      source.onended = cancel
      this.cancellations.add(cancel)
      source.start(at)
      source.stop(at + 0.022)
      this.lastTalkAt = ctx.currentTime
      this.talkPitch++
    } catch {
      cancel()
    }
    return cancel
  }

  playCue(cue: EntryCue): () => void {
    const ctx = this.context,
      bus = this.effects
    if (
      !this.unlocked ||
      this.disposed ||
      !ctx ||
      !bus ||
      ctx.state !== 'running' ||
      this.effectsLevel === 0
    )
      return noop

    const sources: AudioScheduledSourceNode[] = []
    const nodes: AudioNode[] = []
    let cancelled = false
    let remaining = 0
    const cancel = () => {
      if (cancelled) return
      cancelled = true
      this.cancellations.delete(cancel)
      for (const source of sources) {
        source.onended = null
        try {
          source.stop()
        } catch {
          /* A completed source is already stopped. */
        }
      }
      for (const node of nodes) {
        try {
          node.disconnect()
        } catch {
          /* Already disconnected. */
        }
      }
    }
    this.cancellations.add(cancel)
    const now = ctx.currentTime + 0.006
    const track = (
      source: AudioScheduledSourceNode,
      gain: GainNode,
      at: number,
      duration: number
    ) => {
      sources.push(source)
      nodes.push(source, gain)
      remaining++
      source.onended = () => {
        if (--remaining === 0) cancel()
      }
      source.connect(gain)
      gain.connect(bus)
      source.start(at)
      source.stop(at + duration)
    }
    const tone = (
      hz: number,
      offset: number,
      duration: number,
      volume: number,
      wave: OscillatorType = 'sine'
    ) => {
      const source = ctx.createOscillator(),
        gain = ctx.createGain(),
        at = now + offset
      source.type = wave
      source.frequency.value = hz
      gain.gain.setValueAtTime(0, at)
      gain.gain.linearRampToValueAtTime(volume, at + Math.min(0.012, duration / 4))
      gain.gain.exponentialRampToValueAtTime(0.0001, at + duration)
      track(source, gain, at, duration)
    }
    const noise = (duration: number, volume: number, frequency: number, type: BiquadFilterType) => {
      const source = ctx.createBufferSource(),
        filter = ctx.createBiquadFilter(),
        gain = ctx.createGain()
      const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate)
      const channel = buffer.getChannelData(0)
      for (let i = 0; i < channel.length; i++) channel[i] = Math.random() * 2 - 1
      source.buffer = buffer
      filter.type = type
      filter.frequency.value = frequency
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(volume, now + Math.min(0.08, duration / 4))
      gain.gain.setValueAtTime(volume, now + duration * 0.7)
      gain.gain.linearRampToValueAtTime(0, now + duration)
      // A source can connect through a filter without changing cancellation ownership.
      sources.push(source)
      nodes.push(source, filter, gain)
      remaining++
      source.onended = () => {
        if (--remaining === 0) cancel()
      }
      source.connect(filter)
      filter.connect(gain)
      gain.connect(bus)
      source.start(now)
      source.stop(now + duration)
    }
    try {
      switch (cue) {
        case 'rain':
          noise(5, 0.11, 1500, 'lowpass')
          break
        case 'relay':
          tone(180, 0, 0.045, 0.07, 'square')
          noise(0.06, 0.045, 2400, 'highpass')
          break
        case 'alarm':
          tone(540, 0, 0.12, 0.11)
          tone(540, 0.23, 0.12, 0.11)
          break
        case 'static':
          noise(0.21, 0.09, 900, 'highpass')
          break
        case 'connect':
          tone(440, 0, 0.1, 0.08)
          tone(660, 0.11, 0.1, 0.08)
          tone(880, 0.22, 0.16, 0.07)
          break
        case 'confirm':
          tone(620, 0, 0.08, 0.08)
          tone(930, 0.065, 0.11, 0.065)
          break
      }
    } catch {
      cancel()
    }
    return cancel
  }

  stopCues(): void {
    for (const cancel of [...this.cancellations]) cancel()
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.musicActive = false
    this.stopCues()
    if (this.music) {
      this.music.pause()
      this.music.removeEventListener?.('error', this.onMusicError)
      this.music.removeAttribute('src')
      this.music.load()
      this.music.remove?.()
    }
    if (this.context && this.context.state !== 'closed') void this.context.close().catch(noop)
    this.effects?.disconnect()
    this.music = null
    this.effects = null
    this.context = null
  }
}
