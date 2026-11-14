---
baseline_commit: ea879c653da4d4a1dfaf0b30a1b5bd3335b91f9a
---

# STORY-362 : Implantations multiples — un dossier peut être imposé dans plusieurs pays

Status: ready-for-dev

**Complexité :** medium

**Épic :** EPIC-028 — Implantations multiples et catalogue d'obligations dérivé *(recadré le 2026-08-09)*  
**Service :** `fiscal-service` (dépôt `prospera-fiscal-service`, base `origin/dev`)  
**Points :** 5 · **Sprint :** S24 du tracker ; groupe B du plan du 14/11  
**Assigné à :** Dev B  
**Réf. :** STORY-302 (volet abandonné à la scission) · ticket `TICKET-BACKEND-dossier-client-entite-de-premier-rang.md` (D10) · spine fiscal AD-7, AD-13 · FR-F01, FR-F02, FR-F05  
**Prérequis :** STORY-302, 304 (`dossier-service`, livrées) · STORY-299 (journal chaîné) · STORY-300 (droits fiscaux)

---

## User Story

En tant que **collaborateur de cabinet**, je veux **déclarer plusieurs implantations pour un même
client**, afin que **chaque contexte national ait son identité fiscale et ses obligations propres**.

## Le constat (2026-08-09, inchangé)

STORY-302 portait deux choses de moments différents : le type d'entité et le pays du dossier
(préalable, parti au socle `dossier-service` avec D10 « un seul pays en v1 ») et la capacité d'un
dossier à porter N implantations — l'enrichissement qui reste ici. Sans cette story, le
multi-implantation disparaissait du plan.

## Décisions confrontées au code réel (2026-11-14)

- **Le dossier vit chez `dossier-service`** ; `fiscal-service` en a un read-model (`dossiers_fiscaux` :
  pays, type d'entité, statut `ACTIF`/`ARCHIVE`) et lit son NIF (`nifSociete`) par `SourceDossier`,
  qui porte aussi la **portée** de l'appelant.
- **Promotion sans migration** : l'**implantation principale** n'est pas stockée, elle est
  **dérivée** du dossier à la lecture (pays, type d'entité, NIF du dossier) — aucune reprise de
  données, aucune copie qui pourrait diverger. Les implantations **stockées** sont les autres pays :
  une implantation dans le pays du dossier est refusée (`IMPLANTATION_EXISTANTE`, 409).
- **NIF normalisé** comme chez `dossier-service` (espaces retirés, majuscules) ; unique sur
  `(orgId, pays, identifiantFiscalNormalise)` ; une seule implantation ACTIVE par
  `(dossier, pays)`.
- **Aucune obligation n'existe encore** (STORY-305) : « chaque implantation porte ses obligations
  sans mélange » se livre comme **clé d'implantation stable** (`implantationId`, et `principale` pour
  le pays du dossier) et code de paquet propre à chaque implantation
  (`fiscal-<pays>-<type>`, fonction de STORY-298 réutilisée) ; 305 dérivera par implantation.
- **Clôture** pour cessation : `CLOTUREE`, date et motif (motif au journal par son empreinte),
  définitive (409 `IMPLANTATION_CLOTUREE` ensuite) ; rien n'est supprimé.
- **Journal** : `IMPLANTATION_DECLAREE`, `IMPLANTATION_CLOTUREE` au journal chaîné
  `implantation:<id>`, dans la transaction de l'écriture (STORY-299).
- **Droits** (STORY-300) : déclarer ⇒ `preparer` ; clôturer (arrête toute dérivation future) ⇒
  `valider`.
- **Aucun secret de portail** (AD-13) : le DTO refuse tout champ inconnu (`forbidNonWhitelisted`) et
  un test au schéma échoue si un champ d'accès (mot de passe, identifiant de portail, certificat,
  jeton) apparaît.

## Critères d'acceptation

- [ ] **AC-1** — Un dossier porte N implantations, chacune avec pays, type d'entité, identifiant
  fiscal et régimes ; la liste rend l'implantation principale (dérivée du dossier) puis les autres.
- [ ] **AC-2** — Un dossier Togo + Bénin : deux implantations distinctes, chacune avec son
  identifiant, son code de paquet (`fiscal-tg-…`, `fiscal-bj-…`), sans mélange.
- [ ] **AC-3** — Le dossier mono-pays existant devient sa première implantation sans reprise de
  données (lecture seule).
- [ ] **AC-4** — Une implantation clôturée reste consultable, son historique intact ; une seconde
  clôture ⇒ 409 `IMPLANTATION_CLOTUREE`.
- [ ] **AC-5** — Un secret d'accès à un portail est refusé : 400 au bord, et aucun champ du schéma
  ne l'accepte.
- [ ] **AC-6** — `(orgId, pays, NIF)` unique ⇒ 409 `IDENTIFIANT_FISCAL_DEJA_UTILISE` ; une seconde
  implantation active dans le même pays ⇒ 409 `IMPLANTATION_EXISTANTE`.
- [ ] **AC-7** — Dossier archivé ⇒ 409 `DOSSIER_ARCHIVE` ; dossier d'une autre organisation ou hors
  portée ⇒ 404 `DOSSIER_INTROUVABLE`.

## Table de mutations

| ID | Mutation | Témoin rouge |
|---|---|---|
| M1 | ne pas normaliser le NIF | unicité contournée par un espace (AC-6) |
| M2 | accepter le pays du dossier | AC-6 |
| M3 | autoriser la clôture d'une clôturée | AC-4 |
| M4 | ignorer le statut ARCHIVE | AC-7 |
| M5 | écrire la trace hors transaction | conformité |

## Definition of Done

- [ ] Branche `MNV-362` depuis `origin/dev`, PR vers `dev` fusionnée en rebase ; fiche et tracker
  par PR sur `main` fusionnée en rebase.
- [ ] Porte qualité verte ; conformité Mongo réel (index, transaction) ; mutations rouges.

## Progress Tracking

**2026-11-14 — fiche réécrite.** Fiche du 2026-08-09 réécrite (bmad-create-story) juste avant de
coder, confrontée à `origin/dev` `ea879c6` (STORY-299, 298, 300 incluses) et à `dossier-service`.
