# Circuit City — local build

Enter Arun's shop, complete the witness conversation, collect the two traces, and connect to the repair machine. The device opens an eight-sector 3D board. Select the lit building or use **รายชื่อด่าน**, inspect its objective, then choose **เริ่มซ่อม**.

Sectors 1–7 each require the card Puzzle and an HTML repair. Cards support click-then-slot and drag/drop. Passing the Puzzle gives a partial scaffold; it does not complete the repair. **ตรวจโครงสร้าง** is a preview check; **ส่งคำสั่งซ่อม** or Ctrl+Enter commits a valid repair. Snippet buttons insert at the selection/caret and support Undo. After all seven sectors, the central camera tower unlocks the original `img/src/alt` evidence exercise.

Use mouse drag to orbit, wheel to zoom, and the camera buttons to rotate/reset. The list provides the same stage gates if WebGL is unavailable. Pause and repair windows lock map input. Existing sound and reduced-motion preferences apply.

## Editable model

- Geometry source: `src/circuit/model-geometry.ts`.
- Runtime scene and map: `src/circuit/`.
- Shared camera behavior: `src/map-camera/MapCameraRig.tsx`.
- Exported model: `public/assets/circuit/circuit-city.glb`.
- Re-export: `node tools/export-circuit.mjs` from the project directory.

The GLB is a static editable geometry snapshot. Runtime fan/light/data animation is authored in the scene source. The exporter uses the same original geometry builder; no Sketchfab meshes were downloaded.

Learning definitions and partial scaffolds live in `src/chapter/puzzles.ts`; the chapter model owns their gates and migration. The existing owner/generation-scoped local record preserves v1 completed tasks when read as v2. Reset and account ownership continue through the current account module. No code drafts or detailed learning records are added to cloud storage.

This iteration remains local. Do not commit, push or deploy until explicitly requested by the user.
