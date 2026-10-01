# STORY-690 : Les 23 feuilles de notes encore laissées au cabinet — mouvements, zones géographiques, trames à libellé imprimé

Status: ready-for-dev

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle
**Service :** `fiscal-service` (paquet `TG` × `DSF` v1.2) — `bilan-service` (plan, ventilation)
**Points :** 8 · **Complexité :** high · **Assigné à :** `vivianMoneyVibesGroupes`
**Origine :** clôture de STORY-680 (2026-10-01).

---

## Le fait, mesuré

La v1.1 remplit 19 feuilles de notes sur 42 (règle : une feuille entière ou rien). Restent vierges et tracées :

| Notes | Motif |
|---|---|
| 21, 22 | ventilation par zone géographique : sous-comptes 7011 à 7015 exigés, la balance tient `701000` |
| 26 | 651 ne se répartit pas entre clients et autres débiteurs |
| 30 | « Subventions d'équilibre » (produit) imprimée parmi les charges |
| 28, 3C, 3D | tableaux de mouvements |
| 1, 3A, 3B, 15B, 16B, 16B bis, 27B, 31, 34 | trames à libellés imprimés ou matière hors balance |
| 8A, 12, 16C | lignes libres non alignées ou en deux sections |

Et les trames des notes `MIXTE` saisies sur des lignes à **libellé imprimé** (4, 7, 8, 15A, 16A à 19, dont les
échéanciers) ne sont pas transcrites — la complétude le signale.

## Critères d'acceptation

- [ ] AC-1 — Rapprochement par libellé pour les trames à lignes imprimées ; refus nommé hors capacité.
- [ ] AC-2 — Tableaux de mouvements (28, 3C, 3D) depuis ce que la liasse publie, sinon vierge tracé.
- [ ] AC-3 — Arbitrages de plan avec bilan-service : 484 vs 485 (créances HAO), 185/188 rangés sous DA alors
      que la DSF les place en note 19.
- [ ] AC-4 — Preuve par le formulaire et par Excel, comme STORY-680.

## Notes

- Voir [[STORY-680]], [[STORY-559]].

## Progress Tracking

**Statut : `ready-for-dev` (2026-10-01).** Créée par la clôture de STORY-680.
