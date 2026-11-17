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
  22. **STORY-1001** ← **suivante** : ouvrir (recevabilité, garantie, pièces attendues et courrier ; provision
     d'ouverture).
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

`prospera-assurance-service` (« Rebase and merge » seul depuis le 2026-11-15 ; il acceptait encore les commits de
fusion), `prospera-ocr-service` (`document-service`), et les trois dépôts neufs :
`prospera-sinistres-service` (**`main` et `dev` posées le 2026-11-15**, « Rebase and merge » seul), `prospera-liaison-assureur-service` (**`main` et `dev` posées par STORY-984**, « Rebase and merge » seul),
`prospera-assureur-fictif` (**`main` et `dev` posées par STORY-986**, « Rebase and merge » seul). Dans
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

## Réponses aux demandes reçues

- **← B (2026-11-17) : lot 3, `prospera-assureur-fictif` passe à D** — **ouverte**. `PLAN-4-SESSIONS-LOT-3-2026-11-17.md`
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
