# Paramètres W3 (§10 à §13) — code | libellé | défaut | unité | source | FR

| code | libellé | défaut | unité | source | FR |
|---|---|---|---|---|---|
| ia.seuil.donnees.<capacite> | Seuil de données avant calibration ou modèle du client (par capacité) | (à mesurer par capacité) | lignes | décision D6 | FR-91 |
| ia.objectif.acceptation_facade_pct | Taux d'acceptation sur 30 jours signalé « validation de façade » | 90 | % | spine assistant CM-1 | FR-92, FR-127 |
| ia.objectif.equite_regression_max | Dégradation d'équité tolérée pour promouvoir une version | 0 | points | [ASSUMPTION] | FR-92, FR-94 |
| ia.objectif.score.calibration_ecart_max | Écart de calibration maximal d'un score | (cible à fixer avec le client) | points | décision D8 | FR-93 |
| ia.objectif.score.effet_retard_pct | Baisse visée du retard de paiement du portefeuille noté | (cible à fixer) | % | décision D8 | FR-93 |
| ia.score.peremption_jours | Âge au-delà duquel un score est « périmé » | 30 | jours | PRD distributeur FR-184 | FR-93 |
| ia.ecart.motif_obligatoire | Motif obligatoire quand l'humain s'écarte d'une décision suggérée (crédit) | dès le 1er écart | écarts | [ASSUMPTION] | FR-95 |
| ia.ecart.alerte_audit_nb | Écarts répétés en 30 jours qui alertent l'auditeur | 5 | écarts | [ASSUMPTION] | FR-95 |
| ia.recouvrement.capacite_jour | Nombre de relances traitables par jour (par équipe) | (propre au client) | relances | PRD distributeur FR-120 | FR-97 |
| ia.objectif.recouvrement.taux_30j_pct | Taux de recouvrement à 30 jours visé | (cible à fixer) | % | décision D8 | FR-96 |
| ia.lecture.confiance_minimale | Confiance sous laquelle un champ lu est proposé vide | 0,6 | 0 à 1 | [ASSUMPTION] | FR-99, FR-142 |
| ia.objectif.lecture.champs_exacts_pct | Part de champs exacts visée par type de pièce | (cible à fixer par type) | % | décision D8 | FR-99 |
| ia.alerte.signal_faible_seuil | Seuil d'alerte des signaux faibles d'un client actif | 0,7 | 0 à 1 | PRD microfinance FR-126 | FR-103 |
| ia.objectif.prevision.erreur_max_pct | Erreur absolue moyenne maximale d'une prévision | (cible à fixer) | % | décision D8 | FR-105 |
| ia.objectif.par.baisse_pts | Baisse du PAR visée sur les agences qui suivent les actions | (cible à fixer) | points | décision D8 | FR-106 |
| ia.comparaison.min_missions | Missions comparables minimales pour une comparaison au portefeuille | 5 | missions | PRD assurance FR-65 | FR-110 |
| ia.combo.max_lignes | Nombre maximal de combos de stock lent par liste | 6 | combos | PRD distributeur FR-144 | FR-109 |
| ia.objectif.resume.fidelite_pct | Part de phrases de résumé fidèles à leur source (échantillon) | (cible à fixer) | % | décision D8 | FR-113 |
| ia.brief.heure | Heure du brief du matin | 07:00 | heure | PRD assurance FR-208 | FR-116 |
| ia.objectif.brief.delais_depasses_pct | Baisse visée des délais dépassés | (cible à fixer) | % | décision D8 | FR-116 |
| ia.terrain.proximite_metres | Distance de l'alerte de proximité | 200 | mètres | PRD microfinance FR-206 | FR-118 |
| ia.terrain.conservation_jours | Conservation des positions consenties | 90 | jours glissants | PRD distributeur FR-102 | FR-119 |
| ia.segment.effectif_minimal | Effectif minimal d'un segment ou d'une comparaison | 5 | personnes | spine microfinance (groupes < 5 retirés) | FR-121, FR-123 |
| ia.package.marge_plancher_pct | Marge minimale d'un package de vente | (marge plancher du logiciel) | % | [ASSUMPTION] | FR-122 |
| ia.impact.temoin_minimal | Taille minimale du groupe témoin | 10 | points de vente | [ASSUMPTION] | FR-122 |
| ia.impact.poids_sans_temoin | Poids d'un rapport sans témoin dans l'apprentissage | 0,3 | 0 à 1 | [ASSUMPTION] | FR-122 |
| ia.impact.seuil_succes_pct | Écart mesuré minimal pour dire qu'un package « marche » | 5 | % | [ASSUMPTION] | FR-122 |
| ia.coaching.seuil_points | Seuil de priorité de coaching | 20 | points | PRD distributeur FR-125 | FR-123 |
| ia.secteur.source_ancienne_jours | Âge d'une source macro jugée « ancienne » | 90 | jours | PRD microfinance FR-96 | FR-126 |
| ia.secteur.saturation_pct | Part d'un secteur déclenchant l'alerte de saturation | 35 | % | PRD microfinance FR-97 | FR-126 |
| ia.arbitrage.plafond_lot | Plafond dur d'une décision groupée (le défaut est 25) | 100 | décisions | spine assistant AD-23 | FR-127 |
| ia.objectif.copilot.temps_reponse_s | Temps de réponse visé du Copilot | (cible à fixer) | secondes | décision D8 | FR-139 |
| ia.objectif.agent.annulees_pct | Exécutions autonomes annulées ou contestées (maximum) | 1 | % | PRD assistant SM-4 | FR-139 |
| ia.pulse.effectif_minimal | Effectif minimal d'une case publiée par Pulse | (paramètre k du §8) | entreprises | décision D9 | FR-152 |

Rappels de paramètres du contrat : usure 24 % par an et taux d'effort bloquant 40 % (PRD microfinance), seuil de contentieux 40 (PRD distributeur FR-117), saturation 35 % — tous paramétrables par le client.
