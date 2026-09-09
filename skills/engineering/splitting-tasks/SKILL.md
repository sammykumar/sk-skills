---
name: splitting-tasks
description: "Break a plan, spec, or the current conversation into tracer-bullet tasks, each declaring its blocking edges, published to the configured tracker. Use when the user wants work split into tasks or issues, asks how to slice a build into sessions, or a flow reaches the point where a spec should become grabbable tasks."
---

# Splitting Tasks

Break a plan, spec, or conversation into a set of **tasks**: tracer-bullet vertical slices, each declaring the tasks that **block** it.

The issue tracker and triage label vocabulary should have been provided to you. If not, tell the user to run `/setup-sk-skills`.

## Process

### 1. Gather context

Work from whatever is already in the conversation context. If the user passes a reference (a spec path, an issue number or URL) as an argument, fetch it and read its full body and comments.

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so to understand the current state of the code. Task titles and descriptions should use the project's domain glossary vocabulary, and respect ADRs in the area you're touching.

Look for opportunities to prefactor the code to make the implementation easier. "Make the change easy, then make the easy change."

### 3. Draft vertical slices

Break the work into **tracer bullet** tasks.

<vertical-slice-rules>

- Each slice cuts a narrow but COMPLETE path through every layer (schema, API, UI, tests): vertical, NOT a horizontal slice of one layer
- A completed slice is demoable or verifiable on its own
- Each slice is sized to fit in a single fresh context window
- Any prefactoring should be done first

</vertical-slice-rules>

Give each task its **blocking edges**: the other tasks that must complete before it can start. A task with no blockers can start immediately.

**Wide refactors are the exception to vertical slicing.** A **wide refactor** is one mechanical change (rename a column, retype a shared symbol) whose **blast radius** fans across the whole codebase, so a single edit breaks thousands of call sites at once and no vertical slice can land green. Don't force it into a tracer bullet; sequence it as **expand–contract**. First expand: add the new form beside the old so nothing breaks. Then migrate the call sites over in batches sized by blast radius (per package, per directory), each batch its own task blocked by the expand, keeping CI green batch to batch because the old form still exists. Finally contract: delete the old form once no caller remains, in a task blocked by every migrate batch. When even the batches can't stay green alone, keep the sequence but let them share an integration branch that all block a final integrate-and-verify task; green is promised only there.

### 4. Quiz the user

Present the proposed breakdown as a numbered list. For each task, show:

- **Title**: short descriptive name
- **Blocked by**: which other tasks (if any) must complete first
- **What it delivers**: the end-to-end behaviour this task makes work

Ask the user:

- Does the granularity feel right? (too coarse / too fine)
- Are the blocking edges correct: does each task only depend on tasks that genuinely gate it?
- Should any tasks be merged or split further?

Iterate until the user approves the breakdown.

### 5. Publish the tasks to the configured tracker

Publish the approved tasks. **How** depends on the tracker `/setup-sk-skills` configured; the tasks are the same either way, only the shape of the blocking edges changes:

- **Repo PDD Markdown** → write one file per task under `docs/tasks/<feature-slug>/tasks/<NN>-<slug>.md` (the base task directory comes from `docs/agents/issue-tracker.md`; `docs/tasks/` is the default), numbered from `01` in dependency order (blockers first). Each file's "Blocked by" lists the numbers/titles it depends on. Use the per-task file template below: one task per file, never a single combined file.
- **A real issue tracker (GitHub, Linear, …)** → publish one issue per task in dependency order (blockers first) so each task's blocking edges can reference real identifiers. Use the platform's native blocking / sub-issue relationship where it has one; otherwise set each task's "Blocked by" to the blocking issues. Apply the `ready-for-agent` triage label unless instructed otherwise; the tasks are agent-grabbable by construction.

Work the **frontier**: any task whose blockers are all done. For a purely linear chain that means top to bottom.

Do NOT close or modify any parent issue.

<local-task-template>

# <NN>: <Task title>

**What to build:** the end-to-end behaviour this task makes work, from the user's perspective, not a layer-by-layer implementation list.

**Blocked by:** the numbers/titles of the tasks that gate this one, or "None (can start immediately)".

**Status:** ready-for-agent

- [ ] Acceptance criterion 1
- [ ] Acceptance criterion 2

</local-task-template>

<issue-template>

## Parent

A reference to the parent issue on the tracker (if the source was an existing issue, otherwise omit this section).

## What to build

The end-to-end behaviour this task makes work, from the user's perspective, not layer-by-layer implementation.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Blocked by

- A reference to each blocking task, or "None (can start immediately)".

</issue-template>

In either form, avoid specific file paths or code snippets: they go stale fast. Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it and note briefly that it came from a prototype. Trim to the decision-rich parts, not a working demo, just the important bits.
