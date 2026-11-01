export type ChapterTask = Readonly<{
  id: string
  number: number
  title: string
  topic: string
  kind: 'code' | 'filename'
  lesson: string
  instruction: string
  starter: string
  solution: string
  hint: string
  success: string
  source: string
}>

/** Original exercises; W3Schools supplies the topic progression, not copied questions. */
export const tasks: readonly ChapterTask[] = [
  {
    id: 'body',
    number: 1,
    title: 'ปลุกหน้าบันทึก',
    topic: 'Home / Introduction',
    kind: 'code',
    lesson:
      'HTML บอกโครงสร้างและความหมายของเนื้อหา ส่วนที่ผู้ใช้เห็นอยู่ใน <body> ไม่ใช่ <head> ซึ่งใช้เก็บข้อมูลของหน้าเว็บ',
    instruction:
      'ย้ายย่อหน้า “ร้านอรุณเปิดแล้ว” เข้าไปไว้ระหว่าง <body> กับ </body> โดยคง <html> ไว้',
    starter: '<html>\n<head><p>ร้านอรุณเปิดแล้ว</p></head>\n<body></body>\n</html>',
    solution: '<html>\n<head></head>\n<body><p>ร้านอรุณเปิดแล้ว</p></body>\n</html>',
    hint: 'เก็บ <head></head> ว่างไว้ก่อน แล้วย้าย <p> ทั้งชุดเข้า <body> ได้เลย',
    success: 'หน้าเว็บมีส่วนแสดงเนื้อหาแล้ว HTML จัดโครงสร้าง ส่วนเบราว์เซอร์เป็นผู้แสดงผล',
    source: 'https://www.w3schools.com/html/html_intro.asp',
  },
  {
    id: 'editor',
    number: 2,
    title: 'คืนชื่อแฟ้ม',
    topic: 'Editors',
    kind: 'filename',
    lesson:
      'เขียน HTML ด้วยโปรแกรมแก้ไขข้อความ บันทึกเป็น UTF-8 และใช้สกุล .html หรือ .htm จากนั้นเปิดไฟล์ด้วยเบราว์เซอร์ ชื่อที่ลงท้าย .txt ยังเป็นไฟล์ข้อความ',
    instruction:
      'แฟ้มหน้าหลักถูกเปลี่ยนเป็น index.html.txt แก้ชื่อให้เหลือชื่อหน้าหลักที่ใช้สกุล HTML',
    starter: 'index.html.txt',
    solution: 'index.html',
    hint: 'ลบ .txt ด้านท้ายออก ชื่อ index.htm ก็เป็น HTML เช่นกัน',
    success:
      'ชื่อแฟ้มถูกต้องแล้ว ในงานจริงต้องเลือกชนิดไฟล์ขณะบันทึกด้วย การเปลี่ยนชื่ออย่างเดียวไม่ได้สร้างเนื้อหา HTML ให้',
    source: 'https://www.w3schools.com/html/html_editors.asp',
  },
  {
    id: 'document',
    number: 3,
    title: 'ซ่อมหัวเอกสาร',
    topic: 'Basic',
    kind: 'code',
    lesson:
      '<!DOCTYPE html> บอกให้เบราว์เซอร์ใช้มาตรฐาน HTML ปัจจุบัน ส่วน <html> เป็นรากของเอกสาร และ <body> ครอบเนื้อหาที่มองเห็น',
    instruction:
      'เติมการประกาศชนิดเอกสาร HTML5 ไว้บรรทัดแรก คงข้อความ “CAM-07 พร้อมตรวจ” ไว้ใน body',
    starter: '<html>\n<body><p>CAM-07 พร้อมตรวจ</p></body>\n</html>',
    solution: '<!DOCTYPE html>\n<html>\n<body><p>CAM-07 พร้อมตรวจ</p></body>\n</html>',
    hint: 'บรรทัดที่ต้องเพิ่มคือ <!DOCTYPE html> วางก่อน <html> ไม่ต้องมีแท็กปิด',
    success: 'เอกสารระบุ HTML5 และยังเก็บเนื้อหาไว้ใน body ได้ครบ',
    source: 'https://www.w3schools.com/html/html_basic.asp',
  },
  {
    id: 'elements',
    number: 4,
    title: 'ต่อวงจรแท็ก',
    topic: 'Elements',
    kind: 'code',
    lesson:
      'องค์ประกอบทั่วไปมีแท็กเปิด เนื้อหา และแท็กปิด เมื่อซ้อนแท็ก ต้องปิดตัวที่อยู่ข้างในก่อน เช่น <p><strong>ข้อความ</strong></p> ส่วน img กับ br เป็นแท็กว่าง',
    instruction:
      'แก้ลำดับแท็กปิดให้ “ลายเซ็นหน่วยเก่า” อยู่ใน strong และ strong อยู่ใน p โดยปิดครบทั้งคู่',
    starter: '<p><strong>ลายเซ็นหน่วยเก่า</p></strong>',
    solution: '<p><strong>ลายเซ็นหน่วยเก่า</strong></p>',
    hint: 'เปิด p ก่อน แล้วเปิด strong ดังนั้นต้องปิด strong ก่อนปิด p',
    success: 'แท็กซ้อนกันถูกลำดับแล้ว เบราว์เซอร์ไม่ต้องเดาว่าข้อความไหนควรอยู่ข้างใน',
    source: 'https://www.w3schools.com/html/html_elements.asp',
  },
  {
    id: 'attributes',
    number: 5,
    title: 'ตั้งภาษาของสัญญาณ',
    topic: 'Attributes',
    kind: 'code',
    lesson:
      'แอตทริบิวต์ให้ข้อมูลเพิ่มในแท็กเปิด รูปแบบชื่อ="ค่า" เช่น lang="th" บน html ระบุว่าเนื้อหาหลักเป็นภาษาไทย ช่วยเครื่องมืออ่านหน้าจอเลือกการออกเสียง',
    instruction: 'เปลี่ยนค่า lang ของ html ให้เป็นภาษาไทย คงย่อหน้า “บันทึกการขนย้าย” ไว้',
    starter: '<html lang="en">\n<body><p>บันทึกการขนย้าย</p></body>\n</html>',
    solution: '<html lang="th">\n<body><p>บันทึกการขนย้าย</p></body>\n</html>',
    hint: 'เปลี่ยน en เป็น th ในแท็กเปิด html ค่า th-TH ก็ระบุภาษาไทยได้',
    success: 'หน้าบันทึกประกาศภาษาไทยแล้ว lang ระบุภาษา ไม่ได้แปลข้อความให้เอง',
    source: 'https://www.w3schools.com/html/html_attributes.asp',
  },
  {
    id: 'headings',
    number: 6,
    title: 'จัดชั้นแฟ้มคดี',
    topic: 'Headings',
    kind: 'code',
    lesson:
      'h1 ใช้กับหัวข้อหลักของหน้า h2 ใช้หัวข้อย่อยของ h1 และ h3 ใช้ย่อยลงไปอีก เลือกระดับตามโครงสร้างเรื่อง ไม่ใช้เพียงเพราะอยากได้ตัวอักษรใหญ่',
    instruction:
      'ให้ “แฟ้ม BLACKBOX” เป็นหัวข้อหลัก h1 และ “เส้นทางขนย้าย” เป็นหัวข้อย่อย h2 เรียงตามนี้',
    starter: '<h3>แฟ้ม BLACKBOX</h3>\n<h1>เส้นทางขนย้าย</h1>',
    solution: '<h1>แฟ้ม BLACKBOX</h1>\n<h2>เส้นทางขนย้าย</h2>',
    hint: 'แก้ทั้งแท็กเปิดและปิดของหัวข้อแรกเป็น h1 หัวข้อถัดไปเป็น h2',
    success: 'หัวข้อเรียงเป็นชั้นแล้ว คนอ่านไล่จากแฟ้มคดีไปยังรายละเอียดเส้นทางได้',
    source: 'https://www.w3schools.com/html/html_headings.asp',
  },
  {
    id: 'paragraphs',
    number: 7,
    title: 'แยกคำให้การ',
    topic: 'Paragraphs',
    kind: 'code',
    lesson:
      '<p> แยกเนื้อหาเป็นย่อหน้า เบราว์เซอร์มักรวมช่องว่างและการขึ้นบรรทัดในโค้ด จึงต้องใช้แท็กย่อหน้าเพื่อแยกความคิด ไม่พึ่งปุ่ม Enter อย่างเดียว',
    instruction:
      'แยกคำให้การเป็น p สองย่อหน้า ย่อหน้าแรก “รถออกเวลา 03:12” ย่อหน้าที่สอง “มุ่งหน้าไปสถานีสื่อสาร”',
    starter: '<p>รถออกเวลา 03:12\nมุ่งหน้าไปสถานีสื่อสาร</p>',
    solution: '<p>รถออกเวลา 03:12</p>\n<p>มุ่งหน้าไปสถานีสื่อสาร</p>',
    hint: 'ปิด </p> หลัง 03:12 แล้วเปิด <p> ใหม่ก่อนข้อความเรื่องสถานีสื่อสาร',
    success: 'คำให้การแยกเป็นสองย่อหน้า ครบเจ็ดจุดแล้ว กลับไปกู้หน้าภาพที่ CAM-07 ได้',
    source: 'https://www.w3schools.com/html/html_paragraphs.asp',
  },
]

export const finalTask: ChapterTask = {
  id: 'suspect-image',
  number: 8,
  title: 'กู้ภาพผู้ต้องสงสัย',
  topic: 'ภาพหลักฐาน / img',
  kind: 'code',
  lesson:
    'img ใช้ src ระบุไฟล์ภาพ และ alt อธิบายสาระของภาพสำหรับผู้ที่มองภาพไม่ได้ โจทย์นี้เป็นหน้าหลักฐานจำลอง ไม่ใช่คำสั่งเจาะระบบจริง',
  instruction:
    'แก้ img ให้เปิด suspect.png พร้อม alt ที่อธิบายผู้ต้องสงสัย เช่น “ผู้ต้องสงสัยเสื้อดำหน้าร้าน”',
  starter: '<img source="suspect.png" alt="">',
  solution: '<img src="suspect.png" alt="ผู้ต้องสงสัยเสื้อดำหน้าร้าน">',
  hint: 'ชื่อแอตทริบิวต์ที่ถูกคือ src ส่วน alt ต้องมีคำอธิบายภาพ ไม่ปล่อยว่าง',
  success:
    'กู้ภาพพร้อมเวลา 03:12 ได้แล้ว ตราบนเสื้อเชื่อมกับสถานีสื่อสาร เก็บเป็นเบาะแสก่อน ยังไม่ยืนยันว่าเงาในภาพคือคู่หูของคิน',
  source: 'https://www.w3schools.com/html/html_images.asp',
}

export type ClueId = 'receipt' | 'relay'
export const chapterClues: Record<ClueId, { title: string; detail: string; kin: string }> = {
  receipt: {
    title: 'ใบรับของที่ฉีกครึ่ง',
    detail: 'ใบรับอุปกรณ์ระบุ CAM-07 และเวลา 03:12 ลายมือเติมเลขหน่วยเก่าของคินไว้ด้านหลัง',
    kin: 'เลขหน่วยเก่าอีกแล้ว ใครเขาเขียนใบรับของเหมือนส่งจดหมายถึงแฟนเก่ากัน',
  },
  relay: {
    title: 'ตัวส่งสัญญาณใต้แผงไฟ',
    detail:
      'ตัวส่งซ่อนอยู่หลังแผงไฟ เก็บเส้นทางปลายทาง “สถานีสื่อสาร 02” และลายเซ็น NULL ไว้ในบันทึก',
    kin: 'ซ่อนได้มิดดี แต่ดันเปิดไฟบอกสถานะ ขอบใจนะ ประหยัดเวลาฉันไปเยอะ',
  },
}

export const arunLines = [
  { speaker: 'อรุณ', text: 'เมื่อคืนคนใช้นาม NULL ส่งสลิปค่าซ่อมมา บอกให้ฉันเปิดหลังร้านรอรับเครื่อง' },
  { speaker: 'คิน', text: 'สลิปมา เงินไม่เข้า แถมกล้องดับ ลุงโดนโกงแบบมีของแถมเลยนะ' },
  {
    speaker: 'อรุณ',
    text: 'ขำให้พอ เงินฉันหายจริง พอหันไปเช็กยอด CAM-07 ก็ถูกลบเฉพาะช่วง 03:12',
  },
  { speaker: 'คิน', text: 'โอเค ผมหยุดแซวแล้ว เขาแตะอะไรในร้านอีก?' },
  { speaker: 'อรุณ', text: 'ใบรับของที่เคาน์เตอร์ซ้ายถูกฉีก ฉันเก็บครึ่งหนึ่งไว้ตรงนั้น' },
  {
    speaker: 'อรุณ',
    text: 'แล้วตัวส่งสัญญาณข้างโต๊ะฝั่งขวายังสว่าง ทั้งที่ฉันปิดไฟแล้ว',
  },
  { speaker: 'คิน', text: 'ผมเก็บสองจุดนั้นเอง ลุงอย่าเปิด CAM-07 ทับนะ เดี๋ยวเราต้องจ่ายค่าเสียหายให้โจรอีก' },
  { speaker: 'อรุณ', text: 'เครื่องซ่อมอยู่กลางร้าน คืนหน้า HTML ให้ครบเจ็ดส่วนก่อน แล้วค่อยไปเปิดภาพจากกล้อง' },
] as const
