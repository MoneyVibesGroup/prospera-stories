# STORY-1060 : un calendrier propre à chaque organisation — jours travaillés et jours fériés, paramètre C6 lu par le plan de journée et par la résolution à l'import

Status: in-progress

**Épic :** EPIC-226 (le jeu « Grossiste du Golfe », ses plans de journée) et EPIC-233 (les tournées, plan de journée) ;
spine distributeur AD-12 · **Dépôts :** `prospera-plateforme` (dossier `contrats/distributeur/`, tenu par D),
`prospera-terrain-service` (module `terrain`) · **Plage :** groupe D, n° 1 du lot 4
(`PLAN-4-SESSIONS-LOT-4-2026-11-18.md` §4). **Dépend de :** rien (STORY-1058, `terrain` `dev` 068e1c0, est le point de
départ). **Suivante :** STORY-1061 🚚 (la facture juste (2)).

**Sources :** réponse de l'utilisateur à Q-D-9 (journal de A, « → D (2026-11-18) » : **Q-D-9 renversée**, « un calendrier
propre à chaque organisation (jours travaillés, jours fériés), dès maintenant, paramètre C6 lu par le plan de journée et
par la résolution à l'import ») ; PRD distributeur FR-9 (« un plan de journée pour aujourd'hui et pour les dix jours
ouvrés suivants »), FR-85 (« les jours ouvrés viennent d'un calendrier de l'organisation (dimanche non travaillé, jours
fériés déclarés) ») ; spine distributeur AD-12 (paramètres versionnés par organisation, figés à l'acte), conventions
(« Paramètres : un document versionné par module ») ; contrat de module C6 (se paramétrer par des données), C7 (droits) ;
fiche STORY-1058 (D-1058-7 : « 0 = le jour de l'import, puis les dix jours suivants hors dimanche » ; « Ce qui reste » :
« le jour chômé (dimanche) est une règle de la route d'import ; les jours fériés du Togo n'y sont pas ») ; patrons
STORY-1049 (`commande_parametres`) et STORY-1053 (règle copiée à l'octet, droit propre `commande:parametres:modifier`).

## Ce qui était codé en dur (le point de départ)

- `prospera-terrain-service`, `src/modules/terrain/instance/part-terrain.ts`, `dateDuJourOuvre(maintenant, jourOuvre)`
  (STORY-1058, `dev` 068e1c0) : « les suivants sautent le dimanche » (`getUTCDay() !== 0`), samedi travaillé, aucun
  jour férié. La route C13 d'import de `terrain` datait ainsi chaque plan de journée du jeu (`jourOuvre` → `date`).
- Le générateur du jeu (`prospera-plateforme/jeux-demonstration/grossiste-golfe/generateur/`) n'écrit que des jours
  **relatifs** (`jourOuvre` 0 → 10) : il ne porte aucune règle de calendrier et ne change pas.

## Où en est-on (pour une reprise après interruption)

- [x] Rituel : plan du lot 4, règles, journaux de A, B, C, D (réponses de l'utilisateur à Q-D-1 → 10, lues), fiche 1058.
- [x] Règle du calendrier dans la plateforme (branche `MNV-1060`), 18 tests, 16/16 mutations.
- [x] `terrain` : copie, paramètres, import, routes, tests (branche `MNV-1060`).
- [ ] Annonce « ⚠ Contrats » fusionnée avant le code (cette PR, avec le manifeste `terrain` amendé).
- [ ] Plateforme : PR fusionnée en rebase, étiquette `calendrier-distributeur-v1`.
- [ ] `terrain` : copie et manifeste rattachés aux commits fusionnés ; Node 24 ; mutations ; `docker compose up` (§1.5) ;
  PR fusionnée en rebase.
- [ ] PR de docs finale.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | **Une seule règle du calendrier**, dans la plateforme (`contrats/distributeur/src/calendrier.ts`, étiquette `calendrier-distributeur-v1`) : forme fermée (jours travaillés ; jours fériés `FIXE`, `PAQUES`, `DATE`), chaque défaut nommé, valeur par défaut, jour ouvré, date du n-ième jour ouvré, nombre de jours ouvrés d'une période, Pâques grégorien | tests de la plateforme, Node 24 ; mutations |
| AC-2 | **`terrain` la copie à l'octet** (`src/socle/calendrier/`), empreinte écrite dans un test, vecteurs rejoués ; hors lint et formatage | unitaires |
| AC-3 | **Le calendrier est un paramètre versionné de l'organisation** (`terrain_parametres`, AD-12) : `GET /api/v1/terrain/parametres` (la version 1, valeurs de la démo, posée à la première lecture), `GET …/parametres/versions/{version}`, `PUT …/parametres` (version lue exigée, valeurs validées, nouvelle version tracée dans `terrain_audit`) ; deux changements simultanés : un seul passe | unitaires ; MongoDB réel ; e2e ; pile |
| AC-4 | **La résolution à l'import lit le calendrier** : la route C13 d'import date chaque plan de journée (`jourOuvre` → `date`) par le calendrier courant de l'organisation (jours non travaillés et jours fériés sautés) et garde `parametresVersion` au plan ; un plan daté ne bouge plus ; un lot refusé ne laisse rien (pas même la version 1) ; l'effacement C13 efface `terrain_parametres` | MongoDB réel ; pile |
| AC-5 | **Changer est un droit propre**, `terrain:parametres:modifier` (manifeste `terrain` amendé, C7) ; lire demande l'un des droits du module ; sans le droit : 403 `DROIT_INSUFFISANT`, rien n'est changé | invariant d'accès ; e2e ; pile |
| AC-6 | Node 24 (`verification`) : tsc, lint des fichiers touchés, build, unitaires, e2e, intégration ; mutations rouges sur une assertion ; `docker compose up` sain (module Nest changé, §1.5) | « Preuves » |

## Décisions retenues par défaut (contestables)

- **D-1060-1 — Le calendrier est un paramètre de `terrain`.** AD-12 veut « un seul propriétaire par paramètre » et range
  déjà les paramètres de `terrain` (distances, géorepérage) chez lui ; `terrain` est aujourd'hui le seul lecteur (plans
  de journée). `terrain_parametres` suit `commande_parametres` (STORY-1049) : une version immuable par changement, la
  première écrite à la première lecture, valeurs complètes. `pilotage` (FR-85, jours ouvrés du mois) lira le même
  calendrier quand il comptera : par une route de `terrain` ou par un fait à ajouter alors au catalogue (D-1060-10).
  Alternative écartée : un paramètre « de l'organisation » chez le moteur ou `reseau` (aucun des deux n'a de paramètres
  métier versionnés ; un service de plus à appeler à l'import).
- **D-1060-2 — Une seule règle, dans la plateforme, copiée à l'octet** (patron d'`acces-distributeur`, D-1053-1) :
  `contrats/distributeur/src/calendrier.ts`, étiquette **`calendrier-distributeur-v1`**, dossier déjà lu par les scripts
  racines (aucun fichier de B touché). `terrain` la copie dans `src/socle/calendrier/` ; `pilotage` la copiera pour FR-85 :
  deux services, un même compte des jours ouvrés. Sans dépendance, sans horloge, sans I/O.
- **D-1060-3 — La forme du calendrier** : `{ joursTravailles: [LUNDI … DIMANCHE] (1 à 7, sans doublon), joursFeries:
  [≤ 100] }`, un jour férié étant `{ sorte: FIXE, jour: MM-JJ }` (chaque année ; un 29 février ne l'est que les années
  bissextiles), `{ sorte: PAQUES, decalageJours: -70 … 70 }` (lundi de Pâques +1, Ascension +39, lundi de Pentecôte +50,
  calculés par l'algorithme grégorien) ou `{ sorte: DATE, date: AAAA-MM-JJ }` (2000 → 2100 : les fêtes qu'aucune règle ne
  calcule, Aïd el-Fitr, Tabaski, annoncées chaque année), chacun avec son `libelle` (1 à 80). Fermée : un champ inconnu,
  un doublon (`FIXE:12-25`, `PAQUES:1`, `DATE:…`) sont refusés, nommés à leur place (`calendrier.joursFeries[3].jour : …`).
- **D-1060-4 — La valeur par défaut** (la valeur de la démo, AD-12) : **du lundi au samedi** (Q-D-9 : le commerce de gros
  au Togo ouvre le samedi) ; **dix jours fériés légaux du Togo que l'on sait dater** : 1er janvier, lundi de Pâques,
  27 avril (indépendance), 1er mai, Ascension, lundi de Pentecôte, 21 juin (martyrs), 15 août, 1er novembre, 25 décembre.
  Les fêtes musulmanes se déclarent en `DATE` par l'organisation. **Q-D-11** au PO (la liste, et le 13 janvier).
- **D-1060-5 — Le rang 0 est le jour de l'import, ouvré ou non** (FR-9 : « aujourd'hui ») ; les rangs suivants sont les
  jours **ouvrés** qui suivent (travaillés et non fériés). Un essai ouvert un dimanche voit donc le plan du jour, puis
  ceux du lundi. Un jour non travaillé se dit avant un jour férié (`JOUR_NON_TRAVAILLE`, puis `JOUR_FERIE`). Une date est
  un jour civil de Lomé (UTC, sans heure d'été) : `jourCivilDe(instant)`.
- **D-1060-6 — Changer le calendrier est un droit propre, `terrain:parametres:modifier`** (C7 : préfixe du module ;
  absent de l'annexe B.2, comme `commande:parametres:modifier`, D-1053-7, Q-D-5 confirmée). Rôles par défaut **`DIST_DG`
  et `DIST_ADMIN`** (AD-12), hors du jeton : **→ B** (catalogue des droits de tenant). Jusque-là, `PUT` répond 403
  `DROIT_INSUFFISANT` à tous (échec fermé, sans urgence : aucun écran ne l'appelle ; l'essai prend le défaut). Lire les
  paramètres demande l'un des droits du module (`@ExigeUnDroitDuModule`). Côté microfinance (le module `terrain` est
  partagé), les rôles de l'IMF viendront avec la story de C ou de D qui l'emploie.
- **D-1060-7 — Figé au plan** (AD-12 : « une règle appliquée plus tard lit cette version ») : chaque plan de journée
  garde `parametresVersion` ; un calendrier changé après coup ne redate pas un plan déjà daté. Un import rejoué
  (`DEJA_IMPORTE`) ne relit rien.
- **D-1060-8 — À l'import, le calendrier se lit dans la transaction du lot** (`parametresCourants(connexion, org,
  maintenant, session)`) : la version 1 s'y pose si l'organisation n'en a aucune ; un lot refusé n'en laisse rien.
  `terrain_parametres` entre au **plan d'effacement C13** (invariant de 1058) : tout ce que le module tient de
  l'organisation.
- **D-1060-9 — Le jeu « Grossiste du Golfe » ne change pas** (version `1.0.0`, empreintes, étiquette
  `jeu-grossiste-golfe-v1`) : il porte des jours relatifs ; l'essai prend le calendrier par défaut. Un calendrier de
  démonstration propre au jeu serait une part `parametres` de plus (mineure `1.1.0` du jeu), si le PO le demande.
- **D-1060-10 — Aucun fait publié dans cette story.** Aucun `terrain.parametres.changed@1` au catalogue d'AD-20, et aucun
  lecteur aujourd'hui ; `pilotage` le demandera avec FR-85 (le nom entrera alors au catalogue, AD-27).
- **D-1060-11 — Codes** : `PARAMETRES_INVALIDES` (400, la liste des défauts dans `details.erreurs`),
  `PARAMETRES_VERSION_PERIMEE` (409, `details.versionCourante`), `PARAMETRES_VERSION_INCONNUE` (404) : ceux de
  `commande` (STORY-1049), même sens.

## Ce qui reste

- `pilotage` : compter les jours ouvrés du mois par la même règle (FR-85 ; copie de `calendrier-distributeur-v1`) et lire
  le calendrier de `terrain` (route ou fait, D-1060-10).
- Les écrans du paramètre (console du distributeur) ; les rôles IMF du droit.
- Les autres paramètres de `terrain` (distances, géorepérage, AD-12) s'ajoutent à `terrain_parametres` avec leur story.
