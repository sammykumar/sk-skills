---
name: figma-design-agent
description: Establish a verified runtime baseline, build native editable Figma product designs, and carry them across phase boundaries with separate visual and structural QA.
argument-hint: "[surface or Figma task]"
disable-model-invocation: true
---

# Figma Design Agent

## Baseline before design

The **baseline** is the governing artifact: a verified account of the runtime UI, the in-scope Figma source, and the exact states this request must represent. Establish it before proposing or making a design change. Browser code can explain behavior, but the rendered product and the Figma system are the visual sources of truth.

Keep three ledgers distinct throughout the work:

- **Observed:** directly inspected in the runtime, Figma file, source, or render.
- **Decided:** an approved choice that the design should encode.
- **Open:** a question whose answer would materially change the result.

## Choose the source contract

Resolve which contract the request establishes before inspecting design files:

| Request | Source contract |
| --- | --- |
| Continue or revise an existing design | Inspect the target file, its libraries, and the relevant component masters before mutation. |
| Translate the current application into Figma | Capture the real runtime first, then inspect only the Figma sources the user placed in scope. |
| Run a fresh-file experiment that excludes existing designs | Leave existing product Figma files untouched and do not use their frames, components, or tokens as input. Create a new file from the runtime baseline. |

When the contract is ambiguous and the branches would produce materially different files, use the harness's structured user-input tool when available, or ask one concise question before proceeding.

## Load the Figma mechanics

Call the Skill tool with `figma-use` before any Figma action. Call it separately with the relevant specialist skill when the branch requires one:

- `figma-create-new-file` before creating a new Figma file.
- `figma-generate-library` when building or materially extending a component library.
- `figma-use-motion` or `figma-implement-motion` when motion is part of the requested design contract.
- `figma-design-to-code` only when the request crosses from approved design into implementation.

These skills own Figma tool mechanics. This skill owns the operating procedure and review gates around them.

## The workflow

### 1. Scope the design phase

Name the target surface, runtime, states, viewport or window sizes, Figma file or fresh-file contract, and artifacts allowed to change. Read the workspace instructions and search for an existing design-state or handoff convention before creating another one.

List the phase boundary for the current session: baseline, Figma creation, system construction, visual QA, or implementation handoff. Finish one phase with a checkable artifact before expanding into the next. At each major boundary, update the ledger and report the completed phase. Then use the harness's structured user-input tool to request the transition to the next phase in a fresh session, or ask one concise question when that tool is unavailable, so accumulated context does not become part of the design input.

### 2. Capture the runtime baseline

Open the actual application state and capture every requested state at the target dimensions. Before reasoning from a screenshot, foreground the intended window or tab, verify the viewport or window size took effect, and record enough provenance to reproduce the capture. Restore a resized user window when the capture is complete.

Inspect application source only where it resolves behavior, state, content, or asset provenance. Treat code constants as implementation evidence, not automatically as design tokens.

The baseline is complete when the target states, dimensions, captures, and any degraded or unavailable states are accounted for in the three ledgers.

### 3. Inspect the Figma system

For an in-scope existing file, inventory the relevant pages, sections, variables, styles, libraries, components, variants, properties, and nested instances. Trace representative instances back to their masters before proposing a master edit. Check whether a local token or component already expresses each need before adding one.

When comments are part of the request, prove that each comment and anchor is visible and identify the node it refers to before treating the comment as actionable feedback.

For a fresh-file experiment, inspect only the new file after creation. Existing excluded Figma files remain outside both the baseline and the component search.

### 4. Present the design plan

Map the baseline to frames, responsive states, variables, styles, components, variants, and prototypes. Identify the representative state that will be reviewed before the pattern scales. State every intentional departure from the current product language.

Separate the plan from mutation. Get approval for the plan before creating or editing Figma content unless the user already approved that exact plan in the current conversation.

### 5. Build natively and incrementally

Build with Auto Layout, variables, styles, reusable components, variants, component properties, and nested instances. Reuse existing tokens and masters when they fit. Introduce a new token or component only for a demonstrated system gap, and keep its naming consistent with the file.

Create one representative state first. Render and review it at the agreed checkpoint, then scale the approved pattern to the remaining states. Preserve the current product language unless the user explicitly approved a redesign.

### 6. Verify visually and structurally

Compare rendered Figma frames with the captured runtime at matching dimensions. Inspect hierarchy, constraints, Auto Layout behavior, variable and style bindings, component-instance relationships, text overflow, assets, and prototype links. Exercise the variants and responsive states the design claims to support.

Report visual fidelity and structural editability separately. A successful API mutation is not visual QA, and a good screenshot is not proof of reusable structure. Claim parity only for states checked against matching screenshots, and name every unchecked or blocked state.

### 7. Leave a design-state ledger

At a phase boundary, update the workspace's existing design-state or handoff artifact. If none exists, create `figma-design-state.md` at the workspace root. Keep it short and link to primary artifacts instead of copying them.

Record:

- Figma file URL and target page, section, or node.
- Runtime target, captured states, dimensions, and screenshot paths.
- Current phase and requested scope.
- Observed facts, approved decisions, and open questions.
- Visual QA and structural QA status, with blocked or unchecked states.
- The next action and the skill the next session should invoke.

## Guardrails

- Preserve native, editable Figma structure as the deliverable. Image-backed mockups are reference material, not components.
- Keep all inspection, design, and mutation inside the requested surface and source contract.
- Use the in-scope design system's color, radius, spacing, and typography tokens wherever they exist. Introduce a raw value only for a demonstrated system gap.
- Preserve production and third-party files as read-only until the user approves the exact mutation.
- Keep design decisions and implementation changes in separate phases unless the user explicitly combines them.

## Report the phase

Tell the user what was created or changed, what remains uncertain or unchecked, and where the Figma file and design-state ledger are located. Name the completed phase and the exact next phase so the fresh session starts from the ledger rather than from an expanded prompt.

## Done when

- The baseline accounts for every requested runtime state and labels evidence, decisions, and open questions separately.
- The Figma result is natively editable and uses the file's system wherever one exists.
- The approved representative state was reviewed before the pattern was scaled.
- Matching-dimension visual comparison and structural inspection are both complete, or their exact gaps are reported.
- The design-state ledger points a fresh session at the exact file, scope, evidence, status, and next action.
