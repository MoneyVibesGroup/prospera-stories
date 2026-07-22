# STORY-129 : Identité visuelle du cabinet — logo téléversable + couleur de marque sur l'organisation

**Epic :** EPIC-002 — Organisations & profil (auth-service)
**Réf. architecture :** `architecture-auth-service-2026-07-04.md` § organisations ; `architecture-kyc-service-2026-07-03.md` § stockage MinIO (patron d'upload à recopier)
**Priorité :** Should Have
**Story Points :** 5
**Statut :** defined 📝
**Sprint :** 16 (proposé)
**Créée le :** 2026-07-22
**Services :** `auth-service` (:3001) + stockage objet (MinIO, déjà en place pour le KYC)
**Couvre :** demande PO du 2026-07-22 (« je dois pouvoir téléverser le logo du cabinet et choisir sa couleur »)

---

## User Story

En tant qu'**administrateur de cabinet**,
je veux **téléverser le logo de mon cabinet et choisir sa couleur**,
afin que **mon espace et surtout mes documents produits portent mon identité, et non une marque générique.**

---

## Description

### Constat

`OrganizationResponseDto` porte exactement `id, name, slug, phone, country, address, status`.
**Aucun champ visuel**, et aucune route d'upload sur ce service. `PATCH /organizations/me` accepte
`name, phone, country, address` (whitelist stricte : tout autre champ ⇒ 400).

Or l'identité visuelle n'est pas cosmétique pour ce produit : le livrable d'un cabinet, c'est un **bilan
remis à un client**. Un cabinet qui envoie une liasse sans son logo diffuse la marque de son outil à la
place de la sienne.

### Ce que la story change

L'organisation porte `logoUrl` et `brandColor`. Le logo suit le **même chemin de stockage que les pièces
KYC** (MinIO), déjà éprouvé dans l'écosystème.

### Portée d'usage (à respecter côté consommateurs)

La couleur habille **le logo par défaut, l'en-tête des exports PDF et la signature des documents produits**.
Elle **ne repeint pas la navigation de Prospera** : sinon chaque cabinet redéfinit l'ergonomie du produit, et
les règles de contraste du design system ne tiennent plus.

---

## Scope

**Inclus**

- Champs `logoUrl?: string` et `brandColor?: string` sur `Organization` + exposition dans
  `OrganizationResponseDto`.
- `brandColor` accepté par `PATCH /organizations/me`, **validé** (hexadécimal `#RRGGBB`).
- `POST /organizations/me/logo` (multipart) : upload vers MinIO, remplacement de l'existant.
- `DELETE /organizations/me/logo` : retour aux initiales.
- Contraintes de fichier : **PNG, JPG ou SVG**, **1 Mo max**, dimensions raisonnables — refus explicite
  (415 / 413) avec un message exploitable par l'UI.
- Réservé au `TENANT_ADMIN` (403 sinon), comme le reste de `PATCH /organizations/me`.

**Hors périmètre**

- Application effective aux exports PDF (le service Bilan les produit — story à ouvrir quand l'export
  existera).
- Thème complet par cabinet (police, couleurs secondaires) : hors sujet, et contraire à la règle ci-dessus.

---

## Acceptance Criteria

- **AC-01** — `POST /organizations/me/logo` avec un PNG de 300 Ko → **201/200**, et `GET /organizations/me`
  renvoie un `logoUrl` qui affiche l'image.
- **AC-02** — Un fichier de **2 Mo** est refusé (**413**) ; un `application/pdf` est refusé (**415**) — avec
  un message que l'UI peut afficher tel quel.
- **AC-03** — Un **SVG** est accepté mais **assaini** (pas de `<script>`, pas de référence externe) — un SVG
  est du code exécutable dans un navigateur : c'est le point de sécurité de la story.
- **AC-04** — `PATCH /organizations/me { brandColor: "#0F766E" }` → **200** ; `{ brandColor: "rouge" }` →
  **400**.
- **AC-05** — Un `TENANT_USER` ne peut ni téléverser, ni supprimer, ni changer la couleur : **403**.
- **AC-06** — `DELETE /organizations/me/logo` remet `logoUrl` à vide et l'ancien objet est supprimé du
  stockage (pas de fichier orphelin).
- **AC-07** — **Isolation** : le logo d'une organisation n'est jamais accessible via l'identifiant d'une
  autre.

---

## Technical Notes

- **Recopier le patron d'upload KYC** (validation de type réelle par signature de fichier, pas seulement par
  extension ; nommage par `orgId` ; stockage privé + URL de lecture).
- **SVG** : soit assainissement à l'entrée, soit servir le fichier avec `Content-Disposition: attachment` et
  un `Content-Security-Policy` strict. Trancher explicitement — ne pas laisser passer un SVG brut sur une
  origine de confiance.
- `logoUrl` : décider entre URL publique stable et URL présignée courte. Le logo est peu sensible, mais la
  cohérence avec le reste du stockage compte — documenter le choix.
- Événement `identity.organization.updated` s'il existe déjà (patron STORY-023) : y inclure les nouveaux
  champs pour que les read-models suivent.

---

## Dependencies

- **Bloque** : **FE-023** (carte « Identité visuelle » du profil du cabinet).
- **Cohérent avec** : STORY-023 (`PATCH /organizations/me` + outbox) — même surface, même patron.

---

## Definition of Done

- 7 AC passent, **AC-03 (SVG) revu spécifiquement** — c'est le seul risque de sécurité de la story.
- OpenAPI à jour (champs + routes) ; types régénérables côté frontend.
- Aucun fichier orphelin après suppression (vérifié sur MinIO).

---

## Progress Tracking

**Status History :**
- 2026-07-22 : Créée (Scrum Master) — demande PO formulée sur la maquette FE-015 ; écart confirmé dans
  `OrganizationResponseDto` (aucun champ visuel, aucune route d'upload sur ce service).

---

**Cette story a été créée avec la BMAD Method v6 — Phase 4 (Planification d'implémentation).**
