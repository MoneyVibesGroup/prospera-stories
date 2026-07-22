# STORY-128 : Statut et date de revue **par pièce** KYC (aujourd'hui : un seul `reviewedAt` global au dossier)

**Epic :** EPIC-003 — KYC (kyc-service)
**Réf. architecture :** `architecture-kyc-service-2026-07-03.md` § cycle de revue
**Priorité :** Should Have
**Story Points :** 2
**Statut :** defined 📝
**Sprint :** 16 (proposé — à tirer avec STORY-127, même DTO)
**Créée le :** 2026-07-22
**Services :** `kyc-service` (:3002)
**Couvre :** granularité de restitution relevée à la conception de FE-015

---

## User Story

En tant qu'**administrateur de cabinet**,
je veux **savoir quelle pièce a été validée et quand**,
afin de **comprendre où en est mon dossier sans deviner, quand une pièce est acceptée et l'autre encore en
attente.**

---

## Description

### Constat

`KycStatusResponseDto` expose `kycStatus` (dossier), `rejectionReason?` et **un `reviewedAt` unique, global
au dossier**. Le statut par document se limite à `SUBMITTED | SUPERSEDED` — deux valeurs qui décrivent le
**dépôt**, pas la **revue**.

Un cabinet dont le RCCM est accepté et la carte CFE encore à l'étude voit donc deux pièces au même statut
apparent, et une seule date qui ne dit pas à quoi elle se rapporte. L'écran FE-015 ne peut afficher
« Validé le … » sur la bonne ligne.

### Ce que la story change

Chaque document porte son propre résultat de revue et sa propre date.

---

## Scope

**Inclus**

- Ajout à `KycDocumentResponseDto` de `reviewStatus` (`PENDING | APPROVED | REJECTED`) et `reviewedAt?`.
- Alimentation de ces champs par le parcours de revue admin **existant** (approve/reject) — au niveau pièce.
- Cohérence : le `kycStatus` du dossier reste la synthèse, il n'est pas remplacé.
- Le `rejectionReason` par pièce s'il existe déjà côté revue ; sinon rester au niveau dossier et le documenter.

**Hors périmètre**

- Refonte du flux de revue admin (l'UI admin AP-03 est cadrée ailleurs).
- URL de consultation → **STORY-127**.

---

## Acceptance Criteria

- **AC-01** — Après approbation d'une seule pièce, `GET /kyc/status` montre cette pièce
  `reviewStatus: APPROVED` **avec** son `reviewedAt`, et l'autre `PENDING` **sans** date.
- **AC-02** — Un rejet de pièce donne `REJECTED` sur **cette** pièce ; le dossier reste cohérent avec la
  règle de synthèse existante.
- **AC-03** — Une pièce `SUPERSEDED` conserve le résultat de revue qu'elle avait — l'historique n'est pas
  réécrit par un nouveau dépôt.
- **AC-04** — Rétrocompatibilité : `reviewedAt` global et `kycStatus` restent servis à l'identique
  (l'admin-panel et le read-model EC ne cassent pas).
- **AC-05** — Les dossiers déjà revus avant la migration ne mentent pas : soit ils sont rétro-alimentés
  depuis la décision existante, soit ils restent `PENDING` par pièce — décision à acter et à documenter,
  jamais une date inventée.

---

## Technical Notes

- Vérifier si le modèle de revue conserve déjà la décision par pièce (auquel cas la story est une simple
  projection dans le DTO) ou seulement au dossier (auquel cas il faut un champ persistant).
- L'enrichissement OCR par pièce existe déjà côté admin (`extraction{…}`) : la granularité par document est
  donc **déjà** une notion établie dans ce service.

---

## Dependencies

- **Bloque** : **FE-022** (colonne « Validé le » des aperçus de pièces).
- **Cohérent avec** : STORY-127 (même DTO — les livrer ensemble évite deux régénérations de types côté front).

---

## Definition of Done

- 5 AC passent ; AC-04 vérifié en rejouant la chaîne KYC complète (dépôt → revue → read-model EC).
- OpenAPI à jour ; types régénérés côté frontend sans casse.
- La décision prise pour AC-05 (rétro-alimentation ou non) est écrite dans la story.

---

## Progress Tracking

**Status History :**
- 2026-07-22 : Créée (Scrum Master) — écart relevé en dessinant les aperçus de pièces de FE-015 : la
  maquette demandait « Envoyé le / Validé le » par pièce, le contrat ne sert que la première.

---

**Cette story a été créée avec la BMAD Method v6 — Phase 4 (Planification d'implémentation).**
