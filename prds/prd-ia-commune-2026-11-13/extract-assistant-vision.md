# Extraction pour le PRD « L'IA commune de Prospera »

Sources lues : PRD assistant-ia (2026-08-02, final, amendé 2026-08-16) et sa revue ; spine assistant-service (AD-1 à AD-23, amendée 2026-11-13 : port :3417) ; épics EPIC-095 à EPIC-105 ; note de vision locale du 2026-11-10 (stratégie v2 du 11/11, séances 13 à 17). Aucun amendement séparé du PRD n'existe : les amendements sont marqués en place `[AMENDÉ 2026-08-16]`.

---

## 1. Ce qu'est assistant-service aujourd'hui

### 1.1 Définition et périmètre

- Définition du PRD : « la capacité de jugement assisté de Prospera : il propose ce qu'il ne peut pas décider, il exécute ce qui ne l'engage pas, et il justifie tout ce qu'il avance ».
- Deux moteurs, un seul contrat de sortie : le moteur de langage (LLM + RAG, produit une Proposition argumentée et sourcée) et le moteur de règles (produit une Proposition ou une action, selon le mode).
- Placement : service dédié, relying party de l'IdP (JWKS RS256), base propre, démarrage dégradé. Hexagonal autour d'un noyau sans mémoire métier. Port **:3417** (amendement du 13/11 ; :3011 reste à microfinance-service). Bases `assistant_service` et `assistant_service_audit`. Code de module au catalogue : `assistant`.
- Stack : NestJS 11, Mongo 7 réplica set, kafkajs, BullMQ/Redis. Fonctionne en ligne chez Money Vibes ; la question du déploiement sur site chez un client n'est traitée nulle part.
- Découpage : 3 incréments PRD (~92 pts annoncés), 11 épics EPIC-095 à EPIC-105, **142 pts** réels (+50 : socle, audit, équité, outbox, catalogue, volet bilan, aperçu, décideur typé). 5 blocs d'ordonnancement, capacité de référence 34 pts. Épic le plus risqué : EPIC-104 (modes, mandat).

### 1.2 Hors périmètre déclaré (important pour l'IA commune)

| Exclu | Motif écrit | Statut |
|---|---|---|
| Scoring et prévision (churn, défaut, demande, PAR, tournées) | « Autre métier » : modèles statistiques et historique, pas modèles de langage. Q1 | Reporté, « module dédié, plus tard ». Seul crochet : calculateur de score interchangeable (FR-IA32, A2), règle experte explicable au v1 |
| Copilot conversationnel | Module dédié plus tard (R3) | Le contrat Proposition et `LlmProvider` lui serviront de socle, « aucune amende de spine attendue » |
| OCR par IA | Reste dans `document-service` (Tesseract) derrière `OcrProvider` | Hors périmètre |
| Exécution des actions | `notification-service` envoie, les moteurs déterministes écrivent | L'assistant décide, il n'exécute pas |
| Calcul de tout chiffre officiel | NFR-1 | Interdit |
| Déclencheur événementiel | Supposerait un abonnement métier (amende d'AD-7) | Différé |
| Facturation de l'inférence | AD-17 rend le modèle de coût complet | Politique = produit |
| TranscriptionProvider (STORY-170) | Attend le dépôt mobile | Différé |

### 1.3 Décisions qui SURVIVENT et à reprendre telles quelles

1. **La doctrine** (PRD §2) : le curseur n'est pas « IA ou humain » mais « l'acte est-il réversible et sans engagement ? ». Critère observable, indépendant de la confiance dans le modèle.
2. **Un seul contrat de sortie : la Proposition** (AD-1). Persistée, jamais un effet de bord direct. Champs : organisation, **dossier**, surface, référence de contexte, contenu, justifications, confiance exposée, statut, modèle, version de gabarit, version de corpus, horodatage.
   - `origine: LANGAGE | REGLE`, dès la première version. Une « Cible » n'est pas un type : c'est une Proposition d'origine `REGLE`.
   - Cycle : `PROPOSED → ACCEPTED | REJECTED | EXPIRED`, plus états visibles `BLOQUEE` (garde-fou nommé) et `NON_SOURCEE` (visible, non acceptable). Il n'existe pas d'état `EXECUTE`.
   - Immuable hors transition ; ré-proposer crée une nouvelle Proposition qui cite la précédente (`remplace`). L'historique des refus est la matière première de l'amélioration.
   - Expiration par job BullMQ idempotent, pas un calcul à la lecture.
   - Prévisualisation à blanc : Propositions non persistées, hors file d'arbitrage.
3. **Décideur typé** (AD-2) : `HUMAIN | REGLE | MANDAT`, obligatoire, aucune valeur `SYSTEME`. SM-1 et CM-1 se calculent exclusivement sur ce discriminant.
4. **L'Exécution est un agrégat distinct, append-only**, qui cite la Proposition, le mandat éventuel, le module exécutant et le résultat.
5. **Catalogue des types d'action** (AD-4) : référentiel versionné `types-action@AAAA.N` publié par `platform-catalog-service`, chaque module exécutant fournit ses entrées. Champs : `code`, `reversible` (OUI/NON/SOUS_CONDITIONS), `engageant`, `moyenAnnulation`, `serviceExecutant`. **Un type non déclaré = engageant et irréversible** (le défaut est le régime le plus strict). L'assistant le consomme, ne le publie pas.
6. **Contrôle de mode** (AD-5) : la règle fige `(codeTypeAction, versionReferentiel)`, le contrôle est rejoué à l'exécution, la divergence **suspend** (ni exécutée, ni rétrogradée en silence). Configuration incompatible refusée en `422`. On peut abaisser un mode, jamais l'élever. **L'indice de confiance est exposé et n'entre dans aucune décision** : aucun seuil de confiance n'ouvre l'autonomie.
7. **Trois modes + mandat** : `SUGGESTION`, `VALIDATION` (défaut pour tout ce qui touche argent, remise, réputation), `AUTO` (4 conditions cumulatives : réversible, n'engage rien, sous quota, journalisée), `AUTO_SOUS_MANDAT`.
8. **Mandat** (AD-6) : délégation de signature bornée. Délivreur, périmètre, **plafond cumulé sur la période** (arbitrage PO) + plafond unitaire optionnel, en `(entier d'unité mineure, devise)` (le XOF n'a aucune décimale), date d'expiration, révocabilité immédiate. Compteur transactionnel réservé avant, confirmé au succès, libéré à l'échec. Autorité du délivreur vérifiée (refus, pas signalement). Mandat expiré ou révoqué : les règles retombent en `VALIDATION`, avec notification. Chaque exécution cite le mandat.
9. **Outbox `assistant.action.demandee`** (AD-10, arbitrage PO n°1, amende FR-IA04) : l'exécution est une demande par événement, partition `orgId`, dans la transaction qui écrit l'Exécution, idempotente par `executionId`. L'annulation est une compensation demandée au même module par le `moyenAnnulation`. Toute exécution autonome est notifiée au responsable de la règle. Un seul topic sortant, aucun topic entrant de donnée métier.
10. **Aucune donnée métier détenue** (AD-7, FR-IA03) : le contexte vient de l'appelant (interactif) ou d'un fournisseur de candidats interrogé à l'évaluation (automatique). Les read-models d'autorisation (`identity.*`, `kyc.status.changed`, `entitlement.changed`, `referentiel.changed`) sont, eux, autorisés. L'assistant possède en propre : Propositions, Règles, Mandats, Exécutions, journal, gabarits, compteurs d'inférence.
11. **Fournisseur de candidats** (AD-8) : contrat unique `(regleId, conditionDeclaree, curseur, plafondDePage)` → `(candidats[], asOf, curseurSuivant)`. Des faits datés, jamais un jugement ni une action. Une panne est une non-exécution journalisée et visible, distincte d'un lot vide (`503`).
12. **Déclencheur** (AD-9) : job BullMQ à clé idempotente `(regleId, fenêtre)`, aucun `setInterval`. La scrutation planifiée est la seule mécanique au v1.
13. **Règles = vocabulaire fermé et stratégies typées** (AD-11), aucune évaluation dynamique d'expression. Socle de règles standard (`orgId: null`) surchargé par copie. Quota de sollicitation obligatoire pour toute règle qui contacte une personne. Un score porte toujours ses facteurs.
14. **Message rendu par `notification-service`** (AD-12) : l'assistant ne détient aucun moteur de gabarit. Aperçu figé sur la Proposition ; repli interdit = rendre localement. Seul appel synchrone sortant ; tant que C8 (auth machine-à-machine) n'est pas tranchée, l'aperçu dégrade explicitement et la règle ne peut pas passer en `AUTO`.
15. **Écart annoncé/recalculé** (AD-13, FR-IA12b/c, SM-7) : la surface renvoie l'impact recalculé, l'écart est restitué à celui qui a tranché dans 100 % des cas et agrégé par surface comme défaut de qualité.
16. **RAG ancré** : corpus = référentiel versionné par pays/année `corpus-legal-<pays>@AAAA.N` (1 185 articles CGI/LPF livrés le 19/07/2026) ; index d'embeddings en mémoire, reconstructible, jamais une source ; `EmbeddingProvider` interchangeable. Citation résolue contre la `versionCorpus` figée, sinon `NON_SOURCEE`. Extrait relu du corpus, jamais recopié du modèle. NFR-3 : questions hors corpus = 100 % non sourcées.
17. **`LlmProvider`** (AD-21) : port unique sur API standard du marché ; changer de modèle = `LLM_BASE_URL` + `LLM_MODEL`, zéro code. Chaque Proposition et invocation fige modèle + version de gabarit. Gabarits versionnés et possédés par le service. Dev : petit modèle local, valide la mécanique et jamais la qualité (R1). Prod : auto-hébergé sur l'infrastructure Money Vibes. API externe jamais par défaut : activation explicite par organisation, accord interdisant l'entraînement, minimisation, audit de chaque envoi.
18. **Surface = gabarit versionné + configuration, noyau intact** (AD-22, SM-5). Une surface consomme des Propositions et ne les applique jamais sans son flux déterministe. Surface pilote : mapping de comptes (pire cas = suggestion refusée).
19. **Audit à deux horloges** (AD-16) : base séparée protégée par rôle serveur, append-only. Trace opposable conservée au long cours (NFR-6, reconstituable à 2 ans) ; contexte brut et rendu figé purgés à échéance courte. Contexte minimisé à la surface.
20. **Mesure et équité d'inférence** (AD-17, AD-18) : aucune invocation anonyme (organisation, surface, auteur utilisateur ou règle, taille, durée, modèle, version, figés à l'appel) ; quota fail-closed (`429`, `QUOTA_INFERENCE_DEPASSE`) ; deux files (interactive, différée) avec tourniquet entre organisations ; vue plateforme sur compteurs pré-agrégés, jamais d'`orgId` facultatif.
21. **Gate et cloisonnement** (AD-19, AD-20) : gate local (email vérifié + KYC `APPROVED` + entitlement `ACTIVE`, lu des read-models) ; `orgId` du jeton, `dossierId` de l'URL vérifié contre la portée serveur, hors portée = `404` jamais `403` ; six droits distincts dont « changer le mode » plus restreint qu'« arbitrer » et « délivrer un mandat » ; démarrage dégradé (`llm: down`), moteurs indépendants, interrupteur général par organisation lu à l'exécution, fail-closed.
22. **File d'arbitrage bornée** (AD-23) : décision groupée plafonnée dans le domaine (défaut 25, dur 100, motif au-delà du défaut), journal des exécutions, statistiques par règle. CM-1 (acceptation > 90 % sur 30 j = validation de façade), CM-2, CM-3.
23. **Métriques** : SM-1 (propositions appliquées sans validation hors AUTO autorisé = 0), SM-2 (affirmation légale sans citation = 0), SM-4 (AUTO annulés ou contestés < 1 %), SM-5, SM-6, SM-7.

### 1.4 Ce qui est DÉPASSÉ ou amendé

- La note d'architecture du 2026-07-20 (principe cardinal « rien n'est appliqué sans validation humaine », cycle §5, découpage §10) est dépassée ; ne survivent que le placement, `LlmProvider`, le RAG et son corpus, l'OCR inchangé.
- `STORY-115 à STORY-119` (recopie de la note) sont à superséder ; `STORY-170` à rattacher. Le goal du sprint 35 dit encore « l'IA propose, l'humain valide ».
- `EPIC-026` abandonné pour ce module (collision avec « Projets ») ; plage EPIC-095 à 105.
- Port : `:3011` remplacé par `:3417`. Les épics ne sont pas réécrits (lire `:3417`).
- Amendements du PRD : FR-IA04 (un topic sortant autorisé), FR-IA47 (organisation et dossier), FR-IA36b (assiette cumulée). Les épics indiquent que FR-IA04 et FR-IA47 restent « à reporter dans le PRD » ; le PRD lu les porte déjà en place avec la marque d'amendement.
- Incohérence mineure : PRD parle de cinq droits (FR-IA45), les épics et le tracker de six (ajout de « délivrer un mandat »).
- La doctrine « l'IA PROPOSE, l'humain valide » n'est plus la règle : remplacée par le critère de réversibilité.

### 1.5 Ce qui est codé ou pas

- **Aucun code d'assistant-service dans le dépôt** (aucun répertoire `*assistant*` à la racine de MoneyVibes_Apps). Tout ce qui précède est spécifié (PRD final, spine finale, épics découpés), rien n'est implémenté d'après ce que j'ai pu vérifier.
- Livré en amont : corpus CGI/LPF (1 185 articles), table de passage compte→poste et flux de surcharge de bilan-service (FR-008), catalogue de permissions plateforme, patrons d'identité/isolation/démarrage dégradé.
- Non livré et bloquant : `STORY-365` (extension `perms[]` RBAC tenant, S21, 8 pts, amont dur d'EPIC-104), `STORY-371` (publier `types-action` + module `assistant`, S21, 5 pts, bloque EPIC-095 et EPIC-101), story `bilan-service` d'impact recalculé (portée par EPIC-100), moteur fiscal (EPIC-023, 🟡), `notification-service` (aux dires du PRD « à construire » ; la mémoire du projet indique depuis qu'il est livré), contrat de fournisseur de candidats (quatre spines l'exposent sans qu'il existe), C8.
- Serveur d'inférence de production (**Q2**) : ouvert depuis le 2026-07-20, machine et modèle non spécifiés. Borne la qualité, pas la livraison.
- Responsable de publication du catalogue des types d'action : à nommer (Q7).
- Séquencement : aucun sprint attribué (« décision PO »).

---

## 2. La vision (note du 10 au 11/11/2026, statut brouillon, note locale)

Thèse : microfinance, distributeur, expert-comptable et assurance partagent la moitié de leurs modules ; une seule plateforme voit la même PME sous plusieurs angles (acheteuse, emprunteuse, bilan, assurée) ; l'IA commune apprend de ces angles, avantage qu'un acteur à produit unique ne peut copier.

### 2.1 Famille de modules IA (stratégie v2), du même rang que Assurance, Microfinance, Distributeur, installables par contrat de module

| Module | En une ligne | Décision PO |
|---|---|---|
| Risque (moteur de décision) | Note la PME et le ménage en temps réel par API pour IMF, banques, assureurs ; décision en secondes, plafonds, explication | **Oui** |
| Finance de la chaîne | Crédit de stock, affacturage, financement fournisseur dans l'écran de commande du distributeur ; l'IMF finance, PI-SPI rembourse | **À prendre vite** |
| Assurance embarquée et paramétrique | Souscription à l'achat ou au crédit, paiement sur indice, sinistres traités par l'IA (GED, OCR, fraude) | **Oui** (réexpliquée en séance) |
| Agents IA métier | Souscripteur, analyste crédit, recouvreur, comptable-fiscaliste, commercial WhatsApp et voix ; chacun agit sous mandat et plafond | **Adorés** |
| Identité et passeport financier | KYC/KYB vérifié une fois, données partagées par la PME elle-même sous consentement (modèle India Stack) | **C'était un but** |
| Pulse | Indicateurs agrégés et prévision d'activité pour banques centrales, ministères, bailleurs | **Oui** |
| Modèle de fondation sectoriel | Petit modèle entraîné par apprentissage fédéré (OHADA, SYSCOHADA, CIMA, BCEAO, factures, sinistres, langues locales), déployable sur site | Non tranché explicitement dans la note (pas de retour PO écrit) |
| Transfrontalier | Financement du commerce des PME entre pays avec le module Transit (PI-SPI, PAPSS) | Non tranché explicitement ; horizon 2029 |
| Relation client (famille commune, séance 13) | Un moteur partagé qui réunit ciblage, communication, service client, relance (un seul moteur pour l'échéance IMF, la facture distributeur, la prime, la cotisation de tontine ; promesses de paiement ; lien PI-SPI) | **Validée**, placée juste après Finance de la chaîne |
| Tontine | Épargne collective ; Money Vibes ne garde jamais l'argent | Ajouté à la demande du PO |
| Point de quartier | Boutique devenue point de service | **REFUSÉ par le PO** (11/11) : le vrai problème est trouver la cible, puis service client et relance |

### 2.2 Produits de prédiction et d'innovation

| Produit | En une ligne | Décision PO |
|---|---|---|
| Météo des prix et de la demande | Prix et demande à 1 à 3 mois par produit, marché, pays ; WhatsApp/voix pour commerçants, tableau de bord pour distributeurs, API pour banques, assureurs, États | **Retenu** |
| Investir au pays | Étude prédictive d'un projet et son suivi | **Non retenu** |
| Note de confiance (OHADA puis ZLECAf) | Probabilité qu'une entreprise paie, livre, soit honnête ; badge | **Non retenu** |
| Distribution en pilote automatique (voir, prévoir, agir, financer et assurer, robotiser en dernier) | La Météo est le cerveau ; commande suggérée au point de vente, stock expédié avant la commande, financée en une seconde, assurée en un clic | **Le PO aime** (produit phare) |
| Argent programmable sur PI-SPI | Prélèvement intelligent, séquestre, crédit sur le rail | **Validé** (à vérifier : PI-SPI propose-t-elle des mandats récurrents ?) |
| Facture certifiée qui vaut crédit | Conformité automatique, impôt en temps réel, crédit sur factures certifiées, Pulse nourri par les factures | **Validé** |

Autres idées croisées (non décidées par le PO dans la note) : note de finançabilité des PME, vente à crédit B2B, affacturage, warrantage, crédit-bail, assurance emprunteur, assurer les produits des distributeurs, commerciaux comme réseau d'assurance, impôts (simuler, optimiser légalement, détecter un avis gonflé), passeport de santé financière, observatoire multi-pays, assistant WhatsApp et voix en langues locales, puis secteurs (eau, transit, agriculture, solaire, mobilité, santé, éducation, diaspora, BTP, collectivités).

### 2.3 Premier jour contre horizon

**Ce qui relève du premier jour** (au sens de la note, « février 2027 : le socle et les premières verticales ») :
- Le socle déjà spécifié (assistant-service) : Propositions, mandat, règles, RAG légal, mapping de comptes.
- Les garde-fous et le registre de consentements « déjà écrits dans le PRD moteur ».
- Pas de modèle commun entraîné au premier jour : « le premier modèle commun au mieux au 2ᵉ semestre 2027 ».
- Le premier croisement concret annoncé : assurance emprunteur sur un crédit IMF.
- Pour ce que l'IA doit donner dès le premier jour : la note ne le décrit pas ; aucun passage ne dit comment un client « donne des informations dès l'installation » avant d'avoir des données (le démarrage à froid, Q1 du PRD assistant, reste ouvert).

**Horizon** (calendrier de la note) : 2027 S1 socle et deux clients ; 2027 S2 Risque v1 + Finance de la chaîne (IMF sur les données d'un distributeur) ; 2028 Assurance embarquée, Agents, extension UEMOA ; 2029 zone CIMA/CEMAC, Pulse, transfrontalier PAPSS ; banque en dernier. Puis l'international (cercles OHADA/CIMA/UEMOA, PAPSS, pays du Sud, diaspora), kit de développement public de modules, place de marché.

### 2.4 Revenus évoqués

Licence par module, frais par décision de risque, part du volume financé ou assuré, produits de données pour le secteur public. Fossé défensif déclaré : l'IA commune et les services de données, pas le code.

---

## 3. Garde-fous et principes déjà écrits

**Vision (validés par le PO le 10/11 et le 11/11)**
1. Money Vibes note et relie, **elle ne prête ni n'assure** : l'IMF prête, l'assureur assure.
2. Pas de crédit sans contrôle du surendettement (BIC prévu au module Crédit). Pas d'assurance imposée par le prêteur (le client choisit son assureur). Aucun indicateur public qui permette de reconnaître une entreprise.
3. « On met en commun l'apprentissage, pas les données » : les modèles voyagent, les fiches clients restent chez leur propriétaire.
4. Une finalité consentie pour chaque croisement entre verticales ; registre des consentements par finalité.
5. La valeur est là où les domaines se touchent (risque de crédit, documents, comptabilité SYSCOHADA, fraude), pas partout.
6. Agents et relance **sous mandat**, un humain reste joignable, on mesure la satisfaction et pas seulement le coût.
7. Agrégation : jamais les ventes d'un concurrent, rien qui facilite une entente sur les prix, seuil minimal d'entreprises par case, jamais de donnée individuelle.
8. Tontine : Money Vibes ne garde jamais l'argent. Argent programmable : participant agréé, consentement révocable, plancher de vie jamais prélevé, contrôle du surendettement. Facture certifiée : secret fiscal, consentement pour le crédit, agrément éventuel de l'administration fiscale. Impôts : optimisation légale, jamais de dissimulation.
9. Souveraineté : déploiement souverain sur site, résidence des données par pays (apprentissage fédéré), seulement les entreprises consentantes pour toute notation.

**Doctrine assistant (déjà au PRD et à la spine)**
10. Réversible et sans engagement : l'IA peut agir seule ; engagement ou chiffre officiel : l'IA propose, un humain tranche, le moteur déterministe recalcule (sauf mandat préalable).
11. NFR-1 : l'IA ne calcule aucun chiffre officiel ; le déterministe fait foi, et l'écart est restitué.
12. Pas d'affirmation à portée légale sans citation vérifiable ; sans source, inapplicable.
13. Données non quittant l'infrastructure : auto-hébergé par défaut, API externe jamais un défaut.
14. L'autonomie n'est jamais silencieuse : journal, notification, annulation, quota, interrupteur général.
15. La confiance du modèle n'ouvre aucune autonomie ; un score est toujours explicable.
16. Aucune copie de donnée métier ; le défaut de tout inconnu est le régime le plus strict.
17. Aucune décision anonyme (décideur typé) ; aucune invocation anonyme ; hors portée = `404`.
18. Données de configuration jamais un programme (pas d'expression évaluée).
19. Une validation de façade est pire qu'une absence de validation (CM-1).

---

## 4. Questions ouvertes pour une IA COMMUNE

### 4.1 Un seul service ou plusieurs

1. **Frontière entre assistant-service et l'IA commune.** assistant-service a été cadré comme socle de jugement (Proposition, règles, mandat, RAG) avec scoring, prévision et Copilot expressément « modules dédiés plus tard ». L'IA commune est-elle assistant-service élargi, ou un ensemble (assistant-service + Risque + Pulse + Relation client + Agents) qui partage un contrat ? La note de vision parle de « famille de modules », pas d'un service.
2. **Le contrat Proposition suffit-il aux autres modules IA ?** Une note de risque, une prévision ou une décision de crédit sont-elles des Propositions (origine ni `LANGAGE` ni `REGLE`) ? Faut-il une troisième origine (`MODELE_STATISTIQUE`), et le décideur typé `HUMAIN | REGLE | MANDAT` tient-il pour un agent qui agit sous mandat ?
3. **Fusion des moteurs de relance et de relation client.** La note veut « un seul moteur » pour échéance IMF, facture, prime, cotisation ; le PRD assistant a déjà un moteur de règles et laisse `notification-service` envoyer. Qui est le moteur de relance : le moteur de règles d'assistant-service ? Où vivent les promesses de paiement, le moment appris par zone, `support-crm-service` ?
4. **Les agents métier sont-ils des surfaces** (gabarit + configuration, AD-22) ou des services ? L'agent « commercial WhatsApp et voix », « recouvreur », « souscripteur » mandatés relèvent de la doctrine du mandat, mais le PRD assistant n'a prévu ni conversation, ni voix (`TranscriptionProvider` différé), ni Copilot.
5. **Exécution des actions des nouveaux modules** : le catalogue `types-action` et l'outbox `assistant.action.demandee` couvrent-ils les actions de crédit, d'assurance, de souscription (engageantes par nature) ? Quels modules deviennent « service exécutant » et publient leurs entrées ?
6. **Un seul `LlmProvider` pour tous**, ou un modèle sectoriel distinct du modèle de langage ? Le modèle de fondation sectoriel, le moteur de scoring et le LLM sont trois natures de modèle ; la spine ne prévoit qu'un port de langage et un calculateur de score interchangeable.

### 4.2 Où tourne l'apprentissage

7. **Local chez le client contre SaaS** : la spine suppose un service unique chez Money Vibes, modèle auto-hébergé sur « l'infrastructure Money Vibes ». La note dit « déployable sur site » et la mémoire du projet dit que l'IMF tourne sur ses serveurs. Le modèle tourne où ? Quelle version déployer en local, comment la mettre à jour (le point « se met à jour » du brief), comment fonctionner coupé du réseau ?
8. **Apprentissage fédéré** : cité comme règle (« les modèles voyagent, les fiches restent ») et comme technique du modèle de fondation, jamais spécifié. Qui entraîne, où agrège-t-on, avec quels poids, quel consentement, quelle garantie contre la fuite par les poids ? Le PRD assistant n'a aucun apprentissage : le contexte est minimisé, les logs d'audit purgés à échéance courte.
9. **Source du signal d'apprentissage.** Le PRD cite l'historique des refus (Propositions immuables) comme « matière première de l'amélioration », sans définir de boucle. Quels événements nourrissent quoi (acceptations, refus, écarts annoncé/recalculé, annulations d'`AUTO`, remboursements effectifs) ? Que devient la purge du contexte brut face à un besoin d'apprentissage ?
10. **Démarrage à froid (Q1 du PRD assistant, reportée)** : un premier client arrive avec zéro mois de données. Que donne l'IA dès le premier jour sans historique ? Candidats : règles expertes explicables (A2), référentiels (corpus, SYSCOHADA, CIMA), modèle préentraîné sectoriel, référentiels de prix. La note ne dit pas lesquels sont « jour 1 ».
11. **Gouvernance des versions de modèle** : comment un modèle mis à jour est évalué, déployé par pays ou par client, rétrogradé ? La spine fige `modele` et `versionGabarit` par Proposition mais ne prévoit ni évaluation, ni déploiement progressif. Comment éviter qu'une mise à jour change silencieusement le comportement d'un mandat en cours ?
12. **Qualité mesurable** : Q2 (serveur d'inférence) est ouverte depuis le 20/07 ; un petit modèle de développement hallucine. Un modèle commun n'a de sens que si la qualité se mesure : quel jeu d'évaluation, quel responsable ?

### 4.3 Qui possède quoi

13. **Propriété des données et des modèles issus de plusieurs clients.** « On met en commun l'apprentissage, pas les données » ne dit pas à qui appartient un modèle entraîné sur les données de plusieurs institutions, ni les droits d'un client sortant, ni les clauses contractuelles. Le cloisonnement du PRD est par organisation et par dossier ; un modèle commun traverse ce cloisonnement par construction.
14. **Registre des consentements** : « déjà écrit dans le PRD moteur » mais l'IA commune doit l'interroger à chaque croisement entre verticales. Qui le détient (service d'identité, KYC, passeport) et comment l'IA l'applique à l'entraînement et à l'inférence ?
15. **Propriété du catalogue `types-action`** : la spine renvoie à `platform-catalog-service` avec « responsable de publication à nommer » (Q7 ouverte). Avec l'IA commune, qui valide qu'une action de crédit ou d'assurance est engageante ?
16. **Money Vibes ne prête ni n'assure, mais décide-t-elle ?** Le module Risque rend « décision en secondes, plafonds et explication » ; la doctrine dit que l'IA ne décide jamais un prêt sans humain ni mandat. Qui détient la décision (IMF, banque, assureur), et la note de risque est-elle une Proposition acceptée par l'institution ? Le mandat est-il délivré par l'institution cliente (autorité de délivreur : droit `perms[]`) ?
17. **Modèle économique et facturation** : « frais par décision de risque », « part du volume financé » face à une facturation de l'inférence différée ; le quota d'inférence par organisation est déjà prévu, pas la facturation.
18. **Équipe et capacité** : le PRD assistant pèse 142 pts pour une capacité de 34 par sprint, sans sprint attribué ; l'IA commune ajoute Risque, Pulse, Relation client, Agents. Qui construit, avec quelle charge, et que cède-t-on ? (La mémoire du projet signale déjà un plan à deux développeurs et une charge dépassée sur le moteur d'installation.)
19. **Compatibilité avec le contrat de module et le moteur d'installation** : l'IA commune doit-elle être elle-même un module installable (code de module, manifeste, entitlement) ou une infrastructure transverse ? Comment un module commercial (Risque) s'active-t-il pour une institution ?
20. **Dossier** : la Proposition porte `dossierId` pour un espace comptable ; les autres verticales (IMF, distributeur, assurance) n'ont pas forcément ce concept. Quelle clé d'unité de travail pour les Propositions hors comptabilité (client, point de vente, police) ?
21. **Langues locales et voix** : voix et langues locales sont dans la vision et absentes du PRD assistant. Qui possède la transcription (`TranscriptionProvider`, `document-service`) et le modèle de langues locales ?
22. **Transition des artefacts existants** : STORY-115 à 119 à superséder, goal du sprint 35 à corriger, deux amendements (FR-IA04, FR-IA47) à reporter dans le PRD selon les épics, incohérence cinq/six droits.
