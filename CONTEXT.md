# SK Productions Skills

A collection of agent skills (slash commands and behaviors) loaded by Claude Code. Skills are organized into buckets and consumed by per-repo configuration emitted by `/setup-sk-skills`.

## Language

**Issue tracker**:
The tool that hosts a repo's issues: GitHub Issues, Linear, a Repo PDD Markdown convention (`docs/tasks/`), or similar. Skills like `to-tasks`, `to-spec`, and `triage` read from and write to it.
_Avoid_: backlog manager, backlog backend, issue host

**Issue**:
The genus: a single tracked unit of work inside an **Issue tracker**. A bug, a spec, a **Task**, or an **Open question** is each an Issue.
_Avoid_: ticket (use only when quoting an external system that calls them tickets)

**Task**:
The species produced by `to-tasks` / `splitting-tasks`: a tracer-bullet vertical slice of a build, sized to one agent session, declaring the Tasks that block it. An implementation unit, so it is the counterpart to an **Open question**, which decides rather than builds.
_Avoid_: ticket

**Open question**:
A `wayfinder` unit: a child **Issue** of a `wayfinder:map` holding a *question* whose resolution is a decision, not a slice of a build to execute. The counterpart to a **Task**. Note that one of wayfinder's four Open question *types* is itself called `task` (the type that does rather than decides, to unblock a decision); that type is not a **Task** in the `to-tasks` sense.
_Avoid_: decision ticket, ticket

**Triage role**:
A canonical state-machine label applied to an **Issue** during triage (e.g. `needs-triage`, `ready-for-afk`). Each role maps to a real label string in the **Issue tracker** via `docs/agents/triage-labels.md`.

**Session transcript**:
The on-disk record of a past agent session: one JSONL file per session, written by Claude Code under `~/.claude/projects/<cwd-slug>/` and by Codex under `~/.codex/sessions/<Y>/<M>/<D>/`. Read-only input to `setup-sk-skills`; never written by any skill here.
_Avoid_: session log, chat history, conversation file

**User vocab**:
The language the user actually types, as distinct from the language the codebase is named in. Mined from **Session transcripts** and proposed as terms for `CONTEXT.md`. A single proposed item is just a *term*, unaccepted until the user confirms it.
_Avoid_: user's words, mined vocabulary, vocab corpus

**Matt's plugin**:
The upstream `mattpocock-skills` plugin this repo forked from. Installed alongside `sk-skills` and disabled per-repo while dogfooding, so the locally symlinked skills win.
_Avoid_: matt's skills

**Plugin marketplace**:
The marketplace listing that serves `sk-skills` to a **Consumer repo**. This repo is its own single-plugin marketplace on both harnesses: `.claude-plugin/marketplace.json` for Claude Code, `.agents/plugins/marketplace.json` for Codex.

**Plugin manifest**:
The per-harness file declaring the plugin's identity and its promoted `skills` array: `.claude-plugin/plugin.json` for Claude Code, `.codex-plugin/plugin.json` for Codex. The two carry the same skill list and the same version, and both are kept in step by hand plus `scripts/sync-plugin-version.mjs`.
_Avoid_: "the plugin.json" where which harness is meant matters

**Consumer repo**:
A repo that installs the skills as a published plugin, as opposed to this repo, which runs them live from the working tree via `scripts/link-skills.sh`.
_Avoid_: other repos

**Slash command**:
A `/name` invocation. It covers two different things and the distinction matters: a **user-invoked skill** (`disable-model-invocation: true`) ships in the plugin, while a project command like `/ship` lives in a repo's own `.claude/commands/` and is not a skill at all.
_Avoid_: "slash command" where the repo's docs say "user-invoked skill"

## Relationships

- An **Issue tracker** holds many **Issues**
- An **Issue** carries one **Triage role** at a time
- A **Task** is an **Issue** (a slice of a build, produced by `to-tasks`)
- An **Open question** is an **Issue** (a child of a `wayfinder:map`)
- A **Plugin marketplace** serves the plugin to many **Consumer repos**
- **User vocab** is mined from many **Session transcripts** and becomes terms in this glossary only once the user accepts them

## Flagged ambiguities

- "backlog" was previously used to mean both the *tool* hosting issues and the *body of work* inside it. Resolved: the tool is the **Issue tracker**; "backlog" is no longer used as a domain term.
- "backlog backend" / "backlog manager". Resolved: collapsed into **Issue tracker**.
- "ticket" was the repo's word for both an implementation slice and a wayfinder question. Resolved: the slice is a **Task**, the question is an **Open question**, and "ticket" is retired except when quoting an external system that uses it. The skills renamed with it: `/to-tickets` is now `/to-tasks`, `/splitting-tickets` is now `/splitting-tasks`.
- **Issue** and **Task** are not synonyms, though the repo once used "ticket" for both. Issue is the genus (anything tracked); Task is the implementation species. Reach for **Task** when the unit is a slice to build, **Issue** when the statement is true of any tracked unit.
