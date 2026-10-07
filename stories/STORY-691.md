# STORY-691 : Un accusé sans numéro n'a aucune issue — `DEPOT_PHYSIQUE` et `COURRIEL` ne marquent jamais la liasse déposée

Status: done

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

- [x] AC-1 — Trancher (PO) : numéro facultatif selon le canal (et alors quelle preuve le remplace), ou
      exigence d'une référence de pièce justificative.
      **Tranché le 2026-10-07 (user) : numéro FACULTATIF côté `bilan-service`** (D-691-1). L'exigence par
      canal (`TELESERVICE` ⇒ numéro) reste dans `fiscal-service`, seul à connaître le type de canal ;
      la preuve d'un accusé sans numéro est l'**empreinte de la version déposée**, déjà vérifiée par le
      consommateur (`EMPREINTE_DIVERGENTE`). Pas de pièce justificative, pas de changement de contrat
      Kafka (`numeroAccuse: string | null` existe depuis la v1).
- [x] AC-2 — La route manuelle et l'événement suivent la même règle (une seule source).
- [x] AC-3 — Prouvé en docker : un accusé `DEPOT_PHYSIQUE` fait disparaître la divergence.

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

**Statut : `done` (2026-10-07).** PR rebase-mergées sur `dev`, consommateur d'abord :
MoneyVibesGroup/prospera-bilan-service#160 puis MoneyVibesGroup/prospera-fiscal-service#17.

### Livré
- `bilan-service` : `DeposerLiasseDto.numeroAccuse` facultatif (`@IsOptional`, mêmes règles de format s'il
  est fourni) ; `depots[].numeroAccuse: string | null` (schéma, service, réponse, journal `LIASSE_DEPOSEE`) ;
  la route transmet `null`, jamais `undefined` ; le consommateur ne pose plus `REJETE / NUMERO_ACCUSE_ABSENT`.
- Swagger : `numeroAccuse` publié `string` nullable (requête + réponse) — `string | null` se réfléchissait en
  `object` : l'e2e de contrat OpenAPI l'a attrapé, et un test dédié tient désormais `required` + `nullable`.
- `fiscal-service` : doc seule (Swagger de l'accusé, contrat d'événement, doc de la divergence).

### Portes
- Lint 0 · build OK · `test:cov` bilan : 311 suites / 11 601 tests, 99,43 st / 99,58 fn / 97,02 br.
- e2e bilan 3 287 → 565 (openapi) verts après correctif ; e2e fiscal 123/123 ; unit fiscal dépôts + kafka 82/82.
- Mutations (7/7 rouges, « Tests: 0 total » écartés et réécrits) : écart `NUMERO_ACCUSE_ABSENT` réintroduit,
  `@IsOptional` retiré, route qui passe `undefined` au service, puis au journal, C1 qui ignore le numéro,
  `@ApiProperty` au lieu d'`ApiPropertyOptional`, `nullable` retiré de la réponse.

### Vérification docker (stack neuve, `tmp/verif-docker-691/`)
- p0 : code des branches en vol (sha256 hôte = conteneur, OpenAPI servie 691, `NUMERO_ACCUSE_ABSENT` absent du
  `dist`). p1→p4 : comptes, catalogue, dossiers L/M/N, liasses figées v1.
- ⚠️ Aucun paquet publié ne déclare `DEPOT_PHYSIQUE` : le canal du dépôt TRANSMIS (livrable réel, NIF du dossier
  en F29) est forcé en base fiscal entre transmission et accusé — c'est le champ que lisent
  `verifierNumeroAccuse` et l'événement.
- Contrôle : `TELESERVICE` sans numéro ⇒ `NUMERO_ACCUSE_EXIGE`, dépôt resté `TRANSMISE`.
- **AC-3** (N, Kafka coupé) : accusé `DEPOT_PHYSIQUE` sans numéro ⇒ 200, outbox `PENDING`, `GET /depots` :
  liasse `VALIDE` + divergence `ACCUSE_NON_REPORTE_SUR_LA_LIASSE` ; Kafka relancé ⇒ `SENT`, liasse `DEPOSE`,
  `depots[]` ×1 avec `numeroAccuse` présent et `null`, marqueur `APPLIQUE`, divergence `null`.
  Même preuve sur L (bilan arrêté) : audit `LIASSE_DEPOSEE` avec `numeroAccuse: null`, `liasse.etat.change`
  DEPOSEE ×1. (Le « avant » lu bilan ARRÊTÉ rend 503 : fiscal relit le statut chez bilan — d'où N.)
- **AC-2** (M, route) : `numeroAccuse: "   "` ⇒ 400, rien d'écrit ; corps sans numéro ⇒ 200 `DEPOSE`,
  `numeroAccuse: null` en base.

### Revues
- Code (opus + lentilles ECC silent-failure / tests / types, ponytail-review « Lean ») : 0 bloquant ;
  corrigés en commit dédié — 3 commentaires de l'ancienne règle (payload, en-tête du consommateur, divergence
  fiscal), 2 lacunes de contrat OpenAPI (test ajouté, mutants rouges).
- Écarté, documenté dans le code : C1 confond deux dépôts SANS numéro de la même version (`depots[]` ne garde
  pas le `depotId` fiscal ; redéposer la même version est un doublon bien plus probable ; le second reste
  constatable par la route).
- Consigné : des événements déjà marqués `REJETE / NUMERO_ACCUSE_ABSENT` avant le déploiement ne seront pas
  rejoués (latent : aucun paquet publié hors téléservice) ; rattrapage = `POST …/deposer` sans numéro.
- Sécurité (opus) : **0 constat**.

Historique : `in_progress` (2026-10-07, AC-1 tranché par l'user : numéro facultatif) ; `ready-for-dev`
(2026-10-02) — créée par la revue de STORY-681.
