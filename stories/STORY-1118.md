# STORY-1118 : les comptes d'amortissement et de dépréciation (28, 29, 39, 49, 59) rattachés au poste de leur actif — la liasse d'une entité qui amortit sort équilibrée

Status: in-progress

**Ticket :** `tickets/TICKET-BACKEND-bilan-amortissements-non-rattaches.md` (constat de D-1078-5, cas chiffré) · **Dépôt :**
`prospera-bilan-service` (tenu par D au lot 6, D-L6-5 ; `origin/dev` au départ : `d2c65c6`, STORY-1078) · **Plage :**
groupe D — la plage 1030 → 1079 étant épuisée, identifiant réservé au tracker par la session de groupe au-dessus de la
marque haute (`STORY-1118`, inchangée) · **Priorité :** Must avant toute liasse d'un client réel · **Ordre de D :**
1078 ✅ → **1118** → 1079 → 1074 → 1075.
**Sources :** le ticket ; `stories/STORY-1078.md` (D-1078-5), `STORY-059` (« convention miroir » écartée du moteur, P7),
`STORY-434`, `438`, `528`, `548`, `552`, `676`, `678`, `701` (doctrines de révision) ; **textes officiels relus le
2026-11-25** (ci-dessous). Code d'`origin/dev` (`d2c65c6`) : `src/modules/bilan/etats/bilan-production.service.ts`,
`src/modules/bilan/table-de-passage/`, `scripts/referentiels/`.
**Ne touche pas :** `prospera-balance-service` (C, D-L6-5) : la recopie à l'octet des paquets y est demandée à C (ticket
de recopie de 1076, mis à jour).

## « Fini quand » (ticket)

« Le cas chiffré en spec sur les vrais paquets (équilibre, colonne Amort, Note 3), le fixture e2e de `bilan-export` mis
à jour, et une liasse témoin réelle qui passe `EQUILIBRE_BILAN`. »

## Les textes (relus à la source le 2026-11-25)

- **Guide d'application du SYSCOHADA révisé** (ohada.com, `Guide-d-application-du-SYSCOHADA.pdf`, sha256 `25c24c8b…`,
  le même que celui de 1078) :
  - p. 68 (amortissement indirect) : « l'utilisation de comptes d'amortissements qui sont des démembrements des comptes
    d'immobilisations » ; « **Le compte principal 28 est subdivisé à l'image des comptes 21 à 24. Ses soldes créditeurs
    figureront à l'actif du Bilan, en soustraction.** »
  - p. 78 : « La diminution de valeur est enregistrée au crédit d'un compte 281 à 284 s'il s'agit d'une immobilisation
    incorporelle ou corporelle » ; « Les comptes 28 présenteront un solde créditeur, et figureront à l'actif du bilan ».
  - p. 81 : « les dépréciations correspondantes sont enregistrées au crédit des comptes 291 à 297 Dépréciations d'actif
    immobilisé, qui présenteront un solde créditeur et figureront à l'actif du bilan, en soustraction, au même titre
    que les amortissements » ; « 391 à 398 Dépréciations des stocks, 490 à 499 Dépréciations (tiers) […], 590 à 599
    Dépréciations (trésorerie) […]. **Leurs montants figureront à l'actif du bilan, en soustraction des éléments d'actif
    concernés.** »
  - p. 329 (Bilan, aménagements) : « les comptes d'amortissements (28) et de dépréciations (29 à 59), à solde créditeur,
    figurent à l'actif en soustraction et non au passif ».
  - p. 13 : « le 0 gardant son caractère générique sauf 490 et 590 » (490 et 590 sont des comptes à part entière).
- **AUDCIF 2017, art. 47** : « Les amortissements et les dépréciations sont inscrits distinctement à l'actif en
  diminution de la valeur brute des biens et des créances correspondants pour donner leur valeur comptable nette » ;
  **art. 48** : les provisions pour risques à court terme au passif (« passif-circulant »).
- **Plan de comptes normalisé du SYSCOHADA révisé** (norme 2016), numéros et libellés des comptes 281 → 2848, 291 →
  2978, 391 → 398, 490 → 4983, 590 → 594, relevés sur plan-comptable-ohada.com (`plan-comptable-syscohada.html`, la
  transcription déjà retenue par STORY-676), le 2026-11-25.
- **SMT** : formulaire officiel « LIASSE SYSCOHADA REVISE- SMT-Réf 24-01-19 » (feuille BILAN) : une seule colonne
  « MONTANT » par ligne — Immobilisations (1), Stocks, Clients et débiteurs divers, Caisse, Banque (+/-) —, donc des
  montants **nets** ; le compte de résultat SMT porte « Dotations aux amortissements » (`CRG` : 681, 691), le bilan
  doit donc porter les immobilisations nettes de leurs amortissements pour s'équilibrer (AUDCIF art. 47, qui vaut pour
  le SMT comme pour le Système normal).

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|---|---|---|
| AC-1 | Le contrat est annoncé avant la fusion du code (« ⚠ Contrats » du journal de D) : la liasse change pour toute balance qui porte un amortissement ou une dépréciation, empreintes des cinq paquets, recopie demandée à C | PR de docs d'annonce, fusionnée avant le code |
| AC-2 | Cas du ticket (`2441` D 1 000 000, `28441` C 400 000, `101` C 800 000, `5711` D 200 000), sur les quatre paquets SYSCOHADA révisé : `AM` brut 1 000 000, amort. 400 000, net 600 000 ; actif 800 000 = passif 800 000 ; aucun compte non affecté ; `EQUILIBRE_BILAN` et `COMPTES_NON_AFFECTES` `OK` ; FRNG +200 000 ; identité du fonds de roulement `OK` (plus `INDETERMINE`). Liasse `valide: true` sous `@2.2` et `@2.3` ; sous `@2.1` et la zone franche, seul reste le défaut connu de leur cascade (`CASCADE_SOUS_TOTAUX`, STORY-678) | spec `amortissements-rattaches.spec.ts`, vrais paquets |
| AC-3 | Même cas sous `smt-togo@1.0` : Immobilisations (`AC1`) 1 000 000 / 400 000 / 600 000, Caisse 200 000, équilibré, `valide: true` | idem |
| AC-4 | Dépréciations d'actif circulant : stocks (`39`), clients (`491`), titres de placement (`590`) minorent leur poste (`BB`, `BI`, `BQ` ; SMT `AC2`, `AC3`, `AC5`), et la note annexe qui ventile ces postes porte brut, dépréciation et net | idem |
| AC-5 | Chaque compte de contrepartie va au poste de son actif (table écrite dans le test, trois familles de tables) ; `499` et `599` restent au passif (`DN`, SMT `PA4`), une seule fois | idem (178 cas) |
| AC-6 | Garde de packaging : un paquet bâti sur le plan SYSCOHADA dont la table laisse un compte de bilan (classes 2 à 5) de sa nomenclature sans poste, range une contrepartie hors de l'actif ou hors du poste de son actif, ou une provision `499`/`599` hors du passif, ne se package pas ; les tables d'avant 1118 la rougissent | `gardes-nomenclature.spec.ts` (node fils) ; garde jouée sur les artefacts de `d2c65c6` |
| AC-7 | Hors des préfixes ajoutés aux tables et des comptes ajoutés aux plans, chaque artefact est identique à celui de 1078 ; aucun autre paquet ne bouge ; le moteur ne change pas d'une ligne | comparaison JSON ; `build.mjs` |
| AC-8 | Les tests et fixtures qui supposaient l'ancien comportement sont mis à jour et nommés ; suite complète sous Node 24 ; e2e de la liasse et de l'analyse | « Preuves » |

## Décisions retenues par défaut (contestables)

- **D-1118-1 — Dans les données, pas dans le moteur.** La contrepartie est déclarée dans les tables de passage des
  paquets (invariant P7 ; la « convention miroir » reste écartée du code depuis STORY-059) : le moteur range déjà au
  préfixe le plus long, et sa règle `NET_ACTIF` porte déjà le crédit d'un compte rattaché en colonne « Amort./Dépréc. »
  (Brut = Σ débits, Amort. = Σ crédits). **Aucune ligne du moteur ne change** (vérifié : le cas chiffré passe sur les
  artefacts seuls).
- **D-1118-2 — La règle de rattachement : la subdivision « à l'image »** (Guide p. 68) : `28xy` et `29xy` vont au poste
  de `2xy` (`2845` ↔ `245` → `AN` ; `2945` → `AN` ; `2811` ↔ `211` → `AE`) ; `39x` au poste de `3x` (`BB`) ; `49x` à
  celui de `4x` ; `59x` à celui de `5x`. Le préfixe le plus long l'emporte, comme pour les comptes bruts. Tables :

  | Poste (Système normal) | Brut (inchangé) | Ajouté (amortissements, dépréciations) |
  |---|---|---|
  | `AE` Frais de développement | 211 (2191) | 2811, 2911 |
  | `AF` Brevets, licences, logiciels | 212, 213 (2193) | 2812, 2813, 2912, 2913 |
  | `AG` Fonds commercial, droit au bail | 215, 216 | 2815, 2816, 2915, 2916 |
  | `AH` Autres incorporelles | 214, 217, 218 (21 en `@2.2`/`@2.3`) | 2814, 2817, 2818, 2914, 2917, 2918 (+ 281, 291) |
  | `AD` Immobilisations incorporelles (`@2.1`, ligne de détail résiduelle) | 21 | 281, 291 |
  | `AJ` Terrains | 22 | 282, 292 |
  | `AK` Bâtiments | 231, 232, 233 (23) | 2831, 2832, 2833, 2931, 2932, 2933 (+ 283, 293) |
  | `AL` Aménagements, agencements, installations | 234, 235, 238 (2392, 2393) | 2834, 2835, 2838, 2934, 2935, 2938 |
  | `AM` Matériel, mobilier, actifs biologiques | 241 → 244, 246 (24) | 2841 → 2844, 2846, 2941 → 2944, 2946 (+ 284, 294) |
  | `AN` Matériel de transport | 245 (2495) | 2845, 2945 |
  | `AI` Immobilisations corporelles (`@2.1`, résiduelle) | 22, 23, 24 | 282, 283, 284, 292, 293, 294 |
  | `AP` Avances et acomptes sur immobilisations | 251, 252 | 2951, 2952 |
  | `AR` Titres de participation | 26 | 296 |
  | `AS` Autres immobilisations financières | 27 | 297 |
  | `AQ` Immobilisations financières (`@2.1`, résiduelle) | 26, 27 | 296, 297 |
  | `BA` Actif circulant HAO | 485, 488 | 498 |
  | `BB` Stocks et en-cours | 31 → 38 | 391 → 398 |
  | `BH` Fournisseurs, avances versées | 409 | 490 |
  | `BI` Clients | 411, 412, 414, 416, 418 | 491 |
  | `BJ` Autres créances | 42 → 47 (185, 188 en `@2.3`) | 492 → 497 |
  | `BQ` Titres de placement | 50 | 590 |
  | `BR` Valeurs à encaisser | 51 | 591 |
  | `BS` Banques, caisse | 52 → 55, 57, 58 | 592, 593, 594 |

  Entre parenthèses : ce que portent `@2.2`/`@2.3` en plus. **SMT** (`smt-togo@1.0`) : `AC1` Immobilisations ← 281 → 284,
  291 → 294, 2951, 2952, 296, 297 ; `AC2` Stocks ← 391 → 398 ; `AC3` Clients et débiteurs divers ← 490 → 498 ; `AC5`
  Banque ← 590 → 594 ; `AC4` Caisse : aucune dépréciation au plan.
- **D-1118-3 — Les dépréciations d'en-cours que le plan ne subdivise pas** (`2919` incorporelles, `2939` bâtiments et
  installations, `2949` matériel) vont au **résidu de leur rubrique** — `AH`, `AK`, `AM` en `@2.2`/`@2.3` (patron de
  STORY-676 : le préfixe résiduel à l'enfant générique), `AD`, `AI` en `@2.1` —, comme les en-cours bruts non tranchés.
  Limite écrite : la dépréciation d'un en-cours que la table tranche (`2191` → `AE`, `2495` → `AN`…) se lit au résidu,
  le plan normalisé ne portant pas `29191` ni `29495`. Les amortissements d'en-cours n'existent pas (un en-cours ne
  s'amortit pas ; le plan n'a ni `2819`, ni `2839`, ni `2849`).
- **D-1118-4 — Les dépréciations de tiers et de trésorerie** : `490` → `BH` (le seul poste d'actif des fournisseurs,
  `409`), `491` → `BI`, `492` → `497` → `BJ`, `498` (créances HAO) → `BA` ; `590` → `BQ`, `591` → `BR`, `592` → `594` →
  `BS`. **`499` et `599` vérifiés** : provisions pour risques (AUDCIF 48), déjà au passif (`DN`, SMT `PA4`) ; aucune
  racine `49` ni `59` entière n'est ajoutée, ils ne sont donc pas doublés (prouvé : `4991` → `DN`, `599` → `DN`). Un
  compte de dépréciation n'a qu'un candidat d'actif : il n'est jamais ventilé au passif ; s'il porte un solde débiteur
  (reprise en excès), ce solde grossit le brut de son poste (règle du moteur, inchangée).
- **D-1118-5 — Révision EN PLACE des cinq paquets** (`syscohada-revise@2.1`, `@2.2`, `@2.3`, `zone-franche-togo@1.0`,
  `smt-togo@1.0`), **sciemment** à rebours de la règle « après l'octroi, une révision qui change la sortie est un bump »
  (registre, `@2.2` ; D-701-1). Motifs :
  1. **Aucun chiffre déjà publié ne change.** Seules changent les liasses qui portent un solde sur un compte `28`, `29`,
     `39`, `49` (hors `499`) ou `59` (hors `599`). Ces comptes n'étant rattachés à aucun poste, toutes ces liasses
     étaient `valide: false` (`COMPTES_NON_AFFECTES` bloquant, et `EQUILIBRE_BILAN`) : jamais validées, jamais figées,
     jamais déposées (la validation exige `valide`, `jeu-etats.service.ts`). Une liasse dont le cabinet avait rattaché
     ces comptes par une surcharge (STORY-400) ne bouge pas : la surcharge l'emporte sur la table. Le motif du bump de
     `cima-assurances@2.0` (« modifier sous les pieds des dossiers existants un chiffre déjà publié ») ne se présente pas.
  2. **Un bump laisserait la table défectueuse servie** à tous les dossiers existants : `@2.1`, `@2.2`, `@2.3` resteraient
     packagés, attribués et choisis, aucune migration d'octrois n'est outillée (registre, doctrine de `@2.1`), et une
     version neuve exigerait un octroi et un pont neufs chez B avant de servir qui que ce soit.
  3. **La trace reste exacte** : une liasse figée garde son snapshot et son tampon complet `{code, version, checksum}` ;
     l'empreinte du paquet change, et c'est elle qui distingue deux liasses (doctrine de `@2.1`, STORY-428).

  **Effet sur les liasses déjà produites :**
  - **validées ou figées** (versions du jeu d'états) : **figées, inchangées**, jamais reproduites ; une liasse rouverte
    est relue avec sa dernière version figée (STORY-065) ; leur tampon porte l'ancienne empreinte.
  - **brouillons** : recalculés à la prochaine production avec la table corrigée — c'est l'objet de la story : une
    entité qui amortit sort équilibrée et validable.
  - **la colonne N-1 d'une liasse N** se recalcule avec la méthode N (STORY-551) : elle porte désormais les
    amortissements de N-1. Limite écrite : une liasse **validée** dont seule la balance N-1 portait un amortissement
    (`COMPTES_NON_AFFECTES` ne juge que N) aurait figé une colonne N-1 minorée ; elle reste figée telle quelle.
  - **exports, analyse, consolidation** d'un brouillon : suivent la liasse ; l'export d'un brouillon change d'empreinte
    avec celle du paquet (tracée).
- **D-1118-6 — Les plans de comptes des paquets s'enrichissent de 117 comptes** (numéros et libellés officiels : 281 →
  2848, 291 → 2978, 391 → 398, 490 → 4983, 590 → 594), les mêmes dans `plan-comptable-syscohada.json` (`@2.1`, zone
  franche, SMT), `-2.2` et `-2.3`. Sans eux, les préfixes ajoutés seraient orphelins (CC2, « le plan couvre tous les
  préfixes de la table ») et la garde n'aurait pas de nomenclature à juger. Les comptes principaux `28`, `29`, `39`,
  `49`, `59` y étaient déjà.
- **D-1118-7 — La garde de packaging `gardes-nomenclature.mjs`** (patron de `gardes-controles-integrite.mjs`), appliquée
  par `build.mjs` à **tout paquet bâti sur un plan `plan-comptable-syscohada*`** (un paquet SYSCOHADA futur y passe
  sans rien déclarer). Quatre règles, sur le plan DU paquet : (1) chaque compte « feuille » des classes 2 à 5 se
  rattache à un poste de détail du bilan à règle de solde exploitable — un compte principal subdivisé (`40` : `401` et
  `409`) est jugé par ses subdivisions ; (2) une contrepartie (`28`, `29`, `39`, `49`, `59` hors `499`, `599`) ne va
  qu'à l'actif ; (3) au poste de son actif quand celui-ci est à l'actif (`2845` et `245` au même poste) ; (4) `499` et
  `599` ne vont qu'au passif. Les tables de `d2c65c6` la rougissent (`28`, `29`, `39` sans poste). La convention reste
  hors du moteur (P7) : c'est une garde de transcription.
- **D-1118-8 — `MOTEUR_VERSION` inchangée** (`bilan-engine@1.24.0`) : le code du moteur ne change pas ; le changement de
  valeur est porté par l'empreinte du paquet, que chaque snapshot fige (« les référentiels, eux, sont tracés séparément
  par `referentiel` + `checksum` », `moteur-version.ts`).
- **D-1118-9 — Le tableau des flux reste cohérent sans retouche** : les décaissements d'investissement (`FF`/`FG`/`FH`)
  lisent la variation **brute** (STORY-434), que les amortissements ne touchent pas ; la variation des stocks et des
  créances (`FC`/`FD`) lit le **net**, désormais minoré des dépréciations — en face, la charge de dépréciation d'actif
  circulant (`659`) est dans l'EBE et la CAFG ne rajoute que `RL` (681, 691) : le flux de trésorerie n'est pas compté
  deux fois.
- **D-1118-10 — La recopie dans `balance-service` est demandée à C** (D-L6-5), en complétant le ticket de recopie de
  1076/1077/1078 : **quatre** artefacts cette fois (`syscohada-revise-2.1/2.2/2.3.json` **et `smt-togo-1.0.json`**, que
  `balance-service` embarque aussi). Effet en balance : les 117 comptes rejoignent le plan (libellé le plus spécifique
  d'un compte `28x` à l'import Sage et dans les cahiers ; classe inchangée).

## Contrat annoncé avant le code

Voir « ⚠ Contrats » du journal de D (entrée STORY-1118).

## Preuves

(à compléter à la livraison)
