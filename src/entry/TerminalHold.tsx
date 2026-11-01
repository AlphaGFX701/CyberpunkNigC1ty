import { useEffect, useRef, useState, type CSSProperties } from 'react'

/** Holding opens the account form; it never claims authentication succeeded. */
export function TerminalHold({
  enabled,
  onOpen,
  onStart,
  onCancel,
  variant = 'bar',
}: {
  enabled: boolean
  onOpen: () => void
  onStart: () => void
  onCancel: () => void
  variant?: 'bar' | 'reader'
}) {
  const [progress, setProgress] = useState(0)
  const callbacks = useRef({ onOpen, onStart, onCancel })
  callbacks.current = { onOpen, onStart, onCancel }
  useEffect(() => {
    let frame = 0,
      since = 0,
      holding = false
    const cancel = () => {
      holding = false
      cancelAnimationFrame(frame)
      setProgress(0)
      callbacks.current.onCancel()
    }
    const tick = (at: number) => {
      if (!holding) return
      const value = Math.min(1, (at - since) / 1200)
      setProgress(value)
      if (value >= 1) {
        holding = false
        callbacks.current.onCancel()
        callbacks.current.onOpen()
        setProgress(0)
      } else frame = requestAnimationFrame(tick)
    }
    const down = (event: KeyboardEvent) => {
      if (
        !enabled ||
        event.code !== 'KeyE' ||
        event.isComposing ||
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
      )
        return
      const target = event.target as HTMLElement | null
      if (target?.closest('input,textarea,select,[contenteditable="true"],[role="dialog"]')) return
      event.preventDefault()
      if (holding) return
      holding = true
      since = performance.now()
      callbacks.current.onStart()
      frame = requestAnimationFrame(tick)
    }
    const up = (event: KeyboardEvent) => {
      if (event.code === 'KeyE') cancel()
    }
    const hidden = () => {
      if (document.hidden) cancel()
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', cancel)
    document.addEventListener('visibilitychange', hidden)
    return () => {
      cancel()
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', cancel)
      document.removeEventListener('visibilitychange', hidden)
    }
  }, [enabled])
  return (
    <div
      className="terminal-access"
      data-holding={progress > 0}
      data-variant={variant}
      style={{ '--hold-progress': progress } as CSSProperties}
    >
      {variant === 'reader' && (
        <div className="terminal-reader-ring" aria-hidden="true">
          <span>
            <kbd className="gate-glitch" data-text="E">
              E
            </kbd>
            <small>
              <span className={progress > 0 ? undefined : 'gate-glitch'} data-text="HOLD E">
                {progress > 0 ? `${Math.round(progress * 100)}%` : 'HOLD E'}
              </span>
            </small>
          </span>
        </div>
      )}
      <div className="terminal-access-copy">
        <kbd>E</kbd>
        <span>{progress > 0 ? 'กำลังเปิดช่องเชื่อมต่อ…' : 'กดค้างเพื่อเปิดแฟ้มบัญชี'}</span>
        <small>1.2 SEC</small>
      </div>
      <div
        className="terminal-hold-track"
        role="progressbar"
        aria-label="เปิดช่องเชื่อมต่อบัญชี"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <i style={{ transform: `scaleX(${progress})` }} />
      </div>
    </div>
  )
}
