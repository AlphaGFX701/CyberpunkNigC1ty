import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import type { EntryAudio } from '../entry/audio'
import { PixelButton } from '../ui/PixelUI'
import { DialogueSurface } from '../ui/DialogueSurface'
import { Modal } from '../ui/Modal'
import { tutorial } from './model'
import { getTutorialPrompt, type TutorialContext } from './content'
import { segmentDialogue } from './text'
import './tutorial.css'

const Environment = createContext<{
  active: boolean
  audio: EntryAudio | null
  talkSound: boolean
  reducedMotion: boolean
  dialog: string | null
}>({ active: false, audio: null, talkSound: true, reducedMotion: false, dialog: null })
export function TutorialProvider({
  children,
  ...value
}: {
  children: ReactNode
  active: boolean
  audio: EntryAudio | null
  talkSound: boolean
  reducedMotion: boolean
  dialog: string | null
}) {
  return <Environment.Provider value={value}>{children}</Environment.Provider>
}
export function useTutorialState() {
  return useSyncExternalStore(tutorial.subscribe, tutorial.get)
}
/** Dialogue surfaces share the one entry-owned sound bus and the player's speech toggle. */
export function useDialogueAudio() {
  const { audio, talkSound, reducedMotion, active, dialog } = useContext(Environment)
  return { audio, talkSound, reducedMotion, active, dialog }
}

export function TutorialCoach({
  context,
  inline = false,
  compact = false,
}: {
  context: TutorialContext
  inline?: boolean
  compact?: boolean
}) {
  const state = useTutorialState(),
    environment = useContext(Environment)
  const prompt = getTutorialPrompt(state.step)
  const visible = Boolean(
    environment.active && prompt?.context === context && (inline || !environment.dialog)
  )
  const text = prompt?.text ?? ''
  const clusters = useMemo(() => segmentDialogue(text), [text])
  const [count, setCount] = useState(0),
    [blink, setBlink] = useState(false),
    [failed, setFailed] = useState(false)
  const cancelSound = useRef<() => void>(() => {})
  const speaker = useRef<HTMLElement>(null)
  const forced = useRef(false)
  const audioRef = useRef(environment.audio)
  audioRef.current = environment.audio
  const soundEnabled = useRef(environment.talkSound)
  soundEnabled.current = environment.talkSound
  useEffect(() => {
    if (!environment.talkSound) cancelSound.current()
  }, [environment.talkSound])
  useEffect(() => {
    if (!visible || !prompt) return
    if (prompt.mode === 'dialogue') {
      speaker.current?.focus({ preventScroll: true })
      return
    }
    // Task coaching is visual guidance only. It must not steal editor or modal focus.
  }, [visible, state.step, context, prompt])
  useEffect(() => {
    setCount(environment.reducedMotion ? clusters.length : 0)
    forced.current = false
    cancelSound.current()
    if (!visible) return
    if (environment.reducedMotion) {
      if (soundEnabled.current)
        cancelSound.current = audioRef.current?.playTalkLine(text, 'kin') ?? (() => {})
      return () => cancelSound.current()
    }
    let cursor = 0
    const interval = setInterval(() => {
      if (forced.current) {
        clearInterval(interval)
        return
      }
      cursor++
      setCount(cursor)
      if (soundEnabled.current && cursor % 3 === 0 && !/^\s+$/.test(clusters[cursor - 1] ?? '')) {
        cancelSound.current()
        cancelSound.current = audioRef.current?.playTalkBlip() ?? (() => {})
      }
      if (cursor >= clusters.length) clearInterval(interval)
    }, 42)
    return () => {
      clearInterval(interval)
      cancelSound.current()
    }
  }, [visible, state.step, text, clusters, environment.reducedMotion])
  useEffect(() => {
    setBlink(false)
    setFailed(false)
    if (!visible || environment.reducedMotion) return
    let end: ReturnType<typeof setTimeout> | undefined
    const timer = setInterval(() => {
      setBlink(true)
      end = setTimeout(() => setBlink(false), 130)
    }, 4200)
    return () => {
      clearInterval(timer)
      clearTimeout(end)
    }
  }, [visible, prompt?.mood, environment.reducedMotion])
  useEffect(() => {
    if (!visible || !prompt) return
    for (const frame of ['idle', 'talk', 'blink']) {
      const image = new Image()
      image.src = `/assets/tutorial/kin/${prompt.mood}-${frame}.png`
    }
  }, [visible, prompt])
  const complete = environment.reducedMotion || count >= clusters.length
  const reveal = () => {
    cancelSound.current()
    setCount(clusters.length)
  }
  // Stop the typing interval after a manual reveal, without restarting its clock.
  useEffect(() => {
    if (complete && !environment.reducedMotion) cancelSound.current()
  }, [complete, environment.reducedMotion])
  if (!visible || !prompt || !state.step) return null
  const face = blink ? 'blink' : !complete && count % 4 < 2 ? 'talk' : 'idle'
  const next = () => {
    if (!complete) {
      forced.current = true
      reveal()
      return
    }
    tutorial.next()
  }
  const reading = prompt.mode === 'dialogue' && !inline
  const surface = (
    <section
      ref={speaker}
      tabIndex={prompt.mode === 'dialogue' ? -1 : undefined}
      className={`kin-coach kin-surface ${reading ? 'kin-modal' : inline ? 'kin-inline' : compact ? 'kin-compact' : 'kin-dock'}`}
      data-tutorial-step={state.step}
      data-mood={prompt.mood}
      data-coach-mode={prompt.mode}
      data-coach-context={context}
      aria-label="คินพาฝึกเล่น"
    >
      <DialogueSurface
        speaker="คิน"
        compact={compact || inline || prompt.mode === 'task'}
        reducedMotion={environment.reducedMotion}
        portrait={
          <img
            src={
              failed ? '/assets/entry/kin.png' : `/assets/tutorial/kin/${prompt.mood}-${face}.png`
            }
            onError={() => setFailed(true)}
            alt=""
            draggable={false}
          />
        }
        actions={
          <div className="kin-response-actions">
            {!complete && (
              <button
                className="kin-reveal"
                onClick={() => {
                  forced.current = true
                  reveal()
                }}
              >
                แสดงข้อความทั้งหมด
              </button>
            )}
            {prompt.choices?.map((choice) => (
              <PixelButton
                key={choice.id}
                onClick={() => {
                  if (!complete) {
                    forced.current = true
                    reveal()
                    return
                  }
                  tutorial.choose(choice.id)
                }}
              >
                {choice.label}
              </PixelButton>
            ))}
            {prompt.nextLabel && (
              <PixelButton variant="primary" onClick={next}>
                {prompt.nextLabel}
                <span> →</span>
              </PixelButton>
            )}
            {prompt.mode === 'task' && (
              <span className="kin-task-hint">
                <i />
                ลองใช้ส่วนที่มีกรอบสีอำพัน
              </span>
            )}
            <button className="kin-skip" onClick={() => tutorial.skip()}>
              ข้ามการฝึก
            </button>
          </div>
        }
      >
        <p className="kin-line">
          <span aria-hidden="true">{complete ? text : clusters.slice(0, count).join('')}</span>
          <span className="sr-only" aria-live="polite" aria-atomic="true">
            {text}
          </span>
        </p>
        {state.storageWarning && (
          <small className="kin-storage-warning">
            จำการฝึกในเครื่องไม่ได้ ยังฝึกต่อในรอบนี้ได้
          </small>
        )}
      </DialogueSurface>
    </section>
  )
  return reading ? (
    <Modal
      title="คินพาฝึกเล่น"
      variant="dialogue"
      placement="dialogue"
      onClose={() => tutorial.skip()}
    >
      {surface}
    </Modal>
  ) : (
    surface
  )
}

/** A visual aid only: permissions and completion still belong to real action owners. */
export function TutorialSpotlight({ active }: { active: boolean }) {
  const state = useTutorialState()
  const targets = getTutorialPrompt(state.step)?.targets ?? []
  useEffect(() => {
    if (!active || !state.step) return
    const marked = new Set<HTMLElement>()
    const update = () => {
      for (const node of marked) node.removeAttribute('data-tutorial-highlight')
      marked.clear()
      for (const target of targets) {
        if (target === 'city-drag' || target === 'world-move') continue
        document
          .querySelectorAll<HTMLElement>(`[data-tutorial-target="${target}"]`)
          .forEach((node) => {
            if (node.getClientRects().length && !node.closest('[hidden]')) {
              node.dataset.tutorialHighlight = 'true'
              marked.add(node)
            }
          })
      }
    }
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('resize', update)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
      for (const node of marked) node.removeAttribute('data-tutorial-highlight')
    }
  }, [active, state.step, targets])
  return null
}
