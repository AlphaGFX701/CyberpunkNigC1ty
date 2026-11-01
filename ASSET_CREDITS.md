# Asset credits — TechCare BLACKBOX

## Circuit City and repair console

- Original code-authored PCB/city geometry: `src/circuit/model-geometry.ts`. Editable static export: `public/assets/circuit/circuit-city.glb`; runtime lights, fans and signals: `src/circuit/CircuitScene.tsx`. Reproducer: `tools/export-circuit.mjs`. The user's Circuit City screenshots/links supplied visual direction; no Sketchfab geometry or textures were imported.
- Original dark navy/white/cyan HTML console, Puzzle cards and editor adapter were written for TechCare. RuneCode's public editor was inspected only for line numbers, caret insertion, Undo and diagnostic presentation; no RuneCode source/art was copied. Existing Chakra Petch and IBM Plex fonts retain their previous credits.
- CodeMirror 6 supplies the HTML editing engine under MIT. Bundled license text is retained at `public/assets/vendor/codemirror-LICENSE.txt`. No Python runtime, combat or progression system was imported from RuneCode.

## Arun chapter remake (local iteration)

- Actual local vendor selection, source URLs and licenses: `CHAPTER_ONE_ASSETS.md`. The revised shop uses a small SakPix free-demo machine as the repair terminal and one LuKaRaii Neon City layer as a faint moving reflection in the window. The JustCreate3D sample building was removed from this scene because its camera angle made it appear to float. Purchased-pack artwork is not claimed when only a public reference page was available. NULLSIGNAL OBS templates remain private references; the hacking interface is original TechCare React/CSS.
- New original room plates: `public/assets/chapter-one/scenes/arun-workshop.webp` (1600×900) and `recorder-interior.webp` (1600×1000). Generated with built-in image_gen from written layout briefs; no vendor pixels were supplied as image inputs. Editable full-resolution PNGs and prompts are in ignored `art-source/chapter-one/`.
- New original Kin walk sheet and Arun portrait/standing artwork were generated with the built-in image_gen tool using only the game's original character references. Runtime files: `public/assets/chapter-one/characters/`. Editable source PNGs and exact prompts: `art-source/chapter-one/`. No external pack artwork was supplied to image generation.
- Kin: 384×512 runtime PNG, four rows down/left/right/up, four 96×128 frames per row, exclusive foot edge y122. A later built-in image-generation correction adds a neutral idle and actual bent-knee passing poses; horizontal directions share a coherent right-facing strip, mirrored for left. Front/back retain face asymmetry. Whole-strip shared scales and head/foot anchors are documented with exact prompts, raw sources, normalization code and animated comparison in `art-source/chapter-one/KIN_WALK_CANDIDATE.md`. Both extended contacts remain anatomically lead-similar; the accepted practical improvement is a visible narrow/extended/passing/extended cycle, not a claim of a perfect hand-drawn gait.
- Arun: three expression portraits (`arun-neutral/smile/serious.webp`) and a matching standing sprite. Source/prompt files include `arun-portraits-source.png`, `arun-portrait-prompt.txt`, `arun-standing-source.png`, `arun-standing-prompt.txt`.

## Imported free-demo artwork

### Finnmercury — Ultimate Pixel Sci-Fi UI set

- Author and required credit: **Finnmercury**.
- Source: https://finnmercury.itch.io/sci-fi-ui-elements
- Downloaded through the page's **Free Version Pixel Sci-Fi UI.zip** demo button on 1 November 2026. No paid pack was acquired.
- Used file: `public/assets/vendor/finnmercury/loading-03.png`, copied without pixel changes from `Animated Loaders/Blue (free version)/Loading Sprite 03.png`.
- Sprite sheet: 126×21 pixels, six horizontal 21×21 frames. Each frame contains visible pixels. The application chooses 120ms per frame; this timing is not a vendor-specified value.
- Intended use: small connection/transmission indicator in the cinematic interface.
- Included `license.txt` allows personal/commercial use and modification, requires credit to Finnmercury, and prohibits resale of the pack. The page also excludes NSFW uses. This educational game is within the stated use category.
- Original license is retained at `public/assets/vendor/finnmercury/LICENSE.txt`.

### Original TechCare UI accents

The former NULLSIGNAL corner/standby images were replaced for public-source release with project-authored SVGs: public/assets/ui/techcare-corner.svg and public/assets/ui/techcare-standby.svg. No NULLSIGNAL image bytes are included in the public repository or current deploy package. The earlier free demo remains only in the developer's private source archive; it was a visual reference, not a source of the new SVG paths. Existing UI placement and motion stay in React/CSS.

## Design references, without imported files

- RastalR, [Godot 4 Interaction Toolkit](https://rastalr.itch.io/godot-4-interaction-toolkit): reference for a maintenance-bay terminal entrance, hold-to-interact progress and cancellation. No Godot addon or promotional image is included in the game.

- Clutch Assets, [Neon Sci-Fi Game Menu UI Kit](https://clutch-assets.itch.io/neon-style-ui-html-toolkit): reference for hover/scan-line behavior. No paid HTML toolkit files were copied.
- Nkyo-P, [NULLSIGNAL Godot 4 Theme](https://nkyo-p.itch.io/nullsignal-dark-tech-godot-4-theme-7-colourways-sample-scenes-tested-in-472): reference for cut-corner shapes. No paid `.tres` theme or sample project was imported into React.
- [KMUTNB 3D map](https://sutiporn03082547-eng.github.io/kmutnb-3d-map/): observed through REA for compound building masses, facade bands and surrounding-city density. No source, photos, campus footprints or geometry are used in TechCare. The 3D city is original code-authored geometry.
- [PIKU mission-log UI](https://pikurtv.itch.io/cyberpunk-mission-log-data-files-ui-kit): reference for city-operation information hierarchy; no paid PNGs imported.

City observation details and limitations are recorded in evidence/CITY_RESEARCH.md. No Sketchfab model or textures are included. React Three Fiber, Drei and Three.js provide rendering; they do not supply the city artwork.

## Local storyboard remake and music

- `public/assets/story/escape/`: clean open/closed vault plates and six-frame anonymous intruder walk, generated with built-in imagegen from the project's original vault artwork. The walk strip was generated as a whole from one costume seed, then cropped into six equal slots and resized with nearest-neighbor at a shared scale; no individual frame resizing. Editable source images and exact prompts remain in `art-source/escape/`. No third-party pack images were supplied for this generation.
- `public/assets/music/`: six user-supplied Desktop MP3s, copied without transcoding or changing originals. Concrete_Tears starts at cue3s; all others start at0. The later scene-music update adds Midnight_at_the_Terminal (Arun), Terminal_Watch (relay station), and The_Glass_Key (running connections/Circuit City). Song author/license was not supplied; these files are local runtime inputs and excluded from public Git. No audio was uploaded or published. `theme.wav` was removed, with no fallback to it. See SCENE_MUSIC.md for the complete mapping.
- Procedural door, footstep, relay and text effects are original WebAudio code owned by EntryAudio; no voice recording is included.

## Original terminal entrance files

- `public/assets/entry/access-gate.webp`: original cyberpunk maintenance-bay scene generated with the built-in image_gen tool on 1 November 2026. No third-party demo artwork was supplied as generation input. Text, access ring, lighting changes and controls are authored in React/CSS rather than baked into the image.
- Original PNG and exact prompt retained at `art-source/access-gate.png` and `art-source/access-gate-prompt.txt`. Runtime WebP uses format optimization only; source dimensions are 1672x941.
- `public/assets/entry/access-gate-open.webp` is a built-in image_gen edit of that original project-owned scene, opening only the doorway. Source/prompt: `art-source/access-gate-open.png` and `art-source/access-gate-open-prompt.txt`. The game clips its inner aperture behind two CSS-animated door leaves; the rest of the background stays fixed while localized practical lights animate. The later gate lighting revision removes the animated rain overlay.
- `public/assets/entry/kin-phone.webp`: original transparent pixel-art Kin pose generated with the built-in image_gen tool on 1 November 2026 using the existing project-owned Kin outfit and face as references. Source: `art-source/kin-phone.png` (887×1774 RGBA); exact prompt: `art-source/kin-phone-prompt.txt`. WebP is a format optimization preserving transparency. Local hand movement, screen scanlines and cyan face/hand illumination are authored separately in `src/entry/GateKin.tsx` and `src/entry/gate-kin.css`.

## Kin tutorial portraits and fonts

-15 original portrait frames generated with built-in imagegen using the existing original Kin cutout as character reference. Exact prompts, source sheets and normalization details: art-source/kin-tutorial/. Runtime: public/assets/tutorial/kin/. No third-party demo artwork was used as imagegen input.
- Chakra Petch by the Chakra Petch Project Authors/Cadson Demak, supplied with the existing NULLSIGNAL font demo; SIL OFL1.1 retained at public/assets/fonts/OFL-ChakraPetch.txt.
- BoldPixels by YukiPixels, supplied in the user's Desktop/Asset/font; unmodified webfont, CC BY-SA4.0. Credit/source: https://yukipixels.itch.io/boldpixels · license: https://creativecommons.org/licenses/by-sa/4.0/ . Original font license retained at public/assets/fonts/LICENSE-BoldPixels.txt.

The dialogue frame, menu motion, original TechCare Pixel UI family, and custom cursor remain project-authored. The remaining Finnmercury demo file has not been supplied to image generation or used for model training. Source archives and editable demo SVGs remain locally under the gitignored `art-source/vendor/` directory. Runtime file dimensions, checksums, and sprite-frame coordinates are recorded in `public/assets/vendor/manifest.json`.
# Relay episode originals — 2 November 2026

- `public/assets/relay/scenes/*`, `characters/*`: original station plate/duty technician/dish generated with built-in imagegen using the project's original Arun workshop as a style reference. Sources and prompt record retained locally in `art-source/relay`; normalization script: `tools/prepare-relay-art.mjs`.
- `public/assets/relay/circuit/relay-city.glb`: original code-authored low-poly geometry, no downloaded Sketchfab model. Source/export details in RELAY_CIRCUIT.md.
- Existing Kin, UI, fonts and Midnight Protocol are reused under their existing credit entries; this iteration adds no new third-party pack or music.
