# STORY-479 : Le plan de trésorerie n'a aucune date : douze parts égales, ni acomptes d'impôt, ni saisonnalité

Status: done

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 8 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-036** (projection 3 ans, trésorerie 12 mois, scénarios comparés), 2026-08-27.
Relevé en balayant 576 jeux d'hypothèses sur le moteur mensuel transcrit, puis en confrontant le résultat aux échéances du paquet fiscal.

---

## Le fait

`ProjectionMensuelleService` répartit les charges, les investissements, le financement et les
remboursements par `partition()` — une **division entière exacte en douze parts égales**. Sur le
dossier de démonstration, les décaissements de charges valent 232 116 pendant huit mois puis 232 115
les quatre derniers : **deux valeurs distinctes sur douze, et l'écart est un reste de division**.

Le modèle ne connaît donc **aucune date**. En particulier :

- Les **quatre acomptes provisionnels** que le paquet fiscal publie déjà — `31-01`, `31-05`, `31-07`,
  `31-10` (Art. 114-116 CGI) — n'apparaissent nulle part. C'est le seul calendrier fiscal structuré
  dont dispose le produit, et le plan de trésorerie l'ignore.
- Aucune **saisonnalité** n'est exprimable. Pour un distributeur — le profil du dossier de
  démonstration — c'est la structure même de son année.

**Conséquence mesurée.** Sur **576** jeux d'hypothèses balayés (croissance, marge, charges et délai
clients croisés), le `moisTresorerieMinimale` publié par la comparaison tombe **toujours** dans les
quatre premiers mois ou au douzième — **jamais entre le cinquième et le onzième**. Un creux d'été est
**structurellement impossible** dans ce modèle : l'indicateur « mois de trésorerie minimale » n'est
donc pas une prévision, c'est un artefact du lissage.

## Critères d'acceptation

- [x] AC-1 — Le jeu d'hypothèses accepte un **profil de saisonnalité** optionnel : douze poids dont la
      somme vaut 100 (ou 12 coefficients de 1). Absent ⇒ répartition uniforme, **comme aujourd'hui**,
      et la réponse dit lequel des deux a servi.
- [~] AC-2 — Les décaissements d'impôt suivent les échéances du **paquet fiscal du dossier**
      (`acomptesProvisionnels.echeances`) plus le solde — dépend de **STORY-458**.
- [x] AC-3 — L'articulation `Σ mensuel = annuel` reste une **identité** quel que soit le profil : la
      partition pondérée doit conserver la garantie « aucune unité mineure perdue » de `partition()`.
- [x] AC-4 — La réponse publie `repartition: 'uniforme' | 'saisonniere'` — un plan lissé qui ne se
      déclare pas se lit comme une prévision.
- [x] AC-5 — Test de non-régression du balayage : avec un profil saisonnier, `moisTresorerieMinimale`
      doit pouvoir tomber en juillet.

---

## ⚡⚡ La prémisse mesurée de la fiche a été RENDUE FAUSSE par STORY-458

La fiche annonce, sur 576 jeux : « `moisTresorerieMinimale` tombe **toujours** dans les quatre
premiers mois ou au douzième — **jamais** entre le cinquième et le onzième ». Rejoué sur la
**même grille** (croissance × marge × charges × délai clients = 4 × 4 × 6 × 6 = 576) contre le
moteur **du dépôt** :

| Configuration | Mois du creux atteints |
|---|---|
| Avec le paquet fiscal (4 acomptes) | `1, 2, 3, **10**, 12` |
| Sans paquet fiscal | `1, 2, 3, **6**, **8**, 12` |

⛔ **Le mois 10 est une échéance d'acompte** (31-10, Art. 114 CGI), livrée par **STORY-458** après
la rédaction de la fiche le 2026-08-27. « Structurellement impossible » est donc faux tel quel.

⛔ **Le constat de fond n'en est pas affaibli, il devient plus précis** : le creux du plan lissé
est dicté par le calendrier **FISCAL** ou par un bord arithmétique — **jamais par l'activité de
l'entreprise**. C'est ce que la story corrige, et c'est cette formulation-là qui est gardée par
AC-5.

## Décisions de cadrage

- **D-479-1 — le profil porte sur les QUATRE séries que la fiche nomme** : charges
  d'exploitation, investissements, financement, remboursements. Ce sont celles qui entrent
  **directement** dans `fluxNet`, sans passer par un échéancier bouclé.

- **D-479-2 — les PRODUITS et le COÛT DES VENTES gardent l'étalement uniforme, et c'est MESURÉ.**
  Les pondérer était la tentation naturelle : c'est bien l'activité qui est saisonnière. Mais
  `echeancierDelai` **boucle sur l'encours de clôture NORMATIF** — `assiette × délai/360` — qui
  suppose une production uniforme, et il déverse l'écart sur le **dernier mois**.

  *Mesuré, profil de distributeur (novembre 18 %, décembre 22 %), délai clients 30 jours :
  `encaissementsClients` du mois 12 passe de **9 166 665** à **34 833 333** — plus que la
  production de n'importe quel mois de l'année.* Un encaissement qui ne correspond à **aucun
  échéancier client** : exactement le défaut que STORY-469 a dû fermer (mois 12 à −733 335).

  ⛔ **Et il n'est pas corrigeable dans cette story** : rendre l'encours de clôture cohérent avec
  le profil obligerait le moteur **annuel** à connaître la saisonnalité, alors qu'il projette
  trois exercices sans granularité mensuelle. `ecartArticulation` cesserait d'être nul.
  ⚠️ C'est le sujet voisin de **STORY-480** (l'apurement de l'encours d'ouverture).

- **D-479-3 — AC-2 est DÉJÀ livré pour sa moitié « échéances », et sa moitié « solde » est HORS
  PÉRIMÈTRE.** Les décaissements d'impôt suivent les échéances du paquet fiscal depuis
  **STORY-458** (`repartirSurEcheances(impotDuN1, moisAcomptes)`). En revanche le **solde** — le
  cinquième versement — n'existe nulle part, et **le référentiel ne le publie pas** : le paquet
  ne porte que `acomptesProvisionnels.echeances` avec quatre dates. Même situation que
  `tva.declaration` en STORY-478, et même traitement : **tracé, pas fait**.

- **D-479-4 — `'UNIFORME' | 'SAISONNIERE'` en majuscules**, contre la casse minuscule que la
  fiche écrit. Les quatre unions littérales déjà publiées par ce module — `SourceTauxTva`,
  `MotifTva`, `AssietteMfpSource`, `MotifImpotAbsent` — sont toutes en `SCREAMING_SNAKE`. Une
  cinquième en minuscules serait la seule de son espèce.

- **D-479-5 — le moteur est FAIL-CLOSED sur le profil, pas seulement le DTO.** `hypotheses` est
  un chemin **Mixed** : un jeu enregistré avant la story peut porter n'importe quoi. Un profil
  inexploitable retombe sur l'uniforme et le **publie** (`repartition: 'UNIFORME'`), plutôt que
  de lever — un plan de trésorerie est une **lecture**, et refuser de projeter un jeu déjà
  enregistré le rendrait inconsultable.

## Progress Tracking

**Inclus** — `bilan-service` uniquement, un seul dépôt.

**Hors périmètre, déclaré** — le **solde** d'impôt d'AC-2 (le référentiel ne publie aucune
échéance de solde) et la saisonnalité de la **production** (D-479-2, mesurée).

### Ce que la story livre

| Élément | Où |
|---|---|
| `partitionPonderee(valeur, poids)` — partition entière exacte par plus fort reste | `projection-mensuelle.service.ts` |
| `profilSaisonnalite(brut)` — résolution **fail-closed** du profil | idem |
| `profilSaisonnaliteMensuel?: number[] \| null` | `hypotheses.schema.ts` + `HypothesesDto` |
| `repartition` et `profilSaisonnalite` publiés | `ProjectionMensuelle` + son DTO |
| `MODELE_PROJECTION_VERSION` | `1.8.0` → **`1.9.0`** |

### ⚡ Un comparateur retiré parce qu'il ne gardait rien

`partitionPonderee` triait les restes par `b.fraction - a.fraction || a.mois - b.mois`. La
mutation qui supprime le second terme laisse la batterie **entièrement verte** :
`Array.prototype.sort` est **stable depuis ES2019**, donc les égalités conservaient déjà l'ordre
des mois. Un comparateur qui ne discrimine jamais est une fausse assurance — même constat qu'en
STORY-421. Il est retiré, et la propriété qui compte reste gardée ailleurs, pour de bon : à poids
égaux, la fonction rend **exactement** `partition`.

### Portes de qualité

| Porte | Résultat |
|---|---|
| Lint | 0 warning |
| Build | OK |
| Unitaires + couverture | 2 347 verts, seuils 65/90/90/90 tenus |
| End-to-end | 714 verts sur 23 suites |
| Mutations | **12 sur 12 rouges** |

| # | Mutation | Verdict |
|---|---|---|
| N1 | le profil n'est plus appliqué aux charges | ROUGE |
| N2 | le profil n'est plus appliqué aux investissements | ROUGE |
| N3 | `repartition` forcée à `UNIFORME` | ROUGE |
| N4 | le reste de la partition pondérée est jeté (somme fausse) | ROUGE |
| N5 | les poids ne sont plus normalisés (arrondi naïf) | ROUGE |
| N6 | fail-closed : douze zéros acceptés | ROUGE |
| N7 | fail-closed : longueur du profil non vérifiée | ROUGE |
| N8 | fail-closed : poids négatifs et non finis acceptés | ROUGE |
| N10 | le profil est appliqué AUSSI aux produits (pic de décembre) | ROUGE |
| N11 | le profil n'est plus appliqué au financement | ROUGE |
| N12 | le profil n'est plus appliqué aux remboursements | ROUGE |
| N13 | `profilSaisonnalite` publié mais jamais appliqué | ROUGE (6) |

⚠️ **N9 retirée du tableau** : elle mutait un comparateur de départage qui ne gardait rien
(`sort` stable depuis ES2019). Plutôt que de la conserver comme mutation survivante, le
comparateur lui-même a été **supprimé** — une ligne qui ne discrimine jamais est une fausse
assurance.

⚠️ Un échec e2e transitoire a été observé : il venait de mon propre script de mutations, qui
modifiait les sources **pendant** que la suite tournait. Le rejeu machine libre est vert
(714/714).

## Revue de sécurité — 1 vulnérabilité, corrigée avant merge

### ⚡⚡ V-1 — douze poids FINIS produisaient des montants `null` en HTTP 200

`1e308` et `Number.MAX_VALUE` sont des nombres **finis et positifs** : ils traversaient
`@IsNumber()` et `@Min(0)`, étaient persistés sous un chemin `Mixed`, et faisaient déborder la
répartition pondérée. **Deux chemins de casse distincts** :

| Profil saisi | Ce qui déborde | Résultat |
|---|---|---|
| douze poids à `1e308` | `total = Σ poids = Infinity`, puis `Infinity / Infinity` | `NaN` sur les 12 mois |
| `[Number.MAX_VALUE, 1, …]` | le **produit** `valeur × poids`, **avant** la division | `Infinity` sur le mois 1 |

Mesuré de bout en bout sur le commit poussé : `fluxNet: null`, `tresorerieCloture: null`,
`articule: false`, et la comparaison publiant `moisTresorerieMinimale: 0` — **un mois qui n'existe
pas** — avec `moisTresorerieNegative: 0`, c'est-à-dire « aucun mois de trésorerie négative » sur
un plan qui n'a rien calculé.

⛔ **Sur un indicateur de risque de cessation de paiements, et du côté faussement rassurant.**
C'est le patron exact que `forme-hypotheses.ts` documente depuis STORY-457. Un seul
empoisonnement stocké corrompt le plan servi à **tous** les collaborateurs du dossier, et les
exports remis à un banquier.

**Trois gestes, les trois nécessaires** — et le premier seul était **insuffisant**, la revue l'a
mesuré : `[1e308, 1, …]`, dont la somme *est* finie, produisait encore `Infinity`.

1. `profilSaisonnalite` exige une somme **finie**, pas seulement positive.
2. `partitionPonderee` **normalise avant de multiplier**. Sous cette forme le débordement est
   *impossible*, et c'est démontrable : tous les poids sont `>= 0` et `total` est fini
   strictement positif, donc chaque ratio tient dans `[0, 1]`.
3. `@Max(BORNE_POIDS_SAISONNALITE)` à la porte : le champ était le **seul** champ numérique du
   DTO sans borne haute.

⚠️ **Le champ n'est PAS ajouté à `exigerFormeCourante`** : cette garde **lève**, et un profil
inexploitable ne rend pas la projection incalculable — il retombe sur l'uniforme et le plan le
**publie**. Refuser de projeter un jeu déjà enregistré le rendrait inconsultable.

**Les six autres axes de la revue sont propres.** Un tableau de 10 millions d'éléments est rejeté
en 0,126 ms (la longueur est testée en première instruction) ; la validation couvre les deux
chemins d'écriture à l'identique ; aucun chemin ne fait fuiter le profil d'un tenant vers un
autre. Trois mutations supplémentaires (N14, N15, N16) gardent désormais les deux corrections :
**15 sur 15 rouges**.

## Revue de code — 7 constats, aucun bloquant

Tous corrigés. Les portes ont été rejouées par la revue elle-même sur le commit poussé : lint 0,
build OK, 2 349 unitaires (couverture 99,04 / 94,74 / 99,32 / 99,08), 714 e2e.

### ⚡⚡ C-1 — le chemin d'ÉCRITURE du profil n'était gardé par RIEN

Mutation appliquée par la revue : **supprimer purement et simplement la propriété du DTO** laisse
la compilation verte, **576 unitaires verts et 714 e2e verts** — alors que, `whitelist` et
`forbidNonWhitelisted` étant actifs, **tout `POST`/`PUT` portant un profil rendrait 400 « property
should not exist »**. Le champ cesserait d'être saisissable et rien ne le dirait. Aucun test ne
postait jamais un profil : la seule occurrence l'injectait **en aval** du DTO.

C'est le contraire du patron que le dépôt applique à tous les autres champs facultatifs
(`tauxTvaPct`, `investissementsParExercice`, les délais BFR ont chacun leur 201 + relecture, leurs
400 hors borne, et leur `not.toHaveProperty` d'absence).

### ⚡ C-2 — la borne ajoutée par la revue de sécurité n'était pas dans le CONTRAT

`@Max(1 000 000)` validait, mais le schéma publié disait `items: { type: 'number', minimum: 0 }`
— **sans `maximum`**. Or ce fichier porte trois fois la doctrine contraire : « la borne est une
clause du CONTRAT, pas une phrase de description ». Un client généré laissait partir un poids de
`1 000 001` — le montant collé à la place d'un poids, le mode d'erreur que la borne existe pour
attraper — et recevait un **400 que le schéma ne prédisait pas**.

### ⚡⚡ C-3 — mon docblock répétait la prémisse que la story venait de démentir

Le docstring de `repartition` affirmait encore « jamais entre le cinquième et le onzième », alors
que la description publiée du même commit, la batterie du même commit et la fiche disent tous que
le creux atteint le mois 10. Le docblock du champ **est** le point d'entrée du prochain
développeur : il y aurait lu qu'un creux au mois 10 est impossible et conclu à une régression.

### ⚡ C-4 — la comparaison ne publiait pas la répartition, et le contrat prétendait le contraire

`moisTresorerieMinimale` — l'indicateur dont **toute la fiche parle**, et sur lequel AC-5 est
écrit — n'existe que sur la route de comparaison. Deux scénarios comparés, l'un saisonnier et
l'autre uniforme, affichaient deux creux non comparables sans que rien ne le dise. Et le
paragraphe de version 1.9.0 recopié dans ce DTO affirmait déjà que la réponse publie
`repartition`. La comparaison la publie désormais par scénario.

### ⚡ C-5 — l'export imprimait douze mois sans déclarer son découpage

Les cinq stories précédentes ont chacune ajouté une ligne qualitative au bloc `meta` de l'export,
sous le même argument. Un PDF remis à une banque imprimait un creux qui peut être un artefact du
lissage, sans que la pièce le dise.

### ⚡⚡ C-6 — AC-5 nomme JUILLET, ma batterie ne montrait qu'AOÛT

Mesuré : avec le profil `ETE` de la story, le creux tombe aux mois `{1, 3, 8, 9, 10}` — **le mois
7 sort 0 fois sur 576**. La capacité existe, mais aucun test ne la démontrait, et le cas nominal
était pincé par une bande `>= 6 && <= 9` **quatre fois plus large** que la valeur mesurée. Un
profil réellement dominé par juillet fait tomber le creux au mois 7 **452 fois sur 576** ; la
bande est remplacée par la valeur exacte.

### ⚡ C-7 — `every` saute les TROUS d'un tableau creux

`Array.prototype.every` et `reduce` **ne visitent pas les trous**. Un tableau dont une seule case
est renseignée traversait la garde *fail-closed*, et `partitionPonderee` rendait onze `undefined`
— `fluxNet` valait `NaN` sur onze mois. Inatteignable par HTTP (JSON n'a pas de trous), mais le
docstring promettait « douze nombres finis » : une garde qui ne tient pas sa propre promesse est
une fausse assurance. Remplacé par une boucle indexée.

⚠️ **La mutation qui ne révertait qu'une moitié du correctif est restée VERTE** : l'autre moitié
(la somme indexée) attrape le même cas par propagation de `NaN`. C'est la mutation de l'état
d'avant **en entier** qui mesure la garde — mutation N19, rouge.
