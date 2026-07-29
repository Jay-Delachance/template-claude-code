#!/bin/bash
INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

DANGEROUS='DROP TABLE|DELETE FROM|rm -rf|rm -fr|kubectl delete'
if echo "$CMD" | grep -qiE "$DANGEROUS"; then
  echo "BLOQUÉ : commande potentiellement destructive détectée." >&2
  echo "Pour passer outre, ajoute le marqueur #allow-destructive dans ta commande." >&2
  exit 2
fi

if echo "$CMD" | grep -q "#allow-destructive"; then
  exit 0
fi

if echo "$CMD" | grep -q "git commit"; then
  if ! command -v gitleaks >/dev/null 2>&1; then
    echo "BLOQUÉ : gitleaks n'est pas installé, vérification impossible." >&2
    exit 2
  fi
  if ! gitleaks protect --staged >/dev/null 2>&1; then
    echo "BLOQUÉ : secret détecté dans les fichiers stagés. Retire-le avant de committer." >&2
    exit 2
  fi
fi

exit 0
