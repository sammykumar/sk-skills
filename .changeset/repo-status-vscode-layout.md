---
"sk-skills": patch
---

`repo-status` now lays out correctly in the VS Code pane. Section headers keep the title and count on one line, Repo shows branch and CI side by side, and colored parts of a row (the changed dot, CI state, task icons) keep their colors. CI now finds `gh` even when the editor's PATH doesn't include it, and shows why CI is unavailable (gh not found, not signed in, no GitHub remote) instead of "CI unknown".
