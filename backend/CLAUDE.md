## Règles backend spécifiques
-Toute requête SQL sur données multi-tenant DOIT inclure un filtre par 
organisation.
-Les endpoints publics sont préfixés /api/v1/public/.
-Pas de .unwrap() en dehors des tests.
