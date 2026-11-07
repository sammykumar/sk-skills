---
"sk-skills": patch
---

`repo-status`'s published session state now includes `interactedAt`: when you last typed in that session's prompt box, sent it a prompt, or pressed one of its suggestions in an editor extension. An extension can use it to show the session you're actually working in, including the chat in the Claude sidebar, which has no editor tab. The tab title is also re-read every 5 seconds instead of every 15.
