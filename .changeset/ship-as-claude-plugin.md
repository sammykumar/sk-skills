---
"mattpocock-skills": minor
---

Ship the skill set as a native **Claude Code plugin**, listed in Claude Code's official marketplace. You can now subscribe to the promoted skills as a managed, read-only bundle instead of copying editable files:

```bash
claude plugins install mattpocock-skills
```

Or, from inside a session:

```
/plugin install mattpocock-skills
```

There is no marketplace to add first — the official marketplace is configured by default.

`.claude-plugin/plugin.json` carries the full plugin metadata (version, description, author, license, keywords) and the explicit list of promoted skills. `skills.sh` remains the universal installer (and the path for Codex and other harnesses today); a native Codex plugin is deferred — see `.agents/adr/0002-ship-as-a-claude-code-plugin.md` for why.
