import type { IncomingMessage, ServerResponse } from 'node:http'
import { nodeApi } from './node.ts'

type Handler = (request: IncomingMessage & { body?: unknown }, response: ServerResponse) => Promise<void>

/** Vercel rewrites all public /api paths to the one bundled Function. */
export function createVercelApi(handler: Handler = nodeApi): Handler {
  return async (request, response) => {
    const url = new URL(request.url || '/', 'https://routing.invalid')
    const routedPath = url.searchParams.get('__techcare_path')
    if (url.pathname === '/api/index' || url.pathname === '/api/index.mjs') {
      if (!routedPath || !/^[a-zA-Z0-9/_-]+$/.test(routedPath)) {
        response.statusCode = 404
        response.setHeader('content-type', 'application/json')
        response.end(JSON.stringify({ code: 'NOT_FOUND', error: 'ไม่พบเส้นทางบัญชี' }))
        return
      }
      url.pathname = `/api/${routedPath}`
    }
    url.searchParams.delete('__techcare_path')
    request.url = url.pathname + url.search
    await handler(request, response)
  }
}

export const config = { api: { bodyParser: false } }
export default createVercelApi()
