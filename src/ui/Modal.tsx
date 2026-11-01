import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { PixelButton, PixelPanel, type PanelKind } from './PixelUI'

/** Shared focus boundary for game terminals and entry menus. */
export function Modal({
  title,
  children,
  onClose,
  variant = 'window',
}: {
  title: string
  children: ReactNode
  onClose: () => void
  variant?: PanelKind
}) {
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const root = document.getElementById('root')!
    const wasInert = root.inert
    const previousOverflow = document.body.style.overflow
    root.inert = true
    document.body.style.overflow = 'hidden'
    const node = ref.current!
    const focusables = () =>
      Array.from(
        node.querySelectorAll<HTMLElement>(
          'button:not(:disabled), textarea, a[href], input:not(:disabled), select:not(:disabled), summary, [tabindex="0"]'
        )
      ).filter((e) => {
        const closed = e.closest('details:not([open])')
        if (closed && !closed.querySelector(':scope > summary')?.contains(e)) return false
        return e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden'
      })
    ;(node.querySelector<HTMLElement>('[data-autofocus]') ?? focusables()[0] ?? node).focus()
    const key = (event: KeyboardEvent) => {
      if (event.isComposing) return
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        closeRef.current()
      }
      if (event.key === 'Tab') {
        const items = focusables(),
          first = items[0],
          last = items.at(-1)
        if (!first) {
          event.preventDefault()
          node.focus()
          return
        }
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === node ||
            !node.contains(document.activeElement))
        ) {
          event.preventDefault()
          last?.focus()
        } else if (
          !event.shiftKey &&
          (document.activeElement === last || !node.contains(document.activeElement))
        ) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', key, true)
    return () => {
      document.removeEventListener('keydown', key, true)
      root.inert = wasInert
      document.body.style.overflow = previousOverflow
      if (previous?.isConnected && !previous.closest('[hidden]')) previous.focus()
    }
  }, [])
  return createPortal(
    <div
      className="modal-backdrop"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) event.preventDefault()
      }}
    >
      <PixelPanel
        variant={variant}
        className="modal"
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <header className="modal-head">
          <div>
            <span className="eyebrow">TECHCARE / FIELD TERMINAL</span>
            <h2>{title}</h2>
          </div>
          <PixelButton
            variant="icon"
            icon="icon-close"
            className="icon-button"
            aria-label="ปิดหน้าต่าง"
            data-tutorial-target="close-modal"
            onClick={onClose}
          />
        </header>
        {children}
      </PixelPanel>
    </div>,
    document.body
  )
}
