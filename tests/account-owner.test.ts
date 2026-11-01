import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createAccount, PlayerApiError, type AccountApi } from '../src/account/account.ts'
import { createCityProgress } from '../src/city/progression.ts'
import { createTutorial } from '../src/tutorial/model.ts'
import { emptyCase, type PlayerRecord } from '../src/account/contracts.ts'
import type { AuthAdapter, AuthUser } from '../src/account/auth.ts'

const user = (id = 'alice'): AuthUser => ({
  id,
  email: `${id}@example.test`,
  name: id,
  emailVerified: true,
})
const player = (name = 'alice'): PlayerRecord => ({
  name,
  case: emptyCase(),
  revision: 0,
  generation: 0,
  isNew: false,
})
function deferred<T>() {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((r, j) => {
    resolve = r
    reject = j
  })
  return { promise, resolve, reject }
}
function setup(seed: Record<string, string> = {}) {
  const values = new Map(Object.entries(seed))
  const storage = {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => {
      values.set(k, v)
    },
    removeItem: (k: string) => {
      values.delete(k)
    },
  }
  const progress = createCityProgress(storage),
    guide = createTutorial(storage)
  let signed: AuthUser | null = null,
    cloud = player(),
    configured = true,
    failPut = false
  let requestOverride: AccountApi | null = null
  const calls: { path: string; method: string; body: unknown; owner?: string }[] = []
  const auth: AuthAdapter = {
    async session() {
      return signed
    },
    async signIn(email) {
      signed = user(email.split('@')[0])
    },
    async signUp(name, email) {
      signed = { id: 'new', name, email, emailVerified: false }
    },
    async verify() {
      if (signed) signed = { ...signed, emailVerified: true }
    },
    async resend() {},
    async sendReset() {},
    async resetPassword() {},
    async signOut() {
      signed = null
    },
  }
  const api: AccountApi = async (path, method = 'GET', body, owner) => {
    calls.push({ path, method, body, owner })
    if (requestOverride) return requestOverride(path, method, body, owner)
    if (path === '/api/account-config') return { configured }
    if (method === 'GET') return structuredClone(cloud)
    const b = body as PlayerRecord
    if (failPut) throw new Error('offline')
    if (b.generation !== cloud.generation || b.revision !== cloud.revision)
      throw new PlayerApiError(409, {
        code: b.generation !== cloud.generation ? 'RESET_CONFLICT' : 'REVISION_CONFLICT',
        player: structuredClone(cloud),
      })
    cloud = {
      ...cloud,
      ...(path.endsWith('/reset')
        ? { case: emptyCase(), generation: cloud.generation + 1 }
        : { name: b.name, case: b.case }),
      revision: cloud.revision + 1,
      isNew: false,
    }
    return structuredClone(cloud)
  }
  const account = createAccount({ auth, api, storage, progress, guide })
  return {
    account,
    progress,
    guide,
    values,
    auth,
    calls,
    cloud: () => cloud,
    setCloud: (v: PlayerRecord) => {
      cloud = v
    },
    setUser: (v: AuthUser | null) => {
      signed = v
    },
    configure: (v: boolean) => {
      configured = v
    },
    offline: (v: boolean) => {
      failPut = v
    },
    override: (v: AccountApi | null) => {
      requestOverride = v
    },
  }
}
test('legacy case and tutorial migrate to guest, not the first account', async () => {
  const f = setup({
    'techcare.case.v1': JSON.stringify({
      version: 1,
      completed: ['recover-cam07'],
      currentArea: 'arun',
    }),
    'techcare.tutorial.v1': JSON.stringify({ version: 1, status: 'skipped' }),
    'techcare.entry.v1': JSON.stringify({ version: 1, name: 'Guest Kin' }),
  })
  assert.equal(f.account.get().name, 'Guest Kin')
  assert.equal(f.guide.get().status, 'skipped')
  await f.account.initialize()
  await f.account.signIn('alice@example.test', 'password')
  assert.equal(f.account.get().status, 'ready')
  assert.deepEqual(f.progress.get().completed, [])
  await f.account.useGuest()
  assert.deepEqual(f.progress.get().completed, ['recover-cam07'])
  assert.equal(f.account.get().name, 'Guest Kin')
})
test('signup needs OTP, cloud cannot load until verified, and secrets never persist', async () => {
  const f = setup()
  await f.account.initialize()
  await f.account.signUp('คินทดสอบ', 'new@example.test', 'not-stored-password')
  assert.equal(f.account.get().status, 'unverified')
  assert.equal(f.calls.filter((x) => x.path === '/api/player').length, 0)
  await f.account.verifyOtp('123456')
  assert.equal(f.account.get().status, 'ready')
  assert.ok(![...f.values.values()].join('').includes('not-stored-password'))
  assert.ok(![...f.values.values()].join('').includes('123456'))
})
test('new cloud case requires explicit guest import and keeps guest backup', async () => {
  const f = setup()
  f.progress.recordCamRecovery()
  f.setCloud({ ...player(), isNew: true })
  await f.account.initialize()
  await f.account.signIn('alice@example.test', 'x')
  assert.equal(f.account.get().status, 'import')
  assert.deepEqual(f.progress.get().completed, [])
  await f.account.resolveImport(true)
  assert.deepEqual(f.cloud().case.completed, ['recover-cam07'])
  assert.equal(f.account.get().status, 'ready')
  await f.account.useGuest()
  assert.deepEqual(f.progress.get().completed, ['recover-cam07'])
})
test('offline pending writes retry, revision conflicts merge legal milestones', async () => {
  const f = setup()
  await f.account.initialize()
  await f.account.signIn('alice@example.test', 'x')
  f.offline(true)
  f.progress.recordCamRecovery()
  await f.account.retrySync()
  assert.equal(f.account.get().sync, 'pending')
  f.setCloud({
    ...f.cloud(),
    case: { version: 1, completed: ['recover-cam07', 'read-relay'], currentArea: 'relay' },
    revision: 2,
  })
  f.offline(false)
  await f.account.retrySync()
  assert.deepEqual(f.cloud().case.completed, ['recover-cam07', 'read-relay'])
  assert.equal(f.progress.get().currentArea, 'relay')
  assert.equal(f.account.get().sync, 'saved')
})
test('remote Reset generation drops pending pre-reset evidence and tutorial', async () => {
  const f = setup()
  await f.account.initialize()
  await f.account.signIn('alice@example.test', 'x')
  f.guide.skip()
  f.offline(true)
  f.progress.recordCamRecovery()
  await f.account.retrySync()
  f.setCloud({ ...player(), revision: 2, generation: 1 })
  f.offline(false)
  await f.account.retrySync()
  assert.deepEqual(f.progress.get().completed, [])
  assert.equal(f.guide.get().status, 'unseen')
  assert.deepEqual(f.cloud().case.completed, [])
})
test('Reset preserves identity/name and requires network for an account', async () => {
  const f = setup()
  await f.account.initialize()
  await f.account.signIn('alice@example.test', 'x')
  await f.account.saveName('คิน')
  f.guide.skip()
  f.progress.recordCamRecovery()
  await f.account.retrySync()
  f.offline(true)
  assert.equal(await f.account.resetCase(), false)
  assert.equal(f.progress.get().completed.length, 1)
  f.offline(false)
  assert.equal(await f.account.resetCase(), true)
  assert.equal(f.account.get().user?.id, 'alice')
  assert.equal(f.account.get().name, 'คิน')
  assert.equal(f.cloud().generation, 1)
  assert.equal(f.guide.get().status, 'unseen')
  assert.deepEqual(f.progress.get().completed, [])
})
test('delayed cloud load cannot reactivate previous account after choosing guest', async () => {
  const f = setup()
  await f.account.initialize()
  const held = deferred<unknown>()
  f.override(async () => held.promise)
  const login = f.account.signIn('alice@example.test', 'x')
  await new Promise((r) => setTimeout(r, 0))
  await f.account.useGuest()
  held.resolve(player())
  await login
  assert.equal(f.account.get().status, 'guest')
  assert.equal(f.account.get().user, null)
})
test('delayed credentials and config cannot undo explicit guest choice', async () => {
  const f = setup()
  await f.account.initialize()
  const held = deferred<void>()
  f.auth.signIn = async () => {
    await held.promise
    f.setUser(user())
  }
  const login = f.account.signIn('alice@example.test', 'x')
  await f.account.useGuest()
  held.resolve()
  await login
  assert.equal(f.account.get().status, 'guest')
  const g = setup(),
    cfg = deferred<unknown>()
  g.override(async () => cfg.promise)
  const init = g.account.initialize()
  await g.account.useGuest()
  cfg.resolve({ configured: true })
  await init
  assert.equal(g.account.get().status, 'guest')
})
test('unconfigured backend stays playable and load failure is retryable', async () => {
  const f = setup()
  f.configure(false)
  await f.account.initialize()
  assert.equal(f.account.get().status, 'guest')
  await assert.rejects(f.account.signIn('alice@example.test', 'x'))
  f.configure(true)
  await f.account.refresh()
  f.override(async () => {
    throw new Error('offline')
  })
  await assert.rejects(f.account.signIn('alice@example.test', 'x'))
  assert.equal(f.account.get().status, 'error')
  await f.account.useGuest()
  assert.equal(f.account.get().status, 'guest')
})
test('shared-cookie account change stops the old queue before loading the new owner', async () => {
  const f = setup()
  await f.account.initialize()
  await f.account.signIn('alice@example.test', 'x')
  f.override(async () => {
    throw new PlayerApiError(409, { code: 'ACCOUNT_CHANGED' })
  })
  f.progress.recordCamRecovery()
  await new Promise((r) => setTimeout(r, 0))
  assert.equal(f.account.get().status, 'error')
  const sent = f.calls.find((x) => x.method === 'PUT')!
  assert.equal(sent.owner, 'alice')
  f.override(null)
  f.setUser(user('bob'))
  f.setCloud(player('bob'))
  await f.account.refresh()
  assert.equal(f.account.get().user?.id, 'bob')
  assert.deepEqual(f.progress.get().completed, [])
  assert.equal(f.calls.at(-1)?.owner, 'bob')
})
test('a rejected Reset response from an old owner cannot hydrate the guest case', async () => {
  const f = setup()
  await f.account.initialize()
  await f.account.signIn('alice@example.test', 'x')
  const held = deferred<unknown>()
  f.override(async () => held.promise)
  const reset = f.account.resetCase()
  await new Promise((r) => setTimeout(r, 0))
  await f.account.useGuest()
  held.reject(
    new PlayerApiError(409, {
      code: 'REVISION_CONFLICT',
      player: {
        ...player(),
        case: { version: 1, completed: ['recover-cam07'], currentArea: 'relay' },
      },
    })
  )
  assert.equal(await reset, false)
  assert.equal(f.account.get().status, 'guest')
  assert.deepEqual(f.progress.get().completed, [])
})
test('a delayed GET from before Reset cannot roll its generation backwards', async () => {
  const f = setup()
  await f.account.initialize()
  await f.account.signIn('alice@example.test', 'x')
  const old = structuredClone(f.cloud()),
    held = deferred<unknown>()
  f.override(async () => held.promise)
  const refresh = f.account.refresh()
  f.override(null)
  assert.equal(await f.account.resetCase(), true)
  held.resolve(old)
  await refresh
  f.progress.recordCamRecovery()
  await f.account.retrySync()
  assert.equal(f.cloud().generation, 1)
  assert.deepEqual(f.cloud().case.completed, ['recover-cam07'])
})
