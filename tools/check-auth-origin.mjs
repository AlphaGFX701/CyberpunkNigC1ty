// A nonexistent reserved-domain identity exercises real origin validation without creating an account.
const origin = process.argv[2] || 'http://127.0.0.1:5180'
const response = await fetch(new URL('/api/auth/sign-in/email', origin), {
  method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin },
  body: JSON.stringify({ email: 'origin-probe@example.invalid', password: 'probe-not-a-real-account' }),
})
const result = await response.json()
const pass = response.status === 401 && result.code === 'INVALID_EMAIL_OR_PASSWORD'
console.log(JSON.stringify({ origin, status: response.status, code: result.code, originValidationPassed: pass }))
process.exitCode = pass ? 0 : 1
