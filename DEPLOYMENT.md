# Publish the playable prototype

Target Git repository: https://github.com/AlphaGFX701/CyberpunkNigC1ty

Initial release, 1 November 2026: https://techcare-signal-trace.vercel.app/ · runtime source commit `e03f21c3676fde6d6c2effb5e35916573fbb23b1` · deployment `dpl_qAKMkafyhRMRoaHvpe1FKmJqxVu1`. Vercel reported READY and promotion succeeded. Project Vercel authentication is disabled for public access; Neon still protects account saves. Exact release/stable origins were added to Neon. Online gameplay and live OTP were left for the user at their request; no online playtest was performed.

Target Vercel team: `God_like` / `god-like1`; project: `techcare-signal-trace`. This is separate from earlier TechCare games. Public Git is a code distribution, not a complete third-party asset pack; automatic Git deployments are disabled.

## Two-chapter release candidate — 2 November 2026

Source commit: `99ed5e1` (pushed to main). Candidate deployment: `dpl_2QhN84z7F6t5e72LyFqT5F8sSyT1`, https://techcare-signal-trace-gb0s3sywm-god-like1.vercel.app . Contains both playable chapters, final-chapter prompt documentation, new gait/dialogue/music/tutorial and the bundled account Function. The final chapter itself is not implemented.

Verified:120 unit/API tests, production build and8 critical desktop browser cases. Candidate online config200/configuredtrue, session200/null, player401 when unsigned; bounded invalid-account probe401/INVALID_EMAIL_OR_PASSWORD and cross-origin403/ORIGIN_REJECTED. Its exact origin is added to Neon. Candidate has no Vercel authentication wall. The user has been asked to perform real Login/OTP, refresh and logout/login; those results and promotion are pending. Never treat the invalid-account probe as proof of email delivery or authenticated save persistence.

## Prepare and verify

### Account Function repair — 2 November 2026

The first release's real runtime log reported `ERR_MODULE_NOT_FOUND` for `/var/task/server/node.ts`; nested `/api/auth/get-session` also returned404. Backend typechecking alone did not produce runtime JavaScript. The build now runs `tools/build-api.mjs` to bundle the application server into the single Node24 Function `api/index.mjs`. Staging generates it before Vercel discovers Function entries. This generated artifact is excluded from Git and included in the deployment; its source and bundler remain in Git.

An explicit `/api/:path*` rewrite routes nested Auth and player URLs to that Function. The adapter restores the original application pathname, removes only its internal routing query, and preserves request body/query/Origin and separate Set-Cookie headers. `tests/vercel-routing.test.ts` imports the actual bundle and exercises the bridge. Do not restore the former unbundled TypeScript catch-all entry.

Use Node 24.x, `npm ci`, then prepare the artwork as described in `ASSETS_SETUP.md`. Configure the server locally using `.env.example`, without committing actual credentials. Run `npm test`, `npx playwright test --workers=1` and `npm run build`.

Run `npm run deploy:prepare`. It verifies checksums and creates a fresh allowlisted `output/deploy-<timestamp>` containing code, build inputs and runtime artwork. It omits `.env.local`, original art packs, `.git`, evidence, caches and unused NULLSIGNAL PNGs. `output/latest-stage.json` records its path. Keep this staging folder local.

## Configure Vercel

Use Vercel CLI 65.9.0 authenticated to the intended team. Link the staging directory to the existing `techcare-signal-trace` project with an explicit `--scope god-like1`, then inspect the resolved project before deployment. `vercel.json` selects Vite, `npm ci`, `npm run build`, `dist` and Singapore Functions. `package.json` pins Node 24.x.

Set `DATABASE_URL`, `NEON_AUTH_BASE_URL` and a stable online-only `NEON_AUTH_COOKIE_SECRET` in Vercel's Production environment. The cookie secret must be cryptographically random and at least 32 characters. Keep `APP_ORIGIN` unset, so the existing server validates each request's actual same origin. Never prefix secrets with `VITE_`, include them in deploy files, print them or pass them as command-line arguments.

For this trial release use this game's existing Neon database and Auth branch without migrations or resets. Add the exact generated deployment origin and stable public alias to Neon trusted origins, preserving localhost and existing trusted entries. Do not add wildcard origins or rewrite browser Origin headers.

## Stage, test, promote

From the verified staging directory use `vercel deploy --prod --skip-domain --scope god-like1`. Test the returned deployment before promoting it with `vercel promote <deployment> --scope god-like1`. The main game must be accessible without a Vercel account; adjust protection only for this project if needed.

Check `/api/account-config`, unauthenticated save denial, origin validation, terminal entry, guest play, story, map, first recovery task, audio, reduced motion and narrow screens. Use only a nonexistent reserved-domain address to diagnose sign-in origin acceptance. The user performs their own real registration/OTP; fixture success does not prove delivery. Neon shared email is for this initial trial; broader production needs the sender setup described in `NEON_SETUP.md`.

Record the released Git commit, deployment URL and stable public URL together. Future updates repeat the same staging workflow from the workstation that holds the permitted runtime assets. Push alone does not publish. For rollback, use the previous successful deployment in this same Vercel project; do not touch older game projects or reset the database.
