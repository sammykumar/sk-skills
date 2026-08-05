---
"mattpocock-skills": minor
---

Add **`wait-what`** — a one-word corrective for model verbosity. Type it the moment a message doesn't land, and the agent re-pitches it: a little context, ASD-STE100 Simplified Technical English, and the ubiquitous language from your `CONTEXT.md`. User-invoked, three lines long.

The mechanism is the name. Concision skills fail by growing — a 400-line skill still leaves the model verbose — so this one is a single precise leading word and nothing else. Names that describe the *output* (`/tldr`, `/no-fluff`) make the model clip words and lose you further; naming the *listener's* state asks for both halves at once, fewer words **and** the context you were missing. It also reuses the leading words already in your global `CLAUDE.md`, so the skill, `CLAUDE.md` and every `CONTEXT.md` reach for the same tokens.

It repairs one message; it doesn't prevent the next one. The cure for jargon is a shared language built upfront with `/grill-with-docs`; this is what you reach for when you don't have one yet.
