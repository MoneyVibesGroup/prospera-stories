# STORY-1071 : la mission d'expertise — sa machine d'états unique, et l'évaluation qui attend qu'elle soit close

Status: in-progress

**Épic :** EPIC-208 (les experts et les missions d'expertise) ; **FR-61** (la mission a sa propre machine d'états ;
`EXPERTISE_VALIDEE`), FR-62 (désigner, décliner), FR-67 (un complément non revenu bloque la validation), FR-68 (délai de
rapport par domaine), FR-75 (l'évaluation pré-remplie par le chiffrage validé de l'expertise ; motif s'il diffère) ·
**Dépôts :** `prospera-sinistres-service` (modules `expertises` et `sinistres`), `prospera-plateforme`
(`contrats/assurance/expertises/`, `classification-sante/`, par `_wt-d-plateforme`) · **Plage :** groupe D, n° 7 du lot 6
(`PLAN-LOT-6-2026-11-23.md` §6), quatrième et dernière story d'assurance de D (D-L6-3), **dernière du lot 6 de D**.
**Dépend de :** STORY-1014 (le référentiel des experts et `exigerDesignable`), 1013 (l'arrêt de l'évaluation), 988 (la
machine du dossier, transition 7), 1001 (le patron d'un fait d'un autre module appliqué au dossier par le système), 991
(l'outbox), livrées par C ; 1068 (le patron du consommateur), 1069 (le patron d'un fait neuf au contrat), 1070 (D).
**Suivante :** aucune dans le lot 6 (« Le lot 6 de D est fini ») ; STORY-1072 est placée hors du lot (la demande de B,
STORY-1103).

**Sources :** la remplaçante du plan de C (« la mission d'expertise et sa machine d'états, FR-61 ») ; PRD FR-61, FR-62,
FR-66, FR-67, FR-68, FR-75, FR-136 (`EXPERTISE_VALIDEE`) ; annexe A (M29, C3) ; spine assurance AD-2 (`expertises` est
seul écrivain de la mission), AD-3 (un module n'importe jamais son voisin), AD-8 (santé), **AD-16** (le catalogue :
`expertises.mission.changed@1` publié par `expertises`, **consommé par `sinistres`**) ; manifestes `expertises` (C5
`publie`, C7 droits, `routesLectureSeule` : `GET /api/v1/expertises/missions` et `/{id}` déjà déclarées) et `sinistres`
(C5 `consomme` : `expertises.mission.changed@1` déjà déclaré) ; table des transitions du dossier (transition 7 :
`EXPERTISE_VALIDEE`) ; fiches 1013, 1014, 1018, 1069, 1070 (**D-1070-11** : « le chiffrage de l'expertise comme repère du
motif ») ; journal de C (« pour la story de désignation (FR-61) : appeler `ExpertsService.exigerDesignable` »).

## « Fini quand » (D-1071-1)

Le plan du lot 6 ne le fixe pas (§6, ligne 7). Retenu : **une mission d'expertise se crée sur un dossier (`A_DESIGNER`)
et suit sa machine unique, écrite en données (`machine-des-missions-2026.1.json`), jusqu'à `VALIDEE`, `ARBITREE` ou
`ANNULEE`, par des actes gardés par rôle (hors graphe : `TRANSITION_MISSION_INTERDITE`) ; la désignation est jugée par
le référentiel des experts (1014) ; chaque acte accepté publie `expertises.mission.changed@1` dans sa transaction (schéma
de la plateforme, fermé, chaque champ classé) ; `sinistres` le lit et le range au dossier : **une mission ouverte refuse
l'arrêt de l'évaluation et la transition 7 (`EXPERTISE_VALIDEE`, la mission nommée), un dossier sans mission n'est plus
bloqué, et le chiffrage validé par l'expertise devient le repère du montant arrêté** (motif s'il diffère) ; prouvé sous
Node 24 (suite unitaire complète d'un trait sur MongoDB et Redis réels, e2e) et sur une pile `grp-d` (Kafka, Karapace :
le fait relu au schéma du registre, l'arrêt refusé puis accepté), rejoué sur l'image d'`origin/dev`.**

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | ⛔ **Une seule machine, en données** : treize états (`SUGGEREE → A_DESIGNER → EXPERT_DESIGNE → ACCEPTEE → [TRANSMISE] → EN_COURS → RAPPORT_ATTENDU → RAPPORT_RECU → [COMPLEMENT_DEMANDE] → VALIDEE`, `CONTESTEE → ARBITREE`, `ANNULEE`) et treize actes, chacun avec ses états de départ, son état d'arrivée et ses rôles ; un acte hors graphe : 409 `TRANSITION_MISSION_INTERDITE` (détails : l'état et les actes permis) ; un rôle hors de l'acte : 403 `DROIT_INSUFFISANT` | spec pure (table, empreinte) ; mutations |
| AC-2 | ⛔ **Créer, désigner, décliner** : `POST /api/v1/expertises/missions` (GEST, RESP) crée une mission `A_DESIGNER` (domaine, type, priorité, objet, points à traiter, éléments à examiner) ; `DESIGNER` appelle `exigerDesignable` (`AGREMENT_ECHU`, `AGREMENT_ABSENT`, `EXPERT_INACTIF`, `DOMAINE_NON_COUVERT`) ; un expert qui a décliné cette mission : 409 `EXPERT_NON_ELIGIBLE` ; un interne sur une contre-expertise ou une expertise contradictoire : 409 `EXPERTISE_EXTERNE_IMPOSEE` ; `DECLINER` (motif) ramène à `A_DESIGNER`, le refus conservé | spec pure ; spec de service (mémoire et MongoDB réel) ; mutations |
| AC-3 | ⛔ **Les actes de l'expert** (`ACCEPTER`, `DECLINER`, `COMMENCER`, `EXAMINER`, `DEPOSER_RAPPORT`) : par le compte de l'expert désigné (EXPI, EXPE) ; pour un expert sans compte, par GEST ou RESP, marqués « saisi pour le cabinet » ; un autre compte : 403 `HORS_MISSION`. `ACCEPTER` fixe le rapport attendu (délai du domaine, FR-68) ; `TRANSMISE` n'existe que pour un externe (un interne commence dès l'acceptation, un externe après la transmission) ; un rapport se dépose avec sa pièce (`pieceId`, `versionPiece` : `PIECE_JOINTE_OBLIGATOIRE`) et un chiffrage facultatif au franc ; chaque version est gardée | spec pure ; spec de service |
| AC-4 | ⛔ **Toute décision sur un rapport est humaine et motivée** : `VALIDER`, `DEMANDER_COMPLEMENT`, `CONTESTER` (GEST, RESP), `ARBITRER` (RESP, DG, DT ; `CONFIRME_EXPERT_INITIAL`, `CONFIRME_CONTRE_EXPERT`, `TRANSACTION`), `ANNULER` (GEST, RESP) : motif ≥ 10 caractères (`MOTIF_ECRIT`) ; valider un complément non revenu : 409 `COMPLEMENT_EXPERT_RECU` ; la mission validée retient le chiffrage du dernier rapport, l'arbitrage le sien | spec pure ; spec de service ; mutations |
| AC-5 | **Une commande comme les autres** : version + 1, historique des actes (acte, auteur, rôle, motif, le), rejeu par la clé (même corps : même réponse, rien d'écrit ; autre corps : `CLE_REUTILISEE`), version périmée : `ETAT_PERIME` ; `GET …/missions?dossierId=` et `GET …/missions/{id}` (EXPI et EXPE ne voient que leurs missions) | spec de service (mémoire et MongoDB réel) ; e2e |
| AC-6 | ⛔ **Le fait au contrat** : `contrats/assurance/expertises/mission.changed.schema.json` (fermé, chaque champ classé au registre, module `expertises`) ; publié dans la transaction de chaque acte accepté (rien pour un refus ou un rejeu) ; ni le domaine, ni l'objet, ni un motif, ni l'expert nommé ne voyagent | tests de contrat de la plateforme ; invariant de fait du service ; spec de service |
| AC-7 | ⛔ **`sinistres` lit le fait** : groupe `sinistres-service.missions` (topic créé avant l'abonnement, métadonnées à 10 s) ; la plus haute version par mission, rangée au dossier par une commande du système (piste `MISSION_CHANGEE`) ; un fait illisible, hors contrat, d'un dossier inconnu ou plus ancien : sans effet | spec du consommateur ; spec de service ; mutations |
| AC-8 | ⛔ **L'évaluation attend l'expertise** : `POST …/evaluations` et la transition 7 refusent tant qu'une mission n'est ni `VALIDEE`, ni `ARBITREE`, ni `ANNULEE` (409 `EXPERTISE_VALIDEE` ; détails : les missions en attente et leur état) ; **un dossier sans mission n'est plus bloqué** ; avec un chiffrage validé, c'est lui le repère : un montant arrêté qui en diffère exige un motif (`MOTIF_ECRIT`, détails : `chiffrageDExpertise`), et l'évaluation copie le repère | spec pure ; spec de service ; mutations |
| AC-9 | Node 24 (étage `verification`) : lint, suite unitaire complète d'un trait sur MongoDB et Redis réels, e2e, build ; plateforme sous Node 24 ; pile `grp-d` : `docker compose up` sain, pilote vert, rejoué sur l'image d'`origin/dev` | « Preuves » |

## Décisions retenues par défaut (contestables)

- **D-1071-1 — « Fini quand »** : ci-dessus (le plan ne le fixe pas).
- **D-1071-2 — La machine est une donnée** (`expertises/missions/machine-des-missions-2026.1.json`, empreinte figée par
  le test) : états, actes (départs, arrivée, rôles, motif exigé, acte de l'expert), délais de rapport par domaine (FR-68 :
  7, 21, 14, 30, 21, 14, 21, 30 jours), types, priorités, voies de transmission, décisions d'arbitrage. Une mission garde
  la version de la table qui l'a créée. Une route d'écriture par acte serait treize routes : **une seule**,
  `POST /api/v1/expertises/missions/{id}/actes` (`{ acte, versionLue, roleExerce, cleIdempotence, … }`), plus la
  création. Les deux lectures sont celles que le manifeste déclarait déjà : **aucun manifeste ne change**.
- **D-1071-3 — Les rôles** : créer, désigner, transmettre, valider, demander un complément, contester, annuler : GEST,
  RESP (FR-62 : « le gestionnaire ou le responsable ») ; arbitrer : RESP, DG, DT (FR-66) ; les actes de l'expert : le
  compte désigné (EXPI, EXPE), ou GEST, RESP pour un expert sans compte (FR-67, « saisi pour le cabinet »). Le rôle
  exercé se donne (`roleExerce`) comme au référentiel (1014). `SUGGEREE` est l'état d'une proposition de l'IA (FR-58) :
  la table le porte (`CONFIRMER` → `A_DESIGNER`), aucune route ne le crée encore.
- **D-1071-4 — La désignation juge l'expert au jour de l'acte** par `ExpertsService.exigerDesignable` (même module) et
  fige sur la mission ce qu'il en faut (`expertId`, nature, nom, compte) ; un expert qui a décliné n'est plus désignable
  pour cette mission (`EXPERT_NON_ELIGIBLE`, FR-62) ; l'externe est imposé pour `CONTRADICTOIRE` et `CONTRE_EXPERTISE`
  (`EXPERTISE_EXTERNE_IMPOSEE`, FR-59, FR-62). Les seuils d'honoraires ou d'enjeu (validation du `RESP`, externe
  au-delà de 3 000 000) attendent l'enjeu du dossier : reste.
- **D-1071-5 — La mission médicale n'est pas servie par cette story** (409 `MISSION_MEDICALE_NON_SERVIE`) : ses
  sous-étapes (FR-63), ses rôles de santé (`MED`, `expertises:sante:consulter`) et son contenu (AD-8) sont une story à
  eux. Ainsi aucune donnée de santé n'entre dans la mission ni dans son fait.
- **D-1071-6 — Un rapport est une pièce de `ged`** (AD-2) : la mission n'en garde que `pieceId` et `versionPiece`, le
  chiffrage (francs entiers, facultatif) et la marque « saisi pour le cabinet » ; chaque dépôt est une version de plus,
  l'ancienne n'est pas écrasée (FR-67). Le dépôt du fichier dans `ged` par la mission est un reste.
- **D-1071-7 — Le fait `expertises.mission.changed@1` porte un état absolu sans texte** : `missionId`, `dossierId`,
  `versionObjet` (la version de la mission), `etat`, `type`, `bloquante` (ni `VALIDEE`, ni `ARBITREE`, ni `ANNULEE`),
  `chiffrage` et `devise` (seulement validée ou arbitrée avec un chiffrage), `changeeLe`. **Ni le domaine** (un domaine
  médical dirait la nature corporelle, D-1069-4), ni l'objet, les points, un motif (texte libre, AD-16), ni l'expert
  nommé. Clé : l'organisation (comme tous les faits du service). L'outbox du service sert les deux modules (code commun) :
  `topics.ts` gagne le topic d'`expertises`, l'invariant vérifie chaque topic au manifeste de son module.
- **D-1071-8 — `sinistres` range les missions au dossier** (`missions` : l'état lu de chacune, plus haute version) par
  une commande du système, comme une pièce contrôlée de `ged` (1001) : version + 1, piste `MISSION_CHANGEE`,
  `dossier.changed@1`. **`EXPERTISE_VALIDEE` devient une condition calculée** par la machine du dossier (`CONDITIONS_CALCULEES`)
  sur ces missions — elle n'était un constat posé par personne : la transition 7 était refusée à tout dossier (échec
  fermé). FR-61 : « un dossier sans mission n'est pas bloqué ». L'arrêt de l'évaluation la juge aussi, et nomme les
  missions en attente. Entre un acte et sa lecture (quelques secondes sur le fil), l'arrêt voit l'état d'avant : résidu
  nommé, la transition 7 le rejuge.
- **D-1071-9 — Le repère du montant arrêté** (FR-75, D-1070-11) : avec au moins une mission validée ou arbitrée qui porte
  un chiffrage, le repère est **la somme de ces chiffrages** ; il remplace les deux montants « conformes » du décompte
  (D-1018-1) : un montant qui en diffère se motive. L'évaluation le copie (`chiffrageDExpertise`). Sans chiffrage, la
  règle de 1018 ne change pas.
- **D-1071-10 — La contre-expertise qui crée sa mission (FR-66) n'est pas dans cette story** : `ARBITRER` tranche avec
  une décision et un motif (et un chiffrage pour `TRANSACTION` ou `CONFIRME_CONTRE_EXPERT`) ; ouvrir la mission de
  contre-expertise et ses interdits (`CONTRE_EXPERTISE_NON_AUTORISEE`) est un reste.
- **D-1071-11 — La mission ne vérifie pas encore son dossier** : `expertises` ne consomme pas encore
  `sinistres.dossier.changed@1` (spine AD-16) ; le `dossierId` est celui donné. Un dossier inconnu de `sinistres` ignore
  le fait (sans effet) ; la portée de l'agent sur le dossier (AD-26) viendra avec ce consommateur : reste.

## Contrat annoncé avant le code

Voir le journal de D, « ⚠ Contrats » (2026-11-24, STORY-1071).

## Où en est-on (pour une reprise après interruption)

- [x] Rituel : plan, règles, journaux de A, B, C, D (une demande neuve de B à D : STORY-1103, placée en 1072) ; fiches
  1013, 1014, 1068 → 1070 ; FR-61 → 68, FR-75.
- [ ] Plateforme : schéma et registre (`MNV-1071`).
- [ ] Code : `prospera-sinistres-service` `MNV-1071`.
- [ ] Preuves sans Docker (Node 25) ; annonce fusionnée avant le code.
- [ ] Sous le verrou : Node 24, pile `grp-d`, mutations.
- [ ] PR de code fusionnées ; rejeu sur `origin/dev` ; PR de docs finale.
