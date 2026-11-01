# ADR 0004 — Neon identity and account-owned case saves

Status: accepted through the user-approved Neon account plan, 2026-11-01.

## Decision

Neon Managed Better Auth owns passwords, email OTP, sessions and recovery. The official SDK is a lazy auth adapter behind the existing pixel account panel. A same-origin Vercel/Vite proxy preserves provider cookies and checks fresh upstream sessions. No homemade password store, fake production identity or Firebase dependency is introduced. The current standalone SDK is pinned to @neon/auth 0.8.2; the older @neondatabase/auth beta pulled vulnerable unused UI dependencies and was replaced before delivery.

User visual correction: entry is now access gate → full account page → Kin's main menu → authored story → game. The account page is opaque and separate from gameplay, not a Modal over the playfield. Hold E opens this page; click and guest alternatives remain. A mounted investigation is hidden and paused while viewing the account page. Returning resumes the same investigation only if the owner has not changed; owner changes reset runtime state and return through the main menu. Settings and game pause retain the established Modal behavior.

The Account module owns transitions between guest, checking, unverified, loading, import, ready and error. It also owns the save synchronization seam, durable pending records, revisions, reset generations and cancellation of stale account operations. City progress retains access rules and tutorial retains finite coaching; both support owner activation/hydration. React remains a presentation adapter and the active renderer rule is unchanged.

PostgreSQL holds one server-only player record per authenticated user ID: name, minimal case snapshot, revision, generation and initialization flag. No code drafts, frame positions or tutorial steps are synced. Device sound/reduced-motion preferences remain local. Tutorial status is local to the owner and reset generation.

## Ownership and Reset

Legacy case/name/tutorial data becomes a guest save; original legacy keys remain recoverable backups. Guest imports require a choice and never overwrite existing cloud progress silently. The cloud record is authoritative when it already exists. Account-specific caches never become another user's fallback.

Every player call carries the expected account ID in X-Techcare-Account. The server compares it with the freshly verified session before accessing a row, but derives the SQL owner only from the session. This closes the cross-tab shared-cookie race: an old account's payload cannot be stored under a newly signed-in account with coincidentally equal counters.

Writes use atomic compare-and-swap on revision and generation. Same-generation conflicts merge only legal added milestones and retain the server's current area; different generations discard pre-Reset pending data. Normal writes cannot remove milestones. Reset atomically clears the case and increments both counters while preserving name and identity. Authenticated Reset requires connectivity; guest Reset stays local. GET responses older than the latest known revision/generation cannot roll local state backwards.

An account operation/session epoch prevents delayed sign-in, profile load, save, refresh or Reset results from hydrating a different owner. HMR teardown removes listeners and subscriptions. A pending/error indicator and real account recovery action stay available without covering the playfield.

## Locality, leverage and deletion test

The interface exposes account actions and an immutable snapshot, hiding provider details and save races in one module. Both local guest and real cloud adapters justify the seam. Tests have leverage across entry forms and world displays. Removing the UI does not remove owner rules or pending saves; removing the ownership module would spread those rules across forms, city, tutorial and renderers.

No generalized analytics/event framework is added. The earlier optional codebase-design/domain-modeling skills were unavailable; this records the direct source audit and accepted plan, not a claim that those workflows ran.

## Deployment and verification

The game's own development project is autumn-sun-45643343 in Singapore; branch br-patient-queen-b3lua8sj, database techcare. Auth and the fixed player-table migration are provisioned. Require-email-verification and verification-code mode are enabled. Server environment lives only in ignored .env.local; no secrets are committed or placed in VITE variables. Production requires its own environment/trusted origin and email-delivery setup.

Live origin diagnosis: allow_localhost did not authorize 127.0.0.1. A minimal sign-in with a nonexistent reserved-domain account reproduced 403 INVALID_ORIGIN. Adding exactly http://127.0.0.1:5180 to Neon's trusted origins changed that same request to 401 INVALID_EMAIL_OR_PASSWORD. Browser Origin and app CSRF checks remain unchanged. tools/check-auth-origin.mjs preserves this live diagnostic without creating an account.

Transport fixtures test actual SDK route/cookie behavior without asserting email delivery. Live OTP delivery and two-device play must be verified separately from unit/browser fixture results. The user chose to perform their real registration and OTP entry themselves.
