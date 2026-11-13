# Addendum W3 — choix techniques écartés du PRD (§10 à §13)

Notes, pas des exigences.

## §10 Catalogue
- Une capacité = un enregistrement du catalogue (code, version, famille, niveau, entrées, sortie, vocabulaire par logiciel, objectifs, vérité terrain, statut). Le catalogue se publie comme un référentiel versionné ; la clause C11 des manifestes y renvoie.
- Le niveau `REGLE` s'ajoute aux valeurs de C11 pour lever la contradiction X16.
- Les règles N0 sont des stratégies typées à paramètres versionnés (jamais des expressions évaluées) ; le contrat de score porte `parametresVersion`.
- Groupe témoin (FR-122) : appariement par segment, zone, historique de ventes ; tirage fixé par graine pour être rejouable ; mesure en différence de différences ; à écrire dans la spine.
- Vérité terrain : les événements qui la constituent (retard d'échéance, facture payée, fraude confirmée) sont lus des modules détenteurs à l'horizon déclaré et rattachés à la proposition ; le mécanisme est au §7 et dans la spine.

## §11 Copilot et agents
- Le Copilot réutilise le contrat de proposition (origine `LANGAGE`), le RAG ancré sur le corpus légal versionné, la passerelle de modèle de langage et le quota d'inférence du service d'assistant ; il n'a pas de module séparé.
- Sans modèle de langage : recherche par règles (index de libellés et de rôles) et gabarits de réponse.
- Reprendre telles quelles les décisions AD-4 à AD-12 de la spine de l'assistant (catalogue des types d'action, contrôle de mode, mandat, outbox) ; le port passe à :3417.

## §12 Lecture de pièces
- Chaîne : service de documents (rastérisation, Tesseract, texte par page) puis événement puis capacité de lecture (classement et champs par modèle de langage sur le texte, avec règles de repli) puis proposition EXTRACTION.
- Pièces médicales : modèle local seulement, jamais d'envoi à la passerelle ; classification par le registre santé du logiciel d'assurance.

## §13 Feuille de route
- Chaque produit aura son PRD ; cette section ne contient que le lien vers les familles de capacités.
