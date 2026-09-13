# The canonical install block

One install story, one wording. `README.md`, `.changeset/*`, and every page under `docs/` must say **this** and nothing else. Change it here first, then propagate.

`sk-skills` ships from this repo's own single-plugin marketplace, on both harnesses: `.claude-plugin/marketplace.json` for Claude Code and `.agents/plugins/marketplace.json` for Codex both make `sammykumar/sk-skills` an installable marketplace. You add the marketplace once, then install the plugin from it. This is not in any official marketplace on either side, so it must be added before it can be installed, and updates arrive when you re-run the install (or refresh the marketplace), not automatically.

## Claude Code: the plugin

<canonical-block name="claude-code">

```bash
claude plugin marketplace add sammykumar/sk-skills
claude plugin install sk-skills@sammykumar
```

Or, from inside a session:

```
/plugin marketplace add sammykumar/sk-skills
/plugin install sk-skills@sammykumar
```

It ships from this repo's own marketplace, so add the marketplace first, then install. To pull later updates, re-run the install or `/plugin marketplace update sammykumar`.

</canonical-block>

## Codex: the plugin

<canonical-block name="codex">

```bash
codex plugin marketplace add sammykumar/sk-skills
codex plugin add sk-skills@sammykumar
```

Same marketplace, same promoted set. To pull later updates, run `codex plugin marketplace upgrade` and then re-run the install.

</canonical-block>

Codex reads `.codex-plugin/plugin.json`, whose `skills` array lists the same promoted skills as the Claude manifest. The two manifests are separate files that must stay in step: the skills arrays match entry for entry, and `npm run check-plugin-version` asserts both versions track `package.json`.

## Other agents: skills.sh

Outside Claude Code and Codex, [skills.sh](https://skills.sh/sammykumar/sk-skills) copies editable skill files into the project. Use the whole-set form on `README.md`:

<canonical-block name="skills-sh-whole-set">

```bash
npx skills@latest add sammykumar/sk-skills
```

Pick the skills you want, and which coding agents to install them on. **The installer lets you choose which skills to take: make sure `setup-sk-skills` and `update-sk-skills` are both among them.**

</canonical-block>

…and the single-skill form wherever one skill is named on its own. Note that **`docs/` pages are not a consumer of this block**: a page that writes the commands out duplicates the install instructions, so keep the docs pages command-free. See [writing-docs.md](./writing-docs.md).

<canonical-block name="skills-sh-one-skill">

```bash
npx skills@latest add sammykumar/sk-skills --skill=<name>
```

```bash
npx skills@latest update <name>
```

</canonical-block>

`skills@latest` is the pinned spelling in all three.

## Updating

Which command updates an installation depends on which route installed it, and a user cannot be assumed to know. `/update-sk-skills` detects the route from the evidence on disk and runs the right command, so it is the answer to "how do I update", on every route and in every harness.

<canonical-block name="updating">

Run `/update-sk-skills`. It detects how the skills were installed on this machine (plugin, skills.sh, or a dev checkout) and runs the matching update, rather than assuming a route from the harness you happen to be in.

</canonical-block>

## The two routes are exclusive

The plugin is a managed, read-only bundle you subscribe to. skills.sh writes files you own and edit. Installing both leaves the user with every skill twice: always say "pick one".
