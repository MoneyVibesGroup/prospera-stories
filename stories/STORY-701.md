# STORY-701 : Arbitrages de plan de comptes — créances HAO (484 ou 485) et comptes de liaison 185/188

Status: ready-for-dev

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle
**Service :** `bilan-service` (plan `plan-comptable-syscohada-2.2.json`, table de passage)
**Points :** 3 · **Complexité :** medium · **Assigné à :** `vivianMoneyVibesGroupes`
**Origine :** AC-3 de STORY-690, sortie de son périmètre par décision PO du 2026-10-07 (D-690-1).

---

## Le fait

Relevé par STORY-680 en remplissant les feuilles de notes de la DSF e-OTR Togo :

| Point | Constat |
|---|---|
| Créances HAO | le plan de `bilan-service` numérote les créances sur cessions d'immobilisations `484` ; le plan SYSCOHADA révisé relevé (plan-comptable-ohada.com) les numérote `485` (et `484` « Autres dettes HAO » au passif). La table de passage `BA ← 485, 488` suit déjà le plan relevé. |
| Comptes 185 / 188 | rangés sous `DA` (dettes financières) par la table de passage, alors que la DSF les place en note 19 (autres dettes, comptes de liaison). |

## Critères d'acceptation

- [ ] AC-1 — Le plan de `bilan-service` numérote les créances HAO comme le plan SYSCOHADA révisé publié, source citée ; aucune balance existante ne change de poste en silence (contrôle `COMPTES_NON_AFFECTES`).
- [ ] AC-2 — 185 et 188 rangés au poste que la DSF leur donne (note 19), table de passage sourcée.
- [ ] AC-3 — Le paquet `TG` × `DSF` (fiscal-service) reste cohérent : la garde `LIASSE_NON_TRANSCRIPTIBLE` n'est pas déclenchée par le changement.

## Notes

- Voir [[STORY-690]], [[STORY-680]], [[STORY-676]].

## Progress Tracking

**Statut : `ready-for-dev` (2026-10-07).** Créée par le cadrage de STORY-690 (D-690-1).
