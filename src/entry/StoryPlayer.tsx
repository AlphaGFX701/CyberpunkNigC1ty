import { useEffect, useRef, useState } from 'react'
import { PixelButton, PixelPanel } from '../ui/PixelUI'
import { CinematicArt } from './CinematicArt'
import { story } from './story'
import type { EntryAudio } from './audio'
import { DemoCorner, DemoLoader } from '../ui/VendorAssets'
import { caseNarrative } from '../narrative/case'

export function StoryPlayer({
  onFinish,
  audio,
  audioReady,
  active,
}: {
  onFinish: () => void
  audio: EntryAudio | null
  audioReady: Promise<void>
  active: boolean
}) {
  const [index, setIndex] = useState(0)
  const shot = story[index]
  const heading = useRef<HTMLHeadingElement>(null)
  const finishRef = useRef(onFinish)
  finishRef.current = onFinish
  useEffect(() => {
    heading.current?.focus()
  }, [index])
  useEffect(() => {
    const next = story[index + 1]
    if (next) {
      const image = new Image()
      image.src = next.art
    }
  }, [index])
  useEffect(() => {
    audio?.stopCues()
    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []
    if (active)
      void audioReady.then(() => {
        if (cancelled) return
        for (const cue of shot.cues)
          timers.push(
            setTimeout(() => {
              if (!cancelled) audio?.playCue(cue.cue)
            }, cue.atMs)
          )
      })
    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
      audio?.stopCues()
    }
  }, [audio, audioReady, active, shot])
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (
        !active ||
        event.isComposing ||
        event.repeat ||
        (event.target as HTMLElement)?.closest('button, input, textarea, a')
      )
        return
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        setIndex((v) => Math.max(0, v - 1))
      }
      if (event.key === 'ArrowRight' || event.key === 'Enter') {
        event.preventDefault()
        if (index === story.length - 1) finishRef.current()
        else setIndex((v) => v + 1)
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [active, index])
  return (
    <section
      className="story-screen"
      data-shot={index}
      data-connection={shot.connection}
      aria-label={`บทนำ ${caseNarrative.openingTitle}`}
    >
      <CinematicArt
        key={shot.id}
        art={shot.art}
        composition={shot.composition}
        description={shot.description}
      />
      <header className="story-top">
        <span>
          TECHCARE <i>/</i> INCIDENT 03:12
        </span>
        <PixelButton onClick={onFinish} className="skip-story">
          ข้ามบทนำ
        </PixelButton>
      </header>
      <div className="shot-caption">
        <span>{String(index + 1).padStart(2, '0')} / 05</span>
        <h2 ref={heading} tabIndex={-1}>
          {shot.title}
        </h2>
        <p>{shot.location}</p>
      </div>
      <PixelPanel variant="dialogue" className="story-dialogue dark-dialogue">
        <DemoCorner side="left" />
        <DemoCorner side="right" />
        <div className="dialogue-channel" key={`channel-${shot.id}`}>
          <DemoLoader />
          <span>
            {
              {
                local: 'บันทึกภาคสนาม',
                secure: 'ช่องทางเข้ารหัส',
                archive: 'แฟ้มย้อนหลัง',
                intercept: 'สัญญาณแทรก',
              }[shot.connection]
            }
          </span>
          <small>CASE 01 / BLACKBOX</small>
        </div>
        <div
          className="story-lines"
          key={shot.id}
          aria-live="polite"
          aria-atomic="true"
          tabIndex={0}
          role="region"
          aria-label="บทสนทนา เลื่อนเพื่ออ่านข้อความทั้งหมด"
        >
          {shot.lines.map((line, i) => (
            <p
              key={i}
              data-actor={line.actor}
              className={line.actor === 'intruder' ? 'null-line' : ''}
            >
              <strong>{line.label}</strong>
              <span>{line.text}</span>
            </p>
          ))}
        </div>
        <footer className="story-controls">
          <div className="story-dots" aria-label={`ฉาก ${index + 1} จาก 5`}>
            {story.map((s, i) => (
              <span key={s.id} className={i <= index ? 'seen' : ''} />
            ))}
          </div>
          <small>
            อ่านจบแล้ว กดถัดไป <span>↵</span>
          </small>
          <div>
            <PixelButton onClick={() => setIndex((v) => v - 1)} disabled={index === 0}>
              ย้อนกลับ
            </PixelButton>
            <PixelButton
              variant="primary"
              onClick={() => (index === story.length - 1 ? onFinish() : setIndex((v) => v + 1))}
            >
              {index === story.length - 1 ? 'เริ่มตามรอย' : 'ถัดไป'}
            </PixelButton>
          </div>
        </footer>
      </PixelPanel>
    </section>
  )
}
