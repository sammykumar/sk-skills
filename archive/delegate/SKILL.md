---
name: delegate
description: Delegate a task to the Claude running on the OTHER machine (personal Mac <-> AT&T work MBP) and get the result back. Use when the user says things like "ask the work Claude to...", "delegate this to home/the other machine", "have the work laptop check...", or otherwise wants something done in the environment of the machine you are NOT currently on.
---

# Delegate a task to the peer machine's Claude

Two machines each run Claude Code with a relay poller: **`personal`** (Sam's MacBook Pro) and **`work`** (AT&T work MBP). Each can hand a task to the other; the peer's Claude runs it headlessly in its own environment and returns the result over an authenticated relay (`relay.devlabhq.com`, Ubuntu-hosted). Works even when the work MBP is at the office.

## When to use
- The user wants something done on the machine you're **not** on (e.g. you're on `personal` and they ask about the AT&T work environment, or vice versa).
- Phrases: "ask the work Claude…", "delegate to home…", "have the other machine…", "what does the work laptop see for…".

## How to run
```bash
~/.claude/skills/delegate/delegate.sh <target> "<task>" [--read]
```
- `<target>` — `work` or `personal` (the machine to run ON; must differ from this one).
- `"<task>"` — a self-contained prompt. The peer Claude has **no shared context** with this conversation, so include everything it needs.
- `--read` — restrict the peer to read-only/safe tools. **Omit for full autonomy** (default): the peer can run arbitrary commands, including writes, on that machine.

The script blocks until the peer finishes (default 300s budget), then prints `[OK]`/`[FAILED]` and the peer's output. On timeout it returns the task id so you can re-check later.

## Behavior notes
- **Full autonomy is the default** — a delegated task can do anything on the receiving machine. Only delegate what you'd run yourself there. Use `--read` when you only need inspection/lookups.
- Write the task as a complete instruction (no "as we discussed"). Quote carefully.
- Relay/token config lives in `~/.config/devlab-relay/config`. If the peer's poller or the relay is down, the task waits in the queue and the script times out with the id.

## Examples
- User (on personal): "ask the work laptop what its hostname and OS version are" →
  `delegate.sh work "Report your hostname and macOS version. Be terse."` `--read`
- User (on work): "have my home machine run the test suite in image-gen-toolkit and summarize failures" →
  `delegate.sh personal "In ~/Development/SK-Productions-LLC/personal/image-gen-toolkit run 'npm test' and summarize the failures."`
