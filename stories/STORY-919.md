# STORY-919 : Droits hors du jeton, étape 3 — la garde fiscale lit `/moi/droits` en double lecture

Status: in-progress

**Complexité :** moyenne (le patron de STORY-949, posé dans fiscal)

**Source :** ADR « droits hors du jeton », étape 3 ; information de B (journal de B, « → A : `/moi/droits` est servi »)
**Service :** `prospera-fiscal-service`
**Plage :** groupe A, n° 15 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §2). Dépend de B-949 (fusionnée).
Fiche écrite pendant le codage, en attendant le verrou Docker.

---

## Pourquoi

Les droits d'un membre quittent le jeton : `auth-service` sert `GET /api/v1/moi/droits?organisationId=…` (droits de
tenant, droits plateforme, version `dv`) et publie `identity.droits.changed@1`. Avant la bascule, chaque service qui
garde des droits les lit **en double lecture** contre `perms[]` du jeton, pour mesurer les écarts sans rien changer
aux décisions. Côté fiscal, c'est la garde des habilitations (`DroitsFiscauxGuard`, STORY-300).

## Ce que la story livre

- `DroitsFiscauxGuard` compare `perms[]` du jeton à la résolution d'auth (`droits ∪ droitsPlateforme`), sur les
  **seuls droits fiscaux** (`droitsFiscauxDe`). **Le jeton décide** ; un écart se journalise
  (`DROITS_HORS_DU_JETON_ECART`) ; un jeton plus ancien que la résolution donne l'écart attendu `JETON_PLUS_ANCIEN`.
- Cache de 60 s au plus par (membre, organisation) ; un `dv` du jeton **plus récent** force la relecture ;
  `identity.droits.changed@1` d'un `dv` supérieur invalide l'entrée (`DroitsConsumer`, supervisé : 7 consommateurs).
- Auth injoignable, en refus ou mal configuré : la double lecture se tait (`INDISPONIBLE`), la garde décide comme avant.
- Le claim `dv` est lu par la stratégie JWT ; configuration `DROITS_AUTH_URL`, `DROITS_DOUBLE_LECTURE`,
  `DROITS_CACHE_TTL_MS` (plafonné à 60 s), `DROITS_DELAI_MS`, `DROITS_GROUP_ID`.

## Décisions

- **D-919-1 — Le client, le cache et la lecture de l'événement sont copiés du catalogue** (dev `8f3e321`,
  `src/droits-hors-du-jeton/`), chacun avec son origine en tête : pas de bibliothèque partagée (AD-26).
- **D-919-2 — La comparaison porte sur les droits fiscaux seulement** : un écart sur un droit d'un autre module n'est
  pas l'affaire de la garde fiscale.
- **D-919-3 — La branche part de 914** (qui contient 913) : configuration et inventaire des consommateurs y ont déjà
  bougé ; la PR se fusionne après celles de 913 et 914.

## Critères d'acceptation

- **AC-1** : mêmes décisions qu'avant, que la résolution d'auth donne plus ou moins que le jeton.
- **AC-2** : un écart est journalisé, un jeton plus ancien donne `JETON_PLUS_ANCIEN`.
- **AC-3** : le cache sert ; un `dv` plus récent force la relecture ; l'événement d'un `dv` supérieur invalide.
- **AC-4** : auth injoignable ⇒ `INDISPONIBLE`, sans lever.

## Definition of Done

- [ ] Unitaires (Node 24, étage `verification`), lint, `tsc` verts.
- [ ] Pile réelle : auth de `dev` (949) et fiscal ; un écart provoqué (rôle changé) se lit au journal, la décision ne
  bouge pas.
- [ ] PR code et docs fusionnées.
