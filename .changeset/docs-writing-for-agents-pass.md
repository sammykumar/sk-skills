---
"mattpocock-skills": patch
---

Rewrite the `writing-for-agents` docs page around what people actually get wrong.

The old page was a table of contents for the skill: the two loads, then a bullet per lever. It answered none of the questions the rename and the AMA threads have been generating for months — where `writing-great-skills` went, whether the agent or the human is doing the writing, why you shouldn't just ask Claude to write the skill for you, and how you know when a document is done.

The rewrite keeps the levers to one compact list and spends the page on the judgement calls instead:

- **The defining constraint is now stated up front** — the default move is deletion, not explanation, because the reader has already read everything. This is also the answer to "why not let the model write it", so it leads.
- **The scope is stated as a test**, not a list: does an agent read this document and act? Skills, `AGENTS.md`, specs, tickets and runtime prompts all pass it.
- **A "Common questions" section** answers the nine highest-volume ones directly, including the rename, the "streamline" failure where an agent trims for length and cuts behaviour, whether to rewrite documents per model, the skill that only works on the one task it was built from, and the leading-word question from non-native English speakers.
- **"It's working if"** added, led by the sharpest signal: the document gets shorter as it gets better, and duplication is the most reliable sign it was never tested.
- **`Where it fits`** says plainly that it has no chain neighbour: it sits underneath the set rather than beside one skill, and the documents the other skills leave behind are the text it governs.
