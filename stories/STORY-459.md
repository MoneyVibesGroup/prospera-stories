# STORY-459 : Aucune dotation aux amortissements : l'investissement gonfle l'actif sans jamais le déprécier, et la CAF est prise pour le résultat

Status: in_progress

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

## Arbitrages PO du 2026-09-05 (avant écriture d'une ligne)

### D-459-1 — le stock d'immobilisations de la base n'est **pas** amorti, et la réponse le DIT

AC-5 exige que le stock existant continue de s'amortir, **ou** que la story le déclare. La donnée
n'existe pas au niveau d'agrégation où la projection s'ancre, et c'est **mesuré, pas supposé** :

- l'ancre des emplois durables est un **solde d'ancrage** (`totalActifBase − bfrBase − tresorerieBase`)
  qui absorbe tout ce que le modèle simplifié ne ventile pas — immobilisations, **mais aussi** autres
  créances et dettes. L'amortir en bloc amortirait des créances ;
- `MappingRule` ne déclare **aucun** marqueur d'immobilisations. Les trois marqueurs additifs existants
  sont `tresorerie`, `role` et `chiffreAffaires` (STORY-457) ;
- `ancrage.ts` ne lit que des **agrégats** (invariant P7) : ni `postes`, ni `sousTotaux`, ni `actif`.
  Déduire les immobilisations en sommant les postes d'actif porteurs d'un amortissement non nul serait
  une **heuristique non sourcée**, et franchirait la frontière que cette story n'a pas mandat de bouger.

**Retenu** : seuls les **investissements projetés** s'amortissent. La réponse publie le fait
(`amortissement.stockExistantAmorti: false`) avec son **motif**, sur le patron de `fiscalite` et de
`tresorerieAncree` — jamais un silence qui laisserait croire que la base est amortie.

**Chemin de reprise nommé** (hook inerte, non codé) : un marqueur additif de paquet référentiel
`MappingRule.dotationsAmortissements`, sur le patron **exact** de `chiffreAffaires` (STORY-457) — il
ferait remonter la dotation constatée de l'exercice de base comme un agrégat, sans toucher P7. C'est une
story à part entière : elle touche les artefacts des cinq référentiels.

### D-459-2 — `dureeAmortissementAns` est **requis** ; un jeu antérieur est **refusé au calcul**

`hypotheses` est persisté en `@Prop({ type: Object })` : un jeu enregistré avant cette story se relit sans
erreur et le moteur lirait `undefined`. `investissements / undefined` vaut `NaN`, que JSON sérialise en
`null` — exactement la panne que STORY-457 a mesurée (HTTP 200, montants à `null`, `equilibre: false`
accusant le modèle) et pire encore sur la comparaison, où `NaN` fabriquait des **entiers plausibles**.

**Retenu** : le champ est **obligatoire** au DTO, et `exigerFormeCourante` — le **juge unique** des trois
appelants de moteur — refuse de **calculer** un jeu qui ne le porte pas, ou qui le porte hors de ses
bornes. Compléter par un défaut serait pire : la valeur choisie déplacerait des montants remis à une
banque sans que personne ne l'ait saisie. **Consulter** un ancien jeu reste possible (`getVersion` n'est
pas gardé) ; la migration des documents reste différée, règle projet.

### D-459-3 — linéaire, année pleine, **sans** prorata temporis

Le modèle annuel ne connaît **aucune date d'acquisition** : l'investissement est un montant annuel
récurrent. Un prorata exigerait une donnée qui n'existe pas. Chaque **génération** d'investissement
s'amortit donc linéairement sur `dureeAmortissementAns` années pleines, la première étant l'exercice de
son acquisition — soit `dotations(n) = arrondir(min(n, durée) × investissements / durée)`.

⚠️ **C'est cette forme qui rend l'actif net des investissements structurellement positif** : la dotation
annuelle plafonne à l'investissement annuel, donc le cumul des dotations ne peut pas dépasser le cumul
des investissements, **y compris** quand la durée est plus courte que l'horizon (durée = 1 an :
l'actif net revient à zéro, il ne devient jamais négatif). Une formule naïve `n × I / d` le rendrait
négatif dès `n > d`.

## Conséquences ailleurs

- Interagit directement avec **STORY-458** : l'IS se calcule après dotations.
- Le libellé de `tauxChargesPct` dans la maquette FE-035 pose explicitement la question
  (« dotations aux amortissements comprises ? ») : elle ne pourra être retirée qu'avec cette story.

## Progress Tracking

**Statut : `in_progress`** (2026-09-05) — branches `MNV-459` créées dans `bilan-service` et `docs/`
**avant** la première ligne de code.

```
bilan-service : MNV-459
docs          : MNV-459
```

**Périmètre — un seul dépôt** : `bilan-service`. Aucun contrat d'événement Kafka n'est touché, donc pas
de second dépôt à synchroniser.
