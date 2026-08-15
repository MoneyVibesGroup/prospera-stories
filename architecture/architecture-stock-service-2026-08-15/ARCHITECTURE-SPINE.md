---
name: 'stock-service'
type: architecture-spine
purpose: build-substrate
altitude: feature
paradigm: 'modules NestJS sur le moule commun Prospera — module du vertical Distributeur, relying-party de l''IdP, producteur d''événements, **quatrième adaptateur de la balance canonique**'
scope: 'micro-service stock-service — entrepôts et magasins propres, stock détenu par mouvements append-only, lots et dates limites, valorisation CUMP configurable, publication comptable au hub balance, seuils et ruptures, capital dormant, inventaire, transferts, stock du réseau détaillant'
status: 'final — 7 arbitrages PO du 2026-08-15 ; ils AMENDENT le PRD sur 6 points, RÉPONDENT à ses 4 questions ouvertes, et imposent 2 stories HORS de ce service'
created: '2026-08-15'
updated: '2026-08-15'
binds:
  - 'PRD Stock v1 — FR-S01→S65, NFR-1→NFR-7'
sources:
  - 'prospera-stories/prds/prd-stock-2026-08-02/prd.md'
  - 'prospera-stories/architecture-prospera-ecosystem-2026-07-04.md (v1.6 — AD-P13, AD-P14, AD-P15, AD-P16)'
  - 'prospera-stories/architecture/architecture-catalogue-produits-service-2026-08-15/ARCHITECTURE-SPINE.md (AD-2, AD-4, AD-9, AD-10, AD-11)'
  - 'prospera-stories/architecture/architecture-reseau-service-2026-08-15/ARCHITECTURE-SPINE.md (AD-5, AD-6, AD-12)'
  - 'balance-service/src/modules/balance/types/balance-canonique.ts (SOURCES_BALANCE, fermée à 3)'
  - 'balance-service/src/modules/balance/ingestion/schemas/balance-ingestion.schema.ts (journal d''ingestion, STORY-102)'
  - 'balance-service/src/modules/suggestion/ + modules/cahiers/rattachement/ (le rattachement compte réel)'
  - 'balance-service/src/modules/referentiel/assets/syscohada-revise-2.1.json (compte 38)'
  - 'bilan-service/src/modules/bilan/jeu-etats/dto/creer-jeu-etats.dto.ts (l''entrée réelle du bilan : des soldes)'
  - 'prospera-dossier-service/src/modules/exercices/schemas/exercice.schema.ts (l''exercice appartient au dossier)'
  - 'auth-service/src/common/rbac/permission.enum.ts (le catalogue de permissions réel — intégralement plateforme)'
  - 'platform-catalog-service/src/modules/packs/packs.seed-data.ts (le code `stock` déjà déclaré au pack distributeur)'
companions:
  - 'prospera-stories/prds/prd-stock-2026-08-02/.memlog.md'
---

# Architecture Spine — stock-service

> **Ce que ce service est.** Ce que l'organisation détient, ce que ça vaut, et **ce qui dort**.
>
> **Sa thèse, reprise du PRD :** *« Le stock qui manque crie. Le stock qui dort ne dit rien. »* Un
> module qui n'alerte que sur les ruptures traite la moitié du problème, et pas la plus chère.
>
> **Sa propriété structurante :** le stock est **la somme de ses mouvements**, jamais un compteur
> qu'on corrige. Tout le reste — la valeur, l'audit, la clôture, le stock à une date passée — en
> découle. Un service qui perd cette propriété perd sa capacité à répondre à *« pourquoi 45 et pas
> 80 ? »*, et le module devient un tableur partagé.

## Design Paradigm

**Modules NestJS sur le moule commun Prospera.** Le service possède cinq agrégats, tient un invariant
de dérivation, valorise, et **publie une balance** — il n'écrit aucun journal comptable.

| Couche | Répertoire | Contenu |
| --- | --- | --- |
| Entrée | `src/modules/*/` `*.controller.ts` | Contrôleurs, DTO, guards |
| Application | `src/modules/*/` `*.service.ts` | Cas d'usage, transactions, **valorisation**, **détections** |
| Persistance | `src/modules/*/schemas/`, `*.repository.ts` | Schémas, index. ⚠️ **`mouvements` est append-only** (AD-2) |
| Dérivation | `src/modules/stock/derivation/` | Solde courant, points d'arrêt, rejeu (AD-1) |
| Événements | `src/kafka/`, `src/kafka/outbox/` | Contrats, outbox transactionnelle |
| Read-models entrants | `src/modules/read-models/` | `identity.*`, `kyc.status.changed`, `entitlement.changed`, **`dossier.exercice.*`**, **`reseau.portee.changed`** |
| Conformité | `src/conformite/` | ⚡ **Deux suites externes exécutées en CI** (AD-4) |
| Transverse | `src/common/` | Guards, RBAC, contexte |

## Inherited Invariants

| Hérité | Source | Ce qu'il contraint ici |
| --- | --- | --- |
| **AD-P13 — le dossier est l'unité de travail** | écosystème v1.4 | ⚡ **L'entrepôt et le stock appartiennent à un dossier** (AD-6). Hors portée ⇒ **`404`, jamais `403`** |
| **AD-P14 — l'exercice appartient au dossier** | écosystème v1.4 | Read-model `exercices_dossier`, comme `balance-service` et `bilan-service` (AD-5) |
| **AD-P15 — le RBAC s'étend au tenant** | écosystème v1.5 | Les 6 droits de `FR-S61` et l'échelle de `FR-S16` ⇒ **story hors service** (AD-16) |
| **AD-P16 — lecture plateforme inter-org** | écosystème v1.6 | Le stock y est **nommément cité** ⇒ AD-18 |
| **Discriminant borné / non borné** | écosystème v1.5 | Les droits stock sont un **vocabulaire fermé** ⇒ jeton. La **portée réseau** ne l'est pas ⇒ read-model |
| **AD-2 catalogue — unité de base immuable** | `catalogue-produits` | ⚡ **La dépendance dure du §9 est LEVÉE.** Tout le stock historique repose dessus |
| **AD-4 catalogue — l'engagement stocke le facteur utilisé** | `catalogue-produits` | Un mouvement est un **engagement** : il stocke son facteur, il ne le référence pas (AD-2) |
| **AD-9 catalogue — aucune quantité sans son unité** | `catalogue-produits` | Invariant **distribué** dont Stock est le 1ᵉʳ consommateur (AD-4) |
| **AD-10 catalogue — le profil est publié, jamais appliqué** | `catalogue-produits` | ⚡ **Le groupe H consomme ce que le catalogue publie** : `FR-C35` (saisonnalité) et `FR-C36` (fin de vie) alimentent `FR-S43`/`FR-S44` |
| **AD-6 réseau — portée fail-closed + registre** | `reseau-service` | Appliquée au **seul groupe K** (AD-13) |
| **AD-12 réseau — les lieux des autres modules sont des références** | `reseau-service` | ⚡ **L'entrepôt est détenu ICI** ; la zone qu'il dessert est une **référence opaque** |
| Relying-party / JWKS | écosystème | Validation locale RS256, aucun appel chaud à `auth-service` |
| Database-per-service | écosystème | Ne lit aucune base d'un autre service — **y compris celle de `balance-service`** |
| Unités mineures entières | STORY-101 · `paiement-service` | **Tout montant en entier d'unité mineure** ⚠️ **le XOF n'a aucune décimale** |
| Outbox transactionnelle | STORY-099 | Publication dans la transaction qui produit le fait |
| Énumérations de topics séparées | `dossier-service` AD-11 | `StockTopic` et `StockValorisationTopic` sont **deux** énumérations |

---

## Invariants & Rules

### AD-1 — Le stock est un DÉRIVÉ ; le solde et les points d'arrêt n'ont aucune autorité

- **Binds:** FR-S11, FR-S06, FR-S09, FR-S10, **NFR-1**, NFR-7, SM-1, SM-3, **risque R1**
- **Prevents:** la corruption silencieuse — un stock corrigé en place qui n'explique plus sa valeur

> ⛔ **C'est la décision dont tout le reste dépend.** La valeur comptable, l'audit, la clôture et le
> stock à une date passée sont tous des lectures du même journal de mouvements.

- **Rule:** le stock d'un couple `(dossierId, articleId, entrepotId[, lotId])` est **calculé** depuis
  ses mouvements. ⛔ **Aucun chemin d'écriture directe sur une quantité n'existe dans le service** —
  pas de `updateOne({ $set: { quantite } })`, pas de variante d'administration, pas d'exception de
  reprise. Une correction est **un mouvement d'ajustement** (AD-16).
- **Rule:** ⚡ **les points d'arrêt périodiques sont autorisés et sont des DÉRIVÉS.** `NFR-7` cible
  `P95 < 5 s` sur le stock à une date passée et le rejeu intégral ne la tiendra pas. Mais un point
  d'arrêt est **reconstructible par rejeu** et **jamais une seconde source de vérité** : le supprimer
  entièrement ne change **aucun** résultat, seulement le temps de réponse. **Un test le prouve en
  purgeant tous les points d'arrêt et en comparant.**
- **Rule:** condition observable de `NFR-1`, exécutable en continu : recalculer depuis la totalité des
  mouvements redonne **exactement** la valeur courante. Un écart n'est pas un avertissement — **c'est
  une alerte d'intégrité**, et `SM-1` la mesure à `0`.
- **Rule:** le **stock négatif est refusé par défaut** ; autorisable explicitement par article ou par
  entrepôt, et alors **toujours signalé, jamais silencieux** (`FR-S09`). L'autorisation est une
  décision tracée, pas un réglage oublié.

### AD-2 — Le mouvement est append-only et stocke ce qu'il a utilisé

- **Binds:** FR-S12, FR-S13, FR-S14 · **hérite AD-4 catalogue**
- **Rule:** ⛔ **aucune mutation, aucune suppression** d'un mouvement. On **contre-passe** : le
  correctif est un nouveau mouvement qui référence celui qu'il annule.
- **Rule:** ⚡ **le mouvement stocke le facteur de conversion qu'il a utilisé** — il ne référence pas
  une version de conditionnement qui pourrait être réinterprétée. C'est l'obligation qu'`AD-4` du
  catalogue impose à ses consommateurs, et Stock est le premier à devoir la tenir. Condition
  observable : après passage du carton de 20 à 24, **un mouvement antérieur restitue toujours ses
  quantités d'origine**.
- **Rule:** un mouvement porte **son motif** dans un vocabulaire **fermé et typé par nature**
  (réception, retour client · livraison, perte, casse, péremption · transfert · ajustement). ⛔ Un
  motif en texte libre rendrait `FR-S30` — pertes **ventilées par nature** — inapplicable au moment
  de la clôture, c'est-à-dire trop tard pour le corriger.

### AD-3 — L'idempotence est définie ICI, pas « à la source »

- **Binds:** FR-S15 · **Prevents:** un doublon de stock qui ne se voit qu'à l'inventaire suivant
- **Rule:** ⚠️ `FR-S15` dit « idempotent **à la source** ». **Aucune source n'existe** : Commande est
  en position 11, Approvisionnement en 13, Opérations entrepôt en 12. Une idempotence déléguée à des
  appelants qui n'existent pas n'est **tenue par personne**.
- **Rule:** le service **exige une clé d'idempotence** sur toute écriture de mouvement, et **rejette
  la seconde occurrence en rendant le premier résultat** — jamais un doublon, jamais une erreur qui
  pousserait l'appelant à réessayer.
- **Rule:** la clé est **portée par l'appelant** (`Idempotency-Key`, et `eventId` sur le chemin
  événementiel) et **contrainte par un index unique**, pas par un pré-contrôle : un `find`-puis-`insert`
  perd toute course concurrente — leçon de l'index `unicite_exercice_ouvert` de `dossier-service`.
- **Rule:** la **pièce d'origine** (`FR-S14`) est distincte de la clé d'idempotence. La première dit
  *d'où ça vient*, la seconde *que c'est le même geste*. Les confondre rend impossible la réception
  légitime de deux lots sur un même bon.

### AD-4 — Deux invariants distribués convergent ici, et Stock est le premier à les tenir

- **Binds:** **NFR-2**, FR-S07, SM-6 · **hérite AD-9 catalogue et AD-6 réseau**
- **Prevents:** l'erreur la plus coûteuse de la distribution — **commander 120 quand on voulait 120 cartons**

- **Rule:** ⛔ **aucun nombre nu** dans l'API, les événements ou les documents. Toute quantité est
  `{ valeur, unite }`. **Toute quantité PERSISTÉE est en unité de base** : l'affichage convertit, le
  stockage jamais (`NFR-2`).
- **Rule:** ⚡ **Stock est le premier service du programme à exécuter DEUX suites de conformité
  externes en CI** — celle du catalogue (unité) et celle du réseau (portée fail-closed) — et à
  apparaître dans **deux registres de consommateurs conformes**. Ce n'est pas une formalité : `AD-6`
  du réseau reconnaît explicitement qu'un service qui n'exécute pas la suite **passe entre les mailles,
  en silence**.
- **Rule:** ⚠️ **conséquence de séquence à assumer :** ni `catalogue-produits-service` ni
  `reseau-service` n'existent au démarrage de ce module. Les suites sont donc **une dépendance de
  livraison, pas de conception** — le service se construit contre le contrat écrit, et
  **l'inscription au registre est une condition de sortie d'incrément**, nommée dans la DoD, jamais
  implicite.

### AD-5 — L'exercice appartient au dossier ; ce service en tient un read-model, comme balance et bilan

- **Binds:** FR-S25, FR-S30, FR-S33 · **hérite AD-P14** · **Prevents:** un troisième modèle d'exercice
- **Rule:** ⛔ **ce service ne crée, ne clôt et ne rouvre aucun exercice.** Il consomme
  `dossier.exercice.ouvert|clos|rouvert` et tient `exercices_dossier` — **exactement le read-model que
  `balance-service` et `bilan-service` tiennent déjà**. Un troisième cycle de vie d'exercice serait la
  répétition littérale de la panne que STORY-355 a réparée : *« l'exercice 2023 est-il clos ? »* avait
  deux réponses ; il n'en aura pas trois.
- **Rule:** la projection décide **d'après le champ `statut`**, jamais d'après le nom du topic —
  traduire trois noms en un statut ferait qu'oublier `rouvert` figerait ce read-model sur `CLOS`.
  ⚠️ Le piège est **déjà documenté** dans `bilan-service/src/kafka/events/exercice-events.ts` ; le
  reproduire ici serait impardonnable.
- **Rule:** la **méthode de valorisation est clé par `(dossierId, exerciceId)`** et **figée** dès la
  première publication de l'exercice (`FR-S25`). Le changement est **refusé**, pas averti.
- **Rule:** ⚡ **la réouverture d'un exercice ne réécrit RIEN** (`FR-S33`). Elle autorise une
  **nouvelle publication versionnée** de la balance de stock ; la précédente reste, et le hub la
  distingue par sa `version`. ⚠️ **Ce cas n'était pas traité par le PRD** : il écrivait « rouvrir un
  stock passé », en ignorant que c'est **l'exercice** qui se rouvre, et que `dossier-service` publie
  cet événement.

### AD-6 — Le stock appartient à un dossier, pas à une organisation [ARBITRÉ PO 2026-08-15]

- **Binds:** FR-S64, **NFR-6** · **hérite AD-P13** · **amende le PRD**
- **Rule:** ⚡ **`dossierId` est une clé de première classe** sur l'entrepôt, le stock, le mouvement,
  l'inventaire et la publication. Le PRD ne connaissait que `orgId` (« cloisonnement strict par
  organisation ») — c'était le modèle d'avant `AD-P13`.
- **Rule:** **`orgId` vient du jeton signé, `dossierId` vient de l'URL** et est **vérifié contre la
  portée serveur à chaque appel**. ⛔ Ne jamais inférer le dossier du jeton : ce serait ramener
  « une org = une société » par la porte de derrière, précisément ce qu'`AD-P13` a défait.
- **Rule:** un dossier hors portée rend **`404`, jamais `403`** — le service refuse délibérément de
  révéler l'existence du dossier.
- **Rule:** ⚡ **conséquence directe et voulue :** un groupe distributeur à deux entités juridiques a
  **deux dossiers, deux exercices, deux valorisations, deux bilans**. Un entrepôt appartient à **un**
  dossier. Un transfert entre dossiers **n'est pas un transfert** — c'est une vente entre entités, et
  elle est **hors périmètre** (AD-9).

### AD-7 — Ce service est le QUATRIÈME ADAPTATEUR de la balance canonique [ARBITRÉ PO 2026-08-15]

> ⛔ **Cette décision remplace la formulation de `FR-S30`, `FR-S31` et `FR-S34`. Le PRD est amendé.**

- **Binds:** FR-S30 → FR-S34, **NFR-3**, **NFR-4**, SM-2, SM-7, **risque R2**
- **Prevents:** une publication comptable adressée à un service qui ne peut pas la recevoir

**La prémisse du PRD est fausse, et c'est vérifiable.** `bilan-service` n'a **aucune notion de valeur
de stock** : son unique entrée est `POST /bilan/etats` avec `soldesN: LigneSoldeDto[]` — une liste de
soldes de comptes. Le moteur produit la liasse **depuis des soldes**, par table de passage. Rien n'y
reçoit « une valeur de stock ».

Le récepteur réel est **`balance-service`**, le hub multi-source de STORY-101/102 — celui-là même qui
existe pour rendre les sources interchangeables.

- **Rule:** ⚡ **le service publie une BALANCE — des comptes et des soldes — jamais « une valeur ».**
  Valeur de stock (classe 3), variation de la période, et **pertes ventilées par nature** deviennent
  des **lignes de balance**. ⚠️ **Le §4.2 du PRD survit intact : une balance n'est pas un journal.** Ce
  service n'écrit aucune écriture comptable et ne connaît aucune contrepartie.
- **Rule:** la publication passe par **`balance.submitted`**, avec l'enveloppe et le contrat de
  l'adaptateur #1 — l'ingestion journalise **les deux issues**, acceptée et rejetée (`NFR-A07`).
  ⇒ ⚡ **`SOURCES_BALANCE` doit s'ouvrir à une quatrième valeur `stock`** : l'énumération est
  **fermée à `['sage', 'direct', 'ocr']` dans un service livré** ⇒ **story hors de ce service** (§ *Ce
  que cette spine impose ailleurs*).
- **Rule:** **`NFR-4` — le couplage reste à sens unique.** Le module fonctionne **intégralement** sans
  `balance-service` : `FR-S32` (consultation et export) est le chemin nominal en son absence, pas un
  mode dégradé. ⛔ **Aucune fonction du service ne prend `balance-service` pour condition.**
- **Rule:** **`NFR-3` — la publication est rejouable.** Recalculer depuis les mouvements et la méthode
  de l'exercice redonne **exactement** la valeur publiée (`SM-2 = 0 écart`). ⇒ elle porte de quoi être
  auditée (`FR-S34`) : méthode, date d'arrêté, périmètre d'entrepôts, **`checksum`**, et le moyen de
  **descendre au mouvement**.
- **Rule:** ⚠️ **une correction produit une nouvelle version, jamais une réécriture** — la clé du hub
  est `(orgId, exercice, source, version)` et une balance rejetée **ne consomme pas la clé** (D-102-2).
  Le service doit donc distinguer *rejeté* de *à corriger*, et ne jamais réutiliser un numéro de
  version pour réparer un rejet.

### AD-8 — Le rattachement comptable n'appartient PAS à ce service [ARBITRÉ PO 2026-08-15]

- **Binds:** **A2**, FR-S30 · **Prevents:** une troisième implémentation d'une règle comptable
- **Rule:** ⚠️ **A2 était sans propriétaire.** Elle affirmait que les catégories comptables « se
  déduisent de la classification du catalogue » — or `AD-10` du catalogue publie saisonnalité, fin de
  vie, élasticité et reprise fournisseur, **et aucune classification comptable**. Personne ne portait
  la correspondance article → compte de classe 3.
- **Rule:** ⚡ **elle est portée par `balance-service`**, où la machinerie existe **déjà livrée** :
  `RattachementService` et les **surcharges de rattachement par organisation** (STORY-085), plus la
  suggestion « libellé → compte **selon le référentiel actif de l'org** » (STORY-139).
- **Rule:** ⇒ **ce service transmet une catégorie et un libellé, jamais un numéro de compte.** ⛔ Aucun
  plan comptable, aucune constante `« 31 »`, aucune table de correspondance ne vit ici. C'est ce qui
  rend le module **indépendant du référentiel** : SYSCOHADA, SFD-BCEAO et CIMA sont gérés au seul
  endroit qui les connaît, et un distributeur IMF ou assurance n'exige aucune ligne de code ici.
- **Rule:** ⚠️ **seule exception, et elle est nommée : le compte 38** (AD-9). Elle existe parce que le
  transit est une **notion du stock**, pas une catégorie d'article — et elle passe par la même
  catégorie transmise, jamais par un numéro écrit en dur.

### AD-9 — Le transit a son propre lieu comptable : le compte 38 [Q3 DU PRD, TRANCHÉE 2026-08-15]

> Reportée le 2026-08-02 « au lancement du module », **avec consigne explicite de la ressortir**. La
> voici, et **le référentiel déjà livré y répond**.

- **Binds:** FR-S52, FR-S53, FR-S54, FR-S28, FR-S30
- **Rule:** le référentiel embarqué porte le compte **`38 — Stocks en cours de route, en consignation
  ou en dépôt`** (`syscohada-revise-2.1.json`, et ses équivalents SFD-BCEAO et CIMA). ⚡ **Le transit
  n'appartient ni à l'origine ni à la destination : il a son propre lieu comptable.** La question posée
  comme un arbitrage à trancher avec un comptable **avait déjà sa réponse dans le plan de comptes**.
- **Rule:** ⇒ **`FR-S28` et `FR-S30` se débloquent sans convention maison.** Un arrêté pris pendant un
  transfert en vol est **complet** : origine, destination et transit sont trois périmètres distincts
  dont la somme est le stock total.
- **Rule:** le transfert reste **un mouvement en deux temps** avec un **état de transit** entre les
  deux. La marchandise sur la route **a une valeur**, et cette valeur est publiée.
- **Rule:** un transfert **partiellement reçu** produit un **constat d'écart**, ⛔ **jamais une perte
  automatique** (`FR-S53`). La perte est une décision humaine, prise sur un ajustement motivé.
- **Rule:** le transfert **conserve les lots** et leurs dates limites (`FR-S54`) — un lot qui perdrait
  son échéance en changeant d'entrepôt réapparaîtrait comme vendable.

### AD-10 — Lot × méthode : la méthode de l'exercice fait foi, et l'incohérence est REFUSÉE

- **Binds:** FR-S23, FR-S24, FR-S24b, FR-S24c, FR-S26, FR-S27, FR-S29, **risque R6**
- **Rule:** **CUMP par défaut, méthode configurable par organisation**, au minimum **FIFO** en
  alternative, **figée par exercice** (AD-5).
- **Rule:** ⚡ **sous CUMP, le coût du lot est INFORMATIF** — traçabilité et négociation fournisseur —
  **jamais la valeur comptable**. Sous une méthode **par lot**, le coût du lot **devient** la valeur
  comptable. Les deux ne peuvent pas faire foi ensemble, et le PRD a tranché : **la méthode de
  l'exercice fait toujours foi au bilan**.
- **Rule:** ⛔ **le service REFUSE une méthode par lot sur un article dont le suivi par lot n'est pas
  activé** (`FR-S24c`), par un code machine stable. L'accepter produirait une valeur **silencieusement
  fausse** — la pire des deux issues, parce qu'elle est plausible.
- **Rule:** **la devise de l'entrepôt est la devise de valorisation, et elle ne se convertit pas** —
  même règle que `AD-11` du catalogue et que `paiement-service`. ⛔ Une entrée dont le coût est libellé
  dans une autre devise est **refusée**, jamais convertie à un taux que personne n'a décidé.
- **Rule:** **entier d'unité mineure** partout ⚠️ **le XOF n'a aucune décimale**.
- **Rule:** les **pertes sont valorisées et restituées séparément** (`FR-S29`), par nature. Ce sont
  elles qui donnent **le coût réel du stock mort** — les fondre dans la variation empêcherait le
  comptable de les traiter correctement au compte de résultat.

### AD-11 — C'est la PROPRIÉTÉ qui décide, jamais le type de lieu

- **Binds:** FR-S05, FR-S05b, FR-S05c, FR-S59, **NFR-5**, **risque R3**
- **Prevents:** un actif gonflé d'un bien qu'on ne possède pas — ou amputé d'un bien qu'on possède

- **Rule:** trois natures, **deux régimes** :

  | Lieu | Propriété | Au bilan ? | Comment on le connaît |
  | --- | --- | :--: | --- |
  | Entrepôt | organisation | ✅ | Mouvements réels |
  | **Magasin propre** | organisation | ✅ | Mouvements réels |
  | Détaillant partenaire | le détaillant | ❌ | Deux estimations comparées (AD-12) |

- **Rule:** ⚡ **la vente au détail est une CAPACITÉ, pas une nature** (formulation du PO). Un magasin
  **n'est pas** un entrepôt — il ne fait pas d'éclatement ; un entrepôt **peut** vendre directement.
  ⇒ le modèle porte une **nature** et un **jeu de capacités**, pas deux types rigides.
- **Rule:** ⛔ **le stock d'un partenaire n'entre dans AUCUNE valorisation, aucune publication
  comptable, aucun total de point de stock.** L'exclusion est structurelle — deux collections, deux
  chemins — pas un filtre qu'on peut oublier. Un filtre oublié produit un actif faux et crédible.
- **Rule:** un entrepôt se **ferme sans être supprimé** ; son historique reste lisible. ⛔ **La
  fermeture est refusée tant qu'il détient du stock**, avec le détail de ce qui l'empêche — même forme
  que le refus de retrait d'article d'`AD-1` du catalogue.

### AD-12 — Deux sources, un écart, jamais une vérité unique

- **Binds:** FR-S56 → FR-S60, CM-3 · **Prevents:** une estimation présentée comme une mesure
- **Rule:** le **relevé du commercial** et l'**estimation déduite** des livraisons et du rythme de
  vente sont **conservés tous les deux et comparés**. ⛔ **Jamais fondus en un chiffre unique.**
  ⚡ **L'écart est la donnée utile** — c'est le patron du rapprochement bancaire, déjà en place dans
  `balance-service`.
- **Rule:** ⚠️ **motif, à ne pas perdre :** *tous les détaillants n'acceptent pas d'être relevés*. La
  couverture du relevé est **partielle par nature**, et une source unique masquerait cette partialité
  au lieu de la montrer.
- **Rule:** toute restitution **indique sa source et sa fraîcheur** (`FR-S58`). Un relevé de six
  semaines et une estimation d'hier n'ont pas le même statut, et l'interface ne doit pas laisser
  croire qu'ils l'ont.
- **Rule:** un **écart durable est signalé** (`FR-S60`) : soit le détaillant écoule autrement qu'on ne
  le croit, soit les livraisons ne sont pas ce qu'on pense. Le service **signale**, il ne conclut pas.

### AD-13 — La portée réseau couvre le stock du RÉSEAU, et rien d'autre [ARBITRÉ PO 2026-08-15]

- **Binds:** groupe K, FR-S64 · **hérite AD-5 et AD-6 de `reseau-service`** · **amende le PRD**
- **Rule:** ⚡ **le PRD ne mentionnait aucune portée** — il ne connaissait que le cloisonnement par
  organisation. Or `FR-S56` (le relevé du commercial en visite) est **zone-scopé par nature** : c'est
  de la donnée nominative par point de vente.
- **Rule:** la portée s'applique **au seul groupe K**. Le **stock détenu** — entrepôts et magasins
  propres — est filtré **par dossier et par droit**, ⛔ **jamais par zone**.
- **Rule:** ⚡ **raison de la borne, et elle est comptable :** si la portée filtrait le stock détenu,
  un arrêté calculé sous une portée partielle produirait **un bilan silencieusement incomplet** — une
  valeur juste sur un périmètre que personne n'a choisi. La valorisation ne doit jamais dépendre de qui
  la déclenche.
- **Rule:** sur le groupe K, **fail-closed sans exception** : portée absente, vide ou non résolue rend
  **zéro enregistrement**, jamais tout. Une portée **« totale » est une valeur explicite**, jamais
  l'absence de restriction.
- **Rule:** la portée voyage par **read-model `reseau.portee.changed`**, ⛔ jamais par le jeton — c'est
  un ensemble **non borné** (discriminant d'`AD-P15`).

### AD-14 — `réservé = 0` au v1, et le contrat est complet dès le premier jour

- **Binds:** FR-S08, FR-S08b, FR-S08c
- **Rule:** le stock distingue **physique**, **réservé** et **disponible**. ⚠️ **Aucune source de
  réservation n'existe** : Commande est en position 11, ce module en 7. **Au v1 : `réservé = 0`, donc
  `disponible = physique`.**
- **Rule:** ⚡ **le champ existe, l'API le publie, et il se remplira SANS CHANGEMENT DE CONTRAT.** Le
  poser plus tard imposerait une migration à tous les consommateurs déjà branchés.
- **Rule:** ⛔ **ce module ne réserve JAMAIS de lui-même** (`FR-S08b`). Il tient le compteur ; la
  réservation est posée par les modules qui engagent.
- **Rule:** ⚠️ **l'API le DIT.** `réservé = 0` doit être lisible comme *« aucune source de réservation
  branchée »* et non comme *« rien n'est réservé »* — sans quoi un consommateur croira la réservation
  opérationnelle et vendra du réservé, c'est-à-dire créera la rupture que `FR-S08` existe pour éviter.

### AD-15 — Le dormant est MESURÉ et publié, jamais décidé — et il porte toujours un montant

- **Binds:** FR-S35 → FR-S46, SM-4, CM-2, **risque R5** · **hérite AD-10 catalogue**
- **Rule:** les **quatre détections** ont chacune leur règle et **leur source** :

  | Cas | Détection | Source de la donnée |
  | --- | --- | --- |
  | Achat d'opportunité | Couverture ≫ rotation utile | Interne (mouvements) |
  | Dormant | Aucune sortie depuis *N* jours (défaut 90) | Interne (mouvements) |
  | Invendu de campagne | Fin de vie commerciale approchée ou dépassée | ⚡ **Catalogue `FR-C36`** |
  | Saisonnier bloqué | Détenu hors de ses mois de vente | ⚡ **Catalogue `FR-C35`** |

- **Rule:** ⚡ **deux des quatre détections consomment le profil commercial du catalogue.** `AD-10` du
  catalogue publie ce profil **sans jamais l'appliquer** — c'est ici qu'il s'applique. ⚠️ Et `AD-10`
  impose une nuance qui compte : **un profil absent n'est pas un profil neutre**. Un article sans
  saisonnalité déclarée ne doit **pas** être traité comme un article vendu toute l'année ; il doit être
  restitué comme **non qualifiable**, sans quoi le module affirme qu'il n'y a pas de saisonnier bloqué
  alors qu'il ne peut pas le savoir.
- **Rule:** ⛔ **chaque détection porte son coût de portage chiffré** (`FR-S45`). *Une alerte sans
  montant ne déclenche aucune décision* — et `CM-2` mesure précisément les alertes sans suite.
- **Rule:** le taux annuel de portage est **paramétrable par organisation, défaut 22 %** (`Q1` du PRD,
  tranchée). C'est le taux du prototype, et il n'a pas vocation à être une constante du code.
- **Rule:** ce module **mesure et publie** vers Marketing (#10) et Approvisionnement (#13). ⛔ **Il ne
  liquide rien, ne commande rien, ne décide rien.** Le **fournisseur de candidats** (`FR-S39`) expose
  **des faits, jamais un jugement ni une action** — même règle qu'`AD-13` de `reseau-service`.
- **Rule:** `SM-4` se mesure **« d'abord »** : la référence est établie au 1ᵉʳ arrêté, la cible de
  décroissance **ensuite**. ⛔ Aucune cible chiffrée n'est inventée avant d'avoir mesuré.

### AD-16 — Les droits sont un vocabulaire fermé, et la validation est une ÉCHELLE [ARBITRÉ PO 2026-08-15]

- **Binds:** FR-S16, FR-S47 → FR-S51, FR-S61, FR-S62, FR-S65, CM-1 · **hérite AD-P15**
- **Rule:** ⚠️ **fait vérifié :** `permission.enum.ts` d'`auth-service` est **intégralement plateforme**
  — `org:`, `kyc:`, `entitlement:`, `catalog:`, `project:`, `referentiel:`. **Aucun droit de tenant
  n'existe.** ⇒ `FR-S61` et `FR-S62` **dépendent entièrement de la story `AD-P15`**, toujours pas
  créée. ⚡ **Stock est le TROISIÈME module d'affilée** à buter dessus, après `FR-R28b` (réseau) et
  `FR-C48` (catalogue) — elle bloque désormais trois modules.
- **Rule:** les six droits de `FR-S61` sont un **vocabulaire fermé** ⇒ ils vont dans `perms[]`
  (discriminant borné / non borné). **Configurer la méthode de valorisation** (`FR-S62`) est un droit
  **distinct et restreint** : *c'est une décision comptable, pas une opération de magasinier*.
- **Rule:** ⚡ **la validation d'ajustement est une ÉCHELLE PAR RÔLE, pas un seuil unique** — le PRD
  l'avait aplatie, le prototype la portait (`PLAFONDS_VALIDATION` : `RESP_STOCK` 5 M / `DAF` 20 M /
  `DG` illimité, avec `valideurPourMontant`). **Un écart de 30 M ne se valide pas au même niveau qu'un
  écart de 2 M.** Les plafonds sont **paramétrables par organisation** ; l'échelle, elle, est
  structurelle.
- **Rule:** ⛔ **un comptage produit un ÉCART, jamais une écriture directe du stock** (`FR-S49`).
  L'écart devient un ajustement **après validation** — c'est le seul chemin par lequel une correction
  entre, et il traverse l'échelle.
- **Rule:** **journal d'audit append-only** sur mouvements, ajustements, changements de méthode et
  fermetures d'entrepôt (`FR-S65`), **protégé par le serveur** — jamais par l'absence de route.
- **Rule:** `CM-1` — le **taux d'ajustement manuel est surveillé et publié**. ⚡ *Un module de stock
  qu'on corrige tous les jours est un module qu'on a cessé d'alimenter.* La contre-métrique est le seul
  garde-fou contre `R1`, et elle doit être calculée par le service, pas par un tableur.

### AD-17 — Module du vertical Distributeur : entitlement et gate

- **Binds:** §10 du PRD, **NFR-6**
- **Rule:** le module est octroyé par **entitlement `(org × module)`**, code **`stock`** — **déjà
  déclaré** dans le pack distributeur livré (`packs.seed-data.ts`).
- **Rule:** ⚠️ **le même gap que le catalogue s'applique :** les six modules du pack distributeur
  **ne sont enregistrés nulle part au catalogue de modules**, et le provisioning rend **422 en vol
  depuis le 2026-08-11**. Le gap existe **indépendamment de ce PRD** ⇒ la story déjà nommée par la
  spine catalogue **conditionne aussi ce module**.
- **Rule:** gate d'accès `@RequiresStockAccess` = **`emailVerified` + KYC `APPROVED` + entitlement
  `ACTIVE`**, par read-models locaux (`kyc.status.changed`, `entitlement.changed`) — moule commun,
  aucun appel chaud.

### AD-18 — La route de lecture plateforme : `orgId` explicite, lecture seule, journalisée

- **Binds:** **AD-P16** — qui cite **nommément le stock**
- **Rule:** routes réservées à `PLATFORM_ADMIN`, **`orgId` en PARAMÈTRE EXPLICITE** ⛔ **jamais tiré du
  jeton**. Un opérateur plateforme n'a pas d'organisation ; lui en inventer une ferait de l'exception
  un chemin ordinaire.
- **Rule:** ⛔ **lecture seule**, ⛔ **une organisation à la fois**, **tout accès journalisé avec son
  motif**. Un accès sans motif n'est pas un accès autorisé.
- **Rule:** ⚠️ ce sont les **seules** routes où le gate d'`AD-17` ne s'applique pas — un opérateur
  Money Vibes n'a ni KYC ni entitlement. Elles portent **`@PlatformReadOnly`**, et rien d'autre du
  service ne l'emploie.
- **Rule:** ces routes **lisent, elles ne dupliquent pas** : ni read-model plateforme consolidé, ni
  agrégation permanente au BFF. La carte de propriété ne bouge pas.

---

## Consistency Conventions

| Sujet | Convention |
| --- | --- |
| Collections | `entrepots`, `mouvements` *(append-only)*, `lots`, `points_arret` *(dérivé, AD-1)*, `inventaires`, `valorisations`, `stock_reseau_releves` + `stock_reseau_estimations` *(deux collections, AD-12)*, `stock_journal` |
| Clé de stock | `(dossierId, articleId, entrepotId[, lotId])` — ⚡ `dossierId`, pas `orgId` seul (AD-6) |
| Quantités | **Toujours** `{ valeur, unite }`, persistées en **unité de base** — jamais un nombre nu (AD-4) |
| Montants | Entier d'unité mineure + devise de l'entrepôt ⚠️ **XOF : zéro décimale** |
| Idempotence | `Idempotency-Key` sur écriture, `eventId` sur le bus, **index unique** (AD-3) |
| Refus | `STOCK_NEGATIF_INTERDIT`, `METHODE_PAR_LOT_SANS_LOT`, `ENTREPOT_NON_VIDE`, `METHODE_FIGEE_SUR_EXERCICE`, `DEVISE_NON_CONVERTIBLE` |
| Portée | ⛔ Le mot « portée » est un **homonyme du programme** (AD-15 réseau) : ici, `PorteeReseau` pour le groupe K, `PorteeDossier` pour le reste. **Jamais `portee` nu** |
| Topics | `StockTopic` (mouvement, alerte) et `StockValorisationTopic` (publication d'exercice) — **deux énumérations séparées** |
| Comptes | ⛔ **Aucun numéro de compte en dur**, sauf le **38** nommé en AD-9 |

## Stack

NestJS · MongoDB (base propre) · Kafka (producteur `stock.*` et **`balance.submitted`** ; consommateur
`identity.*`, `kyc.status.changed`, `entitlement.changed`, `dossier.exercice.*`,
`reseau.portee.changed`, `catalogue-produits.*`) · JWT RS256 en relying-party.

## Structural Seed

```
src/modules/
  entrepots/            AD-11  entrepôt · magasin propre · fermeture gardée
  stock/
    mouvements/         AD-2, AD-3  append-only, idempotence, contre-passation
    derivation/         AD-1  solde courant · points d'arrêt · rejeu · stock à date
    lots/               AD-10  échéances, règle d'écoulement, sortie du disponible
  valorisation/         AD-10  CUMP/FIFO figée par exercice · pertes ventilées
  publication/          AD-7, AD-8, AD-9  balance de stock → balance.submitted
  seuils/               AD-15  couverture, ruptures, fournisseur de candidats
  dormant/              AD-15  les quatre détections + coût de portage
  inventaire/           AD-16  ABC, tournant, écarts, échelle de validation
  transferts/           AD-9   deux temps, transit, réception partielle
  reseau-detaillant/    AD-12, AD-13  deux sources comparées, portée fail-closed
  read-models/          AD-5, AD-13, AD-17  exercices_dossier · portée · KYC · entitlement
  plateforme/           AD-18  @PlatformReadOnly
src/conformite/         AD-4   suites catalogue (unité) + réseau (portée)
```

## Capability → Architecture Map

| Incrément PRD | Gouverné par | Écart de charge vs PRD |
| --- | --- | --- |
| **1 — Le stock existe et s'explique** (A · B · C, ~34 pts) | AD-1, AD-2, AD-3, AD-4, AD-6, AD-11, AD-14, AD-17 | ⬆️ **AD-6** (dossier) et **AD-4** (double conformité) n'étaient pas au PRD |
| **2 — Le stock vaut quelque chose** (D · E · F · I, ~34 pts) | AD-5, AD-7, AD-8, AD-9, AD-10, AD-16 | ⬆️⬆️ **AD-7 change la nature du livrable** : publier une balance, pas une valeur |
| **3 — Le stock parle** (G · H · J · K, ~29 pts) | AD-9, AD-12, AD-13, AD-15, AD-18 | ⬆️ **AD-13** (portée) et **AD-18** (plateforme) n'étaient pas au PRD |

⚠️ L'incrément **1** porte la propriété dont tout dépend (`AD-1`). Le PRD dit l'incrément **3** « le
seul décalable » — **c'est toujours vrai**, mais `AD-13` y ajoute une dépendance à `reseau-service`
qu'il n'avait pas.

---

## ⚡ Ce que cette spine impose AILLEURS — 2 stories hors de ce service

| # | Où | Quoi |
| --- | --- | --- |
| **1** | `balance-service` | ⚡ **Ouvrir `SOURCES_BALANCE` à une quatrième valeur `stock`** et accepter l'adaptateur #4 (AD-7). L'énumération est **fermée à trois dans un service livré et en production** ; la clé unique `(orgId, exercice, source, version)` et le journal d'ingestion s'appliquent sans modification. ⚠️ Story dédiée, jamais en effet de bord. |
| **2** | `auth-service` | **Extension du RBAC au périmètre tenant** (AD-P15). ⚠️ **Déjà nommée par les spines réseau et catalogue** — ce n'est pas une nouvelle story, c'est un **troisième dépendant**. Elle bloque maintenant trois modules ; sa charge n'a pas bougé, son urgence si. |

*(Les deux autres stories nommées par la spine catalogue — enregistrement des six modules du pack et
renommage `catalogue` → `catalogue-produits` — **conditionnent aussi ce module** via AD-17, mais elles
sont déjà ouvertes ailleurs et ne sont pas recomptées ici.)*

## ⚡ Amendements au PRD imposés par cette spine

| Exigence | Amendement |
| --- | --- |
| **FR-S30 · FR-S31 · FR-S34** | ⛔ **Récepteur faux.** `bilan-service` n'ingère que des **soldes de comptes** ; il n'a aucune notion de valeur de stock. ⇒ **AD-7** : le service publie une **balance** à `balance-service` (adaptateur #4). Le §4.2 survit — *une balance n'est pas un journal* |
| **FR-S15** | ⚠️ « idempotent **à la source** » — **aucune source n'existe** au v1. ⇒ **AD-3** : la clé est exigée et contrainte **ici**, par index unique |
| **FR-S25 · FR-S33** | ➕ L'exercice appartient au **dossier** (AD-P14) ⇒ **AD-5** : read-model `exercices_dossier`, méthode clé par `(dossierId, exerciceId)`, et **le cas de la RÉOUVERTURE**, que le PRD ne traitait pas |
| **FR-S64 · NFR-6** | ➕ Le cloisonnement n'est pas seulement `orgId` ⇒ **AD-6** : `dossierId` est une clé de première classe, hors portée = **404** |
| **FR-S16** | ➕ Seuil unique → **échelle par rôle** *(arbitrage PO)*, comme le prototype le portait déjà |
| **Groupe K** | ➕ **Aucune portée n'était prévue** ⇒ **AD-13** : portée réseau fail-closed sur le seul stock du réseau détaillant |
| **§10** | ➕ **Route de lecture plateforme** (AD-18), le stock étant nommément cité par AD-P16 |
| **A2** | ⛔ **Sans propriétaire.** Le catalogue ne porte **aucune** classification comptable ⇒ **AD-8** : le rattachement appartient à `balance-service`, où il est **déjà livré** |

## Réponses aux 4 questions ouvertes du PRD

| # | Question | Réponse |
| --- | --- | --- |
| **Q1** | Taux annuel de coût de portage : unique ou paramétrable ? | ✅ **Paramétrable par organisation, défaut 22 %** (AD-15) |
| **Q2** | Changement de règle d'écoulement en cours d'exercice ? | ✅ **Non** — même raison que `FR-S25` : il rendrait la variation de stock incomparable (AD-10) |
| **Q3** | Le stock en transit appartient-il à l'origine ou à la destination au bilan ? | ✅ **Ni l'un ni l'autre — compte `38`**, déjà présent dans les trois référentiels livrés (AD-9) |
| **Q4** | Les emplacements sont-ils nécessaires au v1 ? | ✅ **Reportés au module Opérations entrepôt (#12)** *(arbitrage PO)* — voir Deferred |

## Deferred

| Différé | Pourquoi | Revient quand |
| --- | --- | --- |
| **Emplacements et contraintes** (`FR-S02`, `FR-S03`) | **Q4, tranchée** — l'emplacement ne sert qu'à des **opérations** explicitement hors périmètre (§4.2). Aucune exigence de valorisation, de bilan ou de dormant n'en dépend. ⚠️ **La contrainte de température part avec** : le cas du frais réfrigéré rangé au sol n'est pas couvert au v1, et c'est assumé | Module Opérations entrepôt (#12) |
| **Réservation effective** (`FR-S08`) | **AD-14** — aucune source n'existe. Le champ et le contrat sont livrés vides | Module Commande (#11) |
| **Portée réseau opérationnelle** (`AD-13`) | `reseau-service` n'existe pas ; le groupe K se construit contre le contrat écrit et **s'inscrit au registre à la livraison** | Livraison de `reseau-service` |
| **Prévision de demande par modèle statistique** | Hors périmètre (§4.2) ; la couverture reste calculée sur le **rythme observé** | Module scoring & prévision |
| **Transfert entre DOSSIERS** | **AD-6** — ce n'est pas un transfert, c'est une **vente entre entités juridiques**. Le traiter comme un mouvement produirait un actif déplacé sans contrepartie | Module Commande (#11) + arbitrage comptable |
| **A4 — suivi par lot par entrepôt** | Un article suivi par lot l'est **dans tous les entrepôts**. Un suivi partiel rendrait la valorisation par lot indéfinie sur le périmètre non suivi | Aucun besoin identifié |
