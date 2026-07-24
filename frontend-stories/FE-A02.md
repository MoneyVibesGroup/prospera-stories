# Story FE-A02 : Saisie manuelle de balance + contrôle d'équilibre live

Status: ready-for-dev

**Epic :** FE-EPIC-007 — Atelier Balance
**Points :** 5 · **Sprint :** 7 (programme) · **App :** `prospera-frontend-expert-comptable`
**API :** balance-service (`:3007`) — `POST /api/v1/balances` (contrat canonique STORY-101)
**Backend d'appui :** **STORY-101** (contrat de balance canonique — keystone D13) — **done, vérifiée docker**
**Réf. plan :** `frontend-sprint-status.yaml` S7 · FR-A25 / FR-A27
**Dépendances :** FE-A00 (shell + routage `:3007`)
**Maître Scrum (frontend) :** MightyRaven

---

## Convention Git

- **Une story = une branche.** Branche : `fe-a02`. Commits préfixés `FE-A02`.
- Branche depuis `dev` **puis rebase sur `origin/dev`** avant de coder ; PR vers `dev`.

---

## Convention Maquette (préalable UI)

- **Maquette validée AVANT implémentation** : grille de saisie des lignes, bandeau d'équilibre live,
  statut de preuve, soumission.

---

## User Story

En tant que **comptable d'un cabinet sans export exploitable**,
je veux **saisir la balance à la main et voir l'équilibre se vérifier au fur et à mesure**,
afin de **produire une balance canonique correcte sans passer par un fichier.**

---

## Contexte

C'est l'**adaptateur `direct`** du hub D13 : la voie de production **sans matière première numérique**. Le
front construit ici une `SubmitBalanceDto` de toutes pièces et la soumet au **contrat canonique** — la même
porte d'entrée que l'import Sage, un corps JSON structuré au lieu d'un fichier.

Le cœur de l'écran est le **contrôle d'équilibre live** (FR-A25) : à chaque saisie, l'utilisateur voit si
débits = crédits **avant** de soumettre. Le backend revérifie et refuse un déséquilibre en **422** — le live
est une aide, pas l'autorité.

---

## Contrat réel (relevé à la source, `balance-service@dev`)

`POST /api/v1/balances` — JSON `SubmitBalanceDto` :

```
{
  exercice:    { debut: ISO-8601, fin: ISO-8601 },
  source:      "direct",              // enum: sage | direct | ocr
  referentiel: "SN",                  // enum: SN | SMT | SFD-BCEAO
  version:     1,                     // entier ≥ 1, append-only
  lignes: [ {
      compte:      "601",             // ^[0-9A-Za-z]{3,20}$
      libelle:     "Achats…",
      debit:       1500000,           // ENTIER ≥ 0, unités mineures XOF
      credit:      0,                 // ENTIER ≥ 0, unités mineures XOF
      niveauPreuve:"saisie"           // enum: fichier | ocr | estimé | saisie
  } ],                                // ≥ 1 ligne
  checksum:    "<sha256 hex>"         // ^[0-9a-f]{64}$ — voir ci-dessous
}
```

**Dérivés côté serveur, jamais envoyés** : `orgId`, `auteur`, `horodatage`, `sommaire`, `statutPreuve`,
`etat`. **Réponses** : **201** créée / **200** version déjà présente (NOP idempotente) / **400** contenu ou
checksum invalide / **422** déséquilibrée / **403** gate.

---

## ⚠️ Deux contraintes non négociables du contrat

### 1. Montants en **unités mineures XOF** (entiers), zéro flottant

`debit`/`credit` sont des **entiers ≥ 0** représentant des centimes (valeur × 100). Le backend **refuse**
(`400`) tout non-entier, tout négatif, et tout total qui franchit `2^53` (`Number.isSafeInteger`). L'UI
saisit en francs, **convertit en entiers pour l'envoi**, et n'additionne **jamais** en flottant — sinon
l'équilibre live diverge de celui du serveur et l'écran ment. Utiliser une arithmétique entière (ou
`BigInt` si les totaux approchent `2^53`).

### 2. Le **checksum est obligatoire et recalculé côté serveur**

Le corps porte un `checksum` SHA-256 que le backend **recalcule et compare** (`400` si divergent). Le front
**doit** reproduire exactement `computeBalanceChecksum` (`balance-service/src/modules/balance/balance.checksum.ts`) :

- SHA-256 hex du **contenu métier seul** : `{ exercice{debut,fin en toISOString()}, source, referentiel,
  version, lignes[{compte,libelle,debit,credit,niveauPreuve}] }` — **sans** `checksum` ni les champs
  serveur.
- **lignes triées par `compte`**, comparaison par **point de code** (`a < b`), **jamais** `localeCompare`
  (dépend de la locale du runtime → checksum divergent).
- dates via `new Date(x).toISOString()`.

→ **Porter cette fonction en TS avec un test de parité** : un vecteur connu (input → hash attendu) issu du
backend, verrouillé par test, pour qu'une dérive du front soit rouge immédiatement. C'est le point qui casse
en silence si on l'improvise.

---

## Périmètre

**Inclus**

- Grille de saisie des lignes : compte (regex `^[0-9A-Za-z]{3,20}$`), libellé, débit, crédit, niveau de
  preuve (`fichier`/`ocr`/`estimé`/`saisie`) — ajout/suppression de lignes.
- **Équilibre live** : total débit, total crédit, écart signé, verdict équilibré/déséquilibré, avec la
  **tolérance backend `< 1 XOF`** (`TOLERANCE_EQUILIBRE = 100` unités mineures).
- Bornes d'exercice, source figée à `direct`, référentiel, version.
- Calcul du **checksum** avant envoi ; soumission au contrat canonique.
- Distinction créée (201) / déjà présente (200 idempotent) ; erreurs 400/422 rendues avec leur message.
- Types **générés** depuis l'OpenAPI de `:3007`.

**Hors périmètre**

- La **validation** d'une balance (passage `BROUILLON` → `VALIDÉE`) : **il n'existe aucune route pour le
  faire** — voir *Trou de contrat* ci-dessous. C'est l'objet de FE-A03 une fois la route ouverte.
- Le `statutPreuve` **calculé** : le serveur le dérive ; le front peut l'**anticiper** pour informer, mais
  ne l'envoie jamais (il le déduit des `niveauPreuve` — voir FE-A03).

---

## ⚠️ Trou de contrat à ne pas contourner

Le service **crée toujours une balance en `etat: 'BROUILLON'`** et n'expose **aucune route** pour la faire
passer `VALIDÉE`/`REJETÉE`. La logique existe (`BalanceService.marquerEtat`, immuabilité incluse) mais **n'est
câblée à aucun contrôleur** (vérifié : `marquerEtat` n'apparaît que dans le service et ses commentaires).

→ **Cette story ne livre donc que la production d'un brouillon.** Ne pas inventer un `PATCH .../valider`
côté front. **Ticket backend à ouvrir** (route de transition d'état gardée). FE-A03 portera l'action de
validation quand la route existera.

---

## Critères d'acceptation

1. La grille permet d'ajouter/supprimer des lignes ; chaque champ est validé côté client sur les **mêmes
   règles que le backend** (compte regex, montants entiers ≥ 0, niveau de preuve dans l'enum).
2. L'équilibre est recalculé **à chaque frappe**, en **arithmétique entière**, avec la tolérance `< 1 XOF` :
   le verdict live coïncide avec celui du serveur.
3. Le **checksum** envoyé est accepté par le backend (`201`/`200`), et un **test de parité** verrouille
   l'algorithme contre un vecteur du backend.
4. Une soumission **déséquilibrée** est refusée (**422**) : l'écart chiffré est affiché ; l'UI ne prétend
   pas avoir enregistré.
5. Une re-soumission **identique** (même version) renvoie **200 idempotent** — présenté comme « déjà
   enregistrée », pas comme une erreur ; une **nouvelle version** est un ajout, pas un écrasement.
6. Sans entitlement, **403** traité par son `code` (règle FE-A00).
7. Types générés ; zéro mock sur le chemin réel ; tests unitaires (équilibre, checksum, validation de
   champ) + E2E Playwright.

---

## Integration Gate

Saisie réelle soumise au vrai service : une balance équilibrée → **201** avec `etat: 'BROUILLON'` et un
`checksum` **accepté** ; une déséquilibrée → **422** ; le même corps re-soumis → **200 idempotent**. Le
checksum calculé par le front est confronté à celui qu'attend le backend (parité prouvée, pas supposée).

---

## Definition of Done

- [ ] 7 critères d'acceptation validés ; tests verts, dont la **parité de checksum**.
- [ ] Aucune arithmétique flottante sur les montants ; unités mineures respectées.
- [ ] Aucune UI de validation d'état livrée ; ticket backend `marquerEtat` ouvert et référencé.
- [ ] `lint` / `typecheck` / `test` / `build` verts (local + CI).
- [ ] Statut mis à jour dans les trackers.
- [ ] Commits sur `fe-a02`, préfixés `FE-A02`.

---

## Notes

- Créée le 2026-07-24. Contrat relevé à la source (`balance-service@dev`, `3bf4b5f`) — DTO, checksum,
  validateur et enums lus directement, pas déduits d'un OpenAPI.
