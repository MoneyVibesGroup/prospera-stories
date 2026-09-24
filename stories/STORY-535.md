# STORY-535 : Des achats sans aucun compte de stock — le contrôle qui rend l'oubli visible, sans jamais refuser

Status: done

**Épic :** EPIC-011 — États financiers (contrôles de cohérence de la liasse)
**Service :** `bilan-service` — `controles-coherence`
**Points :** 5 · **Sprint :** S20
**Complexité :** medium — un contrôle informatif, mais sa déclaration vit dans l'ARTEFACT du référentiel : `syscohada-revise@2.1` change d'octet, et sa copie dans `balance-service` le suit (deux dépôts, PR intégrées ensemble)
**Origine :** §8.1 de `analyse-scalabilite-multireferentiel-2026-08-27.md`, validé par le PO le 2026-08-28. **Geste ② sur trois.**

---

## Le fait

Aujourd'hui, une liasse dont le compte de résultat porte **des achats de marchandises** et dont le
bilan ne porte **aucun stock** passe tous les contrôles : `EQUILIBRE_BILAN` est vert,
`coherenceSousTotaux` est vert, l'articulation des notes est verte.

⇒ **Le seul contrôle qui manque est celui qui verrait le trou.** Une entreprise commerciale qui
achète pour revendre a nécessairement du stock à la clôture — ou alors elle a tout vendu, ce qui
arrive et se dit, mais ne se suppose pas.

⚡ C'est exactement le mode de panne récurrent du programme : **le calcul est juste, la source ne
l'est pas**, et aucun contrôle d'équilibre ne peut s'en apercevoir. Ici la conséquence est la
**marge commerciale**, c'est-à-dire le premier nombre qu'un chef d'entreprise et un banquier
regardent.

## ⛔ Ce contrôle est INFORMATIF, jamais bloquant

Une entreprise **peut** légitimement clôturer sans stock : déstockage complet, activité de pure
prestation, première année sans achat. **Refuser une liasse sur cette base serait faux.** Le
contrôle **signale**, il ne décide pas — catégorie `INFORMATIF`, comme le module en connaît déjà.

## Critères d'acceptation

- [x] AC-1 — Nouveau contrôle `COHERENCE_STOCKS` dans la batterie existante, suivant **exactement**
      le contrat des autres : `statut` ∈ `CALCULE` / `INDETERMINABLE` / `NON_APPLICABLE`, un booléen
      `coherent`, une catégorie `INFORMATIF`.
- [x] AC-2 — ⛔ **Le booléen se lit avec son statut, jamais seul.** 6ᵉ occurrence du patron, après
      `coherenceSousTotaux`, `coherenceResultat` et `ControleTresorerie` : lire `coherent` seul
      afficherait une anomalie là où il n'y a qu'une absence. Un test le prouve.
- [x] AC-3 — Règle : la liasse porte des **achats** (comptes de la classe 6 déclarés « achats » par
      le référentiel) **non négligeables**, et **aucun solde de classe 3** ni **aucune variation**
      (`603x` / `73x`) ⇒ `coherent: false`, avec le montant des achats en cause.
- [x] AC-4 — ⚠️ **Le seuil de « non négligeable » est déclaré, pas codé** : un montant nul ou
      symbolique ne doit pas produire un signal que personne ne regardera. Un contrôle qui crie tout
      le temps ne dit plus rien.
- [x] AC-5 — `NON_APPLICABLE` quand le **référentiel du dossier ne déclare pas de classe 3 marchande**
      (`sfd-bceao`, `cima-assurances`) — et `coherent: true`, parce que *« rien à réconcilier »
      compte comme un succès*. Doctrine déjà appliquée au TFT absent du SFD.
- [x] AC-6 — Le message **nomme le geste** : « saisissez votre inventaire de clôture » avec le renvoi
      vers l'écran de STORY-534, jamais « incohérence détectée ».
- [x] AC-7 — ⚠️ **Non-régression : le drapeau global de la liasse ne change pas de couleur** du seul
      fait de ce contrôle informatif. Un vert qui devient rouge sur une liasse déjà validée hier
      ferait chercher ce qu'on a cassé.

## Le fait, mesuré dans le code (cadrage du 2026-09-24)

- **M1 — La batterie ne parle pas le vocabulaire d'AC-1.** Un `ControleArticulation` porte
  `code`, `libelle`, `categorie`, `statut` ∈ `OK` / `ANOMALIE` / `INDETERMINABLE` / `NON_APPLICABLE`,
  `severite` (STORY-440), `ecart` et `elements` — **aucun booléen `coherent`**. `CALCULE` + `coherent`
  est le vocabulaire des contrôles PORTÉS PAR LES ÉTATS (`ControleTresorerie`, `CoherenceSig`,
  `coherenceSousTotaux`), que la batterie convertit. Ajouter `coherent` changerait la forme publiée
  que `moteur-version.spec.ts` fige.
- **M2 — Aucun référentiel ne déclare « achats » ni « variation de stocks ».** Seuls marqueurs
  existants : `margeBrute` (`XA`), `chiffreAffaires` (`XB`), `bfr` — dont `bfr: 'STOCKS'` sur `BB`
  (SYSCOHADA et zone franche). Le moteur est référentiel-agnostique (invariant P7) : `601`, `6031`,
  `73` ne s'écrivent pas dans le code. **La déclaration vit donc dans l'artefact** — qui change
  d'octet : régénération (`build.mjs`), checksums au registre et aux empreintes épinglées, et la
  COPIE de `syscohada-revise@2.1` embarquée par `balance-service` (patron STORY-462/483).
- **M3 — Les postes, mesurés dans les artefacts.** SYSCOHADA (et zone franche, même source) :
  achats `RA` (601), `RC` (602), **`RE` (604, 605, 608 — mêle les achats NON stockés `605`)** ;
  variations `RB` (6031), `RD` (6032), `RF` (6033), `TE` (73) ; stocks `BB` (31 à 38, `bfr: STOCKS`).
  **SMT** : achats ET variations fondus dans `CR4` (601…608 avec 6031…6033), `73` dans `CR3` avec
  d'autres produits — inséparables au niveau des postes. **SFD** : achats (`61`) et stocks (`32`) noyés
  dans des postes agrégés, `603` = charges sur titres. **CIMA** : la classe 3 porte les provisions
  techniques.
- **M4 — Aucun seuil n'est déclaré nulle part** : les seuils de la batterie (`severiteCritique`,
  `severiteMajeure`, `toleranceTresorerie`) sont des défauts de code surchargeables par
  `regles` — aucun artefact ne les surcharge. AC-4 demande l'inverse : « déclaré, pas codé ».
- **M5 — La batterie ne reçoit ni le compte de résultat ni les soldes** (`produire(pkg, bilan,
  coherence, tft, notes, coherenceSig?)`) ; le moteur les a tous deux sous la main aux deux appels.
- **M6 — `bfrReel.stocks` vaut `null` quand `BB` n'est pas émis** — or l'absence de tout compte de
  stock est exactement le cas à voir : « poste de stocks déclaré mais non émis » vaut **zéro**.
- **M7 — Ajouter un code** : `CODES_CONTROLE` fait échouer `tsc` tant que son constructeur manque ;
  cinq specs recopient la liste à la main ; le tampon `MOTEUR_VERSION` monte à chaque contrôle ajouté
  (précédents 401, 426, 439, 440).

## Les décisions (cadrage du 2026-09-24)

- **D-535-1 — Le contrôle entre dans la batterie, avec SON vocabulaire.** `COHERENCE_STOCKS`,
  `INFORMATIF`, `statut` `OK`/`ANOMALIE`/`INDETERMINABLE`/`NON_APPLICABLE`, `severite`, `ecart`,
  `elements` — aucun champ ajouté au contrat. AC-1 s'y lit ainsi (« cohérent » ⟺ `OK`), et le
  patron d'AC-2 devient : **une absence n'est jamais une anomalie** — `NON_APPLICABLE` et
  `INDETERMINABLE` ne sont jamais `ANOMALIE`, prouvé par test.
- **D-535-2 — Un marqueur `inventaire` déclaré par l'artefact** (`ACHATS_STOCKABLES` sur `RA`,
  `RC` ; `VARIATION_STOCKS` sur `RB`, `RD`, `RF`, `TE`) ; les stocks restent ceux que `bfr: 'STOCKS'`
  désigne déjà. **`RE` n'est pas marqué** : il mêle les achats non stockés (`605`, l'électricité d'un
  prestataire) — le marquer ferait crier le contrôle sur tout dossier de services. Garde de
  `build.mjs` : les deux catégories ou aucune, sur des postes de détail du compte de résultat, un
  poste `bfr: 'STOCKS'` présent et un seuil déclaré.
- **D-535-3 — Le seuil est DÉCLARÉ, jamais codé** (AC-4) : `regles.seuilAchatsSansStock` = `0.05`
  dans la source SYSCOHADA — les achats stockables pèsent au moins 5 % du chiffre d'affaires (ou le
  chiffre d'affaires est nul). **Aucun défaut de code** : absent ou illisible ⇒ `INDETERMINABLE`.
- **D-535-4 — `NON_APPLICABLE` quand l'artefact ne déclare pas le marqueur** (AC-5) : SFD et CIMA —
  et le **SMT**, mesuré (M3) : ses achats et ses variations partagent une case, la déclaration n'y
  serait pas vraie.
- **D-535-5 — La règle** : `ANOMALIE` ⟺ achats stockables non négligeables **et** stocks nuls (postes
  `bfr: STOCKS` émis, ou absents) **et** toutes les variations nulles. `ecart` = les achats en cause
  (AC-3), sévérité rapportée au chiffre d'affaires (méthode de STORY-440), `elements` = les postes
  d'achats et de stocks, adressables (`etat`/`poste`).
- **D-535-6 — Le message nomme le geste** (AC-6) : le libellé dit « saisissez votre inventaire de
  clôture » et renvoie à l'Atelier (STORY-534), jamais « incohérence détectée ».
- **D-535-7 — `valide` ne bouge pas** (AC-7) : `INFORMATIF` est toujours satisfait
  (`bloquantSatisfait`) — prouvé par test. Tampon `MOTEUR_VERSION` 1.18.0 → 1.19.0.
- **D-535-8 — Le compte de résultat entre dans la batterie** en paramètre FACULTATIF (les ~70
  appelants de spec ne bougent pas ; le moteur le passe aux deux appels) ; absent ⇒ `INDETERMINABLE`.
- **D-535-9 — Deux dépôts, aucun contrat d'événement** : la copie de `syscohada-revise@2.1` dans
  `balance-service` suit à l'octet (asset, registre, specs de checksum) ; les deux PR s'intègrent
  ensemble.

## Hors périmètre — hooks inertes documentés

- **SMT** : séparer achats et variations dans sa source (`CR4`/`CRD`) avant d'y déclarer le marqueur.
- **`RE`** : n'y compter que les achats STOCKÉS (`604`) exigerait de scinder le poste.
- **Le renvoi cliquable** vers l'écran d'inventaire : c'est FE-084 (le contrat ne porte pas de lien).
- **L'écran** et la phrase dans l'onglet Cahiers : FE-084.

## Notes

- Voir [[STORY-534]] (le geste qui referme le trou), [[FE-084]], `controles-coherence-response.dto.ts`.

## Progress Tracking

- 2026-09-24 — branche `MNV-535` ouverte sur `docs/` ; statut `ready-for-dev` → `in_progress`.
- 2026-09-24 — **cadrage fait avant tout code** : 7 constats mesurés (dont M1 — AC-1 parle le
  vocabulaire des contrôles d'ÉTAT, pas celui de la batterie ; M2 — aucune déclaration d'achats ni de
  variation n'existe, P7 impose de la poser dans l'artefact), 9 décisions. Deux dépôts :
  `bilan-service` et la copie de l'artefact dans `balance-service`.
- 2026-09-24 — **dev** (bilan-service `08b7a6a`, `1cd0ea3`, `0337d81` — PR #136 ; balance-service `622499d` — PR
  #119, jumelles) : marqueur `inventaire` dans `build.mjs` (émission en dernier, garde
  `exigerInventaireCompletOuAbsent`), déclaré dans la source SYSCOHADA (`RA`/`RC`, `RB`/`RD`/`RF`/`TE`,
  seuil `0.05`) ; seuls `syscohada-revise@2.1` (`484c6a80…` → `24d3e5ab…`) et `zone-franche-togo@1.0`
  (`1b6462ac…` → `8e32081e…`) changent, diff limité aux sept lignes ; recopie à l'octet dans
  balance-service. Contrôle `COHERENCE_STOCKS` (8ᵉ code), CR en paramètre facultatif, `MOTEUR_VERSION`
  1.19.0. **Gardes du générateur prouvées par mutation manuelle** (hors Jest) : marqueur partiel, seuil
  absent, seuil illisible, aucun poste `bfr: STOCKS`, sous-total `XA` marqué — cinq refus, source et
  artefacts restaurés à l'octet. Portes : bilan-service lint 0, build, `test:cov` 4 063 (99,12 / 95,45 /
  99,41 / 99,21), e2e 880 (dont 3 sur l'artefact RÉEL) ; balance-service lint 0, build, `test:cov` 4 664
  (+ le test de coût de STORY-527 rouge sous charge 95, repassé seul 43/43, seuil inchangé), e2e 1 230.
  **9 mutations rouges** — dont un survivant comblé (« ni achat ni chiffre d'affaires » : le mutant
  `totalAchats >= 0` signalait une anomalie de zéro) et deux gardes redondantes retirées (le `typeof`
  doublait `Number.isFinite`).
- 2026-09-24 — **vérification docker sur stack NEUVE**, chaîne STORY-534 → 535 par les API réelles,
  18 contrôles, 0 échec : dossier aux cahiers sans inventaire ⇒ `COHERENCE_STOCKS` `ANOMALIE`
  `INFORMATIF`, écart 60 000 000 (les achats), libellé nommant le geste, `valide: true` ; liasse créée sur
  la balance validée PUIS validée malgré l'anomalie (AC-7), snapshot figé en base :
  `bilan-engine@1.19.0`, 8 contrôles, `ANOMALIE`, `valide: true` ; second dossier inventorié (STORY-534,
  31 = 30 000 000, 6031 créditeur) ⇒ `OK`, liasse créée. `docker compose stop` ensuite. Statut → `review`.
- 2026-09-24 — ⑥ **revue de code** (scan `opus` + lentille `ponytail-review` ; synthèse en session, commit
  dédié `eca6c58`) : **0 défaut de justesse** (règle, signes, P7, gardes du générateur, recopie à l'octet
  revérifiés) ; 7 constats non bloquants, tous traités — trois gardes sans test DISCRIMINANT, prouvées par
  mutant survivant puis rejouées rouges : le CR sur le chemin de la LIASSE (C1 : le mutant qui l'ôte passait
  4 063 + 880 tests — la liasse figée aurait porté `INDETERMINABLE` sans signal), le seuil DÉCLARÉ (C2 : 5 %
  codés en dur passaient), stocks bruts/nets (C3). C4 **assumé et écrit** : avec le seuil déclaré égal au
  défaut `severiteCritique`, toute anomalie ressort `CRITIQUE` en SYSCOHADA. C5 Swagger (`ecart` = achats
  en cause), C6 JSDoc détaché par insertion (dixième récidive), C7 justification du tampon. Ponytail :
  union littérale au lieu d'un tableau sans consommateur.
- 2026-09-24 — ⑦ **revue de sécurité** (préparation `haiku`, analyse `opus`) : **0 constat** — le contrôle
  ne peut ni bloquer ni débloquer une validation (`bloquantSatisfait` seul écrivain, prouvé en docker),
  artefact vérifié au sha256 dans les deux dépôts, coût borné par le référentiel embarqué.
- 2026-09-24 — **portes sur l'état final** (bilan-service) : lint 0, build, `test:cov` 4 067, e2e 880.
  Aucune vérification docker rejouée : ni l'artefact ni la forme de la réponse n'ont bougé en revue
  (tests, descriptions Swagger, commentaires, type).
- 2026-09-24 — ⑧ **`bilan-service#136` et `balance-service#119` rebase-mergées ENSEMBLE sur `dev`**,
  branches supprimées. ⑨ clôture : statut `done` aux trois endroits, `completed_date` posée.
