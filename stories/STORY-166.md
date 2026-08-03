# STORY-166 : Rôles métier **distributeur** — un jeu système livré par Prospera, extensible sans migration

**Epic :** EPIC-025 — RBAC plateforme *(extension)*
**Réf. code livré :** **STORY-140** (catalogue de permissions 8→10 + rôles métier Comptable / Marketing / DG, S18) · **STORY-026** (users/rôles auth-service) · **STORY-142** (index inverse des entitlements)
**Réf. commerciale :** `prospera-font-end/docs/prospera_modules_bundles_distributeur.md` §0 *(14 personas)* · `prospera_modules_ia_distribution.md` §Rôles couverts *(13 profils)*
**Dépend de :** aucune — extension d'un catalogue livré
**Débloque :** **STORY-167** (rôles personnalisés) · **DI-01/DI-02** (l'administrateur reçoit un rôle) · `AP-17`
**Priorité :** Must Have — ⚡ **bloque tout le parcours d'entrée du distributeur**
**Story Points :** 5
**Complexité :** low-medium — **de la donnée, pas du code**
**Statut :** À faire
**Assigné à :** null
**Créée le :** 2026-08-02
**Sprint :** à planifier — **socle distributeur, vague 0**
**Service :** `auth-service` (`:3001`)
**Couvre :** prérequis du parcours d'entrée *(PLAN-DISTRIBUTEUR-PI-SPI §3-bis)*

---

## Contexte — le point exact où le parcours d'entrée casse

Formulation du PO :

> *« Je crée l'organisation sur l'AP avec un administrateur **et son rôle selon les rôles du
> distributeur**, et lui il vient, il configure tout pour gérer. »*

Tout est possible aujourd'hui **sauf le milieu de cette phrase** : `STORY-140` a livré le catalogue de
permissions avec **trois** rôles métier — Comptable, Marketing, DG. **Aucun rôle distributeur
n'existe.** L'administrateur créé dans la console n'a donc rien à recevoir.

---

## User Story

**En tant qu'**administrateur plateforme Money Vibes,
**je veux** attribuer à l'administrateur d'un distributeur un rôle qui correspond à son métier,
**afin qu'**il puisse entrer dans son application et commencer à la configurer.

---

## Périmètre

### A. Le jeu système du v1 — six rôles, pas quatorze

Décision PO : on part du **sous-ensemble qui sert l'encaissement**, pas des quatorze personas du
catalogue commercial.

| Rôle | Ce qu'il fait dans le périmètre construit |
|---|---|
| `DIST_ADMIN` | ⚡ **Administrateur du distributeur** — configure l'organisation, crée les utilisateurs, attribue les rôles. **Le rôle que Money Vibes attribue à l'entrée** |
| `DIST_DG` | Direction — lecture large, arbitrages |
| `DIST_DAF` | Direction financière — comptes d'encaissement, validation, annulation |
| `DIST_COMPTABLE` | Comptabilité — réconciliation, écarts |
| `DIST_RECOUVREMENT` | Créances, promesses, relance |
| `DIST_COMMERCIAL` | Terrain — déclaration d'encaissement en espèces, émission de lien |

> ⚡ **Pourquoi six et pas quatorze.** Huit des personas du catalogue commercial (Resp. Stock, Gest.
> Entrepôt, Prospection, Marketing, Superviseur, Resp. Ventes, Contrôleur de gestion, Freelance)
> n'ont **aucun écran construit** : leur donner un rôle produirait des utilisateurs qui se connectent
> et ne voient rien. **Six rôles qu'on sait servir valent mieux que quatorze dont huit sont vides.**

### B. Extensible **sans migration**

Les huit rôles restants — et ceux d'autres verticales — s'ajoutent en **donnée**, pas en code.

Un rôle système est une **composition nommée de permissions** issues du catalogue existant
(`STORY-140`). Ajouter `DIST_RESP_STOCK` le jour où le module Stock existe = **une ligne de données**.

### C. La séparation des pouvoirs, portée par les rôles

Les contrôles de `STORY-156` et `STORY-158` exigent que **déclarer**, **valider** et **annuler** ne se
cumulent pas par défaut. Le jeu système doit le refléter :

| Permission | `DIST_COMMERCIAL` | `DIST_DAF` | `DIST_COMPTABLE` |
|---|:--:|:--:|:--:|
| `paiement:encaissement:declarer` | ✅ | — | — |
| `paiement:encaissement:valider` | — | ✅ | — |
| `paiement:annulation:enregistrer` | — | ✅ | — |
| Réconciliation | — | ✅ | ✅ |

⚠️ `DIST_ADMIN` **ne cumule pas** ces trois permissions par défaut. Il administre l'organisation ; il
n'opère pas sur l'argent. Un distributeur qui veut le cumul le fait **explicitement** (`STORY-167`),
et le système le signale.

### D. Ce que cette story ne fait pas

- **Aucune portée d'accès par zone** — décision PO : *pas nécessaire au v1*. Un rôle s'exerce sur
  toute l'organisation. La portée viendra avec `Réseau & zones` (#4)
- **Aucun rôle personnalisé** — c'est `STORY-167`
- Aucun écran — c'est `AP-17` et `DI-02`

---

## Critères d'acceptation

1. Les six rôles système distributeur existent au catalogue, chacun comme **composition nommée de
   permissions** du catalogue `STORY-140`.
2. Un rôle système est **identifié comme tel** et **non modifiable** par une organisation.
3. ⚡ Ajouter un septième rôle système est une **donnée**, sans changement de schéma ni migration —
   prouvé en ajoutant un rôle de test.
4. `DIST_ADMIN` est attribuable depuis la console à l'administrateur d'une organisation distributeur.
5. ⚡ `DIST_ADMIN` **ne détient pas** simultanément `declarer`, `valider` et `annulation:enregistrer`.
6. Le trio `declarer` / `valider` / `annuler` est réparti sur des rôles **distincts** dans le jeu livré.
7. Les rôles distributeur ne sont proposés qu'aux organisations dont le vertical est distributeur —
   un cabinet ne se voit pas proposer `DIST_COMMERCIAL`.
8. Un utilisateur porte ses permissions dans son jeton (`perms[]`, patron `STORY-140`) ; aucun appel
   supplémentaire n'est requis à la lecture.
9. L'attribution d'un rôle est **journalisée** : qui, à qui, quand.
10. Les rôles existants (Comptable, Marketing, DG de `STORY-140`) **restent inchangés** — aucune
    régression sur le vertical cabinet.

---

## Notes techniques

### Le nommage

Préfixe `DIST_` pour éviter la collision avec les rôles existants et ceux des verticales à venir
(`IMF_`, `ASSUR_`). Un rôle `COMPTABLE` sans préfixe existe déjà (`STORY-140`) et ne signifie pas la
même chose chez un cabinet et chez un distributeur.

### Pourquoi `DIST_ADMIN` n'opère pas sur l'argent

C'est le rôle que **Money Vibes** attribue, à quelqu'un qu'elle ne connaît pas encore. Lui donner
d'emblée le droit de déclarer et de valider un encaissement reviendrait à livrer une organisation
sans séparation des pouvoirs — et personne ne la rétablirait ensuite.

---

## Risques & mitigation

| Risque | Mitigation |
|---|---|
| Les 14 personas sont livrés « pour être complet » et 8 utilisateurs se connectent sur du vide | **AC 1** : six rôles, et l'extensibilité prouvée (AC 3) |
| `DIST_ADMIN` cumule tout « pour simplifier l'onboarding » | **AC 5** — le cumul devient une décision explicite du distributeur |
| Les rôles distributeur polluent le vertical cabinet | **AC 7/10** |

---

## Definition of Done

- [ ] Les 10 critères vérifiés
- [ ] `lint` 0 · couverture ≥ 90 %
- [ ] **Vérification docker** : attribution de `DIST_ADMIN`, `perms[]` dans le jeton, ajout d'un
      septième rôle par donnée seule, absence de cumul, non-régression du vertical cabinet
- [ ] Branche `MNV-166`, PR rebase-mergée sur `dev`

---

## Progress Tracking

*(à remplir à l'implémentation)*
