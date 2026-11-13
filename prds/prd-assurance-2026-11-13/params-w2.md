# Paramètres — partie W2 (§5.0 à §5.7, FR-30 à FR-89)

Format : code | libellé | défaut | unité | source | FR. Source : PO = récit du PO ; D = décision de cadrage du plan ; DEMO = code de la démo (valeur reprise comme défaut, à confirmer) ; MEM = mémoire de 2014 (autre compagnie du groupe, Sénégal) ; CIMA = Code CIMA 2019, article lu (SÛR) ; ASSUMPTION = défaut posé par ce PRD. Les lignes « RÈGLEMENTAIRE » ne sont pas modifiables par la compagnie.

## Déclaration et ouverture

| code | libellé | défaut | unité | source | FR |
|---|---|---|---|---|---|
| qui_attribue_numero_sinistre | Qui attribue le numéro de sinistre officiel | LC (logiciel de la compagnie) | LC ou Prospera | D3, PO | FR-37 |
| delai_alerte_numero_officiel_jours_ouvres | Délai avant alerte « dossier sans numéro officiel » | 1 | jour ouvré | D3 | FR-37 |
| ecart_alerte_reception_saisie_jours_ouvres | Écart réception réelle / saisie qui alerte le responsable | 1 | jour ouvré | ASSUMPTION (défaut relevé par MEM) | FR-34 |
| age_max_lecture_contrats | Âge de la dernière lecture du LC au-delà duquel l'écran avertit | à définir à la séance d'immersion (aucun défaut chiffré) | heures | ASSUMPTION | FR-41 |
| table_type_sinistre_garanties | Table type de sinistre → garanties qui répondent | table de la démo (auto corporel : RC circulation, individuelle conducteur ; etc.) | table | DEMO | FR-41 |
| delai_declaration_jours_defaut | Délai de déclaration d'une garantie (lu dans le LC par garantie) | 5 | jour | DEMO | FR-43 |
| delai_declaration_vol_jours | Délai de déclaration en cas de vol | 2 | jour | DEMO | FR-43 |
| delai_declaration_transport_jours | Délai de déclaration, transport de marchandises | 3 | jour | DEMO | FR-43 |
| plancher_delai_declaration | Plancher légal du délai de déclaration : 5 jours ouvrés ; 48 heures pour le vol (RÈGLEMENTAIRE, art. 12-4° et 20) | 5 ; 48 h | jour ouvré ; heure | CIMA | FR-43 |
| pieces_obligatoires_par_type | Liste des pièces obligatoires par type de sinistre (12 types) | listes de la démo (annexe D) | liste | DEMO | FR-44 |
| pieces_complementaires_par_type | Liste des pièces complémentaires par type | listes de la démo | liste | DEMO | FR-44 |
| pieces_corporel_cima | Pièces à demander à la victime et aux ayants droit (art. 240, 241) | pièce d'identité, acte de naissance, acte de mariage, certificat médical initial ; certificat de décès, jugement d'hérédité, certificat de vie, certificat de genre de mort | liste | CIMA, ASSUMPTION (à valider par le juriste) | FR-44 |
| volet_par_type | Volet par défaut de chaque type de sinistre | corporel : auto corporel, accident du travail, décès ; matériel : auto matériel, collision ; risques divers : les autres | table | DEMO | FR-44 |
| delai_accuse_reception_jours | Accusé de réception du dossier (délai interne) | 10 | jour | DEMO | FR-48 |
| alerte_accuse_gestionnaire_jours | Jour où l'accusé non envoyé alerte l'agent | 8 | jour | ASSUMPTION | FR-48 |
| intervalle_relance_min_jours | Intervalle minimal entre deux relances d'un même interlocuteur | 5 | jour | DEMO | FR-47 |
| relances_sans_effet_max | Nombre de relances sans effet avant proposition d'arbitrage | 3 | relances | DEMO | FR-47 |
| delai_troisieme_relance_jours | Délai écrit dans le troisième message | 15 | jour | DEMO | FR-47 |
| grille_provision_ouverture | Grilles en tranches par volet (milieu de tranche selon gravité) | grilles de la démo (annexe D) | table | DEMO | FR-49 |
| arrondi_provision_fcfa | Arrondi de la provision d'ouverture | 5 000 | FCFA | DEMO | FR-49 |

## Attribution et instruction

| code | libellé | défaut | unité | source | FR |
|---|---|---|---|---|---|
| alerte_dossier_non_affecte_jours_ouvres | Délai avant alerte « dossier ouvert non affecté » | 1 | jour ouvré | ASSUMPTION | FR-50 |
| seuil_surcharge_gestionnaire | Charge pondérée / capacité au-delà de laquelle un gestionnaire est surchargé | 1,2 | ratio | DEMO | FR-51 |
| seuil_disponible_gestionnaire | Charge pondérée / capacité sous laquelle un gestionnaire est disponible | 0,8 | ratio | DEMO | FR-51 |
| poids_charge_gravite | Coefficient de gravité du poids de charge | léger et modéré 1 ; grave 1,3 ; mortel 1,6 | coefficient | DEMO | FR-51 |
| poids_charge_domaine_type | Poids de charge par domaine et par type de mission | à saisir (grille de la démo non extraite) | poids | DEMO, à compléter | FR-51 |
| delai_relance_recours_jours | Relance de la mise en cause du tiers | 15 | jour | D10, MEM | FR-54 |
| alertes_instruction | Seuils des alertes d'instruction : sinistre moins de 30 jours après souscription ; véhicule de plus de 15 ans ; montant de plus de 5 000 000 FCFA (contre-expertise recommandée) ; plainte de vol déposée plus de 2 jours après les faits ; réserves de transport plus de 3 jours après livraison ; prescription du recours transporteur 1 an (2 ans en aérien) | valeurs de la démo | seuils | DEMO | FR-55 |
| franchise_defaut_biens_fcfa | Franchise par défaut du formulaire biens et divers | 25 000 | FCFA | DEMO | FR-55, FR-73 |

## Expertise

| code | libellé | défaut | unité | source | FR |
|---|---|---|---|---|---|
| seuil_expertise_requise_fcfa | Aucune expertise requise sous ce montant | 250 000 | FCFA | DEMO | FR-59 |
| seuil_expertise_externe_fcfa | Expertise externe obligatoire au-dessus | 3 000 000 | FCFA | DEMO | FR-59 |
| accord_devis_dossier_max_fcfa | Voie accord sur devis : montant maximal du dossier | 300 000 | FCFA | D9, MEM | FR-59 |
| accord_devis_montant_max_fcfa | Voie accord sur devis : montant maximal du devis | 200 000 | FCFA | D9, MEM | FR-59 |
| panel_interne_domaines | Domaines couverts par le panel interne | automobile matériel, médical, responsabilité | liste | DEMO | FR-59 |
| panel_interne_zones | Zones desservies par le panel interne | Lomé, Tsévié, Aného | liste | DEMO | FR-59 |
| orientation_declaration_tardive_jours | Déclaration tardive qui déclenche l'orientation « fraude » | 15 | jour | DEMO | FR-58 |
| orientation_souscription_recente_jours | Souscription récente qui déclenche l'orientation « fraude » | 60 | jour | DEMO | FR-58 |
| devis_surcout_alerte_pct | Surcoût d'un poste qui alerte, en pourcentage du devis | 10 | % | DEMO | FR-60 |
| comparables_devis_min | Observations minimales pour l'historique des devis | 5 | observations | DEMO | FR-60 |
| catalogue_prix_pieces | Catalogue de fourchettes de prix des pièces, taux horaire, coefficients de catégorie | à constituer (valeurs de la démo non retenues) | table | ASSUMPTION | FR-60 |
| delai_rapport_expert_jours | Délai de rapport attendu par domaine | auto matériel 7 ; médical 21 ; responsabilité 14 ; fraude 30 ; incendie 21 ; transport 14 ; bâtiment 21 ; perte d'exploitation 30 | jour | DEMO (MEM : 7 et 10) | FR-68 |
| budget_socle_domaine_fcfa | Socle du budget indicatif par domaine | auto matériel 45 000 ; médical 120 000 ; responsabilité 75 000 ; fraude 250 000 ; incendie 200 000 ; transport 120 000 ; bâtiment 150 000 ; perte d'exploitation 300 000 | FCFA | DEMO | FR-68 |
| budget_plafond_fcfa | Plafond du budget indicatif | 1 200 000 | FCFA | DEMO | FR-68 |
| budget_part_enjeu_pct | Part de l'enjeu ajoutée au socle | 2 | % | DEMO | FR-68 |
| budget_coefficient_type | Coefficient de type de mission | initiale 1 ; complémentaire 0,5 ; contradictoire 1,5 ; contre-expertise 1,5 | coefficient | DEMO | FR-66, FR-68 |
| arrondi_budget_fcfa | Arrondi du budget indicatif | 5 000 | FCFA | DEMO | FR-68 |
| ecart_expert_attention_pct | Écart expert / dossier : niveau attention | 15 | % | DEMO | FR-65 |
| ecart_expert_bloquant_pct | Écart expert / dossier : niveau bloquant | 35 | % | DEMO | FR-65 |
| comparables_missions_min | Missions comparables minimales pour la médiane | 5 | missions | DEMO | FR-65 |
| comparables_dossiers_min | Dossiers comparables minimaux pour la médiane | 12 | dossiers | DEMO | FR-65, FR-74 |
| ecart_comparables_significatif_pct | Écart significatif à la médiane des comparables | 25 | % | DEMO | FR-65 |
| delai_certificat_medical_jours | Délai d'attente par type de certificat | initial 8 ; prolongation 8 ; arrêt de travail 8 ; reprise 10 ; guérison 12 ; consolidation 15 ; descriptif des séquelles 12 ; aggravation 12 ; rechute 10 ; complémentaire 8 | jour | DEMO | FR-63 |
| preavis_convocation_examen_jours | Préavis minimal de convocation à l'examen médical (RÈGLEMENTAIRE, art. 244) | 15 | jour | CIMA | FR-63 |
| delai_rapport_medical_jours | Transmission du rapport médical après l'examen (RÈGLEMENTAIRE, art. 245) | 20 | jour | CIMA | FR-63 |
| qualification_expert | Qualification exigée (RÈGLEMENTAIRE, art. 272) : expert judiciaire inscrit, ou diplômes appropriés, ou 5 ans d'activité | 5 | ans | CIMA | FR-63 |

## Chiffrage et provision

| code | libellé | défaut | unité | source | FR |
|---|---|---|---|---|---|
| grille_vetuste_auto | Vétusté sur pièces selon l'âge du véhicule | jusqu'à 1 an 0 % ; 2 ans 10 % ; 3 ans 20 % ; 5 ans 30 % ; 8 ans 40 % ; au-delà 50 % | % | DEMO (« indicative ») | FR-72 |
| abattement_divers_pct | Abattement du formulaire divers | 10 | % | DEMO | FR-73 |
| arrondi_indemnite_fcfa | Arrondi des montants non corporels | 5 000 (corporel : au franc) | FCFA | DEMO, ASSUMPTION | FR-73 |
| smig_togo_mensuel | SMIG du Togo, paramètre daté (pays de l'accident, ou de résidence s'il est plus élevé) | 52 500 depuis le 01/01/2023 (PROBABLE, sources secondaires) | FCFA par mois | CIMA (principe), ASSUMPTION (valeur) | FR-70 |
| smig_annuel_multiplicateur | SMIG annuel = mensuel x | 12 | mois | ASSUMPTION | FR-70 |
| plafonds_corporel_multiples_smig | Plafonds en multiples du SMIG annuel (RÈGLEMENTAIRES, art. 259 à 266) : incapacité temporaire mensuelle 6 ; préjudice économique d'incapacité permanente 10 (si taux ≥ 50 %) ; préjudice moral 2 (si taux ≥ 80 %) ; gains futurs 36 ; frais funéraires 2 ; ayants droit du décédé 85 au total ; moral des bénéficiaires du décès 20 au total ; tierce personne 50 % de l'incapacité (si taux ≥ 80 %) | valeurs du Code | multiple | CIMA | FR-70 |
| echelle_souffrance_esthetique | Échelle de souffrance et de préjudice esthétique en % du SMIG annuel (art. 262) : très léger 5 ; léger 10 ; modéré 20 ; moyen 40 ; assez important 60 ; important 100 ; très important 150 ; exceptionnel 300 | valeurs du Code | % du SMIG annuel | CIMA | FR-70 |
| moral_deces_pct_smig | Préjudice moral par bénéficiaire du décès (art. 266) : conjoint 150 ; enfant mineur 100 ; enfant majeur 75 ; ascendant 75 ; frère ou sœur 50 | valeurs du Code | % du SMIG annuel | CIMA | FR-70 |
| table_valeur_point_ipp | Valeur du point d'incapacité permanente par taux et par âge (art. 260) | à saisir depuis l'image du PDF officiel, double saisie | table | CIMA (D21) | FR-70 |
| table_repartition_ayants_droit | Clés de répartition entre ayants droit (art. 265) | à saisir (valeurs lisibles partiellement, à valider) | table | CIMA (D21) | FR-70 |
| table_conversion_rentes | Table de conversion des rentes | à saisir | table | CIMA (D21) | FR-70 |
| bareme_medical_ip | Barème médical d'incapacité permanente (annexe du Livre II) | à numériser | table | CIMA (D21) | FR-70 |
| delai_creance_tiers_payeur_mois | Délai de production de la créance d'un tiers payeur avant déchéance (RÈGLEMENTAIRE, art. 254-255) | 6 | mois | CIMA | FR-70 |
| revision_provision_attente_resp_fcfa | Écart de provision qui attend le responsable | 2 000 000 | FCFA | DEMO | FR-76 |
| provision_sans_mouvement_jours | Provision sans mouvement signalée « à revoir » | 90 | jour | DEMO | FR-76 |
| provision_ecart_estimation_pct | Écart provision / estimation signalé « à revoir » | 15 | % | DEMO | FR-76 |

## Décision, offre, délais

| code | libellé | défaut | unité | source | FR |
|---|---|---|---|---|---|
| delegation_responsable_max_fcfa | Plafond de validation du responsable des sinistres seul | 1 000 000 | FCFA | D8, MEM | FR-78 |
| delegation_niveau_comite | Au-delà du plafond : comité sinistres puis visa du DT | oui | règle | D8 | FR-78, FR-79 |
| delegation_commercial | Règlement à titre commercial : DG seul | oui, tout montant | règle | D8 | FR-78 |
| delegation_cumul_par_dossier | Le cumul des montants validés d'un dossier décide du niveau | oui | règle | D8 (SEP-03 démo) | FR-78 |
| comite_membres | Membres du comité sinistres | 4 (dont le responsable et le DT) | membres | D8, MEM | FR-79 |
| comite_quorum | Quorum du comité | 3 | membres | D8 | FR-79 |
| comite_regle_majorite | Règle de décision du comité | majorité simple des présents | règle | ASSUMPTION | FR-79 |
| tolerance_expert_pct | Tolérance affichée : montant arrêté / proposition de l'expert | 10 | % | DEMO | FR-80 |
| tolerance_provision_pct | Tolérance affichée : indemnité / provision | 25 | % | DEMO | FR-80 |
| delai_envoi_offre_heures | Délai d'envoi de l'offre validée | 48 | heure | D6, MEM | FR-84 |
| delai_communication_pv_transaction_heures | Communication du procès-verbal de transaction aux bénéficiaires | 24 | heure | MEM, ASSUMPTION | FR-84 |
| delai_relance_offre_jours | Première relance d'une offre sans réponse | 15 | jour | D6 | FR-89 |
| delai_alerte_offre_jours | Alerte au responsable d'une offre sans réponse | 30 | jour | D6 | FR-89 |
| delai_offre_corporel_mois | Offre corporel VTM : à compter de l'accident (RÈGLEMENTAIRE, art. 231) | 12 | mois | CIMA | FR-85 |
| delai_offre_deces_mois | Offre aux ayants droit : à compter du décès (RÈGLEMENTAIRE, art. 231) | 8 | mois | CIMA | FR-85 |
| delai_consolidation_mois | Information de consolidation attendue avant offre provisionnelle ; offre définitive après information (RÈGLEMENTAIRE, art. 231) | 6 ; 6 | mois | CIMA | FR-85 |
| delai_reponse_demande_motivee_jours | Réponse à une demande motivée de la victime (RÈGLEMENTAIRE, art. 231) | 30 | jour | CIMA | FR-85 |
| penalite_retard_pct_mois | Intérêt de retard de plein droit sur l'indemnité (RÈGLEMENTAIRE, art. 233) | 5 | % par mois | CIMA | FR-85 |
| suspensions_delai_offre | Suspensions et prorogations (RÈGLEMENTAIRES) : non-avis dans le mois (art. 247) ; décès tardif (art. 248) ; pièces non reçues 6 semaines (art. 249-250) ; réponse incomplète 1 mois (art. 251) ; expert commun +1 mois (art. 252) ; étranger +1 mois (art. 253) | valeurs du Code | durées | CIMA | FR-85 |
| delai_denonciation_transaction_jours | Dénonciation de la transaction par la victime (RÈGLEMENTAIRE, art. 235) | 15 | jour | CIMA | FR-82, FR-86 |
| avis_juge_tutelles_jours | Avis au juge des tutelles avant paiement à un représentant légal (RÈGLEMENTAIRE, art. 234) | 15 | jour | CIMA | FR-86 |
| delai_interne_offre_jours | Offre, délai interne depuis la réception du dossier complet | corporel 90 ; matériel 60 ; autre 75 | jour | DEMO | FR-85 |
| delai_interne_traitement_jours | Délai de traitement (SLA) depuis la déclaration | corporel 45 ; matériel 21 ; risques divers 30 ; recours 90 | jour | DEMO | FR-85 |
| delai_interne_reglement_jours | Règlement après accord, délai interne (suite en §5.8) | corporel 45 ; matériel 30 ; autre 30 | jour | DEMO | FR-85 |
