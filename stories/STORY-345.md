# STORY-345 : Base de rémunération par BÉNÉFICIAIRE et par période (salarié, dirigeant, associé)

Status: not_started

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

- [ ] **Mutation-test** : rétablir une valeur par défaut `SALARIE` sur une ligne sans type ⇒ le test de
      refus **vire au rouge**. ⚠️ *Une garde qu'on n'a pas mise en défaut n'est pas une garde.*
- [ ] L'index unique existe **au schéma** et un réimport concurrent de la même période **ne duplique
      rien** — vérifié par deux écritures parallèles, pas par un test séquentiel.
- [ ] Une correction produit une **nouvelle version**, l'antérieure reste consultable.
- [ ] Le chemin **import** et le chemin **saisie** aboutissent au **même document** — comparé octet à
      octet hors métadonnées de provenance.
- [ ] ⚠️ Le **journal d'audit trace l'ACTE, pas les montants** : « base de la période P importée par
      X », ⛔ jamais le détail chiffré — sinon la piste d'audit, **inaltérable par NFR-F08**, devient un
      second stock de données personnelles **que la purge d'AD-21 ne peut pas atteindre**.
- [ ] La **durée de conservation est lue dans le paquet**, jamais codée en dur.
