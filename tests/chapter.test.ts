import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  createChapter,
  chapterScore,
  chapterObjective,
  tasks as taskDefinitions,
  validateTask,
  validateImage,
} from '../src/chapter/model.ts'
import { puzzles, validatePuzzle } from '../src/chapter/puzzles.ts'
import { finalTask as publicFinalTask } from '../src/chapter/content.ts'

import { privateAnswers, withPrivateAnswers } from './private-answers.ts'
const tasks = withPrivateAnswers('arun', taskDefinitions)

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
const enter = (chapter: ReturnType<typeof createChapter>) => {
  chapter.talkToArun()
  chapter.collectClue('receipt')
  chapter.collectClue('relay')
  assert.equal(chapter.startHack(), true)
}

test('public Arun tasks have no canonical answers and legacy revealed history survives without a reveal API', () => {
  assert.ok(taskDefinitions.every((task) => !Object.hasOwn(task, 'solution')))
  assert.equal(Object.hasOwn(publicFinalTask, 'solution'), false)
  const storage = memory(), original = createChapter(storage)
  enter(original)
  const old = { ...original.get(), observations: original.get().observations.map((item, index) => ({ ...item, revealed: index === 0 })) }
  storage.values.set('techcare.chapter-one.v1:guest:0', JSON.stringify(old))
  const restored = createChapter(storage)
  assert.equal(restored.get().observations[0].revealed, true)
  assert.equal('reveal' in restored, false)
  assert.equal(chapterScore(restored.get()), 0)
})

test('all seven missions reject the broken starter and accept their own distinct solutions', () => {
  assert.equal(new Set(tasks.map((task) => task.id)).size, 7)
  tasks.forEach((task, index) => {
    assert.equal(validateTask(index, task.starter).ok, false, `${task.id} starter`)
    assert.equal(validateTask(index, task.solution).ok, true, `${task.id} solution`)
  })
})

test('equivalent HTML spelling and attribute syntax pass without accepting reversed nesting', () => {
  assert.equal(validateTask(0, '<HTML>\n<BODY><P>ร้านอรุณเปิดแล้ว</P></BODY></HTML>').ok, true)
  assert.equal(validateTask(1, ' INDEX.HTM ').ok, true)
  assert.equal(validateTask(1, 'index.html.txt').ok, false)
  assert.equal(
    validateTask(
      2,
      '<!-- repaired -->\n<!doctype HTML><HTML><BODY><p>CAM-07 พร้อมตรวจ</p></BODY></HTML>'
    ).ok,
    true
  )
  assert.equal(validateTask(3, '<P class="note"><STRONG>ลายเซ็นหน่วยเก่า</STRONG></P>').ok, true)
  assert.equal(validateTask(3, '<p><strong>ลายเซ็นหน่วยเก่า</p></strong>').ok, false)
  assert.equal(
    validateTask(4, "<HTML LANG='th-TH'><BODY><P>บันทึกการขนย้าย</P></BODY></HTML>").ok,
    true
  )
  assert.equal(validateTask(4, '<html lang=th><body><p>บันทึกการขนย้าย</p></body></html>').ok, true)
  assert.equal(
    validateTask(5, '<H1 class="main">แฟ้ม BLACKBOX</H1>\n<H2>เส้นทางขนย้าย</H2>').ok,
    true
  )
  assert.equal(validateTask(5, '<h2>เส้นทางขนย้าย</h2><h1>แฟ้ม BLACKBOX</h1>').ok, false)
  assert.equal(validateTask(6, '<p>รถออกเวลา 03:12</p>\n<p>มุ่งหน้าไปสถานีสื่อสาร</p>').ok, true)
})

test('comments, head content, text masquerading as markup and script do not satisfy tasks', () => {
  assert.equal(
    validateTask(0, '<html><head><p>ร้านอรุณเปิดแล้ว</p></head><body></body></html>').ok,
    false
  )
  assert.equal(
    validateTask(2, '<html><body><p>CAM-07 พร้อมตรวจ</p></body></html><!-- <!DOCTYPE html> -->').ok,
    false
  )
  assert.equal(validateTask(3, '<!-- <p><strong>ลายเซ็นหน่วยเก่า</strong></p> -->').ok, false)
  assert.equal(
    validateTask(4, '<html lang="en" title="lang=th"><body><p>บันทึกการขนย้าย</p></body></html>')
      .ok,
    false
  )
  assert.equal(
    validateTask(5, '<h1>แฟ้ม BLACKBOX</h1><h2>เส้นทางขนย้าย</h2><script>alert(1)</script>').ok,
    false
  )
  assert.equal(validateTask(6, '<p>รถออกเวลา 03:12<br>มุ่งหน้าไปสถานีสื่อสาร</p>').ok, false)
})

test('two clues require witness information and all seven genuine completions gate the final camera', () => {
  const chapter = createChapter(memory())
  assert.equal(chapter.collectClue('receipt'), false)
  assert.equal(chapter.startHack(), false)
  assert.equal(chapter.submitTask(0, tasks[0].solution).ok, false)
  chapter.talkToArun()
  chapter.collectClue('relay')
  assert.equal(chapter.canHack(), false)
  chapter.collectClue('relay')
  assert.equal(chapter.get().clues.length, 1)
  chapter.collectClue('receipt')
  assert.equal(chapter.startHack(), true)
  assert.equal(chapter.submitTask(6, tasks[6].solution).ok, false)
  assert.equal(chapter.submitImage('<img src="suspect.png" alt="ผู้ต้องสงสัยหน้าร้าน">').ok, false)
  tasks.forEach((task, index) => {
    assert.equal(chapter.canOpenTask(index), true)
    assert.equal(chapter.submitTask(index, task.solution).ok, false)
    assert.equal(chapter.submitPuzzle(index, puzzles[index].solution).ok, true)
    assert.equal(chapter.submitTask(index, task.solution).ok, true)
    assert.equal(chapter.get().completed.length, index + 1)
  })
  assert.equal(chapter.canRecoverImage(), true)
  assert.equal(chapterScore(chapter.get()), 70)
  assert.equal(chapter.get().imageRecovered, false)
  assert.equal(
    chapter.submitImage('<IMG ALT="ผู้ต้องสงสัยเสื้อดำหน้าร้าน" SRC="./suspect.png">').ok,
    true
  )
  assert.equal(chapterScore(chapter.get()), 100)
})

test('hint and failed attempts record help without awarding progress or reducing eventual score', () => {
  const chapter = createChapter(memory())
  enter(chapter)
  chapter.submitPuzzle(0, puzzles[0].solution)
  assert.equal(chapter.useHint(0), tasks[0].hint)
  assert.equal(chapterScore(chapter.get()), 0)
  assert.equal(chapter.submitTask(0, tasks[0].starter).ok, false)
  assert.equal(chapter.get().completed.length, 0)
  assert.equal(chapter.submitTask(0, tasks[0].solution).ok, true)
  assert.deepEqual(chapter.get().observations[0], { attempts: 2, usedHint: true, revealed: false })
  assert.equal(chapterScore(chapter.get()), 10)
  assert.equal(chapter.submitTask(0, tasks[0].solution).ok, true)
  assert.equal(chapterScore(chapter.get()), 10)
})

test('owner and reset generation isolate local learning without changing another account', () => {
  const storage = memory()
  const chapter = createChapter(storage)
  chapter.activateOwner('alice', 1)
  enter(chapter)
  chapter.submitPuzzle(0, puzzles[0].solution)
  chapter.submitTask(0, tasks[0].solution)
  chapter.activateOwner('bob', 1)
  assert.equal(chapter.get().spoken, false)
  chapter.talkToArun()
  chapter.activateOwner('alice', 1)
  assert.deepEqual(chapter.get().completed, [0])
  chapter.activateOwner('alice', 2)
  assert.equal(chapter.get().spoken, false)
  assert.equal(chapterScore(chapter.get()), 0)
  chapter.activateOwner('bob', 1)
  assert.equal(chapter.get().spoken, true)
  chapter.reset()
  assert.equal(chapter.get().spoken, false)
})

test('corrupt or contradictory local chapter progress is rejected safely', () => {
  const storage = memory()
  storage.setItem(
    'techcare.chapter-one.v1:guest:0',
    JSON.stringify({
      version: 1,
      spoken: false,
      clues: ['receipt', 'relay'],
      entered: true,
      completed: [0, 1, 2, 3, 4, 5, 6],
      imageRecovered: true,
      observations: Array.from({ length: 8 }, () => ({
        attempts: 1,
        usedHint: false,
        revealed: false,
      })),
    })
  )
  const chapter = createChapter(storage)
  assert.equal(chapterScore(chapter.get()), 0)
  assert.equal(chapter.get().storageWarning, true)
  assert.match(chapterObjective(chapter.get()), /คุยกับลุงอรุณ/)
})

test('final image needs a real img src and a useful alternate description', () => {
  assert.equal(validateImage('<img source="suspect.png" alt="ผู้ต้องสงสัยหน้าร้าน">').ok, false)
  assert.equal(validateImage('<img src="suspect.png" alt="">').ok, false)
  assert.equal(validateImage('<img src="suspect.png" alt="image">').ok, false)
  assert.equal(
    validateImage('<!-- <img src="suspect.png" alt="ผู้ต้องสงสัยหน้าร้าน"> -->').ok,
    false
  )
  assert.equal(
    validateImage('<IMG alt="ผู้ต้องสงสัยเสื้อดำหน้าร้าน" SRC="suspect.png" />').ok,
    true
  )
})

test('all seven puzzles reject missing, fabricated and misplaced cards; scaffold still needs manual code', () => {
  assert.equal(puzzles.length, 7)
  for (const [index, puzzle] of puzzles.entries()) {
    assert.equal(validatePuzzle(index, puzzle.solution).ok, true)
    assert.equal(validatePuzzle(index, {}).ok, false)
    assert.equal(validatePuzzle(index, { passed: true }).ok, false)
    assert.equal(validatePuzzle(index, { ...puzzle.solution, extra: 'body' }).ok, false)
    assert.equal(validatePuzzle(index, Object.assign(Object.create(puzzle.solution), Object.fromEntries(puzzle.slots.map((_, i) => [`fake${i}`, true])))).ok, false)
    assert.equal(validatePuzzle(index, Object.fromEntries(puzzle.slots.map(({ id }) => [id, 'wrong']))).ok, false)
    assert.equal(validateTask(index, puzzle.scaffold).ok, false, `${puzzle.id} scaffold cannot pass`)
  }
})

test('puzzle checks and code inspection cannot grant code points or unlock the next stage', () => {
  const chapter = createChapter(memory())
  enter(chapter)
  assert.equal(chapter.submitPuzzle(1, puzzles[1].solution).ok, false)
  assert.equal(chapter.submitPuzzle(0, {}).ok, false)
  assert.deepEqual(chapter.get().puzzleCompleted, [])
  const before = chapter.get()
  assert.equal(chapter.checkTask(0, tasks[0].solution).ok, false)
  assert.equal(chapter.get(), before)
  chapter.submitPuzzle(0, puzzles[0].solution)
  const ready = chapter.get()
  assert.equal(chapter.canEditTask(0), true)
  assert.equal(chapter.checkTask(0, tasks[0].solution).ok, true)
  assert.equal(chapter.get(), ready)
  assert.equal(chapterScore(chapter.get()), 0)
  assert.equal(chapter.canOpenTask(1), false)
  chapter.submitTask(0, tasks[0].solution)
  assert.equal(chapter.canOpenTask(1), true)
  assert.equal(chapter.canEditTask(1), false)
  chapter.reset()
  assert.deepEqual(chapter.get().puzzleCompleted, [])
})

test('legacy completion migrates to puzzle completion without losing earned evidence or observations', () => {
  const storage = memory()
  const original = createChapter(storage)
  enter(original)
  for (let index = 0; index < 2; index++) {
    original.submitPuzzle(index, puzzles[index].solution)
    original.submitTask(index, tasks[index].solution)
  }
  const { puzzleCompleted: _puzzles, ...legacy } = original.get()
  storage.setItem('techcare.chapter-one.v1:guest:0', JSON.stringify({ ...legacy, version: 1 }))
  const restored = createChapter(storage)
  assert.equal(restored.get().version, 2)
  assert.deepEqual(restored.get().completed, [0, 1])
  assert.deepEqual(restored.get().puzzleCompleted, [0, 1])
  assert.deepEqual(restored.get().observations, original.get().observations)
  assert.equal(chapterScore(restored.get()), 20)
  assert.equal(restored.canEditTask(1), true)
  assert.equal(restored.canEditTask(2), false)
  assert.equal(restored.get().storageWarning, false)
  restored.submitPuzzle(2, puzzles[2].solution)
  const reloaded = createChapter(storage)
  assert.equal(reloaded.canEditTask(2), true)
  assert.equal(reloaded.get().completed.length, 2)
})

test('v2 saves cannot claim puzzles out of order or code completion without its puzzle', () => {
  const storage = memory()
  const chapter = createChapter(storage)
  enter(chapter)
  const base = chapter.get()
  for (const patch of [
    { puzzleCompleted: [1] },
    { puzzleCompleted: [0, 1] },
    { puzzleCompleted: [], completed: [0] },
    { puzzleCompleted: [0, 0] },
  ]) {
    storage.setItem('techcare.chapter-one.v1:guest:0', JSON.stringify({ ...base, ...patch }))
    const restored = createChapter(storage)
    assert.equal(restored.get().storageWarning, true)
    assert.deepEqual(restored.get().completed, [])
    assert.deepEqual(restored.get().puzzleCompleted, [])
  }
})

test('a completed v1 case retains the recovered image and all points after migration', () => {
  const storage = memory()
  storage.setItem('techcare.chapter-one.v1:guest:0', JSON.stringify({
    version: 1,
    spoken: true,
    clues: ['receipt', 'relay'],
    entered: true,
    completed: [0, 1, 2, 3, 4, 5, 6],
    observations: Array.from({ length: 8 }, () => ({ attempts: 2, usedHint: true, revealed: false })),
    imageRecovered: true,
  }))
  const chapter = createChapter(storage)
  assert.equal(chapterScore(chapter.get()), 100)
  assert.equal(chapter.get().imageRecovered, true)
  assert.deepEqual(chapter.get().puzzleCompleted, [0, 1, 2, 3, 4, 5, 6])
  assert.equal(Object.isFrozen(chapter.get().puzzleCompleted), true)
  assert.equal(chapter.get().storageWarning, false)
})

test('parser diagnostics point to the actual broken line and do not invent semantic positions', () => {
  const nested = validateTask(3, '<p>\n<strong>ลายเซ็นหน่วยเก่า\n</p>\n</strong>')
  assert.equal(nested.ok, false)
  assert.equal(nested.line, 3)
  const missing = validateTask(3, '<p>\n<strong>ลายเซ็นหน่วยเก่า')
  assert.equal(missing.line, 2)
  const malformed = validateTask(0, '<html>\n<body>\n<p')
  assert.equal(malformed.line, 3)
  const semantic = validateTask(4, tasks[4].starter)
  assert.equal(semantic.ok, false)
  assert.equal(semantic.line, undefined)
})
