# TICKET-BACKEND — bilan-service : les comptes d'amortissement et de dépréciation (`28`, `29`, `39`, `49`, `59`) ne sont rattachés à aucun poste des paquets SYSCOHADA révisé ; une balance réelle sort la liasse déséquilibrée

**Cible :** `prospera-bilan-service` (tenu par D au lot 6, D-L6-5) — tables de passage des paquets SYSCOHADA révisé
**Ouvert par :** STORY-1078 (D, 2026-11-25), constat de D-1078-5, vérifié au code et sur un cas chiffré
**Priorité :** **Must** avant toute liasse d'un client réel — rien ne plante, mais toute entité qui amortit un bien a une
liasse `valide: false`, que le cabinet ne peut déposer sans poser des surcharges compte par compte
**État :** **corrigé** par STORY-1118 le 2026-11-25 — prospera-bilan-service#189, `dev` **`b6f2d49`** (tables, plans,
garde) et **`5055933`** (e2e). Constat d'origine : STORY-1078 (D-1078-5), non corrigé dans 1078 (hors de son périmètre).

---

## Le constat

Le moteur (`BilanProductionService`, STORY-059) rattache un compte à un poste **par préfixe**, et seulement par la table
de passage du paquet (invariant P7 : aucune convention SYSCOHADA dans le code). Les quatre paquets SYSCOHADA révisé
(`syscohada-revise@2.1`, `@2.2`, `@2.3`, `zone-franche-togo@1.0`) ne déclarent **aucun** préfixe `28`, `29`, `39`, ni `49`
ou `59` hors `499` et `599` (provisions, au passif) : relevé sur les 126 lignes de la table, 2026-11-25.

Le paquet **dit pourtant la règle** : `regles.NET_ACTIF` = « poste actif = somme soldes bruts debiteurs -
amortissements(28)/depreciations(29,39,49,59) ». La règle est écrite, la table ne la câble pas. Le code le dit aussi
(`src/modules/bilan/etats/bilan-production.service.ts`, JSDoc de la classe) : « La "convention miroir" SYSCOHADA
(rattacher les comptes `28xx` non mappés) exigerait d'étendre le référentiel (tech-spec B8) → hors périmètre ».

Conséquence : un compte `28xx` créditeur n'atteint aucun poste. Il part en `comptesNonMappes`, la colonne « Amort./Dépréc. »
du poste reste à 0 (Brut = Net), l'actif est surévalué de tout l'amortissement cumulé, et le bilan est **déséquilibré**
de ce montant.

## Le cas chiffré (moteur réel, artefacts embarqués, 2026-11-25)

Balance équilibrée (débits 1 200 000 = crédits 1 200 000) :

| Compte | Débit | Crédit |
|---|---:|---:|
| `2441` Matériel | 1 000 000 | |
| `28441` Amortissements du matériel | | 400 000 |
| `101` Capital | | 800 000 |
| `5711` Caisse | 200 000 | |

Attendu (AUDCIF art. 47 : amortissements « inscrits distinctement à l'actif en diminution de la valeur brute ») : poste
`AM` brut 1 000 000, amort. 400 000, net 600 000 ; actif 800 000 = passif 800 000.

Produit par `BilanProductionService.produire`, **identique sur les quatre paquets** :

- `AM` brut 1 000 000, amort. **0**, net **1 000 000** ; `BS` 200 000 ;
- `controle` : `totalActifN` **1 200 000**, `totalPassifN` 800 000, `ecartN` **400 000**, `equilibreN` **false** ;
- `comptesNonMappes` : `["28441"]`.

Contre-épreuve : avec une surcharge d'organisation (STORY-400) `RACINE 2844 → BILAN_ACTIF|AM`, le même jeu rend `AM`
1 000 000 / 400 000 / 600 000, `ecartN` 0, `equilibreN` true, aucun compte non mappé. Le moteur sait donc porter
l'amortissement ; seul le rattachement manque (la cible d'une surcharge doit être `BILAN_ACTIF`, pas `BILAN`).

## Impact

- **Validation et dépôt** : `EQUILIBRE_BILAN` et `COMPTES_NON_AFFECTES` sont **bloquants** (`controles-coherence-production.service.ts`)
  ⇒ `valide: false`, gate de dépôt fermé, pour toute balance portant un amortissement, une dépréciation d'immobilisation,
  de stock (`39`), de créance (`491`…) ou de titre (`590`). Le cabinet doit poser une surcharge par racine, à la main.
- **Colonnes DSF** : la colonne « Amort./Dépréc. » de l'actif SYSCOHADA est structurellement nulle (déjà mesuré par
  STORY-434, 438 et 528 : « Story bilan-service à ficher » — elle ne l'avait jamais été) ; les notes d'immobilisations
  (Note 3) et le TFT (flux d'investissement) en héritent.
- **Indicateurs d'analyse** (STORY-552) : l'actif immobilisé est surévalué de l'amortissement cumulé. Sur le cas ci-dessus,
  FRNG publié = 800 000 − 1 000 000 = **−200 000** au lieu de **+200 000** ; le poids des capitaux propres, la liquidité,
  etc. sont faussés dans le même sens.
- **Identité du fonds de roulement** (STORY-1078) : elle rend honnêtement `INDETERMINE` (`BILAN_DESEQUILIBRE`) sur ces
  liasses — le contrôle ne se lit jamais sur une balance réelle tant que le rattachement manque. Le contrôle
  « amortissements supérieurs au brut » de 1078 n'est **pas** touché : il lit les soldes de la balance, pas la liasse
  (D-1078-5).
- **Hors SYSCOHADA** : `cima-assurances` rattache `28` (poste `CA1`) et `sfd-bceao` rattache `29` (`BA2`) : non concernés.
  `smt-togo@1.0` a le **même défaut** (28 lignes, aucun préfixe `28`/`29`/`39`, seulement `499` et `599`) : à traiter
  dans la même story.

## Ce qui est demandé (une story de `bilan-service`)

1. **Déclarer la contrepartie dans le paquet**, jamais dans le code (P7) : pour chaque poste d'actif `NET_ACTIF`, les
   préfixes d'amortissement et de dépréciation qui le minorent (`2811` → `AE`, `2812`/`2813` → `AF`, … `2844` → `AM`,
   `291`…`297` → leurs postes ; `39x` → stocks, `491` → clients, `590` → titres), sourcés au plan de comptes du
   SYSCOHADA révisé et au Guide d'application (p. 78, 81 ; AUDCIF 45-47). Les préfixes longs gagnent déjà sur les courts
   (résolution au préfixe le plus long) : aucun changement du moteur n'est attendu, à vérifier par spec.
2. **Révision des quatre paquets SYSCOHADA révisé et de `smt-togo@1.0`** (nouvelle version ou révision en place, à décider : la liasse produite **change**, donc
   les snapshots opposables et `MOTEUR_VERSION` sont concernés — précédent STORY-434) ; recopie à l'octet dans
   `balance-service` demandée à C (D-L6-5).
3. **Preuves** : le cas chiffré ci-dessus en spec sur les vrais paquets (équilibre, colonne Amort, Note 3), le fixture
   e2e de `bilan-export` mis à jour, et une liasse témoin réelle (balance du pack) qui passe `EQUILIBRE_BILAN`.

## Sources

- Code : `src/modules/bilan/etats/bilan-production.service.ts` (`appliquer` : Brut = Σ débit, Amort = Σ crédit des comptes
  rattachés), `src/modules/bilan/table-de-passage/table-de-passage.service.ts` (`mapComptes`, préfixes),
  `src/modules/bilan/etats/controles-coherence-production.service.ts` (`COMPTES_NON_AFFECTES`, `EQUILIBRE_BILAN`),
  `scripts/referentiels/sources/table-de-passage-syscohada*.json` (`regles.NET_ACTIF`) — `origin/dev` 8bebeb5.
- Fiches : STORY-059 (convention miroir écartée, tech-spec B8), STORY-434, STORY-438, STORY-528 (§ Hors périmètre),
  STORY-548, STORY-1078 (D-1078-5).
- Textes : AUDCIF 2017, art. 45-47 ; Guide d'application du SYSCOHADA révisé, p. 78 et 81 (ohada.com).

- 2026-11-25 — **placé en STORY-1118** par la session de groupe de D (réservée au tracker, marque haute montée à STORY-1118) ; passe avant STORY-1079.
- 2026-11-25 — **corrigé par STORY-1118** (prospera-bilan-service#189, `dev` `b6f2d49`, `5055933`) : les cinq tables
  rattachent 28, 29, 39, 49 (hors 499) et 59 (hors 599) au poste de leur actif (subdivision « à l'image », Guide
  p. 68) ; le cas chiffré ci-dessus rend `AM` 1 000 000 / 400 000 / 600 000, actif 800 000 = passif 800 000, aucun
  compte non mappé, FRNG +200 000, identité du fonds de roulement `OK`. Révision en place (D-1118-5) ; garde de
  packaging `gardes-nomenclature.mjs`. Recopie dans `balance-service` demandée à C (ticket de recopie de 1076).
