# Réconciliation du PRD Assurance avec la SPEC métier, les pièces de référence, le mémoire de 2014 et la réglementation

Date : 2026-11-13. Lecture seule du PRD (`prd.md`, 4 904 lignes) ; seul ce fichier est écrit.
Entrées : `extract-spec-pieces.md`, `extract-recherche-cima.md`, `.memlog.md`, `plan-redaction.md`. Règle d'arbitrage rappelée : le code de la démo et le récit du PO l'emportent sur la SPEC ; la réglementation l'emporte sur tout pour les obligations légales. « La compagnie » = le client ; « le mémoire de 2014 » = l'audit d'une autre compagnie de la zone (Sénégal).

Statuts : COUVERT (y compris « écarté volontairement » quand la décision est tracée au PRD, signalée par « écart voulu ») ; PARTIEL ; CONTREDIT ; OMIS ; CITATION NON VÉRIFIÉE (aucune trouvée : voir la partie E).

Les parties : A = SPEC ; B = pièces de référence ; C = mémoire de 2014 (chap. V et VI) ; D = règles réglementaires SÛR ; E = toutes les citations d'article du PRD ; F = points à faire valider par un juriste vs §13.2 ; G = écarts internes relevés en passant.

---

## A. SPEC_METIER (§1 à §13) et trous/incohérences relevés par l'extraction

| # | Source | Règle | Statut | FR | Correction proposée |
|---|---|---|---|---|---|
| S1 | SPEC §1 | Six douleurs terrain (dispersion, relances, traitement partagé, pièces dispersées, règlements non rapprochés, qualité non mesurable) | COUVERT | FR-150, FR-152, FR-147, FR-162, FR-206, FR-213 | — |
| S2 | SPEC §2 | Statuts `DECLARE` → … → `CLOTURE` | COUVERT (écart voulu : 11 statuts, 4 sorties, décision D5 et récit du PO) | FR-30, FR-134 | — |
| S3 | SPEC §2 | Numéro de sinistre dès la déclaration, même incomplète, même blessure grave | COUVERT | FR-36, FR-37, FR-39 | — |
| S4 | SPEC §2 | Ouverture bloquée tant qu'une pièce obligatoire manque | COUVERT (écart voulu : on ouvre « en attente de pièces », défaut corrigé de la démo) | FR-45 | — |
| S5 | SPEC §2 | Courrier de demande préparé, assuré relancé | COUVERT | FR-46, FR-47, FR-143 | — |
| S6 | SPEC §2 | À chaque étape une information reste attachée au dossier | COUVERT | FR-13, FR-138 | — |
| S7 | SPEC §2 | Clôturé consultable ; réouverture tracée | COUVERT | FR-107 | — |
| S8 | SPEC §2 | Sorties latérales `RECOURS` et `REJETE` | COUVERT (écart voulu : `RECOURS` devient un suivi parallèle, 4 sorties) | FR-31, FR-32, FR-121 | — |
| S9 | SPEC §3 | 4 volets, délais cibles 45/21/30/90 j | COUVERT (point de départ/arrêt tranchés par assumption) | FR-142 | — |
| S10 | SPEC §3 | Corbeille personnelle (son volet) et corbeille de service | COUVERT | FR-147, FR-51 | — |
| S11 | SPEC §4 | Pièces obligatoires par type ; liste auto corporel (6 pièces) | COUVERT | FR-44, annexe D.2 | — |
| S12 | SPEC §4 | Complémentaires ; cycle d'une pièce ; sources ; statut OCR | COUVERT (écart voulu : source `chatbot` remplacée par `WHATSAPP`, chatbot assuré « bientôt ») | FR-44, FR-159, FR-163 | — |
| S13 | SPEC §4 | Rapport de police rattaché ; assuré fautif = pris en charge, tiers fautif = recours | COUVERT | FR-54, FR-108 | — |
| S14 | SPEC §5 | 4 grilles paramétrables ; barème et tranche gardés ; évaluation arrêtée jamais écrasée | COUVERT | FR-75, FR-69 à FR-73 | — |
| S15 | SPEC §5 | Montant évalué / déjà payé / reste à payer, en permanence | COUVERT | FR-75, FR-91 | — |
| S16 | SPEC §5 | Règlements partiels = la norme au corporel (acompte avant l'arrêt définitif) | COUVERT | FR-91, FR-92 | — |
| S17 | SPEC §5 | Quittance (moyen, n° chèque, banque, dates) ; statuts ; T-Money et Flooz rapprochés comme les chèques | COUVERT (écart voulu : statuts de quittance redéfinis, décision D11) | FR-92, FR-96, FR-224 | — |
| S18 | SPEC §5 | Liste d'appels du matin, relance au-delà de 7 jours, accusé à la remise | COUVERT | FR-101, FR-97 | — |
| S19 | SPEC §5 | État mensuel ; trois contrôles bloquent la clôture du mois : quittances non rapprochées, remises sans accusé signé, chèques édités non retirés | PARTIEL | FR-224, FR-193 | L'état mensuel et la « détection des écarts avant clôture » existent, mais aucune exigence ne dit que la période ne se ferme pas tant que les trois contrôles ne sont pas levés. Ajouter à FR-224 : « une période ne se clôt pas tant qu'il reste un règlement non rapproché, une remise sans accusé signé (chèque, espèces) ou un chèque émis non retiré au-delà de 7 jours ; test sur le jeu de démo ». |
| S20 | SPEC §6 | 7 modèles de courrier (demande de pièces, offre, refus, relance, accusé, convocation à expertise, mise en demeure), copie archivée automatiquement | PARTIEL | FR-46, FR-48, FR-63, FR-83, FR-114, FR-122 | Le catalogue des 7 modèles n'est écrit nulle part ; « relance » et « convocation à expertise » (hors médical) n'ont pas de modèle nommé. Lister les modèles dans D.3 (code, FR, mentions légales obligatoires au corporel) et ajouter le modèle de courrier FGA / exception de garantie (voir P8). |
| S21 | SPEC §6 | Impression groupée pour le départ courrier physique | OMIS | — | FR-46 donne l'état `A_IMPRIMER` mais aucune exigence de lot. Ajouter : « imprimer un lot de courriers `A_IMPRIMER` avec bordereau de départ ; chaque courrier passe `ENVOYE` à la remise au courrier, avec l'agent et l'heure ». |
| S22 | SPEC §7 | Chaque action horodatée, attribuée ; versions de pièces ; historique règlements ; piste exportable | COUVERT | FR-13, FR-138, FR-158 | — |
| S23 | SPEC §8 | Indicateurs recalculés depuis les horodatages | COUVERT | FR-212, FR-213, FR-206, FR-207 | — |
| S24 | SPEC §9 | Assistant : liste exacte des pièces au premier contact, téléversement mobile, état d'avancement, français et anglais, transfert humain | COUVERT (écart voulu : chatbot assuré et anglais « bientôt », PO D13) | FR-22, FR-35, FR-46 | — |
| S25 | SPEC §10 | 11 rôles | COUVERT (écart voulu : 14 rôles, D14) | FR-6, annexe B | — |
| S26 | SPEC §10 | « Tout, lecture » pour `ACCUEIL`, `GED`, `COMPTABLE` alors qu'ils écrivent | COUVERT | annexe B | — |
| S27 | SPEC §11 | Autant de missions que de questions distinctes (2 ou 3 par accident avec blessé) | COUVERT | FR-58, FR-61 | — |
| S28 | SPEC §11 | Cycle de mission `SUGGEREE → … → VALIDEE`, `TRANSMISE` seulement externe | COUVERT | FR-61 | — |
| S29 | SPEC §11 | Aucune mission ne naît d'elle-même ; refus conservé avec motif | COUVERT | FR-58 | — |
| S30 | SPEC §11 | Contre-expertise : jamais le cabinet du premier rapport ni le panel interne, refus du système | COUVERT | FR-66 | — |
| S31 | SPEC §11 | Rapport confronté aux pièces et référentiels, « jamais à une estimation concurrente (devis versé, provision arrêtée, médiane) » | CONTREDIT | FR-65 | FR-65 reprend la phrase de la SPEC mot pour mot (liste le devis, la provision et la médiane comme ce qu'on ne doit pas utiliser) puis prend l'écart de 65 % au devis comme « cas type » et fait de la médiane un repère affiché. Trancher avec le PO et réécrire : « le rapport est confronté à des contreparties nommées et sourcées (devis versé, provision, médiane de au moins 5 missions) ; Prospera ne fabrique jamais sa propre estimation du dommage ; l'écart se termine par une question, jamais par un verdict ». |
| S32 | SPEC §11 | Complétude de forme (signature, chiffrage, conclusion, bien) ; le « score » | COUVERT (le score est défini : trou comblé) | FR-64 | — |
| S33 | SPEC §11 | Interne ou externe selon honoraires, sortie de donnée, indépendance ; externe imposé (contre-expertise, fraude, contentieux, enjeu, domaine) | COUVERT | FR-59, FR-62 | — |
| S34 | SPEC §11 | Charge : nombre de missions, charge pondérée, échéancier des rapports | COUVERT | FR-183 | — |
| S35 | SPEC §11 | Cinq montants ; viser au-delà du convenu exige un motif | COUVERT | FR-182 | — |
| S36 | SPEC §12 | Le papier reste obligatoire ; deux supports ensemble | COUVERT | FR-21, FR-172 | — |
| S37 | SPEC §12 | Numéro d'archivage attribué une fois, jamais réutilisé, sur la chemise ET l'enregistrement | COUVERT | FR-167 | — |
| S38 | SPEC §12 | Bordereau de versement ; un seul support fait foi ; on ne scelle pas une image incomplète | COUVERT | FR-168, FR-169 | — |
| S39 | SPEC §12 | Reconstitution : constat de carence, assemblage, complétude, certification par un autre agent, suffixe `/R1` | COUVERT | FR-173, FR-7 (ligne 10) | — |
| S40 | SPEC §12 | Pièces à original juridiquement propre ; copie non opposable | COUVERT | FR-21, FR-169, FR-173 | — |
| S41 | SPEC §12 | Chemise transmise à l'expert externe = sortie d'archive | COUVERT | FR-171 | — |
| S42 | SPEC §12 (trou) | Pas de durée de conservation ni de purge | COUVERT (trou comblé : 10 ans, destruction visée) | FR-174, FR-175 | — |
| S43 | SPEC §13 | Engagements de décaissement : un engagement naît quand l'indemnité est arrêtée, la mission confiée, le chèque parti non retiré ; exigible et à confirmer ne se somment jamais | OMIS | — | Seule la précaution « aucun solde bancaire » est reprise (FR-103). Le concept d'engagement et la règle de non-somme n'existent nulle part. Ajouter une FR en §5.8 ou §6.7 : « position des engagements de décaissement » en deux colonnes séparées (exigible / à confirmer), alimentée par l'indemnité arrêtée, les missions confiées et les chèques non retirés ; test : le total n'additionne jamais les deux colonnes. |
| S44 | SPEC §13 | Aucun solde bancaire affiché | COUVERT | FR-103 | — |
| S45 | SPEC trous | Seuil de délégation, seuil « enjeu » de l'expertise non chiffrés | COUVERT (paramètres, valeurs par défaut en assumption) | FR-8, FR-59 | — |
| S46 | SPEC trous | Transitions et déclencheurs des machines d'états ; critères de `REJETE`, réouverture | COUVERT | FR-135, FR-136, FR-121, FR-107 | — |
| S47 | SPEC trous | Circuit du chèque, T-Money, Flooz, autres moyens | COUVERT | FR-94, FR-95, FR-221 à FR-223 | — |
| S48 | SPEC trous | « Contrôle interne » sans contrôles formalisés ; CRCA absente | COUVERT | FR-210, FR-211 | — |
| S49 | SPEC trous | Provisions de sinistres | COUVERT | FR-49, FR-76, FR-188, FR-189 | — |
| S50 | SPEC trous | Recours : subrogation, relance, débours, convention | COUVERT | FR-108 à FR-119 | — |
| S51 | SPEC trous | Archivage : sceau, durée, purge | COUVERT | FR-169, FR-174, FR-175 | — |
| S52 | SPEC trous | Pas de matrice rôles × actions ; données de santé non évoquées | COUVERT | FR-9, FR-153, annexe B | — |
| S53 | SPEC §3.2 | `RECOURS` à la fois statut, volet, rôle | COUVERT | FR-32 | — |
| S54 | SPEC §3.2 | `CHEQUE_A_REMETTRE` lié au chèque alors que T-Money ne se « remet » pas | COUVERT | FR-92 | — |
| S55 | SPEC §3.2 | Deux sens de « contre-expertise » | COUVERT | §3 vocabulaire, FR-66 | — |

---

## B. Pièces de référence (hors mémoire)

| # | Source | Règle | Statut | FR | Correction proposée |
|---|---|---|---|---|---|
| P1 | Constat amiable (gabarit) | Modèle de données du constat : parties, assureur et n° de police de chaque partie, circonstances normalisées, croquis, signatures | PARTIEL | FR-44, FR-54, FR-108 | Le constat est une pièce, mais ni ses champs ni le fait qu'il identifie l'assureur adverse (qui alimente le recours) ne sont spécifiés. Ajouter à FR-56 (pré-remplissage) ou FR-54 la liste des champs lus du constat et « assureur et n° de police du tiers » comme source du débiteur du recours (FR-108). Le Code CIMA ne parle pas de constat amiable : rester en paramètre. |
| P2 | Rapport d'expertise (gabarit) | Dommages préexistants distingués ; photo du point de choc et immatriculation obligatoires | OMIS | — | Absent de FR-64 (points types automobile : méthode, valeur vénale, caractère réparable). Ajouter « dommages préexistants » et « photo du point de choc + immatriculation » comme points de la grille de complétude automobile. |
| P3 | Convention d'expertise (modèle étranger) | Minuteurs de mission : information écrite du retard à 45 j, procès-verbal de carence à 75 j, rapport 10 j après les factures, constat préliminaire 10 j, contestation 5 j | OMIS | FR-68 (délais par domaine seulement) | L'extraction recommandait de les reprendre comme valeurs paramétrables, jamais comme règle. Le PRD s'en tient aux délais par domaine et à l'alerte « rapport en retard ». Ajouter en D.3 les deux paramètres à défaut vide ou à 45 j / 75 j « à confirmer à la séance d'immersion » (carence expert), ou écrire dans §10.2 qu'ils sont écartés. |
| P4 | Convention d'expertise | Pluralité d'experts (2e expert, 3e arbitre, honoraires par moitié), contradictoire avec convocation de l'expert initial | PARTIEL | FR-66, FR-119 | Distinction des deux contre-expertises faite ; la mécanique inter-assureurs est renvoyée « en paramètre » sans exigence. Acceptable tant qu'aucune convention togolaise n'est fournie : l'écrire dans §10.2 comme hors périmètre jusqu'à réception de la convention de place. |
| P5 | Convention d'expertise | Seuils par montant (expertise obligatoire, non-contestation, photos après réparation) | PARTIEL | FR-59 | Seuils d'expertise et d'accord sur devis repris ; « photos après réparation » absent. Ajouter au paramétrage de FR-59 ou l'écarter explicitement. |
| P6 | Tableau d'évaluation médico-légale (grille) | Objet structuré : périodes ITT/ITP, date de consolidation (pivot acompte/définitif), taux, postes, décision binaire retenu/contesté par poste | PARTIEL | FR-63, FR-70, FR-85 | Postes du Code CIMA et consolidation repris ; la décision binaire retenu/contesté par poste (utile à la contre-expertise médicale) et les périodes d'ITT/ITP datées ne figurent pas comme exigence. Ajouter à FR-70 : « chaque poste porte retenu / contesté et la période datée ; la consolidation enregistrée ouvre l'échéance de l'offre définitive ». |
| P7 | Règlement FGA (true.pdf) | Renvoi corporel auteur inconnu ou non assuré : PV 60 j, transaction 1 mois, déclaration 3 mois | COUVERT (écart voulu : désactivé par défaut, existence au Togo non confirmée) | FR-111, FR-141, D.5 | — |
| P8 | Règlement FGA | Courrier au Fonds et à la victime quand l'assureur oppose nullité, suspension ou non-assurance, avec n° du contrat | PARTIEL | FR-121, FR-141 | Alerte 3 mois présente (FR-121), mais aucun modèle de courrier ni exigence d'« aviser la victime et ses ayants droit avec le n° du contrat ». Ajouter le modèle dans la liste de S20, actif seulement si `FGA_ACTIF`. |
| P9 | Formulaires FGA (dossier ayants droit, blessé) | Listes de pièces décès (13) et blessé (6) ; consolidation ou guérison = pièce ; procuration ; représentant des héritiers | COUVERT | FR-44, FR-97, FR-145 | — |
| P10 | Mémoire (coquille) | « Décompte d'indemnité dans les 7 heures » ne doit pas être repris | COUVERT | — | Vérifié : aucune occurrence dans le PRD. |

---

## C. Mémoire de 2014 (chap. V procédure, chap. VI défauts et recommandations) : une exigence par contrôle

| # | Source | Règle ou défaut relevé | Statut | FR | Correction proposée |
|---|---|---|---|---|---|
| M1 | Chap. VI | Sinistres enregistrés 3 à 4 jours après réception (enregistrement tardif) | COUVERT | FR-34 (deux dates : réception, saisie ; alerte au-delà de 1 jour ouvré), FR-39, indicateur §9 | — |
| M2 | Chap. VI | Accusés de réception jamais envoyés | COUVERT | FR-48 (10 j, alerte au 8e jour), FR-213 | — |
| M3 | Chap. VI | Offres hors délai | COUVERT | FR-84 (48 h ouvrées), FR-142, FR-213 | — |
| M4 | Chap. VI | Fichier des charges (provisions) non à jour | COUVERT | FR-49, FR-76 (revue à chaque événement, 90 j sans mouvement), FR-188 | — |
| M5 | Chap. VI | Évaluation à l'ouverture sans critère objectif | COUVERT | FR-49 (milieu de tranche par gravité, estimation du déclarant tracée) | — |
| M6 | Chap. VI | Devis, PV, rapport d'expert, date de paiement manquants dans les dossiers | COUVERT | FR-45, FR-145, FR-211 (contrôle de complétude), FR-209 | — |
| M7 | Chap. VI | Même rédacteur instruit et ordonnance l'indemnité (fonctions incompatibles) | COUVERT | FR-7 (SEP-01 à SEP-03, 12 cumuls interdits), FR-210 | — |
| M8 | Chap. VI et recomm. | Personne désignée pour le contrôle de séquence des numéros ; contrôle de séquence | PARTIEL | FR-36 (« un trou dans la séquence est détectable par le contrôle interne »), FR-210 | FR-36 renvoie au contrôle interne, mais le plan de contrôle de FR-210 (familles séparation, décaissement, traçabilité, dossier) n'a aucun test de séquence, et le numéro officiel du LC (FR-37) n'est pas contrôlé. Ajouter à FR-210 un test « trou ou doublon dans la série des `DEC-` et dans les numéros officiels reçus du LC », tolérance zéro, gravité majeure, avec le rôle responsable (`AUD`). |
| M9 | Chap. VI | Classement sans critère précis | COUVERT | FR-121, FR-123 (motifs), FR-167 (numéro d'archivage par volet) | — |
| M10 | Chap. VI | Grande discordance entre date de réception du rapport d'expert et date d'édition de la quittance | OMIS | FR-213 (délais moyens globaux seulement) | Aucun indicateur ni alerte ne mesure rapport reçu, offre, quittance. Ajouter à FR-213 les compteurs du mémoire : déclaration → enregistrement, ouverture → validation, rapport → offre, offre → paiement, avec alerte sur l'écart anormal rapport-quittance. |
| M11 | Chap. VI | Dossiers recours transmis sans trace ni copie | COUVERT | FR-109 (copie conservée avant tout envoi, preuve d'envoi) | — |
| M12 | Chap. VI | Dossiers à clôturer restés ouverts | PARTIEL | FR-144 (muets), FR-104 | Un dossier `REGLE` non clos devient « muet » après 30 j, mais aucune alerte ne vise spécifiquement `REGLE` non clôturé (reste à payer zéro). Ajouter une échéance « clôture après le dernier règlement `PAYE` » dans FR-142 (défaut 15 j) et un indicateur. |
| M13 | Recomm. | Revue mensuelle des dossiers vivants | OMIS | FR-210 (échantillon de 12 dossiers par période), FR-144 | Le tirage d'un échantillon n'est pas une revue de tous les dossiers vivants. Ajouter à FR-210 ou FR-206 : « revue mensuelle » = liste de tous les dossiers non terminaux avec statut, provision, dernière action, échéance ; visa du responsable, trace de la revue faite (qui, quand) ; alerte si non faite à M+5 jours. |
| M14 | Recomm. | Rapprochement des paiements dossier / trésorerie | COUVERT | FR-224, FR-95 | — |
| M15 | Recomm. | Rapprochement honoraires d'experts / état comptable | PARTIEL | FR-182, FR-193 | Les honoraires visés et payés sont exportés, mais aucun rapprochement avec l'état de la comptabilité. Ajouter à FR-224 : les règlements de nature `HONORAIRES` sont rapprochés comme les autres. |
| M16 | Recomm. | Séparation étude / ordonnancement / contrôle / paiement | COUVERT | FR-7, FR-93, FR-210 | — |
| M17 | Recomm. | Dossier qui mentionne automatiquement n° et date d'effet du contrat, assuré, code agent, justificatif de prime, indemnisation, facture, rapport, lettre | COUVERT | FR-152, FR-186 | — |
| M18 | Recomm. | Registre (exercice de survenance, date opération, date de réception, catégorie, bénéficiaire, référence de règlement, recours, observation), exportable | PARTIEL | FR-192, FR-211, FR-103 | Les colonnes sont presque toutes produites par FR-192 et FR-103, mais il n'y a pas de « registre des sinistres » chronologique nommé. Ajouter une exigence : registre exportable des déclarations dans l'ordre d'arrivée avec ces colonnes (le registre coté et paraphé du mémoire devient le journal chaîné FR-13). |
| M19 | Chap. V | Déclaration obligatoire, responsable ou non ; déclaration verbale confirmée par écrit | COUVERT | FR-34 (confirmation écrite), FR-39 | — |
| M20 | Chap. V | État hebdomadaire des déclarations visé par le chef de département, remis chaque vendredi à 16 h au directeur ; copie à la direction générale | OMIS | — | Rien d'équivalent (seul l'état hebdomadaire des recours est cité, FR-110). Ajouter à FR-206 ou FR-208 : « état hebdomadaire des déclarations » généré au jour et à l'heure paramétrés, visé par `RESP`, remis à `DT` puis `DG`. |
| M21 | Chap. V | À l'ouverture : identité, validité de la police (période, suspension, garanties, prime payée), doublon | COUVERT | FR-38, FR-41 | — |
| M22 | Chap. V | Exclusion ou non-assurance : décision soumise au directeur sous 48 h avec projet de courrier ; assuré informé sous 72 h | PARTIEL | FR-121 | FR-121 ne retient que « courrier de refus sous 2 jours ouvrés » (assumption). Le délai de 48 h pour soumettre la décision n'est pas une exigence. Ajouter une échéance interne « décision d'exclusion soumise » (48 h) et ramener le courrier à 72 h, ou justifier 2 jours ouvrés. |
| M23 | Chap. V | Deux numéros sur le dossier physique (logiciel + registre) ; couleurs de chemise par branche ; sous-chemises | COUVERT | FR-36, FR-37, FR-170 | Les sous-chemises (déclaration/correspondances, police, dommages/devis/rapport, règlement) ne sont pas reprises : à écrire en paramètre de FR-170 si la compagnie les garde. |
| M24 | Chap. V | Dossier soumis au directeur dans les 48 h (mardis et jeudis) | PARTIEL | FR-77, FR-213 | Pas de délai « ouverture → soumission en validation » ni de séance fixe. Ajouter le compteur de M10 ; la séance du comité (FR-79) peut porter un jour fixe en paramètre. |
| M25 | Chap. V | Accord sur devis : matériel **sans recours**, dossier ≤ 300 000, devis ≤ 200 000, accord amiable sous 72 h | PARTIEL | FR-59 | La condition « sans recours » est absente (zéro occurrence dans le PRD) : un dossier avec tiers responsable peut passer par l'accord sur devis alors que la procédure de référence l'exclut. Ajouter à FR-59 la condition « aucun recours ouvert ou envisagé », avec test. |
| M26 | Chap. V | Inspecteur technique présent à l'expertise si devis > 1 000 000 FCFA | OMIS | — | Pas de règle de présence d'un contrôleur technique. Ajouter en paramètre de FR-59 (défaut vide, à confirmer à la séance d'immersion) ou l'écarter. |
| M27 | Chap. V | Rapport d'expert 7 j (dommages) / 10 j (RC), validation sous 72 h ; le rapport ne vaut pas règlement | COUVERT | FR-68, FR-64, FR-67 | Délai de validation de 72 h du rapport non repris : à ajouter à FR-68 si voulu. |
| M28 | Chap. V | Validation collégiale si dommages ≥ 1 000 000 FCFA, sinon rédacteur + inspecteur + directeur | PARTIEL | FR-8, FR-78, FR-79 | Fonctionnellement repris (comité + visa DT). Écart de frontière : le mémoire met 1 000 000 **dans** le collégial (≥), le PRD met 1 000 000 chez le responsable (≤). Aligner FR-8 ou documenter l'écart. |
| M29 | Chap. V | Honoraires : état hebdomadaire, payés un mois après réception du rapport, bordereau visé, signé du directeur, transmis à la comptabilité | PARTIEL | FR-182, FR-68 | Visa et paiement par le circuit repris ; l'échéance « paiement un mois après réception du rapport » est absente. Ajouter à FR-142 (défaut 30 j, paramètre). |
| M30 | Chap. VI | Honoraires calculés au prorata de l'indemnité (à proscrire) | COUVERT | FR-68 | — |
| M31 | Chap. VI | Expert choisi par le gestionnaire (indépendance) | PARTIEL | FR-62, FR-178 | L'indépendance entre dans le classement, mais le gestionnaire désigne toujours seul. Ajouter : au-delà d'un seuil (honoraires ou enjeu) la désignation est validée par `RESP`, et un choix hors classement exige un motif lu par `AUD`. |
| M32 | Chap. V | RC corporelle : séquelles selon le barème fonctionnel CIMA ; PV de transaction soumis sous 48 h, communiqué aux bénéficiaires sous 24 h | COUVERT | FR-70, FR-84 (24 h en assumption) | — |
| M33 | Chap. V | Offre signée chef de département, visa D.O., validation DG ; offre transmise sous 48 h ; paiement sous 72 h ; non-accord = contre-expertise | COUVERT | FR-8, FR-84, FR-102, FR-88 | — |
| M34 | Chap. V | Prévisions de règlement hebdomadaires à la direction financière chaque vendredi | OMIS | — | Absent (voir aussi S43). Ajouter à FR-103 : « prévision hebdomadaire des règlements » (ordres `A_PAYER`, chèques à remettre, honoraires visés) remise à la comptabilité. |
| M35 | Chap. V | Règlement à titre commercial : le Directeur Général seul, motivé | COUVERT | FR-8, FR-78, FR-90 | — |
| M36 | Chap. V | Recours : mise en cause dès l'ouverture, relance tous les 15 jours, transmission progressive, état par débiteur chaque semaine, possibilité de recours enregistrée à part | COUVERT | FR-108, FR-109, FR-110 | L'« état hebdomadaire des recours par débiteur » est cité (FR-110) sans FR de génération : à préciser avec M20. |
| M37 | Chap. V | Délai de déclaration par l'assuré (le mémoire dit « art. 7 » ; le Code lu donne art. 12-4°) : 5 j ouvrés, 48 h pour le vol | COUVERT | FR-43, D.5 | Mais voir G1 : les défauts de D.2 (5 et 2 « jours ») sont sous le plancher légal. |
| M38 | Chap. V | Vol : plainte + inventaire, certificat de non-retrouvaille après 30 j de recherche, paiement exigible 30 j après déclaration, franchise de 36 000 FCFA | OMIS | FR-55 (alerte « vol sans plainte ») | Ce sont des conditions générales d'une autre compagnie : ne pas les reprendre en règle. Ajouter seulement un paramètre « délai de recherche avant règlement d'un vol », à défaut vide, à lire dans les conditions générales de la compagnie. |

---

## D. Règles réglementaires marquées SÛR dans `extract-recherche-cima.md` : une exigence correcte ?

| # | Source | Règle | Statut | FR | Correction proposée |
|---|---|---|---|---|---|
| R1 | Code art. 225, 231 al. dernier | Champ : atteinte à la personne causée par un véhicule terrestre à moteur ; pas de délai d'offre pour les seuls biens | COUVERT | FR-14, FR-85, FR-141 | — |
| R2 | art. 231 al. 1 | Offre dans les 12 mois de l'accident ; 8 mois du décès | COUVERT | FR-14, FR-85, FR-141, D.5 | — |
| R3 | art. 231 al. 2 | Offre jamais inférieure au barème | COUVERT | FR-70 (`OFFRE_SOUS_BAREME`), FR-77 | — |
| R4 | art. 231 al. 3 | Sanction administrative en cas d'absence d'offre | COUVERT | FR-141 (colonne conséquence) | — |
| R5 | art. 231 al. 4, 243, 246 | Contenu de l'offre : chaque chef de préjudice, limitations et motifs, créances des tiers payeurs avec décomptes | COUVERT | FR-70, FR-82 | — |
| R6 | art. 231 al. 5 | Offre provisionnelle si consolidation inconnue à 6 mois ; offre définitive 6 mois après l'information | COUVERT | FR-14, FR-82, FR-85, FR-141 | — |
| R7 | art. 231 al. 6, 267 à 270 | Pluralité de véhicules : désignation de l'assureur qui mène l'offre (véhicule d'accueil, véhicule heurtant, barème de responsabilité, plaque la plus faible) ; mandat ; intérêts de retard à la charge du mandataire | OMIS | FR-108 (plusieurs recours seulement) | Aucune exigence de « qui fait l'offre » quand plusieurs véhicules sont en cause, ni de partage des intérêts de retard. C'est le cœur du corporel VTM multi-véhicules. Ajouter une FR en §5.4 ou §5.7 : saisie des véhicules et assureurs impliqués, calcul de l'assureur meneur (art. 267-269), bascule du dossier en « mandat pour compte d'autrui » avec intérêts de retard à la charge du mandataire (art. 270), paramétrable car le barème de responsabilité est à numériser (D21). |
| R8 | art. 231 al. 7 | Demande motivée de la victime : réponse sous 30 jours | COUVERT | FR-14, FR-141, D.5 | — |
| R9 | art. 233 | Intérêt de retard de 5 % par mois, réductible pour circonstances non imputables à l'assureur | COUVERT | FR-14, FR-85, FR-141 | Voir G2 (base de calcul écrite de trois façons) et G4 (provision du risque de pénalité promise sans exigence). |
| R10 | art. 235, 236 | Dénonciation de la transaction sous 15 j, en caractères très apparents (nullité relative) ; paiement dans le mois qui suit ; 5 %/mois | COUVERT | FR-82, FR-86, FR-102, FR-141 | — |
| R11 | art. 232 | Informer dès la première correspondance (copie du PV, conseil à ses frais) ; chèque libellé exclusivement au nom de la victime ou des ayants droit | COUVERT | FR-46, FR-82, FR-91, FR-94, FR-97, FR-221, FR-223 | — |
| R12 | art. 242 | Correspondance : nom du gestionnaire, conséquences d'un défaut de réponse | COUVERT | FR-46 (`MENTION_LEGALE_ABSENTE`), FR-82, FR-143 | — |
| R13 | art. 234 | Mineurs et incapables : transaction soumise aux parents ou au juge des tutelles ; avis 15 j avant paiement | COUVERT | FR-86, FR-91, FR-221, D.5 | — |
| R14 | art. 247 à 253 | Suspensions et prorogations du délai d'offre (avis tardif, décès tardif, pièces 6 semaines, réponse incomplète, expert commun, étranger) | COUVERT | FR-14, FR-85, FR-141, D.5 | Détail de l'art. 251 : « pas de suspension si aucune nouvelle demande dans les 15 jours après une réponse incomplète reçue dans les 6 semaines » non repris (nuance mineure) ; à ajouter au test de suspension. |
| R15 | art. 237 | Exception de garantie : l'assureur respecte tout de même les art. 231 à 236 « pour le compte de qui il appartiendra » | CONTREDIT | FR-121, FR-123 | FR-121 cite l'article correctement mais ordonne « la provision passe à zéro » au passage `REJETE` ; FR-123 fait pareil au `SANS_SUITE`. Au corporel VTM, l'offre reste due et le PSAP doit couvrir « tous les sinistres survenus et non payés » (art. 334-8, 334-12). Corriger : au corporel VTM, la provision ne passe à zéro ni au refus ni au classement ; elle est maintenue ou ramenée à l'estimation de l'offre légale, avec motif. |
| R16 | art. 239 | Pas de saisine du juge avant l'expiration du délai d'offre | COUVERT | FR-124 | — |
| R17 | art. 256 et 28 | Prescription : 5 ans (action extracontractuelle), 2 ans (action du contrat) ; sommes prescrites non versées reversées à la caisse des dépôts | PARTIEL | FR-14, FR-118, FR-77 | Les deux durées sont suivies comme terme à vérifier. Le reversement des sommes prescrites non versées (art. 28) est absent : sans objet pour la plupart des sinistres IARD, à inscrire en §10.2 ou au registre des points juridiques. |
| R18 | art. 20, 12-4° | Déclaration tardive : jamais de déchéance sans préjudice prouvé ; délai de déclaration ≥ 5 j ouvrés, 48 h pour le vol | COUVERT | FR-43, D.5 | Voir G1 pour les défauts de D.2. |
| R19 | art. 240, 241 | Pièces à demander à la victime et aux ayants droit | COUVERT | FR-44, D.2 | — |
| R20 | art. 244, 245 | Examen médical : avis 15 j avant avec identité du médecin et droit d'être assisté ; rapport transmis sous 20 j | COUVERT | FR-63, FR-184, D.5 | — |
| R21 | art. 272 | Qualification du médecin ou de l'expert (inscrit, diplômes, 5 ans) | COUVERT | FR-63, FR-177, D.5 | — |
| R22 | art. 230 | Le PV de tout accident corporel est transmis aux assureurs impliqués dans les 3 mois ; suivi de la demande et de la réception du PV | OMIS | FR-44 (le PV est une pièce) | Le PV est une pièce, mais ni l'échéance de 3 mois ni le suivi de la demande au PV ne sont exigés. Ajouter à FR-141 une échéance de suivi (point de départ : date de l'accident, arrêt : PV reçu, valeur par défaut 3 mois, nature « suivi » et non réglementaire contre la compagnie, car l'obligation pèse sur les officiers de police). |
| R23 | art. 215, 216 | Validité de l'attestation à la date du sinistre ; attestation provisoire 1 mois | PARTIEL | FR-41, FR-44 | « Police en vigueur » est contrôlée, mais pas l'attestation provisoire ni la présomption de l'art. 215. Ajouter à FR-41 : si l'assuré produit une attestation à la date du sinistre, la réserve « police non retrouvée » n'est pas un refus. |
| R24 | art. 210 | Exceptions opposables ou non à la victime (interprétation du 11/04/2011) | COUVERT | FR-41, FR-187 (alerte « opposabilité à la victime à vérifier ») | Voir F14 : ce point n'est pas au §13.2. |
| R25 | art. 257 à 266 | Barème corporel poste par poste ; numerus clausus ; plafonds en multiples du SMIG ; conditions IP ≥ 50 % et ≥ 80 % | COUVERT | FR-70, D.5 | — |
| R26 | art. 258 | Frais : plafonnés à 2 fois le tarif hospitalier public le plus élevé ; **lettre de garantie** à la demande de la victime | PARTIEL | FR-70 | Le plafond est repris ; la lettre de garantie à la victime n'est pas un modèle ni une exigence. Ajouter au catalogue de courriers (S20) et à FR-70 : « lettre de garantie de frais médicaux sur demande, dans les tarifs ». |
| R27 | art. 229 | Lésés « à la charge effective » (conjoint seul pour le moral, plafond 2 SMIG) | OMIS | — | Non cité dans le PRD. Ajouter à FR-70 la catégorie « personne à la charge effective » ou la renvoyer aux points du juriste. |
| R28 | art. 254, 255 | Tiers payeurs : recours poste par poste, déchéance à 6 mois sans production de créance | COUVERT | FR-70, D.5 | — |
| R29 | art. 271, 274, 275, 276, 277 | Subrogation après paiement ; barème de responsabilité ; part égale si indéterminable ; arbitrage obligatoire sous 1 mois ; intérêts au taux de l'escompte | COUVERT | FR-111, FR-113, FR-119 | — |
| R30 | art. 334-8, 334-12 | PSAP : valeur estimative des dépenses en principal et frais internes et externes, dossier par dossier, brute, IBNR hors dossier | PARTIEL | FR-76, FR-188, FR-189 | La provision est une « charge estimée du sinistre » ; rien ne dit qu'elle inclut les frais externes individualisables (honoraires d'experts, frais de conseil) ni les frais internes. Ajouter à FR-188 : « la provision comprend l'indemnité estimée et les frais individualisables (honoraires convenus, frais de justice) ». |
| R31 | art. 309, 310, 405 | CRCA : contrôle sur pièces et sur place, personnel qualifié, informations sur demande | COUVERT | FR-211 | — |
| R32 | art. 422, 405 | États annuels C10, C10a, C10b, C10d ; remise au 1er juin | COUVERT | FR-192 | — |
| R33 | art. 404 | Conservation 10 ans au moins des pièces, lettres reçues, copies des lettres envoyées | COUVERT | FR-21, FR-174, FR-256, D.5 | — |
| R34 | art. 406, 407 | Informatisation : états datés, pas d'insertion ni suppression ultérieure, reconstitution | COUVERT | FR-13, FR-138, FR-211 | — |
| R35 | art. 600 à 613 (FGA) | Fonds de garantie : auteur inconnu ou non assuré, déclaration 3 mois (art. 608), PV 60 j (606), transaction 1 mois (605) | COUVERT (écart voulu : FGA désactivé par défaut) | FR-111, FR-141, D.5 | Voir G5 : l'art. 608 est rattaché à un mauvais déclencheur dans FR-111. |
| R37 | Loi 2019-014 art. 21, 22, 24 | Données de santé sensibles ; consentement écrit ou autre base | COUVERT | FR-9, FR-19 | — |
| R38 | Loi 2019-014 art. 27 | Pas de décision sur le seul fondement d'un traitement automatisé | COUVERT | FR-11, FR-71 | — |
| R39 | Loi 2019-014 art. 28 à 31 | Transferts hors Togo : information préalable de l'IPDCP, avis motivé | COUVERT | FR-19 (registre des transferts) | — |
| R40 | Loi 2019-014 art. 51, 52, 53, 54 | Sous-traitant sous contrat ; accès par profil et traçabilité de la lecture ; conservation limitée ; pérennité | COUVERT | FR-153, FR-158, FR-174 | — |
| R41 | Loi 2019-014 art. 26 | Prospection directe interdite sans consentement | COUVERT | FR-18 | — |
| R42 | Règlement LBC 0004/2008 art. 4.1 | Responsable interne désigné, nom communiqué à la cellule, à la Direction nationale des assurances et à la CRCA ; compte rendu annuel au conseil | PARTIEL | FR-100, FR-225 | Le « responsable LBC » existe comme destinataire des alertes, mais la désignation, la communication de son nom et le compte rendu annuel (nombre de déclarations internes, transmises, formations) ne sont pas exigés. Ajouter à FR-225 : rôle ou désignation du responsable LBC dans l'annexe B (`ADMIN` ne le nomme pas seul) et un export annuel des alertes et suites. |
| R43 | Règlement LBC art. 4.5, 13 | Suivi des règlements de sinistres par date, montant, origine, destination, cumul ; conservation 10 ans | COUVERT | FR-100, FR-225 | — |
| R44 | Règlement LBC art. 11, 12 | Moyens à vérification minutieuse ; règlement en espèces important = indice de soupçon | PARTIEL | FR-98, FR-225 | Voir G6 : art. 11 est présenté comme visant « les espèces, les virements et les chèques » alors que le texte lu dit « chèques de banque » et vise surtout les primes. |
| R45 | Règlement LBC art. 10, 14, 15 | Déclaration de soupçon par le responsable, preuve de la vérification conservée 10 ans | COUVERT | FR-100, FR-133, FR-225 | La règle de non-information du client est renvoyée au juriste (voir F9). |
| R46 | Règlement LBC (suivi de la clientèle) | Ne rien rembourser avant les vérifications d'identité de la personne qui reçoit la prestation | COUVERT | FR-100 (contrôles 1 et 5) | — |
| R47 | Décret 2018-062 art. 3, 69 | Archivage électronique : lisibilité, non-modification, traçabilité | COUVERT | FR-169, FR-174 | — |
| R48 | Code art. 235 / art. 605 / art. 608 | Lettre recommandée, ou moyen faisant foi, requise à plusieurs endroits ; équivalence du recommandé électronique non établie | PARTIEL | FR-86, FR-114 | Le PRD garde le recommandé papier là où il est cité, sans écrire que la voie électronique n'est pas acceptée tant que le juriste n'a pas tranché. Ajouter à FR-86 : « la dénonciation et les mises en demeure ne sont considérées reçues qu'avec preuve de réception par un moyen listé en paramètre ». |

---

## E. Toutes les citations d'article du PRD (70 citations distinctes) et leur statut dans l'extraction

Méthode : recherche textuelle de tout « art. », « article » et des sigles de textes dans `prd.md` ; chaque numéro est rapproché de `extract-recherche-cima.md`. Aucun numéro cité n'est absent de l'extraction, et aucun n'y est marqué PROBABLE ou NON TROUVÉ. Le « Règlement CIMA » de la démo (juillet 2026, versionné 2026.2) n'est cité nulle part (sections « Écarts avec la démo relevés » du §5.7, ligne 1340, et du §5.15, écart n° 13 : « non vérifié, non cité »). La loi 2017-007 et la loi uniforme LBC 2018-004 ne sont pas citées avec numéro (« non lue »).

### E.1 Code CIMA 2019 (59 articles)

| Article | FR où il est cité | Statut dans l'extraction | Verdict |
|---|---|---|---|
| 12-4° | FR-43, D.5 | SÛR | Correct |
| 20 | FR-3 (§4.2), FR-43, FR-187, D.5 | SÛR | Correct |
| 28 | FR-14, FR-77, FR-118, D.5 | SÛR | Correct (2 ans, action du contrat) |
| 210 | FR-41, FR-187 | SÛR (interprétation du 11/04/2011 lue) | Correct |
| 225 | FR-85 | SÛR | Correct |
| 228 | FR-54 | SÛR | Correct |
| 231 (al. 1, 2, 5, 7, dernier) | FR-14, FR-70, FR-85, FR-123, FR-141, D.5, UJ-4 | SÛR | Correct |
| 232 | UJ-4, FR-46, FR-82, FR-91, FR-94, FR-97, FR-221, FR-223 | SÛR | Correct |
| 233 | UJ-4, FR-14, FR-85, FR-102, FR-141, D.5 | SÛR | Correct |
| 234 | FR-86, FR-91, FR-221, D.5 | SÛR | Correct |
| 235 | UJ-4, FR-82, FR-86, FR-90, FR-102, FR-141, D.5 | SÛR | Correct |
| 236 | UJ-4, FR-14, FR-102, FR-141, D.5 | SÛR | Correct |
| 237 | FR-121 | SÛR | Correct, mais voir R15 (l'effet sur la provision contredit l'article) |
| 239 | FR-88, FR-124 | SÛR | Correct |
| 240, 241 | FR-44, D.2, J-5 | SÛR | Correct |
| 242 | FR-46, FR-82, FR-109, FR-143 | SÛR | Correct (art. 242 vise la correspondance avec la victime ; FR-109 l'applique aussi à la lettre au tiers responsable, sans conséquence) |
| 243, 246 | FR-70, FR-82 | SÛR | Correct |
| 244, 245 | FR-63, FR-184, D.5 | SÛR | Correct |
| 247, 248, 249, 250, 251, 252, 252 bis, 253 | FR-14, FR-63, FR-85, FR-124, FR-141, D.5 | SÛR | Correct |
| 254, 255 | FR-70, D.5 | SÛR | Correct |
| 256 | FR-14, FR-118, D.5 | SÛR | Correct |
| 257, 258, 259, 260, 261, 262, 263, 263-1, 264, 265, 266 | FR-24, FR-70, D.5 | SÛR (valeurs de la table de l'art. 260 et clés de l'art. 265 NON reproduites, ce que le PRD respecte) | Correct |
| 271 | FR-111 | SÛR | Correct |
| 272 | FR-63, FR-177, D.5 | SÛR | Correct |
| 274, 275, 276, 277 | FR-111, FR-113, FR-119, D.2 | SÛR | Correct |
| 310, 405 | FR-192, FR-211 | SÛR | Correct |
| 334-12 | FR-117, FR-188, FR-189 | SÛR | Correct |
| 404 | FR-13, FR-19, FR-21, FR-105, FR-138, FR-158, FR-174, FR-236, FR-256, D.5 | SÛR | Correct |
| 406, 407 | FR-13, FR-138, FR-211 | SÛR (pour la comptabilité informatisée) | Correct, transposition signalée à confirmer |
| 422 | FR-192, D.3 | SÛR | Correct |
| 605, 606 | FR-111, FR-141, D.5 | SÛR | Correct |
| 608 | FR-14, FR-111, FR-121, FR-141, D.5 | SÛR | Correct en FR-14 et FR-121 ; **mal rattaché en FR-111 et D.5 (voir G5)** |

### E.2 Loi togolaise n° 2019-014 (7 citations)

| Article | FR | Statut | Verdict |
|---|---|---|---|
| 21, 22 | FR-9, FR-153, D.1 | SÛR | Correct |
| 26 | FR-18 | SÛR | Correct |
| 27 | FR-11 | SÛR | Correct |
| 28 à 31 | FR-19 | SÛR | Correct |
| 52 | FR-9, FR-13, FR-153 | SÛR | Correct |
| 53 | FR-19, FR-174 | SÛR | Correct |

### E.3 Règlement CIMA n° 0004/CIMA/PCMA/PCE/SG/08 (LBC/FT, 4 citations)

| Article | FR | Statut | Verdict |
|---|---|---|---|
| 4.5 | FR-100, FR-225 | SÛR (le texte dit « devrait permettre ») | Correct ; FR-225 écrit « demande que le système permette » : adoucir en « recommande » |
| 11 | FR-225 | SÛR | **Imprécis** : le PRD écrit « espèces, virements, chèques » ; le texte lu dit « chèques de banque, chèques et virements émis par intermédiaires… » et vise surtout les primes (voir G6) |
| 13 | FR-97, FR-100, FR-225 | SÛR | Correct |
| 14, 15 | FR-133 | SÛR | Correct |

Bilan de la partie E : 70 citations, 0 non vérifiée, 0 fausse, 2 mal appliquées ou imprécises (art. 608 en FR-111/D.5 ; art. 11 LBC en FR-225), 2 nuances de ton (art. 4.5, art. 242).

---

## F. Les 13 points « à faire valider par un juriste » de l'extraction, et les points posés en ligne dans le PRD, face au §13.2

Le §13.2 compte 24 lignes (J-1 à J-24). La colonne « FR » renvoie à la ligne J du §13.2 quand elle existe.

| # | Source | Point à valider | Statut | §13.2 / FR | Correction proposée |
|---|---|---|---|---|---|
| F1 | Extraction pt 1 | Version à jour du Code (modifications 2019-2026 des art. 231-236, 258-266, 334-12, 404) | PARTIEL | FR-24 et FR-141 le disent ; J-24 liste « délais CIMA » sans « version consolidée » | Ajouter une ligne J : « Code CIMA : version consolidée en vigueur à vérifier avant mise en service ; le référentiel légal reste versionné (FR-14) ». |
| F2 | Pt 2 | Base de la pénalité 5 %/mois (indemnité, solde ou offre ; cumul ; plafond) | COUVERT | J-7 (FR-85) | — (mais voir G2 : le texte de FR-85 se contredit). |
| F3 | Pt 3 | Point de départ et suspensions des délais (PV tardif, consolidation contestée, décès tardif, articulation avec l'art. 239) | PARTIEL | J-24 seulement ; FR-140 renvoie la règle de comptage des mois (mois commencé ou révolu, jour férié) au juriste sans ligne J | Ajouter deux lignes J : règle de comptage des mois (FR-140) et articulation suspension / saisine du juge (FR-85, FR-124). |
| F4 | Pt 4 | SMIG du Togo : montant, sens de « annuel » (12 mois ?), mécanisme « pays de résidence si plus élevé » | PARTIEL | J-6 (FR-70) | J-6 couvre le montant et le multiplicateur ; ajouter « SMIG du pays de résidence si plus élevé ». |
| F5 | Pt 5 | Tables à numériser et valider (point d'IP, clés des ayants droit, capitalisation, barème médical, barème de responsabilité) ; ambiguïté de l'art. 263 | PARTIEL | FR-24, FR-70 ; aucune ligne J | Ajouter une ligne J : « art. 263 : six mois de revenus plafonnés à 36 SMIG, lecture à valider » et « tables validées par un actuaire ou un juriste avant production ». |
| F6 | Pt 6 | Conventions de place (IDA ou équivalent), rôle de l'association des assureurs, Commission nationale d'arbitrage, constat amiable, règles sur les experts automobiles | PARTIEL | J-14 (arbitrage seulement), J-24 générique | Ajouter une ligne J pour : convention d'indemnisation directe, constat amiable, réglementation des experts automobiles (FR-178, qui la renvoie au juriste sans ligne). |
| F7 | Pt 7 | FGA au Togo : existence, texte, plafonds ; sinon partage de l'art. 274 | COUVERT | J-3, J-13 | — |
| F8 | Pt 8 | Données de santé : déclaration ou autorisation de l'IPDCP ; transfert hors Togo ; notification des violations | PARTIEL | J-1 (formalité) | J-1 ne dit rien des transferts (art. 28-30, traités en FR-19) ni de la notification des violations (non vérifiée). Ajouter une ligne J « transferts et violations ». |
| F9 | Pt 9 | LBC/FT : loi uniforme, seuils, secret de la déclaration de soupçon, Mobile Money | PARTIEL | J-9, J-10, J-11, J-21, J-22, J-23 | La règle de non-information du client est renvoyée au juriste en FR-225 mais n'a pas de ligne J. L'ajouter à J-11. |
| F10 | Pt 10 | Signature et archivage électroniques (loi 2017-007 : force probante, copie numérisée, recommandé électronique) | PARTIEL | J-20 (quittance seulement) ; J-24 générique | La valeur probante de la copie numérisée (FR-21, FR-169), l'horodatage qualifié (FR-169) et l'équivalence recommandé électronique / LRAR n'ont pas de ligne J. Les ajouter. |
| F11 | Pt 11 | Conservation : point de départ des 10 ans, articulation avec l'art. 53 | COUVERT | J-16, J-17, J-18 | — |
| F12 | Pt 12 | Circulaires CRCA (IBNR, états C10) | PARTIEL | J-19 (IBNR) ; J-24 | Le contenu exact des états C10 est renvoyé au juriste en FR-192 sans ligne J. Ajouter. |
| F13 | Pt 13 | Autres branches IARD : délais contractuels, règles nationales matériel et RC | OMIS | — | FR-14 dit que ces délais sont « internes » mais aucune ligne J ne demande de relever les délais contractuels et toute règle nationale togolaise. Ajouter une ligne J. |
| F14 | FR-41, FR-187 | Opposabilité à la victime d'une police suspendue ou résiliée (art. 210 et interprétation de 2011) | OMIS | — | Renvoyé « au juriste » dans deux FR, jamais au §13.2. Ajouter. |
| F15 | FR-114, FR-118 | Effet d'une mise en demeure ou d'une reconnaissance de dette sur la prescription | OMIS | — | Idem. |
| F16 | FR-121 | Traitement d'un dossier refusé au corporel (art. 237 : offre due « pour le compte de qui il appartiendra ») | OMIS | — | Idem ; lié à R15. |
| F17 | FR-138, FR-211 | Transposition des art. 406-407 (comptabilité informatisée) au dossier de sinistre | OMIS | — | Idem. |
| F18 | FR-113 | Règle de l'art. 275 (responsabilité indéterminable) | OMIS | — | Idem (avec F6). |
| F19 | FR-177, FR-178 | Contrôle exact des qualifications des experts (art. 272) et agrément | OMIS | — | Fusionner avec F6. |

---

## G. Écarts internes relevés en passant (le PRD contre lui-même)

| # | Source | Constat | Statut | FR | Correction proposée |
|---|---|---|---|---|---|
| G1 | Code art. 12-4° et 20 vs annexe D | D.2 donne comme défauts un délai de déclaration de **5 jours** (unité « jour »), **2 jours** pour le vol et 3 pour le transport (`delai_declaration_*`) ; D.5 et FR-43 posent un plancher de **5 jours ouvrés** et de **48 heures**. Cinq jours calendaires sont sous cinq jours ouvrés (7 jours calendaires en général). | CONTREDIT | FR-43, D.2, D.5 | Passer l'unité de D.2 en « jour ouvré » pour le défaut général et en « heure » (48) pour le vol ; garder 3 jours pour le transport. Ajouter le test « un défaut inférieur au plancher est refusé à la configuration ». |
| G2 | FR-85, FR-102, J-7 | La base de la pénalité est écrite de trois façons : « (l'indemnité) » dans le corps de FR-85, « montant de l'offre » dans l'assumption de FR-85 et dans J-7, « 5 % de l'indemnité » dans FR-102 et FR-141. L'extraction note que la base est à valider. | PARTIEL | FR-85, FR-102, FR-141, J-7 | Écrire une seule formulation, avec un paramètre `penalite.base` (offre, indemnité, solde) et le défaut choisi, et la rappeler dans les trois FR. |
| G3 | FR-125, FR-130 vs Code art. 231 | Au corporel VTM, un dossier `FRAUDE_SUSPECTEE` ou `BLOQUE` interdit l'envoi de l'offre (transition 10) alors que l'offre est due dans les 12 mois « indépendamment de la réclamation » et que la pénalité de 5 %/mois court (FR-125 le dit des échéances, sans règle de conduite). | PARTIEL | FR-125, FR-130, FR-85 | Ajouter : au corporel VTM, un blocage de plus de N jours avant l'échéance légale est escaladé à `DG` et `AUD` ; la décision de laisser courir la pénalité ou d'adresser une offre motivée (ou une offre sous réserve) est enregistrée. Ajouter la question à F16. |
| G4 | FR-85, J-7 | « Provision du risque de pénalité tenue au dossier » est promise (assumption et J-7) mais aucune FR ne la spécifie : FR-76 et FR-188 listent les motifs de révision de provision sans ce risque. | PARTIEL | FR-85, FR-76, FR-188 | Ajouter « risque de pénalité 5 % » comme motif et ligne séparée de provision (art. 334-12 : la provision se calcule dossier par dossier), alimentée par l'échéance légale dépassée. |
| G5 | Extraction §6, Code art. 608 | FR-111 et D.5 déclenchent la déclaration au fonds dans les 3 mois « de la réclamation » quand le tiers est inconnu ou non assuré. Dans l'extraction, l'art. 608 vise **l'assureur qui invoque une nullité, une suspension ou une non-assurance opposable** ; le cas auteur inconnu ou non assuré relève de l'art. 606 (PV 60 jours) et de l'art. 605 (transaction 1 mois). FR-121 l'applique correctement. | PARTIEL | FR-111, FR-141, D.5 | Retirer l'art. 608 du déclencheur « auteur inconnu ou non assuré » de FR-111 et ne le garder que pour « exception de garantie invoquée » (FR-121). Renommer `legal.fga_declaration_mois` en conséquence. Sans effet tant que `FGA_ACTIF` = non. |
| G6 | Règlement LBC art. 11 | FR-225 écrit que l'art. 11 impose une « vérification minutieuse de l'identité pour les espèces, les virements et les chèques ». Le texte lu cite : espèces, virements (dont internationaux), chèques **de banque**, chèques et virements émis par intermédiaires, mandats postaux, chèques endossés, effets de commerce ; il vise surtout les primes. | PARTIEL | FR-225 | Reformuler : « l'art. 11 liste les moyens à vérification minutieuse (espèces, virements, chèques de banque, chèques endossés…) ; son application aux règlements de sinistres est une transposition, à confirmer par le juriste ». Ajouter à §13.2 (avec F9). |
| G7 | D16 vs FR-193 | D16 et FR-193 disent que Prospera « ne passe pas d'écriture au grand livre », mais l'export porte journal, compte, débit, crédit, et exige « somme des débits = somme des crédits ». | PARTIEL | FR-193, FR-103, FR-2 | Dire que l'export est une proposition de mouvements pour la comptabilité (pas une écriture passée), ou retirer les colonnes débit/crédit de la liste testable. |

---

## Décompte

| Partie | Éléments | COUVERT | PARTIEL | CONTREDIT | OMIS | CITATION NON VÉRIFIÉE |
|---|---|---|---|---|---|---|
| A. SPEC (S1-S55) | 55 | 50 | 2 | 1 | 2 | 0 |
| B. Pièces de référence (P1-P10) | 10 | 3 | 5 | 0 | 2 | 0 |
| C. Mémoire de 2014 (M1-M38) | 38 | 22 | 10 | 0 | 6 | 0 |
| D. Règles SÛR (R1-R48, sans R36) | 47 | 36 | 7 | 1 | 3 | 0 |
| F. Points juridiques (F1-F19) | 19 | 3 | 9 | 0 | 7 | 0 |
| G. Écarts internes (G1-G7) | 7 | 0 | 6 | 1 | 0 | 0 |
| **Total** | **176** | **114** | **39** | **3** | **20** | **0** |

Neuf des 114 COUVERT sont des écarts voulus (décision du PO, du plan ou de la démo, tracée au PRD). La partie E (70 citations d'article) ne compte pas dans ce tableau : 0 citation non vérifiée, 0 fausse, 2 mal appliquées ou imprécises (reprises en G5 et G6).

---

## Les 10 écarts qui comptent

1. **Corporel multi-véhicules : personne ne désigne l'assureur qui fait l'offre (R7, art. 231 al. 6, 267 à 270).** Rien ne dit qui mène l'offre quand plusieurs véhicules sont en cause, ni que les intérêts de retard restent à la charge de l'assureur qui agit pour compte d'autrui. C'est un mécanisme central du corporel VTM, absent du PRD. Ajouter une FR (saisie des véhicules et assureurs, calcul de l'assureur meneur, mandat, intérêts de retard imputés) avec le barème de responsabilité en paramètre.
2. **La provision tombe à zéro au refus et au classement sans suite, y compris au corporel VTM (R15, FR-121, FR-123).** Le même PRD cite l'art. 237 (l'offre reste due « pour le compte de qui il appartiendra ») et le PSAP de l'art. 334-12 (tous les sinistres survenus et non payés). Corriger : au corporel VTM, la provision est maintenue ou ramenée à l'estimation de l'offre légale ; ajouter la question au §13.2.
3. **Engagements de décaissement de la SPEC §13 : omis (S43), avec les prévisions de règlement hebdomadaires du mémoire (M34).** Seule la règle « aucun solde bancaire » existe. Il manque la position des engagements en deux colonnes (exigible / à confirmer, jamais sommées) et la prévision hebdomadaire pour la comptabilité.
4. **Les défauts de délai de déclaration sont sous le plancher légal (G1, D.2 contre D.5).** 5 « jours » et 2 « jours » (vol) en défaut, contre 5 jours ouvrés et 48 heures au Code (art. 12-4°). FR-43 dit que le plancher ne peut pas être franchi : le défaut s'invaliderait lui-même. Changer les unités et ajouter le test de configuration.
5. **Le §13.2 ne porte pas tous les points juridiques (F1, F3-F6, F8-F10, F12-F19).** Sur les 13 points de l'extraction, 3 sont complets (pénalité, FGA, conservation), 9 sont partiels et 1 manque (autres branches). Six points renvoyés « au juriste » dans le corps du PRD n'ont aucune ligne : opposabilité de l'art. 210, effet de la mise en demeure sur la prescription, dossier refusé au corporel, art. 406-407, art. 275, qualification des experts. Or FR-24 bloque la mise en service tant qu'une ligne du registre est ouverte : ce qui n'est pas au registre ne bloque rien.
6. **Accord sur devis sans la condition « sans recours » (M25, FR-59).** La procédure de référence réserve la voie au matériel sans tiers responsable ; le PRD l'ouvre aussi quand un recours existe, c'est-à-dire quand le devis servira de créance contre un tiers. Ajouter la condition et un test.
7. **FR-65 se contredit sur l'estimation concurrente (S31).** La règle copiée de la SPEC interdit de confronter le rapport au devis, à la provision et à la médiane ; le cas type de la même FR est un écart de 65 % avec le devis et la médiane est affichée. À trancher avec le PO et réécrire en « contreparties nommées, sans estimation propre de Prospera ».
8. **L'art. 608 est rattaché au mauvais déclencheur (G5, FR-111, D.5).** Il vise l'assureur qui invoque nullité, suspension ou non-assurance ; FR-111 le fait courir sur « auteur inconnu ou non assuré ». Sans effet tant que le fonds est désactivé, mais le paramètre `legal.fga_declaration_mois` porterait une règle fausse le jour de l'activation.
9. **Contrôles internes du mémoire absents ou à demi traités (M8, M10, M13, M20, M12).** Le test de séquence est promis par FR-36 mais absent du plan de contrôle FR-210 ; pas de revue mensuelle de tous les dossiers vivants ; pas d'état hebdomadaire des déclarations ; pas de compteur rapport → offre → quittance ; pas d'alerte sur le dossier `REGLE` non clôturé. Ajouter ces cinq tests à FR-210 et FR-213.
10. **Pénalité de 5 % : une base écrite de trois façons, une provision du risque promise sans FR, et un blocage fraude qui n'a pas de règle de conduite (G2, G4, G3).** À écrire une fois, avec un paramètre de base, un motif de provision « risque de pénalité » (art. 334-12) et une escalade à la direction quand un blocage approche l'échéance légale. S'y ajoutent deux OMIS réglementaires mineurs : suivi du PV de l'art. 230 (R22) et lettre de garantie de frais médicaux de l'art. 258 (R26).
