# STORY-468 : La durée de l'exercice de base n'est publiée nulle part — une croissance annuelle appliquée à un exercice de 18 mois

Status: in_progress

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

- [ ] AC-1 — `HypothesesBase` (et `AncresProjection`) portent `dureeMois` de l'exercice de base, lue du
      dossier (`dateDebut` / `dateCloture`), pas du libellé.
- [ ] AC-2 — Quand `dureeMois !== 12`, la réponse porte `baseAnnualisable: false` et **l'annualisation
      n'est pas faite en silence** : soit le moteur annualise et le **déclare**, soit il refuse — le PO
      tranche, mais le silence n'est pas une option.
- [ ] AC-3 — Le cas `dureeMois` inconnue (dossier sans dates) rend `null` signalé.
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
