## What it does

Migrates a repo off the retired word "ticket". It renames the two invocations that carried it (`/to-tickets` becomes `/to-tasks`, `/splitting-tickets` becomes `/splitting-tasks`), moves Repo PDD Markdown work into the `tasks/` layout, and re-words the tracked work that already exists.

The migration is not a find-and-replace, because "ticket" turned out to name two different things. A slice of a build to execute is now a **task**; a wayfinder unit holding a question whose resolution is a decision is now an **open question**. The skill sorts every existing ticket into one or the other by where it came from, never by reading its title, because a title is exactly the thing that stops distinguishing them once both were called tickets.

## When to reach for it

You invoke this by typing `/migrate-to-tasks`, and the agent won't reach for it on its own.

Reach for it once per repo, in any repo you configured before the rename landed. The tell is a `/to-tickets` invocation in your own prose, a `<dir>/<slug>/issues/` directory, or a `docs/issues/` tree. Run it right after `/update-sk-skills` on an older repo, since the updated skills expect the new vocabulary and will write it whether or not the repo has caught up.

Nothing to migrate in a repo set up after the rename. It is a one-shot, not maintenance.

## Prerequisites

The repo needs `docs/agents/issue-tracker.md`, written by [setup-sk-skills](../engineering/setup-sk-skills.md). That file is the migration's source of truth for where tracked work lives, and the skill rewrites it last so its documented paths match what actually moved.

## Task, open question, or neither

Three outcomes, sorted by provenance:

| What it is | Becomes |
| --- | --- |
| A child of a `wayfinder:map`, or under an effort directory with a `map.md`, or labelled `wayfinder:<type>` | An **open question** |
| Anything `to-tickets` or `splitting-tickets` produced: tracer-bullet slices with blocking edges | A **task** |
| An ordinary bug report or a hand-filed request | Neither. It was an issue before and it still is one |

**Issue** is not retired, which is the part most likely to be over-corrected. It is the genus, the name for anything tracked, and task and open question are the two species under it. A sentence true of any tracked unit keeps the word "issue".

The one trap worth naming up front: `task` is also the name of one of wayfinder's four **open question types**, the one that does rather than decides in order to unblock a decision. A `wayfinder:task` is an open question, not a task. Renaming it into a task is the specific error this skill exists to avoid making a hundred times in one pass.

## What it leaves alone

`docs/plans/` keeps its contents. Those are the flat, dated design records [recording-designs](../engineering/recording-designs.md) writes, a separate tree from tracked work, and the two directories looked interchangeable under the old convention. `CHANGELOG.md` and released notes stay verbatim, because they record what the words were at the time. Quoted material stays verbatim too: the rename applies to the repo's own voice, not to a user's.

On a live tracker the default is read-only. The skill proposes the exact edits and waits for a yes on each batch, rather than rewriting a hundred issue bodies and telling you afterwards.

## Common questions

**I ran it and `grep -i ticket` still finds hits. Did it fail?**
Probably not. A correct migration leaves the deliberate keeps: `CHANGELOG.md`, quoted material, and any external system that genuinely calls them tickets. The skill lists what it kept rather than claiming a clean sweep, so compare against that list before treating a hit as a miss.

**Do my GitHub issue numbers change?**
No. Nothing is closed, recreated, or renumbered. Titles and bodies are edited in place, and only where the word actually appears. An issue that never said "ticket" is not touched.

**What happens to work that is already in flight?**
Open work migrates with everything else; closed issues are history and are left alone unless you ask otherwise. The risk worth knowing about is a session started before the migration and finished after it, which will write the old paths from memory. Finish or restart those rather than merging them.

**Why is `docs/plans/` still there? I thought plans became tasks.**
Plans and specs kept their names. Only tickets changed. `docs/plans/` holds design records, `docs/tasks/` holds tracked work, and the split is the same one that existed before, now with names that no longer collide.

## It's working if

- The count it reports up front matches what you would have found by hand: files mentioning tickets, directories to move, live issues in scope.
- Every effort with a `map.md` comes back classified as open questions, and nothing under one is called a task.
- It stops and asks about the tickets it could not classify, instead of guessing and telling you.
- Your links still resolve after the moves, including the ones pointing into the renamed per-feature directories.

## Where it fits

A run-once migration, not a chain step: it sits beside [update-sk-skills](../engineering/update-sk-skills.md), which brings the skills up to date, and [setup-sk-skills](../engineering/setup-sk-skills.md), which wrote the tracker config it reads and rewrites. After it runs, the ordinary chain (`grill-with-docs → to-spec → to-tasks → implement → code-review`) works against the new vocabulary. For the map over the whole set, see [ask-sk](../engineering/ask-sk.md).
