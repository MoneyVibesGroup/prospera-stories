# Lot 3 : A léger, B à la comptabilité, D entre distributeur et assurance

> **Date :** 2026-11-17 (S2 du plan maître) · **Statut :** décidé par l'utilisateur (« tu peux écrire, je suis
> d'accord »), en vigueur dès la fusion de ce document.
> **Consignes de l'utilisateur :** un groupe **continue sur la comptabilité** ; le second **mêle distributeur et
> assurance** pour faire avancer les deux en parallèle ; 15 stories pour B et pour D ; **A entre dans la coordination
> avec 10 stories légères**, qui consomment peu.
> **Suite de** `PLAN-4-SESSIONS-LOT-2-2026-11-16.md` : A, B et D ont fini leur lot 2 le 16/11 (15/15 chacun) ; C
> finit le sien (§5). **Tout le reste du lot 2 reste en vigueur** : le rituel, les journaux, `REGLES-DES-GROUPES.md`
> (dont la norme MinIO du 17/11, §1.6), le verrou Docker par poste (§9.2 du lot 2).
> **Cadre :** `PLAN-FEVRIER-2027-TOUT-CHARGE-2026-11-14.md` et `amendement-plan-fevrier-2026-11-14.md` (F3 : le
> cabinet en premier inclut sa comptabilité, EPIC-111 → 120).
> **Rédigé par** la session du groupe B, sur consigne de l'utilisateur, à partir des journaux, du tracker et des épics
> (relevés le 17/11).

---

## 0. Ce qui ne change pas

- Le **rituel** avant chaque story : relire ce plan et les demandes des journaux, écrire la fiche juste avant de coder,
  prouver (Node 24, tests, lint, build, `docker compose up` quand la story le demande), pousser, PR, **« Rebase and
  merge » par le groupe lui-même**, vérifier le SHA de tête, PR de docs (fiche, tracker, journal), story suivante.
- **Backend seulement.** Les écrans viendront avec la coque `prospera-app`.
- **Un dépôt = un groupe** (§1). Une demande à un autre groupe s'écrit dans son journal et dans le sien.
- **Docker** : une pile lourde à la fois **par poste**, sous le verrou `MoneyVibes_Apps\.verrou-docker` ; piles
  préfixées `grp-a`, `grp-b`, `grp-c`, `grp-d`, descendues avec leurs volumes. A et C partagent le poste principal ;
  B et D partagent l'autre poste.
- **MinIO** : `cgr.dev/chainguard/minio:latest`, `user: '0'` (`REGLES-DES-GROUPES.md` §1.6).

## 1. Qui tient quel dépôt (lot 3)

| Dépôt | Groupe | Changement par rapport au lot 2 |
|---|---|---|
| fiscal, balance, bilan, dossier, kyc, admin-panel-service (BFF), `prospera-recette` | **A** | — |
| catalogue, paiement, auth, `prospera-plateforme` (hors dossiers de C et D), `agent-instance`, `centrale-service`, **neuf** `prospera-comptabilite-service` | **B** | **+ comptabilité** ; **− notification** (après B-957) |
| sinistres, assurance, `document-service`, liaison-assureur ; dans la plateforme : `contrats/assurance/`, `champs-sensibles/`, `classification-sante/` | **C** | **− `prospera-assureur-fictif`** |
| `reseau-service`, ventes, terrain, recouvrement, pilotage, croissance, **`prospera-assureur-fictif`**, **`prospera-notification-service`** (après B-957) ; dans la plateforme : `series/`, `vocabulaires/`, `contrats/distributeur/`, **`encours/`** | **D** | **+ assureur-fictif, + notification, + `encours/`** |

**Décisions de partage (retenues par défaut, contestables) :**

- **D-L3-1 — La comptabilité va à B**, dans un dépôt neuf : personne d'autre n'y écrit, et B tient déjà `paiement`
  et `auth`, dont le distributeur a besoin (rôles, Créance).
- **D-L3-2 — L'assurance de D ne touche ni `sinistres`, ni `assurance`, ni `document-service`** : C y finit son lot,
  puis enchaîne EPIC-201 → 211 (consigne du 15/11). D prend la **démo** (EPIC-204, dans `prospera-assureur-fictif`) et
  la **communication** (EPIC-220, dans `notification`). C continue de **jouer** ses parcours contre le LC fictif ; s'il
  doit le **modifier**, il le demande à D.
- **D-L3-3 — `notification` passe de B à D après B-957** (le correctif de supervision y est fait d'abord). B écrit la
  passation (dernier commit sur `dev`) dans son journal à la fusion de 957.
- **D-L3-4 — La tenue d'un exercice est exclusive** : un exercice est tenu **aux cahiers ou au journal**, jamais les
  deux (Q1 d'`epics-comptabilite-2026-08-27.md`, recommandation de l'épic). Le brouillard est validé avant toute
  balance publiée (Q2). La piste d'audit distingue « proposé par la machine » de « choisi par l'utilisateur » dès le
  socle (Q3), même si l'IA (117, 118) n'est pas dans ce lot.
- **D-L3-5 — Le dossier `encours/` de D** entre dans `prospera-plateforme` : B l'ajoute au README et aux scripts
  racines (`test`, `typecheck`) à sa première story (B-956), comme pour le lot 2.
- **D-L3-6 — Dev A (arrivée le 07/12)** reprend le distributeur : D met sa passation à jour dans son journal **avant
  le 04/12**.

## 2. Groupe A : dix stories légères

Plage : **STORY-920 → 929** (fin de sa plage 902 → 929).

**Règle de légèreté** (A partage le poste principal avec C) :
- une story touche un service, ou la même petite modification dans plusieurs ;
- sept stories sur dix se prouvent **sans Docker** : tests unitaires et e2e du service, relancés **par chemin de
  fichier** ;
- une seule **recette croisée complète**, en clôture (929) ;
- ni dépôt neuf, ni contrat neuf à faire relire, ni migration.

| # | Story | Source | Dépôts | Docker | Fini quand |
|:--:|---|---|---|:--:|---|
| 1 | **920** MinIO à la norme | demande de B (17/11) | recette (+ compose racine du poste principal) | 1 pile | le service `minio` de `docker-compose.recette.yml` porte l'image de Chainguard et `user: '0'` ; une recette qui écrit dans MinIO (archive des livrables du fiscal) passe sur pile neuve ; C prévenu |
| 2 | **921** le hub de balance accepte la 5e origine `comptabilite` | B-967 | balance | non | l'origine est dans la liste fermée et dans le contrat canonique ; une balance d'origine `comptabilite` s'ingère avec son `checksum` ; une origine inconnue reste refusée ; mutation |
| 3 | **922** retirer le code mort de la double lecture | dette 2 de 918 | balance, bilan, fiscal | non | `decisionAncienne`, `memeDecision`, `libelle` retirés des trois copies ; tests verts |
| 4 | **923** le BFF relaie `PATCH /dossiers/{id}` | dette 4 de 918 | admin-panel | non | le collaborateur modifie l'identité d'un dossier par le BFF ; le 409 de version est relayé sans message d'écran |
| 5 | **924** la fiche du dossier, surface 2 : la complétude | ticket « trois surfaces » | dossier | non | la complétude du dossier est servie ; le ticket est fermé |
| 6 | **925** le référentiel effectif résolu par dossier, avec ses versions | ticket `referentiel-effectif-non-resolu-par-dossier` | balance | non | `GET …/referentiels/actifs` répond pour un dossier, versions comprises ; ticket fermé (906 en avait servi une partie) |
| 7 | **926** chaque ligne de balance porte sa provenance | ticket `ligne-de-balance-sans-provenance` | balance | non | la provenance de chaque ligne est servie ; FE-075 débloquée ; ticket fermé |
| 8 | **927** le jeu de démonstration du cabinet | B-953 (contrat `jeu-demonstration@1`) | plateforme (données seules) | non | `npm run jeu:verifier -- <dossier>` passe ; jeu à graine fixe |
| 9 | **928** les routes d'import et d'effacement de la démo (C13) | B-953 ; D-918-4 | balance, bilan | 1 pile | les routes déclarées dans `routesInstance` répondent au corps de `contrats/instance/` ; effacement idempotent |
| 10 | **929** clôture : `cabinet-moteur` installe par `POST /installations` | dette 3 de 918 | recette | recette complète | la recette installe par le moteur, plus par le `PUT` de la console ; recette croisée complète verte sur pile neuve, **jouée une fois** |

**Remplaçantes** : STORY-364 (le refus sourcé) ; l'impact recalculé d'une surcharge de mapping (bilan, EPIC-100,
volet sans IA).

## 3. Groupe B : la comptabilité, et ce que B doit à A et à D

Plage : **STORY-956 → 970**. Les stories qui servent D sont intercalées juste avant que D en ait besoin.

| # | Story | Épic | Dépôts | Dépend de | Fini quand |
|:--:|---|:--:|---|---|---|
| 1 | **956** `kit-cible` 1.0.1 ; README et scripts racines avec `encours/` | 161 | plateforme | — | D1 (clé en double : refus nommé, le même en SIMULER et APPLIQUER), D2 (messages plafonnés à 1 024 et 512), D3 (`montantsRequis` et `etats` appliqués par le kit) corrigés ; la suite publiée couvre cloisonnement, atomicité, cas du témoin et `controles` ; étiquette `kit-cible-v1.0.1` **avant le 04/12** ; A prévenu |
| 2 | **957** supervision Kafka corrigée | 155 | notification, paiement, catalogue | — | un consommateur neuf à chaque relance ; `/health` borné à 5 s ; preuve : Kafka arrêté, service redémarré, Kafka relancé, `/health` 200 ; **passation de `notification` à D** |
| 3 | **958** le socle de `prospera-comptabilite-service` | 111 | **neuf** comptabilité | dépôt créé (§6) | Node 24, client de Confluent, MongoDB 8.0 en jeu de répliques, Karapace ; garde sur l'état publié (`garde-etat-publie-v1`) ; manifeste ; cloisonnement par dossier **et par exercice** ; référentiel du dossier ; port fixé (3417 proposé, à vérifier) ; `docker compose up` sain |
| 4 | **959** les exercices et la tenue | 111 | comptabilité | 958 | ouvrir un exercice ; tenue exclusive (D-L3-4), refus nommé si l'autre tenue existe ; bascule d'un exercice au suivant |
| 5 | **960** les 15 rôles du distributeur dans auth | 223 | auth | — | table d'accès de l'annexe B du PRD distributeur appliquée par le serveur ; données privées (rémunérations, prix d'achat) hors des rôles qui n'y ont pas droit ; schéma au registre |
| 6 | **961** le plan de journaux | 112 | comptabilité | 959 | journaux déclarés par le référentiel (achats, ventes, banque, caisse, OD, à-nouveaux) ; numérotation continue par journal et exercice, par `series-v1` |
| 7 | **962** l'écriture en brouillard | 113 | comptabilité | 961 | équilibre **par pièce** ; contrôle d'exercice et de date ; pièce justificative rattachée (`pieceId`) |
| 8 | **963** la Créance (1) | 231 | paiement | — | registre unique, clé `(source, sourceId)`, source `FACTURE` ; un tiers, un périmètre ; idempotent |
| 9 | **964** la validation inaltérable | 113, 120 | comptabilité | 962 | brouillard → définitif ; une écriture validée ne se modifie pas, elle se **contre-passe** ; séquence prouvée par une piste chaînée ; mutation |
| 10 | **965** la Créance (2) | 231 | paiement | 963 | crédit du tiers, compteurs ; `paiement.creance.changed@1` au registre en BACKWARD, annoncé dans « ⚠ Contrats » de B |
| 11 | **966** le grand livre | 114 | comptabilité | 964 | consultation par compte et par période, soldes et mouvements |
| 12 | **967** la balance dérivée du grand livre | 114 | comptabilité | 966, **A-921** | balance publiée au contrat canonique, origine `comptabilite`, `checksum` ; ingérée par `balance-service` |
| 13 | **968** les comptes de tiers | 115 | comptabilité | 964 | clients, fournisseurs, salariés ; compte collectif ; balance âgée |
| 14 | **969** le lettrage | 116 | comptabilité | 968 | manuel, automatique (montant, référence, date), partiel, délettrage, écarts de règlement |
| 15 | **970** la clôture | 119 | comptabilité | 966 | centralisation ; à-nouveaux dérivés du grand livre ; réouverture tracée ; exercice clos inaltérable |

**Remplaçantes** : l'export du journal général et du fichier des écritures (EPIC-120) ; désinstaller et réinstaller
(FR-39) ; les tickets `dates-cibles-de-module` et `repartition-par-version` (catalogue). **Hors du lot** : 117 et 118
(IA, attendent `assistant-service`) ; l'agent sur site (148 → 150), sorti de février par l'amendement du 14/11.

## 4. Groupe D : distributeur et assurance en alternance

Plage : **STORY-1045 → 1059**. 🚚 distributeur, 🛡 assurance.

| # | Story | | Épic | Dépôts | Dépend de | Fini quand |
|:--:|---|:--:|:--:|---|---|---|
| 1 | **1045** `vocabulaires/` et `contrats/distributeur/` dans la plateforme | 🚚 | 222 | plateforme | — | le reste de 1042 (D-1042-3) livré ; joués par les scripts racines |
| 2 | **1046** la compagnie de démonstration | 🛡 | 204 | assureur-fictif, plateforme | passation de C | le jeu de l'assurance au format `jeu-demonstration@1`, vérifié par `jeu:verifier` ; routes d'import et d'effacement C13 |
| 3 | **1047** la bibliothèque d'encours | 🚚 | 225 | plateforme (`encours/`) | B-956 (README) | une seule règle de calcul ; même résultat pour la même entrée ; étiquette publiée |
| 4 | **1048** le LC fictif refuse l'espace réel | 🛡 | 204 | assureur-fictif | 1046 | refus de démarrer hors d'un espace d'essai ; les quatre scénarios `SIN-2026` se rejouent après une remise à zéro |
| 5 | **1049** les garde-fous | 🚚 | 225 | ventes | 1047 | paramètres par organisation figés à l'acte ; plafond de crédit ; squelette de la saga de réservation |
| 6 | **1050** les dettes de `reseau-service` | 🚚 | 145, 264 | reseau | — | garde sur l'état publié (D-1030-2) ; `/moi/droits` à la place de la table rôle → droits (D-1032-2) ; `commercial.changed` republié quand seul l'état du compte change (D-1034-5) |
| 7 | **1051** prévenir l'assuré (1) | 🛡 | 220 | notification | B-957 (passation) | modèles de messages de l'assurance : aucune donnée de santé, aucun montant d'indemnité ni le mot « fraude » à l'assuré (test) ; relances de pièces espacées de 5 jours |
| 8 | **1052** les séries hébergées | 🚚 | 224, 263 | ventes, plateforme | — | aucun numéro perdu ni réémis après une restauration ; jeu de répliques |
| 9 | **1053** les 15 rôles appliqués par le serveur | 🚚 | 223 | les cinq services | **B-960** | table d'accès lue du jeton et de `/moi/droits` ; périmètre lu sur `reseau.portee.changed@1` |
| 10 | **1054** prévenir l'assuré (2) | 🛡 | 220 | notification | 1051 | accusé de réception ; repli dans la cloche ; consentements par finalité |
| 11 | **1055** l'import réseau par la Reprise | 🚚 | 165 | reseau | **B-956** | le volet Reprise de 1041 (D-1041-3) sur `kit-cible` 1.0.1 ; la suite de conformité du kit passe |
| 12 | **1056** la commande (1) | 🚚 | 228 | ventes | 1049, 1052 | saisie, validation ; numéro de bon de livraison par les séries |
| 13 | **1057** la recette de la démo assurance | 🛡 | 204 | assureur-fictif | 1046, 1048 | les vérifications de l'annexe E rendues jouables contre la compagnie fictive |
| 14 | **1058** le jeu « Grossiste du Golfe » | 🚚 | 226 | ventes, terrain, plateforme | 1056 | jeu au format `jeu-demonstration@1` ; routes d'import et d'effacement C13 |
| 15 | **1059** la facture juste (1) | 🚚 | 230 | ventes | **B-963, B-965** | une facture ouvre sa Créance dans `paiement` ; idempotente |

**Remplaçantes** : les référentiels du distributeur côté réseau (EPIC-227 : zones à plat, points de vente
rattachés) ; la commande (2).

## 5. Groupe C : il finit son lot 2

Au 17/11, C a livré 989, 991 → 999 ; restent **1000 → 1004** (§4 du lot 2). Ensuite, la consigne du 15/11 : EPIC-201
→ 211, hors EPIC-204 (D-L3-2). C ne cède que `prospera-assureur-fictif` : il écrit la passation (dernier commit sur
`dev`) dans son journal, ou D la constate au rituel de 1046.

## 6. Ce que l'utilisateur doit faire (gestes réservés)

| Geste | Pour | Avant |
|---|---|---|
| Créer `prospera-comptabilite-service` (privé, `MoneyVibesGroup`), « Rebase and merge » seul | B-958 | la 3e story de B |
| Lancer A sur ce plan (poste principal) | A | dès la fusion |
| Lancer D sur ce plan (autre poste) | D | dès la fusion |

## 7. Ce que les groupes attendent les uns des autres

| Story qui attend | Attend | Rang de la story attendue | Risque |
|---|---|---|---|
| B-967 | A-921 | 2e de A | faible |
| D-1047 | B-956 (README) | 1re de B | faible |
| D-1051 | B-957 (passation de `notification`) | 2e de B | faible |
| D-1053 | B-960 | 5e de B | faible |
| D-1055 | B-956 | 1re de B | faible |
| D-1059 | B-963, B-965 | 8e et 10e de B | moyen : dernière de D |
| C (piles MinIO) | A-920 | 1re de A | faible |
| A-929 | A-928 | — | — |

**Si une story attend malgré tout**, le groupe prend une remplaçante de sa section et l'écrit dans son journal.

## 8. Les plages d'identifiants (lot 3)

| Groupe | Plage du lot 3 | Plage réservée |
|---|---|---|
| A | STORY-920 → 929 | 902 → 929 |
| B | STORY-956 → 970 | 930 → 979 |
| D | STORY-1045 → 1059 | 1030 → 1079 |

Les plages sont déjà au tracker (`reserved_ranges`) ; le lot 3 y est noté. Chaque groupe insère ses entrées juste
après la dernière de sa plage (§9.2 du lot 2) ; le plafond `story_id_high_water_mark` reste le MAX réellement écrit.
