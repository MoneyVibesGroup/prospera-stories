# STORY-367 : L'Atelier cesse d'être mono-société — le gel, les cahiers et l'exercice se scopent au dossier

Status: not_started

**Epic :** EPIC-043 — Dossier client
**Points :** 5 · **Sprint :** 20 (backend) · **Service :** `balance-service` (`:3007`)
**Décision :** **AD-P13** et **AD-P14** — `architecture-prospera-ecosystem` v1.4 · **AD-10** de
`architecture-balance-service-2026-08-15`
**Dépendances :** ⛔ **STORY-356** *(migration — elle rattache les 6 collections)* · ⛔ **STORY-236**
*(le contrat de balance porte `dossierId` — **EN COURS**)*
**Bloque :** **`EPIC-081`** *(`stock-service`, 1ᵉʳ contributeur externe portant `dossierId` de bout en
bout)*

---

## ⚠️ Frontière avec STORY-236, à confirmer avec la personne qui la fait

**`STORY-236` porte LE CONTRAT** : `dossierId` sur `Balance`, la clé unique, les routes.

**Cette story porte LA PORTÉE EFFECTIVE** — tout ce qui, autour de la balance, reste keyé `orgId` et
maintient l'Atelier mono-société même une fois le contrat corrigé.

> ⛔ **Aucune ligne de cette story ne touche le schéma `Balance` ni sa clé unique.** Si `STORY-236`
> couvre déjà l'un des points ci-dessous, il en sort — la frontière se règle à l'ouverture, pas à la
> revue.

## Le constat, vérifié dans le code le 2026-08-15

`dossierId` n'apparaît **que** dans le read-model d'exercice posé par STORY-355 — **que personne ne
lit**. Autour de la balance, trois mécanismes restent keyés `orgId` :

| Mécanisme | État vérifié | Ce que ça impose |
| --- | --- | --- |
| `ExerciceAtelier` | *« une ligne par `(orgId, exercice)` »*, index `(orgId, bornes)` | ⛔ **Un seul exercice d'Atelier pour tout le cabinet**, pas un par client |
| `existeBalanceValidee(orgId, exercice, source)` | Sert au **gel du cahier** | ⛔ Valider la balance d'un client **gèle les cahiers de tous les autres** |
| Dépôts cahiers / ventilation / rapprochement | **org-scopés**, `orgId` toujours au filtre | ⛔ Recettes et dépenses de **tous les clients dans un seul seau** |

> ⚡ **Corriger le contrat de balance sans corriger ceci laisse l'Atelier mono-société.** La balance
> saurait de quel dossier elle parle, et tout ce qui l'entoure continuerait de l'ignorer — **le vertical
> cabinet est en production**.

## Ce que la story livre

### ① `ExerciceAtelier` se rebranche sur le read-model

- ⚡ **`AD-P14` l'exige** : `balance-service` **cesse d'être source de vérité sur le statut** de
  l'exercice et lit `exercices_dossier`, alimenté par `dossier.exercice.ouvert|clos|rouvert`.
- ⚠️ **C'est ici que la double écriture se referme.** Tant que ce n'est pas fait, *« il existe deux
  écritures possibles pour un même fait »* — l'écart que le réancrage qualifie de **plus dangereux du
  système à cette date**.
- ⛔ **La projection décide d'après le champ `statut`, jamais d'après le nom du topic.** Oublier
  `rouvert` — le plus récent des trois — figerait le read-model sur `CLOS`, et **l'Atelier refuserait
  une saisie pourtant autorisée**. Le piège est **déjà documenté** dans
  `bilan-service/src/kafka/events/exercice-events.ts` ; le reproduire ici serait impardonnable.
- ⛔ **`ExerciceAtelier` n'est pas SUPPRIMÉ, il est rebranché.** Le supprimer laisserait le service
  aveugle entre deux stories — ce qu'`AD-P14` interdit explicitement.

### ② Le gel du cahier ne franchit plus le dossier

- **`existeBalanceValidee` devient scopée au dossier.** Sinon la validation d'**une** balance bloque la
  saisie de **tout le portefeuille**.
- ⚠️ **L'exclusion `A_NOUVEAUX` reste en place** (`AD-2`, `D-082-3`) : *un socle d'ouverture n'est pas
  « la balance que le cahier justifie »*, et le laisser geler l'exercice qu'il vient d'ouvrir rendrait
  la saisie impossible **dès le premier jour**. La scoper au dossier ne doit pas la faire disparaître.

### ③ Les dépôts filtrent sur `(orgId, dossierId)`

- Cahiers de recettes et de dépenses, comptes de ventilation, catégories, surcharges de rattachement,
  rapprochements.
- ⚠️ **`STORY-356` RATTACHE les 6 collections ; celle-ci FILTRE dessus.** Les deux sont nécessaires :
  **rattacher sans filtrer ne change rien de visible**, et c'est précisément le genre de demi-livraison
  qui se déclare faite.
- ⛔ **Un `dossierId` hors portée rend `404`, jamais `403`** — le service refuse de révéler l'existence
  du dossier (`AD-P13`).

### ④ Le hub refuse une soumission sans dossier, et ne devine jamais

- Un `balance.submitted` **sans `dossierId`** est **rejeté avec un `motifCode` stable**, tracé au
  journal d'ingestion — qui journalise **les deux issues** (`AD-9`).
- ⛔ **JAMAIS de repli sur « Mon cabinet ».** Un défaut implicite rattacherait la balance d'un client au
  dossier du cabinet : **un chiffre juste, sur la mauvaise société**, et rien ne le signalerait.
- ⚡ **`stock-service` est le premier contributeur externe concerné** : il porte `dossierId` de bout en
  bout (`AD-6`) et publiera au hub (`AD-7`). **`EPIC-081` suppose ce refus en place.**

## Critères d'acceptation

- **Étant donné** une balance **validée** sur le dossier A **quand** un collaborateur saisit au cahier
  du dossier B **alors** **la saisie reste possible**. ⚡ C'est le cœur de la story.
- **Étant donné** deux dossiers d'un même cabinet **quand** chacun ouvre son exercice **alors** **les
  deux coexistent** — il n'y a plus « un exercice d'Atelier par organisation ».
- **Étant donné** un exercice **rouvert** dans `dossier-service` **quand** l'Atelier consulte son statut
  **alors** il le voit **rouvert**, et le test porte **sur le topic `rouvert`**, pas seulement sur
  `ouvert`/`clos`.
- **Étant donné** un `dossierId` **hors portée** **quand** l'appelant demande un cahier ou un exercice
  **alors** la réponse est **`404`**, jamais `403`.
- **Étant donné** un socle d'à-nouveaux **quand** il est déposé **alors** il **ne gèle toujours pas** le
  cahier de son propre dossier — l'exclusion `A_NOUVEAUX` survit au changement de portée.
- **Étant donné** un `balance.submitted` **sans `dossierId`** **quand** le hub le traite **alors** il
  est **rejeté et journalisé**, et ⛔ **jamais rattaché à « Mon cabinet »**.

## Ce que cette story ne fait PAS

- ⛔ Elle **ne touche pas au schéma `Balance` ni à sa clé unique** — c'est **`STORY-236`**, **en cours**.
- ⛔ Elle **ne migre aucune donnée** : `STORY-356` rattache, elle exploite. Filtrer sur un champ que la
  migration n'a pas rempli produirait des `404` sur tout l'historique.
- ⛔ Elle ne scope ni `bilan-service` (`STORY-357`) ni `document-service` (`STORY-358`).
- ⛔ Elle ne supprime pas `ExerciceAtelier`.

## Definition of Done

- [ ] **Mutation-test du gel** : remettre `existeBalanceValidee` en portée organisation ⇒ le test « le
      cahier du dossier B reste saisissable » **vire au rouge**. Sans lui, la règle centrale n'est
      tenue par rien.
- [ ] Deux dossiers portent **deux exercices d'Atelier distincts** aux mêmes bornes.
- [ ] La projection d'exercice est vérifiée **sur les trois topics**, `rouvert` compris.
- [ ] Aucun dépôt de cahier, de ventilation ou de rapprochement n'accepte une requête **sans
      `dossierId`**.
- [ ] Un `balance.submitted` sans dossier laisse **une trace de rejet motivée**.
- [ ] ⚠️ **`AD-10` de la spine `balance-service` est mise à jour** : elle décrit la bascule comme
      *« posée et NON terminée »*. Un document ne doit pas survivre à sa propre péremption.
