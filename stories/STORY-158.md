# STORY-158 : Annulation — **constatée, jamais initiée**, contre-passée et jamais effacée

**Epic :** EPIC-004 — `paiement-service` (PI-SPI & encaissement)
**Réf. PRD :** [`prds/prd-paiement-service-2026-08-02/prd.md`](../prds/prd-paiement-service-2026-08-02/prd.md) §6 groupe I (FR-P49→P53) · §7 NFR-1, NFR-4
**Réf. code livré :** **STORY-065** (`bilan-service` — snapshot append-only) · **STORY-067** (piste d'audit append-only) · **STORY-156** (séparation des pouvoirs)
**Dépend de :** STORY-154, STORY-156
**Débloque :** Facturation (#17) — l'avoir · la comptabilité
**Priorité :** Must Have
**Story Points :** 5
**Complexité :** medium — **la difficulté est de ne pas faire trop**
**Statut :** À faire
**Assigné à :** null
**Créée le :** 2026-08-02
**Sprint :** **32** — **incrément 2**  *(slotté le 2026-08-03 ; décalé de 9 sprints le même jour — le module fiscalité passe devant, cf. `reserved_sprints`)*
**Service :** `paiement-service` (`:3005`)
**Couvre :** FR-P49 → FR-P53 · FR-P60 *(complément)*

---

## Contexte

Réponse du PO : *« l'annulation ne se gère pas au niveau de Prospera, mais vu que nous pourrons gérer
la comptabilité, le client doit avoir la possibilité de rentrer cela dans le système qu'il y a eu
annulation — mais pas n'importe quel rôle aussi »*.

Cette réponse est **cohérente avec l'invariant fondateur** et il faut le dire explicitement :
**Prospera ne détient pas les fonds, donc Prospera ne peut pas les rendre.** Un service qui
proposerait un bouton « rembourser » promettrait quelque chose qu'il est structurellement incapable
de faire.

Mais l'annulation **existe dans la vraie vie** — un mauvais montant, une mauvaise facture, un
paiement en double corrigé par le distributeur avec son PSP. Et comme Prospera tient la comptabilité,
il doit pouvoir **l'enregistrer**.

> **La ligne : constater, pas agir.**

---

## User Story

**En tant que** responsable financier,
**je veux** enregistrer qu'un encaissement a été annulé entre mon client et mon prestataire,
**afin que** ma créance retrouve son solde et que ma comptabilité soit juste — sans que Prospera
prétende avoir effectué le remboursement.

---

## Périmètre

### A. Ce que le service ne fait pas

`FR-P49` : **aucune initiation de remboursement.** Pas d'appel au fournisseur, pas de bouton, pas de
promesse. Le remboursement se règle entre le client et son prestataire, hors système.

Si un fournisseur le permet techniquement, **ce n'est pas une raison** : l'exposer ferait de Prospera
l'auteur d'un mouvement de fonds qu'il ne détient pas.

### B. L'annulation constatée

`FR-P50` : enregistrement d'une annulation **survenue ailleurs** :

| Champ | Note |
|---|---|
| Encaissement concerné | Obligatoire |
| **Motif** | Obligatoire, choisi dans une liste + précision libre |
| Date de l'annulation réelle | Peut être antérieure à la saisie |
| Pièce justificative | Optionnelle — reçu du PSP, capture, courrier |
| Auteur | Tracé |

**La créance retrouve son solde.**

### C. Append-only — la contre-passation

`FR-P52` : une annulation **ne supprime pas** l'encaissement d'origine, elle le **contre-passe**.

```
Encaissement  +153 000   (2026-03-04, confirmé)
Annulation    −153 000   (2026-03-11, motif : mauvais montant)
                ────────
Solde effectif       0
```

L'historique reste lisible. C'est le patron de `STORY-065` et `STORY-067` : **une correction est une
écriture de plus, jamais une réécriture** (`NFR-4`).

### D. Séparation des pouvoirs — trois droits, pas deux

`FR-P51` + `FR-P60` : **enregistrer une annulation** est un droit **distinct de celui qui déclare un
encaissement**.

> Celui qui constate l'entrée d'argent ne doit pas pouvoir l'effacer seul.

Le module compte donc **trois droits qui ne se cumulent pas par défaut** :

| Droit | Qui l'exerce typiquement |
|---|---|
| Déclarer un encaissement | Commercial, caissier |
| Valider un encaissement | Responsable, via la remise |
| **Enregistrer une annulation** | **Responsable financier** |

⚠️ Comme en `STORY-156`, le contrôle porte sur **la personne**, pas seulement sur le rôle.

### E. Publication

`FR-P53` : l'annulation est publiée vers **Facturation (#17)** — qui en fera un avoir — et vers la
comptabilité. Via l'outbox transactionnel : atomique avec l'enregistrement.

### F. Effet sur les promesses

Une annulation qui remet du solde **peut invalider le sort d'une promesse déjà constatée `tenue`**
(STORY-155).

> **Décision :** le sort constaté **ne se recalcule pas**. L'annulation crée un **nouveau solde**, donc
> potentiellement une **nouvelle promesse à obtenir** — elle ne réécrit pas le passé. Cohérent avec
> `NFR-4` et avec la règle de `STORY-155` (un sort constaté est figé).

---

## Critères d'acceptation

1. **Aucun endpoint d'initiation de remboursement n'existe** — vérifié par revue de la surface d'API.
2. Une annulation sans **motif** est refusée `422`.
3. L'encaissement d'origine **reste présent et inchangé** ; l'annulation est une écriture distincte.
4. La créance **retrouve son solde** exactement, en tenant compte des frais enregistrés (FR-P24b).
5. ⚡ Un utilisateur qui a **déclaré** un encaissement ne peut pas enregistrer son annulation — contrôle
   **sur la personne**.
6. Le droit d'annuler est refusé aux rôles non habilités `403`.
7. Une annulation partielle est possible ; le solde restant est exact.
8. L'annulation est publiée via l'outbox — atomicité prouvée par `abort()` provoqué.
9. Une pièce justificative jointe est conservée et restituée avec l'annulation.
10. ⚡ Le **sort d'une promesse déjà constatée n'est pas recalculé** par une annulation postérieure.
11. La piste d'audit conserve : qui, quoi, quand, motif, montant avant/après.
12. Une tentative d'annulation d'un encaissement **déjà annulé** est refusée avec le motif.

---

## Notes techniques

### Pourquoi AC 1 est un critère

C'est le seul moyen de vérifier une **absence**. Un développeur bien intentionné, voyant que FedaPay
expose un remboursement, l'exposera « puisque c'est possible ». La revue de surface d'API le prend.

### Annulation vs invalidation d'une déclaration

Ce sont **deux choses différentes** :

| | Objet | Story |
|---|---|---|
| **Invalidation** | Une déclaration d'espèces que la remise n'a pas confirmée — l'argent **n'est jamais entré** | `STORY-156` AC 9 |
| **Annulation** | Un encaissement **réel** défait après coup entre le client et son PSP | Ici |

Les confondre produirait un solde faux dans les deux sens.

---

## Risques & mitigation

| Risque | Mitigation |
|---|---|
| ⚡ Un bouton « rembourser » apparaît parce que le fournisseur le permet | **AC 1** + revue de surface d'API |
| Celui qui déclare annule sa propre erreur sans contrôle | **AC 5** : contrôle sur la personne |
| L'annulation supprime l'encaissement → historique perdu | **AC 3** : contre-passation |
| Annulation et invalidation sont confondues | Note technique + vocabulaire distinct |

---

## Definition of Done

- [ ] Les 12 critères vérifiés
- [ ] **Revue de la surface d'API** confirmant l'absence de tout chemin d'initiation de remboursement
- [ ] `lint` 0 · couverture ≥ 90 %
- [ ] **Vérification docker** : contre-passation, solde rétabli, auto-annulation refusée, promesse non
      recalculée, atomicité de la publication
- [ ] Branche `MNV-158`, PR rebase-mergée sur `dev`

---

## Progress Tracking

*(à remplir à l'implémentation)*
