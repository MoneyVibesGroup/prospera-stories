# STORY-906 : La balance dit son dossier et son référentiel

Status: done

**Complexité :** petite (un service, deux champs servis, un refus nommé)

**Épic :** EPIC-159 (le cabinet sur le moteur), dette d'intégration du front du cabinet
**Service :** `balance-service`
**Plage :** groupe A, n° 2 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §2). Sources :
`tickets/TICKET-BACKEND-balance-ne-declare-pas-son-dossier.md` (FE-063) et
`tickets/TICKET-BACKEND-tag-referentiel-non-expose.md` (FE-056). Fiche écrite **avant** de coder.

---

## Pourquoi

1. **Une balance servie ne dit pas son dossier.** `BalanceResponseDto` publie `orgId` mais pas `dossierId`, alors que
   le dossier est l'unité de travail depuis STORY-236 et que le champ est en base. Le front ne peut pas vérifier
   qu'une réponse appartient au dossier ouvert (FE-063 a vu un stub répondre une liste de dossiers à une demande de
   balances, en 200).
2. **Le tag de référentiel (`SN`, `SMT`, `SFD-BCEAO`, `CIMA`) exigé à `POST …/balances` n'est servi par aucune route**,
   et **un tag contradictoire est accepté** : le serveur résout le référentiel du dossier à la date de l'exercice
   (`controleurDeCompte`), juge les comptes avec lui, mais range la balance sous le tag déclaré par le client. Une IMF
   peut donc déposer une balance taguée `SN`, jugée par le RCSFD. La voie événementielle (`balance.submitted`) refuse
   déjà ce cas ; la voie HTTP non.
3. **L'import Sage écrit `SN` en dur** : sur un dossier SFD, il fabrique une balance au tag faux.

## Ce que la story livre

1. **`dossierId` publié** sur `BalanceResponseDto` (toutes les routes qui rendent une balance). Hors du checksum : le
   sceau ne couvre que le contenu métier.
2. **Le tag servi** : `GET /dossiers/:dossierId/referentiels/actifs` rend un champ `tag`, le tag canonique que porte une
   balance de ce dossier aujourd'hui.
3. **Un tag contradictoire est un 409 nommé** `REFERENTIEL_CONTRADICTOIRE` (soumission et essai à blanc), qui nomme le
   tag déclaré, le tag attendu et le référentiel résolu à la date de l'exercice.
4. **L'import Sage porte le tag du dossier**, pas `SN` en dur.

## Critères d'acceptation

- **AC-1** : toute balance servie porte `dossierId` (hex), égal au dossier de l'URL ; le checksum ne change pas.
- **AC-2** : `GET …/referentiels/actifs` rend `tag` ; pour un dossier SYSCOHADA, `SN` ; pour un dossier SFD,
  `SFD-BCEAO` ; le champ est typé dans l'OpenAPI.
- **AC-3** : `POST …/balances` et l'essai à blanc avec un tag autre que celui du dossier ⇒ `409
  REFERENTIEL_CONTRADICTOIRE`, `details: { declare, attendu, referentiel }` (le filtre d'exceptions ne propage que
  `code` et `details`) ; rien n'est écrit.
- **AC-4** : l'import Sage d'un dossier SFD produit une balance `SFD-BCEAO` ; d'un dossier SYSCOHADA, `SN`.
- **AC-5** : prouvé sur pile réelle.

## Décisions

- **D-906-1 — servi, pas déduit, sur la voie HTTP.** Le tag est scellé dans le checksum que le client calcule
  (`balance.checksum.ts`) : le rendre facultatif obligerait le serveur à le deviner **avant** de vérifier un sceau qui
  le contient. On le sert (option 1 du ticket) et on refuse la contradiction (option 3). La voie événementielle garde
  sa déduction (un adaptateur qui l'omet).
- **D-906-2 — 409, pas 422.** Le tag est valide en soi ; il contredit l'état du dossier. Même famille que les autres
  refus de paramétrage du référentiel (409).
- **D-906-3 — `dossierId` sur la seule balance.** Les autres familles (imports, cahiers, rejets, rapprochement) le
  recevront avec leurs propres stories ; le ticket reste ouvert pour elles.
- **D-906-4 — question 3 du ticket (balance.submitted)** : déjà tranchée par le code, la balance ingérée porte le
  dossier résolu par l'ingestion (`soumettre(…, dossierId, …)`).

## Definition of Done

- [x] Lint et typecheck verts. Unitaires et e2e des fichiers touchés verts (`balance`, `sage-import`, `referentiel`,
  `openapi-contract` : 352/352). Suites complètes sous Windows : les échecs relancés en série passent tous, sauf
  `tpu.e2e-spec.ts` « CA 18 M ⇒ 409 BAREME_TPU_INDISPONIBLE », qui rend 200 **aussi sur `dev`** (vérifié en remisant
  les changements) : préexistant, repris en STORY-907.
- [x] Mutations rouges : contrôle retiré de `submit` ; mapper qui sert `orgId` à la place du dossier ; `SN` en dur dans
  le normaliseur ; tag non servi par le diagnostic.
- [x] Preuve sur pile `grp-a-906` (image construite, volumes neufs, JWKS local) : dossier `MICROFINANCE` ⇒
  `GET …/referentiels/actifs` `tag: SFD-BCEAO` ; `POST …/balances` tag `SN` ⇒ `409 REFERENTIEL_CONTRADICTOIRE`,
  `details { declare: SN, attendu: SFD-BCEAO, referentiel: sfd-bceao@2.0 }` ; tag `SFD-BCEAO` ⇒ 201, `dossierId` servi
  (et dans `GET …/balances`). Témoin (image `origin/dev`) : `SN` accepté en 201, aucun `tag`, `dossierId` absent.
- [x] PR code fusionnée : balance #146 (dev `921b333`).
