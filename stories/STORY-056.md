# STORY-056 : Paquet référentiel SYSCOHADA révisé — **plan de comptes** intégré au paquet (versionné + checksum), cohérence plan ⊇ table de passage — FR-007

**Epic :** EPIC-010 — Référentiels & table de passage (bilan-service)
**Service :** `bilan-service` (relying party, :3004, base `bilan_service`)
**Réf. PRD :** `docs/prd-bilan-service-2026-07-10.md` §FR-005 (chargement du référentiel : « plan de comptes, table de passage, règles »), §FR-007 (multi-référentiel versionné)
**Réf. architecture :** `docs/architecture-bilan-service-2026-07-07.md` §Interface de référentiel / §ReferentielLoader (P7/D10 : code ⊥ référentiel) ; `docs/referentiels/README.md` (provenance des amorces 2026-07-12)
**Réf. code livré :** STORY-038 (squelette : `ReferentielPackage`, `ReferentielLoader`, `ReferentielRegistry`, artefact pilote) · STORY-054 (garde ACTIVE + `EffectiveReferentielStamp`) · STORY-055 (moteur de table de passage `TableDePassageService.mapComptes`, longest-prefix)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** done ✅ (implémentée + vérifiée docker + revue + intégrée dans `dev` le 2026-07-18 — PR #7 bilan-service, MNV-056 rebase-merge)
**Assigné à :** vivian
**Créée :** 2026-07-18
**Sprint :** 11

---

## User Story

**En tant qu'**opérateur du référentiel PROSPERA (et, en aval, moteur d'états financiers),
**je veux** que le paquet `syscohada-revise@2.1` embarque le **plan de comptes normalisé** SYSCOHADA révisé — en plus de la table de passage déjà présente — comme donnée **versionnée et vérifiée par checksum**,
**afin que** le référentiel soit **complet** au sens de FR-005 (plan de comptes **+** table de passage + règles) et qu'aucune règle de passage ne référence un compte absent du plan (paquet **cohérent**, prêt pour la production d'états d'EPIC-011).

---

## Description

### Contexte & re-cadrage (⚠️ lire avant de coder)

Cette story a été **planifiée** (sprint-planning 2026-07-07/10) **avant** que le squelette (STORY-038) et EPIC-010 amont (054/055) ne soient livrés. Cadrée aujourd'hui **contre le code réel**, son périmètre se **réduit** à un delta précis. État vérifié le 2026-07-18 :

- Le paquet embarqué `src/modules/bilan/referentiel/assets/syscohada-revise-2.1.json` porte déjà : `meta`, `regles` (5), **`postes` (163)**, **`tableDePassage` (99)**, `paquetFiscal`. Il est **chargé, vérifié (sha256) et caché** par le `ReferentielLoader` (038) et son mapping est **appliqué** par `TableDePassageService.mapComptes` (055, longest-prefix).
- **Il n'y a AUCUN plan de comptes** dans le paquet ni dans les sources (`scripts/referentiels/sources/` = postes + table de passage + fiscal ; `docs/referentiels/` idem). Or FR-005 **et** l'architecture (§Interface de référentiel, ligne 138) définissent explicitement le référentiel comme **« plan de comptes + mapping des états + règles de présentation »**. Les **155 préfixes** de comptes n'existent aujourd'hui **que** comme chaînes dans `tableDePassage[].comptesSyscohada`, **sans catalogue de comptes** derrière.
- Le checksum attendu de l'artefact n'est codé en dur qu'à **un seul endroit** : `ReferentielRegistry` (`4ced8658…`).

**Le delta réel de STORY-056** = **constituer le plan de comptes SYSCOHADA révisé** (catalogue normalisé) et l'intégrer comme **partie première-classe, versionnée et checksummée** du paquet `syscohada-revise@2.1`, avec un **contrôle de cohérence** garantissant que la table de passage ne référence que des comptes couverts par le plan — **sans casser** 054/055. C'est une story **données + contrat de paquet**, pas une story de calcul d'états.

### Problème résolu

Sans plan de comptes, le paquet est **incomplet** au regard de FR-005 : rien ne garantit que les comptes de la table de passage appartiennent au référentiel, et EPIC-009 (import balance) / EPIC-011 (production d'états) ne disposeront d'aucun catalogue pour (a) signaler un **compte hors plan** à l'import, ni (b) présenter les **libellés de comptes** dans les états. Cette story pose ce catalogue et le rend cohérent avec la table de passage existante.

### Provenance des données

Plan comptable **normalisé SYSCOHADA révisé (AUDCIF 2017, Système Normal)** — même source réglementaire que la liasse GUIDEF déjà extraite (`docs/referentiels/README.md`). Périmètre de constitution : **classes 1 à 8** + les **comptes principaux** (2–3 chiffres) qui **couvrent au moins les 155 préfixes** déjà référencés par la table de passage. **Statut « amorce à valider par un expert »** conservé (aligné sur le README de provenance et l'*open question* #2 du PRD : « qui fournit/valide le plan de comptes normalisé »).

---

## Scope

**Dans le périmètre :**

- Constitution du **plan de comptes** SYSCOHADA révisé comme source de provenance (`docs/referentiels/plan-comptable-syscohada.{json,csv}`) **et** source de build (`scripts/referentiels/sources/plan-comptable-syscohada.json`).
- Extension **du contrat** `ReferentielPackage` avec `planDeComptes: CompteReferentiel[]` (champ additif — le contrat est explicitement extensible, cf. en-tête de `referentiel-package.interface.ts`).
- Extension **déterministe** de `scripts/referentiels/build.mjs` : consolider le plan de comptes dans l'artefact (ordre de clés **figé**), régénérer `syscohada-revise-2.1.json`, imprimer le nouveau sha256.
- **Mise à jour du checksum** de `syscohada-revise@2.1` dans `ReferentielRegistry` (nouvelle valeur = sha256 du nouvel artefact).
- Exposition de `planDeComptes` par le `ReferentielLoader` (`parse()` : `planDeComptes: pkg.planDeComptes ?? []`, tolérant) + ligne de log enrichie (`plan=…`).
- **Contrôles de cohérence** (tests sur l'artefact réel embarqué — voir AC) : plan bien formé, **plan ⊇ comptes de la table de passage** (0 mapping orphelin), déterminisme du build.
- **Hooks inertes documentés** pour la consommation aval (voir *Hooks inertes*).
- **Non-régression** : 054 (loader, stamp) + 055 (moteur de mapping) restent verts ; le stamp `checksum` reflète le nouvel artefact.

**Hors périmètre (hooks inertes / autres stories) :**

- **Consommation** du plan de comptes : validation « **compte hors plan** » à l'import de balance → **EPIC-009** ; **libellés de comptes** dans la présentation des états → **EPIC-011**. Aucune consommation en 056.
- **SFD-BCEAO** (son propre plan de comptes + table de passage) → **STORY-057**.
- **Surcharges de mapping par organisation** → **STORY-058**.
- **Régime SMT** (liasse simplifiée), généralisation multi-pays UEMOA → différés (D12, hors EPIC-010).
- Aucun endpoint HTTP nouveau, aucune écriture Mongo (056 est un artefact embarqué + contrat).

---

## User Flow (technique)

1. **Constitution** : le plan de comptes normalisé est saisi en source (`plan-comptable-syscohada.json`), chaque entrée `{ numero, libelle, classe }`.
2. **Build** : `node scripts/referentiels/build.mjs` lit les 4 sources (postes, table de passage, fiscal, **plan de comptes**), les normalise, écrit l'artefact consolidé à ordre de clés figé, et imprime le **sha256**.
3. **Registre** : le nouveau sha256 est reporté dans `ReferentielRegistry` (entrée `syscohada-revise@2.1`).
4. **Chargement** (runtime, inchangé dans son principe) : le `ReferentielLoader` résout `syscohada-revise@2.1` → fetch → **vérifie le checksum** → parse → expose désormais `planDeComptes` en plus de `postes`/`tableDePassage` → cache.
5. **Cohérence** (CI/tests) : le spec de cohérence charge l'artefact réel et prouve que le plan est bien formé et **couvre** tous les préfixes de la table de passage.
6. **Aval (non 056)** : EPIC-009/011 consommeront `planDeComptes` (hooks inertes documentés).

---

## Acceptance Criteria

- [ ] **AC-1 — Contrat étendu.** `ReferentielPackage` porte `planDeComptes: CompteReferentiel[]`, avec `CompteReferentiel { numero: string; libelle: string; classe: number }`. Le champ est **additif** : `ReferentielLoader.parse()` reste tolérant (`planDeComptes ?? []`) et **aucune** signature existante n'est cassée.
- [ ] **AC-2 — Plan présent & non vide.** L'artefact `syscohada-revise@2.1` embarque un `planDeComptes` **non vide** couvrant les classes **1 à 8**.
- [ ] **AC-3 — Plan bien formé.** Chaque compte : `numero` conforme à `^\d{2,}$`, `libelle` non vide, `classe` = **premier chiffre** de `numero` et ∈ [1..8] ; **aucun `numero` en doublon**.
- [ ] **AC-4 — Cohérence plan ⊇ table de passage.** Pour **chaque** préfixe de `tableDePassage[].comptesSyscohada`, il existe **au moins un** compte du plan dont le `numero` **commence par** ce préfixe (ou l'égale) → **0 mapping orphelin**. (Prouve que le plan couvre la table de passage existante.)
- [ ] **AC-5 — Déterminisme du build.** Ré-exécuter `build.mjs` sur des sources inchangées produit un artefact **octet-pour-octet identique** ⇒ **même** sha256.
- [ ] **AC-6 — Checksum synchronisé.** Le checksum de `syscohada-revise@2.1` dans `ReferentielRegistry` **égale** le sha256 du nouvel artefact ; le chargement réussit (aucun `ReferentielIntegrityError`), un checksum falsifié échoue toujours (test négatif conservé).
- [ ] **AC-7 — Loader expose le plan.** `ReferentielLoader.load('syscohada-revise','2.1')` renvoie un paquet dont `planDeComptes.length > 0`, et la ligne de log de chargement mentionne le nombre de comptes du plan.
- [ ] **AC-8 — Non-régression 054/055.** `postes` (163) et `tableDePassage` (99) **inchangés** ; `TableDePassageService.mapComptes` produit les **mêmes** rattachements qu'avant (mêmes postes pour `211000`, `411FACTURE`, `401000`, `999999→nonMappé`) ; le `EffectiveReferentielStamp.checksum` reflète le **nouvel** artefact.
- [ ] **AC-9 — Périmètre respecté.** Aucun endpoint nouveau, aucune écriture Mongo, aucune consommation du plan (compte hors plan / libellés = hooks inertes documentés) ; `sfd-bceao` et surcharges org restent hors story.

---

## Technical Notes

### Contrat (interface)

`src/modules/bilan/referentiel/referentiel-package.interface.ts` :

```ts
/** Un compte du plan comptable normalisé du référentiel (SYSCOHADA révisé). */
export interface CompteReferentiel {
  /** Numéro de compte normalisé, ex. "211", "401", "601". */
  numero: string;
  libelle: string;
  /** Classe comptable = 1er chiffre du numéro (1..8). */
  classe: number;
}

export interface ReferentielPackage {
  meta: { code; version; libelle; checksum; date? };
  regles: Record<string, string>;
  /** Plan de comptes normalisé (FR-005 / FR-007) — catalogue des comptes du référentiel. */
  planDeComptes: CompteReferentiel[];
  postes: PosteEtat[];
  tableDePassage: MappingRule[];
  paquetFiscal?: Record<string, unknown>;
}
```

> Le champ est **additif** (l'en-tête du fichier autorise explicitement l'extension « sans casser le `ReferentielLoader` »). Le placer **après `regles`, avant `postes`** dans le type **et** dans `build.mjs` (ordre de clés = déterminisme du checksum, AC-5).

### Loader

`referentiel-loader.service.ts`, `parse()` : ajouter `planDeComptes: pkg.planDeComptes ?? []` au paquet renvoyé (tolérant → n'impose **rien** à `sfd-bceao@057`). La **complétude** SYSCOHADA est garantie par le **spec de cohérence** sur l'artefact réel (AC-2/3/4), **pas** par un refus runtime (aligné sur l'invariant « on ne fait confiance qu'après checksum » — ne pas transformer une donnée incomplète en 503). Enrichir le log de succès : `postes=… mapping=… plan=…`.

### Build & registre

- Nouvelle source `scripts/referentiels/sources/plan-comptable-syscohada.json` (+ copie de provenance `docs/referentiels/plan-comptable-syscohada.{json,csv}`, statut « amorce à valider »).
- `build.mjs` : `readJson('plan-comptable-syscohada.json')` → normaliser (`{ numero:String, libelle:String, classe:Number(numero[0]) }`) → insérer `planDeComptes` dans le paquet à la **position figée**. Réutiliser la mécanique déterministe existante (JSON indent 2, `\n` final, pas d'horodatage).
- `ReferentielRegistry` : remplacer le checksum `syscohada-revise@2.1` par le sha256 imprimé par le build. **Seul** point de vérité du hash (vérifié : `grep 4ced8658` ⇒ 1 occurrence).

### Décision — version 2.1 conservée, checksum mis à jour

Ajouter `planDeComptes` **change les octets** de l'artefact ⇒ **change le sha256**. On **conserve** la version `2.1` (on **ne bump pas** en 2.2) et on **met à jour** son checksum, car : (a) le référentiel n'a **jamais été diffusé** hors dev — le `2.1` du squelette était un **pilote/amorce** ; (b) principe projet « **migration = souci de prod, différé ; le dev repart de zéro** ». Aucun consommateur externe ne dépend de l'ancien hash. *(À reconsidérer au 1er client réel : à ce moment, tout changement de contenu = nouvelle version.)*

### Contrôles de cohérence (tests, pas de coût runtime)

Placer les CC dans un **spec** qui charge l'**artefact réel** embarqué (patron `referentiel-registry.spec.ts` / `referentiel-loader.service.spec.ts`) — **pas** dans le `parse()` du loader (le loader fait confiance au checksum ; la cohérence est une garantie de **CI/build**, pas une porte HTTP) :

- **CC1 (AC-3)** : plan bien formé (`^\d{2,}$`, libellé non vide, classe = 1er chiffre ∈ 1..8, pas de doublon `numero`).
- **CC2 (AC-4)** : `forall préfixe ∈ ⋃ tableDePassage[].comptesSyscohada : ∃ compte ∈ planDeComptes, compte.numero.startsWith(préfixe)` ⇒ liste des orphelins **vide**.
- **CC3 (AC-5)** : rejouer la logique de `build.mjs` (ou l'exécuter) → sha256 **stable** et **égal** au checksum du registre.

### Hooks inertes (documentés, zéro code mort)

- `planDeComptes` exposé mais **non consommé** : commentaire pointant **EPIC-009** (rejet/alerte « compte hors plan » à l'import balance) et **EPIC-011** (libellés de comptes dans la présentation des états).
- `sfd-bceao` : le registre reste *multi-référentiel ready* (STORY-057 ajoutera son propre `planDeComptes`).

### Non-régression à surveiller

- `referentiel-registry.spec.ts` : assertion `checksum` = `^[0-9a-f]{64}$` (passe ; la **valeur** change).
- `referentiel-stamp.spec.ts` / `test/bilan-referentiel.e2e-spec.ts` : si un checksum figé y est attendu en dur, le mettre à jour (à défaut, il est lu dynamiquement du paquet → rien à faire). **À vérifier au dev.**
- `TableDePassageService` (055) : `mapComptes` inchangé — mêmes rattachements (couverture par un test de non-régression avec les cas docker de 055).

---

## Dependencies

**Stories prérequises (livrées) :**
- **STORY-038** — squelette : `ReferentielPackage`, `ReferentielLoader`, `ReferentielRegistry`, `build.mjs`, artefact pilote.
- **STORY-054** — `EffectiveReferentielStamp` (le stamp reflètera le nouveau checksum).
- **STORY-055** — moteur de table de passage (non-régression du mapping).

**Débloque :**
- **STORY-057** (SFD-BCEAO : même schéma, `planDeComptes` propre) — patron réutilisable.
- **EPIC-009** (compte hors plan à l'import), **EPIC-011** (libellés de comptes) — consommateurs du plan.

**Dépendances externes :**
- Données du **plan comptable normalisé SYSCOHADA révisé (AUDCIF 2017)** — provenance réglementaire, statut « amorce à valider par un expert ».

---

## Definition of Done

- [ ] Code implémenté (branche `MNV-056`) — cf. `.agents/rules/flux-git.md`.
- [ ] **Lint 0 warning** (`./node_modules/.bin/eslint "{src,test}/**/*.ts" --max-warnings 0`) · **build OK** (`npm run build`).
- [ ] **Couverture ≥ 65 branches / 90 fonctions / 90 lignes / 90 statements** (ne jamais baisser les seuils) — modules `referentiel/**` couverts (loader, registry, cohérence).
- [ ] **Unit + e2e verts** (`npm run test:cov`, `npm run test:e2e`).
- [ ] **AC-1 → AC-9** validés, dont **CC1/CC2/CC3** par des tests sur l'artefact **réel** embarqué.
- [ ] **Non-régression** : 054 (stamp) + 055 (mapping) verts ; 163 postes / 99 mappings inchangés.
- [ ] **Vérification docker réelle** (056 n'écrit **pas** en base → la vérif porte sur le **chargement réel**, pas `mongosh`) : stack `down -v` → `up --build` ; dans le conteneur `bilan-service`, le `ReferentielLoader` charge `syscohada-revise@2.1` (log `plan=…`), le checksum vérifié **≠** `4ced8658…` (= nouvel artefact) ; l'endpoint `GET /bilan/table-de-passage/dry-run` (055) répond **à l'identique** ; le `EffectiveReferentielStamp.checksum` renvoyé reflète le nouvel artefact ; 8/8 services healthy, `/health` 200 (non-régression). Consigné dans *Progress Tracking*.
- [ ] Périmètre respecté (aucun endpoint nouveau, aucune écriture Mongo, aucune consommation du plan) ; hooks inertes documentés.

---

## Story Points Breakdown

- **Données / provenance :** 2 pts — constitution + validation croisée du plan de comptes (couverture des 155 préfixes de la table de passage).
- **Code :** 1,5 pt — interface `CompteReferentiel` + `build.mjs` (insertion déterministe) + `ReferentielRegistry` (checksum) + `ReferentielLoader` (exposition + log).
- **Tests :** 1,5 pt — CC1/CC2/CC3 sur l'artefact réel + non-régression 055 (mapping) + mise à jour des assertions de checksum.
- **Total : 5 points.**

**Rationale :** pas de nouvelle surface HTTP ni de persistance ; le coût est la **constitution de données réglementaires cohérentes** + le **contrat de paquet** + les **contrôles de cohérence**. Aligné sur l'estimation de sprint-planning (5).

---

## Additional Notes

- **Aucune consommation du plan en 056** : le paquet est *complété et rendu cohérent*, prêt pour EPIC-009/011. Résister à la tentation de câbler « compte hors plan » ici (hors périmètre, dépend de l'import balance d'EPIC-009).
- **Statut « amorce à valider »** conservé sur la provenance (cf. `docs/referentiels/README.md`) : le plan est structurellement complet et cohérent avec la table de passage, mais la **validation experte** du contenu réglementaire reste une étape aval (open question #2 du PRD).
- **SFD-BCEAO (057)** réutilisera exactement ce patron : source `plan-comptable-sfd.json` → `build.mjs` → nouvelle entrée registre.

---

## Progress Tracking

**Status History :**
- 2026-07-18 : Créée (re-cadrée contre le code réel : delta = plan de comptes intégré au paquet, cohérence plan ⊇ table de passage) par vivian (Scrum Master).
- 2026-07-18 : Implémentée (branche `MNV-056`) — `defined → review`.

**Implémentation (résumé) :**
- **Plan de comptes** `scripts/referentiels/sources/plan-comptable-syscohada.json` : **174 comptes** SYSCOHADA révisé (têtes de classe 1→8 + comptes couvrant les 155 préfixes de la table de passage), `{numero, libelle, classe}`. Provenance : `docs/referentiels/plan-comptable-syscohada.json`.
- **Contrat** `ReferentielPackage` étendu : `CompteReferentiel {numero, libelle, classe}` + champ additif `planDeComptes` (après `regles`, ordre figé).
- **Build** `build.mjs` : consolide `planDeComptes` → artefact régénéré ; nouveau **sha256 `e9370b14…`** (ancien `4ced8658…`). **`ReferentielRegistry`** mis à jour (seul point du hash). Version `2.1` conservée (dev repart de zéro).
- **Loader** : expose `planDeComptes ?? []` (tolérant) + log enrichi `plan=…`. **DTO diagnostic** : `planCount`.
- **Tests** : `plan-comptable-coherence.spec.ts` (CC1 bien formé, CC2 plan ⊇ table de passage = 0 orphelin, CC3 checksum registre = sha256 artefact, non-régression 163/99) sur l'artefact **réel** ; fixtures des specs mises à jour.

**Vérification docker RÉELLE (2026-07-18, stack vivante 13 services healthy) :**
- Loader **exercé de bout en bout dans le conteneur** `prospera-bilan-service-1` (registre → source embarquée → checksum → parse) : `Référentiel syscohada-revise@2.1 chargé (plan=174, postes=163, mapping=99)`.
- `meta.checksum` vérifié = `e9370b14…` = sha256 de l'asset DIST = checksum du registre (le loader lève sinon → preuve d'intégrité).
- **CC2 dans le conteneur** : 0 mapping orphelin (plan couvre les 155 préfixes). Non-régression : postes 163 / mapping 99 inchangés ; asset re-copié en `dist/` (hot-reload) cohérent avec le registre.
- 056 **n'écrit pas en base** → pas de requête `mongosh` (aucune collection touchée) ; la preuve porte sur le **chargement réel**, conforme à la nature « artefact » de la story.

**Qualité :** lint 0 warning · build OK · **155 unit (25 suites) + 28 e2e (4 suites) verts** · couverture > seuils (referentiel/** ≥ 98 % lignes).

**Actual Effort :** 5 points (conforme à l'estimation).

---

**Story créée avec la méthode BMAD v6 — Phase 4 (Implementation Planning).**
