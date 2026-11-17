# STORY-968 : les comptes de tiers — clients, fournisseurs, salariés ; compte collectif ; balance âgée

Status: done

**Complexité :** élevée (un registre neuf ; une règle neuve sur la saisie de 962 sans en renommer le contrat ; la
concordance du collectif et des auxiliaires prouvée par construction ; une balance âgée datée par l'horloge de
référence et préparée pour le lettrage ; une balance publiée qui ne doit pas bouger d'un octet)

**Épic :** EPIC-115 (« comptes de tiers auxiliaires : clients, fournisseurs, salariés ; rattachement au compte
collectif ; balance âgée — le collectif et l'auxiliaire doivent concorder par construction, jamais par rapprochement
périodique »), d'`epics-comptabilite-2026-08-27.md`
**Dépôt :** `MoneyVibesGroup/prospera-comptabilite-service` (et le manifeste `comptabilite` dans `prospera-stories`)
**Plage :** groupe B, n° 13 du lot 3 (`coordination/PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §3, ligne 968).
**Dépend de :** STORY-964 (la validation inaltérable) ; s'appuie sur 966 (le grand livre, `dev` `7fed6ce`) et 967 (la
balance publiée, `dev` `328e727`).
**Débloque :** STORY-969 (le lettrage : il lettre des lignes de tiers et réduit le « non soldé » de la balance âgée).

**Sources lues :** plan du lot 3 (§0, §1, §3, §7, §8) ; `REGLES-DES-GROUPES.md` ; journal de B (état, pièges de 956 →
967, « ⚠ Contrats ») et journaux de A, C, D (aucune demande ouverte à B qui passe avant cette story) ; fiches 962, 964,
966, 967 (« Pour la suite » : le hub refuse un compte auxiliaire, la balance publiée porte le collectif) ; manifeste
`comptabilite` ; paquets de référentiels de `balance-service` sur `origin/dev` (`98078b0`, lus sans y toucher :
`syscohada-revise@2.3`, `smt-togo@1.0`, `cima-assurances@7.0`, `sfd-bceao@2.0`) ; les tiers ailleurs, lus sans y
toucher : `dossier-service` (A), `reseau-service` (D), `prospera-paiement-service` (la Créance, `tiersId`).

---

## Pourquoi

Une écriture sur « Clients » ne dit pas QUEL client doit. Sans compte de tiers, le cabinet ne sait ni relancer, ni
lettrer (969), ni dire ce qui est échu depuis plus de 90 jours. EPIC-115 pose la règle : l'auxiliaire et le collectif
concordent **par construction**. Cette story donne au dossier son registre de tiers, fait porter à chaque ligne d'un
compte collectif le tiers qu'elle concerne et son échéance, lit le grand livre par tiers, et sert la balance âgée.

## Ce qui doit être vrai à la fin (plan du lot 3, §3, ligne 968)

| Exigence | Fait |
|---|---|
| Les tiers clients, fournisseurs et salariés existent | registre des tiers du dossier : `POST`, `GET /dossiers/{d}/tiers`, `GET /dossiers/{d}/tiers/{t}` ; catégorie `CLIENT`, `FOURNISSEUR`, `SALARIE` ; code (compte auxiliaire) unique dans le dossier (D-968-1, D-968-4) |
| Le compte collectif existe | collectifs déclarés par référentiel (`comptes-collectifs@1`), servis par `GET …/comptes-collectifs` ; toute ligne sur un collectif porte un tiers de sa catégorie (D-968-2, D-968-3, D-968-6) |
| La somme des auxiliaires égale le collectif | `GET …/comptes-collectifs/{racine}/auxiliaires` : les lignes du collectif sommées par tiers ET par compte dans le même instantané, `concorde` ; le grand livre d'un tiers (`GET …/tiers/{t}/grand-livre`) (D-968-5) |
| La balance âgée est servie | `GET …/tiers/balance-agee?au=&categorie=&tranches=` : par tiers et par tranche, à une date d'arrêté (l'horloge de référence par défaut), sur les lignes non lettrées (D-968-7, D-968-8, D-968-9) |
| La balance publiée reste identique et ingérée | elle groupe par compte du plan : le tiers n'entre ni au contrat ni au sceau (D-968-10) ; prouvé sur MongoDB et par le vrai hub (§ Preuves) |
| Droits | aucun droit neuf : `comptabilite:tiers:administrer` pour créer, `comptabilite:dossier:consulter` pour lire (D-968-11) |

## Décisions (prises par défaut, contestables)

- **D-968-1 : la comptabilité POSSÈDE ses tiers ; elle ne les référence pas.**
  - Lus sans y toucher : `dossier-service` n'a pas de tiers (le dossier EST le client du cabinet ; ses propres clients
    n'y sont pas) ; `reseau-service` tient les nœuds et les commerciaux du distributeur (les points de vente viendront
    avec le module `pdv`) ; `paiement` porte un `tiersId` opaque sur la Créance (`pdv-0042`), au périmètre de
    l'organisation distributeur.
  - Aucun n'est le client, le fournisseur ou le salarié d'un dossier qu'un cabinet tient : les référencer couplerait la
    saisie à des services qu'un cabinet n'a pas installés. Le registre est donc **à la comptabilité, par dossier**
    (pas par exercice : un client traverse les exercices).
  - Une **référence externe** facultative `{ systeme, id }` cite le même tiers ailleurs (`paiement`, `pdv-0042`) ;
    elle est gardée, jamais lue ni appelée. Quand le distributeur tiendra sa comptabilité, une story pourra créer le
    tiers depuis le point de vente. Contestable.
- **D-968-2 : les comptes collectifs sont DÉCLARÉS par référentiel** (`src/tiers/collectifs-declares.json`, contrat
  `comptes-collectifs@1`, comme `plans-de-journaux@1`) : une racine du plan (trois chiffres de la classe 4) et la
  catégorie qu'elle porte. Racines relevées dans les paquets de `balance-service` :
  - **SN et SMT** : `401` Fournisseurs, dettes en compte, `409` Fournisseurs débiteurs (FOURNISSEUR) ; `411` Clients,
    `416` Créances clients litigieuses ou douteuses, `419` Clients créditeurs (CLIENT) ; `421` Personnel, avances et
    acomptes, `422` Personnel, rémunérations dues (SALARIE). Non retenus : `402`, `412` (effets), `408`, `418`
    (factures non parvenues, produits à recevoir : des estimations sans tiers individualisé), `414` (cessions
    d'immobilisations), `423`, `427` (oppositions, dépôts).
  - **CIMA** : `411`, `414` (assurés, agents, courtiers : CLIENT) ; `420`, `425` (personnel : SALARIE). Le plan CIMA n'a
    pas de collectif « fournisseurs » en classe 4 (la classe 40 est aux réassureurs, cédants et coassureurs) : aucun.
  - **SFD-BCEAO** : aucun. Les comptes de la clientèle (classes 2 et 3) sont tenus par le système d'information de
    l'institution, et ses `41`/`42` sont des immobilisations financières et des dépôts. Contestable.
  - Un compte est collectif s'il **commence** par une racine déclarée (`411`, `4111`, `411100`). Le collectif d'un
    tiers est l'ensemble des racines de sa catégorie (un client sur `411`, `416` ou `419`).
- **D-968-3 : sur un collectif, le tiers est OBLIGATOIRE ; ailleurs, il est INTERDIT.**
  - Saisie et correction d'un brouillard : 422 **`TIERS_REQUIS`** (`details.ligne`, `compte`, `categorie`) ; un tiers
    ou une échéance sur un compte non collectif : 422 **`TIERS_HORS_COLLECTIF`**.
  - **Validation** : un brouillard saisi avant 968 sans tiers sur un collectif ne se valide pas (`TIERS_REQUIS`) : on
    le corrige d'abord. Tout ce qui est validé depuis 968 porte son tiers.
  - Pourquoi obligatoire : sans lui, la somme des auxiliaires ne vaut le collectif qu'« à un reste près », et la
    balance âgée oublie des créances. C'est l'exigence d'EPIC-115 (par construction).
  - **Sans rompre le contrat** de 962 : deux champs **facultatifs ajoutés** à la ligne (`tiersId`, `echeance`), aucun
    renommé, aucune route changée. Le comportement change, et il est annoncé : une ligne de collectif sans tiers, hier
    acceptée, est refusée.
  - Les écritures **validées avant 968** (sans tiers) sont inaltérables : elles restent. Elles forment l'auxiliaire
    `sansTiers` du collectif, ce qui garde la somme égale au collectif ; dans la balance âgée, une position sans tiers.
  - La **contre-passation** copie le tiers et l'échéance de chaque ligne : elle s'annule dans le même auxiliaire et
    dans la même tranche.
- **D-968-4 : un tiers est figé à sa création.** Collection `tiers` en ajout seul (des lignes validées le citent) ;
  idempotente par code : la même demande rejouée rend 200 et le même tiers, une autre demande au même code 409
  **`TIERS_EN_DOUBLE`** ; l'index unique `(organisation, dossier, code)` tranche une course. Pas de modification ni de
  suppression en 968 (corriger un nom viendra par une version du tiers). La création n'entre pas dans la piste chaînée
  (une chaîne PAR EXERCICE, D-964-5 ; le tiers est au dossier) : le document porte `creePar`, `creeLe` et la
  `provenance`. Contestable.
- **D-968-5 : le grand livre auxiliaire est le grand livre de 966 lu par tiers.** `GET …/tiers/{t}/grand-livre` : même
  calcul (instantané, `bigint`, solde progressif, pages, curseur lié au tiers), sur les lignes qui portent ce tiers,
  tous collectifs confondus (index `grand_livre_par_tiers`). `GET …/comptes-collectifs/{racine}/auxiliaires` somme les
  lignes du collectif deux fois dans le même instantané : par tiers (les auxiliaires, `sansTiers` à part) et par compte
  du plan (comme le grand livre) ; `concorde` compare les colonnes et le nombre de lignes. Le grand livre d'un compte
  (966) dit en plus, par mouvement, le tiers et l'échéance (ajout).
- **D-968-6 : un tiers du dossier, de la catégorie du collectif.** Le tiers cité est lu au registre du DOSSIER (d'un
  autre dossier : 422 **`TIERS_INCONNU`**) ; un client sur `401` : 422 `TIERS_HORS_COLLECTIF`
  (`details.categorieDuCompte`, `categorieDuTiers`). La forme se vérifie d'abord, sans base ; le registre n'est lu que
  si la pièce cite un tiers.
- **D-968-7 : la source de l'échéance est la LIGNE.** Donnée à la saisie (`echeance`, jour civil, pas avant la date de
  l'écriture : 422 **`ECHEANCE_INVALIDE`**), ou déduite : date de l'écriture + **délai de paiement du tiers** pour une
  ligne dans le sens naturel du collectif (une créance client au débit, une dette fournisseur ou salarié au crédit) ;
  la date de l'écriture sinon (un règlement, un avoir, un acompte est disponible à sa date). **Figée** sur la ligne :
  un délai changé plus tard ne vieillit pas autrement le passé. Une ligne validée avant 968 prend sa date d'écriture.
- **D-968-8 : la balance âgée.**
  - Par tiers (et une position « sans tiers » par catégorie), par **tranche de retard** de l'échéance à la date
    d'arrêté : `NON_ECHU`, `0-30`, `31-60`, `61-90`, `91+` par défaut (bornes 30, 60, 90 ; retard 0 = échue le jour
    même).
  - **Paramétrables par requête** (`tranches=15,45`) : 1 à 6 bornes croissantes de 1 à 3 650 jours (422
    **`TRANCHES_INVALIDES`**). Pas de paramètre par dossier en 968 (contestable).
  - **Date d'arrêté** : `au` demandée, dans l'exercice ; absente, le **jour de l'horloge de référence** du service
    (`HORLOGE`, injectée, jamais `Date.now()`), ramené dans les bornes de l'exercice (`auParDefaut: true`).
  - Montants **signés** (débit − crédit : une créance client est positive, une dette fournisseur négative). Lignes :
    écritures VALIDÉES de l'exercice, datées au plus tard à la date d'arrêté, sur un collectif ; filtre de catégorie
    facultatif. Lue dans un instantané.
- **D-968-9 : préparée pour le lettrage (969).** Le calcul ne prend que le reste NON LETTRÉ de chaque ligne : un port
  `SOURCE_DES_LETTRAGES` rend, à la date d'arrêté et dans le même instantané, le montant lettré de chaque ligne, citée
  par `<ecritureId>:<rang>` (une écriture validée est inaltérable : le lettrage s'écrira à côté). En 968,
  `AucunLettrage` : toutes les lignes sont non soldées. Le lettrage partiel est déjà compté (une ligne lettrée en partie
  garde son reste, une ligne soldée sort) ; 969 remplacera le fournisseur sans toucher au calcul. Sans lettrage, un
  règlement non lettré figure à sa propre échéance, en négatif.
- **D-968-10 : la balance publiée reste celle de 967.** Elle groupe les lignes par `lignes.compte` (le compte du plan,
  ici le collectif) ; le tiers n'entre ni dans `balance.submitted` ni dans le sceau. Le hub refuse un compte
  auxiliaire : aucun n'est jamais publié.
- **D-968-11 : aucun droit neuf.** Créer un tiers : `comptabilite:tiers:administrer` (déclaré depuis 958, attribué en
  971 à `CAB_ASSOCIE` et `CAB_COLLABORATEUR`). Lire les tiers, les collectifs, les auxiliaires, la balance âgée :
  `comptabilite:dossier:consulter`. Saisir une ligne de tiers : `comptabilite:ecriture:saisir`. Rien à faire dans auth.
- **D-968-12 : le manifeste.** Six routes de lecture en `routesLectureSeule`, commentaire des tiers et des droits,
  « tiers » dans l'avertissement de désinstallation ; recopié à l'octet dans le service après la fusion de l'annonce.

## Contrat touché (annoncé dans « ⚠ Contrats » du journal de B AVANT la fusion du code)

- **Routes neuves** :
  - `POST /api/v1/dossiers/{d}/tiers` (`comptabilite:tiers:administrer`), corps `{ code, nom, categorie,
    delaiDePaiementJours?, referenceExterne?: { systeme, id } }` → 201 (créé) ou 200 (rejeu) ;
  - `GET /api/v1/dossiers/{d}/tiers?categorie=&apres=&limite=` → `{ tiers: [Tiers], suivant }` ;
    `GET /api/v1/dossiers/{d}/tiers/{tiersId}` → `Tiers` = `{ id, dossierId, code, nom, categorie,
    delaiDePaiementJours, referenceExterne?, creePar, creeLe, provenance }` ;
  - `GET …/exercices/{e}/comptes-collectifs` → `{ contrat: 'comptes-collectifs@1', referentiel, version, comptes:
    [{ racine, libelle, categorie }] }` ;
  - `GET …/exercices/{e}/comptes-collectifs/{racine}/auxiliaires?du=&au=&devise=` → `{ dossierId, exerciceId,
    referentiel, collectif, exercice, periode, devise, auxiliaires: [{ tiers: { id, code, nom }, ouverture,
    mouvements, nombreDeLignes, soldeOuverture, soldeCloture }], sansTiers, totalDesAuxiliaires,
    collectifAuGrandLivre: { …, comptes }, concorde }` ;
  - `GET …/exercices/{e}/tiers/balance-agee?au=&categorie=&tranches=&devise=` → `{ dossierId, exerciceId, referentiel,
    exercice, au, auParDefaut, devise, categorie, tranches: [{ code, retardMin, retardMax }], positions: [{ tiers: {
    id, code, nom } | null, categorie, solde, montants: [...], nombreDeLignes }], totaux: { solde, montants,
    nombreDeLignes } }` ;
  - `GET …/exercices/{e}/tiers/{tiersId}/grand-livre?du=&au=&devise=&apres=&limite=` → la forme du grand livre d'un
    compte (966), avec `tiers: { id, code, nom, categorie }` au lieu de `compte`, et `compte` sur chaque mouvement.
  - Toutes les lectures : `comptabilite:dossier:consulter`, au manifeste en `routesLectureSeule`.
- **Champs AJOUTÉS (facultatifs), rien de renommé** :
  - lignes de `POST …/ecritures` et `PUT …/ecritures/{id}` : `tiersId` (24 hex), `echeance` (`AAAA-MM-JJ`) ;
  - lignes d'une écriture lue (`GET …/ecritures`, `…/{id}`, réponses de saisie, validation, contre-passation) :
    `tiersId`, `echeance` ;
  - mouvements de `GET …/grand-livre/comptes/{compte}` (966) : `tiersId`, `echeance`.
- **Comportement** : une ligne sur un compte collectif sans tiers est refusée (422 `TIERS_REQUIS`) à la saisie, à la
  correction et à la validation.
- **Refus nommés neufs** : 422 `TIERS_REQUIS`, `TIERS_INCONNU`, `TIERS_HORS_COLLECTIF`, `ECHEANCE_INVALIDE`,
  `TRANCHES_INVALIDES` ; 409 `TIERS_EN_DOUBLE` ; 404 `TIERS_INTROUVABLE`, `COLLECTIF_INCONNU`.
- **Base** : collection neuve `tiers` (en ajout seul) ; index neuf `grand_livre_par_tiers` sur `ecritures`. **Donnée**
  du service : `comptes-collectifs@1`.
- **Inchangés** : `balance.submitted` (forme, lignes, sceau) ; aucun topic, aucun schéma au registre, aucune variable.
- **Manifeste** : D-968-12.

## Ce qui a été livré

Deux PR fusionnées en « Rebase and merge » le 17/11, l'annonce d'abord.

| Dépôt | PR | Sur la branche |
|---|---|---|
| `prospera-stories` | #665 (fiche, tracker, manifeste amendé, annonce du contrat, AVANT le code) | `main` `c66177a` |
| `prospera-comptabilite-service` | #8 | `dev` **`92a861a`** (rejoué de `84db48e` ; arbre identique) |

- `src/tiers/` :
  - `collectifs-declares.json` (`comptes-collectifs@1`) et `comptes-collectifs.ts` : la déclaration validée au
    chargement, le collectif d'un compte, les règles d'une ligne de tiers (forme, registre, échéance) ;
  - `balance-agee.ts` : tranches, retard, date d'arrêté, calcul (non-lettré, signé) ;
  - `lettrages.ts` : le port `SOURCE_DES_LETTRAGES` et `AucunLettrage` ;
  - `tiers.schema.ts` (`tiers`, en ajout seul), `registre-des-tiers.service.ts`, `auxiliaires.service.ts`,
    `tiers.controller.ts` (deux contrôleurs), `tiers.dto.ts`, `vue.ts`, `tiers.module.ts`.
- `src/ecritures/` : la ligne porte `tiersId` et `echeance` (schéma, DTO, vue, contrôleur) ; la saisie et la
  correction passent par le registre des tiers ; la validation exige le tiers sur un collectif ; la contre-passation
  garde tiers et échéance. Index `grand_livre_par_tiers`.
- `src/grand-livre/` : le grand livre d'une sélection de lignes (un compte ou un tiers) ; `tiersId` et `echeance` sur
  les mouvements.
- `src/common/refus.ts` (huit refus neufs), `src/portee/portee.ts` (`porteeDuDossier`), `src/module.manifest.ts`
  recopié à l'octet depuis `main`, README (section des tiers).
- `test/socle/tiers.socle-spec.ts` (27 tests) ; `test/socle/outils.ts` (`poserLesTiers`, `avecTiers`) ; les suites
  de 962 → 967 rattachent leurs lignes 411 et 401 à un tiers, sans rien changer de leurs attendus.

## Preuves

- **Node 24** (étage `verification`, image construite depuis `git -c core.autocrlf=false archive` du commit
  poussé) : **44 suites, 639 passés, 3 sautés** ; `npm run lint`, `tsc --noEmit` et `npm run build` verts.
- **`npm run test:socle`** (vrai MongoDB 8.0 `rs0`, vrai Kafka ; doublures HTTP d'auth, de dossier-service et de
  document-service), sous `timeout 1500` et `--forceExit` : **177/177**, dont 27 neufs. L'horloge du service y est
  FIXÉE (2026-05-04T10:00Z) :
  - **registre** : quatre tiers par catégorie, lus par page et par catégorie ; la même création rejouée rend 200 sans
    rien écrire ; dix créations concurrentes du même code ⇒ un 201, neuf 200, un document ; un autre tiers au même
    code ⇒ 409 ; droits (403 sans `tiers:administrer`, lecture sous `dossier:consulter`) ; corps invalides 400 ;
    tiers d'un autre dossier 404 ;
  - **ligne de collectif sans tiers** ⇒ 422 `TIERS_REQUIS` (401, 411, 416, 421, 422), rien d'écrit, rien à la piste,
    aucun numéro consommé (le brouillard suivant prend `VE-BR-000001`) ; tiers hors collectif, d'une autre catégorie,
    inconnu, d'un autre dossier, échéance antérieure : 422 nommés ; la correction repasse par les mêmes règles ; un
    brouillard d'avant 968 (posé en base sans tiers) est refusé à la validation, puis corrigé et validé ;
  - **jeu connu** (huit pièces, dont une contre-passation et un brouillard) : échéances figées attendues ; **somme
    des auxiliaires = collectif** pour 411, 401 et 422, `concorde`, et la route du grand livre de 966 sommée sur les
    comptes 411… rend la même chose ; une période coupe l'ouverture ; grand livre d'un tiers par pages, curseur lié
    au tiers ;
  - **balance âgée juste à quatre dates d'arrêté** : au 30/06 (CAFI 59 000 en 91+ ; CKODJO 88 000 en 91+, la
    contre-passation nette en 31-60 ; FSOTRA −136 000 en 61-90 ; SAMA −150 000 en 91+), au 15/03, au 12/02, et sans
    date (le 04/05 de l'horloge ; un exercice passé s'arrête à sa fin) ; tranches paramétrées, filtre de catégorie,
    `TRANCHES_INVALIDES` ;
  - **lignes d'avant 968** (sans tiers) : auxiliaire `sansTiers`, la somme reste égale au collectif ; position sans
    tiers dans la balance âgée ;
  - **balance publiée inchangée** : le même jeu, saisi avec des tiers dans un dossier et posé sans tiers (comme 967
    l'écrivait) dans un autre, publie les mêmes lignes, les mêmes totaux et le même checksum ; une ligne par compte
    du plan, aucun champ de tiers.
- **Mutations** (« rouge » = `Tests: … failed` et aucun `TS\d{4}`) : **unitaires 46/46** (collectif par racine,
  tiers requis, interdit hors collectif, échéance, catégorie, sens naturel, délai, validation, déclaration ; tranches,
  bornes, retard, date d'arrêté, lettrage, signe, regroupement par tiers et par catégorie ; registre ; concordance ;
  contre-passation ; saisie). Cinq premières écritures rougissaient par compilation ou survivaient (catégories
  confondues, jour inexistant postérieur) : réécrites, et deux tests ajoutés. **Socle 9/9** (lignes hors collectif
  sommées, date d'arrêté ignorée par la base, brouillards comptés, grand livre du tiers sans filtre, registre lu hors
  du dossier, correction sans tiers, `Date.now()` au lieu de l'horloge, validation sans contrôle, lignes sans tiers
  oubliées).
- **`docker compose -p grp-b --profile comptabilite up -d --build`** (volumes neufs) : conteneurs `healthy`,
  `/api/v1/health` 200, les sept routes neuves mappées.
- **Preuve de bout en bout, pile `grp-b`** (compose racine et surcouche locale non versionnée ; auth `913bd92`,
  dossier-service `768a4aa` et balance-service `98078b0` reconstruits depuis `origin/dev` par `git archive`,
  comptabilité du commit poussé) : **25/25**. Un associé réel (jeton RS256, `/moi/droits` :
  `comptabilite:tiers:administrer`) crée un client, un fournisseur et un salarié (rejeu 200) ; une ligne 411100 sans
  tiers ⇒ 422 `TIERS_REQUIS` ; **les quatre pièces de la preuve de 967**, saisies avec leurs tiers, sont validées ;
  auxiliaires concordants ; grand livre du client soldé ; balance âgée au 30/06 (client net à 0 en 91+, fournisseur
  −59 000 en 31-60) et au jour de l'horloge (17/11) ; **publication : checksum `16a6e637…`, EXACTEMENT celui de la
  preuve de 967**, lignes au compte du plan, **ingérée** par le vrai hub (`INGEREE`, même checksum, `justifiée`,
  trace `comptabilite-service` sans rejet) ; piste chaînée intacte. Pile descendue avec ses volumes, images de la
  preuve supprimées, **verrou Docker rendu** (pris à 22:12 après D-1058, rendu à 22:26).

## Pour la suite

- **Lettrage (969)** : remplacer `AucunLettrage` (port `SOURCE_DES_LETTRAGES`) ; les lignes se citent par
  `<ecritureId>:<rang>` ; le montant lettré est une valeur absolue, à la date d'arrêté.
- **Clôture (970)** : les à-nouveaux des collectifs se dérivent PAR TIERS (une ligne d'à-nouveau par tiers et par
  compte), sinon l'exercice suivant perd ses auxiliaires.

## Definition of Done

- [x] Tests unitaires (Node 24, étage `verification`), lint des fichiers touchés, `tsc`, build.
- [x] `test:socle` sur un vrai MongoDB 8.0 en jeu de répliques et un vrai Kafka, sous `timeout`.
- [x] Mutations rouges sur l'assertion (logique neuve).
- [x] `docker compose up` sain (module Nest neuf).
- [x] Balance publiée inchangée et ingérée par le vrai hub.
- [x] PR de code fusionnée en rebase ; PR de docs (fiche, tracker, journal).
