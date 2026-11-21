"""Validate starter files and local Markdown links; not application behavior."""
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = ['AGENTS.md', 'README.md', 'QUICKSTART.md', '.env.example', '.gitignore',
            'docs/brief.md', 'docs/workflow.md', 'docs/research.md',
            'docs/architecture.md', 'docs/contracts.md', 'docs/development.md',
            'docs/decisions.md', 'docs/demo.md', 'tasks/TEMPLATE.md',
            '.github/ISSUE_TEMPLATE/task.yml', '.github/pull_request_template.md',
            '.github/workflows/template-check.yml',
            'prompts/01-research.md', 'prompts/02-organize-tickets.md',
            'prompts/03-foundation.md', 'prompts/04-worker.md',
            'prompts/05-integrate.md', 'prompts/06-demo.md']


def main():
    errors = [f'Missing starter file: {name}' for name in REQUIRED
              if not (ROOT / name).is_file()]
    checked = 0
    for directory in (ROOT, ROOT / 'docs', ROOT / 'prompts', ROOT / 'tasks', ROOT / '.github'):
        for path in directory.glob('*.md'):
            checked += 1
            content = re.sub(r'```.*?```', '', path.read_text(), flags=re.S)
            for target in re.findall(r'\[[^\]]*\]\(([^)]+)\)', content):
                target = target.strip().strip('<>')
                url = urlsplit(target)
                if url.scheme or url.netloc or not url.path:
                    continue
                dest = (path.parent / unquote(url.path)).resolve()
                try:
                    dest.relative_to(ROOT)
                except ValueError:
                    errors.append(f'{path.relative_to(ROOT)}: link escapes starter: {target}')
                    continue
                if not dest.exists():
                    errors.append(f'{path.relative_to(ROOT)}: broken link: {target}')
    if errors:
        print('\n'.join(errors), file=sys.stderr)
        return 1
    print(f'Starter structure and local Markdown links OK ({checked} documents).')
    print('Application checks are separate; see docs/development.md.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
