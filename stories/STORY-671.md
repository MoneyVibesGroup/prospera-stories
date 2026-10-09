# STORY-671 : Le plan CIMA est transcrit en entier — 1 052 comptes, pas 80

Status: done

**Complexité :** high

**Épic :** EPIC-128 — Socle vertical CIMA
**Service :** `bilan-service` (source des octets) + `balance-service` + `assurance-service`
**Points :** 13 · **Sprint :** S20
**Assigné à :** vivianMoneyVibesGroupes
**Prérequis :** **STORY-512** (le niveau de détail est déclaré et sourcé)
**Origine :** ⚡ **mesure de l'AC-3 de STORY-512**, 2026-09-20 — recoupement de l'artefact contre la
page officielle de l'article 431.

---

## Le fait, mesuré contre le texte

`cima-assurances@1.0` porte **80 comptes, tous à 2 chiffres**, et son en-tête annonce « comptes
principaux à 2 chiffres, libellés **verbatim** ». Le dépouillement de la page officielle de
l'article 431 (Code CIMA 2019, *modifié par décision du Conseil des Ministres du 20 avril 1995*) dit
autre chose :

| Longueur | Article 431 | Artefact `@1.0` |
|---|---|---|
| 2 chiffres | **79** | **80** (les 79 + `05`, déduit de ses enfants) |
| 3 chiffres | **345** | 0 |
| 4 chiffres | **499** | 0 |
| 5 chiffres | **129** | 0 |
| **Total** | **1 052** | **80** |

Et sur les 79 comptes communs, **26 libellés sur 79 sont abrégés** — pas raccourcis pour la place :
**amputés de leur portée**.

| Compte | Artefact `@1.0` | Article 431 |
|---|---|---|
| `23` | « Valeurs mobilières et titres assimilés (affectables à la représentation) » | « …**détenus dans le pays concerné**, affectables à la représentation des engagements réglementés, **appartenant à l'entreprise et conservés par elle (autres que les titres de participation)** » |
| `31` | « Provisions techniques opérations d'assurance directe vie » | « …**dans le pays concerné** » |
| `78` | « Travaux faits par l'entreprise pour elle-même » | « …**Charges non imputables à l'exploitation de l'exercice**, dans le pays concerné » |

⛔ **« Dans le pays concerné » n'est pas du remplissage.** Le plan CIMA oppose explicitement le
national à l'étranger — `28` « Valeurs immobilisées à l'étranger », `159` « Étranger », `517` « Prêts
à l'étranger ». Un libellé qui laisse tomber la restriction fait lire un compte **national** comme un
**total**, et c'est l'expert-comptable qui le lira.

⚡ **Ce n'est pas la troncature de STORY-368.** Là-bas, le SFD avait perdu 216 comptes sur 372 **sans
que personne l'ait décidé**. Ici la limitation au niveau 2 était **assumée** (« version allégée »,
`statut: amorce`) — mais elle n'était **chiffrée nulle part** : personne ne pouvait dire qu'il
manquait 972 comptes, ni que 26 libellés étaient réécrits.

## ⛔⛔ Cette story DÉBLOQUE l'AC-2 de STORY-514 — ajouté le 2026-09-20

STORY-514 doit faire entrer la **variation de la provision pour risques en cours** au compte de
résultat. L'**art. 432** nomme les comptes porteurs (« Provisions de primes : **320**, 340, 350, 360,
3820… ») et l'**art. 431** montre qu'ils vivent à **trois et quatre chiffres** :

```
32.   Provisions techniques des opérations d'assurance directe dommages, RC et risques divers
  320.  Primes
    3200. Pour risques en cours : primes émises par anticipation
    3201. Pour risques en cours : autres primes
  325.  Sinistres          ← LE FRÈRE, sous la MÊME racine `32`
```

⇒ Tant que le plan packagé s'arrête aux racines à 2 chiffres, **aucun poste de variation ne peut être
câblé juste** : sur `32`, il capterait aussi les provisions de sinistres, les provisions mathématiques,
l'égalisation et les ristournes à payer. `RT` passerait de « ignore les provisions » à « les compte
toutes, en bloc » — **pire que le défaut d'origine, et invisible** (`CAT = CPT` reste vrai).

⚠️ **STORY-514 a donc reporté son AC-2** (sa décision D-514-7) et livre tout le reste. C'est cette
story-ci qui la débloque, et l'AC-4 ci-dessous — « mesurer l'assiette poste par poste, avant et
après » — en prend tout son sens : les 972 comptes ajoutés sont précisément ce qui permettra de
distinguer `3200` de `3250`.

## Trois pièges relevés pendant la mesure — à ne pas redécouvrir

1. ⚡⚡ **Le Code monte d'un cran à chaque article.** L'**art. 430** nomme les niveaux et s'arrête
   aux « sous-comptes (quatre chiffres) » ; l'**art. 431** énumère **129 comptes à 5 chiffres**
   (`01010`, `20480`, `69091`…) ; et l'**art. 432, classe 4**, autorise nommément **six** chiffres
   (« …il sera créé des comptes à cinq chiffres (de 40020 et 40021 à 40398 et 40399) **ou à six
   chiffres** »). ⇒ Transcrire **ce que l'art. 431 énumère**, sans compléter ni plafonner — les
   comptes à 6 chiffres de l'art. 432 ne sont pas une liste, ils sont une **autorisation** ouverte à
   l'entreprise, et ils n'ont donc rien à faire dans le paquet.
2. ⚠️ **`6126` est une coquille de la page officielle pour `6026`.** La liste imprime
   `6126. Frais accessoires` en classe 6, sous `602`. L'**article 432 tranche trois fois** :
   « sous-comptes 6020 et 6026 », « par le débit des comptes 6020 et 6026 », « comptabilisés au
   compte 6026 ». ⇒ Transcrire **`6026`**, et l'écrire dans le commentaire du build.
3. ⚠️ **`6905` est imprimé sans son point** (`6905 Acceptations dommages, RC et risques divers`, sous
   `690`). Un parseur sur `^\d+\.` le **perd en silence** — c'est exactement le mode de panne de la
   troncature SFD. L'art. 432 confirme son existence (« 602, 604, 605, 606, 6902, 6904, 6905 »).

⇒ **Le compte cible est 1 052**, `6026` retenu contre `6126`, `6905` inclus.

## Critères d'acceptation

- [x] AC-1 — Les **1 052 comptes** *(⚡ 1 053 au relevé ligne à ligne, D-671-2)* de l'article 431 sont transcrits, aux **quatre** niveaux (2, 3, 4
      et 5 chiffres), avec leurs **libellés officiels intégraux**. La source est la page de l'article,
      pas le README du dépôt, pas l'artefact `@1.0`.
- [x] AC-2 — Les **26 libellés abrégés** sont rétablis dans leur forme officielle. Un test les nomme
      un par un : un libellé re-raccourci doit rougir.
- [x] AC-3 — ⛔ **Nouvelle version du paquet** — les octets changent, donc la version
      change, le checksum aussi, et **les trois dépôts** sont recopiés dans le **même** lot de PR
      (`bilan-service` produit, `balance-service` et `assurance-service` recopient). La garde de
      byte-identité doit passer sur les trois.
- [x] AC-4 — ⚠️ **La table de passage est revue à la profondeur ajoutée.** Elle rattache aujourd'hui
      des postes à des racines à 2 chiffres ; avec 972 comptes de plus, un poste peut se mettre à
      capter des comptes qu'il ne captait pas. Le test « plan ⊇ préfixes de la table » ne suffit pas :
      il faut mesurer, poste par poste, que l'assiette ne change pas **sans qu'on l'ait voulu**.
- [x] AC-5 — `05` : soit la racine est **retrouvée dans une source officielle** et transcrite
      verbatim, soit elle reste **déduite** et l'artefact le dit. La page en ligne imprime ses quatre
      enfants (`050`, `052`, `057`, `059`) et **pas** la racine.
- [x] AC-6 — ⚠️ **`longueurCompteDetail` reste à 6** (STORY-512, D-512-1, révisé en revue) : la
      transcription **confirme** la valeur, elle ne la change pas. Le 6 ne vient pas de l'art. 431
      (qui s'arrête à 5 chiffres) mais de la clause d'ouverture de l'**art. 432, classe 4**, qui
      autorise nommément « cinq chiffres […] ou à six chiffres » pour les comptes de réassureurs.
      Si le dépouillement exhaustif trouve un compte à **sept** chiffres, c'est un constat à remonter,
      pas une valeur à ajuster en silence.
- [x] AC-7 — Le `statut` de l'artefact reste `amorce` : compléter le **plan de comptes** ne valide ni
      la **liasse** ni les **provisions techniques** (AD-12). Ce qui change, c'est la `miseEnGarde` —
      elle ne peut plus dire que le plan est allégé.

## ⚠️ Collision de version à arbitrer avant de coder

**STORY-514** (provision pour primes non acquises) exige elle aussi une **nouvelle version du
paquet** : son AC-2 fait entrer un poste de variation au compte de résultat et modifie la table de
passage de `RT`, aujourd'hui `+RP1 +RP3 +RP5 −RC1 −RC5 −RC8` — mesuré dans l'artefact le 2026-09-20.

⇒ **Les deux stories ne peuvent pas prendre `@1.1` toutes les deux.** Celle qui livre en premier la
prend ; l'autre s'aligne. Vérifier la version réellement packagée **avant** de commencer, et non en
recopiant ce document : c'est le mode de collision que le bloc `RESERVED_RANGES` de
`sprint-status.yaml` décrit pour les numéros de story, transposé aux versions d'artefact.

## Hors périmètre

- La **liasse** (postes, états C1..C25), les **provisions techniques**, le **résultat technique
  Vie/Non-Vie** : EPIC-130 à EPIC-134.
- Toute **validation actuarielle** (AD-12).
- Le niveau de détail lui-même, déjà déclaré et sourcé par STORY-512.

## Notes

- Voir [[STORY-512]] (la mesure qui a produit cette story), [[STORY-368]] (la troncature du SFD),
  [[STORY-172]], [[STORY-491]], spine AD-11.
- Source officielle : art. 431 · https://cima-afrique.org/wp-content/code-cima/fr/Article431Listedescomptes.html
- ⚠️ Le PDF consolidé cité par `docs/referentiels/README-cima-assurances.md`
  (`droit-afrique.com/upload/doc/cima/CIMA-Plan-comptable-assurances.pdf`) était **injoignable** le
  2026-09-20 : ne pas le supposer disponible au moment de transcrire.

## Décisions de développement — 2026-10-09

- **D-671-1 — Version `@6.0`, pas `@1.1`.** La collision annoncée avec STORY-514 n'a pas eu lieu :
  STORY-518 → 522 ont porté le paquet jusqu'à `@5.0` (versions MAJEURES), STORY-514 n'a pas bumpé.
  Vérifié sur le manifeste réel avant de coder, pas recopié de ce document.
- **D-671-2 — 1 053 comptes, pas 1 052.** Le cadrage dédoublonnait par numéro et perdait le **second
  `6029`** de la page. Le relevé ligne à ligne en compte 1 053 : 80 à 2 chiffres, 344 à 3, 500 à 4,
  129 à 5. Constat remonté : le chiffre-cible de l'AC-1 était faux d'une unité.
- **D-671-3 — CINQ coquilles, pas trois.** Le contrôle « tout compte a son parent au plan, dans sa
  fratrie » en fait sortir deux de plus que le cadrage, chacune tranchée par un texte ou par la seule
  place que la liste lui laisse : `6126`→`6026` (art. 432 ×3), second `6029`→`6209` (sous `620`),
  `6821`→`6281` (sous `628`, `682` inexistant), `60366`→`63066` (sous `6306`, `6036` inexistant),
  `050`→`05` (AC-5 — l'art. 432 donne la racine mot pour mot ; `03`/`05` ont la même structure).
  Les cinq sont gardées par `cima-plan-integral.spec.ts` (bilan-service).
- **D-671-4 — Postes, table de passage et racines de gestion inchangés** (AC-4). La table rattache
  par préfixe et toutes ses racines sont déjà au plan `@5.0` : un compte ajouté ne peut se faire capter
  que par un poste qui captait déjà sa racine. **Mesuré** sur les 1 053 comptes, pas supposé.
- **D-671-5 — CINQ dépôts, pas trois** (AC-3). Une version octroyable touche aussi
  `platform-catalog-service` (snapshot + pack `assurance-cima`) et `dossier-service` (miroir
  `paquets-packages.miroir.ts`, gardé par une spec de cohérence qui lit les dépôts voisins) — même
  constat que STORY-701. Sans eux, `@6.0` serait packagée et inerte.
- **D-671-6 — Bascule de la version servie.** `assurance-service` sert `@6.0` seule (patron D-518-6 :
  un octroi `@5.0` est à rejouer) ; `balance-service` accepte `@6.0` puis `@5.0` (patron STORY-677) ;
  le pack catalogue octroie `@6.0` **seule** (deux octrois ⇒ `ReferentielAmbiguError` côté bilan).
- **D-671-7 — Ponts compagnons.** `etats-cima@1.0` est ponté sur `@6.0` (la loi des états ne dépend pas
  du grain du plan). `solvabilite-cima@1.0` **reste attaché à `@5.0` seule** : ses lacunes sont
  énoncées compte par compte au grain de `@5.0`, et les ré-évaluer au grain de `@6.0` est un travail à
  part (hook inerte : le pont n'est exposé par aucune route, D-524-8).
- **D-671-8 — Hors périmètre tenu.** Le câblage de `3200`/`3201` (AC-2 de STORY-514) n'est PAS fait :
  ce paquet le rend possible, la mise en garde le nomme.

## Progress Tracking

- 2026-10-09 — ① branche `docs` `MNV-671` ; ② branches `MNV-671` sur `bilan-service`,
  `balance-service`, `assurance-service`, `platform-catalog-service`, `dossier-service`, créées et
  rebasées **avant la première ligne**.
- 2026-10-09 — ③ dev : page officielle de l'art. 431 relevée (`tmp/story-671/art431.html`), art. 432
  pour les arbitrages ; source `plan-comptable-cima-v6.json` ; `cima-assurances@6.0`
  (`19be9539…`) généré, les douze autres artefacts **byte-identiques** (rien d'autre ne bouge au
  build). Spec `cima-plan-integral.spec.ts` (44 tests : AC-1, AC-2 un par un, AC-4, AC-5, coquilles).
- 2026-10-09 — ④ portes DoD vertes sur les cinq dépôts (lint 0, build, `test:cov` au-dessus des
  seuils, e2e) : bilan 11 789 unit + 3 289 e2e · balance 5 049 + 1 788 · assurance 2 147 + 341 ·
  catalogue 867 + 202 · dossier 1 810 + 351. ⚠️ Deux e2e rouges sous charge parallèle
  (`immobilisations` balance, `dossiers` dossier-service) **verts rejoués seuls** (49/49, 136/136),
  identiques sur `dev`. **Mutations : 7, toutes rouges** — libellé `23` re-abrégé, coquille `6126`
  recopiée, `6905` perdu, second `6029` recopié, table `@6.0` qui capte `3200`, pont `CIMA` de
  balance réduit à `@6.0`, pont `etats-cima@6.0` retiré (ajoutée en revue). Sources restaurées, les
  douze autres artefacts byte-identiques. **Vérif docker non applicable** : la story ne persiste rien
  (paquet embarqué, vérifié par sha256 au chargement dans les trois services).
- 2026-10-09 — ⑤ PR : bilan-service#168, balance-service#130, assurance-service#17,
  platform-catalog-service#30, dossier-service#42.
- 2026-10-09 — ⑥ revue de code (scan opus + lentilles `pr-test-analyzer` et `silent-failure-hunter`) :
  **cinq constats non bloquants, tous corrigés** dans un commit de revue dédié — le pont
  `etats-cima@6.0` n'était exercé par aucun test (garde désormais DÉRIVÉE du manifeste) ; D-671-7
  figée par un test et le contrat du `null` de solvabilité corrigé ; le motif d'écart du catalogue
  renvoyait à un ticket front demandant encore `@5.0` (⇒ `tickets/TICKET-FRONTEND-referentiel-cima-6-0-story-671.md`) ;
  prose devenue fausse (balance, assurance, bilan) ; un test tautologique retiré. Écartés :
  `resoudreParLibelles` (aucun appelant en production), libellés plus précis (effet voulu).
- 2026-10-09 — ⑦ revue de sécurité (opus) : **aucune vulnérabilité**. Habilitation toujours au couple
  `code@version` exact ; la bascule d'assurance-service RESTREINT l'accès (octroi `@5.0` ⇒ 403,
  voulu) ; les 1 053 numéros respectent `^\d{2,5}$`, aucun libellé ne porte de contenu actif ; sha256
  identique et vérifié au chargement dans les trois copies.
- 2026-10-09 — ⑧ les cinq PR rebase-mergées sur `dev`, branches supprimées. **`done`.**
