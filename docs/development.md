# Development environment

Status: NOT CONFIGURED. This is a documentation starter, not a runnable application.

Foundation must fill and verify:

| Item | Actual value |
| --- | --- |
| Runtime/tool versions | TBD |
| Dependency install command | TBD |
| Local configuration / env setup | TBD |
| Development server command | TBD |
| Port override and per-session examples | TBD |
| Local database / seed / reset commands | TBD or not applicable |
| Formatting / lint / typecheck | TBD or not applicable |
| Automated tests | TBD |
| Production build | TBD or not applicable |
| Core manual smoke test | TBD |
| App CI workflow and required checks | TBD |
| Deployment command, environment, owner | TBD or not applicable |

Do not substitute a template-docs check for app checks. Add real commands to README and configure app CI during foundation. Explain prerequisites, expected local URL, credentials needed by name, synthetic seed data, and how a fresh worktree gets dependencies/configuration without exposing secrets.

## Environment variables

List each required variable, purpose, whether client-visible or server-only, and local/test/deployment provisioning. Keep only placeholders in .env.example. Never expose server secrets through a frontend/public variable prefix.

## Worktree setup

Each session installs/prepares its own dependencies and local env as required by the stack. Use separate ports and database/test resources. Do not change global Git settings; verify account authentication independently of commit author settings.

## Template-only check

`python3 scripts/check_template.py` verifies starter links and required files. Python 3 is needed only for that check unless the chosen app also uses Python.
