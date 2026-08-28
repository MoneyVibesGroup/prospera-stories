# STORY-491 : Le manifeste d'un référentiel ne dit ni sa zone, ni ses pays, ni sa devise, ni la norme dont il dérive

Status: ready-for-dev

**Épic :** EPIC-108 — Le référentiel devient un plugin déclaré (zone, pays, devise, norme)
**Service :** `bilan-service` (`ReferentielRegistry`, `scripts/referentiels/build.mjs`) + `balance-service` (manifeste)
**Points :** 5 · **Sprint :** S20
**Origine :** revue **expert-comptable** de la maquette cumulative, 2026-08-27 — *« couvrir la CEDEAO, l'Afrique de l'Est, l'Europe, voire l'Amérique »*.

---

## Le fait

L'architecture est déjà la bonne : `bilan-service` est un **moteur d'états agnostique**, toute la
sémantique vit dans un `ReferentielPackage` vérifié par checksum, et **ajouter un référentiel ne
touche pas le moteur** (invariant P7). C'est ce qui rend l'expansion possible.

Ce qui manque n'est pas le mécanisme, c'est **ce que le paquet déclare de lui-même**. Aujourd'hui un
référentiel porte un identifiant, une version, un checksum, un plan, des postes, une table de
passage. Il ne porte **ni sa zone comptable, ni les pays où il s'applique, ni sa devise de
présentation, ni la norme dont il dérive**.

Conséquences immédiates, toutes vérifiables :

1. **Rien ne peut répondre « quel référentiel pour un dossier au Ghana ? »** — la question n'a pas
   de destinataire. Le rattachement pays → référentiel n'existe que dans la tête de celui qui a
   octroyé le pack.
2. **`syscohada-revise@2.1` ne dit pas qu'il vaut pour les 17 États de l'OHADA.** Il est traité comme
   un référentiel togolais parce que le seul paquet fiscal packagé est togolais — deux choses
   différentes que rien ne sépare.
3. **Un référentiel hors OHADA ne peut pas être décrit.** Un plan IFRS for SMEs (Ghana, Nigeria,
   Sierra Leone, Liberia, Gambie, Cabo Verde — six des quinze États de la CEDEAO) n'a ni « système
   normal », ni « SMT », ni cascade SYSCOHADA. Le vocabulaire du produit suppose l'OHADA partout.

## Critères d'acceptation

- [ ] AC-1 — Le `ReferentielPackage` déclare, en `_meta` : `zoneComptable` (`OHADA` · `BCEAO-SFD` ·
      `CIMA` · `IFRS` · `IFRS-PME` · `AUTRE`), `pays[]` (codes **ISO 3166-1 alpha-2**),
      `devisePresentation` (ISO 4217, **ou `null`** si le référentiel est multi-devise),
      `normeSource` (texte + référence officielle) et `statut` (`certifie` · `amorce` ·
      `a-valider-par-expert`).
- [ ] AC-2 — `pays: []` **vide** signifie « aucun pays », jamais « tous ». ⛔ Fail-closed prouvé par
      mutation — même garde que STORY-533 AC-4.
- [ ] AC-3 — Le `build.mjs` **refuse de packager** un référentiel dont le `_meta` est incomplet. La
      garde s'exécute au build, pas au démarrage : un artefact incomplet ne doit pas exister.
- [ ] AC-4 — Les quatre référentiels existants sont renseignés depuis leurs sources, sans rien
      inventer : `syscohada-revise@2.1` (OHADA, 17 pays), `sfd-bceao@2.0` (BCEAO-SFD, 8 pays UEMOA),
      `cima-assurances@1.0` (CIMA, 14 pays), `zone-franche-togo@1.0` (OHADA, `TG`).
      ⚠️ **Aucune modification des plans, des postes ni des tables de passage** — l'ajout est
      strictement métadonnée, et la non-régression des 163 postes / 124 mappings SYSCOHADA le prouve.
- [ ] AC-5 — Une route publie le **catalogue des référentiels** avec ces métadonnées. C'est elle que
      STORY-492 interroge, et c'est elle qui permettra un jour de dire « ce pays n'est pas servi »
      au lieu de laisser un écran vide.

## Conséquences ailleurs

- Rend **STORY-492** (registre des pays) possible : sans `pays[]`, il n'y a rien à indexer.
- ⚡ **Ne coûte rien aujourd'hui et devient impayable plus tard** : renseigner quatre `_meta` sur
  quatre artefacts est une journée ; le faire sur vingt référentiels déjà consommés par des liasses
  figées est une migration d'artefacts avec re-checksum et invalidation de snapshots.

## Notes

- Voir `analyse-referentiels-sfd-zonefranche-cima-2026-07-21.md` (les trois paquets et leurs
  sources), [[STORY-121]], [[STORY-122]], [[STORY-368]] (byte-identité inter-dépôts).
