# Claude Code Pro — Template

Squelette prêt à l'emploi pour démarrer un nouveau projet avec Claude Code. Clonez, personnalisez `CLAUDE.md`, codez.

## Prérequis

- [Claude Code](https://claude.ai/code)
- [gitleaks](https://github.com/gitleaks/gitleaks) — `brew install gitleaks`
- Node.js 20+

## Démarrage

```bash
# 1. Créer un nouveau repo depuis ce template (bouton GitHub ou CLI)
gh repo create mon-projet --template jocelynjoubert/template-claude-code --private --clone

# 2. Rendre les hooks exécutables et installer le hook pre-commit
cd mon-projet
chmod +x .claude/hooks/*.sh
cp -n .git/hooks/pre-commit.sample .git/hooks/pre-commit 2>/dev/null || true
cat > .git/hooks/pre-commit << 'EOF'
#!/usr/bin/env bash
set -e
gitleaks protect --staged --redact --no-banner
EOF
chmod +x .git/hooks/pre-commit

# 3. Lancer Claude Code
claude
```

Puis personnaliser `CLAUDE.md` : stack du projet, règles métier, index des fichiers clés.

## Workflow de développement

```
/brainstorming          → cadrer le besoin (interview question par question)
        ↓
spec Gherkin            → écrire les scénarios dans specifications/
        ↓
/plan                   → décomposer en tâches
        ↓
skill feature-implementation  → implémenter (types → logique → interface + tests)
        ↓
agent qa-tester         → valider la couverture Gherkin, détecter les faux-verts
        ↓
agent sre-product-owner → arbitrer risque produit / stabilité, rédiger ADR si besoin
```

## Agents disponibles

| Agent | Rôle |
|---|---|
| `senior-nextjs-dev` | Implémentation Next.js/TypeScript (App Router, RSC, Tailwind) |
| `qa-tester` | Validation Gherkin, détection de faux-verts (lecture seule) |
| `sre-product-owner` | Arbitrage produit/SRE, ADR, postmortems (lecture seule) |
| `senior-nextjs-reviewer` | Revue de code, suggestions d'amélioration |
| `pipeline-monitor` | Surveillance CI, analyse des échecs |
| `project-maestro` | Orchestration multi-agents sur une feature complète |

## Commandes slash

| Commande | Usage |
|---|---|
| `/brainstorming` | Interview guidée pour cadrer un besoin flou |
| `/plan` | Décomposition d'une feature en tâches ordonnées |
| `/goal` | Définir l'objectif de la session en cours |
| `/loop` | Répéter une tâche en boucle (ex : surveillance CI) |
| `/monitor` | Observer l'état d'un processus en arrière-plan |
| `/ultrareview` | Revue approfondie multi-agents du diff courant |
| `/check-local` | Lancer typecheck + lint + tests avant de pousser |

## Hooks automatiques

**`pre-tool-use.sh`** — s'exécute avant chaque outil Claude Code :
- Bloque les commandes destructives (`DROP TABLE`, `DELETE FROM`, `rm -rf`, `kubectl delete`)
- Scanne les fichiers stagés avec gitleaks avant chaque `git commit`
- Pour passer outre (cas justifié) : ajouter `#allow-destructive` dans la commande

**`post-tool-use.sh`** — tronque les sorties longues à 100 lignes pour garder le contexte propre.

**`pre-commit`** (git hook) — double vérification gitleaks sur les fichiers stagés à chaque commit.

## Règles enforced automatiquement

**ast-grep** (bloquant à la revue) :
- `test.only()` interdit — empêche de merger des tests focalisés par erreur
- Requête SQL sans `organizationId` bloquée — protection multi-tenant par défaut

**Rules Claude Code** (chargées dans chaque session) :
- `commits.md` — format conventionnel obligatoire (`feat/fix/refactor(scope): message`)
- `secure-logging.md` — emails, tokens, clés API ne doivent jamais apparaître dans les logs
- `nextjs.md` — Server Components par défaut, `next/image`, `next/link` obligatoires
- `test-discipline.md` — tout bug corrigé doit avoir un test de non-régression
- `minimal-code.md` — pas d'abstraction avant deux cas réels, pas de paramètre préventif

## CI (3 jobs bloquants)

| Job | Ce qu'il vérifie |
|---|---|
| `quality` | TypeScript strict, ESLint zéro warning, Prettier, tests unitaires, scan gitleaks |
| `security` | `npm audit` niveau high |
| `e2e` | Tests Playwright (déclenché après `quality`) |

## Ce qu'il faut personnaliser après le clone

- **`CLAUDE.md`** — stack réelle du projet, règles métier, chemins des fichiers clés
- **`.claude/rules/rls-queries.yml`** — remplacer `organizationId` par votre clé de tenant si différente, ou supprimer si pas de multi-tenant
- **`.github/workflows/ci.yml`** — ajuster les commandes si vous n'utilisez pas npm (pnpm, yarn…)
- **`backend/CLAUDE.md`** et **`frontend/CLAUDE.md`** — détailler la structure réelle de chaque couche

## Structure

```
.
├── .claude/
│   ├── agents/          # 6 agents spécialisés
│   ├── commands/        # 7 commandes slash
│   ├── hooks/           # pre/post-tool-use
│   ├── rules/           # 5 règles .md + 2 règles ast-grep .yml
│   ├── skills/          # feature-implementation, audit-security
│   └── settings.json    # permissions, hooks, MCP
├── .github/
│   └── workflows/ci.yml
├── docs/
│   ├── decisions/TEMPLATE.md   # gabarit ADR
│   └── postmortems/TEMPLATE.md
├── backend/
├── frontend/
└── CLAUDE.md
```
