---
"mattpocock-skills": patch
---

Finish the `to-prd` → `to-spec` rename: "spec" is now the only term in the shipped text.

- **`to-spec`** no longer opens with "you may know this document as a PRD" — the parenthetical is dropped from the skill and its docs page. The local-markdown tracker template drops the same hedge.
- **`code-review`** talks about the originating issue/spec rather than issue/PRD, in its frontmatter description, its two-axis summary, and the spec-source search order. Both READMEs re-synced.
- **The GitHub and GitLab tracker templates** now say "Issues and specs for this repo live as GitHub/GitLab issues" — they had been left on "PRDs" when the local template was updated, so the stale term propagated into every repo they were written into.
- **`docs/engineering/research.md`** pointed at `https://aihero.dev/skills-to-prd`, a dead slug for the renamed skill; it now links `to-spec` like the other nineteen docs pages do.

The CHANGELOG and existing changesets still name PRDs where they document the rename itself, which is correct.
