# Chapter one learning and evidence gates

The first Arun chapter uses two field clues, seven distinct introductory HTML exercises, then a separate CAM-07 image-recovery task. The camera is evidence on the route of the stolen BLACKBOX; BLACKBOX remains Arasaka's command-signing device. Finding a clue does not prove the suspect is Kin's missing partner.

## Teaching sequence

These original Thai exercises follow the early W3Schools HTML sequence, checked on 1 November 2026. They do not copy W3Schools questions or illustrations.

| Point | Skill | In-game task | Reference |
| --- | --- | --- | --- |
| 1 | Home / Introduction | Move visible text into body | https://www.w3schools.com/html/html_intro.asp |
| 2 | Editors | Restore index.html; .htm is accepted | https://www.w3schools.com/html/html_editors.asp |
| 3 | Basic | Add HTML5 doctype without deleting the body | https://www.w3schools.com/html/html_basic.asp |
| 4 | Elements | Repair closing order of nested p and strong | https://www.w3schools.com/html/html_elements.asp |
| 5 | Attributes | Declare Thai with html lang | https://www.w3schools.com/html/html_attributes.asp |
| 6 | Headings | Establish h1 main topic, h2 subtopic | https://www.w3schools.com/html/html_headings.asp |
| 7 | Paragraphs | Split witness statements into two p elements | https://www.w3schools.com/html/html_paragraphs.asp |
| Final camera | Image evidence | Restore img src and useful alt for suspect.png | https://www.w3schools.com/html/html_images.asp |

The supplied Computer Code Elements page is a later HTML topic. This chapter begins at Introduction and ends at Paragraphs as requested; kbd, samp, code and pre are not added as required lessons here.

## Progression

Talk to Arun → inspect the torn receipt and hidden relay → connect the repair terminal → enter Circuit City → complete seven Puzzle/code repairs in order → open the central camera tower as stage eight → restore the CAM-07 image → award the existing recover-cam07 city milestone → return to the shop. Physical CAM-07 becomes a read-only evidence viewer after recovery and cannot bypass the tower. The chapter module cannot award that city milestone itself.

The map tutorial introduces city controls and hands field orientation to the chapter after Arun's conversation. It must not force the old single image question ahead of the seven lessons.

## Module ownership

`src/chapter/content.ts` owns lesson/witness text; `puzzles.ts` owns original card assignments, partial scaffolds and contextual snippets. `validate.ts` reads short task HTML without executing it and reports exact parser-source lines when known. `model.ts` owns completion gates, read-only inspection, assistance observations, scoring and version2 local chapter persistence. Phaser owns shop movement; React Three Fiber owns the selectable Circuit City map; React/CodeMirror own Puzzle and readable HTML editing. Neither renderer fabricates task completions. Existing completed v1 repairs migrate as puzzle+code complete; unfinished repairs start at their Puzzle.

Validation accepts uppercase tags, varying whitespace and single/double/unquoted attribute values. Explicit closing is a requirement of these beginner exercises. The structural reader is scoped to these tasks and is not a complete HTML5 conformance checker; the sandboxed browser preview remains the visual renderer.

Each exercise awards ten game points on successful submission; final image recovery awards thirty. Hints, answer reveal and retries do not reduce game points. The module records attempts, hint use and answer reveal separately, so 100 game points must not be reported as independent mastery. This iteration has no new pre/post assessment or statistical learning report.

Chapter details persist only in this browser, keyed by stable save owner and reset generation. Existing cloud case progress remains unchanged. Account login, cloud database schema and reset transport are not extended by this module; another device can know the existing completed-city milestone without having this device's seven local learning observations.

## Verification

`node --experimental-strip-types --test tests/chapter.test.ts`

Tests cover all broken starters and distinct solutions, equivalent spelling, malformed nesting, comment/script masquerades, clue gates, sequential recovery, final-image gating, assistance observations, score idempotence, corrupt local saves, and owner/reset isolation.
