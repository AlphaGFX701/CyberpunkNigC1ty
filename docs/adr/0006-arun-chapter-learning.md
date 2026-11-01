# ADR 0006 — The Arun investigation and beginner HTML chapter

Status: accepted, 1 November 2026; implements the user's local-only shop remake request.

## Decision

The chapter module in `src/chapter/model.ts` owns the actual witness/clue/lesson gates and local learning observations behind one interface. Two world adapters consume it: Phaser renders the authored courtyard and device circuit; React renders dialogue, connection, exercises and the current objective. Neither renderer grants case evidence. The final successful image exercise alone calls the existing city recovery interface.

The first chapter replaces the seven repeated image demonstrations with seven distinct beginner exercises (Home/Introduction, Editors, Basic, Elements, Attributes, Headings, Paragraphs). The two courtyard traces are collected through interaction and cannot be granted before speaking to Arun. The separate CAM-07 image exercise follows all seven tasks. It repairs a simulated evidence page, not a real external system.

The existing guided tutorial still teaches the city controls, walking and witness interaction. A completed Arun conversation explicitly hands field guidance to the chapter. Dismissing it early returns to witness interaction. This updates ADR 0003's old first-image demonstration path; it never completes a lesson or grants a city milestone automatically.

## Locality and leverage

The old seven world nodes shared one image question and immediate city unlock. The chapter now concentrates ordering, assistance observations, correctness and scoring. The deletion test favors this depth: removing it would spread the same rules across the world, HUD and editors. Tests exercise the same interface used by those real adapters.

`ChapterWorld.ts` owns disposable scene composition and authored environmental motion. The revised layout's furniture/chip footprints, interaction points and waypoint markers share coordinates with movement. The recorder is a freely walkable room around visible raised chips; the former single-width circuit corridor is gone. React remains responsible for Thai text and keyboard-focus modals.

EntryAudio remains the one music/effects owner. Both typing dialogue and full-line dialogue adapters call its bounded talk interface. Short effects are canceled on line changes, close, pause and scene exit. Reduced motion may show text instantly without silencing the separate talk preference.

## Persistence and scope

Chapter detail is local-only and keyed by the existing account owner and reset generation, exposed read-only by the account module. It does not expand cloud schemas or save an editor draft. The existing final city milestone still syncs through the existing account mechanism. A reset selects a new generation; another account cannot inherit the prior local chapter. Game points and assistance observations are distinct; hints/reveals do not deduct completion points.

No publishing or mobile testing is included. Vendor assets remain excluded from public Git; unused paid packs are references, not claimed imports.
