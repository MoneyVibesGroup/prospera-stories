# STORY-180 : Semer un **dossier KYC en revue** — l'écran central d'AP-03 n'est vérifiable par personne

**Epic :** EPIC-003 — KYC (`kyc-service`)
**Réf. :** ticket §B · **AP-03** · **STORY-178** *(même défaut, autre objet : le seed de l'administrateur)* · **STORY-179** *(URL présignée joignable)*
**Découverte par :** AP-INT-1, en écrivant les e2e de la revue KYC
**Priorité :** Must Have — ⚡ **bloque la vérification, pas le code**
**Story Points :** 3
**Complexité :** medium
**Statut :** in_progress
**Créée le :** 2026-08-04
**Démarrée le :** 2026-08-07
**Sprint :** 20
**Service :** `kyc-service` (`:3002`) **+ `auth-service` (`:3001`)** · **cible réelle : `OPS`**

---

## Le constat

`kyc-service` n'a **aucun répertoire de seeds**. `auth-service`, lui, en a un
*(`src/seeds/seed-platform-admin.ts`)*, et `STORY-178` s'apprête à le brancher au démarrage — mais
elle ne sème **que l'administrateur**, c'est-à-dire de quoi **se connecter** à une console qui n'a
**rien à montrer**.

**Conséquence :** sur une stack fraîche, `GET /api/v1/admin/kyc?status=UNDER_REVIEW` renvoie une
liste vide. La file est vide, aucune revue ne s'ouvre, et **l'écran le plus important de la console
n'a jamais été vu fonctionner de bout en bout** — ni par un développeur, ni par un testeur, ni par le PO.

> ⚡ **Un aveu est déjà écrit dans le code livré.** Trois tests d'`e2e/integration-gate.spec.ts` se
> mettent en `test.skip` faute de dossier. Un test qui se saute n'est pas un test qui passe : c'est
> un trou qui se présente comme une couverture, et c'est la pire des deux situations — la suite est
> verte.

## Pourquoi ce n'est pas « juste des données de test »

Trois défauts d'AP-03 ont vécu des semaines **parce qu'aucun dossier n'existait pour les révéler** :
un chemin d'API faux *(404 sur toutes les revues)*, une détection de 404 sur un champ inexistant, et
une visionneuse qui dessinait un document au lieu de l'afficher. Aucun n'a été trouvé par les tests
unitaires ; tous auraient été trouvés en ouvrant **un** dossier.

---

## ⚡ Arbitrage rendu au lancement — 2026-08-07 : la story touche **deux dépôts**

**Le fait qui tranche, mesuré et non supposé.** Le critère nº6 exige d'**ouvrir** un dossier depuis la
console. Or la console n'ouvre pas un dossier par `kyc-service` : elle passe par le BFF
`GET /admin/orgs/:orgId`, et là `auth` est la **dépendance dure** —
`org-aggregation.service.ts:274-277` : « *Identité = dépendance dure : 404 → 404 (anti-énumération),
sinon 503* ». Un dossier semé pour un `orgId` que `auth-service` ne connaît pas est donc **listé mais
inouvrable** : la file affiche une ligne *sans raison sociale* (`listKycReviews` ne joint le nom
qu'en **enrichissement dégradable**, `org-aggregation.service.ts:156-163`), et le clic renvoie **404**.

Semer le dossier seul reproduirait donc, un cran plus loin, exactement le défaut que la story ferme :
**un écran qu'on croit vérifiable et qui ne l'est pas.**

Et l'organisation ne peut pas être semée depuis `kyc-service` : *une base Mongo par service*, aucune
écriture cross-service. Elle est semée par son **propriétaire**, `auth-service`.

⇒ **Deux dépôts, deux branches `MNV-180`, deux PR, intégrées ensemble** — le patron déjà appliqué aux
changements de contrat d'événement. Ici le « contrat » est plus simple et plus dur : **les identifiants
fixes** (`DEMO_ORG_ID`, `DEMO_ORG_OWNER_ID`), passés aux deux services par le compose. Les deux seeds
convergent vers les mêmes `ObjectId` ou ne se rencontrent jamais.

| Dépôt | Ce qu'il sème | Pourquoi lui |
|---|---|---|
| `auth-service` | l'**organisation** de démonstration, son **utilisateur propriétaire** (e-mail vérifié) et le **membership** `TENANT_ADMIN` | il **possède** les identités — c'est la seule base où elles peuvent s'écrire |
| `kyc-service` | le **dossier** `UNDER_REVIEW`, ses **deux pièces** (objets MinIO **réels** + métadonnées) et l'**assistance OCR** portant l'écart | il possède le KYC (source de vérité, STORY-020) |

### Trois pièges relevés à la lecture, avant d'écrire une ligne

- ⚠️ **`kyc-service` exclut `!**/seeds/**` de `collectCoverageFrom`** (`package.json`) — alors qu'il n'a
  aucun répertoire `seeds/`. Y déposer le seed le rendrait **invisible aux seuils** : la logique
  d'idempotence et de conditionnement passerait les portes DoD sans qu'une seule ligne soit exécutée.
  C'est le jumeau exact de l'angle mort `*bootstrap*` (bugs du round-trip Kafka, STORY-076/108), et
  `PlatformRolesSeedService` en avait déjà tiré la leçon *dans son propre en-tête*. ⇒ le seed vit dans
  `src/modules/kyc/`, nommé `*-seed.service.ts` — **jamais** `seeds/`, **jamais** `*bootstrap*`.
- ⚠️ **L'objet d'abord, la métadonnée ensuite.** La story l'exige au titre du diagnostic (« des
  métadonnées sans objet donneraient le symptôme de `STORY-179` sans en être la cause ») — c'est donc un
  **ordre d'écriture**, pas une intention : si le dépôt MinIO échoue, la pièce **n'est pas** inscrite en
  base. L'invariant est testable, et il est testé.
- ⚠️ **`StorageBootstrapService` crée le bucket au boot**, également en `OnApplicationBootstrap`. L'ordre
  vient de l'ordre d'`imports` d'`app.module.ts` (`StorageModule` avant `KycModule`) : c'est vrai, mais
  ce n'est pas un contrat. Le seed ne s'y fie pas — il échoue **proprement** (avertissement, boot
  poursuivi, aucune métadonnée écrite) si le bucket n'est pas là.

### Ce que cet arbitrage ne règle **pas** — et qui n'est pas de cette story

- **`STORY-178` reste requise** et n'est **pas** absorbée ici : brancher `seedPlatformAdmin` au démarrage
  est son périmètre entier. Tant qu'elle n'est pas faite, le « **sans aucune commande manuelle** » du
  critère nº6 vaut pour **le dossier**, pas pour l'administrateur qui le regarde — la vérification
  passera par `npm run seed:admin`, et le dira.
- **Le dépôt de la console front est absent de l'espace de travail** (déjà constaté en `STORY-179`). Les
  trois `test.skip` d'`e2e/integration-gate.spec.ts` y vivent : ils sont **hors d'atteinte depuis ces deux
  dépôts**. La preuve navigateur les remplace, et l'item de DoD est transmis au front.

---

## Périmètre

Un seed **idempotent**, sur le patron de `seedPlatformAdmin` *(`upsert`, journalisation explicite
« créé » / « retrouvé »)*, produisant au minimum :

1. une **organisation** et son dossier KYC au statut **`UNDER_REVIEW`** ;
2. ses **deux pièces** (`RCCM`, `CFE`) — ⚡ **réellement déposées dans le bucket MinIO** ;
3. une **extraction OCR** portant un **écart déclaré ↔ lu** sur le numéro d'immatriculation.

### Trois exigences qui ont l'air décoratives et ne le sont pas

- ⚠️ **Les fichiers doivent exister dans le bucket.** Des métadonnées sans objet produiraient des
  URL présignées **valides pointant vers le vide** : c'est-à-dire le symptôme exact de `STORY-179`,
  sans en être la cause. Les deux se confondraient au diagnostic, et on « corrigerait » 179 sans
  jamais voir un document.
- ⚠️ **L'écart OCR est le seul cas qui démontre la confrontation** — et avec elle l'invariant
  **`DO-1`** *(l'OCR assiste, il ne décide pas)*. Un jeu de données où tout concorde ne prouve que le
  cas où l'écran n'a rien à dire.
- ⚠️ **Deux pièces, pas une** : la consolidation d'un dossier *(« on ne soumet que lorsque chaque
  pièce présente est marquée »)* est inobservable sur une pièce unique.

### Hors périmètre

Un jeu de données exhaustif *(dossier dégradé, pièce illisible, resoumission…)*. Un cas nominal
**complet** vaut mieux que six cas partiels : c'est le nominal qui est aujourd'hui invérifiable.

**Ajouts au hors-périmètre, tranchés au lancement :**

- ⛔ **Aucun événement émis par les seeds** — ni `identity.*` côté `auth`, ni `kyc.status.changed` côté
  `kyc`. Un seed écrit un **état de démonstration** ; il ne rejoue pas un cycle de vie. Conséquence
  assumée et **explicite** : l'organisation de démonstration n'apparaît dans **aucun read-model** de
  vertical (`expert-comptable` n'en saura rien), et son statut KYC n'y est pas répliqué. C'est sans effet
  sur l'objet de la story — la console d'administration lit `auth` et `kyc` **en direct**, jamais un
  read-model de vertical. Émettre depuis un seed exigerait outbox + transaction dans les deux services,
  pour alimenter des écrans qui ne sont pas ceux qu'on cherche à rendre vérifiables.
- ⛔ **Le branchement au boot de `seedPlatformAdmin`** → `STORY-178`, intacte.
- ⛔ **Le semis du catalogue** (module + version ACTIVE + référentiel) → story distincte, déjà identifiée
  dans l'action de `GAP-aucun-seed-de-donnees-de-demonstration`.

---

## Critères d'acceptation

1. Sur base **vierge**, `GET /admin/kyc?status=UNDER_REVIEW` renvoie au moins un dossier.
2. Rejouable : deux démarrages consécutifs ne créent ni doublon ni seconde pièce.
3. Les deux pièces sont **téléchargeables** par leur URL présignée *(⚠️ dépend de `STORY-179` pour
   l'être depuis un navigateur — ici, le service suffit)*.
4. L'extraction porte un écart nommé dans `discrepancies`, et les valeurs `declared`/`extracted`
   diffèrent réellement.
5. ⚠️ **Rien n'est semé hors développement** : le seed est conditionné comme celui de
   l'administrateur, et un environnement sans les variables démarre normalement, avec un
   avertissement.
6. ⚡ **Preuve navigateur depuis `:3110`** : `docker compose down -v` puis `up`, se connecter,
   ouvrir la file KYC, **ouvrir un dossier et voir ses deux pièces**, sans aucune commande manuelle.

---

## Definition of Done

- [ ] Les 6 critères vérifiés · `lint` 0 · couverture ≥ 90 %
- [ ] ⚡ **Vérifié sur volume vierge** — sur une base déjà peuplée, ce défaut ne se manifeste pas
- [ ] Les trois `test.skip` d'`e2e/integration-gate.spec.ts` **s'exécutent** au lieu de se sauter
- [ ] À tirer **avec `STORY-179`** : sans elle, on sème des pièces qu'on ne peut toujours pas voir
      *(✅ `STORY-179` est **done** depuis le 2026-08-07 — la précondition est levée)*
- [ ] Branches `MNV-180` **sur les deux dépôts**, deux PR rebase-mergées sur `dev` **ensemble**

---

## Progress Tracking

*(rempli au fil des phases — état trouvé, livrables, portes DoD, mutations, vérification docker,
revues, clôture)*

### Démarrage 2026-08-07 — état trouvé

- `kyc-service` : **aucun** répertoire de seed (confirmé), aucun hook de semis. Le seul
  `OnApplicationBootstrap` du service est `StorageBootstrapService` (création du bucket).
- `auth-service` : `seedPlatformAdmin` existe et reste un **script autonome que personne n'appelle**
  (`grep seedPlatformAdmin src/` = ses propres définitions et rien d'autre) — `STORY-178` toujours
  `not_started`. Les **rôles**, eux, sont bien semés au boot (`PlatformRolesSeedService`), qui sert de
  patron de référence.
- La file `UNDER_REVIEW` est donc vide sur toute stack fraîche, et le dossier n'est **ni listable ni
  ouvrable** : les deux moitiés du défaut, dans deux dépôts.
