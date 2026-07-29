# Postmortem · [Titre]

Date : YYYY-MM-DD
Sévérité : P1 | P2 | P3
Durée de l'incident : HH:MM → HH:MM

## Résumé

[Une phrase : ce qui s'est passé, l'impact, la résolution.]

## Timeline

| Heure | Événement |
|-------|-----------|
| HH:MM | Détection |
| HH:MM |           |
| HH:MM | Résolution |

## Causes racines

[Plusieurs causes distinctes, pas juste le symptôme visible. Un postmortem avec une seule cause est souvent incomplet.]

1.
2.
3.

## Correctif appliqué

[Ce qui a été fait pour régler le problème immédiat.]

## Ce qui change pour éviter la récidive

- [ ] Rule ajoutée : `.claude/rules/XXX.md`
- [ ] Test de non-régression : `tests/XXX.test.ts`
- [ ] ADR créé : `docs/decisions/ADR-XXX.md`
- [ ] Issue de suivi : #

## Seuils de déclenchement

| Seuil | Action |
|-------|--------|
| 1–2 bugs similaires sur 14 jours | On note |
| ≥ 3 bugs similaires | Postmortem |
| ≥ 5 bugs similaires | Root-cause obligatoire |
| 3+ postmortems sur le même sujet | Méta-postmortem |
