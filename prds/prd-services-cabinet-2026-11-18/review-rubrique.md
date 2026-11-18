# Revue de qualité du PRD — Les services du cabinet : financement, archivage, missions, paie

Fichier relu : `prd.md` (statut `final`, 25 FR, 9 NFR, 4 UJ, 12 décisions D-SC, 6 questions, 6 hypothèses). Pas d'`addendum.md` lu (hors périmètre demandé).

## Verdict global

Le PRD est lisible, honnête sur ses non-objectifs et ses hypothèses, et son ordre de valeur est tranché. Mais il n'est pas prêt à être découpé en stories sans correctifs : le cloisonnement des données de paie se contredit (FR-21, FR-24, FR-8, NFR-2, tableau §2), le flux d'argent des honoraires n'est pas démontré conforme à SM-1 (FR-15), la numérotation des factures et des bulletins est sous-spécifiée (FR-14, FR-23), et UJ-4 appelle des taux que FR-20 ne publie pas. Le statut `final` est prématuré. Note : Passable (« Fair ») : plusieurs constats élevés, aucun dimension cassée.

## Decision-readiness — adequate

Les décisions D-SC-1 à D-SC-12 sont énoncées comme des décisions, avec auteur et date quand c'est le PO. Mais les arbitrages coûteux sont survolés : D-SC-10 renverse FR-F28 (la paie hors Prospera) en une ligne, sans nommer ce qu'on abandonne (responsabilité sur un bulletin faux, revue juridique que la microfinance impose, charge de conformité) ni la preuve de demande (le message du cabinet cite le « suivi RH », pas la fabrication de la paie). D-SC-4 (« par référence, sans copie ») est présentée comme un gain sans son coût (voir findings). L'ordre PO (financement d'abord) diffère de l'ordre de gain du cabinet (archivage d'abord) : c'est assumé au §1 mais la raison n'est pas donnée.

### Findings
- **medium** Renversement de FR-F28 sans coût nommé (D-SC-10, §4.5) — pas de risque juridique ni de condition d'entrée. *Fix :* ajouter une ligne « ce qu'on accepte » et une revue juridique/fiscaliste obligatoire avant la mise en service de P1.
- **medium** Statut `final` avec Q-SC-1, Q-SC-4, Q-SC-5, Q-SC-6 ouvertes et 4 hypothèses actives. *Fix :* statut `draft-validé` ou lister, par lot, les questions bloquantes (Q-SC-4 bloque P1, Q-SC-5 bloque FR-19, Q-SC-6 bloque M1 et P1).

## Substance over theater — adequate

Peu de théâtre : quatre parcours à protagonistes nommés qui pilotent des FR réelles. Les NFR sont majoritairement des règles précises (entiers FCFA, SHA-256, 404 hors portée), pas des adjectifs. Faiblesses : NFR-1 et NFR-9 sont de la procédure, pas des seuils ; NFR-6 (« accès tracé », « pas de donnée nominative vers l'IA commune ») n'est testable qu'avec une définition de « donnée nominative ».

### Findings
- **low** Section 8 : deux cibles sont « suivi mensuel » (pages versées, bulletins) — ce n'est pas une cible. *Fix :* chiffrer ou retirer.

## Strategic coherence — adequate

Thèse claire : « le cabinet vend, produit et facture ses quatre services ». Le fil financement → archivage → missions → paie suit l'ordre du PO. Les indicateurs sont orientés usage, avec contre-indicateurs (bien). Mais la thèse repose sur un seul cabinet (message du 18/11), et l'indicateur « dossiers refusés par la banque pour pièce manquante » n'est pas mesurable : Prospera ne reçoit que le motif de refus en texte libre (FR-1) et la banque n'est jamais utilisatrice.

### Findings
- **medium** Contre-indicateur non mesurable (§8, ligne 1 ; FR-1 `REFUSE`). *Fix :* ajouter un motif de refus codé (liste fermée dont « pièce manquante »), sinon retirer l'indicateur.
- **low** Vision mono-source (§1). *Fix :* écrire « un cabinet partenaire » comme hypothèse à confirmer auprès d'un second cabinet (relier à Q-SC-1).

## Done-ness clarity — thin

C'est la dimension la plus fragile pour le découpage en stories.

- FR-3 promet un « exemple de référence » (25 000 000, 12 %, 48 mois) mais n'écrit pas la valeur attendue : « mensualité et total des intérêts écrits dans le test ». Le critère d'acceptation n'est pas dans le PRD. En outre « 12 % » est ambigu (taux annuel proportionnel /12 ou actuariel ; base de jours) et l'arrondi n'est défini que pour la dernière échéance (« se reporte sur la dernière »), pas pour les intérêts de chaque période (NFR-3 dit « arrondi écrit une fois » sans le dire).
- FR-1 : machine d'états sans table de transitions. Peut-on revenir de `PRET` à `BROUILLON` ? De quels états part `ABANDONNE` ? Quel est l'état d'une « nouvelle version » après `REMIS` ? Et deux moments de figement coexistent : « un dossier REMIS ne se modifie plus » (FR-1) et « Générer fige une version » (FR-5) ; le lien entre PRET, génération et REMIS n'est pas dit.
- FR-4 : « les 19 indicateurs » (non listés dans le PRD) ; « seuils sectoriels du paquet » (« paquet » non défini au §3).
- FR-9 : « indexation assistée par la lecture du document quand elle existe » n'est pas une exigence.
- FR-11 : « retrouver une facture de 2019 en une minute » (UJ-2) n'a aucun seuil de performance associé.
- FR-13 / FR-14 : effet de `RESILIEE` / `TERMINEE` sur les abonnements en cours (arrêt, prorata, dernière facture) non dit ; qui déclenche la facture du forfait « à la signature » (automatique ou manuel) non dit.
- FR-19 : « quota de l'offre » n'existe pas encore (Q-SC-5).

### Findings
- **high** Exemple de référence de FR-3 sans valeurs ni convention de taux. *Fix :* écrire dans FR-3 la mensualité attendue, le total des intérêts et la convention (taux annuel nominal, périodicité mensuelle, taux périodique = annuel/12, arrondi à l'entier au franc le plus proche, ajustement sur la dernière échéance), plus un second exemple en amortissement constant.
- **high** FR-20 ne couvre pas ce qu'UJ-4/FR-22/FR-23 consomment (§4.4, §2.2). Le parcours saisit des heures supplémentaires, mais FR-20 liste CNSS, AMU, barème, SMIG, abattements : ni majorations d'heures supplémentaires, ni congés, ni autres charges patronales éventuelles. Avec la règle « valeur sans source ⇒ calcul refusé », UJ-4 serait refusé tel qu'écrit. *Fix :* compléter la liste FR-20 depuis le Code du travail et le CGI, ou retirer heures supplémentaires d'UJ-4/FR-22 au jour 1.
- **medium** Q-SC-4 bloque P1 sans plan de repli (§10, FR-20). *Fix :* écrire le critère de sortie de P1 : « bulletin calculé de bout en bout sur un référentiel complet sourcé », sinon P1 se limite à salariés + éléments du mois.
- **medium** Table de transitions absente (FR-1, FR-13). *Fix :* ajouter un tableau état → états permis → droit requis, et trancher le moment du figement (proposition : la génération fige, `PRET` exige une version figée, `REMIS` la référence).
- **medium** Lots sans couverture : FR-4 (DSCR, capacité d'endettement, autonomie financière) et FR-6 (scénarios) ne figurent dans aucun lot F1/F2 (§7) ; F2 ne contient que 3 items pour « quatre stories ». *Fix :* ventiler les 25 FR par lot (tableau FR → lot) et compter quatre stories par lot.
- **low** UJ-3 dit « forfait au volume » alors que FR-12 sépare « forfait » et « au volume ». *Fix :* aligner.

## Scope honesty — adequate

Les non-objectifs sont explicites et utiles, les hypothèses sont étiquetées, les FR « lot suivant » (FR-16, FR-25) sont signalées. Problèmes de cohérence entre non-objectifs et FR :

- « Aucun portail du client final » / « le client n'a pas de compte » vs FR-13 (lien d'acceptation à usage unique) et FR-15 (lien de paiement) : ce sont deux surfaces publiques pour le client. La limite acceptable (page sans compte) devrait être dite.
- « Aucune destruction d'archives » est cohérent avec FR-11, mais FR-10 ajoute une « restitution » physique dont l'effet sur l'archive numérique, l'inventaire et NFR-7 n'est pas décrit (G2 ne traite que la restitution numérique).
- FR-16 et FR-25 sont numérotées comme des FR alors qu'elles sont hors périmètre : risque de les voir découpées en stories.

### Findings
- **high** Lien d'acceptation sans spécification de sécurité et mission signée qui « remplace » `MANDAT_ATTESTE` (FR-13, H-SC-1). Une acceptation par lien est une preuve plus faible qu'une attestation ; si elle sert de preuve de mandat devant l'administration fiscale, la décision dégrade une règle existante. Manquent : expiration, destinataire (qui reçoit le lien), preuve d'identité du signataire, révocation, rejeu, traitement d'un lien transféré. *Fix :* spécifier le lien (durée, usage unique, canal, journalisation IP/horodatage, empreinte) et conserver `MANDAT_ATTESTE` accepté comme preuve alternative ; ne « remplacer » qu'après revue fiscaliste ; dire ce qui arrive aux dossiers existants.
- **low** FR-16 et FR-25 devraient être marquées « [NON-GOAL jour 1] » dans leur titre, ou déplacées en §7 « lots suivants ».

## Downstream usability — adequate

IDs FR-1 à FR-25, NFR-1 à NFR-9, UJ-1 à UJ-4, D-SC-1 à 12, Q-SC-1 à 6, H-SC-1 à 6 : contigus et uniques. UJ ont chacun un protagoniste nommé (Kafui, Edem, Sena). Un renvoi est faux et dangereux pour les stories : FR-7 dit « mission rattachée (FR-12) » alors que la mission est FR-13 (FR-12 est le catalogue). La numérotation `ARC-AAAA-<code client>-NNNNN` (FR-7) n'est pas définie : séquence par client ou par cabinet, unicité entre cabinets dans un `document-service` partagé, remise à zéro annuelle ; embarquer le code client dans un numéro d'archive expose un identifiant métier.

### Findings
- **medium** Renvoi FR-7 → FR-12 faux (devrait être FR-13). *Fix :* corriger.
- **medium** Numéro d'archive cabinet sous-spécifié (FR-7). *Fix :* définir portée de la séquence (par fonds et par année), unicité inter-cabinets (clé incluant l'identifiant du cabinet) et ne pas encoder de donnée personnelle.
- **medium** « Apparaissent par référence, sans copie » (FR-7, D-SC-4) contredit l'esprit du scellé et de la conservation 10 ans (FR-9, NFR-4, NFR-7) : si la pièce source du dossier client est remplacée ou supprimée, l'archive change sans trace dans son scellé. *Fix :* verser une copie immuable scellée dans le fonds et garder un lien vers l'origine, ou interdire la modification/suppression d'une pièce référencée par un fonds.

## Shape fit — adequate

Multi-intervenants B2B avec écrans : les UJ nommés sont justifiés. PRD de type « chaîne haute » (alimente architecture et stories) : la traçabilité FR → lot et FR → droit manque. Brownfield : FR-3 modifie le prévisionnel existant (« au lieu de l'encours moyen agrégé d'aujourd'hui ») alors que FR-6 affirme « rien n'est dupliqué, le prévisionnel reste celui du bilan » ; l'effet sur les prévisionnels déjà calculés ou figés, et le repli quand aucun emprunt n'est saisi, ne sont pas dits.

### Findings
- **medium** Changement de comportement du prévisionnel existant (FR-3, FR-6). *Fix :* préciser que sans emprunt saisi le calcul actuel est inchangé, que les documents déjà figés ne bougent pas, et ajouter un test de non-régression.

## Constats transverses critiques (cloisonnement, argent, numérotation)

- **critical** Cloisonnement et données personnelles de paie se contredisent (§2 tableau, FR-8, FR-11, FR-21, FR-24, NFR-2, NFR-6). (a) L'archiviste a accès à « les fonds d'archives » (§2) alors que NFR-2 dit que tout se lit « dans la portée du collaborateur (portefeuille) » : la portée de `CAB_ARCHIVISTE` est indéfinie (cabinet entier ou portefeuilles ?). (b) FR-8 range les « bulletins de paie » parmi les natures de pièces ; FR-11 indexe leur « texte lu » ; un archiviste (ou la recherche plein texte) y accéderait alors que FR-21 réserve les salaires au portefeuille. (c) FR-21 dit « jamais envoyées au module fiscal » mais FR-24 écrit la base de rémunération « de chaque bénéficiaire » dans le fiscal : sans clé de rapprochement, soit on envoie l'identité, soit la reprise est impossible ; « aucune donnée personnelle de plus que ce que la base porte déjà » est invérifiable car le contenu de la base STORY-345 n'est pas rappelé. (d) FR-9/FR-11 parlent de « lecture du document » (OCR) alors que NFR-6 interdit toute donnée nominative vers l'IA commune : ni l'inclusion ni l'exclusion de l'OCR n'est dite. (e) Aucun droit `paie:*`, `missions:*` ou `ged:*` n'est nommé (seul `financement:dossier:*` l'est en FR-1), alors que NFR-1 exige des droits déclarés. (f) Rien sur la durée de conservation des données de paie face à NFR-7 (10 ans) et à la minimisation de la loi 2019-014 (droit d'effacement, sous-traitant/responsable de traitement entre cabinet et Money Vibes, déclaration préalable). *Fix :* ajouter un tableau rôle × donnée × droit (dont archiviste = fonds de son périmètre, sans accès aux natures « paie »), une liste explicite des champs transmis au fiscal avec clé de rapprochement pseudonymisée, la règle « OCR interne seulement, rien vers l'IA commune », la liste des droits par module, et un paragraphe sur rôles de traitement et durées par catégorie.
- **critical** Flux de l'argent non démontré conforme à SM-1 (FR-15, D-SC-8, §4.3). Le PRD affirme « l'argent va au cabinet, jamais à Money Vibes » mais FR-15 génère un lien PI-SPI/FedaPay sans dire à quel compte marchand ni à quel participant l'argent arrive. Le moteur d'abonnement est aujourd'hui réservé à Money Vibes comme créancier : si le lien passe par les identifiants de Money Vibes, la règle SM-1 est violée. Rien non plus sur l'avoir (annulation ou réduction de la créance), les paiements partiels, ni la réconciliation d'un paiement saisi à la main (espèces, chèque). *Fix :* ajouter un FR/AD « le créancier cabinet porte son propre compte d'encaissement (FedaPay) et son identifiant PI-SPI ; aucun fonds ne transite par Money Vibes », avec les règles d'avoir → créance, paiement partiel et rapprochement manuel ; ajouter un critère testable (la créance porte l'identifiant du cabinet, jamais celui de Money Vibes).
- **high** Numérotation des factures et des bulletins sous-spécifiée (FR-14, H-SC-2, FR-23). `HON-AAAA-NNNNNN` est « continue par cabinet » **et** contient l'année : la séquence se remet-elle à zéro chaque année ou court-elle sans fin (le format avec `AAAA` suggère une remise à zéro, « sans trou » dit le contraire) ? Un brouillon consomme-t-il un numéro (il ne doit pas) ? Les avoirs partagent-ils la séquence ou ont-ils la leur ? Comment garantir l'absence de trou sous concurrence ? Mentions légales : non listées ; l'obligation éventuelle de facturation certifiée de l'OTR n'est pas évoquée. Le bulletin est « numéroté » sans schéma (par salarié, par employeur, par période ?) ni règle de rappel. *Fix :* écrire : numéro attribué à l'émission, séquence annuelle par cabinet (`HON-AAAA-NNNNNN`, remise à zéro au 1er janvier) ou continue (retirer `AAAA`) ; séquence d'avoirs `AVO-AAAA-NNNNNN` ; attribution dans une transaction unique ; liste de mentions obligatoires ; confirmer l'exigence OTR ; schéma `BUL-AAAA-MM-<n° salarié>` ou équivalent et règle des bulletins de rappel. Et arrondi de la TVA par ligne ou sur le total, à dire dans NFR-3.

## Notes mécaniques

- **Hypothèses.** Quatre `[ASSUMPTION]` inline (FR-13, FR-14, FR-17, D-SC-6) correspondent à H-SC-1 à H-SC-4. H-SC-5 (10 ans de conservation, FR-11/NFR-7) et H-SC-6 (TVA 18 %, FR-12) n'ont pas de marqueur inline `[ASSUMPTION]` : FR-11 dit « à confirmer », NFR-7 présente 10 ans comme un fait. Corriger.
- **Cohérence lots.** D-SC-12 « la console a une story dans quatre lots sur cinq » est exact (F1, G1, M1, P1 ; F2 sans console).
- **Vocabulaire.** « Paquet » (FR-4), « offre » (FR-19, Q-SC-5) et « dossier client » (jamais défini au §3) ; « archiver » traité par D-SC-5 mais l'ancien libellé `ARC-` conserve « archive » : acceptable. Le glossaire §3 n'a pas « Avoir », « Fonds » est défini, « Récolement » défini en passant (FR-10).
- **Références.** FR-7 → FR-12 faux (voir ci-dessus) ; autres renvois (FR-2→FR-17, FR-4→FR-17, FR-13→FR-18, FR-20→FR-23) résolus.
- **Valeurs non sourcées dans le texte.** « SMIG (52 500 FCFA ?) » et « décret 2023-096 » sont des suppositions affichées dans Q-SC-4 : à ne pas reprendre dans les stories sans source.
- **Ordre des lots.** Le prérequis « FE-035 et FE-036 tirées avant F2 » est dans §7 mais pas dans les dépendances de F1 (FR-3 injecte les emprunts dans le prévisionnel dès F1) : vérifier que les écrans F1 n'en dépendent pas.
