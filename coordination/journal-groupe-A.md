# Journal du groupe A (poste principal)

> Écrit par le groupe A seulement. Lot 1 : `PLAN-4-SESSIONS-2026-11-14.md` §3 (terminé). **Lot 2 :**
> `PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §2 (STORY-905 → 919), **terminé le 2026-11-16**.

## État

### Lot 3 (depuis le 2026-11-17) — l'état courant

- **2. STORY-921 (en cours, 2026-11-17)** — hub de balance : 5e origine `comptabilite` (fiche `stories/STORY-921.md`). Contrat annoncé ci-dessous AVANT la fusion du code (PR de docs d'annonce séparée, fusionnée d'abord).
- ~~1. **STORY-920**~~ ✅ **DONE (2026-11-17)** — recette #24 (dev `68ef348`) ; compose racine du poste principal modifié en
  place (non versionné). Image `cgr.dev/chainguard/minio:latest`, `user: '0'` ; garde du profil réalignée (18/18,
  mutation rouge) ; pile neuve `grp-a` : recette `zone-franche` 5/5, `mc ls` voit les artefacts dans MinIO. Pile
  descendue avec ses volumes, verrou rendu. **Suite : STORY-921.**
- **Piège (920)** : l'image de Chainguard est distroless (ni `curl` ni `mc`) : pas de healthcheck `CMD` possible, MinIO
  reste en `depends_on: service_started` comme avant. Le client est `cgr.dev/chainguard/minio-client:latest-dev`
  (`--entrypoint sh`, sur le réseau de la pile). Un `docker compose down` sans le fichier fiscal laisse
  `fiscal-service` et `mongo-fiscal` : les passer tous les `-f` du `up`, ou `docker rm -f -v`.
- **Piège (920)** : le générateur de barrels de l'éditeur recrée des `index.ts` entre deux commandes : purger
  (`git ls-files --others`) dans la MÊME commande que le build.

### Lot 2 (depuis le 2026-11-16) — l'état courant

- **Consigne de l'utilisateur (2026-11-16)** : « prends le groupe A pour le terminer, celui du lot 2 » : STORY-905 →
  919 dans l'ordre du §2, sans s'arrêter ; remplaçante du §2 si une story attend B (917, 918 attendent B-945 ; 919
  attend B-949). C tourne sur le même poste : verrou `MoneyVibes_Apps\.verrou-docker`, piles `grp-a-…`.
- ~~1. **STORY-905**~~ ✅ **DONE (2026-11-16)** — balance #145 (dev `4a2abec`), bilan #173 (dev `663063d`). La garde
  d'accès lit `@LectureSeule()` ; `ROUTES_SANS_ECRITURE` déclarée (4 routes balance, 8 bilan) et balayée sur tous les
  contrôleurs ; 4 mutations rouges ; pile `grp-a-905` : dry-run en 200 avec un droit échu (témoin dev : 403).
- ~~2. **STORY-906**~~ ✅ **DONE (2026-11-16)** — balance #146 (dev `921b333`). `dossierId` publié ; `tag` servi par
  `…/referentiels/actifs` ; `409 REFERENTIEL_CONTRADICTOIRE` (`details`) ; import Sage au tag du dossier. Pile
  `grp-a-906` : SFD ⇒ `SN` refusé, `SFD-BCEAO` 201 ; témoin dev : `SN` accepté.
- ~~3. **STORY-907**~~ ✅ **DONE (2026-11-16)** — balance #147 (dev `7a885bb`), dossier #48 (dev `249b2ed`), fiscal #47
  (dev `8487497`). Paquet `togo@2026` régénéré (sha256 **`e8e94c84…`**, était `17d66e23…`) : `TPU`, `TPU_ACOMPTE`, `RSH`
  au catalogue ; conformité fiscal 65/65 (rs-fiscal) ; recette `zone-franche` 5/5 sur les branches. Le test TPU
  « CA 18 M » réaligné. ⚠️ **La procédure de publication du paquet (plus bas) cite encore `17d66e23…`** : l'empreinte
  à publier est désormais `e8e94c84…` (mise à jour ici).
- ~~4. **STORY-908**~~ ✅ **DONE (2026-11-16)** — balance #148 (dev `985e8d1`), bilan #174 (dev `982c2db`). Node 24,
  client de Confluent ; deux défauts du patron de 950 trouvés et corrigés (relance sur consommateur neuf ; `/health`
  borné à 5 s) — **demande à B et C** ci-dessous. Recettes `zone-franche` + `atelier-balance` **56/56 depuis `dev`**
  (valent aussi pour 907).
- ~~5. **STORY-909**~~ ✅ **DONE (2026-11-16)** — fiscal #48 (dev `a552d77`). Node 24, client de Confluent, les deux
  correctifs de 908 ; conformité 65/65 sous Node 24 ; pile : topic neuf vu en 6,6 s, `/health` 503 en 6,8 s sans Kafka,
  200 en 16 s au retour. Recette depuis `dev` jouée au gate de 910 (qui recette la même pile).
- ✅ **Relecture de `kit-cible` 1.0.0 (demande de B)** : `coordination/relecture-kit-cible-1.0.0-groupe-A.md`. Verdict :
  **1.0.1 nécessaire** (D1 bloquant : une clé en double dans un lot perd une ligne en silence ; D2 messages hors
  contrat ; D3 montants requis non appliqués ; trous de la suite : cloisonnement, atomicité, `controles`).
- ~~6. **STORY-910**~~ ✅ **DONE (2026-11-16)** — dossier #49 (dev `2e7e0dc`), kyc #28 (dev `d4932c6`). Node 24 : 113/113 et
  50/50 suites ; pile : topic neuf vu en 3,2 s par dossier, `/health` 503 en 3,1 s sans Kafka, 200 en 8 s au retour.
- ~~7. **STORY-911**~~ ✅ **DONE (2026-11-16)** — BFF #34 (dev `84120a5`), recette #21 (dev `979ec45`). BFF sous Node 24
  (41/41), coupe-circuit de 903 rejoué (20/20 en 200) ; piles de recette sur **MongoDB 8.0** ; garde du profil de
  recette réalignée (rouge sur `dev` depuis 933/938). **Recettes `pile` + `zone-franche` + `atelier-balance` : 63/63
  depuis `dev` sur MongoDB 8.0.38** — valent pour 909, 910 et 912.
- ~~8. **STORY-912**~~ ✅ **DONE (2026-11-16)** — balance #149 (dev `390775c`), bilan #175 (dev `d2e900b`). Garde partagée en
  double lecture ; pile : `LECTURE_SEULE` publié ferme l'écriture en 0,1-4,6 s, un rejeu ancien ne rouvre rien.
- ~~9. **STORY-913**~~ ✅ **DONE (2026-11-16)** — fiscal #49 (dev `6d424cc`), dossier #50 (dev `45f8ecd`). Garde
  partagée en double lecture dans fiscal et dossier.
- ~~10. **STORY-914**~~ ✅ **DONE (2026-11-16)** — balance #150, bilan #176, fiscal #50, dossier #51. Préavis de 30 j,
  horloge injectée, liste blanche d'export et d'états (FR-43) tenue par un invariant.
- ~~11. **STORY-915**~~ ✅ **DONE (2026-11-16)** — dossier #52. `axesDetermines` par ligne du portefeuille ; ticket fermé.
- ~~12. **STORY-916**~~ ✅ **DONE (2026-11-16)** — dossier #53. `PATCH /dossiers/{id}` journalisé ;
  `?type=MANDAT_ATTESTE` ; ticket « trois surfaces » : 1 et 3 fermées, **2 (complétude) ouverte**.
- ~~13. **STORY-917**~~ ✅ **DONE (2026-11-16)** — recette #22, BFF #35. Recettes sur le point de décision ; la console
  relaie les routes d'installation du moteur. Recettes depuis `dev` 87/87.
- ~~14. **STORY-918**~~ ✅ **DONE (2026-11-16)** — balance #151 (dev `e282c22`), bilan #177 (dev `68c6de8`), fiscal #52 (dev `a587b88`),
  dossier #54 (dev `d6dfac5`), recette #23 (dev `58ebabd`). Les gardes décident par l'état publié seul, **inconnu ⇒
  refus** ; mutation (ancienne garde rebranchée) rouge ×4 ; recettes sur pile neuve **91/91**, dont la nouvelle
  `cabinet-moteur` (inconnu refusé, installé par le moteur ouvert, `SUSPENDU` garde l'export). Deux défauts de recette
  corrigés au passage (`abonnement` dépendait de l'ordre ; `cabinet-moteur` sans axes).
- ~~15. **STORY-919**~~ ✅ **DONE (2026-11-16)** — fiscal #51. `/moi/droits` en double lecture dans la garde fiscale ;
  la décision reste celle du jeton.
- **Lot 2 de A terminé.** À l'ordre de la mise en service : `migrate:reamorcage-moteur` du catalogue (945) **avant** les
  images de 918 (D-918-3), sinon un cabinet installé avant le moteur est refusé.
- **Pièges (918)** : (1) une recette ne doit rien attendre d'une autre : sur une pile **neuve** (`down -v`), `abonnement`
  rendait 422 parce que `sfd-bceao@2.0` n'était déclaré que par `referentiel-par-dossier` ; une pile réutilisée cachait
  le défaut (917 « verte seule »). Rejouer les recettes sur une pile neuve avant de fusionner. (2) `zone-franche` lève
  fiscal-service en cours de passage : sur ce poste saturé, des appels voisins prennent `ECONNRESET` ; seule, sur la
  même pile, elle passe. (3) Un passage jest complet dans une image, sur un poste chargé, laisse des échecs de minutage :
  relancer **par chemin de fichier**, jamais par `-t` (qui charge toutes les suites).
- **Pièges (910-912)** : (1) l'éditeur régénère des `index.ts` dans **toutes** les copies, y compris celles de B, et
  casse les builds Docker depuis la copie de travail ⇒ construire les images depuis `git archive origin/dev`, et pour
  une recette, une surcouche qui remplace chaque `build` par ces images (`build: !reset null` + `image:`) ; ne jamais
  `git add -A` (un commit a embarqué 31 `index.ts`, retirés avant de pousser) ; (2) le DNS de Docker vers
  `auth.docker.io` tombe par moments : la directive `# syntax` échoue ⇒ `DOCKER_BUILDKIT=0` ; (3) un `sed` sur
  `production$` a changé `ENV NODE_ENV=production` en `production.` (BFF en boucle de redémarrage, corrigé).
- **Piège (913-916)** : `git archive` applique `core.autocrlf` du poste : l'archive d'une branche porte des CRLF
  et les empreintes des artefacts embarqués tombent (paquet fiscal `15de8f3e…` au lieu de `e8e94c84…`, 1 419 échecs
  sur bilan). **Toujours `git -c core.autocrlf=false archive`.** Contrôler par `sha256sum`, pas par `grep -c $''`
  (un JSON d'une ligne n'en montre aucun).
- **Piège (913-916)** : le DNS de la VM Docker est retombé (`registry.npmjs.org` introuvable) : un `npm ci` non
  caché échoue au build ; attendre, ou réutiliser une couche en cache.
- **Piège (909)** : le build de fiscal vérifie l'empreinte de ses artefacts (`paquets-depot/assets`,
  `completude-depot/assets`) ; une copie de travail Windows les a en CRLF ⇒ `PAQUET_DEPOT_INTEGRITE` au `nest build`.
  Réextraire en LF (`rm` puis `git -c core.autocrlf=false checkout --`) avant une image construite depuis la copie.
- **Piège (906)** : le `docker-compose.override.yml` racine monte le dépôt et lance `start:dev` ; une preuve sur
  image se lève avec `docker compose -f docker-compose.yml`. Le générateur de « barrels » de l'éditeur recrée des
  `index.ts` pendant la session : les purger avant chaque build.
- **Docker** : aucune pile de A ne tourne (piles de 918 descendues avec leurs volumes, verrou rendu). Deux conteneurs arrêtés d'une
  session précédente restent : `grp-a-kafka-1`, `grp-a-karapace-1`.

### Lot 1 (14 → 15/11), archivé

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
  Les stories s'enchaînent **sans s'arrêter** (la consigne d'un `/clear` après chaque story est annulée). **Ce
  journal reste la mémoire du lot** si le contexte d'une session est résumé.
- **Lot de A, ordre à jour** :
  1. ~~relecture §3.1~~ ;
  2. ~~restes §3.2~~ : ticket pour D écrit, procédure écrite (voir « Procédures »), question 300 retenue par
     défaut ; STORY-903 nommée (fiche juste avant de la coder) ; la partie bloquée de 901 (texte de la loi 2011-018 :
     un scan sans texte) est consignée dans sa fiche (D-901-5) ;
  3. ~~STORY-901~~ ;
  4. ~~STORY-345~~ : **fiscal #42** (base de rémunération versionnée, D-345-1 → 5) ;
  5. ~~STORY-902~~ : **auth #37**, puis **fiscal #43** (rôles du cabinet, rôle par défaut du vertical, fin de la
     compatibilité) ;
  6. ~~STORY-903~~ : **admin-panel #33** (coupe-circuit du catalogue, fan-out borné) ;
  7. ~~STORY-313~~ : **fiscal #44** (aiguillage, état daté d'un tiers) ;
  8. ~~STORY-314~~ : **fiscal #45** (montant à saisir, contre-métrique) ;
  9. ~~STORY-904~~ : **fiscal #46** (garde du jeu de répliques, sérialisation fermée, conformité) ;
  10. ~~relecture finale §3.4~~ : `coordination/relecture-finale-groupe-A.md`.
- 🏁 **LOT DE A TERMINÉ (2026-11-15).** Docker éteint ; passations écrites (notification `8916ee4`, auth `456035f`) ;
  relecture finale livrée. **Suite (consigne de l'utilisateur) : le lot de B** (§4, STORY-930 → 939), tenu par cette
  session, qui écrit désormais aussi dans `journal-groupe-B.md`. **Puis** la story du seed du catalogue. La relecture
  finale sera **rejouée** à la fin du lot de B.
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
`prospera-kyc-service`, `prospera-admin-panel-service`, `prospera-recette`. Plus ni `prospera-notification-service`
ni `prospera-auth-service` : tous deux sont cédés à B (voir Passations).

## Passations

- **2026-11-14 : `prospera-notification-service` cédé à B**, dernier commit sur `dev` : `8916ee4`
  (STORY-569 livrée). A n'y touche plus.
- **2026-11-15 : `prospera-auth-service` cédé à B**, dernier commit sur `dev` : **`456035f`** (STORY-902 fusionnée).
  A n'y touche plus. À reprendre par B :
  - STORY-938, droits à tiret dans les trois segments (demande ci-dessous) ;
  - la console, qui affiche « sans rôle métier » pour un membre qui reçoit le rôle par défaut. L'API
    d'administration rend le `tenantRole` stocké, pas le rôle effectif (écart de STORY-902).
- **2026-11-14 (nuit) : FE-069 remise à D** (sur demande de l'utilisateur), branche **`fe-069`** poussée
  dans `prospera-frontend-expert-comptable`, commit **`4148d65`**, sans PR. A ne touche plus ce dépôt.
- **2026-11-15 : FE-069 et `prospera-frontend-expert-comptable` REVIENNENT à A** (décision de l'utilisateur : « le
  travail a été remis au groupe D, qui n'a pas démarré ; il faut que quelqu'un la reprenne cette semaine »). Le
  journal de D dit « lot pas encore commencé » ; aucun commit de D sur `fe-069` (tête `4148d65`, la mienne). A tient
  le dépôt **jusqu'à la fusion de FE-069**, puis le rend à D par une ligne ici. D garde `frontend-admin-panel` et
  `prototypes/`. Amendement : `PLAN-4-SESSIONS-2026-11-14.md` §2 et §6.

## Demandes aux autres groupes

- **→ C (2026-11-17, information) : le compose racine et le profil de recette de A portent désormais MinIO de Chainguard**
  (`cgr.dev/chainguard/minio:latest`, `user: '0'`), STORY-920, recette #24. Vos piles MinIO sur ce poste (`grp-c-…`,
  `document-service` 995 → 997) n'ont plus besoin d'une image en cache ; un compose de pile à vous qui définit son propre
  `minio` prend la même image et le même `user`. Rien à rejouer côté A.

- **→ B et C (2026-11-16, STORY-908) : deux défauts du patron de supervision de 950, à vérifier chez vous.**
  Trouvés sur la pile de 908 (balance, bilan), corrigés chez A (balance #148, bilan #174) :
  1. **une relance ne peut pas réussir** : la supervision rappelle `connect()` sur **le même** consommateur ; le client de
     Confluent (1.11, `_consumer.js` : `state !== INIT` ⇒ « Connect has already been called elsewhere ») le refuse
     toujours. Un service démarré **sans Kafka** relance alors indéfiniment, même Kafka revenu (constaté : relance n°17
     en échec). Correctif : un consommateur neuf à chaque relance (`renouveler()` dans
     `supervision-consommateur.util.ts` de balance) ; test « chaque relance prend un consommateur NEUF » ;
  2. **`/health` attend ~30 s un broker absent** : `admin.connect()` n'est pas borné. Correctif : contrôle borné à 5 s
     (`DELAI_SANTE_KAFKA_MS`, `kafka.health.ts`).
  Services où le même code tourne (relevé sur `origin/dev`, non éprouvé par A) : **B** notification, paiement,
  catalogue ; **C** sinistres, assurance, document-service, liaison-assureur, assureur-fictif. Preuve à rejouer :
  arrêter Kafka, redémarrer le service, relancer Kafka, attendre `/health` 200.

- **→ B (2026-11-15) : le rôle métier effectif dans la liste des membres** —
  `tickets/TICKET-BACKEND-role-metier-absent-de-la-reponse-des-membres.md`. Bloque **FE-115** (février). C'est le même
  écart que la console « sans rôle métier » de la passation d'auth ci-dessus, vu côté cabinet.
- **→ D (2026-11-15) : nouveau point de départ.** FE-069 revient à A (voir « Passations »). D commence par **AP-38**
  (console) et par les **maquettes** des stories de février, dans l'ordre de `tri-frontend-fevrier-2026-11-15.md`
  §4.1 ; il reprend le dépôt du cabinet à la fusion de FE-069. Les fiches FE-112 → FE-125 sont écrites par A ; la
  plage libre de D devient **FE-126 → FE-139**.
- ~~**À D — reprendre FE-069 sur la branche `fe-069`**~~ *(close le 2026-11-15 : FE-069 revient à A ; le détail
  ci-dessous reste juste et sert à A)* (plan, ligne FE-069 du lot de D : « D la reprend où elle en est »).
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

- **→ D (2026-11-15) : le motif saisi pièce par pièce dans la revue KYC est perdu sans bruit** (reste de STORY-176)
  — **ouverte**. Le ticket est `tickets/TICKET-FRONTEND-motif-par-piece-revue-kyc.md`, et il devient **AP-38** (lot de
  D, n° 12).
  - Choix de A : **aucun changement de backend**. La console reporte les motifs par pièce dans le motif du dossier
    (`reason`, au plus 1 000 caractères), qui est déjà persisté, journalisé et envoyé au cabinet.
  - L'opérateur voit le texte composé avant d'envoyer, et un dépassement est refusé sans troncature.
  - D inscrit AP-38 à son tracker.

## Réponses aux demandes reçues

- **← B (2026-11-17) : le lot 3 de A** — `PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §2 : **dix stories légères, STORY-920
  → 929** (sept sans Docker, une seule recette complète, en 929). **B-967 attend A-921** (la 5e origine
  `comptabilite` du hub de balance).
- **← B (2026-11-17) : MinIO passe à `cgr.dev/chainguard/minio:latest`, avec `user: '0'`** — **servie par PR
  prospera-recette #24 (dev `68ef348`), STORY-920** : (1) compose racine du poste principal basculé en place ; (2) service
  `minio` de `docker-compose.recette.yml` en image Chainguard + `user: '0'`, garde du profil réalignée ; (3) recette
  `zone-franche` 5/5 sur pile neuve (artefacts fiscaux écrits dans MinIO, relus par `mc`). Pas de healthcheck (image
  distroless, comme avant). Ancien texte de la demande : **à faire par
  A : c'est STORY-920 du lot 3**. Norme décidée par l'utilisateur (`REGLES-DES-GROUPES.md` §1.6) : `minio/minio` a été retiré de Docker Hub,
  `quay.io` refuse le pull anonyme. Trois gestes : (1) le `docker-compose.yml` racine du poste principal ; (2) le
  service `minio` de `prospera-recette/docker-compose.recette.yml` ; (3) une recette qui écrit dans MinIO, rejouée sur
  pile neuve. Détail et preuve : journal de B, « Demandes aux autres groupes ».

- **← B (2026-11-15) : relecture du contrat d'état publié avant figeage (STORY-932, plan §7)** — **faite**. Relecture
  indépendante sur les sources (PRD moteur §3.1, FR-34, FR-35, FR-43, addendum §A-2 ; C2, C8, C13 ; spines du moteur et
  de la coque). Verdict : **figeable après 4 corrections bloquantes**, toutes faites avant la fusion (export dans
  l'Administration en `EN_INSTALLATION`, motif d'un code de module, 503 sans heure connue, règle du calcul écrite en
  entier). Le détail et les ajouts retenus : `stories/STORY-932.md`, « Relecture avant figeage ».
- **← B (2026-11-15) : relecture de la matrice et de la route de STORY-936** — **sans objet de contrat** : ni la matrice
  ni la route n'ont changé depuis l'étiquette `contrat-etat-publie-v1`. Leur conformité est prouvée par les 33 cas
  rejoués par le calcul et par la réponse réelle de la route, validée contre le schéma figé (`stories/STORY-936.md`,
  D-936-5).

- **← B (2026-11-16) : 945 fusionnée, recettes croisées rouges sur `dev`** — **traitée par STORY-917** (branche
  `story-917` de `prospera-recette`) : `balance` avant `bilan` dans les trois recettes, `reseau` avant
  `microfinance` ; abonnement (631, 280, 728) : acquis à l'offre puis installation par le moteur, droit
  `moteur:<plan>` ; 727 : package et vertical n'ouvrent plus rien. **Aussi corrigé** : le test du package qui
  évolue (l. 729-757, source `pack:…`), que la liste ne citait pas. **Close** : 917 fusionnée (recette #22),
  recettes depuis `dev` 87/87.
- **← B (2026-11-16) : `/moi/droits` servi pour A-919** — **close** : STORY-919 fusionnée (fiscal #51).

## ⚠ Contrats

- **2026-11-17 (STORY-921), AVANT la fusion du code** : `balance.submitted` v1, champ `origine` : l'énumération reçoit `comptabilite` (**ajout seul**, facultatif, aucun renommage). Publiée par `balance-service` (`docs/schemas/balance.submitted.v1.schema.json`, `INTEGRATION.md`, OpenAPI `OrigineBalance`). Pas de registre Avro/Karapace dans ce service : aucune compatibilité de registre à vérifier ; un émetteur existant ne change rien. `source` reste `direct`. La balance `comptabilite` est une balance GÉNÉRALE (complète, base fiscale, gel de la saisie), référentiel facultatif (résolu depuis le dossier), `origine` hors sceau. **→ B** : lisible pour B-967 dès la fusion de STORY-921 (SHA noté à la clôture).

## Front cabinet : revérification et tri du 2026-11-15

- **Demande de l'utilisateur** : remettre le front à niveau sans rien ajouter (FE-069, blocs A et B) ; transformer le
  bloc C en stories nommées et les trier pour février ; « vérifier tout avant », la logique ayant beaucoup changé
  (type de société, paquet fiscal…), en lisant les stories livrées sur la période.
- **Fait** : relecture du backend du 15/11 contre `origin/fe-069`, sur les ≈ 200 stories livrées depuis le 27/08 ;
  FE-069 étendue (A1 → A13, B1 → B25, 13 pts) ; 14 fiches neuves **FE-112 → FE-125** ; 23 fiches d'août réancrées ;
  FE-042 remplacée par FE-118 ; tracker frontend à jour (185 stories). Document de référence :
  **`tri-frontend-fevrier-2026-11-15.md`**.
- **Mes recommandations, appliquées** (règle de l'utilisateur, contestables après coup) — classées sans consigne
  explicite du PO : en février, FE-034 (cycle de la liasse, prérequis du dépôt), FE-038 (export de la liasse),
  FE-096 et FE-095 (classeur e-DSF, rejet), FE-118 (zone franche) ; après février, FE-119 (espace déclarant, aucune
  app pour le porter) et tout ce que le PO n'a pas nommé (§4.2 du tri, marqué ◆).
- **STORY-905, nommée par A** (fiche juste avant de la coder ; dépôts de A : balance, bilan) : *une simulation est une
  lecture*. Un abonnement échu met le service en lecture seule, mais `refuseeEnLectureSeule` juge sur la méthode HTTP
  (`bilan-service`, `read-models/guards/lecture-seule.ts` ; même patron dans balance) : les `POST …/dry-run` sont
  refusés en `403 ABONNEMENT_EXPIRE` alors qu'ils n'écrivent rien. Vu par le relevé du front (FE-069 A10).

## Questions à l'utilisateur ou au PO

- **STORY-300** : le mode de compatibilité par rôle des droits fiscaux (TENANT_ADMIN = tout, TENANT_USER = préparer)
  reste-t-il, et jusqu'à quand ? **Retenu par défaut (2026-11-15)**, selon la règle de l'utilisateur : « appliquer ce
  que A recommande, contestable après coup ».
  - Le mode reste jusqu'à la fusion de STORY-902, qui y met fin : un jeton sans droit fiscal est alors refusé.
    ✅ **Fait le 2026-11-15** : auth #37, puis fiscal #43.
  - STORY-902 attribue d'abord les droits `fiscalite:*` aux rôles du cabinet existants, pour que personne ne perde
    l'accès.
  - STORY-902 garde donc sa place (n° 5 du lot), sans attendre 313 et 314.
- **STORY-300, lecture du fichier déposé** : `GET /depots/:id/fichier` et `/audit` n'exigent que le rôle. Tout membre
  du cabinet lit donc le fichier déposé. **Retenu par défaut : on garde**, conformément à la règle d'or de 300 (la
  lecture suit le rôle). Si le PO veut un droit `fiscalite:declaration:lire`, il le dit.
- ✅ **Production : le seed du catalogue** — **réglée par STORY-940** (catalogue #49, recette #20 ; semis
  corrigé, migration pour les bases existantes, contournement de la recette retiré). Constat d'origine (STORY-901) : Le catalogue n'autorise aucun paquet `fiscal-tg-*`
  pour le module `declarations`, puisque `fiscalite` est retiré de l'offre. L'octroi échoue donc en
  `422 REFERENTIEL_INCOMPATIBLE`, et fiscal-service ne recevrait aucun paquet en production. La recette contourne
  par `PATCH /admin/modules/declarations`. **Demandée par l'utilisateur le 2026-11-15** : à faire **après le lot de
  B**, dans `prospera-platform-catalog-service` (dépôt de B) : corriger le seed, puis retirer le contournement de la
  recette.

## Dette relevée

- **Lot 2 (918, 2026-11-16)** :
  1. **Ingestion de balance** : le service d'ingestion autorise encore l'organisation par `OrgBalanceEntitlement` (identité
     de service, que la garde partagée ne modélise pas : `identite: 'UTILISATEUR'` seulement). À reprendre quand la
     matrice aura une identité de service (D-918-5).
  2. **`double-lecture.ts`** (balance, bilan, fiscal) : `decisionAncienne`, `memeDecision`, `libelle` ne servent plus
     depuis 918 ; copies identiques laissées en place, à retirer ensemble.
  3. **Recette `cabinet-moteur`** : installe par le `PUT` de la console (plan `CONSOLE_PUT`) ; passer à
     `POST /installations` quand balance et bilan serviront leurs routes de vérification (C13, D-918-4).
  4. **BFF** : `PATCH /dossiers/{id}` (916) n'est pas relayé pour le collaborateur ; le 409 de version doit rester muet
     côté écran. La console doit migrer vers les routes d'installation (lot de D).
  5. **Fiche dossier, surface 2 (complétude)** : ouverte, `tickets/TICKET-BACKEND-fiche-dossier-trois-surfaces.md`.

- **Audit fiscal (299)** : la suppression de la **dernière** entrée d'une chaîne est indétectable. Seul le rôle
  find+insert du compte l'empêche. L'ancre externe (empreinte de tête publiée) sera à décider avec la spine fiscale.

## Procédures

### Publier le paquet fiscal Togo 2026 au catalogue, à la mise en service (geste d'administration)

Le paquet a été modifié quatre fois le 14/11 (305, 307, 308, 901). En production, **aucun** paquet `fiscal-tg-*` n'a
jamais été publié, puisque le seed ne les autorise pas : on publie donc la version `2026.1` **une fois**, avec les
octets de `balance-service` du tag déployé.

**Qui :** un administrateur de la plateforme (`PLATFORM_ADMIN`), avec son jeton, contre `platform-catalog-service`.

1. **Prendre les octets.** Le fichier se lit dans le tag de `balance-service` effectivement déployé, extrait en **LF**
   (`git -c core.autocrlf=false show <tag>:<chemin>`), et non dans un checkout Windows. Empreintes au 2026-11-15
   (`origin/dev`) :

   | Code, version | Fichier (`balance-service/src/modules/referentiel/assets/`) | sha256 |
   |---|---|---|
   | `fiscal-tg-entreprise@2026.1` | `paquet-fiscal-togo-2026.json` | `e8e94c846227e9429b4e7e641bc7ea0c8364f774616359d22ce0970f97df0dc6` (STORY-907) |
   | `fiscal-tg-entreprise-zone-franche@2026.1` | `paquet-fiscal-togo-zonefranche-2026.json` | `da92a432ed175189d46a71f2c526579194cb9b250f04e017b2d31c380f360f74` |

   L'empreinte calculée doit être celle qu'épinglent `balance-service` et `prospera-dossier-service`. Sinon, on
   s'arrête : les copies ont divergé.
2. **Publier chaque paquet** :
   `POST /admin/referentiels/<code>/<version>/artifact` (multipart : `file`, `expectedChecksum=sha256:<empreinte>`).
   Le catalogue écrit l'objet, puis crée la version `ACTIVE`. Un **409** veut dire que `(code, version)` est déjà
   pris : une version publiée ne se réécrit jamais.
3. **Ouvrir le module.** Depuis STORY-940, le semis du catalogue donne à `declarations` les deux familles
   `fiscal-tg-*`. Sur une base semée **avant** 940, on joue une fois la migration du catalogue :
   `npm run migrate:familles-fiscales` (ou `node dist/migrations/familles-fiscales-de-declarations.js` dans l'image).
   Elle ajoute seulement, et nomme les paquets pas encore déposés au registre. Plus de `PATCH` à la main.
4. **Octroyer** à chaque cabinet abonné :
   `PUT /entitlements/<organisationId>/declarations`, corps `{ "versionCode": "1.0", "status": "ACTIVE", "referentiels": [{ "code": "fiscal-tg-entreprise", "version": "2026.1" }, …] }`.
   Un utilisateur du cabinet ne voit les droits qu'après le **renouvellement** de son jeton.
5. **Contrôler.** fiscal-service sert le paquet d'un exercice (`GET …/exercices/:exerciceId/paquet-fiscal`) avec la
   même empreinte ;
   `balance-service` applique le même artefact.

**Toute modification ultérieure du paquet** passe par une **nouvelle version** (`2026.2`…), publiée par les étapes 1
à 4. L'ancienne passe ensuite en `DEPRECATED` (`PATCH /admin/referentiels/<code>/<version>`). Elle ne passe **pas** en
`RETIRED` tant que des exercices y sont rattachés : le catalogue cesse alors de la servir et de l'octroyer.

## Pièges rencontrés

- **`bilan-service` aussi** : ses 72 JSON sortent en CRLF sous `core.autocrlf=true` ; son image refuse alors ses
  référentiels (« checksum invalide », 502 à la remise de `balance.created`). Il faut ré-extraire en LF
  (`git -c core.autocrlf=false checkout --`) AVANT de construire l'image.

- **Une suite qui ne COMPILE pas n'apparaît pas dans un filtre `grep "●.*›"`** : « Tests: 47 passed » venait des
  AUTRES suites. Il faut toujours lire `Test Suites: … failed` et lancer le fichier seul.

- **Un témoin « avant la correction » fait par `git switch dev` est FAUX** : le switch emporte les modifications
  non commitées, et `compose up --build` peut même ne pas recréer le conteneur (« Running »). Il faut mettre de côté
  (`git stash push -u`), puis `up --build --force-recreate`, et vérifier dans l'image que le code neuf est absent.
- **Un test qui compare à la constante qu'il teste ne mord pas** : la mutation de la borne du fan-out l'a montré. La
  valeur attendue s'écrit dans le test.

- **Deux sessions « groupe A » sur le même poste (2026-11-15)**. La même consigne a été donnée à deux sessions,
  qui ont codé STORY-345 dans le **même checkout** et se sont écrasé les fichiers. L'utilisateur a tranché : **une
  seule session porte le lot** (`moneyvibes-apps-32`). Avant d'écrire dans un dépôt partagé du poste : `git status`,
  et si des fichiers qu'on n'a pas écrits apparaissent, `ListAgents`, puis s'arrêter.
- `@Prop` de `@nestjs/mongoose` sur un champ typé par une **union** (`'A' | 'B'`) fait échouer le **chargement du
  module** (« Cannot determine a type »). `tsc` ne le voit pas ; l'invariant `app.module` et `docker compose up` le
  voient. Il faut toujours `type: String` avec un `enum`.

- La recette de `prospera-recette` fait `up` **sans** `--build` : reconstruire à la main l'image du service modifié.
- `prospera-fiscal-service` : `test:conformite` exige un MongoDB en jeu de répliques ; un `mongo:7` jetable lancé avec
  `mongo/demarrer-mongo-fiscal.sh` (scripts en LF), `-p 127.0.0.1:27020:27017`, `MONGO_HOTE_ANNONCE=localhost:27017`.
- La suite unitaire du fiscal est instable en parallèle complet : `-w 2`.
- Scripts `mongo/` de fiscal-service en CRLF sur Windows : le conteneur `mongo-fiscal` ne démarre pas. Faire
  `git -c core.autocrlf=false checkout -- mongo/`.
- Jouer une commande de fiscal-service sans lever toute la pile :
  `docker compose -p grp-a -f docker-compose.yml -f prospera-recette/docker-compose.recette.yml -f prospera-recette/docker-compose.fiscal.yml --profile fiscal run --rm --no-deps fiscal-service node dist/<script>.js`
  (après `up -d --no-deps mongo-fiscal`).
