# STORY-993 : la copie de lecture des polices dans `assurance` — datée, jamais modifiée, « à relire » sur fraîcheur

Status: done

**Complexité :** grande (un amendement des faits « reçus », un module neuf dans un service existant, deux
consommateurs, une table paramétrée versionnée)

**Épic :** EPIC-215 (les contrats lus, la provision et les états techniques)
**Dépôts :** `prospera-plateforme` (dossiers de C), `prospera-liaison-assureur-service`, `prospera-assurance-service`
**Plage :** groupe C, n° 4 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §4).

---

## Pourquoi

`liaison-assureur` est le seul écrivain des projections brutes du LC ; **`assurance` en tient la copie de lecture par
ces faits et la sert aux autres** (spine AD-1, AD-2). La décision de garantie s'appuie dessus : elle cite la valeur lue
et sa date de lecture (FR-187), et une police périmée donne « à relire », **jamais un refus de garantie** (AD-1). La
table « type de sinistre → garanties » (FR-41, FR-187 ; annexe D `assurance.table_garanties`) dit quelles garanties
répondent à quel type de sinistre ; `assurance` en est le seul écrivain, datée et versionnée (AD-12).

**Source** : PRD FR-41, FR-186, FR-187 ; annexe C (C-2 → C-8), annexe D ; spine AD-1, AD-2, AD-12, AD-16.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | **Les faits « reçus » portent le contenu métier non personnel** (D-993-1) : police, garantie, produit, prime, coassurance, traité, intermédiaire, par une liste blanche ; l'assuré reste « clés seulement » ; `souscripteur`, `immatriculation`, le nom et le contact de l'intermédiaire ne partent jamais ; chaque champ classé ; schémas élargis (ajouts facultatifs, BACKWARD) | tests ; Karapace |
| AC-2 | **La copie de lecture** dans un module `assurance` neuf de `prospera-assurance-service` : une version par `(objet, cleOrigine, versionObjet)`, **ajoutée, jamais réécrite** ; une version égale ou plus ancienne est ignorée ; une vue courante pointe la plus récente | tests ; vrai MongoDB |
| AC-3 | **« À relire »** : `assurance` tient la fraîcheur publiée par `liaison-assureur` (D-993-2) ; la lecture d'une police rend son état `A_JOUR`, `A_RELIRE` ou `JAMAIS_LUE`, jamais un refus | tests |
| AC-4 | **Les routes de lecture** : `GET /api/v1/assurance/polices/{cleOrigine}` (police, garanties, primes, produit, source, date de lecture, état), `GET …/polices/{cleOrigine}/versions` ; police absente : 404 `POLICE_INCONNUE_DU_LC` | tests ; pile |
| AC-5 | **La table « type de sinistre → garanties »** versionnée et datée (version `2026.1`, données de la démo) ; `GET …/assurance/correspondances/type-sinistre` ; une version publiée ne se modifie pas | tests |
| AC-6 | Le module neuf passe la garde du droit `assurance` **sans** l'interrupteur `compta-cima` ni le contrôle de référentiel comptable (AD-3 : par route) ; suites vertes sous Node 24, lint 0, build ; pile `grp-c` avec `liaison-assureur` et le LC fictif | pile |

## Décisions retenues par défaut (contestables)

- **D-993-1 — Les faits « reçus » portent le contenu métier non personnel** (amendement d'AD-16 et d'AD-24, à
  valider par le PO) : AD-1 veut la copie « par ces faits » ; AD-16 voulait « clés seulement ». Sans contenu, la copie
  devrait appeler la route de `liaison-assureur` avec un jeton de service qui n'existe pas, un appel par fait.
  L'assuré, et toute donnée personnelle directe ou indirecte, restent à la route de lecture.
- **D-993-2 — `assurance` consomme `fraicheur.changed@1`** (amendement de la liste fermée d'AD-16 et du manifeste) :
  une relecture identique ne publie pas de fait d'objet, le `lueLe` d'une copie vieillit donc alors que la donnée est
  fraîche.
- **D-993-3 — La version de la table se choisit à l'ouverture du dossier** (AD-12, paramètre interne) ; la décision
  garde la version lue.
- **D-993-4 — Les routes neuves passent la garde du droit `assurance` par route** (`@HorsComptaCima`, sans contrôle
  de référentiel comptable ni KYC global) ; la comptabilité CIMA existante ne change pas.
- **D-993-5 — `NON_INSTALLE` se rend chez l'appelant** (`sinistres`, quand `assurance` n'est pas installé) : il se
  prouvera avec la recevabilité (STORY-1001).
- **D-993-6 — `JAMAIS_LUE` = aucune fraîcheur reçue pour l'objet `police`** : `liaison-assureur` ne publie que
  `FRAICHE` ou `PERIMEE` ; sans état reçu, `assurance` ne prétend pas que la donnée est fraîche (même échec fermé que
  la garde `POLICE_A_RELIRE` de `sinistres`, D-992-3).
- **D-993-7 — groupe `assurance.liaison-assureur`** : préfixé du code du module (spine, « Nommage »), depuis le début
  (une organisation neuve reçoit toute la copie).
- **D-993-8 — les routes du module ne sont pas nichées sous `dossiers/:dossierId`** : la copie appartient à
  l'organisation (la compagnie), la portée est l'organisation du jeton ; une police d'une autre organisation rend le
  même 404 qu'une police inconnue. Inscrites aux exceptions justifiées de l'invariant de portée.
- **D-993-9 — les droits fins `assurance:police:consulter`… ne sont pas encore posés** : ils n'existent pas à
  `auth-service` (manifeste `assurance`, « une PR `auth-service` par droit ») ; les routes portent les rôles tenant,
  comme les autres routes du service.

## Ce qui a été livré

**2026-11-16** — trois PR fusionnées en « Rebase and merge » :

- `prospera-plateforme` **#13** (`dev` `123b086`) : les schémas `.recu` élargis des champs de la liste blanche
  (ajouts facultatifs, BACKWARD) ; 35 champs classés « ordinaires » au registre ; 400/400.
- `prospera-liaison-assureur-service` **#5** (`dev` `135f4a4`) : `CHAMPS_PUBLIES` par objet, posé avant
  l'enveloppe (il n'en remplace aucune clé) ; schémas recopiés de `plateforme@123b086` ; manifeste recopié de
  `prospera-stories@3ab2fa8` (consomme `sinistres.dossier.changed@1`). Invariant : les exemples complets du contrat
  d'échange (données personnelles comprises) donnent des faits valides et sans donnée personnelle. Node 24 : 466
  unitaires + 21 e2e, lint 0.
- `prospera-assurance-service` **#22** (`dev` `b03e9a4`) : module `src/modules/assurance/` — copie
  de lecture (`assurance_contrats_versions`, ajout seul, index unique ; `assurance_contrats_courants`, mise à jour
  conditionnelle), fraîcheur (`assurance_fraicheur_lc`), consommateur supervisé de neuf topics,
  `GET /api/v1/assurance/polices/{cleOrigine}` et `…/versions` (404 `POLICE_INCONNUE_DU_LC`),
  `GET /api/v1/assurance/correspondances/type-sinistre` (table `2026.1`, douze types, empreinte figée) ;
  `@FonctionDuCircuit()` lève l'interrupteur `compta-cima`, le KYC et le référentiel comptable pour ces seules routes.
  Node 24 : 2 264 unitaires + 356 e2e, lint 0, build.
- **Pile `grp-c-993`** (`liaison-assureur`, LC fictif, Karapace, `assurance-service` sur le même Kafka) :
  - LC fictif, jeu réduit : 5 180 projections, outbox vidée ; `assurance` copie **4 880 versions sur 4 880
    attendues** (assuré 400, police 600, garantie 3 206, prime 600, produit 7, intermédiaire 40, coassurance 24,
    traité 3) ; **0 champ personnel** dans la copie, assurés « clés seulement » ;
  - fraîcheur tenue par objet et transport (`fichiers`, `FRAICHE`) ; `GET …/polices/POL-TRANSPORT-000001` → `A_JOUR`,
    police v1 (source `LC`, date de lecture), 1 garantie, 1 prime, produit `TRANSPORT` ; `…/versions` → la v1 ;
    police inconnue → **404 `POLICE_INCONNUE_DU_LC`** ; sans jeton → 401 ; table `2026.1` servie ;
  - relecture identique : 4 880 versions avant, 4 880 après (**rien ne se réécrit**) ; 0 erreur au journal des deux
    services, 0 message écarté ;
  - Karapace : schémas de `dev` (`f943791`) enregistrés, puis les schémas élargis **compatibles BACKWARD** et
    enregistrés (15 sujets, police v1 → v2) ; garde `classification-sante` : 15 sujets, **0 refus**.
  - **Rejouée sur les images reconstruites depuis `dev`** (liaison `135f4a4`, assurance `b03e9a4`) : 4 880 versions
    sur 4 880, 0 champ personnel, police `A_JOUR`, 404 et 401 attendus, relecture sans réécriture, 0 erreur.

**Reste** : la recevabilité lit cette copie et la table (STORY-1001, avec `NON_INSTALLE`) ; la provision dossier par
dossier (STORY-994) ; les droits fins `assurance:*` à `auth-service` ; la copie Mongo n'a pas de test unitaire sur un
vrai MongoDB dans ce dépôt (pas de base de test) : elle est prouvée sur la pile.
