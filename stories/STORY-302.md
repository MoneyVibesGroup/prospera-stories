# STORY-302 : Type d'entité et pays portés par le dossier (v1 mono-pays) — le multi-implantation viendra par-dessus

**Epic :** EPIC-043 — Dossier client, unité de travail du cabinet
**Réf. :** ticket `TICKET-BACKEND-dossier-client-entite-de-premier-rang.md` — bloc **C** · décision **D10** *(« un seul pays en v1 », clé conservée `(dossier, pays)`)* · décision **D7** *(le référentiel se déduit du type d'entité)*
**Priorité :** Must Have
**Story Points :** 3
**Statut :** in_progress
**Complexité :** medium
**Créée le :** 2026-08-13
**Sprint :** 20
**Service :** `dossier-service`

---

## Le constat

`pays` et `typeEntite` sont **déjà portés** par le schéma `Dossier` — STORY-301 les y a posés
délibérément (son arbitrage ②), parce que **STORY-304 les consomme** et passe avant celle-ci dans
l'ordre de tirage. Cette story ne les ajoute donc pas : elle livre ce que le réancrage lui a laissé —
**durcir l'invariant mono-pays D10 et figer la clé `(dossier, pays)`**.

Trois manques, lus dans le code le 2026-08-13 :

| # | Ce qui a été lu | Où | Ce que ça dit |
|:--:|---|---|---|
| **1** | `pays` n'est validé que par sa **forme** : `@Matches(/^[A-Z]{2}$/)` | `creer-dossier.dto.ts:205` | `FR`, `US`, `ZZ` sont acceptés, et le dossier créé porte un pays pour lequel **rien n'est packagé** |
| **2** | `balance-service`, lui, **refuse** un pays sans paquet fiscal publié — `400 PAYS_NON_SUPPORTE`, nommant les pays supportés (dérivés du manifeste, aujourd'hui `TG` seul) | `profil-societe.service.ts:387-399` · `paquet-fiscal-registry.ts:142` | **Le propriétaire du dossier (D4) est plus permissif que son consommateur** |
| **3** | `pays` et `typeEntite` ne sont immuables que **par absence de route d'écriture** | `dossiers.controller.ts:51-59` *(garde Q3 de STORY-304)* | La garantie disparaît **le jour où STORY-079/355 ouvre une route** — et rien, dans le service, ne le dira |

Le constat **2** est le cœur de la story. Après STORY-356, `dossierId` devient obligatoire partout et
le dossier devient **la** source du pays : un dossier `FR` se crée aujourd'hui en `201`, entre au
portefeuille, reçoit un responsable et une attestation de mandat horodatée — puis **rien ne peut être
calculé pour lui**. La panne n'apparaît qu'au premier import de balance, plusieurs écrans plus loin,
sur un dossier auquel le cabinet s'est déjà engagé par écrit.

Le constat **3** est la leçon que ce dépôt a déjà payée deux fois : *un défaut par ABSENCE se lit
toujours fail-open* (STORY-148), et *une contrainte se pose AVANT son consommateur, jamais après*
(le hook inerte `nifNormaliseALaRequete` de STORY-354). Changer le `pays` d'un dossier après coup ne
serait pas une modification de champ : ce serait **déplacer le dossier d'un espace d'unicité de NIF à
un autre** (l'index unique porte `(orgId, pays, nifSocieteNormalise)`) et **rendre faux
rétroactivement** tout paquet fiscal déjà appliqué à un exercice.

---

## User Story

En tant qu'**administratrice de cabinet**,
je veux que **le pays d'un dossier soit un pays réellement servi par la plateforme, et qu'il ne
puisse plus changer une fois le dossier créé**,
afin de **ne jamais engager le cabinet par une attestation de mandat sur un dossier que rien ne
pourra calculer — ni voir un dossier changer de pays sous des exercices déjà produits**.

---

## Ce que la story livre

- **Une liste fermée de pays supportés**, `PAYS_SUPPORTES` (v1 : `['TG']`), et le refus explicite
  `400 PAYS_NON_SUPPORTE` **nommant les pays supportés** — **même code et même formulation que
  `balance-service`**, pour que le front n'ait pas deux vocabulaires d'erreur pour une seule règle.
  La liste est **exposée en `enum` Swagger** sur `CreerDossierDto.pays` : le client généré depuis
  `/api/docs-json` la porte, et le sélecteur de pays de **FE-060** n'a pas à en coder une seconde.
- **`pays` et `typeEntite` rendus immuables par le schéma**, et non plus seulement par l'absence de
  route : un hook `pre(['findOneAndUpdate', 'updateOne'])` **lève** dès qu'une mise à jour touche
  l'un des deux — `$set`, `$unset`, ou champ posé à la racine de la mise à jour. **Hook inerte
  documenté** : aucun chemin d'écriture actuel ne l'atteint, il est posé **avec** la contrainte qu'il
  protège, comme STORY-354 l'a fait pour le NIF normalisé.
- **La clé `(dossier, pays)` figée et documentée comme point de branchement de STORY-362** : le
  dossier mono-pays **devient sa première implantation** sans migration, parce que `pays` est déjà
  dans l'index d'unicité du NIF (STORY-354) et dans la charge utile de `dossier.*`.
- **Le verrouillage par la négative de la couche Implantation** : un test échoue si un champ
  `implantations` (ou un `pays` sous forme de tableau) devient acceptable, et si une route
  `…/implantations` apparaît. C'est le « ⚠ Ne PAS livrer la couche Implantation ici » du réancrage,
  rendu opposable — une promesse de périmètre, pas un oubli à combler plus tard.

---

## Arbitrages de rédaction

**① La liste vit dans le code de `dossier-service`, pas dans une variable d'environnement.**
Une `PAYS_SUPPORTES` configurable ferait d'une **règle métier** un réglage d'exploitation : deux
environnements pourraient accepter des dossiers différents, et le refus ne serait plus reproductible
en test. Côté `balance-service`, la liste est déjà **du code** (dérivée du manifeste des paquets
fiscaux) : la garder en code des deux côtés maintient la symétrie.

**② … et c'est une DETTE EXPLICITE, pas une source de vérité.** La vraie liste est **dérivée** du
manifeste des paquets fiscaux, propriété de `balance-service` (D-078-1 / D-078-2 : `dossier-service`
n'a ni exercice, ni registre d'artefacts — c'est exactement ce que STORY-304 a refusé de dupliquer).
Deux listes peuvent donc **diverger**. La divergence est bornée et asymétrique, et il faut la nommer :

- `dossier-service` **plus permissif** ⇒ on recrée le défaut d'aujourd'hui, en plus discret ;
- `dossier-service` **plus strict** ⇒ un pays packagé devient incréable — visible immédiatement, et
  réparable par une ligne.

⇒ **Ajouter un pays est un changement à DEUX dépôts**, au même titre qu'un changement de contrat
d'événement, et c'est consigné comme tel dans les notes techniques. La suppression de la dette
appartient à la story qui donnera à `dossier-service` un read-model du catalogue (candidate :
STORY-236, qui croise déjà `referentielComptable` côté `balance-service`).

**③ « Mon cabinet » (D1) accepte le pays de l'événement TEL QUEL, même non supporté.**
`identity.org.created` porte le `country` de l'organisation, qu'`auth-service` accepte sur deux
lettres quelconques (`register.dto.ts:59`, défaut `TG`). Refuser l'événement laisserait le cabinet
**sans dossier « Mon cabinet »** — D1 violé en silence, définitivement (le consommateur avance
l'offset sur une donnée structurellement rejetée). Inventer un pays de repli écrirait une **donnée
fiscale non sourcée**, ce que STORY-301 a déjà refusé pour la forme juridique.
⇒ On crée, et **on le dit** : `logger.warn` + `paysSupporte: false` dans les détails de l'entrée de
journal `DOSSIER_CREE`. La règle s'applique donc **au chemin humain et corrigeable** (la route, qui
rend un `400` nommant la liste), pas au chemin système et non corrigeable.

**④ Le hook d'immutabilité lève une erreur de PROGRAMMATION, pas un `409` métier.**
Aucune route n'atteint ce chemin : si on l'atteint, c'est qu'une story a câblé une écriture sans
lire la règle. Un `409` habillé se lirait comme une règle métier offerte à l'appelant — et
inviterait à la contourner. Une erreur brute casse bruyamment, en développement, chez celui qui
écrit le nouveau chemin.

**⑤ `nationalite` (actionnaire) n'est PAS contrainte à la liste.** C'est un attribut de personne,
sans conséquence de calcul : un actionnaire français d'une société togolaise est un cas normal.
Le confondre avec le pays d'imposition rendrait la règle fausse **et** bloquante.

---

## Hors périmètre — et pourquoi

- ⛔ **La couche Implantation (N pays par dossier)** → **STORY-362** (EPIC-028, module Fiscalité,
  S24). La faire porter au socle une complexité dont **aucun cabinet togolais n'a besoin en v1** est
  précisément ce que la scission du 2026-08-09 a évité.
- ⛔ **Une route de modification de l'identité du dossier** (dont `pays`/`typeEntite`) → STORY-079/355.
  Cette story pose la **garde** qui protégera cette route future ; elle ne l'ouvre pas.
- ⛔ **La résolution du paquet fiscal `pays × année`** → axe orthogonal, propriété `balance-service`
  (D-078-1). Cette story valide **qu'un paquet existe pour le pays**, elle n'en résout aucun.
- ⛔ **Une route `GET /pays-supportes`** : la liste part déjà dans l'`enum` Swagger et dans le corps
  du `400`. Une troisième surface pour trois valeurs serait de la surface pour rien — à créer le jour
  où la liste cesse d'être une constante (dette ②).
- ⛔ **Une migration des dossiers existants portant un pays non supporté.** Le dev repart de zéro
  (règle projet) ; et en production ce serait une **décision de reprise**, pas une contrainte de
  schéma — la rendre bloquante rendrait un dossier existant illisible.

---

## Acceptance Criteria

- [ ] **AC-1** — `POST /dossiers` avec `pays: 'FR'` (forme valide, pays non supporté) rend `400`, code
      `PAYS_NON_SUPPORTE`, et le message **nomme les pays supportés**. Aucun dossier n'est créé,
      aucune entrée de journal, aucune ligne d'outbox.
- [ ] **AC-2** — `POST /dossiers` avec `pays: 'tg'` (minuscules, espaces) est **normalisé puis
      accepté** : la normalisation précède le contrôle, sinon la règle refuserait une saisie correcte.
- [ ] **AC-3** — `POST /dossiers` avec `pays: 'TOGO'` ou `pays: ['TG','BJ']` rend `400` **de forme**
      (ISO-2), avant même le contrôle de support.
- [ ] **AC-4** — La liste des pays supportés apparaît en `enum` sur `pays` dans `/api/docs-json`.
- [ ] **AC-5** — Une mise à jour qui touche `pays` ou `typeEntite` (`$set`, `$unset`, ou racine)
      **lève** : aucune écriture n'aboutit. Vérifié sur le hook **tel qu'il est enregistré**, pas sur
      une copie de sa logique.
- [ ] **AC-6** — Les écritures existantes (affectation, archivage, réactivation, retombée Q2)
      **passent inchangées** : le hook ne les touche pas. Non-régression des 4 chemins.
- [ ] **AC-7** — « Mon cabinet » se crée **même** si `identity.org.created` porte un pays non
      supporté, et l'entrée de journal `DOSSIER_CREE` porte `paysSupporte: false`.
- [ ] **AC-8** — Aucun champ `implantations` n'est acceptable en écriture (`400`, whitelist stricte)
      et aucune route `…/implantations` n'existe (`404` de routage).
- [ ] **AC-9** — `pays` reste présent dans la charge utile de `dossier.created`/`dossier.updated` —
      c'est ce qui permettra à STORY-362 de promouvoir le dossier mono-pays en première implantation
      **sans migration**.

---

## Notes techniques

```ts
/**
 * **D10 — les pays réellement servis en v1.**
 *
 * ⚠️ DETTE ASSUMÉE : la source de vérité est le manifeste des paquets fiscaux
 * de `balance-service` (`PaquetFiscalRegistry.paysSupportes()`), qu'on ne peut
 * pas lire d'ici (D-078-1/D-078-2). **Ajouter un pays touche DEUX dépôts** —
 * ici ET le manifeste — au même titre qu'un contrat d'événement.
 */
export const PAYS_SUPPORTES = ['TG'] as const;
```

- Le contrôle vit dans **`DossiersService.creer`**, au même endroit que `validerDirigeants` : un
  point de passage unique, que toute future route d'écriture traversera. Le mettre dans le DTO
  (`@IsIn`) aurait rendu un `400` de class-validator **sans code métier** — le front ne pourrait plus
  distinguer « pays non servi » de « champ malformé ».
- Le hook d'immutabilité est **exporté** et testé tel qu'enregistré (`DossierSchema.pre(...)`),
  patron de `nifNormaliseALaRequete` : tester une copie de sa logique laisserait le **câblage** comme
  seul maillon non vérifié — c'est exactement le constat BLOQUANT de la revue de STORY-354.
- ⚠️ Le hook doit lire **les trois formes** d'écriture (`$set`, `$unset`, racine). N'en couvrir que
  `$set` rouvrirait le chemin de contournement, comme l'a montré `appliquerNifNormalise`.

---

## Dépendances

**Prérequises :** **STORY-301** *(porte `pays` et `typeEntite`)* · **STORY-354** *(l'index unique
`(orgId, pays, nifSocieteNormalise)` — la clé que cette story fige)* · **STORY-304** *(a
explicitement déféré ici la restriction du champ `pays`)*.
**Débloque :** **FE-060** *(sélecteur de pays et refus rendu tel quel)* · **STORY-362** *(promotion
sans migration du dossier mono-pays en première implantation)*.

---

## Definition of Done

- [ ] Lint 0 warning · build OK · couverture ≥ **65 / 90 / 90 / 90**.
- [ ] Unit : liste fermée, normalisation avant contrôle, les 3 formes d'écriture du hook, chemin
      « Mon cabinet » non supporté.
- [ ] e2e : `400 PAYS_NON_SUPPORTE` nommant la liste, `enum` Swagger, verrouillage par la négative
      de la couche Implantation, non-régression des 4 écritures existantes.
- [ ] Mutation-tests : retirer le contrôle de support · ne couvrir que `$set` dans le hook ·
      contrôler **avant** la normalisation.
- [ ] Vérification docker : aucun dossier écrit sur un pays refusé, « Mon cabinet » créé malgré un
      pays non supporté, écritures existantes inchangées.
- [ ] Revue de code · revue de sécurité.

---

## Story Points Breakdown

- Liste fermée + refus `400 PAYS_NON_SUPPORTE` + `enum` Swagger : 0,5 pt
- Hook d'immutabilité `pays`/`typeEntite` (3 formes d'écriture, exporté, testé au câblage) : 1 pt
- Arbitrage « Mon cabinet » (chemin système vs chemin humain) + trace : 0,5 pt
- Tests (unit + e2e + verrouillage par la négative) et mutations : 1 pt
- **Total : 3 points**

---

## Progress Tracking

| Phase | État | Note |
|---|---|---|
| Rédaction | ✅ | branche `MNV-302` (repo `docs/`) |
| Développement | ⏳ | |
| Validation (DoD) | ⏳ | |
| Mutation-tests | ⏳ | |
| Vérification docker | ⏳ | |
| Revue de code | ⏳ | |
| Revue de sécurité | ⏳ | |
| Clôture | ⏳ | |
