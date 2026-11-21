# Worker prompt

Copy the following into the intended session and replace placeholders.

```text
Read AGENTS.md and follow docs/workflow.md. Use the human operator's own authorized GitHub account.

Assigned issue: ISSUE_URL
Session nickname: SESSION_NAME

Implement only this issue. Verify the current repository/worktree, assignment ownership, latest issue comments, merged dependencies, current integration branch, and relevant contracts. Use a new named task branch from the latest main. If another active session uses this same folder, stop editing and ask for a separate worktree or clone. A teammate working alone in their own clone does not need a worktree. Record your assignment comment and update status without removing unrelated labels.

Implement, run relevant checks, update affected docs, commit and push the task branch, and open a PR linked to the issue. Report blockers instead of silently changing scope. Do not merge, deploy, start another session, or claim another ticket. Finish with the handoff evidence required by tasks/TEMPLATE.md.
```
