import { useId } from 'react'
import './gate-lighting.css'

// Coordinates belong to the 1672×941 entrance plate, not the browser viewport.
const fixtures = [
  { id: 'door', core: 'M1105 151L1356 99L1365 110L1113 163Z', x: 1235, y: 160, rx: 240, ry: 100 },
  { id: 'ceiling', core: 'M771 103L857 65L865 75L778 114Z', x: 815, y: 90, rx: 120, ry: 85 },
  { id: 'amber', core: 'M1593 81L1619 76L1621 126L1593 133Z', x: 1607, y: 103, rx: 100, ry: 145 },
  {
    id: 'reader',
    core: 'M1417 350L1451 350L1451 428L1417 428Z',
    x: 1435,
    y: 390,
    rx: 100,
    ry: 145,
  },
] as const

/** Decorative practical lights only; account input and door timing stay in AccessGate. */
export function GateLighting() {
  const id = `gate-light-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  return (
    <svg className="gate-lighting" viewBox="0 0 1672 941" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${id}-cyan`}>
          <stop stopColor="#48e8ff" stopOpacity=".63" />
          <stop offset=".45" stopColor="#26bce9" stopOpacity=".23" />
          <stop offset="1" stopColor="#26bce9" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-amber`}>
          <stop stopColor="#ffd16d" stopOpacity=".8" />
          <stop offset=".42" stopColor="#ff9e35" stopOpacity=".34" />
          <stop offset="1" stopColor="#ff9e35" stopOpacity="0" />
        </radialGradient>
      </defs>
      {fixtures.map((light) => (
        <g
          key={light.id}
          className={`gate-light-fixture gate-light-fixture--${light.id}`}
          data-light={light.id}
        >
          {/* Darken the baked white emitter so an off phase is visible, too. */}
          <path className="gate-light-dim" d={light.core} />
          <g className="gate-light-emission">
            <ellipse
              className="gate-light-spill"
              cx={light.x}
              cy={light.y}
              rx={light.rx}
              ry={light.ry}
              fill={`url(#${id}-${light.id === 'amber' ? 'amber' : 'cyan'})`}
            />
            {light.id === 'door' && (
              <ellipse
                className="gate-light-reflection"
                cx="1235"
                cy="795"
                rx="240"
                ry="95"
                fill={`url(#${id}-cyan)`}
              />
            )}
          </g>
        </g>
      ))}
    </svg>
  )
}
