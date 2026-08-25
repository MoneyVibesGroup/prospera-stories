# STORY-406 : Un octet nul dans la recherche rend `500` — le refus documenté sort en erreur serveur

**Epic :** EPIC-043 — Dossier client, unité de travail du cabinet
**Réf. :** relevée par la **revue de sécurité de STORY-383**, qui l'a **écartée de son rapport** — le défaut est **strictement pré-existant** (STORY-359) et STORY-383 ne l'amplifie pas.
**Priorité :** Should Have
**Story Points :** 2
**Statut :** `ready-for-dev`
**Complexité :** low
**Créée le :** 2026-08-25 — à la revue de sécurité de STORY-383
**Sprint :** 20
**Service :** `dossier-service`

> ⚠️ **Sur le numéro.** `git log -S"STORY-406"` la trouve dans un état **historique** du dépôt (commit
> `1debcaa`, backlog fiscalité du 2026-08-04, plage 400→456) — cette plage a été **renumérotée depuis**,
> et l'épic fiscalité actuel ne va plus au-delà de STORY-364. Vérifié libre le 2026-08-25 dans l'état
> **actuel** : absente de `stories/`, de `sprint-status.yaml`, de tout `*.md`/`*.yaml`, et de
> `origin/main`. La règle issue de la collision STORY-396 impose de le dire plutôt que de laisser la
> prochaine session refaire le doute.

---

## Le constat — mesuré, pas supposé

```
GET /api/v1/dossiers?q=%00abc     -> HTTP 500     (route ouverte à TENANT_USER)
GET /api/v1/activite?q=%00abc     -> HTTP 500     (route réservée à TENANT_ADMIN)
GET /api/v1/activite?q=abc        -> HTTP 200
```

Corps rendu : `{"statusCode":500,"error":"Internal Server Error","message":"Une erreur interne est survenue."}`

Cause, côté base :

```
BadValue | Regular expression cannot contain an embedded null byte
```

## Pourquoi la saisie arrive intacte jusqu'à Mongo

Deux fonctions se passent la valeur, et **aucune des deux ne connaît l'octet nul** :

| Étape | `src/modules/dossiers/recherche.util.ts` | Ce qu'elle en fait |
|---|---|---|
| `normaliserPourRecherche` | `NFD` → retrait des diacritiques → minuscules → `\s+` → `trim()` | **rien** — ce n'est ni un diacritique ni un blanc au sens de `\s`, et `trim()` ne l'élague pas |
| `echapperRegex` | échappe `. * + ? ^ $ { } ( ) | [ ] \` | **rien** — ce n'est pas un métacaractère, donc il n'est pas dans la classe |

La chaîne part alors en `$regex` telle quelle, et le pilote la refuse **au niveau BSON**.

⚠️ **Ce n'est PAS une injection** : la valeur reste une valeur, jamais une clé ni un opérateur — la
revue de sécurité l'a établi sur les deux étages (parser `simple` d'Express 5 + `forbidNonWhitelisted`).
C'est un **défaut de correction** : le contrat annonce `400` pour une saisie invalide, et il sort `500`.

⚡ **Le même patron que STORY-405**, à une entrée près : là, `@IsMongoId()` acceptait le préfixe `0x`
et le `400` documenté sortait en `500`. Ici, c'est le champ de recherche. Une saisie qu'un utilisateur
peut produire — un copier-coller depuis un export mal terminé suffit — ne doit jamais consommer le
budget d'erreur `5xx`, où elle noie les vrais incidents.

---

## User Story

En tant qu'**exploitant de la plateforme**,
je veux qu'une **saisie de recherche invalide** soit refusée proprement,
afin que **le budget d'erreur `5xx` ne décrive que de vrais incidents serveur**.

---

## Ce que la story livre

Un seul geste, dans la fonction que **tous** les appelants traversent :

- `normaliserPourRecherche` retire les **caractères de contrôle** de la saisie — c'est déjà elle qui
  replie les accents et réduit les blancs, c'est donc là que « ce qui n'est pas du texte cherchable »
  se retire.

⚠️ **Le geste est dans la fonction PARTAGÉE, pas chez chaque appelant.** Ils sont **trois** aujourd'hui
(`journal.repository.ts:187`, `portefeuille.repository.ts:225` et `:237`), et un correctif posé chez
deux d'entre eux laisserait le troisième ouvert sans que rien ne le signale.

⚠️ **`normaliserNif` doit être vérifiée aussi** : `portefeuille.repository.ts:237` échappe un NIF
normalisé par un **autre** chemin. Si `normaliserNif` laisse passer la même saisie, le correctif
ci-dessus ne couvre pas cette clause.

## Hors périmètre

- ⛔ **Aucun changement d'`echapperRegex`** : elle échappe des **métacaractères**, et un caractère de
  contrôle n'en est pas un. Y ajouter un cas mélangerait deux responsabilités — « rendre un motif
  littéral » et « nettoyer une saisie ».
- ⛔ Aucune nouvelle route, aucun nouveau code de refus : une saisie devenue vide après nettoyage suit
  la règle **déjà en vigueur** — traitée comme **absente**, pas comme « ne correspond à rien ».

---

## Acceptance Criteria

- [ ] `GET /api/v1/dossiers?q=%00abc` et `GET /api/v1/activite?q=%00abc` rendent un résultat **normal**
      (la recherche porte sur `abc`), **jamais `500`**.
- [ ] La même saisie **seule** est traitée comme **absente** — la règle existante des blancs.
- [ ] Les **autres caractères de contrôle** subissent le même sort, et **un test les balaye** plutôt
      que de n'éprouver que le premier.
- [ ] Un caractère **accentué** et un **espace insécable** continuent de se comporter comme
      aujourd'hui — la non-régression de STORY-359.
- [ ] La clause **NIF** (`normaliserNif`) est vérifiée sur la même entrée, et corrigée si elle est
      atteinte.
- [ ] **Vérification docker** : la mesure ci-dessus rejouée sur la vraie base, `500` devenu `200`.

---

## Definition of Done

- [ ] Lint 0 · build OK · couverture ≥ seuils.
- [ ] Mutation : retirer le nettoyage fait **rougir** le test — sinon il ne garde rien.
- [ ] `/code-review` + `/security-review`.

## Story Points Breakdown

- Nettoyage dans `normaliserPourRecherche` + vérification de `normaliserNif` : 0,5 pt
- Tests (balayage des caractères de contrôle, non-régression accents) : 1 pt
- Vérification docker sur les deux routes : 0,5 pt
- **Total : 2 points**
