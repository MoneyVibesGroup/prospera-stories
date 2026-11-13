# PRD Quality Review — L'IA commune de Prospera (§0-§14, FR-1 → FR-174)

Copie relue : `review-input.md` (figée, 2449 lignes). Non reprochés : la fin du PRD (exigences transverses, indicateurs de succès, périmètre, non-objectifs, décisions, index des hypothèses) et les annexes A-D, écrites en parallèle.

## Overall verdict

**Verdict : BON, avec une correction obligatoire avant gel.** Le PRD a une thèse nette (une seule IA, N0/N1/N2, on met en commun l'apprentissage et pas les données), 174 FR contiguës et uniques, chacune avec des conséquences testables, des garde-fous cohérents et des parcours nommés. Les 95 besoins d'IA des quatre logiciels sont tous couverts (contrôle mécanique : 95 identifiants dans l'extrait, 95 dans FR-130, aucun écart). Les six décisions du PO relues dans le `.memlog` sont portées par des FR testables, avec une seule contradiction grave : la décision de voix corrigée en dernier (microfinance : saisie vocale terrain au jour 1) n'a pas été propagée, et sept endroits du PRD affirment le contraire, dont des tests qui échoueraient sur la décision du PO. Les autres risques sont une doctrine d'autonomie ambiguë sur un point (FR-13/28 contre FR-14/134), un biais de sélection non dit dans le chiffre « qui avait raison » que le PO veut vendre, et des paramètres qui dérivent d'un rédacteur à l'autre (le seuil `k` vaut 5 dans un FR et 20 dans la table).

Grade (barème validate.md) : **Poor** à cause du seul constat CRITIQUE ; **Good** dès qu'il est corrigé (aucune dimension thin).

## Résultat par critère

| Dimension | Verdict |
|---|---|
| 1. Decision-readiness | strong |
| 2. Substance over theater | strong |
| 3. Strategic coherence | adequate (indicateurs de succès en attente, hors périmètre de cette relecture) |
| 4. Done-ness clarity | strong |
| 5. Scope honesty | adequate |
| 6. Downstream usability | adequate |
| 7. Shape fit | strong |

## Decision-readiness — strong

Les décisions sont écrites comme des décisions (« un modèle déjà publié n'est pas désentraîné », FR-81 ; « un type non déclaré est engageant et irréversible », FR-14 ; « la coupure à distance n'est jamais une action autonome », FR-174). Les compromis sont nommés avec ce qu'on abandonne : la précision qui baisse sous masquage fort (FR-34), le biais de sélection des instances isolées (FR-61, trou T-18), le Copilot remonté au jour 1 contre le PRD distributeur (FR-9, FR-50), l'absence d'approbation humaine à chaque lot d'export (FR-77). Les hypothèses sont posées à des tensions réelles et non à des points sûrs. Le risque est inverse : une décision du PO s'est perdue (voix) et une doctrine reste ouverte à une lecture contraire (autonomie).

### Findings

- **critique** Décision du PO sur la voix non propagée (§2.2, FR-9, FR-35 note, FR-50 ligne microfinance, FR-128, FR-129 X7, FR-138, FR-130 ligne M26) — le `.memlog` (dernière entrée « change ») dit : microfinance = saisie vocale terrain au jour 1 (comme son PRD validé), assurance = sans voix, distributeur et cabinet = bientôt. Le PRD écrit partout « voix bientôt pour tous » ; X7 dit même « la dictée vocale de la microfinance est reportée [ASSUMPTION … à confirmer par le PO] » et FR-138 la reporte « par cette décision ». Les tests négatifs (« Aucun écran du premier jour n'enregistre de son », FR-138 ; FR-9 ; FR-131 « pas d'entrée audio ») échoueraient sur la microfinance telle que décidée. Aucune FR ne spécifie la saisie vocale terrain (consentement, langue, reconnaissance, repli, donnée biométrique de la voix), alors que M26 l'exige. *Fix:* (1) réécrire FR-9, §2.2, FR-35 (note finale), FR-50, FR-128, X7, FR-138 : voix = réglée par pack de secteur ; microfinance « saisie vocale terrain, jour 1 » ; assurance « sans voix » (statut EXCLU, décision du PO) ; distributeur et cabinet « bientôt » ; supprimer l'ASSUMPTION de X7. (2) Ajouter une FR dans la famille 12 ou le §11 pour la saisie vocale terrain de la microfinance (entrée audio, consentement du collecteur, transcription proposée et jamais validée seule, où tourne la reconnaissance en local, repli clavier, donnée vocale non exportée au niveau « apprentissage », test hors réseau). (3) Rendre les tests négatifs conditionnels au pack de secteur. (4) Mettre à jour la ligne M26 de FR-130 vers la nouvelle FR.

- **haute** Doctrine d'autonomie ambiguë : « jamais » contre « non activable tant que le juriste n'a pas tranché » (FR-13 dernière conséquence ; FR-28 conséquence 2 ; contre FR-14, FR-134, X3, D5) — FR-14 et FR-134 disent jamais d'action autonome pour crédit, garantie, sinistre, paiement, refus, blocage. FR-13 et FR-28 disent que la décision automatique est « désactivée et non activable … tant que le juriste n'a pas tranché », ce qui laisse entendre qu'elle devient activable après revue. Les deux lectures donnent deux backlogs. *Fix:* choisir. Recommandation : v1 = jamais, par construction ; une évolution demande une décision du PO et un amendement de ce PRD, pas un réglage client ; réécrire les deux conséquences en ce sens.

- **haute** `REGLE` refusée pour un effet juridique ou financier, contre le blocage de crédit par règle chiffrée du logiciel (FR-13 conséquence 3 ; FR-97 conséquence « un blocage de crédit ne peut être déclenché que par la règle chiffrée du logiciel » ; FR-27 dernière conséquence ; FR-137 distributeur) — FR-13 refuse toute décision de décideur `REGLE` ou `MANDAT` dont la catégorie d'effet est `JURIDIQUE_OU_FINANCIER`, et cite le blocage. Or le distributeur bloque un client par sa règle déterministe de plafond. Un exécutant lira FR-13 et interdira un blocage que les PRD de logiciel exigent. *Fix:* distinguer dans FR-13 et dans le glossaire (§3, « Décideur ») la règle propre du logiciel (déterministe, versionnée, hors IA, qui reste un fait du module) de toute sortie de l'IA : la restriction porte sur ce que l'IA peut déclencher ; ajouter un test qui prouve qu'une proposition de l'IA ne peut ni déclencher ni lever ce blocage.

### Findings (cohérence des décisions du PO, voir aussi « Couverture » plus bas)

- **haute** Biais de sélection non dit dans le chiffre « qui avait raison » destiné à la vente (FR-74, FR-75 usage 3) — la règle range en `INDECIDABLE` tout désaccord dont la réalité n'est pas observable (prêt refusé, sinistre non déclaré). Seuls les cas où l'humain a accordé contre l'avis de l'IA sont mesurés, donc le pourcentage porte sur un sous-ensemble choisi par l'humain, et la phrase commerciale (« l'IA avait raison dans X % des cas ») est trompeuse si elle ne le dit pas. Le PRD exige l'effectif et l'intervalle mais pas la population. FR-29 (ne rien promettre de faux) devrait s'appliquer ici. De plus, avec `k` organisations au minimum, aucun chiffre global n'est publiable tant que `k` organisations n'ont pas consenti. *Fix:* ajouter à FR-75 : (a) la phrase exportable porte obligatoirement la population mesurée (« parmi les désaccords dont la réalité a pu être observée, N, soit p % de l'ensemble des désaccords ») et la part d'`INDECIDABLE` ; (b) une règle d'échantillon de contrôle ou la mention explicite de la limite (pas de contrefactuel) ; (c) un test qui refuse une phrase d'export sans ces deux mentions ; (d) dire que, avant `k` organisations, seul le document par client (instance) existe, et le tester.

## Substance over theater — strong

Rien de décoratif : chaque rôle (UM, RM, AUD, DSI, IA-MV, JUR, DPD, PC) a des droits testés (FR-8) ; les huit parcours sont des cas de recette (FR-10) ; les seuils sont des paramètres ; les garde-fous sont testables et non adjectivés. La Vision n'est pas interchangeable : elle porte l'argument de l'« apprentissage commun sans données communes ». Huit rôles dépassent la limite habituelle de quatre personas, mais ce sont des rôles de droits et non des personas ; chacun apparaît dans au moins une FR. Pas d'innovation theater : la section « grands éditeurs » est appliquée, pas citée (FR-29, FR-34).

### Findings

- **moyenne** NFR sans valeur au moment de la relecture (FR-41, FR-31, FR-64) — les paliers P0-P2 n'ont ni empreinte ni latence cible (« à fixer par mesure avant le premier devis ») ; `ia.iso_delai_max_pct`, `ia.duree_ombre_jours`, `ia.part_canari_pct` sont nommés sans défaut dans le texte. C'est honnête, mais un test « latence p95 inférieure au plafond du palier » ne se rédige pas sans plafond. *Fix:* donner un défaut recommandé marqué `[ASSUMPTION]` dans l'annexe D pour chaque paramètre cité par un test, même grossier.

## Strategic coherence — adequate

La thèse tient : la valeur vient de la somme de ce que quatre métiers apprennent, pas de la somme de leurs données ; le jour 1 (N0) rend la proposition utile sans historique ; l'apprentissage et la mise à jour sont conditionnés à des objectifs mesurés (FR-6, FR-68, FR-69). L'ordre de livraison suit la thèse (règles d'abord, modèle commun au mieux au second semestre 2027, produits de la vision en feuille de route, FR-146). Les indicateurs de succès du produit et les contre-indicateurs ne sont pas dans la partie relue ; à vérifier à l'assemblage : le taux de validation de façade (FR-27) est déjà un contre-indicateur de l'usage.

### Findings

- **moyenne** Contradiction entre l'apprentissage inter-secteurs et l'interdiction du croisement (FR-82 contre FR-168, FR-170) — FR-82 : « au premier jour, chaque capacité n'apprend que dans sa verticale » et un test exige qu'aucune fiche de composition ne montre un modèle entraîné avec les écarts de deux verticales « sans la finalité de croisement ; au premier jour, la finalité n'existe pas ». FR-168 autorise un entraînement transverse (lecture de pièces, contrôle de cohérence, anomalie, rédaction, résumé) sur plusieurs secteurs avec la seule finalité « apprentissage commun », et FR-170 hérite un N1 transverse dans un secteur neuf. Les deux ne se vérifient pas ensemble. *Fix:* dans FR-82, distinguer « croisement d'une même PME » (horizon) de « famille transverse déclarée au catalogue » (autorisée si FR-168), et reformuler le test de composition en conséquence.

- **moyenne** Conseil fiscal : jour 1 ou « plus tard » (FR-50 ligne cabinet « leviers fiscaux avec base légale citée » ; FR-128 « plus tard : le conseil fiscal » ; FR-111 « plus tard … au premier jour il reste dans le service de balance » ; X14) — le tableau du jour 1 présente des leviers fiscaux N0 comme servis par l'IA commune. *Fix:* retirer « leviers fiscaux » de la ligne cabinet de FR-50 ou préciser « servis par le service de balance, pas par l'IA commune ».

- **moyenne** FR-91 range la lecture de pièce parmi les capacités « de langage servies dès le premier jour par un modèle de langage (N1, origine LANGAGE) » alors que FR-5 et FR-45 imposent un N0 partout, que FR-50 sert la lecture « par N0 et OCR », que FR-140 dit « l'IA ne lit pas les pixels » et que D13 repousse la vision. Le modèle de langage fait aussi du jour 1 une dépendance du palier P1/P2 (FR-41). *Fix:* reformuler FR-91 : seules rédaction, résumé et Copilot sont de langage ; la lecture de pièce est N0 (règles et gabarits sur le texte OCR) puis N1.

## Done-ness clarity — strong

Les 174 FR portent toutes un bloc « Conséquences (testables) » (contrôle mécanique : aucune sans le bloc, aucune à moins de deux puces). Les conséquences sont des tests concrets (jeu de 1 000 décisions sans texte libre, 40 exécutions sous plafond de 30, fuite par phrase marqueur entre deux organisations, horloge avancée avant et après l'horizon d'un désaccord). Mots vagues relevés : aucun adjectif non borné (les occurrences de « suffisant » sont des noms de codes d'erreur ou de motifs). La FR est le point fort du document.

### Findings

- **moyenne** La règle que le PRD s'impose à lui-même est violée (FR-3 : « une recherche de nombre dans le texte des FR ne trouve que des nombres de loi ou des renvois à un paramètre ») — nombres durs dans le texte : 7 jours et 15 minutes (FR-60, FR-64, FR-67), 14 jours (FR-76), 72 heures / 7 jours / 30 jours (FR-66), 90 jours (FR-55), 60 jours et 45 jours dans des tests (FR-53, FR-61), « k (par défaut 5) » (FR-77), 20 % ou 1 % ailleurs. *Fix:* soit rendre la règle de FR-3 réaliste (« hors valeurs d'exemple des tests »), soit remplacer chaque valeur par son code de paramètre et ajouter la ligne à l'annexe D.

- **basse** Tests en négatif trop larges (FR-24 : aucune chaîne N0 ne contient « modèle ») — le mot « modèle » peut légitimement apparaître (« modèle de votre structure » pour une autre capacité sur le même écran, « modèle de lettre »). *Fix:* limiter le test aux libellés de provenance et de niveau.

- **basse** Le test de couverture de FR-130 ne vérifie que l'existence du FR cité, pas que ce FR traite la capacité. *Fix:* ajouter « le texte du FR cité contient le code de la capacité » ou une revue de croisement à l'assemblage.

## Scope honesty — adequate

Le hors-cible est écrit (§2.2, FR-9, FR-128, FR-146) avec les statuts `BIENTOT`, `PLUS_TARD`, `EXCLU`. Les hypothèses sont nombreuses (55 balises dans les parties relues, 15 trous T-xx du moteur renvoyés) ; c'est la bonne densité pour un PRD de pilotage mais lourde pour un feu vert de construction, donc l'index final des hypothèses est indispensable : il doit trier celles qui bloquent (revue juridique, art. 27/28, seuils de dérive) de celles qui sont des réglages.

### Findings

- **moyenne** Aucun parcours ne couvre trois décisions que le PO a jugées importantes (§2.3, FR-10) — « qui avait raison » (exigence « très important, surtout pour vendre »), les packages de vente du distributeur et l'ajout d'un secteur n'ont pas d'UJ ; FR-10 dit que les huit UJ sont « les cas de recette » de bout en bout. Les FR portent leurs tests, mais pas de parcours à protagoniste nommé, donc rien ne relie ces trois exigences à une personne. *Fix:* ajouter UJ-9 (la directrice des risques lit le taux « qui avait raison » de son agence et produit le document commercial), UJ-10 (le responsable marketing d'un distributeur valide un package, lit l'impact avec groupe témoin), UJ-11 (un partenaire ajoute un pack de secteur), et étendre FR-10 à onze parcours.

- **moyenne** Validateurs de FR-174 et de FR-65 appuyés sur une « équipe IA de Money Vibes » qui n'existe pas encore (FR-174 note finale ; FR-65 double signature ; moteur de plan « chaîne de livraison ») — plusieurs conséquences testables supposent une « chaîne de livraison » non définie dans ce PRD. *Fix:* dire dans §2.1 que le rôle IA-MV est tenu par le PO tant qu'aucune équipe n'est constituée, et renvoyer la « chaîne de livraison » à l'annexe A (module `ia`) ou au moteur d'installation.

## Downstream usability — adequate

Pour la spine, les épics et les manifestes : les familles, les paramètres, les codes d'erreur et la table X1-X16 sont directement extractibles ; les UJ ont tous un protagoniste nommé ; les renvois entre FR résolvent (contrôle : plage FR-1 → FR-174 contiguë, aucun doublon ; tous les FR cités dans FR-130 existent). Défauts de dérive entre rédacteurs :

### Findings

- **haute** Deux conventions de paramètres, des doublons et une valeur contradictoire (FR-3 ; FR-18, FR-27, FR-68, FR-70, FR-92, FR-15/FR-40, FR-17/FR-38 ; `params-w1.md`) — la partie 1 utilise `IA-Pnn` (IA-P02, IA-P11…), les parties 2 et 3 utilisent `ia.xxx`, et un même réglage porte deux ou trois noms : taux de façade = IA-P02 (FR-27) = `ia.acceptation_facade_pct` (FR-68) = `ia.objectif.acceptation_facade_pct` (FR-92) ; écart d'équité = IA-P11 (FR-18) = `ia.equite_ecart_max_pts` (FR-70) = `ia.objectif.equite_regression_max` (FR-92, FR-94) ; délai de réponse = IA-P07 (FR-15) = `ia.delai_reponse_max_s` (FR-40) ; confiance minimale = IA-P12 = `ia.confiance_min` (FR-49) ; rétention du contexte brut = IA-P10 = `ia.retention_contexte_brut_jours` (FR-38). Valeur contradictoire : `k` vaut **5** par défaut dans FR-77 et **20** dans `params-w1.md` (IA-P04) ; l'unité de l'équité diffère (« % d'écart relatif » en IA-P11, « pts » en `ia.equite_ecart_max_pts`). Le test de FR-3 (« chaque paramètre de l'annexe D renvoie à au moins une FR ») ne peut pas passer. *Fix:* garder une seule convention (recommandation : `ia.*` lisible, avec IA-Pnn comme alias dans l'annexe D), fusionner les doublons un par un, trancher `k` (recommandation : 20 en production, 5 en démonstration, deux paramètres), harmoniser l'unité d'équité.

- **moyenne** Doublons de FR qui peuvent diverger (FR-15 et FR-40 « L'IA n'est jamais bloquante » ; FR-18, FR-70, FR-94 sur l'équité ; FR-19, FR-36, FR-143 sur la santé) — les listes de variables interdites diffèrent déjà : FR-18 (origine, religion, appartenance politique, santé pour un crédit) contre FR-70 et FR-94 (genre, situation matrimoniale, nationalité, religion). Trois épics écriraient trois listes. *Fix:* une FR source par sujet (FR-18 pour l'équité, FR-19 pour la santé, FR-15 pour la non-bloquance), les autres renvoient en une phrase et ne répètent que leur test propre ; poser une seule liste fermée de variables interdites, versionnée, et l'ajouter à l'annexe D.

- **moyenne** Renvois internes périmés (§0 tableau ; §2.1 ligne JUR ; FR-35 et FR-62 notes) — §0 décrit la partie 4 comme « §14 et suivants : exigences transverses, indicateurs… » alors que §14 est « Ajouter un secteur » ; JUR renvoie à « §13 du PRD » pour les points juridiques ouverts alors que §13 est la feuille de route ; FR-35 et FR-62 renvoient à « hors périmètre, §0 » pour la voix et l'apprentissage fédéré, que §0 ne dit pas (c'est FR-9 et §2.2). *Fix:* renumérotation à l'assemblage et renvois corrigés vers FR-9 et vers la section des hypothèses ouvertes.

- **basse** Deux syntaxes d'hypothèse (`[ASSUMPTION : …]` avec espace, `[ASSUMPTION: …]` sans, parfois entre accents graves) — un index automatique les manquera. *Fix:* une seule forme, vérifiée par un balayage à l'assemblage.

- **basse** Statuts de « bientôt » et noms de codes d'erreur dispersés (`NON_INSTALLE` pour une capacité `BIENTOT` en FR-128 et pour un module non installé en FR-40/FR-43) — deux causes, un seul code. *Fix:* un code `CAPACITE_BIENTOT` distinct.

## Shape fit — strong

Un PRD de capacité commune consommée par quatre logiciels, avec parcours nommés et tableaux de contrôle de couverture, est la forme juste ; la partie 3 en tableaux « logiciel | usage | FR d'origine | vocabulaire » est l'outil de traçabilité qui convient à un PRD en tête de chaîne (spine, épics, manifestes). Le §14 (pack de secteur) est un bon exemple de capacité spécifiée par contrat et par tests, avec un exemple de secteur réutilisant ce qui existe.

### Findings

- **basse** Pas d'UJ côté partenaire ou intégrateur alors que le §14 (FR-173) ouvre un kit public (voir UJ-11 proposé plus haut).

## Couverture des 95 besoins et des décisions du PO

**95 besoins (extract-besoins-verticales.md).** Contrôle mécanique : identifiants D1-D24, M1-M38, A1-A19, C1-C14 = 95 dans l'extrait et 95 dans FR-130, différence vide ; tous les FR cités existent. Constats de fond : M26 (dictée vocale) est mappée à une FR qui la reporte (voir CRITIQUE) ; C2 (conseil fiscal) est mappée à FR-111/FR-125 alors que FR-128 le met « plus tard » (voir moyenne).

| Décision du PO (.memlog) | FR qui la portent | Verdict |
|---|---|---|
| Une seule IA, quatre logiciels, local et SaaS, même code | FR-1, FR-30 à FR-35, FR-42, FR-43 ; profils testés à l'identique | Portée, testable |
| Premières informations dès le jour 1, puis apprentissage et mises à jour vers des objectifs | FR-5, FR-45 à FR-55 (jour 1) ; FR-56 à FR-67 (boucles) ; FR-68 à FR-73 (objectifs, champion/challenger, dérive) ; FR-83 à FR-85 (sans contact) | Portée, testable ; cible du délai d'installation encore en hypothèse (FR-5) |
| « Qui avait raison », par capacité, agent, agence, client, période ; donnée d'apprentissage et preuve commerciale | FR-74, FR-75 ; FR-79 (retrait) ; FR-90/92 (vérité terrain par capacité) ; FR-164 (par secteur) | Portée, testable ; **haute** : biais de sélection non dit dans la phrase d'export |
| Packages de vente du distributeur et mesure d'impact (avant/après, groupe témoin, par package et par campagne) | FR-122, FR-121 ; paramètres `ia.package.*`, `ia.impact.*` | Portée, testable ; pas d'UJ |
| Ajouter un secteur ou un pays sans rien perturber, kit public | FR-160 à FR-174 | Portée, testable ; recoupe mal FR-82 (moyenne) |
| Voix par pack de secteur (correction D12) | — | **Non portée** (CRITIQUE) |

## Mechanical notes

- IDs : FR-1 → FR-174 contigus, sans doublon (contrôle mécanique). UJ-1 → UJ-8 contigus, chacun avec protagoniste nommé et contexte inline. X1-X16 contigus. IA-P01 → IA-P15 et IA-P80 → IA-P86 cités ; IA-P03 et IA-P05 sont définis (params-w1) mais non cités dans le texte relu : vérifier que l'annexe D les rattache à FR-27 et FR-6.
- Plages de paramètres : IA-P80 → IA-P86 viennent de la partie 4 ; vérifier l'absence de collision avec la plage réservée aux parties 2 et 3 (pas d'ID IA-P16 → IA-P79 cité dans le texte relu : les paramètres de ces parties sont nommés `ia.xxx` et n'ont donc pas de code).
- Glossaire : « Instance », « Centrale », « Écart », « Proposition » sont utilisés sans dérive de casse. « Désaccord » (FR-74) n'est pas dans le §3 ; « Pack de secteur », « Secteur », « Noyau neutre », « Vérité terrain », « Famille transverse » non plus. *Fix:* les ajouter au §3.
- Aucun client réel n'est nommé dans le texte relu. Les noms de produits tiers (moteur de reconnaissance, rails de paiement) sont des composants et non des clients.
- Hypothèses : 55 balises dans le texte relu ; l'index final doit aller et revenir (chaque balise dans l'index, chaque entrée présente dans le texte).
- Sections attendues, en cours d'écriture : indicateurs de succès avec contre-indicateurs, périmètre et non-objectifs consolidés, registre des décisions (FR-129 et FR-146 s'y réfèrent déjà : il doit exister), annexes A à D.

## Résumé des constats

| Gravité | Nombre |
|---|---|
| CRITIQUE | 1 |
| HAUTE | 4 |
| MOYENNE | 9 |
| BASSE | 5 |
