# STORY-691 : Un accusé sans numéro n'a aucune issue — `DEPOT_PHYSIQUE` et `COURRIEL` ne marquent jamais la liasse déposée

Status: ready-for-dev

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle
**Service :** `bilan-service` (`depots[]`, `POST …/deposer`, consommateur `fiscal.declaration.deposee`) + `fiscal-service`
**Points :** 3 · **Complexité :** medium · **Assigné à :** `vivianMoneyVibesGroupes`
**Origine :** revue de code de STORY-681 (2026-10-02) — décision PO laissée ouverte (D5).

---

## Le fait

`fiscal-service` n'exige un numéro d'accusé que pour le canal `TELESERVICE` (`verifierNumeroAccuse`).
`bilan-service` refuse l'événement `fiscal.declaration.deposee` sans numéro (`REJETE` / `NUMERO_ACCUSE_ABSENT`),
parce que `depots[].numeroAccuse` est obligatoire depuis STORY-446 — et `POST …/deposer` l'exige aussi.
Un dépôt physique ou par courriel accepté reste donc **en divergence pour toujours**, sauf à inventer un
numéro. Latent tant que le seul paquet publié (`TG` × `DSF`) est en téléservice.

## Critères d'acceptation

- [ ] AC-1 — Trancher (PO) : numéro facultatif selon le canal (et alors quelle preuve le remplace), ou
      exigence d'une référence de pièce justificative.
- [ ] AC-2 — La route manuelle et l'événement suivent la même règle (une seule source).
- [ ] AC-3 — Prouvé en docker : un accusé `DEPOT_PHYSIQUE` fait disparaître la divergence.

## Notes

- Voir [[STORY-681]], [[STORY-446]], [[STORY-538]].

## Progress Tracking

**Statut : `ready-for-dev` (2026-10-02).** Créée par la revue de STORY-681.
