# STORY-552 : Les indicateurs d'analyse financière — dérivés des masses SYSCOHADA, jamais transposés d'un bilan courant / non courant

Status: done

**Épic :** EPIC-014 — Consultation & export — `bilan-service`
**Service :** `bilan-service` (`:3004`) — nouveau `modules/bilan/analyse`
**Points :** 8 · **Sprint :** S20 · **Complexité :** high
**Origine :** lecture du corpus pédagogique `Image_lecons` (2026-08-28) — les **11 posters
« Comment analyser »** (structure financière, rentabilité, liquidité, solvabilité, BFR et cycle
d'exploitation, flux de trésorerie, croissance, prévisions, risques) constituent, formules et
interprétations comprises, un cahier des charges déjà rédigé.
**Réf. code :** `bilan-production.service.ts` (postes + `coherenceSousTotaux` : `AZ…DZ`, `BZ`, `DZ`) ·
`compte-resultat-production.service.ts` (SIG : `XA…XI`) · `tft-production.service.ts`
**Arbitrage PO :** ✅ **RENDU le 2026-08-28 — VOIE A**, *« voie A oui mais avec suggestion possible pour faciliter »*. La lecture courant / non courant fait l'objet de **STORY-554**, en couche de suggestion déclarée par-dessus.
**Voisine :** **STORY-483** — *le bilan **prévisionnel** ne sépare pas capitaux propres et dettes,
donc aucun ratio bancaire*. Même besoin, sur l'autre bout de la chaîne.

---

## Le fait

La liasse produite porte déjà **toute la matière** d'une analyse financière : les postes d'actif
et de passif, la cascade de sous-totaux du référentiel (`AZ…DZ`), les SIG du compte de résultat
(`XA` marge commerciale → `XI` résultat net) et les flux du TFT. Ce qu'aucune route ne rend,
c'est **le second étage** : marge, valeur ajoutée rapportée au CA, autonomie financière,
liquidité, BFR, DIO/DSO/DPO, capacité de remboursement, TCAM.

Aujourd'hui l'expert-comptable exporte la liasse et refait ces divisions dans un tableur. C'est
la partie du métier que le produit ne couvre pas, et c'est celle qui **fait décider**.

## ✅ L'arbitrage, et ce qu'il a tranché

**Les formules du corpus sont écrites pour un bilan courant / non courant. Le nôtre est en
masses SYSCOHADA. La correspondance n'est pas bijective.**

| Ratio du corpus | Numérateur / dénominateur attendus | Ce que SYSCOHADA a |
|---|---|---|
| Liquidité générale | actif courant / passif courant | actif circulant **+ HAO** + trésorerie-actif / passif circulant **+ HAO** + trésorerie-passif |
| Liquidité réduite | (actif courant − stocks) / passif courant | idem, moins `BB`/`BC` |
| Autonomie financière | capitaux propres / total passif | `CP` / `DZ` — direct |
| Endettement | dettes totales / capitaux propres | dettes financières `DD` **+** passif circulant **+** trésorerie-passif ? |
| Capacité de remboursement | dettes financières / EBE | `DD` / `XD` — direct |

⇒ **Deux voies, et c'est une décision produit, pas technique :**

- **Voie A — masses SYSCOHADA telles quelles.** Les indicateurs sont exacts au sens du
  référentiel et **comparables entre dossiers Prospera**. Ils ne seront pas comparables aux
  benchmarks sectoriels internationaux que les posters citent.
- **Voie B — retraitement en courant / non courant.** Comparables aux benchmarks, mais chaque
  retraitement est un **arbitrage** (l'actif circulant HAO est-il courant ?) que le produit
  ferait à la place du comptable, en silence, dans un chiffre qu'il présente comme un fait.

✅ **ARBITRAGE RENDU LE 2026-08-28 — VOIE A**, avec une nuance que le PO a ajoutée et qui change
la forme sans changer le fond : *« voie A oui **mais avec suggestion possible pour faciliter** »*.

⚡ **Ce que la nuance dit exactement.** Le défaut de la voie B n'a jamais été le retraitement
lui-même — un expert-comptable retraite tous les jours — **c'est le silence**. Un retraitement
**déclaré, sourcé et nommé comme suggestion** n'est pas un chiffre déguisé : c'est un service. Le
produit prend donc les deux bénéfices sans le défaut.

⇒ **Cette story livre la voie A seule : les indicateurs sur masses SYSCOHADA sont LA valeur.** La
lecture courant / non courant est fichée à part — **STORY-554** — pour deux raisons :

1. la voie A est tirable immédiatement et n'a rien à attendre ;
2. la correspondance de retraitement est une **donnée de référentiel sourcée**, exactement comme
   les seuils de STORY-553 — même mécanique, même garde de packaging. Elle n'a pas sa place dans
   le corps du moteur d'indicateurs.

⚠️ **Cohérence avec la règle déjà posée deux fois** (FE-030, FE-031) : *le serveur calcule,
l'écran restitue, et rien n'est déduit qui ne soit dérivable*. Et symétrie avec **STORY-551** :
retraiter est légitime, ne pas le déclarer ne l'est pas.

## Périmètre

**Inclus**

- `GET /dossiers/{id}/bilan/analyse` — les indicateurs dérivés du **dernier jeu d'états**, et
  `POST …/analyse/dry-run` sur des soldes, pour rester symétrique du reste du module.
- Quatre familles, toutes dérivables du couple Bilan + CR **déjà produits** :
  **structure** (autonomie financière, endettement, capacité de remboursement) ·
  **liquidité** (générale, réduite, immédiate) ·
  **rentabilité** (taux de marge commerciale, taux de VA, taux d'EBE, marge nette, ROE, ROA) ·
  **exploitation** (BFR, FRNG, trésorerie nette, DIO, DSO, DPO, cycle d'exploitation).
- Chaque indicateur publie **son numérateur, son dénominateur et les postes qui les composent** —
  un ratio dont on ne peut pas remonter la composition n'est pas auditable, et un expert-comptable
  ne signera rien qu'il ne puisse refaire.
- `null` explicite quand le dénominateur est nul ou le poste absent du référentiel. **Jamais 0.**
- Colonne N-1 quand `soldesN1` est fourni, avec la mention de retraitement de **STORY-551**.

**Hors périmètre**

- **Les seuils d'alerte et l'interprétation** — ils font l'objet de **STORY-553**, et pour une
  raison : un seuil est une donnée qui change par pays, par secteur et par année, jamais une
  constante de code.
- **La lecture courant / non courant** — **STORY-554**. ⛔ Aucun champ de cette story ne doit
  l'anticiper : si le moteur d'indicateurs porte le moindre retraitement, l'arbitrage voie A est
  perdu dans le code avant même d'être implémenté.
- Les indicateurs par action (BPA, PER) et les ratios de marché : aucune donnée du produit ne les
  alimente.
- Les ratios de **flux** (couverture des investissements, cash-flow libre) : ils exigent le TFT,
  qui a son propre chemin de production. À ficher après, si le PO le veut.
- Les référentiels **SFD-BCEAO** et **CIMA** : leurs masses n'ont pas les mêmes postes, et CIMA
  a ses propres ratios réglementaires (marge de solvabilité, STORY-524). Cette story est
  **SYSCOHADA seulement**, et le dit dans sa réponse.

## Critères d'acceptation

1. Chaque indicateur publie `{ valeur, numerateur, denominateur, postes[] }` — la composition est
   toujours remontable.
2. Un dénominateur nul rend `valeur: null` avec un `motif` publié, jamais `0` ni une division
   levant une exception.
3. Un référentiel qui ne déclare pas un poste nécessaire rend l'indicateur `null` avec le poste
   manquant nommé — **pas un indicateur silencieusement faux** (le défaut de STORY-486).
4. Sur un référentiel non SYSCOHADA, la route répond explicitement « non applicable » avec le
   code du référentiel en présence — elle ne rend pas un tableau vide.
5. Aucun indicateur n'est recalculé côté client (règle FE-030/FE-031, non rouverte).
6. Les valeurs sont reproductibles : deux appels sur le même jeu d'états rendent le même
   résultat, et le `stamp` du référentiel est publié avec.

## Notes

- ⚡ **Le corpus n'est pas la source de vérité, il est la liste des besoins.** Ses posters sont
  chiffrés en **dirhams** et bâtis sur un bilan courant / non courant : ce sont ses **questions**
  qu'on reprend, jamais ses formules telles quelles.
- ⚠️ **Les seuils du corpus n'ont ni secteur ni zone** (« marge brute > 40 % », « ROE > 15 % »).
  Les figer serait produire des alertes fausses sur une microfinance comme sur une boutique.
  D'où **STORY-553**.
- ⚠️ **Si le PO veut un module d'analyse à part entière** (et non un second étage de la
  consultation), c'est un épic neuf — **EPIC-142 est le premier libre**. Cette story reste
  volontairement sous EPIC-014 : elle lit la liasse, elle ne crée aucun agrégat persistant.
- ⚡ **Témoin d'acceptation transverse à ajouter quand STORY-554 sera livrée** : le même jeu
  d'états, calculé avec un paquet portant les règles de retraitement et un paquet sans, doit
  rendre **les mêmes valeurs de référence**. C'est la preuve exécutable que la voie A n'a pas été
  contaminée.

---

## Arbitrages PO du 2026-09-30 (rendus avant la première ligne de code)

Posés par la session sur les constats du cadrage, tranchés par le PO :

1. **« Autonomie financière »** — le prévisionnel publie déjà un indicateur de ce nom, avec une
   autre formule (`CP / (CP + dettes financières)`). ⇒ L'analyse publie **`CP / total passif`** sous
   un **code distinct**, pour qu'aucun écran ne confonde deux chiffres homonymes.
2. **Dettes financières** (endettement, capacité de remboursement) ⇒ le **marqueur existant
   `dettesFinancieres`** (emprunts et location-acquisition, STORY-483), **pas** le sous-total `DD`
   qui inclut les provisions pour risques.
3. **Cycle d'exploitation** publié ⇒ **DIO + DSO − DPO** (cycle de conversion de trésorerie).
4. **Désignation des masses** (P7) ⇒ un **nouveau marqueur `masseAnalyse`** dans la table de passage
   SYSCOHADA (patron `bfr` / `dettesFinancieres`). Il change le checksum des artefacts : recopie dans
   `balance-service`, donc **deux dépôts et deux PR jumelles**.

## Progress Tracking

- 2026-09-30 — arbitrages PO rendus (ci-dessus) ; branches `MNV-552` ouvertes (`docs/`,
  `bilan-service`, `balance-service`) ; statut `in_progress`.
- 2026-09-30 — dev (sous-agent `opus`, en worktrees, repris et vérifié en session) : marqueur
  `masseAnalyse` + garde du générateur `exigerMassesAnalyseCoherentes` ; module `bilan/analyse`
  (19 indicateurs, `GET …/bilan/analyse` et `POST …/analyse/dry-run`) ; recopie à l'octet dans
  `balance-service`.

### Décisions de dev (D-552-1..12)

- **D-552-1** — 12 masses (`ACTIF_IMMOBILISE`, `ACTIF_CIRCULANT`, `ECART_CONVERSION_ACTIF`,
  `CAPITAUX_PROPRES`, `DETTES_FINANCIERES_ET_RESSOURCES_ASSIMILEES`, `PASSIF_CIRCULANT`,
  `ECART_CONVERSION_PASSIF`, `VENTES_MARCHANDISES`, `ACHATS`, `VARIATION_STOCKS_ACHATS`,
  `VALEUR_AJOUTEE`, `EXCEDENT_BRUT_EXPLOITATION`) sur des postes de **détail** seulement (48 + `XC`/`XD`
  en @2.1, 45 + `XC`/`XD` en @2.2) ; chaque détail du Bilan porte **soit** une masse **soit**
  `tresorerie` (partition imposée par le générateur). Mesuré : sous @2.1, `AZ` vaut 0 sur une balance à
  `211`/`245` ; la masse recomposée depuis les détails donne 1 500 000 — d'où « jamais les sous-totaux ».
- **D-552-2** — ⚠️ **révision EN PLACE de `@2.1`, `@2.2` et `zone-franche-togo@1.0`**, sans nouvelle
  version, malgré la règle du registre « après STORY-677, toute révision de @2.2 est un bump ». Vérifié :
  cette règle protégeait la **sortie** de la liasse (notes relues sous un paquet qui ne les produit
  plus) ; ici le marqueur est **additif**, la liasse ne change pas d'un octet, `MOTEUR_VERSION` reste
  1.22.0, aucun consommateur ne confronte le checksum du catalogue à celui du paquet embarqué (le
  read-model d'octroi n'en porte pas), et `@2.1` — octroyé à tous — a déjà été révisé ainsi (535, 656).
  Le commentaire du registre est reformulé : « toute révision de @2.2 **qui change la sortie de la
  liasse** est un bump ». L'analyse d'une liasse figée publie `stamp` (paquet lu), `stampLiasse`
  (snapshot) et `memePaquet`. **Décision à confirmer par le PO** (une `@2.3` resterait possible).
- **D-552-3** — capitaux propres = masse (CJ compris) + résultat du CR ; résultat de l'exercice = CR +
  poste de résultat du passif ; les deux alimentés ⇒ `null` (`RESULTAT_NON_AFFECTE`).
- **D-552-4** — dénominateur ≤ 0 ⇒ `null` (`DENOMINATEUR_NUL` / `DENOMINATEUR_NEGATIF`), jamais 0.
- **D-552-5** — jours = `regles.baseJoursAnnee` (360) × mois / 12, durée propre à chaque colonne ;
  durée inconnue ⇒ `null` (`DUREE_EXERCICE_INCONNUE`), jamais une année présumée ; cycle = DIO + DSO −
  DPO sur les valeurs publiées.
- **D-552-6** — assiettes : DIO = stocks / (achats + variation des stocks d'achats) ; DPO = fournisseurs
  / achats ; DSO = clients / CA ; montants tels que la liasse les porte (créances TTC, CA HT) — **à faire
  valider par un expert-comptable**, la formule publiée le dit.
- **D-552-7** — colonne N-1 du Bilan qui ne retombe pas sur son total ⇒ indicateurs N-1 `null`
  (`COLONNE_N1_INCOMPLETE`) — cf. constat ouvert ci-dessous.
- **D-552-8** — arrondi exact à 2 décimales (`bigint`, demi-unité éloignée de zéro).
- **D-552-9** — cascade des SIG non réconciliée ⇒ VA, EBE et capacité de remboursement `null` en N.
- **D-552-10** — sans `exercice`, le jeu dont la fin d'exercice est la plus récente ; aucun ⇒ 404
  `JEU_ETATS_INTROUVABLE` ; `?version=` passe par `consulterVersion` (empreinte revérifiée).
- **D-552-11** — `methodeN1` (STORY-551) repris de la liasse quand elle porte un comparatif.
- **D-552-12** — le dry-run a son corps (`AnalyseDryRunRequestDto`, bornes de `BilanDryRunRequestDto`,
  `soldesN2` refusé) et réutilise `BilanEngineService.produireEtatsAnalysables` (un seul paquet).

### Validation

- **Portes** (arbres principaux, état final) : bilan-service lint 0 · build OK · 286 suites / 10 652
  unitaires + 2 512 e2e · couverture 99,41 / 96,97 / 99,62 / 99,5 ; balance-service lint 0 · build OK ·
  228 suites / 4 715 unitaires + 1 238 e2e · couverture 99,2 / 93,05 / 98,74 / 99,31. Régénération des
  artefacts par `build.mjs` : **0 octet modifié** (reproductible) ; artefacts identiques à l'octet entre
  les deux dépôts.
- **Mutations — rejouées par la session sur l'arbre principal : 19/19 compilables tuées**
  (`tmp/mutations-552/`, `resultats-principal.txt`) : dénominateur nul, stocks ajoutés, trésorerie et
  écarts de conversion omis, lecture de `AZ`, applicabilité par la zone, durée N sur N-1,
  `@RequiresDossierScope` et `@LectureSeule` neutralisées (réécrites compilables), SIG, résultat non
  affecté, colonne N-1 incomplète, marqueur absent compté 0, arrondi tronqué, CP sans résultat, choix du
  jeu par libellé, dénominateur négatif, année présumée. Plus, côté sous-agent : B1/B2 (octets et
  checksum de `balance-service`) et G1–G8 (gardes du générateur, dans un bac isolé).
- **Revue de code** (opus) : 0 défaut de calcul ni de classement (partition vérifiée poste par poste,
  arbitrages PO respectés) ; **2 corrigés** — branche morte `versionServie` et son test, décomptes faux
  dans les commentaires.
- **Revue de sécurité** (opus) : **0 constat** — routes scopées tenant + dossier (fail-closed), 404
  partout, `exercice` au charset fermé, `version` entier, corps borné, artefacts vérifiés au chargement.
- **Vérification docker sur stack NEUVE, état final** (`tmp/verif-docker-552/`, bilan `3c5e6e1`, balance
  `d26e2b5`) : **163 OK, 0 KO**. Liasse `syscohada-revise@2.2` avec comparatif figée ⇒ `GET …/analyse` :
  19 indicateurs calculés, **numérateur et dénominateur de chacun recomposés hors du service depuis ses
  postes, valeur recalculée** (N et N-1) ; cycle = DIO + DSO − DPO ; `stampLiasse` = tampon du snapshot ;
  deux GET identiques ; `?version=1` identique ; dry-run sans CA ⇒ `null` + `DENOMINATEUR_NUL` ; sans
  exercice ⇒ `DUREE_EXERCICE_INCONNUE` ; cabinet octroyé SFD ⇒ `NON_APPLICABLE` `sfd-bceao`,
  `indicateurs: null` ; cabinet B sur le dossier de A ⇒ **404** ; aucune écriture en base.
  ⚠️ Une première passe : 1 KO venu du **scénario** (dry-run sans dates : la durée est jugée avant le
  dénominateur) — attente corrigée, stack neuve rejouée.
- 2026-09-30 — `balance-service#122` (`69bd878`, `1e86316`) puis `bilan-service#150` (`752d50a`,
  `58a0377`, `ab4e80d`) rebase-mergées ensemble sur `dev`, branches supprimées ; statut `done`.

### Constats ouverts (hors périmètre, à ficher)

- ⛔ **Défaut préexistant de la liasse** : `BilanProductionService.emettreActif`/`emettrePassif` ne
  parcourent que les postes **présents en N** — un poste soldé en N perd son montant N-1 dans la colonne
  comparative publiée, alors que `controle.totalActifN1` le compte. L'analyse le détecte
  (`COLONNE_N1_INCOMPLETE`) ; le Bilan N-1, lui, reste silencieusement incomplet. **Story à ficher.**
- La cascade des SIG n'a pas de contrôle de réconciliation en colonne N-1.
- D-552-2 (révision en place de `@2.2`) à confirmer par le PO ; D-552-6 (assiettes DIO/DPO/DSO) par un
  expert-comptable.

