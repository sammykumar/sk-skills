## What it does

`handoff` compacts the conversation you are in into a **handoff document** — one markdown file, written to your OS's temporary directory rather than into the workspace, that a fresh agent can read to pick the work up.

What it buys is **portability**, not compression. That is the fact most people miss, and it makes the skill much narrower than it sounds: you need a file only when something has to *travel* — to a new harness, to a new directory, to a colleague, or to a side task you want to fork off without derailing what you're doing. If nothing is travelling, you don't need a handoff. Staying in the session, `/clear`, a subagent and `/compact` all cover the ordinary end-of-phase case, and `/compact` covers it more often than this skill does.

## When to reach for it

You invoke this by typing `/handoff` — the agent won't reach for it on its own. Pass a note about what the next session is for and the document is tailored to it.

Reach for it when one of four things is true: you're **swapping harness** (Claude → Codex), moving to a **new directory or repo**, sending the work to a **colleague**, or **forking a side task** you found mid-phase. That list is the whole trigger. For the same-harness, same-directory boundary — you're done grilling and moving to implementation — `/compact` is the move, and [ask-matt](https://aihero.dev/skills-ask-matt) carries the ordered tree that gets you there.

## Branching is the use people skip

The description reads like session resumption — write a summary, end here, resume there — so it gets skimmed past. The fork case is the one worth knowing: you **stay in your session**, and hand the accumulated context to a *second* agent working in parallel.

That's what makes the detour through [prototype](https://aihero.dev/skills-prototype) work. You're deep in a design conversation, you hit a question that can only be answered by running something, and you don't want to burn the thread you built to find out. `/handoff` out to a prototype session, get the answer, `/handoff` back, and reference the return document from the original thread. Two crossings, one live conversation, nothing re-explained.

The one-line version, from a reader: `/compact` preserves intent, `/clear` preserves nothing, `/handoff` preserves momentum.

## What travels, and what doesn't

The document carries the live thread — what's in flight, why, and what's next — plus a **suggested skills** section naming what the next agent should reach for. Secrets are redacted before it's written.

What it deliberately does not carry is anything already written down. Specs, plans, ADRs, issues, commits and diffs are referenced by path or URL, never copied. That keeps the file small, and it keeps the settled detail in one place instead of two that drift.

## Common questions

**Handoff or compact?**
`/compact` unless something is travelling. Asked directly whether you hand off or compact when you're still on the same task, Matt's answer was "mostly `/compact`" — same harness, same directory, and you need to stay in the loop is where the phase-boundary tree lands most days. `/handoff`'s advantage is not that it summarises better; it's that the result is a file you can carry somewhere `/compact` can't reach.

**So what's the actual difference between compact, clear and handoff?**
Three different things being preserved. `/compact` compresses this context and keeps you going in a fresh window — intent survives. `/clear` empties the window and starts from nothing — correct when everything behind you is disposable, and one-way if it isn't. `/handoff` writes a portable file — the work survives the move to somewhere else. Note that all three turn a **primary source** (the conversation as it happened) into a **secondary source** (a summary of it). Continuing is the only move that doesn't, which is why it's the first one to rule out.

**Where did my handoff file go?**
The temp directory, which is the most-reported friction with the skill: the paths are long, they differ per OS, and on Windows agents sometimes take several attempts to find the right one. Ask for the path back and keep it before you move on. Temp is deliberate — a handoff is a transit document, not an artifact you maintain — but it is transit with a short shelf life.

**My handoff vanished between sessions.**
Some environments clear temp between sessions — Codex is the reported case — and `/private/tmp` goes on reboot. If the next session isn't starting within the hour, or is starting under a different harness, copy the file somewhere durable yourself as soon as it's written. The same applies to anything the document *points at*: a dispatch that references other files in temp is a dispatch the next agent can't follow.

**How do I actually hand it to the next agent?**
Open the fresh session and point it at the path: read this file, then continue. Point at the file rather than pasting the summary into a shell command — a summary containing backticks or `$(...)` gets mangled when it's interpolated into `claude "<summary>"`, and the usual failure is silent truncation rather than an error, so the new agent starts with a quietly incomplete brief.

**Is this the same as `/branch`, `--fork-session`, or the built-in `/handoff`?**
Analogous, not identical, and `/branch` isn't a shipped skill here — `/handoff` is the canonical name. A fork inherits an exact copy of the context; this skill produces a *targeted* compression aimed at a stated next task, in a file. Where a fork will do — same machine, same harness, same directory — a fork is less work. The file wins the moment the destination is somewhere the fork can't go.

**When does something belong in `CLAUDE.md` instead?**
Ask whether it's true next month. `CLAUDE.md` is standing context about the project, loaded into every session whether it's relevant or not. A handoff is about one piece of work in flight and is dead once that work lands. Facts that keep getting re-explained are a `CLAUDE.md` problem; a half-finished task is a handoff.

**It captures the what, not the why.**
A fair and repeated criticism. Two things help. Pass the argument — tell it what the next session is for — so the reasoning that bears on *that* is kept rather than flattened. And watch for confident claims the session never actually verified: "X isn't built", "Y is done". The next agent treats the document as a contract and won't re-check, so an unverified belief written as a fact becomes work built on sand. Read the document before you hand it over, and downgrade anything you only assumed.

**Why is it a skill rather than a slash command?**
Both work; they suit different situations. As a skill it ships and updates through the same install path as everything else here, which is what makes it shareable — the constraint that the agent won't fire it itself is set by its frontmatter rather than by the mechanism.

## It's working if

- The document is a small fraction of the conversation, and the specs, issues and diffs appear in it as paths and URLs rather than as copied text.
- You can read it cold, without the original session open, and know what to do next.
- The fresh agent starts working instead of asking you to re-explain the setup.
- In the fork case, your original session is still sitting there untouched when you come back to it.
- The suggested-skills section names the skill you'd have reached for yourself.
- Nothing in it is a key, a token, or a password.

## Where it fits

`handoff` is a **reach-for-it-anytime standalone** that lives at the seam between sessions rather than inside a build chain — but a narrow one, and the honest map is that you'll use it less often than the other four options at a phase boundary. Its closest neighbour is [prototype](https://aihero.dev/skills-prototype), because a prototype lives in its own directory and the round trip out and back is exactly the crossing this skill is for. When you're at a boundary and unsure whether to continue, clear, hand off, delegate or compact, [ask-matt](https://aihero.dev/skills-ask-matt) carries the tree that orders those five — and routes you over the rest of the set.
