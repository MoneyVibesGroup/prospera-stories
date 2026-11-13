## 15. Exigences transverses (non fonctionnelles)

Ces exigences s'ajoutent à celles du PRD de chaque logiciel (distributeur, microfinance, assurance, cabinet) et à celles du moteur d'installation. Elles **ne répètent pas** une FR déjà écrite : elles la **renvoient** (« voir FR-n »). Tout chiffre est un **paramètre** (annexe D, codes `ia.perf.*`, `ia.dispo.*`, `ia.cout.*`, `ia.obs.*`) ; les valeurs par défaut sont des recommandations `[ASSUMPTION]` à mesurer à la recette, jamais des promesses commerciales (FR-29).

**Tableau de renvois : exigence transverse, puis l'exigence qui la porte.**

| Exigence transverse | Exigence porteuse |
|---|---|
| Une capacité n'est jamais bloquante | FR-15, FR-40 |
| Isolation entre organisations (en ligne) et entre secteurs | FR-31, FR-42, FR-166 |
| Les droits de l'utilisateur, jamais ceux de l'IA | FR-25, FR-39 |
| Aucune donnée de santé hors de l'instance | FR-19, FR-36, FR-143 |
| Aucun port entrant en local ; destinations sortantes déclarées | FR-32 |
| Passerelle de langage : masquage, journal, aucune rétention | FR-33, FR-34 |
| Modèle signé, paquet vérifié, retour arrière en une action | FR-67, FR-83, FR-84 |
| Registre inaltérable, trace opposable, journal des accès | FR-17, FR-23, FR-89 |
| Sauvegarde et restauration avec les données | FR-87 |
| Supervision par la route de santé | FR-86 |
| Dimensionnement du matériel local | FR-35, FR-41 |
| Jamais de modèle ni de règle de score dans un module métier | FR-37, FR-44 |

#### FR-175 : Performance des propositions de règle et de modèle

Une proposition de niveau N0 (règle) est rendue en **moins de `ia.perf.n0_p95_ms` au 95e centile**, une proposition de niveau N1 ou N2 (modèle statistique) en **moins de `ia.perf.n1_p95_ms`**, mesurées sur l'instance ou sur le service, **hors réseau du client**. Au-delà du délai `ia.delai_reponse_max_s` (FR-40), la capacité rend l'état `INDISPONIBLE` et le parcours poursuit sur la règle de base du module ; au-delà du délai de repli IA-P07 (FR-15), l'écran reprend la main sans attendre. Une capacité ne dépasse jamais le plafond de calcul de la recalibration nocturne en heures ouvrées (FR-59).

**Conséquences (testables) :**
- Un jeu de 1 000 demandes par capacité, rejoué à la recette sur le matériel du palier déclaré (FR-41), donne un 95e centile sous les deux plafonds ; un dépassement fait échouer la recette de cette capacité, pas celle du logiciel.
- Une capacité qui dépasse `ia.delai_reponse_max_s` rend `INDISPONIBLE`, ne laisse aucune proposition à moitié écrite au registre (FR-17) et laisse le parcours aller au bout (FR-40).
- La mesure est faite par le service lui-même et exposée en indicateur (FR-184), pas déclarée.
- `[ASSUMPTION : 300 ms pour une règle et 1,5 s pour un modèle statistique au 95e centile, sur le palier P1 ; les valeurs sont posées par ce PRD, à mesurer avant le premier devis]`

#### FR-176 : Performance du Copilot et des capacités de langage

Le Copilot affiche un **premier élément de réponse en moins de `ia.perf.copilot_premier_s`** et la **réponse complète en moins de `ia.perf.copilot_p95_s` au 95e centile**, sur une question à périmètre normal ; la valeur visée de l'objectif est `ia.objectif.copilot.temps_reponse_s` (FR-139). Le plafond d'une capacité de langage est celui de FR-40 (60 secondes). Quand le modèle de langage ne tient pas ces délais ou n'est pas disponible, le Copilot **se replie** sur la recherche par règles et gabarits et le dit (FR-35, FR-133), au lieu d'attendre.

**Conséquences (testables) :**
- Un jeu de 200 questions types (par logiciel) mesure le premier élément et la réponse complète au 95e centile sur le matériel du palier déclaré ; un dépassement est rapporté dans le rapport mensuel (FR-71), et fait échouer la recette si le plafond de FR-40 est dépassé.
- Une panne ou une lenteur du modèle de langage ne bloque ni l'écran ni les autres capacités (FR-40, FR-86) ; l'état `DEGRADE` est visible.
- `[ASSUMPTION : 3 secondes pour le premier élément et 20 secondes au 95e centile pour la réponse complète, en ligne ; en local sur modèle ouvert, la valeur dépend du palier et se fixe au devis]`

#### FR-177 : Disponibilité de l'IA et de ce qui en dépend

**En ligne**, le service d'IA est disponible **`ia.dispo.cible_pct` du temps par mois** ; une indisponibilité n'en est pas une du logiciel (FR-15). La reprise après panne du service se fait en **moins de `ia.dispo.rto_min` minutes** avec une perte de données de calibration et d'écarts de **moins de `ia.dispo.rpo_min` minutes** (sauvegarde horaire, FR-87). **En local**, la disponibilité de l'IA est celle de l'instance : elle redémarre avec l'agent (FR-32) et elle est surveillée comme le reste (FR-86). La panne de la **centrale de Money Vibes** n'a **aucun effet** sur le service rendu par une instance (FR-53, FR-85).

**Conséquences (testables) :**
- Un test coupe le service d'IA en ligne et vérifie que les parcours des quatre logiciels vont au bout (test de chaos par logiciel, FR-40) ; la disponibilité mensuelle est calculée depuis la route `sante` (FR-86).
- Un test coupe la liaison avec la centrale pendant 45 jours : l'instance sert avec son dernier modèle et sa calibration, rien ne s'arrête (FR-61, FR-85).
- Un test restaure la sauvegarde la plus récente après arrêt brutal : la perte maximale de calibration et d'écarts est sous `ia.dispo.rpo_min`.
- `[ASSUMPTION : 99,5 % par mois, reprise en 60 minutes, perte maximale de 60 minutes ; en local, aucun engagement de disponibilité n'est pris au-delà de celui de l'instance]`

#### FR-178 : Isolation entre organisations, entre secteurs et entre capacités

En ligne, **aucune requête, aucun cache, aucune file, aucun journal ni aucun modèle de calibration** ne mélange deux organisations ; la saturation de l'une ne retarde pas l'autre au-delà de `ia.iso_delai_max_pct` (FR-31). Une calibration est la donnée **d'une organisation et d'un secteur** (FR-42, FR-166). Un module ne lit pas la proposition d'un autre module que ses droits ne lui ouvrent pas (FR-39), et l'IA ne lit la base d'aucun module (FR-38).

**Conséquences (testables) :**
- Un test de fuite lance, avec le jeton de l'organisation A, des demandes qui visent des identifiants de l'organisation B : refus `ORGANISATION_HORS_JETON`, aucune donnée de B dans la réponse, le journal ni le cache (FR-31).
- Un test sature l'organisation A et mesure le délai de l'organisation B : l'allongement reste sous `ia.iso_delai_max_pct`.
- Un test rejoue une calibration de secteur sur un autre secteur : refusée (FR-166).

#### FR-179 : Sécurité de l'IA

L'IA applique les règles de la plateforme (authentification, droits par code, clés, secrets) et y ajoute les siennes : (1) **aucun secret de fournisseur** dans le code, la configuration d'un module ou un journal ; la passerelle seule détient les clés des fournisseurs de langage (FR-33) ; (2) **tout paquet de modèle est vérifié** (signature, période de validité, compatibilité) avant de servir (FR-83) ; (3) **aucun port entrant** en local (FR-32) ; (4) les **demandes de langage** sont traitées comme des entrées **non fiables** : un texte reçu (pièce, message, question) ne peut **ni changer les droits, ni déclencher une action, ni modifier une instruction** de la capacité (injection d'invite) ; (5) l'**accès au registre et aux journaux** est en lecture seule pour l'auditeur (FR-17, FR-23) ; (6) la **chaîne d'approvisionnement des modèles** est tracée : licence vérifiée, version épinglée, empreinte (FR-35, FR-83).

**Conséquences (testables) :**
- Un test d'inspection ne trouve aucun secret de fournisseur hors de la passerelle ; un test de balayage de ports ne trouve aucun port entrant (FR-32).
- Un jeu de textes piégés (instructions cachées dans une pièce, un message, un nom de fichier) est rejoué à chaque promotion d'une version de capacité de langage : aucun ne produit d'action, ne change un droit ni ne fait sortir une donnée ; un échec bloque la promotion (FR-65).
- Un paquet au contenu modifié d'un octet est refusé (FR-83).
- `[ASSUMPTION : le jeu de textes piégés est constitué et maintenu par l'équipe IA de Money Vibes ; son contenu et sa taille (au moins 100 cas à la première version) se fixent avec le responsable de la sécurité]`

#### FR-180 : Journalisation de l'IA

Chaque appel laisse une ligne de journal : organisation, capacité, version, auteur ou règle, taille, durée, résultat (`OK`, refus nommé, `INDISPONIBLE`), et, pour une capacité de langage, le fournisseur et le pays d'hébergement. Le journal **ne contient jamais** de contenu de proposition en clair, de donnée de santé, de secret ni de texte libre d'utilisateur : le contenu masqué d'un envoi de langage se conserve `ia.retention_contenu_passerelle_jours` pour l'audit (FR-34) et le contexte brut `ia.retention_contexte_brut_jours` (FR-38). Les **refus nommés** (annexe B) sont comptés et exposés.

**Conséquences (testables) :**
- Un test inspecte 1 000 lignes de journal d'un jeu qui contient des données de santé et des textes libres : zéro octet de ces contenus.
- Chaque refus nommé de l'annexe B apparaît dans le journal avec son code et son compteur ; un code inconnu du contrat est un défaut.
- Les horodatages suivent l'horloge scellée de l'instance (moteur) ; deux horloges (trace opposable, contexte brut) restent distinctes (FR-17).

#### FR-181 : Conservation du registre, des écarts et des journaux

Le **registre de l'IA** (trace opposable) est conservé **`ia.retention_registre_annees` ans** (FR-89, IA-P06). Les **observations de la personne concernée** sont conservées avec le dossier (IA-P13). Le **contexte brut** et le rendu figé sont purgés à leur échéance courte (FR-17, FR-38). Le **journal des écarts** est une donnée de l'organisation, conservé et sauvegardé avec elle (FR-56, FR-87) ; il suit l'**effacement** de l'organisation (FR-89). Une **désinstallation** du module `ia` ne supprime rien : le registre, les écarts et les calibrations restent stockés et masqués (annexe A, C9).

**Conséquences (testables) :**
- Un test avance l'horloge de `ia.retention_registre_annees` : la trace opposable est encore lisible la veille, purgée selon la règle d'effacement le lendemain, jamais avant.
- Un test désinstalle puis réinstalle `ia` : aucune entrée du registre n'est perdue (FR-43).
- `[ASSUMPTION : dix ans partout, aligné sur le journal de l'assurance ; durée à valider par le juriste, point J-IA-06 du §20.2]`

#### FR-182 : Dimensionnement du matériel local

Le **palier de matériel** (P0 repli complet, P1 capacités de calcul et petits modèles, P2 modèle de langage ouvert) est **publié** avec ses besoins (calcul, mémoire, mémoire graphique, disque, latence, débit) et **entre dans le devis** de chaque client en local (FR-41). Une instance sous le palier le plus bas démarre en **repli complet** (règles et gabarits) et **le dit** à l'installation (FR-35). L'ajout d'un **secteur** ou d'une **famille** n'augmente pas silencieusement l'empreinte : un pack déclare son empreinte additionnelle (FR-161) et un avertissement apparaît au-delà du volume testé.

**Conséquences (testables) :**
- Un test de charge sur chaque palier, avec le volume de dossiers de l'hypothèse du devis, mesure les délais de FR-175 et FR-176 ; le résultat est écrit dans la fiche d'empreinte.
- Une instance sous le palier P0 rend `DEGRADE` pour la capacité de langage et le dit à l'écran ; un parcours métier va au bout (FR-35, FR-40).
- Installer un pack de secteur dont l'empreinte dépasse le palier de l'instance affiche l'avertissement avant la mise en service, sans l'empêcher.
- `[ASSUMPTION : voir FR-35 et FR-41 ; les valeurs d'empreinte se fixent par mesure avant le premier devis]`

#### FR-183 : Coût d'inférence maîtrisé

Chaque organisation a un **quota d'inférence** mensuel, **ferme**, fixé au contrat (`ia.cout.quota_mensuel`) : au-delà, `QUOTA_INFERENCE_DEPASSE` (429) et la capacité retombe sur la règle (FR-31, FR-139). Une **alerte** prévient le responsable à `ia.cout.alerte_pct` du quota. Le **coût de chaque proposition de langage** (jetons, durée, fournisseur) est mesuré et rapporté par capacité et par organisation (FR-71) ; en local, le coût est celui du matériel du palier. L'IA **préfère toujours la règle ou le modèle statistique** quand ils suffisent, et n'appelle le modèle de langage que pour les capacités qui le demandent (FR-45, FR-112).

**Conséquences (testables) :**
- Un test épuise le quota d'une organisation : les propositions de langage retombent sur la règle, les autres organisations ne sont pas ralenties (FR-31) ; l'alerte part à `ia.cout.alerte_pct`.
- Le rapport mensuel d'une capacité de langage donne le nombre de propositions, le coût et le coût par proposition acceptée (FR-71).
- Aucune capacité qui peut être servie par N0 ou N1 n'appelle un modèle de langage : un test d'inspection le vérifie par capacité.
- `[ASSUMPTION : le quota par organisation est posé au contrat avec le client ; le défaut est « illimité en N0 et N1, plafonné en langage »]`

#### FR-184 : Observabilité de l'IA

L'IA expose, par organisation, capacité et version : le **nombre de propositions** et leur statut, les **latences**, le **taux de repli** sur la règle, le **taux de refus nommés**, le **taux d'acceptation, de modification et de rejet** (FR-68), l'**âge du modèle et de la calibration** en service, la **dérive** (FR-73) et le **coût** (FR-183). Les métriques sont **agrégées**, **sans contenu** ni identifiant de personne, conservées `ia.obs.retention_jours` ; seuls les **indicateurs de niveau 0** quittent l'instance, en schéma fermé (FR-86). Un **tableau de bord** par rôle (responsable, DSI, équipe IA de Money Vibes pour les agrégats) les montre.

**Conséquences (testables) :**
- Un test remplit le signal hebdomadaire d'une instance : aucun champ libre, aucun identifiant, aucun contenu métier (FR-86).
- Chaque indicateur du §16 se **recalcule depuis les données** (journal, écarts, faits de réalité) ; un test recalcule et compare.
- Une alerte (dérive, quota, service muet, modèle refusé) a un destinataire, un délai et une consigne ; une alerte sans destinataire est un défaut.
- `[ASSUMPTION : 13 mois de conservation des métriques agrégées, pour comparer une année à la précédente]`

#### FR-185 : Montée en charge en ligne et ajout de clients

Le service en ligne **monte en charge par ajout d'instances** sans changer les contrats : l'ajout d'une organisation ne demande ni redémarrage ni migration des autres (FR-30, FR-31). La **calibration nocturne** de toutes les organisations se répartit dans la nuit pour ne pas dépasser `ia.recalibration_cpu_max_pct` de la capacité en heures ouvrées de la plus chargée (FR-59). L'ajout d'un secteur ou d'un pays ne touche pas aux autres (FR-160, FR-167).

**Conséquences (testables) :**
- Un test ajoute une organisation à un service chargé : aucune interruption, aucune dégradation mesurée des autres au-delà de FR-178.
- Un test lance la recalibration de 50 organisations simulées : la charge en heures ouvrées reste sous la borne et la tournée est finie avant l'heure d'ouverture.
- `[ASSUMPTION : l'ordre de grandeur de dimensionnement (nombre d'organisations, volume de propositions par jour) est donné par l'équipe commerciale ; faute de chiffre, la recette se fait sur 50 organisations simulées]`

#### FR-186 : Compatibilité et évolution des contrats

Le **contrat de proposition** (annexe B), le **catalogue des capacités** et le **pack de secteur** sont **versionnés** ; un changement incompatible est une **nouvelle version majeure**, et **`ia.catalogue.versions_maintenues`** versions du catalogue sont servies en parallèle (IA-P85, FR-169). Une version du code lit les données de la précédente (« N et N-1 », moteur AD-33) ; « promouvoir, saisir, revenir » passe pour chaque migration. Un champ ou un code ajouté est lu comme **inconnu** par la version précédente, qui **refuse** la transition plutôt que de la deviner.

**Conséquences (testables) :**
- Un test joue le contrat de proposition de la version N-1 contre le service en version N : lecture sans perte ; un code d'erreur nouveau est refusé proprement par un consommateur ancien.
- Un test installe deux versions du catalogue : chaque module voit la sienne (FR-161).
- Un retour arrière de code ou de modèle tient en une action, dans `ia.retour_arriere_max_min` (FR-67).

#### FR-187 : Accessibilité, langue et lisibilité

Toute proposition, provenance, explication et motif s'affiche **en français clair**, sans jargon (FR-4, FR-24), dans des **composants communs** accessibles au clavier et lisibles à l'écran sur un poste modeste ; le **vocabulaire** est celui du logiciel (FR-90, FR-162). Les **langues locales** ne sont pas du premier jour (FR-138). Un chiffre porte son unité, sa source et sa date (FR-132). Le mot « IA » n'est utilisé que pour N1, N2 et le langage (FR-24).

**Conséquences (testables) :**
- Un test parcourt chaque composant d'affichage d'une proposition au clavier seul : tous les gestes (accepter, modifier, rejeter, voir pourquoi) sont atteignables.
- Un test de glossaire compare les libellés affichés au vocabulaire du logiciel (FR-11) : aucun libellé hors vocabulaire.

#### FR-188 : Résilience, sauvegarde et restauration

Les **modèles en service et précédent**, la **calibration**, le **journal des écarts**, le **registre** et les **fiches de capacité** se sauvegardent et se restaurent **avec les données** de l'organisation (FR-87). Un **modèle absent** après restauration est réinstallé depuis le paquet signé ; en attendant, l'IA retombe sur N0 (FR-53). Le **test de restauration mensuel** inclut l'IA ; il vérifie l'empreinte de la calibration et la **même** proposition de référence. Le **registre des consentements n'est jamais restauré** (FR-87).

**Conséquences (testables) :**
- Le test mensuel de restauration inclut l'IA : l'empreinte de la calibration et la proposition de référence sont identiques à celles de la sauvegarde.
- Un test restaure une instance sans son modèle : retour sur N0 visible, puis réinstallation depuis le paquet signé sans perte.

#### FR-189 : La conformité se prouve par des tests rejoués à chaque livraison

La chaîne de livraison rejoue, à **chaque version** du code, d'un modèle, d'une règle ou d'un pack : (1) la **suite de contrat** de la proposition, à l'identique en ligne et en local (FR-30) ; (2) la **non-régression par secteur** sur le jeu de dossiers figés (FR-167) ; (3) l'**équité** (FR-70) ; (4) les **textes piégés** (FR-179) ; (5) la **recherche de secrets, de ports et de connexions de base** (FR-32, FR-38) ; (6) la **complétude du catalogue** : une capacité, un vocabulaire, un objectif de chaque famille, un fait de réalité (FR-57, FR-68, FR-90) ; (7) le **tableau de contrôle** de FR-130. Un échec **bloque la promotion**.

**Conséquences (testables) :**
- Un candidat qui échoue à l'une des sept familles de test n'est pas promu ; le refus nomme la famille.
- Le rapport de livraison est conservé avec la version et lisible par l'auditeur.

---

## 16. Indicateurs de réussite

La phrase à faire disparaître est : **« L'IA a dit quelque chose, mais on ne sait pas si elle avait raison. »** Tout indicateur se **recalcule depuis les données** (FR-184) ; aucun n'est saisi. Chaque indicateur porte un identifiant **SM-n**, une **requête de calcul**, une **source** et un **propriétaire**. Les **valeurs de départ** se mesurent au démarrage et sur les premières semaines de chaque client ; les **cibles chiffrées sont des paramètres** fixés avec lui à la séance de calibrage (annexe D). Aucun indicateur n'est un engagement commercial tant qu'il n'a pas été mesuré (FR-29).

### 16.1 L'indicateur phare : « qui avait raison ? »

| Id | Indicateur | Mesure | Cible | Source et propriétaire |
|---|---|---|---|---|
| **SM-1** | **Taux « qui avait raison » : sur une période glissante, parmi les désaccords entre l'IA et l'humain tranchés par la réalité, part où l'IA avait raison, part où l'humain avait raison, part indécidable** | par capacité, agent, agence, client et en global ; avec l'**effectif**, l'intervalle d'incertitude et la date de mise à jour ; période `ia.desaccord_periode_mois` (12 mois) ; non significatif sous `ia.desaccord_min_cas` | **aucune valeur promise.** Cible de présence : un taux publié, avec effectif, pour **chaque capacité** qui a un fait de réalité déclaré, après la première échéance de constat ; la valeur cible se fixe avec chaque client | FR-74, FR-75 ; recalculé depuis les écarts et les faits de réalité ; propriétaire : le responsable de la capacité, et l'équipe IA de Money Vibes pour le global |

**Pourquoi c'est l'indicateur phare.** Il est à la fois (1) la **preuve** que l'IA s'améliore ou non, (2) la **donnée d'apprentissage** la plus précieuse (là où l'humain avait raison, le modèle se corrige, FR-75) et (3) la **preuve commerciale** : une phrase exportable, agrégée et anonymisée, que le client peut montrer à qui il veut (« sur 12 mois, quand l'IA et l'humain étaient en désaccord, l'IA avait raison dans X % des cas, sur N cas, dans M organisations »). L'export ne contient **aucun nom** ni identifiant ; un groupe sous `k` n'est pas publié (FR-75, FR-77). **Garde-fous de la preuve :** elle n'est jamais publiée sans son effectif ; un taux sur peu de cas se dit « non significatif » ; le biais de sélection des instances isolées est dit (FR-61) ; le taux ne change **aucune décision** et n'évalue **aucun employé** par l'IA seule (FR-75, point J-IA-03). `[ASSUMPTION : le taux de désaccord par agent n'est visible que du responsable et de l'agent, jamais des pairs ; son usage en droit du travail est un point juridique, §20.2]`

### 16.2 Les autres indicateurs

| Id | Indicateur | Mesure | Cible | Source et propriétaire |
|---|---|---|---|---|
| SM-2 | Couverture par la vérité terrain | part des capacités à propos d'un tiers, d'une prévision ou d'une recommandation qui ont un fait de réalité déclaré et un horizon | 100 % | FR-57, FR-74, FR-164 ; fiche de capacité ; équipe IA |
| SM-3 | Usage : acceptation, modification, rejet, expiration | taux par capacité sur 30 jours ; signal de validation de façade au-dessus de `ia.acceptation_facade_pct` | taux publiés ; **aucune alerte de façade non traitée** | FR-68, FR-27 ; rapport mensuel ; responsable |
| SM-4 | Effet métier | par capacité : baisse du PAR, délai d'un sinistre, taux de recouvrement, temps gagné, marge incrémentale d'un package | par capacité, fixé avec le client ; mesuré **avant** et **contre un témoin** quand c'est possible | FR-68, FR-92, FR-122 ; faits de réalité ; client |
| SM-5 | Qualité | précision, rappel, calibration par capacité ; écart avec la règle N0 sur le jeu d'évaluation | le modèle bat la règle avant de servir | FR-69 ; jeu d'évaluation ; équipe IA |
| SM-6 | Équité | écart de taux d'acceptation, de refus et de score par sous-groupe (genre, zone, secteur) | **aucune régression** à la promotion ; écart sous `ia.equite_ecart_max_pts` | FR-70 ; rapport mensuel ; responsable et juriste |
| SM-7 | Jamais bloquante | parcours terminés avec l'IA coupée, par logiciel | 100 % | FR-15, FR-40 ; test de chaos ; équipe IA |
| SM-8 | Rapidité | 95e centile des délais de proposition et de réponse du Copilot | sous les plafonds de FR-175 et FR-176 | FR-175, FR-176 ; mesure du service |
| SM-9 | Fraîcheur | âge du modèle commun et de la calibration en service ; part des instances à jour ; part des instances en gel | publiés par instance et en global | FR-63, FR-66, FR-72, FR-85 ; rapport global |
| SM-10 | Retour arrière | durée d'un retour arrière ; nombre de retours par trimestre | sous `ia.retour_arriere_max_min` | FR-67 ; journal de promotion |
| SM-11 | Dérive | délai entre l'apparition d'une dérive et son alerte ; nombre d'incidents de régression de qualité ou d'équité | sous `ia.derive_delai_alerte_h` | FR-73 ; supervision |
| SM-12 | Adoption du socle | part des appels d'IA des quatre logiciels qui passent par le port unique ; nombre d'appels directs à un fournisseur de modèle ou de constantes de barème dans un module | 100 % ; **0** | FR-37 ; garde de balayage |
| SM-13 | Registre complet | propositions affichées sans entrée du registre | **0** | FR-17 ; test de comparaison |
| SM-14 | Ouverture d'un secteur | secteurs ajoutés sans modifier le noyau, avec zéro régression sur les secteurs en place ; durée de la checklist | tous ; durée mesurée à chaque ajout | FR-160, FR-167, FR-174 ; chaîne de livraison |
| SM-15 | Coût | coût d'inférence par organisation et par proposition acceptée ; consommation du quota | sous le quota du contrat | FR-183 ; rapport mensuel |

### 16.3 Contre-indicateurs

Un indicateur qui monte peut cacher un mal. Chaque contre-indicateur est **surveillé avec** l'indicateur qu'il garde ; **une amélioration de l'indicateur ne compte pas** tant que son contre-indicateur se dégrade.

| Id | Contre-indicateur | Ce qu'il garde | Seuil d'alerte |
|---|---|---|---|
| CI-1 | **Validation de façade** : taux d'acceptation très élevé et motifs identiques à la proposition | SM-3 (usage) et SM-1 | taux sur 30 jours au-dessus de `ia.acceptation_facade_pct` ; motifs identiques au-dessus de IA-P08 (FR-27) |
| CI-2 | **Biais d'automatisation** : acceptation sans consultation de la provenance ni de l'explication | SM-3 | part des propositions acceptées sans ouverture de l'explication ; seuil par capacité |
| CI-3 | **Biais de sélection de la preuve** : le taux « qui avait raison » ne vient que d'instances connectées ou de cas faciles | SM-1 | part des instances isolées et des cas indécidables publiée avec le taux (FR-61, FR-72) |
| CI-4 | **Désaccords qui s'évitent** : les humains cessent de contredire l'IA pour ne pas écrire de motif | SM-1 | baisse brutale du nombre de désaccords sans baisse du nombre de propositions |
| CI-5 | **Motif « autre » en hausse** : la liste fermée de motifs ne couvre plus la réalité | FR-58 | part de « autre » au-dessus d'un seuil par capacité |
| CI-6 | **« Je ne sais pas » en excès** : l'IA se tait pour ne pas se tromper | SM-5 | taux d'abstention au-dessus d'un seuil par capacité (FR-54) |
| CI-7 | **Précision qui baisse sous masquage** | SM-5 | écart masqué contre non masqué mesuré à la recette (FR-34) |
| CI-8 | **Opposition et observations** : demandes d'opposition à un profilage (art. 27) en hausse | SM-3 | nombre mensuel par capacité (FR-21, FR-22) |
| CI-9 | **Coût qui explose** sans gain de qualité ni d'effet | SM-15 | coût par proposition acceptée au-dessus d'un seuil du contrat |
| CI-10 | **Régression sur un secteur non visé** à la promotion | SM-14 | tout écart au-dessus de IA-P80 (FR-167) |

---

## 17. Périmètre

### 17.1 Dans le périmètre au premier jour

1. **Le socle `ia`** : contrat de proposition unique (FR-12), registre de l'IA (FR-17), catalogue des capacités versionné avec vocabulaire par logiciel (FR-90), niveaux N0, N1 et N2 sous un même contrat (FR-45 à FR-54), calibration locale nocturne bornée (FR-59, FR-60), écarts et faits de réalité (FR-56 à FR-58), évaluation et objectifs (FR-68 à FR-73), désaccords confrontés à la réalité et taux « qui avait raison » (FR-74, FR-75).
2. **Les 19 familles de capacités** du catalogue, en règle N0 partout, en modèle commun N1 là où il est prêt, pour les quatre logiciels (§10, FR-91) ; le tableau de contrôle ne laisse aucune ligne orpheline (FR-130).
3. **Le Copilot en texte, en lecture seule**, pour les quatre logiciels (FR-115, FR-131 à FR-133), et les **agents sous mandat** pour les actions non engageantes et réversibles (FR-134 à FR-137).
4. **La lecture de pièces** par OCR dans `document-service` et classement dans l'IA (§12).
5. **En ligne et en local, un seul code** (FR-30) : isolation (FR-31), instance sous l'agent sans port entrant (FR-32), passerelle de langage (FR-33, FR-34), modèle ouvert local ou repli (FR-35), santé hors instance (FR-36).
6. **Les modules** `ia`, `assistant` et `automatisations`, et la **centrale** chez Money Vibes (annexe A), avec la boucle commune : finalité « apprentissage commun » (FR-76), niveau d'export propre (FR-77), jeton quotidien (FR-78), modèle signé sur une ligne distincte, plan de promotion, retour arrière (FR-62 à FR-67).
7. **La voix comme réglage du pack de secteur** : saisie vocale de terrain pour la microfinance au premier jour ; sans voix pour l'assurance ; `BIENTOT` pour le distributeur et le cabinet (FR-138, FR-161).
8. **Le format de pack de secteur et son isolation** (§14, FR-160 à FR-174) : les quatre logiciels sont les quatre premiers packs.
9. **Les exigences transverses** du §15 et les indicateurs du §16.
10. **Les packages de vente du distributeur et la mesure de leur impact** (FR-122).

### 17.2 « Bientôt » (sans date, bouton « bientôt » à l'écran, aucun appel réel)

- Le **chatbot de messagerie** de l'assuré, du client ou du prospect, et les **langues locales** (FR-138).
- La **voix** du distributeur et du cabinet (réglage de leur pack).
- Les capacités marquées `BIENTOT` du catalogue (FR-128) : qualification de leads par chatbot, lecture d'une commande par message, fraude sur espèces du distributeur, détection de départ d'un client, comparaison avec d'autres distributeurs, routage routier réel.
- Le **modèle de vision** pour la lecture de pièces (FR-145), le **premier modèle commun réellement entraîné** sur de l'apprentissage commun (au mieux au second semestre 2027, FR-47, FR-91).
- Un **catalogue de modèles ouverts** plus large pour les langues locales.

### 17.3 Horizon (feuille de route de la vision, sans PRD ni engagement)

Risque comme produit, Pulse, Météo des prix et de la demande, distribution en pilote automatique, facture certifiée qui vaut crédit, argent programmable sur PI-SPI, assurance embarquée, Relation client commune, passeport financier, agents IA métier à grande échelle, modèle de fondation sectoriel et transfrontalier (FR-146 à FR-159) ; le **croisement d'une même PME entre verticales**, qui exige une identité partagée et un consentement explicite (FR-82, FR-151) ; l'**apprentissage fédéré** (FR-62) ; la **place de marché de packs** et le partage des revenus (FR-173).

### 17.4 Ordre de construction recommandé (sans valeur de périmètre)

Le PO a demandé de **tout charger dans le plan sans regarder la capacité** (« on va y arriver »). L'ordre ci-dessous est une recommandation de séquence, pas un retrait de périmètre.

1. **Le contrat de proposition, le registre, le catalogue et la règle N0** (sans eux, rien d'autre ne tient) ; le port unique et `CAPACITE_NON_DECLAREE`.
2. **Les capacités N0 par logiciel**, dans l'ordre où le logiciel en a besoin au démarrage ; l'**affichage commun** de la provenance.
3. **Le Copilot en texte** sur le corpus de chaque logiciel ; la passerelle ; le repli.
4. **Les écarts, les faits de réalité et la calibration locale**, puis les **rapports** et le **taux « qui avait raison »**.
5. **La centrale** : agrégation, entraînement, signature, plan de promotion ; le premier modèle commun vient en dernier.
6. **Les packs de secteur** : les quatre premiers servent de preuve du format avant d'en ouvrir un cinquième.

**Critère de mise en service pour un client.** Une capacité est mise en service quand : sa fiche est complète (objectifs, fait de réalité, vocabulaire, interdictions de sortie) ; la **suite de contrat** passe (FR-189) ; son mode `NON_INSTALLE` ou `INDISPONIBLE` est testé ; et, pour un score de crédit ou d'assurance, la **revue juridique** est faite (FR-28).

---

## 18. Non-objectifs

1. **L'IA ne décide pas.** Aucune décision à effet juridique ou financier sur une personne (crédit, garantie, sinistre, paiement, refus, blocage) n'est prise par l'IA ; il n'existe ni décideur « système » ni niveau « décision » (FR-12, FR-13).
2. **Aucune action autonome sur un type engageant ou irréversible**, même sous mandat (FR-14, FR-134).
3. **Pas d'IA par client** : aucune variante de code, aucun modèle propre à un seul module ; une différence passe par les paramètres et la calibration (FR-30).
4. **Pas d'entraînement sur les données d'un client hors de sa finalité consentie**, et aucune donnée d'un client au service de l'IA d'un autre (FR-7, FR-76).
5. **Aucune donnée de santé** vers un modèle hors de l'instance, aucune dans un lot d'apprentissage, même anonymisée (FR-19, FR-36, FR-143).
6. **Pas d'apprentissage fédéré** au premier jour (FR-62) ; **pas de croisement inter-verticales** sans identité partagée et consentement explicite (FR-82, FR-151).
7. **Pas de désapprentissage d'un modèle déjà publié** : le retrait d'un consentement arrête l'usage futur ; c'est dit au contrat (FR-79, FR-81).
8. **Pas de promesse de gain chiffré** avant la première mesure ; aucun taux ni aucune cible n'est une garantie (FR-29, FR-68).
9. **Pas de reproche nominatif aux pairs** : le chiffre d'un agent n'est visible que de lui et de son responsable, et ne l'évalue jamais seul (FR-75).
10. **Pas d'application d'IA pour la personne concernée** : elle reçoit des messages et présente ses observations par le canal de l'institution (FR-22).
11. **Pas de remplacement de l'OCR** : la reconnaissance de caractères reste dans `document-service` (FR-140).
12. **Pas de tenue de comptabilité, de police ou de crédit par l'IA** : elle ne crée aucune écriture au grand livre, aucun contrat, aucun prêt ; Money Vibes **ne prête ni n'assure** (FR-147 à FR-149).
13. **Pas de montant proposé sur un objet interdit** (corporel en assurance), ni de prix au revendeur indépendant (FR-20, FR-128).
14. **Pas de modèle de fondation entraîné de zéro** par Money Vibes au premier jour ; les grands modèles de langage sont hébergés ou ouverts (FR-33, FR-35, FR-158).
15. **Pas de place de marché de modèles** ni de partage de revenus fixé ici (FR-173).

---

## 19. Décisions, actions et risques

### 19.1 Décisions du PO (récit et ajouts, 2026-11-13)

`.memlog.md` date les décisions du PO. Le 2026-11-13, le PO a demandé, en mode rapide : « on va sur tes recommandations ». Les décisions D1 à D14 du §19.2 sont donc des **recommandations retenues** ; les décisions ci-dessous sont **de sa parole**.

| # | Décision du PO | Où |
|---|---|---|
| DP-1 | L'IA sert les **quatre logiciels** (expert-comptable, distributeur, microfinance, assurance) ; elle fournit les **premières informations dès le premier jour**, puis **continue d'apprendre et se met à jour** pour atteindre ses objectifs | FR-1, FR-5, FR-6 |
| DP-2 | **Une seule IA Prospera** pour tous ses logiciels, **en local** (instance chez le client) comme **en ligne** (SaaS) | FR-1, FR-30 |
| DP-3 | **Garder chaque désaccord humain/IA** (ex. : l'IA dit « client non solvable », la chargée de crédit la contredit), le **confronter à la réalité** (retards d'échéance pour une IMF, à l'horizon), et publier le **pourcentage « qui avait raison »** par période, capacité, agent, agence et client ; **donnée d'apprentissage ET preuve commerciale** exportable, agrégée et anonymisée (« surtout pour vendre ») | FR-74, FR-75, SM-1 |
| DP-4 | Côté **distributeur**, l'IA aide au **marketing** : création de **packages de vente** (lots, prix, cibles) et **mesure de leur impact** (ventes, marge, panier, points de vente touchés, avant/après, groupe témoin), avec rapport par package et par campagne | FR-122 |
| DP-5 | **Ajouter un secteur ou un pays doit être facile sans rien perturber**, en tenant compte de la vision de la salle (Prospera partout dans le monde, kit public, place de marché, « on ouvre le format, on garde l'IA ») | §14, FR-160 à FR-174 |
| DP-6 | Mode **rapide** : tout est chargé dans le plan sans regarder la capacité (« on va y arriver ») ; après le PRD : spine, épics, plan, manifestes restants | §17.4 |
| DP-7 | **La voix se règle par pack de secteur** : saisie vocale de terrain pour la **microfinance** au premier jour (comme son PRD validé) ; **assurance** sans voix ; **distributeur et cabinet** : bientôt (correction de D12) | FR-138, FR-161 |
| DP-8 | Doctrines reprises : l'IA propose, l'humain décide ; provenance affichée ; règles explicables sans modèle ; jamais bloquante ; écarts anonymisés par tunnel sortant et mises à jour versionnées retirables ; aucune donnée nominative ni médicale ne sort ; jamais de montant corporel proposé | §4 |

### 19.2 Décisions de cadrage D1 à D14 (par recommandation)

| # | Décision retenue | Où |
|---|---|---|
| D1 | Une seule IA, un seul code, en ligne et en local ; quatre logiciels clients ; verticales futures servies sans toucher au noyau | FR-1, FR-30 |
| D2 | `prospera-ia-service` (port :3417, ancien `assistant-service` jamais codé, dont il reprend et étend le PRD et la spine) porte les modules `ia`, `assistant` et `automatisations` ; `prospera-ia-centrale` tourne **seulement chez Money Vibes** | FR-43, annexe A |
| D3 | Capacités versionnées en 19 familles, déclarées par les modules (clause C11), vocabulaire par logiciel, droits de l'utilisateur | FR-37, FR-90, §10 |
| D4 | Un contrat de proposition unique : origine `REGLE | MODELE | LANGAGE`, niveau, statut, décideur, provenance, confiance, sources, explication ; immuable et chaîné | FR-12, annexe B |
| D5 | L'IA propose, l'humain décide ; autonomie seulement non engageante, réversible, sous mandat ; jamais bloquante | FR-13, FR-14, FR-15 |
| D6 | Trois niveaux par capacité : N0 règles expertes, N1 modèle commun là où prêt, N2 calibration ou modèle propre au seuil mesuré ; le mot « IA » seulement pour N1 et N2 | FR-45 à FR-54 |
| D7 | Boucle locale continue (recalibration nocturne bornée) et boucle commune périodique (modèle signé, ligne distincte, plan de promotion, retour arrière) ; sans contact, l'IA sert indéfiniment | FR-59 à FR-67, FR-85 |
| D8 | Objectifs mesurés par capacité (qualité, usage, effet métier, équité) ; champion/challenger sans régression d'équité ; rapports mensuels local et global | FR-68 à FR-73 |
| D9 | Finalité « apprentissage commun » consentie au contrat ; niveau d'export « apprentissage » propre ; croisement inter-verticales en horizon ; retrait d'un consentement = arrêt de l'usage futur | FR-76 à FR-82 |
| D10 | Même code, mêmes contrats en ligne et en local ; passerelle unique en ligne, modèle ouvert sur le serveur du client en local, repli dit ; aucune donnée de santé hors de l'instance | FR-32 à FR-36 |
| D11 | Garde-fous généralisés : provenance, registre, jamais bloquante, équité, santé, « interdit de proposer un montant », explication, opposition, journal des accès | FR-16 à FR-23 |
| D12 | Copilot au premier jour pour les quatre logiciels, en texte, en lecture seule ; agents sous mandat pour les actions non engageantes ; **la voix est un réglage du pack de secteur** (microfinance : saisie vocale de terrain au jour 1 ; assurance : sans voix ; distributeur et cabinet : bientôt) ; chatbot de messagerie et langues locales : bientôt `[ASSUMPTION : le PRD distributeur mettait le Copilot « bientôt » ; la décision du PO sur l'IA commune le remonte]` | FR-115, FR-131 à FR-138 |
| D13 | OCR dans `document-service` ; lecture et classement dans l'IA ; modèle de vision plus tard | FR-140 à FR-145 |
| D14 | Les produits de la vision sont de la feuille de route, avec les familles dont chacun dépend ; garde-fous de la vision repris ; Money Vibes ne prête ni n'assure | FR-146 à FR-159 |

### 19.3 Actions qui restent

Ces points ne bloquent pas l'écriture, mais chacun doit être tranché avant l'architecture ou les épics. Les quatre premiers sont des **amendements de la spine du moteur d'installation**.

| # | Action | Ce que le PRD fait en attendant | Bloque | Où |
|---|---|---|---|---|
| A-1 | **Spine du moteur : une ligne de modèles distincte** de la ligne de la plateforme, avec sa propre cadence au plus hebdomadaire (amende AD-3 et AD-32) | le PRD dit que la ligne est distincte ; la mécanique de signature et de plan de promotion est celle du moteur | épics de la centrale | FR-63 |
| A-2 | **Spine du moteur : un usage « modèle »** ajouté à la chaîne de clés de la famille `ci` (amende AD-7 et AD-28) | le PRD dit que tout modèle est signé par une clé dont l'usage le couvre | signature des modèles | FR-83 |
| A-3 | **Spine du moteur : une régression de qualité ou d'équité est comptée comme un incident** de la liste du moteur (T-11) | le PRD l'écrit en FR-73 ; le moteur n'a que les incidents de plateforme | alertes et astreinte | FR-73 |
| A-4 | **Spine du moteur : les faits « prédiction » et « réalité »** ajoutés au catalogue des contrats nommés (T-12), schéma versionné testé des deux côtés | le PRD fixe l'existence et le propriétaire des faits ; leurs noms sont ceux de l'architecture | boucle d'apprentissage | FR-38, FR-57 |
| A-5 | **Spine du moteur : le niveau d'export « apprentissage »** et le **manifeste type** approuvé une fois (niveau 3, T-06) | le PRD le décrit ; à confirmer dans l'architecture et par le juriste | envoi des écarts | FR-77 |
| A-6 | **Spine du moteur : la machine d'IA à part**, gérée par l'agent comme dernier recours (T-02) | le PRD la permet sans la rendre normale | dimensionnement local | FR-32 |
| A-7 | **Amendement du PRD distributeur : le Copilot passe au premier jour** (il le mettait « bientôt ») ; ses tableaux d'IA sont repris dans le catalogue avec leur FR d'origine | FR-115 et FR-131 font foi pour le moteur et les garde-fous ; le PRD distributeur garde le métier | recette distributeur | FR-2, FR-115 |
| A-8 | **Amendement du PRD assistant (août)** : remplacé sur le socle par l'IA commune, qui reprend ses agents sous mandat et son catalogue de types d'action | FR-2 dit ce qui est remplacé, étendu ou laissé | spine de l'IA | FR-2, FR-134 |
| A-9 | **Revue juridique** avant la mise en service d'un score de crédit ou d'assurance, et avant l'export du taux « qui avait raison » ; points J-IA du §20.2 | le PRD pose des défauts prudents | mise en service | FR-28, §20.2 |
| A-10 | **Nommer le responsable de publication** du catalogue des types d'action et les **validateurs par ligne** de modèles | défauts du PRD | publication | FR-134, FR-174 |
| A-11 | **Mesurer les paliers de matériel** P0-P1-P2 avant le premier devis | valeurs à fixer par mesure | devis en local | FR-41, FR-182 |
| A-12 | **Déclarer la devise du contrat de balance** avant le deuxième pays | le PRD l'impose en exigence | pays suivant | FR-171 |
| A-13 | **Confirmer la date du premier modèle commun** (au mieux second semestre 2027) avec la note de vision | aucun score n'est annoncé « IA » au premier jour | communication commerciale | FR-91 |
| A-14 | **Séance de calibrage avec chaque client** : cibles chiffrées, horizons de vérité terrain, seuils d'équité | défauts de l'annexe D | première mesure | FR-68, FR-74 |
| A-15 | **Déclarer la clause C11** dans le manifeste de chacun des quatre logiciels et écrire les **manifestes** de `ia`, `assistant`, `automatisations` et de la centrale | annexe A | installation | FR-37, FR-43 |
| A-16 | **Suite : spine de l'IA, épics, plan** | le PRD est la source | — | §17.4 |

### 19.4 Risques assumés

| Risque | Effet | Ce que le PRD fait |
|---|---|---|
| **Le premier jour n'a pas de modèle appris.** Les règles N0 peuvent paraître pauvres ou sembler « pas de l'IA ». | Déception du client ; pression pour appeler « IA » une règle. | Le mot « IA » seulement pour N1 et N2 (FR-24) ; N0 présentée comme règle ; ce que ce PRD ne promet pas est écrit (FR-29). |
| **Peu de vérité terrain au début.** Les retards d'échéance se constatent à 3, 6 et 12 mois ; le taux « qui avait raison » est lent à naître. | Le phare reste « non significatif » longtemps. | Plusieurs échéances par capacité (FR-74) ; publication « non significatif » sous `ia.desaccord_min_cas` ; autres indicateurs (SM-3 à SM-5) dès le premier mois. |
| **Biais de sélection** : les instances isolées ne remontent rien ; les clients connectés sont surreprésentés. | Preuve commerciale trop flatteuse. | La part des instances isolées est publiée avec le taux (FR-61, FR-72) ; CI-3. |
| **Validation de façade** : l'humain accepte tout. | L'IA a l'air juste parce qu'on ne la contredit pas. | CI-1, CI-2 ; alerte à 90 % sur 30 jours (FR-27, FR-68). |
| **Fuite de donnée de santé ou personnelle** vers un modèle hébergé. | Atteinte grave. | Refus nommé `SANTE_HORS_INSTANCE` ; passerelle qui masque, journalise et ne retient rien ; transferts déclarés (FR-34, FR-36, FR-80). |
| **Dépendance à un fournisseur de langage** (prix, indisponibilité, pays). | Coût ou arrêt du Copilot. | Repli sur règles et gabarits (FR-35, FR-133) ; quota ferme (FR-183) ; fournisseur remplaçable derrière la passerelle. |
| **Matériel local insuffisant** pour un modèle ouvert. | Copilot dégradé chez l'IMF ou l'assureur. | Paliers publiés, devis, repli complet dit à l'écran (FR-41, FR-182). |
| **Régression sur un secteur non visé** à la promotion d'un modèle ou d'un pack. | Un client perd en qualité sans le savoir. | Non-régression par secteur obligatoire (FR-167) ; contre-indicateur CI-10. |
| **Points de droit non lus** : art. 27 de la loi 2019-014 sur les décisions automatisées, transfert d'une invite hors du pays, usage du taux par agent en droit du travail, niveau 3 des écarts. | Un défaut prudent peut être trop ou pas assez prudent. | **Revue juridique obligatoire** avant la mise en service d'un score de crédit ou d'assurance ; défauts prudents du §20.2 ; textes non lus signalés « à vérifier par le juriste ». |
| **La preuve commerciale est mal comprise ou mal utilisée** (« l'IA a raison à X % » lue comme une garantie). | Engagement implicite. | Effectif et date toujours publiés ; phrase gabarit figée ; aucune promesse (FR-29, FR-75). |
| **Charge de l'équipe** : tout est chargé dans le plan sans regarder la capacité. | Retard ou dette. | Ordre de construction recommandé (§17.4) ; suite : spine, épics, plan, avec la charge réelle. |
| **Confusion entre l'IA commune et les IA de verticale** si un PRD de verticale se ré-écrit seul. | Retour de plusieurs IA. | FR-2 : en cas d'écart, ce PRD fait foi pour le moteur et les garde-fous ; amendements A-7 et A-8. |
| **Un modèle commun publié ne se désapprend pas** : un client qui retire son consentement garde une trace dans un modèle déjà publié. | Plainte. | Dit au contrat (FR-79, FR-81) ; composition tracée ; point J-IA-05. |

---

## 20. Hypothèses

Dans le brouillon, chaque choix incertain porte une balise `[ASSUMPTION : …]` dans le texte. Le PO a délégué ces choix à la rédaction : les balises sont des **défauts retenus sur recommandation**. Ce §20 les **indexe toutes**, par thème, avec la FR ou la section qui les porte, pour qu'il n'y en ait **aucune cachée**. Les défauts **H-IA-nn** sont des choix de gestion ou de conception ; ils se **confirment à la séance de calibrage avec chaque client** (propriétaire : le PO avec le client) ou à l'architecture. Les points **J-IA-nn** sont des points de droit ; ils se **tranchent à la revue juridique** avant la mise en service d'un score de crédit ou d'assurance (§20.2). Un défaut **confirmé ou changé** se met à jour dans l'annexe D, **sans reprise du code**.

### 20.1 Défauts retenus sur recommandation

| Id | Où | Thème | Défaut retenu |
|---|---|---|---|
| H-IA-01 | FR-3 | Cadre | les valeurs par défaut des paramètres sont des recommandations ; le PO les confirme à la relecture et à la séance de calibrage |
| H-IA-02 | §0, FR-3 | Cadre | un `FR-n` sans préfixe est une exigence de ce PRD ; les autres PRD portent leur préfixe |
| H-IA-03 | §1 | Cadre | le premier modèle commun réel au mieux au second semestre 2027 (date de la note de vision, à confirmer) |
| H-IA-04 | FR-5 | Cadre | cible du délai d'aide à fixer avec le moteur d'installation |
| H-IA-05 | FR-12 | Contrat | le contrat unifie la Proposition de l'assistant et le PropositionPort de la microfinance et ajoute l'origine `MODELE` |
| H-IA-06 | FR-7, FR-9 | Produit | recevoir le modèle commun sans y contribuer reste permis ; le PO peut en faire une contrepartie commerciale |
| H-IA-07 | FR-9, FR-50, FR-115, FR-131 | Produit | le Copilot est au premier jour pour les quatre logiciels, en texte et en lecture seule (le PRD distributeur le mettait « bientôt ») |
| H-IA-08 | FR-129 (X9) | Produit | assurance : tout reste dû au premier jour ; l'ordre de construction place l'analyse des devis, la simulation et la comparaison en dernier |
| H-IA-09 | FR-129 (X7), FR-138, FR-161 | Voix | la durée de conservation du son est nulle au-delà de la transcription ; paramètre du pack, à confirmer par le PO |
| H-IA-10 | FR-18, FR-70 | Équité | la liste des variables interdites et proxy est fixée à la relecture ; sous-groupes observés : ceux que le module recueille déjà |
| H-IA-11 | FR-28 | Équité | traitement « haut risque » des scores de crédit et d'assurance par anticipation |
| H-IA-12 | FR-93 | Scores | renormalisation des poids restants quand une composante manque |
| H-IA-13 | FR-95 | Scores | motif obligatoire dès le premier écart pour le crédit |
| H-IA-14 | FR-111 | Capacités | le conseil fiscal est codé dans le service de balance sans porte d'installation ; sa reprise par l'IA est à décider |
| H-IA-15 | FR-119 | Capacités | 90 jours de conservation des positions repris pour la microfinance |
| H-IA-16 | FR-134 | Agents | types « engageant, non autonomisable » déclarés au catalogue ; propriétaire du catalogue à nommer |
| H-IA-17 | FR-32 | Exploitation | la machine d'IA à part est un dernier recours de dimensionnement, géré par l'agent |
| H-IA-18 | FR-34 | Exploitation | la précision peut baisser sous masquage fort ; la recette mesure l'écart sur un jeu synthétique |
| H-IA-19 | FR-35, FR-41 | Exploitation | trois paliers P0-P1-P2 ; classes de modèles et mémoire graphique de départ, à mesurer |
| H-IA-20 | FR-88 | Exploitation | la garde du registre est une bibliothèque commune appelée par les interfaces, à confirmer dans l'architecture |
| H-IA-21 | FR-89, FR-181 | Exploitation | dix ans partout pour le registre, faute de durée fixée ailleurs |
| H-IA-22 | FR-55 | Niveaux | le canal des jeux de référence suit celui des modèles ; source de repli « données agrégées de Pulse » en horizon |
| H-IA-23 | FR-47, FR-91 | Niveaux | aucun N1 réellement entraîné avant le second semestre 2027 ; aucun score n'est annoncé « IA » au premier jour |
| H-IA-24 | FR-48 | Niveaux | aucun seuil publié « règle vers modèle » n'existe ; valeurs posées par capacité |
| H-IA-25 | FR-57, FR-38 | Apprentissage | noms exacts des faits « prédiction » et « réalité » fixés par l'architecture |
| H-IA-26 | FR-58 | Apprentissage | le motif libre « exigé » par certains PRD devient un commentaire gardé dans le module, le code étant exigé en plus |
| H-IA-27 | FR-59 | Apprentissage | cadence nocturne, bornes et part de ressources posées par ce PRD |
| H-IA-28 | FR-61 | Apprentissage | biais de sélection des instances isolées publié dans le rapport global |
| H-IA-29 | FR-62 | Apprentissage | l'entraînement n'est pas fédéré |
| H-IA-30 | FR-63 | Apprentissage | la ligne de modèles est distincte de la ligne de la plateforme (amende AD-3 et AD-32) |
| H-IA-31 | FR-65 | Apprentissage | « qui valide » est l'équipe IA de Money Vibes, avec double signature pour une capacité qui touche une personne |
| H-IA-32 | FR-66 | Apprentissage | un nouveau modèle qui change des scores affichés est un comportement visible à déclarer (interrupteur) |
| H-IA-33 | FR-68 | Objectifs | cibles par capacité à fixer avec chaque client ; aucun chiffre d'effet promis avant la première mesure |
| H-IA-34 | FR-73 | Objectifs | seuils de dérive et de gravité à régler sur les premières mesures ; la régression de qualité est un incident |
| H-IA-35 | FR-74 | Objectifs | valeurs d'horizon et seuils de la règle « qui avait raison » posés par capacité |
| H-IA-36 | FR-75, §16 | Objectifs | le taux par agent est visible du responsable et de l'agent seulement |
| H-IA-37 | FR-76 | Données | la finalité est posée dans le vocabulaire fermé ; sa rédaction juridique relève du juriste |
| H-IA-38 | FR-81 | Données | forme exacte de la fiche de composition d'un modèle dans l'addendum |
| H-IA-39 | FR-83 | Données | le modèle commun relève de la famille `ci` avec un usage « modèle » (amende AD-7 et AD-28) |
| H-IA-40 | §14 | Secteurs | les quatre logiciels sont les quatre premiers packs de secteur |
| H-IA-41 | FR-168 | Secteurs | listes des familles transverses et « par secteur » : recommandation à valider |
| H-IA-42 | FR-171 | Secteurs | le contrat de balance n'a pas de devise déclarée ; à payer avant le deuxième pays |
| H-IA-43 | FR-172 | Secteurs | « souveraineté des données pays par pays » est une parole de la salle |
| H-IA-44 | FR-173 | Secteurs | modalités commerciales de la place de marché non fixées |
| H-IA-45 | FR-174 | Secteurs | validateurs par ligne : recommandation ; noms fixés une fois l'équipe constituée |
| H-IA-46 | FR-175, FR-176 | Transverses | plafonds de latence des règles, des modèles et du Copilot |
| H-IA-47 | FR-177 | Transverses | 99,5 % par mois, reprise en 60 minutes, perte maximale de 60 minutes en ligne ; en local, pas d'engagement au-delà de l'instance |
| H-IA-48 | FR-179 | Transverses | jeu de textes piégés d'au moins 100 cas à la première version, tenu par l'équipe IA |
| H-IA-49 | FR-183 | Transverses | quota d'inférence posé au contrat ; défaut « illimité en N0 et N1, plafonné en langage » |
| H-IA-50 | FR-184 | Transverses | 13 mois de conservation des métriques agrégées |
| H-IA-51 | FR-185 | Transverses | dimensionnement en ligne : recette sur 50 organisations simulées faute de chiffre commercial |

### 20.2 Points juridiques : défauts prudents en attendant le juriste

Seule la loi togolaise n° 2019-014 du 29 octobre 2019 (articles 20, 27, 28, 29, 30 et 31) a été lue. Tout le reste (droit sénégalais, ivoirien, BCEAO, CIMA, règlement européen) est **« à vérifier par le juriste »**.

| Id | Où | Point | Défaut prudent en attendant |
|---|---|---|---|
| J-IA-01 | FR-33, FR-34, FR-80 | **Transfert d'une invite vers un grand modèle de langage hors du pays** : l'envoi d'une demande masquée à un fournisseur hébergé hors du pays est-il un « transfert » au sens des art. 28 et 29 ? Faut-il l'information préalable de l'autorité ? | traité comme un transfert à déclarer, par prudence ; aucun envoi tant que le transfert n'est pas inscrit « informé » (`TRANSFERT_NON_DECLARE`) |
| J-IA-02 | FR-77, FR-78 | **Niveau 3 des écarts sous manifeste type** : les écarts agrégés au niveau « apprentissage » sont-ils des contributions de niveau 3 du moteur, approuvées une fois, ou chaque lot exige-t-il une approbation ? Sont-ils des données anonymes ? | contributions de niveau 3 sous un manifeste type approuvé une fois par le DG et le responsable des données de Money Vibes ; refus de tout lot hors manifeste (`LOT_HORS_MANIFESTE`) |
| J-IA-03 | FR-75, §16.1 | **Usage du taux de désaccord par agent en droit du travail** : peut-il entrer dans l'évaluation d'un employé ? Que doit dire le contrat du client ? | visible du responsable et de l'agent seulement ; n'évalue jamais seul ; ne change aucune décision ; exclu de toute règle d'automatisation |
| J-IA-04 | FR-13, FR-14, FR-21, FR-22, FR-28 | **Décisions automatisées, art. 27** : aucune décision de justice, ni produisant des effets juridiques à l'égard d'une personne, sur le seul fondement d'un traitement automatisé destiné à définir son profil. Un score d'aide à la décision, avec décideur humain réel, est-il hors du champ ? Le contrôle de l'humain est-il « réel » (FR-27) ? | l'IA propose, l'humain décide ; droit d'opposition et d'observation ; aucune décision à effet juridique ou financier prise par l'IA ; alerte de validation de façade |
| J-IA-05 | FR-76, FR-79, FR-81, FR-82 | **Consentements** : rédaction de la finalité « apprentissage commun » ; consentement de l'organisation ou des personnes concernées ; effet d'un retrait sur un modèle **déjà publié** (non désentraîné) ; consentement distinct pour les données de santé et pour la voix ; croisement inter-verticales | consentement au contrat par le DG ; retrait = arrêt de l'usage futur dans IA-P14 (24 heures) ; modèle publié non désentraîné, composition tracée ; pas de santé ; croisement exclu du premier jour |
| J-IA-06 | FR-89, FR-181 | **Durée de conservation du registre** et de la trace opposable (dix ans) ; effacement face à une demande d'une personne | dix ans, aligné sur le journal de l'assurance ; effacement par la règle de l'organisation (FR-89) |
| J-IA-07 | FR-18, FR-70, FR-94 | **Variables interdites et variables qui s'y substituent** (genre, situation matrimoniale, nationalité, religion ; nom, quartier, prénom) pour tout score sur une personne | liste fermée ; variables proxy auditées ; test d'impact disparate avant mise en service |
| J-IA-08 | FR-138 | **Dictée vocale de la microfinance** : consentement propre de l'agent et du client ; conservation du son ; localisation de la transcription | consentement propre ; son conservé zéro au-delà de la transcription ; transcription sur l'instance ou par la passerelle déclarée |
| J-IA-09 | FR-35, FR-83 | **Licence des modèles ouverts** et conditions d'usage commercial ; propriété d'un modèle entraîné sur l'apprentissage commun | licence vérifiée avant l'entrée au catalogue (`ia.licence_modele_verifiee`) ; modèle commun propriété de Money Vibes, à confirmer |
| J-IA-10 | FR-76, FR-77 | **Qualité de Money Vibes** (sous-traitant, responsable conjoint ou responsable) pour le modèle commun | sous-traitant pour la plateforme ; responsable pour l'apprentissage commun consenti ; à trancher |
| J-IA-11 | FR-30, FR-80, FR-172 | **Résidence et souveraineté des données** par pays (zone monétaire, textes ouest-africains non lus) | aucun envoi hors du pays sans inscription ; pack déclare ses exigences de résidence |
