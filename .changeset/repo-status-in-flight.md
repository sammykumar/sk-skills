---
"sk-skills": minor
---

`repo-status` now shows the background work that is still running, so you can see progress without asking for a status update. Under the git line, each background shell or monitor gets a row with how long it has been running and the last line of its output, refreshed every 10 seconds. Running subagents and the next scheduled check-in get rows too. A row clears when the task's completion notification arrives or the task is stopped. The pane and `/repo-status` list every row; the band above the prompt shows the first three.
