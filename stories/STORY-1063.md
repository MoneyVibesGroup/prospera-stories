# STORY-1063 : les référentiels du distributeur côté réseau — le gabarit à zones à plat, les zones et les lieux rattachés du jeu « Grossiste du Golfe », par les routes C13 de `reseau`

Status: in-progress

**Épic :** EPIC-227 (les référentiels : réseau, points de vente, catalogue et stock, les écarts du distributeur), FR-180
· **Dépôts :** `reseau-service` (routes C13 du module, part du jeu, effacement) ; `prospera-plateforme`
(`jeux-demonstration/grossiste-golfe*/` : la part `reseau`, jeu 1.1.0), par `_wt-d-plateforme` · **Plage :** groupe D,
n° 4 du lot 4 (`PLAN-4-SESSIONS-LOT-4-2026-11-18.md` §4). **Dépend de :** rien (lot 2 : zones hiérarchiques 1033,
rattachements et résolution 1039, couverture 1040, import 1041 ; lot 3 : Reprise 1055 et son moteur des zones ; le jeu
et le socle C13 de 1058). **Suivante :** STORY-1064 🚚 (les comptes du bureau dans le jeu « Grossiste du Golfe »).

**Sources :** plan du lot 4 §4, ligne 4 (« zones à plat, points de vente rattachés ») ; passation du journal de D
(« Ce qui reste », (3) les remplaçantes d'EPIC-227 ; « Le jeu “Grossiste du Golfe” et les routes C13 » : « reste : la
part `reseau` (nœuds sous les identifiants du jeu) ») ; EPIC-227 (« fini quand » : « sur le jeu “Grossiste du Golfe”, la
reprise produit des zones sans nœud intermédiaire et Lomé Port et Kara apparaissent rattachés à une zone ») ; PRD
distributeur §7.1, **FR-180** (« le gabarit d'installation du distributeur crée une hiérarchie d'un seul niveau (zones)
et rattache chaque entrepôt à une zone » ; conséquences (1) à (3)), FR-183, FR-241 (le client comptoir n'entre pas dans
la couverture) ; manifeste `reseau` (M01 : `routesInstance.import` et `.effacement` déjà déclarées ; `enrichiPar: pdv,
stock` ; « Commerciaux = personnes » à l'effacement) ; spine `reseau` AD-2, AD-3, AD-4, AD-11, AD-12, AD-13, AD-14 ;
contrat de module C13 point 7 (`contrats-instance-v1`) ; fiches 1039, 1041, 1055 (D-1055-2 : le moteur des zones, seul
chemin d'une zone en nombre), 1058 (D-1058-4 : la règle des identifiants du jeu ; D-1058-8 → 12 : le socle C13).

## Le découpage : ce que cette story prend, et pourquoi

EPIC-227 tient quatre modules (`reseau`, `pdv`, `catalogue`, `stock`) ; `pdv`, `catalogue` et `stock` n'ont pas de
service. Ce que `reseau` peut porter seul, et qui fait tenir le « fini quand » de FR-180 **sur le jeu**, est une tranche :

1. **le gabarit d'installation du distributeur** : une hiérarchie d'**un** niveau, libellé « Zone » (vocabulaire en
   donnée, jamais « agence » ni « secteur ») — une **donnée** de la part du jeu, appliquée par la règle de
   `PUT /hierarchie/configuration` ; sous lui, toute zone sous une zone est refusée (`PROFONDEUR_MAX_ATTEINTE`), par la
   route comme par la Reprise ;
2. **les zones du jeu**, à plat, entrées par le **moteur des zones** (seul chemin d'une zone en nombre), **sous les
   identifiants du jeu** : ceux que `commande` et `terrain` portent déjà en `noeudId` depuis 1058 ;
3. **les lieux rattachés** : chaque point de vente et chaque point de stock (Lomé Port, Kara) rattaché à sa zone, en
   nombre, sous les identifiants que `commande` leur donne ; lisibles par la résolution et comptés par la couverture ;
4. **les routes C13 de `reseau`** (import, effacement), déjà déclarées au manifeste, qui portent la part `reseau` du
   jeu ; et la **part `reseau` du jeu** dans `prospera-plateforme` (jeu 1.1.0).

Restent hors de cette story (D-1063-12) : les commerciaux du jeu dans `reseau`, le consommateur de
`pdv.point-de-vente.changed@1`, les faits d'entrepôt de `stock`, le client comptoir de `pdv`, l'export et la santé C13,
l'écran du module.

## Où en est-on (pour une reprise après interruption)

- [x] Rituel : plan du lot 4, règles, journaux de A, B, C, D (aucune demande neuve à D ; l'information de B sur 976,
  D-976-7, est lue), épic, PRD §7.1, manifeste `reseau`, fiches 1039, 1041, 1055, 1058.
- [x] Code : `prospera-plateforme` `MNV-1063` (f884b0e, la part `reseau`, 1.1.0) ; `reseau-service` `MNV-1063`
  (7ffc020) ; tsc, lint des fichiers touchés, unitaires sous Node 25 ; mutations du générateur 6/6.
- [x] Verrou Docker pris à 22:10 (libre) : image `verification` depuis `git archive`, intégration sur MongoDB réel.
- [x] Preuves sous le verrou : Node 24 (unitaires, e2e, intégration, lint, tsc, build ; plateforme), mutations 12/12,
  `docker compose up` sain, pilote 11/11 et 2/2 ; PR de code ouvertes : reseau-service **#16**, prospera-plateforme
  **#36**.
- [ ] Annonce « ⚠ Contrats » fusionnée avant le code (cette PR).
- [ ] Preuves complètes (Node 24, mutations, `docker compose up`), PR fusionnées, étiquette `jeu-grossiste-golfe-v1.1`,
  PR de docs finale.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | **Le jeu 1.1.0 porte la part `reseau`, d'abord** : `hierarchie` (`profondeurMax: 1`, `libellesDeNiveaux: ["Zone"]`), `zone` (clé, nom, type, localités ; **aucun parent**), `rattachement` (chaque point de vente du jeu et chaque point de stock, `PRINCIPAL`, à la zone de `commande` ; le client comptoir **jamais**) ; les fichiers de `commande` et de `terrain` de 1.0.0 gardés à l'octet ; ni « agence » ni « secteur » dans la part ; `jeu:verifier` conforme pour les trois tailles | `node --test generer.test.mjs` ; empreintes figées ; mutations |
| AC-2 | **`POST /api/v1/instance/reseau/{org}/import`** sert `hierarchie`, `zone`, `rattachement` (`import-c13-demande@1` → `import-c13-reponse@1`), au moteur seul, limité à son organisation, en essai seulement ; ligne fermée (`ENREGISTREMENT_INVALIDE` avec le rang), zone absente (`REFERENCE_INCONNUE`) : rien n'est écrit ; même clef : `DEJA_IMPORTE` | MongoDB réel (HTTP, vraie chaîne de gardes) |
| AC-3 | **FR-180 (1)** : après la part, la hiérarchie a un niveau, libellé « Zone » ; les zones sont au niveau 1 sous les identifiants du jeu (`identifiantDuJeu(org, 'zone', clé)`), publiées par `reseau.noeud.created@1` ; une zone sous une zone est refusée `PROFONDEUR_MAX_ATTEINTE`, **par la route et par la Reprise** ; un réseau déjà plus profond refuse le gabarit (`PROFONDEUR_INSUFFISANTE`, rien n'est écrit) | MongoDB réel |
| AC-4 | **FR-180 (2)** : Lomé Port (et Kara dans la taille de la démo) et chaque point de vente sont rattachés à leur zone, avec la version de découpage, journalisés ; `GET /resolution?lieuType=ENTREPOT|POINT_DE_VENTE&lieuId=<identifiant de commande>` rend `RESOLU`, la zone du jeu ; la couverture ne montre aucune zone blanche ; le client comptoir reste `NON_RESOLU` | MongoDB réel |
| AC-5 | **Rejouer ne double rien** : sous d'autres clefs, mêmes zones (gardées, jamais recréées), mêmes rattachements actifs ; un lieu rattaché ailleurs voit l'ancien rattachement **terminé** (jamais effacé) et la résolution suit | MongoDB réel |
| AC-6 | **`POST /api/v1/instance/reseau/{org}/effacement`** (`FIN_ESSAI`) efface tout ce que `reseau` tient de l'organisation (zones, rattachements, commerciaux, portées, journal, découpages, Reprise, outbox de l'organisation, registre des imports) ; accusé au contrat ; rejoué : `DEJA_EFFACE` ; le témoin intact ; un invariant rougit sur une collection oubliée | MongoDB réel ; invariant |
| AC-7 | Node 24 (tsc, lint, build, unitaires, e2e, intégration) ; mutations rouges sur l'assertion ; `docker compose up` sain (module Nest changé, §1.5) ; rejoué sur l'image reconstruite depuis `origin/dev` | « Preuves » |

## Décisions retenues par défaut (contestables)

- **D-1063-1 — La tranche** : voir « Le découpage ». Le jeu est le premier client d'installation du distributeur : la
  part `reseau` y fait tenir FR-180 de bout en bout (gabarit, zones, lieux) sans attendre `pdv` ni `stock`.
- **D-1063-2 — Le gabarit est une donnée, pas un nom dans le code.** L'objet `hierarchie` de la part porte
  `{ profondeurMax: 1, libellesDeNiveaux: ["Zone"] }` ; `reseau` l'applique par la règle de `PUT
  /hierarchie/configuration` (`HierarchieService.configurerDansLaSession`, extraite pour servir les deux) : un réseau
  déjà plus profond le refuse (`PROFONDEUR_INSUFFISANTE`, rendu en `ENREGISTREMENT_INVALIDE` de la ligne : rien n'est
  écrit). Un vrai distributeur pose le même gabarit par la route (ou par le dossier d'installation, non servi). La
  profondeur configurable (FR-R12) reste : passer à 2 est un `PUT`.
- **D-1063-3 — Les zones du jeu ont l'identifiant du jeu.** Le moteur des zones (D-1055-2) reçoit un identifiant
  **imposé** (facultatif : `ZoneAEcrire.id`, `creerZoneDansLaSession({ id })`) = `identifiantDuJeu(org, 'zone', clé)` :
  celui que `commande_points_de_vente.noeudId` et les points de vente de `terrain` portent déjà (1058). La portée que
  `reseau` publie (`reseau.portee.changed@1`, nœuds résolus) couvre donc les points de vente du jeu chez `commande` sans
  aucune traduction. Les règles (code, profondeur) sont celles de l'import et de la Reprise ; les faits
  (`reseau.noeud.created@1`), le journal et la republication des portées aussi.
- **D-1063-4 — Une zone du jeu déjà là est gardée** (même identifiant) : nom, type et localités remis par le moteur
  (`modifier`), jamais recréée ; fermée : refusée (`NOEUD_FERME`). Un rejeu sous une autre clef ne crée donc rien.
- **D-1063-5 — Les rattachements en nombre** (`RattachementsService.rattacherEnNombreDansLaSession`) : chaque zone visée
  touchée une fois par lot (une fermeture concurrente entre en conflit), la version de découpage lue une fois (AD-4),
  une ligne de journal par rattachement créé ou terminé (AD-14, `ecrireEnNombre`, en ajout seul). Un rattachement actif
  identique (lieu, zone, rôle) est gardé ; un lieu qui a, ailleurs, un rattachement actif du même rôle (ou un autre rôle
  dans la même zone) le voit **terminé** avant le nouveau : la résolution d'un lieu reste univoque. La zone d'une ligne
  se vérifie **dans la transaction du lot** (`REFERENCE_INCONNUE`, rang et clef nommés) : l'identifiant d'un nœud est
  un ObjectId, que la vérification des références du socle C13 (chaînes) ne voit pas.
- **D-1063-6 — Les lieux du jeu** : `POINT_DE_VENTE` (identifiant `point-de-vente`) et `ENTREPOT` (identifiant
  `point-de-stock`), ceux de `commande` ; `MAGASIN` et `AGENCE` ne sont pas servis par le jeu. Chaque point de stock est
  rattaché à la zone de son client comptoir (le `comptoir` du générateur : Lomé Port → Lomé Centre ; Kara → Plateaux
  dans la taille de la démo). **Le client comptoir n'est pas rattaché** : il n'entre ni dans la couverture ni dans le
  pipeline (FR-241 (3)).
- **D-1063-7 — L'effacement de fin d'essai** efface tout ce que `reseau` tient de l'organisation : nœuds, zones,
  agences, rattachements, affectations, commerciaux (des personnes), portées, versions de découpage, configuration de la
  hiérarchie, compteurs de codes, journal, fiches et collections du kit de la Reprise, faits de l'organisation dans
  l'outbox, registre des imports. Exclus, avec leur raison : le registre des effacements, le registre de conformité
  (plateforme), le bail du relais, les projections tenues par d'autres (état publié, identité, KYC) et les faits
  traités. Un invariant rougit sur toute collection oubliée (constantes `COLLECTION_*` comprises, piège 1060-2). Le
  journal du réseau est en ajout seul ; seul l'effacement d'un **essai** l'efface. **Aucun retrait de portée n'est
  publié à l'effacement** : la fin de l'essai retire l'état publié du module, que la garde de chaque consommateur lit ;
  les copies des portées chez les consommateurs (`socle_portees_reseau`, exclues de leur plan « tenue par reseau »)
  restent sans effet ; leur sort est à trancher avec la fin d'essai de B (D-1063-12).
- **D-1063-8 — L'espace** : les routes C13 servent dans un espace d'essai seulement, lu dans `KAFKA_ESPACE` (la variable
  de l'espace servi depuis 1050), pas une variable de plus (`INSTANCE_ESPACE` est celle de `ventes` et `terrain`).
- **D-1063-9 — Le socle C13** est copié de `prospera-ventes-service` (`src/socle/instance/`, 1058) : même service, mêmes
  refus, même règle des identifiants (vecteur figé : `LOME-CENTRE` → `24815c8c22e0672387be1208`, comme dans `ventes`) ;
  les quatre schémas copiés à l'octet de `contrats-instance-v1` (`ORIGINE.json`, invariant de copie). **Seul écart** :
  `contrats-instance.ts` lit les erreurs d'Ajv 8 (`instancePath`), celui du service, au lieu d'Ajv 6. L'invariant des
  routes du module exige qu'un contrôleur `@RoutesDInstance('reseau')` ne serve que les routes de `routesInstance` et
  n'admette que `MOTEUR`.
- **D-1063-10 — Ce que les consommateurs peuvent lire, dès cette story :**
  - **`commande`** : ses points de vente (`commande_points_de_vente`, remplis par son import C13) portent en `noeudId`
    l'identifiant d'une **vraie zone** de `reseau` ; la portée de `reseau.portee.changed@1` (projetée dans
    `socle_portees_reseau`) les cadre donc, sans traduction ; la zone d'un point de vente se lit à l'écriture ou à la
    configuration par `GET /api/v1/resolution?lieuType=POINT_DE_VENTE&lieuId=<pointDeVenteId>` (`RESOLU`, chemin
    `RATTACHEMENT`, version de découpage ; jamais sur un chemin de lecture, AD-9) ;
  - **`stock`** (quand il existera) : la zone d'un point de stock par `lieuType=ENTREPOT&lieuId=<pointDeStockId>` ;
  - **tous** : `reseau.noeud.created@1` pour chaque zone du jeu.
  Aucun fait de rattachement n'est publié (le manifeste n'en déclare pas) : le vrai remplissage de
  `commande_points_de_vente` reste `pdv.point-de-vente.changed@1` (pas de service `pdv`), dont `reseau` consommera aussi
  la zone pour rattacher (manifeste, `consomme`).
- **D-1063-11 — Le jeu 1.1.0** (mineure : une part ajoutée, aucun fichier existant changé), étiquette
  `jeu-grossiste-golfe-v1.1` posée après la fusion. La part `reseau` est **la première** (le référentiel avant les
  modules qui le citent ; `pdv` dépend de `reseau`). Le catalogue de B monte le jeu à l'étiquette `v1` : rien ne change
  pour lui tant qu'il ne passe pas à `v1.1` ; ce jour-là, `INSTALLATION_SERVICES` doit nommer `reseau`
  (`reseau=http://reseau-service:3419`), sinon l'import s'arrête à la première part (`SERVICE_NON_CONFIGURE`) — demande
  à B (information).
- **D-1063-12 — Ce qui reste** (remplaçantes d'EPIC-227, côté `reseau`) : les commerciaux du jeu dans `reseau`
  (`commercial` : personnes à inviter, affectations ; aujourd'hui dans `terrain` seulement) ; le consommateur de
  `pdv.point-de-vente.changed@1` (rattachement par référence) quand `pdv` publiera ; les faits d'entrepôt et de magasin
  de `stock` (mineure du manifeste) ; l'export et la santé C13 (`routesInstance.export`, `.sante`) ; le sort des copies
  de portées d'un essai effacé chez les consommateurs ; l'écran du module (vocabulaire en donnée, FR-180 (3)) ; le
  client comptoir (`pdv`, FR-241).

## Ce qui a été livré

(rempli à la fin)

## Preuves

(remplies à la fin)
