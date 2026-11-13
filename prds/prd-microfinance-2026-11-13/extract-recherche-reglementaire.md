# Recherche réglementaire SFD / UMOA pour le PRD microfinance (crédit)

Date de la recherche : 2026-11-13. Requêtes web génériques uniquement (aucune donnée client ou projet envoyée).
Niveaux de certitude : **A** = texte officiel lu en entier ; **B** = texte officiel lu en partie ou source secondaire concordante ; **C** = non vérifié, à confirmer.

## Constat transversal à lire d'abord

- Une **nouvelle loi uniforme portant réglementation de la microfinance dans l'UMOA** a été adoptée par le Conseil des ministres le **21/12/2023** (Cotonou). Son art. 173 **abroge** la loi uniforme SFD de 2007, mais l'art. 171 maintient les instructions BCEAO existantes « pour toutes leurs dispositions non contraires » jusqu'à leur abrogation. L'art. 168 donne **12 mois** de mise en conformité à compter de l'entrée en vigueur nationale (date laissée en blanc dans le texte uniforme ; chaque État doit le transposer). Transpositions repérées (source secondaire, certitude B) : Sénégal loi n° 2025-04 du 19/02/2025 ; Burkina en cours ; Côte d'Ivoire projet présenté le 29/04/2026.
- Conséquence : la notion « SFD de l'article 44 » (ancienne loi) devient, dans la nouvelle loi, « institution atteignant le **seuil fixé par la Banque Centrale** » supervisée par la Commission Bancaire (art. 70), les autres relevant du Ministère des Finances. Le PRD doit paramétrer cette catégorie, pas coder « article 44 » en dur.
- Source : <https://www.cb-umoa.org/sites/default/files/2026-08/Loi%20microfinance%20UMOA.pdf> (texte uniforme avec blancs, lu en grande partie, A pour le contenu, B pour son statut de droit positif par pays).

---

## 1. Taux d'usure et TEG

**Réponse courte.** 24 % l'an est **confirmé** pour les SFD/institutions de microfinance. Il n'a pas baissé pour eux ; c'est le taux des banques qui passe de 15 % à 14 %. Nouveauté : la décision prend effet le **1er juin 2026**.

**Texte exact.**
- Décision n° 19 du 29/12/2025/CM/UMOA fixant le taux de l'usure (Cotonou), art. 2 : 14 % l'an pour les banques ; « pour les établissements financiers de crédit, les institutions de microfinance ainsi que les autres agents économiques, il est fixé à vingt-quatre pour cent (24 %) l'an ». Art. 4 : abroge les dispositions antérieures, **entre en vigueur le 1er juin 2026**. Vise la loi uniforme portant définition et répression de l'usure (art. 1).
- Avis BCEAO n° 007-12-2025 du 31/12/2025 aux établissements de crédit et aux IMF : mêmes taux, même date d'effet.
- Antérieur : décision CM/UMOA/011/06/2013 du 28/06/2013, en vigueur le 01/01/2014 (24 % pour les SFD, page BCEAO « taux d'usure des opérations de crédit des SFD »). Pour les SFD, le plafond est donc **inchangé depuis 2014** (un article de presse parlait d'une baisse 27 % à 24 % : non étayé, ignorer).
- Liens : <https://www.bceao.int/sites/default/files/2026-01/Decision-No19-du-29-12-2025_CMUMOA_fixant_le_taux_de_l-usure.pdf> ; <https://www.bceao.int/sites/default/files/2026-01/Avis-No007122025%20du%2031%20d%C3%A9cembre%202025.pdf> ; <https://www.bceao.int/fr/documents/taux-dusure-pour-les-operations-de-credit-des-sfd-dans-la-zone-umoa>.
- Certitude : **A** (textes lus).

**Calcul du TEG** (source : BCEAO, Guide d'utilisation du modèle-type de maquette de calcul du TEG, DSF-001/2015 du 13/08/2015, qui cite le décret TEG annexé à la loi uniforme sur l'usure adoptée le 28/06/2013 ; lien : <https://microfinance.tresor.gouv.ci/micro/wp-content/uploads/2018/05/PJ-GUIDE-DUTILISATION-DE-LA-MAQUETTE-CALCUL-TEG.pdf>). Certitude : **A** pour la méthode ; le décret lui-même (numéro) n'a pas été lu.
- Art. 1 du décret : TEG calculé sur base **annuelle**, taux **proportionnel** au taux de période i (i × nombre de périodes par an, ex. ×12 pour un prêt mensuel).
- Art. 3 : i est **actuariel** (intérêts composés) : somme des flux actualisés des tranches prêtées = somme des remboursements et charges actualisés, selon la périodicité réelle des versements.
- **Inclus** : capital, intérêts, frais et rémunérations de toute nature (frais de dossier, **assurance**, coût des garanties).
- **Exclus** : impôts et taxes ; frais dus pour inexécution des obligations (pénalités) ; frais de transfert de fonds et de tenue de compte de prélèvement, s'ils ne sont pas anormalement élevés.
- Tout paiement à date donnée doit être enregistré ; la série des Rk' est fixée par l'établissement.
- Un prêt est usuraire si son TEG dépasse le plafond (loi uniforme, art. 1). Sanctions : Commission Bancaire, jusqu'au retrait d'agrément dans les cas graves (source secondaire, B).

**Information de l'emprunteur.** Nouvelle loi, art. 90-91 (A) : transparence de la tarification, informations « claires, exactes, suffisantes et en temps opportun » sur tarification, conditions et risques, éviter le surendettement ; modalités précisées par la Banque Centrale. Le contenu précis du tableau d'amortissement et du TEG affiché relève de textes de protection du consommateur / transparence tarifaire BCEAO **non lus** (C). Le TEG écrit dans le contrat est exigé (source secondaire sénégalaise, B).

**Impose au logiciel.** Plafond TEG paramétrable avec **historique daté** (24 % jusqu'au 31/05/2026 et à partir du 01/06/2026, par catégorie d'institution) ; calcul actuariel du TEG par résolution numérique sur le vrai échéancier (périodicités hebdo/mensuelle, déblocages en plusieurs tranches, différé) ; paramètres d'inclusion par type de frais (assurance, dossier, garantie, pénalités exclues) ; **blocage à l'octroi** si TEG > plafond ; TEG et tableau d'amortissement imprimés dans le contrat ; recalcul après rééchelonnement.

---

## 2. Créances en souffrance : classement, provisions, perte, restructuration

**Source principale** : Référentiel comptable spécifique des SFD de l'UMOA (Instruction BCEAO n° 025-02-2009 et n° 026-02-2009 sur le plan de comptes), pages 63-66 du référentiel, comptes 29x et 299 (lien : <https://cb-umoa.org/sites/default/files/2022-05/R%C3%A9f%C3%A9rentiel%20comptable%20sp%C3%A9cifique%20des%20SFD_1.pdf>). Lu par OCR sur les pages concernées : certitude **A-** (chiffres à reconfirmer sur l'original papier, voir liste juriste).

**Classement** (compte 29 « crédits en souffrance et immobilisés », rubrique « Contenu »)
- Entrent en souffrance **tous les crédits dont au moins une échéance est impayée** ; **la totalité de l'encours (échu ou non) est déclassée**.
- Le déclassement est **facultatif si l'impayé dure 0 à 3 mois au plus** ; obligatoire au-delà de 3 mois.
- Tranches comptables : 292 = impayé de 6 mois au plus (dont sous-tranche 0-3 mois, 3-6 mois) ; 293 = plus de 6 à 12 mois ; 294 = plus de 12 à 24 mois.
- **291 Crédits immobilisés** : crédits en souffrance redevenus sains après remboursement des retards ; crédits **rééchelonnés** ; crédits sous concordat préventif ou de redressement dont les termes sont respectés.
- Les termes « impayés / douteux / litigieux » ne figurent pas dans le référentiel SFD ; le classement SFD est par **ancienneté de l'impayé** (la trilogie douteux/litigieux appartient au dispositif bancaire, ex. instruction CB-UMOA n° 026-11-2016, non transposée telle quelle aux SFD : B).
- Les intérêts **cessent d'être comptabilisés** dès le déclassement (suivi extra-comptable) ; en cas de régularisation, les intérêts perçus sont repris en produits exceptionnels.

**Provisionnement** (compte 299)
- Base : **solde restant dû = encours − dépôts constitués en garantie auprès du SFD par le débiteur et/ou sa caution**.
- Impayé 0-3 mois : facultatif. Impayé **6 mois au plus** (2991) : **40 %** ; **plus de 6 à 12 mois** (2992) : **80 %** ; **plus de 12 à 24 mois** (2993) : **100 %**. (Les provisions sont des minimums ; la tranche 3-6 mois est dans 2991 à 40 %.)

**Passage en perte.** Les créances sont maintenues à l'actif jusqu'à **24 mois** à compter de la première échéance impayée ; au-delà elles sont **irrécouvrables** et passées en charges (compte 669, 6691). Avant 24 mois, sans espoir de recouvrement, provision à 100 % et déclassement en charges possibles. Crédit passé en perte sans provision : débit 669.

**Restructuration / rééchelonnement.** Le crédit rééchelonné va en 291 (immobilisé). Dispositif COVID : Avis BCEAO n° 008-04-2020 du 27/04/2020 (report de 3 mois renouvelable une fois, sans intérêt ni frais ni pénalité supplémentaire ; crédits sains ou immobilisés uniquement, **pas les crédits en souffrance** ; logés en comptes dédiés 2919x « COVID-19 », sans reclassement automatique en fin de report ; nouveau tableau d'amortissement obligatoire ; assurance non concernée ; reporting spécifique) ; guide ADA mai 2020 (<https://adaimpact.lu/sites/default/files/inline-files/guide-du-report-d-echeances-au-sein-des-imf-umoa-mai-2020.pdf>), B. Le **traitement d'un plan d'étalement ordinaire** (conditions d'éligibilité, délai avant retour en sain, provision pendant la période) n'a **pas été trouvé** dans un texte : C.

**Reporting associé.** État DIMF 2010 « Etat des crédits en souffrance » (annuel) : par nature d'opération et tranche (≤3 mois, >3 à ≤6, >6 à ≤12, >12 à ≤24), encours brut, garanties, solde restant dû, provisions, net. Indicateur de santé (chiffres clés BCEAO) : taux brut de dégradation du portefeuille, norme max 3 % ; 9,8 % à fin mars 2025 (B, <https://www.cb-umoa.org/sites/default/files/2025-01/Annexe%20%C3%A0%20la%20Convention%20r%C3%A9gissant%20la%20Commission%20Bancaire.pdf> non lu ; chiffre issu de la recherche sur les chiffres clés, à reconfirmer).

**Impose au logiciel.** Âge de l'impayé calculé sur l'échéance impayée la plus ancienne ; déclassement de **tout l'encours** ; 4 tranches paramétrables avec taux de provision paramétrables (40/80/100) ; déduction des dépôts de garantie du débiteur et de sa caution ; arrêt de l'accrual d'intérêts au déclassement ; seuil de 24 mois pour la perte ; statut « immobilisé/rééchelonné » avec nouvel échéancier ; traçabilité des écritures sur les comptes 29x/299/664/764/669 ; états DIMF 2010.

**Attention nouvelle loi.** La nouvelle loi ne contient pas ces taux ; le référentiel reste applicable (art. 171) tant qu'il n'est pas abrogé. Une instruction BCEAO d'application pourrait les remplacer : veille nécessaire.

---

## 3. Normes prudentielles et reporting

**Texte** : Instruction BCEAO n° 010-08-2010 du 30/08/2010 relative aux règles prudentielles applicables aux SFD (entrée en vigueur le 30/08/2010), prise sur la loi SFD 2007 (art. 6, 35, 85, 115, 123, 124, 147). Lue en entier par OCR : **A-**. Lien : <https://cb-umoa.org/sites/default/files/2022-01/INSTRUCTION%20N%C2%B0010-08-2010%20RELATIVE%20AUX%20R%C3%88GLES%20PRUDENTIELLES%20APPLICABLES%20AUX%20SFD%20DES%20ETATS%20MEMBRES%20DE%20L%27UMOA.pdf>.

| Norme (annexe) | Formule | Seuil |
|---|---|---|
| I. Limitation des risques | risques portés (crédits nets de provisions et de dépôts de garantie, souffrance, titres, engagements par signature, avoirs chez les institutions financières) / ressources (dépôts, emprunts, fonds propres) | **≤ 200 %** |
| II. Couverture des emplois MLT par ressources stables | ressources stables (fonds propres, ressources > 12 mois) / emplois MLT nets (crédits MT et LT, souffrance nette, immobilisations, participations) | **≥ 100 %** |
| III. Prêts aux dirigeants, au personnel et personnes liées | prêts et engagements par signature à ces personnes / fonds propres | **≤ 10 %** |
| IV. Risque sur une seule signature | encours + engagements sur un même bénéficiaire (groupe de contrôle compris) / fonds propres | **≤ 10 %** |
| V. Liquidité | valeurs réalisables et disponibles ≤ 3 mois / passif exigible ≤ 3 mois | **≥ 100 %** (mutualistes non affiliés et autres SFD collectant des dépôts) ; **≥ 80 %** (mutualistes affiliées) ; **≥ 60 %** (SFD sans collecte de dépôts) |
| VI. Opérations autres qu'épargne-crédit | montant consacré / risques portés | **≤ 5 %** |
| VII. Réserve générale | prélèvement annuel sur excédents nets avant ristourne ou dividendes (après report déficitaire) | **≥ 15 %** de dotation annuelle |
| VIII. Capitalisation | fonds propres / total actif net | **≥ 15 %** (l'OCR donne « -15 % minimum » : à reconfirmer) ; délai de 2 ans pour les SFD existants |
| IX. Participations | titres de participation (hors établissements de crédit et SFD) / fonds propres | **≤ 25 %** |

Les fonds propres (dénominateur) = subventions d'investissement, fonds affectés, fonds de crédit, provisions pour risques, FRFG, primes, réserves, écarts de réévaluation, capital, report positif, résultat, **moins** capital non appelé, immobilisations incorporelles, report/résultat négatif, **compléments de provisions exigés non constitués**, participations croisées.

**Périodicité** (annexe, art. 3-4) : calcul sur états arrêtés au 31/12, transmis en 3 exemplaires au Ministre des Finances, à la BCEAO et à la Commission Bancaire sous **6 mois** ; données **mensuelles** transmises sous 1 mois après la fin du mois ; **trimestrielles** sous 1 mois après la fin du trimestre. Le tableau de périodicité, lu par OCR, est ambigu : pour les **SFD de l'article 44**, la plupart des ratios sont mensuels (limitation des risques, capitalisation, prêts aux dirigeants, une signature, liquidité) et les autres trimestriels ; pour les **autres SFD**, tout est trimestriel sauf la liquidité mensuelle pour ceux qui collectent des dépôts. Affectation exacte ratio par ratio : **C**. Support : électronique obligatoire pour l'article 44 ; papier toléré pour les autres ; état signé par une personne habilitée.

**Indicateurs périodiques** : Instruction BCEAO n° 020-12-2010 du 29/12/2010 (en vigueur 01/01/2011), lue : **A-**. Art. 2-3 : SFD article 44 = **mensuel**, dans les **30 jours calendaires** après la fin du mois ; autres SFD = **trimestriel**, 30 jours après la fin du trimestre ; support électronique pour l'article 44 ; pénalités art. 73 de la loi. Contenu (annexe) : tableaux de nombre de membres/clients (H/F/personnes morales/groupements), effectifs et organes (CA, conseil de surveillance, **comité de crédit**), déposants, **nombre de crédits en cours** (par sexe et personnes morales), **répartition des crédits par objet** (immobilier, équipement, consommation, trésorerie, autres), **nombre de crédits en souffrance**, indicateurs de surveillance (réseaux). Lien : <https://cb-umoa.org/sites/default/files/2022-01/INSTRUCTION%20N%C2%B0020-12-2010%20RELATIVES%20AUX%20INDICATEURS%20P%C3%89RIODIQUES%20%C3%80%20TRANSMETTRE%20PAR%20LES%20SFD%20AU%20MINISTRE%20EN%20CHARGE%20DES%20FINANCES%2C%20%C3%80%20LA%20BCEAO%20ET%20%C3%80%20LA%20COMMISSION%20BANCAIRE%20DE%20L%27UMOA.pdf>.

**États financiers** (référentiel comptable) : DIMF 2000 bilan, 2005 tableau emplois-ressources, **2010 crédits en souffrance**, 2011 informations annexes, **2012 dix plus gros débiteurs**, **2013 prêts aux dirigeants, personnel et liés**, 2014 ressources affectées et crédits sur ressources affectées, 2015 valeurs immobilisées, 2016 affectation du résultat, 2080 compte de résultat/SIG. Périodicité annuelle, en FCFA, remis par le SFD. Autres instructions : n° 030-02-2009 et n° 001-02-2018 (établissement, conservation et publication des états), n° 018-12-2010 (rapport annuel), n° 006-06-2010 (commissariat aux comptes), n° 021-12-2010 (version allégée du référentiel). Format de fichier d'échange (XML, Excel) : **non trouvé** (C).

**Impose au logiciel.** Moteur de ratios avec codes de postes du plan de comptes (A12, B2D, B30, B40, B70…), périodicité et catégorie d'institution paramétrables, simulation avant octroi pour les plafonds par signature (10 % des fonds propres) et parties liées, alerte de dépassement, états DIMF 2010/2012/2013 et indicateurs 020-12-2010 générés, export électronique.

---

## 4. Contrôle interne

**Texte** : Instruction BCEAO n° 017-12-2010 du 29/12/2010 (en vigueur 01/01/2011) relative à l'organisation du contrôle interne des SFD, prise sur les art. 37 à 42 de la loi SFD. Lue en entier par OCR : **A-**. Lien : <https://cb-umoa.org/sites/default/files/2022-01/INSTRUCTION%20N%C2%B0017-12-2010%20RELATIVE%20%C3%80%20L%27ORGANISATION%20DU%20CONTR%C3%94LE%20INTERNE%20AU%20SEIN%20DES%20SFD_0.pdf>.
- **Séparation des tâches** (annexe I.1) : le Conseil d'administration veille à la séparation des tâches incompatibles : manipulation des valeurs, enregistrement, autorisation des opérations, vérification, inspection.
- **Limites** : limites globales par risque quantifiable fixées par le CA, déclinées en limites opérationnelles par la direction.
- **Fonction de contrôle** indépendante, rattachée au Conseil de surveillance (mutualistes) ou au CA ; comité d'audit pour les SFD sous forme de société.
- **Piste d'audit** (annexe II.2.2) : reconstituer les opérations chronologiquement ; justifier toute information par une pièce d'origine, cheminement ininterrompu jusqu'au document de synthèse et inversement ; expliquer l'évolution des soldes. **Conservation : au moins 10 ans.**
- **Rapprochement trimestriel** entre inventaire comptable et extra-comptable du portefeuille ; écart corrigé sous 30 jours.
- Rapports de contrôle interne : copie à l'autorité sous 30 jours ; rapport global dans les 6 mois après la fin de l'année ; non modifiable par les dirigeants mis en cause.
- Répertoire des personnes apparentées aux dirigeants et au personnel.
- Gouvernance : plan d'affaires, gestion des risques de crédit et hors-bilan, suivi budgétaire, reporting aux autorités, dispositif LBC/FT.
- **Comité de crédit** : cité comme organe à déclarer (indicateurs 020-12-2010) mais l'instruction ne fixe pas de règles de fonctionnement détaillées ; la nouvelle loi (art. 52-53) renvoie à des textes de la Banque Centrale (C pour les règles détaillées).
- Autres : limite des prêts aux parties liées, approbation par l'organe délibérant à la majorité qualifiée (nouvelle loi, art. 67).

**Impose au logiciel.** Journal d'audit infalsifiable conservé 10 ans minimum (qui, quoi, quand, pièce justificative), droits séparant saisie / validation / décaissement, délégations et plafonds d'approbation par niveau, comité de crédit tracé avec décision et quorum, rapprochement trimestriel portefeuille comptable / extra-comptable, interdiction de modifier un constat de contrôle.

---

## 5. Centrale des risques / BIC

Éléments établis (B, sources secondaires et notes BCEAO) :
- Cadre : **loi uniforme n° 2014-02 du 06/01/2014** portant réglementation des bureaux d'information sur le crédit (BIC) dans les États de l'UMOA ; art. 53 modifié (cinquième alinéa : le consentement préalable ne s'applique pas aux crédits antérieurs au 07/01/2014), loi sénégalaise n° 2018-11 du 30/03/2018.
- Le consentement préalable du client est la règle : Instruction BCEAO n° 002-01-2015 du 13/01/2015 sur les modalités d'obtention du consentement par les fournisseurs de données (B, titre non relu).
- Instruction n° 001-01-2015 (dossier d'agrément d'un BIC), instruction n° 009-06-2015 (sécurité des systèmes d'information des BIC).
- BIC agréé pour la zone : Creditinfo (agréé en 2016) ; données hébergées dans un État de l'UMOA ; modèle de collecte indirecte via la BCEAO (note d'information n° 4, 2017). Les SFD sont fournisseurs de données et utilisateurs.
- Chapitre 3 du recueil BCEAO « réglementation relative au système de partage d'information sur le crédit » : <https://www.bceao.int/sites/default/files/2017-11/ch3chapitre_3_-_reglementation_relative_au_systeme_de_partage_d_information_sur_le_credit.pdf> (PDF non lisible dans cette séance, fichier téléchargé localement non exploité).
- **Non trouvé** : obligation légale de consultation du BIC avant octroi pour un SFD, périodicité de déclaration, format des fichiers, seuil minimal de crédit déclaré (C). La nouvelle loi microfinance ne contient pas de disposition BIC dans les articles lus.

**Impose au logiciel.** Capture et conservation de la preuve du consentement ; module de déclaration (fichier périodique, rejets, rapprochement) et de consultation avant décision, avec le résultat joint au dossier ; paramétrage « consultation obligatoire » par pays et par produit, car l'obligation exacte n'est pas confirmée.

---

## 6. PI-SPI (BCEAO)

Éléments établis :
- **Mise en service : 30/09/2025**, disponible 24 h/24, 7 j/7 (communiqué BCEAO, A). Pilotes en juillet-août 2024 (B).
- Communiqué BCEAO du **02/04/2026** : 80 participants connectés (59 banques, 9 établissements de monnaie électronique, **11 IMF**, 1 établissement de paiement), 42 autres en test en production ; les établissements concernés, dont les **IMF supervisées par la Commission Bancaire**, doivent finir leur préparation et servir leurs clients « au plus tard le **30 juin 2026** » (A). Lien : <https://www.bceao.int/fr/communique-presse/connexion-la-plateforme-interoperable-du-systeme-de-paiement-instantane-pi-spi-de>.
- Source secondaire (octobre 2026) : 175 structures connectées au 30/09/2026 (B). À partir du **02/11/2026**, les transactions interopérables de monnaie électronique dans l'UMOA doivent passer par PI-SPI (B).
- Commentaire d'un consultant (avril 2026) : un SFD doit produire des états financiers conformes au référentiel SFD avant agrément à PI-SPI ; environ 2 mois pour LBC/FT et gouvernance, 1 mois de tests : estimation non officielle (B) ; lien : <https://www.financialafrik.com/2026/04/15/pi-spi-uemoa-pourquoi-les-sfd-restent-a-quai/> (page non lue, limite d'usage atteinte).
- **Non vérifié** : texte réglementaire (instruction/décision) régissant PI-SPI, API et formats (ISO 20022), alias, QR, demande de paiement, plafonds et tarifs, participation indirecte, usages précis pour décaisser et encaisser un prêt (C). Hypothèse de conception (non sourcée) : décaissement par virement instantané vers l'alias ou le compte du client ; remboursement par demande de paiement ou paiement initié par le client.

**Impose au logiciel.** Port d'intégration de paiement abstrait (décaissement, encaissement, réconciliation, statut), identifiant de transaction idempotent, rapprochement automatique des remboursements, modèle de données prêt pour des alias.

---

## 7. Données personnelles (non terminé : Togo, Sénégal, Côte d'Ivoire, Bénin)

Établi (B, sources secondaires) :
- **Togo** : loi n° 2019-014 du 29/10/2019 (une source donne le 23/10/2019, date à vérifier) ; autorité **IPDCP**, opérationnelle depuis mars 2025 ; transferts vers l'étranger soumis à autorisation ; l'État vise à imposer le stockage des données des Togolais **au Togo** (intention annoncée en janvier 2026, pas d'obligation décrite comme en vigueur) ; <https://fr.allafrica.com/stories/202601310167.html>.
- **Sénégal** : loi n° 2008-12 du 25/01/2008, autorité **CDP**, déclaration préalable des traitements (B).
- **Côte d'Ivoire** : loi n° 2013-450 du 19/06/2013, autorité **ARTCI** (numéro non confirmé par les résultats, mais connu : C+).
- **Bénin** : loi n° 2009-09 sur la protection des données (référence principale) et Code du numérique (2017, modifié) : à clarifier (C).
- Nouvelle loi microfinance, art. 50 et 92 : secret professionnel et confidentialité des données personnelles pendant et après la relation (A).
- **Non trouvé** : exigences d'hébergement local par pays, régime de la géolocalisation d'agents et de clients. Principe général à retenir (C) : consentement explicite et finalité pour la géolocalisation, minimisation, durée de conservation ; la conservation de 10 ans de la piste d'audit comptable prime sur l'effacement.

**Impose au logiciel.** Consentement horodaté par finalité (BIC, géolocalisation, marketing), hébergement paramétrable par pays, journal d'accès aux données, masquage, droits d'accès et de rectification, géolocalisation désactivable.

---

## 8. LBC/FT et KYC (non terminé)

Établi (B) :
- Loi uniforme LBC/FT/FP adoptée par le Conseil des ministres de l'UMOA le **31/03/2023** (à transposer par chaque État ; Sénégal loi 2024-08 ; Côte d'Ivoire ordonnance n° 2023-875).
- Seuil de déclaration à la CENTIF des transactions en espèces : **15 000 000 FCFA** (art. 72 de la loi uniforme selon une source secondaire) ; **Décision n° 021 du 21/12/2023/CM/UMOA** fixe les seuils (montants à vérifier).
- Instructions BCEAO du **18/03/2025** : n° 001-03-2025 (modalités de mise en œuvre des obligations LBC), n° 003-03-2025 (identification, vérification d'identité, connaissance de la clientèle), et une troisième sur le contrôle interne (<https://www.cb-umoa.org/sites/default/files/2025-08/Instruction%20n%C2%B0003-03-2025%20du%2018%20mars%2025relative%20%C3%A0%20l%27identification-%20la%20v%C3%A9rification%20de%20l%27identit%C3%A9%20et%20la%20connaissance%20de%20la%20client%C3%A8le%20par%20les%20IF.pdf>). Elles visent les institutions financières, dont les IMF. Vigilance renforcée pour les PPE. **Contenu détaillé non lu** (C).
- Nouvelle loi microfinance : interdiction des comptes anonymes (art. 9), bénéficiaire effectif défini par renvoi à la loi LBC, dispositif LBC/FT comme élément du contrôle interne.

**Impose au logiciel.** Fiche KYC avec pièces et vérification d'identité, bénéficiaire effectif pour les personnes morales, marquage PPE et notation de risque, filtrage de listes, seuils de déclaration paramétrables, flux de déclaration de soupçon, conservation des pièces (durée à confirmer, souvent 10 ans).

---

## 9. Marché des logiciels (non traité, à faire)

Traitement **partiel** (deux recherches, sources surtout commerciales : certitude C). Le tableau de 5 à 8 logiciels demandé n'a pas pu être établi de façon fiable.

Éléments relevés :
- **Mifos / Apache Fineract** : plateforme open source (Mifos a donné MifosX à la fondation Apache en 2015) ; composants externes : interfaces, PaymentsHub, rapports ; applications de terrain pour agents mentionnées, mode hors ligne non confirmé. Cité pour des SFD au Burkina Faso (blog d'intégrateur, source intéressée). Source : <https://mifos.org/directory-listing/musoni-services>, <https://digitalpublicgoods.net/registry/mifos-community-app.html>.
- **Musoni** : système commercial basé sur Mifos X ; empreinte limitée en Afrique de l'Ouest (Bénin cité). Même source.
- **Loan Performer** : logiciel de bureau hors ligne, cité pour le Bénin (jisort.com, blog, C).
- **Perfect Vision** et « éditeurs régionaux de systèmes bancaires pour SFD » : licence 15 à 60 millions FCFA + maintenance 15 à 20 % par an ; Mifos avec application hors ligne et rapports BCEAO : 25 à 45 millions FCFA (blog Kolonell, estimations d'un intégrateur, non vérifiables) : <https://kolonell.com/fr/blog/logiciel-microfinance-imf-conformite-bceao-prix-2026>.
- **Capital Banking Solution** : éditeur de logiciels bancaires intégrés en Afrique de l'Ouest (auto-présentation) : <https://www.financialafrik.com/2023/12/19/interview-avec-alain-klat-head-of-sales-and-marketing-du-group-de-capital-banking-solution/page/2/>.
- **Évaluation de conformité des SIG des SFD de l'UEMOA** (Fonds d'équipement / Findevgateway, 2010, rapport de 75 pages non lu) : cinq éditeurs évalués, dont le seul logiciel open source ; quatre ont atteint 100 % de conformité au « SIG idéal » après accompagnement ; noms et scores non lus : <https://www.findevgateway.org/fr/etude-de-cas/2013/07/evaluation-de-conformite-des-systemes-dinformation-de-gestion-sig-des-systemes>. Document ancien : à rafraîchir.
- **Guide ADA sur la négociation d'un contrat de SIG en nuage** (mai 2022) : <https://adaimpact.lu/sites/default/files/2022-05/METHODE%20R%C3%A9ussir%20sa%20n%C3%A9gociation%20de%20contrat%20SIG%20CLOUD.pdf> (non lu) ; utile pour le déploiement site/nuage.
- **Intégration à un cœur existant** : modèle courant décrit par des intégrateurs : connexion par API, passerelles de paiement, bureaux de crédit, KYC. Formats d'échange avec les cœurs de SFD : **non trouvés** (hypothèse non sourcée : fichiers plats CSV/Excel et API REST ; à valider avec l'organisation cliente et les éditeurs).
- Non retrouvés dans les résultats : Delta, Sanu, Temenos, Cobanking, Hexabank (noms pressentis, aucune confirmation).

**À faire** : consulter le rapport d'évaluation des SIG (noms des éditeurs), la fiche du marché BCEAO « logiciel de gestion pour les CTI pilotes » (attributaire non lu : <https://www.bceao.int/sites/default/files/2025-11/DSMP0281J25-P-Z1-HA0-008-Publication-avis-attribution-de-march%C3%A9s-fourniture-logiciel-de-gestion-pour-les-CTI-pilotes.pdf>), et les sites des éditeurs pour API et déploiement.

---

## Impact sur le PRD

| Exigence | Texte | Paramètre logiciel | Certitude |
|---|---|---|---|
| Plafond d'usure 24 % IMF dès le 01/06/2026 | Décision n° 19 du 29/12/2025/CM/UMOA art. 2 et 4 ; Avis BCEAO n° 007-12-2025 | table `plafond_teg` datée, par catégorie d'institution ; blocage à l'octroi si TEG > plafond | A |
| TEG actuariel annuel proportionnel, assurance et frais inclus, pénalités exclues | Décret TEG annexé à la loi uniforme sur l'usure (28/06/2013) ; Guide BCEAO DSF-001/2015 | calcul par résolution numérique ; drapeau « inclus dans le TEG » par type de frais | A |
| Information de l'emprunteur : tarification claire, tableau d'amortissement | Nouvelle loi microfinance art. 90-91 | gabarits de contrat avec TEG et échéancier | B |
| Déclassement dès une échéance impayée, tout l'encours | Référentiel comptable SFD, compte 29 | `jours_impayé` sur l'échéance la plus ancienne ; bascule de tout l'encours | A- |
| Déclassement facultatif de 0 à 3 mois | idem | option par institution (`declassement_avant_90j`) | A- |
| Provisions 40 / 80 / 100 % sur le solde net des dépôts de garantie | Référentiel, comptes 2991-2993 | taux par tranche paramétrables ; base = encours − garanties déposées | A- |
| Perte après 24 mois d'impayé | Référentiel, compte 29 (commentaires) | `seuil_perte_mois = 24` ; compte 669 | A- |
| Rééchelonné = crédit immobilisé (291) | Référentiel ; Avis 008-04-2020 (COVID) | statut `immobilisé`, nouvel échéancier ; règle de retour en sain à confirmer | B / C |
| Arrêt de l'accrual d'intérêts en souffrance | Référentiel, compte 29 | `accrual_actif = faux` après déclassement | A- |
| Ratios prudentiels (risques ≤ 200 %, couverture MLT ≥ 100 %, dirigeants ≤ 10 %, signature ≤ 10 %, liquidité ≥ 100/80/60 %, autres opérations ≤ 5 %, capitalisation ≥ 15 %, participations ≤ 25 %) | Instruction n° 010-08-2010, annexes I à IX | moteur de ratios paramétrable par catégorie et période ; simulation avant octroi | A- (capitalisation à reconfirmer) |
| Périodicité mensuelle ou trimestrielle selon la catégorie | Instruction n° 010-08-2010 ; n° 020-12-2010 art. 2-3 | calendrier de reporting par catégorie ; délai 30 jours | A- |
| Indicateurs périodiques (clients, crédits en cours, par objet, en souffrance) | Instruction n° 020-12-2010, annexe | tableaux 1 à 7 générés, export électronique | A- |
| États DIMF 2010, 2012, 2013 | Référentiel comptable, documents de synthèse | générateurs d'états annuels | A- |
| Séparation des tâches, limites, délégations | Instruction n° 017-12-2010, annexe I | rôles et plafonds d'approbation | A- |
| Piste d'audit et conservation 10 ans | Instruction n° 017-12-2010, annexe II.2.2 | journal infalsifiable, rétention ≥ 10 ans | A- |
| Rapprochement trimestriel portefeuille comptable / extra-comptable | Instruction n° 017-12-2010, annexe II.2.1 | contrôle automatique, écart résolu sous 30 jours | A- |
| Prêts aux parties liées approuvés par l'organe délibérant | Nouvelle loi art. 67 ; Instruction n° 010-08-2010 annexe III | circuit d'approbation spécial, plafond | A / A- |
| Déclaration au BIC et consentement | Loi uniforme n° 2014-02 ; Instruction n° 002-01-2015 | module BIC, preuve de consentement | B |
| Participation à PI-SPI | Communiqué BCEAO du 02/04/2026 | port de paiement instantané, rapprochement | B |
| KYC, PPE, bénéficiaire effectif, seuils CENTIF | Loi uniforme LBC/FT/FP (31/03/2023) ; Instructions du 18/03/2025 ; Décision n° 021/2023 | fiche KYC, notation de risque, seuils paramétrables | B / C |
| Protection des données et géolocalisation | Lois nationales ; nouvelle loi art. 50 et 92 | consentement par finalité, hébergement par pays | B / C |
| Catégorie « article 44 » remplacée par un seuil BCEAO | Nouvelle loi microfinance art. 70 ; art. 171 et 173 | paramètre `categorie_supervision` | A (texte) / C (calendrier pays) |

## À faire vérifier par un juriste

1. **Statut de la nouvelle loi uniforme microfinance par pays** (Togo, Sénégal, Côte d'Ivoire, Bénin, Burkina…) : date d'entrée en vigueur nationale, fin du délai de 12 mois, instructions d'application qui remplaceraient la 010-08-2010, la 017-12-2010, la 020-12-2010 et le référentiel comptable (provisions 40/80/100 %, seuil de 24 mois).
2. **Provisions et classement** : relire les pages 63-66 du référentiel sur le texte original (lecture par OCR), confirmer la tranche 3-6 mois, le caractère minimal des taux, la règle de retour en sain d'un crédit rééchelonné en dehors du dispositif COVID, et le traitement d'un plan d'étalement ordinaire.
3. **Plafond de capitalisation** (« 15 % minimum » lu avec un signe parasite) et **affectation mensuelle/trimestrielle ratio par ratio** dans l'annexe de périodicité de l'instruction 010-08-2010 ; seuil BCEAO remplaçant l'article 44.
4. **TEG** : lire le décret TEG lui-même (numéro, article 1 à 4) et les textes de transparence tarifaire BCEAO sur l'affichage du TEG et du tableau d'amortissement ; confirmer l'exclusion des frais de tenue de compte et le traitement de l'assurance obligatoire.
5. **BIC** : obligation de consultation avant octroi pour une IMF, périodicité et format de déclaration, seuil, texte exact (loi 2014-02, instructions 001 et 002-01-2015, 009-06-2015).
6. **PI-SPI** : texte réglementaire d'adhésion pour les IMF, conditions, rôle d'un participant indirect, responsabilité sur les paiements instantanés irrévocables.
7. **LBC/FT** : contenu des instructions du 18/03/2025 et de la décision n° 021 du 21/12/2023 (seuils applicables aux IMF), durées de conservation des pièces.
8. **Données personnelles** : hébergement local effectif au Togo, régime de transfert, géolocalisation des agents et clients, articulation avec la conservation de 10 ans.
9. **Marché (Q9)** : non traité ; à reprendre.
