# STORY-155 : Promesse de paiement — un engagement daté dont le **sort se constate tout seul**

**Epic :** EPIC-004 — `paiement-service` (PI-SPI & encaissement)
**Réf. PRD :** [`prds/prd-paiement-service-2026-08-02/prd.md`](../prds/prd-paiement-service-2026-08-02/prd.md) §3 UJ-1 · §6 groupe E (FR-P28→P30)
**Réf. code livré :** **STORY-154** (solde restant), **STORY-150** (outbox)
**Dépend de :** STORY-154
**Débloque :** module **Relance (#24)** · `notification-service` (rappel à échéance) · STORY-159 (le solde restitue les promesses en cours)
**Priorité :** Must Have
**Story Points :** 5
**Complexité :** medium — l'objet est simple, **son sort observable ne l'est pas**
**Statut :** À faire
**Assigné à :** null
**Créée le :** 2026-08-02
**Sprint :** à planifier — **incrément 2**
**Service :** `paiement-service` (`:3005`)
**Couvre :** FR-P28 → FR-P30

---

## Contexte

Demande explicite du PO : *« dans le système on doit retracer les paiements partiels avec la promesse
de compléter qui sera enregistrée pour faciliter la relance »*.

Une promesse de paiement n'est pas une note de suivi. C'est **le seul signal d'intention que le
système possède** entre deux encaissements — et c'est celui sur lequel un chargé de relance décide
d'appeler ou de laisser courir.

> ⚡ **Ce qui rend cette story non triviale :** une promesse enregistrée et jamais confrontée à la
> réalité est pire qu'aucune promesse. Elle donne l'illusion d'un suivi. `FR-P29` exige donc que son
> **sort soit constaté à sa date, sans intervention humaine**.

---

## User Story

**En tant que** chargé de relance,
**je veux** que le système constate de lui-même si une promesse a été tenue,
**afin de** rappeler les débiteurs qui n'ont pas tenu parole, et **seulement** ceux-là.

---

## Périmètre

### A. L'objet promesse

Enregistrée sur un **solde restant** (STORY-154) :

| Champ | Note |
|---|---|
| Montant promis | `Montant` — peut être inférieur au solde |
| **Date promise** | Obligatoire — une promesse sans date n'est pas une promesse |
| Auteur de la saisie | Le commercial, le chargé de relance, ou le payeur lui-même via le lien |
| Canal de l'engagement | Au téléphone, en visite, par message, sur le lien de paiement |
| Créance et demande rattachées | — |

### B. Le sort observable — le cœur de la story

`FR-P29` : à sa date d'échéance, la promesse prend un sort **constaté par le système** :

| Sort | Condition |
|---|---|
| **Tenue** | Encaissements ≥ montant promis, à la date promise ou avant |
| **Partiellement tenue** | Encaissements > 0 mais < montant promis |
| **Non tenue** | Aucun encaissement sur la période |

**Aucune intervention humaine n'est requise** pour ce constat. C'est ce qui distingue une promesse
exploitable d'un pense-bête.

⚠️ **Le constat est calculé sur les encaissements *confirmés et déclarés-validés*** — pas sur les
déclarations en attente (STORY-156). Une promesse déclarée tenue sur un encaissement non validé se
retournerait au premier rapprochement.

### C. Plusieurs promesses, un historique

Un payeur peut promettre, ne pas tenir, et **promettre à nouveau**. Les promesses ne s'écrasent pas :
elles s'accumulent, et la suite des sorts est **la donnée la plus utile du module pour la relance** —
un débiteur qui a rompu trois promesses n'est pas un débiteur en retard, c'est autre chose.

### D. Publication — ce module ne relance pas

`FR-P30` : promesses et soldes sont **publiés** (événement sortant) vers **Relance (#24)** et
`notification-service`.

> Ce module **ne décide d'aucune relance** et n'envoie aucun message. Il constate et publie.
> La frontière est celle du PRD `notification-service` : **exécution / intention / décision**.

### E. Hors périmètre

L'escalade, le choix du canal, le message envoyé, le blocage de crédit. Tout cela appartient à
Relance (#24) et à `notification-service`.

---

## Critères d'acceptation

1. Une promesse **sans date** est refusée `422 { code: 'DATE_PROMISE_REQUISE' }`.
2. Une promesse sur une créance **soldée** est refusée.
3. Un montant promis supérieur au solde restant est refusé, avec le solde dans le message.
4. À la date promise, une promesse couverte par des encaissements suffisants passe **`tenue`**
   **sans aucune action humaine**.
5. Partiellement couverte → **`partiellement tenue`**, avec le montant manquant.
6. Non couverte → **`non tenue`**.
7. ⚡ Un encaissement **déclaré et non encore validé** (STORY-156) **ne fait pas** passer une promesse
   à `tenue` ; il la laisse en attente jusqu'à validation.
8. Trois promesses successives sur la même créance sont **toutes conservées** avec leur sort.
9. L'événement de changement de sort est publié via l'**outbox transactionnel** — atomicité prouvée.
10. Le service **n'émet aucun message** vers un payeur : aucune dépendance sortante vers un canal.

---

## Notes techniques

### Comment le constat se déclenche

Traitement planifié quotidien, **idempotent** : rejouer la journée ne modifie aucun sort déjà constaté.
Un sort constaté est **figé** — il ne se recalcule pas si un encaissement arrive après coup ; celui-ci
alimente le solde, pas le passé.

### Ce que AC 7 protège

Sans lui, un commercial qui déclare un encaissement en espèces le vendredi fait passer la promesse à
`tenue` — et si la remise du soir ne confirme rien, le système a menti au chargé de relance, qui n'a
pas appelé.

---

## Risques & mitigation

| Risque | Mitigation |
|---|---|
| Une promesse enregistrée n'est jamais confrontée → suivi illusoire | **AC 4/5/6** : constat automatique, en DoD |
| Une déclaration non validée fait passer une promesse à `tenue` | **AC 7** |
| Le module se met à relancer « puisqu'il sait » | **AC 10** : aucune dépendance sortante vers un canal |

---

## Definition of Done

- [ ] Les 10 critères vérifiés
- [ ] `lint` 0 · couverture ≥ 90 %
- [ ] **Vérification docker** : constat automatique sur les trois sorts, rejeu du traitement planifié
      sans effet, promesse laissée en attente sur encaissement non validé
- [ ] Branche `MNV-155`, PR rebase-mergée sur `dev`

---

## Progress Tracking

*(à remplir à l'implémentation)*
