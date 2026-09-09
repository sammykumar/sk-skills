# Issue tracker: Repo PDD Markdown (Plan-Driven Development)

Tasks and specs for this repo live as markdown files under `docs/tasks/`.

Note the split: `docs/tasks/` holds tracked work (specs and tasks), while `docs/plans/` holds the flat, dated design records that `recording-designs` writes. They are separate on purpose, so neither convention bleeds into the other. A design record in `docs/plans/` is the thinking; a spec under `docs/tasks/` is the tracked unit of work that comes out of it.

## Conventions

- One feature per directory: `docs/tasks/<feature-slug>/`
- The spec is `docs/tasks/<feature-slug>/spec.md`
- Implementation tasks are one file per task at `docs/tasks/<feature-slug>/tasks/<NN>-<slug>.md`, numbered from `01`, never a single combined tasks file
- Triage state is recorded as a `Status:` line near the top of each task file (see `triage-labels.md` for the role strings)
- Comments and conversation history append to the bottom of the file under a `## Comments` heading

## When a skill says "publish to the issue tracker"

Create a new file under `docs/tasks/<feature-slug>/` (creating the directory if needed).

## When a skill says "fetch the relevant task"

Read the file at the referenced path. The user will normally pass the path or the task number directly.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a file with one **child** file per open question.

- **Map**: `docs/tasks/<effort>/map.md` (the Notes / Decisions-so-far / Fog body).
- **Child open question**: `docs/tasks/<effort>/tasks/NN-<slug>.md`, numbered from `01`, with the question in the body. A `Type:` line records the open question type (`research`/`prototype`/`grilling`/`task`); a `Status:` line records `claimed`/`resolved`.
- **Blocking**: a `Blocked by: NN, NN` line near the top. An open question is unblocked when every file it lists is `resolved`.
- **Frontier**: scan `docs/tasks/<effort>/tasks/` for files that are open, unblocked, and unclaimed; first by number wins.
- **Claim**: set `Status: claimed` and save before any work.
- **Resolve**: append the answer under an `## Answer` heading, set `Status: resolved`, then append a context pointer (gist + link) to the map's Decisions-so-far in `map.md`.
