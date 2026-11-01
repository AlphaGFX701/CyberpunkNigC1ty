import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { circuitChapter, type CircuitChapterId } from './chapter-adapter'
import { store, changeView, type Overlay } from '../model'
import { PixelButton, PixelKey } from '../ui/PixelUI'
import { useDialogueAudio, useTutorialState } from '../tutorial/Tutorial'
import { tutorial } from '../tutorial/model'
import { tutorialAllows } from '../tutorial/controls'
import { DialogueSurface } from '../ui/DialogueSurface'
import './circuit.css'

const CircuitScene = lazy(() => import('./CircuitScene'))
class Recover extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: Error) {
    console.warn('Circuit City renderer unavailable:', error.message)
    this.props.onFailure()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}
export function CircuitCityMap({
  chapterId = 'arun',
  paused,
  reducedMotion,
  overlay,
}: {
  chapterId?: CircuitChapterId
  paused: boolean
  reducedMotion: boolean
  overlay: Overlay
}) {
  const adapter = useMemo(() => circuitChapter(chapterId), [chapterId])
  const state = useSyncExternalStore(adapter.subscribe, adapter.get)
  const recovered = adapter.recovered(state)
  const stages = adapter.stages
  const current = Math.min(7, state.completed.length)
  const completed = useMemo(
    () => [...state.completed, ...(recovered ? [7] : [])],
    [state.completed, recovered]
  )
  const [selected, setSelected] = useState<number | null>(null),
    [list, setList] = useState(false)
  const [fallback, setFallback] = useState(false),
    [ready, setReady] = useState(false)
  const [fallbackReason, setFallbackReason] = useState('')
  const [turnDelta, setTurn] = useState(0),
    [zoomDelta, setZoom] = useState(0),
    [resetToken, setReset] = useState(0)
  const [message, setMessage] = useState('')
  const { audio, talkSound, active, dialog } = useDialogueAudio()
  const previous = useRef(state.completed.length + (recovered ? 1 : 0))
  const blocked = paused || overlay !== null
  const training = useTutorialState()
  const guided = chapterId === 'arun' && Boolean(training.step)
  const onReady = useCallback(() => {
    setReady(true)
    store.set({ ready: true, error: '' })
  }, [])
  const fail = useCallback((reason = 'renderer-unavailable') => {
    setFallbackReason(reason)
    if (reason !== 'manual-list') console.warn(`Circuit City list fallback: ${reason}`)
    setFallback(true)
    setList(true)
    setReady(true)
    store.set({ ready: true, error: '' })
  }, [])
  useEffect(() => {
    store.set({ ready: true, error: '' })
    return () => {}
  }, [])
  useEffect(() => {
    if (ready || fallback) return
    const timer = setTimeout(() => fail('load-timeout'), 12000)
    return () => clearTimeout(timer)
  }, [ready, fallback, fail])
  useEffect(() => {
    if (blocked) return
    const count = state.completed.length + (recovered ? 1 : 0)
    if (count <= previous.current) {
      previous.current = count
      return
    }
    previous.current = count
    const line = adapter.line(state.completed.length, recovered)
    setMessage(line)
    const confirm = audio?.playCue('confirm')
    const talk = active && !dialog && talkSound ? audio?.playTalkLine(line, 'kin') : undefined
    const timer = setTimeout(() => setMessage(''), 6500)
    return () => {
      clearTimeout(timer)
      confirm?.()
      talk?.()
    }
  }, [state.completed.length, recovered, audio, talkSound, active, dialog, blocked])
  const choose = (index: number) => {
    if (guided && (index !== 0 || !tutorialAllows('circuit-stage-0'))) return
    if (!blocked && index <= current) {
      setSelected(index)
      if (!fallback) setList(false)
    }
  }
  useEffect(() => {
    const closeDetail = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || blocked || selected === null) return
      event.preventDefault()
      event.stopPropagation()
      setSelected(null)
    }
    window.addEventListener('keydown', closeDetail, true)
    return () => window.removeEventListener('keydown', closeDetail, true)
  }, [blocked, selected])
  const open = () => {
    if (selected === null || blocked) return
    if (guided && (selected !== 0 || !tutorialAllows('circuit-start'))) return
    if (selected === 7) {
      if (adapter.canOpenFinal()) store.set({ overlay: 'recovery' })
    } else if (adapter.canOpenTask(selected)) {
      store.set({ taskIndex: selected, overlay: 'terminal' })
      if (guided) tutorial.notify('terminal-opened')
    }
  }
  return (
    <section
      className="world-frame circuit-map"
      data-view="device"
      data-chapter={chapterId}
      data-renderer={fallback ? 'list' : '3d'}
      data-fallback-reason={fallbackReason || undefined}
      data-completed={state.completed.length}
      data-reduced-motion={reducedMotion}
      aria-label="Circuit City เมืองวงจรเลือกภารกิจ"
    >
      {!fallback && (
        <Recover onFailure={fail}>
          <Suspense fallback={null}>
            <CircuitScene
              chapterId={chapterId}
              completed={completed}
              selected={selected}
              current={current}
              paused={paused}
              inputBlocked={blocked || (guided && !tutorialAllows('circuit-list'))}
              reducedMotion={reducedMotion}
              turnDelta={turnDelta}
              zoomDelta={zoomDelta}
              resetToken={resetToken}
              onSelect={choose}
              onReady={onReady}
              onFailure={fail}
            />
          </Suspense>
        </Recover>
      )}
      {!ready && !fallback && (
        <div className="circuit-loading" role="status">
          กำลังประกอบเมืองวงจร… <button onClick={() => fail('manual-list')}>ใช้รายการด่าน</button>
        </div>
      )}
      <header className="circuit-heading">
        <span>TECHCARE / DEVICE RECOVERY</span>
        <h1>CIRCUIT CITY</h1>
        <p>{adapter.heading}</p>
        <PixelButton
          data-tutorial-target="circuit-list"
          onClick={() => {
            setSelected(null)
            setList(!list)
          }}
          disabled={blocked || (guided && !tutorialAllows('circuit-list'))}
          aria-expanded={list}
          aria-label="รายชื่อด่าน Circuit City"
        >
          รายชื่อด่าน <span>⌄</span>
        </PixelButton>
      </header>
      <aside className="circuit-progress" aria-label="ความคืบหน้า Circuit City">
        <span>
          {adapter.score().toString().padStart(3, '0')} <small>PTS</small>
        </span>
        <strong>
          {recovered
            ? adapter.success
            : current === 7
              ? adapter.finalObjective
              : 'ซ่อมเขต ' + String(current + 1).padStart(2, '0') + ' · ' + stages[current].title}
        </strong>
        <div>
          {stages.map((s, i) => (
            <i key={s.short} data-done={completed.includes(i)} data-current={i === current} />
          ))}
        </div>
        <small>
          HTML {state.completed.length}/7 · {adapter.finalLabel}{' '}
          {recovered ? 'กู้แล้ว' : current === 7 ? 'พร้อมกู้' : 'ล็อก'}
        </small>
      </aside>
      {!fallback && (
        <nav className="circuit-camera" aria-label="ควบคุมเมืองวงจร">
          {[
            ['หมุนซ้าย', '↶', () => setTurn((v) => v - 1)],
            ['หมุนขวา', '↷', () => setTurn((v) => v + 1)],
            ['ซูมเข้า', '+', () => setZoom((v) => v + 1)],
            ['ซูมออก', '−', () => setZoom((v) => v - 1)],
            [
              'คืนมุมมอง',
              '⌖',
              () => {
                setSelected(null)
                setReset((v) => v + 1)
              },
            ],
          ].map(([name, glyph, action]) => (
            <button
              key={String(name)}
              aria-label={String(name)}
              title={String(name)}
              onClick={action as () => void}
              disabled={blocked}
            >
              {String(glyph)}
            </button>
          ))}
        </nav>
      )}
      {(list || fallback) && (
        <nav className="circuit-list" aria-label="รายการภารกิจ Circuit City">
          {stages.map((s, i) => (
            <button
              key={s.short}
              data-testid={`circuit-stage-${i}`}
              data-tutorial-target={i === 0 ? 'circuit-stage-0' : undefined}
              disabled={
                blocked ||
                i > current ||
                (guided && (i !== 0 || !tutorialAllows('circuit-stage-0')))
              }
              data-done={completed.includes(i)}
              data-selected={selected === i}
              onClick={() => choose(i)}
            >
              <b>{completed.includes(i) ? '✓' : String(i + 1).padStart(2, '0')}</b>
              <span>{s.title}</span>
              <small>{i > current ? 'ล็อก' : completed.includes(i) ? 'ทบทวน' : 'เริ่มได้'}</small>
            </button>
          ))}
        </nav>
      )}
      {selected !== null && !blocked && (
        <aside className="circuit-detail" aria-label="รายละเอียดด่านที่เลือก">
          <button
            className="circuit-close"
            onClick={() => setSelected(null)}
            aria-label="ปิดรายละเอียดด่าน"
          >
            ×
          </button>
          <span>
            SECTOR {String(selected + 1).padStart(2, '0')} / {stages[selected].short}
          </span>
          <h2>{stages[selected].title}</h2>
          <p>{adapter.instruction(selected)}</p>
          <PixelButton
            variant="primary"
            data-testid="circuit-start"
            data-tutorial-target="circuit-start"
            onClick={open}
          >
            {completed.includes(selected)
              ? 'เปิดทบทวน'
              : selected === 7
                ? adapter.finalAction
                : 'เริ่มซ่อม'}{' '}
            <span>→</span>
          </PixelButton>
        </aside>
      )}
      {message && !overlay && (
        <div className="circuit-kin" role="status">
          <DialogueSurface
            speaker="คิน"
            compact
            reducedMotion={reducedMotion}
            portrait={<img src="/assets/tutorial/kin/smirk-idle.png" alt="" />}
            text={message}
          />
        </div>
      )}
      <footer className="circuit-bottom">
        <PixelButton onClick={() => changeView('street')} disabled={blocked}>
          {adapter.returnLabel}
        </PixelButton>
        <span>
          {fallback
            ? 'เลือกด่านที่เปิดแล้วจากรายการ'
            : 'ลากเพื่อหมุน · ล้อเมาส์ซูม · คลิกอาคารเพื่อดูงานซ่อม'}{' '}
          <PixelKey>Esc</PixelKey> เมนู
        </span>
      </footer>
    </section>
  )
}
