# Rail A — `paiement-service` : les 20 prochaines stories

**Date :** 2026-09-06 · **Service unique :** `prospera-paiement-service` · **Branche d'intégration :** `dev`
**Total :** 73 points · **Rail exécutable seul**, sans rien attendre du rail B.

> Ce rail se termine sur une recette où **une organisation encaisse pour elle-même**, lien compris.
> Ce qu'il ne peut pas prouver seul — que le lien **part** au payeur et que payer **ouvre les
> droits** — est porté par le bloc de consolidation, commun aux deux rails, en fin de document.

---

## Bloc A1 — Débloquer le cas Money Vibes · 11 pts

### 1 · STORY-613 🆕 — Seed d'amorçage : Money Vibes prête à encaisser, en une commande

**Points :** 3 · **Fiche écrite :** `stories/STORY-613.md`

⚡ **Le seed ne contourne rien : il rejoue les quatre vraies étapes par les vraies routes.** Créer
l'organisation, déclarer le module de paiement au catalogue, déposer et approuver les pièces, octroyer
le droit d'usage. C'est ce qui le rend **supprimable sans rien casser** le jour du déploiement réel,
et ce qui en fait la documentation exécutable de l'accueil d'un client.

⛔ **Il n'écrit jamais directement en base.** Une insertion directe sauterait les événements qui
alimentent les read-models du gate : le seed marcherait, et la production resterait fermée.

### 2 · STORY-606 🆕 — L'organisation Money Vibes franchit son propre gate

**Points :** 3 · **Fiche écrite :** `stories/STORY-606.md` · **Prérequis :** 613

Le gate est *fail-closed* sur deux projections qui ne connaissent pas Money Vibes. La story livre la
**garde** qui prouve qu'aucune exception nommée n'a été écrite, et le test qui montre le payeur
non authentifié réglant sur la page publique.

### 3 · STORY-607 🆕 — Arbitrage : aucun topic ne transporte un lien à usage unique

**Points :** 2 · **Fiche écrite :** `stories/STORY-607.md` · ⛔ **Bloque STORY-261**

`paiement.demande.emise` reste publié mais perd jeton et adresse. Deux gardes et une décision écrite
dans les deux découpages.

### 4 · STORY-608 🆕 — Client d'envoi et file de sortie vers `notification-service`

**Points :** 3 · **Fiche écrite :** `stories/STORY-608.md` · **Prérequis :** 607

⚡ La demande est le **fait** ; l'envoi en est une conséquence. L'émission d'une demande ne peut pas
échouer parce qu'un service tiers est tombé. *Le rail A livre l'appelant ; le rail B livre ce qui
répond. Chacun se teste contre un double.*

---

## Bloc A2 — Fermer EPIC-037 · 13 pts

### 5 · STORY-261 — Émission du lien via `notification-service`

**Points :** 5 · **Prérequis :** 607, 608 · ⚠️ **AC-1 réécrit par 607**

L'organe de parole reste unique : aucun envoi direct au payeur depuis ce service. *Appeler la
notification n'est pas parler au payeur.*

### 6 · STORY-259 — Paiement partiel, restants nommés et trop-perçu

**Points :** 5

Le dernier trou du ledger. Trois montants nommés existent depuis 258 ; il manque le **reste** et
le cas où le payeur verse plus que dû.

### 7 · STORY-255 — Simulateur de surcoût de fractionnement, étiqueté estimation

**Points :** 3 · 🏁 **Ferme EPIC-037**

Un chiffre annoncé au payeur qui n'est **pas** une promesse doit le dire dans sa forme, pas dans une
note de bas de page.

---

## Bloc A3 — L'abonnement Prospera · 19 pts

### 8 · STORY-277 — Abonnement : contrat, périodicité, échéance

**Points :** 5 · **Prérequis :** 606

⚡ **Une échéance d'abonnement EST une créance** au sens du service : le cas C ne dispose d'aucune
mécanique propre, seul le bénéficiaire change. Un test matérialise l'invariant inverse : une créance
du cas A n'a **jamais** pour bénéficiaire un compte contrôlé par Money Vibes.

### 9 · STORY-278 — Échéance encaissée : publication vers le catalogue

**Points :** 3

`paiement.abonnement.echeance.encaissee` par l'outbox, keyé `orgId`, en état absolu.

### 10 · STORY-280 — Impayé, suspension et préavis

**Points :** 5

Le préavis part **avant** la suspension, et l'ordre est vérifié, pas supposé.

### 11 · STORY-281 — Période de grâce bornée, datée et motivée

**Points :** 3

Défaut 30 jours, plafond 90. Une grâce sans durée maximale est une remise déguisée.

### 12 · STORY-282 — Rétablissement automatique après régularisation

**Points :** 3

Sans aucune intervention manuelle. C'est ce qui rend la suspension acceptable commercialement.

---

## Bloc A4 — L'argent qui n'arrive pas par le lien · 17 pts

> ⚡ **Ce bloc porte le cas Money Vibes autant que le cas client.** Une licence à 65 000 000 FCFA et
> une maintenance à 3 500 000 FCFA par mois ne passent par **aucun** lien mobile money : elles
> arrivent par virement, donc par le chemin *déclaré puis validé*.

### 13 · STORY-262 — Déclaration manuelle d'encaissement et clé d'idempotence propre

**Points :** 5

### 14 · STORY-263 — Validation d'un encaissement déclaré

**Points :** 3 · ⚡ Le valideur est un **rôle distinct** du déclarant (AD-11, séparation des pouvoirs).

### 15 · STORY-264 — Délai de validation et remontée d'écart

**Points :** 3 · Défaut 48 h ouvrées, plafond 7 jours, l'encaisseur nommé dans l'écart.

### 16 · STORY-265 — Promesse de paiement : enregistrement

**Points :** 3 · Montant, date promise, auteur, canal.

### 17 · STORY-266 — Sort observable d'une promesse, constaté à sa date

**Points :** 3 · Tenue, non tenue, partiellement tenue — **constaté**, jamais saisi.

---

## Bloc A5 — Multi-pays et recette du rail · 13 pts

### 18 · STORY-283 — Référentiel pays × devise versionné et santé dégradée

**Points :** 5 · Ce qui rend le service utilisable hors du Togo. Les cinq pays FedaPay sont déjà
déclarés ; c'est la grille tarifaire qui manque, pays par pays.

### 19 · STORY-284 — Refus de conversion et non-compensation entre devises

**Points :** 3 · Une créance, sa demande et son encaissement sont dans **une seule** devise, et les
créances d'une organisation multi-pays ne se compensent pas.

### 20 · STORY-288 — Recette de bout en bout en bac à sable

**Points :** 5 · 🏁 **Recette du rail A**

Compte déclaré et vérifié, créance, demande, lien, paiement en bac à sable FedaPay, notification
signée, encaissement, solde décomposé. **Sans code conditionnel `si production`** (NFR-5).

---

## Ce que le rail A ne peut pas prouver seul

| Question | Portée par |
|---|---|
| Le lien **part** réellement au payeur | rail B, puis consolidation |
| Le lien part sous l'identité de **l'organisation** | rail B (STORY-604) |
| Payer **ouvre les droits** | consolidation (STORY-279, 609) |
| Le silence **ferme** les droits | consolidation (STORY-609) |

---

## Reste au backlog du rail A, hors des 20

`STORY-267` publication vers Relance · `STORY-269 → 273` réconciliation et relevé *(dépend de
`STORY-268`, hors service)* · `STORY-274 → 276` annulation et contre-passation · `STORY-285`
bornes de montant *(⚠️ largement absorbée par STORY-289, à réévaluer avant de la tirer)* ·
`STORY-286` console d'exploitation · `STORY-287` fournisseur de candidats pour l'assistant.
