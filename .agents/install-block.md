# The canonical install block

One install story, one wording. `README.md`, `.changeset/*`, and every page under `docs/` say **this** and nothing else. If the install route changes, change it here first, then propagate.

`mattpocock-skills` is listed in **Claude Code's official marketplace** (`claude-plugins-official`), which every Claude Code install has configured out of the box. There is no marketplace to add first, and official-marketplace plugins auto-update in the background.

## Claude Code (the plugin)

<canonical-block>

```bash
claude plugins install mattpocock-skills
```

Or, from inside a session:

```
/plugin install mattpocock-skills
```

It's in Claude Code's official marketplace, so there's nothing to add first, and updates arrive automatically.

</canonical-block>

## Codex, and other agents (skills.sh)

The plugin is Claude Code only. Everywhere else, [skills.sh](https://skills.sh/mattpocock/skills) copies editable skill files into the project:

```bash
npx skills@latest add mattpocock/skills
```

For a single skill, `npx skills add mattpocock/skills --skill=<name>`; to refresh it later, `npx skills update <name>`.

## The two routes are exclusive

The plugin is a managed, read-only bundle you subscribe to. skills.sh writes files you own and edit. Installing both leaves the user with every skill twice — always say "pick one".

## Not the install story

`.claude-plugin/marketplace.json` makes the repo its own single-plugin marketplace (`/plugin marketplace add mattpocock/skills`, then `/plugin install mattpocock-skills@mattpocock`). The official listing supersedes it. It is kept as a fallback for installing the repo directly — an unreleased commit, or a fork — and is **not** documented to users.
