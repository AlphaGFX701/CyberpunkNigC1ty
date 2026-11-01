# TechCare — scene music

The existing entry-owned `EntryAudio` remains the only owner of music playback and effects. `scene-tracks.ts` resolves UI/game state to a semantic song; individual renderers and dialogue surfaces do not create audio transports.

| Semantic scene | Where it plays | Desktop source | Runtime filename | Start |
| --- | --- | --- | --- | --- |
| entry | Entrance, account, title | Concrete_Tears.mp3 | concrete-tears.mp3 | 3s |
| story | Original opening cinematic | Rain_Over_Glass_Monoliths.mp3 | rain-over-glass-monoliths.mp3 | 0s |
| game | City/case map | Midnight_Protocol.mp3 | midnight-protocol.mp3 | 0s |
| arun | Arun's field scene and connection window before Start | Midnight_at_the_Terminal.mp3 | midnight-at-the-terminal.mp3 | 0s |
| relay | Relay station and connection window before Start | Terminal_Watch.mp3 | terminal-watch.mp3 | 0s |
| hack | Running connection, either Circuit City, repair editor, sample boss | The_Glass_Key.mp3 | the-glass-key.mp3 | 0s |

All runtime files are in `public/assets/music/`, copied byte-for-byte from user-provided Desktop files. Checksums are recorded in `external-assets.json`; no files were published.

## Transitions

- Merely opening a connection window preserves field music. Its actual Start button sets `connectionRunning`; cancellation, map/field return and account/reset transitions clear it.
- Settings, dialogue turns and changes within one semantic scene do not seek or restart the song. Map music ignores active chapter; returning to the field selects its chapter's song.
- Selecting an available Arun/relay destination prepares that song through `prepareMusicScene()`, without starting it or allocating another player. Field songs prepare the shared hacking song by default.
- `SceneMusic` has exactly two reusable streaming slots and a 400ms crossfade. Preloading cannot replace an outgoing slot before its fade ends. Generation/source tokens prevent obsolete play results from selecting an older scene.
- Mute applies to both slots during transitions. A missing or rejected song reports its error and stops the previous area's song; it does not silently use an unrelated soundtrack. A new user gesture can retry the current song. Effects readiness is independent of MP3 loading.

## Validation

`tests/scene-tracks.test.ts` covers route ownership, cues and local files. `tests/entry-audio.test.ts` covers gesture unlock, preloading, fade reversal, obsolete promises, mute, failed songs, bounded transports and effects cancellation.
