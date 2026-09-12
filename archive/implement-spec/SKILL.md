---
name: implement-spec
description: "Implement a specification in code."
disable-model-invocation: true
---

You have been provided a spec. This spec should have tasks associated with it, describing how to implement the spec.

The goal is a PR which implements the entire spec on a single branch.

The tasks are not a list of steps. They are a **task graph** with blocking relationships between them. This means there is always a **frontier** of tasks which are ready to be grabbed.

Communication to and from subagents should be sparse. Communicate primarily through **context pointers**: to the spec, tasks, research notes, and previous commits. Don't duplicate information already available via pointers.

**Implementer subagents** should be run in the background where possible for **maximum concurrency**.

## Steps

1. Read the spec and tasks. Read enough to understand the task graph.

2. (optional) Use an **exploration subagent** to conduct any exploration required by the tasks - relevant codebase files or external documentation. Ensure the exploration subagent can save files - it should save its markdown notes in a directory outside the repo, accessible by all future subagents. This lets **implementer subagents** focus on implementation rather than exploration.

3. Create a branch, and a draft PR. The PR should be marked as 'closing' the spec issue and tasks.

4. Use **implementer subagents** to implement each task. Each implementer subagent should work in its own worktree, on its own branch.

5. Once an **implementer subagent** completes, merge its work to the PR branch with a **merger subagent**.

6. If this changes the **frontier** of available tasks, kick off more **implementer subagents** to work on the new tasks. This allows for maximum concurrency.

7. Once all tasks are complete, run /code-review on the PR branch. Fix all issues raised by the code review in a single **implementer subagent**.

8. Mark the PR as ready for review.

9. Clean up all **implementer subagent** worktrees.
