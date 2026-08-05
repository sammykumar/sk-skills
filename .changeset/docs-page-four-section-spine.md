---
"mattpocock-skills": patch
---

Make `Common questions` and `It's working if` part of the docs-page standard, and say where the questions come from.

An audit of all 25 docs pages found the two sections that carry the most weight are the two the standard treated as optional. Only `grill-me` has a `Common questions` section; `writing-for-agents` gains one in #758. Twelve pages have no `It's working if` at all, and several that do use it for compliance checks on the skill's internals rather than for signals the reader can see.

`.agents/writing-docs.md` now:

- **Names the four-section spine** — `What it does`, `When to reach for it`, `Common questions`, `It's working if`. A page missing the last two is unfinished, not finished-and-short. The template's order is now the page's order.
- **Gates `Common questions` on evidence.** Every question has to be one someone asked, and three observed questions beat eight plausible ones. The hunt runs over three sources: the personal wiki at `~/repos/matt/personal-wiki` where it exists on the machine (its `wiki/audience/` area is organised around what the audience is confused by, with `sources:` linkbacks to the original threads), this repo's issues, and `CHANGELOG.md` for anything renamed or moved.
- **Raises the bar on `It's working if`** — each bullet must be checkable without opening `SKILL.md`.

`CLAUDE.md` names the four sections in the pointer, so the spine is visible without reading `writing-docs.md` first.
