---
name: implement
description: "Implement a piece of work based on a spec or set of tasks."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tasks.

Before writing code, turn the owner's acceptance criteria into a ledger of 3 to 7 concrete scenarios. Each scenario names its trigger and the observable outcome at a user-facing public seam. Keep this ledger stable through deterministic and installed acceptance so every layer proves the same behavior.

Use /tdd at the pre-agreed public seams. Produce at least one meaningful red that fails against the pre-change behavior for the intended reason before making it green. A red caused by a bad fixture, stale assumption, or broken harness does not count: record that invalidation and the resulting rework, then replace it with a valid red.

Run typechecking regularly and focused deterministic tests at the public seam after each slice. Run the full test suite once when the candidate is complete.

## Acceptance proof

For features whose behavior reaches an installed application, browser, operating-system surface, or external provider:

1. Freeze the candidate identity after deterministic tests pass. Record the exact commit and the built artifact, application, or source fingerprint. Make no source changes while collecting acceptance evidence; any source change creates a new candidate and invalidates evidence tied to the previous identity.
2. Run the same 3 to 7 owner scenarios through the checkout-owned installed application and its private profile or state. Do not substitute a shared development instance, another checkout's application, or a production profile.
3. Report separate verdicts for deterministic tests, installed application behavior, native focus or geometry behavior, and live-provider behavior. Mark a layer not applicable with the reason instead of folding it into another verdict.
4. Run live-provider acceptance only when the feature's contract depends on that provider. Guard the run behind an explicit opt-in, define recovery before sending anything, and use the smallest prompt or action that proves the contract. Never retry a possibly completed live action blindly.
5. Record every invalidated result, harness repair, retry, and implementation rework. Promote the feature or workflow as proven only when every owner scenario passes on the frozen candidate and there are zero user-discovered escapes.

Once done, commit the frozen candidate so /code-review can review it against the agreed fixed point. Address its findings, then repeat every acceptance layer invalidated by the resulting changes and freeze the final identity.

Commit your work to the current branch.
