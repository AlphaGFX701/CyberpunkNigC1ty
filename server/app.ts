import { parseWrite, parseExpected, type PlayerRepository, type VerifiedUser } from './player.ts'

export class ApiFailure extends Error {
  status: number
  code: string
  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}
export type BackendDependencies = {
  configured: () => boolean
  origin?: string
  repository: () => PlayerRepository
  session: (request: Request) => Promise<{ user: VerifiedUser | null; cookies?: string[] }>
  proxy: (request: Request, path: string) => Promise<Response>
}
const maxBytes = 16 * 1024
const authRoutes = new Set([
  'get-session',
  'sign-in/email',
  'sign-up/email',
  'sign-out',
  'email-otp/send-verification-otp',
  'email-otp/verify-email',
  'email-otp/reset-password',
])
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  })
}
function sameOrigin(request: Request, configuredOrigin?: string) {
  const origin = request.headers.get('origin')
  const expected = configuredOrigin || new URL(request.url).origin
  if (!origin || origin !== expected || request.headers.get('sec-fetch-site') === 'cross-site')
    throw new ApiFailure(403, 'ORIGIN_REJECTED', 'คำขอไม่ได้มาจากหน้าเกมนี้')
}
async function readJson(request: Request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))
    throw new ApiFailure(415, 'JSON_REQUIRED', 'ต้องส่งข้อมูลแบบ JSON')
  const text = await request.text()
  if (new TextEncoder().encode(text).length > maxBytes)
    throw new ApiFailure(413, 'BODY_TOO_LARGE', 'ข้อมูลมีขนาดเกินกำหนด')
  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new ApiFailure(400, 'INVALID_JSON', 'ข้อมูล JSON ไม่ถูกต้อง')
  }
}
export function createApiHandler(deps: BackendDependencies) {
  return async (request: Request): Promise<Response> => {
    const cookies: string[] = []
    let response: Response
    try {
      const url = new URL(request.url),
        path = url.pathname
      if (path === '/api/account-config') {
        if (request.method !== 'GET')
          throw new ApiFailure(405, 'METHOD_NOT_ALLOWED', 'วิธีเรียกไม่รองรับ')
        return json({ configured: deps.configured() })
      }
      if (!deps.configured())
        throw new ApiFailure(
          503,
          'ACCOUNT_NOT_CONFIGURED',
          'ระบบบัญชียังไม่ได้เชื่อม Neon เล่นแบบผู้เยี่ยมชมได้'
        )
      if (path.startsWith('/api/auth/')) {
        const route = path.slice('/api/auth/'.length)
        if (!authRoutes.has(route)) throw new ApiFailure(404, 'NOT_FOUND', 'ไม่พบเส้นทางบัญชี')
        if (request.method !== (route === 'get-session' ? 'GET' : 'POST'))
          throw new ApiFailure(405, 'METHOD_NOT_ALLOWED', 'วิธีเรียกไม่รองรับ')
        if (request.method === 'POST') sameOrigin(request, deps.origin)
        if (
          request.headers.has('content-length') &&
          Number(request.headers.get('content-length')) > maxBytes
        )
          throw new ApiFailure(413, 'BODY_TOO_LARGE', 'ข้อมูลมีขนาดเกินกำหนด')
        const body = request.method === 'POST' ? await request.arrayBuffer() : null
        if (body && body.byteLength > maxBytes)
          throw new ApiFailure(413, 'BODY_TOO_LARGE', 'ข้อมูลมีขนาดเกินกำหนด')
        const bounded = body
          ? new Request(request.url, { method: request.method, headers: request.headers, body })
          : request
        response = await deps.proxy(bounded, route)
        response.headers.set('cache-control', 'no-store')
        return response
      }
      if (path !== '/api/player' && path !== '/api/player/reset')
        throw new ApiFailure(404, 'NOT_FOUND', 'ไม่พบข้อมูลที่เรียก')
      if (
        (path === '/api/player' && !['GET', 'PUT'].includes(request.method)) ||
        (path === '/api/player/reset' && request.method !== 'POST')
      )
        throw new ApiFailure(405, 'METHOD_NOT_ALLOWED', 'วิธีเรียกไม่รองรับ')
      if (request.method !== 'GET') sameOrigin(request, deps.origin)
      const session = await deps.session(request)
      cookies.push(...(session.cookies || []))
      if (!session.user) throw new ApiFailure(401, 'AUTH_REQUIRED', 'กรุณาเข้าสู่ระบบอีกครั้ง')
      // The browser's auth cookie is shared across tabs. Refuse stale-tab requests
      // before looking up data when another tab has signed into another account.
      // This header is only a consistency guard; SQL ownership still comes from Neon.
      if (request.headers.get('x-techcare-account') !== session.user.id)
        throw new ApiFailure(
          409,
          'ACCOUNT_CHANGED',
          'บัญชีเปลี่ยนจากอีกแท็บ กรุณาตรวจบัญชีอีกครั้ง'
        )
      if (!session.user.emailVerified)
        throw new ApiFailure(403, 'EMAIL_NOT_VERIFIED', 'กรุณายืนยันอีเมลก่อนใช้เซฟคลาวด์')
      const repository = deps.repository()
      if (request.method === 'GET') response = json(await repository.get(session.user))
      else {
        const raw = await readJson(request)
        const input = path.endsWith('/reset') ? parseExpected(raw) : parseWrite(raw)
        if (!input) throw new ApiFailure(400, 'INVALID_PLAYER', 'ชื่อหรือข้อมูลคดีไม่ถูกต้อง')
        const result = path.endsWith('/reset')
          ? await repository.reset(session.user, input)
          : await repository.put(session.user, input as ReturnType<typeof parseWrite> & {})
        response = result.ok
          ? json(result.player)
          : json({ code: result.code, player: result.player }, 409)
      }
    } catch (error) {
      response =
        error instanceof ApiFailure
          ? json({ code: error.code, error: error.message }, error.status)
          : json(
              {
                code: 'BACKEND_UNAVAILABLE',
                error: 'เชื่อมต่อบัญชีหรือเซฟไม่ได้ กรุณาลองอีกครั้ง',
              },
              503
            )
    }
    for (const cookie of cookies) response.headers.append('set-cookie', cookie)
    return response
  }
}
