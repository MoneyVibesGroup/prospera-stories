---
stepsCompleted: [1, 2]
inputDocuments:
  - prospera-stories/prds/prd-reprise-donnees-2026-11-10/prd.md (FR-1 → FR-24, NFR-1 → NFR-6, SM-1 → SM-5, UJ-4, UJ-5)
  - prospera-stories/prds/prd-connecteurs-2026-11-10/prd.md (FR-1 → FR-21, NFR-1 → NFR-6, SM-1 → SM-5, UJ-6 → UJ-8)
  - prospera-stories/architecture/architecture-reprise-donnees-2026-11-11/ARCHITECTURE-SPINE.md (finale, 34 AD, PR #409)
  - prospera-stories/architecture/architecture-connecteurs-2026-11-12/ARCHITECTURE-SPINE.md (finale, 35 AD, PR #410)
  - prospera-stories/manifestes/reprise.manifest.ts, prospera-stories/manifestes/connecteurs.manifest.ts
  - prospera-stories/epics-moteur-installation-2026-11-11.md (plan semaine par semaine, carte des dépôts, EPIC-142 → 160)
  - prospera-stories/amendement-plan-v3-2026-11-10.md (§3 ordre de sacrifice, §4, §5 écart de charge)
  - prospera-stories/prds/prd-moteur-installation-2026-11-09/manifestes-a-produire.md (M01 → M44)
  - prospera-stories/sprint-status.yaml (reserved_ranges : EPIC-142 → 299, relevé du 2026-11-12)
---

# Reprise de données et Connecteurs — Découpage en épics

## Vue d'ensemble

Découpage des PRD **Reprise de données** (M44) et **Connecteurs** (M43) et de leurs spines en **épics**, comme pour le
moteur et le stock : les fiches de stories ne sont **pas** écrites ici, mais par celui qui code la story, juste avant de la
coder. Chaque épic porte son **backend** et ses **écrans**, et sa fin se prouve de bout en bout sur le vrai backend, sans mock
(règle des épics du moteur). **Tous les écrans sont faits par Dev B** (spine de la Reprise AD-23, spine de Connecteurs AD-28).

**Ce qui est dû, et quand.**
- **Avant la pause du 21/12** : le **kit des cibles** (EPIC-161), premier chantier, qui doit exister **avant le point d'import
  de `pdv`** (décision du PO du 2026-11-12, spine de Connecteurs AD-12) ; les contrats de Connecteurs que les modules cibles et
  la coque doivent déjà respecter (EPIC-169).
- **Le 15/01** : la démo du distributeur montre la Reprise. Un prospect dépose ses fichiers dans son essai, lit le rapport,
  valide et retrouve ses données ; une cible au minimum, `pdv` (spine de la Reprise AD-23).
- **En février** : la mise en service des deux clients attend le **feu vert** de la Reprise. Le distributeur (hébergé) fournit
  des fichiers ou un export Sage et quitte Sage ; l'assureur (sur site) fournit un export Excel.
- **Après février** : Connecteurs. Aucun client de février ne garde son logiciel (spine de Connecteurs AD-32). Ses épics
  (EPIC-170 → 179) sont écrits et chiffrés au 04/12, mais **non placés** : ils partent au premier contrat signé qui déclare
  un logiciel du client, avec un délai de construction annoncé avant la signature.

**Identifiants.** Épics **EPIC-161 → EPIC-179** : Reprise 161 → 168, Connecteurs 169 → 179. Ils sont pris dans la plage
réservée à Dev B (`EPIC-142 → 299`) et inscrits au registre le jour du découpage. **Aucun `story_id` n'est réservé** : chaque
fiche prend le suivant de la plage de celui qui la code (`STORY-900 → 1199` pour Dev B, `STORY-730 → 899` pour Dev A), au
moment de l'écrire. Les écrans prennent leur identifiant dans leur série : coque `PRA-100+`, console `AP-38+`. Relevé du
2026-11-12 sur toutes les branches distantes : EPIC-161 et suivants n'apparaissent que comme « à écrire » dans les deux
spines ; le checkout partagé n'a aucun fichier non suivi.

## Requirements Inventory

### Functional Requirements — Reprise de données

- **FR-1** : Des sources multiples, un seul format commun
- **FR-2** : Chaque objet garde sa trace d'origine
- **FR-3** : Les fichiers déposés restent chez le client
- **FR-4** : Les tables de correspondance
- **FR-5** : Un état repris est un état valide
- **FR-6** : Les dates d'origine, jamais la date d'import
- **FR-7** : Jamais de zéro silencieux
- **FR-8** : Deux régimes
- **FR-9** : Le périmètre par métier
- **FR-10** : Le stock d'ouverture se compte, il ne se reprend pas
- **FR-11** : Le rapport de reprise
- **FR-12** : Les doublons se fusionnent sous contrôle
- **FR-13** : Le client valide avant que rien n'entre
- **FR-14** : Livrer aux modules cibles par leur contrat
- **FR-15** : L'écart nul, puis le feu vert par sous-ensemble
- **FR-16** : La répétition générale, puis la reprise fraîche
- **FR-17** : La marche en parallèle
- **FR-18** : Les clés de rattachement
- **FR-19** : Le même moteur pour Money Vibes et, plus tard, pour le client
- **FR-20** : L'historique nourrit la calibration, sous les règles du contrat
- **FR-21** : Un module installable, un comportement par état publié
- **FR-22** : L'effacement du prospect non signé
- **FR-23** : La Reprise lit la source, elle ne l'écrit jamais
- **FR-24** : Le relais à Connecteurs, à un point de coupure daté

### Functional Requirements — Connecteurs

- **FR-1** : Les adaptateurs
- **FR-2** : Un propriétaire par domaine
- **FR-3** : Permanent par défaut, temporaire par offre
- **FR-4** : Des mouvements, jamais des totaux
- **FR-5** : Trois niveaux de fraîcheur
- **FR-6** : La file d'envoi : rien n'est perdu
- **FR-7** : Les refus, en clair
- **FR-8** : La file des écarts
- **FR-9** : Le contrôle de concordance, chaque nuit
- **FR-10** : Prospera ne s'arrête jamais à cause du connecteur
- **FR-11** : Les mentions de fraîcheur
- **FR-12** : Le bandeau de la file d'envoi
- **FR-13** : Qui est prévenu
- **FR-14** : Distributeur et Odoo
- **FR-15** : IMF
- **FR-16** : Assureur
- **FR-17** : Livrer par étapes
- **FR-18** : Le connecteur dans l'essai
- **FR-19** : Le connecteur selon l'état publié
- **FR-20** : Reprendre le relais de la Reprise
- **FR-21** : Mise à jour et retour arrière

*24 + 21 exigences fonctionnelles. Le texte qui fait foi est celui du PRD, amendé par sa spine ; chaque story cite la FR
qu'elle sert, préfixée du module quand il y a ambiguïté (« Reprise FR-15 », « Connecteurs FR-8 »).*

### NonFunctional Requirements

**Reprise :**
- **NFR-1, idempotence** : rejouer un lot, ou une livraison, ne crée aucun doublon.
- **NFR-2, traçabilité** : lots, correspondances, fusions, requalifications, validations et feux verts journalisés en ajout seul ; pseudonymisés, jamais supprimés, à l'effacement d'un prospect.
- **NFR-3, confidentialité et cloisonnement** : sur site, aucune donnée reprise ni aucun fichier ne quitte l'instance ; seul le dossier d'installation passe de l'essai au réel.
- **NFR-4, volume** : 100 000 objets lus et rapportés en moins de 10 minutes sur le serveur de référence.
- **NFR-5, reprise sur incident** : un lot interrompu reprend où il s'était arrêté, sans recommencer ni doubler.
- **NFR-6, téléversement** : un gros fichier affiche sa progression et reprend après une coupure.

**Connecteurs :**
- **NFR-1, idempotence** : un mouvement reçu ou envoyé deux fois ne s'applique qu'une fois.
- **NFR-2, ordre** : par objet (`rang` attribué par la cible), dépendances tous domaines confondus (amendé par AD-6).
- **NFR-3, argent** : aucun chemin de code ne corrige seul un solde ou un encaissement ; un test de mutation le vérifie.
- **NFR-4, résistance** : file d'envoi et file des écarts survivent à un redémarrage.
- **NFR-5, confidentialité** : sur site, seuls des compteurs au schéma fermé remontent.
- **NFR-6, traçabilité** : propriétaires, arrêts, refus, décisions, interceptions journalisés en ajout seul.

**Indicateurs de réussite :**
- **Reprise SM-1 → SM-4** : écarts ouverts sur les données vivantes à la mise en service, objets dans un état invalide, dates métier égales à la date d'import, montants requis remplacés par zéro : **0** chacun.
- **Reprise SM-5** : reprises des deux clients de février validées par le client, réception définitive enregistrée : **2**.
- **Connecteurs SM-1 → SM-4** : corrections d'argent automatiques **0** ; mouvements perdus ou doublés **0** ; mouvements `IMMEDIAT` dans le délai **≥ 95 %** ; concordances finies avant 6 h **100 %**.
- **Connecteurs SM-5** : connecteur Odoo du premier client qui garde Odoo en service, étapes 1 à 3 de FR-17 (plus requis en février).

### Additional Requirements

Décisions d'architecture des deux spines (statut final), avec l'épic qui les tient ; chaque story cite les AD qu'elle tient.

**Spine de la Reprise** (`architecture/architecture-reprise-donnees-2026-11-11/ARCHITECTURE-SPINE.md`) :

- **AD-1** : Le lot avance par étapes figées → EPIC-163
- **AD-2** : Le format commun est le schéma d'objet de la cible → EPIC-161, EPIC-165
- **AD-3** : La clé d'origine suit un objet de la reprise aux mouvements → EPIC-161, EPIC-164
- **AD-4** : Le point d'import de la cible : un contrat, deux modes → EPIC-161
- **AD-5** : Les règles métier restent chez la cible, qui simule → EPIC-163, EPIC-165
- **AD-6** : On corrige par des règles, jamais par une cellule → EPIC-162, EPIC-163
- **AD-7** : Ce qui passe de l'essai au réel → EPIC-166
- **AD-8** : Valider engage deux empreintes → EPIC-164
- **AD-9** : Doublons, fusions et alias → EPIC-164 (index des alias : EPIC-161 ; normalisation : EPIC-162)
- **AD-10** : Une seule identité vers les cibles → EPIC-161, EPIC-163
- **AD-11** : Le comptage d'ouverture est un lot de la Reprise → EPIC-167
- **AD-12** : Le feu vert : par module cible, un état absolu → EPIC-166 (contrat publié par EPIC-161)
- **AD-13** : Réconcilier par les valeurs de contrôle de la cible → EPIC-166 (route : EPIC-161 ; fonction : EPIC-162)
- **AD-14** : Les dates d'origine voyagent sans glisser → EPIC-162
- **AD-15** : Les fichiers : tus, MinIO de l'espace, suppression tracée → EPIC-163 (dépôt), EPIC-166 (suppression)
- **AD-16** : Les noms des routes de C13 et de la reprise → EPIC-161, EPIC-163, EPIC-166
- **AD-17** : La Reprise, module installable → EPIC-163, EPIC-166
- **AD-18** : Les adaptateurs : une interface, une bibliothèque pure → EPIC-162
- **AD-19** : L'historique : protégé, une calibration par lot initial → EPIC-164
- **AD-20** : Ce que la Reprise cède à Connecteurs → EPIC-174
- **AD-21** : Les contrats nommés de la Reprise → EPIC-161 (publication), chaque épic pour sa part
- **AD-22** : Ce que cette spine change chez ses voisins → fait dans la PR #409
- **AD-23** : La tranche de février → ce découpage, EPIC-168
- **AD-24** : La gravité des écarts et la livraison partielle → EPIC-163, EPIC-164
- **AD-25** : Réouverture, correction après livraison, versions gelées → EPIC-166
- **AD-26** : Qui valide → EPIC-163 (`auth-service`), EPIC-164
- **AD-27** : Le jeton de service fixe l'organisation → EPIC-161
- **AD-28** : Un domaine, un écrivain → EPIC-174
- **AD-29** : Les fichiers non fiables → EPIC-162, EPIC-163
- **AD-30** : L'exploitation des lots → EPIC-163
- **AD-31** : Rétrocompatibilité (C12) → EPIC-163 (tranche de février), EPIC-166
- **AD-32** : Formes canoniques : empreintes, identifiant, nombres → EPIC-162
- **AD-33** : Suppression et effacement → EPIC-166
- **AD-34** : Mesures → EPIC-168

**Spine de Connecteurs** (`architecture/architecture-connecteurs-2026-11-12/ARCHITECTURE-SPINE.md`) :

- **AD-1** : Un connecteur, des domaines, des échanges acquittés → EPIC-171, EPIC-175
- **AD-2** : Les domaines sont déclarés par les modules cibles → EPIC-169 (contrat), EPIC-171
- **AD-3** : Un domaine, un propriétaire, un état absolu publié → EPIC-170, EPIC-171
- **AD-4** : Trois sortes d'échange ; jamais un total → EPIC-170, EPIC-174
- **AD-5** : L'identité d'un échange : clé d'origine, identifiant de mouvement, liaisons → EPIC-172, EPIC-174, EPIC-175
- **AD-6** : L'ordre : par objet, par rang de la cible, avec dépendances → EPIC-175
- **AD-7** : Le relevé : un curseur, un rythme par niveau, un chevauchement → EPIC-174
- **AD-8** : La file d'envoi : rien n'est perdu → EPIC-175
- **AD-9** : Refus, rejets et erreurs techniques → EPIC-172 (classement), EPIC-175
- **AD-10** : Le point d'échange de la cible → EPIC-170
- **AD-11** : Les mouvements en attente de confirmation chez la cible → EPIC-170 ; point d'écriture unique : EPIC-165
- **AD-12** : Le kit des cibles → EPIC-161 (part reprise), EPIC-170 (part échange)
- **AD-13** : La concordance de nuit et la file des écarts → EPIC-176
- **AD-14** : Trancher : la correction suit le chemin normal → EPIC-176
- **AD-15** : La nuit : un ordonnancement, une lecture du logiciel du client → EPIC-176, EPIC-178
- **AD-16** : La fraîcheur : `etat-synchro` et une table de seuils partagée → EPIC-169 (seuils), EPIC-177
- **AD-17** : La santé et les alertes : Money Vibes d'abord → EPIC-177
- **AD-18** : L'essai : destinations, bac à sable, identifiants en lecture seule, interception → EPIC-173
- **AD-19** : Ce qui passe de l'essai au réel → EPIC-171
- **AD-20** : Le relais de la Reprise → EPIC-174
- **AD-21** : Les états publiés : la garde de Connecteurs → EPIC-171, EPIC-170 (garde par opération)
- **AD-22** : Les identifiants de connexion → EPIC-171
- **AD-23** : Les adaptateurs d'écriture et Odoo → EPIC-172
- **AD-24** : L'export du logiciel du client, sans API → différé (premier client sans API)
- **AD-25** : Rétrocompatibilité, retour arrière, restauration et interrupteurs → EPIC-179 (interrupteur `odoo-json2` : EPIC-172)
- **AD-26** : Effacement, export et import par organisation → EPIC-171, EPIC-179
- **AD-27** : Connecteurs, module installable (M43) → EPIC-171
- **AD-28** : Les écrans → chaque épic, tous par Dev B
- **AD-29** : Les contrats nommés de Connecteurs → EPIC-169 (publication), chaque épic pour sa part
- **AD-30** : Mesures → EPIC-177, EPIC-176
- **AD-31** : Ce que cette spine change chez ses voisins → fait dans la PR #410
- **AD-32** : La tranche de février et l'ordre de construction → ce découpage, EPIC-165, EPIC-169
- **AD-33** : Bascule de propriétaire et arrêt de la synchro : un protocole → EPIC-178
- **AD-34** : Les états d'un domaine et d'un connecteur → EPIC-171, EPIC-178
- **AD-35** : Exploitation : volumes, reprises, priorités, rétention → EPIC-174, EPIC-175, EPIC-179

*34 + 35 AD. Les points marqués `[PROPOSÉ, à confirmer par le PO]` dans la spine de Connecteurs (D-18, D-43, D-44, D-48,
relecture de l'état publié à 15 minutes) restent à confirmer ; les stories qui les touchent le rappellent.*

### UX Design Requirements

Aucune spécification UX. Les écrans de la Reprise vivent dans le module d'écran **`reprise`** de la coque
(`prospera-app/src/modules/reprise/`), ceux de Connecteurs dans le module d'écran **`connecteurs`**
(`prospera-app/src/modules/connecteurs/`) ; la console Money Vibes emploie la même API. ⛔ **Règle n°1 du programme
front** : chaque écran passe d'abord par sa **maquette**, ajoutée dans `prototypes/prospera-prototype.html` et republiée sur
son Artifact, avant la story qui le code ; ses chiffres sont tirés du référentiel du dépôt, jamais inventés. Pour la démo du
15/01, les maquettes du dépôt, du rapport et de la validation sont dues **avant le 04/01**.

### FR Coverage Map

**Reprise :**

| FR | Épic |
|---|---|
| FR-1, FR-6, FR-23 | EPIC-162 — lire un fichier du client sans le trahir |
| FR-2, FR-3, FR-4, FR-5, FR-7, FR-11, FR-21 (garde, manifeste) | EPIC-163 — déposer, lire, contrôler, rapporter |
| FR-8, FR-12, FR-13, FR-14, FR-20 | EPIC-164 — valider, livrer, retrouver ses données |
| FR-9 ; FR-5, FR-7, FR-14 côté cible | EPIC-165 — les modules cibles reçoivent la reprise ; contrat porté par EPIC-161 |
| FR-15, FR-16, FR-21 (routes C13), FR-22 | EPIC-166 — essai puis réel, écart nul, feu vert |
| FR-10 | EPIC-167 — comptage d'ouverture |
| FR-19 ; SM-1 → SM-5 | EPIC-168 — les deux reprises de février, imports courants en libre-service |
| FR-17 | EPIC-178 — marche en parallèle (avec Connecteurs, après février) |
| FR-24 | EPIC-174 — relais à Connecteurs (route de cession) |
| FR-18 | différé : nom du topic réservé, charge décidée avec le PRD de la GED |

**Connecteurs :**

| FR | Épic |
|---|---|
| FR-5, FR-11 (seuils), contrats | EPIC-169 — contrats et point d'écriture unique, avant février |
| FR-2, FR-4, FR-10, FR-19 côté cible | EPIC-170 — kit des cibles, part échange |
| FR-2, FR-3 (mode), FR-19 | EPIC-171 — `connecteurs-service`, module installable |
| FR-1, FR-14 | EPIC-172 — adaptateur Odoo |
| FR-18 | EPIC-173 — le connecteur dans l'essai |
| FR-4, FR-5, FR-17 (étapes 1 et 2), FR-20 | EPIC-174 — relever, reprendre le relais |
| FR-6, FR-7, FR-10 | EPIC-175 — file d'envoi et refus |
| FR-8, FR-9, FR-17 (étape 3) | EPIC-176 — concordance de nuit et file des écarts |
| FR-11, FR-12, FR-13 | EPIC-177 — fraîcheur, santé, alertes |
| FR-3 (arrêt), UJ-8 | EPIC-178 — marche en parallèle, arrêt de la synchro |
| FR-21 | EPIC-179 — vivre les versions |
| FR-15, FR-16 | différés : logiciel de l'IMF (QK-18), logiciel de l'assureur (QK-17) |

**Couverture : 23 FR de la Reprise sur 24 (FR-18 différée) ; 19 FR de Connecteurs sur 21 (FR-15 et FR-16 différées).**
NFR de la Reprise : NFR-1, NFR-5 → EPIC-163 et 164 ; NFR-2 → EPIC-164 et 166 ; NFR-3 → EPIC-163, 166, 168 ; NFR-4 → EPIC-162,
163, 168 ; NFR-6 → EPIC-163. NFR de Connecteurs : NFR-1 → EPIC-170 et 175 ; NFR-2, NFR-4 → EPIC-175 ; NFR-3 → EPIC-176 ;
NFR-5 → EPIC-177 ; NFR-6 → EPIC-171, 175, 176, 173.

## Epic List

| Épic | Titre | FR | Propriétaire | Semaine |
|---|---|---|---|---|
| **EPIC-161** | **Le kit des cibles : une cible reçoit une reprise en déclarant ses objets** (premier chantier, avec les contrats de la Reprise) | Reprise FR-14 ; C2, C5, C13 | Dev B | **S4, fini le 04/12** |
| EPIC-162 | `prospera-adaptateurs` : lire un fichier du client sans le trahir | Reprise FR-1, FR-6, FR-23 | Dev A `[PROPOSÉ]` | S7 (tranche du 15/01), S9 (février) |
| EPIC-163 | Le lot de la Reprise : déposer, lire, contrôler, rapporter | Reprise FR-2 → FR-5, FR-7, FR-11, FR-21 | Dev A `[PROPOSÉ]` (écrans : Dev B) | S7 (tranche du 15/01), S9 (février) |
| EPIC-164 | Valider, livrer, retrouver ses données (**montré le 15/01**) | Reprise FR-8, FR-12 → FR-14, FR-20 | Dev A `[PROPOSÉ]` (écrans : Dev B) | S8 (tranche du 15/01), S9 (février) |
| EPIC-165 | Les modules cibles reçoivent la reprise : un point d'import dans le « fini » de chacun | Reprise FR-9 ; cibles | le propriétaire de chaque module cible | S5 → S10, à la semaine de chaque module (`pdv` en S5) |
| EPIC-166 | Essai puis réel : le dossier, la reprise fraîche, l'écart nul et le feu vert | Reprise FR-15, FR-16, FR-21, FR-22 | Dev A `[PROPOSÉ]` (écrans : Dev B) | S10 |
| EPIC-167 | Le comptage d'ouverture du stock | Reprise FR-10 | Dev A `[PROPOSÉ]` (écrans : Dev B) | S10 |
| EPIC-168 | Les deux reprises de février, de bout en bout, et les imports courants en libre-service | Reprise FR-19, SM-1 → SM-5 | Dev A `[PROPOSÉ]` (écrans : Dev B) | S11 → S13 |
| **EPIC-169** | Les contrats de Connecteurs et la règle du point d'écriture unique, avant février | Connecteurs FR-5, FR-11 ; C1 | Dev B | S5 (avec EPIC-142) |
| EPIC-170 | Le kit des cibles, part échange | Connecteurs FR-2, FR-4, FR-10, FR-19 | à décider au déclencheur | après février |
| EPIC-171 | `connecteurs-service` : un module installable, des domaines, un propriétaire chacun | Connecteurs FR-2, FR-3, FR-19 | à décider au déclencheur | après février |
| EPIC-172 | L'adaptateur Odoo | Connecteurs FR-1, FR-14 | à décider au déclencheur | après février |
| EPIC-173 | Le connecteur dans l'essai : lire le vrai, n'écrire jamais | Connecteurs FR-18 | à décider au déclencheur | après février |
| EPIC-174 | Relever le logiciel du client et reprendre le relais de la Reprise (FR-17, étapes 1 et 2) | Connecteurs FR-4, FR-5, FR-17, FR-20 ; Reprise FR-24 | à décider au déclencheur | après février |
| EPIC-175 | La file d'envoi et les refus : rien n'est perdu | Connecteurs FR-6, FR-7, FR-10 | à décider au déclencheur | après février |
| EPIC-176 | La concordance de nuit et la file des écarts : l'argent ne se corrige jamais seul (FR-17, étape 3) | Connecteurs FR-8, FR-9, FR-17 | à décider au déclencheur | après février |
| EPIC-177 | Fraîcheur, santé et alertes : Money Vibes le sait d'abord | Connecteurs FR-5, FR-11 → FR-13 | à décider au déclencheur | après février, avec 176 |
| EPIC-178 | La marche en parallèle, puis l'arrêt de la synchro domaine par domaine | Connecteurs FR-2, FR-3 ; Reprise FR-17 | à décider au déclencheur | après février |
| EPIC-179 | Vivre les versions : migrer, revenir, restaurer, désinstaller sans perdre un mouvement | Connecteurs FR-21 | à décider au déclencheur | après février |

**Dépendances** : 161 → 165 (`pdv`) → 163 → 164 (chemin de la démo du 15/01) ; 162 → 163 ; 164 → 166 → 168 ; 165 (`stock`)
→ 167 → 168. Connecteurs : 169 avant février ; puis 170 → 171 → 172 → 173 → 174 → 175 → 176 et 177 → 178 → 179 ; 174 lit la
route de cession de la Reprise, 178 étend le rapport de la Reprise. Chaque épic fonctionne avec ceux qui le précèdent seulement.

## Le kit des cibles : le premier chantier

Décision du PO du 2026-11-12 (spine de Connecteurs AD-12) : la mécanique commune des points d'entrée de la Reprise et de
Connecteurs vit dans **une** bibliothèque NestJS, `kit-cible`, publiée par `prospera-plateforme`. Le cadre fait la mécanique,
le module déclare ses objets, comme l'import d'Odoo (`base_import`, `load()` de l'ORM). C'est ce qui rend possible une
trentaine de modules cibles en février, sans coder trente fois la même garde, la même idempotence et la même simulation.

**Placement `[PROPOSÉ]` : Dev B, semaine 4 (30/11 → 04/12), une semaine, en entier.**
- C'est la **seule semaine avant le 21/12** où le chantier tient sans croiser un autre : Dev A fait le passage du socle dans
  les dépôts existants (« rien ne sort »), et `prospera-plateforme` n'appartient encore à personne. Dev B le crée une semaine
  plus tôt qu'EPIC-142, qui y ajoute en S5 les contrats du moteur.
- Le point d'import de `pdv` se code avec PDV bloc 1, chez Dev A, en **S5** : le kit doit donc être publié le **04/12**.
- Le kit ne dépend d'aucun service qui tourne. Ce qu'il emprunte au moteur (matrice des neuf états, garde partagée, jeton
  limité à l'organisation) arrive le 11/12 ; jusque-là, il lit une **doublure** de ces contrats derrière un port injecté,
  comme la doublure de la coque. Le 11/12, sa suite de conformité rejoue la matrice publiée, sans écart.
- **Un propriétaire unique** (Dev B), relu par Dev A (spine de Connecteurs AD-12). Une anomalie trouvée par Dev A en S5 se
  corrige dans le kit par Dev B, jamais dans le dépôt de la cible.
- **Seule la part reprise** est construite en S4. La part échange (EPIC-170) attend le déclencheur de Connecteurs ; le kit lui
  réserve sa place.
- ⚠️ **Ce que cela coûte** : Dev B devait finir en S4 les stories d'EPIC-142 → 147 et 159, le PRD du lot 4 et le chiffrage du
  04/12. Ces stories passent en S3 (question 3).

## Le plan semaine par semaine : ce que la Reprise y ajoute

Ce tableau **s'ajoute** au plan des épics du moteur (`epics-moteur-installation-2026-11-11.md`), qui reste la référence. Il ne
montre que les chantiers de la Reprise et de Connecteurs, et ce qu'ils déplacent. Placement `[PROPOSÉ]`, à trancher par le PO
(questions 1 et 2).

| Semaine | Dev A | Dev B | Croisement et fin de semaine |
|---|---|---|---|
| **S4** 30/11 → 04/12 | passage du socle (inchangé) | **EPIC-161** : le kit, part reprise, et les contrats de la Reprise | 🔁 **04/12** : `kit-cible` 1.0 publié, relu par Dev A ; contrats de la Reprise publiés (EPIC-146 s'y branche en S6) |
| **S5** 07/12 → 11/12 | EPIC-165 : point d'import de **`pdv`** (dans PDV bloc 1) et de `reseau` (dans sa finition) | **EPIC-169** (dans `prospera-plateforme`, avec EPIC-142) ; le kit passe sur la matrice publiée (ligne d'EPIC-145) | 🔁 **11/12** : le kit rejoue la matrice publiée ; `seuils-fraicheur@1` lu par la coque ; `pdv` passe la suite de conformité de la reprise |
| **S6** 14/12 → 18/12 | EPIC-165 : `catalogue`, `stock` (dans leurs semaines) ; coque : `creerTeleversement(code)` et `tus-js-client` (mécanique) | `auth-service` (sa semaine du dépôt, EPIC-146) : identité de service de `reprise-service`, droits `reprise:*`, `reprise:lot:valider` attribuable par le DG seul | 🔁 **18/12** : trois cibles vertes ; la Reprise a son identité et ses droits |
| *pause* 21/12 → 01/01 | — | — | — |
| **S7** 04/01 → 08/01 | **EPIC-162 et EPIC-163, tranche du 15/01**, à la place de « microfinance : modules d'écran et jeu de démonstration » | écrans d'EPIC-163 (5ᵉ chantier) ; réglages tus de Traefik dans le gabarit de `prospera-plateforme` | 🔁 **08/01** : dans l'essai d'un prospect, un fichier de points de vente donne son rapport |
| **S8** 11/01 → 15/01 | **EPIC-164, tranche du 15/01**, à la place de « recette de la démo microfinance » | écrans d'EPIC-164 (5ᵉ chantier) | 🎯 **15/01** : le prospect dépose ses fichiers, lit le rapport, valide et retrouve ses points de vente |
| **S9** 18/01 → 22/01 | EPIC-162, 163, 164 : **tranche de février** ; EPIC-165 : polices et sinistres | écrans de février (correspondances, fusion des doublons, montants à saisir) | |
| **S10** 25/01 → 29/01 | **EPIC-166**, **EPIC-167** | écrans d'EPIC-166 et 167 (montage de l'instance de l'assureur : inchangé) | 🔁 **29/01** : la partie A lit le feu vert ; l'effacement de la Reprise est prêt avant la fin du premier essai prospect (≈ 14/02) |
| **S11 → S13** 01/02 → 19/02 | **EPIC-168** : les deux reprises, puis les imports courants | écrans d'EPIC-168 ; mise en service des deux clients (inchangé) | 🎯 **Reprise SM-5 = 2** |

### La charge, dite ici et non découverte en janvier

La Reprise n'était dans aucun lot du plan v3, et son module d'écran n'était pas chiffré (amendement du plan v3 §5). Elle ajoute,
en chantiers d'une semaine :

| | Dev A | Dev B |
|---|---|---|
| Avant le 21/12 | 0 (les points d'import entrent dans la semaine de chaque module : quelques jours par module, mesurés au 04/12) | **1** (EPIC-161, en S4) ; EPIC-169 et la ligne d'`auth-service` tiennent dans des chantiers déjà prévus |
| 04/01 → 15/01 | **3** (162, 163, 164, tranches du 15/01) | **2** (écrans, en 5ᵉ chantier) |
| 18/01 → 19/02 | **≈ 5** (tranches de février, 166, 167, 168, polices et sinistres) | **≈ 3** (écrans) |

**Ce qui cède, si le PO suit la recommandation** (question 2) :
- chez Dev A, en S7 et S8, la **démo microfinance du 15/01** passe après le 15/01. C'est l'ordre de priorité du PO (« la
  microfinance en dernier, là où il reste du temps à gagner ») ; aucun client microfinance n'est attendu en février ;
- chez Dev A, en S9 et S10, **EPIC-158 puis EPIC-156** glissent, dans l'ordre de sacrifice du plan v3 §3 ;
- chez Dev B, un **5ᵉ chantier** d'écrans de S7 à S10, comme le permet la décision du PO du 2026-11-11 (« quatre au minimum,
  davantage quand une tranche l'exige »). L'écart de charge de Dev B (7 à 10 semaines, question 1 du 13/11) n'est pas réglé
  par ce découpage : il s'en aggrave d'environ cinq chantiers d'écrans.

## Carte des dépôts : ce qui s'ajoute

Même règle que le moteur : dans une semaine, Dev A et Dev B ne touchent jamais le même dépôt ; on ne croise qu'aux points nommés.

| Dépôt | S4 | S5 | S6 | S7 | S8 | S9 | S10 | S11 → S13 |
|---|---|---|---|---|---|---|---|---|
| `prospera-plateforme` | **B** (kit, créé) | B | B | B (Traefik tus) | B | B | B | B |
| `reprise-service` (neuf) | — | — | — | **A** | A | A | A | A |
| `prospera-adaptateurs` (neuf) | — | — | — | **A** | — | A | — | — |
| dépôt du module `pdv` | A (socle) | **A** (point d'import) | A | A | A | — | — | — |
| dépôts de `catalogue`, `stock` | A (socle) | A | **A** (points d'import) | A | — | — | A (stock : comptage) | — |
| `prospera-assurance-service` (polices, sinistres) | A (Kafka) | — | A | A | A | **A** (points d'import) | — | — |
| `auth-service` | A (socle) | — | **B** (identité et droits de la Reprise) | B | — | — | — | — |
| `prospera-app`, dossier `reprise` | — | — | — | **B** | B | B | B | B |
| `prospera-app`, mécanique (`creerTeleversement`) | — | A | **A** | A | A | — | — | — |
| `prospera-recette` | — | — | — | — | — | — | A (recettes de la Reprise) | A |

`prospera-app` reste partagé par dossier : le module d'écran `reprise` (et plus tard `connecteurs`) est un **troisième dossier
de Dev B**, après `instance` et `moteur`. ⚡ La ligne `prospera-assurance-service` en S9 ajoute une semaine de Dev A au dépôt :
elle remplace sa ligne « — » de la carte du moteur.

## Tranches verticales : les écrans de chaque épic

Toutes par Dev B. Coque `prospera-app` : `PRA-100+` ; console Money Vibes : `AP-38+`. Les stories d'écran sont recopiées dans
`frontend-sprint-status.yaml` au slotting.

| Épic | Coque, module d'écran `reprise` ou `connecteurs` (`PRA-`) | Console Money Vibes (`AP-`) |
|---|---|---|
| EPIC-161 | — (bibliothèque ; ses marqueurs sont rendus par `<ProtectionObjet>`, mécanique de la coque) | — |
| EPIC-162 | — (bibliothèque) | — |
| EPIC-163 | déposer un fichier (progression, reprise après coupure), choisir le gabarit et rattacher les colonnes, suivre l'avancement, lire le rapport, corriger une règle et rejouer ; février : correspondances, traductions d'état, lignes en erreur, PDF | la même API pour l'intégrateur Money Vibes |
| EPIC-164 | valider (ce qui est validé, et par qui), suivre la livraison, résultat par objet avec lien vers l'objet ; février : fusion des doublons, rattacher à un objet existant, montants à saisir par module | idem |
| EPIC-165 | — (écrans métier de chaque module, par leur propriétaire : `<ProtectionObjet>` pour `historique` et `montantASaisir`) | — |
| EPIC-166 | réconciliation par module (valeurs de la source et de la cible), feu vert par module, réouverture avec motif ; aucune action de mise en service | état des feux verts par organisation, lu par la partie A au bilan de mise en service (EPIC-146) |
| EPIC-167 | feuille de comptage par entrepôt (utilisable sur tablette), clôture du comptage, écart entre fichier et comptage | — |
| EPIC-168 | imports courants par le client seul (mêmes écrans) | compteurs SM-1 → SM-5 et contre-indicateurs par client |
| EPIC-169 | — (la coque lit `seuils-fraicheur@1` : mécanique de la coque) | — |
| EPIC-170 | — (`<ProtectionObjet>` gagne `autoriteExterieure` et `mouvementsEnAttente`) | — |
| EPIC-171 | configuration : connecteur, identifiants (écriture seule), propriétaire et niveau par domaine | connecteurs par client |
| EPIC-172 | bilan des prérequis : version et édition détectées, « testé » ou « non testé », droits du compte avec l'action à faire | — |
| EPIC-173 | bac à sable (déclaration, vérification), interceptions de l'essai, bilan des vérifications | — |
| EPIC-174 | domaines : synchronisation initiale, dernier échange ; rejets entrants | — |
| EPIC-175 | file d'envoi, refus (« Corriger et renvoyer »), lien vers l'objet source | — |
| EPIC-176 | file des écarts (deux valeurs côte à côte, décision, « réaligner sur le propriétaire »), rapport de concordance | — |
| EPIC-177 | mentions de fraîcheur et bandeau de la file (rendus par la coque), santé du connecteur | vue du parc (complète sur la plateforme, compteurs sur site) |
| EPIC-178 | période de marche en parallèle, rapport d'écarts de la période (module `reprise`), changer de propriétaire, arrêter un domaine | — |
| EPIC-179 | reprendre la file après un retour arrière, mouvements à vérifier après restauration, file figée à la réinstallation | — |

## Ce que ces épics attendent du moteur, et ce qu'ils lui rendent

| Attendu | Pour | Épic du moteur | Date |
|---|---|---|---|
| contrat d'état publié, garde partagée, matrice des neuf états avec les lignes « routes `reprise/*` », « échange » et « contrôles à deux identités » | kit (161), garde de la Reprise (163) | EPIC-142, EPIC-145 | 11/12 |
| jeton de service limité à l'organisation (claim `organisationId`, `ORGANISATION_HORS_JETON`) | kit (161) | EPIC-142 (ligne `auth-service` de l'amendement §4) | S5 |
| `objetsDeReprise` et `domainesEchange` au catalogue ; association objet → domaine rendue à la Reprise | rapport « non installé » (163), `DOMAINE_CEDE` (174) | EPIC-143 | S5 |
| installer une offre d'essai prospect où `reprise` est ouvert d'office | démo du 15/01 (164) | EPIC-144, EPIC-147 | S5, S6 |
| dossier d'installation, répétition générale, mise en service par sous-ensemble, `reception-definitive.enregistree` | 166 | EPIC-146 | S6 |
| plan d'effacement du prospect, qui appelle la route d'effacement de chaque propriétaire | 166 | EPIC-147 | S6 |
| `instance.journal` (l'agent inscrit les faits), sauvegardes, `HorlogeDeReference` | 164, 166 | EPIC-148, EPIC-149, EPIC-153 | S7, S8 |
| supervision des routes `sante` ; compteurs remontés par `instance.indicateurs` | 177 | EPIC-148, EPIC-157 | S7, S9 |

| Rendu | À | Date |
|---|---|---|
| schémas de `reprise.feu-vert.changed`, de la vérification `donnees-importees` et des routes C13 de la Reprise | EPIC-146 (refus `MISE_EN_SERVICE_SANS_FEU_VERT` joué sur doublure en S6) | 04/12 (EPIC-161) |
| les routes C13 réelles de la Reprise (`sante`, `export` ; puis `import`, `effacement`, `verifications/donnees-importees`) | EPIC-144, EPIC-146, EPIC-147 | S7, puis S10 (EPIC-163, EPIC-166) |
| `seuils-fraicheur@1` | coque (spine de la coque AD-7) | 11/12 (EPIC-169) |
| compteurs de Connecteurs | EPIC-157 | au déclencheur (EPIC-177) |

## Contraintes d'ordre à ne pas défaire

- ⛔ **EPIC-161 est fini le 04/12**, avant que Dev A ouvre le point d'import de `pdv` (S5). Une correction du kit se fait dans
  le kit, par son propriétaire, jamais dans le dépôt de la cible.
- ⛔ **Le kit ne lit la matrice des neuf états que depuis le contrat publié le 11/12** : sa doublure s'arrête ce jour-là, et sa
  suite de conformité rejoue la matrice publiée cas par cas.
- ⛔ **Les contrats de la Reprise sont publiés le 04/12 avec le kit** : EPIC-146 (S6) refuse une mise en service sans feu vert
  sur une doublure de ces contrats, sans attendre `reprise-service`.
- ⛔ **L'identité de service de `reprise-service` et ses droits entrent dans `auth-service` en S6**, dans la semaine de Dev B du
  dépôt : la Reprise ne livre rien à une cible avant.
- ⛔ **Aucun module cible n'est « fini » sans son point d'import vert** (EPIC-165) ; un module qui manque la démo ou février
  apparaît « non installé » au rapport, jamais livré ailleurs.
- ⛔ **L'effacement de la Reprise (EPIC-166) est livré avant la fin du premier essai prospect ouvert le 15/01** (J+30, vers le
  14/02) : le plan d'effacement d'EPIC-147 l'appelle.
- ⛔ **EPIC-166 précède toute mise en service d'un client** : sans feu vert, la partie A refuse.
- ⚡ **Rien dans `connecteurs-service` avant février**, mais chaque module cible construit d'ici là applique le **point
  d'écriture unique** par domaine (EPIC-165) ; sinon il sera repris au premier client Odoo.
- ⚡ **La part échange du kit (EPIC-170) précède `connecteurs-service` (EPIC-171)**, et la reprend du même propriétaire que la
  part reprise.

## Les épics les plus risqués

**Pour le 15/01 : EPIC-163.** Un service neuf en une semaine, avec trois premières fois : un téléversement tus derrière Traefik
(jamais essayé ici), BullMQ 6 (première majeure 6 du parc) et exceljs en flux sur 100 000 lignes. ⇒ La première story de chacun
est une **story de pointe** prouvée en conditions réelles : téléversement de 50 Mio coupé et repris à travers le vrai proxy ;
`BullModule` démarré avec bullmq 6.7 (repli : bullmq 5 comme `document-service`) ; lecture en flux mesurée (repli : SheetJS
dans le processus isolé). La tranche du 15/01 ne porte qu'une sorte de lot (`INITIALE`), une cible et l'essai.

**Pour février : EPIC-166.** Son erreur ne se voit pas en test fonctionnel : une partie A qui déduit l'état d'un seul message,
ou un trou de `numero` ignoré, met en service un sous-ensemble sur des données changées après le feu vert. ⇒ Sa fin porte un
**test de mutation** : retirer la relecture par `donnees-importees`, ou garder le dernier message reçu au lieu du plus grand
(`epoque`, `numero`), fait échouer un test.

**Après février : EPIC-176.** NFR-3 est un invariant qu'aucun test fonctionnel ne prouve. ⇒ La liste fermée des chemins
d'écriture d'argent, un test par chemin, et le test de mutation des trois retraits d'AD-13.

---

## Les épics en détail

### EPIC-161 : Le kit des cibles : une cible reçoit une reprise en déclarant ses objets · à chiffrer au 04/12

**Dev B · S4, une semaine, en entier · Autonome : oui · Amont : aucun** (matrice, garde et jeton limité à l'organisation se
branchent le 11/12) · Clients : le point d'import de `pdv` (Dev A, S5), puis chaque module cible ; EPIC-146 pour les contrats ·
Reprise FR-7, FR-8, FR-14 ; C2, C3, C5, C13 · Reprise AD-2, AD-3, AD-4, AD-9, AD-10, AD-13, AD-16, AD-21, AD-27 ; Connecteurs
AD-12 · Dépôt : `prospera-plateforme` (créé ici).

**Backend**
- `prospera-plateforme` créé, avec `bibliotheques/kit-cible/` (paquet npm privé, semver, majeure alignée sur l'enveloppe de
  reprise, version épinglée par service, deux majeures actives au plus) et `contrats/objets/` : nommage
  `<code>.<objet>@<majeure>.<mineure>`, JSON Schema **draft-07**, aucun `$ref` entre fichiers ; la CI valide chaque schéma par
  Ajv et refuse un mot-clé postérieur à draft-07.
- **Route d'import** `POST /api/v1/reprise/<code>/{organisationId}/objets/<objet>`, modes `SIMULER` et `APPLIQUER` (Reprise
  AD-4) :
  - garde de l'identité de service de la Reprise et de l'organisation (`ORGANISATION_HORS_JETON`, aucun `organisationId` dans
    le corps) ; exceptions nommées par état : ouverte en `EN_SERVICE`, `ESSAI_PROSPECT`, `PREAVIS`, et en `EN_INSTALLATION`
    du réel pour la seule identité de la Reprise ; refusée ailleurs par un refus de garde, **jamais un verdict d'objet** ;
  - enveloppe validée : 500 objets et 1 Mio au plus (413 `LOT_TROP_GROS` avec `maxObjets`, `maxOctets`) ; champ inconnu de la
    mineure refusé `SCHEMA_NON_CONFORME`, toute mineure ≤ la sienne acceptée ;
  - magasin d'idempotence par (`lotId`, `versionLot`, `cleOrigine`) ; `VERSION_ANTERIEURE` ;
  - index unique (organisation, objet, source, identifiant) avec les **alias** ; `ALIAS_DEJA_UTILISE` ; `rattacherA` ;
  - résultats par objet `CREE`, `MODIFIE`, `INCHANGE` (empreinte de contenu), `REQUALIFIE`, `REFUSE` avec `code`
    (`REFERENCE_INCONNUE`, `VERDICT_DIFFERENT`, `ALIAS_DEJA_UTILISE`, `VERSION_ANTERIEURE`), `doublonsProbables` en simulation ;
  - `SIMULER` par **transaction annulée** (MongoDB en jeu de réplicas exigé) ; `APPLIQUER` exige `validationId` et
    `empreinteLivrable` (`VALIDATION_ABSENTE`) et n'écrit un objet que si son verdict recalculé égale le verdict validé ;
    jamais de création partielle ; `OBJET_HISTORIQUE`.
- **Route des contrôles** `POST /api/v1/reprise/<code>/{organisationId}/controles/<objet>` : lecture seule, 500 clés au plus,
  `dateDeValeur`, types fermés (`montant`, `date`, `entier`, `etat`) ; ouverte à l'identité de la Reprise (celle de Connecteurs
  s'ajoute avec EPIC-170).
- **Comportements par défaut** : pour un objet de référence simple, le module déclare son schéma et un **raccord** vers sa
  collection ; le kit fournit `appliquer`, `juger` (conformité au schéma seule) et `valeursDeControle`. Un objet à circuit ou
  à argent surcharge les trois.
- **Marqueurs** `historique` et `montantASaisir` posés sur l'objet et rendus par objet, avec l'aide qui exige un motif à la
  saisie d'un montant à saisir et le journalise.
- **Suite de conformité de la reprise** (`contrats/objets/conformite/`), publiée avec le kit : idempotence, simulation sans
  écriture, historique non modifiable, alias, matrice des neuf états (routes `reprise/*`, identité de la Reprise et
  utilisateur), appel croisé d'organisation, lot de 600 objets chaînés, motif et trace d'un `montantASaisir`, verdict validé,
  `SIMULER` de 500 objets en moins de 30 s, crochet `OUVERTURE_CLOSE` (stock).
- **Cible témoin** dans le dépôt du kit (un objet de référence simple, un objet à circuit fictif) qui joue la suite : c'est la
  preuve du kit, pas un module.
- Port `LecteurEtatPublie` injecté, avec sa doublure jusqu'au 11/12 ; il porte aussi l'âge de l'état publié (relecture après
  15 minutes sans confirmation, état courant gardé si elle échoue : spine de Connecteurs AD-21, `[PROPOSÉ]`).
- **Contrats de la Reprise publiés la même semaine** dans `prospera-plateforme/contrats/`, sans code : enveloppe de reprise,
  `reprise.feu-vert.changed`, `reprise.historique.livre`, réponse de la vérification `donnees-importees`, OpenAPI des routes
  C13 de la Reprise (Reprise AD-16, AD-21). EPIC-146 les consomme en S6.
- ⛔ La part échange (EPIC-170) n'est pas construite ; son espace de noms est réservé.

**Écrans**
- Aucun : c'est une bibliothèque. Ses marqueurs sont rendus par `<ProtectionObjet>` (mécanique de la coque) dans les écrans de
  chaque module (EPIC-165).

**Fin de l'épic**
- `kit-cible` 1.0.0 publié et étiqueté le **04/12**, relu par Dev A.
- La cible témoin joue la suite en vert ; trois mutations font rougir la suite : retirer la comparaison au verdict validé,
  retirer le refus `ORGANISATION_HORS_JETON`, accepter un champ inconnu.
- Un objet de référence simple s'importe en déclarant son seul schéma et son raccord, sans écrire `juger` ni `appliquer`.
- Le **11/12**, la suite rejoue `contrat/matrice-etats.json` publié au lieu de la doublure, sans écart (ligne exécutée par
  Dev B dans EPIC-145).

### EPIC-162 : `prospera-adaptateurs` : lire un fichier du client sans le trahir · à chiffrer au 04/12

**Dev A `[PROPOSÉ]` · S7 (tranche du 15/01), S9 (tranche de février) · Autonome : oui · Amont : EPIC-161 (schémas d'objets)** ·
Reprise FR-1, FR-2, FR-6, FR-7, FR-23 ; NFR-4 · Reprise AD-6, AD-9, AD-13, AD-14, AD-18, AD-29, AD-32 · Dépôt :
`prospera-adaptateurs` (neuf, paquet npm privé).

**Backend — tranche du 15/01**
- Interface `Adaptateur` : `decrire()`, `verifierAcces(connexion)`, `lire(source, gabarit, curseur)`, qui rend un flux de
  lignes (`ligne`, `brut`, `empreinte`). Adaptateur **`fichier`** : `.xlsx` lu en flux (exceljs `WorkbookReader`), CSV
  (`csv-parse`) ; `.xls` binaire refusé avec un message lisible ; type détecté par **signature**, jamais par extension.
- **Processus de travail isolé** et limites dures, configurables (AD-29) : 100 Mio déposés, 1 Gio décompressés (ratio ≤ 100,
  entrées de zip bornées), 1 000 000 lignes, 500 colonnes, 32 767 caractères par cellule, budget de mémoire et délai ; un
  dépassement tue le travail, pas le service ; XML sans DTD ni entité externe.
- Fonctions **pures** : gabarit (colonnes vers champs, composition de l'identifiant, régime par critère, filtre d'exclusion),
  **identifiant canonique** (AD-32 : chaîne NFC, zéros de tête conservés, jamais un nombre), empreinte SHA-256 du JCS,
  normalisation des doublons (téléphone en E.164 avec le pays de l'organisation, nom sans accents ni casse), correspondances
  (`CORRESPONDANCE_ABSENTE`, jamais une invention), conformité au schéma (Ajv, schémas épinglés).
- ⚡ **Story de pointe** : lecture en flux de 100 000 lignes mesurée contre NFR-4 dans le processus isolé ; plan B, SheetJS
  Community Edition (tarball officiel).

**Backend — tranche de février**
- **Nombres** : décimal exact depuis le texte ou le `numFmt`, jamais depuis le flottant ; unités mineures, arrondi `HALF_EVEN`
  et écart `ARRONDI_APPLIQUE` ; devise du gabarit, `DEVISE_HORS_ORGANISATION`.
- **Dates** (AD-14) : `format` par colonne (`serie-excel`, `JJ/MM/AAAA`, `ISO`), système 1900 ou 1904 lu dans le classeur,
  `DATE_AMBIGUE`, `DATE_ABSENTE`, instant lu dans le fuseau de l'organisation puis rangé en UTC ; jamais la date du jour.
- Traductions d'état ; **comparaison unique** des valeurs de contrôle, avec vecteurs par devise (partagée plus tard avec
  Connecteurs) ; JSON (`stream-json`).
- **Modèles de gabarit** `sage-100` et `export-assureur`, livrés comme données ; **corpus d'exports Sage partagé** joué par la
  bibliothèque et par `balance-service` ; vecteurs d'or des empreintes dans `prospera-plateforme`.

**Écrans**
- Aucun : bibliothèque lue par EPIC-163.

**Fin de l'épic**
- 15/01 : un fichier de 100 000 lignes se lit en flux sous les limites ; un zip piégé tue le travail, pas le service ; `00123`
  saisi en texte ou affiché par un nombre donne le même identifiant.
- Février : une date Excel ne glisse pas (systèmes 1900 et 1904) ; un délai calculé égale celui de la source ; un montant XOF
  à décimales rend `ARRONDI_APPLIQUE` ; le corpus Sage donne les mêmes lignes ici et dans `balance-service`.

### EPIC-163 : Le lot de la Reprise : déposer, lire, contrôler, rapporter · à chiffrer au 04/12

**Dev A `[PROPOSÉ]` (écrans : Dev B) · S7 (tranche du 15/01), S9 (tranche de février) · Autonome : non · Amont : EPIC-161,
EPIC-162, EPIC-165 (`pdv`) ; moteur EPIC-144 et EPIC-145** · Reprise FR-2, FR-3, FR-4, FR-5, FR-7, FR-11, FR-12 (détection),
FR-19, FR-21 ; NFR-1, NFR-3, NFR-4, NFR-5, NFR-6 · Reprise AD-1, AD-5, AD-6, AD-8 (rapport), AD-10, AD-15, AD-16, AD-17, AD-24,
AD-26, AD-29, AD-30, AD-31, AD-32 · Dépôts : `reprise-service` (neuf), `prospera-plateforme` (Traefik, Dev B),
`auth-service` (Dev B, S6), `prospera-app`.

**Backend — tranche du 15/01**
- Dépôt `reprise-service` : Node 24, NestJS 11, Mongoose 8, MongoDB 8.0 en jeu de réplicas, Redis 7.2, port 3404, profil compose
  `reprise`, bucket MinIO `reprise` ; `src/module.manifest.ts` copié de `manifestes/reprise.manifest.ts`. ⚡ Story de pointe :
  `BullModule` démarré avec bullmq 6.7 et `@nestjs/bullmq` 11.0.5 ou plus (repli : bullmq 5).
- **Garde** `REPRISE_NOT_ENTITLED` sur la garde publiée par EPIC-145, fermée (`NON_INSTALLE`) tant que la lecture de l'état
  publié n'a pas réussi ; **read-model** des états publiés des cibles, qui porte `numero` et se resynchronise avant chaque
  rapport.
- **Téléversement tus** sur `/api/reprise/v1/televersements` (`@tus/server`, `@tus/s3-store`, morceaux de 10 Mio) : création
  sous `reprise:lot:importer` et dans l'organisation du jeton, envoi lié à l'identité créatrice et au lot, SHA-256 calculé au
  serveur, `FICHIER_DEJA_DEPOSE`, expiration à 24 h. **Traefik** (Dev B, gabarit de `prospera-plateforme`) : corps de 12 Mio
  sur cette seule route, en-têtes tus transmis et exposés en CORS, `respectForwardedHeaders` ; validé par un test réel à la
  première story.
- **Automate du lot** (sorte `INITIALE`) : `DEPOSE`, `LU`, `TRADUIT`, `CONTROLE`, `ABANDONNE` ; versions figées avec un
  instantané des règles ; morceaux BullMQ de clef (`lotId`, version, étape, numéro) ; **acquittement dans Mongo, dans la
  transaction du résultat** ; bail et jeton de fencing par (organisation, module cible) ; statut d'exécution orthogonal
  (`EN_COURS`, `EN_ECHEC`, `TERMINE`) ; un refus de garde n'est jamais un verdict.
- **Étapes 1 à 4** : lire par EPIC-162, traduire, contrôler (schéma, références, cycles, doublons du lot, montants requis,
  dates), puis `SIMULER` chez la cible, par morceaux ordonnés topologiquement ; **rapport JSON figé** avec son empreinte
  (AD-32), gravités fixées par le produit (AD-24), lignes `NON_INSTALLE` et `CIBLE_FERMEE`.
- **Règles comme données** : gabarit, correspondances, critères de doublon ; corriger = nouvelle version, aucune route ne
  modifie une ligne lue ni un objet traduit.
- **API** : `lots`, `lots/<id>/versions/<n>`, `…/rapport`, `lots/<id>/progression` (interrogation périodique), `correspondances` ;
  202 pour les étapes asynchrones ; pagination par curseur ; OpenAPI publié.
- **Routes C13** `sante` (`DEGRADE` si Redis ou MinIO manque, module ouvert) et `export` (CSV et JSON, cellules neutralisées).
- **`auth-service`** (Dev B, S6, sa semaine du dépôt) : identité de service de `reprise-service`, émise par l'`auth-service` de
  chaque espace ; les six droits `reprise:*` (lus au manifeste, EPIC-145) ; `reprise:lot:valider` attribuable par le **DG
  seul**, avec la référence de la désignation écrite, attribution tracée (AD-26).

**Backend — tranche de février**
- Plusieurs modules cibles dans un lot ; traduction d'état et requalification au rapport ; passes globales (doublons,
  références, cycles) en travaux à part ; filtre d'exclusion visible au rapport.
- Rendu PDF (pdfkit 0.19), **fichier téléchargeable des lignes en erreur** ; `LIVRAISON_PARTIELLE` et reprise seule à la
  réouverture d'une cible ; en `LECTURE_SEULE`, travaux interrompus.
- Métriques (morceaux acquittés et échoués, durée par étape, âge du dernier morceau) lisibles par l'agent ; alerte de lot bloqué
  vers le ticket de Money Vibes ; point d'entrée `migrer` et relecture N/N-1 (AD-31).
- NFR-4 mesuré : 100 000 objets lus et rapportés en moins de 10 minutes avec les simulations des cibles de la suite.

**Écrans**
- Coque, module d'écran `reprise` (Dev B, `PRA-`) : déposer un fichier (progression, reprise après coupure), choisir le gabarit
  et rattacher les colonnes, suivre l'avancement, lire le rapport (comptes par cible, écarts par gravité, lien vers la ligne
  d'origine), corriger une règle et rejouer ; en février : correspondances, traductions d'état, lignes en erreur, PDF.
- Coque, mécanique (Dev A, S6) : `creerTeleversement(code)` emprunte le jeton, le préfixe et la reprise sur 401 de
  `creerClient` ; `tus-js-client` 4.3.
- Console (`AP-`) : la même API, pour l'intégrateur Money Vibes.

**Fin de l'épic**
- **08/01** : dans l'essai d'un prospect distributeur, un fichier Excel de points de vente déposé depuis le module d'écran donne
  un rapport juste ; couper la connexion pendant l'envoi puis reprendre ne recommence pas ; tuer le service au milieu d'un
  morceau ne double rien ; rejouer la même version donne la même empreinte.
- Février : 100 000 objets lus et rapportés en moins de 10 minutes sur le serveur de référence.

### EPIC-164 : Valider, livrer, retrouver ses données (montré le 15/01) · à chiffrer au 04/12

**Dev A `[PROPOSÉ]` (écrans : Dev B) · S8 (tranche du 15/01), S9 (tranche de février) · Autonome : non · Amont : EPIC-163,
EPIC-165** · Reprise FR-8, FR-12, FR-13, FR-14, FR-20 ; NFR-1, NFR-2 · Reprise AD-3, AD-4, AD-8, AD-9, AD-19, AD-24, AD-26,
AD-30 · Dépôts : `reprise-service`, `prospera-app`.

**Backend — tranche du 15/01**
- **Validation** (étape 5) : `validationId`, acteur, instant, `versionLot`, **empreinte du rapport** et **empreinte du
  livrable**, verdict validé de chaque objet, `modulesAlimentes` gelé ; droit `reprise:lot:valider`, relu à la validation et à
  la livraison ; 409 `LOT_MODIFIE_APRES_VALIDATION`.
- **Livraison** (étape 6) : `APPLIQUER` par morceaux ordonnés, résultat par objet ; `VERDICT_DIFFERENT` met le lot en
  `ECART_DE_LIVRAISON` jusqu'à une nouvelle validation ; un refus de garde le met en `LIVRAISON_PARTIELLE` et le travail reprend
  seul ; `LIVRE` exige tous les morceaux acquittés.
- Faits du journal `reprise.lot.valide`, `reprise.livraison` (identifiants et comptes, jamais un contenu de cellule).
- ⚠️ **À fixer avant la première story** (question 4) : qui détient `reprise:lot:valider` dans l'essai du prospect, puisque le
  prospect valide lui-même (UJ-5, variante du prospect).

**Backend — tranche de février**
- **Doublons** : ceux du lot et les `doublonsProbables` de la cible ; **fusion** (`reprise:doublon:fusionner`, nouvelle
  version, `FUSION_APRES_LIVRAISON`), **alias**, **rattacher** une ligne à un objet existant ; faits `reprise.fusion`,
  `reprise.rattachement`.
- **Régimes** `VIVANT` et `HISTORIQUE` par critère du gabarit ; `reprise.historique.livre` après le dernier morceau
  `HISTORIQUE` d'un lot `INITIALE` (la cible calibre une fois, dédoublonné par `lotId` et `moduleCible`) ; `AVERTISSEMENT` si
  l'historique couvre moins de 3 ans.
- **Livraison partielle** : la validation accepte les avertissements et livre les objets sans erreur ; plusieurs modules
  cibles, verrous pris dans l'ordre alphabétique du code de module.

**Écrans**
- Coque, module `reprise` (Dev B) : valider (ce qui est validé, par qui, et ce qui ne sera pas livré), suivre la livraison,
  résultat par objet avec lien vers l'objet dans son module ; en février : fusion des doublons côte à côte, rattacher à un objet
  existant, liste des montants à saisir par module.
- Console (`AP-`) : idem.

**Fin de l'épic**
- 🎯 **15/01** : sur place, un prospect distributeur ouvre son essai (EPIC-147), dépose son fichier de points de vente, lit le
  rapport, valide et retrouve ses points de vente dans `pdv`. Rejouer la livraison ne crée rien ; une source modifiée après la
  validation est refusée nommément.
- Février : un objet `HISTORIQUE` n'est modifiable par aucune reprise suivante ; la calibration n'est lancée qu'une fois ; une
  fusion est tracée et un alias résolu par la cible.

### EPIC-165 : Les modules cibles reçoivent la reprise : un point d'import dans le « fini » de chacun · à chiffrer au 04/12

**Le propriétaire de chaque module cible, dans la semaine du module · S5 → S10 · Autonome : non · Amont : EPIC-161** ·
Reprise FR-5, FR-7, FR-9, FR-14 ; C1 (`objetsDeReprise`), C2 · Reprise AD-2, AD-4, AD-5, AD-11, AD-13, AD-23 ; Connecteurs AD-11,
AD-12, AD-32 · Dépôts : ceux des modules cibles.

Cet épic répond au risque ouvert d'EPIC-146 : les points d'import et les valeurs de contrôle n'étaient portés par aucun épic.
Il ne crée pas de chantier à part : c'est la **liste des lignes** que chaque module cible ajoute à sa propre définition de
« fini », et la preuve commune qu'elles tiennent.

**Backend — ce que « fini » veut dire pour un module cible**
1. Ses **schémas d'objets** dans `prospera-plateforme/contrats/objets/<code>/` (écrits par le propriétaire du module) et
   `objetsDeReprise` à son manifeste (écrit par Dev B dans `prospera-stories/manifestes/`, recopié par le propriétaire).
2. Un **raccord** (objet de référence simple) ou ses fonctions `juger`, `appliquer`, `valeursDeControle` (objet à circuit ou à
   argent), sur `kit-cible`.
3. Ses **valeurs de contrôle** déclarées au schéma et recalculées par la cible.
4. La **suite de conformité de la reprise** verte dans sa CI.
5. Son API rend `historique` et `montantASaisir` par objet ; ses écrans métier les honorent par `<ProtectionObjet>`.
6. **Un seul point d'écriture par domaine** déclaré dans `domainesEchange`, dont les faits portent l'identifiant stable de
   l'objet et un `rang` (spine de Connecteurs AD-32), même sans Connecteurs.

**Modules cibles présumés de février** (le manifeste de chaque module tranche ; la liste n'est **pas** réduite : jusqu'à une
trentaine de cibles, décision du PO du 2026-11-12) :

| Module | Objets | Nature | Propriétaire | Semaine |
|---|---|---|---|---|
| `pdv` | points de vente | référence simple | Dev A | **S5** (PDV bloc 1) — 🎯 15/01 |
| `reseau` | zones, agences ; commerciaux (à confirmer) | référence simple | Dev A | S5 (finition) |
| `catalogue` | produits, prix (date d'effet) | référence ; prix daté | Dev A | S6 |
| `stock` | `stock.stock-ouverture@1` (remplaçante, `OUVERTURE_CLOSE`, gardée comme ajustement en attente) | circuit | Dev A | S6 → S7 |
| `facturation` (à confirmer) | créances ouvertes | argent | propriétaire du module (lot 2) | sa semaine |
| `approvisionnement` (à créer) | fournisseurs | référence simple | propriétaire du module (lot 2) | « non installé » s'il n'existe pas en février |
| `polices` (code à confirmer) | assurés, polices en vigueur et échues | circuit et argent | Dev A | S9 |
| `sinistres` | sinistres ouverts et clos (requalification, montants à saisir, UJ-4) | circuit et argent | Dev A | S9 |
| historique des ventes et des paiements | à confirmer | — | — | — |
| modules du lot 2 et suivants | chaque manifeste tranche | — | leur propriétaire | leur semaine |

Le cabinet ne déclare aucun `objetsDeReprise` (OQ-6) ; les schémas de la microfinance viennent après février.

**Écrans**
- Ceux de chaque module, par leur propriétaire : `<ProtectionObjet>` pour un objet historique (aucune action de modification)
  et pour un montant à saisir (saisie avec motif). Rien dans le module d'écran `reprise`.

**Fin de l'épic**
- Chaque module listé joue la suite de conformité de la reprise en vert dans sa CI, à la fin de sa semaine ; l'état du tableau
  est relevé à chaque croisement (11/12, 18/12, 08/01, 22/01).
- Un objet sans schéma installé apparaît « non installé » au rapport, sans erreur.

### EPIC-166 : Essai puis réel : le dossier, la reprise fraîche, l'écart nul et le feu vert · à chiffrer au 04/12

**Dev A `[PROPOSÉ]` (écrans : Dev B) · S10 · Autonome : non · Amont : EPIC-164 ; moteur EPIC-146 (mise en service, réception
définitive), EPIC-147 (plan d'effacement), EPIC-148 (journal)** · Reprise FR-15, FR-16, FR-21, FR-22 ; NFR-2, NFR-3 · Reprise
AD-7, AD-8, AD-12, AD-13, AD-15, AD-16, AD-17, AD-25, AD-31, AD-33 · Dépôts : `reprise-service`, `prospera-app`, console.

**Backend**
- **Part de la Reprise au dossier** (`export`, `perimetre=dossier`) : gabarits sans identifiants de connexion, code du système
  d'origine, correspondances (valeurs hors du domaine déclaré rejetées), traductions d'état, critères de doublon, liste des
  modules attendus ; un test cherche une valeur d'origine témoin dans le dossier. **Import** idempotent par version du
  dossier ; `DOSSIER_VERSION_DIFFERENTE` dès qu'un lot du réel a été validé ; `ATTENDU` publié pour chaque module listé.
- **Réconcilier** (étape 7) : valeurs de contrôle de la cible par la route du kit, comparaison par la fonction unique d'EPIC-162,
  à `dateDeValeur` fixée par le lot ; `VALEUR_DE_CONTROLE_DIFFERENTE`, `OBJET_EN_TROP` ; une requalification acceptée est une
  exception tracée, un montant à saisir est exclu et listé.
- **Feu vert** : `reprise.feu-vert.changed`, **dans le réel seulement**, `numero` par (organisation, module) tenu dans la même
  transaction que le changement, outbox ordonnée par `organisationId`, état absolu republié après un changement d'époque ;
  vérification `donnees-importees` (même état, critère chiffré) ; module `VERT` figé (`FEU_VERT_DONNE`) ; **réouverture** avec
  motif (`ATTENDU`, `numero` + 1, refusée une fois `EN_SERVICE`) ; **remise à zéro** d'un module (effacement C13 de la cible,
  rejeu du dossier) tant qu'il est `EN_INSTALLATION` ; lots `COURANTE` ensuite, sans feu vert.
- **Suppression** des fichiers et de la zone de transit, lue sur `HorlogeDeReference` : réception définitive couvrant
  `modulesAlimentes`, abandon + 30 jours, lot courant + 30 jours, essai + 30 jours ; l'index de provenance survit ;
  `reprise.fichier.supprime`.
- **Effacement** (AD-33) : `EFFACEMENT_EN_COURS`, travaux drainés, verrous annulés, outbox vidée, collections et buckets
  balayés, zéro reste vérifié, **accusé** haché ; idempotent ; appelé par le plan d'effacement d'EPIC-147. ⛔ Livré avant la
  fin du premier essai prospect ouvert le 15/01.
- `migrer` et le test « promouvoir, déposer un lot, revenir, tout se relit » (AD-31) ; faits `reprise.feu-vert`,
  `reprise.feu-vert.rouvert`, `reprise.effacement`.

**Écrans**
- Coque, module `reprise` (Dev B) : réconciliation par module (valeurs de la source et de la cible), feu vert par module
  (`ATTENDU` ou `VERT`, avec la raison), réouverture avec motif ; **aucune action de mise en service**.
- Console (`AP-`) : état des feux verts de chaque organisation, lu au bilan de mise en service (EPIC-146).

**Fin de l'épic**
- Une répétition dans l'essai, puis dans le réel avec le seul dossier : export frais, validation par le DG, livraison sous
  l'exception `EN_INSTALLATION`, écart nul, `VERT`, mise en service du sous-ensemble depuis la console, fichiers supprimés à la
  réception définitive.
- Un module attendu qui n'est pas `VERT` rend `MISE_EN_SERVICE_SANS_FEU_VERT`. **Test de mutation** : retirer la relecture par
  `donnees-importees`, ou garder le dernier message reçu au lieu du plus grand (`epoque`, `numero`), fait échouer un test.
- Restaurer puis rejouer (nouvelle époque) republie l'état absolu ; après l'accusé d'effacement, une valeur témoin n'est
  trouvée dans aucune collection.

### EPIC-167 : Le comptage d'ouverture du stock · à chiffrer au 04/12

**Dev A `[PROPOSÉ]` (écrans : Dev B) · S10 · Autonome : non · Amont : EPIC-166 (feu vert), EPIC-165 (`stock`)** · Reprise FR-10 ·
Reprise AD-11, AD-12 ; Connecteurs AD-20 · Dépôts : `reprise-service`, dépôt de `stock`, `prospera-app`.

**Backend**
- Lot **`COMPTAGE`** du réel, **une feuille par entrepôt**, pré-remplie par le fichier de stock (quantité du fichier, pour
  information) ; quantité comptée saisie article par article (`reprise:comptage:saisir`), **brouillon mutable** jusqu'à
  « comptage clos », qui fige une version et vaut validation.
- Livraison au module `stock` comme `stock.stock-ouverture@1` **pendant que `stock` est `EN_INSTALLATION`** ; ouverture
  **remplaçante** par (entrepôt, article), refusée une fois `stock` en service (`OUVERTURE_CLOSE`) ; la livraison attend que les
  lots des articles et des entrepôts soient `LIVRE` ; valeur de contrôle = quantité comptée.
- Écart entre fichier et comptage en `INFORMATION` ; `stock` est `VERT` quand le comptage est validé et livré.
- Côté `stock` : le comptage est gardé comme **ajustement en attente**, publié à la mise en service si Odoo possède le stock
  (sans effet tant que Connecteurs n'est pas installé).

**Écrans**
- Coque, module `reprise` (Dev B) : feuille de comptage par entrepôt, utilisable sur une tablette dans l'entrepôt ; clôture du
  comptage ; écart entre fichier et comptage.

**Fin de l'épic**
- Deux saisies du même article remplacent, jamais n'additionnent ; une nouvelle ouverture après la mise en service de `stock`
  est refusée nommément ; aucun mouvement de stock n'est possible entre le comptage et la mise en service.

### EPIC-168 : Les deux reprises de février, de bout en bout, et les imports courants en libre-service · à chiffrer au 04/12

**Dev A `[PROPOSÉ]` (écrans : Dev B) · S11 → S13 · Autonome : non · Amont : EPIC-166, EPIC-167 ; moteur EPIC-148, EPIC-150,
EPIC-153 (instance de l'assureur)** · Reprise FR-1, FR-9, FR-19 ; SM-1 → SM-5 ; NFR-3, NFR-4 · Reprise AD-23, AD-26, AD-34 ·
Dépôts : `reprise-service`, `prospera-recette`, `prospera-app`, console.

**Backend**
- **Distributeur (hébergé)** : fichiers ou export Sage, gabarit `sage-100` ajusté ; essai (répétition), puis réel ; points de
  vente, produits et prix, commerciaux, créances, fournisseurs (« non installé » s'il le faut), comptage.
- **Assureur (sur site)** : export Excel, gabarit `export-assureur` ; essai, puis réel sur l'instance ; requalification des
  sinistres (UJ-4), montants à saisir ; un test prouve qu'aucun fichier ni aucune donnée reprise ne quitte l'instance.
- **Imports courants en libre-service** (UJ-5) : lots `COURANTE` déposés et validés par le client, la validation par la personne
  que le DG a désignée par écrit ; suppression à 30 jours.
- **Mesures** (AD-34) : SM-1 → SM-5 et contre-indicateurs lisibles par la console (`reprise:rapport:consulter`) ; NFR-4 mesuré à
  l'Integration Gate sur le serveur de référence.
- **Recettes** dans `prospera-recette` : essai puis réel avec le seul dossier ; réel sans essai, feu vert exigé ; aucun module
  cible, rapport seul ; coupure à un morceau tiré au hasard ; une date Excel ne glisse pas.

**Écrans**
- Coque, module `reprise` (Dev B) : imports courants par le client seul, sur les mêmes écrans.
- Console (`AP-`) : compteurs SM-1 → SM-5 et contre-indicateurs par client.

**Fin de l'épic**
- 🎯 **Reprise SM-5 = 2** : les deux reprises sont validées par le client et leur réception définitive est enregistrée ; SM-1 →
  SM-4 valent 0.
- L'administratrice d'un client charge 200 points de vente seule, sans Money Vibes (UJ-5).

### EPIC-169 : Les contrats de Connecteurs et la règle du point d'écriture unique, avant février · à chiffrer au 04/12

**Dev B · S5 (avec EPIC-142, dans le même dépôt) · Autonome : oui** · Clients : la coque (Dev A, 11/12), chaque module cible
(EPIC-165), le catalogue (EPIC-143) · Connecteurs FR-5, FR-11 ; C1 · Connecteurs AD-2, AD-3, AD-10, AD-16, AD-29, AD-32 · Dépôt :
`prospera-plateforme`.

**Backend**
- `contrats/seuils-fraicheur.json` (`seuils-fraicheur@1`) : seuils orange et rouge par niveau (immédiat 5 et 15 min ; heure
  1 h et 3 h ; nuit rouge à 06 h) et champ `messageDes`. Une seule source, lue par la coque (table générée) et plus tard par
  Connecteurs.
- `contrats/echange/` : `echange-enveloppe@1`, `connecteurs.domaine.changed@1`, et le schéma du champ `domainesEchange` de C1,
  avec ses règles (`argent` ⇒ `controle` sauf `LECTURE` ; `objets` ⊆ `contrats/objets/<code>/`), que le catalogue applique
  (EPIC-143).
- **Règle de construction** : une fonction de service par domaine déclaré, dont les faits portent l'identifiant stable de
  l'objet et un `rang`. `[PROPOSÉ]` Elle est vérifiée par une **garde de balayage au gabarit** des dépôts, comme C6.
- ⛔ Rien dans `connecteurs-service`.

**Écrans**
- Aucun ; la coque génère sa table de seuils depuis le contrat (mécanique de la coque).

**Fin de l'épic**
- Les contrats sont étiquetés le 11/12 ; la coque rend ses mentions depuis la table générée ; un manifeste qui déclare un
  domaine `argent: true` et `controle: false` est refusé par le catalogue.

---

### Connecteurs après février : EPIC-170 → EPIC-179

**Déclencheur** : le premier contrat signé qui déclare un logiciel du client (spine de Connecteurs AD-32). Ces épics sont
**chiffrés le 04/12** pour que le délai de construction soit annoncé **avant** la signature ; ils ne sont placés dans aucune
semaine. Leur propriétaire se décide au déclencheur ; les écrans restent à Dev B. Ordre de livraison de FR-17 : (1) clients et
produits avec les prix, relais de la Reprise (EPIC-174) ; (2) stock en lecture (EPIC-174) ; (3) factures et encaissements vers
la comptabilité, **avec** la file des écarts et l'écran de santé (EPIC-176 et 177). Puis le connecteur de l'IMF (QK-18), puis
celui de l'assureur après examen de son logiciel (QK-17).

### EPIC-170 : Le kit des cibles, part échange · à chiffrer au 04/12

**Au déclencheur · un développeur, une semaine, comme EPIC-161 · Amont : EPIC-161, EPIC-169** · Connecteurs FR-2, FR-4, FR-6,
FR-10, FR-19 ; NFR-1 · Connecteurs AD-3, AD-4, AD-5, AD-10, AD-11, AD-12, AD-21 · Dépôt : `prospera-plateforme`.

**Backend**
- **Route d'échange** `POST /api/v1/echange/<code>/{organisationId}/objets/<objet>` : enveloppe `echange-enveloppe@1`, 200
  opérations et 1 Mio au plus (`ECHANGE_TROP_GROS`) ; opérations `APPLIQUER_OBJET`, `ENREGISTRER_MOUVEMENT`, `CONFIRMER`,
  `REFUSER`, `CORRIGER` ; idempotente par `operationId` ; réponses `APPLIQUE`, `INCHANGE` (`DEJA_APPLIQUE`, `EFFET_ANTERIEUR`),
  `REJETE` (`REFERENCE_INCONNUE`, `SCHEMA_NON_CONFORME`, `OBJET_HISTORIQUE`, `DOMAINE_PROSPERA`, `CORRECTION_REFUSEE`,
  `MOUVEMENT_INCONNU`) ; dernier effet daté, compteur `EFFET_EGAL` ; garde par opération (en `LECTURE_SEULE`, `CORRIGER` refusé).
- **Mouvements en attente** : une écriture d'utilisateur sur un domaine dont le logiciel du client est propriétaire devient un
  mouvement `EN_ATTENTE`, avec son `rang`, sans toucher un solde ; route `GET …/echange/<code>/{organisationId}/en-attente`
  (qui porte la version du kit) ; marqueurs `autoriteExterieure` et `mouvementsEnAttente`.
- **Propriétaire** : read-model de `connecteurs.domaine.changed`, relecture par `GET /api/v1/domaines/etat/{organisationId}` au
  démarrage, après un changement d'époque et devant un trou de `numero` ; défaut **fermé** (`PROPRIETAIRE_INCONNU`),
  `DOMAINE_EN_BASCULE`, accusés de bascule ; `OMBRE` refusé dans le réel.
- La route des contrôles s'ouvre en lecture à l'identité de Connecteurs (`EN_SERVICE`, `PREAVIS`, `ESSAI_PROSPECT`,
  `LECTURE_SEULE`) ; comportements par défaut de la part échange ; **suite de conformité de l'échange** ; plancher de majeure
  (`KIT_TROP_ANCIEN`).

**Écrans**
- `<ProtectionObjet>` gagne `autoriteExterieure` et `mouvementsEnAttente` (mécanique de la coque).

**Fin de l'épic**
- La cible témoin joue la suite de l'échange ; une saisie sur un domaine extérieur devient un mouvement en attente sans changer
  un solde ; un propriétaire inconnu refuse la saisie.

### EPIC-171 : `connecteurs-service` : un module installable, des domaines, un propriétaire chacun · à chiffrer au 04/12

**Au déclencheur · Amont : EPIC-170 ; moteur EPIC-142 → 146** · Connecteurs FR-2, FR-3 (mode), FR-19 ; C1 → C13 ; NFR-6 ·
Connecteurs AD-1, AD-2, AD-3, AD-19, AD-21, AD-22, AD-26, AD-27, AD-34 · Dépôts : `connecteurs-service` (neuf), `auth-service`,
catalogue de permissions de plateforme (quatre copies), `prospera-app`.

**Backend**
- Service, port 3405, profil compose `connecteurs`, MongoDB en jeu de réplicas, BullMQ 6 en job schedulers ; manifeste M43
  recopié ; garde `CONNECTEURS_NOT_ENTITLED` (relecture de l'état publié après 15 minutes, `[PROPOSÉ]`) et matrice de FR-19.
- **Connecteur** (`CREE`, `VERIFIE`, `EN_SERVICE`, `TERMINE`), mode temporaire ou permanent ; **identifiants** chiffrés en
  AES-256-GCM, champs en écriture seule, clé hors de la sauvegarde des données, `kid`.
- **Domaines** par organisation (propriétaire, niveau, source, état) ; `connecteurs.domaine.changed` avec `numero` et outbox
  ordonnée ; `GET domaines/etat` ; `DOMAINE_SANS_PROPRIETAIRE` ; répartitions par défaut en données
  (`repartitions/distributeur-odoo.json`).
- **Routes C13** : `export`, `import` (domaines `PREPARE`, propriétaire publié dès l'import), `effacement` (accusé au format de la
  Reprise), `verifications/<code>`, `sante` ; `avertissementDesinstallation`.
- `auth-service` : identité de service et quatre droits de tenant (`connecteurs:file:consulter`, `connecteurs:refus:renvoyer`,
  `connecteurs:ecart:trancher`, `connecteurs:file:reprendre`) ; `connecteurs:configuration:administrer` au catalogue de
  plateforme.

**Écrans**
- Coque, module `connecteurs` (Dev B) : configuration (connecteur, identifiants, propriétaire et niveau par domaine, répartition
  proposée), derrière `connecteurs:configuration:administrer` ; l'Administration y renvoie. Console : connecteurs par client.

**Fin de l'épic**
- Matrice des neuf états jouée ; du dossier de l'essai au réel, les domaines naissent `PREPARE`, propriétaire publié avant la
  mise en service ; aucune route ne rend un identifiant ; l'effacement rend un accusé sans reste.

### EPIC-172 : L'adaptateur Odoo · à chiffrer au 04/12

**Au déclencheur · Amont : EPIC-162 (interface), EPIC-171** · Connecteurs FR-1, FR-14 · Connecteurs AD-5, AD-7, AD-9, AD-18,
AD-23, AD-25 · Dépôt : `prospera-adaptateurs`.

**Backend**
- `AdaptateurEcriture` étend `Adaptateur` : `detecter`, `verifierLectureSeule`, `relever`, `ecrire`, `lireValeurs` ; la Reprise
  n'importe toujours aucune fonction d'écriture (sa garde de test).
- JSON-RPC (`execute_kw`), JSON-2 derrière l'interrupteur `odoo-json2` ; **profils de version** en données (facture
  `account.invoice` jusqu'à 12, `account.move` dès 13 ; champs d'argent, devise, décimales) ; une société par connecteur
  (`allowed_company_ids`).
- Identifiants externes `ir.model.data` (module `prospera`) : chercher, puis créer ; `DEJA_PRESENT` vaut succès ; repli
  `deduplication: false` si le client refuse le groupe « Droits d'accès ».
- Lecture seule prouvée par le contrôle natif selon la version (`check_access_rights` jusqu'à 17, `has_access` dès 18) ;
  classement des échecs (technique, refus avec raison, authentification) ; curseur (`write_date`, `id`), chevauchement de
  10 minutes, `active_test: false`, plafonds de requêtes.
- **Matrice de versions** en CI : la suite de conformité de l'adaptateur contre l'image officielle `odoo:<version>` de chaque
  version rencontrée.

**Écrans**
- Coque, module `connecteurs` : bilan des prérequis (version et édition détectées, « testé » ou « non testé », droits du compte
  avec l'action à faire).

**Fin de l'épic**
- La suite de l'adaptateur est verte sur chaque image de la matrice ; une coupure après la validation chez Odoo ne crée pas de
  doublon ; des identifiants qui peuvent écrire, déclarés en lecture seule, sont rejetés.

### EPIC-173 : Le connecteur dans l'essai : lire le vrai, n'écrire jamais · à chiffrer au 04/12

**Au déclencheur · Amont : EPIC-171, EPIC-172 ; moteur EPIC-146, EPIC-147** · Connecteurs FR-18 ; C13 point 6 ; NFR-6 ·
Connecteurs AD-18, AD-19, AD-22 · Dépôts : `connecteurs-service`, `prospera-app`.

**Backend**
- Destinations `REEL`, `BAC_A_SABLE`, `INTERCEPTION` ; dans l'essai, toute destination `REEL` refusée au serveur
  (`ECRITURE_REELLE_DEPUIS_ESSAI`) ; cascade bac à sable vérifié, sinon interception ; journal des écritures interceptées, en
  ajout seul.
- **Bac à sable vérifié** : référence écrite du client, base distincte constatée, envois de messages coupés ; empreinte de la
  base revérifiée à chaque session et avant chaque lot (`BAC_A_SABLE_NON_VERIFIE`) ; masquage par la bibliothèque de
  `prospera-plateforme` (celle du rafraîchissement, EPIC-146).
- **Identifiants en lecture seule** propres à l'essai, prouvés (`IDENTIFIANTS_NON_LECTURE_SEULE`) ; vérifications C13
  `acces-logiciel`, `lecture-seule`, `bac-a-sable`, `aller-retour`, `objets-lus` ; prospect : lecture limitée, champs personnels
  masqués, effacement en fin d'essai.

**Écrans**
- Coque, module `connecteurs` : bac à sable (déclaration, vérification), interceptions de l'essai, bilan des vérifications.

**Fin de l'épic**
- Aucune écriture vers le logiciel réel depuis l'essai, même forcée par l'API ; un bac à sable repointé vers le réel est détecté
  avant le lot suivant.

### EPIC-174 : Relever le logiciel du client et reprendre le relais de la Reprise (FR-17, étapes 1 et 2) · à chiffrer au 04/12

**Au déclencheur · Amont : EPIC-170 → 173 ; Reprise EPIC-166** · Connecteurs FR-4, FR-5, FR-14, FR-17, FR-20 ; Reprise FR-24 ;
NFR-1 · Connecteurs AD-4, AD-5, AD-7, AD-20, AD-35 ; Reprise AD-20, AD-28 · Dépôts : `connecteurs-service`, `reprise-service`
(route de cession, par celui qui tient le dépôt cette semaine-là).

**Backend**
- **Relevé** par curseur, rythmes `IMMEDIAT` 60 s, `HEURE` 10 min, `NUIT` ; pouls de 5 minutes ; rattrapage de 24 h chaque nuit ;
  pages de 200 ; `dernierEchangeLe` ; domaine `LECTURE` relevé par l'objet porteur plus un instantané de nuit ; rejets mis de
  côté et rejoués par objet ; ordonnanceur à priorités sur deux canaux ; **synchronisation initiale** hors seuils, avancement
  visible.
- **Relais** : côté Reprise, route `POST /api/reprise/v1/correspondances/{organisationId}/cessions`, atomique (copie, point de
  coupure immuable, `CEDEE`), `CORRESPONDANCE_CEDEE`, `DOMAINE_CEDE` calculé par objet, fait `reprise.cession` ; côté
  Connecteurs, copie comparée par hachage, premier relevé depuis le point de coupure, domaine `ACTIF` quand son module est en
  service ; sans Reprise, départ de zéro.
- **Stock d'ouverture** quand Odoo possède le stock : ajustement d'inventaire en quantité comptée (`inventory_quantity`), en
  attente de confirmation, jamais additionné.
- Étapes de FR-17 livrées ici : (1) clients et produits avec les prix ; (2) stock en lecture.

**Écrans**
- Coque, module `connecteurs` : domaines (synchronisation initiale, dernier échange), rejets entrants (corriger la règle,
  rejouer).

**Fin de l'épic**
- Relever deux fois ne crée rien ; relever, modifier le montant chez le client, relever : un seul enregistrement, la dernière
  valeur ; un objet repris puis relevé rend `INCHANGE` ; le stock n'est jamais additionné.

### EPIC-175 : La file d'envoi et les refus : rien n'est perdu · à chiffrer au 04/12

**Au déclencheur · Amont : EPIC-174** · Connecteurs FR-6, FR-7, FR-10 ; NFR-1, NFR-2, NFR-4 · Connecteurs AD-1, AD-5, AD-6,
AD-8, AD-9, AD-35 · Dépôts : `connecteurs-service`, `prospera-app`.

**Backend**
- **Capture** des faits des cibles, dédoublonnée par `mouvementId` ; **file d'envoi** et ses états (`EN_ATTENTE`,
  `EN_ATTENTE_DEPENDANCE`, `ENVOYE`, `CONFIRME`, `REFUSE`, `EN_ECHEC_TECHNIQUE`, `ABANDONNE`, `FIGE`, `INTERCEPTE`,
  `A_VERIFIER`).
- **Ordre** par (objet, `rang`) sous verrou Mongo par objet ; dépendances tous domaines confondus, attente de plus de 24 h
  signalée ; bail et fencing ; un refus bloque son objet et ce qui en dépend, pas le domaine.
- **Envoi** idempotent (identifiant externe) ; refus classés ; authentification refusée : pause après 3 essais, alerte
  « identifiants » ; 8 reprises puis `EN_ECHEC_TECHNIQUE`.
- **« Corriger et renvoyer »** : règle corrigée, même mouvement ; objet source corrigé, nouveau mouvement qui remplace
  (`[PROPOSÉ, à confirmer par le PO]`, D-44). Balayage nocturne des mouvements en attente orphelins ; `CONFIRMER` ou `REFUSER`
  rendus à la cible.

**Écrans**
- Coque, module `connecteurs` : file d'envoi (`connecteurs:file:consulter`), refus avec « Corriger et renvoyer » dans
  `<Ecriture>`, lien vers l'objet source.

**Fin de l'épic**
- Panne simulée, puis commande, encaissement et visite saisis sans erreur bloquante : tout part au retour, dans l'ordre de chaque
  objet, sans doublon ; deux saisies simultanées, une dans chaque logiciel, s'additionnent ; deux travailleurs simulés n'écrivent
  jamais deux fois.

### EPIC-176 : La concordance de nuit et la file des écarts : l'argent ne se corrige jamais seul (FR-17, étape 3) · à chiffrer au 04/12

**Au déclencheur · Amont : EPIC-175 ; avec EPIC-177** · Connecteurs FR-8, FR-9, FR-17 ; NFR-3, NFR-6 ; SM-1, SM-4 ; UJ-7 ·
Connecteurs AD-13, AD-14, AD-15, AD-30 · Dépôts : `connecteurs-service`, `prospera-app`.

**Backend**
- **La nuit** sur l'heure de référence et le fuseau de l'organisation, clef (`organisationId`, date de nuit), testée avec
  changement d'heure : domaines de nuit, rattrapage, concordance, puis `connecteurs.nuit.terminee` ; `connecteurs.nuit.absente` à
  06 h ; rapport partiel `NON_COMPARE` à 05 h 30.
- **Concordance** par lots de 500 clés, fonction unique de comparaison, `dateDeValeur` ; clés **en vol** listées, jamais en
  écart ; rapport figé et haché ; concordance à la demande.
- **Écarts** (unicité par domaine, clé d'origine, champ ; trois types) ; `RESORBE` (`[PROPOSÉ, à confirmer par le PO]`, D-18) ;
  **décision** avec `versionEcart`, motif, décision en bloc, refusée sur une clé en vol (`MOUVEMENTS_EN_ATTENTE`) ; corrections
  vers chaque logiciel dont la valeur diffère (mouvement absolu ou `CORRIGER`).
- **NFR-3** : liste fermée des chemins d'écriture d'argent, un test par chemin ; test de mutation des trois retraits d'AD-13 ;
  balayage nocturne des invariants.
- Étape 3 de FR-17 : factures et encaissements vers la comptabilité.

**Écrans**
- Coque, module `connecteurs` : file des écarts (deux valeurs côte à côte, sources, décision, « réaligner sur le propriétaire »),
  rapport de concordance.

**Fin de l'épic**
- Chacun des trois retraits du test de mutation fait échouer un test ; la concordance de 100 000 objets par domaine finit avant
  06 h ; aucun écart n'est ouvert sur une clé en vol.

### EPIC-177 : Fraîcheur, santé et alertes : Money Vibes le sait d'abord · à chiffrer au 04/12

**Au déclencheur · avec EPIC-176 · Amont : EPIC-169 (seuils), EPIC-174 → 176 ; moteur EPIC-148, EPIC-157** · Connecteurs FR-5,
FR-11, FR-12, FR-13 ; NFR-5 ; SM-3 · Connecteurs AD-16, AD-17, AD-30 · Dépôts : `connecteurs-service`,
`prospera-notification-service`, `prospera-app`, console.

**Backend**
- `GET /api/connecteurs/v1/etat-synchro` par domaine et par sens (`ageSecondes` calculé par Connecteurs ; `file` seulement pour
  `connecteurs:file:consulter`) ; seuils lus de `seuils-fraicheur@1` ; `NIVEAU_IMPOSSIBLE_SANS_API`.
- **Santé** (`DEGRADE` : domaine actif rouge, logiciel injoignable depuis 30 minutes, Redis indisponible, `[PROPOSÉ]` D-44) ;
  **incidents** ouverts à 30 minutes continues, fermés après 10 minutes sans rouge, une alerte à l'ouverture et une à la
  fermeture ; trois modèles de `notification-service` (`connecteurs.panne`, `connecteurs.panne.fin`, `connecteurs.nuit.absente`).
- Sur site : `instance.indicateurs`, schéma fermé (un test échoue si un numéro, un montant ou un nom en sort) ; mesure de SM-3
  corrigée du décalage d'horloge.

**Écrans**
- Coque : mentions de fraîcheur et bandeau de la file, rendus depuis `etat-synchro` (spine de la coque AD-7) ; santé du
  connecteur dans le module `connecteurs`.
- Console (`AP-`) : vue du parc (complète sur la plateforme, compteurs sur site).

**Fin de l'épic**
- Un domaine rouge ouvre un incident à 30 minutes : Money Vibes est alerté avant le client, une alerte à l'ouverture, une à la
  fermeture ; la coque et le service lisent les mêmes seuils ; aucun montant ni nom dans les indicateurs.

### EPIC-178 : La marche en parallèle, puis l'arrêt de la synchro domaine par domaine · à chiffrer au 04/12

**Au déclencheur · Amont : EPIC-173, EPIC-176 ; Reprise EPIC-166** · Connecteurs FR-2, FR-3 ; Reprise FR-17 ; UJ-8 ·
Connecteurs AD-3, AD-15, AD-33, AD-34 · Dépôts : `connecteurs-service`, `reprise-service`, `prospera-app`.

**Backend**
- **Marche en parallèle, dans l'essai, avant la mise en service** (D-48) : la Reprise de l'essai lit `connecteurs.nuit.terminee`
  et le rapport de concordance (`GET /api/connecteurs/v1/concordances/{id}`), construit son rapport d'écarts de la période et
  marque une nuit « non couverte » sur `connecteurs.nuit.absente` ; la mise en service attend l'écart nul de la période **et** le
  feu vert du réel. Mode `OMBRE` : la règle est tenue (`OMBRE_REFUSE_DANS_LE_REEL`), ses mécanismes restent différés.
- **Protocole de bascule** en cinq étapes (AD-33) : `BASCULE`, accusés des cibles, file vide, concordance à la demande, aucun
  écart d'argent ouvert ; une heure au plus, sinon retour à l'état précédent ; `MOUVEMENTS_EN_ATTENTE`, `ECART_OUVERT`.
- **Arrêt** d'un domaine (`ARRETE`) ; connecteur `TERMINE` quand tous le sont, identifiants effacés, données gardées.

**Écrans**
- Coque, module `connecteurs` : période de marche en parallèle, changer de propriétaire, arrêter un domaine, avec les refus
  nommés ; module `reprise` : rapport d'écarts de la période.

**Fin de l'épic**
- Une saisie concurrente pendant la bascule n'est jamais appliquée en direct ; l'arrêt d'un domaine d'argent est refusé avec un
  écart ouvert ; la mise en service est refusée tant que l'écart de la période n'est pas nul.

### EPIC-179 : Vivre les versions : migrer, revenir, restaurer, désinstaller sans perdre un mouvement · à chiffrer au 04/12

**Au déclencheur · Amont : EPIC-175 ; moteur EPIC-151, EPIC-153** · Connecteurs FR-21 ; C9, C12 · Connecteurs AD-21, AD-25,
AD-26, AD-35 · Dépôts : `connecteurs-service`, `prospera-app`.

**Backend**
- `migrer` idempotent ; versions N et N-1 relisent files, liaisons, écarts et travaux en vol pendant 7 jours ; lecteurs
  d'énumérations tolérants.
- **Retour arrière** : file suspendue jusqu'à `connecteurs:file:reprendre` (DSI) ; corrections proposées en mouvements inverses,
  jamais créées seules.
- **Restauration avec perte** : mouvements non confirmés `A_VERIFIER`, curseurs ramenés, liste des saisies perdues à
  l'intégrateur, garde fermée jusqu'à la fin ; une restauration antérieure à un effacement rejoue l'effacement (registre du
  moteur).
- **Désinstallation** : file figée, rien supprimé ; **réinstallation** : rejouer ou écarter la file, tracé ; interrupteurs lus dans
  l'état publié ; rétention d'AD-35.

**Écrans**
- Coque, module `connecteurs` : reprendre la file après un retour arrière, mouvements à vérifier après une restauration, file
  figée à la réinstallation.

**Fin de l'épic**
- Promouvoir, envoyer, revenir : rien n'est renvoyé chez le client ; restaurer : aucun mouvement perdu ni doublé (relevé et
  concordance) ; désinstaller : rien supprimé.

---

## Questions au PO (réponse en bloc)

| # | Question | Recommandation |
|---|---|---|
| 1 | Qui porte le **backend de la Reprise** (EPIC-162 → 164, 166 → 168) ? | **Dev A**. Les premières cibles (`pdv`, `catalogue`, `stock`, polices, sinistres) sont à lui : source et cible tiennent dans une tête. Dev B porte déjà le moteur avec un écart de 7 à 10 semaines ; il garde tous les écrans, le kit et les contrats. C'est le patron d'EPIC-153 et 154 (backend Dev A, écrans Dev B). |
| 2 | Qu'est-ce qui **cède** chez Dev A ? | En S7 et S8, la **démo microfinance du 15/01** passe après le 15/01 (votre ordre : « la microfinance en dernier ») ; en S9 et S10, **EPIC-158 puis EPIC-156** glissent (ordre de sacrifice du plan v3 §3). Sinon, Dev A à cinq ou six chantiers par semaine de S7 à S10. |
| 3 | Le **kit** en S4 chez Dev B ? | **Oui** : seule semaine avant le 21/12 où le dépôt n'est à personne et où Dev B n'a pas déjà quatre chantiers de code. Les stories d'EPIC-142 → 147 et 159 se finissent en S3. À défaut : S6 en 5ᵉ chantier de Dev B, et `pdv` reçoit son point d'import en S6. |
| 4 | Qui **valide** un lot dans l'essai du prospect ? | L'administrateur du prospect reçoit `reprise:lot:valider` par le rôle que l'offre d'essai installe (moteur FR-35) : un essai n'a pas de désignation écrite, et aucune validation de l'essai ne vaut dans le réel (Reprise AD-8). La règle « attribuable par le DG seul » (AD-26) s'applique au réel. |
| 5 | Connecteurs **non placé**, chiffré le 04/12 ? | **Oui**. Le chiffrage d'EPIC-170 → 179 donne le délai de construction à annoncer avant de signer un client qui garde Odoo ; la part échange du kit passe en premier, comme la part reprise. |
