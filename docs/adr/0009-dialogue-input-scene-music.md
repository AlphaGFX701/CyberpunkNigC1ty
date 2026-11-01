# ADR 0009 — Shared dialogue presentation, game commands and semantic music contexts

Status: accepted, 2 November 2026. Local desktop iteration.

## Decision

DialogueSurface is a presentation module for speaker/portrait/text/actions and compact action coaching. It does not own a chapter step, case evidence, story choreography, typewriter timing or audio transport. Modal retains the sole blocking focus/inert interface. Field/story owners supply dialogue; task coaching is deliberately nonblocking so required controls remain usable. Evidence has a separate sharp region above the dock. The user's final visual correction keeps storyboard event artwork sharp at all times; world blur applies only to in-game blocking conversation.

The game-command interface maps physical keyboard codes and visible buttons to journal/map/hint actions. It applies tutorial gates and editable/chord guards in one seam. Map navigation cannot bypass a live repair/connection/dialogue or award completion. Closing a journal through J uses the same acknowledgement path as its close button.

EntryAudio/SceneMusic remain deep modules. A scene-track resolver adapter identifies entry, opening story, city, Arun, relay or hack without creating audio objects inside fields or overlays. Connection-running is an explicit transient fact; merely opening the connection window does not select hack music. The bounded two-slot transport owns source tokens, preload, mute, crossfade and retry.

Gait is still owned by the shared Phaser World. The new regression exercises the real call site: zero displacement due to collision must not animate walking. Source-image foot pivots are measured data, not a new sprite engine. Camera input locks remain separate from simulation pause so a blurred reading scene retains authored environmental motion.

## Compatibility

No account/case contract change is needed. Existing case progress remains version2. Tutorial status remains independently scoped by owner/reset generation; guideVersion2 adds an optional invitation for old completed/skipped guides. Starting, dismissing or replaying the guide cannot fabricate HTML completion or evidence.

## Validation

Actual-browser tests cover field collision/idle/facing/blur, Thai key layouts and editable guards, bottom dock dimensions, focus and text fit, real first Puzzle/BODY repair, scene music and both playable chapters. Unit/API tests remain regression coverage for old saves, owner changes and Reset. No mobile, public deployment, real OTP or database mutation is part of this iteration.
