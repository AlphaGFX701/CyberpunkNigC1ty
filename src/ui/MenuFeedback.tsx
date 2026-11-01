import { useEffect, useRef, type RefObject } from 'react'
import './menu-feedback.css'

type MenuFeedbackProps = {
  surfaceRef: RefObject<HTMLElement | null>
  reduced: boolean
  enabled: boolean
}

/** A title-surface input adapter; text and button hit targets never move with parallax. */
export function MenuFeedback({ surfaceRef, reduced, enabled }: MenuFeedbackProps) {
  const cursor = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const surface = surfaceRef.current
    const reticle = cursor.current
    if (!surface || !reticle || !enabled || reduced || typeof matchMedia !== 'function') return
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)')
    let frame = 0
    let point: { x: number; y: number; target: Element | null } | null = null
    let disposed = false

    const reset = () => {
      if (frame) cancelAnimationFrame(frame)
      frame = 0
      point = null
      surface.removeAttribute('data-menu-cursor')
      surface.style.setProperty('--menu-x', '0px')
      surface.style.setProperty('--menu-y', '0px')
      reticle.dataset.visible = 'false'
      reticle.dataset.hover = 'false'
      reticle.dataset.pressed = 'false'
    }
    const paint = () => {
      frame = 0
      if (disposed || !point || !finePointer.matches) return
      const bounds = surface.getBoundingClientRect()
      const x = Math.max(-1, Math.min(1, ((point.x - bounds.left) / bounds.width - 0.5) * 2))
      const y = Math.max(-1, Math.min(1, ((point.y - bounds.top) / bounds.height - 0.5) * 2))
      surface.style.setProperty('--menu-x', `${(x * 8).toFixed(2)}px`)
      surface.style.setProperty('--menu-y', `${(y * 8).toFixed(2)}px`)
      const textInput = point.target?.closest(
        'input, textarea, select, [contenteditable="true"], [role="textbox"]'
      )
      if (textInput) {
        surface.removeAttribute('data-menu-cursor')
        reticle.dataset.visible = 'false'
        return
      }
      reticle.style.transform = `translate3d(${point.x}px, ${point.y}px, 0)`
      reticle.dataset.hover = String(
        Boolean(point.target?.closest('button:not(:disabled), a[href], summary'))
      )
      reticle.dataset.visible = 'true'
      surface.dataset.menuCursor = 'active'
    }
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || !finePointer.matches) {
        reset()
        return
      }
      point = {
        x: event.clientX,
        y: event.clientY,
        target: event.target instanceof Element ? event.target : null,
      }
      if (!frame) frame = requestAnimationFrame(paint)
    }
    const down = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && reticle.dataset.visible === 'true')
        reticle.dataset.pressed = 'true'
    }
    const up = () => {
      reticle.dataset.pressed = 'false'
    }
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Tab') reset()
    }
    surface.addEventListener('pointermove', move, { passive: true })
    surface.addEventListener('pointerleave', reset)
    surface.addEventListener('pointercancel', reset)
    surface.addEventListener('pointerdown', down, { passive: true })
    window.addEventListener('pointerup', up, { passive: true })
    window.addEventListener('blur', reset)
    window.addEventListener('scroll', reset, { passive: true })
    window.addEventListener('keydown', keyboard)
    finePointer.addEventListener('change', reset)
    return () => {
      disposed = true
      reset()
      surface.removeEventListener('pointermove', move)
      surface.removeEventListener('pointerleave', reset)
      surface.removeEventListener('pointercancel', reset)
      surface.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('blur', reset)
      window.removeEventListener('scroll', reset)
      window.removeEventListener('keydown', keyboard)
      finePointer.removeEventListener('change', reset)
    }
  }, [surfaceRef, reduced, enabled])

  if (!enabled || reduced) return null
  return (
    <div
      ref={cursor}
      className="menu-reticle"
      data-visible="false"
      data-hover="false"
      data-pressed="false"
      aria-hidden="true"
    >
      <i />
      <i />
      <i />
      <i />
      <span />
    </div>
  )
}
