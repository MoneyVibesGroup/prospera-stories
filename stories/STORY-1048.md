# STORY-1048 : le LC fictif refuse l'espace réel, et ses quatre scénarios se rejouent après une remise à zéro

Status: done

**Épic :** EPIC-204 (le logiciel de compagnie fictif, la compagnie de démonstration et la recette de la démo) ·
**Dépôt :** `prospera-assureur-fictif` (tenu par D depuis STORY-1046) · **Plage :** groupe D, n° 4 du lot 3
(`PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §4). **Dépend de :** STORY-1046, faite (`dev` e265b0a).

**Sources :** spine assurance AD-19 (le LC fictif, essai seulement) ; PRD assurance FR-15 (« les quatre scénarios
repartent de l'état déclaré à chaque remise à zéro »), FR-205 (« il n'est jamais installé en production ; la démo se
remet à zéro »), annexe A.6 (C2, C9, C13 `remise-a-zero`) ; EPIC-204 (« fini quand : l'agent refuse de démarrer le LC
fictif dans un espace réel […] ; les quatre scénarios se rejouent après une remise à zéro ») ; STORY-934 (la variable
`INSTANCE_ESPACE` de l'instance servie, `ESSAI` | `REEL`, lue par le catalogue) ; STORY-986 (D-986-2,
`FICTIF_ESPACE=essai`) ; STORY-987 (D-987-4, la remise à zéro du LC fictif).

## Pourquoi

Le LC fictif refuse déjà de démarrer si `FICTIF_ESPACE` ne vaut pas `essai` (STORY-986). Deux trous restent :

1. **L'espace se lit dans une variable propre au LC fictif, pas dans celle de la plateforme.** L'instance dit son espace
   par `INSTANCE_ESPACE` (STORY-934) : c'est elle qui fait publier le catalogue sur `etat-publie.changed.essai` ou
   `.reel`. Une instance réelle (`INSTANCE_ESPACE=REEL`) où quelqu'un aurait laissé `FICTIF_ESPACE=essai` démarrerait le
   LC fictif. Et le refus actuel est noyé dans « Configuration d'environnement invalide », avec une pile d'appels.
2. **La remise à zéro ne rejoue pas les scénarios sur le transport par fichiers.** Elle vide ce que le LC tient (dont
   le journal des reçus), mais ce que Prospera a déposé dans `sortie` reste sur le disque : au cycle suivant, le LC
   relit tout comme neuf. Les anciennes déclarations reprennent les premiers numéros, une ancienne décision de clôture
   referme le scénario à peine remis au statut déclaré, et l'entrée garde les lots d'avant (une police en version 2).

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | **Refus au démarrage, sans preuve d'un espace d'essai** : le service ne démarre que si l'espace est prouvé `ESSAI` (D-1048-1, D-1048-2) ; sinon il s'arrête **avant** de charger ses modules (aucune connexion à MongoDB ni à Kafka, aucun port ouvert), avec une ligne nommée `ASSUREUR_FICTIF_INTERDIT` et son motif, et le code de sortie 78 | tests de la règle (table complète) ; `docker compose -p grp-d up` avec `INSTANCE_ESPACE=REEL`, puis sans aucune preuve : conteneur sorti en 78, la ligne nommée dans le journal |
| AC-2 | **Un espace réel l'emporte** : `INSTANCE_ESPACE=REEL` refuse même si `FICTIF_ESPACE=essai` ; une valeur inconnue de l'une ou de l'autre refuse ; les deux posées et en désaccord refusent | tests |
| AC-3 | **Compatibilité** : une pile qui ne pose que `FICTIF_ESPACE=essai` (piles de C, STORY-986) démarre comme avant ; `INSTANCE_ESPACE=ESSAI` seule suffit ; le compose du dépôt pose les deux | tests ; pile `grp-d` |
| AC-4 | **La même règle partout** : `validateEnv` applique la règle de `main.ts`, en premier, avec le même code (défense en profondeur : tout chargement d'`AppModule` hors essai échoue) | tests |
| AC-5 | **La remise à zéro efface aussi ce que le LC a écrit et écarte ce que Prospera avait déposé** (D-1048-5) : l'entrée de l'organisation est vidée ; chaque fichier présent dans `sortie` est inscrit au journal des reçus comme ignoré (`ANTERIEUR_A_LA_REMISE_A_ZERO`) et n'est jamais relu | tests sur un vrai disque ; témoin « avant la correction » |
| AC-6 | **Les quatre scénarios se rejouent après une remise à zéro** (D-1048-6) : une partie jouée sur `SIN-2026-9001` → `9004` (déclarations, évaluations, règlements, recours, clôtures, police changée, réglage) puis la remise à zéro : les quatre sinistres sont servis **à l'octet** comme le générateur les écrit (statut `DECLARE`, chiffres de référence), leurs polices en version 1 ; **rejouée, la même partie rend les mêmes réponses du LC** (mêmes numéros dans le même ordre, mêmes accusés, mêmes refus) ; sans remise à zéro, elle ne les rend pas | tests (fichiers et API) ; pile `grp-d` |
| AC-7 | Le service démarre dans un espace d'essai et la remise à zéro se joue sur la pile | `docker compose -p grp-d up --build` sain ; la partie jouée par un pilote par l'API du LC et par fichiers, avant et après la remise à zéro |

## Décisions retenues par défaut (contestables)

- **D-1048-1 — Ce qui fait un espace d'essai : la variable de l'instance, `INSTANCE_ESPACE`** (STORY-934, valeurs
  `ESSAI` | `REEL`). C'est la seule marque de la plateforme aujourd'hui : le catalogue la lit pour publier
  `etat-publie.changed.essai` ou `.reel` et refuse l'effacement d'essai hors `ESSAI` ; la garde partagée de l'état publié
  (`garde-etat-publie`, `Espace = 'ESSAI' | 'REEL'`) en dépend. Le LC fictif la lit **au démarrage**, dans
  l'environnement. Posée, elle fait foi : `ESSAI` seul ouvre ; `REEL`, une autre valeur ou une chaîne vide ferment (le
  catalogue lit tout ce qui n'est pas `ESSAI` comme `REEL`).
- **D-1048-2 — `FICTIF_ESPACE=essai` (STORY-986) reste une preuve, pour ne casser aucune pile.** Les piles de C et le
  compose du dépôt ne posent qu'elle. La règle, en entier :

  | `INSTANCE_ESPACE` | `FICTIF_ESPACE` | Décision | Motif nommé |
  |---|---|---|---|
  | `ESSAI` | absente ou `essai` | démarre | — |
  | `ESSAI` | autre valeur | refus | `ESPACES_EN_DESACCORD` |
  | `REEL` | quelconque | refus | `ESPACE_REEL` |
  | autre valeur (vide compris) | quelconque | refus | `ESPACE_INCONNU` |
  | absente | `essai` | démarre (preuve de STORY-986) | — |
  | absente | autre valeur | refus | `ESPACE_INCONNU` |
  | absente | absente | refus | `AUCUNE_PREUVE_D_ESSAI` |

  On ferme, on n'ouvre pas : rien ne se lit en minuscules ni ne se « corrige ». Quand l'agent posera l'espace de
  l'instance partout, `FICTIF_ESPACE` pourra être retirée (à annoncer, pas dans cette story).
- **D-1048-3 — Le refus a lieu avant tout.** `main.ts` juge l'espace **avant** de charger `AppModule` (chargement
  différé) : aucune connexion, aucun port, aucun module. Il écrit une ligne JSON sur la sortie d'erreur
  (`level: "fatal"`, `code: "ASSUREUR_FICTIF_INTERDIT"`, `motif`, `msg`) et sort en **78** (`EX_CONFIG` : une erreur de
  configuration, qu'une relance ne guérit pas). `validateEnv` applique la même règle en premier (même message, sans les
  autres erreurs mêlées) : un test ou un outil qui chargerait `AppModule` hors essai échoue aussi.
- **D-1048-4 — Le drapeau `assureurFictifAutorise` de l'état voulu n'est pas inventé ici.** La spine (AD-19, AD-21) le
  veut dans l'état voulu signé, faux par défaut ; il n'est ni dans `etat-voulu@1` (plateforme) ni produit par l'agent.
  Quand l'agent le portera, il s'ajoutera **en plus** (les deux se cumulent, manifeste C1) : il ne remplacera pas
  l'espace de l'instance.
- **D-1048-5 — La remise à zéro de l'administration passe par la boîte aux lettres.** Elle vide ce que le LC tient
  (objets, lots, reçus, numéros, état clos, réglages : `DepotCompagnie.vider`), **efface l'entrée** qu'il a écrite (comme
  l'effacement C13, D-1046-8), **écarte la sortie** : chaque fichier que Prospera y avait déposé est inscrit au journal
  des reçus, `IGNORE` avec le code `ANTERIEUR_A_LA_REMISE_A_ZERO`, et le LC ne le relira plus (il ne supprime rien de
  `sortie`, qui est à `liaison-assureur`). Puis le jeu est rechargé. Ce que Prospera dépose après la remise à zéro est
  reçu normalement ; un fichier déposé juste avant et pas encore relevé est écarté avec les autres (la remise à zéro
  oublie tout ce qui la précède). Le journal des reçus le dit.
- **D-1048-6 — « Les quatre scénarios se rejouent » côté LC veut dire** : après la remise à zéro, les quatre sinistres
  existants `SIN-2026-9001` → `9004` et leurs polices sont servis à l'octet comme le générateur à graine fixe les écrit,
  sans reste de la partie (numéros, état clos, versions de police, réglages) ; et la même partie rejouée rend les mêmes
  réponses du LC. Le parcours dans Prospera (dossiers, rôles, circuit) est à C, et la remise à zéro de l'espace entier
  au moteur (D-987-4, D-1046-5).
- **D-1048-7 — La partie jouée par la preuve**, pour chaque scénario : la déclaration `DEC-2026-9000N` sur la police
  du scénario (numéro attendu), une évaluation, un règlement, un recours et une décision de clôture sur la référence
  `SIN-2026-900N` (accusés `ACCEPTE`), puis une seconde évaluation après la clôture (`REFUSE`, `ETAT_INCOMPATIBLE`) ; la
  police de `SIN-2026-9002` suspendue (version 2) ; un réglage de refus posé. Les montants sont les chiffres de référence
  du générateur (`SIN-2026-9002` : évaluation arrêtée 395 500).

## Ce qui a été livré

**2026-11-17** — `prospera-assureur-fictif` **#4**, fusionnée en « Rebase and merge » sur `dev` (**`4f4aa89`** ; branche
`bf54bc8`). Annonce « ⚠ Contrats » fusionnée **avant** le code (prospera-stories **#597**, `main` 6fb5882).

- `src/config/espace-d-essai.ts` : `jugerLEspace(env)` (la table de D-1048-2, fonction pure), `ligneDuRefus`,
  `CODE_ESPACE_INTERDIT`, `SORTIE_ESPACE_INTERDIT` (78).
- `src/main.ts` : l'espace jugé avant le chargement différé d'`AppModule` ; refus = une ligne JSON sur la sortie
  d'erreur, `process.exitCode = 78`, rien d'autre. `src/config/env.validation.ts` : la même règle en premier ;
  `INSTANCE_ESPACE` (facultative, `ESSAI`) et `FICTIF_ESPACE` (facultative, `essai`) déclarées.
- `BoiteAuxLettres.remettreAZero(organisationId, taille)` : vider, effacer l'entrée, écarter la sortie (`IGNORE`,
  `ANTERIEUR_A_LA_REMISE_A_ZERO`), recharger le jeu ; rend `{ lots, sortieEcartee, entreeEffacee }`. Un cycle et une
  remise à zéro passent l'un après l'autre (file d'attente interne). La route `POST /assureur-fictif/remise-a-zero`
  l'appelle ; `Compagnie.remettreAZero` est retirée (un seul chemin).
- `docker-compose.yml` : `INSTANCE_ESPACE: ${INSTANCE_ESPACE:-ESSAI}`, `FICTIF_ESPACE: ${FICTIF_ESPACE:-essai}`. README :
  la table du démarrage et la remise à zéro.
- Tests : `espace-d-essai.spec.ts` (la table, 21 cas), `env.validation.spec.ts` (+5), `main.spec.ts` (le point d'entrée
  chargé dans un registre isolé : `AppModule` jamais chargé hors essai, sortie 78), `boite-aux-lettres.service.spec.ts`
  (+4, sur un vrai disque), e2e `compagnie.e2e-spec.ts` (la partie des quatre scénarios, par fichiers, avant et après la
  remise à zéro ; `test/utils/partie-des-scenarios.ts`).

## Preuves

- **Node 24** (étage `verification`, image construite depuis `git -c core.autocrlf=false archive HEAD`) : `tsc` vert ;
  lint du dépôt entier 0 (`--max-warnings 0`) ; build ; **40/40 suites, 419 tests** unitaires (385 avant) ; **e2e 3/3
  suites, 23 tests** (22 avant).
- **Mutations, 10 sur 10 rouges sur une assertion** (aucune à la compilation) : un espace réel accepté avec
  `FICTIF_ESPACE=essai` (8 rouges) ; `REEL` lu comme inconnu (6) ; désaccord accepté (3) ; aucune preuve ⇒ ouvert (4) ;
  valeur inconnue d'`INSTANCE_ESPACE` acceptée (7) ; `validateEnv` ne juge plus l'espace en premier (6) ; `main.ts` ne
  refuse plus avant `AppModule` (3) ; la sortie n'est plus écartée (2 unitaires, 1 e2e) ; l'entrée n'est plus effacée (1).
- **Témoin « avant la correction »** (image `runtime` construite depuis `origin/dev` e265b0a ; vérifié dans l'image :
  ni `espace-d-essai.js`, ni `INSTANCE_ESPACE` dans `env.validation.js`) : avec `INSTANCE_ESPACE=REEL` et
  `FICTIF_ESPACE=essai`, le LC fictif **démarre et répond sain** ; la partie jouée, puis la remise à zéro et un cycle :
  **6 fichiers de l'ancienne sortie relus** (`recus: 6`), les 4 clôtures rejouées d'abord (« decision » se trie avant
  « declaration »), les anciennes déclarations renumérotées ; la partie rejouée ne rend pas les réponses attendues
  (`DOUBLON` ×4, puis `REFUSE ETAT_INCOMPATIBLE` sur les évaluations de scénarios remis au statut déclaré).
- **Pile `grp-d`** (`docker compose -p grp-d --profile assureur-fictif up`, MongoDB 8 en jeu de répliques, Kafka ; un
  émetteur RS256 de preuve tient le rôle d'auth-service ; le droit `assureur-fictif` publié sur `entitlement.changed`
  par le producteur de Kafka) :
  - **refus** : `INSTANCE_ESPACE=REEL` (et `FICTIF_ESPACE=essai`) : conteneur **sorti en 78**, une seule ligne de
    journal `{"level":"fatal",…,"code":"ASSUREUR_FICTIF_INTERDIT","motif":"ESPACE_REEL",…}` ; sans aucune preuve : 78,
    `AUCUNE_PREUVE_D_ESSAI` ; `INSTANCE_ESPACE=essai` : 78, `ESPACE_INCONNU` ; `ESSAI` + `FICTIF_ESPACE=reel` : 78,
    `ESPACES_EN_DESACCORD` ; `FICTIF_ESPACE=production` : 78, `ESPACE_INCONNU` ;
  - **démarrage** : le compose du dépôt (`ESSAI` + `essai`) : sain ; `FICTIF_ESPACE=essai` seule (piles de C) : sain ;
  - **les quatre scénarios** (pilote joué par le réseau de la pile, sous l'uid du service sur le volume d'échange, jeu
    réduit) : la partie par fichiers rend les 21 réponses attendues (`LCF-2026-000001` → `000004`, 13 accusés
    `ACCEPTE`, 4 `REFUSE ETAT_INCOMPATIBLE`) ; police de 9002 suspendue (version 2) et refus réglé ; sans remise à
    zéro, la même partie diffère (`REFUSE IDENTIFIANT_INCONNU`, `DOUBLON` ×3…) ; **remise à zéro** : `{ lots: 9,
    sortieEcartee: 12, entreeEffacee: 22 }`, puis un cycle `recus: 0, deposes: 9` ; aucun accusé ni numéro servi ; les
    quatre sinistres et leurs polices **identiques au premier chargement** (`SIN-2026-9001` → `9004` au statut
    `DECLARE`, provisions 1 500 000, 780 000, 45 000 000, 12 000 000) ; journal des reçus : 12 `IGNORE
    ANTERIEUR_A_LA_REMISE_A_ZERO` ; **rejouée par fichiers : mêmes réponses** ; seconde remise à zéro (`sortieEcartee:
    18`), **rejouée par l'API du LC : mêmes réponses**.
  - **Rejouée sur l'image reconstruite depuis `dev` (`4f4aa89`)**, volumes neufs, relève automatique à 5 s : refus
    `ESPACE_REEL` en 78 ; démarrage sain ; même partie, mêmes résultats.
  - Pile descendue avec ses volumes (`down -v`) ; aucun conteneur, volume ni réseau `grp-d` restant ; verrou rendu.

## Ce qui reste

- **Le drapeau `assureurFictifAutorise`** de l'état voulu (D-1048-4) : à lire en plus de l'espace quand l'agent le
  portera (moteur, B).
- **Les routes de vérification C13** du manifeste (`assureur-fictif-absent-du-reel`, `remise-a-zero`, …) ne sont pas
  servies (demande de B du 16/11, STORY-944) : avec STORY-1057 (la recette de la démo) ou avant toute installation par
  le moteur.
- **L'effacement C13 laisse la sortie** (à `liaison-assureur`, D-1046-8) : un cycle après l'effacement relirait la sortie
  d'une organisation effacée (même mécanisme que le défaut corrigé ici ; le rejeu de l'effacement le rattrape, D-1046-8).
  À trancher avec 1057.
- **La remise à zéro côté Prospera** reste au moteur (D-987-4) : après la seule remise à zéro du LC, `liaison-assureur`
  garde ses projections (une police en version 2 voit revenir la version 1).
