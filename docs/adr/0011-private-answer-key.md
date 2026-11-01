# ADR0011 — Private Cheat Sheet, conceptual hints in game

Accepted 2 November 2026, superseding earlier pink-answer-button requirements.

The user wants all answer reveal/autofill controls removed from the game and a private Thai PDF covering all31 current exercises. The inventory is14Puzzles,16chaptercode/filenameexercises and1retainedlegacybossdemo. TutorialBODYisnotaseparateexercise; futurechapterthreeandassessmentsarenotyetimplemented.

Remove answer-returning reveal methods and canonical code answers from runtime lesson data. Keep structural/semantic validators and internal Puzzle checking rules. Keep hints, feedback, previews and partial editor tools. Old revealed observations remain readable as historical assistance; no new reveal observations are written and no case/save version change is needed.

The private answer snapshot is taken before removal and all entries validated against the actual game rules. Node-only regression helpers can read this ignored local fixture; the public application never imports it. Full local learning tests need the owner's fixture, while the production build does not. This keeps the complete answer bank out of runtime and avoids putting a replacement bank into public Git.

PDF authoring uses Chromium with embedded Thai/code fonts, page geometry checks and rendered-page review. Disable Thai GSUB substitutions that Chromium maps to null glyphs during PDF text extraction while retaining GPOS mark positioning; code samples must survive copy/extraction. Outputs and authoring sources remain under ignored output, never public/ or deployment staging. Original design prompts remain historical, while the latest final-chapter prompt adopts the new hint-only policy.

The answer-removal module seam is deliberately small: progression stays with each chapter owner, presentation loses reveal actions, and validation retains its depth. The deletion test does not justify a new answer server or account migration for this change.
