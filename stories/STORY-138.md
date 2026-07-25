# STORY-138 : Aligner le guard e-mail sur le contrat `{ message, code }` — rendre le 403 `EMAIL_NOT_VERIFIED` lisible par machine sur toutes les relying-parties navigateur

**Epic :** transverse / **dette de contrat d'API** (story cross-cutting hors décompte d'epic, même nature que STORY-109 CORS)
**Réf. architecture :** `architecture-prospera-ecosystem-2026-07-04.md` § relying-parties ; chaîne de guards STORY-006 (`Throttler → Jwt → EmailVerified → Roles`)
**Priorité :** Should Have (dette de contrat ; **aucun** blocage fonctionnel — le front dégrade proprement, cf. Contexte)
**Story Points :** 3
**Statut :** planned (slottée **Sprint 17**, 2026-07-25 — décision user ; S17 → 21/34)
**Créée le :** 2026-07-25
**Origine :** Integration Gate de **FE-024** (2026-07-24) — confrontation du gate Atelier au vrai `balance-service`
**Services :** `auth-service` (:3001), `expert-comptable` (:3000), `kyc-service` (:3002), `platform-catalog-service` (:3003), `document-service` (:3006), `bilan-service` (:3005), `balance-service` (:3007)
**Couvre :** dette d'intégration — aucune FR (story d'**enablement de contrat**)

> **Story de contrat, pas de fonctionnalité.** L'Integration Gate de FE-024 a prouvé, jeton réel à l'appui, que le refus « e-mail non vérifié » sort **sans `code`** sur les routes gardées, alors que les autres motifs du même parcours (`KYC_NOT_APPROVED`, `BALANCE_NOT_ENTITLED`) en portent un. Le front ne peut donc pas **nommer** ce motif à partir du 403 seul : il doit le déduire d'un canal parallèle (le claim `emailVerified` du jeton). Le contrat d'erreur est **asymétrique** — un motif sur trois n'est pas auto-descriptif.

---

## User Story

En tant qu'**app cliente navigateur (relying party Bearer, topologie Option B)**,
je veux que **le 403 « e-mail non vérifié » porte un `code` machine (`EMAIL_NOT_VERIFIED`), comme les autres motifs de refus**,
afin de **nommer la raison et proposer l'action à partir de la seule réponse HTTP — sans reconstituer le motif depuis un canal parallèle, et sans qu'un motif sur trois échappe au contrat.**

---

## Contexte

### Le trou, mesuré (FE-024 Integration Gate, 2026-07-24 — stack docker `origin/dev` `3bf4b5f`)

Org créée via l'IdP réel, jeton réel, progression état par état contre `GET /api/v1/referentiels/actifs` (:3007, route gardée `@RequiresBalanceAccess`) :

| État de l'org | Réponse | Corps | `code` |
|---|---|---|---|
| E-mail **non vérifié** | 403 | `{statusCode, error, message}` | ⚠️ **ABSENT** |
| E-mail vérifié, KYC non approuvé | 403 | `{…, code}` | `KYC_NOT_APPROVED` |
| KYC approuvé, pas d'entitlement | 403 | `{…, code}` | `BALANCE_NOT_ENTITLED` |

Réponse e-mail brute observée :
```
403 {"statusCode":403,"error":"Forbidden",
     "message":"Adresse e-mail non vérifiée. Vérifiez votre e-mail pour accéder à cette ressource."}
```
→ pas de champ `code`, contrairement aux deux motifs suivants.

### Cause racine — DEUX maillons, pas un

1. **Le guard émet une chaîne nue.** Le refus e-mail vient du guard **global** `EmailVerifiedGuard`
   (chaîne de STORY-006, s'exécute **avant** le guard métier). Sur les **7** services il fait
   `throw new ForbiddenException(EMAIL_NOT_VERIFIED_MESSAGE)` — une **chaîne**, pas un objet
   `{ message, code }`. Vérifié identique sur les 7 (`auth`, EC, `kyc`, `catalog`, `document`, `bilan`,
   `balance`). C'est un **patron copié-collé** (chaque service a sa propre copie de
   `src/common/guards/email-verified.guard.ts` — pas de package partagé), donc il **diverge ou se corrige
   partout à la fois**.

2. **Le filtre d'exception jette `code` sur 5 services.** Même en corrigeant le guard, `code` n'atteindrait
   pas le corps sur 5 des 7 services : leur `AllExceptionsFilter.normalize()` extrait **seulement**
   `{ statusCode, error, message }` et **ignore** `code`. Deux services seulement le propagent déjà.

| Service | `AllExceptionsFilter` porte `code` ? | Correctif requis |
|---|---|---|
| `balance-service` | ✅ oui (`...(code ? { code } : {})`) | **guard seul** |
| `bilan-service` | ✅ oui | **guard seul** |
| `auth-service` | ❌ non | **guard + filtre** |
| `expert-comptable` | ❌ non | **guard + filtre** |
| `kyc-service` | ❌ non | **guard + filtre** |
| `platform-catalog-service` | ❌ non | **guard + filtre** |
| `document-service` | ❌ non | **guard + filtre** |

C'est pourquoi `balance-service` **sait déjà** émettre `KYC_NOT_APPROVED`/`BALANCE_NOT_ENTITLED` avec `code`
(son `BalanceAccessGuard` lève `ForbiddenException({ message, code })` et son filtre le propage), mais **pas**
`EMAIL_NOT_VERIFIED` : ce dernier est intercepté **en amont** par le guard e-mail global, resté en chaîne nue.

### Ce que ça NE bloque pas (honnêteté de priorité)

Le front (FE-024) **ne dépend pas** de ce correctif pour fonctionner : le gate Atelier couvre déjà
`EMAIL_NOT_VERIFIED` par le **reflet local** (claim `emailVerified` du jeton) et par la garde d'app globale.
Le 403 sans `code` ne casse rien — il **dégrade proprement**. Cette story supprime une **dette de contrat**
(un motif sur trois non auto-descriptif), elle ne débloque pas un parcours. D'où la priorité *Should*, pas *Must*.

---

## Décision de conception

**Faire porter au guard e-mail global un `ForbiddenException({ message, code: 'EMAIL_NOT_VERIFIED' })`**, et
**étendre `AllExceptionsFilter` des 5 services qui ne le propagent pas encore** pour qu'il relaie un champ
`code` optionnel — en **copiant à l'identique** le patron déjà en place dans `balance-service`/`bilan-service`
(pas de nouvelle invention : on **converge** les filtres sur la forme la plus complète existante).

- **Valeur du code** : littéral **`EMAIL_NOT_VERIFIED`** (exactement la casse déjà utilisée par
  `BalanceAccessGuard.BALANCE_ACCESS_CODE.EMAIL_NOT_VERIFIED` et attendue côté front,
  `API_ERROR_CODES.EMAIL_NOT_VERIFIED`). Un contrat, une chaîne — pas de synonyme.
- **Rétrocompatibilité** : ajout **purement additif**. `statusCode`/`error`/`message` sont inchangés ; les
  clients qui ne lisent pas `code` ne voient aucune différence. Aucune rupture.
- **Filtre** : `code?: string` sur le type `ErrorResponseBody` **et** dans `normalize()` (déstructurer `code`
  du `getResponse()` d'une `HttpException`, l'inclure conditionnellement : `...(code ? { code } : {})`).
  Ne touche **que** les exceptions dont le `getResponse()` est un objet portant `code` — les autres restent
  identiques (non-régression).
- **Périmètre = relying-parties navigateur uniquement.** `admin-panel` est **hors périmètre** (BFF
  same-origin : ses 403 sont consommés par ses propres Route Handlers server-to-server, pas par un
  navigateur qui aurait besoin du `code` — même exclusion que STORY-109).

> ⚠️ **Le guard e-mail est un copié-collé, pas un package.** Le corriger sur un seul service **rouvrirait**
> exactement la divergence que FE-024 a relevée (un service auto-descriptif, six muets). D'où le traitement
> **groupé** des 7, comme STORY-109 a traité le CORS sur 5 en une passe.

---

## Périmètre

**Inclus :**
- **`email-verified.guard.ts` (×7)** : `throw new ForbiddenException({ message: EMAIL_NOT_VERIFIED_MESSAGE, code: 'EMAIL_NOT_VERIFIED' })`.
- **`all-exceptions.filter.ts` (×5)** — `auth`, EC, `kyc`, `catalog`, `document` : ajouter `code?: string` au
  type de réponse et à `normalize()`, patron identique à `balance`/`bilan`.
- **Tests unitaires** : le guard e-mail lève une exception dont `getResponse()` porte `code: 'EMAIL_NOT_VERIFIED'` (×7) ;
  le filtre propage `code` quand l'exception en porte un et **l'omet** sinon (×5, non-régression).

**Hors périmètre :**
- `admin-panel` (BFF same-origin — cf. décision). Ne pas y toucher.
- `balance-service` / `bilan-service` **filtre** (déjà conforme — seul leur guard change).
- Tout autre code d'erreur ou tout autre guard (`RolesGuard`, `IdentitySuspensionGuard`…) : cette story ne
  traite **que** `EMAIL_NOT_VERIFIED`. Aligner d'autres motifs serait une story distincte.
- Refonte en package partagé du guard/filtre (dette réelle, mais décision d'architecture à part — ici on
  converge le comportement, pas la structure des dépôts).

---

## Critères d'acceptation

**Code**
- [ ] **AC-01** — Sur les **7** services, le guard e-mail lève `ForbiddenException({ message, code: 'EMAIL_NOT_VERIFIED' })` (plus de chaîne nue).
- [ ] **AC-02** — Sur les **5** services au filtre incomplet, `AllExceptionsFilter` propage un `code` présent et l'**omet** s'il est absent (patron identique à `balance`/`bilan`).
- [ ] **AC-03** — Ajout **purement additif** : `statusCode`/`error`/`message` inchangés ; aucun autre corps d'erreur ne gagne de `code` par effet de bord.

**Vérification HTTP (curl) — stack docker réel**
- [ ] **AC-04** — Sur **chacun** des 7 services, une route gardée appelée avec un jeton **valide mais `emailVerified:false`** renvoie **403** avec corps `{..., "code":"EMAIL_NOT_VERIFIED"}`. (Route témoin par service, ex. `GET /api/v1/referentiels/actifs` pour balance, `GET /api/v1/tenant/state` pour EC si gardée, etc. — choisir une route **soumise** au guard e-mail.)
- [ ] **AC-05** — Le **même appel avec `emailVerified:true`** ne renvoie **pas** `EMAIL_NOT_VERIFIED` (le motif a disparu, on est passé au maillon suivant) — preuve que le code n'est pas posé à tort.
- [ ] **AC-06** — Non-régression : un 403 d'un **autre** motif (`KYC_NOT_APPROVED` sur balance) porte **toujours** son propre `code`, inchangé ; un 401/422/500 ne gagne **aucun** `code`.

**Front (rappel de contrat, pas une AC de cette story)**
- Le front `prospera-frontend-expert-comptable` lit déjà ce contrat : `normalizeErrorBody` lit `code`,
  `API_ERROR_CODES.EMAIL_NOT_VERIFIED` existe (FE-024). Aucun changement front requis ; le reflet local reste
  le filet de sécurité. À la prochaine story front qui touche le gate, retirer la note « guard e-mail non aligné ».

**Non-régression**
- [ ] **AC-07** — Lint 0 warning · build OK · unit verts · seuils de couverture tenus sur les **7** services.
- [ ] **AC-08** — Les routes `@AllowUnverified()`/`@Public()` (register, verify-email, resend, logout, refresh) restent **inchangées** (le guard les laisse passer, aucun `code` ne surgit là).

---

## Notes techniques

### Le maillon exact (rappel STORY-006)
Chaîne de guards : `Throttler → JwtAuthGuard → EmailVerifiedGuard → RolesGuard → <guard métier>`. Le guard
e-mail s'exécute **avant** le guard métier : pour toute route non `@AllowUnverified`, c'est **lui** qui
tranche le cas e-mail — d'où l'inutilité de toucher les guards métier pour ce motif.

### Forme cible (identique partout)
```ts
// email-verified.guard.ts
throw new ForbiddenException({
  message: EMAIL_NOT_VERIFIED_MESSAGE,
  code: 'EMAIL_NOT_VERIFIED',
});
```
```ts
// all-exceptions.filter.ts (5 services) — copier balance/bilan
interface ErrorResponseBody { statusCode: number; error: string; message: string | string[]; code?: string; }
// normalize(): déstructurer `code` du getResponse() objet, puis
return { statusCode, error, message, ...(code ? { code } : {}) };
```

### Sécurité
- Un `code` **n'est pas** de l'autorisation : il rend le refus lisible, il ne l'affaiblit pas. Le 403 reste un 403.
- Ne **jamais** exposer un `code` sur une erreur qui n'en portait pas (fuite d'information / surface de
  contrat). L'inclusion est **conditionnelle** (`...(code ? … : {})`) — AC-06 le vérifie.

### Cas limites
- **`emailVerified` absent du jeton** (jeton legacy) : le guard traite l'absence comme non-vérifié (comportement actuel), et pose le `code` — cohérent.
- **Double vérification e-mail** (guard global **et** guard métier qui reteste l'e-mail, cas `balance`) : le
  guard **global** tranche en premier ; le `code` du guard métier pour l'e-mail devient inatteignable, ce qui
  est correct (un seul motif, un seul code). Pas de conflit.

---

## Dépendances

**Prérequises :** aucune (le stack docker STORY-075 suffit à vérifier).
**Débloque :** rien de fonctionnel — **solde une dette de contrat**. Permet à toute story front consommant
un 403 e-mail (FE-024 Atelier, FE-028+ Bilan) de nommer le motif **depuis la réponse** plutôt que d'un canal parallèle.
**Story sœur (front, déjà livrée) :** FE-024 — a relevé l'écart, expose déjà `API_ERROR_CODES.EMAIL_NOT_VERIFIED`
et le couvre par le reflet local en attendant cette story.

---

## Definition of Done

- [ ] Lint 0 warning · build OK · unit verts · couverture tenue sur les **7** services
- [ ] **Vérif curl** (AC-04→06) consignée : `EMAIL_NOT_VERIFIED` présent sous e-mail non vérifié sur les 7, absent sinon, autres motifs inchangés
- [ ] Non-régression `@AllowUnverified`/`@Public` (AC-08) et corps non-e-mail (AC-06)
- [ ] Statut synchronisé (en-tête + `sprint-status.yaml` + Progress Tracking)
- [ ] `/code-review` passé, constats traités
- [ ] Branches `MNV-138(<service>)` par dépôt, PR par service, Rebase and merge sur `dev`
- [ ] Note « guard e-mail non aligné » retirée de FE-024 (frontend-stories/FE-024.md) une fois les 7 mergés

---

## Découpage des points

- **Guard e-mail (×7, une ligne, patron répété) :** 0,5 pt
- **Filtre d'exception (×5, copie du patron balance/bilan) :** 1 pt
- **Tests unitaires guard (×7) + filtre (×5) :** 1 pt
- **Vérif curl multi-service (stack docker, jeton emailVerified:false) :** 0,5 pt
- **Total : 3 points** — travail répétitif faible risque ; le coût réel est la **cohérence des 7 dépôts** et la
  vérif que le `code` traverse bien filtre + préfixe global sur chaque service.

---

## Progress Tracking

- 2026-07-25 : **créée** — statut `defined`. Origine : Integration Gate de FE-024 (403 `EMAIL_NOT_VERIFIED`
  sans `code`, confronté au vrai `balance-service`). Analyse : patron copié-collé sur 7 services + asymétrie
  des filtres d'exception (2 propagent `code`, 5 le jettent). Mémoire projet à créer : `guard-email-contrat`.
- 2026-07-25 : **slottée Sprint 17** (décision user) — S17 passe à 21/34. S15 était à capacité (32/34) et
  hors thème ; S16 déjà chargé ; S17 (thème OCR 082→085) a la marge. Insérée hors thème comme enablement
  transverse, à la façon de STORY-109.

### Incrément proposé (décision user 2026-07-25)
`balance-service` d'abord — le service que FE-024 consomme, **guard seul** (son filtre est déjà conforme) —
comme premier incrément démonstrateur du patron ; les 6 autres suivent le même gabarit (dont 5 avec la
retouche filtre).
