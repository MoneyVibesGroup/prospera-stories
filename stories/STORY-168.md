> # ⛔ STORY REMPLACÉE — NE PAS IMPLÉMENTER
>
> **Remplacée le 2026-08-03** (décision PO) par le re-découpage du Module 2 : **STORY-289**.
>
> Cette story appartenait au découpage `EPIC-004 (rescopé)` (18 stories, 104 pts). Le découpage en
> vigueur est **EPIC-035 → EPIC-042 / STORY-237 → STORY-290** (54 stories, 196 pts), sprints 31→38.
> Le contenu ci-dessous **reste une bonne source de contexte métier** — c'est pour cela qu'il n'est pas
> supprimé — mais **son périmètre, son estimation et son sprint ne font plus foi**.
>
> 📄 Découpage en vigueur : [`epics-paiement-2026-08-03.md`](../epics-paiement-2026-08-03.md)
> 📐 Architecture : [`ARCHITECTURE-SPINE.md`](../architecture/architecture-paiement-service-2026-08-03/ARCHITECTURE-SPINE.md) (AD-1 → AD-18)
> 🗂️ Motif détaillé : `superseded_stories` dans [`sprint-status.yaml`](../sprint-status.yaml)

---

# STORY-168 : Registre plateforme des **fournisseurs de paiement** — déclarer, configurer, activer par pays

**Epic :** EPIC-004 — `paiement-service` (PI-SPI & encaissement)
**Réf. PRD :** [`prds/prd-paiement-service-2026-08-02/prd.md`](../prds/prd-paiement-service-2026-08-02/prd.md) §6 groupe B (FR-P07→P12) · groupe K (FR-P54, FR-P56)
**Réf. code livré :** **STORY-152** (`PaymentProvider`, routage, capacités déclarées) · **STORY-151** (secrets par organisation) · **STORY-032** (patron de registre administrable, `platform-catalog-service`)
**Dépend de :** STORY-152
**Débloque :** `AP-18` (surface console) · l'exploitation réelle du multi-fournisseur
**Priorité :** Must Have — ⚡ **priorité PO : le PI-SPI qui compte aujourd'hui est celui de la console**
**Story Points :** 5
**Complexité :** medium
**Statut :** ⛔ **superseded (2026-08-03)** — remplacée par STORY-289
**Assigné à :** null
**Créée le :** 2026-08-02
**Sprint :** ~~aucun~~ — retirée des sprints le 2026-08-03 (elle occupait le S31→S34)
**Service :** `paiement-service` (`:3005`)
**Couvre :** complément administrable de FR-P07→P12

---

## Contexte — le trou entre `STORY-152` et la réalité

`STORY-152` livre le **contrat** `PaymentProvider`, le **routage** par pays × devise × méthode, et
une implémentation FedaPay. Ce qu'elle ne livre pas : **le moyen de déclarer un fournisseur sans
déployer.**

Aujourd'hui, ajouter un agrégateur ghanéen supposerait : écrire son implémentation *(normal)*, **puis
modifier une configuration de service et redéployer** *(pas normal)*.

Demande du PO :

> *« Le PI-SPI important actuellement doit être celui lié à l'admin panel : la configuration manuelle,
> **les fournisseurs de paiement, leur configuration**, les logs de paiement, les abonnements. »*

Cette story rend le registre **administrable**, au même patron que le catalogue de modules
(`STORY-032`).

---

## User Story

**En tant qu'**administrateur plateforme Money Vibes,
**je veux** déclarer un fournisseur de paiement, le configurer et l'activer pays par pays,
**afin d'**ouvrir un nouveau marché sans attendre une livraison.

---

## Périmètre

### A. Le registre

| Champ | Note |
|---|---|
| Code, libellé | Code stable, non réutilisable |
| **Implémentation** | Référence au `PaymentProvider` **compilé dans le service** |
| Environnement | `bac à sable` · `production` |
| **Identifiants plateforme** | ⚡ Secrets — jamais restitués (`FR-P06`) |
| Activation | **Par pays × devise × méthode** |
| État | `déclaré → vérifié → actif`, plus `suspendu` |

> ⚡ **Ce qui reste du code, et ce qui devient de la donnée.** L'**implémentation** d'un fournisseur
> est du code — on ne peut pas deviner son protocole. Sa **déclaration, sa configuration et son
> activation** sont de la donnée. Ajouter un pays servi par un fournisseur déjà implémenté ne doit
> **jamais** demander un déploiement.

### B. Capacités : déclarées par le code, **restreintes** par la configuration

`STORY-152` fait déclarer ses capacités au fournisseur. Le registre peut **restreindre**, jamais
étendre :

| Situation | Résultat |
|---|---|
| Le code déclare `paiement partiel : oui`, la configuration l'active | ✅ disponible |
| Le code déclare `paiement partiel : oui`, la configuration le désactive | ✅ **restreint** — utile pour un fournisseur instable |
| Le code déclare `paiement partiel : non`, la configuration voudrait l'activer | ⛔ **refusé** — la configuration ne peut pas mentir sur le code |

### C. Défauts de routage de la plateforme

`STORY-152` §C prévoit une cascade : compte de l'organisation → défaut de l'organisation → **défaut de
la plateforme**. Ce dernier niveau se configure **ici**.

### D. Vérification et suspension

- **Vérification** : un appel de santé au fournisseur ; le résultat alimente `/health` (`STORY-150` §C)
- **Suspension** : un fournisseur suspendu **cesse de recevoir de nouvelles demandes** ; les demandes
  **en cours ne sont pas annulées** et restent payables
- ⚡ La suspension **ne casse rien en silence** : les organisations qui en dépendaient sont
  **listables**, et le routage annonce qu'il n'a plus de fournisseur éligible plutôt que d'échouer

### E. Secrets

Identifiants plateforme : **jamais restitués, jamais journalisés, jamais dans une trace d'erreur**.
Empreinte partielle en lecture. Même mécanisme que `STORY-151` — **conçu une fois pour les deux**.

### F. Hors périmètre

L'écriture d'une nouvelle implémentation `PaymentProvider` *(c'est du code, story dédiée par
fournisseur)* · les comptes d'encaissement des organisations *(`STORY-151`)* · la surface console
*(`AP-18`)*.

---

## Critères d'acceptation

1. Un fournisseur se déclare, se configure et s'active **par pays × devise × méthode**, sans
   redéploiement.
2. ⚡ Activer un pays sur un fournisseur déjà implémenté ne demande **aucun déploiement** — prouvé en
   activant un pays sur un fournisseur simulé, service en marche.
3. La configuration peut **restreindre** une capacité déclarée par le code ; elle **ne peut pas
   l'étendre** — la tentative est refusée avec le motif.
4. Le défaut de routage de la plateforme est configurable et intervient au bon rang de la cascade
   (`STORY-152` §C).
5. La vérification d'un fournisseur alimente `/health` avec son état.
6. Un fournisseur **suspendu** ne reçoit plus de nouvelles demandes ; **les demandes en cours restent
   payables**.
7. ⚡ Les organisations affectées par une suspension sont **listables avant** de suspendre.
8. Le routage sans fournisseur éligible répond `409 { code: 'AUCUN_FOURNISSEUR_ELIGIBLE' }` avec le
   couple manquant nommé — jamais un échec technique.
9. Les identifiants plateforme ne sont **jamais restitués** ; empreinte partielle seulement.
10. Aucun identifiant n'apparaît dans les journaux — vérifié par inspection.
11. Le code d'un fournisseur est **stable et non réutilisable** ; les encaissements passés y renvoient.
12. Toute modification de configuration est **journalisée** : qui, quoi, avant/après.

---

## Notes techniques

### Le patron existe déjà

`STORY-032` a livré exactement cette forme pour le catalogue de modules : un registre administrable,
une machine d'états, des références stables. À reprendre plutôt qu'à réinventer.

### AC 7 mérite d'exister

Suspendre un fournisseur qui sert trois pays sans savoir qui en dépend, c'est couper des
organisations sans le savoir. La liste **avant** l'action est ce qui transforme une opération risquée
en décision informée.

---

## Risques & mitigation

| Risque | Mitigation |
|---|---|
| Ajouter un pays exige un déploiement | **AC 2**, prouvé service en marche |
| La configuration prétend activer une capacité que le code n'a pas | **AC 3** |
| Une suspension coupe des organisations à leur insu | **AC 6/7** |
| Un identifiant plateforme fuit | **AC 9/10** + mécanisme partagé avec `STORY-151` |

---

## Definition of Done

- [ ] Les 12 critères vérifiés
- [ ] `lint` 0 · couverture ≥ 90 %
- [ ] **Vérification docker** : activation d'un pays sans redéploiement, restriction de capacité,
      refus d'extension, suspension avec liste préalable des organisations affectées, inspection des
      journaux
- [ ] Revue de sécurité (secrets)
- [ ] Branche `MNV-168`, PR rebase-mergée sur `dev`

---

## Progress Tracking

*(à remplir à l'implémentation)*
