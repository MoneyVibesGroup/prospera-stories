## Annexe B. Matrice d'accès

Lecture : **D** décide ou valide ; **É** écrit (crée, saisit, modifie, exécute) ; **L** lit son périmètre ; **—** aucun accès. Les quatorze rôles et leur périmètre sont ceux du §2.1 (FR-6). **Le serveur applique la matrice** à chaque demande, indépendamment de l'écran (FR-137) ; la séparation des tâches (FR-7) s'ajoute à elle, et se mesure sur la **personne**, pas sur le rôle. Un utilisateur qui porte deux rôles agit sous l'un ou l'autre, nommé à chaque demande. **ADMIN ne lit aucune donnée métier** par l'application : il gère les comptes et les paramètres. Un rôle qui instruit, décide ou autorise de l'argent (GEST, GREC, MED, RESP, DT, DG, CPT) n'est actif qu'après la validation d'un rôle métier (FR-6). Le **comité sinistres** est une instance, pas un rôle ; ses membres votent sous leur rôle (FR-8, FR-79).

Rôles : DG direction générale ; DT directeur technique ; RESP responsable du service sinistres ; GEST gestionnaire sinistres (un volet : corporel, matériel ou risques divers) ; GREC gestionnaire recours ; MED médecin-conseil ; EXPI expert interne ; EXPE cabinet d'expertise externe (portail, ses seules missions) ; ACC chargé d'accueil-guichet ; NUM opérateur de numérisation ; ARCH archiviste ; CPT comptable règlements ; AUD contrôle interne ; ADMIN administrateur.

| Action | DG | DT | RESP | GEST | GREC | MED | EXPI | EXPE | ACC | NUM | ARCH | CPT | AUD | ADMIN | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Circuit : de la déclaration à l'offre** | | | | | | | | | | | | | | | |
| Rechercher et lire un dossier (hors donnée de santé) | L | L | L | L | L | L | L | L | L | L | L | L | L | — | 1 |
| Déclarer un sinistre | — | — | É | É | É | — | — | — | É | — | — | — | — | — | 2 |
| Ouvrir : recevabilité, attente de pièces, reprise du circuit | — | — | É | É | É | — | — | — | É | — | — | — | — | — | 3 |
| Affecter ou réaffecter un dossier | — | — | D | É | É | — | — | — | — | — | — | — | — | — | 4 |
| Instruire : prendre en charge, pièces, responsabilité | — | — | É | É | É | — | — | — | — | — | — | — | — | — | 5 |
| Décider de la garantie | D | D | D | D | — | — | — | — | — | — | — | — | L | — | 6 |
| Missions d'expertise : orienter, désigner, suivre | — | — | É | É | — | L | L | L | — | — | — | — | L | — | 7 |
| Mission : accepter, déposer ou saisir le rapport | — | — | — | É | — | É | É | É | — | — | — | — | — | — | 8 |
| Ordonner une contre-expertise | D | D | D | — | — | — | — | — | — | — | — | — | — | — | 9 |
| Passer outre un complément d'expert non revenu | — | — | D | — | — | — | — | — | — | — | — | — | L | — | 10 |
| Évaluer : arrêter le montant (décompte, barème) | — | — | É | É | É | L | — | — | — | — | — | — | L | — | 11 |
| Réviser la provision du dossier | L | L | D | É | — | — | — | — | — | — | — | — | L | — | 12 |
| **Circuit : décider et offrir** | | | | | | | | | | | | | | | |
| Valider selon la délégation | D | D | D | — | — | — | — | — | — | — | — | — | L | — | 13 |
| Siéger et voter au comité sinistres (instance) | D | D | D | — | — | — | — | — | — | — | — | — | — | — | 14 |
| Envoyer l'offre | — | — | É | É | — | — | — | — | — | — | — | — | — | — | 15 |
| Enregistrer l'accord de l'assuré ou de la victime | — | — | É | É | — | — | — | — | — | — | — | — | — | — | 16 |
| **Circuit : payer, clore, rouvrir** | | | | | | | | | | | | | | | |
| Émettre le règlement (chèque, virement, PI-SPI, Mobile Money) | L | L | L | L | L | — | — | — | — | — | — | É | L | — | 17 |
| Remettre le chèque contre quittance signée | — | — | — | — | — | — | — | — | É | — | — | É | — | — | 18 |
| Viser la note d'honoraires d'un expert | — | — | D | — | — | — | — | É | — | — | — | D | — | — | 19 |
| Clore un dossier réglé | — | — | É | É | É | — | — | — | — | — | — | — | — | — | 20 |
| Rouvrir un dossier clos, rejeté ou classé sans suite | D | D | D | — | — | — | — | — | — | — | — | — | — | — | 21 |
| **Sorties, recours, fraude** | | | | | | | | | | | | | | | |
| Refuser la prise en charge (`REJETE`) | D | D | D | — | — | — | — | — | — | — | — | — | — | — | 22 |
| Classer sans suite | D | D | É | É | — | — | — | — | — | — | — | — | — | — | 23 |
| Constater un litige, le résoudre | D | D | D | — | — | — | — | — | — | — | — | — | — | — | 24 |
| Recours : qualifier, établir la créance, mettre en demeure, négocier | L | L | D | É | É | — | — | — | — | — | — | — | L | — | 25 |
| Fraude : signaler une suspicion | É | É | É | É | É | — | — | — | — | — | — | — | É | — | 26 |
| Fraude : écarter la suspicion | D | D | D | — | — | — | — | — | — | — | — | — | D | — | 27 |
| Fraude : confirmer | D | D | — | — | — | — | — | — | — | — | — | — | D | — | 28 |
| **Données de santé, pièces, archives** | | | | | | | | | | | | | | | |
| Lire une donnée de santé (pièce médicale, taux, rapport) | L | L | L | L | — | L | — | L | — | — | — | — | — | — | 29 |
| Scanner, téléverser, rattacher une pièce | — | — | É | É | É | — | — | — | É | É | — | — | — | — | 30 |
| Contrôler une pièce avant archivage | — | — | — | É | É | — | — | — | É | É | — | — | — | — | 31 |
| Verser un dossier clos au fonds (numéro d'archivage, cote physique) | — | — | — | É | — | — | — | — | — | — | É | — | — | — | 32 |
| Reconstituer un dossier perdu, puis certifier la reconstitution | D | — | D | — | — | — | — | — | — | — | É | — | D | — | 33 |
| Détruire : proposer la liste, viser le bordereau | D | — | D | — | — | — | — | — | — | — | É | — | — | — | 34 |
| **Paramètres, comptes, contrôle** | | | | | | | | | | | | | | | |
| Paramétrer (seuils, délais, listes, matrice de délégation) | D | — | — | — | — | — | — | — | — | — | — | — | L | É | 35 |
| Créer les comptes, attribuer les rôles | D | — | — | — | — | — | — | — | — | — | — | — | L | É | 36 |
| Lire le journal des accès (consultations) | — | — | — | — | — | — | — | — | — | — | — | — | L | — | 37 |
| Lire la piste d'audit (qui a changé quoi) | L | — | L | — | — | — | — | — | — | — | — | — | L | — | 38 |
| Lire le registre de l'IA | — | — | L | — | — | — | — | — | — | — | — | — | L | — | 39 |
| Lire le rapport et le bilan de la reprise | L | — | — | — | — | — | — | — | — | — | — | — | — | L | 40 |

**Notes** (chaque case délicate cite sa FR ; en cas d'écart avec une FR, la FR fait foi).

1. **Périmètre de la lecture** (FR-6) : DG, DT, RESP, AUD lisent tous les dossiers (AUD en lecture seule) ; GEST son volet ; GREC les dossiers en recours, même clos (FR-149) ; MED les dossiers corporels qui lui sont confiés ; EXPI et EXPE leurs seules missions (EXPE ne voit ni la provision, ni le reste du dossier) ; ACC les recherches, le guichet et le statut, **sans contenu médical** ; NUM les lots de numérisation ; ARCH le fonds ; CPT les ordres de règlement et les paiements, sans donnée de santé (FR-148). Un GEST d'un autre volet reçoit « introuvable ». Le téléphone et la pièce d'identité s'affichent masqués (FR-153). ADMIN voit des comptes, des états et des motifs de rejet, jamais le contenu d'un dossier.
2. **Déclarer** : la FR-34 décrit les quatre canaux (guichet, téléphone, WhatsApp ou e-mail, courtier) sans nommer de rôle ; la saisie est faite par l'accueil, le gestionnaire, le gestionnaire recours ou le responsable. Une déclaration s'enregistre toujours, les contrôles donnent des réserves (FR-39). L'assuré n'a pas de rôle ni d'application (§2.2).
3. **Ouvrir** : transitions 1 à 3 de FR-135 (ACC, GEST, GREC, RESP). L'accueil oriente vers le volet, il n'affecte jamais (FR-50).
4. **Affecter** : seul RESP affecte et réaffecte (motif obligatoire à la réaffectation, FR-51) ; s'attribuer un dossier à soi-même est interdit (séparation n° 7). **Seule exception, tracée** : un GEST ou un GREC qui fait avancer un dossier sans titulaire le prend lui-même (FR-50).
5. **Instruire** : transitions 5 à 9 de FR-135 (GEST, GREC, RESP). DG et DT n'instruisent pas.
6. **Garantie** (FR-42) : la décision `GARANTIE_ACQUISE`, `SOUS_RESERVE` ou `REFUS_DE_GARANTIE` est prise par GEST, RESP, DG ou DT, avec un motif de 10 caractères au moins ; elle ne se saute pas ; AUD la lit. Prospera propose, l'agent décide.
7. **Missions** (FR-61, FR-62) : le gestionnaire ou le responsable désigne l'expert ; un expert hors agrément, hors domaine ou en conflit est refusé (`EXPERT_NON_ELIGIBLE`) ; EXPI et EXPE ne voient que leurs missions (FR-180).
8. **Rapport** : l'expert interne le rédige dans l'application, le cabinet avec compte le dépose par le portail (EXPE) ; pour un cabinet **sans compte**, GEST **saisit** le rapport reçu, pièce jointe obligatoire, marqué « saisi pour le cabinet » (FR-67, FR-181). MED valide le **fond médical** (FR-63) ; il ne reçoit jamais de montant de l'IA (FR-11).
9. **Contre-expertise** (FR-66) : ordonnée par RESP, DG ou DT ; un gestionnaire ne l'ordonne pas (`DROIT_INSUFFISANT`). Elle ne revient ni au cabinet auteur du rapport contesté, ni au panel interne (`CONTRE_EXPERTISE_NON_AUTORISEE`) ; séparation n° 8 et n° 9.
10. **Complément non revenu** (FR-67) : la validation est bloquée (`COMPLEMENT_NON_REVENU`) sauf passage outre de RESP avec motif, visible d'AUD.
11. **Évaluer** (FR-75, FR-7) : transition 7 de FR-135 (GEST, GREC, RESP). Au corporel, le calcul est poste par poste, **sans montant proposé par l'IA** (FR-70, FR-71) ; MED rend son avis, le gestionnaire arrête le montant. Une évaluation arrêtée n'est jamais recalculée.
12. **Provision** (FR-76) : GEST la propose et la révise avec un motif ; un écart supérieur ou égal à 2 000 000 FCFA (défaut) **attend RESP** ; DG et DT lisent. Chaque mouvement s'ajoute, jamais écrasé.
13. **Validation** (FR-78, FR-8) : défauts : jusqu'à 1 000 000 FCFA, RESP ; au-dessus, le comité puis le **visa de DT** ; un règlement **à titre commercial**, DG seul, quel que soit le montant. Le **cumul des montants validés** du dossier décide du niveau (SEP-03). **GEST et GREC ne valident jamais** (SEP-01) ; un dossier dont on est l'assuré, la victime ou le bénéficiaire ne se valide pas (séparation n° 11). Les délégations réelles sont à obtenir (§12.2, A-2).
14. **Comité** (FR-79) : par défaut 4 membres dont RESP et DT, quorum de 3 ; chaque membre présent vote avec son nom ; un membre ne vote pas sur un dossier qu'il a instruit ; DG siège s'il le décide (§2.1). Le quorum non atteint empêche la décision.
15. **Offre** (FR-84) : l'envoi est fait par GEST ou RESP ; le signataire de la validation est celui de la ligne « Valider selon la délégation » (transition 10 de FR-135). L'offre part sous 48 heures (défaut) ; l'IA la rédige, l'agent la relit et la signe (FR-83).
16. **Accord** (FR-86, FR-90) : seul l'enregistrement de l'accord (offre signée, ou procès-verbal de transaction au corporel), par GEST ou RESP, fait passer le dossier à `ORDRE_EMIS` ; **aucun ordre sans accord enregistré**. Font exception les honoraires d'expert et le règlement à titre commercial (FR-90).
17. **Émission** (FR-93) : **CPT seul** émet ; service sinistres, responsable, direction et contrôle interne **voient** les ordres et les règlements, ils ne les émettent pas. CPT peut **rejeter l'ordre** avec motif (FR-99). Un GEST qui a instruit ou validé ne peut pas enregistrer l'émission, même s'il porte aussi le rôle CPT (SEP-01, SEP-02). Si le dossier est `BLOQUE` et non écarté, l'émission est refusée (FR-130).
18. **Remise** (FR-97) : ACC ou CPT enregistre l'identité et le numéro de pièce du retirant et la quittance signée ; le champ « retiré par » n'est jamais pré-rempli. **Celui qui émet ne remet pas** : la chaîne ordre, chèque, remise est assurée par trois personnes différentes (séparation n° 3) ; celui qui décide ne remet pas (n° 4).
19. **Honoraires** (FR-182) : l'expert dépose (ou le gestionnaire saisit) la note ; RESP ou CPT la vise ; le montant visé ne dépasse jamais le montant facturé. Le paiement suit le circuit des règlements.
20. **Clôture** (FR-104) : GEST, GREC ou RESP, avec un motif écrit, si le reste à payer est zéro, les règlements sont remis, aucune mission n'est ouverte et la question du recours est tranchée.
21. **Réouverture** (FR-107, FR-126) : RESP, DG ou DT, avec un motif écrit (transitions 39, 40, 41).
22. **Refus** (FR-121) : RESP, DG ou DT, sur la base d'une décision de garantie ; courrier motivé rédigé par l'IA, relu et signé (FR-122).
23. **Sans suite** (FR-123) : GEST ou RESP, avec motif, après les relances épuisées. **Au corporel automobile**, seuls DG ou DT classent sans suite, et les échéances légales continuent de courir.
24. **Litige** (FR-124) : RESP, DG ou DT, avec motif ; le litige se résout par un retour à `EN_INSTRUCTION`.
25. **Recours** (FR-108, FR-112) : GREC mène le recours ; GEST peut le **créer** quand un tiers apparaît ; RESP valide la créance, engage le contentieux, saisit l'arbitrage et décide de l'abandon. **GREC ne valide pas sa propre créance** ; l'abandon n'est pas décidé par qui l'a proposé (`SEPARATION_DES_TACHES`).
26. **Signaler une fraude** (FR-125) : GEST, GREC, RESP, DG, DT ou AUD, avec motif. La suspicion n'est jamais révélée à l'assuré ni au courtier.
27. **Écarter** (FR-129) : RESP, DG, DT ou AUD, avec une conclusion écrite ; **le relecteur n'est jamais le gestionnaire du dossier**.
28. **Confirmer** (FR-133) : DG, DT ou AUD seulement, avec une conclusion écrite ; elle mène à `REJETE`. Un dossier `BLOQUE` non écarté suspend la validation, l'accord, l'émission et la remise (FR-130).
29. **Données de santé** (FR-9, FR-153) : lisibles par MED, par le GEST corporel affecté au dossier et par RESP, et par DG et DT **pour une décision** ; **chaque lecture est journalisée**. ACC, NUM, ARCH, CPT, AUD et ADMIN voient qu'une pièce médicale existe, sa date, jamais son contenu. EXPE ne reçoit que les pièces nécessaires à sa mission médicale. Aucune donnée de santé dans un message (FR-227) ni vers le LC (FR-196).
30. **Pièces** (FR-159) : six sources (scanner de guichet, téléversement, photo, lot de NUM, courrier numérisé, message reçu) ; l'agent rattache la pièce. La FR ne nomme pas les rôles : défaut ACC, NUM, GEST, GREC, RESP. Les experts déposent leur rapport par la ligne 8, pas ici.
31. **Contrôle avant archivage** (FR-165) : NUM pour un lot ; l'agent qui a reçu la pièce pour un dépôt au guichet.
32. **Versement** (FR-168) : GEST **propose** à la clôture, ARCH **exécute** ; le fonds ne reçoit que du terminé ; séparation n° 12 : seul ARCH verse.
33. **Reconstitution** (FR-173) : ARCH reconstitue ; DG, RESP ou AUD **certifie**, jamais celui qui a reconstitué (séparation n° 10).
34. **Destruction** (FR-175) : ARCH propose la liste ; le bordereau est visé par RESP puis par DG (défaut). **Aucun bouton « supprimer » n'existe, pour aucun rôle, ADMIN compris.** Elle est refusée sur un dossier sous contrôle, en litige ou sorti de l'archive.
35. **Paramétrage** (FR-4) : ADMIN règle, **sous la validation d'un rôle métier**, versionné et daté ; qui valide quel paramètre est à fixer à l'annexe D (le DG au minimum pour les droits, FR-6). Les **délais légaux** ne sont pas des paramètres de la compagnie (FR-14). AUD lit le journal des changements.
36. **Comptes** (FR-6) : ADMIN crée les comptes ; un rôle sensible n'est actif qu'après validation par DG ; AUD lit les créations et les retraits. La création d'un administrateur demande deux personnes (FR-238). Double authentification obligatoire pour DG, DT, RESP, CPT, AUD et ADMIN (FR-25).
37. **Journal des accès** (FR-13) : le journal des consultations est lu par **AUD seul**. Nul ne peut le modifier, ADMIN compris ; la tentative est tracée.
38. **Piste d'audit** (FR-13, FR-138) : lisible par AUD, RESP et DG.
39. **Registre de l'IA** (FR-12) : lu par AUD et RESP.
40. **Reprise** (FR-219, §6.8) : le bilan de préparation est lu par DG et ADMIN ; ADMIN voit les comptes, les états et les motifs de rejet du rapport de reprise, pas le contenu des dossiers (UJ-8).

**Séparation des tâches** (FR-7, FR-137). Chaque ligne est un test : le serveur refuse l'acte du second rôle avec le code `SEPARATION_DES_TACHES`.

| # | Cumul interdit, sur un même dossier | Règle |
|---|---|---|
| 1 | Instruire et valider | SEP-01 |
| 2 | Décider (valider) et émettre le règlement | SEP-02 |
| 3 | Émettre le règlement et le remettre | chaîne ordre, chèque, remise par trois personnes |
| 4 | Décider et remettre le chèque | SEP-02 |
| 5 | Émettre un règlement et en rapprocher le paiement | deux personnes (FR-7) |
| 6 | Modifier les coordonnées bancaires d'un bénéficiaire et émettre le règlement à son profit | deux personnes (FR-7, FR-100) |
| 7 | S'attribuer un dossier à soi-même | l'attribution est un acte de RESP (FR-50) |
| 8 | Ordonner une contre-expertise sans en avoir le droit | RESP, DG, DT seuls (FR-66) |
| 9 | Juger la contestation d'un rapport en étant son auteur | FR-66 |
| 10 | Reconstituer un dossier et certifier sa reconstitution | FR-173 |
| 11 | Valider un dossier dont on est l'assuré, la victime ou le bénéficiaire | conflit d'intérêts (FR-7) |
| 12 | Verser au fonds sans être archiviste | FR-168 |

Règles complémentaires :
- **SEP-03 : anti-fractionnement.** Le cumul des montants validés d'un même dossier décide du niveau de délégation ; un règlement fractionné en tranches sous le seuil est remonté au niveau supérieur (FR-7, FR-78).
- **Délégation d'absence.** Une personne qui s'absente peut déléguer (le DG pour le responsable, par exemple) par une délégation explicite, datée, motivée et tracée ; hors de ses dates, elle n'agit plus (FR-7). Elle ne lève aucune des séparations ci-dessus.
- **Un dossier `BLOQUE` non écarté** n'accepte ni validation, ni accord, ni émission, ni remise : le blocage ne se contourne ni par un écran ni par un cumul de rôles (FR-130).
- **Un contrôle d'anomalie après coup** (AUD, FR-210) cherche les cumuls échappés ; tolérance zéro, gravité critique pour SEP-01 et SEP-02.
- **Le test de la matrice** : un test parcourt chaque case de ce tableau, pour chacun des quatorze comptes de démonstration, côté serveur ; une case « — » doit refuser, une case « L » ne doit rien permettre d'écrire (FR-15, FR-264).
