# Player presentation, shortcuts and scene music

Local desktop iteration, 2 November 2026. No commit, GitHub push, deployment or account/case migration.

## What changed

- Kin's gait follows actual post-collision displacement, not held keys. Collision/idle, diagonal facing, pause and blur use the same World owner in both field chapters. Scale stays fixed. Revised walk artwork adds a neutral standing pose and bent-knee passing poses while retaining Kin's face/outfit/scale; source-alpha foot pivots remove transparent bottom padding from the ground anchor. Idle clips no longer cycle walk poses. Exact sources, measurements and normalization are retained in art-source/chapter-one.
- DialogueSurface is shared by Arun, Kin, station witness, clues, field guidance, the opening story and Tutorial. In-game blocking reading uses the existing Modal focus owner and bottom placement; evidence remains sharp above the blurred world. The opening storyboard stays entirely sharp per the user's latest correction. Action coaching is compact and nonblocking.
- J toggles the case journal, M returns to the city map, H toggles field guidance. Physical KeyJ/KeyM/KeyH work with Thai and English layouts. Chords, composition, repeat and editable content do not invoke game commands. M cannot interrupt a dialogue, connection, repair or pause menu.
- EntryAudio remains the only music/SFX owner. Scene identities choose the six real local tracks; new field/hack songs begin at zero. See SCENE_MUSIC.md for file names and transport details.
- The first guide teaches an actual field M roundtrip after collecting both clues: return to the city map, select Arun's shop and travel back with all earned progress intact. It then teaches Circuit City selection, the first BODY puzzle/repair, snippet/Undo, check versus submit and Ctrl+Enter. First repair does not grant CAM-07 or station access. Older players can opt into the new guide without resetting the case; guideVersion2 records that choice independently.

## Regression evidence

The bug was reproduced in the actual Phaser World before changes: pressing D against a workbench left position538,550 unchanged while animation stayed kin-right and moving stayed true. `tests/browser/kin-motion.spec.ts` failed in both Arun and relay, then became the regression target for actual displacement, fixed scale, four directions, diagonal stability, idle, modal and blur.

`tests/kin-frames.test.ts` checks all sixteen measured foot edges against the real PNG. It does not claim to infer artistic gait quality; motion is additionally inspected in the browser clips.

Additional desktop checks cover dock geometry, long Thai text, one focus owner, sharp evidence, physical Thai-layout shortcuts, editor input, the full guided first repair, all music contexts and both existing chapters. Final results and evidence links are recorded in the delivery message.

### Final verification

- 118 unit/API tests passed; production build passed (941 modules). The existing large-chunk warning remains informational.
- Both complete chapter routes passed: witness, two traces, seven Puzzle/HTML repairs, final evidence and field return. Spatial fixtures move to later waypoints; lesson answers and interactions use the real UI.
- Both real World gait regressions passed using the final normalized sheet. Collision/state assertions use fixed simulation steps; the final section additionally records the real-time renderer in all four directions.
- Physical Thai/English J/M/H, editor guards, sharp storyboard at three desktop sizes, dialogue fit, actual field M roundtrip and first guided BODY repair passed.
- Seven additional desktop guide regressions passed, including legacy case opt-in, skip/replay/refresh/New Case, camera pause, Thai reveal and persistent speech/SFX mute. Two old test assumptions were updated to acknowledge the real departure story and the reading Modal's skip/replay path.
- Actual six-track MP3 transport checks passed: scene mapping, connection start, continuity through editor/journal/settings, mute, 400ms crossfade and one settled playing source. This is an explicit audio fixture, not a lesson-completion claim.

Artifacts: [sharp storyboard](evidence/dialogue/story-1440.png), [bottom dialogue](evidence/dialogue/arun-1280.png), [guided repair](evidence/kin-tutorial-terminal.png), [Kin at Arun](evidence/motion/kin-arun.webm), [Kin at relay](evidence/motion/kin-relay.webm), [guided play](evidence/kin-tutorial-real-flow.webm), [full Arun route](evidence/circuit/full-playthrough.webm), [full relay route](evidence/relay/field-route.webm).

## Source and extension points

- World owns actor animation and field input. `src/field/kin-frames.ts` describes the existing96x128 frame sheet; update its measured pivots if replacing the source image.
- `src/ui/DialogueSurface.tsx` owns presentation only. Modal owns blocking focus/inert, while chapter/story/Tutorial modules own their own reading and completion state.
- `src/game-commands.ts` is the common command interface for buttons and keys. Game progress still belongs to chapter/case modules.
- `src/entry/scene-tracks.ts` maps semantic contexts to files. Preloading never plays a second song. During crossfade there are at most two transport slots and after it one playing source.
- Camera input blocking and simulation pause are separate: controls stop under a conversation while practical background motion can continue. Explicit pause, hidden game and reduced motion retain their respective behavior.

## Files and preferences

Kin's existing male identity, face and green/amber outfit, story facts, account identity and case milestones are preserved. Newly supplied music is copied from Desktop into the runtime music folder with existing external-asset checksums; this does not grant a new redistribution license. No new AI dialogue API, voice recording or server storage was added.
