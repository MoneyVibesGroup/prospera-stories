# STORY-491 : Le manifeste d'un référentiel ne dit ni sa zone, ni ses pays, ni sa devise, ni la norme dont il dérive

Status: review

**Épic :** EPIC-108 — Le référentiel devient un plugin déclaré (zone, pays, devise, norme)
**Service :** `bilan-service` (`ReferentielRegistry`, `scripts/referentiels/build.mjs`) + `balance-service` (manifeste)
**Points :** 5 · **Complexité :** high · **Assigné à :** vivianMoneyVibesGroupes · **Sprint :** S20
**Origine :** revue **expert-comptable** de la maquette cumulative, 2026-08-27 — *« couvrir la CEDEAO, l'Afrique de l'Est, l'Europe, voire l'Amérique »*.

---

## Le fait

L'architecture est déjà la bonne : `bilan-service` est un **moteur d'états agnostique**, toute la
sémantique vit dans un `ReferentielPackage` vérifié par checksum, et **ajouter un référentiel ne
touche pas le moteur** (invariant P7). C'est ce qui rend l'expansion possible.

Ce qui manque n'est pas le mécanisme, c'est **ce que le paquet déclare de lui-même**. Aujourd'hui un
référentiel porte un identifiant, une version, un checksum, un plan, des postes, une table de
passage. Il ne porte **ni sa zone comptable, ni les pays où il s'applique, ni sa devise de
présentation, ni la norme dont il dérive**.

Conséquences immédiates, toutes vérifiables :

1. **Rien ne peut répondre « quel référentiel pour un dossier au Ghana ? »** — la question n'a pas
   de destinataire. Le rattachement pays → référentiel n'existe que dans la tête de celui qui a
   octroyé le pack.
2. **`syscohada-revise@2.1` ne dit pas qu'il vaut pour les 17 États de l'OHADA.** Il est traité comme
   un référentiel togolais parce que le seul paquet fiscal packagé est togolais — deux choses
   différentes que rien ne sépare.
3. **Un référentiel hors OHADA ne peut pas être décrit.** Un plan IFRS for SMEs (Ghana, Nigeria,
   Sierra Leone, Liberia, Gambie, Cabo Verde — six des quinze États de la CEDEAO) n'a ni « système
   normal », ni « SMT », ni cascade SYSCOHADA. Le vocabulaire du produit suppose l'OHADA partout.

## Critères d'acceptation

- [ ] AC-1 — Le `ReferentielPackage` déclare, en `_meta` : `zoneComptable` (`OHADA` · `BCEAO-SFD` ·
      `CIMA` · `IFRS` · `IFRS-PME` · `AUTRE`), `pays[]` (codes **ISO 3166-1 alpha-2**),
      `devisePresentation` (ISO 4217, **ou `null`** si le référentiel est multi-devise),
      `normeSource` (texte + référence officielle) et `statut` (`certifie` · `amorce` ·
      `a-valider-par-expert`).
- [ ] AC-2 — `pays: []` **vide** signifie « aucun pays », jamais « tous ». ⛔ Fail-closed prouvé par
      mutation — même garde que STORY-533 AC-4.
- [ ] AC-3 — Le `build.mjs` **refuse de packager** un référentiel dont le `_meta` est incomplet. La
      garde s'exécute au build, pas au démarrage : un artefact incomplet ne doit pas exister.
- [ ] AC-4 — Les quatre référentiels existants sont renseignés depuis leurs sources, sans rien
      inventer : `syscohada-revise@2.1` (OHADA, 17 pays), `sfd-bceao@2.0` (BCEAO-SFD, 8 pays UEMOA),
      `cima-assurances@1.0` (CIMA, 14 pays), `zone-franche-togo@1.0` (OHADA, `TG`).
      ⚠️ **Aucune modification des plans, des postes ni des tables de passage** — l'ajout est
      strictement métadonnée, et la non-régression des 163 postes / 124 mappings SYSCOHADA le prouve.
- [ ] AC-5 — Une route publie le **catalogue des référentiels** avec ces métadonnées. C'est elle que
      STORY-492 interroge, et c'est elle qui permettra un jour de dire « ce pays n'est pas servi »
      au lieu de laisser un écran vide.

## Conséquences ailleurs

- Rend **STORY-492** (registre des pays) possible : sans `pays[]`, il n'y a rien à indexer.
- ⚡ **Ne coûte rien aujourd'hui et devient impayable plus tard** : renseigner quatre `_meta` sur
  quatre artefacts est une journée ; le faire sur vingt référentiels déjà consommés par des liasses
  figées est une migration d'artefacts avec re-checksum et invalidation de snapshots.

## Notes

- Voir `analyse-referentiels-sfd-zonefranche-cima-2026-07-21.md` (les trois paquets et leurs
  sources), [[STORY-121]], [[STORY-122]], [[STORY-368]] (byte-identité inter-dépôts).

---

## ⚠️ Requalification (2026-09-10) — la fiche date du 27/08, deux stories ont touché ce `_meta` depuis

Mesuré sur les artefacts de `bilan-service` (branche `dev`, avant tout changement) :

| La fiche dit | La valeur réelle |
|---|---|
| « les **quatre** référentiels existants » | ⛔ **six** paquets embarqués : la fiche oublie `sfd-bceao@1.0` (packagé, non attribué) et `smt-togo@1.0`, packagé par STORY-494 **le 2026-09-09 avec le vocabulaire de cette story déjà complet** (zone, pays, devise, norme, statut) |
| `statut` ∈ `certifie` · `amorce` · `a-valider-par-expert` | ⛔ `cima-assurances@1.0` porte depuis STORY-488 une **phrase libre** (« AMORCE — … À VALIDER par un actuaire … »), publiée sur le tampon de **six** routes de `bilan-service` et **deux** de `balance-service` ; le SMT, lui, porte le vocabulaire fermé. Deux formes coexistent sous le même champ |
| « la non-régression des **163** postes / **124** mappings SYSCOHADA » | ⛔ **169** postes / **126** règles depuis STORY-435 (six lignes de structure du TFT) |
| (implicite) renseigner le `_meta` en place | ⚠️ STORY-494 a écrit à trois endroits que c'est **interdit en place** et impose une montée de version — voir **D-491-1**, qui tranche l'inverse |

⚡ **Ce que personne ne lit encore** : `zoneComptable`, `pays`, `devisePresentation` et `normeSource`
sont au type des **deux** dépôts depuis STORY-494 et **aucune ligne de code ne les lit** — ni route, ni
moteur. C'est exactement ce que l'AC-5 ferme : un artefact livré sans chemin d'accès coûte autant qu'un
artefact absent.

## Arbitrages de cadrage

### D-491-1 — révision EN PLACE des cinq artefacts, pas de montée de version

La règle de `docs/referentiels/README.md` (STORY-122) impose une nouvelle version dès qu'un
`code@version` est catalogué ; STORY-494 en a conclu que cette story exigeait `@2.2`, `@2.1`, `@1.1`…
**On ne le fait pas**, pour quatre raisons :

1. ⛔ **Une montée de version n'épargne AUCUN checksum.** L'ancienne version resterait packagée pour
   les octrois et les liasses figées qui la citent — et l'AC-3 interdit de packager un `_meta`
   incomplet. `syscohada-revise@2.1` devrait donc être complété **quand même** : son octet change dans
   les deux options, la montée de version ajoute seulement une seconde copie à maintenir. (L'en sortir
   du générateur pour le figer à la main romprait **D-078-2** : `build.mjs` est la source de vérité
   unique des octets.)
2. **La doctrine est déjà étendue, par écrit** : le manifeste de `bilan-service` révise `@2.1` en place
   « sciemment » depuis STORY-428 — ce qui identifie une liasse figée est son **tampon complet**
   `{code, version, checksum}`, pas la version seule. **Sept** révisions en place l'ont appliquée depuis
   (429, 434, 435, 457, 461, 462 sur `@2.1` et `zone-franche-togo@1.0`, 488 sur `cima-assurances@1.0`),
   « tant qu'aucune migration d'octrois n'est outillée » — c'est toujours le cas.
3. **La fiche elle-même chiffre ainsi** : « renseigner quatre `_meta` sur quatre artefacts est une
   journée ; le faire sur vingt référentiels déjà consommés par des liasses figées est une migration
   d'artefacts avec re-checksum ». Le re-checksum est le coût **différé**, pas celui d'aujourd'hui.
4. Les trois conséquences que le README énumère (divergence avec `ReferentielVersion.checksum` du
   catalogue, hook de lecture **inerte** ; snapshot figé désignant un octet disparu ; faux signal
   `referentielHomogene: false` en comparaison d'exercices) sont celles qu'ont acceptées les sept
   révisions précédentes. En dev, les volumes repartent de zéro (CLAUDE.md).

⇒ Les trois commentaires de STORY-494 qui affirment l'inverse sont **corrigés** (ce sont des
justifications qui instruisent, famille STORY-402), et le README reçoit la note d'extension.

### D-491-2 — `statut` devient le vocabulaire fermé ; la phrase de CIMA devient `miseEnGarde`

Harmoniser `statut` sur l'AC-1 **sans rien ajouter** effacerait du contrat la moitié de l'AC-4 de
STORY-488 — *ce qui* n'est pas couvert et *qui* doit valider, sur la liasse même que l'assureur édite.
La phrase est donc **déplacée à l'identique** (moins le préfixe « AMORCE — », que `statut` porte
désormais) vers un champ `miseEnGarde`, publié par les **mêmes** tampons que `statut`.

Règle de build : **`statut: 'amorce'` exige une `miseEnGarde`** — c'est le raisonnement même de
STORY-488 (« un statut qui dirait amorce sans nommer ce qui manque n'apprendrait rien »).
⚠️ Le nom n'est pas `reserves` : dans un produit d'expertise comptable, « réserves » désigne d'abord le
compte 11.

### D-491-3 — le critère d'attribution du statut, écrit pour pouvoir être contesté

Toutes les sources du dépôt écrivent « amorce » pour presque tout (le README racine qualifie les
référentiels de « brouillons à valider par un expert ») : les suivre à la lettre rendrait le champ
incapable de distinguer quoi que ce soit. Le critère retenu, et **le précédent de STORY-494** (qui a
classé le SMT `a-valider-par-expert` malgré un README qui dit « amorce ») :

| Statut | Critère |
|---|---|
| `certifie` | une validation par un professionnel qualifié est **consignée** — **aucun paquet aujourd'hui** |
| `a-valider-par-expert` | transcription couvrant les états de sa norme, sans validation consignée |
| `amorce` | le paquet **déclare lui-même** ne pas couvrir des parties obligatoires de sa norme |

⇒ `syscohada-revise@2.1`, `zone-franche-togo@1.0`, `sfd-bceao@2.0`, `smt-togo@1.0` :
`a-valider-par-expert`. `cima-assurances@1.0` : `amorce` (provisions techniques, séparation vie/non-vie,
états C1..C25). `sfd-bceao@1.0` : `amorce` — **mesuré** : aucun poste `FORMULE`, ni les totaux
`BAT`/`BPT` ni les soldes intermédiaires `RSA`→`RSG` du DIMF 2080, que `@2.0` ajoute.

⚠️ **Conséquence visible, assumée** : le tampon des liasses SYSCOHADA porte désormais
`statut: 'a-valider-par-expert'` là où il ne portait rien (« absent = transcription arrêtée », STORY-488).
Aucune validation experte n'étant consignée, l'absence affirmait une maturité que rien n'établit.
Le **tampon** des documents figés (jeu d'états, snapshot) ne porte ni `statut` ni `miseEnGarde`.
⚠️ **Corrigé en revue de code** : cette phrase disait « les documents figés ne portent ni l'un ni
l'autre ». Faux pour leur **contenu** — la liasse scellée porte `liasse.statut` depuis STORY-488, et
porte désormais `liasse.miseEnGarde` avec lui (voir *Revue de code*).

### D-491-4 — les listes de pays viennent des sites officiels, pas de la mémoire

| Paquet | Zone | Pays | Source |
|---|---|---|---|
| `syscohada-revise@2.1` | `OHADA` | 17 : BF BJ CD CF CG CI CM GA GN GQ GW KM ML NE SN TD TG | ohada.org — *State Members* |
| `zone-franche-togo@1.0` | `OHADA` | TG | fiche (AC-4) ; régime fiscal togolais |
| `sfd-bceao@1.0` / `@2.0` | `BCEAO-SFD` | 8 : BF BJ CI GW ML NE SN TG | bceao.int — les huit États de l'UMOA |
| `cima-assurances@1.0` | `CIMA` | 14 : BF BJ CF CG CI CM GA GQ GW ML NE SN TD TG | cima-afrique.org — *Les États membres* |
| `smt-togo@1.0` | `OHADA` | TG | inchangé (STORY-494) |

⚠️ **Les Comores ne figurent PAS sur la page officielle de la CIMA** (14 États), alors que plusieurs
sources secondaires en listent 15 en les ajoutant. La page officielle fait foi ; le nombre de l'AC-4
(« 14 pays ») concorde.

### D-491-5 — la devise : `null` quand la zone en compte plusieurs

`syscohada-revise@2.1` → `null` (les 17 États OHADA emploient XOF, XAF, GNF, KMF et CDF) ;
`cima-assurances@1.0` → `null` (XOF et XAF) ; `sfd-bceao@*` → `XOF` (monnaie unique de l'UMOA) ;
`zone-franche-togo@1.0` et `smt-togo@1.0` → `XOF`. La devise d'une **liasse** reste celle de sa
balance (STORY-489/490) : ce champ décrit le référentiel, aucun moteur ne le lit.

### D-491-6 — `syscohada-revise@2.1` vaut pour 17 États… sauf ses deux états fiscaux

Le paquet embarque `RESULTAT_FISCAL` et `LIQUIDATION_IS`, transcrits de la **DSF togolaise** : ils ne
valent pas pour le Bénin. Les en sortir changerait postes et table de passage — **interdit par
l'AC-4**. ⇒ La `normeSource` le **dit** en toutes lettres, et l'écart est porté à STORY-492 (qui
distingue déjà « référentiel oui, paquet fiscal non »).

### D-491-7 — la route : `GET /api/v1/referentiels`, dans `bilan-service`

- **Pourquoi `bilan-service`** : il détient les **six** paquets et le générateur (D-078-2) ;
  `balance-service` n'en recopie que quatre.
- **Chaque paquet est chargé par le `ReferentielLoader`** — checksum vérifié : la route publie ce que
  le moteur sert, jamais une relecture parallèle des fichiers.
- ⚡ **`?pays=XX` répond enfin à « quel référentiel pour un dossier au Ghana ? »** — par `[]`, qui est
  la réponse vraie. C'est **là** que vit la garde de l'AC-2 : un paquet déclarant `pays: []` n'est
  rendu pour **aucun** pays.
- **Gardes** : jeton valide, e-mail vérifié, rôles `PLATFORM_ADMIN`, `TENANT_ADMIN`, `TENANT_USER`.
  **Pas** `@RequiresBilanAccess` : ce sont des métadonnées produit, que la console et l'assistant de
  création de dossier doivent lire **avant** tout octroi.

### D-491-8 — un vocabulaire, une source

Zones et statuts vivent dans **un seul fichier JSON**, lu par `build.mjs` (garde de l'AC-3) **et**
importé par le TypeScript (énumérations OpenAPI, batterie Jest). Deux listes fermées qui coexistent
sont le patron que STORY-488 (AC-1) a nommé « valide contre une liste qu'il ne publie pas ».

## Périmètre

**Inclus** — garde de complétude au build (AC-3) ; `_meta` des cinq paquets à compléter (AC-4) ;
`miseEnGarde` et vocabulaire fermé (D-491-2) ; route catalogue + filtre `pays` fail-closed (AC-2, AC-5) ;
recopie à l'octet des trois artefacts partagés dans `balance-service` et publication de `miseEnGarde`
sur ses deux tampons.

**Hors périmètre** — le registre des pays et le statut `servi`/`partiel` (STORY-492) ; le `<select>`
de l'assistant (FE-082) ; tout paquet IFRS ou IFRS-PME (le vocabulaire le rend **descriptible**, rien
ne le package) ; l'extraction des états fiscaux togolais de `syscohada-revise@2.1` (D-491-6).

**Observé, laissé à STORY-492** — trois autres listes de pays coexistent déjà, aucune dérivée des
paquets : `PAYS_SUPPORTES = ['TG']` (`dossier-service`), `PaquetFiscalRegistry.paysSupportes()`
(`balance-service`), et le champ libre `ReferentielVersion.zone` du catalogue (STORY-149).

🪝 **Hook inerte** : la route catalogue est l'entrée de STORY-492 ; elle ne calcule aucun statut de pays.

---

## Progress Tracking

**Statut : `review`** — démarrée le **2026-09-10**, développée et validée le **2026-09-11** (flux APEX
complet : branches `MNV-491` sur `docs`, `bilan-service`, `balance-service`).

### Ce qui est livré, critère par critère

| | Livré | Preuve |
|---|---|---|
| AC-1 | `_meta` des **six** paquets : `zoneComptable`, `pays`, `devisePresentation`, `normeSource`, `statut` (+ `miseEnGarde` des amorces) | `meta-complete.spec.ts` — valeurs exactes par paquet, vocabulaire publié, ISO 3166-1 contrôlé par les noms de régions ICU |
| AC-2 | `couvrePays` : `[]` ne couvre **aucun** pays ; `?pays=XX` sur la route | mutation A1 (« `[]` vaut tous ») rouge sur 5 tests, dont un paquet synthétique `pays: []` au niveau du service |
| AC-3 | `build.mjs` refuse de packager un `_meta` incomplet ou hors vocabulaire, et nomme **toutes** les fautes | mutations G1→G7 : sept refus, sept messages qui nomment le paquet et le champ |
| AC-4 | cinq paquets complétés depuis leurs sources ; `smt-togo@1.0` inchangé | **hors `meta`, les six artefacts sont identiques octet pour octet à ceux de `dev`** (comparaison ci-dessous) |
| AC-5 | `GET /api/v1/referentiels` (`bilan-service`), chaque paquet chargé par le loader, checksum vérifié | e2e sur la vraie chaîne de guards + contrat confronté à la réponse réelle |

### AC-4 — la non-régression, mesurée et non supposée

Comparaison de chaque artefact régénéré à sa version de `dev`, `meta` exclu : **identique pour les six**
(169 postes / 126 règles / 174 comptes SYSCOHADA, inchangés — la fiche disait 163/124). Seule valeur
préexistante du `meta` à changer : le `statut` de CIMA, déplacé par D-491-2.
⚡ **`smt-togo@1.0` garde son checksum à l'octet** (`c4d0318a…`) : son ordre de clés est devenu l'ordre
canonique du générateur, qui reconstruit désormais le `_meta` dans cet ordre.

| Paquet | Checksum avant → après |
|---|---|
| `syscohada-revise@2.1` | `e9f26eb1…` → `512fab01…` |
| `sfd-bceao@1.0` | `4982504f…` → `efee0a6c…` |
| `sfd-bceao@2.0` | `09b46dcc…` → `91ca19e2…` |
| `zone-franche-togo@1.0` | `15cc9421…` → `1ed4e853…` |
| `cima-assurances@1.0` | `2d4f3061…` → `aaa30313…` → **`9ca429c8…`** (revue de code : norme source corrigée) |
| `smt-togo@1.0` | `c4d0318a…` → **inchangé** |

Recopie à l'octet dans `balance-service` des trois artefacts partagés qui bougent (SYSCOHADA, SFD @2.0,
CIMA) : sha256 identiques des deux côtés, mesurés — les deux PR s'intègrent **ensemble**.

### Points de recopie — trouvés par le compilateur et par les gardes, aucun deviné

- **Huit sites** estampillent un document dans `bilan-service` : `miseEnGarde` est un paramètre **requis**
  de `toEffectiveStamp` (patron 488), le compilateur les a nommés — six routes de production, deux
  documents figés (qui passent `undefined` explicitement, avec la raison).
- ⚠️ **Le type interdit d'OUBLIER la mise en garde, pas de la MAL câbler** : `miseEnGarde: undefined` à la
  place de la variable compilait, et aucune batterie ne tournait sur une amorce. D'où six tests de
  câblage au contrôleur et cinq au moteur — un par route, jamais un seul (mutations T3, T4, T5).
- Deux tampons dans `balance-service` (diagnostic, suggestion), et leurs **deux DTO** : le tampon de la
  suggestion est recopié par épandage, donc le champ serait parti dans le JSON sans être au schéma —
  le défaut de STORY-488, rejoué d'office (mutation B5).

### Ce que les gardes existantes ont attrapé toutes seules

- ⚡ **L'invariant de portée dossier (STORY-357) a rougi sur la route catalogue** — il exige que tout
  contrôleur du module Bilan soit niché sous le dossier. L'exception est **nommée** (liste, pas motif) et
  gardée par un test qui exige qu'elle existe et ne réclame pas le scope. ⛔ Et un piège au passage :
  l'invariant classe les contrôleurs sur leur **source** — mon commentaire, qui citait le gabarit du
  chemin niché pour dire que la route n'en était pas, suffisait à faire passer le fichier pour niché.
- ⚡ **`DIGESTS_EPINGLES` ne gardait pas `smt-togo@1.0`** depuis STORY-494 : la liste des fichiers était
  écrite à la main. Elle est désormais **découverte dans le manifeste** (mutation C6).
- Le contrat de `bilan-service` confronte déjà la réponse réelle du Bilan **SFD-BCEAO @1.0** à son schéma
  (AC-8 de 398) : `sfd-bceao@1.0` étant devenu une amorce, cette garde vérifie gratuitement que la mise en
  garde servie sur une route de production est **décrite** au contrat — elle a rougi sous la mutation C2.

### Table de mutations — 31 rouges par assertion, 7 refus du générateur

| # | Mutation | Résultat |
|---|---|---|
| G1–G7 | `pays` absent · devise absente (≠ `null`) · amorce sans mise en garde · clé `statutt` · zone `SYSCOHADA` · pays `tg` · pays en double | **7 REFUS** au build, message nommant paquet et champ |
| G8 | garde du générateur **retirée** + `pays` absent, artefact régénéré, checksum propagé | ROUGE — `meta-complete` + service catalogue, **indépendamment** du générateur |
| G9 | le générateur recopie le vocabulaire en dur | ROUGE |
| A1 | `pays: []` vaut « tous » | ROUGE (5) |
| A2 | le service ignore le filtre | ROUGE (4) |
| A3 / A4 | la projection fabrique `pays: []` / `devisePresentation: null` au lieu de refuser | ROUGE / ROUGE |
| A5 | le service sort des providers de `BilanModule` | ROUGE (garde de câblage, patron 484) |
| T1 / T2 | tampon sans mise en garde / clé publiée vide | ROUGE / ROUGE (3) |
| T3 / T4 / T5 | TFT, diagnostic, notes : mise en garde perdue en route | ROUGE × 3 |
| C1 / C2 | zone sans énumération nommée / `miseEnGarde` hors schéma du tampon | ROUGE / ROUGE |
| C3 | motif ISO du paramètre `pays` desserré | ROUGE (e2e 400) |
| C4 | `@RequiresBilanAccess` posé sur le catalogue | ROUGE (une organisation sans octroi reçoit 403) |
| C5 | le gabarit du chemin niché cité dans le contrôleur | ROUGE (invariant 357) |
| C6 | `smt-togo@1.0` retiré de l'épinglage | ROUGE |
| B1–B6 | balance : câblage suggestion, câblage diagnostic, tampon, `amorce` perdu du vocabulaire recopié, `miseEnGarde` hors schéma, `statut` redevenu `string` nu | ROUGE × 6 |

⛔ **Deux mutations ont d'abord MENTI, et c'est consigné** :
- **T3 est d'abord sorti ROUGE PAR COMPILATION** — la variable devenue inutilisée déclenchait
  `noUnusedLocals`. Un rouge de compilation ne prouve rien ; rejouée sous une forme qui compile
  (`miseEnGarde && undefined`), elle rougit par assertion.
- **G8 a d'abord échoué au build — par ACCIDENT** : la ligne de journal `pays.length` du générateur lève
  un `TypeError` quand `pays` manque. Une garde accidentelle n'est pas une garde : la mutation a été
  rejouée en neutralisant ce journal, et c'est la batterie Jest qui a rougi, seule.

### Vérification docker — stack réelle, code de la branche

Cette story **n'écrit rien en base** : la vérification porte sur ce qu'aucun e2e ne prouve.
⚠️ Mongo, Kafka et Redis étaient arrêtés depuis sept heures, les services applicatifs tournant à vide :
infra relancée, services redémarrés, stack passée sous Portly (`PROSPERA/stack`).

| # | Ce qui est prouvé | Mesuré |
|---|---|---|
| ① | **L'application démarre** — aucun e2e ne monte `BilanModule` | `ReferentielCatalogueController {/api/referentiels}` monté, `Nest application successfully started` |
| ② | La route est gardée dans l'application réelle | `GET /api/v1/referentiels` et `?pays=GH` sans jeton → **401** |
| ③ | Le contrat **servi** par `bilan-service` en marche | route + paramètre `pays` + sécurité bearer ; `ReferentielCatalogueDto` 10 champs requis ; `ZoneComptable` et `StatutReferentiel` publiés ; tampon `{code, version, checksum, statut, miseEnGarde}` |
| ④ | Le contrat **servi** par `balance-service` en marche | ses deux tampons publient `statut` → `StatutReferentiel` et `miseEnGarde` |
| ⑤ | Les octets servis sont ceux de la branche | sha256 des assets **dans les deux conteneurs** = registres ; les quatre artefacts partagés byte-identiques |

⚠️ **Non rejoué en docker, et dit comme tel** : l'appel **authentifié** par un jeton de l'IdP réel — il
exige un compte sur `auth-service`, et aucune écriture en base ne le rend obligatoire. Il est prouvé par
l'e2e `referentiels-catalogue`, sur la vraie chaîne de guards (jeton RS256, e-mail vérifié, rôles, gate
Bilan, portée dossier), avec les artefacts réels.

### Portes

| Dépôt | Lint | Build | Unit | E2E | Couverture (st/br/fn/li) |
|---|---|---|---|---|---|
| `bilan-service` | 0 | ✅ | 2758 (+1 skip préexistant) | 816 | 99.19 / 95.34 / 99.37 / 99.26 |
| `balance-service` | 0 | ✅ | 3765 | 905 | 99.14 / 92.51 / 98.48 / 99.25 |

Seuils 65 / 90 / 90 / 90 : tenus, aucun abaissement.

### Décisions prises pendant le développement

- **La confidentialité d'une source** : le nom du classeur GUIDEF dont la liasse SYSCOHADA est extraite
  porte l'**identifiant fiscal d'un contribuable**. Il n'est pas repris dans `normeSource`, que la route
  catalogue sert à **toutes** les organisations.
- **Une seconde porte à la projection** (`versEntreeCatalogue`) : elle **refuse** un `_meta` incomplet au
  lieu de le compléter — le port `ArtifactSource` est le seam d'un registre distant, et le catalogue sait
  déjà héberger des paquets déposés par la console (STORY-149), qui ne passeraient pas par `build.mjs`.
- **`miseEnGarde` est facultative hors amorce** au générateur ; aujourd'hui seules les deux amorces en
  portent une.

---

## Revue de code (phase ⑥) — 5 constats, 5 corrigés, dont 1 bloquant

Scan délégué au skill `prospera-code-review` (préparation `haiku`, analyse `opus`), puis seconde lentille
`ponytail-review` ; synthèse, vérification et correctifs dans la session. ⚠️ Une première passe du
sous-agent d'analyse a été **coupée par une limite d'API** sans rendre de rapport : relancée, avec
consignation des constats au fil de l'eau.

### ① ⛔ BLOQUANT — la norme CIMA renvoyait au mauvais livre du Code

La `normeSource` de `cima-assurances@1.0` citait « Livre III, Titre IV, Chapitre III ». **Vérifié sur
cima-afrique.org** : le Chapitre III « Plan comptable particulier à l'assurance et à la capitalisation »
est au **Livre IV** (« Règles comptables applicables aux organismes d'assurance »), qui se divise
directement en chapitres ; le Titre IV du Livre III s'intitule « Dispositions transitoires ».

⚡⚡ **L'erreur venait du dépôt lui-même** — `README-cima-assurances.md` (STORY-122), recopié tel quel. La
fiche exigeait des métadonnées « renseignées depuis leurs sources, sans rien inventer » : je n'ai rien
inventé, j'ai **transmis** une erreur, que le checksum aurait scellée dans deux dépôts et que la route
catalogue aurait servie à toutes les organisations. **Une référence recopiée d'un README n'est pas une
référence vérifiée** — les listes de pays, elles, avaient été relevées sur les pages officielles ; la
norme ne l'avait pas été. Corrigé à la source (le README) **et** dans l'artefact (`aaa30313…` →
`9ca429c8…`, recopié à l'octet), référence épinglée par un test (mutation R1 : rouge).

### ② La liasse SCELLÉE perdait la mise en garde

`produireLiasseComplete` rendait `statut` sans `miseEnGarde`. Je l'avais laissée de côté en la croyant
**sans lecteur** — c'était faux : `valider()` fige la `LiasseProduite` **entière** dans
`snapshots_liasse.liasse`, l'empreinte la couvre, et `GET …/versions/:version` la ressert. Une liasse CIMA
validée aurait scellé `amorce` **sans ce qu'elle ne couvre pas** — exactement la perte que D-491-2 évite
sur les tampons. Corrigé ; sixième production gardée par le test du moteur (mutation R2 : rouge).
⚠️ **Vérifié avant correction** : `liasse` est un chemin `Mixed`, où le pilote peut écrire `undefined` en
`null` (mesure de STORY-460) — ce qui fausserait l'empreinte, calculée en mémoire. Lecture seule en base :
le snapshot scellé le 2026-09-10 **avec** le code de STORY-488 ne porte pas de clé `statut` ; ce chemin
d'écriture jette donc `undefined`, et la correction ne fabrique aucun `null`.
Et les deux commentaires qui affirmaient que « le snapshot ne stocke pas le statut du paquet » sont
corrigés : seul le **tampon** des documents figés ne le recopie pas (🪝 le lire depuis la liasse scellée =
story à part).

### ③ ④ ⑤ Trois descriptions devenues fausses par la story

| # | Où | Ce qu'elle disait |
|---|---|---|
| ③ | docstring du tampon, deux dépôts | `statut` « présent sur les seuls référentiels qui ne sont pas une transcription arrêtée » |
| ④ | description OpenAPI du tampon de diagnostic (`balance-service`) | `{code, version, checksum, statut}`, la « seule mise en garde réglementaire » étant dans `statut` |
| ⑤ | trois descriptions de `miseEnGarde` | « absente sinon » — alors que le générateur l'accepte hors amorce |

### Ponytail — un constat retenu, un laissé

- **Retenu** : la ligne de journal `meta` du générateur, retirée. Elle levait un `TypeError` quand `pays`
  manquait — la garde **accidentelle** qui avait d'abord masqué la mutation G8.
- **Laissé, préexistant** : `balance-service` décrit le même tampon par **deux** DTO
  (`EffectiveReferentielStampDto`, `TamponReferentielDto`), auxquels cette story ajoute `miseEnGarde` en
  double. Les fusionner est une story à part.

### Pistes écartées par la revue, après vérification

Non-régression hors `meta` des six artefacts ; byte-identité inter-dépôts ; les 8 + 2 sites
d'estampillage ; cache du loader (non borné, les six paquets n'évincent rien) ; listes de pays et
devises ; noms de fichiers et de fonctions cités par les docstrings (tous existent) ; `meta-vocabulaire.json` bien
émis dans `dist` ; aucune perturbation de l'empreinte, de la comparaison de versions ni de la comparaison
d'exercices par le `statut` désormais scellé.
