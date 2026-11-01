import { lazy, Suspense, useEffect, useState, useSyncExternalStore } from 'react'
import { chapter, chapterObjective, chapterScore, kinGuidance, tasks, chapterClues } from './model'
import { arunLines, type ClueId } from './content'
import { PixelButton, PixelKey } from '../ui/PixelUI'
import { Modal } from '../ui/Modal'
import { DialogueSurface } from '../ui/DialogueSurface'
import { executeGameCommand } from '../game-commands'
import { store, changeView } from '../model'
import { tutorial } from '../tutorial/model'
import { useDialogueAudio } from '../tutorial/Tutorial'
import './chapter.css'

function useSpeech(text: string, voice: 'kin' | 'arun' = 'kin', enabled = true) {
  const { audio, talkSound, active, dialog } = useDialogueAudio()
  const world = useSyncExternalStore(store.subscribe, store.get)
  useEffect(() => {
    if (!enabled || !active || dialog || !talkSound || world.paused) return
    return audio?.playTalkLine(text, voice)
  }, [text, voice, enabled, active, dialog, talkSound, audio, world.paused])
}

function Face({ arun = false, mood = 'smirk' }: { arun?: boolean; mood?: string }) {
  const [failed, setFailed] = useState(false)
  const [frame, setFrame] = useState('idle')
  const { reducedMotion } = useDialogueAudio()
  useEffect(() => {
    setFrame('idle')
    if (arun || reducedMotion) return
    let tick = 0
    const timer = setInterval(() => {
      tick++
      setFrame(tick < 7 ? (tick % 2 ? 'talk' : 'idle') : tick % 23 === 0 ? 'blink' : 'idle')
    }, 160)
    return () => clearInterval(timer)
  }, [arun, mood, reducedMotion])
  return (
    <div className={`field-face ${arun ? 'arun' : 'kin'}`} aria-hidden="true">
      {!failed ? (
        <img
          src={
            arun
              ? `/assets/chapter-one/characters/arun-${mood === 'serious' ? 'serious' : 'smile'}.webp`
              : `/assets/tutorial/kin/${mood}-${frame}.png`
          }
          alt=""
          onError={() => setFailed(true)}
        />
      ) : (
        <span>{arun ? 'อรุณ' : 'คิน'}</span>
      )}
      <i className="field-link" />
    </div>
  )
}

export function ChapterHUD() {
  const state = useSyncExternalStore(chapter.subscribe, chapter.get)
  const world = useSyncExternalStore(store.subscribe, store.get)
  const guide = world.hintOpen
  const [objectiveOpen, setObjectiveOpen] = useState(true)
  const text = kinGuidance(state)
  const visible = guide && !world.overlay && !world.paused
  useSpeech(text, 'kin', visible)
  return (
    <>
      <aside className="chapter-objective" data-open={objectiveOpen} aria-label="ภารกิจด่านแรก">
        <div>
          <span>CASE 01 / ARUN'S WORKSHOP</span>
          <b>
            {chapterScore(state).toString().padStart(3, '0')} <small>PTS</small>
          </b>
        </div>
        <button
          className="chapter-objective-toggle"
          type="button"
          onClick={() => setObjectiveOpen((open) => !open)}
          aria-expanded={objectiveOpen}
          aria-label={objectiveOpen ? 'ยุบรายละเอียดภารกิจ' : 'แสดงรายละเอียดภารกิจ'}
        >
          {objectiveOpen ? 'ยุบ −' : 'ภารกิจ +'}
        </button>
        {objectiveOpen && (
          <>
            <strong>{chapterObjective(state)}</strong>
            <div
              className="chapter-meter"
              aria-label={`ภารกิจ HTML สำเร็จ ${state.completed.length} จาก 7`}
            >
              {tasks.map((task, i) => (
                <i key={task.id} data-done={state.completed.includes(i)} title={task.title} />
              ))}
            </div>
            <p>
              ร่องรอย {state.clues.length}/2 <span>·</span> HTML {state.completed.length}/7{' '}
              <span>·</span> ภาพ {state.imageRecovered ? 'กู้แล้ว' : 'ยังล็อก'}
            </p>
            {state.storageWarning && (
              <small role="status">บันทึกในเครื่องไม่ได้ รอบนี้ยังเล่นต่อได้</small>
            )}
          </>
        )}
      </aside>
      {!world.overlay && !world.paused && !tutorial.get().step && (
        <aside className="field-guide dialogue-guide" data-open={guide}>
          {visible && (
            <DialogueSurface
              speaker="คิน"
              channel="TECHCARE / FIELD LINK"
              compact
              portrait={<Face />}
              text={text}
              actions={
                <PixelButton onClick={() => executeGameCommand('hint')} aria-label="ปิดคำแนะนำคิน">
                  ซ่อนคำใบ้ <PixelKey>H</PixelKey>
                </PixelButton>
              }
            />
          )}
          {!guide && (
            <PixelButton
              onClick={() => executeGameCommand('hint')}
              aria-expanded={guide}
              aria-label="แสดงคำใบ้คิน กด H"
            >
              คิน ขอคำใบ้หน่อย <PixelKey>H</PixelKey>
            </PixelButton>
          )}
        </aside>
      )}
      {world.view === 'device' && !world.overlay && (
        <PixelButton className="chapter-leave" onClick={() => changeView('street')}>
          กลับร้านอรุณ ↗
        </PixelButton>
      )}
    </>
  )
}

export function ArunDialogue({ onClose }: { onClose: () => void }) {
  const [turn, setTurn] = useState(0)
  const line = arunLines[turn]
  const isArun = line.speaker === 'อรุณ'
  useSpeech(line.text, isArun ? 'arun' : 'kin')
  const finish = () => {
    chapter.talkToArun()
    onClose()
  }
  return (
    <Modal title="อรุณ / พยานร้านซ่อม" variant="dialogue" placement="dialogue" onClose={onClose}>
      <DialogueSurface
        speaker={line.speaker}
        portrait={<Face arun={isArun} mood={turn === 2 ? 'serious' : isArun ? 'smile' : 'smirk'} />}
        channel="EAST BANK · 03:12 / WITNESS LINK"
        text={line.text}
        actions={
          <>
            <small>
              {turn + 1} / {arunLines.length}
            </small>
            <PixelButton
              disabled={turn === 0}
              onClick={() => setTurn((current) => Math.max(0, current - 1))}
            >
              ย้อนกลับ
            </PixelButton>
            <PixelButton
              variant="primary"
              onClick={() =>
                turn === arunLines.length - 1
                  ? finish()
                  : setTurn((current) => Math.min(arunLines.length - 1, current + 1))
              }
            >
              {turn === arunLines.length - 1 ? 'ออกค้นร่องรอย →' : 'ถัดไป →'}
            </PixelButton>
          </>
        }
      />
    </Modal>
  )
}

export function ClueDialogue({ id, onClose }: { id: ClueId; onClose: () => void }) {
  const clue = chapterClues[id]
  const [collected, setCollected] = useState(chapter.get().clues.includes(id))
  useSpeech(clue.kin)
  return (
    <Modal title={clue.title} variant="dialogue" placement="dialogue" onClose={onClose}>
      <section
        className="dialogue-evidence-above clue-found-evidence"
        aria-label="รายละเอียดหลักฐาน"
      >
        <span className="hack-label">
          TRACE {id === 'receipt' ? '01 / PAPER TRAIL' : '02 / SIGNAL ROUTE'}
        </span>
        <h3>{clue.title}</h3>
        <p>{clue.detail}</p>
      </section>
      <DialogueSurface
        speaker="คิน"
        portrait={<Face />}
        channel="TRACE / FIELD LINK"
        text={clue.kin}
        actions={
          <PixelButton
            variant="primary"
            onClick={() => {
              if (chapter.collectClue(id)) {
                setCollected(true)
                onClose()
              }
            }}
          >
            {collected ? 'เก็บแล้ว · กลับไปสำรวจ' : 'เก็บลงสมุดคดี +'}
          </PixelButton>
        }
      />
    </Modal>
  )
}

export function HackConnection({ onClose }: { onClose: () => void }) {
  const [running, setRunning] = useState(false)
  const [stage, setStage] = useState(0)
  const { audio, reducedMotion } = useDialogueAudio()
  useEffect(
    () => () => {
      store.set({ connectionRunning: false })
    },
    []
  )
  useEffect(() => {
    if (!running) return
    const stop = audio?.playCue('connect')
    const timer = setInterval(
      () => setStage((value) => Math.min(4, value + 1)),
      reducedMotion ? 90 : 550
    )
    return () => {
      clearInterval(timer)
      stop?.()
    }
  }, [running, audio, reducedMotion])
  useEffect(() => {
    if (stage !== 4) return
    if (chapter.startHack()) {
      audio?.playCue('confirm')
      changeView('device')
    } else onClose()
  }, [stage, audio, onClose])
  const messages = [
    'รอคำสั่งเชื่อมต่อ',
    'ตรวจสิทธิ์เครื่องจำลอง',
    'เชื่อมช่องข้อมูลในเครื่อง',
    'โหลดหน้าบันทึก HTML 7 ส่วน',
    'พร้อมเข้าสู่พื้นที่กู้ระบบ',
  ]
  return (
    <Modal title="TECHCARE / RECOVERY LINK" onClose={onClose}>
      <div className="hack-connect" data-running={running} data-reduced={reducedMotion}>
        <div className="hack-grid" aria-hidden="true" />
        <div className="hack-topline">
          <span>ARUN-RECOVERY-01 / LOCAL SIGNAL</span>
          <b>{running ? 'LINK ACTIVE' : 'STANDBY'}</b>
        </div>
        <div className="hack-bay">
          <div className="hack-core" aria-hidden="true">
            <div className="hack-orbit">
              <i />
              <i />
              <b>{running ? `${stage * 25}%` : 'E'}</b>
            </div>
            <div className="hack-wave">
              {Array.from({ length: 22 }, (_, index) => (
                <i key={index} style={{ animationDelay: `${index * -0.09}s` }} />
              ))}
            </div>
            <small>RECORDER / MEMORY BUS</small>
          </div>
          <div className="hack-readout">
            <span className="hack-label">LOCAL SANDBOX / 7 HTML SECTORS</span>
            <h3>{running ? 'กำลังเข้าสู่สัญญาณ' : 'START HACKING'}</h3>
            <p role="status">{messages[stage]}</p>
            <div
              className="hack-track"
              role="progressbar"
              aria-label="ความคืบหน้าการเชื่อมต่อ"
              aria-valuenow={stage * 25}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <i style={{ width: `${stage * 25}%` }} />
            </div>
            <ol>
              {messages.slice(1).map((message, i) => (
                <li key={message} data-ready={stage > i}>
                  <span>{stage > i ? '✓' : '·'}</span>
                  {message}
                </li>
              ))}
            </ol>
            {!running && (
              <PixelButton
                variant="primary"
                onClick={() => {
                  store.set({ connectionRunning: true })
                  setRunning(true)
                }}
              >
                เริ่มเชื่อมต่อ <PixelKey>↵</PixelKey>
              </PixelButton>
            )}
          </div>
        </div>
        <small>จำลองการกู้หน้าเว็บในเครื่องนี้ · ไม่มีการเจาะระบบภายนอก</small>
      </div>
    </Modal>
  )
}

const Workbench = lazy(() =>
  import('./RepairWorkbench').then((module) => ({ default: module.RepairWorkbench }))
)
export function ChapterTerminal(props: {
  chapterId?: 'arun' | 'relay'
  final?: boolean
  onClose: () => void
}) {
  return (
    <Suspense
      fallback={
        <Modal title="กำลังเปิดเทอร์มินัล HTML" onClose={props.onClose}>
          <p className="prose">กำลังเตรียมเครื่องมือเขียนโค้ด…</p>
        </Modal>
      }
    >
      <Workbench {...props} />
    </Suspense>
  )
}
