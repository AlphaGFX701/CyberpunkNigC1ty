import { useEffect, useState, useSyncExternalStore } from 'react'
import {
  PixelButton,
  PixelPanel,
  PixelIcon,
  PixelBar,
  PixelShields,
  PixelSlot,
  PixelKey,
} from './ui/PixelUI'
import { Modal } from './ui/Modal'
import { caseNarrative } from './narrative/case'
import { CityMap } from './city/CityMap'
import { MissionCanvas } from './MissionCanvas'
import { cityProgress } from './city/progression'
import { store, changeView, nodes, interact } from './model'
import { tutorial } from './tutorial/model'
import { tutorialAllows } from './tutorial/controls'
import { TutorialCoach, useTutorialState } from './tutorial/Tutorial'

const meta = caseNarrative.field

const closeOverlay = () => {
  const old = store.get().overlay
  store.set({ overlay: null })
  if (old === 'journal') tutorial.notify('journal-closed')
  if (old === 'witness') tutorial.notify('witness-closed')
  if (old === 'terminal') tutorial.notify('terminal-closed')
}
const solution = '<img src="suspect.png" alt="ผู้ต้องสงสัยสวมเสื้อคลุมสีดำอยู่หน้าร้านซ่อม">'
function Terminal({ boss = false }: { boss?: boolean }) {
  const [code, setCode] = useState('<img src="" alt="รูปภาพ">'),
    [hint, setHint] = useState(false),
    [answer, setAnswer] = useState(false),
    [feedback, setFeedback] = useState(''),
    [success, setSuccess] = useState(false)
  const [shields, setShields] = useState(3)
  const check = () => {
    const doc = new DOMParser().parseFromString(code, 'text/html'),
      img = doc.querySelector('img'),
      alt = img?.getAttribute('alt')?.trim() ?? ''
    const ok = img?.getAttribute('src') === 'suspect.png' && alt.length >= 10 && alt !== 'รูปภาพ'
    setSuccess(ok)
    if (ok) {
      if (!boss) {
        store.set({ repaired: true })
        cityProgress.recordCamRecovery()
        tutorial.notify('cam-repaired')
      }
      setFeedback('กู้ภาพสำเร็จ — src ชี้ไฟล์ได้ และ alt อธิบายสาระของภาพแล้ว')
    } else {
      if (boss) setShields((s) => (s <= 1 ? 3 : s - 1))
      setFeedback(
        'ยังเปิดภาพไม่ได้: ใช้ไฟล์ suspect.png และเขียน alt ที่บอกลักษณะผู้ต้องสงสัย ถ้าภาพไม่แสดง ผู้อ่านยังควรเข้าใจข้อมูลสำคัญ'
      )
    }
  }
  const preview = new DOMParser().parseFromString(code, 'text/html').querySelector('img')
  const canShow = preview?.getAttribute('src') === 'suspect.png'
  const srcDoc = `<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self'; style-src 'unsafe-inline'"><style>body{margin:0;padding:20px;font:15px sans-serif;background:#ecede5;color:#203039}img{height:170px;max-width:100%;object-fit:contain;display:block;margin:10px auto}small{color:#56656a}</style><small>CAM-07 / หลักฐานภาพ</small>${canShow ? '<img src="/assets/null.png" alt="ภาพผู้ต้องสงสัย">' : '<p>ยังไม่พบไฟล์ภาพ</p>'}`
  return (
    <Modal
      title={boss ? 'ตัวอย่างโจทย์บอส — คืนภาพพยาน' : 'ตัวอย่างจุดกู้ระบบ — ไฟล์ภาพที่หายไป'}
      onClose={closeOverlay}
    >
      <div className="terminal-grid">
        <section className="lesson">
          {!boss && <TutorialCoach context="terminal" inline />}
          <span className="chapter-label">HTML / IMG + ATTRIBUTES</span>
          <h3>ให้ภาพเล่าเรื่องได้อีกครั้ง</h3>
          <p>
            ชื่อไฟล์ที่พบในบันทึกคือ <code>suspect.png</code> แก้ <code>src</code> แล้วเขียน{' '}
            <code>alt</code> อธิบายผู้ต้องสงสัยให้คนที่มองไม่เห็นภาพเข้าใจ
          </p>
          {boss && (
            <p className="shield-label">
              โล่คิน <PixelShields value={shields} />
              <small>ตัวอย่างการเสียโล่และคืนโล่เมื่อลองช่วงเดิมใหม่</small>
            </p>
          )}
          <div className="hint-actions">
            <PixelButton onClick={() => setHint(!hint)} aria-expanded={hint}>
              คำใบ้
            </PixelButton>
            <PixelButton
              variant="solution"
              onClick={() => setAnswer(!answer)}
              aria-expanded={answer}
            >
              ดูเฉลย
            </PixelButton>
          </div>
          {hint && (
            <p className="hint">
              src ระบุชื่อไฟล์ ส่วน alt ใช้ข้อความบอกสาระสำคัญ ไม่ใช่แค่คำว่า “รูปภาพ”
            </p>
          )}
          {answer && <pre className="solution">{solution}</pre>}
          <p className="prototype-note">
            โจทย์สาธิตเพื่อดูรูปแบบหน้าต่าง ยังไม่ใช่ระบบ 7 จุดและบอสเต็มตอน
          </p>
        </section>
        <section className="code-area">
          <label htmlFor="code">
            evidence.html <span>เขียนโค้ดแล้วกดตรวจ</span>
          </label>
          <textarea
            className="resize-none"
            style={{ resize: 'none' }}
            id="code"
            spellCheck={false}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            aria-describedby="code-feedback"
          />
          <div className="preview-label">พรีวิวหน้าเว็บ</div>
          <iframe title="พรีวิวหน้าเว็บที่ซ่อม" sandbox="" srcDoc={srcDoc} />
          <div
            id="code-feedback"
            role="status"
            className={success ? 'feedback success' : 'feedback'}
          >
            {feedback || 'รอการตรวจคำตอบ'}
          </div>
          <PixelButton
            variant="primary"
            className="primary"
            onClick={check}
            data-tutorial-target="check-code"
          >
            {success ? 'ตรวจอีกครั้ง' : 'ตรวจและกู้ภาพ'} <span>↵</span>
          </PixelButton>
        </section>
      </div>
    </Modal>
  )
}

export function GameApp({ onMenu, active }: { onMenu: () => void; active: boolean }) {
  const state = useSyncExternalStore(store.subscribe, store.get)
  const progress = useSyncExternalStore(cityProgress.subscribe, cityProgress.get)
  const training = useTutorialState()
  const guided = Boolean(active && training.step)
  useEffect(() => {
    if (active && state.view === 'map' && state.ready)
      tutorial.activateFirstMap(progress.completed.length > 0)
  }, [active, state.view, state.ready, progress.completed.length])
  const openJournal = () => {
    if (!tutorialAllows('journal')) return
    store.set({ overlay: 'journal' })
    tutorial.notify('journal-opened')
  }
  const info = meta[state.view]
  useEffect(() => {
    store.set({ repaired: progress.completed.includes('recover-cam07') })
  }, [progress.completed])
  useEffect(() => {
    document.title = `${info.name} · TechCare รอยต่อสัญญาณ`
  }, [info.name])
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        e.isComposing ||
        e.repeat ||
        store.get().paused ||
        store.get().overlay ||
        ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
      )
        return
      if (e.key.toLowerCase() === 'j') {
        e.preventDefault()
        if (!tutorialAllows('journal')) return
        store.set({ overlay: 'journal' })
        tutorial.notify('journal-opened')
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])
  useEffect(() => {
    if (!state.toast) return
    const timer = window.setTimeout(() => store.set({ toast: '' }), 4500)
    return () => clearTimeout(timer)
  }, [state.toast])
  return (
    <div
      className="app"
      data-tutorial-map={guided && state.view === 'map' && !state.overlay && !state.paused}
      data-tutorial-field={guided && state.view !== 'map'}
    >
      <div className="game-toolbar">
        <span className="game-wordmark">
          T<span>+</span> / TECHCARE
        </span>
        {state.view !== 'map' && (
          <PixelButton
            icon="icon-back"
            onClick={() => changeView('map')}
            disabled={!tutorialAllows('return-map')}
            data-tutorial-target="return-map"
          >
            แผนที่เมือง
          </PixelButton>
        )}
        <PixelButton
          icon="icon-journal"
          onClick={openJournal}
          disabled={!tutorialAllows('journal')}
          data-tutorial-target="journal"
        >
          สมุดคดี
        </PixelButton>
        <PixelButton
          icon="icon-settings"
          onClick={onMenu}
          aria-label="เปิดเมนูเกม"
          data-tutorial-target="menu"
        >
          เมนู <PixelKey>Esc</PixelKey>
        </PixelButton>
      </div>
      <main>
        {state.view === 'map' ? (
          <CityMap
            paused={state.paused}
            reducedMotion={state.reduceMotion}
            overlay={state.overlay}
          />
        ) : (
          <>
            <div
              className="world-frame"
              data-view={state.view}
              data-player-x={Math.round(state.positions[state.view].x)}
              data-player-y={Math.round(state.positions[state.view].y)}
            >
              <MissionCanvas />
              {!state.ready && !state.error && (
                <div className="loading" role="status">
                  กำลังเตรียมฉาก…
                </div>
              )}
              {state.error && (
                <div className="loading" role="alert">
                  <p>{state.error}</p>
                  <PixelButton onClick={() => location.reload()}>โหลดใหม่</PixelButton>
                </div>
              )}
              <div className="world-tag">
                <PixelIcon name="quest-active" />
                <div>
                  <small>{info.sub}</small>
                  <h1>{info.name}</h1>
                </div>
              </div>
              {state.view === 'device' && (
                <div className="node-labels">
                  {nodes.map((n) => (
                    <span key={n.tag} style={{ left: `${n.x / 12.8}%`, top: `${n.y / 7.2 + 5}%` }}>
                      {n.title}
                    </span>
                  ))}
                </div>
              )}
              {state.view === 'street' && (
                <>
                  <span className="npc-label">ช่างอรุณ · พยาน</span>
                  <span className="device-label">
                    เครื่องบันทึกกล้อง
                    <br />
                    <small>{caseNarrative.camera.id} / เชื่อมต่ออุปกรณ์</small>
                  </span>
                </>
              )}
              {state.view === 'boss' && (
                <div className="boss-hud">
                  <div>
                    <span>WATCHER</span>
                    <small>เกราะข้อมูล / ตัวอย่างช่วงที่ 1</small>
                  </div>
                  <PixelBar kind="boss" value={100} label="เกราะข้อมูล WATCHER" segments={3} />
                </div>
              )}
              <PixelPanel variant="objective" className="objective">
                <PixelIcon name="quest-active" />
                <div>
                  <small>ภารกิจปัจจุบัน</small>
                  <strong>{info.objective}</strong>
                  <p>{info.detail}</p>
                </div>
              </PixelPanel>
              <div className="interaction">
                <PixelButton
                  onClick={() => {
                    interact()
                  }}
                  disabled={!tutorialAllows('world-interact')}
                  data-tutorial-target="world-interact"
                >
                  <PixelKey>E</PixelKey>
                  {state.view === 'boss' ? 'ดูหน้าต่างโจทย์บอส' : 'โต้ตอบกับจุดใกล้ตัว'}
                </PixelButton>
              </div>
              {state.toast && (
                <PixelPanel variant="tooltip" role="status" className="toast">
                  {state.toast}
                </PixelPanel>
              )}
            </div>
            <footer className="playbar">
              <div>
                <span>
                  <PixelKey>W A S D</PixelKey> หรือ <PixelKey>↑ ↓ ← →</PixelKey> เดิน
                </span>
                <span>
                  <PixelKey>E</PixelKey> โต้ตอบ
                </span>
                <span>
                  <PixelKey>Esc</PixelKey> ปิดหน้าต่าง
                </span>
              </div>
              <PixelButton
                disabled={Boolean(training.step)}
                onClick={() => store.set({ overlay: 'brief' })}
              >
                อ่านภารกิจ <span>↗</span>
              </PixelButton>
            </footer>
            <p className="desktop-note">
              ต้นแบบนี้ออกแบบสำหรับคอมพิวเตอร์ ใช้คีย์บอร์ดเพื่อเดินสำรวจฉาก
              หรือเลือกฉากจากเมนูด้านบน
            </p>
          </>
        )}
      </main>
      {!state.overlay && !state.paused && state.ready && (
        <TutorialCoach
          context={state.view === 'boss' ? 'device' : state.view}
          compact={state.view !== 'map'}
        />
      )}
      {active &&
        state.view === 'map' &&
        !training.step &&
        training.offered &&
        !state.paused &&
        !state.overlay && (
          <aside className="kin-offer">
            <p>คินพร้อมพาดูระบบและภารกิจแรก</p>
            <PixelButton onClick={() => tutorial.start()}>
              {training.status === 'active' ? 'ฝึกกับคินต่อ' : 'เริ่มฝึกกับคิน'}
            </PixelButton>
          </aside>
        )}
      {state.overlay === 'brief' && (
        <Modal title="แฟ้มคดี BLACKBOX" onClose={closeOverlay}>
          <div className="prose">
            <span className="chapter-label">ภารกิจเริ่มต้น / หน่วยกู้ระบบ TechCare</span>
            <h3>{caseNarrative.brief.title}</h3>
            {caseNarrative.brief.paragraphs.map((text) => (
              <p key={text}>{text}</p>
            ))}
            <div className="case-path">
              TECHCARE <span>→</span> ร้านช่าง <span>→</span> ภายในกล้อง <span>→</span> WATCHER
            </div>
            <PixelButton
              variant="primary"
              className="primary"
              disabled={Boolean(training.step)}
              onClick={() => {
                closeOverlay()
                changeView('street')
              }}
            >
              ไปพบช่างอรุณ →
            </PixelButton>
            <small>
              ในเรื่องใช้ Metasploit เป็นเครื่องมือจำลอง ภารกิจฝึก HTML/CSS อยู่ภายในเกมทั้งหมด
            </small>
          </div>
        </Modal>
      )}
      {state.overlay === 'witness' && (
        <Modal variant="dialogue" title="ช่างอรุณ / พยานคนแรก" onClose={closeOverlay}>
          <div className="prose dialogue">
            <div className="portrait">
              <img src="/assets/witness.png" alt="ช่างอรุณ" />
            </div>
            <div>
              <span className="chapter-label">ร้านซ่อม · เวลา 03:12 น.</span>
              <h3>{caseNarrative.witness.title}</h3>
              <p>{caseNarrative.witness.account}</p>
              <p className="kin-reply">{caseNarrative.witness.reply}</p>
              <PixelButton
                variant="primary"
                className="primary"
                onClick={() => {
                  if (tutorial.get().step) {
                    closeOverlay()
                    return
                  }
                  closeOverlay()
                  changeView('device')
                }}
              >
                {training.step ? 'กลับไปตรวจเครื่องกล้อง →' : 'เชื่อมต่อ CAM-07 →'}
              </PixelButton>
              <small>ตัวอย่างบทสนทนาและทางเข้าฉากอุปกรณ์</small>
            </div>
          </div>
          <TutorialCoach context="witness" inline />
        </Modal>
      )}
      {state.overlay === 'journal' && (
        <Modal variant="inventory" title="สมุดคดี — รอยต่อสัญญาณ" onClose={closeOverlay}>
          <div className="prose journal">
            <span className="chapter-label">ความคืบหน้าเควสต์และพื้นที่บันทึกในเครื่องนี้</span>
            <h3>เริ่มจากสิ่งที่คนร้ายพยายามซ่อน</h3>
            <div className="evidence-slots">
              <div>
                <PixelSlot
                  state={state.repaired ? 'selected' : 'normal'}
                  icon="icon-evidence"
                  label="ภาพหลักฐาน"
                />
                <small>หลักฐานการขนย้าย</small>
              </div>
              <div>
                <PixelSlot state="selected" icon="icon-journal" label="บันทึกพยาน" />
                <small>บันทึกพยาน</small>
              </div>
              <div>
                <PixelSlot state="locked" label="หลักฐานยังล็อก" />
                <small>ยังไม่พบ</small>
              </div>
            </div>
            <ol>
              {caseNarrative.journal.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </li>
              ))}
              <li className={state.repaired ? 'found' : ''}>
                <strong>
                  {state.repaired ? 'คืนหน้าหลักฐานตัวอย่างสำเร็จ' : 'หน้าหลักฐานที่ยังอ่านไม่ได้'}
                </strong>
                <p>ใช้ src และ alt เพื่ออ่านร่องรอยการขนย้าย BLACKBOX</p>
              </li>
              {progress.completed.includes('recover-cam07') && (
                <li>
                  <strong>เปิดเส้นทางสถานีสื่อสาร</strong>
                  <p>กลับแผนที่เมืองเพื่ออ่านข่าวกรองจากจุดส่งสัญญาณ</p>
                </li>
              )}
            </ol>
            <PixelButton
              variant="primary"
              className="primary"
              disabled={Boolean(training.step)}
              onClick={() => changeView('device')}
            >
              ไปดูโลกภายในกล้อง →
            </PixelButton>
          </div>
          <TutorialCoach context="journal" inline />
        </Modal>
      )}
      {(state.overlay === 'terminal' || state.overlay === 'boss') && (
        <Terminal boss={state.overlay === 'boss'} />
      )}
    </div>
  )
}
