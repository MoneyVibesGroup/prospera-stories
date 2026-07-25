# STORY-121 : **Référentiel Zone Franche Togo** `@1.0` — présentation SYSCOHADA + paquet fiscal dérogatoire — FR-005/FR-007

**Epic :** EPIC-010 — Référentiels & table de passage (bilan-service) — **extension**
**Service :** `bilan-service` (relying party, :3004, base `bilan_service`)
**Réf. PRD :** `docs/prd-bilan-service-2026-07-10.md` §FR-005 (chargement du référentiel actif) / §FR-007 (multi-référentiel, même code)
**Réf. analyse :** `docs/analyse-referentiels-sfd-zonefranche-cima-2026-07-21.md` §2 · `docs/referentiels/README-zone-franche-togo.md`
**Réf. code livré :** STORY-056 (SYSCOHADA packagé) · STORY-038 (loader/registre) · paquet fiscal Togo (`paquet-fiscal-togo-2026.json`)
**Priorité :** Could Have
**Story Points :** 3
**Statut :** done ✅ — clôturée le **2026-07-25** (AC-1 → AC-4 validés + vérif docker ; AC-5 = hook inerte EPIC-013)
**Assigné à :** vivianMoneyVibesGroupes
**Créée :** 2026-07-21
**Sprint :** 15 (ajout hors engagement initial — extension EPIC-010/FR-007)

---

## User Story

**En tant qu'**entreprise agréée en **Zone Franche togolaise** (statut d'Entreprise Franche),
**je veux** un référentiel qui produise ma liasse **exactement comme en SYSCOHADA révisé** mais qui porte mon **régime fiscal dérogatoire** (barème IS dégressif, exonérations),
**afin de** dériver plus tard un **prévisionnel d'impôt** conforme à mon agrément, sans fork de code (P7).

---

## Description

### Nature (⚠️ lire avant de coder)
La Zone Franche est un **régime FISCAL et douanier dérogatoire**, **pas un plan comptable**. Une entreprise franche tient sa comptabilité en **SYSCOHADA révisé**. Sur **décision utilisateur (2026-07-21)**, elle est néanmoins packagée comme **référentiel pluggable distinct** (4ᵉ référentiel), pour être sélectionnable/attribuable comme les autres.

### Modélisation honnête (aucune donnée comptable inventée)
- **plan / postes / table de passage** = **sources SYSCOHADA révisé réutilisées** (`plan-comptable-syscohada.json`, `postes-syscohada-guidef-togo.json`, `table-de-passage-syscohada.json`, `notes-syscohada.json`) → la **liasse est identique** à SYSCOHADA.
- **`paquetFiscal` propre** = `paquet-fiscal-togo-zonefranche.json` : **barème IS dégressif** (0 % ans 1-5 · 8 % ans 6-10 · 10 % ans 11-20 · 20 % dès 21), taxe dividendes (exonérée 5 ans puis 50 %), exonérations TVA / fiscalité de porte — `pays=TG`, `regime=zone-franche`. Sources publiques (investissement.gouv.tg, OTR, MCA-Togo) — **à valider/actualiser par un fiscaliste** (évolue avec la loi de finances).

Ce qui **distingue** ce référentiel du SYSCOHADA de droit commun = **son seul paquet fiscal**. Le `paquetFiscal` est **optionnel** pour le moteur d'états (non requis par la liasse) ; il sera consommé par le **prévisionnel** (EPIC-013, impôt prévisionnel).

---

## Scope
**Dans le périmètre :** source `paquet-fiscal-togo-zonefranche.json` ; entrée `zone-franche-togo@1.0` dans `build.mjs` (réutilise les sources SYSCOHADA + fiscal propre) + `ReferentielRegistry` ; spec de cohérence (présentation = SYSCOHADA à l'identique + paquet fiscal `regime=zone-franche`).
**Hors périmètre :** **consommation du barème dégressif par le prévisionnel** (calcul IS par ancienneté) = EPIC-013 ; variantes régionales Plateaux/Centrale/Kara/Savanes (paramétrées, non calculées) ; conditions d'agrément SAZOF (métier, hors moteur) ; vérif docker de la production.

---

## Acceptance Criteria
- [x] **AC-1 — Packagé & chargeable.** `resolve('zone-franche-togo','1.0')` ≠ null ; `load` OK ; checksum vérifié. **Prouvé en docker** : `GET /bilan/referentiel` → `zone-franche-togo@1.0`, `integrity: "verified"`, plan 174 / postes 163 / mapping 124.
- [x] **AC-2 — Présentation = SYSCOHADA à l'identique.** ⚠️ **Critère renforcé en cours de route** : l'égalité des seules **longueurs** ne prouvait rien (une règle permutée passait au vert — mutation-test à l'appui). Remplacé par une **identité profonde** des 5 volets (`planDeComptes`, `postes`, `tableDePassage`, `notes`, `regles`) + rattachement du compte `601` identique.
- [x] **AC-3 — Paquet fiscal dérogatoire présent.** `_meta.regime === 'zone-franche'`, `pays === 'TG'`, **et le barème lui-même** : 4 paliers `0 / 8 / 10 / 20 %`, taux strictement croissants, tous sous le droit commun (borne **épinglée** à 27 %), paliers contigus depuis l'année 1, dernier palier ouvert.
- [x] **AC-4 — Déterminisme (CC3) & non-régression.** checksum registre = sha256 artefact ; SYSCOHADA `@2.1` **inchangé** — digest **épinglé** à sa valeur historique `01b892c0…` plutôt que comparé au registre (un artefact modifié *et* son registre réalignés s'accordaient entre eux).
- [ ] **AC-5 — Prévisionnel dérogatoire → HOOK INERTE `EPIC-013`.** Hors périmètre de cette story (cf. *Scope*) : le barème n'est **consommé par aucun code** aujourd'hui. STORY-121 en livre le **contrat vérifié** (paliers contigus, couvrant l'ancienneté 1..∞) pour que le calcul d'impôt prévisionnel d'EPIC-013 s'y branche sans re-modélisation. **Ne bloque pas la clôture.**

---

## Definition of Done
- [x] Lint 0 warning · build OK · couverture **98.38 / 91.98 / 98.42 / 98.36** (seuils 65/90/90/90) · **704 unit + 170 e2e** verts.
- [x] AC-1 → AC-4 validés ; **vérif docker réelle faite** ; AC-5 = hook inerte EPIC-013 (hors périmètre).
- [x] Non-régression SYSCOHADA (checksum `01b892c0…` intact, désormais **épinglé**).
- [x] Revue + revue de sécurité (**0 vulnérabilité**) ; PR `MNV-121` #35 **rebase-mergée** sur `dev`, branche supprimée.

---

## Progress Tracking

**Status History :**
- 2026-07-21 : Créée (décision utilisateur : zone franche = référentiel distinct) par vivian.
- 2026-07-21 : **Incrément 1 livré** — `defined → in_progress`.
- 2026-07-25 : **Incrément 2 livré et prouvé** — AC-2/AC-3/AC-4 passés d'assertions molles à des preuves (identité profonde, barème vérifié, digest épinglé), 3 mutation-tests rouges puis restaurés, portes de qualité vertes, **vérification docker réelle** (liasse calculée et équilibrée). `in_progress → review`.
- 2026-07-25 : **Clôturée** — PR #35 rebase-mergée sur `dev` après revue de sécurité (**0 vulnérabilité**) ; un constat de revue corrigé au passage (borne de droit commun épinglée). AC-5 explicitement **démoté en hook inerte EPIC-013**, ce qui lève l'incohérence de cadrage (il figurait en critère alors que le *Scope* le mettait hors périmètre). `review → done`.

**Incrément 1 (fait) :** `zone-franche-togo@1.0` packagé — présentation SYSCOHADA réutilisée (**174** comptes / **163** postes / **124** règles, égaux au SYSCOHADA) + `paquetFiscal` dérogatoire propre. Artefact `zone-franche-togo-1.0.json` sha256 `ecbd01e2…`. Spec : mapping `601` **identique** à SYSCOHADA + `regime='zone-franche'` **verts**. Non-régression SYSCOHADA (`01b892c0…` inchangé).

**Incrément 2 (LIVRÉ 2026-07-25) — les critères passent de « asserté » à « prouvé ».**

Le paquet de l'incrément 1 était **correct** (l'identité de présentation vérifiée a posteriori est bien byte-à-byte), mais ses **preuves** ne tenaient pas :

| AC | Assertion d'origine | Ce qu'elle laissait passer |
|---|---|---|
| AC-2 | `postes.length` + `tableDePassage.length` + 1 compte | une règle **permutée**, un poste réaffecté, un marqueur `role`/`tresorerie` perdu — longueurs inchangées |
| AC-3 | `_meta.regime` seul | **le barème n'était testé nulle part**, alors qu'il *est* la raison d'être du référentiel |
| AC-4 | — | un artefact SYSCOHADA modifié **et** son registre réalignés s'accordaient entre eux |

Corrigé en **données de test uniquement** — `git diff` = **1 fichier de spec** ; les 5 artefacts restent byte-identiques (zone-franche `ecbd01e2…`, SYSCOHADA `01b892c0…`, SFD `0509a034…`/`07b4ec22…`, CIMA `1f36250c…`).

**Mutation-tests (rouges puis restaurés)** — chaque mutation propagée au checksum du registre pour que l'échec vienne du *comportement*, pas d'un `ReferentielIntegrityError` :

| Mutation | Résultat |
|---|---|
| 2 règles de passage permutées (`AH`↔`AN`, longueurs constantes) | **seule** l'identité profonde rougit ; CC1/CC2/CC3 **et les assertions de longueur d'origine restent vertes** ⇒ preuve directe que l'ancien test était une fausse assurance |
| barème IS saisi à l'envers (`20/10/8/0`) | AC-3 rouge |
| SYSCOHADA modifié **avec** registre réaligné | AC-4 rouge (CC3 **reste verte** ⇒ d'où l'épinglage) |

**Vérification docker réelle (stack `docker compose`)** — artefact confirmé côté conteneur : `src/` **et** `dist/` = `ecbd01e2…`.

```
GET  /api/v1/bilan/referentiel
  → zone-franche-togo@1.0 · checksum ecbd01e2… · integrity "verified"
    plan 174 / postes 163 / mapping 124        (= SYSCOHADA, AC-1 + AC-2 au runtime)

POST /api/v1/bilan/etats/bilan/dry-run         (balance équilibrée 18 000 000, avant affectation)
  sousTotaux  : AZ=10 000 000 · BZ=15 000 000 · DZ=15 000 000
  coherenceST : ecartEquilibre=0 · equilibre=true · coherent=true
                ← bz/dz NON NULS : contrôle APPLICABLE, pas vert par non-applicabilité (piège 120)

POST /api/v1/bilan/etats/controles/dry-run
  valide=true · EQUILIBRE_BILAN OK (0) · COHERENCE_RESULTAT OK (0) · ARTICULATION_NOTES OK
  VARIATION_TRESORERIE INDETERMINABLE (pas de N-1)

POST /api/v1/bilan/etats/compte-resultat/dry-run
  SIG XA..XI calculés · resultatNetSig = resultatNetDirect = 1 000 000 · écart 0
```

⇒ la liasse d'une entreprise franche est **calculée de bout en bout et équilibrée**, à l'identique du droit commun.

**⚠️ Constat remonté — pré-existant, NON introduit par 121 (F1/F4 de STORY-112, confirmé par la mesure).**
Sur une balance dont les immobilisations tombent sur les **postes fins**, `AZ = 0` et `BZ` sous-compte ⇒ `equilibre=false`. Cause : les agrégats de la chaîne `AZ = AD+AI+AP+AQ` sont soit **masqués** par un préfixe plus long, soit perdus sur **égalité de préfixe** — le mapper ne rattache un compte qu'à **un seul** poste (le préfixe le plus long) :

| Agrégat | Préfixe | Concurrent |
|---|---|---|
| `AD` | `21` | masqué par `AE=211`, `AF=212/213`, `AG=215/216`, `AH=214/217/218` |
| `AI` | `22` / `23` / `24` | **égalité** avec `AJ=22` ; masqué par `AK`/`AL` ; masqué par `AM`/`AN` |
| `AP` | `251` / `252` | **aucun — seul agrégat réellement atteignable** |
| `AQ` | `26` / `27` | **égalité** avec `AR=26`, `AS=27` |

**Contrôle exécuté** : la **même** balance sous `syscohada-revise@2.1` donne un résultat **identique** (`AZ=0`, `equilibre=false`) ⇒ la zone franche n'introduit rien ; c'est la table AMORCE. Mérite **sa propre story** (blockers F1 expert / F4 jeu d'essai réel).

**⚠️ Second constat — hygiène de vérification.** `OrgKycStatus` et `OrgBilanEntitlement` n'ont **pas** de `@Schema({ collection: … })` explicite, contrairement à la convention du projet : le service lit les **pluriels Mongoose** (`orgkycstatuses`, `orgbilanentitlements`) alors que `bilan_service` porte *aussi* des collections `org_kyc_status` / `org_bilan_entitlements` **mortes** (jamais lues). Écrire dans les secondes en croyant appliquer la convention snake_case donne un `403 KYC_NOT_APPROVED` sans erreur — piège rencontré et contourné pendant cette vérif.

**Reste (hors périmètre, non bloquant) :** consommation du barème par le **prévisionnel** (EPIC-013, AC-5) · **validation fiscaliste** du barème et des durées de paliers (évoluent avec la loi de finances).

---

**Story créée avec la méthode BMAD v6 — extension EPIC-010 (FR-005/FR-007).**
