import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRelay, relayScore, relayObjective } from '../src/relay/model.ts'
import { tasks as taskDefinitions, finalTask as finalDefinition, RELAY_RECORD } from '../src/relay/content.ts'
import { validateTask } from '../src/relay/validate.ts'
import { puzzles, validatePuzzle } from '../src/relay/puzzles.ts'

import { privateAnswers, withPrivateAnswers } from './private-answers.ts'
const tasks = withPrivateAnswers('relay', taskDefinitions)
const finalTask = { ...finalDefinition, solution: privateAnswers.relay[7] }

const memory = () => {
  const values = new Map<string, string>()
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value)
    },
  }
}
const enter = (relay: ReturnType<typeof createRelay>) => {
  relay.talkToOfficer()
  relay.collectClue('workorder')
  relay.collectClue('module')
  assert.equal(relay.startHack(), true)
}
const solveSeven = (relay: ReturnType<typeof createRelay>) => {
  enter(relay)
  tasks.forEach((task, index) => {
    assert.equal(relay.submitPuzzle(index, puzzles[index].solution).ok, true)
    assert.equal(relay.submitTask(index, task.solution).ok, true)
  })
}

test('public relay tasks have no canonical answers and preserve legacy help observations without reveal API', () => {
  assert.ok(taskDefinitions.every((task) => !Object.hasOwn(task, 'solution')))
  assert.equal(Object.hasOwn(finalDefinition, 'solution'), false)
  const storage = memory(), original = createRelay(storage)
  enter(original)
  const old = { ...original.get(), observations: original.get().observations.map((item, index) => ({ ...item, revealed: index === 0 })) }
  storage.values.set('techcare.chapter-relay.v1:guest:0', JSON.stringify(old))
  const restored = createRelay(storage)
  assert.equal(restored.get().observations[0].revealed, true)
  assert.equal('reveal' in restored, false)
  assert.equal(relayScore(restored.get()), 0)
})

test('relay has seven different minigame kinds and seven genuine short HTML repairs', () => {
  assert.equal(puzzles.length, 7)
  assert.equal(new Set(puzzles.map((p) => p.kind)).size, 7)
  tasks.forEach((task, index) => {
    assert.equal(validateTask(index, task.starter).ok, false, `${task.id}: broken starter`)
    assert.equal(validateTask(index, task.solution).ok, true, `${task.id}: solution`)
    assert.equal(
      validateTask(index, puzzles[index].scaffold).ok,
      false,
      `${task.id}: scaffold still needs writing`
    )
    assert.equal(validatePuzzle(index, puzzles[index].solution).ok, true)
    assert.equal(validatePuzzle(index, {}).ok, false)
  })
  assert.equal(validateTask(7, finalTask.starter).ok, false)
  assert.equal(validateTask(7, finalTask.solution).ok, true)
})
test('equivalent quotes, case and safe relative prefix accepted; actual nesting and target required', () => {
  assert.equal(validateTask(0, "<A HREF='./station.html'>แฟ้มสถานี</A>").ok, true)
  assert.equal(validateTask(1, '<a href=logs/arrival.html>บันทึกรับอุปกรณ์</a>').ok, true)
  assert.equal(validateTask(0, '<a src="station.html">แฟ้มสถานี</a>').ok, false)
  assert.equal(validateTask(1, '<a href="arrival.html">บันทึกรับอุปกรณ์</a>').ok, false)
  assert.equal(
    validateTask(2, tasks[2].solution.replace('id="after-theft"', 'id="other"')).ok,
    false
  )
  assert.equal(validateTask(2, tasks[2].solution + '<div id="after-theft"></div>').ok, false)
  assert.equal(validateTask(3, '<ul><li>RELAY-02</li><li>BLACKBOX-17</li></ul>').ok, true)
  assert.equal(validateTask(3, '<ul>BLACKBOX-17 RELAY-02</ul>').ok, false)
  assert.equal(validateTask(4, tasks[4].starter.replaceAll('ul', 'ol')).ok, false)
  assert.equal(
    validateTask(
      5,
      '<header><h1>บันทึก RELAY-02</h1><main><p>รายการส่งต่อ 03:21</p></main><footer><p>แหล่งข้อมูล: RELAY-02</p></footer></header>'
    ).ok,
    false
  )
  assert.equal(validateTask(6, '<section>' + tasks[6].starter + '</section>').ok, false)
})
test('script, forged comments and external navigation cannot satisfy a repair', () => {
  assert.equal(validateTask(0, '<!-- ' + tasks[0].solution + ' -->').ok, false)
  assert.equal(validateTask(0, tasks[0].solution + '<script>1</script>').ok, false)
  assert.equal(
    validateTask(0, tasks[0].solution + '<a href="https://example.com">อื่น</a>').ok,
    false
  )
  assert.equal(
    validateTask(7, finalTask.solution.replace('logs/original.html', 'javascript:alert(1)')).ok,
    false
  )
  assert.equal(
    validateTask(
      7,
      finalTask.solution.replace('logs/original.html', 'https://example.com/logs/original.html')
    ).ok,
    false
  )
  assert.equal(validateTask(0, '<a href="station.html" onclick="alert(1)">แฟ้มสถานี</a>').ok, false)
})
test('parser provides source line only when an actual syntax location is known', () => {
  assert.equal(validateTask(0, '<div>\n<a href="station.html">แฟ้มสถานี</div>').line, 2)
  assert.equal(validateTask(0, '<a>แฟ้มสถานี</a>').line, undefined)
})
test('puzzles validate values, exact fields and ordered arrays rather than client passed flags', () => {
  assert.equal(validatePuzzle(0, { passed: true }).ok, false)
  assert.equal(validatePuzzle(0, Object.create(puzzles[0].solution)).ok, false)
  assert.equal(validatePuzzle(0, { ...puzzles[0].solution, extra: 'value' }).ok, false)
  assert.equal(validatePuzzle(1, { path: ['arrival.html', 'logs'] }).ok, false)
  assert.equal(validatePuzzle(3, { items: ['blackbox', 'blackbox'] }).ok, false)
  assert.equal(validatePuzzle(3, { items: ['relay', 'blackbox'] }).ok, true)
  assert.equal(validatePuzzle(4, { order: ['connect', 'arrival', 'forward'] }).ok, false)
  assert.equal(
    validatePuzzle(6, { transmissions: ['forward', 'connect'], notes: ['unit', 'omitted'] }).ok,
    true
  )
})
test('physical investigation gates entering relay and puzzle gates each code submission', () => {
  const relay = createRelay(memory())
  assert.equal(relay.collectClue('module'), false)
  assert.equal(relay.startHack(), false)
  assert.equal(relay.markStory('conclusion'), false)
  relay.markStory('departure')
  relay.markStory('arrival')
  assert.equal(relay.get().entered, false)
  relay.talkToOfficer()
  relay.collectClue('workorder')
  relay.collectClue('workorder')
  assert.equal(relay.get().clues.length, 1)
  assert.equal(relay.canHack(), false)
  relay.collectClue('module')
  assert.equal(relay.startHack(), true)
  assert.equal(relay.submitTask(0, tasks[0].solution).ok, false)
  assert.equal(relay.submitPuzzle(1, puzzles[1].solution).ok, false)
  assert.equal(relay.submitImage(finalTask.solution).ok, false)
  assert.equal(relay.submitPuzzle(0, puzzles[0].solution).ok, true)
  assert.equal(relay.canEditTask(0), true)
})
test('check-only and solved puzzle grant no points; hints/retries do not reduce earned score', () => {
  const relay = createRelay(memory())
  enter(relay)
  relay.submitPuzzle(0, puzzles[0].solution)
  assert.equal(relayScore(relay.get()), 0)
  assert.equal(relay.checkTask(0, tasks[0].solution).ok, true)
  assert.equal(relay.get().observations[0].attempts, 0)
  assert.equal(relay.get().completed.length, 0)
  relay.useHint(0)
  relay.submitTask(0, tasks[0].starter)
  relay.submitTask(0, tasks[0].solution)
  assert.equal(relayScore(relay.get()), 10)
  assert.deepEqual(relay.get().observations[0], { attempts: 2, usedHint: true, revealed: false })
  relay.submitPuzzle(0, puzzles[0].solution)
  relay.submitTask(0, tasks[0].solution)
  assert.equal(relayScore(relay.get()), 10)
})
test('complete relay awards 70+30 and permits conclusion only after genuine final repair', () => {
  const relay = createRelay(memory())
  solveSeven(relay)
  assert.equal(relay.canRecoverImage(), true)
  assert.equal(relayScore(relay.get()), 70)
  assert.equal(relay.checkTask(7, finalTask.solution).ok, true)
  assert.equal(relay.get().finalRecovered, false)
  relay.useHint(7)
  assert.equal(relay.submitImage(finalTask.solution).ok, true)
  assert.equal(relayScore(relay.get()), 100)
  assert.equal(relay.markStory('conclusion'), true)
  assert.equal(relay.get().conclusionSeen, true)
  assert.match(relayObjective(relay.get()), /ศูนย์ควบคุม/)
  assert.equal(RELAY_RECORD.destination, 'ศูนย์ควบคุม')
})
test('local relay persistence is separate per account, reset generation and first chapter', () => {
  const storage = memory(),
    relay = createRelay(storage)
  storage.values.set('techcare.chapter-one.v1:A:0', 'original-arun-save')
  relay.activateOwner('A', 0)
  solveSeven(relay)
  relay.submitImage(finalTask.solution)
  relay.activateOwner('B', 0)
  assert.equal(relayScore(relay.get()), 0)
  relay.activateOwner('A', 0)
  assert.equal(relayScore(relay.get()), 100)
  relay.activateOwner('A', 1)
  assert.equal(relayScore(relay.get()), 0)
  assert.equal(storage.values.get('techcare.chapter-one.v1:A:0'), 'original-arun-save')
  relay.activateOwner('A', 0)
  assert.equal(relayScore(relay.get()), 100)
  relay.reset()
  assert.equal(relayScore(relay.get()), 0)
  assert.equal(relay.get().departureSeen, false)
})
test('refresh restores earned puzzle/code state, rejects malformed gates and handles unavailable storage', () => {
  const storage = memory(),
    relay = createRelay(storage)
  enter(relay)
  relay.submitPuzzle(0, puzzles[0].solution)
  assert.equal(createRelay(storage).canEditTask(0), true)
  const value = { ...relay.get(), completed: [0, 2] }
  storage.values.set('techcare.chapter-relay.v1:guest:0', JSON.stringify(value))
  const invalid = createRelay(storage)
  assert.equal(invalid.get().storageWarning, true)
  assert.equal(relayScore(invalid.get()), 0)
  const broken = createRelay({
    getItem: () => {
      throw new Error('blocked')
    },
    setItem: () => {
      throw new Error('blocked')
    },
  })
  enter(broken)
  assert.equal(broken.get().storageWarning, true)
  assert.equal(broken.canOpenTask(0), true)
})
