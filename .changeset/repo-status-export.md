---
"sk-skills": minor
---

`repo-status` now publishes each session's state for editor extensions. Every second, a session writes its branch, CI, task file, running and finished work, next-prompt suggestions and tab title to `~/.claude/repo-status/<session id>.json`. An extension can queue prompts in `<session id>.inbox.json`, and the session sends them. While an extension reports itself live in `.extension.json`, the built-in pane stays closed, so only one pane shows.
