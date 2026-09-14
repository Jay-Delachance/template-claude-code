Active le skill feature-implementation (voir `.claude/skills/feature-implementation.md`).

Suis son protocole : lis la spec Gherkin de `specifications/`, réutilise les
composants existants avant d'en créer, implémente dans l'ordre types → logique →
interface, écris les tests en même temps (pas après), lance les vérifications
locales (test/lint/format sur src/) avant de déclarer terminé.
