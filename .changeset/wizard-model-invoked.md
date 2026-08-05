---
"mattpocock-skills": minor
---

Make **`wizard`** model-invoked. The agent can now reach for it the moment it hits a step only a human can perform, instead of dumping numbered instructions into the chat and hoping you follow them. Typing `/wizard` works exactly as before — model-invocation only ever *adds* the agent's reach.

The description is rewritten as the pointer that decides when it fires: a short statement of what it produces, four trigger branches (provisioning infrastructure, setting up credentials or CI secrets, walking an unfamiliar third-party dashboard, a one-off migration or cutover), and an explicit non-trigger — don't invoke it for steps the agent can perform itself. Work an agent can do, an agent should do; the wizard is for the clicks, approvals and dashboard trips you would not hand to one.

Nothing else changed. Same name, same `template.sh`, same four process steps, same stage-list confirmation before a line is written — which now doubles as the proposal when the agent fires it mid-build. Also moved to **Model-invoked** in both READMEs, and out of the reach of [#693](https://github.com/mattpocock/skills/issues/693), which drops user-invoked skills from the listing on Claude's desktop and web surfaces.
