# Réconciliation du PRD Assurance avec la démo existante

Date : 2026-11-13. Lecture seule du PRD (`prd.md`, 4 904 lignes), des deux extraits (`extract-code-demo.md`, `extract-parcours-demo.md`), du plan (`plan-redaction.md`, D1-D21) et du journal (`.memlog.md`). Source complémentaire lue en plus : `rejeu-2/verifications.txt` de la démo (les 104 vérifications, une par une).

Règle appliquée : la démo a été montrée à la compagnie, qui a dit « il manque des éléments, mais débutez dessus ». Le PRD doit exiger en vrai ce que la démo montre, sauf écart décidé (D1-D21, journal).

Statuts : **COUVERT** (une FR l'exige, au moins au niveau de la démo) ; **PARTIEL** (la FR existe mais une part de ce que la démo montre manque) ; **ÉCARTÉ** (écart volontaire, décision citée) ; **OMIS** (rien dans le PRD, aucune décision).

Colonnes : zone | capacité de la démo | statut | FR du PRD | correction proposée en une ligne (vide si COUVERT ou ÉCARTÉ sans suite).

---

## A. Modèle de données

| Zone | Capacité | Statut | FR | Correction proposée |
|---|---|---|---|---|
| Dossier | Champs du dossier (références, police, assuré, victime, dates, canal, montants, provisions, pièces manquantes, relances, estimation du déclarant, tiers impliqué) | COUVERT | FR-34, 36, 40, 49, 54 | |
| Dossier | 12 types de sinistre, 4 gravités, 4 responsabilités, volet par défaut | COUVERT | FR-40, 44, 54 | |
| Dossier | Canaux GUICHET, TELEPHONE, CHATBOT, COURRIER, AGENCE, COURTIER | ÉCARTÉ | FR-34 | Canal CHATBOT retiré (chatbot « bientôt », D13) ; AGENCE absent : ajouter « agence » si la compagnie en a. |
| Dossier | Suivi des sinistres majeurs (notification du réassureur, comité de suivi, fréquence de rapport quotidienne ou hebdomadaire, niveau de criticité, contrôle de sous-assurance) | OMIS | — | Ajouter une FR « sinistre majeur » en §5.4 ou §6.4 : seuil paramétrable, avis au réassureur selon le traité, comité de suivi, rapport périodique, criticité. |
| Dossier | Assuré, tiers, véhicule non autonomes (lus de la police) | COUVERT | FR-2, 195 | |
| Police | Statuts, effet, échéance, capitaux, intermédiaire ; police suspendue suspend toutes les garanties | COUVERT | FR-41, 186, annexe C | |
| Garanties | 16 codes, statut, plafond, franchise taux et minimum, délai de déclaration, exclusions | COUVERT | FR-187, C-3 | |
| Pièces | 20 types, statuts, sources, statut OCR, qui doit fournir | COUVERT | FR-44, 46, 159, 163 | |
| Documents officiels | Registre des PV et rapports d'autorité (16 types, statuts RECU à OBSOLETE, vérification, original ou copie, informations clés « déclarées dans le PV », attendus avec relance et échéance) | PARTIEL | FR-161 (seulement le remplacement par version) | Ajouter une FR « documents officiels » : type, autorité, statut de vérification, informations clés sourcées, attendu relancé, règle « déclaré dans le PV, jamais une conclusion ». |
| GED | Lots de numérisation et leurs statuts | COUVERT | FR-162 | |
| Courriers | 7 modèles, statuts BROUILLON à RETOURNE, canal, référence CRR | PARTIEL | FR-46, 48, 83, 114, 122 | Ajouter le statut « retourné » (pli non distribué) et un registre unique des courriers sortants. |
| Règlements | Moyens CHEQUE, TMONEY, FLOOZ, VIREMENT, ESPECES ; quittance et ses statuts | COUVERT | FR-92, 94-98 | |
| Règlements | Chaîne de validation de l'ordre (INSTRUCTION, RESPONSABLE, COMPTABILITE, DIRECTION) et statuts de l'ordre | ÉCARTÉ | FR-78, 90, 92 | Remplacée par la matrice de délégation (D8) et les états du règlement (D11). |
| Barèmes | 4 grilles en tranches (corporel, matériel, divers, recours) | ÉCARTÉ | FR-49, 70 | Corporel poste par poste (D15) ; grilles gardées pour la provision d'ouverture. |
| Barèmes | Tranche déduite du montant, arrondi 5 000, provision d'ouverture au milieu de tranche | COUVERT | FR-49, 73, 75 | |
| Provision | Mouvements jamais écrasés, 9 motifs, pièce justificative | COUVERT | FR-76, 188 | |
| Expertise historique | Une expertise par dossier, contre-expertise et sa décision | ÉCARTÉ | FR-61, 66 | Remplacée par les missions ; décisions CONFIRME_EXPERT_INITIAL, CONFIRME_CONTRE_EXPERT, TRANSACTION reprises. |
| Coassurance | Parts, apériteur, clé appliquée à provision, indemnité, règlement, recours, cession | COUVERT | FR-191 | |
| Exercices | Triangle de liquidation, taux de liquidation, délai moyen de déclaration, charge ultime, coût moyen, IBNR | PARTIEL | FR-189 (état des provisions seulement) | Ajouter à l'état technique : triangle de liquidation, taux de liquidation, coût moyen ; IBNR reste hors Prospera (décidé FR-189). |
| Missions | Domaines, types, priorité, 13 statuts, points, éléments à examiner, poids, refus, versions de rapport | COUVERT | FR-61-68 | |
| Experts | Nature, domaines, zones, agrément, mode d'honoraires, capacité, actif avec motif | COUVERT | FR-177, 178 | |
| Experts | Charge, classement proposé, besoin d'expertise, orientation | COUVERT | FR-58, 62, 183 | |
| Expertise médicale | Types, 9 motifs de mission, 10 statuts, planning à 6 jalons | PARTIEL | FR-63 (statuts et types ; ni motifs ni jalons) | Ajouter les 9 motifs de mission médicale et le planning à 6 jalons avec leurs échéances. |
| Expertise médicale | Convocation (SMS, e-mail, confirmation, absence, nouvelle convocation) | PARTIEL | FR-63 (mentions légales, 15 jours) | Ajouter : envoi SMS et e-mail tracé, confirmation de la victime, absence, nouvelle convocation. |
| Expertise médicale | Examen (présence, documents présentés, antécédents, lésions, examens réalisés) et conclusions (séquelles codées, ITT, soins futurs, réserves) | PARTIEL | FR-63 (conclusions listées, pas l'examen) | Ajouter le compte rendu d'examen et les séquelles codées avec taux. |
| Expertise médicale | Extraction automatique du rapport, validée champ par champ | PARTIEL | FR-64, 164 | Exiger la validation champ par champ des données extraites d'un rapport médical par `MED`. |
| Expertise médicale | Comparaison entre expertises (RETENUE, ECARTEE, CONTESTEE, ANCIENNE) | PARTIEL | FR-66 | Ajouter le statut d'évaluation de chaque expertise quand il y en a plusieurs. |
| Expertise médicale | Contestation structurée (par victime, assuré, compagnie, tiers ; point contesté ; valeur revendiquée ; statut EN_ATTENTE, PROGRAMMEE, TRANCHEE) | PARTIEL | FR-63, 66 | Ajouter l'objet contestation médicale avec auteur, point, valeur initiale et revendiquée. |
| Certificats médicaux | 10 types, 9 statuts, destinataires, canaux de relance, délais d'attente par type | PARTIEL | FR-63 | Délais repris ; ajouter types, destinataires, niveau d'impact (blocage, limité, aucun) et canal de relance. |
| Certificats médicaux | Contrôle de conformité (date, médecin, signature, cachet, original ou copie, durée d'arrêt, verdict COMPLET ou NON_CONFORME avec motif) | OMIS | — | Ajouter une FR de contrôle de conformité d'un certificat avec ses points et son motif de non-conformité. |
| Consolidation | Statuts NON_CONSOLIDE à REEVALUATION_NECESSAIRE, chronologie médicale (10 natures d'événement), suivi post-consolidation, aggravation, rechute | PARTIEL | FR-63, 85 | Ajouter la chronologie médicale du dossier et le suivi après consolidation (prochain examen, IPP initiale contre nouvelle, écart). |
| Consolidation | Calcul IPP par interpolation dans la tranche | ÉCARTÉ | FR-70 | Remplacé par le calcul poste par poste du Code CIMA (D15). |
| Décès | Registre des ayants droit (qualité, fondement du droit, vérification, part successorale, mineur, représentant légal, autorisation judiciaire, RIB vérifié, documents) | PARTIEL | FR-70, 86, 91, 100 (côté règlement seulement) | Ajouter une FR « ayants droit » : registre, pièces (acte de naissance, hérédité, non-remariage, tutelle), parts, vérification, autorisation du juge. |
| Matériel | Devis (statuts ATTENDU, RECU, EN_ANALYSE, COMPLEMENT_DEMANDE, ACCEPTE, REFUSE) | PARTIEL | FR-59, 60 | Ajouter la machine du devis et son lien à l'accord sur devis. |
| Matériel | Réparation (entrée, avancement, montant autorisé, travaux supplémentaires, facture, contrôle avant règlement) | COUVERT | FR-72 | |
| Matériel | Dommage lourd et épave (valeurs, décision, cession, récupération) | COUVERT | FR-72 | |
| Tiers externes | Intervenants des risques divers (syndic, transporteur, partie adverse, administration, prestataire, avocat, courtier, compagnie adverse) : action attendue, rôle, relance, date cible, impact du retard | OMIS | — (le titre de §6.3 les nomme, aucune FR) | Ajouter une FR « intervenants » en §6.3 : objet, action attendue, relance, impact du retard ; l'alimenter dans « mes attentes ». |
| Recours | 11 statuts, priorité, fondement, débiteur, checklist de 7, issue de clôture, prescription indicative | COUVERT | FR-108-118 | |
| Recours | Créance, mise en demeure, négociation, contentieux, encaissement et rapprochement | COUVERT | FR-113-117 | |
| Numérotation | Formats QUI-, ORD-, REC-, CRE-, MED-, CTX-, ENC-, CRR- | PARTIEL | FR-167 (ARC seulement) | Fixer le format de chaque numéro en annexe D ou le déclarer paramétrable. |
| Archives | Supports, états papier et numérique, valeur d'original, bordereau, sorties, reconstitution et certification | COUVERT | FR-167-173 | |
| Journal | 22 types d'action, avant, après, motif | COUVERT | FR-13, 138 | |
| IA | Registre des actions IA (niveau, statut, auteur) | COUVERT | FR-12 | |
| Fraude | 4 niveaux, 9 signaux pondérés, revue NON_REVU à CONFIRME | COUVERT | FR-127-130 | |
| Contrôle | Séparation des fonctions, constats CONFORME, ALERTE, VIOLATION | COUVERT | FR-7, 210 | |
| Rôles | 11 rôles de la démo, périmètres de lecture, refus par défaut | COUVERT | FR-6, annexe B | |

---

## B. Machines d'états et règles de circuit

| Zone | Capacité | Statut | FR | Correction proposée |
|---|---|---|---|---|
| Dossier | Graphe de 15 états et 31 transitions, droit, conditions, motif | COUVERT | FR-134, 135 (réécrit, 42 transitions) | |
| Dossier | 11 conditions nommées et leur texte opposé à l'utilisateur | COUVERT | FR-136 | |
| Dossier | Actions ouvertes ET fermées affichées avec leur motif de blocage | COUVERT | FR-30 | |
| Dossier | Le serveur revérifie rôle, conditions, motif (un écran ne force rien) | COUVERT | FR-137 | |
| Dossier | Aucun état non terminal sans issue | COUVERT | FR-139 | |
| Dossier | Effets d'une transition (dates, provision, quittance, volet, archive) | COUVERT | FR-105, 135 | |
| Recevabilité | 4 questions, 6 points calculés, décision de garantie motivée 10 caractères, jamais de refus seul | COUVERT | FR-41-43 | |
| Garanties | Garanties qui répondent d'un type de sinistre | COUVERT | FR-187 | |
| Recours | Machine à 11 états et ses conditions | COUVERT | FR-112 (+ EN_ARBITRAGE) | |
| Recours | Mise en demeure (7 états), contentieux (6 états) | COUVERT | FR-114, 116 | |
| Mission | 13 statuts, désignation, acceptation, refus, transmission, rapport, complément, validation, contestation, arbitrage | COUVERT | FR-61, 62, 66, 67 | |
| Honoraires | Note facturée, visa, jamais au-delà du facturé, motif au-delà de la lettre | COUVERT | FR-182 | |
| Offre | A_PREPARER, EN_VALIDATION, PRETE, ENVOYEE, ACCEPTEE, REFUSEE, EN_NEGOCIATION, EXPIREE | PARTIEL | FR-82-89 | Ajouter l'état « expirée » (offre sans réponse au terme) et l'état « retournée ». |
| Paiement | Situation EN_VALIDATION, A_PAYER, EN_COURS, PARTIEL, PAYE, ECHEC | COUVERT | FR-92 | |
| Indemnisation | Postes de préjudice par volet et leurs états (A_EVALUER, EVALUE, A_VERIFIER, JUSTIFICATIFS_ATTENDUS) | PARTIEL | FR-70, 73 | Ajouter les postes matériel (réparation, vétusté, immobilisation, remorquage, valeur de remplacement) et divers (bâtiment, contenu, perte d'exploitation, sauvetage) et l'état par poste. |
| Indemnisation | 9 alertes nommées (evaluation-a-revoir, offre-validation, paiement-echec, evaluation-incomplete, provision, offre-sans-reponse, offre-retournee, paiement-partiel, piece-manquante) | PARTIEL | FR-76, 78, 89, 92, 145 | Ajouter evaluation-incomplete (postes non chiffrés) et offre-retournee (pli non distribué). |
| Provision | Révision avec motif, validation de la reprise, report de X jours, niveaux de priorité | COUVERT | FR-76, 188 | |
| Fraude | Revue humaine, conclusion écrite, blocage de l'ordre | COUVERT | FR-129, 130 | |
| Courrier | Machine du courrier (brouillon, à imprimer, envoyé, remis, retourné) | PARTIEL | FR-122 | Ajouter « remis » et « retourné » avec preuve. |
| Urgences corporelles | Parcours de prise en charge d'urgence (signalé, secours, orientation, admission, évaluation, soins, hospitalisation, suivi ; alertes « admission non confirmée », « accord assureur non transmis ») | OMIS | FR-40 (marque seulement) | Décider avec la compagnie : exiger le parcours réel (données hospitalières) ou l'écarter par décision ; la démo le simulait. |
| Lot GED | 5 étapes EN_ATTENTE à ARCHIVE, ANOMALIE | COUVERT | FR-162 | |
| Réparation, épave | A_PROGRAMMER à CONTROLE_AVANT_REGLEMENT ; A_DECIDER, REPARATION, EPAVE | COUVERT | FR-72 | |
| Intervenant | EN_ATTENTE, RELANCE, RECU, SANS_SUITE | OMIS | — | Voir « Tiers externes ». |

---

## C. Règles chiffrées, délais, seuils, numérotation

| Zone | Capacité | Statut | FR | Correction proposée |
|---|---|---|---|---|
| Numérotation | Sinistre `SIN-AAAA-NNNN` attribué par Prospera | ÉCARTÉ | FR-36, 37, 198 (D3 : `DEC-` puis numéro du LC) | |
| Numérotation | Archivage `ARC-AAAA-CCCC-NNNNN`, jamais réattribué | COUVERT | FR-167 | |
| Pièces | Pièces obligatoires et complémentaires par type, `PV_EXPERTISE` jamais obligatoire | COUVERT | FR-44, 61 | |
| Barème | Calibration des grilles (marge de fiabilité 15 %, amplitude 5, occupation 75 %, concentration 40 %, ancienneté 24 mois, tranches mortes) | OMIS | — | Ajouter à la FR des grilles de provision un diagnostic de calibration et l'alerte de grille périmée. |
| Instruction | Véhicule : vétusté sur pièces selon l'âge, épave, franchise, alertes | COUVERT | FR-55, 72 | |
| Instruction | Biens, vol, transport (avarie, prescription du recours transporteur), RC, divers | COUVERT | FR-55, 73 | |
| Garanties | Plafond, franchise `min(dommage, max(taux, minimum))`, indemnité plafonnée | COUVERT | FR-69, 187 | |
| Délégation | Seuil unique 2 000 000 FCFA, réutilisé pour offre, provision, SEP-03, IA | ÉCARTÉ | FR-8, 78 (D8 : matrice, 1 000 000, comité) | |
| Délégation | Offre ≥ 2 M en validation avant envoi | ÉCARTÉ | FR-82, 84 (D6) | |
| Délégation | Écart de provision ≥ 2 M attend le responsable | COUVERT | FR-76 | |
| Contrôle | SEP-01, 02, 03, fractionnement, tolérances 10 % et 25 % | COUVERT | FR-7, 80, 210 | |
| Délais | Référentiel CIMA versionné « 2026.2 » (90, 60, 75 jours, 45, 30, 30) | ÉCARTÉ | FR-14, 85, 141 (source non vérifiée ; délais légaux séparés) | |
| Délais | Calcul des échéances, nature RÈGLEMENTAIRE, INTERNE, SUIVI | COUVERT | FR-140 | |
| Délais | SLA par volet 45, 21, 30, 90 | COUVERT | FR-142 | |
| Délais | Relances 5 jours, 3 sans effet, pièces bloquantes 30 jours | COUVERT | FR-143, 145 | |
| Délais | Cible évaluation à paiement 10 jours | ÉCARTÉ | FR-102 (72 h après accord) | |
| Délais | Chèque guichet 7 et 30 jours, circulation 21 jours, rapprochement 60 jours, espèces 500 000, concentration 60 %, coordonnées 5 jours, doublon 30 jours | COUVERT | FR-98, 100, 101, 210 | |
| Délais | Provision 15 %, sensibles, 90 et 365 jours | COUVERT | FR-76, 210 | |
| Délais | Boni ou mali de liquidation significatif (250 000) | OMIS | — | Ajouter le suivi boni et mali à l'état technique (voir A, « Exercices »). |
| Expertise | Seuils 250 000 et 3 000 000, externe impératif, délais par domaine, budget, poids, surcharge 1,2 et 0,8, post-mortem | COUVERT | FR-58, 59, 68, 183-185 | |
| Expertise | Écart rapport et dossier 15 % et 35 % ; comparables au moins 12 | COUVERT | FR-65, 74 | |
| Recours | Prescription 730 jours en terme à vérifier, alerte 90 jours, 30 jours transmission et mise en demeure, 60 jours nouveau recours | COUVERT | FR-118, 140 | |
| Réclamations | Accusé 5, réponse 30, escalade 60, fenêtre 365, récurrence 3 | COUVERT | FR-156 | |
| Archivage | Restitution 15 jours, versement 75 jours, 2 500 pages par boîte, 60 caractères par page | COUVERT | FR-163, 168, 170, 171 | |
| Archivage | Coût de numérisation 45 FCFA la page | OMIS | — | Reprendre en paramètre de pilotage (coût du lot) ou l'écarter par décision. |
| Contrôle | Silence 8, 15, 30 jours ; agent sans trace 10 jours ; échantillon 12 | COUVERT | FR-144, 210 | |
| Contrôle | Veille avant règlement 3 jours ; amplitude forte 25 % ou 1 000 000 | PARTIEL | FR-210 (amplitude oui, veille non) | Ajouter la veille de 3 jours avant règlement d'un dossier sensible. |
| Pilotage | Seuils direction (délai 85 %, ancienneté critique 90 jours, S/P) | ÉCARTÉ | FR-228 (primes hors périmètre) | |
| Fraude | 9 poids, plafond 100, seuils 20, 45, 70 | COUVERT | FR-127, 128 | |
| Réassurance | Traités par millésime, quote-part et excédent | COUVERT | FR-190 | |
| Conservation | Durées par nature, versement seulement clos, empreinte | COUVERT | FR-168, 169, 174 | |
| Contrôles bloquants | Les 15 contrôles bloquants de la démo | COUVERT | FR-136, 137 | |
| Fichiers | 4 types, 8 Mo | COUVERT | FR-160 | |
| Pièces | Interdiction d'archiver avant contrôle ; antivirus | COUVERT | FR-160, 165, 263 | |

---

## D. Écrans par profil

| Zone | Capacité | Statut | FR | Correction proposée |
|---|---|---|---|---|
| Fiche dossier | Colonne identité, fil d'avancement, actions ouvertes et fermées, provision, évalué, payé, reste, réaffectation, impression | COUVERT | FR-30, 51, 152 | |
| Fiche dossier | 15 onglets (pièces, garanties, PV et rapports officiels, décès et ayants droit, véhicule et instruction, provision, expertise, missions, réparation, consolidation et IPP, historique, règlement, courriers, archivage) | PARTIEL | FR-41, 55, 72, 76, 61, 92, 122, 168 | Compléter les onglets « PV et rapports officiels », « ayants droit », « consolidation et IPP » (voir A) ; fixer la liste des onglets en annexe A.1. |
| Accueil | Déclarer un sinistre (recherche de police, garanties du contrat, volet, urgence, pièces, contrôles, numéro) | COUVERT | FR-34 à 40 | |
| Accueil | Guichet : recherche permanente, 4 files, gestes sur la ligne, compte de la journée | COUVERT | FR-148 | |
| Accueil | Appels et remise de chèques : liste d'appels du matin | COUVERT | FR-101, 148 | |
| Accueil, gestionnaires | Vue kanban par étape (`/pipeline`) | OMIS | — | Ajouter la vue « par étape » (11 statuts) aux files de FR-147. |
| Gestionnaires | Corbeille personnelle et de service, liste filtrable, vues préconfigurées | PARTIEL | FR-147 | Les vues « tiers externes », « sinistres majeurs », « dommages lourds », « réparations » manquent (voir A). |
| Corporel | Urgences corporelles (`/urgences-corporelles`) | OMIS | FR-40 (marque seulement) | Voir B, « Urgences corporelles ». |
| Corporel | Certificats médicaux : attendus, relances, contrôle, programmation | PARTIEL | FR-63, 47 | Voir A, « Certificats médicaux ». |
| Corporel | Expertise médicale, consolidation et IPP, décès et ayants droit | PARTIEL | FR-63, 70 | Voir A. |
| Matériel | Devis, réparations, dommages lourds et épaves, expertises contestées, constats | COUVERT | FR-59, 60, 66, 72 | |
| Risques divers | Tiers externes, PV et plaintes, expertises sur site, sinistres majeurs, nature de risque | PARTIEL | FR-55, 61 | Voir A, « Tiers externes » et « Dossier ». |
| Indemnisation | Évaluations au barème, offres, provisions, paiements, recours à ouvrir (export) | COUVERT | FR-69 à 103, 149 | |
| Suivi | Mes délais, mes attentes, mon historique | COUVERT | FR-145, 147, 158 | |
| Responsable | Pilotage, arbitrages (à valider, bloqués, réaffectation), registre des règlements, fraudes, traçabilité | COUVERT | FR-51, 147, 206, 210 | |
| Responsable | États techniques (rapports) | PARTIEL | FR-189 | Voir A, « Exercices ». |
| Direction | Poste de pilotage à 4 onglets (vue 360, exploitation, recours, technique et CIMA), 12 indicateurs | PARTIEL | FR-206 (onglets nommés, contenu de « technique » non fixé) | Fixer les indicateurs de l'onglet technique (charge après coassurance et réassurance, engagements restants, conformité aux délais CIMA). |
| Direction | Note de synthèse recomposée à partir des chiffres (analyse, lecture par domaine, position CIMA, décisions par priorité, projection à 30 jours) | OMIS | FR-228 renvoie au rapport de direction du PRD distributeur | Ajouter la note de synthèse de direction, générée depuis les données et rejouable. |
| Direction | Revue mensuelle imprimable | PARTIEL | FR-228 (renvoi) | Spécifier le contenu assurance de la revue mensuelle. |
| Direction | Parapheur des règlements au-dessus du seuil (engagement, charge nette, réserves, export) | PARTIEL | FR-207 (vue de signature) | Ajouter l'export du parapheur et la charge nette. |
| Direction | États techniques : par branche, exercices de survenance, triangle de liquidation, coassurance, boni et mali | PARTIEL | FR-189, 190, 191 | Voir A, « Exercices ». |
| Direction | Recherche en langage naturel, portefeuille de polices, GED, archives | COUVERT | FR-155, 186, 168 | |
| Pôle recours | Tableau de bord, corbeille, créances, mises en demeure, négociations, encaissements, contentieux | COUVERT | FR-149, 108 à 118 | |
| Numérisation | Console, dépôt et lecture, pièces à rattacher, à refaire, arrivé aujourd'hui avec l'enjeu de chaque pièce | COUVERT | FR-162 à 166 | |
| Archives | Retrouver un dossier par nom, sinistre, police, immatriculation (jamais par la cote), échéancier d'élimination, sorties, versement, reconstitution | PARTIEL | FR-168 à 175 | Ajouter « on retrouve un dossier archivé par ses références métier ; la cote sert seulement à localiser ». |
| Comptabilité | Ordres, remises, registre, rapprochement, état mensuel, export du journal | COUVERT | FR-93, 103, 193, 224 | |
| Comptabilité | Engagements à décaisser et honoraires à décaisser | PARTIEL | FR-207 | Ajouter la vue « engagements » (validé moins payé, par bénéficiaire). |
| Comptabilité | État de liquidation (provision à l'ouverture, au bilan, réglé, reprise, charge nette, écart d'évaluation) | OMIS | — | Ajouter la liquidation à l'export de FR-193. |
| Contrôle interne | Piste d'audit, anomalies, graphe de fraude, sensibles, décaissements, qualité et plan d'action | COUVERT | FR-132, 156, 158, 210 | |
| Expert interne | Mes missions, mes visites, consultation des barèmes, rédaction rubrique par rubrique | PARTIEL | FR-179 | Ajouter « mes visites » (agenda des visites) et la lecture des grilles par l'expert. |
| Cabinet externe | Portail : missions à accepter, rapports à déposer, honoraires, suivi | COUVERT | FR-180 | |
| Administrateur | Utilisateurs et matrice de droits, barèmes (simulateur, calibration, impression), modèles de courriers, assistant | PARTIEL | FR-6, 4, 122 | Ajouter le simulateur et l'impression des grilles, la liste des courriers sortants avec impression groupée. |
| Tous | Menu filtré par profil, écran refusé hors périmètre | COUVERT | FR-6, annexe B | |
| Connexion | Un compte de démonstration par profil, un clic | COUVERT | FR-15 | |
| Connexion | Changer de profil sans se déconnecter (14 changements par séance) | OMIS | — | Ajouter à FR-15 un sélecteur de profil de démonstration, réservé à l'espace d'essai. |
| Tous | Copilote « Prospera AI » en tête du menu, 8 suggestions de questions | COUVERT | FR-155 | |

---

## E. L'IA (24 fonctions du code, 11 des parcours)

| Zone | Capacité | Statut | FR | Correction proposée |
|---|---|---|---|---|
| IA | 1. Déclaration assistée (WhatsApp, e-mail, courrier) | COUVERT | FR-35 | |
| IA | 2. Transcription d'un vocal (factice) | ÉCARTÉ | FR-35 (D13) | |
| IA | 3. Lecture réelle d'un document (type, données, extrait source) | COUVERT | FR-163, 164 | |
| IA | 4. Lecture d'une pièce : lisibilité, incohérences, photo réutilisée | COUVERT | FR-53 | |
| IA | 5. Résumé sourcé | COUVERT | FR-154 | |
| IA | 6. Relance rédigée (canal, moment conseillé) | COUVERT | FR-47 | |
| IA | 7. Pré-remplissage de l'instruction avec la pièce source | COUVERT | FR-56 | |
| IA | 8. Analyse de devis (catalogue, main-d'œuvre, surcoût 10 %, distribution) | COUVERT | FR-60 | |
| IA | 9. Aide à la décision (points forts, vigilance, comparables, motif suggéré) | COUVERT | FR-77 | |
| IA | 10. Cohérence du dossier (CERTAIN contre PROBABLE) et score de qualité | COUVERT | FR-53, 209 | |
| IA | 11. Veille du portefeuille | COUVERT | FR-208 | |
| IA | 12. Graphe de liens (téléphone, véhicule, témoin, photo, garage) | COUVERT | FR-132 | |
| IA | 13. Expliquer le risque et le montant | COUVERT | FR-74, 128 | |
| IA | 14. Case brief (chronologie des 14 derniers événements, favorable, vigilance) et chaîne de décision IA puis humain | PARTIEL | FR-154, 12 | Ajouter la chaîne de décision (suggestion, modifiée, validée, émise, par qui) à la fiche de FR-12. |
| IA | 15. Brief du matin | COUVERT | FR-208 | |
| IA | 16. Questions en langage naturel (Prospera AI) | COUVERT | FR-155 | |
| IA | 17. Simulation « et si… » | COUVERT | FR-209 | |
| IA | 18. Orientation de l'expertise | COUVERT | FR-58 | |
| IA | 19. Complétude et écarts d'un rapport, jamais d'estimation concurrente | COUVERT | FR-64, 65 | |
| IA | 20. Réponses à l'assuré et assistant FR et EN | ÉCARTÉ | FR-22 (chatbot « bientôt », D13) | |
| IA | 21. Courriers, mise en demeure, analyse d'une offre adverse | COUVERT | FR-83, 120, 122, 157 | |
| IA | 22. Questions de pilotage (retards, garages, charge, pièces, validation) | COUVERT | FR-155, 206, 207 | |
| IA | 23. Estimation par comparables (au moins 12, écart 25 %) | COUVERT | FR-65, 74 | |
| IA | 24. Recherche en langage naturel de la direction | COUVERT | FR-155 | |
| IA | « Rédiger le motif avec l'IA » (le motif reste humain) | COUVERT | FR-77 | |
| IA | Principe : aucun pouvoir, aucune décision, sources, journalisation accepté, modifié, rejeté | COUVERT | FR-11, 12 | |
| IA | Analyse d'un dossier stable entre deux consultations (défaut corrigé de la démo) | COUVERT | FR-17, 60, 74 | |

---

## F. Documents générés

| Zone | Capacité | Statut | FR | Correction proposée |
|---|---|---|---|---|
| Documents | PDF du rapport d'expertise rédigé en ligne (identification, rubriques, imputation, conclusions, signature, version) versé comme pièce et au bordereau | PARTIEL | FR-179, 180 | Fixer le contenu minimal du PDF généré et exiger sa présence au bordereau de versement. |
| Documents | Export du journal comptable `SIN` (date, journal, compte, libellé, débit, crédit, pièce) | COUVERT | FR-193 | |
| Documents | Export de liquidation (provision ouverture, bilan, réglé, reprise, charge nette, écart, soldé) | OMIS | — | Voir D, « État de liquidation ». |
| Documents | Export des résultats de recherche, des recours à ouvrir | COUVERT | FR-155, 149 | |
| Documents | Impressions : revue mensuelle, arrêté comptable, note de synthèse | PARTIEL | FR-193, 228 | Voir D, « Direction ». |
| Courriers | 7 modèles : demande de pièces, offre, refus, relance, accusé, convocation d'expertise, mise en demeure | PARTIEL | FR-46, 47, 48, 83, 114, 122 ; convocation médicale seule en FR-63 | Ajouter le modèle de convocation d'expertise matérielle (date, lieu, documents, préavis 48 h). |
| Courriers | Copie archivée automatiquement ; impression groupée | PARTIEL | FR-122 (copie oui, impression groupée non) | Ajouter l'impression groupée des courriers à envoyer. |
| Documents | Quittance, lettre-chèque sur gabarit, ordre de règlement | COUVERT | FR-90, 94, 96 | |
| Documents | Lettre de mission à l'expert (`LM-`) | PARTIEL | FR-61 (citée, non générée) | Exiger la génération de la lettre de mission par le serveur, avec sa référence. |
| Documents | Convocation médicale | COUVERT | FR-63 | |
| Documents | Bordereau de versement, certificat de reconstitution, fiche de sortie de chemise | COUVERT | FR-168, 171, 173 | |
| Documents | États techniques par branche, exercices, triangle ; note de synthèse | PARTIEL | FR-189 | Voir A et D. |
| Documents | Registre de surveillance du contrôle interne | COUVERT | FR-210 | |
| Documents | Plan de comptes CIMA en dur dans le code | ÉCARTÉ | FR-103, 193 (le plan de la compagnie fait foi) | |
| Documents | Génération par le serveur avec les modèles de la compagnie (lettres, rapports, quittances, chèques, bordereaux) | PARTIEL | FR-4, 94, 96, 122 | Exiger que tout modèle de document soit paramétrable et versionné, y compris lettre de mission et bordereau. |

---

## G. Recherche

| Zone | Capacité | Statut | FR | Correction proposée |
|---|---|---|---|---|
| Recherche | Index normalisé (minuscules, sans accents), ET des mots, repli par préfixe | COUVERT | FR-150, 151 | |
| Recherche | Critères du dossier : n° de sinistre, assuré, victime, souscripteur, police, immatriculation, téléphone, lieu, gestionnaire | COUVERT | FR-150 | |
| Recherche | Filtres cumulables (volet, étape, gestionnaire, pièces manquantes, chèque disponible, urgence, hors délai) | COUVERT | FR-150, 151 | |
| Recherche | Recherche de police à la déclaration | COUVERT | FR-34, 38 | |
| Recherche | Langage naturel : critères visibles, 8 catégories, synthèse chiffrée, groupes 40 et 20, export, 16 questions types | COUVERT | FR-155 | |
| Recherche | Archives (jamais par la cote), journal d'audit, polices | PARTIEL | FR-158, 168, 186 | Ajouter « jamais par la cote » (voir D, « Archives »). |

---

## H. Traçabilité

| Zone | Capacité | Statut | FR | Correction proposée |
|---|---|---|---|---|
| Journal | Chaque geste : utilisateur, rôle, type, avant, après, motif ; horloge unique et croissante | COUVERT | FR-13, 138 | |
| Journal | Piste d'audit : filtres, mon historique, journal GED, modifications sensibles, export | COUVERT | FR-138, 149, 158 | |
| Journal | Versions conservées (provision, rapport, pièce, document officiel, reconstitution, garantie, refus d'experts) | COUVERT | FR-76, 161, 66, 173 | |
| Journal | Chaîne de décision IA puis humain | PARTIEL | FR-12 | Voir E, ligne 14. |

---

## I. Ce qui est simulé : une exigence le rend-il réel ?

| Zone | Capacité | Statut | FR | Correction proposée |
|---|---|---|---|---|
| Stockage | Base multi-utilisateurs, persistance serveur partagée, journal immuable | COUVERT | FR-13, 251, 264 | |
| Stockage | Concurrence : deux agents sur le même dossier, verrouillage, conflit d'écriture | OMIS | FR-137 (idempotence seulement) | Ajouter une exigence de concurrence : version du dossier, refus avec message si modifié entre-temps. |
| Écran | Écran à jour après chaque action, sans rechargement (défaut corrigé quatre fois dans le rejeu) | OMIS | — | Ajouter à FR-264 : un geste met à jour l'écran des rôles concernés sans rechargement, vérifié en recette. |
| Horloge | Date figée au 12 septembre ; deux horloges (journal, archives) | COUVERT | FR-13 (horodatage serveur) | |
| Auth | Comptes en dur, mot de passe unique, droits côté navigateur | COUVERT | FR-25, 137, 254 | |
| Contrats | Référentiel généré, composition en dur | COUVERT | FR-186, annexe C | |
| Numérotation | Séquences calculées en mémoire | COUVERT | FR-36, 167, 198 (sans trou ni doublon) | |
| OCR | Seule la couche texte des PDF est lue | COUVERT | FR-163 | |
| IA | Règles et regex, vocal factice, empreinte de photo simulée, confiance tirée au hasard | COUVERT | FR-10, 11, 132 | |
| Envois | SMS, e-mail, WhatsApp, courrier : aucun envoi, distribution non suivie | PARTIEL | FR-18, 146, 226 | Exiger le suivi de distribution (retourné, non remis) pour courrier et SMS. |
| Paiement | Aucun paiement réel (T-Money, Flooz, virement) | COUVERT | FR-95, 220 à 223 | |
| Impression | Aucun gabarit de chèque ni de quittance | COUVERT | FR-94, 96 | |
| Comptabilité | Arrêté sur données générées | COUVERT | FR-103, 193 | |
| Expertise | Portail, panel et honoraires simulés | COUVERT | FR-177 à 182 | |
| Médical | Parcours d'urgence, chronologie, expertise médicale dérivés du dossier | PARTIEL | FR-9, 63 | Voir A et B (urgences, chronologie). |
| Référentiels | Délais, durées, barèmes, traités en dur « à valider » | COUVERT | FR-4, 24, D.5 | |
| Réassurance | Clés et traités simulés | COUVERT | FR-190, 191 | |
| Recours | Mises en demeure sans envoi, créances en mémoire | COUVERT | FR-114, 116, 117 | |
| Archives physiques | Localisation, sorties, scellement modélisés ; code-barres | PARTIEL | FR-170, 171 (étiquette, pas de code de lecture) | Exiger l'étiquette avec code de lecture (code-barres ou QR) pour la chemise et la boîte. |
| Reporting | Triangle, IBNR, sparklines sur données générées | PARTIEL | FR-189, 212 | Voir A, « Exercices ». |
| API | Aucun appel d'API | COUVERT | FR-194 à 201, annexe C | |
| Référentiels de tiers | Garages, assureurs adverses, cabinets agréés réels | PARTIEL | FR-177 (experts seulement) | Ajouter un référentiel des garages et prestataires (agrément, historique de devis) et des assureurs adverses ; FR-60 et FR-132 en dépendent. |
| Remise à zéro | Par navigateur | COUVERT | FR-15 | |
| Scan | Un scan en image n'est pas lu | COUVERT | FR-163 | |
| Fraude | Revue simulée de façon déterministe | COUVERT | FR-129, 130 | |
| Consolidation | Interpolation simplifiée | ÉCARTÉ | FR-70 | |
| Disponibilité | Serveur de développement, build non fiable | COUVERT | FR-251, 261 | |

---

## J. Parcours validés : SIN-2026-9002 pas à pas, autres scénarios, rejeu 2

| Zone | Capacité | Statut | FR | Correction proposée |
|---|---|---|---|---|
| Profils | Les 10 profils joués et leurs interdits | COUVERT | FR-6, 7, 15 | |
| 9002 étape 1 | Déclaration reçue à l'accueil ; ouvrir sans les pièces est fermé ; ouvrir en attente de pièces | COUVERT | FR-30, 45 | |
| 9002 étape 2 | Dépôt de 7 pièces d'un coup, lecture sur le contenu (devis renommé reconnu à 96 %), pièce attendue rattachée, complétude 100 % | COUVERT | FR-159, 164, 165 | |
| 9002 étape 2 | Bouton « verser » grisé tant qu'un document est en lecture ; « N lus sur M » | OMIS | — | Ajouter à FR-165 : versement bloqué tant qu'une lecture est en cours, compteur « lus sur total ». |
| 9002 étape 3 | Ouverture sans gestionnaire, l'accueil n'affecte jamais | COUVERT | FR-50 | |
| 9002 étape 4 | Attribution par le responsable avec motif ; instruction fermée avant attribution | COUVERT | FR-50, 52 | |
| 9002 étape 5 | Prise en instruction ; évaluation fermée tant qu'une expertise est ouverte | COUVERT | FR-52, 61, 136 | |
| 9002 étape 6 | Rapport reçu par courrier, saisi par la gestionnaire ; complétude 88 % sous réserve (rubriques vides lues) ; pièce rejoint le dossier | COUVERT | FR-64, 67, 181 | |
| 9002 étape 7 | Écart de 65 % au devis ; comparables du portefeuille et histogramme ; 3 demandes de complément rédigées | COUVERT | FR-60, 65, 67 | |
| 9002 étape 8 | Contestation : le gestionnaire ne peut pas ordonner ; responsable oui ; classement ; cabinet initial grisé ; panel interne refusé | COUVERT | FR-62, 66 | |
| 9002 étape 9 | Portail du cabinet : accepte, dépose, complétude 100 %, ne voit pas la provision | COUVERT | FR-180 | |
| 9002 étape 10 | La contre-expertise tranche : mission initiale ARBITREE | COUVERT | FR-66 | |
| 9002 étape 11 | Orientation assistée : besoin « responsabilité » proposé, retenir, double retenue refusée | COUVERT | FR-58 | |
| 9002 étape 12 | Expert interne : honoraires non engagés ; rapport rédigé rubrique par rubrique ; part du tiers 70 % obligatoire ; PDF généré ; responsabilité requalifiée | COUVERT | FR-54, 62, 64, 179, 182 (PDF : voir F) | |
| 9002 étape 13 | Décision de garantie, déclaration tardive 95 jours pour 5, évaluation pré-remplie 445 500, repère 775 000, motif si différent, barème et provision réajustée | COUVERT | FR-42, 43, 75, 76 | |
| 9002 étape 13 | Franchise de 78 000 non déduite du montant arrêté (question ouverte de la démo) | ÉCARTÉ | FR-69 (D15 : franchise déduite, arrêté 395 500) | |
| 9002 étape 14 | Fiche de décision préparée (pièces 5 sur 5, 3 expertises, tranche, 183 comparables, fraude, recours 311 850, hors délai 73 jours, prescription) | COUVERT | FR-77, 78 | |
| 9002 étape 14 | Validation puis ordre de règlement émis directement | ÉCARTÉ | FR-82, 86, 90 (D6 : offre et accord avant tout ordre) | |
| 9002 étape 15 | Comptabilité saisit n° de chèque et banque ; gestionnaire ne paie pas | COUVERT | FR-81, 93, 94 | |
| 9002 étape 16 | Remise : « retiré par » vide, identité et pièce exigées ; clôture avec motif | COUVERT | FR-97, 104 | |
| 9002 étape 16 | « Transmettre au pôle recours » ouvert après le règlement, 70 % de 445 500 | ÉCARTÉ | FR-32, 108, 111 (D10 : recours parallèle, 276 850 sur 395 500) | |
| 9002 étape 17 | Versement au fonds par l'archiviste, numéro ARC, bordereau de 11 pièces, localisation, scellement, verser deux fois impossible | COUVERT | FR-167 à 170 | |
| 9002 | Les 3 moments forts (écart de 65 %, contestation tranchée, expertise non payée) | COUVERT | UJ-3, FR-58, 65, 66 | |
| 9002 | Les 21 refus à provoquer | COUVERT | FR-16 (7 cités), 137 | Lister les 21 refus de la démo en annexe de recette (FR-16 n'en cite que 7). |
| 9002 | Cinq chiffres jamais confondus (devis, chiffrage, provision, repère, comparables, arrêté) | COUVERT | FR-75, 17, 185 | |
| 9001 | Un sinistre, deux expertises : écart 32 %, radiateur non retenu, IPP 8 %, arrêté 1 850 000 | COUVERT | FR-15, 61, 65, 70 | |
| 9003 | Gros sinistre : délégation 39 500 000, expertise externe imposée, second besoin proposé, inventaire, complétude 92 % | COUVERT | FR-58, 59, 78, 79 | |
| 9003 | Sinistre majeur au-dessus du seuil : suivi renforcé | OMIS | — | Voir A, « Suivi des sinistres majeurs ». |
| 9004 | Mortel : jugement d'hérédité, fiche ayant droit, rapport post-mortem sur la grille du décès | PARTIEL | FR-64, 70 | Voir A, « Décès » (registre des ayants droit). |
| 9004 | Verser avant clôture refusé ; reconstitution avec lieux cherchés ; originaux irremplaçables en copie ; la direction certifie | COUVERT | FR-168, 173 | |
| Lecture | PDF né numérique lu, scan en image non lu | ÉCARTÉ | FR-163 (OCR réel) | |
| Modèles | Convention d'expertise (art. 8 à 11), formulaires du fonds de garantie | ÉCARTÉ | §0, §11 (pièces non togolaises : modèles seulement) | |
| 2bis | Les écarts de chaque étape avant correction, tous corrigés en rejeu 2 | COUVERT | FR-16, 137 | |
| 99 | 23 améliorations classées (arbitrage, relecture de la mission, pré-remplissage, horloge unique, dépôt multiple, requalification, rappel complément, histogramme, remise, versement réservé) | COUVERT | FR-13, 54, 66, 67, 75, 97, 159, 168 | |
| 99 | Changement de profil sans déconnexion | OMIS | — | Voir D, « Connexion ». |
| 99 | Questions probables de l'équipe sinistres (complément non reçu, franchise, déclaration tardive, part du tiers, dates) | COUVERT | FR-43, 54, 67, 69 | |
| 99 | Tests d'écran rejoués avant chaque séance (les tests de logique ne voient pas l'écran) | PARTIEL | FR-264 | Ajouter un test de parcours d'écran, rejoué à chaque livraison, en plus de la logique. |
| Rejeu 2 | 104 vérifications reprises comme tests de recette « 104 sur 104 » | PARTIEL | FR-15, 264, §9 | Au moins 9 des 104 sont contredites par des décisions du PRD (voir les 10 omissions, n° 1) : ajouter une table de reprise. |
| Rejeu 2 | Bloc 0 (4) : reset visible, grisé vierge, DECLARE, changer de profil | PARTIEL | FR-15 | « Changer de profil » sans exigence ; reset réservé à ADMIN en espace d'essai (FR-15). |
| Rejeu 2 | Blocs 1 à 5 (4+6+2+5+2) : statuts nommés PIÈCES INCOMPLÈTES, EN ÉTUDE | ÉCARTÉ | FR-134 (renommés PIECES_ATTENDUES, EN_INSTRUCTION) | Réécrire les libellés attendus dans la table de reprise. |
| Rejeu 2 | Blocs 6 à 12 (5+6+9+8+3+4+13) : rapports, contestation, contre-expertise, responsabilité | COUVERT | FR-54, 61 à 68, 180 | Les 4 vérifications « sans rechargement » restent sans FR (voir I). |
| Rejeu 2 | Bloc 13 (11) : « ÉVALUÉ à 445 500 », « provision réajustée à 445 500 » | ÉCARTÉ | FR-69, 76 (D15 : franchise déduite, 395 500) | Les 2 vérifications changent de valeur attendue. |
| Rejeu 2 | Bloc 14 (6) : « ordre de règlement émis » dès la validation | ÉCARTÉ | FR-82, 86, 90 (D6) | Insérer l'offre et l'accord avant l'ordre. |
| Rejeu 2 | Bloc 16 (8) : « Transmettre au pôle recours » après le règlement | ÉCARTÉ | FR-32, 108 (D10) | Remplacer par « le recours existe depuis l'ouverture ». |
| Rejeu 2 | Blocs 15, 17, 18 (2+5+1) : chèque, versement, remise à zéro | COUVERT | FR-93, 94, 167 à 170, 15 | |

---

---

## Décompte par statut

263 éléments classés : **168 COUVERT, 52 PARTIEL, 24 ÉCARTÉ (décision citée), 19 OMIS.**

Le PRD est très complet sur le circuit (machine d'états, délégations, règlement, recours, IA, GED, installation) : les omissions sont concentrées sur le corporel lourd, les gros sinistres, le pilotage technique de la direction, et le lien entre le rejeu de la démo et les décisions du PRD.

---

## Les 10 omissions qui comptent

Classées par gravité pour la suite avec la compagnie (la démo lui a été montrée : chaque point ci-dessous est un « ça y était dans la démo » qu'elle peut relever).

1. **Les 104 vérifications du rejeu ne peuvent pas toutes passer « 104 sur 104 » (FR-15, FR-264, indicateur §9).** Le PRD les exige comme recette tout en décidant des écarts qui les contredisent : franchise déduite (445 500 devient 395 500, provision comprise), offre et accord avant l'ordre de règlement (la vérification « ordre émis » après validation tombe), recours parallèle (la vérification « transmettre au pôle recours après règlement » tombe), statuts renommés, reset réservé à ADMIN, changement de profil sans exigence. Au moins 9 des 104 sont contredites ou à réécrire. *Correction : ajouter une annexe « table de reprise des 104 » (reprise telle quelle, amendée par la décision D-x, supprimée), et reformuler la cible en « 104 vérifications rejouées ou amendées par décision citée ».*

2. **Le décès et ses ayants droit : aucun registre (scénario 9004 joué devant la compagnie).** Le PRD traite les ayants droit seulement au règlement (bénéficiaire conforme, tutelle art. 234). La démo tient leur qualité, leur fondement de droit, leur part successorale, le mineur et son représentant, l'autorisation judiciaire, le RIB vérifié, les documents. *Correction : FR « ayants droit » en §5.6 ou §6.3, avec registre, pièces et vérification, branchée sur l'ordre de règlement.*

3. **Le suivi médical du corporel est incomplet (UJ-4, cœur de l'offre).** Manquent : le contrôle de conformité des certificats (signature, cachet, original ou copie, verdict avec motif), la chronologie médicale, le suivi après consolidation (aggravation, rechute, nouvelle IPP contre initiale), les motifs et jalons de la mission médicale, la convocation avec absence et nouvelle convocation, le compte rendu d'examen. Les urgences corporelles (parcours secours, admission, hospitalisation, alertes) n'ont aucune FR, ni décision d'écart. *Correction : FR « suivi médical » en §5.5 ; pour les urgences, décider avec la compagnie (réel avec données hospitalières, ou écart consigné).*

4. **Les sinistres majeurs n'existent pas.** La démo porte un suivi renforcé (notification du réassureur, comité de suivi, fréquence de rapport quotidienne ou hebdomadaire, criticité, contrôle de sous-assurance) ; le PRD ne garde que la délégation (scénario 9003 : 39 500 000). Or les traités par excédent (FR-190) imposent un avis au réassureur. *Correction : FR « sinistre majeur » : seuil paramétrable, avis au réassureur, comité de suivi, rapport périodique, vue dédiée.*

5. **Les états techniques de la direction sont réduits à l'état des provisions (FR-189).** Absents : triangle de liquidation, taux de liquidation, boni et mali de liquidation, coût moyen, état par branche, export de liquidation, note de synthèse recomposée, revue mensuelle imprimable, export du parapheur, charge nette après coassurance et réassurance. FR-206 nomme l'onglet « technique et réglementaire » sans en fixer le contenu ; FR-228 renvoie à un rapport du PRD distributeur. *Correction : FR « états techniques et revue de direction » en §6.4 ou §6.7, avec ces sept livrables.*

6. **Les intervenants tiers des risques divers n'ont aucune FR** (syndic, transporteur, partie adverse, administration, prestataire, avocat, courtier, compagnie adverse : action attendue, relance, date cible, impact du retard). Le titre de §6.3 les promet, le contenu n'existe pas ; la vue « mes attentes » et les vues « tiers externes » en dépendent. *Correction : FR « intervenants » en §6.3.*

7. **Les documents officiels (PV de police et de gendarmerie, rapports d'autorité) se réduisent à un remplacement par version (FR-161).** Absents : le registre par type, le statut de vérification (reçu, à vérifier, vérifié, sous réserve, rejeté, obsolète), les informations clés « déclarées dans le PV, jamais une conclusion de responsabilité », l'attendu relancé avec échéance. Ils servent la preuve du recours et le vol ou l'incendie. *Correction : FR « documents officiels » en §6.2.*

8. **La boucle de distribution est ouverte.** Pas d'état « offre expirée », pas d'état « offre retournée » ni d'alerte « pli non distribué », pas de statut de courrier « retourné », pas de suivi de distribution pour SMS et courrier (la démo avait l'alerte `offre-retournee`). Sans elle, une offre non reçue fait courir le délai légal du corporel sans que personne le voie. *Correction : états « expirée » et « retournée » en FR-82 à FR-89, et statut « retourné » en FR-122.*

9. **Les postes d'indemnisation hors corporel et les références de tiers manquent.** Pas de postes matériel (immobilisation, remorquage, valeur de remplacement) ni divers (bâtiment, contenu, perte d'exploitation, sauvetage), pas d'état par poste, pas d'alerte « évaluation incomplète ». Pas de référentiel des garages ni des assureurs adverses, alors que l'analyse de devis (FR-60) et le graphe de fraude (FR-132) s'en servent. *Correction : compléter FR-73 avec les postes et leur état ; ajouter un référentiel garages et assureurs adverses en §6.3.*

10. **Aucune exigence de concurrence ni de mise à jour d'écran sans rechargement ; pas de bascule de profil de démonstration.** La démo a eu quatre défauts d'écran non mis à jour (« Décider », « complément demandé », « expert désigné », « rédiger mon rapport »), listés dans le rejeu ; le PRD passe à un serveur multi-utilisateurs sans dire ce qui arrive quand deux agents ouvrent le même dossier, ni que l'écran doit se mettre à jour seul. La séance d'immersion se jouera rôle après rôle sur un seul poste (14 changements de profil dans la démo). *Correction : FR de concurrence (version du dossier, refus avec message) et de mise à jour sans rechargement dans FR-264 ; sélecteur de profil dans FR-15.*

Autres omissions de moindre poids, déjà dans les tableaux : vue kanban par étape, calibration et simulateur des grilles, coût de numérisation par page, veille de 3 jours avant règlement d'un dossier sensible, « mes visites » de l'expert interne, retrouver un dossier archivé jamais par la cote, formats de numérotation des quittances et recours, code de lecture sur les chemises, mise en route des courriers en impression groupée.

---

## Vérification des éléments « simulés »

Sur les 27 lignes de la section I (ce que la démo simule), 19 ont une exigence qui le rend réel (COUVERT), 5 sont PARTIEL (envois sans suivi de distribution, médical dérivé, code de lecture des chemises, reporting, référentiels de tiers), 2 sont OMIS (concurrence, mise à jour sans rechargement), 1 est ÉCARTÉ (interpolation de l'IPP).

Les 8 écarts à la démo les plus structurants sont **décidés** et cités : numéro de sinistre du logiciel de la compagnie (D3), offre et accord avant l'ordre (D6), délais légaux séparés (D7), délégation à plusieurs niveaux (D8), recours parallèle (D10), règlements multiples (D11), franchise déduite et corporel poste par poste (D15), pas de voix ni de chatbot au premier jour (D13).
