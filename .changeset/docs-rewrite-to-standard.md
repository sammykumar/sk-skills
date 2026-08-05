---
"mattpocock-skills": patch
---

Rewrite every human-facing docs page to the four-section standard. Each page now states the skill's defining constraint, says when to reach for it and when to reach for something else, answers the questions people actually ask, and names what you see when it is working. The questions were found rather than invented — in the issue tracker, in the community threads, and in the changesets — so a well-discussed skill like `wayfinder` carries ten and a quiet one like `resolving-merge-conflicts` carries three.

Writing them surfaced claims elsewhere that were no longer true. `tdd` now points at `/codebase-design` for interface vocabulary, which the v1.0 changelog said had already happened but which was never wired up. `ask-matt` gains `/grilling` and `/resolving-merge-conflicts`, both previously missing from the router altogether, and splits `grill-me` from `grill-with-docs` on whether you are in a working directory. The READMEs stop calling wayfinder's map one of investigation tickets, stop dropping the first phase from the `diagnosing-bugs` loop, and stop promising that `improve-codebase-architecture` will rescue a ball of mud when what it does is survey one.
