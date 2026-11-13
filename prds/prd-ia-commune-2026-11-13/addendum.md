# Addendum — PRD de l'IA commune

## Partie 1

# Addendum W1 : choix techniques renvoyés hors du PRD

- Contrat de proposition : schéma unique versionné ; immuabilité par chaînage de condensats ; expiration par travail BullMQ idempotent, jamais calculée à la lecture (reprise de l'assistant AD-1).
- Décideur typé HUMAIN | REGLE | MANDAT, aucune valeur SYSTEME (assistant AD-2). Mandat : compteur transactionnel réservé / confirmé / libéré (AD-6).
- Catalogue des types d'action versionné, défaut = engageant et irréversible (AD-4) ; contrôle de mode rejoué à l'exécution (AD-5).
- Registre à deux horloges : base séparée append-only (AD-16) ; trace opposable longue, contexte brut purgé court (IA-P10).
- Hors portée = 404, jamais 403 (AD-20) ; isolation par organisationId du jeton.
- Filtre « montant interdit » : liste blanche par volet appliquée côté serveur ET par écran ; code d'erreur nommé (à fixer en spine).
- Explication d'un score : facteurs issus du modèle décisionnaire lui-même (Shapley ou poids de règle), jamais d'un modèle de substitution ; codes de motifs.
- Équité : tests d'impact disparate avant déploiement, suivi mensuel par sous-groupe ; liste fermée de variables par client.
- Frameworks d'apprentissage fédéré / confidentialité différentielle : hors v1 (recherche : TFF inactif, Flower DP « preview », FLARE plus complet) ; versions figées en spine, pas en PRD.
- Registre de modèles à alias champion / challenger ; retour arrière = déplacement d'alias (recherche MLOps) ; ordre imposé hors ligne, ombre, canari, général, portes écrites avant l'essai.
- Passerelle de langage : masquage par motif et par champ, journal de chaque envoi, zéro rétention contractuelle ; modèle choisi par tâche, version figée par client.
- Le niveau « haut risque » du règlement européen est une référence ; numérotation des points de l'annexe à citer sur le texte officiel (non lu).

## Partie 2

# Addendum — partie W2 (§5 à §9, FR-30 à FR-89)

Choix techniques et pistes. **Ne crée aucune exigence.** L'architecture de l'IA tranche.

1. **Registre des modèles (FR-64, FR-67, FR-69)** : piste MLflow (3.18.0 lu le 2026-11-13), avec **alias** `champion` et `challenger` (les stages sont dépréciés depuis 2.9) ; chargement par `models:/nom@champion` ; retour arrière = déplacement d'alias. À la centrale seulement ; sur l'instance, un registre local minimal (manifeste signé + alias) suffit, sans MLflow.
2. **Ombre et canari (FR-64)** : copie du trafic puis sorties comparées ; coût = double inférence ; portes écrites avant l'essai ; retour arrière répété pendant le canari.
3. **Dérive (FR-73)** : piste Evidently (libre, rapports par segment) ; Alibi Detect pour les données non tabulaires ; ne réentraîner que si la dérive touche la performance ; fausses alertes pendant un canari.
4. **Fédéré et confidentialité différentielle (FR-62)** : écartés du premier jour (avec 5 à 50 institutions, la garantie formelle coûte en utilité). Si repris : NVIDIA FLARE 2.9.0 (le client initie, aucune connexion entrante, cohérent avec le tunnel) ou Flower 1.43.0 (DP « préliminaire ») ; écarter TensorFlow Federated (inactif depuis 2024) ; budget de confidentialité tracé selon NIST SP 800-226.
5. **Modèles de langage (FR-33, FR-35)** : port unique `LlmProvider` sur API standard (`LLM_BASE_URL`, `LLM_MODEL`) ; exécution locale par un serveur d'inférence quantifié (famille llama.cpp ou vLLM selon matériel) ; deux files (interactive, différée) avec tourniquet ; classes 7-8 Md (8 Go) et 27-35 Md (24 Go) en quantification 4 bits comme point de départ ; chiffrer trois scénarios (API, SaaS hébergé, GPU local) avant de promettre le local.
6. **Calibration (FR-59, FR-60)** : fichier versionné à schéma JSON, empreinte SHA-256 de la forme canonique JCS ; sœur écrite dans un répertoire daté ; l'« active » est un pointeur ; calcul incrémental par lots.
7. **Fiche de composition (FR-81)** : champs en piste : identifiant du modèle, empreinte du jeu d'entrée, identifiants de pseudonyme de la centrale par organisation, finalité, rang de registre, plage de dates, version du code, semence, métriques, signataires.
8. **Désaccords (FR-74, FR-75)** : table `desaccord` (capacité, version, niveau, agent, agence, organisation, décision, motif, échéances attendues) ; un job idempotent par échéance lit les faits de réalité ; classement versionné par règle ; agrégats par coupe recalculés chaque nuit ; l'export commercial est un document signé généré par la centrale (ou par l'instance pour un client seul).
9. **Ligne de modèles (FR-63)** : manifeste signé distinct du manifeste de plateforme ; contrat de modèle en N et N-1 ; amendements à porter au moteur : AD-3, AD-7, AD-28, AD-32.
10. **Masquage (FR-34)** : bibliothèque de la plateforme (moteur AD-15, AD-26) ; jetons réversibles côté service ; reconstitution à la réponse.
11. **Garde du registre hébergé (FR-88)** : bibliothèque cliente appelée par chaque interface de lecture ; décision en cache court ; suite de tests commune.
12. **Jeux d'évaluation (FR-69)** : figés par version de capacité, tirés dans le temps pour le N2 ; jeux synthétiques étiquetés par les règles pour le N1 initial (enseignant-élève).

## Partie 3

# Addendum W3 — choix techniques écartés du PRD (§10 à §13)

Notes, pas des exigences.

## §10 Catalogue
- Une capacité = un enregistrement du catalogue (code, version, famille, niveau, entrées, sortie, vocabulaire par logiciel, objectifs, vérité terrain, statut). Le catalogue se publie comme un référentiel versionné ; la clause C11 des manifestes y renvoie.
- Le niveau `REGLE` s'ajoute aux valeurs de C11 pour lever la contradiction X16.
- Les règles N0 sont des stratégies typées à paramètres versionnés (jamais des expressions évaluées) ; le contrat de score porte `parametresVersion`.
- Groupe témoin (FR-122) : appariement par segment, zone, historique de ventes ; tirage fixé par graine pour être rejouable ; mesure en différence de différences ; à écrire dans la spine.
- Vérité terrain : les événements qui la constituent (retard d'échéance, facture payée, fraude confirmée) sont lus des modules détenteurs à l'horizon déclaré et rattachés à la proposition ; le mécanisme est au §7 et dans la spine.

## §11 Copilot et agents
- Le Copilot réutilise le contrat de proposition (origine `LANGAGE`), le RAG ancré sur le corpus légal versionné, la passerelle de modèle de langage et le quota d'inférence du service d'assistant ; il n'a pas de module séparé.
- Sans modèle de langage : recherche par règles (index de libellés et de rôles) et gabarits de réponse.
- Reprendre telles quelles les décisions AD-4 à AD-12 de la spine de l'assistant (catalogue des types d'action, contrôle de mode, mandat, outbox) ; le port passe à :3417.

## §12 Lecture de pièces
- Chaîne : service de documents (rastérisation, Tesseract, texte par page) puis événement puis capacité de lecture (classement et champs par modèle de langage sur le texte, avec règles de repli) puis proposition EXTRACTION.
- Pièces médicales : modèle local seulement, jamais d'envoi à la passerelle ; classification par le registre santé du logiciel d'assurance.

## §13 Feuille de route
- Chaque produit aura son PRD ; cette section ne contient que le lien vers les familles de capacités.

## Partie 4

# Addendum W4 : choix techniques renvoyés hors du PRD

- Format du pack : répertoire de fichiers déclaratifs (JSON ou YAML) validés par schéma versionné, sections `vocabulaire`, `capacites`, `regles-n0`, `objectifs`, `verites-terrain`, `garde-fous`, `pays/*`, `residence`, `heritage` ; signature et empreinte comme les manifestes de modules ; état tenu par le moteur d'installation. Aucun code exécutable de secteur dans le socle.
- Règles N0 : langage de règles déclaratif et sandboxé (pas de script libre) ; explication produite par la règle elle-même. Choix du moteur de règles renvoyé à la spine de l'IA.
- Clé d'isolation `secteur/capacite/version` dans le registre de modèles ; alias champion/challenger par clé, jamais globaux ; calibration N2 indexée par (organisation, secteur, capacité).
- Non-régression : jeux de dossiers figés par secteur dans la chaîne de livraison, rejoués à chaque candidat ; comparaison des sorties canoniques (valeur, confiance, facteurs) ; rapport signé rattaché à la version.
- Catalogue versionné par extensions additives (compatibilité sur IA-P85 versions) ; une famille nouvelle ne modifie pas le schéma des anciennes.
- Résidence : régions d'hébergement par pays pour le SaaS ; en local rien ne change ; règle évaluée à la sortie du canal de données de l'instance (moteur AD-9, AD-44).
- Devise : type monétaire (montant entier en unité mineure + code devise) imposé aux contrats de capacité ; dépend du correctif du contrat de balance (hors de ce PRD).
- Kit public : schémas, documentation, jeux de tests de conformité et exemples synthétiques ; contrôle automatique à la publication (aucun poids de modèle, aucune donnée réelle). Licence et place de marché : décision commerciale hors PRD.
- Transfert N1 : mesure de pertinence par comparaison sortie / vérité terrain sur fenêtre glissante ; recalage de l'échelle du modèle hérité possible, à trancher en spine.

