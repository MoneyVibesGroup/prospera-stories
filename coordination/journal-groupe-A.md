# Journal du groupe A (poste principal)

> Écrit par le groupe A seulement. Lot : `PLAN-4-SESSIONS-2026-11-14.md` §3.

## État

- **2026-11-14 (soir)** : journal ouvert. Prochaine étape : la relecture de STORY-299, 300, 365 et 563 (§3.1).
- **2026-11-14 (soir)** : STORY-569 livrée (fiscal #39, notification #86) ; elle sort du lot, remplacée par STORY-345.
  Le lot se termine par la relecture de tout ce qu'ont fait les quatre groupes (§3.4).
- Déjà fusionné le 14/11 par les deux sessions de la journée : STORY-178, 177, 175, 174, 365, 176, 100, 563, 567, 568
  (et 293 clôturée) ; STORY-299, 298, 300, 362, 305 → 312.
- **2026-11-15** : **STORY-901 DONE** (balance #143, dossier #47, fiscal #40, recette #16 ; docs #479, #482, #483).
- **2026-11-15** : **relecture §3.1 faite** (299, 300, 365, 563) →
  `coordination/relecture-groupe-A-2026-11-14.md`. Aucun bloquant dans le code livré. La migration de 563 est
  **jouée** sur la pile de recette et **inscrite** au README de fiscal-service (« Mise en service », **fiscal #41**,
  fusionnée).
- **Machine** : poste principal (Windows). **Docker** : aucune pile ne tourne. `recette100` est arrêtée (conteneurs conservés), `grp-a` descendue avec ses
  volumes.
- **Consigne de l'utilisateur (2026-11-15)** : A termine son lot, **puis fait le lot de B** (§4, B n'a pas démarré),
  puis finit par la story du seed du catalogue (`fiscal-tg-*` octroyables pour `declarations`, voir « Questions »).
  Chaque story fusionnée est suivie d'un `/clear` : **ce journal est la seule mémoire d'une session à l'autre.**
- **Lot de A, ordre à jour** :
  1. ~~relecture §3.1~~ ;
  2. **restes §3.2** (ticket pour D, procédure de republication du paquet) ← **prochaine étape** ;
  3. ~~STORY-901~~ ;
  4. STORY-345 ;
  5. STORY-902 (élargie, voir la relecture) ;
  6. STORY-903 ;
  7. STORY-313 ;
  8. STORY-314 ;
  9. **STORY-904** (neuve) ;
  10. relecture finale §3.4.
- **STORY-904 réservée par A** (fiche à écrire juste avant de la coder) : *le fiscal tient sur un vrai MongoDB*.
  Elle couvre :
  - le refus de démarrer sans jeu de répliques ;
  - la sérialisation canonique fermée (`Date`, `ObjectId` et `Buffer` refusés) ;
  - une course sur un même périmètre d'audit ;
  - l'atomicité de l'audit et de l'écriture ;
  - le rejeu de la dérivation sur une obligation d'avant 563.

  Le tout est prouvé par `test:conformite`.
- **STORY-902 élargie** par la relecture :
  - côté fiscal : fin du mode de compatibilité (mode strict), fait d'audit marqué `via` (jeton ou rôle), test
    d'invariant « toute route d'écriture est décorée » ;
  - côté auth-service : la borne du jeton contrôlée **à l'attribution** d'un rôle ou d'une surcharge
    (`@ArrayMaxSize(50)` ramené à 44), un 4xx nommé au lieu du 500 `JETON_HORS_BORNE`, et des tests de connexion et
    de rafraîchissement hors borne.

## Dépôts tenus

`prospera-fiscal-service`, `prospera-balance-service`, `prospera-bilan-service`, `prospera-dossier-service`,
`prospera-kyc-service`, `prospera-admin-panel-service`, `prospera-recette`, `prospera-auth-service` (jusqu'à STORY-902),
et plus `prospera-notification-service` (cédé à B, voir Passations).

## Passations

- **2026-11-14 : `prospera-notification-service` cédé à B**, dernier commit sur `dev` : `8916ee4`
  (STORY-569 livrée). A n'y touche plus.
- Prévue : `prospera-auth-service` → B à la fusion de STORY-902.
- **2026-11-14 (nuit) : FE-069 remise à D** (sur demande de l'utilisateur), branche **`fe-069`** poussée
  dans `prospera-frontend-expert-comptable`, commit **`4148d65`**, sans PR. A ne touche plus ce dépôt.

## Demandes aux autres groupes

- **À D — reprendre FE-069 sur la branche `fe-069`** (plan, ligne FE-069 du lot de D : « D la reprend où elle en est »).
  - **À lire d'abord** : la section « Recensement des écarts frontend ↔ backend (2026-11-14) » de la fiche
    `frontend-stories/FE-069.md` (#480) — ruptures A1→A3, écarts de schéma B1→B17, routes sans écran C1→C17,
    et le découpage proposé au PO (A+B dans FE-069, C en stories nommées — **pas encore validé**).
  - **État de la branche** : typecheck **rouge à dessein** — les types sont régénérés depuis la pile `recette100`
    (8/8 services, `origin/dev` du 14/11) et font remonter les écarts B. A1/A2 sont faits dans le code
    (`referentiels/actifs` et `tresorerie/*` sous `/dossiers/{id}/`, clés de cache sous `["dossier", id, …]`) ;
    restent `tresorerie.test.ts`, `scope-dossier.guard.test.ts`, les stubs e2e (A3), puis B.
  - **Le gate e2e** : `npx playwright test -c playwright.gate.config.ts` (`e2e/gate/`, aucune interception).
    `pile.ts` amorce un cabinet réel par API (inscription, lien Mailhog, KYC approuvé, modules, collaborateur).
    Vert jusqu'à la création du dossier par l'assistant ; bute ensuite sur A1 (Atelier fermé, faux « KYC non
    approuvé »). Le serveur `next start -p 3100` est **réutilisé** s'il tourne : le relancer après tout changement.
  - **La pile** : `recette100` tourne, **`expert-comptable` ajouté** (worktree `_wt-r100-expert-comptable`,
    surcouche avec `NODE_ENV: production`, sinon crash `pino-pretty`).

- **→ B (2026-11-15) : borne du jeton face aux verticales** (relecture de STORY-365) — **ouverte**.
  1. **STORY-938** : la regex des droits d'auth-service
     (`TENANT_PERMISSION_FORMAT = /^[a-z]+:[a-z-]+:[a-z]+$/`) refuse le tiret dans le 1er segment, ce qui écarte
     **56 des 347** codes des manifestes (`coeur-sfd`, `liaison-assureur`, `assureur-fictif`,
     `finance-transactions`…). Il faut élargir les trois segments : `^[a-z]+(-[a-z]+)*:[a-z]+(-[a-z]+)*:[a-z]+$`.
  2. **STORY-935** : cinq codes dépassent la borne de 40 caractères. Ce sont les trois
     `approvisionnement:commande-fournisseur:*` (48, 47, 46), `finance-transactions:rapprochement:effectuer` (44) et
     `finance-transactions:tresorerie:consulter` (41). Les renommer, ou relever la borne de longueur et celle
     d'octets ensemble, sur une nouvelle mesure.
  3. **Décision d'architecture avant février** : la borne de 44 droits et 3 584 octets ne tient pas face aux
     verticales. Les manifestes déclarent 347 droits ; `sinistres` en porte 23 à lui seul ; un DG à plusieurs
     modules dépasse 60 à 100 droits. A recommande que le jeton porte les rôles et les modules, et que les droits se
     résolvent par une lecture en cache (un read-model ou `/me/permissions`).

  Détail : `coordination/relecture-groupe-A-2026-11-14.md`, section STORY-365.

## Réponses aux demandes reçues

- *(aucune)*

## ⚠ Contrats

- *(aucun changement annoncé)*

## Questions à l'utilisateur ou au PO

- **STORY-300** : le mode de compatibilité par rôle des droits fiscaux (TENANT_ADMIN = tout, TENANT_USER = préparer)
  reste-t-il, et jusqu'à quand ? **Retenu par défaut (2026-11-15)**, selon la règle de l'utilisateur : « appliquer ce
  que A recommande, contestable après coup ».
  - Le mode reste jusqu'à la fusion de STORY-902, qui y met fin : un jeton sans droit fiscal est alors refusé.
  - STORY-902 attribue d'abord les droits `fiscalite:*` aux rôles du cabinet existants, pour que personne ne perde
    l'accès.
  - STORY-902 garde donc sa place (n° 5 du lot), sans attendre 313 et 314.
- **STORY-300, lecture du fichier déposé** : `GET /depots/:id/fichier` et `/audit` n'exigent que le rôle. Tout membre
  du cabinet lit donc le fichier déposé. **Retenu par défaut : on garde**, conformément à la règle d'or de 300 (la
  lecture suit le rôle). Si le PO veut un droit `fiscalite:declaration:lire`, il le dit.
- **Production : le seed du catalogue** (constat de STORY-901). Le catalogue n'autorise aucun paquet `fiscal-tg-*`
  pour le module `declarations`, puisque `fiscalite` est retiré de l'offre. L'octroi échoue donc en
  `422 REFERENTIEL_INCOMPATIBLE`, et fiscal-service ne recevrait aucun paquet en production. La recette contourne
  par `PATCH /admin/modules/declarations`. **Demandée par l'utilisateur le 2026-11-15** : à faire **après le lot de
  B**, dans `prospera-platform-catalog-service` (dépôt de B) : corriger le seed, puis retirer le contournement de la
  recette.

## Dette relevée

- **Audit fiscal (299)** : la suppression de la **dernière** entrée d'une chaîne est indétectable. Seul le rôle
  find+insert du compte l'empêche. L'ancre externe (empreinte de tête publiée) sera à décider avec la spine fiscale.

## Procédures

- *(à écrire)* republication du paquet fiscal Togo 2026 au catalogue, à la mise en service.

## Pièges rencontrés

- La recette de `prospera-recette` fait `up` **sans** `--build` : reconstruire à la main l'image du service modifié.
- `prospera-fiscal-service` : `test:conformite` exige un MongoDB en jeu de répliques ; un `mongo:7` jetable lancé avec
  `mongo/demarrer-mongo-fiscal.sh` (scripts en LF), `-p 127.0.0.1:27020:27017`, `MONGO_HOTE_ANNONCE=localhost:27017`.
- La suite unitaire du fiscal est instable en parallèle complet : `-w 2`.
- Scripts `mongo/` de fiscal-service en CRLF sur Windows : le conteneur `mongo-fiscal` ne démarre pas. Faire
  `git -c core.autocrlf=false checkout -- mongo/`.
- Jouer une commande de fiscal-service sans lever toute la pile :
  `docker compose -p grp-a -f docker-compose.yml -f prospera-recette/docker-compose.recette.yml -f prospera-recette/docker-compose.fiscal.yml --profile fiscal run --rm --no-deps fiscal-service node dist/<script>.js`
  (après `up -d --no-deps mongo-fiscal`).
