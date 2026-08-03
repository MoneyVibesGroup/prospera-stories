# STORY-176 : Le BFF proxifie la revue KYC **pièce par pièce** — un acte métier, un chemin

**Epic :** EPIC-025 — RBAC plateforme *(exploitation de la console)*
**Réf. :** ticket §D · **AP-03** · **STORY-107** (file KYC au BFF) · **STORY-128** (verdict par pièce)
**Découverte par :** AP-INT-0, en branchant la revue KYC
**Priorité :** Should Have — ⚠️ **arbitrage à rendre avant de coder** *(voir §Décision attendue)*
**Story Points :** 3
**Statut :** À faire
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

- [ ] Arbitrage tranché et **consigné** dans `AP-03` et dans le ticket
- [ ] Les 5 critères vérifiés *(issue ①)* · `lint` 0 · couverture ≥ 90 %
- [ ] ⚡ La console est rebranchée : `submitDecision` n'emprunte **plus qu'un** amont
- [ ] Branche `MNV-176`, PR rebase-mergée sur `dev`
