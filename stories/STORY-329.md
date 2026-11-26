# STORY-329 : Le chemin d'un montant restitué, et l'historique complet — répondre au contrôleur sans rien reconstituer

Status: in-progress — écrite le 2026-11-26 par la session du groupe C juste avant de la coder (lot 7, n° 9 du fiscal,
`PLAN-LOT-7-2026-11-24.md` §3) ; contrat et communs annoncés avant le code (« ⚠ Contrats » et « ⚠ Communs » du journal de
C). Il n'existait pas de fiche : les critères viennent de `epics-fiscalite-2026-08-03.md` (EPIC-031, STORY-329) et du PRD
fiscalité (FR-F26, FR-F51, FR-F56). **Elle finit EPIC-031.**

**Epic :** EPIC-031 · **Points :** 5 · **FR :** FR-F26 (le chemin d'un montant déclaré), FR-F51 (qui, quoi, quand, depuis
quel état, vers quel état, avec quel motif), FR-F56 (l'historique sur toute la durée, exercices clos et collaborateurs partis)
· **Architecture :** AD-1 / AD-4 (le fiscal lit, il ne calcule aucun impôt), AD-9 (la version scellée fait foi), AD-10 (le
journal chaîné, ineffaçable, sans texte libre), AD-14 (l'origine de la balance n'est jamais lue)
**Service :** `prospera-fiscal-service` (dossier `obligations`, à C ; fichiers communs nommés plus bas). `balance-service`
n'est **pas** touché : il sert déjà ce que le chemin lit.
**Après :** STORY-328 (les anomalies et leur levée, fiscal #57), STORY-322 (le triplet), STORY-321 (le calculé du moteur),
STORY-320 (les bases), STORY-325 (les versions scellées), STORY-327 (les reports scellés). **Suite :** STORY-339 (la base
légale citée mot pour mot sur chaque retraitement, D-329-11), STORY-336 de D (le dossier de contrôle).

## Histoire

En tant qu'**expert-comptable**, je veux remonter d'un montant déclaré jusqu'aux pièces, afin de répondre à un contrôleur
sans reconstituer à la main. *(FR-F26, FR-F51, FR-F56)*

## Critères d'acceptation (`epics-fiscalite-2026-08-03.md`, EPIC-031)

1. **Étant donné** un montant déclaré **quand** j'en demande l'origine **alors** le chemin `montant → détail de calcul →
   balance → journal → pièces disponibles` est restitué.
2. **Étant donné** un exercice clos et un collaborateur ayant quitté le cabinet **quand** on consulte l'historique **alors**
   il reste complet et lisible.
3. **Étant donné** toute action sur une obligation ou une déclaration **quand** on consulte le journal **alors** qui, quoi,
   quand, depuis quel état, vers quel état et avec quel motif y figurent.

## Ce que le code porte déjà (lu sur `origin/dev`, fiscal `9db1653`, balance `effdc4a`)

| Pièce | Ce qu'elle porte | Où |
|---|---|---|
| Le montant (322) | le triplet : calculé (origine `MOTEUR` / `SAISI_CABINET`, ou son motif d'indisponibilité), déclaré (montant, assiette, motif d'écart, calculé figé au visa), payé | `domain/obligations/triplet.ts` |
| Le calcul (321) | `calculMoteur` : le constat du dernier calcul (ressource `TVA` / `IS_ACOMPTE` / `TPU`, période ou rang, exercice, balance des bases, `calculeLe`, `par`) ; acte `OBLIGATION_CALCUL_CONSTATE` (montant, ressource, `balanceId`, `version`) | `calcul-delegue.ts` |
| La balance (320) | `basesFiscales.source` : `balanceId`, `version`, état, statut de preuve, empreinte, exercice | `bases-fiscales.ts` |
| Les versions (325, 327) | `versions_declaration` : le contenu scellé, son empreinte, le déclaré et le calculé retenus, le visa, la pièce du client, l'ouverture de la rectificative (motif en clair) ; `contenu.reports` | `version-declaration.ts` |
| Le journal (299) | une chaîne `obligation:<id>` par obligation, `verifierChaine` ; chaque acte : `acteur`, `survenuLe`, `enregistreLe`, `contenu` (`de` / `vers` pour les transitions, le retour, la rectificative ; **les motifs par leur seule empreinte**, AD-10) | `domain/audit/chaine-audit.ts`, `adapters/mongo/mongo-journal-audit.ts` |
| Les noms (319, 323) | `identity_users` (le nom reste après une suspension), `identity_memberships` (l'appartenance et son statut) | `AnnuaireCollaborateurs` |
| Le moteur (balance-service) | `GET …/fiscal/tva` : la période et ses agrégats (`tvaCollectee`, `tvaDeductible`, `tvaEcartee`) avec leurs **lignes sources** (les lignes de cahier, plafonnées à 500 et le disant), `comptes` (collectée, déductible) ; `GET …/fiscal/tpu` : postes du chiffre d'affaires, taux, tranche, `formule` ; `GET …/fiscal/acomptes` : le théorique d'un rang | `balance-service/src/modules/fiscal` |
| La provenance (balance-service, STORY-926) | `GET /dossiers/{d}/balance/{balanceId}/lignes/{compte}/provenance` : les transactions des cahiers d'un compte, et **leur pièce** (`pieceId`, `lotId`) quand elles en ont une ; `409 PROVENANCE_NON_OUVRABLE` pour une balance qui ne vient pas des cahiers | `cahiers/agregation` |

**Ce qui manque** : aucune route ne compose ces sources en un chemin ; le journal ne se lit par aucune route des
obligations ; un motif n'y figure que par son empreinte, et **le motif d'un retour en arrière n'est gardé en clair nulle
part** (celui d'une levée, d'un report ou d'une désactivation n'est gardé que tant qu'il est le dernier).

## Contrat annoncé avant le code (2026-11-26)

**Ajouts seuls** : deux routes de lecture, une collection neuve. Aucun droit neuf, aucun événement, aucun code renommé,
aucune réponse existante ne change ; manifeste `declarations` inchangé ; `balance-service` inchangé.

### `GET /api/v1/obligations/{id}/chemin` — le chemin d'un montant déclaré (AC-1)

Rôles `TENANT_ADMIN` / `TENANT_USER`, accès fiscal, portée du dossier (comme `…/versions`) : `404 OBLIGATION_INTROUVABLE`
aussi hors portée. Requête : **`version`** facultative (entier 1 → 999 ; `400` sinon) — absente, la version courante (la
scellée si elle l'est, sinon celle en cours) ; `version=n`, la version scellée n (`404 VERSION_INTROUVABLE` si elle n'existe
pas et n'est pas la courante). Jeton de l'appelant vers `balance-service` (sa portée s'applique, AC-5 de 326).

Réponse `200` **`CheminDuMontantDto`** : `obligationId`, `dossierId`, `taxe`, `periode`, `version` `{ numero, nature,
scellee, versionId | null, empreinte | null, scelleeLe | null }`, `luLe`, puis **cinq étapes, dans l'ordre du chemin**,
chacune `{ statut: RESTITUE | ARRETE | NON_ATTEINT, motif | null, message | null, … }` — un arrêt se **nomme**, une étape
après un arrêt dont elle dépend est `NON_ATTEINT` ; jamais un trou silencieux, jamais une erreur 5xx pour un amont muet.

1. **`montant`** — le déclaré de la version (scellée : celui qui est parti ; en cours : celui de l'obligation) `{ declare,
   assiette, motifEcart, par, le, calculeRetenu, ecart }` ; `ARRETE DECLARE_ABSENT` sans déclaré (le reste du chemin, celui
   du calculé, se rend quand même).
2. **`calcul`** — le calculé retenu et d'où il vient `{ origine: MOTEUR | SAISI_CABINET | null, montant, constat, saisie }` :
   le **constat du moteur** (321) en vigueur à l'instant de la version (`statut`, `montant`, `motif`, `ressource`, `periode`,
   `rang`, `exercice`, `balanceId`, `version`, `calculeLe`, `par`) ; une saisie du cabinet `{ montant, par, le }`. `ARRETE`
   avec le code du triplet (`TAXE_NON_CALCULEE_PAR_LE_MOTEUR`, `NON_ENCORE_CALCULE`, `SANS_MONTANT`, `MONTANT_A_SAISIR`, un
   `MOTEUR_*`…) quand le calculé est indisponible.
3. **`detail`** — le détail du calcul **tel que le moteur le rend** à la lecture, pour la même ressource, période ou rang, et
   le même exercice : `{ ressource, montantDuMoteur, concordance: CONCORDANT | DIVERGENT | NON_COMPARABLE, grandeurs: [{ cle,
   montant, lignes? }], formule | null, paquet: { pays, annee, checksum } | null }`. Les grandeurs gardent **le nom que le
   moteur leur donne** (TVA : `tvaCollectee`, `tvaDeductible`, `tvaEcartee`, `soldeBrut`, `creditAnterieurImpute`,
   `creditRestant`, `aPayer` ; TPU : `chiffreAffaires`, `tpuCalculee`, `tpuDue` ; acompte : `theorique`). `DIVERGENT` : le
   moteur rend aujourd'hui un autre montant que le calculé retenu (la comptabilité a changé depuis) — dit, jamais corrigé.
   `ARRETE` : `CALCULE_SAISI_PAR_LE_CABINET`, ou le motif du moteur (`MOTEUR_INDISPONIBLE`, `MOTEUR_NON_LISIBLE`,
   `MOTEUR_PARAMETRAGE_INSUFFISANT`, `MOTEUR_REPONSE_INVALIDE`, `PERIODE_INCONNUE_DU_MOTEUR`).
4. **`balance`** — la balance sur laquelle le calcul a été demandé (le constat et les bases de 320) `{ balanceId, version,
   etat, statutPreuve, checksum, exercice, balanceDuMoteur, comptes: [{ grandeur, compte }], postes: [{ poste, etat, montant
   }] }` : les comptes que le moteur nomme (TVA : collectée, déductible), les postes du chiffre d'affaires (TPU). `ARRETE
   BASES_NON_CONSTATEES` (aucune balance constatée).
5. **`journal`** — les lignes qui ont formé les grandeurs : pour la TVA, les **lignes sources** de la période, retrouvées dans
   la provenance des comptes de la balance (`{ transactionId, grandeur, compte, sens, date, libelle, montantDebit,
   montantCredit, niveauPreuve, pieceId | null, lotId | null }`), `nombre`, `tronque` (le plafond de 500 du moteur, dit),
   `nonRetrouvees`. `ARRETE` : `JOURNAL_NON_RESTITUE_PAR_LE_MOTEUR` (TPU, acompte : le moteur ne nomme pas ses lignes),
   `COMPTE_NON_PUBLIE` (le paquet ne publie pas le compte), `JOURNAL_HORS_DE_PROSPERA` (la balance ne vient pas des cahiers :
   ses lignes ne sont pas tenues ici — `409 PROVENANCE_NON_OUVRABLE`, dont la valeur de provenance n'est **jamais lue**,
   AD-14), `JOURNAL_NON_LISIBLE` (`403` / `404`), `JOURNAL_INDISPONIBLE`, `JOURNAL_REPONSE_INVALIDE`.
6. **`pieces`** — les pièces disponibles : `{ pieces: [{ pieceId, lotId, transactions: [] }], lignesSansPiece }` ; une ligne
   sans pièce est une ligne **saisie à la main** (pas un oubli d'affichage). `NON_ATTEINT` si le journal s'est arrêté.

### `GET /api/v1/obligations/{id}/historique` — l'historique complet (AC-2, AC-3)

Mêmes rôles, accès et portée. Réponse `200` **`HistoriqueDeLObligationDto`** : `obligationId`, `perimetre`
(`obligation:<id>`), `verification` `{ intacte, entrees, rupture: { nature, seq } | null }` (la chaîne vérifiée : une
réécriture se voit), puis **toutes** les entrées, dans l'ordre du journal :

`{ seq, acte, libelle | null, qui: { identifiant, nature: UTILISATEUR | SYSTEME, nom | null, appartenance: ACTIF | PARTI |
INCONNUE | null, affichage }, survenuLe, enregistreLe, etatAvant, etatApres, motif: { empreinte, texte | null, conserve } |
null, reference: idem | null, contenu, empreinte }`.

- **Qui** : l'identifiant du jeton tel que le journal l'a gardé ; son nom lu dans l'annuaire local (qui le garde après une
  suspension) ; **`PARTI`** pour un membre dont l'appartenance au cabinet n'est plus active (AC-2) ; `affichage` n'est jamais
  vide (« Prospera (système) », « Contrôle de cohérence (système) », le nom, ou « Utilisateur inconnu de l'annuaire »).
- **Depuis quel état, vers quel état** : `de` / `vers` de l'acte qui les porte (transition, retour, rectificative) ; pour
  un acte qui ne change pas l'état, celui que la dernière transition du journal a laissé (`A_PREPARER` avant la première).
- **Avec quel motif** : retrouvé **par son empreinte** dans les textes conservés (ci-dessous), à défaut dans ce que
  l'obligation et ses versions gardent en clair (désactivation, levées, report, motifs d'écart, ouvertures de
  rectificative) ; introuvable, `texte: null, conserve: false` — l'empreinte reste, le texte n'est pas inventé.
- **Exercice clos, obligation close** : rien ne filtre ni ne refuse ; la route ne lit que ce qui est écrit.

### Les textes conservés — collection neuve `textes_audit` (base métier)

Le journal reste **sans texte libre** (AD-10) ; le motif en clair d'un acte s'écrit **dans la même transaction** que l'acte,
dans `fiscal_service.textes_audit` `{ orgId, perimetre, seq, empreinte, texte, enregistreLe }` (index `(orgId, perimetre,
seq)` posé par Mongoose au démarrage) — par le seul `MongoJournalAudit.ajouter(fait, session, textes?)`, qui n'y fait que des
`insertOne` : aucun chemin ne le récrit. Base métier, donc **effaçable** (plan C13, quand il viendra) sans toucher au journal.
Actes qui y écrivent : désactivation et réactivation, levée d'anomalie, report et annulation (référence de la décision et
motif), déclaré et payé (motif d'écart), rectificative, retour en arrière, exigence de la validation du client.

## Persistance et fichiers communs (D-L7-2)

**Aucune migration** : une collection neuve (`textes_audit`, index posé par Mongoose) ; rien ne change dans
`obligations` ni dans `versions_declaration`. Ni `app.module.ts`, ni `package.json`, ni `read-models/`, ni copie du paquet,
ni manifeste `declarations`. Touchés parmi les communs : **le contrat OpenAPI** (deux routes) ;
**`adapters/mongo/mongo-journal-audit.ts`** (le journal partagé : un troisième paramètre **facultatif** à `ajouter`, et la
lecture des textes) ; **`ports/journal-audit.ts`** (une méthode **concrète** de lecture des textes, vide par défaut : aucune
implantation existante ne casse) ; **`test/utils/journal-audit-memoire.ts`** (le banc en mémoire garde les textes). Tout le
reste dans les dossiers de C (`domain/obligations`, `application/obligations`, `modules/obligations`, `adapters/http` de la
balance, `adapters/mongo` des obligations et des pièces du client, `ports/`). **Rien dans les dossiers de D** ; un acte de D
écrit au journal exactement comme avant.

## Décisions (D-329-n) — prises le 2026-11-26, contestables

- **D-329-1 — Le chemin se compose, il ne se recalcule pas (AD-1).** Chaque étape est lue chez qui la tient : le montant et
  le calculé dans le fiscal (322, 321, 325), le détail chez le moteur, la balance dans le constat des bases (320), le journal
  et les pièces dans la provenance de la balance (balance-service, STORY-926). Aucune règle d'imposition n'est recopiée :
  les grandeurs gardent le nom du moteur, la garde AST de 321 tient toujours.
- **D-329-2 — Un arrêt se nomme.** Cinq étapes, toujours présentes ; `ARRETE` avec un code d'une liste fermée et un message,
  `NON_ATTEINT` pour la suite d'un arrêt. Un amont muet n'est jamais une erreur du fiscal.
- **D-329-3 — La version fait foi (AD-9).** Le chemin d'une version scellée part du déclaré **qui est parti** (la version),
  pas de l'obligation rectifiée depuis ; le constat retenu est celui en vigueur au scellement (le constat de l'obligation s'il
  est antérieur, sinon le dernier `OBLIGATION_CALCUL_CONSTATE` du journal qui l'est).
- **D-329-4 — Le détail est celui d'aujourd'hui, comparé à celui d'hier.** Le moteur ne garde pas ses calculs : le détail
  est relu, pour la même ressource et le même exercice, et sa **concordance** avec le calculé retenu est dite (`DIVERGENT` :
  la comptabilité a changé depuis le calcul). Rien n'est stocké du détail (aucune copie qui divergerait).
- **D-329-5 — Le journal descend jusqu'à la ligne pour la TVA seule.** C'est la seule ressource dont le moteur nomme les
  lignes (`lignesSources`, les lignes de cahier) ; elles se retrouvent dans la provenance des comptes **collectée** et
  **déductible** de la balance des bases (la TVA écartée n'entre pas dans le montant : listée nulle part, dite par sa
  grandeur). TPU et acompte s'arrêtent à la balance (`JOURNAL_NON_RESTITUE_PAR_LE_MOTEUR`) : les postes de la liasse et l'impôt
  de N−1 ne sont pas des lignes.
- **D-329-6 — Les pièces disponibles, à la granularité où la liaison existe (FR-F53, FR-F54).** La pièce d'une ligne de
  cahier née d'une pièce (`auditOcr.pieceId`, OCR) ; une ligne saisie à la main n'en a pas, et se compte. La liaison écriture ↔
  pièce de la comptabilité (338) viendra s'ajouter ; rien ici ne la suppose.
- **D-329-7 — AD-14 tenu.** Le fiscal ne lit jamais la valeur de provenance d'une balance ; le `409 PROVENANCE_NON_OUVRABLE` se
  traduit en `JOURNAL_HORS_DE_PROSPERA` (la balance a été apportée toute faite : son journal n'est pas tenu ici).
- **D-329-8 — L'historique est le journal, lu et vérifié.** Toutes les entrées de la chaîne `obligation:<id>`, dans leur
  ordre, avec la vérification de la chaîne ; les actes que 329 ne nomme pas encore gardent `libelle: null` (complet d'abord).
  L'état avant / après se lit au journal (D-329-9). Aucune pagination : une obligation porte quelques dizaines d'actes.
- **D-329-9 — L'état d'un acte.** `de` / `vers` quand l'acte les porte ; sinon l'état laissé par la dernière transition lue
  (le journal est la source : une voie qui changerait l'état sans le journaliser se verrait comme un saut, `etatAvant` de
  l'acte suivant prenant son `de`).
- **D-329-10 — Les motifs conservés hors du journal.** Le journal ineffaçable ne garde que l'empreinte (AD-10) ; le texte en
  clair va dans `textes_audit`, base métier, **dans la même transaction** que l'acte, et se retrouve par son empreinte. Avant
  329, rien ne gardait le motif d'un retour en arrière : ces anciens motifs se rendent `conserve: false`, avec leur empreinte
  (aucune migration ne peut les inventer). Les autres se retrouvent dans ce que l'obligation garde encore en clair.
- **D-329-11 — La place de STORY-339.** L'étape `detail` porte le tampon du paquet que le moteur a appliqué (`paquet`) ; 339 y
  ajoutera la base légale de chaque retraitement (article et texte verbatim du corpus packagé), par un champ neuf de l'étape,
  sans changer les autres.
- **D-329-12 — Qui.** Le nom vient de l'annuaire local au moment de la lecture (il survit à une suspension) ; un membre dont
  l'appartenance n'est plus active est `PARTI` ; un utilisateur que la réplique ne connaît pas reste lisible par son
  identifiant. Le nom recopié sur le visa (323) reste dans le contenu de l'obligation, pas au journal.
- **D-329-13 — Hors périmètre, nommé.** La chaîne d'un dépôt (`depot:<id>`, D, sa piste a sa route) et celle du dossier
  (l'exigence de la validation du client) ne sont pas fusionnées à l'historique de l'obligation ; le chemin du **payé**
  (EPIC-033) ; l'historique d'un dossier entier (le dossier de contrôle, 336 de D) ; l'effacement des textes (C13) ; l'écran
  (A) ; tout événement.

## Preuves attendues

Unitaires (`-w 2`, Node 24) du domaine (le chemin et chacun de ses arrêts, la concordance, la version scellée et le constat
de son instant ; l'état avant / après rejoué, les motifs retrouvés par empreinte, `qui` et `PARTI`) et des services (portée,
version introuvable, amont muet par étape) ; contrat de balance-service (la période de TVA, la TPU, l'acompte, la provenance
et ses refus) ; `test:conformite` sur MongoDB (un acte motivé écrit son texte dans la même transaction, et une panne efface
les deux ; l'historique d'une obligation déposée, rectifiée et close relu avec ses motifs ; le journal sans texte libre) ;
e2e (les deux routes, la portée, un collaborateur parti, un exercice clos) ; toute la suite du fiscal, celles de D comprises ;
mutations sur la logique neuve ; `docker compose up` du fiscal, sain (un module change de fournisseurs).

## Progress Tracking

| Date | Événement |
|---|---|
| 2026-11-26 | Fiche écrite, contrat et communs annoncés avant le code. |
