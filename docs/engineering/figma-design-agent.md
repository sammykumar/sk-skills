## What it does

`figma-design-agent` turns a live application surface into an editable, system-aware Figma design, or safely extends an existing product-design file. It establishes a verified runtime **baseline** before design work, then keeps observed facts, approved design decisions, and open questions separate through construction and QA.

Visual fidelity and structural editability are independent completion gates. A matching screenshot does not prove a reusable Figma system, and a clean component tree does not prove that the result matches the product.

## When to reach for it

You invoke this by typing `/figma-design-agent`; the agent won't reach for it on its own. Reach for it when a request involves capturing an application UI into Figma, iterating an existing product design, checking Figma against a runtime, or preparing a design handoff.

What you need decides which Figma skill fits:

| What you need | Reach for |
| --- | --- |
| Editable product UI based on a live application | `figma-design-agent` |
| An architecture or data-flow diagram on FigJam | [figma-arch-diagram](./figma-arch-diagram.md) |
| Production code from an already approved Figma design | The Figma plugin's `figma-design-to-code` skill |
| A throwaway coded UI to answer a design question | [prototype](./prototype.md) |

## Prerequisites

The Figma integration must be connected, and the runtime being captured must be reachable. Creating a fresh file also requires the Figma plugin's `figma-create-new-file` skill; the design agent deliberately delegates those tool mechanics rather than copying them.

## Baseline and source contract

The baseline keeps the design anchored to reproducible evidence rather than to the agent's memory of a screen. A source contract then decides whether an existing Figma system is part of that evidence or intentionally excluded. A fresh-file experiment can therefore stay genuinely fresh without giving up a runtime comparison.

## Two-part QA

Native structure is part of the design, not cleanup after the screenshot looks right. The two-part QA gate makes both outcomes visible: visual QA covers fidelity to matching runtime captures, while structural QA covers the reusable system someone will continue editing.

## Fresh phase, short ledger

Discovery, Figma creation, system construction, visual QA, and implementation handoff each start in a fresh session. A short design-state ledger makes those session boundaries safe by pointing to primary artifacts and carrying only the file location, scope, evidence status, settled decisions, gaps, and next action.

## Common questions

**Why add this when the Figma plugin already ships skills?**

The plugin skills own Figma mechanics: creating files, using the API, generating libraries, handling motion, and translating designs to code. This skill owns the durable product-design procedure around them: runtime baseline, source contract, mutation approval, representative-state review, two-part QA, and handoff.

**Does a fresh-file experiment inspect the existing product design system?**

No when the request excludes it. The skill leaves those files untouched and does not use their frames, tokens, or components as input. The live runtime is still captured because “fresh file” changes the Figma source contract, not the need for evidence.

**Can application CSS or source constants be treated as design tokens?**

Not automatically. Source is useful evidence for behavior, state, content, and asset provenance. A value becomes part of the Figma system only when the in-scope design contract supports that decision.

**When should the work move to a fresh session?**

At every major phase boundary: after baseline discovery, Figma creation, system construction, visual QA, or implementation handoff. The design-state ledger lets the next session resume from primary artifacts instead of a long pasted prompt.

## It's working if

- Every claimed design state has a matching runtime capture, or is explicitly marked unchecked or blocked.
- A reviewer can edit content and layout through components, variables, variants, and Auto Layout instead of rebuilding flattened mockups.
- Existing masters change only after their usages and variants have been inspected.
- The first representative state is reviewed before the same pattern appears across many frames.
- A fresh session can open the ledger and land on the exact Figma node, evidence, QA status, and next action.

## Where it fits

This is a **reach-for-it-anytime standalone** for product-design work. It composes with the Figma plugin's mechanics, sits beside [prototype](./prototype.md) when a design question needs runnable code, and stays separate from [figma-arch-diagram](./figma-arch-diagram.md), which is exclusively for computed architecture diagrams on FigJam. For the map of the whole set, see [ask-sk](./ask-sk.md).
