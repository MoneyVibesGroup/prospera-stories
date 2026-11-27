# Recherche : déclaration CNSS Togo (STORY-1169) et relevés mobile money Mixx by Yas / Moov Money Flooz (STORY-1156)

Recherche web du 27/11/2026. Convention : **[Source]** = ce que dit la source citée (URL) ; **[Inférence]** = ma déduction, à valider. Aucun nom de colonne ni taux n'est inventé : tout ce qui n'est pas sourcé est signalé.

---

## Sujet 1 : la déclaration mensuelle CNSS au Togo (STORY-1169)

### 1.1 Nom, forme et périodicité

- **[Source]** Depuis décembre 2023, la déclaration s'appelle **DRC (Déclaration des Rémunérations et des Cotisations)**. Elle « permet à l'employeur d'effectuer au cours d'une soumission unique et mensuelle des appels de cotisations et les rémunérations nominatives ». On la soumet dans le module DRC des services en ligne de la CNSS. Elle se remplit soit dans une grille en ligne, soit par import d'un fichier **Excel (.xlsx)**.
  - Guide de préparation du fichier Excel, v1.0, décembre 2023 : https://cnss.tg/cnss-media/2024/01/GUIDE-EXCEL_DRC.pdf
  - Guide utilisateur du module DRC, v1.0, décembre 2023 : https://cnss.tg/cnss-media/2024/01/Guide-dutilisation-DRC-v1.pdf
- **[Source] Ancien régime, avant la DRC :**
  - un **ADC (Appel de cotisations)** mensuel, agrégé par branche ;
  - une **DNR (Déclaration Nominative des Rémunérations)** trimestrielle. Le formulaire papier « DNR1407 » prévoit trois colonnes mois (NJ + Rémunération par mois) et porte la mention « A retourner au plus tard le 15 du mois suivant le trimestre ».

  Sources : formulaire DNR https://cnss.tg/cnss-media/2018/11/DNR.pdf ; formulaire ADC https://cnss.tg/cnss-media/2018/11/appel-de-cotisation.pdf ; manuel des services en ligne 2021 (« déclaration trimestrielle de rémunérations », « déclarations mensuelles de ses cotisations ») https://cnss.tg/cnss-media/2021/04/Manuel-de-procedure-des-services-en-ligne.pdf ; FAQ 2019 (« DNR Trimestrielles ») https://cnss.tg/cnss-media/2019/03/FAQ-DES-SERVICES-EN-LIGNE.pdf.
- **[Inférence]** La DRC mensuelle remplace l'ensemble ADC + DNR. Elle est apparue avec l'AMU, effective au 1er janvier 2024. Je n'ai trouvé aucun texte réglementaire qui acte cette fusion : seulement les guides CNSS.
- **Seuil d'effectif.**
  - **[Source]** Le guide DRC dit : « Le chargement des fichiers des déclarations est principalement pour l'employ[eur] qui a plus de 20 assurés ». C'est une recommandation d'usage, pas un seuil de périodicité.
  - **[Source]** Le dépliant Recouvrement range les ADC par « type employeur » : moins de vingt salariés, plus de vingt salariés, gens de maison, assuré volontaire.
  - Aucune source trouvée ne fixe une périodicité différente selon l'effectif.
- **Portail.**
  - **[Source]** Le guide DRC 2023 donne https://compte.cnss.tg (écran « DRC - EMPLOYEUR »). L'espace assurés est https://services.cnss.tg.
  - **[Source]** Le dépliant Recouvrement indique un paiement possible par chèque, par virement, en espèces sur les comptes CNSS ou en ligne. La FAQ 2019 cite les « paiements mobile (T-money et flooz) ».

### 1.2 Format d'import Excel de la DRC (documenté officiellement)

**[Source]** https://cnss.tg/cnss-media/2024/01/GUIDE-EXCEL_DRC.pdf, page 4, « Définition des champs du fichier » (transcription fidèle) :

| Col. | Champ | Description | Requis | Format | Exemple |
|---|---|---|---|---|---|
| A | No. Mle | Numéro matricule de l'employé | Non | TEXTE | 123456 |
| B | No. Assurance | Numéro Assuré CNSS | Oui | TEXTE | 123456 |
| C | Nom | Nom de famille de l'assuré | Oui | TEXTE | ATTIKPO |
| D | Prénoms | Prénoms de l'assuré | Oui | TEXTE | ERIC |
| E | Code Type Ass. | Code type assuré (tableau 1) | Oui | NOMBRE (ENTIER) | 1 |
| F | Nbr. Jr | Nombre de jours travaillés | Oui | NOMBRE (ENTIER) | 30 |
| G | Rémunération | Rémunération déclarée pour la période soumise | Oui | NOMBRE (ENTIER) | 100000 |
| H | Nature Rémun. | Code nature de rémunération (tableau 2) | Oui | NOMBRE (ENTIER) | 1 |
| I | Date Emb. | Date d'embauche | Oui | TEXTE (AAAA-MM-JJ) | 2020-05-25 |
| J | Date Sortie | Date de sortie (requis si applicable) | Non | TEXTE (AAAA-MM-JJ) | 2022-04-15 |
| K | Code Motif Sortie | Code motif de sortie (tableau 3, requis si applicable) | Non | NOMBRE (ENTIER) | 2 |
| L | RP (2%) | Montant cotisation risques professionnels | Oui | NOMBRE | 2000 |
| M | PF (3%) | Montant cotisation prestations familiales | Oui | NOMBRE | 3000 |
| N | PV (16.5%) | Montant cotisation pensions vieillesse | Oui | NOMBRE | 16500 |
| O | AMU (10%) | Montant cotisation assurance maladie universelle | Oui | NOMBRE | 10000 |

**[Source] Tables de codes du même document :**

- **Tableau 1, Type Assuré :**
  - 1 Normal/CDI ; 2 Fonctionnaire détaché ; 3 retraite complémentaire des cadres ; 4 apprenti ;
  - 5 Temporaire/CDD ; 6 Travailleur en zone franche ; 7 assuré IPRAO ; 8 assuré caisse étrangère ;
  - 9 assuré volontaire ; 10 agent permanent de l'Etat ; 11 travailleur PROVONAT/ANPE ; 12 stagiaire ;
  - 13 travailleur exempté PVID ; 14 indépendant ; 15 Secteur informel ; 16 ministre du culte ; 17 secteur agricole.
- **Tableau 2, Nature Rémunération :**
  - 1 Ordinaire ; 2 indemnités de départ à la retraite ; 3 gratification ; 4 treizième mois ;
  - 5 rémunération service militaire ; 6 salaire de convention ; 7 prime de rendement ; 8 heures supplémentaires ;
  - 9 indemnités de licenciement ; 10 congés payés ; 11 indemnités de décès ; 12 indemnités de bonne séparation ;
  - 13 rappel de salaire ; 14 avantages en nature.
- **Tableau 3, Motif de sortie :**
  - 101 affectation ; 102 démission ; 103 licenciement ; 104 décès ; 105 invalidité ;
  - 106 rattachement CRT ; 107 chômage ; 108 retraite ;
  - 201 dépôt de bilan ; 202 liquidation ; 203 cessation d'activité ; 204 fin de contrat ;
  - 205 suspension provisoire ; 206 suspension pour absence de mouvement sur le compte.
- **[Source] Incohérence dans le guide :** l'exemple de la colonne K vaut « 2 », alors que les codes du tableau 3 sont à trois chiffres (101 à 206). Il faut le confirmer auprès du support CNSS.
- **[Inférence]** L'exemple PV = 16 500 pour une rémunération de 100 000 montre que **chaque colonne contient le total de la branche, part patronale et part salariale réunies**. Même lecture pour AMU 10 % = 10 000. Le guide ne le dit pas en toutes lettres.
- **[Inférence]** Une même personne peut avoir plusieurs lignes, une par nature de rémunération (par exemple ordinaire + 13e mois), puisque la nature est une colonne de ligne. Ce n'est pas écrit dans le guide.

**[Source] Données de la grille et de l'export (guide utilisateur DRC, captures d'écran) :**

- **En-tête de la grille :**
  - No. Employeur, Raison Sociale, Adresse, Type Employeur ;
  - Masse Salariale, Nombre Salariés, Mois, Année ;
  - un récapitulatif par branche (Masse Salariale / Nombre de Salariés) : **PFAM (3%)**, **PVID (16.5%)**, **RPRO (2%)**, **AMU (10%)**, « Cotisations Dues », « Complément AMU ».
- **Colonnes de la grille :** reprennent celles de l'Excel, plus **« NBR. COMPLÉMENT AMU »** et **« MONTANT COMPLÉMENT AMU »**.
  - Ces deux colonnes n'apparaissent pas dans la spécification d'import, et leur sens n'est documenté nulle part.
  - **[Inférence]** Il pourrait s'agir d'une cotisation pour des ayants droit supplémentaires, à confirmer.
- **Liste « Mes déclarations » :** Référence (exemple « 65354/122023/1 »), Mois, Année, Masse salariale, Total assurés, **Date échéance**, Statut (BROUILLON, SOUMISE POUR TRAITEMENT).
  - Dans les captures, la date d'échéance affichée est 16/12/2023 pour le mois 12/2023 et 16/10/2022 pour le mois 10/2022. Ce sont des données de démonstration, et l'écart avec la règle du 15 du mois suivant reste inexpliqué. Je n'en tire aucune conclusion.
- **Bouton « TÉLÉCHARGER LE FICHIER DRC » :** produit un Excel contenant numéro matricule, numéro assuré, nom, prénoms, code type assurance, nombre de jours, rémunérations, nature de rémunérations, date d'embauche, date de sortie, code motif de sortie.

**Modèles téléchargeables :**

- Spécification Excel : URL ci-dessus (PDF, 4 pages).
- **[Source]** Le fichier modèle .xlsx lui-même ne s'obtient qu'une fois connecté au portail. Je n'ai trouvé aucune URL publique du .xlsx DRC.
- Les formulaires papier publics (anciens) sont listés sur https://cnss.tg/employeurs/formulaires-employeurs/ : DNR.pdf et appel-de-cotisation.pdf.

### 1.3 Taux, assiette, échéance, majorations

**[Source] Taux CNSS (décret n° 2012-038 du 27 juin 2012, cité par la CNSS)**, salariés et personnel domestique, 21,5 % au total :

| Branche | Employeur | Salarié |
|---|---|---|
| PF, prestations familiales et maternité | 3 % | – |
| RP, risques professionnels | 2 % | – |
| PV, pensions vieillesse | 12,5 % | 4 % |

Sources :
- dépliant CNSS « Recouvrement » : https://cnss.tg/cnss-media/2019/08/DEPLIANT_RECOUVREMENT.pdf
- présentation CNSS 2023 (tableau 17,5 % + 4 % = 21,5 %) : https://cnss.tg/cnss-media/2023/03/CAISSE-NATIONALE-DE-SECURITE-SOCIALE-DU-TOGO_DEFINITIF-1.pdf
- CLEISS, taux « au 1er janvier 2026 », identiques : https://www.cleiss.fr/docs/cotisations/togo.html

La spécification Excel DRC de décembre 2023 reprend RP 2 %, PF 3 % et PV 16,5 %. **Aucune source 2024-2026 n'indique de changement** de ces taux. Un taux RP de 2 % unique (non modulé par secteur) figure dans les sources CNSS ; AfriCarrières évoque des taux AT variables, mais sans source primaire.

**AMU (Assurance Maladie Universelle) :**

- **[Source]** La CNSS affiche « effective dès le 1er janvier 2024 » sur https://cnss.tg.
- **[Source]** Le décret n° 2023-097 répartit la gestion : la CNSS pour le secteur privé, les travailleurs non salariés, l'informel et l'agricole ; l'INAM pour le secteur public. Sources : P4H et PaySpace, https://support.payspace.com/portal/en/kb/articles/togo-the-national-social-security-fund-cnss-includes-will-roll-out-universal-health-insurance-from-1-january-2024
- **[Inférence]** Pour un employeur privé, l'AMU passe par la CNSS dans la DRC (colonne O), pas par l'INAM.
- **Taux :**
  - **[Source, extrait de recherche, texte intégral non lu car le site OMS renvoyait 503]** Décret n° 2023-096/PR, art. 14 : « Le taux global de cotisation est fixé à 10 % du traitement soumis à cotisation, réparti à part égale entre l'agent et l'employeur », donc **5 % / 5 %**. Le mot « agent » laisse penser que cet article vise peut-être le secteur public. Texte : https://extranet.who.int/cpcd/sites/default/files/public_file_repository/TGO_Togo_Decret-No2023-096-PR-fixant-les-taux-montant-et-modalites-de-recourvrement-des-cotisations-sociales-et-autres-contributions-dues-au-titre-de-l_Assurance-Maladie-Universelle_2023.pdf
  - **[Source]** PaySpace donne, pour la CNSS, 10 % du salaire mensuel soumis à cotisation, avec un employeur qui paie « at least 50% » et le salarié le reste.
  - **[Source, à écarter]** AfriCarrières donne 7 % (3,5/3,5), en contradiction avec le décret et le guide CNSS.
  - **[Inférence]** Le paramétrage le plus défendable est AMU 10 %, 5 % employeur et 5 % salarié par défaut. Il faut prévoir une répartition paramétrable, puisque l'employeur peut prendre plus de 50 % selon PaySpace.

**Assiette :**

- **[Source]** Ensemble des rémunérations, y compris indemnités, primes, gratifications, commissions, avantages en espèces et contre-valeur des avantages en nature. Sont exclus les remboursements de frais et les prestations familiales (art. 12 de la loi 2011-006, cité par le dépliant Recouvrement).
- **[Source]** **Plancher = SMIG**, soit 52 500 FCFA par mois depuis le 1er janvier 2023 (présentation CNSS 2023, CLEISS 2026). Je n'ai trouvé aucun nouveau SMIG sourcé pour 2025-2026.
- **[Source]** **Aucun plafond** n'est mentionné, ni par la CNSS, ni par CLEISS, ni dans la spécification DRC.

**Échéance :**

- **[Source]** « Les cotisations d'un mois doivent être versées dans les 15 premiers jours du mois suivant » et « Les employeurs sont tenus de verser la totalité des cotisations dues tous les mois » (dépliant Recouvrement).
- **[Source, extrait de recherche]** Le décret AMU 2023-096 fixe aussi « au plus tard le 15 du mois suivant ».
- **[Inférence]** Échéance de la DRC et du paiement du mois M = le 15 du mois M+1. La règle de report en cas de jour férié ou de week-end n'est pas trouvée.

**Majorations :**

- **[Source]** « une majoration de retard de 5% est appliquée aux cotisations qui n'ont pas été acquittées à la date d'exigibilité. Cette majoration est augmentée de 1% des cotisations non acquittées par mois ou fraction de mois écoulé après l'expiration de 3 mois à compter de la date d'exigibilité » (art. 17 al. 2 et 3, dépliant Recouvrement).
- **[Source]** Mise en demeure avec un délai de 15 jours, puis contrainte (présentation 2023).
- AfriCarrières cite « 1,5 % par mois », ce qui contredit la source CNSS. À écarter.
- Je n'ai trouvé **aucune pénalité distincte pour dépôt tardif de la déclaration** (hors paiement).

---

## Sujet 2 : relevés Mixx by Yas (ex-T-Money) et Moov Money Flooz (STORY-1156)

### 2.1 Identité des opérateurs

- **[Source]** « Togocom a été rebaptisé mardi "Yas" par son propriétaire le Groupe Axian. […] son service de mobile Money TMoney, il devient "Mixx by Yas" » (26/11/2024) : https://www.republicoftogo.com/toutes-les-rubriques/eco-finance/nouvelle-marque-nouvelles-ambitions
  - L'app reste publiée par « HOLDING TOGOLAISE DES COMMUNICATIONS ELECTRONIQUES (TOGOCOM) SA », avec l'identifiant `tg.togocom.tmoney`.
- **[Source]** Moov Money « Flooz » est le service de **Moov Africa Togo** (https://moov-africa.tg/moov-money/).
- **[Source]** Parts de marché : T-Money/Mixx environ 60 %, Flooz environ 40 % (republicoftogo, 11/09/2026).
- **Attention :** la documentation tierce EasySwitch (https://alldotpy.github.io/EasySwitch/integrations/paygate) associe à tort « FLOOZ » à Mixx et « TMONEY » à Moov. C'est l'inverse : cette source n'est pas fiable.

### 2.2 Relevés ou exports obtenables (ce qui est documenté publiquement)

**Mixx by Yas :**

- **[Source]** L'app propose un « historique détaillé des paiements, transferts et autres transactions à tout moment » (App Store). **Aucune mention d'export PDF, CSV ou XLSX.**
- **[Source]** USSD sur https://yas.tg/mixx-by-yas/ :
  - *145*1# transfert ; *145*2# retrait ; *145*3# crédit ; *145*4# factures ; *145*5# paiement marchand ;
  - *145*8# selfcare (PIN, annulation de transfert erroné).
- **[Source]** Offres entreprises listées sur la même page : collecte de fonds, paiement de masse, paiement marchand / point de vente, paiement en ligne, Cash Collect. **Aucune page publique** ne décrit de portail marchand, de back-office, de relevé ou d'export.
- Contacts : 888, MixxByYas@yas.tg.

**Moov Money Flooz :**

- **[Source]** Le compte marchand exige un compte « Flooz Corporate » et un contrat d'abonnement Corporate. Le client paie via *155*2*2*[n° marchand]*[montant]*[code]#, par QR ou par NFC (https://moov-africa.tg/moov-money/marchand-moov-money-flooz/).
- **[Source]** Flooz Entreprise propose paiement de salaires, collecte de fonds (SIM dédiée délivrée à la Direction Générale), factures et cotisations sociales (https://moov-africa.tg/moov-money/flooz-entreprise/). **Rien sur les relevés, les exports ou un portail.**
- **[Source]** Il existe une app « Moov Money TG Pro » (App Store id6747836930). Une page tierce non officielle décrit des captures montrant un historique des transactions, un profil boutique et la gestion du personnel. **Aucune preuve d'un export.**

**Conclusion :** **aucun relevé réel (PDF ou export) de Mixx ou de Flooz n'est visible publiquement**, et aucune mise en page de relevé opérateur n'est documentée. Le format exact du document remis à un client marchand reste inconnu.

### 2.3 Champs documentés par des API d'agrégateurs (base d'un profil provisoire)

Ces champs décrivent des **transactions d'agrégateur**, pas un relevé opérateur. Ils servent à construire un profil provisoire marqué « à confirmer sur un relevé réel ».

**PayGate Global** (agrégateur togolais, T-Money/Mixx + Flooz) :

- **[Source officielle, page d'accueil]** https://paygateglobal.com/
  - Requête `POST https://paygateglobal.com/api/v1/pay` : `auth_token`, `phone_number`, `amount`, `identifier`, `network` (exemple « FLOOZ ») ; réponse : `tx_reference`, `status`.
  - Commissions : **Flooz 2,5 %, T-Money 3,0 %** par transaction.
  - La documentation complète est réservée à l'espace marchand.
- **[Source tierce, SDK communautaires]**
  - Callback v2 ou vérification : `tx_reference`, `identifier`, `payment_reference` (« code de référence de paiement » généré par l'opérateur), `amount`, `datetime` (exemple ISO « 2024-01-15T10:30:00Z »), `phone_number`, `payment_method` (valeurs « FLOOZ », « T-Money »).
  - Statuts : 0 succès, 2 jeton invalide, 4 paramètres invalides, 6 doublon. En vérification : SUCCESS, PENDING, EXPIRED, CANCELED.
  - Sources : https://pub.dev/packages/flutter_paygateglobal et https://github.com/Edouardsnipeur/paygate-php

**CinetPay :**

- **[Source, extrait de recherche de la doc officielle ; le site ne répondait plus]** `POST https://api-checkout.cinetpay.com/v2/payment/check`.
  - Réponse : `status` (ACCEPTED…), `payment_method`, `operator_id` (référence opérateur, exemple « MP220915.2257.A76307 »), `payment_date` (« 2022-09-15 22:57:15 »).
  - Code Flooz Togo : `FLOOZTG`. Le code exact de T-Money n'est pas confirmé.

**FedaPay :**

- **[Source officielle]** Modes `togocel` (T-Money) et `moov_tg`.
- **[Source officielle]** Objet transaction : `id`, `reference`, `amount`, `description`, `status`, `mode`, `commission`, `fees`, `fixed_commission`, `amount_transferred`, `amount_debited`, `created_at`, `approved_at`, `canceled_at`, `declined_at`, `refunded_at`, `transferred_at`, `merchant_reference`, `transaction_key`, `receipt_url`, `last_error_code`, etc.
- Source : https://docs.fedapay.com/api-reference/transactions/get-by-id

**Standard GSMA Mobile Money API 1.2.0** (générique, pas spécifique Togo) : `transactionStatus`, `amount`, `currency`, `descriptionText`, `fees`, etc. URL : https://www.gsma.com/mobilefordevelopment/wp-content/uploads/2021/10/Mobile-Money-API-Specification-1.2.0-Merchant-Payments.pdf

**[Inférence] Profil provisoire minimal** (noms de champs internes, PAS des en-têtes de relevé) :
- date et heure ;
- référence opérateur (payment_reference / operator_id) ;
- référence interne ou agrégateur ;
- type d'opération (paiement marchand, retrait, transfert, dépôt, frais) ;
- numéro contrepartie ;
- montant ;
- frais / commission ;
- solde après opération (non documenté par aucune API) ;
- statut ;
- opérateur (Mixx / Flooz).

### 2.4 Grilles tarifaires trouvées

**Flooz, retraits** (https://moov-africa.tg/moov-money/retrait-flooz/, page non datée, copyright 2022) :

| Tranche | Frais |
|---|---|
| 1 – 500 | 50 F |
| 501 – 1 000 | 75 F |
| 1 001 – 5 000 | 100 F |
| 5 001 – 15 000 | 280 F |
| 15 001 – 20 000 | 320 F |
| 20 001 – 50 000 | 600 F |
| 50 001 – 100 000 | 1 000 F |
| 100 001 – 200 000 | « Entre 3 169 et 3 356 F » |
| 200 001 – 300 000 | « Entre 3 729 et 4 195 F » |
| 300 001 – 500 000 | « Entre 4 195 et 4 381 F » |
| 500 001 – 850 000 | « Entre 4 381 et 4 568 F » |
| 850 001 – 1 000 000 | « Entre 4 568 et 5 407 F » |
| 1 000 001 – 1 500 000 | « Entre 5 407 et 8 110 F » |
| 1 500 001 – 2 000 000 | « Entre 8 110 et 9 788 F » |

Les fourchettes au-dessus de 100 000 sont telles quelles sur la page : le barème est donc non déterministe.

**Flooz, transferts nationaux :** « gratuits jusqu'au troisième transfert ». Montant au-delà non publié (https://moov-africa.tg/moov-money/transfert-flooz/).

**Mixx :** « Les 6 premiers transferts de la journée sont gratuits », puis 1 % à partir du 7e, « tarifs susceptibles de changer » (https://yas.tg/mixx-by-yas/). **Aucune grille de retrait Mixx publiée trouvée.**

**TAF :** **[Source]** Une taxe sur les activités financières (TAF) de 10 % s'applique aux commissions de retrait depuis janvier 2024 (republicoftogo, 11/09/2026). **[Inférence]** Les frais d'un relevé peuvent donc inclure une TAF, ventilée ou non, à vérifier.

**Commissions marchand via agrégateur :** PayGate Flooz 2,5 % / T-Money 3 % (officiel PayGate). Les taux « Yas Business 1,2-1,5 % » d'un blog commercial (kolonell.com) ne sont pas fiables.

---

## Ce qui suffit / ce qui manque

### STORY-1169 (déclaration CNSS) : **peut démarrer**

**Ce qui suffit :**
- format officiel d'import DRC (15 colonnes A-O, types, formats de date, 3 tables de codes) ;
- périodicité mensuelle ;
- taux PF 3 / RP 2 / PV 16,5 (12,5 employeur + 4 salarié) et AMU 10 % ;
- assiette avec plancher SMIG 52 500 et sans plafond ;
- échéance au 15 du mois suivant ;
- majorations 5 % puis +1 % par mois après 3 mois.

L'état nominatif, les totaux par branche et l'échéance sont donc constructibles.

**Ce qui manque (à obtenir d'un document réel ou du support CNSS) :**
1. le fichier modèle .xlsx réel téléchargé depuis compte.cnss.tg (nom de l'onglet, ligne d'en-tête exacte, présence ou non de lignes d'en-tête de l'employeur) ;
2. le sens et le calcul de « Complément AMU » (nombre et montant) ;
3. la répartition AMU employeur/salarié pour le privé, à lire dans le texte intégral du décret 2023-096 (art. 14-15) ;
4. le code motif de sortie attendu (l'exemple « 2 » face aux codes 101-206) ;
5. les règles d'arrondi des montants de cotisation (colonnes L-O en « NOMBRE », pas « ENTIER ») ;
6. la règle d'échéance si le 15 tombe un jour non ouvré ;
7. le SMIG en vigueur, si revalorisé après 2023.

### STORY-1156 (relevés Mixx / Flooz) : **ne peut démarrer qu'en mode provisoire**

**Ce qui suffit :**
- un profil de champs provisoire (date, référence opérateur, type, contrepartie, montant, frais, statut) fondé sur les API PayGate, CinetPay et FedaPay ;
- la grille de retrait Flooz ;
- la règle de gratuité des transferts (Flooz 3 premiers ; Mixx 6 par jour puis 1 %) ;
- la TAF de 10 % sur commissions.

Cela permet un parseur générique paramétrable et un rapprochement par référence, date et montant, marqué « à confirmer sur un relevé réel ».

**Ce qui manque (indispensable) :**
1. **un relevé réel de chaque opérateur**, idéalement un relevé marchand et un relevé particulier : format (PDF, CSV ou XLSX), libellés exacts des colonnes, format des dates et des montants, séparateurs, signe débit/crédit ;
2. la présence ou non d'une colonne **solde** et d'une ligne **frais** séparée (ou de frais inclus dans le montant) ;
3. le format de la référence de transaction de chaque opérateur ;
4. la ventilation de la TAF ;
5. la grille de retrait Mixx ;
6. le canal d'obtention du relevé (app, agence, portail marchand, e-mail), à demander au 888 / MixxByYas@yas.tg et à une agence Moov.
