# Extraction — SPEC_METIER et pièces de référence (chaîne sinistres IARD, zone CIMA, Togo)

Sources : `prospera-font-end/prospera-assurance/docs/`. Écrit au fil de la lecture. « La compagnie » = la compagnie cliente.
Convention : les références `§n` renvoient à SPEC_METIER.md. Les chiffres, statuts et noms de code sont repris tels quels.

---

## PARTIE 1 — SPEC_METIER.md (262 lignes, 13 sections)

Entête : source = proposition de solution « Plateforme GED & gestion des sinistres » + compte rendu de l'atelier avec le service sinistres. Les règles « changent dans `src/lib/mock-referentiel.ts` ou `src/types/index.ts` » (la SPEC est donc adossée à un front de démonstration, pas à un backend).

### §1 Le constat (6 douleurs terrain à corriger)
- Volume et dispersion : très grand nombre de dossiers papier classés par nom ou par police ; retrouver un dossier précis prend du temps.
- Relances sans réponse : le client appelle ou se déplace ; il faut aller chercher le dossier avant de le renseigner.
- Traitement partagé : chaque agent traite un volet ; personne ne voit d'un coup d'œil ce qui est fait ni ce qui bloque.
- Pièces dispersées : certificats médicaux, prescriptions, tickets de caisse, rapport de police circulent séparément du dossier.
- Règlements non rapprochés : quittances, chèques et T-Money suivis en comptabilité, sans état consolidé côté sinistres.
- Qualité non mesurable : délais et conformité aux objectifs qualité estimés, faute d'horodatage des étapes.

### §2 Cycle de vie du dossier
- Statuts exacts, dans l'ordre : `DECLARE` → `PIECES_INCOMPLETES` (si une pièce obligatoire manque) → `OUVERT` → `EN_ETUDE` → `EVALUE` (barème appliqué) → `VALIDATION` (au-delà du seuil de délégation) → `CHEQUE_A_REMETTRE` → `REGLE` → `CLOTURE`.
- Deux sorties latérales : `RECOURS` (créance contre un tiers responsable) et `REJETE` (refus de prise en charge notifié).
- Règles :
  - un numéro de sinistre est attribué dès la déclaration, même dossier incomplet, même en cas de blessure grave ;
  - l'ouverture est bloquée tant qu'une pièce obligatoire manque ; un courrier de demande est préparé et l'assuré relancé ;
  - à chaque étape une information reste attachée au dossier (permet de le reconstituer plus tard) ;
  - un dossier clôturé reste consultable ; une réouverture est tracée.
- Non précisé : qui déclenche chaque transition (hors VALIDATION = « au-delà du seuil de délégation »), les transitions de `RECOURS`/`REJETE` (depuis quel statut, vers quoi), la valeur du seuil de délégation, le sort d'un dossier à règlement partiel (§5). Voir « Trous ».

### §3 Volets et affectation
| Volet | Contenu | Délai cible |
| --- | --- | --- |
| `CORPOREL` | atteinte à l'intégrité physique, accident du travail | 45 j |
| `MATERIEL` | dommages véhicule, collision | 21 j |
| `RISQUES_DIVERS` | incendie, MRH, dégât des eaux, vol, transport, RC | 30 j |
| `RECOURS` | créances contre tiers responsables | 90 j |
- Le volet découle du type de sinistre (`VOLET_PAR_TYPE`).
- Chaque gestionnaire ne voit que son volet : sa corbeille personnelle.
- Corbeille de service : tous les dossiers actifs du volet, sans distinction d'agent (absence, reprise).
- Le « délai cible » n'est pas défini (de quel événement à quel événement : déclaration → règlement ? clôture ?). Voir « Trous ».

### §4 Pièces
- Obligatoires selon le type de sinistre (`PIECES_OBLIGATOIRES`). Seul exemple donné — automobile corporel (6 pièces) : constat amiable, déclaration signée, certificat médical initial, rapport de police, pièce d'identité, attestation d'assurance.
- Complémentaires (ne bloquent pas l'ouverture) : prescriptions, tickets de caisse, factures médicales, RIB.
- Cycle d'une pièce : `ATTENDUE → RECUE → EN_CONTROLE → VALIDEE`, ou `REJETEE`.
- Une pièce porte sa source (scan par lot, scanner, téléversement, mobile, chatbot, courrier) et son statut d'extraction de texte (OCR).
- Rapport de police rattaché dès sa sortie ; sert à établir la responsabilité : assuré fautif → dossier pris en charge ; tiers fautif → recours.
- Les listes matériel, risques divers, recours sont absentes.

### §5 Barèmes et règlement
- 4 grilles paramétrables (`BAREMES`), une par volet. Chaque dossier garde la référence du barème et la tranche appliqués à l'évaluation : une évolution de grille n'écrase pas les évaluations arrêtées (versionnage).
- Affichage permanent : montant évalué / déjà payé / reste à payer.
- Règlements partiels = la norme sur le corporel : un acompte couvre les frais médicaux engagés avant l'arrêt définitif du montant.
- Quittance : rattachée à un dossier et à un bénéficiaire ; porte moyen de paiement, numéro de chèque, banque, date d'édition, date de remise. T-Money et Flooz rapprochés comme les chèques.
- Statuts de quittance : `EDITEE → PRETE → REMISE → ENCAISSEE`, ou `EN_ATTENTE` / `ANNULEE`.
- Liste d'appels du matin : bénéficiaires dont le chèque est édité et disponible au guichet, classés par ancienneté. Au-delà de 7 jours (« sept jours ») sans retrait, une relance est déclenchée. À la remise, l'accusé de réception est enregistré.
- État mensuel : toutes les quittances de la période ; chèques émis / remis / en attente ; détection des écarts avant la clôture du mois.
- 3 contrôles bloquent habituellement la clôture du mois : quittances non rapprochées ; remises sans accusé signé ; chèques édités non retirés.
- Aucun montant de barème, aucune tranche, aucun taux n'est donné dans la SPEC.

### §6 Courriers
- 7 modèles pré-remplis depuis les données du dossier : demande de pièces, offre d'indemnisation, refus, relance, accusé de réception, convocation à expertise, mise en demeure pour recours.
- Copie archivée automatiquement dans le dossier. Impression groupée pour le départ courrier physique.
- Aucun texte de modèle fourni.

### §7 Traçabilité
- Chaque action horodatée et attribuée à un utilisateur identifié (qui, quoi, quand, sur quelle pièce).
- Journal : versions successives des pièces + historique des règlements (déjà payé / reste à payer).
- Piste d'audit exploitable en contrôle interne et exportable.

### §8 Indicateurs (calculés depuis les horodatages, sans ressaisie)
- délai moyen d'ouverture, d'étude et de règlement ;
- taux de dossiers traités dans le délai cible ;
- charge par gestionnaire et par volet, dossiers en retard ;
- aging du stock actif ;
- taux de numérisation du fonds documentaire ;
- écarts de règlement ouverts.

### §9 Assistant conversationnel
- Questions paramétrées par type de sinistre, définies par le service.
- Donne la liste exacte des pièces à fournir dès le premier contact ; accepte le téléversement depuis un téléphone ; renseigne l'état d'avancement sans mobiliser un agent ; français et anglais ; transfert à un gestionnaire humain dès que nécessaire.

### §10 Rôles et droits (11 rôles)
| Rôle | Périmètre | Droits particuliers |
| --- | --- | --- |
| `DIRECTION` | tout, lecture | validation hors délégation |
| `RESPONSABLE` | tout | affectation, validation hiérarchique |
| `GESTIONNAIRE` | son volet | instruction, évaluation, courriers |
| `RECOURS` | volet recours | mise en demeure, suivi des créances |
| `EXPERT_INTERNE` | ses missions | rapport d'expertise rédigé dans l'application |
| `EXPERT_EXTERNE` | une mission, pas un dossier | portail : accepter, déposer rapport et honoraires |
| `GED` | tout, lecture | lots, indexation, versement au fonds, reconstitution |
| `ACCUEIL` | tout, lecture | déclaration, liste d'appels, remise |
| `COMPTABLE` | tout, lecture | quittances, chèques, rapprochement |
| `AUDITEUR` | tout, lecture seule | piste d'audit complète, export |
| `ADMIN` | paramétrage | comptes, rôles, barèmes, modèles |
- `DIRECTION` et `RESPONSABLE` coexistent pour la validation (« hors délégation » vs « hiérarchique ») ; le seuil de délégation n'est pas chiffré.
- `ACCUEIL`, `GED`, `COMPTABLE` sont « tout, lecture » mais ont des actions d'écriture : « lecture » = visibilité, pas absence d'écriture. `AUDITEUR` seul est « lecture seule ».

### §11 Missions d'expertise
- Principe : un sinistre appelle autant d'expertises que de questions distinctes ; accident de la circulation avec blessé = 2 (véhicule, lésions), 3 si la responsabilité est inconnue. Chacune est une mission autonome rattachée au même dossier, avec domaine, expert, délai, rapport, coût.
- Cycle : `SUGGEREE → A_DESIGNER → EXPERT_DESIGNE → ACCEPTEE → [TRANSMISE] → EN_COURS → RAPPORT_ATTENDU → RAPPORT_RECU → [COMPLEMENT_DEMANDE] → VALIDEE` ; sorties latérales `CONTESTEE` et `ANNULEE`.
- `TRANSMISE` n'existe que pour un expert externe : étape où de la pièce sort de la compagnie.
- Règles :
  - aucune mission ne naît d'elle-même : l'assistant propose des besoins motivés et sourcés ; un agent les retient ou les écarte ; un refus est conservé avec son motif comme un accord ;
  - une contre-expertise ne revient ni au cabinet du premier rapport ni au panel interne : refus du système, pas avertissement ;
  - le rapport est confronté aux pièces et référentiels, jamais à une estimation concurrente (devis versé, provision arrêtée, médiane des missions comparables) ; chaque écart nomme sa contrepartie et sa source ; il se termine par une question à poser, jamais par un verdict ;
  - le contrôle de complétude porte sur la forme, pas sur le fond : un rapport sans signature, sans chiffrage, sans conclusion ou sans identification du bien est inexploitable quel que soit son score (il existe donc un « score »).
- Interne ou externe : décide si la mission coûte des honoraires, si la donnée sort de la compagnie, si l'indépendance requise est satisfaite. Externe imposé par : contre-expertise, fraude, contentieux, enjeu au-delà du seuil, domaine non couvert (`referentiel-experts.ts`). Seuil non chiffré.
- Charge (3 lectures) : nombre de missions ; charge pondérée (poids selon domaine, type de mission, gravité du sinistre — grille paramétrable) ; échéancier des rapports dus. Question du responsable : « qui est le moins chargé à la date où j'ai besoin du rapport ».
- Les cinq montants : `budget prévisionnel → honoraires convenus → facturés → visés → payés`. Viser au-delà du convenu exige un motif.

### §12 Archivage, deux supports, reconstitution
- Le papier reste obligatoire : tenir les deux supports ensemble ; savoir quoi faire quand l'un manque.
- Numéro d'archivage : format `ARC-{année de clôture}-{volet}-{séquence}` ; attribué une fois au versement ; jamais réutilisé ; porté sur l'étiquette de la chemise ET sur l'enregistrement électronique (jointure). S'attribue, ne se calcule pas.
- Bordereau de versement : fixe le contenu du dossier pièce par pièce, avec la valeur juridique de chaque original.
- Un seul support fait foi à la fois : papier tant que l'image n'est pas scellée, numérique ensuite ; la bascule est une décision tracée.
- On ne scelle pas une image incomplète.
- Reconstitution : constat de carence (qui a cherché, où, quand) → assemblage depuis l'archive numérique dans l'ordre du bordereau → état de complétude → recomplètement auprès des émetteurs → certification par un autre agent que celui qui a reconstitué. Dossier reconstitué : même numéro suffixé `/R1`, `/R2` (un fonds ne se renumérote pas).
- Pièces à original juridiquement propre (constat signé, quittance acquittée, acte de décès) : l'image est une copie ; dossier reconstitué exploitable pour instruction, relation client, contrôle interne ; devant un tribunal, original ou duplicata réémis.
- Dossier transmis en chemise papier à un expert externe = sortie d'archive : première cause de chemise non restituée, donc de reconstitution. Les deux modules (expertise, archivage) ne se parlent qu'à cet endroit.
- Pas de durée de conservation ni de règle de purge.

### §13 Engagements de décaissement
- Ajouté au circuit de règlement, non modifié : la caisse, l'arrêté et le rapprochement restent le système de référence de l'argent qui sort.
- Un ordre de règlement n'existe qu'une fois émis ; un engagement naît le jour où l'indemnité est arrêtée, où la mission est confiée à un cabinet, où un chèque part au guichet sans être retiré. Donnée détenue seulement par la chaîne sinistres.
- Deux précautions : exigible et à confirmer ne se somment jamais ; aucun solde bancaire affiché (la position en banque appartient au logiciel comptable).

### Synthèses transverses
- Moyens de paiement cités : chèque (numéro, banque), T-Money, Flooz (§5). Aucun autre (virement, espèces, autre Mobile Money) ni circuit d'émission du chèque (signataires) n'est décrit.
- CRCA : aucune occurrence dans la SPEC. « Contrôle interne » n'apparaît que comme usage de la piste d'audit (§7, §12) et via le rôle `AUDITEUR`. Voir « Trous ».

---

## PARTIE 2 — Pièces de référence

### 2.1 Constat amiable d.docx — « Constat amiable d'accident » n° CA-2026-0714
- Ce que c'est : modèle de constat rempli en exemple (accident fictif à Paris, 14/07/2026, 18:30-19:15, Renault Clio IV, collision par l'arrière au feu rouge). Gabarit généré (phrases génériques type « inspection »), pas un formulaire CEA/CIMA officiel : une seule colonne de véhicule, pas de croquis, pas de cases circonstances.
- Rubriques : 1. Informations sur l'accident (date, temps/heure, adresse) ; 2. Véhicules impliqués (type d'objet, nom d'objet = marque/modèle, état technique) ; 3. Dégâts constatés (n°, description, photos) ; 4. Circonstances et témoins (identification, remarques/circonstances) ; 5. Conducteurs et témoins (n°, nom, poste/statut = Conducteur A / Conductrice B / Témoin, commentaire = permis B / témoin oculaire) ; Signatures (conducteurs, témoin).
- Règles chiffrées : aucune.
- À en tirer : modèle de données du constat (accident : date, heure, lieu ; véhicules ; dégâts avec photos ; circonstances ; parties avec rôle ; signatures). Deux points faibles à ne pas reprendre : pas de croquis, pas de numéro de police ni d'assureur de chaque partie, pas de case de circonstances normalisées (le vrai constat CIMA en comporte) ; des champs « non rempli » montrent qu'un constat peut être incomplet. La signature des parties fonde la qualité d'original juridique (cf. §12). Le logiciel doit capter ces champs (saisie, OCR du papier, ou formulaire mobile/chatbot).

### 2.2 Rapport expertise.docx — « Rapport d'expertise de véhicule » n° REV-2026-045
- Ce que c'est : modèle de rapport d'expert automobile rempli en exemple (Lyon, 14/07/2026, expert François Petit, Clio IV AB-123-CD). Même gabarit générique que 2.1. Non conforme aux modèles 1 et 2 de la convention (2.3) : pas de main d'œuvre par poste, pas de fournitures chiffrées, pas de total net.
- Rubriques : 1. Renseignements généraux (date d'inspection, adresse, motif = « Expertise après sinistre », expert) ; 2. Objet (véhicule, état général, kilométrage 85000 km, date de 1re mise en circulation 15/03/2017, date d'achat 01/04/2017) ; 3. Caractéristiques (énergie Diesel, boîte Manuelle, couleur Gris, nombre de places 5) ; 4. Dommages (n°, description, photos) ; 5. Dommages préexistants (élément, défaut, type de réparation, photos) ; 6. Informations complémentaires (évaluation de la valeur, coût total de réparation, conclusion — vides) ; 7. Participants (expert, assurée = propriétaire, assureur = représentant) ; signatures.
- Règles chiffrées : aucune.
- À en tirer : la rubrique « dommages préexistants » (distinguer les causes) est utile et absente du modèle conventionnel ; « évaluation de la valeur / coût total / conclusion » correspondent aux « chiffrage / conclusion » de la complétude §11. Le contrôle de complétude de forme (signature, chiffrage, conclusion, identification du bien) s'applique tel quel à cet exemple : il serait inexploitable (valeur, coût, conclusion, photos vides).

### 2.3 CONVENTION_EXPERTISE_AUTOMOBILE.pdf — 11 pages, lue en entier
- Ce que c'est : convention « Expertise Automobile » TUNISIENNE (Tunis, 17 décembre 1993, commission « expertise » de la FTUSA) entre entreprises d'assurances adhérentes, + Avenant n° 2 (sinistres à compter du 1er juin 1999) + annexes : modèles 1 et 2 de rapport d'expertise, formulaire « Constat préliminaire de dégâts supérieurs (plafond IDA) », modèle d'« Ordre de mission d'expertise ». Montants en DINARS tunisiens : NON transposables au Togo (franc CFA) ; c'est un modèle de procédure inter-assureurs (le formulaire de constat préliminaire porte la mention « plafond IDA »), pas la règle de la compagnie.
- Règles chiffrées (version d'origine 1993 → avenant n° 2) :
  - art. 2 : expertise des dommages du véhicule de l'assuré à la diligence de l'assureur direct, quel que soit le montant ; l'ordre de mission précise les obligations de l'expert et comporte deux photocopies du constat amiable ou de la déclaration ;
  - art. 3 : expertise exigée au-dessus de 50 dinars ; en dessous ou égal, la facture suffit ;
  - art. 4 : pas de contestation de l'évaluation de l'expert jusqu'à 1000 dinars (avenant : 2000 dinars) ;
  - art. 5 : au-dessus de 1000 dinars (avenant : 2000), l'expert de l'assureur direct remet un constat préliminaire des dégâts, sous peine de déchéance de ses honoraires, à l'assureur du responsable (contre décharge ou lettre recommandée avec accusé de réception) dans 10 jours à compter de la réception de l'ordre de mission ; idem pour le recours en assurance « dommages » ;
  - art. 6 : l'assureur du responsable qui ne désigne pas son expert dans 5 jours après réception du constat préliminaire ne peut plus contester l'évaluation ;
  - art. 7 (avenant) : 2e expert doit informer le 1er de sa désignation ; accord = rapport unique, chaque partie paie son expert ; désaccord = un rapport par expert + 3e expert arbitre désigné par les deux assureurs, conclusions opposables, honoraires par moitié ; les obligations de l'art. 5 s'imposent aux 2e et 3e experts ;
  - art. 8 : si l'expert n'a pas respecté l'art. 5, l'assureur du responsable peut faire une contre-expertise dans 15 jours après réception des pièces justificatives du demandeur, pour dommages > 1000 dinars (avenant : 2000) ; contradictoire (assurés, assureurs, expert du rapport initial convoqués) ; achevée au plus tard 1 mois après l'expiration des 15 jours ; rapport remis contre décharge ;
  - art. 9 : rapport remis à l'assureur mandant contre décharge dans 10 jours à compter de la remise des factures à l'expert ; dans 45 jours à compter de la réception de l'ordre de mission, l'expert informe par écrit et contre décharge des raisons d'un retard ; à 75 jours à compter de la réception de l'ordre de mission, l'expert établit un procès-verbal de carence ;
  - art. 10 : contenu du rapport (voir ci-dessous) ; avenant : rapport conforme aux deux modèles annexés ; photos après réparation exigées seulement au-dessus de 2000 dinars ;
  - art. 11 : photo du point de choc + numéro minéralogique obligatoire sur tout rapport ;
  - art. 12 : commission expertise suit l'application, instruit les plaintes contre un expert (entend l'expert et le représentant de l'association des experts) ; art. 13 : différends entre assureurs -> commission de conciliation ; art. 14 : application aux sinistres à compter du 01/01/1994 (avenant : 01/06/1999).
- Rubriques du rapport (art. 10) : (1) identification du sinistre : n° dossier ou contrat, date du sinistre, identité assuré et tiers, date de mission ; (2) véhicule examiné : immatriculation, marque et type, couleur, date de 1re mise en circulation, n° châssis et n° moteur, index kilométrique, état d'usure des pneus, état général, valeur à neuf (en assurance « dommages » seulement), valeur vénale, valeur pour véhicules non dédouanés ou partiellement ; (3) opération d'expertise : lieu, date de visite, période d'examen (avant, pendant, après réparations, avec photos), point de choc, durée de réparation, coût main d'œuvre, détail et coût des fournitures avec taux de vétusté, accord pris avec le réparateur (oui/non), dommages non consécutifs, relation entre circonstances du constat et dégâts.
- Modèle 1 / Modèle 2 (rapport) : en-tête expert (nom, référence expert, adresse, tél, fax, date mission) ; mandant ; date d'accident ; assuré, tiers, immatriculation, véhicule du tiers, contrat, contrat adverse (CONT), DOS, n° dossier, compagnie adverse ; date d'examen, lieu, véhicule expertisé, observation (nota 1 = avis sur la relation circonstances / dégâts) ; marque, genre, type, couleur, puissance, état du véhicule, index km, immobilisation, VN (valeur à neuf), VV (valeur vénale), n° châssis, date 1re mise en circulation, circonstance (nota 2 = expertise avant/pendant/après réparations, 1, 2 ou les 3) ; schéma point de choc (AV, AR, G, D) ; nature des chocs et dégâts ; fournitures (désignation, montant, vétusté %) ; main d'œuvre par poste (tôlerie, mécanique, électricité, tapisserie, boiserie, peinture) ; totaux (total fournitures, total main d'œuvre, total général, déduction vétusté, total net) ; accord pris avec ; pièces jointes ; immobilisation en jours ; « arrêté à la somme de » ; lieu, date, signature de l'expert.
- Constat préliminaire de dégâts supérieurs (plafond IDA) : expert, société mandante, n° contrat, assuré, n° véhicule, marque et type, valeur vénale ; société du tiers responsable avec ses références ; date d'accident, date de mission, date de visite, lieu ; description des dégâts apparents ; relation circonstances / dégâts ; coût approximatif des réparations ; 1 ou 2 photos ; signature et cachet. Indicatif, n'engage pas l'expert.
- Ordre de mission : entête service sinistres automobiles ; assuré, accident, deux copies du constat jointes ; adresse et tél de l'assuré ; nature des garanties (R.C. et Défense et Recours ; Dommages aux véhicules ; Vol ; Incendie) ; immatriculation, couleur, lieu de réparation ; rappel des obligations de l'expert.
- À en tirer pour le logiciel : (a) modèle d'ordre de mission et de rapport d'expertise structurés (champs ci-dessus), avec totaux calculés (fournitures, main d'œuvre par poste, vétusté, net) ; (b) minuteurs de mission : accusé d'avancement à 45 j, PV de carence à 75 j, remise du rapport 10 j après les factures, constat préliminaire 10 j, délai de contestation 5 j, contre-expertise 15 j + 1 mois — à reprendre comme valeurs paramétrables, pas comme règle CIMA ; (c) seuils par montant (expertise obligatoire, non-contestation, photos après réparation) à paramétrer en francs CFA ; (d) pluralité d'experts (2e expert, 3e arbitre, honoraires par moitié) ; (e) photo du point de choc + immatriculation obligatoire ; (f) contre-expertise contradictoire avec convocation. Cohérence avec §11 : « contre-expertise ne revient pas au même cabinet » est une règle de la SPEC absente de la convention.
- Attention : cette convention est tunisienne ; le Togo est en zone CIMA : l'éventuelle convention inter-assureurs applicable à la compagnie n'est pas fournie.

### 2.4 DOCUMENTATION-exemple_de_tableau_dAvaluation_mAdico-lAgale.pdf — 1 page (lue)
- Ce que c'est : gabarit vierge « Réparation dommage corporel EMA — Tableau d'évaluation médico-légale (TEML) » : grille de postes de préjudice corporel, chaque ligne avec deux cases (pouce haut / pouce bas : retenu / non retenu, ou accord / désaccord). Aucun chiffre, aucun taux, aucun barème : une liste de postes à évaluer.
- Rubriques (postes) : périodes d'ITT (rechutes éventuelles) ; périodes d'ITP ; date de consolidation (jj/mm/aaaa) ; taux d'Invalidité Permanente Partielle ; taux d'Incapacité Permanente Partielle (de travail) ; taux d'Incapacité Permanente Partielle (ménager) ; quantum doloris (temporaire, permanent) ; préjudice esthétique ; préjudice d'agrément ; préjudice sexuel ; dommage par répercussion ; préjudice scolaire ; aide d'une tierce personne (temporaire, permanente) ; soins postérieurs à la consolidation (temporaires, permanents) ; réserves (temporaires, permanentes).
- À en tirer : (a) le volet `CORPOREL` a besoin d'un objet « évaluation médico-légale » structuré : périodes datées (ITT, ITP), date de consolidation (pivot : avant = acompte sur frais engagés, après = arrêt définitif, cf. SPEC §5), taux (IPP, incapacité travail, incapacité ménagère), postes extra-patrimoniaux, répercussion (victimes par ricochet), scolaire, tierce personne, soins futurs, réserves ; (b) par poste, une décision binaire retenu / contesté (utile en contre-expertise médicale) ; (c) un corporel se chiffre poste par poste : la SPEC parle de « tranche » de barème, ce qui ne suffit pas à ce volet. Cohérent avec le mémoire (2.5) : séquelles « conformément au barème fonctionnel des incapacités du Code CIMA ».

### 2.5 M0013MBA-ACG15.pdf — un MÉMOIRE ACADÉMIQUE de 110 pages (556 Ko, chiffré AES-128, texte extractible)
- Nature : mémoire de fin d'études MBA Audit et Contrôle de Gestion (CESAG, Dakar, promotion 2013-2014, octobre 2014) : « Audit de la procédure d'indemnisation des accidents d'automobiles : cas d'une compagnie d'assurances au Sénégal » (zone CIMA). Ce n'est NI un document de la compagnie NI un texte réglementaire : c'est l'audit d'une autre compagnie de la zone CIMA, daté de 2014.
- Pertinence : forte comme procédure type et grille de contrôle interne, avec réserves (une compagnie, un échantillon de 15 dossiers, 2014, Sénégal). Parties utiles : chap. V (procédure, p. 60-70), chap. VI (audit et recommandations, p. 71-89), chap. II (garanties auto, p. 19-32). Parties sans intérêt : chap. I (théorie de l'audit), III (méthodologie), IV (présentation de la compagnie).
- Étapes (chap. V) : réception de la déclaration → traitement et ouverture du dossier → information du courtier → validation par le Directeur opérationnel → expertise si nécessaire → classement.
- Règles et délais chiffrés (délais de la compagnie auditée, sauf mention) :
  - déclaration obligatoire, que l'assuré soit responsable ou non ; déclaration verbale = confirmation écrite exigée ; registre coté et paraphé ; état hebdomadaire des déclarations visé par le chef du département, remis chaque vendredi à 16 h au directeur opérationnel ; copie à la direction générale au plus tard mardi 16 h ;
  - à l'ouverture : vérifier identité, validité de la police (période de couverture, non-suspension, garanties, conditions, prime payée), doublon ; exclusion ou non-assurance : décision soumise au directeur opérationnel sous 48 heures avec projet de courrier ; assuré informé sous 72 heures si non couvert ;
  - deux numéros sur le dossier physique (logiciel métier + registre) ; sous-chemises (déclaration et correspondances ; police ; dommages, devis, rapport d'expertise ; pièces de règlement) ; couleurs de chemise : auto RC corporelle et mixte JAUNE, autres auto VERT, RC générale ROUGE CLAIR, incendie/risques techniques/risques divers ROSE, transport facultés et corps BLEU CLAIR, aviation GRIS ;
  - dossier soumis au directeur opérationnel dans les 48 heures (mardis et jeudis à 15 h) pour prise en charge, évaluation, expertise, courriers ;
  - expertise hors RC corporelle : matériel sans recours <= 300 000 FCFA -> inspecteur technique, accord sur devis n'excédant pas 200 000 FCFA, accord amiable sous 72 heures ; inspecteur technique présent à l'expertise pour devis > 1 000 000 FCFA ;
  - rapport d'expert : 7 jours (dommages), 10 jours (RC et hors région de Dakar) à compter de la réception de tous les éléments ; enregistrement, vérification, validation sous 72 heures ; le rapport ne vaut pas règlement ; validation collégiale (inspecteur technique, rédacteur, chef de département, directeur opérationnel) si dommages évalués >= 1 000 000 FCFA, sinon rédacteur + inspecteur technique + directeur opérationnel ; mission de l'expert : causes et origine, éléments de responsabilité civile, imputabilité, valeur avant sinistre, évaluation ;
  - honoraires d'expert : état hebdomadaire ; payés un mois après réception du rapport ; bordereau visé, demande signée du directeur opérationnel, transmission à la comptabilité ; critique de l'audit : honoraires calculés au prorata de l'indemnité (à proscrire) et expert choisi par le gestionnaire (indépendance) ;
  - RC corporelle : l'expert identifie la victime, examine certificats médicaux (constatation, guérison ou consolidation), rapport du médecin traitant, examine la victime si besoin, décrit et quantifie les chefs de préjudice, détermine les séquelles selon le barème fonctionnel des incapacités du Code CIMA (p. 101-123 de l'édition 2010 citée) ;
  - offre (hors RC corporelle) : décompte d'indemnité (le texte dit « 7 heures », probablement « 7 jours » : coquille), offre signée chef de département, visa D.O., validation DG ; offre transmise à l'assuré sous 48 heures ; demande de règlement validée sous 72 heures après accord ; prévisions de règlement hebdomadaires à la direction financière chaque vendredi ; paiement sous 72 heures par la direction financière (paiement = remise du chèque contre décharge de la quittance) ; non-accord : contre-expertise exigée du client ;
  - RC corporelle (offre) : procès-verbaux de transaction soumis au D.O. sous 48 heures, communiqués aux bénéficiaires ou à leur avocat sous 24 heures ;
  - règlement à titre commercial : seul le Directeur Général, motivé (ancienneté du client, importance du portefeuille, régularité des primes, potentiel) ;
  - recours : lettre de mise en cause dès l'ouverture ; relance tous les 15 jours jusqu'à réponse puis jusqu'au recouvrement des débours ; transmission progressive des pièces (PV, devis, rapports, quittances) ; état des recours par débiteur mis à jour chaque semaine ; recommandation : garder copie des pièces avant envoi à la compagnie adverse, enregistrement spécifique de la possibilité de recours ;
  - délai de déclaration de l'assuré (article 7 du code des assurances CIMA, d'après le mémoire) : 5 jours ouvrés, 2 jours en cas de vol, à compter du lendemain de la connaissance du sinistre ;
  - vol auto (conditions générales de la compagnie auditée) : déclaration sous 2 jours, plainte + inventaire, opposition, certificat de non-retrouvaille après 30 jours de recherche, paiement exigible 30 jours après déclaration, franchise contractuelle de 36 000 FCFA (non appliquée si véhicule non retrouvé) ;
  - garanties auto décrites : RC (en et hors circulation), dommages (tierce complète, tierce collision), incendie, bris de glaces, vol, défense et recours, avance sur recours, individuelle personnes transportées (décès dans un délai d'un an, IPP selon barème, frais médicaux) ; franchises.
- Constats d'audit utiles comme exigences de contrôle (chap. VI) : test de conformité (15 dossiers) et de permanence (premier semestre 2014). Faiblesses : sinistres enregistrés 3 à 4 jours après réception ; fichier des charges (provisions) non à jour ; délais d'instruction non respectés (accusés de réception non faits, offres hors délai, sous-effectif) ; évaluation à l'ouverture sans critère objectif ; devis, PV, rapport d'expertise, date de paiement manquants dans les dossiers ; même rédacteur qui instruit et ordonnance l'indemnité (cumul de fonctions incompatibles) ; personne non désignée pour le contrôle de séquence des numéros ; classement sans critère précis ; grande discordance entre date de réception du rapport d'expert et date d'édition de la quittance ; dossiers recours transmis sans trace ni copie ; dossiers à clôturer restés ouverts.
- Recommandations : contrôle de séquence des numéros ; dossier qui mentionne automatiquement n° et date d'effet du contrat, assuré, code agent, justificatif de paiement de la prime, indemnisation, facture de réparation, rapport d'expert, lettre ; registre avec exercice de survenance, date d'opération, date de réception de la déclaration, catégorie d'assurance, bénéficiaire, référence du règlement (moyen de paiement, montant, date), montant du recours, observation ; évaluation à l'ouverture documentée (dossier par dossier, coût moyen, cadence de règlement, forfaitaire) ; revue mensuelle des dossiers vivants ; rapprochement paiements dossier / trésorerie ; rapprochement honoraires d'experts / état comptable ; séparation étude / ordonnancement / contrôle / paiement.
- À en tirer pour le logiciel : séparation des tâches paramétrable (le gestionnaire ne valide pas son propre ordonnancement) ; contrôle de séquence (pas de trou) du numéro de sinistre ; registre exportable ; compteurs de délais (déclaration -> enregistrement, ouverture -> validation, rapport -> offre, offre -> paiement) ; provision (« charge ») mise à jour à chaque événement ; revue mensuelle des dossiers vivants ; rapprochement honoraires. La SPEC §5 et §8 couvrent le rapprochement et les indicateurs, mais ni la provision du dossier ni la séparation formelle des tâches.
- « CRCA » : le mémoire n'emploie pas ce sigle (comme la SPEC) ; son apport est la grille de contrôle interne (questionnaire, séparation des tâches, FRAP), pas la CRCA.
- Le Code CIMA est cité (articles 7, 25, 27, 31, 33, 34, 200, 301) pour des définitions générales ; le mémoire ne reproduit pas de délai CIMA d'offre d'indemnisation (voir 3.1).

### 2.6 true.pdf — 14 pages (texte extrait en entier)
- Nom de fichier trompeur : c'est le Règlement n° 0007/PCMA/CE/SG/CIMA/01 de la Conférence Interafricaine des Marchés d'Assurances (Secrétariat général, Libreville), « fixant les modalités de fonctionnement du Fonds de Garantie Automobile » (FGA), Bulletin officiel 6e édition, janvier 2002 (Conseil des Ministres du 25 septembre 2001 ; articles 600 et 601 du Code des assurances). Texte CIMA applicable à tous les États membres, donc au Togo (plafonds et financement : textes nationaux, non fournis).
- Règles chiffrées :
  - art. 1 : le FGA indemnise les victimes d'accidents corporels (ou ayants droit) survenus sur le territoire de l'État (art. 600) ; indemnités issues d'une décision de justice exécutoire ou d'une transaction agréée par le Fonds ;
  - art. 2 : exclus : conducteur pour ses propres dommages ; victimes dans un véhicule volé et complices (si le Fonds prouve qu'ils connaissaient le vol) ; réserve si l'accident est causé par un autre véhicule ;
  - art. 3 : préjudices indemnisables = art. 258 à 266 du Code (sauf 261, 263, 266), dans la limite des plafonds de chaque État ;
  - art. 4 : non-assurance -> mesures conservatoires ; art. 5 : toute transaction avec un responsable non assuré notifiée au Fonds dans 1 mois (lettre recommandée AR ou moyen faisant foi) ; art. 6 : le PV mentionne si l'auteur est inconnu, ou s'il est assuré (entreprise, adresse, n° de police) ; renseignements ignorés à fournir sous huitaine (PV complémentaire) ; un exemplaire du PV transmis au Fonds dans 60 jours de l'accident (auteur inconnu ou non assuré) ;
  - art. 7 : en présence d'un contrat, le Fonds ne paie qu'en cas de nullité, suspension du contrat ou de la garantie, ou non-assurance opposables à la victime ; art. 8 : l'assureur qui invoque nullité, suspension ou non-assurance le déclare au Fonds dans 3 mois à compter de la réclamation (lettre recommandée AR), avec pièces, et en avise victime et ayants droit avec le n° du contrat ; idem contestation de l'existence du contrat (art. 213) ; art. 9 : le Fonds conteste dans 3 mois à compter de la déclaration ;
  - art. 11 et 12 : paiement pour compte par l'assureur (juridiction répressive ou civile, ou transaction approuvée), puis remboursement par le Fonds si l'exception est reconnue fondée, dans les limites du barème du Fonds, avec copie de l'acte introductif d'instance ;
  - art. 13 : forclusion : 3 ans à compter de l'accident (responsable inconnu) ; 1 an à compter de la transaction ou de la décision passée en force de chose jugée (responsable connu non assuré) ; 3 ans pour avoir conclu accord/transaction ou agi en justice ; rentes ou paiement échelonné : 1 an à compter de l'échéance impayée ; délais courant de la connaissance du dommage si ignorée ;
  - art. 14 : demande par lettre recommandée AR ; tiers payeurs communiquent leurs versements dans 4 mois à compter de la demande du Fonds ; art. 15 : demande accompagnée de la décision de justice ou de la copie certifiée conforme de la transaction ; art. 16 : intervention du Fonds devant les juridictions, avis 10 jours au moins avant l'audience répressive ; art. 17 : transaction opposable à l'auteur, subrogation, intérêts au taux légal ; art. 18 : la victime peut dénoncer la transaction dans 1 mois, clause contraire nulle, mention en caractères très apparents sous peine de nullité relative ; art. 19 : paiement dans 1 mois à compter de la notification de la décision ou de l'expiration du délai de dénonciation, sinon intérêts au taux légal ; art. 20 : action récursoire, mise en demeure, contestation devant le tribunal dans 3 mois ; art. 21 : États membres : 3 ans pour mettre en place le Fonds.
- À en tirer : (a) cas « auteur inconnu / non assuré » : le dossier corporel doit gérer le renvoi vers le FGA (parcours, pièces, délais 60 j / 1 mois / 3 mois / 3 ans / 1 an) ; (b) forclusions et notifications à suivre comme échéances critiques ; (c) l'assureur qui oppose nullité, suspension ou non-assurance déclare au Fonds sous 3 mois et avise la victime (courrier absent des 7 modèles de la SPEC §6) ; (d) délais de 1 mois pour dénonciation et paiement d'une transaction à intégrer au corporel. Hors périmètre : financement du Fonds, plafonds nationaux (non donnés).

### 2.7 true.docx — Fiche de déclaration de sinistre du Fonds de Garantie Automobile (Sénégal)
- Ce que c'est : formulaire vierge (République du Sénégal, FGA, Dakar) « Fiche de déclaration de sinistre ».
- Rubriques : n° de sinistre, date, heure, lieu, venant de / allant vers ; victime (nom, prénoms, date et lieu de naissance, profession, adresse, téléphone) ; conducteur du véhicule (mêmes champs) ; propriétaire (mêmes champs) ; case « conducteur propriétaire oui/non » ; véhicule de la victime (immatriculation, genre, marque, n° de police, assuré, validité du... au...) ; véhicule en cause (idem + permis de conduire n°) ; constat de police ou gendarmerie oui/non + numéro de la mention ou du PV ; circonstances détaillées ; date de la déclaration ; signature de la victime ou de son représentant ; visa FGA ; visa de l'autorité compétente.
- Règles chiffrées : aucune. Cohérent avec l'art. 6 du règlement CIMA (mentions du PV).
- À en tirer : modèle de la déclaration d'accident corporel avec auteur non assuré ou inconnu : champs et visas ; sert au renvoi vers le FGA.

### 2.8 true (1).docx et true (2).docx — identiques à l'octet près (16 395 octets, `cmp` identique)
- Ce que c'est : dossier de demande d'indemnisation au FGA (Sénégal) : (1) « Fiche de renseignements ayant-droit » : victime directe (nom, prénoms, nom de jeune fille, date et lieu de naissance, date et lieu de l'accident, hôpital d'admission, identité du véhicule accidenteur, identité et adresse du civilement responsable) ; victimes par ricochet : représentant des héritiers (avocat, agent d'affaires, membre de la famille), numéro d'identification nationale, adresse, téléphone, e-mail, nombre d'héritiers ; (2) pièces à fournir (13) : pièce d'état civil de la victime, procès-verbal d'accident, certificat de genre de mort, certificat de décès, jugement d'hérédité, certificat de non opposition ni appel, pièces d'état civil des héritiers, copie de carte d'identité légalisée, certificat de vie collectif ou individuel, certificat de mariage (s'il y a lieu), justificatif des frais médicaux (s'il y a lieu), justificatif des frais funéraires, procuration (s'il y a lieu) ; (3) lettre-type au Directeur général : demande de prise en charge/d'indemnisation (victime, date et route de l'accident, circonstances) ; (4) « Fiche de renseignements victime blessée » (identité, adresse, téléphone, e-mail, date, lieu, hôpital et date d'admission, véhicule accidenteur, civilement responsable) ; (5) pièces à fournir blessé (6 lignes) : demande de prise en charge et/ou d'indemnisation ; procès-verbal d'accident ou provisoirement fiche de déclaration de sinistre visée par la police, extrait de sortie des sapeurs, déclaration à la police ou à la gendarmerie en cas de non-constat ; certificat médical initial ; justificatifs des frais médicaux (s'ils existent) ; certificat médical de consolidation ou de guérison ; procuration (s'il y a lieu).
- Règles chiffrées : aucune.
- À en tirer : (a) liste de pièces corporel DÉCÈS (ayants droit), absente de la SPEC §4 (qui ne donne que le cas auto corporel) alors que §12 cite l'acte de décès ; (b) liste blessé : certificat médical initial ET certificat de consolidation ou de guérison (la consolidation est une pièce, pas seulement une date) ; (c) victime par ricochet et représentant des héritiers (avocat, agent d'affaires) = bénéficiaire possible de la quittance (SPEC §5) ; (d) procuration comme pièce.
- `true (1).docx` et `true (2).docx` sont redondants.

---

## PARTIE 3 — Trous et contradictions

### 3.1 Ce que la SPEC annonce sans le fournir
- Compte rendu de l'atelier avec le service sinistres : cité comme source (entête), absent du dossier `docs/`. On ne peut pas vérifier l'origine des chiffres (45/21/30/90 j, 7 jours).
- Proposition de solution « Plateforme GED & gestion des sinistres » : citée comme source ; un `Proposition-commerciale-MoneyVibes-v2.docx` existe dans docs/ mais n'était pas dans le périmètre de cette lecture.
- Barèmes (§5) : 4 grilles « paramétrables » (une par volet), aucune grille, tranche, montant ou taux. Seuls documents voisins : grille médico-légale sans taux (2.4) et barème fonctionnel des incapacités du Code CIMA (cité p. 101-123 par le mémoire, non fourni).
- Seuil de délégation (§2 VALIDATION, §10 DIRECTION/RESPONSABLE) : aucun montant. Seuil « enjeu » de l'expertise externe (§11) : aucun montant. À titre indicatif seulement, le mémoire cite 300 000 / 200 000 / 1 000 000 FCFA pour une autre compagnie.
- Pièces obligatoires par type (§4) : une seule liste (auto corporel, 6 pièces). Manquent matériel, incendie/MRH, dégât des eaux, vol, transport, RC, recours, décès (liste FGA disponible, 2.8).
- Modèles de courriers (§6) : 7 intitulés, aucun texte, aucune variable, aucune mention légale obligatoire (ex. délai de dénonciation de la transaction, art. 18 du règlement FGA).
- Liste des types de sinistre et `VOLET_PAR_TYPE` : seulement des exemples par volet.
- Référentiels cités non fournis : `referentiel-experts.ts` (domaines, panel interne/externe), grille de charge pondérée, `mock-referentiel.ts`, `types/index.ts`.
- Transitions et déclencheurs des machines d'état (dossier, pièce, mission) non écrits ; critères de `REJETE`, de `RECOURS`, de réouverture non décrits.
- Délais : « délai cible » 45/21/30/90 j sans point de départ ni d'arrêt (déclaration -> règlement ? -> clôture ?). Les indicateurs §8 (délais d'ouverture, d'étude, de règlement) n'ont pas de cible. Aucun délai légal CIMA d'offre d'indemnisation n'est repris dans les documents fournis.
- Circuit du chèque (signataires, double signature, plafonds, chèque périmé) ; T-Money et Flooz (initiation, vérification du numéro, frais, plafonds opérateur, rapprochement par fichier ou API) : non décrits ; aucun autre moyen (virement, espèces).
- CRCA : aucune occurrence dans la SPEC ni dans le mémoire. « Contrôle interne » n'apparaît que comme usage de la piste d'audit, sans contrôles formalisés (séparation des tâches, revue mensuelle, contrôle de séquence : voir 2.5).
- Provisions (charge de sinistres) : aucune règle de provisionnement par dossier, alors que le mémoire en fait une faiblesse majeure ; §13 « engagements » est voisin sans être une provision technique.
- Recours : volet à 90 j et « mise en demeure », mais ni subrogation, ni relance (15 jours dans le mémoire), ni débours, ni convention inter-assureurs applicable ne sont décrits. La seule convention fournie (2.3) est tunisienne.
- Archivage : numéro ARC et reconstitution détaillés (§12), mais pas de durée de conservation, pas de purge, pas de définition du « sceau » (signature électronique ? horodatage ?).
- Droits d'accès : pas de matrice rôles x actions ; données de santé (certificats médicaux) et protection des données personnelles non évoquées.
- Assistant (§9) et suggestions de mission (§11) : seulement des principes (pas de seuils de confiance, de modèle, de journal de la suggestion).
- Langues : l'assistant parle FR/EN ; rien sur la langue des courriers.

### 3.2 Incohérences internes et avec les pièces
- §11 parle d'un « score » de complétude (« quel que soit son score ») : le score n'est défini nulle part.
- `RECOURS` est à la fois un statut de dossier (§2), un volet (§3, 90 j), un rôle (§10) ; §3 dit que le volet découle du type de sinistre alors que §4 dit qu'un tiers fautif « part au recours » : le volet change-t-il en cours de vie, ou le dossier existe-t-il en deux volets ?
- Un numéro de sinistre est attribué dès la déclaration (§2) mais `PIECES_INCOMPLETES` précède `OUVERT` : numéro de sinistre et ouverture sont deux notions non distinguées (le mémoire distingue numéro du logiciel et numéro du registre).
- §2 place `VALIDATION` (« au-delà du seuil de délégation ») entre `EVALUE` et `CHEQUE_A_REMETTRE` sans dire que le chemin la saute sous le seuil ; `CHEQUE_A_REMETTRE` suppose un chèque alors que T-Money et Flooz (§5) ne se « remettent » pas : le statut du dossier est lié à un moyen de paiement.
- Règlements partiels (§5, « norme » sur le corporel) vs statuts §2 (`REGLE` puis `CLOTURE`) : le dossier peut-il porter plusieurs quittances avant `REGLE` ? Quel statut pendant les acomptes ?
- Quittance : `REMISE` (guichet) vs `ENCAISSEE` (banque) : qui saisit `ENCAISSEE` ? Le contrôle de clôture « remises sans accusé signé » suppose un accusé papier, inexistant pour T-Money et Flooz.
- Liste d'appels : relance au-delà de 7 jours ; aucun lien avec un délai de paiement (le mémoire : 72 heures de la direction financière).
- §12 « un seul support fait foi à la fois (papier tant que l'image n'est pas scellée) » vs §7 (le journal conserve les versions de pièces) : la version numérique existe et est horodatée avant le scellement ; la valeur probante entre-temps n'est pas dite.
- §11 : `ACCEPTEE` est un droit de `EXPERT_EXTERNE` (§10) ; pour un `EXPERT_INTERNE` l'étape n'a pas de sens explicite. `TRANSMISE` (mission) et « sortie d'archive » (§12) sont deux événements reliés seulement par une phrase.
- §11 contre-expertise (jamais au même cabinet ni au panel interne) vs convention (2.3, art. 7-8) : contre-expertise contradictoire à l'initiative de l'assureur du responsable, avec expert initial convoqué, 3e expert arbitre : deux notions de « contre-expertise » (interne à la compagnie / inter-assureurs) non distinguées.
- §4 distingue les sources `mobile` et `chatbot` alors que §9 fait téléverser par le chatbot depuis un téléphone.
- Pièces de référence : le « Constat amiable d.docx » est un gabarit générique situé à Paris (pas un constat CIMA) ; le « Rapport expertise.docx » ne suit ni les modèles 1/2 de la convention ni les rubriques de son art. 10 ; la convention est TUNISIENNE (dinars, 1993/1999) ; le mémoire et les formulaires FGA sont SÉNÉGALAIS ; seul `true.pdf` est un texte CIMA (applicable au Togo). Aucune pièce togolaise ni texte national n'est fourni : risque de transposer des chiffres étrangers.
- Délais non comparables entre pièces : SPEC 7 jours (relance chèque non retiré) ; mémoire 72 heures (paiement) ; convention 10 jours (constat préliminaire ; rapport après factures), 45 et 75 jours (carence) : ne pas les confondre avec les délais cibles par volet.
- Mémoire : « décompte d'indemnité dans les 7 heures » : très probablement une coquille (7 jours) ; ne pas reprendre tel quel.
- Fichiers hors périmètre présents dans docs/ et non lus ici : `DEMO_SIN-2026-9002.md`, `SCENARIOS_DEMONSTRATION.md`, `retour-demo-SIN-2026-9002/`, `Proposition-commerciale-MoneyVibes-v2.docx`. La SPEC dit que ses règles « changent dans mock-referentiel.ts », donc le code de démonstration prime sur la SPEC en cas d'écart.
