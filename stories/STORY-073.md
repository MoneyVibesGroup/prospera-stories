# STORY-073 : Export PDF/Excel de la liasse et du prévisionnel (fidèle au snapshot figé) — FR-023

**Epic :** EPIC-014 — Consultation & export — `bilan-service`
**Service :** `bilan-service` (relying party, :3004, base `bilan_service`)
**Réf. PRD :** [`docs/prd-bilan-service-2026-07-10.md`](../prd-bilan-service-2026-07-10.md) §FR-023 (« Export de la liasse et du prévisionnel en **PDF** (restitution) et **Excel** (retraitement), reflétant fidèlement le **snapshot figé** ») — **Must Have**, dépendances PRD : FR-015, FR-022
**Réf. cadrage (contraignant) :** [`docs/architecture-previsionnel-reproductibilite-2026-07-23.md`](../architecture-previsionnel-reproductibilite-2026-07-23.md) — **D1** (triplet de reproductibilité + mention de la version du modèle **dans le PDF** ; option **(c)** « figer l'artefact remis » à **trancher ici**) · **D5** (« STORY-073 consomme le hook `AuditType.export` réservé par 067 »)
**Réf. contrat front :** [`docs/frontend-stories/FE-038.md`](../frontend-stories/FE-038.md) — fixe le préfixe d'API **`/bilan/export`**, la récupération **synchrone ou asynchrone**, et l'exigence « brouillon → avertissement *non figé* »
**Réf. code livré (réutilisé, jamais réécrit) :** **STORY-064** (`JeuEtatsService.consulter` → `{ jeu, liasse, version }`) · **STORY-065** (`consulterVersion` → `SnapshotLiasseDocument` figé) · **STORY-067** (`AuditService.journaliser`, sûr par conception) · **STORY-069/070** (`ProjectionService.projeter` / `projeterMensuel`) · **STORY-137** (`versionHypothesesId` → triplet) · **STORY-072** (`ConsultationService`, patron de façade **qui délègue**) · **STORY-037** (gate `@RequiresBilanAccess`)
**Dépend de :** STORY-037 ✅ · 038 ✅ · 059→063 ✅ · 110→114 ✅ · 064 ✅ · 065 ✅ · 066 ✅ · 067 ✅ · 068 ✅ · 069 ✅ · 070 ✅ · 072 ✅ · **137 ✅** — **toutes livrées, aucun blocage** (détail : §[Dépendances](#dépendances))
**Ne dépend PAS de :** STORY-071 (comparaison de scénarios — **hors périmètre d'export**) · STORY-074 (comparaison inter-exercices, S16) · STORY-120/121/122 (référentiels additionnels : l'export est **agnostique**, il les servira sans modification) · balance-service
**Débloque / alimente :** front **FE-038** · story d'**archivage d'artefact** à créer si le besoin légal apparaît (§[Points ouverts](#points-ouverts--à-trancher-hors-périmètre))
**Priorité :** Must Have
**Story Points :** 5
**Statut :** done ✅ (dev DeepSeek v4 Flash → **revue de code : 7 constats bloquants + 12 majeurs corrigés d'office** → vérification docker bout-en-bout (fidélité snapshot prouvée, zéro écriture hors audit) → revue de sécurité **0 vulnérabilité** → PR #33 bilan-service « Rebase and merge » sur `dev`, HEAD `e99313d`, branche supprimée — 2026-07-24)
**Assigné à :** vivianMoneyVibesGroupes
**Créée :** 2026-07-24
**Terminée :** 2026-07-24
**Sprint :** 15

---

## User Story

**En tant que** dirigeant/comptable d'une organisation,
**je veux** exporter ma liasse et mon prévisionnel en **PDF** (pour les transmettre et les archiver) et en **Excel** (pour les retraiter),
**afin de** faire vivre mes états financiers **hors de l'application** — auprès de ma banque, de mon expert-comptable ou de mon associé — avec la garantie que le document remis dit **exactement** ce que dit la version figée, et qu'on puisse toujours savoir **d'où il sort**.

---

## Description

### Contexte

Tout est calculé, validé, figé et consultable ; **rien n'est transmissible**. La liasse (064/065) et le prévisionnel (069/070) ne sortent aujourd'hui qu'en **JSON**, derrière un JWT : illisible pour un banquier, inutilisable pour un expert-comptable. C'est le dernier maillon d'EPIC-014, et le dernier de la chaîne « balance → liasse → validation → prévisionnel → **restitution** » du Module 1.

Trois briques rendent cette story possible *maintenant*, et pas avant :

| Brique | Ce qu'elle apporte à l'export |
|---|---|
| **065** — snapshot immuable | l'objet auquel l'export doit être **fidèle** (FR-023 AC-3) |
| **137** — versions d'hypothèses append-only | le triplet `{snapshotId, versionHypothesesId, modeleVersion}` qui rend un prévisionnel exporté **reconstructible** (D1) — sans lui, un PDF de prévisionnel était un chiffre orphelin |
| **067** — piste d'audit append-only | le hook `export` **réservé** qui rend l'acte d'export **opposable** (D5) |

### Le vrai risque de cette story : un document qui *recalcule* au lieu de *restituer*

Exactement le piège de 072, en plus grave — parce qu'ici le résultat **quitte le système** et devient une pièce que quelqu'un signe, transmet ou dépose.

Trois façons de le rater, par ordre de gravité :

1. **Recalculer** au lieu de déléguer. Rappeler le moteur (ou pire, ré-agréger les `soldesN` du snapshot) « parce que c'est plus simple à mettre en page » ⇒ le PDF d'une version validée pourrait **diverger du snapshot** sans qu'aucune erreur ne le signale. **FR-023 AC-3 tombe** — et il tombe en silence.
2. **Se tromper d'unité.** Les montants sont en **unités mineures XOF** (= XOF × 100, cf. [`balance-canonique.ts`](../../balance-service/src/modules/balance/types/balance-canonique.ts) et les en-têtes de `bilan.types.ts`). Un export qui les imprime tels quels affiche **100 ×** le montant réel. Un total actif de `122 291,64` XOF sort en `12 229 164`. Personne ne le verra passer — sauf le banquier.
3. **Laisser croire qu'un brouillon est un document officiel.** FE-038 AC-3 l'exige explicitement : un brouillon exporté doit **se dénoncer lui-même**.

**Règles non négociables** — la story **délègue** aux services existants (`JeuEtatsService.consulter` / `consulterVersion`, `ProjectionService.projeter` / `projeterMensuel`), **ne rappelle jamais le moteur**, **ne réécrit aucune formule**, **n'ajoute aucune table de passage**. Elle **présente** ; elle ne **calcule** que des mises en forme.

### L'architecture qui rend ces règles vérifiables : modèle d'export pur → 2 rendus

Le réflexe naturel — « une fonction qui prend la liasse et écrit un PDF », puis une autre qui écrit un XLSX — produit **deux implémentations parallèles** de la même restitution, qui divergent dès la première correction. Et aucune des deux n'est testable autrement qu'en inspectant des octets.

**Structure imposée**, à deux étages :

```
liasse (064/065)  ─┐
                   ├─► modele-export.ts  ──►  DocumentExport  ──┬─► rendu-pdf.ts    ──► Buffer PDF
projection (069/70)┘   (PUR, sans I/O,       (structure          └─► rendu-excel.ts  ──► Buffer XLSX
                        sans Nest)            neutre)
```

`DocumentExport` — structure neutre, indépendante du format de sortie :

```ts
interface DocumentExport {
  titre: string;                 // « Liasse financière — exercice 2025 »
  statut: 'BROUILLON' | 'VERSION';
  metadonnees: LigneMeta[];      // { cle, valeur } — traçabilité (cf. AC-7)
  sections: SectionExport[];     // une par état : Bilan actif, Bilan passif, CR, SIG, TFT, Notes, Contrôles
}
interface SectionExport {
  titre: string;
  colonnes: ColonneExport[];     // { cle, libelle, type: 'TEXTE' | 'MONTANT' }
  lignes: LigneExport[];         // { cellules: Record<string, string | number | null>, emphase?: boolean }
}
```

Bénéfices, tous vérifiables : le **modèle est 100 % testable** (pur, déterministe, comparable au snapshot champ par champ) ; les **deux rendus sont fins** et ne peuvent plus diverger sur le fond ; l'**invariant P7** se tient tout seul (le modèle **itère** sur les postes reçus, il ne connaît aucun code `BZ`/`XI`/`CJ`) ; et un référentiel sans TFT ni notes (SFD-BCEAO) produit simplement des sections vides ou omises, **sans branche spéciale**.

### Ce que porte le document (les deux formats)

| Périmètre | Sections |
|---|---|
| **Liasse** | Bilan actif (Brut/Amort/Net N + Net N-1) · Bilan passif (N/N-1) · Sous-totaux du Bilan · Compte de résultat (produits, charges, totaux, résultat) · SIG · TFT (avec `statut` de ligne) · Notes annexes (total + ventilation par compte quand elle existe) · Contrôles de cohérence (code, catégorie, statut, écart) |
| **Prévisionnel** | Hypothèses appliquées · Ancres lues de la base · Projection annuelle N+1..N+3 (CR prévisionnel, plan de trésorerie, bilan simplifié + contrôle d'équilibre) · Plan de trésorerie **mensuel** 12 mois (les 12 périodes + articulation avec l'annuel) |

Les libellés viennent **du référentiel** (via les postes produits) ; aucun libellé comptable n'est écrit en dur dans le code d'export.

---

## Périmètre

**Inclus :**

- 2 endpoints `GET` sous `/bilan/export` : **liasse** et **prévisionnel**, chacun en `pdf` **et** `xlsx`.
- Modèle d'export pur + rendu PDF + rendu Excel (structure ci-dessus).
- Conversion **unités mineures → XOF** centralisée dans **une** fonction pure.
- Marquage **BROUILLON / VERSION N** (bandeau PDF sur **chaque page** + métadonnées Excel + nom de fichier).
- Bloc de **traçabilité** imprimé : référentiel `code@version` + checksum, `moteurVersion` (liasse) ou triplet `{snapshotId, versionHypothesesId, modeleVersion}` (prévisionnel), exercice, horodatage, auteur.
- **Audit** `EXPORT_EFFECTUE` (D5) : ajout de la valeur à `AuditType` + champ `contexte` additif sur `AuditEvent`, journalisé **après** génération réussie.
- Gate + isolation tenant fail-closed + anti-énumération + assainissement du nom de fichier + throttle propre à l'export.
- Documentation Swagger (`produces` binaire, codes d'erreur).

**Hors périmètre (hooks inertes documentés, jamais amorcés) :**

- **Archivage de l'artefact remis** (option (c) de D1) — **tranché : écarté**, cf. §[Points ouverts](#points-ouverts--à-trancher-hors-périmètre).
- Export **asynchrone** (job + lien de téléchargement) : bilan-service n'a **ni Redis ni BullMQ** ; la génération est synchrone (§[Décision 5](#d5--génération-synchrone-sans-job-sans-redis-sans-kafka)).
- Export de la **comparaison de scénarios** (071) et de la **comparaison inter-exercices** (074, S16).
- Envoi par e-mail, partage par lien, signature électronique, filigrane de confidentialité.
- **Gabarit officiel DSF/CERFA pixel-perfect** : v1 = restitution **fidèle, ordonnée et lisible**, pas un formulaire de dépôt (blocker MV, §[Points ouverts](#points-ouverts--à-trancher-hors-périmètre)).
- CSV, ODS, impression serveur, pagination configurable, choix de police/thème.

---

## Contrat d'API

### 1. Export de la liasse

```
GET /api/v1/bilan/export/etats/:jeuEtatsId?format=pdf|xlsx[&version=N]
```

| Paramètre | Règle |
|---|---|
| `jeuEtatsId` | ObjectId ; résolu **tenant-scoped** → autre org ou inexistant = **404 `JEU_ETATS_INTROUVABLE`** |
| `format` | **requis**, `pdf` \| `xlsx` (`@IsEnum`) ; toute autre valeur → **400** |
| `version` | optionnel, entier ≥ 1. Absent ⇒ **brouillon courant** (`consulter`, liasse produite à la volée). Présent ⇒ **snapshot figé** (`consulterVersion`) ; version inconnue → **404 `VERSION_INTROUVABLE`** |

### 2. Export du prévisionnel

```
GET /api/v1/bilan/export/previsionnel/:hypothesesId?format=pdf|xlsx[&versionHypotheses=N]
```

| Paramètre | Règle |
|---|---|
| `hypothesesId` | ObjectId ; tenant-scoped → **404 `HYPOTHESES_INTROUVABLE`** ; snapshot de base absent → **404 `BASE_INTROUVABLE`** |
| `format` | idem ci-dessus |
| `versionHypotheses` | optionnel, entier ≥ 1 (rejeu 137) ; inconnue → **404 `VERSION_HYPOTHESES_INTROUVABLE`** |

Le prévisionnel exporté contient **l'annuel ET le mensuel** : deux appels au `ProjectionService`, **le même** `versionHypotheses` passé aux deux — sans quoi le document mélangerait deux jeux de paramètres.

### Réponse (succès)

| En-tête | Valeur |
|---|---|
| `Content-Type` | `application/pdf` \| `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |
| `Content-Disposition` | `attachment; filename="<nom assaini>"` |
| `X-Content-Type-Options` | `nosniff` (helmet, déjà global — à **vérifier**, pas à supposer) |

Nom de fichier : `liasse-<exercice>-v<N>.<ext>` · `liasse-<exercice>-brouillon.<ext>` · `previsionnel-<nom-du-jeu>-v<N>.<ext>`.

Corps = `StreamableFile` (Nest). **Ne pas** injecter `@Res()` nu : cela court-circuite le filtre d'exceptions global et les erreurs sortiraient hors format.

### Erreurs — **ordre des contrôles imposé** (sécurité)

`validation DTO (400)` → `résolution tenant-scoped (404 générique)` → `résolution de version (404)` → `génération`.

Un format invalide doit être rejeté **avant** toute lecture en base : sinon le temps de réponse devient un **oracle d'existence** (le même piège qu'AC-7 de 071).

---

## Critères d'acceptation

- [ ] **AC-1 — Les 4 combinaisons produisent un fichier valide.** `{liasse, prévisionnel} × {pdf, xlsx}` répondent **200** avec le bon `Content-Type`, un `Content-Disposition: attachment` et un corps non vide. Le PDF commence par `%PDF-` ; le XLSX est un ZIP relisible par `exceljs` (`workbook.xlsx.load` ne jette pas).
- [ ] **AC-2 — Fidélité au snapshot (FR-023 AC-3), prouvée cellule par cellule.** Pour un jeu **validé**, l'export `xlsx` de `?version=N` relu par `exceljs` restitue, **poste par poste**, exactement les montants du `SnapshotLiasse` version N : Bilan actif (brut/amort/net N + net N-1), Bilan passif, sous-totaux, CR (produits/charges/totaux/résultat), SIG, TFT, totaux de notes, écarts de contrôles. **Aucune tolérance** : égalité stricte.
- [ ] **AC-3 — Zéro recalcul.** L'export passe **exclusivement** par `JeuEtatsService.consulter` / `consulterVersion` et `ProjectionService.projeter` / `projeterMensuel`. Aucun import de `BilanEngineService`, `*ProductionService`, `EvaluateurFormuleService`, `TableDePassageService`, `extraireAncres`, `bfr.ts` ni des `Projection*Service` **moteurs** dans le module d'export — vérifié par une **spec de garde exécutable** (lecture des sources du dossier `export/`, patron des specs de cohérence existantes).
- [ ] **AC-4 — Unités monétaires.** Tout montant affiché est converti **une seule fois**, par **une seule** fonction pure : PDF = chaîne formatée par **arithmétique entière** (quotient/reste — jamais de flottant), séparateur de milliers **espace insécable `U+00A0`**, 2 décimales, négatifs préfixés `-` ; Excel = cellule **numérique** `montant / 100` avec `numFmt` `'# ##0,00'` (une cellule texte est un échec : le retraitement est le but même du format). Les deux formats portent la mention **« Montants en XOF »**. `null` (N-1 absent) ⇒ cellule **vide**, jamais `0`.
- [ ] **AC-5 — Un brouillon se dénonce.** Sans `?version`, le document porte `statut: BROUILLON` : bandeau **« BROUILLON — NON FIGÉ »** sur **chaque page** du PDF, ligne équivalente dans les métadonnées Excel, et suffixe `-brouillon` dans le nom de fichier. Avec `?version=N` : mention **« VERSION N — figée le <valideAt> »**, aucun bandeau brouillon nulle part.
- [ ] **AC-6 — Agnosticisme référentiel (P7).** Aucun code de poste (`BZ`, `DZ`, `CJ`, `XI`, `RA`…) ni libellé comptable en dur dans le code d'export. Un référentiel **sans TFT, sans SIG, sans sous-totaux et sans notes** (cas SFD-BCEAO : listes vides) exporte **sans erreur** : les sections concernées sont omises ou explicitement marquées « non applicable », jamais remplies de zéros inventés.
- [ ] **AC-7 — Traçabilité imprimée (D1).** Les deux formats portent : organisation, exercice, statut, **référentiel `code@version` + checksum**, **`moteurVersion`** (liasse) ou **`modeleVersion` + `snapshotId` + `versionHypothesesId`** (prévisionnel), date de génération (ISO 8601 UTC), identifiant de l'auteur. La **mention de la version du modèle est explicitement exigée par D1** — son absence est un échec, pas un détail de présentation.
- [ ] **AC-8 — Audit de l'export (D5).** Un export **réussi** journalise **exactement un** `audit_events` de type **`EXPORT_EFFECTUE`**, keyé `tenantId`, portant `userId`, la cible (`jeux_etats` / `jeux_hypotheses` + id) et un `contexte` = `{ format, statut, version, snapshotId, versionHypothesesId, modeleVersion|moteurVersion, empreinte }`. Journalisation **après** génération réussie ; un export en échec ne journalise **rien** ; un échec d'audit **ne casse pas** l'export (patron `journaliser` sûr de 067). Aucun montant, aucune donnée financière, aucun secret dans le `contexte`.
- [ ] **AC-9 — Anti-énumération et gate.** Id d'une **autre organisation** → **404** générique, **jamais 403 ni 409**, et **identique** au 404 d'un id inexistant (corps compris). Gate refusé → **403** `EMAIL_NOT_VERIFIED | KYC_NOT_APPROVED | BILAN_NOT_ENTITLED`. Sans jeton → **401**. Un `format` invalide → **400 avant** toute requête base (aucun accès Mongo n'est déclenché).
- [ ] **AC-10 — Nom de fichier assaini.** Le libellé d'exercice et le nom du jeu d'hypothèses sont **saisis par l'utilisateur** : ils sont filtrés par **allowlist** `[A-Za-z0-9._-]` (le reste remplacé par `-`), longueur **bornée à 60**, et ne peuvent produire ni `\r`/`\n` (**injection d'en-tête HTTP**), ni `"`, ni `/`, ni `..`. Un exercice nommé `2025"\r\nSet-Cookie: x=y` produit un `Content-Disposition` **inoffensif** — test dédié obligatoire.
- [ ] **AC-11 — Déterminisme du contenu.** Deux exports successifs de la **même** version figée produisent un `DocumentExport` **identique** (`toEqual`) et la même `empreinte` sha256. Le contenu ne dépend ni de l'horloge ni de l'ordre d'itération d'une `Map`. *(L'égalité **octet à octet** des fichiers n'est **pas** exigée : PDF et XLSX embarquent une date de création — c'est l'`empreinte` du modèle canonique qui porte la preuve, cf. [D4](#d4--empreinte-du-modèle-plutôt-quarchivage-de-lartefact-option-c-de-d1--écartée).)*
- [ ] **AC-12 — Coût maîtrisé.** Les endpoints d'export portent un **throttle propre**, plus strict que le global (`@Throttle`, ex. 10/min/IP) : la génération est **CPU/mémoire-bornée mais coûteuse** au regard d'une lecture JSON. Une liasse complète (≈ 300 postes + notes) s'exporte en **< 3 s** et le processus ne conserve **aucun** buffer après réponse.

---

## Notes techniques

### Arborescence (nouveau dossier `export/`)

```
src/modules/bilan/export/
├── export.controller.ts          # 2 routes, gate, @Throttle, StreamableFile, Swagger
├── export.service.ts             # orchestration : délègue → modèle → rendu → audit
├── export.types.ts               # DocumentExport, SectionExport, ColonneExport, LigneExport
├── modele-liasse.ts              # PUR : LiasseProduite (+ méta) → DocumentExport
├── modele-previsionnel.ts        # PUR : ProjectionAnnuelle + ProjectionMensuelle → DocumentExport
├── montant.ts                    # PUR : unités mineures → XOF (texte entier + valeur Excel)
├── nom-fichier.ts                # PUR : assainissement allowlist (AC-10)
├── empreinte.ts                  # PUR : sha256 du modèle canonique (AC-11 / AC-8)
├── rendu-pdf.ts                  # pdfkit → Buffer
├── rendu-excel.ts                # exceljs → Buffer
├── export-agnosticisme.spec.ts   # spec de garde AC-3 + AC-6 (lit les sources)
└── dto/export-query.dto.ts       # format (requis) + version / versionHypotheses
```

### D1 — Délégation stricte (jamais de recalcul)

`ExportService` n'injecte que `JeuEtatsService`, `ProjectionService`, `AuditService`, et les deux rendus. **C'est tout.** La spec de garde `export-agnosticisme.spec.ts` lit les fichiers du dossier et échoue si un import interdit apparaît — c'est ce qui rend AC-3 vérifiable **par le CI**, pas par la vigilance du relecteur.

### D2 — Bibliothèques

| Besoin | Choix | Pourquoi |
|---|---|---|
| PDF | **`pdfkit@^0.19`** + **`@types/pdfkit@^0.17`** (dev) | JS pur, aucune dépendance native, polices standard embarquées, pagination automatique. **`puppeteer`/headless Chrome est exclu** : +300 Mo d'image, surface d'attaque et démarrage incompatibles avec `node:20-slim`. |
| Excel | **`exceljs@^4.4`** | **déjà utilisé par `balance-service`** (import Sage) — même version, cohérence d'écosystème, et l'API `workbook.xlsx.load` sert directement de **relecteur de test** pour AC-2. |

⚠️ **Deux pièges d'exécution :**

1. **Rebuild d'image obligatoire.** `docker-compose.override.yml` monte **`src/` seulement** : `node_modules` vient de l'image. Ajouter une dépendance sans `docker compose build bilan-service` donne un `Cannot find module 'pdfkit'` **à l'exécution seulement** — build TS et tests locaux restent verts. C'est exactement le genre d'écart que la vérif docker doit attraper.
2. **Encodage des polices standard.** pdfkit écrit les polices standard en **WinAnsi (CP1252)** : les accents français passent, l'**espace fine insécable `U+202F` n'existe pas** et sort en caractère parasite. Utiliser `U+00A0` (présent en CP1252) comme séparateur de milliers — cf. AC-4. Idem pour `≥`, `≈`, `—` : à éviter dans le rendu PDF.

### D3 — Audit : deux changements additifs

```ts
// audit.enums.ts — le hook « réservé » de 067 devient réel
export enum AuditType {
  …
  EXPORT_EFFECTUE = 'EXPORT_EFFECTUE',
}

// audit-event.schema.ts — champ additif, rétrocompatible
@Prop({ type: Object, default: null })
contexte?: Record<string, string | number | null> | null;
```

`audit_events` est **append-only** : ajouter un champ optionnel est sans risque (les documents antérieurs restent valides, `contexte` y est simplement absent). **Aucune migration** — cf. « migration = souci de prod, différé ». Le commentaire de l'enum doit être mis à jour : `import` reste réservé, `export` ne l'est plus.

L'appel se fait **au niveau du contrôleur** (patron « audit-hook-contrôleur » de 067) : la signature du service reste propre, et le service reste testable sans audit.

### D4 — Empreinte du modèle plutôt qu'archivage de l'artefact (option (c) de D1 → **écartée**)

D1 laissait ouverte l'option **(c) « figer l'artefact remis »** (stocker le PDF/XLSX dans MinIO + le hacher, patron de STORY-129). **Tranché ici : écartée pour 073**, remplacée par l'**empreinte sha256 du modèle d'export canonique**, journalisée dans l'audit.

| | Ce que ça coûte | Ce que ça apporte |
|---|---|---|
| (c) Stocker l'artefact | client MinIO, config, bucket, cycle de vie (rétention, purge, RGPD), URL présignées, +1 surface d'attaque — **bilan-service n'a aujourd'hui aucune de ces briques** | prouve *l'octet exact remis* |
| **Empreinte du modèle** *(retenue)* | ~20 lignes pures, testables | prouve *le contenu exact remis*, et (a)+D5 rendent déjà l'export **reconstructible** |

L'empreinte est calculée sur une **sérialisation canonique** du `DocumentExport` (clés triées, aucune date de génération dedans) — donc **stable et reproductible**, ce que le hash d'un PDF ne serait pas (date de création embarquée). C'est la formulation honnête : *« ce contenu-ci a été remis, produit par le modèle 1.0.0 à partir de ces entrées »*.

Si un besoin **légal** d'archivage apparaît (dépôt fiscal, contentieux), il fera l'objet d'une story dédiée qui branchera (c) sans rien remettre en cause ici.

### D5 — Génération synchrone, sans job, sans Redis, sans Kafka

FE-038 prévoit « sync **ou** async ». bilan-service n'a **ni Redis ni BullMQ** (pas de dossier `queue/`, pas de dossier `redis/`) et Kafka est le bus **inter-services** — l'y employer pour un export violerait l'invariant n°1. Les volumes sont bornés (une liasse ≈ quelques centaines de lignes, un prévisionnel ≈ 40) ⇒ **génération en mémoire, réponse directe**. Le front FE-038 encapsule déjà les deux modes : il consommera le mode synchrone sans modification.

**Hook inerte documenté** (à ouvrir seulement si le temps de génération dépasse ~10 s) : introduire `queue/` + BullMQ **dans le service** (jamais Kafka), endpoint `POST /bilan/export` → `202 { jobId }` + `GET /bilan/export/:jobId`.

### D6 — Ordre des routes

Le contrôleur est monté sur un préfixe **distinct** `bilan/export` (pas de collision inter-contrôleurs — la leçon de 071), et ses deux routes commencent par un **segment littéral** (`etats/`, `previsionnel/`) : aucun `@Get(':id')` ne peut les capter. Ne **jamais** ajouter ici une route paramétrée de premier niveau.

### D7 — Sécurité

- `@Roles(TENANT_ADMIN, TENANT_USER)` + `@RequiresBilanAccess()` sur les deux routes (comme 072).
- Résolution **tenant-scoped fail-closed** déléguée aux services existants ⇒ 404 générique gratuit (AC-9).
- **Assainissement du nom de fichier** (AC-10) : c'est la seule surface d'injection réellement nouvelle de la story — le libellé d'exercice et le nom du jeu d'hypothèses sont des chaînes libres saisies par l'utilisateur, réémises dans un **en-tête HTTP**.
- **Throttle dédié** (AC-12) — la génération est le premier endpoint du service dont le coût unitaire est significatif.
- Les logs d'export ne portent **ni montants, ni libellés de postes, ni contenu de document** : id, format, statut, durée.

---

## Dépendances

### Stories prérequises — **toutes livrées** ✅

| Story | Ce que 073 en consomme | Statut |
|---|---|---|
| **STORY-037** | gate `@RequiresBilanAccess` (email vérifié + KYC + entitlement) | ✅ done |
| **STORY-038** | `ReferentielLoader` — le `referentiel` + `checksum` imprimés en traçabilité | ✅ done |
| **STORY-059→063** | Bilan, CR, TFT, notes, contrôles de cohérence — **les sections du document** | ✅ done |
| **STORY-110→114** | SIG, sous-totaux, TFT indirect, notes v1 (B8) — sans elles le PDF serait une liasse tronquée | ✅ done (EPIC-011B clos) |
| **STORY-064** | `JeuEtatsService.consulter` → liasse **brouillon** produite à la volée + `version` courante | ✅ done |
| **STORY-065** | `consulterVersion` → **`SnapshotLiasse` figé** : l'objet de la fidélité AC-2, et `valideAt`/`moteurVersion`/`checksum` pour AC-7 | ✅ done |
| **STORY-066** | `Exercice` (libellé, dates) — l'axe métier affiché en en-tête | ✅ done |
| **STORY-067** | `AuditService.journaliser` **sûr**, `AuditType`, `AuditRepository` append-only — **le hook `export` que D5 impose de consommer** | ✅ done |
| **STORY-068** | `JeuHypotheses` (nom, `base`) — le prévisionnel exporté et son ancrage | ✅ done |
| **STORY-069** | `ProjectionService.projeter` + `MODELE_PROJECTION_VERSION` — section annuelle + AC-7 | ✅ done |
| **STORY-070** | `projeterMensuel` — section des 12 mois | ✅ done |
| **STORY-072** | patron de **façade qui délègue** (et son constat de revue : la liasse doit être projetée en forme canonique, pas ré-émise brute) | ✅ done |
| **STORY-137** | **`versionHypothesesId` + rejeu `?versionHypotheses`** — sans quoi un prévisionnel exporté ne serait pas reconstructible. **Prérequis dur posé par D1 : « à insérer avant 073, jamais après »** | ✅ done (PR #31) |

### Stories dont 073 ne dépend **pas** (à ne pas attendre)

| Story | Pourquoi c'est indépendant |
|---|---|
| **STORY-071** (comparaison de scénarios) | l'export de la comparaison est **hors périmètre** ; endpoint distinct, aucun couplage |
| **STORY-074** (comparaison inter-exercices, S16) | reportée au S16 ; réutilisera le modèle d'export posé ici, sans le modifier |
| **STORY-120/121/122** (SFD @2.0, Zone Franche, CIMA) | l'export est **agnostique** (AC-6) : il servira ces référentiels **sans une ligne de code** — c'est précisément ce que P7 achète |
| **balance-service** | aucune interaction : l'export part des soldes **déjà figés** dans le snapshot |

### Ce que 073 débloque

- **FE-038** (front, `prospera-frontend-expert-comptable`, sprint programme 8) — `ready-for-dev`, en attente de ce back. Le contrat livré ici (sync, 2 routes, `Content-Disposition`) est ce qu'il consommera.
- **Clôture d'EPIC-014** côté back (072 ✅ + 073 + 074 au S16) ⇒ **Module 1 complet** pour Money Vibes.
- Une éventuelle story d'**archivage légal d'artefact** (option (c)) — cadrée, chiffrée, mais **non ouverte**.

### Dépendances externes

- **npm** : `pdfkit`, `@types/pdfkit`, `exceljs` — registre vérifié joignable le 2026-07-24 (`0.19.1` / `0.17.6` / `4.4.0`).
- **Docker** : `docker compose build bilan-service` **obligatoire** après ajout des dépendances (cf. D2, piège n°1).
- **Aucune** variable d'environnement nouvelle, **aucun** topic Kafka, **aucune** collection nouvelle (seul `audit_events` gagne un champ optionnel).

---

## Plan de tests

### Unitaires (l'essentiel de la valeur — le modèle est pur)

| Cible | Ce qui est prouvé |
|---|---|
| `montant.ts` | `0`, `1`, `99`, `100`, `-12345678`, très grand entier, `null` ⇒ vide ; **jamais** de flottant dans le chemin PDF |
| `nom-fichier.ts` | CRLF, `"`, `/`, `..`, unicode, chaîne vide, > 60 caractères |
| `modele-liasse.ts` | sections/colonnes/lignes attendues ; N-1 absent ⇒ cellules vides ; référentiel **sans** TFT/SIG/notes/sous-totaux ⇒ sections omises ; ventilation de note rendue |
| `modele-previsionnel.ts` | 3 exercices + 12 mois ; métadonnées du triplet ; articulation restituée |
| `empreinte.ts` | stabilité (deux appels ⇒ même hash), sensibilité (un montant changé ⇒ hash différent), indépendance à l'ordre des clés |
| `export.service.ts` | délégation (services mockés, **appelés une fois chacun**), audit appelé **après** succès, **non** appelé sur échec, échec d'audit **non propagé** |
| `rendu-pdf` / `rendu-excel` | produisent un buffer du bon type ; le XLSX relu contient les valeurs **numériques** attendues avec le bon `numFmt` |

### e2e (`test/bilan-export.e2e-spec.ts`)

4 combinaisons en 200 · brouillon vs version (bandeau/métadonnées) · 404 autre org **identique** au 404 inexistant · 404 version inconnue · 400 format absent/invalide · 401 sans jeton · 403 gate refusé · `Content-Disposition` assaini · relecture `exceljs` du corps binaire.

⚠️ **Les modules e2e doivent déclarer tous les nouveaux providers** — trois modules e2e de 137 avaient 33 tests morts pour l'avoir oublié.

### Mutation-testing (table à **rejouer et à consigner** — chaque mutation doit virer au **rouge**)

| # | Mutation | Test qui doit tomber |
|---|---|---|
| M1 | retirer la division par 100 dans `montant.ts` | AC-4 (PDF et Excel) |
| M2 | remplacer `consulterVersion(v)` par `consulter()` (brouillon servi pour une version) | AC-2 (fidélité) + AC-5 |
| M3 | supprimer le bandeau BROUILLON | AC-5 |
| M4 | supprimer l'appel `journaliser` | AC-8 |
| M5 | journaliser **avant** la génération (donc aussi sur échec) | AC-8 |
| M6 | faire propager une erreur d'audit | AC-8 |
| M7 | retirer l'assainissement du nom de fichier | AC-10 |
| M8 | déplacer la validation du `format` **après** la lecture en base | AC-9 (oracle d'existence) |
| M9 | écrire les montants Excel en **texte** au lieu de numérique | AC-4 |
| M10 | rendre `0` au lieu d'une cellule vide pour un N-1 absent | AC-4 |
| M11 | importer `BilanEngineService` dans le dossier `export/` | AC-3 (spec de garde) |
| M12 | injecter la date de génération dans l'empreinte | AC-11 |

> **Rappel de méthode** (écart constaté sur 070/071/137) : la table de mutations n'est pas une intention — elle se **rejoue** et son résultat se **consigne** dans *Progress Tracking*. Un test écrit après coup passe au vert sans rien prouver ; seule la mutation prouve qu'il filtre. Bannir les assertions molles (`toBeDefined`, `expect.any(Number)`) sur les montants : **égalités exactes**.

### Vérification docker (obligatoire — cette story **écrit** en base)

073 écrit dans `audit_events`. La vérification par `mongosh` (stack neuve, `down -v`, JWT RS256 réel) doit établir :

1. `db.getCollectionNames()` d'abord (nommage explicite `snake_case` — une requête sur le mauvais nom rend `0` **sans erreur**).
2. Après un export réussi : **exactement 1** document `audit_events` `type: 'EXPORT_EFFECTUE'`, avec `tenantId`, `userId`, `cible`, `contexte` complet — et **aucun montant** dedans.
3. Après un export **en échec** (404) : **aucun** nouveau document d'audit.
4. **Compteurs identiques avant/après** sur `jeux_etats`, `snapshots_liasse`, `jeux_hypotheses`, `versions_hypotheses` — l'export n'écrit **rien** d'autre.
5. Le fichier téléchargé **depuis le conteneur** s'ouvre : PDF non vide, XLSX relu et **comparé au snapshot lu en base** (au moins total actif, total passif, résultat net, trésorerie de clôture).
6. Isolation : le jeton d'une **autre organisation** rend 404 sur les deux endpoints.
7. `docker restart bilan-service` avant de conclure quoi que ce soit — `nest --watch` peut annoncer « Found 0 errors » en exécutant encore l'ancien module, et l'ajout de dépendances impose de toute façon un rebuild.

---

## Definition of Done

- [ ] Lint **0 warning** (`./node_modules/.bin/eslint "{src,test}/**/*.ts" --max-warnings 0` — binaire **local**, jamais `npx`).
- [ ] `npm run build` OK.
- [ ] Couverture ≥ **65 branches / 90 fonctions / 90 lignes / 90 statements** — seuils **jamais** abaissés ; dossier `export/` **≥ 95 %** (code neuf, entièrement testable).
- [ ] Unitaires + e2e **verts**, y compris la non-régression 064/065/067/069/070/072/137.
- [ ] **Table de mutations M1→M12 rejouée**, résultat consigné dans *Progress Tracking*.
- [ ] **Vérification docker** réelle (7 points ci-dessus) consignée dans *Progress Tracking*.
- [ ] Swagger : les 2 endpoints documentés (formats produits, codes 200/400/401/403/404).
- [ ] Statut synchronisé **aux 3 endroits** : en-tête de ce document, `docs/sprint-status.yaml` (`status` + commentaire daté + `completed_date`), section *Progress Tracking*.
- [ ] Branche `MNV-073`, commits `MNV-073(export): …`, PR titrée `MNV-073(export): …`, **rebase-merge** sur `dev`, branche supprimée.

### ⛔ Fin de dev — CE QUE LE DÉVELOPPEUR NE FAIT PAS

**Le développement s'arrête à la branche poussée. Le dev ne merge JAMAIS sur `dev`, et n'intègre aucune PR.**

| Le dev fait | Le dev ne fait **pas** |
|---|---|
| brancher `MNV-073` **depuis `dev` à jour**, coder, committer, **pousser la branche** | pousser sur `dev` directement (`git push origin dev`) |
| ouvrir la PR (ou la laisser à ouvrir) et **s'arrêter là** | cliquer « Merge » / `gh pr merge` — même en « Rebase and merge » |
| signaler que la branche est prête | supprimer la branche, clôturer la story, passer le statut à `done` |

**Pourquoi c'est bloquant, pas cosmétique.** La revue de code, les **corrections d'office**, la vérification docker et la revue de sécurité s'exécutent **entre** la fin du dev et le merge. Une PR auto-mergée fait entrer dans `dev` du code que personne n'a relu — et les revues des stories 070/071/072/137 ont **toutes** trouvé au moins un constat bloquant, dont des tests à fausse assurance et une écriture hors transaction. Merger soi-même, c'est supprimer la seule porte qui les a attrapés.

> Constaté sur cette story même : la PR #32 a été ouverte **et mergée** par le dev avant toute revue, et le commit a aussi été poussé directement sur `dev`. Les correctifs de revue ont dû être réintégrés après coup, sur une branche distincte.

---

## Story Points Breakdown

| Poste | Points |
|---|---|
| Modèle d'export pur (liasse + prévisionnel) + montant/nom-fichier/empreinte | 2 |
| Rendus PDF + Excel | 1,5 |
| Contrôleur/service, audit `EXPORT_EFFECTUE` + champ `contexte`, Swagger | 0,5 |
| Tests (unit + e2e + mutations + spec de garde) et vérif docker | 1 |
| **Total** | **5** |

**Rationale :** deux formats de sortie mais **un seul** modèle intermédiaire, et **zéro** logique comptable nouvelle (tout est délégué). Le coût réel est dans la **preuve de fidélité** (AC-2, relecture XLSX) et dans les pièges de présentation (unités, encodage, nom de fichier) — pas dans la mise en page. 5 points restent justes ; 8 serait le signe qu'on a commencé à recalculer quelque chose.

---

## Points ouverts — à trancher hors périmètre

| # | Sujet | Position de cette story |
|---|---|---|
| **P1** | **Gabarit officiel DSF/CERFA.** Un dépôt fiscal exige la trame officielle (pagination, cadres, ordre imposé). | v1 = restitution fidèle et lisible. **Blocker MV** : validation du gabarit par un expert-comptable **avant** tout usage de dépôt. À chiffrer séparément. |
| **P2** | **Décimales XOF.** Le franc CFA n'a pas de subdivision en pratique, mais le pipeline stocke ×100 (source Sage à 2 décimales). | 2 décimales affichées — **fidèle à la donnée stockée**, aucune information perdue. Si l'expert tranche « francs entiers », c'est un changement d'**une** fonction (`montant.ts`). |
| **P3** | **Archivage de l'artefact remis** (option (c) de D1). | Écartée ici (D4), remplacée par l'empreinte du modèle. À ouvrir en story dédiée **si** un besoin légal apparaît. |
| **P4** | **Export asynchrone.** | Non nécessaire aux volumes actuels (D5). Hook documenté : BullMQ **dans le service**, jamais Kafka. |
| **P5** | **Export de la comparaison** (071) **et inter-exercices** (074). | Hors périmètre. Le `DocumentExport` est conçu pour les accueillir sans refonte — une section de plus. |

---

## Progress Tracking

**Historique de statut :**
- 2026-07-24 : créée (`defined`) par le Scrum Master — cadrage complet, dépendances vérifiées **toutes livrées**, options D1(c)/sync-async tranchées.
- 2026-07-24 : `in_progress` — développement (DeepSeek v4 Flash). ⚠️ Le dev a poussé **directement sur `dev`** et **auto-mergé la PR #32** avant toute revue (cf. §Fin de dev). Les correctifs de revue sont donc passés par une branche `MNV-073` distincte, ouverte depuis `dev`.
- 2026-07-24 : **revue de code — 7 constats bloquants + 8 majeurs, tous corrigés d'office** (détail ci-dessous).
- 2026-07-24 : **vérification docker** réelle (stack complète, JWT RS256 réel, 2 organisations).
- 2026-07-24 : revue de sécurité.
- 2026-07-24 : PR `MNV-073` rebase-mergée sur `dev` → `done`.

### Revue de code — constats **bloquants** (corrigés d'office)

| # | Constat | Pourquoi c'est bloquant | Correctif |
|---|---|---|---|
| **B1** | `empreinteDocument` utilisait `JSON.stringify(doc, Object.keys(doc).sort())`. Le 2ᵉ argument n'est **pas** un ordre de clés mais un **replacer récursif** : tout le contenu imbriqué — colonnes, lignes, **cellules, donc tous les montants** — disparaissait du hachage. | Deux liasses de montants **totalement différents** rendaient la **même** empreinte dès lors qu'elles partageaient leurs titres de sections. La preuve d'audit (D5) ne prouvait rien. | Canonisation **récursive** (clés triées à tous les niveaux, ordre des tableaux préservé) + tests de **sensibilité** (montant, libellé, section) |
| **B2** | Ligne « Sous-total Passif (**+ résultat**) » valorisée avec `controle.totalPassifN`, qui **exclut** le résultat (le moteur le porte à part). | Chiffre **faux sous un libellé mensonger**, sur un document remis à un banquier : passif affiché 100 000 face à un actif de 122 291,64. | Trois lignes distinctes : postes de passif (hors résultat), résultat de l'exercice, **total résultat inclus** = somme réelle. Équilibre actif/passif désormais visible **sur le document** |
| **B3** | `Trésorerie ancrée: 'Oui'/'Non'` placé dans une colonne de type `MONTANT`. | `formatMontantPDF('Oui')` → **« NaN,NaN »** dans le PDF, cellule `NaN` dans l'Excel. | Booléen déplacé dans les métadonnées + garde `estMontant` (seul un nombre **fini** est traité comme montant) + test « aucune cellule MONTANT non numérique » |
| **B4** | Bandeau « BROUILLON — NON FIGÉ » dessiné **une seule fois**, avant le contenu. | AC-5 exige *chaque page* : à partir de la page 2, un brouillon se présentait comme un document figé. | `autoFirstPage: false` + abonnement `pageAdded` **avant** la 1ʳᵉ page ; test comptant les occurrences **par page** |
| **B5** | `export.service.ts` (205 l.) et `export.controller.ts` (92 l.) à **0 % de couverture**, **aucun e2e**, alors que le message de commit annonçait « e2e verts ». | Orchestration, audit, délégation, gate et nom de fichier n'étaient couverts par **rien** — masqués par la couverture globale (94,98 %, au-dessus des seuils). 3ᵉ récidive du même angle mort. | `export.service.spec.ts` (12 cas), `export.controller.spec.ts` (8 cas), `test/bilan-export.e2e-spec.ts` (14 cas) |
| **B6** | Tests de rendu réduits à `expect(buffer.length).toBeGreaterThan(0)`. | **Fausse assurance** : aucune fidélité vérifiée (AC-2), aucun type de cellule (AC-4), aucune présence/absence de bandeau (AC-5) — un rendu cassé passait au vert. | Relecture **effective** du XLSX par `exceljs` (valeur, type, `numFmt`) et **extraction du texte** du PDF (fragments hexadécimaux recollés) |
| **B7** | `new Types.ObjectId(this.tenantContext.tenantId)` sans garde. | `new Types.ObjectId(undefined)` **fabrique un identifiant aléatoire** : l'audit aurait attribué l'export à une organisation et un utilisateur **inventés** ; une chaîne mal formée lève une erreur BSON ⇒ **500** au lieu d'un refus. | Patron maison `@CurrentUser()` + garde `isValid` ⇒ **403 `BILAN_NOT_ENTITLED`**, testée sur 5 cas |

### Revue de code — constats **majeurs** (corrigés d'office)

| # | Constat | Correctif |
|---|---|---|
| M1 | Sous-totaux du Bilan (`bilan.sousTotaux`, cascade B8 §4) **non exportés** | section « Bilan — Sous-totaux » |
| M2 | Actif et passif **fusionnés** dans une table unique, sans séparation quand le référentiel n'a pas de sous-totaux (cas SFD) | deux sections distinctes, invariantes du référentiel |
| M3 | **Code de poste absent** (seul le libellé était exporté) — retraitement Excel dégradé | colonne `Code` sur toutes les sections d'états |
| M4 | TFT **sans le statut de ligne** : `A_COMPLETER` (montant `null`) indistinguable d'un zéro | colonne `Statut` publiée |
| M5 | Notes réduites à leur total : la **ventilation par compte** de STORY-114 était invisible | postes + ventilation + marquage « détail à compléter » |
| M6 | Prévisionnel : `fluxNet` **non recomposable** (stocks, investissements, financement, remboursements absents) — l'invariant de contrat de 070 ; trésorerie annuelle, bilan simplifié et contrôle d'équilibre **absents** ; `produits = encaissementsClients` mal nommé | 7 sections complètes, mensuel scindé en 2 tables publiant **toutes** les composantes ; test de recomposition |
| M7 | Mention **« Montants en XOF » absente** des deux formats (AC-4) | ligne `Unité` dans les métadonnées |
| M8 | `@Controller('bilan/export')` sans `version: '1'`, `@ApiBearerAuth()` absent | aligné sur les 8 autres contrôleurs |
| M9 | `calculerLargeurs` : répartition en pourcentage fixe ⇒ largeur de libellé dérisoire, voire **négative** au-delà de 5 colonnes ; lignes écrites à `y` absolu ⇒ rangée coupée en deux par un saut de page | largeurs **par type** de colonne + `lineBreak: false` + saut de page contrôlé avant chaque rangée |
| M10 | Spec de garde AC-3 en `contenu.includes('bfr')` : **faux positif** sur un `bfrBase` simplement **lu** | garde réécrite sur les **instructions d'import** (imports de type admis, imports de valeur interdits) |
| M11 | Empreinte calculée sur un document **incluant la date de génération** | date ajoutée **après** hachage (`avecDateGeneration`) ⇒ déterminisme réel |
| M12 | Nom de fichier : `« Scénario » → « Sc-nario »` ; longueur bornée par partie mais pas au total | translittération NFD avant allowlist, longueur totale bornée, repli `export` |

### Résultats de qualité

- **Lint** : 0 warning (`eslint --max-warnings 0`, binaire local) · **Build** : OK
- **Couverture globale** : **98,38 / 91,98 / 98,42 / 98,36** (seuils 65/90/90/90) — le dossier `export/` passe de **73,2 %** (dont deux fichiers à **0 %**) à **99,5 / 87,77 / 100 / 99,48**
- **Tests** : **685 unitaires** (74 suites) + **170 e2e** (18 suites), tous verts — non-régression 064/065/067/069/070/072/137 incluse

### Table de mutations **rejouée** — 14/14 rouges

| # | Mutation | Verdict |
|---|---|---|
| M1 | division par 100 retirée (`montant.ts`) | ✅ rouge |
| M2 | version figée servie par le brouillon | ✅ rouge |
| M3 | bandeau posé une seule fois | ✅ rouge |
| M4 | journalisation d'audit retirée | ✅ rouge |
| M5 | audit **avant** génération (donc aussi sur échec) | ✅ rouge |
| M6 | échec d'audit propagé à l'appelant | ✅ rouge |
| M7 | assainissement du nom de fichier retiré | ✅ rouge |
| M8 | `format` rendu optionnel (lecture base avant validation) | ✅ rouge (e2e) |
| M9 | montant Excel écrit en **texte** | ✅ rouge |
| M10 | N-1 absent rendu `0` au lieu de vide | ✅ rouge |
| M11 | import d'un moteur de calcul dans `export/` | ✅ rouge |
| M12 | date de génération incluse dans l'empreinte | ✅ rouge |
| M13 | empreinte via le `replacer`-array d'origine (**le bug B1**) | ✅ rouge |
| M14 | total passif sans le résultat (**le bug B2**) | ✅ rouge |

### Vérification docker (stack complète, JWT RS256 réel, 2 organisations)

Conteneur **redémarré** avant toute conclusion (`nest --watch` peut annoncer « 0 errors » en servant encore l'ancien module) ; `pdfkit` et `exceljs` confirmés présents dans l'image.

| # | Contrôle | Résultat |
|---|---|---|
| ① | Export PDF d'une version figée | `200`, `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="liasse-2025-v1.pdf"`, `X-Content-Type-Options: nosniff`, magie `%PDF-1.3`, **3 pages** |
| ② | **Fidélité au snapshot (AC-2)** | snapshot en base `netN = 12229164` (unités mineures) → cellule XLSX **numérique** `122291.64`, `numFmt "# ##0,00"` ; `Total actif net` idem |
| ③ | **Équilibre publié (correctif B2)** | sur le document : actif `122 291,64` = passif hors résultat `100 000` + résultat `22 291,64` = **`122 291,64`** |
| ④ | **Bandeau brouillon (correctif B4)** | brouillon : 2 pages / **2 occurrences** « BROUILLON » ; version figée : 3 pages / **0 occurrence** |
| ⑤ | **Audit (D5)** | 6 documents `EXPORT_EFFECTUE` avec `tenantId`, `userId`, cible et contexte complet `{format, statut, version, snapshotId, versionHypothesesId, modeleVersion, moteurVersion, empreinte}` — **aucun montant** |
| ⑥ | **Déterminisme (AC-11)** | deux exports successifs de la même version ⇒ **même empreinte** ; PDF et XLSX du même contenu partagent l'empreinte (elle porte le **contenu**, pas les octets) |
| ⑦ | **Aucune écriture hors audit** | `jeux_etats` 5→5, `snapshots_liasse` 7→7, `versions_hypotheses` 8→8 ; seul `audit_events` croît (+1 par export réussi). Aucun événement pour un export **en échec** |
| ⑧ | **Anti-énumération** | jeu de l'org A vu par l'org B → **404** au corps **identique** à celui d'un id inexistant (`JEU_ETATS_INTROUVABLE`) ; idem prévisionnel (`HYPOTHESES_INTROUVABLE`) — jamais 403 |
| ⑨ | Gardes | `format` absent → **400** · `format=docx` → **400** · `version=99` → **404 `VERSION_INTROUVABLE`** · sans jeton → **401** |
| ⑩ | Prévisionnel | XLSX `previsionnel-Scenario-central-…-v1.xlsx`, **7 sections**, métadonnées portant le **triplet** `{snapshot, version d'hypothèses (id), version du modèle 1.0.0}` + `Unité` |

### Points remontés (hors périmètre, à trancher plus tard)

- **F1 — libellé du brouillon d'un jeu VALIDÉ.** Sans `?version`, l'export d'un jeu déjà validé porte « Brouillon — non figé ». C'est **exact** (le document n'est pas le snapshot) mais peut surprendre ; un libellé « vue recalculée — non figée » serait plus juste. Décision UX à prendre avec FE-038.
- **F2 — mise en page.** Le rendu est fidèle et lisible, ce n'est **pas** la trame officielle DSF/CERFA (cf. P1). Blocker MV inchangé : validation du gabarit par un expert-comptable avant tout usage de dépôt.
- **F3 — pas de test de charge.** AC-12 (< 3 s) n'est vérifié que sur des liasses de démonstration ; à re-mesurer sur une liasse réelle de ~300 postes avec notes ventilées.

**Effort réel :** dev externe + 1 passe de revue/correction (7 bloquants, 12 majeurs), 22 fichiers touchés, +3 fichiers de tests créés.

---

**Story créée avec la méthode BMAD v6 — Phase 4 (Implementation Planning)**
