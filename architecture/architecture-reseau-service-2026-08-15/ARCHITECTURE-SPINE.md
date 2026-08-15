---
name: 'reseau-service'
type: architecture-spine
purpose: build-substrate
altitude: feature
paradigm: 'modules NestJS sur le moule commun Prospera — capacité PARTAGÉE (IMF × Distributeur), relying-party de l''IdP, producteur d''événements'
scope: 'micro-service reseau-service — zones, agences, hiérarchie récursive à profondeur configurable, rattachement lieux ↔ zones, affectation des personnes, PORTÉE D''ACCÈS, couverture et zones blanches'
status: 'final — 3 arbitrages PO du 2026-08-15 intégrés ; ils AMENDENT le PRD sur 4 points (voir §Amendements au PRD)'
created: '2026-08-15'
updated: '2026-08-15'
binds:
  - 'PRD Réseau, agences & zones v1 — FR-R01→R40, NFR-1→NFR-6'
sources:
  - 'prospera-stories/prds/prd-reseau-zones-2026-08-02/prd.md'
  - 'prospera-stories/architecture-prospera-ecosystem-2026-07-04.md (v1.4)'
  - 'prospera-stories/architecture-bilan-service-2026-07-07.md (moule de capacité partagée)'
  - 'prospera-stories/architecture/architecture-dossier-service-2026-08-15/ARCHITECTURE-SPINE.md'
  - 'auth-service/src/modules/auth/token.service.ts + types/jwt-payload.interface.ts (contenu réel du jeton)'
companions:
  - 'prospera-stories/prds/prd-reseau-zones-2026-08-02/.memlog.md'
---

# Architecture Spine — reseau-service

> **Ce que ce service est.** Il répond à *« où l'entreprise est présente, qui y répond, et jusqu'où va
> son autorité »*. Le catalogue de permissions (STORY-140) dit **ce qu'un rôle peut faire** ; ce module
> dit **sur quoi**. C'en est l'autre moitié.
>
> **Ce qu'il n'est jamais.** Un point de passage sur le chemin de lecture d'un autre service.

## Design Paradigm

**Modules NestJS sur le moule commun Prospera**, comme `dossier-service` — pas l'hexagonal de
`fiscal-service`. Il n'y a ici ni moteur de calcul ni adaptateurs interchangeables : le service possède
deux agrégats, en garde les invariants, et publie des faits.

| Couche | Répertoire | Contenu |
| --- | --- | --- |
| Entrée | `src/modules/*/` `*.controller.ts` | Contrôleurs, DTO, guards |
| Application | `src/modules/*/` `*.service.ts` | Cas d'usage, transactions, invariants d'arbre |
| Persistance | `src/modules/*/schemas/`, `*.repository.ts` | Schémas, index, requêtes |
| Événements | `src/kafka/`, `src/kafka/outbox/` | Contrats, outbox transactionnelle, relais |
| Read-models entrants | `src/modules/identity/`, `src/modules/read-models/` | `identity.*`, `kyc.status.changed`, `entitlement.changed` |
| Transverse | `src/common/` | Guards, RBAC, contexte, filtres |

## Inherited Invariants

**Lecture seule.** Un choix local qui les contredit est un conflit à remonter, pas une dérogation.
⚡ **C'est précisément ce mécanisme qui a fait tomber `FR-R28b`** — voir AD-5.

| Hérité | Source | Ce qu'il contraint ici |
| --- | --- | --- |
| **Règle d'or du jeton** | `architecture-prospera-ecosystem` | Le JWT porte l'identité, **jamais** l'état qui change par action tierce. Une portée est un tel état ⇒ elle ne voyage pas dans le jeton |
| Relying-party / JWKS | `architecture-prospera-ecosystem` | Validation locale RS256, aucun appel à `auth-service` sur le chemin chaud |
| `orgId` du jeton signé | `architecture-prospera-ecosystem` | L'isolation ne vient jamais du corps ni d'un paramètre (FR-R39, NFR-5) |
| Database-per-service | `architecture-prospera-ecosystem` | Ne lit aucune base d'un autre service |
| **P7/P8 — capacité partagée** | `architecture-prospera-ecosystem` | Partagé IMF × Distributeur ⇒ entitlement de `platform-catalog-service`, jamais une source de vérité côté vertical |
| Patron de gate | `architecture-bilan-service` | `emailVerified` + KYC `APPROVED` + entitlement `ACTIVE` |
| Outbox transactionnelle | STORY-099 | Publication dans la transaction qui produit le fait |
| Énumérations de topics séparées | `dossier-service` AD-11 | Un nouveau flux crée son énumération, il n'étend pas une existante |
| Unités mineures entières | contrat canonique STORY-101 | `FR-R08` : tout paramètre monétaire porte sa devise ⚠️ **le XOF n'a aucune décimale** |

---

## Invariants & Rules

### AD-1 — Le lieu et le périmètre sont deux agrégats, et aucun « lieu » générique n'est créé

- **Binds:** FR-R01, FR-R06, §1.3, R4
- **Rule:** **`Zone`** a des **frontières** et pas d'adresse. **`Agence`** a une **adresse** et pas de
  frontières. Les fondre donnerait un module qui ne va bien à aucune des deux verticales.
- **Rule:** ⛔ **aucun objet « lieu » partagé** avec l'entrepôt (Stock #7) ni le point de vente (PDV
  #2). Les trois n'ont en commun qu'une adresse et une géolocalisation ; un objet partagé coupleraient
  trois modules pour gagner un champ. **Conséquence assumée (R4)** : des adresses peuvent diverger
  entre modules. À réexaminer **si un 4ᵉ module crée un lieu**, pas avant.

### AD-2 — La hiérarchie est un arbre récursif ; la profondeur est une RÈGLE, jamais une structure

- **Binds:** FR-R11, FR-R12, FR-R13, NFR-4 · **Prevents:** une migration de schéma pour ajouter un niveau
- **Rule:** un seul agrégat `Noeud` récursif. **Aucun nombre de niveaux n'est codé en dur** — ni en
  schéma, ni en type, ni en nom de champ (`secteur`, `sousSecteur` sont des **libellés de
  configuration**, pas des colonnes).
- **Rule:** la profondeur maximale est un **paramètre d'organisation**, défaut **3**. Passer à 4 est un
  changement de valeur — **condition observable de NFR-4** : aucun changement de schéma, aucune reprise
  de données.
- **Rule:** le contrôle « un nœud n'est pas son propre ancêtre » (FR-R13) est fait **à l'écriture**.
  Le découvrir à la lecture, c'est le découvrir en production sur une boucle infinie.
- **Rule:** déplacer un nœud produit un **compte rendu préalable** (FR-R14) de la descendance déplacée
  **et des portées d'accès qui changent** — un déplacement d'arbre est un acte de sécurité, pas
  seulement d'organigramme.

### AD-3 — Le code d'un nœud est stable et non réutilisable

- **Binds:** FR-R03, FR-R04, FR-R10
- **Rule:** un code n'est **jamais** réattribué, même après fermeture. Les objets qui le référencent —
  points de vente, entrepôts, grilles tarifaires, objectifs — le font **pour longtemps**, et souvent
  dans des services qui n'existent pas encore.
- **Rule:** on **ferme**, on ne supprime pas. La fermeture est **refusée** tant que des objets actifs
  sont rattachés, **avec le détail de ce qui l'empêche** — un refus sans détail rend l'action
  impossible à corriger.

### AD-4 — La hiérarchie est versionnée : ce qui a servi est conservé avec ce qu'il a produit

- **Binds:** FR-R05, FR-R05b, NFR-3, R3 · **Prevents:** une comparaison annuelle devenue fausse **sans prévenir**
- **Rule:** un redécoupage — scission, fusion, transfert — **crée une version**, il ne réécrit rien.
- **Rule:** ⚡ **chaque objet rattaché conserve la version de découpage en vigueur au moment du
  rattachement.** Restituer une période passée utilise **la version de cette période**, jamais la
  courante. C'est le même patron que le facteur de conversion stocké avec le mouvement (`FR-C10b`) et
  le tarif stocké avec l'encaissement (`FR-P24b`).
- **Rule:** ⚠️ **C'est une obligation de contrat pour des modules qui n'existent pas encore.** Tout
  consommateur qui rattache un objet à une zone **doit** stocker la version. Elle est donc **dans la
  charge utile de l'événement** et dans la réponse de résolution — jamais à aller chercher.

### AD-5 — La portée voyage par READ-MODEL, jamais par le jeton [ARBITRÉ PO 2026-08-15]

> ⛔ **Cette décision REMPLACE `FR-R28b` et rend `FR-R28c` sans objet.** Le PRD est amendé.

**Deux raisons, dont une factuelle.**

1. **La prémisse de `FR-R28b` est fausse.** Elle dit « en extension du `perms[]` déjà livré
   (STORY-140) ». Vérifié dans `auth-service` (`auth.service.ts`) : *« les permissions ne viennent
   **QUE** du rôle plateforme : les rôles TENANT ne sont pas touchés par le RBAC (périmètre plateforme,
   **D15**) → `perms: []` »*. **`perms[]` est vide pour tout utilisateur de tenant** — or un superviseur
   d'agence IMF en est un. Il n'y a rien à étendre.
2. **Elle contredit la règle d'or de l'écosystème** : le JWT ne porte jamais l'état qui change par
   action tierce. Une portée est accordée et retirée par un administrateur.

- **Rule:** `reseau-service` **publie** `reseau.portee.changed` ; chaque service consommateur en tient
  un **read-model local** et filtre avec. C'est le patron **déjà en place** pour `kyc.status.changed` et
  `entitlement.changed` — **rien n'est inventé ici**.
- **Rule:** ⇒ **la révocation est effective à la propagation, pas au renouvellement du jeton.** La
  latence de `FR-R28c` disparaît.
- **Rule:** ⇒ **aucune contrainte de taille.** Une portée de 500 nœuds ne tient pas dans un cookie
  httpOnly de 4 Ko ; dans un read-model, sa taille est sans objet.
- **Rule:** ⇒ ⛔ **`auth-service` n'appelle JAMAIS `reseau-service`.** L'IdP ne dépend d'aucune
  capacité métier. Sans cette règle, `reseau-service` indisponible = **plus personne ne se connecte**,
  y compris les cabinets expert-comptable, qui n'ont rien à voir avec le réseau.
  ⇒ **`NFR-6` est amendé** : il n'existe plus de « calcul de la portée à l'émission du jeton ».
- **Rule:** l'événement porte **l'état absolu** de la portée d'un utilisateur, jamais un delta —
  rejouable, idempotent, keyé `(orgId, userId)`.

### AD-6 — Une portée absente REFUSE ; l'invariant est distribué et tenu par un test de conformité [ARBITRÉ PO 2026-08-15]

- **Binds:** FR-R27, NFR-1, SM-1, R1 · **Prevents:** le défaut le plus coûteux du module, et le seul qui ne se voit pas en test fonctionnel

**Le problème structurel, énoncé franchement :** `FR-R28` interdit à ce module d'appliquer le filtre.
La garantie la plus importante du module est donc tenue **entièrement par d'autres**, dont aucun
n'existe encore.

- **Rule:** **fail-closed, sans exception.** Une portée absente, vide ou non résolue rend **zéro
  enregistrement**. Elle **n'ouvre jamais**. Un `undefined` qui traverse un filtre en le neutralisant
  est le mode de défaillance exact que cette règle interdit.
- **Rule:** ⚡ **une portée « totale » est une VALEUR EXPLICITE** (`FR-R29`), déclarée et journalisée —
  **jamais l'absence de restriction**. « Pas de portée » et « portée totale » doivent être deux états
  distincts dans le modèle, sinon la première se lit comme la seconde le jour d'une erreur de
  projection.
- **Rule:** `reseau-service` publie une **suite de tests de conformité** versionnée, avec son jeu de cas
  (portée absente · vide · totale explicite · héritée · restreinte · révoquée en vol). **Tout service
  consommateur exécute cette suite dans sa propre CI.**
- **Rule:** ⚠️ **Faiblesse connue et acceptée de ce mécanisme** *(arbitrage PO — l'alternative,
  une bibliothèque de filtre obligatoire, a été écartée)* : **un service qui n'exécute pas la suite
  passe entre les mailles**, et son oubli est silencieux. Mitigation obligatoire : le service tient un
  **registre des consommateurs conformes** (service, version de suite, date du dernier passage), et
  **`SM-3` se mesure sur ce registre**, pas sur une déclaration. Un consommateur absent du registre est
  un écart ouvert, pas une absence d'information.

### AD-7 — La portée d'écriture ne déborde jamais la portée de lecture ; le service refuse, il n'ajuste pas

- **Binds:** FR-R24, FR-R24b, FR-R24c (Q2, tranchée le 2026-08-02)
- **Rule:** permission et portée sont **deux dimensions distinctes** qui se combinent. La portée
  s'applique **aux lectures ET aux écritures**.
- **Rule:** la portée d'écriture peut être **plus étroite** que celle de lecture — un superviseur lit
  tout son secteur et ne modifie que son agence. Elle ne peut **jamais** être plus large : **on ne
  modifie pas ce qu'on ne voit pas.**
- **Rule:** une portée d'écriture qui déborde est **refusée**, avec le débordement nommé. ⛔ **Elle
  n'est jamais ajustée silencieusement** : un ajustement produit une portée que personne n'a demandée
  et que l'auteur croit connaître.

### AD-8 — Attribuer une portée est le droit le plus sensible, et il est borné par celui qui l'exerce

- **Binds:** FR-R35, FR-R36, FR-R30, CM-2
- **Rule:** **nul ne peut attribuer une portée supérieure à la sienne, ni une portée qu'il ne détient
  pas.** Même principe que le mandat de l'assistant IA (`FR-IA36c`).
- **Rule:** toute modification de portée est **journalisée** avec auteur, **motif** et périmètre
  avant/après. Élargir une portée est une décision de sécurité, pas un réglage.
- **Rule:** ⚠️ **`CM-2` est un seuil à zéro, pas une tendance** : toute portée « totale » attribuée à un
  utilisateur non plateforme est une **alerte unitaire**. *« C'est ainsi que le contrôle d'accès se vide
  de son sens : non par une faille, mais par une commodité accordée un jour d'urgence. »*

### AD-9 — Le module publie, il n'applique pas — il n'est jamais sur le chemin de lecture

- **Binds:** FR-R28, NFR-2, R2 · **Prevents:** un goulot d'étranglement sur toutes les lectures du programme
- **Rule:** aucune API de ce service n'est appelée pour **filtrer** les données d'un autre. Il publie
  la portée et la hiérarchie ; chaque service filtre les siennes.
- **Rule:** ⚠️ La restitution de hiérarchie (FR-R15) et la résolution (FR-R18) sont des **services de
  référentiel** — consultés à la configuration ou à l'écriture, **jamais** sur le chemin de lecture
  d'un consommateur. Si un consommateur les appelle par lecture, l'invariant est rompu même si
  l'API existe.

### AD-10 — Capacité partagée : entitlement au catalogue et gate local [ARBITRÉ PO 2026-08-15]

- **Binds:** P7/P8, §Verticales (IMF × Distributeur), FR-R39, NFR-5
- **Rule:** `reseau` est un **module au catalogue** de `platform-catalog-service`, avec entitlement par
  organisation. **Aucun vertical n'est source de vérité** sur qui y a droit.
- **Rule:** gate local **`@RequiresReseauAccess`** = `emailVerified` + KYC `APPROVED` + entitlement
  `ACTIVE`, lu dans les read-models locaux — jamais interrogé à chaud.
- **Rule:** ⚠️ **Décidé MAINTENANT et non « à l'ouverture de la seconde verticale ».** C'est
  exactement le raisonnement qui a laissé `dossier-service` sans gate pendant six semaines, découvert
  par une spine rétroactive et corrigé par STORY-363.

### AD-11 — La résolution a deux chemins et deux fiabilités ; « non résolu » n'est jamais une zone approchante

- **Binds:** FR-R02, FR-R18, FR-R18b, A1 · **Prevents:** un rattachement plausible et faux
- **Rule:** avec **emprise géographique**, la résolution d'un point est **géométrique et certaine**.
  Sans emprise — le cas courant au v1 — elle se fait par **correspondance de localité déclarée**, avec
  un taux d'échec réel.
- **Rule:** ⛔ une adresse inconnue du référentiel rend **« non résolu »**. **Jamais une zone
  approchante.** Une zone approchante est une donnée fausse qui ne se signale nulle part.
- **Rule:** **le chemin utilisé est restitué avec la réponse.** Le consommateur doit pouvoir
  distinguer une certitude géométrique d'une correspondance de libellé — les deux n'engagent pas au
  même niveau.

### AD-12 — Les lieux des autres modules sont des références, jamais des copies

- **Binds:** FR-R16, FR-R19, R4
- **Rule:** le rattachement lieux ↔ zones est **plusieurs à plusieurs**, et un lieu détenu ailleurs
  (entrepôt, magasin, point de vente) est référencé **par identifiant**. Ce module **ne détient ni ne
  duplique** ces objets.
- **Rule:** un rattachement porte un **rôle** — desserte principale ou de secours (FR-R17). Le module
  Stock suggère des transferts entre entrepôts : savoir lequel est le secours de qui rend ces
  suggestions justes.
- **Rule:** la zone reste une **référence opaque** pour Catalogue, Stock et PDV. **Ce module la rend
  résoluble ; il ne la leur impose pas.**

### AD-13 — La couverture se compte ; la carte n'est pas exhaustive et le dit

- **Binds:** FR-R31, FR-R32, FR-R33, FR-R34, CM-1, R6
- **Rule:** la couverture est calculée **à partir de ce que les autres modules rattachent**. Le module
  **compte**, il ne juge pas de la qualité.
- **Rule:** ⚠️ **une zone qui n'existe pas dans le système n'est pas une zone blanche — elle est
  invisible.** Le module ne détecte pas les territoires **non déclarés** ; c'est Conquête (#16), sur
  données externes. **L'écrire empêche de croire la carte exhaustive.**
- **Rule:** le **fournisseur de candidats** (FR-R34) expose des faits — zones blanches, nœuds sans
  responsable, agences fermées avec rattachements actifs — **jamais un jugement ni une action**.

### AD-14 — Journal d'audit append-only, protégé par le serveur

- **Binds:** FR-R40, FR-R22 · **Reprend** `fiscal-service` AD-10 et `dossier-service` AD-13
- **Rule:** hiérarchie, rattachements, portées et redécoupages sont journalisés en **append-only**, la
  protection venant du **rôle serveur**, pas de la discipline du code applicatif.
- **Rule:** ⚠️ **une écriture sans lecture ne se signale nulle part.** Ce programme l'a payé **trois
  fois** (`admin_audit_logs` → STORY-294, `profils_societe_audit` → STORY-360, journal de dossier).
  **La route de lecture est livrée par la même story que l'écriture, avec son consommateur nommé.**
- **Rule:** l'auteur est rendu **par son identité**, jamais un `userId` brut.

### AD-15 — « Portée » est un homonyme dans ce programme, et les deux ne se confondent jamais

- **Prevents:** un service qui appliquerait la mauvaise portée en croyant appliquer la bonne
- **Rule:** **`PorteeDossier`** (`dossier-service`, **livrée**) = responsable et contributeurs d'un
  dossier client, verticale expert-comptable. **`PorteeReseau`** (ici) = ensemble de nœuds d'un arbre,
  verticales IMF et distributeur. **Deux concepts, deux mécanismes, un mot.**
- **Rule:** le type, l'événement et le read-model portent **`Reseau` dans leur nom, sans exception**
  (`PorteeReseau`, `reseau.portee.changed`, `OrgPorteeReseau`). Un `Portee` nu est interdit dans ce
  service.

---

## Consistency Conventions

| Sujet | Convention |
| --- | --- |
| Collections | `zones`, `agences`, `noeuds`, `rattachements`, `portees_reseau`, `reseau_journal` — `snake_case` explicite |
| Erreurs métier | Code machine stable (`ZONE_FERMEE_RATTACHEMENTS_ACTIFS`, `PORTEE_ECRITURE_DEBORDE`, `PROFONDEUR_MAX_ATTEINTE`, `ZONE_NON_RESOLUE`) + message traduit |
| Montants | Entier d'unité mineure + devise portée (FR-R08) ⚠️ **XOF : zéro décimale** |
| Absence de portée | **Refuse** (AD-6). `null` et « totale » sont deux valeurs distinctes, jamais confondues |
| Codes de nœud | Stables, jamais réattribués (AD-3) |
| Topics | `ReseauTopic` et `PorteeTopic` sont des énumérations **séparées** (leçon `dossier-service` AD-11) |

## Stack

NestJS · MongoDB (base propre) · Kafka (producteur `reseau.*` / `reseau.portee.*` ; consommateur
`identity.*`, `kyc.status.changed`, `entitlement.changed`) · JWT RS256 en relying-party.
**Pas de dépendance sortante synchrone vers un autre service métier.**

## Structural Seed

| Agrégat | Clé | Notes |
| --- | --- | --- |
| `Noeud` | `(orgId, code)` | récursif, `parentId`, type, `versionDecoupage`. Zone et Agence en sont deux spécialisations |
| `Zone` | — | frontières facultatives (emprise ou liste de localités), pas d'adresse |
| `Agence` | — | adresse, géolocalisation, horaires, responsable, paramètres opérationnels |
| `Rattachement` | `(lieuRef, zoneId)` | plusieurs à plusieurs, rôle principal/secours, **version de découpage** |
| `AffectationPersonne` | `(userId, noeudId, période)` | historisée (FR-R22) |
| `PorteeReseau` | `(orgId, userId)` | lecture ⊇ écriture, héritage explicite, **totale = valeur** |
| `ReseauJournalEntry` | append-only | AD-14 |

### Événements publiés

| Topic | Déclencheur |
| --- | --- |
| `reseau.noeud.created` / `.moved` / `.closed` | cycle de vie d'un nœud |
| `reseau.decoupage.versionne` | scission, fusion, transfert (AD-4) |
| `reseau.responsable.changed` | FR-R21 |
| `reseau.portee.changed` | **AD-5** — état absolu, keyé `(orgId, userId)` |

Partition par **`orgId`** (l'arbre est cloisonné par organisation ; aucune relation inter-org).

## Capability → Architecture Map

| Incrément PRD | Vit dans | Gouverné par |
| --- | --- | --- |
| **1 — Le réseau existe** (A · B · C, ~26 pts) | `modules/zones`, `modules/agences`, `modules/hierarchie` | AD-1, AD-2, AD-3, AD-4, AD-10 |
| **2 — L'autorité s'applique** (E · F · H, ~29 pts) | `modules/personnes`, `modules/portee`, `kafka/outbox` | **AD-5, AD-6, AD-7, AD-8**, AD-9, AD-14, AD-15 |
| **3 — Le réseau se lit** (D · G, ~21 pts) | `modules/rattachements`, `modules/couverture` | AD-11, AD-12, AD-13 |

⚠️ L'incrément **2** est le plus précieux **et le plus risqué** : c'est lui qui complète le contrôle
d'accès, et c'est lui dont l'erreur — une portée vide qui ouvre tout — est **silencieuse**.

---

## ⚡ Amendements au PRD imposés par cette spine

À reporter dans `prds/prd-reseau-zones-2026-08-02/prd.md` :

| Exigence | Amendement |
| --- | --- |
| **FR-R28b** | ⛔ **REMPLACÉE.** La portée voyage par **read-model d'événements**, pas dans le jeton. Sa prémisse (« en extension du `perms[]` livré ») est **factuellement fausse** : `perms[]` est vide pour tout utilisateur de tenant (D15) |
| **FR-R28c** | ⛔ **SANS OBJET.** Il n'y a plus de latence de révocation liée au jeton |
| **NFR-6** | ⚠️ **AMENDÉE.** La ligne « calcul de la portée à l'émission du jeton, P95 < 200 ms » disparaît : l'IdP n'appelle jamais ce service |
| **A3** | ✅ **CONFIRMÉE par l'architecture**, comme le PRD l'attendait — les consommateurs filtrent eux-mêmes, avec une **suite de conformité** et un **registre** (AD-6) |
| **§Verticales** | ➕ `reseau` devient un **module au catalogue** avec entitlement par organisation (AD-10) — le PRD ne le mentionnait pas |

## Deferred

| Différé | Pourquoi | Revient quand |
| --- | --- | --- |
| Emprise géographique (polygones) | **Q4** — liste de localités au v1 ; A1 dit que les organisations raisonnent en noms de lieux | 1ᵉʳ client demandant une carte précise |
| Profondeur > 3 | **A2** — 3 niveaux suffisent aux réseaux visés. AD-2 garantit que c'est un paramètre | 1ᵉʳ réseau plus profond |
| Agence comme point de stock | **Q1**, ouverte — §1.3 laisse chaque module détenir son lieu | Module Caisse & guichet (#15) |
| Affectation multi-branches | **Q3**, ouverte — avis du PRD : oui, cas du superviseur itinérant | À trancher avant l'incrément 2 |
| Objet « lieu » générique | R4, assumé | **Si un 4ᵉ module crée un lieu** |
