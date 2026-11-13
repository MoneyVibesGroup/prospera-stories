## Annexe A. Contrat de module (13 lignes par module)

Le contrat de module demande à chaque PRD treize lignes par module, une par clause **C1 à C13**. **Les règles de lecture et les conventions communes sont celles du PRD distributeur (annexe A)**, sans être recopiées : aucune cellule vide ; gate `<CODE>_NOT_ENTITLED` ; cloisonnement par `organisationId` ; droits au format `^[a-z]+:[a-z-]+:[a-z]+$` ; faits publiés `module.objet.evenement@1`.

Ce qui change pour l'IA commune :
- **Un seul service, trois modules.** `prospera-ia-service` (port `:3417`, l'ancien `assistant-service` jamais codé, dont il reprend et étend le PRD et la spine : FR-2) porte **trois modules** installables séparément (FR-43) : `ia` (le socle), `assistant` (Copilot et agents sous mandat) et `automatisations` (module M26 selon le plan de rédaction, D2). `assistant` et `automatisations` **dépendent** de `ia` ; installer l'un sans `ia` est refusé (`MODULE_DEPENDANCE_MANQUANTE`).
- **Une fiche à part pour la centrale.** `prospera-ia-centrale` tourne **seulement chez Money Vibes** ; elle **n'est pas installable** chez un client et n'a pas de manifeste d'instance (A.4). Ses clauses sont données pour que le contrat soit complet.
- **Clause C11.** L'IA **est** le moteur : elle est la cible de la clause C11 des autres modules, elle ne la déclare pas pour elle-même au sens des quatre logiciels. Les noms de capacités et de finalités sont des **propositions** (FR-37, FR-90), modifiables avant le manifeste ; `[À CONFIRMER]` marque ce que la spine de l'IA doit trancher.
- **Désinstaller ne supprime rien** (FR-181, FR-43) : registre, écarts, calibrations et rapports restent stockés et masqués.
- **Les rôles** cités à la clause C7 sont ceux du §2.1 : UM, RM, AUD, DSI, IA-MV, JUR, DPD ; l'IA **n'a aucun droit propre** et **n'ouvre aucune donnée** que l'utilisateur ne peut voir (FR-25, FR-39). Les droits propres au module ne portent que sur le **réglage, la consultation du registre et la promotion**.

### A.1 ★ Le socle (`ia`, service `prospera-ia-service` :3417)

| Clause | Valeur pour ce module |
|---|---|
| C1 Manifeste | `code: 'ia'`, `version: '1.0.0'`, service porteur `prospera-ia-service`. `depends: []` (socle de la plateforme seulement). `enrichiPar: [assistant, automatisations]` ; les quatre logiciels le **consomment** par la clause C11, sans le déclarer en dépendance dure (FR-40, FR-43). Droit de module `ia`. Profil de déploiement : en ligne (service multi-organisations) ou en local (sous l'agent, sans port entrant : FR-30, FR-32). |
| C2 Socle | Gate `IA_NOT_ENTITLED`. Cloisonnement par `organisationId` : en ligne, aucune requête, aucun cache et aucun journal ne mélangent deux organisations (`ORGANISATION_HORS_JETON`, FR-31) ; une calibration est la donnée d'**une organisation et d'un secteur** (FR-42, FR-166). Les droits et l'échéance sont ceux de la plateforme (moteur AD-19). Aucune connexion à la base d'un autre module (FR-38). |
| C3 Données possédées | **Catalogue de l'instance** (capacités déclarées par les modules, version, maturité N0/N1/N2 en service, fiche d'objectifs, vocabulaire par logiciel : FR-90) ; **registre de l'IA** inaltérable, chaîné, à deux horloges (FR-17) ; **propositions** (immuables, chaînées : FR-12) ; **journal des écarts** et faits de réalité rattachés (FR-56, FR-57) ; **calibrations** (courante, sœurs conservées : FR-59, FR-60) ; **modèles installés** (courant et précédent : FR-67, FR-83) ; **désaccords tranchés** et taux « qui avait raison » (FR-74, FR-75) ; **registre des transferts** (FR-80) ; **journal des accès** (FR-23) ; **rapports mensuels** (FR-71) ; **observations de la personne concernée** (FR-22) ; **packs de secteur installés** (FR-161). |
| C4 Emplacements vides | Aucune dépendance dure. Un module métier **absent** : ses capacités sont retirées du catalogue de l'instance (FR-37). Un **fait de réalité absent** : la capacité reste N0 ou N1 et la fiche le dit (FR-57). `document-service` absent : la lecture de pièces rend `NON_INSTALLE` (FR-140). Le **modèle de langage absent ou trop petit** : capacité de langage `DEGRADE`, repli sur gabarit et règle, dit à l'écran (FR-35, FR-133). Un emplacement d'IA sans IA rend `NON_INSTALLE` ou `INDISPONIBLE`, jamais une erreur (FR-40). |
| C5 Contrats nommés | **Publie** (propositions de noms) : `ia.proposition.rendue@1` (identifiant, capacité, version, maturité, origine, niveau, statut) ; `ia.proposition.decidee@1` (statut, décideur, motif codé, par le module consommateur) ; `ia.ecart.enregistre@1` ; `ia.desaccord.tranche@1` (qui avait raison, horizon) ; `ia.capacite.changed@1` (état absolu d'une capacité : coupée, dégradée, en service) ; `ia.modele.promu@1` et `ia.modele.retire@1` ; `ia.derive.alertee@1`. **Consomme** : les faits **« prédiction »** et **« réalité »** nommés des modules, schéma versionné testé des deux côtés (FR-57, `[À CONFIRMER]`, trou T-12 : amendement A-4). |
| C6 Paramètres | Tout seuil, délai, taux, borne ou liste est un paramètre (FR-3) : voir l'**annexe D** (D.1 doctrine et contrat, D.2 exploitation et apprentissage, D.3 catalogue, D.4 secteurs, D.5 transverses). Les principaux : `ia.confiance_min`, `seuil_n2`, `ia.recalibration_borne_pct`, `ia.k_min`, `ia.desaccord_horizon`, `ia.delai_reponse_max_s`, `ia.retention_registre_annees`. |
| C7 Droits | Droits **propres au module** (propositions, au format de la plateforme) : `ia:registre:lire` (AUD, RM), `ia:journal:lire` (AUD, DPD), `ia:capacite:consulter` (UM, RM, DSI, DG), `ia:capacite:couper` (RM pour son périmètre ; DG pour toute l'organisation), `ia:rapport:lire` (RM, DSI), `ia:desaccord:lire` (RM et l'agent pour ses propres désaccords seulement : FR-75), `ia:observation:enregistrer` (UM, pour la personne concernée : FR-22), `ia:version:promouvoir` et `ia:version:retirer` (DSI : FR-66, FR-67), `ia:parametre:regler` (DSI, RM selon le paramètre), `ia:consentement:modifier` (DG ou désigné par écrit : `CONSENTEMENT_RESERVE_AU_DG`, FR-76). **Aucun droit n'ouvre une donnée métier** ; l'IA applique les droits de l'utilisateur qui demande (FR-25, FR-39). |
| C8 Module d'écran | `src/modules/ia/` : **composant commun** d'affichage d'une proposition (provenance, explication, gestes accepter, modifier, rejeter, voir pourquoi : FR-4, FR-21) ; `/ia/capacites` (page « Mes capacités » : code, niveau, version, date de mise en service) ; `/ia/registre` (AUD, RM) ; `/ia/rapports` (RM, DSI) ; `/ia/versions` (DSI : ombre, promotion, retrait, date) ; `/ia/consentements` (DG, DPD) ; `/ia/transferts` (DG, DPD). Aucune règle métier dans l'écran ; l'IA se branche aux emplacements des modules (FR-44). |
| C9 Installer/désinstaller | Désinstaller ne supprime **rien** : registre, écarts, calibrations, modèles, rapports restent stockés et masqués ; aucun bouton « supprimer » n'existe ; test aller-retour. Avertissement : « Plus aucune proposition d'IA ne sera rendue ; les règles de base de chaque module continuent de servir ; le registre est conservé. » La conservation du registre (`ia.retention_registre_annees`) vaut après désinstallation (FR-181). Aucun parcours des quatre logiciels ne casse (FR-43). |
| C10 Démarrer seul | `profiles: ["ia"]` ; socle seul. Avec **un seul** module métier qui déclare une capacité, l'IA rend une proposition N0 à l'identique en ligne et en local, l'inscrit au registre et la lit au catalogue (FR-30, FR-45). Sans modèle, sans centrale et sans langage, elle sert en règles et gabarits (FR-53, FR-85). |
| C11 IA | Sans objet au sens habituel : **c'est le moteur**. Elle déclare, pour la centrale et pour l'apprentissage : `ia: { modeles: [<un par capacité à maturité N1>], finalites: ['apprentissage-commun'] }`. Les **19 familles** du catalogue (codes proposés) : `score-tiers`, `probabilite-paiement`, `lecture-pieces`, `controle-coherence`, `anomalie-fraude`, `prevision`, `recommandation`, `redaction`, `resume-source`, `copilot`, `brief-priorites`, `terrain`, `explication`, `segmentation-packages`, `coaching`, `rapprochement`, `simulation`, `analyse-sectorielle`, `automatisation` (§10, FR-90). Aucun module n'embarque de modèle (FR-37). |
| C12 Migrations | `retourArriere: 'SANS_PERTE'` dans la fenêtre de **sept jours**. Migration additive ; le journal des écarts, le registre et les calibrations sont **hors** de la migration de promotion et lisibles par la version précédente (N et N-1 : FR-56, FR-186). Interrupteurs : `copilot-ia`, `langage-ia`, `apprentissage-commun`, `modele-commun`, `voix-terrain` (réglage du pack : FR-138), `versions-de-catalogue`. Un nouveau modèle qui change des scores affichés se déclare comme **comportement visible** (FR-66). Un statut, un code ou un champ ajouté est lu comme **inconnu** par la version précédente, qui refuse la transition plutôt que de la deviner. |
| C13 Installable sous contrôle | Prérequis : socle de la plateforme ; (recommandés) au moins un module métier qui déclare une capacité. Routes d'**export, d'import, d'effacement et de vérification** du contrat (FR-43) ; route `sante` : `OK` ou `DEGRADE` par capacité et par moteur (règles, modèles, langage, recalibration, tunnel : FR-86). Vérifications : `registre-complet` (🟢 si le nombre de propositions affichées égale le nombre d'entrées du registre ; FR-17) ; `jamais-bloquante` (🟢 si, l'IA coupée, un parcours d'essai de chaque logiciel va au bout ; FR-40) ; `port-unique` (🟢 si aucun appel direct à un fournisseur de modèle ni constante de barème n'est trouvé ; FR-37) ; `aucun-port-entrant` (🟢 si le balayage de ports ne trouve rien en local ; FR-32) ; `sante-hors-instance` (🟢 si une demande classée santé vers un modèle hébergé est refusée : `SANTE_HORS_INSTANCE` ; FR-36) ; `contrat-identique` (🟢 si la suite de contrat rend les mêmes propositions en ligne et en local ; FR-30) ; `equite` (🟢 si une variable hors liste est refusée : `VARIABLE_NON_AUTORISEE` ; FR-70). |

### A.2 ★ Copilot et agents sous mandat (`assistant`)

| Clause | Valeur pour ce module |
|---|---|
| C1 Manifeste | `code: 'assistant'`, `version: '1.0.0'`, service porteur `prospera-ia-service` (:3417). `depends: [{ia, « le contrat de proposition, le registre, le catalogue et la calibration vivent dans ia »}]` (dépendance **dure** ; `MODULE_DEPENDANCE_MANQUANTE` sans elle : FR-43). `enrichiPar:` les modules métier qui publient des **types d'action** (FR-134). Reprend et étend le PRD assistant d'août (FR-2). |
| C2 Socle | Gate `ASSISTANT_NOT_ENTITLED`. Cloisonnement par `organisationId` et par **périmètre du rôle** : le Copilot lit **ce que l'utilisateur peut lire**, rien de plus (FR-132) ; un agent agit **dans le périmètre de son mandat** (FR-135). Les droits viennent du rôle métier, jamais d'un rôle IA (FR-25). |
| C3 Données possédées | **Catalogue des types d'action** (code, module exécutant, réversible oui/non/sous conditions, engageant, moyen d'annulation, autonomisable : FR-134) ; **mandats** (délégation bornée, plafond cumulé réservé puis confirmé, échéance `IA-P15` : FR-135) ; **exécutions** (demande par événement, idempotente, annulable par compensation : FR-136) ; **file d'arbitrage** ; **sessions du Copilot** (contexte brut purgé à l'échéance courte : FR-38). |
| C4 Emplacements vides | `ia` est une dépendance dure. Module exécutant **absent** : son type d'action n'est pas publié ; l'agent n'a pas cette action (FR-137). Modèle de langage absent : le Copilot **se replie** sur la recherche par règles et gabarits et le dit (FR-133). |
| C5 Contrats nommés | **Publie** (propositions) : `assistant.mandat.delivre@1`, `assistant.mandat.revoque@1`, `assistant.execution.demandee@1`, `assistant.execution.annulee@1`, `assistant.arbitrage.decide@1`. **Consomme** : `<module>.action.executee@1` et `<module>.action.annulee@1` des modules exécutants (publiés par eux, sous leur propre manifeste) ; la sortie de l'assistant est un **ordre**, jamais une écriture directe dans la base d'un module (FR-136). |
| C6 Paramètres | Annexe D.5 et D.3 : `IA-P15` (plafond de durée d'un mandat, 90 jours), `ia.arbitrage.plafond_lot` (plafond dur d'une décision groupée), `IA-P09` (annulations qui déclenchent l'alerte), `ia.objectif.copilot.temps_reponse_s`, `ia.perf.copilot_p95_s`, `ia.cout.quota_mensuel`. |
| C7 Droits | `assistant:copilot:interroger` (UM, RM ; une question n'ouvre aucun droit supplémentaire), `assistant:mandat:delivrer` et `assistant:mandat:revoquer` (RM ou DG ; `AUTORITE_INSUFFISANTE` sinon : FR-135), `assistant:execution:annuler` (RM), `assistant:arbitrage:decider` (RM), `assistant:catalogue:publier` (responsable de publication à nommer, action A-10 : FR-134). |
| C8 Module d'écran | `src/modules/assistant/` : emplacement du **Copilot** dans les quatre logiciels (texte, lecture seule, chiffres sourcés : FR-131, FR-132) ; `/assistant/mandats` (délivrer, révoquer, plafond, échéance) ; `/assistant/executions` (suivi, annulation) ; `/assistant/arbitrage` (file, décision groupée). Aucune saisie vocale dans le Copilot au premier jour (FR-138). |
| C9 Installer/désinstaller | Désinstaller ne supprime rien : mandats, exécutions et sessions restent stockés ; les **exécutions en cours** sont **annulées par compensation** ou terminées avant l'arrêt (FR-136). Avertissement : « Plus aucune action autonome ne sera exécutée ; les mandats sont suspendus. » `ia` continue de servir les propositions. |
| C10 Démarrer seul | `profiles: ["assistant"]` ; socle + `ia`. Sans module exécutant, le Copilot répond en lecture seule et aucun agent n'a d'action (FR-137). |
| C11 IA | Familles servies : `copilot` et, pour les agents, `redaction`, `automatisation` et `brief-priorites` (FR-131 à FR-137) ; modèle de langage par la passerelle en ligne et par un modèle ouvert en local (FR-33, FR-35). `finalites: []` : aucun apprentissage commun propre ; le Copilot lit « plus large » par un **compte de service dédié** sous la garde du registre des consentements (FR-38, FR-88). |
| C12 Migrations | `retourArriere: 'SANS_PERTE'`. Interrupteurs : `copilot`, `agents-sous-mandat`, `mode-auto` (jamais pour un type engageant). Un type d'action ajouté au catalogue est lu comme **inconnu** par la version précédente, qui le **refuse**. |
| C13 Installable sous contrôle | Prérequis : `ia` en service. Vérifications : `copilot-lecture-seule` (🟢 si le Copilot ne crée, ne modifie, n'envoie et ne supprime rien ; FR-131) ; `type-engageant-non-autonome` (🟢 si un type engageant ou irréversible en `AUTO` ou `AUTO_SOUS_MANDAT` est refusé : `TYPE_NON_AUTONOMISABLE` ; FR-134) ; `mandat-plafonne` (🟢 si l'exécution au-delà du plafond cumulé est refusée ; FR-135) ; `droits-de-l'utilisateur` (🟢 si le Copilot ne rend rien que l'utilisateur ne puisse voir ; FR-132) ; `assurance-sans-auto` (🟢 si l'activation du mode `AUTO` pour l'assurance est refusée : `MODE_NON_PERMIS_ASSURANCE` ; FR-127). |

### A.3 ★ Automatisations par règles (`automatisations`, M26 [À CONFIRMER])

| Clause | Valeur pour ce module |
|---|---|
| C1 Manifeste | `code: 'automatisations'`, `version: '1.0.0'`, service porteur `prospera-ia-service` (:3417). `depends: [{ia, « les règles proposent par le port unique et inscrivent leurs actions au registre »}]` (dure). Le moteur d'automatisation est **un seul moteur** pour les quatre logiciels (FR-127). |
| C2 Socle | Gate `AUTOMATISATIONS_NOT_ENTITLED`. Cloisonnement par `organisationId` ; un travail planifié s'exécute sous le **compte d'une règle** dont le responsable garde son droit ; il s'arrête et notifie s'il le perd (FR-25). |
| C3 Données possédées | **Règles** (déclencheur, conditions en grammaire fermée, action, mode) ; **modes** (`SUGGESTION`, `VALIDATION`, `AUTO`, `AUTO_SOUS_MANDAT` : le mode le plus strict est le défaut) ; **exécutions** ; **file d'arbitrage** ; **journal des déclenchements**. |
| C4 Emplacements vides | `ia` est dure. Un module exécutant absent : l'action n'est pas proposée dans l'éditeur de règles. Sans `assistant`, les règles tournent en `SUGGESTION` et `VALIDATION` seulement pour les types engageants. |
| C5 Contrats nommés | **Publie** (propositions) : `automatisations.regle.changed@1`, `automatisations.execution.demandee@1`, `automatisations.execution.annulee@1`. **Consomme** : les faits des modules qui déclenchent les règles (`<module>.<objet>.<evenement>@1`) et les `action.executee`. |
| C6 Paramètres | `ia.arbitrage.plafond_lot` (25 par défaut, 100 au plus), `IA-P09`, `ia.objectif.agent.annulees_pct`, plus les paramètres propres à chaque règle (déclarés par le client). |
| C7 Droits | `automatisations:regle:ecrire` (RM), `automatisations:regle:activer` (RM ; mode `AUTO` pour les seuls types qui le permettent), `automatisations:arbitrage:decider` (RM), `automatisations:execution:annuler` (RM). |
| C8 Module d'écran | `src/modules/automatisations/` : `/automatisations` (éditeur à grammaire fermée, aucun code libre), `/automatisations/arbitrage` (décision groupée), `/automatisations/historique`. |
| C9 Installer/désinstaller | Désinstaller **suspend** toutes les règles (aucune ne s'exécute) et ne supprime rien ; avertissement : « Plus aucune règle ne se déclenchera ; les exécutions en cours sont annulées par compensation. » |
| C10 Démarrer seul | `profiles: ["automatisations"]` ; socle + `ia`. Une règle de démonstration en `SUGGESTION` produit une proposition et l'inscrit au registre. |
| C11 IA | Famille `automatisation` (FR-127). Aucun modèle de langage n'évalue une condition : la **grammaire est fermée** (`GRAMMAIRE_FERMEE`) ; une règle qui contient une expression à évaluer est refusée à l'enregistrement. |
| C12 Migrations | `retourArriere: 'SANS_PERTE'`. Interrupteurs : `regles-en-auto`, `decision-groupee`. Un mode ou un type ajouté est lu comme **inconnu** par la version précédente, qui refuse la règle plutôt que de la deviner. |
| C13 Installable sous contrôle | Prérequis : `ia`. Vérifications : `grammaire-fermee` (🟢 si une règle contenant du code libre est refusée ; FR-127) ; `mode-strict-par-defaut` (🟢 si toute règle neuve est en `SUGGESTION` ou `VALIDATION` ; FR-127) ; `assurance-sans-auto` (🟢 si le mode `AUTO` est refusé en assurance : `MODE_NON_PERMIS_ASSURANCE`) ; `jamais-engageant-en-auto` (🟢 si un type engageant en `AUTO` est refusé : `TYPE_NON_AUTONOMISABLE`). |

### A.4 Fiche : `prospera-ia-centrale` (Money Vibes seulement ; **non installable chez un client**)

La centrale n'est **pas un module** d'un état voulu d'instance : elle n'a pas de manifeste client, pas de profil de déploiement chez un client et pas de droit livré à une organisation. Ses clauses sont données pour la complétude du contrat et pour que la spine de l'IA les reprenne.

| Clause | Valeur |
|---|---|
| C1 Manifeste | **Sans objet côté client.** Service interne de Money Vibes (`prospera-ia-centrale`), déployé dans le poste central ; **absent** de tout état voulu d'une instance (FR-30, D2). `[À CONFIRMER : nom et port]` |
| C2 Socle | Poste central de Money Vibes. **Aucune connexion à un autre service du poste central** que la voie du jeton d'export (FR-78) ; un test d'inspection de sa configuration le confirme. Elle ne lit **jamais** une donnée d'un client : elle reçoit des agrégats au niveau « apprentissage » (FR-77). |
| C3 Données possédées | **Registre des modèles** (versions, signatures, ligne de modèles, composition tracée : FR-62, FR-81, FR-83) ; **agrégats d'écarts** reçus (k minimal, sans identité) ; **jeux d'évaluation** et résultats champion/challenger (FR-69) ; **rapports globaux** (FR-72) ; **plan de promotion** et journal (FR-64, FR-65) ; **taux « qui avait raison » en global** (FR-75). |
| C4 Emplacements vides | Sans instance qui envoie : aucun entraînement ; les instances **continuent de servir** avec leur dernier modèle (FR-85). |
| C5 Contrats nommés | **Reçoit** : `ia.contribution.recue@1` (lot d'agrégats, par morceaux repris, clé d'idempotence : FR-78). **Publie** : `ia.modele.signe@1` et `ia.modele.publie@1` sur la **ligne de modèles distincte** (FR-63), `ia.jeton.export@1` (jeton quotidien remis dans la réponse du contact : FR-78). |
| C6 Paramètres | `ia.cadence_entrainement_jours_min`, `ia.cadence_publication_jours_min`, `ia.k_min`, `ia.equite_ecart_max_pts`, `ia.duree_ombre_jours`, `ia.part_canari_pct`, `IA-P80` à `IA-P86`. |
| C7 Droits | Rôle **IA-MV** seulement (équipe IA de Money Vibes) : `ia-centrale:modele:entrainer`, `ia-centrale:modele:signer` (**double signature** pour une capacité qui touche une personne : FR-65), `ia-centrale:modele:publier`, `ia-centrale:rapport:lire` (agrégats seulement). Aucun droit sur une donnée de client. |
| C8 Module d'écran | Interne : tableau de bord de l'équipe IA (rapports globaux, plan de promotion, dérive). Aucun écran chez un client. |
| C9 Installer/désinstaller | **Sans objet** (non installable chez un client). Côté Money Vibes, l'arrêt de la centrale n'arrête aucune instance (FR-85). |
| C10 Démarrer seul | Elle démarre sans client : registre vide, entraînement impossible, publication désactivée. |
| C11 IA | Elle **est** l'entraînement : modèle commun N1 par ligne et par secteur (FR-166, FR-168) ; aucune capacité servie à un utilisateur. Le premier modèle réel apparaît au plus tôt au second semestre 2027 (FR-47, FR-91). |
| C12 Migrations | Même discipline N et N-1 ; **retour arrière d'un modèle en une action**, en moins de `ia.retour_arriere_max_min`, avec conservation du modèle précédent `ia.retour_arriere_conservation_jours` (FR-67). |
| C13 Installable sous contrôle | **Sans objet** pour un client. Vérifications internes avant toute publication : signature par une clé dont l'usage « modèle » le couvre (FR-83) ; double signature ; non-régression par secteur (FR-167) ; équité (FR-70) ; k respecté (FR-77) ; plan de promotion respecté (`PROMOTION_ETAPE_MANQUANTE`, FR-64). |

---

## Annexe B. Contrat de proposition

Toute sortie de l'IA présentée à un utilisateur est une **proposition** au sens de ce contrat (FR-12). Il est **unique** : il remplace la Proposition de l'assistant d'août et le PropositionPort de la microfinance (FR-2). Les noms de champs sont des propositions ; leurs valeurs fermées sont **contractuelles**. Le contrat est versionné (FR-186) ; un code ou un champ ajouté est lu comme **inconnu** par la version précédente, qui **refuse** plutôt que de deviner.

**Deux notions qu'il ne faut pas confondre.** Le **niveau** d'une proposition (`EXTRACTION`, `ANALYSE`, `RECOMMANDATION`) dit **ce que fait** la proposition ; la **maturité** (`N0`, `N1`, `N2`) dit **ce qui l'a produite** (règle, modèle commun, modèle ou calibration du client : FR-45). Il n'existe **aucun** niveau « décision » et **aucun** décideur « système » (FR-12).

### B.1 Champs

| Champ | Type | Obligatoire | Règle | FR |
|---|---|---|---|---|
| `id` | identifiant | oui | unique ; immuable | FR-12 |
| `organisationId` | identifiant | oui | cloisonnement ; figé à l'appel | FR-31 |
| `capacite` | `{code, version, famille}` | oui | déclarée au catalogue et au manifeste du module (C11) ; sinon `CAPACITE_NON_DECLAREE` | FR-37, FR-90 |
| `vocabulaire` | code | oui | celui du logiciel consommateur | FR-90, FR-162 |
| `objetRef` | `{type, id}` | oui | référence d'objet neutre (dossier, client, police, point de vente) déclarée par la verticale | FR-12 |
| `origine` | énumération | oui | `REGLE`, `MODELE`, `LANGAGE` | FR-12 |
| `niveau` | énumération | oui | `EXTRACTION`, `ANALYSE`, `RECOMMANDATION` | FR-12 |
| `maturite` | énumération | oui | `N0` (règle), `N1` (modèle commun), `N2` (calibration ou modèle du client) ; sert à l'affichage « règle », « modèle commun », « modèle de votre structure » | FR-45, FR-49 |
| `statut` | énumération | oui | `PROPOSEE`, `ACCEPTEE`, `MODIFIEE`, `REJETEE`, `EXPIREE` ; transitions B.3 | FR-12 |
| `decideur` | énumération | à la décision | `HUMAIN`, `REGLE` (règle déterministe approuvée), `MANDAT` (action sous mandat) ; jamais « système » | FR-12, FR-14 |
| `decision` | `{auteur, date, motifCode, valeurRetenue}` | à la décision | écrite par le **module consommateur** ; `motifCode` d'une **liste fermée** de la capacité, versionnée ; commentaire libre gardé **dans le module** | FR-12, FR-58 |
| `mode` | énumération | si automatisation ou agent | `SUGGESTION`, `VALIDATION`, `AUTO`, `AUTO_SOUS_MANDAT` ; le plus strict est le défaut | FR-127, FR-134 |
| `provenance` | `{versionRegleOuModele, versionLangage, dateCalcul, donneesUtilisees[], versionParametres}` | oui | la version de paramètres de la proposition égale celle de la demande, sinon refus par le consommateur | FR-16, FR-37 |
| `confiance` | nombre 0 à 1 | oui | affichée ; **n'ouvre aucune autonomie** ; sous `ia.confiance_min` (IA-P12), « je ne sais pas » | FR-12, FR-54 |
| `sources[]` | `{type, ref, extrait, date}` | pour `ANALYSE` et `LANGAGE` | sans source, **non affichée** (`NON_SOURCEE`) | FR-16 |
| `explication` | `{facteurs[{nom, poids, contribution}] \| regleAppliquee \| sourcesCitees}` | oui | restitue ce qui a **réellement pesé** ; pas de modèle de substitution | FR-16 |
| `contenu` | charge utile typée par famille | oui | schéma par capacité ; un nombre du texte se retrouve dans les entrées | FR-26, FR-132 |
| `interdictions[]` | liste de `{objet, nature}` | si déclarées | ex. montant interdit sur un objet corporel ; la sortie n'en contient pas | FR-20 |
| `simulation` | booléen | si simulation | marqueur « simulation » ; n'entre dans aucun indicateur ni état | FR-125 |
| `remplace` | identifiant | si ré-proposition | cite la proposition précédente ; ré-proposer crée une **nouvelle** proposition | FR-12 |
| `expireLe` | date | oui | `IA-P01` (30 jours) ; expiration par travail idempotent, pas à la lecture | FR-12 |
| `condensat`, `condensatPrecedent` | empreintes | oui | chaînage du registre ; inaltérable | FR-17 |

### B.2 Énumérations

| Énumération | Valeurs | FR |
|---|---|---|
| `origine` | `REGLE`, `MODELE`, `LANGAGE` | FR-12 |
| `niveau` | `EXTRACTION`, `ANALYSE`, `RECOMMANDATION` | FR-12 |
| `maturite` | `N0`, `N1`, `N2` | FR-45 |
| `statut` | `PROPOSEE`, `ACCEPTEE`, `MODIFIEE`, `REJETEE`, `EXPIREE` ; état de registre `NON_SOURCEE` (non acceptable) | FR-12, FR-16 |
| `decideur` | `HUMAIN`, `REGLE`, `MANDAT` | FR-12 |
| `mode` | `SUGGESTION`, `VALIDATION`, `AUTO`, `AUTO_SOUS_MANDAT` ; niveau de confiance de la capacité `AUTO`, `A_VALIDER`, `SUGGESTION` (verticale distributeur) | FR-120, FR-127 |
| catégorie d'effet | `JURIDIQUE_OU_FINANCIER` et non engageant ; une proposition dont le décideur est `REGLE` ou `MANDAT` est refusée si la catégorie est `JURIDIQUE_OU_FINANCIER` | FR-13, FR-14 |
| état d'une capacité | `OK`, `DEGRADE`, `INDISPONIBLE`, `NON_INSTALLE` | FR-40, FR-86 |
| statut de catalogue | en service ; `BIENTOT`, `PLUS_TARD`, `EXCLU` | FR-128 |
| état d'un pack de secteur | `BROUILLON`, `ESSAI`, `ACTIF`, `RETIRE` | FR-161 |
| réglage de la voix d'un pack | `ACTIVEE`, `BIENTOT`, `SANS_VOIX` | FR-138, FR-161 |
| issue d'un désaccord | `IA_AVAIT_RAISON`, `HUMAIN_AVAIT_RAISON`, `INDECIDABLE` | FR-74 |
| joignabilité du tunnel | `OK`, `INJOIGNABLE` | FR-32 |

### B.3 Transitions de statut

| De | Vers | Qui |
|---|---|---|
| `PROPOSEE` | `ACCEPTEE`, `MODIFIEE`, `REJETEE` | l'utilisateur (via le module consommateur) ; `decideur` = `HUMAIN`, ou `REGLE` / `MANDAT` pour un type non engageant et réversible |
| `PROPOSEE` | `EXPIREE` | travail idempotent à `expireLe` |
| tout autre | tout | **refusée** : une proposition ne se modifie jamais ; une nouvelle proposition cite la précédente (`remplace`) |

### B.4 Codes d'erreur et états nommés

Chaque refus est **nommé**, compté et inscrit au journal (FR-180). Le code HTTP est une **proposition** `[ASSUMPTION : à fixer par l'architecture]`, sauf les deux valeurs données par le PRD (429 et 403).

| Code | HTTP proposé | Cas | FR |
|---|---|---|---|
| `MONTANT_INTERDIT` | 422 | une capacité est déclarée interdite de proposer un montant (valeur, fourchette, médiane, offre suggérée, écart en pourcentage) sur l'objet demandé ; **généralise** `MONTANT_CORPOREL_INTERDIT`, qui en est le **cas assurance** (volet corporel) et reste valable comme alias | FR-20, FR-110, FR-120 |
| `TYPE_NON_AUTONOMISABLE` | 422 | un type d'action engageant ou irréversible est demandé en `AUTO` ou `AUTO_SOUS_MANDAT` | FR-134 |
| `SANTE_HORS_INSTANCE` | 422 | une demande dont un champ est classé santé vise un modèle hébergé hors de l'instance, ou un contenu classé santé est envoyé à la passerelle ; **aucun octet** ne part. `DONNEE_SANTE_HORS_INSTANCE` (FR-36) en est un **alias à retirer** | FR-36, FR-143 |
| `QUOTA_INFERENCE_DEPASSE` | 429 | quota d'inférence de l'organisation épuisé ; la capacité retombe sur la règle | FR-31, FR-139, FR-183 |
| `CAPACITE_NON_DECLAREE` | 403 | le module demande une capacité absente de la clause C11 de son manifeste | FR-37, FR-90 |
| `ENTREE_NON_DECLAREE` | 422 | les données utilisées contiennent un champ non déclaré par la capacité | FR-38 |
| `CONSENTEMENT_ABSENT` | 403 | lecture de l'IA sans consentement en vigueur sur la plateforme | FR-38, FR-88 |
| `CONSENTEMENT_RESERVE_AU_DG` | 403 | un consentement est modifié par un autre que le DG ou son désigné par écrit | FR-76 |
| `ORGANISATION_HORS_JETON` | 403 | un chemin vise une autre organisation que celle du jeton | FR-31 |
| `VARIABLE_NON_AUTORISEE` | 422 | une variable hors liste fermée entre dans une capacité de score sur une personne | FR-70, FR-94 |
| `TRANSFERT_NON_DECLARE` | 403 | envoi vers un fournisseur dont le pays d'hébergement n'est pas inscrit « informé » pour l'organisation | FR-80 |
| `LOT_HORS_MANIFESTE` | 422 | un lot d'apprentissage contient un champ absent du manifeste type | FR-77 |
| `PROMOTION_ETAPE_MANQUANTE` | 409 | passer en canari sans ombre, en général sans canari | FR-64 |
| `MODULE_DEPENDANCE_MANQUANTE` | 409 | installation d'`assistant` ou d'`automatisations` sans `ia` | FR-43 |
| `GRAMMAIRE_FERMEE` | 422 | une règle contient une expression à évaluer hors grammaire | FR-127 |
| `MODE_NON_PERMIS_ASSURANCE` | 403 | activation du mode `AUTO` pour un logiciel d'assurance | FR-127 |
| `AUTORITE_INSUFFISANTE` | 403 | un mandat est délivré par un utilisateur sans l'autorité correspondante | FR-135 |
| `ROLE_NON_AUTORISE` | 403 | un rôle non prévu appelle une capacité réservée | FR-104 |
| `HORS_CALENDRIER` | 422 | une relance hors calendrier de l'établissement | FR-97 |
| `REPONSE_AUTO_INTERDITE` | 422 | réponse automatique à un message d'un client dont une créance est échue | FR-112 |
| `PHRASE_SANS_SOURCE` | 422 | une phrase de résumé sans renvoi à une source | FR-113 |
| `CHIFFRE_NON_SOURCE` | 422 | un nombre du texte ne se retrouve pas dans les entrées | FR-102, FR-132 |
| `PIECE_ILLISIBLE` | 200 avec motif | pièce corrompue ou illisible : mise de côté, le lot continue, le dossier avance sur la saisie humaine | FR-141 |
| `FORMAT_NON_SUPPORTE` | 415 | fichier audio ou format non lu au premier jour | FR-100 |
| état `NON_INSTALLE` | 200 (état) | module facultatif non installé, ou voix non activée dans un pack ; **jamais une erreur** | FR-40, FR-138 |
| état `INDISPONIBLE` | 200 (état) | module installé mais coupé, ou plafond de réponse dépassé | FR-40 |
| état `DEGRADE` | 200 (état) | capacité de langage sans modèle ou palier insuffisant ; repli dit | FR-35, FR-86 |
| état `NON_SOURCEE` | — | proposition d'analyse sans source : non affichée, non acceptable | FR-16 |

**Codes du catalogue de départ à confirmer par l'architecture** `[ASSUMPTION]` : un code de refus pour une calibration discordante, un modèle refusé à la signature, un palier insuffisant (écarts nommés du signal hebdomadaire : FR-86) ; ils partent en **schéma fermé**, sans champ libre.

---

## Annexe C. Ce qui sort d'une instance, et ce qui n'en sort jamais

« Instance » : le serveur du client en local, ou l'espace d'une organisation en ligne. « Sortir » : franchir la frontière de l'instance vers Money Vibes ou vers un fournisseur. **Tout passe par l'agent et le tunnel déclaré** en local (FR-32) ; l'IA dépose, l'agent envoie.

### C.1 Ce qui peut sortir, sous condition

| Donnée | Vers | Condition | Fréquence | FR |
|---|---|---|---|---|
| **Écarts agrégés** (niveau d'export « apprentissage ») : agrégats et écarts sans identité, motifs codés | la centrale de l'IA | finalité « apprentissage commun » consentie au contrat par le DG ; consentement distinct du client final pour une institution financière ; effectif minimal `k` (`ia.k_min`) par groupe ; manifeste type approuvé une fois ; **jeton d'export** valide ; copie signée du registre datant de moins de 14 jours ; lot préparé **sur l'instance** (pseudonyme salé par envoi) ; aucune donnée de santé, aucun texte libre, aucune pièce, aucune variable interdite | au plus un envoi par jour, par morceaux repris | FR-61, FR-76, FR-77, FR-78 |
| **Indicateurs de niveau 0** de l'IA (santé, version, âge du modèle, écarts nommés par code) | la supervision de Money Vibes | schéma **fermé**, sans champ libre ni identifiant ni contenu | hebdomadaire | FR-86 |
| **Joignabilité du tunnel** (`OK` ou `INJOIGNABLE`) | la supervision | sans contenu | avec le signal | FR-32 |
| **Demande de langage masquée** | un fournisseur de modèle de langage **hébergé** (en ligne seulement, par la passerelle) | **jamais en local** par défaut (modèle ouvert sur le serveur du client) ; masquage ; aucune rétention chez le fournisseur ; journal ; **transfert déclaré** pour le pays de l'organisation (`TRANSFERT_NON_DECLARE` sinon) ; **jamais de donnée de santé** (`SANTE_HORS_INSTANCE`) ; quota respecté | à la demande | FR-33, FR-34, FR-80, FR-183 |
| **Taux « qui avait raison » agrégé et anonymisé** (preuve commerciale) | le client lui-même, ou le public par la centrale | produit **par la centrale** à partir d'agrégats consentis, avec `k` organisations au minimum, ou, pour un client seul, **par son instance** à partir de ses chiffres ; aucun nom d'agent, d'agence, de client ni d'organisation ; effectif et date toujours publiés | à la demande | FR-75 |
| **Cartes anonymisées de Pulse** (horizon) | des tiers | consentement ; effectif `ia.pulse.effectif_minimal` ; jamais une donnée individuelle ni un concurrent | horizon | FR-152 |

### C.2 Ce qui n'en sort jamais

| Donnée | Pourquoi | FR |
|---|---|---|
| **Donnée de santé**, même anonymisée ; **pièce médicale** et le texte lu qui en vient | classement santé ; jamais vers un modèle hors de l'instance ; jamais dans un lot ; `SANTE_HORS_INSTANCE` | FR-19, FR-36, FR-143 |
| **Identifiant, nom, téléphone, adresse, photo, coordonnée, position précise** d'une personne | niveau d'export « apprentissage » ; date de naissance ramenée à l'année | FR-77 |
| **Texte libre** (commentaire d'un utilisateur, motif libre) | le motif est **codé** ; le commentaire reste dans le module | FR-58, FR-77 |
| **Pièce, image, document** | aucune pièce ne sort ; le contenu reste dans `document-service` | FR-77, FR-140 |
| **Variable interdite** d'un score (genre, situation matrimoniale, nationalité, religion) | liste fermée de variables | FR-70, FR-77 |
| **Prix et marges d'un freelance** | exclus de tout lot | FR-77 |
| **Contexte brut** d'une demande de langage, **rendu figé**, **contenu masqué** d'un envoi | purgés à leur échéance courte ; restent sur l'instance | FR-17, FR-34, FR-38 |
| **Registre de l'IA** et **journal des accès** | trace opposable de l'organisation ; lus par son auditeur | FR-17, FR-23 |
| **Registre des consentements** (autre que sa **copie signée** de moins de 14 jours) | il vit sur l'instance ; il **n'est jamais restauré** par une sauvegarde | FR-76, FR-87 |
| **Calibration et journal des écarts** (en clair) | donnée de l'organisation ; seuls des agrégats consentis remontent | FR-56, FR-60 |
| **Donnée d'un client pour l'IA d'un autre client** | aucune donnée d'un client ne sert à l'IA d'un autre ; seul l'apprentissage commun consenti est mis en commun | FR-7 |
| **Croisement d'une même PME entre verticales** | horizon : identité partagée et consentement explicite | FR-82, FR-151 |
| **Donnée hors de sa finalité** | une donnée n'entraîne jamais un modèle hors de sa finalité consentie | FR-7, FR-76 |
| **Lecture de la base d'un module** | l'IA n'a aucune chaîne de connexion ; elle reçoit des données préparées | FR-38 |
| **Secret d'un fournisseur de modèle** | détenu par la passerelle seule | FR-179 |

### C.3 Ce qui entre dans l'instance

| Donnée | Depuis | Condition | FR |
|---|---|---|---|
| **Modèle commun signé**, **pack de secteur**, **jeux de référence datés** | la ligne de modèles de Money Vibes, par le réseau ou **par fichier** | signature vérifiée par une clé dont l'usage « modèle » le couvre ; période de validité ; compatibilité ; **date choisie par le DSI** en local ; retour arrière en une action | FR-55, FR-63 à FR-67, FR-83, FR-84 |
| **Jeton d'export** quotidien | la centrale | signé, à courte durée ; refusé après un recul ou une bifurcation de l'état de confiance | FR-78 |
| **Modèle ouvert de langage** | le catalogue de modèles de Money Vibes | licence vérifiée à l'entrée au catalogue ; dimensionné au contrat | FR-35 |

---

## Annexe D. Paramètres

Tout seuil, délai, liste ou borne de l'IA est un **paramètre**, jamais une valeur codée en dur (FR-3). Un défaut `[ASSUMPTION]` se **confirme ou se change** à la séance de calibrage avec chaque client, **sans reprise du code**. Format : `code | libellé | défaut | unité | source | FR`. Source : PO = parole du PO ; D = décision du plan ; MOT = spine du moteur ; REC = recherche du 2026-11-13 ; ASSUMPTION = défaut posé par ce PRD ; PRD-D, PRD-MF, PRD-A = PRD distributeur, microfinance, assurance. « par capacité » = valeur dans la fiche de la capacité. **Les alias** (anciens codes des quatre rédactions) sont nommés pour que rien ne se perde ; chaque paramètre n'a qu'**un code canonique**. Cette annexe est la fusion dédoublonnée des tables de W1 (`IA-P01` à `IA-P15`), W2 (§5 à §9), W3 (§10 à §13) et W4 (`IA-P80` à `IA-P86`) et des paramètres du §15 ; les conflits sont listés après les tables.

### D.1 Doctrine, contrat et garde-fous (§1 à §4)

| code | libellé | défaut | unité | source | FR |
|---|---|---|---|---|---|
| `IA-P01` | Durée avant expiration d'une proposition non traitée | 30 | jours | ASSUMPTION | FR-12 |
| `ia.acceptation_facade_pct` (alias `IA-P02`, `ia.objectif.acceptation_facade_pct`) | Taux d'acceptation signalant une validation de façade | 90 | % sur la fenêtre | spine assistant CM-1 | FR-27, FR-68, FR-92, FR-127 |
| `ia.acceptation_fenetre_jours` (alias `IA-P03`) | Fenêtre de mesure du taux d'acceptation | 30 | jours | spine assistant AD-23 | FR-27, FR-68 |
| `ia.k_min` (alias `IA-P04`) | Effectif minimal `k` d'un groupe, d'un agrégat sortant ou d'un nombre d'organisations | **5** | personnes, objets ou organisations | MOT (A-10) ; conflit C-1 | FR-7, FR-19, FR-70, FR-72, FR-75, FR-77, FR-168 |
| `ia.cadence_publication_jours_min` (alias `IA-P05`) | Intervalle minimal entre deux publications atteignant une instance | 7 | jours | D7 ; MOT (fenêtre 7 jours) | FR-6, FR-63 |
| `ia.retention_registre_annees` (alias `IA-P06`) | Conservation de la trace opposable, du registre et du journal des accès | 10 | ans | PRD-A FR-12 ; ASSUMPTION ailleurs | FR-17, FR-23, FR-89, FR-181 |
| `IA-P07` | Délai à partir duquel l'écran reprend la main sur l'analyse humaine | 5 | secondes | ASSUMPTION ; conflit C-2 | FR-15 |
| `IA-P08` | Taux de motifs identiques à la proposition signalé à l'auditeur | 80 | % sur la fenêtre | ASSUMPTION | FR-27 |
| `IA-P09` (alias `ia.objectif.agent.annulees_pct`) | Exécutions autonomes annulées ou contestées déclenchant une alerte (maximum) | 1 | % | assistant SM-4 | FR-14, FR-139 |
| `IA-P10` | Conservation du **rendu figé** dans le registre | 90 | jours | ASSUMPTION ; conflit C-3 | FR-17 |
| `IA-P11` | Écart d'équité entre sous-groupes, à un instant, avant alerte | 20 | % d'écart relatif | ASSUMPTION ; conflit C-4 | FR-18 |
| `ia.confiance_min` (alias `IA-P12`) | Confiance minimale sous laquelle l'IA dit « je ne sais pas » | 0,5 par capacité | indice 0-1 | ASSUMPTION | FR-16, FR-49, FR-54 |
| `IA-P13` | Conservation des observations de la personne concernée | durée du dossier + 10 | ans | ASSUMPTION | FR-22, FR-181 |
| `IA-P14` | Délai d'arrêt des envois après retrait du consentement « apprentissage commun » | 24 | heures | ASSUMPTION | FR-7, FR-79, FR-168 |
| `IA-P15` | Plafond de durée d'un mandat | 90 | jours | ASSUMPTION | FR-14, FR-135 |

### D.2 Exploitation, niveaux, apprentissage, objectifs et données (§5 à §9)

| code | libellé | défaut | unité | source | FR |
|---|---|---|---|---|---|
| `ia.iso_delai_max_pct` | Allongement maximal du délai d'une organisation causé par la saturation d'une autre | 20 | % | ASSUMPTION | FR-31, FR-178 |
| `ia.delai_reponse_max_s` | Plafond de réponse d'une capacité avant « indisponible » | 10 (langage : 60) | s | ASSUMPTION ; conflit C-2 | FR-40, FR-175, FR-176 |
| `ia.retention_contenu_passerelle_jours` | Conservation du contenu masqué d'un envoi de langage (audit) | 30 | jours | ASSUMPTION | FR-34, FR-180 |
| `ia.retention_contexte_brut_jours` | Conservation du **contexte brut** d'une demande de langage | 7 | jours | ASSUMPTION (aligné sur l'assistant : échéance courte) ; conflit C-3 | FR-38, FR-180 |
| `ia.licence_modele_verifiee` | Licence du modèle ouvert vérifiée avant l'entrée au catalogue | obligatoire | oui/non | REC | FR-35 |
| `palier_ia` (P0, P1, P2) | Paliers d'empreinte : calcul, mémoire, mémoire graphique, disque, latence, débit | à mesurer avant le premier devis | table | ASSUMPTION | FR-41, FR-182 |
| `ia.age_max_source_jours` | Âge au-delà duquel un jeu de référence est « ancien » | 90 | jours | D (assistant, microfinance) | FR-55 |
| `seuil_n2` (alias `ia.seuil.donnees.<capacite>`, `IA-P86`) | Seuil de passage au N2 : volume, durée, gain, **par capacité** | fixé par capacité | exemples ; jours ; points | D6 ; ASSUMPTION | FR-48, FR-91, FR-170 |
| `ia.recalibration_heure` | Heure de la recalibration nocturne | 02:00 | heure locale | ASSUMPTION | FR-59 |
| `ia.recalibration_borne_pct` | Variation maximale d'un paramètre de calibration par nuit | par capacité (défaut 5) | % | ASSUMPTION | FR-59 |
| `ia.recalibration_cpu_max_pct` | Part de calcul maximale en heures ouvrées | 20 | % | ASSUMPTION | FR-59, FR-185 |
| `ia.calibrations_conservees` | Calibrations conservées après remplacement | 3 (et au moins 7 jours) | versions | MOT (7 jours) ; ASSUMPTION | FR-60 |
| `ia.cadence_entrainement_jours_min` | Intervalle minimal entre deux tournées d'entraînement d'une ligne | 7 | jours | D7 | FR-62 |
| `ia.duree_ombre_jours` | Durée de l'ombre | 14 | jours | ASSUMPTION | FR-64 |
| `ia.part_canari_pct` | Part des demandes servie par le canari | 5 | % | REC (1 à 5 %) | FR-64 |
| `ia.interrupteur_date_limite_jours` | Date limite d'un interrupteur de changement | 30 | jours | MOT | FR-66 |
| `ia.retour_arriere_max_min` | Durée maximale d'un retour arrière de modèle | 15 | minutes | MOT | FR-67, FR-186 |
| `ia.retour_arriere_conservation_jours` | Conservation du modèle et de la calibration précédents | 7 | jours | MOT | FR-67 |
| `ia.eval_min_exemples` | Exemples minimaux pour évaluer un challenger | par capacité | exemples | ASSUMPTION | FR-69 |
| `ia.equite_ecart_max_pts` | Dégradation d'équité maximale d'une version par rapport à la précédente (blocage de promotion) | par capacité (défaut 2) | points | ASSUMPTION ; conflit C-4 | FR-70, FR-94 |
| `ia.objectif.equite_regression_max` | **Cible** : dégradation d'équité visée d'une version | 0 | points | ASSUMPTION ; conflit C-4 | FR-92, FR-94 |
| `ia.derive_seuils` | Seuils de dérive et de gravité | par capacité | indice | ASSUMPTION | FR-73 |
| `ia.derive_delai_alerte_h` | Délai d'alerte de dérive | 24 | heures | ASSUMPTION | FR-73, SM-11 |
| `ia.desaccord_horizon` | Horizon(s) de confrontation d'un désaccord | par capacité (crédit : 3, 6, 12) | mois | PO | FR-74 |
| `ia.desaccord_regle` | Règle « qui avait raison » | par capacité (crédit : retard de plus de 30 jours) | règle | PO (PAR 30) ; ASSUMPTION | FR-74 |
| `ia.desaccord_periode_mois` | Période glissante du taux « qui avait raison » | 12 | mois | PO | FR-75 |
| `ia.desaccord_min_cas` | Effectif en dessous duquel le taux est « non significatif » | 30 | cas | ASSUMPTION | FR-75 |
| `ia.copie_registre_validite_jours` | Validité de la copie signée du registre des consentements | 14 | jours | MOT | FR-76 |
| `ia.contribution_purge_jours` | Péremption d'un lot non transmis | 30 | jours | MOT | FR-78 |
| `ia.paquet_poids_max_go` | Poids maximal d'un paquet de modèle | à fixer | Go | ASSUMPTION | FR-83 |
| `ia.cache_consentement_s` | Durée maximale d'un cache de consentement (hébergé) | 60 | s | ASSUMPTION | FR-88 |

### D.3 Catalogue des capacités, Copilot et agents, lecture de pièces, vision (§10 à §13)

| code | libellé | défaut | unité | source | FR |
|---|---|---|---|---|---|
| `ia.objectif.score.calibration_ecart_max` | Écart de calibration maximal d'un score | cible à fixer avec le client | points | D8 | FR-93 |
| `ia.objectif.score.effet_retard_pct` | Baisse visée du retard de paiement du portefeuille noté | cible à fixer | % | D8 | FR-93 |
| `ia.score.peremption_jours` | Âge au-delà duquel un score est « périmé » | 30 | jours | PRD-D FR-184 | FR-93 |
| `ia.ecart.motif_obligatoire` | Motif obligatoire quand l'humain s'écarte d'une décision suggérée (crédit) | dès le 1er écart | écarts | ASSUMPTION | FR-95 |
| `ia.ecart.alerte_audit_nb` | Écarts répétés en 30 jours qui alertent l'auditeur | 5 | écarts | ASSUMPTION | FR-95 |
| `ia.recouvrement.capacite_jour` | Nombre de relances traitables par jour (par équipe) | propre au client | relances | PRD-D FR-120 | FR-97 |
| `ia.objectif.recouvrement.taux_30j_pct` | Taux de recouvrement à 30 jours visé | cible à fixer | % | D8 | FR-96 |
| `ia.lecture.confiance_minimale` | Confiance sous laquelle un champ lu est proposé vide | 0,6 | 0 à 1 | ASSUMPTION | FR-99, FR-142 |
| `ia.objectif.lecture.champs_exacts_pct` | Part de champs exacts visée par type de pièce | cible à fixer par type | % | D8 | FR-99 |
| `ia.alerte.signal_faible_seuil` | Seuil d'alerte des signaux faibles d'un client actif | 0,7 | 0 à 1 | PRD-MF FR-126 | FR-103 |
| `ia.objectif.prevision.erreur_max_pct` | Erreur absolue moyenne maximale d'une prévision | cible à fixer | % | D8 | FR-105 |
| `ia.objectif.par.baisse_pts` | Baisse du PAR visée sur les agences qui suivent les actions | cible à fixer | points | D8 | FR-106 |
| `ia.comparaison.min_missions` | Missions comparables minimales pour une comparaison au portefeuille | 5 | missions | PRD-A FR-65 | FR-110 |
| `ia.combo.max_lignes` | Nombre maximal de combos de stock lent par liste | 6 | combos | PRD-D FR-144 | FR-109 |
| `ia.objectif.resume.fidelite_pct` | Part de phrases de résumé fidèles à leur source (échantillon) | cible à fixer | % | D8 | FR-113 |
| `ia.brief.heure` | Heure du brief du matin | 07:00 | heure | PRD-A FR-208 | FR-116 |
| `ia.objectif.brief.delais_depasses_pct` | Baisse visée des délais dépassés | cible à fixer | % | D8 | FR-116 |
| `ia.terrain.proximite_metres` | Distance de l'alerte de proximité | 200 | mètres | PRD-MF FR-206 | FR-118 |
| `ia.terrain.conservation_jours` | Conservation des positions consenties | 90 | jours glissants | PRD-D FR-102 | FR-119 |
| `ia.segment.effectif_minimal` | Effectif minimal d'un segment ou d'une comparaison | 5 | personnes | spine microfinance (groupes < 5 retirés) | FR-121, FR-123 |
| `ia.package.marge_plancher_pct` | Marge minimale d'un package de vente | marge plancher du logiciel | % | ASSUMPTION | FR-122 |
| `ia.impact.temoin_minimal` | Taille minimale du groupe témoin d'un package | 10 | points de vente | ASSUMPTION | FR-122 |
| `ia.impact.poids_sans_temoin` | Poids d'un rapport sans témoin dans l'apprentissage | 0,3 | 0 à 1 | ASSUMPTION | FR-122 |
| `ia.impact.seuil_succes_pct` | Écart mesuré minimal pour dire qu'un package « marche » | 5 | % | ASSUMPTION | FR-122 |
| `ia.coaching.seuil_points` | Seuil de priorité de coaching | 20 | points | PRD-D FR-125 | FR-123 |
| `ia.secteur.source_ancienne_jours` | Âge d'une source macro jugée « ancienne » | 90 | jours | PRD-MF FR-96 | FR-126 |
| `ia.secteur.saturation_pct` | Part d'un secteur déclenchant l'alerte de saturation | 35 | % | PRD-MF FR-97 | FR-126 |
| `ia.arbitrage.plafond_lot` | Plafond **dur** d'une décision groupée (le défaut d'usage est 25) | 100 | décisions | spine assistant AD-23 | FR-127 |
| `ia.objectif.copilot.temps_reponse_s` | Temps de réponse **visé** du Copilot | cible à fixer | secondes | D8 | FR-139 |
| `ia.pulse.effectif_minimal` | Effectif minimal d'une case publiée par Pulse | `ia.k_min` | entreprises | D9 | FR-152 |

Rappels de paramètres du contrat de la microfinance et du distributeur, tous paramétrables par le client : usure de **24 % par an** et taux d'effort bloquant **40 %** (PRD-MF), seuil de contentieux **40** (PRD-D FR-117).

### D.4 Ajout d'un secteur ou d'un pays (§14)

| code | libellé | défaut | unité | source | FR |
|---|---|---|---|---|---|
| `IA-P80` | Écart toléré d'une promotion sur un secteur non visé (jeu de dossiers figés) | 0 | % de propositions modifiées | ASSUMPTION | FR-167 |
| `IA-P81` | Taille minimale du jeu de dossiers figés par secteur et par capacité | 200 | dossiers | ASSUMPTION | FR-167, FR-174 |
| `IA-P82` | Durée minimale de l'état `ESSAI` (ombre puis canari) d'un secteur avant `ACTIF` | 60 | jours | ASSUMPTION | FR-174 |
| `IA-P83` | Pertinence minimale d'un modèle transverse hérité par un secteur neuf, mesurée sur sa vérité terrain | 0,6 | indice 0-1 | ASSUMPTION | FR-170 |
| `IA-P84` | Horizon par défaut d'une vérité terrain de crédit ou de paiement | 180 | jours | ASSUMPTION, à fixer par pack | FR-164 |
| `ia.catalogue.versions_maintenues` (alias `IA-P85`) | Nombre de versions du catalogue maintenues en parallèle | 3 | versions | ASSUMPTION | FR-169, FR-186 |

### D.5 Exigences transverses (§15, nouveaux paramètres)

| code | libellé | défaut | unité | source | FR |
|---|---|---|---|---|---|
| `ia.perf.n0_p95_ms` | Délai d'une proposition de règle au 95e centile | 300 | ms | ASSUMPTION | FR-175 |
| `ia.perf.n1_p95_ms` | Délai d'une proposition de modèle statistique au 95e centile | 1500 | ms | ASSUMPTION | FR-175 |
| `ia.perf.copilot_premier_s` | Délai du premier élément de réponse du Copilot | 3 | s | ASSUMPTION | FR-176 |
| `ia.perf.copilot_p95_s` | Délai de la réponse complète du Copilot au 95e centile | 20 | s | ASSUMPTION | FR-176 |
| `ia.dispo.cible_pct` | Disponibilité mensuelle du service en ligne | 99,5 | % | ASSUMPTION | FR-177 |
| `ia.dispo.rto_min` | Reprise après panne du service en ligne | 60 | minutes | ASSUMPTION | FR-177 |
| `ia.dispo.rpo_min` | Perte maximale de calibration et d'écarts | 60 | minutes | ASSUMPTION (sauvegarde horaire, FR-87) | FR-177 |
| `ia.cout.quota_mensuel` | Quota d'inférence de langage par organisation | posé au contrat | propositions par mois | ASSUMPTION | FR-183, FR-31, FR-139 |
| `ia.cout.alerte_pct` | Part du quota qui déclenche l'alerte au responsable | 80 | % | ASSUMPTION | FR-183 |
| `ia.obs.retention_jours` | Conservation des métriques agrégées | 395 | jours | ASSUMPTION | FR-184 |

### Conflits résolus

Chaque ligne donne la valeur **gardée**, la valeur **écartée** et la raison. Les cas où les deux valeurs **coexistent** avec des rôles distincts sont marqués « coexistent » : ils sont à vérifier par l'architecture.

| # | Paramètre | Valeur gardée | Valeur écartée | Pourquoi |
|---|---|---|---|---|
| C-1 | `ia.k_min` (effectif minimal) | **5** (alias `IA-P04`), conforme à la spine du moteur (A-10) et au test de FR-77 (« par défaut 5 ») | 20 (W1, « recommandation à fixer en partie 2 ») | W1 renvoyait la valeur à la partie 2 ; la partie 2 la fixe à 5 en reprenant le moteur ; `ia.segment.effectif_minimal` et `ia.comparaison.min_missions` valent aussi 5 mais sont des paramètres **distincts** (un segment, une comparaison) |
| C-2 | Délai de réponse : `IA-P07` (5 s, FR-15) et `ia.delai_reponse_max_s` (10 s, langage 60 s, FR-40) | **coexistent** : 5 s est le délai à partir duquel **l'écran reprend la main** ; 10 s (60 s en langage) est le **plafond** au-delà duquel la capacité rend `INDISPONIBLE` | une seule valeur de 5 s ou de 10 s | deux événements différents (l'écran n'attend pas ; la capacité déclare son indisponibilité) ; `[ASSUMPTION : à confirmer par l'architecture]` |
| C-3 | Conservation du contexte brut : `IA-P10` (90 jours) et `ia.retention_contexte_brut_jours` (7 jours) | **coexistent** : 7 jours pour le **contexte brut** d'une demande de langage (échéance courte, FR-38) ; 90 jours pour le **rendu figé** de la proposition dans le registre (FR-17) | 90 jours pour le contexte brut (formulation de W1) | l'assistant d'août exigeait une échéance courte pour le contexte ; la trace opposable reste 10 ans (`ia.retention_registre_annees`) ; `IA-P10` est donc restreint au rendu figé |
| C-4 | Équité : `IA-P11` (20 % relatif), `ia.equite_ecart_max_pts` (2 points), `ia.objectif.equite_regression_max` (0 point) | **coexistent** : `IA-P11` = écart **entre sous-groupes à un instant** (alerte) ; `ia.equite_ecart_max_pts` = **dégradation d'une version** qui bloque la promotion (borne, FR-70) ; `ia.objectif.equite_regression_max` = **cible** de la fiche (aucune régression visée) | une seule valeur | trois mesures de nature différente ; la **porte de promotion** applique la borne de FR-70 ; la cible de 0 est un objectif rapporté ; `[ASSUMPTION : si le PO veut « aucune régression » comme porte, la borne passe à 0]` |
| C-5 | Taux d'acceptation de façade : `IA-P02`, `ia.acceptation_facade_pct`, `ia.objectif.acceptation_facade_pct` | un seul code `ia.acceptation_facade_pct`, 90 % sur 30 jours | trois codes pour la même valeur | doublon pur |
| C-6 | Seuil de passage au N2 : `seuil_n2`, `ia.seuil.donnees.<capacite>`, `IA-P86` | un seul : `seuil_n2` par capacité | trois noms | doublon pur ; le défaut est « fixé par capacité à l'écriture des fiches » (FR-48) |
| C-7 | Versions du catalogue maintenues : `IA-P85` et `ia.catalogue.versions_maintenues` | un seul code, `ia.catalogue.versions_maintenues` (alias `IA-P85`), 3 | deux noms | doublon pur (introduit par le §15) |
| C-8 | Exécutions autonomes annulées : `IA-P09` et `ia.objectif.agent.annulees_pct` | un seul, `IA-P09` (alias), 1 % | deux noms | doublon pur (assistant SM-4) |
| C-9 | Cadence : `IA-P05` et `ia.cadence_publication_jours_min` ; `ia.cadence_entrainement_jours_min` | `ia.cadence_publication_jours_min` (alias `IA-P05`) = 7 ; l'entraînement a **son propre** paramètre, 7 | — | deux étapes de la chaîne (entraîner, publier), même valeur par défaut |
| C-10 | Conservation du registre : `IA-P06` et `ia.retention_registre_annees` | un seul, `ia.retention_registre_annees` (alias `IA-P06`), 10 ans | deux noms | doublon pur ; point de droit J-IA-06 |
| C-11 | Confiance minimale : `IA-P12` et `ia.confiance_min` ; `ia.lecture.confiance_minimale` (0,6) | `ia.confiance_min` (alias `IA-P12`) = 0,5 par capacité ; la lecture de pièces garde **sa** valeur de 0,6 (champ proposé vide) | — | la lecture de pièces est une capacité qui **fixe sa propre valeur** dans sa fiche |
| C-12 | Âge d'une source : `ia.age_max_source_jours` (jeux de référence) et `ia.secteur.source_ancienne_jours` (source macro) | **coexistent**, 90 jours chacun | — | deux objets ; même défaut |
| C-13 | Plafond d'une décision groupée : `ia.arbitrage.plafond_lot` | plafond **dur** de 100 ; **défaut d'usage 25** (spine assistant AD-23) | — | le défaut est celui du moteur d'automatisation ; le plafond est la borne de FR-127 |
| C-14 | Code d'erreur santé : `DONNEE_SANTE_HORS_INSTANCE` (FR-36) et `SANTE_HORS_INSTANCE` (FR-143) | `SANTE_HORS_INSTANCE` (annexe B) | l'ancien | un seul code ; l'ancien est un alias à retirer |
| C-15 | Code d'erreur de montant : `MONTANT_CORPOREL_INTERDIT` (FR-110, FR-120) | `MONTANT_INTERDIT` (généralisé : FR-20) ; `MONTANT_CORPOREL_INTERDIT` reste le cas assurance | — | la doctrine est généralisée ; le code spécifique reste lisible côté assurance |
