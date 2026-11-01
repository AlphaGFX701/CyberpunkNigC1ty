# ADR 0003 — Kin guides real actions

Status: accepted, 2026-11-01, user-approved Kin tutorial plan.

## Decision

One finite guided-tutorial module owns the authored dialogue, branches, expressions and ordered semantic acknowledgements. Presentation adapters read its prompt and call its small interface after real actions succeed. The module never writes case milestones, character positions or preferences. Branches change flavor and explanation length, then rejoin the same case.

The operator is the player at a support terminal; Kin remains the field protagonist. His friendly, light teasing voice is specific to coaching, while BLACKBOX and the missing partner remain serious. Existing cinematic reveal rules stay intact.

Manual camera input is locked separately from true session/modal pause. Finite demo and button intents acknowledge completed camera motion. A real pause suspends an unfinished demo; reduced motion snaps and acknowledges once. A WebGL list adapter rejoins the same tutorial after omitting camera practice.

Coach text is DOM-owned. Real modals host their own inline coach inside their one focus trap. The standalone coach is not a second modal. Typing reveals Thai graphemes and announces a full sentence once to assistive technology. Short talk sounds use the existing EntryAudio effects bus, cancellation and volumes.

## Locality and leverage

Keeping progression behind one module interface gives the toolbar, city, modal and 2D adapters the same permissions and event order. The deletion test favors this depth: removing the module would spread tutorial step checks and storage across each adapter. Separate DOM and world adapters justify the seam; tests exercise accepted events, not synthetic DOM clicks. No general dialogue engine or arbitrary cinematic command language is introduced.

## Storage and lifecycle

techcare.tutorial.v1 stores only version/status. In-progress reloads offer a voluntary restart of coaching; old case saves are opt-in. Completed/skipped guides do not reopen on return to the map. New Case resets tutorial metadata as well as the case, retaining officer and audio preferences. Replay retains all actual evidence. Hidden/paused game screens cancel typing and talk sounds. There is no automatic teleport or synthetic repair.

## Consequences

First-case teaching ends after an actual CAM-07 recovery and return to the city. It does not add seven unique puzzles, full bosses or an online chat system. Desktop keyboard remains the movement baseline; narrow screens retain readable dialogue and an exit from coaching.
