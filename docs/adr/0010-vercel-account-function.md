# ADR0010 — One bundled account Function

Accepted 2 November 2026 for the two-chapter release.

## Evidence

The first public deployment served the frontend but `/api/account-config` returned500. Its runtime log showed `ERR_MODULE_NOT_FOUND` for `/var/task/server/node.ts` imported by the compiled catch-all entry. `/api/auth/get-session` returned404. Typechecking with noEmit did not produce a shippable server artifact.

## Decision

Keep the account/session/save modules and their public URL interface. Bundle the relative backend graph with esbuild for Node24 into the sole generated `api/index.mjs` Function, keeping package imports external for Vercel's dependency tracing. Generate before staging/upload and during production builds. The generated file is not committed, but its build tool and TypeScript sources are.

An explicit `/api/:path*` rewrite reaches that entry. The Vercel adapter restores the application path and strips its internal routing parameter; the existing Node adapter retains body bounds, method, query, Origin and separate Set-Cookie headers. Auth route allowlisting, verified session ownership and reset generation remain with their existing owners. No wildcard trusted origins or authentication bypass is introduced.

This adapter gives locality to platform routing without changing the account module's depth. The bundled artifact itself is an interface test surface: import it and make real HTTP requests before release. The deletion test favors keeping the adapter small; moving authentication policy into it would duplicate the existing application rules.

## Verification

120 unit/API tests and the production build passed. Two new tests import the generated Function and exercise nested routing/body/query/Origin/cookies. The fresh Vercel deployment returns account-config200/configuredtrue, session200/null and player401 when unsigned. Its bounded nonexistent-account sign-in returns401/INVALID_EMAIL_OR_PASSWORD, demonstrating provider Origin acceptance without creating an account. Real credentials/OTP and signed-in save persistence require the user's own browser test; do not claim those from the bounded probe.

## Deployment compatibility

Use the existing God_like project and Neon branch, no database reset or account migration. Public Git excludes external runtime assets; staging includes them under the existing workflow. Keep Git auto-deploy disabled and test the deployment URL before promoting the stable public alias.
