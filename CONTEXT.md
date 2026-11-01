# TechCare — domain context

Authority: the latest user-approved BLACKBOX implementation plan in this chat. Narrative decisions below supersede the earlier small lab-theft opener, without changing the three-chapter HTML curriculum.

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
| Area progress | CAM-07 sample recovery opens relay intelligence; recording relay intelligence opens control intelligence. Intelligence is not a completed chapter or case ending. |
| Case progress | Versioned local quest milestones and current area only. Owner: src/city/progression.ts. Profile/settings remain separate. |
| Active renderer | React Three Fiber owns the city map; Phaser owns the 2D sample scenes. Only the active renderer is mounted. |
| Operator | Player supporting Kin through a terminal; not the missing partner or a replacement field protagonist. |
| Guided tutorial | Finite first-case coaching that advances only from real GUI/world acknowledgements. Owner: src/tutorial. Separate onboarding metadata cannot award evidence. |
| Learning evidence (planned) | Per-task observations distinguishing independent work, hints and answer reveal; not interchangeable with game completion points. Agreed in BEBETTER_SYSTEM_REVIEW.md; no implementation yet. |
| Review notebook (planned) | Optional post-mission or self-opened practice of missed skills using changed examples; not a daily check-in or a separate case-unlock requirement. |

| Account | Neon-authenticated identity with verified email OTP, separate from the local guest identity. Owner: src/account. |
| Save ownership | Account-specific cache and cloud revision/reset generation; only authenticated server session selects the PostgreSQL row. |

See docs/adr/0001-blackbox-narrative.md through 0004-account-save-ownership.md. BLACKBOX_UPDATE.md and CITY_MAP.md explain editing. The backend stores minimal case progress, not full campaign drafts or runtime positions. NEON_SETUP.md covers environment and deployment.
