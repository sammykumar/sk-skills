---
"mattpocock-skills": patch
---

Make `writing-for-agents` model-invokable in Codex again.

- Drop `policy.allow_implicit_invocation: false` from `agents/openai.yaml`. Codex filtered the skill out of the model-visible skills list, so its description could not trigger it — only an explicit `$writing-for-agents` mention worked.
- Update the stale `interface.display_name` and `interface.short_description`, which still named the old `writing-great-skills` skill.
- Move the skill from the **User-invoked** list to the **Model-invoked** list in `README.md` and `skills/productivity/README.md`.
