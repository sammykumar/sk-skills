---
"mattpocock-skills": patch
---

Remove six skills from the repo. None of them was in the Claude Code plugin, but all six were installable through [skills.sh](https://skills.sh/mattpocock/skills), which serves every skill in the repo — so this is what leaves that listing, and where each one went.

Four retired skills, each already absorbed by a skill that does the job better:

- **`ubiquitous-language`** → **`/domain-modeling`**, which builds and maintains the whole domain model rather than dumping a glossary from one conversation.
- **`design-an-interface`** → **`/codebase-design`**. Nothing is lost: the "design it twice" technique — parallel sub-agents generating radically different designs, from Ousterhout — ships inside that skill as `DESIGN-IT-TWICE.md`.
- **`qa`** → **`/triage`** and **`/to-tickets`**.
- **`request-refactor-plan`** → **`/to-spec`** and **`/improve-codebase-architecture`**.

And two that were only ever mine — tied to my own machine and never meant for anyone else. The `personal/` bucket goes with them:

- **`edit-article`**
- **`obsidian-vault`**, which hardcoded a path to my own Obsidian vault.

`skills/deprecated/` stays as a bucket, now empty. `skills/in-progress/` is unchanged and is now described for what it actually is: a beta channel, published on purpose, installable one skill at a time through skills.sh.
