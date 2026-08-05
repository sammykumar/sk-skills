---
"mattpocock-skills": patch
---

Give `/ask-matt` the **phase boundary** decision tree, replacing the two-bullet `Crossing sessions` section.

A **phase** is a chunk of work inside a session — the grilling, the implementation, the QA — and the boundary between two of them is where you decide what to do with the context you've built. The router now carries all five options in order (**continue**, `/clear`, `/handoff`, **subagent**, `/compact`), with the ordered tree and its reasoning disclosed in a new `PHASE-BOUNDARIES.md`. Three fixes come with it:

- **`/handoff` was oversold.** It read as the general bridge between context windows. It's narrow: you need it only when something has to *travel* — a new harness, a new directory, a colleague, or a side task forked mid-phase. What it buys is portability.
- **`/compact` is the default, not the first reach.** It sits at the bottom of the tree, after the four cheaper or more precise questions above it. Starting there produces a session that's confidently wrong about whatever the summary flattened.
- **Two branches were missing entirely.** **Continue** is the one to rule out first — it's the only move that keeps the conversation as a primary source rather than a summary of one — and a **subagent** handles anything scoped tightly enough to run AFK.

Context hygiene's escape hatch now says `/compact` rather than `/handoff` (same harness, same directory, at a boundary — the handoff clause doesn't apply), and the smart zone figure is updated from ~120k to ~150k tokens.
