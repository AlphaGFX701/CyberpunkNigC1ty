# ADR 0001 — One narrative owner for BLACKBOX

Status: accepted through the user-approved implementation plan.

## Context

Case facts were duplicated in the opening, title, first objective, mission briefing, witness, casebook and world labels. Updating only the opener would retain the previous claim that TechCare owned BLACKBOX and make the camera appear to be the whole case.

## Decision

Use one case narrative module with a small display interface. It owns equipment/employer facts, unconfirmed relationship, public speaker labels, compositions and cue timing, and consistent field copy. Cinematic and field-display adapters read it; the module does not own Phaser movement, storage or audio playback.

The module has depth because it keeps reveal rules and narrative consistency behind the interface. The seam is between the case and its presentation adapters. Changes stay local to the case, giving tests leverage across multiple displays. Deleting the module would scatter the same decisions again rather than remove complexity.

The shot description declares finite layers and cue delays; no general-purpose cinematic editor or runtime skin switcher is introduced. Existing audio, modal focus and game state modules retain their tested behavior.

## Consequences and checks

- NULL's alias is displayed only in shot5. No opener text confirms the real identity.
- Arasaka owns BLACKBOX. Camera recovery is the first clue and remains an HTML exercise.
- Shot4is an incoming witness file, maintaining chronology before the map travel.
- Node narrative tests cover facts/reveal structure; browser tests cover rendered dialogue, casebook, first objective and unchanged play flow.

The optional codebase-design skill dependency was not installed. This decision records the direct code survey and approved implementation; it does not claim that dependency's full workflow ran.
