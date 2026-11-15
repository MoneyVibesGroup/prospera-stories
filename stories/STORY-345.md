# STORY-345 : Base de rémunération par BÉNÉFICIAIRE et par période (salarié, dirigeant, associé)

Status: done

**Epic :** EPIC-034 — Base de rémunération et obligations sociales
**Points :** 5 · **Sprint :** 28 (backend) · **Service :** `fiscal-service` (`:3012`)
**FR :** `FR-F27` *(amendé le 2026-08-15)* · **`FR-F79`** *(nouveau)*
**Décision :** **AD-20** *(l'agrégat de rémunération)* · **AD-21** *(donnée personnelle de tiers)* —
`architecture-fiscal-service-2026-08-03`
**Origine :** **arbitrage PO du 2026-08-15** — *« IRPP oui, CNSS différée »*
(`tickets/TICKET-BACKEND-dirigeants-et-associes-hors-regime-salarial.md`)
**Bloque :** **STORY-348** *(le calcul s'aiguille sur le type)* · **STORY-364** *(le refus sourcé)*

> ⚠️ **Ce fichier est créé le 2026-08-16.** La story existait depuis le découpage, mais son
> **amendement du 15/08 ne vivait que dans un commentaire de statut de `sprint-status.yaml`** — et le
> document d'épics, lui, disait encore « par salarié ». C'est le défaut du **titre sans fichier**, pour
> la cinquième fois dans ce dépôt : *ce qui n'est écrit nulle part de lisible n'est porté par personne.*

---

## Pourquoi le titre a changé

`FR-F27` disait **« par salarié »**. Un gérant majoritaire n'en est pas un :

- sa rémunération relève de l'**Art. 75 CGI**, distinct du régime salarial de l'**Art. 74** — même
  lorsque le barème IRPP est le même ;
- son affiliation à la CNSS n'obéit pas aux mêmes règles ;
- ⚡ il est **fréquemment le seul payé d'une TPE togolaise** — **la cible même du produit**.

> ⛔ Une base « par salarié » l'excluait **par construction et silencieusement** : aucune erreur, aucun
> blocage, juste une déclaration sociale incomplète. Le pire des trois défauts possibles.

⚡ **Le référentiel connaissait déjà la règle.** `referentiels/paquet-fiscal-togo-2026.json`, bloc
`irpp.source`, cite textuellement : *« s'applique aussi aux rémunérations de gérants / associés
Art. 75 »*. **Le paquet citait l'article ; le produit ne l'avait jamais lu.**

⚠️ **Et la donnée d'identité existe déjà** : `dossier.schema.ts` porte `dirigeants[]` (nom, fonction,
NIF) **depuis STORY-301**. Le dirigeant était **connu du système et jamais calculé**.

## Ce que la story livre

L'agrégat **`LigneDeRemuneration`**, keyé **`(dossier, période, bénéficiaire)`**, portant son
**`typeBeneficiaire`** parmi un ensemble fermé : `SALARIE` · `DIRIGEANT` · `ASSOCIE`.

- ⛔ **Le type est un ATTRIBUT de la ligne, jamais une collection par type.** Trois collections
  fabriqueraient **trois chemins de calcul** là où le moteur n'en a besoin que d'un, aiguillé (`AD-20`).
- ⚡ **L'idempotence est portée par la CLÉ**, pas par une détection applicative : un **index unique** sur
  `(dossier, période, bénéficiaire, versionDeBase)`, ⛔ **pas un `findOne` avant `insert`** — qui laisse
  passer deux imports concurrents, comme la reprise sur `WriteConflict` de `dossier-service` l'a montré.
- **Import et saisie manuelle produisent le MÊME agrégat**, par le même chemin d'application
  (`FR-F28`) — deux modèles internes feraient diverger les dossiers sans outil de paie, **qui sont
  précisément ceux qu'on veut ne pas exclure**.

## Critères d'acceptation

- **Étant donné** une période **quand** la base est constituée **alors** elle porte, **par
  bénéficiaire**, salaires, primes, gratifications, commissions et avantages en nature.
- **Étant donné** une ligne **quand** elle est créée **alors** elle porte un `typeBeneficiaire` de
  l'ensemble fermé, et une valeur hors ensemble est **refusée**.
- ⛔ **Étant donné** une ligne **sans** type **quand** elle est soumise **alors** elle est **refusée** —
  **aucune valeur par défaut `SALARIE`**, qui reproduirait exactement le silence que l'amendement ferme.
- **Étant donné** des remboursements de frais **quand** ils sont présents **alors** ils sont **exclus**
  de l'assiette *(`cnss.assiette.exclus` du paquet)*.
- **Étant donné** une base constituée **quand** elle est corrigée **alors** la version antérieure reste
  **lisible et attribuée** — et une déclaration déjà déposée cite **la version qui l'a produite**,
  ⛔ jamais « la dernière ». Sans quoi une correction de paie **réécrirait a posteriori le fondement
  d'un dépôt**.
- **Étant donné** un dossier dont `dirigeants[]` est renseigné **quand** le collaborateur saisit la base
  **alors** ces personnes lui sont **proposées** comme bénéficiaires.
- ⚠️ **Étant donné** la base **quand** elle est restituée **alors** le détail nominatif n'est servi
  **qu'aux rôles qui en ont l'usage déclaratif** ; les écrans de rapprochement (`FR-F32`) travaillent
  sur des **totaux par compte de personnel** *(`AD-21`)*.

## Ce que cette story ne fait PAS

- ⛔ Elle **ne calcule rien** — ni cotisation, ni retenue : c'est **STORY-348**.
- ⛔ Elle **ne traite pas le régime non déterminable** : c'est **STORY-364**.
- ⛔ Elle **ne stocke aucune donnée de paie** : ni identifiant national, ni coordonnée, ni donnée de
  contrat. `[HYPOTHÈSE H2]` borne le service **hors du logiciel de paie** (`AD-21`, minimisation).
- ⛔ Elle ne définit pas le **format d'import** — question ouverte n°2 du PRD, portée par **STORY-346**.

## Definition of Done

- [x] **Mutation-test** : rétablir une valeur par défaut `SALARIE` sur une ligne sans type ⇒ le test de
      refus **vire au rouge**. ⚠️ *Une garde qu'on n'a pas mise en défaut n'est pas une garde.*
- [x] L'index unique existe **au schéma** et un réimport concurrent de la même période **ne duplique
      rien** — vérifié par deux écritures parallèles, pas par un test séquentiel.
- [x] Une correction produit une **nouvelle version**, l'antérieure reste consultable.
- [x] Le chemin **import** et le chemin **saisie** aboutissent au **même document** — comparé octet à
      octet hors métadonnées de provenance.
- [x] ⚠️ Le **journal d'audit trace l'ACTE, pas les montants** : « base de la période P importée par
      X », ⛔ jamais le détail chiffré — sinon la piste d'audit, **inaltérable par NFR-F08**, devient un
      second stock de données personnelles **que la purge d'AD-21 ne peut pas atteindre**.
- [x] La **durée de conservation est lue dans le paquet**, jamais codée en dur.

---

## Livraison (2026-11-15)

**PR :** MoneyVibesGroup/prospera-fiscal-service#42 (fusionnée sur `dev`, commit `d9a7ae2`).

### Décisions prises en codant (contestables ; règle de l'utilisateur : « appliquer ce que je recommande »)

- **D-345-1 : qui est le bénéficiaire.** Une **référence interne** au cabinet (`beneficiaireId` : un matricule,
  un code ; lettres, chiffres et `. _ -`, 64 caractères au plus) et une **désignation** (le nom, 120 caractères au
  plus). Ce n'est **jamais** un identifiant national (AD-21). Une ligne de `DIRIGEANT` ou d'`ASSOCIE` **peut**
  désigner un redevable personne physique du dossier (`redevableId`, STORY-563). `verifierDesignation` refuse un
  salarié (`SALARIE_NON_REDEVABLE`) et une qualité qui ne correspond pas (`DESIGNATION_INCOMPATIBLE`).
- **D-345-2 : la période** s'écrit `AAAA-MM`, parce que la paie est mensuelle.
- **D-345-3 : une version est la base COMPLÈTE d'une période.** Corriger, c'est soumettre de nouveau toute la base
  (`PUT`). Un contenu différent de la dernière version crée la suivante (201 `CREEE`). Le même contenu ne crée rien
  (200 `INCHANGEE`). Le juge est l'empreinte du **document** canonique de la base (ordre des lignes indifférent,
  provenance exclue). C'est donc lui qui fait que l'import et la saisie aboutissent au même document.
- **D-345-4 : la restriction de lecture.** Le détail nominatif exige le droit `fiscalite:declaration:preparer`,
  qui correspond à l'usage déclaratif. Les **totaux** (par rubrique, avec l'assiette et un décompte par type) ne
  nomment personne et n'exigent que le rôle.
- **D-345-5 : la conservation est lue dans le paquet** (`remuneration.conservation`,
  `{ anneesApresImposition, source }`). La base d'une période de l'année N se garde jusqu'au 31/12 de N + la durée.
  ⚠️ **Le paquet `togo@2026` ne la déclare pas** : la réponse porte alors `NON_DECLAREE` et ce qui manque. Aucune
  échéance n'est inventée et rien n'est purgé. La source est identifiée dans le corpus du dépôt : **LPF Art. 316**
  (« le droit de reprise […] s'exerce jusqu'à la fin de la troisième année qui suit celle au titre de laquelle
  l'imposition est due »). Elle entrera au paquet à sa prochaine régénération, comme D-901-7, plutôt qu'en
  réépinglant trois dépôts pour une seule donnée.

### Ce qui est livré

- Le domaine `domain/remuneration/ligne-de-remuneration.ts` (pur) :
  - refus nommés : `TYPE_BENEFICIAIRE_ABSENT`, `TYPE_BENEFICIAIRE_INCONNU`, `BASE_VIDE`, `BASE_TROP_GRANDE`
    (2 000 lignes), `BENEFICIAIRE_INVALIDE`, `BENEFICIAIRE_EN_DOUBLE`, `RUBRIQUE_INCONNUE`, `MONTANT_INVALIDE`
    (entier ≥ 0 en FCFA), `REDEVABLE_INTROUVABLE` ;
  - l'assiette : les rubriques **incluses** de `cnss.assiette` (salaire de base, primes, gratifications,
    commissions, avantages en nature). Les remboursements de frais sont **portés mais exclus** ; un test confronte
    les listes au paquet.
- Deux collections. `bases_remuneration` (l'en-tête, sans nom) a son index unique `(org, dossier, période, version)`.
  `lignes_remuneration` a l'index unique d'AD-20, `(org, dossier, période, bénéficiaire, versionDeBase)`. Les deux
  sont en `strict: 'throw'`. L'en-tête est inséré **en premier**, et son index sérialise deux écritures concurrentes.
- Un **seul chemin** : `RemunerationService.constituer(…, provenance)`. La saisie l'appelle avec `SAISIE`, et
  l'import (STORY-346) l'appellera avec `IMPORT`. Le module exporte le service.
- Le journal chaîné `base-remuneration:<dossier>_<période>` reçoit l'acte `BASE_REMUNERATION_CONSTITUEE` : période,
  version, provenance, nombre de lignes. Ni montant, ni nom, ni référence, ni empreinte du contenu.
- Les **dirigeants du dossier sont proposés** (`dirigeants[]` de STORY-301, lus chez `dossier-service`) par leur nom
  et leur fonction, **jamais par leur NIF**. Les redevables personnes physiques le sont aussi.
- Routes :
  - `PUT /api/v1/dossiers/:dossierId/remuneration/:periode` (`PREPARER`) ;
  - `GET …/:periode?version=` (`PREPARER`) ;
  - `GET …/:periode/totaux` (rôle) ;
  - `GET …/remuneration/beneficiaires-proposes`, déclarée **avant** `:periode`.

### Preuves

- Unitaires **2324/2324** (165 suites, `-w 2`). Domaine 33, service 8, invariant du module.
- **Mutation-test** : rétablir `typeBeneficiaire || 'SALARIE'` fait rougir 4 tests ; le code rétabli, 33/33.
- Conformité sur un vrai MongoDB (`rs-fiscal`, compte `fiscal_app`) : **59/59**, dont les 6 de
  `remuneration.conformite-spec.ts` :
  - les deux index existent et MongoDB les applique ;
  - **quatre constitutions parallèles** du même contenu écrivent **une** version et 3 lignes ;
  - **deux corrections parallèles** donnent les versions 2 et 3, jamais deux « version 2 » ;
  - saisie et import écrivent les mêmes lignes à l'octet près, hors provenance ;
  - la chaîne d'audit est intacte et ne porte aucun montant, nom ni référence ;
  - un champ hors contrat est refusé par le schéma.
- e2e **187/187** ; `nest build` vert.
- `docker compose up` (pile `grp-a`, image reconstruite) : `RemunerationModule` s'initialise et les 4 routes sont
  montées.
  - Piège évité : `@Prop` sur une union de types (`Provenance`, `TypeBeneficiaire`) faisait **échouer le chargement
    du module** sans que le typage le voie. Le type `String` est maintenant explicite, et l'invariant du module le
    garde.

### Écarts, à porter ailleurs

- **Totaux « par compte de personnel » (FR-F32)** : ils sont rendus ici **par rubrique**. Le lien entre rubrique et
  compte de classe 66 revient au rapprochement (STORY-350).
- **Durée de conservation** absente du paquet (D-345-5). Le **mécanisme de purge** n'a pas de porteur dans
  EPIC-034.
- **Ce que 345 débloque, sans le faire** : le pré-remplissage du dirigeant (AC-7 de STORY-568), la liste d'invités
  tirée d'une période (STORY-569, aujourd'hui saisie à la main), et le calcul aiguillé sur le type (STORY-348).
  Une déclaration sociale citera `version` de l'en-tête (STORY-349).
