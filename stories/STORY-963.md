# STORY-963 : la Créance (1), un registre ouvert par sa source

Status: in-progress

**Complexité :** moyenne (le registre existe depuis STORY-251 ; il reçoit la clé `(source, sourceId)`, un tiers et un
périmètre, sans seconde collection ni migration ; l'idempotence se prouve sous concurrence sur la vraie base)

**Épic :** EPIC-231 (la Créance, le crédit du tiers et l'amendement de `paiement`), d'`epics-distributeur-2026-11-13.md`
**Dépôt :** `MoneyVibesGroup/prospera-paiement-service`
**Plage :** groupe B, n° 8 du lot 3 (`coordination/PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §3, ligne 963).
**Dépend de :** rien (le registre de STORY-251 et la saisie de STORY-290 sont sur `dev`).
**Débloque :** STORY-965 (la Créance (2) : crédit du tiers, compteurs, `paiement.creance.changed@1`), puis D-1059 (une
facture ouvre sa Créance dans `paiement`).

**Sources lues :** spine distributeur AD-4, AD-7, AD-9, AD-31 (`architecture/architecture-distributeur-2026-11-13/`) ;
amendements de `paiement` du 2026-11-13 (`amendement-2026-11-13-distributeur.md` §1.3, §1.4 ;
`amendement-2026-11-13-creances-distributeur.md` §2, §5, §6) ; PRD distributeur, annexe B (`paiement:*`) ; journal de D
(« → B, ce que la bibliothèque d'encours lit de la Créance », STORY-1047, STORY-1049) ; `encours/src/index.ts`
(`FaitCreance`) ; manifeste `facturation` de `prospera-ventes-service` (lecture seule) ; fiche STORY-960 (« Pour la
suite »).

---

## Pourquoi

FR-247 : `paiement` devient le **propriétaire unique** de la Créance ; `facturation` ne tient aucun solde. AD-7 : une
Créance est identifiée par **`(source, sourceId)`**, où `sourceId` est l'identifiant interne du document (jamais son
numéro d'affichage), un tiers, un périmètre, un montant d'origine figé. Sans cette clé, un numéro corrigé, repris de Sage
ou réémis après une restauration ouvrirait une seconde Créance pour la même facture : deux restes dus, deux relances.
Le distributeur en dépend en chaîne : la facturation (D-1059), l'encours de `commande` (D-1049, en échec fermé tant que
la Créance n'existe pas), le recouvrement.

## Ce qui doit être vrai à la fin (plan du lot 3, §3, ligne 963)

| Exigence | Fait |
|---|---|
| Un **registre unique** | la collection `creances` de STORY-251, la même pour toutes les origines (saisie, demande, abonnement, source) ; aucune seconde collection (D-963-1) |
| La clé **`(source, sourceId)`** | portée par l'`_id` : `<orgId>\|FACTURATION\|FACTURE:<SOURCEID>`, le module appelant et la référence étant **déduits** de la source (D-963-2) ; aucun index d'unicité de plus |
| La source **`FACTURE`** | seule servie ; `RELEVE_VENTE_COMPTE`, `ECHEANCE_DE_PRET`, `PRIME` déclarées et refusées 422 `SOURCE_DE_CREANCE_NON_SERVIE` (D-963-3) |
| **Un tiers, un périmètre** | `tiersId` et `perimetre` (`SOCIETE` \| `FREELANCE:<id>`, AD-31) requis, figés à l'ouverture ; une autre valeur sur la même source : 409 `CREANCE_SOURCE_EN_CONFLIT` (D-963-5) |
| **Idempotent** | rejouer n'écrit rien (ni document, ni trace, ni fait) ; 201 à la naissance, 200 au rejeu ; prouvé sous concurrence sur MongoDB en jeu de répliques (D-963-6) |
| Le droit qui protège l'ouverture | `paiement:demande:emettre`, choisi dans l'annexe B (D-963-7) |
| Montants | entiers en unité mineure, comme le reste de `paiement` (D-963-11) |
| Preuves | unitaires, e2e (gardes sur une route sans surface plateforme), conformité sur la vraie base, mutation, `docker compose up` sain (module Nest touché) |

## Décisions (prises par défaut, contestables)

- **D-963-1 : un registre, la collection existante.** Une Créance de source est une créance projetée de plus : même
  collection `creances`, même upsert `$setOnInsert` sur la clef primaire (STORY-251), même anomalie de montant, même
  clôture. C'est la lettre de l'amendement §1.3 (« elle se range dans la référence existante […] le schéma ne change
  pas ») : les champs ajoutés sont facultatifs, aucune migration. Deux collections auraient fait deux restes dus.
- **D-963-2 : le module appelant et la référence se DÉDUISENT de la source, ils ne sont jamais reçus.**
  `FACTURE → FACTURATION` (puis `RELEVE_VENTE_COMPTE → FACTURATION`, `ECHEANCE_DE_PRET → CREDIT`, `PRIME → ASSURANCE`,
  table fermée `MODULE_DE_LA_SOURCE`), `referenceExterne = <SOURCE>:<sourceId>`. La même facture ne peut donc tomber que
  sur une clef. `preparerDescription` refuse une description qui porte une source sous un autre module ou une autre
  référence (400 `CREANCE_INVALIDE`, `champ: rattachement`) ; le DTO ne porte ni `moduleAppelant`, ni
  `referenceExterne`, ni `source`, ni `sourceId` (ils sont dans le chemin) ; `creance-saisie.invariant.spec.ts` reste
  vert.
- **D-963-3 : quatre sources déclarées, une servie.** `FACTURE` seule s'ouvre. Les trois autres rendent 422
  `SOURCE_DE_CREANCE_NON_SERVIE` (`details.source`) : le relevé de vente n'a pas encore de fait chez `facturation`, la
  prime et l'échéance de prêt ont leurs amendements. Une source inconnue est une forme fausse (400 `CREANCE_INVALIDE`).
- **D-963-4 : `sourceId` est un identifiant interne** : 1 à 64 caractères `[A-Za-z0-9_-]`, commençant par une lettre ou
  un chiffre (un ObjectId, un UUID). Un numéro d'affichage (`FAC 2026/0042`, deux-points, barre verticale, espace) est
  refusé. Même forme pour `tiersId`, `livraisonId` et l'identifiant d'un freelance dans `FREELANCE:<id>`.
  - ⚠️ La clef primaire est **insensible à la casse** (normalisation de STORY-251) : deux `sourceId` qui ne diffèrent
    que par la casse visent la même clef. Ils ne sont jamais fusionnés : le second est refusé 409
    `CREANCE_SOURCE_EN_CONFLIT` (`champ: sourceId`), parce que le `sourceId` relu est comparé à la lettre.
- **D-963-5 : le tiers et le périmètre sont figés ; leur divergence est un REFUS, celle du montant une ANOMALIE.**
  Un montant divergent est une seconde description légitime de la même dette : AD-7 dit « anomalie tracée, jamais un
  écrasement » (acte `ANOMALIE_MONTANT_ORIGINE`, fait `paiement.creance.anomalie.constatee`, 200). Un autre tiers ou un
  autre périmètre attribuerait la même facture à un autre débiteur : tracer en laissant passer ferait relancer quelqu'un
  qui ne doit rien. 409 `CREANCE_SOURCE_EN_CONFLIT` (`details.champ`), rien d'écrit. L'échéance et le libellé suivent
  STORY-251 : figés, un rejeu qui en porte d'autres ne les change pas.
- **D-963-6 : rejouer n'écrit RIEN, même sous concurrence.**
  - Avant la transaction, une lecture par clef primaire : la Créance existe et concorde, on la rend (200), sans
    transaction, sans trace, sans fait.
  - Dans la transaction, l'upsert arbitre (STORY-251) : la perdante d'une course trouve le document de la gagnante et
    **abandonne sa transaction** ; rien n'est consigné.
  - Un conflit transitoire (`ECRITURE_CONCURRENTE`, une autre ouverture de la même source au même instant) se rejoue
    aussitôt, **sans minuterie** (AD-12), au plus `ESSAIS_D_OUVERTURE` = 3 fois ; au-delà, le 409 rejouable remonte et
    l'appelant rejoue sa clef. `EcritureDArgent` ne reprend toujours rien (il ne sait pas si ce qu'il enveloppe est
    idempotent) ; c'est le cas d'usage, idempotent par sa clef, qui reprend.
- **D-963-7 : le droit qui protège l'ouverture est `paiement:demande:emettre`** (annexe B : COMMERCIAL, FREELANCE,
  PROSPECTION, RECOUVREMENT, COMPTABLE, DAF).
  - Les trois émetteurs d'une facture (`facturation:facture:emettre` : COMPTABLE, DAF, FREELANCE) l'ont tous : la
    facturation peut ouvrir la Créance avec le jeton du membre qui émet.
  - Il est **dans le jeton** (les 24 droits de STORY-960) : la garde existante le lit dans `perms[]`, sans appel à
    `auth` sur un chemin d'argent (`DroitsGuard`, STORY-241).
  - C'est la doctrine de STORY-290 : qui peut émettre une demande de paiement peut matérialiser la créance qui la porte.
  - Écartés : `paiement:creance:consulter` est un droit de **lecture** du registre, hors du jeton (il protégera les
    balances et le recouvrement quand `paiement` lira `/moi/droits`, `droits ∪ droitsHorsJeton`) ;
    `paiement:credit-tiers:imputer` est le geste du crédit du tiers (965) ; `facturation:facture:emettre` est le droit
    d'un autre module, hors du jeton.
  - ⚠️ Conséquence assumée : un COMMERCIAL ou un RECOUVREMENT peut ouvrir une Créance `FACTURE` par la route, comme il
    peut aujourd'hui saisir une créance manuelle. Le chemin voulu reste la facturation ; si le PO veut réserver
    l'ouverture aux émetteurs de facture, un droit `paiement:creance:ouvrir` (hors du jeton, lu par `/moi/droits`)
    entrera par une story à part.
- **D-963-8 : l'ouverture est un `PUT` sur la clef**, `PUT /api/v1/creances/sources/{source}/{sourceId}`. Le geste est
  idempotent : le même appel vise toujours la même Créance. Contrôleur à part (`OuverturesDeCreanceController`), garde
  du module sur la classe ; ce n'est **pas** une surface plateforme : une organisation sans le module est refusée 403
  `PAIEMENT_NOT_ENTITLED` avant le droit (éprouvé en e2e, STORY-728).
- **D-963-9 : aucune route de lecture neuve, aucun amendement du manifeste.** `GET /api/v1/creances` (déjà au manifeste
  en `routesLectureSeule`) reçoit des filtres facultatifs `source`, `sourceId`, `tiersId`, `perimetre` (égalités
  exactes) ; la vue d'une créance reçoit `source`, `sourceId`, `tiersId`, `perimetre`, `livraisonId`, absents pour une
  créance sans source. Index de recherche `{ organizationId, tiersId, perimetre }`.
- **D-963-10 : `paiement.creance.materialisee` (fait existant, sans `@1`) reçoit les mêmes champs, AJOUTÉS** quand la
  Créance a une source. L'état absolu `paiement.creance.changed@1` (révision, restants, `echeanceLe`) est la story 965.
- **D-963-11 : montants et échéance.** Montant d'origine : entier en unité mineure strictement positif (DTO `IsInt`,
  domaine `Number.isSafeInteger`). Échéance : `echeanceLe` `AAAA-MM-JJ`, figée par la source (AD-7), rangée à minuit
  UTC dans le champ `echeance` existant ; une date impossible (`2026-02-30`) est refusée, jamais reportée. Aucune
  horloge n'est lue (`HorlogeDeReference` n'est pas nécessaire : rien n'est décidé sur le temps).
- **D-963-12 : l'ouverture par le fait de la source (`facturation.facture.emise@1`, AD-7) passera par la même
  écriture.** `OuvrirLaCreance` est exporté par `CreancesModule` pour le consommateur. Il n'est pas écrit ici : la charge
  du fait n'est pas fixée par D. Ce que `paiement` en lira est proposé à D dans le journal de B (« → D »).

## Contrat touché (annoncé dans « ⚠ Contrats » du journal de B AVANT la fusion du code)

Tout est AJOUT : rien d'existant ne change de forme.

- **Route neuve** `PUT /api/v1/creances/sources/{source}/{sourceId}`, droit `paiement:demande:emettre`, garde du module.
  Corps : `{ tiersId, perimetre, montantOrigineMineur, devise, echeanceLe: AAAA-MM-JJ, libelle, livraisonId?, payeur? }`.
  201 (née) ou 200 (rejeu) → la vue d'une créance.
- **Refus nommés neufs** : 422 `SOURCE_DE_CREANCE_NON_SERVIE` (`details.source`) ; 409 `CREANCE_SOURCE_EN_CONFLIT`
  (`details.champ` : `source`, `sourceId`, `tiersId`, `perimetre`). `CREANCE_INVALIDE` (400) reçoit les champs `source`,
  `sourceId`, `tiersId`, `perimetre`, `livraisonId`, `echeanceLe`, `rattachement`.
- **`GET /api/v1/creances`** : filtres facultatifs `source`, `sourceId`, `tiersId`, `perimetre`.
- **Vue d'une créance** (toutes les routes qui la rendent) : champs facultatifs `source`, `sourceId`, `tiersId`,
  `perimetre`, `livraisonId`.
- **`paiement.creance.materialisee`** : champs facultatifs `source`, `sourceId`, `tiersId`, `perimetre`, `livraisonId`.
  Topic JSON sans registre (comme les autres faits déjà codés de `paiement`) ; aucun schéma au registre.
- **Piste d'audit** : l'acte `CREANCE_MATERIALISEE` reçoit les mêmes champs dans `donnees`.

## Ce qui a été livré

À compléter à la fusion.

## Preuves

À compléter à la fusion.

## Pour la suite

- **STORY-965** (Créance (2)) : `paiement.creance.changed@1` en état absolu, au registre en BACKWARD, avec ce que
  `encours@1` lit (`FaitCreance`) : `creanceId` = `<source>:<sourceId>` (K-7 de D), `revision` croissante (champ neuf
  du document, incrémenté dans la transaction de chaque changement), `tiersId`, `perimetre`, `devise`, `statut`,
  `restantCertainMineur`, `restantAfficheMineur`, `echeanceLe` (`AAAA-MM-JJ`) ; plus `montantExigible`,
  `montantDeclare`, `livraisonId`, `lueLe` (amendement §1.4). Le crédit du tiers (`paiement.credit-tiers.changed@1`,
  `paiement:credit-tiers:imputer`). `paiement:creance:consulter` (hors du jeton) pour la lecture du registre : la garde
  devra lire `/moi/droits`.
- **Le consommateur de `facturation.facture.emise@1`** : il appelle `OuvrirLaCreance` (D-963-12), dès que D a fixé la
  charge du fait.
