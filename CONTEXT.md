# TechCare — domain context

Authority: the latest user-approved BLACKBOX implementation plan in this chat. Narrative decisions below supersede the earlier small lab-theft opener, without changing the three-chapter HTML curriculum.

Current iteration rule (2 November 2026, latest request): the user has now authorized publishing the current two-chapter game and final-chapter design document to the existing GitHub repository and Vercel project, including fixing and checking online Login. This supersedes the earlier local-only publication restriction. The final chapter itself is a future implementation, not part of the current playable release. Desktop remains the target; no mobile playtests. Music: Concrete Tears for entry/account/title(cue3s), Rain Over Glass Monoliths for the opening story, Midnight Protocol for the city, Midnight at the Terminal for Arun, Terminal Watch for relay, and The Glass Key from running connection through Circuit City/repairs. The old theme.wav is removed.

| Term                | Meaning                                                                                                                                |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| BLACKBOX            | Arasaka-owned command-signing key for the national emergency communication network; requires three important stations before full use. |
| Arasaka / อาราซาก้า | Equipment owner and Kin's employer for this job; withholds information, but is not confirmed as the ultimate villain.                  |
| Kin / คิน           | TechCare field recovery officer investigating his missing partner. Serious about the case, friendly and lightly teasing when coaching the operator. |
| Missing partner     | An unresolved personal lead. Similar wording/unit evidence makes Kin suspicious; the opener does not confirm identity.                 |
| Intruder            | Internal speaker id. The display label may become NULL only in shot5.                                                                  |
| CAM-07              | Recorder at Arun's repair shop; first evidence source along the BLACKBOX route, not the stolen national asset.                         |
| Recovery task       | A local HTML learning exercise repairing an evidence page; not real exploitation of emergency infrastructure.                          |
| Case narrative      | Shared case facts, reveal stages, five compositions, cues, field objectives, witness and journal. Owner: src/narrative/case.ts.        |

| City map | Original solid-building 3D East Bank model. Selection inspects a place; explicit travel changes Kin's current area. |
| Area progress | CAM-07 recovery opens the playable relay station; actual recover-relay evidence opens control intelligence. Historical read flags cannot bypass the station. Control intelligence is not a case ending. |
| Case progress | Case v2 quest milestones and current area, with v1 history migration. Owner: src/city/progression.ts. Profile/settings remain separate. |
| Active renderer | React Three Fiber owns East Bank and the device Circuit City; Phaser owns the 2D shop/boss scenes. Only the active renderer is mounted. |
| Operator | Player supporting Kin through a terminal; not the missing partner or a replacement field protagonist. |
| Guided tutorial | Finite first-case coaching that advances only from real GUI/world acknowledgements. Owner: src/tutorial. Separate onboarding metadata cannot award evidence. |
| Learning evidence | Local per-exercise attempts, hint and answer-reveal observations in the first chapter; separate from completion points. Full pre/post measurement remains planned. |
| Review notebook (planned) | Optional post-mission or self-opened practice of missed skills using changed examples; not a daily check-in or a separate case-unlock requirement. |

| Account | Neon-authenticated identity with verified email OTP, separate from the local guest identity. Owner: src/account. |
| Save ownership | Account-specific cache and cloud revision/reset generation; only authenticated server session selects the PostgreSQL row. |

| Arun chapter | First playable investigation: complete witness dialogue, collect two physical traces, repair seven distinct beginner HTML tasks, then recover the CAM-07 suspect image. Owner: src/chapter. |
| Chapter progress | Owner/reset-generation-scoped local learning detail; only final CAM-07 city evidence uses the existing cloud case mechanism. Editor drafts and detailed learning observations are not synced. |
| Circuit City | Original low-poly PCB stage map inside the device: seven sequential Puzzle/HTML sectors, then the central camera tower. Selecting inspects; starting opens the repair interface. |
| Repair Puzzle | Deterministic card-to-slot task before each of the first seven HTML repairs. Passing supplies a partial scaffold but awards no game points. Snapshot v2 preserves existing completed v1 repairs. |

Current chapter request supersedes the earlier image-only seven-node curriculum for episode one. Topics now begin at HTML Home/Introduction and end at Paragraphs, with the image exercise as the final evidence gate. Future audio/video/table chapters are not expanded here. This chapter was developed locally; the latest publication authorization above now applies to its release. Keep authored scene motion (neon, machinery, parallax) and hover/focus/pressed feedback, with mute and reduced-motion support, as the user's standing game preference.

See docs/adr/0001-blackbox-narrative.md through 0004-account-save-ownership.md. BLACKBOX_UPDATE.md and CITY_MAP.md explain editing. The backend stores minimal case progress, not full campaign drafts or runtime positions. NEON_SETUP.md covers environment and deployment.

## Relay chapter — 2 November 2026

The playable second episode supersedes the relay intelligence-only placeholder and the older planned audio/video chapter. Curriculum continues HTML links, relative paths, fragments, lists and semantic sections. RELAY-02 uses seven distinct Puzzle/HTML sectors plus the original-record tower. The chapter's field scene matches Arun's 2.5D family, with its own technician, U-shaped circulation, two traces, antenna motion and source-aligned art layers.

| Relay chapter | Station witness → workorder/module → RELAY-02 → seven repairs → original record. Owner: src/relay. |
| Active chapter | arun or relay, separate from presentation view; entering/returning cannot silently change chapter. |
| Recovered relay evidence | BLACKBOX-17 received03:16, connected03:18, forwarded03:21 to control; the employer's copy omits the forwarding entry. |
| Historical intel | read-relay/read-control from the old prototype; kept for compatibility, never treated as solved station puzzles. |
| Case v2 | Adds recover-relay, which is now required for control access. Accepts/normalizes v1 without deleting historical facts. |
| Fixture preview | Chapter-owned safe document mapping; actual local-document/fragment navigation in a scriptless sandbox. |

Full station learning detail stays local by owner/reset generation; only the final case milestone syncs. Cloud evidence can be read without inventing local completed tasks. See RELAY_CHAPTER.md and ADR0008 for that iteration's decisions. Its former local-only publication restriction has been superseded by the latest two-chapter release authorization above.

## Final chapter design discussion — pending

The original CONTROL-03 prompt is preserved in docs/design/CONTROL03_PROMPT_DRAFT.md. The consolidated ready-to-copy prompt is finalized in docs/design/CONTROL03_FINAL_PROMPT.md: seven HTML/CSS lessons and the selected three-round Counterhack boss on a 3×4 rotation board. NULL hacks Kin; the player fixes code, routes a counter-signal and triggers Kin's actual attack. A failed route retains passed code. The cancelled dodge/dash/shield-versus-bridge/giant-avatar design is historical only. Final-chapter runtime, CSS-capable repair/preview, control save adapters and assessment remain future work; saving/finalizing the prompt does not implement them or resolve NULL's identity. The current authorized publication includes the two playable chapters plus this document, not a playable final chapter.

## Player presentation update (implemented)

Kin gait follows post-collision movement with fixed scale and alpha-measured foot anchors. DialogueSurface is shared presentation for all speakers; Modal alone owns blocking focus. In-game conversation docks at the bottom with blurred scene and sharp evidence; storyboard event artwork stays sharp per the user's final correction. Action coaching stays compact/nonblocking. Game commands J/M/H use physical codes with editable/chord guards. GuideVersion2 teaches the actual first Circuit/Puzzle/BODY flow, no longer the obsolete walking-device/image demo; old players get an optional invitation. Camera input blocking is distinct from explicit scene pause. See PLAYER_PRESENTATION.md, SCENE_MUSIC.md and ADR0009.
