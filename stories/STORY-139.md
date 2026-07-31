# STORY-139 : Suggestion de compte à partir d'un **libellé libre**, pilotée par le référentiel — service de mapping assisté pour la saisie directe (`balance-service`)

**Epic :** Atelier Balance (amont) — support de l'adaptateur `direct` (D13)
**Réf. architecture :** hub multi-source D13 ; contrat canonique STORY-101 ; paquets référentiels STORY-056 (SYSCOHADA) / STORY-057 (SFD-BCEAO) / surcharges org STORY-058
**Priorité :** Should Have (aide à la saisie ; **aucun blocage** — le front dégrade proprement, cf. Contexte)
**Story Points :** 5
**Complexité :** high
**Statut :** done
**Clôturée le :** 2026-07-29
**Assignée à :** vivianMoneyVibesGroupes
**Créée le :** 2026-07-25
**Origine :** implémentation de **FE-026** (saisie manuelle de balance) — modèle de saisie validé PO le 2026-07-25 : « on saisit le libellé + le montant, Prospera renseigne le compte » et « ne pas se limiter à SYSCOHADA : microfinance et assurance aussi ».
**Service :** `balance-service` (:3007)
**Couvre :** dette de contrat — comble le trou signalé par FE-026

> **Story de contrat/enablement, pas d'écran.** FE-026 livre la saisie directe avec un **dictionnaire `libellé → compte` intérimaire codé côté client** (`config/plan-comptes.ts`, annoté). Ce n'est **pas** faisable à la main durablement : le mapping fait autorité par **référentiel**, doit suivre les paquets versionnés (STORY-056/057) et les **surcharges par organisation**, et ne peut pas vivre en double côté front. Cette story déplace le mapping **côté serveur** — sa vraie place — et le front le consommera.

---

## User Story

En tant que **comptable qui saisit une balance à la main sans connaître les n° de compte par cœur**,
je veux que **Prospera me propose le compte à partir du libellé que je tape, selon le référentiel de mon organisation**,
afin de **produire une balance canonique correcte sans mémoriser le plan SYSCOHADA / SFD / CIMA.**

---

## Contexte

Le **sens de mapping est inverse** de celui déjà packagé. Les stories existantes vont **compte → poste d'état** (STORY-055 table de passage, longest-prefix, pour le Bilan). Ici on a besoin de **libellé libre → compte**, pour **assister la saisie** en amont. Rien ne le couvre aujourd'hui.

Le référentiel **pilote** le résultat : le même libellé donne un compte différent en SYSCOHADA et dans le plan SFD (BCEAO). Le mécanisme doit être **le même pour tous les référentiels** — SYSCOHADA (SN/SMT), **SFD-BCEAO** (microfinance, déjà packagé STORY-057), et **CIMA (assurance)** dès que ce référentiel entrera dans l'enum `REFERENTIELS_BALANCE`.

**Le front n'est pas bloqué sans cette story :** FE-026 fonctionne avec son dictionnaire client (aide à la saisie ; l'utilisateur corrige ; le serveur reste seul juge du compte via le validateur `^[0-9A-Za-z]{3,20}$`). Mais ce dictionnaire est **plausible, pas opposable** et **duplique** une connaissance qui appartient aux paquets référentiels.

---

## Périmètre

**Inclus**
- Endpoint gardé (`@RequiresBalanceAccess`) exposant une **suggestion de compte** pour un **libellé libre**, **résolue selon le référentiel actif de l'org** (comme `GET /referentiels/actifs`). Forme retenue : batch `POST /balances/suggest-comptes` avec une liste de libellés.
- Résolution **dérivée des paquets référentiels versionnés** (STORY-056/057) et **des surcharges d'organisation** (priorité surcharge > paquet), pas d'une table ad hoc.
- Correspondance **déterministe et traçable** : normalisation du libellé, correspondance exacte puis approchée (recouvrement de tokens significatifs), **checksum/version du paquet** dans la réponse (cohérence avec le reste de l'Atelier).
- Réponse **par libellé** : compte proposé (ou aucun), + score/motif. **Jamais** d'invention : sans correspondance, on renvoie « à préciser », pas un compte au hasard.
- Réponse **non autoritaire** assumée : le validateur de soumission (STORY-101) reste seul juge du compte final.

**Hors périmètre**
- L'**apprentissage** des surcharges depuis les saisies passées (proposé → validé) : réutiliser le mécanisme de surcharge existant tel quel, pas de ML.
- L'ouverture du référentiel **CIMA** : le mécanisme doit l'accueillir, mais packager CIMA est une story de paquet distincte.
- L'**élargissement du chemin d'écriture** des surcharges de rattachement (aujourd'hui restreint à la classe 7, cf. **D-139-3**) : hook inerte documenté, story distincte.
- Le **retrait effectif** de `config/plan-comptes.ts` côté FE-026 : dépôt frontend distinct, traité par un **ticket de suivi** (cf. AC-6 et `TICKET-fe-026-retrait-dictionnaire-client.md`).

---

## Décisions de conception

### D-139-1 — La source du mapping est le `planDeComptes` du paquet, lu **à l'envers**

Aucune table `libellé → compte` n'est écrite dans le code ni en base. L'index est **dérivé** du `planDeComptes` déjà porté par chaque artefact référentiel (`{ numero, libelle, classe }`, STORY-078) : on indexe le **libellé normalisé de chaque compte** vers son numéro.

Conséquence directe, et c'est tout l'intérêt : **CIMA fonctionnera sans une ligne de code**, du jour où son paquet sera publié. Une table ad hoc aurait exigé une release par référentiel — exactement ce que le périmètre interdit.

L'index est **mémoïsé par checksum de paquet** : il se reconstruit uniquement quand l'artefact change, jamais par requête.

### D-139-2 — Les surcharges d'organisation sont celles de `balance-service` (`surcharges_rattachement`), **pas celles de STORY-058**

Le cadrage renvoyait à **STORY-058**. Vérification faite, ses surcharges vivent dans **`bilan-service`** (collection `mapping_overrides`) et portent `compte → poste d'état` : **l'autre sens du mapping**, dans **la base d'un autre service**. Les lire depuis `balance-service` violerait l'invariant « une base Mongo par service, aucune requête cross-service ».

Le magasin correct existe déjà **localement** : `surcharges_rattachement` (STORY-085), clé `(orgId, type, valeur normalisée) → compte`, avec `type = 'LIBELLE'`. C'est **exactement** `(org, libellé) → compte`, tenant-scopé, tracé (`parUserId`, `le`), avec index unique. **AC-3 s'appuie dessus.**

Cette story ne fait que le **lire** (`RattachementService.chargerSurcharges`) : aucune écriture, aucun nouveau schéma, aucune seconde source de vérité.

### D-139-3 — Une surcharge dont le compte n'est plus au plan est **ignorée**, pas appliquée

Reprise à l'identique de la règle de STORY-085 : une règle écrite il y a six mois qui pointe un compte disparu du référentiel courant est **écartée au profit du paquet**, et la règle **reste en base** (c'est à l'humain de la corriger, pas au système de la supprimer dans son dos).

⚠️ **Hook inerte documenté** : le chemin d'**écriture** des surcharges (`PUT /rattachement/surcharges`) refuse aujourd'hui tout compte hors **classe 7** (`estCompteDeProduits`, contrainte du cahier de recettes). Une organisation ne peut donc pas encore poser de surcharge sur un compte de classe 1 à 6. La **lecture** faite ici n'a aucune restriction de classe : le jour où l'écriture sera élargie, la suggestion en bénéficiera sans modification. **Hors périmètre de 139.**

### D-139-4 — Trois origines, dans cet ordre, jamais mélangées

| Origine | Règle | Score |
|---|---|---|
| `SURCHARGE` | égalité **exacte** sur la clé normalisée (`cleSurcharge`, la même qu'à l'écriture) | `1` |
| `EXACT` | le libellé normalisé **est** celui d'un compte du plan | `1` |
| `APPROCHANT` | recouvrement de **tokens significatifs** ≥ seuil | score calculé |
| `AUCUN` | rien au-dessus du seuil ⇒ **`compte: null`**, motif « à préciser » | `0` |

La comparaison exacte n'est **jamais** un `includes` : une règle « vente » qui capturerait « avenant vente immeuble » rattacherait une cession d'immobilisation à un compte de ventes, en silence (rationnel repris de STORY-085).

**Mesure approchée** — Jaccard **pondéré par la longueur des tokens** sur les tokens significatifs (mots vides français retirés, pluriels `-s`/`-x` élagués au-delà de 4 caractères) :
`score = Σ|tokens communs| / Σ|tokens de l'union|`. Une mesure unique, explicable et déterministe, qui vaut `1` sur un ensemble de tokens identique (« Achat marchandise » → `601`, « Banque » → `52`).
**Seuil = 0,5** (inclusif), constante nommée et exportée. Calibré sur les deux plans réels : au-dessous, on laissait passer des rapprochements faibles (`Amortissements` → `761` en SFD, 0,38) ; au-dessus, on perdait des rapprochements justes (`Caisse` → `10` « Valeurs en caisse » en SFD, 0,50).

### D-139-5 — L'ambiguïté ne se tranche **jamais** à pile ou face

Le plan SFD-BCEAO porte **9 libellés en double** (`Banques et correspondants` = `114` **et** `154` — l'actif et le passif). Retenir l'un des deux « parce qu'il vient en premier » serait faux une fois sur deux, en silence.

- Si l'un des comptes candidats est **préfixe strict de tous les autres** (un poste et ses subdivisions portant le même libellé : `Ventes` = `71` + `711`), on retient le **parent** — le choix agrégé, pas un tirage.
- Sinon ⇒ **aucun compte proposé**, `origine: 'AUCUN'`, et les candidats sont rendus dans `alternatives` pour que l'humain tranche.

### D-139-6 — Le lot préserve l'ordre **et** ré-émet le libellé soumis

Une réponse appariée **par index** est un piège déjà payé en STORY-084 (lignes rejetées retirées avant insertion ⇒ audit désignant la mauvaise pièce). Ici : autant d'éléments en sortie qu'en entrée, **dans l'ordre**, chacun portant le `libelle` tel que soumis. Les doublons d'entrée ne sont **pas** dédupliqués — dédupliquer casserait l'appariement.

### D-139-7 — AC-2 recalé sur les plans **réellement packagés**

Le cadrage illustrait AC-2 par « Banque » → `521` (SN) / `111` (SFD). Ces numéros **n'existent dans aucun des deux artefacts livrés** : le plan SYSCOHADA packagé s'arrête à `52 Banques`, et le plan SFD porte `114/154 Banques et correspondants` (donc **ambigu**, cf. D-139-5). Un critère invérifiable contre la donnée réelle est un critère mort.

AC-2 est recalé sur un couple **vérifié dans les deux artefacts, exact et unique des deux côtés** :
**« Charges de personnel » → `66` (SYSCOHADA révisé 2.1) / `64` (SFD-BCEAO 2.0)**. L'intention du critère — *même libellé, compte différent, piloté par le référentiel actif de l'org* — est intégralement conservée.

---

## Critères d'acceptation

1. Pour un référentiel donné, un libellé courant renvoie le compte attendu (**« Achats de marchandises » → `601`** en SYSCOHADA) ; un libellé inconnu renvoie **aucune** proposition (`compte: null`, pas un compte inventé).
2. Le **même** libellé mappe un compte **différent** selon le référentiel (**« Charges de personnel » → `66` SYSCOHADA / `64` SFD**, cf. **D-139-7**) — piloté par le référentiel **actif de l'org**, pas par un paramètre libre.
3. Une **surcharge d'organisation** (`surcharges_rattachement`, type `LIBELLE`, cf. **D-139-2**) **prime** sur la proposition du paquet.
4. La réponse porte la **version/checksum** du paquet référentiel ayant servi (traçabilité, cohérence Atelier).
5. Endpoint **gardé** : sans accès balance, **403** (mêmes motifs que le reste de l'Atelier).
6. Contrat OpenAPI publié ; **ticket de suivi FE-026** ouvert pour le retrait de `config/plan-comptes.ts` (dépôt frontend distinct, cf. Hors périmètre).

---

## Definition of Done

- [x] 6 critères d'acceptation validés ; tests (résolution par référentiel, surcharge prioritaire, libellé inconnu, ambiguïté non tranchée, gate 403).
- [x] Résolution branchée sur les **paquets référentiels versionnés** + **surcharges org**, pas de table ad hoc.
- [x] OpenAPI à jour ; ticket de suivi FE-026 pour retirer le dictionnaire client référencé.
- [x] `lint` / `build` / `test:cov` (≥ 65/90/90/90) / `test:e2e` verts.
- [x] Vérification docker réelle (endpoint appelé sur stack, surcharge posée en base et vue primer sur le paquet).

---

## Tasks

- [x] Règles **pures** de suggestion (`suggestion.regles.ts`) : normalisation, tokens significatifs, index inverse, score, arbitrage d'ambiguïté.
- [x] Registre d'index mémoïsé par checksum de paquet.
- [x] `SuggestionService` : résolution référentiel de l'org + chargement des surcharges + application des règles.
- [x] `SuggestionController` — `POST /api/v1/balances/suggest-comptes`, gardé, DTO whitelistés + Swagger.
- [x] `SuggestionModule` câblé dans `app.module.ts`.
- [x] Tests unitaires (règles, service, contrôleur) + e2e (contrat HTTP + 403).
- [x] Mutation-tests sur les critères qui protègent d'une régression précise.
- [x] Ticket de suivi FE-026.

---

## Progress Tracking

| Phase | État | Note |
|---|---|---|
| Cadrage (①) | ✅ 2026-07-29 | Décisions D-139-1 → D-139-7 ; AC-2 recalé sur les artefacts réels ; STORY-058 écartée au profit de `surcharges_rattachement` (invariant « une base par service »). |
| Développement (③) | ✅ 2026-07-29 | Module `suggestion` (règles pures + registre mémoïsé + service + contrôleur + DTO), câblé dans `app.module.ts`. Aucun schéma, aucune écriture. |
| Validation (④) | ✅ 2026-07-29 | Portes DoD + mutation-tests + **vérification docker réelle** (ci-dessous). |
| Revue de code (⑥) | ✅ 2026-07-29 | **3 constats corrigés** (commit dédié `MNV-139(revue)`), vérification docker **rejouée** sur l'état final. |
| Revue de sécurité (⑦) | ✅ 2026-07-29 | **Aucune vulnérabilité exploitable.** Compte rendu publié sur la PR #17. |
| Intégration (⑧) | ✅ 2026-07-29 | PR **#17** rebase-mergée sur `dev`, branche supprimée. |

### Revue de code — constats traités

| # | Constat | Correction |
|---|---|---|
| R1 | Une règle d'organisation posée sur un libellé de **ponctuation** (« ++ ») n'était **jamais appliquée** : `cleSurcharge` conserve la ponctuation, `normaliserLibelle` la retire, et le garde-fou du libellé vide s'exécutait **avant** la recherche de règle. Reproduit sur la stack docker avant correction. | Le bloc « règle de l'organisation » passe **avant** le garde-fou de vacuité. Revérifié sur la stack : la règle est désormais honorée. |
| R2 | Deux candidats portant le **même numéro de compte** étaient comptés comme une ambiguïté ⇒ refus d'une proposition pourtant déterminée. Non atteignable sur les artefacts livrés (aucun numéro dupliqué), donc silencieux jusqu'au jour d'un paquet qui le ferait. | Dédoublonnage par numéro **avant** arbitrage. |
| R3 | La collecte des ex æquo testait la stricte supériorité **avant** l'égalité : un candidat supérieur d'un milliardième au meilleur ne satisfaisait aucune des deux branches et **disparaissait** — on aurait proposé un compte là où deux se valaient, contre D-139-5. | Égalité testée d'abord ; les scores non positifs sont écartés en tête de boucle. |

**Rien n'a été laissé de côté.** 3 tests ajoutés ; couverture du module toujours à 100 %.

### Revue de sécurité — sans vulnérabilité

Périmètre : authentification, autorisation, injection, web, fichiers, cryptographie, infrastructure, logique métier, spécificités NestJS. Points saillants : `orgId` **exclusivement** issu du JWT et aucun DTO n'en accepte ; chaîne de guards complète et **mutation-prouvée** ; aucun libellé soumis n'atteint une requête Mongo (mise en correspondance en mémoire) ; aucun chemin construit depuis une entrée client ; travail borné (`ArrayMaxSize(200)` sous throttler) et cache d'index clé par checksum d'artefact **serveur** ; endpoint en lecture seule ; aucun secret introduit.

### Portes de qualité (2026-07-29)

`lint` 0 warning · `build` OK · couverture globale **98,76 / 91,72 / 98,13 / 98,80** (seuils 65/90/90/90), module `suggestion` à **100 %** sur les 4 axes · **1 208** unitaires verts · **258** e2e verts (dont 19 pour cette story) · aucune régression.

### Mutation-tests — ce qui prouve que les tests filtrent

Un critère qu'un code bugué franchit ne prouve rien. Sept mutations volontaires, chacune restaurée après contrôle :

| # | Mutation appliquée | Résultat |
|---|---|---|
| M1 | la surcharge `LIBELLE` n'est plus consultée (type inversé) | **6 rouges** |
| M2 | l'ambiguïté est tranchée « le premier venu » | **2 rouges** |
| M3 | `@RequiresBalanceAccess()` retirée du contrôleur | **e2e KYC rouge** |
| M3b | `@Roles(TENANT_ADMIN, TENANT_USER)` retiré | **e2e PLATFORM_ADMIN rouge** |
| M4 | index mémoïsé sur `(code, version)` au lieu du checksum | **1 rouge** |
| M5 | élagage du pluriel retiré | **6 rouges** |
| M6 | `SEUIL_APPROCHANT` ramené à `0` | **2 rouges** |

⚠️ **M3b a d'abord été VERT** — aucun test ne prouvait `@Roles`. Le test « PLATFORM_ADMIN porteur d'une org habilitée → 403 » a été **ajouté** pour combler ce trou : le cas `PLATFORM_ADMIN` déjà présent passait pour une autre raison (jeton sans organisation ⇒ refus de la gate d'entitlement), il ne testait donc pas le RBAC.

Note tirée de M3 : retirer la gate ne rend **pas** rouge le cas « entitlement révoqué » — `ReferentielResolver` refuse aussi, en défense en profondeur. C'est le cas **KYC** qui prouve réellement la gate.

### Vérification docker réelle (2026-07-29) — stack neuve après `down -v`

`mongo` + `kafka` + `redis` + `auth-service` + `balance-service`, `/health` à `{mongodb: up, kafka: up}`. Organisation amorcée par `register` sur l'IdP (`6a69b0de…3546`), read-models posés à la main (`orgkycstatuses` / `orgbalanceentitlements` — **noms Mongoose par défaut**, pas de `@Schema({collection})`).

| # | Ce qui est prouvé | Résultat |
|---|---|---|
| 1 | **AC-5** avant amorçage : gate fermée | `403 KYC_NOT_APPROVED` |
| 2 | **AC-1 / AC-4** sur l'artefact SYSCOHADA réel | `Achats de marchandises → 601` (EXACT) · `Banque → 52` (APPROCHANT, pluriel élagué) · `xyzzy → null` · checksum `01b892c0…` + `stamp` complets |
| 3 | **AC-3** : règle posée par le **vrai** endpoint d'écriture (`PUT /rattachement/surcharges`), document lu en base, puis appliquée | `Travaux de construction → 705` (SURCHARGE), y compris sur la variante `«  TRAVAUX   DE  CONSTRUCTION »` (clé normalisée identique à l'écriture) ; et `Achats de marchandises → 706`, **la règle primant sur la correspondance exacte du plan** |
| 4 | **AC-2** : bascule du référentiel de l'org en base | `Charges de personnel → 64` en `sfd-bceao@2.0` (checksum `ee9bf014…`), `→ 66` de retour en `syscohada-revise@2.1` (checksum `01b892c0…`) — **même libellé, deux comptes, deux checksums** |
| 5 | **D-139-5** sur donnée réelle | `Banques et correspondants` en SFD ⇒ `compte: null` + `alternatives: [114, 154]` |
| 6 | **Isolation tenant** | une 2ᵉ organisation ne voit **aucune** des 2 règles de la 1ʳᵉ (`Travaux de construction → null`, `Achats de marchandises → 601` du plan) ; `surcharges_rattachement` groupé par `orgId` ne porte qu'un seul groupe |
| 7 | **AC-6** : contrat publié | `/api/docs-json` expose `POST /api/v1/balances/suggest-comptes`, tag `suggestion`, réponses `200/400/403/409/502/503`, schémas `SuggestComptesResponseDto` / `SuggestionCompteDto` |
| 8 | Bornes du contrat sur la vraie stack | `{}`, `libelles: []`, champ additionnel `referentiel`, `libelles: [123]`, 201 éléments ⇒ **400** ; 200 éléments ⇒ **200** |
| 9 | **Lecture seule** | comptes de **toutes** les collections identiques avant/après 3 appels — l'endpoint n'écrit rien |

---

## Notes

- Créée le 2026-07-25 depuis l'implémentation de **FE-026**. Le dictionnaire intérimaire à remplacer vit dans `prospera-frontend-expert-comptable/src/features/atelier/config/plan-comptes.ts` (annoté « INTÉRIMAIRE » avec renvoi à cette story). Ce dépôt n'est **pas** présent dans le workspace : le retrait est porté par un ticket de suivi.
