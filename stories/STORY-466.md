# STORY-466 : La duplication d'un jeu d'hypothèses n'existe pas côté serveur — alors qu'elle est le geste central de la comparaison de scénarios

Status: ready-for-dev

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 2 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-035** (hypothèses de prévisionnel paramétrables), 2026-08-27.
Relevé en écrivant les critères d'acceptation de FE-035, dont l'AC-3 exige « créer / lister / éditer / dupliquer ».

---

## Le fait

Comparer deux scénarios (FR-021) suppose deux jeux d'hypothèses **proches** : on part du prudent, on
ouvre deux ou trois curseurs, on nomme « optimiste ». C'est le geste que FE-035 doit offrir, et que
`FE-035 AC-3` exige explicitement.

Le contrôleur ne l'offre pas. Le front ne peut donc que faire un **`POST` complet** avec les mêmes
paramètres, ce qui :

1. **recapture le dernier snapshot** au lieu de reprendre la base de l'original (**STORY-465**) — les
   deux jeux peuvent finir sur deux bases différentes sans que personne ne le demande ;
2. **perd l'origine** : rien ne relie la copie à son modèle, alors que c'est la seule information qui
   rend une comparaison lisible (« optimiste = prudent + 10 points de croissance ») ;
3. n'est pas transactionnel si la copie doit aussi reprendre l'historique.

## Critères d'acceptation

- [ ] AC-1 — `POST /dossiers/:dossierId/bilan/hypotheses/:id/dupliquer` avec `{ nom }` — copie les
      paramètres **et la `base` de l'original**, sans relire `snapshots.dernier`.
- [ ] AC-2 — La copie démarre à `version: 1` avec un historique vide : c'est un jeu neuf, pas une
      branche. L'origine est tracée par `duplicateDe: jeuHypothesesId`.
- [ ] AC-3 — `409 HYPOTHESES_EXISTE` si le nom est pris, `404` si l'original est introuvable ou d'un
      autre dossier (anti-énumération).
- [ ] AC-4 — La comparaison (STORY-071) peut s'appuyer sur `duplicateDe` pour rendre l'écart lisible.

## Conséquences ailleurs

- Sans cette route, l'AC-3 de **FE-035** est livrable côté front mais **fausse dans son effet** : la
  maquette le montre et le déclare.
