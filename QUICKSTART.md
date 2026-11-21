# Practical hackathon guide

## Start the event repo

On GitHub, open this template and choose **Use this template → Create a new repository**. That new event repo is the shared project: its issues, branches, PRs, and code are what the team uses. Invite teammates as collaborators with ordinary write access; have each accept the invite. They clone the event repo once and work in their own local copy. Local edits are private until pushed; pushing a ticket branch does not merge it into `main`. Do not use Download ZIP for ongoing collaboration because it omits Git history and the remote connection.

Check event rules on pre-existing code, AI use, APIs, data, visibility, and submission. The app idea and stack are deliberately undecided. Ask the manager AI to fill the brief, research, development, and architecture docs as decisions are made.

## Set up review ownership

The event repo has `.github/CODEOWNERS` with `* @bjzaffar`. Keep that if Babar is the team lead; replace it with the actual lead's GitHub username if different. The owner must have repository write access. In the **event repo**, protect `main`: require a PR, one approval, review from Code Owners, and dismissal of stale approvals after new commits. Leave force pushes and deletions disabled. Check that the rule is active for the repo's visibility and account plan. Ordinary collaborators cannot merge before the required code owner approval; after approval, someone with merge permission can click Merge. Administrators can bypass a classic rule unless bypassing is disabled. If you disable admin bypass, the lead cannot approve their own PR and will need another eligible reviewer. Test the setup with a small teammate PR.

## Plan and assign

1. In the lead's manager chat, use [prompts/01-research.md](prompts/01-research.md) to research the event, choose a feasible MVP, and create draft issues in the event repo. Give it event rules, deadline, team size, interests, and constraints.
2. Use [prompts/02-organize-tickets.md](prompts/02-organize-tickets.md) to label/number the existing issues, record dependencies, and identify independent tickets. `P1-T003` is a phase/task ID; GitHub `#12` is the issue number. The lead assigns issues manually.
3. Finish and merge the foundation issue using [prompts/03-foundation.md](prompts/03-foundation.md). It establishes the runnable app, actual setup/check commands, shared contracts, and CI before parallel feature work.
4. Give each teammate a different ready issue URL. Dependencies should already be merged into `main`. The same issue board and PR list are visible to everyone with repo access.

## Teammate copy and paste prompts

**When starting:**

> Clone this shared event repo to my computer: [REPO URL]. Open the cloned folder, read AGENTS.md and docs/workflow.md, create a new branch for issue [ISSUE URL], and implement only that ticket. Check that I am signed into GitHub with my own account and have access. Tell me if I need to sign in or accept an invitation. Do not write to main or merge anything.

**When ready to submit:**

> Review my changes for issue [ISSUE URL]. If I edited on main locally, move the uncommitted work to a new ticket branch first. Run relevant checks, commit and push my ticket branch, then open a PR into main in the shared event repo. Link the issue, summarize the changes and checks, and give me the PR link to send to the team lead. Do not merge it.

Git is enough for cloning, branching, committing, and pushing. GitHub CLI (`gh`) is optional: the teammate's AI may create the PR through an available GitHub connection or browser; otherwise the teammate can click **Compare & pull request** on GitHub after the branch is pushed. Their AI must use that teammate's own GitHub login. A branch is part of the clone, not another downloaded folder. Create one new branch per ticket; after a PR is merged, update from `main` before the next ticket.

## Lead's own two workers

The lead can keep one low-volume desktop manager chat and two Codex terminal workers in separate worktrees of the event repo. Assign different independent tickets. Use Astra Medium for the manager, GPT-6.1 Sol for standard workers, and Luna for bounded styling/boilerplate. Each worker has a ticket branch, pushes a PR, and stops. Worktrees isolate local files; they do not isolate ports, databases, or external services. Never run two workers in the same folder. Switch between terminal tabs while they work. Save each handoff in the PR/issue, then start a fresh worker chat for the next ticket. The separate PDF field guide gives the practical loop and cleanup steps.

## Review, merge, and repeat

The lead sends the manager the PR links, asks it to review the latest commits and merge ready PRs in dependency order, then run combined checks and the demo journey. Workers and teammates do not merge their own PRs. For the lead's terminal workers, exit their sessions and stop dev servers before asking the manager to inspect and remove the temporary worktrees. A teammate's ordinary clone stays on their computer; the lead does not remove it. Keep the manager chat short by using issues for status, PRs for evidence, and docs for durable decisions. Reserve time for integration, demo rehearsal, and submission.

## If blocked

- Wrong GitHub identity or missing access: stop the remote write; sign in with the operator's own account or accept the repo invitation.
- Competing changes to a shared file: pause the overlap; let the lead choose the owner and order.
- Failed checks or conflict: keep the PR and branch; fix the issue before merge. Do not discard uncommitted work.
- Missing app commands: the foundation issue must fill docs/development.md. Template documentation CI is not an app test.
