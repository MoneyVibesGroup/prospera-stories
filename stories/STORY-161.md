# STORY-161 : Abonnement Prospera — **le seul cas où Money Vibes est bénéficiaire**

**Epic :** EPIC-004 — `paiement-service` (PI-SPI & encaissement)
**Réf. PRD :** [`prds/prd-paiement-service-2026-08-02/prd.md`](../prds/prd-paiement-service-2026-08-02/prd.md) §6 groupe H (FR-P42, FR-P43) · §7 **NFR-1c**
**Réf. commerciale :** `prospera-font-end/docs/prospera_modules_bundles_distributeur.md` §2 *(grille tarifaire : plateforme complète et 4 bundles, profils Grand / Moyen / Petit, achat unique ou abonnement mensuel, 2 mois d'essai)*
**Réf. code livré :** **STORY-150→154** *(toute la mécanique d'encaissement est réutilisée telle quelle)* · **STORY-151** AC 11 *(le contrôle qui n'autorise Money Vibes comme bénéficiaire que sur ce chemin)*
**Dépend de :** STORY-154
**Débloque :** STORY-162 (octroi), STORY-163 (impayé et grâce)
**Priorité :** Must Have
**Story Points :** 5
**Complexité :** medium — **la mécanique existe déjà ; ce qui est neuf, c'est le contrat commercial**
**Statut :** À faire
**Assigné à :** null
**Créée le :** 2026-08-02
**Sprint :** à planifier — **incrément 3**
**Service :** `paiement-service` (`:3005`)
**Couvre :** FR-P42, FR-P43 · NFR-1c

---

## Contexte

Le PRD couvre **deux objets** qui partagent la même mécanique et diffèrent par **une seule chose** :

| | Cas **A** — encaissement client | Cas **C** — abonnement |
|---|---|---|
| Qui paie | Le détaillant, l'emprunteur | **Le client Prospera** |
| Qui reçoit | **L'organisation cliente** | **Money Vibes** |
| Mécanique | demande → lien → fournisseur → encaissement | **identique** |

> ⚡ **`NFR-1c` : l'abonnement est le seul cas où Money Vibes est bénéficiaire — sur son propre
> compte, pour son propre compte.** Ce n'est pas une exception à l'invariant « Prospera ne détient
> jamais les fonds » : c'est sa formulation exacte. Prospera encaisse **ce qui lui est dû**, jamais ce
> qui est dû à un tiers.

`STORY-151` AC 11 a posé le contrôle : un compte au nom de Money Vibes est **refusé** sur le chemin
d'encaissement client, et **admis** ici seulement.

---

## User Story

**En tant que** Money Vibes,
**je veux** encaisser les abonnements de mes clients avec la même mécanique que celle que je leur
vends,
**afin de** ne pas maintenir deux systèmes de paiement et d'éprouver le mien sur moi-même.

---

## Périmètre

### A. L'objet abonnement

| Champ | Note |
|---|---|
| Organisation cliente | — |
| **Modules souscrits** | Liste — c'est elle qui deviendra l'entitlement (STORY-162) |
| Périodicité | Mensuelle, annuelle |
| Montant, **devise** | `Montant` — la grille est en FCFA, le modèle ne le suppose pas |
| Date de début, échéance courante | — |
| État | `en essai` · `actif` · `impayé` · `en grâce` · `suspendu` · `résilié` |
| Bénéficiaire | **Compte Money Vibes** — le seul admis ici |

### B. Ce que la grille commerciale impose au modèle

La grille existante n'est pas un simple prix mensuel, et le modèle doit la porter :

| Élément de la grille | Conséquence sur le modèle |
|---|---|
| **Profils Grand / Moyen / Petit** | Le montant n'est pas dérivé du module : il est **porté par l'abonnement** |
| **Achat unique** *ou* abonnement | Deux natures : un abonnement **périodique** et une **acquisition** avec maintenance annuelle |
| **2 mois d'essai gratuits** | État `en essai` : les modules sont **ouverts sans encaissement**, avec une échéance |
| **Bundles** *(Terrain & Ventes, Finance & Recouvrement…)* | Un abonnement porte **plusieurs modules** ; le bundle est une **façon de vendre**, pas un objet du modèle |
| **Add-on Réseau Freelance** | Une ligne d'abonnement supplémentaire, éventuellement **par freelance actif** |

> ⚡ **Le bundle n'entre pas dans le modèle.** Il vit dans l'argumentaire commercial ; l'abonnement ne
> connaît que des **modules**. Sinon chaque évolution de l'offre commerciale devient une migration
> de données.

### C. L'échéance

À chaque échéance, une **demande de paiement** est émise — le même objet que pour un détaillant
(STORY-153), avec Money Vibes en bénéficiaire. Son encaissement suit le chemin de `STORY-154`.

Le client reçoit son lien par `notification-service` : **ce module ne parle jamais au payeur**.

### D. La période d'essai

Un abonnement `en essai` ouvre les modules **sans aucun encaissement**, jusqu'à une échéance datée.
À son terme : première demande de paiement, puis les règles d'impayé de `STORY-163` s'appliquent.

⚠️ L'essai est **daté à la création**, jamais prolongé implicitement. Une prolongation est une
décision tracée, comme une période de grâce.

### E. Hors périmètre

L'octroi des entitlements (STORY-162), l'impayé et la grâce (STORY-163), la facturation de
l'abonnement au sens comptable (Facturation #17).

---

## Critères d'acceptation

1. Un abonnement lie une organisation à **une liste de modules**, avec périodicité, montant, devise,
   échéance.
2. ⚡ Le bénéficiaire d'un abonnement est **un compte Money Vibes** ; tout autre bénéficiaire est refusé.
3. ⚡ Réciproquement, un compte Money Vibes reste **refusé** comme bénéficiaire d'un encaissement du
   cas A — le contrôle de `STORY-151` AC 11 n'est pas affaibli par cette story.
4. Un abonnement `en essai` ouvre ses modules **sans encaissement**, jusqu'à une échéance datée.
5. La fin d'essai déclenche l'émission d'une **demande de paiement**, identique dans sa forme à celle
   d'un détaillant.
6. Une prolongation d'essai est **explicite, datée, tracée** — jamais un décalage silencieux.
7. Le montant est **porté par l'abonnement**, pas dérivé des modules — deux clients de profils
   différents paient des montants différents pour les mêmes modules.
8. Un abonnement porte **plusieurs modules** ; aucun objet « bundle » n'existe dans le modèle.
9. La devise est portée par l'abonnement et suit les règles d'exactitude (entier d'unité mineure).
10. Le lien de paiement de l'échéance est transmis par `notification-service`, jamais émis directement.
11. Les états et leurs transitions sont explicites ; aucun retour arrière non prévu.

---

## Notes techniques

### Ce qui est réutilisé tel quel

Compte d'encaissement (151), routage fournisseur (152), demande et lien (153), encaissement et
idempotence (154). **Aucune duplication** : si l'abonnement avait son propre chemin d'encaissement,
Money Vibes n'éprouverait pas son propre produit.

### L'add-on par freelance actif

La grille prévoit un tarif **par freelance actif**. Le comptage des freelances actifs appartient au
module PDV (#2), qui n'existe pas encore. Au v1 : **quantité saisie sur la ligne d'abonnement**,
avec la couture prête pour un comptage automatique *(assumption)*.

---

## Risques & mitigation

| Risque | Mitigation |
|---|---|
| ⚡ Le compte Money Vibes devient utilisable sur le chemin client | **AC 3** : contrôle de STORY-151 rejoué |
| Le bundle entre dans le modèle → chaque évolution commerciale devient une migration | **AC 8** |
| L'essai se prolonge silencieusement et des clients utilisent gratuitement | **AC 6** |
| Un second chemin d'encaissement est créé pour l'abonnement | Note technique : réutilisation stricte de 151→154 |

---

## Definition of Done

- [ ] Les 11 critères vérifiés
- [ ] `lint` 0 · couverture ≥ 90 %
- [ ] **Vérification docker** : abonnement en essai → fin d'essai → demande émise → encaissée ;
      bénéficiaire non-Money-Vibes refusé ; compte MV refusé sur le chemin client
- [ ] Branche `MNV-161`, PR rebase-mergée sur `dev`

---

## Progress Tracking

*(à remplir à l'implémentation)*
