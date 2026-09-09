---
"sk-skills": minor
---

Retire "ticket" as the repo's word for a unit of work. The implementation slice is now a **task**, matching the PDD vocabulary from superpowers and vibeflow, and the wayfinder unit is now an **open question**, which says what it actually is: a question whose resolution is a decision, not a slice of a build to execute.

Two user-invoked skills are renamed with it, so this breaks existing invocations: `/to-tickets` is now `/to-tasks`, and `/splitting-tickets` is now `/splitting-tasks`.

A new user-invoked `/migrate-to-tasks` carries a repo across. Run it once in any repo configured before this release: it renames the invocations, moves Repo PDD Markdown work into the `tasks/` layout, and sorts the tickets that already exist into the two things they turn out to be, tasks and open questions, by provenance rather than by title. Live trackers stay read-only until you approve a batch, and `docs/plans/`, `CHANGELOG.md`, and quoted material are left verbatim.

The Repo PDD Markdown tracker convention moves with the vocabulary. Tracked work now lives at `docs/tasks/<feature-slug>/tasks/<NN>-<slug>.md`, where it previously lived under `docs/issues/`, and `splitting-tasks` no longer publishes to `docs/plans/<feature-slug>/issues/`, which contradicted the tracker doc. `docs/plans/` keeps its separate job as the flat, dated design records `recording-designs` writes.

`CONTEXT.md` keeps **Issue** as the genus, the name for anything tracked, with **Task** and **Open question** as the two species under it. One collision is documented rather than renamed away: `task` is also the name of one of wayfinder's four open question types, the type that does rather than decides in order to unblock a decision, and that is not a Task in the `to-tasks` sense.
