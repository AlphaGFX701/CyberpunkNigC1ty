import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from 'react'
import { account } from '../account/account'
import { PixelButton } from '../ui/PixelUI'
import { officerName } from './preferences'

type FormMode = 'guest' | 'login' | 'register' | 'forgot' | 'reset'

/** Auth presentation for the dedicated officer page, independent from the playfield. */
export function AccountPanel({
  onSaved,
  onGuest,
}: {
  onSaved: (name: string) => void
  onGuest: () => void
}) {
  const state = useSyncExternalStore(account.subscribe, account.get)
  const [mode, setMode] = useState<FormMode>('login')
  const [name, setName] = useState(state.name)
  const [email, setEmail] = useState(state.user?.email ?? '')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [otp, setOtp] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [working, setWorking] = useState(false)
  const alive = useRef(true)
  const panel = useRef<HTMLElement>(null)
  const focusStep = useRef(`${mode}:${state.status}`)
  const pending = working || state.busy
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])
  useEffect(() => {
    setName(state.name)
  }, [state.name, state.user?.id])
  useEffect(() => {
    const step = `${mode}:${state.status}`
    // The page owns initial heading focus; later form transitions focus their first field.
    if (focusStep.current === step) return
    focusStep.current = step
    const target =
      panel.current?.querySelector<HTMLElement>('input:not(:disabled)') ??
      panel.current?.querySelector<HTMLElement>('button:not(:disabled)')
    target?.focus()
  }, [mode, state.status])
  useEffect(() => {
    if (state.status === 'ready' || state.status === 'unverified') {
      setPassword('')
      setConfirm('')
    }
  }, [state.status])
  const changeMode = (next: FormMode) => {
    setMode(next)
    setPassword('')
    setConfirm('')
    setOtp('')
    setError('')
    setNotice('')
  }
  const run = async (action: () => Promise<unknown>, success?: () => void) => {
    if (pending) return
    setWorking(true)
    setError('')
    setNotice('')
    try {
      await action()
      if (alive.current) success?.()
    } catch (reason) {
      if (alive.current)
        setError(reason instanceof Error ? reason.message : 'เชื่อมต่อไม่ได้ ลองอีกครั้ง')
    } finally {
      if (alive.current) setWorking(false)
    }
  }
  const guest = () => {
    setError('')
    // Guest is an explicit cancellation path, including while cloud hydration is pending.
    const switching = account.useGuest()
    onGuest()
    void switching.catch((reason: unknown) => {
      if (alive.current)
        setError(reason instanceof Error ? reason.message : 'เปิดแฟ้มผู้เยี่ยมชมไม่ได้')
    })
  }
  const messages = (
    <>
      {error && (
        <p className="account-message account-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="account-message" role="status">
          {notice}
        </p>
      )}
      {state.message && (state.configured || state.status === 'error' || mode === 'guest') && (
        <p className="account-message" role="status">
          {state.message}
        </p>
      )}
    </>
  )
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (pending) return
    if (mode === 'guest' || state.status === 'ready') {
      const next = officerName(name)
      void run(
        () => account.saveName(next),
        () => onSaved(next)
      )
      return
    }
    if ((mode === 'register' || mode === 'reset') && password !== confirm) {
      setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน')
      return
    }
    if (mode === 'register') void run(() => account.signUp(name.trim(), email.trim(), password))
    else if (mode === 'login') void run(() => account.signIn(email.trim(), password))
    else if (mode === 'forgot')
      void run(
        () => account.sendPasswordReset(email.trim()),
        () => {
          changeMode('reset')
          setNotice('หากมีบัญชีนี้ ระบบจะส่งรหัสกู้รหัสผ่านให้ ตรวจกล่องจดหมายและสแปม')
        }
      )
    else
      void run(
        () => account.resetPassword(email.trim(), otp.trim(), password),
        () => {
          changeMode('login')
          setNotice('เปลี่ยนรหัสผ่านแล้ว เข้าสู่ระบบด้วยรหัสผ่านใหม่ได้เลย')
        }
      )
  }

  if (state.status === 'checking' || state.status === 'loading')
    return (
      <section ref={panel} className="account-panel account-wait" aria-busy="true">
        <span className="account-channel">TECHCARE / IDENTITY LINK</span>
        <h3>{state.status === 'checking' ? 'กำลังตรวจแฟ้มบัญชี' : 'กำลังโหลดเซฟของคุณ'}</h3>
        <p>รอให้ข้อมูลพร้อมก่อนเปิดภารกิจ เพื่อไม่ให้เซฟของคนอื่นปะปน</p>
        {messages}
        <PixelButton onClick={guest}>เล่นแบบผู้เยี่ยมชมแทน</PixelButton>
      </section>
    )

  if (state.status === 'unverified')
    return (
      <section ref={panel} className="account-panel">
        <div className="account-banner">
          <span className="account-channel">02 / VERIFY YOUR SIGNAL</span>
          <h3>ยืนยันว่าเป็นคุณ</h3>
          <p>
            กรอกรหัสที่ส่งไปยัง <strong>{state.user?.email}</strong>
          </p>
        </div>
        <form
          className="account-form"
          onSubmit={(e) => {
            e.preventDefault()
            void run(
              () => account.verifyOtp(otp.trim()),
              () => {
                if (account.get().status === 'guest') {
                  changeMode('login')
                  setNotice('ยืนยันอีเมลแล้ว เข้าสู่ระบบด้วยรหัสผ่านของคุณได้เลย')
                }
              }
            )
          }}
        >
          <label htmlFor="verify-otp">รหัสยืนยันอีเมล</label>
          <input
            id="verify-otp"
            data-autofocus
            inputMode="numeric"
            autoComplete="one-time-code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            disabled={pending}
          />
          <p className="form-note">ยังไม่เปิดเซฟคลาวด์จนกว่าจะยืนยันสำเร็จ</p>
          <PixelButton type="submit" variant="primary" disabled={pending}>
            {pending ? 'กำลังตรวจรหัส…' : 'ยืนยันอีเมล'}
          </PixelButton>
        </form>
        {messages}
        <div className="account-links">
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              void run(
                () => account.resendOtp(),
                () => setNotice('ส่งรหัสยืนยันใหม่แล้ว ตรวจกล่องจดหมายและสแปม')
              )
            }
          >
            ส่งรหัสใหม่
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => void run(() => account.refresh())}
          >
            ตรวจสถานะอีกครั้ง
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              void run(
                () => account.signOut(),
                () => changeMode('register')
              )
            }
          >
            เปลี่ยนอีเมล / กลับไปสมัคร
          </button>
        </div>
        <PixelButton onClick={guest}>เล่นแบบผู้เยี่ยมชม</PixelButton>
      </section>
    )

  if (state.status === 'import')
    return (
      <section ref={panel} className="account-panel">
        <div className="account-banner">
          <span className="account-channel">LOCAL FILE FOUND</span>
          <h3>พบคดีในเครื่องนี้</h3>
          <p>บัญชีนี้ยังไม่มีความคืบหน้า จะนำคดีของผู้เยี่ยมชมเข้าเซฟคลาวด์หรือเริ่มใหม่?</p>
        </div>
        {messages}
        <div className="account-actions">
          <PixelButton
            variant="primary"
            disabled={pending}
            onClick={() =>
              void run(
                () => account.resolveImport(true),
                () =>
                  setNotice(
                    account.get().sync === 'saved'
                      ? 'นำคดีเข้าบัญชีแล้ว'
                      : 'เตรียมนำคดีเข้าบัญชีแล้ว ยังรอซิงก์คลาวด์เมื่อเชื่อมต่อได้'
                  )
              )
            }
          >
            นำเซฟผู้เยี่ยมชมเข้าบัญชี
          </PixelButton>
          <PixelButton
            disabled={pending}
            onClick={() => void run(() => account.resolveImport(false))}
          >
            เริ่มคดีใหม่ในบัญชีนี้
          </PixelButton>
        </div>
        <p className="form-note">เซฟผู้เยี่ยมชมยังแยกเก็บไว้ในเครื่อง</p>
      </section>
    )

  if (state.status === 'error')
    return (
      <section ref={panel} className="account-panel">
        <div className="account-banner">
          <span className="account-channel">CONNECTION INTERRUPTED</span>
          <h3>ยังเปิดแฟ้มคลาวด์ไม่ได้</h3>
          <p>เกมยังไม่นำเซฟอื่นมาแทนของคุณ ลองเชื่อมต่อใหม่ หรือเลือกเล่นผู้เยี่ยมชมแยกต่างหาก</p>
        </div>
        {messages}
        <div className="account-actions">
          <PixelButton
            variant="primary"
            disabled={pending}
            onClick={() => void run(() => account.refresh())}
          >
            ลองเชื่อมต่อใหม่
          </PixelButton>
          <PixelButton onClick={guest}>เล่นแบบผู้เยี่ยมชม</PixelButton>
        </div>
      </section>
    )

  return (
    <section ref={panel} className="account-panel" aria-busy={pending}>
      <div className="account-banner">
        <span className="account-channel">
          {state.status === 'ready' ? 'VERIFIED / CLOUD FILE' : 'TECHCARE / OFFICER ACCESS'}
        </span>
        <h3>
          {state.status === 'ready'
            ? 'สัญญาณของคุณ พร้อมแล้ว'
            : mode === 'guest'
              ? 'แฟ้มของคุณ จุดเริ่มภารกิจ'
              : mode === 'register'
                ? 'ลงทะเบียนเจ้าหน้าที่'
                : mode === 'forgot' || mode === 'reset'
                  ? 'กู้การเข้าถึงบัญชี'
                  : 'กลับเข้าหน่วย TechCare'}
        </h3>
        <p>
          {state.status === 'ready'
            ? state.user?.email
            : 'คินลงพื้นที่ คุณดูแลเทอร์มินัล บัญชีช่วยให้กลับมาสานต่อคดีจากเครื่องอื่นได้'}
        </p>
      </div>
      {state.status !== 'ready' && (
        <nav className="account-tabs" aria-label="รูปแบบแฟ้มเจ้าหน้าที่">
          {(
            [
              ['guest', 'ผู้เยี่ยมชม'],
              ['login', 'เข้าสู่ระบบ'],
              ['register', 'สมัครบัญชี'],
            ] as const
          ).map(([key, label]) => (
            <button
              type="button"
              key={key}
              aria-current={mode === key ? 'page' : undefined}
              disabled={pending}
              onClick={() => changeMode(key)}
            >
              {label}
            </button>
          ))}
        </nav>
      )}
      {!state.configured && state.status !== 'ready' && (
        <p className="account-message account-unconfigured">
          ระบบบัญชีคลาวด์ยังไม่ได้เชื่อมต่อในเว็บนี้ คุณตั้งชื่อและเล่นแบบผู้เยี่ยมชมได้ตามปกติ
        </p>
      )}
      <form className="account-form" onSubmit={submit}>
        {(mode === 'guest' || mode === 'register' || state.status === 'ready') && (
          <>
            <label htmlFor="officer-name">ชื่อเจ้าหน้าที่</label>
            <input
              id="officer-name"
              data-autofocus
              maxLength={32}
              autoComplete="nickname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={pending}
            />
          </>
        )}
        {mode !== 'guest' && state.status !== 'ready' && (
          <>
            <label htmlFor="account-email">อีเมล</label>
            <input
              id="account-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={pending}
            />
          </>
        )}
        {mode === 'reset' && state.status !== 'ready' && (
          <>
            <label htmlFor="reset-otp">รหัสกู้รหัสผ่านจากอีเมล</label>
            <input
              id="reset-otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              disabled={pending}
            />
          </>
        )}
        {mode !== 'guest' && mode !== 'forgot' && state.status !== 'ready' && (
          <>
            <label htmlFor="account-password">
              {mode === 'reset' ? 'รหัสผ่านใหม่' : 'รหัสผ่าน'}
            </label>
            <div className="account-password">
              <input
                id="account-password"
                type={show ? 'text' : 'password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={pending}
              />
              <button
                type="button"
                aria-label={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                aria-pressed={show}
                onClick={() => setShow(!show)}
              >
                {show ? 'ซ่อน' : 'แสดง'}
              </button>
            </div>
            {(mode === 'register' || mode === 'reset') && (
              <>
                <label htmlFor="account-confirm">ยืนยันรหัสผ่าน</label>
                <input
                  id="account-confirm"
                  type={show ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  disabled={pending}
                />
              </>
            )}
          </>
        )}
        {mode === 'guest' && state.status !== 'ready' && (
          <p className="form-note">
            เก็บชื่อและคดีในเบราว์เซอร์นี้ ไม่มีรหัสผ่าน ส่วนตัวเอกในเรื่องยังชื่อคิน
          </p>
        )}
        {messages}
        <PixelButton
          type="submit"
          variant="primary"
          disabled={pending || (mode !== 'guest' && state.status !== 'ready' && !state.configured)}
        >
          {pending
            ? 'กำลังเชื่อมต่อ…'
            : state.status === 'ready' || mode === 'guest'
              ? 'บันทึกแฟ้ม'
              : mode === 'register'
                ? 'สมัครและรับรหัสยืนยัน'
                : mode === 'forgot'
                  ? 'ส่งรหัสกู้รหัสผ่าน'
                  : mode === 'reset'
                    ? 'ตั้งรหัสผ่านใหม่'
                    : 'เข้าสู่ระบบ'}
        </PixelButton>
      </form>
      {state.status === 'ready' ? (
        <>
          <p className="account-sync" data-sync={state.sync}>
            {state.sync === 'saved'
              ? '✓ เซฟคลาวด์เป็นปัจจุบัน'
              : state.sync === 'saving'
                ? 'กำลังบันทึกคลาวด์…'
                : 'รอซิงก์ความคืบหน้า'}
          </p>
          <div className="account-links">
            <button
              type="button"
              disabled={pending}
              onClick={() => void run(() => account.retrySync())}
            >
              ซิงก์อีกครั้ง
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                void run(
                  () => account.signOut(),
                  () => changeMode('guest')
                )
              }
            >
              ออกจากบัญชี
            </button>
          </div>
        </>
      ) : (
        <>
          {mode === 'login' && (
            <div className="account-links">
              <button type="button" disabled={pending} onClick={() => changeMode('forgot')}>
                ลืมรหัสผ่าน
              </button>
            </div>
          )}
          {mode === 'reset' && (
            <div className="account-links">
              <button
                type="button"
                disabled={pending || !state.configured}
                onClick={() =>
                  void run(
                    () => account.sendPasswordReset(email.trim()),
                    () => setNotice('หากมีบัญชีนี้ ระบบจะส่งรหัสใหม่ให้ ตรวจกล่องจดหมายและสแปม')
                  )
                }
              >
                ส่งรหัสกู้รหัสผ่านใหม่
              </button>
            </div>
          )}
          {mode !== 'guest' && (
            <button type="button" className="account-guest-link" onClick={guest}>
              ขอลองเล่นผู้เยี่ยมชมก่อน →
            </button>
          )}
        </>
      )}
    </section>
  )
}
