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

## ⚡ RÉANCRÉ le 2026-08-15 après la clôture de STORY-356

> ⚠️ **La première rédaction de cette story disait « `dossierId` n'apparaît que dans le read-model
> d'exercice ». C'EST PÉRIMÉ.** `STORY-356` a été livrée le même jour, sur 3 dépôts.

**Ce que STORY-356 a livré** (vérifié dans `balance-service@dev`) : `dossierId` est porté par
**9 schémas** du service, **`required: true` au schéma**, plus les read-models `dossiers_dossier` et un
script de migration idempotent avec marche arrière.

> ⛔ **ET C'EST PRÉCISÉMENT CE QUI REND CETTE STORY URGENTE.** L'arbitrage PO d'`AC-4` a été livré **à
> la lettre** : le schéma **exige** `dossierId`, et **aucun chemin d'écriture ne le pose** ⇒
> **LES ÉCRITURES DE L'ATELIER SONT GELÉES** jusqu'à la clôture de **`STORY-236`** et de celle-ci.
>
> ⇒ **Cette story ne prépare plus une amélioration : elle DÉGÈLE le service.**

⚠️ **Et la DoD de STORY-356 est laissée volontairement DÉCOCHÉE sur un point** : le parcours
Atelier→Bilan **en écriture** est *« NON VÉRIFIABLE »* là-bas — *« invisible aux 3646 tests, qui mockent
TOUS la couche données »*. **Il est à rejouer ici**, en réel.

## Le constat, re-vérifié dans `balance-service@dev` le 2026-08-15

Le champ existe partout ; **rien ne s'en sert**. Autour de la balance, trois mécanismes restent keyés
`orgId` — **les trois index et filtres sont INCHANGÉS par STORY-356** :

| Mécanisme | État vérifié dans `@dev` | Ce que ça impose |
| --- | --- | --- |
| `ExerciceAtelierSchema.index({ orgId, bornes }, { unique: true })` | **inchangé** | ⛔ **Un seul exercice d'Atelier pour tout le cabinet**, pas un par client |
| `existeBalanceValidee(orgId, exercice, source)` | **inchangé** — sert au **gel du cahier** | ⛔ Valider la balance d'un client **gèle les cahiers de tous les autres** |
| Dépôts cahiers / ventilation / rapprochement | **inchangés**, `orgId` toujours au filtre, `dossierId` jamais | ⛔ Recettes et dépenses de **tous les clients dans un seul seau** |

⚠️ **La distinction à tenir** : `STORY-356` a rempli **la donnée** ; elle n'a touché **ni un index, ni
un filtre**. *Rattacher sans filtrer ne change rien de visible* — c'est exactement le partage de
périmètre annoncé, et c'est ce qui reste à faire.

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
- [ ] ⚡ **Les écritures sont DÉGELÉES** : un parcours Atelier→Bilan **en écriture réelle** passe de bout
      en bout. ⚠️ C'est la case que `STORY-356` a **laissée décochée** parce qu'elle n'était pas
      vérifiable chez elle — *« invisible aux 3646 tests, qui mockent TOUS la couche données »*. ⛔ Elle
      se coche **en docker**, pas en test unitaire.
- [ ] ⚠️ **Le sort de la marche arrière est tranché.** `STORY-356` documente une limite qu'elle n'a pas
      corrigée : *« la marche arrière balance/bilan détache TOUT `dossierId` sans discriminer son
      origine — correct dans la fenêtre de migration, **à RETIRER OU BORNER à la clôture de
      236/357** »*. La fenêtre se referme ici : **retirer, borner, ou dire pourquoi on la garde.**
- [ ] ⚠️ **`AD-10` de la spine `balance-service` est mise à jour** : elle décrit la bascule comme
      *« posée et NON terminée »*. Un document ne doit pas survivre à sa propre péremption.
