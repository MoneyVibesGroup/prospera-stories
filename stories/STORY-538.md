# STORY-538 : Transmission, accusé — et REJET : l'état que le produit ne connaît pas et qui coûte 40 %

Status: in_progress

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle
**Service :** `fiscal-service` — `bilan-service` et `dossier-service` **lus, non modifiés**
**Points :** 13 · **Sprint :** S20 · **Complexité :** high · **Assigné à :** `vivianMoneyVibesGroupes`
**Prérequis :** ✅ **STORY-446** (état `DEPOSE` + accusé — *livrée le 2026-09-03* ; l'en-tête d'origine
la disait « non livrée », périmé, relevé par la doctrine §8) · ✅ **STORY-452** (empreinte de la version
figée) · ✅ **STORY-536** (paquet de dépôt) · ✅ **STORY-537** (premier paquet `TG` × `DSF`)
**Origine :** arbitrage PO du 2026-08-28 — voie A. Doctrine : `doctrine-depot-2026-09-22.md` §3 et §6.3.

---

## Le fait

Le cycle de vie servi par `bilan-service` s'arrête à **VALIDE**, c'est-à-dire **figée dans
Prospera**. La voie A ajoute trois états que le produit ne connaît pas, et **le troisième est celui
qu'on oublie** :

```
FIGEE  →  TRANSMISE  →  ACCEPTEE (accusé)
                     ↘  REJETEE  (motif, et l'échéance continue de courir)
```

⛔ **Un rejet non traité est une échéance manquée.** Au Togo, une échéance manquée coûte **40 %** —
et c'est précisément le contraste que STORY-413 avait déjà relevé : *le produit est précis sur ce
qui se rattrape et muet sur ce qui ne se rattrape pas*. *(Précision de la doctrine §4 : 30 % à la
taxation d'office, **portés à 40 %** faute de régularisation sous quinze jours — LPF art. 121. Le
barème vit dans le paquet, `penalites[]`.)*

⚡ Et c'est le seul état qui **ne dépend pas du cabinet** : il arrive de l'administration, à un
moment que personne ne choisit.

## Critères d'acceptation

- [ ] AC-1 — Le cycle de vie porte `TRANSMISE`, `ACCEPTEE`, `REJETEE`, en plus des états existants.
      Chaque transition est **horodatée, attribuée et append-only** : un dépôt ne se réécrit pas.
- [ ] AC-2 — Un dépôt cite **la version figée** qu'il a transmise **et son empreinte** (STORY-452).
      On dépose **une** version, pas « la liasse ».
- [ ] AC-3 — Un **rejet** porte son **motif** tel que l'administration le rend, **non reformulé**.
      ⚠️ Un motif traduit ou résumé fait perdre le vocabulaire exact que le cabinet devra citer au
      guichet.
- [ ] AC-4 — ⛔ **Un rejet ne clôt rien** : l'échéance reste ouverte, le retard continue de se
      compter, et l'écran le dit. C'est l'inverse du réflexe — un état terminal se lit « c'est fini ».
- [ ] AC-5 — Une **retransmission** après rejet crée un **nouveau dépôt** lié au précédent, et
      conserve les deux. Le rejet fait partie du dossier de contrôle.
- [ ] AC-6 — ⚠️ **La transmission elle-même est optionnelle et déclarée par le paquet** : tous les
      canaux ne sont pas automatisables. Un canal `physique` produit le fichier et **enregistre un
      dépôt déclaré par l'utilisateur** — le cycle de vie est le même, l'automatisation non.
- [ ] AC-7 — Aucun secret d'authentification à un téléservice n'est stocké en clair. ⚠️ C'est
      exactement la condition bloquante C8 déjà rencontrée par `notification-service` : **la
      nommer ici évite de la redécouvrir au moment de brancher le premier téléservice.**

## ⚖️ Cadrage du 2026-09-25 — décisions prises avant la première ligne

**Décisions user (2026-09-25)** : ① `fiscal-service` **seul** ; la propagation `ACCEPTEE` → `DEPOSE`
de `bilan-service` est un **hook inerte** confié à une story à créer ; ② du fichier transmis, le dépôt
ne garde que **l'empreinte** (sha256 + taille) — l'archivage du fichier lui-même est une story à part.

### Ce que la lecture du code a établi — et qui fonde la conception

| Mesure (2026-09-25, `dev` à jour) | Conséquence |
|---|---|
| `bilan-service` porte déjà `DEPOSE` et `depots[]` append-only (STORY-446) : un **dépôt constaté**, sans transmission ni rejet | le cycle `TRANSMISE → ACCEPTEE \| REJETEE` est un **nouvel agrégat** de `fiscal-service`, propriétaire des « déclarations, accusés » (architecture fiscal-service, *Ownership*) — `JeuEtatsStatut` n'est pas touché |
| `fiscal-service` n'a **aucun agrégat métier persisté** (seulement des read-models) ; la base d'audit `fiscal_service_audit` (AD-10) existe, **sans journal implémenté** | le dépôt est le **premier** agrégat du service. Son journal de transitions vit **sur le document**, append-only par construction du dépôt de données (aucun chemin de réécriture) — la chaîne d'empreintes serveur d'AD-10 reste à livrer (hook) |
| AD-12 : « Déposer rend un identifiant de dépôt ; l'accusé arrive comme un **fait séparé** » | trois routes d'écriture distinctes : transmettre (→ identifiant), consigner l'accusé, consigner le rejet |
| Le contrat de paquet déclare `canal.type` ∈ `TELESERVICE \| DEPOT_PHYSIQUE \| COURRIEL`, **et aucun connecteur n'existe** (STORY-560/561 `ready-for-dev`) | en v1, **toute** transmission est **déclarée par l'utilisateur** (`mode: DECLARE`) ; le canal est recopié du paquet actif ; le mode `AUTOMATISE` est un hook |
| `GET …/bilan/etats/:id/versions/:version` rend `empreinte` (sha256 ou `null` avant STORY-452) et `valideAt` | le dépôt **recopie** l'empreinte lue chez `bilan-service`, jamais reçue du client ; `valideAt` borne la date de transmission |
| `GET …/bilan/etats/:id` publie `echeanceDepot` (STORY-453, `joursRestants` **signé**, calculé à la lecture) et le `statut` du jeu | l'échéance **se relaie**, elle ne se recalcule pas (le calcul par couple est STORY-539 ; « s'y brancher, ne pas en créer une seconde ») ; le `statut` sert à publier la **divergence** avec `DEPOSE` |
| `bilan-service` et `dossier-service` appliquent la **portée par dossier** (collaborateur non affecté ⇒ `404`) ; `fiscal-service` ne connaît que l'organisation du jeton | chaque route qui touche un dépôt **re-vérifie la portée** en amont avec le jeton de l'appelant — sinon un collaborateur lirait les dépôts d'un dossier qui ne lui est pas affecté |

### La conception retenue

- **D-538-1 — L'agrégat `Depot`** (collection `depots`, base `fiscal_service`). Il cite : le dossier,
  le jeu d'états et **la version figée** transmise, **l'empreinte** de cette version (lue chez
  `bilan-service`), la **référence du format** actif au moment de la transmission
  (`ReferenceFormatDepot` de STORY-536 AC-3 : pays, état, version, checksum), le **canal** (type du
  paquet + mode `DECLARE`), **l'empreinte du fichier transmis** (sha256 + taille, calculés sur le
  fichier joint — jamais déclarés), la date réelle de transmission, et `precedentId` (AC-5).
- **D-538-2 — Le journal `transitions[]` est la source de vérité** (AC-1) : chaque entrée porte l'état
  atteint, la date **du fait** (celle de l'accusé ou du rejet), l'instant d'**enregistrement**
  (serveur) et **l'auteur** (JWT). `statut` n'en est que la projection. Une transition s'écrit par un
  **seul** `updateOne` conditionnel `{ _id, orgId, statut: 'TRANSMISE' }` + `$push` + `$set statut` —
  atomique sur un document, donc **aucune transaction** ; le dépôt de données n'expose **aucune**
  autre écriture (ni `$set` sur une transition, ni suppression).
- **D-538-3 — Machine à états** : `TRANSMISE → ACCEPTEE` et `TRANSMISE → REJETEE`, rien d'autre.
  `ACCEPTEE` et `REJETEE` sont **terminaux pour le dépôt** ; le rejet ne l'est **pas pour
  l'obligation** (D-538-6).
- **D-538-4 — La chaîne d'un dépôt** = `(organisation, dossier, jeu d'états, pays, état)`. Elle est
  **linéaire** : `d1 REJETEE → d2 REJETEE → d3 (tête)`. On ne transmet que si la chaîne est vide, ou
  si sa tête est `REJETEE` **et qu'on la cite** en `precedentId` (AC-5). Refus nommés :
  `DEPOT_EN_COURS` (tête `TRANSMISE`), `DEPOT_DEJA_ACCEPTE` (tête `ACCEPTEE` — la rectificative est
  hors périmètre), `RETRANSMISSION_NON_LIEE` (tête `REJETEE` non citée), `PRECEDENT_NON_TETE`.
  **Filets en base** : index unique partiel « une seule `TRANSMISE` par chaîne » et index unique sur
  `precedentId` — deux retransmissions concurrentes du même rejet ne peuvent pas forker la chaîne.
- **D-538-5 — Le motif de rejet est conservé à l'octet** (AC-3) : ni rogné, ni normalisé, ni
  reformulé. Il est **refusé** (jamais corrigé) s'il est vide, blanc, au-delà de 4 000 caractères, ou
  s'il porte un caractère de contrôle autre que tabulation et retour à la ligne.
- **D-538-6 — « Un rejet ne clôt rien »** (AC-4) : la lecture de la chaîne publie
  `obligation.statut` ∈ `A_DEPOSER | TRANSMISE | REJETEE_A_RETRANSMETTRE | ACCEPTEE` et
  `obligation.ouverte` — **vraie tant qu'aucun dépôt de la chaîne n'est `ACCEPTEE`**, calculée sur la
  chaîne entière et jamais sur le statut terminal du dernier dépôt ; plus l'échéance **relayée** de
  `bilan-service` (date, jours restants signés — négatifs = retard —, motif si non constatable) et une
  mention explicite quand la tête est `REJETEE`.
- **D-538-7 — AC-6, le canal** : le type de canal est **recopié du paquet actif** du couple ; sans
  paquet actif, rien n'est transmis (`PAQUET_DEPOT_NON_PUBLIE`). Le numéro d'accusé est **exigé pour
  un `TELESERVICE`** (un téléservice en rend toujours un) et **facultatif** ailleurs — la doctrine §4
  a mesuré qu'aucun des deux régimes papier ne mentionne de numéro d'accusé.
- **D-538-8 — Rôles** : transmettre et consigner l'**accusé** — les deux actes qui engagent ou
  **ferment** l'obligation — sont réservés au `TENANT_ADMIN` (doctrine de STORY-447 : déposer est un
  acte d'administrateur). Consigner un **rejet** est ouvert au `TENANT_USER` : c'est le seul acte qui
  **rouvre** l'obligation, il ne peut rendre le produit que plus prudent, et chaque heure de retard à
  le saisir coûte. Lecture : `TENANT_ADMIN` et `TENANT_USER`, **dans leur portée de dossiers**.
- **D-538-9 — Bornes de dates** (leçon de STORY-446 : le dépôt antidaté) : la transmission ne précède
  pas le **jour** du figeage de la version (`valideAt`, au grain du jour et non de l'instant) et ne
  dépasse pas aujourd'hui ; l'accusé et le rejet ne précèdent pas le jour de la transmission et ne
  dépassent pas aujourd'hui.
- **D-538-10 — AC-2, une version non scellée ne se dépose pas** : une version figée avant STORY-452
  (`empreinte: null`) est refusée (`VERSION_NON_SCELLEE`) — geste : rouvrir, re-valider, déposer la
  version scellée. Un dépôt qu'on ne peut pas rattacher à un contenu vérifiable n'est pas défendable.
- **D-538-11 — AC-7** : aucun champ du contrat ne reçoit d'identifiant ni de mot de passe de portail ;
  la `ValidationPipe` (`forbidNonWhitelisted`) refuse tout champ inconnu, et le schéma Mongoose est
  strict. La condition **C8** (coffre-fort, AD-13) est nommée dans le code, à l'endroit exact où un
  connecteur se brancherait : elle précède le premier téléservice automatisé (STORY-560/561).

### Routes (`fiscal-service`, `/api/v1`)

| Route | Rôle | Effet |
|---|---|---|
| `POST /depots` (multipart : `fichier` + `dossierId`, `jeuEtatsId`, `version`, `pays`, `etat`, `transmisLe`, `precedentId?`) | `TENANT_ADMIN` | crée un dépôt `TRANSMISE` → `201` + identifiant |
| `POST /depots/:id/accuse` (`accepteLe`, `numeroAccuse?`) | `TENANT_ADMIN` | `TRANSMISE → ACCEPTEE` |
| `POST /depots/:id/rejet` (`rejeteLe`, `motif`, `referenceRejet?`) | `TENANT_ADMIN`, `TENANT_USER` | `TRANSMISE → REJETEE` |
| `GET /depots?dossierId&jeuEtatsId&pays&etat` | `TENANT_ADMIN`, `TENANT_USER` | la chaîne, l'obligation, l'échéance relayée, la divergence avec `bilan-service` |
| `GET /depots/:id` | `TENANT_ADMIN`, `TENANT_USER` | un dépôt et son journal |

## Hors périmètre (cadrage du 2026-09-25)

- ⛔ **La propagation `ACCEPTEE` → `DEPOSE` vers `bilan-service`** — décision user : hook inerte
  documenté, **story à créer** à la clôture (événement `fiscal.*` → consommateur `bilan-service`, qui
  suppose d'abord une **outbox** dans `fiscal-service`). En attendant, la lecture de la chaîne
  **publie la divergence** (accusé consigné ici sans `DEPOSE` là-bas, ou l'inverse) : les deux faits
  coexistent, ils ne se contredisent pas en silence.
- **L'archivage du fichier transmis** (décision user) : seule son empreinte est conservée — story à
  créer.
- **La chaîne d'audit serveur d'AD-10** (`fiscal_service_audit`, insertion seule, empreintes
  chaînées) : non implémentée dans le service ; le journal vit sur le dépôt, append-only **par le
  code** — hook nommé.
- Le **dépôt rectificatif** après acceptation (`DEPOT_DEJA_ACCEPTE` le refuse et le nomme).
- Le **calcul** de l'échéance par couple et la pénalité chiffrée : **STORY-539**.
- Le **connecteur** et le coffre-fort : **STORY-560 / 561 / 562**.
- L'écran : **FE-095** (débloquée par cette story), **FE-081**.

## Notes

- Voir [[STORY-446]] (le blocage réel de FE-081), [[STORY-452]], [[STORY-453]], [[STORY-413]],
  [[STORY-539]], [[FE-081]], [[FE-095]].

## Progress Tracking

**Statut : `in_progress` (2026-09-25).** Branches `MNV-538` : `prospera-fiscal-service` (base `dev`),
`docs` (base `main`).

- 2026-09-25 — ① cadrage : décisions user (fiscal-service seul, empreinte seule), conception D-538-1 à
  D-538-11 écrite avant le code.
- 2026-09-25 — ③ **dev** — `prospera-fiscal-service` `3f82668` (PR **#7**) : domaine pur
  `domain/depot/depot.ts` (machine à états, chaîne, bornes, motif, obligation, divergence) ; service
  `application/depots/depots.service.ts` (ordre : format → portée en amont → chaîne → une écriture) ;
  ports `RegistreDepots` et `SourceLiasseDeposee` ; adaptateur Mongo (collection `depots`, index
  `une_transmise_par_chaine` et `une_retransmission_par_rejet`, écriture conditionnelle append-only) ;
  lecteurs stricts de `bilan-service` (`versions/:v` → empreinte + `valideAt` ; `etats/:id` → statut +
  `echeanceDepot`) ; contrôleur `/depots` (multipart borné, fichier haché en mémoire, jamais écrit).
- 2026-09-25 — ④ **portes** : lint 0 · build · **1 075** unitaires · **75** e2e · couverture
  99,47 / 95,05 / 98,66 / 98,96 (fichiers neufs à 100 % de lignes, sauf une garde inatteignable).
  **Mutations — 16/16 tuées** (script `PROSPERA/tmp/mutation-538/muter.py`, qui refuse un motif
  introuvable ; deux mutants d'abord non compilables — « 0 test » — réécrits avant d'être comptés) :
  filtre sans `statut: TRANSMISE` · rejet qui ferme l'obligation · retransmission non liée admise ·
  motif rogné · motif converti par le DTO · chaîne lue avant la portée · portée dossier non vérifiée ·
  accusé ouvert au `TENANT_USER` · transmission ouverte au `TENANT_USER` · index partiel élargi ·
  numéro d'accusé jamais exigé · borne basse retirée · version non scellée admise · obligation lue sur
  la tête seule · identifiants non normalisés · retransmission datée avant son rejet.
- 2026-09-25 — ④ **vérification docker sur stack NEUVE** (`down -v`) : **81 OK, 0 KO** —
  `PROSPERA/tmp/verif-docker-538/`. Code des branches prouvé (restart + « Found 0 errors », sha256
  hôte = src monté). En base (`mongo-fiscal`) : dépôt 1 cité avec l'empreinte **du snapshot relu dans
  `bilan_service`**, la référence de format du manifeste, le canal `TELESERVICE`/`DECLARE`, l'empreinte
  du fichier recalculée ; **les deux index éprouvés par INSERTION DIRECTE** (`E11000` sur chacun) ;
  cloisonnement B → 404 sur dépôt, rejet et chaîne de A ; `motDePasse` / `identifiantPortail` → 400 ;
  motif relu **à l'octet** ; transmission jamais réécrite ; retransmission non liée 409, liée 201 ;
  accusé sans numéro 422 ; réécriture après acceptation 409 ; divergence publiée puis résorbée par le
  `deposer` de `bilan-service` ; 0 orphelin ; seule `fiscal_service.depots` a bougé (0 → 2).
  ⚠️ **Réserve** : `bilan-service` publiait une échéance **non constatable**
  (`DATE_LIMITE_INDETERMINABLE`) — le relais est prouvé en docker sur ce cas ; le cas daté (jours
  négatifs) l'est en unitaire et en e2e.
  ⚠️ **Constat HORS PÉRIMÈTRE** : au démarrage à froid, le consommateur `dossier-kyc` de
  `dossier-service` a crashé (`KafkaJSGroupCoordinatorNotFound`, Kafka pas prêt) et **n'a jamais
  rejoint son groupe** — ses voisins si ; le read-model KYC restait vide, tout `POST /dossiers` en
  403 `KYC_NOT_APPROVED`. Contourné par un `docker restart` ; à ficher (démarrage dégradé, invariant 4).
- 2026-09-25 — ⑥ **revue de code** (scan `opus`) : **2 constats retenus, corrigés** (`b25fbae`) —
  ① **bloquant** : `@EstObjectId()` admet les majuscules et la clé de chaîne se compare comme une
  chaîne ⇒ `66F1…` ouvrait une **seconde chaîne** (deux `TRANSMISE` que l'index ne voyait pas), puis le
  recoupement d'`id` des amonts rendait ce dépôt illisible (502) — identifiants normalisés en minuscules
  aux DTO ; ② une retransmission pouvait être **datée avant le rejet** qu'elle remplace —
  `borneBasseTransmission`. Lentille ponytail : `lireChaine` passe la clé telle quelle (appliqué) ;
  factorisation de l'intercepteur multer **écartée** (toucherait le code de 537 hors périmètre).
  Écartés par le scan (< 80) : course entre deux premiers dépôts (40), borne « aujourd'hui » en UTC (50),
  recalcul chez bilan sur jeu rouvert (60), consigne de divergence après réouverture (55).
- 2026-09-25 — ⑦ **revue de sécurité** (scan `opus`) : **1 constat, confiance 88, corrigé**
  (`33e5b05`) — CWE-639 / A01 : `GET /depots` s'en remettait à `bilan-service` pour la portée par
  dossier. ⚡⚡ **La prémisse de conception était FAUSSE, mesurée dans le code** : `bilan-service` ne
  filtre que par ORGANISATION (`dossier-scope.guard.ts`, `findOne({ dossierId, orgId })`) ; seul
  `dossier-service` connaît l'affectation. Un `TENANT_USER` non affecté lisait la chaîne entière —
  motif de rejet de l'administration, numéro d'accusé, auteurs. La portée se vérifie désormais chez
  `dossier-service` dans `lireChaine` **et** `transmettre` (défense en profondeur), avant toute
  lecture de chaîne, avec la même réponse qu'une liasse inexistante. Port et adaptateur corrigés.
  Mutations M17/M18 tuées ; **table rejouée en entier sur l'état final : 18/18**.
  ⛔ **Constat PRÉ-EXISTANT, HORS PÉRIMÈTRE, à ficher** : ce même `bilan-service` sert donc les liasses
  d'un dossier à tout collaborateur de l'organisation, affecté ou non.
