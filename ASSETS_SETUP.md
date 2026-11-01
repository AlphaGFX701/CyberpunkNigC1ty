# Prepare local runtime artwork

The public repository contains the game code and original TechCare artwork. The external binary files listed in `external-assets.json` are deliberately not distributed through Git. An ordinary clone therefore needs these files before build/play.

Use your own authorized copies of the packs supplied for this project. Copy the prepared runtime files from the original development workspace or reproduce the same sheets from your licensed sources, retaining these paths:

| Runtime file | Source recorded by this project |
| --- | --- |
| `public/assets/kin.png` | User-supplied Cyberpunk City Ext character sheet |
| `public/assets/witness.png` | User-supplied Cyberpunk City Ext witness sheet |
| `public/assets/props.png` | User-supplied Cyberpunk City Ext props |
| `public/assets/city.png` | User-supplied Neo Zero V1.0 building sheet |
| `public/assets/null.png` | Local boss placeholder retained from the earlier TechCare prototype |
| `public/assets/vendor/finnmercury/loading-03.png` | Finnmercury free demo, Loading Sprite 03, 126×21, six frames |
| `public/assets/music/concrete-tears.mp3` | User-supplied Desktop Concrete_Tears.mp3; entry cue3s |
| `public/assets/music/rain-over-glass-monoliths.mp3` | User-supplied Desktop Rain_Over_Glass_Monoliths.mp3; story |
| `public/assets/music/midnight-protocol.mp3` | User-supplied Desktop Midnight_Protocol.mp3; gameplay |

Exact byte sizes and SHA-256 values are in `external-assets.json`. Run `npm run assets:check`; it reports missing or changed inputs without downloading or redistributing them. Different sheets require updating frame/crop definitions and intentionally regenerating the manifest, not simply bypassing validation.

Sources: [Finnmercury](https://finnmercury.itch.io/sci-fi-ui-elements), [Neo Zero V1.0](https://yaninyunus.itch.io/neo-zero-cyberpunk-city-tileset/devlog/853442/neo-zero-v10). Cyberpunk City Ext was supplied as `Cyberpunk_City_Ext_V1.0.zip`; no license was included in that archive. Keep acquisition/permission records for your own distribution. Do not upload original ZIPs, source packs or restricted image sheets to this public repository.

The two former NULLSIGNAL image accents have been replaced by original `techcare-corner.svg` and `techcare-standby.svg`; those original SVGs are included in Git. Fonts retain their own OFL/CC BY-SA notices. See `ASSET_CREDITS.md` for attribution; this repository grants no blanket license over third-party artwork.
