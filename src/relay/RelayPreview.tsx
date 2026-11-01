import { useEffect, useState } from 'react'

const style =
  'body{background:#091722;color:#e3f3f5;font:18px/1.7 Tahoma,sans-serif;padding:18px;margin:0}a{color:#86e6ef;text-decoration:underline}h1{font-size:26px}h2{font-size:22px}section{border:1px solid #315563;padding:14px;margin:16px 0}section:target{outline:2px solid #e9bc6e}small{color:#9cb8c1}li{margin:8px 0}.tag{color:#f0ce86}header,footer{padding:10px;border-bottom:1px solid #315563}table{border-collapse:collapse;width:100%}td,th{border:1px solid #315563;padding:10px;text-align:left}'
const page = (body: string) =>
  `<!doctype html><html lang="th"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; form-action 'none'; base-uri 'none'"><style>${style}</style></head><body>${body}</body></html>`

/** Only these three fictional documents can be reached; no arbitrary URLs enter the iframe. */
export function resolveRelayLink(raw: string, fixtures: Readonly<Record<string, string>>) {
  const path = raw.replace(/^\.\//, '')
  if (/^#[A-Za-z][\w-]*$/.test(path)) return path
  return Object.hasOwn(fixtures, path) ? fixtures[path] : null
}
function sanitize(source: string, fixtures: Readonly<Record<string, string>>) {
  const doc = new DOMParser().parseFromString(source, 'text/html')
  doc
    .querySelectorAll(
      'script,style,link,iframe,object,embed,base,meta,form,svg,math,template,audio,video,source'
    )
    .forEach((node) => node.remove())
  doc.querySelectorAll('*').forEach((node) => {
    const link =
      node.tagName === 'A' ? resolveRelayLink(node.getAttribute('href') ?? '', fixtures) : null
    for (const attribute of [...node.attributes]) {
      // Allow only harmless semantics. In particular remove target, ping, download, src and all event handlers.
      if (!['id', 'lang', 'title', 'alt', 'role', 'aria-label'].includes(attribute.name))
        node.removeAttribute(attribute.name)
    }
    if (node.tagName === 'A' && link) node.setAttribute('href', link)
    if (node.tagName === 'IMG') node.remove()
  })
  return page(doc.body.innerHTML)
}

export function RelayPreview({ source, stageIndex = 0 }: { source: string; stageIndex?: number }) {
  const [revision, setRevision] = useState(0)
  const [fixture, setFixture] = useState<Readonly<Record<string, string>> | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  useEffect(() => {
    const urls: string[] = []
    const create = (body: string) => {
      const url = URL.createObjectURL(new Blob([page(body)], { type: 'text/html' }))
      urls.push(url)
      return url
    }
    const original =
      stageIndex === 7
        ? create(
            '<small>RELAY-02 / ORIGINAL RECORD — เอกสารจำลอง</small><h1>บันทึกต้นฉบับ</h1><p class="tag">อุปกรณ์ BLACKBOX-17</p><table><tr><th>เวลา</th><th>รายการ</th></tr><tr><td>03:16</td><td>รับอุปกรณ์</td></tr><tr><td>03:18</td><td>เชื่อมต่อ RELAY-02</td></tr><tr><td>03:21</td><td>ส่งต่อไปศูนย์ควบคุม</td></tr></table><section><h2>สำเนาผู้ว่าจ้าง</h2><p>มีรายการรับและเชื่อมต่อ แต่ไม่มีรายการส่งต่อ 03:21</p><p>ยังไม่ทราบว่าใครตัดรายการออก</p></section><small>นี่คือพรีวิว การเปิดแฟ้มไม่ให้คะแนน ต้องส่งคำสั่งซ่อมจึงยืนยันหลักฐาน</small>'
          )
        : null
    const arrival =
      stageIndex >= 1
        ? create(
            `<small>LOGS / ARRIVAL — เอกสารจำลอง</small><h1>บันทึกรับอุปกรณ์</h1><p>03:16 รับอุปกรณ์ BLACKBOX-17 ผ่านช่อง RELAY-02</p>${original ? `<a href="${original}">อ่านบันทึกต้นฉบับ</a>` : '<small>แฟ้มต้นฉบับยังล็อก คืนระบบเจ็ดเขตก่อน</small>'}`
          )
        : null
    const station = create(
      `<small>STATION / RELAY-02 — เอกสารจำลอง</small><h1>แฟ้มสถานีฝั่งตะวันออก</h1><p>สถานีได้รับคำสั่งปิดพื้นที่ แต่ระบบบันทึกยังเก็บรายการหลัง 03:12</p>${arrival ? `<a href="${arrival}">เปิดบันทึกรับอุปกรณ์</a>` : '<small>แฟ้มรับอุปกรณ์รอซ่อมเส้นทางในเขตถัดไป</small>'}`
    )
    setFixture({
      'station.html': station,
      ...(arrival ? { 'logs/arrival.html': arrival } : {}),
      ...(original ? { 'logs/original.html': original } : {}),
    })
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [stageIndex])
  useEffect(() => {
    if (!fixture) return
    const url = URL.createObjectURL(new Blob([sanitize(source, fixture)], { type: 'text/html' }))
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [source, fixture])
  // Same-origin is needed to navigate parent-created Blob documents. Scripts, forms,
  // popups and top navigation remain sandboxed; source URLs are replaced by our allowlist.
  // A Blob document also gives #id a real document base. In srcdoc, a plain #id
  // can resolve against the app URL and reload the app inside the preview.
  return (
    <div className="relay-preview">
      <div className="relay-preview-toolbar">
        <small>แฟ้มจำลองเปิดภายในพรีวิว · การเปิดแฟ้มไม่ให้คะแนน</small>
        <button type="button" onClick={() => setRevision((v) => v + 1)}>
          กลับพรีวิวโค้ด ↺
        </button>
      </div>
      <iframe
        key={revision}
        title="พรีวิวหน้าเว็บภารกิจ"
        sandbox="allow-same-origin"
        src={previewUrl || 'about:blank'}
      />
    </div>
  )
}
