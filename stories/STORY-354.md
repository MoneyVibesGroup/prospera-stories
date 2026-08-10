# STORY-354 : Deux dossiers ne peuvent pas porter le même NIF de société

**Epic :** EPIC-043 — Dossier client, unité de travail du cabinet
**Réf. :** ticket `TICKET-BACKEND-dossier-client-entite-de-premier-rang.md` — bloc **O** · décision **D14** · question **Q5** *(tranchée)*
**Priorité :** Must Have
**Story Points :** 2
**Statut :** 📋 À faire
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

- [ ] Créer un dossier avec un NIF déjà porté par un dossier **actif de la même organisation** →
      **409 `DOSSIER_NIF_DEJA_UTILISE`**, corps portant `{ dossierId, raisonSociale }` du dossier
      existant. **Aucune** écriture partielle.
- [ ] Créer **deux dossiers sans NIF** dans la même organisation → **201** les deux fois (l'index
      partiel ne s'applique qu'aux NIF renseignés).
- [ ] Renseigner *a posteriori* un NIF déjà utilisé via la modification d'identité → **même 409**,
      même code, même corps.
- [ ] `1000745307` et `1000 745 307` sont détectés comme **le même NIF** ; la valeur affichée reste
      celle qui a été saisie.
- [ ] Deux dossiers portant le **même NIF de dirigeant** → **201**, aucune erreur. *(Test explicite —
      c'est la moitié de D14 qu'on oublie.)*
- [ ] Deux organisations distinctes portant le même NIF de société → **201** de part et d'autre.
- [ ] Le **doublon est arrêté par l'index**, pas par le pré-contrôle : un test de concurrence
      (deux créations simultanées du même NIF) rend **un 201 et un 409**, jamais deux 201.

---

## Notes techniques

```ts
DossierSchema.index(
  { orgId: 1, pays: 1, nifNormalise: 1 },
  { unique: true, partialFilterExpression: { nifNormalise: { $type: 'string' } } },
);
```

- `nifNormalise` est un champ **dérivé**, écrit par un hook `pre('validate')` depuis `nif` — jamais
  saisi par le client, jamais exposé. Le dériver dans le service laisserait un chemin d'écriture
  (repository, migration) capable de le contourner.
- Le pré-contrôle applicatif reste utile pour **rendre le 409 informatif** (il permet de lire la
  `raisonSociale` du dossier en conflit) — mais c'est bien `E11000` qui est mappé en 409 : le
  pré-contrôle **perd toute course concurrente**, exactement comme documenté sur STORY-079.
- `pays` fait partie de la clé : D10 borne à un pays par dossier, mais un NIF n'est unique **que**
  dans son administration fiscale. Le jour où le multi-pays arrive, la clé est déjà juste.

---

## Dépendances

**Prérequise :** **STORY-301** *(modèle `Dossier` et sa création)*.
**Liée :** **STORY-079** *(la saisie progressive qu'il ne faut pas casser — c'est elle qui impose
l'index partiel)*.

---

## Definition of Done

- [ ] Lint 0 · build OK · couverture ≥ seuils.
- [ ] e2e : 409 informatif, deux dossiers sans NIF acceptés, NIF de dirigeant partagé accepté,
      normalisation, inter-org autorisé, course concurrente.
- [ ] Vérification docker : l'index est **présent en base** (`getIndexes()`), avec son
      `partialFilterExpression` — un index déclaré au schéma mais absent en base est une garde morte.
- [ ] `/code-review`.

---

## Story Points Breakdown

- Champ dérivé `nifNormalise` + hook + index partiel : 0,75 pt
- Mapping `E11000` → 409 informatif (lecture du dossier en conflit) : 0,75 pt
- Tests (dont concurrence, NIF de dirigeant partagé, index vérifié en base) : 0,5 pt
- **Total : 2 points**
