---
"sk-skills": minor
---

`repo-status` now suggests what to do next. After each answered turn, up to three likely next prompts appear as buttons under the status, for example "1 Open the PR". Pressing one, or its number while the band has focus, sends that prompt for you. The buttons hide while Claude is working and clear as soon as you send anything else. Each suggestion costs one small, low-effort model call that reuses the session's cached context.
