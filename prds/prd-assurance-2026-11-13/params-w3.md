# Paramètres W3 (§5.8 à §5.15) — code | libellé | défaut | unité | source | FR

| code | libellé | défaut | unité | source | FR |
|---|---|---|---|---|---|
| reglement.delai_paiement_heures | Paiement après accord (cible interne) | 72 | heures | mémoire 2014 (D7) | FR-102 |
| reglement.alerte_avant_echeance_heures | Alerte jaune avant la cible de paiement | 48 | heures | [ASSUMPTION] | FR-102 |
| reglement.attendre_fin_denonciation | Au corporel automobile, ne pas émettre avant la fin du délai de dénonciation | OUI | oui/non | [ASSUMPTION] | FR-102 |
| reglement.plafond_especes | Plafond d'un règlement en espèces (par règlement et par bénéficiaire, cumul sur 30 j) | 500000 | FCFA | démo PLAFOND_ESPECES, D11 | FR-98 |
| reglement.fenetre_cumul_especes_jours | Fenêtre de cumul du plafond espèces | 30 | jours | [ASSUMPTION] | FR-98 |
| reglement.fenetre_coordonnees_jours | Changement de coordonnées avant paiement = alerte | 5 | jours | démo FENETRE_COORDONNEES_JOURS | FR-100 |
| reglement.fenetre_doublon_jours | Fenêtre de détection du doublon de règlement | 30 | jours | démo | FR-100 |
| reglement.part_concentration_pct | Part du volume émis par un même comptable déclenchant l'alerte | 60 | % | démo PART_CONCENTRATION | FR-100 |
| reglement.seuil_cumul_lbc | Cumul par bénéficiaire déclenchant l'alerte LBC/FT | (vide, alerte inactive) | FCFA | [ASSUMPTION] valeur nationale non lue | FR-100 |
| reglement.cheque_relance_jours | Chèque non retiré : relance | 7 | jours | démo RELANCE_GUICHET_JOURS | FR-101 |
| reglement.cheque_circulation_longue_jours | Chèque non retiré : circulation longue | 21 | jours | démo | FR-101 |
| reglement.cheque_exposition_jours | Chèque non retiré : exposition | 30 | jours | démo DELAI_GUICHET_JOURS | FR-101 |
| reglement.ecart_rapprochement_jours | Écart de rapprochement ancien = alerte (dans `paiement`) | 60 | jours | démo, D16 | FR-95 |
| reglement.gabarit_lettre_cheque | Gabarit de lettre-chèque de la compagnie | aucun (remplissage manuel) | fichier | [ASSUMPTION] | FR-94 |
| reglement.signature_electronique_quittance | Acceptation électronique de la quittance par code à usage unique | désactivée | oui/non | D11, D21 | FR-96 |
| reglement.code_usage_unique_minutes | Validité du code à usage unique | 10 | minutes | [ASSUMPTION] | FR-96 |
| reglement.operateurs_mobile_money | Opérateurs Mobile Money autorisés | T-Money, Flooz | liste | D11 | FR-95 |
| reglement.avis_tutelle_jours | Avis au juge des tutelles avant paiement à un mineur | 15 | jours | Code CIMA art. 234 (SÛR, réglementaire) | FR-91 |
| reglement.honoraires_motif_au_dela_lettre | Visa d'honoraires : motif exigé au-delà de la lettre de mission | OUI | oui/non | démo | FR-90 |
| dossier.delai_versement_jours | Délai de versement aux archives après clôture | 75 | jours | démo DELAI_VERSEMENT_JOURS | FR-105 |
| dossier.restitution_chemise_jours | Restitution d une chemise papier sortie (réouverture) | 15 | jours | démo JOURS_RESTITUTION, D17 | FR-107 |
| dossier.motif_min_caracteres | Longueur minimale d un motif écrit | 10 | caractères | démo (décision de garantie) | FR-99, FR-104 |
| dossier.conservation_ans | Conservation minimale du dossier (durées par nature en §6.2) | 10 | ans | Code CIMA art. 404 (SÛR), D17 | FR-105 |
| recours.relance_jours | Relance du recours tant que sans réponse puis jusqu au recouvrement | 15 | jours | mémoire 2014, D10 | FR-110 |
| recours.delai_reclamation_apres_paiement_jours | Réclamation du remboursement après paiement de l assuré | 30 | jours | démo (délai de transmission) | FR-111 |
| recours.delai_lettre_mise_en_cause_jours_ouvres | Envoi de la lettre de mise en cause après ouverture | 5 | jours ouvrés | [ASSUMPTION] | FR-109 |
| recours.sans_action_jours | Recours sans action = alerte | 30 | jours | démo | FR-108 |
| recours.nouveau_non_traite_jours | Nouveau recours non traité = alerte | 60 | jours | démo | FR-108 |
| recours.creance_ancienne_jours | Créance non soldée ancienne = alerte | 90 | jours | démo | FR-113 |
| recours.delai_mise_en_demeure_jours | Délai accordé au débiteur par la mise en demeure | 30 | jours | démo | FR-114 |
| recours.prescription_jours | Terme indicatif de prescription depuis la survenance | 730 | jours | démo, [ASSUMPTION] | FR-118 |
| recours.alerte_prescription_jours | Alerte avant le terme indicatif | 90 | jours | démo | FR-118 |
| recours.inclure_honoraires_base | Honoraires d expert inclus dans la base du montant réclamé | NON | oui/non | [ASSUMPTION] | FR-113 |
| recours.ecart_accord_rapide_pct | Écart à l offre : accord rapide jusqu à | 15 | % | démo | FR-120 |
| recours.ecart_negociable_pct | Écart à l offre : négociable jusqu à | 35 | % | démo | FR-120 |
| recours.contre_proposition_formule | Contre-proposition : max(offre x 1,15 ; moyenne offre et réclamé ; 80 % du réclamé) | formule démo | formule | démo | FR-120 |
| recours.arbitrage_obligatoire | Arbitrage inter-assureurs activé (art. 276) | OUI (à vérifier) | oui/non | Code CIMA art. 276 (SÛR), [ASSUMPTION] | FR-119 |
| recours.convention_active | Convention de place active (indemnisation directe, forfait) | NON | oui/non | [ASSUMPTION] | FR-119 |
| recours.convention_forfait | Forfait inter-compagnies (valeur d exemple) | 350000 | FCFA | démo R1 | FR-119 |
| recours.convention_delai_reglement_jours | Délai de règlement entre compagnies sous convention | (vide) | jours | recherche (exemple 30 j, non togolais) | FR-119 |
| recours.seuil_perte_validation_direction | Perte sur créance exigeant la validation DG ou DT | (vide) | FCFA | [ASSUMPTION] | FR-115 |
| recours.fga_active | Fonds de garantie automobile activé pour le pays | NON | oui/non | Code CIMA art. 600 s. (SÛR), Togo non confirmé | FR-111 |
| sortie.delai_decision_refus_heures | Décision de refus soumise au responsable ou à la direction | 48 | heures | mémoire 2014 (D7) | FR-121 |
| sortie.delai_information_refus_jours_ouvres | Courrier de refus envoyé après la décision | 2 | jours ouvrés | mémoire 2014 (72 h), [ASSUMPTION] | FR-121 |
| sortie.relances_avant_sans_suite | Relances sans effet avant classement sans suite | 3 | relances | démo RELANCES_SANS_EFFET | FR-123 |
| sortie.canaux_min_sans_suite | Canaux de relance distincts avant classement | 2 | canaux | [ASSUMPTION] | FR-123 |
| sortie.attente_apres_derniere_relance_jours | Attente après la dernière relance avant classement | 15 | jours | démo (3e relance) , [ASSUMPTION] | FR-123 |
| sortie.sans_suite_corporel_decision_direction | Classement sans suite d un corporel automobile réservé à la direction | OUI | oui/non | Code CIMA art. 231 (SÛR), [ASSUMPTION] | FR-123 |
| sortie.delai_grace_versement_sans_suite_jours | Délai avant versement aux archives d un dossier sans suite | 30 | jours | [ASSUMPTION] | FR-123 |
| sortie.ecart_provision_attente_responsable | Écart de provision attendant le responsable | 2000000 | FCFA | démo | FR-124 |
| sortie.reouvertures_alerte | Nombre de réouvertures déclenchant l alerte au contrôle interne | 3 | réouvertures | [ASSUMPTION] | FR-126 |
| fraude.poids.contrat_non_actif | Poids du signal CONTRAT_NON_ACTIF | 40 | points | démo | FR-127 |
| fraude.poids.sinistre_precoce | Poids du signal SINISTRE_PRECOCE | 30 | points | démo | FR-127 |
| fraude.poids.incoherence_dates | Poids du signal INCOHERENCE_DATES | 30 | points | démo | FR-127 |
| fraude.poids.sinistres_repetes | Poids du signal SINISTRES_REPETES | 25 | points | démo | FR-127 |
| fraude.poids.montant_atypique | Poids du signal MONTANT_ATYPIQUE | 20 | points | démo | FR-127 |
| fraude.poids.vehicule_recurrent | Poids du signal VEHICULE_RECURRENT | 20 | points | démo | FR-127 |
| fraude.poids.beneficiaire_multiple | Poids du signal BENEFICIAIRE_MULTIPLE | 15 | points | démo | FR-127 |
| fraude.poids.telephone_partage | Poids du signal TELEPHONE_PARTAGE | 15 | points | démo | FR-127 |
| fraude.poids.declaration_tardive | Poids du signal DECLARATION_TARDIVE | 10 | points | démo | FR-127 |
| fraude.seuil.sinistre_precoce_jours | Sinistre précoce après la prise d effet | 30 | jours | démo | FR-127 |
| fraude.seuil.sinistres_repetes | Nombre de sinistres sur la police | 3 | sinistres | démo | FR-127 |
| fraude.seuil.montant_atypique_coefficient | Évaluation / coût moyen de la branche | 4 | x | démo | FR-127 |
| fraude.seuil.vehicule_recurrent | Dossiers sur la même immatriculation | 3 | dossiers | démo | FR-127 |
| fraude.seuil.beneficiaire_multiple | Dossiers pour le même bénéficiaire | 3 | dossiers | démo | FR-127 |
| fraude.seuil.telephone_partage | Assurés sur le même téléphone | 3 | assurés | démo | FR-127 |
| fraude.seuil.declaration_tardive_jours | Déclaration tardive | 45 | jours | démo | FR-127 |
| fraude.plafond_score | Plafond du score | 100 | points | démo | FR-128 |
| fraude.niveau.attention | Seuil du niveau ATTENTION | 20 | points | démo | FR-128 |
| fraude.niveau.suspect | Seuil du niveau SUSPECT (ouvre la revue) | 45 | points | démo, [ASSUMPTION] pour l ouverture de revue | FR-128 |
| fraude.niveau.bloque | Seuil du niveau BLOQUE (suspend ordre et paiement) | 70 | points | démo | FR-128 |
| fraude.delai_revue_bloque_jours_ouvres | Dossier BLOQUE non revu = alerte | 3 | jours ouvrés | [ASSUMPTION] | FR-129 |
| fraude.tranches_anciennete_jours | Tranches d ancienneté des revues | 7 / 30 / 90 | jours | démo | FR-131 |
| fraude.fenetre_graphe_mois | Fenêtre du graphe de liens | 12 | mois | démo (portefeuille 12 mois) | FR-132 |
| fraude.garage_ecart_marche_pct | Devis de garage au-dessus de la moyenne du marché | 20 | % | démo | FR-132 |
| fraude.garage_dossiers_min | Dossiers minimum pour signaler un garage | 5 | dossiers | [ASSUMPTION] | FR-132 |
| delais.alerte_legale_jours | Alerte avant une échéance réglementaire | 45 | jours | démo (veille : offre corporelle à présenter dans 45 j) | FR-140 |
| delais.alerte_interne_pct | Alerte à la part du délai interne écoulée | 85 | % | démo (seuil d alerte délai) | FR-140 |
| legal.offre_corporel_mois | Offre corporel automobile depuis l accident (RÉGLEMENTAIRE, non modifiable) | 12 | mois | Code CIMA art. 231 (SÛR) | FR-141 |
| legal.offre_deces_mois | Offre aux ayants droit depuis le décès (RÉGLEMENTAIRE) | 8 | mois | Code CIMA art. 231, 265-266 (SÛR) | FR-141 |
| legal.provisionnelle_mois | Consolidation non connue : offre provisionnelle possible à partir de (RÉGLEMENTAIRE) | 6 | mois | Code CIMA art. 231 al. 5 (SÛR) | FR-141 |
| legal.offre_definitive_mois | Offre définitive après information de consolidation (RÉGLEMENTAIRE) | 6 | mois | Code CIMA art. 231 al. 5 (SÛR) | FR-141 |
| legal.demande_motivee_jours | Réponse à la demande motivée de la victime (RÉGLEMENTAIRE) | 30 | jours | Code CIMA art. 231 al. 7 (SÛR) | FR-141 |
| legal.denonciation_jours | Dénonciation de la transaction (RÉGLEMENTAIRE) | 15 | jours | Code CIMA art. 235 (SÛR) | FR-141 |
| legal.paiement_apres_denonciation_mois | Paiement des sommes convenues après la fin de la dénonciation (RÉGLEMENTAIRE) | 1 | mois | Code CIMA art. 235 (SÛR) | FR-141 |
| legal.penalite_pct_par_mois | Intérêt de retard (offre tardive, paiement tardif) (RÉGLEMENTAIRE) | 5 | % par mois | Code CIMA art. 233, 236 (SÛR) | FR-141 |
| legal.suspension_avis_mois | Assureur non avisé : suspension à l expiration d un mois (RÉGLEMENTAIRE) | 1 | mois | Code CIMA art. 247 (SÛR) | FR-141 |
| legal.suspension_pieces_semaines | Pièces non reçues : suspension après (RÉGLEMENTAIRE) | 6 | semaines | Code CIMA art. 249-250 (SÛR) | FR-141 |
| legal.nouvelle_demande_mois | Réponse incomplète : nouvelle demande dans (RÉGLEMENTAIRE) | 1 | mois | Code CIMA art. 251 (SÛR) | FR-141 |
| legal.expert_commun_mois | Expert commun : prorogation (RÉGLEMENTAIRE) | 1 | mois | Code CIMA art. 252, 252 bis (SÛR) | FR-141 |
| legal.etranger_mois | Victime résidant à l étranger : prorogation (RÉGLEMENTAIRE) | 1 | mois | Code CIMA art. 253 (SÛR) | FR-141 |
| legal.fga_pv_jours | FGA : procès-verbal transmis dans (si FGA activé) | 60 | jours | Code CIMA art. 606 (SÛR) | FR-141 |
| legal.fga_declaration_mois | FGA : déclaration au fonds après la réclamation (si FGA activé) | 3 | mois | Code CIMA art. 608 (SÛR) | FR-141 |
| legal.fga_transaction_mois | FGA : notification d une transaction avec un responsable non assuré | 1 | mois | Code CIMA art. 605 (SÛR) | FR-141 |
| legal.arbitrage_sentence_mois | Arbitrage entre assureurs : sentence dans | 1 | mois | Code CIMA art. 276 (SÛR) | FR-119, FR-141 |
| delais.accuse_reception_jours | Accusé de réception | 10 | jours | démo (§3.7) | FR-142 |
| delais.numero_officiel_jours_ouvres | Numéro de sinistre officiel attendu | 1 | jour ouvré | D3 | FR-142 |
| delais.offre_corporel_jours | Offre interne, corporel (départ : dossier complet) | 90 | jours | démo (§3.7) | FR-142 |
| delais.offre_materiel_jours | Offre interne, matériel | 60 | jours | démo | FR-142 |
| delais.offre_autres_jours | Offre interne, autres branches | 75 | jours | démo | FR-142 |
| delais.offre_envoi_heures | Offre validée envoyée sous | 48 | heures | mémoire 2014, D6 | FR-142 |
| delais.offre_relance_jours | Offre sans réponse : relance | 15 | jours | D6 | FR-142 |
| delais.offre_alerte_jours | Offre sans réponse : alerte au responsable | 30 | jours | D6 | FR-142 |
| delais.reglement_corporel_jours | Règlement après accord, limite interne, corporel | 45 | jours | démo | FR-142 |
| delais.reglement_materiel_jours | Règlement après accord, limite interne, matériel | 30 | jours | démo | FR-142 |
| delais.reglement_autres_jours | Règlement après accord, limite interne, autres | 30 | jours | démo | FR-142 |
| delais.sla_corporel_jours | Délai de traitement du volet corporel | 45 | jours | démo SLA_PAR_VOLET | FR-142 |
| delais.sla_materiel_jours | Délai de traitement du volet matériel | 21 | jours | démo | FR-142 |
| delais.sla_risques_divers_jours | Délai de traitement du volet risques divers | 30 | jours | démo | FR-142 |
| delais.sla_recours_jours | Délai de traitement du volet recours | 90 | jours | démo | FR-142 |
| relance.intervalle_jours | Intervalle entre deux relances d un même interlocuteur | 5 | jours | démo DELAI_ENTRE_RELANCES | FR-143 |
| relance.sans_effet_max | Relances sans effet avant proposition d arbitrage | 3 | relances | démo RELANCES_SANS_EFFET | FR-143 |
| relance.canaux | Canaux de relance | appel, SMS, e-mail, WhatsApp, courrier | liste | démo CanalRelance | FR-143 |
| muet.a_surveiller_jours | Dossier sans action : à surveiller | 8 | jours | démo | FR-144 |
| muet.a_relancer_jours | Dossier sans action : à relancer | 15 | jours | démo | FR-144 |
| muet.muet_jours | Dossier sans action : muet | 30 | jours | démo | FR-144 |
| muet.agent_sans_trace_jours | Agent sans trace d écriture | 10 | jours | démo | FR-144 |
| pieces.bloquante_jours | Pièce bloquante en attente = alerte | 30 | jours | démo JOURS_PIECES_BLOQUANTES | FR-145 |
| notif.canal_defaut_assure | Canal de notification par défaut de l assuré | SMS | canal | [ASSUMPTION] | FR-146 |
| notif.alerte_offre_a_envoyer_heures | Alerte au responsable avant la fin des 48 h d envoi de l offre | 24 | heures | [ASSUMPTION] | FR-146 |
