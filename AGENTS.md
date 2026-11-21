# Instructions for every AI session

These instructions are shared with every collaborator who clones this repository. Each person uses their own GitHub account and AI tool. A local connection nickname or another person's credentials are never assumed.

## Before work

1. Read README.md, docs/workflow.md, docs/brief.md, docs/development.md, and the assigned GitHub issue with its latest comments and dependencies. Read relevant architecture and contract sections for implementation.
2. Confirm the repository remote, current folder, branch, Git status, and active GitHub identity before a remote write. Use the human operator's own authorized account. If identity or access is unclear, stop the remote write and ask that person to sign in; do not switch to another person's account.
3. Treat unknown project fields as unknown. Research may explore alternatives; implementation needs an actionable assigned issue. Ask the human owner about material product or scope changes.
4. Keep tokens, passwords, private keys, and personal connection identifiers out of tracked files, tickets, and logs. Commit author settings do not prove push authentication.

## Tickets, branches, and pull requests

- The team lead manually assigns issues. Work on one assigned issue at a time. Check its dependencies and current owner before starting; record a short assignment/status update in the issue when possible.
- Use a separate named branch for each ticket, based on the latest shared `main` after prerequisites are merged. A teammate may use an ordinary clone; parallel AI sessions on one computer need separate worktrees or separate clones. Never put two active writers in one folder.
- Keep changes within the ticket. Coordinate edits to shared contracts, lockfiles, migrations, CI, and root settings through the issue and team lead before overlapping work.
- Run relevant checks, update affected docs, commit and push the ticket branch, then open a PR targeting `main`. Link the issue and state changed behavior, checks and actual outcomes, limitations, and integration needs. A local commit alone is not a handoff.
- Do not merge your own or another person's PR, push directly to `main`, force-push shared branches, deploy shared environments, or close implemented issues unless the team lead explicitly assigns that responsibility.
- The team lead reviews PRs and coordinates merges in dependency order. GitHub branch protection and CODEOWNERS are repository settings, not substitutes for reviewing the current PR head.

## Build and handoff

- Prioritize the agreed demo journey and acceptance criteria. Follow the selected stack and existing conventions; avoid unrelated refactors.
- Keep secrets local; add placeholders to .env.example. Use synthetic data unless real data is appropriate and authorized. Worktrees isolate files, not ports, databases, or cloud services.
- Report blockers in the issue. Do not claim checks passed unless they ran. Finish with the issue and PR links, branch, behavior, verification evidence, limitations, and next action. Follow tasks/TEMPLATE.md.
- AI chats do not share private context or uncommitted files. GitHub issues, PRs, and merged repository docs carry team decisions.

## Review standard

Check acceptance criteria, shared contracts, errors and empty states, secrets, unintended data access, and the core demo. Separate observed defects from optional suggestions.
