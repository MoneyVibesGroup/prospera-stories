# Pratiques du métier : validation des choix par défaut du PRD Assurance (sinistres IARD)

Date : 2026-11-13. Portée : compagnie IARD en zone CIMA (Togo), Prospera branché à côté du logiciel de la compagnie (LC). La compagnie n'est jamais nommée.

## Comment lire ce document

- **SÛR** = lu dans la page citée (ou, quand c'est dit, dans l'extrait renvoyé par la recherche, la page entière n'ayant pas pu être lue).
- **PROBABLE** = pratique courante du métier ou déduction, non lue dans une source accessible ici. À faire confirmer en séance d'immersion ou par le juriste.
- **Limites de la recherche, à garder en tête.** (1) La documentation de Guidewire est en partie derrière des pages que l'outil de lecture n'a pas rendues (page des limites d'autorité : seul l'extrait de recherche est lu). (2) Duck Creek, Sapiens, Majesco/Insurity et Salesforce ne publient pas, en accès libre, les seuils ni les règles de configuration : on n'a que du marketing. Aucun seuil d'éditeur n'est donc un « standard » : les éditeurs fournissent des **mécanismes** (limites par profil, routage, états), jamais des **valeurs**, qui sont celles de chaque compagnie. (3) Aucune documentation publique d'ORASS (module sinistres) n'a été trouvée ; la présentation FANAF d'ORSYS sur les faiblesses des systèmes d'information est un PDF illisible par l'outil. (4) Le texte de la convention IDA/CID applicable au Togo, au Sénégal ou en Côte d'Ivoire n'a pas été trouvé ; on a l'IDA du Cameroun (2017) et un texte tunisien. (5) Rien de public n'a été trouvé sur le Togo en particulier.

## Sources (liste numérotée, citée dans le corps par [S n])

- [S1] Guidewire, profils de limites d'autorité (extrait de recherche) : https://docs.guidewire.com/cloud/cc/202205/cloudapibf/cloudAPI/topics/51_Framework-APIs/04_users/c_authority_limit_profiles_ClaimCenter.html
- [S2] Guidewire, aperçu des provisions : https://docs.guidewire.com/cloud/cc/202411/cloudapibf/cloudAPI/topics/112-CCFin/01-reserves/c_overview-of-reserves-in-ClaimCenter.html
- [S3] Guidewire, processus FNOL (numéro de brouillon et numéro ouvert) : https://docs.guidewire.com/cloud/is/202603/cloudapibf/cloudAPI/ClaimCenter/fnol/executing-fnol/c_the-FNOL-process-in-ClaimCenter.html
- [S4] Guidewire, cycle de vie d'un chèque après soumission : https://docs.guidewire.com/cloud/cc/202411/cloudapibf/cloudAPI/topics/112-CCFin/03-check-lifecycle/c_the-check-life-cycle-after-submission.html
- [S5] Guidewire, blog fraude (renvoi au SIU sur violation de règles ou liste de surveillance) : https://www.guidewire.com/resources/blog/technology/propertycasualty-claims-fraud-industry-maturity-model-industry-landscape-overview.md
- [S6] Shift Technology et Guidewire (score, codes de motif, onglet dans ClaimCenter) : https://www.shift-technology.com/shift-and-guidewire-for-fraud-and-subrogation
- [S7] FRISS et Guidewire (workflows déclenchés par le score) : https://www.friss.com/press/friss-and-guidewire-deliver-end-to-end-automation-of-trust
- [S8] Duck Creek Claims (rôles SIU et subrogation, autorisation par rôle, validation) : https://www.duckcreek.com/product/claims-management-software/
- [S9] Salesforce, guide de la gestion des sinistres (FNOL multicanal, score de gravité, signalement de fraude ; source tierce) : https://vantagepoint.io/blog/sf/salesforce-financial-services-cloud-for-insurance-the-complete-guide-to-policy-and-claims-management
- [S10] Salesforce Trailhead (affectation à la création du sinistre) : https://trailhead.salesforce.com/content/learn/modules/insurance-claims-foundations/meet-claims-management
- [S11] Kolonell, logiciel de gestion de sinistres IARD à Dakar (prestataire, donc affirmations commerciales) : https://kolonell.com/fr/blog/logiciel-gestion-sinistres-assurance-iard-dakar-cout-2026
- [S12] Cameroun, convention IDA signée le 11/01/2017 (plafond 500 000 FCFA, 15 jours) : https://www.camer.be/57263/11:1/cameroon-assurances-le-reglement-du-sinistre-en-15-jours-desormais-possible-au-cameroun.html
- [S13] Côte d'Ivoire, schéma de procédure d'indemnisation de la direction des assurances (extrait de recherche : constat amiable pour les dommages mineurs ; l'adresse a un certificat invalide pour l'outil) : https://assurances.tresor.gouv.ci/assur/wp-content/uploads/2025/09/DA-SCHEMA-PROCEDURE-DINDEMNISATION-1.pdf
- [S14] Un assureur du marché ivoirien, indemnisation en 90 minutes des sinistres mineurs de moins de 1 million de FCFA, photos par smartphone : https://www.fratmat.info/article/2636756/economie/sinistres-automobiles-une-compagnie-dassurance-revolutionne-lindemnisation-en-90-minutes
- [S15] FANAF/ASACI, digitalisation (extrait de recherche : paiement instantané des sinistres par Mobile Money, trophée FANAF 2026) : https://www.financialafrik.com/2026/02/15/trophees-de-lassurance-special-fanaf-2026-voici-les-6-laureats-distingues-abidjan/
- [S16] FTUSA, texte de l'IDA tunisienne (extrait de recherche : constat signé, barème de responsabilité, 30 jours) : https://ftusanet.org/userfiles/file/conventions/CONVENTION_D_INDIMNISATION_DIRECTES_IDA_.pdf
- [S17] FRISS, fraude et traitement sans intervention : https://friss.com/blog/leveraging-fraud-detection-to-safely-enable-straight-through-claims-processing
- [S18] Carpe, décision automatisée : https://carpe.io/?p=4392
- [S19] Duck Creek, fiche Celent (provisions modifiables, limites cumulées vérifiées avant sauvegarde d'un paiement) : https://www.duckcreek.com/wp-content/uploads/2024/07/Celent-PC-Claims-Systems-Vendors-in-EMEA_published2021.pdf
- [S20] ORSYS à la FANAF 2018, revue des faiblesses des SI (illisible par l'outil, non exploité) : https://fanaf.org/article_ressources/file/Etats%20Generaux%20Assurances%202018/Communication_2_Revue%20des%20faiblesses%20des%20SI_FAOUZI%20Almostafa_ORSYS.pdf

---

## 1. Numéro de sinistre : LC ou Prospera ; référence provisoire (FNOL)

**Éditeurs.** SÛR : Guidewire ClaimCenter donne **deux numéros** à un même sinistre : un numéro de **brouillon** à la première sauvegarde (base : préfixe « 999 »), puis un numéro **ouvert** quand le sinistre passe de brouillon à ouvert (préfixe « 000 ») ; l'assistant de création masque le numéro de brouillon [S3]. Salesforce : l'objet « Claim » porte le numéro ; la page ne dit pas comment il est généré [S9]. PROBABLE : les éditeurs attribuent le numéro officiel dans leur propre base ; l'attribution par un autre système est un cas d'intégration, géré par une clé externe.

**Marché CIMA.** PROBABLE : le logiciel de polices (ORASS ou autre) numérote les sinistres, le module sinistres s'y raccorde. SÛR (vendeur) : « la plupart des assureurs sénégalais disposent d'un logiciel de polices, le module de sinistres manque souvent » et se branche par API ou fichiers [S11].

**Choix du PRD.** D3, R3 : référence `DEC-AAAA-NNNNN` immédiate, donnée à l'assuré, **clé d'idempotence** envoyée au LC ; le LC renvoie le numéro officiel ; une seule voie (envoi automatique ou liste « à saisir ») ; écart si un second numéro arrive ; alerte à 1 jour ouvré sans numéro (H-032) ; capacité du LC à dédoublonner à confirmer (H-033, H-156, H-202, A-24) ; paramètre « qui attribue » (H-034) ; préfixe distinct si Prospera numérote plus tard (H-155).

**Recommandation : GARDER.** C'est le schéma brouillon puis officiel de Guidewire, renforcé par l'idempotence. Une précision à ajouter sans changer le choix : la référence `DEC-` ne se réutilise jamais, même après annulation ou rejet de la déclaration (PROBABLE, pratique de numérotation continue : un trou doit s'expliquer, pas se réattribuer).

## 2. Délégations (« authority limits »)

**Éditeurs.** SÛR : ClaimCenter définit une limite d'autorité comme « une restriction posée sur un utilisateur qui limite les types de transactions qu'il peut faire » et peut exiger l'approbation d'un utilisateur de rang supérieur ; les limites sont regroupées en **profils nommés** (exemple de la page : paiements cumulés à 15 000 USD et provisions totales à 15 000 USD) ; si les limites sont insuffisantes ou si une règle d'approbation s'applique, la transaction attend une approbation, sinon elle est approuvée automatiquement ; l'utilisateur dont on contrôle les limites est celui de la session [S1, S2]. Les limites portent donc sur le **paiement** et sur la **provision**, **par profil**, et la transaction approuvée passe par une activité d'approbation [S2]. SÛR : Duck Creek décrit une autorisation par rôle et par entité et le contrôle de l'autorité avant d'escalader un paiement ; ses notes de version citent la vérification de limites **cumulées** avant la sauvegarde d'un paiement [S8, S19]. Je n'ai pas lu de page qui dise « même utilisateur ne peut pas approuver sa propre transaction » ; c'est PROBABLE (séparation des tâches standard).

**Marché CIMA.** SÛR (vendeur) : « double validation au-delà d'un seuil, par exemple 500 000 FCFA » [S11]. Aucune matrice publique de compagnie n'a été trouvée. PROBABLE : les compagnies de la zone ont une grille à 2 ou 3 niveaux (gestionnaire, chef de service, direction technique ou générale) avec un comité au-delà d'un montant ; c'est ce que décrit le mémoire de 2014 repris par le PRD.

**Choix du PRD.** D8, R6, H-014, H-015, H-016, H-062, H-063 : ≤ 1 000 000 FCFA, validation à trois (instructeur propose, contrôleur contrôle, RESP valide) ; au-delà, comité de 4 (quorum 3, H-064, H-065) puis visa du DT ; hors garantie, DG seul ; **cumul des montants validés du dossier** décide du niveau (anti-fractionnement) ; l'instructeur ne valide pas son dossier (SEP-01), qui décide ne paie pas (SEP-02) ; écart de provision ≥ 2 000 000 attend le RESP (H-061).

**Recommandation : AJUSTER.** L'ossature (rôle, montant, nature, cumul, séparation) correspond à ce que font les éditeurs. Deux ajouts, qui n'ajoutent pas de périmètre : (a) la matrice porte des limites **distinctes pour la provision et pour le paiement** (Guidewire les sépare ; le PRD n'a qu'un seuil d'écart de provision de 2 000 000 FCFA et une matrice de paiement), avec le **cumul** compté aussi sur la provision totale du dossier ; (b) une **suppléance** datée (absence du RESP ou du DT : délégation temporaire tracée à une personne nommée, jamais « tout le monde ») pour ne pas bloquer le 1 000 000 FCFA un jour d'absence (PROBABLE). Le seuil de 1 000 000 FCFA est supérieur au 500 000 FCFA cité par le prestataire [S11] : c'est une valeur de compagnie, à confirmer (A-2) ; la valeur n'a pas à changer sans les délégations réelles.

## 3. Provision à l'ouverture et sa révision

**Éditeurs.** SÛR : « les provisions peuvent être créées automatiquement par des règles métier selon la nature du sinistre » (exemple de la page : 500 USD pour un bris de glace seul) ; elles peuvent l'être aussi à la main ou par l'API ; plusieurs mouvements se soumettent **en bloc** à l'approbation (« tout ou rien ») [S2]. SÛR : l'éditeur contrôle les limites de garantie de la police avant de poser ou d'augmenter une provision ou avant tout paiement [S1/recherche]. Pas lu : qui valide un gros changement ; c'est la limite d'autorité (point 2).

**Marché CIMA.** PROBABLE : provision d'ouverture « forfaitaire par type » (une moyenne par nature de sinistre) revue à l'expertise puis au chiffrage ; sur le corporel, estimation par le gestionnaire et le médecin-conseil. SÛR (vendeur) : le module suit les provisions et les remonte vers les états [S11].

**Choix du PRD.** D12, H-043 (grilles en tranches pour l'ouverture seulement), H-061, R11 (au corporel, pas de remise à zéro au refus tant que l'offre légale demeure), PSAP brut/cédé/net.

**Recommandation : GARDER.** Même mécanisme que l'éditeur de référence (règle par nature à l'ouverture, révision à chaque événement avec motif, approbation selon la limite). Le calcul d'ouverture reste un paramètre de la compagnie.

## 4. Voie rapide des petits sinistres

**Éditeurs.** SÛR : les fournisseurs vantent un traitement sans intervention sous un seuil de montant, avec comme conditions un risque de fraude faible, une garantie claire, un dossier complet et, en auto, aucune blessure ; aucun seuil standard n'existe, « chaque assureur fixe le sien » [S17, S18 et résultats de recherche]. SÛR : risque connu, des fraudeurs déposent plusieurs sinistres juste sous le seuil, et des assurés gonflent jusqu'au seuil ; on recommande d'**auditer** les décisions automatiques pour dire pourquoi un dossier a été accéléré ou retenu [résultats de recherche, dont S17]. SÛR : Duck Creek dit accélérer les approbations de routine mais faire revoir par un expert **chaque refus** [S8].

**Marché CIMA.** SÛR : au Cameroun, l'IDA ne s'applique qu'aux collisions entre **deux véhicules**, dommages matériels, jusqu'à **500 000 FCFA** (« révisable », environ 95 % des cas), objectif de règlement en 15 jours, expert rapide [S12]. SÛR : en Côte d'Ivoire, un assureur promet l'indemnisation en 90 minutes des sinistres **mineurs de moins de 1 million de FCFA**, sur photos de smartphone et formulaire simplifié [S14] ; paiement instantané par Mobile Money primé à la FANAF 2026 [S15]. L'IDA tunisienne repose sur un constat signé par les deux parties [S16, extrait].

**Choix du PRD.** D9, H-049, H-050, H-051 : accord sur devis si dossier ≤ 300 000 FCFA et devis ≤ 200 000 FCFA, après contrôle du devis par l'IA ; aucune expertise sous 250 000 ; valeurs tirées du mémoire de 2014.

**Recommandation : AJUSTER.** Les seuils du PRD (300 000 et 200 000) sont **plus prudents** que ce que le marché CIMA affiche (500 000 pour l'IDA camerounaise, moins de 1 000 000 pour un assureur du marché ivoirien). Les garder comme défaut, puisque ce sont des paramètres. Ce qui manque : écrire dans le PRD la **liste des conditions cumulatives** de la voie rapide, car le texte n'en donne pas explicitement la liste : matériel automobile seulement, **aucun corporel**, garantie acquise sans réserve, police en règle, **pas de signal de fraude** (score sous le seuil et aucun lien suspect), pièces complètes, assuré identifié, devis contrôlé ; et ajouter deux garde-fous issus des sources : (a) un **cumul anti-fractionnement** (plusieurs petits sinistres du même assuré, du même véhicule ou du même garage sur une période ne passent pas tous en voie rapide) ; (b) un **audit par échantillon** mensuel des dossiers passés en voie rapide, tracé au registre. Le « tiers identifié » ne doit pas exclure la voie rapide : le recours (point 6) se prépare en parallèle.

## 5. Paiements : double contrôle, doublons, incertain, chèques, quittance, délais

**Éditeurs.** SÛR : ClaimCenter modélise le chèque par des états : émis, encaissé, **arrêt demandé** puis arrêté, **annulation demandée** puis annulée, refusé ; chaque passage est une opération distincte, et une opération non permise échoue (« l'opération n'est pas disponible pour ce chèque ») ; un chèque en arrêt demandé peut revenir à émis [S4]. Pas lu : détection de doublons de paiement chez Guidewire (aucune page ; seulement un fournisseur tiers de « contrôles de doublons »). PROBABLE : double approbation par les limites (point 2) ; l'idempotence est la pratique des API de paiement, pas une notion d'éditeur de sinistres.

**Marché CIMA.** SÛR (vendeur) : double validation au-delà d'un seuil [S11]. PROBABLE : chèque de banque ou virement, quittance signée avant remise, opposition bancaire avant tout chèque de remplacement. Le Mobile Money devient un canal de règlement des sinistres (un assureur du marché ivoirien, paiement instantané) [S15].

**Choix du PRD.** D11, R2, R4, H-070, H-071, H-072, H-073, H-074, H-094 : clé d'idempotence ; état `INCONNU` sans nouvelle tentative avant rapprochement ; un règlement `EN_COURS` ou `INCONNU` ne s'annule pas ; chèque annulé = opposition bancaire enregistrée avant remplacement ; accord enregistré par ACC ou un agent qui n'a ni instruit ni validé, sur pièce originale ; quittance signée avant le virement ou le Mobile Money ; plusieurs règlements par dossier ; paiement 72 h après accord (mémoire).

**Recommandation : GARDER.** Le PRD est plus strict que les éditeurs, et aligné sur le cycle d'arrêt puis annulation de Guidewire. Un contrôle à confirmer plutôt qu'à changer : le délai de 72 h après accord doit **courir après le délai de dénonciation** au corporel (R1), ce que le PRD dit déjà.

## 6. Recours et subrogation

**Éditeurs.** SÛR : ClaimCenter offre le suivi de subrogation avec la provision et le paiement (page produit) ; Duck Creek cite des **rôles** distincts (SIU, subrogation, récupération d'épave) [S8]. Shift et Guidewire proposent la détection de subrogation [S6]. Pas lu : clôture du dossier avec recours ouvert (PROBABLE : les éditeurs ont le « recovery » comme objet financier distinct, avec sa propre provision de recouvrement).

**Marché CIMA.** PROBABLE : le recours auprès de l'assureur du tiers suit le paiement de l'assuré ; en indemnisation directe (IDA/CID), l'assureur indemnise son assuré puis se retourne vers l'assureur du responsable, avec un barème de responsabilité et un délai de 30 jours pour l'assureur du responsable (SÛR pour le texte tunisien [S16], extrait) ; pas de texte togolais trouvé.

**Choix du PRD.** D10, H-079, H-080, H-082, H-087, H-088, H-092 : recours objet parallèle, relance tous les 15 jours, dossier clos pendant que le recours vit, prescription 730 jours par défaut avec alerte à 90 jours, forfait de convention inter-compagnies en paramètre seulement, arbitrage par paramètre.

**Recommandation : GARDER.** Objet séparé, relance périodique, clôture indépendante : c'est le modèle des éditeurs. La prescription de 730 jours est la valeur la plus prudente (à faire confirmer par le juriste, §13.2).

## 7. Fraude : score, règles, cellule, qui écarte ou confirme

**Éditeurs.** SÛR : les dossiers qui violent des règles métier ou apparaissent sur des listes de surveillance sont **renvoyés au SIU** [S5] ; le score, les **codes de motif** et les activités suspectes s'affichent dans l'écran du sinistre [S6] ; le score peut **déclencher des workflows** [S7] ; Duck Creek a le rôle SIU, mais un avis d'analyste public le note bas sur la détection de fraude [S8 et recherche]. SÛR : « le SIU doit instruire chaque renvoi crédible » (guide de formation américain, hors zone). Les sources recommandent un **routage par niveaux** de score [S17].

**Marché CIMA.** SÛR (vendeur) : règles, doublons, historique des véhicules et des tiers, **score de risque** [S11]. PROBABLE : pas de cellule SIU dans une compagnie moyenne ; la revue est faite par le contrôle interne ou la direction technique.

**Choix du PRD.** H-098 à H-105, H-125, H-095 : niveau SUSPECT ouvre la revue ; relecteur distinct du gestionnaire (H-099) ; délais 3 jours ouvrés (H-100, H-101) ; **les liens nourrissent la revue, pas le score** (H-103) ; comparaison d'empreintes limitée à l'identité exacte du fichier (H-104) ; indu hors périmètre (H-106, A-22) ; escalade au DG (H-125).

**Recommandation : GARDER.** Le PRD fait ce que font les éditeurs (règles plus score plus codes de motif, revue humaine, décision humaine). Précision à garder dans le texte : le mot « fraude » n'apparaît ni dans un courrier ni sur un écran vu par l'assuré ou ACC ; le motif extérieur est un motif neutre (« vérification complémentaire »). Pratique prudente, PROBABLE, non lue dans une source.

## 8. Litige : part non contestée, offre provisionnelle

**Éditeurs.** Pas lu dans une source accessible. PROBABLE : les éditeurs permettent un paiement partiel (acompte) pendant un désaccord ; la décision de le faire est une décision de gestion, pas une règle du logiciel.

**Marché CIMA.** SÛR via le PRD : au corporel automobile, l'offre **provisionnelle** est la voie légale quand la consolidation est inconnue à 6 mois (art. 233 et suivants, cités SÛR par le PRD). PROBABLE ailleurs : payer la part non contestée « sous réserve de tous droits » est courant en matériel et en dommages aux biens ; l'IDA tunisienne impose un délai de 30 jours à l'assureur du responsable [S16].

**Choix du PRD.** D6, D47, H-070 : pas d'acompte en `LITIGE`, aucune transition de `LITIGE` vers `ORDRE_EMIS` (42 transitions inchangées) ; au corporel, offre provisionnelle.

**Recommandation : AJUSTER.** Garder l'interdiction du paiement **depuis** `LITIGE`, mais ouvrir une voie explicite pour la part **non contestée** hors corporel : le RESP, avec motif, ramène le dossier en `EN_INSTRUCTION`, y fait une offre limitée à la part non contestée (« offre partielle, sous réserve de tous droits ») ; l'accord est enregistré comme pour toute offre ; le reste suit la contestation. Cela ne crée aucune transition nouvelle (retour en instruction déjà prévu par D6) et évite qu'un assuré attende des mois pour une somme que personne ne conteste (PROBABLE, à confirmer en séance d'immersion et par le juriste).

## 9. Décompte : ordre, grille de vétusté, arrondis

**Éditeurs.** Rien de lisible en accès libre sur l'ordre de calcul : c'est de la configuration par produit. PROBABLE : franchise et plafond sont des paramètres de garantie lus sur la police.

**Marché CIMA.** PROBABLE : on calcule le dommage, applique la **vétusté** sur les pièces, la **règle proportionnelle de capitaux** si la valeur déclarée est inférieure à la valeur réelle, plafonne à la garantie, puis déduit la **franchise** ; l'ordre exact et le fait que la franchise s'applique avant ou après le plafond dépendent des conditions générales de la compagnie. Aucune grille de vétusté publique de la zone CIMA n'a été trouvée (grilles de la démo : « indicatives »).

**Choix du PRD.** D15, H-058, H-059, H-060, R8 : dommage, vétusté, règle proportionnelle, plafond, franchise ; ordre de la démo, à confirmer par les conditions générales ; arrondi à 5 000 FCFA pour les montants calculés non corporels, au franc pour le montant arrêté et le corporel.

**Recommandation : GARDER.** Ordre et grilles en paramètres de produit, tels que le PRD les pose (H-058). L'arrondi au franc sur le montant **arrêté** est la bonne pratique : l'arrondi à 5 000 FCFA ne vaut que pour une estimation (provision, proposition de formulaire).

## 10. Expertise : seuils, panel, délais, contre-expertise

**Éditeurs.** Rien de public sur des seuils. PROBABLE : mission, rapport, comparaison au devis, panel d'experts, tous paramétrables.

**Marché CIMA.** SÛR (vendeur) : missions, devis, photos avant et après, barèmes [S11]. SÛR : au Cameroun, l'IDA est une **convention d'expertise** qui vise 15 jours si l'expert intervient vite [S12]. Le panel et les seuils d'une compagnie ne sont pas publics ; la liste des experts agréés vient de l'autorité de contrôle du pays (PROBABLE).

**Choix du PRD.** D9, D15, H-055, H-056, H-057, H-143 : aucune expertise sous 250 000 FCFA, externe obligatoire au-dessus de 3 000 000 (H-068), externe impératif en contre-expertise, fraude et contentieux ; rapport d'expert sous 7 à 10 jours (mémoire) ; complément demandé non revenu = validation bloquée, passage outre du RESP avec motif ; contre-expertise (interne) distincte de l'expertise contradictoire (entre assureurs) ; 60 jours (H-143).

**Recommandation : GARDER.** Seuils en paramètres, rapport de 7 à 10 jours cohérent avec l'objectif de 15 jours de l'IDA camerounaise [S12]. Une précision de vocabulaire déjà faite par le PRD (deux sens de « contre-expertise ») est à conserver.

## 11. Tâches, échéances et délais de service

**Éditeurs.** SÛR : ClaimCenter montre les accords de niveau de service du sinistre et le temps ouvré restant [recherche, page FNOL] ; les activités et leurs échéances sont le mécanisme de suivi ; Salesforce déclenche l'affectation et le traitement dès la création [S10]. Pas de valeurs publiées.

**Marché CIMA.** SÛR (vendeur) : calcul automatique des échéances CIMA, alerte **30 jours** avant l'échéance, offre corporelle dans 12 mois (« 12 mois après l'accident ») [S11]. SÛR : l'offre digitale ivoirienne vise 90 minutes pour un sinistre mineur [S14] ; l'IDA du Cameroun vise 15 jours [S12]. Pas de norme publique pour l'accusé de réception ni le premier contact.

**Choix du PRD.** D7, H-041, H-042, H-044, H-069, H-110 à H-113, H-117, H-146 : accusé de réception 10 jours avec alerte au 8e jour (H-041, H-042) ; premier contact 1 jour ouvré (H-044) ; offre validée envoyée sous 48 h ; relance J+15, alerte J+30 (H-069) ; point de départ et d'arrêt explicites (H-113).

**Recommandation : AJUSTER.** L'accusé de réception à **10 jours** (valeur de la démo) est trop lent face à la pratique numérique du marché (un assureur du marché ivoirien : 90 minutes de bout en bout pour le mineur [S14]) : l'accusé doit être **immédiat et automatique** (la référence `DEC-` remise au dépôt), le « 10 jours » ne restant qu'un délai de **dernier recours** pour l'accusé **nominatif** (courrier). Garder le premier contact à 1 jour ouvré. Ajouter une **alerte légale à 30 jours** avant chaque échéance CIMA, comme le fait le prestataire local [S11] (PROBABLE : le PRD alerte à l'approche ; la valeur 30 jours sera un paramètre).

## 12. GED : numérisation, OCR, classement, conservation, signature

**Éditeurs.** Pas de document d'éditeur lu. PROBABLE : gestion documentaire par classement automatique et extraction ; la conservation est une politique de la compagnie.

**Marché CIMA.** SÛR (via le PRD) : conservation de **10 ans** au moins (Code CIMA art. 404). SÛR (vendeur) : courriers et pièces chiffrés [S11]. PROBABLE : le papier se tient en parallèle pendant la transition ; la valeur probante de la copie numérisée dépend de la loi nationale (non lue : J-19, J-20).

**Choix du PRD.** D17, H-126 à H-142 : OCR réel dès le premier jour ; seuils 0,60 et 0,90 (H-128) ; cote physique du papier ; destruction visée, jamais par défaut ; PDF/A (H-142) ; double visa (H-138) ; test mensuel (H-139).

**Recommandation : GARDER.** Le choix de tenir le papier en parallèle est prudent tant que le juriste n'a pas tranché la valeur de la copie. Les seuils de confiance de l'OCR sont des paramètres.

## 13. IA dans les sinistres : usages, garde-fous

**Éditeurs.** SÛR : Duck Creek présente une IA qui accélère les approbations de routine et fait revoir par un expert chaque refus [S8] ; Salesforce : modèle de signalement de risque, segmentation et affectation [S9, S10] ; Guidewire avec Shift et FRISS : score, codes de motif, workflows déclenchés par le score [S6, S7]. Les sources recommandent d'**auditer** toute décision automatique et de pouvoir l'expliquer [S17, S18].

**Marché CIMA.** Rien de public sur l'IA dans les sinistres de la zone. SÛR (vendeur) : score de risque et règles [S11].

**Choix du PRD.** D13, H-123, H-128, H-187, H-188 : 14 usages au premier jour, **aucune décision automatique**, jamais de montant proposé au corporel, sources jusqu'à la pièce, registre (entrée, sortie, confiance, niveau, statut), IA commune locale, aucune donnée nominative ou médicale sortante, jamais bloquante, règles explicables tant qu'il n'y a pas de modèle.

**Recommandation : GARDER.** Plus strict que les éditeurs (qui acceptent l'approbation automatique des cas de routine) ; c'est cohérent avec une première installation et une revue juridique pas encore faite.

## 14. Reprise de données d'un ancien système

**Éditeurs.** Pas de page lue. PROBABLE : migration par lots avec tables de correspondance ; « en cours d'abord » est la pratique de bascule.

**Marché CIMA.** SÛR (vendeur) : le module sinistres se branche au logiciel de polices par **API ou échange de fichiers quotidien** ; la lecture des polices, garanties et franchises, le retour des règlements et provisions vers la compta [S11]. Aucune source sur la période de double fonctionnement.

**Choix du PRD.** D17, H-169 à H-174 : fichiers sans condition en février, API écrite dès que le LC est connu ; dossiers en cours d'abord, historique ensuite ; resynchronisation nocturne et idempotente pendant la cohabitation ; bascule par dossier à la première action (H-171) ; date de fin posée à la mise en service (H-172) ; rapport de reprise.

**Recommandation : GARDER.** Fichiers d'abord, API ensuite, en cours puis historique, resynchronisation : conforme au seul témoignage local (API ou fichier quotidien) et à la pratique de migration. Une précaution (PROBABLE) : la bascule « par dossier à la première action » suppose qu'un dossier soit **verrouillé** dans l'ancien système dès qu'il est touché dans Prospera, ce que le PRD doit dire explicitement dans l'annexe C.

## 15. Accès aux données médicales

**Éditeurs.** Pas de page lue. PROBABLE : accès par rôle et par dossier, journal de lecture.

**Marché CIMA.** PROBABLE : le médecin-conseil est le seul à voir le détail médical ; le gestionnaire voit ce qui sert à l'offre ; loi nationale sur les données personnelles à lire (J-01, J-02).

**Choix du PRD.** D14, R5, H-017 : lisible par MED, le GEST corporel affecté, le RESP, DG/DT pour une décision ; ACC et NUM voient le type et l'existence, jamais le contenu ; le LC ne reçoit aucune donnée médicale ; chaque lecture est journalisée ; le consentement ne bloque jamais une obligation légale.

**Recommandation : GARDER.** C'est la minimisation habituelle (« besoin d'en connaître » et journal) et elle va plus loin que la pratique courante côté LC.

---

## 16. Les 24 actions du §12.2 : pratique habituelle et recommandation en une ligne

| # | Action | Pratique habituelle | Recommandation |
|---|---|---|---|
| A-1 | Manuel de procédures sinistres | Les compagnies en ont un ; il sert de base à la mise en place du logiciel | GARDER |
| A-2 | Délégations et seuils | Grille à 2-3 niveaux ; le prestataire cite 500 000 FCFA pour la double validation [S11] | GARDER (ajouter suppléance et limite de provision, point 2) |
| A-3 | Nom et API du logiciel ; fichiers de reprise | Raccordement par API ou fichier quotidien [S11] | GARDER |
| A-4 | Experts agréés | Liste fournie par la compagnie ou l'autorité du pays | GARDER ; demander aussi les tarifs et conventions des experts |
| A-5 | Barèmes et grilles de vétusté | Grille propre à la compagnie, aucune grille publique trouvée | GARDER |
| A-6 | Modèles de courriers et quittances | Gabarits de la compagnie | GARDER |
| A-7 | Volumes | À obtenir avant le dimensionnement | GARDER |
| A-8 | Compte rendu de l'atelier | Source de procédure | GARDER |
| A-9 | Préparer la séance d'immersion | Ordre du jour par risque | GARDER ; mettre en tête les points AJUSTER de ce document |
| A-10 | Amender le PRD Reprise pour l'API | Fichiers d'abord, API ensuite | GARDER |
| A-11 | Adaptateur Mobile Money sortant | Mobile Money déjà utilisé pour régler les sinistres en Côte d'Ivoire [S15] | GARDER ; canal « bientôt » sans simulation |
| A-12 | Saisir les tables du barème corporel | Tables en images ; saisie relue par un second agent | GARDER (mode dégradé inclus) |
| A-13 | Fonds de garantie automobile au Togo | Fonds prévu par le Code CIMA dans les États (PROBABLE, non vérifié ici) | GARDER (paramètre désactivé tant que non confirmé) |
| A-14 | RPO et RTO | Sauvegarde quotidienne, reprise sous une journée ouvrée | GARDER (24 h et 8 heures ouvrées, sans engagement) |
| A-15 | Revue juridique | Obligatoire avant mise en service | GARDER |
| A-16 | Charge de février | Question de calendrier, pas de pratique | GARDER (PRD ne coupe rien, ordre §10.3) |
| A-17 | Codes et numéros des modules | Convention interne | GARDER |
| A-18 | Heures ouvrées | À fixer au contrat | GARDER |
| A-19 | Amender manifestes et spines | Convention interne | GARDER |
| A-20 | Portail du cabinet d'expertise externe | Portail ou courriel chiffré ; relais externe = sous-traitant | GARDER (repli `TRANSMISE` conservé) |
| A-21 | Vue réseau | Utile aux directions commerciales, pas au traitement du sinistre | GARDER (hors premier jour) |
| A-22 | Responsable du recouvrement d'indu | En général le juridique ou la direction | GARDER |
| A-23 | Conventions de place (indemnisation directe, constat, experts, contre-expertise) | IDA au Cameroun (500 000 FCFA, deux véhicules, matériel, 15 jours) [S12], CID en Côte d'Ivoire avec constat amiable [S13] ; rien trouvé pour le Togo | AJUSTER : demander explicitement à l'association des assureurs du Togo si une convention existe ; préparer dans le PRD un **modèle d'IDA désactivé** (deux véhicules, dommages matériels, seuil, constat amiable signé, barème de responsabilité, délai de l'assureur du responsable) à activer sans reprise du code |
| A-24 | Confirmer que le LC dédoublonne sur `DEC-` | Idempotence = pratique de l'intégration | GARDER (repli : doublon contrôlé par Prospera) |

---

## Tableau récapitulatif : choix, puis recommandation

| # | Choix structurant | Valeur ou règle du PRD | Recommandation |
|---|---|---|---|
| 1 | Numéro de sinistre | `DEC-` provisoire puis numéro du LC ; idempotence ; une seule voie | GARDER |
| 2 | Délégations | Matrice rôle, montant, nature ; cumul ; 1 000 000 FCFA ; comité au-delà | AJUSTER : limites distinctes pour provision et paiement ; suppléance datée |
| 3 | Provision | Ouverture par tranche ou estimation ; revue à chaque événement ; 2 000 000 FCFA | GARDER |
| 4 | Voie rapide | 300 000 / 200 000 FCFA ; contrôle du devis | AJUSTER : liste explicite de conditions, cumul anti-fractionnement, audit mensuel par échantillon |
| 5 | Paiements | Clé d'idempotence, état `INCONNU`, opposition avant chèque de remplacement, quittance avant paiement | GARDER |
| 6 | Recours | Objet parallèle, relance 15 jours, prescription 730 jours | GARDER |
| 7 | Fraude | Règles et score, revue SUSPECT, relecteur distinct | GARDER (mot « fraude » jamais visible côté assuré) |
| 8 | Litige | Pas d'acompte depuis `LITIGE`, 42 transitions | AJUSTER : offre partielle sur la part non contestée via `EN_INSTRUCTION`, avec motif et décision du RESP |
| 9 | Décompte | Dommage, vétusté, règle proportionnelle, plafond, franchise ; arrondi 5 000 FCFA sauf montant arrêté | GARDER |
| 10 | Expertise | 250 000 / 3 000 000 FCFA ; rapport 7-10 jours ; deux sens de contre-expertise | GARDER |
| 11 | Délais de service | Accusé 10 jours ; premier contact 1 jour ouvré ; offre 48 h ; relance J+15, alerte J+30 | AJUSTER : accusé immédiat et automatique ; alerte à 30 jours avant chaque échéance légale |
| 12 | GED | OCR réel, 10 ans, papier en parallèle, PDF/A | GARDER |
| 13 | IA | 14 usages, aucune décision automatique, registre | GARDER |
| 14 | Reprise | Fichiers puis API ; en cours d'abord ; resynchronisation nocturne | GARDER (ajouter le verrouillage d'un dossier dans l'ancien système) |
| 15 | Données médicales | MED, GEST corporel, RESP ; ACC et NUM sans contenu ; rien vers le LC | GARDER |
| 16 | 24 actions | Voir le tableau du point 16 | 23 GARDER, 1 AJUSTER (A-23) |

**Compte.** Points 1 à 15 : 11 GARDER, 4 AJUSTER. Actions A-1 à A-24 : 23 GARDER, 1 AJUSTER. Total : 34 GARDER, 5 AJUSTER.

## Liste des AJUSTER

1. **Point 2, délégations** : séparer les limites de provision et de paiement (comme Guidewire [S1, S2]) avec cumul sur la provision totale du dossier, et ajouter une suppléance datée et tracée.
2. **Point 4, voie rapide** : écrire la liste des conditions cumulatives (matériel auto, pas de corporel, garantie acquise, pas de signal de fraude, pièces complètes), ajouter un cumul anti-fractionnement et un audit mensuel par échantillon ; garder 300 000 / 200 000 FCFA, plus prudents que les 500 000 (IDA Cameroun [S12]) et moins de 1 000 000 (un assureur du marché ivoirien [S14]) du marché.
3. **Point 8, litige** : permettre une offre partielle sur la part non contestée par retour en `EN_INSTRUCTION` (sans nouvelle transition), hors corporel, avec motif et décision du RESP ; l'offre provisionnelle reste la voie légale au corporel.
4. **Point 11, délais de service** : accusé de réception immédiat et automatique (la référence `DEC-`), le délai de 10 jours devenant un dernier recours ; alerte à 30 jours avant chaque échéance légale [S11].
5. **A-23, conventions de place** : demander à l'association des assureurs du Togo si une convention d'indemnisation directe existe, et prévoir dans le PRD un modèle d'IDA désactivé (périmètre, seuil, constat amiable, barème, délai) à activer par paramètre.
