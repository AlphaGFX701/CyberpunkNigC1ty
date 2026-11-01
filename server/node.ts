import type { IncomingMessage, ServerResponse } from 'node:http'
import { createApiHandler } from './app.ts'
import { neonDependencies } from './neon.ts'

const maxBytes = 16 * 1024
export function createNodeApi(
  handler: (request: Request) => Promise<Response> = (request) =>
    createApiHandler(neonDependencies())(request)
) {
  return async (request: IncomingMessage & { body?: unknown }, response: ServerResponse) => {
    try {
      const chunks: Buffer[] = []
      let bytes = 0
      if (request.body !== undefined) {
        const raw =
          typeof request.body === 'string' || Buffer.isBuffer(request.body)
            ? request.body
            : JSON.stringify(request.body)
        const chunk = Buffer.from(raw as string)
        bytes = chunk.byteLength
        chunks.push(chunk)
      } else {
        for await (const part of request.iterator({ destroyOnReturn: false })) {
          const chunk = Buffer.isBuffer(part) ? part : Buffer.from(part)
          bytes += chunk.length
          if (bytes > maxBytes) {
            request.resume()
            break
          }
          chunks.push(chunk)
        }
      }
      if (bytes > maxBytes) {
        response.statusCode = 413
        response.setHeader('content-type', 'application/json')
        response.setHeader('cache-control', 'no-store')
        response.end(JSON.stringify({ code: 'BODY_TOO_LARGE', error: 'ข้อมูลมีขนาดเกินกำหนด' }))
        return
      }
      const headers = new Headers()
      for (const [key, value] of Object.entries(request.headers)) {
        if (Array.isArray(value)) for (const v of value) headers.append(key, v)
        else if (value !== undefined) headers.set(key, value)
      }
      const proto = process.env.VERCEL ? 'https' : 'http'
      const origin =
        process.env.APP_ORIGIN || `${proto}://${request.headers.host || 'localhost:5180'}`
      const url = new URL(request.url || '/', origin)
      const method = request.method || 'GET'
      const fetchRequest = new Request(url, {
        method,
        headers,
        ...(!['GET', 'HEAD'].includes(method) && bytes ? { body: Buffer.concat(chunks) } : {}),
      })
      const result = await handler(fetchRequest)
      response.statusCode = result.status
      for (const [key, value] of result.headers)
        if (key !== 'set-cookie') response.setHeader(key, value)
      const cookies = result.headers.getSetCookie()
      if (cookies.length) response.setHeader('set-cookie', cookies)
      response.end(Buffer.from(await result.arrayBuffer()))
    } catch {
      response.statusCode = 503
      response.setHeader('content-type', 'application/json')
      response.setHeader('cache-control', 'no-store')
      response.end(
        JSON.stringify({
          code: 'BACKEND_UNAVAILABLE',
          error: 'เชื่อมต่อระบบบัญชีไม่ได้ กรุณาลองอีกครั้ง',
        })
      )
    }
  }
}
export const nodeApi = createNodeApi()
