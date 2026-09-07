# STORY-466 : La duplication d'un jeu d'hypothèses n'existe pas côté serveur — alors qu'elle est le geste central de la comparaison de scénarios

Status: in_progress

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

## Décisions de cadrage (2026-09-07)

- **D-466-1 — `duplicateDe` est publié sur la réponse du jeu ET sur le scénario de
  comparaison.** L'AC-4 dit « peut s'appuyer sur » : un champ qui n'atteint pas la
  comparaison rendrait l'AC aspirationnel. La comparaison ne **calcule** rien de neuf à
  partir de ce champ — les écarts restent exactement ceux de STORY-071 ; elle le
  **transporte**, ce qui permet à l'écran d'écrire « optimiste = copie de prudent ».
- **D-466-2 — rôles alignés sur la CRÉATION (`TENANT_ADMIN` + `TENANT_USER`)**, et non sur
  `rebaser` / `supprimer`, réservés à l'admin. Dupliquer ne détruit rien, ne déplace rien et
  ne touche aucun jeu existant : le geste est un `POST` de plus, avec la base de l'original.
- **D-466-3 — 201 Created**, contrairement au 200 explicite de `rebaser` : ici une ressource
  est bel et bien créée, et le client en reçoit l'identifiant.
- **D-466-4 — aucune transaction, et c'est une conséquence d'AC-2.** Le point 3 du « fait »
  ne vaut que si la copie reprend l'historique ; AC-2 tranche l'inverse (version 1,
  historique vide). Un seul document est écrit — ouvrir une session serait une cérémonie
  sans objet.
- **D-466-5 — `duplicateDe` peut désigner un jeu supprimé depuis** (STORY-464 a ouvert la
  suppression). L'identifiant est conservé tel quel, sans nettoyage ni cascade : c'est une
  **trace d'origine**, pas une clé étrangère. Même parti que le `conflitAvec: null` de
  STORY-464, qui préfère dire honnêtement qu'il ne désigne plus personne.

### Hors périmètre (explicite)

- Dupliquer **l'historique** de versions de l'original (AC-2 dit le contraire).
- Dupliquer **vers un autre dossier** : le repository est dossier-scopé, l'original et la
  copie vivent dans le même dossier, et rien dans FE-035 ne demande autre chose.
- Faire **calculer** quoi que ce soit à la comparaison à partir de `duplicateDe` (D-466-1).
