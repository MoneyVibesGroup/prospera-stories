# Revue qualité du PRD — Prospera Assurance (chaîne sinistres)

*Relecteur : « rubric walker » (grille `prd-validation-checklist.md`). Lecture seule. PRD : `prd.md` (4 904 lignes, 253 FR, 9 UJ, annexes A à D) et `addendum.md`. Mode rapide, haut enjeu (pré-contrat, mise en service en février 2027).*

*Méthode et limites. J'ai lu en entier les §0 à §4.7, les §5.0, §5.6, §5.13, §7 (cadre), §8 (début), §9 à §13 et l'annexe D (conflits résolus), et échantillonné le reste (FR-14, 69 à 76, 84, 102, 135, 143, 144, 262 ; annexes A et C). Les contrôles mécaniques (ID, renvois, balises) sont faits par script sur les 4 904 lignes. Je n'ai pas relu les 253 FR une à une : les constats sur les FR non lues sont indiqués comme non vérifiés.*

## Overall verdict

**Bon, utilisable pour lancer la spine et les épics, à corriger avant de geler.** Le PRD tient : une thèse nette (« une seule histoire du dossier », la phrase « Je vais vérifier et je vous rappelle » à faire disparaître), un partage franc avec le logiciel de la compagnie (FR-2), des règles à code nommé (`MOTIF_ECRIT`, `GARANTIE_ENGAGEABLE`…), des « Conséquences (testables) » presque partout, et une honnêteté rare sur ce qui n'est pas su (volumes, logiciel amont, barème corporel, pièces non togolaises). Les risques sont ailleurs : (1) aucune hiérarchie entre les 253 FR alors que le PRD reconnaît lui-même (A-16) une charge de 17 à 20 semaines pour 10 disponibles ; (2) des incohérences résiduelles entre le corps des FR et l'annexe D qui « fait foi » (FR-3, FR-176, « 41 » contre 42 transitions, arrondi à 5 000 FCFA contre les montants du dossier de référence) ; (3) des cibles de succès sans valeur ni valeur de départ pour la promesse centrale.

**Aucun constat critique. 3 hauts, 6 moyens, 8 bas.**

## Decision-readiness — adequate

Les décisions sont écrites comme des décisions : tableau P-1 à P-13 (PO) et D1 à D21 (recommandations de la rédaction) au §12.1, avec renvoi aux FR ; chaque décision de la rédaction est clairement dite « recommandation, pas engagement de la compagnie » (§0, §12.1). Les compromis sont nommés avec ce qui est abandonné : le phasage S8/S16/S24 de la v2 est écarté (P-3), la démo est corrigée sur sept points (§0), le seuil unique de 2 000 000 FCFA devient une matrice à niveaux (annexe D, « Conflits résolus »). Les « Actions qui restent au PO » (A-1 à A-19, §12.2) disent ce que le PRD fait en attendant et ce que chaque point bloque : c'est du vrai pilotage, pas des questions rhétoriques.

Ce qui manque : la tension la plus lourde n'est pas arbitrée. A-16 (« Charge de février : dire si elle tient ») et le risque « La charge de février » (§12.3) renvoient la question au PO sans proposer de coupe ni d'ordre de livraison, alors que tout le reste du PRD pousse le périmètre au maximum (circuit complet, 14 usages d'IA, OCR réel, LC fictif, reprise). Un lecteur décideur sort avec un constat, pas avec une option. Il n'y a aucune balise `[NOTE FOR PM]` (0 occurrence) : la convention équivalente est la table A-x, qui joue le rôle mais ne marque pas le texte aux endroits de tension.

### Findings
- **haute** Aucune priorité entre FR malgré une charge reconnue hors de portée (§12.2 A-16, §12.3, §10.1) — Les 253 FR sont à plat ; §10.1 dit « tout le circuit, avec l'IA, sauf la voix » ; A-16 chiffre 17-20 semaines pour 10. Les épics ne pourront pas ordonner. *Fix :* ajouter une colonne « Priorité » (noyau du jour 1 = parcours UJ-1 et UJ-3 jusqu'au chèque, sécurité, trace, reprise ; « jour 1 si capacité » = IA hors extraction/OCR, expertises avancées, recours, états de réassurance) dans l'annexe A, et reformuler A-16 en décision : « le PO tranche entre option 1, 2, 3 d'ici le … ».
- **moyenne** Pas de marquage des tensions dans le corps (0 `[NOTE FOR PM]`) — Les points de tension (A-12 barème corporel, A-16 charge, A-10 amendement PRD Reprise) ne sont lisibles que dans §12. *Fix :* poser une balise courte dans FR-70, FR-214 et §10.1 renvoyant à l'action A-x.

## Substance over theater — strong

Pas de théâtre de personas : les quatorze rôles (§2.1) ne sont pas des personas mais des codes de droits, chacun relié à des transitions précises (FR-135, annexe B) ; le comité est correctement dit « instance, pas rôle ». Les neuf parcours (UJ-1 à UJ-9) ont un protagoniste nommé et des montants vérifiables (UJ-3 : 445 500 → 395 500, franchise 10 % min 50 000 : le calcul est juste). Pas de théâtre d'innovation : l'IA est tabulée par usage avec entrée, sortie et destinataire (FR-10), la règle « jamais de montant en corporel » est un garde-fou testé (FR-11, FR-71). Les NFR sont honnêtes : FR-250 refuse d'inventer une cible (« Aucune cible n'est inventée avant cette mesure ») ; les chiffres d'origine douteuse portent leur balise (SMIG 52 500, délais du mémoire sénégalais). La vision (§1) est spécifique : elle ne se transpose à aucune autre verticale.

Réserve : le PRD est volumineux au point que la substance se dilue par endroits (voir « Downstream usability », doublons §4/§8).

### Findings
- **basse** Indice d'identification du client par « même groupe au Sénégal » (§0, §12.3, annexe D, ≈ 20 occurrences) — La compagnie n'est jamais nommée, conformément à la consigne ; mais « compagnie du même groupe au Sénégal » + « IARD au Togo » restreint fortement l'identité à qui connaît le marché. *Fix :* si le PRD sort du cercle du PO, remplacer par « une compagnie sœur, hors Togo » ; sinon, laisser.

## Strategic coherence — adequate

La thèse est stable de bout en bout : un dossier, une histoire, à côté du logiciel de la compagnie. Le tableau des « promesses de la v2 » (§1) est relié à des mesures (§9), les contre-indicateurs (§9) sont bien choisis (qualité d'instruction, équité du règlement, écarts d'IA, charge, papier/numérique) et cohérents avec le risque d'une IA qui accélère au détriment de la qualité. Le type de périmètre (plateforme interne + circuit complet) est assumé.

Les faiblesses : (a) la mesure de la promesse centrale — « Je vous rappelle disparu » (§9, première ligne « en service ») — n'a ni cible ni valeur de départ (« en hausse ; valeur de départ prise au démarrage ») ; (b) onze lignes du tableau « en service » sont « en hausse / à fixer à la séance d'immersion » ; (c) le périmètre « tout au premier jour » est une décision du PO mais n'est pas relié à une thèse de séquencement : le PRD ne dit pas pourquoi la valeur arrive si tout arrive, ni ce qui arrive en premier si la charge ne tient pas (cf. haute ci-dessus).

### Findings
- **moyenne** Les indicateurs de succès n'ont pas d'identifiant ni, pour la promesse centrale, de cible (§9) — Pas de SM-n ; 11 lignes sur 22 sans cible (« en hausse », « valeur de départ au démarrage »). *Fix :* numéroter SM-1…SM-n ; pour chaque ligne sans cible, poser une cible provisoire balisée `[ASSUMPTION]` (par exemple « 70 % des appels traités pendant l'appel à 3 mois, 90 % à 6 mois ») plutôt que « en hausse », qui n'est pas vérifiable ; dire qui mesure la valeur de départ et quand.
- **basse** Le PRD ne justifie pas le séquencement interne du « jour 1 » (§10.1) — *Fix :* voir la haute « Aucune priorité entre FR ».

## Done-ness clarity — strong

C'est la dimension la plus forte. Chaque FR lue porte des « Conséquences (testables) » avec valeurs, codes de refus nommés et cas limites : FR-69 (franchise 78 000 puis 50 000 minimum, indemnité jamais négative), FR-70 (conditions par poste, `CONDITION_POSTE_NON_REMPLIE`, `TABLE_NON_VALIDEE`), FR-76 (écart de 2 500 000 → `EN_ATTENTE_RESP`), FR-135 (42 transitions avec rôle, condition, motif), FR-139 (graphe vérifié par test, chemin nominal rejoué sur `SIN-2026-9002`). Les mots vagues sont quasi absents (« rapidement », « facilement », « convivial », « raisonnable » : 0 ; « simple » : 6, tous dans un sens technique). Le PRD dit aussi quand une valeur est un défaut à confirmer (annexe D, colonne source).

Les trous : arrondi (voir findings), délais en heures sans calendrier pour le paiement, NFR sans seuil (RPO/RTO, écrans de travail, OCR, resynchronisation nocturne), et des FR très longues où plusieurs règles sont fondues dans un seul paragraphe.

### Findings
- **haute** Le corps de plusieurs FR contredit l'annexe D qui « fait foi » (FR-3 l.242, FR-14 l.430, FR-176 l.2730, §10.2 l.3837, D5 l.3892, A.1 l.4176) — Exemples : FR-3 affirme « 15 minutes avec une interface, 1 jour avec des fichiers » alors que l'annexe D (« Conflits résolus ») garde 24 heures (FR-201) ; FR-176 dit un test de restauration annuel, FR-236 mensuel ; FR-14 cite « rapport d'expert sous 7 à 10 jours » alors que la valeur gardée est 7 jours (FR-184) ; §10.2, D5 et A.1 disent « 41 transitions » alors que le tableau FR-135 et son test en comptent **42**. Le principe « l'annexe D fait foi » protège le PRD, pas les rédacteurs d'épics qui lisent la FR : ils testeraient la valeur écartée. *Fix :* une passe de réconciliation : remplacer chaque valeur chiffrée du corps par « voir `paramètre`, annexe D » (ou la valeur gardée), et corriger « 41 » en « 42 » (3 endroits). Ajouter un test de recette « aucune valeur numérique d'un paramètre D n'est écrite en dur dans une FR ».
- **moyenne** Règle d'arrondi contradictoire avec le dossier de référence (FR-73 l.1121, FR-262 l.3723, UJ-3, §3, FR-69) — FR-73 arrondit les montants non corporels à 5 000 FCFA et FR-262 impose « sans arrondi caché » selon FR-73 ; mais le dossier de référence `SIN-2026-9002` donne une évaluation de 395 500 FCFA (UJ-3, §3) et l'exemple de test de FR-69 une indemnité de 702 000 FCFA : aucun n'est multiple de 5 000. FR-17 exige en outre un jeu « cohérent au franc près ». Le champ d'application de l'arrondi (matériel automobile ? « autres formulaires » ?) n'est pas dit. Le parcours n° 1 de la démo peut donc échouer sur un détail. *Fix :* dire dans FR-73 à quels formulaires s'applique l'arrondi (probablement : provision d'ouverture et « autres formulaires », pas le matériel automobile), ou arrondir l'exemple 395 500 → 395 000 et corriger FR-69/UJ-3/§3 ; ajouter un cas de test avec le résultat arrondi attendu.
- **moyenne** NFR : seuils absents ou non tranchés (FR-250 à 252, §12.2 A-14) — Pas de cible pour les écrans de travail (« mesurée sur le jeu », FR-250), RPO/RTO « non tranchés » (FR-252), disponibilité « sans engagement » (FR-251), aucune durée visée pour l'OCR d'un lot, la resynchronisation nocturne (FR-217) ni l'export (FR-193). Pour une mise en service chez un client, la recette n'a pas de critère d'acceptation sur ces points. *Fix :* poser des valeurs provisoires balisées `[ASSUMPTION]` (par exemple RPO 24 h, RTO 8 h ouvrées, fiche du dossier < 3 s au 95e centile, resynchro nocturne terminée avant 6 h pour N dossiers) à confirmer avec le test de FR-23, plutôt qu'aucune cible.
- **basse** « 72 heures » non qualifié en heures ouvrées (FR-102, FR-14, annexe D) alors que « 48 heures ouvrées » l'est (FR-84) — L'échéance interne de paiement peut s'entendre calendaire ou ouvrée. *Fix :* préciser, et lier au calendrier ouvré de la compagnie (A-18).
- **basse** « Évalué » défini de deux façons (§3 contre FR-75 et UJ-3) — §3 : montant arrêté par le gestionnaire au terme du décompte ; FR-75 : le décompte est un « repère » et le montant arrêté peut différer avec motif ; UJ-3 : « l'évaluation arrêtée est le résultat de ce décompte ». *Fix :* définir « Évalué = montant arrêté par le gestionnaire ; le décompte est son repère ; un écart exige un motif », et corriger UJ-3.
- **basse** FR très longues, plusieurs règles par paragraphe (FR-14 ≈ 18 lignes de prose dense, FR-70 un seul paragraphe sur ~15 articles) — Difficile à extraire en stories. *Fix :* découper en puces (une règle, un article, une valeur) ; non vérifié sur les autres FR.

## Scope honesty — adequate

Les omissions sont explicites : §10.2 (14 exclusions avec renvoi FR), §11 (13 non-objectifs formulés comme garde-fous métier), « bientôt » jamais simulé (FR-22), pièces non togolaises traitées comme modèles et non comme règles (§0, §11). La pratique des `[ASSUMPTION: … ; à confirmer à la séance d'immersion]` est constante et indexée au §13 (13.1 immersion, 13.2 juridique), avec une revue juridique obligatoire avant la mise en service (FR-24, A-15). Aucun faux « à décider » : les points ouverts disent ce que le PRD fait en attendant.

Réserve forte : la densité d'éléments ouverts est très élevée pour un PRD « feu vert à construire ». Le corps porte 181 balises (178 dans §0-§7, 74 de plus dans les annexes), 19 actions A-x, 9 risques, 11 points juridiques. Le PRD l'assume (« recommandations de la rédaction »), mais l'index ne distingue pas les hypothèses sans conséquence (reprises de la microfinance : durée de session, arrondi) de celles qui peuvent faire basculer une exigence (SMIG, base de la pénalité, matrice de délégation, existence d'un fonds de garantie). La conséquence la plus lourde est dans l'ombre : sans les tables du barème corporel (A-12, images à saisir), « calcul corporel impossible », et aucun mode dégradé n'est défini pour le jour de la mise en service.

### Findings
- **haute** Aucun mode dégradé si les tables du barème corporel ou la revue juridique ne sont pas prêtes à la mise en service (FR-70, A-12, A-15, FR-24, §12.3) — `TABLE_NON_VALIDEE` bloque le poste « en production », A-12 dit « Calcul corporel impossible sans elles » et A-15 « bloque la mise en service ». Le PRD ne dit pas si le volet corporel s'ouvre sans calcul (montant saisi à la main avec motif, comme le papier aujourd'hui), reste en lecture, ou retarde tout. Or le corporel porte les seules échéances légales avec pénalité (UJ-4, FR-141). *Fix :* ajouter dans FR-70 ou FR-24 une exigence « si les tables ne sont pas validées à la date de mise en service, le volet corporel fonctionne en saisie manuelle motivée, avec échéances légales actives, et l'écart est tracé » ; ou l'écrire comme option à trancher en A-12.
- **moyenne** Index des hypothèses sans gravité et chiffres inexacts (§13, ligne 3955) — L'index annonce « 176 balises dans son corps (§0 à §7) » ; le décompte donne 178 dans §0-§7 et 74 de plus dans les annexes (non indexées). *Fix :* corriger le chiffre, ajouter une colonne « effet si faux : faible / moyen / bloquant » et trier les ~20 hypothèses bloquantes en tête de §13.1 pour la séance d'immersion.

## Downstream usability — adequate

Points solides : glossaire complet (§3, 36 termes) avec la distinction utile contre-expertise / expertise contradictoire ; cinq montants toujours nommés ; 9 UJ avec protagoniste nommé et contexte porté dans le texte ; annexe B (matrice d'accès), annexe A (contrat de module, 13 lignes) et annexe D (paramètres avec source) conçues pour être extraites. Renvois résolus : sur les 253 FR définies, aucun renvoi cassé (voir « Mechanical notes »).

Points faibles : (1) §8 reprend des FR de §4 et §7 avec les mêmes valeurs (FR-254/FR-25 : 8 h et 30 min ; FR-252/FR-236 ; FR-255/FR-13 ; FR-256/FR-174) — un changement futur divergera ; (2) 37 renvois `PRD-D FR-n` rendent plusieurs FR (FR-1, FR-10, FR-13) dépendantes d'un autre PRD pour être testées ; (3) l'identifiant nu « FR-26 » ou « FR-249 » désigne, aux l.3405 et 3442, une FR d'un autre PRD alors que ce PRD a des trous exactement à ces numéros.

### Findings
- **moyenne** Exigences dupliquées entre §4/§7 et §8 (FR-254 = FR-25 ; FR-252 ≈ FR-236 ; FR-255 = FR-13 ; FR-256 ≈ FR-174 ; FR-257 ≈ FR-232/FR-234) — Deux exigences avec les mêmes chiffres doublent les stories et divergent à la première modification (déjà arrivé : FR-3/FR-201, FR-176/FR-236). *Fix :* réduire §8 à un tableau de renvois (« NFR → FR porteuse »), ne garder en §8 que ce qui est nouveau (FR-250, FR-258 à FR-264).
- **basse** Identifiants nus ambigus (l.3405 « PRD-D FR-249 » bien préfixé, mais l.3442 « PRD moteur FR-26 à FR-31 » côtoie les trous 26-29 de ce PRD) — *Fix :* toujours préfixer (« PRD moteur FR-26 ») ; déjà fait presque partout, vérifier les occurrences restantes.
- **basse** Trous de numérotation non expliqués : FR-26 à FR-29, FR-229, FR-240, FR-242-243, FR-247-249 — Probablement des plages réservées ou des FR fusionnées. *Fix :* une phrase au §0 (« numéros réservés, non utilisés ») pour éviter que les épics cherchent des FR manquantes.

## Shape fit — strong

Le produit est un outil métier multi-rôles, avec un client externe, un système voisin qui fait foi, des obligations légales et une installation chez le client : les UJ à protagoniste nommé, une matrice d'accès, une machine à états et un contrat d'échange sont la bonne forme. La contrainte « regulatory » (Code CIMA) est traitée avec la traçabilité qu'il faut : articles cités uniquement quand lus (SÛR), le reste « à vérifier par le juriste ». Le PRD est brownfield par rapport à la démo et le dit (écarts à la démo relevés en §5.7 et §5.15 ; correspondance 11 statuts/anciens statuts, FR-134). Rien de sur-formalisé au sens de la grille ; la longueur est celle d'un produit à 14 rôles et 15 statuts.

### Findings
- **basse** Statut du document non à jour (front matter `status: draft` ; ligne 15 « Reste à faire : réconciliation avec les sources, relectures, tri des hypothèses, passe de style ») — Cohérent avec le mode rapide, mais le PRD dit à la fois « passe de cohérence faite » et laisse des contradictions (voir haute). *Fix :* mettre à jour ce paragraphe après la réconciliation et indiquer ce qui reste réellement.

## Mechanical notes

- **ID.** FR-1 à FR-264, 253 FR définies, aucun doublon. Trous : 26-29, 229, 240, 242-243, 247-249 (non expliqués). Renvois `FR-n` : tous résolus, sauf deux (26, 249) qui désignent des FR d'un autre PRD, correctement préfixées au contexte. FR définies jamais référencées ailleurs : FR-40, 116, 254-259, 261, 263 (normal pour les NFR et les feuilles terminales ; les NFR doublonnent des FR ailleurs, voir moyenne). UJ-1 à UJ-9 : contigus, tous nommés. Pas d'ID de SM (voir moyenne).
- **Transitions.** Tableau FR-135 = 42 lignes ; §10.2, D5 et A.1 disent 41.
- **Hypothèses.** 181 balises avant l'index (178 dans §0-§7, 74 dans les annexes). L'index annonce 176 et la somme de sa colonne « Nb » est 176 ; l'écart avec le corps (178) n'est pas expliqué. Aucune balise `NOTE FOR PM` ni `NON-GOAL` : les exclusions sont dans §10.2 et §11, les actions dans §12.2.
- **Cohérence texte/annexe D.** Quatre valeurs écartées survivent dans le corps (FR-3, FR-14, FR-176, plus « 41 » ci-dessus) ; l'annexe D les traite en « Conflits résolus » mais le corps n'a pas été réaligné.
- **Glossaire.** Pas de dérive notable constatée sur l'échantillon (contre-expertise / expertise contradictoire distinguées ; `DEC-` / numéro de sinistre / `ARC-` distincts) ; seule « Évalué » est définie de deux façons (basse).
- **Nom du client.** Recherche de noms de compagnies et de groupes courants dans `prd.md`, `addendum.md` et les annexes : aucune occurrence ; la consigne est respectée. Réserve : « même groupe au Sénégal » (basse).
- **Sources hors PRD.** Le PRD s'appuie sur `.memlog.md`, `plan-redaction.md` et `coherence.md` du dossier ; aucun renvoi cassé constaté vers le dossier, mais ces fichiers sont des brouillons : si le PRD sort du dépôt, les D1-D21 doivent être autoportantes (elles le sont au §12.1).

## Récapitulatif des constats par gravité

**Critique (0).**

**Haute (3).**
1. Aucune priorité entre les 253 FR malgré une charge reconnue hors de portée (A-16).
2. Corps des FR en contradiction avec l'annexe D (FR-3, FR-14, FR-176, « 41 » contre 42 transitions).
3. Aucun mode dégradé du volet corporel si barème et revue juridique ne sont pas prêts (FR-70, A-12, A-15).

**Moyenne (6).**
1. Pas de SM-n ; promesse centrale sans cible (§9).
2. Arrondi à 5 000 FCFA contre 395 500 / 702 000 (FR-73, UJ-3, FR-69, FR-262).
3. NFR sans seuil (FR-250 à 252, A-14).
4. Index des hypothèses sans gravité (densité non triée) et chiffre 176 inexact (§13).
5. Doublons §4/§7 contre §8 (FR-254, 252, 255, 256, 257).
6. Aucun marquage des tensions dans le corps (0 `[NOTE FOR PM]`).

**Basse (8).** Même groupe au Sénégal (indice d'identification) ; séquencement interne non justifié ; « 72 heures » non ouvrées ; « Évalué » défini deux fois ; FR très longues (FR-14, FR-70) ; identifiants nus ambigus (FR-26, FR-249) ; trous de numérotation ; statut `draft` et « Reste à faire » à mettre à jour.
