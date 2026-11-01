import { tutorial } from './model.ts'
import { getTutorialPrompt } from './content.ts'

/** Both DOM and world adapters consult the same active-step permission. */
export function tutorialAllows(target: string): boolean {
  const state = tutorial.get()
  if (!state.step) return true
  return getTutorialPrompt(state.step).targets.some((item) => item === target)
}
export function tutorialCanMove() {
  return tutorialAllows('world-move')
}
let walkRevision = -1,
  walked = 0
export function recordTutorialWalk(distance: number) {
  const state = tutorial.get()
  if (state.step !== 'street-walk') return
  if (walkRevision !== state.revision) {
    walkRevision = state.revision
    walked = 0
  }
  walked += Math.max(0, Math.min(15, distance))
  if (walked >= 40) tutorial.notify('walked')
}
