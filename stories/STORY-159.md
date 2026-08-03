# STORY-159 : Le solde d'une créance — **le certain et le déclaré ne se confondent jamais**

**Epic :** EPIC-004 — `paiement-service` (PI-SPI & encaissement)
**Réf. PRD :** [`prds/prd-paiement-service-2026-08-02/prd.md`](../prds/prd-paiement-service-2026-08-02/prd.md) §6 groupe G (FR-P37, FR-P40, FR-P64) · §2 *(« rend une créance dont le solde est vrai »)*
**Réf. code livré :** **STORY-154** (encaissements), **STORY-155** (promesses), **STORY-156** (déclarés), **STORY-157** (réconciliation), **STORY-158** (annulations)
**Dépend de :** STORY-155, STORY-156, STORY-157, STORY-158
**Débloque :** Facturation (#17) · Finance (#21) · Relance (#24) · Assistant IA (#6)
**Priorité :** Must Have
**Story Points :** 5
**Complexité :** medium — **c'est une story d'agrégation, et le piège est de simplifier**
**Statut :** À faire
**Assigné à :** null
**Créée le :** 2026-08-02
**Sprint :** à planifier — **incrément 2** *(story de clôture)*
**Service :** `paiement-service` (`:3005`)
**Couvre :** FR-P37, FR-P40, FR-P64

---

## Contexte

La vision du module tient en une phrase : *« il constate ce qui a été payé — par lui ou en dehors de
lui — et **rend une créance dont le solde est vrai** »*.

Cette story est celle qui rend ce solde. Elle agrège cinq stories, et **toute sa difficulté est de
résister à la simplification** : la tentation d'exposer **un** nombre.

> ⚡ **Il n'y a pas un solde, il y en a deux — et les fondre serait mentir.**
> Ce qui est **certain** (confirmé par un fournisseur, ou déclaré puis validé) et ce qui est
> **déclaré** (annoncé, pas encore confirmé) n'engagent pas les mêmes décisions. Un commercial peut
> agir sur le déclaré ; un directeur financier ne peut pas.

---

## User Story

**En tant que** module consommateur — Facturation, Relance, Finance —
**je veux** connaître pour une créance ce qui est certainement payé, ce qui est annoncé, ce qui reste
dû et ce qui est promis,
**afin de** décider sur une information dont je connais le degré de certitude.

---

## Périmètre

### A. Ce que restitue une créance

`FR-P37` :

| Élément | Nature |
|---|---|
| **Montant d'origine** | Créance projetée (STORY-153) |
| **Encaissements confirmés** | Fournisseur, ou déclarés **validés** |
| **Encaissements déclarés non validés** | ⚠️ **Ligne distincte, jamais fondue** |
| **Annulations** | Contre-passations (STORY-158) |
| **Solde restant** | Ventilé : *certain* / *sous réserve du déclaré* |
| **Promesses en cours** | Montant, date, sort (STORY-155) |
| **Frais supportés** | Par le payeur et par le bénéficiaire, séparément |

### B. La règle de restitution

```
Solde certain            = origine − confirmés − annulations
Solde sous réserve       = solde certain − déclarés non validés
Reste dû (affichage)     = solde sous réserve, AVEC la mention du déclaré
```

**Aucune API ne renvoie un solde unique sans qualification.** Un consommateur qui ne veut qu'un
nombre doit **choisir lequel**, explicitement.

### C. Publication vers les consommateurs

`FR-P40` : les encaissements sont **publiés** (événement sortant) pour Facturation (#17), Finance
(#21) et la comptabilité. Ce module **ne passe aucune écriture** — il publie un fait, la comptabilité
en tire une écriture.

L'événement porte lui aussi la **distinction certain / déclaré**. Un consommateur qui l'ignore le fait
en connaissance de cause.

### D. Fournisseur de candidats — `FR-P64`

Le service expose un **fournisseur de candidats** pour le moteur de règles de l'assistant
(`FR-IA03b`, décision « option A ») :

| Candidat | Usage aval |
|---|---|
| Demandes expirées sans relance | Relance (#24) |
| **Promesses échues et non tenues** | Relance (#24) — le signal le plus qualifié du module |
| Encaissements déclarés non validés au-delà du délai | Contrôle interne |
| Créances sans encaissement depuis N jours | Relance |
| Abonnements arrivant à échéance | STORY-161 |

> ⚠️ **Ce module ne relance pas.** Il fournit les candidats ; la décision appartient à Relance (#24)
> et l'envoi à `notification-service`.

### E. Restitution et export

Consultation par créance, par période, par payeur, par état. Export exploitable. Chaque ligne porte
son **degré de certitude** — jamais un tableau où le déclaré et le confirmé se ressemblent.

---

## Critères d'acceptation

1. La restitution d'une créance expose **séparément** : origine, confirmés, déclarés non validés,
   annulations, solde certain, solde sous réserve, promesses en cours, frais.
2. ⚡ **Aucun endpoint ne renvoie un « solde » non qualifié.** Un consommateur doit choisir *certain*
   ou *sous réserve*.
3. Une créance à 400 000 F avec 153 000 confirmés et 100 000 déclarés non validés restitue :
   solde certain **247 000**, solde sous réserve **147 000** — les deux, jamais l'un seul.
4. Une annulation de 153 000 ramène le solde certain à **400 000**, et l'historique reste lisible.
5. Les promesses en cours sont restituées avec leur montant, leur date et leur sort.
6. Les frais sont ventilés **payeur / bénéficiaire**, conformément à la politique figée à l'émission.
7. L'événement publié porte la distinction certain / déclaré.
8. La publication est **atomique** avec l'enregistrement (outbox) — prouvée par `abort()`.
9. Le fournisseur de candidats expose les **cinq** familles, filtrables par organisation.
10. ⚡ Les candidats sont **calculés à la demande**, sans read-model répliqué chez l'assistant —
    conformité à `FR-IA03` (décision « option A »).
11. L'export porte le degré de certitude de chaque ligne.
12. Restitution correcte sur une créance mêlant les cinq origines : confirmé, déclaré, validé,
    annulé, promis.

---

## Notes techniques

### AC 2 est la story

La pression pour exposer « juste le solde » viendra de chaque écran qui consomme ce module. Y céder
une fois suffit à faire disparaître la distinction de tout le produit — parce que le second
consommateur reprendra le champ du premier.

### Le cas qui trompe

Un encaissement **déclaré puis validé** est **certain**. Un encaissement **confirmé par le fournisseur
puis annulé** est **certain aussi** — l'annulation est une écriture de plus, pas un doute sur la
première. Le degré de certitude porte sur **l'état de validation**, pas sur l'existence d'une suite.

---

## Risques & mitigation

| Risque | Mitigation |
|---|---|
| ⚡ Un solde unique est exposé « pour simplifier » et la distinction se perd partout | **AC 2/3** en DoD |
| Un consommateur ignore la distinction dans l'événement | **AC 7** : elle est dans la charge utile ; l'ignorer devient un choix explicite |
| L'assistant réplique un read-model pour ses candidats | **AC 10** : calcul à la demande, conforme à l'option A |
| Le module se met à relancer puisqu'il connaît les candidats | Frontière §D, aucune dépendance sortante vers un canal |

---

## Definition of Done

- [ ] Les 12 critères vérifiés
- [ ] `lint` 0 · couverture ≥ 90 %
- [ ] **Vérification docker** : créance aux cinq origines, deux soldes exacts, publication atomique,
      fournisseur de candidats interrogé sans read-model
- [ ] Branche `MNV-159`, PR rebase-mergée sur `dev`
- [ ] 🏁 **Clôture de l'incrément 2** — le solde d'une créance est juste alors que la moitié a été
      payée en espèces

---

## Progress Tracking

*(à remplir à l'implémentation)*
