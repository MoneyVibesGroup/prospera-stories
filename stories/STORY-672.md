# STORY-672 : Onze comptes de gestion CIMA ne mènent à aucun poste — et la liasse les perd en silence

Status: done

**Complexité :** high

**Épic :** EPIC-128 — Socle vertical CIMA
**Service :** `bilan-service` (source des octets) + `balance-service` + `assurance-service`
**Points :** 8
**Origine :** ⚡ **mesure du cadrage de STORY-513**, 2026-09-20 — dépouillement de la table de passage
de `cima-assurances@1.0`.

---

## Le fait, mesuré sur l'artefact

L'artefact déclare `racinesDeGestion: ["6","7","80","82","83","84","85","86"]` — les racines qui
portent le résultat comptable. Sa **table de passage** ne route que `60`→`68`, `70`, `71`, `75`, `76`
et `77`.

**Onze comptes déclarés « de gestion » ne sont donc routés vers aucun poste de la liasse :**

| Compte | Libellé |
|---|---|
| `69` | Charges par nature à l'étranger |
| `73` | **Réductions et ristournes de primes** |
| `74` | Ristournes, rabais et remises obtenus |
| `78` | Travaux faits par l'entreprise pour elle-même |
| `79` | Produits par nature à l'étranger |
| `80` | Exploitation générale |
| `82` | **Pertes et profits sur exercices antérieurs** |
| `83` | Dotation aux provisions exceptionnelles et réserves réglementaires |
| `84` | Pertes et profits exceptionnels |
| `85` | Impôts sur les bénéfices |
| `86` | Produits de prestations de services échangés |

⛔ **Le mode de panne est silencieux, et le projet le connaît déjà.** Un solde porté par l'un de ces
comptes est un **compte non mappé** : la balance le porte, la liasse ne le voit pas, et aucun contrôle
ne bronche — `CAT = CPT` reste vrai, puisque l'écart ne touche que la présentation. C'est le patron de
**STORY-486**, transposé de `syscohada-revise` à `cima-assurances`.

⚡ **Deux de ces onze comptes ont un demandeur nommé.** L'AC-4 de **STORY-513** exige de distinguer les
ristournes **de l'exercice** (compte `73`) de celles portant sur un **exercice antérieur** (compte
`82`). STORY-513 enregistre la distinction dans l'agrégat ; elle ne peut pas la **présenter**, faute de
poste. Sans cette story, `RP1` « Primes ou cotisations » **surévalue les primes** de toutes les
ristournes accordées.

⚠️ **`85` est un cas à part, et il est déjà déclaré** : le poste `RN` s'intitule « RÉSULTAT NET DE
L'EXERCICE (avant impôt sur les bénéfices) ». Son absence de routage est **cohérente avec son libellé**
— à confirmer, pas à corriger d'office.

## Critères d'acceptation

- [x] AC-1 — Pour **chacun** des onze comptes, une décision **écrite** : routé vers un poste (lequel,
      avec quel signe), ou **délibérément non routé** avec le motif. ⛔ Aucun ne reste sans mention.
- [x] AC-2 — `73` et `82` sont routés, et **pas au même endroit** : une ristourne de l'exercice réduit
      les primes, une ristourne sur exercice antérieur ne les touche pas. C'est ce que STORY-513 attend.
- [x] AC-3 — ⛔ Un test **mesure l'assiette** de chaque poste touché **avant et après**, poste par
      poste : ajouter des comptes à une table de passage peut élargir une assiette sans qu'on l'ait
      voulu. Un « plan ⊇ préfixes de la table » ne le verrait pas.
- [x] AC-4 — ⛔ **Nouvelle version du paquet** : les octets changent dans **trois** dépôts, donc la
      version, le checksum et les trois recopies, **dans le même lot de PR**. ⚠️ Vérifier la version
      réellement packagée avant de commencer — **STORY-514** et **STORY-671** en demandent une aussi.
- [x] AC-5 — Le `statut` de l'artefact reste `amorce` (AD-12) : router des comptes ne valide ni la
      liasse ni les provisions techniques.
- [x] AC-6 — ⚠️ Un test **générique** : tout compte du plan déclaré dans `racinesDeGestion` est soit
      routé, soit inscrit dans une liste d'exclusions **motivée**. C'est lui qui empêche le douzième
      compte orphelin d'arriver en silence.

## Hors périmètre

- Les **variations de provisions techniques** au compte de résultat → STORY-518.
- La **provision pour primes non acquises** → STORY-514.
- La transcription des 1 052 comptes du plan → STORY-671.
- Toute **validation actuarielle** (AD-12).

## Notes

- Voir [[STORY-513]] (qui a produit la mesure et attend `73`/`82`), [[STORY-486]] (le même mode de
  panne sur `syscohada-revise`), [[STORY-518]], [[STORY-671]], spine AD-5, AD-9, AD-12.

## Décisions de développement — 2026-10-09

- **D-672-1 — Version `@7.0`**, vérifiée sur le manifeste réel avant de coder (AC-4) : STORY-671 a
  livré `@6.0` le même jour, STORY-514 n'a pas bumpé. Additive : `@1.0`→`@6.0` restent packagées et
  **byte-identiques** (rien d'autre ne bouge au build). Plan et racines de gestion = ceux de `@6.0`.
- **D-672-2 — La décision par compte (AC-1)**, tranchée par l'art. 432, jamais par vraisemblance :

  | Compte | Décision | Source |
  |---|---|---|
  | `69` | divisionnaires routés comme leur homologue national (`690`/`6901`/`6902`/`6904`/`6905` → `RC1`, `6909` → `RC9`, `691` → `RC2` … `698` → `RC8`), au CR **et** dans les deux modèles du compte 80 ; la **tête `69`** reste sans poste (son solde ne dit ni sa nature ni son modèle) | art. 432 : « 6901, 6904 », « 6902, 6904, 6905 », « 691 », « 692 »… dans les listes du compte 80 |
  | `73` | `RP1` + `EV10`/`EN10` : réduit les primes | art. 432 : « soldé par les comptes 701 à 706 » |
  | `74` | `RP4` + `EV15`/`EN15` (produits accessoires) | art. 432 : « Produits accessoires : 74, 76, 794, 796 » |
  | `78` | poste propre `RP7` + `EV19`/`EN19` | art. 432 : ligne « Travaux faits par l'entreprise pour elle-même - Charges non imputables… : 78, 798 » |
  | `79` | comme `69` (`790x` → `RP1`, `7909` → `RP6`, `791` → `RP2`, `793` → `RP1`, `794`/`796` → `RP4`, `795` → `RP3`, `797` → `RP5`, `798` → `RP7`) ; tête `79` sans poste | art. 432 : « 7901, 7904 », « 7902, 7904, 7905 », « 791 »… |
  | `80` | **délibérément non routé** : compte de REGROUPEMENT (STORY-522) — il a d'ailleurs quitté les racines de gestion dès `@5.0` | art. 432 : « Le solde du compte 80 est viré… au compte 87 » |
  | `82` → `86` | CR (`RH1` → `RH5`) **et** compte 87 (`PP2` → `PP6`) | art. 433 (compte 87) |

- **D-672-3 — ⛔⛔ « `CAT = CPT` reste vrai » était FAUX, et c'est mesuré.** Le résultat absorbé au
  passif (`role: RESULTAT_BILAN`) est `Σ_CR (crédit − débit)` sur les **seuls comptes rattachés au CR**.
  Un impôt au `85` (contrepartie au passif) laissait donc le passif plus long que l'actif du montant de
  l'impôt : sur la balance de la spec, `CAT = 4 150`, `CPT = 4 900`, écart `−750` (= la part des onze
  comptes). ⇒ **`85` entre au CR**, comme `82`, `83`, `84`, `86`, et le §« `85` est un cas à part » de ce
  document est **infirmé** : son libellé « avant impôt » était cohérent avec un `RN` qui laissait le
  Bilan déséquilibré. `RN` devient **« après impôt sur les bénéfices »**, libellé compris.
- **D-672-4 — `73` et `82` ne vont pas au même endroit (AC-2).** `73` réduit `RP1` ; `82` va à `RH1` et
  `PP2`, sans toucher `RP1`. Le résultat net est le même dans les deux cas — seule la présentation
  diffère, et c'est elle que STORY-513 ne pouvait pas produire.
- **D-672-5 — Le compte 87 cesse d'être un squelette** dès que le paquet y route des comptes : ligne de
  report = solde du compte 80 servi, puis `82` → `86`, puis le solde. Les deux lignes non routées sont
  désignées par leur **place** (invariant P7) ; toute autre forme ⇒ squelette. Sans compte 80 servi
  (agrément contradictoire, non tranché, ou N-1 absente) : `INDETERMINABLE` / `INCOMPATIBLE_ART_326`,
  jamais un solde à zéro près. `@1.0` → `@6.0` gardent le squelette.
- **D-672-6 — L'articulation du compte 80 retranche la part hors exploitation** : `RN` couvrant
  désormais `82`→`86`, que le compte 80 ne reçoit pas, l'identité devient `solde80 = RN − hors
  exploitation − variation brute + variation des cessions`, la part étant lue sur le compte 87 de la
  **même** balance (même surcharges). Publiée : `articulation.resultatHorsExploitation`.
- **D-672-7 — Cinq dépôts**, comme STORY-671 : bilan (sources, build, registre, pont `etats-cima`),
  balance (artefact + pont `CIMA` `['7.0','6.0','5.0']`), assurance (bascule `REFERENTIEL_SERVI` →
  `@7.0`, octroi `@6.0` seul ⇒ 403 — patron D-518-6), catalogue (snapshot + pack `@7.0` seul), dossier
  (miroir). Pont `solvabilite-cima` laissé à `@5.0` (D-671-7, inchangé).
- **D-672-8 — Hook de STORY-513 levé.** `assurance-service/…/compte-non-choisi.ts` (D-513-1) consigne
  que `73`/`82` sont routés à partir de `@7.0` ; l'adaptateur de balance, quand il sera écrit, doit
  exiger `@7.0` ou postérieure. Il n'est **pas** écrit ici (hors périmètre).
- **D-672-9 — Ticket front** : `tickets/TICKET-FRONTEND-referentiel-cima-7-0-story-672.md` remplace les
  tickets `@5.0` (STORY-522) et `@6.0` (STORY-671), jamais traités.

## Progress Tracking

- 2026-10-09 — ① branche `docs` `MNV-672` ; ② branches `MNV-672` sur `bilan-service`,
  `balance-service`, `assurance-service`, `platform-catalog-service`, `dossier-service`, créées et
  rebasées **avant la première ligne**.
- 2026-10-09 — ③ dev : sources `postes-cima-v6.json` / `table-de-passage-cima-v6.json` dérivées de v5
  par script (`tmp/story-672/gen-sources.py`), `cima-assurances@7.0` (`aef4982b…`) généré, 80 postes,
  78 lignes de table. Compte 87 calculé et articulation corrigée dans
  `comptes-cima-production.service.ts`. Spec `cima-comptes-orphelins.spec.ts` (44 tests après revue : AC-1 compte
  par compte, AC-2, AC-3 delta d'assiette poste par poste sur les 1 053 comptes — **aucun compte
  perdu**, AC-6 avec exclusions motivées et anti-péremption, équilibre du Bilan `@6.0` vs `@7.0`,
  compte 87, articulation, gardes de forme).
- 2026-10-09 — ④ portes DoD vertes sur les cinq dépôts (lint 0, build, `test:cov` au-dessus des
  seuils, e2e) : bilan 11 849 unit + 3 289 e2e (couverture 99,46 / 97,03 / 99,62 / 99,55) · balance
  5 051 + 1 788 · assurance 2 153 + 342 · catalogue 867 + 202 · dossier 1 810 + 351. ⚠️ Un e2e
  catalogue (`entitlements`, RBAC TENANT_USER 403/404) rouge sous charge parallèle, **vert rejoué
  seul** (54/54) — sans lien avec le pack. **Mutations : 12 + 3 de revue, toutes rouges** (script
  `tmp/story-672/mutations.sh`) — `85` sorti du CR, `73` rangé avec `82`, `RN` qui oublie `RH4`, `RC6`
  qui vole `6950`, tête `69` routée, `83` absent du compte 87, articulation sans hors exploitation,
  signe inversé, compte 87 toujours squelette, gardes de nombre et de place, statut
  `INCOMPATIBLE_ART_326`, report forcé `CALCULE` ; revue : surcharges perdues au compte 87, agrément
  sans comptes à l'étranger, `83` au compte 87 seul (hors CR). ⚠️ Deux mutants non appliqués à la 1re
  passe (prettier avait remis la garde sur une ligne) **rejoués à la main**, rouges. **Vérif docker
  non applicable** : la story ne persiste rien (paquet embarqué, vérifié par sha256 au chargement dans
  les trois services).
- 2026-10-09 — ⑤ PR : bilan-service#169, balance-service#131, assurance-service#18,
  platform-catalog-service#31, dossier-service#43.
- 2026-10-09 — ⑥ revue de code (scan opus + lentilles `silent-failure-hunter`, `pr-test-analyzer`,
  `type-design-analyzer`, `ponytail-review`) : **aucun bloquant ; douze constats non bloquants,
  corrigés** dans un commit de revue dédié (bilan, assurance) — ⚡ l'agrément ignorait les affaires
  directes **à l'étranger** (`702` + `7901` sortait `TOUTE_NATURE` au lieu d'`INCOMPATIBLE_ART_326`) ;
  `resultatHorsExploitation` publiait `0` pour « non mesuré » (désormais `null`) ; AC-6 n'exigeait
  qu'un rattachement quelconque (désormais : le COMPTE DE RÉSULTAT, sans quoi le Bilan se
  déséquilibre) ; surcharges du compte 87, colonne N-1 et libellé « après impôt » non testés ; solde
  N-1 du compte 87 calculé sur une valeur toujours absente (retiré) ; constante D-513-1 qui annonçait
  un déblocage sans condition de version ; prose (interface, README, `690`/`790`, pont de
  solvabilité). Écartés : `6905`/`7905` dans le modèle Vie (reflet de `605`/`705` déjà en place,
  confiance < 80) ; `690`/`790` au CR seul, comme `60`/`70` (un solde là sort en `ANOMALIE` à
  l'articulation, documenté).
- 2026-10-09 — ⑦ revue de sécurité (opus) : **aucune vulnérabilité**. Habilitation toujours au couple
  `code@version` exact ; la bascule d'assurance-service RESTREINT l'accès (octroi `@6.0` seul ⇒ 403,
  voulu) ; pont de balance sans repli sur une version non octroyée ; sha256 recalculé identique dans
  les trois copies ; aucun compte de regroupement capté ; aucune route ni chemin d'erreur ajouté.
- 2026-10-09 — ⑧ les cinq PR rebase-mergées sur `dev` (bilan-service#169, balance-service#131,
  assurance-service#18, platform-catalog-service#31, dossier-service#43), branches supprimées.
  Portes rejouées après revue : bilan 11 854 unit (99,46 / 97,08 / 99,62 / 99,55) + 3 289 e2e,
  assurance 2 153 + 342. **`done`.**

