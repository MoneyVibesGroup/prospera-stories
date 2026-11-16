# STORY-992 : le circuit quand le LC est muet ou ne reçoit pas — liste « à saisir », numéro officiel, police à relire

Status: done

**Complexité :** grande (une voie d'envoi neuve, la liste C-18 et son export, le report du numéro par l'agent, deux
consommateurs dans `sinistres`, une condition neuve dans une nouvelle version de la table)

**Épic :** EPIC-203 (l'échange avec le logiciel de la compagnie)
**Dépôts :** `prospera-liaison-assureur-service`, `prospera-sinistres-service`, `prospera-plateforme` (dossiers de C)
**Plage :** groupe C, n° 3 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §4) ; porte aussi la liste
« à saisir » reportée de STORY-991 (D-991-1).

---

## Pourquoi

Le circuit ne s'arrête jamais parce que le LC se tait (spine AD-1) : on déclare, on instruit, on ordonne ; les envois
attendent dans leur file. Deux choses seulement se refusent sur une donnée périmée, dont **la libération d'un
règlement sur une police « à relire »** (garde `POLICE_A_RELIRE`, évaluée par `sinistres`). Et quand le LC **ne sait
pas recevoir** un flux, Prospera sort la **liste « à saisir »** (C-18, FR-199) : l'agent saisit dans le LC et **reporte
le numéro obtenu** ; la déclaration est alors dans une seule voie, `SAISIE_MANUELLE`, jamais renvoyée seule. Le numéro
officiel, quelle que soit sa voie, devient celui que `sinistres` affiche partout (FR-198) : `liaison-assureur` en est
le seul écrivain, `sinistres` en garde une copie dérivée de ses faits.

**Source** : PRD FR-198, FR-199, FR-201 ; annexe C (C-11, C-18) ; spine AD-1, AD-6.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | **La liste « à saisir »** : les natures que le LC ne reçoit pas sont un paramètre ; un envoi d'une telle nature prend la voie `SAISIE_MANUELLE` et ouvre une ligne C-18 (référence, nature, montant, date, auteur, clé d'origine) ; passer une nature à la liste **annule d'abord** les envois en attente ; une ligne `SAISIE_MANUELLE` n'est jamais renvoyée seule | tests ; pile |
| AC-2 | **L'écran et le fichier** : `GET …/echange/a-saisir` (filtre par état) et `GET …/echange/a-saisir/export` (tableur) ; `POST …/a-saisir/{id}/saisie` marque « saisie, non confirmée » avec le nom et la date | tests ; pile |
| AC-3 | **Le report du numéro par l'agent** : `POST …/echange/numeros` `{ referenceDeclaration, numeroOfficiel }` rattache le numéro (voie `SAISIE_MANUELLE`), clôt la voie et confirme la ligne ; un numéro déjà porté par un autre dossier est refusé et part en écart ; une `DEC-` déjà numérotée : écart, jamais un second rattachement | tests |
| AC-4 | **Le fait `liste-a-saisir.changed@1`** (état absolu de la ligne) ; schéma dans la plateforme, chaque champ classé | tests ; Karapace |
| AC-5 | **`sinistres` garde la copie dérivée du numéro officiel** (consommateur de `numero-sinistre.attribue@1`, idempotent par `eventId`) : le premier numéro se rattache, la vue du dossier et `dossier.changed@1` le portent ; un second numéro est ignoré | tests ; pile |
| AC-6 | **La police à relire** : `sinistres` tient la fraîcheur reçue (`fraicheur.changed@1`) ; une nouvelle version de la table (`2026.2`) ajoute la condition `POLICE_A_RELIRE` à l'émission du règlement (17, 18) ; un dossier ouvert sous `2026.1` garde sa table ; LC muet : déclarer, instruire, évaluer, valider, ordonner passent, l'émission se refuse | tests ; pile |
| AC-7 | Suites vertes sous Node 24, lint 0, build ; piles `grp-c` | pile |

## Décisions retenues par défaut (contestables)

- **D-992-1 — Une nature non reçue est un paramètre de l'instance** (`LIAISON_NATURES_NON_RECUES`), pas une détection :
  le LC « sait » ou « ne sait pas » recevoir un flux, c'est un fait de paramétrage (FR-199).
- **D-992-2 — Correspondance des natures** : `declaration` → `DECLARATION`, `evaluation` → `EVALUATION_PROVISION`,
  `reglement` → `REGLEMENT`, `recours` → `RECOURS_ENCAISSE`, `decision` → `CLOTURE` (C-17 porte clôture, rejet, sans
  suite, réouverture).
- **D-992-3 — La police « à relire » se juge sur la fraîcheur de l'objet `police` de l'organisation**, tant que le
  dossier ne porte pas sa police (la déclaration complète arrive avec STORY-1000) ; la garde portera alors sur la
  police du dossier.
- **D-992-4 — `POLICE_A_RELIRE` entre par une nouvelle version de la table (`2026.2`)**, pas par une retouche de
  `2026.1` : c'est la règle d'AD-4 (un dossier garde la table de son ouverture).
- **D-992-5 — L'alerte « sans numéro » (1 jour ouvré) passe à STORY-999**, avec les autres alertes et relances.
- **D-992-6 — `numeroOfficiel` entre dans `dossier.changed@1` comme champ facultatif** (ajout compatible BACKWARD).

## Ce qui a été livré

**2026-11-16** — trois PR fusionnées en « Rebase and merge » :

- `prospera-plateforme` **#12** (`dev` `cadee2b`) : `liste-a-saisir.changed.schema.json`, l'état `SAISIE_MANUELLE` de
  `envoi.etat`, `numeroOfficiel` facultatif dans `dossier.changed` ; champs classés ; 400/400.
- `prospera-liaison-assureur-service` **#4** (`dev` `f943791`) : voie `SAISIE_MANUELLE`, liste C-18 (numéro sans
  trou), export en tableur, marquage « saisie, non confirmée », report du numéro, `liste-a-saisir.changed@1`.
  Node 24 : 456 unitaires + 21 e2e, lint 0, build.
- `prospera-sinistres-service` **#6** (`dev` `6ccb9ec`) : consommateur de `numero-sinistre.attribue@1` et
  `fraicheur.changed@1`, copie dérivée du numéro officiel, table `2026.2` et garde `POLICE_A_RELIRE`. Node 24 :
  766 unitaires (MongoDB réel) + 19 e2e, lint 0, build.
- **Piles `grp-c`** :
  - `liaison-assureur` (LC fictif, Karapace) : une déclaration non reçue → `SAISIE_MANUELLE`, **aucun lot déposé** ;
    la ligne ; l'export (tableur) ; « saisie » ; le report → voie `SAISIE_MANUELLE`, ligne `CONFIRMEE` ; le même numéro
    sur une autre déclaration → **409 `NUMERO_EN_DOUBLE`** et un écart ; faits sur Kafka ; 15 sujets, garde : 0 refus.
  - `sinistres` : « police périmée » publiée → le dossier va jusqu'à `ORDRE_EMIS`, l'émission est refusée
    **409 `POLICE_A_RELIRE`** ; « police relue » → `REGLE` ; le numéro publié → `LCF-2026-000777` sur le dossier.
  - **Rejouées sur les images reconstruites depuis `dev`** : vertes, aucune erreur au journal.
- Deux lignes d'erreur au journal de `liaison-assureur` au premier passage, **non reproduites** au rejeu complet ni
  depuis `dev` : non expliquées.

**Reste** : l'alerte « sans numéro » (1 jour ouvré) et les alertes de la liste (1 jour ouvré, 72 h) avec STORY-999 ;
la confirmation des lignes autres que la déclaration par la trace du LC (C-9, C-12), avec la reprise ; la garde
portera sur la police du dossier quand la déclaration la portera (STORY-1000) ; D-991-2 (C-17) reste ouverte.
