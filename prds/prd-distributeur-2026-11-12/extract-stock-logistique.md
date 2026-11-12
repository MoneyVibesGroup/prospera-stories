# Extrait PRD — Stock, logistique, commandes, approvisionnement (front de démo `prospera-distributeur`)

Source : `C:/Users/thier/Documents/prospera-font-end/prospera-distributeur` (Next.js, aucun backend, données mockées, état local). Date de lecture : 2026-11-12. Aucun fichier source modifié.

Convention : les chemins sont relatifs à `src/` (ex. `lib/reappro-engine.ts:49`). États des actions : **MORT** (pas d'effet), **SIMULÉ** (effet local : journal localStorage ou état React, rien n'écrit dans un registre), **BRANCHÉ** (circuit qui change l'état d'un autre écran de bout en bout, toujours en local), **LECTURE** (affichage seul, aucune action prévue).

Rappel structurant : toutes les « données » viennent de registres statiques (`lib/registries/*.ts`) ou de générateurs à graine fixe (`lib/generators/mock-seed.ts`). La date du jour est figée à `2026-06-11` (`lib/reappro-engine.ts:25`). Aucun calcul ne modifie un registre : ni le stock, ni les commandes, ni la dette. Le « réel » du front est le **moteur de règles** (`lib/*-engine.ts`), qui est la partie la plus réutilisable pour le PRD.

---

## 0. Accès, rôles, périmètre

- Table d'accès unique : `lib/route-access.ts:11-45`, lue par le menu et par le garde d'URL (`app/(dashboard)/layout.tsx:7,14`).
  - `/commandes` : DG, DC, RESP_VENTES, SUPERVISEUR, COMMERCIAL, FREELANCE, PROSPECTION, RESP_STOCK (`route-access.ts:17`). **GEST_ENTREPOT n'y a pas accès** (commentaire `:14-16` : il reçoit des bons de préparation, pas le carnet). La fiche `docs/personas/gest-entrepot.md` dit l'inverse : elle est périmée sur ce point.
  - `/stock` : DG, DC, RESP_VENTES, SUPERVISEUR, RESP_STOCK, GEST_ENTREPOT, DAF, COMPTABLE, CONTROLE_GESTION, MARKETING (`:18`). Le libellé du menu change pour MARKETING (« Produits à écouler ») et GEST_ENTREPOT (« Stock de mon site ») (`components/layout/Sidebar.tsx:55-56`).
  - `/catalogue` : DG, DC, RESP_VENTES, SUPERVISEUR, RESP_STOCK, DAF, COMPTABLE, CONTROLE_GESTION, MARKETING (`:19`). La page est une **simple redirection** vers `/stock?tab=catalogue` (`app/(dashboard)/catalogue/page.tsx:1-5`) ; le menu surligne « Stock » sur `/catalogue` (`Sidebar.tsx:183`).
  - `/entrepot` : DG, RESP_STOCK, GEST_ENTREPOT (`:22`).
  - `/approvisionnement` : DG, RESP_STOCK, DAF, COMPTABLE (`:27`). Le gestionnaire d'entrepôt **n'y a pas accès** (commentaire `:25-26`) ; il voit les livraisons attendues dans `/entrepot > Réceptions`.
  - `/disponibilite` (hors périmètre mais lié aux commandes terrain) : COMMERCIAL, FREELANCE, PROSPECTION (`:23`).
- Périmètre logistique `lib/perimetre-logistique.ts` : trois niveaux `RESEAU | ENTREPOT | AUCUN` (`:23`) et quatre droits par poste (`:25-42`) :
  | Poste | Niveau | voitValeurAchat | voitValeurCommerciale | peutEngager | peutParametrerReappro |
  |---|---|---|---|---|---|
  | DG | RESEAU (2 entrepôts) | oui | oui | oui | oui (`:71`) |
  | DC, DAF | RESEAU | oui | oui | oui | non |
  | RESP_STOCK | RESEAU | oui | **non** (la marge n'est pas son levier, `:82`) | oui | oui (`:85`) |
  | GEST_ENTREPOT | ENTREPOT (le sien, défaut « Lomé Port », `:53-55`) | non | non | **non** (`:99`) | non |
  | autres | AUCUN | non | non | non | non |
  Ces droits pilotent l'affichage (onglets Transferts/Automatisation réservés à `peutEngager`, onglet Santé à `voitValeurAchat` : `components/stock/StockLogistiqueView.tsx:47-52`), mais **aucune action n'est bloquée côté clic** : par exemple « Valider la commande » reste actif quel que soit le rôle ou le montant (voir §5.3 et §5.4).
- Entrepôts : « Lomé Port » (3 200 m², 1 450 emplacements, 4 quais, cutoff 15:30) et « Kara » (900 m², 380 emplacements, 1 quai, cutoff 14:00) : `lib/registries/entrepot-logistique-registry.ts:43-72`.

---

## 1. Catalogue (`/catalogue` → onglet « Catalogue produits » de `/stock`)

### 1.1 Ce que montre l'écran
`components/catalogue/CatalogueView.tsx` (« Pilotage catalogue & assortiment », vue DG) :
- 7 KPI : CA catalogue/mois, marge moyenne, ruptures actives, SKU sous tension, fort engouement, ruptures/3m, PDV en rupture (`:157-167`, agrégats `lib/catalogue-dg-builder.ts:buildSyntheseCatalogueDG`, ~`:178`).
- 3 classements (top engouement, plus de ruptures sur 3 mois, « coût sans rentabilité ») ; filtres : vue (`consolide | lome-port | kara | reseau-pdv`, `catalogue-dg-builder.ts:8`), catégorie, rentabilité ; fiche produit dépliable (CA/mois, coût de revient, marge, rotation, stock immobilisé, ruptures 3m, PDV en rupture, stock par entrepôt, réseau PDV) (`CatalogueView.tsx:120-333`).
- Panneau « Analyses IA assortiment » : 4 messages **rédigés en dur** pour quelques SKU (huile 5L, café, détergent) (`catalogue-dg-builder.ts:186-232`).
- Rôles : tous ceux de `/catalogue`. Aucune restriction de contenu par poste dans cette vue (marge visible de tous, y compris RESP_STOCK, alors que `voitValeurCommerciale = false` le lui interdit ailleurs : incohérence à trancher au PRD).

### 1.2 Objets et champs
- `ProduitStock` (`types/index.ts:86-99`) : `id`, `reference` (ex. `PRD-EAU-1.5L`), `nom` (le conditionnement est dans le nom : « pack 12 », « carton 48 »), `categorie` (`Boissons | Alimentaire | Hygiène | Entretien`), `stock`, `seuil`, `prix_unitaire` (un seul prix, en FCFA), `entrepot` (un seul entrepôt de rattachement), `fournisseur_principal_id?`, `ventes_30j?`. 30 références saines + 4 références « stock mort » (`lib/registries/stock-registry.ts:4-52`).
- `ProduitCatalogueDG` (`catalogue-dg-builder.ts:25-47`) : produit + `stocks_entrepot[]` (`entrepot`, `quantite`, `seuil`, `rupture`), `reseau_pdv` (magasins approvisionnés, stock moyen, magasins en rupture, demande/mois), `sorties_mois`, `ca_mois`, `cout_revient`, `marge_pct`, `rentabilite`, `ruptures_3m`, `jours_rupture_3m`, `evolution_demande_pct`, `engouement`, `rotation_jours`, `valeur_stock_immobilisee`, `synthese_ia`, `alerte?`.
- Énumérations : `RentabiliteProduit = FORTE | CORRECTE | TENSION | DEFICITAIRE` ; `EngouementProduit = FORT | STABLE | FAIBLE | EN_CHUTE` (`:9-10`).
- **Prix** : il n'existe qu'un `prix_unitaire` par produit, présenté tantôt comme « prix société » (`DisponibiliteView`, colonne « Prix société »), tantôt comme « Votre coût » pour le freelance (`components/terrain/DisponibiliteView.tsx:86-90,142`). Il n'y a **aucun objet « grille de prix »**, ni palier, ni remise, ni prix freelance, ni prix par segment client. `FicheLogistique.cout_achat` (`entrepot-logistique-registry.ts:96`) porte le coût d'achat, réservé aux postes `voitValeurAchat`.
- **Lot / DLC** : pas d'objet « lot ». Seule la `FicheLogistique.dlc_jours` (durée de vie restante moyenne du lot, `null` = non périssable) existe (`:98`). Aucune traçabilité par numéro de lot.
- `FicheLogistique` (`:82-99`) : `produit_ref`, `entrepot`, `emplacement` (« B-07-2 »), `allee`, `poids_kg`, `volume_m3`, `unites_par_palette`, `cout_achat`, `dlc_jours`, `fragile`, `froid` ; gabarits par catégorie `:108-113` (Boissons 12,5 kg / 84 par palette ; Alimentaire 9 kg / 60 ; Hygiène 5,5 / 72 ; Entretien 7,5 / 66).
- `ProfilProduit` (élasticité prix, reprise fournisseur %, saison, fin de vie) : `lib/registries/profil-produit-registry.ts` (utilisé par liquidation et garde-fou).

### 1.3 Actions
Aucune action d'écriture. Seuls des filtres (`setVue`, `setCategorie`, `setFiltreRentabilite`, sélection de fiche : `CatalogueView.tsx:213-249`). **LECTURE.** Pas de création/édition d'article, pas d'import, pas de sortie du catalogue (le texte recommande « sortie catalogue » pour le café mais rien ne l'exécute).

### 1.4 Règles de calcul (telles que codées)
- Les métriques des 12 premiers SKU sont **saisies en dur** (`catalogue-dg-builder.ts:METRIQUES`, `:57-70`) ; les autres sont générées (`defaultMetriques`, `:119-154`) :
  - `FORTE` si marge ≥ 14 % et pas de rupture ; sinon `TENSION` si rupture et ruptures_3m ≥ 3 ; sinon `DEFICITAIRE` si marge < 10 % ou rotation > 28 j ; sinon `TENSION` si rupture ou marge < 11 % ; sinon `CORRECTE` (`:130-133`).
  - `engouement` : `FORT` si évolution demande ≥ +10 % ; `EN_CHUTE` si ≤ −15 % ; `FAIBLE` si ≤ −5 % ; sinon `STABLE` (`:135-139`).
  - `valeur_stock_immobilisee = stock × prix_unitaire` (valorisation **au prix de vente**, pas au coût) (`:156-170`).
- `rupture` d'un site = `quantite < seuil` (`catalogue-dg-builder.ts:STOCK_ENTREPOT_SPLIT` en dur).

---

## 2. Commandes (`/commandes`)

### 2.1 Ce que montre l'écran
`components/commandes/CommandesView.tsx` : **trois écrans selon le rôle** (`:104-105`).
1. **FREELANCE** (`:129-147`) : « Mes commandes grossiste », bandeau « Vous commandez au tarif grossiste (paniers 2-4 M FCFA). Le prix client est le vôtre — marge non visible par la société. » + liste de cartes `CommandeCardDG`. Aucune action.
2. **Non-pilotage** (COMMERCIAL, PROSPECTION ; `ROLES_PILOTAGE = DG, DC, DAF, RESP_VENTES, SUPERVISEUR, RESP_STOCK, GEST_ENTREPOT`, `:46`) : « Prise de commande terrain » (`:149-206`) : commandes terrain transmises (liste locale), cartes de commandes du périmètre, bouton « Nouvelle commande terrain » (`:186-195`) qui ouvre le panier.
3. **Pilotage** (`:208-436`) : 8 KPI (volume jour, panier moyen, marge brute moyenne, en préparation, priorité IA, bloquées crédit, magasins enseigne, lignes totales), pipeline cliquable par statut (`BROUILLON → VALIDEE → PREPARATION → LIVREE`, ANNULEE absent du pipeline), barre de répartition de volume, flux par entrepôt (commandes, en préparation, bloquées, taux de service, charge picking), répartition par type client, « file prioritaire entrepôt » (6 commandes), filtres par zone, panneau « Analyses IA commandes », liste triée par montant décroissant.

### 2.2 Objets et champs
- `CommandeStatut = BROUILLON | VALIDEE | PREPARATION | LIVREE | ANNULEE` (`types/index.ts:25-30`).
- `Commande` (`types/index.ts:63-84`) : `id`, `reference` (`CMD-2026-4521`), `pdv_id`, `pdv_nom`, `commercial`, `type_commercial` (`SALARIE | FREELANCE`), `montant_societe`, `montant_client?`, `marge_freelance?`, `statut`, `date`, `lignes` (**un nombre entier, pas le détail**), `zone`, `entrepot`, `type_magasin` (`PROPRE | PARTENAIRE`), `type_client` (`DEPOT | GROSSISTE | SUPERETTE | ENSEIGNE | EPICERIE | KIOSQUE`), `marge_brute_pct`, `familles[]`, `priorite_ia` (`HAUTE | NORMALE | BLOQUEE`), `alerte?`.
  - **Pas de ligne de commande typée** : le détail des lignes est « reconstitué » de façon déterministe pour l'entrepôt à partir des familles (`lib/picking-engine.ts:149-174`, commentaire `:140-148`). Le PRD doit créer l'objet `LigneCommande` (produit, quantité, prix unitaire société, prix client, remise, réservé, servi).
  - Pas de champ « date de livraison souhaitée », « adresse de livraison », « mode de paiement », « BL lié », « facture liée », « motif d'annulation ».
- `CommandeTerrain` (`lib/terrain-workflow.ts:40-49`) : `id`, `pdv_nom` (**texte libre**, saisi à la main dans le panier, pas de lien vers `PointDeVente`), `createdAt`, `createdBy`, `canal` (`CanalCommande = TERRAIN | WHATSAPP | TELEPHONE`, `:38`), `lignes: PanierLigne[]` (`reference`, `nom`, `prix`, `quantite`, `:31-36`), `montant_total`, `statut` (`BROUILLON | TRANSMISE`).
  - **Deux modèles de commande coexistent et ne se parlent pas** : `Commande` (registre, lecture seule) et `CommandeTerrain` (localStorage `prospera-terrain-commandes`, `terrain-workflow.ts:17`). Une commande terrain « transmise » n'entre ni dans le pipeline, ni dans le carnet de l'entrepôt, ni dans la facturation.
- Bon de livraison : **aucun type `BonLivraison`**. Trois approximations :
  - `BonPreparation` (document interne de picking, `lib/picking-engine.ts:77-100`) ;
  - `SortieEntrepot` avec `bl_reference` et `commande_reference` (historique de sorties généré, `lib/sorties-entrepot-builder.ts:36-53`, statut `LIVRE | EN_ROUTE | PREPARATION | RETARD`) ;
  - `ExpeditionDG` avec `bl_numero` (`lib/dg-pilotage-detail-builder.ts:72-77`, données en dur). Aucune génération, impression ni signature de BL.

### 2.3 Actions
| Libellé | Effet attendu | État | Où |
|---|---|---|---|
| Clic sur une tuile du pipeline (Brouillon/Validée/…) | filtrer la liste | LECTURE (état React) | `CommandesView.tsx:244-256` |
| Filtre par zone | filtrer | LECTURE | `:378-382` |
| « Tout afficher » | réinitialiser les filtres | LECTURE | `:410` |
| « Nouvelle commande terrain » | ouvrir le panier | BRANCHÉ côté UI | `:186-195` |
| Panier : `−` / `+` / corbeille / « Vider » | modifier le panier | SIMULÉ (persisté localStorage) | `components/terrain/PanierDrawer.tsx:71-92,129-135` |
| Canal « En visite / WhatsApp / Téléphone » | choisir `CanalCommande` | SIMULÉ | `PanierDrawer.tsx:15-19,110-123` |
| « Transmettre la commande » | créer la commande, vider le panier, toast | SIMULÉ : crée une `CommandeTerrain` `statut=TRANSMISE` en localStorage, **sans vérification de stock, sans calcul de marge, sans message WhatsApp envoyé** | `PanierDrawer.tsx:31-36,136-143` ; `contexts/TerrainWorkflowContext.tsx:124-137` ; `terrain-workflow.ts:95-111` |
| « Ajouter » (depuis Disponibilité) | ajouter une ligne au panier | SIMULÉ ; désactivé si `RUPTURE` | `components/terrain/DisponibiliteView.tsx:169-170` |
| (absent) valider une commande brouillon, la passer en préparation, annuler, éditer | : | **N'EXISTE PAS** (le statut n'est jamais modifié par l'UI) | : |
| (absent) générer un BL, imprimer, signer | : | **N'EXISTE PAS** | : |
| (absent) vérifier le stock avant validation | : | **N'EXISTE PAS** (seul `dispoDe` à l'ajout au panier, voir règles) | : |

L'audit `docs/AUDIT_PERSONAS_AMELIORATIONS.md:36-42` classait « Nouvelle commande terrain » et « Ajouter » en MORT ; ils sont depuis devenus SIMULÉS (workflow terrain `terrain-workflow.ts:1-11`).

### 2.4 Règles de calcul
- **Cycle de vie** : seuls `BROUILLON`, `VALIDEE`, `PREPARATION`, `LIVREE`, `ANNULEE` existent ; aucune transition codée. Le statut du registre est fixe. Le moteur de picking lit `VALIDEE` et `PREPARATION` comme « carnet » (`lib/picking-engine.ts:254-258`).
- **Marge** : `marge_brute_pct` est une donnée (générée entre 12,8 et 18,2 % : `lib/generators/generate-commandes.ts:50`, `randInt(…,128,182)/10`). La synthèse fait une **moyenne arithmétique simple non pondérée** (`commandes-dg-builder.ts:23-25`). Aucun calcul `(prix de vente − coût) / prix` à partir des lignes.
- **Prix société / prix freelance** : `montant_societe` = ce que paie le freelance à la société (tarif grossiste) ; `marge_freelance = montant_societe × (12 à 22 %)` ; `montant_client = montant_societe + marge_freelance` (`generate-commandes.ts:51-52`, exemples en dur `registries/commandes-registry.ts:70,78`). Autrement dit la marge freelance est **un pourcentage du prix société, pas une différence de grille**. L'écran du freelance affiche « marge non visible par la société » (`CommandesView.tsx:138`) alors que la carte DG affiche « Marge free. » (`:78-80`) : contradiction à arbitrer. Le seuil « plancher grossiste » est cité en texte (`commandes-dg-builder.ts:104`) mais **aucun plancher n'est codé**. L'audit (`AUDIT:155-163`) demande un simulateur de marge et un blocage de proforma sous seuil : non fait.
- **Vérification de stock à la prise de commande** (`components/terrain/DisponibiliteView.tsx:25-30`) : `dispoDe(stock, seuil)` = `RUPTURE` si stock ≤ 0, `LIMITE` si stock < seuil, sinon `DISPONIBLE`. Le commercial voit un statut, pas la quantité (`:20-23`) ; texte : « En cas de stock limité, la quantité est confirmée à la validation » (`:90`) mais **cette validation n'existe pas**. Le stock agrège les entrepôts (somme des `stock`/`seuil` par référence, `:43-52`).
- **Priorité IA / blocage** : `priorite_ia` est une donnée. Le moteur de picking recalcule sa propre priorité (voir §4.4) et le blocage crédit (§4.4).
- KPI pipeline : `volume_fcfa` par statut = somme des `montant_societe` (`commandes-dg-builder.ts:32-38`) ; `taux_service_pct = clamp(taux_livrées + 12, 72, 99)` (`:145`) : **chiffre artificiel** (+12 forcé, plancher 72, plafond 99) à ne pas reprendre tel quel ; score de file prioritaire = `montant/1 M + 100 (BLOQUEE) + 50 (HAUTE) + 30 (PREPARATION) + 20 (magasin PROPRE)` (`:150-163`) ; alerte « pic préparation » si volume en préparation > 15 000 000 (`:73`) ; analyse « bloquée Kiosque Port » codée sur l'identifiant `pdv-3` (`:63`).
- **Commande WhatsApp** : n'existe que comme valeur de canal (`CanalCommande`) et comme canal des campagnes combos (`combo-stock-workflow.ts:126`). Aucune réception de message, aucun parsing, aucun envoi.

### 2.5 Facturation et stock réservé (voir aussi §8)
- Commande → facture « en un clic » : **absent côté commande**. Le seul passage existe côté proforma (`Convertir en commande`, voir §8).

---

## 3. Stock (`/stock`)

### 3.1 Ce que montre l'écran
`components/stock/StockLogistiqueView.tsx`. Six sections (`:19-28`) :
`stock` (Stock & logistique) · `transferts` (Transferts inter-entrepôts) · `sante` (Santé du stock) · `automatisation` (Journal d'automatisation) · `sorties` (Sorties entrepôt) · `catalogue`.
- **GEST_ENTREPOT** : n'a pas d'onglets, `StockEntrepotView` seulement (`:65-68`).
- RESP_STOCK / DG / DAF : onglets filtrés par droits (§0). Les autres rôles (SUPERVISEUR, MARKETING, etc.) voient `stock`, `sorties`, `catalogue`.
- `StockView` (`components/stock/StockView.tsx`, « Pilotage stock & logistique ») : 8 KPI (valeur du stock — libellée « Valeur stock (prix) » ou « Stock immobilisé » selon le droit —, ruptures actives, sous seuil, couverture moyenne, taux de service, commandes à préparer, PDV en rupture, ruptures/3m) ; deux cartes entrepôt (occupation, valeur, sorties/jour, ruptures) ; liste de produits filtrable (`VueStockDG = consolide | lome-port | kara | alertes | preparation`, `lib/stock-dg-builder.ts:10`) ; « Expéditions du jour » ; « Analyses IA logistique » ; fiche produit avec bouton « Réapprovisionner » (lien) si `CRITIQUE` ou `ALERTE` (`StockView.tsx:392-396`).
- `StockEntrepotView` (poste du magasinier) : colonnes emplacement, stock, **réservé**, **disponible**, palettes ; recherche, filtre par allée ; **aucun prix, marge ni CA** (`components/stock/StockEntrepotView.tsx:15-23,38-80`).
- `EntrepotSortiesHistoriquePanel` : historique des sorties/BL par entrepôt, destinataire, valeur (`components/stock/EntrepotSortiesHistoriquePanel.tsx`, données `lib/sorties-entrepot-builder.ts`) ; LECTURE.

### 3.2 Objets et champs
- `StatutStockDG = CRITIQUE | ALERTE | OK | SURSTOCK` (libellés « Rupture », « Sous seuil », « Stock OK », « Surstock » : `stock-dg-builder.ts:11,235-240`).
- `ProduitStockDG` (`stock-dg-builder.ts:29-42`) : produit catalogue + `statut_stock`, `couverture_jours`, `taux_service_pct`, `fournisseur` (`nom`, `delai_jours`, `derniere_commande`, `qte_en_cours`, `prochaine_livraison?`), `mouvements_recents[]`, `evolution_stock_7j[]`, `commandes_a_preparer`, `unites_en_preparation`, `transferts_en_cours`, `valeur_stock_cout`, `synthese_logistique_ia`, `recommandation_ia`.
- **Mouvement de stock** `MouvementStock` (`stock-dg-builder.ts:13-19`) : `date`, `type` (`ENTREE | SORTIE | TRANSFERT | AJUSTEMENT`), `quantite`, `libelle`, `reference?` (EXP-xxxx, BL-xxxx, TRF-xxxx). Données en dur pour 12 SKU : **pas de grand livre de mouvements**, pas de stock calculé à partir des mouvements, pas de mouvement généré par les actions.
- Stock multi-site : `REPARTITION_STOCK` (`lib/registries/stock-reseau-registry.ts`) : lignes `produit_ref`, `entrepot`, `quantite`, `seuil` ; fonctions `stockDuSite`, `referencesDuSite`, `partDesVentes`.
- `ExpeditionDG` (`stock-dg-builder.ts:55-64`) : `id`, `heure`, `entrepot`, `destination`, `nb_lignes`, `unites`, `statut` (`PREPARATION | EN_ROUTE | LIVRE | RETARD`), `chauffeur?` (6 expéditions en dur, `:226-233`).
- **Statuts de stock codés en dur** : `statut_stock` et `couverture_jours` sont saisis à la main dans `LOGISTIQUE` (`stock-dg-builder.ts:73-224`) ; ils ne sont **pas** calculés à partir de `stock`, `seuil`, `ventes_30j`. Deux sources de vérité qui divergent possible (ex. `p-11` : stock 88 / seuil 100 → `ALERTE` ; `p-12` : couverture 32 j → `SURSTOCK` alors que le seuil de surstock du moteur de transferts est 60 j). Pour les autres SKU, valeurs par défaut `statut OK`, couverture 10 j (`:245-258`).

### 3.3 Actions
| Libellé | Effet attendu | État | Où |
|---|---|---|---|
| Onglets de section, vues, filtres, recherche, filtre allée | navigation | LECTURE | `StockLogistiqueView.tsx:77-91`, `StockView.tsx:231-269`, `StockEntrepotView.tsx:126-148` |
| « Réapprovisionner » (fiche produit sous seuil) | ouvrir `/approvisionnement?tab=reappro` | BRANCHÉ (simple lien de navigation) | `StockView.tsx:393-396` |
| « Lancer la navette » (onglet Transferts) | exécuter le transfert inter-entrepôts | SIMULÉ : écrit une entrée `TRANSFERT` dans le journal localStorage `prospera.stock.journal.v1`, **ne déplace pas le stock** | `components/logistique/TransfertsPanel.tsx:182-195` ; `lib/stock-workflow.ts:14-21,28` |
| « Annuler » (sur une navette lancée) | retirer l'entrée du journal | SIMULÉ | `TransfertsPanel.tsx:173-175` |
| « Lancer « scénario » » (plan de liquidation) | exécuter le scénario retenu | SIMULÉ : entrée `LIQUIDATION` au journal, payload `{type, entrepot}` ; **ne crée ni promo, ni bon de transfert, ni retour fournisseur** | `components/logistique/PlanLiquidationPanel.tsx:153-166` |
| Choix d'un scénario (REMISE/COMBO/TRANSFERT/RETOUR/REBUT) | sélectionner | LECTURE (état React) | `PlanLiquidationPanel.tsx:78-82` |
| Filtres de santé de stock (tous / SURSTOCK / DORMANT / DLC_COURTE / OBSOLETE), ouverture d'un plan | navigation | LECTURE | `components/logistique/SanteStockPanel.tsx:95-112,171-173` |
| Journal d'automatisation : filtres par nature | navigation | LECTURE | `components/logistique/JournalAutomatisationPanel.tsx:114-131` |
| (absent) Valider / Rejeter / Annuler une décision du journal | : | **N'EXISTE PAS** (l'audit `AUDIT:180` le demande) | : |
| (absent) ajustement de stock manuel, entrée/sortie manuelle | : | **N'EXISTE PAS** | : |

Le journal d'actions (`StockWorkflowContext`) : une seule entrée par couple `(kind, refId)` (idempotent, `stock-workflow.ts:61-82`), `StockActionKind = TRANSFERT | REAPPRO_VALIDATION | REAPPRO_BASCULE | RECEPTION | INVENTAIRE | LIQUIDATION` (`:14-20`), champs `id`, `kind`, `refId`, `label`, `detail?`, `by`, `at`, `payload?` (`:22-31`). Le fichier se décrit comme une généralisation du modèle « Combos stock » (`:1-8`).

### 3.4 Règles de calcul
**Seuil de rupture / sous seuil**
- Rupture d'un site : `quantite < seuil` (catalogue). `detecterProduitsEnManque` : `sousSeuil = stock ≤ seuil_stock` **ou** `couverture < couverture_min_jours` (`lib/reappro-engine.ts:90-92`). Les deux définitions (strictement inférieur / inférieur ou égal) ne sont pas alignées : à unifier.
- `criticite` d'une alerte de réappro : `CRITIQUE` si `stock ≤ 0,5 × seuil` ou `couverture < 3 j` ; `HAUTE` si sous seuil ; sinon `MODEREE` (`reappro-engine.ts:99-101`).
- `couverture_jours = stock / (ventes_30j / 30)` arrondi à 0,1 ; si vitesse ≤ 0 → 999 ; si `ventes_30j` absent → `seuil × 3` sur 30 jours (`reappro-engine.ts:27-40`).

**Surstock / dormant / DLC / obsolète** (`lib/transferts-engine.ts:315-388`)
- `SEUIL_SURSTOCK_JOURS = 60` et `SEUIL_DORMANT_JOURS = 60` (`:34-36`) ; en pratique « dormant » = vitesse < 0,5 u/j et stock > 0 (`:340`) ; « surstock » = couverture > 60 j et < 900 (`:341`) ; DLC menacée si `couverture > 0,6 × dlc_jours` (`:343`).
- Diagnostic (`:352-361`) : `OBSOLETE` si dormant et couverture > 300 j ; sinon, si DLC menacée, `DLC_COURTE` quand `dlc ≤ 60 j`, sinon `SURSTOCK` ; sinon `DORMANT` si dormant ; sinon `SURSTOCK`.
- Coût de portage annuel : `COUT_PORTAGE_ANNUEL = 0,22` (`:313`). Perte si inaction (`:390-406`) : DLC courte = `(stock − vitesse × dlc) × coût` ; obsolète = `40 % du capital` ; sinon `capital × 0,22 × (min(couverture, 720) − 60) / 365`. Gravité : `CRITIQUE` si perte > 30 % du capital, `HAUTE` si > 12 %, sinon `MODEREE` (`:365`). `destockage_suggere = probleme ≠ DORMANT ou couverture > 120` (`:380`).
- Part dormante % = capital (dormant + surstock) / capital total (`:385`).
- Le capital immobilisé est valorisé **au coût d'achat** (`stock × cout_achat`, `:337`), à l'inverse du catalogue (au prix de vente).

**Transferts inter-entrepôts** (`transferts-engine.ts:135-272`)
- Un site est « en manque » si `quantite ≤ seuil` ou `couverture < couverture_min_jours` de la règle (défaut 7 j) (`:143-146`).
- On ne prélève que sur un site dont la couverture ≥ `COUVERTURE_MIN_EXPEDITEUR_J = 25` ; quantité disponible = `stock source − ceil(vitesse source × 25)` (`:157-163`) ; cible destination = `ceil(vitesse × max(2 × couverture_min, 14))` ; quantité = `min(disponible, cible − stock)` (`:165-168`).
- Coût : rotations = `ceil(poids / charge utile du porteur)` ; coût = `rotations × (coût tournée + 420 km × coût/km)` ; délai = 1 j (2 j si plusieurs rotations) (`:108-120`, `DISTANCE_INTER_ENTREPOTS_KM = 420`). Vitesse locale = vitesse réseau × part des ventes du site (`:95-100`).
- Économie nette = `coût réappro fournisseur + coût de rupture évité − coût du transfert` ; rupture évitée = `vitesse × (délai fournisseur réel − délai transfert) × (prix − coût d'achat)` (`:122-133,205-213`).
- **Urgence** : `CRITIQUE` si couverture destination < 3 j ; `HAUTE` si stock ≤ seuil ; sinon `OPPORTUNITE` (`:223-225`). **`auto = coût ≤ 250 000 F et urgence ≠ CRITIQUE`** (`:229`) : la règle d'exécution autonome d'un transfert.

**Plans de liquidation** (`lib/liquidation-engine.ts`)
- Cinq scénarios `TypeSortie = REMISE | COMBO | TRANSFERT | RETOUR_FOURNISSEUR | REBUT` (`:32`), chacun avec `faisable`, `unites_ecoulees`, `recette_nette`, `cout_scenario`, `delai_jours`, `gain_vs_inaction`, `detail`, `frein?` (`:34-51`).
- **Il n'y a pas de « score de liquidation »** : le critère unique est `gain_vs_inaction = recette_nette + coût_inaction × (unités écoulées / stock)` (`:94-103`), le scénario recommandé est le faisable au plus grand gain (`:128-166`). Le coût irrécupérable (capital déjà dépensé) est volontairement exclu de la comparaison (commentaire `:79-93`).
- Coût d'inaction (`:110-126`) : périssable = `unités non vendables avant DLC × coût` ; sinon `portage (stock × coût × 0,22) + décote finale (40 % si OBSOLETE, 15 % sinon)`.
- REMISE : décotes testées `[10,15,20,25,30,40,50] %` (max 50 %, `:69-71`), vitesse boostée `= vitesse × (1 + décote × élasticité)`, horizon d'écoulement 90 j, on garde la décote qui maximise la recette nette (`:169-227`). Frein si élasticité < 1,3 (`:222`).
- COMBO : produit porteur de même catégorie, même site, de plus forte vitesse ; vitesse combo = `0,35 × vitesse du porteur` (`RATIO_COMBO_MAX`, `:73`) ; remise du combo = 40 % si OBSOLETE, 20 % si DLC_COURTE, 15 % sinon (`:262-264`) ; horizon 90 j. **Ce scénario est calculé séparément du module Combos du marketing** (§6) : il n'alimente pas la file de validation.
- TRANSFERT : réutilise le coût de camion (`:297-343`). RETOUR_FOURNISSEUR : faisable seulement si une clause de reprise existe ; recette = `stock × coût × reprise %`, délai 15 j (`:345-379`). REBUT : recette nulle, délai 3 j, stoppe le portage (`:381-399`).
- Panneau « rétrospective garde-fou » : rejoue `controlerAchat` sur le stock existant (`PlanLiquidationPanel.tsx:10,42`).

**Garde-fou anti-stock-mort à l'achat** (`lib/garde-fou-achat.ts`) : cinq motifs `DLC | SAISON | FIN_DE_VIE | REMISE_PIEGE | COUVERTURE_EXCESSIVE` (`:30`), verdicts `PASSE | ECRETE | REFUSE` (`:32`) ; constantes `PART_DLC_UTILISABLE = 0,7` (on ne couvre pas plus de 70 % de la DLC) et `COUVERTURE_MAX_ACCEPTABLE_J = 60` (`:62-64`) ; `controlerCommandesSuggerees` (`:237`) est appelé par le journal d'automatisation **mais pas par l'écran « Réappro IA »** : les commandes suggérées affichées ne sont pas écrêtées (§5.4).

**Journal d'automatisation** (`lib/automation-journal.ts`) : `NatureDecision = EXECUTE | PROPOSE | ESCALADE` (`:28`), `DomaineAutomatisation = REAPPRO | TRANSFERT | PREPARATION | EXPEDITION | RECEPTION | INVENTAIRE | STOCK` (`:25-26`), chaque entrée porte `declencheur`, `action`, `gain_fcfa`, `gain_minutes`, `delegue_par` (rôle), `reversible`, `entrepot?` (`:37-55`). Entièrement **dérivé** des moteurs (pas de saisie) ; en lecture seule.

---

## 4. Opérations entrepôt (`/entrepot`)

### 4.1 Ce que montre l'écran
`components/entrepot/EntrepotWorkspaceView.tsx` : « poste de travail » (aucun chiffre commercial, `:27-37`). En-tête : surface, emplacements, quais, heure de départ camions (`:59-66`). RESP_STOCK/DG choisissent l'entrepôt (`:69-86`) ; GEST_ENTREPOT ne voit que le sien. 4 onglets (`:20-25`) : **Préparation**, **Expéditions & chargement**, **Réceptions**, **Inventaire tournant**.

### 4.2 Objets et champs
- `BonPreparation` (`lib/picking-engine.ts:77-100`) : `commande_id`, `commande_ref`, `pdv_id`, `pdv_nom`, `zone`, `entrepot`, `priorite`, `score_priorite`, `lignes[]`, `nb_lignes`, `lignes_en_rupture`, `poids_total_kg`, `volume_total_m3`, `palettes_total`, `duree_prep_min`, `blocage` (`BlocagePreparation = CREANCE | AUCUN`, `:75`), `motif_blocage?`, `decision_auto` (`PREPARER | PREPARER_PARTIEL | BLOQUER`), `justification`.
- `LignePicking` (`:49-73`) : `produit_ref`, `produit_nom`, `categorie`, `quantite_demandee`, `quantite_servie`, `statut` (`StatutLignePicking = SERVABLE | PARTIELLE | RUPTURE`, `:47`), `emplacement`, `allee`, `ordre_parcours`, `poids_kg`, `volume_m3`, `palettes`, `colis_restants`, `substitut_ref?`, `substitut_nom?`.
- `VaguePicking` (`:102-116`) : `id`, `libelle`, `entrepot`, `creneau`, `bons[]`, `nb_lignes`, `duree_min`, `preparateur?`, `parcours[]`, `tenable`.
- `ChargeEntrepotJour` (`:118-147`) : `lignes_a_preparer`, `capacite_lignes`, `taux_charge_pct`, `lignes_reportees`, `preparateurs_presents/absents`, `cutoff`, `carnet_commandes`, `commandes_liberees`, `arriere_commandes`, `alerte?`, `alerte_structurelle?`.
- `Preparateur` (`entrepot-logistique-registry.ts:261-273`) : `id`, `nom`, `entrepot`, `cadence_lignes_h`, `taux_erreur_pct`, `heures_dispo`, `present`, `absence?`. `Camion` (`:199-215`) : `id`, `immatriculation`, `type` (`PORTEUR | FOURGON | TRICYCLE`), `entrepot`, `charge_utile_kg`, `volume_utile_m3`, `chauffeur`, `cout_tournee_fcfa`, `cout_km_fcfa`, `disponible`, `indisponibilite?` (6 camions, 5 préparateurs en dur).
- `Tournee` / `ArretTournee` / `PlanExpedition` (`lib/expedition-engine.ts:22-75`) : `camion`, `arrets[]` (`ordre`, `pdv_*`, `commande_ref`, `poids_kg`, `volume_m3`, `palettes`, `distance_km`, `eta`, `encaissement_attendu?`), `remplissage_pct`, `remplissage_poids_pct`, `remplissage_volume_pct`, `contrainte_saturante` (`POIDS | VOLUME`), `distance_km`, `cout_fcfa`, `cout_par_palette`, `depart`, `retour_estime`, `rentable`, `recommandation?` ; plan : `tournees`, `non_charges[]`, `cout_total`, `remplissage_moyen_pct`, `economie_regroupement`, `alertes[]`.
- Réception : `ReceptionAttendue` (`lib/reception-engine.ts:40-61`), `LigneAttendue` (`:25-36`), `StatutAttendu = A_QUAI | ATTENDU_JOUR | EN_RETARD | A_VENIR` (`:38`), `NiveauControle = INTEGRAL | RENFORCE | ALLEGE` (`:23`), `LigneReception` (`types/index.ts:367-372` : `produit_ref`, `quantite_recue`, `conforme`, `motif_ecart?`), `DecisionEcart` (`:65-76`, `IssueEcart = ACCEPTE | RESERVE | LITIGE | REFUS`, `:63`), `BilanReception` (`:78-92` : `taux_conformite_pct`, `avoir_a_reclamer`, `litige`, `actions_auto[]`), `ChargeQuai` (`:288-298`).
- **Litige** : **pas d'objet `Litige`**. Un litige est un booléen (`BilanReception.litige`), un statut de commande fournisseur (`StatutCommandeFournisseur = LITIGE`), une issue d'écart (`IssueEcart = LITIGE`) et un compteur (`taux_litige_pct` du fournisseur). Il n'a ni identifiant, ni responsable, ni échéance, ni pièce jointe, ni résolution, ni lien avec l'avoir.
- Inventaire : `LigneABC` (`lib/inventaire-engine.ts:24-41`), `ClasseABC = A | B | C`, `TacheComptage` (`:45-59`, `StatutComptage = A_COMPTER | EN_RETARD | PLANIFIE`), `EcartInventaire` (`:61-74`), `SyntheseInventaire` (`:76-89`).

### 4.3 Actions
| Onglet | Libellé | Effet attendu | État | Où |
|---|---|---|---|---|
| Préparation | ouvrir/replier un bon | voir les lignes de picking | LECTURE | `components/entrepot/PreparationPanel.tsx:192-194` |
| Préparation | (absent) imprimer le bon, valider une ligne servie, accepter un substitut, démarrer une vague | : | **N'EXISTE PAS** (audit `AUDIT:188-190`) | : |
| Expéditions & chargement | (aucun bouton) | : | LECTURE ; (absent) valider le départ camion, feuille de route, signature | `components/entrepot/ExpeditionPanel.tsx` |
| Réceptions | clic sur une réception | ouvrir le détail et la saisie des quantités | LECTURE (état React) | `ReceptionPanel.tsx:128-130` |
| Réceptions | saisie des quantités reçues (pré-remplies avec le commandé) | | SIMULÉ | `ReceptionPanel.tsx:43-52,217-220` |
| Réceptions | « Valider le contrôle au quai » | calculer le bilan d'écarts et enregistrer la réception | SIMULÉ : appelle `controlerReception` (calcul réel), puis écrit `RECEPTION` au journal ; **le stock n'augmente pas, aucun avoir ni litige n'est créé ailleurs** | `ReceptionPanel.tsx:54-80,242-247` |
| Réceptions | « Annuler » | retirer l'entrée du journal | SIMULÉ | `ReceptionPanel.tsx:235-236` |
| Inventaire | saisie « compté » + « Valider » | calculer l'écart, enregistrer le comptage | SIMULÉ : `analyserEcart` (calcul réel) + entrée `INVENTAIRE` au journal ; **aucun ajustement du stock théorique** | `components/entrepot/InventairePanel.tsx:161-190,26-38` |
| Inventaire | « Annuler » | retirer le comptage | SIMULÉ | `InventairePanel.tsx:171-181` |
| tous | choix de l'entrepôt (RESP_STOCK/DG) | | LECTURE | `EntrepotWorkspaceView.tsx:73-83` |

Particularité : le même événement « réception » existe **deux fois** : au quai (`/entrepot > Réceptions`, `ReceptionPanel`) et côté achats (`/approvisionnement > Commandes fournisseurs`, « Valider la réception »). Les deux écrivent `RECEPTION` avec le même `refId = commande_id` : l'idempotence du journal les fait se télescoper (la seconde écrase l'autre). L'audit parle de « double écran non synchronisé » (`AUDIT:192`). Le PRD doit n'avoir qu'**un** processus de réception.

### 4.4 Règles de calcul
**Préparation** (`lib/picking-engine.ts`)
- Carnet = commandes `VALIDEE` ou `PREPARATION` de l'entrepôt, triées par `scorePriorite` (`:254-258`).
- `scorePriorite` (`:176-196`) : base 50 ; +30 si `priorite_ia = HAUTE` ; −40 si `BLOQUEE` ; +15 si PDV `A_RISQUE` ; +10 si `FIDELE` ; −10 si créance > 30 jours ; +10 si montant > 5 M ; +8 si statut `VALIDEE` ; borné [0, 100].
- **Blocage crédit** (`:36-45,204-226`) : bloqué si le PDV a une créance > 0 **et** (retard ≥ `JOURS_RETARD_BLOQUANTS = 45` jours **ou** créance > plafond) ; plafond = `max(400 000 F, 0,6 × CA mensuel du PDV)` (`PLAFOND_CREDIT_EN_MOIS_DE_CA = 0.6`, `PLAFOND_CREDIT_MINIMUM = 400_000`). Une commande bloquée **ne réserve rien** (`:307-310`).
- **Réservation de stock au fil de l'eau** (`:275-389`) : les commandes sont libérées par priorité décroissante ; pour chaque ligne, `disponible = stock du site − déjà réservé (commandes déjà libérées + tentative en cours)` ; `quantite_servie = min(demandée, disponible)` (0 si bloquée) ; statut ligne `SERVABLE` (rien de manquant), `RUPTURE` (rien servi), sinon `PARTIELLE`. Les réservations d'une commande ne deviennent fermes que si elle est libérée (`:351-354`) ; une commande dont **toutes** les lignes sont en rupture n'est pas libérée (retourne à l'arriéré, `:341-347`). La libération s'arrête quand `lignesLiberees ≥ capacité du jour` (`:281,287`).
- Substitut : produit de même catégorie, même site, stock net suffisant, prix ≤ 125 % de l'original (`:228-249`).
- Décision automatique (`:391-412`) : `BLOQUER` si crédit ; `PREPARER` si tout servable ; sinon `PREPARER_PARTIEL`.
- Durée de préparation d'un bon = `lignes / cadence moyenne × 60` min ; cadence par défaut 35 lignes/h (`:414-418`). Capacité du jour = `Σ (cadence × heures dispo)` des préparateurs présents (`entrepot-logistique-registry.ts:288-292`).
- Vagues (`buildVagues`, `:430-487`) : regroupement par **zone de livraison**, créneaux `07:00→09:30`, `09:30→12:00`, `13:00→cutoff`, un préparateur par vague (rotation), parcours = allées dans l'ordre physique ; `tenable = durée ≤ 150 min`.
- Charge du jour (`buildChargeJour`, `:489-539`) : `taux = lignes / capacité` ; alerte si lignes reportées > 0 ou taux > 85 % ; **alerte structurelle** si `arriéré > 2 × libérées` : « il se résorbe en réapprovisionnant » (`:517-525`). Compte des commandes : `arriéré = carnet − libérées − bloquées`.
- Pas de notion d'erreur de picking dans le calcul (le `taux_erreur_pct` est une donnée).

**Expédition** (`lib/expedition-engine.ts`)
- Chargement en « first-fit decreasing » à deux contraintes (poids ET volume) : bons regroupés par zone puis du plus lourd au plus léger ; camions triés par charge utile décroissante (`:117-143`).
- Remplissage = `max(poids/charge utile, volume/volume utile)` ; la contrainte saturante est celle qui est la plus élevée (`:199-201`). Seuil de rentabilité `SEUIL_REMPLISSAGE_RENTABLE = 65 %` (`:20,204`).
- Coût d'une tournée = `coût de mise en route + km × coût/km` (`:203`) ; distance à vol d'oiseau × 1,35 (`:77-89`). Ordre des arrêts : plus proche voisin. Économie de regroupement = coût d'une tournée par commande − coût réel (`:236-241`).
- Le bon « non chargé » est celui qu'aucun camion disponible ne peut prendre ; alertes sur camions immobilisés (`:243-260`).

**Réception** (`lib/reception-engine.ts`)
- Réceptions attendues = commandes fournisseurs en `ENVOYEE | CONFIRMEE | EN_TRANSIT` pour l'entrepôt (`:123-132`) ; statut d'attente : retard (écart de dates < 0), `A_QUAI` (0), `ATTENDU_JOUR` (≤ 2 j), `A_VENIR` (`:144-145`).
- **Niveau de contrôle** (`:103-120`) : `INTEGRAL` si `taux_litige ≥ 5 %` ou `taux_conforme < 90 %` ; `RENFORCE` si `taux_conforme < 97 %` ; sinon `ALLEGE`.
- **Écarts** (`controlerReception`, `:215-266`) : `ecart_pct = |reçu − commandé| / commandé` ; `ACCEPTE` si ligne conforme et écart nul ou ≤ **`TOLERANCE_ECART_PCT = 2 %`** (`:19`) ; `RESERVE` si ≤ **`SEUIL_LITIGE_PCT = 5 %`** (`:21`) ; `LITIGE` au-delà ; `REFUS` si la ligne est marquée non conforme. Impact = `|écart| × prix d'achat` ; **avoir à réclamer** = somme des impacts des lignes en manquant ou refusées ; `litige = au moins une ligne LITIGE ou REFUS`. Conformité % = lignes `ACCEPTE` / lignes. Les `actions_auto` annoncées (mise en stock, avoir préparé, **facture fournisseur bloquée au paiement**, **recalcul du score fournisseur**, dette enregistrée) sont des **textes** : rien n'est exécuté (`:250-258`).
- Charge des quais : durée de quai des réceptions du jour ou en retard vs capacité `quais × 8 h × 60 × 0,5` (les quais servent aussi aux départs) ; saturé si durée > capacité (`:300-319`).
- L'audit signalait « 93 % codé en dur » : corrigé, le bilan est maintenant calculé sur les quantités saisies (`ReceptionPanel.tsx:54-66`).

**Inventaire tournant** (`lib/inventaire-engine.ts`)
- Classement ABC de Pareto sur la valeur de consommation annuelle **au coût d'achat** (`ventes_30j × 12 × cout_achat`) : A = cumul ≤ 80 %, B = ≤ 95 %, C = reste (`:114-163`). Fréquences de comptage : A 30 j, B 90 j, C 180 j (`FREQUENCE_PAR_CLASSE`, `:93`).
- Tâche de comptage : `EN_RETARD` si retard > 15 j, `A_COMPTER` si retard ≥ 0, sinon `PLANIFIE` (exclu) ; tri : retards, puis écarts récents, puis classe (`:176-211`). Durée = `max(4, round(stock/unités par palette) × 3 + 4)` min.
- `ecartsRecents` (nombre d'écarts sur les 3 derniers comptages) est **tiré au hasard déterministe** (70 % sains, 20 % un écart, 10 % trois) (`:165-174`) ; suspicion si 3 écarts.
- Analyse d'écart (`analyserEcart`, `:222-276`) : `écart = compté − théorique` ; `ecart_pct` ; valeur au coût d'achat ; **`SEUIL_ECART_SIGNIFICATIF_PCT = 3 %`** (`:91`) ; action : ≤ 1 % ajustement automatique, ≤ 3 % validation du responsable stock, > 3 % recomptage obligatoire (contradictoire à deux personnes si classe A). Causes probables textuelles selon le signe et la récurrence.
- Synthèse : fiabilité = part des références non suspectes ; démarque 90 j = `Σ stock × 1,5 % × coût` des suspects (`:277-322`).

---

## 5. Approvisionnement (`/approvisionnement`)

### 5.1 Ce que montre l'écran
`components/approvisionnement/ApprovisionnementView.tsx` : bandeau de 6 KPI (produits sous seuil, commandes auto à valider, dette fournisseurs, dont échue, délai de réappro moyen, taux de service fournisseur : `:48-56`, `lib/fournisseurs-hub.ts:buildSyntheseApprovisionnement`), 4 onglets (`:19-24`). Onglet d'entrée par rôle (`:26-33`) : RESP_STOCK et DG → Réappro IA ; GEST_ENTREPOT → Commandes (inaccessible par route) ; DAF, COMPTABLE, MARKETING → Fournisseurs.
1. **Réappro IA** (`ReapproIAPanel.tsx`) : encadré « Impact trésorerie simulé » (solde disponible, engagement suggéré, solde projeté, plancher), « Commandes suggérées par le moteur » avec fournisseur retenu, justification, fournisseur alternatif, « Valider tout », panneau d'analyses IA.
2. **Commandes fournisseurs** (`CommandesFournisseursView.tsx`) : filtre par statut, ligne dépliable, réception avec écarts.
3. **Fournisseurs** (`FournisseursView.tsx` + `FicheFournisseur.tsx`) : registre, couleur du score (≥ 80 vert, ≥ 60 ambre, sinon rouge : `FournisseursView.tsx:126`), fiche (conditions, dette, jauges fiabilité et compétitivité prix, produits avec comparatif de prix concurrent, commandes, synthèse IA) ; échéancier de dette (`buildEcheancierFournisseurs`).
4. **Règles d'automatisation** (`ReglesReapproView.tsx`) : règles par produit, filtre par niveau, journal des déclenchements : **lecture seule** (le seul `onClick` est le filtre de niveau, `:56-57`).

### 5.2 Objets et champs
- `Fournisseur` (`types/index.ts:209-238`) : `id`, `code` (FRN-001), `nom`, `categories[]`, `contact {nom, telephone, email}`, `pays`, `statut` (`StatutFournisseur = ACTIF | PREFERENTIEL | SUSPENDU | EN_EVALUATION`, `:207`) ; conditions : `delai_livraison_j`, `delai_paiement_j`, `franco_de_port`, `minimum_commande`, `remise_volume_pct` ; dette : `encours_du`, `encours_echu`, `prochaine_echeance`, `montant_prochaine_echeance`, `plafond_credit_accorde` ; performance : `score_fiabilite`, `taux_livraison_conforme_pct`, `delai_reel_moyen_j`, `taux_litige_pct`, `competitivite_prix`, `ca_annuel_avec_fournisseur`. 10 fournisseurs en dur (`registries/fournisseurs-registry.ts`).
- `ProduitFournisseur` (`:240-251`) : `produit_ref`, `fournisseur_id`, `prix_achat`, `delai_j`, `quantite_min`, `quantite_lot`, `prioritaire`, `dernier_prix_negocie?`, `date_dernier_achat?`.
- `RegleReappro` (`:261-275`) : `id`, `produit_ref`, `actif`, `seuil_stock`, `couverture_min_jours`, `mode_quantite` (`ModeQuantiteReappro = STOCK_CIBLE | QUANTITE_FIXE | PREVISION_IA`, `:259`), `stock_cible`, `quantite_fixe?`, `niveau_auto` (`NiveauAutomatisation = ALERTE_SEULE | PROPOSITION | AUTO_SI_SOUS_PLAFOND | AUTO_TOTAL`, `:253-257`), `fournisseur_prefere_id?`, `plafond_auto_fcfa`, `valideur_role`. Défauts : `actif`, couverture 10 j, `PREVISION_IA`, `PROPOSITION`, plafond 0, valideur RESP_STOCK, `stock_cible = round(2,5 × seuil)` (`registries/regles-reappro-registry.ts:34-60`). Exceptions : huile 5L (couverture 12 j, valideur RESP_STOCK), riz (18 j, valideur DAF), eau 1,5L et 50cl (7 j, `AUTO_SI_SOUS_PLAFOND`, plafond 3 M) (`:25-41`).
- `AlerteReappro` (`:280-293`) : produit, entrepôt, `stock_actuel`, `seuil`, `vitesse_vente_jour`, `couverture_jours`, `quantite_suggeree`, `motif` (`MotifLigneReappro = SEUIL_ATTEINT | PREVISION_RUPTURE | REGROUPEMENT | MANUEL | PROMO_FOURNISSEUR`, `:277-278`), `criticite` (`CRITIQUE | HAUTE | MODEREE`), `regle_id?`.
- `SelectionFournisseur` (`:295-304`) : fournisseur retenu, `prix_achat`, `delai_j`, `score`, `justification`, `alternatif_id?`, `alternatif_nom?`.
- **Commande fournisseur** `CommandeFournisseur` (`:330-355`) : `id`, `reference` (CF-2026-0087), `fournisseur_id`, `fournisseur_nom`, `entrepot_destination`, `statut`, `origine` (`AUTO_IA | MANUELLE`), `regle_declenchee?`, `lignes[]`, `montant_ht`, `montant_ttc`, `date_creation`, `date_envoi?`, `date_livraison_prevue`, `date_livraison_reelle?`, `echeance_paiement`, `statut_paiement`, `montant_paye`, `justification_ia?`, `fournisseur_alternatif_id?`, `economie_regroupement?`, `valide_par?`, `valide_le?`.
  - `StatutCommandeFournisseur = SUGGEREE_IA | BROUILLON | EN_VALIDATION | ENVOYEE | CONFIRMEE | EN_TRANSIT | RECUE_PARTIELLE | RECUE | ANNULEE | LITIGE` (`:306-316`) ; `StatutPaiementFournisseur = NON_DUE | A_PAYER | PARTIEL | PAYEE | ECHUE` (`:318`).
  - `LigneCommandeFournisseur` (`:320-328`) : `produit_ref`, `produit_nom`, `quantite_commandee`, `quantite_recue?`, `prix_achat_unitaire`, `total`, `motif`.
- `ImpactTresorerie` (`:357-365`) : `solde_actuel`, `montant_engage`, `solde_projete`, `seuil_plancher`, `franchit_plancher`, `commentaire`.
- Données de départ : 9 à 10 commandes en dur couvrant tous les statuts (`registries/commandes-fournisseurs-registry.ts`).

### 5.3 Actions
| Onglet | Libellé | Effet attendu | État | Où |
|---|---|---|---|---|
| Réappro IA | « Valider la commande » | valider et envoyer la commande au fournisseur | SIMULÉ : entrée `REAPPRO_VALIDATION` au journal, message « validée et envoyée à … » ; **ne crée aucune ligne dans le registre des commandes, ne passe pas le statut à `ENVOYEE`, ne vérifie ni le rôle ni le montant** (la fonction `validerCommandeFournisseur`, `reappro-engine.ts:301-314`, qui poserait `ENVOYEE` + `valide_par`, n'est appelée nulle part) | `ReapproIAPanel.tsx:39-46,212-215` |
| Réappro IA | « Valider tout (N) » | valide les N restantes | SIMULÉ | `:48-50,96-100` |
| Réappro IA | « Basculer sur {fournisseur alternatif} » | remplacer le fournisseur de la commande suggérée | SIMULÉ : entrée `REAPPRO_BASCULE` ; **le montant, les prix et les lignes ne sont pas recalculés avec le nouvel alternatif** (l'audit le classait MORT ; il écrit désormais au journal) | `:222-230` |
| Réappro IA | « Annuler » | retirer la validation | SIMULÉ | `:204-206` |
| Commandes fournisseurs | filtre statut, ouvrir une commande | | LECTURE | `CommandesFournisseursView.tsx:147-178` |
| Commandes fournisseurs | saisie des quantités reçues | | SIMULÉ | `:16-22,71` |
| Commandes fournisseurs | « Valider la réception » | entrée en stock + dette fournisseur + litige si écart | SIMULÉ : `RECEPTION` au journal avec `dette_ttc = Σ prix × reçu × 1,18` et `ecarts` ; texte « Entrée en stock passée · dette fournisseur créée » **sans écriture réelle** (la fonction `receptionner`, `reappro-engine.ts:316-355`, qui calcule stock et statut `RECUE | RECUE_PARTIELLE | LITIGE`, n'est pas appelée) | `:29-40,105-107` |
| Commandes fournisseurs | « Annuler » | | SIMULÉ | `:49-51` |
| Fournisseurs | sélection d'un fournisseur (fiche) | | LECTURE | `FournisseursView.tsx:104` |
| Règles | filtre par niveau | | LECTURE | `ReglesReapproView.tsx:56-57` |
| (absent) | créer/éditer un fournisseur, suspendre, évaluer ; créer une commande manuelle ; éditer une règle (seuil, niveau, plafond), « Déclencher maintenant » ; payer une échéance ; relancer un fournisseur | | **N'EXISTE PAS** (`AUDIT:182`) | : |

### 5.4 Règles de calcul (`lib/reappro-engine.ts`)
- **Vitesse de vente** = `ventes_30j / 30` (défaut `seuil × 3 / 30`) (`:27-29`).
- **Point de commande** `pointDeCommande` (`:74-79`) : `round(vitesse × délai_fournisseur_prioritaire × (1 + 1,3))` (équivaut à `vitesse × délai + stock de sécurité`, où `stock_securite = vitesse × délai × COEFF_SECURITE = 1,3`, `:22`). **Cette fonction n'est utilisée pour rien** : le déclenchement se fait sur `seuil_stock` de la règle, pas sur le point de commande.
- **Déclenchement** (`:81-117`) : seuil ou couverture (voir §3.4) ; motif `SEUIL_ATTEINT` si sous seuil, sinon `PREVISION_RUPTURE`.
- **Quantité de réappro** `calculerQuantiteReappro` (`:49-72`) :
  - `QUANTITE_FIXE` → `arrondiLot(quantite_fixe ?? stock_cible)` ;
  - `STOCK_CIBLE` → `arrondiLot(max(0, stock_cible − stock))` ;
  - `PREVISION_IA` → `arrondiLot(max(0, vitesse × (délai + couverture_min_jours) + vitesse × délai × 1,3 − stock))`, délai = celui du fournisseur prioritaire (défaut 7 j) ;
  - `arrondiLot(q, lot)` = `max(lot, ceil(q/lot) × lot)` (multiple du conditionnement, au moins un lot) (`:31-34`).
- **Note / sélection du fournisseur** `selectionnerFournisseur` (`:129-180`) : candidats = fournisseurs référencés pour le produit, hors `SUSPENDU` (le statut `EN_EVALUATION` n'est pas exclu) ; score 0-100 = `0,30 × prix + 0,25 × délai réel + 0,25 × fiabilité + 0,10 × dette + 0,10 × franco`, où prix, délai et dette sont **normalisés min-max entre les candidats** (le meilleur = 100) ; fiabilité = `taux_livraison_conforme_pct` (pas `score_fiabilite`) ; franco = 100 si `montant ≥ franco`, sinon `montant/franco × 100`. Le premier est retenu, le suivant est l'alternatif. La justification est un texte composé (écart de prix vs suivant, délai réel, conformité, encours échu, franco).
  - **`score_fiabilite` (le chiffre affiché comme « note fournisseur ») est une valeur saisie en dur** (`registries/fournisseurs-registry.ts`, ex. 58, 71, 94, 41) ; aucune formule ne le calcule, aucune réception ne le met à jour (le texte du bilan de réception promet le recalcul, `reception-engine.ts:257`, mais rien n'est codé). Une seule note existe donc (statique) + un score de sélection (dynamique, relatif aux candidats) : à unifier au PRD.
- **Regroupement** `genererCommandesSuggerees` (`:192-280`) : ignore les produits dont la règle est `ALERTE_SEULE` (`:199`) ; regroupe les alertes par fournisseur retenu ; `montant_ht` = somme des lignes, **remise volume appliquée seulement si `montant_ht ≥ franco_de_port`** ; `montant_ttc = ht remisé × 1,18` (`TVA = 0.18`, `:20`) ; la première ligne porte le motif d'origine, les suivantes `REGROUPEMENT` ; économie de regroupement = `(45 000 F si franco atteint) + montant × remise %` (valeur 45 000 F **en dur**, `:236`) ; livraison prévue = date du jour + `delai_livraison_j` ; échéance de paiement = date du jour + délai de livraison + `delai_paiement_j` (alors que le type dit « = date de réception + `delai_paiement_j` », `types/index.ts:346`, et que `receptionner` recalcule bien à la réception : incohérence).
  - **Statut initial** : `EN_VALIDATION` si `AUTO_TOTAL`, ou si `AUTO_SI_SOUS_PLAFOND` et `montant_ttc ≤ plafond_auto_fcfa` (`:241-243,262`) ; sinon `SUGGEREE_IA`. Le statut `EN_VALIDATION` est donc celui d'une commande qui **partirait seule** ; l'envoi n'est cependant jamais exécuté.
  - `valideurPourMontant` (`registries/regles-reappro-registry.ts:18-22`) : `RESP_STOCK` jusqu'à 5 M FCFA (TTC), `DAF` jusqu'à 20 M, `DG` au-delà (`PLAFONDS_VALIDATION`, `:10-14`). Le texte « validation {rôle} requise » est ajouté à la justification (`:253-255`), mais **n'est contrôlé nulle part à la validation** (un RESP_STOCK peut cliquer « Valider » sur une commande de 30 M).
- **Alerte trésorerie DAF / plancher** `simulerImpactTresorerie` (`:282-299`) : `solde_actuel = Σ soldes des comptes de trésorerie (COMPTES_TRESORERIE)`, `montant_engage = Σ montant_ttc des commandes passées en argument`, `solde_projete = solde − engagé`, `franchit_plancher = solde_projete < SEUIL_PLANCHER_TRESORERIE = 40 000 000` (`:24`). Spec : « si le seuil est franchi, escalade au DAF au lieu d'envoi automatique » (`spec-v2:…5.4`). **Dans le code, ce plancher ne bloque rien** : l'encadré devient rouge (`ReapproIAPanel.tsx:56-65`) et une analyse IA « Garde-fou trésorerie déclenché » est ajoutée (`fournisseurs-hub.ts:157`), mais « Valider » reste actif. Dans le journal d'automatisation, l'escalade vaut `franchit_plancher ET montant_ttc > 20 000 000` (`automation-journal.ts:212`), ce qui n'est pas la règle de la spec. Le panneau recalcule l'impact sur les commandes **restantes** (non encore validées) (`ReapproIAPanel.tsx:36-37`). Aucune notification au DAF.
- **Fournisseur alternatif** : fournisseur suivant du scoring (`alternatif_id`) ; l'analyse IA signale les fournisseurs `SUSPENDU` dont des produits n'ont plus de fournisseur prioritaire (`fournisseurs-hub.ts:134-148`). Spec : « au moins 2 fournisseurs référencés par produit (1 prioritaire + 1 de secours) » (`spec-v2:…5.1`) : non contrôlé.
- **Dette et échéancier** (`:373-418`) : tranches `ECHU`, `J+7`, `J+15`, `J+30`, `AU_DELA` calculées sur `encours_echu` et sur `encours_du − encours_echu` par `prochaine_echeance`. `DETTE_FOURNISSEURS_TOTALE` / `ECHUE` = sommes du registre (source du compte 401100 selon la spec).
- **Réception côté achats** (`receptionner`, non appelée) : `statut = LITIGE` si au moins une ligne non conforme, sinon `RECUE` si toutes lignes ≥ commandé, sinon `RECUE_PARTIELLE` ; dette = `Σ prix × reçu × 1,18` ; `statut_paiement = A_PAYER` ; échéance = réception + délai de paiement ; stock +quantité reçue.
- **Garde-fou anti-stock-mort** : voir §3.4 ; non branché sur l'écran de validation.
- Commandes en attente de validation (badge menu « APPRO_A_VALIDER ») = suggérées `SUGGEREE_IA | EN_VALIDATION` + registre `EN_VALIDATION | SUGGEREE_IA` (`reappro-engine.ts:357-364`) : doublonne potentiellement des commandes qui existent aux deux endroits.

---

## 6. Circuit de référence : « Combos stock » (seul branché de bout en bout)

C'est le modèle d'enchaînement à généraliser (le journal `stock-workflow.ts:1-8` s'en réclame explicitement). Le circuit traverse `/stock`-données → `/marketing` (hors périmètre d'écran de ce lot) mais il est **le seul** où une action d'un écran change l'état visible d'un autre écran.

### 6.1 Étapes, rôles, objets
| # | Étape | Rôle acteur | Objet manipulé | Statut (`ComboWorkflowStatut`) | Code |
|---|---|---|---|---|---|
| 1 | **Détection** : le moteur repère les SKU lents (`isStockLent` : `DEFICITAIRE`, ou `EN_CHUTE`, ou rotation ≥ 16 j, ou couverture ≥ 22 j avec demande ≤ 0, ou `FAIBLE` avec rotation ≥ 12 j ; jamais si tous les sites sont en rupture) et les SKU « moteurs » (`isProduitMoteur` : pas de rupture et (engouement `FORT` ou rotation ≤ 8 j ou sorties ≥ 3 000/mois)) ; 2 moteurs max par SKU lent, choisis par `scoreMoteur` (+ `sorties/1000`, +50 même entrepôt, +20 autre catégorie, +30 engouement fort, +10 marge ≥ 14 %) | système (IA) | `ComboStockIA` | : | `lib/marketing-combo-stock-builder.ts:90-130,232` |
| 2 | **Calcul de l'offre** : remise du SKU lent (`DEFICITAIRE` 20 %, `EN_CHUTE` 15 %, rotation ≥ 25 j 18 %, ≥ 16 j 12 %, sinon 8 % : `:131-137`) ; `type` : `PROMO_CHOC` si déficitaire ou rotation ≥ 28 j, `BUNDLE_ADOPTION` si 2 moteurs, sinon `COMBO_MOTEUR` ; `stock_a_liberer = min(stock − seuil, max(40, 35 % des sorties mensuelles))` ; cibles = PDV actifs × 45 % (promo choc) ou 32 % ; marge combo = `(0,85 × marge du lent + marge moyenne des moteurs) / 2` | système | `ComboStockIA` (`id`, `priorite`, `severite`, `type`, `nom`, `explication`, `offre`, `lent`, `moteurs[]`, `remise_lent_pct`, `prix_lent_promo_fcfa`, `prix_combo_estime_fcfa`, `stock_a_liberer_unites`, `cout_evite_mois_fcfa`, `ca_potentiel_fcfa`, `contacts_cibles`, `canal`, `zone`, `marge_combo_pct`, `metriques[]`) | : | `marketing-combo-stock-builder.ts:31-54,139-200` |
| 3 | **Règle de validation** : `needsDgValidation = remise ≥ REMISE_SEUIL_DG (12 %) OU severite = CRITIQUE OU type = PROMO_CHOC` | système | : | `EN_ATTENTE_DG` (sinon `AUTO_DISPONIBLE`) | `lib/combo-stock-workflow.ts:7,27-33,35-44` |
| 4 | **Validation / transmission** : « Valider & transmettre au marketing » (DG) ou « Transmettre au marketing (seuil auto < 12%) » (marketing, sous seuil) | DG (ou marketing sous seuil) | `ComboQueueEntry` (`comboId`, `statut`, `validatedAt?`, `validatedBy?` = `DG | AUTO`, `campagneId?`, `campagneCreeeAt?`) | `VALIDEE` | `components/marketing/CombosStockPanel.tsx:60-94` ; `contexts/ComboStockWorkflowContext.tsx` (`validerEtTransmettre`) |
| 5 | **Éligibilité marketing** : seuls les combos `VALIDEE` ou `AUTO_DISPONIBLE` apparaissent côté opérateur marketing (`combosEligiblesMarketing`) ; un combo `EN_ATTENTE_DG` affiche « Validation DG requise… » | marketing | : | : | `combo-stock-workflow.ts:46-52` ; `components/marketing/MarketingView.tsx:110-118` |
| 6 | **Création de campagne** : « Créer la campagne » ; idempotent (retourne la campagne existante) ; génère une `CampagneMarketing` `statut = PLANIFIEE`, `canal = WHATSAPP`, durée 14 j, budget = `cibles × 5 500 F`, produits moteurs + lent avec prix promo, commercial assigné selon la zone, recommandation « ne pas appliquer la remise sans le panier moteur » | marketing | `CampagneFromCombo` (`source_combo_id`, + champs `CampagneMarketing`, compteurs `contactes/ouverts/repondus/convertis/ca_genere` à 0) | `CAMPAGNE_CREEE` | `combo-stock-workflow.ts:110-149` ; `ComboStockWorkflowContext.tsx` (`creerCampagne`) |
| 7 | **Retour visible** : la campagne apparaît dans l'onglet « Campagnes », le funnel et le ROI du marketing (`buildCampagnesDG(campagnesFromCombos)`), et « Voir la campagne » ouvre la fiche | marketing / DG | : | : | `MarketingView.tsx:118` ; `CombosStockPanel.tsx:100-108` |
| (hors circuit) | Variante « promo fournisseur → campagne d'écoulement » : `promoFournisseurToCampagne`, même mécanique, `ajouterCampagne/retirerCampagne` (composant `PromotionsFournisseursPanel`, signalé orphelin par l'audit `:35`) | marketing | `PromoFournisseurCampagneInput` | : | `combo-stock-workflow.ts:155-229` |

### 6.2 Ce qui rend ce circuit « branché »
- **Machine à états explicite et persistée** : `EN_ATTENTE_DG → VALIDEE → CAMPAGNE_CREEE` (`combo-stock-workflow.ts:9`) dans deux clés localStorage (`prospera-combo-queue`, `prospera-combo-campagnes`, `:24-25`), donc qui survit au rechargement.
- **Seuil de délégation** codé (`REMISE_SEUIL_DG = 12`) : le DG ne voit que ce qui le concerne.
- **Un objet métier produit par l'étape précédente et consommé par l'étape suivante** (combo → entrée de file → campagne) ; l'étape suivante lit la file de l'étape précédente et refuse si non éligible (`isEligibleForMarketing`).
- **Idempotence** (une seule campagne par combo) et **traçabilité** (`validatedBy`, dates).
- **Toast de confirmation** (`lastAction`) à chaque transition.
- **Limites** : tout est local au navigateur (pas multi-utilisateur) ; la campagne s'arrête à `PLANIFIEE` (aucun envoi WhatsApp, aucun retour de ventes `convertis/ca_genere` ; aucune réservation de stock pour le lot promotionnel, aucun lien avec les commandes) ; le scénario COMBO du plan de liquidation (§3.4) et le circuit Combos sont deux calculs distincts qui ne s'alimentent pas.

### 6.3 Généralisation proposée par le front lui-même
`lib/stock-workflow.ts` reprend le principe sous forme d'un journal générique `(kind, refId)` pour six types d'actions (`TRANSFERT`, `REAPPRO_VALIDATION`, `REAPPRO_BASCULE`, `RECEPTION`, `INVENTAIRE`, `LIQUIDATION`) : on y retrouve l'idempotence et la traçabilité (`by`, `at`) mais **pas** la machine à états, **pas** le seuil de délégation, **pas** d'objet produit pour l'étape suivante. C'est précisément l'écart à combler au PRD : transformer ces six « cases cochées » en circuits à états (§9).

---

## 7. Écarts entre les docs du front et le code (utile pour ne pas hériter d'erreurs)
- `docs/AUDIT_PERSONAS_AMELIORATIONS.md` (tableau §1) est en partie périmé : les boutons « Nouvelle commande terrain », « Ajouter », « Lancer la navette », « Lancer scénario », « Basculer sur alternatif », « Valider la réception » écrivent désormais au journal local (SIMULÉ au lieu de MORT) ; « Saisir le contrôle au quai » calcule maintenant un vrai bilan.
- `docs/personas/gest-entrepot.md` : donne `/commandes` et l'onglet « Commandes fournisseurs » au gestionnaire ; la table `route-access.ts` les lui retire.
- `docs/personas/resp-stock.md` : liste 3 onglets pour `/stock` ; le code en a 6.
- `docs/spec-v2…§5.2` donne `point_commande = vitesse × délai + stock de sécurité` : le code a la fonction, jamais utilisée pour déclencher.
- Spec V2 §5.4 : « `validerCommandeFournisseur` » et « `receptionner` » sont dans l'API du moteur mais non appelées par l'UI.

---

## 8. Règles qui touchent la facturation et le stock réservé

### 8.1 Commande → facture « en un clic »
- **Depuis une commande** (`/commandes`) : n'existe pas. Aucun bouton « Facturer », aucun lien `commande_ref` sur la carte (`CommandeCardDG`, `CommandesView.tsx:48-99`). `Facture.commande_ref?` existe comme champ optionnel (`types/index.ts:128`) et n'est renseigné que dans le registre de factures en dur.
- **Depuis une proforma** (`/facturation`) : « Convertir en commande » (`components/facturation/ProformasView.tsx:174-177`, visible si statut `BROUILLON | ENVOYEE | VUE | ACCEPTEE` et pas déjà convertie) → `FacturationWorkflowContext.convertir` (`contexts/FacturationWorkflowContext.tsx:92-115`) : génère **en une action** une référence de commande `CMD-…` et une référence de facture `FAC-…` (séquence `210 + nombre de conversions + 1`, `:98-101`), passe la proforma à `CONVERTIE`, écrit l'événement `CONVERSION` (idempotent), toast « convertie → commande … · facture … ». Le texte affiché promet « facture à certifier — la proforma est close, la commande part en préparation » (`ProformasView.tsx:185-190`).
  - **Réalité** : seules deux références sont fabriquées. La fonction `convertirEnCommande(p, pdv, typeClient)` (`lib/proforma-builder.ts:119-139`), qui construirait la `Commande` (statut `VALIDEE`, `marge_brute_pct` **fixée à 16**, `montant_societe = montant_ttc` de la proforma, `lignes = nombre de lignes`, entrepôt = `pdv.entrepot_source`), **n'est appelée nulle part**. La commande n'entre donc ni dans le pipeline, ni dans le carnet de l'entrepôt ; la facture n'entre pas dans le registre ; rien n'est certifié.
  - Observation : la proforma est TTC et `Commande.montant_societe` reçoit ce TTC, alors que les autres commandes du registre n'ont pas de notion HT/TTC.
- Cycle documentaire défini en types : `TypeDocument = DEVIS | PROFORMA | FACTURE | AVOIR | FACTURE_ACHAT` (`types/index.ts:151`), `ProformaStatut = BROUILLON | ENVOYEE | VUE | ACCEPTEE | REFUSEE | EXPIREE | CONVERTIE` (`:153-154`), validité par défaut J+15 (`:166`), `EFactureStatut = NON_TRANSMISE | EN_ATTENTE | TRANSMISE | CERTIFIEE | REJETEE` (`:185-186`), `plateforme: OTR_TOGO | INTERNE` (`:197`), conservation légale 10 ans (`:199`). `FactureStatut = BROUILLON | EMISE | PARTIELLE | PAYEE | EN_RETARD` (`:32`).
- **Facturation de l'achat** : la commande fournisseur n'est liée à aucune `FACTURE_ACHAT` dans les écrans lus ; le texte du bilan de réception parle de « facture fournisseur bloquée au paiement » et de « avoir préparé et transmis à la comptabilité fournisseur » sans effet (`reception-engine.ts:250-258`). `components/comptabilite/FacturesAchatPanel.tsx:12,93` mentionne le rapprochement BL ↔ commande, côté comptable.
- Calculs de TVA : 18 % partout (`reappro-engine.ts:20`, `CommandesFournisseursView.tsx:23` en dur `× 1.18`).

### 8.2 Stock réservé
- Définition du réservé dans le code : **« ce que les bons de préparation du jour ont déjà engagé sur chaque référence »**, calculé à l'affichage dans `StockEntrepotView` : somme de `quantite_servie` des lignes de bons dont `blocage = AUCUN` (`components/stock/StockEntrepotView.tsx:38-48`) ; `disponible = stock − réservé` (`:70`).
- Il n'existe **aucun champ `stock_reserve`** sur `ProduitStock`, aucun mouvement « réservation », aucune libération à l'annulation, aucune expiration d'une réservation, aucune réservation à la validation de la commande (la réservation est un **effet du moteur de libération du matin**, pas d'une action de vente). Les commandes `VALIDEE` ne réservent rien tant que la file n'est pas recalculée.
- Règles associées : une commande bloquée crédit ne réserve rien (`picking-engine.ts:307-310`) ; la réservation suit la priorité, la dernière commande libérée voit le stock restant (`:260-274`) ; « c'est LA cause des litiges de livraison » (`:11-14`) ; une commande sans aucune ligne servable n'est pas libérée (`:341-347`) ; l'allocation pilote le texte IA « Allouer stock restant aux magasins ENSEIGNE puis reporter lignes huile partenaires » (`commandes-dg-builder.ts:82-90`) et « Bloquer ventes grossistes » (`stock-dg-builder.ts:317`) qui, eux, ne sont pas exécutés.
- Vérification du stock à la prise de commande : statut simple `RUPTURE | LIMITE | DISPONIBLE` (§2.4), sans réservation ni quantité promise.
- Le stock par site est celui de `REPARTITION_STOCK`, pas `ProduitStock.stock` (qui porte un seul entrepôt) : deux sources à rapprocher (le catalogue split en dur `STOCK_ENTREPOT_SPLIT` en est une troisième).

---

## 9. Constats pour le PRD (synthèse)
1. **Le moteur de règles est riche, l'exécution est creuse.** Picking, vagues, chargement, réception, inventaire ABC, transferts, santé du stock, liquidation, réappro et sélection fournisseur sont de vrais algorithmes avec constantes explicites (2 %/5 % d'écart de réception, 3 % d'inventaire, 25 j de couverture expéditeur, 250 000 F d'auto-transfert, 60 j de surstock, 0,22 de portage, 45 j/0,6 mois de CA pour le blocage crédit, 40 M de plancher de trésorerie, 5 M/20 M de plafonds de validation, 12 % de remise combo). Aucune action ne modifie un stock, une commande, une dette.
2. **Seul le circuit Combos est une machine à états** (détection → validation DG sous seuil → transmission → campagne), partagée entre deux écrans. Les six autres « actions stock » sont des cases cochées dans un journal.
3. **Objets manquants** : ligne de commande, bon de livraison, lot/DLC, litige, grille de prix (société / freelance / segment), mouvement de stock comme source de vérité, réservation de stock, facture d'achat liée à la commande fournisseur, fournisseur éditable.
4. **Incohérences à trancher** : deux modèles de commande (`Commande` / `CommandeTerrain`) ; deux écrans de réception ; statuts de stock codés en dur vs recalculables ; deux notes fournisseur (statique vs score de sélection) ; plancher de trésorerie non bloquant et escalade non unifiée ; valorisation du stock au prix de vente (catalogue) vs au coût (santé du stock) ; `taux_service_pct` truqué ; marge freelance « invisible » vs affichée.
5. **Garde-fous décrits mais non appliqués** : rôle/montant du valideur, plancher de trésorerie, garde-fou anti-stock-mort sur les commandes suggérées, 2 fournisseurs par produit, blocage d'une proforma sous marge minimale.
