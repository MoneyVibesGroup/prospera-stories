# STORY-459 : Aucune dotation aux amortissements : l'investissement gonfle l'actif sans jamais le déprécier, et la CAF est prise pour le résultat

Status: ready-for-dev

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 8 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-035** (hypothèses de prévisionnel paramétrables), 2026-08-27.
Relevé en lisant `projection-annuelle.service.ts` (`capaciteAutofinancement: resultatNet`, `actifImmobiliseNet += hypotheses.investissements`).

---

## Le fait

Deux lignes du moteur, et elles se renforcent :

1. `actifImmobiliseNet += hypotheses.investissements` — l'investissement **s'ajoute** à l'actif
   immobilisé **net**, exercice après exercice, et **rien ne l'amortit jamais**.
2. `capaciteAutofinancement: resultatNet` — la CAF est **assimilée** au résultat, sans réintégration
   des dotations (le commentaire l'assume : « hors du modèle simplifié FR-019 — hook documenté »).

Sur le scénario prudent de la maquette : **3 600 000** investis sur trois ans font passer l'actif
immobilisé net de **2 243 646** à **5 843 646**, sans **une seule** dotation.

⚠️ **Les deux approximations ne se compensent pas** — c'est le point qui rend la story nécessaire :

- si le comptable **loge** la dotation dans `tauxChargesPct`, le résultat devient juste mais la CAF
  est **sous-évaluée du montant de la dotation**, donc la trésorerie projetée est pessimiste ;
- s'il **ne** l'y loge **pas**, le résultat est **surévalué**, l'impôt qui en découlera (STORY-458)
  aussi, et l'actif ne se déprécie jamais.

Il n'existe aucune saisie qui donne les deux à la fois. Le modèle est donc **faux dans les deux cas**,
et rien dans l'écran ne dit lequel choisir.

## Critères d'acceptation

- [ ] AC-1 — Une hypothèse `dureeAmortissementAns` (ou `tauxAmortissementPct`) s'ajoute au jeu, bornée,
      avec la même exigence de version que les autres (`versions_hypotheses`).
- [ ] AC-2 — Le CR prévisionnel porte une ligne `dotationsAmortissements`, déduite du résultat.
- [ ] AC-3 — `capaciteAutofinancement = resultatNet + dotations` — la définition comptable, pas une
      assimilation.
- [ ] AC-4 — `actifImmobiliseNet` est **diminué** des dotations cumulées ; l'équilibre `ecart = 0`
      reste vrai après arrondis (le test de cohérence existant doit rester vert).
- [ ] AC-5 — Le stock d'immobilisations **existant** au bilan de base continue de s'amortir : l'ancre
      résiduelle n'est pas un actif neuf. À défaut de donnée, la story **le déclare** au lieu de le
      supposer.
- [ ] AC-6 — `MODELE_PROJECTION_VERSION` incrémentée.

## Conséquences ailleurs

- Interagit directement avec **STORY-458** : l'IS se calcule après dotations.
- Le libellé de `tauxChargesPct` dans la maquette FE-035 pose explicitement la question
  (« dotations aux amortissements comprises ? ») : elle ne pourra être retirée qu'avec cette story.
