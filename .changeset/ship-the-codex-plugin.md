---
"sk-skills": minor
---

Ship `sk-skills` as a native **Codex plugin**, alongside the Claude Code one. The promoted set now installs as a managed, read-only bundle on both harnesses:

```bash
codex plugin marketplace add sammykumar/sk-skills
codex plugin add sk-skills@sammykumar
```

This was deferred because Codex's manifest accepted `skills` only as a single path string, which could not express a curated subset of this repo's bucketed layout. On `codex-cli` 0.154.0 it accepts an array of explicit skill directories, exactly as the Claude manifest does, so `.codex-plugin/plugin.json` lists the same 34 promoted skills and nothing from `misc/` or `in-progress/` is registered. `.agents/plugins/marketplace.json` makes the repo its own single-plugin Codex marketplace, the counterpart to `.claude-plugin/marketplace.json`.

`/update-sk-skills` learned the new route. It now detects four installations rather than three, reading Codex's config for an `sk-skills@<marketplace>` table and whether it is enabled, and updating with `codex plugin marketplace upgrade` followed by a re-install, since there is no `codex plugin update`. Carrying both plugins is treated as expected rather than as a duplicate: they serve different harnesses from the same repo, so both get updated. A plugin alongside skills.sh is still the conflict that stops and asks.

`npm run check-plugin-version` now asserts both manifests track `package.json`, and `npm run version` syncs both. `npm run check-em-dashes` now skips `archive/`, whose retired skills are a frozen record of what they said when they were dropped.
