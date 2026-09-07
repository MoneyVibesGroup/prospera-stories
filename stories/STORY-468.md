# STORY-468 : La durée de l'exercice de base n'est publiée nulle part — une croissance annuelle appliquée à un exercice de 18 mois

Status: review

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service` — ⚠️ **pas `dossier-service`**, voir D-468-1
**Points :** 2 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-035** (hypothèses de prévisionnel paramétrables), 2026-08-27.
Relevé par la passe expert-comptable sur l'écran FE-035 fini, en cherchant ce qu'on lit avant de saisir un taux de croissance.

---

## Le fait

La DSF déposée porte une colonne **« Durée (en mois) »**, et ce n'est pas une décoration : un **premier
exercice** ou un **changement de date de clôture** donne couramment un exercice de **18** ou de **6**
mois. C'est un cas fréquent, pas une curiosité.

Le prévisionnel applique `produits × (1 + croissance)` à `produitsBase` **sans savoir sur combien de
mois** ce montant a été réalisé. Projeter « +8 % » sur un exercice de 18 mois surestime N+1 de moitié ;
sur 6 mois, le sous-estime du double.

Ni `AncresProjection` ni `HypothesesBase` ne portent la durée. `HypothesesBase.exercice` est un
**libellé** (`"2025"`) — au point que `millesime()` refuse de dater les exercices projetés dès que ce
libellé n'est pas une année sur quatre chiffres, et rend `null`. Le produit sait donc déjà que ce champ
n'est pas fiable ; il n'en tire aucune conséquence côté prévisionnel.

L'écran ne peut même pas **prévenir**.

## Critères d'acceptation

- [x] AC-1 — `HypothesesBase` (et `AncresProjection`) portent `dureeMois` de l'exercice de base, lue du
      dossier (`dateDebut` / `dateCloture`), pas du libellé.
- [x] AC-2 — Quand `dureeMois !== 12`, la réponse porte `baseAnnualisable: false` et **l'annualisation
      n'est pas faite en silence** : soit le moteur annualise et le **déclare**, soit il refuse — le PO
      tranche, mais le silence n'est pas une option.
- [x] AC-3 — Le cas `dureeMois` inconnue (dossier sans dates) rend `null` signalé.
- [ ] AC-4 — L'écran des hypothèses affiche la durée à côté de l'assiette de croissance.

## Conséquences ailleurs

- Même famille que **STORY-453** (l'échéance de dépôt) : une donnée de calendrier que le métier lit en
  premier et que le produit ne publie pas.

## Décisions de cadrage (2026-09-07)

- **D-468-1 — ⚠️ `dossier-service` n'est PAS touché : la prémisse de l'en-tête est fausse.** Le
  read-model `exercices_dossier` de `bilan-service` porte **déjà** `debut` et `fin` (Date, requis),
  et `jeux_etats` porte **déjà** `exerciceId` depuis STORY-381 (AC-9). Toute la chaîne
  `jeu d'états → exercice → dates` vit donc **dans ce service**, et `ExercicesDossierRepository.parId`
  est déjà le point de lecture. Rien à publier en plus côté producteur, rien à consommer en plus.
- **D-468-2 — AC-2 tranché du côté de l'ANNUALISATION, arbitrage user du 2026-09-07.** Le moteur
  ramène la base à douze mois et le **déclare** ; il ne refuse pas. Refuser priverait de
  prévisionnel une société en **premier exercice** ou qui vient de changer sa date de clôture —
  c'est-à-dire exactement la population pour qui un plan d'affaires compte le plus. ⚠️ Le risque
  est **nommé** : l'annualisation est un **prorata temporis**, donc une activité **saisonnière**
  est mal représentée. C'est pour cela qu'elle est publiée avec son facteur, jamais faite en
  silence.
- **D-468-3 — seuls les agrégats de FLUX sont annualisés**, jamais ceux de **bilan**. Produits,
  chiffre d'affaires, marge brute, charges et résultat courent sur la période ; total actif,
  trésorerie de clôture et BFR réel sont des **photographies à la date de clôture** et ne se
  proratisent pas. Les annualiser doublerait un actif sur un exercice de six mois.
- **D-468-4 — l'annualisation s'applique en UN SEUL point : `extraireAncres`.** Les **trois**
  chemins de projection (`projeter`, `projeterMensuel`, `comparer`) y passent. La poser dans les
  moteurs en ferait **deux** points, et le mensuel dérive ses agrégats de N+1 lui-même : la
  moindre divergence casserait `ecartArticulation` — le piège de STORY-460 et de STORY-467.
- **D-468-5 — `dureeMois` est CAPTURÉE dans `HypothesesBase` à la création**, comme le libellé
  d'exercice, et non relue à chaque projection. C'est ce qui rend une projection **reproductible** :
  le triplet (jeu, version, snapshot) doit rendre les mêmes chiffres même si l'exercice du dossier
  est corrigé après coup. ⚠️ Conséquence : un jeu enregistré **avant** cette story porte `null`, et
  c'est exactement le cas que l'AC-3 prévoit — **aucun refus**, contrairement à STORY-467.
- **D-468-6 — la durée se compte en MOIS CALENDAIRES touchés** :
  `(finAnnée − débutAnnée) × 12 + (finMois − débutMois) + 1`. C'est la lecture de la colonne
  « Durée (en mois) » de la DSF, et elle ne dépend pas du quantième : du 1ᵉʳ juillet 2024 au
  31 décembre 2025 il y a **18** mois, quel que soit le jour de clôture. Une durée calculée
  inférieure à 1 vaut **inconnue** plutôt que fausse.
- **D-468-7 — ⚠️ `baseAnnualisable` se lit « la base est DÉJÀ sur douze mois »**, et non « on peut
  l'annualiser ». Le nom vient de l'AC-2 et il est **conservé pour rester fidèle à la fiche**, mais
  il se lit à l'envers de l'intuition : il vaut `false` précisément quand l'annualisation **est**
  appliquée. Le contrat le dit explicitement plutôt que de laisser deviner.
- **D-468-8 — le facteur est publié, pas les montants constatés.** Un lecteur qui veut retrouver
  la DSF divise par `facteurAnnualisation` — un seul nombre suffit, là où republier cinq agrégats
  bruts doublerait la surface du contrat.

### Hors périmètre (explicite)

- **AC-4 — l'affichage** de la durée à côté de l'assiette de croissance est un travail **de
  l'écran**. Le back-end livre la donnée et le drapeau ; la maquette FE-035 s'en saisira.
- La **saisonnalité** : le prorata temporis est uniforme (D-468-2). Une clé de saisonnalité serait
  une story à part, et une hypothèse de plus à saisir.
- La **correction rétroactive** des jeux déjà enregistrés : ils portent `null` et se projettent
  comme avant (D-468-5).

---

## Progress Tracking

**Statut : review** (dev + validation + vérification docker faits ; revues à suivre).
⚠️ **AC-4 reste ouvert** : l'affichage est un travail de l'écran, le back-end livre la donnée.

### Livré

| Fichier | Ce qui change |
|---|---|
| `projection/duree-exercice.ts` **(neuf)** | unité **pure** : `dureeMoisExercice`, en mois calendaires |
| `hypotheses.schema.ts` | `HypothesesBase.dureeMois`, **capturée** à la création |
| `hypotheses.service.ts` | résolution depuis l'exercice du dossier, **reportée** par `rebaser` et `dupliquer` |
| `projection/ancrage.ts` | l'**annualisation**, en un seul point |
| `projection.types.ts` + DTO | `dureeMoisBase`, `baseAnnualisable`, `annualisationAppliquee`, `facteurAnnualisation` |
| les 3 sites de projection | passent la durée capturée |

### Portes de qualité

| Porte | Résultat |
|---|---|
| Lint | 0 erreur, 0 avertissement |
| Build | `nest build` OK |
| Unitaires + couverture | **2 155 tests verts** — 98,88 % lignes / 94,55 % branches. `duree-exercice.ts` et `ancrage.ts` à **100 %** sur les quatre axes |
| E2E | **643 tests verts** (`--runInBand`) |

### Table de mutations — 10 mutations, 9 rouges, 1 déclarée VACANTE

| # | Mutation | Verdict |
|---|---|---|
| M1 | durée comptée hors mois calendaires | ROUGE |
| M2 | durée lue en heure **locale** au lieu d'UTC | ⚠️ **VERT — déclarée non gardée** |
| M3 | dates incohérentes rendent une durée **négative** au lieu de `null` | ROUGE |
| M4 | les agrégats de **bilan** sont annualisés eux aussi | ROUGE |
| M5 | aucune annualisation — la base est projetée telle quelle | ROUGE |
| M6 | facteur **inversé** (`dureeMois/12`) | ROUGE |
| M7 | `baseAnnualisable` codé en dur à `true` | ROUGE |
| M8 | la durée n'est pas capturée à la création | ROUGE |
| M9 | la lecture du read-model n'est plus scopée au **dossier** | ROUGE |
| M10 | les **3** sites de projection ne passent plus la durée | ROUGE |

⚠️⚠️ **M2 est déclarée VACANTE plutôt que simulée.** La machine de développement **et** la CI
tournent sur `Africa/Lome` (**UTC+0**) : muter `getUTCMonth()` en `getMonth()` laisse la batterie
verte. ⛔ Ma première parade — `process.env.TZ` dans un `beforeAll` — **ne rattrapait rien** :
Node fige le fuseau au démarrage du worker jest, et la mutation virait au rouge **parce que le
TÉMOIN échouait**, pas parce que la garde discriminait. Un faux rouge, de la famille des mutations
rouges par erreur de compilation. La précaution reste dans le code, **déclarée non gardée** — même
parti que le `-0` de `controleAncrage`.

⚠️ **Un défaut de mon HARNAIS de mutation, attrapé par un e2e.** M10 porte **deux** éditions sur le
**même** fichier ; la sauvegarde de restauration était écrasée par la version **déjà mutée**, et la
restauration a laissé du code muté en place — les deux sites de projection ne passaient plus la
durée. Deux e2e neufs l'ont vu. Le harnais sauvegarde désormais l'**original** une seule fois par
fichier. **Une mutation mal restaurée est pire qu'une mutation non faite.**

### Vérification docker (stack réelle, données réelles)

| Mesure | Résultat |
|---|---|
| AC-1 | Le jeu créé porte `base.dureeMois: 12`, persisté en **`number`**, publié sur la réponse. |
| ⚡⚡ **AC-1/AC-2 sur un exercice de 18 mois** | Dates du dossier portées à `2024-07-01 → 2025-12-31`. Le jeu capture **18**, la réponse publie `baseAnnualisable: false`, `annualisationAppliquee: true`, `facteur = 2/3`. Produits **16 375 000 → 10 916 667**, N+1 **18 012 500 → 12 008 334**. |
| ⛔ **D-468-3** | `totalActifBase` et `tresorerieBase` **identiques** entre les deux jeux, sur le **même** snapshot. Seuls les flux bougent. |
| ⚡ **La correction collatérale** | Délai clients **constaté** : **44 → 66** jours. Il était sous-estimé d'un tiers, et il redevient juste sans qu'une ligne de `bfr.ts` change. |
| Invariant | Taux de marge constaté **inchangé** (18,32 %) : c'est un **ratio**, l'annualisation ne le déplace pas. |
| Équilibre | `ecart = 0` sur les trois exercices du jeu annualisé. |
| ⚡ **D-468-5 prouvé** | Les dates du dossier ont été **restaurées** à `2025-01-01 → 2025-12-31` après la création : le jeu porte **toujours 18**. La projection reste reproductible même quand le dossier se corrige. |
| D-468-4 | Plan mensuel du jeu annualisé : `ecartArticulation = 0`, et le mensuel voit la **même** base (10 916 667). |
| AC-3 | Les **28** jeux antérieurs publient `dureeMoisBase: null`, `baseAnnualisable: true`, `facteur: null`. **Aucun refus.** |
| Contrat | **0** réponse omet `dureeMois` sur la base — le champ est toujours présent, `null` compris. |
| D-468-8 | Le montant constaté se retrouve : `10 916 667 / (2/3)` rend bien **16 375 000**. |

⚠️ **Écriture non-lecture assumée** : les dates de l'exercice du read-model ont été modifiées le
temps de la mesure, puis **restaurées et revérifiées**. Le read-model est alimenté par Kafka : il
serait de toute façon reprojeté au prochain événement.
