# STORY-146 : `balance-service` — le n° de compte de la balance canonique est régi par le référentiel (**6 chiffres** en SYSCOHADA), et l'import Sage normalise ses comptes vers le plan

**Epic :** EPIC-017 — Contrat canonique & socle Atelier
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § FR-A04, NFR-A06 · **STORY-101** (contrat canonique — `FORMAT_COMPTE`) · **STORY-078** (`ReferentielPackageBalance.isCompteValide`) · **STORY-086** (adaptateur Sage) · **STORY-085** (ventilation — seul endroit où `isCompteValide` a été branché)
**Priorité :** Must Have
**Story Points :** 5
**Complexité :** medium
**Statut :** ready-for-dev
**Assigné à :** null
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
