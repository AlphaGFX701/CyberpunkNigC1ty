---
version: alpha
name: TechCare Signal Trace
description: A rain-soaked pixel investigation game with a restrained field-terminal interface for Thai HTML beginners.
colors:
  background: '#101d26'
  surface: '#1b303b'
  primary: '#e7bf77'
  secondary: '#90c5c0'
  solution: '#ed9fba'
  text: '#dfe7df'
  muted: '#9bb0b3'
  border: '#344c56'
typography:
  sans:
    fontFamily: 'IBM Plex Sans Thai, Tahoma, sans-serif'
  mono:
    fontFamily: 'IBM Plex Mono, monospace'
rounded:
  DEFAULT: '0px'
spacing:
  modal-padding: '26px'
  page-inset: '3.7%'
components:
  button:
    rounded: '0px'
  dialog:
    rounded: '0px'
---

# TechCare — รอยต่อสัญญาณ

## Overview

User motion requirement (2026-11-01): every new/reworked game scene must include visible authored environment animation and button/interaction animation. For the cyberpunk entrance, animate background tube lights and reader glow with visible local dimming and bloom; do not add animated rain to this entrance; add readable sparse glitch to IDENTITY READER, HOLD E / OPEN TERMINAL and E; completing Hold E physically opens the door before showing the separate account page. The user rejected the large left copy/CTA block and gate guest button: the scene and reader carry this entrance, and guest access remains inside the account page. Kin leans against the left wall looking at his phone, with a restrained tapping hand and cyan phone light on his face. Keep his body planted; avoid whole-sprite floating. Respect reduced motion and mute. Record/play the actual scene during verification; still screenshots alone do not establish animation.

Product register: browser adventure game for Thai novice HTML students, primarily on desktop.
Creative North Star: a municipal repair district at 03:12 after rain; worn roof equipment, amber work lamps, teal shopfronts, small pools of reflected light.
Signature: the same character enters a camera as a tiny avatar, then returns to human scale in a malware containment room.
Avoid dashboard cards, giant neon marketing headlines, screen-filling lore, glowing borders on everything, and unrelated animation.
Tokens above mirror the canonical runtime CSS variables in src/style.css. Phaser environment colors are authored scene materials; amber landmarks and teal recovered systems align with the UI semantic palette.
The user-approved entry direction is a rain-lit laboratory, Kin at a terminal, and the five-beat BLACKBOX theft/Arasaka/partner/evidence/challenge opening. Gameplay remains the four-scene milestone, not a completed campaign.

## Colors

Amber identifies evidence, next actions, and focus. Teal identifies digital routes and restored systems. Pink marks answer reveal in learning windows and the intruder channel in cinematic dialogue; the two are separated by surface and explicit labels. The background is blue-grey rather than pure black. Error messages use text and correction advice as well as color.

## Typography

Thai prose uses IBM Plex Sans Thai, 16–18px inside lesson windows and 22–26px for titles. Latin instrumentation uses IBM Plex Mono. Compact in-world labels are supporting landmarks; full objectives also appear in the readable DOM overlay. No Thai pixel font in lesson prose. Story dialogue is 20px desktop and 18px narrow; speaker labels remain readable DOM text. English title and instrumentation share the established Mono family.

## Layout

A fixed 1280×720 logical 2D playfield scales to fit a 16:9 frame. The 3D city fills the viewport beneath the toolbar with a responsive perspective camera. Scene selection and prototype notes live inside the pause menu. A single objective stays at an edge. Title and story use illustrated full-window scenes; at short viewport heights entry content must reflow or compact without overlapping the footer. The circuit objective moves to the upper right to keep the small avatar visible. Under 760px the map is operable through pins, a place list and camera buttons; 2D walking still recommends a desktop keyboard.

## Elevation & Depth

Low building shadows establish spatial depth. The original 3D city uses solid colored masses: cyan/amber repair streets, magenta/violet market accents, warm residential windows and industrial-orange harbor details. Dark glass, concrete, metal roofs, planted courts and river color vary by district. Locked districts lose saturation but retain readable shapes; unlocking restores their palette. Compound wings, setbacks, roof equipment, bridges and elevated rail establish city scale rather than repeating box towers. Locked areas have no usable pins. Terminal dialogs use one border, a dark scrim, and a modest offset shadow. Routine HUD does not use backdrop blur. The canvas center remains unobscured while walking.

## Shapes

Shared controls use original pixel-cut corners with zero CSS radius. Thin bevels, two-layer metal edges, fixed-pixel rivets, and small colored signal strips connect the terminal UI to the city artwork.

## Components

One shared Modal in src/ui/Modal.tsx owns portal rendering, background inertness, focus entry, visible-controls Tab cycling (including details summaries), Escape, and focus restoration. All scene selection buttons use the same selected and focus treatment. Native textarea is the code entry owner; no custom editor package in this phase. Pink reveal and amber check are distinct actions. Status feedback occupies a reserved region. A missing asset surfaces a retry state. Scrollbars use the global CSS baseline. Cinematic dialogue uses an original cut-corner dark-tech frame with real NULLSIGNAL demo accents and a Finnmercury loader. Text stays DOM-owned; long narrow dialogue scrolls in a keyboard-focusable region while navigation remains fixed. The memory shot uses a landscape mobile crop so both partners remain visible.
Rain and fades are restrained and disabled for reduced motion. Walk animation is functional. Cinematic body/head/forearm are separate CSS-clipped PNG layers; the body anchor stays fixed, with slight head/forearm motion. No ambient whole-character floating. Pending sound cues are cancelled on screen/dialog/shot changes.

## Do's and Don'ts

The Pixel UI family is owned by tools/build-ui.mjs and generated manifest metadata. Shared PixelButton, PixelPanel, PixelBar, PixelSlot, PixelShields and PixelKey own DOM usage. src/ui/pixel.css follows the base stylesheet and reads nine-slice metadata. Phaser uses the same atlas for world quest markers. Asset gallery at ?ui=1 demonstrates future-only minimap art. Separate music/SFX controls are functional in the entry settings. UI_KIT.md documents exports and source editing.

- Keep labels short and in Thai; preserve HTML identifiers in code.
- Use actual supplied pixel sprites and hand-place city props.
- Do not present a visual preview as a completed chapter or saved campaign.
- Do not use the previous AI character portrait as the new playable sprite; the supplied four-direction sheet is canonical.

## BLACKBOX motion and asset integration

The existing PixelButton owns normal/hover/pressed/disabled frames; feedback=menu adds one140ms sweep,2pxiconmotion and1pxpress consistently. MenuFeedback owns fine-pointer eligibility, the24pxreticle, RAF cleanup, and reduced-motion fallback. The title background moves at most4px, foreground8px; the menu and Thai text never parallax.

Runtime third-party art is limited to the verified free-demo files listed in public/assets/vendor/manifest.json. The cinematic frame and cursor are original work, not a claim to own the full NULLSIGNAL kit. ASSET_CREDITS.md and in-game credits retain attribution. No paid Clutch or Godot files are imported.

## City-map interaction

The scene is the main surface, with compact location/status at the upper left and camera controls at the right. Selecting a pin focuses the camera and opens one detail panel; travel requires an explicit action. Keyboard focus enters the selected heading. The place list is a complete alternative to canvas selection and remains usable without WebGL. On narrow screens the detail panel becomes a bounded bottom sheet; the objective yields space while that sheet is open. Reduced motion snaps camera transitions and removes ambient sweeps while preserving manual control. Only case milestones and current area persist; New Case confirmation preserves officer preferences.

## Kin coaching

The temporary coaching dock follows a pixel adventure dialogue layout: canonical blond Kin at the left, name/channel above readable Thai, choices below. It reserves camera space rather than covering the city and hides duplicate objectives during coaching. Walking tasks collapse it to an edge strip. Real modals host an inline coach within their existing focus trap. Normal free play restores the low-chrome layout.

Chakra Petch22px desktop/20px narrow is the coaching prose family; existing IBM Plex Thai remains the general game prose. BoldPixels is limited to short Latin instrumentation. Thai grapheme reveal never displays detached marks. The five portraits keep a shared anchor and animate eyes/mouth only. Reduced motion uses complete text and still art; screen readers receive full sentences once. Talk blips are short and separately disabled while respecting SFX volume.
