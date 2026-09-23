# STORY-529 : Un cabinet ne peut pas créer une deuxième société — `POST /profil-societe` répond 409, et personne n'a jamais ouvert de story

Status: done

**Épic :** EPIC-136 — Multi-société et périmètre de groupe
**Service :** `balance-service` (`profil-societe` et ses lecteurs) + `dossier-service` (contrat
`dossier.created`/`dossier.updated`, additif) — ⚠️ **contrat d'événement = 2 dépôts**
**Points :** 13 · **Sprint :** S20
**Complexité :** high
**Origine :** §6.3 de `analyse-scalabilite-multireferentiel-2026-08-27.md` ; manque nommé dans la maquette depuis longtemps, **jamais fiché**.

---

## Le fait

Trois constats, vérifiés dans le code et non déduits des stories :

1. **`POST /profil-societe` répond `409 PROFIL_SOCIETE_DEJA_EXISTANT`** — index unique sur `orgId`.
   Une organisation ne peut porter qu'**une seule** société.
2. **Il n'y a pas de `societeId` sur la balance.**
3. **Zéro occurrence de « consolidation »** dans tout le produit.

Le `dc-note` de la maquette porte ces trois manques **depuis des mois**, en toutes lettres. ⚡ **Et
aucun n'a jamais eu de story** — c'est le cas le plus net du patron « un manque documenté finit par
se lire comme un manque traité ».

⚠️ Or l'unité de travail est le **dossier** depuis EPIC-043, et un dossier est censé être une
société. Le profil société, lui, est resté keyé sur l'**organisation** : c'est la même
désynchronisation que STORY-422 (le plan) et STORY-533 (l'habilitation), sur un troisième objet.

## Pourquoi c'est structurel

« Gros distributeur » veut presque toujours dire **groupe** : N sociétés, N points de vente, N
patentes, N NIF. Aujourd'hui il faudrait **N organisations** — donc N abonnements, N KYC, N
portefeuilles — pour tenir un groupe que le cabinet voit comme un client.

## Critères d'acceptation

- [ ] AC-1 — Le profil société est keyé sur le **dossier**, pas sur l'organisation. `POST` accepte
      une N-ième société pour une même organisation.
- [ ] AC-2 — La balance porte un **`societeId`** (ou le `dossierId` en tient lieu, si le cadrage
      conclut qu'un dossier = une société — **à trancher explicitement, pas par défaut**).
- [ ] AC-3 — ⚠️ **Migration : chaque profil société existant est rattaché à son dossier**, sans perte
      et sans invalider les balances déjà produites. C'est l'AC le plus délicat.
- [ ] AC-4 — Non-régression : un cabinet à une seule société ne voit **aucun changement**.
- [ ] AC-5 — ⛔ **La consolidation N'EST PAS dans cette story** et est nommée comme telle : elle
      dépend de STORY-530. Livrer le multi-société sans le dire ferait attendre une consolidation
      qui n'arrive pas.

---

# Cadrage — fait AVANT toute ligne de code

Sources lues : le code de `balance-service` (`dev` @ `9ca7d41`) et de `dossier-service` (`dev`), les
fiches STORY-236, 301, 303, 356, 422, 533, et `epics-consolidation-2026-08-28.md`.

## Les constats mesurés

### M1 — ⚡⚡ La deuxième société EXISTE déjà : c'est un dossier

Depuis EPIC-043 (STORY-301), le **dossier** de `dossier-service` porte toute l'identité de la page de
garde GUIDEF : raison sociale, sigle, forme juridique, **NIF** (unique par cabinet et par pays, index
`unicite_nif_societe`), RCCM, CNSS, **date de création**, **pays**, `typeEntite`, **devise**, activité
(`objetSocial`, `codeNaema`, `secteur`), capital, actionnaires, dirigeants. `POST /dossiers` en crée
autant qu'on veut par cabinet. Son propre JSDoc le dit : *« Renverse frontalement l'invariante que
`balance-service` affirme encore […] : une organisation = une société »*.

⇒ Le `409 PROFIL_SOCIETE_DEJA_EXISTANT` ne frappe pas « une deuxième société » : il frappe un
**doublon hérité**, `profils_societe` de `balance-service`, index unique `{ orgId: 1 }`, antérieur au
dossier. Le vrai défaut n'est pas qu'on ne puisse pas créer une société — c'est que **`balance-service`
lit la société au grain de l'organisation**.

### M2 — ⛔ Ce grain applique au client les données du CABINET, dont une exonération fiscale

Mesuré dans `balance-service` : le profil est lu par `orgId` **seul** à chaque site — la devise de tenue
(`deviseDuDossier(orgId)`, 8 appelants : soumission, aperçu, reprise, créances en devises,
immobilisations, rapprochement, agrégation), l'activité (`codeNaema`, `secteur`, `objetSocial` —
catégorisation des cahiers), la **date de création** (`chargerProfilFiscal`), et le repli des deux axes
(`axesAvecRepli`, marche `PROFIL_COURANT`). Pour un cabinet qui tient des clients, **chaque dossier
client reçoit les valeurs du profil du cabinet**.

⛔ La date de création n'est pas décorative : elle **constate l'exonération de MFP et de TPU de
l'entreprise nouvelle** (`situerExerciceDansFenetre`, STORY-412). Un client créé en 1990, tenu par un
cabinet créé en 2025, voit ses exercices 2026 placés **dans la fenêtre** de l'entreprise nouvelle — et
sa MFP sort exonérée. STORY-303 l'avait nommé en dette (*« `dateCreation` reste lue sur un profil
org-keyé »*) ; c'est cette story qui la solde.

### M3 — Le repli des AXES, lui, ne peut pas quitter le cabinet dans cette story

Un dossier client neuf n'a **aucune décision d'axes datée** : la création ne les saisit pas (« ils ne se
saisissent toujours pas », `dossiers.service.ts`), FE-060 n'en affiche aucun. Il vit donc aujourd'hui
sur la marche `PROFIL_COURANT` — le couple du cabinet —, que STORY-303 a gardée **pour la
non-régression**. La re-keyer sur le propre profil du dossier ferait tomber **tout dossier client non
décidé** sur `AUCUNE` : `SYSTEME_COMPTABLE_INDETERMINE` sur l'agrégation et le plan, régime par défaut.
⇒ Le repli des axes reste celui du **dossier cabinet** — lu désormais **par dossier**, celui que
STORY-356 a créé depuis ce profil —, et la dette de 303 reste **ouverte et nommée**.

### M4 — Chaque profil existant a déjà « son » dossier : STORY-356 l'a créé depuis lui

STORY-356 a fait de chaque profil le dossier **« Mon cabinet »** de son organisation (`estLeCabinet:
true`, unique par organisation) et y a rattaché toute la donnée keyée `orgId` — balances comprises.
`balance-service` connaît ce lien sans appel : le read-model `dossiers_dossier` porte `estLeCabinet`.
Et « Mon cabinet » existe pour **toute** organisation active : `dossier-service` le crée à
`identity.org.created` (D1).

⇒ La migration de l'AC-3 est un **rattachement**, pas une redistribution : chaque profil prend le
`dossierId` du dossier cabinet de son organisation. Les balances **ne sont pas touchées** — elles
portent `dossierId` depuis 356, et leur empreinte ne couvre pas le profil.

### M5 — La balance porte DÉJÀ l'identifiant de sa société

`dossierId` est **requis** sur la balance depuis STORY-356 et **ouvre** son index unique
`{ dossierId, exercice, source, origine, version }`. `societeId` : **0 occurrence** dans les 14 services.

### M6 — Le dossier sait déjà ce que le profil d'un client ignorerait

`dossier-service` publie `dossier.created`/`dossier.updated` avec `devise` — que `balance-service` **ne
lit pas** (absent de son contrat consommateur) —, mais **sans** `dateCreation` ni l'activité. Un dossier
client sans profil propre n'aurait donc, dans `balance-service`, **aucune** date de création : l'exonération
redeviendrait inconstatable, alors que le cabinet l'a saisie à la création du dossier.

### M7 — ⛔ Un piège de migration : `migrate:dossiers` publierait un CLIENT comme cabinet

Le script de STORY-356 lit `profils_societe.find({ actif: true })` et publie chacun sur
`profil.societe.consolide`, que `dossier-service` applique au dossier **« Mon cabinet »** de l'organisation
(`migrerProfilEnCabinet`, clé `orgId`). Avec N profils par organisation, un rejeu publierait le profil
d'un **client** et **écraserait l'identité du cabinet** avec la sienne.

### M8 — Les devises ne peuvent pas diverger aujourd'hui

Le DTO du profil (`['XOF']`) et celui du dossier (« devises tenues par la plateforme ») n'acceptent que
`XOF`. Changer la source de la devise ne change donc **aucun** chiffre aujourd'hui — mais c'est elle
qui décidera le jour où une deuxième devise sera tenue, et elle doit être celle **du dossier**.

## Les décisions

**D-529-1 — Un dossier = une société (AC-2, tranché explicitement).** `dossierId` tient lieu de
`societeId` sur la balance : il est requis, il ouvre l'index unique, et le dossier porte l'identité
complète (M1, M5). **Aucun champ n'est ajouté à la balance** ; un test de garde fige que l'index unique
de la balance commence par `dossierId`.

**D-529-2 — Le profil est keyé sur le dossier (AC-1).** `profils_societe` porte `dossierId` (requis) ;
index unique `{ dossierId: 1 }` à la place de `{ orgId: 1 }` ; `orgId` reste dans **chaque** filtre
(fail-closed). `PROFIL_SOCIETE_DEJA_EXISTANT` vaut désormais pour **un même dossier**. Les audits
(`profils_societe_audit`) et les propositions OCR portent le `dossierId`.

**D-529-3 — Les routes suivent le dossier.** `POST|GET|PATCH /dossiers/:dossierId/profil-societe`,
`GET …/completude` et les trois routes OCR, sous `@RequiresDossierScope()` (dossier d'un autre cabinet ⇒
`404`). Les routes historiques `/profil-societe` **restent** et désignent le **dossier cabinet** de
l'organisation (M4) — le cabinet à une seule société ne voit aucun changement (AC-4) ; elles sont
marquées dépréciées au contrat. Dossier cabinet pas encore connu du read-model ⇒ `409` explicite, jamais
un profil orphelin.

**D-529-4 — L'identité d'un client ne vient JAMAIS du cabinet.** Devise, date de création et activité
se lisent en cascade **du dossier** : son profil s'il en a un, sinon sa propre déclaration répliquée de
`dossier-service` (D-529-6), sinon **rien** — `DATE_INCONNUE` (aucune exonération supposée), aucune
activité, devise par défaut **nommée**. Un seul point de résolution par donnée (patron D-409-3).

**D-529-5 — Le repli des axes reste celui du dossier cabinet** (M3), lu par dossier, et la dette de
STORY-303 reste ouverte — nommée dans le code et ici.

**D-529-6 — `dossier.created`/`dossier.updated` gagnent `dateCreation`, `objetSocial`, `codeNaema`,
`secteur`** (additifs, facultatifs à la lecture) ; `balance-service` projette ces champs **et** `devise`
dans `dossiers_dossier`. Deux dépôts, intégrés ensemble ; les autres consommateurs du topic ignorent des
champs additifs (vérifié consommateur par consommateur).

**D-529-7 — La migration (AC-3)** : script `migrate:profils` (patron `migrate:dossiers`) — chaque profil
sans `dossierId` prend celui du dossier cabinet de son organisation ; idempotent ; un profil dont
l'organisation n'a pas de dossier cabinet est **compté et nommé**, jamais rattaché au hasard (sortie en
erreur) ; l'index `{ orgId: 1 }` est supprimé **par son nom**, le nouveau créé. Et `migrate:dossiers` ne
publie plus que les profils du **dossier cabinet** (M7).

**D-529-8 — Non-régression (AC-4)** : un cabinet réduit à « Mon cabinet » rend les **mêmes** devise,
régime, système, activité et date de création avant et après — prouvé par un test qui compare les deux
lectures, et en docker sur une base migrée.

**D-529-9 — La consolidation n'est pas ici (AC-5)** : aucune agrégation, aucun lien entre dossiers ; le
périmètre est STORY-530, la consolidation STORY-531 → EPIC-137-141. Écrit dans le contrat de la route.

## Hors périmètre — hooks inertes documentés

- **Le repli des axes sur le cabinet** (M3, dette de STORY-303) : il tombera quand la création d'un
  dossier décidera ses axes.
- **Le démantèlement du profil** au profit du seul dossier (identité modifiable côté `dossier-service`,
  OCR et complétude déplacés) : l'identité d'un dossier ne se modifie toujours par aucune route après sa
  création ; le profil par dossier en est, en attendant, la fiche modifiable.
- **Une deuxième devise tenue** (M8).
- **Consolidation, périmètre** : STORY-530, 531.

## Notes

- Voir [[STORY-530]], [[STORY-531]], [[STORY-422]], [[STORY-533]] (la même désynchronisation, ailleurs),
  [[STORY-236]], [[STORY-303]], [[STORY-356]].

## Progress Tracking

- 2026-09-23 — branche `MNV-529` ouverte sur `docs/` ; statut `ready-for-dev` → `in_progress`.
- 2026-09-23 — **cadrage fait avant tout code** : 8 constats, 9 décisions. La deuxième société existe
  déjà — c'est un dossier (M1) ; le vrai défaut est le **grain** de lecture, qui applique au client la
  date de création du cabinet et donc son exonération de MFP (M2) ; le repli des axes ne peut pas quitter
  le cabinet sans casser tout dossier client non décidé (M3) ; un rejeu de `migrate:dossiers` écraserait
  l'identité du cabinet (M7).

- 2026-09-23 — **développée** dans deux dépôts, branches `MNV-529` (la moitié `balance-service` rebasée sur
  `dev` après STORY-528 : un conflit résolu dans `immobilisations.service.ts`) : read-model
  `dossiers_dossier` (devise, date de création, activité) ; profil keyé sur `dossierId`, routes nichées +
  historiques dépréciées ; cascade donnée par donnée (profil du dossier → déclaration du dossier), date
  future écartée à la lecture ; repli des axes sur le cabinet (D-529-5) ; `migrate:profils` ;
  `migrate:dossiers` ne republie plus que les profils du cabinet ; `dossier-service` publie `dateCreation`,
  `objetSocial`, `codeNaema`, `secteur` (clé absente omise, jamais `null`). PR `balance-service#117` +
  `dossier-service#34`.

### Revues (⑥ code, ⑦ sécurité)

- Revue de sécurité : **0 constat** (IDOR, routes historiques, OCR, migration, date falsifiable examinés).
- Revue de code : 3 constats. **C-3** (409 `DOSSIER_ARCHIVE` absent du Swagger OCR niché) : **faux
  positif**, démontré par mutation — `@RequiresDossierScope()`, posé sur la classe, le documente déjà ;
  la garde OpenAPI ajoutée protège ce décorateur (le muter fait rougir les 2 écritures OCR).
  **C-1** (fenêtre de déploiement : entre le démarrage du code et `migrate:profils`, aucun profil hérité
  n'est lu — mesuré en docker : `404 PROFIL_SOCIETE_INTROUVABLE` avant, `200` après) et **C-2** (les
  dossiers déjà créés ne reçoivent date de création et activité qu'au prochain `dossier.updated`, aucune
  republication) : souci de production, **différé** (règle du projet : le dev repart de zéro). C-1 est
  nommé dans la docstring de `migrate:profils` (« avant d'ouvrir le trafic »). ⚠️ **Hook pour la mise en
  production** : une commande `dossier-service` qui republie `dossier.updated` en état absolu pour tous
  les dossiers, à lancer avec le déploiement des deux PR.

### Portes et mutations — mesurées dans la session

| Dépôt | lint · build | unitaires | couverture | e2e |
|---|---|---|---|---|
| `balance-service` (rebasé sur 528) | ✅ | **224 suites, 4 594** (+1 ignoré) | 99,18 / 92,93 / 98,71 / 99,29 | **30 suites, 1 192** |
| `dossier-service` | ✅ | **101 suites, 1 640** | 99,44 / 94,56 / 98,49 / 99,55 | **9 suites, 336** |

Mutations rejouées (échantillon indépendant, suites complètes des modules touchés) : **7 / 7 rouges** —
date future acceptée, déclaration ignorée, déclaration avant le profil, profil lu sans le dossier
(résolveur et dépôt), déclaration lue sans le dossier, profil du cabinet jamais trouvé pour le repli.
Trois ne compilaient pas au premier jet : reformulées, jamais comptées rouges avant. La table complète de
l'agent (32 mutations, toutes rouges) a été purgée avec le scratchpad.

### Vérification docker — pile neuve (`down -v`)

| Scénario | Mesuré |
|---|---|
| Dossier client déclaré (date 2025-03-01, NAEMA 4711, commerce) | réplique dans `dossiers_dossier` de `balance-service` : date, objet, NAEMA, secteur, devise |
| ⚡ Deuxième société dans une même organisation | profil du cabinet (route historique) `201` + profil du client (route nichée) `201` ; doublon sur le client `409 PROFIL_SOCIETE_DEJA_EXISTANT` ; index `dossierId_1` unique |
| Lectures | nichée client / cabinet `200` chacun le sien ; historique → cabinet ; dossier inconnu `404` |
| Migration — base héritée (2 profils sans `dossierId`) | org avec cabinet **rattachée à son dossier « Mon cabinet »** ; org sans cabinet **nommée** (`AUCUN_DOSSIER_CABINET`), jamais rattachée, sortie en erreur |
| Idempotence | 2ᵉ passe : 0 rattaché, 3 déjà rattachés |
| Route historique de l'org migrée | avant migration `404`, après `200` avec sa date de création d'origine |
| Index au redémarrage | `dossierId_1` reconstruit (un seul orphelin restant) |

Non exposée en HTTP : la **source** de la date de création (profil / déclaration) — la cascade est prouvée
par les unitaires et les mutations U1-U5, sa matière (la déclaration répliquée) en base.

Pile arrêtée après la vérification (`docker compose stop`).
- 2026-09-23 — **clôturée** : `balance-service#117` et `dossier-service#34` rebase-mergées **ensemble** sur
  `dev` (contrat à 2 dépôts) ; branches supprimées. Statut `in_progress` → `done`.
