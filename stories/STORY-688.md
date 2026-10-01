# STORY-688 : Un compte à solde inversé refuse le livrable e-DSF entier — 411 créditeur sous BI, 47 qui change de sens

Status: ready-for-dev

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle
**Service :** `fiscal-service` (garde AC-3 de STORY-680)
**Points :** 3 · **Complexité :** medium · **Assigné à :** `vivianMoneyVibesGroupes`
**Origine :** revue de code de STORY-680 (2026-10-01) — constat C2, laissé conforme à l'AC-3.

---

## Le fait, mesuré

`ventilerParCompte` (bilan-service) pose `brut = Σ débit`, `amort = Σ crédit` par compte. Un compte au solde
inversé porte donc un montant dans une colonne de dépréciation que la note ne prévoit pas pour lui, et la
garde `LIASSE_NON_TRANSCRIPTIBLE` de 680 refuse **tout le classeur**, états compris — là où la v1.0 le produisait.

| Ventilation ajoutée | Refus |
|---|---|
| sous BI : `411100` `amortN = 20000` | `{note: '7', poste: 'BILAN_ACTIF\|BI', compte: '411100', champ: 'amortN'}` |
| sous BJ : `471000` `brutN = 100000`, `amortN1 = 30000` | `{note: '8', poste: 'BILAN_ACTIF\|BJ', compte: '471000', champ: 'amortN1'}` |

Le cas 47 est documenté par bilan-service comme « réellement atteignable » (STORY-439).

## Critères d'acceptation

- [ ] AC-1 — Trancher (PO) : la note concernée sort **vierge et tracée** (le reste du classeur est produit), ou
      le montant se reclasse sur une ligne sourcée.
- [ ] AC-2 — Aucun montant perdu sans bruit : la trace et la complétude le disent.
- [ ] AC-3 — Les deux exemples ci-dessus en tests, mutation à l'appui.

## Notes

- Voir [[STORY-680]], [[STORY-439]].

## Progress Tracking

**Statut : `ready-for-dev` (2026-10-01).** Créée par la revue de STORY-680.
