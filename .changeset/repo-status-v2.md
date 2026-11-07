---
"sk-skills": minor
---

`repo-status` v2: the pane now shows four sections.

- **Repo** puts the branch and working-tree state beside the latest CI run for the branch, read with the GitHub CLI, including which jobs failed.
- **Tasks** shows the checklist this session wrote, picked automatically with nothing to configure. Tick a box, click a line to edit it in place, or add a task, and the change goes straight into the markdown file. If the line changed on disk since it was drawn, the pane asks before overwriting. `Open` opens the file in VS Code.
- **In flight** is restyled, and a new **Finished** list keeps tasks that just ended, with how they ended, for ten minutes.
- **Next** shows the top suggestion as a card with the prompt it will send.
