## What it does

`update-sk-skills` brings the skills on this machine up to date. It never assumes how they got here: it reads the evidence on disk first, then runs the update command that matches what it found.

That is the whole point of the skill. There are four routes in (the Claude Code plugin, the Codex plugin, skills.sh, and a symlinked dev checkout of the repo) and each is updated by a different command, so an updater that guesses is usually wrong. The harness you are in does not settle it either: Claude Code and Codex each have a plugin route and a skills.sh route, and a machine can carry more than one at once.

## When to reach for it

You invoke this by typing `/update-sk-skills`; the agent won't reach for it on its own.

Reach for it when you want the newer skills: a changelog entry you read, a skill that behaves differently from how the docs describe it, or just periodic upkeep. For configuring a repo to *use* the skills, which is a different job entirely and runs once per repo, use [setup-sk-skills](../engineering/setup-sk-skills.md).

## The four routes

Each leaves its own fingerprint, and the skill looks for all of them before acting rather than stopping at the first hit.

| Route | What it looks for | How it updates |
| --- | --- | --- |
| **Claude Code plugin** | an `sk-skills@<marketplace>` entry in the installed-plugins record, with its scope and version | refresh the marketplace, then update the plugin at the scope it is installed at |
| **Codex plugin** | an `sk-skills@<marketplace>` table in Codex's config, with the marketplace it came from and whether it is enabled | refresh the marketplace snapshot, then re-run the install, which upgrades in place |
| **skills.sh** | a global or project-scoped lockfile entry sourced from `sammykumar/sk-skills` or the legacy `sammykumar/skills` | update those skills by name, in that scope |
| **Dev checkout** | the skill directory is a symlink into a git working tree of the repo | pull the checkout, then relink |
| **Hand-copied files** | real directories, no lockfile entry, no plugin record | nothing automatic; adopt one of the supported routes |

Three findings get reported rather than acted on. A **dev checkout with a dirty tree** is never pulled under your work. A **plugin installed but disabled** is up to date and still not running, which is worth knowing before you wonder why nothing changed. And **a plugin and skills.sh present at once** is a duplicate install, not a two-for-one: both copies of the same skill load, with no way to tell which is running, so the skill stops and asks which one to keep.

Carrying **both plugins** is not that case. They serve different harnesses from the same repo, so a machine running both agents is expected to have both, and the skill updates each rather than asking you to choose.

## Common questions

**Why did nothing change after it said the plugin updated?**

A plugin update lands on disk but does not apply to a running session. Restart the session. The skill says so in its report, and the underlying CLI says the same thing in its own output.

**The two routes report different versions. Which one is right?**

Both, for different definitions. The plugin installs a released version from the marketplace; skills.sh installs what is on the repository's default branch, which includes changes merged since the last release. Someone on the skills.sh route can be running skills that no released version contains yet. This has been raised directly as an issue, and it is a property of the two distribution routes rather than a bug in either.

**Will it still find an installation made before the repository rename?**

Yes. It recognizes both the current `sammykumar/sk-skills` source and the legacy `sammykumar/skills` source in global and project lockfiles. Existing installations keep their recorded source; the skill updates the detected skills by name in the matching scope.

**Will it overwrite the edits I made to a skill?**

On the skills.sh route, yes: an update rewrites the skill files, and the whole premise of that route is that the files are yours to edit. The skill flags local modifications it can see before running, but the safe habit is to keep your changes in a fork you install from. The plugin route is read-only, so there is nothing to overwrite.

**Do I need to re-run `/setup-sk-skills` afterwards?**

Only if a skill's setup expectations changed. The config in `docs/agents/` is per-repo and outlives updates. The seed templates it was written from do change between versions, so if a skill starts describing your tracker differently from how your `docs/agents/issue-tracker.md` reads, re-running setup is the cheap fix.

**Why is this a skill rather than a slash command file?**

A command file in `.claude/commands/` exists only in the repo that carries it, and command formats do not cross harnesses. A user-invoked skill is the one shape both plugin manifests and skills.sh all distribute, which is what makes `/update-sk-skills` available on both harnesses and on every installation route.

## It's working if

- Before running anything, it shows you a table of what it found and the exact commands it proposes.
- The route it names matches how you actually installed the skills, including when that is a symlinked checkout rather than an installer.
- After a plugin update it tells you to restart the session, rather than leaving you to notice.
- On a machine carrying a plugin and skills.sh at once it stops and asks, instead of updating both and leaving the duplicates in place. Carrying the Claude Code plugin and the Codex plugin together does not trigger that: both get updated.
- Afterwards, a skill you knew had changed reads the new way.

## Where it fits

`update-sk-skills` is **periodic maintenance** on the skills themselves, off every flow. Its one neighbour is [setup-sk-skills](../engineering/setup-sk-skills.md), the run-once setup that points the skills at a repo's tracker and docs: that one configures how the skills read *this repo*, this one changes which version of the skills you are running everywhere. For which skill to reach for next, [ask-sk](../engineering/ask-sk.md) routes the whole set.
