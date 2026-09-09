---
name: migrate-to-tasks
description: "Migrate a repo off the retired 'ticket' vocabulary: rename the skill invocations, move Repo PDD Markdown work to the tasks/ layout, and re-word existing issues as tasks or open questions. Run once per repo that used sk-skills before the ticket-to-task rename."
disable-model-invocation: true
---

# Migrate to Tasks

sk-skills retired the word **ticket**. A repo configured before that rename carries the old vocabulary in three places at once: its own prose and commands, its on-disk tracked work, and the issues already filed on its tracker. This skill migrates all three.

Plans and specs keep their names and their homes. Only tickets change, and they do not all become the same thing.

| Before | After |
| --- | --- |
| `/to-tickets` | `/to-tasks` |
| `/splitting-tickets` | `/splitting-tasks` |
| a ticket produced by `to-tickets` | a **Task** |
| a decision ticket under a `wayfinder:map` | an **Open question** |
| `docs/issues/<slug>/issues/<NN>-<slug>.md` | `docs/tasks/<slug>/tasks/<NN>-<slug>.md` |
| `<PLAN_DIR>/<slug>/issues/<NN>-<slug>.md` | `<TASK_DIR>/<slug>/tasks/<NN>-<slug>.md` |
| a design record in `docs/plans/` | unchanged |
| a spec (`spec.md`) | unchanged |

**Issue** is not retired. It is the genus: the name for anything tracked, whatever the tracker calls it. **Task** and **Open question** are the two species under it. A sentence that is true of any tracked unit keeps the word "issue".

## The one call this skill has to get right

Every existing ticket is either a Task or an Open question, and the difference is not cosmetic: a Task is a slice of a build to execute, an Open question is a question whose resolution is a decision. Sort by provenance, not by reading the title:

- **Open question** if it is a child of a `wayfinder:map` issue, or lives under an effort directory that contains a `map.md`, or carries a `wayfinder:<type>` label.
- **Task** otherwise: anything `to-tickets` or `splitting-tickets` produced, anything with tracer-bullet acceptance criteria and blocking edges.
- **Neither** if it is an ordinary bug report or a request someone filed by hand. Leave it alone. It was an Issue before the rename and it still is one.

Watch for the collision before you rewrite any wayfinder text: `task` is also the name of one of wayfinder's four **open question types**, the one that does rather than decides in order to unblock a decision. A `wayfinder:task` is an Open question, not a Task. Renaming it to "task" in the `to-tasks` sense is the specific error this skill exists to avoid making at scale.

## Process

This is a prompt-driven migration, not a script. Explore, show the user the plan, confirm, then act.

### 1. Detect what this repo is actually on

Read before assuming. A repo may carry only some of the old vocabulary.

- `docs/agents/issue-tracker.md`: which tracker is configured, and what paths does it name? This file is the migration's source of truth for where tracked work lives.
- Where tracked work actually sits today. A pre-rename repo used the old `PLAN_DIR` sweep, so look in `docs/plans/`, `docs/issues/`, `docs/plan/`, `plans/`, `plan/`, `docs/specs/`, `specs/`, `.scratch/`. The giveaway is a `<dir>/<slug>/issues/` subdirectory or a `<dir>/<slug>/spec.md`.
- Whether `docs/plans/` is doing two jobs at once. Under the old convention it was both the default task directory and the home of the flat design records `recording-designs` writes, and those two are now separate trees. Where it holds both, move only the per-feature directories (the ones with a `spec.md` or an `issues/` subdirectory) into `docs/tasks/`, and leave the flat dated records where they are. Where it holds only flat records, there is nothing to move.
- Any `<dir>/<slug>/issues/` subdirectories: these are the per-feature task directories under the old name.
- Any `map.md`: each one marks an effort whose children are Open questions, not Tasks.
- `CLAUDE.md`, `AGENTS.md`, `CONTEXT.md`, and `.claude/commands/`: the repo's own prose and project commands, which may invoke `/to-tickets` by name.
- `grep -ri ticket` across the repo, excluding `.git/`, `node_modules/`, and `CHANGELOG.md`.

Report the counts before proposing anything: how many files mention tickets, how many per-feature directories need moving, how many live issues are in scope.

### 2. Present the plan and confirm

Show the user, in one message: the file renames, the directory moves, the classification of each existing effort as Tasks or Open questions, and the count of live tracker issues you would touch. Ask for a yes before writing.

Where a ticket's classification is genuinely ambiguous, list it and ask rather than guessing. A misfiled Open question reads as a build slice forever after.

### 3. Migrate the repo's own files

Work on a branch, never on the default branch.

- Swap the word: ticket to task, tickets to tasks, preserving case and plurality. Compounds too (`ticket-sized`, `per-ticket`).
- Except in wayfinder context, where a ticket becomes an **open question**. Reword rather than substituting: "open question" is longer than "ticket" and some sentences need reshaping. "Open tickets are not listed" becomes "Unresolved open questions are not listed", not "Open open questions".
- Rename the invocations: `/to-tickets` to `/to-tasks`, `/splitting-tickets` to `/splitting-tasks`, in prose, in `.claude/commands/`, and in any project command that chains them.
- Leave "issue" alone wherever it means the genus or a real tracker: "GitHub Issues", "issue number", "child issue", "issue tracker", `docs/agents/issue-tracker.md`.
- Leave `CHANGELOG.md` and any released release notes verbatim. They record what the words were at the time.
- Leave quoted material verbatim. A field report or a user's own words that say "ticket" stay as written; the rename applies to the repo's voice, not to quotes.

If the repo has a `CONTEXT.md`, add the new terms rather than silently swapping: **Task** and **Open question** as species, **Issue** kept as the genus, and a flagged-ambiguity line recording that "ticket" was retired. That line is what stops the old word drifting back in.

### 4. Move the tracked work on disk

Only for repos on the Repo PDD Markdown tracker. Use `git mv` so history follows the files.

- The task directory becomes `docs/tasks/`. Where the repo kept tracked work under `docs/issues/`, or under `docs/plans/` because that was the old default, move the per-feature directories across.
- Each per-feature `<dir>/<slug>/issues/` becomes `docs/tasks/<slug>/tasks/`, numbering and filenames unchanged.
- `spec.md` moves with its feature directory and keeps its name.
- The flat, dated design records in `docs/plans/` stay put. Those are what `recording-designs` writes, a separate tree from tracked work. Moving them into `docs/tasks/` is the other error worth naming, because the two directories were genuinely interchangeable under the old convention: `docs/plans/` was the default task directory *and* the design-record home. Sort by shape, not by name. A per-feature directory with a `spec.md` or an `issues/` subdirectory is tracked work and moves; a flat dated file is a design record and stays.
- The tracker template's token was renamed with the directory: `{{PLAN_DIR}}` is now `{{TASK_DIR}}`, defaulting to `docs/tasks/`. A repo that hand-edited its `docs/agents/issue-tracker.md` will not have the token in it at all, only the substituted path, which is the thing to update.
- Then update `docs/agents/issue-tracker.md` so its documented paths match what you just did. A tracker doc that describes the old layout sends every later session to the wrong directory.
- Finally, fix cross-references: any file linking to a moved path.

### 5. Migrate live tracker issues

**Do not mutate a live tracker without an explicit yes for that batch.** Read all you want; propose the exact edits and let the user approve them. Approval is per batch, not per session.

- Rewrite titles and bodies only where the word "ticket" actually appears. An issue that never used the word needs no edit.
- Labels: `wayfinder:map` and the four `wayfinder:<type>` labels are unchanged. Do not rename them.
- Triage labels are unchanged: the five canonical roles keep their strings.
- Closed issues are history. Leave them unless the user asks otherwise.
- Prefer the tracker's own CLI (`gh`, `glab`) over a browser, and batch the edits so the user can review a list rather than a stream.

### 6. Verify, and say what you verified

- `grep -ri ticket` again over the migrated tree. Every remaining hit should be one you deliberately kept: `CHANGELOG.md`, a quote, or an external system that calls them tickets. List them for the user rather than reporting a clean sweep you did not get.
- Check that every link you repointed resolves on disk.
- Re-read the sentences you rewrote. A blind substitution leaves broken article agreement ("a open question") and sentences that say "task" three times in one clause.
- Report what you changed, what you deliberately left, and anything you could not classify.
