---
name: 'pdv-service'
type: architecture-spine
purpose: build-substrate
altitude: feature
paradigm: 'modules NestJS sur le moule commun Prospera — module du vertical Distributeur, relying-party de l''IdP, producteur d''événements, consommateur de read-models'
scope: 'micro-service pdv-service — point de vente et sa nature, portefeuille et affectation, étanchéité du portefeuille indépendant, départ de commercial, pipeline à règles du distributeur, vue 360° par read-models, segmentation et couverture, plafond de crédit porté, champs de score'
status: 'final — 8 arbitrages PO du 2026-08-15 ; ils AMENDENT le PRD sur 5 points, RÉPONDENT à ses 4 questions ouvertes, et IMPOSENT UNE CORRECTION à la spine stock-service'
created: '2026-08-15'
updated: '2026-08-15'
binds:
  - 'PRD Points de vente & portefeuille v1 — FR-V01→V43, NFR-1→NFR-6'
sources:
  - 'prospera-stories/prds/prd-pdv-2026-08-02/prd.md'
  - 'prospera-stories/prds/prd-pdv-2026-08-02/.memlog.md'
  - 'prospera-stories/architecture-prospera-ecosystem-2026-07-04.md (v1.6 — AD-P13, AD-P15, AD-P16)'
  - 'prospera-stories/architecture/architecture-catalogue-produits-service-2026-08-15/ARCHITECTURE-SPINE.md (AD-6, AD-8, AD-15)'
  - 'prospera-stories/architecture/architecture-stock-service-2026-08-15/ARCHITECTURE-SPINE.md (AD-11 — CORRIGÉE par AD-1 ici)'
  - 'prospera-stories/architecture/architecture-reseau-service-2026-08-15/ARCHITECTURE-SPINE.md (AD-1, AD-6, AD-12)'
  - 'prospera-stories/architecture/architecture-notification-service-2026-08-03/ARCHITECTURE-SPINE.md (« un modèle client n''est pas un programme »)'
  - 'bilan-service/src/modules/read-models/ (le patron de projection réel : consumer bootstrap + projection + ProcessedEvent)'
  - 'auth-service/src/common/rbac/permission.enum.ts (le catalogue de permissions réel)'
  - 'platform-catalog-service/src/modules/packs/packs.seed-data.ts (le code `pdv` déjà déclaré au pack)'
companions:
  - 'prospera-stories/stories/STORY-365.md (RBAC tenant — dont FR-V38/FR-V39 dépendent)'
---

# Architecture Spine — pdv-service

> **Ce que ce service est.** Le réseau de détaillants comme **objet du système**, pas comme une liste
> de lignes de facturation.
>
> **Sa thèse, reprise du PRD :** *« Un distributeur ne vend pas à un marché. Il vend à 1 847 boutiques
> dont il connaît mal la moitié. »* Le commercial connaît ses clients, le système ne connaît que leurs
> factures — **quand le commercial part, la connaissance part avec lui**.
>
> ⚠️ **« PDV » ne désigne pas une caisse.** L'encaissement au guichet est le module Caisse (#15),
> vertical IMF. Ce service ne prend aucune commande, n'émet aucune facture, ne relance personne et ne
> bloque rien.

## Design Paradigm

**Modules NestJS sur le moule commun Prospera.** Le service possède **deux agrégats** — le point de
vente et l'affectation — projette ce que les autres publient, et **signale sans agir**.

| Couche | Répertoire | Contenu |
| --- | --- | --- |
| Entrée | `src/modules/*/` `*.controller.ts` | Contrôleurs, DTO, guards |
| Application | `src/modules/*/` `*.service.ts` | Cas d'usage, transactions, **moteur de transitions** |
| Persistance | `src/modules/*/schemas/`, `*.repository.ts` | Schémas, index. ⚠️ **Le dépôt de portefeuille indépendant est à part** (AD-3) |
| Événements | `src/kafka/`, `src/kafka/outbox/` | Contrats, outbox transactionnelle |
| **Vue 360°** | `src/modules/vue-360/` | ⚡ **Read-models datés**, un par source (AD-6) |
| Read-models entrants | `src/modules/read-models/` | `identity.*`, `kyc.status.changed`, `entitlement.changed`, `reseau.portee.changed`, **+ les 4 sources de la vue 360°** |
| Transverse | `src/common/` | Guards, RBAC, contexte |

## Inherited Invariants

| Hérité | Source | Ce qu'il contraint ici |
| --- | --- | --- |
| **AD-1 réseau — aucun « lieu » générique n'est créé** | `reseau-service` | ⚡ **Fonde AD-1 ici** : point de vente et point de stock sont **deux agrégats**, pas un champ dupliqué |
| **AD-12 réseau — les lieux des autres sont des références** | `reseau-service` | Le **point de stock** (`FR-V05`) et la **zone** (`FR-V01`) sont des **références opaques** |
| **AD-6 réseau — portée fail-closed + registre** | `reseau-service` | Appliquée au **seul droit « consulter tout le réseau »** (AD-15) |
| **AD-8 catalogue — la révélation est la seule brèche, et elle est bruyante** | `catalogue-produits` | ⚡ **Le déclencheur est ICI** ; le catalogue l'attend déjà en **hook inerte testé** (AD-5) |
| **AD-6 catalogue — isolation intra-organisation par dépôt dédié** | `catalogue-produits` | Le **mécanisme** est repris, ⚠️ mais **pas le périmètre** — voir AD-3 |
| **AD-P16 — lecture plateforme inter-org** | écosystème v1.6 | Route `@PlatformReadOnly` (AD-17) |
| **AD-P15 — le RBAC s'étend au tenant** | écosystème v1.5 | `FR-V38`/`FR-V39` ⇒ **`STORY-365`**, créée le 2026-08-15, slottée S21 |
| **« Un modèle client n'est pas un programme »** | `notification-service` | ⚡ **Fonde AD-8** : les règles du distributeur sont des **données à grammaire fermée**, jamais du code évalué |
| **Politique de conservation et droits des personnes** | `notification-service` §9 | Le **contact est une personne** (AD-13) |
| Relying-party / JWKS · Database-per-service · Outbox | écosystème | Moule commun |
| Unités mineures entières | STORY-101 · `paiement-service` | Le **plafond de crédit** ⚠️ **le XOF n'a aucune décimale** |

---

## Invariants & Rules

### AD-1 — Le point de vente et le point de stock sont DEUX agrégats [ARBITRÉ PO 2026-08-15]

> ⛔ **Cette décision CORRIGE `AD-11` de `stock-service`**, écrite la veille. Les deux spines
> modélisaient le **magasin propre**, et il aurait existé **deux fois**.

- **Binds:** FR-V01, FR-V02, FR-V05, **risque R1** · **hérite AD-1 réseau**
- **Prevents:** un actif compté deux fois, ou une nature qui diverge entre deux services

**L'origine du défaut, écrite pour qu'on ne la refasse pas.** `FR-S05b/c` du PRD Stock est né **de
l'atelier PDV** — le memlog le dit : *« défaut trouvé dans le PRD Stock (finalisé il y a quelques
minutes) »*. La correction a été portée dans Stock, puis la spine Stock a modélisé le magasin propre
**sans revenir voir que PDV le portait déjà**.

- **Rule:** ⚡ **`pdv-service` possède l'identité COMMERCIALE ; `stock-service` possède la capacité à
  DÉTENIR du stock.** Un objet, un propriétaire :

  | Lieu | `PointDeVente` (`pdv`) | `PointDeStock` (`stock`) |
  | --- | :--: | :--: |
  | Entrepôt | ❌ | ✅ |
  | **Magasin propre** | ✅ | ✅ **lié** |
  | Détaillant partenaire | ✅ | ❌ |

- **Rule:** ⚡ **`FR-V02` change de mécanisme.** La nature ne décide plus *par un champ recopié dans
  deux services* : **c'est l'EXISTENCE DU LIEN vers un point de stock qui fait du lieu un actif**. Un
  champ dupliqué finit toujours par diverger ; un lien ne peut pas.
- **Rule:** le lien est **posé et retiré par un rôle habilité, et journalisé** (`FR-V02`). ⚠️ Le poser
  fait entrer un stock au bilan ; le retirer l'en sort. **C'est une décision comptable déguisée en
  attribut CRM**, et elle doit être traitée comme telle.
- **Rule:** ⛔ **`pdv` ne crée jamais de point de stock, et `stock` ne crée jamais de point de vente.**
  Chacun référence l'autre **par identifiant**, jamais par copie (AD-12 réseau).
- **Rule:** ⚡ **conséquence de séquence, et elle est bonne :** `pdv` est en position **2**, `stock` en
  **7**. Un magasin propre peut donc être enregistré **cinq positions avant** que Stock existe — il est
  simplement **sans point de stock lié**, donc sans valorisation. L'ordre inverse aurait bloqué le CRM.

### AD-2 — Le portefeuille est à l'entreprise ; l'historique est attaché au POINT DE VENTE

- **Binds:** FR-V08, FR-V09, FR-V11, FR-V12, FR-V14, **NFR-1**, SM-1, SM-5
- **Rule:** ⛔ **aucun historique n'est attaché au commercial.** Commandes, livraisons, créances,
  visites, transitions : tout pend au point de vente. **Condition observable (`NFR-1`)** : après
  réaffectation, l'historique restitué est **identique**, au titulaire près.
- **Rule:** l'affectation est un **agrégat daté à part**, pas un champ sur le point de vente — sinon
  l'historique d'affectation n'existe pas, et `FR-V12` (« l'ancien titulaire perd l'accès **à la date
  de réaffectation, pas rétroactivement à ses propres traces** ») est intenable.
- **Rule:** ⚡ **« sans commercial » est un ÉTAT, pas un vide** (`FR-V14`). Il est listable et compté
  (`SM-1`). *Un point sans titulaire est un point que personne ne visite* — un `null` silencieux le
  rendrait invisible plutôt qu'urgent.
- **Rule:** un point de vente se **ferme sans être supprimé** ; ses créances **restent dues**.

### AD-3 — L'étanchéité est freelance ↔ freelance, PAS freelance ↔ société

> ⚠️ **Le PRD affirme « même exigence que `NFR-4` du catalogue ». C'est faux, et dans le sens qui
> arrange.** Le corriger est nécessaire : appliquer le dépôt d'`AD-6` du catalogue tel quel aurait
> **bloqué la société sur ses propres clients**.

- **Binds:** FR-V10, **NFR-2**, SM-3, **risque R2** · **hérite le MÉCANISME d'AD-6 catalogue, pas son périmètre**
- **Rule:** le catalogue cache un **prix** à la société **qui paie l'abonnement** (`NFR-4`). Ici,
  `FR-V09` pose que **le portefeuille appartient à l'entreprise** : elle voit ces points de vente, ce
  **sont ses clients**. ⇒ **l'isolation est entre indépendants**, jamais contre la société.
- **Rule:** ⛔ **un indépendant n'atteint le portefeuille d'un autre par AUCUN chemin** — API, export,
  carte, agrégat, **message d'erreur**, fournisseur de candidats. Vérifié **au niveau des données**,
  pas des écrans.
- **Rule:** le mécanisme est celui d'`AD-6` du catalogue : **dépôt dédié exigeant le `userId`
  titulaire** sur le chemin « mon portefeuille ». ⚠️ **Mais il coexiste avec un chemin société
  légitime** (`FR-V38` : « consulter tout le réseau »), ce que le catalogue n'a pas. **Les deux chemins
  sont distincts et nommés** ; ⛔ le chemin indépendant n'a **aucune** variante « admin ».
- **Rule:** ⚡ **`PLATFORM_ADMIN` reste une exception, comme au catalogue** (AD-P16) — par la route
  d'AD-17 seule, journalisée avec motif.
- **Rule:** ⚠️ **l'étanchéité ne survit pas au titulaire multiple.** C'est ce qui fonde AD-4.

### AD-4 — Titulaire unique, et c'est ce qui rend AD-3 décidable [Q1 DU PRD, TRANCHÉE]

- **Binds:** FR-V08 · **Q1, tranchée le 2026-08-15**
- **Rule:** un point de vente a **un seul commercial titulaire** à un instant donné.
- **Rule:** ⚡ **la raison n'est pas la simplicité, c'est `NFR-2`.** Avec deux indépendants sur un même
  point de vente, chacun verrait un point que l'autre sert — donc **son existence, son historique, et
  par recoupement son activité**. L'étanchéité deviendrait **indécidable**, pas seulement difficile.
- **Rule:** le modèle **n'interdit pas** l'évolution : l'affectation étant un agrégat daté (AD-2),
  passer à N titulaires est un ajout de cardinalité, pas une refonte. ⛔ Mais **rien dans le v1 ne doit
  supposer la multiplicité** — ni l'API, ni la vue, ni le fournisseur de candidats.

### AD-5 — Le départ est UN processus à étape conditionnelle, jamais deux chemins [Q4 DU PRD, TRANCHÉE]

- **Binds:** FR-V13, FR-V12, **risque R4** · **hérite AD-8 catalogue** · **Q4, tranchée le 2026-08-15**
- **Rule:** le départ d'un commercial est un **processus daté** : réaffectation point par point ou par
  lot, avec motif et trace, **puis** — si et seulement si le partant est un indépendant — l'événement
  de **révélation des prix**.
- **Rule:** ⛔ **UN SEUL chemin de code, avec une étape conditionnelle.** ⚠️ `R4` redoute qu'un départ
  soit traité comme *« une désactivation de compte »* ; avec deux chemins distincts, **le plus simple
  des deux le devient**, et c'est celui qu'on prendra sous pression.
- **Rule:** ⚡ **le déclencheur appartient à ce service, et le catalogue l'attend déjà.** `AD-8` du
  catalogue porte la brèche **en hook inerte documenté et testé comme tel** — ce service publie le
  fait, le catalogue le consomme. ⛔ **`pdv` ne lit aucun prix** et n'apprend rien de la révélation :
  il l'ordonne.
- **Rule:** la révélation porte **uniquement les points de vente qui restent** et **uniquement les prix
  en vigueur au départ**, et **le freelance en est notifié** (`FR-C29b/c`). Ce service fournit donc au
  catalogue **la liste exacte des points qui restent** — ni plus, ni moins.
- **Rule:** ⚠️ `FR-C29d` — l'exception **doit figurer au contrat de l'indépendant**. *Action produit,
  hors architecture, et elle conditionne la légitimité de tout ce parcours.*

### AD-6 — La vue 360° est faite de READ-MODELS datés, et `NFR-4` est amendée [ARBITRÉ PO 2026-08-15]

> ⛔ **Le PRD se contredisait.** `FR-V24` interdit la duplication ; `FR-V23` exige que chaque élément
> porte **sa fraîcheur**. ⚡ **Un appel synchrone est toujours frais** — exiger une fraîcheur ne se
> conçoit que sur une **projection**. `FR-V23` présupposait ce que `FR-V24` interdisait.

- **Binds:** FR-V22, FR-V23, FR-V24, **NFR-4**, NFR-6, **A2**, **risque R6**
- **Rule:** chaque source publie, **`pdv` projette** : commandes (#11), créances (#17), visites (#9),
  relances (#24). C'est le patron **déjà en place** (`kyc.status.changed`, `entitlement.changed`,
  `dossier.exercice.*`) — **rien n'est inventé**.
- **Rule:** ⚡ **`NFR-4` est amendée et reste vraie dans son intention** : elle interdit une **copie qui
  fait autorité**, pas une **projection datée qui dit sa source**. ⛔ **Aucune restitution de `pdv` ne
  fait foi** : le module d'origine reste seul juge. La carte de propriété ne bouge pas.
- **Rule:** ⛔ **chaque élément porte sa source ET sa fraîcheur** (`FR-V23`) — *une créance de la veille
  et une créance d'il y a un mois n'engagent pas la même conversation*.
- **Rule:** ⚡ **raison décisive contre l'appel synchrone :** les quatre sources sont en positions 9,
  11, 17 et 24. Une fiche qui les appelle **tombe dès que l'une est indisponible**, et son `P95 < 2 s`
  est celui du plus lent. Une projection tient la cible **et survit à la panne**, en le disant.
- **Rule:** ⇒ **`FR-V37` (fournisseur de candidats) devient atteignable** : « sans commande depuis
  *N* jours » exige la donnée **côté serveur** pour être filtrée. Une composition au BFF l'aurait rendu
  impossible.

### AD-7 — Les emplacements vides sont DÉCLARÉS, jamais absents

- **Binds:** FR-V34, FR-V35, FR-V36, §9 du PRD · **Prevents:** une fiche 360° qu'on croit opérationnelle
- **Rule:** ⚡ **troisième occurrence du même patron dans ce programme** — `FR-S08c` (`réservé = 0`
  sans Commande), `FR-C…` (profil absent ≠ profil neutre), et ici les **champs de score sans
  producteur**. La règle est désormais **de programme** : *un emplacement sans source se déclare vide
  et se voit ; il ne disparaît pas de l'API*.
- **Rule:** un score porte **sa source, sa date et sa version de modèle** (`FR-V35`). ⛔ **Un score sans
  provenance ne s'affiche jamais comme un fait.**
- **Rule:** le champ existe **dès le v1 sans producteur** (`FR-V36`) *« pour que la place ne soit pas
  oubliée »* — et pour que l'arrivée du scoring **ne demande aucun changement de contrat**.
- **Rule:** ⚠️ **la vue 360° sera largement vide à la livraison, et l'API doit le DIRE.** Un
  emplacement vide se distingue de *« pas de commande »* : le premier signifie « le module n'existe pas
  encore », le second est un fait métier. Les confondre laisse croire à un client sans activité.

### AD-8 — Les règles du distributeur sont des DONNÉES à grammaire fermée, jamais un programme

- **Binds:** FR-V17, FR-V16, **NFR-3** · **hérite `notification-service`** · **Prevents:** une exécution de code fourni par le client
- **Rule:** ⚡ *« Chaque distributeur avec sa logique »* (le PO) **ne veut pas dire « chaque
  distributeur son code »**. ⛔ **Aucune expression n'est évaluée**, aucun interpréteur, aucun
  `eval`, aucun moteur de template exécutable. `notification-service` a déjà payé cette leçon.
- **Rule:** une règle est un **enregistrement structuré** : grandeur (délai sans commande, chute du
  panier, ancienneté de créance, fréquence) × comparateur × seuil × état cible. **La grammaire est
  fermée et versionnée** ; y ajouter une grandeur est une livraison, pas une saisie.
- **Rule:** **deux moteurs de transition, tous deux légitimes** (`FR-V16`) — l'humain et le calcul.
  ⛔ **Aucun n'a la priorité par principe** ; chaque transition dit lequel l'a produite.
- **Rule:** **règles communes au réseau au v1** (`Q3`, tranchée), **structure prête à décliner par
  zone**. ⚠️ Raison : `FR-V39` fait de leur définition un droit restreint *parce qu'elles décident de
  qui est « à risque » dans toute l'entreprise*. Décliner avant d'avoir mesuré `CM-3` multiplierait la
  surface à calibrer avant de savoir si les règles collent — **mesurer d'abord** (même raisonnement que
  `SM-4` du stock).

### AD-9 — Toute transition est expliquée, et la correction humaine est un DÉSACCORD tracé

- **Binds:** FR-V19, FR-V20, FR-V21, **NFR-3**, SM-2, CM-3, **risque R3**
- **Rule:** ⛔ **aucun état ne s'affiche sans que sa cause soit restituable** : quel moteur, quelle
  règle, **quelles valeurs** l'ont déclenchée, quand. *Un commercial à qui l'on dit « ce client est à
  risque » doit pouvoir savoir pourquoi **avant** d'aller le voir.* `SM-2` se mesure à `0`.
- **Rule:** ⚡ **une correction humaine ne désactive pas la règle** — elle est enregistrée **comme un
  désaccord**, pas comme une exception. La nuance est le cœur de `CM-3` : le taux de corrections est
  **la matière première du réglage des critères**, et une « exception » ne se compte pas.
- **Rule:** l'historique complet des transitions est **conservé et restituable** (`FR-V21`) — c'est
  aussi ce qui rend `CM-1` et `CM-2` calculables.

### AD-10 — La sortie de « à risque » est aussi automatique que l'entrée

- **Binds:** FR-V15, FR-V18, CM-2
- **Rule:** un point redevenu bon **repasse automatiquement** en `actif` ou `fidèle` selon les critères
  du distributeur. ⛔ **Une sortie qui exigerait un geste humain fait que la liste des clients à risque
  ne fait que grossir** — et l'alerte perd son sens (`CM-2`).
- **Rule:** le pipeline **n'est pas un entonnoir** : `prospection → actif → fidèle`, plus `à risque` et
  `perdu`, et **le retour en arrière est normal**.
- **Rule:** `CM-1` et `CM-2` sont **calculées par le service** — points créés en `prospection` jamais
  convertis, points entrés en `à risque` **jamais ressortis**. *Un fichier de prospects n'est pas un
  portefeuille.*

### AD-11 — Le module porte le plafond, il ne l'applique pas ; et l'absence n'est pas zéro [Q2 TRANCHÉE]

- **Binds:** FR-V30 → FR-V33 · **Q2, tranchée le 2026-08-15**
- **Rule:** le plafond est un **montant avec sa devise**, en **entier d'unité mineure** ⚠️ **le XOF n'a
  aucune décimale**.
- **Rule:** ⛔ **ce module n'applique rien.** Le blocage d'une commande en dépassement appartient à
  Commande (#11) ou Facturation (#17). Ce service **publie la limite** — même discipline qu'`AD-9` de
  `reseau-service` et qu'`AD-10` du catalogue.
- **Rule:** ⚡ **un magasin propre n'a PAS de plafond, et sa valeur est `PLAFOND_SANS_OBJET`** — ⛔
  **jamais `0`, jamais `null`**. `0` se lit *« bloqué, aucun crédit autorisé »* : Commande refuserait
  toute commande d'un magasin de l'enseigne. **Même discipline que `PAS_DE_PRIX` au catalogue**, où
  l'absence a dû être distinguée de zéro exactement pour cette raison.
- **Rule:** toute modification est **journalisée avec motif et auteur** (`FR-V32`). *Relever le plafond
  d'un client à risque est une décision, pas un réglage.*
- **Rule:** le plafond se **suspend sans être remis à zéro** (`FR-V33`) — *un blocage temporaire
  n'efface pas la confiance négociée*, et l'écraser perdrait le montant à restaurer.

### AD-12 — Le dédoublonnage a une clé primaire ; la géolocalisation absente est un TROU déclaré

- **Binds:** FR-V03, FR-V06, FR-V40, SM-4, SM-6
- **Rule:** clé **primaire : le numéro de téléphone** — présent sur tout point de vente. La
  **proximité géographique** est un contrôle **secondaire**, appliqué **seulement quand les deux points
  sont localisés**.
- **Rule:** ⚡ **raison, à ne pas perdre :** la géolocalisation étant facultative, s'y fier seul
  laisserait passer **précisément les saisies hâtives** — celles qui produisent le plus de doublons.
- **Rule:** les doublons probables sont signalés **AVANT création**, jamais après.
- **Rule:** ⛔ **un point non localisé est un TROU, pas une neutralité** : il n'apparaît sur aucune
  carte, et il est **listable comme tel**. ⚠️ `SM-4` (> 90 % géolocalisés) **n'est pas mesurable au
  v1** — sa source de saisie est le module Commercial terrain (#9). L'écrire évite d'annoncer une
  cible inatteignable par construction.
- **Rule:** l'import de réseau est **tout ou rien**, avec **compte rendu avant persistance** et
  dédoublonnage (`FR-V40`) — même forme qu'`AD-12` du catalogue.

### AD-13 — Le contact est une PERSONNE, et ce service ne s'en exonère pas

- **Binds:** FR-V29, FR-V29b · **hérite `notification-service` §9**
- **Rule:** ⚡ **le point de vente est un commerce, mais son contact est une personne** — nom, numéro
  joignable. Minimisation, **durée bornée**, recherche par identifiant de canal, **effacement**.
- **Rule:** ⛔ **ce service alimente des listes d'envoi** (`FR-V29` : audience Marketing,
  `notification-service`). C'est précisément ce qui lui interdit de traiter ces champs comme de
  simples attributs de fiche.
- **Rule:** ⚠️ **même piège qu'`AD-21` de `fiscal-service`** : le **journal d'audit trace l'ACTE, pas
  la donnée personnelle**. Un journal append-only qui recopie les coordonnées devient le chemin par
  lequel l'effacement échoue — silencieusement.

### AD-14 — Scopé à l'ORGANISATION, pas au dossier [ARBITRÉ PO 2026-08-15]

- **Binds:** FR-V42, **NFR-5**, **A3** · **hérite AD-P13**
- **Rule:** `orgId` du **jeton signé**. ⛔ **Pas de `dossierId`** — et l'écart avec `stock-service` est
  **délibéré et explicable** : le stock porte `dossierId` **parce qu'il publie une balance**. Ce
  service ne publie aucune balance, ne connaît aucun exercice, et son plafond est **appliqué ailleurs**.
- **Rule:** ⚡ **le dossier n'est pas absent, il est de l'autre côté du lien** : un magasin propre est
  lié à un point de stock qui, lui, appartient à un dossier (AD-1). Le CRM n'a pas besoin de le savoir.
- **Rule:** ⛔ **un point de vente appartient à UNE organisation** (`A3`). Deux distributeurs servant la
  même boutique **ne la partagent pas** — ce sont deux enregistrements, et c'est correct : ils n'en ont
  pas la même connaissance.

### AD-15 — La portée réseau raffine « tout le réseau », jamais le portefeuille

- **Binds:** FR-V38, FR-V27 · **hérite AD-5 et AD-6 de `reseau-service`**
- **Rule:** **deux chemins de lecture, deux filtres différents** :
  - *« mon portefeuille »* — filtré par **affectation** (AD-2/AD-3). ⛔ **La portée réseau ne s'y
    applique pas** : un commercial voit ses points **même hors de sa zone**, sinon une réaffectation
    inter-zone lui ferait perdre ses propres clients.
  - *« tout le réseau »* — droit distinct (`FR-V38`), **raffiné par la portée réseau**, fail-closed.
- **Rule:** sur le second chemin, **portée absente, vide ou non résolue rend zéro enregistrement**. Une
  portée **« totale » est une valeur explicite**, jamais l'absence de restriction.
- **Rule:** ⇒ le service **exécute la suite de conformité** de `reseau-service` en CI et figure à son
  **registre des consommateurs conformes** — ⛔ **condition de sortie**, jamais implicite.
- **Rule:** ⛔ **la carte (`FR-V27`) obéit au même filtre que la liste.** Une carte qui montrerait un
  point qu'une liste cache est le chemin de fuite le plus facile à oublier.

### AD-16 — Module du vertical Distributeur : entitlement et gate

- **Binds:** §H du PRD, **NFR-5**
- **Rule:** entitlement `(org × module)`, code **`pdv`** — **déjà déclaré** dans le pack distributeur
  livré (`packs.seed-data.ts`).
- **Rule:** ⚠️ **même gap que le catalogue et le stock :** les six modules du pack **ne sont
  enregistrés nulle part au catalogue de modules** ⇒ provisioning à **422 depuis le 2026-08-11**. La
  story existe déjà et **n'a toujours pas de porteur**.
- **Rule:** gate `@RequiresPdvAccess` = **`emailVerified` + KYC `APPROVED` + entitlement `ACTIVE`**,
  par read-models locaux — moule commun, aucun appel chaud.

### AD-17 — La route de lecture plateforme : `orgId` explicite, lecture seule, journalisée

- **Binds:** **AD-P16**
- **Rule:** réservée à `PLATFORM_ADMIN`, **`orgId` en paramètre explicite** ⛔ jamais tiré du jeton ;
  ⛔ **lecture seule**, ⛔ **une organisation à la fois**, **journalisée avec son motif**.
- **Rule:** ⚡ **elle voit AUSSI les portefeuilles indépendants** — cohérent avec `AD-P16`, qui a déjà
  tranché le cas plus sensible des prix freelance au catalogue. `TENANT_ADMIN` **ne les voit pas** par
  ce chemin ; il les voit par le droit « tout le réseau », qui est **un autre sujet** (AD-3).
- **Rule:** garde propre **`@PlatformReadOnly`** ; ⛔ **seules routes** où le gate d'AD-16 ne s'applique
  pas.

---

## Consistency Conventions

| Sujet | Convention |
| --- | --- |
| Collections | `points_de_vente`, `affectations` *(agrégat daté, AD-2)*, `regles_transition`, `transitions`, `segments`, `pdv_journal`, `portefeuilles_freelance` *(dépôt dédié, AD-3)*, `vue360_*` *(un read-model par source, AD-6)* |
| Clé de portée | `orgId` du jeton ⛔ **pas de `dossierId`** (AD-14) |
| Montants | Entier d'unité mineure + devise ⚠️ **XOF : zéro décimale** |
| Absences | `PLAFOND_SANS_OBJET`, `SCORE_SANS_PRODUCTEUR`, `SANS_COMMERCIAL`, `NON_GEOLOCALISE` — ⛔ **jamais `0`, jamais `null` interprétable** |
| Refus | `POINT_DE_VENTE_DOUBLON_PROBABLE`, `NATURE_VERROUILLEE`, `PORTEE_NON_RESOLUE` |
| Nommage | ⛔ « PDV » ne désigne **jamais** une caisse. `PointDeVente` en toutes lettres dans les types |
| Homonymes | ⛔ `PorteeReseau` (zone) ≠ `Portefeuille` (affectation) — deux filtres, deux mots (AD-15) |
| Topics | `PdvTopic` (point créé, réaffecté, plafond modifié) et `PdvDepartTopic` (départ de commercial) — **deux énumérations séparées** |

## Stack

NestJS · MongoDB (base propre) · Kafka (producteur `pdv.*` et **`pdv.commercial.parti`** ; consommateur
`identity.*`, `kyc.status.changed`, `entitlement.changed`, `reseau.portee.changed`, **+ les 4 sources
de la vue 360°**) · JWT RS256 en relying-party.

## Structural Seed

```
src/modules/
  points-de-vente/      AD-1, AD-12  identité, nature, lien point de stock, dédoublonnage
  portefeuille/         AD-2, AD-3, AD-4  affectation datée, dépôt freelance dédié
  depart/               AD-5   processus unique, étape conditionnelle de révélation
  pipeline/
    regles/             AD-8   grammaire fermée, versionnée, communes au v1
    transitions/        AD-9, AD-10  moteurs humain et calcul, désaccord tracé
  vue-360/              AD-6, AD-7  read-models datés + emplacements déclarés vides
  segments-carte/       AD-12, AD-15  segments, couverture, zones blanches
  credit/               AD-11  plafond porté, jamais appliqué
  read-models/          AD-15, AD-16  portée · KYC · entitlement · identity
  plateforme/           AD-17  @PlatformReadOnly
src/conformite/         AD-15  suite de portée de reseau-service
```

## Capability → Architecture Map

| Incrément PRD | Gouverné par | Écart de charge vs PRD |
| --- | --- | --- |
| **1 — Le réseau existe** (A · B, ~29 pts) | AD-1, AD-2, AD-3, AD-4, AD-5, AD-12, AD-14, AD-16 | ⬆️ **AD-1** (deux agrégats liés) et **AD-5** (processus de départ) n'étaient pas chiffrés comme tels |
| **2 — Le réseau se lit** (D · E · F, ~26 pts) | AD-6, AD-7, AD-11, AD-15, AD-17 | ⬆️⬆️ **AD-6 change la nature du livrable** : quatre read-models, pas un agrégateur |
| **3 — Le réseau se pilote** (C · G · H, ~26 pts) | AD-8, AD-9, AD-10, AD-13 | ⬆️ **AD-8** (grammaire fermée versionnée) est plus lourd qu'un champ de règle |

⚠️ L'incrément **1** porte la confidentialité (`AD-3`) et **le seul défaut invisible du module** : un
magasin propre mal lié disparaît de l'actif sans que rien ne le signale (`R1`).

---

## ⚡ Ce que cette spine impose AILLEURS

| # | Où | Quoi |
| --- | --- | --- |
| **1** | ⛔ **`architecture-stock-service` (AD-11) et `epics-stock` (EPIC-076)** | **CORRECTION** : le magasin propre cesse d'être une *nature du point de stock* ; il devient un **`PointDeStock` lié à un `PointDeVente`** (AD-1 ici). Sans cette correction, l'objet existe deux fois. |
| **2** | `auth-service` | `FR-V38`/`FR-V39` ⇒ ✅ **`STORY-365`**, créée le 2026-08-15, slottée S21. **Quatrième dépendant.** |
| **3** | `platform-catalog-service` | Enregistrer les six modules du pack distributeur ⇒ story **déjà ouverte, toujours sans porteur**. |

## ⚡ Amendements au PRD imposés par cette spine

| Exigence | Amendement |
| --- | --- |
| **FR-V01 · FR-V02** | ⛔ Le magasin propre était modélisé **ici ET dans stock** ⇒ **AD-1** : deux agrégats liés ; **c'est le LIEN qui décide**, plus un champ dupliqué |
| **NFR-4 · FR-V24** | ⛔ **Contredisait `FR-V23`** (fraîcheur) ⇒ **AD-6** : read-models datés. `NFR-4` interdit une **copie qui fait autorité**, pas une projection qui dit sa source |
| **NFR-2** | ⚠️ « même exigence que `NFR-4` du catalogue » est **faux** ⇒ **AD-3** : l'isolation est **freelance ↔ freelance**, la société voit ses clients |
| **FR-V25 · FR-V25b** | ⏸ **Différés** (arbitrage PO) — le cache vit sur un appareil qui n'existe pas |
| **§H** | ➕ **Entitlement, gate et route plateforme** — absents du PRD (AD-16, AD-17) |

## Réponses aux 4 questions ouvertes du PRD

| # | Question | Réponse |
| --- | --- | --- |
| **Q1** | Plusieurs commerciaux sur un point de vente ? | ✅ **Non, titulaire unique** — c'est ce qui rend `NFR-2` **décidable** (AD-4) |
| **Q2** | Un magasin propre a-t-il un plafond ? | ✅ **Non — `PLAFOND_SANS_OBJET`**, ⛔ jamais `0` (AD-11) |
| **Q3** | Règles de pipeline communes ou par zone ? | ✅ **Communes au v1**, structure prête ; **mesurer `CM-3` d'abord** (AD-8) |
| **Q4** | Départ d'un salarié ? | ✅ **Même processus, étape de révélation en moins** — ⛔ **un seul chemin de code** (AD-5) |

## Deferred

| Différé | Pourquoi | Revient quand |
| --- | --- | --- |
| **Cache hors connexion** (`FR-V25`, `FR-V25b`) | *(arbitrage PO)* — il vit **sur l'appareil du commercial**, et il n'y a pas d'appareil : `prospera-terrain` n'existe pas, `STORY-170` est `deferred`, React Native/Flutter n'est pas tranché. ⚡ **`pdv` livre à la place un CONTRAT CACHABLE** : restitution complète d'un portefeuille, datée et versionnée. ⚠️ Un portefeuille freelance en cache sur un téléphone est aussi une question `NFR-2` | Module Commercial terrain (#9) |
| **Règles de pipeline par zone** | `Q3` — mesurer `CM-3` avant de multiplier la surface à calibrer ; dépend aussi de `reseau-service` | Après le 1ᵉʳ réglage mesuré |
| **Calcul des scores** | Hors périmètre (§5.2) — ce module **porte** le score (AD-7), il ne le calcule pas | Module scoring & prévision |
| **Titulaires multiples** | `Q1` — l'affectation étant un agrégat daté, c'est un ajout de cardinalité. ⛔ Rien du v1 ne doit le supposer | 1ᵉʳ cas réel documenté |
| **Zones blanches sur territoires non déclarés** | ⚠️ Même limite qu'`AD-13` de `reseau-service` : *une zone qui n'existe pas dans le système n'est pas blanche — elle est invisible* | Conquête & territoires (#16) |
