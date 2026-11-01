import { finalTask, tasks } from './content.ts'

export type AnswerResult = Readonly<{ ok: boolean; feedback: string; line?: number }>
export type Element = { tag: string; attrs: Record<string, string>; children: (Element | string)[]; offset: number }
type Parsed = { root: Element; doctype: boolean; error: string; line?: number }
const voidTags = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
])
const forbidden = new Set(['script', 'iframe', 'object', 'embed'])
const decode = (value: string) =>
  value
    .replace(/&(?:nbsp|#160);/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
const normalize = (value: string) => decode(value).replace(/\s+/g, ' ').trim()
const text = (node: Element): string =>
  normalize(
    node.children.map((child) => (typeof child === 'string' ? child : text(child))).join('')
  )
const elements = (node: Element, tag: string): Element[] =>
  node.children.flatMap((child) =>
    typeof child === 'string'
      ? []
      : [...(child.tag === tag ? [child] : []), ...elements(child, tag)]
  )
const direct = (node: Element, tag: string) =>
  node.children.filter((child): child is Element => typeof child !== 'string' && child.tag === tag)
const descendants = (node: Element): Element[] =>
  node.children.flatMap((child) =>
    typeof child === 'string' ? [] : [child, ...descendants(child)]
  )

/** A non-executing structural reader for these short beginner tasks, not an HTML renderer.
 * Requires explicit closing tags as taught by the exercises; accepts case, quote and spacing variations.
 * It keeps nesting errors visible instead of silently repairing them like the browser preview does.
 */
function parse(source: string): Parsed {
  const root: Element = { tag: '#root', attrs: {}, children: [], offset: 0 }
  const stack = [root]
  let offset = 0,
    doctype = false,
    error = '',
    currentOffset = 0
  let errorLine: number | undefined
  const fail = (message: string, at = currentOffset) => {
    if (!error) {
      error = message
      errorLine = source.slice(0, at).split('\n').length
    }
  }
  const token =
    /<!--[\s\S]*?-->|<!doctype\s+html\s*>|<\/?[a-z][^<>"']*(?:(?:"[^"]*"|'[^']*')[^<>"']*)*>/gi
  for (const match of source.matchAll(token)) {
    currentOffset = match.index
    const before = source.slice(offset, match.index)
    if (before.includes('<'))
      fail('มีเครื่องหมาย < ที่ยังไม่เป็นแท็กครบชุด ตรวจวงเล็บเปิด–ปิดอีกครั้ง', offset + before.indexOf('<'))
    stack.at(-1)!.children.push(before)
    offset = match.index + match[0].length
    const raw = match[0]
    if (raw.startsWith('<!--')) continue
    if (/^<!doctype/i.test(raw)) {
      if (
        doctype ||
        stack.length !== 1 ||
        root.children.some((child) => typeof child !== 'string' || child.trim())
      )
        fail('วาง <!DOCTYPE html> เพียงครั้งเดียวก่อนเริ่มเอกสาร')
      doctype = true
      continue
    }
    const closing = /^<\//.test(raw)
    const tag = /^<\/?([a-z][\w:-]*)/i.exec(raw)![1].toLowerCase()
    if (forbidden.has(tag))
      fail('โจทย์นี้ใช้เฉพาะ HTML สำหรับเนื้อหา ไม่ต้องเพิ่มสคริปต์หรือกรอบเว็บอื่น')
    if (closing) {
      if (!/^<\/[a-z][\w:-]*\s*>$/i.test(raw)) fail('แท็กปิดใช้เพียงชื่อแท็ก เช่น </p>')
      if (stack.length === 1 || stack.at(-1)!.tag !== tag)
        fail(`ลำดับแท็กปิดยังไม่ตรง: พบ </${tag}> ขณะรอปิด <${stack.at(-1)!.tag}>`)
      else stack.pop()
      continue
    }
    const attrs: Record<string, string> = {}
    const body = raw.replace(/^<[a-z][\w:-]*/i, '').replace(/\/?\s*>$/, '')
    const attribute = /\s+([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/gy
    let at = 0
    while (at < body.length) {
      if (!body.slice(at).trim()) break
      attribute.lastIndex = at
      const a = attribute.exec(body)
      if (!a) {
        fail('รูปแบบแอตทริบิวต์ยังไม่ครบ ลองใช้ชื่อ="ค่า" และเว้นวรรคก่อนชื่อ')
        break
      }
      const key = a[1].toLowerCase()
      if (key in attrs) fail(`แอตทริบิวต์ ${key} ซ้ำในแท็กเดียวกัน`)
      attrs[key] = decode(a[2] ?? a[3] ?? a[4] ?? '')
      if (key.startsWith('on')) fail('โจทย์นี้ไม่ต้องใช้ event handler หรือ JavaScript')
      at = attribute.lastIndex
    }
    const element: Element = { tag, attrs, children: [], offset: match.index }
    stack.at(-1)!.children.push(element)
    if (!voidTags.has(tag)) {
      if (/\/\s*>$/.test(raw)) fail(`แท็ก ${tag} ต้องปิดด้วย </${tag}> ในโจทย์นี้`)
      stack.push(element)
    }
  }
  const tail = source.slice(offset)
  if (tail.includes('<')) fail('แท็กสุดท้ายยังไม่ครบ ตรวจเครื่องหมาย < และ >', offset + tail.indexOf('<'))
  stack.at(-1)!.children.push(tail)
  if (stack.length > 1) fail(`ยังไม่ได้ปิด <${stack.at(-1)!.tag}> ให้ครบในโจทย์นี้`, stack.at(-1)!.offset)
  return { root, doctype, error, line: errorLine }
}

const result = (ok: boolean, success: string, failure: string): AnswerResult => ({
  ok,
  feedback: ok ? success : failure,
})

export function validateTask(index: number, input: string): AnswerResult {
  const task = tasks[index]
  if (!task) return { ok: false, feedback: 'ไม่พบภารกิจนี้' }
  if (typeof input !== 'string' || input.length > 12000)
    return { ok: false, feedback: 'ใช้คำตอบสั้นเฉพาะโจทย์นี้ ไม่เกิน 12,000 ตัวอักษร' }
  if (task.kind === 'filename')
    return result(
      /^index\.html?$/i.test(input.trim()),
      task.success,
      'ให้คงชื่อ index และใช้สกุล .html หรือ .htm โดยไม่มี .txt ต่อท้าย'
    )
  const { root, doctype, error, line } = parse(input)
  if (error) return { ok: false, feedback: error, line }
  const html = direct(root, 'html')[0]
  const body = html && direct(html, 'body')[0]
  switch (index) {
    case 0:
      return result(
        Boolean(
          html &&
          body &&
          elements(body, 'p').some((p) => text(p) === 'ร้านอรุณเปิดแล้ว') &&
          !elements(html, 'head').some((head) => elements(head, 'p').length)
        ),
        task.success,
        'ย่อหน้า “ร้านอรุณเปิดแล้ว” ต้องอยู่ใน body ของ html ไม่อยู่ใน head'
      )
    case 2:
      return result(
        Boolean(
          doctype && html && body && elements(body, 'p').some((p) => text(p) === 'CAM-07 พร้อมตรวจ')
        ),
        task.success,
        'เติม <!DOCTYPE html> ก่อน html แล้วคงย่อหน้า “CAM-07 พร้อมตรวจ” ไว้ใน body'
      )
    case 3:
      return result(
        elements(root, 'p').some((p) =>
          direct(p, 'strong').some((strong) => text(strong) === 'ลายเซ็นหน่วยเก่า')
        ),
        task.success,
        'ให้ strong อยู่ข้างใน p และครอบข้อความ “ลายเซ็นหน่วยเก่า” ก่อนปิด strong แล้วจึงปิด p'
      )
    case 4:
      return result(
        Boolean(
          html &&
          /^th(?:-th)?$/i.test(html.attrs.lang ?? '') &&
          body &&
          elements(body, 'p').some((p) => text(p) === 'บันทึกการขนย้าย')
        ),
        task.success,
        'ใส่ lang="th" ที่แท็กเปิด html และเก็บย่อหน้าเดิมไว้ใน body'
      )
    case 5: {
      const main = elements(root, 'h1'),
        sub = elements(root, 'h2')
      const ordered = descendants(root)
        .filter((element) => /^h[1-6]$/.test(element.tag))
        .map((element) => element.tag)
      return result(
        main.length === 1 &&
          sub.length === 1 &&
          text(main[0]) === 'แฟ้ม BLACKBOX' &&
          text(sub[0]) === 'เส้นทางขนย้าย' &&
          ordered.join(',') === 'h1,h2',
        task.success,
        'ใช้ h1 หนึ่งหัวข้อสำหรับ “แฟ้ม BLACKBOX” ตามด้วย h2 สำหรับ “เส้นทางขนย้าย” ไม่ใช้ h3 หรือ h1 ซ้ำ'
      )
    }
    case 6: {
      const paragraphs = elements(root, 'p')
      return result(
        paragraphs.length === 2 &&
          text(paragraphs[0]) === 'รถออกเวลา 03:12' &&
          text(paragraphs[1]) === 'มุ่งหน้าไปสถานีสื่อสาร',
        task.success,
        'ต้องมี p สองย่อหน้าแยกกัน: เวลาออกในย่อหน้าแรก ปลายทางในย่อหน้าที่สอง การขึ้นบรรทัดในโค้ดอย่างเดียวไม่แยกย่อหน้า'
      )
    }
    default:
      return { ok: false, feedback: 'ภารกิจยังไม่พร้อมตรวจ' }
  }
}

export function validateImage(input: string): AnswerResult {
  if (typeof input !== 'string' || input.length > 12000)
    return { ok: false, feedback: 'ใช้โค้ด img สั้น ๆ สำหรับภาพหลักฐาน' }
  const { root, error, line } = parse(input)
  if (error) return { ok: false, feedback: error, line }
  const images = elements(root, 'img')
  const ok = images.some(
    (image) =>
      /^(?:\.\/)?suspect\.png$/.test(image.attrs.src ?? '') &&
      normalize(image.attrs.alt ?? '').length >= 4 &&
      !/^(?:image|photo|picture|รูป|ภาพ|suspect\.png)$/i.test(normalize(image.attrs.alt ?? ''))
  )
  return result(
    ok,
    finalTask.success,
    'ใช้ img ที่มี src="suspect.png" และ alt ที่บอกสาระของภาพ เช่น “ผู้ต้องสงสัยเสื้อดำหน้าร้าน” ไม่ใช้ source หรือปล่อย alt ว่าง'
  )
}

// Shared non-executing structural reader; chapter-specific acceptance stays in each chapter.
export { parse as parseHtml, elements, direct, text, descendants }
