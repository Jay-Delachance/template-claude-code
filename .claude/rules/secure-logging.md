# rule : secure-logging

Les données suivantes ne doivent JAMAIS apparaître dans les logs :
-Adresses email (même partielles)
-Mots de passe ou tokens
-Données personnelles (nom, adresse, téléphone)
-Clés API ou secrets

En cas de doute : ne pas loguer.
