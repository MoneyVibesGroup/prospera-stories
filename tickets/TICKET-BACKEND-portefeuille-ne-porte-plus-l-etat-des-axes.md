# TICKET-BACKEND — le **portefeuille** ne porte plus l'état des 2 axes, et le tri « à traiter d'abord » est tombé avec

**Cible :** `dossier-service` (:3009) — route `GET /api/v1/dossiers`
**Ouvert par :** **FE-061** (barry thierno alhassane, 2026-08-19) — **retombée directe de STORY-303**, constatée en régénérant les types
**Priorité :** Should — une fonction du portefeuille (FE-059a) a été **retirée** faute de donnée, pas dégradée
**État :** ⛔ ouvert

---

## Le constat

STORY-303 retire `systemeComptable` et `regimeFiscal` de `DossierResponseDto`,
et **le retrait est justifié** : ces champs restaient stockés comme source de la
reprise, mais plus aucune décision ne les mettait à jour — `GET /dossiers/{id}`
pouvait donc rendre `SN` pendant que `GET /dossiers/{id}/axes` et le calcul de
`balance-service` appliquaient `SMT`. Un couple plausible, affichable, et faux.

**La conséquence non anticipée est côté LISTE.** Le portefeuille de FE-059a
lisait ces deux champs pour :

- la puce **« Axes à déterminer »** sur chaque ligne ;
- le tri **« à traiter d'abord »**, qui remontait les dossiers non configurés ;
- la ligne de configuration du bandeau de contexte (« Système Normal · régime
  réel · SYSCOHADA · TG »).

La seule source de vérité restante est `GET /dossiers/{dossierId}/axes` — **une
requête par dossier**, sur une liste dont la cible NFR est **500 dossiers**.

## Ce que FE-061 a fait, et pourquoi

**La puce et le tri ont été RETIRÉS**, pas recalculés.

Les garder en les calculant sur des champs devenus **absents** aurait allumé
« Axes à déterminer » sur **tous** les dossiers — y compris ceux dont les axes
sont parfaitement décidés. Une alerte généralisée est une alerte qu'on cesse de
lire : le portefeuille aurait affiché un problème permanent et faux, ce qui est
strictement pire que de ne rien afficher.

⚠️ **Le retrait est une perte de fonction assumée, tracée ici pour ne pas être
redécouverte** comme un oubli de FE-059a.

## Ce qui est demandé

Que la **liste** porte l'état des axes, sans exiger N requêtes. Deux formes,
à trancher côté backend :

1. **Un booléen dérivé** sur `DossierResponseDto` — par exemple
   `axesDetermines: boolean` — calculé depuis `decisions_axes`, **sans jamais
   republier le couple lui-même** (c'est ce que STORY-303 a délibérément retiré,
   et le republier rouvrirait la divergence).
2. **Un endpoint de lot** : `GET /dossiers/axes?ids=…` ou l'inclusion des axes
   effectifs dans la réponse de liste sous un objet daté explicite.

L'option 1 est préférable : elle donne au portefeuille exactement ce qu'il
affiche (« configuré / à configurer ») **sans** lui redonner une valeur d'axe
qu'il pourrait afficher hors de son contexte temporel — un couple d'axes sans
date de prise d'effet est un couple ambigu, et une ligne de liste n'a pas la
place de porter la date.

## Vérification à la reprise

- Un dossier **sans aucune décision d'axes** rend `axesDetermines: false` ; un
  dossier dont la décision en vigueur est **héritée** d'un exercice antérieur
  rend `true` (elle vaut, donc elle détermine).
- Le champ ne réintroduit **ni** `systemeComptable` **ni** `regimeFiscal` sur
  le DTO du dossier.
- Une liste de 500 dossiers ne déclenche **aucune** requête supplémentaire.
