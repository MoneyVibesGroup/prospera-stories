# Addendum W4 : choix techniques renvoyés hors du PRD

- Format du pack : répertoire de fichiers déclaratifs (JSON ou YAML) validés par schéma versionné, sections `vocabulaire`, `capacites`, `regles-n0`, `objectifs`, `verites-terrain`, `garde-fous`, `pays/*`, `residence`, `heritage` ; signature et empreinte comme les manifestes de modules ; état tenu par le moteur d'installation. Aucun code exécutable de secteur dans le socle.
- Règles N0 : langage de règles déclaratif et sandboxé (pas de script libre) ; explication produite par la règle elle-même. Choix du moteur de règles renvoyé à la spine de l'IA.
- Clé d'isolation `secteur/capacite/version` dans le registre de modèles ; alias champion/challenger par clé, jamais globaux ; calibration N2 indexée par (organisation, secteur, capacité).
- Non-régression : jeux de dossiers figés par secteur dans la chaîne de livraison, rejoués à chaque candidat ; comparaison des sorties canoniques (valeur, confiance, facteurs) ; rapport signé rattaché à la version.
- Catalogue versionné par extensions additives (compatibilité sur IA-P85 versions) ; une famille nouvelle ne modifie pas le schéma des anciennes.
- Résidence : régions d'hébergement par pays pour le SaaS ; en local rien ne change ; règle évaluée à la sortie du canal de données de l'instance (moteur AD-9, AD-44).
- Devise : type monétaire (montant entier en unité mineure + code devise) imposé aux contrats de capacité ; dépend du correctif du contrat de balance (hors de ce PRD).
- Kit public : schémas, documentation, jeux de tests de conformité et exemples synthétiques ; contrôle automatique à la publication (aucun poids de modèle, aucune donnée réelle). Licence et place de marché : décision commerciale hors PRD.
- Transfert N1 : mesure de pertinence par comparaison sortie / vérité terrain sur fenêtre glissante ; recalage de l'échelle du modèle hérité possible, à trancher en spine.
