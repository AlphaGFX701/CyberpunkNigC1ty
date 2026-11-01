# Neon account setup

## สถานะโปรเจกต์นี้

สร้างโปรเจกต์ `techcare-signal-trace` บน Neon แล้ว (Singapore, Free plan, development branch) และสร้างตารางเซฟเรียบร้อย เปิด require email verification และเลือก OTP แล้ว ตัวเกมในเครื่องใช้ค่าจริงจาก `.env.local` ที่ถูกละเว้นจาก Git

เปิด http://127.0.0.1:5180/ → กด E ค้างหรือคลิกเครื่องอ่านบัตร → ประตูเปิด → หน้า Login → สมัครบัญชี → กรอก OTP จากอีเมลของคุณ รหัสผ่านและ OTP ไม่ต้องส่งในแชต เมื่อยืนยันแล้วชื่อกับเซฟคดีจะผูกกับบัญชีนั้น ผู้เยี่ยมชมยังเข้าได้จากปุ่มเล็กที่ขอบฉาก รอบนี้ยังไม่ได้เผยแพร่ระบบใหม่นี้ขึ้น Vercel

หากแก้ค่าการเชื่อมต่อให้รีสตาร์ท `npm run dev` หลังจากนั้น `/api/account-config` ต้องเป็น `configured:true` การแสดงค่านี้ยังไม่ใช่หลักฐานว่าส่งอีเมลถึงแล้ว

The provisioning steps below are retained for a fresh environment. The current database is already migrated; do not replace its credentials with examples.

The app has a real same-origin auth proxy and PostgreSQL save endpoints. Without a configured Neon project it reports that accounts are unavailable and keeps guest play available. It never pretends an email was sent or a cloud save succeeded.

## 1. Create this game's own project

Create a Neon project for TechCare, separate from the reference game. Choose a database region near the Vercel Functions region. Enable Managed Better Auth in that project. Enable email/password registration, require email verification, and select **verification codes (OTP)**. Enable the Email OTP plugin for verification and password reset; do not require a passwordless sign-in flow.

Set the application name to TechCare. Add actual localhost, preview and production origins as trusted domains in Neon. Include `http://127.0.0.1:5180` when testing with the existing local server; `localhost` is a distinct origin. Set OTP lifetime and rate limits in Neon; the app displays provider errors and cooldowns rather than claiming delivery.

The current development origin `http://127.0.0.1:5180` has been explicitly added. `allow_localhost:true` alone did not cover it: real POST sign-in reproduced `403 INVALID_ORIGIN`. After the exact origin was added, the same nonexistent reserved-domain login returned `401 INVALID_EMAIL_OR_PASSWORD`, proving origin validation passed without creating a test account. Run `node tools/check-auth-origin.mjs` to repeat that bounded diagnostic. Keep browser Origin forwarding and application CSRF validation intact; do not use wildcard origins or rewrite the browser Origin to bypass the provider.

## 2. Server environment

Copy `.env.example` to `.env.local` and enter:

- `NEON_AUTH_BASE_URL`: copy the Auth Base URL from Neon exactly, including the selected database name. This development project uses `/techcare/auth`; do not substitute the default `/neondb/auth` example.
- `NEON_AUTH_COOKIE_SECRET`: a newly generated cryptographically random secret, at least 32 characters. Keep one stable value per environment so session cookies remain verifiable.
- `DATABASE_URL`: the Neon server connection string for the database role which owns the game table. Never put it in a variable beginning `VITE_`.
- `APP_ORIGIN`: optional single canonical origin. Leave empty for separately isolated localhost/preview deployments; the request's actual origin is used. If set, it must match the page's origin exactly.

No real secret belongs in Git, screenshots, browser code or chat. The `.env.example` values are placeholders and cannot enable accounts.

## 3. Create the game table

Run `node --experimental-strip-types server/migrate.ts` from the project folder, or execute `migrations/001_accounts.sql` in the SQL editor with the table-owning role. The migration creates only `techcare_players`; it does not modify `neon_auth`, passwords or provider sessions. It is safe to run again.

The table is server-only. Public/anonymous/authenticated roles are denied direct table access and row-level security is enabled without public policies. Use the owner connection for Vercel Functions. Authenticated game APIs derive the user ID from a fresh Neon session and allow only verified accounts.

## 4. Local verification

Run the existing `npm run dev`. Vite serves `/api/*` using the same backend code as Vercel. Restart Vite after changing `.env.local`.

- `GET /api/account-config` must return `{ "configured": true }` when the three required environment values are present. This indicates configuration availability, not successful email delivery or database connectivity.
- Open the officer/account panel and register a test account using an email you own. Check inbox/spam, verify the OTP, choose whether to import the guest save, and complete a recovery task.
- Log out, reload, sign back in, then test a second browser/device. Name, case milestones and current area must match.
- Check incorrect/expired OTP, resend rate limiting, forgot-password OTP, unavailable network and account switching.
- Reset from one browser, then try saving from an older tab. The old generation must receive a conflict and adopt the fresh empty case instead of resurrecting evidence.

## 5. Vercel

Set the same server-only variables in the intended Vercel environment; add that deployment's origin to Neon trusted domains. The `api/[...path].ts` function owns the same-origin endpoints. Keep previews connected to a separate Neon branch/project from production when testing destructive Reset behavior. Never use the reference game's database.

Neon's shared email sender supports verification codes and password reset for development/testing. For public production use, configure an email sender you control and check delivery limits. Verification links specifically require a custom provider, while this implementation uses codes.

## Endpoints and ownership

| Endpoint | Purpose |
| --- | --- |
| `GET /api/account-config` | Public configured/unconfigured flag; no credentials |
| `/api/auth/*` | Restricted official Neon SDK proxy for email signup/login, OTP, reset and logout |
| `GET /api/player` | Fresh verified session → own profile/case/revision/generation |
| `PUT /api/player` | Verified same-origin request → atomic compare-and-swap save |
| `POST /api/player/reset` | Verified same-origin request → empty case and increment revision/reset generation |

PUT accepts only name, case, revision and generation. User ID is never accepted from a request body. The server rejects illegal milestone prerequisites, inaccessible current areas, counter errors and oversized bodies. Normal saves cannot remove completed milestones; Reset is the explicit path for clearing them. Session/profile failures return retryable messages without database details.

All player requests also carry `X-Techcare-Account`, the account the caller currently expects. The server compares it with the freshly verified session and rejects missing/mismatched values with `409 ACCOUNT_CHANGED` before reading or writing a row. This prevents an older tab's save from being applied to a different account after another tab changes the shared cookie. The header never selects a SQL owner; the session remains authoritative.

Tests use injected auth and an in-memory repository strictly inside test files. Production contains no demo identity, fallback password or mock account service. Unit/API and browser fixture tests do not prove real email delivery or cross-device cloud persistence; complete the live checklist after provisioning.

References: [Neon email verification](https://neon.com/docs/auth/guides/email-verification), [Production checklist](https://neon.com/docs/auth/production-checklist), [SDK server adapter](https://github.com/neondatabase/neon-js/blob/main/packages/auth/BUILDING-AN-ADAPTER.md).
