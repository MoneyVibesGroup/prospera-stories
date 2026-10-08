# STORY-701 : Arbitrages de plan de comptes — créances HAO (484 ou 485) et comptes de liaison 185/188

Status: in_progress

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

- **D-701-3 — hors périmètre** : 186/187 (comptes de liaison charges/produits, notes 8 et 19) ne sont ni au
  plan ni à la table de `@2.2` — les rattacher est une extension, pas l'arbitrage cadré ; le plan partagé
  (`@2.1`, `zone-franche-togo@1.0`) garde ses libellés faux (artefacts figés). Migration des octrois existants
  vers `@2.3` : souci de prod, différé.

## Critères d'acceptation

- [ ] AC-1 — Le plan de `@2.3` numérote les créances HAO comme le plan SYSCOHADA révisé publié (AUDCIF p. 247,
      cité) ; aucune balance ne change de poste en silence : 484/485/488 restent sur `DH`/`BA`, aucun
      `COMPTES_NON_AFFECTES` nouveau.
- [ ] AC-2 — 185 et 188 rangés au poste que la DSF leur donne : `DM` (note 19) créditeurs, `BJ` (note 8)
      débiteurs ; plus aucun sous `DA`. Table de passage sourcée.
- [ ] AC-3 — Le paquet `TG` × `DSF` (fiscal-service) reste cohérent : une liasse `@2.3` est acceptée, ses notes
      transcrites, et la garde `LIASSE_NON_TRANSCRIPTIBLE` n'est pas déclenchée par le changement.

## Notes

- Voir [[STORY-690]], [[STORY-680]], [[STORY-676]], [[STORY-677]].

## Progress Tracking

- 2026-10-07 — `ready-for-dev`. Créée par le cadrage de STORY-690 (D-690-1).
- 2026-10-08 — `in_progress`. Cadrage : D-701-1 (bump `@2.3`, décision user), D-701-2 (5 dépôts), D-701-3.
