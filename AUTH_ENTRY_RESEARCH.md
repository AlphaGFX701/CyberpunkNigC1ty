# Entry/account research — 2026-11-01

Superseded implementation decision: the user selected Neon Auth + PostgreSQL with email OTP after the reference game's public SDK was positively identified. The account implementation and its own development database are now present; see ADR0004 and NEON_SETUP.md. The Firebase recommendation below is historical research, not the current implementation.

User decisions: cloud identity + quest/area progress; optional guest play; Reset for testing; no existing Firebase project. Provider recommendation: Firebase Authentication + Firestore for the requested verified email/password flow. Supabase is viable but its default SMTP restricts recipients to project team members and requires custom SMTP for general users; it is not a simpler email-delivery setup for this use.

## Observed reference

REA controlled browser visit of https://python-dungeon-live.vercel.app/#login observed login and register tabs, show-password, forgot-password, in-game nickname, privacy copy and advertised cross-device saves. We clicked only the registration tab; no account was created, no form submitted and no email sent. Provider-owned browser cleanup confirmed.

Evidence: ev_daf96ab6de58b9bd3df3061cb9cc7ebd156073e9354e4f4131faa6e2bea7bb74 (login), ev_854e2590df5b517761ecfae1a6c7b760a10e9b24db4ce611963a859b12cd84ed (register).

DOM references Chakra Petch and Press Start2P. Public learners.js exposes API paths /api/auth/get-session, /api/player and /api/ranking, plus a CloudSaveQueue import and conflict/import handling function names. This is static public frontend evidence; the actual auth provider, database implementation, delivery and cross-device behavior were not authenticated or independently verified. No friend source or artwork is imported into TechCare.

Correct reference URL: https://rastalr.itch.io/godot-4-interaction-toolkit (user link omitted finalt). Author documents hold progress/cancellation/focus/pause concepts in Godot; React must implement its own equivalent interaction and not import the Godot add-on as a browser auth system.

## Current project

No Auth SDK/Firebase project config found. LOGIN currently saves a local officer label only. Global browser keys case/tutorial/prefs must be separated by account ownership before multiple accounts can safely share a device. Case03:12 timestamps are narrative; the new menu clock should separately show live Asia/Bangkok time.

Existing rain, beacon and clipped Kin motion can be extended. BLACKBOX19bars are static and need authored CSS animation. Hold-to-open only opens authentication UI; it never claims successful authentication before a real session/verification/profile result.

## Proposed behavior

Hold E1.2s with progress, quiet connection sound and release/blur cancellation; click/touch/keyboard alternative. Form: login/register, nickname/email/password/confirm, show-password, reset-password. Verification return refreshes session state, then profile/cloud save must load before account play. Guest stays local and never silently inherits a different account's data.

Reset affects case/tutorial progress only, preserving the account/name/settings; authenticated Reset applies to cloud and local cache. Save generation/revision must reject stale writes from tabs/devices predating Reset. Guest import is explicit when appropriate; no silent overwrite of an existing cloud case. Only milestones/current area are synced, not per-frame positions or editor drafts.

## Primary documentation

- https://firebase.google.com/docs/auth/web/password-auth
- https://firebase.google.com/docs/auth/web/manage-users
- https://firebase.google.com/docs/firestore/security/rules-conditions
- https://firebase.google.com/docs/rules/rules-and-auth
- https://supabase.com/docs/guides/auth/quickstarts/react
- https://supabase.com/docs/guides/auth/auth-smtp
- https://rastalr.itch.io/godot-4-interaction-toolkit

Research/planning only. No account system, cloud project or remote database has been created in this pass.
