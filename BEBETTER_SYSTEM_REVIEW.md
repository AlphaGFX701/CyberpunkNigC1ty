# BeBetter systems review — TechCare
Date: 2026-11-01 (Asia/Bangkok). Research and agreed direction only; no gameplay or account code changed.

## Decision record from this discussion

- Primary audience: beginning learners trying the game independently.
- After the account foundation, prioritize seven distinct recovery tasks, baseline/post assessment and a review notebook over teacher administration, ranks and daily quests.
- Game completion points remain attainable with hints/retries/answer reveal. Learning evidence distinguishes independent work, hints and revealed solutions. A new assessment item measures transfer; a revealed answer is not proof of independent understanding.
- Both baseline and post assessment must be completed before an episode is marked complete. No passing-score threshold was requested; do not invent one. A player can pause and resume rather than lose progress.
- Review is suggested after a mission or opened voluntarily, using a different item for the same skill. It does not interrupt the story or require a daily streak.
- Existing guest/email/cloud-save/Reset account decisions in AUTH_ENTRY_RESEARCH.md remain. This discussion does not select or provision a backend.
- The source-code reuse assumption remains unverified: no repository or application license was found in the supplied post, inspected public pages or targeted searches. Do not import/decompile the site's frontend as a substitute for permission.

## What was actually inspected

REA launched temporary Chrome profiles and navigated public pages; it clicked one public example answer. Cleanup reported terminated-owned-process in every capture. No account created, login submitted, payment attempted or email sent.

| Evidence | Scope / result |
| --- | --- |
| ev_e2c2e671ca7a4fd0a43b5615f9b6775022101fd639e19357234f2f174116a64f | Facebook share resolved to public Claude Thailand Community post by Ton Sittichoke. Text agrees with attached post. |
| ev_a6d7c0100c6818805cfa03d2ae470c91bff954d03d74a8947c805964aa2ad33e | Public BeBetter home: feature demos, menus and links. Hero results explicitly labelled examples. |
| ev_90904b3228ccd6e66a899eed373798b97b39405db8985b252d4b754368b8a6ef | /about-diagnostic: public example, topic breakdown and insufficient-data messaging. |
| ev_d05a5877874425dae810220d532a8437caac2ecb51446dd0026e170a794dc759 | Clicked observation answer in public diagnostic demo: immediate correct feedback and +10 EXP appeared. This is demo behavior, not evidence of account persistence. |
| ev_995db10853399ef69b3afd7a7a65231cd822dc53cb5c362a39b72f747b9b1943 | Practice route redirects to login; authenticated practice not tested. |
| ev_0c556a4b9190de36f5b72c8f97f6a4f0d22133889e5cce5023e85473e5f55264 | Learning-route redirects to login; personalized planning not tested. |
| ev_af8ca8a30f040023a9525def465d7757301ab46cca7fca35fd8415748e3e4bca | SciencePedia public catalog lists 13 rooms, two free; room runtime not tested. |

Author claims about user counts, paid-user percentage, schools, private dashboards, LINE delivery, paper scanning and cross-device reliability were not independently verified. Do not treat a public demo's sample percentages as measured efficacy.

Sources:
- https://www.facebook.com/groups/1745892855948687/posts/2388308898373743/
- https://bebetter.education/
- https://bebetter.education/about-diagnostic
- https://bebetter.education/sciencepedia
- Attached text: C:/Users/acer/.codex/attachments/9f579482-09d9-486c-8abd-220357708aca/Pasted text.txt

## Ranked adaptation

| Presented system | TechCare adaptation | Priority / tradeoff |
| --- | --- | --- |
| Baseline + granular results | Short beginner baseline and different post items by skill; show sample counts and insufficient evidence | Now with real tasks; assessment is not a validated mastery diagnosis |
| Learning route | Existing city destinations linked to curriculum and actual clues | Reuse current map; story access and learning recommendations remain distinct |
| Question bank | Seven authored image recovery tasks + variants: format, img, src, alt, dimensions, image link, integrated page | First content priority; review correctness before randomization |
| Mistake notebook | Casebook tab “แฟ้มฝึกซ่อม”: explain missed concept and offer a new example | High; do not simply repeat a memorized revealed answer |
| Interactive 3D labs | HTML/CSS lab: edit local code and observe safe real preview/DOM relationships | High teaching value; no need to add unrelated 3D rooms |
| Progress dashboard | End-of-episode briefing: task completion, independent/assisted attempts, baseline/post results and reflection | High after attempts exist; keep it off the live playfield |
| Same-account progress | Guest + verified account + ownership-safe cloud save + Reset | Existing account research; never store passwords in profiles |
| EXP / titles / coins | Small completion/improvement acknowledgements within the case | Later; prevent repeated clicks farming progress |
| Daily quests / leaderboard | Optional future practice, no speed grading or punitive streak | Defer until learners return voluntarily |
| Teacher classes / assignments / notes | Start with a learner report before a school platform | Later only if a teacher actually needs it |
| Paper tests / QR / camera grading | Little fit for code authoring | Defer; HTML syntax/structure is not an answer bubble |
| LINE / parents / organizations / paid plans | Separate education-business operations | Out of this milestone |
| Installable app / cross-device layout | Future PWA after touch controls and asset-cache/update design | Do not claim full mobile gameplay today |
| Thai / English EP | Thai explanations with correct unchanged HTML keywords; English optional | Later localization; preserve code validity |

## Source audit: learning is shallower than the scene presentation

- src/model.ts names seven recovery nodes.
- src/GameApp.tsx:30–119 owns a single sample Terminal used at those nodes and the boss sample.
- It accepts suspect.png plus alt length >=10; length cannot establish useful alt semantics. Feedback currently overstates what this condition proves.
- The sandboxed preview is a prepared evidence image conditional on src, not a full render of learner-authored HTML.
- No assessment, attempt history or skill-level review notebook currently exists.
- PLAN.md already describes the full first chapter as future work. The proposed work deepens that approved scope, not a new science platform.
- Sub-agent learning_system_fit independently reviewed code, project context, account research and these gaps.

## Architecture candidate: learning owner (Strong)

Before: Terminal presentation also owns sample answer, DOM checking, help flags, success feedback and direct case progression.
After: deepen one learning module that owns authored tasks, structural validation, feedback and learning evidence; React is the display adapter. Case progress retains its accepted ownership and consumes actual task success only.

Locality: correcting a task or its equivalent-answer fixtures stays near its learning objective.
Leverage: multiple display adapters and future reports consume the same reviewed result.
Seam: learner evidence versus case milestones, not a generic global event bus.
Deletion test: removing Terminal should not delete the lesson rules and attempt history. Moving each helper into a one-line module would merely move complexity, so avoid that.
No public method signatures or generalized analytics framework are proposed in this research pass.
Respect ADR0001–0003: story remains centralized, one active renderer, tutorial acknowledges real actions and awards no evidence.
Optional vocabulary dependencies codebase-design/domain-modeling were not found under the local skill roots; this report does not claim their full workflows ran.

## Proposed delivery slices (not yet implemented)

1. Finish the chosen identity/local ownership foundation and preserve guest entry.
2. Build one real task through validator → preview → feedback → attempt evidence → legitimate case progress.
3. Expand to seven reviewed tasks; include HTML introduction first. Keep beginner variants and allow equivalent valid syntax.
4. Add mandatory baseline and post completion, separate from game points. Use new equivalent items, not the same memorized answers. The brief original three-question checks can introduce the format but cannot support precise per-skill diagnosis.
5. Add review and end-of-episode report. Keep “not enough evidence” explicit; no mastery claims from an alt length test or a single correct answer.
6. Beginner playtest: can learners explain the tags and solve a changed example without reveal? Then decide whether to expand chapters, boss phases or teacher tools.

## Reuse readiness

No repository has been identified as the source of the live platform. A GitHub directory listing BeBetter is a catalog, not the application's source.
The observed CC BY 4.0 footer credit specifically points to BodyParts3D/DBCLS; it is not a license for the website, lessons, game art or account system.
If an author repository appears: verify ownership → LICENSE and per-asset licenses → actual feature coverage → stack compatibility → isolated integration experiment → security/behavior checks.
Until then, implement original TechCare behavior from the agreed educational ideas; do not copy protected questions, text, illustrations or private implementation.

