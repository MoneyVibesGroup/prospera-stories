# Plan de rédaction — PRD Assurance (sinistres), 2026-11-13

Ce plan fixe la structure, la numérotation, le vocabulaire et **les décisions prises par recommandation** (le PO a dit : « analyse toi-même et complète pour qu'on finisse »). Les rédacteurs le suivent à la lettre. Tout ce qui est décidé ici sans parole du PO porte la balise `[ASSUMPTION: … ; à confirmer à la séance d'immersion]` dans le PRD.

## 0. Règles d'écriture (pour tous)

- Français, phrases courtes, voix active, sans jargon inutile. Même gabarit que le PRD microfinance (`../prd-microfinance-2026-11-13/prd.md`, lire §0 à §4 pour le ton) : `#### FR-n : titre`, un paragraphe d'exigence, puis **Conséquences (testables) :** en puces vérifiables.
- **Ne jamais nommer la compagnie cliente** (« la compagnie »). Ne jamais nommer le groupe ni la compagnie du mémoire (« une compagnie du même groupe au Sénégal », « le mémoire de 2014 »).
- **Ne jamais citer un texte réglementaire non vérifié.** Seuls les articles marqués SÛR dans `extract-recherche-cima.md` se citent avec leur numéro. Le « Règlement CIMA n° 002-26 » du code de la démo n'est PAS vérifié : ne pas le citer. Ce qui est PROBABLE se cite « à vérifier par le juriste ».
- Tout seuil, délai, montant, taux ou liste métier est un **paramètre** de la compagnie : écrire la valeur par défaut et ajouter une ligne dans votre fichier `params-wN.md` (colonnes : code | libellé | défaut | unité | source | FR). Ne pas écrire l'annexe D : elle sera assemblée.
- Toute hypothèse : balise inline `[ASSUMPTION: texte court]`. Toute capacité IA : dire entrée, sortie, destinataire, garde-fou, et « servi par l'IA commune ».
- Le PRD décrit des **capacités**, pas une implémentation (pas de nom de table, d'API, de framework). Les choix techniques utiles vont dans votre fichier `addendum-wN.md`.
- Sources, par ordre de priorité en cas d'écart : récit du PO (`brain-dump-po-2026-11-13.md`) > ce plan > code de la démo (`extract-code-demo.md`) > parcours validés (`extract-parcours-demo.md`) > proposition v2 (`extract-commercial.md`, source A) > SPEC (`extract-spec-pieces.md`) > autres. La réglementation (`extract-recherche-cima.md`) l'emporte sur tout pour les obligations légales.
- Écrire **au fil de l'eau** dans votre fichier : section par section, jamais tout à la fin.

## 1. Structure du PRD et répartition

| Partie | Sections | FR | Rédacteur | Fichier |
|---|---|---|---|---|
| 1. Le produit | §0 Objet, §1 Vision, §2 Pour qui (rôles, hors cible, parcours UJ), §3 Vocabulaire, §4 Règles transverses | FR-1 → FR-29 | W1 | `part-w1.md` |
| 2a. Le circuit, de la déclaration à l'offre | §5.0 à §5.7 | FR-30 → FR-89 | W2 | `part-w2.md` |
| 2b. Le circuit, du paiement à la clôture, recours, sorties, états | §5.8 à §5.15 | FR-90 → FR-149 | W3 | `part-w3.md` |
| 3. Les autres modules propres à l'assurance | §6.1 à §6.8 | FR-150 → FR-219 | W4 | `part-w4.md` |
| 4. Modules partagés, IA, installation | §7.1 à §7.6 | FR-220 → FR-249 | W1 | `part-w1.md` (à la suite) |
| Reste | §8 exigences transverses, §9 indicateurs, §10 périmètre, §11 non-objectifs, §12 décisions/actions/risques, §13 hypothèses, annexes A (contrat de module), B (matrice d'accès), C (contrat d'échange), D (paramètres) | FR-250+ | assemblage après | — |

Les FR non utilisés d'une plage restent libres (pas de renumérotation). Chaque rédacteur ne déborde pas de sa plage.

## 2. Décisions de cadrage (fait foi)

**D1 — Le client.** Compagnie IARD, zone CIMA, Togo, pré-contrat, jamais nommée ; démarrage **février 2027** ; serveurs et NAS **chez elle** ; IA commune en **instance locale** (écarts anonymisés sortants par tunnel sécurisé, mises à jour reçues, aucune donnée nominative ni médicale ne sort).

**D2 — Le logiciel de la compagnie fait foi pour les contrats.** Appelé « **le logiciel de la compagnie** » (LC). Il tient les assurés, les polices, les garanties, les primes et leur paiement, les intermédiaires (courtiers, agents), les coassureurs, **et le numéro de sinistre officiel** (« pour un début »). Prospera tient le **dossier sinistre** : déclaration, pièces, instruction, expertise, évaluation, provision du dossier, décision, offre, règlement, recours, archives, journal. **On ne spécule pas sur le LC** (libre en janvier) : le PRD définit un **contrat d'échange générique** (annexe C), en API **ou** en fichier (Excel, JSON) dans les deux sens.

**D3 — Le numéro de sinistre.** À la déclaration dans Prospera, le dossier reçoit **immédiatement une référence de déclaration Prospera** (`DEC-AAAA-NNNNN`), remise à l'assuré sur l'accusé, et la déclaration part vers le LC. Le LC renvoie le **numéro de sinistre officiel** ; Prospera le rattache, et c'est lui qui s'affiche partout ensuite (la référence de déclaration reste un critère de recherche). Si le LC ne sait pas recevoir : la déclaration figure dans une **liste « à saisir dans le logiciel de la compagnie »** ; l'agent qui l'y saisit reporte le numéro obtenu dans Prospera. Un dossier sans numéro officiel depuis plus de 1 jour ouvré est une alerte au responsable (paramètre). Le contrôle de doublon porte sur la police, la date de survenance, l'immatriculation et la victime, dans Prospera **et** dans les sinistres reçus du LC. Le paramètre « qui attribue le numéro » existe (LC ou Prospera) pour permettre le basculement plus tard, sans reprise du code.

**D4 — Contrats lus, jamais modifiés.** Prospera lit polices et garanties (projection datée du LC). Le contrôle de recevabilité (police en vigueur, prime payée, garantie souscrite, délai de déclaration) s'appuie sur cette projection et affiche la date de dernière lecture. **Le contrôle de garantie ne peut pas être sauté** (écart corrigé de la démo) : si l'information manque, le gestionnaire enregistre une décision motivée (`GARANTIE_ACQUISE | SOUS_RESERVE | REFUS_DE_GARANTIE`, motif ≥ 10 caractères), visible par l'AUD.

**D5 — Le circuit : 8 phases, 11 statuts, 4 sorties, recours en parallèle** (récit du PO §3, fait foi). Correspondance avec la démo : `PIECES_INCOMPLETES` → **`PIECES_ATTENDUES`** ; `EN_ETUDE` → **`EN_INSTRUCTION`** ; `VALIDATION` → **`EN_VALIDATION`** ; **`OFFRE_ENVOYEE` ajouté** ; `RECOURS` n'est plus un statut du dossier (suivi parallèle, D10). Les 31 transitions de la démo (`extract-code-demo.md` §2) sont la base ; W3 écrit la table complète, réécrite sur les 11 statuts.

**D6 — L'offre et l'accord deviennent une étape.** `EN_VALIDATION → OFFRE_ENVOYEE` (validation selon la délégation, puis offre envoyée sous **48 h**, paramètre). `OFFRE_ENVOYEE → ORDRE_EMIS` quand l'accord de l'assuré est **enregistré** (offre signée, ou procès-verbal de transaction au corporel). `OFFRE_ENVOYEE → LITIGE` si refus (contre-expertise demandée) ; contre-proposition → retour `EN_INSTRUCTION` avec motif ; offre sans réponse à J+15 → relance, à J+30 → alerte (paramètres). **Aucun ordre de règlement sans accord enregistré.**

**D7 — Délais légaux et délais internes, séparés.** Délais **légaux** du corporel automobile (Code CIMA, art. 231, 233, 236, SÛR) : offre dans les **12 mois** suivant l'accident, **8 mois** suivant le décès, **offre provisionnelle** si la consolidation n'est pas connue à 6 mois ; pénalité de **5 % par mois** de retard affichée. Ils sont des alertes **réglementaires**, jamais modifiables par la compagnie. Les délais du **matériel et des autres branches** ne sont pas fixés par le Code : ils sont **contractuels/internes**, paramétrés par produit. Les délais internes de la démo (accusé 10 j ; offre 90/60/75 j depuis le dossier complet ; règlement 45/30/30 j après accord ; SLA 45/21/30/90 j) sont des **délais internes** paramétrables. Délais du mémoire repris en défauts internes : offre validée envoyée sous 48 h, rapport d'expert 7 à 10 j, paiement 72 h après accord, relance recours tous les 15 j. Délais du FGA (`true.pdf`, Règlement CIMA n° 0007, SÛR selon `extract-spec-pieces.md`) : à reprendre comme alertes du corporel **si un FGA existe au Togo** `[ASSUMPTION]`. Chaque échéance a un point de départ et un point d'arrêt explicites. Un dossier est jugé selon le référentiel en vigueur à sa **date de survenance**.

**D8 — Délégations à plusieurs niveaux (matrice paramétrable).** Une matrice : niveau → rôles signataires, quorum, plage de montant, volet, nature (indemnité, honoraires, acompte, à titre commercial). Défauts `[ASSUMPTION: délégations réelles à obtenir]` : **≤ 1 000 000 FCFA** : responsable sinistres ; **> 1 000 000 FCFA** : comité sinistres (4 membres dont le responsable sinistres et le directeur technique ; quorum 3), puis **visa du directeur technique** ; **règlement à titre commercial** (hors garantie) : **DG seul**, quel que soit le montant. Le cumul des montants validés d'un même dossier décide du niveau (anti-fractionnement, règle SEP-03 de la démo). L'instructeur ne valide jamais son propre dossier (SEP-01) ; celui qui décide ne paie pas (SEP-02).

**D9 — Voie « accord sur devis ».** Pour le matériel automobile, si le dossier ≤ **300 000 FCFA** et le devis ≤ **200 000 FCFA** (paramètres, mémoire), le gestionnaire peut retenir le devis sans mission d'expertise, après contrôle du devis (IA, D13). Sinon, règles d'expertise de la démo : aucune expertise sous 250 000 ; externe obligatoire au-dessus de 3 000 000 ; externe impératif en contre-expertise, fraude, contentieux.

**D10 — Le recours est un suivi parallèle.** Le recours naît **dès l'ouverture** si un tiers est en cause (lettre de mise en cause du tiers ou de son assureur), avec relance **tous les 15 jours** (paramètre) ; la **réclamation du remboursement** part après le paiement de l'assuré (subrogation). Le dossier sinistre peut être **clos** pendant que son recours continue ; le recours a sa propre machine (celle de la démo : `A_QUALIFIER … RECUPERE | ABANDONNE`, mise en demeure, contentieux) et se clôt seul. Prescription biennale affichée comme terme à vérifier, alerte à 90 j. Le forfait de convention inter-compagnies de la démo (350 000) n'est retenu qu'**en paramètre** : aucune convention togolaise n'a été trouvée `[ASSUMPTION]`.

**D11 — Règlements.** Un dossier peut avoir **plusieurs règlements** (acompte, offre provisionnelle, plusieurs bénéficiaires, honoraires d'expert). Chaque règlement a son propre état (`A_PAYER, EN_COURS, PARTIEL, PAYE, ECHEC`) et sa quittance (`PRETE, EDITEE, SIGNEE, REMISE, ENCAISSEE`). Le dossier passe à `REGLE` quand le reste à payer de l'indemnité validée est **zéro**. Moyens : **chèque** (la comptabilité saisit banque, numéro, montant ; Prospera imprime la lettre-chèque sur gabarit si la compagnie l'utilise, sinon le chèque est rempli à la main et son numéro saisi), **virement bancaire / PI-SPI** et **Mobile Money** (T-Money, Flooz ; opérateurs paramétrables par pays) exécutés par le module **`paiement`**. `CHEQUE_A_REMETTRE` ne vaut que pour le chèque ; pour un virement ou le Mobile Money, `ORDRE_EMIS → REGLE` à la confirmation de `paiement`, la quittance étant **signée avant** (au guichet, ou par acceptation électronique avec code à usage unique) `[ASSUMPTION]`. Espèces plafonnées à 500 000 FCFA (paramètre). Remise du chèque : identité et numéro de pièce d'identité du retirant obligatoires, quittance signée. Contrôle LBC/FT : bénéficiaire vérifié, changement de coordonnées bancaires dans les 5 jours avant paiement = alerte (démo).

**D12 — La provision du dossier.** Prospera tient la **provision dossier par dossier** (charge estimée du sinistre), posée à l'ouverture (milieu de tranche selon gravité, ou estimation), revue à chaque événement (expertise, évaluation, offre, règlement), avec motif ; l'écart ≥ 2 000 000 attend le responsable (démo). Prospera **produit l'état** des provisions (PSAP dossier par dossier, par exercice de survenance, brut / cédé / net selon les traités de réassurance et clés de coassurance du référentiel) et l'**export** vers la comptabilité et le LC. **La comptabilité officielle reste hors de Prospera** (D16). Le module `assurance` (`prospera-assurance-service`, comptes techniques CIMA) consomme ces données.

**D13 — L'IA dès le premier jour, sauf la voix.** Les **14 usages** de la proposition v2 (`extract-commercial.md` A.3) sont **tous au premier jour**, servis par l'IA commune en instance locale. Exclusions : toute **dictée, transcription d'appel ou synthèse vocale** (la « déclaration assistée » prend WhatsApp et e-mail, pas l'appel) ; le **chatbot de l'assuré** du deck est « bientôt » `[ASSUMPTION]`. Garde-fous v2, tous exigés : aucune décision automatique ; **jamais de montant proposé sur un préjudice corporel** (gestionnaire et médecin-conseil) ; chaque information **sourcée** jusqu'à la pièce ; **registre de l'IA** (entrée, sortie, confiance, sources, niveau `EXTRACTION | ANALYSE | RECOMMANDATION`, statut `PROPOSEE | ACCEPTEE | MODIFIEE | REJETEE`, auteur de la décision) ; l'IA « ne se met pas à jour seule » (mise à jour versionnée, retirable) ; jamais bloquante (si l'IA est coupée, tout le circuit passe). Tant qu'un modèle n'existe pas, la capacité est servie par des **règles explicables** et le dit (pas le mot « IA »). **L'OCR des pièces scannées est réel au premier jour** (la démo ne lit que la couche texte des PDF).

Répartition de la spécification IA (chaque rédacteur écrit les usages de ses sections) :

| # v2 | Usage | Section | Rédacteur |
|---|---|---|---|
| 1 | Déclaration assistée (WhatsApp, e-mail ; pas l'appel) | §5.1 | W2 |
| 2 | Lecture et classement des pièces (OCR + classement) | §6.2 | W4 |
| 3 | Contrôle des pièces (cohérence, photo réutilisée) | §5.4 | W2 |
| 4 | Pièces manquantes et relances rédigées | §5.2 | W2 |
| 5 | Résumé sourcé du dossier | §6.1 | W4 |
| 6 | Recherche en langage naturel (texte) | §6.1 | W4 |
| 7 | Pré-remplissage de l'instruction | §5.4 | W2 |
| 8 | Analyse des devis | §5.5 | W2 |
| 9 | « Pourquoi ce montant ? » | §5.6 | W2 |
| 10 | Détection de fraude (graphe des liens) | §5.12 | W3 |
| 11 | Rédaction des courriers | §5.7 (offre), §5.12 (refus), §6.1 (réclamations) | W2, W3, W4 |
| 12 | Recours (offres adverses, mises en demeure) | §5.10 | W3 |
| 13 | Brief du matin et veille | §6.7 | W4 |
| 14 | Qualité du dossier et simulation « et si… » | §6.7 | W4 |
| + | Orientation d'expertise assistée (démo) ; complétude d'un rapport d'expert ; comparaison au portefeuille | §5.5 | W2 |

W1 écrit la règle transverse de l'IA (FR du §4, sur le modèle de PRD-MF FR-8) avec ce tableau, et la fiche IA commune du §7.

**D14 — Rôles (14).** `DG` direction générale ; `DT` directeur technique (opérationnel) ; `RESP` responsable du service sinistres ; `GEST` gestionnaire sinistres, rattaché à **un volet** (corporel, matériel, risques divers) ; `GREC` gestionnaire recours ; `MED` médecin-conseil ; `EXPI` expert interne ; `EXPE` cabinet d'expertise externe (accès au portail expert, à ses seules missions) ; `ACC` chargé d'accueil-guichet ; `NUM` opérateur de numérisation ; `ARCH` archiviste ; `CPT` comptable règlements ; `AUD` contrôle interne (lecture, journal) ; `ADMIN` administrateur (ne lit aucune donnée métier). Le **comité sinistres** est une instance (D8), pas un rôle. Les 14 gestionnaires de la démo (3 corporel, 5 matériel, 3 risques divers, 3 recours) sont le **jeu de démonstration**. **Données de santé** : lisibles par `MED`, le `GEST` corporel affecté, `RESP`, et `DG`/`DT` pour une décision ; `ACC` voit qu'une pièce médicale est reçue, jamais son contenu ; chaque lecture est journalisée.

**D15 — Écarts de la démo tranchés.** Franchise **déduite** du montant arrêté (décompte : dommage → vétusté → règle proportionnelle de capitaux → plafond → franchise (ordre du code de la démo, corrigé le 2026-11-13)). Déclaration tardive : **réserve + motif**, la déchéance n'est jamais automatique (elle suppose un préjudice établi), le responsable décide. Rapport d'expert avec complément demandé non revenu : validation **bloquée**, sauf passage outre du `RESP` avec motif. Cabinet sans compte : le gestionnaire **saisit** le rapport reçu (pièce jointe obligatoire, marqué « saisi pour le cabinet ») ; le portail expert sert les cabinets avec compte. Évaluation arrêtée **jamais recalculée** si le barème change. Le barème corporel est un **calcul poste par poste** (art. 257 à 266 du Code CIMA, SMIG paramétré), pas une tranche ; les grilles en tranches de la démo restent pour la **provision d'ouverture** et le pilotage.

**D16 — Comptabilité.** Hors de Prospera. Prospera produit un **état et un export** : règlements émis et remis, honoraires, provisions (D12), recours encaissés, cessions. Le format suit le contrat d'échange (annexe C). Le rapprochement bancaire des chèques et du Mobile Money se fait dans `paiement` (écart de rapprochement ancien de 60 j = alerte).

**D17 — Reprise des archives.** Par **API** ou par **fichier Excel ou JSON**, via le module **`reprise`** (M44, PRD reprise de données) : métadonnées (assuré, police, sinistre, date, type de pièce), fichiers, **numéro d'archivage conservé** (sinon attribué par Prospera), rattachement, **rapport de reprise** (récupérés, rejetés avec raison, écarts). Ordre : **dossiers en cours d'abord**, historique ensuite. **Resynchronisation** régulière pendant la période où les deux systèmes vivent ensemble (paramètre : chaque nuit), idempotente. Pas de scan du stock papier comme voie de reprise ; le **papier reste tenu** : chaque dossier porte sa **cote physique** (boîte, rang, chemise de couleur par branche), sa sortie et sa restitution (15 j). Les nouvelles pièces sont scannées ou téléversées au guichet ou par `NUM`, avec contrôle avant archivage. Conservation **10 ans** au moins (Code CIMA art. 404, SÛR) ; durées par nature de la démo en paramètres ; destruction = décision visée et tracée, jamais par défaut.

**D18 — Les modules.**

| Code | Module | N° | Service (pour l'annexe A, sans engagement d'architecture) | Rédacteur |
|---|---|---|---|---|
| `sinistres` | le circuit sinistre, recours compris | M05 | à cadrer par la spine | W2, W3 |
| `ged` | pièces, numérisation, OCR, archives numériques et physiques | M07 | `document-service` étendu | W4 |
| `expertises` | missions, experts, médecin-conseil, portail expert | M29 | `prospera-assurance-service` étendu | W2 (§5.5) + W4 (§6.3) |
| `assurance` | contrats lus, provisions, réassurance, coassurance, états | M30/M31 | `prospera-assurance-service` | W4 |
| `liaison-assureur` [proposition] | échange avec le logiciel de la compagnie | M48 [proposition] | à cadrer | W4 |
| `assureur-fictif` | logiciel de compagnie fictif de démonstration | — (démo seulement) | à cadrer | W4 |
| `reprise` | reprise des archives | M44 | cadré | W4 |
| `paiement`, `notification`, `dashboard`, `reseau`, IA commune, `connecteurs` | modules partagés | M33, M34, M28, M01, —, M43 | cadrés | W1 (§7) |

**D19 — Le jeu de démonstration.** Une **compagnie fictive** branchée sur le **logiciel de compagnie fictif** (`assureur-fictif`, comme le cœur fictif de l'IMF) : 14 gestionnaires, un portefeuille d'environ **3 500 dossiers** sur tous les statuts (ordre de grandeur de la démo), polices et garanties des 7 produits de la démo, experts (interne auto, médecin-conseil, cabinet). Les 4 scénarios (`SIN-2026-9001` à `9004`) sont rejouables ; le parcours de `SIN-2026-9002` se mène **à la main, rôle après rôle, de la déclaration à l'archive**. Les 104 vérifications du rejeu 2 deviennent des tests de recette sur le vrai serveur.

**D20 — Performance et volumes.** Recherche d'un dossier : **résultat en moins de 5 secondes** (95e centile, v2/PO), en moins de 1 seconde visé (deck) `[ASSUMPTION]`, sur le volume repris. Volumes inconnus : le PRD fixe une **hypothèse de dimensionnement** (`[ASSUMPTION: 5 000 sinistres par an, 50 000 dossiers archivés, 1,5 million de pages, 60 utilisateurs simultanés, 1 site central + guichets]`) à remplacer par les vrais volumes. Sauvegarde **quotidienne**, restauration testée ; support : anomalie bloquante prise en charge en **4 h ouvrées**.

**D21 — Revue juridique obligatoire avant la mise en service** (comme l'IMF) : délais CIMA, barème corporel, FGA, conventions inter-compagnies, données de santé (loi 2019-014 : consentement écrit, IPDCP), valeur probante de la copie numérisée (loi 2017-007 non lue), LBC/FT. Les tables du barème corporel (valeur du point d'IPP, capitalisation, barème médical) sont des **images** dans le PDF officiel : leur **saisie** est une tâche du plan, pas une hypothèse.

## 3. Vocabulaire commun (à employer tel quel)

Dossier sinistre ; déclaration ; référence de déclaration (`DEC-…`) ; numéro de sinistre (officiel, du LC) ; numéro d'archivage (`ARC-AAAA-CCCC-NNNNN`) ; cote physique ; volet (corporel, matériel, risques divers) ; pôle recours ; pièce (obligatoire, complémentaire) ; recevabilité ; garantie ; mission d'expertise ; rapport d'expertise ; contre-expertise (interne à la compagnie) et expertise contradictoire (entre assureurs) — **deux sens distincts** ; décompte ; évaluation ; provision ; délégation ; comité sinistres ; offre (provisionnelle, définitive) ; accord ; procès-verbal de transaction ; ordre de règlement ; quittance ; règlement ; recours ; mise en cause ; mise en demeure ; le logiciel de la compagnie (LC) ; le logiciel de compagnie fictif ; IA commune ; registre de l'IA. **Cinq montants jamais confondus** : évalué, proposé (offre), validé, payé, reste à payer ; plus la provision.

## 4. Ce que chaque rédacteur lit

- **Tous** : ce plan, `brain-dump-po-2026-11-13.md`, `.memlog.md`, et `../prd-microfinance-2026-11-13/prd.md` lignes 1-375 (ton et gabarit).
- **W1** : `extract-commercial.md` (A.1, A.3, A.4, A.6, B, C), `extract-parcours-demo.md` §1, §1bis, §2.3, `extract-recherche-cima.md` (données de santé, conservation, LBC/FT), `../prd-microfinance-2026-11-13/prd.md` §7.7 à §7.9 (lignes 3419-3645) pour les fiches partagées et l'installation, `../prd-distributeur-2026-11-12/prd.md` §4 (titres des FR-1 à FR-19).
- **W2** : `extract-code-demo.md` §1, §2, §2.1, §3.1 à §3.8, §5 ; `extract-parcours-demo.md` §2, §2bis, §4 ; `extract-spec-pieces.md` §1 et pièces ; `extract-recherche-cima.md` (barème, délais, pièces).
- **W3** : `extract-code-demo.md` §2, §2.2, §3.6 à §3.12, §4, §6, §8 ; `extract-parcours-demo.md` §2 (étapes 12 à 16), §4, §5 ; `extract-spec-pieces.md` (contrôle interne du mémoire, incohérences) ; `extract-recherche-cima.md` (pénalités, recours, FGA, LBC/FT).
- **W4** : `extract-code-demo.md` §1.11, §3.10, §3.11, §4, §5, §7, §8, §9 ; `extract-commercial.md` A.2, A.4, A.5, A.7, B, C.7 ; `extract-parcours-demo.md` §6 ; `../prd-reprise-donnees-2026-11-10/prd.md` (titres et FR sur les fichiers, le rapport de reprise, la resynchronisation) ; `../prd-microfinance-2026-11-13/prd.md` §6.5 et §6.6 (lignes 1939-2195 : échange avec le cœur et cœur fictif, à transposer).
