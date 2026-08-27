# STORY-476 : Deux scénarios assis sur deux snapshots différents sont comparés, et la réponse est 200

Status: ready-for-dev

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 5 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
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
