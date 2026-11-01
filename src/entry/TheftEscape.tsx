import { useState } from 'react'

export function TheftEscape({
  running,
  onUnavailable,
}: {
  running: boolean
  onUnavailable?: () => void
}) {
  const [failed, setFailed] = useState(false)
  const fail = () => {
    setFailed(true)
    onUnavailable?.()
  }
  if (failed)
    return (
      <img
        className="scene-plate"
        src="/assets/blackbox/vault.webp"
        alt="ผู้บุกรุกนำ BLACKBOX ออกจากห้องนิรภัย"
      />
    )
  return (
    <div className="theft-escape" data-running={running}>
      <img
        className="scene-plate"
        src="/assets/story/escape/vault-open.webp"
        alt="ห้องนิรภัยอาราซาก้าและทางออกด้านขวา"
        onError={fail}
        draggable={false}
      />
      <div className="escape-door-leaf" aria-hidden="true">
        <img src="/assets/story/escape/vault-closed.webp" alt="" onError={fail} draggable={false} />
      </div>
      <div className="escape-actor" aria-hidden="true">
        <span className="escape-shadow" />
        <span className="escape-sprite" />
      </div>
      <img
        className="escape-foreground"
        src="/assets/story/escape/vault-open.webp"
        alt=""
        aria-hidden="true"
        draggable={false}
      />
      <img
        className="escape-preflight"
        src="/assets/story/escape/walk.webp"
        alt=""
        aria-hidden="true"
        onError={fail}
      />
      <span className="escape-status-light" aria-hidden="true" />
    </div>
  )
}
