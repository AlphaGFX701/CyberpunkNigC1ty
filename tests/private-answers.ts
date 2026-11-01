import { readFileSync } from 'node:fs'

type ChapterKey = 'arun' | 'relay'
type Snapshot = { arun: { tasks: { solution: string }[] }; relay: { tasks: { solution: string }[] }; demo: { solution: string } }
const file = new URL('../output/private-cheatsheet/source.json', import.meta.url)
let snapshot: Snapshot
try {
  snapshot = JSON.parse(readFileSync(file, 'utf8')) as Snapshot
  if (snapshot.arun.tasks.length !== 8 || snapshot.relay.tasks.length !== 8)
    throw new Error('Expected eight private answers per chapter')
} catch {
  throw new Error('Full learning regressions require the private answer fixture: output/private-cheatsheet/source.json. Prepare the original local snapshot with the project owner; it is intentionally excluded from public Git and deployment. Do not restore answer fields in src/.')
}

/** Node/test-runner only. Never import this helper into the browser app or harness. */
export const privateAnswers = {
  arun: snapshot.arun.tasks.map((task) => task.solution),
  relay: snapshot.relay.tasks.map((task) => task.solution),
  demo: snapshot.demo.solution,
}
export function withPrivateAnswers<T>(chapter: ChapterKey, tasks: readonly T[]) {
  return tasks.map((task, index) => ({ ...task, solution: privateAnswers[chapter][index] }))
}
