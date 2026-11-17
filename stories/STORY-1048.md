# STORY-1048 : le LC fictif refuse l'espace réel, et ses quatre scénarios se rejouent après une remise à zéro

Status: in-progress

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
