---
"mattpocock-skills": patch
---

Rewrite the `grill-me` docs page around what people actually get wrong.

The old page explained the mechanism — rounds, the frontier, the decision tree — and stopped there. Every recurring question from the last few months went unanswered on it: which of the three grilling skills to reach for, how many questions is normal, what to do when a question can't be answered by talking, and whether to start a fresh session before writing the spec.

The rewrite keeps the mechanism short and spends the page on the judgement calls instead:

- **Sibling routing** is now a three-way list keyed on what you have in front of you — no codebase, a codebase, or too big for one session — rather than a paragraph.
- **"It's a conversation, not an interview"** names passivity as the main failure mode. A session where you answer "agreed" forty times produces a plan you didn't write and can't defend.
- **"Grillable and ungrillable"** gives readers the move for a question that talking cannot settle: stop, prototype, come back. This is where long sessions come from.
- **A "Common questions" section** answers the six highest-volume ones directly, including how to restore one-question-at-a-time and why you should not clear context before `to-spec`.
- **"It's working if"** added, led by the sharpest signal: if you never disagreed, you didn't need the session.

Also drops the "plan mode" ambiguity by saying plainly to leave it off.
