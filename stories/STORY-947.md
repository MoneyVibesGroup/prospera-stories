# STORY-947 : le kit des cibles (2) — la suite de conformité, la cible témoin, `kit-cible` 1.0.0

Status: done

**Complexité :** grande (une suite publiée, une cible témoin, un adaptateur MongoDB, une distribution CommonJS)

**Épic :** EPIC-161 (le kit des cibles : une cible reçoit une reprise en déclarant ses objets)
**Dépôts :** `MoneyVibesGroup/prospera-plateforme` (`bibliotheques/kit-cible/`, `contrats/reprise/`, scripts et fichiers racines)
**Plage :** groupe B, n° 7 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §3). **Jalon : 1.0.0 avant le 04/12.**

---

## Pourquoi

STORY-946 a posé la mécanique du kit (contrats de la Reprise, point d'import `SIMULER` / `APPLIQUER`, valeurs de
contrôle). EPIC-161 n'est fini que si :

- la **suite de conformité** est publiée avec le kit, et chaque module cible la joue (« fini » d'un point d'import) ;
- une **cible témoin** la joue en vert ;
- trois mutations la font rougir : retirer la comparaison au verdict validé, retirer `ORGANISATION_HORS_JETON`,
  accepter un champ inconnu ;
- `kit-cible` 1.0.0 est **étiqueté le 04/12 au plus tard**, relu par A.

Le point d'import de `pdv` se code en S5 sur cette version.

## Ce qui doit être vrai à la fin (plan du lot 2, §3, n° 7 ; fin d'EPIC-161)

| Exigence | Fait |
|---|---|
| La suite de conformité publiée rejoue la matrice | oui : les attendus sont lus dans la table publiée de la garde (`GARDE`), 10 états × 2 espaces × 4 identités × 2 routes, plus une version de matrice inconnue |
| Trois mutations au moins la font rougir | oui : **quinze**, dont les trois d'EPIC-161, chacune sur une assertion |
| Une cible témoin passe la suite | oui : en mémoire (13 cas) et sur MongoDB 8.0 en jeu de répliques (14/14 avec la concurrence de l’index unique) |
| Adaptateur MongoDB | oui : `@prospera/kit-cible/mongodb` (transaction de session, jeu de répliques exigé) |
| Un objet de référence simple s'importe par son schéma et son raccord seuls | oui : `famille` du témoin, ni `juger` ni `appliquer` |
| `kit-cible` 1.0.0, étiquette `kit-cible-v1.0.0` | oui : plateforme #11, `789a11a` sur `dev`, étiquette `kit-cible-v1.0.0` posée et poussée |
| Relu par A | demandé (journal de B, « → A ») ; un défaut donnera une 1.0.1 |

## Ce qui a été livré

1. **La suite de conformité** (`src/conformite.ts`, export `@prospera/kit-cible/conformite`) :
   - `casDeConformite(profil)` rend des cas `{ nom, jouer }` qui lèvent une `AssertionError`. Elle ne dépend d'aucun
     cadre de test : `test(c.nom, c.jouer)` sous `node:test`, `it(c.nom, c.jouer)` sous jest ;
   - le profil déclare `fabriquer()` (un banc neuf : la cible et la doublure de l'état publié), un objet simple (`VIVANT`
     et `HISTORIQUE`), un objet chaîné et, s'il en a, un montant requis et une ouverture ; `casSansObjet` nomme les cas
     qu'il ne joue pas ;
   - elle passe par les routes comme un service les sert (`traiterRequete`), et chaque réponse est jugée par son contrat
     publié ;
   - ses douze cas :
     1. idempotence et version antérieure ;
     2. simulation sans écriture ;
     3. historique non modifiable ;
     4. alias ;
     5. matrice des neuf états (refus de garde jamais rendu comme un verdict d'objet) ;
     6. appel croisé d'organisation ;
     7. 600 objets chaînés en deux morceaux (le second, appliqué avant le premier, est refusé en entier, sans création
        partielle) ;
     8. 500 objets simulés en moins de 30 s ;
     9. verdict validé et `VALIDATION_ABSENTE` ;
     10. refus de l'enveloppe (champ inconnu, mineure plus récente, 501 objets) ;
     11. montant à saisir : jamais de zéro, motif exigé, trace, saisie gardée au rejeu ;
     12. `OUVERTURE_CLOSE`.
2. **Le kit, complété** (`src/`) :
   - le crochet `OUVERTURE_CLOSE` (spine AD-11) : `ouvertureClose`, et `ouvertureCloseHorsInstallation` pour la règle
     de la spine. Il refuse la requête entière, `SIMULER` compris (409) ;
   - `cible.saisirMontant` : garde (sorte `ecriture`), motif exigé (422 `MOTIF_REQUIS`), champ marqué
     (409 `MONTANT_NON_A_SAISIR`), objet vivant (409 `OBJET_HISTORIQUE`), valeur conforme. La fiche et sa trace
     s'écrivent dans une seule transaction ;
   - `cible.lireFiche` et `cible.lireTraces` ; `Session.tracer` et `Session.lireTraces` ;
   - les contrats sont embarqués (`src/contrats.ts`, générés par `npm run contrats:reprise`) : le kit ne lit plus aucun
     fichier ;
   - une forme JCS propre (`src/jcs.ts`) : le kit ne dépend plus de `@prospera/signature`, ni donc de `jose`.
3. **L'adaptateur MongoDB** (`src/mongodb.ts`) :
   - `ouvrirMagasinMongo(client, { base })` refuse un MongoDB sans jeu de répliques (`JEU_DE_REPLIQUES_EXIGE`) ;
   - transaction de session : annulée en `SIMULER`, rejouée sur `TransientTransactionError` ;
   - collections `reprise_cles` (index unique), `reprise_resultats`, `reprise_lots`, `reprise_traces` ;
     `raccord(collection)` sert d'objet de référence simple ;
   - seuls les types du pilote sont importés, et les identifiants sont des UUID.
4. **La cible témoin** (`test/temoin/temoin.ts`) :
   - `famille` : un objet de référence simple, qui se référence lui-même pour la chaîne ;
   - `commande` : un objet à circuit fictif, qui surcharge `juger` et `valeursDeControle`. Une commande `LIVREE` sans
     date est requalifiée ; un montant absent non marqué est refusé ;
   - `comptage` : une ouverture.
5. **La distribution** (`bibliotheques/kit-cible/distribution/`, `npm run kit:distribuer`) : c'est ce qu'un service
   copie à l'étiquette `kit-cible-v<version>`. Elle porte les sources aux imports sans extension, la garde partagée
   jointe et `EMPREINTES.json`. `tsconfig.distribution.json` la vérifie en CommonJS, et le `typecheck` racine joue les
   deux configurations.
6. **Contrats** :
   - `refus-reprise@1` : `OUVERTURE_CLOSE` ajouté à la liste des codes (le motif du champ `code` est inchangé) ;
   - `reprise-cible.openapi.json` : une réponse 409.

   Ce sont des ajouts seulement.
7. **Racine** :
   - `mongodb` 6.20 en dépendance de développement (types et preuve) ;
   - scripts `kit:distribuer` et `typecheck` (deux configurations) ;
   - la garde `scripts-racines` lit les deux tsconfig ;
   - `.compilation-cjs/` est ignoré ;
   - README : la section du kit est réécrite.

## Preuves

- **Node 24** (`node:24-slim`, export du commit rebasé sur `dev`, avec 954 et 991) : `npm ci` ✔, `npm run typecheck` ✔
  (ESM et CommonJS), `npm test` **399 passés, 0 échec, 1 sauté** (la matrice du catalogue, absente du conteneur).
  Avant le rebase : 372 contre 318 à l'arrivée, aucune régression.
- **La suite en mémoire** : 13/13 (la cible témoin joue les douze cas, aucun n'est sans objet).
- **Sur MongoDB 8.0** en jeu de répliques (projet Docker `grp-b-947`, sous le verrou) : **14/14**, sur le poste et sous Node 24 (`node:24-slim` dans le réseau de la pile) : les douze cas, plus le refus sans jeu de répliques et l’index unique sous deux transactions concurrentes (une seule clé posée). `SIMULER` de 500 objets : 3,8 s (Node 24) et 5,1 s ; la chaîne de 600 objets : 25 s. Pile descendue avec ses volumes, verrou rendu.
- **Mutation** (`test/mutation-conformite.test.ts`) : quinze altérations du kit, et chacune fait rougir la **suite de
  conformité** jouée par le témoin, sur une assertion. Les trois d'EPIC-161 :
  - la comparaison au verdict validé retirée ;
  - `ORGANISATION_HORS_JETON` retiré ;
  - un champ inconnu accepté.

  Puis :
  - le motif non exigé ;
  - la saisie non tracée ;
  - `OUVERTURE_CLOSE` ignoré ;
  - `SIMULER` qui écrit ;
  - l'idempotence cassée ;
  - un objet historique modifiable ;
  - l'alias d'un autre objet accepté ;
  - la garde ouverte ;
  - une référence inconnue créée ;
  - une version antérieure rejouée ;
  - une mineure plus récente acceptée ;
  - 501 objets acceptés.
- **Distribution** : à jour, empreintes justes, aucun import en `.ts`, aucun `@prospera`, aucun `import.meta`. Elle est
  **compilée en CommonJS, chargée par `require`**, et joue la suite (10 cas sur un module à un objet).
- **JCS** : 17 valeurs, identiques à l'octet à `@prospera/signature` (dont `-0`, `1e21`, les échappements et les
  surrogates).

## Décisions

- **D-947-1 — La suite vit dans le kit, pas dans `contrats/objets/conformite/`.** L'épic la plaçait dans
  `contrats/objets/conformite/`. Mais c'est du code lié à la version du kit, alors que `contrats/objets/<code>/`
  appartient aux modules et ne porte que des schémas. Elle est publiée avec le kit (`./conformite`) et copiée avec lui.
- **D-947-2 — La suite ne dépend d'aucun cadre de test.** Les modules jouent jest et la plateforme `node:test` : des cas
  `{ nom, jouer }` qui lèvent une `AssertionError` passent dans les deux.
- **D-947-3 — La matrice attendue est lue dans `GARDE`, la table publiée de la garde partagée.** Elle n'est pas
  recalculée par `deciderGarde`, que le kit appelle : sinon la suite se vérifierait elle-même. `GARDE` est la copie à
  l'octet de `contrat/matrice-etats.json`, que le test de la garde compare au catalogue. Le rejeu « sur la matrice
  publiée » du 11/12 est donc acquis.
- **D-947-4 — Un service prend le kit par une copie épinglée générée (`distribution/`), pas par un paquet npm.** Il n'y
  a ni registre privé, ni compilation dans ce dépôt. Les sources s'exécutent en ESM avec des imports `.ts`, qu'un service
  NestJS (CommonJS) ne compile pas. La distribution les rend compilables, jointes à la garde, avec leurs empreintes, sur
  le patron de la garde partagée (STORY-937). Un test la compile en CommonJS et lui fait jouer la suite.
- **D-947-5 — Pas d'adaptateur NestJS.** `traiterRequete` tient en quelques lignes dans un contrôleur (README). Un module
  Nest générique figerait des choix qui appartiennent au service : stratégie de jeton, analyseur de corps.
- **D-947-6 — `OUVERTURE_CLOSE` refuse la requête entière (409), `SIMULER` compris, juste après la garde.** La spine le
  range parmi les codes HTTP. C'est un état de la cible, pas un verdict d'objet ; une simulation qui répondrait autre
  chose tromperait la Reprise.
- **D-947-7 — La saisie d'un montant ne change pas l'empreinte de reprise de la fiche.** Rejouer le même objet rend
  `INCHANGE` et garde la saisie de l'utilisateur. Une reprise au contenu différent reste un `MODIFIE`.
- **D-947-8 — L'horodatage d'une saisie vient du service** (son horloge de référence). Le kit ne lit jamais l'heure.
- **D-947-9 — Le kit porte sa propre forme JCS.** Une copie dans un service ne doit pas entraîner `jose` (ESM seul)
  ni `canonicalize`. Un test la tient identique à celle de `@prospera/signature`.
- **D-947-10 — L'adaptateur MongoDB n'importe que les types du pilote.** Le service a déjà `mongodb` par Mongoose (6.x),
  et les identifiants créés sont des UUID. Les collections et index du kit se posent à l'ouverture, hors transaction.

## Suite

- **A relit `kit-cible` 1.0.0** (demande dans le journal de B). Un défaut donnera une 1.0.1, corrigée par B dans le
  kit, jamais dans le dépôt de la cible.
- Chaque module cible (`pdv` en S5, Dev A ; puis EPIC-165) copie `distribution/` à l'étiquette et joue
  `casDeConformite` dans sa CI.
- La part échange (EPIC-170) reste réservée.
