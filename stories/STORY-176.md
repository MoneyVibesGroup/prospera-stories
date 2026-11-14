# STORY-176 : Le BFF proxifie la revue KYC **pièce par pièce** — un acte métier, un chemin

**Epic :** EPIC-025 — RBAC plateforme *(exploitation de la console)*
**Réf. :** ticket §D · **AP-03** · **STORY-107** (file KYC au BFF) · **STORY-128** (verdict par pièce)
**Découverte par :** AP-INT-0, en branchant la revue KYC
**Priorité :** Should Have — ⚠️ **arbitrage à rendre avant de coder** *(voir §Décision attendue)*
**Story Points :** 3
**Statut :** Terminée (2026-11-14) — issue ① proxifier
**Créée le :** 2026-08-04
**Sprint :** 21
**Service :** `prospera-admin-panel-service` (`:3010`)

---

## Le constat

Le BFF expose `POST /admin/orgs/:orgId/kyc/approve|reject` — la décision **globale** du dossier.
Mais `kyc-service` porte aussi
`POST /admin/kyc/:orgId/documents/:documentId/approve|reject` — la marque **par pièce**, qui est
très exactement ce que fait l'écran de revue : l'opérateur statue chaque document, puis consolide.

**Le BFF ne proxifie pas ces deux routes.** La console doit donc emprunter **deux chemins pour un
seul acte métier** : le BFF pour la décision, `kyc-service` en direct pour chaque pièce.

**Ce que ça coûte, concrètement :**

- Deux origines à autoriser au lieu d'une, deux surfaces à durcir.
- La jointure de droits se joue à deux endroits : rien ne garantit qu'un opérateur autorisé à
  marquer une pièce le soit à décider du dossier, ni l'inverse.
- Le jour où le BFF ajoute une règle *(journalisation, garde-fou, agrégation)*, elle s'appliquera à
  la décision globale et **pas** aux marques — une asymétrie que personne n'aura décidée.

---

## Décision attendue AVANT de coder

Deux issues se défendent, et le programme a déjà payé pour avoir laissé ce genre de question
ouverte *(cf. `GAP-bff-admin-sans-consommateur` : trois routes commandées pour un front qui ne
passait pas par le BFF)* :

| Issue | Conséquence |
|---|---|
| **① Proxifier** *(par défaut)* | Cohérent avec l'arbitrage d'AP-INT-0 : le BFF est le chemin de la console. Cette story livre le proxy |
| ② **Acter le direct** | Alors il faut le **dire dans `AP-03`** et dans la table de routage — pas le laisser découvrir à l'implémentation. Cette story se ferme sans code |

⚠️ **Ce qui ne se défend pas, c'est de ne pas trancher.**

---

## Périmètre *(issue ①)*

- `POST /admin/orgs/:orgId/kyc/documents/:documentId/approve`
- `POST /admin/orgs/:orgId/kyc/documents/:documentId/reject` *(corps `{ reason }`)*

Pass-through **strict** : mêmes codes, mêmes corps d'erreur, relais du bearer. Le BFF n'ajoute
aucune règle métier — il unifie le **chemin**, pas la sémantique.

⚠️ Chemin sous `/admin/orgs/:orgId/...`, aligné sur les routes de décision existantes : la console
lit tout le dossier d'une organisation sous le même préfixe.

---

## Critères d'acceptation

1. Les deux routes existent et relaient vers `kyc-service` sans altérer le corps.
2. Les codes d'erreur amont sont **préservés** (403, 404, 409, 422) — un pass-through qui écrase un
   409 en 500 rend le conflit indiagnosticable.
3. Le bearer de l'opérateur est relayé ; le BFF n'emprunte **aucune** identité de service.
4. Un motif de rejet vide ou trop court est refusé **par l'amont**, pas réinventé ici.
5. ⚡ Preuve navigateur depuis `:3110` : marquer une pièce, puis décider du dossier, **par le seul
   BFF** — zéro appel direct à `:3002`.

---

## Definition of Done

- [x] Arbitrage tranché et **consigné** dans `AP-03` et dans le ticket
- [x] Les 5 critères vérifiés *(issue ①)* · `lint` 0 · couverture ≥ 90 %
- [x] ⚡ La console est rebranchée : `submitDecision` n'emprunte **plus qu'un** amont
- [x] Branche `MNV-176`, PR rebase-mergée sur `dev`

---

## Suivi — 2026-11-14 (issue ① retenue, fusionnée sur `dev`)

**Arbitrage PO du 2026-11-14 : ① proxifier.** Consigné ici et dans le tracker.
**PR :** MoneyVibesGroup/prospera-admin-panel-service#32 (BFF) · MoneyVibesGroup/frontend-admin-panel#29 (console).

### Ce qui a été fait

- BFF : `POST /admin/orgs/:orgId/kyc/documents/:documentId/approve|reject`, pass-through strict
  vers `kyc-service` (corps amont tel quel, codes préservés, bearer relayé), mêmes permissions que
  la décision du dossier (`kyc:approve` / `kyc:reject`).
- Console : `poserMarques` passe par le BFF ; plus aucun acte de revue en direct vers `kyc-service`.
  La **lecture** du détail (`/kyc-admin/:orgId`) reste directe, par conception (URL présignées et
  OCR, mono-service) : hors du périmètre de cette story.

### ⚡ Écart à la fiche : la marque par pièce n'a PAS de corps

La fiche annonçait `reject` avec `{ reason }`. Depuis STORY-128, `kyc-service` n'a **aucun champ**
pour un motif par pièce (le motif vit sur le dossier). Le proxy suit le contrat réel : ni corps ni
`If-Match`. AC-4 (« motif refusé par l'amont ») est donc sans objet sur ces routes.

⚠️ **Défaut trouvé** : la console envoyait le motif saisi par pièce, que `kyc-service` ignorait,
donc **perdu sans bruit**, et un test affirmait qu'il « voyageait ». Test inversé, requête sans
corps. **Story à ouvrir** : garder ce motif (champ amont) ou le retirer de l'écran.

### Preuves

BFF 509/509 ; console `src/features/kyc` 75/75. Docker (dossier de démonstration, 3 pièces) :
approuver la pièce en attente ⇒ 200 ; rejeter puis ré-approuver une pièce ⇒ 200 / 200 ; pièce
remplacée ⇒ 409 ; pièce inconnue ⇒ 404 ; membre d'un cabinet ⇒ 403 ; décision du dossier par le BFF
⇒ 200 `APPROVED` ; marque après décision ⇒ 409. ⚠️ Preuve navigateur depuis `:3110` non faite (la
console ne tournait pas dans la pile) : le rebranchement est prouvé par ses tests.
