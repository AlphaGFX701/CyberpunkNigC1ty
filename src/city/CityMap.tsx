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
import { PixelButton, PixelIcon } from '../ui/PixelUI'
import { Modal } from '../ui/Modal'
import { store, changeView, type Overlay } from '../model'
import { cityProgress, canAccessArea, type AreaId } from './progression'
import { areaById, cityAreas, currentObjective } from './areas'
import './city-map.css'
import { tutorial } from '../tutorial/model'
import { tutorialAllows } from '../tutorial/controls'
import { useTutorialState } from '../tutorial/Tutorial'

const CityScene = lazy(() => import('./CityScene'))
class SceneRecovery extends Component<
  { children: ReactNode; onFailure: (message: string) => void },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onFailure('เปิดภาพสามมิติไม่ได้ ยังเลือกสถานที่จากรายการได้')
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

export function CityMap({
  paused,
  reducedMotion,
  overlay,
}: {
  paused: boolean
  reducedMotion: boolean
  overlay: Overlay
}) {
  const progress = useSyncExternalStore(cityProgress.subscribe, cityProgress.get)
  const training = useTutorialState()
  const tutorialCamera = useMemo(
    () =>
      training.step === 'camera-demo'
        ? { id: training.revision, kind: 'demo' as const }
        : undefined,
    [training.step, training.revision]
  )
  const cameraAction = useCallback((kind: 'rotate' | 'zoom' | 'reset') => {
    tutorial.notify(
      kind === 'rotate' ? 'camera-rotated' : kind === 'zoom' ? 'camera-zoomed' : 'camera-reset'
    )
  }, [])
  const [selected, setSelected] = useState<AreaId | null>(null)
  const [listOpen, setListOpen] = useState(false)
  const [travelling, setTravelling] = useState<AreaId | null>(null)
  const [intel, setIntel] = useState<'relay' | 'control' | null>(null)
  const [fallback, setFallback] = useState(false)
  const [failure, setFailure] = useState('')
  const [ready, setReady] = useState(false)
  const [resetToken, setResetToken] = useState(0)
  const [zoomDelta, setZoomDelta] = useState(0)
  const [turnDelta, setTurnDelta] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const [announcement, setAnnouncement] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  const available = useMemo(
    () => cityAreas.filter((a) => canAccessArea(progress, a.id)),
    [progress]
  )
  const accessible = useMemo(() => available.map((a) => a.id), [available])
  const detail = selected ? areaById(selected) : null
  const objective = currentObjective(progress)
  const blocked = paused || travelling !== null || overlay !== null
  useEffect(() => {
    if (training.step === 'intro') {
      setSelected(null)
      setListOpen(false)
      setTravelling(null)
    }
    if (training.step === 'list-open') setListOpen(false)
    if (fallback) tutorial.notify('renderer-list')
  }, [training.step, fallback])

  const fail = useCallback((message: string) => {
    setFailure(message)
    setFallback(true)
    setListOpen(true)
    setReady(true)
    store.set({ ready: true })
  }, [])
  const sceneReady = useCallback(() => {
    setReady(true)
    store.set({ ready: true, error: '' })
  }, [])
  useEffect(() => {
    setReady(false)
    store.set({ ready: false, error: '' })
    try {
      const probe = document.createElement('canvas')
      const gl = probe.getContext('webgl2', { failIfMajorPerformanceCaveat: false })
      if (!gl) {
        fail('อุปกรณ์นี้เปิดภาพสามมิติไม่ได้ เลือกสถานที่จากรายการเพื่อเล่นต่อได้')
        return
      }
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    } catch {
      fail('เปิดภาพสามมิติไม่ได้ ยังใช้แผนที่แบบรายการได้')
    }
  }, [attempt, fail])
  useEffect(() => {
    if (selected) heading.current?.focus()
  }, [selected])
  useEffect(() => {
    if (overlay !== 'intel') setIntel(null)
  }, [overlay])
  useEffect(() => {
    if (!travelling || paused || overlay) return
    const timer = setTimeout(
      () => {
        const target = travelling
        setTravelling(null)
        // A replay cannot commit an arrival queued by the previous walkthrough.
        const step = tutorial.get().step
        if (step && step !== 'travel') return
        if (!cityProgress.arrive(target)) return
        setAnnouncement(`เดินทางถึง${areaById(target).name}`)
        if (target === 'arun') {
          changeView('street')
          return
        }
        if (target === 'base') {
          store.set({ overlay: 'brief' })
          return
        }
        setIntel(target)
        store.set({ overlay: 'intel' })
      },
      reducedMotion ? 0 : 650
    )
    return () => clearTimeout(timer)
  }, [travelling, paused, overlay, reducedMotion])
  useEffect(() => {
    if (!announcement) return
    const timer = setTimeout(() => setAnnouncement(''), 4500)
    return () => clearTimeout(timer)
  }, [announcement])
  const choose = useCallback(
    (id: AreaId) => {
      if (blocked || !canAccessArea(cityProgress.get(), id)) return
      if (!tutorialAllows(id === 'arun' ? 'area-arun' : `area-${id}`)) return
      setSelected(id)
      setListOpen(false)
      if (id === 'arun') tutorial.notify('area-arun-selected')
    },
    [blocked]
  )
  const enter = () => {
    if (!detail || blocked || !canAccessArea(cityProgress.get(), detail.id)) return
    if (!tutorialAllows(detail.id === 'arun' ? 'enter-arun' : `enter-${detail.id}`)) return
    setTravelling(detail.id)
  }
  const closeIntel = () => {
    setIntel(null)
    store.set({ overlay: null })
  }
  const saveIntel = () => {
    if (!intel || !cityProgress.readIntel(intel)) return
    setAnnouncement(
      intel === 'relay'
        ? 'พบตำแหน่งศูนย์ควบคุมแล้ว'
        : 'เก็บข่าวกรองครบแล้ว ภารกิจภาคสนามจะเพิ่มในตอนถัดไป'
    )
    closeIntel()
  }
  const showFallback = () => {
    setFallback(true)
    setListOpen(true)
    setReady(true)
    store.set({ ready: true })
  }
  return (
    <section
      className="world-frame city-map"
      data-view="map"
      data-current-area={progress.currentArea}
      data-ready={ready}
      data-renderer={fallback ? 'list' : '3d'}
      aria-label="แผนที่โฮโลแกรมเมืองฝั่งตะวันออก"
    >
      {!fallback && (
        <SceneRecovery key={attempt} onFailure={fail}>
          <Suspense fallback={null}>
            <CityScene
              accessible={accessible}
              selected={selected}
              current={progress.currentArea}
              onSelect={choose}
              onReady={sceneReady}
              onFailure={fail}
              paused={blocked}
              controlsLocked={Boolean(training.step && !['rotate', 'zoom'].includes(training.step))}
              tutorialCamera={tutorialCamera}
              onTutorialCameraDone={(id) => {
                if (tutorial.get().revision === id) tutorial.notify('camera-demo-done')
              }}
              onManualCamera={cameraAction}
              onCameraActionDone={cameraAction}
              reducedMotion={reducedMotion}
              resetToken={resetToken}
              zoomDelta={zoomDelta}
              turnDelta={turnDelta}
            />
          </Suspense>
        </SceneRecovery>
      )}
      {fallback && (
        <div className="city-list-backdrop" aria-hidden="true">
          <div />
          <span>EAST BANK / DISTRICT NETWORK</span>
        </div>
      )}
      <div className="city-noise" aria-hidden="true" />
      {!ready && !fallback && (
        <div className="city-loading" role="status">
          <span className="city-loader" />
          กำลังสร้างแบบจำลองเมือง…<button onClick={showFallback}>ใช้แผนที่แบบรายการ</button>
        </div>
      )}
      <header className="city-header">
        <span className="eyebrow">TECHCARE / CITY OPERATIONS</span>
        <h1>ย่านฝั่งตะวันออก</h1>
        <p>
          <i />
          คินอยู่ที่ <strong>{areaById(progress.currentArea).name}</strong>
        </p>
        <div>
          <span>{available.length} / 4 พื้นที่เปิด</span>
          <button
            aria-label="รายชื่อพื้นที่"
            data-tutorial-target="areas"
            disabled={!tutorialAllows('areas') || blocked}
            onClick={() => {
              setListOpen(!listOpen)
              if (!listOpen) tutorial.notify('areas-opened')
            }}
            aria-expanded={listOpen}
            aria-controls="city-places"
          >
            รายชื่อพื้นที่ <span>⌄</span>
          </button>
        </div>
      </header>
      <div className="city-top-label" aria-hidden="true">
        <span>BLACKBOX / TRACE NETWORK</span>
        <i />
        HOLOGRAPHIC VIEW
      </div>
      {!fallback && (
        <nav className="city-camera-tools" aria-label="ควบคุมมุมมองแผนที่">
          <button
            aria-label="หมุนซ้าย"
            title="หมุนซ้าย"
            disabled={blocked || !tutorialAllows('rotate-left')}
            data-tutorial-target="rotate-left"
            onClick={() => setTurnDelta((v) => v - 1)}
          >
            ↶
          </button>
          <button
            aria-label="หมุนขวา"
            title="หมุนขวา"
            disabled={blocked || !tutorialAllows('rotate-right')}
            data-tutorial-target="rotate-right"
            onClick={() => setTurnDelta((v) => v + 1)}
          >
            ↷
          </button>
          <span />
          <button
            aria-label="ซูมเข้า"
            title="ซูมเข้า"
            disabled={blocked || !tutorialAllows('zoom-in')}
            data-tutorial-target="zoom-in"
            onClick={() => setZoomDelta((v) => v + 1)}
          >
            ＋
          </button>
          <button
            aria-label="ซูมออก"
            title="ซูมออก"
            disabled={blocked || !tutorialAllows('zoom-out')}
            data-tutorial-target="zoom-out"
            onClick={() => setZoomDelta((v) => v - 1)}
          >
            −
          </button>
          <button
            aria-label="คืนมุมมอง"
            title="คืนมุมมอง"
            disabled={blocked || !tutorialAllows('reset-camera')}
            data-tutorial-target="reset-camera"
            onClick={() => {
              setSelected(null)
              setResetToken((v) => v + 1)
            }}
          >
            ⌖
          </button>
        </nav>
      )}
      {listOpen && (
        <aside className="city-place-list" id="city-places">
          <div>
            <span>จุดที่เปิดให้สำรวจ</span>
            <button
              aria-label="ปิดรายชื่อพื้นที่"
              disabled={Boolean(training.step)}
              onClick={() => setListOpen(false)}
            >
              ×
            </button>
          </div>
          {available.map((a) => (
            <button
              key={a.id}
              onClick={() => choose(a.id)}
              aria-label={`สำรวจ ${a.name}`}
              data-tutorial-target={`area-${a.id}`}
              disabled={blocked || !tutorialAllows(`area-${a.id}`)}
            >
              <small>{a.code}</small>
              <strong>{a.name}</strong>
              <span>
                {a.id === progress.currentArea
                  ? 'อยู่ที่นี่'
                  : a.kind === 'intel'
                    ? 'ข่าวกรอง'
                    : 'พร้อมสำรวจ'}{' '}
                →
              </span>
            </button>
          ))}
        </aside>
      )}
      {detail && !listOpen && (
        <aside className="city-detail" data-area={detail.id}>
          <div className="city-detail-head">
            <span>{detail.code}</span>
            <button
              aria-label="ปิดข้อมูลพื้นที่"
              disabled={Boolean(training.step)}
              onClick={() => setSelected(null)}
            >
              ×
            </button>
          </div>
          <small className="city-area-kind">
            {detail.kind === 'intel'
              ? 'แฟ้มข่าวกรอง'
              : detail.kind === 'base'
                ? 'ฐานปฏิบัติการ'
                : 'ภารกิจภาคสนาม'}
          </small>
          <h2 ref={heading} tabIndex={-1}>
            {detail.name}
          </h2>
          <p className="city-district">{detail.district}</p>
          <p>{detail.summary}</p>
          <div className="city-detail-task">
            <PixelIcon name="quest-active" />
            <div>
              <small>เป้าหมาย</small>
              <strong>{detail.task}</strong>
            </div>
          </div>
          <p className="city-detail-evidence">
            <span>หลักฐาน</span>
            {detail.evidence}
          </p>
          {detail.kind === 'intel' && (
            <p className="city-intel-note">สำรวจข้อมูลได้ · ภารกิจเต็มอยู่ในแผนพัฒนาถัดไป</p>
          )}
          <PixelButton
            variant="primary"
            aria-label={
              detail.kind === 'intel'
                ? 'อ่านข่าวกรอง'
                : detail.kind === 'base'
                  ? 'เปิดแฟ้มคดี'
                  : 'เข้าสำรวจ'
            }
            data-tutorial-target={`enter-${detail.id}`}
            disabled={blocked || !tutorialAllows(`enter-${detail.id}`)}
            onClick={enter}
          >
            {travelling
              ? 'กำลังเดินทาง…'
              : detail.kind === 'intel'
                ? 'อ่านข่าวกรอง'
                : detail.kind === 'base'
                  ? 'เปิดแฟ้มคดี'
                  : 'เข้าสำรวจ'}{' '}
            <span>→</span>
          </PixelButton>
        </aside>
      )}
      <div className="city-current-objective objective">
        <span className="city-objective-code">CASE 01 / NEXT LEAD</span>
        <strong>{objective}</strong>
        <div className="city-progress-strip">
          {[0, 1, 2].map((i) => (
            <i key={i} className={progress.completed.length > i ? 'done' : ''} />
          ))}
          <span>เบาะแส {progress.completed.length}/3</span>
        </div>
      </div>
      <footer className="city-bottom">
        <div>
          <span className="legend-open" />
          เปิดให้สำรวจ <span className="legend-locked" />
          ยังไม่พบเส้นทาง
        </div>
        <small>ลากเพื่อหมุน · ล้อเมาส์ซูม · คลิกขวาลากเพื่อเลื่อน</small>
        <button onClick={showFallback}>ใช้แผนที่แบบรายการ</button>
      </footer>
      {travelling && (
        <div className="city-travel" role="status">
          <div />
          <span>กำลังเดินทางไป {areaById(travelling).name}</span>
          <small>FIELD LINK / ESTABLISHING</small>
        </div>
      )}
      {(failure || progress.storageWarning) && (
        <p className="city-warning" role="status">
          {failure ||
            'บันทึกความคืบหน้าในเครื่องไม่ได้ หรือพบเซฟที่อ่านไม่ได้ ยังเล่นต่อในรอบนี้ได้'}
          {fallback && (
            <button
              onClick={() => {
                setFailure('')
                setFallback(false)
                setAttempt((v) => v + 1)
              }}
            >
              ลองเปิด 3D อีกครั้ง
            </button>
          )}
        </p>
      )}
      {announcement && (
        <div className="city-event-toast" role="status" aria-live="polite">
          {announcement}
        </div>
      )}
      {intel && overlay === 'intel' && (
        <Modal title={`ข่าวกรอง — ${areaById(intel).name}`} onClose={closeIntel}>
          <div className="city-intel">
            <span className="eyebrow">BLACKBOX / FIELD INTELLIGENCE</span>
            <h3>{areaById(intel).intel!.lead}</h3>
            {areaById(intel).intel!.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <PixelButton variant="primary" onClick={saveIntel}>
              บันทึกเบาะแส
            </PixelButton>
          </div>
        </Modal>
      )}
    </section>
  )
}
