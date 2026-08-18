# STORY-370 : L'import cesse de fondre deux banques en une — la provenance d'un auxiliaire survit à la normalisation

Status: done

**Epic :** EPIC-017 — Socle balance-service + contrat de balance canonique
**Points :** 5 · **Sprint :** 20 (backend) · **Service :** `balance-service` (`:3007`)
**Gap repris :** `GAP-auxiliaires-fusionnes-a-l-import`
**Décision :** **AD-5** de `architecture-balance-service-2026-08-15` — *la normalisation ne détruit
jamais une distinction qu'elle ne sait pas reconstituer*
**Origine :** défaut **créé par STORY-146**, **confirmé** par la vérification docker de STORY-172

---

## Le constat

La normalisation d'import ramène tout auxiliaire au compte de plan : **`5211BOA0` ET `5211ECO1`
deviennent tous deux `521100`** (tête `5211`, complétée par des zéros), puis sont **fusionnés en une
seule ligne** de balance.

⇒ **La balance ne distingue plus les deux banques.**

## Pourquoi ce n'est pas un bug de normalisation

⚠️ **La normalisation est une fonction du SEUL numéro de compte.** Elle **ne peut pas savoir** que deux
auxiliaires d'un même collectif désignent **deux comptes bancaires réels et distincts**. Elle fait
exactement ce qu'on lui a demandé.

Le regroupement **est signalé** — `comptesReecritsSansRegroupement`, avertissements d'import — mais
⛔ **l'information de provenance n'est pas conservée dans la ligne produite**. C'est là qu'est le
défaut : pas dans le calcul, dans **ce qui est jeté**.

## ⚡ La conséquence, et pourquoi aucun avertissement ne peut la rattraper

Le rapprochement bancaire ne peut **pas** restituer une position par banque : **l'information n'existe
plus dans la donnée**.

> ⛔ **Et le garde-fou existant est aveugle sur ce cas précis.** STORY-172 publie un avertissement dès
> que l'appariement retient **plusieurs** lignes. Ici, il en retient **UNE** — `nbComptesApparies = 1`
> — sur un solde pourtant **CUMULÉ**. **Donc aucun avertissement n'est possible.**

⇒ **Un cabinet à deux banques voit le solde des deux présenté comme celui d'une seule, face au relevé
d'une seule.**

⚠️ Le défaut est **antérieur à STORY-172**, qui **ne l'aggrave pas** : avant elle, ces comptes ne
s'appariaient **à rien du tout**.

## ⛔ Ce qu'il ne faut surtout pas faire

**Ne PAS corriger dans l'appariement.** *Deviner une ventilation que personne n'a déclarée serait pire
que le silence* — le rapprochement produirait des positions par banque **fabriquées**, et elles
seraient crédibles.

⇒ **La correction est côté IMPORT**, là où l'information existe encore.

## Ce que la story livre — deux voies, à trancher à l'ouverture

| Voie | Ce qu'elle fait | Ce qu'elle coûte |
| --- | --- | --- |
| **A — conserver la provenance** | La ligne de balance garde les auxiliaires qui l'ont produite ; le rapprochement **ventile** | Le contrat de ligne s'enrichit ⇒ checksum et consommateurs à vérifier |
| **B — refuser de fondre** | ⛔ Refus de fusionner deux auxiliaires rattachés à des **comptes de trésorerie déclarés distincts** | Aucun changement de contrat ; mais un import légitime peut être bloqué et demande une déclaration préalable |

⚡ **Les deux sont acceptables ; ce qui ne l'est pas est de fondre en silence.** La voie retenue est
écrite **dans la story avant de coder**, pas déduite du diff.

### ✅ Voie retenue à l'ouverture (2026-08-18) — **A, dans sa forme complète**

**La ligne de balance conserve les auxiliaires qui l'ont produite, AVEC leurs montants**, et le
rapprochement **ventile** — il ne devine rien, il relit ce que le fichier portait.

**Ce qui a été mesuré dans le code avant de trancher**, et qui rend A moins cher que la story ne le
craignait :

1. ⚡ **Le checksum n'est pas touché.** `v2` ne couvre que
   `{compte, libelle, mouvementDebit, mouvementCredit, soldeDebiteur, soldeCrediteur, niveauPreuve}`
   (`balance-canonique.ts`). Un champ **optionnel** hors de cette liste s'introduit exactement comme
   `origine` l'a été (« son absence est le cas courant […] c'est ce qui permet de l'introduire **sans**
   toucher au checksum, sans migration et sans changer le contrat `balance.created` »). ⇒ **pas de `v3`,
   pas de migration, contrat d'événement inchangé.**
2. ⚡ **La provenance n'est conservée QUE sur le cas visé** — un regroupement dont ≥ 2 sources
   s'apparient à ≥ 2 **comptes de trésorerie déclarés distincts**. Le collectif `411` d'un fichier à
   4 000 auxiliaires **ne porte rien** : c'est l'AC-3 (« le comportement actuel est inchangé »), et c'est
   aussi ce qui empêche le document de croître avec le fichier (CWE-770, même discipline que
   `MAX_SOURCES_PAR_REGROUPEMENT`).
3. ⚡ **Ventiler ici n'est pas deviner.** Les montants par auxiliaire **existent dans le fichier** ; ils
   sont aujourd'hui jetés au moment du netting. Les rendre au rapprochement lui restitue une position par
   banque **déclarée**, pas fabriquée — la frontière que la story trace au § *Ce qu'il ne faut surtout
   pas faire* reste tenue : **aucune règle de ventilation n'est inventée**, ni ici ni dans l'appariement.

**Pourquoi pas B.** Le refus est plus sûr sur le contrat, mais le plan comptable du référentiel fait
**6 caractères** : l'auxiliaire n'y survit pas. Un cabinet à deux banques — le cas courant, pas
l'exception — **n'a donc aucun chemin de reprise** : il ne peut pas produire deux lignes `5211xx` que le
plan n'admet pas. B échangerait une fusion silencieuse contre un **blocage sans issue**, et le motif du
blocage (« déclarez vos comptes autrement ») ne décrit aucune action que le comptable puisse réellement
faire.

**Pourquoi pas A-minimal** (les noms des sources, sans les montants). Il aurait suffi à satisfaire l'AC-2
*par le refus de présenter* — le rapprochement dit « solde cumulé sur 2 banques, je ne publie pas de
position par banque ». C'est honnête, mais ça laisse le cabinet **sans son rapprochement** alors que la
donnée nécessaire était dans le fichier et qu'on venait de la jeter. Conserver les montants coûte le même
champ optionnel ; s'en priver, c'est choisir de rester aveugle par économie.

## Critères d'acceptation

- **Étant donné** un import portant `5211BOA0` et `5211ECO1`, tous deux rattachés à des **comptes de
  trésorerie déclarés distincts** **quand** l'import s'exécute **alors** ⛔ **les deux soldes ne sont
  jamais présentés comme un seul, sans trace** — soit la provenance survit (A), soit l'import refuse
  (B).
- **Étant donné** un rapprochement sur ce cas **quand** il s'exécute **alors** il **ne présente pas un
  solde cumulé comme celui d'une seule banque**.
- **Étant donné** deux auxiliaires d'un même collectif **qui ne désignent aucun compte de trésorerie
  déclaré** **quand** l'import s'exécute **alors** le comportement actuel est **inchangé** — ⛔ la story
  ne durcit pas le cas ordinaire.
- ⛔ **Étant donné** l'appariement **quand** on lit son code **alors** **aucune ventilation n'y est
  devinée** : la correction reste côté import.
- **Étant donné** un import ancien rejoué **quand** il passe **alors** son résultat est **explicable** :
  ce qui change est **annoncé**, jamais découvert dans une balance.

## Ce que cette story ne fait PAS

- ⛔ Elle ne revient pas sur la normalisation elle-même (STORY-146), qui reste **juste** pour tous les
  comptes non auxiliaires.
- ⛔ Elle ne touche pas au niveau de détail ni aux prédicats de compte (STORY-146/172, fermés).
- ⛔ Elle n'invente **aucune** règle de ventilation.

## Definition of Done

- [x] Le cas **deux banques** est couvert par un test **qui échoue sur la version actuelle** — 10
      mutations, 10 rouges **par assertion**.
- [x] La voie retenue (A) est **écrite dans la story** avant l'implémentation, avec son motif.
- [x] Le rapprochement **ne peut plus** présenter un solde cumulé comme celui d'un seul compte : il
      **ventile** quand la provenance le permet, et le **dit** (`cumulNonVentilable`) quand elle ne le
      permet pas — y compris sur `nbComptesApparies = 1`, le cas précis qui restait muet.
- [x] **Non-régression** : un import sans compte de trésorerie déclaré produit **exactement** la même
      balance qu'avant — prouvé en docker sur une **seconde organisation réelle**, checksum identique.
- [x] `GAP-auxiliaires-fusionnes-a-l-import` passe à **fermé**.

---

## Progress Tracking

- **2026-08-18** — statut `not_started` → `in_progress`. Branches `MNV-370` ouvertes sur `docs/` (base
  `main`) et `balance-service` (base `dev`).
- **2026-08-18** — ✅ **CLÔTURÉE** : PR `prospera-balance-service#41` rebase-mergée sur `dev`
  (4 commits : feature, vérif-docker, revue de code, sécurité). Statut aligné aux 3 endroits,
  `completed_date` posée, `GAP-auxiliaires-fusionnes-a-l-import` **fermé**.
- **2026-08-18** — ✅ **voie tranchée à l'ouverture : A dans sa forme complète** (provenance *et*
  montants, restreinte au cas trésorerie). Motif complet au § *Voie retenue à l'ouverture*, écrit
  **avant** la première ligne de code.

### Implémentation (commit `2f9f77d`)

`LigneBalance.sources?` — compte du fichier + 4 colonnes + niveau de preuve, capturés **avant le
netting** de l'agrégat. Posé **uniquement** quand ≥ 2 auxiliaires du regroupement sont des comptes de
trésorerie **déclarés** distincts, l'appariement se faisant par **égalité stricte sur le compte brut** :
un préfixe ferait apparier la racine `521` — le défaut de ventilation faute de saisie — aux **deux**
auxiliaires, et l'import conclurait à deux banques déclarées là où le cabinet n'en a déclaré aucune.
Côté rapprochement, `apparierCompteBalance` publie le solde de **la** source déclarée (**relu**, jamais
calculé) et, quand il ne peut pas séparer, l'annonce par `cumulNonVentilable`.

### Portes DoD

lint 0 warning · build OK · **2845 unitaires + 672 e2e** verts · couverture **99,01 / 91,74 / 98,21 /
99,09** (seuils 65/90/90/90).

**10 mutations, 10 rouges PAR ASSERTION** — aucune par erreur de compilation (trois tentatives ont dû
être réécrites pour cette raison précise, cf. STORY-179), et deux mutations **non appliquées** ont été
détectées avant d'en tirer un faux vert (cf. STORY-368) :

| # | Mutation | Test qui vire au rouge |
|---|---|---|
| M1 | `buildCanonique` jette `sources` | *persiste `sources` (sinon la story est INERTE)* |
| M2 | comparaison au compte déclaré par **préfixe** | *une RACINE ne crée AUCUNE provenance* |
| M3 | seuil « ≥ 2 banques » ramené à 1 | *n'attache rien quand UNE SEULE banque est fondue* |
| M4 | l'appariement publie le cumul malgré la ventilation | 6 tests (règles pures **et** service) |
| M5 | `cumulNonVentilable` jamais posé | *le cumul est DIT alors que nbComptes vaut 1* |
| M6 | `versLigne` (unique chemin de **lecture**) jette la provenance | 3 tests du service |
| M7 | garde du validateur *fail-open* | 5 refus de provenance malformée |
| M8 | le checksum v2 se remet à sceller `sources` | *la provenance NE CHANGE PAS le checksum* |
| M9 | `sources` perd ses décorateurs (whitelist l'élague) | e2e *ACCEPTE une provenance bien formée* |
| M10 | `default: undefined` retiré du `@Prop` | *n'écrit AUCUNE clé `sources`* |

### ⚡ Vérification docker — stack **neuve** (`down -v`), Mongo `rs0`, Kafka up

Deux cabinets **réels** (register → e-mail vérifié → login RS256), dossiers « Mon cabinet » **répliqués
par Kafka** dans `balance_service.dossiers_dossier`, référentiel `syscohada-revise@2.1` actif.

| Contrôle | Mesuré en base / à l'API |
|---|---|
| **La ligne porte sa provenance** | `521100` en base : `sources: [5211BOA0 = 700 000 000, 5211ECO1 = 300 000 000]`, montants **avant netting** |
| **AC-5 — c'est annoncé** | avertissement d'import : « 1 compte(s) du plan regroupent plusieurs comptes de trésorerie déclarés : 521100 (5211BOA0 + 5211ECO1) » |
| ⚡ **AC-2 — position PAR BANQUE** | BOA ⇒ `soldeComptable = 700 000 000` · Ecobank ⇒ `300 000 000`, `ventileDepuisProvenance: true`. **Avant la story les deux affichaient 1 000 000 000** |
| ⚡ **Le trou de STORY-172 est fermé** | compte déclaré `521` (racine, le défaut) ⇒ solde `1 000 000 000`, `nbComptesApparies = 1` — donc l'avertissement `nbComptes > 1` reste muet — mais `cumulNonVentilable: true` **et** l'avertissement dédié partent |
| **AC-3 — non-régression** | **2ᵉ cabinet réel, même fichier, aucun compte déclaré** : `provenancesTotal = 0`, la ligne `521100` ne porte **aucune** clé `sources` |
| ⚡ **Checksum inchangé** | les **deux** balances (avec et sans provenance) portent le **même** `checksum` et `checksumVersion: v2` ⇒ ni `v3`, ni migration, contrat `balance.created` intact |
| **Aucun orphelin** | `0` ligne `sources: []` sur toute écriture postérieure au correctif |

⛔ **Un défaut trouvé PAR cette vérification, invisible aux 2842 unitaires et 672 e2e** (commit
`acb541a`) : Mongoose donne à tout chemin de type tableau un défaut **implicite** `[]`. Le service
omettait bien la clé — son test l'assertait — mais le document persisté portait `sources: []`, c'est-à-
dire l'affirmation « rien à séparer » là où la vérité est « on ne sait pas ». `default: undefined` posé,
garde-fou unitaire ajouté (`balance.schema.spec.ts`, modèle instancié en mémoire), et la vérification
**rejouée après `docker restart`** — le hot-reload sait mentir.

---

## ⑥ Revue de code — 6 constats, tous corrigés (commit `c291801`)

| # | Constat | Gravité |
|---|---|---|
| ① | ⚡⚡ **`fusionnerParCompte` jetait `sources`** — une balance **provisionnée** (STORY-094) est bâtie par cette fusion **et relue par le rapprochement** (`trouverDerniereToutesSources` n'exclut que `A_NOUVEAUX`). Dès le premier provisionnement, la provenance disparaissait et le rapprochement repassait au **cumul** des deux banques — sans même `cumulNonVentilable`, plus aucune source ne subsistant pour le déclencher. **La story se refermait en silence, par la porte de derrière.** | **BLOQUANT** |
| ② | L'avertissement contenait un exemple **figé** (`ex. « 5211BOA0 »`) ⇒ l'assertion `toContain('5211BOA0')` était satisfaite par le **gabarit**, jamais par la donnée | non-bloquant |
| ③ | Test **tautologique** « ignore les déclarations vides » — mutation exécutée (filtre retiré) ⇒ **43/43 verts** | non-bloquant |
| ④ | La troncature se déduisait de `provenances`, **elle-même plafonnée** à 20 ⇒ une ligne tronquée au-delà du 20ᵉ regroupement perdait ses banques **en silence** | non-bloquant |
| ⑤ | `GET /balances/:id` renvoyait `sources` **sans que Swagger le déclare** (aucune erreur de compilation : une propriété optionnelle en plus reste assignable) | non-bloquant |
| ⑥ | L'avertissement affirmait « c'est une racine » **sans condition** — faux pour un comptable qui suit le conseil de STORY-172 et déclare `521100`, un compte de **détail** | non-bloquant |

⚡ **La règle retenue pour ①** : la provenance n'est reportée que si le compte a **un seul
contributeur**. Dès deux, elle est **abandonnée** — un socle d'à-nouveaux apporte un solde que
*personne n'a ventilé par banque*, et reporter la décomposition des seuls mouvements publierait une
position **amputée de l'à-nouveau** : le défaut même que STORY-147 a corrigé.

## ⑦ Revue de sécurité — 2 constats, corrigés (commit `a973665`)

⚡⚡ **CONSTAT 1 — CWE-345, A04:2021, Medium, confiance 90.** `sources` était le **seul** champ
financièrement porteur du contrat à n'être encadré par **aucun** des quatre garde-fous de la ligne
(plan, XOR, équilibre FR-A25, checksum). Un `TENANT_USER` du cabinet pouvait déposer une balance
parfaitement équilibrée, au checksum valide, aux lignes légitimes, et n'y falsifier **que la
ventilation par banque** : le rapprochement — *« la pièce justificative de la clôture »* — publiait le
montant fabriqué comme la position de **ce** compte, `ecart: 0`, `ventileDepuisProvenance: true`,
**aucun avertissement**. Falsifier le même chiffre par la ligne aurait cassé l'équilibre et se serait
vu : **c'est l'asymétrie qui faisait la faille**, et le drapeau d'origine qui privait le lecteur de
toute raison de s'en méfier.

**Correctif** : une source ne peut nommer qu'un compte de trésorerie **réellement déclaré**.

⛔ **Et PAS le contrôle arithmétique que la revue proposait.** Elle recommandait de borner
`|Σ sources| ≤ |net de la ligne|` — **vérifié, cela rejetterait des imports légitimes**.
Contre-exemple : `5211BOA0` +700 et `5211ECO1` +300 déclarés, plus un auxiliaire **non déclaré** à
−900 ⇒ net de ligne **+100**, Σ des sources **+1000**. Les soldes de l'agrégat étant **nettés** et les
sources n'en étant qu'un **sous-ensemble déclaré**, aucune relation de borne ni de signe ne tient.
L'appartenance, elle, tient toujours.

**CONSTAT 2 — CWE-353, Low.** Le sceau ne couvre pas `sources`. Sans conséquence pour un client de
l'API (le checksum est un contrôle d'altération **en transit**, pas d'authenticité), mais l'écart est
désormais **documenté** dans `balance.checksum.ts`, avec sa porte de sortie (un `v3`, l'existant
restant vérifiable en `v2`).

**Durcissement** : le repli du paramétrage trésorerie était **muet** — l'import dit maintenant que la
provenance **n'a pas pu être évaluée**, au lieu de produire une balance indistinguable d'un dossier
n'ayant rien à séparer.

**Écartés après vérification** : XSS sur l'avertissement (valeurs contraintes `^[0-9A-Za-z]+$`/20 en
amont) · isolation multi-tenant de `comptesComptablesDeclares` (`orgId` du JWT, dépôt fail-closed,
404 jamais 403) · DoS par volume (limite de corps Express 100 kB + `ArrayMaxSize` + volume fonction du
**paramétrage**, pas du fichier).

## ⑧ Vérification docker **rejouée sur l'état final** (après `docker restart`)

| Contrôle | Résultat |
|---|---|
| ① corrigé, **prouvé sur données réelles** | balance `PROVISIONS_FISCALES` v3 créée via l'API : elle **conserve** `sources`, le rapprochement **relit bien cette v3** (confirmant la prémisse du constat) et BOA garde **700 000 000** |
| ② corrigé | l'avertissement nomme les banques **lues dans la provenance** : « (5211BOA0, 5211ECO1) » |
| ⑤ corrigé | `GET /balances/:id` rend `sources`, et `LigneView` publie bien **8 propriétés** à l'OpenAPI |
| ⚡ **la faille est fermée** | `POST /balances` avec une provenance sous `5211FANTOME` (jamais déclaré) ⇒ **400** nommant le compte fautif |
| non-régression | la même provenance sous des comptes **déclarés** ⇒ **201** ; l'import fichier légitime ⇒ v4, `provenancesTotal: 1` ; AC-2 inchangé (700M / 300M / cumul dit) |

⚠️ **Instabilité e2e observée, et elle PRÉEXISTE** : 5 passes de la suite complète sur `MNV-370` ⇒ 1
échec ; 2 passes sur `origin/dev` en worktree ⇒ **115 puis 10 échecs**, sur des suites **différentes à
chaque fois** et toutes vertes en isolation. Ce n'est donc pas une régression de la branche — c'est la
famille de flake que STORY-236 a réduite sans la fermer. **À ne pas porter au crédit de cette story.**
