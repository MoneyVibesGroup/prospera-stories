# STORY-468 : La durée de l'exercice de base n'est publiée nulle part — une croissance annuelle appliquée à un exercice de 18 mois

Status: done

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

**Statut : done** — clôturée le 2026-09-07. PR `bilan-service` #100 rebase-mergée sur `dev`.
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

### Revue de code — 8 constats, **5 BLOQUANTS**, tous corrigés

1. ⚡⚡ **BLOQUANT — j'avais écrit un SECOND calcul d'une grandeur qui existe déjà.**
   `dureeEnMois` (STORY-430) est la réponse du service à la colonne « Durée (en mois) » de la
   DSF, et **son docstring rejette explicitement** la règle des « mois touchés » que j'avais
   posée. Les deux divergent, et **dans le mauvais sens** : `2025-01-15 → 2026-01-14` — douze
   mois **exactement**, le cas statutaire d'une société immatriculée en cours de mois —
   rendait **13**. Le moteur aurait donc **annualisé une base déjà annuelle**, en amputant les
   flux de **7,7 %**, et l'aurait déclaré comme une correction : l'inverse exact du défaut que
   la story ferme. Le service aurait de surcroît publié **deux réponses contradictoires à la
   même colonne** (22 contre 21 sur `2024-03-17 → 2025-12-31`). Le fichier n'est plus qu'un
   **adaptateur** qui délègue, et une garde interdit au second calcul de revenir.

   ⚠️ **Ma batterie était tirée du MÊME modèle mental que le code** : l'`it.each` « le
   quantième n'entre pas dans le compte » ne pouvait que confirmer la formule. Le cas
   discriminant y est désormais.

2. **BLOQUANT — la garde d'incohérence de dates était plus étroite que sa justification.**
   Elle promettait de fermer « fin avant début » mais ne voyait ni l'inversion **intra-mois**
   (`2025-03-20 → 2025-03-05` rendait **1**) ni les dates **égales**. Un « exercice d'un mois »
   tiré de dates inversées donne `facteur = 12`, c'est-à-dire des flux **multipliés par
   douze**, publiés comme une base annualisée. Les deux cas de la batterie étaient inter-mois :
   la fixture **ne pouvait pas produire le cas nommé**.

3. **BLOQUANT — le document EXPORTÉ servait les ancres annualisées en silence.** Sur dix-huit
   mois, le PDF remis à une banque imprime **13 333 333** là où la DSF déposée porte
   **20 000 000**, sans facteur pour retrouver le constaté. L'AC-2 exige que l'annualisation ne
   soit pas faite en silence, et l'export est du **back-end**, pas « l'affichage » de l'AC-4.

4. **BLOQUANT — deux classes portaient le nom `HypothesesBaseDto`.** `@nestjs/swagger` **clé
   ses schémas par nom de classe** : une seule survivait. Tant que les deux étaient de forme
   identique la collision restait inoffensive ; **cette story les a fait diverger**, et le
   schéma retenu annonçait `dureeMois` **requis** sur une route qui ne le rendait jamais.

5. **BLOQUANT — `MODELE_PROJECTION_VERSION` restait à 1.4.0** alors que deux projections du
   **même snapshot** rendent des montants différents selon que le jeu porte ou non une durée.
   La convention du dépôt est explicite : STORY-460 a incrémenté **alors qu'elle ne déplaçait
   aucun montant**. → **1.5.0**.

6. ⚡⚡ **Le point d'application est unique, mais QUATRE sites l'alimentent — et un SEUL était
   gardé.** Muter les trois autres à `null` laissait **2 155 unitaires et 643 e2e VERTS**. Le
   plus grave : un jeu ancré sur dix-huit mois **rebasé** perdait sa durée — `updateOne`
   remplace le sous-document `base` **entier** — et repartait avec `baseAnnualisable: true`,
   une affirmation **fausse**, et un N+1 de nouveau surestimé de 50 %.

7. **La comparaison annualisait sans rien déclarer.** `baseHomogene` ne regarde que le jeu
   d'états et la version de snapshot : il vaut **`true`** sur deux bases de durées différentes,
   et l'écart publié aurait été imputé à l'hypothèse alors qu'il vient de la base — le défaut
   exact que STORY-466 a fermé pour la duplication.

8. La docstring de `refusDeForme` et l'énumération de portée du juge de forme.

**Mutations après correctifs : 14, toutes rouges** (dont une par site d'alimentation).

### Revue de sécurité — 0 vulnérabilité

Six axes instruits et clos, plusieurs **par exécution** :

- **Isolation** : la nouvelle lecture prend `tenantId` et `dossierId` **du document** jeu
  d'états, lui-même rendu par un dépôt dossier-scopé fail-closed — un jeu d'un autre dossier
  est **déjà** `null` (404 anti-énumération) avant toute lecture d'exercice. Patron identique
  aux deux autres appelants du dépôt.
- **Données venant de Kafka** : dates inversées franches, intra-mois et égales rendent toutes
  `null` — **pas de division par zéro, pas de facteur négatif**. Le facteur est **borné dans
  (0 ; 12]**. Pas de `NaN` publiable. Le seul écrivain du read-model rejette en amont toute
  borne non parsable.
- **Injection de formule dans le classeur** : la métadonnée ne concatène **aucune donnée
  d'utilisateur**, et la cellule commence toujours par son libellé littéral — elle ne peut pas
  débuter par `=`.
- **Reproductibilité** : `base` n'est jamais construit depuis une entrée client, donc pas de
  *mass-assignment* sur `dureeMois` ; le calcul est déterministe.

⚠️ **Deux observations hors périmètre sécurité, notées pour mémoire** : le consommateur ne
**vérifie** pas la normalisation UTC que le contrat d'événement promet côté producteur (une
borne décalée ferait passer un exercice de 12 mois à 11, donc des flux gonflés de 9 %) ; et une
année étendue produirait une durée finie plutôt qu'un `null`. Ni l'un ni l'autre n'est
atteignable par un appelant HTTP.

### Vérification docker REJOUÉE sur l'état final

Les correctifs ont changé la **règle de durée**, la **version du modèle** et l'**export** : la
mesure a été refaite après, jamais reportée.

| Mesure rejouée | Résultat |
|---|---|
| Modèle | **1.5.0** sur les deux jeux |
| 12 mois | durée 12, non annualisée, produits **16 375 000**, N+1 **18 012 500**, équilibre nul |
| 18 mois | durée 18, annualisée au facteur 2/3, produits **10 916 667**, N+1 **12 008 334**, équilibre nul |
| **Export** | classeur en **200**, portant la mention, la **durée**, le **facteur** et la **saisonnalité nommée** |
| **Version historisée** | `GET …/versions/1` publie `dureeMois: 18` — la route que le contrat annonçait sans la rendre |
| **Comparaison** | `baseHomogene: true` sur deux durées différentes, et **chaque scénario publie la sienne** (12 / 18) — l'écart n'est plus imputable à l'hypothèse par erreur |
