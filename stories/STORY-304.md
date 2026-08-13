# STORY-304 : Résolution conjointe type d'entité → référentiel comptable, combinaison incohérente refusée

**Epic :** EPIC-043 — Dossier client, unité de travail du cabinet
**Réf. :** ticket `TICKET-BACKEND-dossier-client-entite-de-premier-rang.md` — bloc **C** · décision **D7** · question **Q3** *(tranchée)*
**Priorité :** Must Have
**Story Points :** 5
**Statut :** ✅ Terminée
**Complexité :** medium
**Créée le :** 2026-08-13
**Sprint :** 20
**Service :** `dossier-service`

---

## Le constat

`typeEntite` est porté par `Dossier` depuis STORY-301, mais **sa résolution n'existe nulle part** — le
docstring de l'énumération le dit explicitement : « pour mémoire — non implémentée ici ». Aujourd'hui,
c'est `balance-service` qui laisse le **client** choisir librement le `referentiel` de chaque balance
soumise (`@IsIn(['SN','SMT','SFD-BCEAO','CIMA'])`, `submit-balance.dto.ts:128`) — rien ne le rapproche du
`typeEntite` du dossier concerné. Un dossier `MICROFINANCE` calculé sur le plan `SN` (entreprise) produit
un montant **faux et opposable**, sans qu'aucun contrôle ne s'y oppose.

**D7 tranche** : le référentiel comptable est **déduit du type d'entité**, jamais saisi ni calculé à la
volée — `ENTREPRISE → SYSCOHADA` · `MICROFINANCE → SFD-BCEAO` · `ASSURANCE → CIMA`. Une combinaison qui
ne peut pas être résolue proprement est **refusée**, jamais approximée.

**Q3 tranchée par la maquette** : changer le type d'entité d'un dossier est **refusé** dès qu'un exercice
est validé — une liasse figée cite son référentiel, le rejouer rétroactivement rendrait faux un document
déjà déposé.

---

## User Story

En tant que **cabinet comptable**,
je veux que **le référentiel comptable de chaque dossier soit dérivé de son type d'entité, jamais saisi
librement**,
afin de **ne jamais pouvoir calculer une société sur le mauvais plan de comptes**.

---

## Ce que la story livre

- **Résolution pure et exhaustive** `résoudreReferentielComptable(typeEntite): ReferentielComptable` —
  `switch` sans `default`, donc **une erreur de compilation** si `TypeEntite` gagne une valeur sans
  résolution déclarée. C'est la forme concrète de « refusée, jamais calculée » : aucune branche ne peut
  approximer une correspondance qu'elle ne connaît pas.
- Nouveau champ **dérivé, en lecture seule** `referentielComptable` sur `DossierResponseDto` — calculé à
  la réponse depuis `typeEntite`, **jamais stocké** (une correspondance qui changerait plus tard doit se
  refléter immédiatement, pas rester figée dans un document existant) et **jamais accepté en écriture**
  (absent de tous les DTO d'entrée).
- **Q3, garde par absence** : aucune route de `dossier-service` ne permet de modifier `typeEntite`
  post-création — vérifié par un test e2e, au même patron que « aucune route `DELETE` » (STORY-301/D9).
  Le champ est donc refusé au changement **inconditionnellement**, une garantie strictement plus forte
  que « refusé dès qu'un exercice est validé ». Le jour où une story ouvrira la modification de
  l'identité (STORY-079/304, cf. STORY-354 « hors périmètre »), elle devra explicitement consulter l'état
  de validation des exercices du dossier avant de lever cette garde — **hook inerte documenté**, pas un
  oubli.

## Hors périmètre — et pourquoi

- **Le paquet fiscal.** D-078-1 (`balance-service`, STORY-078, décision livrée et testée) est explicite :
  le paquet fiscal est un axe **orthogonal** au référentiel comptable, résolu par `pays × année` — pas par
  `typeEntite`. `dossier-service` n'a aujourd'hui ni le concept d'exercice (année de référence — STORY-355,
  non livrée) ni la connaissance des artefacts packagés (propriété de `balance-service`/`bilan-service`,
  dont dupliquer le registre romprait la source unique de vérité `D-078-2`). Résoudre un identifiant de
  paquet fiscal ici serait une donnée **non sourcée**, exactement ce que NFR-A06 interdit. Reste au module
  Fiscalité / à STORY-236 (bloc E) de le consommer depuis son propre registre, en le confrontant au
  `referentielComptable` que cette story expose.
- **La table de passage et le gabarit de liasse.** Artefacts versionnés du référentiel comptable
  (propriété de `bilan-service`/`platform-catalog-service`), pas une donnée du dossier — `referentielComptable`
  leur sert de clé de résolution, il ne les embarque pas.
- **La route de modification de l'identité du dossier** (dont `typeEntite`). Aucune n'existe dans
  `dossier-service` — confirmé en lisant `dossiers.controller.ts` avant d'écrire cette story, et
  déjà consigné comme hors périmètre par STORY-354. La créer ici déborderait largement une story de
  5 points et anticiperait une story qui n'est encore ni cadrée ni sprintée.
- **La restriction du champ `pays` à un jeu de pays supportés.** Tentante (seul `TG` est aujourd'hui
  packagé côté paquet fiscal), mais c'est le terrain de **STORY-302** (« durcir l'invariant mono-pays
  D10 ») — l'ouvrir ici créerait un chevauchement de périmètre entre les deux stories réancrées.
- **Le choix `SN`/`SMT` au sein de la famille `SYSCOHADA`.** C'est l'axe `systemeComptable`, daté par
  exercice par **STORY-303** — hors de cette résolution, qui s'arrête à la famille.

---

## Acceptance Criteria

- [x] Un dossier `ENTREPRISE` expose `referentielComptable: 'SYSCOHADA'` en lecture (`POST` et `GET`).
- [x] Un dossier `MICROFINANCE` expose `referentielComptable: 'SFD-BCEAO'`.
- [x] Un dossier `ASSURANCE` expose `referentielComptable: 'CIMA'`.
- [x] `referentielComptable` n'est **acceptable dans aucun corps de requête** — un client qui tente de le
      poser à la création reçoit `400` (whitelist stricte, comme `estLeCabinet`/`statut`/`version`).
- [x] La résolution est **exhaustive à la compilation** : un test canari échoue si `TypeEntite` porte une
      valeur que le `switch` ne couvre pas.
- [x] Aucune route ne permet de modifier `typeEntite` d'un dossier existant (`PATCH`/`PUT` sur l'identité
      → `404` de routage, comme pour `DELETE`).

---

## Notes techniques

```ts
export enum ReferentielComptable {
  SYSCOHADA = 'SYSCOHADA',
  SFD_BCEAO = 'SFD-BCEAO',
  CIMA = 'CIMA',
}

export function resoudreReferentielComptable(
  typeEntite: TypeEntite,
): ReferentielComptable {
  switch (typeEntite) {
    case TypeEntite.ENTREPRISE:
      return ReferentielComptable.SYSCOHADA;
    case TypeEntite.MICROFINANCE:
      return ReferentielComptable.SFD_BCEAO;
    case TypeEntite.ASSURANCE:
      return ReferentielComptable.CIMA;
  }
}
```

- Granularité **volontairement plus grossière** que `REFERENTIELS_BALANCE` de `balance-service`
  (`SN | SMT | SFD-BCEAO | CIMA`) : `SN`/`SMT` sont deux variantes de la famille `SYSCOHADA`, choisies par
  l'axe `systemeComptable` (STORY-303), pas par `typeEntite`.
- Calculé à la **lecture** (`DossierResponseDto.depuisDocument`), jamais persisté : aucune migration à
  rejouer si la table de correspondance D7 évolue.

---

## Dépendances

**Prérequise :** **STORY-301** *(porte `typeEntite`, dont cette story dérive la résolution)*.
**Consommée par (futures) :** **STORY-236** *(`balance-service` re-scopé sur `dossierId` — validera le
`referentiel` soumis contre `referentielComptable`)*.

---

## Definition of Done

- [x] Lint 0 · build OK · couverture ≥ seuils.
- [x] Unit : les 3 correspondances D7, canari d'exhaustivité.
- [x] e2e : `referentielComptable` exposé et correct par `typeEntite`, refusé en écriture, absence de
      route de modification de l'identité.
- [ ] `/code-review`.

---

## Story Points Breakdown

- Résolution exhaustive + enum : 1 pt
- Câblage `DossierResponseDto` (lecture seule, jamais stocké) : 0,5 pt
- Garde Q3 par absence de route + test + documentation du hook inerte : 1 pt
- Tests (unit + e2e, canari d'exhaustivité) : 1,5 pt
- Analyse de périmètre (D7 vs D-078-1, chevauchement STORY-302/303/236) : 1 pt
- **Total : 5 points**

---

## Progress Tracking

| Phase | État | Note |
|---|---|---|
| Rédaction | ✅ | branche `docs/MNV-304-referentiel-fiscal` |
| Développement | ✅ | branche `MNV-304-referentiel-comptable` |
| Validation (DoD) | ✅ | lint 0 · build OK · **445 unit + 74 e2e** · couverture **99,38 / 94,08 / 96,79 / 99,34** |
| Mutation-tests | ✅ | **3 mutations, 3 rouges** — voir ci-dessous |
| Vérification docker | ➖ | **non applicable** : aucune écriture nouvelle en base (`referentielComptable` est calculé à la réponse, jamais persisté — le schéma `Dossier` n'est pas modifié). La DoD ne l'exige que pour les stories qui écrivent en base. |
| Revue de code | ✅ | **4 constats, 0 bloquant, tous corrigés** — voir ci-dessous |
| Revue de sécurité | ✅ | **0 vulnérabilité** ; 1 constat LOW (docstring trompeur) corrigé — voir ci-dessous |
| Clôture | ✅ | PR `prospera-dossier-service#4` rebase-mergée sur `dev` (feature f87a74b + correctifs de revue 1a1b65b + correctif de sécurité ac0a0ea) |

### Revue de sécurité — 0 vulnérabilité

Surface fonctionnelle nouvelle très restreinte (table de correspondance pure, champ dérivé en lecture
seule, aucune nouvelle route/entrée/requête Mongo) : anti-énumération intacte (le champ ne fait que
ré-encoder `typeEntite`, déjà retourné au même appelant), whitelist stricte vérifiée récursivement sur
les 3 DTO d'entrée du module, aucun chemin de mass-assignment vers `typeEntite` (les 3 écritures
existantes du service posent leurs `$set` champ par champ), aucune fuite dans les commentaires/Swagger.

**1 constat LOW retenu (confiance 85, CWE-1059, A04:2021)** : le docstring de `type-entite.enum.ts`
affirmait au **passé** que le problème d'intégrité (« rien n'empêchait de calculer une microfinance sur
le plan entreprise ») était réglé par cette story — **faux** : `balance-service` accepte toujours le
`referentiel` du client sans le croiser avec `typeEntite` (`submit-balance.dto.ts:128`). Cette story
**expose** `referentielComptable`, elle ne l'**impose** nulle part — le croisement réel touche 2 dépôts
et reste une dette ouverte (candidate : STORY-236). Corrigé : le commentaire dit maintenant explicitement
« EXPOSÉE, pas encore IMPOSÉE ».

### Revue de code — 4 constats, 0 bloquant

① titre `it.each` inversé (`referentielComptable=%s pour typeEntite=%s` alors que le tuple est
`[typeEntite, attendu]`) — un rapport CI aurait affiché les deux valeurs échangées. Corrigé, aligné sur
le format du spec unitaire. ② le commentaire Q3 du contrôleur affirmait qu'« un test e2e échoue si une
route change ce champ », alors que le test ne couvre que le **routage** `PATCH /dossiers/:id` — une
future route sous-ressource (`PATCH /dossiers/:id/identite`, le nommage le plus probable vu les routes
existantes) ne serait pas protégée. Reformulé pour ne pas sur-promettre, et le test étendu à `PUT`
également (l'AC citait les deux verbes, seul `PATCH` était testé). ③ champ `typeEntite` ajouté à
l'interface `CorpsDossier` des tests mais jamais lu depuis un corps de réponse HTTP (constat
`ponytail-review`, lentille over-engineering) — retiré. ④ la description Swagger publiée de
`referentielComptable` ne précisait pas que `SYSCOHADA` est une **famille** (le choix `SN`/`SMT` relève
de `systemeComptable`, STORY-303) — précisé, pour qu'un futur consommateur (STORY-236) ne mappe pas
`SYSCOHADA` sur `SN` par défaut.

Suite complète (lint + build + 445 unit + 75 e2e) rejouée au vert après correctifs. Commit dédié
`1a1b65b`, séparé du commit de feature.

### Ce qui a été livré

- `resoudreReferentielComptable(typeEntite)` — `Record<TypeEntite, ReferentielComptable>` littéral,
  **exhaustif à la compilation** (`TS2741` si `TypeEntite` gagne une valeur non résolue) ;
- `referentielComptable` exposé en lecture seule sur `DossierResponseDto`, calculé à
  `depuisDocument()` — jamais stocké, jamais accepté en écriture (whitelist stricte existante) ;
- garde **Q3 par absence** : aucune route ne modifie `typeEntite` — documentée sur le contrôleur,
  l'énumération et le DTO de création, et **prouvée** par mutation (ci-dessous), pas seulement
  affirmée ;
- périmètre explicitement délimité par rapport à D-078-1 (paquet fiscal, hors service) et aux stories
  sœurs STORY-302/303/236, pour éviter tout chevauchement silencieux.

### Mutations exécutées en développement — 3 mutations, 3 rouges

| # | Mutation | Test attendu au rouge | Résultat |
|---|---|---|---|
| 1 | Inversion `MICROFINANCE ↔ ASSURANCE` dans la table de résolution | `resolution-referentiel.util.spec.ts` | ✅ 2 tests rouges (`MICROFINANCE`, `ASSURANCE`) |
| 2 | `DossierResponseDto` recâblé sur une valeur figée (`SYSCOHADA`) au lieu d'appeler le résolveur | `dossiers.e2e-spec.ts` (D7) | ✅ 2 tests rouges (`MICROFINANCE`, `ASSURANCE` — `ENTREPRISE` reste vert par coïncidence, ce qui confirme que le test discrimine bien la vraie résolution) |
| 3 | Ajout temporaire d'une route `PATCH /dossiers/:id` (pas de logique métier, juste l'existence de la route) | `dossiers.e2e-spec.ts` (Q3) | ✅ 1 test rouge — la garde par absence est bien **vérifiée**, pas seulement vraie par accident |

Les trois mutations ont été restaurées après confirmation ; la suite complète (lint + build + 445 unit
+ 74 e2e) a été rejouée au vert après restauration.
