# Paramètres de la partie 3 (W4) — FR-150 à FR-219

Colonnes : code | libellé | défaut | unité | source | FR. Source « démo » = code de la démo (`extract-code-demo.md`) ; « plan Dn » = décision du plan de rédaction ; « [ASSUMPTION] » = hypothèse à confirmer à la séance d'immersion.

| code | libellé | défaut | unité | source | FR |
|---|---|---|---|---|---|
| recherche.delai_max | Délai maximal d'un résultat de recherche (95e centile) | 5 | secondes | plan D20 (v2, PO) | FR-150 |
| recherche.delai_vise | Délai visé d'un résultat de recherche | 1 | seconde | deck [ASSUMPTION : cible non contractuelle] | FR-150 |
| recherche.longueur_min | Longueur minimale d'un terme cherché | 3 | caractères | [ASSUMPTION] | FR-151 |
| recherche.prefixe_min | Longueur de mot à partir de laquelle la tolérance de fin de mot s'applique | 3 (mot de plus de 3 lettres) | lettres | démo (`rechercherDossiers`) | FR-151 |
| fiche.telephone_visible | Nombre de chiffres du téléphone visibles quand il est masqué | 2 | chiffres | [ASSUMPTION] | FR-153 |
| ia.resume_delai_max | Délai maximal du résumé d'un dossier de 40 pages | 5 | minutes | v2 « quelques minutes » [ASSUMPTION] | FR-154 |
| reclamation.accuse_delai | Délai d'accusé de réception d'une réclamation | 5 | jours | démo (`qualite-reclamations`) | FR-156 |
| reclamation.reponse_delai | Délai de réponse à une réclamation | 30 | jours | démo | FR-156 |
| reclamation.escalade_delai | Délai d'escalade d'une réclamation | 60 | jours | démo | FR-156 |
| reclamation.fenetre_analyse | Fenêtre d'analyse des réclamations récurrentes | 365 | jours | démo | FR-156 |
| reclamation.recurrence_seuil | Nombre de réclamations sur un même motif qui ouvre une ligne au plan d'action | 3 | réclamations | démo | FR-156 |
| journal.consultation_conservation | Durée de conservation du journal des consultations | 10 | ans | [ASSUMPTION : plancher art. 404, à confirmer] | FR-158 |
| ged.formats_acceptes | Types de fichiers acceptés | image/jpeg, image/png, image/webp, application/pdf | liste | démo (`fichiers-store`) | FR-160 |
| ged.taille_max | Taille maximale d'un fichier | 8 | Mo | démo | FR-160 |
| ged.antivirus | Analyse antivirus avant enregistrement | oui (fournie par la compagnie) | oui/non | [ASSUMPTION] | FR-160 |
| ged.types_pieces | Liste des types de pièces | 20 types de la démo (constat amiable, déclaration signée, certificats médicaux, rapport de police, carte grise, permis, devis, facture, RIB, certificat de décès, photos…) | liste | démo (`PieceType`) | FR-160 |
| ged.pieces_recentes | Fenêtre « arrivé aujourd'hui » de l'opérateur | 48 | heures | démo | FR-162 |
| ocr.couche_texte_min | Caractères par page en dessous desquels une page est traitée comme image | 60 | caractères | démo (`lecture-documents`) | FR-163 |
| ocr.delai_page | Délai maximal de lecture d'une page avant `ECHEC` | 2 | minutes | [ASSUMPTION] | FR-163 |
| ocr.numerisation_dpi | Résolution de numérisation conseillée | 300 | dpi | démo (consigne GED) | FR-163 |
| ia.classement_seuil_bas | Confiance en dessous de laquelle la proposition de classement n'est pas pré-sélectionnée | 0,60 | confiance (0-1) | [ASSUMPTION] | FR-164 |
| ia.classement_seuil_haut | Confiance au-dessus de laquelle la proposition est pré-sélectionnée (confirmation humaine quand même) | 0,90 | confiance (0-1) | [ASSUMPTION] | FR-164 |
| ged.a_rattacher_delai | Âge d'une pièce « à rattacher » qui lève une alerte | 3 | jours ouvrés | [ASSUMPTION] | FR-166 |
| archive.format_numero | Format du numéro d'archivage (AAAA = année de clôture ; CCCC = CORP, MATL, DIVR, RECS) | ARC-AAAA-CCCC-NNNNN | format | plan D17 ; démo | FR-167 |
| archive.delai_versement | Délai de versement au fonds après clôture avant alerte | 75 | jours | démo (`DELAI_VERSEMENT_JOURS`) | FR-168 |
| archive.pages_par_boite | Pages maximales par boîte | 2 500 | pages | démo (`archives-hub`) | FR-170 |
| archive.cm_par_boite | Épaisseur d'une boîte | 10 | cm | démo | FR-170 |
| archive.couleurs_chemise | Couleur de chemise par branche | à fournir par la compagnie | liste | [ASSUMPTION] (mémoire, chap. V) | FR-170 |
| archive.verification_boite | Périodicité de vérification physique d'une boîte | 12 | mois | [ASSUMPTION] | FR-170 |
| archive.restitution_delai | Délai de restitution d'une chemise sortie | 15 | jours | démo (`JOURS_RESTITUTION`) ; plan D17 | FR-171 |
| archive.restitution_escalade | Âge d'une sortie non restituée qui alerte le RESP | 30 | jours | [ASSUMPTION] | FR-171 |
| archive.motifs_sortie | Motifs de sortie d'archive | instruction, expertise, contentieux, contrôle interne, réclamation, contrôle de la CRCA | liste | démo (`MotifSortie`) | FR-171 |
| archive.papier_numerise_a_la_demande | Numérisation du papier historique | à la demande (réouverture ou consultation) | règle | [ASSUMPTION] | FR-172 |
| conservation.plancher | Durée minimale de conservation | 10 | ans | art. 404 (SÛR) ; plan D17 | FR-174 |
| conservation.depart | Point de départ de la durée | date de clôture | règle | démo ; [ASSUMPTION] (juriste, point 11) | FR-174 |
| conservation.mortel | Durée, sinistre mortel | 30, conservation définitive | ans | démo (`referentiel-archives`) | FR-174 |
| conservation.corporel | Durée, corporel | 10, conservation définitive | ans | démo | FR-174 |
| conservation.contentieux_recours | Durée, contentieux, recours, litige | 10, conservation définitive | ans | démo | FR-174 |
| conservation.fraude | Durée, fraude suspectée | 10, conservation définitive | ans | démo | FR-174 |
| conservation.pieces_comptables | Durée, quittances, ordres, chèques | 10 | ans | démo | FR-174 |
| conservation.materiel | Durée, matériel (la démo met 5) | 10 | ans | plancher art. 404 ; [ASSUMPTION] | FR-174 |
| conservation.risques_divers | Durée, risques divers (la démo met 5) | 10 | ans | plancher art. 404 ; [ASSUMPTION] | FR-174 |
| conservation.sans_suite_refuse | Durée, classé sans suite ou refusé (la démo met 5) | 10 | ans | plancher art. 404 ; [ASSUMPTION] | FR-174 |
| destruction.visas | Visas d'un bordereau de destruction | RESP puis DG | rôles | [ASSUMPTION] | FR-175 |
| nas.sauvegarde | Fréquence de sauvegarde | quotidienne | — | plan D20 ; v2 | FR-176 |
| nas.test_restauration | Fréquence du test de restauration | annuelle (et avant la mise en service) | — | [ASSUMPTION] | FR-176 |
| nas.seuil_occupation | Taux d'occupation du NAS qui alerte ADMIN | 80 | % | [ASSUMPTION] | FR-176 |
| ged.dimensionnement | Volumes de départ | 50 000 dossiers archivés ; 1,5 million de pages ; 5 000 sinistres par an ; 60 utilisateurs simultanés | — | plan D20 [ASSUMPTION] | FR-176 |
| ged.format_archive | Format d'archive | PDF/A (l'image d'origine reste conservée) | format | [ASSUMPTION] | FR-176 |
| expert.agrement_alerte | Alerte avant la fin d'agrément d'un expert | 60 | jours | [ASSUMPTION] | FR-178 |
| expert.domaines | Domaines d'expertise | auto-matériel, médical, responsabilité, fraude, incendie, transport, bâtiment, perte d'exploitation | liste | démo (`DomaineMission`) | FR-177 |
| expert.panel_interne_demo | Domaines et zones du panel interne du jeu de démonstration | auto-matériel, médical, responsabilité ; Lomé, Tsévié, Aného | liste | démo (jeu de démonstration seulement) | FR-179 |
| expert.second_facteur | Second facteur obligatoire pour le compte d'un cabinet externe (EXPE) | oui | oui/non | [ASSUMPTION] | FR-180 |
| expert.poids_domaine | Poids d'une mission par domaine (grille de charge) | à fournir par la compagnie | points | démo (grille paramétrable) [ASSUMPTION] | FR-183 |
| expert.coef_gravite | Coefficient de gravité du sinistre dans le poids de charge | léger 1 ; modéré 1 ; grave 1,3 ; mortel 1,6 | facteur | démo (`responsable-hub`) | FR-183 |
| expert.arrondi_poids | Arrondi du poids d'une mission | 0,5 | point | démo | FR-183 |
| expert.surcharge | Taux de charge qui rend un expert « surchargé » | 1,2 | × capacité | démo | FR-183 |
| expert.disponible | Taux de charge sous lequel un expert est « disponible » | 0,8 | × capacité | démo | FR-183 |
| expert.echeances_rapports | Fenêtres de l'échéancier des rapports dus | 7 et 15 | jours | démo | FR-183 |
| expert.delai_rapport.auto_materiel | Délai de rapport attendu, auto-matériel | 7 | jours | démo ; mémoire (7 à 10 j) | FR-184 |
| expert.delai_rapport.medical | Délai de rapport attendu, médical | 21 | jours | démo | FR-184 |
| expert.delai_rapport.responsabilite | Délai de rapport attendu, responsabilité | 14 | jours | démo | FR-184 |
| expert.delai_rapport.fraude | Délai de rapport attendu, fraude | 30 | jours | démo | FR-184 |
| expert.delai_rapport.incendie | Délai de rapport attendu, incendie | 21 | jours | démo | FR-184 |
| expert.delai_rapport.transport | Délai de rapport attendu, transport | 14 | jours | démo | FR-184 |
| expert.delai_rapport.batiment | Délai de rapport attendu, bâtiment | 21 | jours | démo | FR-184 |
| expert.delai_rapport.perte_exploitation | Délai de rapport attendu, perte d'exploitation | 30 | jours | démo | FR-184 |
| relance.intervalle | Intervalle entre deux relances d'un même interlocuteur | 5 | jours | démo (`DELAI_ENTRE_RELANCES`) | FR-184 |
| relance.sans_effet | Nombre de relances sans effet avant proposition d'arbitrage | 3 | relances | démo (`RELANCES_SANS_EFFET`) | FR-184 |
| expert.budget_plafond | Plafond du budget indicatif d'une mission | 1 200 000 | FCFA | démo | FR-185 |
| expert.budget_part_enjeu | Part de l'enjeu ajoutée au socle du domaine | 2 | % | démo | FR-185 |
| expert.budget_arrondi | Arrondi du budget indicatif | 5 000 | FCFA | démo | FR-185 |
| expert.budget_coef_type | Coefficient du budget par type de mission | initiale 1 ; complémentaire 0,5 ; contradictoire 1,5 ; contre-expertise 1,5 | facteur | démo | FR-185 |
| expert.budget_socle.auto_materiel | Socle du budget, auto-matériel (à remplacer par le tarif de la compagnie) | 45 000 | FCFA | démo | FR-185 |
| expert.budget_socle.medical | Socle du budget, médical | 120 000 | FCFA | démo | FR-185 |
| expert.budget_socle.responsabilite | Socle du budget, responsabilité | 75 000 | FCFA | démo | FR-185 |
| expert.budget_socle.fraude | Socle du budget, fraude | 250 000 | FCFA | démo | FR-185 |
| expert.budget_socle.incendie | Socle du budget, incendie | 200 000 | FCFA | démo | FR-185 |
| expert.budget_socle.transport | Socle du budget, transport | 120 000 | FCFA | démo | FR-185 |
| expert.budget_socle.batiment | Socle du budget, bâtiment | 150 000 | FCFA | démo | FR-185 |
| expert.budget_socle.perte_exploitation | Socle du budget, perte d'exploitation | 300 000 | FCFA | démo | FR-185 |
| expert.visa_honoraires | Rôles qui visent une note d'honoraires | RESP ou CPT | rôles | plan D8, démo | FR-182 |
| assurance.fraicheur_lecture | Fraîcheur par défaut de la projection des polices | 5 min (API) ; nuit, avant 6 h (fichier) | minutes / heure | transposé de la microfinance (§6.5) [ASSUMPTION] | FR-186 |
| assurance.table_garanties | Table type de sinistre vers garanties qui répondent | table de la démo (16 codes de garantie) | table | démo (`garanties-hub`) ; plan (table en paramètre) | FR-187 |
| garantie.motif_min | Longueur minimale du motif d'une décision de garantie | 10 | caractères | plan D4 ; démo | FR-187 |
| garantie.decisions | Décisions de garantie possibles | GARANTIE_ACQUISE, SOUS_RESERVE, REFUS_DE_GARANTIE | liste | plan D4 | FR-187 |
| provision.ecart_validation | Écart de révision de provision qui attend le RESP | 2 000 000 | FCFA | plan D12 ; démo | FR-188 |
| provision.ecart_estimation | Écart provision / estimation qui classe « à revoir » | 15 | % | démo (`ECART_PROVISION`) | FR-188 |
| provision.sans_mouvement | Ancienneté sans mouvement de provision qui alerte | 90 | jours | démo (`exercices-hub`) | FR-188 |
| provision.ancienne | Ancienneté d'une provision dite « ancienne » | 365 | jours | démo | FR-188 |
| provision.grille_ouverture | Grille de provision d'ouverture par volet et gravité (milieu de tranche) | grilles de la démo (4 barèmes en tranches) | table | démo (`BAREMES`) ; plan D15 | FR-188 |
| provision.motifs | Motifs de mouvement de provision | ouverture, rapport d'expertise, devis de réparation, certificat médical, rapport de police, barème appliqué, validation hiérarchique, régularisation, clôture | liste | démo (`MotifProvision`) | FR-188 |
| ibnr.source | Estimation des sinistres survenus non déclarés | hors Prospera (colonne renseignée ou importée) | règle | art. 334-12 (SÛR) ; [ASSUMPTION] | FR-189 |
| reassurance.traites_demo | Traités du jeu de démonstration, millésime 2026 | excédent automobile 12 M xs 3 M ; quote-part incendie/MRH 40 % ; quote-part transport 55 % ; excédent RC 20 M xs 2 M ; quote-part accident individuel 30 % ; excédent risques divers 10 M xs 2,5 M | FCFA ; % | démo (jeu de démonstration seulement) | FR-190 |
| reassurance.traites_demo_2025 | Traités du jeu de démonstration, millésime 2025 | excédent automobile 10 M xs 2,5 M ; quote-part incendie/MRH 35 % ; quote-part transport 50 % | FCFA ; % | démo (jeu de démonstration seulement) | FR-190 |
| coassurance.somme_parts | Somme des parts d'une clé de coassurance | 100 | % | démo | FR-191 |
| etat_crca.seuil_grande_ampleur | Seuil du drapeau « grande ampleur non clôturé » | à fixer avec la compagnie | FCFA | art. 422 (C10d) ; [ASSUMPTION] | FR-192 |
| compta.table_comptes | Table nature d'opération vers compte | table de la démo, à remplacer par le plan de comptes de la compagnie | table | démo (`arrete-comptable`) | FR-193 |
| compta.rapprochement_ancien | Âge d'un écart de rapprochement qui alerte | 60 | jours | plan D16 ; démo | FR-193 |
| echange.fraicheur_api | Fraîcheur par défaut avec une API | 5 | minutes | transposé de la microfinance [ASSUMPTION] | FR-201 |
| echange.fraicheur_fichier | Fraîcheur par défaut avec des fichiers | à l'heure ou de nuit (avant 6 h) | — | transposé de la microfinance [ASSUMPTION] | FR-201 |
| echange.perime_facteur | Facteur de fraîcheur au-delà duquel une donnée est « périmée » | 2 | × fraîcheur | transposé de la microfinance [ASSUMPTION] | FR-201 |
| echange.sans_confirmation | Délai au-delà duquel un envoi sans confirmation du LC alerte | 24 | heures | transposé de la microfinance [ASSUMPTION] | FR-196 |
| echange.age_max_ouverture | Âge maximal de la lecture d'une police pour ouvrir sans décision motivée | 24 | heures | [ASSUMPTION] | FR-201 |
| sinistre.delai_numero | Délai sans numéro officiel avant alerte au RESP | 1 | jour ouvré | plan D3 | FR-198 |
| sinistre.qui_attribue | Qui attribue le numéro de sinistre | le LC (ou Prospera) | choix | plan D3 | FR-198 |
| sinistre.format_numero | Format du numéro quand Prospera l'attribue | SIN-AAAA-NNNN | format | démo [ASSUMPTION] | FR-198 |
| sinistre.longueur_numero_max | Longueur maximale d'un numéro officiel reçu du LC | 40 | caractères | [ASSUMPTION] | FR-198 |
| declaration.format_reference | Format de la référence de déclaration | DEC-AAAA-NNNNN | format | plan D3 | FR-198 |
| echange.saisie_delai | Âge d'une ligne « à saisir » (hors déclaration) qui alerte | 72 | heures | transposé de la microfinance [ASSUMPTION] | FR-199 |
| fictif.delai_numero | Délai simulé d'attribution du numéro par le LC fictif | 5 | secondes | [ASSUMPTION] | FR-203 |
| fictif.jeu_demo | Jeu de démonstration | 14 gestionnaires (3 corporel, 5 matériel, 3 risques divers, 3 recours) ; environ 3 500 dossiers ; 7 produits ; environ 25 000 contrats | — | plan D19 ; démo | FR-202, FR-205 |
| pilotage.sans_action | Ancienneté sans action d'un dossier « sans action » | 30 | jours | v2 ; démo | FR-206 |
| pilotage.pieces_bloquantes | Ancienneté d'une pièce bloquante attendue qui alerte | 30 | jours | démo (`JOURS_PIECES_BLOQUANTES`) | FR-207 |
| pilotage.actualisation | Actualisation maximale des indicateurs | 5 | minutes | [ASSUMPTION] | FR-212 |
| brief.heure | Heure de production du brief du matin | 07:00 | heure | [ASSUMPTION] | FR-208 |
| veille.delai_restant | Délai restant en dessous duquel un dossier inactif est critique | 2 | jours | démo (`surveillerPortefeuille`) | FR-208 |
| veille.inactivite | Inactivité qui rend critique un dossier à délai proche | 5 | jours | démo | FR-208 |
| veille.ecart_provision | Écart provision / estimation d'expert qui lève une alerte | 30 | % | démo | FR-208, FR-209 |
| veille.cheque_non_retire | Ancienneté d'un chèque non retiré qui alerte | 14 | jours | démo | FR-208 |
| veille.offre_corporelle | Jours restants avant le terme légal d'offre corporelle qui alertent | 45 | jours | démo | FR-208 |
| qualite.declaration_tardive | Retard de déclaration qui lève un constat certain | 30 | jours | démo (`analyserCoherence`) | FR-209 |
| qualite.provision_haute | Provision supérieure à l'estimation avant expertise qui lève un constat | 150 | % | démo | FR-209 |
| controle.echantillon | Taille de l'échantillon de revue par période | 12 | dossiers | démo (`audit-sensibles`) | FR-210 |
| controle.sensible_ecart | Écart évaluation / provision d'un dossier sensible | 500 000 et 1,5 fois | FCFA ; facteur | démo (`dossiers-sensibles`) | FR-210 |
| controle.amplitude | Amplitude forte d'un dossier | 25 % ou 1 000 000 | % ; FCFA | démo | FR-210 |
| controle.silences | Silences d'un dossier : à surveiller, à relancer, muet | 8, 15, 30 | jours | démo (`audit-responsable`) | FR-210 |
| controle.agent_sans_trace | Absence de trace d'un agent qui alerte | 10 | jours | démo | FR-210 |
| controle.concentration | Part du volume d'émission sur une seule main qui alerte | 60 | % | démo (`PART_CONCENTRATION`) | FR-210 |
| controle.coordonnees_bancaires | Fenêtre de modification de coordonnées bancaires avant règlement | 5 | jours | démo (`FENETRE_COORDONNEES_JOURS`) ; plan D11 | FR-210 |
| controle.doublon_reglement | Fenêtre de détection d'un doublon de règlement | 30 | jours | démo | FR-210 |
| crca.lot_delai | Temps de production d'un dossier de contrôle de 100 dossiers | 30 | minutes | [ASSUMPTION] | FR-211 |
| pilotage.aging_tranches | Tranches d'ancienneté du stock actif | 7 ; 8-30 ; 31-90 ; plus de 90 | jours | démo (`controle-responsable`) | FR-213 |
| pilotage.delai_cible_volet | Délai cible par volet (délais internes SLA de la démo) | voir §5 (45 / 21 / 30 / 90 j selon plan D7) | jours | plan D7 | FR-213 |
| reprise.sources_jour1 | Sources lues au premier jour | fichiers Excel, CSV, JSON ; API quand la source en offre une | liste | PRD Reprise FR-1 ; plan D17 [ASSUMPTION] | FR-214 |
| reprise.historique_min | Profondeur d'historique en dessous de laquelle le rapport avertit | 3 | ans | PRD Reprise FR-9 | FR-215 |
| reprise.historique_cible | Objectif de profondeur d'historique pour l'IA | 3 à 5 | ans | v2 [ASSUMPTION] | FR-215 |
| reprise.resync_frequence | Fréquence de la resynchronisation pendant le parallèle | chaque nuit | — | plan D17 | FR-217 |
| reprise.resync_heure | Heure limite de la resynchronisation nocturne | avant 6 h | heure | transposé de la microfinance [ASSUMPTION] | FR-217 |
| reprise.fin_parallele | Date de fin du parallèle | fixée par la compagnie à la mise en service | date | PRD Reprise FR-17 [ASSUMPTION] | FR-217 |
| reprise.bascule_dossier | Moment où un dossier devient « tenu par Prospera » | première action de dossier dans Prospera | règle | [ASSUMPTION] | FR-217 |
| reprise.valeurs_controle | Valeurs de contrôle du feu vert | nombre de sinistres ouverts ; somme des provisions des sinistres ouverts ; nombre de polices en vigueur ; nombre de pièces rattachées | liste | [ASSUMPTION] | FR-218 |
| reprise.fichiers_conservation | Conservation des fichiers d'un lot courant après import réussi | 30 | jours | PRD Reprise FR-3 | FR-214 |
