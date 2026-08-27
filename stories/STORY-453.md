# STORY-453 : L'échéance de dépôt de la DSF n'est publiée nulle part — une date d'arrêté ne se lit jamais seule

Status: ready-for-dev

**Épic :** EPIC-012 — Validation, immutabilité, exercices, audit
**Service :** `bilan-service · dossier-service`
**Points :** 3 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
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
