# STORY-493 : Packager un paquet fiscal pays est un travail non reproductible — ni schéma, ni garde de complétude, ni procédure

Status: in_progress

**Épic :** EPIC-109 — Paquets fiscaux pays : gabarit, garde et procédure de sourcing
**Service :** `balance-service` (`scripts/referentiels/sources/`, `scripts/referentiels/build.mjs`,
`src/modules/referentiel/`). **Il n'existe pas de `fiscal-service`** : la fiche le nommait par anticipation.
Le paquet togolais est aujourd'hui recopié dans **quatre** emplacements de **trois** dépôts —
`balance-service` (source + asset, 20 rubriques), `dossier-service` (asset, octet pour octet identique),
`bilan-service` (source propre, 10 rubriques) et `docs/referentiels/` (16 rubriques) — voir le périmètre.
**Points :** 8 · **Complexité :** high · **Assigné à :** vivianMoneyVibesGroupes · **Sprint :** S20
**Origine :** revue **expert-comptable** de la maquette cumulative, 2026-08-27 — la question « comment ajoute-t-on le Bénin ? » n'a aujourd'hui aucune réponse écrite.

---

## Le fait

Le paquet fiscal togolais est **le meilleur artefact du programme** : types de taxes, déductibilité
**type par type**, codes de réintégration, échéances d'acomptes, plancher de MFP, plafond de TPU,
taux de retenue. Il a été construit depuis le CGI et le LPF de l'OTR, et deux erreurs de maquette ont
été attrapées **contre lui** (acomptes posés en trimestriel au lieu des dates réelles ; RSL à 10 % au
lieu de 8,75 %) — ce qui a produit la règle projet « les chiffres d'une maquette fiscale se prennent
dans le PAQUET, jamais dans le vraisemblable ».

**Et il est irreproductible.** Il n'existe ni schéma formel de ce qu'un paquet doit contenir, ni
garde qui refuse un paquet incomplet, ni procédure écrite de sourcing. Le second pays sera donc
construit de mémoire, par comparaison au premier, et ce qui manquera manquera en silence — comme les
quatre exonérations de MFP publiées en prose et jamais exposées au contrat (STORY-412), erreur que sa
propre traçabilité rendait plus difficile à mettre en doute qu'un chiffre sans provenance.

⚡ **Cette story ne livre pas un pays. Elle livre la capacité d'en livrer N.**

## Critères d'acceptation

- [ ] AC-1 — Un **schéma JSON** décrit le paquet fiscal : impôt sur le résultat (taux, minimum
      forfaitaire et ses **exonérations**), régime synthétique et son plafond, TVA (taux,
      exonérations, règles de déduction, échéances), retenues à la source, types de « autres impôts
      et taxes » avec leur **déductibilité** et leur **code de réintégration**, échéances
      déclaratives et de paiement, report déficitaire (durée et ordre d'imputation), **devise** et
      **pays**.
- [ ] AC-2 — Chaque valeur porte sa **référence légale** (texte, article, année) et l'`_meta` porte
      la loi de finances applicable. Une valeur sans référence fait **échouer le build** — c'est la
      seule garde qui empêche « vraisemblable » d'entrer.
- [ ] AC-3 — Une **garde de complétude** refuse au build un paquet dont une section obligatoire
      manque, en nommant la section. Le paquet togolais doit la passer **sans modification** ; s'il
      ne la passe pas, c'est la garde qui est fausse, et le constater est un résultat en soi.
- [ ] AC-4 — Une **procédure de sourcing** écrite (`referentiels/README-paquet-fiscal.md`) : où
      trouver le texte officiel, quoi extraire, dans quel ordre, ce qui se valide par un fiscaliste
      et ce qui ne se valide pas. Elle est rédigée **en refaisant le paquet togolais avec**, pas de
      mémoire — sinon elle décrit une méthode que personne n'a suivie.
- [ ] AC-5 — Le statut « à valider par un fiscaliste » est un **champ**, pas une note de bas de page.
      Un paquet non validé est servi avec son statut, et tout écran qui l'affiche doit pouvoir le
      dire. Un barème présenté comme certifié quand il ne l'est pas est le seul défaut de ce produit
      qui puisse coûter un redressement à un client.

## Conséquences ailleurs

- Rend chiffrable, et surtout **répétable**, l'ouverture des 7 autres pays UEMOA puis de la Guinée.
- Chaque paquet pays reste **une story à part entière avec son sourcing** : celle-ci ne les
  pré-approuve pas. On ne package pas une loi de finances par analogie.

## ⚠️ Mesuré dans le code avant de brancher (2026-09-12)

La fiche décrit **un** paquet fiscal togolais. Il y en a **trois contenus distincts**, recopiés dans
**quatre** emplacements de **trois** dépôts, et aucune garde ne les confronte :

| Emplacement | Rubriques | Rôle réel |
|---|---|---|
| `balance-service/scripts/referentiels/sources/` → `src/modules/referentiel/assets/` | **20** | artefact **autoritaire**, produit par `build.mjs`, lu par le moteur fiscal |
| `dossier-service/src/modules/portefeuille/echeance/assets/` | 20 | copie **octet pour octet** de l'asset de `balance-service` |
| `bilan-service/scripts/referentiels/sources/` (+ variante `-zonefranche`) | **10** | **embarqué** dans le référentiel `syscohada-revise@2.1` sous la clé `paquetFiscal`, et **lu par le prévisionnel** (`projection/impot.ts` : `is.taux`, `tva`, `minimumForfaitairePerception`, `acomptesProvisionnels`) |
| `docs/referentiels/` | 16 | copie de documentation, en retard |

**D-493-A — la copie de `bilan-service` porte un chiffre déjà corrigé ailleurs.** Sur les 78 feuilles
communes aux deux sources, **25 divergent**, toutes textuelles à ce jour — mais l'une d'elles publie
`IRPP (bareme progressif, tranche haute 30%)` quand `balance-service` **et** le README du dépôt `docs/`
portent **35 %**, correction explicitement consignée le 2026-07-19. Elle est dans l'artefact **construit et
servi** `syscohada-revise-2.1.json`. Aucune valeur **numérique** ne diverge aujourd'hui : rien ne
l'empêche demain, le prévisionnel et la liquidation lisant deux fichiers différents pour le même
`pays × année`.

**D-493-B — la garde de STORY-491 ne couvre pas le paquet fiscal.** `bilan-service` refuse depuis
STORY-491 de packager un **référentiel comptable** dont le `_meta` est incomplet (`zoneComptable`,
`pays`, `devisePresentation`, `normeSource`, `statut`, `miseEnGarde` si `amorce`), avec un vocabulaire
fermé dans `meta-vocabulaire.json`. Cette garde porte sur le `_meta` **du référentiel**, jamais sur le
`_meta` **du paquet fiscal** qu'il embarque. Côté `balance-service`, `build.mjs` se contente
d'**imprimer** `_meta.statut` : aucune garde, d'aucune sorte.

**D-493-C — la règle d'AC-2 se calibre sur l'artefact, pas sur une intuition.** Règle retenue : toute
valeur **numérique ou booléenne** doit porter une référence légale sur son propre nœud ou sur un
ancêtre de sa rubrique (`source`, `reference`, ou `_meta.source`). Balayée sur le paquet togolais :
**112 valeurs, 112 couvertes, 0 orpheline, sans modifier l'artefact** — AC-3 est donc tenable. Mais la
mesure de sensibilité montre que la règle seule est **trop permissive** : sur les 52 nœuds porteurs
d'une `source`, en supprimer une n'est détecté que **36 fois sur 52**. Les 16 muettes incluent les
**quatre exonérations de MFP** — exactement les valeurs de STORY-412. Le schéma doit donc **exiger
nommément** la `source` sur chaque élément des collections (types de taxes, exonérations, échéances,
crédits d'impôt), et le balayage des valeurs orphelines n'est que le **second filet**.

---

## Périmètre

**Inclus**
- `balance-service` — schéma JSON du paquet fiscal (AC-1), garde de complétude + de référence légale
  exécutée par `scripts/referentiels/build.mjs` (AC-2, AC-3), champ de statut de validation publié au
  contrat HTTP (AC-5).
- `docs/referentiels/README-paquet-fiscal.md` — procédure de sourcing (AC-4).

**Hors périmètre**
- ⚠️ **Aligner les copies de `bilan-service` et de `docs/` sur l'artefact autoritaire**, et la garde
  inter-dépôts qui les confronterait. Le trou est réel et nommé ci-dessus (D-493-A) ; le refermer
  change le checksum de `syscohada-revise@2.1`, qui est un **acte de contrat** encadré par le
  `README.md` des référentiels. **Story à ouvrir.**
- Tout paquet fiscal d'un autre pays : cette story livre le gabarit, jamais un pays (les paquets pays
  restent chacun une story avec son sourcing).
- Le barème CNSS, resté incomplet (plafond, branches, SMIG) : consigné, pas comblé.

**🪝 Hooks inertes documentés**
- Le schéma décrit des rubriques **obligatoires** et des rubriques **facultatives** : une rubrique
  qu'un seul pays porte (droits d'accises, taxe sur les conventions d'assurance) reste facultative,
  et le devenir est une décision de packaging, pas de schéma.
- Le vocabulaire du statut de validation est **celui de STORY-491**
  (`certifie` · `amorce` · `a-valider-par-expert`), pas un second vocabulaire parallèle.

---

## Notes

- Voir le référentiel fiscal togolais du dépôt, [[STORY-412]], [[STORY-413]], [[STORY-492]].


---

## Progress Tracking

**Statut : `in_progress`** — démarrée le **2026-09-12** (flux APEX complet, développement compris).

- ① Fiche requalifiée sur mesure du code : trois contenus pour un même paquet, la garde de STORY-491
  hors sujet ici, et la règle d'AC-2 calibrée par balayage (D-493-A, D-493-B, D-493-C ci-dessus).
- ② Branches `MNV-493` ouvertes sur `docs/` (base `main`), `balance-service` et `dossier-service`
  (base `dev`).
- ③ Développée. ④ Portes passées, vérification docker faite.

### ⚠️ D-493-A rectifiée après lecture du code — le constat était trop fort

La copie de `bilan-service` n'est **pas** une divergence que personne n'a vue : c'est un **ancêtre figé
et documenté**. Un test du dépôt l'exécute déjà
(`referentiel-assets-coherence.spec.ts`, « le champ `paquetFiscal` embarqué … est **périmé** »), il
constate que l'embarqué est `AMORCE` là où l'autonome est complet, et c'est la justification
**exécutable** de la décision D-078-1 : `balance-service` ne lit jamais le paquet embarqué. Ce qui reste
vrai du constat, et qui est réel :

1. le paquet embarqué est lu par le **prévisionnel de `bilan-service`** (`projection/impot.ts` :
   `is.taux`, `tva`, `minimumForfaitairePerception`, `acomptesProvisionnels`), donc un moteur calcule
   depuis une amorce ;
2. son `statut` n'appartient à **aucun vocabulaire** — la garde `_meta` de STORY-491 porte sur le
   référentiel comptable, jamais sur le paquet fiscal qu'il embarque. Une ligne de
   `referentiel-assets-coherence.spec.ts` le **constate** désormais, au lieu de le laisser deviner ;
3. les 25 divergences textuelles relevées sont réelles, dont un `IRPP … tranche haute 30 %` publié dans
   l'artefact servi quand la valeur corrigée est **35 %** — mais c'est de la **prose**, dans
   `autresImpotsTaxes.presentsDansCGI`, qu'aucun moteur ne lit. **Aucune valeur numérique ne diverge.**

⇒ Le trou n'est pas celui que la fiche décrivait, il est plus étroit et reste réel. Story à ouvrir,
hors périmètre (le refermer change le checksum de `syscohada-revise@2.1`).

### ⚠️ AC-3 tenu, et le seul écart nommé

Le paquet togolais passe la garde de complétude **sans modification** : **112 valeurs** numériques ou
booléennes, **112 couvertes**, **0 orpheline**, aucune rubrique manquante, R1 à R4 muettes sur les neuf
rubriques obligatoires. Les **trois** seules fautes relevées à la première exécution étaient :

| Faute | Pourquoi elle ne pouvait pas préexister |
|---|---|
| `_meta.loiDeFinances` manquant | c'est **AC-2 qui crée ce champ** |
| `_meta.statut` hors vocabulaire | c'est **AC-5 qui ferme ce vocabulaire** |
| R1 mise en garde absente | conséquence directe du précédent |

**D-493-D — « sans modification » porte sur les rubriques, pas sur le `_meta`.** Une lecture littérale
rendrait AC-2 et AC-5 insatisfiables : un champ que le critère crée ne peut pas déjà être là. Ce qui est
prouvé, et qui est la substance du critère, c'est que la garde de **complétude fiscale** n'a exigé
**aucun** ajout de contenu — pas un taux, pas une échéance, pas une exonération.

### Table de mutations — 18 dans la spec, 7 sur le code de production

La spec `paquet-fiscal-schema.spec.ts` **exécute le vrai validateur** (`node
valider-paquet-fiscal.mjs`), jamais une copie de ses règles : une seconde copie divergerait, et la spec
resterait verte pendant que la garde laisserait entrer. Dix mutations y sont jouées (rubrique supprimée,
loi de finances supprimée, `source` d'exonération de MFP supprimée, statut hors vocabulaire, mise en
garde absente, plafond de régime absent, code de réintégration absent puis inconnu, valeur sans
référence, taux ajouté sans source), plus deux sur le calendrier et quatre sur la définition elle-même.

Sept mutations ont été jouées **sur le code de production**, et **rejouées** après avoir constaté que
trois d'entre elles rougissaient par **erreur de compilation** — ce qui ne prouve rien (leçon
STORY-411/412). Les sept versions retenues compilent toutes :

| # | Mutation | Effet |
|---|---|---|
| M1 | l'appel de garde supprimé de `build.mjs` | 🔴 1 test |
| M2 | découverte des sources remplacée par une liste littérale | 🔴 1 test |
| M3 | le prédicat de statut accepte toute chaîne | 🔴 1 test |
| M4 | garde de mise en garde inversée | 🔴 5 tests |
| M5 | `statut` retiré du tampon fiscal | 🔴 7 tests |
| M6 | épandage conditionnel de `miseEnGarde` rendu inconditionnel | 🔴 1 test |
| M7 | `cles()` tronque le manifeste | 🔴 1 test |

⚠️ **Une première version de M1 était VACANTE** : elle transformait l'appel en `void 0 && exiger…(`, ce
qui laissait la chaîne dans le fichier — et la garde de câblage est **textuelle**. Elle est restée
verte. C'est la limite de cette garde, et elle est assumée : elle attrape une suppression, pas un
court-circuit. Ce que la garde de câblage prouve exactement, c'est que l'appel **existe et précède
l'écriture** ; que le validateur refuse, ce sont les dix-huit mutations qui le prouvent.

### Vérification docker — stack réelle, code de la branche

Le générateur, le schéma et le validateur vivent **hors du `rootDir` de Jest** : aucune porte de CI ne
les exécute par elle-même, et les e2e mockent la couche données. Ce que seule la stack réelle prouve,
c'est que l'artefact régénéré **se charge**, avec son nouveau checksum, par le vrai loader.

`docker compose up -d mongo kafka redis balance-service` → `/api/v1/health` **200**,
`{"mongodb":"up","kafka":"up"}`. Puis une sonde exécutée **dans le conteneur**, sur le `dist` réel, à
travers `PaquetFiscalRegistry` + `PaquetFiscalLoader` + `BundledArtifactSource` :

```
cles() du manifeste fiscal : [{"pays":"togo","annee":2026}]
Paquet fiscal togo@2026 chargé (19 rubriques, pays source TG)
statut      : a-valider-par-expert
miseEnGarde : COMPLET au sens de la couverture : taux et seuils extraits du code off…
checksum    : d8d2c5675d562815cbab51f0929d0cd13146a15f78997c7c3f3d42d92df7b3ed
devise      : XOF
tampon      : {"pays":"togo","annee":2026,"checksum":"d8d2c567…","statut":"a-valider-par-expert","miseEnGarde":"COMPLET au sens…"}
```

**Et quatre contre-épreuves, parce qu'une mesure ne prouve que ce qu'elle interroge** — chacune sur les
octets du conteneur, l'arbre de travail de l'hôte vérifié intact après coup :

| Mutation runtime | Réponse du service |
|---|---|
| `_meta.statut` remis en prose | 🔴 `ArtefactIntegrityError` — sha256 attendu ≠ obtenu |
| `is.taux` 0.27 → 0.30 | 🔴 `ArtefactIntegrityError` — sha256 attendu ≠ obtenu |
| statut en prose **+ checksum du manifeste réaligné** | 🔴 « statut "COMPLET (à valider)" : hors du vocabulaire » |
| `miseEnGarde` retirée **+ checksum réaligné** | 🔴 « statut a-valider-par-expert sans `_meta.miseEnGarde` » |

⚡⚡ **Les deux premières ont été prises par le CHECKSUM, pas par la garde de statut** — le loader
vérifie l'intégrité avant de parser. Sans les deux dernières, j'aurais conclu que la garde de statut
fonctionne alors que je ne l'avais **jamais atteinte** : elle n'est joignable que quand les octets
correspondent au manifeste, c'est-à-dire précisément quand quelqu'un régénère un paquet **et** reporte
son empreinte à la main. C'est exactement ce que fait `dossier-service`, et c'est donc le scénario pour
lequel cette garde existe — pas du code mort, mais il fallait le mesurer pour le savoir.

### Portes

| Porte | Résultat |
|---|---|
| lint `balance-service` | **0 warning** |
| build `balance-service` | OK (`nest build`) |
| `test:cov` `balance-service` | **3 807** tests, 192 suites — **99.15 / 92.52 / 98.49 / 99.25** (seuils 65/90/90/90) |
| `test:e2e` `balance-service` | **905** tests, 26 suites |
| lint / build / cov / e2e `dossier-service` | 0 warning · OK · **1 245** tests, 99.31 / 94.06 / 96.88 / 99.33 · **272** e2e |

### Ce qui est livré, critère par critère

- **AC-1** ✅ `scripts/referentiels/paquet-fiscal.schema.json` — neuf rubriques obligatoires et leurs
  champs, `_meta` compris. Les rubriques qu'un seul droit local porte restent **facultatives** : les
  exiger obligerait à inventer une donnée.
- **AC-2** ✅ `valider-paquet-fiscal.mjs`, appelé par `build.mjs` **avant** l'écriture. `_meta` déclare
  sa `loiDeFinances` — celle du Togo est la **LF 2023** quand le paquet est keyé sur **2026** : l'écart
  est réel et se **lit** désormais au lieu de se deviner.
- **AC-3** ✅ voir ci-dessus. La garde **nomme la section** (`paquet.depot : manquant — rubrique
  obligatoire du paquet fiscal`) et rend **toutes** ses fautes d'un coup.
- **AC-4** ✅ `docs/referentiels/README-paquet-fiscal.md` (287 lignes), écrit **en refaisant le paquet
  togolais avec** : chaque étape cite l'article réel de la rubrique correspondante. Ses limites sont
  mesurées, pas supposées — dont celle-ci, qui est la plus importante : **la garde vérifie qu'une
  référence existe, jamais qu'elle dit ce que la valeur affirme.**
- **AC-5** ✅ statut dans le vocabulaire fermé **partagé** avec les référentiels comptables, publié sur
  le **tampon** donc sur les sept surfaces qui rendent un chiffre d'impôt (il ne sortait que par la
  route de diagnostic). Le loader **refuse** un statut hors vocabulaire et un paquet non `certifie`
  sans `miseEnGarde`.

### Décisions prises pendant le développement

- **Aucune dépendance ajoutée.** `ajv` n'est présent qu'en transitif (via eslint, version 6 / draft-07) :
  s'y adosser casserait au premier bump. Le schéma est un **vrai** sous-ensemble de JSON Schema 2020-12,
  interprété par un validateur local — et tout mot-clé qu'il n'implémente pas est **lui-même une faute**,
  sans quoi le schéma serait décoratif et la garde passerait au vert sur un paquet qu'elle croit avoir
  contrôlé.
- **Le vocabulaire du statut est celui de STORY-491**, pas un second en parallèle : deux échelles de
  maturité incomparables dans le même produit seraient pires qu'une seule imparfaite.
- **`versTamponPaquetFiscal` prend le paquet**, plus quatre champs recopiés. Le tampon était assemblé en
  littéral sur **huit** sites ; y ajouter le statut aurait été neuf recopies à ne pas oublier — la forme
  de défaut de STORY-420.
- **Le format `jour-mois` est vérifié sur le calendrier.** Trou trouvé pendant la rédaction d'AC-4 :
  `31-04` et `31-02` avaient la bonne forme et n'existent pas. Février reste admis jusqu'au 29.
- **`statut` typé sur le vocabulaire a révélé 23 fixtures** qui écrivaient `'COMPLET'`, `'TEST'`, `''` :
  toutes alignées. Ce n'est pas un dommage collatéral, c'est le type qui fait son travail.
