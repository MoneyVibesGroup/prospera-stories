# Plan à deux développeurs : 8 semaines, 3 projets, des modules installables

> **Date :** 2026-10-24, **v3 du 2026-11-09** · **Statut :** démarré le 2026-11-09 ; D1, D2, D3 tranchées
> **Période :** du lundi 9 novembre 2026 au vendredi 15 janvier 2027, soit 8 semaines de travail
> (pause des fêtes du 21/12 au 01/01)
>
> **v3, le 2026-11-09 :**
> ① le PO tranche **D1 (une seule app `prospera-app`), D2 (dépendances dures et optionnelles) et D3
> (profil `docker compose` par module dans les 8 semaines)** : §8 ;
> ② le plan démarre avec **2 semaines de retard** sur la v2 : tout le calendrier est décalé, et les
> semaines 7 et 8 passent **après les fêtes** pour ne pas jalonner un 25/12 ni un 01/01 ;
> ③ **Dev B est le titulaire actuel du dépôt** (cadrage des 3 projets) ;
> ④ les plages d'identifiants sont **inscrites dans `sprint-status.yaml` › `reserved_ranges`**, recalculées
> sur les 33 branches distantes : les plafonds avaient bougé (FE-111, AP-37), et le préfixe `PA-` était
> déjà pris par les décisions de la spine paiement (PA-1 → PA-8) ⇒ la coque prend **`PRA-`** (§3).
> **Projets :** Prospera Microfinance, Prospera Distributeur, Prospera Assurance, et le **CRM interne Money
> Vibes** (la console d'administration)
> **Équipe :** 2 développeurs, chacun assisté par l'IA (BMAD)
>
> **v2, après retour du PO :**
> ① le principe directeur devient **le module installable, façon Odoo** (§1) ;
> ② les front-ends de démo ne sont **pas branchés** : ils seront **refaits** dans une coque unique ;
> ③ l'app mobile MoneyVibes (`Tontine_app`) sort du plan, et « MoneyVibes » désigne désormais **la console
> d'administration, qui devient le CRM interne** ;
> ④ **Dev B cadre d'abord les 3 projets en entier** (PRD, architecture, épics), pendant que **Dev A code
> tout de suite** ce qui est déjà cadré.

---

## 0. En une page

| | **Dev A : code, dès lundi** | **Dev B : cadre, puis code** |
|---|---|---|
| **Semaines 1 à 4** | `reseau-service` (commun aux 3 projets), la **coque front**, `pdv-service` bloc 1 | **Cadrage complet des 3 projets** : le contrat de module, puis ≈ 25 modules en PRD, spine et épics, validés chaque vendredi par le PO |
| **Semaines 5 et 6** | `pdv-service` bloc 2, `catalogue-produits-service` | **Le moteur d'installation** (dépendances, droits de tenant), puis le **CRM interne** |
| **Semaines 7 et 8 : on combine** | `stock-service`, et la démo « installer le pack distributeur chez un client vierge » | Le noyau **gestion des sinistres**, puis le noyau **GED** de l'assurance |
| **Profil conseillé** | celui qui **arrive** : ses specs sont écrites, il n'a aucun arbitrage à rendre | celui qui **connaît le dépôt et le PO** : le cadrage demande les deux. ✅ **Pris par le titulaire du dépôt le 2026-11-09** |

**Le 15 janvier 2027**, on ne livre pas les 3 projets finis. On livre :
1. la **plateforme de modules** qui marche (installer un pack chez un client en une action) ;
2. le distributeur en **4 modules installés** ;
3. le **noyau assurance** ;
4. le **CRM interne en service** ;
5. **les 3 projets cadrés et chiffrés en entier**, ce qui donne une **date de fin calculée**, et non
   estimée (§6).

C'est le prix du cadrage complet demandé à Dev B : 4 semaines de code en moins chez lui. En échange, plus
personne ne code sans plan.

---

## 1. Le principe : un service est un module installable, façon Odoo

### 1.1 Oui, c'est le principe d'Odoo, et la plateforme en a déjà la moitié

| Odoo | Prospera, aujourd'hui | État |
|---|---|---|
| La liste des **Apps** | `platform-catalog-service` : registre des `Module`, avec un `code` unique et des versions | ✅ existe |
| `__manifest__.py` : version, `depends`, données | `ModuleVersion`, et les `familles` de référentiels que le module sait consommer | ⚠️ **aucun `depends`** : le catalogue ne connaît aucune dépendance entre modules |
| Les modules de **localisation** (`l10n_tg`…) | Les **référentiels versionnés** et packagés (`syscohada-revise@2.3`, `sfd-bceao@2.0`, `cima-assurances@7.0`), avec leur checksum | ✅ existe, et c'est plus strict qu'Odoo |
| **Installer** un module pour un client | L'**entitlement** `(organisation × module)`, le topic `entitlement.changed` et la **gate** dans chaque service | ✅ existe |
| Les **bundles** (une base Odoo « CRM + Ventes ») | Les **packs** de `packs.seed-data.ts` : `distributeur`, `imf-sfd`, `assurance-cima`, `cabinet` | ✅ **corrigé depuis** : `pdv`, `stock`, `catalogue`, `commande` et `facturation` sont au seed du catalogue (mesuré le 2026-11-09). ⚠️ `reseau` n'y est **pas** encore |
| Les **droits** fournis par un module | Le catalogue des permissions | ✅ **les droits de tenant existent** (STORY-166 et 167 fusionnées : `perms[]` rempli pour un membre, rôles composés, surcharge DELTA). ⚠️ Le catalogue des droits reste un `enum` fermé dans `auth-service` (13 codes) ; STORY-365 est à requalifier (`CONTRAT-DE-MODULE-2026-11-09.md` C7) |
| Le **client web unique**, dont le menu dépend des modules installés | Aujourd'hui une app par vertical, avec des menus codés en dur | ⛔ **à construire** : c'est la coque (§1.4) |

### 1.2 Les trois différences avec Odoo, à connaître avant de vendre la ressemblance

1. **Odoo, c'est un seul processus et une seule base ; un module y étend le modèle d'un autre (`_inherit`).**
   Chez nous, chaque module a ses données et **personne n'écrit dans les données d'un autre**. On ne
   modifie pas le PDV depuis le stock : on s'abonne à ses événements et on lit ses read-models. C'est plus
   robuste (un module en panne n'emporte pas les autres), mais **une extension se prévoit dans un contrat**
   au lieu de se greffer après coup.
2. **Odoo installe sur la base d'un client.** Chez nous, on **active** un module pour une organisation sur
   une plateforme partagée. Pour une installation **chez le client** (l'offre assurance promet
   « l'hébergement dans vos locaux »), il faut en plus **empaqueter un pack**, sous forme d'un profil
   `docker compose` par module. À construire (§1.3, point 10).
3. **Odoo se personnalise souvent par du code client.** Chez nous, c'est d'abord **par des données** :
   référentiels, paramètres et règles versionnées. Le patron existe déjà : la grammaire de règles fermée de
   `pdv-service` (AD-8), où *« chaque distributeur a sa logique » ne veut pas dire « chaque distributeur a
   son code »*. Un module propre à un client reste possible, mais c'est **un module du catalogue comme un
   autre**, avec ses dépendances déclarées.

### 1.3 Le contrat de module : ce que chaque service doit tenir pour être « installable »

C'est la **définition de « fini »** de tout module du programme. Elle est rédigée par Dev B en semaine 1,
validée par le PO le vendredi 13/11, et **chaque PRD écrit ensuite la cite**.

| # | Le module… | Ce qui le prouve |
|:--:|---|---|
| 1 | a un **manifeste** au catalogue : code, version, `depends` (dépendances dures), `enrichi_par` (optionnelles), familles de référentiels, droits fournis, événements publiés et consommés | le catalogue **refuse** d'installer un module dont une dépendance dure manque, avec un code nommé |
| 2 | porte son **socle** : entitlement, gate, cloisonnement par organisation (et par dossier ou exercice si le métier l'exige) | sans entitlement, la réponse est un 403 nommé, jamais une donnée |
| 3 | **possède ses données**, et lui seul les écrit | la garde de câblage ne voit aucune collection d'un autre module |
| 4 | **fonctionne seul** : une dépendance optionnelle absente donne un **emplacement déclaré vide**, jamais une erreur, jamais un zéro | un test avec chaque `enrichi_par` désinstallé |
| 5 | **parle par contrats nommés** : un topic Kafka versionné ou un endpoint, jamais la base d'un autre | la suite de conformité du consommateur |
| 6 | se **paramètre par données** : référentiels et règles versionnées, pas de branche `if (client === …)` | une garde de balayage |
| 7 | **déclare ses droits de tenant**, que l'administrateur du client attribue lui-même | ils apparaissent dans la console du client sans déploiement |
| 8 | livre son **module d'écran** dans la coque, visible seulement si le module est installé **et** le droit accordé | le menu d'une organisation sans le module ne le montre pas |
| 9 | s'**installe et se désinstalle** sans perte : activer est idempotent, désactiver ne supprime rien, réactiver retrouve tout | test aller-retour |
| 10 | **démarre seul** avec le socle minimal (auth, catalogue, Kafka, Mongo) via son profil `docker compose` | `docker compose --profile <module> up` à chaque gate |

⚡ **Un module n'est pas forcément un microservice.** Le **module** est l'unité de **vente et
d'installation** (un code au catalogue) ; le **service** est l'unité de **déploiement**. Plusieurs modules
peuvent vivre dans un même service quand ils partagent le même agrégat. Par exemple, `credit`, `collecte` et
`caisse` partagent le compte du membre et vivent dans `microfinance-service`, chacun derrière **sa propre
gate**. On évite ainsi de repayer ≈ 13 pts de socle à chaque fois, ce que les PRD ont oublié quatre fois de
suite.

### 1.4 Les front-ends : une coque, des modules d'écran

Les trois apps de `prospera-font-end` ont servi à la démonstration. **Elles ne seront pas branchées.**
Elles deviennent la **référence** du nouveau front :
- leur **vocabulaire** et leurs **parcours** (`SPEC_METIER.md`, la démo SIN-2026-9002) entrent dans les PRD ;
- leurs **règles** (`reappro-engine`, `picking-engine`, barèmes et seuils de délégation) deviennent des
  **jeux d'essai** des stories backend : leurs sorties actuelles sont les valeurs attendues. La règle se
  **déplace** vers le service, elle n'est pas réécrite au jugé.

**La cible, comme le client web d'Odoo, est une coque unique `prospera-app`** :
- l'authentification passe par `auth-service`, derrière un BFF (patron de l'app expert-comptable) ;
- le **menu est construit** à partir des modules installés pour l'organisation et des droits de
  l'utilisateur ;
- chaque module livre son dossier `src/modules/<code>/` (routes, écrans, client d'API typé) ;
- la vertical n'est **qu'une configuration** : un pack, une marque, un tableau de bord d'accueil.

L'app expert-comptable et la console interne restent des apps à part pour l'instant.

### 1.5 Le CRM interne Money Vibes : notre propre client

La console `frontend-admin-panel` (organisations, catalogue, provisioning, accès) **devient le CRM de
l'entreprise**. Dans la logique des modules, le CRM est le **module n°8 « Support / service client »**,
**installé pour l'organisation Money Vibes elle-même**. On l'utilise avant de le vendre, et le jour où un
distributeur ou une IMF le demande, on l'installe chez eux.

⛔ **Ses données vivent dans un service (`support-crm-service`), pas dans le BFF `admin-panel`.** L'AD-2 le
dit : le BFF *« ne possède aucune donnée »*. Le CRM **lit** ce qui existe déjà : organisations,
entitlements (« quels modules ce client a-t-il installés »), abonnements de `paiement-service`. Il
**possède** contacts, interactions, opportunités et tickets.

---

## 2. Ce qui est déjà fait, et sur quoi on part

| Déjà livré, réutilisé tel quel | Existe côté **comptes et états** seulement | Cadré, pas codé | **Rien** |
|---|---|---|---|
| `auth-service`, `platform-catalog-service`, `kyc-service`, `document-service` (OCR), `dossier-service`, `bilan-service`, `balance-service`, `paiement-service` (PI-SPI), `notification-service` | `microfinance-service` (membres, dépôts, crédits, prudentiel) · `assurance-service` (contrats, sinistres, provisions, réassurance) | `reseau`, `pdv`, `catalogue-produits`, `stock` : **522 pts**, PRD, spine et épics prêts | 25 modules, dont commande, facturation, caisse, collecte, crédit cycle, gestion des sinistres, GED, CRM… (§4) |

**Vitesse mesurée** à 1 développeur + IA : ≈ 2 260 pts `done` depuis juillet, 157 identifiants de story
commités en août et 277 en septembre. **Hypothèse du plan : 80 à 100 pts par semaine et par développeur**
en construction. **Côté cadrage**, c'est mesuré aussi : 7 PRD le 2026-08-02, et 4 spines avec leurs
découpages le 2026-08-15. Le goulot n'est pas l'écriture, **c'est la validation du PO**.

---

## 3. La façon de coder (rappel) et les règles à deux

**La chaîne.** PRD → spine (`AD-n`) → épics → fiche de story → code → revue → `done`. Pas de code sans
fiche. **Dev B écrit les PRD, les spines et les épics ; la fiche de story est écrite par celui qui va la
coder**, juste avant (`bmad-create-story`), parce que c'est au contact du code qu'elle se juste.

**Le gabarit d'un service.** NestJS 11, Mongoose 8, Kafka avec outbox, relying party RS256/JWKS,
`nestjs-cls`, pino, terminus, swagger ; `src/modules/<module>`, `read-models/`, `kafka/`,
`app.module.invariant.spec.ts`. **Plus, désormais, le contrat de module (§1.3).**

**Les invariants.** Audit en ajout seul, idempotence par clef primaire, un read-model n'a jamais autorité,
toute dépendance nomme son contrat. Les gardes de balayage cherchent des formes exécutables, jamais des mots.
Un double de collection se comporte comme Mongo.

**Git.** Une story = une branche = une PR ; `MNV-NNN` depuis `origin/dev`, `docs-NNN` dans
`prospera-stories`, « Rebase and merge » uniquement. On pousse avant d'ouvrir la story suivante. Jamais de
`stash` + `checkout` sur un checkout partagé.

**Docker à la demande**, à chaque Integration Gate, par **profil de module**.

**Ce qui change parce qu'on est deux :**

1. **Des plages d'identifiants réservées le jour 1** dans `reserved_ranges`. ✅ **Inscrites le
   2026-11-09.** Plafonds relevés ce jour-là sur les 33 branches distantes de `prospera-stories` (et
   aucune branche `MNV-73x` ou au-delà dans les dépôts de l'app) : **STORY-729, EPIC-141, FE-111, AP-37,
   MB-04**. EPIC-142 n'est cité que comme « premier libre » dans une fiche de branches périmées
   (MNV-239/240/297) : ce n'est pas une réservation.

   | | Dev A | Dev B |
   |---|---|---|
   | Stories backend | STORY-730 → 899 | STORY-900 → 1199 *(le cadrage en consomme beaucoup)* |
   | Épics | *(réseau, PDV, catalogue et stock ont déjà les leurs : EPIC-044 → 094)* | EPIC-142 → 299 |
   | Front de la coque (préfixe **`PRA-`** ; `PA-` est pris par la spine paiement) | PRA-01 → 99 | PRA-100 → 199 |
   | Console / CRM interne | — | AP-38 → 99 *(AP-30 → 37 existent déjà)* |
   | Mobile terrain | — | MB-05 → 49 (cadrage) |

   ⚠️ FE-109 → 111 existent déjà : l'app expert-comptable reprend à **FE-112**, hors de ces plages.

2. **Un service = un propriétaire.** L'autre ouvre un ticket dans `tickets/`.
3. **Les contrats entre les deux pistes, avec leur date :**

   | Contrat | De → à | Pour le |
   |---|---|---|
   | Le **contrat de module** (§1.3) | B → A | ven. 13/11, **avant** EPIC-045 |
   | La **spine de la coque** `prospera-app` | B → A | ven. 20/11, **avant** que A construise la coque |
   | La **portée réseau** publiée (EPIC-050) | A → B (agences de l'IMF et de l'assurance) | ven. 27/11 |
   | Les **droits de tenant** (STORY-365) | B → A | ven. 11/12, **avant** EPIC-068 (droits sur les grilles de prix) |

   ⚠️ STORY-365 est toujours `not_started` (fiche du 2026-08-15), mais STORY-166 (catalogue des droits
   de TENANT, fusionnée) et STORY-167 (surcharge DELTA, rôles composés, en revue) ont avancé sur le même
   terrain depuis : **Dev B relit 365 contre 166/167 au lot 1**, avant de la chiffrer.

4. **Le tracker est partagé** : chacun ses lignes, par PR, et `yaml.safe_load` après chaque fusion.
5. **Revue croisée quotidienne** de 30 min. **Dev A relit les PRD de Dev B** : c'est le premier lecteur, et
   le plus utile, puisqu'il est celui qui codera dessus.
6. **Point de 15 min le matin.** Le vendredi, une démo sur le vrai backend, et la **validation par le PO du
   cadrage de la semaine**.

---

## 4. Le cadrage de Dev B : tous les modules des 3 projets

Dans l'ordre où ils seront codés, pour que Dev A ne manque jamais de specs et que chaque PRD puisse citer
ceux qui le précèdent. Chaque module livre **PRD, spine et épics chiffrés**, puis passe au contrôle
`bmad-check-implementation-readiness`.

| Sem. | Lot | Modules (n° de la séquence v2) | Validation PO |
|:--:|---|---|---|
| **1** | **Les règles du jeu** | ① **Contrat de module** (doctrine, §1.3) · ② **n°26 Moteur d'installation** : manifeste, `depends`, installer et désinstaller un pack, empaquetage `docker compose` par module · ③ **Spine de la coque `prospera-app`** | ven. 13/11 |
| **2** | **Distributeur** | n°11 Commande · n°17 Facturation, proforma, e-facture · n°13 Approvisionnement et fournisseurs · n°12 Opérations entrepôt · n°9 Commercial terrain, **avec l'app mobile `prospera-terrain`** (React Native ou Flutter, tranché ici) · n°16 Conquête et objectifs | ven. 20/11 |
| **3** | **Microfinance** | n°15 Caisse, guichet, trésorerie · n°19 Crédit : cycle, comité, BIC · n°20 Collecte · n°22 Épargne et dépôts (opérations) · n°23 Risque et PAR (opérations) · n°24 Relance et recouvrement · n°27 Conformité BCEAO et LCB/FT | ven. 27/11 |
| **4** | **Assurance, CRM et transverses** | **Gestion des sinistres** (le cycle DECLARE → CLOTURE de `SPEC_METIER.md`) · **GED** (extension de `document-service` : lots, indexation, pièces, archivage) · **Expertises et intervenants** (experts, médecins, portail expert) · **Production et polices** (opérationnel) · **n°8 Support / CRM** (CRM interne) · n°18 Équipe · n°21 Finance (transactions) · n°10 Marketing · n°25 Contrôle de gestion · n°28 Automatisations · n°29 Dashboard | ven. 04/12 |

**Livrable du vendredi 04/12 : le chiffrage consolidé**, c'est-à-dire la somme des points des épics des 3
projets, divisée par la vitesse **mesurée** des semaines 1 à 4. **C'est la date de fin des 3 projets**, et
c'est la seule qu'on pourra défendre devant un client.

⚠️ **Hors cadrage :** le palier 2 de l'assurance (provisions techniques, EPIC-131). Il exige un actuaire au
cadrage, `epics-assurance` l'écrit déjà.

---

## 5. Le calendrier, semaine par semaine

### Phase 1 : A code, B cadre (semaines 1 à 4)

| Sem. | Dates | **Dev A** | **Dev B** | Jalon du vendredi |
|:--:|---|---|---|---|
| **1** | 09/11 → 13/11 | Prise en main (lancer `paiement-service`, lire §1 et §3) ; **enregistrer au catalogue** `reseau` et les 6 modules du pack distributeur (débloque EPIC-065, 075 et 085, sans porteur depuis août) ; `reseau-service` **EPIC-044** (socle) | Lot 1 : **contrat de module**, **moteur d'installation**, **spine de la coque** | le PO valide le contrat de module : il s'applique à tout ce qui suit |
| **2** | 16/11 → 20/11 | réseau **EPIC-045, 046, 048** (zones et agences, arbre, affectations) | Lot 2 : **distributeur** | une agence et une zone réelles ; le PO valide le distributeur |
| **3** | 23/11 → 27/11 | réseau **EPIC-049, 050** (portée publiée : **contrat A→B**), **047, 051** ; **squelette de la coque** (BFF, menu construit depuis les entitlements) | Lot 3 : **microfinance** | ⏱ recalage de la vitesse de A (§7) ; le PO valide l'IMF |
| **4** | 30/11 → 04/12 | réseau **EPIC-052, 053** ✅ et son **module d'écran** dans la coque ; `pdv-service` **bloc 1** (EPIC-085, 086, 087) | Lot 4 : **assurance, CRM, transverses** ; **chiffrage consolidé** | 🎯 **la date de fin calculée des 3 projets** |

### Phase 2 : les deux codent, puis on combine (semaines 5 à 8)

| Sem. | Dates | **Dev A** | **Dev B** | Jalon du vendredi |
|:--:|---|---|---|---|
| **5** | 07/12 → 11/12 | `pdv-service` **bloc 2** (EPIC-091, 092, 093 : vue 360°, carte) et son écran : **le CRM du distributeur** | **Moteur d'installation** : STORY-365 (droits de tenant), `depends` au catalogue, installation d'un pack | une organisation reçoit un pack, et ses droits apparaissent sans déploiement |
| **6** | 14/12 → 18/12 | `catalogue-produits-service` **blocs 1 et 2** (EPIC-065 → 070 : l'article, l'unité, le prix résolu) et son écran | **CRM interne** : `support-crm-service` (contacts, interactions, tickets) et ses écrans dans la console ; il lit les organisations, les modules installés et les abonnements | l'équipe Money Vibes suit ses clients dans son propre CRM |
| — | 21/12 → 01/01 | ⏸ **Pause des fêtes** (25/12 et 01/01 fériés) : aucun jalon | | |
| **7** | 04/01 → 08/01 | `stock-service` **blocs 1 et 2** (EPIC-075 → 078 : le lieu, le journal) et son écran | **Gestion des sinistres**, noyau : déclaration, pièces obligatoires, corbeille par volet, évaluation, seuil de délégation, règlement | un sinistre traverse le cycle sans mock |
| **8** | 11/01 → 15/01 | 🎯 **Démo d'installation** : le pack distributeur installé en une action sur une organisation vierge ; les 4 modules apparaissent dans la coque ; on désinstalle et on réinstalle sans perte | **GED**, noyau : lot de numérisation, indexation, recherche d'un dossier sinistre | **Ensemble :** recette `docker compose` **par profil** de module, gates croisées, démo finale |

---

## 6. Ce que « fini » veut dire le 15 janvier 2027

| Livrable | La preuve, jouée sur le vrai backend |
|---|---|
| **La plateforme de modules** | Un pack s'installe en une action. Une dépendance manquante est refusée avec son nom. Le menu de la coque suit les modules installés. Désinstaller ne perd rien |
| **Distributeur** | Réseau, CRM des points de vente, catalogue et prix, stock lisible : quatre modules **installés**, pas déployés à la main |
| **Assurance** | Un sinistre est déclaré, ses pièces sont numérisées, il est traité et réglé, puis **retrouvé en une recherche** |
| **CRM interne** | En service pour l'équipe Money Vibes |
| **Microfinance** | Le backend comptes et états est déjà livré. **Les 7 modules opérationnels sont cadrés et chiffrés** ; leur développement démarre le 18/01/2027 |
| **Les 3 projets** | Entièrement cadrés, avec une **date de fin calculée** |

⛔ La production PI-SPI reste fermée tant que le point juridique (STORY-668) n'est pas levé. Les démos se
font en bac à sable.

---

## 7. Recalage et ordre de sacrifice

**Le vendredi 27/11**, on compte les points réellement passés en `done` chez A.

| Vitesse de A | Conséquence |
|---|---|
| ≥ 80 pts/semaine | le plan tient |
| 60 à 80 | le bloc 2 de `catalogue` passe après le 15/01 |
| < 60 | le bloc 2 de `stock` aussi ; la démo d'installation se fait avec 3 modules |

| Si le cadrage de B déborde | Conséquence |
|---|---|
| le lot 4 n'est pas validé le 04/12 | les transverses (n°10, 18, 21, 25, 28, 29) passent en janvier ; **l'assurance et le CRM restent** |

**On ne sacrifie jamais :**
- le **contrat de module** : sans lui, chaque service reste un service et ne s'installe pas ;
- le **moteur d'installation** ;
- une **Integration Gate** : un module non branché coûte autant qu'un module absent, et il coûte en plus
  l'illusion qu'il est disponible.

---

## 8. Décisions à rendre par le PO

| # | Décision | Recommandation | Quand |
|---|---|---|---|
| D1 | **Une coque unique** `prospera-app`, ou une app par vertical | ✅ **TRANCHÉE le 2026-11-09 : la coque unique.** Une seule app déployée ; l'organisation de l'utilisateur décide du menu (modules installés), des données (cloisonnement) et de l'habillage (configuration) | ✅ |
| D2 | Le **niveau des dépendances** : une dépendance dure bloque l'installation, une optionnelle donne un emplacement vide | ✅ **TRANCHÉE le 2026-11-09 : les deux niveaux**, déclarés au manifeste (`depends`, `enrichi_par`) | ✅ |
| D3 | L'**installation chez le client** (sur site) : dans les 8 semaines ou après | ✅ **TRANCHÉE le 2026-11-09 : le profil `docker compose` par module dans les 8 semaines** (il sert aussi à la recette) ; le packaging client complet après | ✅ |
| D4 | React Native ou Flutter pour `prospera-terrain` | à trancher au lot 2, avec le module n°9 | sem. 2 |
| D5 | L'ancien monolithe `prospera-backend` (Prisma) | **Le geler**, et le garder comme source de règles à reprendre dans les modules IMF | sem. 3 |
| D6 | Le palier 2 de l'assurance (provisions techniques) | **Hors plan** tant qu'aucun actuaire n'est mobilisé | — |

---

## 9. Les risques, nommés

| Risque | Effet | Parade |
|---|---|---|
| Le cadrage de 25 modules en 4 semaines tourne à la copie de gabarit | des PRD qui ne tranchent rien, et un développement qui bute | **validation du PO chaque vendredi**, contrôle de préparation, et **Dev A relit chaque PRD** |
| Le contrat de module change après le démarrage de A | `reseau-service` est à reprendre | il est validé le 13/11, **avant** EPIC-045 ; EPIC-044 (le socle) est commun à toutes les versions |
| Le moteur d'installation glisse en semaine 6 | catalogue et stock n'ont pas de droits de tenant | STORY-365 est la **première** story de code de B, en semaine 5 |
| Le second développeur bute sur la rigueur des gardes | sa vitesse s'effondre en semaines 1 et 2 | sa piste a des specs prêtes ; revue quotidienne ; recalage le 27/11 |
| Le CRM interne se construit dans le BFF « parce que c'est plus rapide » | il ne pourra jamais être installé chez un client | AD-2 : le BFF ne possède aucune donnée. Le CRM est le module n°8, dans son service |
| Collision d'identifiants ou de tracker | deux fiches pour un même numéro, un YAML illisible | plages réservées le jour 1, une PR par mise à jour du tracker |
| Les services ne démarrent pas ensemble | découverte en cascade le jour de la démo finale | `docker compose --profile` à **chaque** gate |
