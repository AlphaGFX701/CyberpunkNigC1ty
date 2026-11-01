import { useId, useState } from 'react'
import './gate-kin.css'

const sprite = '/assets/entry/kin-phone.webp'

/** Kin's gate pose owns only its artwork, local hand movement and phone lighting. */
export function GateKin() {
  const [failed, setFailed] = useState(false)
  const id = `kin-phone-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  return (
    <div className="gate-kin" data-character-error={failed} aria-hidden="true">
      {!failed && <>
        <svg width="0" height="0" className="gate-kin-masks" focusable="false">
          <defs>
            <clipPath id={id} clipPathUnits="objectBoundingBox">
              <path clipRule="evenodd" d="M0 0H1V1H0Z M.593 .261L.615 .256L.646 .258L.674 .269L.669 .287L.648 .297L.611 .295L.595 .281Z" />
            </clipPath>
          </defs>
        </svg>
        <div className="gate-kin-ground-shadow" />
        <div className="gate-kin-phone-beam" />
        <img className="gate-kin-body" src={sprite} alt="" draggable={false}
          style={{clipPath:`url(#${id})`}} onError={() => setFailed(true)} />
        <img className="gate-kin-hand" src={sprite} alt="" draggable={false} />
        <div className="gate-kin-screen" />
        <div className="gate-kin-phone-glow" />
      </>}
    </div>
  )
}
