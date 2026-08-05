[Source](https://github.com/mattpocock/skills/tree/main/skills/productivity/grill-me)

## What it does

`grill-me` interviews you about a plan until every decision inside it has been made on purpose rather than by default. It asks in **rounds**: each round is the whole **frontier** — every question whose prerequisites you have already settled — so you are never asked something that hinges on an answer it hasn't heard yet.

It is **stateless**. It writes no files and leaves no workspace behind. The only thing it produces is a sharper plan in your own head.

## When to reach for it

You invoke this by typing `/grill-me` — the agent won't reach for it on its own. Start it in a **fresh conversation**, not on top of a plan you already had an agent write.

Reach for it when a plan feels roughly right and you suspect it isn't. Which of the three grilling skills you want depends on what is in front of you:

- **No codebase yet** — `grill-me`. There is nothing to align against, so there is nothing worth recording.
- **A codebase** — [grill-with-docs](https://aihero.dev/skills-grill-with-docs). The same interview, but stateful: it keeps what it learns in `CONTEXT.md` and ADRs.
- **Too big for one session** — [wayfinder](https://aihero.dev/skills-wayfinder). It charts the effort as a map and runs grilling sessions inside it.

Leave plan mode off. Plan mode primes the agent to rush toward producing a plan, which is the opposite of staying in inquiry.

## It's a conversation, not an interview

The skill asks the questions, but **you** own the scope. That is the part people miss, and it separates a session that sharpens a plan from one that produces confident nonsense.

The failure mode is **passivity** — answering "agreed, agreed, agreed" for forty questions and coming out with a plan the agent wrote and you nodded at. It feels productive because it was long. Nothing was actually decided, and the result carries a certainty it hasn't earned.

Being active means steering. Push back on a question pitched beneath the fidelity you need. Say when the scope is drifting. Answer "I don't know" and mean it. This skill is built to aid an engineer, not to replace one: what comes out tracks the quality of your answers, not the number of questions asked.

The opposite error is real but rarer — staying in the interview so long you never reach code.

## Grillable and ungrillable

Some questions can be answered by talking. Others can't, and no amount of grilling will get you there.

"One long form or three pages?" and "how should this interaction feel?" are **ungrillable** — they need something to react to. When you hit one, stop grilling. Build the throwaway version with [prototype](https://aihero.dev/skills-prototype), look at it, then come back and answer in one line.

Talking your way through an ungrillable question is where sessions balloon. The agent keeps rephrasing, you keep guessing, and the scope grows to fill the uncertainty.

## It's working if

- You disagree with something. A session with no pushback from you is a session you didn't need.
- Questions arrive in a few rounds rather than one long drip, and later rounds clearly build on what you said earlier.
- You end up somewhere you didn't expect, because a question surfaced a decision you had been making implicitly.
- At the end you could defend each choice to someone who wasn't there.

## Common questions

**How many questions should I expect, and how do I know when it ends?**
Count rounds, not questions. Forty-six questions across four rounds is an ordinary session. It ends when the frontier is empty — every branch visited, nothing left silently assumed.

**It asked me two hundred questions. What went wrong?**
Usually the scope was too large. Ask the agent to break the work into smaller pieces first, then grill each one. Very long sessions also drift into the **dumb zone**, where the context window is full enough that the questions get worse.

**Can I go back to one question at a time?**
Yes. Add this to your global `CLAUDE.md`:

```
When grilling, ask one question at a time.
```

**What if I genuinely don't know the answer?**
Say so. "I don't know" is a real answer, and a question you can't answer is usually a sign to prototype rather than to guess.

**Do I start a fresh session before writing the spec?**
No. The value of the session is the context you just built. Hand the same conversation straight to [to-spec](https://aihero.dev/skills-to-spec).

**Does the model matter?**
More than for most skills. Grilling leans on the model's own sense of how systems break, so give it your best one. Implementation mostly follows context and tolerates a cheaper model.

## Where it fits

`grill-me` is a reach-for-it-anytime standalone — the pre-build stress test you run whenever a plan needs hardening. It is the stateless, user-invoked front door to the [grilling](https://aihero.dev/skills-grilling) primitive; its closest neighbour is [grill-with-docs](https://aihero.dev/skills-grill-with-docs), the stateful sibling that runs the same interview against a codebase and records the decisions as ADRs and a glossary. When the plan is settled, hand the conversation to [to-spec](https://aihero.dev/skills-to-spec), which writes it up without re-interviewing you. When you're unsure which flow fits, [ask-matt](https://aihero.dev/skills-ask-matt) routes you.
