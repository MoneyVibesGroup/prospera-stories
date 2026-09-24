# STORY-534 : L'inventaire de clôture — le seul chiffre qu'un cahier ne peut pas produire, et sans lequel la marge est fausse

Status: review

**Épic :** EPIC-020 — Cahiers & rattachement (Atelier Balance)
**Service :** `balance-service` (`:3007`) — module `inventaire` (nouveau)
**Points :** 8 · **Sprint :** S20
**Complexité :** high — une **cinquième origine** de balance entre dans la chaîne des balances dérivées (brute → inventaire → dotations → provisions)
**Prérequis :** **STORY-532** (les bornes de l'exercice) — un inventaire est daté à la **clôture**, et la liasse ne connaît pas sa date de clôture.
**Origine :** §8.1 de `analyse-scalabilite-multireferentiel-2026-08-27.md`, validé par le PO le 2026-08-28. **Geste ① sur trois.**

---

## Le fait, et sa portée exacte

Le produit le dit déjà, en toutes lettres, dans l'onglet Rattachement :

> *« Il n'y a ici aucun compte de classe 1, 2 ou 3 — c'est normal, et ce n'est pas suffisant. Un
> cahier n'enregistre que des flux : ni capital, ni immobilisations, **ni stocks** — ils ne se
> déduisent d'aucune recette. »*

⇒ **Sans inventaire, la marge brute d'un dossier commercial tenu aux cahiers est fausse.** Et rien
ne le signale : la balance reste équilibrée, la liasse se calcule, tous les contrôles passent.

⚡ **Portée : uniquement la persona « cahiers ».** Un export Sage, une reprise d'à-nouveaux ou une
saisie directe portent déjà les comptes de classe 3 et la variation — le client a fait son
inventaire, il est dans les soldes. **Cette story ne touche pas ces trois chemins.** C'est ce qui la
rend petite, et c'est pourquoi elle remplace `stock-service` pour la vente cabinet : un cabinet
arrête des comptes, il ne pilote pas un stock.

## ⚠️ Le piège : les deux familles ont des conventions OPPOSÉES

| Famille | Comptes | Variation | Sens si le stock augmente |
|---|---|---|---|
| Biens **achetés** (marchandises, matières, approvisionnements) | `603x` | **SI − SF** | **crédit** de `603x` (la charge diminue) |
| Biens et services **produits** (en-cours, produits finis) | `73x` | **SF − SI** | **crédit** de `73x` (le produit augmente) |

Un moteur qui applique la même formule aux deux **inverse le signe d'une des deux**, et l'erreur ne
déséquilibre rien : elle déplace du résultat.

## Critères d'acceptation

- [ ] AC-1 — Saisie, par compte de **classe 3 du référentiel du dossier** : **stock initial** et
      **stock final**, à la date de clôture de l'exercice. Les comptes proposés viennent du
      référentiel du **dossier** (doctrine STORY-422), jamais d'une liste codée.
- [ ] AC-2 — La variation est **calculée**, jamais saisie, et porte **sa formule et son compte de
      contrepartie** (`603x` ou `73x`) — même exigence que les écritures d'impôt.
- [ ] AC-3 — ⛔ **Les deux conventions de signe sont testées dans les deux sens** : stock qui monte
      et stock qui descend, pour un bien acheté **et** pour un bien produit. Quatre cas, quatre
      assertions. C'est le test de cette story.
- [ ] AC-4 — Le **stock initial est pré-rempli depuis la balance d'ouverture** quand elle existe
      (reprise d'à-nouveaux), et **un écart entre les deux est signalé, jamais corrigé d'office**.
      Un stock initial qui ne correspond pas au stock final de l'exercice précédent est une
      information, pas une faute de frappe à écraser.
- [ ] AC-5 — L'inventaire produit des lignes de balance par le **même mécanisme que les provisions
      fiscales** : **dry-run par défaut**, écriture sur acte explicite, **nouvelle version** de
      balance. On n'écrase jamais, on empile.
- [ ] AC-6 — La **dépréciation des stocks** (`39x`) est **proposable et jamais appliquée d'office** :
      c'est un jugement, au même titre que l'affectation du résultat et la provision pour perte de
      change.
- [ ] AC-7 — Les montants portent leur **devise** (STORY-489). Aucune constante `XOF`.
- [ ] AC-8 — ⚠️ Un référentiel **sans classe 3 marchande** (`sfd-bceao`, `cima-assurances`) rend
      l'écran **non applicable et le dit**, plutôt que de proposer une saisie sans objet.

## Ce que cette story NE fait PAS

- Ni entrées/sorties, ni lots, ni valorisation CUMP, ni inventaire permanent : c'est
  **`stock-service`** (EPIC-075→084, vertical distributeur), et il n'est **pas** tiré pour la vente
  cabinet.
- Elle ne touche pas les dossiers dont la balance vient d'un export, d'une reprise ou d'une saisie
  directe. **Non-régression obligatoire** — c'est la majorité des dossiers.

## Le fait, mesuré dans le code (cadrage du 2026-09-24)

- **M1 — Rien n'existe, et l'avertissement le dit.** Aucune route ne saisit un stock. L'agrégation
  des cahiers publie à chaque appel `AVERTISSEMENT_INVENTAIRE` : *« Aucune écriture d'inventaire
  (variation de stocks, amortissements, provisions) n'est produite depuis les cahiers : elles restent
  à saisir manuellement (hors v1) »* — alors que les dotations (STORY-528) et les provisions
  (STORY-094) ont depuis leur route.
- **M2 — Le mécanisme d'AC-5 existe deux fois, et il n'y en a qu'un.** Provisions (STORY-094) et
  dotations (STORY-528) : une **base** relue (`lignesNormalisees`), des écritures projetées
  (`versLignesProvision`), fusionnées (`fusionnerParCompte`), soumises par `BalanceService` — un seul
  chemin de soumission, les mêmes contrôles (plan, équilibres, devise), le même `balance.created`. Une
  balance dérivée porte une **origine** et son `balanceSourceId`.
- **M3 — Les origines sont un inventaire VERROUILLÉ.** `ORIGINES_BALANCE` = `A_NOUVEAUX`,
  `PROVISIONS_FISCALES`, `PORTEFEUILLE_SFD`, `AMORTISSEMENTS` ; un test d'inventaire
  (`creances-dettes-devises.mono-devise.spec.ts`) exige une décision pour toute cinquième. Les lectures
  qui les filtrent : base fiscale (`ORIGINES_HORS_BASE_FISCALE`), gel du cahier et clôture
  (`ORIGINES_HORS_BALANCE_COMPLETE`), agrégation (le socle seul). `balance.created` ne porte **pas**
  l'origine et `bilan-service` ne la lit nulle part : **un seul dépôt**, aucun contrat d'événement.
- **M4 — L'ordre de la chaîne est une contrainte, pas un choix.** STORY-528 a dû exclure la balance
  dotée de SA propre base (`horsDotations`) : sinon la publication suivante mesurait son « déjà porté »
  sur ses propres écritures (constat de revue). Une balance d'inventaire posée PAR-DESSUS les dotations
  rejouerait exactement ce défaut à la re-publication suivante.
- **M5 — Aucun artefact ne dit « ce stock varie dans ce compte ».** Mesuré dans les artefacts
  embarqués :
  - `syscohada-revise@2.1` (SN) et `smt-togo@1.0` (SMT) : classe 3 de `31` à `39` **à deux chiffres**,
    `6031`/`6032`/`6033`, et **`73` à deux chiffres seulement** (ni `734` ni `736`) ; **ni `659` ni
    `759`** — les comptes de la dépréciation des stocks ; `38` (« en cours de route, en consignation
    ou en dépôt ») ne dit pas la famille du bien ;
  - `sfd-bceao@2.0` : la classe 3 est celle des **opérations diverses** (titres de placement,
    débiteurs divers…) et **`603` y est « Charges sur opérations sur titres »** — mais le plan porte
    `3221` « Stocks de marchandises » et `612` « Variations de stocks » (une activité marchande
    accessoire) ;
  - `cima-assurances@5.0` : la classe 3 porte les **provisions techniques**, et **`73` y est
    « Réductions et ristournes de primes »**.

  ⇒ une règle « 31 → 6031, 3x → 73 » par préfixe écrirait une variation de stocks dans une commission
  sur titres (SFD) ou une ristourne de primes (CIMA).
- **M6 — La persona « cahiers » se lit sur la base.** L'agrégation soumet sous
  `SOURCE_BALANCE_CAHIERS` (`'ocr'`), la seule source qui gèle la saisie (D-082-3) ; l'ingestion
  directe n'accepte que `direct`, et le dépôt générique (`POST /balances`) prend la source que
  l'appelant **déclare** — la persona est donc celle que la balance déclare, exactement comme le gel du
  cahier l'entend déjà. Le socle d'ouverture hérite la source de l'exercice précédent, mais il n'est
  jamais une base.
- **M7 — La balance d'ouverture porte le stock initial, quand elle existe.** Le socle `A_NOUVEAUX` de
  l'exercice (`trouverSocleANouveaux`) reprend la classe 3 de la clôture précédente — et l'agrégation le
  fusionne dans la balance des cahiers. Sans reprise d'à-nouveaux, une balance des cahiers n'a **aucun**
  compte de classe 1 à 3 : pas de contrepartie de capitaux pour un stock d'ouverture.
- **M8 — Le patron « proposé, jamais appliqué » existe** : `proposerProvision` (STORY-495) —
  `appliquee: false`, `ecritureProposee: null`, `motifSansEcriture` quand l'artefact ne porte pas le
  compte de charge.

## Les décisions (cadrage du 2026-09-24)

- **D-534-1 — Une origine `INVENTAIRE`, bâtie sur la base BRUTE, AVANT les dotations.** La chaîne
  devient : balance brute → **inventaire** → dotations → provisions. La base de l'inventaire exclut les
  dérivées (`A_NOUVEAUX`, `PROVISIONS_FISCALES`, `PORTEFEUILLE_SFD`, `AMORTISSEMENTS`, `INVENTAIRE`) ;
  les dotations continuent d'exclure leur seule origine, donc prennent la balance d'inventaire pour base
  quand elle est la plus récente ; les provisions partent de la dernière. `trouverDerniereBaseFiscale`
  reçoit la **liste** des origines à exclure (au lieu du booléen `horsDotations`). La balance
  d'inventaire est **complète** et **base fiscale** : elle gèle le cahier une fois validée et sert la
  liquidation, comme la balance dotée. Appliquer l'inventaire après coup rend les dérivées en place
  **périmées** : `DOTATIONS_A_REAPPLIQUER`, `PROVISIONS_FISCALES_A_REAPPLIQUER`.
- **D-534-2 — La saisie voyage dans le corps ; la balance est le seul enregistrement.** Aucune
  collection nouvelle. Chaque compte produit **les deux écritures de l'inventaire intermittent** —
  annulation du stock initial (`D` variation / `C` stock), constatation du stock final (`D` stock /
  `C` variation) — si bien que les deux chiffres saisis restent **lisibles dans les mouvements** de la
  balance d'inventaire. Deux routes : `GET /dossiers/:dossierId/inventaire` (le **canevas** : comptes
  proposés, stock initial pré-rempli, applicabilité) et `POST /dossiers/:dossierId/inventaire/appliquer`
  (**aperçu par défaut**, `dryRun=false` écrit).
- **D-534-3 — La table des variations est PAR TAG** (patron `COMPTES_REPRISE`) : SN et SMT —
  `31`→`6031`, `32`→`6032`, `33`→`6033` (biens **achetés**), `34`–`37`→`73` (biens **produits**) ;
  `SFD-BCEAO` et `CIMA` — **non applicables**, motif nommé (AC-8). Un compte saisi est rattaché à sa
  famille par le **plus long préfixe**, et doit être un compte de détail **du plan du dossier** ; le
  compte de variation aussi, vérifié à l'exécution. Un test confronte la table aux artefacts embarqués
  des deux tags.
- **D-534-4 — La variation porte sa convention, et l'effet sur le résultat est publié.** Par compte :
  `SI − SF` pour un bien acheté, `SF − SI` pour un bien produit, la formule en clair, le compte de
  contrepartie, et `effetResultat = SF − SI` (signé : `+` = le résultat monte, dans les deux familles).
  Les quatre cas d'AC-3 sont testés sur le **sens de l'écriture nette** et sur l'effet.
- **D-534-5 — L'écart d'ouverture est mesuré, jamais corrigé** (AC-4). La variation se calcule sur le
  stock initial **saisi** — c'est lui qui rend la marge juste. Quand la balance de base porte autre
  chose pour ce compte, l'écart est publié ligne par ligne, avec le solde que le compte de stock aura
  **après** l'inventaire (`ECART_STOCK_INITIAL`) : le rattraper exigerait une écriture de capitaux,
  c'est-à-dire une reprise d'à-nouveaux. Deux autres oublis se signalent sans rien refuser : un compte
  de stock porté par la base et **absent de la saisie** (`STOCK_EN_BALANCE_NON_INVENTORIE`), une
  **variation déjà en balance** (`VARIATION_DEJA_EN_BALANCE` — le double comptage qui ne déséquilibre
  rien).
- **D-534-6 — La persona « cahiers » seule.** Une base qui n'est pas de source
  `SOURCE_BALANCE_CAHIERS` rend le canevas **non applicable** (`BALANCE_HORS_CAHIERS`) et refuse
  l'écriture : un export Sage, une ingestion directe ou une saisie portent déjà leurs stocks — non-régression.
- **D-534-7 — La dépréciation (`39`) est proposée, jamais écrite** (AC-6). Une **valeur actuelle**
  facultative par compte donne un montant de référence (`SF − valeur actuelle`, si positif) au statut
  `A_DECIDER` ; `appliquee: false`, `ecritureProposee: null`,
  `motifSansEcriture: COMPTES_DEPRECIATION_NON_PACKAGES` (`659`/`759` absents de l'artefact).
- **D-534-8 — Le reste est celui des dotations.** NOP au checksum **sur la même base** ; numérotation
  au-delà de toute la lignée (`derniereVersionDeLaLignee + 1`, M6 de STORY-528) ; une balance
  d'inventaire plus récente que sa base est **remplacée** même quand rien n'est à écrire ; gel
  (`exigerExerciceModifiable`) sur l'aperçu comme sur l'écriture ; montants en unités mineures de la
  **devise de la base** (`projeterDevise`), aucune constante `XOF` (AC-7) ; la date d'inventaire est la
  **fin** de l'exercice de la balance.
- **D-534-9 — L'avertissement de l'agrégation cesse de dire « hors v1 »** pour la variation de stocks :
  il nomme le geste (l'inventaire de clôture), comme pour les dotations et les provisions.

## Hors périmètre — hooks inertes documentés

- **Pré-remplir le stock FINAL** depuis la dernière application : les deux chiffres restent lisibles
  dans les mouvements de la balance d'inventaire, relativement à sa base (D-534-2) — rien n'est à
  migrer le jour où l'écran le demande.
- **`38` — stocks en cours de route** : la famille suit le bien, que le plan à deux chiffres ne dit pas.
  Refusé à la saisie (`FAMILLE_NON_DETERMINABLE`), listé au canevas.
- **SFD** : `3221`/`612` existent pour une activité marchande accessoire ; non applicable en v1 (un SFD
  ne tient pas de cahiers — sa balance vient de l'ingestion et de `microfinance-service` — et la
  convention de `612` n'est pas sourcée).
- **L'écriture de la dépréciation** (`6593`/`7593`) et la **reprise** d'une dépréciation antérieure :
  comptes non packagés.
- **Le rattrapage de l'écart d'ouverture** : c'est la reprise d'à-nouveaux (STORY-087).
- **Le contrôle `COHERENCE_STOCKS`** : STORY-535. **L'écran** : FE-084.
- ⚠️ **Constat de revue, PRÉ-EXISTANT (hors diff) — la ré-application des provisions peut échouer
  en 409.** Les provisions numérotent par `nextVersion`, qui ne compte que les balances SANS
  origine (`provisions.service.ts:531/557` → `findLatest` filtre `origine: { $exists: false }`) :
  une ré-application dont le contenu CHANGE sur une base brute inchangée recalcule la version
  qu'occupe déjà la balance provisionnée précédente, et `submit` rend alors l'existante ⇒ 409
  `VERSION_BALANCE_CONCURRENTE` à chaque essai, tant qu'aucune nouvelle balance brute n'existe.
  L'avertissement `PROVISIONS_FISCALES_A_REAPPLIQUER` (ici, et depuis STORY-528 pour les dotations)
  invite donc à un geste qui échoue dans ce cas. Établi par LECTURE du code, non rejoué en docker.
  Piste : numéroter les provisions au-delà de toute la lignée (`derniereVersionDeLaLignee + 1`, le
  M6 de STORY-528). **À reprendre dans une story dédiée** — la corriger ici toucherait le moteur
  fiscal de STORY-094, hors du périmètre de cette story.

## Notes

- Voir [[STORY-535]] (le contrôle qui rend l'oubli visible), [[FE-084]] (l'écran et la phrase),
  [[STORY-532]], `analyse-scalabilite-multireferentiel-2026-08-27.md` §8.1.

## Progress Tracking

- 2026-09-24 — branche `MNV-534` ouverte sur `docs/` ; statut `ready-for-dev` → `in_progress`.
- 2026-09-24 — **cadrage fait avant tout code** : 8 constats mesurés (dont M5 : la table SN appliquée
  par préfixe écrirait une variation de stocks dans une commission sur titres SFD ou une ristourne de
  primes CIMA), 9 décisions. Un seul dépôt : `balance.created` ne porte pas l'origine.
- 2026-09-24 — **dev `balance-service`** (commits `1f3931f`, `55a1799`, branche `MNV-534`, PR #118) : module
  `inventaire` (canevas `GET …/inventaire`, application `POST …/inventaire/appliquer`, aperçu par
  défaut) ; 5ᵉ origine `INVENTAIRE` ; `trouverDerniereBaseFiscale` prend la LISTE des origines exclues
  (les dotations passent `[AMORTISSEMENTS]`, l'inventaire `[AMORTISSEMENTS, INVENTAIRE]`) ;
  `versDtoCanonique` des dotations exporté plutôt que recopié ; verrou d'inventaire des origines, énumération
  OpenAPI `OrigineBalance` et liste des routes à 422 mis à jour ; l'avertissement de l'agrégation nomme le
  geste (D-534-9). Portes : lint 0, build, `test:cov` 4 659 tests (99,2 / 93,03 / 98,73 / 99,3 ; module
  `inventaire` 100 / 98,07 / 100 / 100, `inventaire.regles.ts` 100 % partout) — ⚠️ 3 tests de COÛT
  (STORY-527/528) rouges sous une charge machine de 139 (conteneurs `zedeca-*` d'un autre projet),
  repassés seuls à charge 18 : 82/82, **seuils inchangés** ; e2e 31 suites / 1 230 (dont
  `inventaire.e2e-spec.ts` : ValidationPipe de production, plan RÉEL, scope dossier). **27 mutations,
  toutes rouges** — dont un mutant ÉQUIVALENT (M23 : le contrôleur testait un `balanceId` que le service
  garantit ; la condition morte est retirée, M23b rouge) et une reformulation (M17 ne compilait pas).
- 2026-09-24 — **vérification docker sur stack NEUVE** (`down -v`), tout par les API réelles :
  67 contrôles, 0 échec. Reprise d'à-nouveaux 2025 → 2026 (31 et 245100 reportés) → cahiers (vente,
  achat de marchandises) → agrégation (base brute `ocr` v1, l'avertissement nomme le geste) → canevas
  (31 pré-rempli à 100 000 000 depuis le socle, 38/39 dits) → aperçu sans écriture → application :
  `INVENTAIRE` v2 chaînée à la BRUTE, SI et SF lisibles dans les mouvements du 31 relativement à la base,
  6031 et 73 créditeurs, rien sur 39, équilibrée, `balance.created` à l'outbox → NOP à l'identique →
  **dotations v3 bâties SUR l'inventaire** → nouvelle application : `DOTATIONS_A_REAPPLIQUER`, v4 bâtie
  sur la BRUTE (jamais sur la dotée), dotations republiées v5 sur v4 → balance directe : canevas
  `BALANCE_HORS_CAHIERS`, 409, aucune écriture → cabinet B : 404 → v4 validée : inventaire 409
  `BALANCE_VALIDEE_IMMUABLE`, cahier figé (409). ⚠️ Premier passage : deux défauts du SCRIPT, pas du
  code — lignes de balance non triées (le checksum canonique trie par compte : 400) et une requête Mongo
  en ligne coupée en deux par les accolades de bash 3.2 (la garde d'arité de `egal` l'a signalée).
  `docker compose stop` ensuite. Statut → `review`.
- 2026-09-24 — ⑥ **revue de code** (scan `opus` + lentille `ponytail-review` ; synthèse en session,
  commit dédié `33c811d`) : **0 défaut de justesse** dans le code — conventions de signe, écritures,
  chaîne des dérivées, NOP, numérotation, contrat publié vérifiés un à un ; **3 constats non
  bloquants**, trois trous de test prouvés par des mutants survivants et REJOUÉS en session :
  une correction sur la MÊME base (autre contenu) n'était couverte par aucun test (mutant « NOP sur la
  base seule » vert : la correction n'aurait jamais été écrite) ; le gel n'était testé que sur
  l'aperçu (mutant « gel sur l'aperçu seulement » vert — `submit` ne voit que `estClos`, jamais une
  balance validée) ; la provenance des libellés (F-420-1) n'était lue ni à l'aperçu ni à l'écriture.
  Trois tests ajoutés, **6 mutants rouges** (MR1, MR2, MR3, MR3b, et M1/M2 rejoués après la
  suppression ci-dessous). Lentille ponytail : `sensVariation` (déductible du signe de
  `effetResultat` et des écritures) et `compteDepreciation` du canevas (doublon de l'entrée `39`)
  retirés du contrat avant toute consommation. Écartés, tracés : 14 points dont le constat
  pré-existant sur la numérotation des provisions (cf. hors périmètre).
