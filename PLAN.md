# Implementation record

## Authoritative scope

Use the user's latest explicitly pasted 3-chapter plan (camera, communication, network control), not the earlier discussed 5-chapter alternative. React owns text UI, React Three Fiber owns the city map, and Phaser owns the 2D missions. New project is separate from techcare-hacker-game.

## Hologram city map — implemented

User confirmed solid buildings with glowing edges, map/intelligence scope for the later districts, and minimal local quest/area persistence with New Case. Original 3D geometry supports full orbit, pan, zoom, animated selection and explicit travel. Grey locked districts have no destination actions. Normal CAM-07 sample recovery opens relay intelligence; recording it opens control intelligence. Scene selection and intelligence do not claim full chapters or a campaign ending. Details and source locations: CITY_MAP.md; ownership: ADR0002.

Follow-up direction: widen the city and give architecture/color a district identity, using the inspected KMUTNB map's compound masses and facade detail as a design reference. No campus geometry is imported. Color is visible in building materials and roofs, not only outlines. The locked districts retain a muted palette until accessible.

## Approved BLACKBOX narrative revision — implemented

Latest story authority is the user-approved BLACKBOX plan: stolen Arasaka emergency-command signing key, Kin's missing partner, withheld information, three required stations and an anonymous-to-alias reveal. Existing three HTML learning chapters remain the curriculum; camera/media/table tasks recover evidence, not control real infrastructure.

Shared owner: src/narrative/case.ts. New5beatopening/menu motion/dialogue frame and first-case consistency are implemented. Full21tasks/campaign save/ending are still later work.

## Milestone 1 — visual review, implemented

- Four navigable scenes, supplied four-direction male sprite, normal/tiny/boss-scale transitions.
- 3D destination-map travel, NPC dialogue, circuit path layout with seven markers, staged boss room.
- A clearly labeled sample src/alt puzzle, sandboxed evidence preview, hint and pink answer reveal.
- Keyboard, collision/path constraints, modal pause, music, narrow review layout.
- Unit/browser verification and reference screenshots in evidence.

This is the explicit user review gate from step 1. Request feedback on scene composition, map layout, and character proportions before production of all chapter content.

## Milestone 2 — complete first chapter, pending visual review

1. Introduction tutorial: HTML structure, editor controls, opening/closing tags and attributes. This is a beginner on-ramp, not the old 5-chapter curriculum.
2. Real witness/inventory progression and seven unique recovery tasks: image formats, img, src, alt, dimensions, image links, integrated image page.
3. Shared puzzle data for matching (drag or click pairs), fill-in, find-error, and code-edit tasks. Each carries learning objective, reference page, explanation, hint, answer, validator, and clue.
4. Replace sample validators with structure-aware validators and reviewed equivalent-answer fixtures. Keep scripts disabled and resource URLs local in previews.
5. Boss: three phases (find error, fill, code repair), 3 shields. Wrong answer explains and consumes one shield; empty shields retry current phase with shields restored. No typing timer or score penalty for retries/hints.
6. 7×10 + 3×10 score per chapter, separate pre/post assessment, versioned JSON save including chapter, completed tasks, puzzle drafts, evidence, boss phase, shields, and position. Validate saves; offer a fresh start without overwriting recoverable corrupt input.
7. Distinct music/SFX controls and reliable gesture-start audio. Finish by returning outside with image clue and an explicitly unlocked next destination.

## Milestones 3–4 — playtest and expansion

- Playtest beginner clarity, route readability, instructions, equivalent code, stuck states, failure/retry and save/reload before expanding.
- Chapter 2: audio, source, controls, loop, video, video source, integrated media evidence.
- Chapter 3: table, tr, th/td, caption, colspan/rowspan, charset/head metadata, viewport. Final NULL encounter connects time and place clues.
- Complete journal connections, pre/post assessment and reflection. SVG/canvas optional; no SQL or real network exploitation.
- Check code examples against current HTML; do not copy the PDF's duplicate src attributes, deprecated presentation attributes, or zoom restrictions.
- Confirm asset licenses before public distribution, then deploy as a separate Vercel project. Do not publish raw Neon District files or overwrite the original game URL.

## Learning-system priorities — agreed 2026-11-01, not implemented

The BeBetter review prioritizes independent beginners and a complete learning loop after the account foundation: seven distinct tasks, baseline/post assessment, review notebook and a short episode report. Both assessments must be completed before the episode is marked complete; no minimum passing-score gate was requested. Game completion points remain separate from learning evidence, which distinguishes independent work, hints and answer reveal. Review is offered after a mission or opened voluntarily, using changed examples of the same skill. Teacher administration, daily quests, ranks, LINE and school/paid-platform operations are deferred. Details, source limitations and reuse readiness: BEBETTER_SYSTEM_REVIEW.md. No BeBetter source repository or application license has been verified.

## Neon entry and cross-device saves — implemented 2026-11-01

Replaces the earlier Firebase recommendation. Neon Auth OTP/account forms, guest fallback, E-hold entry, Bangkok clock, title motion, account-owned local caches, verified-session player endpoints and atomic revision/generation Reset are implemented. Own Singapore development project and player-table migration are provisioned; verification-code mode and required verification are enabled. Account/profile initialization gates Play, and cross-tab account changes cannot apply an old user's payload to a new session. Secrets remain in ignored server environment. User is performing real signup/OTP delivery verification; automated fixture results must not be described as real mailbox or multi-device proof. No production deployment or learning-content expansion is included in this entry milestone. See ADR0004 and NEON_SETUP.md.

## Delivery acceptance (current)

Whole-loop tests must cover free walking, path walking, collisions, modal pause and focus, scale changes, scene repair visuals, all puzzle types, keyboard alternatives, answer reveal, boss shields/retry, versioned saves, audio channels, assessment separation, end-of-case and production build.
