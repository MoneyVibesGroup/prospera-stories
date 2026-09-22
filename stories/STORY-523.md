# STORY-523 : États annuels CIMA (art. 433) — une trentaine d'états, pas une liasse

Status: done

**Épic :** EPIC-134 — États annuels CIMA et marge de solvabilité
**Service :** `assurance-service` + `bilan-service`
**Points :** 13 · **Sprint :** S20
**Complexité :** high
**Prérequis :** **STORY-521** (les trois comptes de résultat) — `done`
**Origine :** découpage `epics-assurance-2026-08-27.md`, **AD-10** de la spine.

---

## Le fait

L'article **433 du code CIMA** publie les **états modèles**. Ce n'est pas une liasse de quatre
états : c'est une **trentaine d'états annexes** (répartition des primes, sinistres par branche et
par exercice de survenance, placements, réassurance, engagements réglementés…). L'analyse du
2026-07-21 les a explicitement mis **hors amorce**.

⛔ **C'est ici que l'écart de promesse se referme ou explose.** Un assureur à qui l'on vend « le
bilan CIMA » comprend **la liasse réglementaire**, c'est-à-dire ces états-là — pas un bilan et un
compte de résultat.

## ✅ TRANCHÉ PAR LE PO — 2026-08-28 : **VOIE A**, le produit dépose

⇒ **Le jalon `format confirmé` devient la story elle-même** : tant que les gabarits de l'art. 433
ne sont pas au dépôt, il n'y a rien à chiffrer.

---

# ⛔ JALON `format confirmé` — LEVÉ le 2026-09-22

**Les gabarits sont au dépôt.** Relevé sur le texte officiel de l'article 433 (*États modèles*),
**3 757 lignes utiles, 50 blocs d'en-tête**, croisé avec les articles **422** (liste annuelle
faisant autorité), **422-1** (états de groupe), **422-2** (intermédiaires) et **425** (régime de
dépôt). Aucun état de la liste de l'art. 422 n'est sans gabarit — **sauf un**, et c'est le constat
M3.

---

## Les constats mesurés

### M1 — La liste annuelle faisant autorité est l'art. 422, et elle compte 18 états + 4 comptes

> **Art. 422** — « Outre les comptes prévus par ailleurs au plan comptable, notamment : le bilan
> établi selon le compte 89 ; le compte d'exploitation générale établi selon le compte 80 ; le
> compte général de pertes et profits établi selon le compte 87 ; le compte des résultats en
> instance d'affectation établi selon le compte 88, **les entreprises doivent établir chaque année
> les états suivants** : C1, C4, C5, C9, C10, C10a, C10b, C10c, C10d, C11, C20, C21, C25,
> C25 Bis (tableaux A et B), C26, RA1, RA2. »

⇒ **Le sous-ensemble déposable ne se choisit pas « par la valeur perçue »** : il est écrit. C'est
la réponse de la voie A à Q1.

### M2 — Deux états portent **deux modèles alternatifs**, pas deux colonnes

Le **compte 80** (déjà traité en STORY-521) **et l'état C1** :

> « L'état C1 établi par les entreprises d'assurances **sur la vie** comporte en colonnes les
> catégories concernées de l'article 411… »
> « L'état C1 établi par les entreprises d'assurances **en dommage** comporte… »

⇒ Même règle qu'au compte 80 : l'**art. 326 al. 3** interdit de pratiquer les deux, donc `C1_VIE`
et `C1_DOMMAGES` sont **alternatifs**. `deriverAgrement()` de STORY-521 les arbitre sans une ligne
de logique nouvelle.

### M3 — ⛔⛔ L'état **C11 n'a aucun gabarit, et n'en aura jamais**

> **Art. 433** — « **La présentation de l'état C11 est laissée à l'initiative de chaque
> entreprise.** »

C'est la **seule** occurrence de cette formule dans tout l'article 433 : 2 lignes là où le C4 en a
**139** et le C10 en a **469**.

⚡ **Conséquence sur la garde elle-même.** Le jalon dit « aucune ligne de code avant d'avoir les
**gabarits** officiels en main ». Appliqué littéralement au C11, il **bloque pour toujours** : le
régulateur a délégué la forme. Or le **contenu** du C11 est, lui, entièrement normé — art. **337-1**
(éléments constitutifs), **337-2** (montant minimal IARD), **337-3** (montant minimal vie),
**337-4** (sociétés mixtes).

⇒ **D-523-3 reformule la garde** : *gabarit imposé **ou** norme de contenu identifiée*. Un état à
forme libre n'est pas un état non spécifié.

### M4 — Les « squelettes » du groupe sont des états **narratifs**, pas des gabarits manquants

**G5, G12, G13, G14 et G15** tiennent en 3 à 12 lignes parce que le Code y demande une
**description**, pas un tableau : « les entreprises **dressent la liste** des GIE, pools et autres
groupements… », « les entreprises **décrivent sommairement**… ». Un relevé qui les compte comme
« gabarit absent » se trompe de forme.

⚠️ **G16 n'en est pas** — malgré ses 9 lignes, le Code y écrit « selon le **modèle suivant** » et
publie quatre colonnes. Il est donc `IMPOSE`. *La brièveté d'un bloc ne dit pas sa nature.*

### M5 — Quinze états sont réservés à un agrément, et le texte le dit à chaque fois

| Réservé à | États | Source relevée |
|---|---|---|
| vie et capitalisation | `COMPTE_80_VIE_CAPITALISATION` | art. 300 (1°) et 326 al. 3 |
| vie et capitalisation | `C1_VIE`, `C20`, `C21` | art. 433, « établi par les entreprises d'assurances sur la vie » |
| vie et capitalisation | `G4`, `RS2_VIE` | art. 433, intitulés « provisions techniques **vie** » / « RS2 **VIE** » |
| toute nature | `COMPTE_80_TOUTE_NATURE` | art. 300 (2°) et 326 al. 3 |
| toute nature | `C1_DOMMAGES` | art. 433, « établi par les entreprises d'assurances en dommage » |
| toute nature | `C10A`, `C10B` | art. 433, « pour l'ensemble des opérations d'assurances **dommages** » |
| toute nature | `C10`, `C10C` | art. 433 — RC véhicules terrestres à moteur / catégorie Transports |
| toute nature | `G3`, `T2`, `RS2_NON_VIE` | art. 433, intitulés « équilibre technique **dommages** » / « recours **automobile** » / « RS2 **NON VIE** » |

⇒ **C'est la matière de l'AC-4.** Mesuré sur l'artefact : un assureur **vie** voit **9** états
`NON_APPLICABLE`, un assureur **toute nature** en voit **6** — servis et expliqués, jamais masqués.

⛔ **`C10D` n'en fait PAS partie**, et ce fut le point de bascule : le classer « dommages » par
voisinage avec `C10a`/`C10b` l'aurait exempté à tout assureur vie, alors que ses colonnes — zone et
année de survenance, victimes, évaluation globale — ne nomment ni branche ni catégorie.

### M6 — Le régime de dépôt CIMA est **le même que celui du SFD** : papier certifié

> **Art. 425** — « Les entreprises **remettent au Ministre** en charge des assurances […] dans les
> **trente jours qui suivent la réunion de leur assemblée générale et au plus tard le 1er juin** de
> chaque année, un dossier relatif aux opérations effectuées au cours de l'exercice écoulé. Ce
> dossier est produit **en trois exemplaires**. Il est **certifié** par le président du Conseil
> d'Administration […] : “le présent document, comprenant x feuillets numérotés, est certifié
> conforme aux écritures de l'entreprise et aux règles applicables à l'assurance, sous les sanctions
> prévues”. […] Elles doivent adresser les mêmes documents dans les mêmes conditions à la
> **Commission de Contrôle des Assurances**. »

⇒ **Aucun format de fichier n'est prescrit.** Exactement ce que [[STORY-509]] avait mesuré pour les
SFD (art. 7 de l'instruction n°030-02-2009 : support papier signé). **La doctrine de dépôt unique
demandée par Q1 existe donc déjà** — `DEPOT_PHYSIQUE` — et elle n'est pas un choix produit : c'est
la mesure, deux fois.

> ⚠️ **Requalifié le 2026-09-22 par la doctrine de dépôt** (`doctrine-depot-2026-09-22.md` §3 et §4
> C1, livrable de [[STORY-525]]) : `DEPOT_PHYSIQUE` est le **régime** de dépôt de l'assurance — et
> de l'IMF —, pas la doctrine. La doctrine unique est la **voie A**, pour les trois verticaux ; le
> fiscal togolais, lui, dépose sur un téléservice. Le paragraphe ci-dessus reste tel qu'il a été
> écrit : c'est la mesure qui a nourri la doctrine.

### M7 — ⚠️ Le bilan CIMA servi aujourd'hui est à **10 postes** face à un gabarit de **296 lignes**

Mesuré sur `cima-assurances@5.0` : `BILAN_ACTIF` **5 postes**, `BILAN_PASSIF` **5 postes**. Le
modèle du compte 89 de l'art. 433 en aligne 296.

⛔ **Publier « bilan : produit » sur cet écart est exactement l'écart de promesse que la story
nomme.** D-523-6 y répond sans inventer de verdict.

### M8 — L'état C10b est déjà produit — **par l'autre service**

`assurance-service`, module `etat-sinistres` (STORY-516). Un catalogue servi par `bilan-service` qui
déclarerait « C10b : non produit » serait **faux le jour de sa livraison**.

---

## Les décisions

**D-523-1 — Le jalon `format confirmé` est levé**, et le relevé est versé au dépôt sous forme
d'artefact sourcé `etats-cima@1.0`, à l'identique du patron `etats-dimf-sfd-bceao@1.0` de
STORY-509 (générateur + portes + sha256 + registre + pont depuis le référentiel comptable).

**D-523-2 — Le périmètre de CETTE story est le catalogue, pas les trente états.** La story livre
*le format confirmé* : l'inventaire sourcé, son applicabilité, et **le statut de production dérivé**.
La transcription ligne à ligne de chaque état reste le **lot**, en stories dédiées — conformément à
« 13 points est une borne basse assumée […] son chiffrage réel sort du jalon ».

**D-523-3 — La garde du jalon devient : *gabarit imposé **ou** norme de contenu identifiée***
(cf. M3). Le C11 entre au catalogue avec `gabarit: "LIBRE"` et ses articles de contenu.

**D-523-4 — Hors périmètre, nommément** : les états de **groupe** G1..G16 (art. 422-1 — réservés
aux entreprises tenues d'établir des comptes consolidés ou combinés au sens de l'art. 434) et les
états **intermédiaires** T1/T2 et semestriels (art. 422-2). Ils entrent au catalogue — **l'AC-3
l'exige** — avec leur rythme, et ne sont pas produits.

**D-523-5 — Le statut de production est DÉRIVÉ, jamais déclaré.** Un catalogue qui porterait
`produit: true/false` en dur serait une seconde constante que rien ne confronte — le défaut mesuré
en [[STORY-519]]. Le statut se lit sur ce que le moteur **émet réellement**.

**D-523-6 — Face à l'écart de M7, le catalogue publie deux nombres mesurés, pas un verdict** :
`postesPublies` (dérivé du paquet servi) et `lignesGabarit` (sourcé de l'art. 433). L'assureur voit
`10 / 296` et juge. **Le produit n'invente aucun seuil de complétude** — un seuil arbitraire
transformerait une mesure en promesse.

**D-523-7 — L'attribution inter-services est confrontée dans le dépôt qui la porte.** L'artefact
nomme le service producteur de chaque état (`produitPar`) ; une garde **dans chaque dépôt** vérifie
que les états qui lui sont attribués sont bien émis par lui. Aucune requête ni appel synchrone
inter-services (invariants #2 et #3) — même discipline que « un contrat d'événement touche 2 dépôts ».

---

## Critères d'acceptation

- [x] **AC-1** — Chaque état produit est **sourcé** (article, gabarit, version) et porte sa référence.
- [x] **AC-2** — Les états sont produits **depuis la liasse et les agrégats déjà calculés**, jamais
      recalculés en parallèle. Deux moteurs sur le même nombre divergeraient en silence.
- [x] **AC-3** — ⛔ **Les états NON produits sont nommés à l'écran**, avec leur code d'état — jamais
      omis. Un assureur doit savoir ce qu'il devra produire ailleurs. Doctrine FE-073, transposée.
- [x] **AC-4** — Un état non applicable (assureur mono-activité) rend `NON_APPLICABLE`, **visible et
      expliqué**, jamais masqué (STORY-521 AC-5).

## Hors périmètre — hooks inertes documentés

- La **transcription ligne à ligne** des états (concordances vers le plan de comptes) : le contrat
  d'artefact prévoit un champ `lignes` **absent en `@1.0`**, que les stories du lot rempliront état
  par état sans changer le contrat.
- Le **calcul** du C11 (marge de solvabilité, art. 337-1 à 337-4) : EPIC-134 le porte en propre.
- Les états **de groupe** et **intermédiaires** (D-523-4).

## Notes

- Voir [[STORY-509]] et [[STORY-525]] (la même question de doctrine), [[STORY-521]], [[STORY-524]].
- Doctrine de dépôt commune aux trois verticaux : [`doctrine-depot-2026-09-22.md`](../doctrine-depot-2026-09-22.md), posée par [[STORY-525]].

## Progress Tracking

- 2026-09-22 — branche `MNV-523` ouverte sur `docs/`, `bilan-service`, `assurance-service`.
- 2026-09-22 — **jalon `format confirmé` levé** : relevé de l'art. 433 (3 750 lignes utiles,
  50 blocs), croisé art. 422 / 422-1 / 422-2 / 425. Constats M1 à M8, décisions D-523-1 à D-523-7.
- 2026-09-22 — artefact `etats-cima@1.0` (**46 états**, sha256 `93b41b2c…`), générateur à portes,
  registre + pont depuis les **cinq** versions de `cima-assurances`, dérivation du statut, DTO et
  catalogue servi sur la route de STORY-521. Recopie à l'octet dans `assurance-service`.
- 2026-09-22 — **portes DoD**. `bilan-service` : lint 0, build OK, **3 152 unit + 827 e2e** verts,
  couverture **99,01 / 95,06 / 99,26 / 99,08**. `assurance-service` : lint 0, build OK,
  **2 022 unit + 202 e2e** verts, couverture **99,6 / 94,49 / 99,18 / 99,65**.

### Table de mutations — 9 mutations, 9 rouges

| # | Mutation | Ce qu'elle simule | Résultat |
|---|---|---|---|
| M-a | retirer `C9` de la source | un état de l'art. 422 omis du catalogue | 🔴 build refusé, code nommé |
| M-b | retirer `normeContenu` du C11 | un gabarit `LIBRE` non spécifié (D-523-3) | 🔴 build refusé |
| M-c | retirer `sourcePerimetre` du C20 | une restriction d'applicabilité non relevée | 🔴 build refusé |
| M-d | restreindre `C25` à la vie sans source | le cas C10d rejoué | 🔴 build refusé |
| M-e | états moteur sans producteur | un état qui « s'émet tout seul » | 🔴 build refusé |
| M-f | publier `C99`, hors liste légale | le catalogue déborde le Code | 🔴 build refusé |
| M1 | `PRODUIT` dès `produitPar === service` | **le statut redevient DÉCLARÉ** | 🔴 1 test |
| M2 | un agrément non tranché exempte | la direction dangereuse de l'erreur | 🔴 1 test |
| M3 | `PRODUIT_AILLEURS` dit `NON_PRODUIT` | le C10b disparaît de la carte | 🔴 1 test |
| M4 | omettre les états non produits | **le défaut que l'AC-3 ferme** | 🔴 7 tests |
| M5 | artefact orphelin dans `assets/` | la garde découvrante le voit-elle ? | 🔴 1 test |
| M5-bis | un manifeste cesse d'être découvert | la découverte elle-même | 🔴 1 test |
| M6 | attribuer un état moteur inexistant | la garde D-523-7 côté `bilan-service` | 🔴 2 tests |
| M7 | retirer le producteur du C10b | la garde D-523-7 côté `assurance-service` | 🔴 2 tests |
| M8 | retirer l'attribution du catalogue | non-vacuité de la garde jumelle | 🔴 3 tests |
| M9 | recopier l'artefact dans `balance-service` | l'exclusion d'amont cesse d'être vraie | 🔴 1 test |

⚠️ **M9 a dû être rejouée.** Sa première exécution est tombée alors qu'un `git checkout -- src/` de
la passe venait d'effacer la garde qu'elle devait éprouver : le rouge observé était celui d'un
*autre* test. Rejouée sur l'état **committé**, elle rougit bien sur la garde d'exclusion.
⇒ *Une passe de mutation se joue sur du code committé, et son rouge se lit par le NOM du test.*

### Vérification docker — l'artefact chargé par le processus, pas seulement présent

La story **n'écrit rien en base** : la vérification porte sur ce que docker seul révèle — l'artefact
réellement **empaqueté et chargé** dans l'image.

> ⚠️ **Mesure du 2026-09-22, AVANT la revue**, sur l'artefact `93b41b2c…`. Les correctifs de revue
> ayant régénéré l'artefact, **c'est le rejeu plus bas qui fait foi** — celui-ci est conservé pour
> la traçabilité, et non comme preuve de l'état livré.

```
checksum VÉRIFIÉ par le loader : 93b41b2cc9f1720972917acc675d23d41ca84ccce0dc3f2908d27a546d382cc0
états chargés : 46 | dépôt : DEPOT_PHYSIQUE | butoir : 1er juin
  VIE_CAPITALISATION   PRODUIT=4 AILLEURS=0 NON_PRODUIT=33 NON_APPLICABLE=9
  TOUTE_NATURE         PRODUIT=4 AILLEURS=1 NON_PRODUIT=35 NON_APPLICABLE=6
  INDETERMINABLE       PRODUIT=5 AILLEURS=1 NON_PRODUIT=40 NON_APPLICABLE=0
  C11 : LIBRE | norme : Article 337-1, Article 337-2, Article 337-3, Article 337-4
  bilan actif : 5 postes publiés / 172 lignes de gabarit
  C10b : NON_APPLICABLE → assurance-service
```

### Revue de code — 6 constats, tous corrigés · Revue de sécurité — 0 constat

Les deux scans ont tourné en `opus`. La revue de sécurité n'a retenu **aucun** constat : elle a
vérifié l'ordre `checksum → parse → cache`, l'impossibilité d'empoisonner le cache, l'absence de
pollution de prototype, et — point métier central — **zéro exemption sur un agrément non tranché**,
mesurée sur les cinq agréments.

| # | Constat de revue de code | Gravité | Correctif |
|---|---|---|---|
| 1 | **L'ordre des branches ① applicabilité / ② produit ailleurs n'était fixé par AUCUN test** — permuter les deux laissait 3 152 tests verts | ⛔ bloquant | `C10B` ajouté au test AC-4 « assureur vie » |
| 2 | Les portes du générateur ne confrontaient **que le rythme `ANNUEL`** — un `C99S` inventé était accepté | non-bloquant | les **quatre** listes légales confrontées dans les deux sens + non-vacuité |
| 3 | JSDoc détaché par insertion (10ᵉ récidive) | non-bloquant | réattaché, contrôle mécanique passé |
| 4 | Le motif du C11 **se contredisait** : « Gabarit relevé à l'Article 433 » sur l'état qui n'en a aucun | non-bloquant | le motif d'un gabarit `LIBRE` **remplace**, il n'ajoute pas |
| 5 | `postesPublies: 0` sur le C10b, indistinguable de « non alimenté » | non-bloquant | `null`, jamais `0`, quand ce dépôt ne produit pas l'état |
| 6 | 5 divergences entre la story, le README et l'artefact | non-bloquant | les deux documents alignés sur le relevé |

⚡ **Le constat 1 est celui qui compte.** `C10B` est le **seul** état du catalogue à la fois
restreint par périmètre **et** attribué à un autre dépôt — donc le seul qui discrimine les deux
ordres — et mon test AC-4 l'excluait précisément. Sans lui, un assureur vie lisait « Produit par
assurance-service, à demander à ce service » sur un état qui ne lui est **pas dû**.
⇒ *Un test qui énumère des cas peut omettre le seul qui discrimine, et rester vert pour toujours.*

Deux durcissements tirés des observations **sous le seuil** de la revue de sécurité : `catalogueRef`
(une référence sans sa version n'en est pas une, AC-1) et la porte d'applicabilité qui vérifie la
**nature** du renvoi, pas seulement sa présence — une source recopiée de l'état voisin passait sans
rien lever et exemptait l'assureur du mauvais côté.

### Vérification docker REJOUÉE sur l'artefact final (`328c17be…`)

Les correctifs ayant régénéré l'artefact, la vérification de la phase ④ a été rejouée — jamais
reportée depuis la mesure d'avant correctif.

```
checksum VÉRIFIÉ par le loader : 328c17be651a863d65d23c1a18c996373409d440128226e98d9a432d662f501a
états : 46 | dépôt : DEPOT_PHYSIQUE | butoir : 1er juin
  VIE_CAPITALISATION   PRODUIT=4 AILLEURS=0 NON_PRODUIT=33 NON_APPLICABLE=9 | total=46
  TOUTE_NATURE         PRODUIT=4 AILLEURS=1 NON_PRODUIT=35 NON_APPLICABLE=6 | total=46
  INDETERMINABLE       PRODUIT=5 AILLEURS=1 NON_PRODUIT=40 NON_APPLICABLE=0 | total=46
  ① C10b sur assureur VIE        : NON_APPLICABLE (et non PRODUIT_AILLEURS)
  ① C10b sur assureur TOUTE_NAT. : PRODUIT_AILLEURS → assurance-service
  ④ motif du C11                 : « Cet état n'a AUCUN gabarit officiel… »
  ⑤ postesPublies du C10b        : null / 248 lignes
  ⑤ bilan actif (produit ici)    : 5 / 172 lignes
```

### ⚠️ Trois incidents de méthode, dans la passe de mutation

1. **`git checkout --` a effacé trois fois du travail non committé** — et, la fois où un `git mv`
   avait été indexé, il a laissé un **fichier fantôme non suivi** (`etats-cima-manifeste.ts`,
   duplicata du registre) que seule la couverture **par fichier** a révélé, à 0 %. Il n'a jamais
   atteint la branche poussée. ⇒ **Sauvegarde fichier explicite, jamais `git checkout`.**
2. **Un `str.replace` silencieux n'a rien matché** après un reformatage d'`eslint --fix` : le
   `C10B` que je croyais avoir ajouté au test n'y était pas, et la mutation « probante » ne
   prouvait rien. ⇒ **Toute édition se relit après coup** ; une mutation se vérifie **appliquée**
   avant d'être interprétée.
3. Les accents graves des messages de commit ont été **interprétés par le shell** comme des
   substitutions de commande, mangeant des mots. ⇒ Messages écrits **depuis un fichier**.

- Les trois lectures **bouclent à 46** : aucun état n'est perdu en route, quel que soit l'agrément.
- ⚠️ **L'applicabilité prime sur le lieu de production** : pour un assureur vie, le C10b sort
  `NON_APPLICABLE` et non `PRODUIT_AILLEURS`. C'est le bon ordre — un état qui n'est pas dû n'est
  pas « disponible ailleurs », il n'est pas dû.
- Le contrôle ne s'est pas contenté du `Found 0 errors` des logs (qui peut annoncer l'ancien code) :
  le **loader compilé** a été exécuté dans le conteneur, checksum vérifié sur les octets empaquetés.
- ⚠️ Côté `assurance-service`, l'artefact est présent dans le `dist/` au même sha256, mais **aucun
  code d'exécution ne le lit** en `@1.0` — seule la garde d'attribution le fait. C'est dit plutôt
  que masqué.
