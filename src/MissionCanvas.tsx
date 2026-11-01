import { useEffect, useRef } from 'react'
import { store } from './model'

/** The Phaser adapter exists only while a 2D mission owns the playfield. */
export function MissionCanvas() {
  const host = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let game: import('phaser').Game | undefined
    let disposed = false
    store.set({ ready: false, error: '' })
    import('./World')
      .then(({ makeGame }) => {
        if (!disposed && host.current) game = makeGame(host.current)
      })
      .catch(() => {
        if (!disposed) store.set({ error: 'เปิดฉากไม่สำเร็จ ลองโหลดใหม่อีกครั้ง' })
      })
    return () => {
      disposed = true
      game?.destroy(true)
    }
  }, [])
  return (
    <div
      className="world"
      ref={host}
      role="application"
      aria-label="พื้นที่เดินสำรวจเกม ใช้ WASD หรือลูกศรเดิน และ E โต้ตอบ"
      tabIndex={0}
    />
  )
}
