# Règles permanentes du projet

## Toujours
-Écrire un test qui échoue (rouge) avant tout correctif.
-Réutiliser les composants existants avant d'en créer.
-Committer avec le format conventionnel : feat/fix/refactor(scope): 
message.
-Documenter toute décision d'architecture dans docs/decisions/.

## Jamais
-Committer des secrets, clés API, mots de passe.
-Modifier les fichiers de migration existants.
-Supprimer des données de production sans confirmation explicite.
-Utiliser des sélecteurs fragiles en test (class CSS, XPath, texte brut).

## Stack
- Framework : Next.js App Router (Next.js 16+)
- Langage : TypeScript strict
- Style : Tailwind CSS — pas de CSS custom sauf exception justifiée
- Composants : React Server Components par défaut, 'use client' si 
interaction
- Images : next/image obligatoire
- Navigation : next/link obligatoire
- Fetching : fetch natif dans les Server Components, pas de useEffect pour 
les données

## Index du savoir-faire

-Fichiers backend       → skill feature-implementation (.claude/skills/)
-Dossier backend/       → voir backend/CLAUDE.md
-Fichiers .sql          → rule rls-queries (.claude/rules/)
-Incident en prod       → gabarit docs/postmortems/TEMPLATE.md
-Décision d'archi       → gabarit docs/decisions/TEMPLATE.md
-Bug à corriger         → skill systematic-debugging (.claude/skills/)
-Feature à implémenter  → skill feature-implementation (.claude/skills/)
-Besoin flou à cadrer   → skill brainstorming (.claude/skills/)
