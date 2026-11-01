import type { AnswerResult } from './validate.ts'

export type PuzzleAnswer = Readonly<Record<string, string>>
export type PuzzleDefinition = Readonly<{
  id: string
  title: string
  instruction: string
  slots: readonly Readonly<{ id: string; label: string }>[]
  options: readonly Readonly<{ id: string; label: string }>[]
  solution: PuzzleAnswer
  scaffold: string
  snippets: readonly Readonly<{ label: string; text: string }>[]
}>

/** Original, finite card puzzles. Option IDs are checked, not client-supplied pass flags. */
export const puzzles: readonly PuzzleDefinition[] = [
  {
    id: 'body-gate',
    title: 'แยกข้อมูลออกจากหน้าเว็บ',
    instruction:
      'ลากหรือเลือกการ์ด แล้วเลือกช่องที่ตรงกัน เนื้อหาที่อ่านบนหน้าเว็บกับข้อมูลของเอกสารอยู่คนละส่วน',
    slots: [
      { id: 'visible', label: 'เนื้อหาที่คนอ่านมองเห็น' },
      { id: 'metadata', label: 'ข้อมูลของเอกสาร' },
    ],
    options: [
      { id: 'head', label: '<head>' },
      { id: 'script', label: '<script>' },
      { id: 'body', label: '<body>' },
    ],
    solution: { visible: 'body', metadata: 'head' },
    scaffold:
      '<html>\n<head></head>\n<body>\n  <!-- ใส่ย่อหน้า ร้านอรุณเปิดแล้ว ที่นี่ -->\n</body>\n</html>',
    snippets: [
      { label: '<p>', text: '<p>' },
      { label: '</p>', text: '</p>' },
      { label: 'ข้อความ', text: 'ร้านอรุณเปิดแล้ว' },
    ],
  },
  {
    id: 'file-vault',
    title: 'คืนชนิดแฟ้ม',
    instruction:
      'แยกชื่อแฟ้มตามสกุลสุดท้าย ชื่อที่ลงท้าย .txt ยังเป็นไฟล์ข้อความ แม้ข้างหน้าจะมีคำว่า html',
    slots: [
      { id: 'web', label: 'แฟ้ม HTML สำหรับหน้าเว็บ' },
      { id: 'text', label: 'แฟ้มข้อความทั่วไป' },
    ],
    options: [
      { id: 'text-file', label: 'index.html.txt' },
      { id: 'image-file', label: 'index.png' },
      { id: 'html-file', label: 'index.html' },
    ],
    solution: { web: 'html-file', text: 'text-file' },
    scaffold: 'index.',
    snippets: [
      { label: 'html', text: 'html' },
      { label: 'htm', text: 'htm' },
    ],
  },
  {
    id: 'document-power',
    title: 'ต่อหัวเอกสารให้ถูกช่อง',
    instruction:
      'วางส่วนประกอบในตำแหน่งที่กำหนด ประกาศ HTML5 อยู่ก่อนรากเอกสาร ส่วนเนื้อหาอยู่ใน body',
    slots: [
      { id: 'first', label: 'บรรทัดประกาศ HTML5' },
      { id: 'root', label: 'รากเอกสาร' },
      { id: 'content', label: 'ส่วนเนื้อหาที่มองเห็น' },
    ],
    options: [
      { id: 'body', label: '<body>' },
      { id: 'html', label: '<html>' },
      { id: 'doctype', label: '<!DOCTYPE html>' },
      { id: 'p', label: '<p>' },
    ],
    solution: { first: 'doctype', root: 'html', content: 'body' },
    scaffold: '\n<html>\n<body><p>CAM-07 พร้อมตรวจ</p></body>\n</html>',
    snippets: [
      { label: '<!DOCTYPE html>', text: '<!DOCTYPE html>' },
      { label: '<html>', text: '<html>' },
      { label: '</html>', text: '</html>' },
    ],
  },
  {
    id: 'tag-assembly',
    title: 'ปิดวงจรจากด้านใน',
    instruction: 'เริ่มจาก <p><strong>ข้อความ เลือกแท็กปิดที่ต้องทำก่อน แล้วจึงปิดชั้นนอก',
    slots: [
      { id: 'inner', label: 'ปิดชั้นในก่อน' },
      { id: 'outer', label: 'ปิดชั้นนอกทีหลัง' },
    ],
    options: [
      { id: 'p-close', label: '</p>' },
      { id: 'strong-close', label: '</strong>' },
      { id: 'strong-open', label: '<strong>' },
    ],
    solution: { inner: 'strong-close', outer: 'p-close' },
    scaffold: '<p><strong>ลายเซ็นหน่วยเก่า\n<!-- ปิดแท็กด้านในก่อนด้านนอก -->',
    snippets: [
      { label: '</strong>', text: '</strong>' },
      { label: '</p>', text: '</p>' },
      { label: '<strong>', text: '<strong>' },
    ],
  },
  {
    id: 'language-relay',
    title: 'ตั้งภาษาของสัญญาณ',
    instruction: 'จับคู่ชื่อแอตทริบิวต์และค่าที่ใช้บอกว่าเนื้อหาหลักเป็นภาษาไทย',
    slots: [
      { id: 'name', label: 'ชื่อแอตทริบิวต์ภาษา' },
      { id: 'value', label: 'ค่าภาษาไทย' },
    ],
    options: [
      { id: 'en', label: 'en' },
      { id: 'lang', label: 'lang' },
      { id: 'th', label: 'th' },
      { id: 'class', label: 'class' },
    ],
    solution: { name: 'lang', value: 'th' },
    scaffold: '<html lang="">\n<body><p>บันทึกการขนย้าย</p></body>\n</html>',
    snippets: [
      { label: 'th', text: 'th' },
      { label: 'lang=""', text: 'lang=""' },
      { label: '" "', text: '""' },
    ],
  },
  {
    id: 'heading-tower',
    title: 'จัดระดับแฟ้มคดี',
    instruction:
      'แฟ้ม BLACKBOX คือหัวข้อหลัก ส่วนเส้นทางขนย้ายเป็นหัวข้อย่อยหนึ่งระดับ เลือกตามความหมายของเนื้อหา',
    slots: [
      { id: 'main', label: 'แฟ้ม BLACKBOX — หัวข้อหลัก' },
      { id: 'sub', label: 'เส้นทางขนย้าย — หัวข้อย่อย' },
    ],
    options: [
      { id: 'h3', label: '<h3>' },
      { id: 'h2', label: '<h2>' },
      { id: 'h1', label: '<h1>' },
    ],
    solution: { main: 'h1', sub: 'h2' },
    scaffold: '<h1>แฟ้ม BLACKBOX</h1>\n<!-- เติมหัวข้อย่อย เส้นทางขนย้าย -->',
    snippets: [
      { label: '<h2>', text: '<h2>' },
      { label: '</h2>', text: '</h2>' },
      { label: '<h1>', text: '<h1>' },
      { label: '</h1>', text: '</h1>' },
      { label: 'ข้อความ', text: 'เส้นทางขนย้าย' },
    ],
  },
  {
    id: 'witness-archive',
    title: 'แยกคำให้การสองย่อหน้า',
    instruction:
      'วางเวลาในย่อหน้าแรก และปลายทางในย่อหน้าที่สอง การกด Enter ในโค้ดอย่างเดียวไม่สร้างย่อหน้า HTML',
    slots: [
      { id: 'first', label: 'ย่อหน้าแรก — เวลาออก' },
      { id: 'second', label: 'ย่อหน้าที่สอง — ปลายทาง' },
    ],
    options: [
      { id: 'destination', label: '<p>มุ่งหน้าไปสถานีสื่อสาร</p>' },
      { id: 'break', label: '<br>' },
      { id: 'departure', label: '<p>รถออกเวลา 03:12</p>' },
    ],
    solution: { first: 'departure', second: 'destination' },
    scaffold: '<p>รถออกเวลา 03:12</p>\n<!-- เติมย่อหน้าปลายทาง -->',
    snippets: [
      { label: '<p>', text: '<p>' },
      { label: '</p>', text: '</p>' },
      { label: 'ข้อความ', text: 'มุ่งหน้าไปสถานีสื่อสาร' },
    ],
  },
]

export function validatePuzzle(index: number, answer: unknown): AnswerResult {
  const puzzle = puzzles[index]
  if (!puzzle || !answer || typeof answer !== 'object' || Array.isArray(answer))
    return { ok: false, feedback: 'เลือกการ์ดให้ครบตามช่องของภารกิจนี้ก่อน' }
  const submitted = answer as Record<string, unknown>
  const valid =
    Object.keys(submitted).length === puzzle.slots.length &&
    puzzle.slots.every(
      ({ id }) => Object.hasOwn(submitted, id) && submitted[id] === puzzle.solution[id]
    )
  return valid
    ? { ok: true, feedback: 'วงจรถูกต้องแล้ว โครงบางส่วนพร้อมให้เติม HTML ต่อด้วยตัวเอง' }
    : {
        ok: false,
        feedback: 'ยังมีการ์ดไม่ตรงช่อง ลองอ่านชื่อหน้าที่ของแต่ละช่องแล้วจัดใหม่ได้เลย',
      }
}
