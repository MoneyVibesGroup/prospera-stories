# Contrôle ciblé du PRD « Reprise de données »

*Objet : vérifier six axes seulement (fidélité au journal, exigences du moteur réécrit, vocabulaire, contrat de module, spine de la coque, concordance avec le PRD Connecteurs), plus une courte hygiène. Ce n'est pas une revue complète : ni style, ni exhaustivité générale. « L. n » renvoie aux lignes de `prd.md` (Reprise) sauf mention contraire ; « J. n » aux lignes de son `.memlog.md` ; « M. n » au PRD moteur réécrit ; « Conn. n » au PRD Connecteurs ; « Spine » à `ARCHITECTURE-SPINE.md` de la coque.*

**Bilan** : axe 1 : 8 tenus, 5 partiels, 0 absent · axe 2 : 2 tenus, 10 partiels, 8 absents · axe 3 : 6 écarts (dont « bascule » ×16) · axe 4 : 4 tenues, 6 partielles, 1 contredite (C8), 2 absentes (C12, C13), service incohérent avec le §4 du contrat · axe 5 : 3 tenus, 3 écarts, 2 besoins non couverts · axe 6 : 2 tenus, 8 écarts ou trous · 21 contradictions (3 critical, 11 high, 6 medium, 1 low) · 6 questions pour le PO.

---

## Axe 1. Fidélité au journal

| Point | Verdict | Preuve | Ce qui manque |
|---|---|---|---|
| QR-1 profondeur d'historique | tenu | J. 18 ; L. 195-205 et 363 : pas de borne, objectif 3 ans ou plus, historique court signalé jamais bloquant. Les bornes de J. 8 et J. 15 (12-24 mois, 3 à 5 ans, 3 cycles) sont bien écartées | — |
| QR-2 fichiers source | tenu sur le principe | J. 19 ; L. 143-144 et 364 | Le déclencheur (« réception définitive ») n'est pas défini côté Reprise : voir axe 2 |
| QR-3 libre-service prêt en février | partiel | J. 20 ; L. 298-300 et 365 | J. 20 marque la bascule « acte de Money Vibes » **[à confirmer]** ; le PRD la présente comme décision (L. 302, 365) sans marque ni point ouvert. Le journal J. 17 pose aussi un « rôle administrateur dédié » (J. 13) qui n'existe nulle part dans le PRD |
| QR-4 qui valide | tenu | J. 21 ; L. 228-234 et 366 (DG ou désigné par écrit, renvoi au consentement M. FR-27, valide) | UJ-4 (L. 82-83) et UJ-5 (L. 88-89) contredisent la règle : voir Contradictions |
| QR-5 feuille de comptage | partiel | J. 22 ; L. 367 | Le fait que la feuille soit **un écran du module Stock** n'est que dans le tableau §8 ; FR-10 (L. 206-210) ne le dit pas et ne dit pas par quel point d'import la Reprise la pré-remplit (elle n'écrit jamais chez la cible, FR-14) |
| Périmètre par métier (vivantes / historique) | tenu | J. 8 ; L. 187-193 | — |
| Paramétrage hors reprise | tenu | J. 9 ; L. 66-69 | — |
| Stock d'ouverture = comptage | partiel | J. 10 ; L. 206-210 | Le même stock est classé « données vivantes, écart à zéro » (L. 192) et réconcilié « stock compté » (L. 252), alors que FR-10 dit « à titre d'information » (L. 210) : voir Contradictions |
| IMF : amorçage par export ou API | tenu | J. 11 ; L. 127-129 | — |
| GED : clés fournies, orphelins non bloquants | partiel | J. 12 ; L. 31, 274-283 | Les deux livrables distincts (état de numérisation signé / rapport de reprise) et l'ordre étape 05 / 06 ne sont pas repris. Mineur |
| Qui fait la reprise (aujourd'hui / demain) | partiel | J. 13 et 17 ; L. 47-50, 287-302 | « Rôle administrateur dédié » (J. 13) absent ; les droits C7 (L. 351) ne le nomment pas |
| Trois pièges des répétitions de démo | tenu | J. 14 ; FR-5, FR-6, FR-7 (L. 155-175) | — |
| Reprise ≠ Connecteurs, adaptateurs partagés | tenu | J. 6 ; L. 130-132, 71 | Le partage n'a ni propriétaire ni mécanisme : voir axe 6 |
| Marques `[ASSUMPTION]` du journal (J. 15) | tenu | traitées comme acceptées puis remplacées par QR-1 | — |

---

## Axe 2. Ce que le moteur réécrit exige de la Reprise (M. §8.4, ligne « PRD Reprise de données », et autres dépendances)

| Point | Verdict | Preuve | Ce qui manque |
|---|---|---|---|
| Le feu vert est consommé par FR-8 (`MISE_EN_SERVICE_SANS_FEU_VERT`) | partiel | L. 253-255 : « fait publié, lisible par le moteur, avec le lot et le rapport » ; M. FR-8 | M. FR-8 : feu vert **sur le lot rejoué dans le réel**, **par sous-ensemble**, seulement si le sous-ensemble a un lot. L. 253-255 est global (« le moteur ne peut pas mettre le client en service »). Il faut : un feu vert **par sous-ensemble**, rattaché au lot du réel (jamais celui de l'essai), une forme publiée (topic ou route, à nommer dans la spine), et la ligne Reprise du bilan qui ne passe 🟢 qu'à lui |
| La réception définitive est consommée (suppression des fichiers) | partiel | L. 143-144 ; M. §3 « Réception définitive », M. FR-8 | Aucun événement consommé n'est nommé (C5 ne le dit pas, L. 349) ; la réception est **par sous-ensemble** (M. FR-8) alors que L. 143 parle d'une réception unique. Pour un fichier qui alimente plusieurs sous-ensembles, la suppression doit attendre la dernière réception. Pour les imports courants (UJ-5), il n'existe **aucune** réception : les fichiers ne sont jamais supprimés |
| Une réception par sous-ensemble libère les lots de ce sous-ensemble | absent | — | Le lien lot ↔ sous-ensemble n'est modélisé nulle part (un lot couvre des modules cibles, pas des sous-ensembles). Les fichiers de l'essai (autre espace) ne sont pas traités |
| C8 : écrans dans `prospera-app` **dès février** (libre-service du prospect) | absent / contredit | L. 352 : « plus tard dans `prospera-app` » ; mais L. 298 et 365 : « prêt en février » ; M. §8.4 | La ligne C8 doit dire février, avec le périmètre minimal (dépôt, rapport, validation, import) ; voir axe 5 pour l'emplacement dans la coque |
| Libre-service du prospect (M. FR-33) | partiel | L. 298-300 | Pas de parcours (UJ-5 est étiqueté « plus tard », L. 86) ; la Reprise est-elle ouverte d'office dans l'offre d'essai (M. FR-33 : « modules de l'offre proposée ») ? Qui reçoit le droit d'importer à la création de l'essai (L. 296-297 : « Money Vibes peut l'accorder », mais M. FR-35 : l'administrateur du client attribue lui-même) ? Aucun mot sur `ESSAI_PROSPECT` / `ESSAI_TERMINE` |
| Effacement du prospect non signé (M. FR-33, C13) | absent | — | M. FR-33 : « la Reprise de données comprise (fichiers sources, tables de correspondance) ». Rien dans le PRD : ni la route d'effacement par organisation, ni le certificat, ni la pseudonymisation des journaux (NFR-2, L. 318, est « ajout seul » sans exception) |
| Import de sa part du dossier d'installation (M. FR-42, A-7 : « tables de correspondance (Reprise de données) ») | partiel | L. 152-153 et 259-262 : tables enregistrées avec le lot et rejouées | Le PRD ne nomme ni le « dossier d'installation », ni le contrat d'import de sa part, ni `DOSSIER_VERSION_DIFFERENTE` (409), ni la règle « aucune donnée métier dans le dossier » (une table de correspondance contient-elle des valeurs métier ?) |
| C12 et C13 au tableau | absent | L. 10 (« C1 → C11 »), L. 343-355 (11 lignes) | Deux lignes et la correction du frontmatter : voir axe 4 |
| « Bascule » = mise en service | absent | 16 occurrences (L. 43, 47, 58, 106, 153, 184, 204, 209, 260, 270, 281, 289, 302, 330, 339, 365) | M. §3 : « Le PRD Reprise dit "bascule" : c'est la mise en service ». Remplacer partout |
| Tables de correspondance au rejeu (addendum A-7) | tenu | L. 152-153, 260 | Propriétaire unique à confirmer avec Connecteurs (axe 6) |
| « Pas de reprise de l'existant » (M. §0) | tenu (sans objet) | Le PRD ne reprend aucun droit ni aucune donnée de test | — |
| Tout octroi passe par le moteur | partiel | C1 (L. 345) : manifeste `reprise` | Rien ne dit que `reprise` s'**installe** puis se met en service comme les autres, ni dans quelles offres il figure. Le fichier `manifestes-a-produire.md` (l. 118) dit au contraire : « La reprise de données est un service de projet, pas un module vendu », alors que M. FR-7 et M. §7 C4 le traitent en module « hors offre » grisé. À arbitrer |
| Les 9 états publiés | absent | L. 345 ne cite que `REPRISE_NOT_ENTITLED` | Aucun comportement par état : voir ci-dessous |
| — `EN_INSTALLATION` (réel) | absent | M. §3.1 : garde 403 sauf identité de service du moteur sur les routes de vérification et l'export | Pendant le rejeu, avant la mise en service, **les modules cibles et la Reprise elle-même sont `EN_INSTALLATION` dans le réel** : leur point d'import et les routes de la Reprise sont donc fermés. Il faut demander au moteur/contrat une exception nommée (point d'import ouvert à l'identité de service de la Reprise ; routes de lot ouvertes pendant `EN_INSTALLATION`) |
| — `LECTURE_SEULE`, `SUSPENDU`, `ESSAI_TERMINE`, `DESINSTALLE` d'une cible | absent | L. 244-245 ne traite que « non installé » | Que fait un lot dont la cible est dans l'un de ces états ? Ligne « cible fermée (état) » au rapport, livraison refusée, jamais reportée en silence |
| — Reprise elle-même en `LECTURE_SEULE` / `SUSPENDU` | absent | — | Écriture (nouveau lot, validation) refusée ; export des rapports et correspondances à déclarer (FR-43) |
| FR-9 : bac à sable, identifiants Odoo en lecture seule | absent | L. 126 : « Odoo » sans plus | M. A-7 : pour **lire** le vrai logiciel pendant l'essai, identifiants en lecture seule propres à l'essai (écriture de test refusée). La Reprise doit dire qu'elle ne fait que **lire** la source, jamais l'écrire, et quelle Odoo elle lit en essai (bac à sable ou réel en lecture seule) |
| FR-6 : vérification « données importées » | partiel | L. 217-218 : le rapport donne les nombres par module | Il faut une **route de vérification** déclarée, appelée sous l'identité de service du moteur, avec critère chiffré (attendu = lignes de la source, seuil), et une clef d'idempotence (NFR-6) |
| FR-33 : calibration recalculée sur la reprise fraîche | partiel | L. 306-311 (FR-20) | FR-20 dit « dès la mise en service » ; M. FR-33 : calibration du prospect **dans l'essai**, recalculée après la reprise à neuf. Aucun événement « historique livré » n'est prévu pour déclencher la calibration chez la cible |
| NFR-3 cloisonnement essai / réel | partiel | L. 259-262 | Rien d'incorrect, mais le PRD ne dit pas que rapports, validations, fichiers et feux verts de l'essai **ne passent jamais** dans le réel (seul le dossier passe) ; ni que la validation du client (FR-13) est à refaire sur le lot du réel |
| Export (FR-43) des données propres de la Reprise | absent | — | Lots, rapports, correspondances : route d'export CSV/JSON ouverte en `ESSAI_TERMINE`, `SUSPENDU`, `DESINSTALLE` |

---

## Axe 3. Vocabulaire (M. §3)

| Terme | Emploi dans le PRD | Verdict | Correction |
|---|---|---|---|
| bascule / basculer | 16 occurrences, dont la définition de « Écart à zéro : la condition de bascule » (L. 106), le titre « Réconcilier et basculer » (L. 247) et SM-1 (L. 330) | synonyme interdit | « mise en service » (acte du moteur, FR-8) ; « condition de feu vert » pour l'écart à zéro ; « le jour de la mise en service » |
| réception / signer | « il signe la réception » (L. 37), « Le client le signe » (rapport, L. 113), SM-5 « signées par le client » (L. 334) | autre sens | M. : « réception définitive » = signature par le client de la fin d'installation d'un **sous-ensemble**. Ici le client **valide** (FR-13) ; aucune FR ne crée de signature du rapport. Dire « validé » ou définir un acte distinct |
| lecture seule | « historique en lecture seule » (L. 102, 183) | autre sens | M. : `LECTURE_SEULE` est un **état de module** avec une seule règle (FR-43). L'historique est une **protection par objet**. Écrire « historique protégé » (ou « non modifiable ») |
| lot | « un lot de la GED » (L. 31) et « lot de reprise » (L. 98) | homonyme dans le même PRD | « un chantier de la GED » |
| écart / écart à zéro | « écart nul » du moteur (feu vert) vs « écart à zéro » ; « file des écarts » de Connecteurs (décision humaine sur l'argent) | collision entre PRD | Aligner sur « écart nul » ou le définir comme équivalent ; distinguer « écart de reprise » et « écart de synchronisation » |
| dossier d'installation | jamais employé alors que FR-4/FR-16 le décrivent (tables rejouées) | terme absent | Employer le terme du moteur (§3) |
| espace d'essai / espace réel / feu vert / reprise fraîche / module cible | conformes | tenu | — |
| pack, préavis, installer, essai (hors espace), production | non employés ou conformes | tenu | — |

---

## Axe 4. Contrat de module (§7, L. 341-355)

Le frontmatter (L. 10) dit « C1 → C11 » ; le contrat amendé (§6) exige **treize** lignes, C12 et C13 jamais « sans objet » sans raison écrite.

| Clause | Verdict | Preuve | Ce qui manque |
|---|---|---|---|
| C1 manifeste | partiel | L. 345 : `reprise`, `depends: []`, `enrichiPar` = cibles | Champs nouveaux du manifeste (C1 amendé) : prérequis, vérifications avec critère, `retourArriere`, interrupteurs, routes d'export, routes autorisées en lecture seule. `enrichiPar` omet aussi Connecteurs si les correspondances sont partagées (axe 6) |
| C2 socle | partiel | L. 346 : gate, `REPRISE_NOT_ENTITLED` | Matrice des neuf états : un seul attendu par état et par sorte de route (lecture, écriture, export, état réglementaire) ; pas de lecture de l'horloge du conteneur |
| C3 possède ses données | partiel | L. 347 | Manquent : feux verts, journal de fusion, **clés de rattachement** (FR-18), provenance fournie à la cible (FR-2) ; contrat d'import avec champ de provenance à nommer |
| C4 fonctionne seul | tenu | L. 348 (rapport seul) ; FR-14 « non installé » | Étendre aux cibles fermées (états de l'axe 2) |
| C5 contrats nommés | partiel | L. 349 : point d'import, feu vert | Manquent : consommation de la réception définitive, route des nombres pour la vérification (M. FR-6), fourniture des clés à la GED, événement « historique livré » pour la calibration ; topics à nommer dans la spine |
| C6 données, jamais du code | tenu | L. 350 (correspondances et traductions = données par lot) | Ajouter « et même schéma pour toutes les organisations » (C6 amendé) |
| C7 droits de tenant | partiel | L. 351 : importer, valider, consulter | Les droits ne sont pas nommés `<code>:<objet>:<action>` ; fusionner les doublons (FR-12), lancer le feu vert, exporter ne sont pas couverts ; conflit possible avec `instance:*` pour l'import du prospect (axe 5) |
| C8 écrans | contredit | L. 352 « plus tard » | Février (M. §8.4, FR-33) ; périmètre minimal ; entrées déclarées dans `ecran.ts` avec droit |
| C9 désinstaller sans perte | tenu | L. 353 | Préciser l'articulation avec la suppression des fichiers à la réception (FR-3) et l'effacement (M. FR-33) |
| C10 démarrer seul | tenu | L. 354 | — |
| C11 module avec IA | partiel | L. 355 : « sans IA propre ; alimente la calibration (FR-20) » | « Sans objet » est écrit avec sa raison, c'est conforme. Mais « alimenter » reste vague : il manque le contrat qui livre l'historique à la cible avec IA, et la mention de la calibration recalculée après reprise fraîche |
| C12 rétrocompatibilité 7 jours | absent | — | `retourArriere: SANS_PERTE` ; format des lots, correspondances et règles de traduction lisible par la version précédente (un retour arrière pendant un lot en cours) ; lecteur tolérant sur les topics de la Reprise |
| C13 installable sous contrôle | absent | — | Prérequis (accès Odoo / API ; plan Custom d'Odoo Online ; espace disque) ; vérification « données importées » avec critère ; santé ; lecture de l'état publié ; routes autorisées en lecture seule ; **interception en essai** (la Reprise n'écrit jamais dans la source) ; export, import de sa part du dossier d'installation, **effacement par organisation** avec certificat ; part prise au rafraîchissement de l'essai (M. FR-10) |
| Service : « à trancher dans la spine » (L. 8) | incohérent | contrat §4 : « un agrégat distinct, c'est un service distinct » | La Reprise possède fichiers, lots, correspondances, rapports, validations (C3) : c'est un agrégat que **nul module cible** n'écrit. Le critère donne donc la réponse : **service distinct** (pas de partage avec Connecteurs, dont l'agrégat est autre). Le PRD doit l'écrire (coût de socle compris : 13 points), et la spine ne tranche plus que le **partage du code des adaptateurs** |

---

## Axe 5. Spine de la coque

| Point | Verdict | Preuve | Ce qui manque |
|---|---|---|---|
| Écrans de Money Vibes : console | tenu | L. 289-290 ; M. FR-36 | — |
| Écrans du client / prospect : `prospera-app` | écart | Spine AD-14 (Administration) : « Pour le prospect : l'import en autonomie » dans `src/modules/instance/` ; AD-3 : chaque droit commence par `<code>:` | Deux emplacements possibles pour le même écran et deux familles de droits (`instance:*` hors intersection contre `reprise:*`, L. 296). Aucun `src/modules/reprise/` n'est prévu. Le PRD doit demander à la spine : soit un module d'écran `reprise` (recommandé, droits `reprise:*`, entrées dans `ecran.ts`, AD-2 interdisant que `instance` importe `reprise`), soit une entrée d'Administration qui n'est qu'un `lienVers` |
| Imports courants du client (UJ-5) et DSI du distributeur (L. 291-293) | écart | AD-14 ne couvre que le prospect | Les écrans du réel (DSI, administrateur) n'ont aucun emplacement nommé |
| Bandeaux (AD-7) | tenu | Le PRD ne fait rendre aucun bandeau par la Reprise | — |
| Lecture seule **par objet** (historique non modifiable, FR-8 ; « montant à saisir », FR-7) | besoin non couvert | AD-7 : `<Ecriture>` ne lit que `peutEcrire` du **module** | La spine n'a pas de notion d'objet protégé. La Reprise impose aux modules cibles un marqueur par objet (`historique`, `montantASaisir`) que leurs écrans devront honorer ; à demander à la spine |
| Provenance depuis un dossier repris (FR-2) | partiel | AD-16 (emplacements, `enrichiPar`) | Le PRD ne dit pas où le lien « ligne de la source » apparaît ; c'est une contribution de la Reprise à un emplacement de chaque cible, à déclarer |
| Téléversement de fichiers volumineux (Excel, 100 000 objets, NFR-4) | besoin non couvert | AD-8 (`creerClient`, JSON typé), AD-15 | Rien sur multipart, limite de taille de corps au proxy, progression, reprise d'envoi (NFR-5 du PRD Reprise) |
| Export des données propres de la Reprise | partiel | AD-3 `actionsHorsGarde` ; AD-14 « Données » | La Reprise doit déclarer ses routes d'export pour apparaître dans l'Administration |
| Deux hôtes essai / réel (AD-19), marque d'essai (AD-12) | tenu | — | — |

---

## Axe 6. Concordance avec le PRD Connecteurs

| Point | Verdict | Preuve | Ce qui manque |
|---|---|---|---|
| Adaptateur Odoo partagé | tenu sur le principe, trou sur le fond | L. 130-132 ; Conn. 90, 119-120 | Aucun des deux PRD ne dit **qui porte le code** (bibliothèque commune ou service tiers), qui le versionne, et comment deux services distincts (axe 4) le partagent |
| Versions d'Odoo | écart | Conn. 259-273 : détection de version, deux API, générations de modèles, matrice de tests ; Reprise L. 126 : « Odoo » | La Reprise ne dit pas qu'elle bénéficie de la même couverture « toutes les versions » (QK-1), ni du prérequis plan Custom |
| Frontière « une fois » / « permanent » : chargement initial | écart | Reprise L. 192 (produits et prix, points de vente chargés comme données vivantes) ; Conn. 292 (étape 1 : clients et produits avec prix) | **Deux chemins pour le même chargement initial** : doublons et deux identités. Il faut une règle : la Reprise charge, Connecteurs prend le relais à partir d'un **point de coupure daté** |
| Transition IMF (Reprise L. 128 : « ensuite, Connecteurs maintient ») | trou | Conn. 150-153 (mouvements, jamais de totaux) ; Reprise L. 193 (soldes, capital restant dû repris comme totaux) | Pas de point de coupure ; pas de règle d'identité entre l'objet repris (identifiant d'origine, FR-2) et le mouvement reçu ensuite |
| Mode temporaire / marche en parallèle | écart | Reprise L. 264-270 (la reprise compare les deux) ; Conn. 138-140, 200-201 (le contrôle de concordance « prolonge » la vérification de la Reprise) | Deux modules comparent la même chose ; pendant la semaine en parallèle, c'est Connecteurs (mode temporaire) qui synchronise, et la Reprise ne le dit pas. Qui produit le rapport d'écarts de la semaine ? |
| Propriétaire de chaque domaine | écart | Conn. 247-253 (Odoo propriétaire des produits/prix et du stock en mode permanent) ; Reprise L. 192, 206-210 (stock d'ouverture = comptage physique du module Stock) | Si Odoo reste propriétaire du stock, il n'y a pas de module Stock ni de comptage Prospera. La Reprise ne dit pas quels domaines elle charge selon le mode (permanent / temporaire) |
| Tables de correspondance : propriétaire | écart | Reprise C3 (L. 347), M. A-7 (« Reprise de données ») ; Conn. 268-269 (renvoie à la Reprise FR-4) et Conn. C6 (« correspondances ... données par client ») | Deux propriétaires possibles. En mode permanent, la table doit survivre à la réception définitive et à la désinstallation de la Reprise ; or Connecteurs n'a `depends: []` ni `enrichiPar` vers la Reprise |
| Bac à sable : qui lit, qui écrit | trou des deux côtés | M. FR-9 et §8.4 exigent que Connecteurs reprenne liste blanche, bac à sable vérifié, identifiants en lecture seule, `ECRITURE_REELLE_DEPUIS_ESSAI` ; le PRD Connecteurs ne mentionne ni l'essai, ni l'interception, ni le bac à sable ; la Reprise est muette aussi | Dire : la Reprise **lit seulement** (réel en lecture seule ou bac à sable) ; seul Connecteurs écrit, et dans le bac à sable ou en interception |
| Effacement (prospect non signé, M. FR-33) | trou des deux côtés | — | Connecteurs : identifiants chiffrés, files, copies du bac à sable ; Reprise : fichiers, correspondances, rapports. Chacun doit exécuter l'effacement (C13) |
| Vocabulaire commun | écart | « bascule » : Conn. 47, 82, 139 (couper un domaine du logiciel du client) contre mise en service (moteur) ; « écart » (axe 3) | Distinguer « couper un domaine » de « mettre en service » et dire quand l'un suit l'autre |

---

## Contradictions

| # | Emplacement | Contradiction | Correction en une ligne | Gravité |
|---|---|---|---|---|
| 1 | L. 352 contre L. 298, 365 et M. §8.4 | C8 dit « plus tard » pour `prospera-app` alors que le libre-service du prospect est « prêt en février » | Écrire « `prospera-app` dès février (libre-service du prospect), console Money Vibes pour l'équipe » | critical |
| 2 | L. 253-255 contre M. FR-6, M. §3.1 (`EN_INSTALLATION`) | Le rejeu et le feu vert précèdent la mise en service, mais cibles et Reprise sont alors `EN_INSTALLATION` dans le réel : leurs routes d'import sont fermées | Demander au moteur et au contrat une exception nommée (import et routes de lot ouverts à l'identité de service pendant `EN_INSTALLATION`) | critical |
| 3 | L. 209 et 252 contre M. FR-8 | Le stock est compté « le jour de la bascule » et réconcilié avant le feu vert, mais le feu vert doit précéder la mise en service et le module Stock est alors fermé | Fixer le comptage **avant** la mise en service, dans le réel, et définir « comptage clos » comme feu vert du stock | critical |
| 4 | L. 192 et 252 contre L. 210 | Le stock d'ouverture est donnée vivante à écart à zéro, mais l'écart fichier / comptage n'est qu'« à titre d'information » | Sortir le stock de la règle « écart à zéro » : son feu vert est le comptage clos, l'écart fichier est informatif | high |
| 5 | L. 10, 343-355 | Onze lignes, « C1 → C11 » : C12 et C13 absentes (obligation du contrat §6 et de M. §8.4) | Ajouter les deux lignes et corriger le frontmatter (« C1 → C13 ») | high |
| 6 | 16 emplacements (L. 43 à 365) contre M. §3 | « Bascule » employé pour la mise en service | Remplacer par « mise en service » ; écart à zéro = condition du feu vert | high |
| 7 | Absence (M. FR-33, §8.4, C13) | Pas d'effacement du prospect non signé : fichiers, correspondances, rapports | Ajouter une FR d'effacement par organisation avec certificat et pseudonymisation du journal | high |
| 8 | L. 253-255 contre M. FR-8 | Le feu vert est global, la mise en service est par sous-ensemble et sur le lot du réel | Publier un feu vert par sous-ensemble et par lot du réel | high |
| 9 | L. 143 contre M. FR-8, §3 | Une réception unique supprime les fichiers ; la réception est par sous-ensemble ; aucune réception n'existe pour les imports courants | Suppression à la dernière réception des sous-ensembles du lot ; pour un import courant, un délai fixé après validation | high |
| 10 | L. 347 contre `manifestes-a-produire.md` l. 118 et M. FR-7 | La Reprise est un module à gate (`REPRISE_NOT_ENTITLED`) ici, un « service de projet, pas un module vendu » dans la liste des manifestes, un module « hors offre » dans le moteur | Trancher (question 1) puis aligner les trois documents | high |
| 11 | L. 352, 296 contre Spine AD-14, AD-3 | Le même écran d'import du prospect est dans `instance` (droits `instance:*`) selon la spine, dans `reprise` (droits `reprise:*`) selon le PRD | Demander à la spine un module d'écran `reprise` et ne laisser dans AD-14 qu'un lien | high |
| 12 | L. 8 contre contrat §4 | « Service à trancher » alors que le critère « agrégat distinct = service distinct » est applicable | Écrire « service distinct » ; la spine ne tranche que le partage du code d'adaptateurs | medium |
| 13 | L. 192 contre Conn. 292 | Produits et prix chargés par la Reprise (écart à zéro) et par Connecteurs (étape 1) | Fixer un point de coupure daté : la Reprise charge, Connecteurs ne transmet que les mouvements ultérieurs | high |
| 14 | L. 347 contre Conn. C6, 268-269 | Les tables de correspondance ont deux propriétaires possibles, sans dépendance déclarée | Un seul propriétaire (la Reprise), exposé à Connecteurs par un contrat nommé ; ajouter `enrichiPar` | high |
| 15 | L. 126 ; Conn. entier ; M. FR-9, A-7 | Personne ne dit qui lit le bac à sable ni avec quels identifiants en essai | La Reprise ne fait que lire (identifiants en lecture seule propres à l'essai) ; Connecteurs écrit en bac à sable ou en interception | high |
| 16 | L. 82-83, 88-89 contre L. 228-234 | UJ-4 : « Koffi (DSI) et le responsable sinistres valident » ; UJ-5 : l'administratrice valide seule ; FR-13 : le DG ou son désigné par écrit | Ajouter la désignation écrite aux parcours, ou assouplir FR-13 pour les imports courants (question 2) | medium |
| 17 | L. 296-297 contre M. FR-35 | « Money Vibes peut accorder » le droit d'importer, alors que l'administrateur du client attribue ses droits lui-même | « Le rôle du DSI le contient dès l'installation ; l'administrateur du client l'attribue » | medium |
| 18 | L. 334, 113, 37 contre M. §3 | SM-5 mesure des reprises « signées » sans FR qui crée une signature ; « réception » employé hors sens du moteur | Mesurer des reprises **validées** (FR-13) et dont la réception définitive est enregistrée | medium |
| 19 | L. 134-137 contre L. 143-144 | Retrouver la ligne de la source depuis tout dossier, mais les fichiers sont supprimés à la réception | Conserver un index (numéro de ligne, empreinte) sans le contenu, ou limiter FR-2 à la période de conservation | medium |
| 20 | L. 298-302 contre J. 20 | Bascule « acte de Money Vibes » présentée comme décision alors que le journal la marque **[à confirmer]** | Confirmer en séance du 13/11 (question 6) puis lever la marque | medium |
| 21 | L. 311 : « fondation n° 2 de la partie C du PRD moteur » | Renvoi introuvable dans le PRD réécrit (la règle est désormais M. §7 C6 : même schéma pour toutes les organisations) | Renvoyer à C6 amendé | low |

---

## Hygiène

- **[ASSUMPTION] non indexées** : 3 marques (L. 84, 321, 322) et aucune section de synthèse ; les chiffres d'UJ-4 et de NFR-4 (100 000 objets, 10 minutes) n'ont ni propriétaire ni date de confirmation. Ajouter un §8.3 « Inférences » comme le fait le moteur.
- **Questions ouvertes sans propriétaire ni date** : §8 dit « toutes tranchées », mais QR-3 contient une confirmation en suspens (J. 20) et les points des contradictions 10, 11, 13, 14, 15 n'ont ni propriétaire ni date. Proposer : PO le 13/11 ; spine de la coque et du moteur avant le 07/12.
- **FR non testables** : FR-1 (« ajouter une source, sans toucher au reste » : aucun test cité), FR-12 (« détecte les doublons probables » : pas de critère, ni de seuil), FR-17 (« régulièrement » : pas de fréquence), FR-18 dernière puce (« plus tard, l'OCR peut compléter » : pas de critère), FR-20 (« sert à la calibration » : aucune preuve mesurable). NFR-4 est borné par des `[ASSUMPTION]`.
- **Identifiants** : pas de doublon dans la Reprise (FR-1 → FR-20, NFR-1 → NFR-5, SM-1 → SM-5, QR-1 → QR-5, UJ-4 et UJ-5 ne rentrent pas en collision avec M. UJ-1 → UJ-3). Attention : Connecteurs reprend UJ-6 → UJ-8 puis ses propres FR-1 → FR-17, NFR-1 → NFR-6, SM-1 → SM-5 : mêmes numéros que la Reprise, d'où le préfixe obligatoire quand on se renvoie (« PRD Reprise, FR-17 »).
- **Côté Connecteurs (hors périmètre, à signaler)** : frontmatter « C1 → C11 » et tableau à onze lignes, comme la Reprise ; SM-5 dit « étapes 1 à 4 » (Conn. 323) alors que FR-17 n'en a que trois (Conn. 290-299).
- **Verticales** : le frontmatter (L. 9) omet Cabinet ; le moteur passe le cabinet par le même chemin et avertit « aucune reprise prévue » (M. FR-7). À confirmer que c'est voulu.

---

## Questions pour le PO le 13/11

| # | Question | Recommandation |
|---|---|---|
| 1 | La Reprise est-elle un **module installable** (gate, offre, ligne grisée « hors offre », manifeste) ou un **service de projet** non vendu, comme le dit `manifestes-a-produire.md` ? Et figure-t-elle d'office dans toute offre d'essai prospect ? | Module installable (M. FR-7 et C4 le supposent), ajouté en M44 à la liste des manifestes ; ouvert d'office dans l'offre d'essai, car le prospect ne peut pas essayer sans elle |
| 2 | Qui valide les **imports courants** et ceux du **prospect** : le DG pour chaque import (QR-4), ou un détenteur du droit de valider désigné par écrit une fois ? | DG ou désigné par écrit pour la reprise initiale ; pour les imports courants, un détenteur du droit `reprise:…:valider`, désigné par écrit une fois et tracé |
| 3 | Dev A livre-t-il en février des écrans `prospera-app` pour la Reprise (dépôt, rapport, validation), dans un module d'écran `reprise` ? | Oui, périmètre minimal ; la charge de Dev A pour février est à ajouter à l'amendement du plan v3 |
| 4 | Le **comptage physique** du stock a-t-il lieu **avant** la mise en service (dans le réel, module Stock encore en installation), ou le jour même après elle ? | Avant, la veille ou le matin même ; le feu vert du stock est « comptage clos » ; l'écart fichier / comptage reste informatif |
| 5 | Pour un distributeur qui **garde Odoo** (mode permanent), la Reprise charge-t-elle encore produits, prix et stock que ce logiciel possède, ou le premier chargement revient-il à Connecteurs (étape 1) ? | La Reprise fait toujours le chargement initial (rapport, validation, écart à zéro), Connecteurs prend le relais à partir d'un point de coupure daté ; les domaines gardés par Odoo restent en lecture côté Prospera |
| 6 | Confirmer que la mise en service reste un **acte de Money Vibes** sur le feu vert (J. 20, « à confirmer »), y compris quand le DSI a fait la reprise ou que le prospect a essayé seul. | Confirmer : c'est déjà le chemin 1 du moteur (console) ; lever la marque et le dire dans FR-19 |
