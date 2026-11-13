# Réconciliation du PRD Assurance avec ses entrées (PO, D1-D21, proposition v2, deck)

Entrées : `brain-dump-po-2026-11-13.md` (fait foi), `.memlog.md`, `plan-redaction.md` (D1-D21), `extract-commercial.md` (A.1-A.7 = proposition v2 ; B.2 = deck). PRD lu : `prd.md` (FR-1 à FR-264, §9 à §13, annexes). Lecture seule ; ce fichier est la seule sortie.

Légende : COUVERT (FR précise qui porte l'exigence) · PARTIEL (couvert mais affaibli, incomplet ou sans test) · CONTREDIT (le PRD dit l'inverse ; « voulu » = écart assumé mais non dit au lecteur) · OMIS (aucune trace).

## 1. Décisions du PO (brain-dump + .memlog)

| Source | Élément | Statut | FR | Correction proposée |
|---|---|---|---|---|
| PO §1 | Client IARD CIMA Togo, pré-contrat, février 2027, jamais nommé | COUVERT | §0, P-1 | — (aucun nom de compagnie trouvé dans le PRD) |
| PO §1 | 14 gestionnaires = chiffre de démo | COUVERT | FR-15, §2.1 | — |
| PO §1 | Hébergement chez la compagnie (serveur applicatif + NAS) | COUVERT | FR-234, FR-257 | — |
| PO §1 | IA commune en instance locale ; seuls des écarts anonymisés remontent par tunnel ; aucune donnée médicale ne sort | COUVERT | FR-12, FR-232 | — |
| PO §1 | Prospera à côté du logiciel de la compagnie, ne le remplace pas | COUVERT | §0, FR-2, FR-194 | — |
| PO §1 | « On ne spécule pas » sur le logiciel de la compagnie (libre en janvier) | PARTIEL | FR-194, annexe C ; UJ-2 | UJ-2 écrit « le lendemain matin, il renvoie le numéro » : c'est un comportement supposé du LC ; écrire « après un délai variable selon le LC (FR-198) » |
| PO §1 | Numéro de sinistre détenu par le LC « pour un début » | COUVERT | FR-37, FR-198 | — |
| PO §1 | Premier jour : consulter ET déclarer | COUVERT | FR-34, §10.1 | — |
| PO §1 | Premier jour : tout le circuit jusqu'au chèque, avec l'IA, sauf la voix | COUVERT | §0, FR-10, §10.1 | — |
| PO §1 | Reprise des archives par API ou Excel/JSON | COUVERT | FR-214 | FR-214 dit « Excel ou JSON », le §12.2 A-3 et la v2 disent aussi CSV : harmoniser |
| PO §1 | Mode d'écriture rapide | COUVERT | P-7 (méta) | — |
| PO §2 | Vraie démo devant la compagnie : « il manque des éléments, mais débuter dessus » ; séance d'immersion à suivre | COUVERT | §0, P-8, §13.1 | — |
| PO §2 | Démo `9002` jouée seul par le PO (robot Playwright) ; questions de `99-retour-personnel` imaginées | COUVERT | §0 (Sources) | — |
| PO §2 | Ce que dit la compagnie est connu de seconde main par trois documents | COUVERT | §0 | — |
| PO §3 | 8 phases, 11 statuts, 4 sorties, recours parallèle | COUVERT | FR-30, FR-31, FR-32, FR-134 | — |
| PO §3 | Règle : celui qui décide ne paie pas | COUVERT | FR-7, FR-81 | — |
| PO §3 | Règle : chaque refus/classement porte un motif | COUVERT | FR-33, FR-121, FR-123 | — |
| PO §3 | Règle : chaque action horodatée | COUVERT | FR-13, FR-33, FR-138 | — |
| PO §3 | Règle : évaluation arrêtée jamais recalculée si le barème change | COUVERT | FR-75 | — |
| PO §3 | Paiement : la comptabilité émet, le guichet remet contre quittance signée + pièce d'identité | COUVERT | FR-93, FR-96, FR-97 | — |
| PO §3 | Clôture : solde à zéro, motif écrit, versement aux archives | COUVERT | FR-104, FR-105, FR-168 | — |
| PO §3 | Déclarer : n° attribué tout de suite, doublon vérifié | PARTIEL | FR-36, FR-38 | Le PO écrit « n° attribué tout de suite » ; le PRD donne une référence `DEC-` immédiate et le numéro officiel plus tard. Choix cohérent avec « le LC détient le numéro », mais à dire explicitement comme écart au récit (§0 ou FR-36) |
| PO §3 | Ouvrir : accusé de réception ; courtier et coassureurs informés | COUVERT | FR-48 | — |
| PO §3 | Attribuer : le responsable désigne qui instruit | COUVERT | FR-50, FR-51 | — |
| PO §3 | Instruire : pièces, responsabilité, missions d'expertise ou accord sur devis | COUVERT | FR-52 à FR-59 | — |
| PO §3 | Chiffrer : barème, vétusté, franchise, plafond | COUVERT | FR-69 à FR-73 | — |
| PO §3 | Décider : validation selon les délégations, puis offre ; au corporel procès-verbal de transaction | COUVERT | FR-77 à FR-89 | — |
| PO §3 | Sorties REJETE, SANS_SUITE, LITIGE (offre refusée, contre-expertise), FRAUDE_SUSPECTEE | COUVERT | FR-121 à FR-126 | — |
| PO §4 | Offre + accord de l'assuré = une étape ; offre sous 48 h ; paiement préparé après accord ; refus = contre-expertise | COUVERT | FR-84, FR-86, FR-88, FR-90 | — |
| PO §4 | Recours = suivi parallèle : mise en cause dès l'ouverture, relance 15 j, remboursement après paiement de l'assuré | COUVERT | FR-108 à FR-111 | — |
| PO §4 | Validation à plusieurs niveaux : « validation à trois » sous 1 M FCFA, comité de quatre au-delà, visa du directeur opérationnel, DG seul pour le commercial | PARTIEL | FR-78, FR-79 | Le défaut du PRD est « le responsable seul » sous 1 M ; le récit du PO décrit une validation à trois. Soit remettre 3 signataires au niveau 1 par défaut, soit écrire dans l'[ASSUMPTION] que l'on s'écarte du récit et pourquoi |
| PO §4 | Voie « accord sur devis » sans expert (≤ 300 000 / ≤ 200 000) | COUVERT | FR-59 | — |
| PO §4 | La SPEC est en retard sur le code ; le code fait foi | COUVERT | §0, P-10, FR-134 | — |
| PO §5 | Retrouver un dossier en moins de 5 s par nom, police, n° sinistre, immatriculation, n° archivage | COUVERT | FR-150, FR-250 | — |
| PO §5 | Répondre au client depuis la fiche (étape, pièces, évalué, payé, reste, dernière action) | COUVERT | FR-152 | — |
| PO §5 | Joindre une pièce au bon dossier, scannée ou téléversée, avec contrôle avant archivage | COUVERT | FR-159, FR-165 | — |
| PO §5 | Tracer chaque consultation et chaque ajout au nom de l'agent | COUVERT | FR-13, FR-158, FR-255 | — |
| PO §5 | Droits par profil (accueil, gestionnaires par volet, responsable, numérisation, contrôle interne, admin) | COUVERT | FR-6, annexe B | — |
| PO §5 | Resynchroniser régulièrement avec rapport de reprise (récupérés, rejetés, écarts) | COUVERT | FR-216, FR-217 | — |
| PO §5 | « Analyse toi-même et complète… un vrai processus qui peut évoluer après, mais d'abord présent, intégré, testé » | PARTIEL | §0, FR-4, FR-264 ; §10.2 | §10.2 fige les 11 statuts et 41 transitions au premier jour : l'évolution se fait par paramètres seulement. Écrire comment la compagnie fera évoluer un statut après la séance d'immersion (procédure d'amendement) |
| PO §6 | Mémoire 2014 chap. V : validation 48 h, rapport d'expert 7-10 j, paiement 72 h, relance recours 15 j, chemises de couleur | COUVERT | FR-84, FR-68, FR-102, FR-110, FR-170 | Le défaut « rapport 7 j » (matériel) ne reprend que le bas de la fourchette 7-10 j : le dire |
| PO §6 | Mémoire chap. VI : déclarations enregistrées 3-4 j après réception ; accusés jamais envoyés ; offres hors délai ; provisions non mises à jour | COUVERT | FR-34 (deux dates), FR-48, FR-84, FR-76 ; §9 | — (bon traitement : chaque défaut a une FR et un indicateur) |
| PO §6 | Limite : Sénégal 2014, à confirmer pour le Togo | COUVERT | §0, FR-4, risques §12.3 | — |
| PO §6 | Lire `workflow.ts`, `rejeu-2/README`, doc « Espace expert » | COUVERT | P-13, FR-180 | — |
| PO §6 | Pièces secondaires (FGA, convention d'expertise, constat, tableau médico-légal) = modèles/jeux de test | COUVERT | §0, FR-111, FR-119 | — |
| PO §6 | Liste « à demander à la compagnie » dans l'ordre du PO | COUVERT | §12.2 A-1 à A-8, FR-219 | — |
| PO §6 | Texte de référence : Code CIMA livre II | COUVERT | FR-14, FR-70, FR-85 | — |
| memlog | 14 usages au premier jour, phasage S8/S16/S24 non retenu | COUVERT | FR-10, §10.1, P-3 | — |
| memlog | Scan du stock papier non retenu ; papier tenu en parallèle | COUVERT | FR-21, FR-172, FR-215, §10.2 | — |
| memlog | Contrat d'entrée générique sans connecteur nommé | COUVERT | FR-197, annexe C, FR-245 | — |
| memlog | FR-214 : API au premier jour vs PRD Reprise (fichiers seuls en février) : amendement à demander | COUVERT | A-10 | — |
| memlog | Arbitrages d'assemblage (transition 42, honoraires hors machine, commercial = DG + accord, acompte en litige, AUD avis, remise par ACC, offre 48 h ouvrées, paiement 72 h après dénonciation corporel) | COUVERT | FR-86, FR-88, FR-91, FR-97, FR-102, FR-129 | — |
| memlog | Correction D15 : ordre dommage → vétusté → règle proportionnelle → plafond → franchise | COUVERT | FR-69 | Le plan-redaction.md reste faux sur ce point (D15 mentionne encore l'ancien ordre dans sa formulation) : aligner si le plan est conservé |

## 2. Décisions de cadrage D1 à D21

| Source | Élément | Statut | FR | Correction proposée |
|---|---|---|---|---|
| D1 | Client, février 2027, serveurs et NAS, IA locale | COUVERT | §0, FR-234, FR-232 | — |
| D2 | Le LC fait foi pour contrats et numéro ; contrat d'échange générique | COUVERT | FR-2, FR-194 à FR-197 | — |
| D3 | Référence `DEC-`, liste « à saisir », alerte 1 j ouvré, doublon dans Prospera et dans le LC, paramètre « qui attribue » | COUVERT | FR-36 à FR-38, FR-198, FR-199 | — |
| D4 | Contrats lus, jamais modifiés ; contrôle de garantie non sautable, décision motivée ≥ 10 car. | COUVERT | FR-3, FR-41, FR-42 | — |
| D5 | 8 phases, 11 statuts, 4 sorties, table réécrite | COUVERT | FR-134, FR-135 (41 transitions) | — |
| D6 | Offre/accord ; relance J+15, alerte J+30 ; aucun ordre sans accord | COUVERT | FR-86 à FR-90 | — |
| D7 | Délais légaux (art. 231, 233, 236) séparés des internes ; pénalité 5 %/mois ; survenance | COUVERT | FR-14, FR-85, FR-140 à FR-142 | — |
| D8 | Matrice de délégation, anti-fractionnement, SEP-01/02/03 | COUVERT | FR-7, FR-8, FR-78, FR-79 | Voir l'écart « à trois » du §1 |
| D9 | Accord sur devis ; seuils d'expertise (250 000 / 3 000 000) | COUVERT | FR-59 | — |
| D10 | Recours parallèle, machine propre, prescription 90 j, forfait en paramètre | COUVERT | FR-108 à FR-119 | — |
| D11 | Règlements multiples, états, quittance, moyens, espèces 500 000, LBC/FT | COUVERT | FR-91 à FR-100 | — |
| D12 | Provision dossier par dossier, PSAP, export ; comptabilité hors Prospera | COUVERT | FR-49, FR-76, FR-188, FR-189 | — |
| D13 | 14 usages, garde-fous, registre, mise à jour versionnée, règles explicables, OCR réel | COUVERT | FR-10 à FR-12, FR-163, FR-233 | — |
| D14 | 14 rôles, données de santé | COUVERT | FR-6, FR-9, annexe B | — |
| D15 | Franchise déduite, déclaration tardive = réserve, complément bloquant, cabinet sans compte, corporel poste par poste | COUVERT | FR-43, FR-67, FR-69, FR-70 | — |
| D16 | Comptabilité hors Prospera : état et export | COUVERT | FR-103, FR-193 | — |
| D17 | Reprise M44, resynchronisation, papier tenu, conservation 10 ans, destruction visée | COUVERT | FR-170 à FR-175, FR-214 à FR-217 | — |
| D18 | Modules et codes | COUVERT | FR-20, annexe A | — |
| D19 | Jeu de démo : ≈ 3 500 dossiers, 4 scénarios, 104 vérifications | COUVERT | FR-15 à FR-17, FR-264 | — |
| D20 | < 5 s au 95e centile ; hypothèse de volume ; sauvegarde quotidienne ; 4 h ouvrées | COUVERT | FR-23, FR-246, FR-250, FR-252 | — |
| D21 | Revue juridique obligatoire ; tables du barème = tâche du plan | COUVERT | FR-24, A-12, A-15 | — |

## 3. Proposition v2, A.1 à A.7

| Source | Élément | Statut | FR | Correction proposée |
|---|---|---|---|---|
| A.1 | Scénario de l'appel (4 questions), « Je vais vérifier et je vous rappelle » | COUVERT | §1, FR-152, UJ-1, §9 | — |
| A.1 | Aucun volume réel : à demander | COUVERT | FR-23, A-7 | — |
| A.2 | Recherche unique (nom, police, téléphone, sinistre, archivage) | COUVERT | FR-150 | — |
| A.2 | Fiche dossier : origine (« repris par API »), historique (« 12 actions »), échanges (relance SMS) | PARTIEL | FR-152 | FR-152 ne liste ni l'origine (repris / né dans Prospera) ni l'historique des échanges et relances envoyés ; les ajouter à la fiche |
| A.2 | Parcours « chaque étape tracée : qui, quand, pourquoi » | COUVERT | FR-13, FR-138 | — |
| A.2 | Tableau de bord direction (ouverts par branche/étape, bloqués + raison, 30 j sans action, charge, pièces + relances par canal, règlements + valideur attendu) | COUVERT | FR-206, FR-207, FR-144 | — |
| A.2 | Affectation, répartition de charge « en un clic », alertes | COUVERT | FR-50, FR-51 | — |
| A.2 | Validation, délégations, paiement à plusieurs mains ; aucun règlement sans validation, aucun montant payé deux fois | COUVERT | FR-78, FR-81, FR-90, FR-100, FR-221 | — |
| A.2 | Règlement et recours ; courriers (modèles, quittances) ; relances SMS/e-mail/WhatsApp | COUVERT | FR-46, FR-96, FR-143, FR-226 | — |
| A.2 | Journal avant/après de chaque action ; historique en quelques secondes | COUVERT | FR-13, FR-138 | — |
| A.2 | Délais CIMA ; prescription 2 ans « art. 28 » | PARTIEL | FR-85, FR-118 | La v2 cite l'art. 28 ; le PRD le retire (non vérifié) et affiche la prescription « à vérifier ». Prudent, mais dire dans §1 que la promesse v2 devient « terme à vérifier par le juriste » |
| A.2 | Audits et contrôles de la CRCA « préparés sans reconstitution » | COUVERT | FR-192, FR-211, UJ-7, §9 | — |
| A.2 | Droits par profil ; accès depuis les postes existants ; tableaux de bord par profil | COUVERT | FR-6, FR-228, FR-258 | — |
| A.2 | Sept décideurs ciblés (DG, DAF, Commercial, Resp., Gestionnaires, CI, DSI) | PARTIEL | §2.1, FR-228 | Pas de rôle ni de cockpit pour le DAF (expositions chèques, provisions, honoraires) ni pour le Commercial (courtiers, réclamations) ; la DSI = ADMIN, sans lecture métier. Ajouter à FR-228 une vue « finance » (CPT/DG) et une vue « réseau » ou dire qu'elles sont hors périmètre |
| A.3 #1 | Déclaration assistée (WhatsApp, appel, e-mail) | PARTIEL | FR-35 | Écart voulu : l'appel est exclu (PO « sauf la voix »). Dire dans FR-35 que la v2 promettait l'appel et que l'accueil saisit pendant l'appel |
| A.3 #2 | Lecture et classement des pièces | COUVERT | FR-163, FR-164 | — |
| A.3 #3 | Contrôle des pièces (propriétaire carte grise, dates, photo réutilisée) | COUVERT | FR-53 | — |
| A.3 #4 | Pièces manquantes et relances « en un clic » | COUVERT | FR-47 | — |
| A.3 #5 | Résumé sourcé, 40 pages en quelques minutes | COUVERT | FR-154 (5 min) | — |
| A.3 #6 | Recherche en langage naturel | COUVERT | FR-155 | — |
| A.3 #7 | Pré-remplissage de l'instruction | COUVERT | FR-56 | — |
| A.3 #8 | Analyse des devis (catalogue, main-d'œuvre, historique du garage) | COUVERT | FR-60 | — |
| A.3 #9 | « Pourquoi ce montant ? » défendable devant l'assuré, l'auditeur ou le juge | PARTIEL | FR-74 | Phrase présente seulement dans FR-74 ; la reprendre dans FR-11 et dans la vision §1 comme critère de qualité de toute décision (voir écart 8) |
| A.3 #10 | Détection de fraude, graphe des liens, avant paiement | COUVERT | FR-127 à FR-132 | — |
| A.3 #11 | Courriers : offres, refus motivés, réclamations, relus puis signés | COUVERT | FR-83, FR-122, FR-157 | — |
| A.3 #12 | Recours : offres adverses, mises en demeure | COUVERT | FR-120 | — |
| A.3 #13 | Brief du matin et veille | COUVERT | FR-208 | — |
| A.3 #14 | Qualité et simulation « et si… » | COUVERT | FR-209 | — |
| A.3 | Aucune décision automatique | COUVERT | FR-11 | — |
| A.3 | Jamais de montant sur un préjudice corporel | COUVERT | FR-11, FR-71 | — |
| A.3 | Chaque information sourcée, « rien n'est inventé » | COUVERT | FR-11 | — |
| A.3 | Registre de l'IA avec confiance, accepté/rejeté | COUVERT | FR-12 | — |
| A.3 | IA locale, données personnelles et médicales ne sortent jamais | COUVERT | FR-12, FR-232 | — |
| A.3 | Calibrage 3-5 ans, vérification par les gestionnaires, réentraînement mensuel, rapport mensuel, « ne se met pas à jour seule » | COUVERT | FR-231, FR-233 | — |
| A.3 | « Intégrer l'IA dès le départ » : apprentissage pendant la reprise | COUVERT | FR-231 | — |
| A.4 | Hébergement chez la compagnie, serveur acheté par elle, local sécurisé (onduleur, climatisation) | COUVERT | FR-234 | — |
| A.4 | Loi 2019-014 | COUVERT | FR-19, FR-257 | — |
| A.4 | Aucun nuage étranger ; préparation sur échantillon anonymisé | COUVERT | FR-234 | — |
| A.4 | Sauvegarde quotidienne, journal d'accès, contrôle des sauvegardes | COUVERT | FR-236, FR-252, FR-255 | — |
| A.4 | Données médicales : exigences détaillées (chiffrement, durées, secret) | COUVERT | FR-9, FR-153, FR-227, FR-253 | — |
| A.4 | Réversibilité / sortie : documentation et accès administrateur remis à la réception | OMIS | — | Les sources n'ont pas de clause de sortie mais la v2 remet documentation et accès admin. Ajouter une FR « remise d'exploitation » : documentation, accès ADMIN, export complet des dossiers et pièces en format ouvert |
| A.4 | Disponibilité : aucun chiffre dans la v2 | COUVERT | FR-251 (99,5 % [ASSUMPTION]) | — |
| A.5 | Reprise par API sans ressaisie ni renumérisation | COUVERT | FR-214 | — |
| A.5 | 5 étapes : connexion, récupération des métadonnées, n° d'archivage conservé, classement, rapport | COUVERT | FR-214 à FR-216 | — |
| A.5 | Dossiers en cours d'abord ; historique en arrière-plan | COUVERT | FR-215 | — |
| A.5 | Import clients/polices/sinistres ouverts | COUVERT | FR-195, FR-215 | — |
| A.5 | Prérequis compagnie (doc API, accès de test, règle de numérotation, interlocuteur) | COUVERT | FR-219, A-3 | — |
| A.6 | Phasage 24 semaines, jalons de facturation, prix, recette 10 j, échéancier | COUVERT | P-3, §10 (hors PRD, volontairement) | — |
| A.6 | Maintenance : correctifs, barèmes/CIMA, visite mensuelle, réentraînement | COUVERT | FR-246 | — |
| A.6 | Support : anomalie bloquante sous 4 h ouvrées | COUVERT | FR-246 | — |
| A.6 | Formation par profil (accueil, gestionnaires, responsable, direction, administrateurs), accompagnement sur site, documentation | OMIS | — | Aucune FR de formation ni de documentation d'usage (le seul « attestation » est celle d'assurance). Ajouter une FR « mise en service : formation par rôle, aide en ligne, documentation » avec test de recette |
| A.7 | Intégration par API/fichiers ; comptabilité non mentionnée ; SMS et e-mail sur comptes de la compagnie | COUVERT | FR-197, FR-226 | — |
| A.7 | « Pas de synchronisation continue : import initial seulement » | CONTREDIT (voulu) | FR-217, FR-196 | Écart décidé par le PO (resynchronisation régulière, aller-retour). Le dire dans §1 pour que la promesse v2 ne soit pas lue comme tenue |

## 4. Deck du 12/09 (B.2)

| Source | Élément | Statut | FR | Correction proposée |
|---|---|---|---|---|
| B.2-1 | GED : scan par lots, indexation guidée, OCR, contrôle qualité | COUVERT | FR-162, FR-163, FR-165 | — |
| B.2-1 | Reprise du stock papier par scan | CONTREDIT (voulu) | FR-172 (numérisation à la demande) | Décision du PO : non retenu ; §10.2 le dit. Ajouter dans §1 la ligne « promesse du deck non tenue » |
| B.2-2 | Recherche en moins d'une seconde ; tolérance aux fautes ; aperçu du statut | COUVERT | FR-150, FR-151 (< 1 s visé) | — |
| B.2-3 | Cycle de vie : blocage tant que les pièces obligatoires manquent | CONTREDIT (voulu) | FR-45, FR-44 | Le PRD ouvre « en attente de pièces » et bloque l'évaluation, pas l'ouverture (PO/code). Écart non mentionné au §1 : le dire |
| B.2-3 | Relance automatique des pièces | PARTIEL | FR-47, FR-143 | Le PRD rédige la relance (« en un clic ») ; dire si l'envoi est automatique ou à déclencher, et à quelle échéance |
| B.2-3 | Orientation vers le pôle recours | COUVERT | FR-54, FR-108 | — |
| B.2-4 | Volets, pôle recours, corbeilles personnelle et de service, droits | COUVERT | FR-6, FR-147 à FR-149 | — |
| B.2-5 | Journal horodaté, historique déjà payé / reste à payer, conservation des versions, piste d'audit | COUVERT | FR-13, FR-75, FR-161, FR-138 | — |
| B.2-6 | Téléversement depuis poste, scanner ou téléphone ; liste des pièces attendues en permanence | COUVERT | FR-159, FR-46 | Le téléversement « depuis téléphone » par l'assuré est exclu (pas de portail) : le dire |
| B.2-7 | Barème paramétrable, solde restant dû, quittances au dossier | COUVERT | FR-69, FR-92, FR-96 | — |
| B.2-7 | Rapprochement chèques et T-Money ; validation hiérarchique | COUVERT | FR-224, FR-223 (T-Money « bientôt » tant qu'`paiement` n'a pas l'adaptateur, A-11) | — |
| B.2-7 | État mensuel consolidé, détection d'écarts avant clôture, export au format de la comptabilité | PARTIEL | FR-103, FR-193 | « Détection d'écarts avant clôture (mensuelle) » n'a pas de test : ajouter un blocage ou une alerte à la clôture de période |
| B.2-7 | État des quittances/chèques « J+1 » / « disponible en continu » | PARTIEL | FR-103, FR-148 | Incohérence interne du deck non tranchée : fixer la fraîcheur de l'état (continu pour la file CPT, quotidien pour l'export) |
| B.2-8 | Délais moyens d'ouverture, d'étude, de règlement ; taux dans le délai cible ; charge par volet ; export tableur | COUVERT | FR-213, FR-212 | — |
| B.2-9 | Assistant conversationnel FR/EN, 24 h/24 | COUVERT | FR-22 (« bientôt ») | — |
| B.2 | Parcours : n° sinistre immédiat | PARTIEL | FR-36 | Voir §1 (référence `DEC-`) |
| B.2 | Parcours : alerte urgence corporelle | COUVERT | FR-40 | — |
| B.2 | Parcours : « assuré fautif → prise en charge » | COUVERT | FR-54, FR-72 | — |
| B.2 | Parcours : liste d'appels du matin ; accusé de réception ; SMS en complément ; relance si non retiré | COUVERT | FR-97, FR-101 | — |
| B.2 | Parcours : clôture, archivage, réouverture tracée | COUVERT | FR-105, FR-107 | — |
| B.2 | Courriers sortants : modèles, copie archivée automatiquement, impression groupée | OMIS | — | FR-46 range le courrier au dossier, mais ni l'impression groupée ni l'archivage automatique de la copie envoyée ne sont exigés ; ajouter une FR « courriers : copie archivée, impression par lot » |
| B.2 | Mesure : < 5 s pour retrouver n'importe quel dossier | COUVERT | FR-250, §9 | — |
| B.2 | Mesure : 100 % des actions horodatées et attribuées | COUVERT | §9 | — |
| B.2 | Mesure : 0 dossier perdu ou introuvable à la relance | PARTIEL | FR-173, FR-171 | Aucun indicateur « 0 introuvable » en §9 : ajouter, avec FR-172 comme cause |
| B.2 | Mesure : charge de chaque gestionnaire et retards « en temps réel » | PARTIEL | FR-206, FR-212 | Définir la fraîcheur (recalcul à la lecture ou toutes les N minutes) |
| B.2 | Mesure : état quittances/chèques « J+1 » | PARTIEL | FR-103 | Voir ci-dessus |
| B.2 | Langues français / English | COUVERT | FR-22, FR-260 | — |
| B.2 | Hébergement non précisé, pas de mention du médical | COUVERT | (surpassé par FR-9, FR-234) | — |

## 5. Idées qualitatives que la structure en FR peut perdre

| Source | Élément | Statut | FR | Correction proposée |
|---|---|---|---|---|
| v2 A.1 | « Je vais vérifier et je vous rappelle » à faire disparaître | COUVERT | §1, §9, FR-152 | — (bien tenu) |
| v2 A.1 | Le client « attend, rappelle, finit par douter de la compagnie » ; la direction « ne voit pas » | COUVERT | §1 | Aucune FR ne porte la confiance de l'assuré comme critère ; le §9 a « Délai de réponse » seulement |
| v2 A.2/A.3 | Décision « défendable devant l'assuré, l'auditeur ou le juge » | PARTIEL | FR-74 seulement | Faire de ce critère une règle transverse (FR-11 ou FR-33) : toute décision porte ses pièces, sa règle, son motif et son auteur lisibles par un tiers |
| v2 A.2 | « Sans reconstitution » | COUVERT | §1, FR-211, UJ-7 | — |
| v2 A.3 | « Rien n'est inventé » ; « l'IA extrait, analyse et recommande » | COUVERT | FR-11 | — |
| v2 A.3 | « Dossier de 40 pages compris en quelques minutes » | COUVERT | FR-154 | — |
| v2 A.4 | « Aucune dépendance à un nuage étranger » | COUVERT | FR-234, FR-19 | — |
| deck B.7 | « La plateforme ne remplace pas la comptabilité : elle lui fournit un état fiable » | COUVERT | FR-2, FR-103 | — |
| PO §6 | « Procédure réelle » vs défauts relevés : « exactement ce que Prospera doit traiter » | COUVERT | §9, FR-34, FR-48 | — |
| PO §5 | « Présent, intégré et vraiment testé » | COUVERT | §0, FR-16, FR-264 | — |
| PO §2 | Séance d'immersion : le PRD est une base à parfaire, pas un contrat | COUVERT | §0, §13.1, A-9 | — |
| deck/v2 | Le ton de l'assuré : « on ne le fait pas attendre, on lui répond tout de suite » | PARTIEL | UJ-1, FR-152 | Le ton est dans les parcours mais pas dans les exigences de messages (FR-146 : délai de première réponse, langage clair, pas de jargon CIMA dans les messages) |
| PO §3 | Offre qui part « sous 48 h » comme promesse à l'assuré | COUVERT | FR-84 | — |

---

## Décompte par statut

168 éléments : COUVERT 144 · PARTIEL 18 · CONTREDIT 3 (tous « voulu », par décision du PO, mais non dits au lecteur) · OMIS 3 (formation/documentation, réversibilité, courriers : copie archivée et impression groupée).

## Les 10 écarts qui comptent

1. **Aucune FR de mise en service ni de formation/documentation** (v2 A.6 : formation par profil, documentation remise, accompagnement). Le PRD parle d'exploitation par la DSI (FR-238, FR-261) mais personne n'est formé ni n'a de documentation exigée. Correction : FR « mise en service » avec test de recette par rôle.
2. **Réversibilité et remise d'exploitation omises** (v2 A.4 : documentation, accès administrateur, sortie). La compagnie héberge tout, mais aucune FR n'exige l'export complet en format ouvert ni la remise des clés. Correction : FR « sortie et remise d'exploitation ».
3. **Validation « à trois » sous 1 M FCFA** (récit du PO, procédure du groupe) devenue « le responsable seul » par défaut (FR-78). C'est la séparation des tâches la plus visible pour un auditeur. Correction : défaut à 3 signataires ou écart assumé et justifié.
4. **Écarts voulus non dits au lecteur** : le §1 ne liste que les promesses du deck « bientôt ». Ne sont pas signalées comme non tenues : blocage à l'ouverture tant que les pièces manquent (B.2-3), reprise du stock papier par scan (B.2-1), numéro de sinistre immédiat (B.2, remplacé par `DEC-`), import initial seulement (A.7, remplacé par la resynchronisation), appel dans la déclaration assistée (A.3 #1). Correction : ajouter au §1 un tableau « promesses non tenues ou transformées, par décision du PO ».
5. **« Défendable devant l'assuré, l'auditeur ou le juge »** n'est qu'une phrase de FR-74, alors que c'est la promesse centrale de l'IA et du journal. Correction : règle transverse (FR-11/FR-33) et indicateur §9.
6. **Courriers : copie archivée automatiquement et impression groupée** (deck B.2) absentes ; FR-46 range seulement le courrier de demande. Correction : FR courriers.
7. **Processus figé au premier jour** (§10.2 : 11 statuts et 41 transitions non paramétrables) alors que le PO veut « un vrai processus qui peut évoluer après ». Correction : décrire la procédure d'amendement d'un statut à la séance d'immersion (nouvelle version du produit ou paramétrage futur).
8. **Fiche dossier plus pauvre que celle de la v2** : ni origine du dossier (repris / né dans Prospera) ni historique des échanges et relances (FR-152). La reprise étant le premier risque, la provenance d'un dossier repris doit se lire sur la fiche. Correction : ajouter ces deux blocs.
9. **Décideurs v2 DAF, Commercial et DSI sans vue ni rôle** (FR-228 : cockpits par rôle ne couvre pas la finance ni le réseau). Correction : vue « finance » (expositions, provisions, honoraires, rapprochements) et décision explicite sur le réseau.
10. **Indicateurs du deck perdus** : « 0 dossier introuvable à la relance », « état J+1 / continu », « charge en temps réel » n'ont ni fraîcheur définie ni indicateur §9. Correction : fixer la fraîcheur de chaque état et ajouter l'indicateur.

Notes secondaires : UJ-2 suppose que le LC répond « le lendemain matin » (spéculation sur un logiciel que le PO interdit de supposer) ; le plan-redaction.md D15 n'a pas été mis à jour avec l'ordre corrigé du décompte (le PRD, lui, est juste) ; aucun nom de compagnie ni de groupe n'a été trouvé dans prd.md (la formule « compagnie du même groupe au Sénégal » vient du PO).
