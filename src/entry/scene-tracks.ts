/** Semantic scene identity is separate from a filename and from entry UI state. */
export type MusicScene = 'entry' | 'story' | 'game' | 'arun' | 'relay' | 'hack'
export type EntryScreen = 'access' | 'title' | 'story' | 'game' | 'account'
export const sceneTracks = {
  entry: { src: '/assets/music/concrete-tears.mp3', cue: 3 },
  story: { src: '/assets/music/rain-over-glass-monoliths.mp3', cue: 0 },
  game: { src: '/assets/music/midnight-protocol.mp3', cue: 0 },
  arun: { src: '/assets/music/midnight-at-the-terminal.mp3', cue: 0 },
  relay: { src: '/assets/music/terminal-watch.mp3', cue: 0 },
  hack: { src: '/assets/music/the-glass-key.mp3', cue: 0 },
} as const satisfies Record<MusicScene, { src: string; cue: number }>

export function resolveMusicScene(context: {
  screen: EntryScreen
  view: 'map' | 'street' | 'device' | 'boss'
  activeChapter: 'arun' | 'relay'
  connectionRunning: boolean
}): MusicScene {
  if (context.screen === 'story') return 'story'
  if (context.screen !== 'game') return 'entry'
  if (context.view === 'map') return 'game'
  if (context.connectionRunning || context.view === 'device' || context.view === 'boss')
    return 'hack'
  return context.activeChapter
}

/** A map selection can replace these defaults without starting another transport. */
export function defaultNextMusicScene(scene: MusicScene): MusicScene {
  if (scene === 'entry') return 'story'
  if (scene === 'story') return 'game'
  if (scene === 'game') return 'arun'
  if (scene === 'arun' || scene === 'relay') return 'hack'
  return 'game'
}
