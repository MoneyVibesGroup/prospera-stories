# STORY-467 : Un emprunt ne coûte rien : aucune hypothèse de taux d'intérêt, aucune charge financière dans le modèle

Status: in_progress

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

## Décisions de cadrage (2026-09-07)

- **D-467-1 — `tauxInteretPct` est REQUIS, jamais optionnel avec un défaut à 0.** Un défaut à
  zéro affirmerait « l'emprunt ne coûte rien » — le défaut **exact** que cette story ferme, et
  il pencherait du côté **faussement rassurant** sur un document remis à une banque. Même parti
  que `dureeAmortissementAns` (D-459-2). Conséquence assumée et symétrique de STORY-459 : un jeu
  enregistré **avant** cette story n'est plus **projetable** tant qu'il n'est pas ré-enregistré,
  et `exigerFormeCourante` le refuse en nommant le champ — jamais un `NaN` qui sortirait en
  HTTP 200 avec des montants à `null` (la panne mesurée de STORY-457).
- **D-467-2 — les intérêts portent sur l'ENCOURS MOYEN de l'exercice**, `(ouverture + clôture)/2`,
  et non sur l'un des deux bouts. L'**ouverture** dirait qu'un emprunt contracté en N+1 ne coûte
  rien en N+1 — le silence même qu'on ferme. La **clôture** ferait payer une année pleine sur une
  dette remboursée en cours d'année.
- **D-467-3 — ⚠️ l'encours ne porte que la dette PROJETÉE.** L'encours de dette de l'exercice de
  base n'est **pas isolable** des agrégats d'ancrage — `AncresProjection` ne porte ni dettes
  financières ni charges d'intérêts de la base. C'est **exactement** la limite de D-459-1 sur le
  stock d'immobilisations, et elle se traite pareil : **publiée** dans la réponse (`dettesBase
  NonPortees` + motif), jamais tue. Un cabinet déjà endetté verra donc des charges financières
  **inférieures** à sa réalité, et il doit l'apprendre du contrat.
- **D-467-4 — AC-3 tranché du côté du COÛT, pas du refus.** Refuser une trésorerie de clôture
  négative rendrait l'outil inutilisable sur **deux des trois scénarios** de FE-035. Un
  prévisionnel doit pouvoir **montrer** un besoin de trésorerie : c'est précisément ce que son
  lecteur principal vient y lire. Le refuser reviendrait à cacher le fait au lieu de le chiffrer.
- **D-467-5 — le coût de découvert est calculé sur la clôture AVANT ce coût lui-même : UNE
  itération, jamais un point fixe.** Le coût dépend de la trésorerie, qui dépend du résultat, qui
  dépend du coût — la boucle est réelle. Le découvert **réel** est donc légèrement supérieur à
  celui facturé, d'un montant borné par `taux × coût`. ⛔ Le plafond est **nommé dans le
  contrat** : l'assiette retenue est publiée, pour qu'aucun lecteur n'ait à deviner sur quoi le
  taux a été appliqué.
- **D-467-6 — le taux de découvert EST le taux d'intérêt saisi**, la fiche disant « au taux
  saisi ». Un taux de découvert **distinct** — en pratique bien supérieur à un taux d'emprunt —
  est **hors périmètre** et nommé ici pour ne pas être redécouvert.
- **D-467-7 — le MENSUEL décaisse ces charges, sinon `ecartArticulation` cesse d'être nul.** Les
  charges financières entrent dans la CAF, donc dans le flux annuel ; un mensuel qui ne les
  décaisserait pas ferait diverger un contrôle que le contrat publie comme une **identité**
  (même piège que STORY-460, cité dans le moteur). Elles y sont une **ligne publiée** : « un
  total ne contient que des lignes vues ».
- **D-467-8 — ordre de calcul vis-à-vis de STORY-458, écrit une fois pour toutes.** Les charges
  financières réduisent le **résultat avant impôt**, donc l'IS — mais **pas** le MFP, assis sur
  le chiffre d'affaires. C'est automatique : `liquiderImpot` reçoit le résultat et le CA
  **séparément**, et il n'y a rien à ordonner de plus.

### Hors périmètre (explicite)

- **AC-4 — le plafond de déductibilité des intérêts de comptes courants d'associés** (taux légal
  majoré de 3 points, Art. 99 m / 102 CGI). Il appartient au **résultat fiscal**, pas au modèle
  de projection : celui-ci calcule un résultat **comptable** avant de le confier à
  `liquiderImpot`. Le paquet fiscal publie déjà le plafond ; c'est une story du moteur fiscal.
- Un **taux de découvert distinct** du taux d'emprunt (D-467-6).
- Les **intérêts sur la dette de la base** (D-467-3), faute d'ancre pour l'encours.
- Le **point fixe** du coût de découvert (D-467-5).
