# STORY-163 : Impayé, période de grâce et rétablissement — **la suspension est la règle, la grâce une dérogation**

**Epic :** EPIC-004 — `paiement-service` (PI-SPI & encaissement)
**Réf. PRD :** [`prds/prd-paiement-service-2026-08-02/prd.md`](../prds/prd-paiement-service-2026-08-02/prd.md) §6 groupe H (FR-P45→P48) · §8 **CM-1** *(une suspension est une perte de client, pas un succès)*
**Réf. code livré :** **STORY-162** (l'octroi par événement — la révocation emprunte le même chemin) · **STORY-144** (réactivation d'organisation — ⚠️ *l'impasse d'exploitation déjà rencontrée*, voir §E) · `notification-service` (préavis)
**Dépend de :** STORY-162
**Débloque :** STORY-165 (e2e)
**Priorité :** Must Have
**Story Points :** 5
**Complexité :** medium — **la difficulté est de rendre la coupure réversible et prévenue**
**Statut :** À faire
**Assigné à :** null
**Créée le :** 2026-08-02
**Sprint :** à planifier — **incrément 3**
**Service :** `paiement-service` (`:3005`)
**Couvre :** FR-P45 → FR-P48

---

## Contexte

Réponse du PO : *« l'abonnement, normalement impayé = suspension directe, mais on peut attribuer des
périodes de grâce en fonction du type de client »*.

Cette formulation dit **deux choses**, et l'ordre compte :

1. **La suspension est la règle par défaut** — pas un délai implicite de quelques jours qu'on n'a
   jamais écrit
2. **La grâce est une dérogation** — attribuée, datée, motivée, tracée

> ⚡ La différence entre les deux formulations est celle qui fait qu'un produit se fait payer ou pas.
> « Suspension après un délai de tolérance » signifie que tout le monde a le délai. « Suspension, sauf
> grâce attribuée » signifie que quelqu'un a décidé.

---

## User Story

**En tant que** Money Vibes,
**je veux** que les modules d'un client qui ne paie pas se ferment,
**afin de** ne pas financer indéfiniment un service non réglé.

**En tant que** client dont le virement a pris trois jours,
**je veux** être prévenu avant la coupure et rétabli dès que je paie,
**afin de** ne pas découvrir un matin que mes équipes ne peuvent plus travailler.

---

## Périmètre

### A. Le cycle

```
actif ──(échéance non encaissée)──► impayé ──────────────────► suspendu
                                        │                          │
                                        └──(grâce attribuée)──► en grâce ──(terme)──► suspendu
                                                                                          │
        ◄──────────────────(encaissement du retard)───────────────────────────────────────┘
```

### B. La suspension

`FR-P45` : **impayé = suspension**, sans délai implicite.

La suspension **révoque les entitlements** — par le **même chemin que l'octroi** : un événement
portant l'état absolu attendu, désormais vide ou réduit (STORY-162). Aucun second mécanisme.

### C. La période de grâce

`FR-P46` : **explicite, datée, motivée, attribuée par un rôle habilité et tracée**.

| Contrainte | Valeur |
|---|---|
| Durée maximale **obligatoire** | **défaut 30 jours**, **plafond 90** |
| Droit requis | `paiement:grace:attribuer` (STORY-160) |
| Motif | Obligatoire |
| Trace | Qui, quand, pourquoi, jusqu'à quand |

> ⚡ **Une grâce sans terme est une suspension qui n'arrive jamais.** Le plafond n'est pas une
> commodité de configuration : c'est ce qui empêche qu'un geste commercial devienne un abonnement
> gratuit dont plus personne ne se souvient.

Le PO a précisé *« en fonction du type de client »* : la **grille** de durées par type est une
décision commerciale non tranchée *(Q11 du PRD)*. En attendant, les bornes ci-dessus s'appliquent et
l'attribution reste manuelle.

### D. Le rétablissement — automatique

`FR-P47` : l'encaissement du retard **rétablit les entitlements sans intervention manuelle**.

Même chemin que l'octroi : un événement d'état absolu. Le client qui paie à 22 h retrouve ses modules
sans attendre qu'un humain arrive le lendemain.

### E. ⚠️ L'impasse déjà rencontrée — ne pas la refaire

`STORY-144` a documenté un défaut d'exploitation dans `auth-service` :

> *« `POST /admin/organizations/:id/suspend` **existe**, et **aucune route ne réactive**. Une
> organisation suspendue ne peut plus revenir — il n'y a pas de chemin de retour, quel que soit le
> motif de la suspension. »*

**Cette story ne doit pas reproduire le même défaut.** Toute suspension livrée ici s'accompagne de son
chemin de retour, testé — automatique par l'encaissement (§D) **et** manuel par un rôle habilité, pour
les cas réglés hors système.

### F. Le préavis

`FR-P48` : l'organisation est **prévenue avant l'échéance et avant la suspension**, via
`notification-service`.

> **Une coupure sans préavis est un défaut, pas une politique.** Elle transforme un incident de
> paiement en incident de confiance.

Deux messages au minimum : à l'approche de l'échéance, et avant la suspension effective. Ce module
**décide** qu'il faut prévenir ; `notification-service` **envoie**.

---

## Critères d'acceptation

1. Une échéance non encaissée fait passer l'abonnement à `impayé` **sans délai implicite**.
2. `impayé` déclenche la **suspension** et la révocation des entitlements, **par le même événement
   d'état absolu** que l'octroi — aucun second mécanisme.
3. Une grâce **sans terme** est refusée `422` ; une grâce au-delà de **90 jours** est refusée.
4. Une grâce **sans motif** est refusée.
5. La grâce exige le droit `paiement:grace:attribuer` ; un autre rôle est refusé `403`.
6. Au terme de la grâce, la suspension s'applique **sans intervention**.
7. ⚡ L'**encaissement du retard rétablit les entitlements automatiquement**, sans action humaine.
8. ⚡ **Un chemin de retour manuel existe et est testé** — pour un règlement constaté hors système.
   *(Non-régression du défaut `STORY-144`.)*
9. Un préavis est émis **avant l'échéance** et **avant la suspension** — vérifiable par les événements
   destinés à `notification-service`.
10. Toute attribution, expiration et révocation de grâce est **journalisée** : qui, quand, motif, terme.
11. Le rétablissement republie `entitlement.changed` ; les consommateurs existants le reçoivent sans
    modification.
12. Un abonnement suspendu puis rétabli **conserve son historique complet** — aucun état effacé.

---

## Notes techniques

### Pourquoi la révocation emprunte le chemin de l'octroi

Un second mécanisme de révocation, c'est un second endroit où l'état peut diverger. L'événement d'état
absolu (`C7`) rend la question sans objet : révoquer, c'est publier un état où les modules ne sont
plus là. Le catalogue applique, comme toujours.

### Ce que CM-1 surveille

Le PRD pose une contre-métrique : *une hausse des suspensions pour impayé est une alerte, pas un
succès de recouvrement*. Une suspension est une perte de client. Le dispositif doit être efficace **et**
rare.

---

## Risques & mitigation

| Risque | Mitigation |
|---|---|
| ⚡ Une suspension sans chemin de retour — le défaut de `STORY-144` | **AC 7/8** : retour automatique **et** manuel, tous deux testés |
| Une grâce sans terme devient un abonnement gratuit oublié | **AC 3** : terme obligatoire, plafond 90 j |
| Un client est coupé sans préavis | **AC 9** |
| Un second mécanisme de révocation diverge de l'octroi | **AC 2** : même événement d'état absolu |
| Le délai implicite se réintroduit « pour être gentil » | **AC 1** : la tolérance est une grâce attribuée, pas un défaut |

---

## Definition of Done

- [ ] Les 12 critères vérifiés
- [ ] `lint` 0 · couverture ≥ 90 %
- [ ] **Vérification docker** : impayé → suspension → entitlements révoqués → encaissement du retard →
      rétablissement automatique ; grâce sans terme refusée ; terme atteint → suspension ;
      **chemin de retour manuel testé**
- [ ] Branche `MNV-163`, PR rebase-mergée sur `dev`

---

## Progress Tracking

*(à remplir à l'implémentation)*
