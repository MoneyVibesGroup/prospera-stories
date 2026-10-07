# STORY-691 : Un accusé sans numéro n'a aucune issue — `DEPOT_PHYSIQUE` et `COURRIEL` ne marquent jamais la liasse déposée

Status: in_progress

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
      **Tranché le 2026-10-07 (user) : numéro FACULTATIF côté `bilan-service`** (D-691-1). L'exigence par
      canal (`TELESERVICE` ⇒ numéro) reste dans `fiscal-service`, seul à connaître le type de canal ;
      la preuve d'un accusé sans numéro est l'**empreinte de la version déposée**, déjà vérifiée par le
      consommateur (`EMPREINTE_DIVERGENTE`). Pas de pièce justificative, pas de changement de contrat
      Kafka (`numeroAccuse: string | null` existe depuis la v1).
- [ ] AC-2 — La route manuelle et l'événement suivent la même règle (une seule source).
- [ ] AC-3 — Prouvé en docker : un accusé `DEPOT_PHYSIQUE` fait disparaître la divergence.

## Périmètre

**Inclus** — `bilan-service` : `DeposerLiasseDto.numeroAccuse` facultatif (mêmes règles de format s'il est
fourni) ; `depots[].numeroAccuse: string | null` (schéma, service, réponse Swagger, journal
`LIASSE_DEPOSEE`) ; le consommateur `fiscal.declaration.deposee` cesse d'écarter `NUMERO_ACCUSE_ABSENT` et
pose le dépôt. `fiscal-service` : retrait de la « limite connue » de la doc (Swagger + contrat d'événement).

**Hors périmètre** — toute pièce justificative ; un vocabulaire fermé de canaux dans `bilan-service`
(le `canal` de la route reste du texte libre, NFR-F12) ; migration de données (aucune : les dépôts existants
portent tous un numéro).

## Notes

- Voir [[STORY-681]], [[STORY-446]], [[STORY-538]].

## Progress Tracking

**Statut : `in_progress` (2026-10-07).** AC-1 tranché par l'user (numéro facultatif). Branches `MNV-691`
ouvertes sur `docs`, `bilan-service`, `fiscal-service`.

Historique : `ready-for-dev` (2026-10-02) — créée par la revue de STORY-681.
