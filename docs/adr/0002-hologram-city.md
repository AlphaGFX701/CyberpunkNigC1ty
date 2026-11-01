# ADR 0002 — 3D city map and case progress

Status: accepted, 2026-11-01.

## Decision

The city map is an original solid-building 3D model with district color palettes and selective emissive edges, composed in React Three Fiber. Follow-up user direction expands its footprint and compound architectural vocabulary, informed by a REA observation of the public KMUTNB map. Existing investigation, device and boss samples remain Phaser scenes. GameApp mounts CityMap or MissionCanvas, never both. World releases keyboard capture when leaving a mission. Each renderer owns its own camera and teardown.

City selection is inspection, not travel. An explicit enter action commits arrival and opens either Arun's 2D investigation, the base briefing, or area intelligence. All selection and arrival paths use the same progression rule.

The progression module owns a versioned, immutable snapshot, access checks, legal milestones, local storage validation and reset. Its interface hides storage details from both renderers. Only successful normal CAM-07 repair records recovery; boss preview does not unlock areas. Reading relay intelligence opens control intelligence. Neither intelligence record completes a chapter or activates BLACKBOX.

Persist only completed milestones and current area under techcare.case.v1. Positions, code drafts, shields and runtime dialogs remain transient. Reset clears only case progress; techcare.entry.v1 profile/settings are retained. Denied or malformed storage falls back safely with a visible warning.

## Reason

Duplicating unlock checks between pins, lists and scene navigation would allow bypasses. The progression module concentrates those rules and improves locality: adding one legal milestone can be reviewed independently of drawing code. The deletion test favors keeping this module because deleting it would spread validation and persistence among both renderers. Tests use its interface rather than storage internals, giving leverage across different presentation adapters.

The active-renderer host prevents two global input owners, hidden Phaser loops and retained WebGL contexts. A list adapter keeps every accessible destination usable when WebGL is unavailable; it does not bypass quest gates.

## Scope and consequences

This is a mission-selection map with sample recovery and two intelligence records, not the full three-chapter campaign. Full save migration, new lesson sets, 3-phase bosses and the ending remain later work. The city is authored geometry; no paid Sketchfab or UI package files were imported. A future navigable 3D city would require a separate movement/collision decision.
