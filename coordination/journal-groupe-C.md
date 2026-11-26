# Journal du groupe C

> Écrit par le groupe C seulement. Lot : `PLAN-4-SESSIONS-2026-11-14.md` §5 (l'assurance).

## État

### Lot 7 (ouvert le 2026-11-25) — `PLAN-LOT-7-2026-11-24.md` §3

- **Poste** : C a quitté le poste principal (plan §2 bis) ; il travaille sur l'autre poste (`C:\Users\USER\…`, session de
  groupe `moneyvibes-apps-86`, une sous-session neuve par story). **Verrou Docker partagé avec B et D**
  (`MoneyVibes_Apps\.verrou-docker`, pris par `noclobber`) ; piles `grp-c` seulement, descendues avec leurs volumes.
- **Ordre** (amendement du 25/11, puis le tableau du §3 ; **amendé le 25/11 à 21:50, point 4** : 564 avant 1022) :
  **1020 → 1019 → 1021 → 564 → 1022 → 1023**, puis 317 → 318 → 319 → 321 → 324 → 325 → 327 → 329 → 339 → 338 → 340 → 341 → 342 → 343 → 344 → 350 → **566**
  (fiscal, et comptabilité pour 338).
- **Dépôts tenus au lot 7** : `prospera-balance-service` ; `prospera-fiscal-service`, **partagé par dossier avec D**
  (D-L7-1, passation ci-dessous) ; `prospera-comptabilite-service` (pour 338). `document-service` est passé à B (#848).
  Le paquet fiscal Togo est à C (D-L7-3).
- **Fichiers `.env`** : aucun sur ce poste (seulement les `.env.example`) ; leur dépôt est un geste de l'utilisateur (plan
  §2 bis, 5). Les tests et les gates posent leurs variables eux-mêmes.
1. ✅ **STORY-1020 DONE (25/11)** : balance-service **#165** (`f6d3f8f` recopie, `4d3408f` export, `58322c4` gardes),
   contrat #890, manifeste `balance` 1.2.0. `GET …/rapprochement/etat/export?format=pdf|xlsx` : équation, balance de
   référence, avertissements, situation, lignes non rapprochées et justifications, PROVISOIRE tant que la balance n'est
   pas VALIDÉE, empreinte du contenu non daté. **FE-077 débloquée (→ A).** Recopie des paquets SYSCOHADA révisé et SMT de
   1118 dans la même PR (← D servie) : plan à 291 / 296 comptes, trois gardes suivies (D-1020-11). Node 24 : unitaires
   286/286 suites, 5584 ; e2e 36/36, 1989 ; mutations 7/7 ; pas de compose (D-1020-9). Verrou pris deux fois (la première
   perdue sur une coupure réseau, rendue par la session de groupe), rendu à 13:43. D-1020-1 → 11 dans la fiche.
2. ✅ **STORY-1019 DONE (25/11)** : balance-service **#166** (`ab4e468` sur `dev`), contrat #904 (annoncé avant le code).
   Les 8 routes des scénarios et de la justification exigent l'état publié de `conseil` (**403 `CONSEIL_NOT_ENTITLED`**
   sinon ; `ABONNEMENT_EXPIRE` en écriture en lecture seule) ; `etats_publies_conseil` projeté du même topic, effacé par
   le plan C13 ; `POST /api/v1/instance/conseil/{organisationId}/verifications/{code}` sert `aucun-scenario-applique` et
   `gate-conseil`. **← D servie** : sur `INSTANCE_ESPACE=ESSAI`, la garde de balance (et celle du conseil) ne lit plus le
   KYC. Manifeste `conseil` inchangé. Node 24 : unitaires 292/292 suites, 5645 ; e2e 37/37, 2283 ; mutations 21/21 ;
   pile `grp-c` 22/22 (REEL et ESSAI, états publiés par Kafka) ; verrou pris deux fois (20:01 → 20:15, 20:42 → 20:43). D-1019-1 → 12 dans la fiche. **→ B** : la recette `atelier-balance` doit octroyer `conseil`.
3. ✅ **STORY-1021 DONE (25/11)** : balance-service **#167** (`b52d262` routes, `465a308` garde STORY-529 ; `dev`
   `465a308`), contrat #916 (annoncé avant le code). `GET /api/v1/instance/balance/{organisationId}/export` (JSON, 32
   collections du module ; **CSV par objet**, `?format=csv&objet=`, réponse du PO à Q-D-19 ; 403 `BALANCE_NOT_ENTITLED`
   en `NON_INSTALLE`), `GET …/sante` (`sante@1` : MongoDB et sonde Kafka), `POST /api/v1/instance/balance/migrer`
   (`dossiers-d8` puis `profils-529` ; 409 `MIGRATION_INCOMPLETE` ; par la route, seuls les cabinets inconnus sont
   republiés). Manifeste inchangé. Node 24 : unitaires 297/297 suites, 5691 ; e2e 37/37, 2291 ; mutations 32/32 ; pile
   `grp-c` 37/37 (REEL et ESSAI, Kafka arrêté) ; verrou pris deux fois (21:31 → 21:40, 21:47 → 21:52). D-1021-1 → 18
   dans la fiche. **→ D (information)** : balance sert le CSV par objet, bilan peut prendre la même forme.
4. **Amendement d'ordre (25/11, 21:50, session de groupe de C, convenu avec D qui commence 347)** : après 1021,
   **STORY-564** passe avant 1022 — l'ordre devient **1021 → 564 → 1022 → 1023 → 317 → 318 → …** (le reste du §3
   inchangé). Raison : **348 de D attend 564**.
5. ✅ **STORY-564 DONE (25/11)** : balance-service **#168** (`c9e94c6` sur `dev`) et fiscal **#66** (`fd34834` sur `dev`,
   rebasée sur `4a1d938` de D), annonce #921 avant le code. Le paquet fiscal Togo 2026 porte le barème de l'Art. 74
   **sourcé élément par élément** (`article`, `millesime`), la base des traitements et salaires
   (`irpp.traitementsSalaires`, `ordreDeCalcul`), le périmètre des revenus (`irpp.revenusCategoriels`), les retenues de
   l'employeur (`irpp.retenueALaSource`, LPF Art. 26, 27, 43) et le bloc `cnss` du 24/11 ; garde **R11** au packaging ;
   empreinte **`bfcc3fc9…c065`**. Fiscal : `domain/familles/irpp-traitements-salaires.ts`, calcul pur (BLOQUEE nommée pour un
   revenu non couvert, retenues tracées jusqu'à leur ligne de rémunération), aucune route. La contradiction 30 % / 35 % était
   celle de l'amorce : 30 % est la tranche 15-20 M (Art. 74). Node 24 : balance 297/297 suites, 5705 ; e2e 37/37, 2291 ;
   fiscal 201/201, 2905 ; e2e 13/13, 261 ; mutations 4/4 (garde) et 14/14 (calcul). Verrou pris deux fois (22:25 → 22:33,
   22:34 → 22:38). D-564-1 → 12 dans la fiche. **D prévenu** (SHA, empreinte, clés de 348) ; **→ B** : copie de
   `dossier-service` (ci-dessous).
6. ✅ **STORY-1022 DONE (25/11)** : balance-service **#169** (`d5878be` sur `dev`), annonce #927 avant le code. La balance
   publie l'empreinte de ses soldes, **`soldesChecksum`** + **`soldesChecksumVersion: 'soldes-v1'`**, facultatifs, sur
   `balance.created` et `balance.etat.document.change` (aucun des deux pour une balance scellée en `v1`) ; SHA-256 de
   `{ lignes }` projetées `{ compte, soldeDebiteur, soldeCrediteur }`, lignes nulles exclues, tri par point de code — la
   canonisation du sceau réutilisée (`trierParCompte`, `hacherCanonique`), vecteur `49c4d3b1…49d8`. Schéma JSON de
   `balance.created` remis à jour (tenu par Ajv). Node 24 : unitaires 298/298 suites, 5738 ; e2e 37/37, 2291 ;
   mutations 9/9 ; pile `grp-c` 12/12 (Kafka et outbox, empreinte recalculée hors du service). Verrou pris une fois
   (23:08 → 23:19). D-1022-1 → 6 dans la fiche. **D prévenu** (SHA, forme exacte ; D-1078-10 débloqué).
7. ✅ **STORY-1023 DONE (26/11)** : balance-service **#170** (`75179cf` sur `dev`), annonce #930 avant le code. Le
   dossier déclaré : `dossierId` requis sur 39 schémas de réponse des familles `balances`, `balance`, `exercices`,
   `imports`, `cahiers`, `pieces/ocr`, `rattachement`, `rapprochement`, `tresorerie` (la donnée d'abord, la route sinon) ;
   un balayage du document OpenAPI classe chaque famille sous `/dossiers` (écartées avec leur raison : fiscal,
   immobilisations, inventaire, devises, profil-societe, referentiels). La lecture de la plateforme (AD-P16, première du
   programme) : `GET /api/v1/plateforme/balance/organisations/{orgId}/dossiers/{dossierId}/balances`, `…/{id}`,
   `…/{orgId}/lectures`, sous `@PlatformReadOnly()` (`PLATFORM_ADMIN` seul, `X-Motif-Lecture`, journal écrit avant la
   lecture, exclu de l'effacement C13). Contrat aligné sur ce qui est servi (200 du rejeu de `POST /balances`, 201 des
   POST de reprise). Node 24 : unitaires 300/300 suites, 5764 ; e2e 38/38, 2324 ; mutations 11/11 ; pile `grp-c` 17/17 ;
   verrou pris deux fois (01:08 → 01:18, 01:18 → 01:20). D-1023-1 → 13 dans la fiche. **→ B (information)** : la console
   lit la balance d'une organisation par ces routes.
8. 🏁 **Les cinq stories de balance placées en tête du lot 7 sont livrées : 1020, 1019, 1021, 1022, 1023** (564, du
   fiscal, glissée entre 1021 et 1022 par l'amendement du point 4).
9. ✅ **STORY-317 DONE (26/11)** : fiscal **#69** (`98ab317`, `8f6b1ba` sur `dev`) et balance-service **#171** (`44be0c1`),
   annonce #940 avant le code. Une obligation porte l'**échéance applicable** (`echeance` : la date reportée s'il y a un
   report) et la **légale** (`echeanceLegale`, du paquet) ; le **report** est un champ humain (`{ reportId, date,
   echeanceLegale, decision: { reference, du }, motif, par, le }`), gardé par la re-dérivation (un report n'avance jamais
   une échéance). `POST /api/v1/obligations/reports` (une décision, les obligations d'un dossier, tout ou rien) et
   `POST /api/v1/obligations/{id}/report/annulation`, droit `valider` ; actes `OBLIGATION_ECHEANCE_REPORTEE` (auteur, date de
   la décision, portée) et `OBLIGATION_REPORT_ANNULE`. **`qualifierRetard`** (pur, `domain/obligations/report-echeance.ts`)
   compte le retard sur l'applicable : **318 le prolonge** (états, horizon), 319 n'y touche pas. **← D servie** :
   `cnss.collecte` au paquet (empreinte **`d0558c54…2465`**). Node 24 : fiscal 205/205 suites, 2995 ; e2e 13/13, 278 ;
   conformité 19/19, 121 ; balance 300/300, 5764 ; e2e 38/38, 2324 ; mutations 14/14 et 1/1 ; compose `grp-c` sain, routes en
   401 sans jeton ; verrou pris deux fois (02:39 → 02:50, 02:54 → 02:56). D-317-1 → 11 dans la fiche. **D prévenu** ;
   **→ B** : copie de `dossier-service` (demande mise à jour ci-dessous).
10. ✅ **STORY-318 DONE (26/11)** : fiscal **#70** (`cefbe20` sur `dev`), annonce #945 avant le code. **`qualifierEcheance`**
   (pur, `domain/obligations/alertes-echeance.ts`) compose `qualifierRetard` de 317 : `NON_DATEE`, `PAS_ENCORE_PREPAREE`,
   `EN_RETARD_DE_PREPARATION` (pas encore `VALIDEE` et dans l'horizon), `PREPAREE`, `ECHEANCE_DEPASSEE`, `DEPOSEE`, sur
   l'échéance applicable ; **horizon par organisation** (1 à 90 j, 7 par défaut, `PUT /obligations/alertes/horizon`, droit
   `valider`, acte `ALERTES_HORIZON_CHANGE`). **BullMQ entre au service** (AD-18) : balayage `balayage-des-echeances` (cron
   `ALERTES_ECHEANCE_CRON`, 05:00 UTC) et rattrapage du jour au démarrage ; une alerte par `(obligation, état, échéance)`
   (`alertes_echeance`, index unique `cle_alerte`) et **`fiscal.obligation.alerte-echeance`** v1 par l'outbox ;
   `GET /obligations/alertes` (portée du calendrier) ; `etatEcheance` et `joursRestants` au calendrier. **Le relais de l'outbox
   passe sur BullMQ** (planificateur `relais-outbox`, concurrence globale de 1 ; plus aucun `setInterval`, garde AST). Node 24 :
   unitaires 209/209 suites, 3050 ; BullMQ sur vrai Redis 2/2 ; e2e 13/13, 282 ; conformité 20/20, 126 ; mutations 20/20 ;
   pile `grp-c` à **deux répliques** (2 alertes pour 2 clés après 12 balayages, faits `SENT`, reprise après arrêt sans doublon) ;
   verrou pris deux fois (03:43 → 04:00, 04:15 → 04:26). D-318-1 → 13 dans la fiche. **→ D** (notification) ci-dessous.
11. ✅ **STORY-319 DONE (26/11)** : fiscal **#71** (`0cc79a7` sur `dev`), annonce #951 avant le code. **`POST
   /obligations/affectation`** (droit `valider`, 1 à 50 obligations, tout ou rien, `null` retire ; le responsable est un membre
   **actif** du cabinet qui **voit le dossier** dans sa portée ; acte `OBLIGATION_RESPONSABLE_AFFECTE` au journal chaîné) ;
   **`GET /obligations/charge`** et **`/obligations/charge/{responsable|AUCUN}`** (charge et retards par collaborateur, sur
   `qualifierEcheance` et l'horizon du cabinet, obligations actives non déposées, portée de l'appelant) ; la re-dérivation garde
   l'affectation (AD-17, prouvé sur MongoDB) ; **la clé de l'alerte suit le responsable** (D-319-9 : sans responsable, celle de 318).
   Node 24 : unitaires 211/211 suites, 3077 ; Redis 2/2 ; e2e 13/13, 286 ; conformité 21/21, 132 ; mutations 23/23 ; pile `grp-c`
   saine, D-319-9 de bout en bout (3e alerte et 3e fait `SENT` portant le responsable). Verrou pris une fois (07:04 → 07:17).
   D-319-1 → 11 dans la fiche. **D prévenu** (349).
12. 🏁 **EPIC-030 fini** (315 → 319 : le calendrier du portefeuille, les échéances du paquet, les reports, les alertes, le
   responsable et la charge).
13. 🚧 **STORY-321 en cours (26/11)** : la délégation du calcul au moteur de `balance-service` (fiscal, branche `MNV-321` ;
   balance-service lu seulement, D-321-1) ; fiche `stories/STORY-321.md` écrite avant le code (D-321-1 → 11), contrat et
   communs annoncés ci-dessous (« ⚠ Contrats », « ⚠ Communs »).

### Lot 6 (depuis le 2026-11-23) — `PLAN-LOT-6-2026-11-23.md` §4

Session du groupe C sur le poste principal : `moneyvibes-apps-dc`. Elle a ouvert, sur consigne de l'utilisateur du 23/11,
STORY-1097 et 1098 (notées au journal de A, où l'utilisateur les avait demandées) ; à partir du lot 6, **ce journal-ci
porte l'état de C** (consigne de l'utilisateur du 23/11 : « mets-toi à jour avec le lot 6, vu que tu es le groupe C »).

- ✅ **Avant tout** (§4) : le manifeste `comptabilite` **0.4.0** est recopié au catalogue (catalogue #65, `eb495b5`,
  et son correctif #66, `acfb751`, qui retire 74 `index.ts` du générateur de barrels entrés par erreur ; rien d'autre
  n'avait changé).
- ✅ STORY-1097 (comptabilite #17) et ✅ STORY-1098 (comptabilite #18), livrées le 23/11 (journal de A pour le détail).
- **Ordre du lot 6 de C** (les dépendances de la fiche de 1100 — 1087, 1088 — passent devant elle) :
  1. ✅ **STORY-1099 DONE (24/11)** : balance-service **#160** (`0ff2402` sur `dev`), contrat #758. Unitaires Node 24
     5555, intégration Mongo 10/10, e2e 253/253, mutation 5/5, gate `grp-c` vert, verrou pris à A et rendu. Écart au
     contrat : la mémoire du cabinet est réservée à l'administrateur (D-1099-5, STORY-694) ;
  2. ✅ **STORY-1087 DONE (24/11)** : document-service **#30** (`1db0a8f` sur `dev`), fiche #768, amendement #771
     (le plan suit le dossier client : PERMANENT / ANNUEL, conservation, trace de numérisation), manifeste `ged` 1.1.0
     #773. Codée par une sous-session ; unitaires Node 24 1100, e2e GED 16/16, mutation 8/8, gate `grp-c` vert, verrou
     cédé par A et rendu. Q-SC-5 : 20 Go par cabinet, en alerte (D-1087-5) ;
  - ✅ **Ticket #762** (A, FE-149 : l'écriture de facture modifiable ligne à ligne) et la mémoire du cabinet de 1098
     réservée à l'administrateur : **comptabilite #19** (`979ed53` sur `dev`), contrat #767 ; test:socle 333/333,
     unitaires Node 24 1006/1006 ; verrou cédé par A, rendu ;
  - **24/11, consigne de l'utilisateur relayée par A** : A prend `prospera-fiscal-service` pour 323, 320, 322, 328 et le
     rend à C à la fusion de 328 (passation au journal de A). C prend **326** avant 1101. Ordre de C : 1087, 1088, 1100,
     puis, à la reprise du fiscal, 326, 1101, 315, 316 ;
  3. ✅ **STORY-1088 DONE (24/11)** : document-service **#31** (`9d0cfd3` sur `dev`), fiche #811, manifeste `ged`
     1.2.0 #814. Unitaires Node 24 1122, e2e GED 17/17, mutation 6/6, gate `grp-c` vert, verrou cédé par A et rendu ;
  4. ✅ **STORY-1100 DONE (24/11)** : comptabilité **#20** (`e4a53cc`), document-service **#32** (`0716a58`), contrat
     #822, manifestes `comptabilite` 0.5.0 #826 et `ged` 1.3.0 #831. Socle comptabilité 334/334, e2e GED 203/203,
     mutation 8/8, gate `grp-c` vert (vrai fait sur Kafka, rejeu sans double) ; verrou cédé par A et rendu ;
  4 bis. ✅ **STORY-1117 DONE (25/11)** (demande de A, STORY-320) : balance-service **#161** (`e968388`), fiscal **#58**
     (`b2efaa7`), contrat #842 ; D-320-5 levé. Node 24 : balance unitaires 5593 / e2e 1973, fiscal unitaires 2560 / e2e
     208 ; Mongo 8/8, mutation 3/3 ; verrou cédé par A et rendu ;
  4 ter. ✅ **STORY-326 DONE (25/11)** : balance-service **#162** (`8b154df`, le paquet), fiscal **#59** (`2aed546`,
     le contrôle), contrat #857. Node 24 : balance 5552 / 1973, fiscal 2602 / 216 ; mutation 6/6 ; gate `grp-c` vert
     (balance et fiscal `healthy`) ; verrou cédé par A et rendu ;
  5. ✅ **STORY-1101 DONE (25/11)** : balance-service **#163** (`8fbdf6e`, les couples au paquet), fiscal **#60**
     (`0d353c2`, le rapprochement et l'assiette), contrat #862. Node 24 : fiscal 2642 / 223, conformité 93/93 sur le vrai
     `mongo-fiscal` ; mutation 6/6 ; gate `grp-c` vert ; — fiche dans #730, à fusionner avant (geste de l'utilisateur) ;
  6. ✅ **STORY-315 DONE (25/11)** : fiscal **#61** (`7d97ae0`), contrat #867. Node 24 : 2618 / 230, conformité 102/102 ;
     NFR-F13 mesurée (60 ms, 24 ms, 157 ms sur 500 × 12) ; mutation 9/9 ; gate `grp-c` vert (Kafka réel) ;
  7. ✅ **STORY-316 DONE (25/11)** : balance-service **#164** (`b78f500`, le paquet), fiscal **#62** (`f1296ae`, la
     dérivation), contrat #873. Fiscal 2739 / 231, conformité 102/102 ; mutation 4/4 ; gate `grp-c` vert.
- **Décision de l'utilisateur du 25/11** (relayée par A, prospera-stories #887) : STORY-1020, 1019, 1021, 1022 et 1023
  (balance-service, amendement D-L6-5 que C avait manqué) **sortent du lot 6 et passent en tête du lot 7 de C**, dans
  l'ordre 1020 → 1019 → 1021 → 1022 → 1023. Rien n'en a été écrit ni codé.
- 🏁 **LOT 6 DE C CLOS (25/11)** : 1099, 1087, 1088, 1100, 1117 (demande de A), 326, 1101, 315, 316, toutes
  fusionnées (code sur `dev`, docs sur `main`). Derniers commits de C sur `dev` : fiscal `f1296ae`, balance-service
  `b78f500`, comptabilite `e4a53cc`, document-service `0716a58` (passé à B, #849). Aucune pile, aucun verrou, aucune
  branche ouverte. **Le lot 7 attend la décision de l'utilisateur** (il commencera par 1020 → 1023) (« tu termines le lot 6 ici, pour le lot 7 on verra
  après », 25/11) ; PRA-02 cédée à A avec l'accord de C.
- **Docker** : verrou du poste principal (`MoneyVibes_Apps\.verrou-docker`) partagé avec A ; aucune pile de C ne tourne.

- **2026-11-14** : journal ouvert, lot pas encore commencé.
- **2026-11-15** : lot ouvert. **Machine** : le poste principal (Windows), le même que la session qui a tenu le lot de
  A et tient maintenant celui de B. Le lot de A (le plus lourd en Docker) est terminé ; C préfixe ses piles `grp-c`,
  ne publie sur l'hôte que le port de son service, et descend sa pile avec ses volumes à la fin de chaque story.
- **Lot de C, ordre** :
  1. ~~STORY-980~~ : **sinistres #1** (squelette de `prospera-sinistres-service`), docs #497 ;
  2. ~~STORY-981~~ : **assurance #20** (Node 24, client de Confluent, interrupteur `compta-cima`) ;
  3. ~~STORY-982~~ : **ocr #24** (`document-service` sur le socle) ; recette de l'Atelier **51/51 depuis `dev`** ;
  4. ~~STORY-983~~ : **plateforme #3** (champs sensibles, registre `classification-sante`, garde prouvée contre un
     Karapace réel) ;
  5. ~~STORY-990~~ (insérée par C) : **sinistres #2, assurance #21, ocr #25** ; un topic neuf vu en secondes
     (291 s → 6,9 s mesurés) ;
  6. ~~STORY-984~~ : **plateforme #4** (le contrat de l'annexe C, C-1 → C-19) et **liaison-assureur #1** (le
     service, le transport par fichiers, l'intégration idempotente des lots, prouvés sur pile réelle) ;
  7. ~~STORY-985~~ : **liaison-assureur #2** (file d'envoi acquittée, accusés, numéro officiel, file des écarts,
     transport par API, prouvés sur pile réelle) ;
  8. ~~STORY-986~~ : **assureur-fictif #1** (le LC fictif, les deux transports, ses réglages, prouvé avec
     `liaison-assureur` sur pile réelle) ;
  9. ~~STORY-987~~ : **plateforme #5** et **assureur-fictif #2** (le jeu de la démo à graine fixe, 205 915 objets,
     relevé par Prospera sur pile réelle ; remise à zéro) ;
  10. ~~STORY-988~~ : **sinistres #3** (la machine à états du dossier : table `2026.1`, 43 lignes ; décision au
     serveur ; piste d'audit chaînée ; un dossier de `DECLARE` à `CLOTURE` sur pile réelle, rejoué depuis `dev`) ;
  11. ~~STORY-989~~ : **sinistres #4** (« modifié par X à hh:mm », référentiel des échéances, échéancier BullMQ
     qu'une restauration ne rejoue pas ; prouvé sur pile en époque 2, rejoué depuis `dev`) ;
  12. ~~STORY-991~~ : **plateforme #10, liaison-assureur #3, sinistres #5** (outbox, treize faits de
     `liaison-assureur` et `sinistres.dossier.changed@1`, chaque champ classé, Karapace réel ; fraîcheur) ;
  13. ~~STORY-992~~ : **plateforme #12, liaison-assureur #4, sinistres #6** (voie `SAISIE_MANUELLE` et liste
     « à saisir », report du numéro ; numéro officiel rattaché ; table `2026.2`, garde `POLICE_A_RELIRE`) ;
  14. ~~STORY-993~~ : **plateforme #13, liaison-assureur #5, assurance #22** (faits « reçus » avec
     contenu non personnel ; module `assurance` : copie de lecture, fraîcheur, routes polices, table type de sinistre
     → garanties) ;
  15. ~~STORY-994~~ : **plateforme #15, sinistres #7, assurance #23** (proposition par `sinistres`, mouvements en
     ajout seul chez `assurance`, seuil glissant, décision du `RESP`) ;
  16. ~~STORY-995~~ : **plateforme #16, document-service #26** (module `ged` : versions immuables, « à rattacher »,
     port S3 et contrat sur MinIO, santé chiffrée, gate `GED_NOT_ENTITLED`) ;
  17. ~~STORY-996~~ : **plateforme #18, document-service #27** (lecture OCR réelle, contrôle humain, lots ; lot de 50
     pages scannées en 48 s ; moteur OCR corrigé pour les pages JPEG) ;
  18. ~~STORY-998~~ : **sinistres #8** (files de travail par rôle ; route au manifeste, #570) ;
  19. ~~STORY-997~~ : **plateforme #19, document-service #28** (versement, numéro `ARC-`, scellé, vérification, `/C1`) ;
  20. ~~STORY-999~~ : **sinistres #9** (relances, attente d'un tiers, dossiers muets, agents inactifs ; manifeste #573) ;
  21. ~~STORY-1000~~ : **plateforme #20, liaison #6, sinistres #10** (formulaire commun, secours, doublon Prospera et
     LC par empreinte HMAC, réserves, urgence) ;
  22. ~~STORY-1001~~ : **assurance #24, sinistres #12** (+ correctif #11 des codes de type) ; recevabilité,
     garantie, pièces attendues, courrier ; constats posés par commande ;
  23. ~~STORY-1002~~ : **sinistres #13** (manifeste #584) ; registre des gestionnaires, charge pondérée,
     affectation et réaffectation motivée ; parcours joué contre le LC fictif ;
  24. ~~STORY-1003~~ : **sinistres #14** ; parties au dossier, cumuls interdits (paramètre figé), matrice de
     délégation datée (résout `COMITE`), contrôle du niveau 1 ;
  25. ~~STORY-1004~~ : **sinistres #15** ; périmètre par rôle, portée réseau consommée, suite de conformité de D
     verte, inscrit au registre de `reseau-service`.
- **🏁 2026-11-17 — LOT 2 DE C TERMINÉ** (989, 991 → 1004). **Lot 3** (`PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §5) :
  **STORY-1005 → 1014**, dans l'ordre du tableau : 1005, 1006, 1007, 1008, 1014, 1009, 1011, 1010, 1012, 1013.
  ⚠️ Règle du lot 3 (`REGLES-DES-GROUPES.md` §1.2) : **une sous-session neuve par story**, lancée par la session du
  groupe ; tout ce que la story suivante doit savoir est écrit ici ou dans la fiche.
  - ~~**STORY-1005**~~ : **sinistres #16, liaison-assureur #7, document-service (GitHub `prospera-ocr-service`) #29** ;
    la garde lit l'état publié (`garde-etat-publie-v1` de B-937), `entitlement.changed` n'ouvre plus rien ; pile verte,
    rejouée depuis `dev` ; écart nommé : recette de l'Atelier (STORY-100) non rejouée.
  - ~~**STORY-1006**~~ : **assurance #25** ; la garde d'`assurance` lit l'état publié (droit, lecture seule,
    interrupteur `compta-cima` dans `module.interrupteurs[]`) ; pile verte, rejouée depuis `dev` ; reste : les
    référentiels habilités se lisent encore dans `entitlement.changed` (D-1006-5, demande à B).
  - ~~**STORY-1007**~~ : **sinistres #17** ; la dernière pièce validée au contrôle pose l'accusé de réception du
    dossier complet (courrier `ACCUSE_RECEPTION`, une fois) et arrête l'échéance `ACCUSE_DOSSIER_COMPLET`
    (événement `ACCUSE_POSE`) ; Node 24, sans pile (aucun câblage ne change) ; l'envoi reste à EPIC-220.
  - ~~**STORY-1008**~~ : **sinistres #18** ; l'ouverture propose la provision d'ouverture à `assurance` (estimation du
    déclarant, sinon gravité ; une seule fois ; corporel et recours exclus) ; Node 24, sans pile, aucun fait neuf.
  - ~~**STORY-1014**~~ : **prospera-stories #630** (manifeste) et **sinistres #19** ; référentiel des experts et des
    cabinets, agrément daté et son historique, jugement de désignation qui refuse (`AGREMENT_ECHU`…) ; Node 24, sans
    pile ; la désignation d'une mission (FR-61) appellera `ExpertsService.exigerDesignable`.
  - ~~**STORY-1009**~~ : **sinistres #20** ; la transition 6 ou 12 porte les pièces demandées (motif, date, auteur, numéro
    de demande) : la liste s'allonge, `PIECES_COMPLETES` repasse à faux, courrier de demande, relances de 999 reprises ;
    sans pièce nommée, `PIECES_NON_NOMMEES` ; Node 24 (1080 unitaires, 25 e2e), rejouée depuis `dev`, sans pile.
  - ~~**STORY-1011**~~ : **sinistres #21** (manifeste #635) ; un formulaire d'instruction par type de sinistre, en
    paramètre versionné `formulaires-2026.1` (6 familles ; accident du travail et décès renvoient au barème corporel),
    contrôlé par le serveur (`CHAMP_OBLIGATOIRE_ABSENT` nomme tous les champs manquants), version figée à l'entrée en
    instruction ; Node 24 (1110 unitaires, 25 e2e), rejouée depuis `dev`, sans pile.
  - ~~**STORY-1010**~~ : **sinistres #22** ; `calculerLeDecompte` (fonction pure) : dommage, vétusté, règle proportionnelle,
    plafond, franchise ; table `decompte-2026.1` figée par empreinte, jugée à la date de survenance ; SIN-2026-9002
    445 500 → 395 500 au franc ; décompte au franc, repère arrondi à 5 000 une fois à la fin, montant arrêté au franc ;
    Node 24 (1139 unitaires, 25 e2e), rejouée depuis `dev`, sans pile.
  - ~~**STORY-1012**~~ : **sinistres #23** ; le matériel automobile dans le décompte : grille de vétusté par âge et par
    catégorie de pièce (`vetuste-automobile-2026.1`, table distincte, figée par empreinte, jugée à la survenance), vétusté
    sur les pièces seulement, épave (valeur vénale − valeur de l'épave), RC seule avec assuré fautif = zéro et `BLOQUANT` ;
    395 500 au franc, « 775 000 » non reproduit ; Node 24 (1172 unitaires, 25 e2e), rejouée depuis `dev`, sans pile.
  - ~~**STORY-1013**~~ : **sinistres #24** (manifeste #643) ; une évaluation arrêtée n'est jamais recalculée (FR-75) :
    `POST` et `GET …/dossiers/{id}/evaluations`, montant du gestionnaire au franc, décompte copié avec `tableVersion` **et**
    `tableDeVetusteVersion` (jugées à la survenance), une version de plus par correction avec motif, cinq montants à leur
    source ; provision non réalignée (D-1013-8) ; Node 24 (1212 unitaires, 26 e2e), rejouée depuis `dev`, sans pile.
- **🏁 2026-11-17 — LOT 3 DE C TERMINÉ** (STORY-1005 → 1014, dix stories). **Aucune story suivante n'est assignée** : la
  suite attend une consigne de l'utilisateur. Restes nommés dans les fiches : réalignement de la provision à l'évaluation
  (D-1013-8), fait `sinistres.evaluation.arretee@1` (D-1013-9), lever une alerte bloquante (D-1013-10), commande de
  décision de véhicule et cession de l'épave (1012), alertes d'instruction (H-046), questions au PO ci-dessous.
- **2026-11-18 — LOT 4 DE C** (`PLAN-4-SESSIONS-LOT-4-2026-11-18.md` §5), ordre : 1018, 1015, 1017, 1016. Une sous-session par story.
  - ~~**STORY-1018**~~ : **sinistres #25** (dev `034ddba`) ; correctif de FR-73 : arrêter à l'indemnité proposée
    (`reperePropose`, arrondie à 5 000) **ou** au décompte (`indemniteCalculee`, au franc) ne demande pas de motif ; tout
    autre montant l'exige et `MOTIF_ECRIT` porte `details: { calcule, propose }` ; le montant arrêté reste au franc ;
    OpenAPI décrit les deux montants ; aucun contrat ni route neufs ; Node 24 (e2e 27, build 0), rejouée depuis `dev`.
  - ~~**STORY-1017**~~ : **sinistres #26** (dev `6d81cc4`) ; la déclaration rapide (FR-34, FR-35) : `POST
    /api/v1/sinistres/declarations-rapides` (propose) et `POST …/{propositionId}/decision` ; chaque champ avec confiance,
    extrait et règle ; police inconnue jamais proposée ; type incertain jamais inventé ; vocal non lu ; registre
    `sinistres_ia_registre` ; brouillon dans la ligne du registre, aucun dossier. **Passée avant 1015 pendant la pause
    Docker** (écrite sans Docker, vérifiée au retour). Node 24 : lint 0, unitaires 63 suites, e2e 4 suites, build 0,
    `docker compose up` healthy.
  - ~~**STORY-1015**~~ : **plateforme #33 et #34** (dev `cd5a2b8`, `c4368ba`), **sinistres #27** (dev `87e0074`),
    **liaison-assureur #8** (dev `a0713f4`) ; la déclaration part seule au LC : `sinistres.declaration.enregistree@1` et
    `sinistres.garantie.decidee@1` au registre, publiés par `sinistres`, consommés par `liaison-assureur` (ligne C-13) ;
    pile `grp-c` : envoi seul, `LCF-2026-000001` revenu au dossier, écart sans envoi sur une déclaration incomplète ;
    Node 24 (sinistres 1289 unitaires / 33 e2e, liaison 500 / 21 e2e). D-1015-1 → 10.
  - ~~**STORY-1016**~~ : **plateforme #35** (dev `8ce4325`), **assurance #26** (dev `8dc3285`), **sinistres #28** (dev
    `ea1a111`) ; l'arrêt de l'évaluation propose la provision au montant arrêté (motif `EVALUATION`, FR-76) dans la
    transaction du dossier ; `assurance` reste seul écrivain ; rien sans provision ouverte ni pour un recours ; Node 24
    (sinistres 1306 unitaires / 33 e2e, assurance 2392 / 367, plateforme 116), `docker compose up` healthy. D-1016-1 → 10.
- **🏁 2026-11-18 — LOT 4 DE C TERMINÉ** (1018, 1015, 1017, 1016). **Aucune story suivante n'est assignée.** La remplaçante
  du plan est la mission d'expertise (FR-61), non lancée. Restes nommés : lecture de `provision.changed@1` par `sinistres`
  (D-1016-10), `sinistres.evaluation.arretee@1` (D-1013-9), lever une alerte bloquante (D-1013-10).
- **⏸ 2026-11-16 — PAUSE demandée par l'utilisateur après STORY-988** ; **levée le 2026-11-16** (« reprends C pour
  terminer son lot ») : C enchaîne son lot 2.
- **2026-11-16 — lot 2** (`PLAN-4-SESSIONS-LOT-2-2026-11-16.md`, rédigé par C sur consigne de l'utilisateur : 15
  stories backend par groupe) : le lot de C devient **989, 991 → 1004** (§4 de ce plan). Il remplace l'ordre
  ci-dessus à partir de 991.
- **Ensuite (consigne de l'utilisateur du 2026-11-15)** : « ajoute les stories suivantes 201 à 211 », soit les stories
  restantes des épics **EPIC-201 → EPIC-211** d'`epics-assurance-2026-11-13.md` (rôles et portées, déclaration,
  instruction, expertises, décision, paiement, clôture), écrites juste avant d'être codées, dans la plage de C
  (STORY-991 → 1029). Backend d'abord ; les écrans attendent la coque `prospera-app`.
- **Docker** (2026-11-16) : aucune pile de C ne tourne (`grp-c-recette` et `grp-c-k` descendues avec leurs volumes).

## Dépôts tenus

**Lot 6 (D-L6-1 → 3)** : `prospera-comptabilite-service`, `prospera-balance-service` (cahiers),
`document-service`, **`prospera-fiscal-service`** (repris de A pour ce lot). L'assurance (`prospera-sinistres-service`,
`prospera-assurance-service`) passe à D (passation ci-dessous).

Jusqu'au lot 4 : `prospera-assurance-service` (« Rebase and merge » seul depuis le 2026-11-15 ; il acceptait encore les commits de
fusion), `prospera-ocr-service` (`document-service`), et les trois dépôts neufs :
`prospera-sinistres-service` (**`main` et `dev` posées le 2026-11-15**, « Rebase and merge » seul), `prospera-liaison-assureur-service` (**`main` et `dev` posées par STORY-984**, « Rebase and merge » seul),
`prospera-assureur-fictif` (**`main` et `dev` posées par STORY-986**, « Rebase and merge » seul). Dans
`prospera-plateforme` (créé par B) : dossiers `contrats/assurance/`, `champs-sensibles/`, `classification-sante/`
seulement.

## Passations

- **→ D (2026-11-25, lot 7, D-L7-1) : `prospera-fiscal-service` s'ouvre à D, partagé par dossier** — SHA de départ :
  `origin/dev` **`f1296ae`** (STORY-316, fiscal #62). **Rien en cours chez C** dans ce dépôt : aucune branche ouverte, aucune
  PR, aucune migration en vol, aucune pile.
  - **Dossiers de D** (`src/modules/…` et leurs `application/`, `domain/`, `adapters/` du même nom) : `depots`,
    `livrables-depot`, `paquets-depot`, `completude-depot`, `remuneration`, et le futur coffre des secrets de canal
    (STORY-560). C n'y écrit pas.
  - **Dossiers de C** : `echeances`, `obligations`, `familles`, `qualification`, `paquets`, `redevables`, le futur
    `reglement` ; et, faute d'être nommés par le plan, les autres dossiers déjà là (`auth`, `diagnostics`, `exercices`,
    `habilitations`, `implantations`, `invitations`, `rattachements`, `read-models` hors fichiers communs) : D qui doit y
    toucher le traite comme un fichier commun.
  - **Fichiers communs** (D-L7-2) : `app.module.ts`, le manifeste `declarations`, le contrat OpenAPI, `package.json`, les
    migrations, `read-models/`, les copies du paquet fiscal. Un changement se dit dans la description de la PR, rebasée sur
    `origin/dev` juste avant la fusion, et dans « ⚠ Communs » du journal du groupe **avant** la fusion. **Une seule
    migration en vol** : celui qui en ouvre une le dit, l'autre attend sa fusion.
  - **Paquet fiscal** (D-L7-3) : à C. D demande la recopie ici (le SMIG pour 348), ou la fait dans sa PR en le disant.
  - **Pièges** (voir « Pièges rencontrés ») : gate avec `prospera-recette/docker-compose.fiscal.yml` et une surcouche
    pointant l'archive de la branche ; `test:conformite` sur `mongo-fiscal` en jeu de répliques (scripts `mongo/` en LF) ;
    suite unitaire en `-w 2` ; Dockerfile `# syntax=` à retirer dans la copie archivée quand la VM Docker n'a pas de DNS.

- **→ B (2026-11-25, lot 7, plan de B #848) : `document-service` (= `prospera-ocr-service`, module `ged`)** — décision de
  l'utilisateur du 25/11. Dernier commit de C sur `dev` : **`0716a58`** (STORY-1100, document-service #32). C n'y touche
  plus : aucune story du reste de son lot 6 (1117, 326, 1101, 315, 316) ne l'ouvre. **Rien en cours** : ni branche
  ouverte, ni PR, ni pile Docker.
  - **Livré par C** : STORY-1087 (#30, fonds d'archives du cabinet, plan de classement PERMANENT / ANNUEL, droits
    `ged:*`, chiffrement des pièces du cabinet, quota), STORY-1088 (#31, l'original papier : réceptions, boîtes et
    cotes, sorties, récolement, restitution, recherche dans un fonds), STORY-1100 (#32, mémoire de classement, factures
    comptabilisées rangées au fonds par `comptabilite.facture.inscrite`). Manifeste `ged` **1.3.0**
    (`prospera-stories@f703671`, empreinte épinglée dans `src/socle/manifestes/sources-des-manifestes.ts`).
  - **Demandes encore ouvertes, à B lui-même** (section « Demandes aux autres groupes ») : rôle `CAB_ARCHIVISTE` et
    attribution des droits `ged:*` aux rôles du cabinet chez `auth-service` (D-1087-4 : sans elle, seul un
    `TENANT_ADMIN` a les droits) ; copie du manifeste `ged` 1.3.0 au catalogue. — ✅ **toutes deux servies** (vérifié
    le 25/11 : auth #48/#49, catalogue #74 `1aa17ae`) ; rien d'ouvert ne passe à B.
  - **Nommé pour plus tard** (décisions des fiches, à reprendre dans le lot 7 de B) :
    - destruction approuvée et inscrite au registre (1087 : `conservationAns` est affichée seulement) ;
    - quota de 20 Go par cabinet en alerte seulement, Q-SC-5 encore à l'utilisateur (D-1087-5) ;
    - recherche dans **tous** les fonds du cabinet (D-1088-4) ; pas d'index texte, le texte lu étant chiffré au repos :
      la recherche déchiffre en mémoire 500 pièces au plus, un très gros fonds demandera un index chiffrable (D-1088-6) ;
    - notification par e-mail d'une sortie en retard (l'alerte se lit seulement, `GED_RETARD_TOLERANCE_JOURS`) ;
    - création d'une réception et de ses boîtes non transactionnelle ; deux sorties concurrentes d'une même pièce non
      verrouillées (D-1088-11) ;
    - fin d'exercice prise au 31/12 de l'année de l'exercice, faute de date d'exercice dans la GED (D-1088-7) ;
    - fait de **désinscription** d'une facture : un brouillard abandonné laisse sa copie au fonds (D-1100-3) ;
    - `conservationAns` jamais retenue par la mémoire de classement (D-1100-6) ; une clé par étage, NIF sinon nom
      (D-1100-7).
  - **Pièges** : jouer **tous** les e2e (le recensement de STORY-695, `test/dossier-portee-collaborateur.e2e-spec.ts`,
    tient la liste fermée `PORTEE_DU_CABINET` des 44 routes du cabinet) ; au gate, `minio: ports: !reset []` (port 9001
    pris sur le poste principal) et `mc mb kyc-documents` sur un MinIO neuf (D-1087-14) ; l'empreinte du manifeste se
    calcule sur les octets LF ; avertissement Swagger « Duplicate DTO `ReceptionDto` » à renommer avant de générer des
    types pour un écran.

- **← A (2026-11-24, à la fusion de 328) : `prospera-fiscal-service`** — rendu à C sur `dev` **`0596fc4`** (fiscal #57,
  docs #841 `d38b268`). Patron des anomalies pour 326 et 1101 : code `SIGNALEE` au `CATALOGUE`
  (`domain/obligations/anomalies.ts`), `AnomaliesObligationsService.signaler(...)` / `retirer`, empreinte du fait (la
  même ne rouvre pas une levée), `409 ANOMALIE_BLOQUANTE`, levée `POST /obligations/{id}/anomalies/{code}/levee`,
  dossier de contrôle `GET /exercices/{id}/obligations/anomalies` ; pour 1101, un code de rapprochement
  `bloque: ['A_DEPOSER']`. Restent à faire hors de C : 321, 333, 334.

- **→ D (2026-11-23, lot 6, D-L6-3) : `prospera-sinistres-service` et `prospera-assurance-service`** — derniers commits
  de C sur `dev` : sinistres **`ea1a111`** (STORY-1016), assurance **`8dc3285`** (STORY-1016). C n'y touche plus pendant
  le lot 6. À reprendre par D (plan §6) : `sinistres` lit `provision.changed@1` (D-1016-10), publie
  `sinistres.evaluation.arretee@1` (D-1013-9), lever une alerte bloquante (D-1013-10), la mission d'expertise (FR-61).
  Pièges à lire avant : client Kafka de Confluent (`admin.createTopics` avant `subscribe`, `metadataMaxAge: 10_000`),
  Node 24 pour les tests, « ⚠ Contrats » et « Pièges rencontrés » ci-dessous. `prospera-liaison-assureur-service` n'est
  pas nommé par le plan : C le garde, et le cède à D sur simple demande ici.

- **→ D (2026-11-17) : `prospera-assureur-fictif`** — dernier commit de C sur `dev` : `78ad10c` (STORY-987) ; D l'a
  constatée au rituel de 1046 et tient le dépôt depuis. C continue de jouer ses parcours contre le LC fictif (STORY-1002
  l'a fait) et demande à D toute modification, ici.

## Demandes aux autres groupes

- **→ D (2026-11-26, STORY-318) : prévenir par e-mail ou dans la cloche à l'approche d'une échéance fiscale
  (`prospera-notification-service`)** — **ouverte**, sans urgence. **Publié depuis fiscal #70 (`dev` `cefbe20`).** Le fiscal produit l'alerte (une par obligation, état
  et échéance applicable) et la publie : **`fiscal.obligation.alerte-echeance`** v1 (forme au « ⚠ Contrats » ;
  `etat` `EN_RETARD_DE_PREPARATION` | `ECHEANCE_DEPASSEE`, `responsable` = identifiant d'utilisateur ou `null`).
  Demandé : la consommer et prévenir le `responsable` (sans responsable : les associés du cabinet). **Choix par défaut de
  C** : l'alerte se lit dans l'application (`GET /api/v1/obligations/alertes`, calendrier) ; aucun message ne part tant
  que notification ne consomme pas le topic. Rien ne bloque 318 ni 319.

- **→ D (2026-11-25, STORY-1022), information** : `soldesChecksum` / `soldesChecksumVersion` (`soldes-v1`) publiés sur
  `balance.created` et `balance.etat.document.change` (balance-service `dev` `d5878be`) ; D-1078-10 peut se faire
  (algorithme et vecteur dans « ⚠ Contrats » et `stories/STORY-1022.md`). Prévenu par message (session
  `moneyvibes-apps-83`).

- **→ B (2026-11-25, STORY-564, mise à jour le 26/11 par STORY-317) : recopier le paquet fiscal Togo 2026 dans
  `dossier-service`** — **ouverte** (plan du lot 7 §6 : à ta prochaine story sur le service, en LF). **Dernière version :
  prospera-balance-service `dev` `44be0c1`, sha256 `d0558c545ae6a95102c188114fcd82034b68c8cfd322d1ca19372f4fc2372465`**
  (elle contient celle de 564 et ajoute `cnss.collecte` : une seule recopie suffit). Avant : `dev` `c9e94c6`,
  `src/modules/referentiel/assets/paquet-fiscal-togo-2026.json`, sha256 `bfcc3fc9…c065` ; cible :
  `src/modules/portefeuille/echeance/assets/paquet-fiscal-togo-2026.json` (la copie actuelle, `e8e94c84…dc6`, n'a déjà ni
  `coherence` ni `rapprochementAnnuel`) ; `git -c core.autocrlf=false show origin/dev:<chemin> > <copie>`, puis son
  empreinte notée s'il y en a une. Clés ajoutées seulement (IRPP, CNSS) ; textes de `aFaire` et de `_meta` changés.
  Prévenu par message (session `moneyvibes-apps-5e`).
- **→ D (2026-11-25, STORY-564), information** : 564 fusionnée, 348 débloquée (SHA, empreinte, chemins des clés envoyés
  par message, session `moneyvibes-apps-83`). Un **gérant majoritaire** n'a pas la base d'un salarié (CGI Art. 28 : 20 %
  sur la fraction ≤ 10 M, sans autre abattement ; seul le barème est commun, Art. 75) : le paquet le déclare non couvert
  (`REMUNERATION_GERANT`) et le calcul le bloque (D-564-5). Le calcul annuel est réutilisable
  (`domain/familles/irpp-traitements-salaires.ts`, dossier de C) ; la mensualisation de la retenue reste à 348.

- **→ B (2026-11-25, STORY-1019) : la recette `atelier-balance` doit octroyer `conseil` au cabinet** — **ouverte**.
  Depuis balance-service #166 (`ab4e468`), les routes des scénarios et de la justification exigent l'état publié du
  module `conseil` : l'étape « ⚡ conseil » de `paquets/recette-croisee/recette/atelier-balance.recette.ts` (STORY-100,
  `POST …/fiscal/scenarios`, `…/simuler`, `…/comparatif`, `…/dossier-justification`) reçoit **403
  `CONSEIL_NOT_ENTITLED`** avec un cabinet qui n'a que `balance` et `bilan`. Demandé : `await octroyer(cabinet, 'conseil')`
  après `balance` (le `PUT` de la console diffère ses vérifications tant que `conseil` n'a pas d'adresse, comme
  aujourd'hui). Facultatif : `conseil=http://balance-service:3007` dans `INSTALLATION_SERVICES` (ses deux vérifications
  sont servies : `aucun-scenario-applique`, `gate-conseil`) — le test FR-6 de `cabinet-moteur`, qui prend `conseil` pour
  module « sans adresse », devra alors en prendre un autre (`declarations`). Et pour l'essai : `INSTANCE_ESPACE=ESSAI` sur
  le `balance-service` de l'espace d'essai (KYC non lu). Rien à recopier au catalogue (manifeste `conseil` inchangé).
- **→ A (2026-11-25, STORY-1019), information** : un cabinet sans le module `conseil` reçoit `403 CONSEIL_NOT_ENTITLED`
  sur les scénarios et le dossier de justification (proposer l'option), `ABONNEMENT_EXPIRE` en écriture s'il est en
  lecture seule ; aucun type généré ne change de forme (descriptions 403 seulement).

- **→ B (24/11, STORY-1087)** : dans `auth-service`, créer le rôle **`CAB_ARCHIVISTE`** et attribuer les droits `ged:*`
  selon la matrice du PRD des services du cabinet (§2.3) : `CAB_ASSOCIE` : `ged:fonds:gerer`, `ged:piece:consulter`,
  `ged:sensible:consulter` ; `CAB_COLLABORATEUR` : `ged:piece:consulter` ; `CAB_ARCHIVISTE` : `ged:fonds:gerer`,
  `ged:lot:numeriser`, `ged:piece:indexer`, `ged:versement:verser`, `ged:physique:gerer`, `ged:piece:consulter`,
  `ged:sensible:consulter` (et rien d'un autre module). Sans cela, seul un `TENANT_ADMIN` a ces droits (D-1087-4). —
  ✅ **close le 25/11** : servie par B en STORY-979 (auth #48 `c0f6243`, #49 `b49d8ab`) ; matrice relue par C dans le
  diff (les sept `ged:*`, `CAB_ARCHIVISTE`, hors du jeton).
- **→ B (24/11, STORY-1087, 1088 puis 1100)** : recopier au catalogue le manifeste `ged` — désormais **1.3.0** (code
  fusionné : document-service #30 `1db0a8f`, #31 `9d0cfd3`, #32 `0716a58` ; source `manifestes/ged.manifest.ts`,
  `f703671`). Les 1.1.0 et 1.2.0 n'ont pas à être semées seules. — ✅ **close le 25/11** : catalogue #74 `1aa17ae`
  (STORY-979).
- **→ B (25/11, STORY-326, puis 1101)** : **republier le paquet togo@2026** dans les deux buckets de la recette
  (`referentiel-packages` pour le fiscal, `docker-compose.fiscal.yml:80` ; `referentiel-packages-essai` pour l'essai,
  `docker-compose.recette.yml:369`), puis vérifier que le contrôle de cohérence ne rend plus `NON_EXECUTE`
  `TOLERANCE_ABSENTE`. Empreinte après 326 : `e2230569…` (balance-service #162) ; **à republier dans sa dernière
  version : `5c683d16…`** (balance-service #164, après 1101 et 316), qui porte aussi `rapprochementAnnuel` et
  l'échéance des sociétés par la forme juridique. Ce n'est pas un script de C qui publie : `balance-service` n'écrit pas dans ce bucket, et le
  fiscal lit le pointeur que lui donne l'événement de publication. C n'a pas trouvé l'éditeur ; `prospera-recette` est
  à B. — ~~ouverte~~ **servie par B** (recette #32, `cd62296` sur `dev`, correctif de STORY-1115 ; lu au rituel de
  STORY-1019) : la pile sème elle-même les paquets de balance-service dans les deux catalogues (`npm run pile` avec
  `docker-compose.fiscal.yml`, recettes de l'essai) ; détail au journal de B. À revérifier côté C au prochain gate du
  fiscal (contrôle de cohérence, plus de `TOLERANCE_ABSENTE`).
- **→ B (25/11, STORY-1020)** : recopier au catalogue le manifeste `balance` **1.2.0** (source `manifestes/balance.manifest.ts`,
  contrat de STORY-1020) : une route d'export neuve en `routesLectureSeule` (`…/rapprochement/etat/export`). Elle contient
  la 1.1.0 ci-dessous : une seule recopie suffit. — ouverte.
- **→ B (25/11, STORY-1117)** : recopier au catalogue le manifeste `balance` **1.1.0** (code fusionné :
  balance-service #161 `e968388` ; source `manifestes/balance.manifest.ts`, #842) : deux routes de lecture neuves
  (`…/balances/reference`, `…/balances/resumes`). — ouverte.
- **→ B (24/11, STORY-1100)** : recopier au catalogue le manifeste `comptabilite` **0.5.0** (code fusionné :
  comptabilite-service #20 `e4a53cc` ; source `manifestes/comptabilite.manifest.ts`, `a525d76`) : il publie
  `comptabilite.facture.inscrite`, aucune route neuve. — ✅ **close le 25/11** : catalogue #74 `1aa17ae` (STORY-979).

- **→ B (2026-11-15) : la garde partagée (STORY-937) et `sinistres-service`** — **information**. Le squelette de
  `prospera-sinistres-service` garde ses modules par un port, `EtatDesModules`, alimenté aujourd'hui par
  `entitlement.changed` (D-980-2). Quand la garde partagée de STORY-937 sera publiée dans `prospera-plateforme`, C
  branchera ce port sur l'état publié dans une story de sa plage. Rien à faire chez B, sauf l'annoncer ici comme prévu.
- **→ B (2026-11-15) : le plafond `story_id_high_water_mark` vaut STORY-980** — **information**. C l'a relevé en
  écrivant sa première fiche ; c'est le maximum écrit toutes plages confondues. Les fiches 934 → 979 de B restent
  sous ce plafond : ne pas le faire redescendre en les écrivant.

- **→ B (2026-11-15) : les ports du compose racine pour la recette de l'Atelier** — **ouverte**. Pour fusionner
  STORY-982, C doit rejouer `atelier-balance.recette.ts` sur la pile de `prospera-recette` (projet `grp-c-recette`,
  volumes neufs, images construites depuis des exports d'`origin/dev`, sans lire les checkouts partagés). Cette pile
  publie les ports du compose racine (3001 → 3010, 27017, 6379, 9000, 9001, 18025), tenus par `grp-b` quand elle est
  levée. C a joué une recette pendant une descente de `grp-b` ; `grp-b` s'est relevée pendant la suivante. C attend,
  ne touche pas à votre pile, et avance sur STORY-983 puis STORY-990.
- **→ B (2026-11-15) : la recette d'`origin/dev` ne démarre pas sur une pile NEUVE** — **ouverte** (catalogue et
  recette, dépôts tenus par B). `globalSetup` attend le groupe `platform-catalog-abonnements` ; il n'existe pas tant
  que les topics `paiement.abonnement.echeance.encaissee`, `.impayee` et `.regularise` n'existent pas, et rien ne les
  crée avant le premier abonnement payé. Le client de Confluent ne crée pas un topic en s'y abonnant (`kafkajs` le
  faisait) et ne voit un topic créé plus tard qu'au rafraîchissement des métadonnées (5 minutes). Constaté sur pile
  neuve `grp-c-recette` : « La pile de recette n'est pas prête : platform-catalog-service : le groupe Kafka
  platform-catalog-abonnements n'existe pas ». C l'a contourné sur sa pile jetable en créant les trois topics à la
  main. Correctif possible, celui de C (STORY-990, ocr #25 : `src/kafka/supervision-consommateur.util.ts`) : créer
  les topics abonnés absents avant `subscribe` **et** passer `metadataMaxAge: 10_000` au consommateur ; l'un sans
  l'autre ne suffit pas (291 s → 6,9 s mesurés). **Même risque** pour tout consommateur migré vers Confluent
  (paiement, notification…).
- **→ B (2026-11-15) : `prospera-plateforme`, deux points** — **ouverte**. (1) `npm ci` échoue : le `package-lock.json`
  ne connaît pas l'espace de travail `@prospera/garde-etat-publie` (« Missing: @prospera/garde-etat-publie@1.0.0
  from lock file ») ; C a installé sans réécrire le verrou. (2) Le `npm test` et le `typecheck` racines ne lisent pas
  `champs-sensibles/`, `classification-sante/` (STORY-983) ni `contrats/assurance/` (STORY-984) ; ajouter
  `"champs-sensibles/test/**/*.test.ts" "classification-sante/test/**/*.test.ts" "contrats/assurance/test/**/*.test.ts"`
  au script `test`, et leurs `src`, `test`, `scripts` à l'`include` du `tsconfig.json` racine. D'ici là, chaque
  dossier a son `package.json` et se teste seul.

- **→ B (2026-11-16) : recopier deux manifestes amendés au catalogue** — `manifestes/liaison-assureur.manifest.ts`
  (consomme `sinistres.dossier.changed@1`) et `manifestes/assurance.manifest.ts` (consomme
  `liaison-assureur.fraicheur.changed@1`) ont changé sur `main` (amendement d'AD-16, D-991-2 tranchée par
  l'utilisateur, D-993-2). Si la garde des manifestes du catalogue (`scripts/manifestes/garde.mjs`) compare aux
  sources de `prospera-stories`, elle rougira jusqu'à la recopie. C recopie de son côté ceux de ses services.

- **→ B (2026-11-17) : recopier le manifeste `expertises` amendé au catalogue** — `manifestes/expertises.manifest.ts`
  a changé sur `main` (`50883fa`, PR #630, STORY-1014 : une route de lecture seule de plus,
  `GET /api/v1/expertises/experts/{expertId}`). Même remarque que ci-dessus. — ouverte

- **→ B (2026-11-17) : recopier le manifeste `sinistres` amendé au catalogue** — `manifestes/sinistres.manifest.ts` a
  changé sur `main` (`7bba9ca`, PR #643, STORY-1013 : une route de lecture seule de plus,
  `GET /api/v1/sinistres/dossiers/{id}/evaluations`). Même remarque que ci-dessus. — ouverte

## Réponses aux demandes reçues

- **← D (2026-11-25, STORY-348) : la date de collecte des cotisations sociales au paquet fiscal Togo** — ✅ **servie par
  STORY-317** : balance-service #171 (`44be0c1` sur `dev`), source `scripts/referentiels/sources/paquet-fiscal-togo-2026.json`,
  **`cnss.collecte`** `{ jourLimite: 15, moisSuivant: true, organisme: "CNSS Togo", source, aValider }` (la source cite le
  décret n° 2023-097/PR et la Loi n° 2011-006 ; `aValider` nomme l'article du Code qui fixe le 15 et un éventuel versement
  trimestriel des petits employeurs : à relire par un fiscaliste, plan §8) ; artefact sha256 **`d0558c54…2465`**, copie à
  l'octet dans le fiscal (#69, `98ab317`, `test/fixtures/paquet-fiscal/paquet-fiscal-togo-2026.json`). Le calcul de 348 rend
  désormais les cotisations **`DECLAREE`, exigibles le 15 du mois suivant, sans livraison** (trois specs de D mises à jour,
  « ⚠ Communs »). Rien de ce que D lit n'est renommé (`irpp.traitementsSalaires`, `cnss.affiliation.<TYPE>`,
  `cnss.amu.collecte`). Prévenu par message (session `moneyvibes-apps-83`).

- **← D (24/11 → 25/11, STORY-1076 → 1118) : recopier à l'octet les paquets SYSCOHADA révisé 2.1, 2.2, 2.3 et le SMT** —
  ✅ **servie par STORY-1020** : balance-service #165, `f6d3f8f` sur `dev` (plus `58322c4` : trois gardes qui comptaient
  le plan ou le poste `BI`) ; les quatre artefacts de `bilan-service` `dev` (`b6f2d49`, empreintes `3880b6c2…`,
  `16071b45…`, `ea5798e9…`, `5b614bd8…`, celles du ticket), registre et `ARTEFACTS_PARTAGES` à jour. Ticket : « Suivi ».
- **← A (25/11, FE-158, `prospera-comptabilite-service`) : tenue proposée publiée, droits de l'utilisateur, route
  « exercice ouvert du dossier », messages des refus, `EXERCICE_NON_OUVERT` dès la sonde `GET …/lots`** — **notée,
  non bloquante ; placée avec STORY-338** (la seule story du lot 7 de C qui ouvre la comptabilité), sauf demande de
  l'utilisateur de la passer avant.
- **← D (25/11, STORY-1079) : dans l'espace d'essai, la garde de `balance-service` ne lit pas le KYC** (ticket « modules
  ouverts dans l'essai », point 3 ; Q-D-17, confirmée par l'utilisateur le 25/11) — ✅ **servie par STORY-1019** :
  balance-service #166 (`ab4e468` sur `dev`). `@RequiresBalanceAccess` (et la garde neuve du conseil) lisent l'espace de
  l'instance (`EspaceDeLInstance`, de `INSTANCE_ESPACE`, fourni par `AppModule`) ; dans l'essai, le seul palier KYC est
  sauté sans lire le read-model ; e-mail vérifié et état publié restent exigés, dans le même ordre ; une garde sans
  espace (ou avec un double `{}`, un objet qui imite) exige le KYC. Preuves : un prospect sans KYC lit dans l'essai, la
  même requête rend `403 KYC_NOT_APPROVED` sur l'instance réelle (e2e `balance-access-espace`, pile `grp-c`) ; trois
  mutations (KYC sauté hors de l'essai, objet qui imite, KYC jamais sauté) rougissent. Hors périmètre : l'ingestion Kafka
  des balances des verticaux (`ingestion.service.ts`) lit toujours le KYC (D-1019-10). Ticket : « Suivi » à jour.
  **Pour la recette (B)** : `INSTANCE_ESPACE=ESSAI` sur le `balance-service` de l'espace d'essai, aucun KYC à semer.

- **← A (24/11, passation pour STORY-1101, laissée par 322)** : lire `Obligation.montantDeclare.montant` par taxe et par
  période ; une période sans déclaré a `montantDeclare` à `null` : la nommer, ne jamais la compter pour zéro ;
  `GET /exercices/{id}/obligations/ecarts` existe (fiscal #56, `990256a`). — **notée**, pour 1101.

- **← A (24/11, STORY-320) : `balance-service` sert la balance de référence de l'exercice, et un résumé sans lignes** —
  ✅ **close le 25/11 : STORY-1117 livrée** (balance #161, fiscal #58 ; D-320-5 levé). Prise : STORY-1117 (contrat du
  24/11), non bloquante pour A (le fiscal prend aujourd'hui la plus haute version validée et équilibrée). C la fait
  après STORY-1100, avant de reprendre le fiscal : (1) une lecture de la balance que le moteur de balance retient pour un
  exercice (la règle existante de sélection, sans que le fiscal lise l'origine, AD-14) ; (2) une vue résumée de la liste
  (sans `lignes`), par un paramètre de lecture facultatif. Contrat annoncé avant le code, ici et dans une fiche.

- **← A (24/11) : l'écriture de facture modifiable ligne à ligne** (ticket #762, FE-149) — **close** : livrée par
  comptabilite #19 (`979ed53`). Prise le 24/11 : contrat annoncé
  le 24/11 dans `stories/STORY-1097.md` (« Amendement du 2026-11-24 ») ; `corrections.lignes`, signal
  `ECRITURE_DESEQUILIBREE`, route d'aperçu `POST …/apercu`. Codée avant STORY-1087.

- **← D (2026-11-16) : consommer `reseau.portee.changed@1` et passer la suite de conformité (STORY-1004)** — **servie**
  par `prospera-sinistres-service#15` (`dev` `29069cc`) : consommateur `sinistres-service.portee-reseau`, read-model
  par `(organisation, utilisateur)`, suite `conformite-portee-reseau-v1` copiée à l'octet (`f2779975…`) et jouée sur
  le vrai read-model et le vrai filtre (six cas verts, MongoDB) ; **inscrit au registre** (`PUT
  …/conformite/consommateurs/sinistres`, référence `prospera-sinistres-service@29069cc`) ; la vérification
  `consommateurs-conformes` est VERT. ⚠️ Le registre de `reseau-service` vit dans SA base : l'inscription faite sur la
  pile de preuve ne vaut que pour elle ; à refaire à l'installation réelle (ou par la CI, quand elle existera).
- **← D (2026-11-17) : passation de `prospera-assureur-fictif` constatée** — **lu**.

- **← B (2026-11-17) : lot 3, `prospera-assureur-fictif` passe à D** — **servie** (passation écrite ci-dessus,
  2026-11-17). `PLAN-4-SESSIONS-LOT-3-2026-11-17.md`
  (D-L3-2) : D y fait la démo de l'assurance (EPIC-204 : 1046, 1048, 1057) et la communication dans `notification`
  (EPIC-220). D ne touche ni `sinistres`, ni `assurance`, ni `document-service`. **À faire par C** : écrire la passation
  (dernier commit sur `dev`) dans « Passations » ; C continue de jouer ses parcours contre le LC fictif et demande à D
  toute modification. EPIC-204 sort de la suite 201 → 211 de C.
- **← B (2026-11-17) : MinIO passe à `cgr.dev/chainguard/minio:latest`, avec `user: '0'`** — **information, ouverte**.
  Norme décidée par l'utilisateur (`REGLES-DES-GROUPES.md` §1.6) ; A bascule le compose racine du poste principal et la
  recette. Toute pile de `document-service` (995 → 997) qui lève son propre MinIO prend la même image.

- **← B (2026-11-15) : `prospera-plateforme` est prêt** — **lu**. STORY-983 et 987 y écriront dans les seuls dossiers
  de C (`contrats/assurance/`, `champs-sensibles/`, `classification-sante/`), en JSON Schema draft-07 fermé.
- **← B (2026-11-15) : contrat d'état publié figé** (STORY-932, `contrat-etat-publie-v1`) — **lu**. C n'en garde pas
  encore de copie : la bascule se fera avec la garde partagée (STORY-937).

- **← B (2026-11-15) : STORY-938, `createdByUserId` facultatif dans `identity.org.created`** — **servie** dans ocr #24
  (`8bd1a2f`) : le type de `document-service` le déclare facultatif, avec `origine` ; le read-model n'en lisait aucun,
  un test le prouve. Arrivera sur `dev` avec la fusion de STORY-982.
- **← B (2026-11-15) : STORY-937, la garde partagée publiée** — **lue**. `prospera-sinistres-service` et
  `prospera-assurance-service` la copieront (étiquette `garde-etat-publie-v1`, empreinte, projection de
  `etat-publie.changed.<espace>`, double lecture) dans une story de la plage de C, après STORY-990.

## ⚠ Communs

> Lot 7, D-L7-2 : un fichier commun de `prospera-fiscal-service` (`app.module.ts`, manifeste `declarations`, contrat
> OpenAPI, `package.json`, migrations, `read-models/`, copies du paquet, et tout fichier d'un dossier de D) ne change que
> dans une PR qui le dit, rebasée sur `origin/dev` juste avant la fusion, et annoncée ici **avant** la fusion. Une seule
> migration en vol sur le service.

- **ANNONCÉ (2026-11-26, STORY-321, avant le code)** — branche `MNV-321` de `prospera-fiscal-service`. **Aucune
  migration** (un champ neuf facultatif `calculMoteur` sur `obligations`, absent ⇒ `null` ; `montantAttendu` existe déjà, à
  `null` partout : la dérivation cesse de le remettre à `null`, il passe de `$set` à `$setOnInsert`). Ni `app.module.ts`,
  ni `package.json`, ni `read-models/`, ni copie du paquet, ni manifeste `declarations`. Touchés : **le contrat OpenAPI**
  (une route neuve, deux champs : « ⚠ Contrats ») ; **`src/adapters/http/lecture-amont.ts`** (transverse) gagne un
  traitement **facultatif** du `409` (seul l'adaptateur du moteur le demande : tout autre appelant, dont ceux de D, garde
  son comportement à l'octet). Tout le reste dans les dossiers de C (`domain/obligations`, `application/obligations`,
  `modules/obligations`, `adapters/mongo` et `adapters/http` du moteur, `ports`, `test/utils`, e2e et conformité des
  obligations) et une garde neuve à la racine de `src/` (`garde-calcul-delegue.spec.ts`, AC-2). Rien dans les dossiers de
  D. **→ D** : rien à faire pour un rebase ; `domain/familles` (que lit le calcul social) ne change pas.
- **FUSIONNÉ (2026-11-26, prospera-fiscal-service#71, `dev` `0cc79a7`, sur `origin/dev` `cefbe20`)** — conforme à l'annonce :
  seul le contrat OpenAPI est touché parmi les communs. **→ D** : rien à faire pour un rebase ; toute la suite (unitaires, e2e,
  conformité) est verte en Node 24.
  **ANNONCÉ (2026-11-26, STORY-319, avant le code)** — branche `MNV-319` de `prospera-fiscal-service`. **Aucune
  migration**, aucune collection neuve, aucun index neuf ; ni `app.module.ts`, ni `package.json`, ni `read-models/`
  (`identity_memberships` y est **lu** par un adaptateur du dossier `obligations`, le schéma ne change pas), ni copie du
  paquet, ni manifeste `declarations`. Touché : **le contrat OpenAPI** (trois routes neuves, « ⚠ Contrats »). Tout le reste
  dans les dossiers de C (`domain/obligations`, `application/obligations`, `modules/obligations`, `adapters/mongo`,
  `ports`, `test/utils`, `test/obligations.e2e-spec.ts`, une spec de conformité neuve). Rien dans les dossiers de D.
  **→ D** : rien à faire pour un rebase ; la clé de l'alerte gagne le responsable (D-319-9), le fait garde sa forme.
- **FUSIONNÉ (2026-11-26, prospera-fiscal-service#70, `dev` `cefbe20`, sur `origin/dev` `8f6b1ba`)** — conforme à l'annonce ;
  un `setImmediate` (intercepteur de journalisation, transverse) entre aussi dans la liste fermée de la garde, sans changer de
  code. **→ D** : `fiscal.declaration.deposee` part désormais par le relais BullMQ (prouvé `SENT` sur la pile à deux
  répliques) ; **sans Redis, l'outbox attend** (les événements restent `PENDING`). Un test de D qui démarrerait le relais n'existe
  pas ; toute la suite (unitaires, e2e, conformité) est verte en Node 24.
  **ANNONCÉ (2026-11-26, STORY-318, avant le code)** — branche `MNV-318` de `prospera-fiscal-service`. **Aucune
  migration** (deux collections neuves, `alertes_echeance` et `parametres_alertes`, index posés par Mongoose au
  démarrage). Touchés (fiche `stories/STORY-318.md`, « Persistance et fichiers communs ») :
  - **`package.json` / `package-lock.json`** : `bullmq` ~6.7 et `@nestjs/bullmq` 11 (les versions de `sinistres` et du
    catalogue) ;
  - **`app.module.ts`** : la file partagée (`BullModule.forRootAsync` sur le Redis du service) ;
  - **`src/kafka/outbox/`** (transverse, donc commun : **D y publie `fiscal.declaration.deposee`**) : le relais perd son
    `setInterval` (AC-5, AD-18) et tourne sur BullMQ, planificateur `relais-outbox` toutes les `OUTBOX_RELAY_INTERVAL_MS`,
    **concurrence globale de 1** (deux répliques ne relaient plus ensemble). Le tour (`dispatchBatch`, ordre par
    partition, `FAILED` après 5 échecs non rejouables) ne change pas ; **sans Redis, l'outbox ne se relaie pas** (les
    événements restent `PENDING`, jamais perdus ; la santé dit déjà Redis tombé) ;
  - **le contrat OpenAPI** : trois routes neuves et deux champs du calendrier (« ⚠ Contrats ») ;
  - **`src/config/`** et `.env.example` : `ALERTES_ECHEANCE_CRON` (`0 5 * * *`), `ALERTES_HORIZON_JOURS_DEFAUT` (7) ;
  - la garde `src/garde-evaluation-dynamique.spec.ts` n'est pas touchée : une **garde neuve** (racine de `src/`) interdit
    `setInterval` partout et tient en liste fermée les trois `setTimeout` qui bornent une attente (dont
    `kafka/supervision-consommateur.util.ts` et `health/indicators/kafka.health.ts`, transverses).
  Rien dans les dossiers de D. **→ D** : rien à faire pour un rebase ; un e2e ou un test de D qui démarrerait le relais
  par `onModuleInit` n'existe pas (vérifié : seul `outbox-relay.service.spec.ts` appelle `tick`, inchangé).
- **FUSIONNÉ (2026-11-26, prospera-fiscal-service#69, `dev` `98ab317` et `8f6b1ba`, sur `origin/dev` `d41dbe6`)** —
  conforme à l'annonce, avec **un fichier de D de plus** : `test/remuneration-import.e2e-spec.ts` (l'e2e du calcul attendait
  `NON_DECLAREE` pour les cotisations ; il attend maintenant `DECLAREE` au 15 du mois suivant ; vu rouge par l'e2e Node 24,
  corrigé dans `8f6b1ba`). Copie du paquet : sha256 `d0558c54…2465`, celle de l'artefact de balance-service `dev` `44be0c1`.
  **ANNONCÉ (2026-11-26, STORY-317, avant le code)** — branche `MNV-317` de `prospera-fiscal-service`. **Aucune migration**
  (deux champs facultatifs sur `obligations`, `echeanceLegale` et `report` ; une obligation antérieure se lit sans eux),
  ni `app.module.ts`, ni `package.json`, ni `read-models/`, ni manifeste `declarations`. Touchés :
  - **le contrat OpenAPI** : deux routes neuves et des champs ajoutés (« ⚠ Contrats ») ;
  - **la copie du paquet fiscal** `test/fixtures/paquet-fiscal/paquet-fiscal-togo-2026.json`, recopiée à l'octet (LF) de
    l'artefact de `balance-service` : **`cnss.collecte`** y entre (demande de D, STORY-348) ;
  - **deux specs de D** (dossier `remuneration`), parce que le vrai paquet déclare désormais la collecte :
    `src/domain/remuneration/calcul-social.spec.ts` et `src/application/remuneration/calcul-remuneration.service.spec.ts`
    (les cotisations passent de `NON_DECLAREE` à `DECLAREE`, au 15 du mois suivant, **sans changer une ligne de code de
    D**) ;
  - tout le reste dans les dossiers de C (`domain/obligations`, `application/obligations`, `modules/obligations`,
    `adapters/mongo` des obligations, `test/utils/registre-obligations-memoire.ts`).
  **→ D** : rien à faire pour un rebase ; rien de ce que D lit ne change de nom (`irpp.traitementsSalaires`,
  `cnss.affiliation.<TYPE>`, `cnss.amu.collecte`, `calculerIrppTraitementsSalaires`, `decimal-exact`).
- **FUSIONNÉ (2026-11-25, prospera-fiscal-service#66, `dev` `fd34834`, rebasée sur `origin/dev` `4a1d938` avant la
  fusion), conforme à l'annonce ; ANNONCÉ (2026-11-25, STORY-564, avant le code, #921)** — branche `MNV-564` de
  `prospera-fiscal-service`. **Aucune
  migration**, ni `app.module.ts`, ni `package.json`, ni `read-models/`, ni manifeste `declarations`, ni contrat OpenAPI.
  Touché : **la copie du paquet fiscal** `test/fixtures/paquet-fiscal/paquet-fiscal-togo-2026.json`, recopiée à l'octet
  (LF) de l'artefact de `balance-service` (empreinte au « ⚠ Contrats » ci-dessous). Tout le reste est dans les dossiers
  de C : `src/domain/familles/` (le calcul de l'IRPP des traitements et salaires) et deux commentaires qui citaient
  « STORY-564 » comme manque (`domain/obligations/catalogue.ts`, `application/obligations/deriver-obligations.service.ts`).
  **→ D** : rien à faire pour un rebase ; les specs de `remuneration` qui lisent la copie du paquet y trouvent les mêmes
  clés, plus celles de l'IRPP et de la CNSS (voir « ⚠ Contrats »).

## ⚠ Contrats

- **2026-11-26 (STORY-321), ANNONCÉ avant le code** — **le calculé d'une obligation vient du moteur de `balance-service`**
  (`prospera-fiscal-service`, REST ; `balance-service` lu seulement). Fiche : `stories/STORY-321.md` (D-321-1 → 11).
  Consommateurs : les écrans des obligations et du triplet (A, FE-081) ; STORY-328 (anomalies, lit déjà
  `triplet.calcule`) ; STORY-340 (le montant à régler). **Ajouts seuls**, plus deux précisions de comportement.
  - **Ce que le fiscal lit chez la balance** (jeton de l'appelant, exercice = celui de la balance des bases) : `TVA`
    (`AAAA-MM`, `AAAA-Tn` → son mois de début) → `aPayer` de `GET …/fiscal/tva?periode=` ; `IS_ACOMPTE` (`AAAA-En`) →
    `theorique` du rang `n` de `GET …/fiscal/acomptes` ; **`TPU` (`AAAA`) → `tpuDue` de `GET …/fiscal/tpu`** (neuf pour le
    fiscal). `TAF`, `TCA`, `RSH`, `TPU_ACOMPTE` : aucun appel, indisponible `TAXE_NON_CALCULEE_PAR_LE_MOTEUR`.
  - **Comportement** : la prise en charge (`POST …/transition`, `A_PREPARER → EN_PREPARATION`) chiffre l'obligation après
    ses bases, dans la même transaction ; le moteur injoignable n'empêche pas la prise en charge (constat `INDISPONIBLE`
    `MOTEUR_INDISPONIBLE`, aucun montant). Aucun nouveau refus sur la transition.
  - **Route neuve** : **`POST /api/v1/obligations/{id}/calcul`** (sans corps, droit `fiscalite:declaration:preparer`) →
    `200` l'obligation ; de `EN_PREPARATION` à `A_VALIDER`. Refus : `404 OBLIGATION_INTROUVABLE`, `409`
    `OBLIGATION_DESACTIVEE` / `OBLIGATION_BLOQUEE` / **`CALCUL_NON_DELEGUE`** / **`CALCUL_NON_ACTUALISABLE`** (avant la prise
    en charge, et à partir du visa : le calculé est figé) / `TRANSITION_CONCURRENTE` ; **`503 SERVICE_AMONT_INDISPONIBLE`**,
    rien d'écrit.
  - **Champ neuf `ObligationResponseDto.calculMoteur`** (`null` tant qu'aucun calcul) : `{ statut: CALCULE | INDISPONIBLE,
    montant, motif (MOTEUR_INDISPONIBLE | MOTEUR_NON_LISIBLE | MOTEUR_PARAMETRAGE_INSUFFISANT | MOTEUR_REPONSE_INVALIDE |
    PERIODE_INCONNUE_DU_MOTEUR | ATTENDU_INDISPONIBLE | BASES_NON_EXPLOITABLES | null), motifMoteur, message, demande {
    ressource, periode, rang, exercice }, bases { balanceId, version, etat, statutPreuve, checksum } | null,
    balanceDuMoteur { id, version } | null, calculeLe, par }`. **`montantAttendu`** est désormais écrit (le montant si
    `CALCULE`, sinon `null`).
  - **Champ neuf `triplet.calcule.motif`** (`string | null`) : `TAXE_NON_CALCULEE_PAR_LE_MOTEUR`, `NON_ENCORE_CALCULE` ou le
    motif du constat quand le calculé est indisponible. `triplet.calcule.indisponible` garde ses trois valeurs ; l'origine
    `MOTEUR` apparaît dès qu'un calcul aboutit ; `triplet.calcule.source` d'un calculé du moteur est la balance de ses
    bases au moment du calcul.
  - **Cohérence (326)** : un `409` du moteur rend `NON_EXECUTE` avec le motif `MOTEUR_PARAMETRAGE_INSUFFISANT` (avant :
    `MOTEUR_REPONSE_INVALIDE`).
  - **Journal chaîné** : acte neuf `OBLIGATION_CALCUL_CONSTATE`. Aucun événement, aucun droit neuf, manifeste inchangé.
- **2026-11-26 (STORY-319), PUBLIÉ** (fiscal #71, `0cc79a7`) — **conforme à l'annonce** (#951) ; un corps d'affectation vide, en
  doublon ou au-delà de 50 sort en `400`. Prouvé sur la pile : la clé `obligationId|état|échéance|responsable` et le fait `SENT` qui
  porte le responsable. Annonce :
- **2026-11-26 (STORY-319), ANNONCÉ avant le code** — **le responsable désigné et la vue de charge par collaborateur**
  (`prospera-fiscal-service`, REST ; et le sens de la clé de l'alerte de 318). Fiche : `stories/STORY-319.md`
  (D-319-1 → 11). Consommateurs : les écrans du calendrier (A) ; STORY-349 (D) ; `prospera-notification-service` (D), à
  venir. **Ajouts seuls**, plus une précision de comportement.
  - **Route neuve** : **`POST /api/v1/obligations/affectation`** (droit `fiscalite:declaration:valider`)
    `{ obligationIds (1 à 50, chacune une fois, un ou plusieurs dossiers), responsable: userId | null }` →
    `200 { responsable, obligations: ObligationResponseDto[] }`, tout ou rien ; `null` retire. Refus : `404
    OBLIGATION_INTROUVABLE` (même réponse hors portée), `409 OBLIGATION_DESACTIVEE` / `OBLIGATION_CLOTUREE` /
    `AFFECTATION_CONCURRENTE`, `422 RESPONSABLE_INCONNU` (pas un membre actif de l'organisation) /
    `RESPONSABLE_HORS_PORTEE` (le dossier n'est pas dans sa portée, `details.dossierId`).
  - **Journal chaîné** : acte **`OBLIGATION_RESPONSABLE_AFFECTE`** (`obligation:<id>` : `dossierId`, `avant`, `apres`,
    auteur), un par obligation changée, dans la transaction.
  - **Routes neuves de lecture** (gate fiscale, portée de l'appelant comme le calendrier) :
    **`GET /api/v1/obligations/charge`** (`annee`, `dossierId` facultatifs) → `{ aLa, horizonJours, tronquee,
    collaborateurs: { responsable, nom, charge }[], sansResponsable: charge }` ; **`GET
    /api/v1/obligations/charge/{responsable}`** (`userId` | `AUCUN`) → `{ responsable, nom, aLa, horizonJours, tronquee,
    charge, retards: LigneCalendrierDto[] }`. `charge` : `{ enCharge, nonDatees, pasEncorePreparees,
    enRetardDePreparation, preparees, echeancesDepassees, retards, prochaineEcheance }` sur les obligations actives non
    déposées, toutes années (`annee` restreint).
  - **Comportement (D-319-9)** : la clé de l'alerte devient `obligationId|état|échéance|responsable` quand il y a un
    responsable (sans responsable : inchangée, les alertes de 318 ne se rejouent pas) — une obligation confiée alors
    qu'elle est déjà en alerte est alertée de nouveau au balayage suivant, pour son nouveau responsable.
    **`fiscal.obligation.alerte-echeance`** v1 ne change pas de forme.
- **2026-11-26 (STORY-318), PUBLIÉ** (fiscal #70, `cefbe20`) — **conforme à l'annonce** (#945). Précisions (fiche, D-318-13) :
  le balayage n'alerte pas une échéance dépassée depuis plus de 31 jours (elle reste `ECHEANCE_DEPASSEE` au calendrier) ; les
  trois routes sont servies par un contrôleur à part (`AlertesEcheanceController`), mêmes chemins, même gate. Annonce :
- **2026-11-26 (STORY-318), ANNONCÉ avant le code** — **les alertes d'échéance et les états de retard**
  (`prospera-fiscal-service`, REST et Kafka). Fiche : `stories/STORY-318.md` (D-318-1 → 12). Consommateurs : les écrans
  du calendrier (A) ; STORY-319 (C) ; **`prospera-notification-service` (D)**, à venir. **Ajouts seuls.**
  - **Routes neuves** : **`GET /api/v1/obligations/alertes`** (`dossierId`, `etat` `EN_RETARD_DE_PREPARATION` |
    `ECHEANCE_DEPASSEE`, `responsable` ou `AUCUN`, `limite` 1 à 200, `apres`) → `200 { alertes: AlerteEcheanceDto[],
    suivant }`, portée de l'appelant comme le calendrier, `400 CURSEUR_INVALIDE` ; **`GET /api/v1/obligations/alertes/horizon`**
    → `{ horizonJours, parDefaut, par, le }` ; **`PUT /api/v1/obligations/alertes/horizon`** `{ horizonJours }` (1 à 90,
    droit `fiscalite:declaration:valider`), acte `ALERTES_HORIZON_CHANGE` au journal chaîné (`organisation:<orgId>`).
  - **`AlerteEcheanceDto`** : `{ alerteId, obligationId, dossierId, redevableId, taxe, libelle, periode, etat, echeance,
    echeanceLegale, reportee, horizonJours, datePreparationLimite, joursRestants, statut, responsable, produiteLe }`.
  - **Ajouté à `LigneCalendrierDto`** (`GET /obligations/calendrier`) : **`etatEcheance`** (`NON_DATEE` |
    `PAS_ENCORE_PREPAREE` | `EN_RETARD_DE_PREPARATION` | `PREPAREE` | `ECHEANCE_DEPASSEE` | `DEPOSEE`) et
    **`joursRestants`** (`number | null`, négatif une fois l'applicable passée), au jour de la lecture.
  - **Topic neuf** : **`fiscal.obligation.alerte-echeance`** (v1, en-têtes `eventId` et `schemaVersion`, clé `orgId`),
    par l'outbox dans la transaction de l'alerte : `{ schemaVersion: 1, eventId, occurredAt, orgId, alerteId,
    obligationId, dossierId, redevableId, taxe, libelle, periode, etat, echeance, echeanceLegale, reportee, horizonJours,
    datePreparationLimite, joursRestants, statut, responsable }`. Une alerte par `(obligation, état, échéance
    applicable)`. Aucun consommateur aujourd'hui ; manifeste `declarations` non amendé (D-318-10).
  - **Comportement** : le relais de l'outbox passe sur BullMQ (« ⚠ Communs ») ; `fiscal.declaration.deposee` garde sa
    forme et son ordre.
- **2026-11-26 (STORY-317), PUBLIÉ** (fiscal #69, `98ab317` / `8f6b1ba` ; balance-service #171, `44be0c1`) — **conforme à
  l'annonce** (#940). Empreinte du paquet Togo 2026 : **`d0558c545ae6a95102c188114fcd82034b68c8cfd322d1ca19372f4fc2372465`**
  (balance et fiscal ; `dossier-service` : → B). Précisions (fiche, D-317-9 → 11) : `reportId` est un UUID commun à la
  portée ; `reportee` n'est vrai que si l'applicable est la date reportée. Annonce :
- **2026-11-26 (STORY-317), ANNONCÉ avant le code** — **les reports d'échéance administratifs** (`prospera-fiscal-service`,
  REST ; et le paquet fiscal Togo 2026). Fiche : `stories/STORY-317.md` (D-317-1 → 8). Consommateurs : les écrans du
  calendrier (A) ; STORY-318 et 319 (C) ; le calcul social de D (`cnss.collecte`).
  - **Changé, comme l'AC-1 le demande** : sur une obligation reportée, **`echeance`** rend la **date reportée**
    (l'échéance applicable) ; sans report, rien ne change.
  - **Ajouté** à `ObligationResponseDto` : **`echeanceLegale`** (`string | null`, la date du paquet) et **`report`**
    (`{ reportId, date, echeanceLegale, decision: { reference, du }, motif, par, le } | null`) ; à `LigneCalendrierDto`
    (`GET /obligations/calendrier`) : **`echeanceLegale`** et **`reportee`** (booléen). Le calendrier trie, filtre et
    pagine sur l'applicable.
  - **Routes neuves** (droit `fiscalite:declaration:valider`) : **`POST /api/v1/obligations/reports`**
    `{ obligationIds (1 à 50, un seul dossier), date, decision: { reference, du }, motif }` → `200 { reportId, date,
    decision, obligations[] }`, tout ou rien ; refus `400 REPORT_PORTEE_INVALIDE`, `404 OBLIGATION_INTROUVABLE`,
    `409 OBLIGATION_DESACTIVEE` / `OBLIGATION_CLOTUREE` / `REPORT_CONCURRENT`, `422 ECHEANCE_LEGALE_ABSENTE` /
    `REPORT_NON_POSTERIEUR` / `DECISION_POSTERIEURE`. **`POST /api/v1/obligations/{id}/report/annulation`** `{ motif }` →
    `200` (retour à la légale), `409 AUCUN_REPORT`.
  - **Journal chaîné** : actes **`OBLIGATION_ECHEANCE_REPORTEE`** (auteur, date de la décision, portée `{ dossierId,
    obligations }`, légale, applicable d'avant, empreintes de la référence et du motif) et **`OBLIGATION_REPORT_ANNULE`**.
  - **Re-dérivation** : la légale se récrit, le report reste (champ humain, AD-17) ; un report n'avance jamais une
    échéance.
  - **Paquet fiscal Togo 2026** (source de `balance-service`, demande de D en STORY-348) : **`cnss.collecte`**
    `{ jourLimite: 15, moisSuivant: true, organisme: "CNSS Togo", source, aValider }` ajouté ; rien n'est renommé ni
    retiré. **L'empreinte du paquet change** (donnée à la publication) ; copies à l'octet dans `balance-service` et
    `prospera-fiscal-service`, celle de `dossier-service` → B.
- **2026-11-26 (STORY-1023), PUBLIÉ** (balance-service #170, `75179cf` sur `dev`) — **conforme à l'annonce** (#930),
  avec deux ajouts écrits : les codes que le contrat taisait sont déclarés (200 du rejeu idempotent de `POST /balances`,
  201 des POST de reprise, D-1023-12) et le 403 de la garde porte `LECTURE_PLATEFORME_REFUSEE` (un rôle de cabinet est
  refusé avant, par le refus de rôle existant). Ajv a relevé deux écarts antérieurs, non corrigés (fiche, « Ce qui
  reste ») : l'aperçu de l'agrégation et les écarts du rapprochement. Annonce du 25/11 :
- **2026-11-25 (STORY-1023), ANNONCÉ avant le code** — **les contrats de la balance complétés : le dossier déclaré
  partout, la lecture inter-organisations de la plateforme** (`prospera-balance-service`, REST seulement). Fiche :
  `stories/STORY-1023.md` (contrat, D-1023-1 → 10). Consommateurs : les écrans de A (FE-063 et suivants : confronter le
  dossier reçu au dossier affiché) ; la console de la plateforme (B, quand elle lira la donnée métier).
  - **Ajouté, requis, sans rien renommer** : `dossierId` (ObjectId hex) au niveau du corps de chaque réponse JSON 2xx des
    routes `/api/v1/dossiers/{dossierId}/…` des familles `balances`, `balance` (rejets, à-nouveaux, affectation, import et
    import Sage, agrégation des cahiers, provenance, comptes de ventilation), `exercices`, `imports`, `cahiers` (recettes,
    dépenses, catégories, mémoire des choix), `pieces/ocr`, `rattachement`, `rapprochement`, `tresorerie` — sur chaque
    élément quand le corps est une liste (39 schémas de réponse). Valeur : celle de la donnée pour une ressource d'un
    dossier, celle du dossier de la route pour un corps calculé et pour un profil d'import (qui est de l'organisation).
    Schéma neuf : `MemoireCahiersDuDossierDto` (`MemoireCahiersDto` inchangé). Hors de tout sceau.
  - **Écartées, raison écrite** (le ticket reste ouvert pour elles) : `fiscal`, `immobilisations`, `inventaire`,
    `devises`, `profil-societe` (en migration vers `dossier-service`), `referentiels`.
  - **Trois routes neuves de lecture plateforme (AD-P16)**, `GET` seulement, `PLATFORM_ADMIN` seul, sous
    `@PlatformReadOnly()` : `/api/v1/plateforme/balance/organisations/{orgId}/dossiers/{dossierId}/balances`
    (`BalanceResumeDto[]`), `…/balances/{id}` (`BalanceResponseDto`), `/api/v1/plateforme/balance/organisations/{orgId}/lectures`
    (le journal des lectures). En-tête **`X-Motif-Lecture`** obligatoire (10 à 500 caractères) ⇒ sinon **400
    `MOTIF_LECTURE_REQUIS`** ; identifiant mal formé ⇒ **400 `IDENTIFIANT_INVALIDE`** ; rôle de cabinet ⇒ 403 ; identité
    de service ⇒ 403 `IDENTITE_DE_SERVICE_REFUSEE`. Chaque lecture journalisée **avant** d'être servie
    (`journal_lectures_plateforme` : opérateur, organisation, dossier, route, ressource, motif, date) ; journal exclu de
    l'effacement C13 (il survit). `Cache-Control: no-store`.
  - **Ce qui ne change pas** : aucune requête, aucun code de refus, aucune route existante, le manifeste `balance`, les
    topics. Le contrat est tenu par **Ajv sur les corps réels** dans les e2e (leçon de 1022), et par un balayage du
    document OpenAPI qui classe chaque chemin `/dossiers/…`.

- **2026-11-25 (STORY-1022), PUBLIÉ** (balance-service #169, `d5878be` sur `dev`) — **conforme à l'annonce** (#927),
  sans écart ; le schéma JSON gagne aussi `CIMA` dans l'énumération des référentiels (déjà publié) et `dependentRequired`
  (l'un des deux champs exige l'autre). Annonce : **la balance publie l'empreinte de ses soldes**
  (`prospera-balance-service`, topics `balance.created` et `balance.etat.document.change`). Fiche :
  `stories/STORY-1022.md` (D-1022-1 → 6). Pour STORY-1078 de D (D-1078-10 : le rapprochement de la liasse avec sa
  balance).
  - **Ajouté, facultatif, sur les deux topics** : `soldesChecksum` (SHA-256, 64 hex minuscules) et
    `soldesChecksumVersion` (`'soldes-v1'`). Les deux voyagent **ensemble** pour toute balance scellée en `v2` ; une
    balance scellée en `v1` (forme héritée `debit`/`credit`) n'en porte **aucun** (omis, jamais `null`).
  - **Algorithme `soldes-v1`** : SHA-256 de `JSON.stringify({ lignes: L })`, `L` = les lignes dont un des deux soldes est
    non nul, triées par `compte` en point de code (jamais `localeCompare`), projetées dans l'ordre
    `{ compte, soldeDebiteur, soldeCrediteur }` (compte tel quel ; entiers en unités mineures de la devise de la balance).
    Même canonisation que le sceau `checksum` (fonction partagée), projection propre. **Vecteur** : `521000` D 150000 ·
    `101000` C 150000 · `401000` 0/0 ⇒ `49c4d3b1e9532da78c8bb6aad3d025dbe704c3338e74bab2198af3c6140349d8` ;
    `{"lignes":[]}` ⇒ `5e296cc6…6265b2`.
  - **Ce qui ne change pas** : `checksum` et `checksumVersion` (le sceau), `schemaVersion` (1), aucun champ requis de
    plus, aucun renommage ; le REST ; les autres topics. `docs/schemas/balance.created.v1.schema.json` gagne les deux
    propriétés en facultatif (et celles déjà publiées qu'il avait oubliées), `required` inchangé. Le consommateur de
    bilan ignore déjà un champ inconnu (`balance-payload.util.ts`) : rien ne casse avant que D le lise.
  - **→ D** : recalculer l'empreinte sur les soldes du jeu **sous `soldesChecksumVersion`** (une version inconnue ⇒
    constat « non vérifiable », jamais un recalcul local au hasard).

- **2026-11-25 (STORY-564), PUBLIÉ** (balance-service #168, `c9e94c6` ; fiscal #66, `fd34834`) — **conforme à l'annonce**
  (#921), sans écart. **Empreinte du paquet : `bfcc3fc92603e4fa08c370e9a9da7b6634f3b7b2cca12972bbe3fbc6c258c065`**
  (balance et fiscal) ; `dossier-service` : → B. Annonce : **le barème IRPP et la base des salaires entrent au paquet fiscal
  Togo 2026** (`prospera-balance-service`, source `scripts/referentiels/sources/paquet-fiscal-togo-2026.json` ; copies
  `balance-service`, `prospera-fiscal-service`, `dossier-service` par B). Fiche : `stories/STORY-564.md` (D-564-1 → 12).
  - **Rien n'est renommé**, aucune valeur existante ne bouge (hors ce qui suit) : `irpp.tranches[]` (`de`, `a`, `taux`),
    `irpp.arrondiAssiette`, `irpp.arrondiProduit`, `irpp.declarationAnnuelle`, le catalogue.
  - **Ajouté à `irpp`** : `article` et `millesime` sur chaque tranche ; **`irpp.traitementsSalaires`** tel qu'écrit le
    24/11 dans la copie de référence (`deductionsDuBrut[]`, `deductionForfaitaire` `{ taux, fractionAnnuelleMax }`,
    `fraisReelsAlinea4`, `deductionsSurJustificatif.rubriques[]`, `chargesDeFamille`
    `{ montantParPersonneParMois, personnesMax }`, `arrondiBase`, **`ordreDeCalcul`**), chaque élément avec `article` et
    `millesime` ; **`irpp.revenusCategoriels`** `{ couverts[], nonCouverts[] }` (codes du questionnaire de 568) ;
    **`irpp.retenueALaSource`** (LPF Art. 26, 27, 43).
  - **`cnss`** : remplacé par le bloc de la copie de référence (24/11 : `assiette.smig`, `plafond: null`,
    `deplafonnee`, `branches`, `amu`) ; ses clés d'avant (`tauxEmployeur`, `tauxSalarie`, `tauxTotal`, `assiette.inclus`,
    `.exclus`, `.plancher`, `deductibiliteFiscale`, `aCompleter`) restent.
  - **Changé** : `aFaire` (l'IRPP y entre nommément, la ligne CNSS est remplacée), `_meta.miseEnGarde`, `_meta.revision`,
    la ligne IRPP de `autresImpotsTaxes.presentsDansCGI` (plus de taux). **L'empreinte du paquet change** (donnée à la
    publication).
  - **Garde de packaging** : **R11** — un élément du barème IRPP sans `article` ou sans `millesime` fait échouer le build.
  - `fiscal-service` : aucun contrat d'API ne bouge (aucune route) ; un calcul neuf dans le domaine
    (`src/domain/familles/irpp-traitements-salaires.ts`), que 340 et 566 exposeront.

- **2026-11-25 (STORY-1021), PUBLIÉ** (balance-service #167, `465a308` sur `dev`) — **conforme à l'annonce** (#916, faite avant le code), sans écart de contrat ; l'import d'un enregistrement exporté tombe au schéma (`SCHEMA_NON_CONFORME`, D-1021-17). Annonce : les routes d'instance `export`, `sante` et `migrer` de la balance
  (`prospera-balance-service`), sur le patron de STORY-1075 (D, bilan). Fiche : `stories/STORY-1021.md` (D-1021-1 → 16).
  - **Routes neuves** (identité `MOTEUR` seule, hors des gardes métier, sans limite de débit, **deux espaces**) :
    - `GET /api/v1/instance/balance/{organisationId}/export` (limitée à l'organisation du chemin) : 200 JSON
      `{ schemaVersion: 1, module: 'balance', organisationId, espace, exporteLe, objets: [{ objet, collection, nombre,
      enregistrements }] }` (Extended JSON relaxed ; 32 collections du module, ni `conseil`, ni copies des voisins) ;
      **`?format=csv&objet=<objet>`** : un objet en `text/csv` (BOM, `;`, CRLF, cellules neutralisées — réponse du PO à
      Q-D-19) ; `objet` filtre aussi le JSON. État publié absent ou `NON_INSTALLE` ⇒ **403 `BALANCE_NOT_ENTITLED`**
      (tout autre état ouvre, `SUSPENDU` compris) ; 400 `FORMAT_NON_SERVI`, 400 `OBJET_REQUIS`, 422 `OBJET_INCONNU`.
    - `GET /api/v1/instance/balance/{organisationId}/sante` : 200 **`sante@1`** (`OK` | `DEGRADE` + `raison` : MongoDB,
      broker Kafka, consommateurs), copié à l'octet de `prospera-plateforme@contrats-instance-v1` ; jamais un refus.
    - `POST /api/v1/instance/balance/migrer` (sans corps, sans organisation) : joue `dossiers-d8` puis `profils-529`,
      idempotentes ; 200 `{ schemaVersion: 1, module: 'balance', statut: 'MIGRE', migrations: [{ code, ...rapport }] }` ;
      un orphelin ou un profil non rattaché ⇒ **409 `MIGRATION_INCOMPLETE`** avec les rapports. Par la route, les profils
      ne sont republiés (`profil.societe.consolide`) que pour les cabinets encore inconnus (D-1021-11) ; la commande
      `npm run migrate:dossiers` reste inchangée.
  - **Codes neufs** (`CODES_REFUS_C13`) : `BALANCE_NOT_ENTITLED` (déjà celui de la garde), `MIGRATION_INCOMPLETE`,
    `FORMAT_NON_SERVI`, `OBJET_REQUIS`.
  - **Ce qui ne change pas** : le manifeste `balance` (1.2.0, **aucune recopie au catalogue**, garde des manifestes
    verte) ; les autres routes ; les routes d'instance du module `conseil` (pas dans cette story).
  - **Aucune question neuve** : Q-D-18 → 20 (D) sont répondues par le PO et valent ici (l'export au moteur seul ; `migrer`
    sans corps ; le CSV en plus). **→ B** : les contrats d'export et de `migrer` restent à publier dans
    `prospera-plateforme/contrats/instance/` ; balance les recopiera. **→ D (information)** : balance sert le CSV par objet
    (D-1021-7) ; bilan peut prendre la même forme. **→ A** : rien (aucune route d'écran).

- **2026-11-25 (STORY-1019), PUBLIÉ** (balance-service #166, `ab4e468` sur `dev`) — **conforme à l'annonce** (#904,
  faite avant le code), sans écart. — le conseil s'installe à part (`prospera-balance-service`). Fiche :
  `stories/STORY-1019.md` (D-1019-1 → 12).
  - **Comportement** : les 8 routes des scénarios et de la justification (`dossiers/{dossierId}/fiscal/scenarios…`,
    `…/fiscal/dossier-justification`) exigent l'état publié du module **`conseil`** en plus de celui de `balance` : une
    organisation qui a `balance` sans `conseil` (état inconnu, `NON_INSTALLE`, `ESSAI_TERMINE`, `DESINSTALLE`,
    `SUSPENDU`) reçoit **403 `CONSEIL_NOT_ENTITLED`** (code neuf), avant la portée du dossier ; `LECTURE_SEULE` ⇒ les
    lectures et `simuler` passent, une écriture rend 403 `ABONNEMENT_EXPIRE`. **Aujourd'hui, aucun état n'est publié
    pour `conseil` : ces routes ferment tant que le moteur ne l'a pas installé.**
  - **Route neuve** : `POST /api/v1/instance/conseil/{organisationId}/verifications/{code}` (identité `MOTEUR`, limitée
    à l'organisation du chemin, deux espaces ; `verification-installation@1`) : `aucun-scenario-applique`,
    `gate-conseil`, telles que le manifeste M38 les déclare ; 404 `VERIFICATION_INCONNUE` pour un autre code.
  - **Collection neuve** : `etats_publies_conseil` (projection de `etat-publie.changed.<espace>`, même enveloppe, aucun
    topic neuf), effacée par le plan C13.
  - **← D (Q-D-17 confirmée, STORY-1079)** : sur une instance `INSTANCE_ESPACE=ESSAI`, `@RequiresBalanceAccess` (et la garde du
    conseil) ne lit plus le KYC ; e-mail vérifié et état publié restent exigés ; dans le réel, rien ne change. Aucun
    code neuf.
  - **Ce qui ne change pas** : le manifeste `conseil` (1.0.0, **aucune recopie au catalogue**) ; les autres routes ; les
    rôles (droits C7 `conseil:*` non lus).
  - **→ B (recette)** : `atelier-balance` (STORY-100) doit octroyer `conseil` au cabinet avant l'étape « conseil » (sinon
    403 `CONSEIL_NOT_ENTITLED`) ; facultatif, `conseil=http://balance-service:3007` dans `INSTALLATION_SERVICES` (le
    test FR-6 de `cabinet-moteur` prendra alors un autre module « sans adresse ») ; pour la recette de l'essai, poser
    `INSTANCE_ESPACE=ESSAI` sur le `balance-service` de l'espace d'essai, aucun KYC à semer. **→ A** : un cabinet sans le
    module voit `CONSEIL_NOT_ENTITLED` sur les scénarios (proposer l'option).

- **2026-11-25 (STORY-1020), PUBLIÉ** (balance-service #165, `4d3408f` sur `dev`) — **conforme à l'annonce** ; seules les
  rubriques de l'équation sont écrites sans `=`, `+`, `-` initial (D-1020-10). Annonce : route neuve `GET /api/v1/dossiers/{dossierId}/rapprochement/etat/export`
  (paramètres de `…/etat` : `compteId`, `exerciceDebut`, `exerciceFin`, `au` ; plus `format` = `pdf` | `xlsx`, rien
  d'autre) → pièce jointe `etat-rapprochement-<arrêté>[-provisoire].<ext>`, en-tête `X-Empreinte-Document` (SHA-256 du
  contenu non daté), `Cache-Control: no-store` ; mêmes gardes et refus que `…/etat`, `@SorteDeRoute('export')`, 10 par
  minute. Mention **PROVISOIRE** tant que la balance de référence n'est pas `VALIDÉE`. **Manifeste `balance` 1.2.0** (la
  route en `routesLectureSeule`). **→ A** : FE-077 appelle cette route. **→ B** : recopie du manifeste au catalogue
  (« Demandes aux autres groupes »).

- **2026-11-25 (STORY-316), AVANT le code** : le paquet fiscal Togo 2026 change le mode de l'échéance `societe` de `depot.echeances` (`NON_CONSTATABLE` → `FORME_JURIDIQUE`, `formesJuridiques: [SA, SARL, SAS, SUARL]`) et l'entrée `DSF` du réel gagne une condition de forme juridique ; nouvelle empreinte. Le fiscal lit la `formeJuridique` du dossier (`GET /dossiers/{id}` de dossier-service, déjà lu). Une DSF de société au réel rend désormais son 30/04 ; une EI au réel reste `ECHEANCE_NON_CONSTATABLE`. **→ B** : la copie du paquet dans `dossier-service` diverge un peu plus (sans effet sur son code, qui ne lit pas ce mode).

- **2026-11-25 (STORY-315), AVANT le code** : route neuve `GET /api/v1/obligations/calendrier` (filtres `annee`, `pays`, `responsable`, `taxe`, `periode`, `statut`, `dossierId`, tri, curseur) → `{ lignes: [...], suivant }`, portée par collaborateur lue dans la réplique des dossiers (`dossiers_fiscal` projette en plus `raisonSociale`, `estLeCabinet`, `responsableUserId`, `contributeursUserIds`), index neuf `{ orgId, annee, echeance, _id }`. **→ A** : écran du calendrier (lot 7 de A).

- **2026-11-25 (STORY-1101), AVANT le code** : `POST /obligations/{id}/montant-declare` accepte `assiette` (facultatif) ; route neuve `POST /api/v1/exercices/{exerciceId}/rapprochement-liasse` → `{ redevableId, defini, couples: [...] }` ; anomalie neuve `RAPPROCHEMENT_LIASSE_ECART` (bloquante au dépôt de la DSF, levable). Le paquet fiscal gagne `rapprochementAnnuel.couples` (Togo 2026 : `CA_TVA_LIASSE`), nouvelle empreinte. **→ A** : écran (lot 7 de A).

- **2026-11-25 (STORY-326), AVANT le code** : le paquet fiscal gagne un bloc `coherence.tolerances` (par code d'obligation : `absolue`, `relative?`), source `balance-service/scripts/referentiels/sources/`, artefacts régénérés. Le fiscal sert `POST /api/v1/obligations/{id}/coherence` → `{ controles: [...] }` et contrôle aussi à l'enregistrement du déclaré ; il lit `GET …/fiscal/tva` et `GET …/fiscal/acomptes` de balance-service. Anomalies neuves `TVA_ECART_COMPTABILITE` et `ACOMPTE_ECART_RESULTAT_N1` (bloquantes au dépôt, levables). **→ A** : écran à prévoir (le contrôle, l'anomalie). **→ copies du paquet** (`dossier-service`) : le bloc neuf ne les concerne pas ; leur octet diverge de la source, sans effet sur elles.

- **2026-11-24 (STORY-1117), AVANT le code** : `balance-service` sert `GET /api/v1/dossiers/{dossierId}/balances/reference?au=AAAA-MM-JJ` → `{ balance: BalanceResumeDto | null }` (la dernière VALIDÉE complète dont l'exercice contient `au`, à défaut le dernier BROUILLON complet ; socles d'à-nouveaux et portefeuilles SFD exclus, provisionnée comprise) et `GET …/balances/resumes` (la liste, sans `lignes`). `BalanceResumeDto` = `BalanceResponseDto` sans `lignes`. Manifeste `balance` 1.1.0. Le fiscal lit la référence (D-320-5 levé), sans lire l'origine. **→ B** : copie du manifeste `balance` 1.1.0 au catalogue après la fusion. **→ A** : types de `balance-service` à régénérer si un écran les lit.

- **2026-11-24 (STORY-1100), AVANT le code** : **fait neuf** `comptabilite.facture.inscrite` v1, publié par `prospera-comptabilite-service` (outbox, schéma `contrat/schemas/comptabilite.facture.inscrite.v1.json`, registre de schémas) à chaque facture inscrite au brouillard ; consommé par `document-service` (GED), qui range une copie pré-indexée dans le fonds du client (ou l'y range à l'ouverture du fonds). Mémoire de classement de la GED : `GET /api/v1/ged/cabinet/pieces/{pieceId}/suggestion`, `GET …/fonds/{numero}/memoire-de-classement`, `GET` et `DELETE /api/v1/ged/cabinet/memoire-de-classement[/{memoireId}]`, champ facultatif `indexation.nifTiers`. Manifestes : `comptabilite` 0.5.0 (`publie`), `ged` 1.3.0 (`consomme`, routes de lecture). **→ B** : les deux copies au catalogue après la fusion. **→ A (FE-151)** : types à régénérer.

- **2026-11-24 (STORY-1088), AVANT le code** : `document-service` (module `ged`, sous `/api/v1/ged/cabinet`) gère l'original papier et la recherche. **Ajouts seuls**. Réceptions (`POST/GET …/fonds/{numero}/receptions`, `GET /receptions/{numero}` et son bordereau PDF), boîtes (`PUT /boites/{id}/cote` unique au cabinet, `GET /boites/{id}/etiquette` PDF à code QR, `PUT /pieces/{id}/original`), sorties et retours (`POST /boites/{id}/sorties`, `POST /sorties/{id}/retour`, `GET /sorties?enRetard=true`), récolement (`POST/GET …/recolements`, écarts `MANQUANTE`, `EN_TROP`, `SORTIE_NON_RENTREE`), restitution (`POST …/restitutions`, bordereau PDF), recherche (`GET …/fonds/{numero}/recherche`, texte des natures sensibles jamais cherché), conservation par pièce. Droit `ged:physique:gerer`. Dépendances `pdf-lib`, `qrcode`. Manifeste `ged` 1.2.0 (→ B pour le catalogue). **→ A (FE-143)** : types à régénérer quand l'écran viendra.

- **2026-11-24 (STORY-1087), AVANT le code** : `document-service` (module `ged`) s'ouvre au cabinet. **Ajouts seuls** ; le chemin de l'assurance ne change pas. Champ `domaine` (`SINISTRES` | `CABINET`, absent = `SINISTRES`) sur pièces, lots, fonds, versements ; routes neuves sous `/api/v1/ged/cabinet` : fonds d'un dossier client (`POST/GET …/dossiers/{dossierId}/fonds`, `GET …/fonds/{numero}`, numéro `ARC-AAAA-<CODE>-NNNNN`), plan de classement (`GET/POST …/natures`, table `ged-cabinet-2026.1`), pièces déjà déposées (`GET …/fonds/{numero}/pieces-du-dossier`, `POST …/reprises`). Droits du cabinet par `GET /moi/droits` (`ged:*`) et portée du dossier ; natures sensibles en 404 sans `ged:sensible:consulter` ; chiffrement de toutes les pièces du cabinet (`GED_CLE_CABINET`) ; quota 20 Go en alerte. Manifeste `ged` 1.1.0 (→ B pour le catalogue). **→ A (FE-143)** : types à régénérer quand l'écran viendra.

- **2026-11-24 (STORY-1097 amendée, ticket #762), AVANT le code** : `prospera-comptabilite-service` — `POST …/factures/lots/{lotId}/inscrire` accepte **`corrections.lignes`** (lignes libres qui remplacent les lignes dérivées ; signal neuf bloquant `ECRITURE_DESEQUILIBREE` ; `role: LIBRE`) ; route neuve **`POST …/factures/lots/{lotId}/apercu`** (même corps, aucune écriture, droit `comptabilite:ecriture:saisir`). Et `GET /api/v1/cabinet/memoire-des-choix` + `…/actes` : **403 `TENANT_ADMIN_REQUIS`** pour un collaborateur. **→ A (FE-149, FE-150)** : types à régénérer. Manifeste inchangé (aucune route de lecture neuve).

- **2026-11-18, STORY-1016 — un motif de plus, aucun champ ni version.** `EVALUATION` entre dans l'énumération `motif` de
  `sinistres.provision.revisee@1`, `assurance.provision.changed@1` et `assurance.provision.a-valider@1` (BACKWARD : un
  message d'avant reste valide ; le motif reste obligatoire). Un consommateur qui énumère les motifs d'`assurance`
  doit accepter `EVALUATION` (« provision réajustée à l'évaluation »). `sinistres` propose à chaque arrêt d'évaluation
  (`propositionId` = `evaluation-<dossierId>-<rang>`, devise `XOF`, montant arrêté) quand une provision est ouverte.
- **2026-11-18, STORY-1015 — deux faits neufs et une nature d'écart.** `sinistres.declaration.enregistree@1` (clés :
  `dossierId`, `reference` DEC-, `versionObjet`, `volet`, `canal`, `police`, `survenuLe`, `enregistreeLe`, `complete`,
  `manque[]` ou `ligneChiffree` — enveloppe champs-sensibles `cs1.`, contexte `sinistres.declaration.ligne-c13` ; jamais
  de donnée personnelle en clair) et `sinistres.garantie.decidee@1` (`decision`, `auteurId`, `roleExerce`, `decideLe`,
  `versionObjet` ; sans motif). `liaison-assureur.ecart.ouvert@1` : nature `DECLARATION_INCOMPLETE` ajoutée.
  ⚙ **Configuration à poser** : `SINISTRES_TROUSSEAU` = `LIAISON_TROUSSEAU` (même valeur, JSON, clés en base64) ; sans
  elles la déclaration ne part pas seule. `LIAISON_ATTRIBUTEUR` (`LC` par défaut). Pour D et B : rien à changer côté
  route.
- **2026-11-15, STORY-980 — aucun contrat neuf sur le fil.** `prospera-sinistres-service` **consomme**
  `entitlement.changed` (groupe `sinistres-service.droits`, depuis le début), sans rien publier. Il expose deux routes
  gardées : `GET /api/v1/sinistres/module` et `GET /api/v1/expertises/module` (`{ module, version, organisationId,
  lectureSeule }`). Codes de refus : `SINISTRES_NOT_ENTITLED`, `EXPERTISES_NOT_ENTITLED`, `ABONNEMENT_EXPIRE`,
  `EMAIL_NOT_VERIFIED`. Audience attendue du jeton : `sinistres-service`.

- **2026-11-15, STORY-981 — un refus NOUVEAU dans `prospera-assurance-service`** (rien d'autre ne change sur le fil :
  même format, même clé, même en-tête `eventId` pour l'outbox ; le client Kafka devient celui de Confluent). La
  comptabilité CIMA existante (toutes les routes `/api/v1/dossiers/{dossierId}/assurance/...` : contrats, provisions,
  provisions techniques, réassurance, état C10b, registre des sinistres, référentiel) rend **403
  `COMPTA_CIMA_ETEINTE`** tant que l'interrupteur `compta-cima` de l'organisation est éteint, **ce qui est le défaut**.
  Il s'allume dans la configuration du droit `assurance` : `config.interrupteurs: [{ "code": "compta-cima", "allume":
  true }]` (forme du contrat d'état publié). Aucun appelant n'existait (ni recette, ni front, ni pile racine) ; ⚠️
  annonce faite avec la PR de docs, juste après la fusion du code, et non avant : rien ne l'appelait.

- **2026-11-15, STORY-983 — deux bibliothèques NOUVELLES dans `prospera-plateforme`, rien sur le fil.**
  `champs-sensibles/src/index.ts` (enveloppe `cs1.…`, index aveugle `ia1.…`, clé enveloppée `ck1.…`) et
  `classification-sante/` (registre + garde). **Pour tout groupe qui publie un fait** : la garde refuse un champ de
  santé du registre dans **n'importe quel** schéma (JSON ou Avro, noms normalisés) ; elle se joue contre Karapace par
  `SCHEMA_REGISTRY_URL=… node classification-sante/scripts/verifier-karapace.ts`. Les trois schémas du catalogue
  passent aujourd'hui. Les règles d'exhaustivité et de données personnelles ne visent que les modules de C.

- **2026-11-15, STORY-984 — un service NEUF et un contrat NOUVEAU, rien sur le fil.**
  - `prospera-plateforme/contrats/assurance/echange-lc/` : le contrat d'échange avec le LC (annexe C corrigée, C-1 →
    C-19, `@1`), pour le LC fictif (STORY-986) et tout futur connecteur. Fichiers `<objet>_<lotId>_<version>.(json|xlsx)`.
  - `prospera-liaison-assureur-service` (port 3410, profil `liaison-assureur`) : routes gardées
    `POST /api/v1/liaison-assureur/echange/releves`, `GET …/echange/lots`, `…/echange/refus`,
    `…/echange/projections/{objet}/{cleOrigine}` ; refus `LIAISON_ASSUREUR_NOT_ENTITLED`, `ABONNEMENT_EXPIRE`,
    `PROJECTION_INCONNUE` (404). Consomme `entitlement.changed` (groupe `liaison-assureur-service.droits`) ; ne publie
    rien encore (les faits `liaison-assureur.*@1` arrivent avec STORY-985, tous ensemble).

- **2026-11-15, STORY-985 — des routes NOUVELLES dans `prospera-liaison-assureur-service`, rien sur le fil.**
  `POST /api/v1/liaison-assureur/echange/envois` (`{ objet, ligne }` : 201, 200 si identique, 409 `ENVOI_EN_CONFLIT`,
  422 `ENVOI_INVALIDE` / `OBJET_NON_SORTANT`), `GET …/echange/envois`, `GET …/echange/ecarts?etat=`,
  `POST …/echange/ecarts/{id}/resolution` (`{ decision, motif }` : 404 `ECART_INCONNU`, 409 `ECART_DEJA_RESOLU`, 422),
  `GET …/echange/numeros/{DEC-}` (404 `NUMERO_INCONNU`). Le transport par API du LC (`GET entree`, `GET entree/{nom}`,
  `PUT sortie/{nom}`, jeton porteur) est ce que le LC fictif (STORY-986) servira.

- **2026-11-15, STORY-986 — une application d'ESSAI NEUVE, rien sur le fil.** `prospera-assureur-fictif` (port 3411,
  profil `assureur-fictif`) : API du LC `GET/PUT /api/v1/lc/echange/…` (jeton porteur propre), administration
  `/api/v1/assureur-fictif/{reglages,jeu-de-base,polices/{n}/changement,cycle,recus}` derrière
  `ASSUREUR_FICTIF_NOT_ENTITLED`. Refuse de démarrer hors essai (`FICTIF_ESPACE=essai`, sinon
  `ASSUREUR_FICTIF_INTERDIT`). **Pour le moteur (B)** : le drapeau `assureurFictifAutorise` de l'état voulu signé
  remplacera cette variable quand l'agent le portera.

- **2026-11-16, STORY-988 — des routes NOUVELLES dans `prospera-sinistres-service`, rien sur le fil.**
  `POST /api/v1/sinistres/dossiers` (`{ volet, branche?, roleExerce, cleIdempotence }` : 201 au statut `DECLARE`,
  référence `DEC-AAAA-NNNNN`), `GET …/dossiers/{id}` (le dossier et `transitionsPossibles`), `POST …/{id}/transitions`
  (`{ transition, roleExerce, motif?, versionLue, cleIdempotence }`), `GET …/{id}/audit`. Refus : `DROIT_INSUFFISANT`
  (403), `MOTIF_ECRIT` (400), `DOSSIER_INTROUVABLE` (404), `TRANSITION_INCONNUE`, `ETAT_PERIME`, `CLE_REUTILISEE`,
  `TABLE_INCONNUE` (409) et, pour une condition non remplie, **le code de la condition** (409, FR-136). **Pour D (les
  écrans du circuit)** : le rôle exercé doit figurer dans la revendication `roles` du jeton (D-988-2), en attendant les
  rôles et portées d'EPIC-202 ; l'écran ne propose que `transitionsPossibles`, le serveur revérifie tout.

- **2026-11-16, STORY-989 — des routes NOUVELLES et Redis dans `prospera-sinistres-service`, rien sur le fil.**
  `GET /api/v1/sinistres/dossiers/{id}/echeances`, `POST …/{id}/echeances/{code}/suspensions` (`{ roleExerce,
  versionLue, cleIdempotence, article, debut, fin, motif }` : 400 `SUSPENSION_NON_MOTIVEE`, 404 `ECHEANCE_INCONNUE`,
  409 `ECHEANCE_ARRETEE`) ; la création accepte `survenuLe` (400 `SURVENANCE_FUTURE`) ; `ETAT_PERIME` porte désormais
  `details.modifiePar`, `modifieLe`, `heure` et `commande`. Le service exige **Redis** (`REDIS_HOST`, `REDIS_PORT`) ;
  l'époque se lit dans `INSTANCE_EPOQUE` et `INSTANCE_EPOQUE_OUVERTE_LE` **en attendant l'agent (B, EPIC-148)**.

- **2026-11-16, STORY-991 — DES FAITS NOUVEAUX SUR LE FIL** (annoncés ici, fusionnés le même jour ; aucun
  consommateur n'existait encore). Topics **sans** la version (`liaison-assureur.police.recue`), version dans
  l'enveloppe et l'en-tête `schemaVersion` (`1`), clé `organisationId`, `eventId` en en-tête et dans la charge ; schémas
  JSON draft-07 dans `prospera-plateforme/contrats/assurance/<module>/`, sujets `<topic>-value`, BACKWARD.
  - `liaison-assureur` : `assure.recu`, `produit.recu`, `police.recue`, `garantie.recue`, `prime.recue`,
    `intermediaire.recu`, `coassurance.recue`, `traite.recu`, `sinistre-existant.recu` (clés et empreinte : le contenu
    se lit par `GET …/echange/projections/{objet}/{cle}`), `numero-sinistre.attribue`, `envoi.etat` (état absolu),
    `ecart.ouvert`, `ecart.resolu`, `fraicheur.changed` (état absolu par objet et transport) ; route
    `GET /api/v1/liaison-assureur/echange/fraicheur`.
  - `sinistres` : `sinistres.dossier.changed` (état absolu ; `versionEtat` = version du dossier).
  - **Pour le registre `classification-sante`** : `champsOrdinaires` de `sinistres` et `liaison-assureur` remplis.

- **2026-11-16, STORY-992 — routes et faits NOUVEAUX ; la table du dossier passe en `2026.2`.**
  - `liaison-assureur` : `GET …/echange/a-saisir`, `GET …/a-saisir/export`, `POST …/a-saisir/{id}/saisie`,
    `POST …/echange/numeros` ; fait `liaison-assureur.liste-a-saisir.changed` ; `envoi.etat` gagne l'état
    `SAISIE_MANUELLE` (ajout, BACKWARD) ; paramètre `LIAISON_NATURES_NON_RECUES`.
  - `sinistres` : consomme `numero-sinistre.attribue` et `fraicheur.changed` (groupe `sinistres-service.liaison`) ;
    `dossier.changed` gagne `numeroOfficiel` (facultatif) ; les dossiers neufs s'ouvrent sous la table `2026.2`
    (garde `POLICE_A_RELIRE` aux transitions 17 et 18 : **sans fraîcheur reçue, l'émission d'un règlement est
    refusée**).

- **2026-11-16, STORY-993 — contrats NOUVEAUX.**
  - Les faits `liaison-assureur.*.recu` portent désormais les champs métier non personnels de leur objet (ajouts
    facultatifs, BACKWARD ; liste blanche `CHAMPS_PUBLIES`) : un consommateur qui ignorait les champs inconnus n'a rien
    à changer.
  - `assurance-service` : module `assurance` (`src/modules/assurance/`), groupe `assurance.liaison-assureur` (huit
    faits « reçus » et `fraicheur.changed`), collections `assurance_contrats_versions`, `assurance_contrats_courants`,
    `assurance_fraicheur_lc` ; routes `GET /api/v1/assurance/polices/{cleOrigine}`, `…/versions`,
    `GET /api/v1/assurance/correspondances/type-sinistre`. Décorateur `@FonctionDuCircuit()` : ni `compta-cima`, ni
    KYC, ni référentiel comptable sur ces routes (AD-3).

- **2026-11-16, verrou Docker** : tenu par A de 09:36 à 13:35 (série 910 → 912), aucune pile de C entre-temps. C a
  codé 994 et 995 sans pile pendant l'attente (branches poussées, PR ouvertes seulement après la preuve) ; les preuves
  de 993 (rejeu depuis `dev`), 994 et 995 passent l'une après l'autre, chacune prend et rend le verrou.

- **2026-11-16, STORY-994 — contrats NOUVEAUX.**
  - `sinistres` publie `sinistres.provision.revisee` (route `POST …/dossiers/{id}/provision`) ; `assurance` le consomme
    (groupe `assurance.sinistres`) et publie `assurance.provision.changed` et `assurance.provision.a-valider` (premiers
    faits du module `assurance`, entré au registre `classification-sante`).
  - `assurance` : collections `assurance_provisions_mouvements`, `assurance_provisions_propositions` ; routes
    `GET /api/v1/assurance/provisions/{référence}`, `…/a-revoir`, `…/grille-ouverture`,
    `POST …/{référence}/propositions/{id}/decision`.

- **2026-11-16, STORY-995 — contrats NOUVEAUX ; `document-service` gagne un module.**
  - `ged.piece.recue`, `.versionnee`, `.rattachee`, `.a-rattacher` (clés, empreinte, type ; `DOCUMENT_MEDICAL` pour la
    santé) ; `ged` consomme `sinistres.dossier.changed` (groupe `ged.sinistres`).
  - `document-service` : socle « état des modules » (consomme `entitlement.changed`, groupe
    `document-service.etat-des-modules` ; gate `<CODE>_NOT_ENTITLED`), `AuthenticatedUser.roles` (tous les rôles du
    jeton, à côté de `role`) ; module `ged` : collections `ged_*`, bucket `ged-pieces` (`GED_BUCKET`), clé de santé
    `GED_CLE_SANTE` (sans défaut) ; routes `POST/GET /api/v1/ged/pieces…`, `GET /api/v1/ged/a-rattacher`.
  - ⚠️ Pour B (catalogue) : le module `ged` attend son droit `ged` dans `entitlement.changed`.

- **2026-11-16, STORY-998 — routes nouvelles de `sinistres`, aucun contrat de fait.**
  - `GET /api/v1/sinistres/files/{file}` (lecture seule, au manifeste) ; champ dérivé `prochainTermeLe` et deux index
    sur `sinistres_dossiers`.
  - ⚠️ Pour tous : sur les piles de preuve, `GET /api/v1/health` de `sinistres` rend 503 au démarrage (lignes
    d'erreur aux journaux, conteneur « unhealthy » quelques secondes) ; à ne pas confondre avec une erreur du scénario.

- **2026-11-17, STORY-996/997 — `document-service` : contrats NOUVEAUX, et deux changements qui touchent tout le
  service.**
  - Faits `ged.piece.controlee`, `ged.lot.changed`, `ged.dossier.verse`, `ged.dossier.scelle`, `ged.empreinte.echec`
    (prêts à consommer : `sinistres` lira `ged.piece.controlee` pour la pièce « reçue »).
  - ⚠️ **Le moteur OCR du service** (`src/ocr/pdf-page-renderer.ts`, partagé par le KYC, le profil et les pièces
    comptables) : un PDF dont les pages sont des images JPEG (tout vrai scan) faisait tomber le processus (Windows) ou
    bloquait le rendu (Linux) — pdf.js mêlait sa copie de `@napi-rs/canvas` (0.1.x) à celle du service (1.x). Corrigé
    par une `CanvasFactory` ; test de régression au smoke OCR.
  - ⚠️ **Le filtre d'exceptions global** transmet désormais `details` d'un refus nommé (additif).
- **2026-11-17, STORY-999 — `sinistres`** : routes `POST …/relances`, `POST …/relances/{n}/effet`, files
  `a-surveiller`, `a-relancer`, `muets`, `GET …/activite/agents-inactifs` ; constat `RELANCES_EPUISEES` posé par la
  commande ; champs `derniereActionLe`, `relances`, `attente` ; le fait `sinistres.dossier.changed` ne change pas.
  - ⚠️ Pour tous les dépôts Mongo : `$set` IGNORE un champ devenu `undefined` (il reste en base) ; un champ qui
    disparaît se retire par `$unset` — le banc mémoire ne le voit pas.

- **2026-11-17, STORY-1000 — un secret d'instance PARTAGÉ entre deux services.**
  - `SINISTRES_CLE_DOUBLON` (sinistres) et `LIAISON_CLE_DOUBLON` (liaison-assureur) doivent porter la MÊME clé
    (32 octets en base64), sans défaut : sans elle, le contrôle de doublon est éteint (la déclaration s'enregistre).
    ⚠️ Pour B (installation, moteur) : à générer une fois par instance et à remettre aux deux services.
  - `liaison-assureur.sinistre-existant.recu` gagne `empreinteDeDoublon` (facultatif) ; `sinistres` le consomme
    (groupe `sinistres-service.liaison`).
  - `POST /api/v1/sinistres/dossiers` accepte `declaration` et `doublon` (facultatifs, D-1000-6) ; la réponse porte
    `accuse` ; nouveaux refus `DECLARATION_INCOMPLETE`, `RECEPTION_FUTURE`, `FORMULAIRE_SECOURS_DEJA_SAISI`,
    `DOUBLON_PROBABLE`, `MOTIF_ECRIT`, `DOSSIER_HORS_DOUBLON`.

- **2026-11-17, STORY-1001 — un port HTTP entre deux services, et un fait de `ged` consommé.**
  - `sinistres` lit `GET /api/v1/assurance/recevabilite` (`ASSURANCE_URL`) en **transmettant le jeton de l'agent** :
    ⚠️ pour B (installation, IdP) : le jeton doit porter l'audience `assurance-service` ; sinon la recevabilité reste
    « injoignable » (jamais un refus).
  - `sinistres` consomme `ged.piece.controlee@1` (groupe `sinistres-service.liaison`, D-1001-7) : les pièces validées
    au contrôle posent `PIECES_COMPLETES` — les preuves n'ont plus à poser ce constat en base.
  - Nouvelles routes : `POST /api/v1/sinistres/dossiers/{id}/recevabilite`, `…/garantie` ; manifeste `assurance` amendé
    (route de lecture `recevabilite`).
  - ⚠️ STORY-1000 corrigée (#11) : codes de type `MRH`, `ACCIDENT_TRAVAIL` (ceux de la démo et d'`assurance`).

- **2026-11-17, STORY-1002 — le registre des gestionnaires, et le parcours contre le LC fictif.**
  - `sinistres` tient le registre des gestionnaires (`sinistres_gestionnaires`) tant que `reseau` n'est pas là
    (AD-26) ; quand `reseau.affectation.changed@1` existera, son consommateur l'écrira.
  - Nouvelles routes : `PUT/GET /api/v1/sinistres/gestionnaires`, `GET …/dossiers/{id}/affectation/candidats`
    (lectures au manifeste, #584), `POST …/dossiers/{id}/affectation`.
  - ⚠️ **Écart de contrat** : `sinistres.declaration.enregistree@1` (AD-16 : `liaison-assureur` le consomme) n'a ni
    schéma, ni producteur, ni consommateur, et aucune story ne le porte. La preuve de 1002 a enfilé la déclaration à
    la main chez `liaison-assureur` (`POST …/echange/envois`). Voir la question au PO ci-dessous.
  - Observation pour la reprise : le LC fictif type ses sinistres existants dans son propre vocabulaire (`COLLISION`,
    `VOL_VEHICULE`, `ACCIDENT_DU_TRAVAIL`, `RESPONSABILITE_CIVILE`…), différent de celui de `sinistres` et
    d'`assurance` (`AUTO_MATERIEL`, `ACCIDENT_TRAVAIL`, `RC_GENERALE`…). Une correspondance sera nécessaire quand ces
    sinistres seront repris.

- **2026-11-17, STORY-1003 — deux paramètres figés, une route.** `separation-2026.1` (actes de partie et cumuls) et
  `delegation-2026.1` (matrice datée) ; `POST /api/v1/sinistres/dossiers/{id}/controle`. La validation (10a) d'un
  montant au-delà du niveau 1 est refusée à tout signataire seul (403, niveau `COMITE`) jusqu'à la séance du comité.

- **2026-11-17, STORY-1004 — la portée s'applique désormais à `sinistres`.** Un agent ne voit que les dossiers de
  son périmètre de rôle (FR-6) et, quand `reseau` est installé, de sa portée réseau. ⚠️ Pour les autres groupes : un
  `GEST` doit être au **registre des gestionnaires** (STORY-1002) pour voir un dossier ; une organisation qui installe
  `reseau` sans publier de portées ne voit **plus rien** dans `sinistres` (échec fermé voulu). Nouveau champ facultatif
  `noeudId` à la déclaration (`POST /api/v1/sinistres/dossiers`). Contrat consommé : `reseau.portee.changed@1`.

- **2026-11-17, STORY-1005 — le fil ne change pas, la source de la garde change.** Les trois services (`sinistres`,
  `liaison-assureur`, `document-service`) consomment désormais `etat-publie.changed.<espace>@1` (groupe
  `KAFKA_ETAT_PUBLIE_GROUP_ID`, espace `INSTANCE_ESPACE`, défaut `REEL`) et **plus** `entitlement.changed`. Les routes,
  les codes de refus et l'audience ne changent pas ; un module en `LECTURE_SEULE` refuse l'écriture par
  `ABONNEMENT_EXPIRE`. ⚠️ Pour les autres groupes et l'exploitation : le service ne s'ouvre plus tant que le moteur
  n'a pas publié l'état du module ; la collection `socle_etat_des_modules` est orpheline (à nettoyer à la main) ;
  l'état vit dans `socle_etat_publie`. `assurance-service` est passé à son tour avec STORY-1006 (voir plus bas).

- **2026-11-17, STORY-1006 — `assurance` lit l'état publié ; `assurance` ne quitte pas tout à fait `entitlement.changed`.**
  `prospera-assurance-service` consomme `etat-publie.changed.<espace>@1` (groupe `KAFKA_ETAT_PUBLIE_GROUP_ID`, espace
  `INSTANCE_ESPACE`, défaut `REEL`) pour le droit, la lecture seule et l'interrupteur `compta-cima`
  (`module.interrupteurs[]`, absent = éteint). Routes et codes inchangés. ⚠️ Pour l'exploitation : le service ne sert
  plus rien tant que le moteur n'a pas publié l'état du module `assurance` ; et `compta-cima` reste éteint tant que
  le moteur ne l'allume pas (la route de B publiait `interrupteurs` vide à STORY-936). Le fil `entitlement.changed`
  reste lu **pour les référentiels habilités seulement**.
- **→ B (2026-11-17) : les référentiels habilités dans l'état publié ?** — **question, ouverte.** Le palier ④ du gate
  d'`assurance` (`cima-assurances@7.0`) lit `referentiels` dans `entitlement.changed` ; l'état publié ne les porte pas.
  Choix par défaut de C : garder ce fil pour ce seul champ (D-1006-5). Si B ajoute un champ facultatif (compatibilité
  BACKWARD) ou publie un autre contrat, C bascule et retire le consommateur.

- **2026-11-17, STORY-1007 — aucun contrat sur le fil, un champ de plus au dossier.** `courriers[]` du dossier peut
  porter un courrier `ACCUSE_RECEPTION` (destinataire `ASSURE`, `BROUILLON`) en plus de `DEMANDE_PIECES` ; le
  référentiel des échéances `2026.1` déclare l'événement `ACCUSE_POSE`. **Pour D (EPIC-220)** : l'accusé du dossier
  complet est prêt à envoyer dans `courriers[]` ; l'envoi, sa preuve et son archivage restent à vous.

- **2026-11-17, STORY-1014 — des routes NOUVELLES dans `prospera-sinistres-service` (module `expertises`), un
  amendement de manifeste, aucun fait sur le fil.** Sous `/api/v1/expertises/` : `POST experts`, `PUT experts/{id}`,
  `POST experts/{id}/desactivation`, `…/reactivation`, `…/agrement`, `…/controle-de-designation` ; `GET experts`
  (`actif`, `designablePour`) et `GET experts/{id}`. Le rôle exercé se donne (`roleExerce`) comme dans les registres de
  1002. Refus de désignation en **409** : `AGREMENT_ECHU` (« Agrément échu le AAAA-MM-JJ », `details.echuLe`),
  `AGREMENT_ABSENT`, `EXPERT_INACTIF`, `DOMAINE_NON_COUVERT`. **Manifeste `expertises` amendé** (`prospera-stories`
  50883fa, PR #630) : `GET /api/v1/expertises/experts/{expertId}` en `routesLectureSeule` ; **pour B** : recopier ce
  manifeste au catalogue (même demande que celle du 16/11). **Pour la story de désignation (FR-61)** : appeler
  `ExpertsService.exigerDesignable(organisationId, expertId, domaine)` (exporté par `ExpertisesModule`) avant d'écrire.

- **2026-11-17, STORY-1008 — aucun contrat sur le fil, un champ de plus au dossier.** Les transitions d'ouverture de
  `sinistres` publient maintenant `sinistres.provision.revisee@1` (motif `OUVERTURE`, devise `XOF`, volet et gravité ou
  estimation du déclarant, `propositionId` = `ouverture-<dossierId>`) ; même sujet et même schéma que STORY-994, rien de
  neuf pour `assurance`, qui l'a déjà consommé. `GET …/dossiers/{id}` porte `provisionOuverture` (facultatif).
  ⚠️ Pour tous : un dossier **corporel** n'a toujours aucune provision tant qu'un agent ne la saisit pas (FR-49).

- **2026-11-17, STORY-1009 — aucune route neuve, aucun fait neuf ; la transition 6 et 12 gagnent un champ.**
  `POST /api/v1/sinistres/dossiers/{id}/transitions` accepte `piecesDemandees` (`[{ code, demandeA?, motif? }]`),
  **obligatoire** pour les transitions 6 et 12 (`PIECES_NON_NOMMEES`, 400) et **refusé** pour toute autre
  (`PIECES_HORS_DEMANDE`, 400) ; autres refus : `PIECE_INCONNUE`, `PIECE_EN_DOUBLE`, `PIECES_TROP_NOMBREUSES`,
  `DESTINATAIRE_INCONNU`, `MOTIF_ECRIT` (400), `PIECE_DEJA_ATTENDUE` (409). Les pièces attendues du dossier gagnent
  `motif`, `demandeNumero`, `demandeeLe`, `demandeePar`, `demandeeRole` (facultatifs). **Pour D (écrans du circuit)** :
  `transitionsPossibles` ne dit pas que 6 et 12 demandent des pièces ; l'écran doit les collecter avant d'envoyer
  (code du catalogue de `pieces-2026.1`, motif de 10 caractères au moins, destinataire facultatif). **Pour D
  (EPIC-220)** : le courrier `DEMANDE_PIECES` d'une demande est en `BROUILLON` dans `courriers[]`, un par destinataire.
  ⚠️ Pour tous : quitter l'attente de pièces lève maintenant aussi le constat `RELANCES_EPUISEES` (jusque-là il restait
  vrai après la reprise).

- **2026-11-17, STORY-1011 — une route de lecture, une écriture, aucun fait neuf.**
  `GET /api/v1/sinistres/dossiers/{id}/instruction` (lecture seule, au manifeste, `prospera-stories` 36da9fd) rend
  `{ dossierId, version, type, formulaire: { sorte: 'FORMULAIRE', version, famille, libelle, champs[] } | { sorte: 'RENVOI',
  renvoi: 'BAREME_CORPOREL', libelle } | null, figee, figeeLe?, valeurs, enregistrements[] }` ; réservée à GEST, GREC, RESP,
  COMITE, DT, DG, AUD (403 sinon, 404 hors portée). `POST` même chemin : `{ roleExerce, versionLue, cleIdempotence,
  valeurs }`, rôles GEST, GREC, RESP, dossier `EN_INSTRUCTION` ; rend la même vue. Refus : `CHAMP_OBLIGATOIRE_ABSENT`
  (`details.champs` = tous les manquants), `CHAMP_INCONNU`, `VALEUR_INVALIDE` (`details.champs[{champ, attendu}]`) en 400 ;
  `INSTRUCTION_IMPOSSIBLE`, `FORMULAIRE_SANS_CALCUL` (`details.renvoi`), `TYPE_DE_SINISTRE_ABSENT`, `SEPARATION_DES_TACHES`,
  `ETAT_PERIME`, `CLE_REUTILISEE` en 409. **Pour D (écrans)** : dessiner le formulaire depuis `formulaire.champs` (type,
  libellé, obligatoire, `obligatoireSi`, valeurs, bornes) ; dates `AAAA-MM-JJ`, montants entiers en FCFA, pourcentages 0-100.
  **Pour B/A** : `dossier.instruction` est une donnée du dossier, jamais dans `sinistres.dossier.changed@1`.
  ⚠️ Enregistrer le formulaire rend partie « instruire » : celui qui le remplit ne validera ni ne contrôlera.

- **2026-11-17, STORY-1013 — une route de lecture, une écriture, aucun fait neuf.**
  `POST /api/v1/sinistres/dossiers/{id}/evaluations` : `{ roleExerce, versionLue, cleIdempotence, montant, motif? }`
  (GEST, GREC, RESP ; dossier `EN_INSTRUCTION` ou `EVALUE`). Le montant est un entier de francs, obligatoire, jamais
  arrondi ni écrit d'office ; `motif` (10 caractères) obligatoire quand il diffère du décompte et dès la version 2.
  Refus : `MONTANT_EVALUE`, `MONTANT_INVALIDE`, `MOTIF_ECRIT` (400) ; `EVALUATION_IMPOSSIBLE`, `TYPE_DE_SINISTRE_ABSENT`,
  `INSTRUCTION_NON_ENREGISTREE`, `DECOMPTE_IMPOSSIBLE`, `DECOMPTE_INVALIDE`, `ALERTE_BLOQUANTE_NON_LEVEE`,
  `SEPARATION_DES_TACHES`, `ETAT_PERIME`, `CLE_REUTILISEE` (409). `GET …/evaluations` (lecture seule, au manifeste,
  `prospera-stories` 7bba9ca ; mêmes rôles de lecture que le formulaire) rend `{ dossierId, version, statut, montants:
  { evaluation: { montant, rang }, provision: { montant: null, tenueParAssurance: true }, offre, reglement, recours :
  { montant: null } }, courante, evaluations[] }` ; chaque évaluation porte `rang`, `montant`, `motif?`, `arreteePar`,
  `arreteeLe`, `survenuLe`, `tableVersion?`, `tableDeVetusteVersion?`, `decompte?` (lignes, repère, alertes) ou
  `renvoi: 'BAREME_CORPOREL'`. **Pour D (écrans, « Pourquoi ce montant ? »)** : afficher `decompte.lignes` tel quel, ne
  rien recalculer côté écran ; les cinq montants s'affichent côte à côte, jamais fondus. `vue.montantEvalue` est celui de
  la dernière version. **Pour B/A** : l'évaluation est une donnée du dossier, jamais dans `sinistres.dossier.changed@1` ;
  aucun fait `sinistres.evaluation.arretee@1` (D-1013-9) et aucune proposition de provision à l'arrêt (D-1013-8).
  ⚠️ Arrêter l'évaluation rend partie « évaluer » (FR-29).

## Questions à l'utilisateur ou au PO

- **❓ 2026-11-18 — STORY-1016, décisions contestables (D-1016-1 → 10, fiche).** Les quatre qui comptent : D-1016-4 (rien
  ne part sans provision ouverte : un corporel jamais ouvert à la main n'est pas aligné), D-1016-6 (le corporel propose
  aussi : le montant est celui du gestionnaire), D-1016-7 (`GREC` propose comme `GEST`, le seuil glissant s'applique à lui),
  D-1016-10 (`sinistres` ne lit pas la réponse d'`assurance` : l'écran ne dit pas encore si l'alignement est retenu ou attend
  le `RESP`).
- **❓ 2026-11-17 — STORY-1002, question au PO : qui porte `sinistres.declaration.enregistree@1` ?** La spine (AD-16)
  le fait consommer par `liaison-assureur` ; aucune story ne le crée. Proposition de C : une story de C dans son lot 3
  (schéma dans `prospera-plateforme`, publication par `sinistres` à la déclaration, consommation par
  `liaison-assureur` qui enfile la ligne C-13), avec `sinistres.garantie.decidee@1` (différé par D-1001-5). En
  attendant, la déclaration ne part pas seule au LC.

Retenu par défaut le 2026-11-15, selon la règle de l'utilisateur (« appliquer ce que je recommande, contestable après
coup ») ; détail dans `stories/STORY-980.md`, « Décisions retenues par défaut » :

- **D-980-1** : le plan dit « gate `assurance` » pour STORY-980 ; la spine (AD-3) et le manifeste disent **un gate par
  module**. Retenu : `SINISTRES_NOT_ENTITLED` et `EXPERTISES_NOT_ENTITLED`. Le code `assurance` reste celui de
  `prospera-assurance-service`.
- **D-981-1 / D-981-2** : en attendant l'état publié, la position de `compta-cima` se lit dans la configuration du droit
  `assurance` (même forme que le contrat figé), **éteint par défaut** ; refus nommé `COMPTA_CIMA_ETEINTE`, après le droit
  et avant la lecture seule. Si le PO veut la comptabilité CIMA **allumée par défaut** pour les cabinets, c'est un
  changement d'une ligne, mais il contredit « un nom absent se lit éteint ».
- **D-983-8** : la liste des champs et pièces de santé du registre est un **défaut** tiré de FR-9, FR-70 et R5 ; le
  médecin-conseil et le juriste la relisent (J-02).
- **D-992-1 → D-992-6** (`stories/STORY-992.md`) : natures non reçues en paramètre ; correspondance des natures ;
  police « à relire » jugée sur l'objet `police` de l'organisation ; garde par une table `2026.2` ; alerte « sans
  numéro » avec 999 ; `numeroOfficiel` facultatif dans `dossier.changed`.
- ~~**D-991-2 — question au PO**~~ **TRANCHÉE le 2026-11-16 par l'utilisateur** (« oui il faut l'y autoriser ») :
  `liaison-assureur` consomme `sinistres.dossier.changed@1` (source de C-17). AD-16 et le manifeste `liaison-assureur`
  amendés (PR « amendement AD-16 ») ; la consommation se code avec la story qui envoie C-17.
- **D-993-1, D-993-2 — amendements d'AD-16 retenus par défaut, contestables** (même PR) : les faits `.recu` des objets
  du contrat portent leurs champs métier non personnels ; `assurance` consomme `liaison-assureur.fraicheur.changed@1`.
- **D-1014-1 → D-1014-10** (`stories/STORY-1014.md`) : un référentiel, un champ `genre` (garages et assureurs adverses
  hors story) ; externe sans agrément daté = non désignable (échec fermé) ; la date de fin est le dernier jour valide ;
  un agrément qui échoit après la désignation ne touche pas la mission ; règles de fiche (interne = `SALARIE`, domaines
  paramétrés) ; « non désignable » prouvé par `exigerDesignable` + route de contrôle (409) + `designation` de chaque
  ligne ; le gestionnaire ne voit que les désignables ; prolongation = pièce obligatoire, date qui suit l'actuelle ;
  paramètre figé `experts-2026.1.json` ; manifeste amendé pour la fiche en lecture seule. ⚠️ Écart : aucun
  `docker compose up` du service pour cette story (plan : « Docker : non ») ; droits fins `expertises:*` toujours à poser.

- **D-1010-1 → D-1010-10** (`stories/STORY-1010.md`) : pas de commande « arrêter l'évaluation » (c'est 1013) ; table
  `decompte-2026.1` datée, jugée à la survenance ; lignes entières de francs, demi vers le haut, arithmétique entière ;
  **le PRD se contredit sur 702 000** : indemnité calculée au franc (702 000) et repère arrondi (700 000), question au PO ;
  adaptateur du formulaire ; franchise après le plafond ; corporel renvoyé au barème ; matériel automobile renvoyé à 1012
  (point d'insertion : variante `PAR_AGE_SUR_PIECES` de `Vetuste`, table `2026.2`) ; alertes du décompte seulement.
  **→ PO** : l'écran affiche-t-il 702 000 ou 700 000 comme repère ? (défaut : 702 000, repère arrondi à côté).
- **D-1012-1 → D-1012-12** (`stories/STORY-1012.md`) : **table de vétusté distincte** (`vetuste-automobile-2026.1`) et non
  `decompte-2026.2` comme le pensait D-1010-9 (pas de rétroactivité, `decompte-2026.1` intacte, le décompte rend
  `tableVersion` et `tableDeVetusteVersion`) ; quatre catégories de pièces portant toutes la grille indicative de la
  démo (H-059) ; âge = année de survenance − année de mise en circulation, bornes comprises ; vétusté sur pièces seulement ;
  épave si la remise en état dépasse **strictement** la valeur vénale, sans vétusté, décision validée prioritaire, sans
  valeur vénale `A_DECIDER` ; RC seule fautif = zéro et `BLOQUANT`, franchise nulle en RC ; **« 775 000 » non reproduit**
  (entrées absentes de tout extrait) ; contexte en 5e paramètre de l'adaptateur ; alertes d'instruction (H-046) hors
  story. **→ PO** : la grille de vétusté de la compagnie (A-5, H-059) est à obtenir ; les quatre catégories attendent
  ses valeurs.
- **D-1018-1 → D-1018-3** (`stories/STORY-1018.md`) : deux montants « conformes » à l'arrêt (décompte au franc et
  indemnité proposée), tout autre se motive ; le nom d'écran est « indemnité proposée », le champ garde `reperePropose` ;
  le pas reste le paramètre `arrondi_indemnite_fcfa` (5 000, H-060). Contestables ; aucune question ouverte.
- **D-1017-1 → D-1017-9** (`stories/STORY-1017.md`) : brouillon dans la ligne du registre (jamais un dossier) ; une ligne
  du registre par usage, écrite par `sinistres` ; mots-clés et confiances en paramètre figé, formats dans le code ; police
  lue par son numéro seul (pas de recherche par plaque ou téléphone chez `assurance`) ; vocal refusé sans trace ; dates en
  jours ; « pas de blessé » = gravité légère ; lecture du registre et fait `sinistres.ia.decision.enregistree@1` renvoyés
  (manifeste) ; extracteur derrière un port pour l'IA commune. Contestables ; aucune question ouverte.
- **D-1013-1 → D-1013-12** (`stories/STORY-1013.md`) : commande à part avant la transition 7 ; montant obligatoire, au
  franc, jamais écrit d'office ; décompte calculé une fois et copié ; les DEUX tables jugées à la survenance ; ajout seul,
  motif dès la version 2, permis en instruction et en évalué ; rôles de la transition 7 et partie « évaluer » ; motif
  comparé au décompte (le chiffrage de l'expertise viendra avec FR-61) ; **la provision n'est pas réalignée** (motif
  absent de la liste fermée et du schéma : contrat) ; pas de fait `evaluation.arretee@1` ; alerte bloquante = refus
  (lever : à écrire) ; sans formulaire, pas d'évaluation ; corporel sans décompte. **→ PO** : veut-il que l'arrêt de
  l'évaluation propose la provision à `assurance` (motif `EVALUATION`, FR-76) dans une story de plus ? (défaut : oui,
  plus tard, avec l'ajout facultatif du motif au fait.)
- **D-1011-1 → D-1011-9** (`stories/STORY-1011.md`) : six familles de formulaires, AT et décès renvoyés au barème
  corporel ; champs seulement, ni calcul ni alerte (1010, 1012) ; version figée à l'entrée en instruction (à défaut au
  premier enregistrement) ; tout ou rien, défauts pour les facultatifs ; écriture en `EN_INSTRUCTION` par GEST, GREC, RESP ;
  enregistrer = acte `INSTRUIRE` ; aucune valeur dans la piste ni dans un fait ; lecture réservée (liste à confirmer avec
  l'annexe B) ; aucun champ de santé (le corporel aura son canal, FR-70).
- **D-1009-1 → D-1009-11** (`stories/STORY-1009.md`) : la demande se joint à la transition (pas de route) ; pièces
  demandées obligatoires ; catalogue de `pieces-2026.1`, pas de pièce libre ; motif de la pièce ou de la transition
  (10 caractères) ; pièce déjà attendue refusée, déjà reçue redemandable ; attente toujours celle de l'assuré ;
  suspension FR-85 non posée (date conservée) ; la piste nomme les pièces ; paramètre figé `demande-de-pieces-2026.1` ;
  constat `RELANCES_EPUISEES` levé avec les relances ; pièce rejetée gardant son motif. ⚠️ Écart : aucun
  `docker compose up` du service pour cette story (plan : « Docker : non »).
- **D-1008-1 → D-1008-7** (`stories/STORY-1008.md`) : l'ouverture = transitions 1 et 2 (3 en rattrapage), listes en
  paramètre figé ; corporel et recours exclus (FR-49 contre « grille par volet » du plan) ; rôle du fait `RESP` ou
  `GEST` ; estimation avant gravité, jamais d'erreur ; devise `XOF` du paramètre ; identifiant de proposition dérivé du
  dossier ; pas de ligne d'audit propre. ⚠️ Écart à connaître : le plan dit « grille par volet et gravité » alors que
  FR-49 réserve le corporel à la saisie humaine — C a suivi le PRD.
- **D-1007-1 → D-1007-5** (`stories/STORY-1007.md`) : dossier complet = passage de « il manque » à « aucune pièce
  obligatoire ne manque » sur un contrôle validé ; date du contrôle ; événement `ACCUSE_POSE` ajouté à l'arrêt (sans
  émettre `DOSSIER_COMPLET`, qui ouvre l'offre) et `DOSSIER_OUVERT` conservé ; l'accusé est un courrier du dossier ;
  posé une seule fois. ⚠️ Écart de lecture avec FR-48 (« s'arrête à l'envoi ») jusqu'à EPIC-220.

- **D-1006-1 → D-1006-8** (`stories/STORY-1006.md`) : l'interrupteur est `module.interrupteurs[]` du module
  `assurance` ; mêmes règles de droit que 1005 ; entrée illisible = éteinte ; un module fermé n'allume rien ;
  référentiels toujours lus dans `entitlement.changed` ; ordre de la garde inchangé ; collection
  `org_assurance_etat_publie` ; `src/vendor` hors lint.
- **D-1005-1 → D-1005-7** (`stories/STORY-1005.md`) : l'état publié décide seul, sans double lecture ; `LECTURE_SEULE`
  traduit en `ACTIVE` à échéance d'époque 0 ; espace = `INSTANCE_ESPACE`, l'autre est ignoré ; idempotence par
  `(epoque, numero)`, plus de registre d'`eventId` ; `reseau` reste un voisin suivi dans `sinistres` ; collection
  orpheline laissée ; erreur de lint de `document-service` corrigée ici.
- **D-1004-1 → D-1004-7** (`stories/STORY-1004.md`) : deux couches fail-closed ; `reseau` installé lu dans l'état
  des modules (voisin suivi) ; volet du GEST lu au registre ; périmètres de MED et CPT ; `noeudId` au dossier ; jamais
  la portée dans le jeton ; commandes du système hors portée.
- **D-1003-1 → D-1003-8** (`stories/STORY-1003.md`) : actes lus dans l'historique ; évaluer compte comme instruire ;
  affecter puis valider permis ; émettre n'est plus interdit à l'instructeur (FR-7) ; niveau 1 signé par RESP, DT ou
  DG ; cumul = montant évalué ; au-delà du niveau 1, aucun signataire seul ; le contrôle pose `CONTROLE_ABSENT`.
- **D-1015-1 → D-1015-10** (`stories/STORY-1015.md`) : le fait ne porte que des clés, la ligne C-13 chiffrée ; le
  déclarant est l'assuré saisi ; seule une déclaration créée publie (ni rattachement, ni recours) ; sans trousseau elle ne
  part pas seule (config `SINISTRES_TROUSSEAU` = `LIAISON_TROUSSEAU`) ; incomplète = écart `DECLARATION_INCOMPLETE` ;
  relevé déclenché après l'enfilage ; module en service requis (sinon écarté) ; garantie gardée par version sans envoi ;
  `LIAISON_ATTRIBUTEUR` ; garantie de la preuve jouée par `RESP`.
- **D-1002-1 → D-1002-8** (`stories/STORY-1002.md`) : registre tenu par `sinistres` ; poids de type à 1, poids de
  dossier non arrondi ; capacité de 20 points ; affecter est une commande hors transition ; cible surchargée ou absente
  = motif ; `RESP` seul ; fait du dossier inchangé ; envoi de la déclaration à la main dans la preuve.
- **D-1001-1 → D-1001-8** (`stories/STORY-1001.md`) : `assurance` calcule, `sinistres` lit par un port (jeton
  transmis) ; recevabilité ajoutée et datée ; pièce reçue = validée au contrôle ; délai de la garantie en jours
  calendaires, jamais sous le plancher ; différés nommés ; pièce de santé = première pièce médicale attendue ; un seul
  consommateur supervisé ; rôles du circuit du jeton chez `assurance`.
- **D-1000-1 → D-1000-7** (`stories/STORY-1000.md`) : déclaration rangée au dossier, jamais dans un fait ; doublon
  par empreinte HMAC à clé d'instance partagée ; le choix de l'agent dans la même commande ; délais de déclaration en
  paramètre (planchers légaux), celui de la garantie avec 1001 ; pas d'envoi de l'accusé ici ; formulaire facultatif
  pour cette version ; l'urgence trie les files.
- **D-996-1 → D-996-10**, **D-997-1 → D-997-7**, **D-999-1 → D-999-6** (fiches) : lecture par version et file
  BullMQ ; moteur du service hors des modules (`ocr` admis par l'invariant) ; seuils de lecture en paramètre `2026.2` ;
  contrôle par NUM, l'agent récepteur, GEST/GREC/RESP ; lots par NUM/RESP ; numéro `ARC-` par compteur, jamais rendu ;
  valeur des pièces en paramètre `2026.3` ; scellé sur les fichiers ; `/Cn` lié au précédent ; relances « à confirmer »
  (pas d'envoi) ; l'attente d'un tiers comme état du dossier, pas une échéance ; seuils du silence en paramètre.
- **D-998-1 → D-998-4** (`stories/STORY-998.md`) : volet en paramètre jusqu'à la portée (1004) ; files des autres
  modules lues par statut ; `prochainTermeLe` dérivé stocké ; dossiers muets et « à surveiller » en STORY-999.
- **D-995-1 → D-995-7** (`stories/STORY-995.md`) : dossier connu par `sinistres.dossier.changed` ; noms de routes et
  bucket proposés ; rôles lus dans le jeton ; types de la démo reliés aux classes du registre ; AES-256-GCM sans clé par
  défaut ; antivirus absent ⇒ « à scanner » ; `recue` au dépôt.
- **D-994-1 → D-994-6** (`stories/STORY-994.md`) : périmètre (lecture par `sinistres` et ouverture par la commande
  avec 1001) ; clé `DEC-` ; seuil glissant depuis la dernière validation du `RESP` ; grille chez `assurance` ; décision
  chez `assurance` ; propositions rejetées gardées sans fait.
- **D-993-3 → D-993-9** (`stories/STORY-993.md`) : version de la table choisie à l'ouverture du dossier ; gardes
  comptables par route ; `NON_INSTALLE` chez l'appelant ; `JAMAIS_LUE` sans fraîcheur reçue ; groupe
  `assurance.liaison-assureur` ; routes portées par l'organisation, pas par un dossier ; droits fins `assurance:*` pas
  encore posés (rôles tenant).
- **D-991-1 → D-991-6** (`stories/STORY-991.md`) : liste « à saisir » reportée à 992 ; graphie des sujets ;
  transactions de `liaison-assureur` par le stockage local asynchrone de Mongoose ; fraîcheur des fichiers 24 h ;
  `rang` = version de l'objet.
- **D-989-1 → D-989-8** (`stories/STORY-989.md`) : tâche différée à identifiant stable ; époque par la configuration ;
  constater sans envoyer (STORY-999) ; `survenuLe` à la création ; heures ouvrées = heures des jours ouvrés ; une
  échéance plus courte que sa fenêtre d'alerte est sous alerte dès son départ.
- **D-988-1 → D-988-7** (`stories/STORY-988.md`) : conditions lues dans les constats du dossier en échec fermé ; rôle
  exercé lu dans le jeton ; création minimale ; `COMITE` est une instance ; la version lue se contrôle avant la
  transition ; seule une commande acceptée consomme sa clé d'idempotence.
- **D-980-3** : **pas de KYC** dans le gate de `sinistres-service` (C2 ne demande que le droit du module). Si le PO veut
  le KYC de la compagnie à chaque requête, comme dans `assurance-service`, il le dit.

## Pièges rencontrés

- **(STORY-319, 26/11) un test qui règle l'horizon par la configuration ne prouve pas l'horizon du cabinet** : la mutation
  « `horizon(null)` » (le défaut au lieu de celui de l'organisation) a survécu tant que le test passait l'horizon par le
  `ConfigService` ; il faut le régler par `changerHorizon` sur l'organisation, défaut différent. De même, un acte testé avec
  `avant: null` ne prouve pas que `avant` est recopié.
- **(STORY-319)** le script de mutations s'écrit avec des motifs d'une ligne : un `\n` dans une chaîne Python passée par heredoc
  devient un vrai saut de ligne et casse le script.

- **(STORY-318, 26/11) un `tsc` vert avant la dernière retouche ne prouve rien** : un `delete` sur une propriété `readonly`,
  écrit après le dernier `tsc --noEmit` pour satisfaire le lint, a cassé la compilation de deux specs ; les mutations (qui
  rougissaient « COMPILATION ») l'ont vu, après que l'image de preuve était lancée sur le commit fautif. Rejouer `tsc` juste
  avant le commit, et une mutation qui rougit « COMPILATION » partout désigne le code, pas la mutation.
- **(STORY-318)** une mutation qui rend un paramètre inutilisé rougit par `TS6133` (`noUnusedParameters`) : garder le symbole
  lu (`limite !== ''`, `etat.slice(0, 0)`).
- **(STORY-318)** sous Node 25, `npm install` échoue sur le binding natif de Confluent : `npm install --ignore-scripts` pour
  ajouter une dépendance (le verrou s'écrit, l'image Node 24 construit le binding).
- **(STORY-318)** deux répliques du fiscal sur la pile : un service `fiscal-service-b` dans la surcouche (même contexte, cible
  `runtime`, sans port, `depends_on: fiscal-service: service_healthy`) ; sa santé se lit par `docker exec … node -e fetch`.
  Obligations semées par `mongosh --eval` (scripts `s318/semer.js`, `compter.js` du bloc-notes de la session).

- **(STORY-317, 26/11) un fichier qui lit le paquet se cherche dans `*.e2e-spec.ts` et `*.conformite-spec.ts` aussi** : le
  repérage des tests de D qui attendaient `NON_DECLAREE` par `grep … --include=*.spec.ts` a manqué
  `test/remuneration-import.e2e-spec.ts` ; l'e2e Node 24 l'a vu. Chercher dans `src` **et** `test`, tous suffixes.
- **(STORY-317)** un script Python passé par heredoc à `bash` échoue au-delà d'environ 180 lignes (« unexpected EOF ») et
  `runpy` ne lit pas `/dev/stdin` sous Windows : écrire les scripts et leurs paires de remplacement avec l'outil d'écriture.
- **(STORY-317)** `git stash` puis `stash pop` réécrit en CRLF une copie du paquet suivie sans `-text` (`test/fixtures/…`) :
  son empreinte change dans la copie de travail. Recopier l'artefact après un `stash` (l'index et l'archive restent en LF).

- **(STORY-1023, 26/11) l'entrée standard de Python sous Windows est en cp1252** : un script de remplacement qui lit
  ses paires par `json.load(sys.stdin)` depuis un heredoc écrit des accents en mojibake (`âš¡`, `Ã©`). Lire
  `sys.stdin.buffer.read().decode('utf-8')`, ou écrire le script avec l'outil d'écriture ; réparer une ligne par
  `ligne.encode('cp1252').decode('utf-8')`.
- **(STORY-1023)** un DTO Swagger qui HÉRITE d'un autre et y redéclare une propriété (`declare dossierId` sous
  `@ApiProperty`) modifie les métadonnées du parent : le schéma parent est devenu `required: [dossierId]`. Passer par
  `OmitType(Parent, ['champ'])`, qui copie les métadonnées.
- **(STORY-1023)** Ajv sur des corps réels d'e2e : les suites qui doublent leurs services par des objets partiels
  rougissent à bon droit sur le schéma complet ; n'exiger le schéma complet que là où le service est réel, et le seul
  champ visé ailleurs. Ajv a trouvé deux écarts véritables (agrégation, rapprochement) et deux codes que le contrat
  taisait (200 / 201).
- **(STORY-1023)** dans une pile semée à la main, `GET …/cahiers/categories` rend une liste vide : le service ne sème
  ses catégories par défaut que depuis le référentiel du dossier ; semer une catégorie en base pour une preuve.

- **(STORY-1022, 25/11) une mutation `x && false ? {…}` rougit par compilation** : TypeScript réduit la branche à
  `never` et l'accès `x.champ` ne compile plus. Écrire `x && Date.now() < 0` pour une mutation qui doit rougir sur
  l'assertion.
- **(STORY-1022)** sur une pile `grp-c` semée à la main (état publié, KYC, dossier), le **rejet** d'une balance passe
  mais la **validation** rend `403 BALANCE_NOT_ENTITLED` : l'écriture de validation exige aussi le read-model
  d'abonnement. Le semer si une preuve doit valider.

- **(STORY-564, 25/11) le paquet du 24/11 n'était pas dans la source** : la PR du plan du lot 7 a écrit le SMIG, la CNSS et
  `irpp.traitementsSalaires` dans `prospera-stories/referentiels/paquet-fiscal-togo-2026.json`, l'**amorce** (23 Ko), qui
  n'est la copie de personne : rien n'était entré dans `balance-service/scripts/referentiels/sources/` ni dans les
  artefacts. Avant de dire « le paquet porte … », comparer à la **source** de balance, pas à la copie de référence.
- **(STORY-564)** la source du paquet est mise en forme à la main (objets courts sur une ligne) : un `json.dump` la
  reformate entière (3 500 lignes de diff). L'éditer par remplacements textuels ancrés (une occurrence exactement), puis
  `build.mjs`, qui produit l'artefact.
- **(STORY-564)** la garde R4 se contente d'une `source` sur un ancêtre : `irpp.source` couvrait les huit tranches d'un coup.
  Une exigence « élément par élément » demande sa propre règle (R11).

- **(STORY-1021, 25/11) `fetch().text()` retire le BOM UTF-8** : un script de preuve qui vérifie le BOM d'un CSV doit lire
  `arrayBuffer()` et comparer les trois premiers octets (`ef bb bf`) ; sinon il croit le BOM absent.
- **(STORY-1021)** un enregistrement exporté (`_id`, enveloppes Extended JSON) est refusé par `import-c13-demande@1` au
  schéma (`SCHEMA_NON_CONFORME`), avant le contrôle de l'objet : pour éprouver `OBJET_INCONNU`, n'envoyer que des champs
  `^[a-z]…`.
- **(STORY-1021)** la garde STORY-529 (`profil-societe/lecture-profil-par-dossier.spec.ts`) tient une **liste fermée et
  comptée** des fichiers qui nomment `profils_societe` : un plan C13 neuf (export) doit y entrer. Elle n'est pas dans
  `instance-c13/` : jouer **toute** la suite unitaire avant de prendre le verrou pour les e2e, pas seulement les dossiers
  touchés.
- **(STORY-1021)** l'outil d'écriture transforme `\uFEFF` en vrai caractère BOM dans le fichier écrit (un test qui compare un
  CSV porte alors un BOM littéral) : réécrire l'échappement par `chr(92) + 'uFEFF'` en Python, puis vérifier par `grep -c`
  des octets `ef bb bf`.
- **(STORY-1021)** EJSON relaxed rend un `Long` en nombre JS (au-delà de 2^53, la précision se perd) : un test qui attend
  `$numberLong` en relaxed rougit ; seul le mode canonique le garde.

- **(STORY-1019, 25/11) un tour de verrou perdu sur un script de preuve jamais joué** : `createPublicKey(publicKey)` sur
  une clé déjà publique (`generateKeyPairSync` sans encodage rend des `KeyObject`) lève `ERR_CRYPTO_INVALID_KEY_OBJECT_TYPE`
  — `publicKey.export({ format: 'jwk' })` suffit. `node --check` ne le voit pas : jouer le script de preuve (sa partie
  IdP) en local **avant** de prendre le verrou. Le verrou rendu, B et D l'ont repris dans la minute : le tour suivant a
  coûté 27 minutes.
- **(STORY-1019)** une mutation qui retire un décorateur ou un appel laisse un import inutilisé : `ts-jest` rougit par
  compilation (`Tests: 0 total`), ce qui ne prouve rien ; retirer aussi l'import (ou garder le symbole lu, `void x`).
- **(STORY-1019)** un `jest.mock('@confluentinc/kafka-javascript', () => ({ KafkaJS: {} }))` en tête d'un spec permet
  d'éprouver un consommateur sous Node 25 (il n'en lit que le type) ; `EtatConsommateursService` se double par un `Proxy`.

- **(STORY-1020, 25/11) un PDF de pdfkit se relit en WinAnsi, pas en latin1** : le tiret cadratin et l'apostrophe
  typographique y sont `0x97` et `0x92` ; décodés en latin1 (ou par `TextDecoder('windows-1252')` de Node, qui fait
  pareil) ils deviennent des caractères de contrôle et un test croit le texte perdu. Table à la main dans le test.
- **(STORY-1020)** le classeur neutralise toute cellule de texte qui commence par `=`, `+`, `-`, `@` : un libellé de
  rubrique « = Solde… » s'y lit « '= Solde… ». Écrire les rubriques sans ce premier caractère.
- **(STORY-1020)** recopier un paquet SYSCOHADA de bilan-service change aussi ce que des gardes de balance comptent
  (taille du plan dans `referentiel.e2e-spec`, canevas d'inventaire, comptes du poste `BI`) : jouer **toute** la suite
  e2e en Node 24 après une recopie, pas seulement `src/modules/referentiel`.
- **(STORY-1020)** coupure réseau en tenant le verrou : lancer la preuve Docker par **un script autonome** (`nohup`) qui
  prend le verrou par `noclobber`, construit (`npm ci` réessayé : il échoue sur une coupure, `ENOTFOUND`), joue
  unitaires, e2e et build, puis rend le verrou par un `trap EXIT` — une session coupée ne laisse ainsi aucun verrou
  orphelin.

- **(STORY-1101, 25/11) la VM Docker sans DNS** (`lookup registry-1.docker.io: no such host`) : un Dockerfile qui
  commence par `# syntax=docker/dockerfile:1` (le fiscal) ne se construit plus. Retirer la ligne **dans la copie
  archivée** (jamais dans le dépôt) : les couches npm en cache suffisent tant que `package.json` n'a pas changé.
  Démonter d'abord une pile qui monte le dossier archivé (`mongo-fiscal`) avant de le recréer.

- **(STORY-326, 25/11) gate du fiscal** : pas de compose dans son dépôt ; `docker compose -p grp-c -f docker-compose.yml
  -f prospera-recette/docker-compose.fiscal.yml -f <surcouche> --profile fiscal up -d --build balance-service
  fiscal-service`, la surcouche pointant les deux `build.context` sur l'archive de la branche et
  `mongo-fiscal.volumes: !override` sur son dossier `mongo/` ; `BALANCE_SERVICE_URL` à poser. Le paquet fiscal se
  modifie dans **sa source** (`balance-service/scripts/referentiels/sources/`), puis `node
  scripts/referentiels/build.mjs` et l'empreinte au registre : jamais l'artefact à la main. Les suites lentes
  (`export-balance.cout`, `livrable-notes`, `plan-amortissement`) échouent sous la charge d'une suite entière et passent
  seules.

- **(STORY-1100, 24/11) document-service : jouer TOUS les e2e**, pas seulement `test/ged*` : le recensement de
  STORY-695 (`dossier-portee-collaborateur.e2e-spec.ts`) exige que chaque route de `src/` soit classée ; il rougissait
  depuis 1087 sans qu'on le voie. Une route neuve du cabinet s'inscrit dans `PORTEE_DU_CABINET`.
- **(STORY-1100)** comptabilité, `test:socle` dans Docker : les 16 suites passent en ≈ 200 s, puis Jest **ne sort pas**
  (poignées du client Kafka de Confluent) ; lire `docker logs`, puis `docker rm -f`. Le conteneur « tourne » sinon des
  heures en tenant le verrou.
- **(STORY-1100)** document-service, au démarrage d'une pile neuve : 7 consommateurs déjà là journalisent
  « Unknown topic or partition » (leurs topics n'existent pas) et réessaient ; bruit connu, pas une panne. Avertissement
  Swagger « Duplicate DTO `ReceptionDto` » (1088 et un autre module) : à renommer avant de générer les types de FE-143.

- **(STORY-1087, 24/11) document-service au gate** : le port hôte 9001 (console MinIO) est pris sur ce poste par autre
  chose que Docker : surcouche `minio: ports: !reset []`. Sans `kyc-service`, un MinIO neuf n'a pas `kyc-documents` et
  la santé tombe : `mc mb` avec `cgr.dev/chainguard/minio-client:latest-dev` sur le réseau de la pile.
- **(STORY-1087)** L'épingle du manifeste (`src/socle/manifestes/sources-des-manifestes.ts`) se calcule sur les octets
  LF : sur le poste (CRLF), le test d'empreinte rougit ; dans l'image construite depuis `git archive`, il passe.

- **(STORY-1099, 24/11) balance-service** : ses sources sont en CRLF dans le checkout ; un script de remplacement doit
  normaliser `\r\n` en `\n` avant de chercher son motif (sinon « 0 occurrence »), et `eslint --fix` réécrit en LF tout
  un dossier : ne commiter que les fichiers dont `git diff --ignore-cr-at-eol` montre un vrai changement, **par leur nom**.
- **(STORY-1099)** L'invariant STORY-694 (`portee-cabinet.invariant.spec.ts`) tient une **liste fermée** des contrôleurs
  hors `/dossiers/:dossierId` : un contrôleur neuf au niveau du cabinet doit porter `@PorteeDuCabinet()` ET y être
  inscrit.
- **(STORY-1099)** Pas de banc sur vrai MongoDB dans balance : un test `*.mongo.spec.ts` sauté sans `MONGODB_URI_TEST`,
  joué contre un `mongo:7` jetable (`docker run --rm -p 127.0.0.1:27031:27017 mongo:7`), suffit pour l'étanchéité.
- **(STORY-1099)** Poste saturé (≈ 1 Go libre) : une seule construction d'image à la fois ; Mongo jetable, puis image de
  vérification, puis gate, l'un après l'autre.

- **Un schéma de fait avec `required` dans un `then`/`else` sans `properties` est refusé par Ajv strict**
  (`strictRequired`) côté service, pas côté plateforme si son test valide en non strict (vu en 1015) : déclarer les
  propriétés (et les interdire par `false`), et valider le schéma en `strict: true` dans la plateforme.
- **La projection de l'état publié vit dans `socle_etat_publie`** (`etatPublie`), plus dans `socle_etat_des_modules` : une
  boucle d'attente sur l'ancienne collection ne sort jamais ; une pile de preuve doit publier
  `etat-publie.changed.reel` (`module: {code, etat: EN_SERVICE}`, `versionMatrice`, `espace`, `epoque`, `numero`).
- **Un `GEST` sans registre de gestionnaire n'a aucun dossier** (STORY-1004) : dans une preuve, la garantie se décide par
  `RESP` ; un 404 `DOSSIER_INTROUVABLE` n'est pas un défaut de route.
- **`pkill` n'existe pas dans Git Bash** : tuer un script par `ps -ef | grep … | awk '{print $2}'` puis `kill` ; son `trap`
  rend le verrou, mais la pile reste à descendre.

- **La suite complète de `sinistres` en parallèle rougit sur MongoDB quand le poste est chargé** (1010 : 8 puis 29 échecs,
  jamais les mêmes, sur des suites sans rapport avec le code ; les mêmes suites passent seules, 210/210, et la suite
  entière passe en `npx jest -w 2`, 1139/1139). Dans l'étage de vérification, jouer `npx jest -w 2`.

- **Un test d'absence d'argument passe par le défaut du paramètre** (vu en 1012) : `refus(e, undefined)` d'un assistant de test
  à valeur par défaut rend la grille par défaut ; pour éprouver « sans grille », appeler la fonction sans le troisième argument.
- **Une mutation qui rend une variable inutile ne compile plus** (vu en 1012, M2) : `Tests: 0 total` ne prouve rien ; écrire la
  mutation de façon que la variable reste lue (`(c ?? 0) + 3000`).
- **Le manifeste copié a une empreinte notée dans le service** (vu en 1011) : amender le manifeste dans
  `prospera-stories` puis recopier ne suffit pas, `src/socle/manifestes/sources-des-manifestes.ts` porte le commit et le
  sha256 de la source, et `pile-du-moteur.invariant.spec.ts` rougit (Node 24 seulement dans l'étage de vérification) tant
  qu'ils ne suivent pas. Les mettre à jour dans le même commit que la copie.
- **Une suite « sinistres » peut rougir une fois sous charge sans que le code soit en cause** (1011 : la suite du service
  a échoué sur l'export de `dev` pendant que A chargeait le poste, puis passé 190/190 seule ; la même branche avait passé
  deux fois). Relancer le dossier, lire le nom du test avec `●.*›`, ne pas conclure sur le décompte.
- **Les tests qui publient une version de paramètre de plus** modifient l'objet du registre (`FORMULAIRES_D_INSTRUCTION`) :
  toujours dans un `try … finally { delete … }`, sinon la version reste pour les tests suivants.

- **Un constat dérivé d'une liste doit suivre la liste** (vu en 1009) : 999 levait les relances à la sortie de l'attente
  mais laissait `RELANCES_EPUISEES` à vrai ; invisible tant que rien ne ramenait le dossier en attente, il ouvrait le
  classement sans suite dès la première demande de pièces suivante. Recalculer le constat là où la liste change.
- **Un objet reconstruit « champ par champ » perd les champs ajoutés plus tard** : `rejeterLaPiece` ne recopiait que
  trois champs ; le motif de la demande a failli s'y perdre. Retirer ce qui s'efface (`pieceId`, `recueLe`) plutôt que
  recopier ce qu'on garde.
- **Un `e2e` qui charge `gardesGlobalesDeclarees()` lit `AppModule`, donc le client de Confluent : il ne se joue
  qu'en Node 24** (« Could not locate the bindings file » sous Node 25 local). Les unitaires sans Kafka passent en local ;
  le `e2e` se joue dans l'étage `verification`. Une mutation de test se joue en local sur les unitaires.
- **Une mutation qui compare un littéral hors de l'union (`=== 'JAMAIS'`) ne compile pas** (TS2367) : rougir par une
  condition toujours fausse (`Date.now() < 0 && …`) pour que la suite échoue sur l'assertion.

- **Un fait relu sur le banc MongoDB porte son enveloppe d'outbox** (`eventId`, `schemaVersion`…) que le banc mémoire
  n'a pas : comparer un fait publié par `toMatchObject`, jamais par `toEqual` (vu en 1008).
- **Deux passages de la vérification sur `origin/dev` ont rougi sur des tests MongoDB sans rapport** (portée,
  idempotence de 1002, création de 988 : un test différent à chaque fois) pendant que le groupe A chargeait le poste
  (suites à 120–136 s au lieu de 87 s) ; le troisième passage, identique, était vert. Relancer avant de chercher une
  régression, et lire le nom des tests tombés : s'ils changent d'un passage à l'autre, c'est la charge.
- **La garde de portée du dossier précède la garde d'accès d'`assurance`** : sur pile, une route `dossiers/:id/…` d'un
  dossier inconnu rend 404 `DOSSIER_INTROUVABLE`, jamais le refus du gate. Publier un `dossier.created` avant de
  prouver un refus de gate. Et le graphe d'injection (`app.module.injection.spec.ts`) sert une config doublée : tout
  nouveau consommateur qui lit `kafka.*` à la construction doit y être servi.
- **Un fichier copié à l'octet (`src/vendor`) échoue au lint de prettier** : l'ignorer dans eslint, jamais le reformater.
- **Un script de preuve interrompu ne doit pas rendre le verrou d'un autre** : le `trap` ne s'arme qu'après la prise.

- **Un e2e peut rougir une fois sous charge et se montrer vert ensuite** (`liaison-assureur`, `echange.e2e-spec.ts`,
  12 échecs dans l'étage de vérification, jamais reproduits ni en isolé ni en suite). Avant de chercher une
  régression, rejouer le fichier seul, puis la suite, puis la séquence complète de la preuve.
- **`fetch` réutilise une connexion que le serveur a fermée** (`SocketError: other side closed`) après une pause de
  12 s entre deux appels de la preuve : demander `connection: close` et réessayer ; ce n'est pas un défaut du service.
- **Le lint d'un dépôt peut être rouge sur `dev` depuis avant ta story** (`document-service`) : l'exporter et le
  vérifier avant de croire à une régression.
- **L'étiquette d'image Docker doit être en minuscules** (`grp-c-…-doc-MNV` refusée) ; un shell qui dépasse 180 s
  passe en arrière-plan, la sortie se lit alors dans son fichier.

- **`git archive` applique `core.autocrlf`** : l'export d'un dépôt Windows sort en CRLF (65 354 erreurs de lint, et
  les empreintes des référentiels embarqués fausses). Toujours `git -c core.autocrlf=false archive`.
- **`prettier --write` sur tout `src/` réécrit les fins de ligne de tous les fichiers** du dépôt `assurance` (CRLF de
  la copie de travail → LF) : sans changement de contenu, `git add` ne les retient pas, mais `git status` les montre
  tous ; ne formater que les fichiers touchés.
- **Trois images construites en parallèle par `docker compose up --build`** : BuildKit tombe (« frontend grpc server
  closed unexpectedly »). Construire service par service, puis `up`.

- **`prettier --write src` reformate aussi les `.json`** : il a cassé les copies à l'octet du contrat d'échange. Ne le
  passer que sur `"src/**/*.ts"`.
- **Le générateur de barrels de l'éditeur modifie aussi des `index.ts` SUIVIS** (dans `prospera-plateforme` : ceux de
  B, `bibliotheques/kit-cible/`, `paquets/point-de-decision/`) : vérifier `git status` avant chaque commit et restaurer
  ce qui n'est pas à soi.
- **Un dossier neuf à la racine d'un service (`contrat/`, `scripts/`) doit entrer dans l'étage `verification` du
  Dockerfile**, sinon ses tests ne s'y jouent pas (« suite failed to run » noyé dans un total vert).
- **L'IdP de test réécrit son jeton à chaque démarrage** : le lire APRÈS avoir levé la pile.

- **BullMQ 6.7 ne joint pas Redis si `ioredis` n'est pas déclaré** dans `package.json` (« could not load the optional
  'ioredis' package ») : les tests en mémoire passent, le service ne joint jamais Redis. Seul un banc sur un vrai Redis
  le voit.

- **`docker exec … /opt/kafka/bin/…` depuis Git Bash** : le chemin est réécrit en `C:/Program Files/Git/opt/…`.
  Préfixer `MSYS_NO_PATHCONV=1`.
- **Sur une pile neuve, le consommateur journalise « Unknown topic or partition » une fois**, juste après avoir créé
  `entitlement.changed` : c'est sa relance, pas une panne ; le droit est projeté quelques secondes plus tard
  (STORY-990). Une preuve qui publie un droit doit **attendre la projection** avant d'appeler une route gardée.

- **Un renommage en masse touche aussi les copies à l'octet.** Un `sed` `assurance-service` → `sinistres-service` sur
  `src/` a modifié la copie d'un manifeste ; le test d'empreinte l'a vu. Recopier depuis le blob :
  `git -c core.autocrlf=false show origin/main:manifestes/<code>.manifest.ts > src/modules/<code>/module.manifest.ts`.
- **Le générateur de « barrels » de l'éditeur** recrée des `index.ts` dans le dépôt neuf à chaque passage (huit à la
  fois) : les supprimer avant chaque `tsc`, chaque build d'image et chaque commit.
- **Un heredoc mange les antislashs** d'un `package.json` (`".*\\.spec\\.ts$"` devient invalide) : écrire ces fichiers
  avec l'outil d'écriture, pas en shell.
- **Le client de Confluent sur ce poste** : `npm install --ignore-scripts` suffit au typage, au lint et au build ; les
  tests se jouent dans le stage `verification` (Node 24), en montant `src/` et `test/` pour éviter de reconstruire.
- **Un consommateur sur une pile neuve** : le topic `entitlement.changed` n'existe qu'au premier message, et le groupe
  ne le découvre qu'à la relecture des métadonnées (environ 4 minutes mesurées). Attendre avant de conclure.
- **Une route absente rend 404 avant toute garde** : le refus d'écriture en lecture seule ne se prouve en e2e qu'avec
  une vraie route d'écriture ; en attendant, il est prouvé sur la garde.
- **`git archive` sous `core.autocrlf=true` sort les fichiers en CRLF**, même quand l'index est en LF (`git ls-files
  --eol` : `i/lf`). Pour construire une image de vérification fidèle : `git -c core.autocrlf=false archive HEAD | tar -x`.
  Sinon les empreintes des artefacts JSON sont fausses et le lint compte des dizaines de milliers d'erreurs.
- **`git checkout -- <fichier>` ne réécrit pas un fichier qu'il croit intact** : pour ramener les artefacts en LF dans
  le checkout, les SUPPRIMER puis `git -c core.autocrlf=false checkout -- <dossier>`.
- **Une mutation qui rend un import ou une variable inutilisés rougit par erreur de compilation** (`noUnusedLocals`),
  ce qui ne prouve rien : retirer aussi l'import, ou garder la variable lue.
- **⛔ Le client de Confluent ne crée pas un topic en s'y abonnant** (`kafkajs` le faisait ; `allowAutoTopicCreation`
  vaut pourtant `true` par défaut dans sa couche KafkaJS, et le broker l'autorise). Un topic créé ensuite par son
  producteur n'est vu qu'au rafraîchissement des métadonnées : **5 minutes**. Sur une pile neuve, un read-model rate
  donc les premiers faits : la recette de l'Atelier a rendu 502 (404 « Dossier introuvable »). Les « environ 4
  minutes » relevés en STORY-980 étaient ce même défaut, à tort rangé en simple attente.
  **⛔ Créer le topic ne suffit pas** (STORY-990) : abonné à un topic à peine créé, sans leader encore, le client
  prend « Unknown topic or partition » et attend encore 5 minutes. Mesuré : **291 s** avec `createTopics` seul,
  **6,9 s** en ajoutant `metadataMaxAge: 10_000` au consommateur. Il faut les deux. **Pour B** : même correctif pour
  le catalogue, paiement et notification.
- **Une recette verte ne mesure pas une latence** : la mise en place de la recette dure plus de 5 minutes, donc elle
  passe APRÈS le rafraîchissement des métadonnées et masque ce défaut. Mesurer la latence à part, chronomètre en main,
  sur pile neuve.
- **Une recette sur pile neuve se joue d'un bout à l'autre** : la même recette sur une pile déjà servie passait (les
  topics existaient). Ne conclure qu'avec des volumes neufs.
- **Karapace, juste après son démarrage**, répond 500 « Error while forwarding the request to the master » le temps
  d'élire son maître, même `healthy` : relancer quelques secondes.
- **Docker sous Git Bash** : `docker exec … /opt/kafka/bin/…` est réécrit en `C:/Program Files/Git/opt/…` ; préfixer
  `MSYS_NO_PATHCONV=1`.
- **Le client de Confluent ne crashe pas sur un `eachMessage` qui lève** : il journalise et relit le même message
  (`lib/kafkajs/_consumer.js`). La santé d'un consommateur bloqué se mesure donc aux échecs consécutifs par partition.
- **Un e2e qui pose un dossier directement dans le dépôt doit lui donner une déclaration COMPLÈTE** (STORY-1013) : `vueDeLaDeclaration` fait `new Date(recueLe).toISOString()`, qui lève sur une date absente ; la route rend 500 alors que le service a écrit. Poser `canal`, `typeSinistre`, `recueLe` et `saisieLe`, pas seulement le type.
- **Un motif de test de « 10 caractères au moins » : compter** (STORY-1013) : `trop court` en fait dix et passe ; écrire `trop bref` pour un refus.
- **La suite unitaire de `sinistres` sur MongoDB réel rougit au hasard quand elle tourne en parallèle sur un poste chargé** (STORY-1018 : 5 échecs sur `dossiers.service.spec` en `-w 2`, tests sans rapport ; la même suite seule, `-w 1`, passe 214/214). Rejouer le fichier rouge seul avant de chercher un défaut.
- **Un script de vérification Docker lancé avant une pause de verrou se tue en `kill -9`** : son `trap` supprimerait le verrou d'un autre groupe (STORY-1018).
- **Une regex JS avec `\b` ne voit pas « à »** (STORY-1017) : `\b` est ASCII même avec `u`. Pour une préposition accentuée, `(?<![\p{L}\d])`.
- **Une espace insécable littérale dans une regex fait rougir `no-irregular-whitespace`** (STORY-1017) : écrire `\u00a0\u202f` ; vérifier par `cat -A` (un `\u00a0` dans une chaîne Python non brute remet le caractère).
- **Le checkout `prospera-sinistres-service` porte une autre branche : ne pas y lancer `docker compose up`** (STORY-1017) : exporter la branche par `git archive` et lancer le compose depuis l'export (`COMPOSE_PROJECT_NAME=grp-c-<n>`).
- **Les deux invariants `app.module` / `app-cablage` ne tournent qu'en Node 24** (client Kafka natif) : 5 échecs attendus sous Node 25, verts dans l'image `verification`.
- **Git Bash convertit `-w /w` en `W:/`** (STORY-1016) : `export MSYS_NO_PATHCONV=1` avant un `docker run -v … -w /w`.
- **Un test du banc MongoDB peut rougir au hasard dans la suite complète** (STORY-1003, « réaffecté reste partie », 1016) : le
  fichier rejoué seul en `-w 1` passe (238/238) ; ne pas corriger le code d'une autre story sur ce seul signal.
- **L'outil coupe à 180 s et passe la commande en arrière-plan** (1016) : lancer les scripts de vérification avec
  `run_in_background`, redirigés dans un fichier, et attendre leur notification ; ne jamais enchaîner des `sleep`.
