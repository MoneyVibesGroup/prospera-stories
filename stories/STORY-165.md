# STORY-165 : e2e docker — **le parcours de Kossi, de bout en bout**

**Epic :** EPIC-004 — `paiement-service` (PI-SPI & encaissement) — 🏁 **jalon de clôture**
**Réf. PRD :** [`prds/prd-paiement-service-2026-08-02/prd.md`](../prds/prd-paiement-service-2026-08-02/prd.md) §3 **UJ-1** · §9 critères de sortie des trois incréments
**Réf. code livré :** **STORY-150 → 164** *(l'ensemble du service)* · **STORY-100** *(patron d'e2e Atelier — même forme)*
**Dépend de :** STORY-163, STORY-164
**Débloque :** la mise en service · les stories frontend
**Priorité :** Must Have
**Story Points :** 3
**Complexité :** medium — **la valeur est dans le scénario, pas dans le code**
**Statut :** À faire
**Assigné à :** null
**Créée le :** 2026-08-02
**Sprint :** **33** — **incrément 3** *(clôture EPIC-004)*  *(slotté le 2026-08-03 ; décalé de 9 sprints le même jour — le module fiscalité passe devant, cf. `reserved_sprints`)*
**Service :** `paiement-service` (`:3005`) + `platform-catalog-service` (`:3003`)
**Couvre :** l'ensemble — vérification d'intégration

---

## Contexte

Les quinze stories précédentes ont chacune leur vérification docker. Celle-ci vérifie **ce qu'aucune
ne peut vérifier seule** : que le parcours réel tient d'un bout à l'autre, avec ses détours.

Le scénario n'est pas inventé pour les besoins du test : **c'est UJ-1 du PRD**, écrit avant toute
ligne de code, et il a servi à valider la conception.

---

## User Story

**En tant qu'**équipe,
**je veux** rejouer le parcours complet de Kossi sur une stack neuve,
**afin de** savoir que le module tient — et pas seulement que ses seize stories passent.

---

## Le scénario — UJ-1, exécuté

> **Kossi** tient une boutique à Agoè. Il doit **400 000 F** à son distributeur.

| # | Étape | Ce qu'elle éprouve |
|:--:|---|---|
| 1 | Le distributeur déclare son compte d'encaissement, il est **vérifié** | STORY-151 |
| 2 | Une créance projetée de 400 000 F est créée, une demande émise | STORY-153 |
| 3 | Le lien part par `notification-service` *(ou est simulé s'il n'existe pas encore)* | FR-P17 |
| 4 | Kossi ouvre le lien **dans un vrai navigateur**, voit `400 000 + 8 000 de frais = 408 000` | STORY-153, NFR-8 |
| 5 | Il choisit de payer **une partie** ; la page annonce **le surcoût du fractionnement avant son choix** | STORY-154, FR-P23b |
| 6 | Il paie **153 000 F** en bac à sable ; le solde tombe à **250 000** | STORY-154 |
| 7 | Le fournisseur **rejoue sa notification 5 fois** → **un seul encaissement** | NFR-3 |
| 8 | Kossi **promet** de compléter **vendredi** | STORY-155 |
| 9 | Le lendemain, le commercial **déclare 100 000 F en espèces** → solde affiché 150 000, **marqué déclaré** | STORY-156 |
| 10 | Le solde restitue **deux valeurs** : certain 250 000, sous réserve 150 000 | STORY-159 |
| 11 | Le commercial **tente de valider sa propre déclaration** → **refusé** | STORY-156 AC 7 |
| 12 | Le responsable **valide par la remise du soir** → l'encaissement devient certain | STORY-156 |
| 13 | **Vendredi**, la promesse arrive à échéance → sort **`non tenue`** *(50 000 restants)* | STORY-155 |
| 14 | Le relevé du fournisseur est importé → **rapprochement par référence**, écart **nul** | STORY-157 |
| 15 | Une **annulation** de 50 000 est enregistrée par le responsable financier → solde rétabli | STORY-158 |
| 16 | Le commercial **tente d'annuler ce qu'il a déclaré** → **refusé** | STORY-158 AC 5 |

### Volet abonnement

| # | Étape | Ce qu'elle éprouve |
|:--:|---|---|
| 17 | Un abonnement en **essai** ouvre ses modules sans encaissement | STORY-161 |
| 18 | Fin d'essai → demande émise → **encaissée** | STORY-161 |
| 19 | L'**événement** part par l'outbox ; le catalogue **octroie** ; `entitlement.changed` est reçu par un consommateur existant | STORY-162 |
| 20 | L'échéance suivante n'est pas payée → **suspension**, entitlements révoqués | STORY-163 |
| 21 | Le retard est encaissé → **rétablissement automatique**, sans intervention | STORY-163 AC 7 |

### Volet multi-devises

| # | Étape | Ce qu'elle éprouve |
|:--:|---|---|
| 22 | Une seconde organisation encaisse en **GHS** dans la même stack | STORY-164 |
| 23 | `400000 XOF` restitue **400 000 F**, `125050 GHS` restitue **1 250,50** | NFR-2 |
| 24 | Aucun endpoint ne produit de **total agrégé** des deux | FR-P57 |

---

## Critères d'acceptation

1. Le scénario s'exécute **de bout en bout sur une stack neuve** (`docker compose down -v` préalable).
2. ⚡ L'étape 4 est jouée **dans un navigateur réel** (Playwright), **depuis l'extérieur du réseau
   Docker**, sur profil mobile bas de gamme et réseau ralenti — *piège `STORY-011`*.
3. ⚡ L'étape 7 prouve l'**idempotence** : 5 rejeux, un seul encaissement, un seul mouvement de solde.
4. ⚡ Les étapes 11 et 16 prouvent la **séparation des pouvoirs sur la personne**, pas sur le rôle.
5. L'étape 10 prouve que le solde est **toujours ventilé** certain / sous réserve.
6. L'étape 14 se termine avec un **écart nul** — `SM-3` du PRD.
7. L'étape 19 prouve la chaîne **encaissement → outbox → catalogue → `entitlement.changed`**, avec un
   consommateur existant **non modifié**.
8. L'étape 21 prouve le **rétablissement automatique**, sans action humaine.
9. Les étapes 22-24 prouvent le **multi-devises sans conversion ni agrégation**.
10. Le scénario est **rejouable** : deux exécutions successives donnent le même résultat final.
11. ⚡ **Aucun appel HTTP** entre `paiement-service` et `platform-catalog-service` n'apparaît dans le
    trafic pendant tout le scénario — vérification de la décision C8 option A.
12. Le temps total d'exécution est mesuré et consigné.

---

## Notes techniques

### Ce que cet e2e n'est pas

Ce n'est pas une campagne de recette exhaustive. C'est **un parcours**, choisi parce qu'il traverse
tous les invariants du module : idempotence, séparation des pouvoirs, ventilation du solde,
réconciliation, événement d'octroi, réversibilité de la suspension, exactitude monétaire.

Les cas aux limites appartiennent aux stories qui les portent.

### Les quatre étapes en gras

Les étapes **4, 7, 11/16 et 19** sont celles dont l'échec ne se verrait pas autrement :

| Étape | Ce qu'un test unitaire ne peut pas voir |
|---|---|
| 4 | Une URL valide en réseau interne et **invisible d'un navigateur** |
| 7 | Une idempotence qui tient en séquentiel et **cède en conditions réelles** |
| 11/16 | Un contrôle par rôle qui **laisse passer la personne** qui a tous les droits |
| 19 | Un événement publié que **personne ne consomme** |

### Sur les dépendances absentes

`notification-service` n'existera peut-être pas encore. L'étape 3 est alors **simulée**, et le test le
**déclare** — un e2e qui masque une dépendance absente ment sur ce qu'il prouve.

---

## Risques & mitigation

| Risque | Mitigation |
|---|---|
| L'e2e passe en réseau Docker et le lien est inutilisable en vrai | **AC 2** : navigateur réel, depuis l'extérieur |
| L'e2e devient une recette exhaustive et personne ne le maintient | Périmètre : **un** parcours, les limites restent aux stories |
| Une dépendance absente est masquée par un bouchon silencieux | Note technique : la simulation est **déclarée** |
| L'e2e n'est pas rejouable et devient ininterprétable | **AC 10** |

---

## Definition of Done

- [ ] Les 12 critères vérifiés
- [ ] Scénario **automatisé** et intégré à la CI
- [ ] Exécution complète sur stack neuve consignée dans la story
- [ ] 🏁 **Clôture de l'EPIC-004** — les trois incréments sont livrés et éprouvés ensemble
- [ ] `sprint-status.yaml` mis à jour : EPIC-004 `done`, `STORY-039` marquée **remplacée par STORY-162**
- [ ] Branche `MNV-165`, PR rebase-mergée sur `dev`

---

## Progress Tracking

*(à remplir à l'implémentation)*
