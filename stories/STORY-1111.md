# STORY-1111 : Les aides à la décision — hypothèses tirées de l'historique, crédibilité, montant soutenable, différé, scénario prudent

Status: ready-for-dev — **créée le 2026-11-21** à la demande de l'utilisateur, après validation de la maquette de FE-140
(PR #741). Non slottée : à placer au prochain plan.

**Service :** `prospera-bilan-service`, module `financement` et moteur du prévisionnel · **Points :** 13
**Dépend de :** STORY-1104 (coût, apport, pro forma), STORY-1084 (échéanciers, indicateurs, scénario retenu), STORY-071 (la
comparaison de deux jeux d'hypothèses, livrée), STORY-1105 (le profil pour les repères).
**Débloque :** STORY-1085 (la règle « contrats si le chiffre d'affaires est à justifier »), STORY-1109 (projection et risques),
STORY-1086 (couverture centrale et prudente, points de vigilance), FE-157.
**Écran :** FE-157 (étape 4 « Les chiffres »).
**Suite :** STORY-1085.

---

## Pourquoi

STORY-1084 sait **calculer** les indicateurs de dette d'un scénario déjà construit. Mais dans la vraie vie, le cabinet doit d'abord
**construire** la projection : il n'a pas le temps de ressaisir ce que ses exercices validés disent déjà ; il se demande si ses
hypothèses **tiennent** devant un banquier ; il veut savoir **combien** la banque peut raisonnablement prêter, ce que changerait
un **différé**, et si le dossier **résiste** à un scénario prudent. Cette story sert ces cinq aides, **sans écrire** tant que le
cabinet ne le demande pas.

## Ce qui est attendu

1. **Des hypothèses suggérées** depuis l'historique validé, chacune avec sa source, et **« créer la projection depuis l'historique »**.
2. **La crédibilité** de chaque hypothèse face à l'historique (repères vert, ambre, rouge).
3. **Le montant soutenable** : le plus grand prêt que la projection supporte.
4. **La simulation d'un différé**, sans rien enregistrer.
5. **Le scénario prudent** côte à côte avec la projection retenue.

## Décisions retenues par défaut (contestables)

- **D-1111-1 — Les hypothèses suggérées** (`GET /{id}/hypotheses/suggestions`, consulter) : pour l'activité actuelle, chacune avec
  `valeur`, `source` (texte en clair, nom de l'exercice et chiffres) et `statut` ∈ `DEPUIS_HISTORIQUE`, `PAR_DEFAUT`,
  `A_COMPLETER` (propre au projet). **Valeurs de référence (Ets Kossi, exercices 2023 à 2025)** :

  | Hypothèse | Valeur reprise | D'où ça vient |
  |---|---|---|
  | Croissance du CA de l'activité actuelle | +0,3 % par an | moyenne annuelle composée des exercices 2023 à 2025 (15 900 000 → 16 000 000) |
  | Marge brute de l'activité actuelle | 27,2 % | exercice 2025 : marge 4 350 000 sur 16 000 000 de CA |
  | Charges fixes de l'activité actuelle | 3 210 000 en 2025, +8,2 % par an | exercices 2024 et 2025 |
  | Besoin en fonds de roulement | 3,9 % du CA (14 jours) | BFR constaté en 2025 : 630 000 |
  | Impôt sur les sociétés | 27 % | paquet fiscal Togo 2026 |
  | Investissements de maintenance | 1 500 000 / 2 000 000 / 2 000 000 | valeur par défaut, `PAR_DEFAUT`, **à confirmer** |

  Le projet apporte trois hypothèses `A_COMPLETER` : chiffre d'affaires du camion (3 années), marge sur l'activité du camion, charges
  d'exploitation du camion. **Écart avec la maquette** : la maquette propose des « brouillons » chiffrés (24 000 000 / 32 000 000 /
  34 000 000 ; 55 % ; 3 000 000 / 4 200 000 / 4 400 000). **Par défaut, le serveur n'invente aucun chiffre** : ces brouillons ne
  sortent que d'un modèle de projet du référentiel (AP-50, par type de matériel) ; sans modèle, le cabinet saisit. La maquette
  garde ces valeurs comme valeurs de démonstration (écart nommé dans le journal).
  Les exercices **importés** (reprise de données) comptent comme l'historique, avec leur origine dite dans la source ; un exercice
  absent n'est pas inventé (`INCALCULABLE`, `EXERCICE_MANQUANT`).
- **D-1111-2 — « Créer la projection depuis l'historique »** (`POST /{id}/projection/depuis-historique`, préparer, `BROUILLON`) : le
  cabinet envoie les trois hypothèses du projet (et peut modifier chaque hypothèse suggérée) ; le serveur **crée un jeu d'hypothèses du
  prévisionnel** (nom : « Avec le camion », origine `HISTORIQUE`), y **injecte** le projet (investissement TTC amorti sur 5 ans, à
  partir du mois d'acquisition ; apport du client en apport des associés ; emprunts de STORY-1084), et le **retient d'office**
  (`scenarioRetenu`, `PATCH` de 1083). Pour une **jeune société**, l'origine est `QUESTIONNAIRE` (huit réponses de STORY-1109,
  hypothèses déduites) au lieu de l'historique. Aucune duplication : le jeu appartient au prévisionnel.
  **Référence** (données de D-1111-1 + CA du camion 24 000 000 / 32 000 000 / 34 000 000, marge 55 %, charges 3 000 000 /
  4 200 000 / 4 400 000) :

  | | 2026 | 2027 | 2028 |
  |---|---:|---:|---:|
  | Chiffre d'affaires | 40 048 000 | 48 096 144 | 50 144 432 |
  | Résultat net | 2 634 057 | 3 362 973 | 4 330 443 |
  | Capacité d'autofinancement | 8 181 557 | 10 472 973 | 11 440 443 |
  | Couverture du service de la dette | **1,76** | **1,56** | **1,65** |
  | Trésorerie au 31/12 | 2 772 076 | 5 049 374 | 8 089 985 |

  dotations 2026 : 4 687 500 pour le camion (31 250 000 sur 5 ans, 9 mois) + 860 000 existantes ; intérêts d'emprunt et capital
  remboursé de l'échéancier (1 934 033 d'intérêts en 2026, dette existante comprise). Un dossier dont le jeu est déjà retenu : 409
  `PROJECTION_DEJA_RETENUE` (le cabinet repasse par le brouillon). Sans exercice validé : 422 `HISTORIQUE_INSUFFISANT`.
- **D-1111-3 — La crédibilité** (`GET /{id}/hypotheses/credibilite`, consulter) : pour chaque hypothèse clé, `retenu`, `historique`,
  `repere` ∈ `VERT` (« Dans l'historique »), `AMBRE` (« À justifier »), `ROUGE`, `message` (phrase fixe, sans IA), `action`
  (`VOIR_PIECE_EXIGEE` quand la pièce correspondante s'ouvre, STORY-1085). Ce sont des **avertissements** : rien ne bloque.
  Règles par défaut (contestables ; le référentiel AP-50 les porte ensuite, par banque) :

  | Hypothèse | Vert | Ambre | Rouge |
  |---|---|---|---|
  | Croissance du CA de l'activité actuelle | écart ≤ 2 points avec la croissance historique | ≤ 5 points | > 5 points |
  | Marge brute de l'activité actuelle | écart ≤ 1 point avec la dernière marge constatée | ≤ 3 points | > 3 points |
  | Charges fixes de l'activité actuelle | croissance retenue à ≤ 2 points de l'historique | ≤ 5 points | > 5 points |
  | Marge sur l'activité nouvelle (camion) | écart ≤ 5 points avec la marge actuelle | ≤ 30 points | > 30 points |
  | CA de l'activité nouvelle | — (jamais vert : aucun historique) | **toujours « À justifier »**, tant que ≤ 200 % du CA du dernier exercice | > 200 % du CA du dernier exercice |
  | Apport du client | ≥ bas du repère (20 % société établie, 30 % jeune société) | ≥ bas du repère − 10 points | en dessous |

  **Valeurs de la maquette** : croissance retenue +0,3 % pour +0,3 % historique ⇒ vert ; marge brute 27,2 % pour 27,2 % ⇒ vert ;
  charges fixes +8,2 % pour +8,2 % ⇒ vert ; apport 20 % ⇒ vert pour une société établie ; **CA du camion 24 000 000 la 1re
  année = 150 % du CA 2025 (16 000 000), sans historique ⇒ ambre « À justifier »** (l'écran de la maquette écrit « +150 % » :
  à corriger en « 150 % du CA 2025 ») ; **marge du camion 55 % contre 27,2 % (écart de 27,8 points) ⇒ ambre « À justifier »**.
  Une hypothèse de **chiffre d'affaires** ambre ou rouge porte `aJustifier: true` : c'est elle qui rend exigibles les contrats ou
  lettres d'intention (STORY-1085).
- **D-1111-4 — Les verdicts des trois indicateurs de dette** (STORY-1084) reçoivent un mot, tiré de seuils par défaut (repères
  indicatifs, **remplacés par ceux de la banque** quand STORY-1085 les connaît) : couverture du service de la dette ≥ 1,20 :
  « Solide » ; sous 1,20 : « Fragile » ; capacité d'endettement résiduelle négative : « Aucune marge », sinon « Marge » ;
  autonomie financière ≥ 33 % : « Correcte », sinon « Faible ». Chaque verdict porte la formule de D-1084-10.
- **D-1111-5 — Le montant soutenable** (`GET /{id}/montant-soutenable`, consulter, **aucune écriture**) : le **plus grand montant
  demandé, au millier de FCFA près**, tel que, **en gardant le coût du projet** (l'apport grandit quand le prêt diminue) et les
  mêmes taux, durée et différé :
  1. la couverture du service de la dette est **≥ 1,20 chaque année** des trois exercices, **et**
  2. les **dettes financières ne dépassent pas les capitaux propres à la clôture de la 1re année** (capacité d'endettement
     résiduelle ≥ 0).
  Recherche par dichotomie sur des multiples de 1 000 entre 0 et le montant demandé ; le moteur du prévisionnel rejoue la
  projection **en mémoire** à chaque essai (STORY-1084, D-1084-9) ; le résultat est le dernier montant qui vérifie les deux
  conditions **et** dont le montant suivant (+1 000) ne les vérifie pas (test de monotonie localisé). Aucun montant n'est soutenable :
  `soutenable: null`, motif `AUCUN_MONTANT_SOUTENABLE`. Réponse : `demande` et `soutenable`, chacun avec `montant`, `apport`
  (montant et pourcentage du coût), `mensualite`, `couvertureMinimale`, `capaciteEndettementPremiereAnnee`.
  **Valeurs de référence** (coût 31 250 000) :

  | | Demande actuelle | Montant soutenable |
  |---|---:|---:|
  | Montant | 25 000 000 | **20 492 000** |
  | Apport | 6 250 000 (20 %) | 10 758 000 (34,4 %) |
  | Mensualité | 658 346 | 539 633 |
  | Couverture minimale sur 3 ans | 1,56 | 1,87 |
  | Capacité d'endettement résiduelle, 2026 | −8 653 352 | 466 |

  La condition qui mord ici est la seconde (la couverture de la demande, 1,56, est déjà au-dessus de 1,20).
  **Ajuster la demande** : `POST /{id}/montant-soutenable/appliquer` (préparer, `BROUILLON`) pose `montant` (`montantSource =
  SAISI`) et l'apport au montant nouveau, met à jour l'emprunt lié au projet (STORY-1104) et garde l'état d'avant
  (`ajustement.avant`) ; `DELETE …/appliquer` revient à la demande initiale (« Revenir à la demande initiale »).
- **D-1111-6 — La simulation d'un différé** (`POST /{id}/simulations/differe`, consulter, **ne modifie rien**) : corps `{ differeMois }`
  (multiple de la période, strictement inférieur à la durée, sinon 400 `DIFFERE_INVALIDE`, comme D-1084-4). Réponse : sans différé /
  avec différé, la mensualité pendant le différé (intérêts seuls) et après, le total des intérêts, la couverture de la 1re
  année, la trésorerie de l'exercice le plus bas du **scénario prudent**. **Valeurs de référence**, 6 mois de différé sur 25 000 000, 12 %, 48
  mois : mensualité pendant le différé **250 000** (contre 658 346), puis **731 891** sur 42 mois, total des intérêts
  **7 239 405** (contre 6 600 601), couverture de 2026 **2,95** (contre 1,76), trésorerie prudente de 2027 **687 296** (contre
  −754 142). Le cabinet applique ensuite le différé par le `PATCH` ordinaire de 1083 (rien ne s'écrit par la simulation).
- **D-1111-7 — Le scénario prudent.** Le dossier porte un second jeu d'hypothèses, `scenarioPrudent: { hypothesesId }`
  (`PATCH /{id}` et correction d'un `REMIS`, contrôlé comme D-1084-8 : 422 `SCENARIO_INTROUVABLE`). Deux voies : choisir un jeu
  existant (« Prudent 2026 » du prévisionnel), ou **le créer** : `POST /{id}/projection/prudent` (préparer, `BROUILLON`) à partir du
  jeu retenu avec les paramètres par défaut **activité actuelle en baisse de 5 % par an** et **camion à 75 % de l'activité
  prévue** (modifiables, enregistrés avec le jeu). La **comparaison** réutilise STORY-071
  (`GET …/bilan/previsionnel/comparaison`) : `GET /{id}/scenarios/comparaison` rend, pour les trois exercices, les trois lignes
  couverture, trésorerie au 31/12, résultat net, en central et en prudent.
  **Valeurs de référence** :

  | | 2026 | 2027 | 2028 |
  |---|---:|---:|---:|
  | Couverture central / prudent | 1,76 / 1,31 | 1,56 / 1,12 | 1,65 / 1,16 |
  | Trésorerie au 31/12 central / prudent | 2 772 076 / 464 414 | 5 049 374 / **−754 142** | 8 089 985 / −1 557 835 |
  | Résultat net central / prudent | 2 634 057 / 56 755 | 3 362 973 / −243 452 | 4 330 443 / 436 122 |

  **Avertissement** `TRESORERIE_NEGATIVE_PRUDENT` quand une trésorerie prudente est négative (ici 2027 et 2028) : « prévoyez un
  différé ou plus d'apport ». Couverture minimale prudente : **1,12** (sous 1,20 ⇒ point de vigilance du dossier, STORY-1086).
- **D-1111-8 — Les routes** (sous `/api/v1/dossiers/{dossierId}/financements/{financementId}`, mêmes gardes, portée et droits que 1083 ;
  les lectures et simulations sont ouvertes à `consulter`, **sans état** ; les écritures en `BROUILLON` seulement) :

  | Route | Droit | Effet |
  |---|---|---|
  | `GET /hypotheses/suggestions` | consulter | D-1111-1 |
  | `POST /projection/depuis-historique` | préparer | D-1111-2 |
  | `GET /hypotheses/credibilite` | consulter | D-1111-3 |
  | `GET /montant-soutenable` | consulter | D-1111-5 |
  | `POST /montant-soutenable/appliquer` · `DELETE …` | préparer | ajuste, ou revient |
  | `POST /simulations/differe` | consulter | D-1111-6 |
  | `POST /projection/prudent` | préparer | crée le scénario prudent |
  | `GET /scenarios/comparaison` | consulter | D-1111-7 |

  Refus : 409 `PROJECTION_DEJA_RETENUE`, `DOSSIER_FINANCEMENT_NON_MODIFIABLE`, `CONFLIT_CONCURRENT` ; 422 `HISTORIQUE_INSUFFISANT`,
  `SCENARIO_NON_RETENU` (soutenable ou crédibilité sans projection : `INCALCULABLE` avec ce motif, comme 1084), `SCENARIO_INTROUVABLE`,
  `AUCUN_MONTANT_SOUTENABLE`, `DIFFERE_INVALIDE`, `DUREE_HORS_PERIODICITE`. Piste d'audit : `FINANCEMENT_MODIFIE` avec `geste` =
  `PROJECTION_CREEE`, `MONTANT_AJUSTE`, `PRUDENT_CREE`. Le manifeste M49 passe en 0.3.0 : les lectures **et la simulation** (qui ne
  modifie rien) entrent dans `routesLectureSeule`.
- **D-1111-9 — Effacement C13** : les jeux d'hypothèses vivent dans le prévisionnel (déjà au plan) ; le champ `scenarioPrudent` et
  l'état d'avant l'ajustement vivent dans `dossiers_financement`. Rien de neuf.

## Critères d'acceptation

- **AC-1** : le tableau de D-1111-2 est reproduit au franc (couvertures 1,76 / 1,56 / 1,65, trésorerie 2 772 076 / 5 049 374 /
  8 089 985), écrit en dur dans le test ; la projection créée est retenue d'office ; le jeu appartient au prévisionnel, sans copie.
- **AC-2** : chaque règle de D-1111-3 est éprouvée à ses deux bornes (vert/ambre, ambre/rouge) ; les huit valeurs de la maquette
  tombent dans les repères annoncés ; un CA sans historique n'est jamais vert.
- **AC-3** : le montant soutenable de référence est **20 492 000** ; à **20 493 000** au moins une des deux conditions échoue, à
  20 492 000 les deux tiennent (test de monotonie localisé) ; mutation sur chacune des deux conditions.
- **AC-4** : la simulation du différé de 6 mois rend 250 000 / 731 891 / 7 239 405 / 2,95 / 687 296 et **n'écrit rien** (le dossier
  est inchangé octet pour octet).
- **AC-5** : le scénario prudent de référence rend les couvertures 1,31 / 1,12 / 1,16 et la trésorerie −754 142 en 2027 ;
  l'avertissement `TRESORERIE_NEGATIVE_PRUDENT` est publié ; « Prudent 2026 » se rattache sans copie.
- **AC-6** : sans exercice validé, aucune valeur n'est inventée (`HISTORIQUE_INSUFFISANT`, `INCALCULABLE`) ; droits et portée comme
  1083 ; contrat publié, typé dans l'OpenAPI, annoncé dans « ⚠ Contrats » avant le code.

## Hors périmètre

- Les seuils propres à chaque banque (STORY-1085, AP-50).
- Une aide à l'écriture des hypothèses du projet par IA (option à décider, PRD assistant IA FR-IA07 et FR-IA09).
- Plus de deux scénarios côte à côte.
- L'optimisation automatique (choisir le différé ou la durée « idéale ») : le cabinet essaie, rien ne se choisit seul.
