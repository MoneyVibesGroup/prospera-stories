# STORY-363 : `dossier-service` exige un KYC approuvé — le gate qui manque au seul service sans gate

Status: not_started

**Epic :** EPIC-043 — Le dossier client, entité de premier rang
**Points :** 3 · **Sprint :** 20 (backend) · **Service :** `prospera-dossier-service` (`:3009`)
⚠️ *Port corrigé le 2026-08-19 : la fiche annonçait `:3013`. Le service écoute bien sur **3009** (`.env.example:9`, `docker compose ps`, et l'OpenAPI vivant `:3009/api/docs-json`). Un port faux envoie à un service qui ne répond pas, et l'échec ne ressemble pas à une erreur de fiche.*
**Origine :** **AD-8** de `architecture/architecture-dossier-service-2026-08-15/ARCHITECTURE-SPINE.md`, arbitrée par le PO le 2026-08-15
**Dépendances :** aucune côté backend. ⚠️ **Contrainte d'ORDRE avec le frontend — voir §Ordre.**

---

## Pourquoi cette story existe

La spine rétroactive de `dossier-service` (2026-08-15) a relevé que le service est **le seul service
métier du programme sans gate d'accès**. Ses guards sont `jwt-auth`, `roles`, `permissions`,
`email-verified`, `ip-throttler` — et il ne consomme que `identity.org.created` et
`identity.membership.changed`. **Ni `kyc.status.changed`, ni `entitlement.changed`.**

Tous les autres portent un `@Requires…Access` (`emailVerified` + KYC `APPROVED` + entitlement
`ACTIVE`). Il fallait savoir si c'était délibéré ou un oubli. **Le PO a tranché le 2026-08-15 :**

> **`emailVerified` + KYC `APPROVED`. Pas d'entitlement.**
>
> Un cabinet doit être **vérifié** pour constituer un portefeuille de sociétés clientes — c'est une
> responsabilité, pas une fonctionnalité. Mais **le dossier n'est pas un module qu'on achète** : le
> gater sur un entitlement supposerait un « module dossier » au catalogue, qui n'existe pas et n'a pas
> de raison d'exister.

## Périmètre

1. **Read-model `OrgKycStatus`** alimenté par `kyc.status.changed`, avec son consumer group isolé et sa
   projection idempotente. ⚡ **Le patron existe à l'identique dans `bilan-service` et
   `balance-service`** (`kyc-status.projection.service.ts` + `kyc-status-consumer.bootstrap.ts`) : il
   est à **copier**, pas à concevoir.
2. **Guard `@RequiresDossierAccess`** = `emailVerified` + KYC `APPROVED`. **Aucune vérification
   d'entitlement.**
3. Application du guard sur les routes **appelées par un humain** — et sur elles seules.

## Critères d'acceptation

- **Étant donné** un cabinet dont le KYC n'est pas `APPROVED` **quand** il appelle `GET /dossiers`
  **alors** le service refuse avec le code machine **`KYC_NOT_APPROVED`**, jamais un `403` nu.
- **Étant donné** un cabinet dont le KYC est `APPROVED` **quand** il crée un dossier **alors** rien ne
  change par rapport à aujourd'hui.
- **Étant donné** un utilisateur dont l'e-mail n'est pas vérifié **quand** il appelle une route de
  dossier **alors** le refus porte `EMAIL_NOT_VERIFIED`, distinct de `KYC_NOT_APPROVED`. ⚠️ Les deux
  motifs doivent être **distinguables par le client** : les confondre reproduirait le défaut relevé en
  FE-017, où « Identifiants invalides » recouvrait tout `ApiError` — un `429` s'y lisait comme un
  mauvais mot de passe.
- ⚠️ **Étant donné** une organisation qui vient d'être créée (`identity.org.created`) **quand** le
  dossier « Mon cabinet » est auto-créé (D1) **alors** la création aboutit **sans passer par le gate**.
  ⛔ **C'est le piège central de cette story** : le KYC n'est jamais `APPROVED` à l'instant de la
  création de l'organisation. Gater ce chemin ferait qu'**aucune organisation ne naîtrait plus jamais
  avec son dossier propre** — et l'échec serait asynchrone, donc silencieux.
- **Étant donné** un `kyc.status.changed` rejoué **quand** la projection s'applique **alors** elle est
  idempotente (marqueur `ProcessedEvent` inséré dans la même transaction).
- **Étant donné** un cabinet approuvé puis **repassé** hors `APPROVED` **quand** il rappelle une route
  **alors** l'accès est refusé — la projection est un **état absolu**, pas un drapeau qui ne monte que.

## ⛔ Ordre — cette story ne peut pas arriver après le sprint 10 frontend

Le **S10 frontend** (FE-059a, FE-060, FE-061, FE-062, FE-066) fait ouvrir un portefeuille et créer des
dossiers. Avec ce gate, **il faut un KYC approuvé pour que ces écrans fonctionnent**.

- ⇒ **À livrer AVANT ou AVEC le S10.** Livrée après, elle casse des écrans qui marchaient : c'est
  exactement le motif d'AP-26 — `kyc-service` a rendu `If-Match` obligatoire sans que la console suive,
  et **toutes les décisions KYC ont rendu `428` pendant une semaine**.
- ⇒ Le **semis de développement** et l'e2e **FE-069** doivent **approuver le KYC avant d'ouvrir un
  dossier**. À répercuter dans `frontend-sprint-status.yaml`.

## Definition of Done

- [ ] Un cabinet non approuvé ne peut créer aucun dossier, et le sait par un code machine stable.
- [ ] « Mon cabinet » naît toujours à la création de l'organisation — **prouvé par un test**, pas
      supposé.
- [ ] Le frontend est prévenu **dans la même livraison** : la story n'est pas `done` tant que le S10
      n'a pas de quoi approuver un KYC dans son parcours.
