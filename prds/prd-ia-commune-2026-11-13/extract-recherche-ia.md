# Extrait de recherche — « une seule IA » commune (PRD IA commune)

Date : 2026-11-13. Méthode : WebSearch + WebFetch.
Légende : **SÛR** = lu dans la page citée (page ouverte ou extrait explicite du résultat) ; **PROBABLE** = déduit de sources secondaires (blogs, synthèses, forums) ou d'un extrait de moteur non confirmé à la source. Les versions viennent de PyPI / docs à la date du jour.

---

## 1. Ce que font les grands éditeurs

### Salesforce (Einstein, Agentforce, Trust Layer)
- SÛR : l'IA générative (dont Agentforce) « ne requiert aucun entraînement ni réglage fin » ; elle repose sur des modèles pré-entraînés + invite + données d'ancrage du client. Les fonctions prédictives peuvent entraîner des modèles sur les données client ; **seules quelques fonctions prédictives utilisent des modèles globaux**, entraînés sur données agrégées et dépersonnalisées, **sauf désinscription du client** ; des **modèles propres à l'organisation**, entraînés uniquement sur ses données, restent disponibles. Désinscription au niveau de l'organisation ; ne s'applique pas au « bring your own model ». « Salesforce ne partagera jamais les données client » avec tiers, partenaires ou autres clients. https://www.salesforce.com/blog/debunking-myths-salesforce-einstein-and-agentforce/
- SÛR (extraits de résultats, page Trust non ouverte : 403) : le Trust Layer traite invites et sorties dans la frontière du client avant/après le LLM ; masquage de données (par motif et par champ) ; « zero data retention » par contrat avec les fournisseurs de LLM. https://developer.salesforce.com/docs/ai/agentforce/guide/trust.html ; https://help.tableau.com/current/tableau/en-gb/tableau_gai_einstein_trust_layer.htm
- PROBABLE : le masquage dégrade parfois la précision des agents ; une source secondaire parle de 30 jours de conservation pour conformité, en tension avec « zéro rétention » : à vérifier. https://www.eesel.ai/blog/salesforce-einstein-trust-layer
- PROBABLE : la fiche « Einstein Platform security, privacy and architecture » documente la portée des modèles (texte détaillé non lu). https://www.salesforce.com/en-us/wp-content/uploads/sites/4/documents/legal/misc/einstein-platform-security-privacy-and-architecture.pdf ; https://www.salesforce.com/en-us/wp-content/uploads/sites/4/documents/legal/misc/order-form-supplement-for-einstein-features-SFDC.pdf

### Odoo
- SÛR : la doc officielle 19.0 décrit des **agents IA** (app « AI ») : *sources* indexées (PDF, liens, Documents, Knowledge) façon RAG, *topics* (instructions + outils), *outils* qui dépendent des apps installées ; un agent sans topic ne peut qu'informer, pas écrire en base ; le LLM est choisi par agent (versions de ChatGPT et Gemini). La page ne dit pas quelles données partent chez le fournisseur ni le modèle de droits. https://www.odoo.com/documentation/19.0/applications/productivity/ai/agents.html
- PROBABLE : en 18, l'écosystème est surtout communautaire (modules `llm`, fournisseurs OpenAI/Ollama/Mistral, outils par décorateur, serveur MCP) ; pas d'architecture IA native officielle trouvée pour la 18. https://github.com/joelkm/odoo-llm ; https://apps.odoo.com/apps/modules/18.0/llm ; https://apps.odoo.com/apps/modules/18.0/odoo_mcp_ai
- Lecture pour nous : un moteur d'agents unique, **les modules lui apportent outils et sujets** — même idée que « service = module installable ».

### SAP (Business AI, Joule)
- PROBABLE (pages SAP + synthèses) : Joule = panneau + cœur sur BTP (classification d'intention, routage vers des « skills ») qui appellent les API des systèmes SAP ; passerelle de LLM « Generative AI Hub » sur SAP AI Core ; contrats interdisant aux fournisseurs de LLM d'entraîner sur les données client ; isolation au niveau du tenant, aucune donnée client stockée dans Joule ; la page Joule évoque aussi des données anonymisées pour amélioration continue (donc « jamais entraîné » est plus étroit qu'il n'y paraît). https://architecture.learning.sap.com/docs/ref-arch/464deb ; https://www.sap.com/sea/products/artificial-intelligence/ai-assistant.html ; https://learning.sap.com/courses/guiding-ai-driven-transformation-as-an-sap-enterprise-architect/evaluating-an-end-user-workflow-example ; https://sap-playbook.pages.dev/joule/ (non officiel)

### Microsoft (Copilot, Dynamics 365)
- SÛR (extraits de la FAQ Microsoft Learn) : invites et sorties de Copilot Dynamics 365 / Power Platform **ne servent pas à entraîner** les modèles Microsoft sauf opt-in explicite de l'administrateur du tenant ; données isolées logiquement par tenant, chiffrées ; Copilot ne voit que ce que l'utilisateur peut déjà voir (Entra + RBAC) ; flux via le réseau Microsoft vers Azure OpenAI. https://learn.microsoft.com/power-platform/faqs-copilot-data-security-privacy ; https://learn.microsoft.com/dynamics365/faqs-copilot-data-security-privacy ; https://learn.microsoft.com/copilot/microsoft-365/enterprise-data-protection

### Intuit (GenOS, Intuit Assist)
- SÛR (communiqués) : GenOS = 4 blocs (GenStudio, GenRuntime — choisit le modèle et les accès données par requête —, GenUX, modèles tiers + modèles financiers maison) ; modèles de base réévalués « toutes les quelques semaines », réglage fin + RLHF ; ancrage par données client. https://www.businesswire.com/news/home/20230606005523/en/Intuit-Introduces-Generative-AI-Operating-System-with-Custom-Trained-Financial-Large-Language-Models ; https://medium.com/intuit-engineering/building-a-flexible-platform-for-optimal-use-of-llms-33a389cedf49 ; https://medium.com/intuit-engineering/how-to-accelerate-development-velocity-in-the-genai-era-build-a-genos-e71ac2e17b82
- PROBABLE : seules les données consenties servent à l'amélioration ; mélange Claude / GPT selon la tâche. https://www.zenml.io/llmops-database/large-scale-tax-ai-assistant-implementation-for-turbotax

### Workday
- SÛR (compte rendu diginomica, 2023) : **opt-in** du client (jusqu'au niveau du champ, exclusion de pays), données anonymisées échangées contre des enseignements, retrait possible (Workday supprime), sous-traitants interdits par contrat de réentraîner leurs LLM ; tous les clients sur la même version et le même modèle de données ; modèles de domaine construits sur des modèles de base. Les « adaptateurs par tenant » et l'apprentissage fédéré ne sont **pas** mentionnés dans cet article. https://diginomica.com/workday-rising-23-workday-reveals-its-approach-generative-ai-and-customer-data-privacy
- PROBABLE : le blog Workday revendique un « modèle de données par tenant » permettant des modèles régionaux/sectoriels par apprentissage fédéré ; aucun audit indépendant ; « aucune décision n'est entièrement automatisée » (humain décideur final). https://blog.workday.com/en-us/2023/how-ai-and-ml-are-powering-future-work.html ; https://diginomica.com/responsible-ai-isnt-just-about-ethics-its-about-accuracy-deeper-look-workdays-evolving-ai

### Ce que le PRD devrait retenir (sujet 1)
- Un **moteur d'IA unique** + des **capacités déclarées par chaque module** (outils, sujets, droits) : schéma d'Odoo (agents/topics/outils), SAP (skills sur API publiées), Salesforce (agents + actions).
- **Trois couches d'apprentissage** comme Salesforce : (a) LLM pré-entraîné sans apprentissage sur données client ; (b) modèles prédictifs **par client** par défaut ; (c) modèles **globaux seulement sur opt-in explicite, données agrégées/dépersonnalisées, retrait possible**.
- **Opt-in/opt-out granulaire et réversible** (organisation, application, champ, pays) : norme chez Salesforce et Workday ; Microsoft = opt-in du tenant.
- **Une passerelle LLM unique** (masquage, journal d'audit, zéro rétention contractuelle, choix du modèle par tâche) devant tout appel externe — Salesforce Trust Layer, SAP Generative AI Hub, Intuit GenRuntime.
- **Droits hérités de l'utilisateur** : l'IA ne voit que ce que l'utilisateur voit (Microsoft, Odoo) ; jamais de super-droit.
- Ne pas promettre « jamais utilisé pour entraîner » sans qualification : SAP, Workday et Salesforce ont tous des exceptions agrégées ou opt-in.

---

## 2. Apprentissage sans partage de données

### Outils (versions lues le 2026-11-13)
- SÛR : Flower `flwr` **1.43.0** (4 nov. 2026). https://pypi.org/project/flwr/
- SÛR : Flower propose la confidentialité différentielle **centrale** (écrêtage fixe/adaptatif côté serveur ou client, puis bruit sur l'agrégat) et **locale** (`LocalDpMod`) ; la doc la dit **« en phase préliminaire »** et conseille de contacter l'équipe avant usage en production sur données sensibles ; l'agrégation sécurisée (SecAgg/SecAgg+) existe mais n'est pas détaillée sur cette page. https://flower.ai/docs/framework/how-to-use-differential-privacy.html ; https://flower.ai/docs/framework/main/fr/ref-changelog.html
- SÛR : NVIDIA FLARE **2.9.0** (lanceurs Docker/Kubernetes/Slurm, mTLS interne par défaut, FedAvg validé jusqu'à 72 Md de paramètres). https://nvflare.readthedocs.io/en/main/whats_new.html ; https://pypi.org/project/nvflare/
- SÛR (doc FLARE 2.3/2.4) : **les clients n'ont jamais à accepter de connexion entrante** ; le serveur ouvre deux ports non privilégiés (clients, console) ; gRPC ; port 443 déconseillé. Versions récentes : CellNet à distribution de tâches par « pull » ; mode BYOConn pour sites restrictifs. https://nvflare.readthedocs.io/en/2.3/user_guide/nvflare_security.html ; https://nvflare.readthedocs.io/en/2.4/user_guide/security/communication_security.html ; https://nvflare.readthedocs.io/en/2.7.0/flare_security_overview.html
- SÛR : TensorFlow Federated : dernière version **0.87.0 du 17 sept. 2024** (aucune publication depuis ; PROBABLE : projet peu actif). https://pypi.org/project/tensorflow-federated/
- SÛR : NIST SP 800-226 (mars 2025), cadre d'évaluation des garanties de confidentialité différentielle ; PROBABLE (source secondaire) : choix d'epsilon = décision de risque contextuelle ; pièges : mauvaise sensibilité, composition non suivie. https://csrc.nist.gov/news/2025/guidelines-for-evaluating-differential-privacy-gua ; https://dev.to/richardfan1126/what-you-need-to-know-about-the-nist-guideline-on-differential-privacy-2mb6

### Retours d'expérience
- SÛR : le cadre « cross-silo » = peu de clients fiables (2 à 50, jusqu'à 100), gros jeux de données, typique finance/santé/industrie ; usage réel rare, bonnes pratiques manquantes. https://arxiv.org/pdf/2206.12949 ; https://arxiv.org/pdf/2405.03636
- SÛR : assurance : la régulation rend difficile l'accès à l'historique de sinistres ; le cross-silo FL est présenté comme voie (WeBank–Swiss Re cité). https://arxiv.org/pdf/2206.12949
- PROBABLE : fraude interbancaire et fraude aux sinistres = cas d'usage les plus cités (sources éditeurs) ; la gouvernance (attestation, approbation, contrôle de la distribution des modèles) compte autant que le modèle. https://developer.nvidia.com/blog/using-federated-learning-to-bridge-data-silos-in-financial-services ; https://introl.com/blog/federated-learning-infrastructure-privacy-preserving-enterprise-ai-guide-2025
- Non trouvé : retours chiffrés d'un déploiement réel en finance/assurance avec très peu de clients. C'est un trou de la littérature publique, pas une preuve que ça marche.
- INFÉRENCE (non lue) : avec 3 à 10 participants, la DP centrale coûte cher en utilité.

### Ce que le PRD devrait retenir (sujet 2)
- Avec **peu de clients** (≈ 5 à 50 institutions), la garantie DP formelle coûte en utilité : le **fédéré est une option de phase ultérieure**, pas une condition du démarrage.
- Première brique réaliste : **statistiques agrégées et dépersonnalisées avec seuil minimal de clients** (k entre organisations) + **opt-in contractuel** ; le fédéré vient ensuite.
- Pour la liaison **sortante seulement**, le modèle FLARE (client qui initie, serveur qui accepte) et le « pull » conviennent ; l'architecture doit imposer ce sens.
- Frameworks : Flower (DP « preview ») ou FLARE (plus complet côté exploitation) ; écarter TFF (inactif depuis 2024). Les versions se figent dans l'architecture, pas dans le PRD.
- Ne pas employer le mot « différentielle » sans **budget de confidentialité tracé** (NIST SP 800-226).
- Tout modèle qui redescend chez un client passe par une **gouvernance** (signature, approbation, versionnage).

---

## 3. Démarrage à froid

- SÛR (doc du projet) : schéma « enseignant–élève » : des règles d'expert étiquettent les données, un modèle « élève » généralise ensuite. https://h1st.readthedocs.io/en/latest/concepts/k1st.html
- SÛR (extrait de résultat) : Featurespace : sans historique, les règles sont souvent moins performantes que des modèles et ne donnent qu'une sortie discrète (pas de score continu) ; démarrer le modèle par transfert depuis plusieurs jeux de données externes, variables cohérentes. https://www.featurespace.com/?p=6066
- PROBABLE : garder une couche transparente pendant la transition pour que les utilisateurs contestent les hypothèses (étude de cas prévision de la demande). https://www.globalsources.com/sourcing-digest/konstantin-burkin-demonstrates-transfer-learning-improves-new-product-demand-forecasting/?source=GSOLHP_SKC_1
- PROBABLE : transfert entre locataires pour événements rares (fraude), sélection de variables par explicateur : brevet US (demande 17/678,443), pas un guide technique. https://insights.ipauthor.com/17678443.html
- Non trouvé : seuil publié « règle → modèle » (nombre d'exemples). À définir par nous, par capacité (critère : le challenger bat les règles hors ligne puis en ligne, voir sujet 4).

### Ce que le PRD devrait retenir (sujet 3)
- Chaque capacité commence par un **niveau 0 = règles expertes explicables** (référentiels métier : OHADA/SYSCOHADA, CIMA, usure, seuils de ratios), livrées avec le module, valables dès le jour 1.
- Niveau 1 = **modèle pré-entraîné sur données publiques ou synthétiques** (jamais sur données d'un client) ; niveau 2 = **modèle par client** ; niveau 3 = **a priori partagé** (agrégats opt-in) pour initialiser les modèles par client.
- **Passage de niveau gouverné par un seuil par capacité** (volume minimum, durée, et le modèle doit battre les règles sur un jeu de validation du client) ; sinon on reste sur les règles, qui restent aussi **repli** et **garde-fou**.
- Toute sortie affiche son **niveau de confiance et sa source** (« règle », « modèle global », « modèle de votre structure ») ; sous le seuil, l'IA dit « je ne sais pas » ou propose seulement.
- Les règles servent d'**étiqueteur initial** (enseignant–élève) pour amorcer l'apprentissage.

---

## 4. Cycle de vie en production (MLOps)

- SÛR : **MLflow 3.18.0** (3 nov. 2026) ; 3.17.x en octobre, 3.16 en septembre (mise à jour mineure toutes les 2 à 4 semaines). https://pypi.org/project/mlflow/
- SÛR : les **stages** du registre sont dépréciés depuis MLflow 2.9 au profit des **alias** (`champion`, `challenger`) ; chargement par `models:/nom@champion`. https://mlflow.org/docs/latest/ml/model-registry/ ; https://github.com/mlflow/mlflow/issues/10336
- PROBABLE : promotion et retour arrière = déplacer l'alias ; garder la version précédente comme repli. https://adhdecode.com/articles/mlflow/mlflow-model-aliases-champion-challenger/ ; https://theneuralbase.com/mlflow-advanced/learn/beginner/aliases-champion-challenger/
- PROBABLE (sources secondaires concordantes) : déploiement en **ombre** (copie du trafic, sorties comparées sans effet utilisateur), puis **canari** 1–5 %, puis paliers ; **portes** définies avant l'essai (qualité, latence, dérive, sous-groupes, coût), ex. métrique métier à ±2 % du champion ; répéter le retour arrière pendant le canari ; coût de l'ombre = double inférence. https://atlan.com/know/shadow-deployment-for-ml-models/ ; https://metricgate.com/blogs/shadow-deployment-vs-canary/ ; https://www.datarobot.com/blog/introducing-mlops-champion-challenger-models/
- PROBABLE : dérive : Evidently (rapports/tableaux de bord, libre, très répandu) ; Alibi Detect (données non tabulaires, anomalies, lié à Seldon) ; suivre la performance **par segment** ; réentraîner seulement si la dérive touche la performance ; fausses alertes pendant les canaris. https://fuzzylabs.ai/blog-post/evidently-vs-alibi-detect-comparing-model-monitoring-tools ; https://evidentlyai.com/tags/data-drift

### Ce que le PRD devrait retenir (sujet 4)
- **Une fiche « capacité »** par fonction d'IA : objectif mesuré (métrique, cible, seuil minimal, fenêtre), version en service, niveau (règle/global/par client), état.
- **Registre unique de modèles avec alias** ; promotion = déplacement d'alias ; **retour arrière en une action** sans redéploiement, par client, en local comme en SaaS.
- **Séquence imposée** : hors ligne → ombre → canari → général, **portes écrites avant** l'essai ; sans porte franchie, pas de promotion.
- **Rapport de performance périodique par capacité** (objectif vs réalisé, dérive, sous-groupes, coûts) visible du client et de l'éditeur ; « mise à jour vers des objectifs mesurés » = le modèle n'est remplacé que s'il atteint ou dépasse l'objectif.
- Dérive calculée **localement** ; seules des statistiques remontent, jamais les données brutes.
- Mises à jour des serveurs locaux par **liaison sortante** (le client va chercher des artefacts signés), avec **gel** possible par le client.

---

## 5. LLM en local vs en ligne

- PROBABLE (guides 2026, SEO/éditeurs, chiffres variables) : **un GPU de 24 Go** exécute confortablement des modèles de 27–35 Md de paramètres en INT4 ; 8 Go suffisent pour des modèles 7–8 Md en Q4_K_M ; règle empirique ≈ 0,57 Go par milliard de paramètres en Q4 (FP16 ≈ 3,5× plus) ; le contexte long consomme le reste de la VRAM ; les gros modèles ouverts (centaines de Md) exigent des grappes de GPU ; licences variables (certains Apache 2.0), à vérifier modèle par modèle. https://vrlatech.com/llm-vram-requirements-2026/ ; https://onyx.app/insights/best-self-hosted-llms-2026 ; https://frankx.ai/blog/best-open-local-llms-2026 ; https://www.layer3labs.io/guides/best-local-llms
- PROBABLE : coût : étude arXiv (54 scénarios) : les petits modèles ouverts atteignent le seuil de rentabilité en 0,3 à 3 mois face aux API commerciales, les 70–120 Md en 3,8 à 34 mois ; face à une API ouverte bon marché (0,14–0,50 $/M tokens) l'auto-hébergement gagne rarement sur le coût. https://arxiv.org/html/2509.18101v3 ; https://findstack.com/resources/self-hosted-llm-vs-api-cost ; https://blog.premai.io/on-premise-llm-deployment-the-real-costs-trade-offs-decision-framework
- SÛR : les passerelles multi-fournisseurs avec masquage et zéro rétention sont la règle chez les éditeurs (voir sujet 1).
- **UEMOA / BCEAO** : la recherche n'a **pas** trouvé de texte officiel imposant la localisation des données ; seule une tribune critique l'affirme (opinion). Point juriste. https://www.osiris.sn/une-reglementation-hors-sol-quand-la-bceao-compromet-l-avenir-de-l-economie.html ; https://www.bceao.int/index.php/fr/reglementations/avis-ndeg-002-03-2026-aux-etablissements-de-credit-et-aux-compagnies-financieres (non lu)
- **Togo** — SÛR (texte du JO du 29/10/2019 lu) : art. 28 : transfert vers un pays tiers seulement si le pays assure un niveau de protection suffisant, **avec information préalable de l'IPDCP qui rend un avis motivé** ; art. 29 : dérogations pour transferts **ponctuels, non massifs** avec consentement exprès ou nécessité (vie, intérêt public, justice, contrat) ; art. 30 : l'IPDCP peut autoriser un transfert vers un pays sans protection adéquate si garanties suffisantes ; art. 31 : vérification avant traitement de données venant de l'étranger ; art. 20 : choix du sous-traitant, contrat écrit. https://www.afapdp.org/wp-content/uploads/2020/02/TOGO-JOS_29_10_2019-64E-ANNEE-N°26-TER.pdf
- **Côte d'Ivoire** (loi 2013-450 du 19 juin 2013, ARTCI) — PROBABLE : interdiction de transfert vers un pays tiers sans protection adéquate ; « pays tiers » = tout État non membre de la CEDEAO ; déclaration préalable ou autorisation obligatoire ; un décret sectoriel exige l'autorisation de l'Autorité pour sortir les données du territoire. Texte à lire : https://cms21.anac.ci/uploads/748534/LOI_2013-450.pdf ; https://cio-mag.com/cote-divoire-artci-le-traitement-des-donnees-personnelles-desormais-soumis-a-une-autorisation-prealable ; https://www.osiris.sn/Cote-d-Ivoire-Que-risquent-les.html
- **Sénégal** (loi 2008-12, CDP) — PROBABLE : toujours en vigueur ; réforme annoncée, adoption non confirmée ; une loi distincte sur les infrastructures critiques a été adoptée en août 2026. Conditions de transfert non lues. https://www.osiris.sn/donnees-personnelles-la-legislation-senegalaise-doit-etre-modernisee-et-adaptee.html ; https://fr.allafrica.com/stories/202603280054.html ; https://www.osiris.sn/Donnees-personnelles-au-Senegal.html
- Point ouvert : aucune lecture n'établit si l'envoi d'invites contenant des données personnelles vers un LLM hébergé hors UEMOA/CEDEAO est un « transfert » à notifier ; le texte togolais (art. 28) le suggère. **À trancher par le juriste.**

### Ce que le PRD devrait retenir (sujet 5)
- **Deux modes, une seule interface** : SaaS = passerelle vers un LLM hébergé ; local = **LLM ouvert** sur le serveur du client (classe 7–35 Md quantifiée, un GPU 24 Go) ou, à défaut, **sans LLM** (règles + modèles classiques). Le produit doit rester utile sans LLM.
- **Par défaut aucune donnée personnelle ne part vers un LLM tiers** ; envoi autorisé après masquage + base juridique + choix de la région d'hébergement ; **journal de chaque envoi**.
- **Pas de dépendance exclusive à un fournisseur** ; modèle choisi par tâche, licences vérifiées, version figée par client.
- Chiffrer trois scénarios (API, SaaS hébergé, GPU local) avant de promettre le « local » ; il se justifie par la souveraineté ou un fort volume, pas par le coût seul.
- Hypothèses ouvertes pour le juriste : localisation BCEAO, notification IPDCP (art. 28 Togo), régime ARTCI (CEDEAO ≠ « pays tiers »), régime CDP.

---

## 6. Garde-fous réglementaires

### Décisions automatisées — Togo (SÛR, texte lu)
- Loi 2019-014 du 29 octobre 2019, **art. 27** (intitulé « Du fondement d'une décision de justice ») : (1) aucune décision de justice impliquant une appréciation du comportement d'une personne ne peut avoir pour seul fondement un traitement automatisé destiné à évaluer certains aspects de sa personnalité ; (2) **aucune décision produisant des effets juridiques à l'égard d'une personne ne peut être prise sur le seul fondement d'un traitement automatisé destiné à définir le profil de l'intéressé ou à évaluer certains aspects de sa personnalité** ; (3) **ne sont pas prises sur le seul fondement d'un traitement automatisé** les décisions prises dans le cadre de la **conclusion ou de l'exécution d'un contrat** pour lesquelles la personne a été **mise à même de présenter ses observations**, ni celles satisfaisant ses demandes. https://www.afapdp.org/wp-content/uploads/2020/02/TOGO-JOS_29_10_2019-64E-ANNEE-N°26-TER.pdf
- Lecture : un score de crédit ou de sinistre qui **décide seul** est interdit ; une **décision humaine éclairée par le score**, ou une décision contractuelle où l'intéressé peut présenter ses observations, est possible. Le « droit de présenter ses observations » doit donc être **outillé** dans le produit. (Lecture du PRD, pas avis juridique.)
- Autorité : IPDCP. Secondaires (PROBABLE) : https://dataprotection.africa/?p=2922 ; https://osiris.sn/protection-des-donnees-personnelles-au-togo-l-ipdcp-entame-sa-mission.html
- Sénégal / Côte d'Ivoire : **article sur les décisions automatisées non trouvé** ; ne citer aucun article sans lecture du texte.
- Convention de Malabo (UA ; ratifiée par le Togo le 19/10/2021 selon un résultat) : droit de ne pas être soumis à une décision automatisée, numéro d'article non confirmé. PROBABLE. https://www.dataguidance.com/news/africa-malabo-convention-set-enter-effect-following ; https://cipit.org/wp-content/uploads/2024/11/ADM-in-Africa-V2.pdf

### AI Act européen (référence)
- SÛR (extraits concordants de plusieurs sources) : l'annexe III classe **à haut risque** l'évaluation de solvabilité / score de crédit des personnes physiques (hors détection de fraude) et la **tarification et l'évaluation du risque en assurance vie et santé** ; les autres branches (auto, dommages) n'y sont pas. Numérotation du point divergente selon les sources : citer le texte officiel. https://ai-act-service-desk.ec.europa.eu/en/ai-act/annex-3 (fetch en 429, non lu) ; https://burning-cost.github.io/2026/03/28/eu-ai-act-insurance-pricing-what-you-need-to-know ; https://banking.vision/en/high-risk-ai-in-banking
- SÛR (plusieurs sources) : « omnibus numérique » : obligations de l'annexe III repoussées du 2 août 2026 au **2 décembre 2027** (annexe I : 2 août 2028) ; accord provisoire du 7 mai 2026, approbation finale du Conseil rapportée au 29 juin 2026 ; seules les dates changent. https://fpf.org/blog/the-ai-act-implementation-timeline-what-changes-under-the-ai-omnibus ; https://secureprivacy.ai/blog/eu-ai-act-digital-omnibus-the-new-high-risk-ai-deadlines-after-council-approval ; https://www.winstontaylor.com/insights/ai-act-rules-on-high-risk-ai-delayed-as-ai-digital-omnibus-agreed
- PROBABLE : art. 6(3) permet d'écarter un système listé s'il n'influence pas matériellement la décision (à documenter) ; art. 86 = droit à explication, subsidiaire ; analyse d'impact sur les droits fondamentaux pour crédit et assurance vie/santé ; évaluation de conformité par contrôle interne. https://compliance-ai-h.pages.dev/regulations/eu/ai-act/articles/art-86 ; https://www.mccannfitzgerald.com/knowledge/technology-and-innovation/essential-services-spotlight-eu-ai-act-draft-guidelines-on-high-risk-ai-classification

### Équité et explicabilité des scores
- PROBABLE : pratique : valeurs de Shapley converties en **codes de motifs** de refus (Upstart, Wells Fargo) ; le motif doit refléter ce qui a réellement pesé, pas un modèle de substitution ; les régulateurs distinguent explication a posteriori et raisons réelles ; tests d'impact disparate **avant** déploiement, attention aux variables proxy. https://arxiv.org/pdf/2204.12365 ; https://upstart.com/lenders/regulatory-compliance/adverse-action-notices ; https://theneuralbase.com/ai-for-finance/learn/advanced/reason-codes-for-adverse-action/
- Non lu à la source : circulaire CFPB 2023-03 (cité par un blog). Aucun texte UEMOA/BCEAO sur le score de crédit dans les résultats.

### Ce que le PRD devrait retenir (sujet 6)
- **Règle produit n° 1 : aucune décision à effet juridique (octroi/refus de crédit, rejet de sinistre, tarif individuel) prise par l'IA seule** (Togo art. 27 al. 2) ; l'IA **recommande**, un humain décide et peut s'écarter, avec **saisie conservée des observations de l'intéressé**.
- **Explicabilité de série** : chaque score expose ses facteurs principaux et son niveau (règle/modèle), motifs issus du modèle décisionnaire lui-même ; journal d'audit de chaque recommandation (version du modèle, entrées, sortie, humain, décision finale).
- **Tests d'équité avant mise en service** et dans le rapport de performance (sexe, âge, zone, activité) ; variables interdites et proxy listées ; scores crédit et assurance vie/santé traités **comme « haut risque » AI Act par anticipation** (référence, pas obligation hors UE).
- **Revue juridique obligatoire** avant mise en service du scoring crédit ou assurance : textes sénégalais et ivoirien sur les décisions automatisées à lire, BCEAO/commission bancaire, régulateurs microfinance et assurance (CIMA).
- Distinguer **recommandation** (permise, outillée) de **décision automatique** (désactivée par défaut, interdite pour crédit et sinistre tant que le juriste n'a pas tranché).

---

## Synthèse — 5 recommandations majeures
1. Un seul moteur d'IA, capacités déclarées par module, droits hérités de l'utilisateur.
2. Trois niveaux d'apprentissage (règles → modèle par client → a priori global opt-in agrégé), seuils de passage mesurés par capacité.
3. Aucune donnée client brute ne sort : passerelle unique (masquage, journal), fédéré/DP en phase 2, liaison sortante seulement.
4. Cycle de vie contrôlé : registre à alias, ombre → canari → général, portes écrites, retour arrière immédiat, rapport de performance par capacité.
5. Humain dans la boucle pour toute décision à effet juridique (Togo art. 27), explicabilité et tests d'équité, revue juridique avant crédit/assurance.

## Limites
- Pages officielles non ouvertes (Salesforce Trust : 403 ; AI Act Service Desk : 429) : contenu pris dans des extraits de recherche.
- Non trouvé : décisions automatisées Sénégal/Côte d'Ivoire ; texte BCEAO sur la localisation ; retours chiffrés de FL en production avec très peu de clients ; seuil publié règle → modèle.
