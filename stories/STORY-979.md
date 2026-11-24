# STORY-979 : les droits de la facture et des archives du cabinet au catalogue de tenant d'auth

Status: in-progress

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
| La copie du manifeste `ged` 1.1.0 | **ouverte** : elle attend la fusion du code de C (D-979-8) |

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
- **D-979-8 — La copie de `ged` 1.1.0 reste ouverte.** Au moment de coder (24/11), le code de C n'est pas fusionné
  (`MNV-1087`, `a872c69`, sans PR) et la 1.1.0 n'est pas sur `main` : la demande de C est servie pour sa part d'auth,
  la recopie attend le signal de fusion de C dans son journal. Elle se fera par la prochaine story de B qui touche le
  catalogue après ce signal.
- **D-979-9 — Sans Docker.** Aucun module Nest, aucune dépendance, aucun Dockerfile ne change : des listes de données,
  un rôle du socle réaligné au démarrage par `TenantRolesSeedService` (comme 902 et 960), une copie JSON semée au
  démarrage. La preuve est la suite des deux services (relancée par chemin, puis complète), le câblage du module racine
  d'auth (binding doublé) et des mutations ; le verrou n'a pas été pris.

## Livraison

(à compléter à la fusion)

## Preuves

(à compléter)

## Pour la suite

(à compléter)
