# Chapter one — inspected local artwork

Inspected on 1 November 2026 for the local Arun shop and CAM-07 remake. Source archives remain under ignored `art-source/chapter-one/`; original archives were not changed. This iteration is not published. Selected runtime images are under `public/assets/chapter-one/vendor/` and excluded from public Git. Their dimensions and SHA-256 checksums are in that folder's `manifest.json`.

## Runtime selection and available references

The current 2.5D shop and recorder use coherent original full-scene plates at `public/assets/chapter-one/scenes/`. Small grounded markers, lighting and characters are placed over them. The shop additionally uses SakPix's `machine.png` at the repair console and LuKaRaii's far-building layer as a moving window reflection. The other inspected files below remain available for later levels; they are not all visible in this chapter now. The JustCreate3D tower render was removed from the playable scene because its perspective conflicted with the room. No paid pack is included.

| Source | Runtime files | Geometry and intended use |
| --- | --- | --- |
| LuKaRaii — Pixel Parallax Backgrounds Vol.1 | `neon-city/neon_city_night_L0_sky.png`, `L1_far_buildings.png`, `L2_mid_buildings.png`, `L3_near_rooftops.png`, `L4_foreground_wires.png` (each uses the full `neon_city_night_` prefix) | Five transparent 320×180 layers. Original scroll factors: 0, 0.15, 0.30, 0.55, 1.0. Use nearest-neighbor and shared placement. The supplied JSON is copied as `neon-city/parallax.json`. |
| SakPix — public Free demo | `sakpix/machine.png`, `crate.png`, `sign.png`, `vehicle.png`, `plant.png`, `hologram.png`, `rooftop.png`, `room.png`, `portal.png`, `floor-a.png` through `floor-d.png` | Cropped from the actual public demo's 1536×1024 transparent PNG, excluding headings and promotional lettering. Object sizes range from 95×162 to 376×240. These are still objects, not animated sprite sheets. Animate lights or overlays separately. |
| JustCreate3D — user-supplied Free Sample.zip | `justcreate3d/building-06-render.png` | A 326×512 RGBA orthographic render of the supplied `Free Sample/Building_06.fbx`. Rendered locally with Three.js FBXLoader, two scene lights and a three-quarter camera. No FBX or original material textures are shipped in the runtime directory. Source preview and editable renderer HTML remain in `art-source/chapter-one/`. |
| User's Cyberpunk City Ext V1.0 | `city-ext/Cyberpunk_City_Character_01.png`, `Cyberpunk_City_Character_02.png`, `Cyberpunk_City_Doors_Windows_Signs.png`, `Cyberpunk_City_Props.png`, `Cyberpunk_City_Tiles_Fences.png` | Character sheets 96×256, each 3 columns × 4 rows of 32×64. Rows down/left/right/up; columns idle/step/step. Character01 is the existing blond Kin; Character02 is the existing masked witness placeholder. Environment sheets respectively 320×800, 320×576 and 320×640. |
| User's Neo Zero V1.0 | `neo-zero/neo_zero_char_01.png`, `neo_zero_props_and_items_01.png`, `neo_zero_tiles_and_buildings_01.png` | Sheets 96×288, 160×160 and 320×320. The character sheet contains several different characters and is not an outfit-consistent replacement for Kin. |

Preview contact sheets: `art-source/chapter-one/contact-sheet.png` and `sakpix-crops-preview.png`. These previews are inspection artifacts, not game backgrounds.

## Source and license records

- [LuKaRaii Pixel Parallax Backgrounds](https://lukaraii.itch.io/pixel-parallax-backgrounds-vol-1): the user supplied the archive. Its included license v1.1 explicitly permits personal/commercial game projects and modification. It prohibits resale/redistribution as asset packs and AI training. Original license retained at `neon-city/LICENSE.txt`. Credit: **Assets by LuKaRaii — lukaraii.itch.io**. No LuKaRaii pixels were submitted to image generation.
- [SakPix Cyberpunk Pixel Art Asset Pack](https://sakpix.itch.io/cyberpunk-pixel-art-asset-pack): downloaded only the public **Free demo!.zip** through the page's demo button (upload17313642), without purchase. It contains one PNG and no license text. The creator's public reply on the same page permits personal/commercial projects. Keep this record with the local files. No full-pack files were acquired or claimed. No SakPix pixels were submitted to image generation.
- [JustCreate3D Low Poly Sci-Fi Cyberpunk City](https://justcreate3d.itch.io/low-poly-sci-fi-cyberpunk-city): source referenced by the user. The public page permits game/app development and media creation, and disallows sharing original asset files. The user-provided Free Sample archive contains only Building_06.fbx; it has no separate license text. The runtime uses a render rather than redistributing that FBX.
- [Neo Zero V1.0](https://yaninyunus.itch.io/neo-zero-cyberpunk-city-tileset/devlog/853442/neo-zero-v10): user supplied the original archive. No license file was present. Preserve existing local-only handling pending distribution review.
- Cyberpunk City Ext V1.0: user supplied the original archive. No license file was present. Preserve existing local-only handling; this document does not grant redistribution rights.

## Inspected references that were not imported as game artwork

- **NULLSIGNAL-overlay-pack.zip** is an OBS HTML/CSS streaming pack, not a PNG game HUD pack. It contains three full-screen scene templates and three transparent overlay templates, plus Japanese README/terms. The included terms permit streaming/video use and changing text/colors/layout, and prohibit redistribution of the original or modified files. Keep the original pack private under `art-source/chapter-one/NULLSIGNAL-overlay-pack/`. The game should use its own authored dark-tech layout, not copy or distribute those HTML templates. It contains no dialogue portrait or character animation assets.
- **FreeSample.zip** contains thirteen FBX models (advertising boards, modular building blocks, Building_3, road/sidewalk pieces and a satellite dish) plus 4K diffuse/emissive textures. It is not a pixel tileset. It remains a source reference for later scenery; do not describe every model as already used in this game.
- [Cute SCKR Cyberpunk Night Market](https://comshadow.itch.io/cyberpunk-night-market-topdown-pixel-art-tileset) is paid and the supplied local archives do not contain it. Its promotional images are references only; no download or purchase was made.
- [PIKU mission-log UI](https://pikurtv.itch.io/cyberpunk-mission-log-data-files-ui-kit) and NULLSIGNAL paid icon/HUD packs remain visual references unless the matching licensed source files are later supplied.

## Reproduce the sample render

`art-source/chapter-one/model-preview.html` imports the local Building_06 FBX, adds a hemisphere and directional light, fits an orthographic camera to the model bounds, and renders to a transparent 768×768 WebGL canvas. The inspected canvas capture is `building06-preview.png`; runtime preparation trims its transparent margin and scales the result to 512px tall with nearest-neighbor. The helper does not alter any game scene, database or source model.

## Desktop scene check

The earlier `evidence/asset-review/` captures show the superseded mixed-asset courtyard. Current images are in `evidence/chapter-one/`: `street.png`, `device.png`, `arun.png`, `hack.png`, `lesson.png` and `completed.png`. The 1440×900 browser chapter path reaches both clues, seven distinct HTML tasks and the final CAM-07 image. `arun-1280.png` and `lesson-1280.png` show desktop dialog sizes. These captures verify rendered composition and navigation, not audible output.

The revised shop room plate places walls, window, counters, two stock islands and their contact shadows together. The separate recorder plate places chips and service pads together. Interaction anchors, collision footprints, dynamic waypoint markers and displayed props share `src/chapter/layout.ts` coordinates. The shop's tiny SakPix terminal has a floor shadow, while the LuKaRaii window layer and traffic drift inside the glass. The paid references remain unimported.
