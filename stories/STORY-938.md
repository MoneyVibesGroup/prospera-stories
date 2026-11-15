# STORY-938 : `auth-service` pour le moteur

Status: done

**Complexité :** moyenne (un format, un catalogue, une règle, une route interne)

**Épics :** EPIC-142 (socle prêt pour le moteur), EPIC-264
**Dépôts :** `MoneyVibesGroup/prospera-auth-service`, `MoneyVibesGroup/prospera-recette`
**Plage :** groupe B, n° 9 du lot de B (`coordination/PLAN-4-SESSIONS-2026-11-14.md` §4). Faite après la passation
d'`auth-service` par A (`456035f`).

---

## Pourquoi

« `auth-service` : route interne de naissance d'organisation à identifiant imposé, réservée à l'identité de service
du moteur, idempotente sur cet identifiant, sans utilisateur ; publie `identity.org.created` (AD-15) ; format de
droit élargi aux codes de module à tiret ; le droit de consentir attribuable par le DG seul
(`CONSENTEMENT_RESERVE_AU_DG`) » (EPIC-142). S'y ajoutent la demande de A (regex à tiret dans les trois segments) et
la décision d'architecture « droits hors du jeton », à écrire au plus tard avec cette story.

## Ce qui doit être vrai à la fin (plan §4, n° 9)

| Exigence | Fait |
|---|---|
| Droits à tiret | oui : `^[a-z]+(-[a-z]+)*:[a-z]+(-[a-z]+)*:[a-z]+(-[a-z]+)*$`, testé sur des codes réels des manifestes |
| Route interne de naissance, idempotente, réservée à l'identité de service du moteur | oui : `POST /api/v1/interne/organisations` |
| Droit de consentir réservé au DG | oui : 403 `CONSENTEMENT_RESERVE_AU_DG` |
| Décision « droits hors du jeton » | oui : `architecture/decisions/ADR-droits-hors-du-jeton-2026-11-15.md` |

## Ce qui a été livré

1. **Le format des droits** : le tiret est permis dans les trois segments, entre deux lettres. Un tiret au bord ou
   doublé reste refusé.
2. **Huit droits `instance:*`** au catalogue de tenant, identiques à l'octet au manifeste du module `instance`
   (STORY-935) :
   - ils sont **hors souscription** (FR-35 : le module `instance` est hors intersection, il naît avec l'organisation) ;
   - le catalogue passe à **24 codes**.
3. **Le droit de consentir** : `exigerLeDGPourConsentir` refuse, pour qui n'est pas le DG, tout geste qui fait gagner
   `instance:consentement:donner` :
   - la création ou la modification d'un rôle ;
   - la surcharge d'un rôle du socle ;
   - l'attribution d'un rôle à un membre.

   Le DG est `organization.dirigeantId` (nouveau champ, posé par le moteur) ; à défaut, le fondateur.
4. **La naissance d'une organisation** (`src/modules/naissance/`) :
   - garde `JetonDuMoteurGuard` : jeton de service `MOTEUR_JETON_SERVICE`, 32 caractères au moins, comparé par
     empreinte en temps constant ; non configuré, la route refuse tout ;
   - **idempotente** : une organisation existante est rendue telle quelle (200), et l'index unique tranche une course
     entre deux appels ;
   - l'organisation naît **sans utilisateur** : `createdBy` devient facultatif, et le choix de l'administrateur
     principal tolère une organisation sans fondateur ;
   - le vertical est contrôlé par le référentiel des verticaux ;
   - `identity.org.created` part dans la même transaction, avec `origine: 'MOTEUR'` et **sans `createdByUserId`**.
5. **Recette** : `MOTEUR_JETON_SERVICE` (valeur de recette) dans `docker-compose.recette.yml`.

## Preuves

- `auth-service` : **1267/1267**. Tests ajoutés :
  - format à tiret ;
  - 24 codes, et les 8 droits `instance:*` disponibles sans souscription ;
  - refus `CONSENTEMENT_RESERVE_AU_DG` pour qui n'est pas le DG, passage pour le DG ;
  - garde du jeton : bon jeton, mauvais jeton, aucun jeton, autre schéma, non configuré ;
  - naissance : identifiant imposé, sans utilisateur, rejeu, course, vertical inconnu.
- **Pile `grp-b`**, image de la branche :
  - naissance **201**, puis **200** au rejeu ;
  - **401** `IDENTITE_DU_MOTEUR_REQUISE` sans jeton ;
  - **400** `VERTICAL_INCONNU` ;
  - **un seul** `identity.org.created` pour deux appels (`origine: MOTEUR`, sans `createdByUserId`) ;
  - l'organisation est rangée sans fondateur.

## Décisions

- **D-938-1 — Un jeton de service partagé** pour l'identité du moteur, sur le patron des jetons de service de
  notification (STORY-610). Les identités de service émises par `auth-service`, limitées à une organisation (contrat
  C2, claim `organisationId`), viendront avec la partie A qui appelle la route (EPIC-144).
- **D-938-2 — Le DG, à défaut d'un dirigeant enregistré, est le fondateur.** Le registre des consentements (EPIC-157)
  posera `dirigeantId`.
- **D-938-3 — `createdByUserId` devient facultatif** dans `identity.org.created`. C'est un relâchement du contrat,
  annoncé avant la fusion. Ce que font les lecteurs du champ :
  - `dossier-service` le remplace par une chaîne vide ;
  - `expert-comptable` le range tel quel ;
  - le type de `document-service` le déclare obligatoire : à relâcher par son propriétaire (C).
- **D-938-4 — Pas de migration du socle d'`auth-service` dans cette story** (Node 20, kafkajs) : le plan ne la
  demande pas ici. Elle reste à faire au passage d'EPIC-155.
- **D-938-5 — La console affiche « sans rôle métier »** pour un membre qui reçoit le rôle par défaut (écart de
  STORY-902, passation de A) : **non traité ici**. C'est l'API d'administration qui doit rendre le rôle effectif ; il
  faut une story nommée (voir le journal de B).

## Suite

- La mise en œuvre de l'ADR « droits hors du jeton » (4 stories, lot suivant).
- La partie A appellera cette route à l'ordre de naissance de la console (EPIC-144).
