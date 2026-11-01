import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  handleAuthProxyRequest,
  NEON_AUTH_SESSION_COOKIE_NAME,
  NEON_AUTH_SESSION_DATA_COOKIE_NAME,
} from '@neon/auth/server'
import { neonDependencies } from '../server/neon.ts'

test('official SDK checks the upstream session token and excludes cached session data before a save', async (t) => {
  const observed: { url: string; cookie: string | null }[] = []
  t.mock.method(globalThis, 'fetch', async (url: unknown, init?: RequestInit) => {
    observed.push({ url: String(url), cookie: new Headers(init?.headers).get('cookie') })
    return Response.json({
      user: {
        id: 'sdk-user',
        name: 'เจ้าหน้าที่',
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      session: {
        id: 'sdk-session',
        userId: 'sdk-user',
        token: 'fixture-only',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60000).toISOString(),
      },
    })
  })
  const deps = neonDependencies({
    NEON_AUTH_BASE_URL: 'https://fixture.neonauth.test/neondb/auth',
    NEON_AUTH_COOKIE_SECRET: 'test-transport-cookie-secret-32-characters',
    DATABASE_URL: 'postgresql://unused-fixture',
  })
  const result = await deps.session(
    new Request('https://game.test/api/player', {
      headers: {
        origin: 'https://game.test',
        cookie: `${NEON_AUTH_SESSION_DATA_COOKIE_NAME}=stale; ${NEON_AUTH_SESSION_COOKIE_NAME}=fixture-only`,
      },
    })
  )
  assert.equal(result.user?.id, 'sdk-user')
  assert.equal(result.user?.emailVerified, true)
  assert.equal(observed[0].url, 'https://fixture.neonauth.test/neondb/auth/get-session')
  assert.ok(observed[0].cookie?.includes(`${NEON_AUTH_SESSION_COOKIE_NAME}=fixture-only`))
  assert.ok(!observed[0].cookie?.includes('stale'))
})

test('auth configuration never exposes a connection string and rejects incomplete environments', () => {
  assert.equal(neonDependencies({}).configured(), false)
  assert.equal(
    neonDependencies({
      NEON_AUTH_BASE_URL: 'http://not-https',
      NEON_AUTH_COOKIE_SECRET: 'short',
      DATABASE_URL: 'postgresql://private',
    }).configured(),
    false
  )
})

test('proxy ignores even a valid SDK-minted session cache and rechecks current identity', async (t) => {
  let calls = 0
  t.mock.method(globalThis, 'fetch', async () => {
    calls++
    const now = new Date().toISOString()
    return Response.json(
      {
        user: {
          id: 'sdk-user',
          name: calls === 1 ? 'before' : 'after',
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
        },
        session: {
          id: 's',
          userId: 'sdk-user',
          token: 'fixture-token',
          createdAt: now,
          updatedAt: now,
          expiresAt: new Date(Date.now() + 60000).toISOString(),
        },
      },
      {
        headers: {
          'set-cookie': `${NEON_AUTH_SESSION_COOKIE_NAME}=fixture-token; Secure; HttpOnly; Path=/`,
        },
      }
    )
  })
  const deps = neonDependencies({
    NEON_AUTH_BASE_URL: 'https://fixture.neonauth.test/neondb/auth',
    NEON_AUTH_COOKIE_SECRET: 'test-transport-cookie-secret-32-characters',
    DATABASE_URL: 'postgresql://unused-fixture',
  })
  const first = await deps.proxy(
    new Request('https://game.test/api/auth/get-session'),
    'get-session'
  )
  const cookies = first.headers.getSetCookie()
  assert.ok(cookies.some((value) => value.startsWith(NEON_AUTH_SESSION_DATA_COOKIE_NAME + '=')))
  const cachedRequest = new Request('https://game.test/api/auth/get-session', {
    headers: { cookie: cookies.map((value) => value.split(';')[0]).join('; ') },
  })
  const before = calls
  // Establish that the SDK itself would accept this still-valid signed cache.
  await handleAuthProxyRequest({
    request: cachedRequest.clone(),
    path: 'get-session',
    baseUrl: 'https://fixture.neonauth.test/neondb/auth',
    cookieSecret: 'test-transport-cookie-secret-32-characters',
    sameSite: 'lax',
    sessionDataTtl: 60,
  })
  assert.equal(calls, before)
  const second = await deps.proxy(cachedRequest, 'get-session')
  assert.ok(calls > before)
  assert.equal((await second.json()).user.name, 'after')
})
