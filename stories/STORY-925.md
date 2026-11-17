# STORY-925 : Le référentiel effectif d'un dossier déclare son dossier et sa famille

Status: in-progress

**Complexité :** petite (un service, deux champs servis, aucune route nouvelle)

**Épic :** EPIC-159 (le cabinet sur le moteur), dette d'intégration du front du cabinet
**Service :** `balance-service`
**Plage :** groupe A, n° 6 du lot 3 (`coordination/PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §2). Source :
`tickets/TICKET-BACKEND-referentiel-effectif-non-resolu-par-dossier.md` (FE-061). Fiche écrite avant de coder le
correctif ; **l'état du code a été relu d'abord** (ci-dessous).

---

## Ce que le code faisait déjà (lu sur `origin/dev`)

Le ticket date du 19/08 : il décrit une route `GET /referentiels/actifs` résolue par organisation. **Ce n'est plus vrai.**

- **STORY-422** a déplacé la route **sous le dossier** : `GET /api/v1/dossiers/{dossierId}/referentiels/actifs`
  (`ReferentielController`, `@RequiresDossierScope()`). Le référentiel comptable est résolu **du dossier** (décision
  d'axes datée, puis `typeEntite`, puis profil du cabinet : `systemeComptableEffectif`, STORY-729) ; l'entitlement de
  l'organisation dit seulement si elle y a droit. Deux dossiers du même cabinet reçoivent deux paquets.
- La route rend déjà les **versions** : `referentiel {code, version}`, `checksum`, `stamp` (code, version, checksum,
  statut, miseEnGarde), compteurs, paquet fiscal pays × année avec son empreinte, `referentielsHabilites`.
- **STORY-906** a ajouté `tag` (`SN` | `SMT` | `SFD-BCEAO` | `CIMA`).
- La sonde d'autorité du gate de l'Atelier (`@RequiresBalanceAccess`) reste portée par la même garde ; aucune route
  org-scopée n'existe plus pour ce diagnostic (le ticket demandait de ne pas la déplacer : elle a été **remplacée**
  par la route de dossier, avec 422).

## Ce qui manquait (le reste du ticket)

1. **La réponse ne déclare pas sa portée** : ni `dossierId` ni famille dans le corps. Le ticket l'exige
   explicitement (« `dossierId` ET `referentielComptable` dans le corps ») : une réponse qui ne dit pas son dossier est
   invérifiable par son client (leçon du ticket `balance-ne-declare-pas-son-dossier`, servie pour la balance par 906).
2. Les vérifications de reprise du ticket n'étaient pas **éprouvées** sur cette route : deux dossiers d'un même cabinet
   de familles différentes, dossier archivé lisible, hors portée en 404.

## Ce que la story livre

Sur `GET /api/v1/dossiers/{dossierId}/referentiels/actifs` (ajouts seuls, §1.8) :

- **`dossierId`** (hex, toujours servi) : le dossier de l'URL.
- **`referentielComptable`** (`SYSCOHADA` | `SFD-BCEAO` | `CIMA`, facultatif) : la famille du référentiel effectif,
  dans le vocabulaire de `GET /dossiers/{id}`. `SN` et `SMT` ⇒ `SYSCOHADA`.

## Critères d'acceptation

- **AC-1** : deux dossiers du même cabinet (SN et SFD-BCEAO) rendent des paquets différents (code, version,
  empreinte) ; chaque corps porte son `dossierId` et sa `referentielComptable`.
- **AC-2** : un dossier archivé reste lisible (D9) et déclare son `dossierId`.
- **AC-3** : un dossier d'une autre organisation ou inconnu ⇒ 404 (jamais 403), aucun paramétrage dans le corps.
- **AC-4** : un dossier sans cadre résoluble ⇒ 409 `SYSTEME_COMPTABLE_INDETERMINE` (refus nommé, déjà en place).
- **AC-5** : les champs d'origine sont inchangés ; l'OpenAPI publie les deux champs (`FamilleReferentielComptable`).

## Décisions

- **D-925-1 — la famille vient du paquet servi, pas de `typeEntite`.** Le ticket la décrit « dérivée de
  `typeEntite` », mais un dossier qui porte une décision d'axes explicite garde son référentiel (D-507-N) : calculer la
  famille ailleurs que dans la résolution ferait diverger la famille et les versions de la **même** réponse, sans
  erreur. Elle est donc déduite du tag du couple `code@version` réellement chargé (`SN`/`SMT` ⇒ SYSCOHADA). Écart
  possible avec `referentielComptable` de `GET /dossiers/{id}` (dérivé du seul `typeEntite`) : c'est une information
  vraie, que l'écran peut montrer (ne pas masquer).
- **D-925-2 — pas de cadre résoluble ⇒ refus nommé, pas de repli.** Cohérent avec STORY-728/729 : le 409
  `SYSTEME_COMPTABLE_INDETERMINE` existant reste (rien ne choisit en silence). Le front dit « non déterminé ».
- **D-925-3 — pas de route nouvelle, pas de paramètre `?dossierId=`.** La route est déjà sœur du dossier ; le
  paramètre mélangerait la sonde d'autorité et la lecture métier (option 2 du ticket, écartée par lui).
- **D-925-4 — plusieurs versions actives.** Le résolveur sert déjà **une** version par dossier (la plus récente
  habilitée, épinglée à la date de l'exercice par STORY-727) ; `referentielsHabilites` liste le reste. Rien à ajouter.
- **D-925-5 — `referentielComptable` omis** quand le paquet n'a aucun tag canonique (même règle que `tag`, jamais
  une valeur inventée).

## Definition of Done

- [ ] tsc, lint des fichiers touchés, e2e `referentiel` + `openapi-contract`, unitaires `referentiel` verts.
- [ ] Mutations rouges sur l'assertion (dossier remplacé par l'organisation ; famille `SN` au lieu de SYSCOHADA).
- [ ] Docker non requis (un contrôleur existant, deux champs de réponse, aucun module/provider/dépendance).
- [ ] PR code fusionnée ; ticket fermé ; journal de A.
