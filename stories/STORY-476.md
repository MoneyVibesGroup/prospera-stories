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
