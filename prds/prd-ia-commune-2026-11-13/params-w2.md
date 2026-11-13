# Paramètres — partie W2 (§5 à §9, FR-30 à FR-89)

Format : code | libellé | défaut | unité | source | FR. Source : PO = récit du PO ; D = décision du plan ; MOT = spine du moteur ; REC = recherche du 2026-11-13 ; ASSUMPTION = défaut posé par ce PRD, à confirmer. « par capacité » = valeur dans la fiche de la capacité (annexe D).

| code | libellé | défaut | unité | source | FR |
|---|---|---|---|---|---|
| ia.iso_delai_max_pct | Allongement maximal du délai d'une organisation causé par la saturation d'une autre | 20 | % | ASSUMPTION | FR-31 |
| ia.delai_reponse_max_s | Plafond de réponse d'une capacité avant « indisponible » | 10 (langage : 60) | s | ASSUMPTION | FR-40 |
| ia.retention_contenu_passerelle_jours | Conservation du contenu masqué d'un envoi (audit) | 30 | jour | ASSUMPTION | FR-34 |
| ia.retention_contexte_brut_jours | Conservation du contexte brut d'une demande de langage | 7 | jour | ASSUMPTION (aligné sur l'assistant : échéance courte) | FR-38 |
| ia.licence_modele_verifiee | Licence du modèle ouvert vérifiée avant entrée au catalogue | obligatoire | oui/non | REC | FR-35 |
| palier_ia (P0, P1, P2) | Paliers d'empreinte : calcul, mémoire, mémoire graphique, disque, latence, débit | à mesurer avant le premier devis | table | ASSUMPTION | FR-41 |
| ia.age_max_source_jours | Âge au-delà duquel une source est « ancienne » | 90 | jour | D (assistant, microfinance) | FR-55 |
| ia.confiance_min | Seuil de confiance sous lequel l'IA dit qu'elle ne sait pas | par capacité | % | ASSUMPTION | FR-49 |
| seuil_n2 (volume, durée, gain) | Seuil de passage au N2 | par capacité | exemples ; jour ; points | D6, ASSUMPTION | FR-48 |
| ia.recalibration_heure | Heure de la recalibration nocturne | 02:00 | heure locale | ASSUMPTION | FR-59 |
| ia.recalibration_borne_pct | Variation maximale d'un paramètre de calibration par nuit | par capacité (défaut 5) | % | ASSUMPTION | FR-59 |
| ia.recalibration_cpu_max_pct | Part de calcul maximale en heures ouvrées | 20 | % | ASSUMPTION | FR-59 |
| ia.calibrations_conservees | Calibrations conservées après remplacement | 3 (et au moins 7 jours) | versions | MOT (7 jours) ; ASSUMPTION | FR-60 |
| ia.cadence_entrainement_jours_min | Intervalle minimal entre deux tournées d'entraînement d'une ligne | 7 | jour | D7 | FR-62 |
| ia.cadence_publication_jours_min | Intervalle minimal entre deux publications atteignant une instance | 7 | jour | MOT (fenêtre 7 jours) | FR-63 |
| ia.duree_ombre_jours | Durée de l'ombre | 14 | jour | ASSUMPTION | FR-64 |
| ia.part_canari_pct | Part des demandes servie par le canari | 5 | % | REC (1 à 5 %) | FR-64 |
| ia.interrupteur_date_limite_jours | Date limite d'un interrupteur de changement | 30 | jour | MOT | FR-66 |
| ia.retour_arriere_max_min | Durée maximale d'un retour arrière de modèle | 15 | minute | MOT | FR-67 |
| ia.retour_arriere_conservation_jours | Conservation du modèle et de la calibration précédents | 7 | jour | MOT | FR-67 |
| ia.acceptation_facade_pct | Taux d'acceptation sur 30 jours signalant une validation de façade | 90 | % | assistant (CM-1) | FR-68 |
| ia.eval_min_exemples | Exemples minimaux pour évaluer un challenger | par capacité | exemples | ASSUMPTION | FR-69 |
| ia.equite_ecart_max_pts | Dégradation d'équité maximale | par capacité (défaut 2) | points | ASSUMPTION | FR-70 |
| ia.k_min | Effectif minimal d'un groupe ou d'organisations | 5 | personnes / organisations | MOT (A-10) | FR-70, FR-72, FR-75, FR-77 |
| ia.derive_seuils | Seuils de dérive et de gravité | par capacité | indice | ASSUMPTION | FR-73 |
| ia.derive_delai_alerte_h | Délai d'alerte de dérive | 24 | heure | ASSUMPTION | FR-73 |
| ia.desaccord_horizon | Horizon(s) de confrontation d'un désaccord | par capacité (crédit : 3, 6, 12) | mois | PO | FR-74 |
| ia.desaccord_regle | Règle « qui avait raison » | par capacité (crédit : retard de plus de 30 jours) | règle | PO (PAR 30), ASSUMPTION | FR-74 |
| ia.desaccord_periode_mois | Période glissante du taux « qui avait raison » | 12 | mois | PO | FR-75 |
| ia.desaccord_min_cas | Effectif en dessous duquel le taux est « non significatif » | 30 | cas | ASSUMPTION | FR-75 |
| ia.copie_registre_validite_jours | Validité de la copie signée du registre | 14 | jour | MOT | FR-76 |
| ia.contribution_purge_jours | Péremption d'un lot non transmis | 30 | jour | MOT | FR-78 |
| ia.paquet_poids_max_go | Poids maximal d'un paquet de modèle | à fixer | Go | ASSUMPTION | FR-83 |
| ia.cache_consentement_s | Durée maximale d'un cache de consentement (hébergé) | 60 | s | ASSUMPTION | FR-88 |
| ia.retention_registre_annees | Durée du registre de l'IA | 10 | an | PRD assurance FR-12 ; ASSUMPTION ailleurs | FR-89 |
