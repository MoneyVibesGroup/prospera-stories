> # ⛔ STORY REMPLACÉE — NE PAS IMPLÉMENTER
>
> **Remplacée le 2026-08-03** (décision PO) par le re-découpage du Module 2 : **STORY-240, STORY-241, STORY-276, STORY-286**.
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

# STORY-160 : Droits, piste d'audit et console d'exploitation — **trois droits qui ne se cumulent pas**

**Epic :** EPIC-004 — `paiement-service` (PI-SPI & encaissement)
**Réf. PRD :** [`prds/prd-paiement-service-2026-08-02/prd.md`](../prds/prd-paiement-service-2026-08-02/prd.md) §6 groupe K (FR-P59→P63) · §7 NFR-4, NFR-6
**Réf. code livré :** **STORY-140** (catalogue de permissions plateforme + rôles métier) · **STORY-067** (piste d'audit append-only, `bilan-service`) · **STORY-143** (proxy BFF `admin-panel`) · **STORY-156/158** (contrôle sur la personne)
**Dépend de :** STORY-156, STORY-158
**Débloque :** l'exploitation du service · AP-* (console)
**Priorité :** Must Have
**Story Points :** 3
**Complexité :** low-medium — **la valeur est dans ce qui est interdit, pas dans ce qui est offert**
**Statut :** ⛔ **superseded (2026-08-03)** — remplacée par STORY-240, STORY-241, STORY-276, STORY-286
**Assigné à :** null
**Créée le :** 2026-08-02
**Sprint :** ~~aucun~~ — retirée des sprints le 2026-08-03 (elle occupait le S31→S34)
**Service :** `paiement-service` (`:3005`) + surface `admin-panel`
**Couvre :** FR-P59 → FR-P63 · NFR-4, NFR-6

---

## Contexte

Les stories précédentes ont posé des contrôles **au cas par cas** : ne pas valider sa propre
déclaration (STORY-156), ne pas annuler ce qu'on a déclaré (STORY-158). Cette story les **rassemble
en un dispositif cohérent** et les rattache au catalogue de permissions livré au sprint 18.

Elle borne aussi la console d'exploitation. Le PRD a été explicite après relecture : `FR-P63` liste
**quatre actions et pas une de plus**, parce qu'une « console d'exploitation » sans borne est un
écran entier déguisé en ligne de spécification.

---

## User Story

**En tant que** responsable de la sécurité du dispositif,
**je veux** que les droits touchant à l'argent soient distincts et non cumulables par défaut,
**afin qu'**aucune personne seule ne puisse faire entrer, confirmer et effacer un encaissement.

---

## Périmètre

### A. Les droits — distincts et attribuables séparément

`FR-P59` : portés par le **catalogue de permissions plateforme** (STORY-140), pas par un système
parallèle.

| Droit | Ce qu'il permet |
|---|---|
| `paiement:demande:emettre` | Créer une demande, générer un lien |
| `paiement:demande:revoquer` | Révoquer un lien avant paiement |
| `paiement:encaissement:declarer` | Déclarer un paiement hors Prospera |
| `paiement:encaissement:valider` | Valider une déclaration |
| `paiement:annulation:enregistrer` | Enregistrer une annulation constatée |
| `paiement:grace:attribuer` | Attribuer une période de grâce *(STORY-163)* |
| `paiement:compte:administrer` | Déclarer et vérifier un compte d'encaissement |
| `paiement:consulter` | Lecture seule |

### B. La séparation des pouvoirs — sur la personne

`FR-P60` : **déclarer**, **valider** et **annuler** ne se cumulent pas par défaut sur un même rôle.

> ⚡ **Et le contrôle porte sur la personne, pas sur le rôle.** Un directeur qui détient les trois
> permissions ne doit pas pouvoir valider ce qu'il a lui-même déclaré. Un contrôle par rôle seul
> laisserait passer exactement le cas qu'on veut empêcher — celui de la personne qui a tous les droits.

Le cumul reste **possible** dans une petite organisation, mais il est **explicite, tracé, et signalé**
à l'administrateur au moment de l'attribution. Il n'est jamais le défaut.

### C. Piste d'audit append-only

`FR-P61` : toute opération d'argent est journalisée — **qui, quoi, quand, sur quelle créance, depuis
quelle origine**.

Reprise du patron `STORY-067` : append-only, non modifiable, **une correction est une écriture de
plus**.

Opérations journalisées : émission et révocation de demande · encaissement confirmé · déclaration ·
validation · invalidation · annulation · rattachement manuel d'un encaissement en attente ·
modification d'un compte d'encaissement · réacheminement.

### D. Cloisonnement

`FR-P62` : comptes, demandes, encaissements, relevés, abonnements — **aucune requête ne traverse la
frontière d'organisation**, y compris par un export ou un agrégat.

### E. Console d'exploitation — **quatre actions, pas cinq**

`FR-P63`, sur `admin-panel` :

1. Suivre les demandes
2. Consulter les **notifications de fournisseur rejetées**, avec leur motif
3. **Réacheminer** une demande *(explicite, avec révocation prouvée — STORY-152 §E)*
4. Consulter les **écarts de rapprochement**

**Toute autre surface est hors v1.** La console n'est pas un back-office métier.

⚠️ **Piège connu — `GAP-bff-admin-sans-consommateur`.** Le dépôt a documenté que cinq stories
backend ont été construites sur le BFF `admin-panel` alors que `services.ts` de la console ne
l'appelle jamais. **Avant d'écrire cette surface, vérifier comment la console atteint réellement les
services** — et non le supposer. C'est le motif que `AP-INT-0` doit trancher.

### F. Secrets

`FR-P56` *(rappel de STORY-151)* : les identifiants de fournisseur ne sont ni restitués, ni
journalisés, ni inclus dans une réponse ou une trace d'erreur. **La piste d'audit n'y fait pas
exception.**

---

## Critères d'acceptation

1. Les huit droits existent au catalogue de permissions plateforme et sont attribuables séparément.
2. Un utilisateur sans le droit correspondant est refusé `403 { message, code }` sur chaque opération.
3. ⚡ Un utilisateur détenant `declarer` **et** `valider` **ne peut pas valider sa propre déclaration** —
   contrôle **sur la personne**.
4. ⚡ Un utilisateur détenant `declarer` **et** `annulation:enregistrer` **ne peut pas annuler un
   encaissement qu'il a déclaré**.
5. L'attribution d'un cumul de ces droits **signale** l'écart de séparation à l'administrateur ; elle
   n'est pas silencieuse.
6. Toutes les opérations listées en §C sont journalisées, avec qui/quoi/quand/créance/origine.
7. La piste d'audit est **append-only** : aucune opération de modification ni de suppression n'existe
   sur l'API.
8. Aucun secret de fournisseur n'apparaît dans la piste d'audit — vérifié par inspection.
9. Une requête portant l'organisation B avec un jeton de l'organisation A est **rejetée**, pas filtrée.
10. La console expose **exactement** les quatre actions de §E — aucune autre.
11. ⚡ Le chemin d'appel réel de la console vers ce service est **vérifié dans le code de la console**
    (`services.ts`) avant livraison, et non supposé.
12. Le réacheminement depuis la console exige la révocation prouvée (STORY-152).

---

## Notes techniques

### Pourquoi AC 11 est un critère d'acceptation

Parce que `GAP-bff-admin-sans-consommateur` est **encore ouvert** dans le dépôt et que cinq stories
ont déjà été construites sur une hypothèse fausse. Le PRD `paiement-service` ne doit pas être la
sixième. Le coût du contrôle est d'ouvrir un fichier.

### Le cumul en petite organisation

Un distributeur de trois personnes ne peut pas séparer trois rôles. Le dispositif ne l'interdit pas —
il l'**expose**. La différence entre un contrôle utile et un contrôle qu'on contourne tient à ça :
rendre l'écart visible plutôt qu'impossible.

---

## Risques & mitigation

| Risque | Mitigation |
|---|---|
| La séparation est contrôlée par rôle et contournée par la personne qui a tout | **AC 3/4** : contrôle sur la personne |
| Le cumul devient le défaut dans les petites structures, sans que personne ne le sache | **AC 5** : signalé à l'attribution |
| La console est construite sur un BFF que la console n'appelle pas | **AC 11** : vérification dans `services.ts` |
| La console déborde en back-office métier | **AC 10** : quatre actions, énumérées |

---

## Definition of Done

- [ ] Les 12 critères vérifiés
- [ ] `lint` 0 · couverture ≥ 90 %
- [ ] **Vérification docker** : refus sur chaque droit manquant, auto-validation refusée,
      auto-annulation refusée, isolation entre deux organisations, audit append-only
- [ ] **Vérification du chemin d'appel réel de la console** (`services.ts`) — AC 11
- [ ] Revue de sécurité dédiée
- [ ] Branche `MNV-160`, PR rebase-mergée sur `dev`

---

## Progress Tracking

*(à remplir à l'implémentation)*
