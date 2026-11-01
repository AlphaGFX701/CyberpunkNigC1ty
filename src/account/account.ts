import { cityProgress, type CityProgress, type StorageLike } from '../city/progression.ts'
import { tutorial, type Tutorial } from '../tutorial/model.ts'
import {
  createNeonAdapter,
  EmailVerificationRequired,
  type AuthAdapter,
  type AuthUser,
} from './auth.ts'
import {
  cleanCase,
  emptyCase,
  mergeProgress,
  validPlayer,
  type CaseData,
  type PlayerRecord,
} from './contracts.ts'

export type AccountSnapshot = Readonly<{
  status: 'checking' | 'guest' | 'unverified' | 'loading' | 'import' | 'ready' | 'error'
  user: AuthUser | null
  name: string
  sync: 'local' | 'saved' | 'saving' | 'pending' | 'error'
  configured: boolean
  message: string
  busy: boolean
  resetCounter: number
}>
export class PlayerApiError extends Error {
  status: number
  data: { code?: string; player?: PlayerRecord }
  constructor(status: number, data: { code?: string; player?: PlayerRecord }) {
    super(
      status === 503
        ? 'ระบบบัญชียังไม่ได้เชื่อมต่อ Neon เล่นแบบผู้เยี่ยมชมได้'
        : status === 401
          ? 'บัญชีหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง'
          : 'เชื่อมต่อเซฟไม่ได้ ลองใหม่อีกครั้ง'
    )
    this.status = status
    this.data = data
  }
}
export type AccountApi = (
  path: string,
  method?: string,
  body?: unknown,
  expectedOwner?: string
) => Promise<unknown>
export const playerApi: AccountApi = async (path, method = 'GET', body, expectedOwner) => {
  const response = await fetch(path, {
    method,
    credentials: 'same-origin',
    cache: 'no-store',
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(expectedOwner ? { 'X-Techcare-Account': expectedOwner } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new PlayerApiError(response.status, data)
  return data
}
const cacheKey = (owner: string) => `techcare.player.v1:${encodeURIComponent(owner)}`
const caseKey = (owner: string) => `techcare.case.v1:${encodeURIComponent(owner)}`
const guideKey = (owner: string, generation: number) =>
  `techcare.tutorial.v1:${encodeURIComponent(owner)}:${generation}`
const guestModeKey = 'techcare.auth.guest.v1'
const guestRecord = (name = 'เจ้าหน้าที่'): PlayerRecord => ({
  name,
  case: emptyCase(),
  revision: 0,
  generation: 0,
  isNew: false,
})
const equalCase = (a: CaseData, b: CaseData) =>
  JSON.stringify(cleanCase(a)) === JSON.stringify(cleanCase(b))
const readStorage = (storage: StorageLike | null, key: string) => {
  try {
    return storage?.getItem(key) ?? null
  } catch {
    return null
  }
}
const writeStorage = (storage: StorageLike | null, key: string, value: unknown) => {
  try {
    if (!storage) return false
    storage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}
const browserStorage = (): StorageLike | null => {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

/** Owns account transitions and durable pending saves. World rules stay in cityProgress. */
export function createAccount(options: {
  auth: AuthAdapter
  api: AccountApi
  storage: StorageLike | null
  progress: CityProgress
  guide: Tutorial
}) {
  const { auth, api, storage, progress, guide } = options
  const listeners = new Set<() => void>()
  let current: AccountSnapshot = Object.freeze({
    status: 'guest',
    user: null,
    name: 'เจ้าหน้าที่',
    sync: 'local',
    configured: false,
    message: '',
    busy: false,
    resetCounter: 0,
  })
  let owner = 'guest',
    sessionEpoch = 0,
    operation = 0,
    change = 0,
    hydrating = false
  let record: PlayerRecord = guestRecord(),
    pending = false,
    queued: Promise<void> | null = null
  let initialization: Promise<void> | null = null,
    email = '',
    guestBackup: PlayerRecord | null = null
  const publish = (patch: Partial<AccountSnapshot>) => {
    current = Object.freeze({ ...current, ...patch })
    for (const f of [...listeners]) f()
  }
  const readCache = (id: string): { player: PlayerRecord; pending: boolean } | null => {
    try {
      const v = JSON.parse(readStorage(storage, cacheKey(id)) ?? 'null')
      return v?.version === 1 && validPlayer(v.player)
        ? { player: v.player, pending: v.pending === true }
        : null
    } catch {
      return null
    }
  }
  const cache = () => {
    const ok = writeStorage(storage, cacheKey(owner), { version: 1, player: record, pending })
    if (!ok)
      publish({ message: 'เบราว์เซอร์บันทึกข้อมูลในเครื่องไม่ได้ อย่าปิดหน้านี้ก่อนซิงก์สำเร็จ' })
  }
  const caseNow = (): CaseData =>
    cleanCase({ ...progress.get(), completed: [...progress.get().completed] })
  const hydrate = (next: PlayerRecord, ownerChange = false) => {
    const reset = ownerChange || next.generation !== record.generation
    record = { ...next, case: cleanCase(next.case) }
    hydrating = true
    progress.activateOwner(caseKey(owner), record.case)
    progress.hydrate(record.case)
    if (reset) guide.activateOwner(guideKey(owner, next.generation))
    hydrating = false
    publish({ name: record.name, ...(reset ? { resetCounter: current.resetCounter + 1 } : {}) })
  }
  const adoptGuest = () => {
    sessionEpoch++
    operation++
    owner = 'guest'
    pending = false
    queued = null
    const saved = readCache(owner)?.player ?? guestRecord(current.name)
    hydrate(saved, true)
    publish({ status: 'guest', user: null, name: saved.name, sync: 'local', busy: false })
  }
  const migrate = () => {
    if (readCache('guest')) return
    let name = 'เจ้าหน้าที่'
    try {
      const p = JSON.parse(readStorage(storage, 'techcare.entry.v1') ?? 'null')
      if (typeof p?.name === 'string') name = p.name.trim().slice(0, 32) || name
    } catch {
      /* empty guest */
    }
    // cityProgress has already validated the legacy snapshot. Preserve the legacy backup.
    const p = { ...guestRecord(name), case: caseNow() }
    writeStorage(storage, cacheKey('guest'), { version: 1, player: p, pending: false })
    const guideText = readStorage(storage, 'techcare.tutorial.v1')
    try {
      if (guideText) {
        const raw = JSON.parse(guideText)
        if (raw?.version === 1 && ['unseen', 'active', 'completed', 'skipped'].includes(raw.status))
          writeStorage(storage, guideKey('guest', 0), raw)
      }
    } catch {
      /* keep backup */
    }
  }
  migrate()
  adoptGuest()

  const flush = (): Promise<void> => {
    if (queued) return queued
    if (!pending || current.status !== 'ready' || !current.user) return Promise.resolve()
    const epoch = sessionEpoch,
      expectedOwner = owner
    const task = async () => {
      for (let attempt = 0; pending && epoch === sessionEpoch && attempt < 4; attempt++) {
        const sent = { ...record, case: cleanCase(record.case) },
          sequence = change
        publish({ sync: 'saving' })
        try {
          const result = await api(
            '/api/player',
            'PUT',
            {
              name: sent.name,
              case: sent.case,
              revision: sent.revision,
              generation: sent.generation,
            },
            expectedOwner
          )
          if (epoch !== sessionEpoch) return
          if (!validPlayer(result)) throw new Error('ข้อมูลเซฟไม่สมบูรณ์')
          if (sequence === change) {
            pending = false
            hydrate(result)
          } else record = { ...result, name: record.name, case: record.case }
          cache()
          publish({ sync: pending ? 'saving' : 'saved', message: '' })
        } catch (error) {
          if (epoch !== sessionEpoch) return
          if (error instanceof PlayerApiError && error.data.code === 'ACCOUNT_CHANGED') {
            cache()
            publish({
              status: 'error',
              sync: 'pending',
              busy: false,
              message:
                'บัญชีเปลี่ยนจากอีกแท็บ หยุดซิงก์แล้ว กรุณาตรวจบัญชีอีกครั้งหรือเล่นแบบผู้เยี่ยมชม',
            })
            return
          }
          if (
            error instanceof PlayerApiError &&
            error.status === 409 &&
            validPlayer(error.data.player)
          ) {
            const remote = error.data.player
            if (remote.generation !== record.generation || error.data.code === 'RESET_CONFLICT') {
              pending = false
              hydrate(remote)
              cache()
              publish({ sync: 'saved', message: 'คดีถูกเริ่มใหม่จากอุปกรณ์อื่น โหลดสถานะใหม่แล้ว' })
              return
            }
            hydrate({ ...remote, case: mergeProgress(record.case, remote.case) })
            pending = true
            cache()
            continue
          }
          cache()
          publish({
            sync: 'pending',
            message: error instanceof Error ? error.message : 'รอเชื่อมต่อเพื่อซิงก์',
          })
          return
        }
      }
      if (pending && epoch === sessionEpoch)
        publish({ sync: 'pending', message: 'เซฟมีการเปลี่ยนแปลงจากอีกอุปกรณ์ กดลองซิงก์อีกครั้ง' })
    }
    const running = task().finally(() => {
      if (queued === running) queued = null
    })
    queued = running
    return running
  }
  const unsubscribe = progress.subscribe(() => {
    if (hydrating || !['guest', 'ready'].includes(current.status)) return
    const next = caseNow()
    if (equalCase(record.case, next)) return
    record = { ...record, case: next }
    change++
    pending = owner !== 'guest'
    cache()
    if (pending) void flush()
  })
  const loadPlayer = async (user: AuthUser, epoch: number) => {
    publish({ status: 'loading', busy: true })
    const result = await api('/api/player', 'GET', undefined, user.id)
    if (epoch !== sessionEpoch) return
    if (!validPlayer(result)) throw new Error('ข้อมูลเซฟไม่สมบูรณ์ กรุณาลองโหลดอีกครั้ง')
    const local = readCache(user.id)
    owner = user.id
    pending = false
    hydrate(result, true)
    if (local?.pending && local.player.generation === result.generation) {
      pending = true
      hydrate(
        result.revision === local.player.revision
          ? { ...local.player, isNew: result.isNew }
          : { ...result, case: mergeProgress(local.player.case, result.case) }
      )
    }
    if (
      result.isNew &&
      guestBackup &&
      (guestBackup.case.completed.length || guestBackup.case.currentArea !== 'base')
    ) {
      publish({ status: 'import', busy: false, sync: 'saved', message: '' })
      return
    }
    cache()
    publish({ status: 'ready', busy: false, sync: pending ? 'pending' : 'saved', message: '' })
    await flush()
  }
  const checkSession = async () => {
    const epoch = ++sessionEpoch
    publish({ status: 'checking', busy: true })
    const user = await auth.session()
    if (epoch !== sessionEpoch) return
    if (!user) {
      adoptGuest()
      return
    }
    email = user.email
    publish({ user })
    if (!user.emailVerified) {
      publish({ status: 'unverified', busy: false })
      return
    }
    guestBackup = readCache('guest')?.player ?? null
    await loadPlayer(user, epoch)
  }
  const authWork = async (work: (valid: () => boolean) => Promise<void>) => {
    if (!current.configured) throw new Error('ยังไม่ได้เชื่อมต่อ Neon เล่นแบบผู้เยี่ยมชมได้ก่อน')
    const op = ++operation
    publish({ busy: true, message: '' })
    try {
      await work(() => op === operation)
    } catch (e) {
      if (op === operation)
        publish({
          busy: false,
          ...(['loading', 'checking'].includes(current.status) ? { status: 'error' as const } : {}),
          message: e instanceof Error ? e.message : 'เชื่อมต่อบัญชีไม่ได้',
        })
      throw e
    } finally {
      if (op === operation && current.busy) publish({ busy: false })
    }
  }
  const apiObject = {
    get: () => current,
    subscribe: (f: () => void) => {
      listeners.add(f)
      return () => {
        listeners.delete(f)
      }
    },
    initialize: () =>
      (initialization ??= (async () => {
        const op = operation
        try {
          publish({ status: 'checking', busy: true })
          const cfg = (await api('/api/account-config')) as { configured?: boolean }
          if (op !== operation) return
          publish({ configured: cfg?.configured === true })
          if (!cfg?.configured) {
            adoptGuest()
            publish({ message: 'ระบบบัญชียังไม่ได้เชื่อมต่อ Neon เล่นแบบผู้เยี่ยมชมได้' })
            return
          }
          if (readStorage(storage, guestModeKey) === 'true') {
            adoptGuest()
            return
          }
          await checkSession()
        } catch {
          if (op === operation) {
            if (current.user)
              publish({
                status: 'error',
                busy: false,
                message: 'โหลดเซฟบัญชีไม่ได้ กดลองเชื่อมต่อใหม่หรือเลือกผู้เยี่ยมชม',
              })
            else {
              adoptGuest()
              publish({ message: 'ตรวจบัญชีไม่ได้ เล่นแบบผู้เยี่ยมชมหรือลองเชื่อมต่อใหม่ได้' })
            }
          }
        }
      })()),
    async useGuest() {
      const hadUser = !!current.user
      writeStorage(storage, guestModeKey, true)
      adoptGuest()
      if (hadUser)
        try {
          await auth.signOut()
        } catch {
          publish({
            message:
              'เล่นแบบผู้เยี่ยมชมแล้ว แต่ติดต่อระบบออกจากบัญชีไม่ได้ กรุณาลองออกจากบัญชีอีกครั้งภายหลัง',
          })
        }
    },
    async signOut() {
      await apiObject.useGuest()
    },
    async signIn(nextEmail: string, password: string) {
      email = nextEmail.trim()
      sessionEpoch++
      await authWork(async (valid) => {
        try {
          await auth.signIn(email, password)
        } catch (e) {
          if (e instanceof EmailVerificationRequired && valid()) {
            publish({
              status: 'unverified',
              user: { id: '', name: current.name, email, emailVerified: false },
              busy: false,
              message: e.message,
            })
            return
          }
          throw e
        }
        if (!valid()) return
        writeStorage(storage, guestModeKey, false)
        await checkSession()
      })
    },
    async signUp(name: string, nextEmail: string, password: string) {
      if (!name.trim()) throw new Error('กรอกชื่อเจ้าหน้าที่ก่อนสมัคร')
      email = nextEmail.trim()
      sessionEpoch++
      await authWork(async (valid) => {
        await auth.signUp(name.trim().slice(0, 32), email, password)
        if (!valid()) return
        writeStorage(storage, guestModeKey, false)
        const epoch = ++sessionEpoch
        const user = await auth.session()
        if (epoch !== sessionEpoch) return
        // Providers may withhold a session until verification; retain only email, never password.
        if (!user || !user.emailVerified)
          publish({
            status: 'unverified',
            user: user ?? { id: '', name, email, emailVerified: false },
            busy: false,
            message: 'ตรวจอีเมลแล้วกรอกรหัสยืนยัน',
          })
        else {
          publish({ user })
          guestBackup = readCache('guest')?.player ?? null
          await loadPlayer(user, epoch)
        }
      })
    },
    async verifyOtp(otp: string) {
      await authWork(async (valid) => {
        await auth.verify(email, otp.trim())
        if (valid()) await checkSession()
      })
    },
    async resendOtp() {
      await authWork(() => auth.resend(email))
    },
    async sendPasswordReset(nextEmail: string) {
      await authWork(() => auth.sendReset(nextEmail.trim()))
    },
    async resetPassword(nextEmail: string, otp: string, password: string) {
      await authWork(() => auth.resetPassword(nextEmail.trim(), otp.trim(), password))
    },
    async resolveImport(importGuest: boolean) {
      if (current.status !== 'import') return
      if (importGuest && guestBackup) {
        hydrate({ ...record, case: guestBackup.case })
        pending = true
        change++
      }
      publish({ status: 'ready' })
      cache()
      // Mark a new account initialized even if the player chose an empty case.
      pending = true
      await flush()
    },
    async saveName(name: string) {
      name = name.trim().slice(0, 32)
      if (!name || !['guest', 'ready'].includes(current.status))
        throw new Error('กรอกชื่อเจ้าหน้าที่ก่อนบันทึก')
      record = { ...record, name }
      change++
      publish({ name })
      pending = owner !== 'guest'
      cache()
      await flush()
    },
    async resetCase() {
      if (current.status === 'guest') {
        const fresh = { ...record, case: emptyCase(), generation: record.generation + 1 }
        hydrate(fresh)
        guide.resetNewCase()
        cache()
        publish({ resetCounter: current.resetCounter + 1 })
        return true
      }
      if (current.status !== 'ready' || current.busy) return false
      const epoch = sessionEpoch
      try {
        publish({ busy: true })
        await flush()
        if (epoch !== sessionEpoch || current.status !== 'ready') return false
        const result = await api(
          '/api/player/reset',
          'POST',
          { revision: record.revision, generation: record.generation },
          owner
        )
        if (epoch !== sessionEpoch) return false
        if (!validPlayer(result)) throw new Error('ข้อมูลเซฟไม่สมบูรณ์')
        pending = false
        change++
        hydrate(result)
        guide.resetNewCase()
        cache()
        publish({ busy: false, sync: 'saved', message: '' })
        return true
      } catch (e) {
        if (epoch !== sessionEpoch) return false
        if (e instanceof PlayerApiError && e.data.code === 'ACCOUNT_CHANGED') {
          publish({
            status: 'error',
            busy: false,
            message: 'บัญชีเปลี่ยนจากอีกแท็บ กรุณาตรวจบัญชีใหม่ก่อน Reset',
          })
          return false
        }
        if (e instanceof PlayerApiError && e.status === 409 && validPlayer(e.data.player)) {
          pending = false
          hydrate(e.data.player)
          cache()
        }
        publish({
          busy: false,
          message: 'ต้องเชื่อมต่อเซฟล่าสุดก่อนเริ่มคดีใหม่ กดลองซิงก์แล้ว Reset อีกครั้ง',
        })
        return false
      }
    },
    async refresh() {
      if (!current.configured) {
        initialization = null
        await apiObject.initialize()
        return
      }
      if (current.status !== 'ready' || !current.user) {
        await authWork(checkSession)
        return
      }
      const epoch = sessionEpoch
      try {
        const remote = await api('/api/player', 'GET', undefined, current.user.id)
        if (epoch !== sessionEpoch || !validPlayer(remote)) return
        // A GET begun before a newer save/Reset can arrive last. Never roll counters backwards.
        if (remote.generation < record.generation) return
        if (remote.generation > record.generation) {
          pending = false
          hydrate(remote)
          cache()
          publish({ sync: 'saved', message: 'โหลดคดีที่เริ่มใหม่จากอุปกรณ์อื่นแล้ว' })
        } else if (!pending && remote.revision > record.revision) {
          hydrate(remote)
          cache()
        }
        await flush()
      } catch (e) {
        if (epoch === sessionEpoch)
          publish({
            ...(e instanceof PlayerApiError && e.data.code === 'ACCOUNT_CHANGED'
              ? { status: 'error' as const }
              : {}),
            sync: pending ? 'pending' : 'error',
            message: 'ตรวจเซฟล่าสุดไม่ได้ หรือบัญชีเปลี่ยนจากอีกแท็บ กรุณาตรวจบัญชีอีกครั้ง',
          })
      }
    },
    async retrySync() {
      await apiObject.refresh()
      await flush()
    },
    dispose() {
      sessionEpoch++
      operation++
      unsubscribe()
      listeners.clear()
    },
  }
  return apiObject
}
export const account = createAccount({
  auth: createNeonAdapter(),
  api: playerApi,
  storage: browserStorage(),
  progress: cityProgress,
  guide: tutorial,
})
if (typeof window !== 'undefined') {
  // Gate Play before the first React render, including fast clicks while config is loading.
  void account.initialize()
  const online = () => {
    void account.retrySync()
  }
  const focus = () => {
    if (account.get().status === 'ready') void account.refresh()
  }
  const storageChanged = (event: StorageEvent) => {
    const user = account.get().user
    if (user && event.key === cacheKey(user.id) && event.newValue) {
      try {
        const v = JSON.parse(event.newValue)
        if (validPlayer(v.player)) void account.refresh()
      } catch {
        /* ignore malformed external cache */
      }
    }
  }
  window.addEventListener('online', online)
  window.addEventListener('focus', focus)
  window.addEventListener('storage', storageChanged)
  import.meta.hot?.dispose(() => {
    window.removeEventListener('online', online)
    window.removeEventListener('focus', focus)
    window.removeEventListener('storage', storageChanged)
    account.dispose()
  })
}
