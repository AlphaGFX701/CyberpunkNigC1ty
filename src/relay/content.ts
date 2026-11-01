import type { ChapterTask } from '../chapter/content.ts'

export const RELAY_RECORD = {
  serial: 'BLACKBOX-17',
  arrival: '03:16',
  connected: '03:18',
  forwarded: '03:21',
  destination: 'ศูนย์ควบคุม',
} as const

/** Original short exercises continuing the Arun chapter; not operational hacking commands. */
export const tasks: readonly ChapterTask[] = [
  {
    id: 'relay-link',
    number: 1,
    title: 'สะพานแฟ้ม',
    topic: 'HTML Links / a และ href',
    kind: 'code',
    lesson:
      'แท็ก a สร้างลิงก์ ส่วน href ระบุปลายทาง ข้อความระหว่างแท็กช่วยบอกผู้อ่านว่าจะเปิดอะไร โจทย์นี้เชื่อมแฟ้มจำลองในหน้าหลักฐาน ไม่ใช่คำสั่งควบคุมสถานี',
    instruction: 'เปลี่ยนข้อความ “แฟ้มสถานี” เป็นลิงก์ที่ชี้ไป station.html โดยคงข้อความนี้ไว้',
    starter: '<p>แฟ้มสถานี</p>',
    solution: '<a href="station.html">แฟ้มสถานี</a>',
    hint: 'ใช้ <a href="station.html"> ครอบข้อความ แล้วปิดด้วย </a>',
    success: 'แฟ้มสถานีกลับมาเชื่อมแล้ว คิน: เจอแฟ้มตัวจริงสักที ป้ายอย่างเดียวพาเราไปไหนไม่ได้',
    source: 'https://www.w3schools.com/html/html_links.asp',
  },
  {
    id: 'relay-path',
    number: 2,
    title: 'เส้นทางข้อมูล',
    topic: 'HTML File Paths / relative path',
    kind: 'code',
    lesson:
      'เส้นทางสัมพัทธ์อ้างอิงจากตำแหน่งแฟ้มปัจจุบัน ถ้า arrival.html อยู่ในโฟลเดอร์ logs ที่อยู่ข้างหน้าปัจจุบัน ให้เขียน logs/arrival.html ไม่ใช้เส้นทางโฟลเดอร์ในเครื่องของผู้เล่น',
    instruction: 'แก้ลิงก์ “บันทึกรับอุปกรณ์” ให้ชี้ logs/arrival.html ตามผังโฟลเดอร์ใน Puzzle',
    starter: '<a href="arrival.html">บันทึกรับอุปกรณ์</a>',
    solution: '<a href="logs/arrival.html">บันทึกรับอุปกรณ์</a>',
    hint: 'ชื่อไฟล์ถูกแล้ว เติมชื่อโฟลเดอร์ logs/ ข้างหน้า href',
    success:
      'เปิดบันทึกรับอุปกรณ์ได้ เวลาเข้าคือ 03:16 หลังเหตุโจรกรรม คิน: คราวนี้ไม่ได้หลงแฟ้ม แค่หลงโฟลเดอร์',
    source: 'https://www.w3schools.com/html/html_filepaths.asp',
  },
  {
    id: 'relay-fragment',
    number: 3,
    title: 'จุดอ้างอิง',
    topic: 'HTML Bookmarks / fragment และ id',
    kind: 'code',
    lesson:
      'ลิงก์ href="#ชื่อ" พาไปยังส่วนที่มี id ตรงกันในเอกสารเดียวกัน id ไม่ควรซ้ำกัน ไม่ต้องมีไฟล์ใหม่เพื่อเลื่อนไปหัวข้อเดิม',
    instruction:
      'เชื่อมลิงก์ “หลังเหตุโจรกรรม” กับ section ที่มี id="after-theft" และคงหัวข้อเดิมไว้',
    starter:
      '<a href="#missing">หลังเหตุโจรกรรม</a>\n<section id="after-theft"><h2>หลังเหตุโจรกรรม</h2><p>ตรวจช่องรับอุปกรณ์หลัง 03:12</p></section>',
    solution:
      '<a href="#after-theft">หลังเหตุโจรกรรม</a>\n<section id="after-theft"><h2>หลังเหตุโจรกรรม</h2><p>ตรวจช่องรับอุปกรณ์หลัง 03:12</p></section>',
    hint: 'ชื่อหลัง # ใน href ต้องตรงกับ id ของเป้าหมาย ใช้ after-theft',
    success:
      'ช่วงหลังโจรกรรมเปิดอ่านได้ มีการเชื่อมต่อเวลา 03:18 คิน: มีรายการอยู่ แต่คนทำรายงานไม่พาเราอ่านตรงนี้',
    source: 'https://www.w3schools.com/html/html_links_bookmarks.asp',
  },
  {
    id: 'relay-inventory',
    number: 4,
    title: 'คลังอุปกรณ์',
    topic: 'HTML Unordered Lists / ul และ li',
    kind: 'code',
    lesson:
      'ul รวมรายการที่ไม่ต้องเรียงลำดับ โดยแต่ละรายการอยู่ใน li ไม่ใช้ย่อหน้าหรือการขึ้นบรรทัดแทนรายการในโจทย์นี้',
    instruction: 'จัด “BLACKBOX-17” กับ “RELAY-02” เป็น li สองรายการภายใน ul เดียวกัน',
    starter: '<ul>BLACKBOX-17\nRELAY-02</ul>',
    solution: '<ul>\n<li>BLACKBOX-17</li>\n<li>RELAY-02</li>\n</ul>',
    hint: 'ครอบอุปกรณ์แต่ละชิ้นด้วย <li>...</li> แล้วเก็บทั้งสองไว้ใน ul',
    success:
      'หมายเลข BLACKBOX-17 ตรงกับอุปกรณ์ที่ตามอยู่ คิน: ของจริงผ่านเครื่องนี้มาแล้ว แต่ยังต้องรู้ว่ามันไปไหน',
    source: 'https://www.w3schools.com/html/html_lists_unordered.asp',
  },
  {
    id: 'relay-timeline',
    number: 5,
    title: 'ลำดับเหตุการณ์',
    topic: 'HTML Ordered Lists / ol และ li',
    kind: 'code',
    lesson:
      'ol ใช้เมื่อความเรียงก่อน–หลังมีความหมาย แต่ HTML ไม่ตรวจเวลาหรือเรียงเหตุการณ์ให้เอง เราต้องอ่านข้อมูลแล้วจัด li ให้ถูกลำดับ',
    instruction:
      'ใช้ ol และ li เรียงสามรายการ: “03:16 รับอุปกรณ์” → “03:18 เชื่อมต่อ” → “03:21 ส่งต่อ”',
    starter:
      '<ul>\n<li>03:21 ส่งต่อ</li>\n<li>03:16 รับอุปกรณ์</li>\n<li>03:18 เชื่อมต่อ</li>\n</ul>',
    solution:
      '<ol>\n<li>03:16 รับอุปกรณ์</li>\n<li>03:18 เชื่อมต่อ</li>\n<li>03:21 ส่งต่อ</li>\n</ol>',
    hint: 'เปลี่ยน ul เป็น ol ทั้งแท็กเปิดและปิด แล้วเรียงตามเวลาที่อ่านได้',
    success:
      'การรับ เชื่อม และส่งต่อเรียงครบ คิน: สามนาทีหลังเสียบเครื่องก็ส่งต่อเลย มาซ่อมหรือมาใช้ทางผ่านกันแน่',
    source: 'https://www.w3schools.com/html/html_lists_ordered.asp',
  },
  {
    id: 'relay-landmarks',
    number: 6,
    title: 'ศูนย์ประกอบรายงาน',
    topic: 'HTML Semantics / header, main, footer',
    kind: 'code',
    lesson:
      'header ระบุส่วนแนะนำ main เป็นเนื้อหาหลัก และ footer เป็นข้อมูลท้ายหน้า แท็กเหล่านี้ช่วยบอกบทบาทของเนื้อหา ไม่ได้แปลว่ามีหน้าตาเฉพาะโดยอัตโนมัติ',
    instruction:
      'ใส่ h1 “บันทึก RELAY-02” ใน header, ย่อหน้า “รายการส่งต่อ 03:21” ใน main และย่อหน้า “แหล่งข้อมูล: RELAY-02” ใน footer เรียงตามนี้',
    starter:
      '<div><h1>บันทึก RELAY-02</h1></div>\n<div><p>รายการส่งต่อ 03:21</p></div>\n<div><p>แหล่งข้อมูล: RELAY-02</p></div>',
    solution:
      '<header><h1>บันทึก RELAY-02</h1></header>\n<main><p>รายการส่งต่อ 03:21</p></main>\n<footer><p>แหล่งข้อมูล: RELAY-02</p></footer>',
    hint: 'เปลี่ยน div สามคู่ตามบทบาทเป็น header, main และ footer โดยไม่เปลี่ยนข้อความ',
    success:
      'รายงานแยกต้นทาง เนื้อหา และข้อมูลรับรองแล้ว คิน: คราวนี้แยกออกว่าอะไรคือบันทึก อะไรคือคำอธิบายของคนเขียน',
    source: 'https://www.w3schools.com/html/html5_semantic_elements.asp',
  },
  {
    id: 'relay-sections',
    number: 7,
    title: 'แฟ้มที่ถูกซ่อน',
    topic: 'HTML Sections / section และหัวข้อ',
    kind: 'code',
    lesson:
      'section รวมเนื้อหาที่เป็นหัวข้อเดียวกัน และควรมีหัวข้ออธิบาย กลุ่มข้อมูลส่งต่อกับหมายเหตุควรแยกกัน เพื่อไม่ทำให้ข้อเท็จจริงปะปนกับคำอธิบาย',
    instruction:
      'สร้าง section สองส่วน: h2 “รายการส่งข้อมูล” พร้อม p “03:21 ส่งต่อ” และ h2 “หมายเหตุ” พร้อม p “รายการนี้ไม่อยู่ในรายงานผู้ว่าจ้าง”',
    starter:
      '<h2>รายการส่งข้อมูล</h2><p>03:21 ส่งต่อ</p>\n<h2>หมายเหตุ</h2><p>รายการนี้ไม่อยู่ในรายงานผู้ว่าจ้าง</p>',
    solution:
      '<section><h2>รายการส่งข้อมูล</h2><p>03:21 ส่งต่อ</p></section>\n<section><h2>หมายเหตุ</h2><p>รายการนี้ไม่อยู่ในรายงานผู้ว่าจ้าง</p></section>',
    hint: 'แต่ละ section ครอบทั้ง h2 และ p ของตัวเอง ไม่ใช่ section เดียวครอบทุกหัวข้อ',
    success:
      'พบช่องอ้างอิงต้นฉบับแล้ว คิน: รายการหายจากรายงาน แต่ยังไม่หายจากเครื่อง ไปดูฉบับเต็มกัน',
    source: 'https://www.w3schools.com/html/html5_semantic_elements.asp',
  },
]

export const finalTask: ChapterTask = {
  id: 'relay-original',
  number: 8,
  title: 'หอบันทึกต้นฉบับ',
  topic: 'RELAY-02 / ประกอบหลักฐาน',
  kind: 'code',
  lesson:
    'ใช้ทักษะที่ซ่อมมาแล้วประกอบหน้าสรุป และเชื่อมแฟ้มต้นฉบับที่ได้รับอนุญาต การกู้หน้าเว็บทำให้เราอ่านข้อมูลจำลองได้ ไม่ได้ให้สิทธิ์ควบคุมเครือข่ายจริง',
  instruction:
    'สร้าง header ที่มี h1 “แฟ้ม BLACKBOX”, main ที่มี p “BLACKBOX-17” และลิงก์ “บันทึกต้นฉบับ” ไป logs/original.html, ตามด้วย footer ที่มี p “แหล่งข้อมูล: RELAY-02”',
  starter:
    '<header><h1>แฟ้ม BLACKBOX</h1></header>\n<main>\n<p>BLACKBOX-17</p>\n<a>บันทึกต้นฉบับ</a>\n</main>\n<footer><p>แหล่งข้อมูล: RELAY-02</p></footer>',
  solution:
    '<header><h1>แฟ้ม BLACKBOX</h1></header>\n<main>\n<p>BLACKBOX-17</p>\n<a href="logs/original.html">บันทึกต้นฉบับ</a>\n</main>\n<footer><p>แหล่งข้อมูล: RELAY-02</p></footer>',
  hint: 'โครงหลักมีแล้ว เติม href="logs/original.html" ให้ลิงก์บันทึกต้นฉบับ แล้วตรวจว่าเนื้อหาอยู่ในส่วนที่ถูกต้อง',
  success:
    'ต้นฉบับระบุ BLACKBOX-17 ส่งต่อไปศูนย์ควบคุมเวลา 03:21 แต่สำเนาผู้ว่าจ้างไม่มีรายการนี้ ยังไม่ทราบว่าใครเป็นคนตัดออก',
  source: 'https://www.w3schools.com/html/html_links.asp',
}

export type ClueId = 'workorder' | 'module'
export const relayClues: Record<ClueId, { title: string; detail: string; kin: string }> = {
  workorder: {
    title: 'ใบงานที่ใช้เลขหน่วยเก่า',
    detail: 'ใบงานซ่อมมีหมายเลขหน่วยเก่าของคินและลายเซ็นรับงาน แต่ไม่ระบุชื่อผู้ส่งที่ตรวจสอบได้',
    kin: 'เลขหน่วยนี้เลิกใช้ไปแล้ว ใครเขียนไว้ก็รู้ว่าฉันต้องจำได้',
  },
  module: {
    title: 'โมดูลบันทึกการเชื่อมต่อ',
    detail:
      'โมดูลเก็บหมายเลข BLACKBOX-17 และเวลาเชื่อมต่อ 03:18 แต่หน้ารายงานที่ชี้แฟ้มต้นฉบับเสียหาย',
    kin: 'มันไม่ได้แค่มาผ่านหน้าประตู มันต่อเข้ากับสถานีนี้จริง ๆ',
  },
}
export const chapterClues = relayClues
