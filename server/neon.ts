import { handleAuthProxyRequest, NEON_AUTH_SESSION_DATA_COOKIE_NAME } from '@neon/auth/server'
import { ApiFailure, type BackendDependencies } from './app.ts'
import { createPostgresRepository } from './postgres.ts'

type Environment = Record<string, string | undefined>
export function neonDependencies(env: Environment = process.env): BackendDependencies {
  const baseUrl = env.NEON_AUTH_BASE_URL || ''
  const secret = env.NEON_AUTH_COOKIE_SECRET || ''
  const connectionString = env.DATABASE_URL || ''
  let repository: ReturnType<typeof createPostgresRepository> | undefined
  const configured = () => {
    try {
      return (
        new URL(baseUrl).protocol === 'https:' && secret.length >= 32 && Boolean(connectionString)
      )
    } catch {
      return false
    }
  }
  const proxy: BackendDependencies['proxy'] = (request, path) => {
    if (path === 'get-session' && request.method === 'GET') {
      // Read current upstream identity/verification even if a browser still has a
      // signed cache from before another tab logged out or changed the account.
      const headers = new Headers(request.headers)
      headers.set(
        'cookie',
        (headers.get('cookie') || '')
          .split(';')
          .filter((part) => {
            const name = part.trim().split('=')[0]
            return name !== NEON_AUTH_SESSION_DATA_COOKIE_NAME && !name.endsWith('.session_data')
          })
          .join(';')
      )
      request = new Request(request, { headers })
    }
    return handleAuthProxyRequest({
      request,
      path,
      baseUrl,
      cookieSecret: secret,
      sameSite: 'lax',
      sessionDataTtl: 60,
    })
  }
  return {
    configured,
    origin: env.APP_ORIGIN || undefined,
    repository: () => (repository ??= createPostgresRepository(connectionString)),
    proxy,
    session: async (request) => {
      const check = new Request(new URL('/api/auth/get-session', request.url), {
        headers: request.headers,
      })
      const response = await proxy(check, 'get-session')
      if (!response.ok) {
        if (response.status === 401) return { user: null }
        throw new ApiFailure(503, 'AUTH_UNAVAILABLE', 'ตรวจบัญชีกับ Neon ไม่ได้ กรุณาลองอีกครั้ง')
      }
      const data = (await response.json()) as {
        user?: { id?: unknown; name?: unknown; emailVerified?: unknown }
        session?: unknown
      } | null
      const raw = data?.user
      const user =
        raw && data?.session && typeof raw.id === 'string'
          ? {
              id: raw.id,
              name: typeof raw.name === 'string' ? raw.name : 'เจ้าหน้าที่',
              emailVerified: raw.emailVerified === true,
            }
          : null
      return { user, cookies: response.headers.getSetCookie() }
    },
  }
}
