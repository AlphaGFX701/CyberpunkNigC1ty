import { drawChapterStreet, chapterTextureManifest } from '../chapter/ChapterWorld'
import { drawRelayStreet, relayTextureManifest } from '../relay/RelayWorld'
import { streetSize } from '../chapter/layout'
import { relaySize } from '../relay/layout'

/** Two field adapters share the Phaser renderer and its input/lifecycle. */
export const fieldScenes = {
  arun: { size: streetSize, draw: drawChapterStreet },
  relay: { size: relaySize, draw: drawRelayStreet },
} as const
export const fieldTextures = { ...chapterTextureManifest, ...relayTextureManifest }
