# Contrôle ciblé du PRD « Connecteurs »

*Objet : vérifier six axes seulement (fidélité au journal, exigences du moteur réécrit, vocabulaire, contrat de module à 13 clauses, spine de la coque, concordance avec le PRD Reprise) et signaler les écarts ; ce n'est pas une revue complète. Contrôle du 2026-11-10 ; PRD : `prd.md` (358 lignes) ; journal : `.memlog.md` (16 lignes). Verdicts : tenu / partiel / absent / écart.*

**Bilan** : axe 1 : 8 tenus, 4 partiels, 1 écart · axe 2 : 1 tenu, 5 partiels, 17 absents · axe 3 : 4 tenus, 2 partiels, 1 absent, 6 écarts · axe 4 : 3 tenus, 10 partiels, 2 absents, 1 écart · axe 5 : 3 partiels, 5 absents, 1 écart · axe 6 : 1 tenu, 1 partiel, 4 absents, 6 écarts · 3 contradictions critical, 7 high, 8 medium, 3 low · 9 questions pour le PO.

---

## Axe 1 — Fidélité au journal

| Point | Verdict | Preuve | Ce qui manque |
|---|---|---|---|
| Un propriétaire par domaine, fixé par Rachid dans la console (journal l.7) | tenu | FR-2, prd l.127-129 | — |
| Assureur : répartition après avoir vu le logiciel, hors février (l.8) | tenu | FR-16, prd l.285-286 | — |
| IMF : le logiciel a raison sur l'argent ; Prospera sur le terrain ; remboursement « en attente de confirmation » (l.9) | tenu | FR-15, prd l.277-281 | — |
| Mode d'Odoo selon l'offre ; construction « comme si permanent » (l.10) | partiel | FR-3, prd l.138-144 | Le PRD ajoute « avec la comptabilité SYSCOHADA » au pack Finance & Recouvrement (l.138-139) ; le journal dit seulement « Finance & Recouvrement ⇒ temporaire ». Décision ou ajout ? |
| Trois garde-fous (mouvements, jamais d'argent en silence, contrôle nocturne) (l.10) | tenu | Vision l.40-42 ; FR-4, FR-8, FR-9 | — |
| Trois niveaux de fraîcheur (l.10) | tenu | FR-5, prd l.157-161 | — |
| Comportement en panne : mentions, file d'envoi, refus, alerte MV puis admin à 30 min, jamais de blocage (l.10) | tenu | FR-10 à FR-13, prd l.205-240 | — |
| Ordre de livraison Odoo ; file des écarts + écran de santé avec l'étape 3 (l.10, l.16) | partiel | FR-17 : 3 étapes, prd l.292-298 | SM-5 dit encore « étapes 1 à 4 » (prd l.323) alors que le récit à 4 étapes a été ramené à 3 (journal l.16) |
| QK-1 toutes versions d'Odoo ; faits vérifiés (l.13) | tenu | FR-14, prd l.259-273 ; QK-1 l.355 | — |
| Seuils : orange au délai cible, rouge à 3×, 6 h fixe pour la nuit, message d'action dès l'orange (l.15-16) | partiel | FR-11, prd l.217-221 ; QK-3 l.357 | Pour la nuit, le PRD ne définit aucun orange (« rouge si pas arrivé à 6 h », l.219) : « message d'action dès l'orange » n'a donc pas de déclencheur nocturne |
| Alerte admin si données de nuit absentes à 6 h (l.16) | tenu | FR-13, prd l.236-238 | — |
| « Requis en février pour l'Odoo du distributeur » (l.5) ; QA-3 du moteur | partiel | FR-17 est titré « Février » (l.288) | §0 et frontmatter ne disent pas que le PRD est dû pour février ni quel client le porte ; aucune échéance pour l'IMF (FR-15) |
| Le PRD affirme que « décisions et raisons sont dans `.memlog.md` » (l.17) | écart | — | Ajouts absents du journal : contrôle de concordance avant changement de propriétaire (l.133), refus d'un prix sans date d'effet (l.166), version Odoo jamais testée « signalée sans être refusée » (l.272-273), indicateurs 48 h / 24 h (l.326-327), état du connecteur sur site (l.239-240). À consigner au journal ou à marquer `[ASSUMPTION]` |

## Axe 2 — Ce que le moteur réécrit exige des Connecteurs

Source : moteur §8.4, ligne « PRD Connecteurs » (l.1578), FR-9, FR-43, FR-6, FR-33, FR-38, FR-42, addendum §A-7. Le PRD Connecteurs ne contient **aucune occurrence** de « essai », « bac à sable », « liste blanche », « lecture seule » (au sens FR-43), « C12 », « C13 », « dossier d'installation ».

| Point | Verdict | Preuve | Ce qui manque |
|---|---|---|---|
| FR-9 liste blanche : une sortie (écriture vers un tiers comprise) ne part que vers une destination déclarée pour l'essai | absent | — | Règle de garde propre au connecteur : en essai, toute écriture vers le logiciel du client est interceptée sauf vers un bac à sable vérifié ; journal consultable des écritures interceptées |
| FR-9 bac à sable vérifié (addendum §A-7 : confirmation écrite du client + base distincte constatée par le connecteur : adresse et identifiant de base différents du réel) | absent | — | Contrôle de vérification, qui l'exécute (le connecteur), où il est tracé |
| FR-9 identifiants en lecture seule propres à l'essai ; écriture de test tentée à la déclaration et qui doit être refusée, sinon identifiants rejetés (§A-7) | absent | FR-1 l.121 : identifiants chiffrés sur l'instance, rien de plus | Deux jeux d'identifiants distincts essai/réel ; test d'écriture refusée ; lecture du vrai logiciel permise pendant l'essai |
| FR-9 ligne « aller-retour non vérifié » (FR-6 moteur : écriture interceptée ⇒ 🟠, vérifiée dans le réel à la mise en service) | absent | — | La vérification « synchronisation aller-retour » que FR-6 moteur dit « fournie par Connecteurs » n'existe pas dans ce PRD : ni route, ni critère chiffré, ni clef d'idempotence |
| FR-9 `ECRITURE_REELLE_DEPUIS_ESSAI` (refus serveur nommé, jamais l'écriture réelle) | absent | — | Code de refus, test côté serveur « quel que soit l'écran », et garantie que l'essai n'a jamais d'identifiant d'écriture du réel |
| FR-9 cascade : (1) bac à sable (défaut), (2) interception, (3) interception forcée au choix du client, (4) réel jamais | absent | — | Les 4 niveaux et leur ordre |
| FR-10 moteur : le rafraîchissement n'écrit pas de données personnelles réelles dans le bac à sable sans accord écrit (champs masqués avant) | absent | — | Règle de masquage avant écriture dans le bac à sable |
| Comportement en `LECTURE_SEULE` (FR-43) : écritures refusées `ABONNEMENT_EXPIRE`, synchronisation **sortante** fermée, **entrante** continue en disant sa fraîcheur | absent | — | Sort de la file d'envoi (figée ou refusée ?), de « Corriger et renvoyer », de la décision d'un écart (une correction part vers le propriétaire = écriture) ; entrante qui continue avec mention de fraîcheur ; routes autorisées en lecture seule (export, consultation) |
| Autres états publiés : `SUSPENDU`, `ESSAI_TERMINE`, `DESINSTALLE`, `EN_INSTALLATION` : que devient la synchro ? | partiel | C9, prd l.342 : « Désinstaller coupe les échanges sans rien supprimer » | Seul `DESINSTALLE` est évoqué. Rien pour `SUSPENDU` (module fermé, export seul), `ESSAI_TERMINE`, `EN_INSTALLATION` (vérifications sous identité de service) ; contenu de la file d'envoi à la réinstallation (mouvements périmés ?) |
| C12 au tableau | absent | §7 : 11 lignes | Voir axe 4 |
| C13 au tableau | absent | §7 : 11 lignes | Voir axe 4 |
| Validation avec le moteur le 13/11 | partiel | frontmatter l.3 « validation PO le 13/11 » | Aucune entrée en §8 ; pas de liste des exigences reprises du moteur à faire valider |
| Prérequis déclarés au manifeste, « connecteur joignable » | partiel | C1 l.334 : « accès au logiciel du client, vérifié à l'installation » | « Joignable » non défini (quel critère, quelle durée) ; version détectée, droits du compte, plan Custom d'Odoo Online non listés comme prérequis du manifeste (seul le plan Custom l'est, FR-14 l.270) |
| Plan Custom d'Odoo Online ; version détectée affichée au bilan d'installation | tenu | FR-14, prd l.261-262 et 270-271 | — |
| Vérifications avec critère chiffré, sous l'identité de service du moteur (FR-6, C13-2) | absent | — | Ex. « version détectée », « N objets lus », « écriture de test acceptée sur bac à sable », « aller-retour » ; critère, route, 🟢/🟠/🔴, idempotence (NFR-6 moteur) |
| Santé `DEGRADE` sans fermeture (FR-34, C13-3) | partiel | FR-10 l.205-208 ; C5 l.337 « publie l'état de santé » | Règle de passage `OK`→`DEGRADE` (fraîcheur rouge ? file d'envoi > N ? refus > 24 h ?) ; le module reste ouvert |
| Rejeu du dossier d'installation (FR-42) : chaque élément a un propriétaire qui l'importe | absent | — | Les réglages du connecteur (propriétaires, niveaux, correspondances) sont des éléments du dossier ; les identifiants du réel ne se rejouent jamais depuis l'essai ; aucune file ni écart de l'essai (donnée métier) ne passe dans le réel (NFR-3 moteur) |
| Effacement de l'essai prospect (FR-33, C13-7) et effacement par organisation | absent | — | Ce que le connecteur efface (identifiants, files d'envoi et d'écarts, copies) ; le journal reste en ajout seul (pseudonymisé) ; certificat |
| NFR-3 du moteur : seul flux essai → réel = le dossier | absent | — | Le PRD ne dit pas que les files et écarts de l'essai ne sont jamais copiés dans le réel |
| Lecture de l'état publié et garde (C2 amendé, C13-4) | absent | C2 l.335 : gate seule | Garde sur l'état publié poussé, jamais l'horloge du conteneur ; or FR-11 compare des délais à l'heure : source d'horloge non dite |
| Catalogue (FR-37/FR-12) : le connecteur est-il un module commercial, dans quel élément d'offre ? | absent | — | Sans ligne au catalogue il ne se vend pas (moteur FR-12) ; mode temporaire/permanent « découle de l'offre » (FR-3) sans dire quel élément d'offre contient Connecteurs |
| `GEL` / `VERSION_FIGEE` : la synchro continue-t-elle ? | absent | — | Moteur : le travail quotidien continue ; à écrire pour les échanges |
| Sur site : MV « alertée d'abord » et état du connecteur dans la santé (moteur FR-16, FR-26) | partiel | FR-13, prd l.233-234 et 239-240 | Le signal est hebdomadaire et de schéma fermé (niveau 0) : voir contradictions 8 et 9 |

## Axe 3 — Vocabulaire (moteur §3)

| Point | Verdict | Preuve | Ce qui manque |
|---|---|---|---|
| « Bascule » | écart | prd l.47, 82, 95, 135, 139 | Moteur §3 : « Le PRD Reprise dit "bascule" : c'est la mise en service ». Ici « le jour de la bascule » = jour où l'on **coupe les domaines** et où l'ancien logiciel s'arrête. Autre moment, même mot. Proposition : « jour de la coupure » (domaine par domaine) et « mise en service » pour l'ouverture |
| « Propriétaire » | écart | FR-2 l.127-129 ; moteur FR-42 / §A-7 | Moteur : « propriétaire » = le module qui importe un élément du dossier d'installation. Ici = le logiciel qui a raison pour un domaine. Définir en §3 « propriétaire d'un domaine » ou renommer (« maître du domaine ») |
| « Refus » | écart | §3 l.100-101 ; FR-7 | Moteur : refus = code nommé d'un serveur (`MODULE_NON_SOUSCRIT`…). Ici = mouvement rejeté par le logiciel du client. Écrire « refus du logiciel du client » partout |
| « Écart » | écart | §3 « file des écarts » l.101 ; FR-8, FR-9 | Trois sens : écart nommé du moteur (FR-4), écart de reprise (Reprise §3), écart de concordance ici. Mêmes mots pour trois files |
| « Export planifié » | écart (low) | §3 l.108 | Moteur FR-43 : « export » = route d'export des données de l'organisation (`instance:donnees:exporter`). Ici = fichier produit par le logiciel du client |
| « Mouvement » | écart (low) | §3 l.97 ; FR-14 l.252 « mouvements d'entrepôt » | Le module Stock a ses mouvements d'entrepôt ; Connecteurs emploie le mot pour tout changement unitaire. Préciser « mouvement d'échange » |
| « Installation » / « à l'installation » | partiel | UJ-8 l.80, FR-2 l.127, FR-14 l.270 | Moteur : installer = dans l'espace d'essai. Dire où les propriétaires se fixent (essai, puis rejeu au réel) |
| Termes du moteur attendus : bac à sable, liste blanche, espace d'essai, mise en service, état publié, lecture seule, dossier d'installation | absent | — | Aucun n'est employé ; ils doivent l'être dès que les règles de l'axe 2 entrent |
| « Offre », « pack », « module commercial », « plateforme complète » | tenu | FR-3 l.138-142 | — |
| « Console » (Money Vibes) vs `prospera-app` | tenu | FR-2, FR-13, C8 | — |
| « Connecteur » (lien permanent, deux sens) | tenu | §3 l.87 ; moteur §3 « Connecteurs » | — |
| « Adaptateur » | partiel | §3 l.90 vs Reprise §3 | Reprise : « sait lire » ; ici : « sait parler » (lire et écrire) |
| « Mode permanent / temporaire » | tenu | §3 l.94-95 | Pas de collision avec le moteur |

## Axe 4 — Contrat de module (13 clauses)

Le §7 compte **11 lignes** (C1 → C11) ; le frontmatter dit « C1 → C11 » (l.10) ; le contrat amendé (§6) et le moteur §8.4 en exigent 13.

| Point | Verdict | Preuve | Ce qui manque |
|---|---|---|---|
| Frontmatter | écart | l.10 « AD-P17, C1 → C11 » | Corriger en « C1 → C13 » |
| C1 manifeste | partiel | l.334 | Manque : vérifications (code, route, critère), `retourArriere`, `interrupteurs`, `routesLectureSeule`, droits nommés, `depends: [{code, raison}]` au nouveau format |
| C2 gate | partiel | l.335 | Amendement du 2026-11-10 absent : état publié poussé, `LECTURE_SEULE` + `ABONNEMENT_EXPIRE`, export toujours ouvert, identité de service du moteur, matrice des 9 états |
| C3 données possédées | partiel | l.336 | « livre aux modules par leur point d'import » : c'est le contrat de la Reprise (idempotent, lot) ; pour une synchro continue il faut un contrat de mouvements (nommé, versionné). Correspondances revendiquées aussi par la Reprise (contradiction 5) |
| C4 module absent | tenu | l.337 | — |
| C5 contrats nommés | partiel | l.337 « contrats nommés vers les modules ; publie santé et écarts » | Aucun contrat nommé ; manque la publication de la **fraîcheur par domaine**, dont les écrans d'autres modules ont besoin (axe 5) |
| C6 données par client | partiel | l.339 | « correspondances » déjà possédées par la Reprise (C3 Reprise) ; schéma de données identique pour toutes les organisations (amendement) non dit |
| C7 droits | partiel | l.340 | « configurer » est-il un droit de tenant (client) ou de plateforme (Rachid, FR-2) ? Droits non nommés `connecteurs:<objet>:<action>` |
| C8 écrans | partiel | l.341 | Les mentions de fraîcheur vivent dans les écrans **des autres modules** (via `<Fraicheur>`), pas dans le module d'écran Connecteurs ; manquent les écrans du refus (« Corriger et renvoyer ») et de la file d'envoi ; comportement en lecture seule (visible, écriture désactivée) |
| C9 désinstaller | partiel | l.342 | Sort de la file d'envoi et des écarts à la réinstallation ; l'autre logiciel cesse de recevoir en silence : avertissement à écrire |
| C10 profil compose | tenu | l.343 | — |
| C11 IA | partiel | l.344 « sans IA propre ; achemine la nuit l'historique dont l'IA a besoin » | Contradictoire : sans IA mais livre l'historique ; la Reprise l'achemine via le module cible (Reprise FR-20). Nommer le contrat, le propriétaire du flux et le consentement (rien ne sort de l'instance, C11) |
| **C12** migrations 7 jours ; `retourArriere` | absent | — | Voir ci-dessous |
| **C13** installable sous contrôle | absent | — | Voir ci-dessous |
| Service « à trancher dans la spine » vs contrat §4 | partiel | frontmatter l.8 ; contrat §4 : « un agrégat distinct, c'est un service distinct » | Connecteurs possède ses propres agrégats (configuration, files, journal) ⇒ service distinct de la Reprise et des modules cibles. Mais adaptateurs et identifiants partagés avec la Reprise (contradiction 6) : la spine doit trancher aussi le lieu des adaptateurs. Aucun propriétaire ni date pour cette décision |
| Note pour la doctrine (autorité métier extérieure) | tenu | l.346-349 | Sans propriétaire ni date (hygiène) |

**C12 — ce qu'il faut écrire.** `retourArriere: SANS_PERTE` pour les données Prospera du connecteur (files, écarts, configuration : migrations additives, lecteur tolérant, topics `@2`). Mais **un connecteur qui a ÉCRIT chez le client n'est pas réversible** : un retour arrière SANS_PERTE ne défait ni une facture envoyée à Odoo ni un remboursement transmis au logiciel de l'IMF. À déclarer : (a) l'état « envoyé / confirmé » de chaque mouvement est une donnée relue par la version précédente ; (b) un retour arrière n'annule pas les écritures externes : correction par mouvements inverses, proposés, jamais automatiques (NFR-3) ; (c) une restauration `AVEC_PERTE` sur site efface le souvenir des mouvements déjà envoyés : renvoi possible, l'idempotence FR-4 ne protège que si le logiciel du client déduplique sur l'identifiant du mouvement (à vérifier par adaptateur) ; (d) interrupteurs candidats : choix JSON-2 « dès qu'elle existe » (FR-14), tout changement de comportement des adaptateurs ; un interrupteur ne change jamais la forme des données.

**C13 — ce qu'il faut écrire.** (1) prérequis : accès au logiciel, joignable, version détectée, droits du compte, plan Custom ; (2) vérifications chiffrées dont l'aller-retour (🟠 « non vérifié » en essai) ; (3) santé OK/DEGRADE avec règle ; (4) lecture de l'état publié ; (5) routes en lecture seule : export, consultation des écarts et des refus ; (6) interception en essai + `ECRITURE_REELLE_DEPUIS_ESSAI` ; (7) export CSV/JSON, import de la part du dossier d'installation (réglages), effacement par organisation ; (8) clef d'idempotence par vérification ; (9) un prérequis en échec marque le connecteur rouge et ses dépendants orange sans bloquer le reste.

## Axe 5 — Spine de la coque (`prospera-app`)

| Point | Verdict | Preuve | Ce qui manque |
|---|---|---|---|
| Où vivent les écrans (FR-36) | partiel | C8 prd l.341 ; spine scope l.7 : la console Money Vibes est hors champ | Configuration, santé et vue par client (FR-13) sont dans la console MV : conforme à FR-36 mais hors spine, donc sans propriétaire de livraison. Écrans client attendus sous `src/modules/connecteurs/` : file des écarts (oui), refus et file d'envoi (non cités) |
| FR-11 mentions de fraîcheur vs `<Fraicheur depuis>` (spine AD-7 l.133) | absent | Spine : « affiche leur fraîcheur avec `<Fraicheur depuis>`, la date vient de l'API du module » | Le composant ne reçoit qu'une date : ni niveau, ni orange/rouge, ni message d'action, ni « immédiat impossible sans API ». À ajouter : champs de l'API des modules `{ miseAJourLe, niveau: IMMEDIAT\|HEURE\|NUIT, source: API\|EXPORT_PLANIFIE }`, seuils dans une table unique de la coque (pas dans chaque module), « maintenant » = `heureDeReference` + temps écoulé (AD-5), clé de libellé d'action par domaine, texte en plus de la couleur |
| FR-12 bandeau de la file d'envoi vs AD-7 « un module n'en rend jamais » | écart | prd l.227-229 ; spine l.118-131 (10 bandeaux, aucun pour la file) | Ajouter une ligne à AD-7 (ou un emplacement `bandeauModule` rendu par la coque avec compteur fourni par l'API du module) ; préciser destinataire et droit (moteur FR-35 : chaque bandeau a un droit) : qui voit « 23 commandes en attente » |
| FR-13 qui est prévenu | partiel | Spine : bandeau « Santé dégradée » pour administrateurs (l.128) | Ne couvre que le bandeau. Le PRD doit dire que la panne durable met le module `connecteurs` en `DEGRADE` (alors le bandeau admin sort sans rien d'autre) ; le message WhatsApp/e-mail relève du service de notification, pas de la coque |
| Santé lue par l'utilisateur terrain (Kodjo) | partiel | Moteur FR-34 : santé rendue aux administrateurs seulement | Kodjo n'est pas administrateur : sa mention doit venir de la fraîcheur de la donnée (API du module), jamais de `sante` |
| Lecture seule : actions des écrans Connecteurs | absent | Spine AD-7 `<Ecriture>` | « Trancher », « Corriger et renvoyer », « Renvoyer » doivent être enveloppés dans `<Ecriture>` ; la consultation reste ouverte |
| Export / états déclarés (`actionsHorsGarde`) | absent | Spine AD-3 l.77, AD-7 l.117 | Le PRD ne déclare aucune route d'export ni d'état pour Connecteurs |
| Entrée des événements du logiciel du client (webhook) vs AD-8 (une seule origine, `/api/<code>/v1/…`) | absent | Spine AD-8 | Si l'API de l'IMF pousse des événements, c'est un trafic entrant non prévu par la spine ni par « aucun port entrant » (moteur FR-16). Sinon, imposer l'interrogation sortante et le dire |
| Fuseau de « 6 h » et heure de référence | absent | Spine l.393 : fuseau de l'organisation absent de la lecture | FR-5/FR-11/FR-13 fondent des échéances à 6 h ; fuseau et horloge à fixer |

**À ajouter à la spine** : (1) champs de fraîcheur normalisés et table de seuils côté coque ; (2) une ligne de bandeau « mouvements en attente » (ou un emplacement générique) ; (3) une règle : les modules qui affichent une donnée synchronisée reçoivent la fraîcheur par domaine via un contrat de Connecteurs (C5). **Besoin non couvert** : consulter la santé d'un connecteur sans être administrateur n'a pas de voie ; la vue par client de la console MV n'a pas de spine.

## Axe 6 — Concordance avec le PRD Reprise

| Point | Verdict | Preuve | Ce qui manque |
|---|---|---|---|
| Partage des adaptateurs | écart | Connecteurs FR-1 l.119-120 (« partagés ») ; Reprise FR-1 l.132 (« Odoo et API » seulement) | Le fichier/export planifié est un adaptateur de Connecteurs (FR-1 l.117-118) mais pas déclaré partagé par la Reprise ; définitions différentes (lire / lire et écrire) ; lieu du code partagé non tranché |
| Qui possède la connexion et les identifiants | absent | Connecteurs C3 l.336 ; Reprise C3 l.347 (pas de connexion) | La Reprise lit Odoo sans posséder de configuration de connexion ; Connecteurs la possède mais est « hors offre » possible (moteur C4) et `depends: []` des deux côtés |
| Frontière « une fois » / « permanent » | absent | Reprise FR-1 l.128-129 (« ensuite, Connecteurs maintient ») | Connecteurs ne dit pas quand la synchro démarre (après feu vert ? après réception définitive ?), ni le **point de départ** (curseur, mouvements antérieurs au lot non rejoués) ; pas de doublon entre lot repris et premiers mouvements |
| Marche en parallèle (Reprise FR-17) vs contrôle de concordance (FR-9) | tenu | prd l.200-201 | — |
| Marche en parallèle : deux files d'écarts | écart | Reprise FR-17 l.269-270 (rapport d'écarts) ; Connecteurs FR-8 | Pendant le parallèle, laquelle fait foi ? Le feu vert de la Reprise (écart à zéro) et la file des écarts ne sont pas reliés |
| Bascule temporaire (FR-3) | écart | Connecteurs l.82-83, 139-140 ; Reprise FR-17 l.264-270 ; moteur UJ-2 | Reprise et moteur : parallèle d'abord, puis écart nul, puis mise en service. Connecteurs : coupure « le jour de la bascule », Odoo s'arrête « après » le parallèle. Ordre inversé |
| Propriétaire de chaque domaine (FR-2) vs périmètres Reprise (FR-9) | écart | Connecteurs FR-14 l.247-253, FR-15 | Sans propriétaire : créances ouvertes, commerciaux, fournisseurs (distributeur) ; clients/KYC, garanties, rattachement agence (IMF). Les factures (FR-17 étape 3) font des créances un domaine ambigu |
| Stock d'ouverture | écart | Reprise FR-10 (comptage physique le jour J) ; Connecteurs FR-14 l.252, FR-17 étape 2 « stock en lecture » | Si Odoo est propriétaire du stock, où se saisit le comptage et comment il rejoint Odoo ? |
| Tables de correspondance | écart | Connecteurs FR-14 l.268-269 et C6 l.339 ; Reprise FR-4, C3 l.347 | Deux propriétaires (C3) ; la Reprise les « enregistre avec le lot » mais Connecteurs en a besoin en continu et sans Reprise dans l'offre |
| Qui lit le bac à sable pendant l'essai | absent | Moteur UJ-4 étape 3 ; Reprise : rien | Ni l'un ni l'autre PRD ne dit si la Reprise lit le bac à sable ou le vrai logiciel (identifiants en lecture seule) |
| Effacement (prospect, FR-33) | absent | Reprise FR-3 ; moteur C13 | Fichiers et tables côté Reprise, identifiants et files côté Connecteurs : à répartir ; identifiants de la Reprise (API) à retirer à la réception définitive ? |
| IMF : amorçage puis maintien | partiel | Reprise FR-1 ; Connecteurs FR-15 | Pas de séquence amorçage (export/API) → synchro ; pas d'échéance IMF |

## Contradictions

| # | Emplacement | Contradiction | Correction en une ligne | Gravité |
|---|---|---|---|---|
| 1 | prd §7 (l.330-344) et frontmatter l.10 | 11 clauses au lieu de 13 ; C12 et C13 absentes alors que le moteur §8.4 les exige | Ajouter les lignes C12 (retourArriere, interrupteurs, connecteur ayant écrit = non réversible) et C13 (neuf obligations) ; frontmatter « C1 → C13 » | critical |
| 2 | prd entier ; moteur FR-9, §8.4 l.1578 | Aucune des règles de l'essai : liste blanche, bac à sable vérifié, identifiants en lecture seule propres à l'essai, « aller-retour non vérifié », `ECRITURE_REELLE_DEPUIS_ESSAI`, cascade | Ajouter une FR « Le connecteur en essai » reprenant FR-9, §A-7 et la vérification aller-retour de FR-6 moteur | critical |
| 3 | prd FR-6 à FR-13, C9 ; moteur FR-43, §3.1 | Comportement par état publié absent : en `LECTURE_SEULE` la sortante est fermée et l'entrante continue avec sa fraîcheur ; `SUSPENDU`, `ESSAI_TERMINE`, `DESINSTALLE`, `EN_INSTALLATION` non traités | Ajouter une FR avec un attendu par état et par sens (entrante, sortante, file d'envoi, décision d'écart, export) | critical |
| 4 | prd SM-5 l.323 vs FR-17 l.290-299 et journal l.16 | « étapes 1 à 4 » alors que FR-17 n'en a plus que 3 (la file des écarts a rejoint l'étape 3) | SM-5 : « étapes 1 à 3 » | high |
| 5 | prd C6 l.339, FR-14 l.268 vs Reprise C3 l.347, FR-4 | Les tables de correspondance ont deux propriétaires | Trancher : la Reprise les crée par lot, Connecteurs en reçoit une copie au démarrage de la synchro et la possède ensuite ; l'écrire dans les deux C3 | high |
| 6 | prd FR-1 l.119-121, C3 l.336 vs Reprise FR-1 l.132, C3 l.347 | Adaptateurs « partagés » mais la Reprise ne partage qu'Odoo et API, les identifiants n'appartiennent qu'à Connecteurs, qui peut être hors offre | Adaptateurs en paquet partagé ; chaque module garde ses propres identifiants ; la spine fixe le lieu | high |
| 7 | prd l.47, 82-83, 95, 135-140 vs moteur §3 et Reprise FR-17 | « Bascule » pour la coupure, après le parallèle, alors que moteur et Reprise font suivre la bascule (= mise en service) du parallèle | Remplacer par « coupure du domaine » et remettre l'ordre : parallèle → écart nul → mise en service → coupure → arrêt de l'ancien logiciel | high |
| 8 | prd FR-12 l.227-229, C8 l.341 vs spine AD-7 l.118-133 | Le bandeau et les mentions de fraîcheur sont attribués au module ; la spine les réserve à la coque, sans ligne pour la file d'envoi ni seuils de fraîcheur | Dire que le module fournit données, niveau et compteur ; ajouter les lignes à AD-7 | high |
| 9 | prd FR-13 l.233-240, NFR-5 l.310 vs moteur FR-16, FR-26 | Sur site, la console MV montrerait refus et écarts (contenu métier : « facture n° 4521 », 45 000 F) et « alerterait souvent avant le client », alors que le signal est hebdomadaire et sans donnée métier | Sur site, MV ne reçoit que des compteurs et l'état (niveau 0) ; préciser le délai réel d'alerte (porteur : le contrôle quotidien) | high |
| 10 | prd FR-4, FR-6, NFR-1 vs moteur C12 | Un connecteur qui a écrit chez le client n'est pas réversible ; une restauration `AVEC_PERTE` rend le renvoi possible | C12 : état d'envoi relu par la version précédente, compensation par mouvements inverses, déduplication par adaptateur | high |
| 11 | prd FR-4 l.150-152 vs FR-5 l.159, l.166 | « Jamais des totaux » et « les saisies s'additionnent », mais « stock disponible » (total) et « changements de prix » (état non additif) circulent | Exclure explicitement prix et attributs des mouvements (règle du dernier effet daté) ; lire le stock disponible comme calcul du propriétaire | medium |
| 12 | prd FR-14 vs Reprise FR-9, FR-10 | Domaines sans propriétaire (créances, commerciaux, fournisseurs, KYC, garanties) ; comptage d'ouverture vs Odoo propriétaire du stock | Compléter les tables FR-14/FR-15 ; comptage saisi dans Prospera et envoyé comme mouvement d'ajustement | medium |
| 13 | prd FR-2 l.133, FR-3 vs Reprise FR-15, FR-17 | Un écart ouvert ne bloque ni le changement de propriétaire ni la coupure d'un domaine | « Aucun écart ouvert sur le domaine » comme condition (concordance avant et zéro écart) | medium |
| 14 | prd §3 l.97-108 vs moteur §3 | « Propriétaire », « refus », « écart », « export planifié », « mouvement » ont d'autres sens ailleurs | Définir « propriétaire d'un domaine », « refus du logiciel du client », « écart de concordance », « export du logiciel du client » | medium |
| 15 | prd FR-1, C6 vs moteur FR-42, NFR-3, FR-33 | Rejeu, effacement et isolement essai/réel du connecteur non écrits (réglages rejoués, identifiants jamais, files jamais copiées) | Ajouter la part du connecteur au dossier d'installation et à l'effacement | medium |
| 16 | prd FR-11 l.217-221, FR-13 | Nuit sans orange ; message d'action « dès l'orange » sans effet ; source d'horloge et fuseau de « 6 h » non dits (AD-5 : heure de référence) | Pour la nuit : message dès 6 h ; horloge = heure de référence, fuseau de l'organisation | medium |
| 17 | prd FR-5 l.159 (« 5 minutes avec API ») vs moteur FR-16 (aucun port entrant) | Dire si l'entrant est interrogé (sortant) ou poussé par le logiciel du client | Imposer l'interrogation sortante sur site ; webhook seulement sur la plateforme | medium |
| 18 | prd C11 l.344 vs Reprise FR-20 | « Sans IA propre » mais « achemine la nuit l'historique » ; la Reprise l'achemine déjà via les modules cibles | Nommer le contrat et le propriétaire du flux ; rien ne sort de l'instance sans consentement | medium |
| 19 | prd NFR-1 l.305 | Doublon de FR-4 (3ᵉ puce) | Garder NFR-1 et renvoyer FR-4 vers lui | low |
| 20 | Reprise frontmatter l.10-11, C8 l.352 | Voisin non à jour : « C1 → C11 », « PRD Connecteurs (à venir) », écrans en console alors que le moteur veut `prospera-app` dès février | À corriger dans le PRD Reprise (hors périmètre de ce contrôle) | low |
| 21 | UJ-4 et UJ-5 de la Reprise vs UJ-4 et UJ-5 du moteur | Identifiants de parcours en double entre PRD (les UJ-6 à UJ-8 de Connecteurs sont libres) | Préfixer les UJ par PRD ou garder la numérotation par document | low |

## Questions pour le PO le 13/11

1. **Connecteurs dans l'offre ?** Est-ce un module commercial vendu à part, inclus dans la plateforme complète, ou une ligne d'intégration ajoutée à tout contrat où le client garde son logiciel ? Sans réponse : pas de ligne au catalogue (moteur FR-12, FR-37) et mode temporaire/permanent indécidable. *Recommandation : module commercial unique, ajouté d'office quand le contrat déclare un logiciel du client, inclus dans la plateforme complète.*
2. **Adaptateurs et identifiants partagés avec la Reprise ?** *Recommandation : un paquet d'adaptateurs partagé ; chaque module (Reprise, Connecteurs) garde ses propres identifiants, rien n'est recopié de l'un à l'autre sans acte tracé ; la spine place le paquet.*
3. **Tables de correspondance : un seul propriétaire.** *Recommandation : la Reprise les crée ; Connecteurs en prend la copie au démarrage de la synchro et en est ensuite seul propriétaire.*
4. **Retour arrière d'un connecteur qui a écrit chez le client.** Accepte-t-on qu'il ne défait pas les écritures externes ? *Recommandation : oui ; `retourArriere: SANS_PERTE` pour les données Prospera, compensation par mouvements inverses proposés (jamais automatiques), file d'envoi suspendue pendant la fenêtre de 7 jours tant que le DSI n'a pas confirmé.*
5. **Comportement en `LECTURE_SEULE`, `SUSPENDU`, `ESSAI_TERMINE`.** *Recommandation : lecture seule = sortante fermée (nouveaux mouvements refusés `ABONNEMENT_EXPIRE`, file existante figée et reprise au paiement), entrante continue avec fraîcheur, écarts consultables mais non tranchables ; `SUSPENDU` et `ESSAI_TERMINE` = tout fermé sauf export.*
6. **Un écart ouvert bloque-t-il la coupure d'un domaine ?** *Recommandation : oui pour tout domaine d'argent (zéro écart ouvert, concordance juste avant).*
7. **Alerte sur site.** Le signal hebdomadaire ne permet pas « MV d'abord » en 30 minutes. *Recommandation : porter l'état du connecteur (niveau 0, compteurs seulement) par le contrôle quotidien et le dire ; l'alerte à l'administrateur du client reste locale à l'instance, sans contenu métier côté MV.*
8. **Stock d'ouverture quand Odoo est propriétaire du stock.** *Recommandation : comptage saisi dans l'écran Stock de Prospera et transmis à Odoo comme mouvement d'ajustement « en attente de confirmation ».*
9. **Un prospect peut-il brancher un connecteur dans son essai ?** *Recommandation : lecture seule du vrai logiciel avec identifiants dédiés (test d'écriture refusée), écritures toujours interceptées, pas de bac à sable sans Money Vibes.*

## Hygiène

- **`[ASSUMPTION]` non indexées** : une seule dans le texte (SM-3 « ≥ 95 % », l.321), sans index §8 ; non marquées : 30 minutes (l.235), 5 min, 48 h, 24 h (l.326-327), 3 × le délai ; hypothèses du journal l.10-11 validées par QK-2 mais sans trace dans le PRD.
- **Questions ouvertes sans propriétaire ni date** : service « à trancher dans la spine » (l.8) ; règle de doctrine « la spine devra l'écrire » (l.349) ; assureur « après examen du logiciel » (l.285-286) ; date du premier client IMF ; entrée du connecteur au catalogue. §8 dit « tout tranché » alors que ces points sont ouverts.
- **FR non testables** : FR-11 « mention discrète » ; FR-13 « souvent avant que le client ne remarque » ; FR-16 « s'appliquera » ; FR-1 « sans être réécrite » ; FR-10 « aucun écran » (à lier à un test de panne simulée).
- **Identifiants** : pas de doublon interne (FR-1 → FR-17, NFR-1 → 6, SM-1 → 5, QK-1 → 3) ; renvois croisés correctement préfixés « PRD moteur / PRD Reprise » ; doublon de contenu NFR-1/FR-4 ; doublons d'UJ entre PRD voisins (contradiction 21). Prénoms des parcours sans la mention « provisoires » que porte le moteur.
- **Journal** : consigner les ajouts listés à l'axe 1, dernière ligne.
