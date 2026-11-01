import {
  parseHtml,
  elements,
  direct,
  text,
  descendants,
  type AnswerResult,
  type Element,
} from '../chapter/validate.ts'
import { tasks, finalTask } from './content.ts'
export type { AnswerResult } from '../chapter/validate.ts'

const path = (value: string) => value.replace(/^\.\//, '')
const link = (root: Element, label: string, href: string) =>
  elements(root, 'a').some((a) => text(a) === label && path(a.attrs.href ?? '') === href)
const paragraph = (root: Element, value: string) =>
  elements(root, 'p').some((p) => text(p) === value)
const list = (root: Element, tag: string, values: string[], ordered: boolean) =>
  elements(root, tag).some((node) => {
    const children = direct(node, 'li').map(text)
    return (
      children.length === values.length &&
      (ordered
        ? children.every((s, i) => s === values[i])
        : values.every((s) => children.includes(s)))
    )
  })
const safe = (root: Element) =>
  descendants(root).every((node) => {
    if (node.tag !== 'a') return true
    const href = node.attrs.href
    return (
      href === undefined ||
      /^(?:#[-\w]+|(?:\.\/)?(?:station\.html|logs\/(?:arrival|original)\.html))$/.test(href)
    )
  })

export function validateTask(index: number, input: string): AnswerResult {
  const task = index === 7 ? finalTask : tasks[index]
  if (!task) return { ok: false, feedback: 'ไม่พบจุดซ่อมนี้' }
  if (typeof input !== 'string' || input.length > 12000)
    return { ok: false, feedback: 'ใช้ HTML สั้นเฉพาะโจทย์ ไม่เกิน 12,000 ตัวอักษร' }
  const parsed = parseHtml(input)
  if (parsed.error) return { ok: false, feedback: parsed.error, line: parsed.line }
  const root = parsed.root
  if (!safe(root))
    return {
      ok: false,
      feedback: 'ลิงก์ใช้เฉพาะแฟ้มจำลองของโจทย์หรือ #id ภายในเอกสาร ไม่เปิดเว็บภายนอก',
    }
  let ok = false
  let failure = task.instruction
  switch (index) {
    case 0:
      ok = link(root, 'แฟ้มสถานี', 'station.html')
      failure = 'ใช้ a ที่มี href="station.html" และข้อความ “แฟ้มสถานี” ไม่ใช้ p หรือ src แทนลิงก์'
      break
    case 1:
      ok = link(root, 'บันทึกรับอุปกรณ์', 'logs/arrival.html')
      failure = 'แฟ้มอยู่ในโฟลเดอร์ logs จึงต้องใช้ href="logs/arrival.html" พร้อมข้อความเดิม'
      break
    case 2: {
      const targets = descendants(root).filter((n) => n.attrs.id === 'after-theft')
      ok =
        link(root, 'หลังเหตุโจรกรรม', '#after-theft') &&
        targets.length === 1 &&
        elements(targets[0], 'h2').some((h) => text(h) === 'หลังเหตุโจรกรรม')
      failure =
        'href ต้องเป็น #after-theft และมีเป้าหมาย id="after-theft" เพียงแห่งเดียวพร้อมหัวข้อเดิม'
      break
    }
    case 3:
      ok = list(root, 'ul', ['BLACKBOX-17', 'RELAY-02'], false)
      failure =
        'ให้ ul มี li สองรายการแยกกัน: BLACKBOX-17 และ RELAY-02 ไม่ใส่รายการที่ไม่เกี่ยวข้อง'
      break
    case 4:
      ok = list(root, 'ol', ['03:16 รับอุปกรณ์', '03:18 เชื่อมต่อ', '03:21 ส่งต่อ'], true)
      failure = 'ใช้ ol และ li ตามลำดับ 03:16 รับอุปกรณ์ → 03:18 เชื่อมต่อ → 03:21 ส่งต่อ'
      break
    case 5:
    case 7: {
      const header = elements(root, 'header'),
        main = elements(root, 'main'),
        footer = elements(root, 'footer')
      const h = header[0],
        m = main[0],
        f = footer[0]
      const landmarks = descendants(root).filter((n) =>
        ['header', 'main', 'footer'].includes(n.tag)
      )
      ok =
        header.length === 1 &&
        main.length === 1 &&
        footer.length === 1 &&
        landmarks.map((n) => n.tag).join(',') === 'header,main,footer' &&
        !!h &&
        !!m &&
        !!f &&
        h.offset < m.offset &&
        m.offset < f.offset &&
        elements(h, 'h1').some(
          (n) => text(n) === (index === 7 ? 'แฟ้ม BLACKBOX' : 'บันทึก RELAY-02')
        ) &&
        paragraph(m, index === 7 ? 'BLACKBOX-17' : 'รายการส่งต่อ 03:21') &&
        paragraph(f, 'แหล่งข้อมูล: RELAY-02') &&
        (index !== 7 || link(m, 'บันทึกต้นฉบับ', 'logs/original.html')) &&
        !elements(h, 'main').length &&
        !elements(m, 'footer').length &&
        !elements(f, 'main').length
      failure =
        index === 7
          ? 'คง header/main/footer ตามโจทย์ แล้วใส่ลิงก์บันทึกต้นฉบับ href="logs/original.html" ภายใน main'
          : 'ต้องมี header, main และ footer แยกกันตามลำดับ พร้อมหัวข้อและย่อหน้าที่ตรงบทบาท'
      break
    }
    case 6: {
      const sections = elements(root, 'section')
      ok =
        sections.length === 2 &&
        sections.some(
          (s) =>
            direct(s, 'h2').some((h) => text(h) === 'รายการส่งข้อมูล') &&
            paragraph(s, '03:21 ส่งต่อ')
        ) &&
        sections.some(
          (s) =>
            direct(s, 'h2').some((h) => text(h) === 'หมายเหตุ') &&
            paragraph(s, 'รายการนี้ไม่อยู่ในรายงานผู้ว่าจ้าง')
        ) &&
        sections.every((s) => !elements(s, 'section').length && direct(s, 'h2').length === 1)
      failure =
        'แยกเป็น section สองส่วน แต่ละส่วนมี h2 และย่อหน้าของตัวเอง ไม่ซ้อน section หรือรวมทุกข้อความในส่วนเดียว'
      break
    }
  }
  return { ok, feedback: ok ? task.success : failure }
}
export const validateImage = (input: string) => validateTask(7, input)
