# ADR 0005 — Scene music and manual story turns

Status: accepted through the local-only remake plan, 1 November 2026.

EntryAudio remains the sole audio owner. Its SceneMusic module hides two reusable streaming slots, preload, cue points, a 400ms crossfade and stale-request cancellation behind setMusicScene, setMusicActive and setLevels. unlock starts music within the player gesture but resolves only after effects readiness, so slow streaming cannot postpone story cues. No media API or account/save interface changes.

This adds depth at a real seam: entry, story and game need different tracks while settings and gestures share playback rules. The interface gives tests leverage over cross-scene races without binding them to React. The deletion test favors keeping transport/fade state local; moving it into screen click handlers would scatter that state and reduce locality.

StoryPlayer owns shot index, line index and the finite reading/escape phase. Case narrative remains the owner of all eleven original speaker turns and reveal facts. Lines do not remount a shot or replay its cue schedule. The theft's last Next starts one cancellable 2.8s escape; reduced motion snaps in180ms. Skip, Back, inactivity and unmount cancel completion and cues. No general cinematic editor is introduced.

CinematicArt aligns backgrounds and layers in one1280×720 source plane. TheftEscape is a scene-local presentation using project-original plates and six normalized walk frames; it cannot advance case progress. The briefing graph sits inside its painted monitor.

Online release remains unchanged. This iteration is local only: no commit, push, deployment, database changes, or mobile testing. The optional codebase-design skill remains unavailable; this records the direct audit and approved decisions, not a claim that that workflow ran.
