# Story PRA-04 : Le client d'API unique : `creerClient(code)`, les refus nommés, l'erreur qui se retrouve

Status: ready-for-dev — **créée le 2026-11-24** (plan `coordination/PLAN-COQUE-EPIC-265-2026-11-24.md`).

**Epic :** EPIC-265 — Coque `prospera-app` · **Groupe :** A · **Semaine visée :** S4 · **Points :** 3
**Dépôt :** `prospera-app` (dossier `src/coque/api/`)
**Spine :** AD-8 (client unique, `creerTeleversement`), AD-9 (refus de droit d'utiliser), AD-18 (`creerClientPublic`), AD-24
**Dépend de :** PRA-03 (le jeton en mémoire). **Débloque :** PRA-05.

---

## User Story

**En tant que** module d'écran,
**je veux** un seul moyen d'appeler mon service, qui ajoute le jeton, le préfixe et l'identifiant de corrélation et
qui sait quoi faire d'un refus de droit d'utiliser,
**afin de** n'écrire ni URL de service, ni gestion du 401, ni capture de `403 <MODULE>_NOT_ENTITLED`.

## Périmètre

**DANS le périmètre :**

1. **`creerClient(code)`** : préfixe `/api/<code>/v1`, jeton de la session (PRA-03), `X-Request-Id` neuf par appel,
   **une seule reprise sur 401**, partagée par toutes les requêtes en vol (la reprise de PRA-03), puis échec.
2. **Les refus de droit d'utiliser** (AD-9) : `403 <MODULE>_NOT_ENTITLED` et `403 ABONNEMENT_EXPIRE` annulent la
   requête **sans rejeu ni message**, et demandent une relecture de l'état publié, **au plus une par rafale de 5 s**.
   PRA-05 branche la relecture ; ici, un point d'accroche (`surRefusDeDroit`) et son test suffisent.
3. **`ApiError`** : statut, code nommé, message du serveur (jamais affiché tel quel), `X-Request-Id`. Tout autre
   refus (par exemple `CONSENTEMENT_RESERVE_AU_DG`) reste une `ApiError` que l'écran traduit.
4. **`creerClientPublic(code)`** : même préfixe, sans jeton, pour les écrans publics (AD-18).
5. **`creerTeleversement(code)`** : `tus-js-client` 4.3.x, qui emprunte au client le jeton, le préfixe et la reprise
   sur 401 (spine de la Reprise, AD-15).
6. **`signaler(erreur)`** : journal structuré (console JSON aujourd'hui), point d'entrée unique pour un collecteur
   plus tard (AD-24). `<ErreurApi>` du kit affiche le message traduit et l'identifiant de corrélation.
7. **Types générés** : un script `npm run contrats` qui génère les types d'un service depuis son OpenAPI
   (`openapi-typescript` 7.13.x), jamais écrits à la main (AD-15). Premier usage : `auth`.

**HORS périmètre :** la lecture de l'état publié (PRA-05) ; les écrans.

## Critères d'acceptation

| # | Critère | Preuve |
|:--:|---|---|
| AC-1 | Un appel par `creerClient('reseau')` part sur `/api/reseau/v1/…` avec `Authorization` et un `X-Request-Id` | Vitest (MSW ou fetch simulé) |
| AC-2 | Trois requêtes qui reçoivent un 401 en même temps déclenchent **une** reprise et sont rejouées une fois ; un second 401 donne une `ApiError` | Vitest |
| AC-3 | `403 RESEAU_NOT_ENTITLED` : pas de rejeu, pas d'`ApiError` remontée à l'écran, une demande de relecture ; cinq refus en 2 s ⇒ **une** demande | Vitest (horloge simulée) |
| AC-4 | `403 CONSENTEMENT_RESERVE_AU_DG` remonte en `ApiError` avec son code | Vitest |
| AC-5 | `<ErreurApi>` affiche le message traduit du code et l'identifiant de corrélation, jamais le texte brut du serveur | Testing Library |
| AC-6 | Aucune URL de service (`http://`, `:30xx`) n'apparaît dans `src/` | test de recherche dans la CI |
| AC-7 | `creerTeleversement` envoie un fichier par tus avec le jeton et reprend une fois sur 401 | Vitest |

## Notes pour le développeur

- Piège déjà payé : un `queryFn` qui résout `undefined` est une requête **en erreur** pour TanStack Query. Le client
  rend toujours une valeur ou lève.
- Le client de l'app expert-comptable (`src/lib/api/`) est la base ; il ne connaît pas les refus nommés : c'est le
  seul vrai ajout.

## Fini quand

AC-1 → AC-7 prouvés, PR fusionnée, fiche à `done`, journal de A à jour avec PRA-05.
