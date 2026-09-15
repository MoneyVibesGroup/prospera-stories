# STORY-505 : Déclassement en cascade et rééchelonnements — les deux façons de sortir d'un retard, et une seule est honnête

Status: in_progress

**Complexité :** high

**Épic :** EPIC-124 — Classement et provisionnement réglementaire
**Service :** `microfinance-service`
**Points :** 8 · **Sprint :** S20
**Prérequis :** **STORY-503** (classement dérivé) · **STORY-504** (provisionnement) · **STORY-659** (paquet prudentiel transcrit)
**Origine :** découpage `epics-microfinance-2026-08-27.md` ; spine AD-1, AD-2, AD-3, AD-4.
**Assigné :** `vivianMoneyVibesGroupes`

---

## Le fait

Deux règles que le classement par échéance seul ne couvre pas, et qui décident du provisionnement :

1. **La contagion par débiteur.** Un membre qui a trois crédits et qui en laisse un en souffrance
   fait basculer les autres — la norme prudentielle regarde le **débiteur**, pas la ligne. Classer
   crédit par crédit, sans cette règle, **sous-provisionne systématiquement** les meilleurs clients
   de l'institution.
2. **Le rééchelonnement remet le compteur à zéro — et c'est là que le chiffre se maquille.** Un
   crédit en retard rééchelonné redevient « sain » du seul fait de son nouvel échéancier. La norme
   traite le crédit restructuré à part, et le produit doit le **montrer**, pas le laisser disparaître
   dans la masse des sains.

⚠️ **C'est le seul endroit de ce module où un chiffre juste peut être trompeur.** Le classement est
correct, la formule est correcte, et le portefeuille paraît meilleur qu'il n'est.

## Cadrage mesuré avant de coder (2026-09-15)

| Affirmation | Verdict | Mesure |
|---|---|---|
| La norme SFD servie porte une règle de contagion par débiteur | **FAUX** | RCSFD version allégée, compte 29, p. 64-65, relu **en image** : aucune ; `docs/referentiels/README-prudentiel-sfd-bceao.md` le consignait déjà. `prudentiel-sfd-bceao@1.1` porte 5 règles de déclassement **en texte libre**, aucune structurée |
| La norme traite le rééchelonné à part | **VRAI** | compte **291 « crédits immobilisés »** : crédits redevenus sains après remboursement des retards, crédits **rééchelonnés**, concordats respectés ; les provisions 2991-2993 ne visent que les crédits **en souffrance** (292-294) |
| Un crédit rééchelonné est marqué | **FAUX** | STORY-502 publie les versions d'échéancier ; aucun champ ni aucune dérivation ne marque le crédit (`MARQUEUR_REECHELONNEMENT_CREDIT`, `livre: false`) |
| Un rééchelonnement libère la provision à l'arrêté suivant | **VRAI — c'est le défaut** | la nouvelle version n'a pas de retard ⇒ tranche `SOUFFRANCE_0_3_MOIS` à 0 % ⇒ la **reprise** de toute la provision est proposée, puis appliquée par l'acte avec le reste de l'arrêté |
| Le passage en perte existe | **FAUX** | `PASSAGE_EN_PERTE_CREDIT` inerte. RCSFD p. 65 : les sommes dues sur crédits irrécouvrables sont créditées par le débit du compte **6691** ; au-delà de 24 mois la créance est irrécouvrable (tranche `IRRECOUVRABLE_PLUS_DE_24_MOIS`, 100 %) |
| Sain / en souffrance est publié | **FAUX** | le classement publie une tranche, et `SOUFFRANCE_0_3_MOIS` couvre aussi **0 jour** de retard : un crédit à jour et un crédit à 80 jours d'impayé ont la même tranche |

### Décisions du 2026-09-15 (user)

- **D-505-A — contagion : MÉCANIQUE, INACTIVE dans le paquet servi.** Rubrique structurée
  `declassement.contagion` (`active`, `seuilJoursRetard`, `source`) ajoutée au schéma, au validateur, au chargeur et
  aux types. `prudentiel-sfd-bceao@1.2` la déclare `active: false`, le texte étant muet. Les versions 1.0 et 1.1
  restent au manifeste, **octets inchangés**. Quand elle est active, chaque crédit classé du débiteur prend la tranche
  du retard le plus élevé dès qu'un de ses crédits atteint le seuil. Preuve par le paquet fictif des tests.
- **D-505-B — « restructuré » = les crédits rééchelonnés, et eux seuls.** Les crédits « redevenus sains après
  souffrance » et les concordats (les deux autres cas du 291) restent un emplacement inerte documenté.
- **D-505-C — en souffrance = au moins une échéance échue impayée** (celle du jour comprise). Un crédit n'est sain
  que sans impayé. Le déclassement « facultatif de 0 à 3 mois » n'allège aucune catégorie : il reste dit par le
  libellé de la tranche, dont le taux est 0.
- **D-505-D — la reprise de la provision d'un crédit rééchelonné est une DÉCISION DATÉE PAR CRÉDIT**, prise par un
  `TENANT_ADMIN`, append-only. Sans décision valable à l'arrêté, la proposition **maintient** la provision déjà
  constatée et montre la reprise **suspendue**.

### Décisions de cadrage prises en session (2026-09-15) — à relire en revue

- **D-505-E — la catégorie.** Publiée **SSI** le statut vaut `CLASSE` : `SAIN` | `RESTRUCTURE` | `EN_SOUFFRANCE`.
  `EN_SOUFFRANCE` prime : impayé propre (D-505-C) ou contagion (D-505-G). `RESTRUCTURE` : au moins un
  rééchelonnement daté au plus tard de l'arrêté, sans impayé ni contagion. Aucune catégorie hors `CLASSE` : sans
  tranche, rien n'est « sain » (D-503-A).
- **D-505-F — le marqueur est DÉRIVÉ, jamais stocké (AD-2).** `restructuration` =
  `{ nombreReechelonnements, reechelonnements: [{ mouvementId, date, motif }] }`, ordre `(date, _id)`, présent SSI au
  moins un `REECHELONNEMENT` est daté au plus tard de l'arrêté. Permanent par construction : les mouvements sont
  append-only et un rééchelonnement ne s'annule pas (D-502-M). Publié par le classement (et donc par la ligne de
  provision).
- **D-505-G — la contagion, quand la règle est active.** Débiteur = le membre, dans le dossier. **Source** : tout
  crédit du membre, `CLASSE` ou `PASSE_EN_PERTE`, qui a une échéance échue impayée et `joursRetard ≥
  seuilJoursRetard`. **Retard retenu** : le plus élevé des sources (à égalité, le plus petit `creditId`). Tout crédit
  `CLASSE` du membre dont le retard propre est inférieur prend la tranche du retard retenu et publie
  `contagion: { creditId, joursRetard }` (la source). Son `joursRetard` reste **le sien** : c'est le nom publié par
  STORY-502, il ne change pas de sens.
- **D-505-H — le coût.** Règle inactive ⇒ **aucune lecture de plus**. Règle active : la route unitaire lit les
  crédits du membre en un lot (3 lectures) ; une page du portefeuille lit, en un lot, les autres crédits des membres
  de la page (3 lectures) ; la proposition et l'acte l'appliquent en mémoire sur toutes les lignes, sans lecture de
  plus.
- **D-505-I — le passage en perte, un mouvement `PASSAGE_EN_PERTE`** `{ date, motif }`, réservé à `TENANT_ADMIN`
  (même arbitrage que D-504-K : un abandon de créance engage la direction). Son **montant est DÉCIDÉ par le
  service** — le capital restant dû à sa date, en fin de journée —, jamais saisi. Refusé : octroi annulé, aucun
  décaissement, aucun capital restant dû, date antérieure au dernier mouvement ou consolidée (D-502-S), **date
  future** (irréversible, leçon de D-504-L), exercice clos, crédit déjà passé en perte (index unique partiel). **Il
  ne s'annule pas** (emplacement inerte `CORRECTION_D_UN_PASSAGE_EN_PERTE`). Après lui, aucun décaissement,
  remboursement, rééchelonnement ni annulation de remboursement : `409 CREDIT_PASSE_EN_PERTE`.
- **D-505-J — le recouvrement, un mouvement `RECOUVREMENT_APRES_PERTE`** `{ date, montant }`, ouvert à
  `TENANT_ADMIN` et `TENANT_USER` comme un remboursement. Admis SSI un passage en perte est daté au plus tard de sa
  date ; le cumul net des recouvrements ne dépasse jamais, à aucune date, le montant passé en perte
  (`409 RECOUVREMENT_SUPERIEUR_A_LA_PERTE`) ; il s'annule à sa propre date par la route d'annulation existante. Il
  n'est pas imputé sur l'échéancier et ne rend aucun encours.
- **D-505-K — ce qui reste lisible.** Situation : `encours` = décaissé − capital remboursé − montant passé en perte
  (0 dès le passage) ; nouveaux champs `montantPasseEnPerte` et `recouvreApresPerte` (net des annulations).
  Classement : statut `PASSE_EN_PERTE` (précédence : arrêté avant l'octroi, octroi annulé, **passé en perte**,
  jamais décaissé), sans tranche ni catégorie, avec `passageEnPerte: { mouvementId, date, montant }` ; le retard
  reste publié tel que l'échéancier le dérive.
- **D-505-L — la provision d'un crédit passé en perte.** Sa ligne n'a pas de `provision` (D-504-I) mais
  `sortieEnPerte: { montantPasseEnPerte, provisionDejaConstatee, reprise }` : la provision déjà constatée est
  reprise, le passage étant lui-même la décision. Ces termes entrent dans les totaux `provisionDejaConstatee` et
  `reprise` : chaque terme d'un total est un champ de ligne.
- **D-505-M — la reprise suspendue.** Ligne `CLASSE` portant `restructuration` : si la provision déjà constatée
  dépasse la provision requise et qu'**aucune décision valable** n'existe — datée au plus tard de l'arrêté **et** au
  plus tôt du dernier rééchelonnement daté au plus tard de l'arrêté — alors `provisionConstituee` = déjà constatée,
  `reprise` = 0, `repriseSuspendue` = déjà constatée − requise. Sinon `provisionConstituee` = requise,
  `repriseSuspendue` = 0, et la décision retenue est publiée (`decisionDeReprise: { decisionId, date }`). Pour toute
  ligne : `provisionConstituee = provisionDejaConstatee + dotation − reprise`.
  ⛔ **L'arrêté suivant relit `provisionConstituee`** comme provision déjà constatée, et non plus `provisionRequise` :
  sinon la reprise suspendue disparaît au second arrêté, sans décision.
- **D-505-N — les états.** La proposition et l'arrêté publient `parCategorie` (`categorie`, `nombreCredits`,
  `capitalRestantDu`, `provisionRequise`, `provisionConstituee`) et les totaux `provisionConstituee` et
  `repriseSuspendue`. L'empreinte couvre en plus la règle de contagion et, par ligne, la catégorie, la
  restructuration, la contagion, la décision de reprise retenue et le passage en perte. Restent hors empreinte, comme
  en D-504-F : déjà constatée, dotation, reprise, constituée, suspendue — elles dépendent de l'arrêté de référence,
  épinglé par `versionDeReference` (D-504-M).
- **D-505-O — les décisions de reprise.** Collection `decisions_reprise_provision`, append-only.
  `POST …/membres/:membreId/credits/:creditId/decisions-reprise-provision` `{ date, motif }` (`TENANT_ADMIN`) et
  `GET` sur la même route (la liste du crédit). Refus : `404` anti-énumération ; `409 DECISION_REPRISE_DATE_FUTURE` ;
  `409 DECISION_REPRISE_SANS_REECHELONNEMENT` (aucun rééchelonnement daté au plus tard de la décision) ;
  `409 DECISION_REPRISE_EN_DOUBLE` (index unique crédit + date). Un seul document : pas de transaction.

### Hors périmètre, déclaré

Valeurs de contagion (aucun texte SFD) · crédits redevenus sains après souffrance et concordats (291) · période
d'observation ou maintien en souffrance d'un restructuré · correction d'un passage en perte · abandon comptable des
intérêts échus (extra-comptables selon le RCSFD) · écritures 6691 / 291-294 / reprises et publication en balance
(STORY-507) · PAR 30/90/180 (STORY-506) · événements Kafka (outbox inerte, STORY-507) · pénalités de retard.

## Critères d'acceptation

- [ ] AC-1 — Le classement s'applique **au débiteur** : la règle de contagion vient du paquet
      prudentiel (activée ou non, avec son seuil), jamais du code.
      *Preuve* : paquet fictif actif ⇒ un crédit à jour d'un membre dont un autre crédit dépasse le seuil prend la
      tranche de ce retard ; **changer le seuil dans le paquet change le classement** (mutation) ; paquet servi 1.2
      inactif ⇒ classement identique, crédit par crédit, à celui de STORY-503.
- [ ] AC-2 — Un crédit **rééchelonné** porte un marqueur permanent, avec la date et le motif du
      rééchelonnement, et le **nombre de rééchelonnements successifs**.
      *Preuve* : deux rééchelonnements ⇒ `nombreReechelonnements: 2`, dates et motifs ; rejeu à une date entre les
      deux ⇒ 1 ; avant le premier ⇒ absent.
- [ ] AC-3 — Les indicateurs et les états distinguent **sain**, **restructuré** et **en souffrance**.
      ⛔ Un crédit restructuré ne se compte **jamais** dans « sain » sans être nommé.
      *Preuve* : rééchelonné à jour ⇒ `RESTRUCTURE` (mutation « marqueur ignoré » rouge) ; `parCategorie` somme
      exactement les lignes `CLASSE`.
- [ ] AC-4 — Les **abandons de créance** (passage en perte) sont des événements (AD-1), et le crédit
      abandonné reste lisible : une créance passée en perte peut être recouvrée plus tard.
      *Preuve* : passage ⇒ encours 0, montant = capital restant dû, crédit lisible en situation et classement ;
      recouvrement ultérieur publié ; tout autre mouvement refusé ; persistance prouvée sur Mongo réel.
- [ ] AC-5 — ⚠️ Un rééchelonnement **ne libère pas** la provision automatiquement. Sa reprise est
      une décision, au même titre que sa dotation (STORY-504 AC-4).
      *Preuve* : arrêté 1 provision X, rééchelonnement, arrêté 2 ⇒ reprise 0, suspendue ; arrêté 3 sans décision ⇒
      toujours maintenue (mutation « relit `provisionRequise` » rouge) ; décision datée ⇒ reprise proposée.

## Progress Tracking

**Statut : `in_progress` (2026-09-15).** Flux APEX complet dans la session. Branches `MNV-505` créées **avant toute
ligne** : `docs` (base `main`, `745ca59`) et `microfinance-service` (base `dev`, `c15e006`).

### Développement — trois lots `opus` en parallèle, rapports vérifiés avant intégration

Un commit de contrats partagés (`2e047fa` : types de mouvement de perte, rubrique `ContagionPrudentielle`, helper
`passageEnPerte`, paquet fictif avec contagion), puis trois worktrees hors de l'arbre monté (leçon de STORY-503) :

- **Lot A — paquet 1.2** (`22692c4`) : schéma et validateur (règle **P4** : active ⇒ seuil entier sûr ≥ 0 et au moins
  une tranche ; inactive ⇒ `null`), chargeur (`fautesDeLaContagion`, accord P4 ↔ chargeur), artefact
  `prudentiel-sfd-bceao@1.2` (sha256 `b7c83604…9d209d7e0`), route du paquet. **Vérifié en session** : sha256 de 1.0
  (`b4b79e8a…`) et 1.1 (`c76b1afe…`) inchangés, diff 1.1 → 1.2 limité à version, révision, mise en garde (7) et
  rubrique ; validateur OK sur les trois artefacts.
- **Lot B — passage en perte et recouvrement** (`4326aac`) : routes `passage-en-perte` (TENANT_ADMIN) et
  `recouvrements`, montant = capital restant dû décidé par le service, index `unicite_passage_en_perte_par_credit`,
  refus nommés, situation (`montantPasseEnPerte`, `recouvreApresPerte`, `encours`). Balayages : 144 scénarios
  (montant = capital restant dû), 40 + 200 séquences (plafond du recouvrement à toute date). Mutations M1 → M7 rouges.
- **Lot C — classement et provisionnement** (`bd444dc`) : statut `PASSE_EN_PERTE`, `categorie`, `restructuration`,
  `contagion` (fonction pure `appliquerContagion`), `sortieEnPerte`, reprise suspendue, `provisionConstituee` relue
  par l'arrêté suivant, `parCategorie`, collection et routes `decisions-reprise-provision`. Balayages : 720 permutations
  et découpages en pages, 176 lignes (identités de provision), 60 portefeuilles (totaux). Mutations M1 → M8 rouges.

### Décisions prises pendant le dev (2026-09-15) — à relire en revue

- **D-505-P** — l'index du passage en perte porte sur `(creditId, type)` : l'index d'annulation d'octroi occupe déjà la
  clé `{creditId}`, et deux index partiels de même clé rendraient la violation indiscernable (`violeIndexUnique`).
- **D-505-Q** — la décision de reprise retenue est publiée dès qu'elle est valable, même sans reprise, et lue même sans
  arrêté de référence : elle entre dans l'empreinte, qui ne dépend jamais de l'arrêté de référence ; la lire seulement
  avec lui changerait l'empreinte d'un arrêté à sa réapplication (AC-6).
- **D-505-R** — `parTranche` garde ses quatre totaux : une ligne passée en perte n'a pas de tranche, sa reprise n'entre
  que dans les totaux généraux.
- **D-505-S** — la route du paquet publie `declassement: {}` quand le paquet ne déclare pas la contagion.
- Refus `CREDIT_PASSE_EN_PERTE` sans détail (même corps par la règle et par l'index) ; liste des décisions paginée ;
  `decidePar` publié.

### Intégration sur `MNV-505` (en session)

- A et B appliqués sans conflit ; C : six conflits d'ajouts concurrents (liste des restrictions de rôle, emplacements,
  e2e HTTP) résolus par script à l'octet — octet NUL hérité de `test/credits.e2e-spec.ts` préservé ; compte des
  opérations publiées porté à 22 (16 crédits, 2 produits, 4 provisionnement).
- **Doublon supprimé** : les lots A et C avaient chacun écrit un `fautesDeLaContagion` ; `regle-de-classement.ts`
  réutilise celui du chargeur (règle « jamais deux copies d'une formule »), ses tests passent par `regleDeClassement`.
- **Horloge explicite** : le lot B avait donné à `CreditsService` une horloge par défaut ; retirée, les cinq
  constructions directes des suites la reçoivent.

### Portes sur l'état intégré (rejouées en session, en séquence)

Lint 0 · build OK · **2 607** unitaires / 128 suites, couverture **99,77 / 97,15 / 99,65 / 99,79** · **374** e2e HTTP
(78 sautés : suites Mongo sans URI).

**Mongo réel** (5 suites, `MONGO_INTEGRATION_URI`, replica set `rs0`) : premier passage **73/78** — les 5 rouges
étaient des tests de STORY-504 et STORY-659 qui comparaient les totaux et l'en-tête d'arrêté champ pour champ, sans
les champs de la 505 (`provisionConstituee`, `repriseSuspendue`, `parCategorie`) ; aucun écart de montant. Attendus
complétés depuis les totaux que chaque test calcule déjà (jamais en dur), et les lignes relues en base comparées aussi
sur `categorie` et `sortieEnPerte`. Second passage : **78/78**, aucun sauté (`provisionnement.mongo` 27/27).

### PR

`microfinance-service` **#12** (`MNV-505` → `dev`), un commit de feature `7ad63c1` (les commits des lots et de
l'intégration regroupés).

### Revue de code (⑥) — aucun bloquant, un constat corrigé d'office

- **[85] Commentaire du plafond de coût resté à « cinq lectures par page »** (`bornes-arrete.ts`) : la 505 ajoute la
  lecture des décisions de reprise, une sixième. Corrigé.
- Lentille `ponytail-review` : deux constats non bloquants. **Laissés de côté** : la garde « date future » est une
  comparaison d'une ligne, dont le code et le message diffèrent pour chaque route (arrêté, passage en perte, décision) —
  un helper commun ajouterait plus qu'il ne retire ; le regroupement des décisions par crédit n'est pas une copie de
  `regrouperParCredit` (les valeurs regroupées n'ont pas la même forme).
- Écartées avec preuve par la revue : catégorie sur l'échéance impayée (et non `joursRetard > 0`), contagion
  indépendante de l'ordre et des pages, aucune lecture de contagion quand la règle est inactive, `provisionConstituee`
  relue par l'arrêté suivant, identités de provision et empreinte, rejeu d'une date passée, non-régression des noms
  publiés. **Coût mesuré** de la dernière passe du provisionnement, sur 50 000 crédits : 134 à 286 ms de boucle tenue
  (la partie lourde reste page par page, entre deux lectures).
- **Dettes relevées, hors périmètre** : des lignes d'arrêté écrites avant la 505 n'ont ni `provisionConstituee` ni
  `parCategorie` (migration à prévoir avant la production, règle du projet : le dev repart de zéro) ; les lignes d'arrêté
  ne persistent ni `restructuration` ni `contagion`, ce que les écritures 291-294 de STORY-507 devront trancher.

### Revue de sécurité (⑦) — un constat confirmé (85), corrigé avant le merge

**Une décision de reprise pouvait valoir pour un rééchelonnement qu'elle n'avait pas vu.** Une décision est valable
pour le dernier rééchelonnement daté au plus tard d'elle (D-505-M) ; or un `TENANT_USER` pouvait enregistrer un
nouveau rééchelonnement **antidaté** ou **posé le jour même** d'une décision existante : la décision prise pour le
premier rééchelonnement couvrait alors le second, et la provision d'un crédit redevenu en souffrance était reprise sans
l'acte d'un `TENANT_ADMIN` — exactement le chiffre maquillé que la story veut empêcher (CWE-840, OWASP A04).

### Décision du 2026-09-15 (après la revue de sécurité)

- **D-505-T — un rééchelonnement se date STRICTEMENT après la dernière décision de reprise du crédit**
  (`409 REECHELONNEMENT_ANTERIEUR_A_UNE_DECISION_DE_REPRISE`, détail `dateDecision`), jugé **sous le verrou du
  crédit**. L'enregistrement d'une décision prend le **même verrou**, dans une transaction, et relit les mouvements sous
  lui : une décision et un rééchelonnement concurrents se sérialisent, le second relit le premier. Écarté : comparer les
  horodatages d'enregistrement à la lecture — dépendant des horloges des instances, et silencieux pour l'utilisateur.

### Correctifs de revue livrés (commits dédiés `76894c8` revue, `828e530` sécurité)

- **Revue** : commentaire du plafond de coût porté à six lectures par page.
- **Sécurité (D-505-T)** : refus `REECHELONNEMENT_ANTERIEUR_A_UNE_DECISION_DE_REPRISE` dans `deciderReechelonnement`, la
  dernière décision lue sous le verrou (`DecisionsRepriseProvisionRepository.derniereDateDuCredit`, en session) ;
  enregistrement d'une décision en transaction, verrou du crédit en première écriture, mouvements relus sous lui,
  insertion en session, concurrence persistante traduite en `409 CREDIT_ECRITURE_CONCURRENTE` ; Swagger du
  rééchelonnement complété ; message du `404 CREDIT_INTROUVABLE` partagé (même corps partout).
- **Preuves** : unitaires (refus le jour même et après la décision, admis la veille, lecture sous le verrou et dans la
  session ; ordre verrou → mouvements → insertion ; mouvements de l'historique ignorés ; 404 au message commun) ; e2e
  HTTP (antidaté et jour même ⇒ 409, rien d'écrit) ; **Mongo réel** : scénario séquentiel, et **course forcée** — la
  décision relit les mouvements sous son verrou puis attend, le rééchelonnement du même jour part pendant l'attente ⇒ la
  décision s'écrit, le rééchelonnement jamais. Suites Mongo `credits`, `classement-credits`, `provisionnement` :
  **57/57** sur `828e530`.

| Mutation | Tests rougis |
|---|---|
| M-T1 — refus D-505-T rendu impossible | 2 unitaires (jour même, après) + 1 e2e HTTP |
| M-T2 — verrou de la décision pris APRÈS l'insertion | 2 unitaires (ordre, 404 du verrou) + **la course sur Mongo réel** (les deux s'écrivent : reçu `ECRIT`) |

⚠️ Une première passe de mutations ne compilait pas sous ts-jest (`noUnusedLocals` / `noUnusedParameters` : « 0 test »,
« failed to run ») : écartée, aucun rouge de compilation n'est compté comme une preuve ; mutations réécrites pour
compiler. ⚠️ Portly injoignable pendant cette phase (« Open Portly.app ») : les suites de test bornées ont été lancées
directement, aucun serveur hors Portly.

## Notes

- Voir [[STORY-503]], [[STORY-504]], [[STORY-506]], [[STORY-659]].
- Source relue : RCSFD version allégée, p. 64-65 (compte 29 et 299), PDF cb-umoa.org, empreinte consignée dans
  `docs/referentiels/README-prudentiel-sfd-bceao.md`.
