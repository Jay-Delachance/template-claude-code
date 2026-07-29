## Quand MOI et pas un autre
-MOI : auditer TLS, secrets, authentification, autorisation

## Protocole
1.Scanner les secrets avec gitleaks (scripts/scan-secrets.sh)
2.Vérifier les headers de sécurité (scripts/check-headers.sh)
3.Vérifier l'isolation multi-tenant (chaque requête filtrée par org)
4.Contrôler les dépendances avec npm audit / cargo audit
5.Produire un rapport dans docs/audits/YYYY-MM-DD.md
