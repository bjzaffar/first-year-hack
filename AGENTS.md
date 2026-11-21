# Instructions for every session

## Read first

1. Read README.md, docs/workflow.md, docs/brief.md, and docs/development.md.
2. Read your assigned issue, its latest comments and dependency issues/PRs. For design or implementation, read docs/architecture.md and relevant docs/contracts.md sections.
3. Inspect repository remote, working directory, branch, and Git status before editing. Confirm you are in the intended event repository, not accidentally changing the source template.
4. Unknown/TBD fields are unknowns, not permission to invent requirements. Research sessions may explore; implementation sessions need an actionable issue. Resolve routine implementation choices yourself; ask about decisions that materially change the product or scope.

## GitHub identity

- Use the connected GitHub account named **Babar**, username **bjzaffar**, for all GitHub operations unless the user explicitly specifies another account.
- Never fall back to **Imaad**. If Babar cannot access a repo, report the blocker.
- Prefer the GitHub connector when it supports the operation; select Babar explicitly. Connection nicknames are local account settings, not credentials stored in this repo.
- Terminal Git/gh authentication is separate: verify the active account and push credentials identify bjzaffar before any remote write. Do not change global authentication or global Git configuration as a workaround.
- Verify commit author settings separately. Use the user's existing appropriate author identity; ask if missing or ambiguous. Never invent an email or treat user.name as proof of push authentication.
- Never store tokens, passwords, private keys, or internal connector link IDs in tracked files or logs.

## Session scope and coordination

- Default model: independent Codex sessions manually assigned by the user. Do not launch subagents or additional sessions unless explicitly requested.
- Workers implement only their assigned issue in a separate worktree and task branch. One designated integration session owns merges and the shared demo environment.
- Follow docs/workflow.md for issue numbering, labels, dependency checks, assignment, branch naming, handoff, and integration.
- Do not assume another chat can see this conversation or uncommitted local files. GitHub issues/comments and merged repository files carry shared state.
- Do not overwrite, reset, stash, delete, or clean up another session's changes. Do not switch branches under a running session.
- Coordinate shared contracts, dependencies/lockfiles, schemas/migrations, CI, and root configuration with integration before overlapping changes. Propose the exact change and affected issues; wait when another session owns the conflicting work. Routine changes explicitly included in your assigned issue remain authorized.
- Workers may commit, push their task branch, and open a PR when assigned implementation. Workers do not merge, close implemented issues, or deploy shared environments. Integration merges when the user asks it to integrate.

## Build and verify

- Prioritize the agreed demo journey and acceptance criteria. Prefer a small working vertical slice; avoid unrelated refactors and speculative infrastructure.
- Follow the chosen stack and existing conventions. Document meaningful design decisions in docs/decisions.md without rewriting unrelated entries.
- Keep secrets local. Update .env.example with placeholders and docs/development.md with setup changes. Use synthetic data unless real data is explicitly appropriate and authorized.
- Isolate ports, local databases, and external test resources per session. Worktrees do not isolate external services.
- Run relevant checks from docs/development.md and test the changed behavior. Add meaningful regression coverage for defects and important logic. Record exact commands, outcomes, and anything skipped; do not claim a check passed unless it ran successfully.
- Update affected documentation with the change. Report blockers and incomplete work promptly in the issue and to the user.
- End with the issue/PR, branch, changed behavior, verification evidence, limitations, and next action. Follow tasks/TEMPLATE.md's handoff format.

## Code review rules

Check acceptance criteria, integration contracts, error/loading/empty states, accidental secrets, unintended data access, and regressions in the core demo. Distinguish observed defects from suggestions. Flag missing validation when it materially affects confidence.
