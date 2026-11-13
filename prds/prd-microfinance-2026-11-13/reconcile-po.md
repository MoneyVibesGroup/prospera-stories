# Réconciliation PRD microfinance avec les décisions du PO (2026-11-13)

Contrôle de `prd.md` (3 903 lignes, 256 FR) contre : le récit du PO (`brain-dump-po-2026-11-13.md`, y compris ses réponses « PO : » du §7), les corrections du PO (`questions-po-2026-11-13.md`, les autres recommandations étant acceptées) et le journal `.memlog.md` (les entrées récentes l'emportent : correction IA, EN_GESTION à la décision du comité, Q1-Q4 du §12.2). Aucun fichier modifié hors ce rapport.

Légende : fidèle = présent et sans contradiction ; déformée = présent mais changé, assoupli, durci, ou contredit ailleurs dans le PRD ; absente = introuvable.

## 1. Décision → où dans le PRD → verdict

| # | Décision du PO (source) | Où dans le PRD | Verdict |
|---|---|---|---|
| 1 | Microfinance d'abord, assurance ensuite (journal) | §0 (« PRD assurance, qui s'écrit juste après ») | fidèle |
| 2 | Client = grande IMF multi-agences zone BCEAO, pré-contrat, jamais nommée (récit §1) | §0, tout le PRD écrit « l'IMF » | fidèle |
| 3 | Démarrage février 2027 avec les autres clients (récit §1) | §0, §10 | fidèle |
| 4 | Sur SES serveurs : installation, mises à jour à distance, sauvegardes, accès des agences, exploitation par une équipe tierce (récit §1) | §7.9, FR-262 à FR-269, UJ-9 | fidèle |
| 5 | Prospera ne remplace pas leur logiciel ; il se branche à côté pour crédit et pilotage (récit §2) | §0, FR-2, FR-150 | fidèle |
| 6 | Échanges définis sans produit précis : reçus = clients, prêts, paiements ; renvoyés = dossiers accordés, décaissements (récit §2) | §6.5, FR-151 à FR-153, annexe C | fidèle |
| 7 | Ce qui fait foi pour l'argent = le logiciel de l'IMF (PO, §7) | FR-2, §4.2, FR-150, D-2 | fidèle |
| 8 | Cœur fictif pour la démo « pour qu'ils comprennent » ; vrai connecteur « pour leur démo, mais pas maintenant » (PO, §7 ; journal) | §0, §6.6 (FR-166 à FR-172), FR-259, §10.2 | déformée (voir §4 : surspécification, finalité pédagogique perdue, lien « leur démo » perdu) |
| 9 | Jour 1 = toute la plateforme, crédit priorité absolue de bout en bout (récit §3) | §0, partie 2, §10.1 | déformée en partie (étoiles ★ et « démo de février » vs « premier jour de l'IMF » créent deux niveaux ; voir §4) |
| 10 | Comptabilité non prioritaire, au mieux un export des écritures (récit §3, §5) | §0, §7.6, FR-252 | fidèle (petite incohérence : §10.1 range l'export parmi les modules « au premier jour », FR-252 dit « pas exigé au jour 1 ») |
| 11 | Reprise des prêts en cours : import prévu, format/logiciel reportés, ajusté à la présentation (récit §3, §7) | §6.9, FR-196 à FR-198, FR-259 | fidèle |
| 12 | Le backend existant (localhost:3001) ne compte pas ; le PRD décrit des capacités (récit §3) | §0, annexe A (C1 : « le backend de démo ne compte pas ») | fidèle |
| 13 | `prospera-microfinance-service` = paquet de comptabilité SFD, non prioritaire, pas la base du crédit (récit en-tête ; A11) | FR-16, FR-182, §10.2, D-12 | fidèle |
| 14 | Rôles CC, ROC, RA, GP, DG, DAF + agent terrain, commercial, analyste risque, auditeur (récit §4) ; liste à 16 (F1 accepté) | §2.1, FR-5 | fidèle |
| 15 | Phase 1 : prospect, fiche (identité, activité, photos, GPS), KYC validé puis score, groupe solidaire (récit §4) | §5.1, FR-30, FR-114 à FR-120, FR-129 | déformée : FR-30 et FR-43 laissent créer la demande avec un KYC seulement « EN_VERIFICATION » (valide « avant le décaissement ») alors que le récit place le KYC validé avant la demande |
| 16 | Phase 2 : produit du catalogue, bornes, éligibilité (score min, ancienneté), simulation (mensualités, intérêts, frais, TAEG), SOUMIS, CC prévenu (récit §4) | FR-32 à FR-36, FR-109, FR-87 | fidèle |
| 17 | Phase 3 : pièces manquantes, cautions (≥ 2 au-dessus d'un seuil), DOSSIER_COMPLET + recalcul du score (récit §4) | FR-39 à FR-43 | fidèle |
| 18 | Phase 4 : visites (≥ 2 au-dessus de 500 000 en démo, photo + GPS), 5C, score, alertes, checklist 100 %, avis CC favorable/défavorable (récit §4 ; C3, C13) | FR-45 à FR-51 | fidèle |
| 19 | IA propose approuver / réduit / garanties / refuser ; le CC peut s'écarter en justifiant (récit §4) | FR-49, FR-51 | fidèle |
| 20 | Phase 5 : ROC approuve (montant, taux, durée, GP → EN_COMITE_CREDIT), refuse (REFUSE, agent prévenu), demande des garanties (retour aux documents) ; l'accord du ROC ne crée pas d'échéancier (récit §4) | FR-53 à FR-55 | fidèle |
| 21 | Phase 6 : quorum ROC + (DG ou RA) ; conditions finales figées (montant, taux, durée, mensualité, frais, TAEG, 1re échéance, GP, notes) (récit §4) | FR-56, FR-57, FR-59 | fidèle |
| 22 | Le comité SEUL génère l'échéancier ; le dossier passe alors à EN_GESTION (récit §4 ; journal « change ») | FR-61, FR-70, FR-78, §5.8, D-4 | fidèle dans le corps ; contredite par l'annexe A.1 C4 (voir §2, C-1) |
| 23 | Décaissement dans EN_GESTION par sous-état (À_ORDONNER, ORDONNE, EXECUTE, CONFIRME) ; non CONFIRME ⇒ hors encours, PAR, relances (journal) | §5.8 intro, FR-64 à FR-70 | fidèle |
| 24 | Espèces autorisées seulement par le comptable ou le DAF ; Mobile Money ou virement (récit §4) | FR-67, FR-68, FR-69 | fidèle |
| 25 | Client, GP, agent, responsable commercial prévenus après le décaissement (récit §4) | FR-70 (« à la confirmation du décaissement ») ; FR-87 (« Passage à EN_GESTION ») | déformée par contradiction interne (voir §2, C-2) |
| 26 | Remboursements en espèces, guichet, collecte terrain, Mobile Money ; Mobile Money « en attente » jusqu'à validation du comptable ; rattachement auto si écart < 1 % (récit §4) | FR-135 à FR-140, FR-210 | fidèle |
| 27 | Relances : J-3 WhatsApp + lien, J+1 à J+3 courtois puis SMS, J+7 ferme + mission terrain + alerte ROC, promesse non tenue, J+90 contentieux (récit §4 ; D11) | FR-212, FR-203, FR-250 | fidèle (J+90 devient « proposé au ROC », D2 accepté) |
| 28 | Promesses enregistrées par le GP, relances suspendues jusqu'à la date promise (récit §4) | FR-213 | fidèle |
| 29 | ROC voit le réseau trié par PAR, descend agence par agence jusqu'au dossier, définit la stratégie, assigne des agents de recouvrement par zone (récit §4) | FR-215, FR-216 | fidèle |
| 30 | Actions : appel, visite, plan d'étalement, mise en demeure, saisie de garantie, contentieux ; chaque action tracée avec son résultat (récit §4) | FR-217, FR-219, FR-220, FR-223 | fidèle |
| 31 | Statuts de recouvrement EN_RETARD → … → PERTE_DEFINITIVE ; seul le ROC bloque/débloque, motif obligatoire (récit §4) | FR-214, FR-218 | fidèle (une transition ambiguë : voir §2, C-8) |
| 32 | Fiche mauvais payeur (historique, retards, promesses, actions, score de recouvrement, garanties) (récit §4) | FR-222 | fidèle |
| 33 | Clôture CLOTURE puis nouveau cycle (récit §4) | FR-75, FR-76, FR-225 | fidèle |
| 34 | 12 statuts dans l'ordre, « REFUSE à tout moment » (récit §4) | FR-78 | déformée mineure : REFUSE (et ANNULE) seulement « avant EN_GESTION » ; ANNULE ajouté (C1 accepté) |
| 35 | Chaque changement de statut horodaté, qui/quoi/quand (récit §4) | FR-9, FR-80 | fidèle |
| 36 | Pilotage par rôle (~10 rôles), DG descend réseau → secteur → agent → client, alertes, Copilot (récit §5) | §7.3, FR-230 à FR-237 | fidèle (16 rôles : F1 accepté) |
| 37 | Droits d'accès : DG réseau, RA agence, GP portefeuille, agent zone (récit §5) | FR-5, FR-92, annexe B | fidèle |
| 38 | Terrain : visites géolocalisées, hors ligne avec synchronisation (récit §5) | §7.1, FR-134, FR-204 | fidèle |
| 39 | Caisse et Mobile Money : trois canaux, clôture quotidienne, alerte d'écart (récit §5) | §6.4 (FR-143 à FR-146), FR-140 | fidèle à A8 accepté (guichet lu du cœur, caisse des collecteurs à Prospera) |
| 40 | Épargne et catalogue de produits versionnés, un dossier en cours garde ses conditions (récit §5) | §6.1 (FR-100 à FR-107), FR-106, FR-130 | fidèle |
| 41 | Conformité BCEAO et audit : reporting + export PDF, séparation des responsabilités, traçabilité (récit §5) | §6.8, FR-183 à FR-195, FR-6, FR-9 | fidèle |
| 42 | Équipes, réseau, marketing : objectifs par agence/agent, acquisition, chatbot WhatsApp (récit §5) | §7.3, §7.4, FR-247 | déformée en partie : chatbot WhatsApp « bientôt » (F4 accepté, mais le récit le met au jour 1) |
| 43 | Taux d'usure : plafond paramétrable, 24 % par an (PO, §7) | FR-10, FR-36, FR-108, FR-189 | fidèle (la référence « Décision n° 19 du 29/12/2025 » est ajoutée : voir §3) |
| 44 | Seuils de la démo (500 000, 2 cautions, quorum, délais) paramétrables (PO, §7) | FR-3, FR-86 | fidèle |
| 45 | Mobile Money par pays ET opérateur, et banques via PI-SPI (PO, §7) | FR-64, FR-140, FR-256 | fidèle (Togo posé comme défaut de démo, voir §3) |
| 46 | Taille : « c'est eux qui gèrent ; nous, on fait un truc pour leur démo ; après ils vont s'adapter » (PO, §7) | FR-266, §11 | déformée en partie : le principe est repris, mais le PRD ajoute un test à ×10, des NFR chiffrés (99,5 %, 3 s, test d'intrusion) |
| 47 | T5 : produits financiers = module à part `produits-financiers` | §6.1, FR-100, §6.4bis, D-11 | fidèle |
| 48 | T6 : code d'agence = celui du cœur s'il en a un, sinon codes Prospera | FR-164, FR-255, annexe C | fidèle |
| 49 | A1 : renvoi des remboursements au cœur si possible, pas une obligation ; sinon liste « à saisir dans le cœur » | FR-2, FR-71, FR-137, FR-155, FR-156, FR-209 | fidèle |
| 50 | A11 : le paquet SFD ne tient pas les crédits de l'IMF, non installé au jour 1 | FR-16, FR-182, D-12 | fidèle |
| 51 | B3 : licence à vie, aucune coupure ni gel pour impayé (lecture : mises à jour liées à la maintenance, [ASSUMPTION]) | FR-261, §11, D-13, annexe A (en-tête) | fidèle (la lecture « mises à jour refusées sans contrat » est testable en FR-262 : voir §3) |
| 52 | B4 : démo 3 agences, 10 agents, 1 000 prêts actifs ; on y crée une agence, un agent, un vrai dossier jusqu'à EN_GESTION | FR-11, FR-12, FR-93, FR-172, UJ-6 | fidèle |
| 53 | E3 : LBC/FT important, surtout la mise à jour régulière (sanctions, revue KYC) | FR-121, FR-122, FR-193, FR-268 | fidèle |
| 54 | E5 : seuils d'alerte établis sur les données de l'IMF, pas figés sur la démo (lecture [ASSUMPTION]) | FR-4, FR-178, FR-235 | fidèle |
| 55 | F2 : secteur d'activité très important, dimension de pilotage ET donnée vers l'IA commune | FR-7, FR-117, FR-174, FR-233, FR-260 | fidèle |
| 56 | Correction IA : le PRD a des capacités d'IA sur tout le processus, spécifiées ; l'IA commune est le moteur ; micro/macro, secteur, zones de prospection ; remplace « aucune IA propre » | §0, FR-8 (tableau), FR-49, FR-95 à FR-99, FR-112/113, FR-124 à FR-128, FR-131, FR-142, FR-147 à FR-149, FR-180/181, FR-190, FR-194, FR-199, FR-206 à FR-208, FR-226 à FR-229, FR-237, FR-238, FR-243, FR-248, FR-254 | fidèle dans FR-8 et les modules ; déformée par §7.8 et l'annexe A qui redisent « aucune IA propre » (voir §2, C-3) |
| 57 | IA commune : données seulement avec consentement, marche sans elle (emplacement vide), score par règles v0 en attendant | FR-8, FR-15, FR-132, FR-260 | fidèle |
| 58 | Q1 : le cœur fictif décaisse par Mobile Money dans la démo ; adaptateur sortant de `paiement` chiffré au plan | FR-256, §12.2 Q1 | fidèle |
| 59 | Q2 : `paiement` reste seul propriétaire des créances ; pas d'amendement ; articulation analysée à l'ajout du connecteur réel ; « créance miroir » retirée | FR-2 (dernière ligne), FR-209, FR-257, annexe A (recouvrement, paiement) | fidèle dans l'intention ; contradictions internes sur QUI porte le « reste dû » (voir §2, C-4) |
| 60 | Q3 : pas d'obligation Connecteurs pour l'IMF ; pas d'amendement de la spine (AD-32) | §6.5 intro, §12.2 Q3, FR-259 | fidèle |
| 61 | Q4 : charge de février, « pas de souci, rien n'est modifié » | §12.2 Q4 ; mais §12.3 ligne « La charge de février » | déformée (le PRD garde un risque « la démo peut glisser » que le PO a écarté) |
| 62 | Q5 à Q13 sans réponse : proposition du brouillon = défaut | §12.2 | fidèle |
| 63 | Mode rapide, brouillon complet avec [ASSUMPTION] puis réconciliation | en-tête, §13 (70 hypothèses indexées) | fidèle |
| 64 | Sources secondaires (prospera-backend) : règles métier oui, API jamais ; le récit l'emporte | §0 (ordre de priorité) | fidèle |
| 65 | Partie 3 du PRD distributeur = fiches de renvoi + écarts IMF ; crédit, épargne, caisse, groupes, conformité en entier | partie 4 (§7), partie 3 | fidèle |
| 66 | Recommandations acceptées vérifiées une à une : A2 A3 A4 A5 A6 A7 A8 A9 A10 B1 B2 C1 à C18 D1 à D11 E1 E2 E4 E6 E7 F1 F4 F5 F7 F8 F9 F10 F11 F12 T1 à T4 T7 | FR-61/62/63, FR-64 à FR-69, FR-137, FR-139/140, FR-157/158, FR-264, FR-78, FR-41/42, FR-218 à FR-225, FR-183 à FR-192, FR-240, FR-242, FR-245 à FR-249, FR-129, FR-201, etc. | fidèle (valeurs relues : 2 cautions > 300 000 ; dépôt 10/15 % ; garantie réelle 30/50 % ; visites 500 000/100 m ; quorum ROC+(DG ou RA) ; DG > 5 M ; usure 24 % ; PAR 1/30/90 cumulatifs ; provisions 40/80/100 % ; plan d'étalement 12 mois ; perte à 24 mois ; barème d'équipe 90/75/60) |
| 67 | D8 : score de recouvrement = règle explicable, pas un modèle (recommandation acceptée, puis rattrapée par la correction IA) | FR-227 (« pas un modèle (décision D8) ») ; FR-8 (tableau : « score de recouvrement ») | déformée (voir §2, C-5) |

Total : 67 lignes. Fidèles : 56. Déformées : 11 (lignes 8, 9, 15, 25, 34, 42, 46, 56, 59, 61, 67 ; la ligne 22 est comptée fidèle mais minée par l'annexe A.1, voir C-1). Absentes : 0 (voir §4 pour ce que la structure en FR fait tomber).

Comptage retenu pour la réponse : fidèles 56, déformées 11, absentes 0.

## 2. Contradictions internes (citation, emplacement, correction proposée)

**C-1 (bloquante) EN_GESTION conditionné au cœur dans l'annexe A.1.**
Annexe A.1, C4 (l. 3556) : « `coeur-sfd` absent : … la décision du comité reste possible, **le décaissement et le passage à EN_GESTION sont refusés** (`COEUR_NON_INSTALLE`) ». C'est l'ancienne consigne (EN_GESTION après confirmation du cœur), que le journal a corrigée. FR-70, FR-78 (tableau), §5.8 et D-4 : EN_GESTION à la décision du comité, avant tout décaissement.
Correction : « `coeur-sfd` absent : la décision du comité reste possible, l'échéancier contractuel est généré et le dossier passe à EN_GESTION ; l'envoi du dossier accordé, l'ordre de décaissement et la confirmation sont `NON_INSTALLE` ; le sous-état de décaissement reste À_ORDONNER (« en attente de décaissement ») ; l'ordre est refusé (`COEUR_NON_INSTALLE`). »

**C-1b (importante) Le cœur fictif crée le prêt à l'acceptation du dossier accordé.**
Annexe C, ligne « Dossier accordé » : « Accepte ou refuse (avec motif) ; crée le prêt et l'échéancier officiel ». Ligne « Échéance » : « Génère l'échéancier officiel à l'acceptation d'un dossier ». FR-63 : « Le cœur ne crée le prêt officiel qu'au décaissement » ; FR-70 : le prêt n'existe officiellement qu'à CONFIRME.
Correction : le cœur fictif accepte le dossier accordé (sous-état À_ORDONNER) ; il crée le prêt et génère l'échéancier officiel à l'exécution de l'ordre (CONFIRME). Aligner FR-172 (« l'ordre est exécuté, l'échéancier officiel revient »), qui est déjà dans le bon ordre.

**C-2 (importante) Qui est prévenu, et quand.**
FR-87, tableau : « Passage à EN_GESTION | client, GP, agent, responsable commercial | SMS, WhatsApp… ». FR-70 : « prévenus à la confirmation du décaissement » ; UJ-1 : prévenus après que le cœur confirme ; récit §4 phase 6 : prévenus après le décaissement. Avec EN_GESTION à la décision du comité, le client serait prévenu qu'il est « en gestion » avant d'avoir l'argent.
Correction : FR-87 sépare deux lignes : « Décision du comité favorable → GP, ROC, agent (cloche, e-mail) » (déjà là) ; « Décaissement CONFIRME → client, GP, agent, responsable commercial » (SMS, WhatsApp pour le client).

**C-3 (importante) « Aucune IA propre » alors que la correction du PO l'a remplacée.**
§7.8 : « Ce PRD ne crée **aucune IA propre** (décision du PO) : il **fournit les données**, **affiche les propositions** et **marche sans elle** ». Annexe A (en-tête) : « n'en ont aucune propre » ; A.4 C11 : « Aucune IA propre à ce module » ; A.15 : « sans modèle propre ». Le journal (correction du 2026-11-13) : le PRD a des capacités d'IA sur tout le processus, spécifiées ; « remplace la lecture “aucune IA propre” ». FR-8 et §0 le disent bien.
Correction : dans §7.8 et l'annexe, écrire « Ce PRD n'embarque aucun modèle et n'écrit pas le moteur : il **spécifie ce que l'IA fait pour l'IMF** (FR-8 et chaque module), fournit les données, affiche les propositions et marche sans elle ». Retirer « (décision du PO) » attaché à « aucune IA propre » ; la décision du PO est la correction.

**C-4 (importante) Le « reste dû » : cœur ou Créance de `paiement` ?**
FR-209, 1re phrase : « Le recouvrement lit du cœur … reste dû, échéances impayées, pénalités… » ; FR-2, FR-71, FR-135, FR-141, FR-150 : reste dû lu du cœur. Mais FR-209 (2e puce) : « Le dossier de recouvrement lit le reste dû de la Créance de `paiement` » et (4e puce) : « le reste dû affiché est celui de la Créance de `paiement` ». FR-161 : « Un solde de prêt de Prospera est recalculé à partir de l'encours officiel et des mouvements ». FR-2 : « Prospera ne tient jamais un solde officiel ».
La décision Q2 (paiement seul propriétaire des créances ; articulation à analyser plus tard) est respectée, mais le PRD affirme deux sources du reste dû sans règle de préséance.
Correction : poser UNE règle provisoire, signalée [ASSUMPTION] à confirmer au connecteur réel : « le reste dû affiché est celui du cœur, avec sa date ; la Créance de `paiement` porte l'imputation et le rattachement des paiements ; tout écart va dans la file des écarts (FR-159) ». Retirer « le reste dû affiché est celui de la Créance de `paiement` » ou le reformuler « le reste dû selon Prospera ». Ajouter à §12.2 une question Q14 « arbitrage cœur / Créance, à fixer avec le connecteur réel » (déjà dit en FR-257 mais absent du tableau).

**C-5 (importante) Score de recouvrement « pas un modèle (D8) » contre la correction IA.**
FR-227 : « la probabilité suit la règle explicable du noyau … pas un modèle (décision D8) ». Journal : D8 fait partie des points repris par « toute IA = l'IA commune », puis la correction place « recouvrement : score, stratégie par agence, scripts » dans les capacités d'IA. FR-8 (tableau) liste le « score de recouvrement (probabilité de récupérer) » côté IA.
Correction : FR-227 : « règle explicable (v0) tant qu'un modèle de l'IA commune n'est pas disponible ; poids affichés ; un modèle la remplace avec sa provenance ». Supprimer « (décision D8) ».

**C-6 (importante) Trois règles différentes pour le KYC avant le dossier complet.**
FR-30 : demande possible avec KYC EN_VERIFICATION, « valide » exigé avant le décaissement. FR-43 : DOSSIER_COMPLET si « KYC au moins EN_VERIFICATION ». FR-120 : « Un dossier de crédit ne passe pas à DOSSIER_COMPLET si le KYC du demandeur et celui de ses cautions ne sont pas COMPLET ». FR-119 : KYC renforcé sans approbation ROC bloque le passage à EN_COMITE_CREDIT (absent de FR-66 et de FR-78). Récit : KYC validé en phase 1, avant la demande.
Correction : choisir la ligne du récit : KYC COMPLET du demandeur et des cautions avant DOSSIER_COMPLET (FR-43 et FR-30 alignés sur FR-120) ; ajouter l'approbation ROC du KYC renforcé à FR-66 et au tableau FR-78. Si l'assouplissement est voulu, le marquer [ASSUMPTION] et le porter au §12.2.

**C-7 (importante) Score absent : bloquer ou non l'éligibilité.**
FR-34 : « Si le score est absent (IA commune non installée), le critère de score est marqué “non évalué” et ne bloque pas. » FR-104 : « Sans score disponible (IA commune absente et règle non calculable), la demande est refusée avec “score indisponible” ; elle n'est jamais acceptée par défaut. »
Correction : trancher dans FR-34 et FR-104 : la règle v0 sert toujours un score (FR-124), donc le cas « sans score » n'existe qu'en panne de la règle ; dans ce cas, la demande attend (« score indisponible », ni refus ni acceptation) et le ROC peut déroger (FR-84). Une seule formulation, reprise dans H-8.

**C-8 (mineure) Accès au journal.**
FR-9 : « Le journal des accès … est lisible par l'AUD seul » ; FR-244 : idem ; FR-191 : « Seuls l'auditeur interne (AUD) et le DG lisent le journal complet » ; FR-80 : « Tout accès d'un AUD ou d'un ADMIN_IMF … est journalisé » ; annexe B : DG « L (piste) ». Correction : distinguer « piste d'audit » (AUD et DG) et « journal des accès » (AUD seul), à dire dans FR-9 et FR-191.

**C-9 (mineure) Transitions de recouvrement.**
FR-214 : `BLOQUE → CONTENTIEUX_JUDICIAIRE` et `BLOQUE → PERTE_DEFINITIVE` seulement ; FR-221 (perte à 24 mois, décidée par le DG sur proposition du ROC) ne dit pas que le dossier passe d'abord par BLOQUE. Récit : le statut chaîne ouvert. Correction : dire en FR-221 « le ROC pose BLOQUE puis propose la perte au DG » ou autoriser `EN_RECOUVREMENT → PERTE_DEFINITIVE` avec décision DG.

**C-10 (mineure) Nombre de questions.**
§0, en-tête et §12.1 : « 71 questions » ; `questions-po-2026-11-13.md` : « 68 questions ». Correction : 68.

**C-11 (mineure) Export des écritures « au premier jour » ou non.**
§10.1 range « export des écritures » dans les « autres modules au premier jour de l'IMF » ; FR-252 : « Ce module n'est pas exigé au jour 1 ». Récit : « au mieux ». Correction : §10.1 « au mieux » ; FR-252 inchangé.

**C-12 (mineure) Tutoiement et langue du PRD.** §12.2 Q7 : « Trois lectures de tes réponses ». Correction : « de ses réponses ».

## 3. Ce que le PRD présente comme décidé sans décision du PO

Hors ce qui est marqué [ASSUMPTION] (70 hypothèses au §13), voici ce qui est écrit comme acquis :

1. **Togo comme pays par défaut de la démo**, avec Flooz et Mixx (FR-11). Le PO a dit : « par pays et par opérateur » ; le récit demande de « confirmer le pays ». Le crochet [ASSUMPTION] de FR-11 ne couvre que les noms d'agences. À marquer : « pays par défaut : Togo [ASSUMPTION] ».
2. **Référence légale du plafond** : « Décision n° 19 du 29/12/2025/CM/UMOA, en vigueur le 01/06/2026 » (FR-10, FR-36, FR-108, FR-189). Le PO a confirmé 24 % par an ; le récit demande une vérification par un juriste. La citation vient d'un extrait, pas du PO. À rattacher à FR-195 (« à vérifier »).
3. **Test de montée en charge à ×10 (30 agences, 100 agents, 10 000 prêts) et configuration minimale tirée de ce test** (FR-266, NFR-1). La recommandation B4 (12 agences, ×10) a été remplacée par la démo à 3/10/1000 ; le ×10 n'a pas été re-validé. Le PO : « la taille, c'est eux qui gèrent ».
4. **NFR chiffrés non marqués** : disponibilité 99,5 % (NFR-3), « test d'intrusion avant février » (NFR-5), performances 3 s / 500 ms / 10 s (NFR-1, FR-266, déclarées issues du cahier mais présentées comme exigences), 15 min de fraîcheur (NFR-2, lui marqué).
5. **FR-261, 4e puce / FR-262 : « une mise à jour reçue sans contrat de maintenance valide est refusée »**. Seule la lecture de la salle (séance 4) la fonde, marquée [ASSUMPTION] en FR-261 ; FR-262 la pose comme test d'acceptation. De plus, FR-261 déclare que FR-15, FR-32 et FR-41 du PRD moteur « ne s'appliquent pas » : c'est une modification d'un PRD voisin, à porter au PRD moteur (A.15 le dit, mais pas §12.2).
6. **Deux étapes sorties de la démo, pas du PO** : ajustement de risque du taux selon le score (FR-101, défaut 60, +2 points) ; assurance décès-invalidité comme garde de décaissement (FR-65, FR-66, dépendance au module `assurance`, qui relève du PRD suivant). À marquer [ASSUMPTION] ou à retirer des gardes.
7. **FR-36 : coût des garanties inclus dans le TEG** et méthode « ramené à l'année par proportionnalité » : extraits réglementaires, jamais décidés. Déjà en partie dans FR-195 ; à relier.
8. **FR-11, FR-201 : position GPS « simulée et acceptée comme preuve » dans l'essai** pour que UJ-1 atteigne EN_GESTION. Non demandé par le PO ; à marquer.
9. **§12.3, ligne « La charge de février » : « La démo de l'IMF peut glisser »**. Le PO a dit « pas de souci, rien n'est modifié ».
10. **Chaîne de remontée des alertes (FR-234)** : marquée [ASSUMPTION], correct ; mais elle est reprise telle quelle dans le tableau de bord et l'annexe B sans le signal.

## 4. Idées qualitatives perdues (ce que la structure en FR fait tomber)

1. **« On fait un truc pour leur démo, pour qu'ils comprennent. »** Le PO décrit un cœur fictif léger, pédagogique, à intégrer. Le PRD le spécifie en sept FR (FR-166 à FR-172) : balance au plan SFD équilibrée avec fonds propres, API et fichiers à deux fraîcheurs, 1 000 prêts qui « vivent » chaque jour, bouton de panne, remise à zéro en moins de 10 minutes, reproductibilité. Le ton est celui d'un produit, pas celui d'un truc fictif. L'intention « pour que l'IMF comprenne » n'apparaît nulle part (§0 : « pour la démonstration » ; FR-166 : « pour que la démo soit crédible »). Proposition : une phrase d'intention en tête de §6.6 (« le cœur fictif sert à faire comprendre l'échange à l'IMF, pas à la remplacer ») et marquer ★/essentiel le strict nécessaire (clients, prêts, échéancier, décaissement, paiements), le reste « si le temps le permet ».
2. **« Pour la partie démo du client, on va mettre en place le bon connecteur, mais pas pour maintenant. »** Le PRD dit « le vrai connecteur viendra plus tard, quand son logiciel sera connu » (§10.2, FR-259). Le PO lie le vrai connecteur à la démo du client (sa présentation), pas seulement à la connaissance du logiciel. À reformuler : « le vrai connecteur est prévu pour la démo propre à l'IMF, hors février ».
3. **« Toute la plateforme au jour 1 ; tout le reste est prioritaire. »** Le PRD introduit des ★ (« modules dans la démo de février ») et des modules « au premier jour de l'IMF » (§10.1). Le lecteur comprend deux niveaux (caisse, conformité BCEAO, équipes, marketing non ★), alors que le récit fait de la conformité BCEAO la promesse n°5 et ne hiérarchise que la comptabilité. À écrire : « ★ = ce que la démo de février montre en premier ; ce n'est pas un classement de priorité ; seule la comptabilité est non prioritaire ».
4. **Démarrage de février = jour 1 = premier contact de l'IMF avec une démo, au stade pré-contrat.** Le PRD parle d'exigences de production (RPO/RTO, SLA, pen test, manuel d'exploitation) comme si le contrat était signé. Le PO : « ils vont s'adapter ». À ajouter en §0 : « au stade pré-contrat, le livrable de février est une démonstration ; les exigences d'exploitation sont des cibles à confirmer à la signature ».
5. **« Nous, on fait un truc pour leur démo ; après ils vont s'adapter » (taille).** FR-266 le reprend, mais noyé sous les chiffres de performance ; l'esprit « on ne dimensionne pas pour eux » est mieux dit dans §11.
6. **Le ton « accord, direct » des réponses du PO** (« exactement », « d'accord », « pas de souci ») : consigné comme décisions, correctement ; rien de perdu, mais le PRD laisse dans §12.2 Q1 à Q4 le vocabulaire du brouillon (« Tranché ») sans signaler que Q3 « pas une obligation à ce stade » ne ferme pas la question du connecteur.
7. **La nuance « si possible » de A1** est bien reprise (FR-2, FR-155, FR-156) mais la liste « à saisir dans le cœur » devient une exigence lourde (alertes à 72 h, export tableur, preuve). Le PO a seulement dit « si possible, pas une obligation ». Alléger : la liste est le repli, sans alertes obligatoires.

## 5. Corrections proposées, classées

### Bloquantes
- **B1.** Annexe A.1, C4 : retirer « le passage à EN_GESTION [est] refusé » ; EN_GESTION à la décision du comité sans le cœur (C-1).
- **B2.** Annexe C, lignes « Dossier accordé » et « Échéance » : le cœur fictif crée le prêt et l'échéancier officiel à l'exécution de l'ordre, pas à l'acceptation du dossier (C-1b).
- **B3.** FR-87 : séparer « décision du comité » et « décaissement CONFIRME » ; le client n'est prévenu qu'à la confirmation (C-2).

### Importantes
- **I1.** §7.8, annexe A (en-tête, A.4 C11, A.15) : retirer « aucune IA propre (décision du PO) » ; dire « aucun modèle embarqué, le PRD spécifie ce que l'IA fait » (C-3).
- **I2.** FR-209 (puces 2 et 4) et FR-161 : une seule règle sur le « reste dû » (cœur affiché, Créance de `paiement` pour l'imputation, écart = file des écarts) ; ajouter Q14 au §12.2 (C-4).
- **I3.** FR-227 : retirer « pas un modèle (décision D8) » ; règle v0 puis modèle (C-5).
- **I4.** FR-30, FR-43, FR-120, FR-66, FR-78 : un seul moment pour le KYC COMPLET ; approbation ROC du KYC renforcé dans FR-66 (C-6).
- **I5.** FR-34 et FR-104 : un seul traitement du « score indisponible » (C-7).
- **I6.** FR-11 : marquer « Togo par défaut » comme [ASSUMPTION] ; FR-10, FR-36, FR-108, FR-189 : rattacher la référence légale à FR-195 (§3, points 1 et 2).
- **I7.** FR-266, NFR-1 à NFR-5 : marquer le ×10, 99,5 %, pen test, valeurs de performance comme [ASSUMPTION] ou les retirer de ce PRD ; ajouter la phrase « pré-contrat : démonstration d'abord » en §0 (§3 points 3 et 4 ; §4 point 4).
- **I8.** §12.3 ligne « La charge de février » : retirer « peut glisser » (Q4 : rien n'est modifié).
- **I9.** §6.6 : ajouter l'intention pédagogique du cœur fictif et marquer ce qui est essentiel (FR-166 à FR-172) ; §10.2 et FR-259 : lier le vrai connecteur à « la démo propre à l'IMF » (§4 points 1 et 2).
- **I10.** §10.1 et légende des ★ : dire que ★ n'est pas un classement de priorité (§4 point 3).

### Mineures
- **M1.** FR-78 : REFUSE « à tout moment » comme le récit, sauf EN_GESTION où l'on passe par le recouvrement ; ou documenter l'écart (verdict 34).
- **M2.** FR-9 et FR-191 : distinguer « piste d'audit » (AUD, DG) et « journal des accès » (AUD seul) (C-8).
- **M3.** FR-221 / FR-214 : dire par quel statut passe la perte définitive (C-9).
- **M4.** « 71 questions » → « 68 questions » (§0, en-tête, §12.1) (C-10).
- **M5.** §10.1 : l'export des écritures « au mieux » (C-11).
- **M6.** §12.2 Q7 : « tes » → « ses » (C-12).
- **M7.** FR-101 (ajustement de risque) et FR-65/FR-66 (assurance en garde) : marquer [ASSUMPTION] (§3 point 6).
- **M8.** FR-137, FR-156 : alléger la liste « à saisir dans le cœur » (« si possible, pas une obligation ») (§4 point 7).
- **M9.** FR-247 / §10.2 : noter que le chatbot WhatsApp est au jour 1 dans le récit et « bientôt » par F4 accepté ; garder la trace de la décision (verdict 42).
