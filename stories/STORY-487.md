# STORY-487 : Une balance dont le référentiel du dossier n'est pas packagé ne se construit pas — le refus remonte à la construction

Status: review

**Épic :** EPIC-106 — Socle multi-référentiel (habilitation, résolution, refus)
**Service :** `balance-service` (`:3007`) — `modules/cahiers/agregation`, `modules/balance`, `modules/referentiel`
**Points :** 3 · **Sprint :** S20 · **Complexité :** medium
**Prérequis :** **STORY-422** (le plan suit le dossier) — livré.
**Origine :** **Q2 de STORY-422**, tranchée par le PO le 2026-08-27.

---

## ⛔⛔ La prémisse de cette fiche était FAUSSE, et c'est le fait le plus important de la story

La fiche affirmait :

> « Aujourd'hui une balance taguée d'un référentiel **non packagé** est **acceptée**. Le refus
> n'arrive qu'au moment où quelqu'un veut en faire quelque chose — au Bilan, c'est-à-dire à
> l'**arrêté des comptes**. »

**C'est faux depuis STORY-422**, clôturée **avant** que cette fiche ne soit rédigée. L'agrégation
charge le référentiel **du dossier** dans son `Promise.all` d'ouverture, donc **avant la moindre
ventilation** ; la soumission fait de même, **hors transaction**. Les deux traduisent
`ArtefactNonPackageError` en `409 REFERENTIEL_NON_PACKAGE`. Vérifié en lisant les deux chemins, puis
mesuré : aucune balance n'est écrite.

Et le second exemple de la fiche a péri lui aussi : `smt-togo@1.0` **est packagé depuis
STORY-494**, clôturée hier. Le cas cité comme preuve n'existe plus.

⇒ **Le périmètre réel de cette story n'est donc pas le refus** — il est livré. C'est ce que le refus
**ne dit pas**, ce que personne ne peut **inventorier**, et ce qu'**aucun test ne gardait**.

⚡⚡ **Le plus inquiétant : sur 3 718 unitaires et 902 e2e, PAS UNE assertion ne vérifiait qu'un
référentiel non packagé n'écrit rien.** Déplacer ce chargement après la première écriture, ou
l'envelopper dans la transaction, serait passé au vert — et aurait rendu à la TPE le défaut que 422
venait de fermer : du travail de saisie tenu douze mois, agrégé, et refusé en avril.

## Ce que la story livre

### AC-1, AC-3, AC-5 — les gardes qui manquaient

Le comportement existait ; rien ne le tenait. Quatre gardes, sur le chemin d'agrégation :

- **AC-1** — refus en `409 REFERENTIEL_NON_PACKAGE`, motif compris ;
- **AC-3** — **aucune** écriture : ni `submit` (qui ouvre la transaction, insère la version et publie
  l'événement), ni même `dryRun` ;
- **AC-3 bis** — **l'aperçu refuse aussi**. Un aperçu n'écrit rien, donc on pourrait le croire
  inoffensif. Il ne l'est pas : il donne à voir des chiffres qu'aucune liasse ne pourra reprendre,
  c'est-à-dire exactement la promesse que cette story veut supprimer ;
- **AC-5** — **rejeu** : le même appel refuse à l'identique, message **entier** compris, et n'écrit
  toujours rien. Un refus qui varierait d'un appel à l'autre ferait croire à un état qui évolue,
  donc à quelque chose qui vaut la peine d'être réessayé.

### AC-2 — le motif nomme les trois choses qui décident du geste

Le refus ne nommait **que la clé** `code@version`. Un cabinet qui tient cent dossiers devait deviner
lequel porte l'axe que la plateforme ne sert pas. Le message porte désormais le **référentiel**, le
**dossier**, et l'**état exact** — « déclaré, non packagé » n'est pas « inconnu », et il n'y a **rien
à réessayer**.

⚠️ **Enrichi en un seul point** : `ReferentielService.chargerReferentiel`, le seul qui connaisse à la
fois l'erreur et le dossier — le registre ne voit qu'une clé. Et **seul ce refus** est enrichi : les
autres erreurs de chargement (intégrité, indisponibilité) désignent l'**artefact**, pas le dossier,
et leur mapping HTTP distingue déjà des gestes différents.

### AC-4 — l'inventaire, `GET /api/v1/balances/inventaire-referentiels`

**Une story de refus ne supprime pas rétroactivement des pièces : elle cesse d'en produire.** Les
balances déjà construites restent lisibles, et un cabinet doit pouvoir savoir **lesquelles** portent
un cadre comptable que la plateforme ne sait pas servir.

- **Org-scopée**, contrairement au reste du domaine balance (niché sous `/dossiers/:dossierId/…`
  depuis STORY-236) : la question est celle d'un **cabinet**. La poser dossier par dossier
  obligerait à interroger cent fois pour trouver le seul qui pose problème. Aucun `dossierId`
  n'entre, donc aucune portée à franchir ; l'`orgId` vient du JWT.
- **Lit le tag PORTÉ par la pièce**, jamais le référentiel résolu aujourd'hui : l'axe d'un dossier
  est **daté** (STORY-303) et une balance scelle le tag de son exercice.
- **`nonPackages` vide est la réponse JUSTE, pas une panne** — depuis STORY-494, les quatre tags du
  contrat sont packagés. Un test interdit qu'un futur « si vide alors 404 » transforme une bonne
  nouvelle en erreur.

## ⚡⚡ Deux défauts trouvés en construisant, que la story n'avait pas prévus

### 1. Le diagnostic plantait sur le cas exact où il sert

`etatDuTag` traduisait le tag par `PONT_TAG[tag]`. Or l'inventaire lit ce que les balances
**portent déjà**, pas une entrée validée : une valeur retirée de l'énumération, ou écrite par une
version antérieure, y remonte telle quelle, `PONT_TAG` rend `undefined`, et le moindre accès à
`.code` **renversait la route en 500**. Un tag hors contrat est désormais **inventorié**, avec son
motif. **Prouvé en base** en plantant un `SYSCOA-1996` (leçon STORY-401 : un contrôle muet dans le
cas exact où il sert).

### 2. L'invariant de portée mesurait de la PROSE

`dossier-scope.invariant.spec.ts` cherchait `dossiers/:dossierId` **n'importe où dans la source**. Il
a donc signalé le premier contrôleur org-scopé du module, dont le commentaire *explique* pourquoi il
n'est pas niché — en citant le chemin.

Un test qui lit de la prose mesure la prose. Durci **des deux côtés** :

- le **chemin déclaré** est extrait du `@Controller({ path: … })`, et un chemin **illisible** fait
  **échouer** l'invariant — sans quoi durcir la lecture aurait changé un faux positif bruyant en
  faux négatif silencieux, exactement le fail-open que cette garde existe pour empêcher ;
- le **décorateur posé**, ancré en début de ligne. ⚡ **Mesuré** : la plupart des contrôleurs nichés
  *mentionnent* `@RequiresDossierScope()` dans leur JSDoc en plus de le porter — retirer le
  décorateur **réel** en laissant le commentaire laissait la garde **verte**. Elle rougit désormais.

## Hors périmètre, nommé

- **Le refus lui-même** : livré par STORY-422, non retouché.
- **`bilan-service`** : le refus en aval reste ce qu'il est ; cette story travaille en amont.
- **L'inventaire ne remonte pas les balances antérieures au re-scopage** (`dossierId` absent) : elles
  sont **comptées** mais leur dossier ne peut pas être nommé. Le DTO le déclare.

## Vérification docker

Stack réelle, `balance-service` reconstruit, jeton d'un cabinet réel.

| Ce qui est prouvé | Comment | Résultat |
|---|---|---|
| La route est **servie** et gardée | `GET /balances/inventaire-referentiels` | **200**, `SMT` → `smt-togo@1.0`, `packageOk: true`, `nonPackages: []`, `balancesConcernees: 0` |
| ⚡ Un **tag hors contrat** est inventorié, pas 500 | `SYSCOA-1996` planté en base, route rappelée | **200**, entrée `packageOk: false`, motif « tag hors du contrat canonique de balance », `balancesConcernees: 1` |
| ⛔ **Cloisonnement multi-tenant**, sur données réelles | 3 balances en base, dont une d'une **autre** organisation (`6aa0c154…`) | La balance `SN` de l'autre org **n'apparaît pas** — exclue par l'agrégation, pas par une assertion |
| Témoin retiré | `deleteOne` + recomptage | `SMT: 1`, `SN: 1` — état d'origine |

## Portes de qualité

| | balance-service |
|---|---|
| Lint | 0 warning |
| Build | OK |
| Unitaires | **3 726** verts, 188 suites |
| End-to-end | **904** verts, 26 suites |
| Couverture | ≥ seuils 65/90/90/90 |

## Table de mutations

| Mutation | Cible | Résultat |
|---|---|---|
| Retirer `dossierId` de l'erreur enrichie | batterie AC-2 | **Rouge sur les 2 bons tests** (compile proprement — une mutation rouge par erreur de compilation ne prouverait rien) |
| Faire que le référentiel se charge normalement | batterie AC-1/3/5 | **Rouge sur les 4 gardes neuves** : elles distinguent bien le cas refusé du cas nominal |
| Retirer le **seul décorateur réel** `@RequiresDossierScope()`, commentaire laissé | invariant de portée | **VERT avant durcissement**, **rouge après** |
| Rendre le contrôleur d'inventaire niché sans décorateur | invariant de portée | **Rouge**, contrôleur nommé |

## Constats de revue traités

Les deux revues ont convergé sur le même bloquant : **mon durcissement de l'invariant avait
ouvert un fail-open que la version d'origine fermait.**

| # | Constat | Traitement |
|---|---|---|
| **BL-2 / V1** | ⛔⛔ `cheminDeclare` lisait le **premier** `@Controller` du fichier et attribuait ce chemin à tout le fichier. Un fichier du dépôt en déclare **deux** (`referentiel.controller.ts`). Un contrôleur niché **non gardé** en seconde position redevenait invisible — la garde d'origine le voyait | ⚡⚡ **corrigé** : découpage **par classe** (les décorateurs d'une classe précèdent son `export class`), ce qui lie le chemin **et** le décorateur à la **même** classe. Raisonner sur l'union des chemins du fichier n'aurait pas suffi : un fichier portant un niché **gardé** et un niché **non gardé** serait passé |
| **BL-1** | ⛔⛔ La branche « déclaré non packagé » de `etatPaquet` — **le cœur d'AC-4** — n'était gardée par **rien**. La neutraliser laissait **1 039 tests verts**, en compilant proprement | corrigé : garde sur **registre synthétique** (l'idiome que STORY-494 avait posé pour la branche jumelle), avec un **témoin de discrimination** dans le même manifeste ; plus une batterie complète sur `inventaireReferentiels`, qui n'avait **aucun** spec |
| **BL-3** | Le contrat publié affirmait que `tag` vaut l'une des quatre valeurs et que `referentiel` est un couple `code@version` — faux **sur la seule ligne qui intéresse le lecteur** de cette route, l'anomalie | corrigé sur le document réellement servi, avec la consigne explicite de ne pas écrire de correspondance exhaustive sans branche par défaut |
| **V2** | ⛔ L'agrégation org-scopée faisait un **COLLSCAN** : aucun index ne commence par `orgId`. Chaque appel faisait lire **tous** les documents de la collection, ceux des autres cabinets compris, `lignes[]` comprises. Épuisement de ressources **cross-tenant** depuis un compte légitime | corrigé : index `{ orgId, referentiel, dossierId }`, dont l'ordre suit la projection ⇒ index **couvrant** |
| **NB-1** | Le contrôleur neuf n'était pas au filet des contrats opaques, dont le docblock dit qu'en oublier un rend la garde **vacante** | ajouté |
| **NB-2** | Mon insertion avait séparé `listByOrg` de son docblock, qui décrivait donc la méthode voisine **à contre-sens** | replacé |
| **NB-3** | Mon commentaire « `$addToSet` sur un champ absent produit un `null` » est **faux** | corrigé après mesure sur le Mongo du projet (7.0.40) : un champ **absent** est ignoré (`[]`), seul un `null` **explicite** remonte |
| **NB-4** | Aucun e2e sur la route neuve, alors qu'elle partage le préfixe `balances` | ajouté **dans le fichier du voisin de préfixe**, seul endroit où l'ordre de résolution est réellement exercé, plus le fail-closed de la gate |
| **NB-5** | La garde de rejeu frôlait la tautologie : `mockRejectedValue` rend la **même instance** aux deux appels | fabrique d'erreurs **distinctes**, plus un témoin `not.toBe` qui interdit le retour à l'instance partagée |
| **NB-6** | `PONT_TAG['constructor']` rend une valeur **héritée** truthy ⇒ entrée publiée sous `undefined@undefined` avec le mauvais motif | appartenance testée sur les clés **propres**, garde sur quatre clés du prototype |
| **NB-7** | Fiche : trois volumes différents, et pas de section *Progress Tracking* | corrigés ici |

### Mutations rejouées après correctifs

| Mutation | Avant | Après |
|---|---|---|
| Neutraliser la branche `nonPackage` de `etatPaquet` | **1 039 verts** | **rouge** |
| Contrôleur niché non gardé en **seconde** position d'un fichier | **5 verts** | **rouge**, et il nomme « contrôleur 2 » |

## Progress Tracking

- **2026-09-10** — Story recadrée : sa prémisse était fausse (le refus est livré depuis
  STORY-422) et son exemple périmé (le SMT est packagé depuis STORY-494). Périmètre réel :
  les gardes absentes, le motif muet sur le dossier, l'inventaire inexistant.
- **2026-09-10** — Implémentation, portes de qualité et vérification docker (route servie,
  tag hors contrat inventorié, cloisonnement multi-tenant prouvé sur données réelles).
- **2026-09-10** — Revue de code et revue de sécurité : **4 bloquants** traités, dont une
  **régression fail-open que j'avais moi-même introduite** sur la garde de portée dossier,
  et le cœur d'AC-4 gardé par rien. 7 non-bloquants traités.
- **2026-09-10** — ⚠️ **Vérification docker REJOUÉE sur l'état final** : l'index de
  correction change la persistance, donc la mesure d'avant ne valait plus rien. Plan de
  l'agrégation re-mesuré : `COLLSCAN: false`, `IXSCAN: true`, `FETCH: false` — index
  **couvrant**, les documents ne sont plus remontés du stockage.
- **Statut** : `review` → prêt pour merge.

## Notes

Voir [[STORY-422]] (Q2, et le refus déjà livré), [[STORY-494]] (le SMT packagé, qui périme le second
exemple de cette fiche), `stories/STORY-078.md` (D-078-3), [[STORY-401]] (un contrôle muet là où il
sert), [[STORY-236]] (le re-scopage `dossierId`).
