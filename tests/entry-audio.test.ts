import { test } from 'node:test'
import assert from 'node:assert/strict'
import { EntryAudio } from '../src/entry/audio.ts'

test('music waits for player gesture and shares one player across menu transitions', async () => {
  const players: FakeAudio[] = []
  class FakeAudio {
    volume = 1
    loop = false
    preload = ''
    paused = true
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
    engine.setMusicActive(true)
    assert.equal(
      players.reduce((n, p) => n + p.playCount, 0),
      0
    )
    await engine.unlock()
    assert.equal(players.length, 1)
    assert.equal(players[0].src, '/assets/theme.wav')
    assert.equal(players[0].volume, 0.3)
    assert.equal(players[0].paused, false)
    assert.ok(statuses.includes('playing'))
    engine.setMusicActive(false)
    assert.equal(players[0].paused, true)
    engine.setMusicActive(true)
    await Promise.resolve()
    assert.equal(players.length, 1)
    engine.setLevels(0, 0)
    assert.equal(players[0].volume, 0)
    engine.dispose()
    assert.equal(players[0].paused, true)
    engine.setMusicActive(true)
    assert.equal(players[0].paused, true)
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
      sources.every((source) => Math.abs(source.stops[0]! - source.starts[0] - 0.022) < 0.00001)
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
