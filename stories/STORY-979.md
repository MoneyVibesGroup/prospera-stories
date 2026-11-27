# STORY-979 : les droits de la facture et des archives du cabinet au catalogue de tenant d'auth

Status: done (rouverte et refermée cinq fois pour ses suites : « Suite du 2026-11-24 », « Suite du 2026-11-24
(soir) », « Suite du 2026-11-25 », « Quatrième suite (2026-11-25) » et « Cinquième suite (2026-11-26) », en fin de
fiche)

**Complexité :** faible (huit droits neufs au catalogue de tenant, hors du jeton ; un rôle du socle neuf ; une ligne
d'ajout à l'annexe B ; la copie des manifestes du catalogue ; aucun champ, aucune route, aucun topic)

**Épics :** EPIC-267 (la GED ouverte au cabinet, PRD des services du cabinet §2.3) et le module `facturation` (M09)
du PRD distributeur
**Dépôts :** `MoneyVibesGroup/prospera-auth-service` ; `MoneyVibesGroup/prospera-platform-catalog-service`
(`copies.json`)
**Plage :** groupe B, 930 → 979 : **le dernier identifiant libre de la plage** (vérifié libre le 24/11 sur `main`, sur
les branches et dans les PR ouvertes de `prospera-stories`). Story **neuve**, hors des lignes du plan du lot 6 : les
deux demandes reçues le 24/11 (journal de D, « → B (2026-11-24, STORY-1065) » ; journal de C, « → B (24/11,
STORY-1087) », deux lignes). La marque haute du tracker reste STORY-1111 (979 est en dessous).
**Plan :** `coordination/PLAN-LOT-6-2026-11-23.md` (§0 : rituel) ; placée par la session du groupe B **avant
STORY-1112** (D-979-1).
**Dépend de :** STORY-960 (droits hors du jeton, `droitsHorsJeton`) ; STORY-971 et 977 (le modèle des ajouts à
l'annexe B) ; STORY-1083 (le modèle des droits du cabinet).
**Débloque :** `PUT /api/v1/facturation/parametres` de D (STORY-1065), qui répond 403 `DROIT_INSUFFISANT` à tous tant
qu'auth n'attribue pas le droit ; les routes du cabinet de `ged` (STORY-1087 de C), où seul un `TENANT_ADMIN` a les
droits `ged:*` jusque-là (D-1087-4).
**Suivante :** STORY-1112 (le BFF relaie les essais d'un prospect, AP-57).

**Sources lues :** journaux de A, B, C, D (lot 6) ; fiche STORY-1065 (AC-1, D-1065-13) et manifeste `facturation`
(`manifestes/facturation.manifest.ts`, C7 amendé le 24/11) ; fiche STORY-1087 (contrat §4, §6, §9, D-1087-4) ; PRD des
services du cabinet (§2, §2.3) ; fiches STORY-977 et 1083. Code relu sur `origin/dev` d'auth `96f8ab3` :
`droits-hors-jeton.ts`, `tenant-permission.enum.ts`, `table-d-acces-cabinet.ts`, `table-d-acces-distributeur.ts`
(`AJOUTS_A_L_ANNEXE_B`), `tenant-system-roles.ts`, `resolution-des-droits.service.ts`, `tenant-roles.service.ts`
et leurs tests ; catalogue `fddfa7d` : `scripts/manifestes/`, `manifestes-seed.service.ts`. Lu, sans y toucher : la
branche `MNV-1087` de C dans `prospera-ocr-service` (`a872c69`, `src/modules/ged/cabinet/droits.ts`) et le contrôleur
des paramètres de D sur `origin/dev` de `prospera-ventes-service`.

**Ce qui existait déjà (relu avant la fiche) :** aucun des huit codes n'est dans auth (`git grep` sur `origin/dev` :
aucun `ged:`, aucun `facturation:parametres:`), aucun rôle `CAB_ARCHIVISTE`. Le mécanisme est entier : un code de
`DROITS_HORS_JETON` est au catalogue de tenant, servi par `/moi/droits` dans `droitsHorsJeton` ; une ligne
d'`AJOUTS_A_L_ANNEXE_B` l'attribue aux rôles du distributeur nommés ; une ligne de `TABLE_D_ACCES_DU_CABINET` aux rôles
du cabinet, dont les rôles du socle sont dérivés. Côté catalogue, `npm run manifestes:garde` contre `origin/main`
(`1561370`) : **rouge sur `facturation` seul** (`manifeste.droits[6]`, le droit de D-1065) ; `ged` est encore en 1.0.0
sur `main` (la 1.1.0 de C n'y est pas : code de C non fusionné, aucune PR ouverte).

---

## Ce qui doit être vrai à la fin

| Exigence | Fait |
|---|---|
| `facturation:parametres:modifier` au catalogue de tenant, hors du jeton, au `DIST_DAF` seul | une entrée de `DROITS_HORS_JETON` (fin de la section `facturation`) ; une ligne d'`AJOUTS_A_L_ANNEXE_B` (`['DAF']`) |
| Les sept `ged:*` du cabinet au catalogue, hors du jeton | `ged:fonds:gerer`, `ged:lot:numeriser`, `ged:piece:indexer`, `ged:versement:verser`, `ged:physique:gerer`, `ged:piece:consulter`, `ged:sensible:consulter` (section `ged` neuve) |
| La matrice §2.3 du PRD, à la lettre | `CAB_ASSOCIE` : fonds, pièces, sensibles ; `CAB_COLLABORATEUR` : pièces ; `CAB_ARCHIVISTE` : les sept, et rien d'un autre module |
| Le rôle `CAB_ARCHIVISTE` | rôle du socle de tenant, vertical `cabinet`, couverture `partiel`, rôle par défaut d'aucun rôle du socle (attribué) |
| La borne du jeton ne bouge pas | aucun code neuf dans `perms[]` : 17 + 24 = 41 ≤ 44 |
| La copie du manifeste `facturation` au catalogue | `copies.json` recopié depuis `prospera-stories@1561370` ; `manifestes:garde` verte (48) |
| La copie du manifeste `ged` 1.1.0 | recopiée dans la même story, après la fusion de C (D-979-8) |

## Décisions (prises par défaut, contestables)

- **D-979-1 — Le numéro 979, et la place avant STORY-1112.** Dernier libre de la plage de B (930 → 979), vérifié sur
  `main`, les branches et les PR ouvertes de `prospera-stories`. La sous-session de 1080 proposait « après 1112, avant
  1113 » ; la session du groupe B l'a placée **avant 1112** : une demande adressée à B passe avant la story suivante
  (`REGLES-DES-GROUPES.md` §1.1). La marque haute n'est pas touchée (STORY-1111 reste le plafond réellement écrit).
- **D-979-2 — `facturation:parametres:modifier`, hors du jeton, au DAF seul.** À la lettre du manifeste `facturation`
  (C7, D-1065-12), 31 caractères, libellé « Modifier les paramètres de la facture » (celui que D propose). L'annexe
  B.2 ne le nomme pas : il entre dans `AJOUTS_A_L_ANNEXE_B`, à part de la recopie ligne à ligne de l'annexe, comme
  `commande:parametres:modifier` et `terrain:parametres:modifier`. Rôle par défaut : **`DIST_DAF`**, lui seul, comme
  D le propose (D-1065-13 : la fiche légale de la société). Le DG et l'administrateur ne le reçoivent pas (à la
  différence de `commande` et de `terrain`) : D ne l'a pas demandé ; une surcharge de l'organisation peut le leur
  donner. Si le PO répond autrement, la ligne se change seule.
- **D-979-3 — Les codes `ged:*` sont pris au contrat, avant la 1.1.0 du manifeste.** Le manifeste `ged` de `main`
  (1.0.0) ne déclare que deux des sept codes (`ged:piece:consulter`, `ged:lot:numeriser`) ; les autres viennent avec
  la 1.1.0 de C, pas encore sur `main`. La part d'auth ne dépend pas du code de C : les sept codes sont écrits dans la
  matrice §2.3 du PRD et dans le contrat de STORY-1087 (§4, §6, annoncé et fusionné sur `main`, #768) ; les six que lit
  la branche `MNV-1087` de C (`DROITS_GED`) sont identiques à l'octet, et `ged:physique:gerer` est celui de STORY-1088.
  **Le jour où la 1.1.0 arrive sur `main`, la story qui la recopie compare ses `droits` à ces sept codes** ; un écart
  se corrige dans auth avant la copie.
- **D-979-4 — `CAB_ARCHIVISTE`, rôle du socle, attribué.** Une ligne de `TENANT_SYSTEM_ROLES` (libellé « Archiviste »,
  vertical `cabinet`), dérivée de la table d'accès du cabinet comme l'associé et le collaborateur. Il n'est le rôle par
  défaut d'aucun rôle du socle (`ROLE_METIER_PAR_DEFAUT` inchangé : `TENANT_ADMIN` → associé, `TENANT_USER` →
  collaborateur) ; l'administrateur du cabinet l'attribue à un membre (`tenantRole`), comme tout rôle du socle de son
  métier. Couverture **`partiel`** : ses droits sont attribués, ses routes (STORY-1087) et son écran (FE-143) viennent ;
  `servi` mentirait à la console, `en_attente_de_module` exige un rôle sans droit.
- **D-979-5 — « Rien d'autre du dossier » est tenu par les droits d'auth.** L'archiviste n'a aucun droit hors de
  `ged` : ni fiscalité, ni comptabilité, ni financement (test et mutation). La constante `TOUS` de la table du cabinet
  reste « l'associé et le collaborateur ». Ce qu'un service accorde encore au rôle socle (`TENANT_USER`) sans lire de
  droit ne dépend pas d'auth : hors périmètre, à vérifier par celui qui tient le service le jour où un archiviste s'y
  connecte (information à C, « → C »).
- **D-979-6 — Aucun contrat ne change de forme.** Le jeton ne change pas (aucun des huit droits n'y voyage) ;
  `identity.droits.changed@1` ne porte aucun droit (D-949-4) ; `moi-droits` reste en 1.1.0 : seules les valeurs de
  `droitsHorsJeton` changent pour le DAF, l'associé, le collaborateur, et le rôle neuf. La livraison n'avance pas `dv`
  (D-949-3) : les caches `(membre, organisation, dv)` voient les droits à leur terme (60 s au plus). Annoncé quand
  même dans « ⚠ Contrats » avant la fusion (valeurs visibles de C et D, rôle neuf visible de la console).
- **D-979-7 — La copie des manifestes, entière, depuis `main`.** `npm run manifestes:copier` lit tout le dossier
  `manifestes/` : la copie a été faite depuis `_wt-b-stories` en HEAD détachée sur `origin/main` (`1561370`), et
  comparée à une copie faite depuis `git -c core.autocrlf=false archive origin/main manifestes` : identiques, sauf la
  ligne `origine`. Seul `facturation` change (`droits[6]`). **La version de `facturation` reste 1.0.0** (le manifeste
  est à D) : une base de catalogue déjà semée garde sa 1.0.0 sans le droit et le signale au démarrage (« la copie
  diffère du manifeste publié ») ; une pile neuve sème la copie. Sans effet sur l'attribution (auth ne lit pas cette
  copie, la garde de `facturation` lit `/moi/droits`) ; information à D (« → D »).
- **D-979-8 — La copie de `ged` 1.1.0, dans la même story, après la fusion de C.** Au moment de coder (24/11), le
  code de C n'était pas fusionné (`MNV-1087`, `a872c69`, sans PR) et la 1.1.0 n'était pas sur `main` : la part d'auth
  s'est faite sans attendre. Au moment d'écrire les docs, C avait fusionné (document-service #30, `1db0a8f`) et signalé
  la 1.1.0 sur `main` (`a86e461`, journal de C) : le catalogue l'a recopiée par une seconde PR (`MNV-979-ged`), après un
  amendement du contrat annoncé avant sa fusion (stories #778). Les sept `ged:*` du cabinet que la 1.1.0 déclare sont
  ceux qu'auth attribue : D-979-3 est vérifiée, aucun écart.
- **D-979-9 — Sans Docker.** Aucun module Nest, aucune dépendance, aucun Dockerfile ne change : des listes de données,
  un rôle du socle réaligné au démarrage par `TenantRolesSeedService` (comme 902 et 960), une copie JSON semée au
  démarrage. La preuve est la suite des deux services (relancée par chemin, puis complète), le câblage du module racine
  d'auth (binding doublé) et des mutations ; le verrou n'a pas été pris.

## Livraison

Toutes fusionnées en « Rebase and merge », `merged = true`, `head.sha` = SHA poussé, arbre de la branche identique à
`dev` après rejeu :

- **auth #48** : **`c0f6243` sur `dev`** (tête de la PR `1878c5b`). Fichiers : `src/common/rbac/droits-hors-jeton.ts`,
  `src/modules/rbac/table-d-acces-cabinet.ts`, `table-d-acces-distributeur.ts` (`AJOUTS_A_L_ANNEXE_B`),
  `tenant-system-roles.ts` ; tests du catalogue, des deux tables d'accès, du socle des rôles, de la résolution et du
  catalogue de composition.
- **catalogue #68** : **`d7e67f1` sur `dev`** (tête `56150ff`) — `copies.json` depuis `prospera-stories@1561370`
  (`facturation` : `droits[6]`).
- **catalogue #69** : **`b75e34b` sur `dev`** (tête `fa0848d`) — `copies.json` depuis `prospera-stories@4fab396`
  (`ged` 1.1.0).
- Contrat annoncé avant la fusion : stories #777 (fiche, tracker, « ⚠ Contrats »), amendé par #778 (la copie de `ged`).
- D prévenue directement (session du groupe D) avec les n° de PR et les SHA sur `dev`.

## Preuves

- **Sans Docker** (D-979-9) : aucun module, aucune dépendance, aucun Dockerfile touchés ; verrou non pris.
- **Auth, Node 25, tests relancés par chemin** : les suites des droits, des rôles, de l'administration, de
  l'authentification, des invitations au réel et des comptes du jeu : **38 suites, 677/677**. Ce qu'elles vérifient :
  - les huit codes au catalogue, hors du jeton, au format, ≤ 40 caractères, module et libellé écrits en toutes
    lettres ; les droits `facturation` du catalogue sont les sept du manifeste, dans son ordre ; catalogue 164 codes
    (24 + 140) ;
  - `facturation:parametres:modifier` détenu par `DIST_DAF` et par lui seul (DAF : 44 droits de tenant) ; la
    résolution le met dans `droitsHorsJeton` du DAF, ni dans `perms[]` ni dans `droits` ; le comptable, le DG et
    l'administrateur ne l'ont pas ;
  - la matrice §2.3 droit par droit (détenteurs exacts) ; l'associé (18 droits), le collaborateur (10) et l'archiviste
    (7) écrits en toutes lettres ; l'archiviste n'a aucun droit hors de `ged`, aucun droit du jeton, n'est le rôle par
    défaut d'aucun rôle du socle, couverture `partiel` ; un archiviste attribué reçoit ses sept droits dans
    `droitsHorsJeton` et un jeton vide ;
  - aucun rôle du distributeur ne reçoit un `ged:*` ; le catalogue de composition d'un rôle offre les codes neufs,
    indisponibles tant que le module n'est pas souscrit.
- **Auth, suite complète (Node 25)** : 102 suites, **1 445 passés**, 4 suites rouges connues (binding natif de
  Confluent : `app-cablage.invariant.spec.ts` et les trois `src/kafka/*`). Le câblage du module racine joué avec le
  binding doublé (`moduleNameMapper`) : **vert**. `tsc --noEmit`, lint des dix fichiers touchés et build : verts.
- **Auth, mutations : 12/12 rouges sur assertion**, aucune par compilation : le droit de la facture à personne (4
  tests), aussi au comptable (3), au DG au lieu du DAF (4) ; l'archiviste sans les pièces sensibles (3), le
  collaborateur avec (3), l'archiviste dans `TOUS` (fiscalité et comptabilité, 12), l'associé qui numérise (3),
  l'archiviste sans les originaux papier (5), l'archiviste rôle par défaut du `TENANT_USER` (3), « servi » (2), le
  libellé changé (2), l'indexation à personne (3).
- **Catalogue, Node 25** : `manifestes:garde` verte (48) après chaque copie, contre une extraction LF de `origin/main` ;
  les deux copies (depuis le worktree en CRLF et depuis `git archive`) identiques hors la ligne `origine` ; catalogue
  et essai 21/21 suites, 456/456 ; suite complète 100 suites vertes, **1 597 passés**, 3 suites rouges connues (binding
  de Confluent).
- **Copies à l'octet vérifiées entre dépôts** : le catalogue plateforme `permission.enum.ts` (17 codes, MNV-650) reste
  identique dans auth, kyc, catalogue et BFF sur `origin/dev` (même SHA-256) — non touché. Le catalogue de tenant
  n'est recopié nulle part (`tenant-permission.enum.ts`) : les codes lus par C (`DROITS_GED`) et par D (manifeste et
  contrôleur des paramètres sur `dev` de ventes) sont identiques à ceux d'auth.

## Pour la suite

- **D** : `PUT /api/v1/facturation/parametres` passe pour un `DIST_DAF` sur une image d'auth reconstruite depuis `dev`
  (cache de 60 s compris). La version 1.0.0 de `facturation` : voir D-979-7 (« → D »).
- **C** : les routes du cabinet de `ged` passent pour l'associé, le collaborateur et l'archiviste selon la matrice ;
  un archiviste s'attribue par `tenantRole`. Ce que `ged` (ou un autre service) donne encore au rôle socle sans lire de
  droit : D-979-5 (« → C »).
- **A** : un rôle de plus (« Archiviste ») dans la liste des rôles d'un cabinet ; aucune forme ne change.

---

## Suite du 2026-11-24 : le droit de l'avoir et le manifeste `facturation` 1.1.0

**Demande servie :** journal de D, « → B (2026-11-24, STORY-1066) », points **(1)** et **(2)** seulement. Le point (3)
(consommer `facturation.avoir.emis@1` dans `paiement`) n'est pas ici (D-979-14).
**Pourquoi 979 et pas une story neuve :** même nature que 979 (un droit hors du jeton par `AJOUTS_A_L_ANNEXE_B`, une
recopie de manifeste), et D-979-7 promettait cette recopie le jour où la version monterait à la source. Aucun
identifiant neuf : branches `MNV-979-avoir` (auth, catalogue), docs `docs-979-avoir`.
**Place :** décidée par la session du groupe B, juste après STORY-1112 et **avant STORY-1113** (§1.1 : une demande
adressée à B passe avant la story suivante). Le tracker rouvre l'entrée de 979 (`in-progress`) le temps de la suite et
la referme (`done`) dans la PR de docs finale.
**Sources lues :** journal de D (la demande, mot pour mot) ; fiche et entrée de STORY-1066 (D-1066-9, D-1065-15) ;
manifeste `manifestes/facturation.manifest.ts` à `prospera-stories@24049e4` (1.1.0, sha256
`80933b6183648f4ea86a6de95aa18f6dde1368ab8ce182e37868e2535f273458`, vérifié sur le blob et sur une extraction LF) ;
`origin/dev` de `prospera-ventes-service` (`adaa2bb`, lu sans y toucher : `DROIT_DE_VALIDATION_DE_L_AVOIR =
'facturation:avoir:valider'`). Code relu sur `origin/dev` d'auth `c0f6243` (`droits-hors-jeton.ts`,
`table-d-acces-distributeur.ts` et leurs tests) et du catalogue `706f1b8` (`copies.json`, `scripts/manifestes/`).

**Ce qui existait déjà (relu avant le code) :** aucun `facturation:avoir:valider` dans auth (`git grep` sur
`origin/dev`) ; le `DIST_DAF` détient déjà `facturation:avoir:emettre` (annexe B.2). Au catalogue,
`manifestes:garde` contre `24049e4` : **rouge sur `facturation` seul** (`manifeste.droits[7]`, `manifeste.version`).
Entre `24049e4` et `origin/main` (`7197de4`), `manifestes/` n'a pas changé (diff vide) : la copie depuis `24049e4` est
aussi celle de `main`.

| Exigence | Fait |
|---|---|
| `facturation:avoir:valider` au catalogue de tenant, hors du jeton, libellé « Valider un avoir au-delà du seuil » | une entrée de `DROITS_HORS_JETON`, à la fin de la section `facturation` (ordre du manifeste) |
| Au `DIST_DAF` seul | une ligne d'`AJOUTS_A_L_ANNEXE_B` (`['DAF']`) |
| La borne du jeton ne bouge pas ; `dv` n'avance pas | aucun code dans `perms[]` (17 + 24 = 41 ≤ 44) ; données seules, pas d'événement |
| Les droits `facturation` d'auth = ceux du manifeste 1.1.0 | les huit, dans l'ordre du manifeste (test écrit en toutes lettres) |
| La copie du manifeste `facturation` 1.1.0 au catalogue | `copies.json` depuis `prospera-stories@24049e4` ; `manifestes:garde` verte (48) |

### Décisions (prises par défaut, contestables)

- **D-979-10 — Une suite de 979, pas une story neuve.** La plage de B (930 → 979) est épuisée, et le travail est
  celui de 979 (même voie, mêmes fichiers, même recopie promise par D-979-7). L'entrée du tracker est rouverte puis
  refermée ; la marque haute ne bouge pas.
- **D-979-11 — `facturation:avoir:valider`, hors du jeton, au DAF seul.** À la lettre du manifeste 1.1.0 (C7,
  D-1066-9), 25 caractères, libellé « Valider un avoir au-delà du seuil » (celui que D propose). L'annexe B.2 ne le
  nomme pas : il entre dans `AJOUTS_A_L_ANNEXE_B`, comme `facturation:parametres:modifier`. Rôle par défaut :
  **`DIST_DAF`**, lui seul, comme D le demande ; ni le comptable (qui émet des avoirs, mais sous le seuil), ni le DG,
  ni l'administrateur : une surcharge de l'organisation peut le leur donner. Le droit s'exerce avec
  `facturation:avoir:emettre`, que le DAF détient déjà (vérifié par test). Placé à la fin de la section `facturation`
  du catalogue, après `facturation:parametres:modifier`, dans l'ordre des `droits` du manifeste.
- **D-979-12 — La copie depuis `24049e4`, entière.** `npm run manifestes:copier` lit tout `manifestes/` : lancé depuis
  `_wt-b-stories` en HEAD détachée sur `24049e4` (`origine` : `prospera-stories@24049e4`), comparé à une copie faite
  depuis `git -c core.autocrlf=false archive 24049e4 manifestes` : identiques, sauf la ligne `origine`. Seul
  `facturation` change : version 1.0.0 → **1.1.0** et `droits[7]` (`facturation:avoir:valider`) ; la 1.1.0 porte aussi
  `facturation:parametres:modifier` (déjà copié en 1.0.0 par D-979-7).
- **D-979-13 — La 1.1.0 atteint une base déjà semée.** Le semis n'écrit pas une version déjà publiée, mais une version
  neuve se sème à côté de l'ancienne (comme `ged` 1.1.0, D-979-8) : la limite de D-979-7 (« la copie diffère du
  manifeste publié ») tombe pour `facturation`. Sans effet sur l'attribution : auth ne lit pas cette copie, `ventes`
  lit `/moi/droits`.
- **D-979-14 — Le point (3) de D est une story neuve, après le lot 6.** Consommer `facturation.avoir.emis@1` dans
  `paiement` (réduire la Créance `(FACTURE, factureId)`, le crédit du tiers au-delà du reste dû, le rejeu sur
  `avoirId`) n'est ni un droit ni une copie : c'est un consommateur Kafka, un état et sa preuve sur pile. La session
  du groupe B le place **après les sept stories du lot 6**, sous un identifiant neuf réservé au moment d'écrire sa
  fiche (au-delà de la marque haute, la plage de B étant épuisée). Écrit dans le journal de B comme demande ouverte ;
  aucun identifiant n'est réservé ici. Jusque-là, l'avoir est émis, numéroté, publié et imprimé, mais le reste dû lu
  chez `paiement` ne baisse pas (D le sait : sa demande le dit).
- **D-979-15 — Sans Docker** (comme D-979-9). Aucun module Nest, aucune dépendance, aucun Dockerfile ne change : une
  liste de données dans auth, une copie JSON semée au démarrage du catalogue. Le verrou n'est pas pris.
- **D-979-16 — Aucun contrat ne change de forme.** Le jeton ne change pas ; `moi-droits` reste en 1.1.0 (seules les
  valeurs de `droitsHorsJeton` du DAF changent) ; `identity.droits.changed@1` ne porte aucun droit. Annoncé quand même
  dans « ⚠ Contrats » avant la fusion (valeur visible de D, droit neuf visible de la console).

### Livraison de la suite

Toutes fusionnées en « Rebase and merge », `merged = true`, `head.sha` = SHA poussé, arbre de la branche identique à
`dev` après rejeu :

- **auth #49** : **`b49d8ab` sur `dev`** (tête de la PR `b9732be`). Fichiers : `src/common/rbac/droits-hors-jeton.ts`,
  `src/modules/rbac/table-d-acces-distributeur.ts` (`AJOUTS_A_L_ANNEXE_B`) ; tests du catalogue, de la table d'accès
  du distributeur, de la résolution et du catalogue de composition.
- **catalogue #71** : **`de988b1` sur `dev`** (tête `f9a4ecb`) — `copies.json` depuis `prospera-stories@24049e4`
  (`facturation` 1.1.0, `droits[7]`).
- Contrat annoncé avant la fusion : stories #789 (fiche, tracker rouvert, « ⚠ Contrats »), `a0f49f0` sur `main`.
- D prévenue directement (session du groupe D) avec les n° de PR et les SHA sur `dev`.

### Preuves de la suite

- **Sans Docker** (D-979-15) : aucun module, aucune dépendance, aucun Dockerfile touchés ; verrou non pris.
- **Auth, Node 25, tests relancés par chemin** (`src/common/rbac`, `src/modules/rbac`, `droits`,
  `organization-roles`, `tenant-roles`, `admin`, `memberships`) : **36 suites, 592/592**. Ce qu'ils vérifient :
  - `facturation:avoir:valider` au catalogue, hors du jeton, au format, 25 caractères, module et libellé écrits en
    toutes lettres ; la section `facturation` du catalogue = les huit `droits` du manifeste 1.1.0, dans son ordre ;
    catalogue 165 codes (24 + 141) ;
  - le droit détenu par `DIST_DAF` et par lui seul, qui détient aussi `facturation:avoir:emettre` ; la résolution le
    met dans `droitsHorsJeton` du DAF, ni dans `perms[]` ni dans `droits` ; le comptable, le DG et l'administrateur ne
    l'ont pas ; un ajout n'est pas une ligne de l'annexe ;
  - le catalogue de composition d'un rôle offre le code neuf, indisponible tant que le module n'est pas souscrit.
- **Auth, suite complète (Node 25)** : 102 suites, **1 448 passés** (1 445 + 3), 4 suites rouges connues (binding
  natif de Confluent : `app-cablage.invariant.spec.ts` et les trois `src/kafka/*`). `tsc --noEmit`, lint des six
  fichiers touchés et build : verts.
- **Auth, mutations : 5/5 rouges sur assertion**, aucune par compilation : le droit à personne (4 tests), aussi au
  comptable (3), au DG au lieu du DAF (4), le libellé changé (2), le droit placé avant les paramètres (l'ordre du
  manifeste, 2).
- **Catalogue, Node 25** : `manifestes:garde` **rouge avant la copie** (`facturation` : `droits[7]`, `version`),
  **verte après (48)**, contre `24049e4` puis contre `origin/main` (`a0f49f0`) ; sha256 du manifeste vérifié sur le
  blob et sur l'extraction LF ; les deux copies (worktree en CRLF, `git archive`) identiques hors `origine` ;
  catalogue, installation, entitlements, packs : 48 suites, 777/777 ; suite complète 104 suites, **1 607 passés**,
  3 suites rouges connues (binding de Confluent).
- **Copies entre dépôts** : le code lu par D (`DROIT_DE_VALIDATION_DE_L_AVOIR` sur `dev` de ventes, `adaa2bb`) est
  celui d'auth, à l'octet.

### Pour la suite

- **D** : un avoir au-delà du seuil passe pour un `DIST_DAF` sur une image d'auth reconstruite depuis `dev` (cache de
  60 s compris) ; un catalogue déjà semé reçoit `facturation` 1.1.0 à son prochain démarrage (D-979-13).
- **B** : le consommateur de `facturation.avoir.emis@1` dans `paiement` (D-979-14), story neuve après le lot 6.

---

## Suite du 2026-11-24 (soir) : les manifestes `ged` 1.3.0 et `comptabilite` 0.5.0

**Demande servie :** journal de C, « → B (24/11, STORY-1087, 1088 puis 1100) » (`ged` 1.3.0, source
`manifestes/ged.manifest.ts` à `f703671`) et « → B (24/11, STORY-1100) » (`comptabilite` 0.5.0, source
`manifestes/comptabilite.manifest.ts` à `a525d76`) ; journal de B, « ← C (24/11, STORY-1088 puis STORY-1100) ».
**Pourquoi 979 et pas une story neuve :** même patron que la recopie de `facturation` 1.1.0 (D-979-10, catalogue #71) :
une recopie de manifestes, sans identifiant neuf. Branche `MNV-979-manifestes-ged-comptabilite` (catalogue seul), docs
`docs-979-ged-comptabilite`.
**Place :** décidée par la session du groupe B, **maintenant, avant STORY-1116**, après la suite de STORY-1112
(§1.1 : une demande adressée à B passe avant la story suivante). Le tracker rouvre l'entrée de 979 (`in-progress`) le
temps de la suite et la referme (`done`) dans la PR de docs finale.
**Sources lues :** journaux de C et de B (les deux demandes, mot pour mot) ; `manifestes/ged.manifest.ts` à
`prospera-stories@f703671` (1.3.0, sha256 `d40d604d9472f4a6d53878d2952e554e2796f48c5bc74ce06bdfcb8e2f2f0626`) et
`manifestes/comptabilite.manifest.ts` à `a525d76` (0.5.0, sha256
`b129d891b77937148855e314ebcba410446839eaacf8612be97337a7f963538c`), vérifiés sur le blob et sur une extraction LF ;
code relu sur `origin/dev` du catalogue `0894425` (`copies.json`, `scripts/manifestes/`, `manifestes-seed.service.spec.ts`,
le schéma du manifeste) et d'auth `d69e34c` (`droits-hors-jeton.ts`, `table-d-acces-cabinet.ts`) ; lus sans y toucher :
`origin/dev` de `document-service` (`0716a58`) et de `prospera-comptabilite-service` (le topic
`comptabilite.facture.inscrite`, sans suffixe, des deux côtés).

**Ce qui existait déjà (relu avant le code) :** au catalogue, `ged` en 1.1.0 (catalogue #69) et `comptabilite` en
0.4.0. Les deux SHA nommés par C sont sur `origin/main` ; `a525d76` est un ancêtre de `f703671`, et entre `f703671` et
`origin/main` (`b0efacc`), `manifestes/` n'a pas changé : la copie depuis `f703671` est celle de `main`.
`manifestes:garde` contre `f703671` : **rouge sur `ged` et `comptabilite` seuls** (`ged` : `version`, `consomme[10 → 12]`,
`routesLectureSeule[17 → 31]` ; `comptabilite` : `version`, `publie[1]`) ; aucun autre manifeste ne diffère.

| Exigence | Fait |
|---|---|
| `ged` 1.3.0 au catalogue (la 1.2.0 n'est pas semée seule) | `copies.json` depuis `prospera-stories@f703671` : 1.1.0 → **1.3.0**, consomme `comptabilite.facture.inscrite`, quatorze routes de lecture du cabinet de plus |
| `comptabilite` 0.5.0 au catalogue | même copie : 0.4.0 → **0.5.0**, publie `comptabilite.facture.inscrite` ; aucune route neuve |
| Les droits des deux manifestes existent au catalogue de tenant d'auth | les neuf `comptabilite:*` et les sept `ged:*` du cabinet : oui, à l'octet ; aucun droit ne change entre 1.1.0 et 1.3.0 (D-979-19) |
| Rien d'autre ne change | garde rouge avant sur ces deux seuls ; verte après (48) |

### Décisions (prises par défaut, contestables)

- **D-979-17 — Une seconde suite de 979, avant STORY-1116.** Décidée par la session du groupe B (comme D-979-10) :
  la plage de B est épuisée et le travail est celui de 979 (même fichier, même voie que D-979-8 et D-979-12). D-979-16
  étant déjà prise par la première suite, les décisions de celle-ci commencent à D-979-17.
- **D-979-18 — La copie depuis `f703671`, entière.** `npm run manifestes:copier` lit tout `manifestes/` : lancé depuis
  `_wt-b-stories` en HEAD détachée sur `f703671` (`origine` : `prospera-stories@f703671`), comparé à une copie faite
  depuis `git -c core.autocrlf=false archive f703671 manifestes` : identiques, sauf la ligne `origine`. `a525d76` (le
  SHA de `comptabilite` nommé par C) est un ancêtre de `f703671` et `comptabilite.manifest.ts` n'a pas changé entre eux
  (même sha256) : une seule copie sert les deux demandes. La garde a montré, avant la copie, que **seuls `ged` et
  `comptabilite`** changent : aucun autre manifeste n'est entraîné. La 1.2.0 de `ged` n'a jamais été sur une copie :
  une base déjà semée garde sa 1.1.0 et reçoit la 1.3.0 à côté (D-979-13), sans 1.2.0.
- **D-979-19 — Aucun droit à ajouter dans auth ; un écart ancien, écrit et non comblé.** La 1.3.0 de `ged` et la 0.5.0
  de `comptabilite` ne changent aucun `droits` (garde). Les neuf `comptabilite:*` et les sept `ged:*` du cabinet sont au
  catalogue de tenant d'auth (`DROITS_HORS_JETON`, `table-d-acces-cabinet.ts`), à l'octet. **Les treize autres `ged:*`
  du manifeste** (`ged:piece:recevoir`, `…:controler`, `…:rattacher`, `ged:fonds:verser`, `…:sceller`, `…:verifier`,
  `ged:papier:sortir`, `ged:dossier:reconstituer`, `ged:destruction:proposer`, `…:viser`, `ged:sante:consulter`,
  `ged:parametre:administrer`, `ged:journal:consulter`), présents depuis la 1.0.0, **ne sont pas dans auth** : ils
  désignent les rôles de l'assurance (ACC, NUM, ARCH, AUD, RESP, DG), qu'auth ne connaît pas (aucun droit `sinistres:`,
  `assurance:` ni table d'accès de ce métier), et aucune garde de `document-service` ne les lit (son recensement ne
  classe que les routes du cabinet, droits du cabinet). Les poser sans rôle n'attribuerait rien et les offrirait à la
  composition des rôles d'un cabinet sans route qui les lise : **non posés ici**. Ils entreront avec la table d'accès
  du métier de l'assurance, dans la story qui la fera. Information à C (« → C »).
- **D-979-20 — Le test de semis suit la copie.** `manifestes-seed.service.spec.ts` épinglait `comptabilite` en 0.4.0 :
  il passe en 0.5.0, et un test neuf vérifie le fait publié par `comptabilite`, consommé par `ged` 1.3.0, et une route
  de la mémoire de classement. Aucune logique neuve : les mutations portent sur la copie (D-979-22).
- **D-979-21 — Sans Docker** (comme D-979-15). Aucun module Nest, aucune dépendance, aucun Dockerfile ne change : une
  copie JSON semée au démarrage du catalogue. Le verrou n'est pas pris.
- **D-979-22 — Contrats.** Deux manifestes publiés au catalogue changent de version (`ged` 1.3.0, `comptabilite`
  0.5.0) ; aucune route, aucun champ, aucun topic du catalogue ne change de forme. Annoncé dans « ⚠ Contrats » avant la
  fusion. Le topic `comptabilite.facture.inscrite` est écrit sans `@1` par ses deux manifestes et par le code des deux
  services (même graphie) : le schéma du manifeste le permet ; information à C, sans effet ici.

### Livraison de la suite (soir)

Fusionnée en « Rebase and merge », `merged = true`, `head.sha` = SHA poussé, arbre de la branche identique à `dev`
après rejeu :

- **catalogue #74** : **`1aa17ae` sur `dev`** (tête de la PR `f22f6f9`). Fichiers : `copies.json` depuis
  `prospera-stories@f703671` ; `manifestes-seed.service.spec.ts`.
- Contrat annoncé avant la fusion : stories #843 (fiche, tracker rouvert, « ⚠ Contrats »), `ada5b81` sur `main`.
- C prévenue par son journal (« → C », journal de B).

### Preuves de la suite (soir)

- **Sans Docker** (D-979-21) : aucun module, aucune dépendance, aucun Dockerfile touchés ; verrou non pris.
- **Catalogue, Node 25** : `manifestes:garde` **rouge avant la copie** (`ged` et `comptabilite` seuls), **verte après
  (48)**, contre `f703671` puis contre `origin/main` (`b0efacc`) ; sha256 des deux manifestes vérifiés sur le blob et sur
  l'extraction LF ; les deux copies (worktree, `git archive`) identiques hors `origine`.
- **Tests relancés par chemin** : `src/modules/catalog/manifeste` 3 suites, 58/58 (le test de semis rouge sur
  `0.4.0` avant sa mise à jour) ; **suite complète : 104 suites, 1 619 passés**, 3 suites rouges connues (binding
  natif de Confluent sous Node 25 : `app-cablage.invariant.spec.ts`, `kafka-producer.service.spec.ts`,
  `outbox-relay.service.spec.ts`).
- **Lint** du spec touché (contenu indexé, LF) et **build** : verts. `copies.json` est généré (ni lint ni prettier,
  comme avant).
- **Mutations : 2/2 rouges sur assertion** (test de semis et garde) : `comptabilite` remis en 0.4.0 ;
  `comptabilite.facture.inscrite` retiré de ce que `ged` consomme.

### Pour la suite (soir)

- **C** : un catalogue neuf sème `ged` 1.3.0 et `comptabilite` 0.5.0 ; un catalogue déjà semé les reçoit à son prochain
  démarrage, à côté des versions publiées (D-979-13). Les treize `ged:*` de l'assurance restent hors d'auth (D-979-19).
- **B** : STORY-1116.

---

## Suite du 2026-11-25 : les manifestes `facturation` 1.2.0, `paiement` 1.1.0 (et `balance` 1.1.0)

**Demande servie :** journal de D, « → B (2026-11-25, STORY-1073) : recopier au catalogue (`platform-catalog-service`)
deux manifestes amendés à la source » (`facturation` 1.2.0 et `paiement` 1.1.0, `main` `bd9340e`, #845) ; journal de
B, « ← D (25/11, STORY-1073) ». **Entraînée par la copie entière :** journal de C, « → B (25/11, STORY-1117) :
recopier au catalogue le manifeste `balance` 1.1.0 » (D-979-24).
**Pourquoi 979 et pas une story neuve :** même patron que les deux premières suites (catalogue #71 et #74) : une
recopie de manifestes, sans identifiant neuf. Branche `MNV-979-manifestes-facturation-paiement` (catalogue seul), docs
`docs-979-facturation-paiement`.
**Place :** lot 7 de B, **ordre « a »** (D-L7B-2 : les demandes reçues passent d'abord). Le tracker rouvre l'entrée de
979 (`in-progress`) le temps de la suite et la referme (`done`) dans la PR de docs finale.
**Sources lues :** journaux de D, de C et de B (les demandes, mot pour mot ; « ⚠ Contrats » de STORY-1073) ;
`manifestes/facturation.manifest.ts` à `prospera-stories@bd9340e` (1.2.0, sha256
`b7b9e0c83f8f1fba29868ab29545910b01051c06d2080ba0ae3b7912cf1bd933`, l'empreinte que D nomme), `manifestes/paiement.manifest.ts`
(1.1.0, sha256 `11685333ec2a895b02fdf505be7f6ef66de72d92241783841edf931c7358ab2f`) et `manifestes/balance.manifest.ts`
(1.1.0, sha256 `097fa17ea83ed268cf5f94a5a787a316feed9b049d982c720350975ee9cd6b0f`), vérifiés sur le blob et sur une
extraction LF ; code relu sur `origin/dev` du catalogue `1aa17ae` (`copies.json`, `scripts/manifestes/`,
`manifestes-seed.service.spec.ts`, `divergences.json` vide).

**Ce qui existait déjà (relu avant le code) :** au catalogue, `facturation` en 1.1.0 (catalogue #71), `paiement` en
1.0.0, `balance` en 1.0.0 ; aucune PR ouverte. `manifestes:garde` contre `bd9340e` : **rouge sur `balance`,
`facturation` et `paiement` seuls** (`balance` : `version`, `routesLectureSeule[2 → 11]` ; `facturation` : `version`,
`consomme[10 → 17]` ; `paiement` : `version`, `publie[15 → 27]` — des insertions, les index suivants glissent) ; aucun
`droits` ne diffère. Entre `bd9340e` et `origin/main` (`bdf7218`), `manifestes/` n'a bougé que pour `balance` (1.2.0,
STORY-1020 de C, contrat annoncé avant un code encore en cours).

| Exigence | Fait |
|---|---|
| `facturation` 1.2.0 au catalogue | `copies.json` depuis `prospera-stories@bd9340e` : 1.1.0 → **1.2.0**, consomme `paiement.compte.changed@1`, `dossier.created`, `dossier.updated` ; ses huit `droits`, ses routes inchangés |
| `paiement` 1.1.0 au catalogue | même copie : 1.0.0 → **1.1.0**, publie `paiement.compte.changed@1` ; aucun droit, aucune route neuve |
| `balance` 1.1.0 (demande de C, entraînée) | même copie : 1.0.0 → **1.1.0**, `GET …/balances/reference` et `GET …/balances/resumes` ; la 1.2.0 de `main` n'est pas copiée (D-979-24) |
| Aucun droit à poser dans auth | aucun `droits` ne change dans les trois (garde) ; auth inchangé (D-979-25) |
| Rien d'autre ne change | garde rouge avant sur ces trois seuls ; verte après (48) contre `bd9340e` |

### Décisions (prises par défaut, contestables)

- **D-979-23 — Une troisième suite de 979, ordre « a » du lot 7 de B.** Décidée par la session du groupe B (D-L7B-2,
  comme D-979-10 et D-979-17) : aucun identifiant neuf, même fichier, même voie. Les décisions commencent à D-979-23.
- **D-979-24 — La copie depuis `bd9340e`, entière ; `balance` 1.1.0 y entre, pas la 1.2.0.** `npm run
  manifestes:copier` lit tout `manifestes/` : lancé depuis `_wt-b-stories` en HEAD détachée sur `bd9340e`
  (`origine` : `prospera-stories@bd9340e`), comparé à une copie faite depuis `git -c core.autocrlf=false archive
  bd9340e manifestes` : identiques, sauf la ligne `origine`. À `bd9340e`, `balance` est déjà en **1.1.0** (STORY-1117
  de C, source `398faa9`, code fusionné : balance-service #161) : C l'a demandée à B (« → B (25/11, STORY-1117) »,
  ouverte). Une copie qui garderait `balance` en 1.0.0 demanderait un motif de divergence contre la demande de son
  propriétaire : la demande, minuscule et dans un dépôt de B, est **servie ici**. Depuis, `main` porte `balance`
  **1.2.0** (STORY-1020, `bdf7218`) : contrat annoncé, **code non fusionné** ; la copier offrirait au catalogue une
  route que `balance-service` ne sert pas encore (même règle que D-979-8 : la copie suit la fusion du code). Elle n'est
  pas copiée : **`manifestes:garde` contre `origin/main` est rouge sur `balance` seul** (`version`,
  `routesLectureSeule[11, 12]`), et le restera jusqu'à la recopie de la 1.2.0, que C demandera après sa fusion.
- **D-979-25 — Aucun droit à ajouter dans auth.** Les trois manifestes ne changent aucun `droits` (garde) : les huit
  `facturation:*` de la 1.1.0 restent ceux d'auth (première suite) ; `paiement` et `balance` n'en gagnent aucun.
- **D-979-26 — Le test de semis suit la copie.** Deux tests neufs dans `manifestes-seed.service.spec.ts` : `paiement`
  1.1.0 publie `paiement.compte.changed@1`, que `facturation` 1.2.0 consomme avec `dossier.created` et
  `dossier.updated` (ses huit droits inchangés) ; `balance` 1.1.0 porte ses deux routes de lecture neuves. Rouges sur
  la copie d'avant (2 échecs), verts après. Aucune logique neuve : les mutations portent sur la copie.
- **D-979-27 — Sans Docker** (comme D-979-15 et D-979-21). Aucun module Nest, aucune dépendance, aucun Dockerfile ne
  change : une copie JSON semée au démarrage du catalogue. Le verrou n'est pas pris.
- **D-979-28 — Contrats.** Trois manifestes publiés au catalogue changent de version ; aucune route, aucun champ,
  aucun topic du catalogue ne change de forme. Une base déjà semée reçoit les trois versions neuves à son prochain
  démarrage, à côté des publiées (D-979-13). `dossier.created` et `dossier.updated` sont écrits sans suffixe, comme le
  code de `dossier-service` (le schéma du manifeste le permet). Annoncé dans « ⚠ Contrats » avant la fusion.

### Livraison de la suite (25/11)

Fusionnée en « Rebase and merge », `mergedAt` non nul, `headRefOid` = SHA poussé, arbre de la branche identique à
`dev` après rejeu :

- **catalogue #75** : **`0425fef` sur `dev`** (tête de la PR `d5f2b2e`). Fichiers : `copies.json` depuis
  `prospera-stories@bd9340e` ; `manifestes-seed.service.spec.ts`.
- Contrat annoncé avant la fusion : stories #891 (fiche, tracker rouvert, « ⚠ Contrats »), `78c2268` sur `main`.
- D et C prévenues par le journal de B (« → D », « → C », « Réponses aux demandes reçues »).

### Preuves de la suite (25/11)

- **Sans Docker** (D-979-27) : aucun module, aucune dépendance, aucun Dockerfile touchés ; verrou non pris.
- **Catalogue, Node 25** : `manifestes:garde` **rouge avant la copie** (`balance`, `facturation`, `paiement` seuls),
  **verte après (48)** contre `bd9340e` ; contre `origin/main` (`bdf7218`), rouge sur `balance` seul (la 1.2.0,
  D-979-24) ; sha256 des trois manifestes vérifiés sur le blob et sur l'extraction LF ; les deux copies (worktree,
  `git archive`) identiques hors `origine`.
- **Tests relancés par chemin** : `src/modules/catalog/manifeste` 3 suites, **60/60** (les deux tests neufs rouges sur
  la copie d'avant) ; **suite complète : 104 suites, 1 621 passés** (1 619 + 2), 3 suites rouges connues (binding
  natif de Confluent sous Node 25 : `app-cablage.invariant.spec.ts`, `kafka-producer.service.spec.ts`,
  `outbox-relay.service.spec.ts`).
- **Lint** du spec touché (contenu en LF) et **build** : verts. `copies.json` est généré (ni lint ni prettier).
- **Mutations : 3/3 rouges sur assertion** (test de semis et garde) : `paiement.compte.changed@1` retiré de ce que
  `paiement` publie ; `facturation` remis en 1.1.0 ; la route `…/balances/resumes` retirée de `balance`.

### Pour la suite (25/11)

- **D** : un catalogue neuf sème `facturation` 1.2.0 et `paiement` 1.1.0 ; un catalogue déjà semé les reçoit à son
  prochain démarrage (D-979-13). Le catalogue des faits du distributeur v2 n'est pas copié par le catalogue (D le dit).
- **C** : `balance` 1.1.0 est au catalogue ; la 1.2.0 (STORY-1020) s'y recopie après la fusion de son code, sur
  demande (D-979-24).
- **B** : ordre « b » du lot 7, le correctif de STORY-1073 (`formeJuridique` sur les dossiers clients).

---

## Quatrième suite (2026-11-25) : le manifeste `balance` 1.2.0

**Demande servie :** journal de C, « → B (25/11, STORY-1020) : recopier au catalogue le manifeste `balance` **1.2.0**
(source `manifestes/balance.manifest.ts`, contrat de STORY-1020) : une route d'export neuve en `routesLectureSeule`
(`…/rapprochement/etat/export`) » ; journal de B, « ← C (25/11, STORY-1020) », placée par la session de groupe
(D-L7B-6, 2) : **dès la fusion du code de C** sur `dev` de `balance-service`, **pas avant** (D-979-24).
**Pourquoi 979 et pas une story neuve :** même patron que les trois premières suites (catalogue #71, #74, #75) : une
recopie de manifestes, sans identifiant neuf. Branche `MNV-979-manifeste-balance` (catalogue seul), docs
`docs-979-balance`.
**Place :** lot 7 de B, entre l'ordre « c » (correctif de STORY-1115, fait) et STORY-1119 (n° 1). Le tracker rouvre
l'entrée de 979 (`in-progress`) le temps de la suite et la referme (`done`) dans la PR de docs finale.
**Sources lues :** journaux de C et de B (la demande, mot pour mot ; « PUBLIÉ » de STORY-1020 au journal de C : route
`GET /api/v1/dossiers/{dossierId}/rapprochement/etat/export`, mêmes gardes que `…/etat`) ;
`manifestes/balance.manifest.ts` à `prospera-stories@ac8e450` (`origin/main`, 1.2.0, sha256
`44f89c99dc923a75ae8963a8e4ef8a3eb1ff0bdc5e06c8c407417134f1d8fefe`, le même sur le blob et sur l'extraction LF) ;
`git log bd9340e..ac8e450 -- manifestes/` ; code relu sur `origin/dev` du catalogue `0425fef` (`copies.json`,
`scripts/manifestes/`, `manifestes-seed.service.spec.ts`, `divergences.json` vide).
**Le code de C est fusionné (vérifié avant la copie) :** balance-service **#165** `MERGED`, `mergedAt`
`2026-11-25T13:44:18Z`, base `dev`, commit de fusion `58322c4` ; `dev` de `balance-service` lui est identique
(comparaison GitHub `58322c4...dev` : `identical`) ; `src/modules/rapprochement/rapprochement.controller.ts` sur
`dev` sert `@Get('etat/export')` (`@SorteDeRoute('export')`).

**Ce qui existait déjà (relu avant le code) :** au catalogue (`origin/dev` `0425fef`), `balance` en **1.1.0** (copie
de `bd9340e`, catalogue #75) : **la 1.2.0 n'y est pas** ; aucune PR ouverte. `manifestes:garde` contre `ac8e450` :
**rouge sur `balance` seul** (`version`, `routesLectureSeule[11, 12]` : une insertion, l'index suivant glisse). Entre
`bd9340e` et `ac8e450`, `manifestes/` n'a bougé qu'une fois : `bdf7218` (STORY-1020, `balance.manifest.ts`, 3 lignes
ajoutées, 1 retirée).

| Exigence | Fait |
|---|---|
| `balance` 1.2.0 au catalogue | `copies.json` depuis `prospera-stories@ac8e450` : 1.1.0 → **1.2.0**, `GET /api/v1/dossiers/{dossierId}/rapprochement/etat/export` en `routesLectureSeule` ; ses dix `droits` inchangés |
| Le code avant le manifeste | balance-service #165 fusionné sur `dev` (`58322c4`), la route servie (D-979-30) |
| Rien d'autre n'entre avec la copie entière | un seul commit sur `manifestes/` depuis `bd9340e` ; garde rouge avant sur `balance` seul, verte après (48) (D-979-30) |
| Aucun droit à poser dans auth | aucun `droits` ne change (garde) ; auth inchangé (D-979-32) |

### Décisions (prises par défaut, contestables)

- **D-979-29 — Une quatrième suite de 979, entre la « c » et STORY-1119.** Décidée par la session du groupe B
  (D-L7B-6, 2 ; comme D-979-10, 17 et 23) : aucun identifiant neuf, même fichier, même voie. Les décisions commencent à
  D-979-29.
- **D-979-30 — La copie depuis `ac8e450`, entière ; elle n'entraîne rien d'autre.** `npm run manifestes:copier` lit
  tout `manifestes/` : lancé avec `MANIFESTES_SOURCE` sur `_wt-b-stories` en HEAD détachée sur `ac8e450` (`origin/main`
  au moment de la copie ; `origine` : `prospera-stories@ac8e450`), comparé à une copie faite depuis `git -c
  core.autocrlf=false archive ac8e450 manifestes` : identiques, sauf la ligne `origine`. Ce que la copie entière
  entraîne en plus de la demande : **rien**. Depuis `bd9340e` (la copie de #75), le seul commit qui touche
  `manifestes/` est `bdf7218` (STORY-1020), sur `balance.manifest.ts` seul ; la garde rouge avant la copie ne nomme que
  `balance`, et le diff de `copies.json` ne porte que `origine`, `version` et la route. Le code de cette route est
  fusionné (balance-service #165, ci-dessus) : la règle de D-979-8 et D-979-24 (la copie suit la fusion du code) est
  tenue. `src/module.manifest.ts` (le module `instance`, dont le catalogue est la source) ne change pas.
- **D-979-31 — Le test de semis suit la copie.** Le test de STORY-1117 épinglait `balance` en 1.1.0 ; la 1.2.0 contient
  la 1.1.0 (C : « une seule recopie suffit ») : il ne fige plus la version et garde ses deux routes. Un test neuf
  épingle `balance` **1.2.0**, la route d'export à côté de `…/etat`, et ses dix droits. Rouge sur la copie d'avant
  (1 échec), vert après. Aucune logique neuve : les mutations portent sur la copie.
- **D-979-32 — Aucun droit à ajouter dans auth.** La 1.2.0 ne change aucun `droits` (garde) : la route d'export a
  « mêmes gardes et refus que `…/etat` » (journal de C, « PUBLIÉ ») et ne demande aucun droit neuf. Auth inchangé.
- **D-979-33 — Sans Docker** (comme D-979-15, 21 et 27). Aucun module Nest, aucune dépendance, aucun Dockerfile ne
  change : une copie JSON semée au démarrage du catalogue. Le verrou n'est pas pris.
- **D-979-34 — Contrats.** Un manifeste publié au catalogue change de version ; aucune route, aucun champ, aucun topic
  du catalogue ne change de forme. Une base déjà semée reçoit `balance` 1.2.0 à son prochain démarrage, à côté de la
  1.1.0 publiée (D-979-13). La garde contre `main` redevient verte : la réserve de D-979-24 est levée. Annoncé dans
  « ⚠ Contrats » avant la fusion.

### Livraison de la quatrième suite (25/11)

Fusionnée en « Rebase and merge », `mergedAt` non nul, `headRefOid` = SHA poussé, arbre de la branche identique à
`dev` après rejeu :

- **catalogue #76** : **`66a4f6c` sur `dev`** (tête de la PR `64e4a62`, `mergedAt` `2026-11-25T20:46:55Z`). Fichiers :
  `copies.json` depuis `prospera-stories@ac8e450` ; `manifestes-seed.service.spec.ts`.
- Contrat annoncé avant la fusion : stories #913 (fiche, tracker rouvert, « ⚠ Contrats »), `0ee7144` sur `main`.
- `main` a avancé pendant la suite (`df4b606`, `0ee7144`) sans toucher `manifestes/` : `manifestes:garde` contre
  `0ee7144` verte (48) après la fusion.
- C prévenue par le journal de B (« Réponses aux demandes reçues »).

### Preuves de la quatrième suite (25/11)

- **Sans Docker** (D-979-33) : aucun module, aucune dépendance, aucun Dockerfile touchés ; verrou non pris.
- **Catalogue, Node 25** : `manifestes:garde` **rouge avant la copie** (`balance` seul : `version`,
  `routesLectureSeule[11, 12]`), **verte après (48)** contre `ac8e450` ; sha256 de `balance.manifest.ts` vérifié sur le
  blob et sur l'extraction LF ; les deux copies (worktree, `git archive`) identiques hors `origine`.
- **Tests relancés par chemin** : `src/modules/catalog/manifeste` 3 suites, **61/61** (le test neuf rouge sur la copie
  d'avant) ; **suite complète : 104 suites, 1 622 passés** (1 621 + 1), 3 suites rouges connues (binding natif de
  Confluent sous Node 25 : `app-cablage.invariant.spec.ts`, `kafka-producer.service.spec.ts`,
  `outbox-relay.service.spec.ts`).
- **Lint** du spec touché (contenu en LF) et **build** : verts. `copies.json` est généré (ni lint ni prettier).
- **Mutations : 3/3 rouges sur assertion** (test de semis et garde) : la route `…/rapprochement/etat/export` retirée
  de `balance` ; `balance` remis en 1.1.0 ; un de ses droits retiré.

### Pour la suite (25/11, quatrième suite)

- **C** : `balance` 1.2.0 est au catalogue ; un catalogue déjà semé la reçoit à son prochain démarrage (D-979-13).
- **A** : rien à régénérer (aucune OpenAPI du catalogue ni du BFF ne change ; FE-077 appelle la route de
  `balance-service`).
- **B** : STORY-1119 (n° 1 du lot 7).

---

## Cinquième suite (2026-11-26) : le manifeste `paiement` 1.2.0 (et `ged` 1.10.0)

**Demande servie :** journal de D, « → B (2026-11-26, STORY-1141) : recopier le manifeste `paiement` 1.2.0 au
catalogue » (source `manifestes/paiement.manifest.ts`, `main` `6a5d3ab`, #967 ; code fusionné : paiement #126,
`f6a4800` et `64b5838`). **Entraînée par la copie entière :** `ged` 1.10.0, la suite « f » de STORY-1119 (← C,
STORY-324 ; source `10d9d6e`, #976 ; code fusionné : document-service #40, `5d060aa`), qui la laissait à cette PR
(D-1119-25).
**Place :** lot 7 de B, **ordre « g »** (D-L7B-11 : après « f », avant STORY-1126). Branche
`MNV-979-manifestes-paiement-ged` (catalogue seul), docs `docs-979-paiement-ged`. Le tracker rouvre l'entrée de 979
(`in-progress`) le temps de la suite et la referme dans la PR de docs finale.
**Sources lues :** journal de D (la demande, mot pour mot ; « ← B : passation de `prospera-paiement-service` (1141) —
rendu à B ») ; `manifestes/paiement.manifest.ts` à `6a5d3ab` et à `main` (identiques : sha256
`d247fcc9cc45eb5e23150e66bd04995bcee2a6125495abac955db7fcd32bdca9`, 1.2.0) ; `manifestes/ged.manifest.ts` à `main`
(1.10.0, `0a0f68268e5e79b3745f016e979e87475354fbc0bdb832bc49df3b1e294acbb0`) ; code relu sur `origin/dev` du catalogue
`9674aeb` (`copies.json`, `scripts/manifestes/`, `manifestes-seed.service.spec.ts`).

**Ce qui existait déjà (relu avant le code) :** au catalogue, `paiement` 1.1.0 et `ged` 1.9.0 ; aucune PR ouverte.
`manifestes:garde` contre `main` : **rouge sur `ged` et `paiement` seuls** (`ged` : `version`,
`routesLectureSeule[50, 51]` ; `paiement` : `version`) ; aucun `droits` ne diffère. Depuis `5bd506e` (la copie de 1124),
`manifestes/` n'a bougé que pour ces deux-là (`6a5d3ab`, `10d9d6e`).

| Exigence | Fait |
|---|---|
| `paiement` 1.2.0 au catalogue | `copies.json` depuis `main` : 1.1.0 → **1.2.0** ; `paiement.compte.changed@1` (déjà publié) gagne `numeroImprimable` facultatif ; la route d'écriture `PUT …/numero-imprimable` reste hors `routesLectureSeule` ; faits, droits, routes de lecture inchangés |
| `ged` 1.10.0 (« f », entraînée) | même copie : 1.9.0 → **1.10.0**, `GET /api/v1/ged/cabinet/pieces/{pieceId}/versions/{version}` en `routesLectureSeule` |
| Aucun droit à poser dans auth | aucun `droits` ne change (garde) ; auth inchangé |
| Rien d'autre ne change | garde rouge avant sur ces deux seuls ; verte après (48) contre `main` |

### Décisions (prises par défaut, contestables)

- **D-979-35 — Une cinquième suite de 979, ordre « g » du lot 7 de B.** Décidée par la session du groupe B (D-L7B-11,
  comme D-979-23) : aucun identifiant neuf, même fichier, même voie.
- **D-979-36 — La copie depuis `main`, entière : `ged` 1.10.0 y entre.** `npm run manifestes:copier` lit tout
  `manifestes/`. `paiement` 1.2.0 est sur `main` depuis `6a5d3ab`, son code fusionné (#126) ; `ged` 1.10.0 depuis
  `10d9d6e`, son code fusionné (#40) : les deux suivent leur code (D-979-24). Une seule copie, une seule PR, plutôt
  qu'une copie depuis un commit plus ancien (qui n'aurait eu que `paiement`) puis une seconde.
- **D-979-37 — Aucun droit à ajouter dans auth.** Ni `paiement` ni `ged` ne changent leurs `droits` (garde) ; la route
  neuve de `paiement` sert le droit déjà attribué `paiement:compte:administrer`.
- **D-979-38 — Le test de semis suit la copie.** Deux tests neufs dans `manifestes-seed.service.spec.ts` : `paiement`
  1.2.0 (publie toujours `paiement.compte.changed@1`, la route d'écriture hors lecture seule) ; `ged` 1.10.0 (la route de
  lecture neuve, faits et droits inchangés). Ceux de STORY-1073 et 1124 ne figent plus la version. Rouges sur la copie
  d'avant (2 échecs), verts après.
- **D-979-39 — Sans Docker** (comme D-979-27). Une copie JSON semée au démarrage du catalogue ; aucun module, aucune
  dépendance, aucun Dockerfile. Le verrou n'est pas pris.
- **D-979-40 — Contrats.** Deux manifestes publiés au catalogue changent de version ; aucune route, aucun champ, aucun
  topic du catalogue ne change de forme. Une base déjà semée reçoit les deux versions neuves à son prochain démarrage
  (D-979-13). La note « manifeste paiement 1.1.0 » du catalogue des faits du distributeur
  (`prospera-plateforme/contrats/distributeur/catalogue-faits.json`) reste à D (dossier de D dans la plateforme ;
  aucune garde ne la lit). Annoncé dans « ⚠ Contrats » avant la fusion.

### Livraison de la cinquième suite (26/11)

Fusionnée en « Rebase and merge », `mergedAt` non nul, `headRefOid` = SHA poussé, arbre de la branche identique à
`dev` après rejeu :

- **catalogue #83** : **`ce8cbc0` sur `dev`** (tête de la PR `2cb7d7e`). Fichiers : `copies.json` depuis
  `prospera-stories@59ed625` ; `manifestes-seed.service.spec.ts`.
- Contrat annoncé avant la fusion : stories #980 (fiche, tracker rouvert, « ⚠ Contrats »), `59ed625` sur `main`.
- D et C prévenus par le journal de B (« Réponses aux demandes reçues ») et par message.

### Preuves de la cinquième suite (26/11)

- **Sans Docker** (D-979-39) : verrou non pris.
- **Catalogue, Node 25** : `manifestes:garde` contre `main` **rouge avant la copie** (`ged`, `paiement` seuls), **verte
  après (48)** ; la copie ne change que ces deux manifestes (`origine` à part) ; sha256 des sources vérifiés (`paiement`
  `d247fcc9…bdca9` à `6a5d3ab` et à `main` ; `ged` `0a0f6826…acbb0`).
- **Tests relancés par chemin** : `src/modules/catalog/manifeste` 3 suites, **69/69** (les deux neufs rouges sur la copie
  d'avant) ; **suite complète : 104 suites, 1 630 passés**, 3 suites rouges connues (binding natif de Confluent sous Node
  25 : `app-cablage.invariant.spec.ts`, `kafka-producer.service.spec.ts`, `outbox-relay.service.spec.ts`). Lint du spec,
  build : verts.
- **Mutations : 3/3 rouges sur assertion** : `paiement` resté en 1.1.0 ; la route de `ged` retirée ; la route d'écriture
  de `paiement` mise en lecture seule.

### Pour la suite (26/11)

- **D** : `paiement` 1.2.0 est au catalogue ; un catalogue déjà semé le reçoit à son prochain démarrage (D-979-13).
- **C** : `ged` 1.10.0 aussi (la route de « f »).
- **B** : STORY-1126 (n° 8, la recette des archives de bout en bout).


## Sixième suite (2026-11-27) : le manifeste `comptabilite` 0.6.0 (avec `ged` 1.11.0)

**Demande servie :** C, « → B : recopier au catalogue le manifeste `comptabilite` 0.6.0 » (journal de C, #1015, `main`
`9149604` ; source `prospera-stories@0acfd14` ; code fusionné : comptabilite #21, STORY-338). Placée par la session de
groupe avec « h » (D-L7B-13, ordre « i ») : aucun identifiant neuf.

- **D-979-41 — Dans la recopie de « h ».** La copie est entière (`manifestes:copier`, D-979-36) : celle de `ged` 1.11.0
  (suite « h » de STORY-1124) depuis `prospera-stories@c926f55` emporte `comptabilite` 0.6.0, déjà sur `main` et dont le
  code est fusionné (D-979-24 tenu). Une seule PR du catalogue, deux manifestes changent, rien d'autre.
- **D-979-42 — Le test des copies suit.** `manifestes-seed.service.spec.ts` : `comptabilite` 0.6.0 publie
  `comptabilite.facture.desinscrite` (que `ged` consomme depuis 1.9.0) ; ses droits et familles inchangés ; `ged` 1.11.0.
- **Livré** : **catalogue #88**, **`e528afc` sur `dev`** (fusionnée en rebase, `headRefOid` = `b1e04aa` poussé, arbre
  identique) ; annonce avant la fusion : stories #1018 (`20b7791`). `manifestes:garde` verte (48) contre `main` ;
  `src/modules/catalog/manifeste` 71/71 (Node 25). Sans Docker pour cette copie (le verrou de « h » n'a servi qu'à « h »).
- **Pour la suite** : un catalogue déjà semé reçoit les deux versions à son prochain démarrage (D-979-13).
