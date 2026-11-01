import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { TheftEscape } from './TheftEscape'
import {
  caseNarrative,
  titleComposition,
  type CinematicLayer,
  type StoryShot,
} from '../narrative/case'

export function KinLayers() {
  const [failed, setFailed] = useState(false)
  if (failed) return <span className="kin-sprite-fallback" aria-hidden="true" />
  return (
    <div className="kin-layers" aria-hidden="true">
      {['body', 'head', 'arm'].map((part) => (
        <img
          key={part}
          className={`kin-${part}`}
          src="/assets/entry/kin.png"
          alt=""
          onError={() => setFailed(true)}
          draggable={false}
        />
      ))}
    </div>
  )
}

function Rain() {
  return (
    <div className="rain-layer">
      {Array.from({ length: 22 }, (_, i) => (
        <i
          key={i}
          style={
            {
              '--rain-x': `${(i * 47) % 100}%`,
              '--rain-delay': `${-i * 0.17}s`,
              '--rain-duration': `${0.8 + (i % 4) * 0.22}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
const layerContent: Record<CinematicLayer['kind'], () => ReactNode> = {
  kin: () => <KinLayers />,
  rain: () => <Rain />,
  monitor: () => <div className="monitor-light" />,
  beacon: () => <span className="status-beacon" />,
  tamper: () => <span className="vault-tamper" />,
  network: () => (
    <div className="network-brief">
      <small>{caseNarrative.artifact.name} / EMERGENCY AUTH</small>
      <strong>เครือข่ายสื่อสารฉุกเฉิน</strong>
      <div className="network-route">
        {[1, 2, 3].map((n) => (
          <span key={n}>
            <i />
            {`สถานี 0${n}`}
          </span>
        ))}
      </div>
      <p>ยืนยันคำสั่งผ่านสถานีสำคัญ 3 แห่ง</p>
    </div>
  ),
  memory: () => (
    <div className="memory-return">
      <div className="unit-dossier">
        <small>FIELD ARCHIVE / TC-04</small>
        <strong>หมายเลขหน่วยเก่า</strong>
        <span>แฟ้มคู่หู · ขาดการติดต่อ</span>
        <i />
        <p>ยังไม่มีหลักฐานยืนยันตัวคนร้าย</p>
      </div>
    </div>
  ),
  file: () => (
    <>
      <span className="shop-light" />
      <div className="case-card">
        <span>{caseNarrative.camera.id}</span>
        <b>01</b>
        <small>ARUN / REPAIR</small>
        <i />
      </div>
    </>
  ),
  signal: () => <div className="signal-interruption" />,
  cable: () => (
    <svg className="loose-cable" viewBox="0 0 100 150">
      <path d="M45 0V35H55V70H65V105H55V132" fill="none" stroke="#08151c" strokeWidth="9" />
      <path d="M43 0V35H53V70H63V105H53V132" fill="none" stroke="#617f85" strokeWidth="3" />
      <path d="M47 130H62V145H47Z" fill="#243c43" stroke="#9bb0b3" strokeWidth="2" />
    </svg>
  ),
}

export function CinematicArt({
  art,
  description,
  composition = titleComposition,
  title = false,
  escaping = false,
  onEscapeUnavailable,
}: {
  art: string
  description: string
  composition?: StoryShot['composition']
  title?: boolean
  escaping?: boolean
  onEscapeUnavailable?: () => void
}) {
  const surface = useRef<HTMLDivElement>(null)
  const [space, setSpace] = useState({ left: 0, top: 0, scale: 1 })
  useLayoutEffect(() => {
    const element = surface.current
    if (!element) return
    const update = () => {
      const { width, height } = element.getBoundingClientRect()
      const scale = Math.max(width / 1280, height / 720)
      setSpace({ left: (width - 1280 * scale) / 2, top: (height - 720 * scale) / 2, scale })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const retry = () => {
    setFailed(false)
    setAttempt((v) => v + 1)
  }
  return (
    <div
      ref={surface}
      className={`story-art art-${composition.name}${title ? ' title-art' : ''}`}
      data-art-error={failed}
      style={{ '--shot-art': `url("${art}")` } as CSSProperties}
    >
      <div
        className="cinematic-space"
        style={{ left: space.left, top: space.top, transform: `scale(${space.scale})` }}
      >
        {composition.name === 'vault' ? (
          <TheftEscape running={escaping} onUnavailable={onEscapeUnavailable} />
        ) : (
          <>
            <img
              className="scene-plate"
              key={attempt}
              src={`${art}${attempt ? `?retry=${attempt}` : ''}`}
              alt={description}
              onError={() => setFailed(true)}
              draggable={false}
            />
            {!failed &&
              composition.layers.map((layer) => (
                <div
                  key={layer.id}
                  className={`shot-layer layer-${layer.kind}`}
                  data-layer={layer.id}
                  style={
                    {
                      ...layer.placement,
                      '--layer-delay': `${layer.delayMs ?? 0}ms`,
                    } as CSSProperties
                  }
                  aria-hidden="true"
                >
                  {layerContent[layer.kind]()}
                </div>
              ))}
          </>
        )}
      </div>
      <div className="art-vignette" aria-hidden="true" />
      {failed && (
        <div className="art-fallback">
          <p role="status">ภาพประกอบโหลดไม่สำเร็จ คุณยังอ่านและเล่นต่อได้</p>
          <button type="button" onClick={retry}>
            ลองโหลดภาพใหม่
          </button>
        </div>
      )}
    </div>
  )
}
