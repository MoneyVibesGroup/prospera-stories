# Journal du groupe C

> Écrit par le groupe C seulement. Lot : `PLAN-4-SESSIONS-2026-11-14.md` §5 (l'assurance).

## État

- **2026-11-14** : journal ouvert, lot pas encore commencé.
- **2026-11-15** : lot ouvert. **Machine** : le poste principal (Windows), le même que la session qui a tenu le lot de
  A et tient maintenant celui de B. Le lot de A (le plus lourd en Docker) est terminé ; C préfixe ses piles `grp-c`,
  ne publie sur l'hôte que le port de son service, et descend sa pile avec ses volumes à la fin de chaque story.
- **Lot de C, ordre** :
  1. ~~STORY-980~~ : **sinistres #1** (squelette de `prospera-sinistres-service`), docs #497 ;
  2. ~~STORY-981~~ : **assurance #20** (Node 24, client de Confluent, interrupteur `compta-cima`) ;
  3. **STORY-982** (`document-service` sur le socle ; le cabinet s'en sert) ← **prochaine étape** ; 4. STORY-983 ; 5. STORY-984 ; 6. STORY-985 ; 7. STORY-986 ; 8. STORY-987 ; 9. STORY-988 ;
     10. STORY-989.
- **Docker** : aucune pile ne tourne (`grp-c` descendue avec ses volumes).

## Dépôts tenus

`prospera-assurance-service` (« Rebase and merge » seul depuis le 2026-11-15 ; il acceptait encore les commits de
fusion), `prospera-ocr-service` (`document-service`), et les trois dépôts neufs :
`prospera-sinistres-service` (**`main` et `dev` posées le 2026-11-15**, « Rebase and merge » seul), `prospera-liaison-assureur-service`,
`prospera-assureur-fictif` (créés vides par l'utilisateur, branches à poser par STORY-984 et 986). Dans
`prospera-plateforme` (créé par B) : dossiers `contrats/assurance/`, `champs-sensibles/`, `classification-sante/`
seulement.

## Passations

- *(aucune)*

## Demandes aux autres groupes

- **→ B (2026-11-15) : la garde partagée (STORY-937) et `sinistres-service`** — **information**. Le squelette de
  `prospera-sinistres-service` garde ses modules par un port, `EtatDesModules`, alimenté aujourd'hui par
  `entitlement.changed` (D-980-2). Quand la garde partagée de STORY-937 sera publiée dans `prospera-plateforme`, C
  branchera ce port sur l'état publié dans une story de sa plage. Rien à faire chez B, sauf l'annoncer ici comme prévu.
- **→ B (2026-11-15) : le plafond `story_id_high_water_mark` vaut STORY-980** — **information**. C l'a relevé en
  écrivant sa première fiche ; c'est le maximum écrit toutes plages confondues. Les fiches 934 → 979 de B restent
  sous ce plafond : ne pas le faire redescendre en les écrivant.

## Réponses aux demandes reçues

- **← B (2026-11-15) : `prospera-plateforme` est prêt** — **lu**. STORY-983 et 987 y écriront dans les seuls dossiers
  de C (`contrats/assurance/`, `champs-sensibles/`, `classification-sante/`), en JSON Schema draft-07 fermé.
- **← B (2026-11-15) : contrat d'état publié figé** (STORY-932, `contrat-etat-publie-v1`) — **lu**. C n'en garde pas
  encore de copie : la bascule se fera avec la garde partagée (STORY-937).

## ⚠ Contrats

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

## Questions à l'utilisateur ou au PO

Retenu par défaut le 2026-11-15, selon la règle de l'utilisateur (« appliquer ce que je recommande, contestable après
coup ») ; détail dans `stories/STORY-980.md`, « Décisions retenues par défaut » :

- **D-980-1** : le plan dit « gate `assurance` » pour STORY-980 ; la spine (AD-3) et le manifeste disent **un gate par
  module**. Retenu : `SINISTRES_NOT_ENTITLED` et `EXPERTISES_NOT_ENTITLED`. Le code `assurance` reste celui de
  `prospera-assurance-service`.
- **D-981-1 / D-981-2** : en attendant l'état publié, la position de `compta-cima` se lit dans la configuration du droit
  `assurance` (même forme que le contrat figé), **éteint par défaut** ; refus nommé `COMPTA_CIMA_ETEINTE`, après le droit
  et avant la lecture seule. Si le PO veut la comptabilité CIMA **allumée par défaut** pour les cabinets, c'est un
  changement d'une ligne, mais il contredit « un nom absent se lit éteint ».
- **D-980-3** : **pas de KYC** dans le gate de `sinistres-service` (C2 ne demande que le droit du module). Si le PO veut
  le KYC de la compagnie à chaque requête, comme dans `assurance-service`, il le dit.

## Pièges rencontrés

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
- **Le client de Confluent ne crashe pas sur un `eachMessage` qui lève** : il journalise et relit le même message
  (`lib/kafkajs/_consumer.js`). La santé d'un consommateur bloqué se mesure donc aux échecs consécutifs par partition.
