---
"mattpocock-skills": minor
---

Graduate **`wizard`** out of `in-progress/` into the **Engineering** bucket, so it ships in the plugin — and make it model-invoked. It generates an interactive bash script that walks a human through a manual procedure — third-party setup, a one-off migration, an A→B state transition — opening each URL, saying what to click, capturing the values, and writing them into `.env` files and GitHub Actions secrets.

The delightful UX is pre-solved by the bundled `template.sh` (progress with time-remaining, confirmation gates, cross-platform URL opening including WSL, hidden secret entry, idempotent `.env` upserts, `gh secret`/`gh variable` writes with graceful degradation, closing skip summary). Everything above the `STAGES` marker is a fixed library that's never hand-edited — the skill's job is only to scope the procedure and author its **stages**.

Engineering rather than Productivity: it reads `.env*`, `docker-compose*`, framework config and every `secrets.*`/`vars.*` reference in `.github/workflows/` to scope itself, writes CI secrets, and verifies its output with `bash -n` and `shellcheck`.

Because it is model-invoked, the agent can reach for it the moment it hits a step only a human can perform, instead of dumping numbered instructions into the chat and hoping you follow them. Typing `/wizard` works exactly as before — model-invocation only ever *adds* the agent's reach. The description is written as the pointer that decides when it fires: what it produces, four trigger branches (provisioning infrastructure, setting up credentials or CI secrets, walking an unfamiliar third-party dashboard, a one-off migration or cutover), and an explicit non-trigger — don't invoke it for steps the agent can perform itself. Work an agent can do, an agent should do; the wizard is for the clicks, approvals and dashboard trips you would not hand to one. The stage-list confirmation before a line is written now doubles as the proposal when the agent fires it mid-build.

Now wired as a promoted skill — plugin entry, top-level + Engineering READMEs under **Model-invoked**, a docs page at `docs/engineering/wizard.md`, and a Standalone route in `ask-matt` for the steps only a human can take. Model-invocation also puts it out of the reach of [#693](https://github.com/mattpocock/skills/issues/693), which drops user-invoked skills from the listing on Claude's desktop and web surfaces.
