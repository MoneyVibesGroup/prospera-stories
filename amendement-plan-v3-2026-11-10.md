# Amendement du plan v3 : le moteur d'installation et l'instance sur site avant février · **proposition à valider le 13/11**

> **Date :** 2026-11-10 · **Statut :** 🟡 **proposé par Dev B, à valider par le PO le 13/11**
> **Amende :** `PLAN-2-DEVS-8-SEMAINES-2026-10-26.md` (v3 du 2026-11-09), **sans le modifier** : ce document
> est lu avec lui. Une fois validé, le plan renvoie ici pour §0, §5, §7, §8 et §9.
> **Source :** `prds/prd-moteur-installation-2026-11-09/prd.md` (§0, §8.1, §8.4) et `.memlog.md`
> (décisions du PO du 2026-11-10). **Contrat de module amendé le même jour** (C12, C13).
> **Auteur :** Dev B

---

## 0. Objet

Le PRD du moteur d'installation tire quatre conséquences pour le plan :

1. **D3 est révisée** : l'instance sur site est prête avant février 2027 (§1).
2. **Toutes les exigences du moteur sont dues pour février**, la démo du 15/01 en montrant la partie A (§2).
3. **Un ordre de sacrifice est décidé** si février glisse (§3).
4. **La charge réelle de Dev B change** : elle se chiffre ici, et elle ne tient pas dans le plan tel quel (§5).

Ce document ne crée aucune story. Il ne change ni les 8 semaines, ni la démo du 15/01, ni la règle de
vitesse de Dev A (80 à 100 points par semaine).

---

## 1. D3 révisée

| | Plan v3 (2026-11-09) | **Révisée (PO, 2026-11-09, séance ; actée ici)** |
|---|---|---|
| D3 | Le profil `docker compose` par module dans les 8 semaines ; **le packaging client complet après** | **L'installation complète chez le client est prête avant février 2027** : licence, mise à jour, retour arrière, supervision, canal de données |
| Raison | Tenir le cadrage des 3 projets | **Février 2027 a deux clients** : une assurance **sur ses serveurs**, un distributeur **sur les serveurs de Money Vibes**. Les deux modes d'hébergement doivent être prêts |
| Ce qui reste vrai | Le profil compose (C10) est la première brique et sert à la recette | idem |

À reporter dans : plan v3 §8 (D3), contrat de module §9 (✅ fait le 2026-11-10), AD-P17 de
`architecture-prospera-ecosystem-2026-07-04.md`.

---

## 2. Toutes les exigences du moteur pour février

Le PRD a **trois parties** : **A. Activer** (dans `platform-catalog-service`), **B. Livrer et mettre à
jour l'instance**, **C. Données et apprentissage**.

| Jalon | Exigences dues | Où |
|---|---|---|
| **Démo du 15/01/2027** (SM-1) | partie A : FR-1 → FR-9, FR-12, FR-34 → FR-37 | espace d'essai de la plateforme Money Vibes |
| **Février 2027** | **toutes les FR** (parties A, B et C) | les deux espaces, sur la plateforme et sur site |

Précisions du PO :
- **SM-1** est réécrit : *« en une action dans l'essai, sans rouge hors prérequis externes »*.
- La démo du 15/01 reste sur le **pack commercial** ; l'écart avec les **4 modules** que Dev A livre (réseau,
  PDV, catalogue, stock) est **connu et assumé**.
- Pour FR-30 et FR-31, février livre le **circuit** ; le premier modèle commun arrive quand les données le
  permettent, **au plus tôt au 2ᵉ semestre 2027**.
- **Reprise de données** et **Connecteurs** ont **leur propre PRD**, au lot 1, requis en février.

---

## 3. L'ordre de sacrifice, si février glisse

Décision du PO (2026-11-10), classement de la salle. Il **s'adapte au fil du projet**.

| Groupe | Exigences | Version minimale si on dégrade |
|---|---|---|
| **Jamais sacrifiées** | FR-1 → FR-9, FR-11, FR-12, FR-14, FR-15, FR-17 (sur site), FR-18, FR-19, FR-22, FR-23, FR-24 (IA calibrée de l'assureur), FR-25, FR-32 → FR-38, FR-40, FR-41 ; NFR-1 → NFR-4, NFR-6 → NFR-8 ; FR-42, FR-43 et NFR-11 *(classement à confirmer)* | — |
| **Dégradables** | FR-10 | rafraîchissement par un script lancé à la demande |
| | FR-13 | même console ; les écarts sont listés |
| | FR-16 | supervision réduite à la liste des instances et au dernier contact |
| | FR-17 (plateforme) | fenêtre annoncée, sans interrupteurs de changement |
| | FR-26, FR-27 | registre et garde, sans écran côté client |
| | FR-28 | export manuel, approuvé par écrit |
| | FR-29 | **niveau 2 fermé** tant que le poste d'accès enregistré n'existe pas |
| | FR-39 | réinstallation après une majeure refusée avec un code nommé |
| | NFR-5, NFR-9, NFR-10 | mesurées, non bloquantes |
| **Sacrifiables, dans l'ordre** | 1. FR-30 et FR-31 (circuit du modèle commun) | aucun modèle réel avant le 2ᵉ semestre 2027 |
| | 2. FR-20 (vagues) | avec deux clients, le pilote est le premier |
| | 3. FR-21 (outillage de l'escalade) | la règle N-1 reste écrite et s'applique à la main |

L'essai prospect (FR-33) et l'IA calibrée (FR-24) ne sont **jamais** sacrifiés : le premier est l'outil de
vente de février, la seconde ce que l'assureur achète. FR-17 sur site est classée parmi les jamais
sacrifiées : le DSI de l'assureur en a besoin en février.

⚠️ **Ce que ce classement ne couvre pas** : il ordonne le **moteur**. Il ne dit pas si le moteur passe
avant le CRM interne, la gestion des sinistres ou la GED du plan (§5, §6, question 1).

---

## 4. Ajustements de stories déjà sur `dev`

Aucun contrat client n'est en cours : les droits présents sur `dev` sont des **données de test**,
réamorcées à la mise en route du moteur. **Pas de reprise de l'existant.**

| Story ou service | Ajustement | Quand |
|---|---|---|
| **STORY-727**, lot 2 | une échéance soldée **prolonge** les modules installés et note les autres « acquis, à installer » ; elle **ne crée plus de droit** | partie A du moteur |
| **STORY-727**, lot 4 | **préavis de 30 jours** avant la lecture seule (`preavisJusquau`), à la place de « échu ⇒ lecture seule immédiate » ; liste blanche d'export et d'états (FR-43) | partie A |
| **STORY-727**, lot 6 | un pack modifié ne s'applique qu'aux **nouveaux contrats** ; la propagation ne crée plus de droit | partie A |
| **STORY-727**, lot 7 | le **socle de vertical n'ouvre plus rien** ; `VerticalPack` devient le **catalogue du vertical** | partie A |
| **STORY-280** (`paiement-service`, catalogue) | l'impayé **ne suspend plus** (le jalon `IMPAYE` à J+7 ne produit plus `SUSPENDED`) ; le consommateur `suspension-par-impaye` sert à la **sanction décidée** | partie A |
| **STORY-281** | le préavis de J-7 est **renommé `RAPPEL`** (service paiement et modèles de notification) ; la régularisation sort du préavis ou de la lecture seule ; la grâce reporte l'échéance du droit d'utiliser *(à confirmer)* | partie A |
| **STORY-365** | requalifiée contre 166/167 : reste le filtrage par modules ouverts et la lecture des droits depuis les manifestes | semaine 5 |
| **`auth-service`** (STORY-167) | création des organisations **à la demande du moteur**, dans chaque espace, avec le même identifiant ; module `instance` traité comme les autres ; droit de **consentir** attribuable par le DG seul ; format de droit élargi aux codes de module à tiret ; **route interne réservée à l'identité de service du moteur, `organisationId` imposé** (décision du PO, 2026-11-11, spine du moteur AD-15) | **semaine 5, dans EPIC-142** (décision du PO, 2026-11-11 ; démo du 15/01), et non « avant le premier module à tiret » : Dev A tient `auth-service` en semaine 4 pour le passage du socle (EPIC-155), Dev B y entre le 07/12 (carte des dépôts, `epics-moteur-installation-2026-11-11.md`) |
| **`paiement-service`** (vente) | résoudre les dépendances dures **comme la console** ; refuser un élément non installable ; avenant automatique quand une majeure ajoute une dépendance ; un seul mode d'acquisition par élément ; **licence envoyée par e-mail à chaque paiement** | partie A, puis partie B |

> Le PRD (§8.4) cite les lots 2, 4, 6 et 7 de STORY-727 ; la demande de cadrage n'en citait que 2, 6 et 7.
> Le lot 4 est conservé ici : c'est lui qui porte le préavis de 30 jours.

**Ajustements par service, ajoutés le 2026-11-11 (spine du moteur d'installation, AD-42 et AD-23).** Les
semaines sont des valeurs de départ, à confirmer au chiffrage du 04/12.

| Service | Ajustement | Quand |
|---|---|---|
| **`platform-catalog-service`** | Redis et BullMQ entrent dans son périmètre (émission d'`etat-publie.changed` à l'heure dite) ; verrou de l'outbox ; champs de manifeste dans `ModuleVersion` (C1) ; retrait des **quatre chemins d'octroi** d'un droit et réamorçage des données de test ; consommateur d'impayé | semaine 5 |
| **`paiement-service`** | contrat consommé par la centrale (faits de paiement relayés par l'agent de la plateforme) ; **read-model de manifestes** pour la vente ; topics `paiement.abonnement.*` ; jalons J-7 et J+7 = relances, sur son horloge | semaines 5 et 6 |
| **`prospera-microfinance-service`**, **`bilan-service`**, **`notification-service`**, **`balance-service`** | **double lecture** de l'état publié dans la garde (la doublure d'abord, la vraie route ensuite) ; `entitlement.changed` cesse de fermer | semaine 6 pour ceux que Dev A livre d'ici le 15/01, sinon à leur prochaine gate ; la doublure est éteinte au premier gate |
| **Tous les services** | migration de `kafkajs` vers `@confluentinc/kafka-javascript`, **Node 24** et schémas enregistrés au registre, dans la version de plateforme 1.0 ; MongoDB 8.0 dans le gabarit d'instance | avant février |

**Stories à ouvrir avant la semaine 5 (07/12)** (backlog `prospera-stories`, sans numéro encore) :
- `auth-service` : route de naissance à identifiant imposé, réservée à l'identité de service du moteur ; format de droit élargi aux codes de module à tiret ;
- `platform-catalog-service` : Redis et BullMQ, verrou de l'outbox, champs de manifeste de `ModuleVersion`, retrait des quatre chemins d'octroi et réamorçage ;
- double lecture de l'état publié dans les gardes de `paiement-service`, `prospera-microfinance-service`, `bilan-service`, `notification-service` et `balance-service` ;
- `prospera-plateforme` : dépôt, CI de publication, contrats agent-centrale-partie A et vecteurs signés ;
- socle d'espace : Karapace, MongoDB 8.0, Node 24 ;
- migration de `kafkajs` vers `@confluentinc/kafka-javascript` dans la version 1.0 ;
- `paiement-service` : contrat consommé par la centrale et read-model de manifestes pour la vente.

---

## 5. La charge de Dev B · **[À CHIFFRER au 04/12]**

Chiffrage **grossier**, sur la vitesse mesurée (80 à 100 points par semaine) et sur la taille des exigences
du PRD. Il sera remplacé par le chiffrage consolidé du 04/12 (plan §4).

| Partie | Contenu | Estimation de départ |
|---|---|---|
| **A. Activer** | offres, dépendances, point de décision unique, vérifications, bilan, répétition générale, essai et essai prospect, état publié, organisation dans deux espaces, lecture seule et export (FR-1 → FR-13, FR-33 → FR-43) | **5 à 6 semaines** |
| **B. Livrer et mettre à jour l'instance** | licence signée et horloge scellée, sanction à distance, connexion sortante et supervision, mises à jour, retour arrière, correctifs, vagues, fichier, support, IA du client intouchable, montage de l'instance, fin de contrat (FR-14 → FR-25, FR-32, FR-41) | **7 à 8 semaines** |
| **C. Données et apprentissage** | indicateurs de niveau 0, registre des consentements, niveaux 1 à 3, retour du modèle commun (FR-26 → FR-31) | **3 à 4 semaines** |
| **Transversal** | gardes C12 et C13 au gabarit, ajustements du §4, recette croisée des deux modes d'hébergement | **2 semaines** |
| **Total** | | **17 à 20 semaines de Dev B** `[À CHIFFRER au 04/12]` |

**Ce que Dev B a réellement :** du 07/12 à la fin de février, il reste **10 semaines** (07/12 → 18/12,
puis 04/01 → 26/02, pause des fêtes déduite). Le plan v3 les emploie déjà : moteur (sem. 5), CRM interne
(sem. 6), sinistres (sem. 7), GED (sem. 8).

**Ajouts de la spine du moteur (2026-11-11), non compris dans le total ci-dessus.** La spine découpe le
moteur en quatre unités (centrale, agent d'instance, partie A, apprentissage) et ajoute :
- **≈ 39 points de socle** : centrale, agent d'instance et service d'apprentissage ;
- **l'infrastructure** : registre d'images, autorité de certificats, cérémonie des clés (deux clés
  matérielles hors ligne, deux détenteurs), second hôte pour la centrale, second support de sauvegarde sur
  site (aucun TPM en v1, décision du PO, 2026-11-11) ;
- **les migrations** : `kafkajs` vers `@confluentinc/kafka-javascript`, Node 24, MongoDB 8.0, registre de
  schémas Karapace ;
- **les stories d'alignement** des services existants (ci-dessus, §4).

**Écart : 7 à 10 semaines**, qui **s'aggrave** de ces ajouts, avant deux ajouts du PO du 2026-11-10 et du 2026-11-11, non chiffrés : la mise à la règle C8 de l'app expert-comptable (Dev B, pour février) et le module d'écran `reprise` dans `prospera-app` dès février (Reprise devenue module installable, M44). Ils **creusent** l'écart. Trois façons de le couvrir, non exclusives (question 1) :
- **retirer** de Dev B le CRM interne, les sinistres et la GED, qui passent **après février** (≈ 3 semaines) ;
- **renforcer** par Dev A à partir du 18/01, au prix du démarrage de la microfinance prévu ce jour-là
  (question 3), sur les parties B et C (≈ 5 à 6 semaines) ;
- **dégrader** selon le §3 : sans FR-30/31, FR-20 et FR-21, on retire ≈ 2 à 3 semaines.

Sans une de ces trois voies, **février ne tient pas**. C'est dit ici pour que le PO choisisse le 13/11, et
non pour que la charge se découvre en janvier.

---

## 6. Impacts sur le calendrier (plan §5)

| Semaine | Impact |
|:--:|---|
| **1** (09/11 → 13/11) | Le lot 1 de Dev B compte désormais **trois PRD** (moteur, Reprise de données, Connecteurs) plus le contrat de module amendé (C12, C13). Dev A enregistre `reseau` **avec le manifeste au nouveau format** (`depends: [{ code, raison }]`, `retourArriere`, routes d'export) |
| **2 à 4** | Cadrage inchangé. Chaque PRD porte la section « Contrat de module » de **treize** lignes. Dev B produit la **liste de tous les modules à manifester** (module, propriétaire, date), toutes verticales, **avant le 13/11** |
| **4** (30/11 → 04/12) | ⏱ **La spine du moteur est due avant la semaine 5 (07/12)** : découpage des services des parties B et C, mécanisme d'ancrage de l'horloge scellée, spine de la coque. Le chiffrage consolidé du 04/12 **remplace** le §5 |
| **5** (07/12 → 11/12) | Moteur d'installation, partie A : point de décision, `depends` au catalogue, état publié, STORY-365 requalifiée |
| **6** (14/12 → 18/12) | Moteur, partie A (essai, bilan, mise en service) **au lieu du CRM interne** ⇒ le CRM interne **glisse** (question 1) |
| **7 et 8** (04/01 → 15/01) | Moteur, parties A puis B (licence, agent d'instance) **au lieu des sinistres et de la GED** ⇒ le noyau assurance du 15/01 **est réduit** (question 1). **Démo du 15/01 : la partie A** (SM-1), sur le pack commercial |
| **Après le 15/01** | Parties B et C jusqu'en février ; recette des deux modes d'hébergement ; microfinance (démarrage prévu le 18/01) à reconfirmer |

**Ajouts du 2026-11-11 (spine du moteur d'installation, AD-41).**
- **Tranche de départ, semaines 5 et 6** : les contrats signés avec leurs vecteurs, un agent simulé qui
  contacte une centrale simulée, vérifie un état voulu signé et applique une licence, avec le test croisé.
  La **démo du 15/01** montre la partie A sur l'espace d'essai de la plateforme, le port d'heure branché sur
  l'horloge système de Money Vibes ; l'agent complet de la plateforme est monté avant février.
- **Recette croisée des deux modes d'hébergement** (sur la plateforme et sur site) : une instance de test
  complète, deux espaces, qui contacte une centrale de recette par le réseau puis par fichier ; elle ferme
  le moteur en février.

Le plan §6 (« ce que fini veut dire ») perd sa ligne **CRM interne en service** et réduit sa ligne
**Assurance** tant que la question 1 n'est pas tranchée.

---

## 7. Durée de maintenance d'une version majeure

**3 ans, comme Odoo** (décision du PO, 2026-11-10). Elle est **publiée par version majeure** et borne :
- les **correctifs critiques** reçus par une instance figée (critique = CVSS ≥ 9 ou faille exploitée) ;
- la **fenêtre N/N-1** : hors fenêtre, fin du support contractuel et escalade au DG, sans promotion forcée ;
- la **prévenance du DG** avant la fin de maintenance de sa version (90 jours, valeur de départ).

Une version majeure sort donc avec sa **date de fin de maintenance**, trois ans plus tard.

---

## 8. Ce que cela change ailleurs dans le plan

| Section du plan | Changement |
|---|---|
| §0 | La colonne de Dev B (semaines 5 à 8) devient celle du moteur, parties A puis B (§6) |
| §1.3 | « Dix clauses » devient **treize** : C12 et C13 (`CONTRAT-DE-MODULE-2026-11-09.md`) |
| §5 | Voir §6 ci-dessus |
| §7 | « On ne sacrifie jamais » : le moteur d'installation **sur site comme sur la plateforme** ; l'ordre du §3 s'ajoute |
| §8 | D3 : voir §1 |
| §9 | Nouveau risque : **la charge de Dev B dépasse ses semaines disponibles** (§5), parade : la voie choisie le 13/11 |

---

## 9. Questions au PO pour le 13/11

1. **Comment couvrir l'écart de charge (§5) ?** Retirer à Dev B le CRM interne, les sinistres et la GED
   (après février) ? Renforcer par Dev A à partir du 18/01 ? Dégrader selon le §3 ? Ou une combinaison.
2. **Le noyau assurance du 15/01** (sinistre déclaré, numérisé, traité, retrouvé) **est-il maintenu** ? Il
   consomme les semaines 7 et 8 de Dev B.
3. **Le démarrage de la microfinance le 18/01** est-il maintenu si Dev A renforce le moteur ?
4. **Le classement de FR-42, FR-43 et NFR-11 parmi les jamais sacrifiées** est-il confirmé ?
5. **Q3 du contrat de module** : la raison de la décision n'est plus vraie (l'impayé ne suspend plus). La
   décision « le dépendant reste ouvert, la dépendance se déclare `SUSPENDU` » tient-elle ?
6. **C12 et C13 sont-elles validées** comme clauses du contrat de module, avec le test « promouvoir, saisir,
   revenir, tout se relit » obligatoire par module dès la prochaine gate de chaque service existant ?
7. **La liste des modules à manifester** (module, propriétaire, date), remise avant la séance : qui prend
   quels manifestes, et la date limite du pack Terrain & Ventes avant le 15/01 ?
8. **La validation juridique** des clauses d'apprentissage et du contrat client (loi 2019-014) : le juriste
   est-il identifié, pour une réponse avant la signature du premier contrat en février ?
9. **Qui amende AD-P17** dans `architecture-prospera-ecosystem-2026-07-04.md` pour y inscrire D3 révisée ?
