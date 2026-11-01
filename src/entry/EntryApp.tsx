import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { account } from '../account/account'
import { AccountPanel } from './AccountPanel'
import { EntryClock } from './EntryClock'
import { AccessGate } from './AccessGate'
import { GameApp } from '../GameApp'
import { changeView, store, initialPositions, type View } from '../model'
import { cityProgress } from '../city/progression'
import { Modal } from '../ui/Modal'
import { PixelButton, PixelIcon } from '../ui/PixelUI'
import { EntryAudio, type EntryAudioStatus } from './audio'
import { CinematicArt } from './CinematicArt'
import { StoryPlayer } from './StoryPlayer'
import {
  loadPreferences,
  localPreferencesStorage,
  savePreferences,
  type Preferences,
} from './preferences'
import { MenuFeedback } from '../ui/MenuFeedback'
import { DemoStandby } from '../ui/VendorAssets'
import { caseNarrative, titleComposition } from '../narrative/case'
import { tutorial } from '../tutorial/model'
import { getTutorialPrompt } from '../tutorial/content'
import {
  TutorialProvider,
  TutorialCoach,
  TutorialSpotlight,
  useTutorialState,
} from '../tutorial/Tutorial'
import './entry.css'
import './blackbox.css'
import './account.css'
import './access.css'

type Screen = 'access' | 'title' | 'story' | 'game' | 'account'
type Dialog = 'settings' | 'pause' | 'exit' | 'newcase' | null
const scenes: { id: View; label: string }[] = [
  { id: 'map', label: 'แผนที่คดี' },
  { id: 'street', label: 'ร้านช่างอรุณ' },
  { id: 'device', label: 'ภายในกล้อง' },
  { id: 'boss', label: 'ห้องบอส' },
]

export function EntryApp() {
  const identity = useSyncExternalStore(account.subscribe, account.get)
  const progress = useSyncExternalStore(cityProgress.subscribe, cityProgress.get)
  const caseRepaired = progress.completed.includes('recover-cam07')
  const [prefs, setPrefs] = useState(() => loadPreferences(localPreferencesStorage()))
  const [accountInitialized, setAccountInitialized] = useState(false)
  const [screen, setScreen] = useState<Screen>('access')
  const [dialog, setDialog] = useState<Dialog>(null)
  const [started, setStarted] = useState(false)
  const [launching, setLaunching] = useState(false)
  const [notice, setNotice] = useState('')
  const [storageWarning, setStorageWarning] = useState(false)
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement))
  const [fullError, setFullError] = useState('')
  const [systemReduce, setSystemReduce] = useState(
    () => matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  const [audio, setAudio] = useState<EntryAudio | null>(null)
  const [audioReady, setAudioReady] = useState<Promise<void>>(() => Promise.resolve())
  const [audioStatus, setAudioStatus] = useState<EntryAudioStatus>({
    music: 'idle',
    sfxAvailable: false,
  })
  const [activated, setActivated] = useState(false)
  const settingsBack = useRef<Dialog>(null)
  const transition = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const effectGeneration = useRef(0)
  const titleHeading = useRef<HTMLHeadingElement>(null)
  const titleSurface = useRef<HTMLElement>(null)
  const accountHeading = useRef<HTMLHeadingElement>(null)
  const accountBack = useRef<'access' | 'title' | 'game'>('access')
  const previousScreen = useRef<Screen>('title')
  const holdCue = useRef<(() => void) | undefined>(undefined)
  const holdCueGeneration = useRef(0)
  const handledReset = useRef(identity.resetCounter)
  const manualReset = useRef(false)
  const reduce = prefs.reduceMotion || systemReduce
  const training = useTutorialState()
  const accountPlayable =
    accountInitialized && (identity.status === 'guest' || identity.status === 'ready')

  useEffect(() => {
    let mounted = true
    const done = () => {
      if (mounted) setAccountInitialized(true)
    }
    void account.initialize().then(done, done)
    return () => {
      mounted = false
    }
  }, [])
  useLayoutEffect(() => {
    store.set({ repaired: caseRepaired })
  }, [caseRepaired])
  useLayoutEffect(() => {
    if (identity.resetCounter === handledReset.current) return
    handledReset.current = identity.resetCounter
    clearTimeout(transition.current)
    setLaunching(false)
    store.set({
      view: 'map',
      overlay: null,
      paused: true,
      repaired: cityProgress.get().completed.includes('recover-cam07'),
      positions: structuredClone(initialPositions),
      destination: null,
      selectedStop: 0,
      ready: false,
      error: '',
      toast: '',
    })
    setStarted(false)
    if (!manualReset.current) {
      accountBack.current = 'title'
      setScreen((current) => (current === 'account' || current === 'access' ? current : 'title'))
    }
  }, [identity.resetCounter])

  useEffect(() => {
    const engine = new EntryAudio(setAudioStatus)
    setAudio(engine)
    return () => engine.dispose()
  }, [])
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setSystemReduce(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  useLayoutEffect(() => {
    store.set({
      paused: screen !== 'game' || dialog !== null || !accountPlayable,
      reduceMotion: reduce,
    })
  }, [screen, dialog, reduce, accountPlayable])
  useLayoutEffect(() => {
    effectGeneration.current++
    audio?.stopCues()
    return () => {
      effectGeneration.current++
      audio?.stopCues()
    }
  }, [dialog, screen, audio])
  useEffect(() => {
    audio?.setLevels(prefs.music / 100, prefs.sfx / 100)
    audio?.setMusicActive(
      activated && (screen !== 'title' || dialog === 'settings') && dialog !== 'exit'
    )
  }, [audio, prefs.music, prefs.sfx, activated, screen, dialog])
  useEffect(() => {
    const update = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', update)
    return () => document.removeEventListener('fullscreenchange', update)
  }, [])
  useEffect(() => {
    if (screen !== 'game') document.title = 'TechCare: รอยต่อสัญญาณ'
    if (screen === 'account') accountHeading.current?.focus()
    if (screen === 'title') {
      if (previousScreen.current === 'account')
        titleSurface.current?.querySelector<HTMLElement>('[data-account-trigger]')?.focus()
      else titleHeading.current?.focus()
    }
    previousScreen.current = screen
  }, [screen])
  useEffect(() => () => clearTimeout(transition.current), [])
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        e.key !== 'Escape' ||
        e.isComposing ||
        e.repeat ||
        screen !== 'game' ||
        dialog ||
        store.get().overlay
      )
        return
      e.preventDefault()
      store.set({ paused: true })
      setDialog('pause')
      tutorial.notify('menu-opened')
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [screen, dialog])

  const wakeAudio = () => {
    setActivated(true)
    if (!audio) return
    audio.setLevels(prefs.music / 100, prefs.sfx / 100)
    audio.setMusicActive(true)
    const ready = audio.unlock()
    setAudioReady(() => ready)
  }
  const persist = (patch: Partial<Preferences>) => {
    const next = { ...prefs, ...patch }
    setPrefs(next)
    const ok = savePreferences(localPreferencesStorage(), next)
    setStorageWarning(!ok)
    return ok
  }
  const openSettings = (back: Dialog = null) => {
    settingsBack.current = back
    store.set({ paused: true })
    setDialog('settings')
    if (back === 'pause') tutorial.notify('settings-opened')
    wakeAudio()
  }
  const closeDialog = () => {
    const back =
      dialog === 'settings' ? settingsBack.current : dialog === 'newcase' ? 'pause' : null
    setDialog(back)
    if (dialog === 'settings' && back === 'pause') tutorial.notify('settings-closed')
    if (dialog === 'pause') tutorial.notify('menu-closed')
    setFullError('')
  }
  const start = () => {
    if (launching || !accountPlayable) return
    wakeAudio()
    setNotice('')
    if (started) {
      setScreen('game')
      return
    }
    setLaunching(true)
    transition.current = setTimeout(
      () => {
        setLaunching(false)
        setScreen('story')
      },
      reduce ? 0 : 420
    )
  }
  const finishStory = () => {
    audio?.stopCues()
    if (!started) {
      changeView('map')
      store.set({ toast: caseNarrative.firstObjective })
      setStarted(true)
    }
    setScreen('game')
  }
  const exitToTitle = () => {
    store.set({ paused: true })
    audio?.stopCues()
    audio?.setMusicActive(false)
    setDialog(null)
    setScreen('title')
    setNotice('พักภารกิจแล้ว กลับเข้าเล่นต่อได้ในแท็บนี้')
  }
  const toggleFullscreen = async () => {
    setFullError('')
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else if (document.documentElement.requestFullscreen)
        await document.documentElement.requestFullscreen()
      else throw new Error('unsupported')
      setFullscreen(Boolean(document.fullscreenElement))
    } catch {
      setFullError('เปิดเต็มจอไม่ได้ในเบราว์เซอร์นี้ ยังเล่นแบบเต็มหน้าต่างได้ตามปกติ')
    }
  }
  const newCase = async () => {
    if (identity.busy) return
    manualReset.current = true
    const ok = await account.resetCase()
    handledReset.current = account.get().resetCounter
    manualReset.current = false
    if (!ok) return
    store.set({
      view: 'map',
      overlay: null,
      repaired: false,
      positions: structuredClone(initialPositions),
      destination: null,
      selectedStop: 0,
      ready: false,
      error: '',
      toast: '',
    })
    audio?.stopCues()
    wakeAudio()
    setDialog(null)
    setStarted(false)
    setScreen('story')
  }
  const testEffect = () => {
    const generation = effectGeneration.current
    wakeAudio()
    void audio?.unlock().then(() => {
      if (generation !== effectGeneration.current) return
      audio.stopCues()
      audio.playCue('confirm')
    })
  }
  const cancelHoldSound = () => {
    holdCueGeneration.current++
    holdCue.current?.()
    holdCue.current = undefined
  }
  const beginHoldSound = () => {
    cancelHoldSound()
    const generation = holdCueGeneration.current
    wakeAudio()
    void audio?.unlock().then(() => {
      if (generation === holdCueGeneration.current) holdCue.current = audio.playCue('connect')
    })
  }
  const openProfile = () => {
    cancelHoldSound()
    wakeAudio()
    accountBack.current =
      screen === 'access' ? 'access' : screen === 'game' && started ? 'game' : 'title'
    setDialog(null)
    setScreen('account')
  }
  const backFromAccount = () => {
    if (account.get().busy) return
    if (!accountPlayable) {
      void account.useGuest()
      setAccountInitialized(true)
      accountBack.current = 'title'
    }
    setScreen(
      accountBack.current === 'game' && started
        ? 'game'
        : accountBack.current === 'access'
          ? 'access'
          : 'title'
    )
  }
  useEffect(() => {
    if (screen !== 'account') return
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.isComposing || account.get().busy) return
      event.preventDefault()
      backFromAccount()
    }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [screen, accountPlayable, started])

  return (
    <TutorialProvider
      active={screen === 'game' && accountPlayable}
      audio={audio}
      talkSound={prefs.talkSound}
      reducedMotion={reduce}
      dialog={dialog}
    >
      <div className="entry-shell" data-screen={screen} data-reduced-motion={reduce}>
        <TutorialSpotlight active={screen === 'game'} />
        {screen === 'access' && (
          <AccessGate
            enabled
            onAccount={openProfile}
            onHold={beginHoldSound}
            onCancel={cancelHoldSound}
            onDoorOpen={() => {
              const generation = effectGeneration.current
              wakeAudio()
              void audio?.unlock().then(() => {
                if (generation === effectGeneration.current) audio.playCue('relay')
              })
            }}
          />
        )}
        {screen === 'title' && (
          <section
            className="title-screen"
            ref={titleSurface}
            data-launching={launching}
            aria-label="หน้าเข้าเกม TechCare"
          >
            <CinematicArt
              art="/assets/entry/lab.webp"
              composition={titleComposition}
              title
              description="คินตรวจเทอร์มินัลในห้องแล็บยามฝนตก ไฟส่องโต๊ะสีอำพัน"
            />
            <div className="title-rail">
              <span>
                <i /> TECHCARE RECOVERY UNIT
              </span>
              <span>
                <EntryClock />
              </span>
            </div>
            <div className="title-content">
              <span className="title-kicker">
                แฟ้มคดี 01 <i /> BLACKBOX
              </span>
              <h1 ref={titleHeading} tabIndex={-1}>
                TECHCARE<span>รอยต่อสัญญาณ</span>
              </h1>
              <p className="title-logline">
                {caseNarrative.menu.tagline[0]}
                <br />
                {caseNarrative.menu.tagline[1]}
              </p>
              <nav className="title-menu" aria-label="เมนูหลัก">
                <PixelButton
                  variant="primary"
                  className="play-action"
                  feedback="menu"
                  disabled={launching || !accountPlayable}
                  onClick={start}
                  aria-label={started ? 'กลับสู่ภารกิจ' : 'เริ่มภารกิจ'}
                >
                  <span className="menu-number">01</span>
                  <span>
                    <strong>
                      {launching ? 'กำลังเชื่อมต่อ…' : started ? 'กลับสู่ภารกิจ' : 'เริ่มภารกิจ'}
                    </strong>
                    <small>{started ? 'RESUME' : 'PLAY'}</small>
                  </span>
                  <span className="menu-arrow">→</span>
                </PixelButton>
                <PixelButton
                  className="title-menu-item"
                  feedback="menu"
                  onClick={openProfile}
                  data-account-trigger
                  disabled={launching}
                  aria-label="แฟ้มเจ้าหน้าที่"
                >
                  <span className="menu-number">02</span>
                  <span>
                    แฟ้มเจ้าหน้าที่
                    <small>
                      {identity.status === 'ready' ? 'ACCOUNT / CLOUD SAVE' : 'LOGIN / GUEST FILE'}
                    </small>
                  </span>
                  <PixelIcon name="icon-journal" />
                </PixelButton>
                <PixelButton
                  className="title-menu-item"
                  feedback="menu"
                  onClick={() => openSettings()}
                  disabled={launching}
                  aria-label="ตั้งค่า"
                >
                  <span className="menu-number">03</span>
                  <span>
                    ตั้งค่า<small>SETTINGS</small>
                  </span>
                  <PixelIcon name="icon-settings" />
                </PixelButton>
                <PixelButton
                  className="title-menu-item"
                  feedback="menu"
                  onClick={() => {
                    audio?.stopCues()
                    audio?.setMusicActive(false)
                    setDialog('exit')
                  }}
                  disabled={launching}
                  aria-label="ออกจากเกม"
                >
                  <span className="menu-number">04</span>
                  <span>
                    ออกจากเกม<small>EXIT</small>
                  </span>
                  <PixelIcon name="icon-back" />
                </PixelButton>
              </nav>
              {started && (
                <button
                  aria-label="ดูบทนำอีกครั้ง"
                  className="replay-link"
                  onClick={() => {
                    wakeAudio()
                    setScreen('story')
                  }}
                >
                  ดูบทนำอีกครั้ง <span>↗</span>
                </button>
              )}
              <p className="officer-name">
                <span className="live-dot" /> เจ้าหน้าที่ {identity.name}
                <small className="identity-status">
                  {identity.status === 'ready'
                    ? identity.sync === 'saved'
                      ? 'คลาวด์พร้อมแล้ว'
                      : identity.sync === 'saving'
                        ? 'กำลังซิงก์…'
                        : 'รอซิงก์'
                    : identity.status === 'guest'
                      ? 'ผู้เยี่ยมชม · เซฟในเครื่อง'
                      : 'ตรวจการเชื่อมต่อในแฟ้มเจ้าหน้าที่'}
                </small>
              </p>
            </div>
            <aside className="title-evidence" aria-hidden="true">
              <DemoStandby />
              <strong>{caseNarrative.artifact.name}</strong>
              <small>{caseNarrative.menu.status}</small>
              <div className="blackbox-wave">
                {Array.from({ length: 19 }, (_, i) => (
                  <i
                    key={i}
                    style={{
                      height: `${8 + ((i * 7) % 23)}px`,
                      animationDelay: `${-i * 0.13}s`,
                      animationDuration: `${0.85 + (i % 5) * 0.17}s`,
                    }}
                  />
                ))}
              </div>
            </aside>
            <footer className="title-footer">
              <span>
                HTML FIELD OPERATIONS <i>/</i> 21909-1006
              </span>
              <span>{caseNarrative.openingTitle}</span>
              <button
                onClick={toggleFullscreen}
                aria-label={fullscreen ? 'ออกจากโหมดเต็มจอ' : 'เปิดโหมดเต็มจอ'}
              >
                {fullscreen ? 'ย่อหน้าจอ' : 'เต็มจอ'} <span>⛶</span>
              </button>
            </footer>
            <div className="launch-shutter" aria-hidden="true" />
            <MenuFeedback
              surfaceRef={titleSurface}
              reduced={reduce}
              enabled={!dialog && !launching}
            />
          </section>
        )}
        {screen === 'account' && (
          <section className="account-screen" aria-label="แฟ้มเจ้าหน้าที่">
            <header className="account-page-header">
              <a
                href="#"
                onClick={(event) => {
                  event.preventDefault()
                  backFromAccount()
                }}
                aria-label="TechCare กลับหน้าเมนู"
              >
                T<span>+</span> / TECHCARE
              </a>
              <span className="account-page-time">
                <EntryClock />
              </span>
              <PixelButton disabled={identity.busy} onClick={backFromAccount} icon="icon-back">
                {!accountPlayable
                  ? 'กลับแบบผู้เยี่ยมชม'
                  : accountBack.current === 'game' && started
                    ? 'กลับสู่ภารกิจ'
                    : accountBack.current === 'access'
                      ? 'กลับประตูเข้า'
                      : 'กลับหน้าเมนู'}
              </PixelButton>
            </header>
            <div className="account-page-layout">
              <aside className="account-page-scene" aria-label="สถานีเชื่อมต่อเจ้าหน้าที่">
                <CinematicArt
                  art="/assets/entry/lab.webp"
                  composition={titleComposition}
                  title
                  description="คินรอสัญญาณจากเจ้าหน้าที่ที่เทอร์มินัลในห้องแล็บ"
                />
                <div className="account-scene-copy">
                  <span className="account-channel">TECHCARE / SECURE TERMINAL</span>
                  <h2>
                    ต่อสัญญาณ
                    <br />
                    แล้วไปต่อด้วยกัน
                  </h2>
                  <p>
                    คินอยู่หน้างานแล้ว
                    <br />
                    เหลือที่ว่างหน้าเทอร์มินัลให้คุณ
                  </p>
                  <div className="account-scene-id">
                    <i /> OFFICER ACCESS / BLACKBOX
                  </div>
                </div>
              </aside>
              <main className="account-page-main">
                <div className="account-page-heading">
                  <span className="account-channel">IDENTITY / 01</span>
                  <h1 ref={accountHeading} tabIndex={-1}>
                    แฟ้มเจ้าหน้าที่
                  </h1>
                  <p>บัญชีของคุณ แยกจากคดีของคิน</p>
                </div>
                <AccountPanel
                  onSaved={(name) => {
                    const ok = identity.status === 'guest' ? persist({ name }) : true
                    setNotice(
                      ok
                        ? `บันทึกแฟ้มเจ้าหน้าที่ ${name} แล้ว`
                        : 'ใช้ชื่อได้ในรอบนี้ แต่เบราว์เซอร์ไม่อนุญาตให้บันทึกถาวร'
                    )
                    if (identity.status === 'guest') {
                      accountBack.current = 'title'
                      setScreen('title')
                    }
                  }}
                  onGuest={() => {
                    setAccountInitialized(true)
                    accountBack.current = 'title'
                    setScreen('title')
                  }}
                />
                {identity.status === 'ready' && (
                  <PixelButton
                    variant="primary"
                    className="account-page-continue"
                    onClick={() => {
                      setScreen('title')
                      setNotice('แฟ้มพร้อมแล้ว เริ่มภารกิจได้เลย')
                    }}
                  >
                    เข้าสู่เมนูภารกิจ →
                  </PixelButton>
                )}
                {notice && (
                  <p className="account-page-notice" role="status">
                    {notice}
                  </p>
                )}
                <footer className="account-page-footer">
                  <span>หนึ่งบัญชี · เล่นต่อข้ามเครื่อง</span>
                  <span>ชื่อเจ้าหน้าที่ไม่เปลี่ยนตัวเอกในเรื่อง</span>
                </footer>
              </main>
            </div>
          </section>
        )}
        {screen === 'story' && (
          <StoryPlayer
            audio={audio}
            audioReady={audioReady}
            active={!dialog}
            onFinish={finishStory}
          />
        )}
        {started && (
          <div className="game-layer" hidden={screen !== 'game'}>
            <GameApp
              active={screen === 'game' && accountPlayable}
              onMenu={() => {
                store.set({ paused: true })
                setDialog('pause')
                tutorial.notify('menu-opened')
              }}
            />
          </div>
        )}
        {screen === 'game' && identity.status !== 'guest' && (
          <button
            type="button"
            className="account-live-status"
            data-status={identity.status}
            data-sync={identity.sync}
            aria-label="เปิดแฟ้มบัญชีและสถานะเซฟ"
            onClick={openProfile}
          >
            <span aria-hidden="true">⇅</span>{' '}
            {identity.status === 'error'
              ? 'ตรวจบัญชีเพื่อเล่นต่อ'
              : identity.status !== 'ready'
                ? 'กำลังตรวจบัญชี…'
                : identity.sync === 'saved'
                  ? 'เซฟคลาวด์พร้อม'
                  : identity.sync === 'saving'
                    ? 'กำลังซิงก์…'
                    : 'รอซิงก์ · ตรวจแฟ้ม'}
          </button>
        )}
        {notice && screen === 'title' && (
          <p className="entry-notice" role="status">
            {notice}
            {storageWarning && ' · ยังเก็บข้อมูลถาวรในเครื่องไม่ได้'}
          </p>
        )}
        {fullError && !dialog && (
          <p className="entry-notice" role="status">
            {fullError}
          </p>
        )}
        {dialog && (
          <Modal
            key={dialog}
            title={
              dialog === 'settings'
                ? 'ตั้งค่า'
                : dialog === 'pause'
                  ? 'เมนูภารกิจ'
                  : dialog === 'newcase'
                    ? 'เริ่มคดีใหม่'
                    : 'ออกจากเกม'
            }
            onClose={closeDialog}
          >
            {dialog === 'settings' && (
              <div className="entry-settings">
                <TutorialCoach context="settings" inline />
                <p className="settings-intro">เสียงและภาพตามจังหวะของคุณ</p>
                {(
                  [
                    { key: 'music', label: 'ระดับเสียงเพลง', icon: 'icon-music-on' },
                    { key: 'sfx', label: 'ระดับเอฟเฟกต์', icon: 'icon-sfx-on' },
                  ] as const
                ).map((item) => (
                  <div className="volume-setting" key={item.key}>
                    <label htmlFor={`volume-${item.key}`}>
                      <PixelIcon name={item.icon} />
                      {item.label}
                      <output htmlFor={`volume-${item.key}`}>{prefs[item.key]}%</output>
                    </label>
                    <input
                      aria-label={item.label}
                      id={`volume-${item.key}`}
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={prefs[item.key]}
                      onChange={(e) => {
                        wakeAudio()
                        persist({ [item.key]: Number(e.target.value) })
                      }}
                    />
                    <small>
                      {prefs[item.key] === 0
                        ? 'ปิดเสียง'
                        : item.key === 'sfx'
                          ? 'ฝน อุปกรณ์ และสัญญาณเชื่อมต่อ'
                          : 'เพลงบรรยากาศระหว่างเล่น'}
                    </small>
                  </div>
                ))}
                <PixelButton className="test-sound" onClick={testEffect}>
                  ทดสอบเสียงเอฟเฟกต์
                </PixelButton>
                {(audioStatus.music === 'blocked' || audioStatus.music === 'error') && (
                  <p className="settings-warning" role="status">
                    {audioStatus.music === 'blocked'
                      ? 'เบราว์เซอร์ยังไม่อนุญาตเสียง กดลองเปิดเสียงอีกครั้ง'
                      : 'โหลดเพลงไม่ได้ ตรวจการเชื่อมต่อแล้วลองใหม่ เกมยังเล่นต่อได้'}{' '}
                    <button onClick={wakeAudio}>ลองเปิดเสียงอีกครั้ง</button>
                  </p>
                )}
                <label className="motion-setting">
                  <input
                    aria-label="เสียงข้อความคิน"
                    type="checkbox"
                    checked={prefs.talkSound}
                    onChange={(event) => persist({ talkSound: event.target.checked })}
                  />
                  <span>
                    เสียงข้อความคิน<small>เสียงตืดขณะคินพูด ใช้ระดับเสียงเอฟเฟกต์เดียวกัน</small>
                  </span>
                </label>
                <label className="motion-setting">
                  <input
                    aria-label="ลดการเคลื่อนไหว"
                    type="checkbox"
                    checked={reduce}
                    disabled={systemReduce}
                    onChange={(e) => persist({ reduceMotion: e.target.checked })}
                  />
                  <span>
                    ลดการเคลื่อนไหว
                    <small>
                      {systemReduce ? 'เปิดตามการตั้งค่าระบบของคุณ' : 'ลดฝน ภาพรบกวน และการขยับฉาก'}
                    </small>
                  </span>
                </label>
                <div className="fullscreen-setting">
                  <div>
                    <strong>พื้นที่แสดงผล</strong>
                    <small>เกมขยายเต็มหน้าต่างอยู่แล้ว</small>
                  </div>
                  <PixelButton onClick={toggleFullscreen}>
                    {fullscreen ? 'ออกจากเต็มจอ' : 'เต็มจอ'} <span>⛶</span>
                  </PixelButton>
                </div>
                {fullError && (
                  <p className="settings-warning" role="status">
                    {fullError}
                  </p>
                )}
                {storageWarning && (
                  <p className="settings-warning" role="status">
                    ใช้การตั้งค่านี้ได้ในรอบนี้ แต่บันทึกถาวรไม่ได้
                  </p>
                )}
                <p className="form-note">การตั้งค่าบันทึกอัตโนมัติในเบราว์เซอร์นี้</p>
              </div>
            )}
            {dialog === 'pause' && (
              <div className="pause-content">
                <span className="eyebrow">FIELD SESSION / PAUSED</span>
                <h3>พักสัญญาณไว้ตรงนี้</h3>
                <p>คินหยุดรอจนกว่าคุณจะกลับมา</p>
                <div className="pause-actions">
                  <PixelButton
                    variant="primary"
                    data-tutorial-target="resume-game"
                    onClick={closeDialog}
                  >
                    กลับสู่เกม
                  </PixelButton>
                  <PixelButton
                    icon="icon-settings"
                    data-tutorial-target="settings"
                    onClick={() => openSettings('pause')}
                  >
                    ตั้งค่า
                  </PixelButton>
                  <PixelButton onClick={exitToTitle}>ออกสู่หน้าเมนู</PixelButton>
                  <PixelButton onClick={() => setDialog('newcase')}>เริ่มคดีใหม่</PixelButton>
                  <PixelButton
                    onClick={() => {
                      tutorial.skip()
                      changeView('map')
                      tutorial.replay()
                      setDialog(null)
                    }}
                  >
                    ฝึกเล่นกับคินอีกครั้ง
                  </PixelButton>
                </div>
                <TutorialCoach context="pause" inline />
                {training.step && getTutorialPrompt(training.step).context !== 'pause' && (
                  <div className="tutorial-paused-note">
                    <p>คินพักการฝึกไว้ กลับสู่เกมเพื่อฝึกต่อได้</p>
                    <button className="tutorial-pause-skip" onClick={() => tutorial.skip()}>
                      ข้ามการฝึก
                    </button>
                  </div>
                )}
                <details className="prototype-drawer">
                  <summary>ฉากและข้อมูลต้นแบบ</summary>
                  <nav aria-label="เลือกฉากตัวอย่าง">
                    {scenes.map((s) => (
                      <PixelButton
                        key={s.id}
                        disabled={Boolean(training.step)}
                        onClick={() => {
                          changeView(s.id)
                          setDialog(null)
                        }}
                      >
                        {s.label}
                      </PixelButton>
                    ))}
                  </nav>
                  <p>ต้นแบบฉาก 4 พื้นที่ จุดซ่อมและห้องบอสยังเป็นโจทย์สาธิต</p>
                  <a href="?ui=1">ดูชุด Pixel UI ทั้ง 55 ชิ้น ↗</a>
                  <p className="asset-credit-link">
                    <a href="/assets/vendor/credits.txt" target="_blank" rel="noreferrer">
                      เครดิตภาพ UI: Finnmercury · NULLSIGNAL / Nkyo-P ↗
                    </a>
                  </p>
                  <small>
                    จำเควสต์และพื้นที่ไว้ในเครื่อง
                    ตำแหน่งเดินและโค้ดที่ยังไม่ส่งจะเริ่มใหม่เมื่อรีโหลด
                  </small>
                </details>
              </div>
            )}
            {dialog === 'newcase' && (
              <div className="pause-content">
                <span className="eyebrow">RESET CASE / BLACKBOX</span>
                <h3>เริ่มตามรอยใหม่ตั้งแต่ต้น?</h3>
                <p>
                  ล้างเฉพาะความคืบหน้าเควสต์และพื้นที่ของคดี BLACKBOX
                  ชื่อเจ้าหน้าที่และการตั้งค่าเสียงยังอยู่เหมือนเดิม
                </p>
                {identity.status === 'ready' && (
                  <p className="form-note">
                    รีเซ็ตเซฟของบัญชีนี้ทั้งคลาวด์และเครื่อง ต้องเชื่อมต่ออินเทอร์เน็ตก่อนยืนยัน
                  </p>
                )}
                <div className="pause-actions">
                  <PixelButton onClick={() => setDialog('pause')}>กลับไปเมนูภารกิจ</PixelButton>
                  <PixelButton variant="primary" onClick={newCase} disabled={identity.busy}>
                    {identity.busy ? 'กำลังเริ่มคดีใหม่…' : 'ยืนยันเริ่มคดีใหม่'}
                  </PixelButton>
                </div>
                {identity.message && (
                  <p className="account-message" role="status">
                    {identity.message}
                  </p>
                )}
              </div>
            )}
            {dialog === 'exit' && (
              <div className="pause-content">
                <span className="eyebrow">CONNECTION ON STANDBY</span>
                <h3>พักการเชื่อมต่อแล้ว</h3>
                <p>
                  ปิดแท็บนี้เพื่อออกจากเกมได้เลย ชื่อ การตั้งค่า
                  เควสต์และพื้นที่ที่ปลดล็อกยังอยู่ในเครื่อง
                  โค้ดที่ยังไม่ส่งและตำแหน่งเดินจะเริ่มใหม่เมื่อเปิดเว็บอีกครั้ง
                </p>
                {identity.status === 'ready' && (
                  <p className="form-note">
                    {identity.sync === 'saved'
                      ? 'เซฟคลาวด์เป็นปัจจุบันแล้ว เข้าบัญชีเดิมบนเครื่องอื่นเพื่อเล่นต่อได้'
                      : 'ยังมีข้อมูลรอซิงก์ กลับไปที่แฟ้มเจ้าหน้าที่เพื่อตรวจการเชื่อมต่อก่อนเล่นข้ามเครื่อง'}
                  </p>
                )}
                <PixelButton variant="primary" onClick={() => setDialog(null)}>
                  กลับหน้าเมนู
                </PixelButton>
              </div>
            )}
          </Modal>
        )}
      </div>
    </TutorialProvider>
  )
}
