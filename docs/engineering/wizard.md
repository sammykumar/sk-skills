## What it does

`wizard` generates an interactive bash script that walks a human, step by step, through a manual procedure — wiring up third-party services, running a one-off migration, moving a project from state A to state B. It opens each URL, says what to click and copy, captures what comes back, and writes it into `.env` files and GitHub Actions secrets.

You reach for it only where a human is genuinely in the loop. If the agent could just do the step itself, it should do it, and a wizard for that step is a worse version of a tool call. Matt's reason for keeping the human there is provisioning: asked why an agent-browser doesn't do the whole setup unattended, his answer was "because it requires HITL to stop it provisioning stupid things." A wizard is for the clicks, approvals and dashboard trips you would not hand to an agent, packaged so you stop re-explaining them to one every time.

## When to reach for it

You invoke this by typing `/wizard` — the agent won't reach for it on its own.

Reach for it when the next thing blocking you is a human clicking through a dashboard:

| Situation | What the wizard does |
| --- | --- |
| A new dev needs six services configured before the app boots | Opens each dashboard in order, captures the keys, writes them to `.env` and CI |
| A one-off migration needs switches flipped in a specific order | Sequences the irreversible steps behind confirmation gates |
| A project has to move from state A to state B once | Walks the transition and reports what it could not do |
| You are about to write those steps into a README | Writes an executable version instead, which cannot rot as quietly |

Don't reach for it when the procedure is scriptable end to end — that is a script, and the agent should write and run it. Don't reach for it to *decide* what to build; for that, [grill-with-docs](https://aihero.dev/skills-grill-with-docs) and [to-spec](https://aihero.dev/skills-to-spec) are the tools.

## Prerequisites

None to generate one. The wizard it writes runs on bash, and reaches for `gh` when a stage sets a GitHub secret or variable. If `gh` is missing or unauthenticated, that stage degrades to a warning and the closing summary tells the human what to set by hand, rather than failing the run.

## Stages

A **stage** is the unit of authoring and the unit of attention: one focused task, one screen. The script clears the terminal between stages, so anything that doesn't fit the screen is anything the human loses. You author them in dependency order and set an honest `TOTAL_STAGES` and `TOTAL_MINUTES`, which is what drives the time-remaining display. That estimate is a promise to the person running it.

Scoping happens before a line is written. The skill reads the repo rather than asking cold — `.env*`, `docker-compose*`, framework config, and every `secrets.*` / `vars.*` reference in `.github/workflows/`, each of which is a value the wizard must produce. Then it shows you the ordered stage list to confirm, and only then maps each stage to the precise path a human follows ("Dashboard → Developers → API keys → Reveal test key → copy"). Where it doesn't know the current UI, it asks or checks the docs; it doesn't invent clicks that may not exist.

For each captured value, scoping has to settle where it lands:

| Destination | When |
| --- | --- |
| `.env` only | Local dev needs it, CI doesn't |
| GitHub secret | CI reads it, and it's sensitive |
| GitHub variable | CI reads it, and it's public |
| Both `.env` and a secret | Local dev and CI both need it |
| Nowhere | The stage is a pure action — a switch flipped, a plan upgraded |

## The UX is not yours to design

A [template](https://github.com/mattpocock/skills/blob/main/skills/engineering/wizard/template.sh) already solves it: progress with time remaining, confirmation gates, cross-platform URL opening including WSL, hidden entry for secrets, idempotent `.env` upserts, `gh secret` / `gh variable` writes, and a closing summary of everything it had to skip. Everything above the `STAGES` marker is a fixed library, identical in every wizard, never hand-edited. The consistency is the point. Your job is only to scope the procedure and author its stages.

The agent that writes a wizard never runs it end to end — it opens browsers and blocks on human input. Verification is static instead: `bash -n`, `shellcheck` where available, and a trace that every value lands where scoping said it would, with every `set_secret` name matching a real `secrets.*` reference in CI. That is worth knowing because it sets your expectations honestly. The first person to run the wizard is you, and you are the test.

## Ephemeral by default

| What you have | What to do with the script |
| --- | --- |
| A one-off migration, a personal setup, a transition you'll never repeat | Save it to a scratch or `scripts/` path, run it, delete it |
| A setup path the next person on the repo will also need | Commit it and link it from the README, so they run the script instead of re-asking an agent |

## Common questions

**Do my API keys end up in the model's context?**

No. The agent writes a script; it doesn't run it. You run the script yourself, and it captures the key with hidden terminal entry and writes it straight to `.env` or `gh secret`. Matt's answer to this on launch day was "No, because it's a CLI — the LLM is not connected to it." The caveat worth stating: that holds for values the wizard captures at runtime. If you paste a key into the chat while scoping the procedure, it's in the context like any other pasted text.

**Can I go back and fix a value I mistyped?**

Not mid-run. There is no back button — the stages run forward, and a wrong answer on stage 3 means Ctrl-C and re-run. Re-running is cheap by design: any value already written to `.env` is offered back as a default, so you press Enter through the stages you got right and retype only the wrong one. This came up in the launch week and hasn't been closed since: "loved it! One thing though — is there a way to go back and correct what you've entered?"

There's a related open bug. Arrow keys in an `ask` prompt insert `^[[D` / `^[[C` instead of moving the cursor, because the prompt uses `read -r` rather than Readline ([issue #741](https://github.com/mattpocock/skills/issues/741)). Backspace works; arrow keys don't. Delete back to the mistake rather than moving the cursor into it.

**Does it know what I've already set up?**

Partly, and less than the launch reactions assumed. It reads the repo before it asks — your `.env` files, `docker-compose`, framework config, the `secrets.*` references in CI — so it scopes to values that are genuinely missing rather than starting from zero the way a README does. What it doesn't do is check the third-party service. If a key exists in your `.env` the wizard offers it back and Enter keeps it; if you already created the Stripe account but never saved the key, the wizard still sends you to the dashboard for it.

**Why not let an agent-browser do the whole setup automatically?**

Because provisioning is where an unattended agent spends your money and creates things you didn't want. The human in the loop is the point of the skill, not a limitation of it. Where a step genuinely is safe to automate, the agent should do it directly and the wizard shouldn't carry it at all.

**Where does it sit in the workflow — after grilling and the spec?**

Nowhere in particular. It's a standalone, not a chain step. The common guess is `/grill-with-docs → /to-spec → /wizard`, and that sequence is fine, but the trigger is a human-only procedure showing up, which can happen at any point: before you start, mid-build, or long after ship. It also works as a discovery tool — scoping surfaces the hidden prerequisites of a task, like the three API keys you hadn't thought about, before you commit to the work.

**Does it work outside Claude Code?**

The artifact does, unconditionally: it's a plain bash script and it doesn't care what harness generated it. The skill itself is user-invoked, so you type `/wizard` in Claude Code or `$wizard` in Codex. One known gap — on Claude's desktop and web surfaces, which run in coordinator mode, every user-invoked skill is dropped from the model's listing entirely, so the assistant tells you `/wizard` isn't installed when it is. The plain `claude` CLI is unaffected. The tracking issue is [#693](https://github.com/mattpocock/skills/issues/693); the fix belongs in the harness.

**It used to be in `in-progress/` — where is it now?**

`engineering/`, as of v1.2. It graduated out of the beta bucket and now ships in the plugin, so it arrives with the rest of the promoted set rather than needing an individual install. Its behaviour didn't change on graduation.

## It's working if

- You're shown an ordered list of stages, and the values each one produces, and asked to confirm — before any script exists.
- Every URL is opened before the value from that page is asked for. You're never asked to paste something you haven't been sent to fetch.
- Secrets are typed blind. Nothing sensitive echoes into your scrollback.
- Each stage fits one screen. Nothing you still need has scrolled away.
- Ctrl-C and re-run picks up where you left off, offering the values already saved as defaults.
- The final screen lists what it wrote, and separately lists what it couldn't do and you have to finish by hand.

## Where it fits

`wizard` is a reach-for-it-anytime standalone, sitting at the line where automation stops and a human has to click. Its nearest neighbour is [setup-matt-pocock-skills](https://aihero.dev/skills-setup-matt-pocock-skills), because both exist to get a repo into a working state — that one configures this skill set, while `wizard` generates a setup path for everything else. It also pairs with [implement](https://aihero.dev/skills-implement): when a build lands a feature that needs credentials or a manual cutover, a wizard is how the human half gets done. When you're unsure which skill fits the moment, [ask-matt](https://aihero.dev/skills-ask-matt) routes you.
