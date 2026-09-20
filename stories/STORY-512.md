# STORY-512 : Le plan CIMA packagé s'arrête à 2 chiffres — la question du niveau de détail n'a jamais été posée

Status: done

**Complexité :** high

**Épic :** EPIC-128 — Socle vertical CIMA
**Service :** `assurance-service` + `bilan-service` / `balance-service` (référentiel)
**Points :** 8 · **Sprint :** S20
**Origine :** revue de l'artefact, 2026-08-27 — **AD-11** de la spine.

---

## Le fait

`cima-assurances@1.0` porte **80 comptes, tous à 2 chiffres** : c'est la liste de l'article 431,
verbatim, et c'est exactement ce que l'amorce annonçait. Le rattachement résolvant par **plus long
préfixe**, tout fonctionne : un compte `3012` d'un assureur tombe sur la racine `30`.

⚠️ **Et c'est le problème.** Tout marche, rien ne refuse — et **la liasse n'a aucun détail** : les
25 postes agrègent 80 racines, là où SYSCOHADA en a 163 pour 174 comptes et le SFD 31 pour 372.
Un assureur réel tient des comptes à 4, 5 ou 6 chiffres ; ils se rattacheront tous, sans qu'aucune
erreur ne soit possible **ni détectable**.

⚡ **Le SFD a payé cette question deux fois** — STORY-172 (les comptes de paramétrage échappaient au
niveau de détail) puis STORY-368 (l'artefact était **tronqué à 156 comptes sur 372**, et personne ne
le voyait). **CIMA ne l'a jamais posée.**

## Cadrage mesuré avant de coder (2026-09-20)

⛔ **La question a été posée, et la réponse déplace la story.** Le recoupement exigé par l'AC-3 a été
fait contre la **page officielle** de l'article 431 (`cima-afrique.org`, Code CIMA 2019, art. 431
« Liste des comptes », *Modifié par Décision du Conseil des Ministres du 20 avril 1995*), octets
téléchargés et dépouillés — **pas** contre l'artefact, **pas** contre le README du dépôt.

### F1 — ⚡⚡ L'article 431 énumère 1 052 comptes sur QUATRE niveaux, pas 80 sur un seul

| Longueur | Comptes énumérés par l'art. 431 | Portés par `cima-assurances@1.0` |
|---|---|---|
| 2 chiffres | **79** | **80** (les 79 + `05`, cf. F2) |
| 3 chiffres | **345** | 0 |
| 4 chiffres | **499** | 0 |
| 5 chiffres | **129** | 0 |
| **Total** | **1 052** | **80** |

Répartition officielle par classe : 1 → 57 · 2 → 226 · 3 → 69 · 4 → 117 · 5 → 43 · 6 → 312 · 7 → 105 ·
8 → 61 · 0 → 62.

⇒ **Le plan packagé n'est complet qu'au niveau 2.** Ce n'est pas la troncature *accidentelle* de
STORY-368 (le SFD perdait 216 comptes sur 372 sans que personne l'ait décidé) : ici la limitation est
**déclarée** — l'artefact dit « comptes principaux à 2 chiffres, verbatim » et son `statut` vaut
`amorce`. Mais elle n'était **chiffrée nulle part**, et c'est ce chiffre qui manquait pour décider.

### F2 — ⚠️ `05` n'est pas imprimé dans la liste officielle en ligne

La page enchaîne `03` → `039` → **`050`** → `052`/`057`/`059` → `06` : les quatre enfants de `05`
y sont, **la racine non**. L'artefact porte `05 Plan d'investissement`, déduit de ses enfants. La
déduction est défendable, elle n'est pas du *verbatim* — et elle explique l'écart 80 / 79.

### F3 — ⚡ 26 libellés sur 79 sont ABRÉGÉS par rapport au texte, et plusieurs perdent leur portée

*(27 divergent au sens strict ; le 27ᵉ est `43`, « État » contre « Etat » — la page officielle omet
l'accent, l'artefact le met. Écart de pure orthographe, pas une abréviation.)*

L'artefact annonce des libellés « verbatim ». Mesuré compte par compte : **26 divergent**. Trois
exemples qui ne sont pas cosmétiques — c'est la **portée du compte** qui disparaît :

| Compte | Artefact | Article 431 |
|---|---|---|
| `23` | « Valeurs mobilières et titres assimilés (affectables à la représentation) » | « …**détenus dans le pays concerné**, affectables à la représentation des engagements réglementés, **appartenant à l'entreprise et conservés par elle (autres que les titres de participation)** » |
| `31` | « Provisions techniques opérations d'assurance directe vie » | « …**dans le pays concerné** » |
| `78` | « Travaux faits par l'entreprise pour elle-même » | « Travaux faits par l'entreprise pour elle-même. **Charges non imputables à l'exploitation de l'exercice**, dans le pays concerné » |

⛔ **« Dans le pays concerné » n'est pas du remplissage** : le plan CIMA oppose explicitement le
national à l'étranger (`28` « Valeurs immobilisées à l'étranger », `159` « Étranger », `517` « Prêts à
l'étranger »). Un libellé qui laisse tomber la restriction fait lire un compte **national** comme un
**total**.

### F4 — ⚠️ L'exemple de l'énoncé est faux, et le vrai comportement est plus dur

L'énoncé dit « un compte `3012` d'un assureur tombe sur la racine `30` ». **`30` n'existe pas** : la
classe 3 de l'art. 431 commence à `31` (`31`, `32`, `34`, `35`, `38`, `39`). `3012` n'est donc
rattachable à **aucune** racine — `isCompteValide('3012')` rend `false`, et le compte est **refusé**
aujourd'hui. Le vrai angle mort n'est pas « tout passe » : c'est que sous une racine **qui existe**
(`3112`, `311234`, `3112345678`), **aucune profondeur n'est bornée**.

### F5 — ⚡⚡ L'article 430 dit 4 chiffres. L'article 431 en énumère 129 à 5. Le Code se contredit.

**L'article 430 « Classes comptables » est l'équivalent CIMA du texte que STORY-172 avait trouvé pour
le SFD** — c'est l'article qui *nomme* les niveaux. Verbatim, page officielle (la parenthèse non
fermée est dans le texte) :

> « Les classes du cadre comptable sont numérotées de 1 à 8 et 0. Chaque classe comporte des comptes
> principaux (dont le deuxième chiffre est numéroté de 0 à 9. Les comptes principaux sont eux-mêmes
> subdivisés en **comptes divisionnaires (trois chiffres)** à leur tour ventilés en **sous-comptes
> (quatre chiffres** dont le dernier est également numéroté de 0 à 9). Les chiffres qui codifient les
> comptes se lisent toujours à partir de la gauche. »

⛔ **Et l'article 431 ne respecte pas l'article 430** : il énumère **129 comptes à 5 chiffres**
(`01010`, `01011`, `01030`, `01031`, `20480`, `69091`…) — un niveau que le **cadre** ne nomme pas.
⚠️ Il est en revanche **autorisé ailleurs**, et c'est ce que la première rédaction de cette story a
manqué : cf. **F5 bis**.

### F5 bis — ⛔⛔ CORRIGÉ EN REVUE : la clause d'ouverture EXISTE, et elle nomme SIX chiffres

⚠️ **Cette section affirmait d'abord que « le Code CIMA n'a aucune clause d'ouverture », et la
décision D-512-1 déclarait `5` sur cette base. C'était faux.** La revue de code l'a trouvé, et le
texte a été revérifié sur les deux sources officielles (page `Article432…`, et PDF consolidé
*CODE CIMA 2019*, art. 432 classe 4) :

> « Les comptes divisionnaires 400 à 403 donnent lieu à l'ouverture pour chaque réassureur, dans
> chaque monnaie du traité, d'un compte […] ; l'entreprise ouvre à cet effet les comptes 4002,
> 4003…, jusqu'à 4038 et 4039 ; **si le nombre des comptes ainsi disponible est insuffisant, il sera
> créé des comptes à cinq chiffres (de 40020 et 40021 à 40398 et 40399) ou à six chiffres.** […]
> **Les comptes 404 à 408 fonctionnent de manière analogue.** »

⚡ La clause est **plus explicite que celle du RCSFD** — elle *énumère* les paliers — et elle vit
dans l'article que cette story citait déjà trois fois par ailleurs (F6, `6026`). La recherche initiale
l'avait manquée parce qu'elle cherchait le vocabulaire du RCSFD (« non limitative », « subdiviser »,
« autres chiffres ») et que le Code CIMA emploie une formulation entièrement différente.

⛔ **Conséquence mesurée : à 5, le produit refusait un compte que le texte prévoit.** Un assureur à
plus de 190 couples réassureur × monnaie tient `400200`, `400201`… — six chiffres, prévus noir sur
blanc. `isCompteDeDetail('400200')` aurait rendu `false`, la ligne aurait été **refusée en 400**, et
`CompteDuDossierService.verdict()` aurait rendu `valide: false` sur un compte du plan officiel.
C'est **mot pour mot** le mode de panne que l'ancien commentaire D-511-K disait vouloir éviter :
« un assureur qui subdivise verrait ses comptes refusés par une exigence que personne n'a écrite ».

⇒ **6, et c'est un PLAFOND.** Dépouillement des 608 pages du Code consolidé 2019 : il n'existe que
**trois** énoncés de profondeur (art. 430 ; art. 432 classe 2, amortissements en 4 chiffres ; art. 432
classe 4, jusqu'à 6), et **aucun** ne mentionne sept chiffres ou plus. L'**art. 412** ferme le reste :

> « Les entreprises désireuses de pousser leurs écritures au-delà de ces comptes obligatoires
> **doivent utiliser les sous-comptes définis au chapitre III du présent titre, avec leur numéro et
> intitulé**. »

⚡ **Et 6 n'est pas une analogie avec SYSCOHADA ou le RCSFD** — qui valent 6 pour leurs raisons
propres. Il a **sa** source. C'est exactement la méthode de STORY-172, appliquée jusqu'au bout cette
fois : le premier passage s'était arrêté à l'art. 431 et avait pris le silence de l'art. 430 pour une
absence de règle.

⚠️ Le README du dépôt (`docs/referentiels/README-cima-assurances.md`) écrit « comptes principaux à
2 chiffres, divisionnaires à 3, sous-comptes à 4 » : c'est une transcription **fidèle de l'art. 430**,
et **insuffisante** — elle décrit le cadre, pas la liste, et la liste va plus loin. Deuxième fois que
ce README induit en erreur (la revue de STORY-491 y avait déjà corrigé « Livre III, Titre IV » en
« Livre IV »). ⇒ **Une référence recopiée d'un README n'est pas une référence vérifiée** — la règle
de 491 s'applique à elle-même.

### F6 — Une coquille dans la page officielle elle-même : `6126` pour `6026`

La page de l'art. 431 imprime `6126. Frais accessoires` — en classe 6, sous `602. Prestations et frais
payés`. L'**article 432 tranche** : il cite `6026` **trois fois** (« au débit des sous-comptes 6020 et
6026 », « par le débit des comptes 6020 et 6026 », « comptabilisés au compte 6026 »). C'est `6026`.
De même, `6905` est imprimé **sans son point** dans la liste — un parseur naïf sur `^\d+\.` le perd —
et l'art. 432 confirme son existence (« 602, 604, 605, 606, 6902, 6904, 6905 »). ⇒ **Deux pièges pour
la transcription de STORY-671**, relevés ici pendant qu'ils sont sous les yeux.

## Décisions de cadrage du 2026-09-20 — à relire en revue

| # | Décision | Pourquoi |
|---|---|---|
| **D-512-1** ⚠️ **RÉVISÉ EN REVUE** | `longueurCompteDetail` **= 6** pour `cima-assurances@1.0` (et **non 5**, comme la première rédaction le décidait) | **Sourcé, pas choisi — et le sourcing est TRIPLE.** L'art. 430 nomme les niveaux et s'arrête à 4 ; l'art. 431 **énumère 129 comptes à 5 chiffres** ; l'art. 432 classe 4 **autorise nommément 6**. Déclarer `4` refuserait `20480`, déclarer `5` refuserait `400200` — deux comptes que le texte prévoit. ⛔ **6 est un plafond** : aucun des trois énoncés de profondeur du Code ne va au-delà, et l'art. 412 ferme le reste. Ce n'est pas une analogie avec SYSCOHADA (6 aussi, pour sa raison propre) : le chiffre a **sa** source |
| **D-512-2** | La valeur ne se dérive **PAS** du plan packagé | Le plan packagé s'arrête à 2 : en dériver `2` refuserait **tout** compte réel d'assureur (`3112` est un compte de production normal). Le niveau de détail est une propriété du **référentiel**, pas de l'état d'avancement de sa transcription |
| **D-512-6** ⚡ **AJOUTÉ EN REVUE** | Déclarer la valeur **branche aussi la dérivation au plan**, et c'est assumé | `normaliserCompte`/`ramenerAuPlan` (STORY-424, voie B) lisent la **même** donnée et étaient **inertes** pour CIMA tant qu'elle valait `undefined`. Une balance CIMA portait donc des comptes **du logiciel** (`57100000`, `411FACTURE`) comme s'ils étaient des comptes **du plan** — exactement ce que 424 avait fermé pour les trois autres référentiels. ⛔ Conséquence à dire, pas à taire : **deux comptes longs distincts qui se ramènent au même compte de plan fusionnent, et leurs soldes sont sommés**. Le compte saisi n'est pas perdu (il suit dans `comptesSources`). Les données CIMA antérieures portant des comptes de 7 à 20 caractères deviennent non déposables — fail-closed, et la migration est un souci de prod, différé |
| **D-512-3** | ⛔ Le plan n'est **pas** enrichi ici. F1 et F3 partent en **STORY-671** | AC-5 : « on ne complète pas un plan comptable par analogie » — et on ne transcrit pas 972 comptes en marge d'une story de 8 points. La transcription change les **octets** de l'artefact dans **trois** dépôts, impose une **nouvelle version du paquet**, et rouvre la table de passage. C'est une story, avec son sourcing |
| **D-512-4** | La branche fail-open `longueurDetail === undefined` reste **exercée**, sur une entrée **synthétique** | CIMA était le **seul** référentiel packagé sans niveau de détail : le déclarer rend la branche inatteignable depuis le manifeste de production. Patron déjà rencontré en STORY-494 (`nonPackage` devenu vacant) — la garde s'exerce sur une entrée fabriquée, jamais on ne laisse mourir le mécanisme |
| **D-512-5** | `05` est **conservé** et sa déduction est **écrite** | Ses quatre enfants sont au texte ; le retirer casserait le rattachement de `050…059` sans rien gagner. Ce qui manquait n'est pas le compte, c'est la **mention** qu'il est déduit |

## Périmètre

### Livré

- `longueurCompteDetail: 5` déclaré pour `cima-assurances@1.0` dans les manifestes de
  **`balance-service`** et **`assurance-service`**, avec son sourcing **au commentaire du manifeste**
  (article, URL, méthode de constat).
- Le comportement en profondeur **testé et documenté** : rattachable par préfixe jusqu'à 5 chiffres,
  refusé par `isCompteDeDetail` au-delà — et `isCompteValide` inchangé (deux prédicats, deux
  questions).
- La branche fail-open `longueurDetail === undefined` **conservée et exercée** sur une entrée
  synthétique (D-512-4).
- La garde de **byte-identité** inter-dépôts conservée, et **prouvée détectante** par mutation.
- Le recoupement F1/F2/F3 **consigné** ici, et **STORY-671** créée avec son sourcing.
- Correction du README `docs/referentiels/README-cima-assurances.md` sur la profondeur (F5).

### Hors périmètre

- ⛔ **La transcription des 972 comptes manquants** et la correction des 26 libellés abrégés →
  **STORY-671**. Aucun octet de `cima-assurances-1.0.json` n'est touché ici, dans aucun des trois
  dépôts : le checksum reste `9ca429c8…`.
- Toute évolution de la **table de passage** ou des **postes** de la liasse.
- `bilan-service` : il ne porte pas la notion de `longueurCompteDetail` (il ne valide aucun compte
  déposé) — il reste la **source des octets**, inchangée.
- Contrats, quittances, primes (STORY-513) et provisions (STORY-514).

## Critères d'acceptation

- [x] AC-1 — Un `longueurCompteDetail` est **déclaré** pour `cima-assurances`, comme il l'est pour
      les autres référentiels — et il est **sourcé**, pas choisi.
- [x] AC-2 — Le comportement sur un compte plus long que la profondeur du plan est **testé et
      documenté** : accepté par rattachement de préfixe, ou refusé. ⛔ Le laisser implicite reproduit
      exactement l'angle mort de STORY-172.
- [x] AC-3 — ⚠️ **Vérifier que les 80 comptes sont bien la liste complète de l'article 431**, en
      recoupant contre la source officielle — pas contre l'artefact. C'est précisément le contrôle
      qui a révélé la troncature du SFD.
- [x] AC-4 — La byte-identité de l'artefact entre `balance-service` et `bilan-service` est **gardée**
      (règle AD-6/STORY-368), et la garde **prouve qu'elle détecte** (test de mutation).
- [x] AC-5 — Si le plan doit être enrichi au-delà de l'article 431, l'enrichissement est **une story
      séparée avec son sourcing** : on ne complète pas un plan comptable par analogie.

## Table de mutations obligatoire

**11 mutations réellement appliquées sur l'état FINAL** (après les correctifs de revue), chacune
prouvée rouge puis restaurée. ⚠️ **Trois ont produit un constat réel** (M6, M6ter, et la reformulation
de M7) ; **trois formulations initiales ne compilaient pas** et ont été reformulées — une mutation qui
ne compile pas est « 0 test », jamais un rouge (leçon STORY-505).

| ID | Mutation appliquée | Ce qui a viré au rouge |
|---|---|---|
| M1 | `longueurCompteDetail: 6` → `5` au manifeste de `balance-service` | **3 tests** |
| M1bis | `6` → `7`, l'autre côté de la borne | **3 tests** |
| M2 | `6` → `5` au manifeste d'`assurance-service` | **4 tests** |
| M2bis | `6` → `7` | **4 tests** |
| M3 | Retirer la ligne du manifeste (retour au fail-open) | **3 tests** |
| M4 | `normalise.length <= longueurDetail` → `<` | **3 tests**, dont la borne exacte |
| M5 | Un octet altéré dans `bilan-service`, **source** des octets | **1 test dans CHACUN** des deux dépôts aval |
| M6 | Chemin du voisin redirigé vers le dépôt **local** | ⛔ **VERT 19/19 à la première passe — la garde était une tautologie.** Rouge après correctif |
| M6ter | Le voisin est un **LIEN SYMBOLIQUE** vers le dépôt local | ⛔ **VERT à la deuxième passe** — `resolve()` est purement lexical. Rouge après passage à `realpathSync` |
| M7 | L'exerciseur synthétique cesse d'exercer le fail-open (`undefined` → `6`) | **1 test** — grâce à l'assertion ajoutée en D-512-4 ; la formulation initiale (« supprimer l'entrée ») ne mesurait **rien** |
| M8 | La garde de saisie s'applique au compte **dérivé** au lieu du **brut** | **1 test** — sans elle, `601; DROP` serait **blanchi** en `601000` |
| M9 | La dérivation redevient inerte pour le seul CIMA | **1 test** |

⚠️ **Deux gardes successivement prises en défaut au même endroit.** M6 a montré que la garde de
byte-identité se laissait pointer sur le dépôt local. Le correctif — comparer des chemins **résolus** —
a été écrit, et son commentaire promettait de couvrir « un lien ». La revue de code a relevé que
`resolve()` **ne suit pas les liens**, et M6ter l'a confirmé : le correctif était vert sur le cas qu'il
annonçait fermer. ⇒ **Une garde qui promet plus qu'elle ne tient est du même genre que la tautologie
qu'elle remplace.** Fermé pour de bon par `realpathSync`, qui canonise aussi la casse.

## Definition of Done

- [x] Statut synchronisé dans ce document, `sprint-status.yaml` et le présent Progress Tracking.
- [x] Lint 0 warning, build, couverture ≥ 65/90/90/90, unit + e2e verts sur **`balance-service`** et
      **`assurance-service`**.
- [x] M1 à M9 (11 mutations, variantes comprises) appliquées une par une sur l'état **final**, prouvées rouges, puis restaurées.
- [x] ⛔ **Non-régression mesurée sur `balance-service`** : déclarer un niveau de détail pour CIMA
      **restreint** `isCompteDeDetail`. Aucune suite existante ne doit changer de verdict sans que ce
      soit voulu et dit.
- [x] Checksum `cima-assurances-1.0.json` **inchangé** dans les trois dépôts (`9ca429c8…`).
- [x] STORY-671 créée, sourcée et slottée.
- [x] Revue de code (3 bloquants : 2 confirmés et corrigés, 1 faux positif ; 4 non-bloquants tous corrigés) et revue de sécurité (aucun constat ≥ 80) — **aucun constat ouvert**.
- [x] PR module(s) vers `dev`, PR docs vers `main`, rebase-merge, branches supprimées.

## Progress Tracking

- **Statut courant :** `done` — ouverte et clôturée le **2026-09-20**.
- **2026-09-20 — cadrage mesuré :** branche `MNV-512` sur `docs`. Page officielle de l'art. 431
  téléchargée et dépouillée (1 093 lignes, 1 052 comptes extraits) ; artefact comparé compte par
  compte et libellé par libellé. Cinq constats : F1 (troncature de profondeur, 80/1 052), F2 (`05`
  déduit), F3 (26 libellés abrégés), F4 (l'exemple `3012`/`30` de l'énoncé est faux — `30` n'existe
  pas), F5 (l'art. 430 plafonne à 4, l'art. 431 en énumère 129 à 5 — le Code se contredit, et il n'a
  **aucune** clause d'ouverture là où le RCSFD en a une), F6 (deux coquilles dans la page officielle,
  `6126` pour `6026` et `6905` sans point, arbitrées par l'art. 432). Cinq décisions : D-512-1 à
  D-512-5. **Recoupement croisé** : art. 430, 431 et 432 relus un par un sur les pages officielles ;
  le PDF consolidé cité par le README (`droit-afrique.com`) est **mort**.
- **2026-09-20 — dev :** branches `MNV-512` sur `balance-service` et `assurance-service` (base `dev`).
  `longueurCompteDetail: 5` déclaré dans les deux manifestes, sourcing complet au commentaire
  (art. 430 + art. 431 + absence de clause d'ouverture). Tests de profondeur écrits sur le **vrai**
  artefact dans les deux dépôts : borne exacte, rattachement inchangé, `3012`, trous de numérotation.
  Octets de `cima-assurances-1.0.json` **inchangés** (`9ca429c8…`) et `bilan-service` **non touché**.
- **2026-09-20 — portes DoD :** lint 0 warning et build OK sur les deux services.
  `balance-service` **4 175 unit + 1 077 e2e** verts ; `assurance-service` **853 unit + 17 e2e** verts.
  Aucun seuil de couverture franchi à la baisse.
- **2026-09-20 — table de mutations, 7 appliquées et prouvées :**

  | ID | Mutation appliquée | Constaté |
  |---|---|---|
  | M1 | `5` → `6` au manifeste de `balance-service` | **2 rouges** |
  | M2 | `5` → `6` au manifeste d'`assurance-service` | **4 rouges** |
  | M3 | ligne retirée du manifeste (retour fail-open) | **6 rouges** |
  | M4 | `length <= longueurDetail` → `<` | **3 rouges** (dont la borne exacte `31123`) |
  | M5 | un octet altéré dans `bilan-service` (source des octets) | **1 rouge dans CHACUN** des deux dépôts aval |
  | M6 | chemin du voisin redirigé vers le dépôt **local** | ⛔ **VERT 19/19 — défaut réel** (voir ci-dessous) |
  | M7 | l'exerciseur synthétique cesse d'exercer le fail-open | **1 rouge** |

  ⛔⛔ **M6 a trouvé un vrai défaut, et c'est le constat le plus utile de la story.** La garde de
  byte-identité inter-dépôts se laissait pointer sur le dépôt **local** : elle comparait alors le
  fichier à lui-même et **19 tests sur 19 restaient verts**. Une garde qui se présente comme une
  comparaison inter-dépôts et qui est une tautologie aurait survécu à n'importe quelle divergence
  réelle — exactement le mode de panne de STORY-368, avec un cran de plus : là-bas la copie était
  périmée, ici c'est *l'instrument de mesure* qui était faux. Correctif : une **garde de la garde**
  qui compare les chemins **résolus** et exige que l'amont soit hors de la racine du dépôt. ⚠️ Une
  égalité de chaînes n'aurait pas suffi — un chemin *différent* qui retombe dans le dépôt (via `..`,
  un lien) est le même piège, et la variante M6bis le prouve : rouge elle aussi. Corrigé dans les
  **deux** dépôts.

  ⚠️ **M7 a d'abord été mal formulée.** « Supprimer l'entrée synthétique » ne mesurait rien : la
  branche `longueurDetail === undefined` est exercée à **deux** endroits (la spec du chargeur, sur la
  fonction pure, et le manifeste synthétique de la spec de cohérence). Reformulée en « l'exerciseur
  cesse d'exercer » (`undefined` → `6`), elle rougit — mais seulement parce qu'une **assertion** a été
  ajoutée sur le fail-open lui-même (D-512-4) : sans elle, l'exerciseur pouvait cesser d'exercer en
  silence, en chargeant sans rougir.
- **2026-09-20 — vérification runtime (conteneur réel, pas un mock) :** la story n'écrit rien en base,
  mais le manifeste devait **atteindre le runtime**. Stack démarrée (`mongo` + `assurance-service`),
  chargeur de production exercé dans le conteneur sur les octets déployés :
  `Référentiel cima-assurances@1.0 chargé (plan=80 comptes, règles=6, détail=5)`, checksum
  `9ca429c8…` **vérifié**, et le comportement en profondeur mesuré tel que spécifié —
  `31`/`311`/`3112`/`31123` déposables, `311234` et `3112345678` rattachables mais **non** déposables,
  `3012` rattachable à rien. Stack arrêtée.
- **2026-09-20 — PR ouvertes :** `prospera-balance-service#109` et `prospera-assurance-service#2`,
  toutes deux base `dev`, à intégrer **ensemble**.
- **2026-09-20 — revue de code ⑥ :** ⛔⛔ **elle a invalidé la décision centrale de la story.**
  **3 constats bloquants remontés, 2 confirmés, 1 faux positif ;** 4 non-bloquants, tous retenus.

  | # | Constat | Verdict après vérification de première main |
  |---|---|---|
  | 1 | L'art. 432 **contient** une clause d'ouverture, qui nomme **six** chiffres ⇒ la valeur est 6, pas 5 | ✅ **CONFIRMÉ** — texte relu sur la page officielle **et** sur le PDF consolidé 608 p. Corrigé partout |
  | 2 | Déclarer la longueur **branche aussi la réécriture** des comptes (`normaliserCompte`), niée par la doc livrée et non couverte | ✅ **CONFIRMÉ** — mesuré avant/après (`57100000` → `571000`, `411FACTURE` → `411000`, et **deux comptes longs distincts fusionnent, soldes sommés**). D-512-6 ajoutée, commentaires corrigés, test écrit |
  | 3 | La branche `MNV-512` de `balance-service` embarquerait un commit étranger `MNV-297` | ❌ **FAUX POSITIF** — `git log origin/dev..MNV-512` rend **un** commit, et la PR GitHub porte **3 fichiers**. Non reproductible |
  | 4 | `resolve()` ne suit pas les liens ⇒ la garde de la garde promet plus qu'elle ne tient | ✅ retenu — `realpathSync` des deux côtés, ce qui canonise aussi la casse |
  | 5 | Trois affirmations périmées dans `assurance-service` (« 80 comptes », « libellés verbatim », un **titre de test**) | ✅ retenu — corrigées |
  | 6 | `cf. sfd-bceao` comme exemple de référentiel sans niveau de détail : périmé depuis STORY-172 | ✅ retenu — corrigé |
  | 7 | Le tableau « ce que cette batterie prouve » n'était mis à jour que dans **un** des deux dépôts | ✅ retenu — corrigé |

  ⚡⚡ **La leçon de la story change avec le constat 1, et elle vaut plus que le chiffre.** Le premier
  sourcing s'était arrêté à l'art. 431 et avait pris **le silence de l'art. 430 pour une absence de
  règle** — puis l'avait écrit en gras (« le Code CIMA n'a aucune clause d'ouverture »), ce qui a
  transformé une lacune de recherche en **affirmation sourcée**. La recherche cherchait le vocabulaire
  du RCSFD (« non limitative », « subdiviser », « autres chiffres ») ; le Code CIMA dit la même chose
  avec des mots entièrement différents (« si le nombre des comptes ainsi disponible est insuffisant,
  il sera créé des comptes à cinq chiffres… ou à six chiffres »). ⇒ **Une recherche négative ne prouve
  l'absence que du vocabulaire cherché.** Le seul contrôle qui l'aurait attrapée : relire **en entier**
  l'article de terminologie du plan, qui était déjà ouvert pour un autre motif (F6, la coquille `6126`).

  ⚠️ **Et la story aurait livré le défaut qu'elle disait fermer.** Le commentaire D-511-K qu'elle
  supprimait annonçait : « un assureur qui subdivise verrait ses comptes refusés par une exigence que
  personne n'a écrite ». À 5, `400200` — six chiffres, prévus noir sur blanc pour les comptes de
  réassureurs — était refusé. La story se serait fermée en ayant **créé** ce qu'elle prétendait éviter.
- **2026-09-20 — revue de sécurité ⑦ :** **aucun constat ≥ 80.** Examinés : chemin d'injection
  (`respecteGardesDeSaisie` évalué sur le compte **brut avant** dérivation — `601; DROP` reste refusé,
  vérifié par mutation), borne d'entrée CWE-770 (`LONGUEUR_MAX_COMPTE` reste la seule borne
  d'`isCompteValide`, évaluée avant la boucle), intégrité comptable (aucune donnée packagée ne change
  de verdict), intégrité de l'artefact (checksum et confinement du locator hors diff, intacts), fuite
  d'information (deux URL publiques, rien d'autre). ⚡ C'est elle qui a **signalé sous son seuil** le
  branchement de la dérivation — le constat 2 de la revue de code : deux revues indépendantes ont
  trouvé le même fait par deux chemins.
- **2026-09-20 — correctifs de revue :** commit dédié dans chaque dépôt, séparé du commit de feature.
  Valeur portée à **6** et sourcing réécrit (art. 430 → 431 → 432, plus le plafond de l'art. 412) ;
  D-512-6 ajoutée sur la dérivation au plan et **testée**, y compris la fusion de deux comptes longs
  distincts ; `realpathSync` dans les deux gardes ; trois affirmations périmées corrigées dans
  `assurance-service`, dont un **titre de test** ; exemple `cf. sfd-bceao` retiré ; tableau « ce que
  cette batterie prouve » complété dans les **deux** dépôts. README CIMA corrigé (5 → 6, clause
  d'ouverture citée).
- **2026-09-20 — portes DoD rejouées sur l'état final :** lint 0 warning, build OK.
  `balance-service` **4 176 unit + 1 077 e2e** verts ; `assurance-service` **854 unit + 17 e2e** verts.
  ⚠️ Une passe intermédiaire a montré 1 unitaire et 54 e2e rouges : **flake d'exécution parallèle
  connu**, verts en isolation et sur la passe suivante — pas un constat.
- **2026-09-20 — vérification runtime REJOUÉE** (le correctif change la valeur vérifiée, donc la
  mesure d'avant ne vaut plus) : `Référentiel cima-assurances@1.0 chargé (plan=80 comptes, règles=6,
  **détail=6**)`, checksum `9ca429c8…` vérifié, et **`400200` — le compte que l'art. 432 prévoit — est
  déposable**, `4002001` ne l'est pas, `3012` n'est rattachable à rien. Stack arrêtée.

## Notes

- Voir [[STORY-172]], [[STORY-368]], [[STORY-488]], [[STORY-491]], [[STORY-494]] (le patron de la
  garde devenue vacante), [[STORY-671]] (la transcription complète), spine AD-11.
- Source officielle : art. 431 · https://cima-afrique.org/wp-content/code-cima/fr/Article431Listedescomptes.html
