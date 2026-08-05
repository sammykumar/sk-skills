---
"mattpocock-skills": minor
---

Graduate **`wizard`** out of `in-progress/` into the **Engineering** bucket, so it ships in the plugin. It generates an interactive bash script that walks a human through a manual procedure — third-party setup, a one-off migration, an A→B state transition — opening each URL, saying what to click, capturing the values, and writing them into `.env` files and GitHub Actions secrets.

The delightful UX is pre-solved by the bundled `template.sh` (progress with time-remaining, confirmation gates, cross-platform URL opening including WSL, hidden secret entry, idempotent `.env` upserts, `gh secret`/`gh variable` writes with graceful degradation, closing skip summary). Everything above the `STAGES` marker is a fixed library that's never hand-edited — the skill's job is only to scope the procedure and author its **stages**.

Engineering rather than Productivity: it reads `.env*`, `docker-compose*`, framework config and every `secrets.*`/`vars.*` reference in `.github/workflows/` to scope itself, writes CI secrets, and verifies its output with `bash -n` and `shellcheck`.

Now wired as a promoted skill — plugin entry, top-level + Engineering READMEs under **User-invoked**, a docs page at `docs/engineering/wizard.md`, and a Standalone route in `ask-matt` for the steps only a human can take.
