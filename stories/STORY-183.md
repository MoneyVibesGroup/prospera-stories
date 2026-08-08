# STORY-183 : Un dossier KYC n'a **ni historique de décisions ni timeline** — une resoumission se relit intégralement

**Epic :** EPIC-003 — KYC (`kyc-service`)
**Réf. :** ticket §E · **AP-03** *(historique)* · **AP-02** *(timeline de la fiche)* · **STORY-128** *(verdict par pièce, déjà daté)*
**Découverte par :** AP-INT-1 — écart nº4 d'AP-INT-0
**Priorité :** Should Have
**Story Points :** 3
**Statut :** done
**Complexité :** medium
**Créée le :** 2026-08-04
**Sprint :** 20
**Service :** `kyc-service` (`:3002`) — + `admin-panel` (relais BFF, cf. *Périmètre*)

---

## Le constat

`GET /admin/kyc/:orgId` ne porte **aucune décision passée**. Côté console, deux écrans en vivent :

- `KycFile.history` vaut **toujours** `[]` — l'écran d'historique existe et n'affiche jamais rien ;
- la carte « Revue KYC » de la fiche détail affiche une **timeline vide en permanence**
  *(`orgs-client.ts` : `events: []`, avec le commentaire « aucune timeline amont, vide, jamais
  inventée »)*.

**Conséquence :** à la resoumission, l'agent **ne voit pas ce qui avait été reproché**. Il relit donc
le dossier entier au lieu de vérifier une correction — c'est-à-dire exactement le travail que la
resoumission était censée éviter. Le cabinet attend d'autant plus longtemps, et pour un motif que
personne ne peut plus citer.

> ⚡ **Le motif est le seul élément qui rend une resoumission lisible.** Sans lui, « soumission 2 »
> n'est pas une information : c'est un compteur. Un agent qui lit « tentative 2/2 » sans savoir ce
> qui a échoué à la tentative 1 est dans une situation *pire* que s'il n'en savait rien — il sait
> qu'il lui manque quelque chose.

## Ce qui existe déjà et qu'il suffit d'exposer

`STORY-128` a livré le **statut et la date de revue par pièce** (`reviewStatus`, `reviewedAt`), et
les rejets portent déjà un motif. La matière d'un historique est donc **en partie là** ; ce qui
manque, c'est de la **conserver au fil des soumissions** et de la servir.

### ✅ La question des pièces `SUPERSEDED` — tranchée

**Les pièces `SUPERSEDED` conservent leur verdict.** Vérifié dans le code puis en base :

- `KycDocumentsService.persistAndEmit` ne touche que `status` au moment du supersede
  (`$set: { status: SUPERSEDED }`) — `reviewStatus`, `reviewedAt` et `reviewedBy` sont laissés
  intacts. C'est explicitement l'invariant de STORY-128 (« une pièce `SUPERSEDED` **garde** le
  verdict qu'elle avait ») ;
- `KycDocumentsRepository.decideOne` filtre `status: SUBMITTED`, donc un verdict d'historique est
  **hors d'atteinte** en écriture ;
- vérification docker (cycle réel) : après re-soumission, `RCCM v1 SUPERSEDED review=REJECTED` et
  `RCCM v2 SUBMITTED review=PENDING` coexistent.

**Ce qui est réellement perdu, c'est la décision AU NIVEAU DU DOSSIER**, pas la pièce :
`KycStatusService.onDocumentSubmitted` purge (`$unset`) `rejectionReason`, `reviewedAt` et
`reviewedBy` du profil à chaque re-soumission. Le motif — le seul élément qui rend la re-soumission
lisible — disparaît donc à l'instant précis où l'agent en aurait besoin.

**Conséquence sur le périmètre :** il n'y a **rien à reconstituer**, et donc rien à exposer qui
existerait déjà. Il faut **conserver** ce que la purge efface, ce qui exige un support propre :
la story livre un **journal append-only** du dossier, écrit dans la transaction de chaque transition.

---

## Périmètre

- Les **décisions passées du dossier** servies sur le détail admin : date, auteur, verdict, **motif**.
- Les événements de la chaîne KYC exposés pour la **timeline** de la fiche détail : soumission,
  passage en revue, décision.
- ⚠️ **Ne rien inventer rétroactivement.** Les dossiers déjà tranchés n'ont peut-être pas de quoi
  reconstituer leur historique : un historique vide sur un dossier ancien est **honnête**, un
  historique reconstruit à partir de `updatedAt` ne l'est pas.

- Le **relais BFF** (`admin-panel`) : la console dérive ses types du schéma OpenAPI du BFF. Un champ
  servi par `kyc-service` mais non **décrit** par le BFF traverse à l'exécution et n'existe pas pour
  le front — la moitié inerte d'un livrable. La story touche donc **2 dépôts**, sans changement de
  contrat d'événement Kafka.

### Hors périmètre

Le journal d'audit complet du service *(qui a consulté quelle pièce, quand)*. C'est une exigence de
conformité distincte, avec sa propre rétention.

Le **rendu console** (`:3110`) : le dépôt du front n'est pas dans cet espace de travail. Cf. AC-6.

---

## Critères d'acceptation

1. `GET /admin/kyc/:orgId` porte les décisions passées, de la plus ancienne à la plus récente.
2. Chaque entrée porte **date, auteur, verdict et motif** — un rejet sans motif est le cas qui rend
   l'historique inutile.
3. Un dossier jamais tranché renvoie une liste **vide**, pas une entrée fabriquée.
4. Une resoumission **conserve** l'historique de la soumission précédente.
5. Les dossiers antérieurs à cette story ne portent pas d'historique reconstitué.
6. ⚡ **Preuve navigateur depuis `:3110`** : sur un dossier resoumis, l'écran de revue affiche le
   motif du refus précédent, et la fiche détail affiche une timeline non vide.

---

## Ce qui a été livré

**Un journal append-only du dossier** — collection dédiée `kyc_dossier_events`, une ligne par
transition **réellement appliquée**.

| Élément | Où |
|---|---|
| Schéma + index `(tenantId, survenuLe, _id)` | `schemas/kyc-dossier-event.schema.ts` |
| Enum `SOUMISSION` / `RESOUMISSION` / `DECISION` | `enums/type-evenement-dossier.enum.ts` |
| Repository append-only (aucune écriture destructive) | `kyc-dossier-events.repository.ts` |
| Écriture **dans la transaction** de la transition | `kyc-status.service.ts` — `journaliserTransition` |
| Lecture + projections `decisions` / `chronologie` | `kyc-admin.service.ts` — `getDetail` |
| DTO exposés | `dto/admin-kyc-journal.dto.ts`, `dto/admin-kyc-detail.dto.ts` |
| Jeu de démonstration **re-soumis** | `kyc-dossier-seed.service.ts` |
| Relais BFF (contrat + projection Swagger, gardés à la compilation) | `admin-panel` |

### Trois décisions de conception qui portent la story

1. **Une collection à part, pas un tableau dans `TenantKycProfile`.** C'est ce profil-là que la
   re-soumission purge : y loger l'historique le rendrait dépendant du soin de chaque futur
   `$unset`. Un tableau embarqué croît par ailleurs sans plafond structurel jusqu'à la limite BSON.
2. **La date du journal n'est pas un paramètre : elle est LUE dans ce que la transition estampille**
   (`reviewedAt` ?? `submittedAt`). L'égalité journal ⇄ profil est donc *structurelle*, pas
   conventionnelle — une chronologie ne peut pas contredire le dossier qu'elle décrit. Une
   transition qui n'estamperait aucune date **lève** plutôt que de retomber sur l'heure du serveur.
3. **Le type d'événement est persisté, calculé à l'écriture.** Le re-dériver à la lecture ferait
   changer de libellé toutes les entrées passées le jour où le graphe de transitions gagne un arc —
   soit l'historique reconstruit que l'AC-5 interdit. Un arc non couvert **lève** au lieu de
   retomber sur un libellé par défaut.

## Definition of Done

- [x] Les 6 critères vérifiés (AC-6 : **partiellement** — cf. ci-dessous) · `lint` 0 warning ·
      couverture kyc-service 95,18 / 92,33 / 95,81 / 95,02 · admin-panel 99,67 / 92,80 / 100 / 99,64
- [x] Question du sort des pièces `SUPERSEDED` **tranchée et écrite** dans la story
- [x] Le jeu de données semé par `STORY-180` est **étendu** à un dossier re-soumis
- [x] Branches `MNV-183` (`kyc-service` + `admin-panel`), PR rebase-mergées sur `dev` — [kyc#16](https://github.com/MoneyVibesGroup/prospera-kyc-service/pull/16) · [admin-panel#17](https://github.com/MoneyVibesGroup/prospera-admin-panel-service/pull/17), branches supprimées
- [ ] ⚠️ **`STORY-184` reste à tirer** *(référence et n° de tentative)*. La DoD initiale demandait de
      les livrer ensemble ; ce n'est **plus bloquant dans ce sens-là** : 183 seule répond bien à la
      question (« voici ce qui a été reproché »), c'est 184 qui, seule, la poserait sans y répondre.
      L'ordre inverse aurait été le mauvais.

### ⚠️ AC-6 — la preuve navigateur n'a pas pu être faite

Le dépôt de la console (`:3110`) **n'est pas présent dans cet espace de travail** : seuls les 8
services back et le BFF y sont. Ce qui a été prouvé à la place, sur stack docker neuve
(`down -v`) et par un **cycle réel de bout en bout** (dépôt → rejet motivé → re-dépôt) :

- `GET /admin/kyc/{orgId}` sert le motif du refus précédent **alors que le profil ne le porte plus** ;
- le **BFF** (`GET /admin/orgs/{orgId}` sur `:3010`) relaie `decisions` et `chronologie` — c'est la
  source exacte dont la console dérive ses types.

Le rendu à l'écran reste donc à confirmer côté front, sans risque de contrat : les deux champs sont
publiés dans le schéma OpenAPI du BFF et gardés par les alias `Conforme<MemeForme<…>>`.

## Progress Tracking

### Vérification docker (obligatoire — la story écrit en base)

Stack **neuve** (`docker compose down -v`), `mongo/kafka/redis/minio/mailhog` + `auth-service`,
`kyc-service`, `admin-panel`. `/api/v1/health` : `mongodb: up`, `kafka: up`.

⚡ **Un défaut RÉEL, invisible aux 421 tests unitaires, a été trouvé ici.** Le semis journalisait à
chaque démarrage :

```
ERROR (113): Semis du dossier de démonstration échoué :
Updating the path 'status' would create a conflict at 'status'.
```

`status` figurait à la fois dans `$set` et dans `$setOnInsert` — Mongo refuse une mise à jour dont
deux opérateurs touchent le même chemin. Le double en mémoire du test unitaire, lui, acceptait les
deux sans broncher : **aucun test ne pouvait le voir tant qu'aucun ne mesurait l'EXCLUSIVITÉ**.
Corrigé, puis gardé par un test qui vire au rouge sous mutation (`status` remis dans les deux
opérateurs ⇒ rouge).

**Cycle réel** sur une organisation fraîchement inscrite (`6a768fc5cf985a92e8d8a251`) :

| Étape | Observé en base (`mongosh kyc_service`) |
|---|---|
| Dépôt RCCM + CFE | `SOUMISSION PENDING_DOCUMENTS→UNDER_REVIEW`, `survenuLe = 02:09:49.524Z` **identique** au `submittedAt` du profil |
| `reject` avec `If-Match` **périmé** → `409` | journal **inchangé** (1 entrée) — transaction abandonnée, aucune trace |
| `reject` motivé avec `If-Match` valide → `200` | `DECISION UNDER_REVIEW→REJECTED`, auteur = `PLATFORM_ADMIN`, motif persisté |
| Re-dépôt du RCCM | `RESOUMISSION REJECTED→UNDER_REVIEW` ; profil **purgé** (`rejectionReason`/`reviewedAt`/`reviewedBy` absents) ; `RCCM v1 SUPERSEDED review=REJECTED`, `RCCM v2 SUBMITTED review=PENDING` |
| `GET /admin/kyc/{orgId}` | `rejectionReason: null` **et** `decisions[0].motif = "Le RCCM est illisible : numero non verifiable."` → **AC-2 + AC-4** |
| `GET /admin/orgs/{orgId}` (BFF `:3010`) | `sources.kyc: ok`, `decisions` et `chronologie` relayés intégralement |
| Journal supprimé à la main, profil gardant `reviewedAt`/`reviewedBy` | `decisions: []`, `chronologie: []` → **AC-5**, aucune entrée reconstituée |

**Jeu de démonstration** (`68a1800000000000000001aa`), semé sur stack neuve puis **re-semé** au
redémarrage sans duplication : profil `UNDER_REVIEW` daté du 3 août, 3 dépôts
(`RCCM v1 SUPERSEDED/REJECTED`, `RCCM v2 SUBMITTED/PENDING`, `CFE v1 SUBMITTED/APPROVED`), journal de
3 entrées aux dates fixes. Stack arrêtée après vérification.

### Mutation-testing

Huit mutations appliquées puis restaurées, chacune vérifiée **compilante** (une mutation rouge par
erreur de compilation ne prouve rien) :

| Mutation | Résultat |
|---|---|
| Journal écrit **avant** la garde de transition conditionnelle | 🔴 « transition déjà appliquée : aucune entrée » |
| `survenuLe` retombe sur `new Date()` | 🔴 « lève plutôt que de dater du serveur » |
| Filtre `DECISION` retiré de `decisions` | 🔴 2 tests |
| Tri du journal sans départage par `_id` | 🔴 |
| `status` du semis forcé dans `$set` quel que soit l'état | 🔴 |
| Assistance OCR projetée aussi sur le dépôt remplacé | 🔴 4 tests |
| Dates du semis dérivées du boot | 🔴 2 tests (le 1ᵉʳ test « deux semis identiques » **survivait** — les constantes de module ne sont évaluées qu'une fois ; test renforcé pour nommer les horodatages attendus) |
| `decisions` retiré de la projection Swagger du BFF | 🔴 `error TS2344: Type 'false' does not satisfy the constraint 'true'` |
| `status` remis dans les **deux** opérateurs (le bug docker) | 🔴 |

### Revues (phases ⑥ / ⑦)

**Revue de code — 2 constats, tous deux non-bloquants, tous deux retenus et corrigés** (commit dédié
`ba7caf4`) :

1. *Index `{tenantId: 1}` redondant* (confiance 90) — entièrement couvert par le **préfixe** de
   l'index composé ; il ne servait aucune requête du service et se payait à chaque transition KYC.
   Retiré, et gardé par un test qui refuse tout index simple redondant.
2. *Le semis rejoué sur une base déjà semée par STORY-180 ne produit pas le jeu attendu*
   (confiance 88) — le semis est idempotent, **jamais réparateur** (`$setOnInsert`, invariant
   STORY-180 : ne pas effacer la décision d'un opérateur au redémarrage). Réaligner ces champs
   rouvrirait le défaut que STORY-180 a fermé, et la règle du projet tranche dans l'autre sens
   (« le dev repart de zéro »). Le piège étant **silencieux** — une démonstration sans `down -v`
   montrerait un dossier incohérent et l'on conclurait à un défaut de la story — il est documenté en
   tête du service, là où on le lit avant de démontrer.

**Revue de sécurité — 0 constat.** Dix pistes examinées puis écartées, dont : le repository de journal
non tenant-scoped (les deux seuls chemins d'appel dérivent l'`orgId` d'un claim JWT signé ou d'un
param déjà validé + gaté par permission) ; le motif de rejet re-servi (déjà persisté, déjà publié au
même niveau d'autorisation, déjà transporté par Kafka — la story change sa **durée de vie**, pas son
audience) ; la croissance du journal (une entrée exige un verdict d'opérateur : aucun appelant ne
peut la piloter en boucle) ; le conditionnement du semis (liste blanche `development`, placée avant
le contrôle des variables).

> ⚠️ **Signalé hors périmètre, non corrigé** : `kyc-service/src/config/configuration.ts` fait
> `process.env.NODE_ENV ?? 'development'` — un déploiement qui **omettrait** `NODE_ENV` sèmerait donc
> le dossier de démonstration. Défaut **pré-existant** (STORY-180), inchangé par cette story, qui ne
> le rend pas nouvellement exploitable. À traiter dans une story dédiée.
