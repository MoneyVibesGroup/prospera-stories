# STORY-519 : Aucun calcul actuariel n'est inventé — ce que le module calcule, et à quelle condition

Status: defined

**Complexité :** high

**Épic :** EPIC-131 — Provisions techniques ⚠️ **PALIER 2**
**Service :** `assurance-service`
**Points :** 8 · **Sprint :** S20
**Prérequis :** **STORY-514** (le registre **calculé**) · **STORY-517** (le registre **hébergé**)
**Origine :** découpage `epics-assurance-2026-08-27.md`, **AD-12** de la spine — Q2 non tranchée.

---

## ✅ DÉCISION PO — 2026-08-28 : on avance en considérant `cima-assurances` validé

> « Prends comme `cima-assurances` validé ; dans le cas contraire, écris la story pour mettre en
> place cela, avec les informations dont tu as besoin. » — PO, 2026-08-28.

**Ce que cette décision débloque : le DÉVELOPPEMENT.** Le palier 2 démarre, cette story est
chiffrable, et STORY-517/518/520/521 ne sont plus suspendues.

⛔ **Ce qu'elle ne peut pas faire, et il faut le dire une fois clairement : une décision produit ne
valide pas une méthode actuarielle.** La validation est un **acte d'expert**, pas un statut qu'on
pose. Un référentiel dont le `statut` dit « certifié » sans qu'aucun actuaire ne l'ait signé serait
**la seule affirmation de ce programme qu'un régulateur pourrait retenir contre son utilisateur**.

⇒ **Conduite retenue, qui honore les deux :**

1. **On construit** — le palier 2 est ouvert, sur les méthodes de l'amorce.
2. **Le `statut` de l'artefact reste celui qu'il déclare** et continue d'être **publié partout où il
   est servi** (STORY-511 AC-4). Il ne bascule à `certifie` que le jour où quelqu'un signe.
   ⚠️ **Rectification mesurée — M6 ci-dessous** : ce statut est `amorce`, pas `a-valider-par-expert`.
3. **La validation est mise en chantier en parallèle** : [[STORY-540]] porte le dossier à soumettre
   et la liste exacte de ce qu'il faut obtenir.

⚠️ **Le jour où la validation infirme une méthode**, l'impact est borné et connu d'avance : les
provisions sont des **évaluations versionnées** (STORY-517 AD-2), donc une méthode corrigée produit
**une nouvelle version**, sans réécrire l'historique. C'est précisément ce que cette architecture
protège.

---

## Le fait

STORY-517 **héberge** une provision et sa méthode. STORY-518 la fait **entrer au résultat**. Aucune
des deux ne dit **d'où vient le montant**. Cette story pose la question, et refuse de la trancher
seule.

⚡⚡ **Et aujourd'hui, RIEN dans le contrat ne distingue les deux registres.** Une provision calculée
par le module (`provisions_risques_en_cours`, STORY-514) et une provision saisie par un opérateur
(`provisions_techniques`, STORY-517) sortent par deux routes voisines, sous le même `@ApiTags`
famille, **sans aucun champ qui dise laquelle est laquelle**. Le lecteur de l'API ne le devine qu'au
chemin d'URL. ⛔ **C'est exactement la confusion que l'AC-3 interdit** : elle ferait porter au produit
la responsabilité d'un chiffre qu'il n'a pas produit.

## Cadrage mesuré avant de coder (2026-09-21)

Deux sources indépendantes croisées : les pages officielles `cima-afrique.org` (une par article) et
le **Code CIMA 2019** intégral (PDF, 608 p., extrait localement). Corpus prouvé cherchable avant
toute conclusion négative — 609 blocs de page, aucune page non-OCRisée, contrôles positifs passés.

### M1 — ⛔⛔ AUCUN article du Code n'exige qu'un actuaire valide une provision technique

L'AC-4 nomme « l'actuaire ou l'expert qui a validé une méthode ». **Le Code ne connaît pas cette
personne.** Le certificateur qu'il nomme est un **mandataire social**, et il signe **sous sanction** :

> **Art. 425** *(modifié 03/04/2014)* — « Il est certifié par le président du Conseil
> d'Administration ou le Président du Directoire ou le Directeur Général unique dans les sociétés
> anonymes, par le Directeur et par le Président du Conseil d'Administration dans les sociétés
> d'assurance mutuelle et les sociétés à forme tontinières, par le mandataire général ou son
> représentant légal dans les entreprises étrangères, sous la formule suivante : « le présent
> document, comprenant x feuillets numérotés, est certifié conforme aux écritures de l'entreprise et
> aux règles applicables à l'assurance, sous les sanctions prévues ». »

Le dossier annuel ainsi certifié **contient les états C de l'art. 422**, dont `C10`, `C10a`, `C10b`,
`C10c`, `C10d` (paiements et provisions pour sinistres) et `C4` (engagements réglementés). **Les
provisions techniques sont donc certifiées — par un dirigeant, jamais par un actuaire.**

⚠️ **Et la recherche négative a d'abord été FAUSSE, il faut le dire.** Le radical `actuair` donne
**0 occurrence** sur 608 pages — conclusion tentante et erronée : `actua**ri**el` n'a pas le même
radical que `actua**ir**e`. Le radical correct `actuar` donne **9 occurrences**, toutes hors sujet
(diplômes de dirigeants, engagements sociaux des comptes consolidés, externalisation autorisée).
La **seule** obligation d'expertise actuarielle du corpus vit dans la **circulaire
n° 0003/CIMA/CRCA/PDT/2015**, porte sur le **tarif** de la **microassurance indicielle** seule, et
n'est **pas** un article du Code. *(Patron [[story-512-recherche-negative-prouve-le-vocabulaire]] :
une recherche négative ne prouve l'absence que du vocabulaire cherché — encore faut-il l'orthographier
comme le texte.)*

⇒ **Conséquence sur l'AC-4, et elle est structurante : la validation d'une méthode est une exigence
du PRODUIT, pas du régulateur.** Le module peut — et doit — la porter, mais il ne peut pas
prétendre que le Code la réclame. La **qualité** du validateur reste donc un **texte libre**, jamais
une énumération de professions (même motif que D-517-6 pour l'auteur).

### M2 — ⚡⚡ La provision mathématique VIE n'est pas hors de portée « par manque d'actuaire »

Le tableau de l'énoncé la classe ⛔ *« actuaire obligatoire — hors de portée de ce module »*.
**Mesuré, le motif est faux, et le bon motif est plus solide.** Les bases ne sont pas choisies par
un expert : le Code les **impose**.

> **Art. 334-4 1°)** — « Les provisions mathématiques des contrats d'assurance sur la vie doivent
> être calculées d'après les tables de mortalité mentionnées à l'article 338 et d'après des taux
> d'intérêt mentionnés au même article. »

> **Art. 338** *(modifié 24/04/1999 et 04/10/2012)* — « 1°) tables de mortalité **CIMA H** pour les
> assurances en cas de décès et **CIMA F** pour les assurances en cas de vie, annexées au présent
> article ; 2°) taux d'intérêt **au plus égaux à 3,5 %**. »

Et l'art. 334-3 en borne le résultat par **quatre planchers non négociables** : la provision « ne
peut être négative, ni inférieure à la valeur de rachat du contrat, ni inférieure à la provision
correspondant au capital réduit », et « au plus 110 % de la valeur de rachat » quand le niveau de
chargement n'est pas déterminé.

⇒ **Ce qui met la PM vie hors de portée, c'est la DONNÉE, pas l'expertise** : `assurance-service` ne
porte ni engagement par contrat, ni valeur de rachat, ni capital réduit, ni table de mortalité. Le
motif publié doit donc être `DONNEE_ABSENTE_DE_CE_SERVICE` — vrai, vérifiable, et qui ne se démentira
pas le jour où un actuaire sera nommé.

⚠️ **Réserve de version, et elle n'est pas levée.** La FANAF atteste un **« Règlement CIMA 2024 sur
les engagements règlementés et les provisions techniques en assurance vie »** susceptible de modifier
les art. 334-2 à 334-7. **Le texte n'a pas pu être obtenu** (page en 403, aucune version intégrale
trouvée) et **n'a pas été reconstitué**. La partie vie de ce module se limitant à *déclarer qu'elle
ne calcule pas*, la réserve ne bloque pas cette story — elle bloquerait toute story qui calculerait.

### M3 — ⚡⚡ La PSAP : le Code ne renvoie pas à un actuaire, il renvoie HORS DE LUI-MÊME

> **Art. 334-12** *(modifié 11/09/2006)* — « La provision pour sinistres à payer est calculée
> exercice par exercice. Sans préjudice de l'application des règles spécifiques à certaines branches
> prévues à la présente section, l'évaluation des sinistres connus est effectuée **dossier par
> dossier**, le coût d'un dossier comprenant toutes les charges externes individualisables ; elle est
> augmentée d'une estimation du coût des sinistres survenus mais non déclarés. **Les modalités
> d'estimation du coût des sinistres survenus mais non déclarés ou sinistres déclarés tardifs sont
> fixées par circulaire de la Commission de Contrôle des Assurances.** La provision pour sinistres à
> payer doit **toujours** être calculée pour son montant brut, sans tenir compte des recours à
> exercer ; les recours à recevoir font l'objet d'une évaluation distincte. **Par dérogation** aux
> dispositions du deuxième alinéa du présent article, l'entreprise **peut, avec l'accord de la
> Commission de Contrôle des Assurances**, utiliser des méthodes statistiques pour l'estimation des
> sinistres survenus **au cours des deux derniers exercices**. »

Trois verrous distincts, et **aucun** ne se lève en nommant un actuaire :

1. **« dossier par dossier »** est le principe — une évaluation humaine par sinistre, pas une formule.
2. Les **tardifs** sont renvoyés à une **circulaire** de la Commission, **hors du Code** : leurs
   modalités ne sont pas déterminables à partir du texte seul.
3. Les **méthodes statistiques** — chain-ladder compris — sont une **dérogation doublement bornée** :
   elle exige l'**accord** de la Commission **et** se limite aux **deux derniers exercices de
   survenance**.

⇒ ⚡ **Écrire un chain-ladder « qui a l'air juste » serait pire qu'inexact : ce serait HORS CADRE**
sans qu'aucun calcul ne soit faux. Un triangle complet projeté sur dix exercices sort de la
dérogation par sa seule étendue. C'est le patron de STORY-412 — *la provenance rend l'erreur plus
difficile à mettre en doute qu'un chiffre sans provenance* — aggravé d'un motif réglementaire.

⚠️ Le chargement de l'art. 334-13 ne sauve rien : « ne peut être inférieure à **5 %** » est un
**plancher**, la règle de fond étant « **suffisante pour liquider tous les sinistres** », et
l'article **ne dit pas 5 % de quoi**. Appliquer 5 % par défaut, c'est appliquer le minimum légal en
le présentant comme le montant.

### M4 — ⛔⛔ Le plancher que le module publie est INCOMPLET, et c'est mesuré dans le code

> **Art. 334-9** — « Le montant minimal de la provision pour risques en cours doit être calculé
> conformément aux dispositions des articles **334-10 et 334-11**. Cette provision doit être, **en
> outre, suffisante** pour couvrir les risques et les frais généraux afférents, pour chacun des
> contrats à prime ou cotisation payable d'avance, à la période comprise entre la date de
> l'inventaire et la prochaine échéance de prime ou cotisation ou, à défaut, le terme fixé par le
> contrat. »

L'article pose **deux** obligations, et STORY-514 en a déjà traité une : `montantMinimal` porte le
plancher, `montantRetenu` ce que l'entreprise retient, et le hook `exigerMontantRetenuSuffisant`
refuse en base que le second passe sous le premier. **L'obligation de suffisance est donc déjà
laissée à l'entreprise, et c'est correct.**

⛔ **Ce qui ne l'est pas : le plancher calculé est celui de l'art. 334-10 SEUL.** L'art. 334-11 —
que l'art. 334-9 rend pourtant obligatoire au même titre — n'est **appliqué nulle part** dans
`src/modules/provisions/` (mesuré le 2026-09-21 : une seule occurrence, dans une liste d'articles en
JSDoc). Il pose deux contraintes d'inégalité :

> **Art. 334-11** — « La provision pour risques en cours relative aux cessions en réassurance ou
> rétrocessions ne doit **en aucun cas** être portée au passif du bilan pour un montant inférieur à
> celui pour lequel la part du réassureur ou du rétrocessionnaire dans la provision pour risques en
> cours figure à l'actif. Lorsque les traités de cessions en réassurance ou de rétrocessions
> prévoient, en cas de résiliation, l'abandon au cédant ou au rétrocédant d'une portion des primes
> payées d'avance, la provision pour risques en cours relative aux acceptations ne doit, en aucun
> cas, être inférieure au montant de ces abandons de primes calculés dans l'hypothèse où les traités
> seraient résiliés à la date de l'inventaire. »

⇒ **Cette story ne le calcule pas** — il faut les cessions et les traités, qui sont **EPIC-132 /
[[STORY-520]]**. ⛔ **Mais elle le DIT**, avec la méthode : publier « montant minimal » sans dire
qu'il ne couvre qu'un des deux articles du plancher légal est exactement le mensonge par omission
que cette story existe pour fermer.

### M5 — ⚠️ Deux autres réserves déjà vraies, aujourd'hui publiées en prose seulement

Elles vivent dans des `description` Swagger et des JSDoc de `provisions/` — lisibles par un humain
qui ouvre `/api/docs`, **invisibles à un client qui consomme la réponse** :

- **Le calcul par branche n'est pas livré.** « La provision pour risques en cours doit être calculée
  **séparément dans chacune des branches** mentionnées à l'article 328 » (art. 334-10, dernier
  alinéa). L'art. 328 classe les opérations en **vingt-trois** branches d'agrément ; ce service ne
  porte que la **catégorie** Vie / Non-Vie. Le module évalue donc par catégorie, et l'a toujours dit.
- **La condition du prorata n'est pas vérifiée**, délibérément : « **en cas d'inégale répartition**
  des échéances […] le calcul **peut** être effectué par une méthode de prorata temporis ». Le texte
  ne pose **aucun seuil**, et en inventer un serait le calcul actuariel que D-514-6 interdit. La
  méthode est **déclarée** par l'évaluateur — c'est la déclaration qui est opposable.

⇒ Ces deux réserves **conditionnent le chiffre publié**. Elles doivent voyager **avec la méthode**,
dans l'enveloppe, comme `miseEnGarde` voyage avec le `statut` du référentiel (STORY-511, D-511-J).

### M6 — ⚠️ La prémisse de l'énoncé sur le statut de l'artefact est inexacte

L'énoncé (et l'AC-2 de [[STORY-540]]) écrivent que le `statut` de l'artefact « reste
`a-valider-par-expert` ». **Mesuré : il vaut `amorce`.** La valeur `a-valider-par-expert` existe bien
dans le vocabulaire fermé `STATUTS_REFERENTIEL` (`certifie` · `amorce` · `a-valider-par-expert`),
mais **aucun artefact packagé ne la porte** — c'est la `miseEnGarde` qui dit « À VALIDER par un
actuaire avant tout usage réglementaire ».

⇒ **Rien n'est changé ici.** Toucher à l'artefact, c'est une **nouvelle version et un nouveau
checksum** (discipline STORY-518, où `@1.0` n'a pas bougé d'un octet parce qu'elle avait été servie).
La réserve part vers **[[STORY-540]]**, qui possède ce statut : soit l'artefact bascule sur la valeur
du vocabulaire qui le décrit, soit les deux stories cessent d'annoncer une valeur qui n'existe pas.

## Décisions de cadrage du 2026-09-21

| # | Décision | Pourquoi |
|---|---|---|
| **D-519-1** ⚡⚡ | Un **catalogue déclaré et SERVI** dit, pour **chaque** couple (catégorie, type) des deux listes du Code, si le module **calcule** ou si la provision est **saisie**, et — quand il ne calcule pas — **pourquoi**, sourcé sur l'article | C'est le titre de la story. Sans route, « ce que le module calcule » n'existe nulle part : un client ne peut pas le savoir **avant** de saisir. Patron `compte-non-choisi.ts` (D-513-1), mais **publié**, pas seulement déclaré en constante |
| **D-519-2** ⛔⛔ | Un champ **`origine`** — `CALCULEE_PAR_LE_MODULE` \| `SAISIE` — sur **toute** réponse qui porte un montant, les **deux** registres **et** l'agrégat `en-vigueur` | AC-3. Aujourd'hui **aucun** discriminant n'existe. Et c'est le **total** qui est le plus dangereux : une somme de saisies publiée sans dire qu'elle est saisie est le chiffre qu'on attribuera au produit ([[story-510-total-refuse-mais-detail-recomposable]]) |
| **D-519-3** ⛔⛔ | La validation est portée par un bloc **`methodeServie` OBLIGATOIRE** (jamais optionnel) dans chaque réponse, avec son `statut` **fail-closed** à `A_VALIDER_PAR_UN_EXPERT` | AC-4 : « portée **par la méthode**, pas par une note ». Un bloc requis rend **structurellement impossible** de servir une méthode sans son statut. Un bloc optionnel serait la note de bas de page que personne ne transporte (D-511-J) |
| **D-519-4** | Le **validateur de la méthode** (`nom`, `qualité`, `date`) est **distinct** de l'**auteur de l'évaluation** de STORY-517, et les deux sont portés | Ce sont **deux actes** : l'un **signe l'évaluation**, l'autre **valide la méthode**. Les confondre attribuerait à l'opérateur la caution d'une méthode qu'il n'a pas validée. `qualite` reste un **texte libre** — M1 : le Code ne nomme aucune profession ici |
| **D-519-5** ⚡ | Les trois champs de validation sont **tout ou rien**, et `valideeLe` ne peut pas être **postérieure** à `dateEvaluation` | Un nom sans date est une note, pas une validation. Et publier « méthode validée » sur une évaluation **antérieure** à la validation affirme ce qui est faux : l'évaluation n'a pas été faite sous une méthode validée. Le registre étant append-only, la validation tardive se porte sur une **nouvelle version** — c'est le modèle, pas un contournement. Patron [[story-505-decision-heritee-par-un-reechelonnement-antidate]] |
| **D-519-6** ⛔ | Les **réserves mesurées** (M4, M5) sont servies en `miseEnGarde` **avec** la méthode calculée : plancher de l'art. 334-10 **seul** (334-11 non appliqué), calcul par **catégorie** et non par branche 328, condition du prorata **déclarée** et non vérifiée | M4/M5. Elles **conditionnent le chiffre**. En prose Swagger, elles sont invisibles au client qui consomme la réponse — et c'est la réponse qui circule |
| **D-519-7** | ⛔ **Aucun calcul nouveau** : ni 334-11, ni 334-12, ni 334-13, ni 334-14, ni PM vie | AD-12. Cette story **classe et publie** ; elle n'ajoute pas une formule. Chaque calcul manquant est **nommé** avec sa story (STORY-520 pour 334-11) |
| **D-519-8** | La saisie du type `RISQUES_EN_COURS` **reste autorisée**, et porte une mise en garde disant que ce type est **aussi** calculé par le module | D-517-9 : la coexistence est **assumée**. L'interdire retirerait à un assureur le droit d'enregistrer une évaluation produite ailleurs. Ce que l'AC-3 demande, c'est de **distinguer**, pas d'interdire |
| **D-519-9** | ⛔ **L'artefact `cima-assurances` n'est pas touché** | M6. Une modification = nouvelle version + checksum, sur un paquet déjà servi. Le statut de l'artefact appartient à [[STORY-540]] |
| **D-519-10** | Le catalogue vit **dans `provisions-techniques/`**, sur le contrôleur existant, **pas** dans un module neuf | Il est indexé par `TypeProvisionTechnique`, qui y vit déjà, et réutilise la chaîne de gardes, l'inventaire de refus et le harnais e2e. Un module pour une route de lecture serait de l'indirection sans contrepartie |

## Critères d'acceptation

- [ ] AC-1 — Les provisions **calculables sans actuaire** (provision pour **risques en cours**,
      art. 334-9 et 334-10) le sont, avec leur **méthode publiée**.
      ⚡ **PRÉCISÉ (M4, M5, D-519-6)** : « publiée » signifie **servie dans la réponse**, avec son
      fondement (l'article) **et ses réserves** — le plancher couvre l'art. 334-10 **seul**, le
      calcul est fait par **catégorie** et non par branche (art. 328), et la condition d'ouverture du
      prorata est **déclarée**, pas vérifiée. Le calcul lui-même ne change pas.
- [ ] AC-2 — Les provisions **exigeant une méthode validée** sont **saisies**, avec leur méthode et
      leur auteur (STORY-517), et le module **ne propose aucun montant**.
      ⚡ **PRÉCISÉ (M3)** : pour la PSAP, ce n'est pas « un actuaire » qui manque — le Code renvoie
      à une **circulaire** de la Commission pour les tardifs et **subordonne à son accord** toute
      méthode statistique, **bornée aux deux derniers exercices**. Le motif publié doit être celui
      du texte.
- [ ] AC-3 — ⛔ Une provision **saisie** et une provision **calculée** sont **distinguées au
      contrat** et à l'écran. Les confondre ferait porter au produit une responsabilité qu'il
      n'assume pas.
      ⚡ **AUGMENTÉ (D-519-2)** : le discriminant porte aussi sur l'**agrégat** `en-vigueur` et son
      total, pas seulement sur les éléments.
- [ ] AC-4 — Le nom de l'actuaire ou de l'expert qui a validé une méthode est **porté par la
      méthode**, pas par une note. Sans validation, la méthode est servie **avec son statut**.
      ⚡⚡ **CORRIGÉ PAR LE TEXTE (M1, D-519-3, D-519-4)** : **aucun article du Code n'exige qu'un
      actuaire valide une provision** — le certificateur nommé est un **mandataire social**
      (art. 425, sous sanction). La validation reste portée, comme exigence **du produit** ; elle est
      **distincte** de l'auteur de l'évaluation ; sa `qualite` est un **texte libre** ; et le statut
      par défaut est **`A_VALIDER_PAR_UN_EXPERT`**, jamais l'absence du champ.
- [ ] AC-5 — ⛔ **Le catalogue est TOTAL et éprouvé comme tel** : chaque couple (catégorie, type)
      admis par `TYPES_PAR_CATEGORIE` a exactement une entrée, et le test le **dérive de la
      transcription des articles**, jamais des clés du catalogue lui-même.
      ⚠️ C'est la leçon de STORY-517 : *la garde écrite pour fermer un angle mort portait le même
      défaut — elle filtrait sur la liste qu'elle devait éprouver.*
- [ ] AC-6 — ⛔ **Ce que le module calcule est déclaré des DEUX côtés et confronté** : le module
      calculé nomme le couple qu'il produit, le catalogue le classe, et un test les **oppose**. Une
      divergence doit rougir — c'est la seule garantie qui survive à l'ajout d'un futur calcul.

## Périmètre

### Livré

- Le **catalogue des méthodes de provisionnement**, servi sur le contrôleur existant : une entrée
  par couple (catégorie, type), portant `origine`, le **fondement** (l'article), les **raisons** du
  non-calcul et la **mise en garde** sourcée.
- Le **discriminant `origine`** sur les réponses des **deux** registres et sur l'agrégat
  `en-vigueur`.
- Le bloc **`methodeServie`**, **obligatoire**, portant le statut de validation, son fondement, la
  mise en garde et — quand elle existe — l'identité du validateur.
- La **saisie du validateur** (nom, qualité, date) sur le registre hébergé, **tout ou rien** et non
  postérieure à l'évaluation, avec ses codes de refus publiés au contrat.
- Un **ticket frontend** pour le « à l'écran » de l'AC-3 (l'user est dev **backend** ; aucun push
  sur les dépôts frontend).

### Hors périmètre

- ⛔ **Tout calcul nouveau** (D-519-7) : art. **334-11** (cessions et traités → **[[STORY-520]]**),
  art. **334-12** / **334-13** (PSAP, tardifs, chargement), art. **334-14** (risque d'exigibilité,
  qui dépend de l'art. 335-12), **provisions mathématiques vie** (art. 334-3 à 334-7 et 338).
- ⛔ **Le calcul séparé par BRANCHE** au sens de l'art. 328 : la branche fine d'agrément n'existe
  nulle part dans ce service. Story dédiée, déjà nommée par STORY-514.
- ⛔ **L'artefact `cima-assurances`** et son `statut` (D-519-9) → **[[STORY-540]]**.
- ⛔ **La résolution du validateur en identité** (read-model `identity.*`) : même hook nommé que
  pour l'auteur en STORY-517, et pour le même motif — un expert externe n'a pas de compte.
- ⛔ **Tout numéro de compte et tout poste de liasse** (D-513-1, D-517-10) : l'imputation appartient
  à l'adaptateur de balance (AD-5), et STORY-518 a tranché que la liasse se lit dans la **balance**.
- ⛔ **L'écran lui-même** : ouvert en ticket, pas développé ici.

## Notes

- Voir [[STORY-514]] (le registre calculé), [[STORY-516]] (la cadence, qui alimenterait une PSAP),
  [[STORY-517]] (le registre hébergé), [[STORY-518]] (les variations au CR), [[STORY-520]]
  (la réassurance à la cession, qui débloque 334-11), [[STORY-540]] (le dossier de validation),
  spine **AD-2**, **AD-10**, **AD-12**, Q2.
- Sources officielles dépouillées le 2026-09-21, deux sources croisées, textes **intégraux sans
  ellipse** : art. **334-2**, **334-3**, **334-4**, **334-8**, **334-9**, **334-10**, **334-11**,
  **334-12**, **334-13**, **334-14**, **338**, **422**, **425**.
  Pages officielles `https://cima-afrique.org/wp-content/code-cima/fr/Article<n>….html` et
  *Code CIMA 2019* intégral `https://cima-afrique.org/wp-content/uploads/2023/06/CODE-CIMA-2019.pdf`
  (608 p. — art. 334-9/10/11 p. 208-209, art. 334-12/13/14 p. 210, art. 422 p. 242-243, art. 425
  p. 245).
- ⚠️ **Réserve de version NON levée** (M2) : le *Règlement CIMA 2024 sur les engagements règlementés
  et les provisions techniques en assurance vie*, attesté par la FANAF, n'a **pas pu être obtenu** et
  n'a **pas été reconstitué**. Il pourrait modifier les art. 334-2 à 334-7. Sans effet sur cette
  story, qui se borne à **déclarer qu'elle ne calcule pas** la partie vie ; bloquant pour toute story
  qui la calculerait.

## Progress Tracking

**Statut : `defined` le 2026-09-21.** Cadrage réglementaire mesuré **avant** toute ligne de code, sur
deux sources indépendantes croisées (pages officielles `cima-afrique.org` + Code CIMA 2019 intégral,
608 p. extraites localement). Six constats (M1 → M6) ont **déplacé la story**, dont deux qui
contredisent sa propre prémisse : aucun article du Code n'exige d'actuaire (M1), et la provision
mathématique vie est hors de portée par **absence de donnée**, pas par manque d'expertise (M2).

Branches créées **avant** la première ligne de code :

```
docs               MNV-519
assurance-service  MNV-519
```
