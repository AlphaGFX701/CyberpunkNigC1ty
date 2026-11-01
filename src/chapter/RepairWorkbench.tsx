import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { chapter, type ChapterSnapshot, tasks } from './model'
import { finalTask } from './content'
import { puzzles, type PuzzleAnswer } from './puzzles'
import { CodeEditor, type EditorHandle } from './CodeEditor'
import { Modal } from '../ui/Modal'
import { PixelButton } from '../ui/PixelUI'
import { store } from '../model'
import { cityProgress } from '../city/progression'
import { TutorialCoach, useDialogueAudio, useTutorialState } from '../tutorial/Tutorial'
import { tutorial } from '../tutorial/model'
import { tutorialAllows } from '../tutorial/controls'
import type { AnswerResult } from './validate'
import { relay, type RelaySnapshot } from '../relay/model'
import { tasks as relayTasks, finalTask as relayFinalTask } from '../relay/content'
import { puzzles as relayPuzzles } from '../relay/puzzles'
import { RelayPuzzle } from '../relay/RelayPuzzle'
import { RelayPreview } from '../relay/RelayPreview'
import './repair-workbench.css'

// Runtime-only drafts; account/reset scope prevents another owner receiving a previous editor buffer.
const relayDrafts = new Map<string, { code: string; scaffoldApplied: boolean }>()

function documentPreview(source: string, final: boolean) {
  const doc = new DOMParser().parseFromString(source, 'text/html')
  doc
    .querySelectorAll('script,style,link,iframe,object,embed,base,meta,form,svg,math')
    .forEach((n) => n.remove())
  doc.querySelectorAll('*').forEach((n) => {
    for (const attr of [...n.attributes]) {
      if (
        /^on/i.test(attr.name) ||
        ['href', 'srcset', 'style', 'srcdoc', 'action', 'formaction'].includes(attr.name)
      )
        n.removeAttribute(attr.name)
    }
    if (n.tagName === 'IMG') {
      if (final && /^(\.\/)?suspect\.png$/.test(n.getAttribute('src') ?? ''))
        n.setAttribute('src', '/assets/null.png')
      else n.removeAttribute('src')
    }
  })
  return `<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self'; style-src 'unsafe-inline'"><style>body{background:#091722;color:#e3f3f5;font:18px/1.6 Tahoma,sans-serif;padding:18px;margin:0}img{display:block;max-height:190px;max-width:100%;margin:8px auto}h1{font-size:27px}h2{font-size:22px}</style>${doc.body.innerHTML}`
}

function PuzzleBoard({ index, onSolved }: { index: number; onSolved: () => void }) {
  const puzzle = puzzles[index]
  const [answer, setAnswer] = useState<Record<string, string>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('เลือกชิ้นส่วน แล้วเลือกช่องปลายทาง หรือใช้การลากวาง')
  const assign = (slot: string, option: string) => {
    if (!puzzle.options.some((o) => o.id === option)) return
    setAnswer((previous) => {
      const next = { ...previous }
      for (const key of Object.keys(next)) if (next[key] === option) delete next[key]
      next[slot] = option
      return next
    })
    setSelected(null)
  }
  return (
    <section
      className="repair-puzzle"
      aria-label="Puzzle ก่อนซ่อมโค้ด"
      data-tutorial-target="puzzle-action"
    >
      <span className="repair-eyebrow">01 / RECONNECT THE LOGIC</span>
      <h3>{puzzle.title}</h3>
      <p>{puzzle.instruction}</p>
      <div className="puzzle-parts" aria-label="ชิ้นส่วน Puzzle">
        {puzzle.options.map((option) => (
          <button
            type="button"
            key={option.id}
            draggable
            aria-pressed={selected === option.id}
            onClick={() => setSelected(option.id)}
            onDragStart={(event) => event.dataTransfer.setData('text/plain', option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="puzzle-slots">
        {puzzle.slots.map((slot) => (
          <button
            type="button"
            className="puzzle-slot"
            key={slot.id}
            aria-label={`${slot.label}: ${puzzle.options.find((o) => o.id === answer[slot.id])?.label ?? 'ว่าง'}`}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              assign(slot.id, event.dataTransfer.getData('text/plain'))
            }}
            onClick={() => {
              if (selected) assign(slot.id, selected)
            }}
          >
            <small>{slot.label}</small>
            <strong>
              {puzzle.options.find((o) => o.id === answer[slot.id])?.label ?? '+ วางชิ้นส่วน'}
            </strong>
          </button>
        ))}
      </div>
      <p role="status" className="puzzle-feedback">
        {feedback}
      </p>
      <div className="repair-actions">
        <PixelButton
          variant="primary"
          onClick={() => {
            const result = chapter.submitPuzzle(index, answer as PuzzleAnswer)
            setFeedback(result.feedback)
            if (result.ok) onSolved()
          }}
        >
          ต่อวงจร Puzzle
        </PixelButton>
      </div>
    </section>
  )
}

export function RepairWorkbench({
  final = false,
  chapterId = 'arun',
  onClose,
}: {
  final?: boolean
  chapterId?: 'arun' | 'relay'
  onClose: () => void
}) {
  const world = useSyncExternalStore(store.subscribe, store.get)
  const training = useTutorialState()
  const isRelay = chapterId === 'relay'
  const activeChapter = isRelay ? relay : chapter
  const state = useSyncExternalStore<ChapterSnapshot | RelaySnapshot>(
    activeChapter.subscribe,
    activeChapter.get
  )
  const recovered = 'finalRecovered' in state ? state.finalRecovered : state.imageRecovered
  const stagePuzzles = isRelay ? relayPuzzles : puzzles
  const index = final ? 7 : world.taskIndex
  const task = final
    ? isRelay
      ? relayFinalTask
      : finalTask
    : isRelay
      ? relayTasks[index]
      : tasks[index]
  const puzzleReady = final || state.puzzleCompleted.includes(index)
  const draftKey = isRelay ? `${relay.getDraftScope()}:${index}` : ''
  const savedDraft = isRelay ? relayDrafts.get(draftKey) : undefined
  const guidedTask = !isRelay && !final && index === 0 && Boolean(training.step)
  const [showPuzzle, setShowPuzzle] = useState(
    !puzzleReady || (guidedTask && ['chip-open', 'puzzle'].includes(training.step!))
  )
  const [code, setCode] = useState(
    savedDraft?.code ?? (!final && puzzleReady ? stagePuzzles[index].scaffold : task.starter)
  )
  const [hint, setHint] = useState('')
  const [result, setResult] = useState<AnswerResult | undefined>()
  const [success, setSuccess] = useState(final && recovered)
  const editor = useRef<EditorHandle>(null)
  const scaffoldApplied = useRef(savedDraft?.scaffoldApplied ?? puzzleReady)
  useEffect(() => {
    if (!isRelay) return
    relayDrafts.set(draftKey, { code, scaffoldApplied: scaffoldApplied.current })
    if (relayDrafts.size > 128) relayDrafts.delete(relayDrafts.keys().next().value!)
  }, [code, puzzleReady, draftKey, isRelay])
  const { audio, talkSound, active, reducedMotion } = useDialogueAudio()
  useEffect(() => {
    if (!success || !active || !talkSound || guidedTask) return
    return audio?.playTalkLine(
      isRelay
        ? task.success
        : final
          ? 'ภาพมาแล้ว เก็บเวลาและตรานั้นไว้ เราตามถูกทางแล้ว'
          : 'วงจรกลับมาแล้ว ไปจุดถัดไปกัน ยังไม่คิดค่าแรงนะ',
      'kin'
    )
  }, [success, active, talkSound, audio, final, isRelay, task.success, guidedTask])
  const submit = () => {
    if (!puzzleReady || showPuzzle || success) return
    if (guidedTask && !tutorialAllows('submit-code')) return
    const next = final ? activeChapter.submitImage(code) : activeChapter.submitTask(index, code)
    setResult(next)
    setSuccess(next.ok)
    audio?.playCue(next.ok ? 'confirm' : 'static')
    if (!isRelay && !final && index === 0 && next.ok) tutorial.notify('first-repair-submitted')
    if (final && next.ok) {
      if (isRelay) cityProgress.recordRelayRecovery()
      else {
        store.set({ repaired: true })
        cityProgress.recordCamRecovery()
      }
    }
  }
  const snippets = final
    ? isRelay
      ? [
          { label: 'href', text: 'href=""' },
          { label: '<a>', text: '<a href="">บันทึกต้นฉบับ</a>' },
          { label: '<main>', text: '<main>\n\n</main>' },
        ]
      : [
          { label: '<img>', text: '<img src="" alt="">' },
          { label: 'src', text: 'src=""' },
          { label: 'alt', text: 'alt=""' },
        ]
    : stagePuzzles[index].snippets
  const onPuzzleSolved = () => {
    if (!scaffoldApplied.current) {
      setCode(stagePuzzles[index].scaffold)
      scaffoldApplied.current = true
    }
    setShowPuzzle(false)
    setResult(undefined)
    audio?.playCue('confirm')
    if (!isRelay && !final && index === 0) tutorial.notify('puzzle-solved')
  }
  return (
    <Modal
      title={`${final ? (isRelay ? 'RELAY-02 / ORIGINAL RECORD' : 'CAM-07 / FINAL EVIDENCE') : `${isRelay ? 'RELAY' : 'RECOVERY'} ${index + 1} / 7`} — ${task.title}`}
      onClose={onClose}
    >
      <div
        className="repair-workbench"
        data-chapter={chapterId}
        data-reduced={reducedMotion}
        data-phase={success ? 'success' : showPuzzle ? 'puzzle' : 'code'}
      >
        <div className="repair-stage-strip">
          <span>BLACKBOX // RECOVERY CONSOLE</span>
          <b>
            {final
              ? isRelay
                ? '08 / ORIGINAL RECORD'
                : '08 / CAMERA CORE'
              : `${String(index + 1).padStart(2, '0')} / HTML SECTOR`}
          </b>
        </div>
        {guidedTask && <TutorialCoach context="terminal" inline compact />}
        {final && success ? (
          <section className="repair-evidence">
            {isRelay ? (
              <div className="relay-recovered-record">
                <span>RELAY-02 / VERIFIED LOCAL RECOVERY</span>
                <h3>ต้นฉบับที่รายงานไม่ได้แนบมา</h3>
                <dl>
                  <dt>อุปกรณ์</dt>
                  <dd>BLACKBOX-17</dd>
                  <dt>03:16</dt>
                  <dd>รับอุปกรณ์</dd>
                  <dt>03:18</dt>
                  <dd>เชื่อมต่อ RELAY-02</dd>
                  <dt>03:21</dt>
                  <dd>ส่งต่อไปศูนย์ควบคุม</dd>
                </dl>
                <p>สำเนาอาราซาก้ามีรายการรับและเชื่อมต่อ แต่ไม่มีรายการส่งต่อ 03:21</p>
                <small>ข้อมูลยังไม่ยืนยันว่าใครตัดรายการออก หรือ NULL เป็นใคร</small>
              </div>
            ) : (
              <>
                <img src="/assets/null.png" alt="ภาพผู้ต้องสงสัยที่กู้จาก CAM-07" />
                <h3>หลักฐาน CAM-07 คืนสภาพแล้ว</h3>
              </>
            )}
            <p>{task.success}</p>
            <PixelButton variant="primary" onClick={onClose}>
              กลับสู่ Circuit City
            </PixelButton>
          </section>
        ) : (
          <>
            <div className="repair-columns">
              <aside className="repair-instructions">
                <span className="repair-eyebrow">{task.topic}</span>
                <h3>{task.title}</h3>
                <p>{task.lesson}</p>
                <blockquote>{task.instruction}</blockquote>
                <div className="repair-actions">
                  <PixelButton onClick={() => setHint(activeChapter.useHint(index))}>
                    คำใบ้
                  </PixelButton>
                </div>
                {hint && <p className="repair-hint">{hint}</p>}
                {!final && puzzleReady && (
                  <PixelButton onClick={() => setShowPuzzle(!showPuzzle)}>
                    {showPuzzle ? 'กลับไปเขียนโค้ด' : 'ดู Puzzle อีกครั้ง'}
                  </PixelButton>
                )}
                <a href={task.source} target="_blank" rel="noreferrer">
                  อ่านหัวข้อนี้ที่ W3Schools ↗
                </a>
                <small>
                  คำใบ้และการลองใหม่ไม่หักคะแนน
                  <br />
                  บันทึกการใช้ตัวช่วยแยกจากคะแนนเกม
                </small>
              </aside>
              <section className="repair-console">
                {showPuzzle && !final ? (
                  isRelay ? (
                    <RelayPuzzle index={index} onSolved={onPuzzleSolved} />
                  ) : (
                    <PuzzleBoard index={index} onSolved={onPuzzleSolved} />
                  )
                ) : (
                  <>
                    <div className="repair-code-scroll">
                      <div className="repair-editor-label">
                        <span>02 / WRITE THE REPAIR</span>
                        <small>
                          {task.kind === 'filename' ? 'แก้ชื่อไฟล์' : 'เติมโค้ดด้วยตนเอง'}
                        </small>
                      </div>
                      <CodeEditor
                        ref={editor}
                        value={code}
                        onChange={(value) => {
                          setCode(value)
                          setResult(undefined)
                          setSuccess(false)
                        }}
                        onSubmit={submit}
                        onInteraction={(event) => {
                          if (!isRelay && !final && index === 0)
                            tutorial.notify(event === 'snippet' ? 'editor-snippet' : 'editor-undo')
                        }}
                        feedbackId="repair-feedback"
                        snippets={snippets}
                        diagnostic={
                          result && !result.ok
                            ? { message: result.feedback, line: result.line }
                            : undefined
                        }
                        filename={
                          task.kind === 'filename'
                            ? 'บันทึกชื่อแฟ้ม'
                            : isRelay
                              ? 'relay-evidence.html'
                              : 'evidence.html'
                        }
                      />
                      <div className="repair-preview-label">LIVE PREVIEW / ผลของโค้ด</div>
                      {task.kind === 'filename' ? (
                        <div className="repair-filename">▤ {code}</div>
                      ) : isRelay ? (
                        <RelayPreview source={code} stageIndex={index} />
                      ) : (
                        <iframe
                          title="พรีวิวหน้าเว็บภารกิจ"
                          sandbox=""
                          srcDoc={documentPreview(code, final)}
                        />
                      )}
                      <div
                        className={`repair-feedback ${result?.ok ? 'valid' : ''}`}
                        id="repair-feedback"
                        role="status"
                      >
                        {result?.feedback ??
                          'เติมบรรทัดสำคัญ ตรวจโครงสร้าง แล้วส่งคำสั่งซ่อมเมื่อพร้อม'}
                        {result?.line && (
                          <button
                            type="button"
                            onClick={() => editor.current?.focusLine(result.line)}
                          >
                            ไปบรรทัด {result.line} ↗
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="repair-actions repair-submit-actions">
                      <PixelButton
                        disabled={success}
                        data-tutorial-target="check-code"
                        onClick={() => {
                          const checked = activeChapter.checkTask(index, code)
                          setResult(checked)
                          if (!isRelay && !final && index === 0 && checked.ok)
                            tutorial.notify('code-checked')
                        }}
                      >
                        ตรวจโครงสร้าง
                      </PixelButton>
                      <PixelButton
                        variant="primary"
                        disabled={success || (guidedTask && !tutorialAllows('submit-code'))}
                        onClick={submit}
                        data-tutorial-target="submit-code"
                      >
                        ส่งคำสั่งซ่อม ↵
                      </PixelButton>
                    </div>
                    {success && (
                      <div className="repair-complete">
                        <b>SECTOR RESTORED</b>
                        <p>
                          {guidedTask
                            ? 'บันทึกผลซ่อมแล้ว · กลับสู่ Circuit City เพื่อไปต่อ'
                            : isRelay
                            ? task.success
                            : 'คิน: วงจรกลับมาแล้ว ไปจุดถัดไปกัน ยังไม่คิดค่าแรงนะ'}
                        </p>
                        <PixelButton variant="primary" onClick={onClose}>
                          กลับสู่ Circuit City →
                        </PixelButton>
                      </div>
                    )}
                  </>
                )}
              </section>
            </div>
          </>
        )}
        <footer className="repair-footer">
          <span>SECURE LOCAL SESSION / UTF-8</span>
          <span>
            {state.completed.length}/7 HTML · {state.completed.length * 10 + (recovered ? 30 : 0)}
            /100 PTS
          </span>
        </footer>
      </div>
    </Modal>
  )
}
