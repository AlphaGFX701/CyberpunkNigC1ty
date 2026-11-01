import { SceneMusic, type MusicScene } from './music.ts'
export type { MusicScene } from './music.ts'
export type EntryCue =
  'rain' | 'relay' | 'alarm' | 'static' | 'connect' | 'confirm' | 'door-open' | 'footsteps'
export type EntryAudioStatus = {
  music: 'idle' | 'playing' | 'blocked' | 'error'
  sfxAvailable: boolean
}
export type TalkVoice = 'kin' | 'arun' | 'system'

const level = (value: number) => (Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0)
const noop = () => {}

/** One music transport and a separately muted, cancellable bus for original procedural effects. */
export class EntryAudio {
  private music: SceneMusic
  private context: AudioContext | null = null
  private effects: GainNode | null = null
  private effectsLevel = 0.6
  private unlocked = false
  private disposed = false
  private cancellations = new Set<() => void>()
  private lastTalkAt = -Infinity
  private talkPitch = 0
  private status: EntryAudioStatus = { music: 'idle', sfxAvailable: false }
  private onStatus?: (status: EntryAudioStatus) => void

  constructor(onStatus?: (status: EntryAudioStatus) => void) {
    this.onStatus = onStatus
    this.music = new SceneMusic((music) => this.publish({ music }))
  }
  private publish(next: Partial<EntryAudioStatus>): void {
    if (this.disposed) return
    const status = { ...this.status, ...next }
    if (status.music === this.status.music && status.sfxAvailable === this.status.sfxAvailable)
      return
    this.status = status
    this.onStatus?.({ ...status })
  }
  /** Music starts synchronously in the gesture. This promise is SFX readiness only. */
  async unlock(): Promise<void> {
    if (this.disposed) return
    this.unlocked = true
    this.music.unlock()
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
    try {
      if (this.context?.state === 'suspended') await this.context.resume()
      this.publish({ sfxAvailable: this.context?.state === 'running' })
    } catch {
      this.publish({ sfxAvailable: false })
    }
  }
  setLevels(music: number, sfx: number): void {
    this.music.setLevel(level(music))
    this.effectsLevel = level(sfx)
    if (this.effects) this.effects.gain.value = this.effectsLevel
  }
  setMusicScene(scene: MusicScene): void {
    this.music.setScene(scene)
  }
  prepareMusicScene(scene: MusicScene): void {
    this.music.prepare(scene)
  }
  setMusicActive(active: boolean): void {
    this.music.setActive(active)
  }

  /** A soft syllable for revealed text, using the same gesture-unlocked effects bus. */
  playTalkBlip(voice: TalkVoice = 'kin'): () => void {
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
          /* The scheduled short blip may already have ended. */
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
      const pitches =
        voice === 'arun' ? [175, 196, 185] : voice === 'system' ? [430, 460, 445] : [290, 326, 308]
      source.frequency.value = pitches[this.talkPitch % 3]
      gain.gain.setValueAtTime(0, at)
      gain.gain.linearRampToValueAtTime(0.11, at + 0.005)
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.052)
      source.connect(gain)
      gain.connect(bus)
      source.onended = cancel
      this.cancellations.add(cancel)
      source.start(at)
      source.stop(at + 0.052)
      this.lastTalkAt = ctx.currentTime
      this.talkPitch++
    } catch {
      cancel()
    }
    return cancel
  }

  /** Full visible lines still get a brief voice effect; no typing animation is required. */
  playTalkLine(text: string, voice: TalkVoice = 'kin'): () => void {
    if (
      !text.trim() ||
      !this.unlocked ||
      this.disposed ||
      this.context?.state !== 'running' ||
      this.effectsLevel === 0
    )
      return noop
    const count = Math.min(8, Math.max(2, Math.ceil(text.trim().length / 10)))
    const timers: ReturnType<typeof setTimeout>[] = []
    const syllables: (() => void)[] = []
    let cancelled = false
    const cancel = () => {
      if (cancelled) return
      cancelled = true
      timers.forEach(clearTimeout)
      syllables.forEach((stop) => stop())
      this.cancellations.delete(cancel)
    }
    const emit = () => {
      if (!cancelled) syllables.push(this.playTalkBlip(voice))
    }
    this.cancellations.add(cancel)
    emit()
    for (let i = 1; i < count; i++) timers.push(setTimeout(emit, i * 144))
    timers.push(setTimeout(cancel, count * 144))
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
        case 'door-open':
          tone(130, 0, 0.16, 0.07, 'triangle')
          noise(0.9, 0.055, 450, 'lowpass')
          tone(80, 0.8, 0.11, 0.07)
          break
        case 'footsteps':
          for (const offset of [0, 0.3, 0.6, 0.9, 1.2]) tone(95, offset, 0.055, 0.045, 'triangle')
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
    this.stopCues()
    this.music.dispose()
    if (this.context && this.context.state !== 'closed') void this.context.close().catch(noop)
    this.effects?.disconnect()
    this.effects = null
    this.context = null
  }
}
