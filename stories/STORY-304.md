# STORY-304 : Résolution conjointe type d'entité → référentiel comptable, combinaison incohérente refusée

**Epic :** EPIC-043 — Dossier client, unité de travail du cabinet
**Réf. :** ticket `TICKET-BACKEND-dossier-client-entite-de-premier-rang.md` — bloc **C** · décision **D7** · question **Q3** *(tranchée)*
**Priorité :** Must Have
**Story Points :** 5
**Statut :** 🚧 En cours
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

- [ ] Un dossier `ENTREPRISE` expose `referentielComptable: 'SYSCOHADA'` en lecture (`POST` et `GET`).
- [ ] Un dossier `MICROFINANCE` expose `referentielComptable: 'SFD-BCEAO'`.
- [ ] Un dossier `ASSURANCE` expose `referentielComptable: 'CIMA'`.
- [ ] `referentielComptable` n'est **acceptable dans aucun corps de requête** — un client qui tente de le
      poser à la création reçoit `400` (whitelist stricte, comme `estLeCabinet`/`statut`/`version`).
- [ ] La résolution est **exhaustive à la compilation** : un test canari échoue si `TypeEntite` porte une
      valeur que le `switch` ne couvre pas.
- [ ] Aucune route ne permet de modifier `typeEntite` d'un dossier existant (`PATCH`/`PUT` sur l'identité
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

- [ ] Lint 0 · build OK · couverture ≥ seuils.
- [ ] Unit : les 3 correspondances D7, canari d'exhaustivité.
- [ ] e2e : `referentielComptable` exposé et correct par `typeEntite`, refusé en écriture, absence de
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
| Développement | ✅ | branche `MNV-304` |
| Validation (DoD) | ⏳ | |
| Vérification docker | ⏳ | pas d'écriture nouvelle en base — à confirmer (champ calculé, non persisté) |
| Revue de code | ⏳ | |
| Revue de sécurité | ⏳ | |
| Clôture | ⏳ | |
