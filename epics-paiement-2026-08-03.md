---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - prospera-stories/prds/prd-paiement-service-2026-08-02/prd.md
  - prospera-stories/prds/prd-paiement-service-2026-08-02/review-rubric.md
  - prospera-stories/architecture/architecture-paiement-service-2026-08-03/ARCHITECTURE-SPINE.md
  - prospera-stories/architecture/architecture-paiement-service-2026-08-03/.memlog.md
  - prospera-stories/architecture-paiement-service-2026-08-03.md
  - prospera-stories/architecture-prospera-ecosystem-2026-07-04.md
  - prospera-stories/architecture-catalog-service-2026-07-07.md
  - prospera-stories/stories/STORY-089.md
  - prospera-stories/stories/STORY-090.md
  - prospera-stories/sprint-status.yaml
---

# PI-SPI & encaissement (`paiement-service`) — Découpage en épics

## Vue d'ensemble

Découpage du PRD PI-SPI & encaissement et de la colonne vertébrale `paiement-service` (AD-1 → AD-18)
en épics et stories implémentables. Série continuée : **épics à partir de EPIC-035**, **stories à
partir de STORY-237** (dernier numéro pris : EPIC-034 / STORY-236, série Fiscalité). Périmètre backend
+ la surface publique server-rendered du lien, qui appartient au service (AD-9) ; le reste du frontend
suit sa série `FE-*` dans son tracker propre.

**Deux stories ne sont pas du travail sur ce service** et sont marquées comme telles :
**STORY-268** (extraction du noyau de rapprochement + workspace npm, chantier `balance-service`) et
**STORY-279** (consommation de `paiement.abonnement.*`, chantier `platform-catalog-service`). Ce sont
les deux conditions portées par AD-15 et AD-13 ; elles sont dans ce découpage parce qu'elles bloquent
les incréments 2 et 3, pas parce que l'équipe paiement les livre.

> **Avertissement d'estimation.** Les points ci-dessous sont dérivés des ordres de grandeur du PRD
> (~34 / ~34 / ~26). L'estimation de `notification-service` s'était révélée **basse de 50 %** au
> découpage réel ; celle-ci mérite le même scepticisme au sprint planning.

## Inventaire des exigences

### Exigences fonctionnelles

**A — Compte d'encaissement**

- **FR-P01** — Une organisation déclare un ou plusieurs comptes d'encaissement : compte marchand chez un fournisseur, compte bancaire, ou numéro mobile money enregistré à son nom.
- **FR-P02** — Le compte est saisi par l'organisation elle-même ou par l'administration Prospera. Les deux chemins produisent le même objet et sont tracés distinctement.
- **FR-P03** — Un compte porte obligatoirement un titulaire, un pays et une devise. Un compte sans titulaire identifié est refusé — c'est le contrôle qui matérialise NFR-1.
- **FR-P04** — Le service vérifie le compte avant activation par appel de validation au fournisseur, jamais par une transaction de montant symbolique. Sans capacité de validation, le compte est `non vérifiable` et ne peut recevoir aucune demande.
- **FR-P05** — Une organisation peut détenir plusieurs comptes et désigner celui qui sert par défaut à chaque couple pays × devise.
- **FR-P06** — Les identifiants de compte sont des secrets : jamais restitués, jamais journalisés, jamais renvoyés par l'API.

**B — Fournisseurs de paiement**

- **FR-P07** — Les fournisseurs sont implémentés derrière un contrat unique `PaymentProvider`.
- **FR-P08** — Plusieurs fournisseurs sont actifs simultanément. Le routage se fait par pays × devise × méthode, configurable par organisation.
- **FR-P09** — Chaque fournisseur déclare ses capacités : pays, devises, méthodes, montants min/max, paiement partiel, remboursement, délai de règlement.
- **FR-P10** — Fournisseur du v1 : FedaPay en environnement de développement. La production et l'ajout du SPI BCEAO sont une configuration, pas une réécriture.
- **FR-P11** — Aucun fournisseur n'est un prérequis de démarrage : le service démarre dégradé et l'annonce dans son état de santé.
- **FR-P12** — Un fournisseur indisponible n'échoue pas silencieusement : la demande reste ouverte et peut être réacheminée. Le réacheminement est explicite — jamais automatique — et exige la révocation prouvée chez le fournisseur d'origine.

**C — Demande de paiement & lien**

- **FR-P13** — Le service détient une créance projetée : référence externe, montant d'origine, devise, échéance, libellé. Il n'émet pas la facture ; il maintient le solde encaissé.
- **FR-P13b** — Une demande se rattache à une créance et porte un montant, un payeur, un bénéficiaire, une durée de validité et l'identité du module appelant.
- **FR-P14** — Le lien est la surface publique de la demande : consultable sans compte, sur mobile, affichant bénéficiaire, motif, montant dû, frais et total.
- **FR-P15** — Un lien porte une durée de validité — défaut 30 jours, paramétrable, plafond 90. Expiré, il n'encaisse plus et le dit.
- **FR-P16** — Le lien est disponible en QR.
- **FR-P17** — Le lien est transmis par `notification-service`. Ce module ne parle jamais directement au payeur.
- **FR-P18** — Un lien peut être révoqué avant paiement par un rôle habilité.

**D — Encaissement par lien**

- **FR-P19** — Le service reçoit les notifications du fournisseur ; la signature est vérifiée, une notification mal signée est rejetée et tracée.
- **FR-P20** — Le traitement des notifications est idempotent : un rejeu ne crée jamais un second encaissement. Invariant prouvé par test.
- **FR-P21** — États d'une demande : `créée → envoyée → partiellement payée → soldée`, plus `expirée`, `révoquée`, `échouée`. Aucun retour arrière.
- **FR-P22** — Aucune demande ne progresse sur la seule foi de l'appelant : un état payé exige la confirmation du fournisseur ou une déclaration validée.
- **FR-P23** — La politique de frais est décidée par l'organisation qui émet la créance : `payeur` (défaut), `bénéficiaire`, ou `payeur au 1ᵉʳ versement puis bénéficiaire`.
- **FR-P23b** — Les frais s'appliquent à chaque encaissement, donc le fractionnement les multiplie. Le lien annonce avant le choix : frais du versement, qui les supporte, frais déjà supportés, surcoût prévisible.
- **FR-P23c** — La politique est figée à l'émission de la demande, jamais relue à l'encaissement.
- **FR-P24** — Le service enregistre le mouvement constaté, pas un solde de compte.
- **FR-P24b** — Le tarif et les frais appliqués sont enregistrés avec l'encaissement, jamais recalculés à la lecture.

**E — Paiement partiel & promesse**

- **FR-P25** — Le paiement partiel est autorisé.
- **FR-P26** — Une demande partiellement payée conserve un solde restant et reste payable — le même lien sert aux versements successifs.
- **FR-P27** — L'historique des encaissements successifs est conservé et restituable : qui a payé combien, quand, par quel moyen, avec quels frais.
- **FR-P28** — Une promesse de paiement peut être enregistrée sur un solde restant : montant, date promise, auteur, canal.
- **FR-P29** — Une promesse a un sort observable — tenue, non tenue, partiellement tenue — constaté à sa date, sans intervention.
- **FR-P30** — Les promesses et les soldes sont publiés vers Relance (#24) et `notification-service`. Ce module ne décide d'aucune relance.

**F — Paiement hors Prospera**

- **FR-P31** — Un encaissement réalisé hors du service peut être déclaré manuellement : montant, devise, moyen, date, encaisseur, créance rattachée.
- **FR-P32** — Une déclaration crée un encaissement à l'état `déclaré` — provisoire, distingué visuellement et dans les données d'un encaissement confirmé.
- **FR-P33** — Un encaissement déclaré passe à `validé` par rapprochement avec la remise d'espèces du jour, ou par confirmation d'un rôle habilité. Patron repris de `balance-service` STORY-089/090.
- **FR-P34** — Un encaissement déclaré non validé au-delà d'un délai — défaut 48 h ouvrées, plafond 7 jours — remonte comme écart, avec son encaisseur.
- **FR-P35** — Une déclaration est traçable et attribuable : l'auteur de la saisie et l'encaisseur sont deux champs distincts.
- **FR-P36** — La déclaration est réservée à un rôle habilité.

**G — Réconciliation & restitution**

- **FR-P37** — Pour toute créance, le service restitue montant d'origine, encaissements confirmés, encaissements déclarés non validés, solde restant, promesses. Le solde distingue toujours le certain du déclaré.
- **FR-P38** — Import du relevé du fournisseur et rapprochement selon une cascade explicite : (1) référence de transaction — certain ; (2) référence de demande au libellé — certain ; (3) triplet montant + devise + date à ±1 jour — proposé, jamais appliqué sans confirmation humaine. Le reste est listé comme écart.
- **FR-P39** — Un encaissement sans créance identifiable est mis en attente d'affectation et rattachable manuellement.
- **FR-P40** — Les encaissements sont publiés pour Facturation (#17), Finance (#21) et la comptabilité.
- **FR-P41** — Consultation et export filtrables par période, fournisseur, moyen, état, encaisseur et module appelant.

**H — Abonnement Prospera**

- **FR-P42** — Un abonnement lie une organisation à un ensemble de modules, avec périodicité, montant, devise et échéance.
- **FR-P43** — Le bénéficiaire d'un abonnement est Money Vibes. C'est la seule différence de configuration avec le cas A.
- **FR-P44** — À l'encaissement d'une échéance, le service octroie les entitlements auprès du `platform-catalog-service`.
- **FR-P45** — Impayé = suspension. La suspension révoque les entitlements.
- **FR-P46** — Une période de grâce peut être attribuée : explicite, datée, motivée, attribuée par un rôle habilité et tracée, avec une durée maximale obligatoire (défaut 30 j, plafond 90).
- **FR-P47** — Une suspension pour impayé est réversible : l'encaissement du retard rétablit les entitlements sans intervention manuelle.
- **FR-P48** — L'organisation est prévenue avant l'échéance et avant la suspension, via `notification-service`.

**I — Annulation & régularisation**

- **FR-P49** — Le service n'initie aucun remboursement.
- **FR-P50** — Le service enregistre une annulation constatée : encaissement, motif, date, pièce éventuelle. La créance retrouve son solde.
- **FR-P51** — L'enregistrement d'une annulation est réservé à un rôle habilité, distinct de celui qui déclare un encaissement.
- **FR-P52** — Une annulation est append-only : elle contre-passe, elle ne supprime pas.
- **FR-P53** — L'annulation est publiée pour la Facturation (avoir) et la comptabilité.

**J — Pays, devises & montants**

- **FR-P54** — Le service couvre les pays d'Afrique de l'Ouest avec leur devise propre. Pays et devises sont des données de référence versionnées, pas du code.
- **FR-P55** — Les montants sont stockés en entier d'unité mineure, avec le nombre de décimales de la devise (ISO 4217). Le XOF et le GNF n'ont pas de décimale.
- **FR-P56** — Aucune conversion de devise. Une créance, sa demande et son encaissement sont dans une seule et même devise.
- **FR-P57** — Une organisation multi-pays détient un compte par pays et devise ; ses créances ne se compensent pas entre devises.
- **FR-P58** — Montants min/max, frais et méthodes sont propres au couple fournisseur × pays × devise, lus des capacités déclarées.

**K — Administration & sécurité**

- **FR-P59** — Les droits sont portés par le catalogue de permissions plateforme (STORY-140), distincts et attribuables séparément.
- **FR-P60** — Séparation des pouvoirs : déclarer, valider et annuler sont trois droits qui ne doivent pas se cumuler par défaut.
- **FR-P61** — Toute opération d'argent est journalisée en piste d'audit append-only.
- **FR-P62** — Cloisonnement strict par organisation.
- **FR-P63** — Console d'exploitation sur `admin-panel`, bornée : suivre les demandes, consulter les notifications rejetées, réacheminer, consulter les écarts.
- **FR-P64** — Le service expose un fournisseur de candidats pour le moteur de règles de l'assistant (FR-IA03b). Ces candidats alimentent Relance (#24) ; ce module ne relance pas.

### Exigences non fonctionnelles

- **NFR-1** — Prospera ne détient jamais les fonds *(structurante — régime juridique)*. NFR-1a : titulaire identifié obligatoire. NFR-1b : aucune notion de solde détenu, portefeuille, séquestre ou reversement dans le modèle. NFR-1c : Money Vibes bénéficiaire uniquement pour l'abonnement.
- **NFR-2** — Exactitude monétaire : aucun flottant, entiers d'unité mineure, décimales par devise.
- **NFR-3** — Idempotence et non-duplication : au plus un encaissement par notification/rejeu. Condition observable : rejouer N fois, dans le désordre, en parallèle, après redémarrage → un seul encaissement. Dans la définition de terminé.
- **NFR-4** — Traçabilité opposable : append-only, attribuée, non modifiable. Une correction est une écriture de plus.
- **NFR-5** — Le sandbox est un chemin complet : livrable de bout en bout sur l'API de développement, sans code conditionnel `si production`.
- **NFR-6** — Confidentialité des secrets : ni restitués, ni journalisés, ni inclus dans une réponse ou une trace d'erreur.
- **NFR-7** — Délais *(cibles proposées, à reconfirmer après 30 j)* : création de demande P95 < 2 s ; prise en compte d'une notification P95 < 5 s ; restitution du solde P95 < 1 s.
- **NFR-8** — Le lien fonctionne sur un téléphone modeste, en réseau lent, et reste lisible si le réseau lâche au milieu du paiement.

### Exigences additionnelles (issues de l'architecture)

- **AR-01** — Scaffold NestJS 11 sur le moule des relying parties, port `:3005` (vérifié libre au `docker-compose` racine). *(Stack, AD-16)*
- **AR-02** — **Deux bases** MongoDB sur `rs0` : `paiement_service` et `paiement_service_audit`, avec deux comptes distincts — l'applicatif en `find`+`insert` seulement sur l'audit, un compte de maintenance absent de la configuration du service. *(AD-10)*
- **AR-03** — Chaîne d'empreintes d'audit **par créance**, index unique `(creanceId, seq)`. Jamais de chaîne globale. *(AD-10)*
- **AR-04** — Outbox transactionnelle : publication dans la transaction qui produit le fait. *(hérité P6)*
- **AR-05** — Read-models locaux `identity.*` / `kyc.status.changed` / `entitlement.changed` ; gate `@RequiresPaiementAccess` sans appel réseau. *(AD-16)*
- **AR-06** — **Index unique partiel** `(fournisseur, referenceTransactionFournisseur)` restreint aux encaissements d'origine PSP ; clé d'idempotence distincte `(orgId, cleDeclaration)` pour les déclarations manuelles. *(AD-4)*
- **AR-07** — **Boîte de réception** des notifications brutes, append-only, signature vérifiée avant persistance ; **parseur de corps brut monté uniquement sur la route webhook** — un parseur JSON global casse la vérification de signature. *(AD-4)*
- **AR-08** — Chiffrement AES-256-GCM des identifiants de fournisseur, clé maîtresse en environnement, déchiffrement uniquement dans l'adaptateur. *(AD-14)*
- **AR-09** — Travaux BullMQ à clé idempotente pour tout fait temporel ; aucun `setInterval` nulle part. *(AD-12)*
- **AR-10** — Surface publique server-rendered (`eta` 4.6), jeton opaque, **exemption JWT énumérée à la gateway**, plafond de débit par jeton et par IP. *(AD-9)*
- **AR-11** — Référentiel pays × devise chargé comme `ReferentielVersion` du `platform-catalog-service`, checksum sha256 vérifié ; irrésoluble → service dégradé. *(AD-8)*
- **AR-12** — Trois montants nommés par encaissement (`montantPaye`, `montantImpute`, `fraisAppliques`) ; seul `montantImpute` bouge le solde. Deux restants nommés (`restantCertain`, `restantAffiche`). *(AD-18, AD-3)*
- **AR-13** — **Chantier hors service** : extraction du noyau `@prospera/rapprochement` et création du workspace npm racine (aucun n'existe). *(condition de AD-15)*
- **AR-14** — **Chantier hors service** : `platform-catalog-service` devient consommateur de `paiement.abonnement.*`. *(condition de AD-13)*
- **AR-15** — Séparation des pouvoirs au niveau de l'**acteur sur l'objet**, indépendante de la configuration des rôles. *(AD-11)*

## Liste des épics

### EPIC-035 : Socle `paiement-service`, comptes d'encaissement et secrets

Le service existe, il est cloisonné, son journal est ineffaçable, et une organisation peut y raccorder
un compte qui lui appartient vraiment. *Couvre FR-P01→P06, FR-P59→P62, NFR-1, NFR-4, NFR-6, AR-01→05,
AR-08, AR-15.* **~15 pts.**

### EPIC-036 : Fournisseurs de paiement interchangeables et simultanés

Un port, des capacités déclarées, un routage déterministe — et FedaPay en sandbox comme première
preuve. *Couvre FR-P07→P12, FR-P58, NFR-5, AR-08.* **~13 pts.**

### EPIC-037 : Créance, demande, lien public et encaissement

Le cœur de l'incrément 1 : de la créance projetée au ledger append-only, en passant par la page que
Kossi ouvre sur son téléphone. *Couvre FR-P13→P26, FR-P55, NFR-2, NFR-3, NFR-8, AR-06, AR-07, AR-10,
AR-12.* **~24 pts.**

### EPIC-038 : Paiement hors Prospera et promesses

Ce qui rend la balance créances vraie quand la moitié a été payée en espèces au commercial.
*Couvre FR-P27→P36, AR-09, AR-15.* **~15 pts.**

### EPIC-039 : Réconciliation, relevé et restitution

Le rapprochement qui tient la promesse commerciale « rapprochement manuel → 0 ».
*Couvre FR-P37→P41, AR-13.* **~16 pts.**

### EPIC-040 : Annulation, contre-passation et audit opposable

Constater sans effacer, avec un rôle distinct de celui qui a constaté l'entrée.
*Couvre FR-P49→P53, FR-P61, NFR-4, AR-03.* **~8 pts.**

### EPIC-041 : Abonnements Prospera et entitlements par événement

Le cas C : même mécanique, seul le bénéficiaire change — et l'octroi qui contourne C8.
*Couvre FR-P42→P48, AR-14.* **~14 pts.**

### EPIC-042 : Multi-pays, devises, console et recette de bout en bout

Ce qui rend le service utilisable ailleurs qu'au Togo, et exploitable par une équipe.
*Couvre FR-P54, FR-P56→P58, FR-P63, FR-P64, NFR-5, NFR-7, AR-11.* **~13 pts.**

## Carte de couverture des exigences

| Exigences | Épic |
| --- | --- |
| FR-P01 → FR-P06 | EPIC-035 — comptes d'encaissement, titulaire obligatoire, secrets |
| FR-P07 → FR-P12 | EPIC-036 — port, capacités, routage, réacheminement |
| FR-P13 → FR-P18 | EPIC-037 — créance projetée, demande, lien, QR, révocation |
| FR-P19 → FR-P24b | EPIC-037 — webhook, idempotence, états, frais figés, ledger |
| FR-P25 → FR-P27 | EPIC-037 — paiement partiel, restants nommés, historique |
| FR-P28 → FR-P30 | EPIC-038 — promesses, sort observable, publication |
| FR-P31 → FR-P36 | EPIC-038 — déclaration, validation, délai, attribution |
| FR-P37 → FR-P41 | EPIC-039 — restitution décomposée, cascade, orphelins, export |
| FR-P42 → FR-P48 | EPIC-041 — abonnement, échéance, impayé, grâce, rétablissement |
| FR-P49 → FR-P53 | EPIC-040 — annulation constatée, contre-passation, publication |
| FR-P54 → FR-P58 | EPIC-042 (référentiel, non-conversion, bornes) + EPIC-037 (unité mineure) |
| FR-P59, FR-P60, FR-P62 | EPIC-035 — permissions, séparation des pouvoirs, cloisonnement |
| FR-P61 | EPIC-040 — piste d'audit opposable |
| FR-P63, FR-P64 | EPIC-042 — console bornée, fournisseur de candidats |
| AR-01 → AR-05, AR-08, AR-15 | EPIC-035 — socle technique |
| AR-06, AR-07, AR-10, AR-12 | EPIC-037 — idempotence, boîte de réception, surface publique, montants |
| AR-09 | EPIC-038 — travaux récurrents BullMQ |
| AR-11 | EPIC-042 — référentiel versionné |
| AR-13 | EPIC-039 — chantier `balance-service` (hors service) |
| AR-14 | EPIC-041 — chantier `platform-catalog-service` (hors service) |

**Couverture : 64 exigences fonctionnelles sur 64 mappées.** Les 8 NFR sont transverses et portées par
les critères d'acceptation des stories concernées, pas par un épic dédié — sauf NFR-3, qui a sa story
de preuve dédiée (STORY-257).

---

# EPIC-035 : Socle `paiement-service`, comptes d'encaissement et secrets

Le service existe, il est cloisonné, son journal est ineffaçable, et une organisation peut y raccorder
un compte qui lui appartient vraiment.

### STORY-237 — Scaffold `paiement-service` (:3005), socle transverse et point de santé

En tant qu'**équipe plateforme**, je veux un service `paiement-service` déployé et authentifié, afin que les capacités d'encaissement aient un hôte conforme aux conventions de l'écosystème. *(AR-01, AR-05)*

**Critères d'acceptation**

- **Étant donné** la stack montée par `docker-compose` **quand** le conteneur démarre **alors** il écoute sur `:3005` **et** `GET /health` répond `200` en couvrant Mongo (état du réplica set), Kafka et Redis.
- **Étant donné** une requête portant un JWT RS256 valide **quand** elle atteint une route protégée **alors** le jeton est validé localement via JWKS caché **et** aucun appel réseau n'est émis vers `auth-service`.
- **Étant donné** l'arborescence du service **quand** on inspecte `src/domain/` **alors** aucun import de `@nestjs/*` ni de `mongoose` n'y figure.
- **Étant donné** un code d'erreur métier **quand** il est rendu **alors** son statut HTTP suit la correspondance fixe des conventions (`409` transition interdite, `401` signature invalide, `422` règle métier, `400` validation, `404` hors organisation, `502` intégrité d'artefact).

**Points :** 3

### STORY-238 — Deux bases MongoDB et rôles restreints (`paiement_service`, `paiement_service_audit`)

En tant qu'**auditeur**, je veux que le journal des opérations d'argent soit techniquement ineffaçable, afin qu'aucune évolution future du code ne puisse en supprimer une trace. *(AR-02, AD-10)*

**Critères d'acceptation**

- **Étant donné** le compte applicatif **quand** il tente `deleteOne` ou `updateOne` sur une collection de `paiement_service_audit` **alors** MongoDB refuse l'opération **et** l'échec provient du serveur, pas d'un garde applicatif.
- **Étant donné** le même compte **quand** il écrit dans `paiement_service` **alors** il dispose de `readWrite` complet.
- **Étant donné** un environnement de développement **quand** on vérifie les rôles **alors** ils sont identiques à ceux de production ; un environnement où l'applicatif détient `remove` sur l'audit est déclaré non conforme par un test.
- **Étant donné** le compte de maintenance **quand** on inspecte la configuration du service **alors** ses identifiants n'y figurent pas.
- **Étant donné** le nom des bases **quand** on le compare au `docker-compose` racine **alors** il suit la convention constatée `<service>_service`, pas celle annoncée par la spine `fiscal-service`.

**Points :** 2

### STORY-239 — Read-models locaux et gate `@RequiresPaiementAccess`

En tant qu'**organisation cliente**, je veux que l'accès au service dépende de mon état réel (e-mail vérifié, KYC approuvé, droit actif), afin qu'aucune opération d'argent ne soit possible hors de ce cadre. *(AR-05, AD-16)*

**Critères d'acceptation**

- **Étant donné** les topics `identity.*`, `kyc.status.changed` et `entitlement.changed` **quand** un événement arrive **alors** le read-model local est mis à jour de façon idempotente (`eventId` déduplicé).
- **Étant donné** un utilisateur dont l'e-mail n'est pas vérifié, ou dont l'org est KYC `PENDING`, ou dont l'entitlement paiement est inactif **quand** il appelle une route métier **alors** l'accès est refusé **et** aucun appel réseau n'est émis vers un autre service.
- **Étant donné** une requête portant un `orgId` dans son corps **quand** elle est traitée **alors** l'isolation utilise l'`orgId` du **jeton signé**, jamais celui du corps.
- **Étant donné** une ressource appartenant à une autre organisation **quand** elle est demandée **alors** la réponse est `404`, jamais `403` (anti-énumération).

**Points :** 3

### STORY-240 — Journal d'audit chaîné par créance et outbox transactionnelle

En tant qu'**auditeur**, je veux que toute opération d'argent laisse une trace chaînée et attribuée, afin qu'une altération soit détectable. *(AR-03, AR-04, FR-P61, NFR-4)*

**Critères d'acceptation**

- **Étant donné** une opération d'argent **quand** elle est écrite **alors** son entrée d'audit `(creanceId, seq, empreintePrecedente)` est écrite **dans la même transaction Mongo**, avec auteur ou module d'origine.
- **Étant donné** deux écritures simultanées sur la **même** créance **quand** elles s'exécutent **alors** l'index unique `(creanceId, seq)` en fait échouer une proprement au lieu de forker la chaîne.
- **Étant donné** deux créances distinctes **quand** elles sont écrites en parallèle **alors** elles n'entrent en concurrence sur aucune ressource commune — la chaîne n'est jamais globale.
- **Étant donné** un fait métier **quand** il est persisté **alors** son événement sortant est écrit dans l'outbox **dans la même transaction**, puis publié et marqué publié.
- **Étant donné** une correction **quand** elle est enregistrée **alors** c'est une écriture de plus ; aucune entrée existante n'est modifiée.

**Points :** 5

### STORY-241 — Catalogue de permissions paiement et séparation des pouvoirs par acteur

En tant qu'**organisation cliente**, je veux que celui qui constate une entrée d'argent ne puisse pas la valider ni l'effacer seul, afin que le contrôle tienne même dans une structure de trois personnes. *(FR-P59, FR-P60, AR-15, AD-11)*

**Critères d'acceptation**

- **Étant donné** le catalogue de permissions plateforme (STORY-140) **quand** on l'inspecte **alors** les sept droits y sont déclarés et attribuables séparément : émettre une demande, révoquer un lien, déclarer un encaissement, valider un encaissement, enregistrer une annulation, attribuer une grâce, administrer les comptes.
- **Étant donné** un utilisateur qui a déclaré un encaissement **quand** il tente de le valider **alors** l'opération est refusée avec `SEPARATION_POUVOIRS_VIOLEE` (`409`), **même s'il détient les deux permissions**.
- **Étant donné** un utilisateur qui a déclaré ou validé un encaissement **quand** il tente d'enregistrer son annulation **alors** l'opération est refusée avec le même code.
- **Étant donné** une organisation qui attribue les trois permissions à une seule personne **quand** cette personne opère **alors** le refus tient quand même — le contrôle ne dépend d'aucune configuration.

**Points :** 3

### STORY-242 — Compte d'encaissement : déclaration, titulaire obligatoire, multi-comptes

En tant qu'**organisation cliente**, je veux déclarer le ou les comptes sur lesquels je serai payée, afin que l'argent aille directement chez moi. *(FR-P01, FR-P02, FR-P03, FR-P05, NFR-1a, AD-1)*

**Critères d'acceptation**

- **Étant donné** une déclaration de compte sans titulaire identifié **quand** elle est soumise **alors** elle est refusée à l'enregistrement — le contrôle est dans le schéma, pas dans une validation optionnelle.
- **Étant donné** un compte valide **quand** il est enregistré **alors** il porte obligatoirement titulaire, pays et devise, et son type est `MARCHAND` | `BANCAIRE` | `MOBILE_MONEY`.
- **Étant donné** une saisie par l'organisation et une saisie par l'administration Prospera **quand** on compare les objets produits **alors** ils sont identiques, et l'origine (qui a saisi, quand) est tracée distinctement.
- **Étant donné** une organisation multi-pays **quand** elle déclare plusieurs comptes **alors** elle peut désigner un compte par défaut pour chaque couple pays × devise.
- **Étant donné** le modèle de données complet **quand** on le parcourt **alors** aucun champ ne représente un solde détenu, un portefeuille, un séquestre ou un reversement (NFR-1b) — vérifié par un test qui échoue si un tel nom apparaît.

**Points :** 5

### STORY-243 — Chiffrement des identifiants de fournisseur et non-restitution

En tant que **responsable sécurité**, je veux que les clés d'API marchandes des clients ne soient jamais lisibles, afin qu'un dump de base ne livre pas leurs comptes. *(FR-P06, NFR-6, AR-08, AD-14)*

**Critères d'acceptation**

- **Étant donné** un identifiant de fournisseur **quand** il est persisté **alors** il est chiffré en AES-256-GCM **et** la clé maîtresse provient de l'environnement, jamais de la base.
- **Étant donné** un dump de la base `paiement_service` **quand** on l'inspecte **alors** aucun identifiant n'y est lisible en clair.
- **Étant donné** n'importe quelle route de l'API, y compris administrateur **quand** on demande un compte **alors** seule une empreinte partielle est rendue ; **aucun chemin ne restitue le clair**, pas même pour un `PLATFORM_ADMIN`.
- **Étant donné** une erreur d'appel au fournisseur **quand** elle est journalisée **alors** ni l'identifiant, ni la clé, ni un fragment de secret n'apparaissent dans la trace.
- **Étant donné** le déchiffrement **quand** on cherche où il a lieu **alors** il n'existe que dans l'adaptateur de fournisseur, au moment de l'appel sortant.

**Points :** 3

### STORY-244 — Vérification d'un compte par appel de validation au fournisseur

En tant qu'**organisation cliente**, je veux que mon compte soit vérifié avant d'être utilisé, afin qu'aucune demande de paiement ne parte vers un compte erroné. *(FR-P04)*

**Critères d'acceptation**

- **Étant donné** un compte nouvellement déclaré **quand** la vérification est lancée **alors** elle passe par un **appel de validation** au fournisseur ; **aucune transaction de montant symbolique n'est émise**, vérifié par test.
- **Étant donné** un fournisseur sans capacité de validation **quand** le compte y est rattaché **alors** le compte est marqué `non vérifiable` **et** l'organisation en est informée.
- **Étant donné** un compte non vérifié ou `non vérifiable` **quand** une demande de paiement le vise **alors** l'émission est refusée avec `COMPTE_NON_VERIFIE`.
- **Étant donné** une vérification réussie **quand** elle est enregistrée **alors** sa date et son fournisseur sont tracés.

**Points :** 3

---

# EPIC-036 : Fournisseurs de paiement interchangeables et simultanés

Un port, des capacités déclarées, un routage déterministe — et FedaPay en sandbox comme première preuve.

### STORY-245 — Port `PaymentProvider` et registre de capacités

En tant qu'**équipe plateforme**, je veux un contrat unique pour tous les fournisseurs, afin qu'ajouter un PSP soit une configuration et non une réécriture. *(FR-P07, FR-P09, AD-5)*

**Critères d'acceptation**

- **Étant donné** le port `PaymentProvider` **quand** on l'inspecte **alors** il est **asynchrone par nature** : initier un encaissement rend une référence et de quoi présenter le checkout, jamais la confirmation.
- **Étant donné** un adaptateur **quand** il s'enregistre **alors** il déclare ses capacités : pays, devises, méthodes, montants min/max, barème de frais, paiement partiel, remboursement, délai de règlement, `modeCheckout`.
- **Étant donné** le domaine **quand** on le parcourt **alors** aucun nom de PSP n'y apparaît, dans aucun type.
- **Étant donné** une capacité **quand** elle est lue **alors** elle vient de la déclaration de l'adaptateur, jamais d'une constante ni d'une variable d'environnement.

**Points :** 3

### STORY-246 — Adaptateur FedaPay sandbox — checkout par redirection

En tant qu'**organisation cliente**, je veux encaisser réellement en environnement de développement, afin que la chaîne soit démontrable de bout en bout. *(FR-P10, NFR-5)*

**Critères d'acceptation**

- **Étant donné** une demande de paiement **quand** l'adaptateur FedaPay l'initie **alors** une transaction sandbox est créée **et** l'URL de checkout hébergé est rendue.
- **Étant donné** le code du service **quand** on cherche une condition d'environnement **alors** **aucun `si production`** n'existe ; le passage en production est une configuration.
- **Étant donné** les capacités déclarées par l'adaptateur **quand** on les lit **alors** elles reflètent celles du sandbox FedaPay (pays, devises, méthodes mobile money, min/max), et non des valeurs inventées.
- **Étant donné** un encaissement effectué en sandbox **quand** on le suit de bout en bout **alors** la demande passe de `Envoyee` à `Soldee` sans intervention manuelle.

**Points :** 5

### STORY-247 — Adaptateur FedaPay — mode checkout API directe

En tant que **payeur**, je veux payer sans quitter la page quand le fournisseur le permet, afin que le parcours reste d'un seul tenant. *(FR-P14, AD-5, risque R4)*

**Critères d'acceptation**

- **Étant donné** un fournisseur déclarant `modeCheckout: API_DIRECTE` **quand** la page publique le sert **alors** elle collecte les données de paiement et les transmet au fournisseur.
- **Étant donné** des données de paiement (PAN, PIN, OTP) **quand** on inspecte les schémas Mongo **alors** **aucun champ ne peut les recevoir** — vérifié par un test qui échoue si un tel champ apparaît.
- **Étant donné** un appel en mode direct **quand** on inspecte les journaux, la boîte de réception, le journal d'audit et les traces d'erreur **alors** aucune donnée de paiement n'y figure, sous aucune forme.
- **Étant donné** le transit **quand** il a lieu **alors** il est en TLS de bout en bout et rien n'est mis en cache côté service.

> ⚠️ **Cette story porte le risque R4.** La conformité carte devient un NFR de premier rang du service dès qu'elle est livrée. À instruire avec le responsable conformité **avant** de la démarrer.

**Points :** 5

### STORY-248 — Routage ordonné pays × devise × méthode et refus nommé

En tant qu'**organisation cliente**, je veux que le choix du fournisseur soit prévisible, afin que deux demandes identiques partent toujours par le même canal. *(FR-P08, FR-P58, AD-6)*

**Critères d'acceptation**

- **Étant donné** plusieurs fournisseurs actifs **quand** une demande est émise **alors** la résolution parcourt une liste **ordonnée** de règles par organisation sur `(pays, devise, méthode)` et retient la **première règle éligible**.
- **Étant donné** deux exécutions de la même demande **quand** on compare le fournisseur retenu **alors** il est identique — la résolution est déterministe.
- **Étant donné** aucune règle éligible **quand** une demande est émise **alors** elle est refusée avec `AUCUN_FOURNISSEUR_ELIGIBLE` ; **aucun repli implicite** vers « le premier fournisseur actif » n'existe.
- **Étant donné** un montant hors des bornes déclarées du couple fournisseur × pays × devise **quand** la demande est émise **alors** elle est refusée avec `MONTANT_HORS_CAPACITE`, lu des capacités et jamais codé.

**Points :** 3

### STORY-249 — Démarrage dégradé, santé par fournisseur et réacheminement explicite

En tant qu'**exploitant**, je veux savoir quels fournisseurs répondent, et pouvoir réacheminer sans risquer un double encaissement. *(FR-P11, FR-P12, AD-6)*

**Critères d'acceptation**

- **Étant donné** aucun fournisseur configuré ou disponible **quand** le service démarre **alors** il démarre quand même **et** son état de santé est **dégradé, pas sain**, en nommant les fournisseurs indisponibles.
- **Étant donné** un fournisseur indisponible **quand** une demande le visait **alors** la demande **reste ouverte** ; elle n'est ni annulée ni déplacée automatiquement.
- **Étant donné** une demande à réacheminer **quand** l'opération est demandée **alors** elle exige la **révocation prouvée** chez le fournisseur d'origine ; sans preuve de révocation, le réacheminement est refusé.
- **Étant donné** le code **quand** on cherche un chemin de réacheminement automatique **alors** il n'en existe aucun.

**Points :** 3

### STORY-289 — Registre plateforme administrable des fournisseurs

En tant qu'**administrateur plateforme Money Vibes**, je veux déclarer un fournisseur, le configurer et l'activer pays par pays, afin d'ouvrir un nouveau marché sans attendre une livraison. *(FR-P07→P12 — complément administrable, AD-6)*

> Absorbée de l'ancienne **STORY-168**, superseded le 2026-08-03. Le trou qu'elle nommait est réel : STORY-245/248 livrent le contrat et le routage, pas le moyen de **déclarer un fournisseur sans déployer**. Même patron que le registre du catalogue de modules (STORY-032).

**Critères d'acceptation**

- **Étant donné** un administrateur plateforme **quand** il déclare un fournisseur **alors** il peut l'activer ou le désactiver **pays par pays**, et régler son routage, **sans aucun déploiement**.
- **Étant donné** ce registre **quand** on l'inspecte **alors** il porte **activation, routage et identifiants** — **jamais les capacités**, qui restent déclarées par l'adaptateur (AD-5). Un test échoue si une capacité devient administrable.
- **Étant donné** un fournisseur activé pour un pays sans adaptateur enregistré **quand** l'activation est tentée **alors** elle est refusée — le registre ne peut pas promettre ce que le code ne sait pas faire.
- **Étant donné** les identifiants saisis au registre **quand** ils sont persistés **alors** ils suivent AD-14 : chiffrés, non restituables.

**Points :** 5

---

# EPIC-037 : Créance, demande, lien public et encaissement

Le cœur de l'incrément 1 : de la créance projetée au ledger append-only, en passant par la page que
Kossi ouvre sur son téléphone.

### STORY-250 — Type `Montant` en unité mineure et décimales par devise

En tant qu'**organisation cliente**, je veux que les montants en XOF soient exacts, afin qu'un traitement à deux décimales ne produise pas des montants faux d'un facteur 100. *(FR-P55, NFR-2, R2)*

**Critères d'acceptation**

- **Étant donné** le domaine **quand** on parcourt les signatures **alors** tout montant est un `Montant = (montantMineur: entier, devise)` ; **aucun montant nu**, aucun flottant.
- **Étant donné** un montant en XOF ou GNF **quand** il est manipulé **alors** il est traité à **zéro décimale** ; un test dédié échoue si une valeur par défaut à deux décimales est appliquée.
- **Étant donné** un montant en NGN, GHS, GMD, LRD, SLE ou CVE **quand** il est manipulé **alors** il est traité à deux décimales, lues du référentiel.
- **Étant donné** le nombre de décimales **quand** il est utilisé **alors** il vient du référentiel pays × devise, jamais d'une constante ni d'une bibliothèque non versionnée.

**Points :** 3

### STORY-251 — Créance projetée par upsert idempotent

En tant que **module appelant**, je veux qu'une relance sur la même facture ne crée pas une seconde créance, afin que le solde reste unique et vrai. *(FR-P13, FR-P13b, AD-2)*

**Critères d'acceptation**

- **Étant donné** l'API **quand** on cherche une route de création de créance **alors** **il n'en existe pas** ; la première demande de paiement la matérialise.
- **Étant donné** deux demandes portant la même `(orgId, moduleAppelant, referenceExterne)` **quand** elles sont émises **alors** une seule créance existe, obtenue par `findOneAndUpdate` sur cette clé unique.
- **Étant donné** une seconde demande portant un `montantOrigine` **différent** **quand** elle est émise **alors** le montant d'origine **n'est pas écrasé** **et** une anomalie est tracée et publiée.
- **Étant donné** une créance **quand** on l'inspecte **alors** elle porte référence externe, montant d'origine, devise, échéance, libellé et module appelant.

**Points :** 3

### STORY-290 — Créance saisie manuellement — le chaînon en attendant Facturation

En tant qu'**utilisateur habilité d'un distributeur**, je veux saisir une créance à la main, afin de pouvoir encaisser sur une facture papier alors que Facturation (#17) n'existe pas. *(FR-P13, FR-P13b, A2, AD-2)*

> Absorbée de l'ancienne **STORY-169**, superseded le 2026-08-03. C'est le **chemin A** retenu par le PO le 2026-08-02. Sans elle, l'écran « déclarer un paiement en espèces » porte sur un objet inexistant. Ce n'est pas une dette technique : c'est la réalité de distributeurs qui facturent sur papier.

**Critères d'acceptation**

- **Étant donné** un utilisateur habilité **quand** il saisit une créance **alors** il fournit référence, montant, devise, échéance, libellé et payeur ; **la référence reste libre** — c'est souvent un numéro de facture papier.
- **Étant donné** une créance saisie à la main **quand** on l'inspecte **alors** son `moduleAppelant` vaut `SAISIE_MANUELLE` **explicitement** — jamais un appelant vide (AD-2).
- **Étant donné** l'arrivée future de Facturation (#17) **quand** on cherche une reprise de données à prévoir **alors** il n'y en a aucune : Facturation devient un **second émetteur** sur le même contrat, pas un remplacement.
- **Étant donné** les créances saisies **quand** elles sont consultées **alors** elles sont listables, cherchables et clôturables manuellement.

**Points :** 5

### STORY-252 — Demande de paiement, durée de validité et révocation

En tant qu'**organisation cliente**, je veux émettre une demande de paiement bornée dans le temps et révocable, afin de garder la main sur ce qui circule. *(FR-P13b, FR-P15, FR-P18, FR-P21)*

**Critères d'acceptation**

- **Étant donné** une demande émise sans durée précisée **quand** elle est créée **alors** sa validité vaut **30 jours** par défaut, paramétrable par organisation, **plafonnée à 90**.
- **Étant donné** une demande **quand** elle est créée **alors** elle porte montant, payeur, bénéficiaire, validité et **identité du module appelant**.
- **Étant donné** un rôle habilité **quand** il révoque un lien avant paiement **alors** la demande passe à `Revoquee` et n'encaisse plus.
- **Étant donné** une demande déjà `Soldee` **quand** on tente une transition **alors** elle est refusée avec `409` — aucun retour arrière.

**Points :** 3

### STORY-253 — Jeton opaque, page de lien server-rendered et QR

En tant que **détaillant sans compte Prospera**, je veux ouvrir un lien sur mon téléphone d'entrée de gamme en 3G et comprendre ce que je paie, afin de pouvoir payer. *(FR-P14, FR-P16, NFR-8, AR-10, AD-9, UJ-1)*

**Critères d'acceptation**

- **Étant donné** la page de lien **quand** elle est servie **alors** elle est **rendue côté serveur** en HTML minimal, sans bundle applicatif à hydrater.
- **Étant donné** la page **quand** elle s'affiche **alors** elle indique le bénéficiaire, le motif, le montant dû, les frais et le total à payer.
- **Étant donné** un jeton **quand** on l'examine **alors** il est **opaque et à forte entropie** ; il ne contient ni `orgId`, ni référence de facture, ni séquence devinable.
- **Étant donné** un jeton inconnu, expiré ou révoqué **quand** il est ouvert **alors** la réponse est **identique** dans les trois cas : on ne distingue jamais « n'existe pas » de « plus actif ».
- **Étant donné** le préfixe public **quand** on inspecte la configuration de la gateway **alors** son exemption de validation JWT est **énumérée explicitement**, jamais exprimée par un motif large, **et** il porte son propre plafond de débit par jeton et par IP.
- **Étant donné** une demande **quand** on demande son QR **alors** il encode le même jeton et s'affiche sans réseau du payeur.
- **Étant donné** une coupure réseau au milieu du parcours **quand** le payeur recharge **alors** la page lui dit sans ambiguïté s'il a payé ou non.

**Points :** 5

### STORY-254 — Politique de frais figée à l'émission et annoncée avant le choix

En tant que **payeur**, je veux savoir ce que je paie en frais avant de choisir, afin de ne rien découvrir après coup. *(FR-P23, FR-P23b, FR-P23c, AD-7)*

**Critères d'acceptation**

- **Étant donné** une organisation créancière **quand** elle configure sa politique **alors** elle choisit parmi `payeur` (défaut), `bénéficiaire`, `payeur au 1ᵉʳ versement puis bénéficiaire`.
- **Étant donné** l'émission d'une demande **quand** elle a lieu **alors** la politique **et la version du barème** sont **figées dans la demande** ; un changement ultérieur ne modifie aucune demande déjà communiquée.
- **Étant donné** le calcul des frais affichés **quand** il a lieu **alors** il vient du **barème déclaré en capacités** ; **aucun appel réseau** n'est émis avant d'afficher un prix.
- **Étant donné** la page de lien **quand** le payeur choisit un montant **alors** elle annonce, avant confirmation : frais du versement en cours, qui les supporte, frais déjà supportés sur cette créance.

**Points :** 5

### STORY-255 — Simulateur de surcoût de fractionnement, étiqueté estimation

En tant que **payeur**, je veux comprendre ce que me coûtera de payer en plusieurs fois, afin de décider en connaissance de cause. *(FR-P23b, CM-2)*

**Critères d'acceptation**

- **Étant donné** un solde restant **quand** le payeur envisage un versement partiel **alors** la page affiche le surcoût prévisible s'il fractionne encore.
- **Étant donné** ce surcoût **quand** il est affiché **alors** il est explicitement **étiqueté estimation**.
- **Étant donné** une estimation **quand** elle est calculée **alors** elle n'est **jamais persistée** comme un frais et n'engage rien.

**Points :** 2

### STORY-256 — Boîte de réception des notifications signées et corps brut

En tant qu'**exploitant**, je veux pouvoir prouver ce que le fournisseur a réellement envoyé, afin d'enquêter sur un litige d'encaissement. *(FR-P19, AR-07, AD-4)*

**Critères d'acceptation**

- **Étant donné** une notification entrante **quand** elle arrive **alors** sa signature est vérifiée **avant** toute persistance ; une notification non signée ou mal signée est rejetée avec `SIGNATURE_INVALIDE` (`401`) et tracée.
- **Étant donné** une notification valide **quand** elle est reçue **alors** elle est persistée **brute** dans une collection append-only, avec sa propre clé d'unicité.
- **Étant donné** la route de webhook **quand** on inspecte le pipeline **alors** un parseur de **corps brut** y est monté ; **aucun parseur JSON global** n'est appliqué, vérifié par un test qui échoue si la vérification de signature cesse de fonctionner.
- **Étant donné** un rejeu de la même notification **quand** il arrive **alors** la boîte de réception l'ignore sans erreur.
- **Étant donné** la collection **quand** on tente une mise à jour **alors** elle est refusée — append-only.

**Points :** 5

### STORY-257 — Ledger append-only, index unique partiel et idempotence prouvée

En tant qu'**organisation cliente**, je veux qu'un rejeu du fournisseur ne produise jamais un second encaissement, afin qu'aucun payeur ne soit débité deux fois. *(FR-P20, FR-P22, FR-P24, NFR-3, AR-06, AD-3, AD-4, SM-5)*

**Critères d'acceptation**

- **Étant donné** la collection des encaissements **quand** on inspecte ses index **alors** un index **unique partiel** existe sur `(fournisseur, referenceTransactionFournisseur)`, restreint aux encaissements d'origine PSP.
- **Étant donné** un rejeu **quand** il produit une erreur de clé dupliquée **alors** l'opération est traitée comme un **succès**, pas comme une panne.
- **Étant donné** le chemin de traitement d'une notification **quand** on l'inspecte **alors** il ne contient **aucun verrou applicatif, aucun verrou Redis, aucun `find` préalable**.
- **Étant donné** la même notification rejouée **N** fois — **dans le désordre, en parallèle, et après redémarrage du service** — **quand** le test s'exécute **alors** il en résulte exactement **un** encaissement et **un seul** mouvement de solde. *Ce test appartient à la définition de terminé.*
- **Étant donné** un encaissement existant **quand** un chemin applicatif tente de le mettre à jour **alors** aucun n'existe — append-only vérifié par test.
- **Étant donné** une demande **quand** elle passe à un état payé **alors** cela exige la confirmation du fournisseur ou une déclaration validée ; jamais la seule foi de l'appelant.

**Points :** 8

### STORY-258 — Trois montants nommés et imputation par le montant dû

En tant qu'**organisation cliente**, je veux que ma créance soit imputée de ce qui m'était dû, afin que le solde ne dépende pas de qui supporte les frais. *(FR-P24b, AR-12, AD-18)*

**Critères d'acceptation**

- **Étant donné** un encaissement **quand** on l'inspecte **alors** il porte `montantPaye`, `montantImpute` et `fraisAppliques`, plus `sourceFrais` (`REEL` | `BAREME`) et la version de barème figée. **Aucun champ `montant` nu** n'existe.
- **Étant donné** un calcul de solde **quand** on l'inspecte **alors** il lit **uniquement `montantImpute`** ; ni `fraisAppliques` ni `montantPaye` n'y interviennent, sous aucune politique.
- **Étant donné** la politique `payeur` **quand** un versement a lieu **alors** `montantPaye = montantImpute + fraisAppliques`.
- **Étant donné** la politique `bénéficiaire` **quand** un versement a lieu **alors** `montantPaye = montantImpute` **et** le net reçu par le bénéficiaire est enregistré comme un fait du versement, **sans réduire la dette du payeur**.
- **Étant donné** un changement de tarif du fournisseur **quand** on relit un encaissement passé **alors** ses montants sont inchangés — jamais recalculés à la lecture.

**Points :** 5

### STORY-259 — Paiement partiel, restants nommés et trop-perçu

En tant que **détaillant**, je veux payer ce que je peux et voir ce qu'il me reste, afin de compléter plus tard avec le même lien. *(FR-P25, FR-P26, FR-P27, FR-P37, AD-3)*

**Critères d'acceptation**

- **Étant donné** un versement partiel **quand** il est encaissé **alors** la demande passe à `Partiellement_payee` **et** le même lien reste payable jusqu'au solde.
- **Étant donné** une lecture de solde **quand** elle est rendue **alors** elle expose `restantCertain = montantOrigine − confirmé` **et** `restantAffiche = montantOrigine − confirmé − déclaréNonValidé`, plus `confirmé`, `déclaréNonValidé` et `promessesEnCours`. **Aucun champ ni route ne s'appelle `restant` tout court** — vérifié par test.
- **Étant donné** deux versements concurrents sur la même créance **quand** ils s'exécutent **alors** ils sont sérialisés par l'écriture du document de créance dans la même transaction ; aucun ne lit un solde périmé.
- **Étant donné** un versement qui dépasse `restantCertain` **quand** il est encaissé **alors** il est enregistré **en entier** — ni rejeté, ni tronqué — **et** la créance porte un **trop-perçu explicite**, publié.
- **Étant donné** l'historique d'une créance **quand** il est demandé **alors** il restitue qui a payé combien, quand, par quel moyen, avec quels frais.

**Points :** 5

### STORY-260 — Machine à états de la demande

En tant qu'**exploitant**, je veux que le cycle d'une demande soit explicite et sans retour arrière, afin qu'un état ne puisse pas être contredit. *(FR-P21)*

**Critères d'acceptation**

- **Étant donné** la machine à états **quand** on l'inspecte **alors** elle implémente exactement `Creee → Envoyee → Partiellement_payee → Soldee`, plus `Expiree`, `Revoquee`, `Echouee`, et `Soldee` est atteignable depuis `Partiellement_payee`.
- **Étant donné** une transition non déclarée **quand** elle est tentée **alors** elle est refusée avec `409`.
- **Étant donné** `Echouee` **quand** un réacheminement explicite a lieu après révocation prouvée **alors** et seulement alors la demande peut revenir à `Envoyee`.
- **Étant donné** toute transition **quand** elle est écrite **alors** son entrée d'audit l'est dans la même transaction.

**Points :** 3

### STORY-261 — Émission du lien via `notification-service`

En tant qu'**organisation cliente**, je veux que le lien parte au payeur par WhatsApp, SMS ou e-mail, afin qu'il n'ait rien à chercher. *(FR-P17, AD-17)*

**Critères d'acceptation**

- **Étant donné** une demande émise **quand** elle est persistée **alors** `paiement.demande.emise` est publié via l'outbox, dans la même transaction.
- **Étant donné** le code du service **quand** on cherche un envoi direct au payeur **alors** il n'en existe aucun — ni SMS, ni e-mail, ni WhatsApp ; l'organe de parole est unique.
- **Étant donné** l'événement publié **quand** on l'inspecte **alors** il est keyé `orgId`, porte `eventId` et `schemaVersion`, et véhicule l'état absolu.

**Points :** 2

---

# EPIC-038 : Paiement hors Prospera et promesses

Ce qui rend la balance créances vraie quand la moitié a été payée en espèces au commercial.

### STORY-262 — Déclaration manuelle d'encaissement et clé d'idempotence propre

En tant que **commercial en tournée**, je veux saisir sur mon téléphone les espèces que je viens de recevoir, afin que le solde du client soit juste immédiatement. *(FR-P31, FR-P32, FR-P35, FR-P36, AR-06)*

**Critères d'acceptation**

- **Étant donné** un rôle habilité **quand** il déclare un encaissement **alors** il fournit montant, devise, moyen (`ESPECES` | `MOMO_DIRECT` | `VIREMENT` | `CHEQUE`), date, encaisseur et créance rattachée.
- **Étant donné** une déclaration **quand** elle est créée **alors** l'encaissement est à l'état `DECLARE` **et** il est distingué d'un encaissement confirmé **dans les données**, pas seulement à l'affichage.
- **Étant donné** un double envoi depuis un téléphone en réseau instable **quand** les deux requêtes portent la même `cleDeclaration` **alors** un seul encaissement est créé — clé unique `(orgId, cleDeclaration)`.
- **Étant donné** une déclaration **quand** on l'inspecte **alors** l'**auteur de la saisie** et l'**encaisseur** sont deux champs distincts, tous deux renseignés.
- **Étant donné** un utilisateur sans le droit de déclarer **quand** il tente **alors** l'opération est refusée.

**Points :** 5

### STORY-263 — Validation d'un encaissement déclaré

En tant que **caissier**, je veux valider les espèces effectivement remises, afin que le solde certain reflète l'argent réellement rentré. *(FR-P33, AD-11)*

**Critères d'acceptation**

- **Étant donné** un encaissement `DECLARE` **quand** un rôle habilité le valide **alors** il passe à `CONFIRME` **et** `restantCertain` bouge en conséquence.
- **Étant donné** le déclarant lui-même **quand** il tente de valider **alors** l'opération est refusée avec `SEPARATION_POUVOIRS_VIOLEE`, quels que soient ses droits.
- **Étant donné** une remise d'espèces rapprochée **quand** elle couvre l'encaissement déclaré **alors** la validation peut être portée par ce rapprochement plutôt que par une confirmation individuelle.
- **Étant donné** la validation **quand** elle a lieu **alors** elle est une **écriture de plus** ; l'encaissement déclaré n'est pas modifié dans son historique.

**Points :** 3

### STORY-264 — Délai de validation et remontée d'écart

En tant que **responsable financier**, je veux voir les espèces déclarées et jamais validées, afin de savoir qui doit encore remettre. *(FR-P34, AR-09, SM-4)*

**Critères d'acceptation**

- **Étant donné** un encaissement déclaré **quand** il est créé **alors** un travail BullMQ à clé idempotente est posé à son échéance de validation — **48 h ouvrées** par défaut, paramétrable, **plafond 7 jours**.
- **Étant donné** l'échéance atteinte sans validation **quand** le travail s'exécute **alors** un **écart est écrit et publié**, portant son encaisseur.
- **Étant donné** le calcul de « 48 h ouvrées » **quand** il a lieu **alors** il s'appuie sur un calendrier explicite, jamais sur des heures brutes.
- **Étant donné** deux répliques du service **quand** le travail arrive à échéance **alors** l'écart n'est écrit et publié **qu'une fois**.

**Points :** 3

### STORY-265 — Promesse de paiement : enregistrement

En tant que **commercial**, je veux noter quand le client s'engage à compléter, afin que la relance sache quoi attendre. *(FR-P28)*

**Critères d'acceptation**

- **Étant donné** un solde restant **quand** une promesse est enregistrée **alors** elle porte montant promis, **date promise**, auteur de la saisie et canal de l'engagement.
- **Étant donné** une créance soldée **quand** on tente d'y enregistrer une promesse **alors** l'opération est refusée avec `CREANCE_SOLDEE`.
- **Étant donné** une promesse **quand** elle est créée **alors** `paiement.promesse.enregistree` est publié via l'outbox.

**Points :** 2

### STORY-266 — Sort observable d'une promesse, constaté à sa date

En tant que **responsable recouvrement**, je veux que le sort d'une promesse soit constaté tout seul, afin de ne pas avoir à repasser dessus. *(FR-P29, AR-09, AD-12)*

**Critères d'acceptation**

- **Étant donné** une promesse créée **quand** elle est persistée **alors** un travail BullMQ est posé à `datePromise`, avec la clé idempotente `promesse:{id}:echeance`.
- **Étant donné** la date atteinte **quand** le travail s'exécute **alors** le sort est **écrit** : `TENUE`, `PARTIELLEMENT_TENUE` ou `NON_TENUE`, par comparaison avec les encaissements de la période — **sans aucune intervention**.
- **Étant donné** le code du service **quand** on cherche une minuterie **alors** **aucun `setInterval`** ni ordonnancement en mémoire de processus n'existe.
- **Étant donné** un redémarrage du service avant l'échéance **quand** la date arrive **alors** le fait est quand même constaté.

**Points :** 3

### STORY-267 — Publication des promesses, soldes et candidats vers Relance

En tant que **module Relance (#24)**, je veux recevoir les promesses échues et les soldes, afin de décider des relances sans interroger `paiement-service`. *(FR-P30, FR-P64, AD-17)*

**Critères d'acceptation**

- **Étant donné** un sort de promesse constaté **quand** il est écrit **alors** `paiement.promesse.echue` est publié via l'outbox, keyé `orgId`.
- **Étant donné** le code du service **quand** on cherche une décision de relance, d'escalade ou de recouvrement **alors** il n'en existe aucune.
- **Étant donné** le fournisseur de candidats **quand** il est interrogé **alors** il rend : demandes expirées sans relance, promesses échues non tenues, encaissements déclarés non validés hors délai, créances sans encaissement depuis N jours, abonnements arrivant à échéance.

**Points :** 3

---

# EPIC-039 : Réconciliation, relevé et restitution

Le rapprochement qui tient la promesse commerciale « rapprochement manuel → 0 ».

### STORY-268 — ⚠️ *Hors service* — Extraction du noyau `@prospera/rapprochement` et workspace npm

En tant qu'**équipe plateforme**, je veux un noyau d'appariement partagé et agnostique, afin que `balance-service` et `paiement-service` ne divergent pas sur l'ambiguïté et la fenêtre de date. *(AR-13, condition de AD-15)*

> **Cette story n'est pas du travail sur `paiement-service`.** Elle porte sur `balance-service` (service **livré**) et sur l'outillage du dépôt. Constat du 2026-08-03 : le dépôt n'a **aucun `package.json` racine ni workspace npm**, et `rapprochement.regles.ts` (598 lignes pures) est typé sur `LigneCahierAApparier` / `TypeCompteTresorerie` / `MoyenPaiement`. Elle **bloque l'incrément 2** et doit être planifiée en amont.

**Critères d'acceptation**

- **Étant donné** la racine du dépôt **quand** on l'inspecte **alors** un workspace npm existe et déclare les paquets partagés.
- **Étant donné** le paquet `@prospera/rapprochement` **quand** on l'inspecte **alors** il ne contient **que l'agnostique** : types génériques de ligne et de candidat, fenêtre floue de date, refus d'apparier en cas d'ambiguïté, scoring de libellé, qualification d'écart, empreinte de ligne anti-doublon. **Aucun type métier d'un service n'y figure.**
- **Étant donné** deux candidats équivalents **quand** l'appariement s'exécute **alors** les **deux** sont proposés et **aucun** n'est choisi.
- **Étant donné** `balance-service` rebranché sur le noyau **quand** sa suite de tests s'exécute **alors** elle passe intégralement — le comportement de STORY-089/090 est préservé.

**Points :** 8 *(à imputer au tracker `balance-service`)*

### STORY-269 — Import du relevé de fournisseur

En tant que **responsable financier**, je veux importer le relevé de mon PSP, afin de confronter mes encaissements à ce que le fournisseur a réellement reçu. *(FR-P38 — import)*

**Critères d'acceptation**

- **Étant donné** un relevé au format déclaré par le fournisseur **quand** il est importé **alors** ses lignes sont persistées avec une **empreinte de ligne** qui détecte le doublon au ré-import.
- **Étant donné** un ré-import chevauchant une période déjà importée **quand** il a lieu **alors** les lignes déjà présentes sont **ignorées, comptées et listées** — jamais dupliquées.
- **Étant donné** un import **quand** il s'exécute **alors** il ne crée **aucun encaissement** — un relevé est un référentiel de comparaison, pas une source d'écriture.
- **Étant donné** un import **quand** il est demandé en simulation **alors** il rend un aperçu sans persistance.

**Points :** 5

### STORY-270 — Cascade de clés de rapprochement

En tant que **responsable financier**, je veux que le rapprochement soit certain quand il peut l'être et proposé quand il ne peut pas, afin de ne jamais enterrer une question sous un faux appariement. *(FR-P38, AD-15, SM-3)*

**Critères d'acceptation**

- **Étant donné** une ligne de relevé portant la **référence de transaction du fournisseur** **quand** le rapprochement s'exécute **alors** l'appariement est **certain** et appliqué.
- **Étant donné** une ligne portant la **référence de demande au libellé** **quand** la clé primaire est absente **alors** l'appariement est **certain** et appliqué.
- **Étant donné** une correspondance sur le **triplet montant + devise + date à ±1 jour** **quand** les deux clés précédentes sont absentes **alors** l'appariement est **proposé** et **jamais appliqué sans confirmation humaine**.
- **Étant donné** une ligne ne tombant dans aucune des trois clés **quand** le rapprochement s'achève **alors** elle est listée comme **écart, avec son motif** — jamais comblée d'office.
- **Étant donné** un rapprochement complet **quand** il s'achève **alors** l'écart entre le solde restitué et le relevé est **nul**.

**Points :** 5

### STORY-271 — Encaissement orphelin et affectation manuelle

En tant que **responsable financier**, je veux qu'un paiement spontané ne se perde pas, afin de pouvoir le rattacher quand j'aurai compris d'où il vient. *(FR-P39)*

**Critères d'acceptation**

- **Étant donné** un encaissement sans créance identifiable **quand** il est constaté **alors** il est mis **en attente d'affectation** ; il n'est ni rejeté ni rattaché d'office.
- **Étant donné** un encaissement en attente **quand** un rôle habilité le rattache à une créance **alors** le rattachement est tracé avec son auteur et son motif.
- **Étant donné** la liste des encaissements en attente **quand** elle est consultée **alors** elle est restituable et filtrable.

**Points :** 3

### STORY-272 — Restitution du solde décomposé et export filtrable

En tant que **module appelant**, je veux un solde qui distingue toujours le certain du déclaré, afin de ne pas confondre une promesse d'argent avec de l'argent. *(FR-P37, FR-P41)*

**Critères d'acceptation**

- **Étant donné** une créance **quand** on demande son état **alors** la réponse porte montant d'origine, encaissements confirmés, encaissements déclarés non validés, `restantCertain`, `restantAffiche`, promesses en cours et trop-perçu éventuel.
- **Étant donné** cette réponse **quand** on la parcourt **alors** **aucun champ unique ne prétend être « le » solde**.
- **Étant donné** la consultation des encaissements **quand** elle est filtrée **alors** elle accepte période, fournisseur, moyen, état, encaisseur et module appelant.
- **Étant donné** un export **quand** il est demandé **alors** il respecte les mêmes filtres et le cloisonnement par organisation.

**Points :** 3

### STORY-273 — Publication des encaissements vers Facturation, Finance et comptabilité

En tant que **module Facturation (#17)**, je veux être notifié des encaissements, afin de tenir mes factures à jour sans interroger `paiement-service`. *(FR-P40, AD-17)*

**Critères d'acceptation**

- **Étant donné** un encaissement confirmé, déclaré ou annulé **quand** il est écrit **alors** l'événement `paiement.encaissement.*` correspondant est publié via l'outbox, dans la même transaction.
- **Étant donné** une créance soldée ou en trop-perçu **quand** l'état est atteint **alors** `paiement.creance.soldee` ou `paiement.creance.tropPercu` est publié.
- **Étant donné** le code du service **quand** on cherche une écriture comptable **alors** il n'en existe aucune — le service publie l'événement, il n'écrit pas le journal.

**Points :** 3

---

# EPIC-040 : Annulation, contre-passation et audit opposable

Constater sans effacer, avec un rôle distinct de celui qui a constaté l'entrée.

### STORY-274 — Annulation constatée par contre-passation

En tant que **responsable financier**, je veux enregistrer qu'un encaissement a été annulé chez le fournisseur, afin que la créance retrouve son solde sans que l'historique mente. *(FR-P49, FR-P50, FR-P52, AD-3)*

**Critères d'acceptation**

- **Étant donné** un encaissement annulé chez le fournisseur **quand** l'annulation est enregistrée **alors** elle porte l'encaissement concerné, un motif, une date et une pièce justificative éventuelle.
- **Étant donné** cette annulation **quand** elle est écrite **alors** c'est une **contre-passation** — une écriture de plus référençant l'encaissement d'origine ; **l'encaissement d'origine n'est ni modifié ni supprimé**.
- **Étant donné** la contre-passation **quand** elle est prise en compte **alors** le solde de la créance est recalculé en conséquence.
- **Étant donné** l'API **quand** on cherche une initiation de remboursement **alors** il n'en existe aucune — le service ne détient pas les fonds.

**Points :** 3

### STORY-275 — Rôle distinct et publication de l'annulation

En tant qu'**auditeur**, je veux que celui qui constate une entrée d'argent ne puisse pas l'effacer seul, afin qu'une fraude exige au moins deux personnes. *(FR-P51, FR-P53, AD-11)*

**Critères d'acceptation**

- **Étant donné** un utilisateur ayant déclaré ou validé un encaissement **quand** il tente d'enregistrer son annulation **alors** l'opération est refusée avec `SEPARATION_POUVOIRS_VIOLEE`, indépendamment de ses permissions.
- **Étant donné** une annulation enregistrée **quand** elle est persistée **alors** `paiement.encaissement.annule` est publié pour la Facturation (avoir) et la comptabilité.
- **Étant donné** l'annulation **quand** elle est écrite **alors** son entrée d'audit l'est dans la même transaction, avec son auteur et son motif.

**Points :** 2

### STORY-276 — Piste d'audit opposable sur toute opération d'argent

En tant qu'**auditeur**, je veux reconstituer qui a fait quoi, quand, sur quelle créance et depuis quelle origine, afin que la trace soit opposable. *(FR-P61, NFR-4, AR-03)*

**Critères d'acceptation**

- **Étant donné** toute opération d'argent — émission, encaissement, déclaration, validation, annulation, grâce, réacheminement — **quand** elle a lieu **alors** elle produit une entrée d'audit attribuée à une personne **ou** à un module, avec son origine.
- **Étant donné** la chaîne d'empreintes d'une créance **quand** on la vérifie **alors** toute altération d'une entrée intermédiaire est détectée.
- **Étant donné** une restauration de sauvegarde de `paiement_service_audit` **quand** elle a lieu **alors** elle est un acte tracé **hors application** — aucun chemin applicatif ne peut la déclencher — **et** les chaînes sont revérifiées après.
- **Étant donné** le journal **quand** on l'inspecte **alors** il ne contient ni secret, ni donnée de paiement, ni identifiant de payeur en clair.

**Points :** 3

---

# EPIC-041 : Abonnements Prospera et entitlements par événement

Le cas C : même mécanique, seul le bénéficiaire change — et l'octroi qui contourne C8.

### STORY-277 — Abonnement Prospera : contrat, périodicité, échéance

En tant que **Money Vibes**, je veux qu'une organisation soit liée à un ensemble de modules par un abonnement daté, afin de facturer l'usage de la plateforme. *(FR-P42, FR-P43)*

**Critères d'acceptation**

- **Étant donné** un abonnement **quand** il est créé **alors** il lie une organisation à un ensemble de modules, avec périodicité, montant, devise et échéance.
- **Étant donné** une échéance d'abonnement **quand** elle est générée **alors** elle **est une créance** au sens du service — le cas C ne dispose d'aucune mécanique propre.
- **Étant donné** une échéance d'abonnement **quand** on inspecte son bénéficiaire **alors** c'est **Money Vibes**, et c'est la seule différence de configuration avec le cas A (NFR-1c).
- **Étant donné** une créance du cas A **quand** on inspecte son bénéficiaire **alors** ce n'est **jamais** un compte contrôlé par Money Vibes — vérifié par un test qui matérialise SM-1.

**Points :** 3

### STORY-278 — Échéance encaissée : publication vers le catalogue

En tant qu'**organisation cliente**, je veux que payer mon abonnement ouvre mes droits, afin de ne pas attendre une intervention manuelle. *(FR-P44, AD-13)*

**Critères d'acceptation**

- **Étant donné** une échéance d'abonnement encaissée **quand** l'encaissement est confirmé **alors** `paiement.abonnement.echeance.encaissee` est publié via l'outbox, keyé `orgId`, en état absolu.
- **Étant donné** le code du service **quand** on cherche un appel à l'API d'entitlement du `platform-catalog-service` **alors** **il n'en existe aucun** — ni `PUT`, ni jeton de service, ni mTLS.
- **Étant donné** le read-model d'entitlement **quand** on l'inspecte **alors** il est alimenté par `entitlement.changed` comme pour tout autre service ; ce service n'en tient aucune copie faisant foi.

**Points :** 3

### STORY-279 — ⚠️ *Hors service* — `platform-catalog-service` consomme `paiement.abonnement.*`

En tant qu'**organisation cliente**, je veux que mes droits s'ouvrent et se ferment tout seuls, afin que l'abonnement ait un effet réel. *(AR-14, condition de AD-13)*

> **Cette story n'est pas du travail sur `paiement-service`.** Elle porte sur `platform-catalog-service`, qui doit devenir consommateur des topics `paiement.abonnement.*`. Elle **bloque l'incrément 3** et doit être planifiée en amont. C'est ce qui remplace la décision **C8**, ouverte depuis STORY-034.

**Critères d'acceptation**

- **Étant donné** `paiement.abonnement.echeance.encaissee` **quand** il est consommé **alors** l'entitlement correspondant est octroyé, de façon idempotente sur `eventId`.
- **Étant donné** `paiement.abonnement.impayee` **quand** il est consommé **alors** l'entitlement est révoqué.
- **Étant donné** `paiement.abonnement.regularise` **quand** il est consommé **alors** l'entitlement est rétabli.
- **Étant donné** l'ensemble du flux **quand** on l'inspecte **alors** `platform-catalog-service` reste l'**unique écrivain** de l'entitlement (P8 préservé).

**Points :** 5 *(à imputer au tracker `platform-catalog-service`)*

### STORY-280 — Impayé, suspension et préavis

En tant qu'**organisation cliente**, je veux être prévenue avant d'être coupée, afin qu'une suspension ne soit jamais une surprise. *(FR-P45, FR-P48, AR-09, CM-1)*

**Critères d'acceptation**

- **Étant donné** une échéance approchant **quand** l'horizon de préavis est atteint **alors** un événement de préavis est publié pour `notification-service` — **avant** l'échéance.
- **Étant donné** une échéance non encaissée **quand** le délai est écoulé **alors** `paiement.abonnement.impayee` est publié **et** un préavis de suspension a été émis auparavant.
- **Étant donné** ces échéances **quand** elles sont posées **alors** ce sont des travaux BullMQ à clé idempotente ; deux répliques ne produisent pas deux préavis.
- **Étant donné** une coupure **quand** elle a lieu sans préavis préalable **alors** un test échoue — une coupure sans préavis est un défaut, pas une politique.

**Points :** 3

### STORY-281 — Période de grâce bornée, datée et motivée

En tant que **responsable commercial**, je veux pouvoir accorder un délai explicite à un client, afin que la souplesse reste une décision et non un effet de configuration. *(FR-P46, AD-12)*

**Critères d'acceptation**

- **Étant donné** une grâce **quand** elle est attribuée **alors** elle porte obligatoirement une **durée maximale** — défaut 30 jours, **plafond 90** — une date, un motif et l'auteur habilité qui l'a accordée.
- **Étant donné** une tentative de grâce sans durée **quand** elle est soumise **alors** elle est refusée — une grâce sans terme est une suspension qui n'arrive jamais.
- **Étant donné** une grâce attribuée **quand** elle est persistée **alors** son travail d'échéance BullMQ est posé dans la même opération.
- **Étant donné** la fin de la grâce sans régularisation **quand** l'échéance arrive **alors** la suspension s'applique.
- **Étant donné** la configuration du service **quand** on la parcourt **alors** aucune grâce n'y est un **défaut** — elle est toujours attribuée explicitement.

**Points :** 3

### STORY-282 — Rétablissement automatique après régularisation

En tant qu'**organisation suspendue**, je veux que payer mon retard rouvre mes droits tout seul, afin de ne pas dépendre d'une intervention. *(FR-P47)*

**Critères d'acceptation**

- **Étant donné** un abonnement suspendu **quand** le retard est encaissé **alors** `paiement.abonnement.regularise` est publié **sans aucune intervention manuelle**.
- **Étant donné** ce rétablissement **quand** il est observé de bout en bout **alors** les entitlements sont rétablis via le consommateur du catalogue (STORY-279).
- **Étant donné** un encaissement partiel du retard **quand** il ne solde pas l'échéance **alors** la suspension **n'est pas** levée.

**Points :** 2

---

# EPIC-042 : Multi-pays, devises, console et recette de bout en bout

Ce qui rend le service utilisable ailleurs qu'au Togo, et exploitable par une équipe.

### STORY-283 — Référentiel pays × devise versionné et santé dégradée

En tant qu'**équipe plateforme**, je veux que la carte monétaire de la région soit une donnée versionnée, afin qu'un nouveau pays ne demande pas un déploiement de code. *(FR-P54, AR-11, AD-8, A4)*

**Critères d'acceptation**

- **Étant donné** le jeu pays × devise × décimales **quand** on cherche où il vit **alors** c'est une `ReferentielVersion` de `platform-catalog-service` (`pays-devises-ao@AAAA.N`), **pas du code** et **pas une collection locale**.
- **Étant donné** le chargement du référentiel **quand** il a lieu **alors** l'artefact est obtenu par `artifactUri` **et** son `checksum` sha256 est vérifié ; une empreinte non conforme est une **erreur d'intégrité** (`502`), pas un avertissement.
- **Étant donné** un référentiel irrésoluble **quand** le point de santé est interrogé **alors** le service est **dégradé, pas sain**.
- **Étant donné** l'ajout d'un pays **quand** une nouvelle version du référentiel est publiée **alors** aucun déploiement de code n'est nécessaire.

**Points :** 3

### STORY-284 — Refus de conversion et non-compensation entre devises

En tant que **responsable conformité**, je veux qu'aucune conversion de devise n'existe, afin que le service ne bascule pas dans une activité de change. *(FR-P56, FR-P57)*

**Critères d'acceptation**

- **Étant donné** une créance, sa demande et son encaissement **quand** on compare leurs devises **alors** elles sont identiques ; une divergence est refusée avec `DEVISE_INCOHERENTE`.
- **Étant donné** le code du service **quand** on cherche une conversion, un taux de change ou une devise pivot **alors** il n'en existe aucun.
- **Étant donné** une organisation opérant dans plusieurs devises **quand** ses créances sont restituées **alors** elles ne se compensent **jamais** entre devises.
- **Étant donné** une organisation multi-pays **quand** elle encaisse **alors** elle dispose d'un compte par pays et par devise.

**Points :** 2

### STORY-285 — Bornes de montant et méthodes lues des capacités

En tant qu'**organisation cliente**, je veux que les limites appliquées soient celles de mon fournisseur, afin qu'un montant valide ne soit pas refusé par une constante. *(FR-P58)*

**Critères d'acceptation**

- **Étant donné** un montant min/max, un barème ou une méthode **quand** ils sont appliqués **alors** ils sont lus des capacités du couple **fournisseur × pays × devise**, jamais codés ni mis en configuration.
- **Étant donné** un montant hors bornes **quand** la demande est émise **alors** elle est refusée avec `MONTANT_HORS_CAPACITE` en nommant la borne.
- **Étant donné** un fournisseur qui met à jour ses capacités **quand** elles sont rechargées **alors** les bornes appliquées changent sans déploiement.

**Points :** 2

### STORY-286 — Console d'exploitation bornée sur `admin-panel`

En tant qu'**exploitant**, je veux suivre les demandes et les écarts sans pouvoir contourner les règles, afin que la console reste un outil de lecture. *(FR-P63, AD-6, AD-17)*

**Critères d'acceptation**

- **Étant donné** la console **quand** on l'utilise **alors** elle permet exactement quatre choses : suivre les demandes, consulter les notifications de fournisseur rejetées, réacheminer une demande, consulter les écarts de rapprochement.
- **Étant donné** un réacheminement lancé depuis la console **quand** il s'exécute **alors** il obéit à AD-6 comme partout ailleurs — révocation prouvée exigée ; la console n'est **pas** un chemin d'écriture privilégié.
- **Étant donné** la console **quand** on cherche une action de relance, de facturation ou d'écriture comptable **alors** il n'y en a aucune.
- **Étant donné** un opérateur **quand** il consulte une organisation **alors** le cloisonnement s'applique comme pour toute autre surface.

**Points :** 3

### STORY-287 — Fournisseur de candidats pour le moteur de règles de l'assistant

En tant que **module assistant**, je veux une liste de situations à traiter, afin d'alimenter les règles sans interroger la base de `paiement-service`. *(FR-P64)*

**Critères d'acceptation**

- **Étant donné** le fournisseur de candidats **quand** il est interrogé **alors** il rend les cinq familles : demandes expirées sans relance, promesses échues non tenues, encaissements déclarés non validés hors délai, créances sans encaissement depuis N jours, abonnements arrivant à échéance.
- **Étant donné** ces candidats **quand** on regarde leur consommateur **alors** ils alimentent Relance (#24) ; **ce module ne relance pas**.
- **Étant donné** l'interface **quand** elle est appelée **alors** elle respecte le cloisonnement par organisation.

**Points :** 3

### STORY-288 — Recette de bout en bout en sandbox

En tant qu'**équipe produit**, je veux démontrer le parcours complet de Kossi sur l'API de développement, afin de prouver que le service tient sa promesse avant tout accès de production. *(NFR-5, NFR-7, NFR-8, UJ-1)*

**Critères d'acceptation**

- **Étant donné** l'environnement sandbox **quand** le scénario UJ-1 est rejoué **alors** il se déroule entièrement : lien émis → ouvert sur un profil mobile bas de gamme → frais annoncés → paiement partiel → solde restant → promesse → déclaration d'espèces → validation → sort de la promesse constaté.
- **Étant donné** le même scénario **quand** on le rejoue avec des notifications désordonnées et dupliquées **alors** aucun double encaissement n'apparaît.
- **Étant donné** les mesures de la recette **quand** on les relève **alors** les cibles NFR-7 sont **mesurées et consignées** comme référence à reconfirmer après 30 jours, **pas** validées comme un seuil acquis.
- **Étant donné** la page publique **quand** elle est mesurée sur un profil réseau lent **alors** son poids et son délai d'affichage sont consignés.

**Points :** 5

---

## Récapitulatif

| Épic | Stories | Points |
| --- | --- | --- |
| EPIC-035 — Socle, comptes, secrets | STORY-237 → 244 | 27 |
| EPIC-036 — Fournisseurs interchangeables | STORY-245 → 249, 289 | 24 |
| EPIC-037 — Créance, demande, lien, encaissement | STORY-250 → 261, 290 | 54 |
| EPIC-038 — Hors Prospera et promesses | STORY-262 → 267 | 19 |
| EPIC-039 — Réconciliation et restitution | STORY-268 → 273 | 27 *(dont 8 hors service)* |
| EPIC-040 — Annulation et audit | STORY-274 → 276 | 8 |
| EPIC-041 — Abonnements et entitlements | STORY-277 → 282 | 19 *(dont 5 hors service)* |
| EPIC-042 — Multi-pays, console, recette | STORY-283 → 288 | 18 |
| **Total** | **54 stories** | **196 pts** *(dont 13 hors service)* |

**183 points imputables à l'équipe `paiement-service`**, contre les ~94 annoncés au PRD et les 104 du
découpage précédent. L'écart n'est pas une dérive de périmètre : c'est le même effet que sur
`notification-service`, dont l'estimation s'était révélée **basse de 50 %** au découpage réel. Le
périmètre livré est exactement celui du PRD.

**Ordre de construction et calendrier (sprints 31 → 38) :**

| Sprint | Contenu | Pts |
| --- | --- | --- |
| **S31** | Socle distributeur (auth, 21 pts) + amorce `paiement-service` — 237, 238, 239 | 29 |
| **S32** | 🏁 EPIC-035 — audit chaîné, séparation des pouvoirs, comptes, secrets · amorce EPIC-036 | 27 |
| **S33** | 🏁 EPIC-036 — deux modes de checkout, routage, registre administrable · ouverture de la créance | 30 |
| **S34** | Le lien, les frais, la boîte de réception, le ledger et l'imputation | 30 |
| **S35** | ⛔ **STORY-268 en tête** · 🏁 EPIC-037 et **incrément 1** · ouverture du terrain | 31 |
| **S36** | 🏁 EPIC-038 et EPIC-039 · producteur d'événements d'abonnement (277, 278) | 31 |
| **S37** | 🏁 EPIC-040 et **incrément 2** · ⛔ **STORY-279 en tête** · 🏁 EPIC-041 | 21 |
| **S38** | 🏁 EPIC-042, **incrément 3** et **MODULE 2 LIVRÉ** — recette de bout en bout | 18 |

**Règle de placement des préalables.** Un préalable ne se loge **jamais dans le même sprint que ce
qu'il débloque** : un glissement de deux jours sur le préalable emporte son consommateur dans la même
itération, et le sprint échoue en bloc plutôt qu'à la marge. Les deux chantiers hors service sont donc
posés **un sprint devant**, en tête de sprint — STORY-268 au S35 pour EPIC-039 au S36, et STORY-279 au
S37 avant les stories du même sprint dont l'effet en dépend, son producteur STORY-278 ayant été avancé
au S36 pour que le contrat d'événement existe avant qu'on écrive le consommateur.

## Ce découpage remplace le précédent

Décision PO du **2026-08-03**. Les 18 stories `paiement-service` du découpage EPIC-004 rescopé —
**STORY-150 → STORY-165, STORY-168, STORY-169** (104 pts, sprints 31→34) — passent en
`superseded_stories`. STORY-166, STORY-167 et STORY-171 ne sont **pas** concernées : elles portent sur
`auth-service` (rôles distributeur) et restent au sprint 31.

Ce qui est **repris** du découpage précédent plutôt que perdu :

| Ancienne story | Devient | Ce qu'elle apportait et qui manquait ici |
| --- | --- | --- |
| STORY-168 | **STORY-289** | Le registre **administrable** — activer un fournisseur par pays sans déploiement |
| STORY-169 | **STORY-290** | La créance **saisie à la main** — chemin A, sans quoi l'écran distributeur porte sur un objet inexistant |
| STORY-162 | STORY-278 + 279 | L'octroi d'entitlement **par événement** (tranche C8) — décision déjà prise le 2026-08-02, ratifiée par AD-13 |
| STORY-159 | STORY-259 + 272 | Le solde ventilé **certain / sous réserve** — déjà acquis, précisé en `restantCertain` / `restantAffiche` |

Ce que ce découpage **ajoute** et que le précédent n'avait pas : l'index unique **partiel** (une
déclaration manuelle n'a ni fournisseur ni référence — l'ancienne STORY-154 s'en remettait à une clé
« dérivée »), le **trop-perçu** (absent partout), l'**imputation par le montant dû** (AD-18), et les
deux **conditions hors service** rendues visibles comme des stories plutôt que comme des risques de
revue de conception — l'ancienne STORY-157 listait « le patron 089/090 est réécrit » en risque, là où
la décision PO du 2026-08-03 est une bibliothèque partagée extensible par domaine.

### Table de correspondance — ancienne référence → nouvelle

**Seule autorité** pour résoudre une référence à l'ancien découpage. Les 18 fichiers
`stories/STORY-15x|16x.md` portent une bannière ⛔ et ne doivent pas être implémentés ; leur contenu
reste consultable comme contexte métier.

| Ancienne | Nouvelles | Ce que portait l'ancienne |
| --- | --- | --- |
| STORY-150 | 237, 238, 239 | Scaffold, base, outbox, santé |
| STORY-151 | 242, 243, 244 | Comptes d'encaissement, secrets, vérification |
| STORY-152 | 245, 246, 248, 249 | `PaymentProvider`, capacités, routage, réacheminement |
| STORY-153 | 251, 252, 253 | Créance projetée, demande, lien public |
| STORY-154 | 254, 255, 256, 257, 258, 259 | Encaissement, idempotence, partiel, frais |
| STORY-155 | 265, 266 | Promesse et son sort |
| STORY-156 | 262, 263, 264 | Hors Prospera : déclaré → validé → écart |
| STORY-157 | 268, 269, 270, 271 | Relevé, cascade de clés, orphelins |
| STORY-158 | 274, 275 | Annulation constatée, contre-passation |
| STORY-159 | 259, 272 | Solde certain / sous réserve |
| STORY-160 | 240, 241, 276, 286 | Droits, audit, console |
| STORY-161 | 277 | Abonnement Prospera |
| STORY-162 | 278, 279 | Entitlements par événement (tranche C8) |
| STORY-163 | 280, 281, 282 | Impayé, grâce, rétablissement |
| STORY-164 | 250, 283, 284, 285 | Pays, devises, exactitude monétaire |
| STORY-165 | 288 | e2e du parcours de Kossi |
| STORY-168 | 289 | Registre plateforme administrable |
| STORY-169 | 290 | Créance saisie manuellement |

**21 stories frontend et mobile citent encore l'ancienne numérotation** — AP-13 à AP-18, DI-02 à
DI-10, MB-02 à MB-04, PY-00 à PY-03. Leurs citations sont enchâssées dans la prose et pointent
souvent un critère d'acceptation précis (« STORY-154 AC 1 ») : elles se résolvent par cette table,
story par story, et non par un remplacement mécanique.
