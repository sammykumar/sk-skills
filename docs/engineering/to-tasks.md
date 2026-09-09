## What it does

`to-tasks` takes a plan, a spec, or the conversation you are in, and breaks it into a set of **tasks** on your issue tracker. Each task declares its **blocking edges**: the other tasks that have to finish before it can start.

Every task is a **tracer bullet**: a narrow but complete path through every layer of the change (schema, API, UI, tests) that can be demoed on its own the moment it lands. That is the constraint that makes it behave differently from the obvious way to split work, which is to cut one layer at a time and integrate at the end. It also sizes each task to fit in a single fresh context window, because the thing that will pick the task up is a session that has never seen your spec.

## When to reach for it

You invoke this by typing `/to-tasks`. The agent won't reach for it on its own.

| Where you are | What to run |
| --- | --- |
| You have a spec issue and the build spans several sessions | `/to-tasks`, or `/to-tasks #<spec_issue>` |
| The plan is only in the conversation, never written up | `/to-tasks` reads the thread directly, no spec needed |
| The whole change fits in one context window | implement, skip the tasks |
| Nothing is decided yet | grill-with-docs, then to-spec |
| A wayfinder map has cleared | to-spec first, to collapse the map, then `/to-tasks` |

Tasks that `to-tasks` produced are agent-ready by construction. Don't run triage over them. Triage is for work that arrived from someone else.

## Prerequisites

`to-tasks` publishes into a tracker, so setup-sk-skills must have configured one for this repo, along with the triage-label vocabulary. Either kind works: a real tracker like GitHub or Linear, or Repo PDD Markdown files under `docs/tasks/`, which is supported out of the box.

## Tracer bullets, not layers

A **horizontal** slice ships one layer of the change. Nothing works until every layer has landed, and each task's acceptance criteria have to reach into work that another task owns. A **vertical** slice (the tracer bullet) ships one thin path through all the layers at once, so it is verifiable alone and owns everything it grades.

This is the rule people break most often, and the consequences are well documented. One team ran a 26-task stack sliced by layer (corpus, producer, aggregator, selector) and got roughly twenty agent runs per closed task, about three quarters of them rework. Their own post-mortem traced every failure class back to the horizontal slicing rather than to the implementations.

Two things happen before anything is published. `to-tasks` looks for prefactoring (the principle "make the change easy, then make the easy change") and orders that work first. Then it presents the breakdown as a numbered list and quizzes you on it: is the granularity right, are the blocking edges real, should anything merge or split. Nothing reaches the tracker until you approve, and that quiz is the place to push back.

## Blocking edges

The edges are the point of the artifact. They read two ways depending on the tracker:

| Tracker | Where the edges live | How you work them |
| --- | --- | --- |
| Repo PDD Markdown | Text in one file per task under `docs/tasks/<feature>/tasks/<NN>-<slug>.md`, numbered blockers-first | Top to bottom, by hand |
| A real tracker (GitHub, Linear) | Native blocking links, or sub-issues where the tracker has them | Any task whose blockers are done is on the **frontier** and can be grabbed |

The edges live in the task either way. The medium only decides whether anything can act on them in parallel. `to-tasks` produces the artifact; running it (one session at a time, or a fleet) is your job, not the skill's.

## The wide-refactor exception

One shape breaks the tracer-bullet rule. A **wide refactor** is a single mechanical change (rename a column, retype a shared symbol) whose **blast radius** fans across the whole codebase, so one edit breaks thousands of call sites and no vertical slice can land green.

`to-tasks` sequences that as **expand–contract** instead:

- **Expand**: add the new form beside the old, so nothing breaks.
- **Migrate**: move call sites over in batches sized by blast radius (per package, per directory), one task per batch, each blocked by the expand. CI stays green because the old form still exists.
- **Contract**: delete the old form once no caller remains, in a task blocked by every migrate batch.

Where even the batches can't stay green alone, they share an integration branch and all block a final integrate-and-verify task. Green is promised only there.

## Common questions

**It produced twelve tasks for a three-line change.**
Over-decomposition is the most reported friction on this skill, and it is consistent across practitioners: the model defaults to atomic units and loses the grouping that would make them meaningful. The quiz step exists for exactly this: ask it to merge, and it will. The deeper answer is that the tasks have a floor: if the whole change fits in one context window, you don't need this skill at all. Go straight to implement.

**The tasks came out one per layer: all the schema in one, all the API in another.**
This is the failure the vertical-slice rule is written against, and the skill still produces it sometimes. Catch it at the quiz step by asking one question per task: what can I demo when this is done? A task with no answer is a horizontal slice. Some people add a "demo path" line to each task for this reason, and report it nudges the model toward vertical decomposition.

**On GitHub the tasks weren't created as sub-issues of the spec issue.**
Known and unfixed. It has been reported across a dozen runs and several models, [most fully in issue #554](https://github.com/mattpocock/skills/issues/554), and it is worse on Codex than on Claude. `gh` has supported this natively since v2.94: `gh issue create --parent <n>`, and `gh issue edit <parent> --add-sub-issue <n>` after the fact. Until the tracker template prefers those, wiring the parent links yourself after a run is the reliable move.

**"Blocked by" was written into the issue body instead of a real blocking link.**
Same class of problem, [reported in issue #513](https://github.com/mattpocock/skills/issues/513), where the agent went as far as asserting GitHub has no native blocking relationship at all. It does: `gh issue create --blocked-by 12,15`. Because blockers are published first, their numbers are always available at creation time. The body text is meant to be the fallback for trackers with no native edge, not the default.

**Where do the local task files go? The v1.1 notes said a root-level `tickets.md`.**
They did, and that was a bug: a single shared file also raced when parallel agents wrote to it. Repo PDD Markdown mode now writes one file per task under `docs/tasks/<feature-slug>/tasks/<NN>-<slug>.md`, in dependency order, matching the layout the Repo PDD Markdown tracker template already described. The `NN` prefix is a real task ID, so `/implement 03` works instead of retyping a long title.

**It kept truncating when it tried to read my spec.**
A very large spec can outgrow what a tracker issue serves back cleanly, and there is no local copy to fall back on, so the agent then burns tool calls re-fetching chunks and never reaches the end. Don't clear or compact between `/to-spec` and `/to-tasks`. Run them in the same context window and the spec never has to be fetched back at all.

**The acceptance criteria graded nothing: some passed before any work was done.**
The template asks for criteria and says nothing about whether they can fail, so this happens. Three shapes recur: a criterion already true at the base commit, a criterion that can only be satisfied by work another task owns, and one that restates the request rather than deriving from the artifact. Vertical slicing prevents most of it (a slice that delivers behaviour which didn't exist before is red at the base commit by construction), but the check is worth doing by hand. For each criterion, name the observation that would show it false, and confirm it fails at the commit the implementer starts from.

**The tasks are published. How do I actually run them?**
The skill stops at the artifact, and there is no auto-dispatch mode. Dispatch is manual: look at the board, count the tasks with no open blockers, and open that many agent sessions. One task per fresh context, cleared between them. Be aware that implement does not reliably close or check off the task when it finishes, on GitHub or in Repo PDD Markdown, so the task's state is yours to update.

## It's working if

- Every task has an answer to "what can I demo when this is done?", and the answer is behaviour, not a layer.
- The list comes back to you numbered, with a "Blocked by" line on each, before anything is published.
- The task at the top has no blockers and can be started immediately.
- Nothing in a task body is a file path or a line number, except a snippet a prototype produced.
- Each task reads like something a fresh session could finish without you in the room.
- Prefactoring, where it found any, is at the front of the order rather than mixed into feature tasks.

## Where it fits

`to-tasks` is a step in the main build chain:

```txt
grill-with-docs → to-spec → to-tasks → implement → code-review
```

Upstream is to-spec, which hands it a settled spec to slice against; keep both in one unbroken context window. Downstream is implement, which builds one task per fresh session, driving tdd for the tests and closing with code-review. When you're unsure which skill or flow fits, ask-sk routes you.
