# Practical hackathon guide

## Once, for this source template

Enable GitHub Settings → General → Template repository. The folder contents alone do not toggle this setting. Keep reusable rules here; do event work in a new repository.

## 1. Create your event repository

Use GitHub's **Use this template → Create a new repository**. Give it the event/project name, choose visibility according to event rules, clone it, and open it as a Codex project. Ensure Babar can access it. Create issues in this new repo, not in the source template.

## 2. Research and create tickets

Open one main session, which can later become the integration session. Paste [prompts/01-research.md](prompts/01-research.md) and provide the event brief/rules, time available, team size, interests, and any idea you already have. The AI researches, records evidence, helps settle the MVP with you, and creates draft issues. If research happened in another AI tool, give Codex its report, sources, and issue links; tell it to reconcile those with the docs before proceeding.

You do not need to edit every Markdown file yourself. Ask the AI to fill the relevant files based on your answers.

## 3. Number and phase the existing tickets

In that main session paste [prompts/02-organize-tickets.md](prompts/02-organize-tickets.md). Codex updates the existing issues, creates necessary labels, records dependencies, and returns a table of what can run in parallel. It does not create duplicate tickets or start worker sessions.

## 4. Finish the foundation first

Assign the setup/foundation issue to the main session using [prompts/03-foundation.md](prompts/03-foundation.md). Ask it to implement and integrate that foundation. It chooses the agreed stack, gets the app running, records commands/contracts, and adds actual app checks. Foundation and planning context must be committed and merged before workers branch from it.

## 5. Open two worker chats

In Codex open a new chat for the event project, choose **Worktree**, and start from the updated integration branch (normally main). Paste [prompts/04-worker.md](prompts/04-worker.md), replacing ISSUE_URL and SESSION_NAME. Repeat for another independent ready issue.

Example: Worker A gets issue #12; Worker B gets #13. Their issue IDs might be P1-T003 and P1-T004. The issue URLs are the safest assignment reference.

Each worker checks dependencies, records its assignment comment, implements, tests, pushes its own branch, and opens a PR. You monitor progress through the chats and issues. No GitHub bot or automatic dispatcher is required.

## 6. Integrate completed PRs

Return to the main chat and paste [prompts/05-integrate.md](prompts/05-integrate.md) with the PR links. It reviews them, merges in dependency order, runs combined checks, and updates issue status. Workers do not merge each other's work.

## 7. Give a worker its next issue

Reuse a worker for related work, or open a fresh worktree chat for unrelated work. Say:

> Finish the previous handoff. Check that its PR is merged and your work is saved. Start issue ISSUE_URL on a new branch from the latest main. Follow AGENTS.md and re-read the issue and updated contracts.

Do not just keep committing to the old merged branch. If a branch/worktree is dirty, preserve the work and resolve its ownership before switching. A session that is blocked reports it; you choose whether to reassign it.

## 8. Prepare the submission

Paste [prompts/06-demo.md](prompts/06-demo.md) in the main chat. Walk through the real demo yourself, verify links/access, and submit according to event rules. Ask explicitly if you want Codex to deploy or submit externally.

## Your main responsibilities

Choose the idea and scope; manually give tickets to sessions; tell integration which PRs to merge; provide secrets through appropriate local/service settings; make final demo/submission decisions. Let sessions maintain docs and ticket updates as part of their work.

## If something goes wrong

- Wrong account: stop remote writes; reconnect/verify Babar. Do not use Imaad as fallback.
- Two sessions editing the same area: pause that overlap, name one owner, and sequence the changes.
- Missing GitHub access: use one file per task under tasks/ temporarily, report that remote state is unavailable, and reconcile into issues when access returns.
- Too little time: cut stretch issues, preserve a working demo, and write down limitations rather than claiming unfinished features.
