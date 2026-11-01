import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createApiHandler, type BackendDependencies } from '../server/app.ts'
import {
  emptyCase,
  parseWrite,
  type PlayerRecord,
  type PlayerRepository,
} from '../server/player.ts'

function fixture() {
  const rows = new Map<string, PlayerRecord>()
  let authenticated = true,
    verified = true,
    available = true
  const user = { id: 'owner-a', name: 'ผู้เล่น ก', emailVerified: true }
  const repository: PlayerRepository = {
    async get(owner) {
      if (!rows.has(owner.id))
        rows.set(owner.id, {
          name: owner.name,
          case: emptyCase(),
          revision: 0,
          generation: 0,
          isNew: true,
        })
      return structuredClone(rows.get(owner.id)!)
    },
    async put(owner, input) {
      const row = await this.get(owner)
      if (row.generation !== input.generation || row.revision !== input.revision)
        return {
          ok: false,
          code: row.generation !== input.generation ? 'RESET_CONFLICT' : 'REVISION_CONFLICT',
          player: row,
        }
      const next = { ...input, revision: row.revision + 1, isNew: false }
      rows.set(owner.id, next)
      return { ok: true, player: structuredClone(next) }
    },
    async reset(owner, expected) {
      const row = await this.get(owner)
      if (row.generation !== expected.generation || row.revision !== expected.revision)
        return {
          ok: false,
          code: row.generation !== expected.generation ? 'RESET_CONFLICT' : 'REVISION_CONFLICT',
          player: row,
        }
      const next = {
        ...row,
        case: emptyCase(),
        revision: row.revision + 1,
        generation: row.generation + 1,
        isNew: false,
      }
      rows.set(owner.id, next)
      return { ok: true, player: structuredClone(next) }
    },
  }
  const deps: BackendDependencies = {
    configured: () => available,
    repository: () => repository,
    session: async () => ({
      user: authenticated ? { ...user, emailVerified: verified } : null,
      cookies: ['a=1; HttpOnly', 'b=2; HttpOnly'],
    }),
    proxy: async () => new Response('{}', { headers: { 'content-type': 'application/json' } }),
  }
  return {
    rows,
    user,
    deps,
    handler: createApiHandler(deps),
    setAuth: (a: boolean, v = true) => {
      authenticated = a
      verified = v
    },
    setAvailable: (v: boolean) => {
      available = v
    },
  }
}
const request = (path: string, method = 'GET', body?: unknown, origin = 'https://game.test') =>
  new Request('https://game.test' + path, {
    method,
    headers: { origin, 'content-type': 'application/json', 'x-techcare-account': 'owner-a' },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
test('save endpoints require a real verified session and create no row on denial', async () => {
  const f = fixture()
  f.setAuth(false)
  assert.equal((await f.handler(request('/api/player'))).status, 401)
  f.setAuth(true, false)
  assert.equal((await f.handler(request('/api/player'))).status, 403)
  assert.equal(f.rows.size, 0)
})
test('fresh players, name/save persistence, and cookie arrays are returned through the API', async () => {
  const f = fixture()
  let response = await f.handler(request('/api/player'))
  const first = (await response.json()) as PlayerRecord
  assert.equal(first.isNew, true)
  assert.deepEqual(response.headers.getSetCookie(), ['a=1; HttpOnly', 'b=2; HttpOnly'])
  response = await f.handler(
    request('/api/player', 'PUT', {
      name: 'นายช่าง',
      case: { version: 1, completed: ['recover-cam07'], currentArea: 'relay' },
      revision: 0,
      generation: 0,
    })
  )
  assert.equal(response.status, 200)
  const saved = (await response.json()) as PlayerRecord
  assert.equal(saved.name, 'นายช่าง')
  assert.equal(saved.isNew, false)
  assert.equal(saved.revision, 1)
  assert.equal(saved.case.version, 2, 'legacy clients are normalized before persistence')
})
test('cross-origin requests and owner injection are rejected before saving', async () => {
  const f = fixture()
  const write = { name: 'คนหนึ่ง', case: emptyCase(), revision: 0, generation: 0 }
  assert.equal(
    (await f.handler(request('/api/player', 'PUT', write, 'https://evil.test'))).status,
    403
  )
  assert.equal(
    (await f.handler(request('/api/player', 'PUT', { ...write, userId: 'owner-b' }))).status,
    400
  )
  assert.equal(f.rows.size, 0)
})
test('old-tab owner cannot read, overwrite or reset the newly signed-in account', async () => {
  const f = fixture()
  // Tab B changed the shared auth cookie; tab A still carries its old owner.
  f.user.id = 'owner-b'
  for (const req of [
    request('/api/player'),
    request('/api/player', 'PUT', {
      name: 'ข้อมูลของ ก',
      case: emptyCase(),
      revision: 0,
      generation: 0,
    }),
    request('/api/player/reset', 'POST', { revision: 0, generation: 0 }),
    new Request('https://game.test/api/player'),
  ]) {
    const response = await f.handler(req)
    assert.equal(response.status, 409)
    assert.equal((await response.json()).code, 'ACCOUNT_CHANGED')
  }
  assert.equal(f.rows.size, 0)
  const correct = request('/api/player')
  correct.headers.set('x-techcare-account', 'owner-b')
  assert.equal((await f.handler(correct)).status, 200)
  assert.deepEqual([...f.rows.keys()], ['owner-b'])
})
test('reset returns an atomic generation change, stale writes cannot resurrect evidence', async () => {
  const f = fixture()
  const input = {
    name: 'เจ้าหน้าที่',
    case: { version: 1, completed: ['recover-cam07'], currentArea: 'arun' },
    revision: 0,
    generation: 0,
  }
  assert.equal((await f.handler(request('/api/player', 'PUT', input))).status, 200)
  const reset = await f.handler(
    request('/api/player/reset', 'POST', { revision: 1, generation: 0 })
  )
  const next = (await reset.json()) as PlayerRecord
  assert.equal(next.generation, 1)
  assert.equal(next.revision, 2)
  assert.equal(next.name, input.name)
  assert.deepEqual(next.case, emptyCase())
  const stale = await f.handler(request('/api/player', 'PUT', { ...input, revision: 1 }))
  assert.equal(stale.status, 409)
  assert.equal((await stale.json()).code, 'RESET_CONFLICT')
  assert.deepEqual(
    (await f.handler(request('/api/player')).then((r) => r.json())).case,
    emptyCase()
  )
})
test('invalid prerequisites, illegal areas, malformed payloads and large bodies never persist', async () => {
  const f = fixture()
  const write = { name: 'คนหนึ่ง', case: emptyCase(), revision: 0, generation: 0 }
  for (const bad of [
    { ...write, case: { version: 1, completed: ['read-relay'], currentArea: 'base' } },
    { ...write, case: { version: 1, completed: [], currentArea: 'control' } },
    {
      ...write,
      case: { version: 1, completed: ['recover-cam07', 'recover-relay'], currentArea: 'control' },
    },
    { ...write, case: { version: 2, completed: ['recover-relay'], currentArea: 'base' } },
    {
      ...write,
      case: { version: 2, completed: ['recover-cam07', 'read-relay'], currentArea: 'control' },
    },
    { ...write, revision: -1 },
    { ...write, name: '\u0000bad' },
  ])
    assert.equal((await f.handler(request('/api/player', 'PUT', bad))).status, 400)
  assert.equal(
    (await f.handler(request('/api/player', 'PUT', { ...write, name: 'x'.repeat(20000) }))).status,
    413
  )
  assert.equal(parseWrite({ ...write, name: '' }), null)
  assert.equal(f.rows.size, 0)
})

test('v1 history migrates and v2 relay evidence survives API save, load and atomic Reset', async () => {
  const f = fixture()
  const legacy = {
    name: 'คิน',
    revision: 0,
    generation: 0,
    case: {
      version: 1,
      completed: ['recover-cam07', 'read-relay', 'read-control'],
      currentArea: 'control',
    },
  }
  const migrated = (await f
    .handler(request('/api/player', 'PUT', legacy))
    .then((r) => r.json())) as PlayerRecord
  assert.equal(migrated.case.version, 2)
  assert.equal(migrated.case.currentArea, 'relay')
  assert.deepEqual(migrated.case.completed, legacy.case.completed)
  const next = {
    ...migrated,
    case: {
      version: 2,
      completed: [...migrated.case.completed, 'recover-relay'],
      currentArea: 'control',
    },
  }
  const saved = (await f
    .handler(
      request('/api/player', 'PUT', {
        name: next.name,
        revision: next.revision,
        generation: next.generation,
        case: next.case,
      })
    )
    .then((r) => r.json())) as PlayerRecord
  assert.equal(saved.case.currentArea, 'control')
  assert.ok(saved.case.completed.includes('recover-relay'))
  assert.deepEqual((await f.handler(request('/api/player')).then((r) => r.json())).case, saved.case)
  const reset = (await f
    .handler(request('/api/player/reset', 'POST', { revision: saved.revision, generation: 0 }))
    .then((r) => r.json())) as PlayerRecord
  assert.equal(reset.case.version, 2)
  assert.equal(reset.generation, 1)
  const stale = await f.handler(
    request('/api/player', 'PUT', {
      name: saved.name,
      case: saved.case,
      revision: reset.revision,
      generation: 0,
    })
  )
  assert.equal(stale.status, 409)
  assert.equal((await stale.json()).code, 'RESET_CONFLICT')
})
test('configuration failure is honest, guest config remains readable, auth proxy is bounded', async () => {
  const f = fixture()
  f.setAvailable(false)
  assert.deepEqual(await f.handler(request('/api/account-config')).then((r) => r.json()), {
    configured: false,
  })
  assert.equal((await f.handler(request('/api/player'))).status, 503)
  f.setAvailable(true)
  assert.equal((await f.handler(request('/api/auth/admin/delete-user', 'POST', {}))).status, 404)
  assert.equal(
    (await f.handler(request('/api/auth/sign-in/email', 'POST', {}, 'https://evil.test'))).status,
    403
  )
  assert.equal((await f.handler(request('/api/auth/sign-in/email', 'POST', {}))).status, 200)
})
test('repository failures return a retryable message without exposing internal connection details', async () => {
  const f = fixture()
  const handler = createApiHandler({
    ...f.deps,
    repository: () => {
      throw Error('postgres://secret:password@private')
    },
  })
  const r = await handler(request('/api/player'))
  assert.equal(r.status, 503)
  assert.doesNotMatch(await r.text(), /postgres|password|private/)
})
