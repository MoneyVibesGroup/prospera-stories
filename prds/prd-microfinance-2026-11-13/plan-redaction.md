# Plan de rédaction — PRD Microfinance (2026-11-13)

Document de travail pour les rédacteurs. **Il fait foi sur la forme ; les décisions font foi sur le fond** : `brain-dump-po-2026-11-13.md` (récit du PO), puis `questions-po-2026-11-13.md` (section « Réponses du PO » d'abord, puis les recommandations acceptées), puis `.memlog.md`. En cas d'écart : récit du PO > réponses du PO > recommandations acceptées > démo > cahiers > sources secondaires.

## 1. Conventions d'écriture

- Français, phrases courtes, voix active. Le client n'est **jamais nommé** : « l'IMF ». Le logiciel de l'IMF s'appelle **« le cœur »** (logiciel cœur de l'IMF) ; il n'a pas de nom de produit.
- **Capacités, pas implémentation** : ni API, ni base, ni framework, ni nom de route. Ce qui est technique va dans `addendum.md` (une ligne « → addendum » suffit dans le PRD).
- Forme d'une exigence, comme le PRD distributeur :
  ```
  #### FR-n : Titre court et actif

  Un ou deux paragraphes : qui, quoi, quand. Réalise UJ-x.

  **Conséquences (testables) :**
  - critère vérifiable, avec valeur chiffrée quand il y en a une
  ```
- **Tout seuil est un paramètre de l'IMF** : écrire « (paramètre ; défaut : 500 000 FCFA) ». La valeur par défaut est celle des réponses du PO ou de la démo. Les seuils d'**alerte** sont calibrés sur les données de l'IMF (décision E5) : écrire « (paramètre ; calibré sur les données de l'IMF ; défaut de démo : …) ».
- `[ASSUMPTION]` en ligne quand une valeur ou une règle est déduite sans décision du PO. Pas d'hypothèse en double : si la règle est dans les réponses du PO, elle n'est pas une hypothèse.
- Renvois au PRD distributeur : **« PRD-D FR-114 »**, **« PRD-D §6.2 »**. Renvois aux autres PRD : « PRD paiement FR-P65 », « PRD Reprise FR-9 », « PRD moteur FR-22 », « spine moteur AD-10 ». Jamais « FR-114 » nu pour une exigence d'un autre PRD.
- Boutons non branchés : « bientôt », sans date, jamais simulés (PRD-D FR-2).
- Montants en FCFA entiers ; pourcentages à une décimale au plus.
- Sources citées sobrement entre parenthèses quand elles portent une valeur : (récit §4), (démo `src/lib/x.ts`), (cahier crédit), (Instruction BCEAO n° 010-08-2010). Pas de numéros de ligne dans le PRD.
- Pas de remplissage : une exigence n'existe que si elle est testable.

## 2. Plages d'identifiants (ne jamais en sortir)

| Plage | Partie | Rédacteur |
|---|---|---|
| FR-1 → FR-29 | Partie 1 : règles transverses, rôles, jeu de démonstration, usure, IA commune | parent |
| FR-30 → FR-99 | Partie 2 : le crédit de bout en bout (`credit`, M15) | rédacteur crédit |
| FR-100 → FR-149 | Partie 3a : `produits-financiers`, `microfinance` (clients, KYC, LBC/FT, groupes, épargne lue), `collecte`, `caisse` | rédacteur 3a |
| FR-150 → FR-199 | Partie 3b : `coeur-sfd` (échange avec le cœur + cœur fictif), import du portefeuille, `risque-par`, `conformite-bceao` | rédacteur 3b |
| FR-200 → FR-229 | Partie 4a : recouvrement IMF (écarts à PRD-D §6.2) et terrain IMF (écarts à PRD-D §6.1) | rédacteur 4a |
| FR-230 → FR-269 | Partie 4b : pilotage, équipes, marketing, support, finance (export des écritures), IA commune, modules cadrés, installation chez l'IMF | rédacteur 4b |
| UJ-1 → UJ-9 | parcours (§2.3, parent) | parent |

Chaque rédacteur numérote **dans sa plage, sans trou inutile**, et écrit aussi les lignes de l'**annexe A** (contrat de module, 13 lignes C1→C13, même format que PRD-D annexe A) pour ses modules, dans un fichier à part.

## 3. Les rôles (16, décision F1)

| Code | Rôle | Périmètre |
|---|---|---|
| DG | Directeur général | réseau entier |
| DAF | Directeur administratif et financier | réseau, finance |
| ROC | Responsable des opérations de crédit | réseau, crédit |
| RA | Responsable d'agence | son agence |
| CC | Chargé de crédit | ses dossiers en instruction, son agence |
| GP | Gestionnaire de portefeuille | son portefeuille de prêts (après décaissement) |
| AT | Agent terrain | sa zone |
| COLL | Collecteur | sa zone, ses clients de collecte |
| COM | Commercial | sa zone, ses prospects |
| RCC | Responsable commercial et collecte | son agence ou sa région |
| RSQ | Analyste risque | réseau, lecture + avis consultatif |
| REC | Agent de recouvrement | ses zones affectées |
| AUD | Auditeur interne | réseau, lecture seule, journal d'accès |
| CPT | Comptable / caissier | son agence (validation des paiements, décaissement espèces) |
| COMM | Communication et marketing | réseau, campagnes |
| ADMIN_IMF | Administrateur informatique de l'IMF | comptes et paramètres, **ne lit pas** les données métier |

Pas de rôle PAIE (F8). DC et DEC = vues du DG, pas des comptes. Comité de crédit = ROC + (DG ou RA) (récit §4.6). Rôles sensibles validés par le DG (F7). Échelons géographiques : réseau → région → agence → zone (F2) ; le **secteur d'activité** est une dimension à part, partout (F2).

## 4. Les statuts du dossier de crédit (récit §4 + C1)

SOUMIS → RDV_PROGRAMME → EN_ATTENTE_DOCUMENTS → DOSSIER_COMPLET → VISITES_PLANIFIEES → EN_ANALYSE → VALIDE_CHARGE → EN_ANALYSE_ROC → EN_COMITE_CREDIT → EN_GESTION → CLOTURE ; REFUSE à tout moment (avec motif) ; ANNULE (le client renonce). Avis CC défavorable ⇒ REFUSE (C2). Demande de garanties du ROC ⇒ retour EN_ATTENTE_DOCUMENTS. L'accord du ROC ne crée **pas** d'échéancier ; seul le comité le génère.

Statuts de recouvrement (récit §4.7) : EN_RETARD → EN_RECOUVREMENT → PLAN_ETALEMENT / REGULARISE / BLOQUE → CONTENTIEUX_JUDICIAIRE / PERTE_DEFINITIVE. Seul le ROC bloque ou débloque, avec motif.

## 5. Les modules (codes proposés)

| Code | N° | Partie | Rôle dans le produit |
|---|---|---|---|
| `credit` ★ | M15 | 2 | dossier de crédit de la demande à la clôture, comité, échéancier contractuel, ordre de décaissement |
| `produits-financiers` ★ | M46 [proposition] | 3a | produits de crédit et d'épargne versionnés, éligibilité, conditions figées par dossier (T5) |
| `microfinance` ★ | M32 | 3a | clients (personnes et groupes solidaires), fiche, KYC, LBC/FT et sa mise à jour régulière, épargne **lue** du cœur |
| `collecte` ★ | M16 | 3a | collecte terrain (remboursements, épargne), remise au guichet |
| `caisse` | M14 | 3a | caisse des collecteurs et clôture du jour ; caisse du guichet **lue** du cœur (A8) |
| `coeur-sfd` ★ | M47 [proposition] | 3b | contrat d'échange neutre avec le cœur ; le **cœur fictif** de démonstration est livré à côté |
| `risque-par` ★ | M18 | 3b | PAR, classement, provisions **proposées**, alertes de risque |
| `conformite-bceao` | M20 | 3b | reporting BCEAO, ratios (si balance du cœur), export PDF |
| `recouvrement` ★ | M19 | 4a | module partagé (PRD-D §6.2) + écarts IMF |
| `terrain` ★ | M12 | 4a | module partagé (PRD-D §6.1) + écarts IMF |
| `dashboard`, `equipe`, `marketing`, `automatisations`, `support-client`, `finance-transactions` | M28, M21, M23, M26, M03, M22 | 4b | modules partagés (PRD-D partie 3) + écarts IMF |
| `reseau`, `paiement`, `notification`, `reprise`, `connecteurs`, moteur d'installation | M01, M33, M34, M44, M43 | 4b | fiches de renvoi + écarts |
| IA commune (Risque, Agents métier, Relation client, Pulse) | hors numérotation | 4b | **famille de modules à part** ; ce PRD fournit les données et les emplacements |

`prospera-microfinance-service` = le paquet **comptable** SFD : **non installé** chez cette IMF au jour 1 (A11). On peut en réutiliser les **règles** (classement, provisions, PAR), jamais la tenue des crédits.

★ = dans la démo de février (B5).

## 6. Les décisions qui commandent tout (résumé)

1. **Le cœur fait foi pour l'argent** : soldes, encours officiel, échéancier officiel après décaissement, pénalités, écritures, caisse du guichet, épargne. Prospera tient : le dossier jusqu'au comité, l'échéancier **contractuel** du comité, l'ordre de décaissement, les relances, le recouvrement, le pilotage, la caisse des collecteurs.
2. **Remboursements saisis dans Prospera** : renvoyés au cœur **si le cœur sait les recevoir** ; sinon liste « à saisir dans le cœur » ; confirmés par le mouvement du cœur (A1).
3. **Décaissement** : espèces et virement exécutés par le cœur sur ordre de Prospera (espèces autorisées par CPT ou DAF) ; Mobile Money et PI-SPI par `paiement`, puis déclarés au cœur (A3).
4. **Pénalités et intérêts de retard** : calculés par le cœur (le cœur fictif dans la démo) ; imputation pénalités → intérêts → capital, paramétrable (A4, A5).
5. **Rapprochement** : |payé − échéance| ÷ échéance < 1 % ⇒ automatique ; sinon file du comptable ; jamais refusé (A6). Mobile Money déclaré et virement sans référence validés par CPT ; PI-SPI non (A7).
6. **Échange** : API si le cœur sait, sinon fichiers ; Prospera tire toujours, jamais de port entrant (A10) ; un relais Money Vibes reçoit PI-SPI / FedaPay / WhatsApp et sert le lien de paiement (B1).
7. **Usure** : plafond paramétrable daté, 24 % par an, sur le **TEG actuariel** (frais et assurance inclus, pénalités exclues) ; octroi bloqué au-dessus (Décision n° 19 du 29/12/2025/CM/UMOA, en vigueur le 01/06/2026). Le produit d'exemple de la démo (2,5 %/mois) est illégal : le jeu de démo prend des produits conformes.
8. **L'IA est PARTOUT dans le processus, et ce PRD la spécifie** (correction du PO du 2026-11-13). Chaque module écrit ses capacités d'IA comme des exigences (FR), d'après l'inventaire `C:/Users/thier/Documents/prospera-font-end/docs/prospera_modules_ia.md` (13 modules) et l'« analyse étendue » du dossier de la démo (`prospera-web/src/lib/dossier-enrichissement.ts` : transactions, comportement, macro-économie, saison, recouvrement, saturation du secteur). Le PO insiste sur : l'IA du **crédit**, les **analyses par secteur d'activité**, les analyses **micro** (client, activité, flux, comportement, saison) et **macro-économiques** (inflation, prix, conjoncture, concentration du portefeuille par secteur), les **relances**, les **suggestions de zones de prospection** (zones sous-couvertes). **Le moteur est l'IA commune** (famille de modules à part qui sert ces capacités et apprend entre verticales, sous consentement de l'IMF, par apprentissage fédéré) : le PRD dit **ce que l'IA fait pour l'IMF**, l'IA commune dit **comment**. Règles communes : provenance affichée (règle ou modèle, version, date, données utilisées) ; l'IA propose, un humain décide (spine microfinance AD-12) ; un écart à une proposition exige un motif, renvoyé comme correction ; si l'IA est indisponible, le processus avance sur l'analyse humaine (jamais bloqué) ; le mot « IA » n'est affiché que pour un modèle ; tant qu'un modèle n'existe pas, la capacité est servie par des règles explicables. En annexe A, C11 déclare les modèles et finalités de chaque module (format PRD-D annexe A).
9. **Démo** : IMF fictive, 3 agences, 10 agents, 1 000 prêts actifs, branchée sur le **cœur fictif** ; on peut y créer une agence, un agent et un vrai dossier mené jusqu'à EN_GESTION (B4).
10. **Licence à vie** : jamais de coupure ni de gel pour impayé (B3).
11. **LBC/FT** : KYC à niveaux, PPE, listes de sanctions, seuils CENTIF, et **mise à jour régulière** (listes rafraîchies, revue périodique du KYC) (E3).
12. **Code d'agence** : celui du cœur s'il existe, sinon le nôtre (T6).
13. **Comptabilité** non prioritaire : au mieux un export des écritures vers le cœur.

## 7. Sources par rédacteur

Tous : `brain-dump-po-2026-11-13.md`, `questions-po-2026-11-13.md`, ce plan, et un échantillon du format dans `../prd-distributeur-2026-11-12/prd.md` (lignes 169-205 pour les FR, §6.0 vers la ligne 1950, annexe A vers la ligne 4080).

| Rédacteur | Extraits à lire |
|---|---|
| crédit | `extract-credit.md` (tout), `extract-recouvrement.md` §2 (jonction remboursements), `extract-recherche-reglementaire.md` §1, §5, Impact |
| 3a | `extract-terrain-caisse-epargne.md` (tout), `extract-recherche-reglementaire.md` §7, §8, Impact |
| 3b | `extract-plateforme-integration.md` (tout), `extract-risque-conformite.md` (tout), `extract-recherche-reglementaire.md` §2, §3, §4, Impact |
| 4a | `extract-recouvrement.md` (tout), `extract-terrain-caisse-epargne.md` §3, §11 ; PRD-D §6.1, §6.2 |
| 4b | `extract-pilotage-roles.md` (tout), `extract-plateforme-integration.md` §1, §4-§7 ; PRD-D §6.3-§6.9, §7 |
