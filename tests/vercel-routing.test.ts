import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createNodeApi } from '../server/node.ts'
import { createVercelApi } from '../server/vercel.ts'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'

test('bundled Function imports without source TS and serves public config', async () => {
  execFileSync(process.execPath, ['tools/build-api.mjs'], { cwd: process.cwd() })
  const source = await readFile('api/index.mjs', 'utf8')
  assert.doesNotMatch(source, /from ['"]\.{1,2}\/.*\.ts['"]/) 
  const { default: api } = await import('../api/index.mjs')
  const server = createServer(api)
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  try {
    const address = server.address() as { port: number }
    const r = await fetch(`http://127.0.0.1:${address.port}/api/index?__techcare_path=account-config`)
    assert.equal(r.status, 200)
    assert.equal(typeof (await r.json()).configured, 'boolean')
  } finally { await new Promise<void>((resolve) => server.close(() => resolve())) }
})

test('single Function restores nested routes and preserves body, query, Origin and cookies', async () => {
  const node = createNodeApi(async (request) => {
    const headers = new Headers({ 'content-type': 'application/json' })
    headers.append('set-cookie', 'session=a; HttpOnly; Secure; SameSite=Lax')
    headers.append('set-cookie', 'cache=b; HttpOnly; Secure; SameSite=Lax')
    return new Response(JSON.stringify({ path: new URL(request.url).pathname,
      query: new URL(request.url).search, method: request.method,
      origin: request.headers.get('origin'), cookie: request.headers.get('cookie'),
      body: request.method === 'GET' ? '' : await request.text() }), { headers })
  })
  const server = createServer(createVercelApi(node))
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address() as { port: number }, base = `http://127.0.0.1:${address.port}`
  try {
    for (const path of ['auth/sign-in/email', 'auth/get-session', 'player', 'player/reset']) {
      const post = path !== 'auth/get-session'
      const r = await fetch(`${base}/api/index?__techcare_path=${path}&next=keep`, {
        method: post ? 'POST' : 'GET', headers: { origin: base, cookie: 'session=old' },
        ...(post ? { body: '{"probe":true}' } : {}) })
      assert.equal(r.status, 200)
      const data = await r.json()
      assert.equal(data.path, `/api/${path}`)
      assert.equal(data.query, '?next=keep')
      assert.equal(data.origin, base)
      assert.equal(data.cookie, 'session=old')
      assert.equal(data.body, post ? '{"probe":true}' : '')
      assert.equal(r.headers.getSetCookie().length, 2)
    }
    const invalid = await fetch(`${base}/api/index?__techcare_path=https://outside.invalid`)
    assert.equal(invalid.status, 404)
  } finally { await new Promise<void>((resolve) => server.close(() => resolve())) }
})
