---
"mattpocock-skills": minor
---

Add **`wait-what`** to `in-progress/` — a fire extinguisher for model verbosity. Fire it the moment a message doesn't land, and the agent re-pitches it: a little context, ASD-STE100 Simplified Technical English, and the ubiquitous language from your `CONTEXT.md`. User-invoked, three lines long.

The mechanism is the name. Concision skills fail by growing — a 400-line skill still leaves the model verbose — so this one is a single precise leading word and nothing else. It also reuses the leading words already in your global `CLAUDE.md`, so the skill, `CLAUDE.md` and every `CONTEXT.md` reach for the same tokens.

It's the extinguisher, not the sprinkler. The cure for jargon is a shared language built upfront with `/grill-with-docs`; this is the in-the-moment corrective for when you don't have one yet.
