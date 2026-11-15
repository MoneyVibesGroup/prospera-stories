# STORY-933 : Redis, BullMQ et le verrou d'outbox du catalogue

Status: done

**Complexité :** moyenne (une file, un travailleur, un verrou ; aucun état publié calculé)

**Épic :** EPIC-142 (un contrat d'état publié stable, et un socle prêt pour le moteur)
**Dépôts :** `MoneyVibesGroup/prospera-platform-catalog-service`, `MoneyVibesGroup/prospera-recette`
**Plage :** groupe B, n° 4 du lot de B (`coordination/PLAN-4-SESSIONS-2026-11-14.md` §4).

---

## Pourquoi

La spine du moteur (AD-42) mesure un catalogue « sans Redis ni BullMQ ; outbox à `setInterval`, mono-instance », et le
change : **Redis et BullMQ entrent au catalogue ; l'outbox prend un verrou**. AD-6 fixe le rôle de BullMQ : **émettre**
`etat-publie.changed` à l'heure dite, jamais calculer un état ; l'état se calcule à la lecture, depuis le port
`HorlogeDeReference`. Les tâches manquées pendant un arrêt sont rejouées au redémarrage.

## Ce qui doit être vrai à la fin (plan §4, n° 4)

| Exigence | Fait |
|---|---|
| Redis et BullMQ dans le catalogue | oui : BullMQ 6.7.6, `@nestjs/bullmq` 11.0.5 (peer BullMQ 6), `ioredis` ; Redis entre dans `/health` |
| BullMQ émet à l'heure dite, il ne calcule jamais un état | oui : le travailleur relit l'heure de référence et remet la tâche au déclencheur ; il ne lit aucun droit |
| L'outbox prend un verrou | oui : un bail MongoDB, exclusif entre instances, prolongé avant chaque publication |

## Ce qui a été livré

1. **`src/echeances/`** :
   - `HorlogeDeReference` (port, AD-6) et `HorlogeDeLaPlateforme` (horloge de Money Vibes). Sur site, `GET /heure` de
     l'agent arrive avec EPIC-148 ;
   - `cleDeTache` : la clef d'AD-6 (`<organisationId>:<module>:<transition>:<date>:<epoque>`, et
     `<organisationId>:<module>:<interrupteur>:<date>`) ;
   - `PlanificateurDEcheances` : `planifier` (idempotent sur la clef), `recalculer` (retirer les tâches en attente du
     module, poser les nouvelles), `annulerAvantEpoque`, `annulerPour`. Le délai se compte sur l'heure de référence ;
   - `EcheancesProcessor` :
     - heure **indisponible** : rien ne tombe, la tâche est relue plus tard ;
     - heure de référence **pas encore à la date** : la tâche est reportée du temps qui reste ;
     - à la date : la tâche est remise au `DeclencheurDeTransition`.
   - `DeclencheurEnAttenteDuCalcul` : **amorce** jusqu'à STORY-936. Rien ne planifie encore ; une tâche tombée serait
     journalisée sans rien émettre.
2. **Le verrou d'outbox** (`VerrouDuRelais`, collection `verrous`) : bail pris à chaque tick (libre, échu ou déjà à soi),
   prolongé avant chaque publication, rendu en fin de lot ; un relais qui l'a perdu s'arrête au milieu de son lot.
3. **Santé** : indicateur Redis (un aller-retour par la file, borné à 3 s).
4. **`npm run test:socle`** (`test/socle.integration-spec.ts`), contre un vrai Redis et un vrai MongoDB.
5. **Recette** : `depends_on: redis` du catalogue dans `docker-compose.recette.yml` (recette #18).

## Preuves

- `docker build --target verification` (Node 24) : **1098/1098**.
- `test:socle` : **7/7**. Le test couvre :
  - l'idempotence ;
  - une tâche échue pendant l'arrêt, qui tombe au redémarrage du travailleur ;
  - une tâche sortie avant l'heure de référence, reportée puis émise une seule fois ;
  - le recalcul ;
  - un bail exclusif entre deux relais concurrents ;
  - un bail rendu puis repris ;
  - un bail échu repris.
- **Mutation** : un travailleur qui ne relit plus l'heure fait rougir le test du report. Une première version de ce
  test laissait survivre la mutation, parce que le planificateur retardait déjà la tâche ; le test est corrigé.
- `docker compose up` (pile `grp-b`, image de la branche) :
  - le catalogue démarre `healthy` (mongodb, kafka et redis `up`) ;
  - Redis arrêté met la santé en **503** (`redis down`), relancé la remet à **200** ;
  - le document `verrous/outbox-relais` est pris puis rendu.

## Décisions

- **D-933-1 — Le verrou de l'outbox vit dans MongoDB, pas dans Redis.** L'outbox publie `entitlement.changed` depuis
  STORY-034 ; elle ne doit pas s'arrêter avec Redis, qui ne porte que des tâches. Un bail dans la base de l'outbox
  n'ajoute aucune panne au chemin du droit.
- **D-933-2 — Un verrou global, pas une réservation par événement.** Réserver les événements un à un
  (`PENDING → PROCESSING`) laisserait deux relais publier deux événements d'une même organisation dans le désordre. Or
  les messages sont des états absolus, et leur ordre compte.
- **D-933-3 — L'identifiant BullMQ est la clef, `:` remplacé par `|`.** BullMQ 6 refuse un identifiant contenant `:`
  (`Custom Id cannot contain :`), et la clef d'AD-6 en porte, la date aussi. La clef d'origine voyage dans les données de
  la tâche.
- **D-933-4 — Une tâche tombée reste connue 7 jours.** La replanifier à l'identique ne la rejoue donc pas.
- **D-933-5 — Le travailleur relit l'heure à l'échéance.** BullMQ compte ses délais sur l'horloge de Redis ; seule
  l'heure de référence décide (AD-6). `Date.now()` ne sert qu'au minuteur de `moveToDelayed` (convention « Temps »).

## Suite

- STORY-936 : le vrai déclencheur. Il recalcule l'état publié à la lecture et publie `etat-publie.changed` par l'outbox
  s'il a changé. Il pose aussi les tâches à chaque changement de fait.
