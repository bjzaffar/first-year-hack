# Worker prompt

Copy the following into the intended session and replace placeholders.

```text
Read AGENTS.md and follow docs/workflow.md. Use Babar (bjzaffar).

Assigned issue: ISSUE_URL
Session nickname: SESSION_NAME

Implement only this issue. Verify the current repository/worktree, assignment ownership, latest issue comments, merged dependencies, current integration branch, and relevant contracts. Use a dedicated worktree and new named task branch from the current integration branch. If this chat is in a shared local checkout, stop editing and tell me to reopen it in a worktree. Record your assignment comment and update status without removing unrelated labels.

Implement, run relevant checks, update affected docs, commit and push the task branch, and open a PR linked to the issue. Report blockers instead of silently changing scope. Do not merge, deploy, start another session, or claim another ticket. Finish with the handoff evidence required by tasks/TEMPLATE.md.
```
