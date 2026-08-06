---
"mattpocock-skills": patch
---

Make the subagent-dispatch instructions harness-neutral.

`code-review`, `codebase-design`'s `DESIGN-IT-TWICE.md`, and `improve-codebase-architecture` named Claude Code's `Agent` tool and its `general-purpose` / `Explore` agent types directly. Codex and other Agent-Skills harnesses have no such tool or type, so the instruction was unfollowable there. Each now describes the *shape* of the dispatch — parallel subagents, and what capability each one needs — and leaves the mechanism to the harness.
