# STORY-979 : les droits de la facture et des archives du cabinet au catalogue de tenant d'auth

Status: in-progress (rouverte le 2026-11-24 pour sa suite : « Suite du 2026-11-24 », en fin de fiche)

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
