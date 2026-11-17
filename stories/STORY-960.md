# STORY-960 : les 15 rôles du distributeur dans auth

Status: in-progress

**Complexité :** moyenne (une table de 131 droits, la borne du jeton contournée sans la relever, un champ de contrat et
un claim ajoutés)

**Épic :** EPIC-223 (les rôles, les périmètres, les droits et les données privées), FR-4 → FR-8 du PRD distributeur
**Dépôt :** `MoneyVibesGroup/prospera-auth-service`
**Plage :** groupe B, n° 5 du lot 3 (`coordination/PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §3, ligne 960).
**Dépend de :** STORY-949 (`GET /moi/droits`, `dv`, `identity.droits.changed@1`, `dev` `a30e78f`).
**Débloque :** D-1053 (les 15 rôles appliqués par les cinq services du distributeur).

---

## Pourquoi

Le PRD distributeur (`prds/prd-distributeur-2026-11-12/prd.md`) fixe **une seule table d'accès** (annexe B) que le
serveur applique (FR-5). Auth-service avait déjà les 15 rôles (`DIST_*`, STORY-166), mais neuf d'entre eux n'avaient
aucun droit (« en attente de module ») et les autres n'avaient que des droits de paiement et de notification. La table
de l'annexe B.2 compte **131 droits**. Un DG en porte 44 et un DC 50 : la borne du jeton (44 droits au plus, STORY-365)
ne les tient pas.

## Ce qui doit être vrai à la fin (plan du lot 3, §3, ligne 960)

| Exigence | Fait |
|---|---|
| La table d'accès de l'annexe B est appliquée par le serveur | les 15 rôles sont **dérivés** de `table-d-acces-distributeur.ts`, recopie ligne à ligne de l'annexe B.2 ; un test la compare à une extraction du PRD par script (`annexe-b2-distributeur.fixture.json`) ; la résolution unique (`ResolutionDesDroitsService`) sert le jeton et `GET /moi/droits` (D-960-1) |
| Les données privées (rémunérations, prix d'achat) restent hors des rôles qui n'y ont pas droit | quatre droits privés, avec les rôles qui ne les reçoivent **jamais** ; retirés à la résolution, refusés à la surcharge (422 `DONNEE_PRIVEE_HORS_DU_ROLE`) (D-960-4) |
| Le schéma est déposé au registre | `identity.droits.changed@1` gagne `roleMetierAttribue`, facultatif, enregistré en BACKWARD dans Karapace (D-960-5) |
| L'émission des rôles prouvée par un jeton réel | pile `grp-b` : jetons RS256 de trois rôles du distributeur décodés (§ Preuves) |
| `docker compose up` sain | auth-service sur la pile `grp-b` (§ Preuves) |

## Décisions (prises par défaut, contestables)

- **D-960-1 : la table est écrite une fois, et les rôles en sont dérivés.** `TABLE_D_ACCES_DU_DISTRIBUTEUR` reprend
  l'annexe B.2 dans son ordre (un droit, ses rôles par défaut) ; `droitsParDefautDu(code)` donne les droits d'un rôle
  dans l'ordre du catalogue. Les colonnes portent les codes de l'annexe (`DG`, `RESP_VENTES`…) ; le rôle d'auth
  s'appelle `DIST_<code>` (noms déjà persistés depuis STORY-166 ; `DIST_ADMIN` garde le sien). Lecture des cellules à
  conditions :
  - « au-delà de son plafond : DAF », « au-delà DAF, puis DG » : le droit est donné aux rôles cités ; le plafond est
    une règle du module ;
  - « pour leur portefeuille », « les siens » : le droit est donné ; le périmètre est appliqué par le module (FR-6,
    portée de `reseau.portee.changed@1`) ;
  - « chaque agent pour lui-même » : aucun droit ; le module sert à chacun son propre chiffre ;
  - `automatisations:cible:valider` : les trois rôles cités (MARKETING, RECOUVREMENT, RESP_STOCK) ;
  - `support-client:*` (« attribués au cadrage du module ») : hors du catalogue.
  Les attributions restent **modifiables** par l'organisation sans déploiement (surcharge DELTA, STORY-167).
- **D-960-2 : le jeton est gelé à ses 24 droits ; tout droit neuf vit hors du jeton.** Le catalogue de tenant a
  désormais deux familles :
  - `DROITS_DU_JETON` : les 24 codes d'avant 960 (paiement, notification, fiscal, instance), lus dans `perms[]` par
    les gardes existantes. Eux seuls voyagent dans le jeton ;
  - `DROITS_HORS_JETON` (`droits-hors-jeton.ts`) : les 118 droits nouveaux de l'annexe B. Ils sont attribuables comme
    les autres, servis par `GET /moi/droits` dans un champ **ajouté**, `droitsHorsJeton`, et jamais dans `perms[]`.

  Le sens existant ne change pas : `droits ∪ droitsPlateforme` reste exactement le `perms[]` du jeton, donc les
  doubles lectures du catalogue (949) et du fiscal (A-919) ne voient aucun écart. Les droits de tenant effectifs sont
  `droits ∪ droitsHorsJeton`. La borne compte désormais `PERMISSION_CATALOG + DROITS_DU_JETON` = 17 + 24 = **41 ≤ 44**,
  et un rôle du distributeur porte au plus 6 droits dans son jeton. La règle de forme (40 caractères au plus) vaut
  pour tout le catalogue. Pourquoi ne pas relever la borne : un cookie de 4 Ko ne s'étire pas (ADR « droits hors du
  jeton ») ; un droit qui naît hors du jeton n'a jamais à en sortir. **Cette décision remplace D-949-1** : les
  `reprise:*` entrent au catalogue maintenant, hors du jeton, sans attendre le retrait de `perms[]`.
  **Comptabilité** : la même voie règle la borne pour `comptabilite:*` (D-959-4). Ils ne sont pas attribués ici (hors
  de la story) ; le jour où ils le seront, ils entreront hors du jeton, et `prospera-comptabilite-service` devra lire
  `droits ∪ droitsHorsJeton` (sa garde ne lit aujourd'hui que `droits`).
- **D-960-3 : le rôle métier voyage dans le jeton, dans un claim à part, `roleMetier`.** L'ADR (décision 1) veut que
  le jeton porte les rôles et pas les droits. Le code du rôle métier **effectif** (même règle que `/moi/droits`) est
  ajouté au jeton sous un claim neuf. Il n'entre pas dans `roles` : ce claim est lu par une vingtaine de services
  contre des tables fermées (`reseau` : `DROITS_PAR_ROLE`), et AD-27 veut qu'on ajoute plutôt que changer le sens d'un
  champ. Absent pour un membre sans rôle métier.
- **D-960-4 : les données privées ont une liste d'interdits, appliquée par le serveur.** Quatre droits privés, et les
  rôles du socle qui ne les reçoivent jamais :

  | Droit | Jamais |
  |---|---|
  | `equipe:remuneration:consulter` | SUPERVISEUR, CONTROLE_GESTION, DIST_ADMIN (FR-8, B.2) |
  | `freelance:commission:consulter` | SUPERVISEUR, CONTROLE_GESTION, DIST_ADMIN (FR-8 : une commission est une rémunération) |
  | `stock:valeur-achat:consulter` (prix d'achat) | GEST_ENTREPOT, DIST_ADMIN (FR-196 (4), B.2) |
  | `catalogue:marge:consulter` | RESP_STOCK, GEST_ENTREPOT, DIST_ADMIN (FR-196 (3)(4), B.2) |

  Ils sont retirés à la **résolution** (`TenantRolesService.permissionsFor`), donc du jeton et de `/moi/droits`, même
  si une surcharge les a mis en base. Ils sont aussi **refusés** à la surcharge (422 `DONNEE_PRIVEE_HORS_DU_ROLE`),
  pour que l'administrateur sache pourquoi. Un rôle **personnalisé** n'est pas visé : il n'est pas un rôle du PRD, et
  le donner est le « droit explicite » de FR-8. Les autres attributions privées par défaut (rémunérations : DG, DC,
  DAF ; prix d'achat : DG, DC, DAF, RESP_STOCK ; marge : DG, DC, DAF, CONTROLE_GESTION ; commission : FREELANCE, DG,
  DC, DAF) sont celles de la table.
- **D-960-5 : `identity.droits.changed@1` porte le rôle métier ATTRIBUÉ (`roleMetierAttribue`, facultatif).** C'est
  le « rôle neuf visible des autres » : un service du distributeur peut tenir qui est commercial, superviseur ou
  gestionnaire d'entrepôt sans appeler auth à chaque membre. Le champ vaut le code du rôle attribué après le
  changement, `null` s'il n'y en a pas ; il est absent d'un événement antérieur. Le rôle par défaut d'un vertical
  (le cabinet) n'y est pas : il se lit par `/moi/droits`. Le distributeur n'a pas de rôle par défaut : pour lui, le
  rôle attribué est le rôle effectif. D-949-4 tient toujours : aucun droit sur le fil. Ajout facultatif, compatible
  BACKWARD, prouvé au registre.
- **D-960-6 : deux écarts au socle de STORY-166, voulus par l'annexe B.**
  - `DIST_ADMIN` perd `paiement:journal:consulter` et `notification:modele:rediger` : l'annexe ne les lui donne pas,
    et il ne lit aucune donnée métier.
  - `DIST_COMPTABLE` déclare, valide et annule un encaissement (B.2). Le cumul est **signalé** (marqueurs
    `paiement:declarer+valider` et `paiement:declarer+annuler`, calculés pour la console) ; paiement-service refuse
    qu'une personne valide ou annule sa propre déclaration (AD-11). AC 8 de 166 est réécrit en ce sens.
- **D-960-7 : plus aucun rôle « en attente de module ».** Les neuf rôles qui l'étaient passent `partiel` : leurs
  droits sont attribués, leurs écrans viendront avec la coque. La couverture reste une information de la console,
  jamais un droit.
- **D-960-8 : une écriture de rôle accepte le catalogue entier.** `@ArrayMaxSize` des corps de composition et de
  surcharge passe de 44 (`MAX_PERMS_PAR_JETON`) à 256 (`MAX_DROITS_PAR_ECRITURE`) : un rôle personnalisé de DG ne
  doit pas buter sur une borne qui ne le concerne plus.
- **D-960-9 : `reprise:lot:valider` reste attribuable par le DG seul.** Il entre au catalogue (D-960-2) ; par défaut,
  DG et DAF le portent. La règle de STORY-948 s'applique donc à l'attribution du rôle `DIST_DAF` : seul le dirigeant
  de l'organisation peut l'attribuer (403 `VALIDATION_DE_REPRISE_RESERVEE_AU_DG`). C'est ce que dit l'annexe
  (« attribué par le DG seul »). **Contestable** : si le PO préfère que l'administrateur attribue `DIST_DAF`, le
  droit sort du rôle par défaut et le DG le donne à part.
- **D-960-10 : un écart du manifeste `automatisations`, signalé, pas corrigé.** L'annexe B (et l'annexe A, C7)
  nomment `automatisations:regle:gerer`, `:regle:activer`, `:cible:valider`, `:journal:consulter`. Le manifeste
  `manifestes/automatisations.manifest.ts` déclare `:regle:ecrire`, `:regle:activer`, `:arbitrage:decider`,
  `:execution:annuler`. Auth suit l'annexe B (le critère de la story). Le manifeste est à réaligner avec la story du
  module (question dans le journal de B). Les autres manifestes du distributeur déclarent bien tous les droits de
  l'annexe, nouveaux compris (vérifié par script le 17/11).
- **D-960-11 : un changement du socle à la livraison n'avance pas `dv` (D-949-3 tient).** Le déploiement de 960 change
  les droits de tous les membres du distributeur sans événement : les caches des services se renouvellent à leur
  terme (60 s au plus), les `perms[]` des jetons au renouvellement (15 min au plus).

## Ce que D lit pour D-1053

- **Le jeton** : `org`, `dv`, et `roleMetier` (`DIST_DG`…). Ne pas décider sur `roleMetier` seul : un droit retiré par
  surcharge ne change pas le nom du rôle.
- **`GET /api/v1/moi/droits?organisationId=<org>`** avec le jeton du membre : `droits ∪ droitsHorsJeton` = ses droits
  de tenant effectifs (`droitsPlateforme` à part). Cache `(membre, organisation, dv)`, 60 s au plus ; un jeton au `dv`
  plus récent force la relecture ; auth injoignable ⇒ on ferme.
- **`identity.droits.changed@1`** : invalider sur `dv` ; `roleMetierAttribue` dit le rôle du membre après le
  changement.
- **Le périmètre** reste dans `reseau.portee.changed@1` (D). Auth ne publie aucune portée.

## Livraison

(à compléter)

## Preuves

(à compléter)
