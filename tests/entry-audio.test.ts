import { test } from 'node:test'
import assert from 'node:assert/strict'
import { EntryAudio } from '../src/entry/audio.ts'

function musicEnvironment(
  play: (audio: { src: string }) => Promise<void> = () => Promise.resolve()
) {
  const players: MusicStub[] = []
  class MusicStub {
    src: string
    paused = true
    volume = 1
    loop = false
    preload = ''
    currentTime = 0
    readyState = 4
    constructor(src = '') {
      this.src = src
      players.push(this)
    }
    play() {
      this.paused = false
      return play(this)
    }
    pause() {
      this.paused = true
    }
    load() {}
    removeAttribute() {}
    setAttribute() {}
    addEventListener() {}
    removeEventListener() {}
  }
  return { players, MusicStub }
}

async function waitForMusic(check: () => boolean) {
  const deadline = performance.now() + 2200
  while (!check() && performance.now() < deadline)
    await new Promise((resolve) => setTimeout(resolve, 15))
  assert.ok(check(), 'music reached its bounded settled state')
}

test('new area tracks preload without playing; prepare cannot steal a fading slot', async () => {
  const music = musicEnvironment()
  const original = globalThis.Audio
  Object.assign(globalThis, { Audio: music.MusicStub })
  const engine = new EntryAudio()
  try {
    engine.setMusicActive(true)
    await engine.unlock()
    await Promise.resolve()
    engine.prepareMusicScene('relay')
    const standby = music.players.find((p) => p.src.endsWith('/terminal-watch.mp3'))!
    assert.ok(standby)
    assert.equal(standby.paused, true)
    assert.equal(standby.currentTime, 0)
    engine.setMusicScene('relay')
    await Promise.resolve()
    engine.prepareMusicScene('hack')
    assert.ok(
      music.players.some((p) => p.src.endsWith('/concrete-tears.mp3')),
      'outgoing stays intact through fade'
    )
    await waitForMusic(
      () =>
        music.players.filter((p) => !p.paused).length === 1 &&
        music.players.some((p) => p.src.endsWith('/the-glass-key.mp3'))
    )
    assert.equal(music.players.find((p) => !p.paused)!.src, '/assets/music/terminal-watch.mp3')
    assert.equal(music.players.find((p) => p.src.endsWith('/the-glass-key.mp3'))!.paused, true)
    engine.setMusicScene('hack')
    await waitForMusic(
      () =>
        music.players.filter((p) => !p.paused).length === 1 &&
        music.players.find((p) => !p.paused)?.src.endsWith('/the-glass-key.mp3') === true
    )
    assert.equal(music.players.length, 2)
  } finally {
    engine.dispose()
    Object.assign(globalThis, { Audio: original })
  }
})

test('reversing a fade keeps the surviving track audible and same-area updates do not seek', async () => {
  const music = musicEnvironment()
  const original = globalThis.Audio
  Object.assign(globalThis, { Audio: music.MusicStub })
  const engine = new EntryAudio()
  try {
    engine.setMusicScene('arun')
    engine.setMusicActive(true)
    await engine.unlock()
    await Promise.resolve()
    const arun = music.players.find((p) => p.src.endsWith('/midnight-at-the-terminal.mp3'))!
    arun.currentTime = 17
    engine.setMusicScene('relay')
    await Promise.resolve()
    engine.setMusicScene('arun')
    await waitForMusic(() => music.players.filter((p) => !p.paused).length === 1 && arun.volume > 0)
    assert.equal(arun.currentTime, 17, 'reversing to the existing playing source must not reset it')
    engine.setMusicScene('arun')
    engine.setMusicActive(true)
    engine.setLevels(0, 0)
    assert.equal(arun.currentTime, 17)
    assert.ok(music.players.every((p) => p.volume === 0))
    engine.setMusicActive(false)
    engine.setMusicActive(true)
    await Promise.resolve()
    assert.equal(arun.currentTime, 17, 'settings and active toggles resume rather than seek')
    assert.equal(music.players.length, 2)
  } finally {
    engine.dispose()
    Object.assign(globalThis, { Audio: original })
  }
})

test('a failed area song stops the previous area instead of using it as a wrong-scene fallback', async () => {
  const music = musicEnvironment((audio) =>
    audio.src.endsWith('/terminal-watch.mp3')
      ? Promise.reject(new Error('missing file'))
      : Promise.resolve()
  )
  const original = globalThis.Audio
  Object.assign(globalThis, { Audio: music.MusicStub })
  const statuses: string[] = []
  const engine = new EntryAudio((s) => statuses.push(s.music))
  try {
    engine.setMusicActive(true)
    await engine.unlock()
    await Promise.resolve()
    engine.setMusicScene('relay')
    await waitForMusic(() => statuses.at(-1) === 'error')
    assert.ok(music.players.every((p) => p.paused))
    engine.setMusicScene('hack')
    await waitForMusic(() => statuses.at(-1) === 'playing')
    assert.equal(music.players.find((p) => !p.paused)?.src, '/assets/music/the-glass-key.mp3')
    assert.equal(music.players.length, 2)
  } finally {
    engine.dispose()
    Object.assign(globalThis, { Audio: original })
  }
})

test('a pending music request never delays effects readiness or dialogue blips', async () => {
  const pending: (() => void)[] = []
  const music = musicEnvironment(() => new Promise<void>((resolve) => pending.push(resolve)))
  const effects = talkEnvironment()
  const originalAudio = globalThis.Audio,
    originalContext = globalThis.AudioContext
  Object.assign(globalThis, { Audio: music.MusicStub, AudioContext: effects.FakeContext })
  const engine = new EntryAudio()
  try {
    engine.setMusicScene('entry')
    engine.setMusicActive(true)
    let ready = false
    void engine.unlock().then(() => {
      ready = true
    })
    await new Promise((resolve) => setTimeout(resolve, 20))
    assert.equal(ready, true, 'unlock resolves for SFX even while music.play is pending')
    engine.playTalkBlip()
    assert.equal(effects.sources.length, 1)
    engine.setMusicActive(false)
    pending.forEach((resolve) => resolve())
    await Promise.resolve()
    assert.ok(
      music.players.every((player) => player.paused),
      'late music completion cannot resume a paused scene'
    )
  } finally {
    engine.dispose()
    pending.forEach((resolve) => resolve())
    Object.assign(globalThis, { Audio: originalAudio, AudioContext: originalContext })
  }
})

test('an obsolete music play result cannot replace the newest scene track', async () => {
  let completeOld: (() => void) | undefined
  const music = musicEnvironment((audio) =>
    audio.src.includes('concrete-tears')
      ? new Promise<void>((resolve) => {
          completeOld = resolve
        })
      : Promise.resolve()
  )
  const original = globalThis.Audio
  Object.assign(globalThis, { Audio: music.MusicStub })
  const statuses: string[] = []
  const engine = new EntryAudio((status) => statuses.push(status.music))
  try {
    engine.setMusicScene('entry')
    engine.setMusicActive(true)
    await engine.unlock()
    engine.setMusicScene('story')
    engine.setMusicScene('game')
    completeOld?.()
    // Wait for the observable fade result rather than assuming its interval gets
    // a CPU slice within 50ms while browser/WebGL checks run in parallel.
    const deadline = performance.now() + 2000
    do {
      await new Promise((resolve) => setTimeout(resolve, 20))
    } while (
      music.players.filter((player) => !player.paused).length !== 1 &&
      performance.now() < deadline
    )
    const active = music.players.filter((player) => !player.paused)
    assert.equal(active.length, 1)
    assert.equal(active[0].src, '/assets/music/midnight-protocol.mp3')
    assert.equal(statuses.at(-1), 'playing')
    assert.equal(music.players.length, 2)
  } finally {
    engine.dispose()
    completeOld?.()
    Object.assign(globalThis, { Audio: original })
  }
})

test('a fresh gesture retries a rejected scene track and muting during its next transition stays silent', async () => {
  let entryAttempts = 0
  const music = musicEnvironment((audio) => {
    if (audio.src.endsWith('/concrete-tears.mp3') && ++entryAttempts === 1)
      return Promise.reject(new Error('temporary media failure'))
    return Promise.resolve()
  })
  const original = globalThis.Audio
  Object.assign(globalThis, { Audio: music.MusicStub })
  const statuses: string[] = []
  const engine = new EntryAudio((status) => statuses.push(status.music))
  try {
    engine.setLevels(0.4, 0.6)
    engine.setMusicScene('entry')
    engine.setMusicActive(true)
    await engine.unlock()
    await new Promise((resolve) => setTimeout(resolve, 0))
    assert.equal(statuses.at(-1), 'error')
    await engine.unlock()
    await new Promise((resolve) => setTimeout(resolve, 0))
    assert.equal(entryAttempts, 2, 'a new player gesture retries the failed current source')
    assert.equal(statuses.at(-1), 'playing')
    const entry = music.players.find((player) => player.src.endsWith('/concrete-tears.mp3'))!
    assert.equal(entry.currentTime, 3)
    assert.equal(entry.paused, false)
    assert.equal(entry.volume, 0.4)

    engine.setMusicScene('story')
    await new Promise((resolve) => setTimeout(resolve, 40))
    assert.equal(
      music.players.filter((player) => !player.paused).length,
      2,
      'transition overlaps only the two bounded slots'
    )
    engine.setLevels(0, 0)
    assert.ok(music.players.every((player) => player.volume === 0))
    await new Promise((resolve) => setTimeout(resolve, 450))
    assert.ok(
      music.players.every((player) => player.volume === 0),
      'fade ticks cannot restore volume after mute'
    )
    const active = music.players.filter((player) => !player.paused)
    assert.equal(active.length, 1)
    assert.equal(active[0].src, '/assets/music/rain-over-glass-monoliths.mp3')
    assert.equal(music.players.length, 2)
  } finally {
    engine.dispose()
    Object.assign(globalThis, { Audio: original })
  }
})

test('scene music waits for a gesture, uses the three approved tracks and never creates more than two transports', async () => {
  const players: FakeAudio[] = []
  class FakeAudio {
    volume = 1
    loop = false
    preload = ''
    paused = true
    currentTime = 0
    readyState = 4
    playCount = 0
    src: string
    constructor(src: string) {
      this.src = src
      players.push(this)
    }
    play() {
      this.paused = false
      this.playCount++
      return Promise.resolve()
    }
    pause() {
      this.paused = true
    }
    removeAttribute() {}
    load() {}
  }
  const original = globalThis.Audio
  Object.assign(globalThis, { Audio: FakeAudio })
  try {
    const statuses: string[] = []
    const engine = new EntryAudio((status) => statuses.push(status.music))
    engine.setLevels(0.3, 0.5)
    engine.setMusicScene('entry')
    engine.setMusicActive(true)
    assert.equal(
      players.reduce((n, p) => n + p.playCount, 0),
      0
    )
    await engine.unlock()
    await new Promise((resolve) => setTimeout(resolve, 450))
    assert.equal(players.length, 2)
    let active = players.filter((player) => !player.paused)
    assert.equal(active.length, 1)
    assert.equal(active[0].src, '/assets/music/concrete-tears.mp3')
    assert.equal(active[0].currentTime, 3)
    assert.equal(active[0].volume, 0.3)
    assert.ok(statuses.includes('playing'))
    for (const [scene, path] of [
      ['story', '/assets/music/rain-over-glass-monoliths.mp3'],
      ['game', '/assets/music/midnight-protocol.mp3'],
      ['entry', '/assets/music/concrete-tears.mp3'],
    ] as const) {
      engine.setMusicScene(scene)
      await new Promise((resolve) => setTimeout(resolve, 450))
      active = players.filter((player) => !player.paused)
      assert.equal(active.length, 1, `one settled track for ${scene}`)
      assert.equal(active[0].src, path)
      assert.equal(players.length, 2, 'screen changes reuse bounded transport slots')
    }
    engine.setMusicActive(false)
    assert.ok(players.every((player) => player.paused))
    engine.setMusicActive(true)
    await Promise.resolve()
    assert.equal(players.length, 2)
    engine.setLevels(0, 0)
    assert.ok(players.every((player) => player.volume === 0))
    engine.dispose()
    assert.ok(players.every((player) => player.paused))
    engine.setMusicActive(true)
    assert.ok(players.every((player) => player.paused))
  } finally {
    Object.assign(globalThis, { Audio: original })
  }
})

test('unsupported audio and blocked playback leave controls usable', async () => {
  const original = globalThis.Audio
  Object.assign(globalThis, { Audio: undefined })
  try {
    const statuses: string[] = []
    const unsupported = new EntryAudio((status) => statuses.push(status.music))
    await unsupported.unlock()
    assert.ok(statuses.includes('error'))
    unsupported.setLevels(1, 1)
    unsupported.setMusicActive(true)
    unsupported.playCue('alarm')()
    unsupported.stopCues()
    unsupported.dispose()
    class BlockedAudio {
      volume = 1
      paused = true
      play() {
        return Promise.reject(
          Object.assign(new Error('Playback needs a gesture'), { name: 'NotAllowedError' })
        )
      }
      pause() {}
      removeAttribute() {}
      load() {}
    }
    Object.assign(globalThis, { Audio: BlockedAudio })
    const blocked = new EntryAudio((status) => statuses.push(status.music))
    blocked.setMusicActive(true)
    await blocked.unlock()
    assert.ok(statuses.includes('blocked'))
    blocked.dispose()
    await Promise.resolve()
  } finally {
    Object.assign(globalThis, { Audio: original })
  }
})

test('skipping a shot cancels its scheduled effects and muting also affects sounds already playing', async () => {
  const sources: { stopped: number }[] = []
  const gains: { value: number }[] = []
  const parameter = () => ({
    value: 0,
    setValueAtTime() {},
    linearRampToValueAtTime() {},
    exponentialRampToValueAtTime() {},
  })
  const node = () => ({ connect() {}, disconnect() {} })
  class FakeContext {
    state = 'running'
    sampleRate = 8000
    currentTime = 0
    destination = node()
    createGain() {
      const gain = parameter()
      gains.push(gain)
      return { ...node(), gain }
    }
    createOscillator() {
      const source = {
        ...node(),
        frequency: parameter(),
        type: '',
        onended: null,
        stopped: 0,
        start() {},
        stop() {
          this.stopped++
        },
      }
      sources.push(source)
      return source
    }
    createBufferSource() {
      const source = {
        ...node(),
        buffer: null,
        onended: null,
        stopped: 0,
        start() {},
        stop() {
          this.stopped++
        },
      }
      sources.push(source)
      return source
    }
    createBiquadFilter() {
      return { ...node(), frequency: parameter(), type: '' }
    }
    createBuffer(_channels: number, count: number) {
      return {
        getChannelData() {
          return new Float32Array(count)
        },
      }
    }
    close() {
      this.state = 'closed'
      return Promise.resolve()
    }
  }
  const originalAudio = globalThis.Audio,
    originalContext = globalThis.AudioContext
  Object.assign(globalThis, { Audio: undefined, AudioContext: FakeContext })
  try {
    const engine = new EntryAudio()
    engine.playCue('confirm')
    assert.equal(sources.length, 0)
    await engine.unlock()
    const cancelRain = engine.playCue('rain')
    engine.playCue('connect')
    assert.ok(sources.length > 1)
    engine.setLevels(0, 0)
    assert.equal(gains[0].value, 0)
    const count = sources.length
    engine.playCue('alarm')
    assert.equal(sources.length, count)
    cancelRain()
    engine.stopCues()
    assert.ok(sources.every((source) => source.stopped === 2))
    cancelRain()
    engine.stopCues()
    assert.ok(sources.every((source) => source.stopped === 2))
    engine.dispose()
  } finally {
    Object.assign(globalThis, { Audio: originalAudio, AudioContext: originalContext })
  }
})

function talkEnvironment(blockResume = false) {
  const sources: {
    frequency: { value: number }
    type: string
    onended: (() => void) | null
    starts: number[]
    stops: (number | undefined)[]
    disconnected: number
  }[] = []
  const gains: {
    gain: {
      value: number
      calls: { kind: string; value: number; time: number }[]
    }
    destination: unknown
    disconnected: number
  }[] = []
  const contexts: FakeContext[] = []
  const parameter = () => ({
    value: 0,
    calls: [] as { kind: string; value: number; time: number }[],
    setValueAtTime(value: number, time: number) {
      this.calls.push({ kind: 'set', value, time })
    },
    linearRampToValueAtTime(value: number, time: number) {
      this.calls.push({ kind: 'linear', value, time })
    },
    exponentialRampToValueAtTime(value: number, time: number) {
      this.calls.push({ kind: 'exponential', value, time })
    },
  })
  class FakeContext {
    state = blockResume ? 'suspended' : 'running'
    currentTime = 0
    destination = {}
    constructor() {
      contexts.push(this)
    }
    createGain() {
      const gain = {
        gain: parameter(),
        destination: null as unknown,
        disconnected: 0,
        connect(destination: unknown) {
          this.destination = destination
        },
        disconnect() {
          this.disconnected++
        },
      }
      gains.push(gain)
      return gain
    }
    createOscillator() {
      const source = {
        frequency: parameter(),
        type: '',
        onended: null as (() => void) | null,
        starts: [] as number[],
        stops: [] as (number | undefined)[],
        disconnected: 0,
        connect() {},
        disconnect() {
          this.disconnected++
        },
        start(at: number) {
          this.starts.push(at)
        },
        stop(at?: number) {
          this.stops.push(at)
        },
      }
      sources.push(source)
      return source
    }
    resume() {
      return Promise.reject(new Error('autoplay denied'))
    }
    close() {
      this.state = 'closed'
      return Promise.resolve()
    }
  }
  return { sources, gains, contexts, FakeContext }
}

test('talk blips use one effects bus, remain short and emit at most eight times per second', async () => {
  const environment = talkEnvironment()
  const originalAudio = globalThis.Audio,
    originalContext = globalThis.AudioContext
  Object.assign(globalThis, { Audio: undefined, AudioContext: environment.FakeContext })
  const engine = new EntryAudio()
  try {
    engine.playTalkBlip()
    assert.equal(environment.contexts.length, 0, 'typing cannot unlock audio itself')
    await engine.unlock()
    await engine.unlock()
    const { contexts, sources, gains } = environment
    for (let i = 0; i < 100; i++) {
      contexts[0].currentTime = i / 100
      engine.playTalkBlip()
    }
    assert.equal(contexts.length, 1)
    assert.equal(sources.length, 8)
    assert.equal(new Set(sources.map((source) => source.frequency.value)).size, 3)
    assert.ok(sources.every((source) => source.type === 'triangle'))
    assert.ok(
      sources.every((source) => Math.abs(source.stops[0]! - source.starts[0] - 0.052) < 0.00001)
    )
    assert.ok(gains.slice(1).every((gain) => gain.destination === gains[0]))
    assert.ok(
      gains
        .slice(1)
        .every((gain) => gain.gain.calls[0].value === 0 && gain.gain.calls.at(-1)?.value === 0.0001)
    )
    engine.setLevels(0.4, 0)
    contexts[0].currentTime = 2
    engine.playTalkBlip()
    assert.equal(sources.length, 8)
    assert.equal(gains[0].gain.value, 0, 'muting controls the shared bus, including active blips')
  } finally {
    engine.dispose()
    Object.assign(globalThis, { Audio: originalAudio, AudioContext: originalContext })
  }
})

test('a skipped line, natural ending and disposal clean up talk nodes without duplicate cancellation', async () => {
  const environment = talkEnvironment()
  const originalAudio = globalThis.Audio,
    originalContext = globalThis.AudioContext
  Object.assign(globalThis, { Audio: undefined, AudioContext: environment.FakeContext })
  const engine = new EntryAudio()
  try {
    await engine.unlock()
    const cancel = engine.playTalkBlip()
    cancel()
    cancel()
    engine.stopCues()
    assert.equal(environment.sources[0].stops.length, 2)
    assert.equal(environment.sources[0].disconnected, 1)
    environment.contexts[0].currentTime = 1
    engine.playTalkBlip()
    environment.sources[1].onended?.()
    engine.stopCues()
    assert.equal(environment.sources[1].disconnected, 1)
    environment.contexts[0].currentTime = 2
    engine.playTalkBlip()
    engine.dispose()
    assert.equal(environment.sources[2].disconnected, 1)
    engine.playTalkBlip()
    assert.equal(environment.sources.length, 3)
    assert.ok(environment.gains.every((gain) => gain.disconnected === 1))
  } finally {
    engine.dispose()
    Object.assign(globalThis, { Audio: originalAudio, AudioContext: originalContext })
  }
})

test('blocked and unsupported WebAudio never prevent advancing dialogue', async () => {
  const environment = talkEnvironment(true)
  const originalAudio = globalThis.Audio,
    originalContext = globalThis.AudioContext
  Object.assign(globalThis, { Audio: undefined, AudioContext: environment.FakeContext })
  const engine = new EntryAudio()
  try {
    await engine.unlock()
    assert.doesNotThrow(() => engine.playTalkBlip()())
    assert.equal(environment.sources.length, 0)
    engine.dispose()
    Object.assign(globalThis, { AudioContext: undefined })
    const unsupported = new EntryAudio()
    await unsupported.unlock()
    assert.doesNotThrow(() => unsupported.playTalkBlip()())
    unsupported.dispose()
  } finally {
    engine.dispose()
    Object.assign(globalThis, { Audio: originalAudio, AudioContext: originalContext })
  }
})

test('full-line dialogue emits an audible bounded Kin or Arun burst and cancels on departure', async () => {
  const environment = talkEnvironment()
  const originalAudio = globalThis.Audio,
    originalContext = globalThis.AudioContext
  Object.assign(globalThis, { Audio: undefined, AudioContext: environment.FakeContext })
  const engine = new EntryAudio()
  try {
    await engine.unlock()
    const cancel = engine.playTalkLine('คินตรวจเครื่องกล้องก่อน เดี๋ยวหลักฐานหนีไปอีก', 'kin')
    assert.equal(
      environment.sources.length,
      1,
      'a full visible line starts its voice effect immediately'
    )
    const peak = environment.gains[1].gain.calls.find((call) => call.kind === 'linear')!.value
    assert.ok(peak >= 0.1, 'the short voice is not buried by normal music')
    cancel()
    environment.contexts[0].currentTime = 1
    await new Promise((resolve) => setTimeout(resolve, 180))
    assert.equal(environment.sources.length, 1, 'leaving the dialogue cancels pending syllables')
    engine.playTalkLine('เครื่องอยู่หลังร้าน เดินดูเองเลย', 'arun')()
    assert.ok(
      environment.sources[1].frequency.value < environment.sources[0].frequency.value,
      'Arun has a distinct lower tone'
    )
    engine.setLevels(0.35, 0)
    environment.contexts[0].currentTime = 2
    engine.playTalkLine('ต้องเงียบเมื่อปิดเอฟเฟกต์', 'kin')
    assert.equal(environment.sources.length, 2)
  } finally {
    engine.dispose()
    Object.assign(globalThis, { Audio: originalAudio, AudioContext: originalContext })
  }
})
