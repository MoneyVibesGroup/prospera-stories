# STORY-354 : Deux dossiers ne peuvent pas porter le même NIF de société

**Epic :** EPIC-043 — Dossier client, unité de travail du cabinet
**Réf. :** ticket `TICKET-BACKEND-dossier-client-entite-de-premier-rang.md` — bloc **O** · décision **D14** · question **Q5** *(tranchée)*
**Priorité :** Must Have
**Story Points :** 2
**Statut :** 🔄 En revue
**Complexité :** low
**Créée le :** 2026-08-09
**Sprint :** 20
**Service :** `dossier-service`

---

## Le constat

Le seul index posé aujourd'hui sur le profil société est `{ orgId: 1 }` **unique**
(`profil-societe.schema.ts:142`) : **rien n'assure l'unicité d'un NIF**. C'était sans conséquence tant
qu'un cabinet ne pouvait avoir qu'une société — le modèle l'interdisait par construction.

Dès que le cabinet porte N dossiers, l'absence de contrainte devient une vraie panne métier : le même
client existe **deux fois**, avec deux comptabilités qui divergent, et personne ne s'en aperçoit avant
la liasse. Un doublon de dossier ne se répare pas : les balances sont déjà réparties entre les deux.

**D14 pose la règle exacte** : le **NIF de la société** est toujours différent d'un dossier à l'autre ;
le **NIF du dirigeant**, lui, peut être partagé — un même gérant tient couramment plusieurs sociétés,
et l'interdire casserait un cas d'usage normal.

---

## User Story

En tant que **collaborateur de cabinet**,
je veux **être arrêté si je crée un dossier pour une société déjà suivie**,
afin de **ne pas fabriquer un doublon que personne ne saura réconcilier plus tard**.

---

## Ce que la story livre

- **Index unique partiel** `{ orgId: 1, pays: 1, nif: 1 }` sur `Dossier`, avec
  `partialFilterExpression: { nif: { $type: 'string' } }`.
  ⚡ **Partiel, et c'est le cœur de la story** : STORY-079 autorise délibérément la **saisie
  progressive** — un dossier se crée sans NIF connu, et `GET /completude` dit ensuite ce qui bloque la
  DSF. Un index unique plein interdirait le **deuxième** dossier sans NIF, ce qui rendrait la saisie
  progressive inutilisable.
- **`409 DOSSIER_NIF_DEJA_UTILISE` nommant le dossier existant** — son `id` et sa `raisonSociale`
  dans le corps de l'erreur. Un 409 muet oblige l'utilisateur à ressaisir tout le formulaire pour
  finir par chercher le doublon à la main.
- **Aucune contrainte sur le NIF du dirigeant** (`dirigeants[].nif`) : un test le prouve, sinon la
  règle se perdra à la première relecture du schéma.
- La contrainte s'applique à la **création** (STORY-301) **et** à la **modification** de l'identité :
  renommer le NIF d'un dossier vers celui d'un autre est le même doublon, par un autre chemin.
- La comparaison est faite sur un **NIF normalisé** (trim, majuscules, espaces internes retirés) —
  `1000745307` et `1000 745 307` sont le même numéro. La valeur **saisie** est conservée telle quelle,
  la valeur **normalisée** sert l'index.

## Hors périmètre

- L'unicité **inter-organisations** : deux cabinets différents peuvent parfaitement suivre la même
  société (co-mandat, changement de cabinet en cours d'année). La clé porte `orgId`, délibérément.
- Le RCCM : rien n'indique aujourd'hui qu'il soit unique et fiable — pas de contrainte tant qu'un
  cas réel ne l'exige pas.
- La **fusion** de deux dossiers doublons créés avant cette story → hors périmètre, aucun n'existe
  encore.

---

## Acceptance Criteria

- [x] Créer un dossier avec un NIF déjà porté par un dossier **actif de la même organisation** →
      **409 `DOSSIER_NIF_DEJA_UTILISE`**, corps portant `{ dossierId, raisonSociale }` du dossier
      existant. **Aucune** écriture partielle.
- [x] Créer **deux dossiers sans NIF** dans la même organisation → **201** les deux fois (l'index
      partiel ne s'applique qu'aux NIF renseignés).
- [~] Renseigner *a posteriori* un NIF déjà utilisé via la modification d'identité → **même 409**,
      même code, même corps.
- [x] `1000745307` et `1000 745 307` sont détectés comme **le même NIF** ; la valeur affichée reste
      celle qui a été saisie.
- [x] Deux dossiers portant le **même NIF de dirigeant** → **201**, aucune erreur. *(Test explicite —
      c'est la moitié de D14 qu'on oublie.)*
- [x] Deux organisations distinctes portant le même NIF de société → **201** de part et d'autre.
- [x] Le **doublon est arrêté par l'index**, pas par le pré-contrôle : un test de concurrence
      (deux créations simultanées du même NIF) rend **un 201 et un 409**, jamais deux 201.

---

## Notes techniques

> ⚠️ **Nommage corrigé à l'implémentation** : le champ du schéma `Dossier` est `nifSociete`
> (et non `nif`) depuis STORY-301 — `nif` est le NIF du **dirigeant**, celui qu'il ne faut
> surtout pas contraindre. Le champ dérivé s'appelle donc `nifSocieteNormalise`.

```ts
DossierSchema.index(
  { orgId: 1, pays: 1, nifSocieteNormalise: 1 },
  {
    unique: true,
    partialFilterExpression: { nifSocieteNormalise: { $type: 'string' } },
    name: 'unicite_nif_societe',
  },
);
```

- `nifSocieteNormalise` est un champ **dérivé**, écrit par un hook `pre('validate')` depuis
  `nifSociete` — jamais saisi par le client, jamais exposé. Le dériver dans le service laisserait un
  chemin d'écriture (repository, migration) capable de le contourner. Un hook
  `pre(['findOneAndUpdate','updateOne'])` fait le même travail côté mise à jour, que les hooks de
  document ne couvrent pas.
- **L'index est nommé**, et ce n'est pas décoratif : le service doit savoir **lequel** des deux index
  uniques a été violé. Un `E11000` anonyme confondrait ce conflit avec celui de « Mon cabinet », que
  la création automatique **avale** par idempotence — le doublon de NIF serait avalé lui aussi.
- **Aucun pré-contrôle applicatif** : la `raisonSociale` du dossier en conflit se lit **après** le
  refus, depuis le `keyValue` que Mongo renvoie avec l'erreur. Un `find`-puis-`create` perdrait la
  course concurrente et coûterait une lecture à *chaque* création, pour n'être utile qu'à l'échec.
- `pays` fait partie de la clé : D10 borne à un pays par dossier, mais un NIF n'est unique **que**
  dans son administration fiscale. Le jour où le multi-pays arrive, la clé est déjà juste.

---

## Dépendances

**Prérequise :** **STORY-301** *(modèle `Dossier` et sa création)*.
**Liée :** **STORY-079** *(la saisie progressive qu'il ne faut pas casser — c'est elle qui impose
l'index partiel)*.

---

## Definition of Done

- [x] Lint 0 · build OK · couverture ≥ seuils.
- [x] e2e : 409 informatif, deux dossiers sans NIF acceptés, NIF de dirigeant partagé accepté,
      normalisation, inter-org autorisé, course concurrente.
- [x] Vérification docker : l'index est **présent en base** (`getIndexes()`), avec son
      `partialFilterExpression` — un index déclaré au schéma mais absent en base est une garde morte.
- [x] `/code-review`.

---

## Story Points Breakdown

- Champ dérivé `nifNormalise` + hook + index partiel : 0,75 pt
- Mapping `E11000` → 409 informatif (lecture du dossier en conflit) : 0,75 pt
- Tests (dont concurrence, NIF de dirigeant partagé, index vérifié en base) : 0,5 pt
- **Total : 2 points**

---

## Progress Tracking

| Phase | État | Note |
|---|---|---|
| Rédaction | ✅ | story préexistante (2026-08-09), ajustée : le champ réel est `nifSociete`, pas `nif` |
| Développement | ✅ | branche `MNV-354` |
| Validation (DoD) | ✅ | lint 0 · build OK · **437 unit + 69 e2e** · couverture **99,38 / 94,04 / 96,75 / 99,33** |
| Mutation-tests | ✅ | **7 mutations, 7 rouges** (2 rejouées : une première version virait rouge par erreur de COMPILATION, ce qui ne prouve rien) |
| Vérification docker | ✅ | voir ci-dessous — **1 défaut trouvé et corrigé** |
| Revue de code | ⏳ | |
| Revue de sécurité | ⏳ | |
| Clôture | ⏳ | |

### Ce qui a été livré

- champ **dérivé** `nifSocieteNormalise` (trim + majuscules + espaces internes
  retirés, `\s` couvrant l'insécable d'un copier-coller de PDF), écrit par les
  **hooks du schéma** — jamais par le service. Le dériver dans le service
  laisserait le repository, un script de migration ou la story suivante
  **désarmer l'index en silence** : un chemin qui l'oublie ne casse rien de
  visible ;
- index unique **partiel** `unicite_nif_societe`
  `{ orgId, pays, nifSocieteNormalise }` sur `$type: 'string'` ;
- `409 DOSSIER_NIF_DEJA_UTILISE` nommant le dossier existant dans **`details`**,
  et non à la racine du corps — `AllExceptionsFilter` construit la réponse par
  **liste blanche** (`statusCode/error/message/code/details`) et jette tout champ
  additionnel. Un `dossierId` posé à la racine n'aurait **jamais atteint le
  client** : 409 muet, formulaire à ressaisir, exactement ce que l'AC interdit ;
- **discrimination des deux index uniques** du schéma. `creerDossierCabinet`
  *avale* son doublon par idempotence (rejeu Kafka) : un conflit de NIF confondu
  avec celui de « Mon cabinet » aurait été avalé lui aussi, et la story aurait
  été **sans effet** ;
- `keyValue` de l'erreur Mongo relu avec **contrôle de type composant par
  composant** avant d'entrer dans la requête : `keyValue` vient d'une erreur, pas
  d'un contrat. Clé inexploitable ⇒ 409 **sans** `details` — on dégrade
  l'information, jamais le refus.

### ⚡⚡ Défaut trouvé par la vérification docker — invisible à 432 unitaires ET 69 e2e

Sur **six créations simultanées du même NIF, trois rendaient `500`** :

```
MongoServerError: Caused by ::  :: Please retry your operation or multi-document transaction.
    at async Collection.insertOne (...)
```

**Pourquoi le `409` de la story n'était pas atteint.** Sous l'isolation
*snapshot* de Mongo, deux transactions qui insèrent la **même clé d'index
unique** au même instant ne produisent pas d'`E11000` : la perdante est
**avortée par le serveur avant** d'avoir pu constater le doublon. La traduction
en `409` informatif — tout l'objet de la story — n'était donc **jamais
atteinte sur le seul scénario qui la motive** : deux collaborateurs saisissant
le même client en même temps. Le doublon *était* bien empêché (1 document en
base), mais l'appelante recevait « le service est en panne » au lieu de « ce
client est déjà suivi, le voici ».

**Pourquoi rien ne l'a vu.** Unitaires et e2e doublent tous deux la couche
données : ni l'un ni l'autre n'a de moteur transactionnel capable d'entrer en
conflit. Aucun nombre de tests n'aurait pu le révéler. C'est la **même classe**
de défaut que STORY-353 (code `112`), mais sur le chemin de **création**, qui
n'avait aucune gestion du conflit d'écriture.

**Correctif** : reprise **bornée à 3 tentatives** sur conflit transitoire — ce
que Mongo prescrit explicitement. Au tour suivant la gagnante est *commitée*,
donc la perdante voit un vrai `E11000` et rend le `409` qui nomme le dossier.

⚠️ **Rejouer est sûr ici, et seulement ici** : la transaction avortée n'a rien
commité et l'`_id` est **pré-généré**, donc la reprise réécrit le même document,
jamais un second. `ecrireModification` ne réessaie toujours **pas**, et c'est la
décision de STORY-353 qui tient : sa `version` est lue *avant* la transaction,
un rejeu écraserait silencieusement l'écriture concurrente. Contention
persistante ⇒ `409 CONFLIT_CONCURRENT`, jamais `500`.

### Vérification docker — stack neuve (`down -v`), Mongo `rs0`, jetons RS256 réels

Index **présent en base** avec son `partialFilterExpression` (DoD) :

```js
{ key: { orgId: 1, pays: 1, nifSocieteNormalise: 1 },
  name: 'unicite_nif_societe', unique: true,
  partialFilterExpression: { nifSocieteNormalise: { $type: 'string' } } }
```

| Critère | Appel réel | Résultat |
|---|---|---|
| AC-01 doublon exact | 2× `POST /dossiers` NIF `1000745307` | `201` puis **`409 DOSSIER_NIF_DEJA_UTILISE`**, `details.dossierId` + `details.raisonSociale` du dossier existant |
| AC-02 deux dossiers **sans** NIF | 2× `POST` sans `nifSociete` | `201` / `201` |
| AC-02 bis NIF vide / blanc | `""` puis `"   "` | `201` / `201` |
| AC-04 normalisation | `1000 745 307` vs `1000745307` | **`409`** — et la valeur **saisie** est réaffichée telle quelle |
| AC-04 bis casse | `tg-a1b2` puis `TG-A1B2` | `201` / **`409`** |
| AC-05 NIF de **dirigeant** partagé | 2 dossiers, même `dirigeants[].nif` | `201` / `201` — **aucune** contrainte |
| AC-06 inter-organisations | 2 cabinets, même NIF société | `201` / `201` |
| AC-07 **course concurrente** | 6× `POST` simultanés, ×2 séries | **`201` + 5× `409`** informatifs, **1 seul document** en base |

**Atomicité — zéro écriture partielle.** Après ~15 créations refusées :
`dossiers = 14` ↔ `DOSSIER_CREE = 14` ↔ `outbox_events = 14`, et
`MANDAT_ATTESTE = 12` = les 12 dossiers **clients** (les 2 « Mon cabinet » n'en
ont pas, D2). **0 entrée de journal orpheline.** Le champ dérivé est **absent**
(jamais `null`) sur les 5 dossiers sans NIF — c'est ce qui les fait sortir de
l'index partiel par la règle, pas par accident de sérialisation.

**Mutation en base réelle — l'index est le seul garde-fou.** `dropIndex()` puis
rejeu du doublon ⇒ **`201`, 2 documents**. Index recréé au boot du service ⇒ le
même appel redonne **`409`**. Il n'existe donc **aucun pré-contrôle** qui
tiendrait le lieu de l'index — c'est bien lui, et lui seul, qui arrête le
doublon (AC-07).

### Hors périmètre assumé — AC-03 (modification *a posteriori*)

L'AC-03 vise la **modification de l'identité fiscale**, dont **aucune route
n'existe** dans `dossier-service` : elle appartient à STORY-079/304. Créer cette
route ici déborderait le périmètre. Ce qui est livré à la place, et qui la rendra
vraie sans qu'on ait à y penser :

- le hook `pre(['findOneAndUpdate','updateOne'])` maintient `nifSocieteNormalise`
  sur **toute** mise à jour — **hook inerte documenté**, posé *avec* la
  contrainte plutôt qu'après elle. Sans lui, un futur `$set` sur `nifSociete`
  laisserait le dossier indexé sous son **ancien** NIF : le doublon passerait,
  tous les tests au vert ;
- `ecrireModification` — **l'unique entonnoir d'écriture** du service — traduit
  la violation d'index exactement comme la création. Vérifié par un test qui
  fait échouer une modification réelle sur cet index.

Le jour où STORY-079/304 ouvrira la route, l'AC-03 sera vrai sans ligne
supplémentaire. **À vérifier alors** : que le `409` ne nomme pas un dossier
**hors de la portée** de l'appelant — la création est réservée à `TENANT_ADMIN`,
qui voit déjà tout son portefeuille ; une route ouverte aux `TENANT_USER` ferait
du corps d'erreur une fuite (D6/D11). C'est écrit dans le code, au-dessus de
`refuserSiNifDejaUtilise`.
