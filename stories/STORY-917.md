# STORY-917 : Les recettes croisées sur le point de décision unique ; la console installe par le moteur

Status: done

**Complexité :** moyenne (cinq recettes réordonnées ou réécrites, six routes relayées)

**Épic :** EPIC-144, part de A (D-L2-2) — fusion conjointe avec B-945 (catalogue #55, fusionnée le 2026-11-16)
**Dépôts :** `prospera-recette`, `prospera-admin-panel-service`
**Plage :** groupe A, n° 13 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §2).
Fiche écrite pendant le codage (écart à la règle : la demande de B rendait les recettes rouges sur `dev`).

---

## Pourquoi

STORY-945 retire les quatre chemins d'octroi hors du moteur : l'échéance soldée n'ouvre plus rien (le module est
« acquis, à installer » à l'offre), le vertical et la propagation des packages n'ouvrent plus rien, et le `PUT` de la
console passe par un plan `CONSOLE_PUT` joué par le point de décision unique. Les recettes croisées sont rouges sur
`dev` depuis sa fusion (demande de B, journal de B ; `stories/STORY-945.md`, § Fusion).

## Ce que la story livre

1. **Recettes** (`prospera-recette`) :
   - `balance` avant `bilan` (dépendance dure, C1) : `atelier-balance`, `zone-franche`, `referentiel-par-dossier` ;
     `reseau` avant `microfinance` ;
   - `abonnement` (631, 280, 728) : après le paiement, chaque module du contrat est **acquis** à l'offre
     (`GET /api/v1/offres/{org}` : source `abonnement:<id>`, échéance couverte, palier), **aucun droit** n'existe ; le
     moteur l'installe (le `PUT` de la console, dépendances d'abord) et le droit naît `moteur:<plan>` avec le terme,
     l'échéance, le palier et les référentiels payés ;
   - 727 : un package modifié et le vertical d'une organisation **n'ouvrent plus rien** (FR-4) — prouvé par l'absence.
2. **BFF de la console** : l'offre et les plans d'installation relayés —
   `GET/PUT /admin/orgs/{orgId}/offre`, `POST/GET /admin/orgs/{orgId}/installations`,
   `GET …/installations/{planId}`, `POST …/installations/{planId}/reprendre`. Les refus du point de décision traversent
   **projetés** : liste fermée de codes, refus module par module, modules cités, `planId` — jamais le corps amont brut.
   `PUT /admin/orgs/{orgId}/entitlements/{moduleCode}` est **déprécié**.

## Décisions

- **D-917-1 — Le BFF expose le chemin du moteur, il ne réimplémente pas le `PUT`.** Le `PUT` du catalogue passe déjà
  par un plan (STORY-945) ; refaire dans le BFF « offre, plan, attente, relecture du droit » doublerait l'orchestration
  et perdrait la configuration (palier). L'ancienne route reste un relais, dépréciée, tant que la console n'a pas migré
  (D-L2-2) ; la migration des écrans est le lot de D (EPIC-144, écrans `AP-`).
- **D-917-2 — Un plan se lit par son organisation.** `GET …/installations/{planId}` et « reprendre » vérifient que le
  plan appartient à l'organisation de l'URL : sinon `404`, et rien n'est repris.
- **D-917-3 — Les recettes installent par le `PUT` de la console** (chemin servi par le moteur), avec les référentiels
  de l'acquis : c'est le geste de l'opérateur aujourd'hui.

## Critères d'acceptation

- **AC-1** : recettes `pile`, `zone-franche`, `atelier-balance`, `referentiel-par-dossier`, `abonnement` (631, 632,
  649, 650/651, 727, 728) **vertes depuis `dev`**, sur des images reconstruites.
- **AC-2** : un refus `MODULE_DEPENDANCE_MANQUANTE` traverse le BFF avec son code et ses `refus` ; un code hors liste
  ne traverse pas ; un plan d'une autre organisation rend `404`.

## Definition of Done

- [x] BFF : unitaires, lint, `tsc` verts (Node 24, étage `verification`).
- [x] Recettes vertes depuis `dev` (catalogue de 945).
- [x] PR code et docs fusionnées ; demande de B close dans son journal.

## Livraison (2026-11-16)

🏁 **DONE** — prospera-recette #22 (dev `97cf8d7`), admin-panel #35 (dev `f27d10a`). Recettes réordonnées sur les
dépendances du catalogue (balance → bilan → declarations ; reseau → microfinance) ; `abonnement` installe par le moteur
(acquis à l'offre, puis installation). BFF : 527 unitaires sous Node 24 ; six routes d'installation relayées, codes du
moteur en liste blanche. Recettes depuis `dev` vertes (87/87, `abonnement` 15/15 rejouée seule après une pile
recréée). La demande de B (945) est close.
