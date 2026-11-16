# STORY-998 : les files de travail par rôle — corbeilles, file du responsable, validation, comptabilité, guichet

Status: done

**Complexité :** moyenne (des routes de lecture seule, un champ dérivé indexé pour trier par échéance, des compteurs
calculés au serveur)

**Épic :** EPIC-205 (le dossier sinistre et son circuit)
**Dépôts :** `prospera-sinistres-service`
**Plage :** groupe C, n° 9 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §4) ; dépend de 989 ; STORY-1003
dépend d'elle.

---

## Pourquoi

Chaque rôle ouvre sa journée sur sa file : le gestionnaire sur sa corbeille et celle de son volet, le responsable sur
ce qu'il doit attribuer et ce qui dépasse, la comptabilité sur les ordres et les chèques, l'accueil sur son guichet. La
démo filtrait dans le navigateur ; ici **chaque file est une requête filtrée par rôle et par volet, triée et comptée
au serveur** (addendum, l. 198), mesurée sous 3 secondes (FR-250).

**Source** : PRD FR-40, FR-144, FR-145, FR-147, FR-148, FR-250 ; addendum l. 192, 198 ; démo (`/corbeille`, `/guichet`,
`/remises`, vues du responsable) ; spine AD-4, AD-8, AD-18, AD-26, AD-27 ; manifeste `sinistres` (`routesLectureSeule`,
`sinistres:dossier:consulter`).

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | **`GET /api/v1/sinistres/files/{file}`** (lecture seule ; rôle exercé lu dans le jeton) pour les files : `corbeille` (GEST : ses dossiers), `service` (GEST, GREC : les dossiers actifs de son volet), `a-attribuer` (RESP : `OUVERT` sans gestionnaire), `responsable` (RESP : actifs du service), `validation` (RESP, DT, DG : `EN_VALIDATION`), `comptabilite` (CPT : `ORDRE_EMIS`, `CHEQUE_A_REMETTRE`), `guichet` (ACC : à traiter `DECLARE`, pièces à réclamer `PIECES_ATTENDUES`, chèques à retirer `CHEQUE_A_REMETTRE`, mes déclarations) | tests ; pile |
| AC-2 | **Le tri au serveur** : urgence d'abord quand elle est connue, puis **échéance la plus proche** (légale ou interne, suspensions comprises), puis **ancienneté** ; un test vérifie l'ordre (FR-147) | tests ; vrai MongoDB |
| AC-3 | **Chaque ligne** : numéro officiel ou référence `DEC-`, statut, volet, gestionnaire, échéance la plus proche (code, terme, jours restants, état), dernière action (quand, par qui) ; **les gestes** du rôle : ouverts, et fermés avec leur motif en clair (jamais masqués) | tests |
| AC-4 | **Compteurs** par file calculés au serveur ; une file bornée (`limite` ≤ 200) dit son total | tests |
| AC-5 | **Garde-fous** : un rôle qui n'a pas la file → 403 `DROIT_INSUFFISANT` ; un volet hors du sien → 403 ; aucune donnée de santé dans aucune file ; aucune écriture ; les routes ajoutées à `routesLectureSeule` du manifeste (proposition) | tests ; invariant |
| AC-6 | **Le champ dérivé `prochainTermeLe`** (échéance non arrêtée la plus proche, suspensions comprises) tenu à chaque écriture du dossier, et des index `{organisationId, statut, volet}`, `{organisationId, gestionnaireId}`, `{organisationId, prochainTermeLe}` | tests ; vrai MongoDB |

## Décisions retenues par défaut (contestables)

- **D-998-1 — La portée reste provisoire** : le rôle exercé est lu dans le jeton (D-988-2) ; le volet d'une file de
  service est un paramètre obligatoire, faute de portée dans le jeton aujourd'hui. La portée par volet et par dossier
  arrive avec STORY-1004 (AD-26, `reseau.portee.changed@1`) et remplacera ce paramètre ; une portée vide restera vide,
  jamais « tout ».
- **D-998-2 — Les files qui dépendent d'autres modules se servent de leurs statuts** : la comptabilité lit
  `ORDRE_EMIS` et `CHEQUE_A_REMETTRE` (les règlements en échec, rapprochements et alertes LBC/FT viennent de `paiement`) ;
  la validation lit `EN_VALIDATION` sans niveau de délégation (STORY-1003) ; le guichet lit `PIECES_ATTENDUES` (les
  pièces elles-mêmes sont à `ged`). Le compte de la journée du guichet et l'urgence corporelle (gravité, saisie avec la
  déclaration) viennent avec STORY-1000.
- **D-998-3 — `prochainTermeLe` est un champ dérivé stocké** (le terme réel se calcule depuis la base et les
  suspensions) : écrit par le dépôt à chaque écriture du dossier, jamais par une route ; il permet de trier et de borner
  en base au lieu de charger tout le portefeuille.
- **D-998-4 — Les vues « dossiers muets » et « à surveiller » (8, 15, 30 jours, FR-144)** sont livrées par STORY-999 ;
  998 laisse leur place dans la file du responsable.

## Ce qui a été livré

**2026-11-16** — `prospera-sinistres-service` **#8** (`dev` `6ef224b`, « Rebase and merge ») :

- `src/modules/sinistres/files/` : `GET /api/v1/sinistres/files/{file}` (`roleExerce`, `volet`, `limite` ≤ 200) pour
  `corbeille`, `service` (volet exigé), `a-attribuer`, `responsable`, `validation`, `comptabilite` et les quatre files
  du guichet (`guichet-a-traiter`, `guichet-pieces`, `guichet-cheques`, `guichet-mes-declarations`) ; total compté au
  serveur ; chaque ligne porte ses gestes (`possiblesPour` de la table, puis la décision pure) : ouverts, ou fermés avec
  leur code ; refus `FILE_INCONNUE` (404), `DROIT_INSUFFISANT` (403), `VOLET_EXIGE` (400).
- Dépôt : `prochainTermeLe` dérivé à chaque écriture (échéance non arrêtée la plus proche, suspensions comprises) ;
  `creePar` posé à la déclaration ; tri en base (`$ifNull` ⇒ sans terme en dernier, puis ancienneté, puis `_id`) ;
  index `{organisationId, statut, volet, prochainTermeLe}` et `{organisationId, gestionnaireId, prochainTermeLe}`.
- Manifeste `sinistres` amendé (route en lecture seule, prospera-stories **#570**) et recopié à l'octet ; invariant :
  toutes les routes des files sont des `GET` déclarés au manifeste, chaque file filtre par statut et nomme ses rôles,
  aucune n'est ouverte à `ADMIN`.
- **Node 24** sur un vrai MongoDB : lint 0 ; 807 unitaires (8 nouveaux, joués sur les deux bancs) ; 19 e2e ; build.
- **Pile `grp-c-998`** (4 dossiers, deux agents d'accueil) : guichet « à traiter » → 4, **ordre = échéance puis
  ancienneté** ; la 1re ligne montre « accusé de dossier complet » fermé (`PIECES_COMPLETES`) et un geste ouvert ;
  `limite=2` → 2 lignes, total 4 ; « mes déclarations » → 1 ; « à attribuer » → 0 ; service sans volet → 400
  `VOLET_EXIGE` ; file d'un autre rôle et rôle absent du jeton → 403 ; file inconnue → 404 ; service `CORPOREL` → 2 ;
  `prochainTermeLe` posé 4/4, `creePar` 4/4.
- **Rejouée sur l'image reconstruite depuis `dev`** (`grp-c-998d`) : même scénario, même issue. Au premier essai,
  Kafka n'est pas devenu sain (pile non levée, rien de joué) ; au second, vert.

**Ce que la preuve a montré, et qui reste à faire :**
- Les lignes d'erreur des journaux (8 au premier passage, 2 au rejeu) sont toutes des réponses **503 de
  `GET /api/v1/health` au démarrage**, pendant que la pile se lève ; Docker a vu le conteneur « unhealthy » avant qu'il
  devienne sain et serve le scénario. C'est aussi l'explication probable des lignes d'erreur restées inexpliquées de
  STORY-994. L'indicateur qui rend 503 au démarrage n'est pas encore identifié.
- Le plan d'exécution relevé (requête `statut` seul, sans volet) passe par l'index `organisationId_1_reference_1` puis
  trie en mémoire : les index posés servent les files filtrées par volet ou par gestionnaire. La mesure sous 3 secondes
  sur un portefeuille réel (FR-250) reste à faire, avec les volumes de la compagnie.
- L'urgence (gravité corporelle) dans le tri vient avec STORY-1000 ; la portée par volet (au lieu du paramètre) avec
  STORY-1004 ; les vues « dossiers muets » et « à surveiller » avec STORY-999.
