# STORY-513 : Contrats et quittances — émettre n'est pas encaisser

Status: in_progress

**Complexité :** high

**Épic :** EPIC-129 — Contrats, primes et quittances
**Service :** `assurance-service`
**Points :** 8 · **Sprint :** S20
**Origine :** découpage `epics-assurance-2026-08-27.md`.

---

## Le fait

En assurance, le **cycle est inversé** : l'assureur encaisse d'abord et paie ensuite, parfois des
années après. Toute la comptabilité du secteur découle de là, et la première conséquence est
comptable : **une prime émise n'est pas une prime encaissée, et ni l'une ni l'autre n'est une prime
acquise** (STORY-514).

Trois objets, trois moments :

| Objet | Moment | Effet |
|---|---|---|
| **Contrat** | souscription | crée l'engagement, aucun produit |
| **Quittance** | émission | crée une **créance** sur l'assuré et un **produit** (compte `70`) |
| **Encaissement** | règlement | solde la créance, **aucun produit** |

⚠️ Le compte `70` (« Primes ou cotisations ») du plan CIMA est mappé au poste `RP1`. C'est
l'**émission** qui l'alimente, pas l'encaissement — s'y tromper décale tout le résultat.

## Cadrage mesuré avant de coder (2026-09-20)

### M1 — ⛔⛔ Les deux comptes dont l'AC-4 a besoin ne sont routés vers AUCUN poste

L'AC-4 demande de distinguer les ristournes et annulations **de l'exercice** de celles portant sur des
**exercices antérieurs**, « elles ne s'imputent pas au même endroit ». Les deux endroits existent au
plan CIMA :

| Compte | Libellé | Ce qu'il porte |
|---|---|---|
| `73` | Réductions et ristournes de primes | les ristournes **de l'exercice** |
| `82` | Pertes et profits sur exercices antérieurs | celles portant sur un exercice **clos** |

⛔ **Ni l'un ni l'autre n'est mappé dans la table de passage de `cima-assurances@1.0`.** Mesuré sur
l'artefact : **11 comptes déclarés `racinesDeGestion` ne sont routés vers aucun poste** — `69`, `73`,
`74`, `78`, `79`, `80`, `82`, `83`, `84`, `85`, `86`. La table ne route que `60`→`68`, `70`, `71`,
`75`, `76`, `77`.

⇒ Une ristourne portée au `73` serait un **compte non mappé** : la balance la porterait, la liasse la
perdrait, et `RP1` « Primes ou cotisations » **surévaluerait les primes** sans qu'aucun contrôle ne
bronche (`CAT = CPT` resterait vrai). C'est le patron de STORY-486, sur un autre artefact.

⚠️ **Cela ne bloque pas cette story** — elle n'écrit pas la liasse — mais cela **borne** ce que l'AC-4
peut promettre : la distinction est **enregistrée et interrogeable**, elle n'est pas encore
**présentée**. Le routage part en **STORY-672**.

### M2 — Le patron du service jumeau : aucun compte comptable dans l'agrégat

`microfinance-service` a tranché deux fois la même question (**D-499-D**, **D-500-E**) : un agrégat
monétaire **ne porte aucun numéro de compte**. Le choix appartient à l'**adaptateur de balance**
(AD-5), qui les désignera depuis le référentiel **du dossier** (AD-8). Le motif y est écrit noir sur
blanc : « un numéro codé ici, validé contre le mauvais plan, *ne raterait jamais* ».

⇒ Même décision ici (**D-513-1**). L'AC-3 (« émettre crée une créance et un produit ; encaisser n'en
crée aucun ») se tient **sans** numéro de compte : c'est l'**effet économique** de l'événement qui est
typé, daté et testé — pas son imputation.

### M3 — L'outbox est un hook inerte, et le reste

`assurance-service` embarque l'outbox transactionnel depuis STORY-511, **sans aucun producteur**
(hook inerte documenté). L'AC-3 ne demande **aucun** événement inter-services, et AD-5 réserve la
publication à la balance canonique d'une story ultérieure. ⇒ **Rien n'est publié ici** ; l'outbox
reste inerte.

### M4 — La devise ne s'invente pas

Aucune constante `XOF` (STORY-489, AC-5 de STORY-511) : la zone CIMA couvre 14 États, dont des pays
hors franc CFA, et `cima-assurances@1.0` déclare `devisePresentation: null`. Les montants portent
**devise + exposant**, comme les dépôts de `microfinance-service`.

⚠️ **Et le piège de STORY-495 s'applique** : `maxDecimalPlaces` compte les décimales via `toString()`,
si bien que `1.5e-7` est **accepté puis lu `0`**. Tout montant et tout taux de fractionnement doivent
être bornés sur leur **notation**, pas sur leur seule valeur.

## Décisions de cadrage du 2026-09-20 — à relire en revue

| # | Décision | Pourquoi |
|---|---|---|
| **D-513-1** | ⛔ **Aucun numéro de compte comptable** dans `contrats`, `quittances` ni `encaissements` | D-499-D / D-500-E, à l'identique. L'imputation appartient à l'adaptateur de balance (AD-5), qui la tire du référentiel du dossier (AD-8) |
| **D-513-2** | L'AC-3 se prouve sur l'**effet économique typé**, pas sur une écriture | `EMISSION` ⇒ créance **et** produit ; `ENCAISSEMENT` ⇒ extinction de créance, **aucun** produit. Deux fonctions pures, testées, sans compte |
| **D-513-3** | Les quittances sont **append-only**, comme `mouvements_depot` | Une annulation est une **quittance d'annulation** (AC-2). Le repository n'expose ni update ni delete, et le schéma refuse en plus toute réécriture — l'absence du chemin de code est la garantie, le hook est le dernier rideau |
| **D-513-4** | Le **rattachement à l'exercice** est porté par la quittance, distinct de sa date d'émission | C'est ce qui permet l'AC-4. ⚠️ Il se lit sur `exercices_dossier` (AD-7), **jamais** `exercices_atelier` |
| **D-513-5** | La **période couverte** (début, fin) est **obligatoire** sur toute quittance de prime | AC-5 : c'est elle, pas la date d'émission, qui alimentera la PPNA (STORY-514). La rendre optionnelle aujourd'hui rendrait 514 incalculable sur l'historique |
| **D-513-6** | Le routage de `73` et `82` vers la liasse part en **STORY-672** | Hors périmètre ici (cette story n'écrit pas la liasse), et c'est un changement d'**octets** de l'artefact : version, checksum, trois dépôts |

## Périmètre

### Livré

- Agrégat **contrat** : souscripteur, **catégorie Vie / Non-Vie** (AD-3, structurante), dates d'effet
  et d'échéance, périodicité, fractionnement, intermédiaire.
- Agrégat **quittance**, **append-only** : contrat, **période couverte**, montant, accessoires, taxes,
  état (`EMISE`, `ENCAISSEE`, `ANNULEE`, `IMPAYEE`), type (`PRIME`, `ANNULATION`, `RISTOURNE`), et le
  **rattachement d'exercice** qui distingue l'exercice courant d'un exercice antérieur.
- **Encaissement** : événement distinct, qui solde une créance et ne crée **aucun** produit.
- Les prédicats d'**effet économique** (D-513-2), purs et testés.
- Routes sous `dossiers/:dossierId/assurance`, derrière la chaîne de guards complète et la portée
  dossier ; **route littérale déclarée AVANT toute route paramétrée du même verbe**.

### Hors périmètre

- ⛔ Toute **imputation comptable** et toute **balance** (AD-5, D-513-1) — hook inerte documenté.
- ⛔ Le **routage de `73` et `82`** dans la liasse → **STORY-672**.
- La **provision pour primes non acquises** → STORY-514 (cette story lui **livre** la période couverte).
- Sinistres (EPIC-130), provisions techniques (EPIC-131), réassurance (EPIC-132), étanchéité Vie/Non-Vie
  au sens des deux comptes techniques (STORY-521), états art. 433 (EPIC-134).
- ⚠️ **Tarification, souscription au guichet, gestion commerciale** (AC-6, Q1) : la comptabilité de
  l'assurance, pas l'assurance.
- Tout **calcul actuariel** (AD-12).

## Critères d'acceptation

- [ ] AC-1 — Contrat : souscripteur, catégorie (**Vie / Non-Vie**, structurant — AD-3), dates
      d'effet et d'échéance, périodicité, **fractionnement**, intermédiaire.
- [ ] AC-2 — Quittance : période couverte, montant, accessoires et taxes, état (émise, encaissée,
      annulée, impayée). Les quittances sont **append-only** : une annulation est une quittance
      d'annulation, pas une suppression.
- [ ] AC-3 — ⛔ **L'émission et l'encaissement sont deux événements distincts**, et un test le
      prouve : émettre sans encaisser crée une créance et un produit ; encaisser ne crée aucun
      produit.
- [ ] AC-4 — Les **ristournes** et les annulations de l'exercice se distinguent de celles portant sur
      des exercices antérieurs — elles ne s'imputent pas au même endroit.
- [ ] AC-5 — La **période couverte** par la quittance est portée : c'est elle, et non la date
      d'émission, qui alimentera la provision pour primes non acquises (STORY-514).
- [ ] AC-6 — ⚠️ Périmètre : **la comptabilité de l'assurance, pas l'assurance** (Q1). Ni tarification,
      ni souscription au guichet, ni gestion commerciale.

## Table de mutations obligatoire

**13 mutations appliquées sur l'état final**, chacune prouvée rouge puis restaurée.
⚠️ **Trois n'ont RIEN mesuré à la première passe**, et c'est ce qu'elles ont révélé qui compte.
⚠️ **Deux formulations ne compilaient pas** — « 0 test », jamais un rouge (leçon STORY-505) — et ont été
reformulées.

| ID | Mutation appliquée | Résultat |
|---|---|---|
| M1 | L'encaissement crée un produit | **5 rouges** — AC-3 |
| M2 | L'émission ne crée aucun produit | **4 rouges** — AC-3, l'autre sens |
| M3 | `updateOne` retiré des opérations interceptées | **1 rouge** — append-only |
| M4 | Le hook de refus ne refuse plus le bon message | **1 rouge** |
| M5 | La garde « période couverte manquante » neutralisée | ⛔ **VERT** à la 1ʳᵉ passe (voir ci-dessous) → **2 rouges** après renforcement |
| M6 | La ristourne d'exercice antérieur s'impute comme celle de l'exercice | ⚠️ **ne compilait pas** (`courant` devenu inutilisé) → reformulée → **4 rouges** — AC-4 |
| M7 | `@Get(':contratId')` remontée en **première** route | ⛔ **e2e ENTIÈREMENT VERT** (voir ci-dessous) ; **1 rouge** sur le test de convention |
| M8 | Lire `exercices_atelier` au lieu d'`exercices_dossier` | **1 rouge** — AD-7 |
| M9 | Repli sur un code du franc CFA quand le dossier n'en déclare aucune | **5 rouges** |
| M10 | `estMontantRecevable` accepte la notation exponentielle | **3 rouges** — piège STORY-495 |
| M11 | Répondre **403** au lieu de **404** hors portée | ⛔ **VERT en unitaire** ; **1 rouge en e2e** |
| M12 | Le **verrou** remplacé par une simple lecture | **2 rouges** |
| M13 | La devise du dossier n'est plus confrontée | ⚠️ **ne compilait pas** → reformulée → **1 rouge** |

### ⛔ M5 — un second contrôle masquait le premier

Neutraliser la garde « champs manquants » laissait la suite **entièrement verte** : la seconde garde
(`periodeEstRecevable`, sur des dates invalides) rendait le **même code de refus**, et le test — qui
n'assertait que le code — ne voyait rien. Les deux contrôles ne disent pourtant pas la même chose à
l'appelant : l'un **nomme les champs absents**, l'autre la durée maximale. ⇒ Test renforcé sur les
**détails**. C'est exactement le patron « un test qu'un code bugué franchit », dans sa forme la plus
discrète : le test était juste, il mesurait simplement autre chose que ce qu'il annonçait.

### ⛔ M7 — le piège de l'ordre des routes est INERTE dans ce contrôleur

Remonter `@Get(':contratId')` en **première** position laisse l'**e2e entièrement vert**. Mesuré, puis
expliqué : **aucune route littérale n'a la même profondeur** que `contrats/:contratId` — un paramètre
n'avale qu'**un** segment, et `contrats/…/quittances/…/situation` en a trois de plus. Le piège classique
(`@Get(':id')` avant `@Get('me')`) suppose des routes de **même** profondeur.

⚠️ **Le commentaire du contrôleur affirmait le contraire** (« `@Get(':contratId')` posé avant
`@Get('contrats/…/situation')` **avalerait** la seconde ») : **corrigé**. Une affirmation en gras qui ne
tient pas est le défaut le plus coûteux de ce dépôt — c'est la deuxième de cette story après celle sur
la devise du dossier.

⛔ **Le test de convention garde tout son sens**, mais pour le jour où un `contrats/resume` apparaîtra —
pas pour aujourd'hui. Il rougit, lui, et c'est ce qu'on lui demande.

### ⚠️ M11 — l'anti-énumération n'est protégée qu'en e2e

Répondre `403` au lieu de `404` ne rougit sur **aucun** test unitaire : ceux-ci assertent le **code** de
refus, pas le **statut HTTP**. L'e2e, lui, rougit. C'est le bon niveau — le statut est un fait de
transport — mais il fallait le mesurer pour le savoir, et non le supposer.

## Definition of Done

- [x] Statut synchronisé dans ce document, `sprint-status.yaml` et le présent Progress Tracking.
- [x] Lint 0 warning, build, couverture ≥ 65/90/90/90, unit + e2e verts ; **chaque fichier neuf couvert**.
- [x] M1 à M13 (13 mutations) appliquées sur l'état **final**, prouvées rouges, puis restaurées.
- [x] ⛔ **Vérification docker réelle** : la story écrit en base. Documents comptés en `mongosh`,
      invariants, liens contrat ↔ quittance ↔ encaissement, **aucun orphelin après échec**, et
      l'append-only éprouvé sur Mongo réel (⚠️ piège STORY-500 : `timestamps.createdAt` injecte un
      `$setOnInsert` dans **chaque** update et peut faire refuser un hook d'immuabilité qui marchait
      en test).
- [x] Aucun numéro de compte comptable dans le code, les schémas ni les fixtures (D-513-1).
- [x] Outbox toujours inerte : aucun producteur ajouté.
- [x] STORY-672 créée et slottée.
- [ ] Revue de code et revue de sécurité sans constat ouvert.
- [ ] PR module vers `dev`, PR docs vers `main`, rebase-merge, branches supprimées.

## Progress Tracking

- **Statut courant :** `in_progress` — ouverte le **2026-09-20**.
- **2026-09-20 — cadrage mesuré :** branche `MNV-513` sur `docs`. Prérequis STORY-511 `done`,
  STORY-512 `done` le jour même. Artefact `cima-assurances@1.0` dépouillé : **11 comptes de gestion
  déclarés ne sont routés vers aucun poste**, dont `73` et `82` — exactement les deux dont l'AC-4 a
  besoin. Patron « aucun compte comptable dans l'agrégat » relevé chez le jumeau microfinance
  (D-499-D, D-500-E) et repris en D-513-1. Six décisions : D-513-1 à D-513-6.
- **2026-09-20 — dev :** branche `MNV-513` sur `assurance-service`. Trois collections
  (`contrats`, `quittances`, `encaissements`), neuf routes, 15 codes de refus, un verrou logique
  transactionnel. ⛔ Aucun numéro de compte, aucune constante de devise, aucun producteur Kafka.
- **2026-09-20 — deux défauts trouvés à la relecture de la couche livrée, tous deux silencieux :**
  - ⚡⚡ **la devise du contrat n'était pas confrontée à celle du dossier.** Le commentaire qui le
    justifiait (« le dossier n'en publie pas encore ») était **faux** : le guard recopie bien `devise`
    dans la portée, et le harnais e2e porte `gnf` sur un dossier et `xof` sur un autre. Un contrat en
    `EUR` sur un dossier `GNF` passait, et l'écart ne se voyait ni à la balance ni au contrat HTTP.
    ⇒ Branché, et c'est `devise.ts` lui-même qui désignait « le premier agrégat monétaire » — cette
    story — comme celle devant le faire.
  - ⚡⚡ **aucun verrou, donc une course comptable.** Deux ristournes concurrentes de 100 sur un reste
    dû de 150 passaient toutes deux et totalisaient 200 : le `Math.max(0, …)` de `resteDu` ne corrige
    pas, il **masque** (l'état affiche `ENCAISSEE`). L'argument avancé — « aucun code de refus pour la
    concurrence » — ne tenait pas : l'exécuteur de transactions existe déjà dans le dépôt, le jumeau
    applique ce patron, et le code manquant se crée. ⇒ Verrou logique sur le contrat
    (`$inc: revision`, **`timestamps: false`** — piège STORY-500) et `CONTRAT_ECRITURE_CONCURRENTE`.
- **2026-09-20 — portes DoD :** lint 0 warning, build OK, **1 045 unit + 31 e2e verts**.
  Couverture globale **99,23 / 92,51 / 98,07 / 99,28** ; par fichier, service **98,96 / 78,94 / 97,72 /
  98,94** et `texte-contrat.ts` **100 %**.
- **2026-09-20 — ⛔ VÉRIFICATION DOCKER, et l'atomicité est prouvée par un COMPTEUR.** Stack réelle
  (mongo + kafka + auth-service + assurance-service), jeton **RS256 réel** obtenu par
  `register` → `login`, read-models semés en `mongosh`, cycle complet exercé par HTTP.

  | Contrôle | Mesure |
  |---|---|
  | documents écrits | 1 contrat, 2 quittances (`PRIME` + `ANNULATION`), 2 encaissements |
  | liens | quittance → contrat, encaissement → quittance : **tous vérifiés** |
  | orphelins | **0** dans les deux sens |
  | `etat` en base | **absent** — il se dérive (AC-2) |
  | `updatedAt` sur les append-only | **absent** |
  | numéro de compte comptable | **aucun**, dans les trois collections |
  | `outbox_events` | **0** — l'outbox reste inerte (M3 du cadrage) |
  | index construits | dont le partiel unique `{quittanceVisee} WHERE type=ANNULATION` |

  ⚡⚡ **`revision = 4`.** Le verrou s'incrémente à chaque écriture verrouillée. Quatre opérations ont
  **réussi** (émission, encaissement, annulation, remboursement) et **trois** ont été **refusées**
  (ristourne excessive, seconde annulation, encaissement sur quittance annulée). Le compteur à **4**
  — et non 7 — prouve que les trois refus ont **avorté leur transaction** : leur `$inc` a été annulé.
  ⛔ C'est l'atomicité **mesurée**, pas affirmée sur la foi d'un `abortTransaction()` appelé sur un mock.
  Et c'est aussi la preuve que `timestamps: false` était indispensable : sans lui, le piège STORY-500
  aurait fait refuser le verrou par Mongo réel, avec toutes les suites mockées au vert.

  ⚠️ **Relevé au passage, et il coûtera du temps à qui l'ignore** : le claim `emailVerified` du jeton
  se calcule sur **`emailVerifiedAt`** dans `auth_service.users`, **pas** sur un champ `emailVerified`.
  Poser le mauvais champ rend un jeton qui traverse l'IdP et se fait refuser en `403 EMAIL_NOT_VERIFIED`
  par le service aval, sans que rien ne dise pourquoi. Stack arrêtée après vérification.
- **2026-09-20 — PR ouverte :** `prospera-assurance-service#3`, base `dev`.

## Notes

- Voir [[STORY-514]] (la PPNA, qui consomme la période couverte), [[STORY-521]] (l'étanchéité
  Vie/Non-Vie), [[STORY-672]] (le routage de `73` et `82`), [[STORY-500]] (le patron append-only),
  spine AD-1, AD-3, AD-5, AD-7, AD-8, AD-12.
