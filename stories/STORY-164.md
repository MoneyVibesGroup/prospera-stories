# STORY-164 : Pays, devises et exactitude monétaire — **le XOF n'a pas de décimale**

**Epic :** EPIC-004 — `paiement-service` (PI-SPI & encaissement)
**Réf. PRD :** [`prds/prd-paiement-service-2026-08-02/prd.md`](../prds/prd-paiement-service-2026-08-02/prd.md) §6 groupe J (FR-P54→P58) · §7 **NFR-2**
**Réf. code livré :** **STORY-150** (type `Montant` posé au scaffold) · **STORY-152** (capacités par fournisseur × pays × devise) · **STORY-056/057** (patron de **paquet de référentiel versionné** — *la connaissance est une donnée, jamais du code*, invariant NFR-A06)
**Dépend de :** STORY-154
**Débloque :** STORY-165 (e2e multi-pays) · tout client hors Togo
**Priorité :** Must Have
**Story Points :** 5
**Complexité :** medium — **un défaut invisible en test et faux d'un facteur 100 en production**
**Statut :** À faire
**Assigné à :** null
**Créée le :** 2026-08-02
**Sprint :** **33** — **incrément 3**  *(slotté le 2026-08-03 ; décalé de 9 sprints le même jour — le module fiscalité passe devant, cf. `reserved_sprints`)*
**Service :** `paiement-service` (`:3005`)
**Couvre :** FR-P54 → FR-P58 · NFR-2

---

## Contexte

Décision du PO : *« prévois les pays de l'Afrique de l'Ouest, eux tous, avec leur devise »*.

Ce n'est pas une extension de périmètre géographique, c'est une **contrainte de modèle**. Trois
conséquences, dont une dangereuse.

### ⚡ La dangereuse

Les devises n'ont pas toutes le même nombre de décimales :

| Devise | Décimales | Pays |
|---|:--:|---|
| **XOF** | **0** | Bénin, Burkina, Côte d'Ivoire, Guinée-Bissau, Mali, Niger, Sénégal, **Togo** |
| **GNF** | **0** | Guinée |
| NGN, GHS, GMD, LRD, SLE, CVE | 2 | Nigeria, Ghana, Gambie, Liberia, Sierra Leone, Cap-Vert |

> **Le réflexe de tout développeur est de traiter un montant en centimes.** Sur le XOF, c'est faux
> d'un facteur 100 — **sur le marché principal**. Et l'erreur ne casse rien : elle produit des
> montants plausibles.

### Les deux autres

- **Les fournisseurs diffèrent par pays** — aucun PSP ne sert les quinze États
- **Aucune conversion de devise** : convertir serait une **activité de change**, donc un agrément que
  le module ne veut pas

---

## User Story

**En tant que** distributeur opérant au Togo et au Ghana,
**je veux** encaisser en XOF et en GHS sans que le système ne mélange les deux,
**afin de** tenir deux comptabilités justes plutôt qu'une fausse.

---

## Périmètre

### A. Pays et devises — des données, jamais du code

`FR-P54` : la table des pays et devises est un **paquet de référence versionné**, au même titre que
les paquets de référentiels comptables (`STORY-056/057`, invariant NFR-A06).

Chaque entrée porte : code pays, code devise ISO, **nombre de décimales**, libellés.

> ⚠️ **Pourquoi versionné et pas codé en dur :** la carte politique et monétaire de la région bouge.
> Des États ont annoncé leur retrait de la CEDEAO tout en restant dans l'UEMOA ; des projets de
> monnaie commune existent. Une liste en dur transformerait chaque évolution en livraison.

### B. Le type `Montant` — appliqué partout

`FR-P55` / `NFR-2` : stockage en **entier d'unité mineure**, avec le nombre de décimales **lu de la
table**, jamais supposé.

| | Correct | Faux |
|---|---|---|
| 400 000 F CFA | `{ valeurMineure: 400000, devise: 'XOF' }` | `{ valeurMineure: 40000000, ... }` |
| 1 250,50 GHS | `{ valeurMineure: 125050, devise: 'GHS' }` | `{ valeurMineure: 1250.5, ... }` |

**Aucun montant n'est manipulé en virgule flottante**, nulle part — ni en calcul, ni en transport, ni
en persistance.

### C. Pas de conversion — et pas de total inter-devises

`FR-P56` : une créance, sa demande et son encaissement sont dans **une seule et même devise**.

`FR-P57` : une organisation multi-pays détient un compte par pays et devise (STORY-151) ; **ses
créances ne se compensent pas entre devises**.

> ⚡ **Et aucun total agrégé toutes devises confondues n'est produit** — additionner des XOF et des
> NGN ne donne aucun nombre qui veuille dire quelque chose. Toute restitution multi-devises est
> **ventilée**, jamais sommée. *(Même règle que `FR-N57c` de `notification-service`.)*

### D. Les bornes viennent du fournisseur

`FR-P58` : montants minimum et maximum, frais et méthodes sont **propres au couple fournisseur × pays
× devise** et **lus des capacités déclarées** (STORY-152) — jamais codés.

### E. Restitution

Un montant restitué porte **toujours** sa devise. Le formatage (séparateurs, position du symbole) est
dérivé de la table, jamais codé pour le franc CFA.

---

## Critères d'acceptation

1. La table pays/devises est un **paquet versionné**, chargé au démarrage ; ajouter un pays est une
   **donnée**, pas un déploiement de code.
2. ⚡ Un montant en **XOF** de `400000` restitue **400 000 F** — pas `4 000,00`.
3. ⚡ Un montant en **GHS** de `125050` restitue **1 250,50** — la même mécanique, un autre diviseur.
4. Aucun type flottant n'apparaît dans le schéma persisté — vérifié sur la base réelle, pas sur les types.
5. Une demande dont la devise diffère de celle de la créance est **refusée**.
6. Une demande dont la devise diffère de celle du compte bénéficiaire est **refusée**.
7. ⚡ **Aucun endpoint ne produit un total toutes devises confondues** ; les restitutions
   multi-devises sont **ventilées**.
8. ⚡ **Aucune fonction de conversion n'existe** dans le service — vérifié par revue de la surface d'API
   et du code.
9. Un montant hors des bornes du fournisseur pour ce couple `pays × devise` est refusé, **avec les
   bornes dans le message**.
10. Le nombre de décimales est **lu de la table**, jamais constant — vérifié par un test sur au moins
    une devise à 0 décimale et une à 2.
11. Une organisation opérant sur deux pays voit ses créances **par devise**, sans compensation.
12. Les quinze États et leurs devises sont présents dans le paquet initial, avec leurs décimales.

---

## Notes techniques

### Le test qui compte (AC 10)

Un test qui ne vérifie que le XOF passe avec un diviseur codé à 1. Un test qui ne vérifie que le GHS
passe avec un diviseur codé à 100. **Il faut les deux dans le même jeu** pour que le mécanisme soit
réellement exercé.

### Pourquoi AC 8 est un critère

Comme l'absence de remboursement (`STORY-158` AC 1), c'est une **absence** qu'on vérifie. Une fonction
de conversion apparaîtra dès qu'un écran voudra « juste un total ». Elle fait entrer le module dans une
activité réglementée qu'il ne veut pas exercer.

### Statut politique de la région

Le paquet porte **codes pays et devises**, pas d'appartenance à une organisation régionale. C'est ce
qui le rend insensible aux évolutions institutionnelles.

---

## Risques & mitigation

| Risque | Mitigation |
|---|---|
| ⚡ Le XOF traité à 2 décimales → montants faux d'un facteur 100, **plausibles**, sur le marché principal | **AC 2/3/10** : deux devises de décimales différentes dans le même jeu de tests |
| Un flottant se glisse dans un calcul intermédiaire | **AC 4** : vérification sur la base réelle |
| Un total inter-devises est produit « pour le tableau de bord » | **AC 7** |
| Une conversion est ajoutée pour un écran | **AC 8** + revue de surface d'API |
| La liste des pays est codée en dur et chaque évolution devient une livraison | **AC 1** : paquet versionné, patron `STORY-056/057` |

---

## Definition of Done

- [ ] Les 12 critères vérifiés
- [ ] `lint` 0 · couverture ≥ 90 %
- [ ] **Vérification docker** : encaissement en XOF **et** en GHS dans la même stack, restitutions
      justes des deux côtés, refus de mélange de devises, absence de total agrégé
- [ ] **Revue de surface d'API** confirmant l'absence de toute conversion
- [ ] Branche `MNV-164`, PR rebase-mergée sur `dev`

---

## Progress Tracking

*(à remplir à l'implémentation)*
