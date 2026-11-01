import type { AnswerResult } from '../chapter/validate.ts'

export type PuzzleAnswer = Readonly<Record<string, string | readonly string[]>>
export type RelayPuzzleDefinition = {
  kind: 'connections' | 'path' | 'target' | 'inventory' | 'timeline' | 'zones' | 'groups'
  title: string
  instruction: string
  solution: PuzzleAnswer
  scaffold: string
  snippets: readonly { label: string; text: string }[]
}
export const puzzles: readonly RelayPuzzleDefinition[] = [
  {
    kind: 'connections',
    title: 'ต่อสะพานแฟ้ม',
    instruction: 'เลือกป้ายหนึ่งใบ แล้วเลือกจุดหมายที่สัมพันธ์กันให้ครบสองคู่',
    solution: { station: 'station.html', arrival: 'logs/arrival.html' },
    scaffold: '<a>แฟ้มสถานี</a>',
    snippets: [
      { label: '<a>', text: '<a href="">แฟ้มสถานี</a>' },
      { label: 'href', text: 'href=""' },
    ],
  },
  {
    kind: 'path',
    title: 'หาแฟ้มในโฟลเดอร์',
    instruction:
      'เริ่มที่โฟลเดอร์หลัก เลือกโฟลเดอร์ logs แล้วเลือกแฟ้ม arrival.html แฟ้มที่หน้าหลักมีชื่อเหมือนกันแต่เป็นคนละตำแหน่ง',
    solution: { path: ['logs', 'arrival.html'] },
    scaffold: '<a href="">บันทึกรับอุปกรณ์</a>',
    snippets: [
      { label: 'logs/', text: 'logs/' },
      { label: 'arrival.html', text: 'arrival.html' },
      { label: '<a>', text: '<a href="">บันทึกรับอุปกรณ์</a>' },
    ],
  },
  {
    kind: 'target',
    title: 'กระโดดให้ถูกหัวข้อ',
    instruction: 'เมนู “หลังเหตุโจรกรรม” ควรพาไปส่วนใดของเอกสาร? เลือกเป้าหมายที่มี id ตรงกัน',
    solution: { target: 'after-theft' },
    scaffold:
      '<a href="#">หลังเหตุโจรกรรม</a>\n<section id="after-theft"><h2>หลังเหตุโจรกรรม</h2><p>ตรวจช่องรับอุปกรณ์หลัง 03:12</p></section>',
    snippets: [
      { label: '#after-theft', text: '#after-theft' },
      { label: 'href', text: 'href=""' },
      { label: 'id', text: 'id=""' },
    ],
  },
  {
    kind: 'inventory',
    title: 'คัดอุปกรณ์ในเส้นทาง',
    instruction: 'เลือกเฉพาะอุปกรณ์สองชิ้นในบันทึกการเชื่อมต่อ ไม่เลือกของใช้บนโต๊ะเวร',
    solution: { items: ['blackbox', 'relay'] },
    scaffold: '<ul>\nBLACKBOX-17\nRELAY-02\n</ul>',
    snippets: [
      { label: '<li>', text: '<li>' },
      { label: '</li>', text: '</li>' },
      { label: '<ul>', text: '<ul>\n\n</ul>' },
    ],
  },
  {
    kind: 'timeline',
    title: 'ต่อไทม์ไลน์',
    instruction:
      'กดเหตุการณ์ตามลำดับก่อน–หลัง อ่านเวลาได้เต็มที่ ไม่จับเวลา กดรายการในลำดับที่เลือกแล้วเพื่อนำออก',
    solution: { order: ['arrival', 'connect', 'forward'] },
    scaffold:
      '<ol>\n<li>03:21 ส่งต่อ</li>\n<li>03:16 รับอุปกรณ์</li>\n<li>03:18 เชื่อมต่อ</li>\n</ol>',
    snippets: [
      { label: '<ol>', text: '<ol>\n\n</ol>' },
      { label: '<li>', text: '<li>' },
      { label: '</li>', text: '</li>' },
    ],
  },
  {
    kind: 'zones',
    title: 'วางส่วนรายงาน',
    instruction: 'เลือกข้อมูล แล้ววางลงในส่วนหัว เนื้อหาหลัก หรือท้ายรายงานให้ตรงหน้าที่',
    solution: { header: 'identity', main: 'events', footer: 'source' },
    scaffold:
      '<header><h1>บันทึก RELAY-02</h1></header>\n<div><p>รายการส่งต่อ 03:21</p></div>\n<footer><p>แหล่งข้อมูล: RELAY-02</p></footer>',
    snippets: [
      { label: '<header>', text: '<header>\n\n</header>' },
      { label: '<main>', text: '<main>' },
      { label: '</main>', text: '</main>' },
      { label: '<footer>', text: '<footer>\n\n</footer>' },
    ],
  },
  {
    kind: 'groups',
    title: 'แยกบันทึกจากหมายเหตุ',
    instruction:
      'เลือกแต่ละข้อความ แล้วจัดเข้าหมวด “รายการส่งข้อมูล” หรือ “หมายเหตุ” ให้ครบสี่ข้อความ',
    solution: { transmissions: ['connect', 'forward'], notes: ['omitted', 'unit'] },
    scaffold:
      '<section><h2>รายการส่งข้อมูล</h2><p>03:21 ส่งต่อ</p></section>\n<h2>หมายเหตุ</h2><p>รายการนี้ไม่อยู่ในรายงานผู้ว่าจ้าง</p>',
    snippets: [
      { label: '<section>', text: '<section>' },
      { label: '</section>', text: '</section>' },
      { label: '<h2>', text: '<h2></h2>' },
    ],
  },
]

const arrayEqual = (a: unknown, b: readonly string[], ordered: boolean) =>
  Array.isArray(a) &&
  a.length === b.length &&
  new Set(a).size === a.length &&
  a.every((v) => typeof v === 'string') &&
  (ordered ? a.every((v, i) => v === b[i]) : b.every((v) => a.includes(v)))
export function validatePuzzle(index: number, answer: unknown): AnswerResult {
  const puzzle = puzzles[index]
  if (!puzzle || !answer || typeof answer !== 'object' || Array.isArray(answer))
    return { ok: false, feedback: 'เลือกคำตอบของ Puzzle ให้ครบก่อน' }
  const values = answer as Record<string, unknown>
  const keys = Object.keys(puzzle.solution)
  const ok =
    Object.keys(values).length === keys.length &&
    keys.every((key) => {
      if (!Object.hasOwn(values, key)) return false
      const solution = puzzle.solution[key]
      return Array.isArray(solution)
        ? arrayEqual(values[key], solution, ['path', 'timeline'].includes(puzzle.kind))
        : values[key] === solution
    })
  return {
    ok,
    feedback: ok
      ? 'ความสัมพันธ์ถูกต้องแล้ว ลองเติมบรรทัดสำคัญด้วยตัวเองในหน้าซ่อม'
      : 'ยังไม่ตรง ลองเทียบจุดหมาย บทบาท หรือเวลาที่โจทย์แสดงอีกครั้ง ไม่เสียคะแนน',
  }
}
