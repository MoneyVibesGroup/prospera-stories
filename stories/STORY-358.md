# STORY-358 : Les pièces se rattachent au dossier — statuts et carte CFE cessent de disparaître

**Epic :** EPIC-043 — Dossier client, unité de travail du cabinet
**Réf. :** ticket `TICKET-BACKEND-dossier-client-entite-de-premier-rang.md` — bloc **G** · décision **D5** *(rattachement additif)*
**Priorité :** Should Have
**Story Points :** 3
**Statut :** 📋 À faire
**Complexité :** low
**Créée le :** 2026-08-09
**Sprint :** 20
**Service :** `document-service`

---

## Le constat

Les statuts et la carte CFE déposés à la création d'un dossier sont lus par l'OCR (STORY-081), servent
à pré-remplir l'identité… puis **ne sont plus visibles nulle part**. Le parcours les avale.

C'est une perte réelle : un dossier qu'on défend devant un contrôle fiscal doit exposer les pièces qui
l'ont constitué, des années après, sans que personne n'ait à retrouver le fichier d'origine.

Aujourd'hui `document-service` porte trois familles — `documents`, `piece-extractions`,
`profil-extractions` — toutes rattachées à l'**organisation**. Le rattachement au dossier est
**additif** : l'org reste, le dossier s'ajoute.

---

## User Story

En tant que **collaborateur de cabinet**,
je veux **retrouver les pièces d'un dossier depuis ce dossier**,
afin de **justifier son identité fiscale sans chercher dans mes fichiers**.

---

## Ce que la story livre

- **`dossierId` optionnel** sur les documents et extractions — *optionnel*, parce que les pièces
  **KYC du cabinet** n'appartiennent à aucun dossier et ne doivent pas être forcées d'en avoir un.
  C'est l'application littérale de la nuance D5 : on ne re-scope que ce qui porte de la donnée de
  dossier.
- **`GET /dossiers/:dossierId/pieces`** — la liste des pièces d'un dossier : type, nom d'origine, date
  de dépôt, auteur, statut d'extraction OCR, et **URL présignée** de consultation.
- **Portée héritée du dossier** : un `TENANT_USER` non affecté → **404**. La règle vient du read-model
  `Dossier` (STORY-353), elle n'est pas réinventée ici.
- **Type de pièce** sur le document : `STATUTS`, `CARTE_CFE`, `LETTRE_MISSION`, `AUTRE`. La lettre de
  mission est **facultative** — D2 a tranché que l'attestation de mandat suffit ; elle est là pour les
  cabinets qui veulent la joindre.
- **Read-model `Dossier`** local, comme partout ailleurs : aucun appel REST sortant.

## Hors périmètre

- Les **pièces KYC du cabinet** : elles restent de niveau organisation, sans `dossierId`. D2 est
  explicite — le KYC ne descend pas au dossier.
- Les **livrables de l'exercice** (liasses figées, déclarations, accusés) : ils appartiennent à
  l'exercice, pas au dossier, et relèvent de `bilan-service` et du module Fiscalité (STORY-335).
- Le **pipeline OCR** lui-même (STORY-081, livré) : il ne change pas ; il propage simplement le
  `dossierId` reçu.
- L'URL présignée sur endpoint **public** : déjà corrigée par **STORY-352**.

---

## Acceptance Criteria

- [ ] Les trois familles acceptent un `dossierId` **facultatif** au dépôt ; une pièce KYC de cabinet
      déposée **sans** `dossierId` reste acceptée (**201**) et lisible comme avant.
- [ ] `GET /dossiers/:dossierId/pieces` rend les pièces du dossier, avec type, nom d'origine, date,
      auteur, statut OCR et **URL présignée** valide depuis un **navigateur** (endpoint public,
      STORY-352) — vérifié dans un vrai navigateur, pas au curl.
- [ ] Dossier d'une autre organisation, ou non affecté au collaborateur → **404**, corps identique.
- [ ] Déposer une pièce sur un dossier **archivé** → **409 `DOSSIER_ARCHIVE`** ; la **lecture** des
      pièces d'un dossier archivé reste **200** (D9 : les pièces restent opposables).
- [ ] Un `dossierId` inexistant ou appartenant à une autre org au dépôt → **404**, aucune écriture,
      aucun objet créé dans MinIO.
- [ ] L'événement `document.extrait` porte le `dossierId` quand il existe, pour que
      `dossier-service` puisse pré-remplir le bon dossier.
- [ ] Non-régression : le parcours KYC du cabinet (dépôt RCCM/CFE → revue → approbation) est
      **inchangé**, suite e2e verte sans réécriture.

---

## Notes techniques

- `dossierId` **optionnel** signifie qu'il ne peut pas être un `required` de schéma : la garde est
  applicative, et un index **partiel** `{ orgId: 1, dossierId: 1 }` sur les documents qui en portent un
  sert la lecture par dossier sans pénaliser les pièces KYC.
- Le contrôle « ce `dossierId` existe et appartient à mon org » se fait **sur le read-model local**,
  avant tout `putObject` : créer l'objet puis découvrir que le dossier n'existe pas laisserait un
  orphelin dans MinIO, exactement le cas que STORY-011 avait pris soin d'éviter (ordre `putObject` →
  persistance, et rien avant validation).
- La clé de stockage devient `dossiers/{orgId}/{dossierId}/{uuid}` pour les pièces de dossier, et reste
  `kyc/{orgId}/{uuid}` pour le KYC — **jamais** le nom du fichier client, règle inchangée depuis
  STORY-011.

---

## Dépendances

**Prérequises :** **STORY-301** *(dossier)* · **STORY-353** *(portée)* · **STORY-352** ✅ *(endpoint
public — sans elle, l'URL présignée serait inutilisable au navigateur)*.
**Liée :** **STORY-081** ✅ *(OCR statuts + CFE — c'est son dépôt qu'on rattache)*.

---

## Definition of Done

- [ ] Lint 0 · build OK · couverture ≥ seuils.
- [ ] e2e : dépôt avec et sans `dossierId`, lecture par dossier, 404 de portée, 409 archivé, absence
      d'orphelin MinIO sur `dossierId` invalide.
- [ ] Vérification **navigateur réel** de l'URL présignée (pas seulement curl) — la leçon de FE-023 et
      de STORY-179/352.
- [ ] `/code-review`.

---

## Story Points Breakdown

- Champ + index partiel + convention de clé : 0,5 pt
- `GET /dossiers/:dossierId/pieces` + présignature + portée : 1 pt
- Gardes (dossier inexistant avant `putObject`, archivage) + propagation dans `document.extrait` : 1 pt
- Tests + vérification navigateur : 0,5 pt
- **Total : 3 points**
