import { useEffect, useState, useSyncExternalStore } from 'react'
import { Modal } from '../ui/Modal'
import { DialogueSurface } from '../ui/DialogueSurface'
import { executeGameCommand } from '../game-commands'
import { PixelButton, PixelKey } from '../ui/PixelUI'
import { store, changeView } from '../model'
import { useDialogueAudio } from '../tutorial/Tutorial'
import { relay, relayGuidance, relayObjective, relayScore } from './model'
import { relayClues, type ClueId } from './content'
import { relayStory, type RelayStoryId, type RelayLine } from './story'
import { cityProgress } from '../city/progression'
import './relay.css'

function useSpeech(text: string, speaker: RelayLine['speaker'] = 'คิน') {
  const { audio, talkSound, active, dialog } = useDialogueAudio()
  const world = useSyncExternalStore(store.subscribe, store.get)
  useEffect(() => {
    if (text && active && !dialog && !world.paused && talkSound)
      return audio?.playTalkLine(
        text,
        speaker === 'คิน' ? 'kin' : speaker === 'อรุณ' ? 'arun' : 'system'
      )
  }, [audio, talkSound, active, dialog, world.paused, text, speaker])
}
function Portrait({ speaker }: { speaker: RelayLine['speaker'] }) {
  const { reducedMotion } = useDialogueAudio()
  const [failed, setFailed] = useState(false)
  const [frame, setFrame] = useState('idle')
  useEffect(() => {
    setFailed(false)
    setFrame('idle')
    if (speaker !== 'คิน' || reducedMotion) return
    let tick = 0
    const timer = setInterval(() => {
      tick++
      setFrame(tick < 10 ? (tick % 2 ? 'talk' : 'idle') : tick % 24 === 0 ? 'blink' : 'idle')
    }, 160)
    return () => clearInterval(timer)
  }, [speaker, reducedMotion])
  if (speaker === 'ระบบ')
    return (
      <div
        className="relay-portrait relay-system-face"
        data-reduced={reducedMotion}
        aria-hidden="true"
      >
        <b>SYS</b>
        <span>RELAY / LOCAL</span>
        <i />
      </div>
    )
  const source =
    speaker === 'คิน'
      ? `/assets/tutorial/kin/smirk-${frame}.png`
      : speaker === 'อรุณ'
        ? '/assets/chapter-one/characters/arun-smile.webp'
        : speaker === 'เจ้าหน้าที่เวร'
          ? '/assets/relay/characters/officer-portrait.webp'
          : speaker === 'NULL'
            ? '/assets/entry/null.webp'
            : '/assets/relay/characters/officer-portrait.webp'
  return (
    <div className="relay-portrait" data-reduced={reducedMotion} aria-hidden="true">
      {!failed ? (
        <img src={source} alt="" onError={() => setFailed(true)} />
      ) : (
        <span>{speaker}</span>
      )}
      <i />
    </div>
  )
}
export function RelayDialogue({ id, onClose }: { id: RelayStoryId; onClose: () => void }) {
  const [turn, setTurn] = useState(0)
  const shot = relayStory[id],
    line = shot.lines[turn]
  const { audio, reducedMotion } = useDialogueAudio()
  useSpeech(line.text, line.speaker)
  useEffect(() => {
    const stop = audio?.playCue(id === 'conclusion' ? 'static' : 'relay')
    return stop
  }, [id, audio])
  const finish = () => {
    if (id === 'witness') {
      relay.talkToOfficer()
      audio?.playCue('door-open')
    } else if (id === 'departure' || id === 'arrival' || id === 'conclusion') relay.markStory(id)
    onClose()
    if (id === 'departure' || id === 'conclusion') changeView('map')
  }
  return (
    <Modal
      title={shot.title}
      variant="dialogue"
      placement="dialogue"
      onClose={id === 'witness' ? onClose : finish}
    >
      <section className="relay-dialogue" data-story={id} data-reduced={reducedMotion}>
        {id === 'conclusion' && (
          <div className="dialogue-evidence-above relay-evidence-above">
            <RecordComparison />
          </div>
        )}
        <DialogueSurface
          speaker={line.speaker}
          portrait={<Portrait key={`${line.speaker}:${turn}`} speaker={line.speaker} />}
          channel={shot.location}
          reducedMotion={reducedMotion}
          text={line.text}
          actions={
            <>
              <small>
                {turn + 1} / {shot.lines.length}
              </small>
              <PixelButton
                disabled={!turn}
                onClick={() => setTurn((current) => Math.max(0, current - 1))}
              >
                ย้อนกลับ
              </PixelButton>
              <PixelButton
                variant="primary"
                onClick={() =>
                  turn === shot.lines.length - 1
                    ? finish()
                    : setTurn((current) => Math.min(shot.lines.length - 1, current + 1))
                }
              >
                {turn === shot.lines.length - 1
                  ? id === 'witness'
                    ? 'เปิดทางซ่อมบำรุง →'
                    : id === 'arrival'
                      ? 'เริ่มสำรวจสถานี →'
                      : 'กลับแผนที่เมือง →'
                  : 'ถัดไป →'}
              </PixelButton>
              {id !== 'witness' && <PixelButton onClick={finish}>ข้ามบท</PixelButton>}
            </>
          }
        />
      </section>
    </Modal>
  )
}
export function RecordComparison() {
  return (
    <div className="relay-record-comparison">
      <section>
        <span>ต้นฉบับ / RELAY-02</span>
        <b>BLACKBOX-17</b>
        <p>03:16 รับอุปกรณ์ · 03:18 เชื่อมต่อ</p>
        <strong>03:21 ส่งต่อ → ศูนย์ควบคุม</strong>
      </section>
      <section>
        <span>สำเนา / รายงานผู้ว่าจ้าง</span>
        <b>รายงานอาราซาก้า</b>
        <p>03:16 รับอุปกรณ์ · 03:18 เชื่อมต่อ</p>
        <strong>ไม่พบรายการส่งต่อ 03:21</strong>
      </section>
    </div>
  )
}
export function RelayClue({ id, onClose }: { id: ClueId; onClose: () => void }) {
  const clue = relayClues[id]
  useSpeech(clue.kin)
  return (
    <Modal title={clue.title} variant="dialogue" placement="dialogue" onClose={onClose}>
      <section className="dialogue-evidence-above relay-clue-evidence">
        <span className="hack-label">TRACE / {id === 'workorder' ? 'UNIT 04' : 'BLACKBOX-17'}</span>
        <h3>{clue.title}</h3>
        <p>{clue.detail}</p>
      </section>
      <DialogueSurface
        speaker="คิน"
        portrait={<Portrait speaker="คิน" />}
        channel="TRACE / FIELD LINK"
        text={clue.kin}
        actions={
          <PixelButton
            variant="primary"
            onClick={() => {
              if (relay.collectClue(id)) onClose()
            }}
          >
            เก็บลงสมุดคดี +
          </PixelButton>
        }
      />
    </Modal>
  )
}
export function RelayHack({ onClose }: { onClose: () => void }) {
  const [stage, setStage] = useState(0),
    [running, setRunning] = useState(false)
  const { audio, reducedMotion, active, dialog } = useDialogueAudio()
  useSpeech(running ? '' : relayStory.traces.lines.map((l) => l.text).join(' '))
  useEffect(
    () => () => {
      store.set({ connectionRunning: false })
    },
    []
  )
  useEffect(() => {
    if (!running || !active || dialog || store.get().paused) return
    const stop = audio?.playCue('connect')
    const timer = setInterval(() => setStage((v) => Math.min(4, v + 1)), reducedMotion ? 80 : 480)
    return () => {
      clearInterval(timer)
      stop?.()
    }
  }, [running, active, dialog, audio, reducedMotion])
  useEffect(() => {
    if (stage === 4) {
      changeView('device')
    }
  }, [stage])
  return (
    <Modal
      title="RELAY-02 / เชื่อมเครื่องกู้บันทึก"
      placement={running ? 'center' : 'dialogue'}
      onClose={onClose}
    >
      {!running ? (
        <DialogueSurface
          speaker="คิน"
          portrait={<Portrait speaker="คิน" />}
          channel="RELAY-02 / LOCAL RECOVERY"
          text={relayStory.traces.lines.map((l) => l.text).join(' ')}
          actions={
            <PixelButton
              variant="primary"
              onClick={() => {
                store.set({ connectionRunning: true })
                setRunning(true)
              }}
            >
              เริ่มเชื่อมต่อ RELAY-02 →
            </PixelButton>
          }
        />
      ) : (
        <section className="relay-connect" data-running={running} data-reduced={reducedMotion}>
          <span className="hack-label">LOCAL RECOVERY / AUTHORIZED TERMINAL</span>
          <h3>{running ? 'กำลังเข้าสู่เมืองวงจร' : 'ร่องรอยที่ตั้งใจทิ้ง'}</h3>
          <div className="relay-network" aria-hidden="true">
            {Array.from({ length: 7 }, (_, i) => (
              <i key={i} style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
            <b>{stage * 25}%</b>
          </div>
          <div
            className="relay-connect-progress"
            role="progressbar"
            aria-label="เชื่อม RELAY-02"
            aria-valuenow={stage * 25}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <i style={{ width: `${stage * 25}%` }} />
          </div>
          <p role="status">
            {
              [
                'พร้อมอ่านโมดูลบันทึก',
                'ตรวจหมายเลขอุปกรณ์',
                'เชื่อมแฟ้มจำลอง',
                'เตรียมจุดกู้ HTML เจ็ดเขต',
                'เปิด Circuit City',
              ][stage]
            }
          </p>
          {!running && (
            <PixelButton
              variant="primary"
              onClick={() => {
                store.set({ connectionRunning: true })
                setRunning(true)
              }}
            >
              เริ่มเชื่อมต่อ RELAY-02 →
            </PixelButton>
          )}
        </section>
      )}
    </Modal>
  )
}
export function RelayHUD() {
  const s = useSyncExternalStore(relay.subscribe, relay.get),
    w = useSyncExternalStore(store.subscribe, store.get)
  const city = useSyncExternalStore(cityProgress.subscribe, cityProgress.get)
  const hint = w.hintOpen
  const [expanded, setExpanded] = useState(false)
  const text = relayGuidance(s)
  const { audio, talkSound, active, dialog } = useDialogueAudio()
  useEffect(() => {
    if (hint && active && !dialog && !w.overlay && !w.paused && talkSound)
      return audio?.playTalkLine(text, 'kin')
  }, [hint, active, dialog, w.overlay, w.paused, talkSound, audio, text])
  return (
    <>
      <aside className="relay-objective">
        <div>
          <span>CASE 02 / RELAY-02</span>
          <b>{relayScore(s).toString().padStart(3, '0')} PTS</b>
        </div>
        <button onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
          {expanded ? 'ยุบ −' : 'ภารกิจ +'}
        </button>
        <strong>
          {city.completed.includes('recover-relay') && !s.finalRecovered
            ? 'หลักฐานกู้แล้ว · เปิดฝึกซ่อมในเครื่องนี้ได้'
            : relayObjective(s)}
        </strong>
        {expanded && (
          <>
            <div className="chapter-meter">
              {Array.from({ length: 7 }, (_, i) => (
                <i key={i} data-done={s.completed.includes(i)} />
              ))}
            </div>
            <small>
              ร่องรอย {s.clues.length}/2 · HTML {s.completed.length}/7 · ต้นฉบับ{' '}
              {city.completed.includes('recover-relay') ? 'กู้แล้ว' : 'ล็อก'}
            </small>
            {s.storageWarning && (
              <small role="status">บันทึกในเครื่องไม่ได้ แต่เล่นต่อในแท็บนี้ได้</small>
            )}
          </>
        )}
      </aside>
      {!w.overlay && !w.paused && (
        <aside className="relay-hint dialogue-guide">
          {hint && (
            <DialogueSurface
              speaker="คิน"
              compact
              portrait={<Portrait speaker="คิน" />}
              channel="TECHCARE / FIELD LINK"
              text={text}
              actions={
                <PixelButton onClick={() => executeGameCommand('hint')} aria-expanded={hint}>
                  ซ่อนคำใบ้ <PixelKey>H</PixelKey>
                </PixelButton>
              }
            />
          )}
          {!hint && (
            <PixelButton onClick={() => executeGameCommand('hint')} aria-expanded={hint}>
              คิน ขอคำใบ้หน่อย <PixelKey>H</PixelKey>
            </PixelButton>
          )}
        </aside>
      )}
    </>
  )
}
