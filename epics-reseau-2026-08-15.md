---
stepsCompleted: [1]
inputDocuments:
  - prospera-stories/prds/prd-reseau-zones-2026-08-02/prd.md
  - prospera-stories/prds/prd-reseau-zones-2026-08-02/.memlog.md
  - prospera-stories/architecture/architecture-reseau-service-2026-08-15/ARCHITECTURE-SPINE.md
  - prospera-stories/architecture-prospera-ecosystem-2026-07-04.md
  - prospera-stories/architecture-bilan-service-2026-07-07.md
  - prospera-stories/architecture/architecture-dossier-service-2026-08-15/ARCHITECTURE-SPINE.md
  - prospera-stories/sprint-status.yaml (reserved_ranges, relevé le 2026-08-15)
  - auth-service/src/modules/auth/auth.service.ts (contenu réel du jeton — la vérification qui a fait tomber FR-R28b)
---

# Réseau, agences & zones (`reseau-service`) — Découpage en épics

## Vue d'ensemble

Découpage du PRD **Réseau, agences & zones** et de la colonne vertébrale `reseau-service`
(AD-1 → AD-15) en épics implémentables. Périmètre **backend** ; le frontend suit sa série `FE-*` /
`DI-*` dans son tracker propre.

**Série retenue : épics EPIC-044 → EPIC-053.** Plage prise dans le bloc `reserved_ranges` de
`sprint-status.yaml`, où elle figurait **LIBRE** — libérée le 2026-08-15 par la renumérotation de
`notification-service`. Elle y est inscrite au nom de ce module **le jour où elle est prise**, comme
la règle l'exige.

**Aucun `story_id` n'est réservé ici.** Les numéros de story s'attribuent **au slotting**, quand les
stories entrent dans `sprint-status.yaml`. C'est la règle du registre, et elle a une raison : réserver
tôt, c'est se faire dépasser — deux fois sur trois dans ce dépôt.

---

## ⚠️ Le découpage pèse 110 pts, le PRD en annonçait ~76. L'écart n'est pas du gonflement.

| Source | Pts |
| --- | ---: |
| Incréments du PRD (1 + 2 + 3) | ~76 |
| **+ Socle et capacité partagée** (EPIC-044) | **+13** |
| **+ Versionnement du découpage** (EPIC-047) | **+8** |
| **+ Publication et conformité des consommateurs** (EPIC-050) | **+13** |
| **Total** | **110** |

**Trois manques du chiffrage d'origine, tous sourcés :**

1. **Le socle n'était pas compté.** Le PRD ne mentionnait ni entitlement ni gate ; c'est **AD-10** qui
   les impose, parce que le module est partagé IMF × Distributeur (P7/P8). Un service qui démarre,
   valide un jeton, consomme trois read-models et se cloisonne, ce n'est pas gratuit.
2. **Le versionnement était fondu dans l'incrément 1.** `FR-R05b` n'est pas une variante de `FR-R05` :
   c'est un mécanisme à part, avec une **obligation de contrat sur des modules qui n'existent pas
   encore** (chaque objet rattaché conserve sa version de découpage). Il porte à lui seul **NFR-3**.
3. **La conformité des consommateurs était fondue dans l'incrément 2.** `NFR-1` est un **invariant
   distribué** : `FR-R28` interdit à ce module d'appliquer le filtre. Produire une suite de tests
   versionnée et tenir un registre des consommateurs conformes est un livrable, pas une clause.

---

## Blocs d'ordonnancement — **pas** des sprints

Aucun sprint n'est attribué : l'ordonnancement est une décision PO. Capacité de référence : **34**.

| Bloc | Épics | Pts | vs 34 |
| --- | --- | ---: | --- |
| **Bloc 1 — Le réseau existe** | EPIC-044, EPIC-045, EPIC-046 | **39** | ⚠️ +5 |
| **Bloc 2 — L'autorité s'applique** | EPIC-048, EPIC-049, EPIC-050 | **34** | ✅ pile |
| **Bloc 3 — Le réseau tient dans le temps et se lit** | EPIC-047, EPIC-051, EPIC-052, EPIC-053 | **37** | ⚠️ +3 |

⚠️ **Le bloc 2 est le plus précieux et le plus risqué**, comme le PRD le dit lui-même : c'est lui qui
complète le contrôle d'accès, et c'est lui dont l'erreur — une portée vide qui ouvre tout — est
**silencieuse**. Il ne se voit pas en test fonctionnel, seulement en audit.

### Deux contraintes d'ordre, à ne pas défaire au slotting

- ⛔ **EPIC-047 précède EPIC-051.** `FR-R05b` exige que tout objet rattaché **conserve la version de
  découpage** en vigueur. Livrer les rattachements avant le versionnement produirait des rattachements
  **sans version**, donc un historique déjà faux le jour de sa création.
- ⛔ **EPIC-049 précède EPIC-050.** On ne publie pas une portée dont le modèle d'héritage et de
  gouvernance n'est pas arrêté : les consommateurs bâtiraient leur read-model sur une forme provisoire.

---

## Carte de couverture des exigences

| Exigences | Épic |
| --- | --- |
| FR-R39, NFR-5 · AD-10 · invariants hérités | **EPIC-044** — socle, entitlement, gate, cloisonnement, read-models entrants |
| FR-R01 → FR-R04 · FR-R06 → FR-R10 · AD-1, AD-3 | **EPIC-045** — zones et agences, deux agrégats, fermeture sans suppression |
| FR-R11 → FR-R15 · NFR-4 · AD-2 | **EPIC-046** — arbre récursif, profondeur configurable, anti-cycle, déplacement |
| FR-R05, FR-R05b · NFR-3 · AD-4 | **EPIC-047** — redécoupage versionné, l'ancien reste consultable |
| FR-R20 → FR-R23 · SM-2 | **EPIC-048** — affectations, responsables, historique |
| FR-R24, FR-R24b, FR-R24c, FR-R25, FR-R26, FR-R29, FR-R30, FR-R36 · AD-7, AD-8 | **EPIC-049** — modèle de portée, héritage, gouvernance du droit d'attribuer |
| FR-R27, FR-R28 · **NFR-1**, NFR-2 · SM-1, SM-3 · AD-5, AD-6, AD-9 | **EPIC-050** — publication par read-model, fail-closed, suite de conformité, registre |
| FR-R16 → FR-R19 · AD-11, AD-12 | **EPIC-051** — rattachement N-N, résolution à deux fiabilités |
| FR-R31 → FR-R34 · CM-1 · AD-13 | **EPIC-052** — couverture, zones blanches, fournisseur de candidats |
| FR-R35, FR-R37, FR-R38, FR-R40 · AD-14 | **EPIC-053** — droits, import tout-ou-rien, publication, journal **lisible** |
| AD-15 | **transverse** — porté par les conventions de nommage de chaque épic |

**Couverture : 40 exigences fonctionnelles sur 40, 6 NFR sur 6, 15 AD sur 15.**
NFR-6 (délais) est transverse et vit dans les critères d'acceptation ; sa ligne « calcul de la portée à
l'émission du jeton » a été **supprimée** par AD-5 et remplacée par une cible de propagation, portée
par EPIC-050.

---

## EPIC-044 : Socle `reseau-service`, capacité partagée et cloisonnement · 13 pts

Le service démarre, valide un jeton RS256 en relying-party, se cloisonne par organisation, et
**n'ouvre ses routes qu'à une organisation qui y a droit**.

**Autonome :** oui. **Amont :** aucun — `platform-catalog-service` est livré.

- Scaffold : base propre, configuration, santé, démarrage **dégradé** si le bus n'est pas encore là
  (patron `dossier-service` : le consumer échoue au boot, le process reste vivant, HTTP répond).
- Enregistrement du module `reseau` au catalogue et **entitlement par organisation** (AD-10).
- Gate local **`@RequiresReseauAccess`** = `emailVerified` + KYC `APPROVED` + entitlement `ACTIVE`,
  lu dans les read-models locaux, **jamais interrogé à chaud**.
- Read-models entrants : `identity.*`, `kyc.status.changed`, `entitlement.changed` — le patron existe
  à l'identique dans `bilan-service` et `balance-service`, **à copier, pas à concevoir**.
- Cloisonnement strict par organisation (FR-R39, NFR-5) : l'`orgId` vient du **jeton signé**, jamais
  du corps ni d'un paramètre.
- Outbox transactionnelle + **énumérations de topics séparées** dès le départ (`ReseauTopic`,
  `PorteeTopic`) — la leçon `dossier-service` AD-11.

⚠️ **Décidé maintenant et non « à l'ouverture de la seconde verticale ».** C'est le raisonnement
inverse de celui qui a laissé `dossier-service` sans gate pendant six semaines, découvert par une
spine rétroactive et corrigé par STORY-363.

## EPIC-045 : Zones et agences — deux agrégats, jamais un lieu générique · 13 pts

**Autonome :** oui. **Amont :** EPIC-044.

- **Zone** : nom, code stable, type propre à l'organisation, parent éventuel. **Pas d'adresse.**
  Emprise **facultative** — contour ou liste de localités (Q4 : liste au v1).
- **Agence** : nom, code stable, adresse, géolocalisation, type, responsable, parent, horaires et
  calendrier de fermetures, paramètres opérationnels.
- ⚠️ Tout paramètre **monétaire porte sa devise**, en entier d'unité mineure — **le XOF n'a aucune
  décimale**. Ce module **détient** ces paramètres, il ne les applique pas.
- Fermeture sans suppression, pour l'une comme pour l'autre. Le refus de fermer **nomme ce qui
  l'empêche** : un refus sans détail rend l'action impossible à corriger.
- Code **jamais réattribué**, même après fermeture (AD-3).

⛔ **Bornes explicites, à ne pas franchir** : la **caisse** d'une agence n'est pas ici (`FR-R09`,
module #15) ; l'**entrepôt** et le **magasin** non plus (#7) ; le **point de vente** non plus (#2).
Aucun objet « lieu » partagé n'est créé — les trois n'ont en commun qu'une adresse et une
géolocalisation, et un objet partagé coupleraient trois modules pour gagner un champ.

## EPIC-046 : Hiérarchie récursive, profondeur configurable · 13 pts

**Autonome :** oui. **Amont :** EPIC-045.

- Un seul agrégat `Noeud` **récursif**. ⛔ **Aucun nombre de niveaux codé en dur** — ni en schéma, ni
  en type, ni en nom de champ. `secteur` et `sousSecteur` sont des **libellés de configuration**.
- Profondeur maximale = **paramètre d'organisation**, défaut **3**.
- Anti-cycle **à l'écriture** (`FR-R13`). Le découvrir à la lecture, c'est le découvrir en production
  sur une boucle infinie.
- Déplacement d'un nœud avec **compte rendu préalable** : ce qui bouge **et qui change de portée
  d'accès**. Un déplacement d'arbre est un acte de sécurité, pas seulement d'organigramme.
- Restitution de la hiérarchie complète et du chemin d'un nœud jusqu'à la racine.

**Critère de sortie, et il est mesurable :** passer de 3 à 4 niveaux se fait **par configuration**,
sans changement de schéma ni reprise de données (`NFR-4`, `SM-5`). À prouver une fois, en vrai.

## EPIC-047 : Le redécoupage ne réécrit pas le passé · 8 pts

**Autonome :** oui. **Amont :** EPIC-046. ⛔ **Précède EPIC-051.**

- Scission, fusion, transfert d'un sous-ensemble : toute opération **datée et tracée**.
- ⚡ **La hiérarchie est versionnée**, et **chaque objet rattaché conserve la version en vigueur au
  moment du rattachement**. Restituer une période passée utilise **la version de cette période**.
- Même patron que le facteur de conversion stocké avec le mouvement (`FR-C10b`) et le tarif stocké
  avec l'encaissement (`FR-P24b`) : **ce qui a servi est conservé avec ce qu'il a servi à produire**.
- ⚠️ **C'est une obligation de contrat pour des modules qui n'existent pas encore.** La version est
  donc **dans la charge utile de l'événement** et dans la réponse de résolution — jamais à aller
  chercher par un appel supplémentaire.

**Ce que cet épic empêche :** qu'une comparaison de performance d'une année sur l'autre devienne
fausse **sans prévenir** (`NFR-3`, `SM-4`, risque R3).

## EPIC-048 : Personnes, responsables et affectations · 8 pts

**Autonome :** oui. **Amont :** EPIC-046.

- Affectation d'une personne à **un ou plusieurs nœuds**, avec dates de début et de fin.
- Un nœud porte un **responsable**. ⚠️ Un nœud **sans responsable est listable et signalé** : c'est un
  **trou d'exploitation**, pas une configuration neutre (`SM-2` : ≈ 0, et toujours listables).
- Historique des affectations **conservé** : savoir qui répondait d'une agence à une date passée est
  une question d'**audit**, pas de confort.
- ⛔ Ce module **ne gère pas les personnes** — identité, contrat et performance appartiennent au module
  #18. Il gère leur **rattachement**.

*Question ouverte à trancher avant cet épic :* **Q3** — une personne peut-elle être affectée à des
nœuds de **branches différentes** (deux zones sans ancêtre commun) ? Avis du PRD : **oui**, c'est le
cas du superviseur itinérant.

## EPIC-049 : La portée d'accès — modèle, héritage, gouvernance · 13 pts

**Autonome :** oui. **Amont :** EPIC-046, EPIC-048. ⛔ **Précède EPIC-050.**

- Une portée est un **ensemble de nœuds**. Permission et portée sont **deux dimensions distinctes** qui
  se combinent : le catalogue dit **quoi**, la portée dit **sur quoi**.
- La portée s'applique **aux lectures ET aux écritures** (Q2, tranchée le 2026-08-02).
- ⚡ La portée d'**écriture** peut être **plus étroite** que celle de lecture, **jamais plus large** :
  on ne modifie pas ce qu'on ne voit pas. Un débordement est **refusé, avec le débordement nommé** —
  ⛔ **jamais ajusté silencieusement**, car un ajustement produit une portée que personne n'a demandée
  et que l'auteur croit connaître.
- Héritage **par descendance, explicite** ; restriction possible à un sous-ensemble sans casser
  l'héritage général.
- ⚡ **Une portée « totale » est une VALEUR EXPLICITE**, déclarée et journalisée — **jamais l'absence de
  restriction**. « Pas de portée » et « portée totale » sont deux états **distincts dans le modèle**,
  sinon le premier se lit comme le second le jour d'une erreur de projection.
- **Gouvernance du droit d'attribuer** : nul ne peut attribuer une portée **supérieure à la sienne**,
  ni une portée **qu'il ne détient pas** (même principe que le mandat de l'assistant IA, `FR-IA36c`).
- Toute modification est **journalisée avec auteur, motif et périmètre avant/après**.

⚠️ **`CM-2` est un seuil à zéro, pas une tendance.** Toute portée « totale » attribuée à un
utilisateur non plateforme est une **alerte unitaire**. *« C'est ainsi que le contrôle d'accès se vide
de son sens : non par une faille, mais par une commodité accordée un jour d'urgence. »*

## EPIC-050 : La portée est publiée, et elle fait foi chez les consommateurs · 13 pts

**Autonome :** non — son livrable central engage des services tiers. **Amont :** EPIC-049.

> ⚡ **C'est l'épic qui porte AD-5 et AD-6, les deux arbitrages PO du 2026-08-15.**

- Publication de **`reseau.portee.changed`** en **état absolu** (jamais un delta), keyé
  `(orgId, userId)`, par **outbox transactionnelle**, rejouable et idempotent.
- ⛔ **La portée ne voyage PAS dans le jeton.** `FR-R28b` est remplacée : sa prémisse était fausse
  (`perms[]` est **vide** pour tout utilisateur de tenant, D15) et elle contredisait la **règle d'or**
  de l'écosystème. ⇒ **`auth-service` n'appelle jamais ce service** — sans quoi `reseau-service`
  indisponible signifierait *plus personne ne se connecte*, y compris les cabinets expert-comptable.
- **Fail-closed sans exception** : une portée absente, vide ou non résolue rend **zéro
  enregistrement**. Un `undefined` qui traverse un filtre en le neutralisant est le mode de défaillance
  exact que cet épic interdit.
- **Suite de tests de conformité versionnée**, publiée par ce module, avec son jeu de cas : portée
  absente · vide · totale explicite · héritée · restreinte · **révoquée en vol**.
- **Registre des consommateurs conformes** (service, version de suite, date du dernier passage).
  `SM-3` se mesure **sur ce registre**, jamais sur une déclaration.
- Le module **ne filtre jamais** les données d'un autre (`FR-R28`, `NFR-2`, AD-9) : il ne doit pas
  devenir un point de passage obligé de toutes les lectures du programme.

⚠️ **Faiblesse connue et acceptée** *(arbitrage PO — l'alternative, une bibliothèque de filtre
obligatoire, a été écartée)* : **un service qui n'exécute pas la suite passe entre les mailles**, et
son oubli est **silencieux**. Le registre est la mitigation : un consommateur absent y est un **écart
ouvert**, pas une absence d'information.

**Critère de sortie (`NFR-1`, `SM-1`) :** un utilisateur sans portée déclarée obtient **zéro**
enregistrement **sur chaque service consommateur**. Le test fait partie de la définition de terminé —
et il s'exécute **chez le consommateur**, pas ici.

## EPIC-051 : Rattachement lieux ↔ zones et résolution · 13 pts

**Autonome :** oui. **Amont :** EPIC-047 *(obligatoire — voir contrainte d'ordre)*, EPIC-045.

- Rattachement **plusieurs à plusieurs** : un lieu dessert plusieurs zones, une zone est servie par
  plusieurs lieux.
- Un rattachement porte un **rôle** — desserte principale ou de secours. Le module Stock suggère déjà
  des transferts entre entrepôts : **savoir lequel est le secours de qui rend ces suggestions justes**.
- Les lieux détenus ailleurs (entrepôt, magasin, point de vente) sont référencés **par identifiant** :
  ce module **ne détient ni ne duplique** ces objets.
- **Résolution à deux chemins et deux fiabilités** : avec emprise géographique, elle est **géométrique
  et certaine** ; sans emprise — le cas courant au v1 — elle se fait par **correspondance de localité
  déclarée**, avec un taux d'échec réel.
- ⛔ Une adresse inconnue du référentiel rend **« non résolu »**. **Jamais une zone approchante** — une
  zone approchante est une donnée fausse qui ne se signale nulle part.
- **Le chemin utilisé est restitué avec la réponse** : le consommateur doit pouvoir distinguer une
  certitude géométrique d'une correspondance de libellé, car les deux n'engagent pas au même niveau.

**Ce que cet épic rend possible :** les références opaques de Catalogue, Stock et PDV deviennent
**résolubles**. Ce module les rend résolubles, **il ne les leur impose pas**.

## EPIC-052 : Couverture, zones blanches et fournisseur de candidats · 8 pts

**Autonome :** oui. **Amont :** EPIC-051.

- La **couverture** d'une zone est calculée à partir de **ce que les autres modules y rattachent**.
  Le module **compte**, il **ne juge pas** de la qualité de la couverture.
- Une **zone blanche** est une zone déclarée **sans aucun rattachement actif**. Listable et
  cartographiable.
- ⚠️ **Le module ne détecte PAS les territoires non déclarés.** Une zone qui n'existe pas dans le
  système n'est pas une zone blanche — elle est **invisible**. Identifier des territoires à créer
  relève de Conquête (#16), sur données externes. **L'écrire empêche de croire la carte exhaustive.**
- **Fournisseur de candidats** pour le moteur de règles (`FR-IA03b`) : zones blanches, nœuds sans
  responsable, agences fermées avec des rattachements actifs. Il expose des **faits**, jamais un
  jugement ni une action.

*Contre-métrique à instrumenter ici :* **CM-1** — les zones créées et restées vides. Une hausse
signale un découpage plus fin que la réalité de terrain, qui alourdit tout et ne sert rien.

## EPIC-053 : Administration, import et journal d'audit **lisible** · 8 pts

**Autonome :** oui. **Amont :** EPIC-049 *(pour le droit d'attribuer une portée)*.

- **Droits distincts** : consulter le réseau · créer ou modifier un nœud · redécouper · affecter une
  personne · **attribuer une portée d'accès**. Le dernier est le plus sensible du module.
- **Import du réseau par fichier**, avec **compte rendu AVANT persistance**. **Tout ou rien** — un
  import partiel laisse un arbre à moitié faux que personne ne sait reprendre.
- **Publication des événements** de cycle de vie : nœud créé, déplacé, fermé, redécoupé, responsable
  changé.
- **Journal d'audit append-only** — hiérarchie, rattachements, portées, redécoupages — protégé par le
  **rôle serveur**, pas par la discipline du code applicatif.

⚠️ **LA ROUTE DE LECTURE EST LIVRÉE PAR CETTE MÊME STORY, AVEC SON CONSOMMATEUR NOMMÉ.** Ce programme
a payé **trois fois** le contraire : `admin_audit_logs` écrit sans lecture (STORY-144 → STORY-294),
`profils_societe_audit` idem (STORY-079 → STORY-360), et le journal de dossier. **Une écriture sans
lecture ne se signale nulle part.**
⚠️ L'auteur est rendu **par son identité**, jamais un `userId` brut : la console ne sait pas le
résoudre (leçon STORY-294).

---

## Questions ouvertes à trancher, et quand

| # | Question | À trancher avant |
| --- | --- | --- |
| **Q3** | Une personne peut-elle être affectée à des nœuds de **branches différentes** ? *(avis PRD : oui — superviseur itinérant)* | **EPIC-048** |
| **Q4** | Contour géographique nécessaire au v1, ou liste de localités suffit-elle ? *(avis PRD : liste au v1)* | **EPIC-045** *(l'emprise est facultative, donc non bloquant — mais le trancher évite de livrer deux fois)* |
| **Q1** | Une agence peut-elle aussi être un **point de stock** ? | Module **Caisse & guichet (#15)** — hors de ce découpage |

## Ce qui n'est PAS du travail sur ce service

- **Les consommateurs qui appliquent la portée.** EPIC-050 livre la suite de conformité et le
  registre ; **exécuter la suite est du travail chez chaque consommateur**. Aucun d'eux n'existe
  aujourd'hui — c'est ce qui rend `NFR-1` structurellement fragile, et c'est écrit pour que personne
  ne le découvre plus tard.
- **Le frontend.** Aucune surface `FE-*` / `DI-*` n'est décrite ici.
- **La caisse, le stock, les points de vente, les objectifs, les tournées, les ratios BCEAO** — six
  modules distincts, bornes posées au §4.2 du PRD et rappelées dans EPIC-045.
