---
baseline_commit: 5963420c66eb9a24076425de54f54f18dd92a4d0
---

# STORY-300 : Habilitations graduées et séparation des natures d'accès

Status: ready-for-dev

**Complexité :** medium

**Épic :** EPIC-027 — Socle `fiscal-service` et gouvernance du paquet fiscal  
**Service :** `fiscal-service` (dépôt `prospera-fiscal-service`, base `origin/dev`)  
**Points :** 3 · **Sprint :** S23 du tracker ; S3 (23/11 → 27/11) de l'amendement du 14/11  
**Assigné à :** Dev B  
**Prérequis :** STORY-299 (`done`, journal d'audit chaîné), STORY-298 (`done`, recalcul), STORY-166 (perms de tenant dans le jeton)  
**Origine :** `epics-fiscalite-2026-08-03.md` — FR-F58, FR-F59 ; PRD §7 (FR-F59 : lecture, préparation, contrôle, validation, dépôt, règlement, aucune n'impliquant l'autre).

---

## User Story

En tant qu'**administrateur de cabinet**, je veux distribuer des droits par action, afin qu'un
collaborateur puisse préparer sans pouvoir déposer.

## Décisions confrontées au code réel (2026-11-14)

- **Patron des modules métier (STORY-572, 241)** : inventaire local, typé et gelé des droits
  (`src/common/rbac/droits-fiscalite.ts`, codes à trois segments `fiscalite:declaration:*`), garde
  qui lit `perms` du jeton, placée APRÈS la porte d'accès fiscale (sinon une organisation révoquée
  apprendrait que la surface existe).
- **Règle d'or du catalogue** : n'est déclaré qu'un droit qu'une garde vérifie. Aujourd'hui :
  `preparer` (produire le livrable, consigner un rejet), `deposer` (transmettre, consigner
  l'accusé), `valider` (recalcul explicite du paquet d'un exercice, STORY-298). `lire`,
  `controler`, `regler` attendront les routes qui les exercent (EPIC-031, 033).
- ⚠️ **Aucun droit fiscal n'est attribuable aujourd'hui** : `auth-service` (`TenantPermission`,
  origin/dev) ne porte que des codes `paiement:*` et `notification:*`, et aucun rôle de tenant du
  cabinet n'existe. Les membres d'un cabinet ont `perms: []`. Basculer d'un coup sur les droits
  fermerait le dépôt à l'administrateur du cabinet, client n°1 de février. ⇒ **mode de
  compatibilité, explicite et borné** : si le jeton ne porte AUCUN droit `fiscalite:*`, les droits
  se déduisent du rôle actuel, à l'identique du comportement d'aujourd'hui (`TENANT_ADMIN` = tous,
  `TENANT_USER` = `preparer`) ; dès qu'il en porte un, **seuls les droits comptent** (habilitation
  graduée). La déduction vit dans UNE fonction, testée ; aucun autre nom de rôle n'entre dans le
  chemin d'autorisation. **Décision à confirmer par le PO** ; suite : story auth-service pour les
  droits `fiscalite:*` et les rôles du cabinet.
- **Le refus est journalisé** au journal d'audit chaîné de STORY-299, dans un périmètre **de
  l'organisation de l'appelant** (`habilitation:<orgId>`), jamais dans celui de la ressource
  visée : écrire dans la chaîne d'un dépôt dont on ignore encore à qui il appartient laisserait un
  tiers trouer la chaîne d'une autre organisation. Échec d'écriture du journal ⇒ le 403 part quand
  même (journal d'erreur), jamais un 500.
- **Cinq natures d'accès** (FR-F58) : identifiant fiscal (donnée métier), compte de canal,
  habilitation applicative, certificat électronique, accès bancaire — un type du domaine, sans
  aucune implication de l'une à l'autre ; le service ne vérifie que l'habilitation applicative et
  ne stocke aucun secret des trois natures d'accès externes (AD-13).

## Critères d'acceptation

- [ ] **AC-1 — Préparer sans déposer.** Un jeton portant `fiscalite:declaration:preparer` seul :
  produire le livrable passe ; transmettre ou consigner l'accusé ⇒ 403 `DROIT_FISCAL_REFUSE`.
- [ ] **AC-2 — Refus journalisé.** Ce 403 écrit `HABILITATION_REFUSEE` (droit, méthode, route,
  sans identifiant de ressource en clair) au journal chaîné `habilitation:<orgId>`.
- [ ] **AC-3 — Aucun droit n'en implique un autre.** `deposer` seul ne permet pas de préparer ;
  `valider` seul ne permet ni l'un ni l'autre.
- [ ] **AC-4 — Compatibilité.** Sans droit `fiscalite:*` dans le jeton, le comportement actuel est
  inchangé (e2e existants verts) : `TENANT_ADMIN` dépose et recalcule, `TENANT_USER` prépare et
  consigne un rejet, et rien d'autre.
- [ ] **AC-5 — Cinq natures distinctes.** Le domaine les déclare ; aucune n'implique une autre ;
  tous les droits fiscaux relèvent de l'habilitation applicative.
- [ ] **AC-6 — Ordre des gardes.** Une organisation sans accès fiscal reçoit le refus d'accès
  (`FISCAL_NOT_ENTITLED`), jamais `DROIT_FISCAL_REFUSE`.

## Table de mutations

| ID | Mutation | Témoin rouge |
|---|---|---|
| M1 | `deposer` accorde aussi `preparer` | AC-3 |
| M2 | ignorer les droits du jeton quand il en porte | AC-1 |
| M3 | `TENANT_USER` reçoit `deposer` en compatibilité | AC-4 |
| M4 | ne pas journaliser le refus | AC-2 |
| M5 | journaliser dans le périmètre de la ressource | AC-2 |

## Definition of Done

- [ ] Branche `MNV-300` depuis `origin/dev`, PR vers `dev` fusionnée en rebase ; fiche et tracker
  par PR sur `main` fusionnée en rebase.
- [ ] Porte qualité verte ; mutations rouges puis restaurées.

## Progress Tracking

**2026-11-14 — fiche écrite** (bmad-create-story) juste avant de coder, confrontée à `origin/dev`
`5963420` (STORY-298 incluse) et à `auth-service` `origin/dev` (catalogue de tenant).
