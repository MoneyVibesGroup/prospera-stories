# Story FE-A00 : Module Atelier — shell, navigation, gate d'accès et choix de source

Status: ready-for-dev

**Epic :** FE-EPIC-007 — Atelier Balance
**Points :** 3 · **Sprint :** 7 (programme) · **App :** `prospera-frontend-expert-comptable`
**API :** balance-service (`:3007`, préfixe global `/api/v1`) — `GET /whoami/balance-access`, `GET /referentiels/actifs`
**Backend d'appui :** **STORY-076** (scaffold `balance-service`, relying party RS256/JWKS) · **STORY-077** (gate `@RequiresBalanceAccess`) — **done, vérifiées docker**
**Réf. plan :** `frontend-sprint-status.yaml` S7 · décisions **D13** (hub multi-source) / **D14** (split CORE/EXTENDED)
**Dépendances :** FE-014 (accès modules & entitlements), FE-003 (shell)
**Maître Scrum (frontend) :** MightyRaven

---

## Convention Git

- **Une story = une branche.** Branche : `fe-a00`. Commits préfixés `FE-A00`.
- Branche depuis `dev` **puis rebase sur `origin/dev`** avant de coder ; PR vers `dev`.

---

## Convention Maquette (préalable UI)

- **Maquette validée AVANT implémentation** : structure du module (nav interne, accueil « choisir une source »,
  état « accès requis »), conforme au Design System Prospera, publiée en Artifact.

---

## User Story

En tant qu'**utilisateur d'un cabinet ayant accès à l'Atelier**,
je veux **entrer dans un espace où je choisis d'où vient ma balance**,
afin de **produire une balance exploitable, quelle que soit la matière première dont je dispose.**

---

## Contexte

L'Atelier est le module **amont** : il **produit** la balance que le Bilan **consomme**. C'est la
matérialisation UI de la décision **D13** — un **hub multi-source** où cabinet, IMF et distributeur
deviennent interchangeables parce que les trois convergent vers le **même contrat canonique**
(STORY-101) :

| Source (`SourceBalance`) | Matière première | Adaptateur backend | État |
|---|---|---|---|
| `sage` | Export Sage 100 (Excel/CSV) | STORY-086 | **livré** → FE-A01 |
| `direct` | Saisie / ingestion directe | STORY-101 | **livré** → FE-A02 |
| `ocr` | Cahiers de recettes/dépenses, factures | STORY-082→085 | **non livré** |

Cette story pose l'**ossature** et le **gate**. Elle ne produit aucune balance : c'est le rôle de
FE-A01/A02.

---

## Périmètre

**Inclus**

- **Route & shell** `(app)/atelier/*` : sous-navigation (Sources, Balances) et écran d'accueil qui
  **présente les trois sources** avec leur disponibilité réelle.
- **Gate d'accès UI** : reflet de l'entitlement `balance` (via FE-014) ; sans accès, écran d'orientation
  nommant **la raison** (e-mail non vérifié / KYC non approuvé / module non souscrit) et proposant l'action
  correspondante — jamais une erreur brute.
- **Routage API vers `balance-service`** : nouveau préfixe logique dans `src/lib/api/services.ts` + variable
  d'env dédiée, sur le patron `/ec` (voir *Décision à trancher*).
- **États** chargement / erreur / vide propres au module ; i18n FR (namespace `atelier`).

**Hors périmètre**

- Tout import ou saisie (FE-A01 / FE-A02), toute consultation (FE-A03).
- La source `ocr` : **annoncée comme à venir**, jamais un lien mort ni une page vide.

---

## Décision à trancher avant de coder

`balance-service` expose des routes **sans segment commun** : `/balances`, `/balance/import/sage`,
`/referentiels/actifs`, `/whoami/balance-access`. Le routeur front (`resolveApiUrl`, FE-INT-0) associe un
**préfixe logique** à une base de service — il faut donc en choisir un.

**Proposition : préfixe `/atelier` avec `strip: true`**, comme `/ec`. `/atelier/balances` →
`http://localhost:3007/api/v1/balances`.

⚠️ **Ce n'est pas cosmétique** : `bilan-service` expose **lui aussi** `/whoami`. Sans préfixe strippé
propre à chaque service, `/whoami` est ambigu — exactement l'ambiguïté que `/ec` avait été créé pour lever
(cf. commentaire de `services.ts`). Trancher explicitement, et le documenter là où le patron est déjà écrit.

---

## Critères d'acceptation

1. La route `(app)/atelier` existe, avec sa sous-navigation et un écran d'accueil listant les **trois**
   sources.
2. Les sources `sage` et `direct` sont présentées comme **disponibles** ; `ocr` (cahiers) comme **à venir**,
   non cliquable et **explicitement datée d'aucune promesse** — pas de lien mort.
3. Sans entitlement `balance`, le module affiche un écran d'orientation qui **nomme la raison** et propose
   l'action ; le module lui-même n'est pas rendu.
4. Un **403 du backend** est traité par son `code` (`EMAIL_NOT_VERIFIED` / `KYC_NOT_APPROVED` /
   `BALANCE_NOT_ENTITLED`) et non par un message générique — le backend reste l'autorité.
5. Le préfixe logique route bien vers `:3007` ; un test de `resolveApiUrl` couvre le cas et **prouve
   l'absence de collision avec `bilan-service`**.
6. Le paramétrage effectif de l'org est lisible (`GET /referentiels/actifs` : référentiel comptable + paquet
   fiscal, checksums), ou son indisponibilité est dite proprement (409 `REFERENTIEL_UNRESOLVED` /
   `REFERENTIEL_NON_PACKAGE`, 502, 503 — tous documentés au contrat).
7. Types **générés** depuis l'OpenAPI de `:3007` ; zéro mock sur le chemin réel ; i18n FR ; tests unitaires
   (gate ouvert/fermé, rendu du shell) + E2E Playwright.

---

## Notes techniques

| Composant | Fichier (proposé) | Nature |
|---|---|---|
| Shell module | `src/app/(app)/atelier/layout.tsx` + `nav` | Nouveau |
| Gate UI | `src/features/atelier/components/atelier-gate.tsx` | Nouveau |
| Routage service | `src/lib/api/services.ts` (+ `env.ts`, `.env.example`) | Modifié |

**Vigilance :**

- ⚠️ **`GET /whoami/balance-access` est déclaré « provisoire » dans le code du service** (commentaire de
  `WhoamiController` : « remplacée par les opérations Balance réelles »). **Ne pas bâtir le gate dessus.**
  Le reflet UI se lit sur l'entitlement (FE-014) ; l'autorité reste le 403 des routes métier. La sonde peut
  servir de diagnostic, jamais de dépendance structurelle.
- **Affichage ≠ autorisation.** Le gate UI est ergonomique ; `@RequiresBalanceAccess` décide.
- **Cohérence différée** : l'entitlement vient d'un read-model alimenté par Kafka après un octroi admin —
  tolérer un délai après un grant, ne jamais conclure « pas d'accès » sur une seule lecture fraîche.
- **Extensibilité** : structurer `features/atelier/` pour accueillir import Sage, saisie et consultation
  sans refactor.

---

## Integration Gate

Gate ouvert et fermé confrontés au **vrai** `balance-service` : une org sans entitlement reçoit bien un 403
`BALANCE_NOT_ENTITLED` (et non un 401 ou un 500), et l'écran d'orientation le nomme correctement.

---

## Definition of Done

- [ ] 7 critères d'acceptation validés ; tests verts.
- [ ] Aucune décision d'autorisation prise côté client.
- [ ] `lint` / `typecheck` / `test` / `build` verts (local + CI).
- [ ] Décision de préfixe logique tranchée **et écrite** dans `services.ts`.
- [ ] Statut mis à jour dans les trackers.
- [ ] Commits sur `fe-a00`, préfixés `FE-A00`.

---

## Notes

- Créée le 2026-07-24. Les lignes `FE-A*` existaient au tracker depuis la décision D14 mais **aucune
  n'avait été rédigée** — écart relevé par le PO.
- Contrat relevé **à la source** (`balance-service@dev`, `3bf4b5f`) et non sur un OpenAPI supposé.
