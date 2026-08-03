# STORY-154 : Encaissement — notification signée, **idempotence prouvée**, paiement partiel et transparence des frais

**Epic :** EPIC-004 — `paiement-service` (PI-SPI & encaissement)
**Réf. PRD :** [`prds/prd-paiement-service-2026-08-02/prd.md`](../prds/prd-paiement-service-2026-08-02/prd.md) §6 groupe D (FR-P19→P24b) + E partiel (FR-P25→P27) · §7 **NFR-3** *(l'invariant le plus coûteux)*, NFR-2
**Réf. code livré :** **STORY-021** (outbox transactionnel `kyc-service`) · **STORY-034** (outbox catalog) · **STORY-150** (couture d'outbox posée à vide) · **STORY-153** (la demande et ses états)
**Dépend de :** STORY-152, STORY-153
**Débloque :** STORY-155 (promesses), STORY-157 (réconciliation), STORY-159 (solde) — **et clôt l'incrément 1**
**Priorité :** Must Have
**Story Points :** 8
**Complexité :** high — **l'idempotence sous concurrence est la seule difficulté réelle, et elle est totale**
**Statut :** À faire
**Assigné à :** null
**Créée le :** 2026-08-02
**Sprint :** à planifier — **incrément 1** *(story de clôture)*
**Service :** `paiement-service` (`:3005`)
**Couvre :** FR-P19 → FR-P24b, FR-P25 → FR-P27 · NFR-2, NFR-3

---

## Contexte

C'est la story où l'argent entre. Tout ce qui précède préparait le terrain ; ici, une notification
arrive d'un fournisseur et un solde bouge.

> ⚡ **Un double encaissement se voit chez le payeur avant de se voir dans les journaux.**
> C'est ce qui rend NFR-3 différent des autres invariants du dépôt : son échec n'est pas une donnée
> incohérente qu'on corrige, c'est un client qui appelle. Il n'existe aucune correction discrète.

### Deux décisions du PO que cette story matérialise

1. **Le paiement partiel est autorisé** — *« le lien enregistre ce qu'il a payé, si c'est le total ou pas »*
2. **La politique de frais appartient à l'émetteur de la facture**, et le fractionnement les multiplie

---

## User Story

**En tant que** service d'encaissement,
**je veux** constater un paiement **exactement une fois**, quel que soit le nombre de fois que le
fournisseur me le raconte,
**afin que** le solde d'une créance soit vrai et qu'aucun payeur ne soit débité deux fois.

---

## Périmètre

### A. Notification entrante — authentifiée avant tout

`FR-P19` : la **signature est vérifiée** avant tout traitement. Une notification non signée, mal
signée, ou signée d'une clé inconnue est **rejetée et tracée** — pas ignorée en silence. Le rejet est
consultable (FR-P63), parce qu'une avalanche de rejets signale soit une attaque, soit une rotation de
clé qu'on a manquée.

### B. Idempotence — l'exigence centrale

`FR-P20` / `NFR-3` : un rejeu du fournisseur ne crée **jamais** un second encaissement.

**Ce qui doit être vrai, et pas seulement « en principe » :**

| Condition | Pourquoi elle est là |
|---|---|
| Même notification rejouée **N fois** → 1 encaissement | Le cas nominal du rejeu fournisseur |
| Rejeu **en parallèle** → 1 encaissement | Deux instances du service, ou deux tentatives simultanées |
| Rejeu **dans le désordre** → état final correct | Les fournisseurs ne garantissent pas l'ordre |
| Rejeu **après redémarrage** du service → 1 encaissement | L'état ne vit pas en mémoire |

La clé d'idempotence est portée par la notification du fournisseur ; à défaut, elle est **dérivée**
d'un ensemble stable de champs — jamais de l'horodatage de réception.

### C. Encaissement — ce qu'on enregistre, ce qu'on n'enregistre pas

`FR-P24` : le service enregistre le **mouvement constaté** — montant, devise, horodatage, référence
fournisseur, méthode. **Jamais un solde de compte** (NFR-1b).

`FR-P24b` ⚡ : **le tarif et les frais appliqués sont enregistrés avec l'encaissement**, jamais
recalculés à la lecture. Un changement de tarif de fournisseur ne modifie pas rétroactivement ce
qu'un payeur a supporté ni ce qu'un bénéficiaire a reçu.

> C'est le patron partagé de la plateforme : **ce qui a servi est conservé avec ce qu'il a servi à
> produire** — le facteur de conversion avec le mouvement de stock, la version de modèle avec la
> proposition IA, le tarif avec l'encaissement.

### D. Paiement partiel

| # | Règle |
|---|---|
| **FR-P25** | Le payeur règle ce qu'il peut ; le lien enregistre le montant **effectivement payé** |
| **FR-P26** | La demande conserve un **solde restant** et **reste payable** — le même lien sert aux règlements successifs |
| **FR-P27** | L'historique est conservé et restituable : qui a payé combien, quand, par quel moyen, **avec quels frais** |

### E. Les frais — la transparence avant le choix

`FR-P23` : la **politique de frais est décidée par l'organisation créancière** — `payeur` (défaut),
`bénéficiaire`, ou `payeur au 1ᵉʳ versement puis bénéficiaire`.

`FR-P23b` ⚡ : **le fractionnement multiplie les frais.** Avant que le payeur choisisse de régler
partiellement, le lien annonce : frais du versement en cours, **qui les supporte**, frais déjà
supportés sur cette créance, et le **surcoût prévisible** s'il fractionne encore.

`FR-P23c` ⚡ : la politique est **figée à l'émission de la demande**, jamais relue à l'encaissement.
Un distributeur qui change son paramétrage un mardi ne modifie pas ce que doivent les payeurs à qui
un lien a déjà été envoyé.

### F. Migration — les trois services cessent d'envoyer leurs propres messages

`FR-P27` du PRD `notification-service` concerne l'e-mail ; **ici, rien à migrer** : aucun service
n'encaisse aujourd'hui. Cette story est une création nette.

### G. Publication

L'encaissement est publié via l'**outbox transactionnel** posé à vide en `STORY-150` — la couture
`// Couture STORY-154` est levée ici. Publication et enregistrement sont **atomiques**.

---

## Critères d'acceptation

1. Une notification **non signée** ou **mal signée** est rejetée `401`, tracée, et **ne modifie aucun état**.
2. ⚡ La **même notification rejouée 50 fois** produit **un seul** encaissement et **un seul**
   mouvement de solde.
3. ⚡ **Rejeu en parallèle** (10 requêtes simultanées, même notification) → **un seul** encaissement.
4. ⚡ **Rejeu après redémarrage** du service → **un seul** encaissement.
5. ⚡ Notifications **dans le désordre** (partiel n°2 avant partiel n°1) → état final correct et solde juste.
6. Un paiement partiel laisse la demande `partiellement payée` avec un **solde restant exact** ; le
   même lien reste payable.
7. Trois règlements successifs soldent la demande ; l'historique restitue les **trois**, chacun avec
   **ses frais**.
8. Le lien annonce, **avant** le choix du payeur : frais du versement, qui les supporte, frais déjà
   supportés, surcoût prévisible du fractionnement.
9. Changer la politique de frais d'une organisation **ne modifie aucune demande déjà émise** (FR-P23c).
10. Le tarif enregistré avec un encaissement **ne change pas** après modification du tarif du fournisseur.
11. En XOF, un encaissement de `153000` vaut **153 000 F** — aucun montant en flottant nulle part,
    vérifié sur le schéma persisté.
12. L'encaissement et son événement sortant sont **atomiques** : un `abort()` provoqué n'enregistre ni l'un ni l'autre.
13. Aucune notion de solde détenu, portefeuille ou séquestre n'apparaît dans le modèle persisté (**NFR-1b**).

---

## Notes techniques

### AC 2 à 5 sont la story

Les quatre conditions d'idempotence ne sont pas quatre variantes du même test : elles couvrent quatre
mécanismes de défaillance différents (rejeu simple, concurrence, persistance, ordre). Passer trois sur
quatre, c'est ne rien garantir. **Elles font partie de la définition de terminé, pas de la recette.**

### Le piège de la clé dérivée

Si le fournisseur ne fournit pas de clé d'idempotence, la dériver de `(référence demande, montant,
référence transaction fournisseur)` — **jamais** de l'horodatage de réception, qui diffère à chaque
rejeu et rend l'idempotence inopérante tout en la faisant paraître implémentée.

### Ce qui n'est pas dans cette story

Les promesses de paiement (STORY-155), le paiement hors Prospera (STORY-156), la réconciliation avec
le relevé (STORY-157), l'annulation (STORY-158).

---

## Risques & mitigation

| Risque | Mitigation |
|---|---|
| ⚡ Double encaissement — **visible chez le payeur avant de l'être dans les journaux** | **AC 2/3/4/5**, quatre mécanismes distincts, en DoD |
| L'idempotence paraît implémentée mais la clé varie à chaque rejeu | Note technique : clé dérivée de champs stables, jamais de l'horodatage |
| Le payeur découvre le surcoût du fractionnement après avoir payé | **AC 8** : annonce **avant** le choix |
| Un changement de tarif réécrit l'histoire | **AC 9/10** + FR-P24b |
| Un montant XOF traité à 2 décimales → faux d'un facteur 100 | **AC 11** + type `Montant` de STORY-150 |

---

## Definition of Done

- [ ] Les 13 critères d'acceptation vérifiés
- [ ] **AC 2, 3, 4 et 5 prouvés par test automatisé** — pas par revue
- [ ] `lint` 0 · couverture ≥ 90 % · **mutation-tests sur le module d'idempotence, tous rouges à la mutation**
- [ ] **Vérification docker obligatoire** sur stack neuve : rejeu ×50, rejeu parallèle ×10, rejeu après
      `restart`, notifications désordonnées, atomicité prouvée par `abort()` provoqué
- [ ] Revue de sécurité : vérification de signature, absence de secret en journal, anti-rejeu
- [ ] Branche `MNV-154`, PR rebase-mergée sur `dev`
- [ ] 🏁 **Clôture de l'incrément 1** — un lien émis en bac à sable est payé partiellement puis soldé,
      sans double encaissement

---

## Progress Tracking

*(à remplir à l'implémentation)*
