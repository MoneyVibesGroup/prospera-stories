# STORY-175 : Filtrer les organisations par **statut KYC** — le filtre principal de la console n'a pas de serveur

**Epic :** EPIC-025 — RBAC plateforme
**Réf. :** ticket §C · **AP-02** · ⚠️ **déjà relevé le 2026-07-21, jamais formulé en demande**
**Priorité :** Must Have
**Story Points :** 2
**Statut :** Terminée (2026-11-14) — requalifiée côté BFF
**Créée le :** 2026-08-04
**Sprint :** 21
**Service :** `auth-service` (`:3001`) + relais `prospera-admin-panel-service` (`:3010`)

---

## Le constat

`ListOrgsQueryDto` porte `status` — qui vaut `ACTIVE | SUSPENDED`, c'est-à-dire le statut
d'**identité**. La liste enrichit pourtant chaque ligne d'un `kycStatus`, et **le filtre principal
de l'écran AP-02 porte sur le KYC** : « montre-moi les dossiers en attente de revue » est la
première chose qu'un opérateur demande le matin.

**Pourquoi le front ne peut pas s'en sortir seul.** Filtrer côté client casse la pagination : on ne
peut pas paginer sur une colonne qu'on filtre **après** avoir reçu la page. `total` deviendrait faux
et la page 2 sauterait des lignes. La console n'envoie donc **aucun** filtre KYC aujourd'hui — et
son test le vérifie explicitement, pour que personne ne « répare » ça côté front.

> ⚠️ Cet écart avait été relevé le 2026-07-21 lors de l'audit d'AP-03, puis **jamais transformé en
> demande**. Il a coûté une seconde découverte.

---

## Périmètre

- `ListOrgsQueryDto` reçoit `kycStatus`, aux valeurs du contrat KYC réel :
  `PENDING_DOCUMENTS | UNDER_REVIEW | APPROVED | REJECTED`.
- Il **se combine** avec `status` (identité), `q` et `ids` — les filtres sont orthogonaux.
- `total` reflète le filtre appliqué : c'est tout l'objet de la story.
- Le BFF relaie le paramètre sans le réinterpréter.

---

## Critères d'acceptation

1. `?kycStatus=UNDER_REVIEW` ne renvoie que les organisations dans cet état.
2. ⚡ `total` correspond au **nombre filtré**, et la page 2 ne saute aucune ligne — vérifié sur un
   jeu dépassant une page.
3. Se combine avec `status`, `q` et `ids` sans que l'un annule l'autre.
4. Une valeur inconnue est refusée avec `{ message, code }` — jamais ignorée en silence : un filtre
   ignoré rend une liste **complète** qui a l'air filtrée.
5. Absent ⇒ comportement inchangé (non-régression).
6. Le BFF expose le paramètre et le transmet tel quel.

---

## Definition of Done

- [x] Les 6 critères vérifiés · `lint` 0 · couverture ≥ 90 %
- [x] **Vérification docker** sur un jeu multi-pages
- [x] ⚡ La console est rebranchée : `fetchOrgs` renvoie le filtre, et son test « n'envoie AUCUN
      filtre kycStatus » est **inversé** — c'est le signal que la dette est soldée
- [x] Branche `MNV-175`, PR rebase-mergée sur `dev`

---

## Suivi — 2026-11-14 (requalifiée côté BFF, fusionnée sur `dev`)

**PR :** MoneyVibesGroup/prospera-admin-panel-service#31 (BFF) · MoneyVibesGroup/frontend-admin-panel#27 (console).
`auth-service` n'est **pas** touché.

### ⚡ Décision PO du 2026-11-14 : requalifiée côté BFF

La fiche demandait le filtre à `auth-service`, qui **ne connaît pas** le statut KYC : il vit
dans `kyc-service` (une base par service). Trois options ont été présentées (BFF, projection du
KYC dans `auth` par événements, clôture au profit de la file STORY-107) ; le PO a retenu le BFF.

`GET /admin/orgs?kycStatus=…` :
1. lit chez `kyc` l'ensemble **complet** des organisations au statut demandé ; pour ce filtre,
   `kyc` est une dépendance **dure** (panne ⇒ 503, refus ⇒ 403, jamais la liste entière) ;
2. le passe à `auth` en `?ids=` avec `status`, `q`, `ownerEmailVerified` : pagination et `total`
   sont ceux d'`auth`, donc exacts ;
3. aucun dossier ⇒ page vide **sans** appeler `auth` (`ids` vide = parc entier) ;
4. plus de 100 organisations (plafond `?ids=` d'`auth`) ⇒ `422 FILTRE_KYC_TROP_LARGE`, qui renvoie
   vers `GET /admin/kyc-reviews` ;
5. valeur inconnue ⇒ `400 STATUT_KYC_INCONNU` avec `{ message, code }`.

**Écart aux critères :** AC-3 nomme `ids` ; le BFF n'expose pas `ids` sur cette route, la
combinaison est donc prouvée avec `status`, `q` et `ownerEmailVerified`. AC-6 (« le BFF relaie
tel quel ») ne tient plus par construction : le BFF résout le filtre lui-même.

### Preuves

Unitaires BFF 496/496 (11 nouveaux) ; console `src/features/orgs` 89/89. Docker (auth, kyc,
catalogue, BFF ; 25 organisations et 124 dossiers semés) : sans filtre `total=26` ;
`UNDER_REVIEW` `total=23` sur 3 pages de 10, **23 lignes distinctes** ; `+ status=SUSPENDED` = 5 ;
`+ q=preuve-1` = 10 ; `REJECTED` = 0 ; `PENDING` ⇒ 400 nommé ; `APPROVED` (104) ⇒ 422 nommé.

### Restes

- ⚠️ **Le contrôle d'écran du filtre n'est pas remis** dans la console : modification d'écran,
  donc maquette d'abord. Story d'écran à ouvrir (elle traitera aussi le 422).
- ⚠️ **Constat** : sur une pile sans catalogue, le fan-out de comptage des droits (jusqu'à 10
  appels vers un hôte non résolu) sature le pool DNS de Node (4 fils) pendant ~3 s, et l'appel
  suivant vers `kyc` expire (503 intermittent). Un catalogue injoignable en production
  dégraderait donc aussi les autres sources du BFF. Non corrigé.
