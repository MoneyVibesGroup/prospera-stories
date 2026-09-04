# STORY-453 : L'échéance de dépôt de la DSF n'est publiée nulle part — une date d'arrêté ne se lit jamais seule

Status: in_progress

**Épic :** EPIC-012 — Validation, immutabilité, exercices, audit
**Service :** `balance-service · bilan-service` ⚠️ **corrigé le 2026-09-04** — la fiche annonçait `bilan-service · dossier-service`. `dossier-service` n'est **pas** impacté : il embarque bien une copie du paquet fiscal, mais ne lit que `acomptesProvisionnels.echeances` et sert l'échéance d'**acompte**, jamais celle de dépôt. C'est `balance-service` qui possède l'axe fiscal et résout l'échéance.
**Points :** 3 · **Complexité :** high · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-034** (cycle brouillon → validé, snapshot immuable, piste d'audit), 2026-08-27.
Relevé en lisant les contrôleurs de `bilan-service` sur `origin/dev`.

---

## Le fait

Devant « liasse figée le 22/07/2026 » pour un exercice clos au 31/12/2025, le premier réflexe d'un
expert-comptable est de compter les jours jusqu'au **30 avril**. Le produit ne fait ce rapprochement
nulle part.

Le paquet fiscal embarqué (`paquet-fiscal-togo-2026.json`) ne publie qu'**une** donnée datée :
`acomptesProvisionnels.echeances` — les quatre acomptes d'IS (31-01, 31-05, 31-07, 31-10). Le
`paquet-fiscal.util` de `dossier-service` le dit explicitement : *« c'est la **seule** donnée datée
et structurée du paquet »*. **Aucune date de dépôt de liasse.**

⚠️ Et le `_meta` du paquet annonce pourtant : *« Dates de dépôt DSF fournies par l'utilisateur »* —
une source citée pour une donnée que le fichier ne porte pas. Le paquet promet plus qu'il ne tient.

## ⚠️ RECADRAGE DU 2026-09-04 — la fiche a été dépassée par STORY-413

Cette fiche a été écrite le **2026-08-27**. **STORY-413 a été clôturée le 2026-08-30** et a livré
l'essentiel de ce que les AC-1 à AC-3 demandent — mais **dans `balance-service`**, propriétaire de
l'axe fiscal. Vérifié à la source avant toute ligne de code :

| Ce que la fiche demande | État réel au 2026-09-04 |
|---|---|
| **AC-1** — le paquet gagne `depotLiasse: {echeance, base, source}` par régime | ✅ **livré sous le nom `depot`** : trois échéances (`31-03` TPU déclaratif, `30-04` société, `31-05` assurance/banque), chacune avec `typeContribuable`, `dateLimite`, `modeConstatation`, `note`, `source` (LPF Art. 56, …) |
| **AC-2** — dérivée de la clôture de l'exercice, jamais d'une année civile en dur | ✅ `depot.clotureReference` (`31-12`) est **vérifiée** par `resoudreDateLimiteDepot` : une clôture non calendaire rend `CLOTURE_NON_CALENDAIRE` plutôt qu'un 30 avril faux de plusieurs mois |
| **AC-3** — un régime sans dépôt de liasse rend `null`, l'écran n'invente rien | ✅ quatre motifs d'absence explicites (`DEPOT_NON_PACKAGE`, `CLOTURE_NON_CALENDAIRE`, `DATE_LIMITE_INDETERMINABLE`, `PLUSIEURS_ECHEANCES_APPLICABLES`) |
| **AC-4** — l'échéance accompagne **le jeu d'états** | ⛔ **NON livré** : STORY-413 la publie sur `…/fiscal/liquidation` et `…/fiscal/tpu` de `balance-service`, pas sur la liasse |
| **AC-5** — calculée à la lecture, jetable sans dette | ✅ tenu par 413, et conservé ici |
| **AC-6** — validation par un fiscaliste togolais | ⏸ inchangé, hors code |

⚠️ **Le reproche fait au `_meta` n'est plus fondé.** La fiche relève que le paquet annonce « Dates de
dépôt DSF fournies par l'utilisateur » pour une donnée qu'il ne porte pas. Il la porte depuis 413 :
c'est la fiche qui a vieilli, pas le paquet.

### Ce qui reste, et l'arbitrage tranché

Reste **l'AC-4 seul** : porter l'échéance jusqu'au jeu d'états de `bilan-service`. Trois points de
fait l'ont rendu non trivial :

1. `bilan-service` embarque une lignée **différente et plus ancienne** du paquet fiscal
   (`_meta.statut: "AMORCE"`, 10 rubriques, source du 2026-07-12) contre celle de `balance-service`
   (`COMPLET`, 16 rubriques, édition OTR 2025). Elle **ne porte pas** `depot`.
2. `bilan-service` **ne connaît pas le régime fiscal** d'un dossier : son read-model porte
   `typeEntite`, pas `regime`. Il ne pourrait donc constater que l'échéance « assurance / banque ».
3. Recalculer l'échéance dans `bilan-service` dupliquerait la dérivation de `resoudreDateLimiteDepot`
   — **deux moteurs pour une date légale dont le manquement coûte une majoration de 40 %**.

⇒ **Décision de l'user du 2026-09-04 : `balance-service` reste seul auteur de la règle et publie
l'échéance DÉJÀ RÉSOLUE par événement ; `bilan-service` la réplique en read-model local.** C'est
l'invariant d'archi nº 2 appliqué tel quel, et cela ferme la divergence plutôt que de l'ouvrir.

⚠️ **Contrat d'événement ⇒ 2 dépôts** (`balance-service` producteur, `bilan-service` consommateur),
plus `docs/`. Champ **additif** sur `balance.created`, `schemaVersion` inchangé, **omis** jamais
`null` — le patron déjà suivi par `dossierId` (STORY-236), `exerciceId` et `checksumVersion`
(STORY-381).

## Critères d'acceptation

- [ ] AC-1 — Le paquet fiscal gagne `depotLiasse: { echeance, base, source }` par régime — pour le
      Togo : **30 avril** de l'année suivant la clôture, avec sa référence au LPF.
- [ ] AC-2 — La date est **dérivée de la clôture de l'exercice du dossier**, jamais d'une année
      civile en dur.
- [ ] AC-3 — Un régime **sans** dépôt de liasse (TPU libératoire) rend `null` — et l'écran
      n'invente rien, comme pour les acomptes d'IS.
- [ ] AC-4 — L'échéance accompagne le jeu d'états (`echeanceDepot`, `joursRestants` signé) : c'est
      là qu'on regarde une date d'arrêté.
- [ ] AC-5 — ⚠️ Le **calendrier fiscal complet** appartient au module Fiscalité (STORY-315/316,
      sprint 25). Cette story publie **une** échéance, dérivée du paquet, **calculée à la lecture** —
      même patron « jetable sans dette » que l'échéance minimale du portefeuille.
- [ ] AC-6 — ⚠️ Validation par un fiscaliste togolais avant mise en production, comme tout le
      paquet (son `_meta` le demande déjà).

## Conséquences ailleurs

- La maquette FE-034 affiche le rapprochement et le retard (**83 jours** sur le scénario de démo),
  en nommant cette story — c'est la seule information légale de l'écran, et elle vient de nulle part.
- Prérequis naturel de **STORY-446** (dépôt) : on ne constate pas un dépôt sans savoir s'il est
  dans les temps.
