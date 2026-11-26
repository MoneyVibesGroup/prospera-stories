# STORY-325 : Les rectificatives versionnées, l'immuabilité et la clôture — corriger une déclaration sans effacer la précédente

Status: done — **livrée le 2026-11-26** : prospera-fiscal-service **#75** (`7e2bff8` sur `dev`) ; voir « Livraison ».
Écrite le 2026-11-26 par la session du groupe C juste avant de la coder (lot 7, n° 7 du fiscal,
`PLAN-LOT-7-2026-11-24.md` §3) ; contrat et communs annoncés avant le code (« ⚠ Contrats » et « ⚠ Communs » du journal de
C). Il n'existait pas de fiche : les critères viennent de `epics-fiscalite-2026-08-03.md` (EPIC-031, STORY-325).

**Epic :** EPIC-031 · **Points :** 5 · **FR :** FR-F36 (rectificative), FR-F37 (versions), FR-F38 (immuabilité) ·
**Architecture :** **AD-9** (« chaque version de déclaration est un document neuf ; aucun chemin applicatif ne met à jour une
version existante ; l'obligation pointe la version courante ; une rectificative en crée une nouvelle en conservant motif,
auteur et date »), AD-10 (journal chaîné, aucun texte libre), AD-17 (un champ humain survit à la re-dérivation)
**Service :** `prospera-fiscal-service` (dossier `obligations`, à C ; fichiers communs nommés plus bas).
**Après :** STORY-323 (le cycle et le visa, #54), STORY-322 (le triplet, le calculé figé au visa, #56), STORY-321 (#72),
STORY-324 (la pièce de validation du client, #74 : D-324-12 prépare ce modèle).
**Suite :** **STORY-330 de D** (le livrable se produit sur une déclaration close et versionnée, plan §5 : ce qu'elle emploie
est écrit en D-325-11) ; STORY-334 (D, le rejet : D-325-9) ; STORY-329 (C, l'historique complet) ; STORY-336 (D, le dossier
de contrôle lit les versions).

## Histoire

En tant qu'**expert-comptable**, je veux corriger une déclaration sans effacer la précédente, afin que l'historique tienne
devant l'administration. *(FR-F36, FR-F37, FR-F38, AD-9)*

## Critères d'acceptation (`epics-fiscalite-2026-08-03.md`, EPIC-031)

1. **Étant donné** une déclaration déposée **quand** une rectificative est créée **alors** une nouvelle version apparaît
   **et** la précédente reste inchangée, avec motif, auteur et date.
2. **Étant donné** une version existante **quand** une mise à jour est tentée par n'importe quel chemin applicatif **alors**
   elle échoue.
3. **Étant donné** une obligation clôturée **quand** une mutation autre qu'une rectificative est tentée **alors** la
   réponse est `409 OBLIGATION_CLOTUREE`.
4. **Étant donné** un retour en arrière dans le cycle **quand** il est effectué **alors** un motif est obligatoire.

## Ce que le code porte déjà (lu sur `origin/dev`, fiscal `060c85c`)

| Pièce | Ce qu'elle porte | Où |
|---|---|---|
| Le cycle (323) | onze états, strictement séquentiel ; **aucun retour en arrière** (`409 TRANSITION_NON_PREVUE`, « STORY-325 l'ouvrira avec un motif obligatoire », D-323-6) ; `CLOTUREE` terminal | `domain/obligations/cycle.ts`, `cycle-obligations.service.ts` |
| Le déclaré (322) | remplaçable jusqu'à `A_DEPOSER`, **figé dès le dépôt** (`409 MONTANT_DECLARE_FIGE` : « une correction est une rectificative ») ; le calculé **figé au visa** (`montantDeclare.calculeFige`) | `domain/obligations/triplet.ts` |
| La pièce du client (324) | pièce neuve jamais récrite (`validations_client`, le port n'a pas de mise à jour) ; pointeur `validationClient` sur l'obligation ; la porte de « Déposée » | `domain/obligations/validation-client.ts` |
| Le journal chaîné | une chaîne par obligation (`obligation:<id>`), base `fiscal_service_audit` en `find`/`insert` seulement (AD-10) | `domain/audit/chaine-audit.ts` |
| `nombreDeclarations` | longueur d'un tableau `declarations` posé vide à la création (305), jamais rempli | `mongo-registre-obligations.ts` |

**Rien** ne porte encore une version : le dépôt ne garde rien de ce qui est parti ; après `DEPOSEE`, rien ne permet de
corriger ; une obligation `CLOTUREE` accepte encore la plupart des écritures (désactivation, report, affectation, saisie,
levée d'anomalie).

## Contrat annoncé avant le code (2026-11-26)

**Ajouts seuls**, plus **deux précisions de comportement** (la clôture, et le dépôt qui scelle). Aucun champ, aucune route,
aucun code renommé ; **aucun droit neuf** ; aucun événement ; manifeste `declarations` et catalogue d'auth inchangés.

### La version (AC-1, AC-2) — scellée au dépôt, jamais récrite

`A_DEPOSER → DEPOSEE` (`POST /obligations/{id}/transition`, inchangé pour l'appelant) **scelle la version courante** dans la
même transaction que l'état et son acte : un document neuf dans **`versions_declaration`**, et le pointeur de l'obligation
passe sur lui.

```
VersionDeclarationDto = {
  versionId, obligationId, dossierId, numero (1, 2, …), nature: INITIALE | RECTIFICATIVE,
  contenu: { taxe, periode, annee, redevableId, implantationId, declare: { montant, assiette } | null },
  empreinte: "sha256:<hex>",            // du contenu, sous forme canonique (D-325-3)
  declare: DeclareDto | null,           // le déclaré tel qu'il est parti : motif d'écart, calculé figé, par, le
  calcule: { montant, origine } ,       // le calculé retenu (figé au visa, sinon le courant)
  visa: VisaDto | null,
  validationClient: PointeurValidationClientDto | null,   // la pièce qui a validé ce déclaré (324)
  rectificative: { motif, par, le, versionPrecedente: { versionId, numero } } | null,
  scellee: { par, le, mode: DEPOT | REPRISE }
}
```

### La rectificative (AC-1) — `POST /api/v1/obligations/{id}/rectificatives`

Droit `fiscalite:declaration:preparer`, rôles `TENANT_ADMIN` / `TENANT_USER`. Corps `{ motif }` (10 à 500 caractères).
Permise **à partir de `DEPOSEE`** (`DEPOSEE`, `ACCUSE_RECU`, `A_PAYER`, `PAYEE`, **`CLOTUREE`**). Dans une transaction :

- la version déposée **reste telle quelle** (si l'obligation a été déposée avant cette story, sans version, elle est
  d'abord **scellée par reprise** depuis l'obligation : `scellee.mode = REPRISE`) ;
- l'obligation repasse **`EN_PREPARATION`**, sur la version **n + 1** en cours (`nature: RECTIFICATIVE`, `motif`, `par`,
  `le`, `versionPrecedente`) ; le **visa** est retiré et le **calculé défigé** (le nouveau visa le refigera) ; le pointeur
  de la **pièce du client** revient à `null` (D-324-12 : la nouvelle version exige un nouvel accord) ; le déclaré reste
  comme point de départ (champ humain, remplaçable) ; le payé ne bouge pas ;
- acte **`OBLIGATION_RECTIFICATIVE_OUVERTE`** (`obligation:<id>` : `numero`, `versionPrecedente`, `de`, empreinte du
  motif ; jamais le motif en clair), et `OBLIGATION_VERSION_SCELLEE` pour une reprise.

Réponse **201** : `{ versionPrecedente: VersionDeclarationDto, obligation: ObligationResponseDto }`.
Refus : `400` forme (motif) ; `403 DROIT_FISCAL_REFUSE` ; `404 OBLIGATION_INTROUVABLE` (même réponse hors portée) ; `409
OBLIGATION_DESACTIVEE`, `OBLIGATION_BLOQUEE`, **`RECTIFICATIVE_AVANT_DEPOT`** (rien n'est encore déposé : corriger
directement, ou revenir en arrière), **`RECTIFICATIVE_CONCURRENTE`** (l'obligation a changé pendant l'écriture : rien
n'est écrit).

### Lire les versions — `GET /api/v1/obligations/{id}/versions`

→ `200 { obligationId, courante: VersionCouranteDto, versions: VersionDeclarationDto[] }`, la plus récente d'abord ;
`404 OBLIGATION_INTROUVABLE` (même réponse hors portée).

### Le retour en arrière (AC-4) — `POST /api/v1/obligations/{id}/retour`

Corps `{ vers, motif }` (motif **obligatoire**, 10 à 500 caractères). `POST …/transition` **reste en avant seulement** : un
`vers` antérieur y répond toujours `409 TRANSITION_NON_PREVUE` — aucun chemin ne revient sans motif.

- **Avant le dépôt** (`EN_PREPARATION` → `A_DEPOSER`) : vers **tout état antérieur**.
- **Après le dépôt** (`ACCUSE_RECU`, `A_PAYER`, `PAYEE`) : vers un état antérieur **sans repasser avant `DEPOSEE`** (un
  accusé ou un paiement consigné par erreur) ; repasser avant le dépôt ⇒ **`409 RETOUR_AU_DELA_DU_DEPOT`** (une correction
  de ce qui est parti est une rectificative). Depuis `DEPOSEE` : rien en arrière (le rejet est 334, D-325-9).
- `vers` égal ou postérieur ⇒ `409 RETOUR_NON_PREVU` ; depuis `CLOTUREE` ⇒ `409 OBLIGATION_CLOTUREE`.
- **Droit** : celui de l'état quitté (`DROIT_PAR_ARRIVEE[de]` : défaire une étape demande le droit de la faire), et
  `valider` en plus si le retour **retire le visa** (de `VALIDEE` ou au-delà vers un état antérieur à `VALIDEE`) : le
  visa et le calculé figé sont alors retirés (le prochain visa les repose). La pièce du client ne bouge pas (D-324-12 : si
  le déclaré change ensuite, la porte dit `VALIDATION_CLIENT_PERIMEE`).
- Acte **`OBLIGATION_RETOUR_ARRIERE`** (`de`, `vers`, `visaRetire`, empreinte du motif). Comparaison-échange sur l'état.

Réponse **200** l'obligation. Refus : `400` forme ; `403 DROIT_FISCAL_REFUSE` (journalisé, comme la transition) ; `404` ;
`409 RETOUR_NON_PREVU`, `RETOUR_AU_DELA_DU_DEPOT`, `OBLIGATION_CLOTUREE`, `OBLIGATION_DESACTIVEE`,
`TRANSITION_CONCURRENTE`.

### La clôture (AC-3) — précision de comportement

Sur une obligation **`CLOTUREE`**, **toute** route qui l'écrit répond **`409 OBLIGATION_CLOTUREE`**, sauf la rectificative :
`…/transition`, `…/retour`, `…/desactivation`, `…/reactivation`, `…/report/annulation`, `…/bases`, `…/calcul`,
`…/montant`, `…/montant-declare`, `…/montant-paye`, `…/coherence`, `…/anomalies/{code}/levee`, et les trois écritures
groupées `POST /obligations/reports`, `/obligations/affectation`, `/obligations/validations-client` (une seule obligation
clôturée refuse le lot entier, tout ou rien). Ordre : la portée (404), le droit (403), puis la clôture, avant toute autre
garde (le report et l'affectation refusaient déjà une close depuis 317 et 319, après l'écartée : inchangés). Les codes rendus jusqu'ici dans ce cas (`TRANSITION_NON_PREVUE`, `MONTANT_DECLARE_NON_ENREGISTRABLE`,
`PAIEMENT_NON_ENREGISTRABLE`, `CALCUL_NON_ACTUALISABLE`, `BASES_NON_ACTUALISABLES`, `VALIDATION_CLIENT_TARDIVE`) cèdent la
place à `OBLIGATION_CLOTUREE` ; les écritures qui passaient (désactivation, report, affectation, saisie, levée) refusent.
**Les écritures du système** ne touchent plus une obligation clôturée : la re-dérivation (`…/derivation`, recalcul du paquet,
dérivation sociale de D) la compte `inchangee` sans la récrire ; un signalement ou un retrait d'anomalie (326, 1101) la
laisse telle quelle.

### Champ neuf

**`ObligationResponseDto.versionCourante`** (jamais `null`) : `{ numero, nature, versionId | null, rectificative: { motif,
par, le, versionPrecedente } | null }` — `versionId` est `null` tant que la version courante n'est pas déposée ; une
obligation antérieure se lit `{ numero: 1, nature: INITIALE, versionId: null, rectificative: null }`.

Base : `versionCourante` sur `obligations` (humain, `$setOnInsert: null` ; absent ⇒ la version 1 en cours) ; collection
neuve **`versions_declaration`** (index unique `(orgId, obligationId, numero)`). **Aucune migration**, aucune reprise de
masse.

## Persistance et fichiers communs (D-L7-2)

**Aucune migration** ; ni `app.module.ts`, ni `package.json`, ni `read-models/`, ni copie du paquet, ni manifeste
`declarations`. Touché parmi les communs : **le contrat OpenAPI** (trois routes neuves, un champ, la précision de la
clôture). Tout le reste dans les dossiers de C : `domain/obligations`, `application/obligations`, `modules/obligations`,
`adapters/mongo` (schéma et registre des versions ; le schéma des pièces du client gagne les crochets d'immuabilité,
D-325-4), `ports/`, `test/utils`, l'e2e et la conformité des obligations, et une garde neuve à la racine de `src/`
(`garde-versions-immuables.spec.ts`, AC-2). **Rien dans les dossiers de D.** `ObligationsModule` exporte en plus le port
de lecture des versions (pour 330).

## Décisions (D-325-n) — prises le 2026-11-26, contestables

- **D-325-1 — La version est scellée au dépôt, jamais avant.** Le déclaré reste remplaçable jusqu'à `A_DEPOSER` et le
  calculé se fige au visa (322, 321 : **inchangés**) ; ce qui part à l'administration est arrêté au passage `A_DEPOSER →
  DEPOSEE`, dans la transaction de l'état. Le déclaré et son assiette lus entrent dans la comparaison-échange : une saisie
  concurrente fait échouer le dépôt (`TRANSITION_CONCURRENTE`), jamais une version qui dirait autre chose que l'obligation.
  Sceller au visa aurait refait 322 (un déclaré après le visa y est permis).
- **D-325-2 — L'obligation pointe la version courante (AD-9).** `versionCourante` : numéro, nature, la version scellée
  (`versionId`) ou `null` tant qu'elle est en cours, et l'ouverture de la rectificative (motif, auteur, date). Absent ⇒
  version 1 initiale en cours : aucune migration.
- **D-325-3 — Ce qu'une version porte, et ce que son empreinte couvre.** Le **contenu déclaré** (taxe, période, année,
  redevable, implantation, déclaré et assiette) et son **empreinte** canonique (`serialiserCanonique` du journal, SHA-256) ;
  puis les **attestations** qui l'entourent, hors empreinte : le déclaré complet (motif d'écart, calculé figé), le calculé
  retenu, le visa, la pièce du client, l'ouverture de la rectificative, le scellement. L'empreinte ne couvre que ce qui part
  à l'administration : un livrable (330) produit avant le dépôt la retrouve à l'identique dans la version scellée si rien
  n'a changé, même si l'accord du client est consigné entre-temps.
- **D-325-4 — L'immuabilité tient sur trois appuis (AC-2).** (1) Le port des versions n'a **aucune** écriture ; le
  scellement n'existe que dans la transaction du dépôt et de la rectificative. (2) **Le schéma Mongoose refuse** toute
  mise à jour, tout remplacement et toute suppression (`updateOne`, `updateMany`, `findOneAndUpdate`, `replaceOne`,
  `findOneAndReplace`, `deleteOne`, `deleteMany`, `findOneAndDelete`, `bulkWrite`, un `save` d'un document existant) sur
  `versions_declaration` **et** sur `validations_client` (D-324-12 (5)) : n'importe quel chemin qui passe par le modèle
  échoue, prouvé sur MongoDB. (3) Une **garde par l'AST** : dans `src/`, ces deux modèles ne reçoivent que `create` et des
  lectures, et personne n'atteint leur collection brute (`.collection`). Le compte applicatif garde `readWrite` sur la base
  métier (AD-10 ne vise que le journal) : un accès hors du code du service n'est pas de son ressort.
- **D-325-5 — La rectificative repart en préparation.** `EN_PREPARATION`, version n + 1 : le visa retiré et le calculé
  défigé (ils restent dans la version n), la pièce du client à `null`, le déclaré gardé comme point de départ, le payé
  inchangé (le règlement de la version n a eu lieu ; 340 calculera le complément). Droit `preparer` : rouvrir ne fait rien
  partir, le visa de l'associé et l'accord du client seront exigés de nouveau. Depuis `CLOTUREE` aussi (AC-3).
- **D-325-6 — Une reprise plutôt qu'une migration.** Une obligation déposée avant cette story n'a pas de version : la
  première rectificative la scelle d'abord depuis l'obligation (`REPRISE`, acte `OBLIGATION_VERSION_SCELLEE`), dans sa
  transaction. Les obligations déposées qu'on ne rectifie pas n'ont pas de version à lire (`versions: []`) : la vérité de
  leur dépôt reste le journal chaîné.
- **D-325-7 — La clôture fige tout, sauf la rectificative (AC-3).** Une garde du domaine (`verifierNonCloturee`), en tête
  de chaque écriture après la portée et le droit, et la même condition dans le filtre de chaque écriture du registre (une
  clôture concurrente fait échouer l'écriture). Les écritures du système passent à côté sans erreur : une re-dérivation
  ne récrit pas une obligation close (elle compterait sinon comme une mutation, et ferait échouer tout le lot), un
  signalement la laisse.
- **D-325-8 — Le retour en arrière a sa route, son motif et son acte (AC-4).** `…/transition` reste en avant (D-323-6 ne
  change pas d'un octet pour l'appelant) ; `…/retour` exige le motif par sa forme. Avant le dépôt, tout état antérieur ;
  après, jamais avant le dépôt (la rectificative) ; le visa retiré quand on repasse avant `VALIDEE`, et `valider` exigé pour
  le retirer. Un redevable bloqué n'empêche pas de revenir (revenir ne fait rien progresser, comme D-324-8).
- **D-325-9 — Le rejet administratif reste à 334 (D).** `DEPOSEE → A_DEPOSER` (`REJETEE_A_RETRANSMETTRE`, D-323-3) n'est
  pas ouvert ici : un dépôt rejeté n'est pas une rectificative. **→ D** : 334 l'ouvrira en gardant la version scellée
  telle quelle (elle dit ce qui est parti et a été rejeté) ; la retransmission scellera une version de plus — la nature
  `RETRANSMISSION` s'ajoutera alors à `INITIALE` / `RECTIFICATIVE` (ajout).
- **D-325-10 — Aucun droit neuf, aucun événement.** Rectifier : `preparer` ; revenir : le droit de l'état quitté (et
  `valider` pour retirer un visa). Personne ne consomme encore une version : le journal chaîné est la trace (comme
  D-324-11).
- **D-325-11 — Ce que 330 (D) emploie.** (1) **Une version se nomme** `(obligationId, numero)` ; la courante se lit
  dans `versionCourante` (fiche, calendrier, retours des écritures) ; les scellées par `GET …/versions` ou, dans le
  service, par le port **`RegistreVersionsDeclaration`** (exporté par `ObligationsModule` : `deLObligation`, `trouver`) ;
  (2) **un livrable s'estampille** du numéro et de l'empreinte du contenu, calculée par
  `empreinteDuContenu(contenuDeclareDe(obligation))` (domaine, pur) dès `VALIDEE` ; au dépôt, la version scellée porte la
  même empreinte si rien n'a changé (sinon le livrable est périmé : à 330 de le dire) ; (3) **« close » interdit** : une
  version scellée ne change jamais (aucune route, aucun chemin) ; une obligation `CLOTUREE` refuse toute écriture sauf la
  rectificative ; après le dépôt, le déclaré ne change que par une rectificative (version n + 1).
- **D-325-12 — Les obligations sociales de D (349) suivent les mêmes règles.** Elles passent par le même registre et le
  même cycle : scellées au dépôt, rectifiables, closes comme les autres ; la dérivation sociale ne récrit pas une
  obligation close (D-325-7). Rien ne gêne 349 : aucune ligne de D ne change.
- **D-325-13 — Hors périmètre, nommé.** `nombreDeclarations` (legacy de 305, toujours 0) ne change pas ; le complément de
  règlement d'une rectificative (340) ; le rejet (334) ; l'écran (FE-081) ; tout événement.

## Preuves attendues

Unitaires (`-w 2`, Node 24) du domaine (version et empreinte, rectifiable ou non, retour permis ou non, droit du retour,
clôture, faits audités sans texte libre) et des services (ordre des vérifications, scellement au dépôt et comparaison-échange
du déclaré, rectificative et reprise, retour qui retire le visa, chaque écriture refusée sur une obligation close, la
re-dérivation qui l'épargne) ; la garde AST d'AC-2 ; `test:conformite` sur MongoDB en jeu de répliques (version et état dans
la même transaction ; une panne du journal n'écrit ni version ni état ; toute mise à jour d'une version ou d'une pièce
**échoue** par le modèle ; index unique ; reprise ; la re-dérivation laisse une close) ; e2e (le cycle entier jusqu'à
`CLOTUREE`, une rectificative depuis `CLOTUREE`, la version 1 intacte, la version 2 scellée au second dépôt ; les retours ;
chaque route d'écriture en `409 OBLIGATION_CLOTUREE`) ; mutations sur la logique neuve, qui rougissent sur l'assertion ;
`docker compose up` du service (§1.5 : le module des obligations change), sain, les routes neuves en `401` sans jeton.

## Hors périmètre

Voir D-325-13. Et : la lecture d'une version par la console (B) ; la purge (une version vit autant que l'obligation).

## Livraison (2026-11-26)

- **Dépôt** : `prospera-fiscal-service`, `MNV-325` → `dev` (#75, `7e2bff8`, sur `origin/dev` `060c85c`, aucune PR de D
  fusionnée entre-temps). Fichiers : `domain/obligations/version-declaration.ts` (version, contenu et empreinte, clôture,
  rectificative, retour, faits audités), `application/obligations/rectificatives-obligations.service.ts`, le scellement et
  `revenir` dans `cycle-obligations.service.ts`, `droitsDuRetour` (`droits-du-cycle.ts`), la garde de clôture dans neuf
  services, `ports/registre-versions-declaration.ts`, `adapters/mongo/{version-declaration.schema,
  mongo-registre-versions-declaration,immuabilite-mongo}.ts`, le registre des obligations (scellement, rectificative,
  retour, `NON_CLOTUREE`, la dérivation qui épargne une close), `modules/obligations/{rectificatives-obligations.controller,
  dto/versions.dto}.ts`, `versionCourante` au DTO ; gardes `src/garde-versions-immuables.spec.ts` (AC-2) et
  `modules/obligations/ecritures-des-obligations.spec.ts` (AC-3, liste fermée `test/utils/ecritures-des-obligations.ts`).
- **Tel qu'annoncé** (#971) : aucune décision D-325-1 → 13 n'a changé ; aucun écart de contrat.
- **Preuves** : Node 24 (étage `verification`, archive LF de `71ed333`) : unitaires 225/226 suites (1 sautée), 3248 tests ;
  e2e 13/13, 308 ; conformité 25/25, 160 (MongoDB en jeu de répliques ; neuve : `test/versions.conformite-spec.ts`, 9
  tests) ; `nest build` vert ; **mutations 30/30** en local (domaine, services, crochets, garde AST, e2e : chaque garde de
  clôture retirée d'un service rougit l'e2e « sur une close ») et **11/11 sur MongoDB réel** (adaptateurs des obligations
  et des versions) ; pile `grp-c` fiscal + balance (`origin/dev` 44be0c1) saine : les trois routes neuves montées et en
  `401` sans jeton, index unique `version_de_l_obligation` posé au démarrage, aucune erreur d'injection, aucun redémarrage.
  Verrou Docker pris une fois (11:30 → 11:39).
- **Tests touchés** : `bases-obligations.service.spec.ts` et `calcul-obligations.service.spec.ts` (une close répond
  désormais `OBLIGATION_CLOTUREE`, la précision annoncée) ; le registre en mémoire (versions, rectificative, retour, close) ;
  le nettoyage de la conformité de 324 passe par la collection brute (le modèle refuse `deleteMany`). Aucun test de D.
- **Une leçon** : le nettoyage d'un banc qui supprime par le modèle rougit dès que le schéma devient immuable ; nettoyer
  par `modele.collection`.

## Progress Tracking

| Date | Événement |
|---|---|
| 2026-11-26 | Fiche écrite, contrat et communs annoncés avant le code (PR de docs #971). |
| 2026-11-26 | **DONE.** Code : fiscal #75 (`7e2bff8` sur `dev`). Preuves : voir « Livraison ». D prévenu (330). |
