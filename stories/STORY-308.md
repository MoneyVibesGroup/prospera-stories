---
baseline_commit: e30692d (prospera-fiscal-service), 8f19e6a (balance-service)
---

# STORY-308 : Régime dérogatoire et signalement

Status: in-progress

**Complexité :** medium

**Épic :** EPIC-028 — Implantations multiples et catalogue d'obligations dérivé  
**Services :** `fiscal-service` (résolution, dérivation, signalement), `balance-service` (paquet zone franche)  
**Points :** 3 · **Sprint :** S24 du tracker ; lot du 14/11 (+5)  
**Assigné à :** Dev B  
**Prérequis :** STORY-305 (dérivation), STORY-307 ; STORY-496 (axe `regimeDerogatoire` et surcouche zone franche, livrés)  
**Origine :** FR-F75 (et FR-F70, FR-F71).

---

## User Story

En tant qu'**expert-comptable**, je veux qu'un dossier sous régime dérogatoire soit visiblement
signalé, afin de ne jamais lui appliquer le droit commun par inadvertance.

## Ce qui existe déjà (vérifié dans le code le 2026-11-14)

- **`dossier-service`** porte le régime dérogatoire comme **troisième axe daté** (STORY-496) :
  `regimeDerogatoire` = `AUCUN` | `ZONE_FRANCHE`, avec `dateAgrement` et `numeroAgrement` (présents
  si et seulement si le régime n'est pas `AUCUN`). Lecture : `GET /api/v1/dossiers/:id/axes?exerciceId=`
  → `effectifs.decision` (absente = axes non décidés). Un message ou un document antérieur à
  STORY-496 vaut `AUCUN`.
- **`balance-service`** publie la **surcouche** `paquet-fiscal-togo-zonefranche-2026.json`
  (`_meta.nature: "surcouche"`, `base: "togo@2026"`, `regime: "ZONE_FRANCHE"`) : elle n'écrit que ce
  qui déroge (IS en paliers, exonération de TVA…) ; le reste est **hérité** par fusion profonde
  (D-496-A/B). ⚠️ Elle ne se déclare consommée que par `balance-service`.
- **`fiscal-service`** résout ses paquets par le code octroyé `fiscal-<pays>-<type>` (STORY-297/298)
  et vérifie `_meta.consommateurs ∋ fiscal-service`. Il ne lit **pas** les axes.
- ⛔ **Défaut latent trouvé (STORY-305)** : le régime fiscal de l'implantation principale est lu
  dans `GET /api/v1/dossiers/:id` (`regimeFiscal`) — que `DossierResponseDto` **ne rend pas**. Hors
  tests, il vaut donc toujours `null`, et la TVA/DSF d'un dossier réel sortent « indéterminées »
  (`REGIME_FISCAL_INCONNU`). Les tests le masquaient en injectant le champ.

## Décisions confrontées au code réel (2026-11-14)

- **D-308-1 — Une source, deux axes.** La dérivation lit les **axes datés de l'exercice** chez
  `dossier-service` (`/axes?exerciceId=`, jeton de l'appelant, 404 relayé en 404). Ils donnent le
  régime dérogatoire **et** le régime fiscal en vigueur pour CET exercice — ce qui corrige le défaut
  latent de STORY-305 (repli sur la valeur précédente si aucune décision n'existe).
- **D-308-2 — Le paquet dérogatoire a son propre code** : `fiscal-<pays>-<type>-<régime>`
  (`fiscal-tg-entreprise-zone-franche`), octroyé comme les autres paquets. Aucun nom de régime dans
  le code : le suffixe vient de la donnée (`ZONE_FRANCHE` → `zone-franche`).
- **D-308-3 — Une surcouche se fusionne sur le paquet RATTACHÉ à l'exercice** (FR-F70 tient pour la
  base) : mêmes trois règles que `balance-service` (rubrique absente héritée, fusion profonde, tableaux
  et scalaires remplacés, `sourceBase` conservée). Gardes : `_meta.regime` = le régime du dossier,
  base complète (pas une surcouche), même pays, même année, même devise. Un paquet dérogatoire
  **complet** (non surcouche) est accepté tel quel. Le `_meta` effectif est celui de la surcouche :
  les validations d'expert du droit commun ne valent pas sous le régime dérogatoire — les éléments
  hérités sortent signalés « à valider » (le moins mûr des deux, comme D-496).
- **D-308-4 — Aucun repli.** Paquet dérogatoire non octroyé ou incohérent ⇒ l'implantation n'est
  **pas dérivée** (`implantationsNonDerivees`, motif nommé, régime cité) — jamais le droit commun.
- **D-308-5 — Signalement explicite** : chaque obligation dérivée sous dérogation porte
  `derogation` (`regime`, `numeroAgrement`, `dateAgrement`, `base` — la version de droit commun
  héritée) ; le rapport de dérivation liste les implantations dérivées sous dérogation. Champ
  **dérivé** (actualisé à chaque dérivation, `null` en droit commun).
- **D-308-6 — `balance-service`** : la surcouche zone franche déclare `fiscal-service` parmi ses
  consommateurs ; régénération par `build.mjs` et réépinglage (aucune valeur fiscale modifiée).
- **Hors périmètre** : le régime dérogatoire d'une implantation SECONDAIRE (les axes sont ceux du
  dossier, donc du pays principal) ; le calcul du barème dégressif selon `dateAgrement` (EPIC-029) ;
  la publication au catalogue du code `fiscal-tg-entreprise-zone-franche` (geste d'administration).

## Critères d'acceptation

- [ ] **AC-1** — Un dossier en zone franche : la dérivation s'appuie sur le paquet dérogatoire
  (`fiscal-tg-entreprise-zone-franche`), fusionné sur la version de droit commun rattachée à
  l'exercice — jamais sur le seul droit commun.
- [ ] **AC-2** — Ses obligations portent un signalement explicite (`derogation`), relu à la liste.
- [ ] **AC-3** — Paquet dérogatoire absent ou incohérent : implantation non dérivée, motif nommé.
- [ ] **AC-4** — Le régime fiscal de la principale vient des axes datés de l'exercice.

## Definition of Done

- [ ] Branches `MNV-308` (balance, fiscal) depuis `origin/dev`, PR fusionnées en rebase (balance puis
  fiscal) ; fiche et tracker par PR sur `main`.
- [ ] Portes vertes ; mutations rouges.

## Progress Tracking

**2026-11-14 — fiche écrite** (bmad-create-story) juste avant de coder, après lecture de l'entrée du
tracker (aucun arbitrage) et du code des trois services.
