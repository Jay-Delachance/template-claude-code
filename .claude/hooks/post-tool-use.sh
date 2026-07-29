#!/bin/bash
INPUT=$(cat)
OUTPUT=$(echo "$INPUT" | jq -r '.tool_output // empty')
MAX_LINES=100

LINE_COUNT=$(echo "$OUTPUT" | wc -l)
if [ "$LINE_COUNT" -gt "$MAX_LINES" ]; then
  echo "$OUTPUT" | head -n $MAX_LINES
  echo "... [sortie tronquée à $MAX_LINES lignes — relancer si besoin]"
else
  echo "$OUTPUT"
fi
