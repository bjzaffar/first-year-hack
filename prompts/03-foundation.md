# Foundation prompt

Copy the following into the intended session and replace placeholders.

```text
Read AGENTS.md and docs/workflow.md. Use my own authorized GitHub account. You are the designated integration session.

Foundation issue: [ISSUE_URL]
Planning PR to integrate first, if any: [PR_URL or none]

I authorize you to review and merge the planning PR if ready, implement the assigned foundation on a task branch, and open its PR. Follow the event repo review rule for merging: do not claim approval of your own PR; arrange another eligible reviewer or use an explicitly permitted admin bypass if the team lead authorizes that. Do not deploy or submit externally.

Verify the selected idea/stack, establish a minimal running app, actual setup/dev/check commands, app CI, .env.example, worktree setup, folder map, shared contracts, and environment isolation. Update README and relevant docs. Do not build unrelated features. Clearly distinguish template checks from app checks. Verify a fresh setup as practical. Return the merged foundation, check evidence, unresolved blockers, and ready issues I can manually assign next.
```
