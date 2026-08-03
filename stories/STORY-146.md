# STORY-146 : `balance-service` — le n° de compte de la balance canonique est régi par le référentiel (**6 chiffres** en SYSCOHADA), et l'import Sage normalise ses comptes vers le plan

**Epic :** EPIC-017 — Contrat canonique & socle Atelier
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § FR-A04, NFR-A06 · **STORY-101** (contrat canonique — `FORMAT_COMPTE`) · **STORY-078** (`ReferentielPackageBalance.isCompteValide`) · **STORY-086** (adaptateur Sage) · **STORY-085** (ventilation — seul endroit où `isCompteValide` a été branché)
**Priorité :** Must Have
**Story Points :** 5
**Complexité :** medium
**Statut :** done
**Assigné à :** vivianMoneyVibesGroupes
**Créée le :** 2026-07-31
**Sprint :** 19
**Service :** `balance-service` (:3007)
**Branche :** `MNV-146`
**Demande :** PO, 2026-07-31 — « au niveau de la balance le numéro de compte doit être de 6 chiffres obligatoire ; ici le numéro de compte est de 8 chiffres »

---

## La demande, et ce qu'elle heurte

**La demande est juste** : une balance destinée à la DSF porte des comptes SYSCOHADA à **6 chiffres**.
Un compte à 8 chiffres n'est pas un compte du plan — c'est un compte **Sage**.

**Mais une regex `^\d{6}$` posée telle quelle casserait trois choses déjà livrées**, et le code le dit
lui-même, chiffres à l'appui (`balance.validator.ts`) :

> « La borne **basse** était à 3 (STORY-101) — et rendait **inexprimables des comptes que les
> référentiels embarqués définissent eux-mêmes** : **75 comptes à deux caractères** dans
> `syscohada-revise@2.1` (dont `13` Résultat net, `12` Report à nouveau) et **48** dans
> `sfd-bceao@2.0` (dont `58` Report à nouveau). Une balance ne pouvait donc pas porter son propre
> compte de résultat, et la reprise d'à-nouveaux (STORY-087) ne pouvait affecter le résultat nulle part. »

Autrement dit : **le référentiel lui-même déclare des comptes qui ne font pas 6 chiffres**, et
STORY-087 en dépend pour l'affectation du résultat.

**La bonne forme de la demande n'est donc pas une regex plus stricte, c'est de rendre l'autorité au
référentiel** — ce que NFR-A06 exige déjà (« les règles du référentiel ne sont **jamais** codées en
dur ») et ce que le reste du service fait déjà partout.

---

## Le vrai défaut : une délégation qui n'est jamais retombée

`ReferentielPackageBalance.isCompteValide(compte)` **existe depuis STORY-078**. Il est utilisé par
`comptes-ventilation`, `cahiers-depenses`, `cahiers-recettes`, `categories-depenses`, `rattachement`.

**Il n'est PAS utilisé par `BalanceValidator`** — le seul endroit qui valide *la balance elle-même*.
Celui-ci code en dur :

```ts
const FORMAT_COMPTE = /^[0-9A-Za-z]{2,20}$/;   // balance.validator.ts
```

STORY-078 l'avait pourtant écrit noir sur blanc :

> « ⚠️ Prédicat **seul** : 078 ne l'applique nulle part. […] le **branchement sur la validation de
> balance appartient à STORY-085**. »

STORY-085 (livrée) l'a branché sur le chemin **cahiers**, pas sur `BalanceValidator`. Conséquence
vérifiée sur `origin/dev` le 2026-07-31 : **une balance soumise par `POST /balances` ou importée de
Sage est validée par une regex, pas par le référentiel de son organisation.**

⚠️ **Deuxième symptôme du même défaut** : il existe une **seconde regex, divergente**, dans
`src/modules/tresorerie/dto/compte-tresorerie.dto.ts` → `/^[0-9A-Za-z]{3,20}$/` (borne basse **3**, pas 2).
Deux définitions du « format d'un compte » cohabitent dans le même service.

---

## User Story

En tant que **cabinet comptable**,
je veux que **les comptes de ma balance soient ceux de mon plan** — 6 chiffres en SYSCOHADA — et que
les comptes Sage à 8 chiffres ou auxiliaires soient **ramenés à leur compte de plan**,
afin que **la liasse que je dépose porte des comptes que l'administration reconnaît**, et non les
comptes internes de mon logiciel de saisie.

---

## Périmètre

### A. L'autorité passe au référentiel — suppression des regex en dur

- `BalanceValidator` appelle **`referentiel.isCompteValide(compte)`** au lieu de `FORMAT_COMPTE`.
  Le référentiel est celui **résolu pour l'organisation** (`ReferentielLoader`, STORY-078) — le même
  qui pilote déjà la suggestion de compte (STORY-139) et la ventilation (STORY-085).
- **Supprimer** `FORMAT_COMPTE` de `balance.validator.ts` **et** la regex divergente de
  `compte-tresorerie.dto.ts` : une seule définition, portée par le paquet.
- Le message d'erreur doit **nommer le référentiel actif** (« compte inconnu du plan
  `syscohada-revise@2.1` ») — aujourd'hui il annonce un format générique qui n'apprend rien.

### B. La règle « 6 chiffres » devient une règle **du paquet SYSCOHADA**, pas du code

- Le paquet déclare la **longueur du niveau de détail** attendu (6 pour SYSCOHADA révisé) ; les
  comptes **collectifs / têtes de classe** qu'il définit lui-même (`12`, `13`, `521`, `411`…) restent
  valides **parce qu'il les déclare**, pas parce qu'une regex est permissive.
- ⚠️ **Arbitrage à trancher au lancement** — `isCompteValide` reconnaît aujourd'hui **par préfixe**
  (c'est écrit dans son contrat : « exiger une égalité stricte rejetterait la quasi-totalité d'une
  balance Sage »). Or c'est **exactement ce préfixe qui laisse passer les 8 chiffres**. Deux options :
  - **(a)** `isCompteValide` conserve la reconnaissance par préfixe (elle sert au *rattachement*), et
    la balance applique **en plus** une exigence de **niveau de détail** ⇒ un `60100000` est
    *rattachable* mais **pas déposable** ;
  - **(b)** on introduit un prédicat distinct `isCompteDeDetail(compte)` sur le paquet.
  **Recommandation : (b)** — deux questions différentes (« à quel poste ça se rattache ? » vs « est-ce
  un compte du plan ? ») méritent deux prédicats, sinon un futur appelant tranchera au hasard.

### C. La normalisation à l'import Sage — **le cœur de la demande**

Le plan de base Sage fait **8 chiffres**, et Sage produit en plus des comptes **auxiliaires/tiers**
(`411FACTURE`, `5211BOA0`). L'adaptateur (STORY-086) les recopie aujourd'hui **tels quels**.

- L'import **normalise** vers le compte de plan : `60100000` → `601000`, `411FACTURE` → `411000`.
- ⚠️ **La normalisation fait COLLISIONNER des lignes** — deux comptes auxiliaires d'un même
  collectif (`411DUPOND`, `411MARTIN`) deviennent un seul `411000`. Le comportement attendu est
  l'**agrégation** (somme des montants), qui est la définition même d'un compte collectif dans une
  balance générale. **Elle ne doit jamais être silencieuse** : le nombre de lignes change entre le
  fichier et la balance, et un comptable qui compte ses lignes doit comprendre pourquoi.
- La normalisation est **tracée** : l'aperçu `dryRun` (STORY-086) annonce les regroupements
  (« 47 comptes auxiliaires regroupés en 12 comptes collectifs ») **avant** toute persistance.
- ⚠️ **La normalisation ne doit pas déséquilibrer** : agréger des lignes conserve les totaux par
  construction — à **prouver** par un test sur un fichier réel, pas à supposer.
- Le `niveauPreuve` d'une ligne agrégée prend le **plus faible** des niveaux regroupés (on ne peut pas
  prétendre « fichier » sur un agrégat dont une composante était estimée).

### D. Les balances déjà stockées

- `compte` **entre dans le checksum** (`balance.checksum.ts` : `compte`, `libelle`, `debit`, `credit`,
  `niveauPreuve`). Normaliser les comptes **change le checksum** d'une balance recalculée.
- ⇒ **Aucune migration rétroactive** : les balances existantes gardent leurs comptes et leur checksum
  (elles sont immuables une fois `VALIDÉE`, et réécrire un checksum détruirait la preuve qu'il porte).
  La règle s'applique **aux balances créées à partir de cette story**.
- ⚠️ À confirmer au lancement : combien de balances existent réellement en base hors jeux de test ?
  Si le parc est vide (probable — le dogfood n'est pas amorcé), le point est théorique et doit être
  **écrit comme tel** plutôt que de justifier un mécanisme qui ne servira jamais.

**Hors périmètre :** la table de passage compte → poste (`bilan-service`, STORY-055) · les surcharges
d'organisation (FR-A07/STORY-058) · le changement de plan d'une organisation en cours d'exercice.

---

## Critères d'acceptation

1. `BalanceValidator` **n'embarque plus aucune regex de compte** ; la validité est décidée par le
   paquet référentiel résolu pour l'organisation.
2. La regex divergente de `compte-tresorerie.dto.ts` est supprimée : **une seule** définition du
   format de compte dans le service.
3. Un compte de **détail SYSCOHADA à 6 chiffres** est accepté ; un compte à **8 chiffres** est
   **refusé** en `POST /balances` (400) avec un message nommant le référentiel actif.
4. **Non-régression prouvée sur les comptes courts** : une balance portant `12`, `13` (SYSCOHADA) ou
   `58` (SFD-BCEAO) reste acceptée — test explicite, parce que c'est ce que la borne basse à 2
   protégeait et que la demande « 6 chiffres » casserait naïvement.
5. Import Sage : `60100000` → `601000` et `411FACTURE` → `411000` dans la balance produite.
6. **Agrégation tracée** : deux comptes auxiliaires du même collectif produisent **une** ligne, dont
   les montants sont la somme, et l'aperçu `dryRun` annonce le regroupement **avant** persistance.
7. **L'agrégation conserve l'équilibre** : totaux débit/crédit identiques avant et après
   normalisation, sur un fichier Sage réel.
8. `niveauPreuve` d'une ligne agrégée = le **plus faible** des niveaux regroupés.
9. Une balance déjà stockée n'est **ni migrée ni recalculée** ; son checksum est inchangé.
10. Portes DoD du dépôt : lint 0, build OK, couverture maintenue, mutation-tests sur la validation de
    compte et sur l'agrégation.

---

## Vérification docker (obligatoire)

1. Organisation **SYSCOHADA** : `POST /balances` avec un compte `60100000` → **400** nommant le
   référentiel ; avec `601000` → **201**.
2. Même organisation, balance portant `13` (Résultat net) → **201** (non-régression STORY-087).
3. Organisation **SFD-BCEAO** : `58` (Report à nouveau) → **201** — le plan qui fait autorité est bien
   celui de l'organisation, pas un plan par défaut.
4. Import Sage d'un fichier portant des comptes 8 chiffres **et** des auxiliaires : aperçu `dryRun`
   annonçant les regroupements, puis persistance → comptes à 6 chiffres, **totaux inchangés**.
5. ⚠️ Piège STORY-090 : les read-models de la gate sont keyés `organizationId` en **ObjectId** — un
   seed en chaîne donne un 403 `KYC_NOT_APPROVED` muet qui ressemble à un bug de la story.

---

## Notes

- ⚠️ **Cette story et STORY-147 touchent toutes deux `LigneBalance` et le checksum.** Les livrer en
  parallèle sur deux branches produira un conflit sur le contrat canonique. **Ordre recommandé :
  147 (structure des colonnes) puis 146 (format du compte)** — 147 change la *forme* de la ligne,
  146 n'en change qu'un *champ*, et rebaser un renommage de champ sur une nouvelle colonne est plus
  simple que l'inverse.
- ⚡ **Le motif de fond mérite d'être noté** : c'est la **troisième** délégation nominative de ce
  dépôt qui ne retombe nulle part (cf. `open_contract_gaps` : GAP-balance-validation-etat, puis
  celle-ci). Une délégation « c'est le périmètre de X » doit être **vérifiée dans X** au moment où on
  l'écrit, sinon elle se referme sur elle-même.
- La demande du PO parle de « 6 chiffres ». Cette story la livre **pour SYSCOHADA** et la rend
  **exprimable par référentiel** — parce que SFD-BCEAO et le SMT n'ont pas nécessairement la même
  longueur, et qu'un `6` codé en dur rejouerait exactement le défaut qu'on est en train de corriger.

---

## Progress Tracking

**Statut : `done`** — PR balance-service **#24** rebase-mergée sur `dev` le 2026-08-03.
Revue de code (3 bloquants corrigés), revue de sécurité (aucune vulnérabilité), vérif
docker **rejouée sur l'état final** après correctifs.

### Décisions prises au lancement (les deux arbitrages laissés ouverts par le cadrage)

**D-146-1 — deux prédicats, pas un (option (b) du § B).** `isCompteValide` garde la
reconnaissance **par préfixe** (question du *rattachement* : ventilation STORY-085,
suggestion STORY-139, compte de rattachement d'un compte de trésorerie). Un prédicat
**neuf**, `isCompteDeDetail`, répond à l'autre question — « ce compte est-il déposable
dans une balance ? ». `60100000` reste donc *rattachable* et cesse d'être *déposable*.
Les fondre aurait obligé chaque futur appelant à trancher au hasard laquelle des deux
il posait.

**D-146-2 — où vit la « longueur du niveau de détail » : dans le MANIFESTE, pas dans
l'artefact.** ⚠️ **Écart assumé au § B du cadrage, qui demandait « le paquet déclare »**,
et voici pourquoi : **l'artefact ne porte aucune donnée de longueur** (vérifié —
`meta`, `regles`, `planDeComptes`, `postes`, `tableDePassage`, `notes`, `paquetFiscal`),
et **on ne peut pas la dériver du plan** : le plan normalisé de `syscohada-revise@2.1`
ne contient **aucun compte à 6 chiffres** (distribution réelle : 75 comptes à 2
caractères, 96 à 3, 3 à 4). Dériver donnerait **4**, pas 6.

L'y ajouter passe donc par le `build.mjs` de `bilan-service` — **source de vérité unique
des octets** (D-078-2) — donc par une régénération des deux paquets, **deux nouveaux
checksums**, les deux manifestes et **deux dépôts** livrés ensemble ; avec un effet de
bord sur les snapshots de liasse qui référencent le checksum de `syscohada-revise@2.1`.
Hors périmètre d'une story de 5 points cadrée sur `balance-service`.

La déclaration reste donc **par référentiel**, dans `ReferentielRegistry` — la table de
données qui porte déjà `locator` et `checksum` et dont le contrat est « ajouter un
référentiel = une ligne ici + l'artefact, sans une ligne de code métier ». Ce n'est
**pas** un `6` en dur dans la validation : `syscohada-revise@2.1` déclare `6`,
`sfd-bceao@2.0` **ne déclare rien** (niveau de détail non sourcé ⇒ aucune exigence
appliquée, fail-open **déclaré**). ➡️ **Dette tracée** : le jour où l'artefact la
portera, c'est **une seule ligne** du manifeste qui disparaît — le prédicat ne bouge pas.

**D-146-3 — un compte de plan est un NOMBRE.** Découvert en mutation-testing (M2 restait
vert) : la seule borne de longueur laissait passer `411X` — rattachable par `411`, plus
court que 6, et pourtant un **auxiliaire**. `isCompteDeDetail` exige donc aussi
`/^\d+$/` **quand un niveau de détail est déclaré** : déclarer un niveau de détail *en
chiffres*, c'est déclarer que les comptes du référentiel sont numériques — et les
artefacts le confirment (**0 compte non numérique** sur les 174 de SYSCOHADA et les 156
du SFD).

**D-146-4 — les 5 regex, pas 2.** Le cadrage en citait deux ; il y en avait **cinq** :
`balance.validator.ts` (`{2,20}`), `submit-balance.dto.ts` (`{2,20}`),
`agregation.dto.ts` (`{2,20}`), `surcharge-rattachement.dto.ts` (`{2,20}`) et
`compte-tresorerie.dto.ts` (`{3,20}` — la divergente). Toutes supprimées au profit d'une
**garde de saisie partagée** (`common/validation/compte.contraintes.ts`) : caractères
admis + taille maximale, explicitement **pas** une règle de plan. ⚠️ Retirer purement la
contrainte alphanumérique aurait ouvert un trou — `601;DROP` « commence par 601 » et
serait passé pour rattachable : la garde est donc appliquée **dans le prédicat lui-même**,
seul point de passage commun aux trois adaptateurs (l'ingestion Kafka n'a pas de couche
class-validator).

### Vérification docker (obligatoire — exécutée le 2026-07-31)

Stack : `mongo`, `kafka` (volume recréé — logs corrompus), `redis`, `auth-service`,
`balance-service` — `/health` `mongodb: up`, `kafka: up`. Deux organisations réelles
créées via l'IdP, read-models de gate semés (`organizationId` en **ObjectId**, piège
STORY-090) : l'une sous `syscohada-revise@2.1`, l'autre sous `sfd-bceao@2.0`.

| # | Ce qui est prouvé | Résultat |
|---|---|---|
| 1 | `POST /balances` compte **`601000`** (6 chiffres) — org SYSCOHADA | **201**, persistée |
| 2 | `POST /balances` compte **`60100000`** (8 chiffres) — org SYSCOHADA | **400** : « Compte « 60100000 » **inconnu du plan `syscohada-revise@2.1`** … doit être ramené à son compte de plan » |
| 3 | `POST /balances` compte **`13`** (Résultat net) — non-régression STORY-087 | **201** |
| 4 | `POST /balances` compte **`58`** — org SFD-BCEAO | **201** |
| 5 | **L'autorité est bien l'organisation** : `202` (déclaré par le SFD seul) | **201** sous SFD-BCEAO · **400** sous SYSCOHADA — *la même balance, deux réponses* |
| 6 | `60100000` sous **SFD-BCEAO** (niveau de détail non sourcé) | **201** — fail-open **déclaré**, pas accidentel |
| 7 | Import Sage `dryRun` — 6 lignes, comptes 8 chiffres + auxiliaires | **200** : `lignesFichier: 6`, `lignesCount: 4`, `regroupementsTotal: 2`, détail des regroupements (`601000` ← `60100000`+`60100001`, `411000` ← `411DUPOND`+`411MARTIN`), avertissements en clair |
| 8 | Import Sage persisté | **201** — en base : `601000`, `411000`, `521100`, `701000` ; **libellé du collectif pris au plan** (« Clients », pas « Client Dupond ») |
| 9 | **AC-7 — l'équilibre survit à l'agrégation** | Σ soldes D = C = **40 000 000** (unités mineures) — identiques au fichier (400 000 XOF) ; `sommaire.soldes.ecart = 0` |
| 10 | **AC-9 — le parc préexistant n'est ni migré ni recalculé** | 4 balances antérieures inchangées, comptes (`411`, `701`, `601`) et checksums intacts. ⚡ **La question ouverte du § D est tranchée** : aucune balance en base ne porte un compte que la nouvelle règle refuserait — le point était bien **théorique** |

### ⚡ Ce que la vérification docker a corrigé dans les tests

Un test unitaire affirmait « `58` refusé sous SYSCOHADA, accepté sous SFD » et **passait
au vert** — sur un plan SYSCOHADA **fabriqué** qui omettait `58`. Or `58` existe dans
**les deux** artefacts (« Régies d'avances » côté SYSCOHADA, « Report à nouveau » côté
SFD) : le test décrivait une réalité fausse. Remplacé par **`202`**, discriminant
**vérifié sur les artefacts** puis rejoué en docker. *(Même famille de piège que
STORY-147 : un double de test ne prouve que ce qu'on y a mis.)*

### Portes de qualité

Lint **0 warning** · build OK · **1 886 tests unitaires** + **384 e2e** verts ·
couverture **98.73 / 91.11 / 97.78 / 98.75** (seuils 65/90/90/90).

**12 mutation-tests, tous rouges à la mutation** : borne de longueur retirée · exigence
numérique retirée (**restait vert — c'est ce qui a révélé le trou `411X`, test ajouté**) ·
gardes de saisie retirées · validateur cessant d'interroger le plan · auxiliaire non
complété · troncature des comptes déjà au plan · regroupement écrasant au lieu de sommer ·
niveau de preuve le plus **fort** au lieu du plus faible · checksum scellé **avant**
normalisation · annonce des regroupements repassée dans le lot plafonné · plafond du
détail supprimé (CWE-770).

### Périmètre — ce qui n'a PAS été fait, et pourquoi

- **La longueur de détail n'est pas remontée dans l'artefact** (D-146-2) : 2 dépôts,
  régénération et nouveaux checksums. Dette explicitement tracée dans le manifeste.
- **Le niveau de détail du RCSFD n'est pas déclaré** : non sourcé. Un chiffre inventé
  rejouerait exactement le défaut que la story corrige. Conséquence assumée et
  vérifiée (ligne 6 du tableau) : la règle « 6 chiffres » ne vaut aujourd'hui que
  pour SYSCOHADA — ce que le § Notes du cadrage annonçait déjà.
- **Aucune migration des balances existantes** (AC-9), conformément au § D.
- **Aucun contrôle de cohérence entre le tag `referentiel` porté par la balance et le
  référentiel de l'organisation** : question préexistante, hors périmètre.

### Revue de code — 3 bloquants, tous corrigés (commit `MNV-146(revue)`)

1. ⚡ **Le regroupement sommait les soldes sans les netter.** Un collectif clients portant
   une **avance reçue** (`411DUPOND` débiteur + `411AVANCE` créditeur — le cas
   **ordinaire**, pas l'exception) produisait une ligne `411000` à **double solde**, que
   `BalanceValidator` refuse au titre de l'invariant débiteur-XOR-créditeur de STORY-147 :
   **l'import entier échouait en 400 sur un export parfaitement valide**, en nommant un
   compte (`411000`) qui ne figure même pas dans le fichier. Le solde d'un agrégat est
   désormais **net** (`max(0, ΣD−ΣC)`), comme le fait déjà `quatreColonnes` ; les
   **mouvements** restent des cumuls non nettés.
   ⚠️ **L'AC-7 était mal formulé — et le test avec** : ce que l'agrégation conserve
   exactement, c'est l'**écart** (le netting retranche le même montant des deux totaux),
   pas les totaux bruts. Une balance équilibrée le reste ; c'est ce que le test prouve
   maintenant. Le test d'origine passait parce que **toutes** ses lignes regroupées
   étaient du même côté — « un double de test ne prouve que ce qu'on y a mis », pour la
   deuxième fois de cette story.
2. ⚡ **Une erreur de paramétrage devenait un poison pill Kafka.** `submitInSession`
   résolvait le référentiel **dans** la transaction ; un `409`/`502`/`500` y est relancé
   par `rejetDepuisErreur` (qui ne codifie que `400`/`422`) ⇒ offset jamais commité,
   **partition du consumer group rejouée indéfiniment** : l'ingestion de **toutes** les
   organisations gelée par le paramétrage manquant d'**une seule**. Le référentiel est
   maintenant résolu **hors transaction** par les points d'entrée, et `IngestionService`
   codifie son échec en rejet `ORG_NON_AUTORISEE`. Corrige du même coup le coût lourd
   (lecture Mongo + chargement d'artefact) rejoué à **chaque retry** de `withTransaction`.
3. ⚡ **La normalisation passe DEVANT `BalanceValidator`** — donc la garde « compte en
   double » ne l'atteignait plus : deux lignes portant déjà le même `601000` étaient
   **sommées** au lieu d'être rejetées, avec pour seul signal un avertissement les
   qualifiant à tort de « comptes auxiliaires regroupés ». Un doublon du fichier est de
   nouveau un **refus explicite**, qui nomme le compte fautif.

**Constat écarté, tracé pour la suite** : les comptes de **paramétrage** (ventilation,
catégories de dépenses, surcharges de rattachement) restent validés par `isCompteValide`
(rattachement par préfixe) alors qu'ils **deviennent des lignes de balance** jugées par
`isCompteDeDetail`. Un `compteCharge: '60100000'` est donc accepté à la configuration puis
bloque toute agrégation ultérieure, **loin de la cause**. Hors périmètre (le § A ne vise
que `BalanceValidator` et le DTO trésorerie) — c'est une divergence que **cette story
crée**, à refermer par une story de suivi.

### Revue de sécurité — aucune vulnérabilité (confiance ≥ 80)

⚠️ Le **scan délégué** (`prospera-security-review`) a été interrompu par un quota ; la
revue a été **conduite dans la session, sur `opus`** — jamais allégée, jamais sautée.

Écartés **preuve à l'appui**, pas par principe :

- **Retrait des 5 regex de DTO** — les gardes de **caractères** (`/^[0-9A-Za-z]+$/`) et de
  taille sont conservées aux **15** points d'usage : la surface d'entrée est **identique**
  à avant. Aucune injection NoSQL, ReDoS ni XSS réfléchi nouvellement atteignable.
- **Pollution de prototype** — `normaliserEtRegrouper` indexe par `Map`/`Set`, jamais par
  objet littéral : `__proto__` y est une clé ordinaire.
- **Fuite d'information** — le message de refus réfléchit le compte que l'appelant a
  lui-même soumis (≤ 20 caractères, alphanumérique) et le référentiel de **sa propre**
  organisation, déjà exposé par le diagnostic STORY-078. Rien de cross-tenant.
- **`controleurDeCompte` devenu public** — méthode de service, non exposée en HTTP ; sur
  la voie Kafka elle est appelée **après** `autoriser()` (KYC `APPROVED` **et**
  entitlement `ACTIVE`), donc aucune gate contournée ; l'`orgId` vient du JWT sur la voie
  HTTP.
- **Intégrité comptable** — le netting conserve l'écart (une balance déséquilibrée le
  reste), le `niveauPreuve` d'un agrégat retient le **plus faible** (aucun blanchiment
  possible), et le checksum scelle **après** normalisation, donc exactement ce qui est
  persisté.
- **CWE-770** — `regroupements` (20) et `comptesSources` (10) plafonnés, totaux exacts
  rendus à part ; `doublonsFichier` est dédupliqué et seuls 5 éléments atteignent la
  réponse.

➡️ Le correctif ② est en outre un **gain net de sécurité** : il supprime un déni de
service par partition, déclenchable par le paramétrage d'un seul tenant.

### Vérification docker REJOUÉE sur l'état final

Les correctifs touchant l'agrégation déjà vérifiée, la phase ④ a été rejouée après
`docker restart` :

| Ce qui est prouvé | Résultat |
|---|---|
| Collectif clients avec **avance reçue** (300 000 D + 100 000 C) | `411000` porte le **net 200 000 au débit**, `soldeCrediteur: 0` — **0 ligne à double solde** |
| Les **mouvements** ne sont pas nettés | `411000` : `mvtD = 30 000 000`, `mvtC = 10 000 000` — les deux côtés conservés |
| Équilibre après netting | Σ soldes D = C = **50 000 000**, `sommaire.soldes.ecart = 0` |
| Doublon de fichier (`601000` deux fois) | **400** : « Compte(s) présent(s) en double dans le fichier : 601000 » |

### Portes finales

Lint **0 warning** · build OK · **1 894 unitaires** + **384 e2e** verts · couverture
**98.73 / 91.06 / 97.78 / 98.75** (seuils 65/90/90/90) · **18 mutation-tests** au total,
tous rouges à la mutation — dont **deux restés verts** qui ont fait ajouter les tests
manquants : le trou `411X` (court, rattachable, et pourtant auxiliaire) et l'**ordre** de
résolution du référentiel hors transaction.
