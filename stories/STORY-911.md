# STORY-911 : Le BFF de la console et les piles de recette sur le socle

Status: done

**Complexité :** petite (un service sans Kafka, des surcouches de recette)

**Épic :** EPIC-155 (les services sur le socle du moteur)
**Dépôts :** `prospera-admin-panel-service` (BFF de la console), `prospera-recette`
**Plage :** groupe A, n° 7 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §2). Fiche écrite **avant** de
coder.

---

## Pourquoi

Le socle fixe Node 24 et MongoDB 8.0 (spine du moteur, AD-27). Le BFF de la console tourne sous Node 20 ; les piles de
recette lèvent MongoDB 7 (`mongo`, `mongo-paiement`, `mongo-notification` du compose racine, `mongo-fiscal` de la
surcouche fiscale). Le compose racine n'est pas versionné : le changement d'image passe par la surcouche de recette.

## Ce que la story livre

1. **Le BFF sous Node 24** : `node:24-slim` (base, runtime), étage `verification`, `engines`, `@types/node` 24,
   `test/` dans le contexte Docker. Le BFF n'a pas de Kafka : rien d'autre ne change.
2. **Les piles de recette sur MongoDB 8.0** : `docker-compose.recette.yml` repointe `mongo`, `mongo-paiement` et
   `mongo-notification` sur `mongo:8.0` ; `docker-compose.fiscal.yml` fait de même pour `mongo-fiscal`.

## Critères d'acceptation

- **AC-1** : le BFF démarre `healthy` sous Node 24 ; ses unitaires sont verts dans l'étage `verification`.
- **AC-2** : le coupe-circuit de STORY-903 rejoué sur pile : catalogue arrêté, la vérification KYC répond, le
  catalogue est dit indisponible, et le premier appel reste borné.
- **AC-3** : les recettes `pile`, `zone-franche` et `atelier-balance` sont vertes depuis `dev`, sur MongoDB 8.0
  (volumes neufs).

## Definition of Done

- [x] BFF : étage `verification` **41/41** suites (519 tests) ; recette : `npm run verifier` vert, 91 tests, garde du profil
  17/17 (mutation `mongo:7` ⇒ rouge). La garde était rouge sur `dev` : les réglages de 933 (catalogue après Redis) et
  938 (jeton de service du moteur pour auth) y avaient été ajoutés sans elle ; elle les suit maintenant.
- [x] AC-2 sur la pile `grp-a-911` (auth, kyc, BFF ; catalogue **non levé** ; MongoDB 8.0.38) : 12 cabinets inscrits,
  **20/20** `GET /admin/orgs` en 200, `kyc=ok`, `entitlements=unavailable` ; 1er appel 2,6 s puis ~35 ms ; coupe-circuit
  ouvert une fois.
- [x] AC-3 : recettes `pile` + `zone-franche` + `atelier-balance` **63/63** depuis `dev` sur **MongoDB 8.0.38**
  (images construites depuis `git archive origin/dev`, surcouche `build: !reset null`).
- [x] PR code fusionnées : BFF #34 (`84120a5`), recette #21 (`979ec45`).

## Décisions

- **D-911-1 — l'image de MongoDB est un réglage, pas un état** : elle va dans le profil de recette (toute recette tourne
  en 8.0 par défaut), et la garde du profil n'admet sur ces services que `image: mongo:8.0`.
