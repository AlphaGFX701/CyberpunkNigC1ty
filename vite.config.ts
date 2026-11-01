import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
const accountApi = (): Plugin => ({
  name: 'techcare-account-api',
  configureServer(server) {
    server.middlewares.use(async (request, response, next) => {
      if (!request.url?.startsWith('/api/')) return next()
      try {
        const { nodeApi } = await server.ssrLoadModule('/server/node.ts')
        await nodeApi(request, response)
      } catch {
        response.statusCode = 503
        response.setHeader('content-type', 'application/json')
        response.end(
          JSON.stringify({
            code: 'BACKEND_UNAVAILABLE',
            error: 'ระบบบัญชียังไม่พร้อม เล่นแบบผู้เยี่ยมชมได้',
          })
        )
      }
    })
  },
})
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  for (const key of [
    'NEON_AUTH_BASE_URL',
    'NEON_AUTH_COOKIE_SECRET',
    'DATABASE_URL',
    'APP_ORIGIN',
  ]) {
    if (env[key] !== undefined) process.env[key] = env[key]
  }
  return { plugins: [react(), accountApi()], server: { port: 5180 } }
})
