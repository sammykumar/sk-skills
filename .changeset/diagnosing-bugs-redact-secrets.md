---
"mattpocock-skills": patch
---

Make `diagnosing-bugs` redact secrets.

- Add a **Redact** section to `SKILL.md`. The skill has the agent show commands, outputs and captured artifacts; the section makes redaction the first move on each — write `<REDACTED>`, show a command's shape (`Bearer $API_TOKEN`) rather than its credential, build loops against env vars, and redact HAR files, log dumps and payloads before quoting them.
- The Phase 1 completion criterion said "paste the invocation and its output". It now says show it redacted, and Phase 1 asks the user for a **redacted** captured artifact.
- Note in `scripts/hitl-loop.template.sh` that `capture` prints its value back to the terminal, so it takes observations while signing in stays a `step`.
