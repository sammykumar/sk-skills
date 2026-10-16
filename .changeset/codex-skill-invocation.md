---
"sk-skills": patch
---

Codex: stop the startup warning `failed to parse plugin hooks config ... unknown field 'modules'` by declaring an empty inline `hooks` object in `.codex-plugin/plugin.json`, so Codex no longer reads the Claude Code mods list at `hooks/hooks.json`. Skills that send you to `/setup-sk-skills` now also name the Codex spelling, `$setup-sk-skills`, and the install docs say that Codex reaches skills with `$name` or `/skills`, not `/name`.
