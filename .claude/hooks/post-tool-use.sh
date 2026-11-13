#!/bin/bash
# Tronque les sorties Bash très longues pour garder le contexte lisible.
# Sans dépendance à `jq` : extraction via node (présent sur un projet Node).
# Si l'extraction échoue ou que la sortie est vide, on ne bloque rien (exit 0).
INPUT=$(cat)
MAX_LINES=100

OUTPUT=$(printf '%s' "$INPUT" | node -e '
  let s = "";
  process.stdin.on("data", (d) => (s += d));
  process.stdin.on("end", () => {
    try { process.stdout.write(String(JSON.parse(s).tool_output ?? "")); }
    catch { /* entrée non parsable : on n émet rien */ }
  });
' 2>/dev/null)

[ -z "$OUTPUT" ] && exit 0

LINE_COUNT=$(echo "$OUTPUT" | wc -l)
if [ "$LINE_COUNT" -gt "$MAX_LINES" ]; then
  echo "$OUTPUT" | head -n $MAX_LINES
  echo "... [sortie tronquée à $MAX_LINES lignes — relancer si besoin]"
else
  echo "$OUTPUT"
fi
