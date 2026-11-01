import { useEffect, useRef, useState } from 'react'
import { PixelButton } from '../ui/PixelUI'
import { DialogueSurface } from '../ui/DialogueSurface'
import { CinematicArt } from './CinematicArt'
import { story } from './story'
import type { EntryAudio } from './audio'
import { caseNarrative } from '../narrative/case'

export function StoryPlayer({
  onFinish,
  audio,
  audioReady,
  active,
  reduceMotion = false,
  talkSound = true,
}: {
  onFinish: () => void
  audio: EntryAudio | null
  audioReady: Promise<void>
  active: boolean
  reduceMotion?: boolean
  talkSound?: boolean
}) {
  const [index, setIndex] = useState(0)
  const [lineIndex, setLineIndex] = useState(0)
  const [phase, setPhase] = useState<'reading' | 'escape'>('reading')
  const [escapeAvailable, setEscapeAvailable] = useState(true)
  const shot = story[index],
    line = shot.lines[lineIndex]
  const heading = useRef<HTMLHeadingElement>(null)
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const finished = useRef(false)
  const finishRef = useRef(onFinish)
  finishRef.current = onFinish
  const finish = () => {
    if (finished.current) return
    finished.current = true
    audio?.stopCues()
    finishRef.current()
  }
  const advanceShot = () => {
    setLineIndex(0)
    if (index === story.length - 1) finish()
    else setIndex(index + 1)
  }
  const next = () => {
    if (!active || finished.current || phaseRef.current === 'escape') return
    if (lineIndex < shot.lines.length - 1) setLineIndex(lineIndex + 1)
    else if (shot.id === 'theft' && escapeAvailable) {
      phaseRef.current = 'escape'
      setPhase('escape')
    } else advanceShot()
  }
  const back = () => {
    if (phaseRef.current === 'escape') {
      phaseRef.current = 'reading'
      setPhase('reading')
      return
    }
    if (lineIndex > 0) setLineIndex(lineIndex - 1)
    else if (index > 0) {
      setIndex(index - 1)
      setLineIndex(story[index - 1].lines.length - 1)
    }
  }
  useEffect(() => {
    heading.current?.focus()
  }, [index])
  useEffect(() => {
    const nextShot = story[index + 1]
    if (nextShot) {
      const image = new Image()
      image.src = nextShot.art
    }
  }, [index])
  // A line turn never restarts this shot's art or sound schedule.
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
    if (!active || !talkSound || phase !== 'reading' || line.actor !== 'kin') return
    return audio?.playTalkLine(line.text, 'kin')
  }, [active, talkSound, phase, line, audio])
  useEffect(() => {
    if (phase !== 'escape') return
    if (!active) {
      phaseRef.current = 'reading'
      setPhase('reading')
      return
    }
    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []
    audio?.stopCues()
    if (!reduceMotion)
      void audioReady.then(() => {
        if (cancelled) return
        audio?.playCue('door-open')
        timers.push(
          setTimeout(() => {
            if (!cancelled) audio?.playCue('footsteps')
          }, 900)
        )
      })
    timers.push(
      setTimeout(
        () => {
          if (cancelled || finished.current || phaseRef.current !== 'escape') return
          phaseRef.current = 'reading'
          setPhase('reading')
          setLineIndex(0)
          setIndex(1)
        },
        !escapeAvailable ? 0 : reduceMotion ? 180 : 2800
      )
    )
    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
      audio?.stopCues()
    }
  }, [phase, active, audio, audioReady, reduceMotion, escapeAvailable])
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (
        !active ||
        event.isComposing ||
        event.repeat ||
        (event.target as HTMLElement)?.closest('input, textarea, select, a')
      )
        return
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        back()
      }
      if (
        event.key === 'ArrowRight' ||
        (event.key === 'Enter' && !(event.target as HTMLElement)?.closest('button'))
      ) {
        event.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  })
  return (
    <section
      className="story-screen"
      data-shot={index}
      data-line={lineIndex}
      data-phase={phase}
      data-connection={shot.connection}
      aria-label={'บทนำ ' + caseNarrative.openingTitle}
    >
      <CinematicArt
        key={shot.id}
        art={shot.art}
        composition={shot.composition}
        description={shot.description}
        escaping={phase === 'escape'}
        onEscapeUnavailable={() => setEscapeAvailable(false)}
      />
      <header className="story-top">
        <span>
          TECHCARE <i>/</i> INCIDENT 03:12
        </span>
        <PixelButton onClick={finish} className="skip-story">
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
      <div className="story-dialogue-dock" inert={phase === 'escape'}>
        <DialogueSurface
          speaker={line.label}
          portrait={<StoryPortrait actor={line.actor} />}
          channel={
            {
              local: 'บันทึกภาคสนาม',
              secure: 'ช่องทางเข้ารหัส',
              archive: 'แฟ้มย้อนหลัง',
              intercept: 'สัญญาณแทรก',
            }[shot.connection]
          }
          reducedMotion={reduceMotion}
          className="story-dialogue dark-dialogue"
          actions={
            <>
              <div className="story-dots" aria-label={'ฉาก ' + (index + 1) + ' จาก 5'}>
                {story.map((s, i) => (
                  <span key={s.id} className={i <= index ? 'seen' : ''} />
                ))}
              </div>
              <small>
                {lineIndex + 1}/{shot.lines.length} · อ่านจบแล้ว กดถัดไป ↵
              </small>
              <PixelButton
                onClick={back}
                disabled={index === 0 && lineIndex === 0 && phase !== 'escape'}
              >
                ย้อนกลับ
              </PixelButton>
              <PixelButton variant="primary" onClick={next} disabled={phase === 'escape'}>
                {index === story.length - 1 && lineIndex === shot.lines.length - 1
                  ? 'เริ่มตามรอย'
                  : 'ถัดไป'}
              </PixelButton>
            </>
          }
        >
          <div
            className="story-lines"
            aria-live="polite"
            aria-atomic="true"
            tabIndex={0}
            role="region"
            aria-label="บทสนทนา"
          >
            <p data-actor={line.actor} className={line.actor === 'intruder' ? 'null-line' : ''}>
              <strong aria-hidden="true">{line.label}</strong>
              <span>{line.text}</span>
            </p>
          </div>
        </DialogueSurface>
      </div>
    </section>
  )
}

function StoryPortrait({ actor }: { actor: string }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [actor])
  const source =
    actor === 'kin'
      ? '/assets/tutorial/kin/serious-idle.png'
      : actor === 'arun'
        ? '/assets/chapter-one/characters/arun-serious.webp'
        : actor === 'intruder'
          ? '/assets/entry/null.webp'
          : null
  if (source && !failed) return <img src={source} alt="" onError={() => setFailed(true)} />
  return (
    <div className="story-system-portrait">
      <b>{actor === 'arasaka' ? 'ARA' : actor === 'partner' ? 'TC04' : 'SYS'}</b>
      <small>
        {actor === 'arasaka'
          ? 'SECURE CALL'
          : actor === 'partner'
            ? 'FIELD ARCHIVE'
            : 'LOCAL RECORD'}
      </small>
      <i />
    </div>
  )
}
