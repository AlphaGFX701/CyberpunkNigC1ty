import { useEffect, useState } from 'react'
import {
  PixelBar,
  PixelButton,
  PixelIcon,
  PixelKey,
  PixelPanel,
  PixelShields,
  PixelSlot,
  uiManifest,
  type SpriteName,
  type ButtonKind,
} from './PixelUI'

const categories: Record<string, string> = {
  all: 'ทั้งหมด',
  buttons: 'ปุ่ม',
  panels: 'กรอบ',
  bars: 'แถบพลัง',
  shields: 'โล่',
  slots: 'ช่องไอเทม',
  icons: 'ไอคอน',
  quests: 'เควสต์',
  selectors: 'ตัวเลือก',
  minimap: 'มินิแมพ',
}
export function AssetGallery() {
  const [category, setCategory] = useState('all'),
    [backdrop, setBackdrop] = useState('dark'),
    [message, setMessage] = useState('ลองชี้เมาส์ กดปุ่ม หรือใช้ Tab เพื่อดูกรอบโฟกัส'),
    [health, setHealth] = useState(72)
  useEffect(() => {
    document.title = 'ชุด Pixel UI 55 ชิ้น · TechCare'
  }, [])
  const all = Object.entries(uiManifest.sprites) as [
    SpriteName,
    (typeof uiManifest.sprites)[SpriteName],
  ][]
  const visible = all.filter(([, s]) => category === 'all' || s.group === category)
  return (
    <div className="asset-page">
      <header className="kit-header">
        <a href="/" className="kit-brand">
          TECHCARE <span>/ PIXEL UI</span>
        </a>
        <a href="/" className="return-link">
          ← กลับเข้าเกม
        </a>
        <a href="/assets/ui/techcare-pixel-ui.zip" download className="pack-download">
          ดาวน์โหลดชุด Asset ZIP ↓
        </a>
      </header>
      <main className="kit-main">
        <section className="kit-intro">
          <div>
            <span className="eyebrow">FIELD EQUIPMENT / VERSION 1.0</span>
            <h1>ชุดเครื่องมือของหน่วยกู้ระบบ</h1>
            <p>55 สไปรต์ต้นฉบับ · PNG โปร่งใส · SVG แก้ไขได้ · Atlas สำหรับ React และ Phaser</p>
          </div>
          <div className="palette" aria-label="สีประจำชุด">
            {['#142732', '#617f85', '#90c5c0', '#e7bf77', '#ed9fba'].map((c) => (
              <span key={c} title={c} style={{ background: c }} />
            ))}
          </div>
        </section>
        <div className="workbench scene-backdrop">
          <PixelPanel variant="dialogue" className="demo-dialogue">
            <div className="sample-label">
              <PixelIcon name="quest-new" /> บทสนทนา / กรอบยืดได้
            </div>
            <h2>“อย่าเพิ่งปิดเครื่อง… ภาพยังอยู่”</h2>
            <p>
              เราต้องกู้บันทึกกล้องก่อนที่ NULL จะลบหลักฐานชิ้นสุดท้าย
              ช่างอรุณกำลังรออยู่ที่ร้านซ่อม
            </p>
            <div className="demo-actions">
              <PixelButton
                variant="primary"
                icon="icon-interact"
                onClick={() => setMessage('ปุ่มหลักทำงาน — บทสนทนาตัวอย่าง')}
              >
                ตรวจเครื่องกล้อง
              </PixelButton>
              <PixelButton
                variant="solution"
                onClick={() => setMessage('ปุ่มเฉลยสีชมพู — ในเกมใช้เปิดคำตอบตัวอย่าง')}
              >
                ดูเฉลย
              </PixelButton>
              <PixelButton
                variant="icon"
                icon="icon-close"
                aria-label="ทดสอบปุ่มปิด"
                onClick={() => setMessage('ปุ่มไอคอนปิดทำงาน')}
              />
            </div>
          </PixelPanel>
          <div className="demo-hud">
            <PixelPanel variant="window" className="combat-demo">
              <div className="sample-label">WATCHER / เกราะข้อมูล</div>
              <PixelBar kind="boss" value={health} label="เกราะบอสตัวอย่าง" segments={3} />
              <div className="demo-shields">
                <span>โล่คิน</span>
                <PixelShields value={2} />
              </div>
              <PixelBar kind="shield" value={2} max={3} label="พลังโล่ตัวอย่าง" segments={3} />
              <div className="demo-bar-control">
                <label htmlFor="demo-health">ตัวอย่างพลัง {health}%</label>
                <input
                  id="demo-health"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={health}
                  onChange={(e) => setHealth(Number(e.target.value))}
                />
              </div>
            </PixelPanel>
            <PixelPanel variant="inventory" className="inventory-demo">
              <div className="sample-label">หลักฐานในคดี</div>
              <div className="sample-slots">
                <PixelSlot state="selected" icon="icon-evidence" label="ช่องเลือกอยู่ มีหลักฐาน" />
                <PixelSlot icon="icon-journal" label="ช่องปกติ มีบันทึก" />
                <PixelSlot state="locked" label="ช่องล็อก" />
              </div>
              <PixelBar value={30} max={70} label="ความคืบหน้าตัวอย่าง" />
            </PixelPanel>
          </div>
        </div>
        <div className="kit-status" role="status">
          {message}
        </div>
        <section className="button-lab">
          <div className="section-heading">
            <span className="eyebrow">INPUT STATES</span>
            <h2>ปุ่มหนึ่งชุด ครบทุกสถานะ</h2>
          </div>
          <div className="state-table">
            <div className="state-head">
              <span>รูปแบบ</span>
              <span>ปกติ</span>
              <span>ชี้เมาส์</span>
              <span>กด</span>
              <span>ปิดใช้งาน</span>
            </div>
            {(['primary', 'secondary', 'solution', 'icon'] as ButtonKind[]).map((kind) => (
              <div className="state-row" key={kind}>
                <strong>
                  {
                    { primary: 'ปุ่มหลัก', secondary: 'ปุ่มรอง', solution: 'เฉลย', icon: 'ไอคอน' }[
                      kind
                    ]
                  }
                </strong>
                {['normal', 'hover', 'pressed', 'disabled'].map((state) => (
                  <PixelButton
                    key={state}
                    variant={kind}
                    data-preview-state={state}
                    disabled={state === 'disabled'}
                    icon={kind === 'icon' ? 'icon-settings' : undefined}
                    aria-label={kind === 'icon' ? `ไอคอนตั้งค่า สถานะ ${state}` : undefined}
                    onClick={() => setMessage(`ทดสอบปุ่ม ${kind} / ${state} สำเร็จ`)}
                  >
                    {kind === 'icon' ? null : kind === 'solution' ? 'ดูเฉลย' : 'ตรวจระบบ'}
                  </PixelButton>
                ))}
              </div>
            ))}
          </div>
        </section>
        <section className="slice-lab">
          <div className="section-heading">
            <span className="eyebrow">NINE-SLICE / TEXT STAYS LIVE</span>
            <h2>กรอบเปลี่ยนขนาด ตัวหนังสือยังอ่านง่าย</h2>
          </div>
          <div className="slice-examples">
            <PixelPanel className="slice-small">
              <h3>หน้าต่างขนาดเล็ก</h3>
              <p>กรอบพิกเซลยืดพื้นที่กลาง มุมยังคงสัดส่วนเดิม</p>
              <PixelKey>E</PixelKey> โต้ตอบ
            </PixelPanel>
            <PixelPanel variant="tooltip" className="slice-wide">
              <h3>ข้อความไทยยาวก็ขยายพื้นที่ได้</h3>
              <p>
                คำใบ้: <code>src</code> ระบุชื่อไฟล์ภาพ ส่วน <code>alt</code>{' '}
                อธิบายข้อมูลสำคัญให้ผู้อ่านที่มองไม่เห็นภาพเข้าใจ บรรทัดข้อความไม่ถูกฝังลงใน PNG
                จึงเปลี่ยนภาษาและขนาดได้
              </p>
            </PixelPanel>
            <PixelPanel variant="minimap" className="minimap-demo">
              <div className="sample-label">มินิแมพ / ตัวอย่าง Asset</div>
              <div className="map-demo-field">
                <span className="demo-path" />
                <PixelIcon name="map-player" />
                <PixelIcon name="map-npc" />
                <PixelIcon name="map-device" />
                <PixelIcon name="map-exit" />
              </div>
              <small>ใช้ตรวจภาพ · ยังไม่ใช่มินิแมพในเกม</small>
            </PixelPanel>
          </div>
        </section>
        <section className="sprite-browser">
          <div className="section-heading">
            <span className="eyebrow">SPRITE LIBRARY / 55 ORIGINALS</span>
            <h2>ไฟล์พร้อมใช้ทีละชิ้น</h2>
            <p>คลิกชื่อไฟล์เพื่อดาวน์โหลด PNG ขนาดต้นฉบับ ช่องตัวอย่างขยายด้วย nearest-neighbor</p>
          </div>
          <nav className="category-nav" aria-label="หมวด Asset">
            {Object.entries(categories).map(([id, label]) => (
              <button key={id} onClick={() => setCategory(id)} aria-pressed={category === id}>
                {label}
                <small>{id === 'all' ? 55 : all.filter(([, s]) => s.group === id).length}</small>
              </button>
            ))}
          </nav>
          <div className="backdrop-switch" aria-label="เปลี่ยนพื้นหลังตัวอย่าง">
            <span>ตรวจพื้นโปร่งใส:</span>
            {[
              ['dark', 'พื้นเข้ม'],
              ['light', 'พื้นอ่อน'],
              ['scene', 'พื้นฉาก'],
            ].map(([id, label]) => (
              <button key={id} aria-pressed={backdrop === id} onClick={() => setBackdrop(id)}>
                {label}
              </button>
            ))}
          </div>
          <p className="sprite-count" aria-live="polite">
            แสดง {visible.length} จาก 55 ชิ้น
          </p>
          <div className={`sprite-grid backdrop-${backdrop}`}>
            {visible.map(([name, s]) => (
              <article className="sprite-card" key={name} data-sprite={name}>
                <div className="sprite-preview">
                  <img
                    src={s.file}
                    alt={s.label}
                    width={s.width}
                    height={s.height}
                    style={{
                      width: s.width * (s.width > 80 ? 1 : 2),
                      height: s.height * (s.width > 80 ? 1 : 2),
                    }}
                  />
                </div>
                <div className="sprite-card-info">
                  <h3>{s.label}</h3>
                  <a download={`${name}.png`} href={s.file}>
                    {name}.png ↓
                  </a>
                  <small>
                    {s.width} × {s.height} px {s.nineSlice ? ` / slice ${s.nineSlice.top}px` : ''}
                  </small>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="atlas-section">
          <div>
            <span className="eyebrow">SHARED ATLAS</span>
            <h2>ภาพชุดเดียว ใช้ร่วมกันทั้งเกม</h2>
            <p>Atlas PNG พร้อมข้อมูลเฟรมและ manifest ระบุขนาด ขอบ nine-slice และไฟล์ต้นฉบับ SVG</p>
            <a href="/assets/ui/atlas.png" download>
              ดาวน์โหลด Atlas PNG ↓
            </a>
            <a href="/assets/ui/atlas.json" download>
              ข้อมูลเฟรม JSON ↓
            </a>
            <a href="/assets/ui/manifest.json" download>
              Manifest + Nine-slice ↓
            </a>
          </div>
          <div className="atlas-image">
            <img
              src="/assets/ui/atlas.png"
              alt="Atlas รวมสไปรต์ TechCare ทั้ง 55 ชิ้น"
              width={512}
              height={224}
            />
          </div>
        </section>
        <footer className="kit-footer">
          ออกแบบใหม่สำหรับ TechCare · ไม่มีตัวหนังสือฝังในสไปรต์ ·
          ไอคอนเอฟเฟกต์เสียงและมินิแมพเป็นไฟล์สำหรับระบบที่จะพัฒนาต่อ
        </footer>
      </main>
    </div>
  )
}
