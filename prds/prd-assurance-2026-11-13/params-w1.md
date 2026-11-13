# Paramètres W1 (FR-1 à FR-25, FR-220 à FR-246)

Format : code | libellé | défaut | unité | source | FR. Toute valeur marquée `[A]` est une `[ASSUMPTION]` à confirmer à la séance d'immersion. Les lignes `REF_*` sont un **référentiel daté, non modifiable par la compagnie** (FR-14), versionné avec date d'effet et validateur ; elles figurent à l'annexe D à titre de lecture seule. Les lignes `DELAI_*` et `SLA_*` des délais internes peuvent recouper des lignes de W2 et W3 : l'assembleur garde une seule ligne par code.

| code | libellé | défaut | unité | source | FR |
|---|---|---|---|---|---|
| NUM_ATTRIBUTION | Qui attribue le numéro de sinistre officiel | LC | LC ou PROSPERA | plan D3 | FR-2 |
| NUM_DELAI_ALERTE | Délai avant alerte « dossier sans numéro officiel » | 1 | jour ouvré | plan D3 | FR-2 |
| LC_AGE_MAX_LECTURE_INTERFACE | Âge maximal de la projection des contrats avant relecture (avec interface) | 15 | minutes | [A] modèle microfinance | FR-3 |
| LC_AGE_MAX_LECTURE_FICHIER | Âge maximal de la projection des contrats avant relecture (avec fichiers) | 1 | jour | [A] modèle microfinance | FR-3 |
| GARANTIE_MOTIF_LONGUEUR_MIN | Longueur minimale du motif d'une décision de garantie | 10 | caractères | plan D4 | FR-3 |
| CALIB_PERIODE | Période de recalcul des propositions de seuils d'alerte | 3 | mois | [A] modèle microfinance | FR-5 |
| SESSION_DUREE_MAX | Durée maximale d'une session | 8 | heures | [A] modèle microfinance | FR-25 |
| SESSION_INACTIVITE | Fermeture après inactivité | 30 | minutes | [A] modèle microfinance | FR-25 |
| MFA_ROLES | Rôles à double authentification obligatoire | DG, DT, RESP, CPT, AUD, ADMIN | liste | [A] | FR-25 |
| ACTIVATION_ROLES_SENSIBLES | Rôles activés seulement après validation d'un rôle métier | GEST, GREC, MED, RESP, DT, DG, CPT | liste | [A] modèle microfinance | FR-6 |
| DELEG_SEUIL_RESP | Montant jusqu'auquel le responsable sinistres valide | 1 000 000 | FCFA | plan D8 [A] | FR-8 |
| DELEG_COMITE_MEMBRES | Nombre de membres du comité sinistres | 4 | membres | plan D8 [A] | FR-8 |
| DELEG_COMITE_QUORUM | Quorum du comité sinistres | 3 | membres | plan D8 [A] | FR-8 |
| DELEG_COMITE_COMPOSITION | Rôles obligatoires au comité | RESP, DT (plus deux autres membres) | liste | plan D8 [A] | FR-8 |
| DELEG_VISA_DT | Visa du directeur technique après le comité | oui | oui/non | plan D8 [A] | FR-8 |
| DELEG_COMMERCIAL | Décideur d'un règlement à titre commercial | DG seul | rôle | plan D8 [A] | FR-8 |
| DELEG_CUMUL_DOSSIER | Le cumul des montants validés d'un dossier décide du niveau | oui | oui/non | plan D8 | FR-7, FR-8 |
| SEP_TOLERANCE | Tolérance sur les cumuls interdits (SEP-01, SEP-02) | 0 | cumul | extrait démo (plan de contrôle) | FR-7 |
| SANTE_CONSENTEMENT_BASE | Base légale par défaut du traitement des données de santé | consentement écrit | liste | [A] loi 2019-014 art. 22 | FR-9 |
| SANTE_LECTURE_GEST | Étendue de ce que le gestionnaire lit du médecin-conseil | conclusions seulement | liste | [A] | FR-9 |
| TRACE_CONSERVATION | Durée de conservation du journal, du registre de l'IA et des pièces justificatives | 10 | ans (au moins) | Code CIMA art. 404 (SÛR) | FR-13, FR-12 |
| TRACE_ANCRAGE_PERIODE | Période de dépôt de l'empreinte du journal hors du serveur | 1 | jour | [A] modèle microfinance | FR-13 |
| TRACE_AGENT_SANS_TRACE | Jours sans trace avant signalement d'un agent à AUD | 10 | jours | code de la démo (contrôle interne) | FR-13 |
| REF_DELAI_OFFRE_ACCIDENT | Délai d'offre à compter de l'accident (corporel VTM) | 12 | mois | Code CIMA art. 231 (SÛR), non modifiable | FR-14 |
| REF_DELAI_OFFRE_DECES | Délai d'offre à compter du décès | 8 | mois | Code CIMA art. 231 (SÛR), non modifiable | FR-14 |
| REF_CONSOLIDATION_INFO | Délai après lequel l'offre peut être provisionnelle (consolidation non connue) | 6 | mois | Code CIMA art. 231 (SÛR), non modifiable | FR-14 |
| REF_DELAI_OFFRE_APRES_CONSOLIDATION | Délai d'offre définitive après l'information de la consolidation | 6 | mois | Code CIMA art. 231 (SÛR), non modifiable | FR-14 |
| REF_DELAI_DEMANDE_MOTIVEE | Délai de réponse à une demande motivée de la victime | 30 | jours | Code CIMA art. 231 (SÛR), non modifiable | FR-14 |
| REF_PENALITE_RETARD | Intérêt de retard de plein droit (offre ou paiement tardif) | 5 | % par mois de retard | Code CIMA art. 233 et 236 (SÛR), non modifiable ; base de calcul à valider par le juriste | FR-14 |
| REF_DELAI_DENONCIATION | Délai de dénonciation de la transaction par la victime | 15 | jours | Code CIMA art. 235 (SÛR), non modifiable | FR-14, UJ-4 |
| REF_DELAI_PAIEMENT_APRES_DENONCIATION | Délai de paiement après expiration du délai de dénonciation | 1 | mois | Code CIMA art. 235 et 236 (SÛR), non modifiable | FR-14 |
| REF_SUSPENSION_PIECES | Délai de suspension si pièces demandées non reçues | 6 | semaines | Code CIMA art. 249 (SÛR), non modifiable | FR-14 |
| REF_PRESCRIPTION_CONTRAT | Prescription de l'action dérivant du contrat (terme à vérifier) | 2 | ans | Code CIMA art. 28 (SÛR), non modifiable | FR-14 |
| REF_PRESCRIPTION_RC | Prescription de l'action en responsabilité civile (terme à vérifier) | 5 | ans | Code CIMA art. 256 (SÛR), non modifiable | FR-14 |
| ALERTE_ECHEANCE_LEGALE | Avertissement avant une échéance légale | 45 | jours | code de la démo (veille du portefeuille) | FR-14 |
| DELAI_ACCUSE_RECEPTION | Accusé de réception de la déclaration (interne) | 10 | jours | code de la démo | FR-14 |
| DELAI_OFFRE_DOSSIER_COMPLET | Offre depuis le dossier complet (interne) : corporel / matériel / autres | 90 / 60 / 75 | jours | code de la démo | FR-14 |
| DELAI_REGLEMENT_APRES_ACCORD | Règlement après accord (interne) : corporel / matériel / autres | 45 / 30 / 30 | jours | code de la démo | FR-14 |
| SLA_VOLET | Délai de traitement interne par volet : corporel / matériel / risques divers / recours | 45 / 21 / 30 / 90 | jours | code de la démo | FR-14 |
| DELAI_OFFRE_VALIDEE_ENVOI | Envoi de l'offre validée à l'assuré | 48 | heures | procédure de référence (mémoire 2014, Sénégal) [A] | FR-14 |
| DELAI_RAPPORT_EXPERT | Rapport d'expert (matériel) | 7 à 10 | jours | mémoire 2014 [A] ; code de la démo (7 j) | FR-14 |
| DELAI_PAIEMENT_APRES_ACCORD | Paiement après accord (interne) | 72 | heures | mémoire 2014 [A] | FR-14 |
| DELAI_RELANCE_RECOURS | Relance du recours | 15 | jours | mémoire 2014 [A] ; plan D10 | FR-14 |
| FGA_ACTIF | Un fonds de garantie automobile existe-t-il au Togo | non | oui/non | [A] existence non confirmée | FR-14 |
| FGA_DELAI_DECLARATION | Déclaration au fonds après la réclamation (si FGA actif) | 3 | mois | Code CIMA art. 608 (SÛR) | FR-14 |
| DEMO_NB_GESTIONNAIRES | Gestionnaires de la compagnie fictive : corporel / matériel / risques divers / recours | 3 / 5 / 3 / 3 (total 14) | personnes | récit du PO (chiffre de démo) | FR-15 |
| DEMO_NB_DOSSIERS | Dossiers du portefeuille de démonstration | 3 500 | dossiers | code de la démo, plan D19 | FR-15 |
| DEMO_NB_PRODUITS | Produits du jeu de démonstration | 7 | produits | code de la démo, plan D19 | FR-15 |
| DEMO_COUVERTURE_MIN | Dossiers minimum par statut et par sortie dans le jeu | 10 | dossiers | [A] modèle microfinance | FR-15 |
| DEMO_VERIFICATIONS_RECETTE | Vérifications du rejeu de la démo devenues tests de recette | 104 | vérifications | extrait parcours démo (rejeu 2) | FR-15 |
| NOTIF_LANGUE | Langue par défaut des messages | français | langue | récit PO, v2 | FR-18 |
| NOTIF_INTERVALLE_RELANCE_PIECES | Intervalle entre deux relances de pièces d'un même interlocuteur | 5 | jours | code de la démo | FR-226 |
| NOTIF_RELANCES_AVANT_ARBITRAGE | Relances sans effet avant proposition d'arbitrage | 3 | relances | code de la démo | FR-226 |
| ARCH_RESTITUTION_JOURS | Restitution d'une chemise sortie du papier | 15 | jours | code de la démo, plan D17 | FR-21 |
| CONSERV_DOSSIER_DEFAUT | Durée de conservation par défaut d'un dossier, depuis la clôture (jamais en dessous de 10 ans) | 10 | ans | Code CIMA art. 404 (SÛR) ; les durées de 5 ans de la démo ne sont pas reprises | FR-21 |
| CONSERV_MORTEL | Durée de conservation d'un dossier de sinistre mortel | 30 (définitive) | ans | code de la démo [A] | FR-21 |
| CONSERV_DESTRUCTION_VISA | La destruction exige un visa tracé | oui | oui/non | plan D17 | FR-21 |
| DIM_SINISTRES_AN | Hypothèse : sinistres par an | 5 000 | sinistres | plan D20 [A] | FR-23 |
| DIM_DOSSIERS_ARCHIVES | Hypothèse : dossiers archivés | 50 000 | dossiers | plan D20 [A] | FR-23 |
| DIM_PAGES | Hypothèse : pages archivées | 1 500 000 | pages | plan D20 [A] | FR-23 |
| DIM_UTILISATEURS_SIMULTANES | Hypothèse : utilisateurs simultanés | 60 | utilisateurs | plan D20 [A] | FR-23 |
| DIM_SITES | Hypothèse : sites | 1 central + guichets | sites | plan D20 [A] | FR-23, FR-237 |
| RECHERCHE_DELAI_P95 | Délai de recherche d'un dossier (95e centile) | 5 | secondes | PO / deck du 12/09 | FR-23 |
| RECHERCHE_DELAI_VISE | Délai de recherche visé | 1 | seconde | deck du 12/09 [A] | FR-23 |
| PLAFOND_ESPECES | Plafond d'un règlement en espèces | 500 000 | FCFA | plan D11, code de la démo [A] | FR-225 |
| CHEQUE_RELANCE_GUICHET | Chèque non retiré : relance | 7 | jours | code de la démo | FR-221 |
| CHEQUE_EXPOSITION | Chèque non retiré : signalé comme exposition | 30 | jours | code de la démo | FR-221 |
| CHEQUE_CIRCULATION_LONGUE | Circulation longue d'un chèque | 21 | jours | code de la démo | FR-221 |
| FENETRE_COORDONNEES | Changement de coordonnées bancaires avant paiement = alerte | 5 | jours | plan D11, code de la démo | FR-222 |
| DOUBLON_REGLEMENT_FENETRE | Fenêtre de détection d'un doublon de règlement | 30 | jours | code de la démo | FR-222, FR-224 |
| PAIEMENT_DELAI_COUPURE | Heure limite de validation d'un virement selon la banque | à saisir par banque | heure | [A] | FR-222 |
| MOBILE_MONEY_OPERATEURS | Opérateurs de Mobile Money sortant (par pays) | T-Money, Flooz | liste | plan D11 | FR-223 |
| RAPPROCHEMENT_ECART_ANCIEN | Écart de rapprochement ancien = alerte | 60 | jours | plan D16, code de la démo | FR-224 |
| CONCENTRATION_EMISSION | Part du volume d'émission sur une seule personne = signalée | 60 | % | code de la démo | FR-224 |
| LBC_SEUIL_CUMUL_CLIENT | Seuil cumulé par client (réglementation nationale) | vide (à saisir) | FCFA | [A] valeur nationale non trouvée | FR-225 |
| IA_HISTORIQUE_MIN | Historique minimal de calibrage de l'IA | 3 | ans | proposition v2 | FR-231 |
| IA_HISTORIQUE_MAX | Historique maximal de calibrage de l'IA | 5 | ans | proposition v2 | FR-231 |
| IA_REENTRAINEMENT_PERIODE | Période de réentraînement | 1 | mois | proposition v2 | FR-231 |
| IA_RAPPORT_PERIODE | Période du rapport de performance de l'IA | 1 | mois | proposition v2 | FR-231 |
| IA_CONSENTEMENT_ECARTS | Envoi d'écarts anonymisés à l'IA commune | non (tant que la compagnie n'a pas consenti) | oui/non | décision PO, plan D1 | FR-230, FR-232 |
| IA_NIVEAU_APPRENTISSAGE | Niveau d'apprentissage choisi par la compagnie | celui que le PRD moteur ouvre | liste | PRD moteur | FR-230 |
| IA_ECARTS_SANTE | Envoi d'écarts issus d'une donnée de santé | jamais | — | décision PO (aucune donnée médicale ne sort) | FR-232 |
| CORRECTIF_SECURITE_DELAI | Délai d'acceptation d'un correctif de sécurité critique | 72 | heures | [A] modèle microfinance | FR-235 |
| COUPURE_MAJ_MAX | Coupure maximale d'une mise à jour | 15 | minutes | PRD moteur NFR-9 | FR-235 |
| GEL_SANS_CONTACT | Gel après absence de contact avec Money Vibes | 30 | jours | PRD moteur FR-15 [A] | FR-235 |
| SAUVEGARDE_FREQUENCE | Fréquence de la sauvegarde automatique | 1 | jour | proposition v2 | FR-236 |
| RESTAURATION_TEST_PERIODE | Période du test de restauration | 1 | mois | [A] modèle microfinance | FR-236 |
| RPO / RTO | Perte maximale de données / durée maximale de reprise | 1 h / 4 h | heures | PRD moteur NFR-7 ; point non tranché | FR-236 |
| ADMIN_DEUX_PERSONNES | Création d'un administrateur ou d'un droit d'instance par deux personnes | oui | oui/non | [A] modèle microfinance | FR-238 |
| RELAIS_INTERROGATION | Fréquence d'interrogation du relais | 1 | minute | [A] modèle microfinance | FR-239 |
| RELAIS_PURGE | Purge d'un événement du relais après tirage | 7 | jours | [A] modèle microfinance | FR-239 |
| SUPPORT_PRISE_EN_CHARGE_BLOQUANTE | Prise en charge d'une anomalie bloquante | 4 | heures ouvrées | proposition v2, offre v4 | FR-246 |
| DISPONIBILITE_CIBLE | Objectif de disponibilité en temps ouvré (sans engagement) | 99,5 | % | [A] modèle microfinance | FR-246 |
