---
stepsCompleted: [1, 2]
inputDocuments:
  - prospera-stories/prds/prd-assistant-ia-2026-08-02/prd.md
  - prospera-stories/prds/prd-assistant-ia-2026-08-02/review-rubric.md
  - prospera-stories/architecture/architecture-assistant-service-2026-08-16/ARCHITECTURE-SPINE.md (AD-1 → AD-23)
  - prospera-stories/architecture/architecture-assistant-service-2026-08-16/.memlog.md
  - prospera-stories/architecture-assistant-ia-2026-07-20.md (⛔ DÉPASSÉE — réemploi partiel seulement)
  - prospera-stories/architecture-prospera-ecosystem-2026-07-04.md (AD-P13, AD-P14, AD-P15, AD-P16)
  - prospera-stories/architecture/architecture-notification-service-2026-08-03/ARCHITECTURE-SPINE.md (AD-8, AD-9, AD-16, AD-19)
  - prospera-stories/architecture/architecture-stock-service-2026-08-15/ARCHITECTURE-SPINE.md (AD-15 — fournisseur de candidats)
  - prospera-stories/architecture/architecture-reseau-service-2026-08-15/ARCHITECTURE-SPINE.md (AD-13 — fournisseur de candidats)
  - prospera-stories/architecture/architecture-pdv-service-2026-08-15/ARCHITECTURE-SPINE.md (AD-6 — FR-V37)
  - prospera-stories/sprint-status.yaml (reserved_ranges + STORY-365, relevé le 2026-08-16)
  - prospera-stories/stories/STORY-365.md (RBAC tenant — l'amont, DÉJÀ CRÉÉE)
---

# Assistant IA socle (`assistant-service`) — Découpage en épics

## Vue d'ensemble

Découpage du PRD **Assistant IA socle** et de la colonne vertébrale (**AD-1 → AD-23**) en épics
implémentables. Périmètre **backend** ; le frontend suivra sa série propre dans son tracker.

**Série retenue : épics EPIC-095 → EPIC-105.** Dernier épic attribué au 2026-08-16 : **EPIC-094**
(`pdv-service`). Les plages `EPIC-044→053` (réseau), `EPIC-054→064` (notification), `EPIC-065→074`
(catalogue produits), `EPIC-075→084` (stock) et `EPIC-085→094` (PDV) sont **RÉSERVÉES** — vérifié dans
`reserved_ranges`. La plage est inscrite au nom de ce module **le jour où elle est prise**.

**Aucun `story_id` n'est réservé ici** — attribution au slotting, comme la règle l'exige.
*(`story_id_high_water_mark` relevé : `STORY-370`.)*

> ⚡ **`EPIC-026` est abandonné pour ce module.** L'identifiant désigne **aussi** « Projets »
> (`STORY-141`, **livrée** au S18 sur `platform-catalog-service`) — deux épics, un numéro, dont un déjà
> en production. L'Assistant IA prend **`EPIC-095`** et suivants *[arbitrage PO 2026-08-16]*.

> ⛔ **`STORY-115` → `STORY-119` sont à SUPERSÉDER, pas à réécrire.** Elles sont la recopie du §10 de la
> note d'architecture du 2026-07-20, **dépassée sur son principe cardinal** : elles n'ont ni mode, ni
> règle d'automatisation, ni file d'arbitrage, ni mandat. Le `goal` du sprint 35 les accompagne et dit
> encore, textuellement, *« l'IA PROPOSE, l'humain valide »* — la doctrine que le §2 du PRD **remplace**.
> ⚠️ `STORY-170` (`TranscriptionProvider`, `deferred` S40) dépend de `STORY-115`/`117` : à rattacher au
> nouveau découpage en même temps.

---

## ⚠️ 142 pts, le PRD en annonçait ~92. Les 50 d'écart sont sourcés.

| Source | Pts |
| --- | ---: |
| Incréments du PRD (1 + 2 + 3) | ~92 |
| **+ Socle, entitlement, gate et cloisonnement par dossier** (EPIC-095) | **+13** |
| **+ Base d'audit séparée et deux horloges de rétention** (EPIC-098) | **+6** |
| **+ Équité de la file d'inférence et vue plateforme** (EPIC-098) | **+5** |
| **+ Topic sortant, outbox et idempotence de l'exécution** (EPIC-104) | **+5** |
| **+ Déclaration des cinq droits et du droit de mode** (EPIC-095) | **+3** |
| **+ Catalogue des types d'action publié comme référentiel** (EPIC-101) | **+5** |
| **+ Volet `bilan-service` : renvoyer l'impact recalculé** (EPIC-100) | **+5** |
| **+ Aperçu du message et dégradation explicite** (EPIC-103) | **+3** |
| **+ Décideur typé, chaînage et immutabilité** (EPIC-097) | **+5** |
| **Total** | **142** |

1. ⚡ **Le socle n'était pas compté — cinquième fois d'affilée**, après `reseau`, `catalogue-produits`,
   `stock` et `pdv`. Ce n'est plus un accident de rédaction : c'est un **angle mort du gabarit de PRD**,
   ~13 pts à chaque module.
2. **Le +6 d'audit n'est pas du confort.** NFR-6 (reconstituable à deux ans) et FR-IA48 (minimisation)
   se contredisent sur le prompt intégral, qui porte de la donnée métier du client. AD-16 les réconcilie
   par **deux horloges** — la trace opposable au long cours, le contexte brut purgé court. Sans cette
   séparation, le journal d'audit devient le contournement de toute règle de conservation.
3. **Le +5 d'exécution est la conséquence directe de l'arbitrage n°1 du 16/08** : l'assistant publie
   `assistant.action.demandee` par outbox. ⚡ Ce n'est pas seulement une charge : c'est ce qui
   **affranchit l'incrément 3 de C8**, condition programme toujours ouverte.
4. **Le +5 de catalogue des types d'action est la doctrine elle-même.** Sans lui, FR-IA27, FR-IA36,
   FR-IA38 et NFR-2 sont inapplicables — la revue du PRD l'avait classé `critical`.

---

## ⛔ Trois stories HORS de ce service — **une seule est neuve**

| # | Où | Quoi | Bloque | État |
| --- | --- | --- | --- | --- |
| **1** | `auth-service` | **Étendre le RBAC au périmètre tenant** (AD-P15) — `perms[]` cesse d'être vide pour les rôles tenant | ⛔ **EPIC-104** (autorité de mandat, FR-IA36c) et le volet droits d'**EPIC-095** | ✅ **`STORY-365` EXISTE** — créée le 2026-08-15, slottée **S21**, épic `EPIC-025`, 8 pts |
| **2** | `platform-catalog-service` | **Publier le référentiel `types-action@AAAA.N`** + enregistrer le **module `assistant`** (entitlement) | ⛔ **EPIC-095** (entitlement) et **EPIC-101** (contrôle de mode) | ✅ **`STORY-371` CRÉÉE** le 2026-08-16, slottée **S21**, épic `EPIC-014`, 5 pts |
| **3** | `bilan-service` | **Renvoyer l'impact recalculé** après application d'une Proposition acceptée (AD-13) | ⛔ **SM-7** — sans elle NFR-1 reste une affirmation | ⬜ portée **par EPIC-100**, pas hors périmètre |

⚡ **La n°1 n'est PAS à créer, et c'est le point à ne pas rater.** Elle est déjà nommée par quatre
spines — `reseau` (FR-R28b), `catalogue-produits` (FR-C48), `stock` (FR-S61/S62), `pdv` — et
`assistant-service` en est le **cinquième dépendant**. L'arbitrage PO du 2026-08-16 (« l'épic Assistant
porte l'extension `perms[]` ») se réalise donc **en nommant `STORY-365` comme amont dur**, pas en créant
un doublon. ⚠️ Ce qui reste à faire ici est **plus étroit et bien réel** : `STORY-365` borne la
croissance de `perms[]` mais **ne connaît pas les six droits de l'assistant** — leur déclaration est
portée par EPIC-095, et l'**autorité de délivrance d'un mandat** (comparer le plafond du délivreur au
plafond délivré) est une capacité que `STORY-365` **n'a pas** en l'état. À vérifier contre son contenu
au moment de tirer EPIC-104.

---

⚡ **La n°2 est créée le jour du découpage, pas « au slotting »** — `STORY-371`, slottée **S21**, aux
côtés de `STORY-365`. Même motif et même arbitrage : ce sont deux **préalables cross-service** qui
doivent exister **avant** leur consommateur, faute de quoi le premier épic du module n'est pas tirable
et personne ne s'en aperçoit avant de vouloir le tirer.

---

## Blocs d'ordonnancement — **pas** des sprints

Capacité de référence : **34**. Aucun sprint attribué — l'ordonnancement est une décision PO.

| Bloc | Épics | Pts | vs 34 |
| --- | --- | ---: | --- |
| **1 — Le service existe et sait parler à un modèle** | EPIC-095, EPIC-096 | **26** | ✅ −8 |
| **2 — Le socle propose, et l'inférence se paie** | EPIC-097, EPIC-098 | **28** | ✅ −6 |
| **3 — Le socle ne ment pas** | EPIC-099, EPIC-100 | **24** | ✅ −10 |
| **4 — La doctrine devient exécutable** | EPIC-101, EPIC-102 | **26** | ✅ −8 |
| **5 — Le socle agit** | EPIC-103, EPIC-104, EPIC-105 | **38** | ⚠️ +4 |

Les blocs 1→3 recouvrent les incréments 1 et 2 du PRD ; les blocs 4 et 5, l'incrément 3.

### Contraintes d'ordre à ne pas défaire au slotting

- ⛔ **EPIC-097 précède tout le reste.** Le contrat Proposition est ce que les deux moteurs partagent.
  L'écrire après le moteur de règles produirait ce que le PRD existe pour empêcher : *deux services
  parallèles, deux audits, deux régimes de validation*.
- ⛔ **EPIC-101 précède EPIC-102, EPIC-103 et EPIC-104.** Le catalogue des types d'action est la **seule**
  source du contrôle de mode. Écrire les règles avant lui, c'est écrire un mode qui ne repose sur rien —
  et le rattrapage supposerait de revalider **toutes** les règles déjà configurées.
- ⛔ **EPIC-099 précède EPIC-100.** Une surface qui propose sans citation résolue produit exactement le
  défaut que NFR-3 interdit, et le mapping serait la première à en profiter.
- ⛔ **EPIC-098 dans le bloc 2, pas plus tard.** La mesure d'inférence se **fige à l'appel** (AD-17) :
  branchée après coup, tout ce qui a déjà été invoqué est définitivement non attribuable.
- ⚡ **EPIC-095 porte le `dossierId` dès sa PREMIÈRE version**, alors qu'aucune surface comptable n'existe
  encore. C'est délibéré : ajouté après, il faut reprendre les Propositions déjà produites — et entre
  les deux, un cabinet multi-dossiers voit des Propositions mélangées, **fausses et plausibles**.

### ⚠️ L'épic le plus risqué : EPIC-104

Son erreur ne se voit **pas** en test fonctionnel. Une règle en `AUTO` sur une action mal déclarée
fonctionne parfaitement : elle envoie, elle journalise, elle rend la main. Ce qui manque n'apparaît
qu'au moment où quelqu'un veut **défaire** — c'est-à-dire trop tard, et sur un acte qui engageait.
Même famille pour le mandat : un plafond vérifié en lecture puis écrit séparément laisse **deux
évaluations concurrentes le franchir ensemble**, et aucune des deux ne le voit.

⇒ Sa DoD porte **deux tests de mutation** : (a) rendre le catalogue permissif — déclarer `engageant:
NON` sur une action qui l'est — doit faire **rougir** la suite, pas passer ; (b) supprimer la
réservation du compteur de mandat doit faire **rougir** un test de concurrence, pas seulement ralentir.

---

## Carte de couverture des exigences

| Exigences | Épic |
| --- | --- |
| FR-IA01, FR-IA03, FR-IA45, FR-IA46, FR-IA47 · **NFR-4** · AD-7, AD-19 · AD-P13, AD-P15, AD-P16 | **EPIC-095** — socle, entitlement, gate, **cloisonnement à deux clés**, droits |
| FR-IA05 → FR-IA09 · **NFR-4** · R1 · AD-21 | **EPIC-096** — fournisseur de modèle, gabarits versionnés, API externe opt-in |
| FR-IA10 → FR-IA15 · SM-1 · CM-1, CM-2 · R2 · AD-1, AD-2, AD-3 | **EPIC-097** — le contrat Proposition, décideur typé, immutabilité chaînée |
| FR-IA44, FR-IA48 → FR-IA52 · **NFR-6**, NFR-7 · AD-16, AD-17, AD-18 | **EPIC-098** — audit à deux horloges, mesure, quota, files équitables |
| FR-IA16 → FR-IA20 · **NFR-3** · SM-2 · A3 · AD-14, AD-15 | **EPIC-099** — corpus versionné, index reconstructible, citation résolue |
| FR-IA12b, FR-IA12c, FR-IA21 → FR-IA23 · **NFR-1** · SM-5, SM-7 · A4 · AD-13, AD-22 | **EPIC-100** — surface pilote mapping et l'**écart annoncé/recalculé** |
| FR-IA23b, FR-IA23c, FR-IA27, FR-IA38 · **NFR-2** · R5 · Q7 · AD-4, AD-5 | **EPIC-101** — catalogue des types d'action et contrôle de mode |
| FR-IA24 → FR-IA26, FR-IA28, FR-IA04 · AD-9, AD-11 | **EPIC-102** — règles, socle standard surchargeable, quota, déclenchement planifié |
| FR-IA29 → FR-IA33, FR-IA03b, FR-IA03c · SM-6 · R7 · AD-8, AD-12 | **EPIC-103** — évaluation, candidats, cibles, aperçu, scores explicables |
| FR-IA34 → FR-IA39, FR-IA02 · **NFR-2**, NFR-5 · SM-4 · AD-6, AD-10, AD-20 | **EPIC-104** — les trois modes, le **mandat**, l'exécution demandée, l'interrupteur |
| FR-IA40 → FR-IA43 · CM-1, CM-3 · R2 · AD-23 | **EPIC-105** — file d'arbitrage bornée, journal, statistiques |

**Couverture : les 52 identifiants FR-IA** (FR-IA01 → FR-IA52, plus les sept *bis*), **7 NFR sur 7**,
**23 AD sur 23**, **7 SM**, **3 CM**, **7 risques**. Aucun différé.

---

## EPIC-095 : Socle, entitlement, gate, cloisonnement à deux clés et droits · 16 pts

**Autonome :** ⛔ **non** — bloqué par la story hors service **n°2** (module `assistant` au catalogue).

- Scaffold `assistant-service` **`:3011`** : **deux bases** (`assistant_service`,
  `assistant_service_audit`), configuration, santé, **démarrage dégradé** — le service démarre sans bus
  **et sans modèle**, `/health` annonce `llm: down` (FR-IA02).
- Gate **`@RequiresAssistantAccess`** = `emailVerified` + KYC `APPROVED` + entitlement `ACTIVE`, lu dans
  les read-models locaux. Code de module : **`assistant`**.
- Read-models entrants (`identity.*`, `kyc.status.changed`, `entitlement.changed`, `referentiel.changed`)
  — patron **à copier** de `bilan-service` / `balance-service`, pas à concevoir.
- ⚡ **La ligne à écrire noir sur blanc dans le premier commit** (AD-7) : FR-IA03 interdit toute copie de
  donnée **métier** — il **n'interdit pas** les read-models d'**autorisation**. Sans cette précision, un
  développeur cable un appel synchrone à `auth-service` sur le chemin chaud, ce que l'écosystème
  interdit.
- ⚡ **Cloisonnement à DEUX clés** (AD-19) : `orgId` du **jeton signé**, `dossierId` de **l'URL**, vérifié
  contre la portée serveur à chaque appel. ⛔ **Ne jamais inférer le dossier du jeton.** Hors portée ⇒
  **`404`, jamais `403`**.
- **Six droits déclarés** au catalogue de permissions, attribuables séparément : créer une règle ·
  **changer son mode** · arbitrer une file · accepter une Proposition · administrer les modèles ·
  **délivrer un mandat**. ⚠️ Amont : `STORY-365`.
- **Route de lecture plateforme** (AD-P16) : `orgId` en paramètre explicite, lecture seule, journalisée.
- Outbox transactionnelle posée dès ce commit ; énumération `AssistantTopic` **séparée**.

## EPIC-096 : Le fournisseur de modèle et les gabarits versionnés · 10 pts

**Autonome :** oui. **Amont :** EPIC-095.

- Port **`LlmProvider`** sur une **API standard du marché** — quatrième déclinaison du patron après
  `OcrProvider`, `PaymentProvider`, `ChannelProvider`. ⛔ Aucun modèle concret référencé dans le code.
- Environnement de développement : petit modèle local en conteneur. ⚠️ **Il valide la mécanique, jamais
  la qualité** — un petit modèle hallucine les citations légales (R1). À écrire dans le README du
  service, pas seulement dans le PRD : c'est là qu'un développeur ira chercher la réponse.
- Production : **modèle auto-hébergé**. Le changement de modèle est **`LLM_BASE_URL` + `LLM_MODEL`**,
  **zéro ligne de code** — prouvé par un test qui bascule l'implémentation sans toucher au domaine.
- **Gabarits versionnés et possédés par le service** ; chaque invocation fige `modele` +
  `versionGabarit`. ⛔ Aucune chaîne de prompt littérale dispersée dans le code.
- **API externe** : jamais un défaut. Activation **explicite par organisation**, minimisation, audit de
  chaque envoi (FR-IA09).
- ⚠️ **Ce qui n'est PAS livré ici** : le serveur d'inférence de production (Q2, ouverte depuis le
  2026-07-20). L'épic est démontrable sans lui ; la **qualité** ne l'est pas.

## EPIC-097 : Le contrat Proposition — décideur typé, immutabilité chaînée · 14 pts

**Autonome :** oui. **Amont :** EPIC-095, EPIC-096. ⛔ **Précède tout le reste.**

- La **`Proposition`** persistée : organisation, **dossier**, surface, référence de contexte, contenu,
  justifications, confiance **exposée**, statut, modèle, version de gabarit, version de corpus,
  horodatage. ⛔ **Jamais un effet de bord direct.**
- ⚡ **`origine: LANGAGE | REGLE`** dès la première version (AD-1), alors que le moteur de règles n'existe
  pas encore. C'est ce discriminant qui tient la thèse du PRD — **un seul contrat pour deux moteurs** ;
  l'ajouter après supposerait de migrer toutes les Propositions déjà produites.
- ⚡ **Décideur TYPÉ** `HUMAIN | REGLE | MANDAT` (AD-2), obligatoire, sans quatrième valeur et **sans
  valeur `SYSTEME`**. C'est la seule chose qui rendra **SM-1** et **CM-1** mesurables le jour où le mode
  `AUTO` existera.
- **Immutabilité** : ré-proposer crée une nouvelle Proposition qui **cite** la précédente. ⛔ Rien n'est
  réécrit — l'historique des refus est la matière première de l'amélioration.
- **Expiration** par job à clé idempotente (AD-9), **pas** un calcul à la lecture : une Proposition
  expirée doit l'être aussi pour celui qui ne la lit jamais.
- **États visibles, jamais silencieux** : `BLOQUEE` porte le garde-fou qui l'a retenue, `NON_SOURCEE`
  reste listée et non acceptable.
- ⛔ **La confiance n'ouvre rien** : elle s'affiche, elle n'entre dans aucune décision. Un test interdit
  explicitement tout seuil de confiance sur un chemin d'autorisation.
- Transmission d'une Proposition acceptée à sa **surface consommatrice**, qui l'applique par **son**
  flux déterministe.

## EPIC-098 : Audit à deux horloges, mesure d'inférence, quota et files équitables · 14 pts

**Autonome :** oui. **Amont :** EPIC-096, EPIC-097. ⛔ **À faire dans le bloc 2, pas plus tard.**

- **Audit append-only** dans `assistant_service_audit`, protégé par le **rôle serveur** — pas par la
  discipline du code (patron `paiement` AD-10).
- ⚡ **Deux horloges** (AD-16) : la *trace opposable* — décision, décideur, citations, modèle, version de
  gabarit, écart, coût — conservée au long cours pour NFR-6 ; le *contexte brut* envoyé au modèle et le
  *rendu figé* purgés à échéance **courte et paramétrable**. ⚠️ Sans cette séparation, le journal d'audit
  devient le contournement de toute règle de conservation — et le §9.3 du PRD `notification` a déjà
  montré qu'on peut affirmer une minimisation qu'on ne fait pas.
- **Aucune invocation anonyme** : organisation, surface, **auteur (utilisateur ou règle)**, taille de
  contexte, durée, modèle, version — **figés à l'appel**, jamais recalculés à la lecture.
- **Quota par organisation et par période**, **fail-closed** : le dépassement **refuse** avec un code
  nommé (`QUOTA_INFERENCE_DEPASSE`, `429`) et un message clair. ⛔ Jamais une attente sans fin.
- ⚡ **Deux files** — interactive et différée — et **équité par tourniquet entre organisations**, jamais
  FIFO global (FR-IA52). Un dossier fiscal argumenté ne doit pas retarder les mappings de tous les
  autres clients.
- **Vue plateforme** sur compteurs **pré-agrégés** ; ⛔ **aucun chemin de code ne rend l'`orgId`
  facultatif** sur une collection opérationnelle.
- Cibles NFR-7 consignées comme **à reconfirmer après mesure**, jamais comme des seuils acquis.

## EPIC-099 : L'ancrage légal — corpus versionné, index reconstructible, citation résolue · 11 pts

**Autonome :** oui. **Amont :** EPIC-096, EPIC-097.

- Le **corpus** devient un **référentiel versionné** `corpus-legal-<pays>@AAAA.N` (code, version,
  `artifactUri`, checksum) — le contenu existe déjà : **1 185 articles CGI/LPF livrés le 2026-07-19**.
  L'extension multi-pays est une **donnée**, pas un développement (A3).
- **Index d'embeddings reconstructible**, construit au démarrage et au changement de version, tenu en
  mémoire. ⛔ **Jamais une source** : le perdre n'entraîne aucune perte de donnée. *Décision d'AD-14 :
  925 Ko ne justifient pas une dépendance d'exploitation supplémentaire.*
- **`EmbeddingProvider`** interchangeable au même titre que le modèle ; changer de moteur **invalide et
  reconstruit** l'index, sans toucher aux Propositions déjà écrites.
- ⚡ **La citation se résout contre la `versionCorpus` figée sur la Proposition** (AD-15). Une référence
  qui ne résout pas **dans cette version** vaut **absence de citation** — sinon une citation valide l'an
  dernier reste applicable aujourd'hui.
- **Sans citation ⇒ `NON_SOURCEE`, non acceptable**, refus porté par le **domaine** et non par l'écran :
  aucun chemin d'appel ne peut contourner la règle.
- L'extrait affiché est **relu du corpus**, jamais recopié de la réponse du modèle.
- **DoD — la preuve de NFR-3** : un jeu de questions dont la réponse **n'est pas** dans le corpus doit
  produire **100 % de Propositions `NON_SOURCEE`** et **zéro invention plausible**.

## EPIC-100 : Surface pilote — mapping de comptes et l'écart annoncé/recalculé · 13 pts

**Autonome :** ⛔ **non** — porte le volet `bilan-service` (story hors service **n°3**).
**Amont :** EPIC-099.

- Pour un compte que le référentiel ne reconnaît pas, l'assistant **propose un rattachement** à un poste,
  justifié par la règle comptable applicable.
- La proposition **alimente le flux de surcharge existant** de `bilan-service` (FR-008) — déjà « une
  proposition validée par un humain et tracée ». ⛔ **Elle ne le court-circuite pas.**
- ⚡ **Une surface = un gabarit versionné + une configuration** (AD-22). **Le noyau n'est pas touché** —
  et c'est **SM-5** qui se mesure sur ce critère, pas sur une impression. Le conseil fiscal (`EPIC-024`)
  s'y branchera par le même chemin.
- ⚡ **Le volet `bilan-service`** : renvoyer **l'impact recalculé** après application. Sans lui, `SM-7`
  est immesurable et *« le déterministe fait foi »* reste une affirmation.
- **L'écart est restitué à celui qui a tranché**, dans 100 % des cas, et **agrégé par surface** : un
  écart significatif **répété** est un **défaut de qualité de la surface**, avec son taux — pas un
  incident isolé.
- Le choix du mapping comme pilote est **structurant** : c'est la seule surface dont le pire cas est une
  suggestion refusée.

## EPIC-101 : Le catalogue des types d'action et le contrôle de mode · 13 pts

**Autonome :** ⛔ **non** — bloqué par la story hors service **n°2** (publication du référentiel).
⛔ **Précède EPIC-102, EPIC-103 et EPIC-104.**

- Le **catalogue** est un **référentiel versionné** `types-action@AAAA.N` publié par
  `platform-catalog-service`, chargé au démarrage et sur `referentiel.changed`, **validé par schéma**.
  ⛔ L'assistant le **consomme**, il ne le publie pas : *c'est `notification-service` qui sait qu'un envoi
  WhatsApp n'est pas rattrapable.*
- Chaque entrée déclare `code`, `reversible`, `engageant`, `moyenAnnulation`, `serviceExecutant`. **Ces
  propriétés sont la seule source du contrôle de mode.**
- ⚡ **Défaut strict** : un type d'action **non déclaré** est **engageant et irréversible**. Un catalogue
  absent, périmé ou illisible dégrade vers le **régime le plus strict** — l'absence est sûre, jamais
  permissive.
- La règle **fige** `(codeTypeAction, versionReferentiel)` validé ; à l'exécution, une divergence sur
  `reversible`/`engageant` **suspend** la règle — ⛔ ni exécutée, ni silencieusement rétrogradée — avec
  journal et notification au responsable.
- Le service **refuse** (`422`) une configuration de mode incompatible ; il ne la déconseille pas (R5).
- Abaisser un mode est permis, l'élever au-delà du catalogue ne l'est jamais.

## EPIC-102 : Les règles — vocabulaire fermé, socle surchargeable, déclenchement planifié · 13 pts

**Autonome :** oui. **Amont :** EPIC-101.

- Une **règle** déclare : déclencheur, **action prise au catalogue**, canal, **mode**, garde-fous,
  **quota**, et le **poste responsable**.
- ⚡ **« Les règles sont des données » ne veut PAS dire « les règles sont un langage »** (AD-11).
  Déclencheurs, conditions, garde-fous et scores sont un **vocabulaire fermé**, chacun une **classe
  enregistrée au démarrage** ; la règle ne porte que des **paramètres validés par schéma**. ⛔ **Aucune
  évaluation dynamique d'expression, nulle part.** *Leçon `notification-service` : un modèle client n'est
  pas un programme.*
- **Socle de règles standard** livré par Prospera (`orgId: null`), **surchargé par copie** — une
  organisation ne peut pas altérer celui des autres.
- ⛔ **Quota de sollicitation obligatoire** sur toute règle qui contacte une personne : plafond par
  destinataire et par période. Une règle sans quota est **refusée à la création**, pas avertie.
- ⚡ **Le déclencheur est un travail BullMQ à clé idempotente** `(regleId, fenêtre)`, cadence déclarée et
  bornée (AD-9). ⛔ Aucun `setInterval`, aucune minuterie applicative. *Le PRD ne définissait jamais
  « déclencheur » : avec FR-IA03 et FR-IA04, la scrutation planifiée est la seule mécanique possible.*
- ⛔ **Pas de déclencheur événementiel au v1** — il supposerait un abonnement métier, donc une amende
  d'AD-7. Une cadence d'une minute n'est **pas** un substitut acceptable.

## EPIC-103 : L'évaluation — candidats, cibles, aperçu réel, scores explicables · 13 pts

**Autonome :** oui. **Amont :** EPIC-102.

- ⚡ **Le contrat unique de fournisseur de candidats** (AD-8) — celui que **quatre spines exposent déjà**
  sans qu'il existe : `stock` FR-S39, `pdv` FR-V37, `reseau` FR-R34, `notification` AD-19. Demande :
  `(regleId, conditionDeclaree, curseur, plafondDePage)`. Réponse : `(candidats[], asOf, curseurSuivant)`.
- ⛔ **Des faits, jamais un jugement ni une action.** Le module détenteur reste seul juge de ses données.
- ⚡ **Un lot vide et une panne ne se représentent pas pareil** : indisponibilité, dépassement de délai ou
  réponse invalide ⇒ **non-exécution inscrite au journal et visible** (FR-IA03c, `503`). *Une règle qui
  n'a pas tourné et que personne ne voit est pire qu'une règle désactivée.*
- Une **cible** porte libellé, canal, **message réellement prêt à partir**, valeur, score, échéance.
- ⚡ **Le message est rendu par `notification-service`** (AD-12) — l'assistant ne détient **aucun** moteur
  de gabarit. ⛔ **Repli interdit : rendre localement** ; deux moteurs produiraient un aperçu différent
  du message envoyé. Tant que **C8** n'est pas tranchée, l'aperçu **dégrade explicitement**
  (`apercuIndisponible`) et **la règle ne peut pas passer en `AUTO`**.
- **Score par calculateur enregistré**, règle experte explicable au v1 (A2), **portant toujours ses
  facteurs**. ⛔ Un calculateur qui ne peut pas les restituer ne peut pas être enregistré.
- **Prévisualisation à blanc** (SM-6 = 100 %) : les Propositions d'essai ne sont **pas persistées** et ne
  remplissent pas la file d'arbitrage.
- **Cible retenue par un garde-fou : visible**, avec le garde-fou qui l'a retenue.

## EPIC-104 : Les trois modes, le mandat, l'exécution demandée et l'interrupteur · 14 pts

**Autonome :** ⛔ **non** — amont dur **`STORY-365`** (S21). **Amont :** EPIC-101, EPIC-103.
⚠️ **L'épic le plus risqué du module.**

- **`SUGGESTION`** (l'assistant signale) · **`VALIDATION`** (il prépare, un humain déclenche — mode par
  défaut de tout ce qui touche à l'argent, à une remise ou à la réputation) · **`AUTO`** (quatre
  conditions **cumulatives et vérifiées** : réversible, sans engagement, sous quota, journalisée).
- ⚡ **`AUTO_SOUS_MANDAT`** : plafond **cumulé sur la période** + plafond unitaire optionnel, en
  `(entier d'unité mineure, devise)` — ⚠️ **le XOF n'a aucune décimale**. Date d'expiration,
  révocabilité immédiate. *[arbitrage PO 2026-08-16 : l'assiette est cumulée — un plafond par acte ne
  borne pas l'engagement total, quarante commandes sous plafond l'épuisent sans jamais le franchir.]*
- ⛔ **Compteur réservé avant la demande, confirmé au succès, libéré à l'échec.** Aucune vérification en
  lecture suivie d'une écriture séparée.
- **Autorité du délivreur vérifiée** (FR-IA36c) : le service **refuse** un mandat dont le plafond excède
  celui que le délivreur détient. ⛔ **Aucun mandat délivrable avant `STORY-365`** — un mandat sans
  contrôle d'autorité est une délégation que son bénéficiaire s'accorde lui-même.
- Chaque exécution sous mandat **cite le mandat**, son plafond, son échéance. Un mandat **expiré ou
  révoqué** fait retomber ses règles en `VALIDATION`, **avec notification**, jamais en silence.
- ⚡ **L'exécution est une demande, pas une écriture** (AD-10) : `assistant.action.demandee` publié par
  **outbox**, dans la transaction qui écrit l'`Execution`, **idempotent par `executionId`**.
  ⚠️ **Ceci amende FR-IA04** — à reporter dans le PRD.
- **L'annulation est une compensation demandée** au module exécutant par le `moyenAnnulation` déclaré.
  ⛔ L'assistant n'invente aucune écriture inverse.
- Toute exécution autonome est **notifiée au responsable de la règle** — l'autonomie n'est jamais
  silencieuse (SM-4 < 1 %).
- **Interrupteur général** par organisation : **état lu à l'exécution**, fail-closed, vérifié juste avant
  d'agir. ⛔ Pas une désactivation règle par règle.
- Une règle dont l'action exige le modèle est **suspendue visiblement** quand `llm: down` (NFR-5).
- **DoD — deux tests de mutation** : rendre le catalogue permissif doit faire **rougir** la suite ;
  supprimer la réservation du compteur de mandat doit faire **rougir** un test de concurrence.

## EPIC-105 : File d'arbitrage bornée, journal et statistiques · 11 pts

**Autonome :** oui. **Amont :** EPIC-103, EPIC-104.

- **File d'arbitrage** triée par **valeur et urgence**, filtrable par règle et par poste, le détail de
  chaque cible restant accessible **depuis le lot**.
- ⚡ **Décision groupée plafonnée DANS LE DOMAINE** — défaut **25**, plafond dur **100**, **motif exigé**
  au-delà du défaut (AD-23). ⛔ Bornes **paramétrées**, jamais des constantes d'interface : l'écran ne
  peut pas les contourner. *Le PRD crée le risque de validation de façade avec cette fonction ; il le
  borne ici et le surveille par CM-1.*
- **Journal des exécutions** restituable par période et par règle — ce que chaque règle a fait, sur
  quelles cibles, avec quel résultat.
- **Statistiques par règle** : exécutions, succès, impact, temps de travail évité. ⛔ **Une règle qui n'a
  jamais réussi doit être visible comme telle.**
- ⚡ **La route de lecture est livrée par la même story que l'écriture, avec son consommateur nommé.**
  Ce dépôt a payé trois fois l'écriture sans lecture (`admin_audit_logs`, `profils_societe_audit`,
  journal de dossier).
- **CM-1, CM-2 et CM-3 deviennent observables ici** : taux d'acceptation > 90 % sur 30 jours, délai
  médian en baisse avec acceptation en hausse, part des règles jamais arbitrées dont la file s'accumule.

---

## Les 7 questions du PRD — état au 2026-08-16

| # | Question | Réponse | Où |
| --- | --- | --- | --- |
| **Q1** | Scoring et prévision : quel module, quand, sur quel historique ? | ⏸ **reportée** (décision PO) — hors périmètre, module dédié | — |
| **Q2** | Serveur d'inférence : quelle machine, quel modèle de production ? | ⛔ **OUVERTE depuis le 2026-07-20** — borne la **qualité** de NFR-3, pas la livraison | EPIC-096 |
| **Q3** | Nom du service | **`assistant-service`** ; ⚡ ce qui compte est le **code de module `assistant`**, arrêté | EPIC-095 |
| **Q4** | Stockage vectoriel : index simple ou moteur dédié | ⚡ **Index reconstructible en mémoire** — un store dédié devient une conséquence de croissance, pas un prérequis | EPIC-099 |
| **Q5** | Qui a le droit de passer une règle en `AUTO` ? | **Droit distinct** de celui d'arbitrer, déclaré au catalogue ; l'attribution est une décision de gouvernance du client | EPIC-095, EPIC-101 |
| **Q6** | Comment atteindre la donnée métier sans copie ? | ✅ **tranchée** — le module détenteur expose un **fournisseur de candidats** | EPIC-103 |
| **Q7** | Qui alimente et valide le catalogue des types d'action ? | ✅ **tranchée le 16/08** — chaque module exécutant fournit ses entrées, Money Vibes **publie la version**, même circuit que le paquet fiscal. **Responsable de publication à nommer** | EPIC-101 |

## Les 4 arbitrages PO du 2026-08-16, et où ils vivent

| # | Arbitrage | Conséquence sur le découpage |
| --- | --- | --- |
| **1** | Un topic `assistant.action.demandee` par **outbox** | ⚡ **Affranchit l'incrément 3 de C8.** EPIC-104 devient tirable sans arbitrage programme. ⚠️ **Amende FR-IA04** |
| **2** | Plafond de mandat **cumulé** + unitaire optionnel | Le compteur réservé/confirmé d'EPIC-104, et son test de concurrence en DoD |
| **3** | **`dossierId` dès l'incrément 1** | Porté par EPIC-095, avant toute surface comptable. ⚠️ **Amende FR-IA47** |
| **4** | L'épic porte l'extension `perms[]` | ⚡ **Corrigé au découpage : `STORY-365` EXISTE déjà** (S21). L'épic la **nomme comme amont dur** au lieu d'en créer un doublon — et livre à part la **déclaration des six droits** |

⚠️ **Deux amendements restent à reporter dans le PRD** — **FR-IA04** et **FR-IA47**. Tant qu'ils n'y sont
pas, le document amont contredit la spine et ce découpage : c'est exactement ce qui a rendu la note du
2026-07-20 dangereuse, et ce dépôt l'a payé cinq fois.
