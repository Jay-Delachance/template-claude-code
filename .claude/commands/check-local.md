# .claude/commands/check-local.sh
#!/bin/bash
set -e

echo "=== Typecheck ==="
npx tsc --noEmit

echo "=== Lint ==="
npx eslint src/ --max-warnings 0

echo "=== Format ==="
npx prettier --check src/

echo "=== Tests ==="
npm test

echo "=== Secrets ==="
gitleaks detect --source . --no-git

echo "✅ Toutes les gates passent"
