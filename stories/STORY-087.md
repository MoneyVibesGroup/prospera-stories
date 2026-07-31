# STORY-087 : Reprise de balance d'ouverture / à-nouveaux + continuité dans l'Atelier

**Epic :** EPIC-021 — Hub multi-source (D13) : migration & continuité
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § FR-A13 · `rapport-bilan-logique-metier-2026-07-12.md` §O1/D9 (Sage = pont de migration ; Prospera = système primaire) · STORY-086 (import Sage)
**Priorité :** Must Have
**Story Points :** 5
**Complexité :** high
**Statut :** done
**Assigné à :** vivianMoneyVibesGroupes
**Créée le :** 2026-07-12
**Sprint :** 17 (EXTENDED)
**Service :** `balance-service` (:3007)
**Couvre :** FR-A13 (reprise de balance d'ouverture / à-nouveaux + continuité)

> **Le moment où Sage devient un pont, et non plus une béquille (D9).** STORY-086 sait **importer** une balance Sage. Mais importer une balance **une fois par an** ne fait pas de Prospera le système primaire — ça en fait un simple lecteur. Cette story livre la **bascule** : la balance Sage de l'exercice N-1 devient la **balance d'ouverture (à-nouveaux)** de l'exercice N, et le client **continue dans l'Atelier** (cahiers, OCR, rapprochement). Le client **quitte Sage** — c'est l'objectif de D9 : *« certains ont déjà débuté avec Sage, ils pourront exporter vers le nôtre pour continuer ; mais le but est qu'une nouvelle structure adopte notre solution »*.

---

## User Story

En tant que **cabinet comptable** migrant un client depuis **Sage**,
je veux **reprendre la balance de clôture N-1 comme balance d'ouverture N** (à-nouveaux) et **poursuivre la saisie dans l'Atelier**,
afin que le client **cesse d'utiliser Sage** et que l'exercice N soit tenu **intégralement dans Prospera**.

---

## Description

### Contexte

La comptabilité est **continue** : les soldes de clôture N-1 des comptes **de bilan** (classes 1 à 5) deviennent les soldes d'ouverture de N. Les comptes **de gestion** (classes 6 et 7) sont **soldés** (ils repartent de zéro) — leur solde a été viré au **résultat** (compte `12x`), lui-même affecté (réserves, report à nouveau).

C'est **exactement** ce qu'un logiciel comptable fait à la clôture, et c'est ce que l'Atelier doit savoir faire pour prendre le relais :

| Classe | À la reprise |
|---|---|
| **1-5** (bilan : capitaux, immo, stocks, tiers, trésorerie) | **Reportées** telles quelles → à-nouveaux |
| **6-7** (gestion : charges, produits) | **Soldées à zéro** (elles ont produit le résultat de N-1) |
| **12x** (résultat N-1) | **Reporté** puis **affecté** (réserves / report à nouveau) — décision de l'assemblée |

> **Le piège à éviter absolument :** reprendre les classes 6/7 dans les à-nouveaux **doublerait** le CA et les charges de N-1 dans l'exercice N. C'est l'erreur classique d'un import naïf — le contrôle d'équilibre **ne la détecterait pas** (la balance resterait équilibrée !). Un test dédié est **obligatoire**.

**Deux origines possibles** pour la balance de clôture N-1 :
- un **import Sage** (STORY-086) — cas de la migration ;
- une **balance produite par l'Atelier** en N-1 (cahiers/OCR, STORY-085) — cas d'un client déjà chez nous → **la continuité doit fonctionner d'année en année**, pas seulement à la migration.

### Périmètre

**Inclus :**

- **`RepriseService.genererANouveaux(orgId, exerciceSource, exerciceCible)`** :
  - Entrée : une balance **VALIDÉE** de l'exercice source (N-1), quelle que soit sa `source` (`sage`, `ocr`, `direct`).
  - **Règles de reprise** :
    - Comptes de **classes 1-5** → **reportés** (solde de clôture = solde d'ouverture).
    - Comptes de **classes 6-7** → **exclus** (soldés).
    - **Résultat N-1** (`12x`) → reporté, en attente d'**affectation**.
  - Sortie : une **`BalanceCanonique`** d'ouverture pour N (`version: 1`, `origine: 'A_NOUVEAUX'`, `niveauPreuve` **hérité** de la balance source — un à-nouveau n'est pas « mieux prouvé » que sa source).
  - **Équilibre garanti** : `Σ D = Σ C` sur les classes 1-5 **par construction** (si la balance N-1 était équilibrée, les classes 1-5 le sont aussi, le résultat faisant la jointure) → **vérifié** par `BalanceValidator` (STORY-101), jamais supposé.
- **Affectation du résultat N-1** (`POST /api/v1/balance/affectation-resultat`) :
  - Le résultat (`12x`) est **affecté** par décision humaine : **réserves** (`11x`), **report à nouveau** (`11x`), **dividendes** (`457`).
  - Le total affecté **doit égaler** le résultat (**sinon 400**) ; **aucune affectation automatique** (c'est une décision d'assemblée, pas un calcul).
  - **Tracé** (NFR-A07) : qui, quand, quelle répartition.
- **Mode « continuité »** (`POST /api/v1/exercices/:exercice/ouvrir`) :
  - Ouvre l'exercice N avec la balance d'à-nouveaux comme **socle**.
  - Bascule le dossier en **`origine: 'ATELIER'`** : à partir de là, **les cahiers (STORY-082/083) sont la source de vérité** ; la balance N est **incrémentale** = **à-nouveaux + mouvements de l'exercice** (agrégation STORY-085).
  - **Verrouillage de N-1** : l'exercice source est **clos** (immutable, STORY-101) ; toute modification → **409**.
- **Chaînage N/N-1** : la balance N **référence** la balance N-1 (`balanceSourceId`) → traçabilité de la continuité, et alimentation des **colonnes N-1** de la liasse (`bilan-service` STORY-052/059).
- **Agrégation étendue (STORY-085)** : `balance N = à-nouveaux (1-5) + Σ mouvements des cahiers`. Les à-nouveaux ne sont **jamais** ré-agrégés depuis les transactions (ils sont un **socle figé**).
- **Tests** :
  - Reprise Sage N-1 → à-nouveaux N : **classes 1-5 reportées**, **classes 6-7 absentes** (test **anti-doublon**, le plus important), résultat reporté.
  - **Équilibre** de la balance d'ouverture vérifié.
  - Affectation : total ≠ résultat → **400** ; affectation correcte → soldes `11x` mis à jour, `12x` soldé.
  - **Continuité N → N+1** depuis une balance **produite par l'Atelier** (pas seulement Sage).
  - Modification de N-1 après ouverture de N → **409**.
  - Agrégation N = à-nouveaux + mouvements (les à-nouveaux ne sont pas recalculés).
  - `niveauPreuve` hérité de la source.

**Hors périmètre :**

- **Import du fichier Sage** → **STORY-086** (CORE) : ici on **part** d'une balance déjà importée/validée.
- **Rendu des colonnes N/N-1 dans la liasse** → `bilan-service` (STORY-052/059).
- **Reprise des écritures détaillées** (grand livre, lettrage) → **hors v1** : on reprend des **soldes**, pas un historique d'écritures. *(Une reprise de grand livre relèverait de `comptabilite-service`, FI-2.)*
- **Réouverture d'un exercice clos** → `bilan-service` (EPIC-012, STORY-066) ; ici, N-1 clos est **immuable**.
- **Calcul du résultat N-1** → il **vient** de la balance source (compte `12x`), il n'est pas recalculé ici.

### Flux

1. Le cabinet a importé la **balance Sage de clôture 2025** (STORY-086) et l'a **validée**.
2. Il lance : `POST /api/v1/balance/a-nouveaux` `{ exerciceSource: 2025, exerciceCible: 2026 }`.
3. `RepriseService` génère les **à-nouveaux 2026** :
   - `101` Capital **C** 5 000 000 · `211` Immo **D** 3 200 000 · `411` Clients **D** 1 800 000 · `401` Fournisseurs **C** 900 000 · `521` Banque **D** 2 100 000 … (**classes 1-5 : reportées**)
   - `601`, `701`, … → **absentes** (classes 6-7 **soldées**) ⚠️ *le test anti-doublon vérifie exactement ceci*
   - `120` Résultat 2025 **C** 1 400 000 → **reporté, à affecter**
4. **Équilibre vérifié** (`BalanceValidator`) : `Σ D = Σ C` ✔ → **200** (aperçu).
5. Le cabinet **affecte le résultat** : `POST /affectation-resultat` → réserves 1 000 000 + report à nouveau 400 000 (**total = 1 400 000** ✔ sinon **400**). Tracé.
6. `POST /exercices/2026/ouvrir` → l'exercice 2026 est ouvert sur ce socle ; le dossier bascule en **`origine: ATELIER`** ; **2025 est clos** (toute modif → 409).
7. Le client **abandonne Sage** : il saisit désormais ses **cahiers** dans l'Atelier (STORY-082/083, OCR STORY-084).
8. La balance 2026 = **à-nouveaux + mouvements** (agrégation STORY-085) → contrôles (STORY-098) → handoff `bilan-service` (STORY-099).
9. **L'année suivante**, la même mécanique repart **d'une balance produite par l'Atelier** (plus de Sage du tout).

### Décisions de conception (arrêtées au cadrage)

| # | Décision | Pourquoi |
|---|---|---|
| **D-087-1** | `origine` (`A_NOUVEAUX`) et `balanceSourceId` deviennent des champs **optionnels** du contrat canonique `BalanceCanonique` (STORY-101) et de son schéma. | L'origine d'une balance est une **propriété de la balance**, pas d'un agrégat annexe : c'est ce qui permet à l'agrégation de reconnaître son **socle** et au gel du cahier de **ne pas** se déclencher dessus. Les rendre **optionnels** n'impacte ni les 3 adaptateurs, ni le **checksum** (qui ne couvre que `exercice/source/referentiel/version/lignes`), ni le payload `balance.created` — aucune migration, aucun contrat cassé. |
| **D-087-2** | L'à-nouveaux **hérite la `source` de N-1** (comme le cadrage le prescrit) **et — c'est le point ajouté — le gel du cahier ignore désormais les balances `origine: A_NOUVEAUX`**. | ⚠️ **Piège qui saborde l'AC de continuité Atelier → Atelier.** Quand N-1 vient de l'Atelier, l'à-nouveaux de N hérite `source: 'ocr'` ; or `exigerExerciceModifiable` gèle le cahier dès qu'**une balance `ocr` VALIDÉE** existe pour l'exercice (D-082-3). Le socle d'ouverture de N **gèlerait donc le cahier de N avant la première saisie**. Latent aujourd'hui (rien ne valide encore de balance), il se déclencherait à STORY-098. Un socle d'ouverture n'est pas « la balance que le cahier justifie » : il ne doit rien geler. |
| **D-087-3** | L'**affectation du résultat** produit une **nouvelle version** de la balance d'à-nouveaux (append-only) : elle solde `12x` et porte la répartition sur `11x`/`457`. Jamais de mutation en place. | L'immutabilité et le versioning append-only sont l'invariant de STORY-101. Muter la balance d'ouverture effacerait l'état « résultat non encore affecté », qui est précisément ce qu'un contrôle veut pouvoir constater. |
| **D-087-4** | L'exercice devient un **agrégat local** `exercices_atelier` (une ligne par `(orgId, exercice)`) portant `statut OUVERT\|CLOS`, `origine SAGE\|ATELIER`, `balanceANouveauxId`, `balanceSourceId`. | On ne réutilise **pas** l'`Exercice` de `bilan-service` (STORY-065) : **une base Mongo par service**, aucune requête ni clé étrangère cross-service (invariant #2). Les deux notions portent d'ailleurs des choses différentes — là-bas la clôture d'une **liasse**, ici la bascule d'un **dossier de saisie**. |
| **D-087-5** | Le **verrouillage de N-1** est porté par `statut: CLOS` et s'applique aux **points de mutation réels** de N-1 dans ce service : cahiers (recettes, dépenses) et construction/soumission de balance pour cet exercice → **409**. | « Toute modification → 409 » n'a de sens qu'appliqué à ce qui est effectivement mutable ici. Le dire précisément évite deux erreurs symétriques : croire l'exercice verrouillé alors qu'un cahier reste ouvert, ou verrouiller des chemins qui n'existent pas. |
| **D-087-6** | L'agrégation (STORY-085) devient **incrémentale** : `balance N = socle d'à-nouveaux ⊕ soldes des mouvements`, fusionnés **par compte** avec la même arithmétique que `agregerEcritures` (solde **net**, `niveauPreuve` = le **plus faible** des deux). **Sans à-nouveaux pour l'exercice, le comportement de 085 est inchangé** (non-régression). | Le socle est **figé** : il n'est jamais ré-agrégé depuis les transactions. Reprendre la convention exacte de `agregerEcritures` (net, et non cumul) est ce qui garantit que la fusion ne fabrique pas des cumuls incohérents avec le reste de la balance ; prendre le `niveauPreuve` le plus faible évite qu'un mouvement estimé soit « blanchi » par un socle sur pièce. |
| **D-087-7** | La **tolérance** de l'affectation est celle du contrat — `TOLERANCE_EQUILIBRE` (100 unités mineures = 1 XOF) — et non un `1` codé en dur. | Le cadrage écrit `Math.abs(total - resultat) > 1` avec « tolérance 1 XOF » en commentaire : en **unités mineures XOF**, `1` vaut **un centime**, pas un franc. Reprendre la constante partagée évite un contrôle cent fois plus strict que ce qui est annoncé. |

---

## Acceptance Criteria

- [ ] **`RepriseService.genererANouveaux()`** produit une **`BalanceCanonique`** d'ouverture pour N à partir d'une balance **VALIDÉE** de N-1 (quelle que soit sa `source` : `sage`, `ocr`, `direct`).
- [ ] **Classes 1-5 reportées** (solde de clôture = solde d'ouverture).
- [ ] **⚠️ Classes 6-7 EXCLUES des à-nouveaux** — test **anti-doublon obligatoire** : reprendre les charges/produits **doublerait** le CA et les charges de N-1 dans N, **sans casser l'équilibre** (donc invisible au contrôle FR-A25).
- [ ] **Résultat N-1 (`12x`) reporté** et **en attente d'affectation** (jamais affecté automatiquement).
- [ ] **Équilibre de la balance d'ouverture vérifié** par `BalanceValidator` (STORY-101) — **jamais supposé**.
- [ ] **Affectation du résultat** (`POST /affectation-resultat`) : réserves / report à nouveau / dividendes ; **total affecté = résultat** (sinon **400**) ; **aucune affectation automatique** ; **tracée** (NFR-A07).
- [ ] **Mode continuité** (`POST /exercices/:exercice/ouvrir`) : l'exercice N s'ouvre sur les à-nouveaux ; le dossier bascule en **`origine: ATELIER`** (les cahiers deviennent la source de vérité).
- [ ] **Verrouillage N-1** : après ouverture de N, toute modification de N-1 → **409** (immutabilité, STORY-101).
- [ ] **Chaînage** : la balance N référence la balance N-1 (`balanceSourceId`) → alimente les colonnes N-1 de la liasse (`bilan-service`).
- [ ] **Agrégation N = à-nouveaux + mouvements** (STORY-085) : les à-nouveaux sont un **socle figé**, **jamais ré-agrégés** depuis les transactions.
- [ ] **`niveauPreuve` hérité** de la balance source (un à-nouveau n'est pas mieux prouvé que sa source).
- [ ] **Continuité N → N+1** fonctionne depuis une balance **produite par l'Atelier** (pas seulement depuis Sage) — test dédié.
- [ ] **Tests** : reprise Sage, **anti-doublon 6/7**, équilibre, affectation (400 si total ≠ résultat), continuité Atelier→Atelier, verrouillage N-1, agrégation incrémentale. **Coverage ≥ 90 %.**
- [ ] **Swagger** + **CI verte**.

---

## Technical Notes

### La règle de reprise — et le test qui protège de l'erreur classique

```typescript
async genererANouveaux(orgId: string, source: BalanceCanonique, exerciceCible: DateRange): Promise<BalanceCanonique> {
  if (source.etat !== 'VALIDÉE') throw new BadRequestException('BALANCE_SOURCE_NON_VALIDEE');

  const lignes = source.lignes
    .filter(l => {
      const classe = Number(l.compte[0]);
      return classe >= 1 && classe <= 5;   // ✅ bilan reporté
      // ⚠️ classes 6 et 7 EXCLUES : elles ont produit le résultat de N-1.
      //    Les reprendre doublerait CA et charges — SANS casser l'équilibre (invisible au contrôle FR-A25).
    })
    .map(l => ({ ...l, niveauPreuve: l.niveauPreuve })); // hérité, jamais « amélioré »

  const balance = this.factory.build({
    orgId, exercice: exerciceCible, source: source.source,
    referentiel: source.referentiel, version: 1,
    origine: 'A_NOUVEAUX', balanceSourceId: source.id, lignes,
  });

  await this.balanceValidator.validate(balance); // équilibre VÉRIFIÉ, pas supposé
  return balance;
}
```

### Affectation du résultat — décision humaine, jamais un calcul

```typescript
@Post('/balance/affectation-resultat')
@RequiresBalanceAccess()
async affecter(@TenantContext() orgId, @Body() dto: AffectationDto, @CurrentUser() user) {
  const resultat = await this.repriseService.getResultatAReporter(orgId, dto.exercice); // solde 12x
  const total = dto.reserves + dto.reportANouveau + dto.dividendes;

  if (Math.abs(total - resultat) > 1) {                 // tolérance 1 XOF
    throw new BadRequestException({ code: 'AFFECTATION_INCOMPLETE', resultat, total });
  }
  return this.repriseService.appliquerAffectation(orgId, dto, user); // + audit (NFR-A07)
}
```

---

## Risques & Mitigation

| Risque | Mitigation |
|---|---|
| **⚠️ Classes 6/7 reprises dans les à-nouveaux** → CA et charges **doublés**, **sans déséquilibre** (donc invisible au contrôle) | **Filtre explicite classes 1-5** + **test anti-doublon obligatoire** (le plus important de cette story) |
| Résultat affecté automatiquement | **Interdit** : l'affectation est une **décision d'assemblée** → action humaine, total contrôlé, tracée |
| Balance d'ouverture déséquilibrée | Équilibre **vérifié** par `BalanceValidator` (jamais supposé « puisque N-1 l'était ») |
| N-1 modifié après ouverture de N → incohérence | **Verrouillage** : N-1 clos → **409** sur toute modification |
| À-nouveaux ré-agrégés depuis les transactions | Les à-nouveaux sont un **socle figé** ; l'agrégation (STORY-085) fait **socle + mouvements**, jamais « tout recalculer » |
| Migration = one-shot, le client reste sur Sage | **Mode continuité** : bascule `origine: ATELIER` ; la continuité **Atelier → Atelier** (N → N+1) est **testée** (D9) |
| Reprise « embellit » la preuve | `niveauPreuve` **hérité** de la source |

---

## Definition of Done

- [ ] `RepriseService.genererANouveaux()` (classes 1-5 reportées, **6-7 exclues**, résultat reporté)
- [ ] **Test anti-doublon classes 6/7** (obligatoire, bloquant)
- [ ] Équilibre de la balance d'ouverture **vérifié** (`BalanceValidator`)
- [ ] Affectation du résultat (humaine, total contrôlé → 400 sinon, tracée)
- [ ] Mode continuité (`ouvrir` exercice, bascule `origine: ATELIER`)
- [ ] Verrouillage N-1 (409 sur modification)
- [ ] Chaînage `balanceSourceId` (colonnes N-1 de la liasse)
- [ ] Agrégation incrémentale (socle figé + mouvements)
- [ ] Continuité **Atelier → Atelier** testée (pas seulement depuis Sage)
- [ ] Coverage ≥ 90 % ; Swagger ; CI verte
- [ ] Non-régression : STORY-086 (import Sage) + STORY-085 (agrégation) verts

---

## Progress Tracking

| Phase | État | Note |
|---|---|---|
| Cadrage (create-story) | ✅ 2026-07-29 | Story préexistante **révisée** : `Complexité: high`, 7 décisions `D-087-1..7`. Deux pièges tranchés au cadrage — (1) l'à-nouveaux hérite `source: 'ocr'` en continuité Atelier→Atelier et **gèlerait le cahier de N avant la première saisie** (l'AC de continuité s'auto-saborde) ; (2) la tolérance d'affectation écrite `> 1` dans le cadrage vaut **un centime**, pas 1 XOF. Statut `not_started` → `defined`. |
| Développement (dev-story) | ✅ 2026-07-29 | Module `modules/balance/reprise/` : règles pures, `RepriseService`, `ExercicesRepository` + collection `exercices_atelier`, 3 endpoints, contrat canonique étendu de `origine`/`balanceSourceId` (optionnels), agrégation de STORY-085 rendue incrémentale, verrouillage de N-1 dans les deux cahiers. |
| Validation (DoD + vérif docker) | ✅ 2026-07-29 | Lint 0 warning · build OK · **1353 unit** (module `reprise` **99,6 %** ; global **98,9 / 92,2 / 98,3 / 98,9** > seuils 65/90/90/90) · **290 e2e**. Vérif docker **20/20** détaillée ci-dessous. |
| Revue de code | ✅ 2026-07-29 | **4 constats, tous corrigés** (2 commits dédiés). Cf. ci-dessous. |
| Revue de sécurité | ✅ 2026-07-29 | **Aucune vulnérabilité exploitable.** Compte rendu publié en commentaire de la PR #19. |
| Intégration (rebase-merge `dev`) | ✅ 2026-07-29 | PR **#19** `prospera-balance-service` — *Rebase and merge* sur `dev`, branche `MNV-087` supprimée. |

### Ce que le développement a corrigé du cadrage

| # | Piège | Ce qui se serait passé |
|---|---|---|
| **1** | Les numéros de comptes étaient ceux du **PCG français** (`12x` résultat, `11x` réserves/report, `457` dividendes). | En **SYSCOHADA révisé**, `11` = réserves, `12` = **report à nouveau**, `13` = **résultat net** ; en **SFD-BCEAO** le plan est encore autre (`552`/`58`/`592`/`573`), et `457` n'existe dans **aucun** des deux (`45` = organismes internationaux). Le code aurait **lu le résultat dans le report à nouveau** et viré des dividendes sur un compte d'organismes internationaux — **sans jamais déséquilibrer la balance**. Les comptes sont désormais désignés par leur **rôle**, dans une table **exhaustive par référentiel** que le compilateur impose de compléter (dont SFD `592` et non le préfixe `59`, qui balaierait les SIG `593`-`596`). |
| **2** | « Équilibre du socle **garanti par construction** ». | Vrai d'une clôture **après** détermination du résultat, **faux** si les comptes de gestion sont encore ouverts : les solder retire le résultat qu'ils portent, et le socle s'écarte de sa valeur exacte. Le déterminer est hors périmètre ⇒ refus explicite **`RESULTAT_NON_DETERMINE`**, au lieu d'un 422 d'équilibre désignant le mauvais coupable. |
| **3** | `Math.abs(total - resultat) > 1`, commenté « tolérance 1 XOF ». | En **unités mineures**, `1` vaut **un centime** : un contrôle cent fois plus strict que l'annonce, refusant des répartitions légitimes. On reprend `TOLERANCE_EQUILIBRE`. |
| **4** (cadrage) | Le socle hérite la `source` de N-1 — donc `ocr` en continuité Atelier → Atelier. | Le gel du cahier (D-082-3) se déclenche sur toute balance `ocr` validée : le socle **aurait gelé le cahier de N avant la première saisie**, sabordant l'AC de continuité. Le gel ignore désormais `origine: A_NOUVEAUX`. |

### Vérification docker — stack vivante (20/20)

Org réelle via l'IdP, read-models amorcés, clôture 2025 soumise puis validée.

| # | Ce qui est prouvé | Résultat |
|---|---|---|
| 1-3 | Aperçu puis persistance du socle | 6 comptes reportés, **2 soldés**, résultat 140 M, équilibré ; **aucune écriture** en aperçu |
| 4 | **Anti-doublon** | **0** compte de classe 6/7 dans le socle persisté |
| 5 | Marquage + chaînage | `origine: A_NOUVEAUX`, `balanceSourceId` → la balance 2025 ; **0 socle orphelin** |
| 6 | Affectation incomplète | **400** `AFFECTATION_INCOMPLETE` avec `details: {resultat, total}` |
| 7 | Affectation exacte | socle **v2** ; **v1 CONSERVÉE** et portant encore le résultat ; `13` soldé, `118`+`12` crédités ; équilibrée |
| 8 | Seconde affectation | **409** `RESULTAT_DEJA_AFFECTE` |
| 9 | Ouverture 2026 | `OUVERT`/`ATELIER` **et** 2025 passé `CLOS`/`MIGRATION` dans la même transaction ; index unique `(orgId, exercice)` présent |
| 10 | Seconde ouverture | **409** `EXERCICE_DEJA_OUVERT` |
| 11 | **Verrouillage N-1** | saisie au cahier 2025 ⇒ **409** `EXERCICE_CLOS` ; 2026 reste saisissable |
| 12 | **Agrégation incrémentale** | `521` = **210 M (socle) + 24 M (mouvement) = 234 M**, en `niveauPreuve: saisie` — le socle sur pièce **ne blanchit pas** le mouvement ; balance équilibrée ; avertissement du socle présent |
| 13 | **Continuité Atelier → Atelier** | reprise 2026 → 2027 depuis une balance produite par l'Atelier ; socle héritant **`source: ocr`** |
| 14 | **Contre-épreuve du gel** | socle validé ⇒ cahier **ouvert** ; balance `ocr` **non-socle** validée ⇒ `BALANCE_VALIDEE_IMMUABLE` |
| 15-17 | Refus | `SOCLE_DEJA_GENERE` · `EXERCICES_CONFONDUS` · `BALANCE_SOURCE_NON_VALIDEE` |

### Deux blocages que seule la vérification docker a révélés

1. **Le contrat interdisait les comptes que ses propres référentiels définissent.** `FORMAT_COMPTE` exigeait **3** à 20 caractères (STORY-101), or `syscohada-revise@2.1` compte **75** comptes à deux caractères — dont `13` Résultat net et `12` Report à nouveau — et `sfd-bceao@2.0` en compte **48**, dont `58`. Une balance ne pouvait donc **pas porter son propre compte de résultat**, et la reprise n'avait aucun compte où affecter. Minimum passé à **2** : strictement permissif, aucune balance déjà acceptée ne cesse de l'être, checksum inchangé. ⚠️ **C'est un ajustement du contrat de STORY-101**, assumé plutôt que d'inventer des sous-comptes absents des artefacts.
2. **Le 400 d'affectation incomplète ne portait pas les montants** : `AllExceptionsFilter` construit le corps par **liste blanche** et jette les champs additionnels. Passés par l'opt-in `details` ; l'e2e assert désormais sur le **corps HTTP**, seul niveau où le piège est visible.

### Revue de code — 4 constats, tous corrigés

1. **Une course perdue rendait l'écriture d'un AUTRE appelant.** `submit` étant idempotent, il rend la ligne gagnante avec `created: false` ; la réponse annonçait que *son* socle avait été écrit. Côté affectation, pire : `resultatAffecte` du perdant, `lignes` du gagnant — une répartition annoncée qui n'est pas celle qui a été écrite. ⇒ **409**.
2. **`comptesSoldes` sur-comptait** : calculé par différence, il gonflait du moindre compte de bilan à solde nul — or ce chiffre est exposé comme la **preuve** de l'anti-doublon. Il compte désormais ceux qu'écarte leur **classe**.
3. **`RESULTAT_NON_DETERMINE` ne nommait que les classes 6 et 7**, alors qu'il vise aussi la **8** (autres charges et produits HAO).
4. **Une PERTE ne pouvait pas être affectée** (trouvé en sondant l'API pendant la revue de sécurité — la batterie unitaire appelait `appliquerAffectation` en contournant le DTO). `@Min(0)` sur `reportANouveau` interdisait le négatif, or c'est là qu'un déficit s'impute : aucun triplet ne pouvait égaler un résultat négatif, l'API répondait 400 quoi qu'on tente. La borne saute sur ce seul champ ; `reserves` et `dividendes` restent bornés à zéro.

3 mutations vérifiées rouges sur les correctifs 1-2.

**Signalé sans correctif** : le dépôt de pièces OCR reste possible sur un exercice clos — il ne crée aucune écriture comptable, et leur **application** au cahier passe par le chemin gardé (409).

---

**Status:** done
**Dependencies:** **STORY-086** (import Sage — fournit la balance N-1 en migration), **STORY-101** (contrat, validation, immutabilité), **STORY-085** (agrégation incrémentale N = à-nouveaux + mouvements) · **alimente** `bilan-service` (colonnes N-1, STORY-052/059)
**Réalise D9** : Sage devient un **pont de migration**, Prospera devient le **système primaire**
**Reference:** `prd-atelier-balance-2026-07-12.md` § FR-A13 · `rapport-bilan-logique-metier-2026-07-12.md` §O1/D9
