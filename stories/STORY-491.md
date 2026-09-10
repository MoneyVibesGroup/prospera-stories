# STORY-491 : Le manifeste d'un référentiel ne dit ni sa zone, ni ses pays, ni sa devise, ni la norme dont il dérive

Status: in_progress

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
Les documents **figés** (jeu d'états, snapshot) ne portent toujours ni `statut` ni `miseEnGarde` :
ils rendent ce avec quoi ils ont été scellés.

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

**Statut : `in_progress`** — démarrée le **2026-09-10** (flux APEX complet : branches `MNV-491` sur
`docs`, `bilan-service`, `balance-service`).
