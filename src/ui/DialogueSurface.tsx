import type { ReactNode } from 'react'
import { PixelPanel } from './PixelUI'
import './dialogue-surface.css'

export type DialogueSurfaceProps = {
  speaker: string
  portrait?: ReactNode
  text?: ReactNode
  children?: ReactNode
  actions?: ReactNode
  channel?: string
  compact?: boolean
  className?: string
  reducedMotion?: boolean
}

/** Shared presentation only. Modal or the tutorial remains the sole input/focus owner. */
export function DialogueSurface({
  speaker,
  portrait,
  text,
  children,
  actions,
  channel = 'TECHCARE / FIELD LINK',
  compact = false,
  className = '',
  reducedMotion = false,
}: DialogueSurfaceProps) {
  return (
    <PixelPanel
      variant="dialogue"
      className={`dialogue-surface ${compact ? 'dialogue-surface--compact' : ''} ${className}`}
      data-reduced-motion={reducedMotion}
    >
      {portrait && (
        <div className="dialogue-surface__portrait" aria-hidden="true">
          {portrait}
        </div>
      )}
      <div className="dialogue-surface__body">
        <header className="dialogue-surface__speaker">
          <h3>{speaker}</h3>
          <span>{channel}</span>
        </header>
        <div className="dialogue-surface__text">
          {text !== undefined ? (
            <p aria-live="polite" aria-atomic="true">
              {text}
            </p>
          ) : (
            children
          )}
        </div>
        {actions && <footer className="dialogue-surface__actions">{actions}</footer>}
      </div>
    </PixelPanel>
  )
}
