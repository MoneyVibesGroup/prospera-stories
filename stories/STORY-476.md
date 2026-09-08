# STORY-476 : Deux scénarios assis sur deux snapshots différents sont comparés, et la réponse est 200

Status: in_progress

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 5 · **Complexité :** high · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-036** (projection 3 ans, trésorerie 12 mois, scénarios comparés), 2026-08-27.
Relevé en construisant le moment « bases hétérogènes » de la maquette : le refus existe, il ne se déclenche pas.

---

## Le fait

`ComparaisonService.comparer()` lève **409 `BASES_HETEROGENES`** quand les jeux d'hypothèses ne
partagent pas le même `jeuEtatsId`. Il ne regarde **que** ce champ.

Or deux jeux peuvent partager le même jeu d'états et s'appuyer sur **deux snapshots différents** de ce
jeu d'états — c'est le cas normal dès qu'une liasse est **rouverte puis refigée**, geste ordinaire de
cabinet que FE-034 modélise explicitement. Le service le détecte (`versions.length === 1 && memeJeuEtatsId`),
le publie (`baseHomogene: false`, `versionsSnapshotEnPresence: [1, 2]`) — **et répond 200 avec tous les
chiffres** : trois exercices, tous les écarts, tous les indicateurs mensuels, calculés sur **deux
bilans différents**.

Sur le dossier de démonstration, la v1 porte un total actif de **5 620 000** et un résultat de
**120 000** ; la v2, **5 700 000** et **200 000** (le compte 476200 reclassé). L'écart d'ancrage est de
80 000 F — petit en valeur absolue, mais il déplace l'ancre des emplois durables, donc **toute la
cascade du bilan prévisionnel des trois exercices**.

Un consommateur qui n'inspecte pas ce booléen trace un graphique parfaitement lisible et parfaitement
faux. C'est **STORY-465** (le `POST` de duplication qui recapture le dernier snapshot) devenue
observable : l'écart n'était qu'un risque tant qu'on ne comparait pas.

## Critères d'acceptation

- [ ] AC-1 — La garde `BASES_HETEROGENES` porte sur le couple `(jeuEtatsId, base.version)`, pas sur
      `jeuEtatsId` seul. Deux versions de snapshot en présence ⇒ **409**, avec les versions nommées
      dans la charge d'erreur.
- [ ] AC-2 — Un paramètre explicite `?autoriserBasesHeterogenes=true` permet de forcer la comparaison
      pour un usage d'analyse — la réponse conserve alors `baseHomogene: false` **et** ajoute un
      `avertissements: []` structuré. Le défaut est le **refus**.
- [ ] AC-3 — `baseHomogene` reste publié dans tous les cas : un client qui l'ignore ne doit plus
      pouvoir obtenir de chiffres hétérogènes sans l'avoir demandé.
- [ ] AC-4 — Test : deux jeux, même `jeuEtatsId`, snapshots v1 et v2 ⇒ 409 ; avec le paramètre ⇒ 200 +
      avertissement.

## Conséquences ailleurs

- **STORY-465** (rebasage) reste la vraie réparation : tant qu'un jeu ne peut pas être rebasé, le
  409 transforme un résultat faux en cul-de-sac. Les deux stories doivent être livrées **ensemble**,
  sinon on remplace un mensonge par un blocage.

---

## Progress Tracking

**Statut : in_progress** — ouverte le 2026-09-08, branche `MNV-476`.

### Prémisses vérifiées AVANT d'écrire

**Exactes, les deux.** `ComparaisonService.comparer()` compare `base.jeuEtatsId` et **rien
d'autre** avant de lever le 409 ; la divergence de version est calculée deux lignes plus bas
(`versions.length === 1 && memeJeuEtatsId`), publiée sous `baseHomogene` et
`versionsSnapshotEnPresence`, et **la réponse part quand même en 200 avec tous les chiffres**.

**Le préalable de la fiche est levé** : STORY-465 est clôturée, `POST …/hypotheses/:id/rebaser`
existe et publie la fraîcheur de la base. Le 409 de cette story n'est donc pas un cul-de-sac —
l'utilisateur a le geste qui le referme.

⚠️ **Une prémisse implicite de l'AC-1 est FAUSSE, et c'est D-476-1** : « le couple
`(jeuEtatsId, base.version)` » suppose que `base.version` désigne à elle seule le snapshot. Elle
est une **copie** posée dans le jeu d'hypothèses à la capture, pas une lecture du snapshot.

### Décisions de conception

- **D-476-1 — La garde porte sur `(jeuEtatsId, snapshotId, base.version)`, pas sur le seul couple
  de l'AC-1.** L'index unique `(tenantId, jeuEtatsId, version)` de `snapshots_liasse` garantit que
  deux **versions** distinctes sont deux snapshots distincts — mais **pas la réciproque** :
  `base.version` est recopiée dans le jeu d'hypothèses à l'instant de la capture, et deux
  `snapshotId` différents portant la même valeur recopiée franchiraient une garde qui ne regarde
  que la version. Deux jeux ne sont sur la même base que si **les trois** coïncident. La garde
  couvre l'AC-1 et un cas de plus, jamais un de moins.
- **D-476-2 — Le refus est le DÉFAUT, et l'autorisation est explicite ET stricte** (AC-2). Seule la
  valeur `true` ouvre la porte ; toute autre valeur rend **400**, jamais un « truthy ».
  ⚠️ Le service tourne avec `enableImplicitConversion: true` : un champ déclaré `boolean` sans
  transformation stricte accepterait n'importe quelle chaîne comme vraie — la garde s'ouvrirait sur
  une faute de frappe. Le paramètre est donc transformé à la main et validé `@IsBoolean()`.
- **D-476-3 — `avertissements` est publié TOUJOURS, vide quand il n'y a rien à dire.** Un champ qui
  n'apparaît que dans le cas dégradé oblige le client à distinguer « absent » de « vide » — et c'est
  très exactement l'erreur que cette story répare : un consommateur qui n'inspecte pas le champ
  trace un graphique faux. Un tableau toujours présent se lit d'une seule manière.
- **D-476-4 — Le 409 NOMME les versions en présence dans sa charge d'erreur** (AC-1). Un refus qui
  ne dit pas *quelles* bases divergent laisse l'utilisateur sans le geste de reprise : c'est le
  `POST …/hypotheses/:id/rebaser` de STORY-465 qu'il doit viser, et il lui faut savoir sur quel jeu.
- **D-476-5 — 🪝 Hook inerte pour STORY-477.** `avertissements` est un tableau de
  `{ code, message, details }` avec un énuméré de codes ouvert : STORY-477 (jeux aux paramètres
  identiques) y ajoutera son code sans toucher au contrat. Rien d'autre n'est posé d'avance.

### Livré

La garde `BASES_HETEROGENES` porte désormais sur `(jeuEtatsId, snapshotId, base.version)`,
`?autoriserBasesHeterogenes=true` la force pour un usage d'analyse, et `avertissements[]` est
publié dans **tous** les cas. Aucune écriture en base : la story ne déplace qu'une lecture.

### Portes

Lint 0 · build OK · **2 292** essais unitaires · **700** e2e · couverture 99 / 94,55 / 99,3 / 99,05 ·
**8 mutations volontaires, dont 2 VERTES au premier tour** — les deux ont été corrigées, cf. ci-dessous.

### ⚡⚡ Deux gardes VACANTES, révélées par la mutation

**⚡⚡ La garde de VERSION n'était gardée par RIEN (M1).** Retirer `versions.length === 1` de
`baseHomogene` laissait **toute la batterie et les 700 e2e au vert**. Cause : ma fixture de l'AC-1
faisait diverger **à la fois** le `snapshotId` **et** la version, si bien que la garde de snapshot
suffisait à la couvrir. Les deux conditions gardent pourtant **deux cas différents** — et seul
« deux versions recopiées pour un **même** snapshot » discrimine la première, c'est-à-dire un jeu
dont la copie de `base.version` a **désynchronisé**. C'était exactement la fixture de l'essai
d'origine de la story, que j'avais remplacée en la croyant équivalente. Essai ajouté.

**⛔⛔ La batterie e2e mesurait un `ValidationPipe` QUI N'EXISTE PAS EN PRODUCTION (M3).** Retirer
`@Type(() => String)` du DTO — la seule défense contre la conversion implicite — laissait l'essai
« ni `true` ni `false` ⇒ 400 » au **vert**. Cause : le pipe de `bilan-comparaison.e2e-spec.ts`
omettait `transformOptions: { enableImplicitConversion: true }`, que `main.ts` pose et que **cinq
autres** batteries e2e du dépôt posent déjà (`bilan-jeu-etats`, `bilan-hypotheses`, `bilan-export`,
`bilan-audit`, `mapping-overrides`). Le mécanisme contre lequel le `@Type` protège n'était donc
jamais activé. Pipe aligné ⇒ la mutation vire **rouge sur deux essais**, et la démonstration tient :
sans `@Type`, `class-transformer` applique `Boolean(value)` **avant** tout `@Transform`
(`applyCustomTransformations` est appelé **après** `transform()`), donc `'oui'` **et** `'false'`
arrivent à `true` et la porte s'ouvre sur une faute de frappe.

⚠️ **Quinze autres batteries e2e du dépôt ont le même écart de pipe** — hors périmètre de cette
story, mais tout filet qu'elles opposent au `ValidationPipe` mesure autre chose que la production.

### ⛔⛔ La charge d'erreur du 409 n'arrivait pas au client

`AllExceptionsFilter` **reconstruit** le corps : il ne recopie que `message`, `code` et `details`
(le point d'extension ouvert par STORY-464), et **jette en silence** tout autre champ posé sur la
charge d'une `HttpException`. Écrits à la racine, `versionsSnapshotEnPresence` et
`hypothesesIdsARebaser` — le cœur de l'AC-1 — disparaissaient du 409, **sans erreur nulle part**.
⚠️ **L'unitaire restait vert** : il inspecte l'exception, pas la réponse HTTP. C'est l'e2e qui l'a
montré, exactement le piège que le docstring du filtre décrit.

### Vérification en réel (docker)

Stack réelle, organisation neuve, **deux snapshots d'un même jeu d'états** (v1 et v2) et trois jeux
d'hypothèses semés en base, aux **paramètres identiques** :

| Cas | Appel | Résultat |
|---|---|---|
| A | v1 + v2, sans paramètre | **409** `BASES_HETEROGENES`, `details.versionsSnapshotEnPresence = [1, 2]`, `details.hypothesesIdsARebaser` = le seul jeu sur la v1 |
| B | v2 + v2 | **200**, `baseHomogene: true`, `avertissements: []` |
| C | v1 + v2, `?autoriserBasesHeterogenes=true` | **200**, `baseHomogene: false`, un avertissement `BASES_HETEROGENES` nommant le jeu à rebaser |
| D | `?autoriserBasesHeterogenes=oui` | **400** « must be a boolean value » |
| E | `?autoriserBasesHeterogenes=false` | **409**, comme l'absence |

⚡⚡ **Le cas C démontre le défaut que la story ferme, chiffres à l'appui.** Les deux scénarios
portent des paramètres **identiques** (`parametresDivergents: []`) et rendent pourtant **17 685 000**
contre **18 360 000** de produits en N+1, **130 275** contre **140 400** de résultat — un écart
publié de **675 000** que *rien dans la réponse* n'imputait à la base avant cette story.

⚠️ **Première mesure NON concluante, et je la consigne** : j'avais d'abord fait diverger les deux
snapshots sur `totalActifN` et `resultatNetN`. Les deux scénarios sont sortis **au chiffre près
identiques** — ces deux champs-là n'entrent pas dans les mesures que la comparaison publie. Une
mesure ne prouve que ce qu'elle **interroge** : c'est `totalProduitsN` qui porte la cascade, et la
démonstration ci-dessus est celle-là.

### Hors périmètre, corrigé quand même

`dev` portait **une erreur de lint** (`no-base-to-string` sur `parametres-divergents.ts`, héritée
de STORY-474) qui empêchait la porte « lint 0 warning ». Corrigée au minimum : `String(v)` sur un
objet rend `'[object Object]'`, donc **deux objets différents s'y comparent égaux** et une
divergence de paramètre serait silencieusement masquée. Aucun paramètre d'hypothèses n'est
aujourd'hui un objet nu — le cas est défensif, mais la règle a raison sur le fond.
