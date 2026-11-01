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
  const speaker = useRef<HTMLSpanElement>(null)
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
    if (context === 'terminal' && state.step === 'repair') {
      document.getElementById('code')?.focus({ preventScroll: true })
      return
    }
    const target = prompt.targets
      .flatMap((id) =>
        Array.from(document.querySelectorAll<HTMLElement>(`[data-tutorial-target="${id}"]`))
      )
      .find((node) => !node.matches(':disabled') && node.getClientRects().length)
    if (target) target.focus({ preventScroll: true })
    else if (context === 'street' || context === 'device')
      document.querySelector<HTMLElement>('.world')?.focus({ preventScroll: true })
  }, [visible, state.step, context, prompt])
  useEffect(() => {
    setCount(environment.reducedMotion ? clusters.length : 0)
    forced.current = false
    cancelSound.current()
    if (!visible || environment.reducedMotion) return
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
    if (complete) cancelSound.current()
  }, [complete])
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
  return (
    <section
      className={`kin-coach ${inline ? 'kin-inline' : compact ? 'kin-compact' : 'kin-dock'}`}
      data-tutorial-step={state.step}
      data-mood={prompt.mood}
      aria-label="คินพาฝึกเล่น"
    >
      <div className="kin-portrait" aria-hidden="true">
        <img
          src={failed ? '/assets/entry/kin.png' : `/assets/tutorial/kin/${prompt.mood}-${face}.png`}
          onError={() => setFailed(true)}
          alt=""
          draggable={false}
        />
        <span>TC / 04</span>
      </div>
      <div className="kin-dialogue-body">
        <header>
          <span ref={speaker} tabIndex={-1} className="kin-name">
            คิน
          </span>
          <span className="kin-channel">TECHCARE / FIELD LINK</span>
          <button className="kin-skip" onClick={() => tutorial.skip()}>
            ข้ามการฝึก
          </button>
        </header>
        <p className="kin-line">
          <span aria-hidden="true">{complete ? text : clusters.slice(0, count).join('')}</span>
          <span className="sr-only" aria-live="polite" aria-atomic="true">
            {text}
          </span>
        </p>
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
              ลองใช้ปุ่มที่มีกรอบสีอำพัน
            </span>
          )}
        </div>
        {state.storageWarning && (
          <small className="kin-storage-warning">
            จำการฝึกในเครื่องไม่ได้ ยังฝึกต่อในรอบนี้ได้
          </small>
        )}
      </div>
    </section>
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
