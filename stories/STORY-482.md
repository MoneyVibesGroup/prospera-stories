# STORY-482 : Une trésorerie négative n'est ni nommée, ni financée : portée à l'actif, sans découvert, sans agios, sans besoin chiffré

Status: in_progress

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 5 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-036** (projection 3 ans, trésorerie 12 mois, scénarios comparés), 2026-08-27.
Relevé en lisant le bilan prévisionnel simplifié d'un exercice déficitaire en trésorerie, puis en cherchant le besoin de financement à l'écran.

---

## Le fait

Trois manques qui n'en font qu'un : le modèle sait produire une trésorerie négative, et ne sait rien
en dire.

**① Elle est portée à l'actif.** `BilanSimplifiePrevisionnel.tresorerieNette` reçoit
`tresorerieCloture` telle quelle, et `totalActif = actifImmobiliseNet + bfr + tresorerieNette`. Un
solde de −804 945 est donc un **emploi négatif**. Comptablement, un découvert est une **ressource au
passif** (concours bancaires courants). L'équilibre reste arithmétiquement vrai — l'écart vaut 0 par
construction — mais **la lecture est fausse**, et c'est un bilan qu'on remet à un banquier.

**② Il n'y a ni découvert, ni agios.** Six mois dans le rouge en N+1 sur le dossier de démonstration,
et **aucune charge financière**. Un découvert coûte, et son coût creuse le découvert.

**③ Le besoin de financement n'est chiffré nulle part.** C'est pourtant le chiffre pour lequel on
ouvre l'écran : **804 945** à couvrir sur N+1, **4 092 714** sur l'horizon. Il est dérivable en une
ligne (`−min(clôtures)`), la maquette le calcule elle-même — mais aucun champ du contrat ne le porte,
donc chaque client le recalculera à sa façon.

## Critères d'acceptation

- [ ] AC-1 — Le bilan prévisionnel simplifié sépare `tresorerieActive` (≥ 0, à l'actif) et
      `concoursBancaires` (≥ 0, au passif) — jamais un montant négatif à l'actif.
- [ ] AC-2 — Le contrôle d'équilibre est **maintenu** : `ecart === 0` après la ventilation, arrondis
      compris. Un test le vérifie sur un exercice à trésorerie négative — le cas que le modèle
      produit aujourd'hui sans le traiter.
- [ ] AC-3 — Une hypothèse de **taux de découvert** (`tauxDecouvertPct`, défaut 0) génère une charge
      financière décaissée, publiée comme ligne du plan de trésorerie.
- [ ] AC-4 — La réponse porte `besoinFinancement: { maximal, moisMaximal, surHorizon }` — annuel et
      mensuel. Un besoin de financement calculé par chaque client est un besoin de financement
      différent chez chacun.
- [ ] AC-5 — `MODELE_PROJECTION_VERSION` évolue.

---

## Arbitrages de cadrage (2026-09-08, avant la première ligne)

⚡⚡ **La fiche a été rédigée le 2026-08-27 ; STORY-467 a été clôturée le 2026-09-07.** Elle a livré
une partie de l'AC-3 : `coutDeDecouvert` chiffre déjà l'agio quand la clôture est négative
(`projection/charges-financieres.ts`), le montant entre au compte de résultat via
`ChargesFinancieresExercice`, et le plan mensuel le **décaisse** déjà sous
`decaissementsChargesFinancieres`. Ce qui reste de l'AC-3 est donc le **taux distinct**, que
D-467-6 nommait explicitement hors périmètre. Le reste des AC est intact.

**D-482-1 — la ventilation, et pourquoi l'équilibre tient.** `tresorerieActive = max(0, clôture)`,
`concoursBancaires = max(0, −clôture)`. `totalActif` prend `tresorerieActive`, `totalPassif` prend
`concoursBancaires` en plus des ressources. L'écart reste **nul par construction** parce que
`max(0, T) − max(0, −T) = T` pour tout `T` : la ventilation déplace le même montant d'un côté à
l'autre, elle n'en crée aucun. Les deux montants sont **entiers** (la clôture l'est déjà), donc
aucun arrondi ne s'y glisse — AC-2 sans condition d'arrondi.

**D-482-2 — `tresorerieNette` reste publié, et ce n'est pas de la compatibilité molle.** Il vaut
`tresorerieActive − concoursBancaires`, c'est-à-dire la position nette, qui est une information
distincte des deux lignes de bilan et que le plan de trésorerie porte déjà. Le retirer casserait
des lecteurs sans rien gagner ; le garder **sans** les deux nouvelles lignes est ce que la story
refuse. Sa description dit désormais qu'il n'est **pas** une ligne d'actif.

**D-482-3 — `tauxDecouvertPct` est FACULTATIF, et absent il vaut `tauxInteretPct` — PAS `0`.**
⛔ La fiche écrit « défaut 0 » ; c'était le comportement en place **le 2026-08-27**, quand aucun coût
de découvert n'existait. Depuis le 2026-09-07 le découvert est facturé au taux de l'emprunt, et
vérifié en docker (3 475 633 sur une clôture à −46 921 051). Appliquer « défaut 0 » à la lettre
**retirerait ce coût à tous les jeux déjà enregistrés** : une régression silencieuse d'une story
clôturée la veille. ⛔ Et le motif de D-467-1 vaut ici mot pour mot : un défaut à 0 affirmerait que
**le découvert ne coûte rien**, alors qu'un découvert coûte toujours, et en pratique plus cher qu'un
emprunt. Le repli sur `tauxInteretPct` est un **défaut sourcé** — le patron de la surcharge de TVA
(D-469) —, pas une valeur inventée. Aucun jeu antérieur n'est refusé de plus : le champ est
facultatif, donc `exigerFormeCourante` ne s'y ajoute pas.

**D-482-4 — `besoinFinancement`, une seule forme sur les deux routes, deux mailles.**
- `maximal` — le creux le plus profond **à la maille de la réponse** : `max(0, −min(clôtures))` sur
  les douze mois de l'exercice demandé (route mensuelle) ou sur les trois clôtures annuelles (route
  annuelle).
- `surHorizon` — le creux le plus profond **de l'horizon entier, à la maille MENSUELLE** (les
  trente-six mois). ⛔ C'est le seul des trois qui soit un vrai besoin de financement : une clôture
  annuelle **cache** le creux intra-annuel, et c'est exactement le défaut que STORY-481 a nommé — « le
  pire moment du prévisionnel se trouvait structurellement hors du document ». Identique sur les deux
  routes, donc jamais deux chiffres pour la même question.
- `moisMaximal` — le rang du mois, **sur l'horizon (1..36)**, où survient `surHorizon`. ⛔ Il date
  `surHorizon` et **non** `maximal` : `surHorizon` est mensuel sur les deux routes, donc ce rang est
  toujours un vrai mois, sans convention à inventer pour la maille annuelle. `0` quand
  `surHorizon === 0` — la même convention d'absence que `moisTresorerieMinimale`.
- ⚠️ La route annuelle calcule donc les trois plans mensuels pour servir `surHorizon`. C'est de
  l'arithmétique pure, sans entrée/sortie, sur un chemin déjà emprunté par `ancrerExercice`.

**D-482-5 — `MODELE_PROJECTION_VERSION` : mineure.** Des champs s'ajoutent et un montant change
(`totalActif` d'un exercice à trésorerie négative), mais aucun champ ne disparaît et aucune saisie ne
devient requise.

### Hors périmètre, nommé

- La **boucle** agio → résultat → trésorerie → agio reste à **une itération** (D-467-5) : le taux de
  découvert change la valeur du plafond publié, pas la méthode.
- Le **découvert n'est pas plafonné** : aucun modèle d'autorisation bancaire n'est saisi. Un
  `concoursBancaires` de plusieurs millions est publié tel quel, sans dire s'il serait accordé.

## Conséquences ailleurs

- **STORY-467** (aucune charge d'intérêt sur les emprunts) et l'AC-3 relèvent du même mécanisme :
  les traiter ensemble, sinon le modèle facturera le découvert et pas l'emprunt.
  ✅ **Traité** : 467 est clôturée depuis le 2026-09-07, le mécanisme est en place, et cette story n'y
  ajoute que le taux distinct (D-482-3).
