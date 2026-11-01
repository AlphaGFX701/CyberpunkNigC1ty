export type AuthUser = { id: string; email: string; name: string; emailVerified: boolean }
export type AuthAdapter = {
  session(): Promise<AuthUser | null>
  signIn(email: string, password: string): Promise<void>
  signUp(name: string, email: string, password: string): Promise<void>
  verify(email: string, otp: string): Promise<void>
  resend(email: string): Promise<void>
  sendReset(email: string): Promise<void>
  resetPassword(email: string, otp: string, password: string): Promise<void>
  signOut(): Promise<void>
}
export class EmailVerificationRequired extends Error {}
type OtpResult = Promise<{ error?: { code?: string; status?: number } | null }>
type OtpMethods = {
  emailOtp: {
    verifyEmail(input: { email: string; otp: string }): OtpResult
    sendVerificationOtp(input: {
      email: string
      type: 'email-verification' | 'forget-password'
    }): OtpResult
    resetPassword(input: { email: string; otp: string; password: string }): OtpResult
  }
}

/** Official SDK stays behind one lazy adapter; no passwords enter game storage. */
export function createNeonAdapter(): AuthAdapter {
  const makeClient = async () => {
    const [{ createAuthClient }, { BetterAuthVanillaAdapter }] = await Promise.all([
      import('@neon/auth'),
      import('@neon/auth/vanilla/adapters'),
    ])
    const c = createAuthClient(`${window.location.origin}/api/auth`, {
      adapter: BetterAuthVanillaAdapter({ fetchOptions: { timeout: 15000 } }),
    })
    // SDK installs emailOTPClient internally; its public default type omits plugin actions.
    return c as typeof c & OtpMethods
  }
  let client: ReturnType<typeof makeClient> | undefined
  const sdk = () => (client ??= makeClient())
  const checked = async (
    work: PromiseLike<{ error?: { code?: string; status?: number } | null }>
  ) => {
    const result = await work
    if (result.error) {
      const error = result.error
      if (error.status && error.status >= 500)
        throw new Error('ติดต่อระบบบัญชีไม่ได้ ลองอีกครั้งหรือเล่นแบบผู้เยี่ยมชมได้')
      if (error.code === 'EMAIL_NOT_VERIFIED')
        throw new EmailVerificationRequired('กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ')
      if (error.status === 429) throw new Error('ส่งคำขอถี่เกินไป รอสักครู่แล้วลองอีกครั้ง')
      if (error.code?.includes('EXPIRED')) throw new Error('รหัสหมดอายุแล้ว กดส่งรหัสใหม่ได้เลย')
      throw new Error(
        'ตรวจอีเมล รหัสผ่าน หรือรหัสยืนยัน แล้วลองอีกครั้ง หากเคยสมัครแล้วให้เข้าสู่ระบบหรือกู้รหัสผ่าน'
      )
    }
  }
  return {
    async session() {
      // Fresh proxy session, not a cached client claim, is used to activate an owner.
      const r = await fetch('/api/auth/get-session', {
        credentials: 'same-origin',
        cache: 'no-store',
        signal: AbortSignal.timeout(15000),
      })
      if (!r.ok) throw new Error('ตรวจบัญชีไม่ได้ ลองใหม่หรือเล่นแบบผู้เยี่ยมชมได้')
      const data = await r.json()
      const u = data?.user
      if (!u) return null
      if (typeof u.id !== 'string' || typeof u.email !== 'string')
        throw new Error('ข้อมูลบัญชีไม่สมบูรณ์')
      return {
        id: u.id,
        email: u.email,
        name: typeof u.name === 'string' ? u.name : 'เจ้าหน้าที่',
        emailVerified: u.emailVerified === true,
      }
    },
    async signIn(email, password) {
      await checked((await sdk()).signIn.email({ email, password }))
    },
    async signUp(name, email, password) {
      await checked((await sdk()).signUp.email({ name, email, password }))
    },
    async verify(email, otp) {
      await checked((await sdk()).emailOtp.verifyEmail({ email, otp }))
    },
    async resend(email) {
      await checked(
        (await sdk()).emailOtp.sendVerificationOtp({ email, type: 'email-verification' })
      )
    },
    async sendReset(email) {
      await checked((await sdk()).emailOtp.sendVerificationOtp({ email, type: 'forget-password' }))
    },
    async resetPassword(email, otp, password) {
      await checked((await sdk()).emailOtp.resetPassword({ email, otp, password }))
    },
    async signOut() {
      await checked((await sdk()).signOut())
    },
  }
}
