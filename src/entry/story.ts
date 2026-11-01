// Compatibility export: case facts and opening now have one narrative owner.
export type { StoryShot, CinematicLayer } from '../narrative/case'
export { caseNarrative, titleComposition } from '../narrative/case'
import { caseNarrative } from '../narrative/case'
export const story = caseNarrative.opening
