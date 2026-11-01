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
import { CircuitCityMap } from './circuit/CircuitCityMap'
import { MissionCanvas } from './MissionCanvas'
import { cityProgress } from './city/progression'
import { store, changeView, enterField, nodes, interact } from './model'
import { tutorial } from './tutorial/model'
import { chapter, chapterObjective } from './chapter/model'
import { account } from './account/account'
import { relay, relayObjective } from './relay/model'
import {
  RelayDialogue,
  RelayClue,
  RelayHack,
  RelayHUD,
  RecordComparison,
} from './relay/RelayOverlay'
import {
  ChapterHUD,
  ArunDialogue,
  ClueDialogue,
  HackConnection,
  ChapterTerminal,
} from './chapter/ChapterOverlay'
import { tutorialAllows } from './tutorial/controls'
import { TutorialCoach, useTutorialState } from './tutorial/Tutorial'
import { closeGameOverlay, commandFromKeyboard, executeGameCommand } from './game-commands'

const meta = caseNarrative.field

const closeOverlay = closeGameOverlay
function Terminal({ boss = false }: { boss?: boolean }) {
  const [code, setCode] = useState('<img src="" alt="รูปภาพ">'),
    [hint, setHint] = useState(false),
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
          </div>
          {hint && (
            <p className="hint">
              src ระบุชื่อไฟล์ ส่วน alt ใช้ข้อความบอกสาระสำคัญ ไม่ใช่แค่คำว่า “รูปภาพ”
            </p>
          )}
          <p className="prototype-note">
            ฉากบอสนี้ยังเป็นโจทย์สาธิตแยก ไม่มอบหลักฐานแทนภารกิจทั้งเจ็ดที่ร้านอรุณ
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
  const learning = useSyncExternalStore(chapter.subscribe, chapter.get)
  const relayLearning = useSyncExternalStore(relay.subscribe, relay.get)
  const identity = useSyncExternalStore(account.subscribe, account.get)
  useEffect(() => {
    const { owner, generation } = account.getSaveScope()
    chapter.activateOwner(owner, generation)
    relay.activateOwner(owner, generation)
  }, [identity.resetCounter, identity.user?.id])
  const progress = useSyncExternalStore(cityProgress.subscribe, cityProgress.get)
  const training = useTutorialState()
  const guided = Boolean(active && training.step)
  useEffect(() => {
    if (active && state.view === 'map' && state.ready)
      tutorial.activateFirstMap(progress.completed.length > 0)
  }, [active, state.view, state.ready, progress.completed.length])
  const openJournal = () => {
    executeGameCommand('journal', { active })
  }
  useEffect(() => {
    if (training.step === 'traces' && learning.spoken && learning.clues.length === 2)
      tutorial.notify('clues-collected')
  }, [training.step, learning.spoken, learning.clues.length])
  const info =
    state.activeChapter === 'relay' && state.view !== 'map'
      ? {
          name: state.view === 'device' ? 'Circuit City / RELAY-02' : 'สถานีสื่อสารฝั่งตะวันออก',
          sub: 'ตอน 02 / สัญญาณที่ไม่มีในรายงาน',
          objective: relayObjective(relayLearning),
          detail: 'ตรวจต้นฉบับเพื่อตามเส้นทาง BLACKBOX',
        }
      : meta[state.view]
  useEffect(() => {
    if (!active || state.paused || state.overlay || !state.ready || training.step) return
    if (
      state.activeChapter === 'arun' &&
      progress.completed.includes('recover-cam07') &&
      !relayLearning.departureSeen &&
      (state.view === 'street' || state.view === 'map')
    )
      store.set({ overlay: 'relay-departure' })
    else if (
      state.activeChapter === 'relay' &&
      state.view === 'street' &&
      !relayLearning.arrivalSeen
    )
      store.set({ overlay: 'relay-arrival' })
    else if (
      state.activeChapter === 'relay' &&
      relayLearning.finalRecovered &&
      !relayLearning.conclusionSeen
    )
      store.set({ overlay: 'relay-conclusion' })
  }, [
    active,
    state.paused,
    state.overlay,
    state.ready,
    state.activeChapter,
    state.view,
    training.step,
    progress.completed,
    relayLearning.departureSeen,
    relayLearning.arrivalSeen,
    relayLearning.finalRecovered,
    relayLearning.conclusionSeen,
  ])
  useEffect(() => {
    store.set({ repaired: progress.completed.includes('recover-cam07') })
  }, [progress.completed])
  useEffect(() => {
    document.title = `${info.name} · TechCare รอยต่อสัญญาณ`
  }, [info.name])
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const command = commandFromKeyboard(e)
      if (!command || !active) return
      if (
        command === 'journal' &&
        store.get().ready &&
        !store.get().connectionRunning &&
        !store.get().overlay &&
        !store.get().paused &&
        tutorialAllows('journal')
      )
        document
          .querySelector<HTMLElement>('[data-tutorial-target="journal"]')
          ?.focus({ preventScroll: true })
      if (executeGameCommand(command, { active })) e.preventDefault()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [active])
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
            onClick={() => executeGameCommand('map', { active })}
            disabled={!tutorialAllows('return-map')}
            data-tutorial-target="return-map"
            aria-label="แผนที่เมือง"
            aria-keyshortcuts="M"
          >
            แผนที่เมือง{' '}
            <span aria-hidden="true">
              <PixelKey>M</PixelKey>
            </span>
          </PixelButton>
        )}
        <PixelButton
          icon="icon-journal"
          onClick={openJournal}
          disabled={!tutorialAllows('journal')}
          data-tutorial-target="journal"
          aria-label="สมุดคดี"
          aria-keyshortcuts="J"
        >
          สมุดคดี{' '}
          <span aria-hidden="true">
            <PixelKey>J</PixelKey>
          </span>
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
        ) : state.view === 'device' ? (
          <CircuitCityMap
            key={state.activeChapter}
            chapterId={state.activeChapter}
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
              {state.view === 'boss' && (
                <div className="boss-hud">
                  <div>
                    <span>WATCHER</span>
                    <small>เกราะข้อมูล / ตัวอย่างช่วงที่ 1</small>
                  </div>
                  <PixelBar kind="boss" value={100} label="เกราะข้อมูล WATCHER" segments={3} />
                </div>
              )}
              {state.view === 'boss' ? (
                <PixelPanel variant="objective" className="objective">
                  <PixelIcon name="quest-active" />
                  <div>
                    <small>ภารกิจปัจจุบัน</small>
                    <strong>{info.objective}</strong>
                    <p>{info.detail}</p>
                  </div>
                </PixelPanel>
              ) : state.activeChapter === 'relay' ? (
                <RelayHUD />
              ) : (
                <ChapterHUD />
              )}
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
            <p>
              {training.status === 'completed' || training.status === 'skipped'
                ? 'มีวิธีเลือกด่านและหน้าซ่อมใหม่ คินพร้อมพาลอง โดยไม่ล้างคดีเดิม'
                : 'คินพร้อมพาดูระบบและภารกิจแรก'}
            </p>
            <PixelButton onClick={() => tutorial.start()}>
              {training.status === 'active'
                ? 'ฝึกกับคินต่อ'
                : training.status === 'completed' || training.status === 'skipped'
                  ? 'ลองระบบใหม่กับคิน'
                  : 'เริ่มฝึกกับคิน'}
            </PixelButton>
            <button type="button" className="kin-skip" onClick={() => tutorial.dismissOffer()}>
              ไว้ทีหลัง
            </button>
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
              TECHCARE <span>→</span> ร้านช่าง <span>→</span> Circuit City <span>→</span> CAM-07
            </div>
            <PixelButton
              variant="primary"
              className="primary"
              disabled={Boolean(training.step)}
              onClick={() => {
                closeOverlay()
                enterField('arun')
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
      {state.overlay === 'relay-departure' && (
        <RelayDialogue id="departure" onClose={closeOverlay} />
      )}
      {state.overlay === 'relay-arrival' && <RelayDialogue id="arrival" onClose={closeOverlay} />}
      {state.overlay === 'relay-conclusion' && (
        <RelayDialogue id="conclusion" onClose={closeOverlay} />
      )}
      {state.overlay === 'witness' &&
        (state.activeChapter === 'relay' ? (
          <RelayDialogue id="witness" onClose={closeOverlay} />
        ) : (
          <ArunDialogue onClose={closeOverlay} />
        ))}
      {state.overlay === 'clue-receipt' &&
        (state.activeChapter === 'relay' ? (
          <RelayClue id="workorder" onClose={closeOverlay} />
        ) : (
          <ClueDialogue id="receipt" onClose={closeOverlay} />
        ))}
      {state.overlay === 'clue-relay' &&
        (state.activeChapter === 'relay' ? (
          <RelayClue id="module" onClose={closeOverlay} />
        ) : (
          <ClueDialogue id="relay" onClose={closeOverlay} />
        ))}
      {state.overlay === 'hack' &&
        (state.activeChapter === 'relay' ? (
          <RelayHack onClose={closeOverlay} />
        ) : (
          <HackConnection onClose={closeOverlay} />
        ))}
      {state.overlay === 'terminal' && (
        <ChapterTerminal
          key={`${identity.user?.id ?? 'guest'}:${identity.resetCounter}:${state.activeChapter}:${state.taskIndex}`}
          chapterId={state.activeChapter}
          onClose={closeOverlay}
        />
      )}
      {state.overlay === 'recovery' && (
        <ChapterTerminal
          key={`${identity.user?.id ?? 'guest'}:${identity.resetCounter}:${state.activeChapter}`}
          chapterId={state.activeChapter}
          final
          onClose={closeOverlay}
        />
      )}
      {state.overlay === 'journal' && (
        <Modal variant="inventory" title="สมุดคดี — รอยต่อสัญญาณ" onClose={closeOverlay}>
          <div className="prose journal">
            <span className="chapter-label">ความคืบหน้าเควสต์และพื้นที่บันทึกในเครื่องนี้</span>
            <h3>เริ่มจากสิ่งที่คนร้ายพยายามซ่อน</h3>
            <h4>ตอน 2 — สัญญาณที่ไม่มีในรายงาน</h4>
            <p>{relayObjective(relayLearning)}</p>
            <p>
              ร่องรอยสถานีในเครื่องนี้ {relayLearning.clues.length}/2 · HTML{' '}
              {relayLearning.completed.length}/7 · ต้นฉบับ{' '}
              {progress.completed.includes('recover-relay') ? 'กู้แล้ว' : 'ยังไม่กู้'}
            </p>
            {progress.completed.includes('recover-relay') && <RecordComparison />}
            <p>{chapterObjective(learning)}</p>
            <p>
              บันทึกการฝึก HTML: {learning.completed.length}/7 · ร่องรอย {learning.clues.length}/2
            </p>
            <ol>
              {learning.observations.slice(0, 7).map((item, i) => (
                <li key={i}>
                  จุด {i + 1}: {learning.completed.includes(i) ? 'ผ่านแล้ว' : 'รอซ่อม'} ·{' '}
                  {item.revealed
                    ? 'เคยดูเฉลยในเวอร์ชันก่อน'
                    : item.usedHint
                      ? 'ใช้คำใบ้'
                      : item.attempts
                        ? 'ลองด้วยตนเอง'
                        : 'ยังไม่เริ่ม'}
                </li>
              ))}
            </ol>
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
                <PixelSlot
                  state={progress.completed.includes('recover-relay') ? 'selected' : 'locked'}
                  label="บันทึกต้นฉบับ RELAY-02"
                />
                <small>
                  {progress.completed.includes('recover-relay')
                    ? 'บันทึกต้นฉบับ RELAY-02'
                    : 'ต้นฉบับยังล็อก'}
                </small>
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
                  {state.repaired ? 'กู้หน้าหลักฐาน CAM-07 สำเร็จ' : 'หน้าหลักฐานที่ยังอ่านไม่ได้'}
                </strong>
                <p>ใช้ src และ alt เพื่ออ่านร่องรอยการขนย้าย BLACKBOX</p>
              </li>
              {progress.completed.includes('recover-cam07') && (
                <li>
                  <strong>เปิดเส้นทางสถานีสื่อสาร</strong>
                  <p>เดินทางไปสถานีสื่อสาร คุยเจ้าหน้าที่และกู้บันทึก RELAY-02</p>
                </li>
              )}
            </ol>
            <PixelButton
              variant="primary"
              className="primary"
              disabled={
                Boolean(training.step) ||
                !(state.activeChapter === 'relay' ? relay.canHack() : chapter.canHack())
              }
              onClick={() => changeView('device')}
            >
              เปิด Circuit City →
            </PixelButton>
          </div>
          <TutorialCoach context="journal" inline />
        </Modal>
      )}
      {state.overlay === 'boss' && <Terminal boss />}
    </div>
  )
}
