# STORY-965 : la Créance (2), son état publié, le crédit du tiers et ses compteurs

Status: done

**Complexité :** moyenne-haute (un fait d'état neuf, au registre, publié par sept gestes existants dans leur transaction ;
une lecture par tiers qui emprunte la règle d'encours de D ; le premier droit de `paiement` lu hors du jeton)

**Épic :** EPIC-231 (la Créance, le crédit du tiers et l'amendement de `paiement`), d'`epics-distributeur-2026-11-13.md`
**Dépôt :** `MoneyVibesGroup/prospera-paiement-service`
**Plage :** groupe B, n° 10 du lot 3 (`coordination/PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §3, ligne 965).
**Dépend de :** STORY-963 (paiement #122, `716059c` sur `dev`).
**Débloque :** D-1059 (une facture ouvre sa Créance ; `commande` sort de `ENCOURS_NON_INSTALLE` pour les Créances).

**Sources lues :** EPIC-231 ; amendements de `paiement` du 2026-11-13 (`amendement-2026-11-13-distributeur.md` §1.2,
§1.4, §1.5 ; `amendement-2026-11-13-creances-distributeur.md` §3, §5, §6) ; manifeste `manifestes/paiement.manifest.ts` ;
fiche STORY-963 (« Pour la suite », D-963-7, D-963-12) ; fiches STORY-959 et 962 (droits par `/moi/droits`, cache
D-962-5) ; `prospera-plateforme/encours/` à l'étiquette `encours-v1` (STORY-1047, consommé, jamais modifié) ; journal
de D (« → B, ce que la bibliothèque d'encours lit », STORY-1049, `catalogue-faits@1`) ; auth-service
(`contrat/schemas/`, `scripts/schemas/registre.mjs`, STORY-942) pour le patron du registre.

---

## Pourquoi

STORY-963 a ouvert la Créance ; personne ne peut encore la LIRE en continu. `commande` refuse toute vente à crédit
(`ENCOURS_NON_INSTALLE`, D-1049) tant qu'elle ne reçoit pas l'état des Créances du tiers ; `recouvrement` et `pdv`
attendent le même fait. AD-9 : une seule règle d'encours (`encours@1`), qui lit des **états absolus** par clé, à
**révision croissante**. Ce fait, c'est `paiement.creance.changed@1` (amendement §1.4, §5). Il faut aussi qu'un
gestionnaire lise, pour un tiers, ce qu'il doit et ce qui lui est dû : le crédit du tiers et ses compteurs.

## Ce qui doit être vrai à la fin (plan du lot 3, §3, ligne 965)

| Exigence | Fait |
|---|---|
| `paiement.creance.changed@1` | état absolu d'une Créance à source, publié par l'outbox dans la transaction de CHAQUE changement : ouverture, encaissement constaté, déclaré, validé, affecté, contre-passé, clôture (D-965-1) |
| Révision | strictement croissante par Créance, donnée par la base (`$inc`) dans la transaction ; les changements concurrents se sérialisent (D-965-2) |
| Au registre en BACKWARD | `contrat/schemas/paiement.creance.changed.json`, `npm run schemas:enregistrer` / `schemas:compatibilite`, `npm run test:schemas` (D-965-4) |
| Crédit du tiers, compteurs | `GET /api/v1/creances/tiers/{tiersId}/compteurs?perimetre=` sous `paiement:creance:consulter` (hors du jeton) ; calcul par `encours@1` copiée à l'octet (D-965-5, D-965-6, D-965-7) |
| Annoncé | « ⚠ Contrats » du journal de B, AVANT la fusion du code |
| Preuves | unitaires et e2e ; conformité sur MongoDB `rs-paiement` (concurrence) ; registre Karapace ; fait vu sur le fil Kafka ; mutations ; `docker compose up` sain |

## Décisions (prises par défaut, contestables)

- **D-965-1 : le fait d'état est publié par les sept gestes qui changent une Créance, dans leur transaction.**
  `OuvrirLaCreance` (naissance, `OUVERTURE`), `RecevoirLaNotification` (`ENCAISSEMENT`), `DeclarerLEncaissement`
  (`DECLARATION`), `ValiderLEncaissement` (`VALIDATION`), `AffecterLEncaissement` (`AFFECTATION`),
  `AnnulerLEncaissement` (`CONTRE_PASSATION`), `SaisirLaCreance.cloturer` (`CLOTURE`). Chacun appelle
  `EtatsDeCreance.etablir(creance, cause, session)` dans `ecrire` et publie `faitsDEtatDeCreance(etat)` avec ses
  faits existants. Une garde (`etats-de-creance.invariant.spec.ts`) tient l'inventaire FERMÉ : tout fichier qui
  constate un encaissement, porte une validation ou une contre-passation, ou clôt une Créance doit y être. La
  `cause` est informative ; elle ne reprend pas les codes d'acte (`ENCAISSEMENT_DECLARE`…), que la garde de la
  séparation des pouvoirs réserve à un seul fichier. Les faits fins existants (`.materialisee`, `.soldee`,
  `.troppercu.constate`, `.cloturee`) restent.
- **D-965-2 : la révision et le dernier état vivent dans une collection à part, `etats_de_creance`.** Un document
  par Créance à source (`_id` = clef du registre), écrit par `EtatsDeCreance` seul, dans la session : `$inc:
  { revision: 1 }` et `$set` de l'état. AD-3 tient : la Créance ne reçoit aucun champ de solde ; le reste dû se
  calcule toujours des encaissements (`SoldesDeCreances`, relu DANS la session), et ce document n'est que le miroir
  de ce qui part sur le fil. Le `$inc` sur le même document sérialise deux changements concurrents de la même
  Créance (le second est rejeté `ECRITURE_CONCURRENTE`, comme la chaîne d'audit le faisait déjà) : l'état publié
  compte tout ce qui a été commis avant lui. La Créance est relue dans la session (une clôture commise entre la
  lecture d'un appelant et sa transaction se voit dans le statut publié).
- **D-965-3 : la charge** (enveloppe de `paiement` : `schemaVersion`, `eventId`, `orgId`, `occurredAt`) :
  `organisationId`, `creanceId` = `<source>:<sourceId>` (K-7), `cleRegistre`, `revision`, `cause`, `source`,
  `sourceId`, `tiersId`, `perimetre`, `livraisonId` (ou `null`), `devise`, `statut` (`OUVERTE` | `CLOTUREE`),
  `montantOrigineMineur`, `confirmeMineur`, `montantDeclareMineur` (le déclaré non validé, à part),
  `annuleMineur`, `restantCertainMineur`, `restantAfficheMineur`, `montantExigibleMineur` (= le certain : seul le
  confirmé réduit, §1.4), `tropPercuMineur`, `echeanceLe` (`AAAA-MM-JJ`), `lueLe` (l'instant de l'état, horloge de
  référence). Tous requis, modèle fermé. `composantes` (principal seul pour `FACTURE`) et l'ancienneté ne sont pas
  publiées : l'ancienneté se calcule de `echeanceLe` chez le lecteur ; `composantes` entrera en ajout facultatif
  avec la première source qui en a plusieurs.
  **Clé de partition : `orgId`** (l'enveloppe de l'outbox de `paiement`, un seul lieu) : l'ordre est garanti par
  organisation, donc par Créance ; le consommateur garde la plus haute `revision` par `creanceId`.
- **D-965-4 : le registre sans dépendance neuve.** `scripts/schemas/registre.mjs` appelle l'API REST du registre
  par `fetch` (Node 24) au lieu du client `@confluentinc/schemaregistry` ; `test/schemas.registre-spec.ts` joue la
  compatibilité sur des sujets jetables ; un test unitaire confronte le fait CONSTRUIT par le code au schéma
  (validateur réduit au sous-ensemble draft-07 employé, sans `ajv`). Seul le fait neuf (@1) a un schéma : les faits
  déjà codés restent en JSON sans registre (C5 amendé).
- **D-965-5 : le crédit du tiers et ses compteurs, calculés par `encours@1`, copiée à l'octet.**
  `src/vendor/encours/encours.ts` et `vecteurs-or.json` sont les blobs de l'étiquette `encours-v1` (`b061cec`,
  sha256 `4b5c9bff…` et `23e3c260…`, gardés par un test qui rejoue aussi les dix vecteurs d'or). `paiement` présente
  à `calculerEncours` les derniers états du tiers (`creances` PRESENTE), ses trop-perçus (`creditsTiers` PRESENTE)
  et **l'engagement `ABSENTE`** : il ne sert **aucun encours** (amendement §1.5 ; l'engagement est à `commande`, le
  plafond se juge chez elle, D-1049). Il sert, par devise : `nombreDeCreancesOuvertes`, `nombreDeCreancesEchues`,
  `restantCertainMineur`, `restantAfficheMineur`, `echuCertainMineur`, `plusAncienneEcheance`, `retardMaxJours`,
  `creditDuTiersMineur`, `versionEncours`. Le compte des échues applique le prédicat de l'échu de la règle (ouverte,
  échéance strictement passée, reste certain > 0) ; un test vérifie que la somme des échues comptées égale l'échu
  de la règle. Une ligne par devise, jamais de total (STORY-284).
- **D-965-6 : le crédit du tiers, dans cette version, ce sont les trop-perçus constatés** (FR-248 : « un
  trop-perçu […] devient un crédit du tiers »). C'est le seul argent reçu sans dette que `paiement` constate
  aujourd'hui. L'acompte avant facture, l'avoir sur facture payée, l'imputation sur la Créance désignée ou l'échue la
  plus ancienne, le remboursement, et le fait `paiement.credit-tiers.changed@1` sont une story suivante (le motif des
  topics de `paiement` refuse aussi le tiret aujourd'hui : il faudra l'élargir). D'ici là, `tropPercuMineur` est
  dans `paiement.creance.changed@1`, et D peut en tirer un `FaitCreditTiers` (`creditId = TROP_PERCU:<creanceId>`,
  même `revision`). **Une Créance du périmètre d'un freelance ne publie AUCUN état** sur ce topic (prix du freelance,
  §1.2) : elle aura `paiement.creance-freelance.changed@1` avec la story du freelance.
- **D-965-7 : `paiement:creance:consulter` est lu HORS du jeton**, par `GET {AUTH_SERVICE_URL}/moi/droits`
  (`droits ∪ droitsHorsJeton`), derrière un cache `(membre, organisation, dv)` de 60 s au plus, borné à 10 000
  membres, l'heure lue sur l'horloge de référence (patron de la comptabilité, D-962-5). Garde PAR ROUTE
  (`GardeDuDroitHorsJeton`, `@DroitHorsJetonRequis`), après la garde du module ; les routes existantes ne changent
  pas, et les sept droits du jeton restent lus dans `perms[]` sans appel à `auth` sur un chemin d'argent. Refus :
  403 `PERMISSION_DENIED` (le code de `DroitsGuard`, `details.droit`) ; auth injoignable, en panne, hors contrat ou
  adresse non configurée : 503 `DROITS_INDISPONIBLES` (fermé). `AUTH_SERVICE_URL` est **facultative** (absente, ces
  routes ferment ; le reste du service démarre comme avant) ; `AUTH_SERVICE_TIMEOUT_MS` (3 000 par défaut). Le claim
  `dv` du jeton est projeté sur l'utilisateur. Pas de consommateur d'`identity.droits.changed@1` : `dv` et 60 s
  bornent l'écart (comme D-962-5).
- **D-965-8 : `HorlogeDeReference` entre dans `paiement`** (port + `HorlogeDeLaPlateforme`), pour `lueLe`, le jour de
  l'échu (`le`) et l'heure du cache. Aucune décision neuve ne lit `Date.now()`.
- **D-965-9 : le consommateur de `facturation.facture.emise@1` est REPORTÉ.** D n'a pas fixé la charge du fait (rien
  dans son journal au 17/11) ; la route `PUT /creances/sources/FACTURE/{factureId}` (STORY-963) reste le chemin de
  D-1059. Le consommateur appellera `OuvrirLaCreance`, qui publie déjà l'état.
- **D-965-10 : la portée du portefeuille n'est pas appliquée.** L'annexe B ouvre `paiement:creance:consulter` au
  COMMERCIAL et au FREELANCE « pour leur portefeuille » ; `paiement` ne connaît pas les portefeuilles. La route sert
  tout tiers de l'organisation à qui a le droit. À reprendre quand `paiement` lira la portée (`reseau.portee.changed@1`).
- **D-965-11 : le manifeste `paiement` reçoit la route en `routesLectureSeule`** (amendé dans la PR de l'annonce) ;
  la copie du catalogue suivra à la prochaine story de B au catalogue.
- **D-965-12 : aucune reprise des Créances déjà ouvertes.** Une Créance à source ouverte avant cette story (pile de
  963) n'a pas d'état rangé : elle publiera sa révision 1 à son prochain changement. Aucune n'existe en réel.

## Contrat touché (annoncé dans « ⚠ Contrats » du journal de B AVANT la fusion du code)

- **Topic neuf `paiement.creance.changed`** (contrat `@1`, `schemaVersion: 1`), producteur unique `paiement-service`
  (outbox), clé `orgId`, schéma au registre (sujet `paiement.creance.changed-value`, BACKWARD). Charge : D-965-3.
- **Route neuve** `GET /api/v1/creances/tiers/{tiersId}/compteurs?perimetre=SOCIETE|FREELANCE:<id>`, droit
  `paiement:creance:consulter` (hors du jeton), garde du module → `{ tiersId, perimetre, le, parDevise: [...] }`
  (D-965-5). Refus : 400 `CREANCE_INVALIDE` (`tiersId`), 400 de validation (`perimetre`), 403
  `PAIEMENT_NOT_ENTITLED`, 403 `PERMISSION_DENIED`, 503 `DROITS_INDISPONIBLES`.
- **Collection neuve** `etats_de_creance` (index `{ organizationId, tiersId, perimetre }`).
- **Variables neuves, facultatives** : `AUTH_SERVICE_URL`, `AUTH_SERVICE_TIMEOUT_MS`.
- **Lu chez B (auth)** : `GET /api/v1/moi/droits` (contrat 1.1.0) et le claim `dv`.
- **Manifeste** : la route en `routesLectureSeule`.
- Rien d'existant ne change de forme.

## Ce qui a été livré

**prospera-paiement-service #123**, rejouée en rebase sur `dev` : **`96c385f`**, `12b67f1`, **`ad35786`** (branche
`fc7a5f0`, `40d3414`, `c651826` ; arbre identique). Annonce avant le code : prospera-stories #648 (`5accd2c`).

- `src/application/creances/etat-de-creance.ts` : la charge, `construireEtat`, `publieSonEtat`, `faitsDEtatDeCreance`,
  les causes ; `etats-de-creance.service.ts` (`EtatsDeCreance`, seul écrivain) ;
  `modules/creances/schemas/etat-de-creance.schema.ts`.
- Les sept gestes : `ouvrir-la-creance`, `saisir-la-creance` (clôture), `recevoir-la-notification`,
  `declarer-`, `valider-`, `affecter-`, `annuler-l-encaissement` ; garde `etats-de-creance.invariant.spec.ts`.
- `compteurs-du-tiers.ts`, `compteurs-du-tiers.controller.ts`, `dto/compteurs-du-tiers.dto.ts`,
  `dto/identifiant-de-tiers.pipe.ts` ; `src/vendor/encours/` (`ORIGINE.json`, copie de `encours-v1`).
- `src/common/droits-hors-jeton/` (source HTTP, cache, garde, module) ; `src/common/horloge/` ; `dv` sur
  l'utilisateur ; `authService` dans la configuration.
- `contrat/schemas/paiement.creance.changed.json`, `scripts/schemas/registre.mjs`, `test/jest-schemas.json`,
  `test/schemas.registre-spec.ts` ; scripts `test:schemas`, `schemas:compatibilite`, `schemas:enregistrer`.
- La garde STORY-275 (`geste-sensible-sous-controle`) accepte `publier: (p) => [...faitsDAnnulation(p), …]` ;
  le compte des dépendances d'`AffecterLEncaissement` passe à sept (STORY-648 → 965).

## Preuves

- **Node 24** (étage `verification`, image construite depuis `git -c core.autocrlf=false archive` de `fc7a5f0`,
  conteneur nommé) : paquets 130/130 ; service **345 suites, 4 662 passés, 2 sautés, 0 échec**. Les deux commits
  suivants ne touchent que des tests (conformité, registre, une spec pure), joués sur le poste.
- **Poste** : `tsc` vert ; lint des fichiers touchés vert ; e2e `creances-compteurs`, `creances-ouverture`,
  `creances-saisie`, `gate-acces`, `demandes`, `recette-uj1` : 90/90. La route des compteurs : 200 calculé par la
  règle ; 403 `PAIEMENT_NOT_ENTITLED` avant le droit ; 403 `PERMISSION_DENIED` quand `/moi/droits` ne sert pas le
  droit, même s'il est dans `perms[]` ; 503 `DROITS_INDISPONIBLES` ; 400 sans périmètre ou tiers mal formé.
- **Conformité sur un vrai MongoDB en jeu de répliques** (`rs-paiement`, pile `grp-b`,
  `test/etats-de-creance.conformite-spec.ts`, avec les vrais `OuvrirLaCreance`, `DeclarerLEncaissement`,
  `SaisirLaCreance`, `EtatsDeCreance`, `SoldesDeCreances`, `EcritureDArgent`, `JournalAudit`, `OutboxService`) :
  - 10 factures du même tiers ouvertes deux fois chacune, en même temps ⇒ 10 états à la révision 1, 10 faits ;
  - **20 déclarations concurrentes de 5 000 sur la même Créance ⇒ révisions publiées 1 → 21, sans trou ni
    doublon** ; le dernier état égale le reste dû recalculé des encaissements (certain 100 000, affiché 0, déclaré
    100 000) ;
  - les compteurs du tiers lus sur les états rangés : 10 ouvertes, 4 échues, 1 000 000 certain, 900 000 affiché,
    400 000 échus, retard 16 jours ;
  - une clôture publie `CLOTUREE` à la révision 2 et sort la Créance des compteurs ; un autre périmètre ne voit rien.
  `creances-ouverture` et `creances-upsert` restent verts (13/13 en tout).
- **Karapace 6.2** (surcouche `docker-compose.socle.yml`) : `schemas:enregistrer` ⇒ sujet
  `paiement.creance.changed-value`, id 1, configuration `BACKWARD` ; `schemas:compatibilite` sous Node 24 :
  compatible, code 0 ; `test:schemas` 7/7 (ajout facultatif compatible ; propriété requise ajoutée, type changé,
  propriété retirée refusés). ⚠️ Limite constatée : Karapace accepte qu'une valeur sorte d'une énumération ; un test
  unitaire garde que les énumérations du schéma égalent celles du code.
- **Le fait sur le fil** : service levé (relais d'outbox réel), conformité jouée avec `CONFORMITE_GARDER_FAITS=1`,
  puis `kafka-console-consumer` sur `paiement.creance.changed` : **31 messages** de l'organisation de la preuve,
  clé = `orgId`, 10 `OUVERTURE`, 20 `DECLARATION`, 1 `CLOTURE`, révisions 1 → 21 sur la Créance déclarée.
- **Mutations : 32 sur 32 rougissent sur une assertion** (deux rougissaient d'abord par compilation, réécrites).
- **`docker compose up` sain** (image `runtime` depuis l'export, `up --no-build --no-deps`, pile `grp-b` : kafka,
  redis, `mongo-paiement`, karapace, paiement) : `/api/v1/health` **200** ; `Mapped
  {/api/creances/tiers/:tiersId/compteurs, GET}` ; sans jeton : 401 ; index
  `organizationId_1_tiersId_1_perimetre_1` de `etats_de_creance` créé. Pile descendue (`down -v`), **verrou Docker
  pris de façon atomique (13:35) et rendu (14:55)**.

## Pour la suite

- **Le crédit du tiers (2)** : acompte avant facture, avoir sur facture payée, imputation (Créance désignée, puis
  l'échue la plus ancienne), remboursement par un ordre, `paiement.credit-tiers.changed@1` (élargir le motif des
  topics au tiret), droit `paiement:credit-tiers:imputer` (hors du jeton, par la même garde).
- **Le consommateur de `facturation.facture.emise@1`** (D-965-9), reporté : il appelle `OuvrirLaCreance` dès que D
  a fixé la charge du fait.
- La portée du portefeuille sur la route des compteurs (D-965-10) ; la copie du manifeste au catalogue (D-965-11) ;
  `paiement.creance-freelance.changed@1` avec la story du freelance.
