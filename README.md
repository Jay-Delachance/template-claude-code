# Claude Code Pro — Template

Squelette prêt à l'emploi pour démarrer un nouveau projet avec Claude Code. Clonez, personnalisez `CLAUDE.md`, codez.

## Ce qui est inclus

| Dossier / Fichier | Contenu |
|---|---|
| `.claude/agents/` | 6 agents spécialisés (Next.js dev, QA, SRE, reviewer…) |
| `.claude/rules/` | 7 règles (commits, logs sécurisés, Next.js, tests, ast-grep) |
| `.claude/hooks/` | `pre-tool-use.sh` et `post-tool-use.sh` |
| `.claude/commands/` | 7 commandes slash (brainstorming, plan, goal, loop…) |
| `.claude/skills/` | 2 skills (feature-implementation, audit-security) |
| `.github/workflows/ci.yml` | CI avec 3 jobs bloquants |
| `docs/` | Templates ADR et postmortem |
| `.git/hooks/pre-commit` | Scan des secrets avec gitleaks |

## Utilisation

1. Cliquer **Use this template** sur GitHub
2. Cloner le nouveau repo
3. Adapter `CLAUDE.md` au projet (stack, règles métier, index)
4. Lancer Claude Code : `claude`

## Prérequis

- [Claude Code](https://claude.ai/code)
- [gitleaks](https://github.com/gitleaks/gitleaks) — `brew install gitleaks`
- Node.js 20+
