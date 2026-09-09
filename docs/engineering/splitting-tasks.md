## What it does

`splitting-tasks` breaks a plan, spec, or conversation into **tracer bullet** tasks and publishes them to the configured tracker. Each task cuts a narrow but complete path through every layer, so a finished one is demoable on its own, and each declares its **blocking edges**: the tasks that must land before it can start.

It sizes every slice to fit a single fresh context window. That constraint is what makes the tasks grabbable later, and it is the reason a task is never a horizontal slice of one layer.

It is the engine under [to-tasks](../engineering/to-tasks.md).

## When to reach for it

- **Invocation mode.** Type `/splitting-tasks`, or the agent reaches for it automatically when a flow arrives at the point where a spec should become grabbable tasks.
- **Trigger boundary.** Reach for it when there is a settled plan to slice. If you want to type the command yourself, [to-tasks](../engineering/to-tasks.md) is the name on the map and behaves identically. For issues you did not create, use [triage](../engineering/triage.md) instead: those arrive raw and need a different pass.

## Prerequisites

[setup-sk-skills](../engineering/setup-sk-skills.md) must have configured the issue tracker, because the shape of the blocking edges depends on it: one file per task for a Repo PDD Markdown tracker, native blocking links on a real tracker.

## The wide-refactor exception

One mechanical change whose blast radius fans across the codebase cannot land green as a tracer bullet. The skill sequences those as **expand, migrate, contract** instead: add the new form beside the old, migrate call sites in batches sized by blast radius, then delete the old form once no caller remains. Each batch is its own task, and CI stays green between them because the old form still exists.

## It's working if

- Each task names an end-to-end behaviour rather than a layer.
- You are shown the breakdown and asked about granularity before anything is published.
- The blocking edges let you point at a task and say which ones could be started right now.

## Where it fits

A **chain step**, and the engine half of one: `to-spec → to-tasks → implement`. Its neighbours are [to-tasks](../engineering/to-tasks.md), the wrapper you type, and [writing-specs](../engineering/writing-specs.md), which produces what it slices. [ask-sk](../engineering/ask-sk.md) is the router over the whole set.
