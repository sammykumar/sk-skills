---
"sk-skills": minor
---

`repo-status` can send its CI lookup through a proxy of your choice. Set `REPO_STATUS_GH_PROXY` (for example in your Claude Code settings' `env`), and the `gh` calls behind the CI line use that proxy instead of the session's. This helps on networks where GitHub accepts only some routes, such as behind an org IP allow list.
