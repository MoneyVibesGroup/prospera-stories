# STORY-701 : Arbitrages de plan de comptes — créances HAO (484 ou 485) et comptes de liaison 185/188

Status: done

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle
**Service :** `bilan-service` (référentiel `syscohada-revise@2.3`) + recopies : `balance-service`, `platform-catalog-service`, `dossier-service`, `fiscal-service`
**Points :** 3 · **Complexité :** medium · **Assigné à :** `vivianMoneyVibesGroupes`
**Origine :** AC-3 de STORY-690, sortie de son périmètre par décision PO du 2026-10-07 (D-690-1).

---

## Le fait

Relevé par STORY-680 en remplissant les feuilles de notes de la DSF e-OTR Togo :

| Point | Constat |
|---|---|
| Créances HAO | le plan de `bilan-service` numérote les créances sur cessions d'immobilisations `484` ; le plan SYSCOHADA révisé numérote `485` (et `484` « Autres dettes HAO » au passif). La table de passage `BA ← 485, 488` suit déjà le plan relevé. |
| Comptes 185 / 188 | rangés sous `DA` (dettes financières) par la table de passage, alors que la DSF les place en note 19 (autres dettes, comptes de liaison) — et en note 8 (autres créances) quand ils sont débiteurs. |

### Mesure du cadrage (2026-10-08)

- **Source du plan** — Acte uniforme relatif au droit comptable et à l'information financière (AUDCIF),
  plan de comptes, page 247 du PDF (OCR conservé en `tmp/cadrage-545/ocr-pcgo.txt`, `pg-0247`) :
  `484 AUTRES DETTES HORS ACTIVITES ORDINAIRES (H.A.O.)`, `485 CRÉANCES SUR CESSIONS D'IMMOBILISATIONS`,
  `488 AUTRES CREANCES HORS ACTIVITÉS ORDINAIRES (H.A.O.)`. Le plan `@2.2` porte `484 Créances sur cessions
  d'immobilisations`, `485 Créances sur cessions de titres de placement`, `488 Créances et dettes HAO diverses` :
  trois libellés faux, alors que la table de passage (`BA ← 485, 488` ; `DH ← 481, 482, 484`) suit déjà le texte.
  **Aucun compte ne change de poste** sur ce point : seul le plan rejoint la table.
- **Source du rangement 185/188** — le gabarit DSF du paquet `TG × DSF@1.2` (`fiscal-service`) : note 19 lignes 25
  et 27 ← `BILAN_PASSIF` 185 / 188 ; note 8 lignes 17 et 19 ← `BILAN_ACTIF` 185 / 188. Postes de la liasse
  `@2.2` : note 19 = `DM` « Autres dettes », note 8 = `BJ` « Autres créances ». Patron existant : `45`/`46`/`47`
  sont déjà rattachés à `BJ` (`NET_ACTIF`) **et** `DM` (`SOLDE_CREDITEUR`), ventilés au solde par
  `choisirRattachementBilan` — moteur sans aucune convention de classe.
- **`@2.2` est octroyé** (STORY-677) : le registre de `bilan-service` écrit « toute révision de `@2.2` qui change
  la SORTIE de la liasse est un bump ». Sortir 185/188 de `DA` la change ⇒ **bump `@2.3`**.

## Décisions

- **D-701-1 — bump `syscohada-revise@2.3`** (décision user du 2026-10-08) : `@2.1` et `@2.2` restent packagés
  à l'octet. `@2.3` = plan `@2.2` aux trois libellés corrigés + table `@2.2` où 185/188 quittent `DA` pour
  `BJ` et `DM`. Postes, notes et paquet fiscal : ceux de `@2.2`, inchangés.
- **D-701-2 — inventaire des recopies**, mesuré au cadrage (l'arbitrage user parlait de 3 dépôts, il y en a 5) :

  | Dépôt | Ce qui doit connaître `@2.3` |
  |---|---|
  | `bilan-service` | sources, build, artefact, registre (checksum) |
  | `balance-service` | artefact **à l'octet** + registre + pont `SN` |
  | `platform-catalog-service` | les deux packs SYSCOHADA + `referentiels-packages.snapshot.ts` |
  | `dossier-service` | miroir `paquets-packages.miroir.ts` (spec de cohérence) |
  | `fiscal-service` | le schéma du paquet `TG × DSF` accepte `2.1`/`2.2` et épingle les notes à `@2.2` : une liasse `@2.3` serait refusée `REFERENTIEL_NON_ACCEPTE` ⇒ paquet `TG × DSF@1.3` (même gabarit, `@2.3` accepté, notes épinglées à `@2.3`), `@1.2` conservé inactif |

- **D-701-4 — `notes.compatibles`** (mesuré au dev) : sous un `notes.referentiel` unique, la v1.3 aurait retiré
  leurs notes aux octrois `@2.2` existants (le livrable ne transcrit les notes qu'au couple exact). Le schéma de
  classeur gagne un champ FACULTATIF `notes.compatibles` (couples distincts, acceptés par le format) ; la v1.3
  le porte à `[@2.2]` — `@2.3` garde postes et notes de `@2.2`. v1.1/v1.2 à l'octet. `@2.1` reste sans notes,
  comme sous la v1.2. Le miroir `dossier-service` disait encore `TG × DSF 1.0` (dérive depuis STORY-680) :
  rattrapé à `1.3`.

- **D-701-3 — hors périmètre** : 186/187 (comptes de liaison charges/produits, notes 8 et 19) ne sont ni au
  plan ni à la table de `@2.2` — les rattacher est une extension, pas l'arbitrage cadré ; le plan partagé
  (`@2.1`, `zone-franche-togo@1.0`) garde ses libellés faux (artefacts figés). Migration des octrois existants
  vers `@2.3` : souci de prod, différé.

## Critères d'acceptation

- [x] AC-1 — Le plan de `@2.3` numérote les créances HAO comme le plan SYSCOHADA révisé publié (AUDCIF p. 247,
      cité) ; aucune balance ne change de poste en silence : 484/485/488 restent sur `DH`/`BA`, aucun
      `COMPTES_NON_AFFECTES` nouveau.
- [x] AC-2 — 185 et 188 rangés au poste que la DSF leur donne : `DM` (note 19) créditeurs, `BJ` (note 8)
      débiteurs ; plus aucun sous `DA`. Table de passage sourcée.
- [x] AC-3 — Le paquet `TG` × `DSF` (fiscal-service) reste cohérent : une liasse `@2.3` est acceptée, ses notes
      transcrites, et la garde `LIASSE_NON_TRANSCRIPTIBLE` n'est pas déclenchée par le changement.

## Notes

- Voir [[STORY-690]], [[STORY-680]], [[STORY-676]], [[STORY-677]].

## Progress Tracking

- 2026-10-07 — `ready-for-dev`. Créée par le cadrage de STORY-690 (D-690-1).
- 2026-10-08 — `in_progress`. Cadrage : D-701-1 (bump `@2.3`, décision user), D-701-2 (5 dépôts), D-701-3.
- 2026-10-08 — dev : bilan-service (sources, build, registre `a2fd635c…`, pont de consolidation,
  `syscohada-2.3.spec.ts`), balance-service (artefact à l'octet, pont `SN` = 2.3/2.2/2.1), catalogue (packs
  `@2.3`), dossier-service (miroir), fiscal-service (paquet v1.3, `notes.compatibles`, `notesValentPour`, classeur
  AC-7 ré-épinglé — mesuré : seules les propriétés de format diffèrent de la v1.2). D-701-4.
- 2026-10-08 — portes : lint 0, build OK sur les 5 dépôts ; couverture (st/br/fn/li) bilan 99,43/97,08/99,58/99,52 ·
  balance 99,33/93,33/99,13/99,45 · catalogue 99,69/96,44/100/99,73 · dossier 99,47/94,86/98,6/99,58 · fiscal
  99,33/96,8/99,06/99,66 ; unitaires bilan 11 696, balance 5 022, catalogue 867, dossier verts, fiscal 1 740 ; e2e
  verts (rouges de 1re passe : effets attendus de la nouvelle cible, alignés ; dossier/imports = flakes connus,
  verts en relance).
- 2026-10-08 — mutations (8, toutes rouges, `tmp/verif-docker-701/mutations.md`) : 185 sous DA, libellé 484,
  compatibles ignorés, compatible non accepté, doublon, pont SN sans 2.3, pack resté 2.2, miroir resté 1.2 ;
  + revue : fixture 185100 retiré ⇒ rouge.
- 2026-10-08 — **vérif docker sur stack neuve** (`tmp/verif-docker-701/`, 7 services, MNV-701 montés) : org A
  octroyée `@2.3` par le pack `cabinet` (lu), org B témoin `@2.2`, même balance (689 + 185100 C 3 000 000,
  188000 D 1 000 000, 484000 C, 485100 D, 488000 D). Liasses figées en base : référentiel et checksum `@2.3`
  (`a2fd635c…`) / `@2.2` ; A : DA = 15 000 000 (162 seul), DM = 3 000 000, BJ = 1 750 000 ; B : DA = 17 000 000,
  DM nul, BJ = 750 000 ; écarts A/B = exactement 188 (BJ) et 185 − 188 (DA) ; DH = 200 000 et BA = 450 000 sous les
  deux. fiscal : complétude et trace sous v1.3 pour A et B, mêmes 11 feuilles de notes produites ; A : NOTE 19 F25
  et NOTE 8 F19 écrites (185, 188), NOTE 5 G10/G29 (485, 484) ; B : NOTE 8 F19 non produite ; livrable réel de A
  = TG/DSF@1.3. ⚠️ Deux attentes du banc corrigées entre passes, code inchangé : BJ porte aussi 445000 ; le
  livrable écrit le décimal (liasse en unités mineures, exposant 2).
- 2026-10-08 — revue de code (opus + ECC + ponytail) : 0 bloquant ; corrigés — `notes.referentiel` confronté aux
  référentiels acceptés (type-design), preuve AC-3 sur la version figée RÉELLE de la vérif docker (fixture
  `liasse-version-figee-2.3.json`) et assertion « notes ÉCRITES » (pr-test-analyzer), 5 docs inexactes
  (libellés lus par la suggestion, Swagger 4 paquets à notes, tag SN, docblock du décompte, `_meta` de la table).
  Écartés : JSDoc détachés pré-existants (5, comptés à l'identique sur `dev`) ; ponytail : rien à retrancher.
  Revue de sécurité : **0 constat**.
- 2026-10-08 — portes rejouées sur l'état final (fiscal, bilan, balance : lint, build, couverture, e2e verts ;
  fiscal 99,35/96,86/99,06/99,66) et **vérif docker rejouée sur stack neuve** : FIN-OK, 131 verdicts OK, 0 KO.
- 2026-10-08 — **`done`**. PR rebase-mergées sur `dev` : prospera-bilan-service#165, prospera-balance-service#128,
  prospera-platform-catalog-service#29, prospera-dossier-service#40, prospera-fiscal-service#18 ; branches
  supprimées. Suites : 186/187 (comptes de liaison charges/produits, notes 8 et 19) hors plan et hors table ;
  migration des octrois `@2.2` vers `@2.3` (prod, différée).
