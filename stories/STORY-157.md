# STORY-157 : Réconciliation — relevé du fournisseur, **cascade de trois clés**, et rien qui se perde

**Epic :** EPIC-004 — `paiement-service` (PI-SPI & encaissement)
**Réf. PRD :** [`prds/prd-paiement-service-2026-08-02/prd.md`](../prds/prd-paiement-service-2026-08-02/prd.md) §6 groupe G (FR-P38, FR-P39) · §8 **SM-3** *(écart 0 après rapprochement)*
**Réf. code livré (patron) :** **STORY-089/090** (`balance-service`) · **STORY-156** (les deux origines d'encaissement)
**Dépend de :** STORY-154, STORY-156
**Débloque :** STORY-159 (le solde s'appuie sur des encaissements réconciliés)
**Priorité :** Must Have
**Story Points :** 8
**Complexité :** high — **la cascade de clés décide du taux de rapprochement réel**
**Statut :** À faire
**Assigné à :** null
**Créée le :** 2026-08-02
**Sprint :** à planifier — **incrément 2**
**Service :** `paiement-service` (`:3005`)
**Couvre :** FR-P38, FR-P39, FR-P41

---

## Contexte

Le bundle *Finance & Recouvrement* est vendu sur une promesse chiffrée : **« rapprochement manuel
→ 0 »**. `SM-3` du PRD la traduit en métrique : *écart entre le solde restitué et le relevé du
fournisseur = 0 après rapprochement*.

Cette story est celle qui la tient — ou pas.

> ⚡ **Ce que la relecture du PRD avait relevé :** `FR-P38` tenait en une ligne (« rapprochement
> automatique »), pour le cœur de la promesse commerciale. **La clé de rapprochement n'était pas
> définie** — or c'est elle qui décide si on rapproche 95 % ou 40 % des lignes. Elle est maintenant
> explicite, et cette story l'implémente.

---

## User Story

**En tant que** responsable financier,
**je veux** confronter ce que mon fournisseur dit avoir encaissé à ce que Prospera a enregistré,
**afin de** savoir exactement ce qui manque, ce qui est en trop, et ce qui reste à affecter.

---

## Périmètre

### A. Import du relevé

Import du relevé du fournisseur (fichier ou récupération par son API selon les capacités déclarées,
STORY-152), avec **compte rendu avant persistance** : lignes lues, lignes rejetées et motif.

Le relevé importé est **conservé tel quel** — c'est la preuve du tiers, elle ne se réécrit pas.

### B. La cascade de trois clés — le cœur de la story

`FR-P38` : le rapprochement suit une **cascade explicite**, du certain vers le probable :

| Rang | Clé | Statut du rapprochement |
|:--:|---|---|
| **1** | **Référence de transaction du fournisseur** | ✅ **Certain** — rapproché automatiquement |
| **2** | **Référence de demande portée au libellé** | ✅ **Certain** si présente |
| **3** | **Triplet montant + devise + date à ±1 jour** | ⚠️ **Proposé** — **jamais appliqué sans confirmation humaine** |

> ⚡ **Le rang 3 n'est pas un rapprochement, c'est une hypothèse.** Deux détaillants qui paient
> 150 000 F le même jour produisent deux candidats indiscernables. L'appliquer automatiquement
> attribuerait le paiement de l'un à la créance de l'autre — et l'erreur ne se verrait qu'à la
> relance du mauvais client.

Ce qui ne tombe dans **aucune** des trois est listé comme **écart, avec son motif**.

### C. Les quatre natures d'écart

| Écart | Ce que ça veut dire |
|---|---|
| **Au relevé, absent de Prospera** | Un encaissement qu'on n'a pas vu — notification perdue, ou paiement hors lien |
| **Dans Prospera, absent du relevé** | Un encaissement enregistré que le fournisseur ne confirme pas — **le plus grave** |
| **Montants divergents** | Frais non anticipés, ou erreur |
| **Rapprochement multiple possible** | Le rang 3 a trouvé plusieurs candidats — arbitrage humain requis |

### D. L'encaissement sans créance — il ne se perd pas

`FR-P39` : un encaissement reçu **sans créance identifiable** (paiement spontané, référence erronée)
**n'est pas perdu**. Il est mis **en attente d'affectation** et reste rattachable manuellement.

> Le réflexe inverse — ignorer ce qu'on ne sait pas classer — fait disparaître de l'argent réel du
> système. C'est le défaut le plus difficile à diagnostiquer après coup.

### E. Restitution

`FR-P41` : consultation et export des encaissements et des écarts, filtrables par période,
fournisseur, moyen, état, encaisseur et module appelant.

### F. Hors périmètre

L'écriture comptable (elle appartient à la comptabilité — ce module publie, il n'écrit pas le
journal) et la décision sur un écart (elle appartient à l'humain).

---

## Critères d'acceptation

1. L'import produit un **compte rendu avant persistance** ; un rejet de ligne n'empêche pas les autres
   d'être lues, mais rien n'est appliqué avant confirmation.
2. Le relevé importé est **conservé intact** et consultable.
3. Rapprochement par **référence fournisseur** → appliqué automatiquement, marqué `certain`.
4. Rapprochement par **référence de demande au libellé** → appliqué automatiquement, marqué `certain`.
5. ⚡ Rapprochement par **triplet montant/devise/date** → **proposé seulement**, jamais appliqué sans
   confirmation humaine explicite.
6. ⚡ Deux candidats au rang 3 pour la même ligne → **aucun n'est choisi** ; la ligne est listée en
   *rapprochement multiple possible*.
7. Les quatre natures d'écart sont produites, chacune avec son motif exploitable.
8. Un encaissement **sans créance identifiable** est mis en attente d'affectation — **jamais ignoré,
   jamais supprimé**.
9. Un encaissement en attente peut être **rattaché manuellement** à une créance, avec trace de qui
   l'a fait.
10. Après rapprochement complet d'un jeu cohérent, **l'écart est nul** — `SM-3` vérifiable.
11. Le rapprochement est **rejouable** : relancer l'opération sur le même relevé ne crée aucun doublon
    et ne défait aucun rapprochement confirmé.
12. Export des écarts exploitable (période, fournisseur, nature).

---

## Notes techniques

### Pourquoi le rang 2 existe

Certains fournisseurs mobile money permettent au payeur de saisir un libellé libre. Y porter la
référence de demande transforme un rapprochement probable en rapprochement certain, **pour un coût
nul**. La demande de paiement (STORY-153) doit donc exposer une référence courte, lisible et saisissable.

### Tolérance du rang 3

`±1 jour` sur la date, **exact** sur le montant et la devise. Élargir la tolérance sur le montant
paraît utile (les frais) et produit surtout des faux appariements — les frais se traitent en écart de
montant, pas en tolérance.

---

## Risques & mitigation

| Risque | Mitigation |
|---|---|
| ⚡ Le rang 3 appliqué automatiquement attribue un paiement à la mauvaise créance | **AC 5/6** : proposé seulement, jamais appliqué seul |
| Un encaissement non identifié disparaît du système | **AC 8** : mise en attente, jamais d'abandon |
| Le rapprochement rejoué crée des doublons | **AC 11** |
| La tolérance est élargie « pour rapprocher plus » et produit des faux | Note technique : tolérance sur la date seule |
| Le patron `STORY-089/090` est réécrit | Revue de conception |

---

## Definition of Done

- [ ] Les 12 critères vérifiés
- [ ] `lint` 0 · couverture ≥ 90 %
- [ ] **Vérification docker** : import d'un relevé mêlant les trois rangs + lignes non rapprochables,
      preuve qu'aucun rang 3 n'est appliqué seul, cas de double candidat, rejeu sans doublon,
      **écart nul sur jeu cohérent**
- [ ] Branche `MNV-157`, PR rebase-mergée sur `dev`

---

## Progress Tracking

*(à remplir à l'implémentation)*
