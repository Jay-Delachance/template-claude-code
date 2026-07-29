# rule : commits

Tout commit DOIT suivre le format conventionnel :
type(scope): message court en minuscules

Types valides : feat, fix, refactor, test, docs, chore, perf
Le message ne dépasse pas 72 caractères.
Pas de "WIP", "fix", "update" seuls sans contexte.

Exemples valides :
  feat(auth): ajouter la validation du token JWT
  fix(panier): corriger le calcul de TVA sur les remises
  test(user): couvrir les cas limites de l'inscription
