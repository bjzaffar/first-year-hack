# Hackathon starter

A reusable, stack-neutral starting point for Babar's hackathons. No idea, track, framework, or application is selected yet.

**Start with [QUICKSTART.md](QUICKSTART.md).** It contains the practical sequence and copy-and-paste prompts.

## How this works

Research → create draft GitHub issues → number and phase those issues → prepare the foundation → manually assign ready issues to separate Codex sessions → review and merge → demo.

Use the GitHub connection **Babar**, username **bjzaffar**. Each worker has one issue, one worktree, and one branch. One designated integration session coordinates shared changes and merges. Nothing here automatically creates tickets, starts sessions, or deploys.

## What changes when

| File | When to change it | Owner |
| --- | --- | --- |
| AGENTS.md, docs/workflow.md | Reuse; adjust only when your working rules change | You/integration |
| docs/brief.md | At kickoff, then when scope changes | Research/planning |
| docs/research.md | During research; update material findings | Research/planning |
| docs/architecture.md, docs/contracts.md | Foundation, then meaningful design changes | Integration; workers propose changes |
| docs/decisions.md | When a significant decision is made | Session making the decision |
| docs/demo.md | Sketch early; finalize before submission | Integration/demo |
| docs/development.md, .env.example | When the stack is selected or setup changes | Foundation/integration |
| prompts/, tasks/TEMPLATE.md | Usually reuse unchanged | You |
| GitHub issues | Throughout the event: scope, status, assignment, handoff | Assigned sessions/integration |

## Folder map

- `AGENTS.md`: essential instructions every session must follow.
- `docs/`: project context, technical agreements, and workflow.
- `prompts/`: reusable prompts for each stage.
- `tasks/TEMPLATE.md`: canonical issue body; local fallback if GitHub is unavailable.
- `.github/`: manual issue form, PR template, and template-documentation CI.
- `scripts/check_template.py`: checks local Markdown links and required template files.
- `src/`, `tests/`, `public/`: suggested application locations, adapted during foundation.
- `work/`: ignored scratch files; never the only copy of a decision or handoff.

A single app can live in `src/`. Create `apps/` and `packages/` only if multiple applications actually require them. Framework conventions take precedence over empty starter folders; remove unused folders.

## Commands

Template validation (requires Python 3):

```sh
python3 scripts/check_template.py
```

There is **no application setup, dev server, build, or app test command yet**. The foundation issue must establish and verify these in [docs/development.md](docs/development.md), add the chosen stack's CI, and update this section. Template CI only validates the starter documentation; it does not validate an application.

## Reuse

In GitHub repository Settings → General, enable **Template repository** if not already enabled. At each hackathon use **Use this template → Create a new repository**, then work in that new repository. Keep this source template reusable. Files copy; event tickets and labels must be created in the new repository.

Choose a license when you know the event's rules and your desired terms; this starter does not assume one. Check rules about pre-existing code, AI assistance, sponsor APIs, data use, and submission requirements before building.

References: [Codex instructions](https://learn.chatgpt.com/docs/agent-configuration/agents-md), [Codex worktrees](https://learn.chatgpt.com/docs/environments/git-worktrees), [GitHub templates](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-template-repository).
