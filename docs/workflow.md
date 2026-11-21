# Workflow: research, tickets, manual sessions, integration

## Sources of truth

- Product scope: docs/brief.md. Technical agreements: docs/architecture.md and docs/contracts.md.
- Assignment, dependencies, progress, blockers, and handoffs: GitHub issues and PRs in the event repository.
- Research: docs/research.md, with source URLs and dates. A chat transcript is not shared project memory.
- Do not maintain a second live task board in Markdown. tasks/TEMPLATE.md is a reusable format and tasks/ is a temporary fallback only.

## Stage A: research and draft tickets

Research the event rules, judging criteria, candidate approaches, technical feasibility, and uncertain integrations. Label assumptions clearly. Propose a feasible MVP and demo journey for the available time; get the user's scope decision before building a detailed backlog for an unchosen idea.

Once asked to create issues, create actionable drafts using tasks/TEMPLATE.md. Search existing issues first. Draft titles can be plain language. Use status:backlog when available; record uncertainty or missing decisions. No workers start yet. Do not create real event issues just to initialize this source template.

## Stage B: organize the existing tickets

When the user asks, update existing issues in place:

- Title: `[P1-T003] Upload and preview a document` (example only).
- `P1` is the phase; `T003` is a project-wide task sequence, not GitHub's issue number. GitHub might call this issue #12.
- Allocate T numbers once, in dependency order where practical. Never reuse a retired number. Preserve IDs on repeated organization runs; when deliberately moving phases, retain T and update the phase prefix/label plus a short issue note.
- Default phases: P0 foundation; P1 core demo; P2 integration/reliability/submission; P3 optional stretch. Adapt at planning time if needed.
- Apply exactly one `phase:p0`/`phase:p1`/`phase:p2`/`phase:p3` and one status label. Use `priority:must`, `priority:should`, or `priority:stretch` when useful.
- Status labels: `status:backlog`, `status:ready`, `status:in-progress`, `status:blocked`, `status:review`, `status:done`.
- Create missing workflow labels with clear descriptions. Preserve unrelated labels; replace only conflicting labels in this workflow's namespaces. Never erase all labels to update one status.
- Put dependency issue links in the body, plus exact prerequisite outcomes. A phase does not itself enforce dependency order. Identify cycles and shared-file conflicts before marking ready.
- Return a compact table: issue URL, ID, phase, dependencies, readiness, and parallel group. Suggest assignments; the user makes them.

Only the organizing/integration session allocates task IDs. A worker who discovers extra work reports it and proposes a follow-up issue; it does not silently expand its task.

## Ready means actionable

A ready issue has a concrete outcome, testable acceptance criteria, boundaries, dependencies, validation steps, and relevant contract links. Dependency implementation must be merged into the integration branch before a worker starts, unless an explicit alternative base and integration plan are agreed. Missing provider credentials or product decisions that prevent meaningful progress must be visible.

P0 foundation should be integrated before parallel implementation. Phase labels are planning aids, not rigid barriers: a P2 task can start early if its actual dependencies are satisfied.

## Stage C: manual assignment and implementation

The user opens a worktree chat and supplies an issue URL and session nickname. On starting, the worker:

1. Reads AGENTS.md and required context; fetches current issue comments/status and prerequisite PRs.
2. Confirms no active owner. Existing ownership is not a lease the worker can overwrite: ask the user about a conflicting/stale assignment.
3. Records a comment: session nickname, worktree, branch, starting commit, scope, and intended checks. The user may post this comment if tooling is unavailable. A GitHub assignee is optional and does not identify a Codex session.
4. Changes status to in-progress, preserving phase/priority labels.
5. Uses branch `task/12-upload-preview` (issue number plus short slug). Never run two workers in one working directory. If Codex starts detached, create a named task branch before committing/pushing.
6. Implements within scope; reports blockers in the issue and chat. On blocked, use status:blocked and state what would unblock it. Do not silently take another issue.
7. Runs relevant checks and creates a PR targeting the documented integration branch, with `Closes #12`, acceptance evidence, limitations, and integration notes. Uses status:review while the issue remains open.

If connector capabilities do not support an action, use a verified Babar-authenticated alternative when available; otherwise report the exact missing action and give the user the prepared text. Never claim a remote update occurred without a returned result.

## Shared changes and environments

Integration owns shared contracts, dependency manifests/lockfiles, schema migrations, CI/root settings, and the shared deployment. An issue can explicitly delegate a shared change, but overlapping writers must agree on ordering first. Workers propose needed contract changes in the issue; integration resolves the agreement and publishes it before dependents implement against it.

Separate worktrees still share Git metadata and external resources. Give dev servers different ports, local databases separate files/names, and test services separate resources where needed. Do not run destructive migrations or cleanup against shared data. The foundation documents local env setup; ignored .env files are not automatically available in new worktrees. Keep secrets out of comments and tracked worktree-copy settings.

## Stage D: review and integration

Only the designated integration session merges, after the user has instructed it to integrate the selected PRs. Review acceptance criteria, contracts, scope, and evidence; fetch current branch heads and check for new commits before acting. Merge prerequisite PRs first. Resolve conflicts without dropping another worker's changes; return substantial feature corrections to its owner when practical.

Run app checks and the core user journey against the combined result. Mark done only when merged and verified. If the PR's closing keyword auto-closes the issue on the default branch, still confirm the closure and label. For another integration branch, close only after the agreed completion condition is met. On failure, reopen/update the issue and record the problem. Push ordinary merge/fix commits; do not force-push shared branches.

Do not delete active worktrees or branches automatically. Cleanup only after merged work is verified and the owning session has finished.

## Reusing sessions

Each new task gets a new branch from the current integration branch and a refreshed issue/context read. First preserve any unfinished changes and confirm the previous PR's outcome. A fresh chat is useful for unrelated work. The user assigns each new task; sessions do not automatically claim the next ticket.

## Completion and scope cuts

A task is complete when its acceptance criteria work, changes are integrated, relevant checks have recorded outcomes, documentation is accurate, and limitations are explicit. Cut work is closed with a reason, not marked implemented. Keep status labels consistent with the actual issue state.

Before submission, verify the deployed or local demo, seed data, access permissions, attribution, event requirements, and fallback. Deployment/submission requires the user's instruction and appropriate environment access.
