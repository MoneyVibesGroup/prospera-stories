# STORY-480 : L'apurement de l'encours d'ouverture en parts égales fabrique un pic d'encaissement

Status: done

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 5 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-036** (projection 3 ans, trésorerie 12 mois, scénarios comparés), 2026-08-27.
Relevé en rejouant `echeancierDelai()` mois par mois sur le dossier de démonstration et en regardant la série sortir.

---

## Le fait

`echeancierDelai()` apure l'encours d'ouverture (`bfrBase.creancesClients`) en **parts égales** sur
`⌊délai/30⌋ + 1` mois, puis y ajoute la production décalée.

Sur le scénario prudent (délai clients 60 jours), les **2 729 167 F** de créances d'ouverture sont donc
réglés en trois parts de ~909 722, et la production de janvier tombe au mois 3 — par-dessus la
troisième part :

| Mois | Encaissements clients |
|---|---|
| 01 | 909 723 |
| 02 | 909 722 |
| 03 | **2 342 535** |
| 04 à 12 | 1 432 813 (régime de croisière) |

Un **pic de 2,6 fois** le mois précédent, qui ne correspond à **aucun échéancier client**. Il ne vient
pas d'une prévision : il vient de la convention « on ne sait rien de l'antériorité des créances, donc
on les étale uniformément ».

C'est cette convention qui explique le balayage de **STORY-479** : les quatre premiers mois du plan
sont dominés par l'apurement, ce qui y confine tout creux de trésorerie.

Le produit **a** l'information : une balance âgée des comptes clients est dérivable de la balance
source, et l'antériorité réelle est ce qu'un cabinet regarde en premier.

## Critères d'acceptation

- [x] AC-1 — L'apurement de l'encours d'ouverture accepte un **profil d'antériorité** optionnel
      (`ancienneteCreances: { moins30, de30a60, de60a90, plus90 }` en pourcentages). Absent ⇒
      répartition uniforme, **comme aujourd'hui**.
- [x] AC-2 — La réponse publie l'origine de chaque mois d'encaissement :
      `{ apurementOuverture, productionPeriode }` — sans quoi le pic reste inexplicable pour qui lit
      le plan.
- [x] AC-3 — Le bouclage sur l'encours de clôture normatif est **conservé** : l'identité
      `Σ règlements = ouverture + production − clôture` ne doit pas être perdue (c'est elle qui rend
      `ecartArticulation === 0` pour tout jeu d'hypothèses).
- [x] AC-4 — Même traitement, et même AC, pour les **dettes fournisseurs**.

## Conséquences ailleurs

- Une balance âgée relève de `balance-service` : si elle n'est pas dérivable aujourd'hui, l'AC-1 se
  limite au profil **saisi**, et la dérivation automatique se trace à part.

---

## Le chiffrage de la fiche est REPRODUIT AU FRANC PRÈS

Rejoué le 2026-09-08 contre le moteur du dépôt, sur le dossier de démonstration
(`produitsBase 16 375 000`, croissance 5 %, délai clients 60 jours) :

```
enc = [909 723, 909 722, 2 342 535, 1 432 813, 1 432 813, …]
```

Le pic du mois 3, à **2,58 fois** le mois précédent, est exactement celui que la fiche décrit.
**Trois stories ont pourtant modifié le moteur depuis sa rédaction** — 469 (BFR en TTC), 478 (flux
de TVA), 479 (saisonnalité) — et aucune ne le déplace : l'échéancier reçoit les encours **hors
taxes**, la TVA est publiée en lignes séparées, et D-479-2 a laissé la production en étalement
uniforme.

⚡ **Le même pic existe côté FOURNISSEURS**, au même mois et au même facteur (×2,57). Les deux se
compensent partiellement dans `fluxNet`, ce qui rend l'artefact d'autant plus difficile à voir sur
le seul solde — et interdit de ne traiter qu'un seul côté.

## Décisions de cadrage

- **D-480-1 — l'antériorité décide du MOIS DE RÈGLEMENT, pas d'un poids arbitraire.** Une créance
  âgée de `a` jours sur un délai `D` est due dans `D − a` jours, donc au mois
  `⌈(D − a)/30⌉`. Une tranche **échue** (`D − a <= 0`) est encaissée dès le **premier mois** :
  c'est le seul comportement que les données autorisent à supposer.

- **D-480-2 — âges MÉDIANS de tranche** (15, 45, 75, 105 jours). Un profil dit une répartition,
  pas des dates : la borne basse avancerait systématiquement les encaissements d'un mois, la borne
  haute les retarderait. ⚠️ Ce choix n'était **gardé par rien** — la mutation qui le remplace par
  les bornes basses restait verte, les deux conventions coïncidant sur les délais multiples de 30.
  Un essai à **75 jours** les distingue désormais.

- **D-480-3 — la décomposition d'AC-2 est un BLOC, pas deux lignes de flux.**
  `apurementOuverture + productionPeriode` vaut **exactement** la ligne publiée. Les additionner à
  `fluxNet` compterait l'encaissement deux fois. C'est le patron de `chargesFinancieres`, dont
  seul le `total` entre dans le résultat pendant que sept champs le décomposent. Le docstring
  d'invariant de `PeriodeMensuelle` dit désormais explicitement que **la réciproque est fausse** :
  y figurer n'implique pas d'entrer dans `fluxNet`.

- **D-480-4 — le résidu de bouclage est imputé à `productionPeriode`.** Il vient de la production
  dont l'échéance dépasse l'horizon, pas de l'encours d'ouverture. L'imputer à l'apurement ferait
  apparaître, au mois 12, la liquidation d'un encours soldé depuis des mois — une décomposition
  qui ment.

- **D-480-5 — DEUX profils distincts, un par côté** (AC-4). Un cabinet peut être payé tard tout en
  payant ses fournisseurs à l'heure : `ancienneteCreances` et `ancienneteDettesFournisseurs` sont
  deux faits indépendants.

- **D-480-6 — les parts sont RELATIVES**, comme les poids de STORY-479 : leur somme n'a pas à
  valoir 100, `partitionPonderee` normalise. C'est aussi elle qui garantit
  `Σ parts === encoursOuverture` à l'unité près, donc **AC-3**.

## ⚠️ Deux affirmations de la fiche corrigées

- **« Une balance âgée est dérivable de la balance source » est FAUSSE en l'état.**
  `bilan-service` ne reçoit qu'une balance de **soldes** (`compte`, `soldeDebiteur`,
  `soldeCrediteur`), sans aucune date d'échéance ni lettrage ; `balance-service` n'en porte pas
  davantage. Le produit le sait déjà : la **Note 7** du référentiel, « Clients (antériorité des
  créances) », est publiée en mode `TRAME`, c'est-à-dire un cadre **à saisir**. AC-1 se limite
  donc au profil **saisi**, comme la section « Conséquences ailleurs » l'avait prévu.

- **Le découpage 30/60/90 n'est PAS celui de la Note 7 SYSCOHADA**, qui oppose « Créances non
  échues » à « Créances échues ». Les deux sont légitimes et différents : ce profil n'alimente pas
  la Note 7, et `plus90` n'est pas synonyme de « créances échues ». C'est écrit dans le contrat,
  sans quoi la prochaine story croira que c'est la même donnée.

## Ce que la mesure montre

| Profil d'antériorité saisi | Encaissements des trois premiers mois | Pic |
|---|---|---|
| aucun (parts égales) | 909 723 · 909 722 · **2 342 535** | ×2,58 au mois 3 |
| 70 % à moins de 30 jours | 818 750 · 1 910 417 · 1 432 813 | le mois 3 **retombe à la croisière** |
| 60 % à plus de 90 jours | **2 592 709** · 136 458 · 1 432 813 | tout rentre au mois 1 — les créances sont échues |

`ecartArticulation` vaut **0** dans les trois cas.

## ⚡⚡ Un chemin de plantage introduit, trouvé par ma propre mesure

`poidsApurement` fait `Array<number>(moisOuverture).fill(0)`. Or `moisOuverture` vient de
`⌊delaiBfrClientsJours/30⌋ + 1`, et **`delaiBfrClientsJours` n'est validé qu'à l'ÉCRITURE** : il ne
figure pas dans `exigerFormeCourante`, et `hypotheses` est un chemin **Mixed**. Un jeu écrit par un
script, une migration ou une version antérieure du DTO peut donc porter `NaN`.

*Mesuré : `Array(NaN)` lève « Invalid array length » — un **500** sur la simple lecture d'un plan
de trésorerie, là où le moteur d'avant la story dégradait en silence.*

⛔ **Troisième occurrence dans ce dépôt de la même leçon** (STORY-445, STORY-457, STORY-478) : une
fonction exportée **garde ses propres arguments**, elle ne s'en remet pas à son appelant. La garde
porte désormais aussi sur `moisOuverture` et `delaiJours`, et le repli reste les parts égales.

## Portes de qualité

| Porte | Résultat |
|---|---|
| Lint | 0 warning |
| Build | OK |
| Unitaires + couverture | 2 371 verts, seuils 65/90/90/90 tenus |
| End-to-end | 725 verts sur 23 suites |
| Mutations | **13 sur 13 rouges** |

| # | Mutation | Verdict |
|---|---|---|
| P1 | le profil de créances n'est plus lu | ROUGE |
| P2 | le profil de **dettes** n'est plus lu | ROUGE |
| P3 | le même profil sert aux deux côtés | ROUGE |
| P4 | âge médian remplacé par la borne basse | ROUGE *(VERTE au premier tour)* |
| P5 | tranche échue perdue au lieu d'aller au mois 1 | ROUGE |
| P6 | fail-closed : somme nulle acceptée | ROUGE |
| P7 | fail-closed : parts négatives acceptées | ROUGE |
| P8 | le résidu de bouclage imputé à l'**apurement** | ROUGE |
| P9 | partition uniforme malgré un profil | ROUGE |
| P10 | la décomposition ne somme plus au total | ROUGE |
| P11 | les tranches sont lues dans le désordre | ROUGE |
| P12 | garde des arguments numériques retirée (500 sur un délai `NaN`) | ROUGE |
| P13 | borne basse de `moisOuverture` retirée | ROUGE |

⚠️ **P9 avait d'abord rougi par ERREUR DE COMPILATION**, ce qui ne prouve rien : elle a été
réécrite pour muter le comportement sans casser le typage.

⚠️ **P4 était VERTE au premier tour** : les âges médians et les bornes basses coïncident sur tous
les délais multiples de 30, ceux que les autres essais employaient. Un essai à **75 jours** les
distingue.

## Revue de sécurité — 0 vulnérabilité

Les sept axes instruits, la plupart **par mesure** contre `dist/` reconstruit. Le mode de panne de
STORY-479 — débordement, puis `fluxNet: null` sous un type non nullable en HTTP 200 — **n'est pas
rejoué**, et pour une raison **structurelle** : chaque poids est une somme partielle de parts
`>= 0`, donc si le total est fini, toute cellule l'est ; et `partitionPonderee` normalise avant de
multiplier. La garde est suffisante, pas suffisante par chance.

### ⚠️ Une correction à ma propre justification

Mon message de commit affirmait qu'« une version antérieure du DTO » pouvait avoir laissé passer un
délai `NaN`. **C'est faux, et la revue l'a vérifié** : la version initiale du DTO (STORY-068) porte
déjà `@IsInt() @Min(0) @Max(3650)` — la borne basse **n'a jamais manqué** — et les trois écrivains
(création, édition, duplication) passent tous par la même classe. Le `RangeError` que je fermais
n'était donc **atteignable par aucune requête ni aucun document légitime**.

⛔ Le durcissement reste **juste**, mais c'est de la **défense en profondeur**, pas la fermeture
d'une faille. La différence compte : une fonction exportée garde ses arguments parce que le
prochain appelant n'est pas connu, pas parce que l'appelant actuel serait défaillant.

### Un défaut pré-existant relevé, hors périmètre

`normaliserEcheanciers` ne nettoie que les quatre champs d'échéancier. `tauxTvaPct`,
`profilSaisonnaliteMensuel` et désormais les deux profils d'antériorité sont **persistés `null`**
là où le `POST` omettait la clé — le `GET` suivant les rend donc `null`. Sans effet de calcul, mais
c'est le défaut mesuré en docker sur STORY-460, jamais généralisé depuis.

### Un couplage latent, signalé et documenté

La garde `moisOuverture > NOMBRE_MOIS` compare à la **constante du module**, pas à
`partsMensuelles.length`. Les deux valent 12 aujourd'hui ; un futur horizon à 24 mois — c'est le
sujet de **STORY-481** — ferait retomber l'apurement sur les parts égales **en silence**.

## Revue de code — 2 bloquants levés, 10 constats traités

### B1 et B2 — deux bloquants d'ÉTAT, pas de code

**B1** annonçait le lint rouge sur `anteriorite.spec.ts`. **B2** annonçait que le correctif du 500
n'était pas dans la PR. Les deux étaient vrais **au moment de la mesure** et faux quand le rapport
est arrivé : la revue a tourné pendant que je corrigeais. Vérifié moi-même sur l'état final —
`LINT=0`, et `origin/MNV-480` porte bien les deux commits.

⚠️ **Symétrique exact du constat C-1 de STORY-478** : là c'était moi qui déclarais une porte
mesurée trop tôt ; ici c'est la revue. Une mesure ne vaut que pour l'octet qu'elle a lu.

### ⚡⚡ N1 — le repli était SILENCIEUX, et la story d'avant avait déjà résolu le problème

Un profil dont les quatre parts valent `0` est **accepté** à l'écriture — chaque part respecte
`0 <= p <= 100` — puis rejeté par le moteur, qui retombe sur les parts égales. Le plan servi
devenait alors **au centime identique** à un plan sans profil, pendant que la description publiée
de `origineEncaissements` affirmait « réglées selon leur antériorité ».

⛔ **STORY-479, une story plus tôt, publiait `repartition` exactement pour ça.** J'avais repris son
mécanisme sans reprendre son signal. La réponse publie désormais
`apurement: { creances, dettes }` — `ANTERIORITE` ou `PARTS_EGALES`, **un verdict par côté**.

### ⚡ N2 — « traité côté moteur, en fail-closed » était FAUX

Le moteur ne ferme rien sur la somme des parts : il **normalise**. Une saisie 40/30/20/5 — somme
95, un oubli — est acceptée puis re-échelonnée en 42,1/31,6/21,1/5,3, **sans erreur et sans
signal**. La phrase était un copier-coller de celle de STORY-479, dont le sujet (`somme > 0`) est
bien fail-closed, contrairement à celui-ci. Le contrat dit désormais que les parts sont des poids
**relatifs**, et que `@Max(100)` est un garde-fou de **saisie**, pas une contrainte de somme.

### ⚡⚡ N3 — l'essai qui NOMMAIT AC-2 était VACANT

`total` est *calculé* comme `apurementOuverture[m] + productionPeriode[m]` : l'assertion qui
vérifiait cette égalité **ne pouvait pas échouer**. Prouvé par mutation — en supprimant toute
contribution de l'apurement, c'est-à-dire en détruisant le livrable de la story, l'essai restait
**VERT**, et sa seconde assertion aussi, parce que le résidu du mois 12 absorbe exactement ce que
l'apurement cesse d'imputer. Réécrit sur deux invariants réels : `Σ apurementOuverture` vaut
l'encours d'ouverture, et l'apurement est nul au-delà de son horizon.

### ⚡ N4 — deux profils PROPORTIONNELS étaient déclarés divergents

Le module pose sa propre règle : « ce que la comparaison doit regarder, c'est la valeur que le
**moteur** utilise, jamais la forme écrite en base ». Or le moteur normalise les poids par leur
somme : `40/30/20/10` et `4/3/2/1` décrivent le **même** plan. L'écran dont la raison d'être est
d'expliquer l'écart nommait un paramètre qui n'en explique aucun, et `groupesIdentiques` ratait un
doublon réel.

⚠️ **Le même défaut valait pour `profilSaisonnaliteMensuel` depuis STORY-479** : ne corriger que
l'occurrence de STORY-480 aurait laissé deux comportements contradictoires dans le même calcul.
La normalisation canonise aussi l'**ordre des clés**, ce qui ferme du même geste la fausse
divergence qu'une écriture hors DTO pouvait provoquer.

### ⚡ N5 — un commentaire devenu faux, qui portait une justification

« Aucun paramètre d'hypothèses n'est aujourd'hui un objet nu — le cas est donc défensif » : les
deux profils d'antériorité **sont** des objets nus, et cette branche est désormais empruntée.

### ⚡ N6 — aucun filet sur le contrat d'ENTRÉE

`grep -rn "anciennete" test/` ne rendait **aucun résultat**. `collectCoverageFrom` exclut les
`*.dto.ts` : retirer le `@Type()`, les quatre `@Max` ou les bornes des `@ApiProperty` laissait
2 373 unitaires et 725 e2e **verts** pendant que le contrat cessait de borner les parts. Même
défaut que le C-1 de STORY-479, et même correctif.

### ⚡ N7 — deux assertions à 10⁻⁶ de leur tolérance

Le ratio du pic vaut **2,575 des deux côtés** ; il était asserti contre `2.58` d'un côté et `2.57`
de l'autre, à `toBeCloseTo(…, 2)` — soit à la limite exacte, dans des sens opposés. Une unité de
dérive rougissait l'essai avec un message sans rapport avec la propriété gardée. Remplacé par les
montants entiers exacts et un seuil franc.

### ⚡⚡ N9 — ma justification était plus étroite que l'effet : le profil peut DÉPLACER le pic

*Mesuré, portefeuille jeune (70 % à moins de 30 jours) mais délai clients de **90** jours : le pic
passe de **2 456 250** au mois 4 à **2 865 625** au mois 3 — **17 % plus haut**.*

⛔ C'est **arithmétiquement juste** : une créance de quinze jours à quatre-vingt-dix jours de terme
est due au mois 3. Mais mes trois docstrings présentaient uniformément le profil comme *le remède
au pic*, sur la foi du seul cas à 60 jours. Ce que la story livre est une **date**, pas une
atténuation — et c'est ce que le contrat dit maintenant.

### N10 — porté en dette

Deux antériorités des créances coexistent dans le service sans rapprochement : le profil saisi
dans les hypothèses, et la **Note 7** SYSCOHADA remplie à la main dans la liasse. Elles peuvent se
contredire sur le même dossier sans qu'aucun contrôle ne les confronte.
