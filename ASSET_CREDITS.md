# Asset credits — TechCare BLACKBOX

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

## Original terminal entrance artwork

- `public/assets/entry/access-gate.webp`: original cyberpunk maintenance-bay scene generated with the built-in image_gen tool on 1 November 2026. No third-party demo artwork was supplied as generation input. Text, access ring, lighting changes and controls are authored in React/CSS rather than baked into the image.
- Original PNG and exact prompt retained at `art-source/access-gate.png` and `art-source/access-gate-prompt.txt`. Runtime WebP uses format optimization only; source dimensions are 1672x941.
- `public/assets/entry/access-gate-open.webp` is a built-in image_gen edit of that original project-owned scene, opening only the doorway. Source/prompt: `art-source/access-gate-open.png` and `art-source/access-gate-open-prompt.txt`. The game clips its inner aperture behind two CSS-animated door leaves; the rest of the background stays fixed while localized practical lights animate. The later gate lighting revision removes the animated rain overlay.
- `public/assets/entry/kin-phone.webp`: original transparent pixel-art Kin pose generated with the built-in image_gen tool on 1 November 2026 using the existing project-owned Kin outfit and face as references. Source: `art-source/kin-phone.png` (887×1774 RGBA); exact prompt: `art-source/kin-phone-prompt.txt`. WebP is a format optimization preserving transparency. Local hand movement, screen scanlines and cyan face/hand illumination are authored separately in `src/entry/GateKin.tsx` and `src/entry/gate-kin.css`.

## Kin tutorial portraits and fonts

-15 original portrait frames generated with built-in imagegen using the existing original Kin cutout as character reference. Exact prompts, source sheets and normalization details: art-source/kin-tutorial/. Runtime: public/assets/tutorial/kin/. No third-party demo artwork was used as imagegen input.
- Chakra Petch by the Chakra Petch Project Authors/Cadson Demak, supplied with the existing NULLSIGNAL font demo; SIL OFL1.1 retained at public/assets/fonts/OFL-ChakraPetch.txt.
- BoldPixels by YukiPixels, supplied in the user's Desktop/Asset/font; unmodified webfont, CC BY-SA4.0. Credit/source: https://yukipixels.itch.io/boldpixels · license: https://creativecommons.org/licenses/by-sa/4.0/ . Original font license retained at public/assets/fonts/LICENSE-BoldPixels.txt.

The dialogue frame, menu motion, original TechCare Pixel UI family, and custom cursor remain project-authored. The remaining Finnmercury demo file has not been supplied to image generation or used for model training. Source archives and editable demo SVGs remain locally under the gitignored `art-source/vendor/` directory. Runtime file dimensions, checksums, and sprite-frame coordinates are recorded in `public/assets/vendor/manifest.json`.
