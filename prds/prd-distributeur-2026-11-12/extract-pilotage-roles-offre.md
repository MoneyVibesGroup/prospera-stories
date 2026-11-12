# Extrait PRD Prospera Distributeur — Rôles, pilotage, marketing, automatisations, offre, modules IA

Date de l'extraction : 2026-11-12. Sources lues en lecture seule, rien n'a été modifié.

Conventions de citation :
- `F:` = `C:/Users/thier/Documents/prospera-font-end/prospera-distributeur/` (front de démo Next.js 16.2.6 / React 19, zéro backend : aucun `fetch`, aucune route `/api`, tout vient de registres TypeScript en dur et de `localStorage`).
- `F:docs/…` = documentation du même dépôt. `B:` = `C:/Users/thier/Documents/prospera-font-end/docs/prospera_modules_bundles_distributeur.md`.
- Les numéros de ligne sont ceux du code lu le 12/11/2026.

Échelle d'état réel utilisée pour les actions (définie ici, absente des sources) :
- **MORT** : bouton ou badge sans gestionnaire, ou texte figé qui se présente comme dynamique. Aucun effet.
- **SIMULÉ** : un gestionnaire existe, mais l'effet se limite à une entrée dans un journal `localStorage` et/ou à un message de confirmation. Aucun objet métier n'est créé ou modifié, rien ne part vers l'extérieur.
- **BRANCHÉ** : l'action crée ou modifie un objet métier de la démo, relu ailleurs dans l'application (ou déclenche une vraie fonction navigateur : téléchargement CSV, impression, `mailto:`, navigation). « Branché » veut dire « fonctionnel dans la démo », pas « relié à un backend ».

---

## 0. Ce qu'il faut retenir (constats majeurs)

1. **Il y a 14 rôles dans le code, pas d'administrateur.** `UserRole` (`F:src/types/index.ts:1-15`) compte 14 valeurs, `DEMO_USERS` 14 comptes (`F:src/lib/auth.ts:27-87`). Aucun rôle d'administration (gestion des utilisateurs, des droits, activation des modules) n'existe ni dans le code ni dans les docs lues. Il est à définir dans le PRD (voir §1.4).
2. **L'offre commerciale n'est pas cohérente avec elle-même.** La grille de prix (`F:docs/prospera_pricing_distribution.md`, v4.0 juin 2026) vend « 10 modules » pour 53 M FCFA (Grand). Le document modules/bundles (`B:`, v1.0 juillet 2026) vend « 18 modules » au **même prix** et avec les mêmes prix de bundle, alors que chaque bundle a gagné des modules (Terrain 3 → 4, Finance 3 → 4, Stock 2 → 4, Croissance 2 → 6). Le module 16b (Contrôle de gestion) n'est dans aucun bundle. Voir §4.
3. **La démo n'a pas de moteur : les « automatisations » sont des listes de cibles calculées en direct sur des registres.** Valider une cible, désactiver une règle, programmer un post, répondre à un message : tout s'arrête à un journal `localStorage`. Seul le flux combo de stock vers campagne crée un vrai objet relu ailleurs. Plusieurs boutons n'ont pas de gestionnaire (alerte critique du DG, « Lancer / Modifier / Ignorer » des cockpits marketing et recouvrement).
4. **Les contrôles d'accès sont dans une seule table, mais les docs sont périmées.** `ROUTE_ACCESS` (`F:src/lib/route-access.ts:10-56`) pilote le menu ET le garde d'URL (`F:src/app/(dashboard)/layout.tsx:14`). Les matrices de `F:docs/personas/README.md` et de la spec V2 §7.14 ne correspondent plus au code (ex. `/commercial` n'est plus ouvert au Commercial, au Freelance ni à la Prospection ; `/marketing` n'est plus ouvert à la Prospection).
5. **Plusieurs promesses de l'offre n'ont aucun écran** : PI-SPI, connecteur Odoo, voice-to-CRM, application mobile hors ligne dédiée, Copilot IA conversationnel (zéro occurrence dans `F:src`, hors un libellé dans `ComptabiliteView`). « IA » dans la démo = fonctions déterministes sur registres (ex. les 3 « accroches IA » sont une table de modèles par angle, `F:src/lib/social-builder.ts:382-440`).

---

## 1. Les 14 rôles (+ administrateur)

### 1.1 Tableau des rôles

Source des libellés : `F:src/lib/auth.ts:92-107`. Posture : `F:docs/personas/*.md` ligne « Posture » (le CdG n'a pas de fiche : `F:docs/guide-utilisateur/GUIDE_PAR_PERSONA.md:1328-1334`). Écrans : calculés depuis `ROUTE_ACCESS` et `NAV` (`F:src/components/layout/Sidebar.tsx:41-94`). `/dashboard` n'est pas dans la table, il est ouvert à tous les rôles authentifiés.

| # | Code | Libellé | Mission (posture) | Écrans accessibles (routes) |
|---|---|---|---|---|
| 1 | `DG` | Directeur Général | Scanne les chiffres, arbitre, délègue, ne saisit rien. Seul rôle à tout voir. | 18 : `/pilotage-financier` `/dashboard` `/tournees` `/commandes` `/entrepot` `/stock` (+`/catalogue`) `/approvisionnement` `/facturation` `/relances` `/points-de-vente` `/prospection` `/commercial` `/marketing` `/marketing/social` `/automatisations` `/objectifs` `/equipe` `/comptabilite`. Pas `/controle-gestion` (exclusif CdG), pas `/mon-activite` ni `/disponibilite` (outils du terrain). |
| 2 | `DC` | Directeur Commercial | Pilote la force de vente et le chiffre : objectifs, tournées, couverture, marge. | 14 : `/pilotage-financier` `/dashboard` `/tournees` `/commandes` `/stock` `/facturation` `/relances` `/points-de-vente` `/prospection` `/commercial` `/marketing` `/marketing/social` `/objectifs` `/equipe` (+`/catalogue`). |
| 3 | `RESP_VENTES` | Responsable des Ventes | Porte le quota d'une région. Pilote le résultat : atterrissage, mix, marge. | 10 : `/dashboard` `/commandes` `/stock` `/facturation` `/relances` `/points-de-vente` `/prospection` `/commercial` `/objectifs` `/equipe` (+`/catalogue`). Pas `/tournees` (« il pilote par zone, via ses superviseurs », commentaire `route-access.ts:28-31`). |
| 4 | `SUPERVISEUR` | Superviseur de Zone | Chef d'équipe terrain. Pilote l'activité : tournées, caisse, exécution en magasin. | 8 : `/dashboard` `/tournees` `/commandes` `/stock` `/relances` `/points-de-vente` `/commercial` `/equipe` (+`/catalogue`). Pas `/facturation` (arbitre les remises par les validations, n'émet pas de facture). |
| 5 | `COMMERCIAL` | Commercial Terrain | Mobile, souvent hors ligne. Visite, prend la commande, encaisse. | 7 : `/dashboard` (« Ma journée ») `/mon-activite` `/commandes` `/disponibilite` `/facturation` (« Mes proformas ») `/relances` (« Mes relances ») `/points-de-vente` (« Mes clients »). Données filtrées sur `commercial === user.nom` (`F:docs/personas/README.md:85`). |
| 6 | `FREELANCE` | Commercial Freelance | Indépendant : achète au tarif grossiste, revend à ses prix. Sa marge n'est pas visible par la société. | 6 : `/dashboard` `/mon-activite` `/commandes` `/disponibilite` `/facturation` `/points-de-vente` (« Mon portefeuille »). Pas `/relances`. |
| 7 | `PROSPECTION` | Chargé de Prospection | Travaille un territoire : recenser une zone blanche, qualifier, arracher la 1re commande, passer la main au commercial de secteur. | 7 : `/dashboard` `/mon-activite` `/commandes` `/disponibilite` `/facturation` `/points-de-vente` (« Mes ouvertures ») `/prospection` (« Ma conquête »). Pas `/marketing` (« ni budget ni compte de résultat », `route-access.ts:42-43`). |
| 8 | `RESP_STOCK` | Responsable Stock & Logistique | Garant de la disponibilité : ruptures, couverture, taux de service, réappro. | 5 : `/dashboard` `/commandes` `/entrepot` `/stock` `/approvisionnement` (+`/catalogue`). |
| 9 | `GEST_ENTREPOT` | Gestionnaire Entrepôt | Exécute : picking, préparation, bons de livraison, expéditions. Périmètre = son entrepôt (`user.entrepot`, `auth.ts:64`). | 3 : `/dashboard` `/entrepot` (« Mon entrepôt ») `/stock` (« Stock de mon site »). Pas `/commandes` : il reçoit des bons de préparation (`route-access.ts:15-17`). |
| 10 | `DAF` | Directeur Administratif & Financier | Tient la trésorerie et la norme SYSCOHADA. Arbitre ce qui entre et ce qui sort. | 7 : `/pilotage-financier` `/dashboard` `/stock` `/approvisionnement` `/facturation` `/relances` `/comptabilite` (+`/catalogue`). |
| 11 | `COMPTABLE` | Comptable | Saisit, rapproche, clôture. | 5 : `/dashboard` `/stock` `/approvisionnement` `/facturation` `/comptabilite` (+`/catalogue`). |
| 12 | `CONTROLE_GESTION` | Contrôleur de Gestion | Fige les budgets, signale les écarts, envoie des rapports au DG/DAF. N'arbitre ni la trésorerie ni le crédit : « le DAF arbitre, le CdG contrôle ». | 6 : `/dashboard` `/stock` `/facturation` `/controle-gestion` (exclusif, `route-access.ts:12-14`) `/objectifs` `/equipe` (+`/catalogue`). |
| 13 | `MARKETING` | Responsable Marketing | Génère de la demande : campagnes WhatsApp, promos, combos d'écoulement. | 6 : `/dashboard` `/stock` (« Produits à écouler ») `/points-de-vente` (« Mon audience ») `/marketing` `/marketing/social` `/automatisations` (+`/catalogue`). |
| 14 | `RECOUVREMENT` | Responsable Recouvrement | Récupère le cash. Priorise, relance, escalade, bloque le crédit. | 6 : `/dashboard` `/facturation` `/relances` (« Mes dossiers ») `/points-de-vente` (« Clients débiteurs ») `/automatisations` `/comptabilite`. |
| — | (administrateur) | **n'existe pas** | — | — |

### 1.2 Mécanismes d'accès (à reprendre comme exigences)

- Table unique `ROUTE_ACCESS` : route absente = ouverte à tous les rôles authentifiés ; la route la plus spécifique l'emporte (`F:src/lib/route-access.ts:58-65`). Le menu en est une projection (`Sidebar.tsx:133-143`) : un item caché reste atteignable en tapant l'URL, donc le garde d'URL est obligatoire (`layout.tsx:14`).
- Le libellé d'un même écran change selon le rôle (`labelParRole`, `Sidebar.tsx:33`, ex. « Points de vente » devient « Mes clients » / « Mon portefeuille » / « Mes ouvertures » / « Mon audience » / « Clients débiteurs »).
- Un même route rend un composant différent selon le rôle : `/dashboard` (15 composants, `F:src/components/dashboard/DashboardByRole.tsx:21-39`), `/marketing` (`MarketingByRole.tsx:7-16` : vue opérateur pour `MARKETING`/`DC`/`PROSPECTION`, vue DG pour les autres, alors que `PROSPECTION` n'a pas accès à la route), `/commandes`, `/facturation`, `/approvisionnement` (onglets filtrés).
- Filtrage de données : `COMMERCIAL`, `FREELANCE`, `PROSPECTION` ne voient que les lignes où `commercial === user.nom` (hub-context). Le filtrage par zone (`RESP_VENTES`, `SUPERVISEUR`) et par entrepôt (`GEST_ENTREPOT`) est **non activé** sur les listes (13 PDV en démo ; `F:docs/personas/README.md:9`), seul le libellé de périmètre l'est.
- Authentification de démo : mot de passe en clair `password123` dans `auth.ts`, cookie `prospera_dist_auth` = id utilisateur. À ne pas reprendre.

### 1.3 Tableau de bord propre à chaque rôle et KPI par poste

Chaque rôle (hors DG) a : un cockpit dans `/dashboard` + un `PerformancePostePanel` (score /100 pondéré, 4 à 5 KPI valeur / objectif / tendance 6 mois / poids, points forts, axes de progrès ; `F:src/components/dashboard/PerformancePostePanel.tsx:87-157`) alimenté par `F:src/lib/kpi-postes-registry.ts`. Règles de calcul (`kpi-postes-registry.ts:39-60`) : taux d'atteinte plafonné à 130 %, inversé si « plus bas est meilleur » ; score = moyenne pondérée plafonnée à 100 ; statut EXCELLENT ≥ 90, BON ≥ 75, À SURVEILLER ≥ 60, CRITIQUE < 60. Période figée « Juin 2026 ». **Tous les chiffres sont des constantes**, pas des dérivés des registres métier (la spec V2 §8 l'exigeait ; le ROI marketing du KPI, 214 %, n'est pas celui que calcule `marketing-dg-builder.ts:114-116`).

Le DG n'a **pas** de KPI de poste (demande explicite de la spec V2 §3, `spec-v2…md:7.1`) ; il voit la matrice des 13 postes triée par score (`buildMatricePostes`, `kpi-postes-registry.ts:313-318`, `F:src/components/equipe/MatricePostesPanel.tsx`) sur `/equipe`, le DC celle de son périmètre (`POSTES_PERIMETRE_COMMERCIAL`, `:305-307`).

| Rôle | Cockpit `/dashboard` (composant) | KPI de poste, poids entre parenthèses (valeur / objectif démo) | Score démo |
|---|---|---|---|
| `DG` | `DashboardDG.tsx` : bandeau, 8 chiffres de décision, courrier des rapports CdG, rapport IA, 10 KPI 360° en 3 familles, carte zones, axes entrepôts/canaux, alertes IA, sorties + prévisions, top produits, expéditions, balance âgée, top impayés, pilotage équipes (voir §2) | aucun (matrice des 13 postes) | — |
| `DC` | `DashboardDC.tsx` « Pilotage Commercial » : KPI de poste, CA du jour, commandes du jour, visites terrain, commerciaux actifs, commandes récentes | CA réseau (30) 268,4 M / 300 M ; Couverture tournées (20) 82 / 90 % ; Marge brute (25) 21,4 / 24 % ; Nouveaux PDV signés (15) 17 / 25 ; Conversion prospects (10) 31 / 40 % (`:78-90`) | 85 BON |
| `RESP_VENTES` | `DashboardRespVentes.tsx` « Pilotage des ventes » : atterrissage régional vs quota, zones sous quota, « Mes zones » | CA zone / quota (30) 84,2 / 95 M ; Cmd terrain / jour (20) 47 / 55 ; Panier moyen (20) 62,4 / 70 K ; PDV actifs (20) 78 / 85 % ; Taux rupture commande (10, inversé) 9,2 / 5 % (`:92-104`) | 85 BON |
| `SUPERVISEUR` | `DashboardSuperviseur.tsx` « Supervision de zone » : tournées du jour (couverture PJP, strike rate, écart de caisse), PDV les plus anciens sans commande | Couverture visites (25) 86 / 95 % ; Commerciaux ≥ quota (25) 4 / 6 ; PDV à risque churn (20, inv.) 11 / 5 ; Délai litige (15, inv.) 3,4 / 2 j ; CA zone (15) 41,8 / 45 M (`:106-118`) | 71 À SURVEILLER |
| `COMMERCIAL` | `DashboardCommercial.tsx` « Bonjour {prénom} » : visites, commandes prises, CA généré, prochaine visite, tournée du jour, encaissé sur le terrain | Visites / objectif jour (25) 28 / 25 ; Commandes prises (20) 14 / 15 ; CA généré (25) 2,8 / 3,2 M ; Transformation visite→cmd (20) 50 / 60 % ; Encaissement terrain (10) 71 / 80 % (`:120-132`) | 94 EXCELLENT |
| `FREELANCE` | `DashboardFreelance.tsx` : mes PDV, commandes du jour, CA client (vos prix), ma marge du jour vs coût société, tournée, mes clients | Marge nette dégagée (30) 1,24 / 1,5 M ; CA société (20) 8,6 / 10 M ; PDV portefeuille (15) 34 / 40 ; Respect grille prix (25) 88 / 95 % ; Nouveaux PDV (10) 3 / 5 (`:134-146`) | 84 BON |
| `PROSPECTION` | `DashboardProspection.tsx` « conquête de territoire » : « À trancher aujourd'hui » (`buildAlertesConquete`), entonnoir de conquête, survie des ouvertures (cohorte), territoires, passation au secteur | Survie M+3 (30) 56 / 75 % ; Recensé → 1re commande (25) 14 / 25 % ; Impayé sur 1re commande (20, inv.) 7 / 2 % ; Coût d'acquisition PDV (15, inv.) 34,9 / 25 K ; Ouvertures transférées (10) 36 / 90 % (`:155-174`). Différent de la spec V2 §3.3 (prospects qualifiés, zones blanches, délai prospect→client) : choix délibéré, commentaire `:148-154`. | 57 CRITIQUE |
| `RESP_STOCK` | `DashboardStock.tsx` « Pilotage stock & logistique » : ce que la nuit a produit (journal d'automatisation), 4 chiffres (réf. sous seuil, capital qui dort, transferts à arbitrer, fournisseurs en retard), arbitrages refusés à la machine, transferts, performance fournisseurs, charge entrepôts, capital immobilisé | Taux service entrepôts (30) 91 / 97 % ; Ruptures SKU (25, inv.) 12 / 5 ; Rotation stock (15, inv.) 38 / 30 j ; Réappro dans le délai (20) 76 / 90 % ; Valeur stock immobilisé (10, inv.) 18,4 / 12 M (`:176-188`) | 74 À SURVEILLER |
| `GEST_ENTREPOT` | `DashboardGestEntrepot.tsx` : lignes à préparer, camions à charger, réceptions au quai, comptages du jour ; « la question de 7 h » (l'équipe présente peut-elle sortir le travail avant le cutoff) ; vagues du jour ; arrivages au quai ; camions | Délai préparation (25, inv.) 1,4 / 1 j ; Expéditions / jour (25) 34 / 40 ; Erreur picking (20, inv.) 2,8 / 1,5 % ; BL en attente (15, inv.) 9 / 3 ; Taux service entrepôt (15) 93 / 97 % (`:190-202`) | 69 À SURVEILLER |
| `DAF` | `DashboardFinance.tsx` « Direction financière — ce qui attend votre arbitrage » : trésorerie vs plancher, BFR et marge de manœuvre, dette échue, pire canal (marge nette vs brute), « En attente de votre signature » | Solde trésorerie (25) 47,6 / 60 M ; Marge nette (25) 8,4 / 11 % ; Dette fournisseurs échue (25, inv.) 43,8 / 15 M ; DSO (15, inv.) 52 / 35 j ; Écart budget vs réel (10, inv.) 6,2 / 3 % (`:204-220`) | 62 À SURVEILLER |
| `COMPTABLE` | `DashboardComptable.tsx` « Comptabilité » : écritures à traiter, suspens ouverts, rapprochements bancaires, saisie des factures d'achat (alimente la dette 401100) | Écritures saisies / j (20) 118 / 130 ; Taux rapprochement (25) 94 / 98 % ; Suspens ouverts (25, inv.) 23 / 10 ; Délai clôture (15, inv.) 8 / 5 j ; Factures traitées / j (15) 41 / 50 (`:222-234`) | 75 BON |
| `CONTROLE_GESTION` | `DashboardControleGestion.tsx` : CA vs budget, marge vs budget, lignes sous contrôle (bande ±3 %), écarts critiques, « À traiter aujourd'hui » → `/controle-gestion` | Lignes budget sous contrôle (25) 78 / 90 % ; Écarts critiques ouverts (25, inv.) 4 / 1 ; Précision forecast CA (20) 91 / 95 % ; Délai rapport comité (15, inv.) 3 / 2 j ; Écart budget vs réel (15, inv.) 6,2 / 3 % (`:236-255`) | 64 À SURVEILLER |
| `MARKETING` | `DashboardMarketing.tsx` « Cockpit marketing — la machine tourne la nuit, vous arbitrez le matin » (voir §3.3) | ROI campagnes (30) 214 / 250 % ; PDV touchés (20) 187 / 220 ; Conversion promo (20) 34 / 40 % ; Coût / PDV activé (15, inv.) 12,8 / 9 K ; CA généré par combos (15) 14,2 / 18 M (`:257-269`) | 82 BON |
| `RECOUVREMENT` | `DashboardRecouvrement.tsx` « Cockpit recouvrement — la file du jour, priorisée par ce qu'elle rapporte » : encours, cash attendu 30 j (pondéré), perte attendue, DSO réseau, encaissé du mois, crédits bloqués ; « Cette nuit, sans vous » ; file du jour ; prévision (quasi certain / probable / incertain / à provisionner) ; promesses ; encours par zone et par commercial | Montant encaissé (30) 31,4 / 40 M ; Taux encaissement (25) 68 / 82 % ; DSO (20, inv.) 52 / 35 j ; Relances abouties (15) 44 / 60 % ; Créances > 60 j (10, inv.) 28,6 / 10 M (`:271-287`) | 72 À SURVEILLER |

Observation : le DG « ne mesure aucun poste » mais lit tous les scores ; seul le CdG, le DAF et le Comptable ont des écrans de travail distincts de leur cockpit (`/controle-gestion`, `/pilotage-financier`, `/comptabilite`).

### 1.4 Administrateur : à définir (absent des sources)

Aucune source ne définit ce rôle. Le PRD doit au minimum préciser, par analogie avec la console d'administration de la plateforme : qui crée les utilisateurs de l'organisation cliente, qui leur affecte un des 14 rôles, qui active/désactive un module commercial (donc les routes de `ROUTE_ACCESS` correspondantes, voir §4.5), qui gère les plafonds et garde-fous (plafond de crédit, plancher de trésorerie, remise maximale, seuil de validation DG des remises `REMISE_SEUIL_DG = 12 %`, `F:src/lib/combo-stock-workflow.ts:8`), et qui paramètre les objectifs mensuels et le périmètre zone/entrepôt de chaque utilisateur (aujourd'hui en dur dans `DEMO_USERS`, `auth.ts:39,44,64`).

---

## 2. Tableau de bord et pilotage

### 2.1 Les 8 chiffres du DG

Source : `F:src/lib/dg-synthese-decision-builder.ts:83-246` (spec V2 §2.2, `F:docs/spec-v2-pilotage-personas-fournisseurs.md:37-50`), affichés par `F:src/components/dashboard/SyntheseDecisionDGPanel.tsx:78-133` en position 1 du dashboard (`F:src/components/dashboard/roles/DashboardDG.tsx:176`). Titre : « Les chiffres qui engagent une décision ».

Structure d'un chiffre (`dg-synthese-decision-builder.ts:21-38`) : clé, libellé, valeur, format (fcfa / number / pct), famille, détail principal, détail secondaire, variation (% + libellé), `invert` (une hausse est mauvaise), statut SAIN / ATTENTION / CRITIQUE, seuil d'alerte, bouton d'action (libellé + route). Trois rangées visuelles (`:43-71`) : **Argent disponible** (bordure verte), **Ce qu'on me doit / ce que je dois** (ambre), **Activité** (bleue). Une carte CRITIQUE remonte visuellement (anneau rouge, fond rouge pâle, `:257`). Export CSV du bandeau (`SyntheseDecisionDGPanel.tsx:94-108`, BRANCHÉ via `RapportExportBar`/`export-utils.ts:32-36`).

| # | Clé | Chiffre | Source de calcul | Règle de statut | Action (route) |
|---|---|---|---|---|---|
| 1 | `solde_caisse` | Solde caisse & banque | Σ `COMPTES_TRESORERIE.solde` ; détail banque / caisses / flux net du jour | SAIN ≥ 100 M ; ATTENTION ≥ 60 M ; sinon CRITIQUE (`:131`) | Voir la trésorerie → `/pilotage-financier` |
| 2 | `benefice_net` | Bénéfice net (mois) | ligne `RESULTAT` de `COMPTE_RESULTAT` ; marge nette % du CA | SAIN ≥ 5 % ; ATTENTION ≥ 3 % (`:146`) | Compte de résultat → `/comptabilite` |
| 3 | `credit_client` | Crédit client (encours) | Σ `CREANCES_COMPTABLES.reste` ; dont retard > 30 j | CRITIQUE si retard > 40 % de l'encours (`:162`) | Voir les impayés → `/relances` |
| 4 | `dette_fournisseurs` | Dette fournisseurs | `DETTE_FOURNISSEURS_TOTALE` ; dont échue ; prochaine échéance | CRITIQUE si échu > 40 M ; ATTENTION > 15 M (`:179`) ; plafond affiché 15 M | Échéancier fournisseurs → `/approvisionnement?tab=fournisseurs` |
| 5 | `ca_jour` | CA journalier | CA du mois / 30 ; commandes du jour | toujours SAIN (`:195`) | Voir les commandes → `/commandes` |
| 6 | `ca_mois` | CA mensuel | `RESEAU_CONSOLIDE_DIST.ca_mois` ; % objectif mensuel | SAIN ≥ 95 % ; ATTENTION ≥ 85 % | Pilotage par zone → `/equipe` |
| 7 | `ca_annuel` | CA annuel (cumul) | Σ `CA_SPARKLINE_REGISTRY` × 1 M ; % de l'objectif cumulé | SAIN ≥ 95 % ; ATTENTION ≥ 85 % | Pilotage financier → `/pilotage-financier` |
| 8 | `total_commandes` | Total commandes | commandes du jour du réseau ; commandes terrain du mois | toujours SAIN | File de préparation → `/commandes` |

État réel et écarts :
- Les valeurs et statuts sont **dérivés des registres** (règle « une seule source de vérité », spec V2 §8 ; `F:docs/personas/README.md:100-107`) : dette 86,4 M dont 43,8 M échus, crédit client 18,4 M, caisse 128,4 M en démo.
- Les **variations sont des constantes** (4,2 / −8,4 / 12 / 18,6 / 2,1 / 1,7 / 3,4 / 5,8 %, `:128-238`) : SIMULÉ. La « moyenne 30 j » du CA journalier est égale au CA du jour (`:102-103`), donc la variation « vs moyenne 30 j » (+2,1 %) est incohérente. Le « CA annuel » est un cumul de 6 mois, pas annuel (`MOIS_ECOULES`, `:76`). Le « total commandes » affiche le nombre de commandes du jour.
- Les boutons d'action sont des liens de navigation : BRANCHÉ.

### 2.2 Alertes du jour

Trois mécanismes coexistent sur le cockpit DG, aucun n'est un objet « alerte » persistant :

| Élément | Source | Contenu | État réel |
|---|---|---|---|
| Bouton clignotant « N alertes critiques » | `DashboardDG.tsx:168-171` ; N = nombre d'anomalies `CRITIQUE` de `buildAnomaliesOperationnellesDG()` (`F:src/lib/dg-pilotage-detail-builder.ts:92-122`) | N = 2 en démo (Kiosque Port, rupture huile 5 L) | **MORT** : le bouton n'a pas de `onClick`. |
| Encart « Attention » | `DashboardDG.tsx:164-167` | Texte figé « Lomé Port sous tension · huile en rupture · crédit Kiosque Port » | **MORT** (texte codé en dur, pas dérivé). |
| Anomalies opérationnelles IA | `dg-pilotage-detail-builder.ts:92-122`, affichées dans la colonne « Anomalies opérationnelles » | 5 objets `{id, severite CRITIQUE/HAUTE/MODEREE, domaine, titre, detail, responsable}` (ex. `ao-1` Crédit B2B « Blocage commande — Kiosque Port », responsable Elom Adjavon) | SIMULÉ : lecture seule, pas de statut, pas d'action, pas d'accusé de réception. |
| Panneau « Alertes opérationnelles — {axe} » (`AiInsightPanel`) | `DashboardDG.tsx:296-300`, `buildInsightsOperationnels(axeId)` | Insights filtrés par l'axe sélectionné (entrepôt ou canal), repliable | BRANCHÉ pour le filtre par axe (clic sur une carte `AxePilotageCard`, `:71-126`, `:265`) ; lecture seule sinon. |
| « Alertes immédiates » du rapport IA | `RapportIAGlobal.tsx:406-420` | liste de chaînes préfixées 🚨 critique / ⚠ attention / autre (le niveau est déduit du premier caractère, `:411-412`) | SIMULÉ : texte brut, pas de structure. |
| Points d'attention du pilotage financier | `ComptabiliteDGView.tsx:29-33,103-117` | 3 cartes figées (provision Kiosque Port 1,42 M ; pic de décaissement J+5, 28,6 M ; marge sous objectif 23 % vs 25 %) avec sévérité CRITIQUE/HAUTE/MODEREE et une action en texte | **MORT** (constante codée en dur, aucun bouton). |

À spécifier dans le PRD : un vrai objet « alerte » (domaine, sévérité, responsable, source, horodatage, statut ouverte / prise en charge / résolue, lien vers l'objet concerné), générée par des règles ; aujourd'hui seules les valeurs sont calculées, le cycle de vie n'existe pas.

### 2.3 Décisions à trancher

Trois listes distinctes, avec un seul vrai mécanisme de décision :

| Liste | Où | Objet | Statuts | Actions | État réel |
|---|---|---|---|---|---|
| **Décisions à trancher** (DG) | `ComptabiliteDGView.tsx:120-173` (page `/pilotage-financier`) ; données `DECISIONS_COMPTA_DG`, `F:src/lib/registries/comptabilite-registry.ts:282-288` | 5 décisions numérotées : `{priorite, titre, impact, decision}` : 1 valider la provision Kiosque Port 1,42 M ; 2 anticiper le pic de trésorerie J+5 (28,6 M) ; 3 créances > 30 j = 23 % du poste client ; 4 marge brute 23 % sous l'objectif 25 % ; 5 clôture de juin dans 19 j | Pas de statut sur l'objet ; le journal porte un `choix` : `VALIDE` ou `REPORTE` | Boutons **Valider** et **Reporter** uniquement sur la décision n° 1 (`:143-168`) ; cliquer à nouveau sur le même choix l'annule (toggle) | **SIMULÉ** : écrit une entrée `DECISION_DG` dans `localStorage` (`prospera.decisions.journal.v1`, `F:src/lib/decisions-workflow.ts:34`) avec `by`, `at`, `label`, `detail` ; aucune écriture comptable (OD PROV-411) n'est produite. Décisions 2 à 5 : **MORT** (texte seul, pas de boutons). |
| Décisions recommandées pour le DG | `F:src/components/equipe/EquipeView.tsx:194-215` (`/equipe`, vue direction DG/DC) | `{priorite, titre, commercial?, impact, decision}` | aucun | aucune | **MORT** (lecture seule). |
| 5 décisions prioritaires pour le DG (marketing) | `F:src/components/marketing/MarketingDGView.tsx:316-337`, données `DECISIONS_IA_DG` (`marketing-registry.ts:252`) | `{priorite, titre, impact, risque, decision}` | aucun | aucune | **MORT** (lecture seule). |
| Journal des décisions | `F:src/lib/decisions-workflow.ts`, `F:src/contexts/DecisionsWorkflowContext.tsx` | `DecisionEntry {id, kind, refId, choix, label, detail, by, at}`, kinds `DECISION_DG`, `ARBITRAGE_PAIEMENT`, `CREDIT_CLIENT`, `LETTRAGE`, `CLOTURE_TACHE` (`:14-19`) | choix libre par kind (`PAYER`, `ACCORDE`, `LETTRE`, `FAIT`…) | `decider` (pose, ou efface si même choix), `effacer` | SIMULÉ côté DG ; réutilisé par le DAF (`PilotageDAFView.tsx:64`) et le Comptable (`ComptabiliteComptableView.tsx:51`). |

Autres files de décision par rôle (hors DG) : DAF « En attente de votre signature » (`DashboardFinance.tsx:90-112`, liens de navigation, BRANCHÉ en navigation seulement) ; CdG « À traiter aujourd'hui » (`DashboardControleGestion.tsx:81-106`) ; Prospection « À trancher aujourd'hui » (`DashboardProspection.tsx:55-87`) ; RESP_STOCK « Arbitrages : ce que la machine refuse de trancher seule » (`DashboardStock.tsx:152-172`) ; DG reçoit les rapports du CdG via `RapportsCdgInbox` (`DashboardDG.tsx:179`).

À spécifier : un objet « décision » unique (sujet, montant/impact, décideur requis, échéance, options, choix, trace), avec effet réel à la validation (écriture comptable, déblocage de crédit, lancement d'une campagne, validation d'une commande fournisseur) et délégation/escalade par seuil.

### 2.4 Le rapport de direction IA (structure)

Composant `F:src/components/dashboard/RapportIAGlobal.tsx` (props : `rapport`, couleur, `analyseLabel`) ; type `RapportIA` (`F:src/types/rapport-ia.ts:40-64`) ; généré pour le DG par `buildRapportIADG()` (`F:src/lib/rapport-dg-distribution-builder.ts`, constante `RAPPORT_IA_DG` ligne 141). Le dashboard le place en position 2, après le bandeau des 8 chiffres et le courrier CdG (`DashboardDG.tsx:182`).

Structure du rapport :
1. **En-tête** (`:285-312`) : « Rapport IA — Vue d'ensemble », badge « AUTO 06:00 », date de génération, période, destinataire ; boutons Exporter PDF (`window.print()`, `:253-257`, BRANCHÉ), Envoyer par e-mail (`mailto:` avec résumé texte, `:259-264`, BRANCHÉ côté client de messagerie uniquement), Réduire/Développer.
2. **Analyse de situation** (`synthese_executive`, 3 paragraphes, `:318`).
3. **Analyse par domaine** (`synthese_piliers[]` `{titre, contenu}` : ventes terrain, facturation/encaissements, stock/entrepôts, réseau freelance & marges, objectifs & prévisions juillet ; `:331-345`).
4. **Lecture opérationnelle** (`synthese_operations[]` : `SyntheseSecteurIA {secteur_id, nom, groupe ENTREPOT/CANAL/FAMILLE, tendance POSITIF/STABLE/ALERTE, risque_niveau FAIBLE→CRITIQUE, résumé, analyse_ia, chiffres[], prévisions (7/30/60 j, confiance, tendance), scénarios Optimiste/Central/Pessimiste avec probabilité, facteurs clés, action prioritaire, équipe[] avec score, évolution 6 mois}` ; `:353-…`, `types/rapport-ia.ts:3-35`).
5. **Chiffres clés** (`chiffres_cles[]` `{label, valeur, tendance, commentaire}`).
6. **Alertes immédiates** (`alertes_immediates: string[]`, `:406`).
7. **Points forts** (`string[]`, `:426`) et **points d'attention** (`{titre, detail, severite CRITIQUE/HAUTE/MODEREE}`, `:440`).
8. **Recommandations priorisées** (`{priorite 1|2|3, action, impact_estime, delai}`, triées par priorité, `:462-478`).
9. **Prévisions grossiste 30 jours** (`{metrique, valeur_actuelle, valeur_prevue, confidence}`, `:482`) et **Vs mois précédent** (`{metrique, mois_precedent, mois_courant, variation_pct, variation_unite pct|pt}`, favorable/défavorable déduit du nom de la métrique par expression régulière, `:498-516`).
10. **Pied** : `signature_ia` + mention « économie estimée : 4 h/semaine vs consolidation manuelle ».

État réel : tout est généré par gabarits de texte sur les registres (`rapport-dg-distribution-builder.ts:36-70`), date figée « 11/06/2026 à 06:00 », badge « AUTO 06:00 » décoratif (aucune planification), pas de LLM, pas d'historique de rapports, pas de destinataires configurables. Le même composant est prévu pour d'autres destinataires (`analyseLabel`, `destinataire`), mais seul `RAPPORT_IA_DG` existe.

Autres blocs du cockpit DG : 10 KPI 360° en 3 familles Commercial / Finance / Opérations (`KPIS_GLOBAUX_DG`, `F:src/lib/mock-dg-kpis-builder.ts:105-230,360` : ventes sorties entrepôt, commandes terrain/jour, couverture tournées, panier moyen, encours clients impayés, taux d'encaissement, marge brute grossiste, ruptures SKU, taux de service entrepôts, expéditions/jour), carte et pilotage par zone (`ZonePilotageDGPanel.tsx`, `CarteZonesDG.tsx`), cartes d'axes 2 entrepôts + 3 canaux avec score de pilotage IA /100 et statut SAIN/ATTENTION/CRITIQUE (`F:src/lib/pilotage-axes-dg.ts`), prévisions CA 3 mois avec confiance (`buildForecastCA`).

---

## 3. Marketing, studio réseaux sociaux, automatisations

### 3.1 Marketing et campagnes (`/marketing`)

Accès : `DG`, `DC`, `MARKETING` (`route-access.ts:44`). Deux vues selon le rôle (`MarketingByRole.tsx:7-16`) : **vue opérateur** `MarketingView.tsx` (`MARKETING`, `DC`) et **vue DG** `MarketingDGView.tsx` (DG ; contrôle, pas de création).

Objets (`F:src/lib/registries/marketing-registry.ts`) :
- `CampagneMarketing` (`:22-49`) : nom, objectif, but de campagne, offre, produits (`ProduitCampagneDetail` : référence, prix grossiste, prix promo, remise %, rôle du produit dans la campagne, unités vendues / objectif, marge %), canal (`WHATSAPP` | `SMS` | `TERRAIN` | `MIXTE` | `CHATBOT`), statut (`EN_COURS` | `PLANIFIEE` | `TERMINEE` | `PAUSE`), zone, segment, dates, entonnoir (cibles → contactés → ouverts → répondus → convertis), CA généré, coût, marge générée, budget max, commercial assigné, synthèse et recommandation IA, alerte. 8 campagnes en démo (`:90-220`).
- `LeadProspection` (`:51-66`) : statut `NOUVEAU` → `QUALIFIE` → `CHAUD` → `NEGOCIATION` → `CONVERTI` | `PERDU`, score IA, CA potentiel/mois, source (terrain, chatbot WhatsApp, campagne, SMS), prochaine action. 10 leads (`:222`).
- `SegmentIA` (`:68-78`, 6 segments, `:235`, dont « À risque crédit — exclure promos » en priorité CRITIQUE) et `ZoneBlanche` (`:80-88`, `:244`) : partenaires actuels, saturation, potentiel CA/mois, priorité IA.
- Indicateurs d'une campagne (`F:src/lib/marketing-dg-builder.ts:88-98`) : taux de contact, d'ouverture, de réponse, de conversion (convertis / contactés), **ROI = marge générée / coût de campagne** (`:90`, `:114-116`), coût par conversion, budget restant. Synthèse (`:101-123`) : campagnes actives (EN_COURS + PLANIFIEE), CA, marge, budget consommé, ROI moyen, leads actifs, leads chauds, conversion WhatsApp, coût d'acquisition, zones blanches prioritaires (priorité IA ≥ 70).

Écran opérateur (`MarketingView.tsx`) :
- 8 KPI (`:150-170`) : CA généré campagnes, marge, ROI moyen, budget consommé, leads actifs, leads chauds, conversion WhatsApp, coût d'acquisition.
- Bloc « Combos écoulement stock — à lancer » (`:172-190`) + « Promotions fournisseurs » (`PromotionsFournisseursPanel`).
- 4 onglets (`:24-29`) : Campagnes (filtre par statut, détail avec entonnoir, ROI, conversion, coût/conv., budget restant), Pipeline leads (colonnes par statut), Segmentation IA, Zones blanches ; panneau « Analyses IA marketing ».
- Vue DG (`MarketingDGView.tsx`) : 6 KPI, analyse IA de situation, « Contrôle — campagnes en cours » (`:206-275`), combos de stock en mode `dg`, promotions fournisseurs, suggestions de campagnes IA (dépliables), 5 décisions prioritaires (§2.3).

Combos de stock (le lien stock → marketing) :
- Objet `ComboStockIA` (`F:src/lib/marketing-combo-stock-builder.ts:11-50`) : type `COMBO_MOTEUR` | `PROMO_CHOC` | `BUNDLE_ADOPTION`, sévérité `CRITIQUE`/`HAUTE`/`MODEREE`, produit lent + produits moteurs (profil de stock : couverture, rotation, valeur immobilisée, coût du stock lent par mois, engouement), remise sur le lent, prix promo, stock à libérer, coût évité/mois, CA potentiel, contacts cibles, canal, zone, marge du combo. Jusqu'à 6 combos, triés par coût du stock lent (`buildCombosStockIA`, `:232-250`).
- Workflow `F:src/lib/combo-stock-workflow.ts` : statuts `EN_ATTENTE_DG` → `VALIDEE` → `CAMPAGNE_CREEE` (+ `AUTO_DISPONIBLE`). **Validation DG requise** si remise ≥ 12 % (`REMISE_SEUIL_DG`, `:8`), sévérité CRITIQUE ou type `PROMO_CHOC` (`needsDgValidation`, `:33-39`). Sinon, transmission automatique possible.
- Actions (`F:src/components/marketing/CombosStockPanel.tsx`) : DG — « Valider & transmettre au marketing » (`:73-81`) ou « Transmettre au marketing (seuil auto < 12 %) » (`:84-93`) ; Marketing — « Créer la campagne » (`:122-135`) puis « Voir la campagne » (`:100-110`). `comboToCampagne` (`combo-stock-workflow.ts:~118-160`) fabrique une campagne `PLANIFIEE` de 14 jours, budget = contacts cibles × 5 500 F, WhatsApp, commercial affecté selon la zone.
- État réel : **BRANCHÉ** dans la démo. Les files et les campagnes créées sont persistées (`prospera-combo-queue`, `prospera-combo-campagnes`, `combo-stock-workflow.ts:34-35`) et la campagne rejoint l'onglet Campagnes, l'entonnoir et le ROI (`MarketingView.tsx:112-115`, filtre `PLANIFIEE` après création `:132-137`). Aucun envoi réel : une campagne créée reste à 0 contacté / 0 CA.
- Promotions fournisseurs (`PromotionsFournisseursPanel.tsx`) : croise remises volume du registre fournisseurs et surstock (couverture > 45 j) ; « Monter la campagne » (`:174`) crée une campagne d'écoulement via `promoFournisseurToCampagne` (`combo-stock-workflow.ts` suite, durée 21 j, budget = cibles × 4 500 F) et journalise `CAMPAGNE_ECOULEMENT` ; « Annuler » (`:158`). BRANCHÉ de la même façon.

Ce qui manque ou ne marche pas (état réel) :
- **Aucune création de campagne à la main, aucun passage EN_COURS / PAUSE / TERMINEE** : le statut vient du registre ; la vue opérateur et la vue DG ne portent aucune action sur une campagne existante (pas de lancer, pause, arrêt, modifier le budget). MORT par absence.
- Les 4 KPI d'en-tête du dashboard Marketing (« 47 prospects / 34 % / 3 campagnes / 8 zones ») sont signalés comme codés en dur (`F:docs/personas/README.md:9` ; `F:docs/personas/marketing.md:80`).
- Deux « ROI » différents : marge générée / coût (campagnes) ; (marge incrémentale − coût) / coût (social, §3.2) ; plus un ROI de poste figé à 214 % (`kpi-postes-registry.ts:261`) et un « seuil DG 250 % » dans une phrase (`marketing-dg-builder.ts:273`).

### 3.2 Studio réseaux sociaux (`/marketing/social`)

Accès : `DG`, `DC`, `MARKETING` (`route-access.ts:47` : « le DG regarde ce qui part au nom de l'entreprise, il ne le rédige pas »). Composant `F:src/components/marketing/SocialStudioView.tsx` (1 231 lignes) ; logique `F:src/lib/social-builder.ts`, `F:src/lib/social-studio.ts`, registre `F:src/lib/registries/social-registry.ts`, journal `F:src/lib/marketing-workflow.ts`.

**Canaux** (`social-registry.ts:11-63`) : `WHATSAPP` (canal de vente), `FACEBOOK` (notoriété par zone), `TIKTOK` (acquisition jeune, coût par lead le plus bas), `INSTAGRAM` (vitrine, `connecte: false`, `:66`, le seul compte non connecté). Par compte : handle, abonnés, croissance 30 j, portée, engagement, leads, commandes, **CA attribué** (tout le CA du canal) et **CA incrémental** (nouveaux clients et réactivations seulement, « la part réellement créée par le social »), heures optimales mesurées sur 90 jours.

**Calendrier éditorial** (onglet 1, `SocialStudioView.tsx:31-38`) : `PostSocial` (`social-builder.ts:48-71`) = date, heure, réseau, **angle** (`ECOULEMENT` | `PROMO` | `PREUVE_SOCIALE` | `EDUCATION` | `DISPONIBILITE` | `ACQUISITION`, `:27-37`), **statut** (`BROUILLON_IA` → `A_VALIDER` → `PROGRAMME` → `PUBLIE`, `:39-46`), accroche, corps, hashtags, appel à l'action, visuel suggéré, produit, **« pourquoi » (la raison commerciale)**, score d'engagement, résultats une fois publié (portée, clics, leads, commandes, CA attribué). `buildCalendrierSocial()` (`:243-277`) génère 7 jours de posts à partir des combos de stock, de la disponibilité et des zones blanches : WhatsApp chaque matin ouvré, Facebook lundi/jeudi (contenu utile) et mardi (preuve sociale), TikTok mercredi/vendredi soir (conquête). Les **rythmes commerciaux** (`RYTHMES_COMMERCIAUX`, `social-registry.ts:~75-107`) datent les ventes : semaine de paie (22-25 du mois), veille de jour de marché (lundi, vendredi), pic de chaleur (juin-septembre), préparation week-end (jeudi). Vues liste / semaine, filtres réseau et angle, mix éditorial, impact projeté d'un post.

**Accroches IA** : `buildVariantesPost` (`social-builder.ts:382-440`) propose 3 réécritures de l'accroche par angle (ex. Urgence / Bénéfice marge / Question) avec une note expliquant le ton. État réel : **tables de gabarits déterministes**, pas de modèle de langage (SIMULÉ).

**Idées et modèles** (onglet 2) : `buildIdeesContenu()` (`social-studio.ts:164`) déduit des idées de l'actualité de l'entreprise (surstock, zone à conquérir, rythme) ; `MODELES_CONTENU` (`:248-310`, 5 modèles : promo combo, disponibilité, témoignage, conseil, conquête) ; `adapterPourReseau` adapte un post à un autre réseau (heure, longueur, hashtags, CTA WhatsApp `wa.me/22890001212`, `:92-140`).

**Boîte de réception unique** (onglet 3) : `MessageSocial` (`social-registry.ts:~125-145`) = réseau, auteur, contenu, âge en minutes, **intention** (`COMMANDE` SLA 1 h, `RECLAMATION` 1 h, `PRIX` 2 h, `DISPONIBILITE` 2 h, `PARTENARIAT` 24 h, `SPAM`), confiance de classification, réponse suggérée, `auto_repondable`, potentiel FCFA, zone. 8 messages en démo. `buildInboxSocial()` (`social-builder.ts:539-557`) trie par potentiel, écarte le spam, compte les messages « hors SLA » (60 min pour achat/réclamation, 120 min sinon). Garde-fou visible : un message de réclamation d'un client en impayé est marqué « NE PAS RÉPONDRE AUTOMATIQUEMENT… transférer au recouvrement » (`msg-4`).

**Performance** (onglet 4 « Ce que ça rapporte ») : `buildPerfSocial` (`social-builder.ts:356-377`) = abonnés, portée, leads, commandes, CA attribué vs CA incrémental, coût mensuel (420 000 F en dur), marge incrémentale (13 % du CA incrémental), ROI = (marge − coût) / coût, coût par lead, CA en attente dans la file (1,2 M par post à valider). **Journal d'activité** (onglet 5).

Actions et état réel (`SocialStudioView.tsx`, journal `MarketingActionKind`, `marketing-workflow.ts:28-39`, clé `prospera.marketing.journal.v1`) :

| Action | Ligne | Effet réel | État |
|---|---|---|---|
| Valider et programmer un post | `:577` | entrée `POST_PROGRAMME` ; le post affiche « programmé » ; **rien n'est publié** sur aucun réseau | SIMULÉ |
| Réécrire (choisir une des 3 accroches) | `:464` | `POST_REECRIRE`/`POST_EDITE` modifie l'affichage du post | SIMULÉ (relu dans le calendrier) |
| Éditer à la main (accroche, corps) | `:488` | `POST_EDITE` | SIMULÉ |
| Replanifier (date, heure) / Remettre à l'origine | `:383,533-534` | `POST_REPROGRAMME`, recalcule le libellé du jour | SIMULÉ (relu dans le calendrier) |
| Dupliquer vers un autre réseau | `:545`, `social-studio.ts:92` | crée un `POST_DUPLIQUE` adapté (statut `A_VALIDER`) | BRANCHÉ (nouvel objet visible dans le calendrier) |
| Nouveau post (composer), depuis idée ou modèle | `:936,846`, `postFromBrouillon` `social-studio.ts:43` | crée un `POST_CREE`, statut `A_VALIDER` | BRANCHÉ |
| Supprimer / Rétablir | `:586,567` | `POST_SUPPRIME` masque le post | SIMULÉ |
| Annuler la dernière action | `:448,573,1105` | retire l'entrée du journal | SIMULÉ |
| Inbox : « Envoyer » la réponse suggérée | `:1109` | `MESSAGE_REPONDU` ; le message passe à « réponse envoyée » ; **aucun message ne part** | SIMULÉ |
| Inbox : « Modifier » | `:1110` | `POST_REECRIRE` (clé `msg-…`), sans éditeur | SIMULÉ |
| Inbox : « Créer le lead » | `:1117` | `LEAD_CREE` dans le journal ; **ne crée aucun lead** dans `REGISTRE_LEADS` ni dans le pipeline de `/marketing` (aucune autre lecture de `LEAD_CREE` dans le code) | SIMULÉ |
| Réponse automatique | libellé `:1082-1084` « part dans 2 min sauf annulation » | texte seul, aucune minuterie, aucun envoi | MORT |
| Connecter un compte (Instagram `connecte:false`) | affichage `:882-886` | pas d'action de connexion | MORT |

À spécifier pour un vrai produit : connexion OAuth des comptes, publication/planification via les API des réseaux (WhatsApp Business, Facebook, TikTok, Instagram), réception des messages, classification d'intention, réponses automatiques sous garde-fous, attribution (lead → commande → CA incrémental), création réelle du lead dans le CRM.

### 3.3 Automatisations (`/automatisations`)

Accès : `DG`, `MARKETING`, `RECOUVREMENT` (`route-access.ts:50` ; « le moteur projette les règles du poste de celui qui le consulte », DG voit les deux jeux, `AutomationsView.tsx:22-26`). Badge du menu `AUTO_A_VALIDER` (`Sidebar.tsx:108-116`, `:129`). Moteur : `F:src/lib/automation/automation-types.ts` (« Une règle n'est pas une case à cocher décorative : elle est évaluée sur les registres à chaque rendu et produit la liste réelle des cibles »).

**Trois modes d'exécution** (`automation-types.ts:20-35,69-81`) :
- `AUTO` (« Automatique », vert) : part sans intervention, réservé aux actions réversibles et sans risque relationnel (rappel d'échéance, accusé).
- `VALIDATION` (« À valider », ambre) : tout est prêt, un humain clique ; dès qu'il y a de l'argent, une remise ou la réputation en jeu.
- `SUGGESTION` (bleu) : l'IA signale, l'humain décide et fait (baisser un plafond de crédit).

**Objet `RegleAutomation`** (`:61-85`) : id, nom, poste (`UserRole`), déclencheur, action, canal (`WHATSAPP`, `SMS`, `APPEL`, `VISITE`, `EMAIL`, `FACEBOOK`, `TIKTOK`, `CHATBOT`, `SYSTEME`), mode, actif, **garde-fous** (« ce que la règle refuse de faire »), quota, **cibles** (`CibleAutomation` : libellé, détail, canal, **message prêt à l'envoi**, valeur FCFA, score de confiance 0-100, moment, `bloque_par` si retenue par un garde-fou), statistiques 30 j (exécutions, succès, taux, impact FCFA), explication IA, gain de temps en h/mois. `SyntheseAutomation` (`:87-114`) : règles actives, actions automatiques, à valider, bloquées, valeur en jeu, temps gagné (équivalent ETP = h / 150, `AutomationsView.tsx:~250`).

**Garde-fou transverse** (`F:src/lib/automation/garde-fous.ts`) : un client en défaut est **exclu de tout envoi commercial** : retard > 30 j ou crédit bloqué (dossiers de recouvrement) ou pipeline `A_RISQUE` (`:33-78`) ; quota de 2 messages par client et par semaine (`:99`) ; audience adressable = partenaires non exclus (`:89-92`). Les cibles exclues **restent visibles** avec le motif (« une automatisation qui bloque en silence est une automatisation qu'on finit par ne plus croire », `AutomationsView.tsx:~190`).

**Règles marketing** (`F:src/lib/automation/marketing-automations.ts`, `buildReglesMarketing` `:340-350`, 7 règles) :

| Id | Nom | Mode | Canal | Déclencheur |
|---|---|---|---|---|
| `mkt-combo-stock` | Surstock détecté → combo d'écoulement | VALIDATION | WhatsApp | référence > 45 j de couverture ou rotation qui double ; max 2 combos simultanés par zone |
| `mkt-reactivation` | Client silencieux 30 j → séquence de réactivation | AUTO | WhatsApp | PDV actif sans commande depuis 30 j ; 2 messages / client / semaine |
| `mkt-qualif-leads` | Lead entrant → qualification chatbot + scoring crédit | AUTO | Chatbot | un lead arrive (chatbot WhatsApp, formulaire, commentaire Facebook) |
| `mkt-leads-chauds` | Lead chaud sans contact → relance du commercial | AUTO | WhatsApp | lead CHAUD/NÉGOCIATION 48 h sans contact |
| `mkt-proformas` | Devis qui expire → relance avant échéance | AUTO | WhatsApp | proforma envoyée à 48 h de sa validité sans réponse |
| `mkt-zones-blanches` | Zone sous-couverte → campagne d'acquisition géociblée | VALIDATION | Facebook | zone < 2 partenaires actifs avec potentiel > 3 M FCFA/mois |
| `mkt-onboarding` | Première commande → séquence d'accueil 30 jours | AUTO | WhatsApp | un PDV passe sa première commande |

**Règles recouvrement** (`F:src/lib/automation/recouvrement-automations.ts`, `buildReglesRecouvrement` `:384-…`, 9 règles) : `rec-preventif` J-3 avant échéance (AUTO, WhatsApp, un seul rappel par facture, jamais si déjà payé) ; `rec-j1` J+1 → relance douce (AUTO, WhatsApp, relevé joint, 62 exécutions, 71 % de succès) ; `rec-j7` J+7 → SMS + appel programmé (AUTO, max 2 appels/jour) ; `rec-j15` J+15 → visite terrain assignée dans une tournée existante (VALIDATION, le commercial ne négocie jamais d'abandon de créance) ; `rec-j30` J+30 → mise en demeure + alerte DG (VALIDATION, acte à portée juridique) ; `rec-promesses` promesse de paiement non tenue → escalade (AUTO, appel) ; `rec-blocage` retard > seuil ou plafond dépassé → blocage du crédit (AUTO, système, notification commercial + DG, journalisation) ; `rec-prevention` dégradation détectée → réduire le plafond avant l'impayé (SUGGESTION) ; `rec-rapprochement` paiement reçu → lettrage et arrêt des relances (AUTO).

**Écran** (`F:src/components/automation/AutomationsView.tsx`) : 6 tuiles (actions automatiques, en attente de vous, retenues, valeur en jeu, temps gagné, équivalent ETP) ; encart « Trois niveaux de confiance, jamais un seul » ; une carte par règle (nom, mode, déclencheur « Quand », action « Alors », nombre de cibles et valeur en jeu, exécutions 30 j, taux de succès, impact 30 j, temps gagné), dépliable : explication IA, garde-fous et quota, jusqu'à 6 cibles avec message prêt.

**« Journal de la nuit »** (« Cette nuit, sans vous ») : il n'est **pas** sur `/automatisations` mais dans les cockpits.
- Marketing (`DashboardMarketing.tsx:63-98`, `buildNuitMarketing` `marketing-automations.ts:353-374`) : messages partis, leads qualifiés, posts programmés (7 j), clients protégés (exclus des promos), à valider, CA attribué 30 j, avec la liste des clients retirés des campagnes.
- Recouvrement (`DashboardRecouvrement.tsx:58-77`) : relances parties seules, en attente de vous, promesses à surveiller, cash dans la file (capacité plafonnée à `CAPACITE_JOUR` dossiers/jour).
- Stock (`DashboardStock.tsx:66-97`) : journal d'automatisation logistique `F:src/lib/automation-journal.ts` (`EntreeJournal` : domaine REAPPRO/TRANSFERT/PREPARATION/EXPEDITION/RECEPTION/INVENTAIRE/STOCK, nature `EXECUTE` | `PROPOSE` | `ESCALADE`, déclencheur mesuré, action, gain FCFA, gain en minutes, **poste qui aurait dû décider** `delegue_par`, `reversible`), panneau `JournalAutomatisationPanel.tsx`.

Actions et état réel (`F:src/lib/automation-workflow.ts`, `F:src/contexts/AutomationWorkflowContext.tsx`, clé `prospera.automation.journal.v1`) :

| Action | Où | Effet réel | État |
|---|---|---|---|
| Activer/désactiver une règle (interrupteur) | `AutomationsView.tsx:~96`, `basculerRegle` | entrée `REGLE_OFF` ; la carte est grisée, la synthèse de la page se recalcule | SIMULÉ (la page `/automatisations` le relit ; le badge du menu `Sidebar.tsx:108-116`, les « nuit » des cockpits et les compteurs des cockpits **ne le relisent pas**) |
| Valider une cible (règles VALIDATION/SUGGESTION) | `:~215` | `CIBLE_TRAITEE` = `VALIDEE` ; badge « Validée », annulable ; **aucun message ne part** | SIMULÉ |
| Ignorer une cible | `:~225` | `CIBLE_TRAITEE` = `IGNOREE` | SIMULÉ |
| Cibles des règles AUTO | libellé « Départ automatique demain 08:00 » (`recouvrement-automations.ts:~188`) | texte seul : rien ne part, rien n'est planifié | MORT |
| « Lancer », « Modifier le message », « Ignorer » dans le cockpit marketing | `DashboardMarketing.tsx:147-157` | boutons **sans gestionnaire** | MORT |
| « Lancer / … / Ignorer » dans le cockpit recouvrement (file du jour) | `DashboardRecouvrement.tsx:127-136` | boutons **sans gestionnaire** | MORT |
| Une cible validée change-t-elle le badge du menu ? | `Sidebar.tsx:108-116` calcule le badge sur les règles brutes | non : le compteur ne baisse pas après validation | écart de cohérence |

Les cibles sont calculées en direct sur les registres (donc réelles dans la démo) et les gains (stats 30 j, h/mois) sont des constantes déclarées dans chaque règle.

---

## 4. L'offre

Trois documents décrivent l'offre et **ne concordent pas** :
- `P:` = `F:docs/prospera_pricing_distribution.md` (v4.0, juin 2026, « 10 modules · 13 rôles », 11 lignes de catalogue).
- `M:` = `F:docs/prospera_modules_ia_distribution.md` (v1.1, juin 2026, 11 modules + 10b, 13 profils).
- `B:` = `docs/prospera_modules_bundles_distributeur.md` (v1.0, juillet 2026, **18 modules**, 14 personas, 4 bundles). Le plus récent ; c'est lui qui est décrit ci-dessous. Ses prix « reprennent la grille distributeur existante… à affiner commercialement » (`B:90`).

### 4.1 Les 18 modules commerciaux et leur rattachement aux bundles

`B:26-46` (tableau 1), `B:228-248` (synthèse). Bundles : **TV** = Terrain & Ventes ; **FR** = Finance & Recouvrement ; **SL** = Stock & Logistique ; **CE** = Croissance & Équipes ; **PC** = Plateforme complète (les 18).

| # | Module | Capacités clés (B:) | IA / automatisations | Gain annoncé | Bundle |
|---|---|---|---|---|---|
| 1 | Dashboard & Pilotage | cockpits par rôle ; pilotage financier DG/DAF ; alertes du jour et décisions à trancher ; drill-down zone → produit → commercial ; export Excel/PDF | Copilot IA, synthèse narrative, prévision CA et trésorerie 30/60/90 j, priorités générées la nuit | −3 h/jour | SL (!), PC |
| 2 | CRM Points de Vente & Pipeline | fiche PDV 360°, pipeline Prospection → Fidèle → À risque, segmentation, attribution salarié/freelance, prix client freelance, carte de couverture | scoring santé PDV, churn, zones blanches, assortiment | −40 min/client | TV, PC |
| 3 | Conquête & Territoires | zones blanches, recensement, carnet de prospects, ouvertures et survie M+1/M+3, passation au secteur, garde-fous 1re commande | scoring prospects, cartographie, priorisation | prospection ciblée | CE, PC |
| 4 | Commercial Terrain & Tournées | carte GPS équipe, PJP/strike rate, itinéraire, clôture de visite, remises d'espèces et écarts de caisse, agenda | optimisation de tournées, alerte proximité, coaching, rapport du soir | +50 % de visites/jour | TV, PC |
| 5 | Application Mobile Terrain | commande hors ligne, e-facture mobile, lien de paiement PI-SPI, voice-to-CRM, photos géolocalisées, synchro | voice-to-CRM, recommandation de panier, validation de visite par géofencing | zéro papier | TV, PC |
| 6 | Prise de Commande & Catalogue | catalogue numérique, pipeline Brouillon → Livrée, contrôle de stock, prix société vs freelance, marge auto, commande WhatsApp | recommandation de panier, détection d'erreurs, priorité IA et blocage crédit | −25 min/commande | TV, PC |
| 7 | Stock & Logistique | multi-entrepôts, santé du stock, transferts suggérés, distances, suggestion de dépôt/partenaire, plans de liquidation et combos d'écoulement | prévision de demande, seuils dynamiques, moteur de transferts | −60 % de réconciliation | SL, PC |
| 8 | Opérations Entrepôt | préparation/picking, expéditions et chargement, réceptions et litiges, inventaire tournant, contrôle quai | ordre de picking, vagues, plan d'expédition | moins d'erreurs | SL, PC |
| 9 | Approvisionnement Fournisseurs | registre fournisseurs, réappro automatique, scoring explicable, regroupement franco/volume, cycle SUGGEREE → RECUE, garde-fou plancher de trésorerie → escalade DAF | quand/combien commander, choix justifié, regroupement | heures/semaine | SL, PC |
| 10 | Facturation, Proforma & E-facture | factures UEMOA, proformas et score d'acceptation, e-facture QR/certification OTR, avoirs, plafonds de crédit, balance, double flux société/freelance | scoring crédit, priorisation, prévision d'encaissement 7/30 j | −2 h/jour | FR, PC |
| 11 | Encaissements & PI-SPI | liens PI-SPI, encaissements/décaissements, réconciliation facture ↔ paiement, registre terrain, remises d'espèces | réconciliation auto, anomalies/doublons, prévision de cash | rapprochement manuel → 0 | FR, PC (TV : « lien de paiement mobile ») |
| 12 | Relances & Recouvrement | pipeline multicanal, escalade WhatsApp → SMS → visite → DG, balance âgée, tournée de recouvrement, promesses, blocage crédit | priorisation par probabilité, choix du canal, messages pré-rédigés, plan | −75 % du temps de relance | FR, PC |
| 13 | Marketing & Campagnes | dashboard campagnes/ROI, combos stock → promotions, segmentation, chatbot WhatsApp, validation DG des remises | scoring de leads, campagnes ciblées, Copilot marketing | +35 % de conversion | CE, PC |
| 14 | Studio Réseaux Sociaux | calendrier éditorial, 4 réseaux, accroches IA, inbox centralisée, planification et réponses auto, ROI incrémental | mix éditorial, suggestions de posts depuis stock et ventes | présence sociale sans y passer la journée | CE, PC |
| 15 | Automatisations | centre de règles, AUTO / À valider / Suggestion, file d'arbitrage, journal « cette nuit » | orchestration nocturne, garde-fous explicites | moins d'actions répétitives | CE, PC |
| 16 | Comptabilité & Finance | SYSCOHADA révisé, écritures auto depuis factures, lettrage et rapprochements, TVA/portail fiscal, factures d'achat, clôture, trésorerie J+7, BFR, run fournisseurs | DAF Copilot, prévision de cash, alertes budget, marge par zone/produit/commercial | −5 h/semaine | FR, PC |
| 16b | Contrôle de Gestion | budgets par axe, budget vs réel vs atterrissage, P&L analytique, forecast rolling 3 mois, envoi de rapports DG/DAF, poste exclusif `CONTROLE_GESTION` | synthèse IA des écarts, causes et actions, alertes ±3 %, pack comité | −4 h/semaine | **aucun bundle** (!) ; absent de la synthèse `B:228-248` |
| 17 | Objectifs & Quotas | quota par zone, atterrissage, mix produit/marge, arbitrages | suggestions d'allocation, écarts | pilotage plus net | CE, PC |
| 18 | Équipes & Performance | KPI individuels et classements, coaching, matrice des postes, typologie salarié/freelance, benchmarking, validations de remises | performance gap, coaching ciblé, bonnes pratiques | −2 h/semaine/superviseur | CE, PC |

Capacités transverses non vendues seules (`B:76-84`) : réseau mixte salariés/freelances (add-on), mode hors ligne (inclus Terrain/Mobile), WhatsApp natif, connecteur Odoo, garde-fous IA (plafond de crédit, plancher de trésorerie, remise maximale).

### 4.2 Les 4 bundles et la plateforme : composition et prix (FCFA, profil Grand / Moyen / Petit)

Profils (`P:14-18`) : **Grand** (type Tampico : 40-80 commerciaux, 1 500-3 000+ PDV, 3-8 Md de CA, Odoo complet), **Moyen** (SNB, Zener : 15-40 commerciaux, 400-1 200 PDV, 0,8-3 Md), **Petit** (grossistes de Lomé/Kara/Sokodé : 3-15 commerciaux, 50-400 PDV, 150-800 M). Deux modes de paiement exclusifs sur une même offre : achat unique OU abonnement (`P:6`). Maintenance année 1 offerte sur achat, maintenance dès le 13e mois ; abonnement tout inclus (`P:20-21`). Remise bundle intégrée : −15 % à l'achat, −10 % à l'abonnement (`P:57`).

| Offre | Modules (B:) | Achat unique G / M / P | Abonnement /mois G / M / P | Maint. Y2+ /mois G / M / P | ROI client / an (G) et payback (G) |
|---|---|---|---|---|---|
| **Plateforme complète** (`B:94-108`) | les 18 modules, « 13 rôles », IA, mobile, hors ligne, WhatsApp, PI-SPI, connecteur Odoo, formation, support | 53 M / 34,5 M / 21 M | 3 070 000 / 1 995 000 / 1 230 000 | 2 500 000 / 1 625 000 / 980 000 | 450-750 M, < 4 mois (`P:34-35`) |
| **Terrain & Ventes** ★ (`B:112-133`) | 4, 5, 2, 6 | 20 M / 13 M / 8 M | 1 150 000 / 750 000 / 460 000 | 920 000 / 600 000 / 370 000 | 300-550 M, 2-3 mois |
| **Finance & Recouvrement** (`B:137-158`) | 10, 11, 12, 16 | 15,7 M / 10,2 M / 6,3 M | 900 000 / 585 000 / 360 000 | 720 000 / 470 000 / 290 000 | 120-265 M, 2-4 mois |
| **Stock & Logistique** (`B:162-183`) | 7, 8, 9, 1 | 10,6 M / 6,9 M / 4,2 M | 610 000 / 400 000 / 245 000 | 490 000 / 320 000 / 195 000 | 65-115 M, 3-5 mois |
| **Croissance & Équipes** (`B:187-210`) | 3, 13, 14, 15, 17, 18 | 11 M / 7,15 M / 4,4 M | 630 000 / 410 000 / 250 000 | 505 000 / 330 000 / 200 000 | 90-170 M, 3-5 mois |

### 4.3 Add-on Réseau Freelance (`B:214-222`, `P:41-51`)

Double tarification (prix société vs prix client), portefeuilles isolés, créances séparées, classements séparés. Prix G / M / P : achat 5 M / 3,25 M / 2 M ; abonnement 280 000 / 180 000 / 110 000 F/mois ; **par freelance actif** : +150 000 / +100 000 / +60 000 F à l'achat, +25 000 / +16 000 / +10 000 F/mois en abonnement. Exemple `P:51` : 12 freelances en abonnement Grand = 280 K + 12 × 25 K = 580 000 F/mois. Spécification fonctionnelle : `M:28-41` (grille société non modifiable, grille freelance, portefeuille isolé, vue société sans marges freelance, commande double flux, commissions et reversements, plafond de crédit séparé). Rôle correspondant : `FREELANCE`.

### 4.4 Autres éléments tarifaires (`P:`)

- Catalogue à la carte (profil Grand, Moyen ×0,65, Petit ×0,40, `P:180-196`) : Terrain & Tournées 10 M / 550 K ; CRM PDV 7 M / 380 K ; Commande & Catalogue 6,5 M / 350 K ; Stock & Logistique 7,5 M / 400 K ; Facturation & Créances 5,5 M / 300 K ; Relances & Recouvrement 7 M / 380 K ; Marketing & Prospection 4,5 M / 250 K ; Comptabilité & DAF Copilot 6 M / 320 K ; Dashboard & Pilotage 5 M / 280 K ; Équipes & Performance 3,5 M / 200 K ; Réseau Freelance 5 M / 280 K (achat / abonnement mensuel). `B:278` prévoit encore « ajouter une grille module à la carte ».
- Offre pilote (`P:200-215`) : 1 bundle en abonnement pendant 3 mois minimum ; Grand → Terrain 1 150 000 F/mois, Moyen → Terrain 750 000, Petit → « module Terrain seul » 550 000 ; crédit de conversion 70 % des mensualités déduit du prix d'achat ; connecteur Odoo standard inclus ; fractionnement de l'achat 40 % signature / 40 % livraison / 20 % recette, plafond pratique 12 M par tranche. `B:107` parle de « 2 mois gratuits » de phase de test : autre règle.
- Scénario « IA à 95 % de précision » (`P:219-242`) : ROI plateforme 620-980 M/an (vs 450-750 M) ; achat Grand 72 M / Moyen 46,8 M / Petit 28,5 M, Terrain 27 / 17,5 / 10,8 M, Finance 21 / 13,65 / 8,4 M ; abonnement +25 % (plateforme) ou +20 % (bundles) ; maintenance +35 % ; appliqué au renouvellement annuel après rapport d'impact trimestriel.
- Combinaisons recommandées : Grand = Terrain + Finance (+ Freelance) soit 40,7 M à l'achat ou 2 330 000 F/mois (`P:148`) ; Moyen = Terrain + Finance, 23,2 M ou 1 335 000 F/mois (`P:162`) ; Petit = Terrain en abonnement, 460 000 F/mois (`P:176`).
- Positionnement (`P:6`) : les distributeurs ont déjà un ERP/CRM (souvent Odoo) ; Prospera est un **module IA add-on**, pas un remplacement. Comparaison avec la microfinance en `P:246-255` (le document prix de l'IMF a la même structure).

### 4.5 Écarts et incohérences de l'offre (à arbitrer avec le PO)

1. **10 modules vs 18 modules au même prix.** 53 M (Grand) couvre « 10 modules » dans `P:27,37` et « 18 modules » dans `B:98`. Contrôle : la somme des 10 modules du catalogue `P:184-196` (hors Freelance) vaut 62,5 M ; 62,5 × 0,85 = 53,1 M : le prix de la plateforme est bien celui des 10 modules.
2. **Les bundles ont grossi sans changer de prix.** `P:` : Terrain = 3 modules (23,5 M × 0,85 = 19,98 M ≈ 20 M, cohérent) ; Finance = 3 (18,5 × 0,85 = 15,7 M, cohérent) ; Stock = 2 (12,5 × 0,85 = 10,6 M, cohérent) ; Croissance = 2 (8 M, prix annoncé 11 M, **déjà incohérent**). `B:` ajoute au même prix : Mobile (TV), Encaissements & PI-SPI (FR), Opérations Entrepôt et Approvisionnement (SL), Conquête, Studio Social, Automatisations, Objectifs (CE).
3. **Somme des bundles > plateforme** : 20 + 15,7 + 10,6 + 11 = 57,3 M contre 53 M (Grand) ; l'incitation à acheter les 4 séparément est négative alors que la plateforme est censée être la remise maximale.
4. **Module 16b Contrôle de gestion sans bundle** et absent de la table de synthèse `B:228-248`, mais le rôle `CONTROLE_GESTION` existe dans le code. Le « 13 rôles » de `B:98` et `P:27` contredit les « 14 personas » de `B:14`.
5. **Rôles × modules `B:254-269`** : 12 lignes pour 14 personas (le CdG est absent ; DG/DC/Marketing/Recouvrement sont dits utiliser « Automatisations » ou « Studio social » alors que le code les autorise différemment).
6. **Pilote Petit** : « module Terrain seul 550 000 F/mois » (prix Grand du module, `P:186`) est plus cher que le bundle Terrain Petit à 460 000 F/mois (`P:208`).
7. **Désaccord de découpage déjà noté** : `B:276` demande de décider si Mobile, Studio Social, Entrepôt et Approvisionnement restent des lignes distinctes ou deviennent des sous-modules.

### 4.6 Correspondance module commercial ↔ écrans de la démo

(écrans de `F:src/app/(dashboard)/` et composants ; « 0 » = aucune occurrence dans `F:src`)

| # | Module | Écrans / composants de la démo | Couverture |
|---|---|---|---|
| 1 | Dashboard & Pilotage | `/dashboard` (15 cockpits, `DashboardByRole.tsx`), `/pilotage-financier` (`ComptabiliteDGView`, DAF : `PilotageDAFView`), `RapportIAGlobal`, `SyntheseDecisionDGPanel`, `ZonePilotageDGPanel`, `CarteZonesDG`, export CSV/PDF | forte ; Copilot IA conversationnel : 0 ; prévision 30/60/90 j : 3 mois de prévision CA seulement |
| 2 | CRM Points de Vente | `/points-de-vente`, `/points-de-vente/[id]` (`PdvRapportView`) | forte |
| 3 | Conquête & Territoires | `/prospection` + `DashboardProspection` | forte |
| 4 | Commercial Terrain & Tournées | `/commercial` (carte GPS, coaching), `/tournees` (PJP, strike rate, caisse), `/mon-activite` (agenda, clôture de visite `ClotureVisiteModal`) | forte |
| 5 | Application Mobile Terrain | pas d'app : écrans web `MonActiviteView`, `DisponibiliteView`, `PanierDrawer` ; voice-to-CRM : 0 ; PI-SPI : 0 | partielle |
| 6 | Prise de Commande & Catalogue | `/commandes` (`CommandesView`, 3 branches pilotage / terrain / freelance), `/disponibilite`, `/catalogue` (redirige vers `/stock?tab=catalogue`) | forte |
| 7 | Stock & Logistique | `/stock` (3 onglets : stock, sorties, catalogue), transferts et liquidation (`transferts-engine`, `liquidation-engine`) | forte |
| 8 | Opérations Entrepôt | `/entrepot` (picking, vagues, expéditions, réceptions, inventaire : `picking-engine`, `expedition-engine`, `reception-engine`, `inventaire-engine`) | forte |
| 9 | Approvisionnement | `/approvisionnement` (4 onglets : Réappro IA, commandes fournisseurs, fournisseurs, règles), `reappro-engine`, `garde-fou-achat` | forte |
| 10 | Facturation, Proforma & E-facture | `/facturation` (3 onglets : factures et créances, proformas, e-facturation et avoirs) | forte |
| 11 | Encaissements & PI-SPI | pas d'écran dédié ; encaissements dans `/facturation`, `/tournees`, `ClotureVisiteModal` ; PI-SPI : 0 occurrence | faible |
| 12 | Relances & Recouvrement | `/relances`, `DashboardRecouvrement`, `recouvrement-builder`, blocage de crédit avec trace | forte |
| 13 | Marketing & Campagnes | `/marketing`, `CombosStockPanel`, `PromotionsFournisseursPanel` ; chatbot WhatsApp : seulement comme canal de règle et de campagne | forte (lecture), faible (action) |
| 14 | Studio Réseaux Sociaux | `/marketing/social` | forte (simulée) |
| 15 | Automatisations | `/automatisations`, « cette nuit » dans 3 cockpits | forte (simulée) |
| 16 | Comptabilité & Finance | `/comptabilite` (`ComptabiliteView`, `ComptabiliteComptableView`), `/pilotage-financier` ; TVA/portail fiscal : non vérifié | forte |
| 16b | Contrôle de Gestion | `/controle-gestion` (`ControleGestionView`, 6 onglets), `RapportsCdgInbox` chez DG/DAF | forte |
| 17 | Objectifs & Quotas | `/objectifs` | forte |
| 18 | Équipes & Performance | `/equipe` (`EquipeView`, `MatricePostesPanel`) | forte |
| — | Add-on Freelance | rôle `FREELANCE`, `DashboardFreelance`, marge freelance masquée à la société | forte |
| — | Connecteur Odoo | aucun écran, 0 occurrence | nulle |

Pour le moteur d'installation (modules installables) : le rattachement module ↔ routes se déduit de ce tableau ; `ROUTE_ACCESS` est la table à éclater par module.

---

## 5. Les modules IA de la distribution

Source : `F:docs/prospera_modules_ia_distribution.md` (v1.1, juin 2026), tableau 1 `:47-60`, processus `:64-79`, ROI `:83-100`. Ce document a **11 modules + 10b** (numérotation différente de `B:` : par ex. « Encaissements & Mobile Money » est le 7 ici, le 11 dans `B:`). Complété par `F:docs/RESUME_OUTIL_DE_PILOTAGE_DISTRIBUTEUR.md` et `B:` (colonne « IA »). Le support est un **ensemble de fonctions d'IA** par module, pas un module distinct ; ci-dessous la liste consolidée avec ce qu'elles promettent et les données qu'elles exigent (colonne « données » : déduction de l'analyste, non écrite dans les sources).

| Module (M:) | IA promises | Ce que ça promet (gain annoncé) | Données nécessaires |
|---|---|---|---|
| 1 Dashboard & Pilotage | Copilot IA (questions en langage naturel par rôle) ; alertes IA ; prévision CA 30/60/90 j par zone et produit ; synthèse IA direction quotidienne | −3 h/jour/manager ; économie 4 h/semaine de consolidation (rapport) | ventes, créances, stock, tournées, trésorerie, historique mensuel ≥ 12 mois |
| 2 CRM PDV | scoring PDV 0-100 ; détection de churn ; cartographie des zones blanches ; recommandation de produits ; alerte client à risque ; suggestion de marge optimale (freelance) | −40 min/client | historique commandes, livraisons, paiements, GPS, créances, inactivité |
| 3 Terrain & Tournées | optimisation de tournées ; coaching IA ; alerte de proximité ; rapport du soir ; zone map | +50 % de visites/jour | positions GPS, visites validées, objectifs, carte routière, coordonnées des PDV |
| 4 Commande & Catalogue | recommandation de panier ; prédiction de réappro (client) ; détection d'erreurs de commande ; tendances produits ; alerte marge faible | −25 min/commande, zéro commande perdue | historique de commandes par PDV, catalogue, prix société/freelance, stock |
| 5 Stock & Logistique | prévision de demande par produit et zone ; seuils dynamiques ; ordre de picking ; rotation SKU lents/rapides | −60 % de réconciliation | sorties, stocks par entrepôt, délais fournisseurs, saisonnalité |
| 6 Facturation & Créances | scoring crédit client et freelance (plafond recommandé) ; priorisation des créances ; prévision d'encaissement 7/30 j ; anomalies de facturation | −2 h/jour ; 30-50 % d'impayés en moins (sections 8) | factures, paiements, échéances, historique de retard, plafonds |
| 7 Encaissements & MoMo | validation IA des paiements mobiles ; réconciliation automatique ; détection de fraude espèces ; prévision de trésorerie 7 j | zéro réconciliation manuelle | relevés Mobile Money / banque, remises d'espèces, factures |
| 8 Relances & Recouvrement | priorisation par probabilité de paiement ; choix du canal ; messages pré-rédigés ; plan de recouvrement | −75 % du temps de relance | dossiers d'impayés, historique de réponse par canal, promesses, comportement de paiement |
| 9 Marketing & Prospection | scoring de prospects ; segmentation comportementale ; campagnes (ciblage, timing) ; Copilot marketing ; cartographie de prospection | +35 % de conversion de leads | leads, campagnes, réponses, segments, stocks (combos), exclusions de crédit |
| 10 Comptabilité & Finance | DAF Copilot ; prévision de cash ; analyse de marge par produit, zone, commercial | −5 h/semaine | écritures, trésorerie, budgets, marge par axe |
| 10b Contrôle de Gestion | synthèse IA des écarts ; alertes bande ±3 % ; causes et actions suggérées ; pack comité | −4 h/semaine | budgets, réel, atterrissage, P&L analytique |
| 11 Équipes & Performance | écart de performance ; coaching IA ; benchmarking des bonnes pratiques ; prévision de CA par commercial ; recommandation de prix client (freelance) | −2 h/semaine/superviseur | KPI individuels, objectifs, classements, typologie salarié/freelance |
| Hors tableau M: (dans `B:`/résumé) | réappro et scoring fournisseur explicable ; regroupement franco/volume ; combos de stock ; score d'acceptation des proformas ; accroches IA des posts ; classification des messages sociaux | non chiffré | registre fournisseurs et délais, stock lent, proformas, historique social |

ROI global annoncé (`M:85-116`) : ≈ 18 600 h/an et 760-1 290 M FCFA/an pour un distributeur de référence à 5 Md de CA, 40 commerciaux (30 % freelances), 2 000 PDV, 8 000 commandes/mois, 3 entrepôts, 8 % d'impayés initiaux, coût horaire cadre 3 000 F. « Estimations indicatives… un audit de démarrage permet d'affiner ». Niveaux de confiance de l'IA (§3.3), précision actuelle 70-80 %, cible 95 % (`P:225-231`).

Garde-fous annoncés comme non négociables (`RESUME…md` §3, `B:84`) : plafond de crédit client, plancher de trésorerie avant tout envoi de commande fournisseur automatique (sinon escalade au DAF), remise maximale. « Une IA qui décide de tout est une IA qu'on débranche au premier incident. »

Écart démo / promesse : dans le code, 0 appel à un modèle ; les fonctions « IA » sont des calculs déterministes (scores, seuils) et des gabarits de texte. Aucune évaluation de précision, aucun rapport d'impact trimestriel, aucune boucle de retour (une cible ignorée ne recalibre rien). Le PRD doit trancher la nature du moteur (règles + statistiques, modèle externe) et la gouvernance (journal, réversibilité : le journal de stock porte déjà `reversible` et `delegue_par`, `automation-journal.ts:35-55`).

---

## 6. Ce qui serait commun avec une IMF, et le vocabulaire qui changerait

Éléments **génériques** (à porter dans le socle de la coque, indépendamment du métier) :
- **Rôle → cockpit → KPI de poste** : une table de rôles, un composant cockpit par rôle, un registre `PerformancePoste` {KPI valeur/objectif/tendance/poids, score /100, points forts, axes de progrès}, une matrice des postes pour la direction. Aucune dépendance au métier : seul le registre de KPI change.
- **Table d'accès unique par route** (`ROUTE_ACCESS`) projetée dans le menu et le garde d'URL ; libellés d'écran par rôle ; composant différent par rôle sur la même route ; filtrage de données par portefeuille (`commercial === user.nom`), par zone, par site.
- **Bandeau de décision** (8 chiffres en 3 familles avec statut SAIN/ATTENTION/CRITIQUE, variation `invert`, bouton d'action), **alertes du jour**, **décisions à trancher** et **journal des décisions** (qui, quand, choix, réversible), **rapport de direction IA** (structure §2.4), exports CSV/PDF.
- **Moteur d'automatisation** : règle {déclencheur, action, canal, mode AUTO/VALIDATION/SUGGESTION, garde-fous, quota, cibles calculées en direct avec message prêt, stats 30 j, gain de temps}, file d'arbitrage, garde-fou transverse d'exclusion, « journal de la nuit », activation/désactivation d'une règle, validation/ignorance d'une cible, badge de travail en attente dans le menu.
- **Marketing et canaux** : campagnes (entonnoir cibles → convertis, ROI, budget), leads et segments, zones blanches, studio de contenu avec rythmes datés, inbox unique avec SLA par intention et réponses automatiques sous garde-fou, ROI incrémental (CA attribué ≠ CA créé). Pour une IMF : campagnes d'épargne et de crédit, prospection de villages et de groupes, WhatsApp, Facebook.
- **Équipes** : classement, coaching, objectifs/quotas par zone et atterrissage, validations hiérarchiques (remise ↔ dérogation de crédit), typologie salarié/agent indépendant.
- **Recouvrement** : file du jour priorisée par valeur espérée (montant × probabilité), escalade J+1 / J+7 / J+15 / J+30, promesses de paiement, blocage de crédit avec trace, prévision d'encaissement.
- **Packaging commercial** : modules à la carte, bundles, plateforme complète, trois profils de taille, achat ou abonnement exclusifs, pilote de 3 mois avec crédit de conversion, majoration « IA 95 % » ; `P:246-255` aligne déjà la structure sur la microfinance (« structure identique »).

Vocabulaire qui change (distribution → IMF) :

| Distribution | IMF |
|---|---|
| Distributeur / grossiste, détaillant, point de vente (PDV), client B2B | Institution de microfinance, membre / client, groupe solidaire, agence, guichet |
| Commercial terrain, freelance, chargé de prospection, superviseur de zone, responsable des ventes | Agent de crédit / conseiller, agent indépendant (démarcheur), chargé de collecte, chef d'agence, responsable de zone |
| Commande, proforma, facture, e-facture | Demande de prêt, simulation / offre de prêt, échéancier, contrat, avis d'opération |
| Créance, impayé, encours client, DSO, balance âgée, plafond de crédit | Portefeuille à risque (PAR 30/90), crédit en souffrance, encours de prêts, plafond d'octroi |
| Recouvrement, relance, mise en demeure, blocage de crédit | Recouvrement, relance de remboursement, restructuration / rééchelonnement, passage en contentieux, suspension de décaissement |
| Stock, entrepôt, picking, réappro, fournisseur, franco, rotation | n'existent pas ; remplacés par liquidité, trésorerie d'agence, caisse, refinancement |
| CA, marge brute, panier moyen | Encours, produit net bancaire, marge d'intérêt, montant moyen des prêts |
| Tournée, PJP, strike rate, visite, clôture de visite | Tournée de collecte, visite de client, rendez-vous d'octroi, suivi de groupe |
| Zones blanches, couverture, survie des ouvertures M+1/M+3 | Zones non couvertes, taux de rétention des nouveaux membres, cohorte de clients actifs |
| Combos de stock, promo, campagne d'écoulement | Campagne de produit (épargne, crédit), offre de renouvellement de prêt |
| Garde-fous : plafond de crédit, plancher de trésorerie, remise max | Garde-fous : plafond d'octroi, ratios prudentiels, taux d'usure |
| Mobile Money / PI-SPI pour les encaissements | Remboursement par Mobile Money / PI-SPI (déjà en commun) ; dépôts et retraits |
| Comptabilité SYSCOHADA, e-facture OTR | Référentiel comptable des SFD (PCB UMOA), états réglementaires BCEAO |

Points sans équivalent direct à trancher dans le PRD : le rôle `FREELANCE` et la double tarification (spécifique à la distribution ; chez une IMF, l'équivalent serait l'agent indépendant rémunéré à la commission) ; le couple stock/entrepôt/fournisseurs (module entier à ne pas porter) ; la marge freelance masquée à la société (règle de visibilité par rôle à généraliser en « donnée visible seulement du propriétaire et de la direction »).

---

## 7. Questions ouvertes pour le PRD

1. Définir le rôle administrateur (§1.4) et son périmètre ; décider si le CdG doit apparaître dans « Plateforme complète » et dans un bundle.
2. Trancher l'offre : 10 ou 18 modules sous le prix de 53 M, composition des bundles, prix de la plateforme vs somme des bundles (§4.5).
3. Décider quels éléments « SIMULÉ / MORT » deviennent des exigences réelles pour la première version (publication réelle sur les réseaux, envoi réel des relances, boutons « Lancer » des cockpits, création réelle du lead depuis l'inbox, effet comptable de la décision « valider la provision »).
4. Fixer un modèle d'objet unique pour alertes et décisions (§2.2-2.3), au lieu de textes en dur par écran.
5. Aligner la documentation produit (matrices d'accès des fiches persona et de la spec V2, périmées) sur `ROUTE_ACCESS`, qui devient la source de vérité.
6. Dissocier ce qui est promis et absent de la démo : Copilot conversationnel, PI-SPI, connecteur Odoo, voice-to-CRM, application mobile hors ligne dédiée.
