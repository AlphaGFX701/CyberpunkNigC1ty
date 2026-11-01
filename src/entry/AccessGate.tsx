import { useEffect, useRef, useState } from 'react'
import { EntryClock } from './EntryClock'
import { TerminalHold } from './TerminalHold'
import { GateKin } from './GateKin'
import { GateLighting } from './GateLighting'

/** This scene opens a door to the account page; it does not authenticate the player. */
export function AccessGate({
  enabled,
  onAccount,
  onHold,
  onCancel,
  onDoorOpen,
}: {
  enabled: boolean
  onAccount: () => void
  onHold: () => void
  onCancel: () => void
  onDoorOpen?: () => void
}) {
  const [failed, setFailed] = useState(false)
  const [opening, setOpening] = useState(false)
  const gate = useRef<HTMLElement>(null)
  const openingOnce = useRef(false)
  const transition = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const actions = useRef({ onAccount, onHold, onCancel, onDoorOpen })
  actions.current = { onAccount, onHold, onCancel, onDoorOpen }
  useEffect(
    () => () => {
      clearTimeout(transition.current)
      actions.current.onCancel()
    },
    []
  )
  const openDoor = () => {
    if (!enabled || openingOnce.current) return
    openingOnce.current = true
    setOpening(true)
    if (actions.current.onDoorOpen) actions.current.onDoorOpen()
    else actions.current.onHold()
    const reduced =
      gate.current?.closest('[data-reduced-motion="true"]') ||
      matchMedia('(prefers-reduced-motion: reduce)').matches
    transition.current = setTimeout(
      () => {
        actions.current.onCancel()
        actions.current.onAccount()
      },
      reduced ? 0 : 980
    )
  }
  return (
    <section
      ref={gate}
      className="access-gate"
      aria-label="ประตูเข้า TechCare"
      data-art-error={failed}
      data-phase={opening ? 'opening' : 'idle'}
    >
      <h1 className="gate-visually-hidden">ประตูเข้า TechCare</h1>
      {!failed && (
        <img
          className="access-gate-art"
          src="/assets/entry/access-gate.webp"
          alt="ทางเข้าหน่วย TechCare พร้อมเครื่องอ่านบัตรเจ้าหน้าที่"
          onError={() => setFailed(true)}
        />
      )}
      {!failed && (
        <>
          <GateLighting />
          <div className="access-door" aria-hidden="true">
            <div className="access-door-interior" />
            <div className="access-door-panel access-door-left" />
            <div className="access-door-panel access-door-right" />
            <div className="access-door-seam" />
          </div>
        </>
      )}
      <div className="access-gate-shade" aria-hidden="true" />
      <GateKin />
      <header className="access-gate-header">
        <span>
          T<span>+</span> / TECHCARE
        </span>
        <EntryClock />
      </header>
      <TerminalHold
        variant="reader"
        enabled={enabled && !opening}
        onOpen={openDoor}
        onStart={onHold}
        onCancel={onCancel}
      />
      <button
        type="button"
        className="access-reader-button"
        aria-label="เปิดช่องเข้าสู่ระบบ"
        aria-describedby="gate-reader-hint"
        disabled={opening || !enabled}
        onClick={openDoor}
      />
      <span id="gate-reader-hint" className="gate-visually-hidden">
        กด E ค้าง 1.2 วินาที หรือคลิกเพื่อเปิดประตูและเข้าสู่ระบบ
      </span>
      <div className="access-reader-label" aria-hidden="true">
        <span className="gate-glitch" data-text="IDENTITY READER">
          IDENTITY READER
        </span>
        <small className="gate-glitch" data-text="HOLD E / OPEN TERMINAL">
          HOLD E / OPEN TERMINAL
        </small>
      </div>
      <p className="access-door-status" role="status">
        {opening ? 'กำลังเปิดประตู…' : ''}
      </p>
      <footer className="access-gate-footer">
        <span>BLACKBOX / RECOVERY UNIT</span>
      </footer>
    </section>
  )
}
