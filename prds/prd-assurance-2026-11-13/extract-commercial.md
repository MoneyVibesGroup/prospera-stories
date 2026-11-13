# Extraction des engagements commerciaux (chaîne sinistres, compagnie IARD, zone CIMA, Togo)

Sources : (A) Proposition commerciale v2 (.docx, réf. MV-2026-09-016, émise le 15/09/2026, LA RÉFÉRENCE) ; (B) deck GED-Sinistres (.pptx, 12/09) ; (C) Offre v4 « 7 mois » (.md, 19/09) ; pour mémoire : offres v3 et initiale (PDF). La compagnie cliente est désignée « la compagnie ».

---------------------------------------------------------------------
## SOURCE A — Proposition commerciale v2 (15/09/2026) — RÉFÉRENCE
---------------------------------------------------------------------

### A.1 Constat / problème / volumes
- Scénario : un assuré appelle (« Où en est mon dossier ? », « Avez-vous reçu mon document ? », « Quel est le montant prévu ? », « Pourquoi mon dossier n'est-il toujours pas réglé ? »).
- Le collaborateur « cherche dans plusieurs dossiers et applications », « fichiers éparpillés », demande à plusieurs services, appelle un collègue, reconstitue le parcours.
- Conséquences : client « attend, rappelle, finit par douter de la compagnie » ; collaborateur « perd son temps » ; direction « ne voit pas ce qui se passe réellement ».
- Phrase à faire disparaître : « Je vais vérifier et je vous rappelle. »
- VOLUMES : AUCUN volume réel donné (archives, dossiers/an, utilisateurs, sites). Le texte dit qu'avant cadrage « personne ne connaît encore le volume réel d'archives, l'état de l'API ni la complexité de vos circuits ». Chiffres du tableau de bord = illustratifs (214 ouverts, 23 bloqués, 41 sans action depuis 30 j, 9 gestionnaires, 58 pièces attendues, 12 règlements).

### A.2 Modules / fonctions promis
- Recherche unique par nom, n° de police, téléphone, référence sinistre ou n° d'archivage ; « en quelques secondes » (aucun délai mesuré). Ex. : ARC-2026-004512.
- Fiche dossier : client (téléphone masqué), police, n° d'archivage, origine (« repris par API »), sinistre, responsable, statut, documents reçus x/y, pièce manquante, montant proposé, règlement (« non émis : validation requise »), dernière action, historique (« 12 actions tracées »), échanges (relance SMS).
- Parcours en 6 étapes : Déclaration, Pièces, Instruction, Validation, Règlement, Clôture ; « chaque étape tracée : qui, quand, pourquoi ».
- Tableau de bord direction : dossiers ouverts par branche et étape ; bloqués + raison ; sans action depuis 30 j par gestionnaire et étape ; charge et montants par gestionnaire ; pièces attendues + relances par canal ; règlements en attente + valideur attendu.
- Affectation des dossiers, répartition de charge « en un clic », alertes sur dossiers en retard.
- Validation et délégations ; seuils de validation ; paiement à plusieurs mains ; « aucun règlement sans validation, aucun montant payé deux fois ».
- Règlement et recours ; courriers (modèles, quittances) ; relances SMS, e-mail, WhatsApp.
- Contrôle interne : journal avant/après de chaque action ; historique complet « en quelques secondes ».
- Délais du Code CIMA respectés (cités : offre d'indemnité due dans les 12 mois, art. 231 ; prescription 2 ans, art. 28) ; audits et contrôles de la CRCA « préparés sans reconstitution ».
- Droits par profil ; plateforme accessible depuis les postes existants ; tableaux de bord par profil.
- Sept décideurs ciblés (méthode CAB) : DG, DAF, Commercial, Responsable sinistres, Gestionnaires, Contrôle interne, DSI.

### A.3 Usages de l'IA — « quatorze usages » (aucun n'est dit vocal dans la v2 ; tous locaux)
Tous tournent sur le serveur de la compagnie (« IA locale »). Aucun usage vocal/dictée dans le document ; la recherche en langage naturel (n°6) est en français, texte.
1. Déclaration assistée : message WhatsApp, appel ou e-mail -> fiche de déclaration pré-remplie (accueil). (L'« appel » suppose une transcription : non précisé.)
2. Lecture des documents : lit et classe constat, carte grise, devis, factures, PV (accueil, GED).
3. Contrôle des pièces : cohérence (propriétaire carte grise, dates, photo déjà utilisée ailleurs), signalé avant instruction (gestionnaires).
4. Pièces manquantes et relances : identifie le manquant, rédige la relance adaptée au canal SMS/WhatsApp/e-mail, « en un clic ».
5. Résumé sourcé : chaque information renvoie à sa pièce d'origine ; « dossier de 40 pages compris en quelques minutes ».
6. Recherche en langage naturel : « Où en est le dossier de M. Agbéko ? », « Quels dossiers auto sont bloqués ? » (tous).
7. Pré-remplissage de l'instruction : reporte expertise et devis dans le formulaire technique.
8. Analyse des devis : compare au catalogue de pièces, coût de main-d'oeuvre, historique du garage ; surfacturations ligne par ligne (gestionnaires, DAF).
9. « Pourquoi ce montant ? » : explique garantie, vétusté, franchise, plafonds ; décision « défendable devant assuré, auditeur ou juge ».
10. Détection de fraude : relie dossiers (mêmes témoins, garages, photos, téléphones) ; graphe des liens affiché sur le dossier ; avant paiement.
11. Rédaction des courriers : offres d'indemnité, refus motivés, réponses aux réclamations ; relus puis signés par l'agent.
12. Recours : évalue les offres des assureurs adverses, rédige les mises en demeure (service recours).
13. Brief du matin et veille : dossiers à risque, délais qui expirent, anomalies de la nuit (DG, responsable).
14. Qualité et simulations : note de qualité du dossier ; simulation « et si… » d'une décision (direction, contrôle).

GARDE-FOUS annoncés :
- Aucune décision automatique : « L'IA extrait, analyse et recommande. Valider, refuser ou payer reste toujours un acte humain. »
- Dommages corporels : l'IA ne propose JAMAIS de montant sur un préjudice corporel ; reste au gestionnaire et au médecin-conseil.
- Chaque information sourcée (« rien n'est inventé »).
- Registre de l'IA : chaque action journalisée avec niveau de confiance, acceptée ou rejetée par l'agent.
- IA locale : « les données personnelles et médicales ne sortent jamais de la compagnie ».
- Recommandation d'expert : intégrer l'IA dès le départ (apprentissage pendant la reprise des archives : coûts, garages, pièces, schémas de fraude).
- Calibrage sur 3 à 5 ans d'historique ; vérification des résultats par les gestionnaires ; réentraînement mensuel ; rapport mensuel de performance de l'IA. L'IA « ne se met pas à jour seule ».

### A.4 Hébergement, sécurité, confidentialité, sauvegardes, réversibilité
- Hébergement exclusivement dans les locaux de la compagnie, serveur acheté par la compagnie (spécifications remises en S2 ; livré au plus tard S6 ; emplacement sécurisé, onduleur, climatisation).
- Conformité annoncée à la loi togolaise n° 2019-014 (protection des données à caractère personnel).
- « Aucune dépendance à un nuage étranger ». Préparation sur l'environnement MoneyVibes avec échantillon ANONYMISÉ ; données réelles reprises seulement chez la compagnie.
- Sécurisation à l'installation ; droits par profil ; sauvegarde QUOTIDIENNE automatique ; journal d'accès ; contrôle des sauvegardes (maintenance).
- Données médicales : mentionnées uniquement via « IA locale » et l'exclusion du corporel pour l'IA. Aucune exigence détaillée (chiffrement, durées de conservation, secret médical).
- Réversibilité : NON traitée. Remise à la réception : documentation et accès administrateur (levier de sortie implicite). Aucune clause de sortie explicite.
- Disponibilité / SLA hors support : AUCUN chiffre de disponibilité.

### A.5 Reprise des documents existants
- Par API, sans ressaisie ni renumérisation : les documents existent déjà numériques dans le système documentaire actuel ; accès fournis par la DSI.
- 5 étapes : connexion sécurisée ; récupération (métadonnées : client, police, sinistre, date, type de pièce) ; numéro d'archivage CONSERVÉ (à défaut attribué par la plateforme ; critère de recherche direct) ; classement (rattachement client/police/sinistre) ; contrôle (rapport de reprise : récupérés, rejetés + raison, écarts corrigés).
- Ordre : dossiers en cours d'abord ; historique ancien repris en arrière-plan pendant la phase 2 « si le volume l'exige ».
- Import des clients, polices, sinistres ouverts (Excel, CSV ou base du logiciel actuel) ; raccordement SMS et e-mail.
- Prérequis compagnie : doc API + identifiants de test (S3), production (S7) ; règle de numérotation actuelle ; interlocuteur technique (DSI ou éditeur).
- Aucun scan/numérisation de papier promis dans la v2 (tout est supposé déjà numérique).

### A.6 Phasage, calendrier, prix, conditions, formation, support
- Objectif : plateforme complète en 6 mois (24 semaines), 3 phases, 12 étapes, 3 jalons de facturation.
  - Phase 1 (mois 1-2, en service S8) : GED, reprise par API, n° d'archivage, recherche, documents/historique, traçabilité.
  - Phase 2 (mois 3-4 ; traitement S9-S14 ; recette S15-S16) : parcours, affectation, validation/délégations, règlement/recours, contrôle interne, indicateurs.
  - Phase 3 (mois 5-6) : IA locale installée et calibrée (S17-S20), reporting de direction + formation direction/administrateurs (S21-S22), 2 semaines de fonctionnement sous surveillance, réception définitive (S23-S24).
- Étapes clés : lancement sur site sous 10 jours ouvrés ; cadrage S1-S4 (dossier de cadrage, planning détaillé engagé, signé en S4 = engagement contractuel) ; paramétrage + connecteur API sur environnement MoneyVibes S3-S6 ; installation serveur S7 ; reprise S7-S8 ; formation accueil et gestionnaires S8 ; livraison toutes les deux semaines en phase 2 ; recette 10 jours ouvrés (réputée prononcée sans réserve écrite passé ce délai).
- Engagements MoneyVibes : chef de projet dédié, point écrit hebdomadaire, comité de pilotage toutes les 2 semaines, livrable annoncé 1 semaine avant. Engagements compagnie : chef de projet habilité, accès API test S3, serveur S6, validation livrable sous 5 jours ouvrés, référents en recette (S15-S16). Tout retard décale d'autant.
- Prix (FCFA HT) : 25 000 000 forfait clé en main ; maintenance 300 000/mois ; 12 premiers mois offerts (3 600 000), démarrant à la réception définitive ; années 2-3 : 7 200 000 ; total 3 ans 32 200 000. Offre réservée jusqu'au 14/10/2026. Serveur à la charge de la compagnie.
- Échéancier : 30 % commande (7 500 000), 20 % recette phases 1-2 (5 000 000), 50 % réception définitive (12 500 000). Factures payables à 15 jours. TVA togolaise en sus. Recette « sans anomalie bloquante ni majeure ».
- Périmètre forfaitaire ; besoin hors périmètre révélé au cadrage = devis et délai complémentaires.
- Maintenance incluse : correctifs, sécurité, contrôle des sauvegardes, mises à jour barèmes/règles/évolutions CIMA, visite mensuelle sur site, réentraînement IA, rapport mensuel IA, « améliorations demandées par vos équipes incluses ».
- Support : anomalie bloquante prise en charge sous 4 heures ouvrées (seul SLA chiffré).
- Formation : accueil + gestionnaires (S8), responsable de service, direction + administrateurs (S21-S22) ; accompagnement sur site au démarrage ; documentation remise.
- Non chiffré dans la v2 : nombre d'utilisateurs, stockage, sites, volumétrie.

### A.7 Intégration au système existant
- API du système documentaire actuel (source de reprise). Import clients/polices/sinistres ouverts par fichiers (Excel/CSV/base).
- PRIMES et COMPTABILITÉ : non mentionnées (pas d'écriture comptable, pas d'encaissement). Règlement : « de la déclaration au chèque », validation requise ; pas d'intégration banque/paiement mobile décrite.
- Raccordement SMS et e-mail (comptes SMS fournis par la compagnie) ; WhatsApp cité (relances, déclaration).
- Pas de synchronisation continue avec le cœur assurance : import initial uniquement (à confirmer au cadrage).

---------------------------------------------------------------------
## SOURCE B — Deck « Gestion électronique des dossiers sinistres » (12/09, 17 diapositives, sans notes utiles)
---------------------------------------------------------------------

### B.1 Constat / volumes
- « Le traitement reste très majoritairement physique : la recherche est lente, la traçabilité difficile et la réponse au client incertaine. »
- Volume et dispersion : « un très grand nombre de dossiers papier classés par nom ou par police » (AUCUN chiffre).
- Relances sans réponse : le client appelle ou se déplace, il faut aller chercher le dossier.
- Traitement partagé : chaque agent traite un volet ; personne ne voit ce qui a été fait ni ce qui bloque.
- Pièces dispersées : certificats médicaux, prescriptions, tickets de caisse, rapport de police circulent séparément.
- Règlements non rapprochés : quittances, chèques et T-Money suivis en comptabilité, sans état consolidé côté sinistres.
- Qualité non mesurable : délais estimés, faute d'horodatage des étapes.
- Ce constat décrit le papier (contraste net avec la v2 : « documents déjà numériques »). Pas de nb d'utilisateurs, sites, dossiers/an.

### B.2 Modules promis (9) et chiffres
1. GED et numérisation : scan par lots avec indexation guidée ; classement au nom de la victime / n° police / n° sinistre ; OCR ; contrôle qualité avant archivage définitif ; reprise du STOCK PAPIER.
2. Recherche instantanée : n° dossier, nom, police, immatriculation, date ; « résultats en moins d'une seconde » ; tolérance aux fautes de saisie ; aperçu du statut sans ouvrir le dossier.
3. Cycle de vie : déclaration, ouverture, pièces, étude, barème, règlement, clôture ; blocage tant que les pièces obligatoires manquent ; relance automatique ; orientation vers le pôle recours.
4. Affectation et rôles : volets corporel / matériel / risques divers ; pôle recours ; corbeille personnelle et de service ; droits d'accès et de validation par profil.
5. Traçabilité : journal horodaté (qui, quoi, quand, quelle pièce) ; historique des règlements (déjà payé / reste à payer) ; conservation des versions ; piste d'audit.
6. Pièces et justificatifs : téléversement depuis poste, scanner ou téléphone ; liste des pièces attendues affichée en permanence.
7. Règlements et comptabilité : barème paramétrable, solde restant dû ; quittances rattachées au dossier ; n° de chèque, bénéficiaire, date de remise ; rapprochement y compris T-Money ; validation hiérarchique ; état mensuel consolidé (chèques émis/remis/en attente, détection d'écarts avant clôture, export au format de la comptabilité).
8. Indicateurs : délai moyen d'ouverture, d'étude et de règlement ; taux dans le délai cible ; charge par gestionnaire et par volet ; export tableur.
9. Assistant conversationnel FR/EN, « 24h/24 » : questions paramétrées par type de sinistre, aide à la déclaration, téléversement de pièces depuis la conversation, état d'avancement, transfert à un gestionnaire humain.
- Parcours en 8 étapes : déclaration (n° sinistre immédiat, alerte urgence corporelle, guichet/téléphone/chatbot) ; ouverture (complétude, courrier de pièces, relance) ; affectation ; instruction (frais médicaux, rapport de police, « assuré fautif -> prise en charge ») ; évaluation barème + validation hiérarchique ; recours (transfert avec historique, suivi des délais) ; règlement et remise du chèque (quittance, n° chèque, liste d'appels du matin, accusé de réception, SMS en complément, relance si non retiré) ; clôture et archivage (réouverture tracée).
- Courriers sortants : modèles pré-remplis (demande de pièces, offre d'indemnisation, refus), copie archivée automatiquement, impression groupée.
- Mesures promises « dès le premier trimestre » : < 5 s pour retrouver n'importe quel dossier ; 100 % des actions horodatées et attribuées ; 0 dossier perdu ou introuvable à la relance ; état des quittances/chèques J+1 « disponible en continu » (incohérence interne : J+1 vs continu) ; charge de chaque gestionnaire et retards « en temps réel ».
- Langues : français / English (deck et assistant).

### B.3 IA
- Un seul usage d'IA nommé : l'assistant conversationnel (module 9, FR/EN, 24h/24, accessible sur téléphone avec photo des pièces), qui guide la déclaration et liste les pièces ; transfert à un humain.
- OCR (module 1) : lecture automatique du texte, non qualifiée d'IA.
- Pas de vocal. Pas d'indication local / hors site (hébergement non précisé). Garde-fous : seulement « transfert à un gestionnaire humain dès que nécessaire » et questions paramétrées par la compagnie. Aucun des 14 usages de la v2 (résumé, fraude, devis, etc.) n'apparaît.

### B.4 Hébergement, sécurité, sauvegardes
- « Plateforme web accessible depuis vos postes existants » ; « sauvegarde quotidienne et journal d'accès » ; droits d'accès par profil.
- Hébergement NON précisé (ni local ni cloud). Confidentialité des données médicales : aucune mention (alors que certificats médicaux et frais médicaux sont traités). Réversibilité : rien.

### B.5 Reprise de l'existant
- Par SCAN : numérisation du stock papier PRIORITAIRE (S7-S8), « reprise assistée des dossiers papier prioritaires » ; la compagnie fournit 1 à 2 scanners ; validation du périmètre prioritaire par la compagnie.
- Pas d'API de reprise, pas de numéro d'archivage conservé ; classement au nom de la victime / n° police / n° sinistre ; identifiants de dossiers du type SIN-2026-0418.

### B.6 Phasage, calendrier, prix, conditions
- Mise en service « début janvier » ; développement 8 semaines. Quatre blocs de 2 semaines : S1-2 cadrage et socle GED/recherche ; S3-4 cycle de vie, affectation, pièces/relances, journal ; S5-6 règlements, rapprochement, courriers, tableaux de bord ; S7-8 numérisation du stock prioritaire, assistant FR/EN, formation, mise en service. Livraison « par blocs utilisables » validés au fil de l'eau.
- Engagement MoneyVibes : accompagnement pendant le PREMIER MOIS d'exploitation ; formation des gestionnaires et du responsable. Compagnie : référent métier chaque semaine, barème en vigueur, modèles de courriers et quittances, liste des utilisateurs et volets, scanners, validation du périmètre.
- PRIX : aucun prix dans le deck. Pas de maintenance, licence ni échéancier.

### B.7 Intégration
- Comptabilité : « La plateforme ne remplace pas la comptabilité : elle lui fournit un état fiable » ; export au format comptable ; rapprochement chèques et T-Money. Pas d'intégration polices/primes décrite (police = simple champ de recherche). SMS de notification. Pas de mention de l'API ni du cœur assurance.

---------------------------------------------------------------------
## SOURCE C — Offre v4 « 7 mois » (19/09, brouillon interne « à mettre en forme avant envoi »)
---------------------------------------------------------------------
Statut : document de travail, n° PA-2026-XX-XXX, destinataire en blanc ; NON la référence (la v2 du 15/09 lui est antérieure de 4 jours mais est désignée référence par le commanditaire). Contient en pied une « alerte marge » interne (à ne pas reprendre en exigence).

### C.1 Constat / volumes
- Reprend le constat de la v2 (dossiers PHYSIQUES + fichiers éparpillés ; client attend, doute ; direction aveugle). Aucun volume : « volumétrie à définir au cadrage », « volumes d'archives » vus en cadrage. Pas de nb d'utilisateurs, sites.

### C.2 Modules / fonctions
- Recherche par nom, n° de police, téléphone, référence sinistre (pas d'« n° d'archivage » cité dans le texte : la reprise est par export, pas par API) ; fiche : client, police, sinistre, responsable, pièces reçues/manquantes, montant proposé, historique, dernière action, prochaine étape.
- Tableau de bord direction « en temps réel » ; seuils de validation, chaîne de paiement à plusieurs mains, contrôle des doublons ; parcours, affectation, délais et alertes ; journal avant/après, auteur, date, motif ; droits par profil ; sauvegardes ; GED et NUMÉRISATION RÉELLE ; circuit, affectation, validations, règlements, recours, indicateurs.
- Aucun chiffre de délai de recherche, de disponibilité ou d'utilisateurs.

### C.3 IA — scindée en deux temps (différence majeure avec la v2)
- Phase 2 (mois 4-5) : OCR (lecture automatique) + assistance à l'analyse (détection d'anomalies, cohérence, SCORING de fraude) = « moteur de règles explicable, pas une boîte noire ». Opérationnel dès la recette.
- Point d'étape IA (mois 5-6, non contractuel) : démo de l'assistant et du résumé en cours de calibrage.
- Phase 3 (mois 6-7) : IA locale calibrée sur l'historique : résumé automatique, assistant en langage naturel, recherche sémantique ; livrée à la Finalisation, pas à la recette.
- Équipe : 1 ingénieur IA/OCR dédié dès le mois 1 ; VPS IA évoqué dans la note de marge. Locale : « IA locale », serveur applicatif capable d'héberger « à terme le calcul de l'IA locale ».
- Les 14 usages de la v2 ne sont pas listés (sauf OCR, anomalies/cohérence/fraude, résumé, langage naturel, recherche sémantique). Pas de vocal. Garde-fous v4 : explicabilité du moteur de règles ; le reste (« l'IA recommande, l'agent décide », exclusion du corporel, registre) N'EST PAS repris.

### C.4 Hébergement, sécurité, confidentialité, sauvegardes
- Hébergement exclusivement dans les locaux ; loi togolaise n° 2019-014 ; « aucune dépendance à un cloud étranger » ; sauvegardes automatiques, contrôle des sauvegardes ; droits par profil ; serveur applicatif + NAS distincts (un NAS seul ne suffit pas) ; réseau, internet, comptes SMS et WhatsApp Business « si retenus ». Données médicales non mentionnées en v4 (présentes en v3/v1). Réversibilité : rien.

### C.5 Reprise
- Reprise des clients, polices, sinistres ouverts depuis l'EXPORT du système actuel (Excel, CSV ou export natif) ; GED et numérisation réelle : dossiers en cours d'abord, puis archives historiques retenues ; état de numérisation signé ; inventaire des archives ; historique 3 à 5 ans pour l'IA ; rapport de reprise avec écarts corrigés. PAS d'API de reprise documentaire, PAS de n° d'archivage conservé.

### C.6 Phasage, prix, conditions
- 7 mois, 13 étapes : P1 Fondations (mois 1-3,5) ; P2 Intelligence documentaire (mois 4-5) = JALON RECETTE ; point d'étape IA (mois 5-6) ; P3 Intelligence conversationnelle et mise en service (mois 6-7) = JALON FINALISATION.
- Phase 1 « sans recette formelle isolée » et SANS mise en service précoce chiffrée (étape 07 « mise en service de la phase 1 » existe sans date).
- Prix : 35 000 000 FCFA HT ; échéancier 30 % (10 500 000) / 30 % (10 500 000) / 40 % (14 000 000) ; recette : 2 SEMAINES pour recetter, réputée prononcée sans réserve.
- Maintenance 2 500 000 FCFA HT/mois ; 12 premiers mois offerts ; années 2 et 3 : 30 000 000 chacune ; total 3 ans 95 000 000. Support : anomalie bloquante sous 4 h ouvrées. Visite mensuelle, rapport, réentraînement IA, mises à jour barèmes/CIMA, correctifs. Mention « 30 000 000 d'économie ».
- Paiement à 15 jours ; TVA en sus ; serveur et NAS à la charge de la compagnie. Validité à définir (~4 semaines).
- Équipe annoncée : 9 profils à temps plein (1 chef de projet, 1 architecte, 4 dév. back-end dont 1 recours/moteur de circuit, 2 front, 1 ingénieur données, 1 IA/OCR, 1 DevOps) : note : 1+1+4+2+1+1+1 = 11, pas 9 (incohérence interne).
- Formation : agents (étape 07), direction au reporting (étape 13). Lancement sur site sous 10 jours ouvrés, comité de pilotage.
- Prérequis compagnie : chef de projet interne, référent par service (accueil, sinistres, recours, finances, contrôle interne, informatique), liste utilisateurs, délégations et seuils, procédures, CG/CP par garantie, barèmes, franchises, vétusté, modèles de courriers/quittances, experts et partenaires agréés.

### C.7 Intégration au système existant — NOUVEAU
- Clause de dépendance externe : la compagnie déploie, en parallèle, un NOUVEAU LOGICIEL MÉTIER avec lequel la plateforme doit dialoguer par API ; intégration « incluse dans le périmètre » mais en MEILLEUR EFFORT, dans la fenêtre de la phase 3, une fois l'API stabilisée et accessible en test ; si elle glisse au-delà, raccordement par avenant sans remettre en cause la réception. La spécification de cette API « n'est pas arrêtée ».
- Polices/primes/comptabilité : polices et sinistres importés ; la comptabilité n'est pas citée (« DAF » via contrôle des doublons et paiement à plusieurs mains). Pas de T-Money.

---------------------------------------------------------------------
## POUR MÉMOIRE — Offres PDF v3 (PA-2026-09-015) et initiale (PA-2026-09-014, 14/09)
---------------------------------------------------------------------
Ce qui diffère de la v4 / de la v2 :
- Prix et rythme : DEUX options, accélérée 4 mois (80 000 000, 40/30/30 = 32 M / 24 M / 24 M, fin janvier 2027, commande requise début octobre, équipe renforcée, numérisation doublée) et standard 6 mois (55 000 000, 22 M / 16,5 M / 16,5 M, fin mars 2027). Maintenance 2 500 000/mois, 12 mois offerts (30 000 000), total 3 ans 140 M (acc.) / 115 M (std). Validité 14/10/2026 (v3 et initiale). Recette : 10 jours ouvrés. Support : 4 h ouvrées.
- v3 : phase 1 en service mi-novembre (acc.) ou fin novembre (std) ; calendrier pour commande au 01/10/2026 ; 11 étapes ; IA locale annoncée en phase 3 « jusqu'à janvier 2027 » avec liste de 8 fonctions (lecture, extraction, résumé, pièces manquantes, réponses clients, anomalies/fraude, assistance gestionnaire, langage naturel) + « l'IA recommande, l'agent décide » ; données médicales « ne sortent jamais de la compagnie » ; numérisation des archives papier (inventaire, années prioritaires, accès au local) ; WhatsApp Business ; « cas de fraude avérés connus » demandés. Pas d'API de reprise.
- Initiale (14/09) : argumentaire plus complet que v3 : 10 profils métier (accueil, gestionnaires, recours, responsable, direction, comptable, contrôle interne, GED, ...) avec droits par action ; chaîne ordre-chèque-remise à 3 personnes différentes ; seuil de délégation 2 000 000 FCFA (au-delà : validation direction) ; formulaires d'instruction par garantie (auto avec vétusté/franchise, incendie, dégâts des eaux, vol, transport, RC) ; recours (mise en demeure à l'encaissement, négociation, contentieux, alertes de prescription) ; vue Kanban avec badges de délai ; durées de conservation paramétrées ; motif obligatoire pour décisions sensibles ; art. 231 : offre sous 12 mois (8 mois en cas de décès) ; art. 28 : prescription 2 ans ; « 100 % local, IA et données hébergées chez vous, à Lomé » ; IA : synthèse sourcée, analyse des devis, graphe des liens suspects, brief du matin, langage naturel, registre de toutes ses actions, jamais sur dommage corporel ; installation de l'IA « hors ligne » ; calibrage (coûts par garage/type de dommage, pièces, schémas de fraude) ; formation par profil sur site avec attestations et référents internes, présence de l'équipe les premiers jours ; cahier de recette fourni, anomalies classées bloquante/majeure/mineure ; mentions de « licence » dans le périmètre. Aucune API de reprise (numérisation des archives papier). Le seuil de 2 000 000 FCFA et les 10 profils sont les seuls engagements de la chaîne de validation chiffrés : absents de la v2/v4.

---------------------------------------------------------------------
## CONTRADICTIONS ENTRE SOURCES
---------------------------------------------------------------------

| Sujet | v2 (15/09, référence) | pptx (12/09) | v4 (19/09, brouillon) |
|---|---|---|---|
| Nature de l'existant | Documents DÉJÀ numériques dans un système documentaire actuel | Dossiers PAPIER en masse | Dossiers physiques + fichiers éparpillés |
| Reprise des documents | Par API, sans ressaisie ni renumérisation | Par scan/OCR du stock prioritaire, 1-2 scanners | Export (Excel/CSV) + numérisation réelle des archives ; NAS |
| N° d'archivage | Conservé, critère de recherche (à défaut attribué) | Absent (n° SIN-xxxx auto) | Absent |
| Délai de recherche | « quelques secondes » (non chiffré) | < 1 s (module) ; < 5 s (résultats) | « quelques secondes » / « instantanément » |
| Durée projet | 6 mois (24 semaines), phase 1 en service S8 | 8 semaines, mise en service début janvier | 7 mois, phase 1 sans date de mise en service précoce |
| Prix projet | 25 000 000 FCFA HT | aucun | 35 000 000 FCFA HT |
| Échéancier | 30 / 20 / 50 % | aucun | 30 / 30 / 40 % |
| Maintenance | 300 000/mois, 12 mois offerts (3,6 M) ; 3 ans = 32,2 M | aucune | 2 500 000/mois, 12 mois offerts (30 M) ; 3 ans = 95 M |
| Recette | 10 jours ouvrés, phases 1-2 ; fin mois 4 (S15-16) | aucune | 2 semaines ; mois 4-5 |
| Quand arrive l'IA | Phase 3 mois 5-6 (S17-S22), calibrage S17-S20 | assistant conversationnel livré S7-S8 | OCR + règles dès la recette (mois 4-5) ; conversationnel/résumé à la finalisation (mois 6-7) |
| Nature de l'IA | 14 usages, IA locale, recommandations | 1 assistant chatbot FR/EN (déclaration, pièces) | Moteur de règles explicable (scoring fraude) + IA locale calibrée |
| IA : garde-fous | Aucune décision auto, pas de corporel, sources, registre, local | transfert à un humain seulement | explicabilité ; pas de corporel/registre/sources cités |
| Assistant côté assuré (chatbot, FR/EN, 24h/24) | Absent (WhatsApp cité en entrée pour la déclaration) | Module 9, central | Absent (« assistant en langage naturel » = interne) |
| Langues | Français | Français / English | Français |
| Hébergement | Chez la compagnie, serveur acheté par elle | Non précisé | Chez la compagnie : serveur applicatif + NAS |
| Comptabilité | Non citée | Module 7 : quittances, chèques, rapprochement T-Money, export comptable | Non citée |
| Système métier | API du système documentaire ; import fichiers | Aucune | Futur logiciel métier via API, meilleur effort, avenant si retard |
| Support | 4 h ouvrées anomalie bloquante | 1er mois d'accompagnement | 4 h ouvrées |
| Formation | accueil + gestionnaires (S8), direction + administrateurs (S21-22) | gestionnaires + responsable (S7-8) | agents (étape 07), direction (étape 13) |
| Équipe | non décrite | non décrite | 9 profils annoncés (somme réelle 11) |
| Cadrage | S1-S4, planning engagé signé en S4 | cadrage S1-S2 | dossier de cadrage, délai contractuel dès remise des prérequis |
| Offre réservée | jusqu'au 14/10/2026 (12 mois maintenance offerts) | n/a | validité à définir |

Autres incohérences internes : pptx « J+1 » vs « disponible en continu » ; pptx « français / English » partout mais v2/v4 non ; v4 équipe 9 vs 11 ; v2 « Responsable : gestionnaire matériel ».

---------------------------------------------------------------------
## ENGAGEMENTS CHIFFRÉS À REPRENDRE EN EXIGENCES (base = v2, signalant les écarts)
---------------------------------------------------------------------
Cibles de performance et de volume :
- Recherche d'un dossier « en quelques secondes » (v2) ; cible pptx < 1 s (module) et < 5 s « n'importe quel dossier ». Retenir le plus exigeant (< 5 s mesuré sur toute la base) et préciser la volumétrie au cadrage (inconnue).
- Résumé IA d'un dossier de 40 pages « en quelques minutes » (v2).
- 100 % des actions horodatées et attribuées à un utilisateur identifié ; 0 dossier introuvable à la relance (pptx).
- Aucun règlement sans validation, aucun montant payé deux fois (v2 ; contrôle des doublons v4) ; paiement à plusieurs mains ; seuil de délégation 2 000 000 FCFA et 10 profils (offre initiale).
- Journal avant/après de chaque action (v2) ; motif obligatoire des décisions sensibles (initiale) ; conservation des versions (pptx).
- Tableau de bord : dossiers ouverts par branche/étape, bloqués + raison, sans action depuis 30 jours, charge par gestionnaire, pièces attendues, règlements en attente (v2) ; délais moyens d'ouverture, d'étude, de règlement et taux dans le délai cible (pptx).
- Délais CIMA : offre d'indemnité sous 12 mois (art. 231 ; 8 mois si décès, initiale), prescription 2 ans (art. 28) ; alertes de délais et de prescription.
- IA : 14 usages ; aucune décision automatique ; JAMAIS de montant sur dommage corporel (médecin-conseil) ; toute information sourcée ; registre de chaque action IA avec niveau de confiance et acceptation/rejet ; IA locale, données médicales jamais hors de la compagnie ; calibrage sur 3 à 5 ans d'historique ; réentraînement mensuel ; rapport mensuel de performance IA.
- Reprise : par API, n° d'archivage conservé (sinon attribué), rapport de reprise (récupérés, rejetés + raison, écarts) ; dossiers en cours d'abord ; historique en arrière-plan en phase 2 ; trancher avec la compagnie : API ou scan (sources contradictoires).
- Sauvegarde QUOTIDIENNE ; journal d'accès ; données exclusivement dans les locaux ; conformité loi n° 2019-014 ; droits par profil.
- Support : anomalie bloquante prise en charge sous 4 heures ouvrées ; visite mensuelle sur site ; mises à jour barèmes et évolutions CIMA incluses.
- Calendrier v2 : S4 cadrage signé ; S3 accès API test ; S6 serveur livré ; S7 installation ; S8 phase 1 en service ; S9-S14 phase 2 (livraison toutes les 2 semaines) ; S15-S16 recette (10 jours ouvrés) ; S17-S20 IA locale ; S21-S22 reporting et formation direction ; S23-S24 réception ; lancement sur site sous 10 jours ouvrés ; validation des livrables sous 5 jours ouvrés ; comité de pilotage tous les 15 jours.
- Prix v2 : 25 000 000 HT ; 30/20/50 % ; maintenance 300 000/mois (12 premiers mois offerts) ; paiement à 15 jours.
- Aucun engagement chiffré dans les sources sur : disponibilité (%), RPO/RTO, nombre d'utilisateurs, stockage, nombre de sites, rétention des sauvegardes, réversibilité : à créer comme exigences à valider (non issues des sources).
- Si le pptx est retenu : assistant FR/EN 24h/24 côté assuré, rapprochement T-Money, export comptable, état mensuel consolidé, liste d'appels du matin, SMS : ces engagements ne figurent ni en v2 ni en v4.
