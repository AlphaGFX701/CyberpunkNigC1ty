# Account entry delivery — 2026-11-01

## Delivered behavior

Access gate → Hold E / click reader → two door leaves open → dedicated account page → main menu → story/game. Large left marketing copy/buttons are removed. Guest access remains a small footer action. Original ambient rain, two cyan tubes, amber light, reader beam and readable glitch animate the scene. Reduced motion/mute remain available. Motion preferences are recorded in DESIGN.md, UX-CONTRACT.md and the user's local AGENTS.md.

Neon Auth + PostgreSQL are provisioned in the game's own Singapore development project. OTP verification is required. Same-origin APIs, account-owned saves, guest migration/import, revision/generation Reset, account-switch guards and pending-save recovery are implemented. Exact development origin is trusted; the real Invalid origin failure was reproduced and resolved without relaxing app CSRF checks.

## Verification

- Production build and frontend/backend TypeScript checks pass.
- 64 Node tests pass, including ownership, Reset conflicts, delayed responses, account-cookie changes, real SDK transport/cookie behavior and retained game tests.
- 45 unique browser cases pass across the final relevant runs: 28 investigation/city/tutorial/UI-kit regressions, 9 menu/story/settings/audio regressions, and 8 final gate/account cases.
- npm audit reports zero vulnerabilities. Server database URL/cookie secret were not found in generated browser JS assets.
- Real unauthenticated API checks: configured true, get-session null, protected player401. The fixed real sign-in origin probe returns401 INVALID_EMAIL_OR_PASSWORD instead of403 INVALID_ORIGIN; an invalid-email signup returns400 VALIDATION_ERROR rather than origin rejection. No accounts or emails are created by those probes.
- The live database migration succeeded. The user chose to perform their own real registration/OTP entry. Automated mocked signup tests do not establish mailbox delivery or actual two-device persistence; those checks remain user-assisted.
- No new production Vercel deployment was made in this entry work.

## Review artifacts

- Motion recording: evidence/access-gate-door-opening.webm (6.88 seconds, 1280x720, no real signup submitted).
- Reader desktop/narrow: evidence/access-reader-final-1280.png and access-reader-final-390.png.
- Opening and dedicated Login: evidence/access-door-mid-open-1280.png and account-page-final-1280.png.
- Neon OTP configuration proof: evidence/neon-otp-enabled.png.
- Original project-owned generated art and prompts: art-source/access-gate.png, access-gate-open.png, access-gate-prompt.txt and access-gate-open-prompt.txt. Built-in image_gen produced both plates; runtime WebPs are under public/assets/entry/. No reference-game source or vendor promotional art was copied into these images.

Local run: npm run dev; open http://127.0.0.1:5180/. Setup and release instructions: NEON_SETUP.md. Current server credentials live only in ignored .env.local.
