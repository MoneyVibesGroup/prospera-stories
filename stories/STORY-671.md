# STORY-671 : Le plan CIMA est transcrit en entier — 1 052 comptes, pas 80

Status: ready-for-dev

**Complexité :** high

**Épic :** EPIC-128 — Socle vertical CIMA
**Service :** `bilan-service` (source des octets) + `balance-service` + `assurance-service`
**Points :** 13 · **Sprint :** S20
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

## Trois pièges relevés pendant la mesure — à ne pas redécouvrir

1. ⚡⚡ **Le Code se contredit sur la profondeur.** L'**article 430** nomme les niveaux et s'arrête
   aux « sous-comptes (quatre chiffres) » ; l'**article 431** énumère **129 comptes à 5 chiffres**
   (`01010`, `20480`, `69091`…). Et contrairement au RCSFD BCEAO, le Code CIMA **n'a aucune clause
   d'ouverture** (ni « liste non limitative », ni droit général de subdiviser) — la seule latitude
   vise nominativement le compte `08` (art. 432, « selon les besoins »). ⇒ Transcrire **ce que
   l'art. 431 énumère**, sans compléter ni plafonner.
2. ⚠️ **`6126` est une coquille de la page officielle pour `6026`.** La liste imprime
   `6126. Frais accessoires` en classe 6, sous `602`. L'**article 432 tranche trois fois** :
   « sous-comptes 6020 et 6026 », « par le débit des comptes 6020 et 6026 », « comptabilisés au
   compte 6026 ». ⇒ Transcrire **`6026`**, et l'écrire dans le commentaire du build.
3. ⚠️ **`6905` est imprimé sans son point** (`6905 Acceptations dommages, RC et risques divers`, sous
   `690`). Un parseur sur `^\d+\.` le **perd en silence** — c'est exactement le mode de panne de la
   troncature SFD. L'art. 432 confirme son existence (« 602, 604, 605, 606, 6902, 6904, 6905 »).

⇒ **Le compte cible est 1 052**, `6026` retenu contre `6126`, `6905` inclus.

## Critères d'acceptation

- [ ] AC-1 — Les **1 052 comptes** de l'article 431 sont transcrits, aux **quatre** niveaux (2, 3, 4
      et 5 chiffres), avec leurs **libellés officiels intégraux**. La source est la page de l'article,
      pas le README du dépôt, pas l'artefact `@1.0`.
- [ ] AC-2 — Les **26 libellés abrégés** sont rétablis dans leur forme officielle. Un test les nomme
      un par un : un libellé re-raccourci doit rougir.
- [ ] AC-3 — ⛔ **Nouvelle version `cima-assurances@1.1`** — les octets changent, donc la version
      change, le checksum aussi, et **les trois dépôts** sont recopiés dans le **même** lot de PR
      (`bilan-service` produit, `balance-service` et `assurance-service` recopient). La garde de
      byte-identité doit passer sur les trois.
- [ ] AC-4 — ⚠️ **La table de passage est revue à la profondeur ajoutée.** Elle rattache aujourd'hui
      des postes à des racines à 2 chiffres ; avec 972 comptes de plus, un poste peut se mettre à
      capter des comptes qu'il ne captait pas. Le test « plan ⊇ préfixes de la table » ne suffit pas :
      il faut mesurer, poste par poste, que l'assiette ne change pas **sans qu'on l'ait voulu**.
- [ ] AC-5 — `05` : soit la racine est **retrouvée dans une source officielle** et transcrite
      verbatim, soit elle reste **déduite** et l'artefact le dit. La page en ligne imprime ses quatre
      enfants (`050`, `052`, `057`, `059`) et **pas** la racine.
- [ ] AC-6 — ⚠️ **`longueurCompteDetail` reste à 5** (STORY-512, D-512-1) : la transcription **confirme**
      la valeur, elle ne la change pas. Si le dépouillement exhaustif trouve un compte à 6 chiffres,
      c'est un constat à remonter, pas une valeur à ajuster en silence.
- [ ] AC-7 — Le `statut` de l'artefact reste `amorce` : compléter le **plan de comptes** ne valide ni
      la **liasse** ni les **provisions techniques** (AD-12). Ce qui change, c'est la `miseEnGarde` —
      elle ne peut plus dire que le plan est allégé.

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
