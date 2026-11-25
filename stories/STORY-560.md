# STORY-560 : AD-13 est amendé — un coffre-fort de secrets de canal, adossé au mandat écrit du client

Status: done (2026-11-25 — prospera-fiscal-service#63, `dev` cf8b583 ; lot 7 de D, n° 1)

**Épic :** EPIC-027 — Natures d'accès et habilitations graduées
**Service :** `fiscal-service` (`:3012`) — socle
**Points :** 8 · **Sprint :** S29
**Origine :** **décision PO du 2026-08-28** — le dépôt automatisé est retenu. Le coffre-fort passe
donc du « pas sur le chemin critique » au **prérequis**.
**Débloque :** **STORY-561** (le connecteur). Sans cette story, le connecteur n'a rien pour
s'authentifier.
**Réf. :** **AD-13** *(amendé ici)* · **NFR-F05** · **FR-F02** · **STORY-301** (attestation de
mandat, EPIC-043, S20) · addendum PRD fiscalité §coffre-fort

---

## ⛔ Cette story amende la colonne vertébrale — ce n'est pas une évolution de configuration

**AD-13, tel qu'il est écrit aujourd'hui :**

> **Rule:** en v1, aucun identifiant ni mot de passe de portail administratif n'entre dans le
> service, sous aucune forme, y compris en champ libre. **L'introduction d'un coffre-fort est un
> amendement de cette colonne vertébrale, pas une évolution de configuration.**

⇒ La spine **prévoyait ce jour** et exigeait qu'il soit acté comme tel. **C'est ce que fait cette
story** : AD-13 devient *« aucun secret n'entre hors du coffre-fort, et aucun ne sort en clair »*.

⚡ **AD-12, lui, n'a pas besoin d'être amendé** — il avait déjà tranché : *« le dépôt assisté et un
futur connecteur automatisé sont **deux implémentations du même port** »*. L'architecture attendait
le connecteur ; elle n'attendait pas les secrets.

## Ce que NFR-F05 exige, et qui n'est pas négociable

> Chiffrement fort, rotation, MFA, séparation des rôles, journalisation de chaque accès, **et sans
> que le collaborateur ait à connaître le secret**.

La dernière clause est la plus structurante : **le collaborateur du cabinet ne voit jamais le mot
de passe du client**. Elle interdit l'implémentation naïve (« un champ mot de passe dans la fiche
dossier ») et impose que le secret soit **déposé par son propriétaire** et **utilisé sans être
lu**.

## Le mandat : ce qui rend l'acte légitime

⛔ **Un connecteur qui agit avec les identifiants d'un client sans mandat écrit n'est pas un
produit, c'est un risque.** `FR-F57` / **STORY-301** ont déjà livré l'**attestation de mandat à la
création du dossier** — cette story s'y adosse plutôt que d'inventer un second consentement.

Le mandat doit être **spécifique** : « déposer en mon nom sur GUDEF » n'est pas couvert par une
lettre de mission générale. Il porte le canal, la portée, et la date.

## Périmètre

**Inclus**

- Un **coffre-fort dédié** : secrets chiffrés au repos avec une clé qui ne vit pas dans la base,
  scopés `{orgId, dossierId, canal}`, jamais globaux.
- **Le secret ne sort jamais en clair vers la couche applicative.** Le connecteur reçoit un
  **jeton d'usage à durée courte**, à usage unique, lié à un dépôt identifié. ⚡ C'est ce qui rend
  une fuite de logs ou de dump mémoire non exploitable.
- **Dépôt du secret par son propriétaire.** Le client saisit ses identifiants dans un formulaire
  qui écrit **directement** au coffre ; le collaborateur voit un état (« déposé », « expiré »,
  « révoqué »), jamais une valeur.
- **Révocation immédiate et souveraine.** Le client révoque : les secrets sont détruits, les
  dépôts en cours s'arrêtent, et le canal retombe sur le **dépôt assisté** (STORY-332/333). ⚡ La
  révocation ne casse jamais la capacité à déclarer — elle change seulement le chemin.
- **Rotation** : un secret porte une date d'expiration ; l'échéance approchant, elle est signalée
  **avant** qu'un dépôt échoue, pas après.
- **Journalisation de chaque accès** au journal d'audit existant (AD-10, AD-19) : qui, quand, pour
  quel dépôt, avec quel résultat. ⛔ **Jamais la valeur**, jamais un fragment.
- **Le mandat est vérifié à chaque usage**, pas à l'enregistrement. Un mandat expiré ou révoqué
  bloque l'usage même si le secret est valide.

**Hors périmètre**

- Le connecteur lui-même : **STORY-561**.
- Stocker un **facteur MFA**. ⛔ Interdit, et pas seulement par prudence : un second facteur qu'on
  stocke n'est plus un second facteur. Le traitement du MFA est un sujet du connecteur, et sa
  réponse y est un **relais vers l'humain**, jamais un contournement.
- Un coffre partagé entre organisations, ou un secret « du cabinet » utilisable sur plusieurs
  dossiers. L'isolation est absolue (NFR-F06).

## Critères d'acceptation

1. Un secret déposé n'est **jamais lisible** par une route, un log, un export ou une réponse
   d'erreur. Témoin : une recherche de la valeur dans les logs d'un dépôt complet ne la trouve pas.
2. Le collaborateur du cabinet peut **déclencher** un dépôt sans jamais pouvoir **lire** le secret.
3. Un jeton d'usage est **à usage unique** et expire ; le rejouer est refusé.
4. Une révocation détruit le secret, interrompt les dépôts en cours, et le canal **bascule sur le
   dépôt assisté** — témoin exécutable : déclarer reste possible après révocation.
5. Un mandat absent, expiré ou révoqué **refuse l'usage** avec un code publié, même avec un secret
   valide.
6. Chaque accès est journalisé avec son dépôt de rattachement ; **aucune entrée ne contient la
   valeur ni un fragment**.
7. L'expiration d'un secret est signalée **avant** l'échéance, avec le délai restant.
8. **Non-régression AD-13** : hors de ce coffre, aucun chemin n'accepte un identifiant de portail —
   y compris les champs libres, les notes de dossier et les pièces jointes. Une garde le vérifie.

## Notes

- ⚠️ **Cette story ouvre la surface de compromission que AD-13 protégeait.** C'est assumé et
  décidé ; ce qui ne l'est pas, c'est de l'ouvrir plus large que nécessaire. Chaque critère
  ci-dessus réduit la surface : scope étroit, jeton court, valeur jamais lue, révocation
  souveraine, journal sans secret.
- ⚡ **La revue de sécurité de cette story n'est pas optionnelle.** C'est le premier composant du
  produit qui détient des identifiants d'un tiers vers un système d'État.
- ⚠️ **Mettre à jour la spine et le tracker.** AD-13 est amendé, NFR-F05 passe de « aucun secret
  n'est stocké en v1 » à ses exigences de mise en œuvre. Un document d'architecture périmé
  **encode l'ancienne vérité et la garde active** — ce dépôt l'a déjà payé quatre fois.

---

## Mise à jour du 2026-11-25 (lot 7 de D, avant le code)

> Relue au rituel : l'entrée du tracker (`ready-for-dev`, même titre, mêmes arbitrages : mandat spécifique vérifié à
> chaque usage, aucun facteur MFA, révocation souveraine, revue de sécurité) et cette fiche concordent. Le plan (§4)
> fixe « Fini quand » : la fiche écrite, et la story est le **préalable de 561**. Dépôt : `prospera-fiscal-service`,
> partagé par dossier avec C (D-L7-1) ; dossiers de D neufs : `src/{modules,application,domain,adapters}/coffre-secrets`.
> Les décisions ci-dessous complètent le périmètre ; elles sont contestables et appliquées par défaut.

### Décisions

- **D-560-1 — « Fini quand »** : les huit critères d'acceptation ont chacun un témoin exécutable (tests unitaires,
  e2e, MongoDB réel), l'amendement d'AD-13 est écrit dans la spine, et 561 trouve un port prêt à brancher
  (`UsageSecretDeCanal`). Le connecteur, l'écran et l'envoi du lien au client n'en font pas partie.
- **D-560-2 — Un module à part, `coffre-secrets`**, dans les dossiers de D. Les dépôts assistés (`depots`) n'en
  dépendent pas : une garde vérifie qu'aucun fichier de `depots` n'importe le coffre (c'est ce qui rend la
  révocation sans effet sur la capacité de déclarer, critère 4).
- **D-560-3 — Le canal est un code opaque** (`^[a-z0-9]+(-[a-z0-9]+)*$`, 32 caractères au plus : le périmètre d’audit en tient 64), choisi par le cabinet
  et porté par le chemin. Aucun nom de portail n'entre dans le code (AD-12) ; le coffre ne vérifie pas que le code est
  déclaré par un paquet : 331 décrit les canaux comme une donnée, 561 refusera un code non déclaré. Portée du secret :
  `{organisation, dossier, canal}`, jamais globale ni partagée entre dossiers (NFR-F06).
- **D-560-4 — Le mandat de canal, spécifique** (patron STORY-301 : la référence de l'écrit signé, sa date) : il porte
  le canal (par sa portée), les **actes** couverts (`DEPOSER`, `SUIVRE`, au moins un), la date de signature (pas dans
  le futur) et la date de fin de validité (après aujourd'hui). Il est **attesté par le cabinet** (droit
  `fiscalite:declaration:deposer`), révocable, renouvelable (une attestation neuve remplace la précédente, version + 1).
  ⛔ Il est vérifié **à chaque usage** : à l'émission d'un lien de dépôt, au dépôt du secret, à l'émission d'un jeton
  d'usage et à sa consommation. Le mandat de l'entreprise de STORY-301 ne suffit pas (il ne nomme ni canal ni acte).
- **D-560-5 — Le secret est déposé par son propriétaire, sans compte** : le cabinet émet un **lien de dépôt** (jeton
  de 256 bits, haché en base, rendu une seule fois, valable 72 h, à usage unique) qu'il remet au client hors du produit
  (l'envoi par `notification` est un reste) ; le client poste `{ jeton, identifiant, motDePasse, expireLe }` sur une
  route publique, le jeton **dans le corps**, jamais dans l'adresse (les journaux d'accès gardent les adresses). La
  réponse lui rend, une seule fois, un **jeton de révocation**. Le collaborateur ne voit qu'un état.
- **D-560-6 — Le chiffrement** : AES-256-GCM en enveloppe — une clé de données aléatoire par secret, elle-même chiffrée
  par la **clé maîtresse `COFFRE_CLE_MAITRE`** (32 octets en base64, variable d'environnement, **jamais en base**) ;
  données additionnelles authentifiées = `organisation|dossier|canal|version` (un chiffré déplacé sur une autre portée
  ne se déchiffre pas) ; `COFFRE_CLE_ID` (défaut `cle-1`) est rangé avec chaque secret pour la rotation de la clé
  maîtresse. **Sans clé, le service démarre** : le coffre est `NON_CONFIGURE` (503 `COFFRE_NON_CONFIGURE` au dépôt et
  à l'usage), tout canal retombe sur l'assisté ; une clé mal formée **empêche le démarrage**. Aucun `.env` n'est créé :
  les tests posent leur clé eux-mêmes ; la clé d'un environnement réel est un geste de l'utilisateur.
- **D-560-7 — Le jeton d'usage** (port `UsageSecretDeCanal`, en mémoire du service, **aucune route HTTP**) : 256 bits,
  haché, **5 minutes**, à usage unique, lié à un dépôt identifié (`depotId`) et à un acte, et aux versions du secret et
  du mandat en vigueur à son émission. La consommation est atomique (une seule réussit) ; le rejeu, l'expiration, un
  autre dépôt ou une version changée sont refusés par un code publié. Le clair n'existe que dans le rappel
  `travail(identifiants, controle)` : le tampon déchiffré est mis à zéro après, et `IdentifiantsDeCanal` se masque
  dans `JSON.stringify`, `util.inspect` et `String()`. `controle.toujoursAutorise()` relit la portée : une révocation
  pendant l'usage l'arrête (critère 4 ; 561 l'appelle entre deux étapes).
- **D-560-8 — La révocation** : par le **client** (jeton de révocation, route publique, toujours ouverte, quel que
  soit l'état de l'abonnement du cabinet) ou par le **cabinet sur instruction du client** (droit `deposer`). Le chiffré
  et la clé enveloppée sont **effacés** (seul reste un état `REVOQUE` daté), les jetons d'usage et liens non consommés
  de la portée sont annulés, le canal passe `ASSISTE` (raison `SECRET_REVOQUE`). La révocation du mandat annule aussi
  jetons et liens ; le secret reste, inutilisable.
- **D-560-9 — L'expiration** : le propriétaire déclare la date de fin de son secret (365 jours au plus : la rotation
  est forcée) ; à **15 jours** ou moins, l'état rend `aRenouveler: true` et `joursRestants` (de même pour le mandat).
  Un secret expiré n'est plus utilisable et le canal passe `ASSISTE`. Le signal est lu dans l'état du canal ; une
  liste du cabinet et une notification sont des restes.
- **D-560-10 — Le journal** : chaque accès écrit au journal d'audit chaîné (AD-10, base `fiscal_service_audit`),
  périmètre `coffre:<dossier>_<canal>`, dans la transaction de l'écriture : `COFFRE_MANDAT_ATTESTE`,
  `COFFRE_MANDAT_REVOQUE`, `COFFRE_LIEN_EMIS`, `COFFRE_SECRET_DEPOSE`, `COFFRE_SECRET_REVOQUE`,
  `COFFRE_JETON_EMIS`, `COFFRE_SECRET_UTILISE` (dépôt de rattachement, résultat), `COFFRE_USAGE_REFUSE` (code). ⛔
  Aucune entrée ne porte la valeur, un fragment, ni un jeton (seul l'identifiant du lien ou du jeton).
- **D-560-11 — La garde AD-13** (critère 8) est **structurelle** : hors du coffre, aucun DTO ni schéma MongoDB ne
  nomme un champ d'accès (mot de passe, identifiant de portail, secret, certificat, code MFA…), toute route d'envoi de
  fichier est connue, et la validation globale refuse un champ non déclaré (`forbidNonWhitelisted`). Elle ne lit pas
  le **contenu** d'un champ libre : une détection par motif serait une fausse sûreté ; elle prouve que le service
  n'offre aucun chemin pour un identifiant, ce que disait AD-13 (« y compris en champ libre »).
- **D-560-12 — Aucun droit neuf** : le cabinet agit sous `fiscalite:declaration:deposer` (attester et révoquer le
  mandat, émettre un lien, révoquer le secret, émettre un jeton d'usage) ; lire l'état du coffre demande l'accès
  fiscal et le dossier dans la portée de l'appelant (même 404 hors portée). Le manifeste `declarations` et
  `auth-service` ne changent pas ; la séparation des rôles (NFR-F05) tient par construction : le propriétaire dépose,
  le cabinet déclenche, personne ne lit.
- **D-560-13 — Stockage** : deux collections neuves, `coffre_canaux` (un document par portée, index unique) et
  `coffre_jetons` (liens, révocations, usages ; empreinte unique ; purge TTL un jour après l'expiration). Index posés
  par Mongoose au démarrage : **aucune migration**.
- **D-560-14 — Les natures d'accès** (`domain/habilitations`, dossier de C : fichier commun) : `COMPTE_DE_CANAL` passe
  de `JAMAIS_STOCKEE` à `COFFRE_SEUL` ; le certificat et l'accès bancaire restent `JAMAIS_STOCKEE`.
- **D-560-15 — Les erreurs d'analyse du corps** sur les routes publiques ne recopient jamais le corps reçu : un JSON
  mal formé rend un message constant (Node cite un extrait du texte dans son `SyntaxError`).

### Contrat (annoncé avant le code ; journal de D, « ⚠ Contrats »)

Sous `/api/v1`, garde fiscale et portée du dossier pour les routes du cabinet ; droit `deposer` pour les écritures :

| Route | Qui | Rend |
|---|---|---|
| `GET /dossiers/{dossierId}/coffre` | cabinet | `{ canaux: [EtatCanal] }` |
| `GET /dossiers/{dossierId}/coffre/{canal}` | cabinet | `EtatCanal` |
| `POST /dossiers/{dossierId}/coffre/{canal}/mandat` | cabinet, `deposer` | 201 `EtatCanal` — `{ reference, signeLe, valableJusquAu, actes }` |
| `POST /dossiers/{dossierId}/coffre/{canal}/mandat/revocation` | cabinet, `deposer` | 200 `EtatCanal` — `{ motif }` |
| `POST /dossiers/{dossierId}/coffre/{canal}/liens-de-depot` | cabinet, `deposer` | 201 `{ jeton, expireLe }` (rendu une fois) |
| `POST /dossiers/{dossierId}/coffre/{canal}/secret/revocation` | cabinet, `deposer` | 200 `EtatCanal` — `{ motif }` |
| `POST /coffre/depots` | **public** (le client, par le lien) | 201 `{ expireLe, jetonDeRevocation }` — `{ jeton, identifiant, motDePasse, expireLe }` |
| `POST /coffre/revocations` | **public** (le client) | 200 `{ revoque: true }` — `{ jeton }` |

`EtatCanal` = `{ canal, chemin: AUTOMATISABLE | ASSISTE, raison, mandat: { etat: ABSENT | VALIDE | EXPIRE |
REVOQUE, version, reference, signeLe, valableJusquAu, actes, joursRestants, aRenouveler }, secret: { etat: ABSENT |
DEPOSE | EXPIRE | REVOQUE, version, deposeLe, expireLe, revoqueLe, joursRestants, aRenouveler }, lienDeDepot: {
expireLe } | null }` — jamais une valeur. `raison` : `COFFRE_NON_CONFIGURE`, `MANDAT_ABSENT`, `MANDAT_EXPIRE`,
`MANDAT_REVOQUE`, `MANDAT_NON_COUVRANT`, `SECRET_ABSENT`, `SECRET_EXPIRE`, `SECRET_REVOQUE`, ou `null`.

Refus publiés : `CANAL_INVALIDE` (400), `MANDAT_DATES_INVALIDES` (400), `SECRET_EXPIRATION_INVALIDE` (400),
`DOSSIER_INTROUVABLE` (404), `LIEN_DE_DEPOT_INVALIDE` (404 : inconnu, consommé ou expiré, sans distinction),
`JETON_DE_REVOCATION_INVALIDE` (404), `DOSSIER_ARCHIVE` (409), `COFFRE_CONCURRENT` (409), `MANDAT_ABSENT`,
`MANDAT_EXPIRE`, `MANDAT_REVOQUE`, `MANDAT_NON_COUVRANT` (422), `COFFRE_NON_CONFIGURE` (503). Au port d'usage (en
mémoire) : les mêmes, plus `SECRET_ABSENT`, `SECRET_EXPIRE`, `SECRET_REVOQUE`, `JETON_USAGE_INCONNU`,
`JETON_USAGE_CONSOMME`, `JETON_USAGE_EXPIRE`, `JETON_USAGE_AUTRE_DEPOT`, `JETON_USAGE_PERIME` (secret ou mandat
changé depuis l'émission). Aucun topic Kafka, aucun schéma de fait.

### Fichiers communs touchés (D-L7-2 ; journal de D, « ⚠ Communs »)

`src/app.module.ts` (import du module), `src/garde-routes-ecriture.spec.ts` (les deux routes publiques, avec leur
raison), `src/domain/habilitations/natures-acces.ts` et son test (D-560-14), le contrat OpenAPI (routes neuves),
`.env.example` (deux variables commentées, sans valeur). Ni `package.json`, ni migration, ni `read-models/`, ni copie
du paquet. Des fichiers neufs dans `src/ports/` (préfixés `coffre-`).

---

## Livré (2026-11-25) — prospera-fiscal-service#63, `dev` `cf8b583`

Annonce avant le code : prospera-stories #905 (`main` 0f4dae3 : fiche, AD-13 amendé dans la spine, « ⚠ Contrats »,
« ⚠ Communs ») et #908 (`main` 5a2f26c : complément de « ⚠ Communs » avant la fusion, le filtre d'exceptions).

- **Module `coffre-secrets`** (dossiers de D) : `src/domain/coffre-secrets/` (portée, mandat de canal, états, repli,
  refus publiés, faits du journal ; `IdentifiantsDeCanal` masqués), `src/application/coffre-secrets/`
  (`CoffreSecretsService`, qui implémente le port d'usage), `src/adapters/coffre-secrets/` (AES-256-GCM en
  enveloppe, collections `coffre_canaux` et `coffre_jetons`, registre MongoDB transactionnel avec le journal chaîné),
  `src/modules/coffre-secrets/` (deux contrôleurs, DTO, garde AD-13), `src/ports/coffre-*.ts`.
- **Les huit routes du contrat** telles qu'annoncées, avec deux **écarts** : (1) les deux révocations du cabinet
  (`…/mandat/revocation`, `…/secret/revocation`) n'ont **pas de corps** (le `motif` annoncé est retiré : un texte libre
  de plus dans le journal du coffre, sans usage) ; idempotentes ; (2) un acte de plus au journal,
  **`COFFRE_USAGE_TERMINE`** (`resultat` : `TERMINE` | `ECHEC`, jamais le message de l'erreur), écrit après le travail
  du connecteur ; `COFFRE_SECRET_UTILISE` est écrit à la consommation du jeton, dans sa transaction.
- **Code de refus neuf, commun à tout le service** : `CORPS_ILLISIBLE` (400) — D-560-15, dans
  `common/filters/all-exceptions.filter.ts` : Nest traduit le `SyntaxError` de body-parser en
  `BadRequestException(err.message)` hors route, et `JSON.parse` cite un extrait du corps (`Unexpected token 'Z',
  ..."DePasse": Zq7…" is not valid JSON`, mesuré) ; le message devient constant.
- **Le port `UsageSecretDeCanal`** (exporté par `CoffreSecretsModule`) : `emettre(acteur, { dossierId, canal, depotId,
  acte })` → `{ jeton, idJeton, expireLe, avertissements }` ; `utiliser(jeton, depotId, travail)` — `travail` reçoit
  `IdentifiantsDeCanal` et `controle.toujoursAutorise()`. **Pour 561** : la route qui appelle `emettre` porte
  `@ExigeDroitFiscal(DroitFiscal.DEPOSER)` ; le connecteur appelle `toujoursAutorise()` entre deux étapes ; le code
  `canal` doit être un canal déclaré par le paquet (331).
- **Communs** (D-L7-2) : `app.module.ts`, `all-exceptions.filter.ts` (+ test), `natures-acces.ts` (+ test,
  `COMPTE_DE_CANAL` → `COFFRE_SEUL`), `garde-routes-ecriture.spec.ts` (deux routes publiques), `.env.example`, contrat
  OpenAPI. Ni migration, ni `package.json`, ni `read-models/`, ni copie du paquet, ni manifeste.

## Preuves

- **Node 24** (étage `verification`, image construite depuis `git archive` LF de `584b0fe`) : unitaires **199/199 suites, 2 816 tests** (1 ignoré) ; e2e **12/12 suites, 242 tests** (`coffre-secrets.e2e-spec.ts` 11) ; **`test:conformite` 17/17 suites, 109 tests** sur `mongo-fiscal` en jeu de répliques (`coffre-secrets.conformite-spec.ts` 7 : index uniques et TTL, base brute sans valeur ni jeton, cinq usages parallèles d'un jeton ⇒ un seul, trois dépôts parallèles par un lien ⇒ un seul, révocation qui efface le chiffré en base, piste chaînée intacte).
- **Unitaires du coffre** : domaine 17, identifiants 4, chiffreur 6, service 29, garde AD-13 6, filtre d'exceptions +4.
- **Mutations 15/15 tuées** (Node 25, sur l'assertion) : acte non vérifié, secret utilisable le jour de sa fin, préavis strict, dépôt de rattachement, chiffré non effacé, mandat non revérifié au dépôt, jetons non annulés, masquage JSON, corps illisible recopié, portée non authentifiée (chiffrement, déchiffrement), contrôle d'usage qui ne relit pas, résultat toujours TERMINE, lien sans expiration (survivante au premier passage ; test ajouté), mandat expiré accepté.
- **§1.5 — le service démarre** (`docker compose -p grp-d … --profile fiscal up -d --build fiscal-service`, image runtime de l'archive, clé de test) : `/health` 200 (MongoDB, audit, Kafka, Redis) ; `POST /coffre/revocations` 404 `JETON_DE_REVOCATION_INVALIDE` ; `POST /coffre/depots` 404 `LIEN_DE_DEPOT_INVALIDE`, avec `codeMfa` 400, JSON sans guillemets 400 `CORPS_ILLISIBLE` ; route du cabinet sans jeton 401 ; journaux du conteneur (449 lignes) : **0** fragment du témoin ; clé maîtresse mal formée ⇒ le service **refuse de démarrer** (exit 1, message nommé, valeur non citée).
- Lint des fichiers touchés 0 ; `tsc` 0. Sous Node 25 en local, les rouges sont ceux du client Kafka natif (installé `--ignore-scripts`) et des paquets de dépôt en CRLF, absents sous Node 24.
- Verrou Docker : attendu (C puis B), pris à 20:29, une seule prise, rendu à 20:42 (script autonome, `trap EXIT`) ; aucun conteneur, volume ni réseau `grp-d`.

## Ce qui reste (nommé, hors de cette story)

- L'envoi du lien de dépôt au client par `notification` (le cabinet le remet lui-même) ; l'écran du coffre (A).
- Une liste des échéances du coffre à l'échelle du cabinet, et sa notification (l'état du canal les signale déjà).
- La rotation de la **clé maîtresse** : `cleId` est rangé avec chaque secret, mais une seule clé est lue ; un
  rechiffrement sous une clé neuve est à écrire le jour où elle tourne.
- La purge du chiffré d'un secret **expiré** non révoqué (il reste chiffré, inutilisable ; le client peut le faire
  effacer par son jeton de révocation, valable 30 jours après la fin du secret).
- La clé maîtresse d'un environnement réel : **geste de l'utilisateur** (aucun `.env` créé).
- Le manifeste `declarations` dit encore « aucun secret de canal n'est stocké » : à corriger à sa prochaine version
  (avec 561).
- **Revue de sécurité** (fiche, « Notes ») : faite en interne par cette story (fuites par réponse, journal, corps
  illisible, base brute, jetons) ; une relecture humaine reste recommandée avant la mise en service du connecteur.
