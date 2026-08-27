# STORY-467 : Un emprunt ne coûte rien : aucune hypothèse de taux d'intérêt, aucune charge financière dans le modèle

Status: ready-for-dev

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 5 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-035** (hypothèses de prévisionnel paramétrables), 2026-08-27.
Relevé en lisant le plan de trésorerie du moteur : `fluxFinancement = financement − remboursements`, et rien au compte de résultat.

---

## Le fait

`financement` entre en trésorerie, `remboursements` en sort. **Aucune charge financière** ne rejoint
jamais le compte de résultat prévisionnel : `resultatNet = margeBrute − chargesExploitation`, point.

Conséquence : **un plan financé par emprunt produit exactement le même résultat qu'un plan financé par
apport en capital.** Aucun banquier ne signerait un prévisionnel qui affirme cela, et c'est justement
le lecteur principal du document.

`tauxChargesPct` ne peut pas y suppléer : il porte sur les **produits**, pas sur l'encours de dette.
Et rien ne modélise les **agios** quand la trésorerie devient négative — ce qui arrive dans deux des
trois scénarios de la maquette FE-035.

## Critères d'acceptation

- [ ] AC-1 — Une hypothèse `tauxInteretPct` (et, si l'échéancier de **STORY-460** est livré, la durée)
      s'ajoute au jeu, bornée et versionnée.
- [ ] AC-2 — Le CR prévisionnel porte `chargesFinancieres`, calculées sur l'**encours** de dette
      (financement cumulé − remboursements cumulés), et le résultat en tient compte.
- [ ] AC-3 — Une trésorerie de clôture négative génère un **coût de découvert** au taux saisi, ou
      **est refusée** comme hypothèse — l'un ou l'autre, jamais le silence actuel.
- [ ] AC-4 — ⚠️ Le plafond de déductibilité des **intérêts de comptes courants d'associés** (taux légal
      majoré de 3 points, Art. 99 m / 102 CGI — le paquet fiscal le publie déjà) est **hors périmètre**
      de cette story : il appartient au résultat fiscal, pas au modèle de projection. À nommer pour ne
      pas être redécouvert.
- [ ] AC-5 — `MODELE_PROJECTION_VERSION` incrémentée.

## Conséquences ailleurs

- Interagit avec **STORY-458** : les charges financières réduisent le bénéfice imposable — mais pas le
  MFP, assis sur le CA. L'ordre de calcul doit être écrit une fois pour toutes.
