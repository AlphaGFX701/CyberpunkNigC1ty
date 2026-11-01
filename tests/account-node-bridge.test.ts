import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer, request as httpRequest } from 'node:http'
import { once } from 'node:events'
import { createNodeApi } from '../server/node.ts'

test('Node bridge preserves separate Set-Cookie values including an Expires comma', async (t) => {
  const cookies = [
    'one=a; Path=/; HttpOnly; Expires=Wed, 01 Jan 2031 00:00:00 GMT',
    'two=b; Path=/; HttpOnly',
  ]
  const server = createServer(
    createNodeApi(async (request) => {
      assert.equal(request.headers.get('origin'), 'http://game.test')
      const headers = new Headers({
        'content-type': 'application/json',
        'cache-control': 'no-store',
      })
      for (const value of cookies) headers.append('set-cookie', value)
      return new Response('{"ok":true}', { headers })
    })
  )
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => server.close())
  const address = server.address() as { port: number }
  const result = await fetch(`http://127.0.0.1:${address.port}/api/auth/get-session`, {
    headers: { origin: 'http://game.test' },
  })
  assert.deepEqual(result.headers.getSetCookie(), cookies)
  assert.equal(result.headers.get('cache-control'), 'no-store')
  assert.deepEqual(await result.json(), { ok: true })
})

test('oversized chunked request gets a bounded 413 without reaching the handler', async (t) => {
  let calls = 0
  const server = createServer(
    createNodeApi(async () => {
      calls++
      return Response.json({})
    })
  )
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => server.close())
  const address = server.address() as { port: number }
  const status = await new Promise<number>((resolve, reject) => {
    const outgoing = httpRequest(
      {
        hostname: '127.0.0.1',
        port: address.port,
        path: '/api/player',
        method: 'PUT',
        headers: { 'transfer-encoding': 'chunked' },
      },
      (incoming) => {
        incoming.resume()
        incoming.on('end', () => resolve(incoming.statusCode || 0))
      }
    )
    outgoing.on('error', reject)
    outgoing.write('x'.repeat(10000))
    outgoing.write('x'.repeat(10000))
    outgoing.end()
  })
  assert.equal(status, 413)
  assert.equal(calls, 0)
})
