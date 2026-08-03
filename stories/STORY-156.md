# STORY-156 : Paiement hors Prospera — **déclaré** puis **validé par la remise d'espèces**, jamais l'un sans l'autre

**Epic :** EPIC-004 — `paiement-service` (PI-SPI & encaissement)
**Réf. PRD :** [`prds/prd-paiement-service-2026-08-02/prd.md`](../prds/prd-paiement-service-2026-08-02/prd.md) §3 UJ-1 *(le commercial qui encaisse 100 000 F en espèces)* · §6 groupe F (FR-P31→P36)
**Réf. code livré (patron à réutiliser, **ne pas réinventer**) :** **STORY-089/090** (`balance-service` — rapprochement relevé bancaire ↔ mouvements : import de la preuve du tiers, confrontation, exposition de ce qui ne s'apparie pas)
**Dépend de :** STORY-154
**Débloque :** STORY-157 (la réconciliation traite les deux origines), STORY-159 (le solde distingue certain et déclaré)
**Priorité :** Must Have
**Story Points :** 8
**Complexité :** high — **c'est la story qui fait que la balance créances est vraie**
**Statut :** À faire
**Assigné à :** null
**Créée le :** 2026-08-02
**Sprint :** **32** — **incrément 2**  *(slotté le 2026-08-03 ; décalé de 9 sprints le même jour — le module fiscalité passe devant, cf. `reserved_sprints`)*
**Service :** `paiement-service` (`:3005`)
**Couvre :** FR-P31 → FR-P36 · NFR-4

---

## Contexte — la moitié de la valeur du module

Réponse du PO : *« une saisie manuelle mais un rapprochement dans le système avec une facture qui est
générée, et avec la remise en espèces le soir cela pourra être validé »*.

> ⚡ **En distribution ouest-africaine, l'encaissement en espèces sur tournée n'est pas le cas
> marginal — c'est probablement le cas majoritaire.** Un module d'encaissement qui ne voit que ses
> propres liens produit une **balance créances fausse**. Et c'est précisément ce que le bundle
> *Finance & Recouvrement* promet de corriger (« rapprochement manuel → 0 »).

Le PRD en fait un **cas de premier rang**, pas un rattrapage.

### Le patron existe déjà, il ne se réinvente pas

`STORY-089/090` a livré dans `balance-service` exactement cette mécanique : importer la preuve d'un
tiers, la confronter à ce que le système croit, et **exposer ce qui ne s'apparie pas**. Cette story
la transpose ; elle ne la réécrit pas.

---

## User Story

**En tant que** commercial en tournée,
**je veux** enregistrer les 200 000 F que Kossi vient de me donner en espèces,
**afin que** son solde soit juste immédiatement — sans que le système fasse comme si c'était déjà
dans la caisse.

**En tant que** responsable financier,
**je veux** que cet encaissement ne devienne certain qu'après la remise du soir,
**afin de** ne pas confondre ce qu'on a **dit** avoir reçu et ce qu'on a **réellement** reçu.

---

## Périmètre

### A. La déclaration

| Champ | Note |
|---|---|
| Montant, devise | `Montant` |
| **Moyen** | espèces · MoMo direct · virement · chèque |
| Date d'encaissement | ⚠️ **peut être antérieure** à la saisie — le commercial saisit le soir |
| **Encaisseur** | Celui qui a reçu l'argent |
| **Auteur de la saisie** | ⚠️ **Champ distinct** — ce n'est pas toujours la même personne |
| Créance rattachée | — |

`FR-P36` : la déclaration est réservée à un **rôle habilité**.

### B. Les deux temps — l'invariant de la story

```
déclaré  ──(remise d'espèces rapprochée)──►  validé
   │                                            
   └──(délai dépassé)──►  écart signalé
```

| État | Effet sur le solde | Comment il se voit |
|---|---|---|
| **`déclaré`** | **Diminue le solde affiché** | **Distingué visuellement ET dans les données** d'un encaissement confirmé |
| **`validé`** | Solde certain | Confondu avec un encaissement fournisseur |

> ⚡ **`FR-P32` est la subtilité :** un encaissement déclaré **diminue bien le solde** — sinon le
> commercial voit une créance qu'il sait éteinte et relance un client qui a payé. Mais il est
> **marqué**, parce qu'un responsable financier ne doit pas prendre une déclaration pour un fait.

### C. La validation par la remise

`FR-P33` : le passage à `validé` se fait par **rapprochement avec la remise d'espèces du jour**, ou à
défaut par **confirmation d'un rôle habilité**.

⚠️ **Le module Terrain (#9), qui porte la remise d'espèces, n'existe pas encore** *(assumption A3 du
PRD)*. Au v1 :

- La **couture de rapprochement est écrite** — un point d'entrée reçoit une remise et apparie
- Le **chemin de repli** est la confirmation par un rôle habilité, **distinct de celui qui déclare**
- Quand Terrain arrivera, il se branche **sans changer le contrat**

### D. L'écart

`FR-P34` : un encaissement déclaré non validé au-delà d'un délai — **défaut 48 h ouvrées,
paramétrable par organisation, plafond 7 jours** — **remonte comme écart**, avec son encaisseur nommé.

L'écart n'annule pas la déclaration : il la **signale**. C'est au responsable de trancher.

### E. Séparation des pouvoirs

`FR-P35` + `FR-P60` : **déclarer** et **valider** sont deux droits qui **ne se cumulent pas par
défaut** sur un même rôle.

> Celui qui constate l'entrée d'argent ne doit pas pouvoir la confirmer seul. C'est la règle de base
> de tout circuit d'espèces, et le marché visé est un marché d'espèces.

---

## Critères d'acceptation

1. Une déclaration crée un encaissement à l'état **`déclaré`**, avec **encaisseur** et **auteur de
   saisie** en champs distincts.
2. Un encaissement `déclaré` **diminue le solde affiché** de la créance.
3. ⚡ Le solde restitue **séparément** la part certaine et la part déclarée — jamais un seul nombre.
4. Une date d'encaissement **antérieure à la saisie** est acceptée ; une date **future** est refusée.
5. Le rapprochement avec une remise fait passer l'encaissement à **`validé`**.
6. La confirmation par un rôle habilité fait passer à `validé` **si et seulement si** ce rôle est
   distinct de celui qui a déclaré.
7. ⚡ Un utilisateur qui cumule les deux droits **ne peut pas valider sa propre déclaration** — le
   contrôle porte sur **la personne**, pas seulement sur le rôle.
8. Au-delà de **48 h ouvrées** sans validation, l'encaissement remonte comme **écart**, avec son
   encaisseur.
9. Un encaissement déclaré puis **invalidé** rétablit le solde et laisse une trace ; il n'est jamais
   supprimé.
10. La déclaration par un rôle non habilité est refusée `403`.
11. Le point d'entrée de rapprochement de remise existe et est testé avec une remise simulée — la
    couture est **prouvée**, pas seulement prévue.
12. Toute déclaration, validation et invalidation est **journalisée** en append-only.

---

## Notes techniques

### AC 7 mérite d'être lu deux fois

Le contrôle porte sur **la personne**, pas sur le rôle. Un directeur qui détient les deux permissions
ne doit pas pouvoir valider ce qu'il a lui-même déclaré. Le contrôle par rôle seul laisserait passer
exactement le cas qu'on veut empêcher.

### Ce qui se reprend de STORY-089/090

La forme de l'appariement (clés, tolérance, exposition des non-appariés) et le vocabulaire.
**Ne pas reprendre** : le format de relevé bancaire, spécifique à la comptabilité.

---

## Risques & mitigation

| Risque | Mitigation |
|---|---|
| ⚡ Une déclaration est prise pour un encaissement certain → décisions financières sur du vent | **AC 3** : solde toujours ventilé certain / déclaré |
| Le commercial déclare et valide lui-même | **AC 6/7** : contrôle sur la personne |
| Les déclarations s'accumulent sans jamais être validées | **AC 8** : écart automatique + `SM-4` du PRD |
| La couture de remise est « prévue » et ne fonctionne pas quand Terrain arrive | **AC 11** : prouvée avec une remise simulée |
| Le patron de `STORY-089/090` est réécrit au lieu d'être repris | Revue de conception |

---

## Definition of Done

- [ ] Les 12 critères vérifiés
- [ ] `lint` 0 · couverture ≥ 90 %
- [ ] **Vérification docker** : déclaration → solde ventilé → remise simulée → validation ; tentative
      d'auto-validation refusée ; écart à 48 h ouvrées ; invalidation traçante
- [ ] Revue de sécurité : séparation des pouvoirs vérifiée **par la personne**
- [ ] Branche `MNV-156`, PR rebase-mergée sur `dev`

---

## Progress Tracking

*(à remplir à l'implémentation)*
