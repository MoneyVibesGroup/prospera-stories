## Annexe D. Table des paramètres

**Cette annexe fait foi en cas d'écart avec une FR.** Tous les seuils du PRD sont des **paramètres de la compagnie** (FR-4), versionnés et datés ; un dossier garde les valeurs en vigueur à sa décision. Toutes les valeurs sont des **valeurs par défaut** modifiables, **sauf** celles de D.5, qui sont un référentiel légal. Les seuils d'**alerte** sont calibrés sur les données de la compagnie après la reprise (FR-5). Une valeur marquée `[A]` est une `[ASSUMPTION]` à confirmer à la séance d'immersion. Une ligne par paramètre : quand deux FR donnaient le même seuil sous deux codes, l'autre code est noté en **alias** ; les écarts de valeur sont listés dans « Conflits résolus ».

Sources : PO = récit du PO ; D3, D8, D9… = décision de cadrage du plan ; DEMO ou démo = code de la démo (valeur reprise comme défaut, à confirmer) ; MEM ou mémoire 2014 = mémoire d'une compagnie du même groupe au Sénégal (à confirmer pour le Togo) ; ASSUMPTION ou `[A]` = défaut posé par ce PRD, à confirmer ; CIMA = Code CIMA 2019, article lu (SÛR).

### D.1 Règles transverses (partie 1)

Rôles, sessions, délégations, données de santé, trace, jeu de démonstration. La matrice de délégation (FR-8, FR-78) est un paramètre de la compagnie ; ses défauts sont des `[ASSUMPTION]` à confirmer par les délégations réelles.

| code | libellé | défaut | unité | source | FR |
|---|---|---|---|---|---|
| `CALIB_PERIODE` | Période de recalcul des propositions de seuils d'alerte | 3 | mois | [A] modèle microfinance | FR-5 |
| `ACTIVATION_ROLES_SENSIBLES` | Rôles activés seulement après validation d'un rôle métier | GEST, GREC, MED, RESP, DT, DG, CPT | liste | [A] modèle microfinance | FR-6 |
| `SEP_TOLERANCE` | Tolérance sur les cumuls interdits (SEP-01, SEP-02) | 0 | cumul | extrait démo (plan de contrôle) | FR-7 |
| `DELEG_COMITE_COMPOSITION` | Rôles obligatoires au comité | RESP, DT (plus deux autres membres) | liste | plan D8 [A] | FR-8 |
| `DELEG_VISA_DT` | Visa du directeur technique après le comité | oui | oui/non | plan D8 [A] | FR-8 |
| `SANTE_CONSENTEMENT_BASE` | Base légale par défaut du traitement des données de santé | consentement écrit | liste | [A] loi 2019-014 art. 22 | FR-9 |
| `SANTE_LECTURE_GEST` | Étendue de ce que le gestionnaire lit du médecin-conseil | conclusions seulement | liste | [A] | FR-9 |
| `TRACE_CONSERVATION` (alias : `journal.consultation_conservation`) | Durée de conservation du journal, du registre de l'IA et des pièces justificatives | 10 | ans (au moins) | Code CIMA art. 404 (SÛR) | FR-12, FR-13, FR-158 |
| `TRACE_ANCRAGE_PERIODE` | Période de dépôt de l'empreinte du journal hors du serveur | 1 | jour | [A] modèle microfinance | FR-13 |
| `DEMO_COUVERTURE_MIN` | Dossiers minimum par statut et par sortie dans le jeu | 10 | dossiers | [A] modèle microfinance | FR-15 |
| `DEMO_NB_DOSSIERS` | Dossiers du portefeuille de démonstration | 3 500 | dossiers | code de la démo, plan D19 | FR-15 |
| `DEMO_NB_GESTIONNAIRES` (alias : `fictif.jeu_demo`) | Gestionnaires de la compagnie fictive : corporel / matériel / risques divers / recours | 3 / 5 / 3 / 3 (total 14) | personnes | récit du PO (chiffre de démo) | FR-15, FR-202, FR-205 |
| `DEMO_NB_PRODUITS` | Produits du jeu de démonstration | 7 | produits | code de la démo, plan D19 | FR-15 |
| `DEMO_VERIFICATIONS_RECETTE` | Vérifications du rejeu de la démo devenues tests de recette | 104 | vérifications | extrait parcours démo (rejeu 2) | FR-15 |
| `NOTIF_LANGUE` | Langue par défaut des messages | français | langue | récit PO, v2 | FR-18 |
| `DIM_DOSSIERS_ARCHIVES` (alias : `ged.dimensionnement`) | Hypothèse : dossiers archivés [ged.dimensionnement regroupe les cinq lignes DIM_*] | 50 000 | dossiers | plan D20 [A] | FR-23, FR-176 |
| `DIM_PAGES` | Hypothèse : pages archivées | 1 500 000 | pages | plan D20 [A] | FR-23 |
| `DIM_SINISTRES_AN` | Hypothèse : sinistres par an | 5 000 | sinistres | plan D20 [A] | FR-23 |
| `DIM_SITES` | Hypothèse : sites | 1 central + guichets | sites | plan D20 [A] | FR-23, FR-237 |
| `DIM_UTILISATEURS_SIMULTANES` | Hypothèse : utilisateurs simultanés | 60 | utilisateurs | plan D20 [A] | FR-23 |
| `MFA_ROLES` | Rôles à double authentification obligatoire | DG, DT, RESP, CPT, AUD, ADMIN | liste | [A] | FR-25 |
| `SESSION_DUREE_MAX` | Durée maximale d'une session | 8 | heures | [A] modèle microfinance | FR-25 |
| `SESSION_INACTIVITE` | Fermeture après inactivité | 30 | minutes | [A] modèle microfinance | FR-25 |
| `delegation_commercial` (alias : `DELEG_COMMERCIAL`) | Règlement à titre commercial : DG seul | oui, tout montant | règle | D8 | FR-8, FR-78 |
| `delegation_cumul_par_dossier` (alias : `DELEG_CUMUL_DOSSIER`) | Le cumul des montants validés d'un dossier décide du niveau | oui | règle | D8 (SEP-03 démo) | FR-7, FR-8, FR-78 |
| `delegation_niveau_comite` | Au-delà du plafond : comité sinistres puis visa du DT | oui | règle | D8 | FR-78, FR-79 |
| `delegation_responsable_max_fcfa` (alias : `DELEG_SEUIL_RESP`) | Plafond de validation du responsable des sinistres seul | 1 000 000 | FCFA | D8, MEM | FR-8, FR-78 |
| `comite_membres` (alias : `DELEG_COMITE_MEMBRES`) | Membres du comité sinistres | 4 (dont le responsable et le DT) | membres | D8, MEM | FR-8, FR-79 |
| `comite_quorum` (alias : `DELEG_COMITE_QUORUM`) | Quorum du comité | 3 | membres | D8 | FR-8, FR-79 |
| `comite_regle_majorite` | Règle de décision du comité | majorité simple des présents | règle | ASSUMPTION | FR-79 |

### D.2 Circuit sinistre (partie 2, §5)

Valeurs du circuit : déclaration et numéro de sinistre, ouverture, instruction, expertise (seuils), chiffrage, provision, offre, règlement, clôture, recours, sorties, fraude, délais internes et relances. Les délais internes sont modifiables par produit ; les délais légaux sont en D.5.

| code | libellé | défaut | unité | source | FR |
|---|---|---|---|---|---|
| `ecart_alerte_reception_saisie_jours_ouvres` | Écart réception réelle / saisie qui alerte le responsable | 1 | jour ouvré | ASSUMPTION (défaut relevé par MEM) | FR-34 |
| `delai_alerte_numero_officiel_jours_ouvres` (alias : `NUM_DELAI_ALERTE`, `delais.numero_officiel_jours_ouvres`, `sinistre.delai_numero`) | Délai avant alerte « dossier sans numéro officiel » | 1 | jour ouvré | D3 | FR-2, FR-37, FR-142, FR-198 |
| `qui_attribue_numero_sinistre` (alias : `NUM_ATTRIBUTION`, `sinistre.qui_attribue`) | Qui attribue le numéro de sinistre officiel | LC (logiciel de la compagnie) | LC ou Prospera | D3, PO | FR-2, FR-37, FR-198 |
| `delai_declaration_jours_defaut` | Délai de déclaration d'une garantie (lu dans le LC par garantie) | 5 | jour | DEMO | FR-43 |
| `delai_declaration_transport_jours` | Délai de déclaration, transport de marchandises | 3 | jour | DEMO | FR-43 |
| `delai_declaration_vol_jours` | Délai de déclaration en cas de vol | 2 | jour | DEMO | FR-43 |
| `pieces_complementaires_par_type` | Liste des pièces complémentaires par type | listes de la démo | liste | DEMO | FR-44 |
| `pieces_corporel_cima` | Pièces à demander à la victime et aux ayants droit (art. 240, 241) | pièce d'identité, acte de naissance, acte de mariage, certificat médical initial ; certificat de décès, jugement d'hérédité, certificat de vie, certificat de genre de mort | liste | CIMA, ASSUMPTION (à valider par le juriste) | FR-44 |
| `pieces_obligatoires_par_type` | Liste des pièces obligatoires par type de sinistre (12 types) | listes de la démo (annexe D) | liste | DEMO | FR-44 |
| `volet_par_type` | Volet par défaut de chaque type de sinistre | corporel : auto corporel, accident du travail, décès ; matériel : auto matériel, collision ; risques divers : les autres | table | DEMO | FR-44 |
| `delai_troisieme_relance_jours` | Délai écrit dans le troisième message | 15 | jour | DEMO | FR-47 |
| `alerte_accuse_gestionnaire_jours` | Jour où l'accusé non envoyé alerte l'agent | 8 | jour | ASSUMPTION | FR-48 |
| `delai_accuse_reception_jours` (alias : `DELAI_ACCUSE_RECEPTION`, `delais.accuse_reception_jours`) | Accusé de réception du dossier (délai interne) | 10 | jour | DEMO | FR-14, FR-48, FR-142 |
| `arrondi_provision_fcfa` | Arrondi de la provision d'ouverture | 5 000 | FCFA | DEMO | FR-49 |
| `alerte_dossier_non_affecte_jours_ouvres` | Délai avant alerte « dossier ouvert non affecté » | 1 | jour ouvré | ASSUMPTION | FR-50 |
| `poids_charge_domaine_type` | Poids de charge par domaine et par type de mission | à saisir (grille de la démo non extraite) | poids | DEMO, à compléter | FR-51 |
| `poids_charge_gravite` | Coefficient de gravité du poids de charge | léger et modéré 1 ; grave 1,3 ; mortel 1,6 | coefficient | DEMO | FR-51 |
| `seuil_disponible_gestionnaire` | Charge pondérée / capacité sous laquelle un gestionnaire est disponible | 0,8 | ratio | DEMO | FR-51 |
| `seuil_surcharge_gestionnaire` | Charge pondérée / capacité au-delà de laquelle un gestionnaire est surchargé | 1,2 | ratio | DEMO | FR-51 |
| `alertes_instruction` | Seuils des alertes d'instruction : sinistre moins de 30 jours après souscription ; véhicule de plus de 15 ans ; montant de plus de 5 000 000 FCFA (contre-expertise recommandée) ; plainte de vol déposée plus de 2 jours après les faits ; réserves de transport plus de 3 jours après livraison ; prescription du recours transporteur 1 an (2 ans en aérien) | valeurs de la démo | seuils | DEMO | FR-55 |
| `franchise_defaut_biens_fcfa` | Franchise par défaut du formulaire biens et divers | 25 000 | FCFA | DEMO | FR-55, FR-73 |
| `orientation_declaration_tardive_jours` | Déclaration tardive qui déclenche l'orientation « fraude » | 15 | jour | DEMO | FR-58 |
| `orientation_souscription_recente_jours` | Souscription récente qui déclenche l'orientation « fraude » | 60 | jour | DEMO | FR-58 |
| `accord_devis_dossier_max_fcfa` | Voie accord sur devis : montant maximal du dossier | 300 000 | FCFA | D9, MEM | FR-59 |
| `accord_devis_montant_max_fcfa` | Voie accord sur devis : montant maximal du devis | 200 000 | FCFA | D9, MEM | FR-59 |
| `panel_interne_domaines` (alias : `expert.panel_interne_demo`) | Domaines couverts par le panel interne [l'alias expert.panel_interne_demo couvre aussi panel_interne_zones] | automobile matériel, médical, responsabilité | liste | DEMO | FR-59, FR-179 |
| `panel_interne_zones` | Zones desservies par le panel interne | Lomé, Tsévié, Aného | liste | DEMO | FR-59 |
| `seuil_expertise_externe_fcfa` | Expertise externe obligatoire au-dessus | 3 000 000 | FCFA | DEMO | FR-59 |
| `seuil_expertise_requise_fcfa` | Aucune expertise requise sous ce montant | 250 000 | FCFA | DEMO | FR-59 |
| `catalogue_prix_pieces` | Catalogue de fourchettes de prix des pièces, taux horaire, coefficients de catégorie | à constituer (valeurs de la démo non retenues) | table | ASSUMPTION | FR-60 |
| `comparables_devis_min` | Observations minimales pour l'historique des devis | 5 | observations | DEMO | FR-60 |
| `devis_surcout_alerte_pct` | Surcoût d'un poste qui alerte, en pourcentage du devis | 10 | % | DEMO | FR-60 |
| `delai_certificat_medical_jours` | Délai d'attente par type de certificat | initial 8 ; prolongation 8 ; arrêt de travail 8 ; reprise 10 ; guérison 12 ; consolidation 15 ; descriptif des séquelles 12 ; aggravation 12 ; rechute 10 ; complémentaire 8 | jour | DEMO | FR-63 |
| `comparables_dossiers_min` | Dossiers comparables minimaux pour la médiane | 12 | dossiers | DEMO | FR-65, FR-74 |
| `comparables_missions_min` | Missions comparables minimales pour la médiane | 5 | missions | DEMO | FR-65 |
| `ecart_comparables_significatif_pct` | Écart significatif à la médiane des comparables | 25 | % | DEMO | FR-65 |
| `ecart_expert_attention_pct` | Écart expert / dossier : niveau attention | 15 | % | DEMO | FR-65 |
| `ecart_expert_bloquant_pct` | Écart expert / dossier : niveau bloquant | 35 | % | DEMO | FR-65 |
| `decompte.ordre` | Ordre du décompte des sinistres non corporels (la franchise est déduite du montant arrêté, jamais avant la règle proportionnelle) | dommage, vétusté, règle proportionnelle, plafond, franchise | ordre | code de la démo, corrigé le 2026-11-13 (plan D15) | FR-69, FR-75 |
| `grille_vetuste_auto` | Vétusté sur pièces selon l'âge du véhicule | jusqu'à 1 an 0 % ; 2 ans 10 % ; 3 ans 20 % ; 5 ans 30 % ; 8 ans 40 % ; au-delà 50 % | % | DEMO (« indicative ») | FR-72 |
| `abattement_divers_pct` | Abattement du formulaire divers | 10 | % | DEMO | FR-73 |
| `arrondi_indemnite_fcfa` | Arrondi des montants non corporels | 5 000 (corporel : au franc) | FCFA | DEMO, ASSUMPTION | FR-73 |
| `tolerance_expert_pct` | Tolérance affichée : montant arrêté / proposition de l'expert | 10 | % | DEMO | FR-80 |
| `tolerance_provision_pct` | Tolérance affichée : indemnité / provision | 25 | % | DEMO | FR-80 |
| `delai_communication_pv_transaction_heures` | Communication du procès-verbal de transaction aux bénéficiaires | 24 | heure | MEM, ASSUMPTION | FR-84 |
| `delai_envoi_offre_heures` (alias : `DELAI_OFFRE_VALIDEE_ENVOI`, `delais.offre_envoi_heures`) | Délai d'envoi de l'offre validée | 48 | heure | D6, MEM | FR-14, FR-84, FR-142 |
| `delai_alerte_offre_jours` (alias : `delais.offre_alerte_jours`) | Alerte au responsable d'une offre sans réponse | 30 | jour | D6 | FR-89, FR-142 |
| `delai_relance_offre_jours` (alias : `delais.offre_relance_jours`) | Première relance d'une offre sans réponse | 15 | jour | D6 | FR-89, FR-142 |
| `reglement.honoraires_motif_au_dela_lettre` | Visa d'honoraires : motif exigé au-delà de la lettre de mission | OUI | oui/non | démo | FR-90 |
| `reglement.gabarit_lettre_cheque` | Gabarit de lettre-chèque de la compagnie | aucun (remplissage manuel) | fichier | [ASSUMPTION] | FR-94 |
| `reglement.ecart_rapprochement_jours` (alias : `RAPPROCHEMENT_ECART_ANCIEN`, `compta.rapprochement_ancien`) | Écart de rapprochement ancien = alerte (dans `paiement`) | 60 | jours | démo, D16 | FR-95, FR-193, FR-224 |
| `reglement.operateurs_mobile_money` (alias : `MOBILE_MONEY_OPERATEURS`) | Opérateurs Mobile Money autorisés | T-Money, Flooz | liste | D11 | FR-95, FR-223 |
| `reglement.code_usage_unique_minutes` | Validité du code à usage unique | 10 | minutes | [ASSUMPTION] | FR-96 |
| `reglement.signature_electronique_quittance` | Acceptation électronique de la quittance par code à usage unique | désactivée | oui/non | D11, D21 | FR-96 |
| `reglement.fenetre_cumul_especes_jours` | Fenêtre de cumul du plafond espèces | 30 | jours | [ASSUMPTION] | FR-98 |
| `reglement.plafond_especes` (alias : `PLAFOND_ESPECES`) | Plafond d'un règlement en espèces (par règlement et par bénéficiaire, cumul sur 30 j) | 500000 | FCFA | démo PLAFOND_ESPECES, D11 | FR-98, FR-225 |
| `dossier.motif_min_caracteres` (alias : `GARANTIE_MOTIF_LONGUEUR_MIN`, `garantie.motif_min`) | Longueur minimale d un motif écrit | 10 | caractères | démo (décision de garantie) | FR-3, FR-99, FR-104, FR-187 |
| `reglement.fenetre_coordonnees_jours` (alias : `FENETRE_COORDONNEES`, `controle.coordonnees_bancaires`) | Changement de coordonnées avant paiement = alerte | 5 | jours | démo FENETRE_COORDONNEES_JOURS | FR-100, FR-210, FR-222 |
| `reglement.fenetre_doublon_jours` (alias : `DOUBLON_REGLEMENT_FENETRE`, `controle.doublon_reglement`) | Fenêtre de détection du doublon de règlement | 30 | jours | démo | FR-100, FR-210, FR-222, FR-224 |
| `reglement.part_concentration_pct` (alias : `CONCENTRATION_EMISSION`, `controle.concentration`) | Part du volume émis par un même comptable déclenchant l'alerte | 60 | % | démo PART_CONCENTRATION | FR-100, FR-210, FR-224 |
| `reglement.seuil_cumul_lbc` (alias : `LBC_SEUIL_CUMUL_CLIENT`) | Cumul par bénéficiaire déclenchant l'alerte LBC/FT | (vide, alerte inactive) | FCFA | [ASSUMPTION] valeur nationale non lue | FR-100, FR-225 |
| `reglement.cheque_circulation_longue_jours` (alias : `CHEQUE_CIRCULATION_LONGUE`) | Chèque non retiré : circulation longue | 21 | jours | démo | FR-101, FR-221 |
| `reglement.cheque_exposition_jours` (alias : `CHEQUE_EXPOSITION`) | Chèque non retiré : exposition | 30 | jours | démo DELAI_GUICHET_JOURS | FR-101, FR-221 |
| `reglement.cheque_relance_jours` (alias : `CHEQUE_RELANCE_GUICHET`) | Chèque non retiré : relance | 7 | jours | démo RELANCE_GUICHET_JOURS | FR-101, FR-221 |
| `reglement.alerte_avant_echeance_heures` | Alerte jaune avant la cible de paiement | 48 | heures | [ASSUMPTION] | FR-102 |
| `reglement.attendre_fin_denonciation` | Au corporel automobile, ne pas émettre avant la fin du délai de dénonciation | OUI | oui/non | [ASSUMPTION] | FR-102 |
| `reglement.delai_paiement_heures` (alias : `DELAI_PAIEMENT_APRES_ACCORD`) | Paiement après accord (cible interne) | 72 | heures | mémoire 2014 (D7) | FR-14, FR-102 |
| `recours.nouveau_non_traite_jours` | Nouveau recours non traité = alerte | 60 | jours | démo | FR-108 |
| `recours.sans_action_jours` | Recours sans action = alerte | 30 | jours | démo | FR-108 |
| `recours.delai_lettre_mise_en_cause_jours_ouvres` | Envoi de la lettre de mise en cause après ouverture | 5 | jours ouvrés | [ASSUMPTION] | FR-109 |
| `recours.relance_jours` (alias : `DELAI_RELANCE_RECOURS`, `delai_relance_recours_jours`) | Relance du recours tant que sans réponse puis jusqu au recouvrement | 15 | jours | mémoire 2014, D10 | FR-14, FR-54, FR-110 |
| `recours.delai_reclamation_apres_paiement_jours` | Réclamation du remboursement après paiement de l assuré | 30 | jours | démo (délai de transmission) | FR-111 |
| `recours.creance_ancienne_jours` | Créance non soldée ancienne = alerte | 90 | jours | démo | FR-113 |
| `recours.inclure_honoraires_base` | Honoraires d expert inclus dans la base du montant réclamé | NON | oui/non | [ASSUMPTION] | FR-113 |
| `recours.delai_mise_en_demeure_jours` | Délai accordé au débiteur par la mise en demeure | 30 | jours | démo | FR-114 |
| `recours.seuil_perte_validation_direction` | Perte sur créance exigeant la validation DG ou DT | (vide) | FCFA | [ASSUMPTION] | FR-115 |
| `recours.alerte_prescription_jours` | Alerte avant le terme indicatif | 90 | jours | démo | FR-118 |
| `recours.arbitrage_obligatoire` | Arbitrage inter-assureurs activé (art. 276) | OUI (à vérifier) | oui/non | Code CIMA art. 276 (SÛR), [ASSUMPTION] | FR-119 |
| `recours.convention_active` | Convention de place active (indemnisation directe, forfait) | NON | oui/non | [ASSUMPTION] | FR-119 |
| `recours.convention_delai_reglement_jours` | Délai de règlement entre compagnies sous convention | (vide) | jours | recherche (exemple 30 j, non togolais) | FR-119 |
| `recours.convention_forfait` | Forfait inter-compagnies (valeur d exemple) | 350000 | FCFA | démo R1 | FR-119 |
| `recours.contre_proposition_formule` | Contre-proposition : max(offre x 1,15 ; moyenne offre et réclamé ; 80 % du réclamé) | formule démo | formule | démo | FR-120 |
| `recours.ecart_accord_rapide_pct` | Écart à l offre : accord rapide jusqu à | 15 | % | démo | FR-120 |
| `recours.ecart_negociable_pct` | Écart à l offre : négociable jusqu à | 35 | % | démo | FR-120 |
| `sortie.delai_decision_refus_heures` | Décision de refus soumise au responsable ou à la direction | 48 | heures | mémoire 2014 (D7) | FR-121 |
| `sortie.delai_information_refus_jours_ouvres` | Courrier de refus envoyé après la décision | 2 | jours ouvrés | mémoire 2014 (72 h), [ASSUMPTION] | FR-121 |
| `sortie.attente_apres_derniere_relance_jours` | Attente après la dernière relance avant classement | 15 | jours | démo (3e relance) , [ASSUMPTION] | FR-123 |
| `sortie.canaux_min_sans_suite` | Canaux de relance distincts avant classement | 2 | canaux | [ASSUMPTION] | FR-123 |
| `sortie.delai_grace_versement_sans_suite_jours` | Délai avant versement aux archives d un dossier sans suite | 30 | jours | [ASSUMPTION] | FR-123 |
| `sortie.relances_avant_sans_suite` | Relances sans effet avant classement sans suite | 3 | relances | démo RELANCES_SANS_EFFET | FR-123 |
| `sortie.sans_suite_corporel_decision_direction` | Classement sans suite d un corporel automobile réservé à la direction | OUI | oui/non | Code CIMA art. 231 (SÛR), [ASSUMPTION] | FR-123 |
| `sortie.reouvertures_alerte` | Nombre de réouvertures déclenchant l alerte au contrôle interne | 3 | réouvertures | [ASSUMPTION] | FR-126 |
| `fraude.poids.beneficiaire_multiple` | Poids du signal BENEFICIAIRE_MULTIPLE | 15 | points | démo | FR-127 |
| `fraude.poids.contrat_non_actif` | Poids du signal CONTRAT_NON_ACTIF | 40 | points | démo | FR-127 |
| `fraude.poids.declaration_tardive` | Poids du signal DECLARATION_TARDIVE | 10 | points | démo | FR-127 |
| `fraude.poids.incoherence_dates` | Poids du signal INCOHERENCE_DATES | 30 | points | démo | FR-127 |
| `fraude.poids.montant_atypique` | Poids du signal MONTANT_ATYPIQUE | 20 | points | démo | FR-127 |
| `fraude.poids.sinistre_precoce` | Poids du signal SINISTRE_PRECOCE | 30 | points | démo | FR-127 |
| `fraude.poids.sinistres_repetes` | Poids du signal SINISTRES_REPETES | 25 | points | démo | FR-127 |
| `fraude.poids.telephone_partage` | Poids du signal TELEPHONE_PARTAGE | 15 | points | démo | FR-127 |
| `fraude.poids.vehicule_recurrent` | Poids du signal VEHICULE_RECURRENT | 20 | points | démo | FR-127 |
| `fraude.seuil.beneficiaire_multiple` | Dossiers pour le même bénéficiaire | 3 | dossiers | démo | FR-127 |
| `fraude.seuil.declaration_tardive_jours` | Déclaration tardive | 45 | jours | démo | FR-127 |
| `fraude.seuil.montant_atypique_coefficient` | Évaluation / coût moyen de la branche | 4 | x | démo | FR-127 |
| `fraude.seuil.sinistre_precoce_jours` | Sinistre précoce après la prise d effet | 30 | jours | démo | FR-127 |
| `fraude.seuil.sinistres_repetes` | Nombre de sinistres sur la police | 3 | sinistres | démo | FR-127 |
| `fraude.seuil.telephone_partage` | Assurés sur le même téléphone | 3 | assurés | démo | FR-127 |
| `fraude.seuil.vehicule_recurrent` | Dossiers sur la même immatriculation | 3 | dossiers | démo | FR-127 |
| `fraude.niveau.attention` | Seuil du niveau ATTENTION | 20 | points | démo | FR-128 |
| `fraude.niveau.bloque` | Seuil du niveau BLOQUE (suspend ordre et paiement) | 70 | points | démo | FR-128 |
| `fraude.niveau.suspect` | Seuil du niveau SUSPECT (ouvre la revue) | 45 | points | démo, [ASSUMPTION] pour l ouverture de revue | FR-128 |
| `fraude.plafond_score` | Plafond du score | 100 | points | démo | FR-128 |
| `fraude.delai_revue_bloque_jours_ouvres` | Dossier BLOQUE non revu = alerte | 3 | jours ouvrés | [ASSUMPTION] | FR-129 |
| `fraude.tranches_anciennete_jours` | Tranches d ancienneté des revues | 7 / 30 / 90 | jours | démo | FR-131 |
| `fraude.fenetre_graphe_mois` | Fenêtre du graphe de liens | 12 | mois | démo (portefeuille 12 mois) | FR-132 |
| `fraude.garage_dossiers_min` | Dossiers minimum pour signaler un garage | 5 | dossiers | [ASSUMPTION] | FR-132 |
| `fraude.garage_ecart_marche_pct` | Devis de garage au-dessus de la moyenne du marché | 20 | % | démo | FR-132 |
| `delais.alerte_interne_pct` | Alerte à la part du délai interne écoulée | 85 | % | démo (seuil d alerte délai) | FR-140 |
| `delais.alerte_legale_jours` (alias : `ALERTE_ECHEANCE_LEGALE`, `veille.offre_corporelle`) | Alerte avant une échéance réglementaire | 45 | jours | démo (veille : offre corporelle à présenter dans 45 j) | FR-14, FR-140, FR-208 |
| `delais.offre_autres_jours` | Offre interne, autres branches | 75 | jours | démo | FR-142 |
| `delais.offre_corporel_jours` (alias : `DELAI_OFFRE_DOSSIER_COMPLET`, `delai_interne_offre_jours`) | Offre interne, corporel (départ : dossier complet) [les alias combinés couvrent aussi delais.offre_materiel_jours et delais.offre_autres_jours] | 90 | jours | démo (§3.7) | FR-14, FR-85, FR-142 |
| `delais.offre_materiel_jours` | Offre interne, matériel | 60 | jours | démo | FR-142 |
| `delais.reglement_autres_jours` | Règlement après accord, limite interne, autres | 30 | jours | démo | FR-142 |
| `delais.reglement_corporel_jours` (alias : `DELAI_REGLEMENT_APRES_ACCORD`, `delai_interne_reglement_jours`) | Règlement après accord, limite interne, corporel [les alias combinés couvrent aussi delais.reglement_materiel_jours et delais.reglement_autres_jours] | 45 | jours | démo | FR-14, FR-85, FR-142 |
| `delais.reglement_materiel_jours` | Règlement après accord, limite interne, matériel | 30 | jours | démo | FR-142 |
| `delais.sla_corporel_jours` (alias : `SLA_VOLET`, `delai_interne_traitement_jours`, `pilotage.delai_cible_volet`) | Délai de traitement du volet corporel [les alias combinés couvrent aussi les trois autres volets (delais.sla_*)] | 45 | jours | démo SLA_PAR_VOLET | FR-14, FR-85, FR-142, FR-213 |
| `delais.sla_materiel_jours` | Délai de traitement du volet matériel | 21 | jours | démo | FR-142 |
| `delais.sla_recours_jours` | Délai de traitement du volet recours | 90 | jours | démo | FR-142 |
| `delais.sla_risques_divers_jours` | Délai de traitement du volet risques divers | 30 | jours | démo | FR-142 |
| `relance.canaux` | Canaux de relance | appel, SMS, e-mail, WhatsApp, courrier | liste | démo CanalRelance | FR-143 |
| `relance.intervalle_jours` (alias : `NOTIF_INTERVALLE_RELANCE_PIECES`, `intervalle_relance_min_jours`, `relance.intervalle`) | Intervalle entre deux relances d un même interlocuteur | 5 | jours | démo DELAI_ENTRE_RELANCES | FR-47, FR-143, FR-184, FR-226 |
| `relance.sans_effet_max` (alias : `NOTIF_RELANCES_AVANT_ARBITRAGE`, `relances_sans_effet_max`, `relance.sans_effet`) | Relances sans effet avant proposition d arbitrage | 3 | relances | démo RELANCES_SANS_EFFET | FR-47, FR-143, FR-184, FR-226 |
| `muet.a_relancer_jours` | Dossier sans action : à relancer | 15 | jours | démo | FR-144 |
| `muet.a_surveiller_jours` (alias : `controle.silences`) | Dossier sans action : à surveiller [controle.silences couvre aussi muet.a_relancer_jours et muet.muet_jours] | 8 | jours | démo | FR-144, FR-210 |
| `muet.agent_sans_trace_jours` (alias : `TRACE_AGENT_SANS_TRACE`, `controle.agent_sans_trace`) | Agent sans trace d écriture | 10 | jours | démo | FR-13, FR-144, FR-210 |
| `muet.muet_jours` (alias : `pilotage.sans_action`) | Dossier sans action : muet | 30 | jours | démo | FR-144, FR-206 |
| `pieces.bloquante_jours` (alias : `pilotage.pieces_bloquantes`) | Pièce bloquante en attente = alerte | 30 | jours | démo JOURS_PIECES_BLOQUANTES | FR-145, FR-207 |
| `notif.alerte_offre_a_envoyer_heures` | Alerte au responsable avant la fin des 48 h d envoi de l offre | 24 | heures | [ASSUMPTION] | FR-146 |
| `notif.canal_defaut_assure` | Canal de notification par défaut de l assuré | SMS | canal | [ASSUMPTION] | FR-146 |

### D.3 Modules propres à l'assurance (partie 3, §6)

Recherche, réclamations, pièces et archives (conservation par nature : jamais en dessous du plancher de D.5), experts et leurs budgets, contrats lus et provisions, échange avec le logiciel de la compagnie, pilotage et contrôle interne, reprise.

| code | libellé | défaut | unité | source | FR |
|---|---|---|---|---|---|
| `recherche.delai_max` (alias : `RECHERCHE_DELAI_P95`) | Délai maximal d'un résultat de recherche (95e centile) | 5 | secondes | plan D20 (v2, PO) | FR-23, FR-150 |
| `recherche.delai_vise` (alias : `RECHERCHE_DELAI_VISE`) | Délai visé d'un résultat de recherche | 1 | seconde | deck [ASSUMPTION : cible non contractuelle] | FR-23, FR-150 |
| `recherche.longueur_min` | Longueur minimale d'un terme cherché | 3 | caractères | [ASSUMPTION] | FR-151 |
| `recherche.prefixe_min` | Longueur de mot à partir de laquelle la tolérance de fin de mot s'applique | 3 (mot de plus de 3 lettres) | lettres | démo (`rechercherDossiers`) | FR-151 |
| `fiche.telephone_visible` | Nombre de chiffres du téléphone visibles quand il est masqué | 2 | chiffres | [ASSUMPTION] | FR-153 |
| `ia.resume_delai_max` | Délai maximal du résumé d'un dossier de 40 pages | 5 | minutes | v2 « quelques minutes » [ASSUMPTION] | FR-154 |
| `reclamation.accuse_delai` | Délai d'accusé de réception d'une réclamation | 5 | jours | démo (`qualite-reclamations`) | FR-156 |
| `reclamation.escalade_delai` | Délai d'escalade d'une réclamation | 60 | jours | démo | FR-156 |
| `reclamation.fenetre_analyse` | Fenêtre d'analyse des réclamations récurrentes | 365 | jours | démo | FR-156 |
| `reclamation.recurrence_seuil` | Nombre de réclamations sur un même motif qui ouvre une ligne au plan d'action | 3 | réclamations | démo | FR-156 |
| `reclamation.reponse_delai` | Délai de réponse à une réclamation | 30 | jours | démo | FR-156 |
| `ged.antivirus` | Analyse antivirus avant enregistrement | oui (fournie par la compagnie) | oui/non | [ASSUMPTION] | FR-160 |
| `ged.formats_acceptes` | Types de fichiers acceptés | image/jpeg, image/png, image/webp, application/pdf | liste | démo (`fichiers-store`) | FR-160 |
| `ged.taille_max` | Taille maximale d'un fichier | 8 | Mo | démo | FR-160 |
| `ged.types_pieces` | Liste des types de pièces | 20 types de la démo (constat amiable, déclaration signée, certificats médicaux, rapport de police, carte grise, permis, devis, facture, RIB, certificat de décès, photos…) | liste | démo (`PieceType`) | FR-160 |
| `ged.pieces_recentes` | Fenêtre « arrivé aujourd'hui » de l'opérateur | 48 | heures | démo | FR-162 |
| `ocr.couche_texte_min` | Caractères par page en dessous desquels une page est traitée comme image | 60 | caractères | démo (`lecture-documents`) | FR-163 |
| `ocr.delai_page` | Délai maximal de lecture d'une page avant `ECHEC` | 2 | minutes | [ASSUMPTION] | FR-163 |
| `ocr.numerisation_dpi` | Résolution de numérisation conseillée | 300 | dpi | démo (consigne GED) | FR-163 |
| `ia.classement_seuil_bas` | Confiance en dessous de laquelle la proposition de classement n'est pas pré-sélectionnée | 0,60 | confiance (0-1) | [ASSUMPTION] | FR-164 |
| `ia.classement_seuil_haut` | Confiance au-dessus de laquelle la proposition est pré-sélectionnée (confirmation humaine quand même) | 0,90 | confiance (0-1) | [ASSUMPTION] | FR-164 |
| `ged.a_rattacher_delai` | Âge d'une pièce « à rattacher » qui lève une alerte | 3 | jours ouvrés | [ASSUMPTION] | FR-166 |
| `archive.format_numero` | Format du numéro d'archivage (AAAA = année de clôture ; CCCC = CORP, MATL, DIVR, RECS) | ARC-AAAA-CCCC-NNNNN | format | plan D17 ; démo | FR-167 |
| `archive.delai_versement` (alias : `dossier.delai_versement_jours`) | Délai de versement au fonds après clôture avant alerte | 75 | jours | démo (`DELAI_VERSEMENT_JOURS`) | FR-105, FR-168 |
| `archive.cm_par_boite` | Épaisseur d'une boîte | 10 | cm | démo | FR-170 |
| `archive.couleurs_chemise` | Couleur de chemise par branche | à fournir par la compagnie | liste | [ASSUMPTION] (mémoire, chap. V) | FR-170 |
| `archive.pages_par_boite` | Pages maximales par boîte | 2 500 | pages | démo (`archives-hub`) | FR-170 |
| `archive.verification_boite` | Périodicité de vérification physique d'une boîte | 12 | mois | [ASSUMPTION] | FR-170 |
| `archive.motifs_sortie` | Motifs de sortie d'archive | instruction, expertise, contentieux, contrôle interne, réclamation, contrôle de la CRCA | liste | démo (`MotifSortie`) | FR-171 |
| `archive.restitution_delai` (alias : `ARCH_RESTITUTION_JOURS`, `dossier.restitution_chemise_jours`) | Délai de restitution d'une chemise sortie | 15 | jours | démo (`JOURS_RESTITUTION`) ; plan D17 | FR-21, FR-107, FR-171 |
| `archive.restitution_escalade` | Âge d'une sortie non restituée qui alerte le RESP | 30 | jours | [ASSUMPTION] | FR-171 |
| `archive.papier_numerise_a_la_demande` | Numérisation du papier historique | à la demande (réouverture ou consultation) | règle | [ASSUMPTION] | FR-172 |
| `conservation.contentieux_recours` | Durée, contentieux, recours, litige | 10, conservation définitive | ans | démo | FR-174 |
| `conservation.corporel` | Durée, corporel | 10, conservation définitive | ans | démo | FR-174 |
| `conservation.fraude` | Durée, fraude suspectée | 10, conservation définitive | ans | démo | FR-174 |
| `conservation.materiel` | Durée, matériel (la démo met 5) | 10 | ans | plancher art. 404 ; [ASSUMPTION] | FR-174 |
| `conservation.mortel` (alias : `CONSERV_MORTEL`) | Durée, sinistre mortel | 30, conservation définitive | ans | démo (`referentiel-archives`) | FR-21, FR-174 |
| `conservation.pieces_comptables` | Durée, quittances, ordres, chèques | 10 | ans | démo | FR-174 |
| `conservation.risques_divers` | Durée, risques divers (la démo met 5) | 10 | ans | plancher art. 404 ; [ASSUMPTION] | FR-174 |
| `conservation.sans_suite_refuse` | Durée, classé sans suite ou refusé (la démo met 5) | 10 | ans | plancher art. 404 ; [ASSUMPTION] | FR-174 |
| `destruction.visas` (alias : `CONSERV_DESTRUCTION_VISA`) | Visas d'un bordereau de destruction | RESP puis DG | rôles | [ASSUMPTION] | FR-21, FR-175 |
| `ged.format_archive` | Format d'archive | PDF/A (l'image d'origine reste conservée) | format | [ASSUMPTION] | FR-176 |
| `nas.seuil_occupation` | Taux d'occupation du NAS qui alerte ADMIN | 80 | % | [ASSUMPTION] | FR-176 |
| `expert.domaines` | Domaines d'expertise | auto-matériel, médical, responsabilité, fraude, incendie, transport, bâtiment, perte d'exploitation | liste | démo (`DomaineMission`) | FR-177 |
| `expert.agrement_alerte` | Alerte avant la fin d'agrément d'un expert | 60 | jours | [ASSUMPTION] | FR-178 |
| `expert.second_facteur` | Second facteur obligatoire pour le compte d'un cabinet externe (EXPE) | oui | oui/non | [ASSUMPTION] | FR-180 |
| `expert.visa_honoraires` | Rôles qui visent une note d'honoraires | RESP ou CPT | rôles | plan D8, démo | FR-182 |
| `expert.arrondi_poids` | Arrondi du poids d'une mission | 0,5 | point | démo | FR-183 |
| `expert.coef_gravite` | Coefficient de gravité du sinistre dans le poids de charge | léger 1 ; modéré 1 ; grave 1,3 ; mortel 1,6 | facteur | démo (`responsable-hub`) | FR-183 |
| `expert.disponible` | Taux de charge sous lequel un expert est « disponible » | 0,8 | × capacité | démo | FR-183 |
| `expert.echeances_rapports` | Fenêtres de l'échéancier des rapports dus | 7 et 15 | jours | démo | FR-183 |
| `expert.poids_domaine` | Poids d'une mission par domaine (grille de charge) | à fournir par la compagnie | points | démo (grille paramétrable) [ASSUMPTION] | FR-183 |
| `expert.surcharge` | Taux de charge qui rend un expert « surchargé » | 1,2 | × capacité | démo | FR-183 |
| `expert.delai_rapport.auto_materiel` (alias : `DELAI_RAPPORT_EXPERT`, `delai_rapport_expert_jours`) | Délai de rapport attendu, auto-matériel [l'alias delai_rapport_expert_jours couvre les huit domaines (expert.delai_rapport.*)] | 7 | jours | démo ; mémoire (7 à 10 j) | FR-14, FR-68, FR-184 |
| `expert.delai_rapport.batiment` | Délai de rapport attendu, bâtiment | 21 | jours | démo | FR-184 |
| `expert.delai_rapport.fraude` | Délai de rapport attendu, fraude | 30 | jours | démo | FR-184 |
| `expert.delai_rapport.incendie` | Délai de rapport attendu, incendie | 21 | jours | démo | FR-184 |
| `expert.delai_rapport.medical` | Délai de rapport attendu, médical | 21 | jours | démo | FR-184 |
| `expert.delai_rapport.perte_exploitation` | Délai de rapport attendu, perte d'exploitation | 30 | jours | démo | FR-184 |
| `expert.delai_rapport.responsabilite` | Délai de rapport attendu, responsabilité | 14 | jours | démo | FR-184 |
| `expert.delai_rapport.transport` | Délai de rapport attendu, transport | 14 | jours | démo | FR-184 |
| `expert.budget_arrondi` (alias : `arrondi_budget_fcfa`) | Arrondi du budget indicatif | 5 000 | FCFA | démo | FR-68, FR-185 |
| `expert.budget_coef_type` (alias : `budget_coefficient_type`) | Coefficient du budget par type de mission | initiale 1 ; complémentaire 0,5 ; contradictoire 1,5 ; contre-expertise 1,5 | facteur | démo | FR-66, FR-68, FR-185 |
| `expert.budget_part_enjeu` (alias : `budget_part_enjeu_pct`) | Part de l'enjeu ajoutée au socle du domaine | 2 | % | démo | FR-68, FR-185 |
| `expert.budget_plafond` (alias : `budget_plafond_fcfa`) | Plafond du budget indicatif d'une mission | 1 200 000 | FCFA | démo | FR-68, FR-185 |
| `expert.budget_socle.auto_materiel` (alias : `budget_socle_domaine_fcfa`) | Socle du budget, auto-matériel (à remplacer par le tarif de la compagnie) [l'alias budget_socle_domaine_fcfa couvre les huit domaines (expert.budget_socle.*)] | 45 000 | FCFA | démo | FR-68, FR-185 |
| `expert.budget_socle.batiment` | Socle du budget, bâtiment | 150 000 | FCFA | démo | FR-185 |
| `expert.budget_socle.fraude` | Socle du budget, fraude | 250 000 | FCFA | démo | FR-185 |
| `expert.budget_socle.incendie` | Socle du budget, incendie | 200 000 | FCFA | démo | FR-185 |
| `expert.budget_socle.medical` | Socle du budget, médical | 120 000 | FCFA | démo | FR-185 |
| `expert.budget_socle.perte_exploitation` | Socle du budget, perte d'exploitation | 300 000 | FCFA | démo | FR-185 |
| `expert.budget_socle.responsabilite` | Socle du budget, responsabilité | 75 000 | FCFA | démo | FR-185 |
| `expert.budget_socle.transport` | Socle du budget, transport | 120 000 | FCFA | démo | FR-185 |
| `assurance.table_garanties` (alias : `table_type_sinistre_garanties`) | Table type de sinistre vers garanties qui répondent | table de la démo (16 codes de garantie) | table | démo (`garanties-hub`) ; plan (table en paramètre) | FR-41, FR-187 |
| `garantie.decisions` | Décisions de garantie possibles | GARANTIE_ACQUISE, SOUS_RESERVE, REFUS_DE_GARANTIE | liste | plan D4 | FR-187 |
| `provision.ancienne` | Ancienneté d'une provision dite « ancienne » | 365 | jours | démo | FR-188 |
| `provision.ecart_estimation` (alias : `provision_ecart_estimation_pct`) | Écart provision / estimation qui classe « à revoir » | 15 | % | démo (`ECART_PROVISION`) | FR-76, FR-188 |
| `provision.ecart_validation` (alias : `revision_provision_attente_resp_fcfa`, `sortie.ecart_provision_attente_responsable`) | Écart de révision de provision qui attend le RESP | 2 000 000 | FCFA | plan D12 ; démo | FR-76, FR-124, FR-188 |
| `provision.grille_ouverture` (alias : `grille_provision_ouverture`) | Grille de provision d'ouverture par volet et gravité (milieu de tranche) | grilles de la démo (4 barèmes en tranches) | table | démo (`BAREMES`) ; plan D15 | FR-49, FR-188 |
| `provision.motifs` | Motifs de mouvement de provision | ouverture, rapport d'expertise, devis de réparation, certificat médical, rapport de police, barème appliqué, validation hiérarchique, régularisation, clôture | liste | démo (`MotifProvision`) | FR-188 |
| `provision.sans_mouvement` (alias : `provision_sans_mouvement_jours`) | Ancienneté sans mouvement de provision qui alerte | 90 | jours | démo (`exercices-hub`) | FR-76, FR-188 |
| `ibnr.source` | Estimation des sinistres survenus non déclarés | hors Prospera (colonne renseignée ou importée) | règle | art. 334-12 (SÛR) ; [ASSUMPTION] | FR-189 |
| `reassurance.traites_demo` | Traités du jeu de démonstration, millésime 2026 | excédent automobile 12 M xs 3 M ; quote-part incendie/MRH 40 % ; quote-part transport 55 % ; excédent RC 20 M xs 2 M ; quote-part accident individuel 30 % ; excédent risques divers 10 M xs 2,5 M | FCFA ; % | démo (jeu de démonstration seulement) | FR-190 |
| `reassurance.traites_demo_2025` | Traités du jeu de démonstration, millésime 2025 | excédent automobile 10 M xs 2,5 M ; quote-part incendie/MRH 35 % ; quote-part transport 50 % | FCFA ; % | démo (jeu de démonstration seulement) | FR-190 |
| `coassurance.somme_parts` | Somme des parts d'une clé de coassurance | 100 | % | démo | FR-191 |
| `etat_crca.seuil_grande_ampleur` | Seuil du drapeau « grande ampleur non clôturé » | à fixer avec la compagnie | FCFA | art. 422 (C10d) ; [ASSUMPTION] | FR-192 |
| `compta.table_comptes` | Table nature d'opération vers compte | table de la démo, à remplacer par le plan de comptes de la compagnie | table | démo (`arrete-comptable`) | FR-193 |
| `echange.sans_confirmation` | Délai au-delà duquel un envoi sans confirmation du LC alerte | 24 | heures | transposé de la microfinance [ASSUMPTION] | FR-196 |
| `declaration.format_reference` | Format de la référence de déclaration | DEC-AAAA-NNNNN | format | plan D3 | FR-198 |
| `sinistre.format_numero` | Format du numéro quand Prospera l'attribue | SIN-AAAA-NNNN | format | démo [ASSUMPTION] | FR-198 |
| `sinistre.longueur_numero_max` | Longueur maximale d'un numéro officiel reçu du LC | 40 | caractères | [ASSUMPTION] | FR-198 |
| `echange.saisie_delai` | Âge d'une ligne « à saisir » (hors déclaration) qui alerte | 72 | heures | transposé de la microfinance [ASSUMPTION] | FR-199 |
| `echange.age_max_ouverture` (alias : `age_max_lecture_contrats`, `LC_AGE_MAX_LECTURE_INTERFACE`, `LC_AGE_MAX_LECTURE_FICHIER`) | Âge maximal de la lecture d'une police pour ouvrir sans décision motivée | 24 | heures | [ASSUMPTION] | FR-3, FR-41, FR-201 |
| `echange.fraicheur_api` (alias : `assurance.fraicheur_lecture`) | Fraîcheur par défaut avec une API [l'alias assurance.fraicheur_lecture couvre aussi echange.fraicheur_fichier] | 5 | minutes | transposé de la microfinance [ASSUMPTION] | FR-186, FR-201 |
| `echange.fraicheur_fichier` | Fraîcheur par défaut avec des fichiers | à l'heure ou de nuit (avant 6 h) | — | transposé de la microfinance [ASSUMPTION] | FR-201 |
| `echange.perime_facteur` | Facteur de fraîcheur au-delà duquel une donnée est « périmée » | 2 | × fraîcheur | transposé de la microfinance [ASSUMPTION] | FR-201 |
| `fictif.delai_numero` | Délai simulé d'attribution du numéro par le LC fictif | 5 | secondes | [ASSUMPTION] | FR-203 |
| `brief.heure` | Heure de production du brief du matin | 07:00 | heure | [ASSUMPTION] | FR-208 |
| `veille.cheque_non_retire` | Ancienneté d'un chèque non retiré qui alerte | 14 | jours | démo | FR-208 |
| `veille.delai_restant` | Délai restant en dessous duquel un dossier inactif est critique | 2 | jours | démo (`surveillerPortefeuille`) | FR-208 |
| `veille.ecart_provision` | Écart provision / estimation d'expert qui lève une alerte | 30 | % | démo | FR-208, FR-209 |
| `veille.inactivite` | Inactivité qui rend critique un dossier à délai proche | 5 | jours | démo | FR-208 |
| `qualite.declaration_tardive` | Retard de déclaration qui lève un constat certain | 30 | jours | démo (`analyserCoherence`) | FR-209 |
| `qualite.provision_haute` | Provision supérieure à l'estimation avant expertise qui lève un constat | 150 | % | démo | FR-209 |
| `controle.amplitude` | Amplitude forte d'un dossier | 25 % ou 1 000 000 | % ; FCFA | démo | FR-210 |
| `controle.echantillon` | Taille de l'échantillon de revue par période | 12 | dossiers | démo (`audit-sensibles`) | FR-210 |
| `controle.sensible_ecart` | Écart évaluation / provision d'un dossier sensible | 500 000 et 1,5 fois | FCFA ; facteur | démo (`dossiers-sensibles`) | FR-210 |
| `crca.lot_delai` | Temps de production d'un dossier de contrôle de 100 dossiers | 30 | minutes | [ASSUMPTION] | FR-211 |
| `pilotage.actualisation` | Actualisation maximale des indicateurs | 5 | minutes | [ASSUMPTION] | FR-212 |
| `pilotage.aging_tranches` | Tranches d'ancienneté du stock actif | 7 ; 8-30 ; 31-90 ; plus de 90 | jours | démo (`controle-responsable`) | FR-213 |
| `reprise.fichiers_conservation` | Conservation des fichiers d'un lot courant après import réussi | 30 | jours | PRD Reprise FR-3 | FR-214 |
| `reprise.sources_jour1` | Sources lues au premier jour | fichiers Excel, CSV, JSON ; API quand la source en offre une | liste | PRD Reprise FR-1 ; plan D17 [ASSUMPTION] | FR-214 |
| `reprise.historique_cible` (alias : `IA_HISTORIQUE_MAX`) | Objectif de profondeur d'historique pour l'IA | 3 à 5 | ans | v2 [ASSUMPTION] | FR-215, FR-231 |
| `reprise.historique_min` (alias : `IA_HISTORIQUE_MIN`) | Profondeur d'historique en dessous de laquelle le rapport avertit | 3 | ans | PRD Reprise FR-9 | FR-215, FR-231 |
| `reprise.bascule_dossier` | Moment où un dossier devient « tenu par Prospera » | première action de dossier dans Prospera | règle | [ASSUMPTION] | FR-217 |
| `reprise.fin_parallele` | Date de fin du parallèle | fixée par la compagnie à la mise en service | date | PRD Reprise FR-17 [ASSUMPTION] | FR-217 |
| `reprise.resync_frequence` | Fréquence de la resynchronisation pendant le parallèle | chaque nuit | — | plan D17 | FR-217 |
| `reprise.resync_heure` | Heure limite de la resynchronisation nocturne | avant 6 h | heure | transposé de la microfinance [ASSUMPTION] | FR-217 |
| `reprise.valeurs_controle` | Valeurs de contrôle du feu vert | nombre de sinistres ouverts ; somme des provisions des sinistres ouverts ; nombre de polices en vigueur ; nombre de pièces rattachées | liste | [ASSUMPTION] | FR-218 |

### D.4 Modules partagés, IA et installation (partie 4, §7)

Paiement, notification, IA commune, installation, relais, support. Les valeurs reprises du PRD microfinance sont des `[ASSUMPTION]`.

| code | libellé | défaut | unité | source | FR |
|---|---|---|---|---|---|
| `PAIEMENT_DELAI_COUPURE` | Heure limite de validation d'un virement selon la banque | à saisir par banque | heure | [A] | FR-222 |
| `IA_CONSENTEMENT_ECARTS` | Envoi d'écarts anonymisés à l'IA commune | non (tant que la compagnie n'a pas consenti) | oui/non | décision PO, plan D1 | FR-230, FR-232 |
| `IA_NIVEAU_APPRENTISSAGE` | Niveau d'apprentissage choisi par la compagnie | celui que le PRD moteur ouvre | liste | PRD moteur | FR-230 |
| `IA_RAPPORT_PERIODE` | Période du rapport de performance de l'IA | 1 | mois | proposition v2 | FR-231 |
| `IA_REENTRAINEMENT_PERIODE` | Période de réentraînement | 1 | mois | proposition v2 | FR-231 |
| `IA_ECARTS_SANTE` | Envoi d'écarts issus d'une donnée de santé | jamais | — | décision PO (aucune donnée médicale ne sort) | FR-232 |
| `CORRECTIF_SECURITE_DELAI` | Délai d'acceptation d'un correctif de sécurité critique | 72 | heures | [A] modèle microfinance | FR-235 |
| `COUPURE_MAJ_MAX` | Coupure maximale d'une mise à jour | 15 | minutes | PRD moteur NFR-9 | FR-235 |
| `GEL_SANS_CONTACT` | Gel après absence de contact avec Money Vibes | 30 | jours | PRD moteur FR-15 [A] | FR-235 |
| `RESTAURATION_TEST_PERIODE` (alias : `nas.test_restauration`) | Période du test de restauration | 1 | mois | [A] modèle microfinance | FR-176, FR-236 |
| `RPO / RTO` | Perte maximale de données / durée maximale de reprise | 1 h / 4 h | heures | PRD moteur NFR-7 ; point non tranché | FR-236 |
| `SAUVEGARDE_FREQUENCE` (alias : `nas.sauvegarde`) | Fréquence de la sauvegarde automatique | 1 | jour | proposition v2 | FR-176, FR-236 |
| `ADMIN_DEUX_PERSONNES` | Création d'un administrateur ou d'un droit d'instance par deux personnes | oui | oui/non | [A] modèle microfinance | FR-238 |
| `RELAIS_INTERROGATION` | Fréquence d'interrogation du relais | 1 | minute | [A] modèle microfinance | FR-239 |
| `RELAIS_PURGE` | Purge d'un événement du relais après tirage | 7 | jours | [A] modèle microfinance | FR-239 |
| `DISPONIBILITE_CIBLE` | Objectif de disponibilité en temps ouvré (sans engagement) | 99,5 | % | [A] modèle microfinance | FR-246 |
| `SUPPORT_PRISE_EN_CHARGE_BLOQUANTE` | Prise en charge d'une anomalie bloquante | 4 | heures ouvrées | proposition v2, offre v4 | FR-246 |

### D.5 Référentiel légal (non modifiable par la compagnie)

Valeurs du Code CIMA (texte lu, SÛR) et de la réglementation. La compagnie **ne les modifie pas** : un correctif est livré comme mise à jour de référentiel, versionné avec date d'effet (FR-14, FR-235) ; un dossier est jugé selon la version en vigueur à sa date de survenance. Seules la valeur du SMIG daté et les tables du barème corporel se saisissent, avec leur source et une double saisie (FR-70). Plancher de conservation : art. 404 du Code CIMA.

| code | libellé | défaut | unité | source | FR |
|---|---|---|---|---|---|
| `FGA_ACTIF` (alias : `recours.fga_active`) | Un fonds de garantie automobile existe-t-il au Togo | non | oui/non | [A] existence non confirmée | FR-14, FR-111 |
| `REF_PRESCRIPTION_CONTRAT` (alias : `recours.prescription_jours`) | Prescription de l'action dérivant du contrat (terme à vérifier) | 2 | ans | Code CIMA art. 28 (SÛR), non modifiable | FR-14, FR-118 |
| `REF_PRESCRIPTION_RC` | Prescription de l'action en responsabilité civile (terme à vérifier) | 5 | ans | Code CIMA art. 256 (SÛR), non modifiable | FR-14 |
| `plancher_delai_declaration` | Plancher légal du délai de déclaration : 5 jours ouvrés ; 48 heures pour le vol (RÈGLEMENTAIRE, art. 12-4° et 20) | 5 ; 48 h | jour ouvré ; heure | CIMA | FR-43 |
| `delai_rapport_medical_jours` | Transmission du rapport médical après l'examen (RÈGLEMENTAIRE, art. 245) | 20 | jour | CIMA | FR-63 |
| `preavis_convocation_examen_jours` | Préavis minimal de convocation à l'examen médical (RÈGLEMENTAIRE, art. 244) | 15 | jour | CIMA | FR-63 |
| `qualification_expert` | Qualification exigée (RÈGLEMENTAIRE, art. 272) : expert judiciaire inscrit, ou diplômes appropriés, ou 5 ans d'activité | 5 | ans | CIMA | FR-63 |
| `delai_creance_tiers_payeur_mois` | Délai de production de la créance d'un tiers payeur avant déchéance (RÈGLEMENTAIRE, art. 254-255) | 6 | mois | CIMA | FR-70 |
| `avis_juge_tutelles_jours` (alias : `reglement.avis_tutelle_jours`) | Avis au juge des tutelles avant paiement à un représentant légal (RÈGLEMENTAIRE, art. 234) | 15 | jour | CIMA | FR-86, FR-91 |
| `legal.arbitrage_sentence_mois` | Arbitrage entre assureurs : sentence dans | 1 | mois | Code CIMA art. 276 (SÛR) | FR-119, FR-141 |
| `legal.demande_motivee_jours` (alias : `REF_DELAI_DEMANDE_MOTIVEE`, `delai_reponse_demande_motivee_jours`) | Réponse à la demande motivée de la victime (RÉGLEMENTAIRE) | 30 | jours | Code CIMA art. 231 al. 7 (SÛR) | FR-14, FR-85, FR-141 |
| `legal.denonciation_jours` (alias : `REF_DELAI_DENONCIATION`, `delai_denonciation_transaction_jours`) | Dénonciation de la transaction (RÉGLEMENTAIRE) | 15 | jours | Code CIMA art. 235 (SÛR) | FR-14, FR-82, FR-86, FR-141 |
| `legal.etranger_mois` | Victime résidant à l étranger : prorogation (RÉGLEMENTAIRE) | 1 | mois | Code CIMA art. 253 (SÛR) | FR-141 |
| `legal.expert_commun_mois` | Expert commun : prorogation (RÉGLEMENTAIRE) | 1 | mois | Code CIMA art. 252, 252 bis (SÛR) | FR-141 |
| `legal.fga_declaration_mois` (alias : `FGA_DELAI_DECLARATION`) | FGA : déclaration au fonds après la réclamation (si FGA activé) | 3 | mois | Code CIMA art. 608 (SÛR) | FR-14, FR-141 |
| `legal.fga_pv_jours` | FGA : procès-verbal transmis dans (si FGA activé) | 60 | jours | Code CIMA art. 606 (SÛR) | FR-141 |
| `legal.fga_transaction_mois` | FGA : notification d une transaction avec un responsable non assuré | 1 | mois | Code CIMA art. 605 (SÛR) | FR-141 |
| `legal.nouvelle_demande_mois` | Réponse incomplète : nouvelle demande dans (RÉGLEMENTAIRE) | 1 | mois | Code CIMA art. 251 (SÛR) | FR-141 |
| `legal.offre_corporel_mois` (alias : `REF_DELAI_OFFRE_ACCIDENT`, `delai_offre_corporel_mois`) | Offre corporel automobile depuis l accident (RÉGLEMENTAIRE, non modifiable) | 12 | mois | Code CIMA art. 231 (SÛR) | FR-14, FR-85, FR-141 |
| `legal.offre_deces_mois` (alias : `REF_DELAI_OFFRE_DECES`, `delai_offre_deces_mois`) | Offre aux ayants droit depuis le décès (RÉGLEMENTAIRE) | 8 | mois | Code CIMA art. 231, 265-266 (SÛR) | FR-14, FR-85, FR-141 |
| `legal.offre_definitive_mois` (alias : `REF_DELAI_OFFRE_APRES_CONSOLIDATION`) | Offre définitive après information de consolidation (RÉGLEMENTAIRE) | 6 | mois | Code CIMA art. 231 al. 5 (SÛR) | FR-14, FR-141 |
| `legal.paiement_apres_denonciation_mois` (alias : `REF_DELAI_PAIEMENT_APRES_DENONCIATION`) | Paiement des sommes convenues après la fin de la dénonciation (RÉGLEMENTAIRE) | 1 | mois | Code CIMA art. 235 (SÛR) | FR-14, FR-141 |
| `legal.penalite_pct_par_mois` (alias : `REF_PENALITE_RETARD`, `penalite_retard_pct_mois`) | Intérêt de retard (offre tardive, paiement tardif) (RÉGLEMENTAIRE) | 5 | % par mois | Code CIMA art. 233, 236 (SÛR) | FR-14, FR-85, FR-141 |
| `legal.provisionnelle_mois` (alias : `REF_CONSOLIDATION_INFO`, `delai_consolidation_mois`) | Consolidation non connue : offre provisionnelle possible à partir de (RÉGLEMENTAIRE) | 6 | mois | Code CIMA art. 231 al. 5 (SÛR) | FR-14, FR-85, FR-141 |
| `legal.suspension_avis_mois` (alias : `suspensions_delai_offre`) | Assureur non avisé : suspension à l expiration d un mois (RÉGLEMENTAIRE) | 1 | mois | Code CIMA art. 247 (SÛR) | FR-85, FR-141 |
| `legal.suspension_pieces_semaines` (alias : `REF_SUSPENSION_PIECES`) | Pièces non reçues : suspension après (RÉGLEMENTAIRE) | 6 | semaines | Code CIMA art. 249-250 (SÛR) | FR-14, FR-141 |
| `bareme_medical_ip` | Barème médical d'incapacité permanente (annexe du Livre II) | à numériser | table | CIMA (D21) | FR-70 |
| `echelle_souffrance_esthetique` | Échelle de souffrance et de préjudice esthétique en % du SMIG annuel (art. 262) : très léger 5 ; léger 10 ; modéré 20 ; moyen 40 ; assez important 60 ; important 100 ; très important 150 ; exceptionnel 300 | valeurs du Code | % du SMIG annuel | CIMA | FR-70 |
| `moral_deces_pct_smig` | Préjudice moral par bénéficiaire du décès (art. 266) : conjoint 150 ; enfant mineur 100 ; enfant majeur 75 ; ascendant 75 ; frère ou sœur 50 | valeurs du Code | % du SMIG annuel | CIMA | FR-70 |
| `plafonds_corporel_multiples_smig` | Plafonds en multiples du SMIG annuel (RÈGLEMENTAIRES, art. 259 à 266) : incapacité temporaire mensuelle 6 ; préjudice économique d'incapacité permanente 10 (si taux ≥ 50 %) ; préjudice moral 2 (si taux ≥ 80 %) ; gains futurs 36 ; frais funéraires 2 ; ayants droit du décédé 85 au total ; moral des bénéficiaires du décès 20 au total ; tierce personne 50 % de l'incapacité (si taux ≥ 80 %) | valeurs du Code | multiple | CIMA | FR-70 |
| `smig_annuel_multiplicateur` | SMIG annuel = mensuel x | 12 | mois | ASSUMPTION | FR-70 |
| `smig_togo_mensuel` | SMIG du Togo, paramètre daté (pays de l'accident, ou de résidence s'il est plus élevé) | 52 500 depuis le 01/01/2023 (PROBABLE, sources secondaires) | FCFA par mois | CIMA (principe), ASSUMPTION (valeur) | FR-70 |
| `table_conversion_rentes` | Table de conversion des rentes | à saisir | table | CIMA (D21) | FR-70 |
| `table_repartition_ayants_droit` | Clés de répartition entre ayants droit (art. 265) | à saisir (valeurs lisibles partiellement, à valider) | table | CIMA (D21) | FR-70 |
| `table_valeur_point_ipp` | Valeur du point d'incapacité permanente par taux et par âge (art. 260) | à saisir depuis l'image du PDF officiel, double saisie | table | CIMA (D21) | FR-70 |
| `conservation.depart` | Point de départ de la durée | date de clôture | règle | démo ; [ASSUMPTION] (juriste, point 11) | FR-174 |
| `conservation.plancher` (alias : `CONSERV_DOSSIER_DEFAUT`, `dossier.conservation_ans`) | Durée minimale de conservation | 10 | ans | art. 404 (SÛR) ; plan D17 | FR-21, FR-105, FR-174 |

### Conflits résolus

Chaque ligne donne la valeur **gardée** (celle de la FR qui définit le paramètre), la valeur **écartée** et la raison.

| paramètre | valeur gardée | valeur écartée | pourquoi |
|---|---|---|---|
| `echange.age_max_ouverture` (alias `LC_AGE_MAX_LECTURE_INTERFACE`, `LC_AGE_MAX_LECTURE_FICHIER`, `age_max_lecture_contrats`) | 24 heures (FR-201, FR-198) | 15 minutes avec une interface et 1 jour avec des fichiers (FR-3, `[A]` modèle microfinance) ; « à définir, aucun défaut chiffré » (FR-41) | FR-201 définit l'âge maximal de la lecture d'une police pour ouvrir un dossier. L'avertissement « données du … » est déjà porté par la fraîcheur (5 minutes avec une API, heure ou nuit avec des fichiers) et par le seuil « périmé » (le double, `echange.perime_facteur`) : trois seuils pour le même sens se contrediraient. |
| `RESTAURATION_TEST_PERIODE` (alias `nas.test_restauration`) | 1 mois (FR-236, installation) | annuelle, plus un test avant la mise en service (FR-176, NAS de la GED) | FR-236 fixe la politique de sauvegarde et de restauration de toute l'installation. L'« au moins une fois par an » de FR-176 est un plancher compatible, pas une valeur concurrente ; le test avant la mise en service reste exigé. |
| `expert.delai_rapport.auto_materiel` (alias `DELAI_RAPPORT_EXPERT`, `delai_rapport_expert_jours`) | 7 jours (FR-184, une valeur par domaine) | 7 à 10 jours (mémoire 2014, FR-14) | FR-184 est la FR qui définit les délais par domaine ; la fourchette du mémoire décrit la pratique d'une autre compagnie du groupe, à confirmer pour le Togo. |
| `delegation_responsable_max_fcfa` (alias `DELEG_SEUIL_RESP`) | 1 000 000 FCFA pour le responsable sinistres ; comité sinistres au-delà, puis visa du directeur technique ; direction générale seule pour un règlement à titre commercial (D8, FR-8, FR-78) | 2 000 000 FCFA, seuil unique de validation de la démo | La démo n'a qu'un seuil ; D8 le remplace par une matrice à plusieurs niveaux (FR-78, écarts relevés). Le chiffre 2 000 000 FCFA survit ailleurs, comme **autre** paramètre : l'écart de provision qui attend le responsable (`provision.ecart_validation`, FR-188). |
| `conservation.materiel`, `conservation.risques_divers`, `conservation.sans_suite_refuse` | 10 ans, point de départ la clôture (FR-174, art. 404 du Code CIMA, plancher de `conservation.plancher`) | 5 ans (code de la démo) | Une durée inférieure au plancher légal n'est pas acceptée par le formulaire (FR-174) ; les 5 ans de la démo ne s'appliquent que si le juriste le confirme (D21). Le sinistre mortel garde 30 ans, définitifs. |
| `decompte.ordre` | dommage, vétusté, règle proportionnelle, plafond, franchise ; la franchise est déduite du montant arrêté (FR-69, code de la démo) | franchise appliquée avant la règle proportionnelle (rédaction initiale de D15 dans le plan) | D15 a été corrigé le 2026-11-13 d'après le code de la démo et la pratique ; FR-69, FR-75, FR-134 et le vocabulaire (§3) portent l'ordre retenu. |

