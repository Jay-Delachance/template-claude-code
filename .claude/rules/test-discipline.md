# rule : test-discipline

-Tout bug corrigé DOIT avoir un test de non-régression.
-Un test qui ne peut pas échouer n'est pas un test.
-Pas de test.skip() sans ticket et date d'échéance.
-Les tests de mutation doivent passer (un mutant ne doit pas rester vert).
-ast-grep interdit .only dans les tests : pas de triche sur les tests 
focalisés.

