---
title: Réconciliation du PRD Distributeur avec ses sources du PO
date: 2026-11-12
sources: brain-dump-po-2026-11-12.md ; .memlog.md
cible: prd.md (non modifié)
---

# Réconciliation `prd.md` ↔ brain dump du PO ↔ memlog

Statuts : **COUVERT**, **PARTIEL** (couvert mais incomplet ou ambigu), **MANQUE**, **CONTREDIT** (une phrase du PRD dit encore le contraire). Les n° de ligne renvoient à `prd.md`. Les textes de la colonne « Correction » sont prêts à insérer.

## A. Phrases du PRD qui contredisent encore une décision récente (priorité)

| # | Ligne(s) | Phrase actuelle | Décision violée | Correction proposée |
|---|---|---|---|---|
| C1 | 142 | « Bouton « bientôt » : … avec la date prévue de sa mise en service. » | Boutons « bientôt » SANS date (FR-2 l. 166, l. 171, §12 n° 14) | « **Bouton « bientôt »** : un bouton visible mais inactif, sans date, qui dit seulement ce qu'il fera. » |
| C2 | 1470 | « WhatsApp via `notification` (bientôt, février 2027) » | idem | Remplacer « (bientôt, février 2027) » par « (bientôt) ». |
| C3 | 2350 | « [ASSUMPTION: date proposée : mars 2027, à confirmer.] » (export Sage) | idem + export Sage « après », sans date | Supprimer l'ASSUMPTION ; ligne §13 correspondante aussi. |
| C4 | 359 | « Les cinq autres sont écrits en entier, mais leur livraison suit les deux premiers. » | Aucun ordre de livraison figé (§10.1 l. 3426, §12 n° 14) | « Les cinq autres sont écrits en entier ; aucun ordre de livraison n'est figé (on avance selon l'évolution). » |
| C5 | 431, 537 (table « Règles reprises de la démo »), 3485 | « créance échue depuis 45 jours ou plus … `CREANCE_ECHUE_BLOQUANTE` » ; « Blocage crédit : retard ≥ 45 j » | Blocage crédit à plus de 60 j ou au-delà du plafond (FR-114 l. 1999, FR-119 l. 2059, §12 n° 12) | FR-33 : « **Créance échue.** Si le client a une créance de plus de 60 jours de retard (paramètre), ou un encours au-dessus du plafond, le crédit est bloqué (FR-119) et la validation est refusée : `CREDIT_BLOQUE`. » Table l. 537 : « Blocage crédit : retard > 60 j OU encours > plafond ; 60 j : oui ; la démo disait 45 j, non reprise ». |
| C6 | 562 (note FR-33/42) | « **Décision à trancher.** Facturer à la validation ou à la livraison ? » | Facture à la livraison : tranchée par le PO | « **Tranchée (PO, 2026-11-12).** La facture naît à la livraison, sur les quantités servies (FR-42) ; une option par organisation permet de facturer dès `VALIDEE`. » |
| C7 | 618 (FR-43, fin) | « **Décision à trancher.** La suite repart-elle à 1 chaque année, ou est-elle continue … [ASSUMPTION: continue …] » | Série unique par organisation, continue d'année en année, qui reprend Sage (tranchée l. 842 et §12 n° 10) | « **Tranchée (PO, 2026-11-12).** Une seule série par organisation, continue d'année en année ; l'année peut figurer dans le format sans remettre le compteur à zéro. » Supprimer la ligne §13 3498. |
| C8 | 395 (objet Ligne de commande) et 404 (FR-31) | `origine_du_prix` accepte `GRILLE_FREELANCE` ; « Un commercial freelance utilise la grille du freelance (FR-93) » | La société ne voit que le prix société (FR-94, FR-96) ; la commande du freelance à la société est au prix société | `origine_du_prix` (`GRILLE_SOCIETE | PRIX_NEGOCIE_CLIENT`). FR-31 : « Un freelance commande à la société au prix société ; son propre prix de vente n'apparaît que sur sa facture à son détaillant (FR-96), jamais sur une commande vue de la société. » |
| C9 | 2226 (FR-126) | « La rémunération d'un freelance est sa marge nette (écart entre son prix de vente et le prix société) » | La marge de négociation est au freelance et invisible de la société ; la société lui verse une commission calculée sur le prix société (FR-98) | « La rémunération que la société voit d'un freelance est sa **commission**, calculée sur le prix société (FR-98). Sa marge de négociation lui est propre et n'est visible que de lui. » |
| C10 | 1533 (FR-98, intro) et §13 3539-3541 | « … et, si le distributeur le décide, sa commission » ; notes « Une commission est-elle versée ? [ASSUMPTION: non] » | Commission due, calculée sur le prix société (FR-98 corps, §12 n° 11) | Intro : « … et la commission que la société lui verse, calculée sur le prix société. » Supprimer ou marquer tranchées les trois lignes `Question ouverte` de la note l. 1663-1668 et §13. |
| C11 | Notes de 5.7 (« Question ouverte (bloquante pour FR-96 et FR-98). Qui facture le détaillant final ? ») | Question encore ouverte | Tranchée : le freelance facture le détaillant | « **Tranchée (PO, 2026-11-12).** Le freelance facture son détaillant dans Prospera ; la société ne voit que le prix société. » |
| C12 | 2248 (FR-128) | « La commission porte sur l'encaissé, pas sur le facturé » | Pour le freelance, la base est le prix société de ce qu'il a vendu, et il doit ce prix même si son détaillant ne paie pas | Ajouter : « Exception : pour un freelance, la base est le prix société de ses ventes facturées (FR-98), qu'elles soient encaissées ou non par lui. » |
| C13 | 1955 (« Choix d'unification … à arbitrer par le PO », point 1), 3559, 3555 | Créance portée par `paiement` encore en ASSUMPTION ; blocage à 60 j en ASSUMPTION | Décisions PO 2026-11-12 (§12 n° 8 et 12) | Remplacer « (en `[ASSUMPTION]`, à arbitrer par le PO) » par « (décidés par le PO le 2026-11-12) » ; retirer les ASSUMPTION l. 2004 et §13 3555, 3559. |
| C14 | 3644 (A.2, C3 `facturation`) | « Données possédées : … créances ouvertes (reste dû par facture) » | La Créance est portée par `paiement` | « … le reste dû d'une facture est lu dans la Créance tenue par `paiement` (`paiement.creance@1`) ; `facturation` n'écrit que la facture et sa suite de numérotation. » |
| C15 | 1189 (note entrepôt) vs 3241-3243 (FR-202) | l. 1189 : navette et plans de liquidation « appartiennent au PRD `stock` » ; FR-202 : liquidation → `marketing` et `dashboard`, `stock` n'a ni onglet ni écran de liquidation | Contradiction interne ; et « Lancer la navette » / « Lancer le scénario » n'ont plus aucun propriétaire | Voir ligne 6 du tableau B (proposition d'une exigence). Aligner l. 1189 sur FR-202. |
| C16 | 3082 (6.9 `support-client`, M03) | « Ce module est hors de ce PRD, à cadrer au lot 4 » | Memlog : la partie 3 écrit M03 (liste « M12, M19, M21, M22, M23, M25, M26, M28, M03 ») | À faire confirmer par le PO. Si M03 reste hors PRD, l'écrire dans le memlog ; sinon rédiger au moins un paragraphe « Console d'administration devenue CRM interne (MoneyVibes, pas le produit du distributeur) ». |
| C17 | 1391 (note conquête) | « La segmentation actifs, dormants et VIP … n'existe pas dans le code. Si le PO la veut… » | Le brain dump la veut ; 3145 la cite déjà comme couverte (FR-V26) | « **Voulue (PO).** Segments actifs / dormants / VIP : exigence du module `pdv` (FR-V26), voir 7.2. » |
| C18 | 917 (FR-62) vs 126, 465 | « le bon de commande se télécharge en PDF » (commande FOURNISSEUR) | « Bon de commande » = nom terrain du bon de livraison (l. 126, 465) | Renommer en « la commande fournisseur se télécharge en PDF » pour éviter l'homonymie. |
| C19 | 438-471 (FR-34 « La livraison transforme la réservation en sortie de stock ») vs 472 (« Le bon est le seul document qui déclenche la sortie de stock ») | Le camion sort sur le bon, mais la sortie de stock est dite à la livraison | « Le camion sort sur le bon émis à la validation » (§12 n° 9) | Préciser : « La sortie de stock est écrite quand le chargement est validé (`EXPEDIE`, FR-70) ; la livraison confirme les quantités servies et déclenche la facture. » |
| C20 | 67 (§2.1, `FREELANCE`) | « achète au prix société, revend à ses prix » | Acceptable, mais ne dit pas qu'il facture le détaillant | « achète au prix société, facture son détaillant à son prix (marge de négociation à lui, invisible de la société), doit le prix société à la société même si son détaillant ne paie pas » |
| C21 | 3921, 3927 (A.17) | `paiement` : « Objets de reprise : aucun ; Enrichi par : notification, facturation » ; problème 9 « paiement-service (arrêté → créance) » | Créance portée par `paiement` | Ajouter à la ligne `paiement` : « Porte `paiement.creance@1` (registre unique des Créances) ; domaine d'échange `paiement.creances` [À CONFIRMER] ». Reformuler le problème 9. |

## B. Brain dump : besoins, modules, défauts (« ce qui agace »), boutons

### B1. Cadre et consignes

| Élément du brain dump | Couverture dans le PRD | Statut | Correction proposée |
|---|---|---|---|
| Consigne : la démo définit ce qu'on veut, le PRD couvre tout | §0 l. 23 ; §10.1 l. 3426 ; 7 (règles de lecture l. 3098) | COUVERT | : |
| Moyens de paiement : PI-SPI ET FedaPay | Vocabulaire l. 129 ; FR-9 l. 242 ; FR-49 l. 686-687 ; FR-104, 115, 116 ; FR-205 (l. 3263) | COUVERT (aucune mention de PI-SPI seul hors l. 3280, 3921, 3927, qui traitent de FedaPay ou de `pi-spi` à déprécier) | : |
| Export Sage après ; démontrable avec vraies données de test et parcours concrets | FR-18 l. 338 ; FR-57 l. 788 ; FR-131 l. 2350 ; FR-218 l. 3362 ; §10.2 l. 3431 ; FR-9 à FR-12 | COUVERT (sauf date l. 2350, voir C3) | : |
| Distributeur ou grossiste, Togo et UEMOA ; terrain, commandes, stock, facturation, recouvrement, marketing, finance | §0, §1 | COUVERT | : |
| 14 rôles du DG au freelance | §2.1 l. 56-78, FR-4 (15 avec `DIST_ADMIN`) | COUVERT | : |
| 18 modules en 4 bundles | Absent comme tel : §12 n° 3 (l. 3452) ne cite que l'incohérence d'offre 10 / 18 ; le PRD parle de 20 modules en 4 familles | PARTIEL | Ajouter au §0 : « Le brain dump parle de 18 modules en 4 bundles et la démo présente 20 modules en 4 familles ; ce PRD suit les 20 de la démo, le découpage en bundles est une question d'offre (§12 n° 3). » |
| Client de février = Tampico, pré-contrat, quitte Sage, hébergé chez Money Vibes | l. 50, 84, NFR-9 l. 3399 ; **jamais nommé** (0 occurrence de « Tampico » dans `prd.md` ; l. 3101 le dit) | COUVERT | : |
| Taille inconnue (commerciaux, PDV, factures/mois, entrepôts), à obtenir au prochain rendez-vous | §12 n° 1 (l. 3450) | COUVERT | : |
| État de la démo : prototype, 23 écrans, ~47 600 lignes, rien d'enregistré, ni serveur ni base | §0 l. 23 ; FR-1 | COUVERT | : |
| « Le risque principal : sans serveur ni base rien ne marche ; chantier n° 1 avant février » | FR-1 l. 155-162 (en exigence), mais pas formulé comme risque ni comme chantier n° 1 | PARTIEL | Ajouter au §1 « Pourquoi maintenant » : « Le chantier n° 1 est le serveur et la base de données : sans eux, aucun des besoins du premier jour ne fonctionne (FR-1). » |
| Les deux moments qui comptent ex aequo (memlog) | §2.3 l. 88 ; UJ-1, UJ-2 ; SM-1 | COUVERT | : |
| « En résumé : l'analyse est riche, la partie qui sert à agir ne marche pas ; 36 boutons relevés par l'audit, aucun n'agit » | l. 23 (idée, sans le chiffre 36) ; SM-2 ; tableaux « Boutons de la démo » par module | PARTIEL | Ajouter à l. 23 : « Sur les 36 boutons relevés par l'audit de juillet 2026, aucun n'agit ni n'enregistre. L'analyse et les rapports sont riches et propres à chaque rôle ; ce PRD exige la partie qui sert à agir. » |
| Ton : le PRD doit rester centré sur l'action et la vérité des chiffres (« ce qui agace » = boutons morts et vues erronées) | FR-2, FR-7, FR-15 ; blocs « Dans la démo » (MORT / SIMULÉ) | COUVERT | : |
| Modules ★ de février : CRM PDV, Catalogue et prise de commande, Stock, Facturation, Encaissements, Relances et recouvrement | PRD ne marque ★ que `commande` et `facturation` (l. 359, 371, 569) ; `pdv`, `catalogue`, `stock`, `paiement` (partie 4) et `recouvrement` (6.2) ne sont pas ★ ; SM-7 « Valide les modules ★ » | **MANQUE / CONTREDIT** | Remplacer l. 359 par « Les modules ★ du client de février sont : `pdv`, `catalogue`, `commande` (prise de commande), `stock`, `facturation`, `paiement` (encaissements) et `recouvrement`. Dans cette partie, `commande` et `facturation` portent ★. » Ajouter ★ aux titres 6.2 et aux fiches 7.2, 7.3, 7.4, 7.5 ; adapter SM-7. |
| Documents du dépôt `prospera-font-end` (inventaire, roadmap, audit, spec V2, grille, résumé, personas, guide) | Cités ça et là (l. 200 personas / spec V2 « périmées », l. 3136 audit) ; pas de liste de références | PARTIEL | Ajouter une section « Sources » en fin de §0 listant les 8 documents. |
| Pas de maquettes séparées : la démo sert de maquette (localhost:3002, compte de démo du DG) | l. 23 et 3098 (la démo définit) ; pas « localhost:3002 » ni compte DG | PARTIEL | Ajouter au §0 : « Pas de maquettes séparées : la démo (localhost:3002, compte de démo du DG) sert de maquette. » |
| Pas encore disponibles : notes de rendez-vous, exports Sage (clients, articles, factures ouvertes, modèle de facture), messages WhatsApp | Questions ouvertes l. 844, 1190-1192, 3592 (format Sage à obtenir) ; pas de liste unique | PARTIEL | Ajouter au §12 : « 8. Pas encore reçus : notes de rendez-vous, exports Sage (clients, articles, factures ouvertes, modèle de facture), messages WhatsApp. » |
| Le prospect qui teste seul | UJ-8 l. 106 ; FR-12 ; SM-1 | COUVERT | : |

### B2. Besoins du premier jour

| Besoin | Couverture | Statut | Correction |
|---|---|---|---|
| Reprise : clients + conditions de paiement + plafonds | FR-188 (3165), FR-187, FR-216 (3328-3342) | COUVERT | : |
| Reprise : articles et tarifs, prix propres à chaque client | FR-193 (3195) ; FR-216 | COUVERT | : |
| Reprise : factures impayées, balance clients juste le jour 1 | FR-58 ; FR-50 ; FR-217 | COUVERT | : |
| Reprise : numérotation sans trou ni doublon | FR-43 ; FR-217 (3347-3349) | COUVERT (corriger C7) | : |
| Commande : saisie avec contrôle du stock puis validation | FR-30 à FR-35 | COUVERT | : |
| Produire le bon de livraison ; camion sort sur le bon émis à la validation, aussi appelé « bon de commande » | Vocabulaire 126 ; FR-36 (465) ; §12 n° 9 | COUVERT (voir C18, C19) | : |
| Commande → facture en un clic | FR-42 | COUVERT | : |
| Facture à la livraison | FR-42 (l. 596), §12 n° 9 | COUVERT (note l. 562 à corriger, C6) | : |
| Factures conformes : mentions légales, TVA 18 %, numérotation dans l'ordre | FR-43, FR-44, FR-45 | COUVERT | : |
| Impression et PDF | FR-46, FR-17 | COUVERT | : |
| Avoirs | FR-48 | COUVERT | : |
| Paiements, y compris partiels | FR-49 | COUVERT | : |
| Balance clients et balance âgée | FR-50, FR-51, FR-112 | COUVERT | : |
| Facture normalisée OTR non exigée en février | FR-57, §10.2 | COUVERT | : |
| Sage gardé : export factures + paiements différé | FR-18, FR-57 l. 788, FR-218, §10.2 ; question l. 843 | COUVERT | : |

### B3. Les 20 modules de la démo, leurs défauts et leurs boutons

| # | Module et ce qui agace | Couverture | Statut | Correction |
|---|---|---|---|---|
| 1 | CRM Points de vente ★ : fiche complète (GPS, photo, historique, score 0-100), parcours prospect → fidèle → à risque, segmentation actifs/dormants/VIP, carte de couverture. Agace : « Vue DG » au lieu de dernière visite, relances, objectif du mois | 7.2 : FR-184 (score), FR-185 (pipeline 7 états), FR-186 (« Vue DG », en plus FR-7 l. 212-218), FR-190 (création, GPS, photos), FR-191, FR-192 (carte) | COUVERT pour les défauts ; PARTIEL pour la segmentation (voir C17) et ★ manquant | Voir C17 et ligne ★ du tableau B1. |
| 2 | Commercial terrain et tournées : carte de l'équipe, plan de journée, missions, taux de conversion, optimisation d'itinéraire, clôture, remises d'espèces et écarts. Agace : « Y aller » et « Clôturer » ne font rien | 6.1 : FR-100 à FR-107 ; « missions » = motifs de visite (l. 1710 et FR-100) | COUVERT | Mentionner « missions » dans FR-100 (« plan de journée et missions »). |
| 3 | Mon activité et disponibilité : base de l'application mobile, hors connexion, compte-rendu vocal. Agace : « Ajouter au panier » ne fait rien ; ni mobile ni hors connexion | FR-108, FR-109, FR-32 ; vocal « bientôt » (l. 1886, 3434) | COUVERT | : |
| 4 | Catalogue et prise de commande ★ : prix, disponibilité, promotions, suivi brouillon → livrée, vérif. du stock, marge, prix société / freelance, commande WhatsApp. Agace : « Nouvelle commande terrain » ne fait rien | FR-37, FR-38, FR-39, FR-40 ; 7.3 FR-193 à FR-198 | COUVERT ; ★ à ajouter | : |
| 5 | Conquête et territoires : zones non couvertes, carnet de prospects, ouvertures (1 mois, 3 mois), passation. Agace : « Transférer » ne fait rien | 5.5 FR-76 à FR-83 | COUVERT | : |
| 6 | Stock ★ : par entrepôt, ruptures et surstocks, transferts proposés, plans de liquidation. Agace : « Lancer la navette » et « Lancer le scénario » ne font rien | 7.4 FR-199 à FR-204 ; l. 1189 ; FR-202 | **PARTIEL / CONTREDIT** (C15) : personne n'a l'exécution de la navette ni du scénario | Ajouter après FR-202 : « **FR-202b : Lancer la navette et lancer le scénario.** Les transferts proposés entre Lomé Port et Kara sont une proposition de `stock` (signal) ; « Lancer la navette » crée un transfert enregistré (ordre dans `stock`, mouvement physique dans `entrepot`, FR-68 à FR-70). « Lancer le scénario » ouvre un plan de liquidation du `dashboard` relié à une campagne `marketing` (FR-144). Aucun des deux boutons ne simule ; tant qu'ils ne sont pas branchés, ils affichent « bientôt ». » |
| 7 | Opérations entrepôt : préparation, chargement camions, réceptions et litiges, inventaire tournant, contrôle au quai. Agace : pré-rempli à 93 % ; inventaire validé ne corrige pas | 5.4 FR-68 à FR-75 ; FR-71 (jamais pré-remplies), FR-74 | COUVERT | : |
| 8 | Approvisionnement et fournisseurs : registre, réappro auto, note fournisseur, commandes SUGGEREE → RECUE, DAF alerté sous le plancher. Agace : valider simule ; « Basculer sur le fournisseur alternatif » | 5.3 FR-59 à FR-67 (FR-60 note, FR-64 plancher, FR-65 alternatif) | COUVERT | Corriger C18. |
| 9 | Facturation, proformas, e-facture ★ : factures et créances, proformas (probabilité), avoirs, plafonds, marge par facture, e-facture. Agace : Imprimer/PDF, Envoyer, Convertir, Relancer, Corriger et retransmettre | 5.2 FR-42 à FR-58 ; tableau des boutons l. 824-837 | COUVERT | : |
| 10 | Encaissements ★ : paiements reçus, liens PI-SPI et FedaPay, rapprochement auto facture ↔ paiement, remises d'espèces. Agace : aucun paiement réel | 7.5 FR-205 à FR-210 ; FR-49, FR-104, FR-105, FR-116 ; « Créance portée par `paiement` » : aucun FR de 7.5 ne le dit | **PARTIEL** | Ajouter en 7.5 : « **FR-220 : La Créance est un registre unique tenu par `paiement`.** Décision du PO (2026-11-12). Ouverte par sa source (`FACTURE`, `ECHEANCE_DE_PRET`, `PRIME`), soldée par les Encaissements, lue par `recouvrement`. Le PRD `paiement` est à amender (tiers, source, périmètre sur la créance projetée, FR-P13). **Conséquences :** (1) un encaissement de 200 000 sur une facture de 507 400 donne 307 400 sur la facture, dans le dossier et dans la balance, au même instant ; (2) `facturation` ne tient aucun solde propre ; (3) sans `paiement`, le reste dû affiche « non installé ». » (la plage 180-219 est pleine : prendre FR-220 ou FR-172.) |
| 11 | Relances et recouvrement ★ : dossiers, escalade WhatsApp → SMS → visite → direction, balance âgée, promesses, blocage du crédit. Agace : seulement fermer le dossier ; bloquer simule | 6.2 FR-111 à FR-121 ; FR-114 (échelle), FR-119 (blocage) | COUVERT ; ★ à ajouter ; contradiction C5 | : |
| 12 | Comptabilité : écritures SYSCOHADA, lettrage, TVA, factures d'achat, clôture. Agace : lettrage et achats simulent ; télédéclarer OTR | 6.4 FR-129 à FR-135 ; FR-133 télédéclaration « bientôt » | COUVERT | : |
| 13 | Pilotage financier (DAF) : trésorerie 7 jours, BFR, marge par canal, décisions de crédit, fournisseurs à payer. Agace : Payer / Accorder / Refuser simulent ; ordres de virement | FR-137 à FR-141 ; FR-209 | COUVERT | : |
| 14 | Contrôle de gestion : budgets, budget/réel/projection, résultat par axe, prévision 3 mois, rapports DG/DAF | 6.6 FR-150 à FR-156 | COUVERT | : |
| 15 | Tableau de bord et pilotage : cockpit par rôle, alertes, décisions, rapport IA. Agace : bandeau « alertes critiques », PDF, Envoyer, décisions ni validées ni reportées | 6.8 FR-165 à FR-171 ; FR-14 | COUVERT | : |
| 16 | Objectifs et quotas : zone, projection, mix produit et marge | FR-84, FR-85, FR-86 | COUVERT | : |
| 17 | Équipes et performance : indicateurs, classements, coaching, salariés / freelances. Agace : « Vue DG » pour RESP_VENTES et superviseur ; Valider / Refuser une remise | 6.3 FR-122 à FR-128 ; FR-7, FR-127 | COUVERT ; contradictions C9, C12 | : |
| 18 | Marketing et campagnes : ROI, combos stock. Agace : Lancer / Modifier / Ignorer ; suggestions sans validation. Seul circuit de bout en bout : les combos | 6.5 FR-142 à FR-149 ; FR-3 (circuit généralisé) ; FR-145 | COUVERT | : |
| 19 | Studio réseaux sociaux : calendrier, accroches IA, boîte unique. Agace : « Valider et programmer », « Envoyer » | 5.6 FR-87 à FR-92 | COUVERT | : |
| 20 | Automatisations : règles AUTO / à valider / suggérées, journal de la nuit. Agace : aucun Valider / Reporter ; activer perdu | 6.7 FR-157 à FR-164 | COUVERT | : |

## C. Décisions du memlog

| # | Décision du memlog | Où dans le PRD | Statut | Correction |
|---|---|---|---|---|
| 1 | Module `paiement` = paiements ET moyens de paiement ; PI-SPI = moyen, pas module ; toute facture ou commande s'encaisse par `paiement` | l. 129, 365, 686 ; FR-205 (l. 3264-3265) | COUVERT | : |
| 2 | Le front de démo définit les modules voulus ; PRD couvre tout (20 modules en 4 familles) | §0, §10.1 | COUVERT | : |
| 3 | Démontrable avec vraies données de test et parcours ; export Sage après | FR-9 à FR-12 ; FR-18 ; FR-218 | COUVERT | : |
| 4 | PI-SPI ET FedaPay (API_BUSINESS et fedapay) | FR-205 | COUVERT | : |
| 5 | Export Sage différé, tracé hors périmètre de la phase démontrable | FR-18, FR-57, FR-218, §10.2 | COUVERT (date l. 2350 : C3) | : |
| 6 | Un seul PRD pour tout le distributeur | §0 | COUVERT | : |
| 7 | Deux moments ex aequo | §2.3 l. 88 | COUVERT | : |
| 8 | Parties partagées réutilisables par la microfinance (noyau + tableau de vocabulaire) | §6 intro, tableaux « Vocabulaire par verticale » | COUVERT | : |
| 9 | Structure en 4 parties + annexe de 13 lignes | §0 ; annexe A | COUVERT | : |
| 10 | Boutons pas branchés « bientôt », jamais simulés | FR-2, SM-2 | COUVERT (définition l. 142 : C1) | : |
| 11 | Jeu de test : grossiste FICTIF, produits proches de ceux du client (aucune recherche externe) | FR-9 ; l. 3101 | COUVERT | : |
| 12 | Application terrain en Flutter | FR-109 (l. 1847) | COUVERT ; une seule mention | Ajouter au §0 ou §8 : « L'application terrain `prospera-terrain` est en Flutter (décision du PO, D4 du plan). » |
| 13 | Jeu « Grossiste du Golfe » : jus et boissons, Lomé Port + Kara, 3 zones, 12 commerciaux dont 3 freelances, ~600 PDV | FR-9, FR-10, FR-11 | COUVERT | : |
| 14 | Consignes de bouteilles et casiers hors v1, question ouverte | l. 563, §10.2, §12 n° 4 | COUVERT | : |
| 15 | Mode rapide, brouillon avec [ASSUMPTION] | l. 10, 15, §13 | COUVERT | : |
| 16 | PRD microfinance ET assurance écrits ensemble après celui-ci ; la partie 3 sert de noyau | l. 21, §6 | COUVERT | : |
| 17 | Tronc FR-1 à 19 (15 rôles, jeu, garde-fous, alertes, chiffres, provenance) | §4 | COUVERT | : |
| 18 | Créance = registre unique tenu par `paiement` | l. 576, 843, 1955 ; §12 n° 8 | PARTIEL : FR-205 à FR-210 ne l'énoncent pas ; A.2 et A.17 l'ignorent (C13, C14, C21, ligne 10 du tableau B3) | FR-220 proposé plus haut. |
| 19 | Facture à la livraison, quantités servies | FR-42, FR-41, §12 n° 9, Vocabulaire l. 126 | COUVERT (note l. 562 : C6) | : |
| 20 | Bon sur lequel le camion sort, « bon de commande » | l. 126, 465, §12 n° 9 | COUVERT (C18, C19) | : |
| 21 | Série de numérotation unique, continue, reprend Sage | FR-43, FR-217, §12 n° 10 | COUVERT / PARTIEL : l. 618 « décision à trancher » (C7) ; NFR-3 l. 3392 parle d'« une suite continue » par type de document (factures, avoirs, BL) | NFR-3 : « Les factures suivent une série unique par organisation, continue d'année en année, qui reprend Sage ; les avoirs et les bons de livraison ont chacun leur propre suite continue. » |
| 22 | Freelance : il facture le détaillant, deux prix enregistrés, société voit 14 000, commission sur 14 000, 1 000 au freelance ; FR-96/97/98 réécrits | FR-94, FR-96, FR-98 ; §12 n° 11 | COUVERT sur le fond ; contradictions C8, C9, C10, C11, C12, C20 | Voir section A. |
| 23 | Freelance : facture au nom du freelance (numérotation, mentions légales de l'émetteur) | Rien : FR-43 et FR-44 supposent un émetteur unique, l'Organisation | **MANQUE** | Ajouter à FR-96 : « La facture du freelance à son détaillant est émise dans Prospera au nom du freelance : série de numérotation propre au freelance (continue, sans trou), mentions légales de l'émetteur lues de sa fiche (raison sociale, NIF s'il en a un), TVA selon son régime [ASSUMPTION]. Elle n'entre ni dans la série de la société ni dans sa balance clients (FR-97). » |
| 24 | Freelance doit le prix société même si son détaillant ne paie pas | FR-96 (l. 1594) | COUVERT | Ajouter la conséquence testable dans FR-97 : « un détaillant du freelance impayé ne réduit ni la créance du freelance envers la société ni sa commission. » |
| 25 | Blocage crédit > 60 j ou plafond ; alerte direction J+30 ; jamais de déblocage automatique | FR-114 (l. 1998-1999), FR-119 (l. 2059-2061), §12 n° 12 | COUVERT dans le module partagé ; CONTREDIT dans FR-33 et l. 537 (C5) | Voir C5. |
| 26 | Tous les écrans de `reseau`, `pdv`, `catalogue`, `stock` voulus, réductions de février retirées de la partie 4 | l. 3195 (« Tous ces écrans sont voulus »), OQ-4-6 tranchée, §12 n° 13 | COUVERT (vérifier 7.1, 7.3, 7.4 : même phrase que 7.2 l. 3185 présente pour pdv) | Ajouter la même phrase « Tous ces écrans sont voulus » à la fin de 7.1, 7.3, 7.4 si absente. |
| 27 | Boutons « bientôt » SANS date, aucun ordre de livraison figé ; 28 dates retirées ; FR-2 réécrite | FR-2, l. 362, 3466, §10.1 | COUVERT sauf C1, C2, C3, C4 | Voir section A. |
| 28 | Freelance confirmé : il doit le prix société même si son détaillant ne paie pas ; finir les 3 étapes de finalisation et traiter les ~198 hypothèses | FR-96 ; §13 indexe ~200 hypothèses (3470-3610) | COUVERT / EN COURS | Les hypothèses devenues décisions (C3, C7, C10, C13) sont à retirer du §13. |
| 29 | Client de février non nommé | 0 occurrence de « Tampico » ; l. 3101 le dit | COUVERT | : |

## D. Résumé chiffré

- Éléments vérifiés : 15 (cadre brain dump) + 15 (besoins du premier jour) + 20 (modules) + 29 (décisions du memlog) = **79**, plus 21 phrases du PRD examinées une à une en section A.
- COUVERT : environ 60 ; PARTIEL : 11 ; MANQUE : 3 (★ des modules de février, facture du freelance, propriété de « Lancer la navette » / « Lancer le scénario ») ; CONTREDIT : 21 phrases listées en section A.
