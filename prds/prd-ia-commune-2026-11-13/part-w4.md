## 14. Ajouter un secteur sans rien perturber

Le PO l'a demandé ainsi : si l'on veut ajouter un **nouveau secteur** (ou un **nouveau pays**), cela doit être **facile**, et cela ne doit **rien perturber de ce qui est déjà présent**. La vision de la salle va dans le même sens : « chaque nouveau secteur ajoute surtout des référentiels et des données, pas un nouveau produit » ; « chaque pays ajoute un référentiel, jamais une version du code » (contrat de module, clause C6) ; « on ouvre le format, on garde l'IA ». Cette section pose les règles qui le rendent vrai pour l'IA commune : le **pack de secteur**, l'**isolation**, la **non-régression**, le **démarrage à froid**, les **pays**, le **kit public** et une **checklist d'ajout**.

Un **secteur** est ici un domaine d'activité servi par un ou plusieurs modules : les quatre logiciels d'aujourd'hui (cabinet, distributeur, microfinance, assurance) sont les **quatre premiers secteurs** ; l'eau, le transit, le solaire en paiement à l'usage, la mobilité, la santé, l'éducation, les tontines, la diaspora, le BTP et les collectivités sont ceux de l'horizon. `[ASSUMPTION : les quatre logiciels actuels sont traités comme les quatre premiers packs de secteur ; le PO ne l'a pas dit, mais c'est la seule façon de prouver que le format suffit]`

#### FR-160 : Un secteur s'ajoute, le socle ne se modifie pas

L'IA commune est **fermée à la modification, ouverte à l'ajout** : brancher un nouveau secteur ou un nouveau pays ne demande **aucune modification** du socle de l'IA (contrat de proposition, moteurs de règles et de modèles, registre, passerelle de langage, calibration locale, évaluation) ni d'**aucun secteur déjà en place**. Tout ce qu'un secteur apporte tient dans un **pack de secteur** (FR-161) et, au plus, dans une **extension du catalogue** (FR-169). Retirer un secteur est aussi simple : on désinstalle son pack, et rien d'autre ne bouge. C'est le principe du contrat de module : une plateforme, le même code pour tous, des variantes par déclaration et jamais par branche de code (clauses C6 et C11).

**Conséquences (testables) :**
- Un test ajoute un pack de secteur de démonstration à une installation qui porte les quatre secteurs actuels : le **code livré** du socle est identique avant et après (empreinte inchangée), et aucun fichier d'un autre secteur n'est modifié.
- Un test rejoue la **recette complète** des quatre secteurs (parcours UJ-1 à UJ-8, FR-10) avant et après l'ajout : les propositions rendues sur un jeu de dossiers figés sont **identiques**, hors horodatage.
- Un test désinstalle le pack ajouté : les quatre secteurs répondent comme avant, et les propositions déjà inscrites au registre de l'IA (FR-17) pour le secteur retiré restent lisibles, avec leur trace opposable.
- Une recherche dans le code du socle des noms de secteur (« assurance », « microfinance », « distributeur », « cabinet » et ceux du pack de démonstration) ne trouve **aucune branche conditionnelle** : un secteur n'est jamais un `if` dans le socle.

#### FR-161 : Le pack de secteur, déclaratif et versionné

Un secteur se déclare dans un **pack de secteur** : un ensemble de fichiers **déclaratifs** (pas de code exécutable de secteur dans le socle), **versionné**, **signé** par Money Vibes, livré comme une mise à jour de module (même mécanique que les manifestes). Un pack contient au moins : (1) le **vocabulaire** du secteur (FR-162) ; (2) les **capacités consommées** parmi les familles existantes, avec les **règles N0** (FR-163) ; (3) ses **objectifs** mesurés et ses **vérités terrain** (FR-164) ; (4) ses **paramètres par pays** (FR-171) ; (5) ses **garde-fous propres** (FR-165) ; (6) ses **exigences de résidence de données** (FR-172). Un pack a un identifiant, une version, une compatibilité déclarée avec la version du catalogue et du contrat de proposition, et un **état** (`BROUILLON`, `ESSAI`, `ACTIF`, `RETIRE`).

**Conséquences (testables) :**
- Un test charge un pack auquel il manque une des six sections : le chargement est refusé avec un code nommé qui dit laquelle manque.
- Un pack dont la signature est absente ou invalide n'est pas installé en `ACTIF` ; un pack dont la compatibilité de catalogue n'est pas satisfaite est refusé sans effet sur les autres packs.
- Un test installe deux versions du même pack en parallèle (essai chez une organisation, actif chez une autre) : chacune ne voit que la sienne.
- Un contrôle automatique rejette tout fichier d'un pack qui n'est pas une déclaration au schéma publié (FR-173) : aucun code exécutable.

#### FR-162 : Le vocabulaire du secteur se rattache à un noyau neutre

L'IA garde un **noyau neutre** : un petit nombre de notions qui ne portent le mot d'aucun secteur, par exemple **tiers** (la personne ou l'entreprise sur laquelle on raisonne), **créance** (une somme attendue à une date), **engagement** (un contrat qui lie), **objet** (ce sur quoi porte un dossier), **zone**, **événement**, **pièce**. Chaque capacité est écrite **contre ce noyau**. Le pack apporte la **correspondance** : l'emprunteuse d'une institution de microfinance, l'assurée, le point de vente, le ménage abonné à un kit solaire, la cotisante d'une tontine sont des **tiers** ; l'échéance, la prime, la facture, la mensualité d'un kit, la cotisation sont des **créances** ; il donne aussi les **mots affichés** à l'écran, par langue (FR-171). Un secteur nouveau n'invente jamais une capacité parce qu'il a un autre mot : il fait la correspondance (reprise du vocabulaire par verticale de FR-90).

**Conséquences (testables) :**
- Un test charge un pack dont le vocabulaire laisse sans correspondance une notion du noyau dont une capacité consommée a besoin : le chargement est refusé avec le nom de la notion manquante.
- Un test change un libellé du vocabulaire d'un secteur : seuls les écrans et les explications de ce secteur changent ; la sortie de la capacité (valeur, confiance, facteurs) est inchangée.
- Un test d'inventaire vérifie qu'**aucune** capacité du catalogue ne cite un mot propre à un secteur dans son contrat d'entrée ou de sortie.

#### FR-163 : Les capacités consommées et les règles N0 du secteur

Le pack déclare les **capacités qu'il consomme** parmi celles du catalogue (FR-37, FR-90), avec leur version minimale, et livre pour chacune ses **règles N0** : des règles expertes **explicables**, écrites pour le secteur (par exemple, pour un score de ménage, la régularité des paiements sur douze mois et le rapport mensualité-revenu), **paramétrées par pays** et rangées dans le pack. Les règles N0 d'un secteur sont **à lui** : elles ne partagent aucun paramètre avec celles d'un autre secteur, sauf **héritage déclaré** d'un jeu de règles d'une famille transverse (FR-170). Le jour 1, un secteur n'a donc **rien d'autre à fournir** pour que l'IA lui réponde : le N0 suffit (FR-91).

**Conséquences (testables) :**
- Une capacité consommée sans règle N0 ni modèle commun applicable est refusée au chargement du pack : « aucune réponse utile au jour 1 » est un défaut du pack, pas un état permis (FR-5).
- Un test modifie un paramètre d'une règle N0 d'un secteur : les propositions d'un autre secteur qui consomme la même capacité sont inchangées.
- Chaque règle N0 d'un pack porte son **explication** (facteurs et poids, ou règle appliquée) ; une règle sans explication est refusée (FR-16).
- Une règle N0 de pack ne peut ni décider, ni bloquer, ni écrire autre chose qu'une proposition : un test le tente et obtient un refus nommé (FR-13).

#### FR-164 : Les objectifs et les vérités terrain du secteur

Le pack déclare, pour chaque capacité consommée, ses **objectifs mesurés** (qualité, usage, effet métier, équité : FR-92) et ses **vérités terrain**, c'est-à-dire **ce qui tranche « qui avait raison »** et **à quel horizon**. Exemples : pour le score d'un ménage abonné à un kit solaire, la vérité terrain est le **retard de plus de 30 jours** observé à l'horizon de six mois (IA-P84) ; pour une probabilité de paiement de cotisation, la **cotisation reçue** à la date du tour ; pour un résumé, la **correction de l'utilisateur**. Quand l'humain et l'IA ne sont pas d'accord, le **désaccord est conservé** et, à l'horizon déclaré, confronté à la réalité : le pourcentage « l'IA avait raison / l'humain avait raison » se calcule **par capacité et par secteur**, comme pour les quatre logiciels (journal des désaccords, partie 2). Sans vérité terrain déclarée, une capacité d'un secteur reste **à N0** : elle ne peut pas être promue (FR-167).

**Conséquences (testables) :**
- Un test charge un pack dont une capacité n'a pas de vérité terrain : la capacité est acceptée **à N0 seulement**, avec le motif « non mesurable », et ne peut atteindre ni N1 ni N2.
- Le test de recette d'un secteur de démonstration crée un désaccord, avance l'horloge jusqu'à l'horizon déclaré, injecte la réalité et lit le pourcentage de raison : il est calculé par capacité et par secteur, sans mélange.
- Un test change une cible chiffrée d'un pack : les rapports mensuels des autres secteurs sont inchangés.
- Une vérité terrain qui dépend d'une donnée que le secteur ne produit pas encore déclare son **délai d'attente** ; avant ce délai, la capacité affiche « pas encore mesurée ».

#### FR-165 : Les garde-fous propres au secteur ne peuvent qu'ajouter

Un pack déclare ses **garde-fous propres** : les **variables interdites** pour tout score sur une personne dans ce secteur (au-delà de la liste fermée de FR-18), les **objets sur lesquels aucune capacité ne peut proposer de montant** (FR-20 : un dossier corporel en assurance, un traitement en santé), la **classification des données sensibles** du secteur (FR-19 : santé, localisation d'un ménage, données d'un mineur), les capacités **non activables** tant qu'une revue juridique n'a pas eu lieu (FR-28) et les **actions** qu'aucun mandat ne peut rendre autonomes (FR-14). Règle de fer : **un pack peut ajouter un garde-fou, jamais en retirer un du socle** (FR-4).

**Conséquences (testables) :**
- Un test charge un pack qui tente de retirer la classification santé, de rendre activable une décision automatique de crédit ou de lever une variable interdite du socle : le chargement est refusé avec un code nommé par garde-fou.
- Un test déclare un objet « sans montant » dans un pack : toute proposition de montant sur cet objet est refusée, dans ce secteur seulement.
- Une donnée classée sensible par un pack est traitée comme telle **dès le chargement** : un test vérifie qu'elle n'apparaît ni dans le niveau d'export « apprentissage », ni dans un envoi à la passerelle de langage.
- Un secteur qui touche à la santé hérite d'office de FR-19 et de FR-36 (rien de médical hors de l'instance) : un pack ne peut pas déclarer le contraire.

#### FR-166 : Les modèles et les calibrations d'un secteur sont versionnés à part

Chaque modèle et chaque calibration est rangé sous une **clé de secteur** : `secteur / capacité / version`. Une calibration N2 est la **donnée d'une organisation** (clause C11, point 3) **et** d'un secteur ; un modèle commun N1 a **une ligne par secteur** quand il est propre au secteur, ou une **ligne transverse** quand la famille est déclarée telle (FR-168). Le registre des modèles (partie 2) ne fait **jamais** d'alias partagé entre deux secteurs : un secteur promeut, retient ou **retire en une action** sa propre version sans que l'alias d'un autre secteur bouge. Une organisation qui porte deux secteurs (un distributeur qui active aussi un module de tontine, par exemple) a **deux calibrations séparées**.

**Conséquences (testables) :**
- Un test publie une nouvelle version du modèle d'un secteur : les alias `champion` et `challenger` des autres secteurs ne changent pas, et leurs propositions sur un jeu figé sont identiques.
- Un test retire en une action la version d'un secteur : seul ce secteur retombe sur sa version précédente ou sur N0 ; les propositions des autres sont inchangées.
- Une mise à jour du modèle d'un secteur n'écrase **jamais** la calibration d'une organisation (empreinte identique avant et après : clause C11), ni celle de la même organisation dans un autre secteur.
- Un test d'organisation à deux secteurs vérifie que les écarts d'un secteur n'alimentent **pas** la calibration de l'autre.

#### FR-167 : Non-régression obligatoire, champion et challenger par secteur

Aucune version (modèle, règle, pack, extension du catalogue) n'est promue sans deux preuves. **D'abord**, une **non-régression sur chaque secteur déjà en place** : un jeu de dossiers figés par secteur, rejoué à chaque candidat, doit donner les mêmes propositions pour tout secteur que le candidat **ne devait pas** toucher (IA-P80). **Ensuite**, un **champion/challenger par secteur** : un challenger n'est promu que s'il bat le champion **du même secteur** sur les objectifs de ce secteur (FR-164, FR-92), sans régression d'équité (FR-18). L'ordre de promotion (hors ligne, ombre, canari, général) est celui de la partie 2, imposé ici **secteur par secteur**, jamais globalement. Un secteur sans jeu de non-régression (IA-P81) ne peut pas être promu et ne peut pas être ajouté `ACTIF`.

**Conséquences (testables) :**
- Une promotion qui change la sortie d'un secteur non visé sur son jeu figé au-delà de IA-P80 est **refusée** par la chaîne de livraison, avec le nom du secteur et des dossiers qui ont bougé.
- Un test fait gagner un challenger sur le secteur A et le fait perdre sur le secteur B : il est promu pour A seulement ; B garde son champion.
- Un nouveau secteur ne passe pas de `ESSAI` à `ACTIF` sans un jeu de dossiers figés **et** la preuve que les jeux des autres secteurs sont inchangés.
- Le rapport de non-régression est un artefact signé, rattaché à la version publiée ; un test vérifie qu'une version sans rapport n'est pas publiable.

#### FR-168 : L'apprentissage commun ne mélange les secteurs que pour des familles déclarées transverses

Par défaut, **l'apprentissage ne franchit pas la frontière d'un secteur**. Une famille de capacités n'est **transverse** que si le catalogue la déclare telle, par exemple la **lecture de pièces**, le **contrôle de cohérence**, l'**anomalie sur une série de paiements**, la **rédaction d'une relance**, le **résumé sourcé** ; les familles qui évaluent un **risque sur une personne** (score d'un tiers, probabilité de paiement, tarification) restent **par secteur** jusqu'à décision écrite du PO. Un apprentissage transverse exige trois conditions : la famille est déclarée transverse, la **finalité « apprentissage commun » est consentie** par chaque organisation concernée (FR-7), et les écarts remontent au niveau d'export « apprentissage » (agrégats, effectif minimal IA-P04, aucun texte libre, aucune donnée de santé). Le **croisement d'une même PME entre secteurs** (identité partagée, passeport) reste l'horizon de la vision, avec **consentement explicite par croisement** ; il n'est pas du premier jour (FR-9). `[ASSUMPTION : le PO a dit « une finalité consentie pour chaque croisement » ; la liste des familles transverses et celle des familles « par secteur » sont une recommandation à valider]`

**Conséquences (testables) :**
- Un test tente de verser les écarts d'un secteur dans l'entraînement d'une famille « par secteur » d'un autre secteur : refus nommé, et rien n'est sorti.
- Un test retire la finalité « apprentissage commun » d'une organisation : ses écarts n'entrent plus dans l'entraînement transverse après le délai IA-P14 ; elle continue de **recevoir** le modèle transverse.
- Une famille ne passe de « par secteur » à « transverse » que par une **version du catalogue** signée, avec la preuve d'une non-régression sur chaque secteur concerné (FR-167) ; un test la déclare sans preuve et obtient un refus.
- Un test inspecte les envois d'une centrale de démonstration : aucun jeton d'export ne mélange les écarts de deux secteurs hors d'une famille transverse.

#### FR-169 : Une famille nouvelle est une extension versionnée du catalogue

Si un secteur demande une capacité qui n'existe dans **aucune** famille du catalogue, on n'ouvre pas d'exception dans le pack : on ajoute une **famille nouvelle** au catalogue, comme une **extension versionnée**, avec son contrat (entrées, sorties, vocabulaire neutre), son N0 par défaut, ses objectifs types, ses garde-fous et son niveau de risque. Elle s'**ajoute** sans modifier le contrat d'une famille existante ; elle est proposée par l'équipe IA de Money Vibes (un partenaire la **demande**, il ne la livre pas : FR-173), relue par le juriste et le délégué à la protection des données si elle touche une personne, puis publiée avec une **version du catalogue**. Un secteur qui ne la consomme pas ne la voit pas. Le catalogue maintient en parallèle IA-P85 versions.

**Conséquences (testables) :**
- Un test publie une famille nouvelle de démonstration : les contrats des 19 familles existantes sont identiques (empreinte) et leurs tests de recette passent sans modification.
- Un module qui ne déclare pas la nouvelle famille n'en reçoit aucune proposition : un test l'appelle et obtient un refus nommé (FR-37).
- Une famille nouvelle sans N0 par défaut est refusée à la publication (FR-5).
- Un test demande une version antérieure du catalogue (dans la limite IA-P85) et obtient le contrat tel qu'il était ; un pack compatible avec cette version continue de tourner.

#### FR-170 : Le démarrage à froid d'un secteur

Un secteur neuf n'a **ni historique ni modèle propre**. Il démarre ainsi (FR-5, FR-91) : **N0 au jour 1** (ses règles, FR-163) ; **N1 hérité** d'une famille **transverse** (FR-168) quand c'est pertinent, par **transfert** : le modèle transverse est utilisé tel quel, présenté comme « modèle commun », avec la **mesure de sa pertinence** sur le secteur (écart entre sa sortie et la vérité terrain du secteur, FR-164) ; si cette mesure est sous IA-P83, le secteur **reste à N0** et le dit ; **N2** (calibration ou modèle propre) s'ouvre quand le **seuil de données** de la capacité (IA-P86) est atteint **dans ce secteur**. L'**héritage est déclaré** dans le pack (famille transverse, version) et **réversible** : un secteur peut cesser d'hériter sans toucher aux autres.

**Conséquences (testables) :**
- Un test démarre un secteur de démonstration sans historique : chaque capacité consommée répond (N0), le niveau est affiché (FR-24), aucune réponse « pas de données ».
- Un test hérite un modèle transverse dont la pertinence mesurée est sous IA-P83 : la capacité reste à N0 et le motif est écrit au rapport.
- Le passage à N2 n'a lieu que lorsque le seuil de **ce** secteur est atteint : un test alimente un autre secteur au-delà de son seuil et vérifie que le secteur neuf ne passe pas à N2.
- Un test supprime l'héritage déclaré : le secteur retombe sur N0, sans changement chez aucun autre secteur.

#### FR-171 : Un pays est un référentiel, avec sa langue, sa devise et ses calendriers

Ajouter un **pays** ne demande **aucun code nouveau** (vision : « chaque pays ajoute un référentiel, jamais une version du code » ; clause C6). Le pack de secteur, ou un **pack de pays** qui s'y superpose, porte pour chaque pays : le **référentiel** (comptable, fiscal, réglementaire : le référentiel SYSCOHADA révisé, celui des assurances de la zone CIMA, celui des systèmes financiers décentralisés de la BCEAO sont déjà au catalogue), les **paramètres des règles N0** (taux, plafonds, seuils légaux comme le taux d'usure), la **langue** et les **gabarits de texte** (FR-90), la **devise** et ses décimales, les **calendriers, fériés et fuseaux**, et le **corpus légal** versionné d'où viennent les affirmations sourcées (FR-16). L'IA ne suppose **jamais** une devise : toute somme porte la sienne. `[ASSUMPTION : le contrat de balance n'a pas de devise déclarée aujourd'hui (convention implicite) ; la salle l'a nommé comme la dette à payer avant le deuxième pays. Cette exigence suppose que cette dette soit payée ailleurs ; ce PRD ne la règle pas]`

**Conséquences (testables) :**
- Un test ajoute un pays de démonstration (autre devise, autre langue, autre taux d'usure) à un secteur existant **sans changer le code livré** : les règles N0 utilisent les paramètres du nouveau pays pour ses organisations, et ceux de l'ancien pour les autres, inchangés.
- Une somme sans devise en entrée d'une capacité est refusée avec un code nommé ; une conversion implicite entre deux devises échoue.
- Une affirmation à portée légale dans un pays dont le corpus n'est pas chargé est rendue « non sourcée » (FR-16), jamais déduite d'un autre pays.
- Un test passe un utilisateur d'une langue à une autre : seuls les libellés, gabarits et explications changent ; valeur, confiance et facteurs sont identiques.

#### FR-172 : La résidence des données et le rail de paiement se déclarent, ils ne se recodent pas

Un pays peut **exiger que ses données restent chez lui**. Le pack de pays déclare une **règle de résidence** par classe de données : où elles peuvent être **traitées** (instance de l'organisation, région d'hébergement du pays, centrale de Money Vibes) et ce qui peut en sortir. Si la règle est « reste dans le pays », **rien** ne remonte à la centrale, **pas même un agrégat**, tant qu'une décision juridique du pays ne l'autorise pas ; l'organisation reçoit tout de même les mises à jour du modèle commun (descente seule, FR-7). Les envois à la **passerelle de langage** (FR-33, FR-34) suivent la même règle : un pays qui interdit la sortie ne peut utiliser que le modèle ouvert local (FR-35). Le **rail de paiement** (PI-SPI, un autre rail instantané, un portefeuille local) est une **interface unique** : l'IA propose par exemple un lien de paiement dans une relance sans connaître le rail ; le pack du pays nomme le rail à brancher. `[ASSUMPTION : « souveraineté des données pays par pays » est une parole de la salle (le prêteur doit être agréé dans le pays de l'emprunteur) ; le niveau « pas même un agrégat » est une recommandation]`

**Conséquences (testables) :**
- Un test déclare un pays à résidence stricte : aucun jeton d'export n'est émis pour ses organisations, aucun appel à la passerelle ne part, et les mises à jour de modèle arrivent quand même.
- Un test change le rail d'un pays (de PI-SPI à un rail de démonstration) : la capacité de relance produit le même message avec un autre lien ; aucun code de capacité n'est modifié.
- Un inventaire liste, par pays, les flux sortants autorisés : un flux sans règle de résidence est refusé.
- Un test change la règle d'un pays : les organisations des autres pays ne voient aucun changement de flux.

#### FR-173 : Le format est public, l'IA reste à Money Vibes

Le **format d'un pack de secteur**, le **contrat d'une capacité** et le **contrat de proposition** sont **publiés** : schémas, documentation, jeu de tests de conformité, **kit de développement** pour les **partenaires intégrateurs** et pour une **place de marché** de modules et de packs (vision, séance 17 : le contrat de module devient un kit public, une place de marché avec partage des revenus, un réseau de partenaires certifiés par pays). La limite est celle de la salle, validée par le PO : **on ouvre le format, on garde l'IA**. Un partenaire **déclare** un pack et **consomme** des capacités par le contrat ; il ne reçoit **ni** le code des modèles communs, **ni** leurs poids, **ni** les données d'entraînement, **ni** l'accès à la centrale. Il n'**entraîne pas** le modèle commun : un pack de partenaire apporte au plus ses règles N0 et sa calibration locale, qui reste une donnée de l'**organisation cliente**. Ses écarts ne remontent à l'apprentissage commun que dans les conditions de FR-168. Money Vibes **certifie** un pack avant sa mise à disposition (FR-174). `[ASSUMPTION : les modalités commerciales de la place de marché et le partage des revenus ne sont pas fixés ; ce PRD ne fixe que la frontière technique et de confiance]`

**Conséquences (testables) :**
- Un contrôle de publication cherche dans le kit tout modèle commun, tout jeu de données réel et tout identifiant de client, et n'en trouve aucun : le kit ne contient que schémas, documentation, tests et exemples synthétiques.
- Un pack de démonstration de partenaire appelle une capacité : il reçoit une proposition au contrat, et **aucune** route ne lui donne les poids, les écarts d'autres organisations ou la centrale.
- Un pack de partenaire qui demande un droit d'entraînement sur le modèle commun est refusé au chargement avec un code nommé.
- Un test retire la certification d'un pack : il repasse en `ESSAI` ou `RETIRE` et ses propositions ne s'affichent plus comme du N1 ; le reste de l'installation est inchangé.

#### FR-174 : La checklist d'ajout d'un secteur ou d'un pays, et un exemple

Ajouter un secteur ou un pays suit une **checklist** testable : ce qu'il faut **fournir**, ce qui est **vérifié automatiquement**, et **qui valide**.

| Étape | À fournir | Vérifié automatiquement | Qui valide |
|---|---|---|---|
| 1. Déclarer | pack complet (FR-161), vocabulaire et correspondance (FR-162) | schéma, six sections, signature, compatibilité de catalogue | équipe IA de Money Vibes |
| 2. Capacités et N0 | capacités consommées, règles N0 explicables par pays (FR-163) | réponse utile au jour 1, explication présente, aucune décision | équipe IA |
| 3. Mesure | objectifs et vérités terrain avec horizon (FR-164) | une vérité terrain par capacité, sinon N0 seulement | équipe IA et métier du secteur |
| 4. Garde-fous | variables interdites, objets sans montant, classes sensibles (FR-165) | aucun retrait d'un garde-fou du socle | juriste et délégué à la protection des données |
| 5. Pays | référentiel, langue, devise, calendriers, corpus légal, rail, résidence (FR-171, FR-172) | devise explicite, corpus chargé, chaque flux avec une règle | juriste du pays, partenaire local |
| 6. Isolation | clé de secteur, héritage déclaré (FR-166, FR-170) | aucun alias partagé, aucune écriture hors secteur | équipe IA |
| 7. Non-régression | jeu de dossiers figés du secteur (FR-167) | jeux des autres secteurs identiques, empreintes de calibration inchangées | équipe IA, rapport signé |
| 8. Essai | un client pilote en `ESSAI` (au moins IA-P82 jours), ombre puis canari | objectifs mesurés, équité, désaccords conservés | PO et client pilote |
| 9. Activation | passage à `ACTIF` | les huit contrôles précédents verts, registre de l'IA branché | PO |

Un secteur ou un pays n'est `ACTIF` que si **les neuf lignes sont vertes** ; une ligne rouge ne bloque que lui. `[ASSUMPTION : les validateurs par ligne sont une recommandation ; le PO fixera les noms une fois l'équipe IA constituée]`

**Exemple court : l'énergie solaire en paiement à l'usage** (secteur de l'horizon de la salle : kits payés par petites sommes en monnaie mobile, coupés à distance en cas d'impayé, possédés au bout du paiement).

| Ce qui est **réutilisé** sans rien changer | Ce qui est **ajouté** par le pack |
|---|---|
| Le contrat de proposition, le registre, la provenance, la doctrine « l'IA propose, l'humain décide » | Le **vocabulaire** : ménage abonné = tiers ; mensualité du kit = créance ; kit = objet ; zone de couverture |
| Les familles score d'un tiers, probabilité de paiement et relances, prévision, anomalie, terrain (tournée du technicien) | Les **règles N0** du score de ménage et de la relance (régularité sur douze mois, jour de marché, jour de paie) |
| La passerelle de langage, la lecture de pièces (pièce d'identité, contrat) | La **vérité terrain** : retard de plus de 30 jours à six mois ; le désaccord « l'IA dit risque, le technicien contredit » confronté à l'impayé réel |
| Le rail de paiement, les gabarits de relance (traduits) | Les **garde-fous propres** : **la coupure à distance n'est jamais une action autonome** (engageante, humaine) ; aucun montant proposé hors zone ; localisation du ménage classée sensible |
| Le démarrage à froid : N1 hérité de la famille transverse « relance » ; score à N0 jusqu'au seuil | Les **paramètres par pays** : taux, plafonds de crédit à la consommation, langue, devise |

Pour la **tontine** (cotisations, ordre de passage, pénalités), le schéma est le même : la cotisante est un **tiers**, la cotisation une **créance**, la vérité terrain la **cotisation reçue au tour**, et le garde-fou propre que **Money Vibes ne garde jamais l'argent** (garde-fou posé par la vision) : aucune capacité de la tontine ne propose de mouvement de fonds.

**Conséquences (testables) :**
- Un test rejoue la checklist sur le secteur de démonstration « solaire » : la chaîne de livraison produit les neuf lignes, chacune avec son artefact ; une ligne absente rend l'ajout impossible.
- Un test ajoute « solaire » puis « tontine », puis dans l'ordre inverse : l'état final des quatre secteurs d'origine est identique dans les deux cas (FR-167).
- La coupure à distance d'un kit, demandée par l'IA, est refusée avec un code nommé : seul un humain, avec un motif, peut la commander (FR-13, FR-14).
- Un pays de démonstration ajouté au secteur « solaire » n'altère ni un score, ni une explication, ni une alerte d'équité d'un secteur qui ne l'a pas.
