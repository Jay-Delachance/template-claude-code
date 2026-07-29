# .claude/commands/ultrareview.md

Relis le diff actuel comme un reviewer senior indépendant.
Tu n'as pas écrit ce code. Tu le vois pour la première fois.

Vérifie dans cet ordre :
1.La spec Gherkin (dans specifications/) est-elle respectée ?
2.Y a-t-il des cas limites non couverts ?
3.Y a-t-il des problèmes de sécurité (secrets, isolation des données) ?
4.Les tests sont-ils suffisants et significatifs ?
5.Y a-t-il de la sur-ingénierie ou du code mort ?

Conclus par VALIDATED ou FAILED [liste des problèmes].
