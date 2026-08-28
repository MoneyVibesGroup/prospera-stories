# STORY-553 : Un seuil d'alerte est une donnée de référentiel versionnée — jamais une constante de code

Status: ready-for-dev

**Épic :** EPIC-014 — Consultation & export — `bilan-service`
**Service :** `bilan-service` (`:3004`) — `modules/bilan/referentiel`, `modules/bilan/analyse`
**Points :** 5 · **Sprint :** S20
**Prérequis :** **STORY-552** (les indicateurs eux-mêmes) — cette story n'a aucun objet sans elle.
**Origine :** lecture du corpus pédagogique `Image_lecons` (2026-08-28) — les tableaux
« Références des valeurs (repères indicatifs) » des posters d'analyse, et le tableau
**« 15 ratios clés et leurs seuils critiques »**.
**Réf. code :** `modules/bilan/referentiel/assets/*.json` (5 paquets versionnés + checksum) ·
`bilan-engine.service.ts` (résolution du paquet)

---

## Le fait

Le corpus livre ses seuils sous une forme qui invite à les recopier :

| Indicateur | Très bon | Bon | Acceptable | Risqué |
|---|---|---|---|---|
| Ratio d'endettement | < 40 % | 40–60 % | 60–80 % | > 80 % |
| Autonomie financière | > 50 % | 30–50 % | 20–30 % | < 20 % |
| Capacité de remboursement | > 5 | 3–5 | 2–3 | < 2 |
| DSO | < 30 j | 30–60 j | 60–90 j | > 90 j |

⛔ **Aucun de ces seuils ne porte de secteur, de pays ni d'année.** Un DSO de 75 jours est une
alarme pour un commerce de détail et une normalité pour un fournisseur de l'État togolais. Une
autonomie financière de 25 % est fragile pour une PME et **réglementée** pour une institution de
microfinance, où le ratio de capitalisation est un minimum imposé par la BCEAO.

⇒ **Écrits en dur, ces seuils feraient de Prospera une source d'alertes fausses** — et une
alerte fausse coûte plus cher que pas d'alerte : elle apprend à ne plus regarder.

## Pourquoi c'est une story et pas une ligne de configuration

Le produit a déjà résolu ce problème une fois, et bien. Les référentiels comptables vivent en
**paquets versionnés, packagés, checksummés** (`syscohada-revise@2.1`, `sfd-bceao@2.0`,
`cima-assurances@1.0`, `zone-franche-togo@1.0`), et toute liasse cite le paquet qui l'a produite.
C'est ce qui rend une liasse **reproductible** — l'exigence NFR-003.

Un seuil d'alerte a exactement les mêmes propriétés :

- il **change** (une loi de finances, une instruction BCEAO, une révision sectorielle) ;
- il doit être **daté et opposable** — « votre dossier était en zone rouge selon les repères de
  2026 » n'a de sens que si l'on sait ce qu'étaient ces repères ;
- il ne doit **jamais** rendre un diagnostic passé irreproductible.

⇒ **Le seuil suit le référentiel, pas le déploiement.** Un seuil dans le code change à chaque
livraison, en silence, et rend faux tous les diagnostics déjà rendus.

⚠️ **Précédent interne, et il est cher.** `zone-franche-togo@1.0` est packagé, chiffré et sourcé
depuis le 2026-07-21, et **aucun dossier ne peut le sélectionner** faute d'un axe d'accès
(STORY-496). La règle qui en est sortie — *un artefact livré sans chemin d'accès coûte autant
qu'un artefact absent* — vaut ici : des seuils packagés sans axe **secteur** seraient inertes.

## Périmètre

**Inclus**

- Un bloc `seuils` dans le paquet de référentiel, versionné et couvert par le **checksum**
  existant. Aucune nouvelle mécanique de packaging : le paquet en porte déjà cinq.
- Structure d'un seuil : `{ indicateur, bornes[], sens, source, applicableA }` —
  - `bornes[]` : les intervalles nommés, pas un scalaire ;
  - `sens` : `PLUS_HAUT_MIEUX` ou `PLUS_BAS_MIEUX` — sans lui, le service ne sait pas de quel
    côté est le rouge ;
  - **`source` : obligatoire et non vide.** Un seuil sans provenance n'est pas opposable, et
    c'est le défaut exact du corpus.
  - `applicableA` : l'axe de discrimination — a minima le **secteur**, sans quoi le bloc est
    inerte (précédent `zone-franche-togo`).
- La réponse d'analyse (STORY-552) publie, pour chaque indicateur, **le seuil appliqué et sa
  source**, pas seulement le verdict de couleur.
- **Un indicateur sans seuil déclaré rend sa valeur sans verdict** — et le dit. C'est le
  comportement par défaut, et il est correct : un chiffre sans jugement vaut mieux qu'un jugement
  sans fondement.

**Hors périmètre**

- Peupler les seuils réels par secteur. C'est un travail de **sourcing** (BCEAO, OTR, études
  sectorielles UEMOA) qui a sa propre nature et son propre calendrier — comme l'a été le paquet
  fiscal Togo. Cette story livre le **contenant** et la garde ; le premier paquet peut ne porter
  qu'un jeu « repères généraux » explicitement marqué comme tel.
- Les seuils **réglementaires** de microfinance et d'assurance (ratios prudentiels BCEAO, marge
  de solvabilité CIMA). Ce ne sont pas des repères d'analyse mais des obligations, avec leurs
  propres stories (**STORY-524**) et leurs propres conséquences.
- Toute personnalisation par cabinet ou par dossier. Un seuil qu'un utilisateur peut déplacer
  n'alerte plus.

## Critères d'acceptation

1. Un paquet **sans** bloc `seuils` reste valide et se charge : les quatre référentiels packagés
   ne sont pas cassés par cette story.
2. Un seuil dont la `source` est absente ou vide **fait échouer la validation du paquet** au
   packaging — pas à l'exécution.
3. Un indicateur sans seuil applicable rend `{ valeur, verdict: null, motif: "aucun repère
   déclaré pour ce secteur" }` — jamais un verdict par défaut.
4. La réponse d'analyse publie `seuilApplique: { bornes, source, referentiel, version }` : le
   diagnostic est refaisable à l'identique par un tiers.
5. Le `checksum` du paquet change quand les seuils changent — témoin que le bloc est bien sous
   la garantie de reproductibilité existante.
6. Deux paquets de versions différentes portant des seuils différents rendent des verdicts
   différents sur la **même** liasse, et chacun cite sa version. C'est le témoin que le seuil ne
   vient pas du code.

## Notes

- ⚡ **La leçon est la même que celle du plan comptable du corpus** : une donnée normative
  crédible mais non sourcée est plus dangereuse qu'une donnée absente. Les fiches SYSCOHADA du
  corpus publient des numéros du plan **français** avec l'autorité du gras et de la mise en page.
  Un seuil en dur dans le code a exactement cette autorité-là, et la même absence de fondement.
- ⚠️ **Ne pas confondre repère et règle.** Les bornes de cette story colorent un chiffre pour
  aider à lire ; elles ne bloquent aucune validation de liasse. Les contrôles bloquants restent
  les quatre de `controles-coherence` — un ratio n'en devient jamais un cinquième.
