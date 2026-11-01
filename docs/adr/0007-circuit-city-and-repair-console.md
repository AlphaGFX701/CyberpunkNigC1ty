# ADR 0007 — Circuit City and the HTML repair console

Status: accepted, 1 November 2026. Local desktop iteration only.

## Decision

`device` now mounts Circuit City, an original React Three Fiber stage-selection map, rather than a walking Phaser scene. The 2D shop and boss remain Phaser. GameApp mounts exactly one active renderer. This supersedes ADR 0006's device movement presentation, preserving its learning and save ownership rules.

The map-camera module owns focus, fit, orbit, zoom, reset, pause and tutorial acknowledgements behind one coordinate-based interface. The East Bank city and Circuit City are two real adapters. Neither map owns progression. Sharing this module improves locality of camera fixes without creating a generic mission framework.

The chapter module owns seven deterministic card puzzles followed by seven code repairs, then the separate final image exercise at the central camera tower. `submitPuzzle` validates slot-to-option assignments; `checkTask` is read-only; `submitTask` awards progress only after the relevant puzzle. Clicking or focusing an object cannot award evidence. The final successful `submitImage` alone records the existing city milestone. Physical CAM-07 in the shop becomes an evidence viewer after this success and cannot bypass the tower.

Chapter snapshot v2 adds `puzzleCompleted`. The existing owner/generation-scoped storage key is retained and v1 JSON migrates lazily. Previously completed repairs count as puzzle-complete; unfinished repairs do not. Existing evidence, assistance observations, game score, account boundaries and reset generation survive. Draft code remains runtime state.

## Repair interface

The original CodeMirror HTML adapter owns editor lifecycle, caret snippets, Undo, syntax and source diagnostics. The repair interface owns its task/Puzzle flow, current draft, check-versus-commit actions and sandbox preview. RuneCode was inspected only as a reference for typing UI behavior. Its game code, combat rules, hints, persistence and artwork were not copied.

Parser diagnostics provide source line numbers only when established by a parser token offset. Semantic feedback without an exact source location omits the line. Snippet insertion and source highlighting do not replace the user's whole document or take focus automatically.

## Visual ownership

The city model is original code-authored low-poly geometry, exported as GLB using the same builder. Runtime scene motion animates fans, data signals and lights; reduced motion freezes decoration. Viewport fitting uses the actual main grid row instead of subtracting an assumed toolbar height. Account sync status is available through the pause/account surface rather than a fixed playfield badge.

No cloud schema, new account system, publication or mobile testing is included.
