---
"sk-skills": patch
---

`repo-status` explains why CI is unavailable in plain words. Instead of a cut-off `gh` error such as "failed to get runs: HT…", it now names the cause: the org's IP allow list, an org that needs SSO or app approval for `gh`, a rate limit, a denied (403) or rejected (401) token, `gh` not signed in, or no GitHub remote.
