# STORY-319 : Le responsable désigné et la vue de charge par collaborateur — répartir avant l'échéance

Status: done — **livrée le 2026-11-26** : prospera-fiscal-service **#71** (`0cc79a7` sur `dev`) ; voir « Livraison ».
**EPIC-030 est fini.** Écrite le 2026-11-26 par la session du groupe C juste avant de la coder (lot 7, n° 4 du fiscal,
`PLAN-LOT-7-2026-11-24.md` §3) ; contrat annoncé avant le code (#951, « ⚠ Contrats » et « ⚠ Communs » du journal de C).

**Epic :** EPIC-030 (**la dernière story de l'épic**) · **Points :** 3 · **FR :** FR-F21 · **Architecture :** AD-17 (les
champs humains survivent à la re-dérivation), AD-18 (aucune minuterie : les alertes restent au balayage de 318)
**Service :** `prospera-fiscal-service` (dossier `obligations`, à C ; fichiers communs nommés plus bas).
**Après :** STORY-318 (`qualifierEcheance`, les alertes, `fiscal.obligation.alerte-echeance`). **Attendue par :**
STORY-349 de D (plan §5 : « le calendrier reçoit les obligations sociales »).

## Histoire

En tant qu'**administrateur de cabinet**, je veux savoir qui porte quoi, afin de répartir la charge avant l'échéance et
non après.

## Critères d'acceptation (`epics-fiscalite-2026-08-03.md`, EPIC-030)

1. **Étant donné** une obligation **quand** je lui affecte un responsable **alors** l'affectation est journalisée et
   visible au calendrier.
2. **Étant donné** un collaborateur **quand** j'ouvre sa vue **alors** sa charge et ses retards sont restitués.
3. **Étant donné** une re-dérivation du catalogue **quand** elle s'exécute **alors** les affectations existantes sont
   préservées.

## Ce que le code porte déjà (lu sur `origin/dev`, fiscal `cefbe20`)

- Le champ humain **`responsable`** de l'obligation (`string | null`, `null` à la création, `$setOnInsert` : la
  re-dérivation ne l'écrit jamais, AD-17) ; **aucune écriture ne le pose** (toujours `null`).
- Le calendrier du portefeuille (315) le rend (`LigneCalendrierDto.responsable`) et le filtre (`responsable=<userId>` ou
  `AUCUN`) ; la portée de l'appelant se lit dans la réplique locale `dossiers_fiscal` (administrateur : tout le cabinet ;
  collaborateur : ses dossiers, responsable ou contributeur).
- `qualifierEcheance` (318) : six états sur l'échéance applicable, avec l'horizon de l'organisation ; le calendrier rend
  `etatEcheance` et `joursRestants`.
- Les alertes (318) recopient le `responsable` du moment (D-318-8) ; leur clé est `obligationId|état|échéance`.
- Les réplications d'identité : `identity_memberships` (`userId`, `orgId`, `role`, `status` `ACTIVE` | `SUSPENDED`) et
  `identity_users` (prénom, nom), projetées depuis l'IdP.

## Contrat annoncé avant le code (2026-11-26)

**Ajouts seuls**, plus une précision de comportement sur la clé de l'alerte (D-319-9). Aucun champ, aucune route, aucun
topic existant ne change de nom ni de forme.

### Affecter un responsable (AC-1)

- **`POST /api/v1/obligations/affectation`** (rôles du cabinet, gate fiscale, droit **`fiscalite:declaration:valider`**)
  `{ obligationIds: string[] (1 à 50, chacune une fois, un ou plusieurs dossiers), responsable: string | null }` →
  `200 { responsable, obligations: ObligationResponseDto[] }`. `responsable: null` **retire** l'affectation. **Tout ou
  rien**, dans une transaction ; une obligation déjà confiée à ce responsable n'est pas récrite et ne produit aucun acte.
- **Refus** : `400` (corps) ; `404 OBLIGATION_INTROUVABLE` (absente, d'une autre organisation, ou d'un dossier hors de la
  portée de l'appelant — la même réponse) ; `409 OBLIGATION_DESACTIVEE`, `409 OBLIGATION_CLOTUREE`,
  `409 AFFECTATION_CONCURRENTE` (une obligation a changé entre la lecture et l'écriture : rien n'est écrit) ;
  `422 RESPONSABLE_INCONNU` (pas un membre **actif** de l'organisation) ; `422 RESPONSABLE_HORS_PORTEE` (le dossier n'est
  pas dans **sa** portée : il ne verrait pas l'obligation à son calendrier ; `details.dossierId`).
- **Journal chaîné** : un acte **`OBLIGATION_RESPONSABLE_AFFECTE`** par obligation changée, au périmètre
  `obligation:<id>`, dans la transaction : `{ dossierId, avant, apres }` (identifiants d'utilisateur ou `null`), acteur =
  l'auteur.
- **Au calendrier** : `responsable` porte l'affectation, le filtre `responsable` la retrouve (rien de neuf au DTO).

### La vue de charge (AC-2)

Les obligations **en charge** : actives, d'un dossier de la portée de l'appelant, **pas encore déposées** (le cycle n'a pas
atteint `DEPOSEE`), **toutes années** (paramètre `annee` facultatif), qualifiées au jour de la lecture avec l'horizon de
l'organisation (`qualifierEcheance`).

- **`GET /api/v1/obligations/charge`** (`annee`, `dossierId` facultatifs) → `200 { aLa, horizonJours, tronquee,
  collaborateurs: { responsable, nom, charge }[], sansResponsable: charge }` — un collaborateur par responsable présent,
  le plus en retard d'abord (retards, puis charge, puis identifiant).
- **`GET /api/v1/obligations/charge/{responsable}`** (`userId` ou `AUCUN` ; `annee`, `dossierId` facultatifs) →
  `200 { responsable, nom, aLa, horizonJours, tronquee, charge, retards: LigneCalendrierDto[] }` — **sa charge et ses
  retards** : les lignes `EN_RETARD_DE_PREPARATION` et `ECHEANCE_DEPASSEE`, l'échéance la plus ancienne d'abord (500 au
  plus ; le compte, lui, est entier).
- **`charge`** (`ChargeDto`) : `{ enCharge, nonDatees, pasEncorePreparees, enRetardDePreparation, preparees,
  echeancesDepassees, retards, prochaineEcheance }` — `retards` = en retard de préparation + échéance dépassée ;
  `prochaineEcheance` : l'applicable la plus proche **à venir** (aujourd'hui compris), `null` sinon.
- `nom` : « Prénom Nom » de la réplique `identity_users`, `null` s'il est inconnu (ou pour `AUCUN`).
- `tronquee` : plus de 20 000 obligations en charge dans la portée (le plafond du calendrier) : les comptes portent sur les
  20 000 premières. `400` : filtre mal formé.

### L'alerte suit le responsable (D-319-9)

- **La clé de l'alerte devient `obligationId|état|échéance|responsable`** quand l'obligation a un responsable ; **sans
  responsable, elle reste `obligationId|état|échéance`**, à l'identique de 318 : aucune alerte déjà produite ne se
  rejoue au déploiement.
- Conséquence : une obligation **confiée (ou re-confiée) alors qu'elle est déjà en alerte** est alertée de nouveau au
  balayage suivant, **pour son nouveau responsable** ; le fait **`fiscal.obligation.alerte-echeance`** v1 garde sa forme
  et porte `responsable` (l'identifiant d'utilisateur, aucune donnée personnelle). Une alerte produite reste un fait,
  jamais récrit (D-318-8).

### Persistance et fichiers communs (D-L7-2)

- **Aucune migration**, aucune collection neuve : l'affectation écrit le champ `responsable` existant ; la lecture de
  charge passe par le filtre du calendrier (`orgId`, dossiers, `active`, statut), sans index neuf.
- **Communs touchés** : le **contrat OpenAPI** (trois routes neuves) ; rien d'autre (ni `app.module.ts`, ni
  `package.json`, ni `read-models/` — `identity_memberships` y est lu, pas modifié —, ni manifeste, ni paquet). Tout le
  reste dans les dossiers de C (`domain/obligations`, `application/obligations`, `modules/obligations`, `adapters/mongo`,
  `ports`, `test/utils`). Rien dans les dossiers de D.

## Ce qui part ailleurs

- **→ D (STORY-349)** : une obligation sociale enregistrée comme les fiscales (`RegistreObligations.enregistrer`) est
  affectable, comptée à la charge et alertée **sans rien de plus** : aucune de ces routes ne regarde la taxe.
- **→ D (notification, `prospera-notification-service`)** : le destinataire d'une alerte est `responsable` du fait
  (`userId`, à résoudre dans le carnet de la notification), sans appel au fiscal ; `null` : les associés du cabinet
  (demande de 318, inchangée). Un responsable désigné après une première alerte en reçoit une à lui (D-319-9).
- **→ A (écrans du calendrier)** : l'affectation, la vue de charge ; le nom d'un responsable au calendrier se lit dans
  les membres du cabinet (le calendrier rend l'identifiant, D-319-7).

## Livraison (2026-11-26)

- **fiscal** (#71, `0cc79a7` sur `dev`, sur `cefbe20`, arbre identique au commit prouvé `90d7d08`) :
  `domain/obligations/responsable.ts` (`compterCharge`, `comparerCharges`, `comparerRetards`, `faitResponsableAffecte`, purs),
  `application/obligations/responsables-obligations.service.ts` (affectation, résumé, vue), port `AnnuaireCollaborateurs` et son
  adaptateur Mongo (`identity_memberships`, `identity_users`, lecture seule), `RegistreObligations.affecterResponsable` (transaction,
  comparaison-échange, acte) et `.enCharge` (déposées écartées en requête), `modules/obligations/responsables-obligations.controller.ts`
  et `dto/responsables.dto.ts` ; `cleAlerte` gagne le responsable (D-319-9) ; `versLigne` du calendrier exportée (les retards de la
  vue sont des lignes du calendrier).
- **Les AC en tests** : AC-1 (unitaire et e2e : confiées par la route, un acte par obligation changée, retrouvées au calendrier par
  `responsable` ; sur le vrai MongoDB, l'acte au journal chaîné, la chaîne intacte, tout ou rien) ; AC-2 (unitaire et e2e : le résumé
  par collaborateur, le plus en retard d'abord, la vue d'un collaborateur avec ses retards triés, `AUCUN`, `annee`, `dossierId`,
  l'horizon réglé du cabinet, la portée du collaborateur) ; AC-3 (e2e par la route de dérivation ; sur le vrai MongoDB, une
  re-dérivation qui change l'échéance garde l'affectation) ; D-319-9 (unitaire, e2e, et **sur la pile**).
- **Preuves** (Node 24, image `verification` de l'archive LF de `90d7d08`) : unitaires **211/211 suites, 3077** (3 sautés) ; spec
  BullMQ sur un vrai Redis **2/2** ; e2e **13/13, 286** ; `test:conformite` **21/21, 132** (dont `responsables.conformite-spec.ts`) ;
  `nest build` ; **mutations 23/23** rouges sur l'assertion (déposée comptée en charge, prochaine échéance passée, dépassées hors des
  retards, classement sans les retards, retards à l'envers, acte sans « avant », clé sans le responsable, clé de 318 changée, balayage
  qui ne passe pas le responsable, membre suspendu accepté, portée du responsable ignorée, portée de l'appelant ignorée, clôturée ou
  écartée confiée, doublon accepté, horizon du cabinet ignoré, retards non triés, plafond des retards levé, année ignorée, nom perdu,
  comparaison-échange sans le responsable lu, ré-affectation au même récrite, déposées dans la charge Mongo) ; §1.5 et gate :
  `docker compose -p grp-c` sain (MongoDB en jeu de répliques, Kafka, Redis), 3 routes montées, 0 `UnknownDependencies`, 401 sans
  jeton sur les trois routes ; **D-319-9 de bout en bout** : 2 alertes et 2 faits `SENT`, l'obligation `PROCHE` confiée ⇒ une 3e
  alerte (clé `…|EN_RETARD_DE_PREPARATION|<échéance>|<responsable>`) et un 3e fait `SENT` qui porte le responsable, rien de plus
  après deux balayages. Node 25 : 207/211 suites (les 4 rouges : le client Kafka natif, connus). Lint des fichiers touchés : aucun
  écart neuf. Verrou pris une fois (07:04 → 07:17, après attente de B).

### Écarts au contrat, décidés au code

- Aucun sur les formes annoncées. Précision : un corps d'affectation vide, en doublon ou au-delà de 50 sort en `400` (validation
  du DTO, et `AFFECTATION_INVALIDE` si le cas d'usage est appelé sans elle).

## Décisions prises au contrat (contestables)

- **D-319-1** : **une route d'affectation par lot** (1 à 50 obligations, plusieurs dossiers admis, tout ou rien) :
  répartir la charge, c'est confier d'un geste les obligations d'un client ou d'une échéance. `null` retire.
- **D-319-2** : affecter exige **`fiscalite:declaration:valider`** (l'associé, comme un report ou l'horizon) ; lire la
  charge, la gate fiscale seule. Aucun droit neuf (la règle d'or de 300 : un droit n'existe que s'il est vérifié).
- **D-319-3** : le responsable est un **membre actif** de l'organisation **qui voit le dossier** dans sa propre portée
  (administrateur du cabinet, ou responsable ou contributeur du dossier, la règle du calendrier) : une obligation confiée
  à quelqu'un qui ne la voit pas est une charge perdue. La portée se lit dans la réplique locale, avec son rôle de
  membre (`identity_memberships`).
- **D-319-4** : la portée de l'**appelant** se lit, elle aussi, dans la réplique locale des dossiers (celle du
  calendrier, d'où l'on affecte), pas par un appel à `dossier-service` par dossier.
- **D-319-5** : une obligation **écartée** ou **clôturée** ne s'affecte pas (409) ; toute autre étape du cycle, oui
  (un dépôt en cours a un responsable).
- **D-319-6** : la **charge** est ce qui reste à faire : les obligations actives **non déposées**, toutes années ; le
  paiement après le dépôt (343, 344) n'y entre pas. `annee` la restreint, comme au calendrier.
- **D-319-7** : le calendrier rend l'**identifiant** du responsable, pas son nom (une jointure par ligne pour un nom que
  l'écran a déjà) ; la vue de charge, qui est celle d'une personne, rend le nom.
- **D-319-8** : un collaborateur lit la charge **dans sa portée** (ses dossiers) — la même règle que le calendrier ;
  aucune vue « de l'autre » ne lui ouvre un dossier qu'il ne voit pas.
- **D-319-9** : la clé de l'alerte gagne le **responsable** (absent quand il n'y en a pas : les clés de 318 restent
  valables). Sans cela, un responsable désigné après la première alerte ne serait jamais prévenu. Re-confier en boucle
  produit une alerte par personne, jamais plus d'une par personne.
- **D-319-10** : **aucun topic neuf** pour l'affectation (aucun consommateur ne l'attend) : le journal chaîné la trace,
  l'alerte la porte.
- **D-319-11** : la ré-alerte part au **balayage suivant** (quotidien, 318), pas dans la transaction de l'affectation :
  une seule voie de production des alertes, AD-18 tenu.
