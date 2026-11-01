import { sceneTracks as tracks, defaultNextMusicScene, type MusicScene } from './scene-tracks.ts'
export type { MusicScene } from './scene-tracks.ts'
type PlaybackStatus = 'idle' | 'playing' | 'blocked' | 'error'
type Slot = {
  audio: HTMLAudioElement
  scene: MusicScene
  mix: number
  token: number
  sourceToken: number
  pending: boolean
  playing: boolean
  failed: boolean
  seek: () => void
  error: () => void
}

/** Two reusable streaming slots: one playing scene, one prepared next scene. */
export class SceneMusic {
  private slots: Slot[] = []
  private current: Slot | undefined
  private outgoing: Slot | undefined
  private scene: MusicScene = 'entry'
  private preparedScene: MusicScene | null = null
  private enabled = false
  private unlocked = false
  private disposed = false
  private volume = 0.35
  private generation = 0
  private fade: ReturnType<typeof setInterval> | undefined
  private report: (state: PlaybackStatus) => void

  constructor(report: (state: PlaybackStatus) => void) {
    this.report = report
    if (typeof Audio === 'undefined') {
      this.report('error')
      return
    }
    try {
      this.slots = [this.create('entry'), this.create('story')]
      this.current = this.slots[0]
      this.current.mix = 1
      this.roles()
      this.levels()
    } catch {
      this.report('error')
    }
  }
  private create(scene: MusicScene): Slot {
    const audio = new Audio(tracks[scene].src)
    const slot: Slot = {
      audio,
      scene,
      mix: 0,
      token: 0,
      sourceToken: 0,
      pending: false,
      playing: false,
      failed: false,
      seek: () => {},
      error: () => {},
    }
    audio.loop = true
    audio.preload = 'auto'
    audio.volume = 0
    audio.hidden = true
    audio.setAttribute?.('data-techcare-music', '')
    audio.setAttribute?.('aria-hidden', 'true')
    audio.setAttribute?.('data-testid', 'music-transport')
    if (typeof document !== 'undefined') document.body.append(audio)
    this.assign(slot, scene)
    return slot
  }
  private assign(slot: Slot, scene: MusicScene) {
    const a = slot.audio
    a.pause()
    a.removeEventListener?.('loadedmetadata', slot.seek)
    a.removeEventListener?.('error', slot.error)
    const sourceToken = ++slot.sourceToken
    slot.token++
    slot.pending = false
    slot.playing = false
    slot.failed = false
    slot.scene = scene
    slot.mix = 0
    a.src = tracks[scene].src
    a.setAttribute?.('data-music-scene', scene)
    slot.seek = () => {
      if (slot.sourceToken !== sourceToken || this.disposed) return
      try {
        a.currentTime = tracks[scene].cue
      } catch {
        /* metadata has not arrived yet */
      }
    }
    slot.error = () => {
      if (slot.sourceToken === sourceToken) this.failure(slot, null)
    }
    a.addEventListener?.('loadedmetadata', slot.seek)
    a.addEventListener?.('error', slot.error)
    a.load?.()
    slot.seek()
  }
  private roles() {
    for (const slot of this.slots)
      slot.audio.setAttribute?.('data-music-role', slot === this.current ? 'active' : 'standby')
  }
  private levels() {
    for (const slot of this.slots) slot.audio.volume = this.volume * slot.mix
  }
  setLevel(level: number) {
    this.volume = level
    this.levels()
  }
  setScene(scene: MusicScene) {
    if (this.disposed || scene === this.scene) return
    this.scene = scene
    this.generation++
    this.cancelFade()
    const old = this.current
    const incoming =
      this.slots.find((s) => s !== old && s.scene === scene) ?? this.slots.find((s) => s !== old)
    if (!incoming) {
      this.report('error')
      return
    }
    // A pending outgoing play must not start later as the wrong area's soundtrack.
    if (old?.pending && !old.playing) this.pause(old)
    // A rapid scene change reuses the spare slot and invalidates its old promises.
    if (incoming.scene !== scene) this.assign(incoming, scene)
    else if (incoming.pending && !incoming.playing) this.pause(incoming)
    this.outgoing = old?.playing && !old.audio.paused ? old : undefined
    this.current = incoming
    // Selection belongs to the area we just left; a new scene gets its own next target.
    this.preparedScene = null
    incoming.mix = 0
    if (this.outgoing) this.outgoing.mix = 1
    this.roles()
    this.levels()
    if (this.enabled && this.unlocked) this.playCurrent()
  }
  /** Prepare a known next area, but never steal a still-fading outgoing slot. */
  prepare(scene: MusicScene) {
    if (this.disposed || scene === this.scene) return
    this.preparedScene = scene
    if (!this.outgoing && !this.fade) this.prepareNext()
  }
  private pause(slot: Slot) {
    slot.token++
    slot.pending = false
    slot.playing = false
    slot.audio.pause()
  }
  setActive(active: boolean) {
    if (this.disposed || this.enabled === active) return
    this.enabled = active
    if (!active) {
      this.generation++
      this.cancelFade()
      for (const slot of this.slots) {
        this.pause(slot)
      }
      this.outgoing = undefined
      if (this.current) this.current.mix = 1
      this.levels()
      this.report('idle')
    } else if (this.unlocked) this.playCurrent()
  }
  unlock() {
    if (this.disposed) return
    this.unlocked = true
    if (this.current?.failed) this.assign(this.current, this.scene)
    if (this.enabled) this.playCurrent()
  }
  private playCurrent() {
    const slot = this.current
    if (!slot) {
      this.report('error')
      return
    }
    if (slot.pending) return
    if (slot.playing && !slot.audio.paused) {
      this.started(slot, this.generation)
      return
    }
    const token = ++slot.token,
      generation = this.generation
    slot.pending = true
    const valid = () =>
      !this.disposed &&
      slot.token === token &&
      generation === this.generation &&
      slot === this.current
    try {
      void Promise.resolve(slot.audio.play())
        .then(
          () => {
            if (!valid() || !this.enabled) return
            slot.playing = true
            this.report('playing')
            this.started(slot, generation)
          },
          (reason) => {
            if (!valid()) return
            this.failure(slot, reason)
          }
        )
        .finally(() => {
          if (slot.token === token) slot.pending = false
        })
    } catch (reason) {
      slot.pending = false
      this.failure(slot, reason)
    }
  }
  private started(slot: Slot, generation: number) {
    const old = this.outgoing
    if (old && !old.audio.paused) this.crossfade(old, slot, generation)
    else {
      slot.mix = 1
      this.levels()
      this.prepareNext()
    }
  }
  private failure(slot: Slot, reason: unknown) {
    if (this.disposed || slot !== this.current) return
    const blocked = (reason as Error | null)?.name === 'NotAllowedError'
    slot.failed = !blocked
    this.pause(slot)
    this.cancelFade()
    // Failure is explicit. Do not leave another area's song playing as fallback.
    if (this.outgoing) this.pause(this.outgoing)
    this.outgoing = undefined
    slot.mix = 1
    this.levels()
    this.report(blocked ? 'blocked' : 'error')
  }
  private crossfade(old: Slot, next: Slot, generation: number) {
    this.cancelFade()
    const started = performance.now()
    this.fade = setInterval(() => {
      if (this.disposed || generation !== this.generation || !this.enabled) {
        this.cancelFade()
        return
      }
      const progress = Math.max(0, Math.min(1, (performance.now() - started) / 400))
      old.mix = 1 - progress
      next.mix = progress
      this.levels()
      if (progress === 1) {
        this.pause(old)
        this.outgoing = undefined
        this.cancelFade()
        this.prepareNext()
      }
    }, 16)
  }
  private prepareNext() {
    if (this.disposed || !this.current) return
    const spare = this.slots.find((s) => s !== this.current)
    const next = this.preparedScene ?? defaultNextMusicScene(this.scene)
    if (spare && spare.scene !== next) this.assign(spare, next)
    this.roles()
  }
  private cancelFade() {
    clearInterval(this.fade)
    this.fade = undefined
  }
  dispose() {
    this.disposed = true
    this.generation++
    this.cancelFade()
    for (const s of this.slots) {
      this.pause(s)
      s.audio.removeEventListener?.('loadedmetadata', s.seek)
      s.audio.removeEventListener?.('error', s.error)
      s.audio.removeAttribute?.('src')
      s.audio.load?.()
      s.audio.remove?.()
    }
    this.slots = []
  }
}
