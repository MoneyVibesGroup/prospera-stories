# Revue de rubrique — bonne colonne vertébrale

Grille : liste de contrôle « good-spine » de `references/reviewer-gate.md`.

## Verdict

La colonne fixe bien les points de divergence du domaine — moteur de calcul, propriété du paquet,
persistance, preuve — et elle ratifie le brownfield au lieu de le contredire. Deux manques : **une
dimension entière laissée muette** (l'enveloppe opérationnelle au-delà d'un paragraphe de déploiement)
et **un AD qui légifère sur un service voisin sans mécanisme pour que ça tienne**.

## Points de divergence couverts — adéquat

Le noyau, la propriété des données, la mutation d'état et le sens des dépendances sont tous fixés, et le
diagramme de dépendances *est* une règle, pas une illustration. AD-2 à AD-4 ferment ensemble le trou le
plus dangereux du PRD (la promesse « ajouter une taxe = ajouter une donnée »).

## Règles applicables — adéquat, deux à durcir

- **AD-6** dit « un seul artefact, consommateurs déclarés » mais ne donne aucun moyen de le faire
  respecter. Un service pourrait charger un paquet qui ne le déclare pas et personne ne le saurait.
  *Correctif :* le chargement refuse un paquet dont la liste de consommateurs déclarés ne contient pas
  le service qui le charge.
- **AD-1** (« n'implémente aucune règle d'imposition ») n'est vérifiable qu'à la revue humaine. C'est
  acceptable pour une règle de frontière, mais il faut le savoir.

## Contradiction avec l'hérité — un constat élevé

**high — AD-7 tranche pour un service voisin.** Il redéfinit la sémantique de `societeId` dans le contrat
canonique de `balance-service`, sur une story (STORY-135) qui n'est pas encore partie. La décision est
juste et elle *retire* du travail, mais la colonne vertébrale de `fiscal-service` n'a aucune autorité sur
le contrat de `balance-service`. Sans acte de coordination explicite, STORY-135 partira avec son sens
d'origine et AD-7 deviendra faux le jour de sa livraison.

*Correctif :* nommer la dépendance comme une condition, pas comme un acquis — AD-7 ne tient que si la
sémantique est actée sur le contrat canonique avant le départ de STORY-135.

## Enveloppe opérationnelle — mince

C'est le manque que la grille signale comme le plus fréquent, et il est présent. La section de
déploiement couvre le conteneur, le port, la base et les deux comptes. Restent muets :

- **medium — environnements.** Rien ne distingue développement, recette et production, alors que la
  décision « deux comptes Mongo » n'a de sens qu'avec un provisionnement par environnement.
- **high — sauvegarde et restauration du journal d'audit.** AD-10 empêche l'application d'effacer une
  trace, mais une restauration de sauvegarde peut réécrire la collection entière. Sur un produit dont la
  valeur *est* la preuve, et avec une rétention de dix ans, le silence sur ce point vide AD-10 d'une
  partie de sa portée.
- **medium — migrations de schéma.** Aucune règle, alors que le service porte des documents append-only
  qu'on ne peut pas migrer par réécriture.
- **medium — santé et observabilité.** Terminus est dans la pile sans qu'aucune convention ne dise ce
  qu'un point de santé doit couvrir (Mongo, Kafka, disponibilité du paquet).

## Deferred — adéquat

Rien de ce qui est différé ne laisse deux unités diverger. Chaque entrée porte la raison pour laquelle
elle peut attendre, et le coffre-fort est correctement posé comme un **amendement** de AD-13 plutôt que
comme une évolution de configuration.

## Couverture du PRD — adéquat

Les cinq incréments sont tracés vers des composants et des AD. Les 78 exigences ne sont pas reprises une
à une, ce qui est correct à cette altitude : la colonne gouverne, elle ne recopie pas.

## Technologies vérifiées — fort

Toutes les versions viennent du dépôt ou du web. Voir `review-versions-reality.md`.
