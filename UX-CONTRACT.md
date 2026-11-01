# UX contract

## Current entrance motion requirement

- Access gate is a scene, not a marketing menu: no large left paragraph/CTA block or guest button. The reader's E prompt and clickable reader open the account page, where guest access remains available. Kin leans at the left wall using his phone, with localized hand movement and cyan screen light; his artwork must never intercept input.
- Animate the environment itself: tube lighting, reader light and scene response. This entrance has no animated rain; four practical lights use visible localized dimming and bloom. Buttons have hover/focus/pressed motion. IDENTITY READER / HOLD E / OPEN TERMINAL / E include brief readable glitch/flicker with stable accessible labels.
- A completed hold opens physical door leaves before the full account page appears; release before completion cancels. Click/touch the reader is an equivalent route. One activation starts one cancellable door transition.
- Reduced motion keeps practical lights static, disables decorative glitch/flicker, and snaps the doorway transition. Login remains a separate opaque page; game input is paused and the game is hidden while it is open.

User-approved scope is the latest pasted 3-chapter plan. This delivery is milestone 1: interactive art direction for review before full gameplay production.

| Capability | Canonical owner                   | Source of truth                              | Allowed variants                     | Verification                                   |
| ---------- | --------------------------------- | -------------------------------------------- | ------------------------------------ | ---------------------------------------------- |
| Form       | Terminal in src/GameApp.tsx       | HTML DOM parse and explicit task constraints | normal / boss preview                | browser tests, equivalent syntax, wrong answer |
| Scrollbar  | src/style.css :root               | DESIGN.md                                    | document / modal                     | narrow viewport test                           |
| Toast      | store.toast and App status region | model.ts                                     | navigation hint                      | browser state checks                           |
| Dialog     | shared Modal in src/ui/Modal.tsx  | DESIGN.md                                    | brief / witness / journal / terminal | focus, Escape, paused movement                 |
| Navigation | changeView + scene nav            | model.ts                                     | map / street / device / boss         | repeated selection and transitions             |

| Pixel UI | src/ui/PixelUI.tsx | generated manifest and UI_KIT.md | button / panel / bar / slot / keycap | atlas equality, keyboard states and browser tests |

## Interaction and state

- Phaser renders and forwards input. model.ts owns positions, collisions, path constraints, and preview progression.
- Modal state pauses movement and disables Phaser keyboard capture so textarea arrows remain usable.
- Keyboard: WASD/arrows move, E interacts, J opens casebook, Escape closes dialogs. Buttons provide alternatives for scene navigation and nearby interaction.
- The city is an orbitable 3D destination map. Inspecting a pin never changes location; explicit entry does. Locked districts have no pins or list actions. Free 2D movement remains in investigation; digital movement is constrained to circuit corridors. Boss preview is staged rather than freely navigable.
- All 7 circuit markers open the same clearly labeled sample task; unique tasks remain later work. Successful normal CAM-07 repair opens relay intelligence. Recording relay intelligence opens control intelligence. Boss-preview success does not unlock areas. Neither intelligence record completes the campaign.
- The sample validator accepts equivalent quoting/spacing and any descriptive alt meeting the initial prototype criterion. Semantic scoring of descriptions needs author review before curricular release.
- The preview iframe never receives executable user markup. It renders only a safe generated evidence card, with sandbox and restrictive CSP. All file targets resolve locally.
- EntryAudio in src/entry/audio.ts owns a single hidden music transport and a separate cancellable WebAudio effects bus. No audio plays before a user gesture. Music and SFX levels persist independently; zero mutes. Closing screens cancels pending test effects.
- Case progress persists only legal milestones and current area under version1 techcare.case.v1. No drafts, positions, shields or full campaign save; no deployment change. Malformed/denied storage gives a warning and safe in-memory play. New Case clears case progress only.
- The UI work adds ?ui=1 as a separate gallery route. PNG/SVG export and ZIP downloads contain only the original TechCare UI artwork; the reference pack and supplied character/city assets are not part of that ZIP.
- The Login menu is a local officer file, not an online account. No backend, real Metasploit connection, or real target scanning exists.

## Asset handling

The user's local archive directory is the source of truth. Raw source archives remain local under art-source (gitignored). Neo Zero and Cyberpunk City sheets have no embedded license in the supplied zip; public release/distribution requires confirming their original license. Neon District is inspected but not used in this milestone because of inconsistent frame metadata and its raw redistribution restriction.

## Entry and storyboard contract

- Initial route opens title. Story finish/skip opens the 3D city. The active-renderer host mounts either React Three Fiber for the map or Phaser for a 2D mission; it disposes the inactive renderer and keyboard capture.
- Play starts the five-shot opening; manual next/back and skip lead to the existing map on first entry. Replay preserves existing in-tab scene and positions.
- Escape/menu pauses mission input and city orbit/travel. Settings opened from pause returns to pause. Exit returns to title and silences transport; Resume restores the retained session. Reload preserves only quest/area milestones, profile and settings. New Case asks for confirmation, resets case progress, then replays the opening.
- Name/settings use version1 of techcare.entry.v1 in localStorage, with safe defaults and in-memory fallback when denied/malformed. Name is an officer-file label; canonical hero remains Kin.
- Full-window layout is default; Fullscreen is an optional native browser action. Denial is explained without blocking play. Exit on title shows how to close the tab; it never pretends the browser can forcibly close a user-opened tab.
- StoryPlayer reads the opening from src/narrative/case.ts through the compatibility story export; PNG layers and CSS motion are independent from Phaser. Thai text is DOM. Art failure offers retry and leaves navigation available. OS reduced motion and the explicit preference disable nonessential animation.
- Source-of-truth decisions: latest user-approved entry/story plan in this chat. Entry and story regression evidence: tests/browser/entry.spec.ts and entry-regressions.spec.ts.

## BLACKBOX case and reveal rules

- Source: user-approved BLACKBOX implementation plan. Arasaka owns the emergency-command signing key. TechCare is Kin's unit and recovery contractor. CAM-07 is evidence, not the stolen artifact.
- The first four shots never display NULL or confirm the thief's real identity. The fifth discloses an alias only. The missing partner remains an unresolved lead.
- Shot4isArun's incomingfile/message before departure, so returning to the existing case map does not rewind physical travel.
- Narrative facts, five shot compositions/cue timing, field objectives, briefing, witness and casebook share caseNarrative. Internal actor ids are separate from displayed labels.
- CSS motion and a decorative cursor do not change button hit boxes. Touch/coarse/reduced-motion keeps native pointing; text inputs keep I-beam. Menu feedback is identical for pointer hover and keyboard focus.
- Story cues may be delayed. Skip/back/next/replay cancels both future timers and active audio. No voice, no per-character typing sounds.
- Actual free-demo PNGs are used through VendorAssets; full-kit dialog artwork is not included. In-game credit link is reachable in the pause drawer and participates in the focus trap.
- Verification: tests/narrative.test.ts and tests/browser/blackbox.spec.ts plus retained entry/game regressions.

## Guided first case

- src/tutorial owns the finite ordered flow and authored responses; adapters acknowledge real camera, toolbar, modal, movement and recovery actions. No fake clicks, teleport or evidence grants.
- Manual camera lock is separate from pause. Scripted motion acknowledges actual completion; pause suspends it and reduced motion snaps once. WebGL fallback omits only camera practice.
- Coaching uses Thai grapheme typing, full-line assistive announcements, canonical Kin expression frames and one existing SFX transport. Advance/reveal/skip/hide cancels pending talk sounds.
- The dock reserves city viewing space, collapses during walking, and becomes inline inside the real journal/menu/terminal. It never adds a second modal focus trap or intercepts code-editor Enter.
- techcare.tutorial.v1 persists only status. Fresh first case starts automatically; old case/in-progress reload offers are voluntary; skip/completion persist. New Case rearms teaching, replay preserves evidence. All views provide a route to skip or pause.
