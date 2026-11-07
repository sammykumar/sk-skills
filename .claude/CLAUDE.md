# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A collection of agent **skills** (each a folder with a `SKILL.md`) shipped two ways: as the `sk-skills` plugin, on Claude Code (`.claude-plugin/plugin.json`) and on Codex (`.codex-plugin/plugin.json`), and as editable Agent Skills via skills.sh. There is no application to build or run: the "source" is Markdown instructions plus a small amount of glue (bash scripts, a handful of Node scripts, and test suites over the two that carry real logic). Every skill is dual-harness, carrying both a `SKILL.md` (Claude Code) and an `agents/openai.yaml` (Codex) that must stay in sync. `CONTEXT.md` holds the domain vocabulary (Issue tracker, Issue, Task, Open question, Triage role); read it before naming things. The `.agents/` folder holds the authoring docs referenced throughout this file (`invocation.md`, `writing-docs.md`, `install-block.md`, `adr/`).

This is a fork of https://github.com/mattpocock/skills, kept for local customization.

This file lives at `.claude/CLAUDE.md`, not the repo root, because the repo root is also the plugin root: `claude plugin validate . --strict` rejects a `CLAUDE.md` there, since a plugin never loads one as context. Claude Code reads it from `.claude/` as project memory all the same, and the root `AGENTS.md` symlinks here for Codex.

## Commands

- `claude plugin validate . --strict`: run after editing `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, or `.lsp.json`.
- `pnpm run check-plugin-version`: asserts both plugin manifests' versions match `package.json`; run after any of the three changes.
- `pnpm test`: runs Node's built-in test runner over `skills/**/*.test.mjs` and `scripts/**/*.test.mjs`; run after editing any skill's `.mjs` glue or a repo script that has a test suite.
- `pnpm run check-em-dashes`: fails if an em-dash reaches the repo's prose. Code is exempt, so a name quoted from another system stays verbatim inside a fence or a code span. `archive/` is exempt too: retired skills are kept as a frozen record of what they said when they were dropped, so restyling their prose would falsify the record. Chained onto `pnpm run version`, because regenerating `CHANGELOG.md` from the changesets is how these get in.
- `scripts/list-skills.sh`: list every `SKILL.md` path in the repo.
- `scripts/link-skills.sh`: symlink the repo's skills into the local harness directories for dogfooding; re-run after adding, removing, or renaming a skill. Dev-only, not an installer. Run it only from the canonical checkout: run from inside `.claude/worktrees/<slug>/`, it repoints every global symlink at a temporary directory that later disappears, and the failure is invisible until skills stop resolving in unrelated repos. If you are in a worktree, `cd` to the repo root first and confirm with `pwd`.
- `scripts/scaffold-ship.sh /path/to/repo [branch]`: cut a repo's `/ship` command from the canonical template into its `.claude/commands/ship.md`. See below.

### The `/ship` command (per-repo, from a template)

`/ship` is a project-local Claude Code command, not a plugin-distributed one: each repo carries its own `.claude/commands/ship.md`, tuned to that repo's real gates and deploy story. The plugin does not ship it. `.agents/ship-template.md` is the canonical source they are cut from: it holds the invariant spine (commit discipline, the attribution rules, branch-from-`origin` never HEAD, merge-not-squash, verify-don't-infer, honest report) as fixed prose, with two `REPO:` fill-in zones (`GATES`, `DEPLOY`) and a `{{DEFAULT_BRANCH}}` token. To stand one up in another repo, run `scripts/scaffold-ship.sh /path/to/repo [branch]`, then fill the two zones. When you improve the spine, edit the template; the per-repo copies are instances, so re-cut or hand-patch them to match.

### Release flow (changesets)

- `pnpm run changeset`: add a changeset describing any user-facing skill change.
- `pnpm run version`: applies changesets and runs `sync-plugin-version.mjs` to copy `package.json`'s version into `plugin.json`. Do not hand-edit either version.
- Push before you version. The changelog generator looks up the commit that added each changeset, so `changeset version` fails with `Cannot read properties of null (reading 'author')` when those commits exist only locally. Get them onto GitHub first.
- The changelog generator resolves PR and author links through the GitHub API, so `changeset version` needs a `GITHUB_TOKEN`. `scripts/changeset-version.mjs` wraps it and borrows the token from `gh auth token` when the variable is unset, so an authenticated `gh` CLI is enough. Set `GITHUB_TOKEN` yourself only where `gh` is not signed in, such as CI. Never commit a token.

## Skill authoring conventions

Skills are organized into bucket folders under `skills/`:

- `engineering/`: daily code work
- `productivity/`: daily non-code workflow tools
- `misc/`: kept around but rarely used, not promoted
- `in-progress/`: beta: public on purpose, feedback wanted, not shipped in the plugin
- `deprecated/`: no longer used

Every skill in `engineering/` or `productivity/` (the **promoted** buckets) must have a reference in the top-level `README.md` and an entry in **both** plugin manifests' `skills` arrays, `.claude-plugin/plugin.json` and `.codex-plugin/plugin.json` (the plugin ships exactly the promoted set, on both harnesses). The two arrays must match entry for entry. Skills in `misc/`, `in-progress/`, and `deprecated/` must not appear in any of them.

Install commands are copied verbatim from [.agents/install-block.md](./.agents/install-block.md). The repo is its own single-plugin marketplace on both harnesses: `.claude-plugin/marketplace.json` for Claude Code, `.agents/plugins/marketplace.json` for Codex. Run `claude plugin validate . --strict` after touching the Claude manifests. The Codex side has no validator, so verify it the way it was verified originally: `codex plugin marketplace add <repo path>`, `codex plugin add sk-skills@sammykumar`, then `codex debug prompt-input` to confirm which skills registered. Do that against a throwaway `CODEX_HOME`, never the real one, because installing the plugin for real makes `scripts/link-skills.sh` tear down this repo's global Codex symlinks. How both plugins came to ship, and what was measured to get there, lives in [.agents/adr/0002-ship-as-a-claude-code-plugin.md](./.agents/adr/0002-ship-as-a-claude-code-plugin.md).

Each skill entry in the top-level `README.md` must link the skill name to its `SKILL.md`.

Each bucket folder has a `README.md` that lists every skill in the bucket with a one-line description, with the skill name linked to its `SKILL.md`. The promoted buckets' `README.md`s and the top-level `README.md` group entries into **User-invoked** and **Model-invoked**; non-promoted bucket `README.md`s (`misc/`, `in-progress/`) use a flat list.

Skills in `engineering/` and `productivity/` also have a human-facing docs page at `docs/<bucket>/<skill-name>.md` (the docs tree mirrors those two bucket folders under `skills/`). These are in-repo docs pages: the docs path is repo organisation only. When you add, rename, or change the behaviour of a skill in `engineering/` or `productivity/`, create or re-sync its docs page following [.agents/writing-docs.md](./.agents/writing-docs.md). A finished page carries four sections: **What it does**, **When to reach for it**, **Common questions**, and **It's working if**. `writing-docs.md` holds the template, the section order, and where to hunt for the questions. Skills in the non-promoted buckets (`misc/`, `in-progress/`, `deprecated/`) get **no** docs page.

Every `SKILL.md` is either user-invoked (`disable-model-invocation: true` plus `policy.allow_implicit_invocation: false` in `agents/openai.yaml`, reachable only by the human) or model-invoked (model- or user-reachable). See [.agents/invocation.md](./.agents/invocation.md).

[`ask-sk`](./skills/engineering/ask-sk/SKILL.md) is the router that maps every user-reachable skill and how they relate. The same trigger that re-syncs a docs page applies to it: whenever you add, rename, remove, or change how a user-reachable skill fits the flows, re-read `ask-sk`'s `SKILL.md` and update it so the map stays accurate: a new skill it never mentions, or a stale one it still routes to, is a router that lies.

To (re)link the repo's skills for local dogfooding, run `scripts/link-skills.sh`. Each entry is a symlink into this repo, so a `git pull` keeps them current; re-run the script after adding, removing, or renaming a skill.

Where each skill lands depends on whether the `sk-skills` plugin already ships it, because a skill served from both places would exist twice in every repo, once pinned to a release and once pointing at the working tree, with no way to tell which is running:

| Destination | Skills | Scope |
| --- | --- | --- |
| `<repo>/.claude/skills` | promoted (`engineering/`, `productivity/`) | this repo only, where dogfooding happens |
| `~/.claude/skills` | non-promoted (`misc/`, `in-progress/`) | Claude Code, everywhere |
| `~/.agents/skills` | every skill | Codex, everywhere, only when the Codex SK Skills plugin is disabled |

The script prunes the repo-local directory on every run, so a renamed or demoted skill does not linger as a stale symlink. When the Codex SK Skills plugin is enabled, it also removes this repo's global Codex links so each skill has one registration path. Everywhere else, the promoted skills come from the plugin, which this repo disables in `.claude/settings.json` so the working-tree copies win here and only here.

No em-dashes anywhere in this repo's prose (`SKILL.md` files, docs, `README.md`, `CHANGELOG.md`, ADRs, changesets, code comments). Where a sentence reaches for one, rewrite it instead with a comma, colon, period, parentheses, or a conjunction, whichever the sentence actually wants; never do a blind character substitution.

## Language servers

The plugin ships one thing that is not a skill: `.lsp.json` at the repo root, which declares the language servers Claude Code should launch. It is plugin configuration, not a stray file, and it is deliberately a separate file rather than an inline `lspServers` block in `plugin.json`, because LSP config declared in a manifest has a history of not surviving plugin installation. Language servers are Claude Code only, with no Codex equivalent, so a skill that documents one says so in its own body rather than promising navigation Codex cannot perform. The reasoning is in [.agents/adr/0008-ship-language-servers-not-a-bundled-lsp-client.md](./.agents/adr/0008-ship-language-servers-not-a-bundled-lsp-client.md).

A plugin configures a language server, it never bundles one, so every entry has a binary the user installs themselves. Leave the optional fields unset unless there is a reason not to: before Claude Code v2.1.205, setting `restartOnCrash` or `shutdownTimeout` caused the server to be skipped entirely, with the reason visible only under `claude --debug`.

## Mods

The plugin also ships Claude Code mods: function hooks that draw into the session (a band above the prompt, a pane, a status line entry, a toast) or react to its events. They live under `hooks/`, one folder per mod (`hooks/<mod>/register.tsx` plus its helpers and `*.test.ts`), and each is listed in `hooks/hooks.json`'s `modules` array. Values a mod keeps in `$.state` are declared under the plugin's own name, `sk-skills`, in `types/index.d.ts`, which `plugin.json` names as `types`. Mods are Claude Code only, with no Codex equivalent. `.codex-plugin/plugin.json` declares an empty inline `hooks` object so Codex does not read `hooks/hooks.json` as its own hooks file; keep it there.

- `claude plugin test .`: runs every mod's tests.
- `claude plugin validate .`: reports what each mod hooks and calls, and anything the engine would refuse.

| Mod | What it does |
| --- | --- |
| `repo-status` | One view only: the `repo-status` pane, opened at session start and on any surface that attaches later, reopened by `/repo-status` (which prints nothing). Four sections, each headed by a `Title ──── count` rule in the `suggestion` theme color; colors are Claude Code theme keys, so they follow light and dark. **Repo**: a 50/50 row, branch (bold, truncating), worktree name and `● N changed` / `✓ clean` with ahead/behind on the left; on the right the latest CI run for the branch from `gh run list --branch <b> --limit 1` (plus `gh run view --json jobs` while running or failed), polled every 15s while a run moves and every 2 min once settled; no `gh`, no auth or no GitHub remote shows `CI unknown`. **Tasks**: the session's task file, never configured: the latest `.md` with `- [ ]` lines this session created (Write to a path that did not exist), else the latest one it wrote or edited, from any loop. Rendered by heading with a done/total bar; done groups and groups after the next open task start folded. A checkbox press rewrites that one line; clicking a task's text opens an inline `Input` for just that line, Enter rewrites it (empty deletes it); `+ Add a task` appends after the group's last task. Every edit re-reads the file first and refuses when the line no longer matches what was drawn, so an edit made in VS Code or by Claude is never overwritten silently: the row shows `Changed on disk` with Use theirs / Keep mine. The file is re-read whenever its mtime moves (10s tick). `Open` runs `code -r <file>` (falling back to the system opener); `Source` shows the raw markdown. **In flight**: background shells and monitors with their last output line (tailed every 10s), subagents still pending/running/waiting, and the next `ScheduleWakeup`; a row moves to **Finished** on its `<task-notification>`, on `TaskStop`, or when its agent stops, and finished rows stay ten minutes. **Next**: after each answered main-loop turn a low-effort `$.model.fork` names up to three likely next prompts; the first is a `claude`-bordered card with the prompt it sends, the rest secondary buttons with digit hotkeys. The host draws the pane's title bar, so the mod cannot change it. **Export for an editor extension:** once a second each session writes its state (repo, CI, task file path, in flight, finished, next actions) and its tab title (the transcript's latest `custom-title`, else `ai-title`) to `~/.claude/repo-status/<session id>.json`, rewritten on change and every 5s as a heartbeat, removed at session end. An extension queues prompts in `<session id>.inbox.json`, which the mod submits and deletes, and announces itself in `.extension.json` (`{ updatedAt }`); while that heartbeat is under 30s old the built-in pane stays closed, so the extension's pane is the only one. |

## Agent skills

### Issue tracker

Tasks and specs live as markdown files under `docs/tasks/`, kept separate from the flat design records in `docs/plans/`. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical role names, used verbatim. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` at the root, ADRs in `.agents/adr/`. See `docs/agents/domain.md`.
