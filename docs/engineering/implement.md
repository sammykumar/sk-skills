## What it does

`implement` builds work that has already been decided. You point it at a task, a spec, or the plan you just agreed in the conversation, and it turns the owner's acceptance criteria into 3 to 7 scenarios, writes the code, drives tdd at the seams, and carries those same scenarios through deterministic and installed acceptance before review.

It never substitutes a passing test suite for proof in the application the owner will use. The candidate is frozen before installed acceptance, every evidence layer gets its own verdict, and any source change invalidates evidence tied to the previous candidate.

## When to reach for it

You invoke this by typing `/implement` yourself: the agent won't reach for it on its own. It ships with `disable-model-invocation: true`, so no other skill can call it either. Wherever ask-sk or to-tasks says "then `/implement` per task", that is an instruction to you, not something the agent will do unprompted.

Where the work currently lives decides whether this is the right skill:

| The work is… | Reach for |
| --- | --- |
| A task on the tracker | `/implement #42`, one task per session, clearing context between tasks |
| A spec, not yet split up, and the build spans sessions | to-tasks first, then `/implement` per task |
| A spec, and the build is small | `/implement` directly against the spec |
| Only in the conversation you just had, and it's still small | `/implement` right there, in the same window |
| Not written down anywhere yet | grill-with-docs, or grill-me if there's no codebase |
| One concrete behaviour you want test-first, with no spec | tdd directly |
| Already built, and you want it checked | code-review directly |

The same-session case is worth naming because the skill's own first line doesn't cover it. `SKILL.md` says "the spec or tasks", which nudges the model to go hunting for a file that doesn't exist. If the plan lives only in the thread, say so when you invoke it.

## Prerequisites

`implement` commits to the branch you are on. It does not create one, and it does not ask. Check you are on the branch you want the work on before you start.

If the tasks came from to-tasks, the tracker they live on was configured by setup-sk-skills. `code-review` reads the same configuration to find the originating spec at close-out.

## What one run does

A run is seven beats, in order:

1. Read the task or spec, define 3 to 7 owner scenarios, and work out their public seams.
2. Drive tdd at the pre-agreed seams, starting with at least one red that fails for the intended reason.
3. Typecheck often and run focused deterministic tests at the public seam as the slices land.
4. Run the full test suite, freeze the candidate identity, and record the exact commit and artifact fingerprint.
5. Repeat the owner scenarios in the checkout-owned installed application, including native focus or geometry checks where they apply.
6. Run a guarded, recoverable live-provider check only when the feature's contract depends on a provider.
7. Report each evidence layer separately, run code-review against the fixed point, address findings, and repeat any invalidated acceptance before the final commit.

One run covers one task. The tasks to-tasks produces are tracer-bullet vertical slices sized to fit a single fresh context window, so the intended rhythm is: clear context, implement one task, commit, clear again. Each task is self-contained, which is what makes the previous task's context disposable.

## Pre-agreed seams

The idea the skill runs on is the **seam**: the public boundary you observe behaviour at, without reaching inside. Tests live at seams. Working at a seam agreed before any code is written is what keeps the tests durable, because the implementation underneath can be rewritten without the tests moving.

The word "pre-agreed" is doing real work, and it is also the skill's weakest joint. Nothing inside `implement` agrees the seams. `tdd` is the skill that asks, and it refuses to write a test at an unconfirmed seam. So in practice the agreement happens either upstream in the spec, or in the first exchange of the run. If it happens nowhere, the precondition never fires and the run quietly becomes "just write the code". Naming the seams in the spec is what stops that.

## One scenario ledger, four verdicts

The acceptance ledger keeps the evidence comparable. A deterministic check and an installed application run prove different things, but they execute the same owner scenarios against the same frozen candidate rather than drifting into separate test plans.

The report keeps four verdicts distinct:

| Verdict | What it proves |
| --- | --- |
| Deterministic | The behavior passes repeatable checks at its public seam. |
| Installed application | The packaged candidate behaves correctly in the checkout-owned application and private state. |
| Native focus or geometry | Operating-system focus, window, keyboard, dialog, and geometry behavior works where the scenarios depend on it. |
| Live provider | A real provider satisfies the contract when the feature actually depends on one. |

A layer that does not apply gets an explicit reason. Live-provider acceptance stays opt-in, uses the smallest action that proves the contract, and has a recovery path before the action runs. Invalid test assumptions, harness repairs, retries, and implementation rework stay in the record because they determine whether the result can be trusted. The change is ready to promote only when every owner scenario passes on the frozen candidate and the owner has found zero escapes.

## Common questions

**It finished, but my task is still open and the acceptance criteria are still unchecked.**

Correct, and expected. `implement` has no completion step. It ends at the commit and never touches the work item, confirmed on GitHub Issues and on the Repo PDD Markdown tracker, so it is not a tracker integration problem. It also does not act on the findings `code-review` produced, and does not tick the `- [ ]` boxes on the originating issue. Close the task and reconcile the criteria yourself. This bites hardest on a dependency chain, because `to-tasks` defines the frontier as tasks whose blockers are all closed. If nothing gets closed, nothing ever becomes visibly unblocked.

**My deterministic tests pass, but the feature fails when I launch the app. Is the run done?**

No. For an installed application, deterministic tests are one verdict in the acceptance proof. Freeze the candidate, repeat the same owner scenarios in the checkout-owned application, and report installed and native behavior separately. A source edit after that point creates a new candidate, so rerun every affected layer rather than carrying old evidence forward.

**Do I need to spend provider credits on every implementation?**

No. Run a live-provider check only when the contract depends on provider behavior that deterministic and installed checks cannot prove. Guard it behind explicit opt-in, define recovery first, and use one minimal prompt or action. Mark the verdict not applicable for features that do not cross that boundary.

**Can I point it at all my tasks at once, or run several in parallel?**

No. One invocation, one task. Batch dispatch across a task queue and subagent fan-out are both requested repeatedly, and neither exists. Running several `/implement` sessions side by side in one checkout is worse than unsupported: one field report describes a `git commit --amend` in one session landing on another session's commit, a stash vanishing from `refs/stash`, and commits landing on the wrong branch, all in a single afternoon across three issues. The sessions share one working directory, one index, and one HEAD. Git worktrees are the community workaround, and note that `refs/stash` is shared across worktrees too, so worktrees alone do not fix the stash case. If you want parallelism today, you are assembling it yourself.

**Can it open a pull request instead of committing?**

Not built in. It commits straight to the current branch, which several people find too eager: the code lands before they have had a chance to verify it works. There is no configuration flag and no PR mode. People override it in the invocation ("commit to a branch and open a PR") or by editing their local copy of the skill.

**`code-review` says it cannot see my changes.**

`code-review` reviews `git diff <fixed-point>...HEAD`, which excludes staged and working-tree changes. `implement` runs it before committing, so unless an interim commit already exists there is nothing in that diff to review. Multiple people have reported this and it is unfixed on both sides. Commit first, then review against the point you branched from.

Separately, some people deliberately do not want the review inside the run at all, because an agent reviewing the code it just wrote is biased toward its own solution. Running code-review in a fresh session against a fixed point is a legitimate alternative, and is the same reason that skill runs its two axes in separate sub-agents.

**One task burned 150k tokens. Am I using it wrong?**

Probably the task is too big rather than the skill being misused. A run does codebase exploration, a red-green loop per seam, a full suite, and a review, so a non-trivial task exceeding 100k tokens is normal rather than a sign something broke. The lever is upstream: right-size the tasks in to-tasks so each fits one fresh window. If a single task keeps blowing out, split it rather than raising the effort level.

**`/implement #2` in a fresh session worked on something completely unrelated.**

`#2` is resolved against whatever numbered list the agent can see, which in a fresh session may be a todo file, a checklist, or another work list rather than the configured tracker. The resolution is confident rather than fail-closed, so the mistake is not obvious until it has started. Pass the full reference, the issue URL or `owner/repo#2`, and ask it to confirm the title back before it begins.

## It's working if

- The session opens by reading the task or spec and restating what it will build, rather than asking you what to build.
- The acceptance record names 3 to 7 owner scenarios and shows the same scenarios at each applicable evidence layer.
- You can see an actual `/tdd` invocation in the trace, not just tests appearing in the diff.
- At least one red fails against the old behavior for the intended reason, and invalid test assumptions remain visible as invalidations rather than being counted as product failures.
- Typechecks and focused public-seam tests run repeatedly during the run, and the full suite runs once near the end.
- Installed, native-focus, and live-provider verdicts are separate, with not-applicable reasons where needed, and all passing evidence names the frozen candidate identity.
- The record includes retries and rework, and the owner has found zero escapes before the approach is called proven.
- The run reaches a commit on your current branch without you prompting it to carry on.
- The diff is one task's worth of change: a vertical slice through every layer, not several tasks swept together.

## Where it fits

`implement` is the build step of the main chain, second from the end:

```txt
grill-with-docs → to-spec → to-tasks → implement → code-review
```

Its neighbours are to-tasks, which produces the tasks it consumes and declares the blocking edges that decide their order; tdd, which it drives internally at each seam; and code-review, which it runs before committing. It sits downstream of the planning skills and trusts them. It does not re-validate the shape of what it was handed, so a badly-structured map or a horizontally-layered task gets built as written.

That trust is why wayfinder merges onto the chain at to-spec rather than looping its map straight into `implement`. Go straight to `implement` from a map only when the effort turned out genuinely small.

ask-sk is the router over the whole set when you are not sure which flow you are in.
