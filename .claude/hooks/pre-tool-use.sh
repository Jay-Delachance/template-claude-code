#!/bin/bash
# Garde-fou avant exécution d'une commande Bash :
# 1) bloque les commandes potentiellement destructives (contournable via marqueur) ;
# 2) scanne les fichiers stagés avec gitleaks avant tout commit.
#
# Volontairement sans dépendance à `jq` : on grep directement le JSON reçu sur
# stdin (l'entrée PreToolUse ne contient que tool_input, donc la commande). Ça
# garantit que le garde fonctionne même sur un poste sans jq — un garde qui
# échoue en silence serait pire que pas de garde.
INPUT=$(cat)

# 1) Commandes destructives
# Le marqueur #allow-destructive est vérifié À L'INTÉRIEUR du bloc : sinon le
# exit 2 part avant et l'échappatoire devient du code mort jamais atteint.
DANGEROUS='DROP TABLE|DELETE FROM|rm -rf|rm -fr|kubectl delete|git push --force|git push -f|git reset --hard'
if echo "$INPUT" | grep -qiE "$DANGEROUS"; then
  if echo "$INPUT" | grep -q "#allow-destructive"; then
    exit 0
  fi
  echo "BLOQUÉ : commande potentiellement destructive détectée." >&2
  echo "Pour passer outre volontairement, ajoute le marqueur #allow-destructive dans la commande." >&2
  exit 2
fi

# 2) Scan de secrets avant commit
if echo "$INPUT" | grep -q "git commit"; then
  if ! command -v gitleaks >/dev/null 2>&1; then
    echo "BLOQUÉ : gitleaks n'est pas installé, vérification impossible. Installe-le : brew install gitleaks" >&2
    exit 2
  fi
  if ! gitleaks protect --staged --redact >/dev/null 2>&1; then
    echo "BLOQUÉ : secret détecté dans les fichiers stagés. Retire-le avant de committer." >&2
    exit 2
  fi
fi

exit 0
