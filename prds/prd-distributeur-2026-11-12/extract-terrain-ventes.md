# Extrait PRD Prospera Distributeur — Famille « Terrain et ventes », objectifs, équipes

Source : front de démo `C:/Users/thier/Documents/prospera-font-end/prospera-distributeur` (Next.js, aucun backend : tout vient de registres mockés `src/lib/registries/*` et d'états locaux ou `localStorage`). Les chemins ci-dessous sont relatifs à ce dossier ; `fichier:ligne` pointe le code lu le 12/11/2026.

Lecture rapide des statuts d'action : **BRANCHÉ** = effet persistant réel (ici, jamais côté serveur : au mieux `localStorage`) ; **SIMULÉ** = effet local (état React ou `localStorage`), aucune donnée ne part vers un autre écran ni un serveur ; **MORT** = pas de handler.

Remarque de méthode : `docs/AUDIT_PERSONAS_AMELIORATIONS.md` (juillet 2026) est périmé sur la boucle terrain. Il liste `Y aller`, `Clôturer`, `Ajouter`, `Nouvelle commande terrain`, `Transférer` comme MORTS (§1, lignes 7-10) ; le code actuel les a câblés en SIMULÉ persisté en `localStorage`. De même `docs/personas/commercial.md` dit que le commercial voit `/commercial` ; `route-access.ts:41` l'interdit désormais. Le code fait foi.

---

## 0. Socle transverse (à comprendre avant les écrans)

### 0.1 Rôles et accès (`src/lib/route-access.ts`)

| Route | Rôles autorisés (ligne) |
|---|---|
| `/points-de-vente` (+ `/[id]`) | DG, DC, RESP_VENTES, SUPERVISEUR, COMMERCIAL, FREELANCE, PROSPECTION, MARKETING, RECOUVREMENT (`:38`) |
| `/commercial` | DG, DC, RESP_VENTES, SUPERVISEUR (`:41`) |
| `/tournees` | DG, DC, SUPERVISEUR (`:31`) ; le RESP_VENTES en est exclu volontairement (commentaire `:28-30`) |
| `/mon-activite` | COMMERCIAL, FREELANCE, PROSPECTION (`:24`) |
| `/disponibilite` | COMMERCIAL, FREELANCE, PROSPECTION (`:23`) |
| `/prospection` | DG, DC, RESP_VENTES, PROSPECTION (`:53`) ; le SUPERVISEUR en est exclu |
| `/objectifs` | DG, DC, RESP_VENTES, CONTROLE_GESTION (`:34`) |
| `/equipe` | DG, DC, RESP_VENTES, SUPERVISEUR, CONTROLE_GESTION (`:54`) |
| `/commandes` | DG, DC, RESP_VENTES, SUPERVISEUR, COMMERCIAL, FREELANCE, PROSPECTION, RESP_STOCK (`:17`) |

Une route absente de la table est ouverte à tous (`:9`). Le menu et le garde d'URL lisent la même table (`:5-6`). Libellés de menu par rôle : `src/components/layout/Sidebar.tsx:46-90` (ex. `/points-de-vente` s'appelle « Mes clients » pour COMMERCIAL, « Mon portefeuille » pour FREELANCE, « Mes ouvertures » pour PROSPECTION, « Mon audience » pour MARKETING, « Clients débiteurs » pour RECOUVREMENT ; `/prospection` s'appelle « Ma conquête » pour PROSPECTION ; `/mon-activite` s'appelle « Mon agenda » ; `/commandes` s'appelle « Mes commandes » pour COMMERCIAL/FREELANCE/PROSPECTION).

### 0.2 Périmètre de données (`src/lib/perimetre.ts`, `src/lib/hub-context.ts`)

Quatre assiettes : `RESEAU` (DG, DC, DAF, COMPTABLE, CONTROLE_GESTION, RESP_STOCK, GEST_ENTREPOT, MARKETING, RECOUVREMENT : `perimetre.ts:141-143`), `REGION` (RESP_VENTES, via ses zones), `ZONE` (SUPERVISEUR, une zone), `PORTEFEUILLE` (COMMERCIAL, FREELANCE, PROSPECTION : les PDV dont `commercial === user.nom`) (`perimetre.ts:120`, `:206-250`). Filtre générique : `filtrerParPerimetre` (`perimetre.ts:311-324`). Hiérarchie : DC → Resp. des ventes (région = n zones) → Superviseur (1 zone) → Commerciaux (`src/lib/registries/zones-registry.ts:1-9`).

À retenir pour le PRD : le périmètre est une règle d'accès aux données applicable côté serveur, mais ce front l'applique de façon incohérente selon les écrans (voir le tableau des écarts, §10).

### 0.3 Objets métier de référence (`src/types/index.ts`)

| Type | Lignes | Champs clés / valeurs exactes |
|---|---|---|
| `UserRole` | 1-15 | `DG`, `DC`, `RESP_VENTES`, `SUPERVISEUR`, `COMMERCIAL`, `FREELANCE`, `PROSPECTION`, `RESP_STOCK`, `GEST_ENTREPOT`, `DAF`, `COMPTABLE`, `CONTROLE_GESTION`, `MARKETING`, `RECOUVREMENT` |
| `PipelineStage` | 17-23 | `PROSPECTION`, `PREMIER_CONTACT`, `PREMIERE_COMMANDE`, `ACTIF`, `FIDELE`, `A_RISQUE` |
| `TypeCommercial` | 34 | `SALARIE`, `FREELANCE` |
| `TypeMagasin` | 37 | `PROPRE` (magasin enseigne), `PARTENAIRE` (PDV partenaire B2B) |
| `PointDeVente` | 39-57 | `id`, `nom`, `telephone`, `zone`, `adresse`, `score_ia` (0-100), `pipeline`, `ca_mois`, `creance`, `creance_jours`, `derniere_commande` (date ou `'—'`), `commercial`, `type_proprietaire`, `type_magasin`, `entrepot_source`, `lat`, `lng` |
| `CommandeStatut` | 25-30 | `BROUILLON`, `VALIDEE`, `PREPARATION`, `LIVREE`, `ANNULEE` |
| `TypeClientCommande` | 59 | `DEPOT`, `GROSSISTE`, `SUPERETTE`, `ENSEIGNE`, `EPICERIE`, `KIOSQUE` |
| `PrioriteCommandeIA` | 61 | `HAUTE`, `NORMALE`, `BLOQUEE` |
| `Commande` | 63-84 | `reference`, `pdv_id`, `pdv_nom`, `commercial`, `type_commercial`, `montant_societe`, `montant_client?`, `marge_freelance?`, `statut`, `lignes` (nombre), `zone`, `entrepot`, `type_magasin`, `type_client`, `marge_brute_pct`, `familles[]`, `priorite_ia`, `alerte?` |
| `CommercialKpi` | 417-428 | `id`, `nom`, `zone`, `type`, `visites_jour`, `visites_objectif`, `commandes_jour`, `ca_jour`, `marge_jour?`, `score_ia` |
| `MotifVisite` | 431-437 | `REASSORT`, `RELANCE_IMPAYE`, `PROSPECTION`, `LANCEMENT_PRODUIT`, `FIDELISATION`, `RECLAMATION` |
| `StatutVisite` | 439 | `PLANIFIEE`, `EN_COURS`, `FAITE`, `REPORTEE`, `ANNULEE` |
| `ResultatVisite` | 442 | `COMMANDE`, `SANS_SUITE`, `PROMESSE`, `ENCAISSEMENT`, `ABSENT` |
| `Visite` | 444-470 | `id`, `commercial`, `pdv_id`, `pdv_nom`, `zone`, `adresse`, `lat`, `lng`, `date` (ISO), `heure` (HH:MM), `duree_min`, `motif`, `statut`, `ordre`, `resultat?`, `montant_commande?`, `montant_encaisse?`, `commentaire?`, `conseil_ia?` |
| `CommercialRegistryEntry` | `src/lib/registries/commerciaux-registry.ts:11-17` | étend `CommercialKpi` + `email`, `superviseur`, `grille_client_personnalisee?` |
| `ZoneDistribution` | `zones-registry.ts` (≈ lignes 22-45) | `cle`, `region_id`, `superviseur`, `commerciaux`, `freelances`, `pdv_actifs`, `ca_mois`, `ca_objectif`, `creances_retard`, `creances_pct`, `couverture_visites_pct`, `commandes_jour`, `score_sante`, `statut` (`SAIN`/`ATTENTION`/`CRITIQUE`), `ruptures_stock`, `pdv_a_risque`, `pdv_non_visites_15j` |

Données de démo : ~620 PDV (13 nommés + ~610 générés, `pdv-registry.ts:6-36`), 22 commerciaux (`commerciaux-registry.ts:20-43`), 2 régions (Grand Lomé, Nord), visites générées sur 3 semaines passées et 2 à venir pour chaque commercial qui a un portefeuille (`tournees-registry.ts:13-19`, `:189-203`). Date de référence figée : `DATE_AUJOURDHUI = '2026-06-11'` (`tournees-registry.ts:7`).

### 0.4 Persistance locale (`src/lib/persistence.ts`, `src/lib/terrain-workflow.ts`)

Tout le « workflow » terrain est un `localStorage` navigateur (`loadJSON`/`saveJSON`, `persistence.ts:9-26`). Clés : `prospera-terrain-visites`, `prospera-terrain-panier`, `prospera-terrain-commandes` (`terrain-workflow.ts:15-17`) ; `prospera-prospection-recensement`, `prospera-prospection-transferts` (`prospection-workflow.ts:334-335`). Le quota dépassé est ignoré en silence (`persistence.ts:23-25`). Le commentaire d'en-tête parle d'« offline-first light » (`terrain-workflow.ts:8-9`). Il n'y a ni service worker, ni file de synchronisation, ni détection de réseau dans le code (recherche `navigator.onLine|serviceWorker|queue` : seule la file de combos stock, hors périmètre).

---

## 1. `/points-de-vente` — « Réseau clients & magasins »

Composant : `src/components/pdv/PointsDeVenteView.tsx` ; hub : `src/lib/pdv-hub.ts` (`getPdvHub(ctx)` applique `scopeAuPerimetre`) ; calculs : `src/lib/pdv-rapport-builder.ts`.

### 1.1 Ce que l'écran montre
- Titre « Réseau clients & magasins », sous-titre variable : « Mon portefeuille » (COMMERCIAL/FREELANCE/PROSPECTION), « Mes zones » (SUPERVISEUR/RESP_VENTES), **« Vue DG » pour tous les autres rôles y compris MARKETING et RECOUVREMENT** (`PointsDeVenteView.tsx:28-32`, `:76`). Badge fixe `${total} points · échantillon réseau 1 847` pour tous (`:77`).
- Six KPI (`:82-89`) : CA réseau, Magasins enseigne, Partenaires B2B, Impayés total, À risque, Prospection. Les libellés ne changent pas selon le rôle (un commercial lit « CA réseau » sur son propre portefeuille).
- Bloc « Synthèse exécutive IA — réseau » (« Synthèse IA — mon portefeuille » pour le terrain, `:113`) : alertes (CRITIQUE/HAUTE/MODEREE), paragraphe de synthèse, liste « Actions prioritaires réseau » (`:100-136`), produits par `buildPdvReseauSyntheseIA` (`pdv-rapport-builder.ts:321-420`).
- Répartition par zone (boutons-filtres avec nombre et CA, `:139-153`), recherche texte (nom ou zone), filtre type (Tous types / Enseigne / Partenaires), filtre pipeline (liste `PIPELINE_STYLE`), pagination 24 par page (`:21`, `:278-300`).
- Grille de fiches : nom, badge ENSEIGNE/PARTENAIRE, badge pipeline, zone · entrepôt source · commercial, score IA (pastille), CA mois, évolution %, commandes/mois, créance ; pastilles « Impayé Nj », « N rupture(s) SKU », « Inactif Nj » (`:194-269`). Tri fixe par CA décroissant (`:56`).
- Pied de page : « Cliquez sur une fiche pour le rapport détaillé DG » affiché à tous (`:304`) ; au survol « Ouvrir la fiche client → » (terrain) ou « Ouvrir le rapport DG → » (`:267`).

### 1.2 Objets et champs
`PointDeVente` et `PipelineStage` (§0.3). Libellés pipeline (`entreprise-registry.ts:27-34`) : Prospection, Premier contact, 1ère commande, Client actif, Client fidèle, À risque. Enrichissement liste (`enrichPdvListeItem`, `pdv-rapport-builder.ts:422-432`) : `ca_evolution_pct`, `commandes_mois`, `produits_rupture`, `jours_inactif`.

### 1.3 Actions
| Libellé | Fichier:ligne | État |
|---|---|---|
| Fiche PDV (lien vers `/points-de-vente/[id]`) | `PointsDeVenteView.tsx:198` | BRANCHÉ (navigation) |
| Filtres zone / type / pipeline / recherche / pagination « Précédent » « Suivant » | `:142-190`, `:280-298` | BRANCHÉ (état local) |
| Aucune action de création, d'édition, d'affectation ni d'export de PDV | — | ABSENT |

### 1.4 Règles de calcul
- **Score santé IA (0-100)** : aucune formule dans le front. C'est une donnée du registre. Les PDV nommés ont un score saisi à la main ; pour les ~610 PDV générés : base aléatoire 55-95 ; si pipeline `A_RISQUE` base 28-48 ; si `FIDELE` base 78-96 ; plafonné à 45 si `creance_jours > 30` (`src/lib/generators/generate-pdv.ts:101-107`). Couleur de la pastille (`utils.ts:25-29`) : ≥ 70 vert, ≥ 40 ambre, sinon rouge.
- Évolution du CA M-1 : déterministe par hash de l'id (`generate-pdv.ts:171-183`), valeurs forcées pour `pdv-3` (−28) et `pdv-9` (0). Donnée fictive.
- Seuils d'alertes visuelles : « Impayé Nj » si `creance_jours > 30` ; « Inactif Nj » si `jours_inactif > 21` et `ca_mois > 0` ; `jours_inactif` calculé contre une date figée `2026-06-10` (`pdv-rapport-builder.ts:77-82`).
- Synthèse réseau : `a_risque` = pipeline `A_RISQUE` ; clients « en baisse » si évolution < −5 % ; « en hausse » si > +5 % ; alerte CRITIQUE « Impayés > 30 jours » si `creance_jours > 30` (`:325-360`).
- **Segmentation actifs / dormants / VIP : n'existe pas dans le code Distributeur.** Le seul découpage client est le `pipeline` (6 valeurs). Le mot « dormant » n'apparaît que pour le stock (`SanteStockPanel.tsx`) et pour les ouvertures de prospection (§7). La seule règle de « réactivation de clients dormants » est une automatisation marketing (`src/lib/automation/marketing-automations.ts:67-80`), hors périmètre. Si le PO attend actifs/dormants/VIP, c'est à spécifier, pas à reprendre.

### 1.5 IA
Score IA par PDV (donnée), « Synthèse exécutive IA » en texte généré par gabarit (`pdv-rapport-builder.ts:388-413`), « Actions prioritaires réseau » (`:376-381`). Présentation : icône étincelle indigo, `AiBadge` avec confiance fixe 88 (`PointsDeVenteView.tsx:114`), pied « Scoring IA temps réel » (`:303`). Rien n'est calculé par un modèle ; ce sont des gabarits de phrases.

---

## 2. `/points-de-vente/[id]` — fiche rapport d'un PDV

Composant : `src/components/pdv/PdvRapportView.tsx` ; page : `src/app/(dashboard)/points-de-vente/[id]/page.tsx:1-9` ; builders : `buildPdvRapportDG` (`pdv-rapport-builder.ts:140-218`) et `buildPdvContexteCommercial` (`:244-283`).

### 2.1 Ce que l'écran montre
- En-tête : nom, badge MAGASIN ENSEIGNE / PARTENAIRE B2B, badge pipeline, adresse, téléphone, entrepôt source, commercial ; **score santé IA** en grand avec `AiBadge` (« Fiche client » pour le terrain, « Rapport DG » sinon, confiance = le score) (`PdvRapportView.tsx:57-87`).
- Alertes (`buildAlertes`, `pdv-rapport-builder.ts:93-114`), synthèse IA, 9 KPI : CA mois (+ évolution), CA moyen 6 mois, Commandes, Panier moyen, BL/mois, Délai livraison (+ taux de service), Créance, **Rang zone**, Dernière commande (`:109-128`).
- Histogramme CA sur 6 mois (recharts, `:131-146`), tableau « Assortiment & évolution produits » (quantité, évolution, part de volume, Rupture/OK, `:262-302`), « Dernières commandes » (`:305-328`), « Facturation & créances » (`:331-354`), bloc « Actions prioritaires DG » (`:357-371`).
- Colonne contextuelle à droite (`:148-259`) : **variante terrain** (COMMERCIAL, FREELANCE, PROSPECTION) = carte « Ma fiche client » : objectif du mois avec barre de progression, dernière visite (date, résultat, commentaire), relances à faire (4 max), ruptures au PDV, bouton « Appeler {nom} » ; **variante encadrement** = « Contexte zone » : rang CA zone, nb enseignes, nb partenaires, saturation partenaires, impayés de la zone, analyse logistique.

### 2.2 Objets
`PdvRapportDG` (`pdv-rapport-builder.ts:62-75`) : `pdv`, `kpis` (`PdvKpiRapport` : `ca_mois`, `ca_evolution_pct`, `ca_moyen_6m`, `commandes_mois`, `panier_moyen`, `livraisons_mois`, `delai_livraison_j`, `taux_service_pct`, `jours_depuis_commande`), `ca_sparkline_6m`, `produits[]`, `commandes[]`, `factures[]`, `contexte_zone`, `alertes[]` (`severite` = `CRITIQUE`/`HAUTE`/`MODEREE`), `synthese_ia`, `actions_prioritaires[]`, `analyse_logistique`, `analyse_financiere`. `PdvContexteCommercial` (`:225-242`) : `derniere_visite?`, `relances_a_faire[]`, `ruptures[]`, `objectif_mois_fcfa`, `progression_objectif_pct`.

### 2.3 Actions
| Libellé | Fichier:ligne | État |
|---|---|---|
| « Retour réseau clients » | `PdvRapportView.tsx:53` | BRANCHÉ (lien) |
| « Appeler {nom du PDV} » | `:218-225` | BRANCHÉ (lien `tel:` réel) — seul appel réel du périmètre |
| Aucun bouton « Planifier une visite », « Créer une commande », « Créer une relance », « Modifier la fiche » | — | ABSENT |

### 2.4 Règles de calcul
- `commandes_mois` : nb de commandes du registre pour ce PDV + `max(2, round(ca_mois/400 000))`, sinon `round(ca_mois/400 000)` (`:147`). Panier moyen = `ca_mois / commandes_mois` (`:148`). **Fabriqué.**
- `ca_moyen_6m` = `ca_mois × 0,92` (`:160`). Histogramme 6 mois : `base × (0,82 + i×0,035 + évolution si dernier)` (`:84-91`). **Fabriqué.**
- `taux_service_pct` : 96 si magasin enseigne, 72 si `A_RISQUE`, sinon 89 (`:165`). **Codé en dur.**
- Alertes : CRITIQUE si `creance_jours > 30` (« plafond crédit dépassé · risque coupure approvisionnement ») ; HAUTE si créance > 0 ; HAUTE si `jours_depuis_commande > 21` ; MODEREE si `delai_livraison_j > 3` (objectif codé « 1,5 j ») ; HAUTE si rupture produit ; MODEREE si PDV partenaire et saturation ≥ 75 % (`:93-114`).
- Rang zone : classement par `ca_mois` parmi les PDV de la zone avec `ca_mois > 0` (`:150-152`). Saturation partenaires = part de PDV partenaires dans la zone (`:195-197`).
- **Objectif du mois du terrain = `ca_mois × 1,1`** ; progression = `min(100, round(ca_mois/objectif×100))` (`:260-261`). Circulaire : l'objectif est dérivé du réalisé, la progression vaut toujours ≈ 91 %. Aucun objectif par PDV n'existe dans le modèle de données.
- Dernière visite = visite `FAITE` la plus récente du registre ; relances à faire = relances du PDV en statut `PLANIFIEE`, `DETECTION` ou `ENVOYEE` (`:248-255`).

### 2.5 IA
Synthèse IA : 4 gabarits selon le cas (à risque / enseigne / prospect / standard) (`:116-127`). Actions prioritaires : jusqu'à 4 phrases par règle (`:129-138`), par exemple « Bloquer BL crédit et lancer recouvrement terrain sous 48h », « Escalade superviseur zone + négociation échéancier impayé ». Le titre devient « Mes prochaines actions » pour le terrain mais **le contenu reste celui du DG** (`PdvRapportView.tsx:361-368`). Présentation : encart dégradé indigo/ambre, badge de confiance = score IA du PDV (confusion entre score de santé et confiance).

---

## 3. `/commercial` — « Pilotage commercial terrain »

Composant : `src/components/commercial/CommercialTerrainView.tsx` (+ carte `CarteCommercialDG.tsx`) ; logique : `src/lib/commercial-terrain-dg-builder.ts`. Rôles : DG, DC, RESP_VENTES, SUPERVISEUR.

### 3.1 Ce que l'écran montre
- Six KPI (`CommercialTerrainView.tsx:158-165`) : Équipes, Visites jour (x/objectif et % objectif), CA terrain, Couverture (moyenne), Impayés (nb de PDV à relancer), Alertes GPS. Badge « Temps réel » (`:172`) alors que les positions sont des constantes (`commercial-terrain-dg-builder.ts:53-58`).
- Carte Leaflet / OpenStreetMap (`CarteCommercialDG.tsx:65`, pas Google Maps) : commerciaux (avatar coloré, rouge si `ALERTE_GPS`, vert lime si freelance), PDV visités / à visiter / prioritaires, option « Itinéraire », bascule « Grand Lomé » / « Kara & Centrale » (`:203-221`).
- Barre « Progression visites du jour » (PDV visités / total), « Top : {nom} ({score}) » (`:243-258`).
- Panneau « Analyses IA » (liste d'alertes) et « Coaching prioritaire » (4 VRP max) (`:262-324`).
- Fiche du commercial sélectionné : synthèse IA, CA mois, évolution, impayés, prospects, marge/jour (`:329-359`).
- « Équipes commerciales » : recherche, filtres Tous / À coacher / Freelances, 8 lignes puis « Voir les N autres VRP » ; ligne = avatar, nom, FL, statut de position, score IA, barre visites x/objectif, barre couverture, CA jour (`:362-412`). Trois classements : Top CA jour, Top couverture, Top score IA (5 chacun, `:414-426`).

### 3.2 Objets
`CommercialPositionDG` : `commercial_id`, `lat`, `lng`, `derniere_maj` (HH:MM), `statut` = `EN_TOURNEE` / `BUREAU` / `PAUSE` / `ALERTE_GPS`. `CommercialTerrainDG` (étend `CommercialRegistryEntry`) : `position`, `pdv_portefeuille`, `pdv_visites_jour`, `couverture_secteur_pct`, `impayes_a_relancer`, `prospects_actifs`, `commandes_mois`, `ca_mois`, `evolution_mois_pct`, `gps_conformite_pct`, `alerte?`, `synthese_ia`, `action_ia`. `VisitePdvCarte` : `visite_aujourdhui`, `priorite` (`HAUTE`/`NORMALE`/`BASSE`), `motif?`. `AnalyseTerrainIA` : `severite`, `titre`, `detail`, `commercial?`, `action` (`commercial-terrain-dg-builder.ts:10-51`).

### 3.3 Actions
| Libellé | Fichier:ligne | État |
|---|---|---|
| « Grand Lomé » / « Kara & Centrale » (cadrage carte) | `CommercialTerrainView.tsx:204-213` | BRANCHÉ (état local) |
| « Itinéraire » (afficher / masquer le tracé) | `:214-220` | BRANCHÉ (état local) |
| Clic sur un commercial (ligne, coaching, carte) | `:60`, `:298`, `:396` | BRANCHÉ (sélection) |
| Filtres « Tous » / « À coacher » / « Freelances », recherche, « Voir les N autres VRP » / « Réduire » | `:378-387`, `:404-410` | BRANCHÉ (état local) |
| Aucune action « Appeler », « Réaffecter des PDV », « Planifier un coaching » alors que les analyses les recommandent | — | ABSENT |

### 3.4 Règles de calcul
- Statut de position (hors 4 commerciaux nommés en dur) : `ALERTE_GPS` si `score_ia < 72` ; `PAUSE` si `visites_jour < 85 % de visites_objectif` ; `BUREAU` avec 8 % de chance (aléatoire déterministe) ; sinon `EN_TOURNEE` (`:122-126`). Un score de performance sert donc d'alerte GPS : **pas de vraie donnée GPS**.
- Couverture secteur (générée) : `clamp(58, 98, visitesJour / portefeuille × 100)` ; alerte si < 65 % ; alerte GPS si `gps < 76` et `score_ia < 72` (`:147-164`).
- Synthèse : `taux_visites_pct = Σ visites / Σ objectif` ; `couverture_moyenne` ; `alertes_gps` = `ALERTE_GPS` **ou** `gps_conformite_pct < 80` ; `sous_perf` = `visites_jour < objectif` ou couverture < 75 (`:249-272`).
- **Priorité de coaching** (`coachingPriority`, `:322-332`) : +50 si `ALERTE_GPS` ; +35 si couverture < 65, sinon +18 si < 72 ; +28 si score IA < 72, sinon +12 si < 75 ; +22 si impayés à relancer > 0 ; +14 si visites < 85 % de l'objectif. Entrent dans « à coacher » ceux dont le total ≥ 20, 4 maximum triés par priorité (`:340-343`).
- Seuils couleur couverture : ≥ 85 vert, ≥ 70 ambre, sinon rouge (`CommercialTerrainView.tsx:98`).
- Priorité PDV sur la carte : `HAUTE` si `creance_jours > 30` ou `A_RISQUE` ou `PROSPECTION` (`commercial-terrain-dg-builder.ts:244`). L'ensemble des visites « aujourd'hui » de la carte est une table codée en dur par id de PDV (`:235-239`).
- `score_ia` du commercial : valeur de registre (`commerciaux-registry.ts`), aucune formule.

### 3.5 IA
« Analyses IA » : 4 à 5 messages dont la plupart sont **écrits en dur sur des personnes nommées** (Mawuena Ahi c-3, Komlan Tetteh c-1, Kofi Agbessi, Kiosque Port) (`:274-320`). `synthese_ia` / `action_ia` : phrases saisies pour 4 commerciaux, gabarits pour les autres (`:72-204`). Présentation : `AiBadge` « Live » pulsant sur la carte, étincelle indigo, bandeau « → action » par alerte.

---

## 4. `/tournees` — « Tournées & Cash »

Composant : `src/components/tournees/TourneesView.tsx` ; logique : `src/lib/tournees-builder.ts` (`buildTournees(perimetre)`). Rôles : DG, DC, SUPERVISEUR.

### 4.1 Ce que l'écran montre
- Quatre KPI (`TourneesView.tsx:163-194`) : Couverture du PJP, Strike rate (« cible 50 % »), Espèces remises (sur espèces encaissées), Écart de caisse.
- Carte d'équipe (visites du jour du périmètre, couleur par commercial, tracé par commercial) et **« Rejeu de la journée »** : sélection d'un commercial, lecture / pause / arrêt précédent / suivant / curseur, avance d'un arrêt toutes les ~950 ms (`:92-150`, `:197-285`).
- Tableau « Plan de journée par commercial » trié par couverture croissante : PJP réalisé/planifié, strike rate, espèces encaissées, écart de caisse (« juste » ou montant négatif), jours sans remise, statut (`:288-357`).
- « Alertes du jour » (6 maximum) et « Exécution en magasin » (5 critères avec % et cible) (`:359-421`).

### 4.2 Objets
`TourneeCommercial` (`tournees-builder.ts:27-50`) : `commercial`, `zone`, `type`, `statut` (`StatutTournee` = `EN_COURS` / `TERMINEE` / `NON_DEMARREE`), `pjp_planifie`, `pjp_realise`, `visites_avec_commande`, `strike_rate`, `couverture_pjp`, `cash_encaisse`, `cash_remis`, `ecart_caisse` (négatif = manquant), `jours_sans_remise`, `km_parcourus`, `derniere_position`. `AlerteTournee` : `severite` = `CRITIQUE` / `MODEREE`, `commercial`, `titre`, `detail`, `action` (`:52-58`). `ExecutionMagasin` : `critere`, `conforme`, `total`, `pct`, `cible` (`:60-66`). `HubTournees` : agrégats de zone (`:123-136`).

### 4.3 Actions
| Libellé | Fichier:ligne | État |
|---|---|---|
| Sélecteur « Rejeu » (Vue équipe (tous) / un commercial) | `TourneesView.tsx:212-221` | BRANCHÉ (état local) |
| Boutons lecture / pause / retour au départ / arrêt suivant, curseur | `:228-266` | BRANCHÉ (animation locale) |
| Aucun bouton « Valider l'écart », « Enregistrer une remise de caisse », « Rappeler le VRP », « Replanifier » | — | ABSENT (l'écran est 100 % lecture seule ; l'audit §3.4 le disait déjà) |

### 4.4 Règles de calcul (formules telles que codées)
- `pjp_planifie = visites_objectif` ; `pjp_realise = min(visites_jour, planifié + 4)` (`tournees-builder.ts:84-85`).
- **Strike rate** = `round(commandes_jour / pjp_realise × 100)` (`:87`), agrégé : `Σ commandes / Σ visites réalisées` (`:157`). Le code appelle `visites_avec_commande` ce qui est en réalité `commandes_jour` du commercial. **Taux de conversion visite → commande** = ce strike rate. Cible codée : 50 % ; vert si ≥ 50, ambre si ≥ 40, rouge sinon (`TourneesView.tsx:325`).
- `couverture_pjp = round(pjp_realise / pjp_planifie × 100)` (`:88`) ; vert ≥ 100, gris ≥ 80, rouge sinon (`TourneesView.tsx:319`). Statut tournée : `TERMINEE` si couverture ≥ 100, `EN_COURS` si > 0, sinon `NON_DEMARREE` (`:100-102`).
- **Espèces encaissées** = `round(ca_jour × 0,55 / 5 000) × 5 000` (hypothèse : 55 % des ventes en espèces) (`:90-91`).
- **Écart de caisse** : tirage pseudo-aléatoire déterministe par nom ; si > 0,82 alors manquant = 2 % à 6 % des espèces encaissées (arrondi au millier) (`:93-96`) ; `ecart_caisse = cash_remis − cash_encaisse` ; `jours_sans_remise` = 1 à 3 si manquant, sinon 0 (`:98`). **Il n'existe aucune saisie de remise de caisse** : la donnée est simulée.
- Alertes (`construireAlertes`, `:171-205`) : « Écart de caisse » CRITIQUE si `ecart_caisse < 0` ; « PJP non tenu » MODEREE si couverture < 80 % ; « Strike rate faible » MODEREE si `strike_rate < 40` et `pjp_realise > 5` ; liste tronquée à 6. Action suggérée pour l'écart : « Rapprochement immédiat des reçus terrain · remise en main propre exigée ce soir ».
- **Exécution en magasin** (`:211-228`) : cinq critères aux pourcentages codés en dur — Références obligatoires présentes 78 % (cible 90), Prix affiché conforme 64 % (95), PLV 71 % (80), Facing / planogramme 58 % (75), Aucun produit périmé 92 % (100). Ces pourcentages ne dépendent d'aucune donnée ; `total` = `max(12 × nb de commerciaux, 24)`. Le commentaire dit « critères que le commercial coche en boutique » : **aucun écran de saisie de ces critères n'existe côté commercial** (`ClotureVisiteModal` ne les contient pas).
- `km_parcourus` = 18 à 58 (aléatoire déterministe). `derniere_position` = « {zone} — secteur 1-4 » (fictif).
- Les visites de la carte et du rejeu viennent du `REGISTRE_VISITES` filtré par périmètre (`TourneesView.tsx:51-53`), alors que les KPI viennent de `CommercialKpi`. **Deux sources non réconciliées**, et la clôture faite par le commercial dans `/mon-activite` (localStorage) ne remonte pas ici.

### 4.5 IA
Badge `AiBadge` sur « Alertes du jour » (`:364`). Les alertes sont des règles à seuils, pas un modèle. Aucun score IA propre à l'écran.

---

## 5. `/mon-activite` — « Mon activité » (menu : « Mon agenda »)

Composant : `src/components/terrain/MonActiviteView.tsx` ; modal : `ClotureVisiteModal.tsx` ; hub : `src/lib/tournee-hub.ts` ; workflow : `src/contexts/TerrainWorkflowContext.tsx`, `src/lib/terrain-workflow.ts` ; itinéraire : `src/lib/itineraire-builder.ts`. Rôles : COMMERCIAL, FREELANCE, PROSPECTION.

### 5.1 Ce que l'écran montre
- En-tête « Mon activité — Votre agenda terrain — {zone} » ; badge **« Mode offline OK »** (COMMERCIAL / PROSPECTION) ou « Portefeuille indépendant » (FREELANCE) (`MonActiviteView.tsx:224-228`). Le badge « offline » est une chaîne statique, il n'y a pas de mode hors ligne dans le code.
- Quatre KPI de la semaine (`:230-257`) : « Visites cette semaine » (faites / planifiées, avec « N arrêt(s) restants aujourd'hui »), « Commandes prises » (avec « x % de transformation »), « CA généré » (« CA société généré » pour le freelance), « Encaissé sur le terrain » (« Créances soldées en visite »).
- Trois onglets (`:260-278`) : « Tournée du jour », « Semaine », « Historique ».
  - **Tournée du jour** : carte du jour (marqueurs colorés par statut : bleu à visiter, ambre en cours, vert faite), bandeau « Optimiser le trajet » / « Lancer l'itinéraire (N) », encart « Prochain arrêt : {PDV} à {heure} » avec la phrase « Tournée ordonnée par priorité, impayés et réclamations traités en premier », liste des `VisiteCard` (`:280-369`).
  - **Semaine** : navigation ◀ ▶ par semaine (lundi → samedi), 6 tuiles jour (nb de visites, barres colorées par motif, « N faites » pour les jours passés, « Repos »), détail du jour choisi avec son résumé « N visite(s) · N commande(s) · CA » (`:371-452`).
  - **Historique** : tableau Date / Point de vente / Motif / Résultat / Montant (40 dernières visites faites, `:454-493`).
- Carte de visite (`VisiteCard`, `:47-124`) : heure + durée, numéro d'ordre, nom du PDV, pastille de motif, pastille de statut, adresse · zone, **conseil IA**, résultat + montants + commentaire.

### 5.2 Objets
`Visite`, `MotifVisite`, `StatutVisite`, `ResultatVisite` (§0.3). `VisiteOverride` (`terrain-workflow.ts:20-29`) : `visiteId`, `statut`, `demarreeAt?`, `clotureeAt?`, `resultat?`, `montant_commande?`, `montant_encaisse?`, `commentaire?` — mutation locale par-dessus la visite du registre ; `appliquerOverrides` (`:73-89`) ne recopie pas `demarreeAt`/`clotureeAt` dans la `Visite`. `StatsSemaine` : `visites_planifiees`, `visites_faites`, `commandes`, `ca_genere`, `encaisse`, `taux_reussite_pct` (`tournee-hub.ts:118-125`). `JourTournee` (`:127-135`).

Libellés exacts : statuts Planifiée / En cours / Faite / Reportée / Annulée (`tournee-hub.ts:235-241`) ; motifs « Relance impayé », « Réclamation », « Réassort », « Lancement produit », « Fidélisation », « Prospection » (`:243-250`) ; résultats « Commande », « Encaissement », « Promesse », « Sans suite », « Client absent » (`:252-258`).

### 5.3 Actions
| Libellé | Fichier:ligne | État |
|---|---|---|
| « Y aller » (visite PLANIFIEE) | `MonActiviteView.tsx:109-120` → `ouvrirNavigation` `:201-206` → `demarrerVisite` (`TerrainWorkflowContext.tsx:74-80`) | **SIMULÉ persisté en localStorage** : passe la visite à `EN_COURS` + horodate `demarreeAt`, ouvre Google Maps (`https://www.google.com/maps/dir/?api=1&destination=lat,lng`). Pas de géolocalisation de départ, pas de contrôle qu'une autre visite n'est pas déjà `EN_COURS` |
| « Clôturer » (visite EN_COURS) | `:109-120` → `ClotureVisiteModal` → `cloturerVisite` (`TerrainWorkflowContext.tsx:82-97`) | **SIMULÉ persisté en localStorage** : passe à `FAITE`, enregistre résultat, montants, commentaire, `clotureeAt`. **Ne crée aucune commande, aucun encaissement, aucun écran d'écart de caisse** : les montants sont saisis librement |
| « Optimiser le trajet » / « Trajet optimisé activé » | `:316-325` | BRANCHÉ (calcul local) : bascule entre l'ordre de priorité et l'ordre plus-proche-voisin ; désactivé si le gain ≤ 0 km |
| « Lancer l'itinéraire (N) » | `:326-332` → `lienNavigationMulti` | BRANCHÉ : ouvre Google Maps multi-arrêts (origine = 1er arrêt, destination = dernier, le reste en `waypoints`) (`itineraire-builder.ts:91-102`) |
| ◀ ▶ semaine, tuiles jour, onglets | `:260-278`, `:373-424` | BRANCHÉ (état local) |
| Modal de clôture : radios de résultat (5), « Vérifier ma position », « Annuler », « Clôturer » | `ClotureVisiteModal.tsx:109-125`, `:172-179`, `:227-240` | BRANCHÉ côté UI (voir règles) |
| Aucune action « Reporter », « Annuler la visite », « Ajouter une visite », « Photo », « Réclamation » alors que `REPORTEE` et `ANNULEE` existent comme statuts | — | ABSENT |

### 5.4 Règles de calcul et de contrôle
- **Agenda du commercial** : un rôle de portefeuille ne voit que `REGISTRE_VISITES.filter(commercial === nom)` ; les rôles d'encadrement reçoivent un agenda vide (`tournee-hub.ts:193-197`). Journée : 5 à 9 visites, 1er arrêt 08:00, un arrêt toutes les 65 minutes, durée 20-45 min, semaine lundi → samedi, dimanche non tourné (`tournees-registry.ts:10-14`, `:154-155`).
- **Ordre de la tournée = priorité métier** : `RELANCE_IMPAYE` (0), `RECLAMATION` (1), `REASSORT` (2), `LANCEMENT_PRODUIT` (3), `FIDELISATION` (4), `PROSPECTION` (5) (`tournees-registry.ts:69-78`). **Motif choisi à partir de l'état du PDV** (`:60-67`) : créance > 0 et `creance_jours > 7` → `RELANCE_IMPAYE` ; pipeline `PROSPECTION` ou `PREMIER_CONTACT` → `PROSPECTION` ; `A_RISQUE` → `RECLAMATION` ou `FIDELISATION` (50/50) ; `FIDELE` → `LANCEMENT_PRODUIT` (30 %) ou `REASSORT` ; sinon `REASSORT`. Sélection quotidienne par rotation du portefeuille : `portefeuille[(offset + i×3) % taille]`, offset = hash(commercial|date) (`:128-135`). C'est la seule logique de planification du code ; en vrai produit c'est le point à spécifier (qui planifie, avec quelle fréquence par segment).
- **Taux de transformation** : `round(commandes / visites faites × 100)` (`tournee-hub.ts:183`) ; flèche verte si ≥ 55 (`MonActiviteView.tsx:243`). Commandes = visites `FAITE` de résultat `COMMANDE` ; CA = Σ `montant_commande` de ces visites ; encaissé = Σ `montant_encaisse` des visites faites (`tournee-hub.ts:172-185`).
- **Itinéraire** (`itineraire-builder.ts`) : distance à vol d'oiseau (haversine), vitesse moyenne 22 km/h, 12 min d'arrêt par PDV (`:28-30`), durée = km/22×60 + 12×nb d'arrêts (`:46-51`) ; optimisation par plus proche voisin depuis la visite en cours ou le 1er arrêt (`:57-85`). Compare « Ordre priorité » à « Meilleur trajet » et affiche le gain en km et en % (`MonActiviteView.tsx:174-181`). Heuristique ; pas d'API de routage (`:9-10`).
- **Contrôle de présence (géofencing)** : au clic « Vérifier ma position », `navigator.geolocation.getCurrentPosition` (timeout 8 s, haute précision), distance haversine au PDV, **rayon 200 m** (`ClotureVisiteModal.tsx:10-11`, `:47-67`). États `idle` / `checking` / `ok` / `loin` / `erreur`. Si « loin » : message « La clôture reste possible mais sera signalée » ; à la validation, ajout au commentaire de la mention `[GPS ✓ 120 m du PDV]` ou `[GPS ⚠ 3.4 km du PDV]` (`:73-87`). Le contrôle est **facultatif** (on peut clôturer sans l'avoir lancé) et **la trace n'est qu'une chaîne dans le commentaire**, pas un champ typé.
- **Saisie à la clôture** : `COMMANDE` demande `montant_commande` ; `COMMANDE` et `ENCAISSEMENT` demandent `montant_encaisse` (« Mobile Money / espèces ») ; les autres résultats n'ont pas de montant (`:42-43`, `:128-164`). Aucune validation (montants vides acceptés, aucun plafond, pas d'obligation d'un motif pour `SANS_SUITE`/`ABSENT`). Total visite = commande + encaissé (`:216-223`).
- **Freelance** : libellé « CA société généré » (`MonActiviteView.tsx:246`), « (tarif société) » accolé aux montants de commande (`:96`, `ClotureVisiteModal.tsx:131`). La marge propre du freelance n'est ni saisie ni calculée ici (l'audit §3.6 le regrettait).

### 5.5 IA
`conseil_ia` par visite planifiée ou en cours, tiré d'un catalogue de phrases par motif (3 phrases pour réassort / relance impayé / prospection, 2 pour lancement produit / fidélisation / réclamation) (`tournees-registry.ts:21-47`, affectation `:178`). Exemples : « Rotation en hausse sur les boissons : pousser le pack soda 24 », « Client bon payeur historiquement : privilégier l'encaissement cash sur place ». Présentation : encart gris avec icône étincelle ambre dans la carte de visite (`MonActiviteView.tsx:83-88`), `AiBadge` neutre sur « Prochain arrêt » (`:343-350`). Le choix du conseil est aléatoire parmi le catalogue, sans lien avec les données réelles du PDV. Ni score ni confiance affichés.

---

## 6. `/disponibilite` — « Disponibilité produits » et panier de commande

Composants : `src/components/terrain/DisponibiliteView.tsx`, `PanierDrawer.tsx` ; contexte : `TerrainWorkflowContext.tsx`. Rôles : COMMERCIAL, FREELANCE, PROSPECTION.

### 6.1 Ce que l'écran montre
- « Disponibilité produits — Ce que vous pouvez vendre aujourd'hui », badge « N références » (`DisponibiliteView.tsx:77-81`).
- Encadré de règle : freelance = « Les prix affichés sont le **tarif grossiste société** — votre coût d'achat. Le prix que vous facturez à votre client reste le vôtre » ; salarié = « Prix de cession société. En cas de stock limité, la quantité est confirmée à la validation de la commande par l'entrepôt » (`:83-94`).
- Trois compteurs : Références disponibles / Stock limité — à confirmer / En rupture — ne pas promettre (`:96-109`).
- Recherche texte, filtres par catégorie, tableau Produit / Catégorie / Disponibilité / Prix société (« Votre coût » pour le freelance) / « Ajouter » (`:111-189`).
- Bouton flottant « Panier » (nombre d'articles et total) quand le panier n'est pas vide (`:191-202`), qui ouvre `PanierDrawer`.

### 6.2 Objets
Ligne produit consolidée (type local, `DisponibiliteView.tsx:43`) : `reference`, `nom`, `categorie`, `stock`, `seuil`, `prix` (= `prix_unitaire` du stock). `Dispo` = `DISPONIBLE` / `LIMITE` / `RUPTURE` (`:13`). `PanierLigne` : `reference`, `nom`, `prix`, `quantite` (`terrain-workflow.ts:31-36`). `CanalCommande` = `TERRAIN` / `WHATSAPP` / `TELEPHONE` (`:38`). `CommandeTerrain` : `id`, `pdv_nom`, `createdAt`, `createdBy`, `canal`, `lignes[]`, `montant_total`, `statut` = `BROUILLON` / `TRANSMISE` (`:40-49`). Le statut `BROUILLON` n'est jamais produit : `panierVersCommande` met toujours `TRANSMISE` (`:109`).

### 6.3 Actions
| Libellé | Fichier:ligne | État |
|---|---|---|
| « Ajouter » (désactivé en rupture) | `DisponibiliteView.tsx:167-174` → `ajouterAuPanier` (`TerrainWorkflowContext.tsx:99-110`) | **SIMULÉ persisté (localStorage)** : ajoute 1 unité, cumule si déjà présent. Pas de choix de quantité à l'ajout |
| « Panier » (bouton flottant) | `:191-202` | BRANCHÉ (ouvre le tiroir) |
| Tiroir : − / + / corbeille par ligne, « Vider » | `PanierDrawer.tsx:71-92`, `:129-135` | SIMULÉ persisté. Quantité à 0 retire la ligne (`TerrainWorkflowContext.tsx:112-116`) |
| « Transmettre la commande » | `PanierDrawer.tsx:136-143` → `creerCommande` (`TerrainWorkflowContext.tsx:124-137`) | **SIMULÉ** : crée une `CommandeTerrain` `TRANSMISE` dans `localStorage` et vide le panier. **Rien n'est envoyé** : la commande n'entre ni dans `REGISTRE_COMMANDES`, ni dans le pipeline, ni vers l'entrepôt ni vers le superviseur |
| Sélecteur de canal « En visite » / « WhatsApp » / « Téléphone » | `PanierDrawer.tsx:15-19`, `:110-123` | BRANCHÉ (simple étiquette) |
| Champ « Point de vente » | `:102-109` | **Texte libre** : pas de sélecteur parmi le portefeuille, pas de lien avec `pdv_id` ni avec la visite en cours. Le bouton est grisé si vide (`:139`) |

### 6.4 Règles
- **Disponibilité** (`dispoDe`, `DisponibiliteView.tsx:25-29`) : `RUPTURE` si `stock <= 0` ; `LIMITE` si `stock < seuil` ; sinon `DISPONIBLE`. Le stock est **consolidé sur tous les entrepôts du réseau** (somme des lignes de même référence, `:42-57`), et non sur l'entrepôt source du client ou du commercial. Principe affiché : « le commercial a besoin de savoir s'il peut vendre » ; la quantité exacte n'est pas exposée (`:21-24`).
- Aucun contrôle de quantité contre le stock, aucun contrôle de plafond de crédit du PDV, aucune remise, aucune TVA. Total = Σ `prix × quantité` (`terrain-workflow.ts:91-93`).
- Le prix est le prix unitaire du stock, identique pour tous les clients ; le freelance n'a pas de champ « mon prix client » (`grille_client_personnalisee` existe dans le registre mais n'est pas utilisée ici).

### 6.5 IA
Aucune dans `/disponibilite`.

---

## 7. `/commandes` côté terrain — « Nouvelle commande terrain »

Composant : `src/components/commandes/CommandesView.tsx` ; hub : `src/lib/commandes-hub.ts` (périmètre) ; calculs DG : `src/lib/commandes-dg-builder.ts`.

### 7.1 Trois variantes selon le rôle
- **FREELANCE** (`CommandesView.tsx:129-147`) : « Mes commandes grossiste — Prix société {entreprise} vs vos prix client — marge calculée », badge « Mode freelance », bandeau « Vous commandez au tarif grossiste (paniers 2–4 M FCFA). Le prix client est le vôtre — marge non visible par la société ». Liste des commandes de son portefeuille en `CommandeCardDG`. **Aucun bouton « Nouvelle commande terrain » et aucun panier pour le freelance** : le freelance peut remplir un panier et le transmettre uniquement depuis le tiroir de `/disponibilite` (route autorisée), sans voir ses commandes transmises sur `/commandes`.
- **Terrain non freelance** (COMMERCIAL, PROSPECTION ; tout rôle absent de `ROLES_PILOTAGE` qui n'est pas freelance) (`:149-206`) : « Prise de commande terrain — Catalogue · vérif. stock · sync offline » ; section « Commandes terrain transmises (N) » (cartes vertes : PDV, nb de lignes, canal en minuscules, date, montant, badge `TRANSMISE`) puis liste de ses commandes du registre en cartes ; bouton **« Nouvelle commande terrain »** avec compteur du panier ; texte d'aide « Astuce : ajoutez d'abord des produits depuis **Disponibilité**, puis transmettez la commande ici » (`:196-200`).
- **Pilotage** (DG, DC, DAF, RESP_VENTES, SUPERVISEUR, RESP_STOCK, GEST_ENTREPOT : `ROLES_PILOTAGE`, `:46`) : « Pilotage commandes grossiste — Vue DG » avec 8 KPI (volume jour, panier moyen « obj. 3 M+ », marge brute moy., en préparation, priorité IA, bloquées crédit, enseigne, lignes), pipeline 4 statuts cliquables, flux par entrepôt, répartition par type de client et par zone, « Analyses IA commandes » (`:208-435`).

### 7.2 Objets
`Commande`, `CommandeStatut`, `PrioriteCommandeIA`, `TypeClientCommande` (§0.3) ; `CommandeTerrain`, `PanierLigne`, `CanalCommande` (§6.2). Étiquettes de statut affichées : valeurs brutes dans `PdvRapportView.tsx:322` (`LIVREE`, etc.) mais `STATUT_COMMANDE_LABEL` dans `CommandesView`.

### 7.3 Actions
| Libellé | Fichier:ligne | État |
|---|---|---|
| « Nouvelle commande terrain » | `CommandesView.tsx:186-195` → ouvre `PanierDrawer` | **SIMULÉ** : ouvre le tiroir du panier ; si le panier est vide le tiroir affiche « Panier vide — ajoutez des produits depuis la disponibilité » (`PanierDrawer.tsx:58-63`). Il n'y a **pas de création de commande par PDV + catalogue sur cet écran** |
| « Transmettre la commande » | `PanierDrawer.tsx:136-143` | SIMULÉ (voir §6.3) |
| Toast de confirmation (`WorkflowToast`) | `CommandesView.tsx:203` | BRANCHÉ |
| Aucune action sur les commandes existantes (valider, annuler, modifier, dupliquer) pour le terrain | — | ABSENT |

### 7.4 Règles
- Périmètre : `getCommandesHub(ctx)` filtre par `scopeAuPerimetre` (zone sinon commercial) (`commandes-hub.ts:4-13`). Le commercial voit les commandes dont `commercial === nom`.
- La carte de commande (`CommandeCardDG`, `CommandesView.tsx:48-99`) montre pour **tous** les rôles terrain : référence, statut, **priorité IA** (« BLOQUÉE IA » / « PRIORITÉ » / « NORMALE »), type de client, zone, entrepôt, commercial, `montant_societe`, **« Marge {marge_brute_pct}% »**, et `marge_freelance` si présente. Le terrain voit donc la marge brute de la société (information de direction).
- Quand `priorite_ia === 'BLOQUEE'` : crédit client dépassé, « ne pas préparer en entrepôt » (message d'analyse DG, `commandes-dg-builder.ts:70-78`). Aucune règle de blocage n'est appliquée à la prise de commande terrain.

### 7.5 IA
« Priorité IA » (`HAUTE` / `NORMALE` / `BLOQUEE`) sur chaque commande, `alerte` textuelle (ex. « Créance 340 K — livraison sous réserve »), « Analyses IA commandes » côté pilotage. Données du registre, pas de modèle.

---

## 8. `/prospection` — « Conquête & Territoires » (menu PROSPECTION : « Ma conquête »)

Composant : `src/components/prospection/ConqueteView.tsx` ; hub : `src/lib/prospection-hub.ts` (périmètre par `scopeAuPerimetre`) ; logique : `src/lib/prospection-builder.ts` ; workflow : `src/lib/prospection-workflow.ts`, `src/contexts/ProspectionWorkflowContext.tsx` ; registre : `src/lib/registries/prospection-registry.ts`. Rôles : DG, DC, RESP_VENTES, PROSPECTION.

### 8.1 Ce que l'écran montre
- Titre « Conquête & Territoires — Recenser une zone blanche · qualifier · convertir en 1ʳᵉ commande · passer la main » (`ConqueteView.tsx:253-257`). Neuf KPI (`:235-249`) : Zones en conquête, Recensement %, Prospects actifs, Dossiers bloqués, **Réachat M+1 %**, **Survie M+3 %**, PDV orphelins, Valeur nette, Alertes critiques. Bandeau rouge si `valeur_nette < 0` : « Le portefeuille d'ouvertures détruit de la valeur… Un compte ouvert n'est pas un compte gagné » (`:268-277`).
- Quatre onglets (`:36-43`) : **Territoires**, **Carnet de prospects**, **Ouvertures & survie**, **Passation**. Colonne latérale : fiche zone, fiche prospect, garde-fous (`REGLES_CONQUETE`), alertes (`AlerteCard`).
- Territoires : carte (zones colorées par statut + commerces recensés) avec bouton **« Activer le recensement »** / « Mode recensement actif » ; liste des commerces recensés avec corbeille ; une carte par zone : statut, distance dépôt, coût de desserte, potentiel, concurrent installé, barres Recensement (recensés/estimés), Conversion (ouverts/recensés), part du coût de service dans le potentiel (rouge si > 15 %) (`:296-450`).
- Carnet : **entonnoir** par étape avec libellé de goulot, motifs de perte (évitable ou non), liste de prospects avec pastille « N j bloqué », capacité de paiement, CA estimé, score IA (`:455-530`).
- Ouvertures & survie : cohorte par mois d'ouverture (vivants / dormants / morts / impayés), résumé « Survie M+3 : x/y ouvertures jugeables — z % », détail des ouvertures (`:532-637`).
- Passation : file « N PDV sans commercial de secteur », badge de santé, « orphelin · +N j » ou « N j restants », bouton « Transférer » (`:639-690`).

### 8.2 Objets (`prospection-registry.ts`)
| Type | Ligne | Champs / valeurs |
|---|---|---|
| `EtapeConquete` | 20-26 | `RECENSE`, `QUALIFIE`, `PREMIER_CONTACT`, `OFFRE_ENVOYEE`, `PREMIERE_COMMANDE`, `PERDU` (terminal) |
| `CapacitePaiement` | 29 | `COMPTANT`, `CREDIT_7J`, `CREDIT_30J`, `INCONNUE` |
| `StatutZone` | 31 | `A_RECENSER`, `RECENSEMENT_EN_COURS`, `EN_CONQUETE`, `COUVERTE`, `ABANDONNEE` |
| `SanteOuverture` | 34 | `VIVANT`, `DORMANT`, `MORT`, `IMPAYE` (constaté 3 mois après la 1ʳᵉ commande) |
| `ZoneConquete` | 36-56 | `zone`, `commercial`, `statut`, `lat`, `lng`, `pdv_recenses`, `pdv_estimes`, `pdv_ouverts`, `distance_depot_km`, `cout_service_mois`, `potentiel_ca_mois`, `concurrent_installe`, `synthese_ia` |
| `Prospect` | 58-86 | `nom`, `zone`, `quartier`, `telephone`, `commercial`, `etape`, `jours_dans_etape`, `score_ia`, `type_commerce`, `surface_m2`, `achalandage_jour`, `ca_estime_mois`, `concurrent_fournisseur`, `capacite_paiement`, `distance_depot_km`, `dernier_contact`, `prochaine_action`, `motif_blocage?`, `motif_perte?`, `synthese_ia` |
| `Ouverture` | 88-112 | `pdv_id`, `pdv_nom`, `zone`, `commercial`, `mois_ouverture`, `ca_1re_commande`, `conditions_1re_commande`, `reachat_m1` (bool), `reachat_m3` (bool ou `null` = trop récent), `impaye_fcfa`, `sante`, `cout_acquisition`, `marge_cumulee`, `transfere_a` (null = orphelin), `jours_depuis_ouverture` |
| `ProspectRecense` | `prospection-workflow.ts:338-347` | `id`, `nom`, `lat`, `lng`, `type_commerce?`, `commercial`, `createdAt` — couche locale, distincte de `Prospect` |
| `REGLES_CONQUETE` | 114-123 | `plafond_credit_1re_commande` = 1 500 000 ; `distance_max_rentable_km` = 35 ; `jours_max_sans_contact` = 21 ; `jours_max_avant_passation` = 45 |

### 8.3 Actions
| Libellé | Fichier:ligne | État |
|---|---|---|
| « Activer le recensement » / « Mode recensement actif » | `ConqueteView.tsx:305-317` | SIMULÉ (état local) |
| Clic sur la carte en mode recensement | `:206-212` (`handleMapClick`) | **SIMULÉ persisté (localStorage)** : deux `window.prompt` (nom, type facultatif) puis `recenser` → `ProspectRecense` géolocalisé. N'alimente pas le carnet `Prospect` ni les KPI (« Recensement % » vient de `pdv_recenses` du registre) |
| Corbeille « Retirer ce prospect recensé » | `:362-369` → `supprimer` | SIMULÉ persisté |
| « Transférer » (passation) | `:680-684` → `handleTransferer` `:220-230` → `transferer` | **SIMULÉ persisté** : `window.prompt` « à quel commercial de secteur ? » avec valeur par défaut = 1er commercial salarié de la zone ; écrit dans `prospera-prospection-transferts` ; le PDV sort de la file et n'est plus orphelin. **Aucune notification au commercial de secteur, aucune entrée dans sa tournée** (`/mon-activite` ne lit pas cette couche). Une action `annulerTransfert` existe dans le contexte mais aucun bouton ne l'utilise |
| Clic sur une zone, un prospect, onglets, « fermer » | `:57-63`, `:111-141`, `:283`, `:701-702`, `:734-735` | BRANCHÉ (sélection) |
| Aucun bouton « Contacter », « Planifier une visite », « Faire avancer d'étape », « Marquer perdu », « Créer l'ouverture », « Nouveau prospect » | — | ABSENT (le carnet est en lecture seule ; `prochaine_action` n'est qu'un texte) |

### 8.4 Règles de calcul
- **Entonnoir** (`buildEntonnoirConquete`, `prospection-builder.ts:63-98`) : `atteint` = nb de prospects non perdus dont le rang d'étape ≥ celui de l'étage (`RECENSE`=0 … `PREMIERE_COMMANDE`=4) ; `pct_du_recense` = atteint / nb de prospects actifs ; `bloques` = prospects sur l'étape depuis plus de 21 jours ; **goulot** = étape avec le plus de dossiers bloqués. Les motifs de perte sont dits « évitables » sauf s'ils contiennent « exclusiv » ou « concurrent » (`:59-61`).
- **Réachat M+1** = `ouvertures avec reachat_m1 / total des ouvertures` (`:139`, `:168`). **Survie M+3** = `ouvertures avec reachat_m3 === true / ouvertures dont reachat_m3 !== null` (donc seulement les cohortes de plus de 3 mois) (`:137-138`, `:167`). Seuils de couleur : réachat M+1 ≥ 60 % vert ; survie M+3 ≥ 70 % vert (`ConqueteView.tsx:240-241`). C'est le « suivi des ouvertures à 1 et 3 mois ».
- **Valeur nette** = `marge_cumulee − coût d'acquisition − impayés` (`prospection-builder.ts:173`) ; le commentaire du type dit « marge − coût » sans les impayés (`:126`). Peut être négative.
- **File de passation** : ouvertures `VIVANT` ou `DORMANT` avec `transfere_a === null` ; **orphelin** si `jours_depuis_ouverture > 45` ; `jours_de_retard` = dépassement ; triée par ancienneté décroissante (`:194-203`).
- **Alertes (garde-fous)** (`buildAlertesConquete`, `:224-307`) : (1) 1ʳᵉ commande à crédit (≠ `COMPTANT`) au-dessus de 1,5 M : CRITIQUE si impayée, sinon HAUTE, action « acompte de 50 % » ; (2) prospect `CREDIT_30J` avec `ca_estime_mois > 3 M` (2 × plafond) : HAUTE, « Acompte 50 % obligatoire, ou validation DAF » ; (3) prospect à plus de 35 km du dépôt : MOYENNE ; (4) dossier dormant > 21 j dans l'étape : HAUTE si `score_ia ≥ 60`, sinon MOYENNE (action « Clôturer — le dossier ne rembourse pas son coût d'acquisition ») ; (5) PDV orphelins (> 45 j sans passation) : CRITIQUE. Tri CRITIQUE > HAUTE > MOYENNE.
- **Synthèse** (`:325-349`) : `couverture_recensement_pct` = Σ recensés / Σ estimés sur zones non abandonnées ; `ouvertures_mois` = ouvertures de `2026-06` (mois figé).
- Conversion d'une zone = `pdv_ouverts / pdv_recenses` (vert si ≥ 20 %, `ConqueteView.tsx:421`). Rentabilité de la desserte = `cout_service_mois / potentiel_ca_mois` (rouge si > 15 %, `:434-436`).
- **Score de santé 0-100** : pour un prospect, `score_ia` est une valeur saisie (vert ≥ 70, ambre ≥ 45, rouge sinon, `ConqueteView.tsx:81-85`) ; aucune formule. Il sert uniquement à décider si un dossier dormant est « à fort potentiel » (≥ 60).
- Le KPI de poste PROSPECTION (hors écran, `kpi-postes-registry.ts:155-172`) mesure la qualité et non le volume : survie M+3 (poids 30, cible 75 %), Recensé → 1ʳᵉ commande (25, cible 25 %), Impayé sur 1ʳᵉ commande (20, inversé, cible 2 %), Coût d'acquisition PDV (15, inversé, cible 25 000 FCFA), Ouvertures transférées (10, cible 90 %). Score de poste = moyenne pondérée des taux d'atteinte plafonnés à 130 %, bornée à 100 (`kpi-postes-registry.ts:44-57`).

### 8.5 IA
`score_ia` du prospect, `synthese_ia` de chaque zone et de chaque prospect (phrases saisies), `AiBadge` « goulot détecté » sur l'entonnoir (`ConqueteView.tsx:456`). Présentation : encart vert sur la fiche zone avec badge IA (`:720-724`), texte lisible plutôt qu'un score nu. Les garde-fous sont des règles métier explicites (non IA) et sont le meilleur candidat à reprendre tel quel.

---

## 9. `/objectifs` — « Objectifs & Quotas » et `/equipe` — « Pilotage équipe & performance commerciale »

### 9.1 `/objectifs`

Composant : `src/components/objectifs/ObjectifsView.tsx` ; logique : `src/lib/objectifs-builder.ts` (`buildObjectifs(perimetre)`). Rôles : DG, DC, RESP_VENTES, CONTROLE_GESTION. Écran du Responsable des Ventes : il pilote **par zone, jamais par commercial** (`ObjectifsView.tsx:19-22`, `:81-83`).

**Montre** : quatre KPI — « Réalisé / quota région » (% et FCFA ; flèche verte si ≥ 42 %), « Atterrissage projeté » (écart au quota), « Marge du mix » (cible 16,5 %), « Distribution numérique » (DN) (`:38-73`) ; tableau « Allocation par zone » (réalisé, quota, atterrissage + écart, rythme requis / tenu par jour, DN, statut) trié par écart projeté croissant (`:75-142`) ; « Mix produit et marge » (5 familles, part réalisée vs cible, marge) (`:145-189`) ; « Arbitrages à rendre » (4 maximum) (`:191-217`).

**Objets** : `ZoneObjectif` (`objectifs-builder.ts:29-45`) : `zone`, `superviseur`, `ca_realise`, `quota`, `atteinte_pct`, `atterrissage`, `ecart_projete`, `rythme_requis_jour`, `rythme_actuel_jour`, `effectif`, `dn_pct`, `statut` = `TIENT` / `JUSTE` / `DECROCHE`. `FamilleMix` : `famille`, `ca`, `part_pct`, `marge_pct`, `part_cible_pct`. `Arbitrage` : `priorite`, `titre`, `zone`, `constat`, `levier`, `impact`. `HubObjectifs` (`:56-70`).

**Actions** : **aucune** (`ObjectifsView.tsx` ne contient aucun bouton). Pas de saisie ni de réallocation de quota, pas de simulation, pas de lien vers `/equipe` ou `/tournees`. L'audit §3.3 listait le drill-down comme manque ; toujours vrai.

**Règles de calcul** :
- Constantes : `JOURS_ECOULES = 11`, `JOURS_OUVRES_MOIS = 26` codées en dur (`:25-27`) ; la date n'est pas lue d'une horloge (le 11 correspond à `DATE_AUJOURDHUI`).
- `ca_realise = round(zone.ca_mois × 11 / 26)` (le registre porte le CA du mois plein, le « réalisé à date » est déduit par proportion) ; `quota = zone.ca_objectif` ; `rythme_actuel_jour = round(ca_realise / 11)` ; **`atterrissage = rythme_actuel_jour × 26`** ; `ecart_projete = atterrissage − quota` ; `rythme_requis_jour = round(max(quota − réalisé, 0) / max(26 − 11, 1))` (`:111-143`). Atterrissage purement linéaire : pas de saisonnalité, pas de jours fériés, pas de pondération par pipeline.
- **Statut de zone** : `couverture = atterrissage / quota` ; `TIENT` si ≥ 1, `JUSTE` si ≥ 0,92, sinon `DECROCHE` (`:123-126`).
- **DN (distribution numérique)** : `min(round(couverture_visites_pct × 0,82), 100)` (`:139-140`) — proxy, pas un vrai comptage de PDV ayant commandé. Au niveau agrégé : `Σ round(pdv_actifs × dn/100) / Σ pdv_actifs` (`:92-104`) ; vert si ≥ 75 % (`ObjectifsView.tsx:70`, `:128`).
- **Marge du mix** = `Σ part_pct/100 × marge_pct` sur 5 familles aux valeurs **constantes** (Boissons 34 % à 18,2 % de marge, cible 32 ; Alimentaire sec 29 % / 11,4 / 24 ; Hygiène & entretien 18 / 22,6 / 24 ; Huiles & condiments 12 / 9,8 / 10 ; Produits frais 7 / 15,1 / 10) ; cible de marge 16,5 % (`:146-162`, `:103`). Le mix est identique quel que soit le périmètre de l'utilisateur. Une famille est signalée « sur-représentée et peu margée » si part − cible > 2 points et marge < 16,5 % (`ObjectifsView.tsx:170`, `:181-183`).
- **Arbitrages** (`construireArbitrages`, `:164-210`) : une entrée par zone `DECROCHE` (levier : si `couverture_visites_pct < 80` alors « le problème est l'exécution, pas la demande. Renforcer l'effectif » sinon « le problème est le panier. Pousser le mix hygiène ») ; une entrée « Réallouer du quota depuis {zone qui surperforme} » (« Transférer 1 commercial… pour 30 jours ») ; une entrée « Le CA de {zone} n'est pas encaissé » si `creances_pct > 25` (« Geler les livraisons à crédit… balance âgée > 30 j »). Coupé à 4.
- Il n'y a **pas d'objectif individuel par commercial** dans ce module ; l'objectif individuel n'apparaît que dans `CommercialKpi.visites_objectif` (nombre de visites) et dans l'« Objectif CA » codé à 87 % de la synthèse équipe (voir 9.2).

**IA** : badge `AiBadge` sur « Arbitrages à rendre » (`ObjectifsView.tsx:195`), arbitrages produits par règles + gabarits (pas de modèle). « Projections d'objectifs » = extrapolation linéaire ci-dessus.

### 9.2 `/equipe`

Composant : `src/components/equipe/EquipeView.tsx` (+ `MatricePostesPanel.tsx`) ; logique : `src/lib/equipe-dg-builder.ts`, `src/lib/kpi-postes-registry.ts`. Rôles : DG, DC, RESP_VENTES, SUPERVISEUR, CONTROLE_GESTION.

**Montre** :
- Titre « Pilotage équipe & performance commerciale », sous-titre « {Vue DG | Mon équipe | Mes zones | Périmètre commercial} — classement · clients récurrents · factures · commissions · avantages · coaching IA » ; badge « N commerciaux » (`EquipeView.tsx:131-157`). Le libellé « Vue DG » reste pour CONTROLE_GESTION.
- Huit KPI (`:160-176`) : Perf. moyenne, CA total/mois, **Objectif CA** (87 % codé en dur, `equipe-dg-builder.ts:285`), Clients récurrents, Factures/mois, Recouvrement moy., Top performers, Dégradés.
- **Pour DG/DC seulement** : « Synthèse IA — Performance équipe commerciale · Juin 2026 » (paragraphe **entièrement codé en dur** citant Massan Agbodjan, Komlan Tetteh, Mawuena Ahi, Kofi Agbessi, avec « intervention DG requise sous 7j », `EquipeView.tsx:179-192`) et « Décisions recommandées pour le DG » (5 décisions fixes, `:195-215` ; `buildDecisionsEquipeDG` ne dépend pas des données, `equipe-dg-builder.ts:352-360`) ; matrice des scores de tous les postes (DG) ou des 5 postes commerciaux (DC) (`:248-253`).
- Pour tous les rôles de l'écran : encadrés « Top performers — à valoriser » (avec **rémunération totale mensuelle**) et « À coacher / sous performance » (`:218-246`), trois vues (« Classement & fiches », « Tableau comparatif », « Coaching & retours IA », `:21-25`), colonne « Analyses IA équipe », fiche détaillée au clic.
- Fiche de commercial (`:374-457`) : rang, badge OR/ARGENT/BRONZE, synthèse IA, 8 chiffres (CA/mois, CA/jour, clients récurrents / portefeuille, nouveaux, factures générées / impayées, panier moyen, transformation), histogramme CA 6 mois, **Rémunération & commissions** (commission, prime objectif, total, marge/jour), Activité terrain (visites/jour, couverture, commandes/mois, GPS conforme), Avantages & perks, « Retour IA pour le DG », « Action IA ».
- Tableau comparatif : Rang, Commercial, Perf., CA/mois, Clients récur., Factures, Recouv., **Commission, Prime, Total rémun.**, vs équipe (`:290-320`).

**Objets** : `CommercialPerformanceDG` (`equipe-dg-builder.ts:12-40`) : `rang`, `statut_perf` (`StatutPerformanceDG` = `TOP` / `PERFORMANT` / `NORMAL` / `SOUS_PERF` / `DEGRADE`), `badge?` (`OR` / `ARGENT` / `BRONZE`), `clients_portefeuille`, `clients_recurrents`, `clients_nouveaux_mois`, `clients_fideles`, `clients_a_risque`, `factures_generees_mois`, `factures_payees_mois`, `factures_impayees_mois`, `ca_facture_mois`, `taux_recouvrement_pct`, `panier_moyen`, `taux_transformation_pct`, `taux_fidelisation_pct`, `commission_mois`, `prime_objectif_mois`, `remuneration_totale_mois`, `evolution_ca_6m[]`, `avantages[]`, `points_forts[]`, `points_faibles[]`, `coaching_ia`, `retour_ia_dg`, `vs_equipe_ca_pct`, `vs_equipe_visites_pct`. `PerformancePoste` / `KpiPoste` (`kpi-postes-registry.ts:9-33`) : `cle`, `label`, `valeur`, `objectif`, `unite`, `invert`, `sparkline`, `variation_pct`, `poids`.

**Actions** : filtres « Tous » / « Top performers » / « SALARIE » / « FREELANCE » / « Dégradés », onglets de vue, clic pour ouvrir / fermer une fiche (`EquipeView.tsx:255-286`) — toutes BRANCHÉES en état local. **Aucune action métier** : pas de « Planifier un coaching », « Fixer un objectif », « Valider une prime », « Réaffecter des PDV », alors que les décisions et analyses les recommandent. Les listes « Décisions recommandées pour le DG » ne sont pas actionnables.

**Règles de calcul** :
- **Performance globale d'un commercial** = `round((visites% + vs_equipe_ca% + recouvrement% + 2 × transformation%) / 4)` avec `visites% = min(120, visites_jour/visites_objectif×100)` (`equipe-dg-builder.ts:240-246`). Le facteur 2 sur la transformation et le plafond 120 sont codés sans justification. Le classement (`rang`) trie par ce score décroissant (`:267-268`).
- **Statut de performance** pour les commerciaux non nommés (`statutPerfFor`, `:134-140`) : `TOP` si `score_ia ≥ 88` et `visites_jour ≥ objectif` ; `PERFORMANT` si score ≥ 82 ; `NORMAL` si ≥ 74 ; `SOUS_PERF` si score ≥ 68 **ou** couverture < 72 ; sinon `DEGRADE`. (Le test `SOUS_PERF` à « ≥ 68 » englobe tout score entre 68 et 73 : ordre des conditions à vérifier.) Pour les 4 commerciaux nommés (c-1 à c-4), le statut est écrit en dur (`PERF_EXTRA`, `:73-130`).
- **Rémunération** : commission salarié = `ca_facture × (2,8 % à 3,8 %)` (aléatoire déterministe) ; prime = 180-350 K FCFA si `TOP`, sinon 0-120 K ; **rémunération totale = commission + prime + base 280-420 K aléatoire** ; **freelance = `ca_jour × 22 + marge_jour × 22`** (somme du chiffre d'affaires société et de la marge, `:161-162`, `:194-196`). La formule freelance est incohérente avec le modèle économique décrit (marge nette = rémunération) : à ne pas reprendre. Aucun barème de commission réel dans le code.
- **Taux de transformation** : `clamp(18, 58, round(commandes_jour / visites_jour × 100) + aléa(−5, +10))` (`:158`).
- **Clients récurrents** = PDV du portefeuille en pipeline `FIDELE` ou `ACTIF` ; fidèles = `FIDELE` ; nouveaux = `PREMIERE_COMMANDE` ou `PREMIER_CONTACT` ; à risque = `A_RISQUE` ou `creance_jours > 20` (`:149-152`).
- **Taux de recouvrement** issu de `buildRecouvrementParCommercial` (module facturation) quand disponible, sinon `clamp(62, 98, score_ia + aléa)` (`:154`, `:259-262`).
- **Périmètre `/equipe`** : superviseur = membres dont `superviseur === user.nom` ; **si la liste est vide, retombe sur toute l'équipe** (`EquipeView.tsx:118-121`) ; RESP_VENTES = membres dont la zone ∈ `user.zones`, **même repli sur tous** (`:123-127`) ; CONTROLE_GESTION et DC : toute l'équipe.
- **Matrice des postes** : `calculScorePoste` = moyenne des taux d'atteinte pondérée par `poids` (Σ = 100), `tauxAtteinte` plafonné à 130 %, borné à 100 ; pour un KPI « inversé », taux = objectif / valeur (`kpi-postes-registry.ts:36-57`). Statut de score : EXCELLENT ≥ 90, BON ≥ 75, A_SURVEILLER ≥ 60, CRITIQUE < 60 (`:59-64`). KPI de poste terrain : COMMERCIAL (visites/jour 25 %, commandes prises 20 %, CA généré 25 %, transformation 20 % cible 60 %, encaissement terrain 10 % cible 80 %), FREELANCE (marge nette 30 %, CA société 20 %, PDV portefeuille 15 %, respect de la grille de prix 25 % — marge minimale de 12 %, nouveaux PDV 10 %), SUPERVISEUR (couverture visites zone 25 %, commerciaux ≥ quota 25 %, PDV à risque de churn 20 % inversé, délai de traitement des litiges 15 % inversé, CA zone 15 %), RESP_VENTES (CA zone/quota 30 %, commandes terrain/jour 20 %, panier moyen 20 %, PDV actifs/portefeuille 20 %, taux de rupture commande 10 % inversé) (`kpi-postes-registry.ts:92-153`). **Toutes ces valeurs sont des constantes** (« Juin 2026 »), non calculées à partir des visites ou commandes de l'application.

**IA** : `coaching_ia`, `retour_ia_dg`, `action_ia`, `points_forts`, `points_faibles` (texte saisi pour 4 commerciaux, gabarits pour les autres, `equipe-dg-builder.ts:205-220`) ; `AiBadge` « Score IA » avec confiance = `score_ia` (`EquipeView.tsx:331`) et « Performance » avec confiance = performance globale % (`:388`). Présentation : encart indigo/violet « Analyses IA équipe », textes en gras « Coaching IA » / « Retour DG ».

---

## 10. Écarts « Vue DG montrée à un commercial » (et autres fuites de niveau)

| # | Écran | Écart (fichier:ligne) | Gravité pour le PRD |
|---|---|---|---|
| 1 | Fiche PDV | Quand un COMMERCIAL, FREELANCE ou PROSPECTION ouvre un PDV : le bloc de droite est bien « Ma fiche client », mais l'en-tête garde 9 KPI de direction dont **« Rang zone »**, **« BL / mois »**, **« Délai livr. »** et **« service x % »** (`PdvRapportView.tsx:119-120`, `:117`), la synthèse IA du DG (« Action immédiate : recouvrement + visite superviseur », `pdv-rapport-builder.ts:118`), les alertes DG (« plafond crédit dépassé · risque coupure approvisionnement ») et les actions du DG sous le titre « Mes prochaines actions » (`PdvRapportView.tsx:361-368`) |
| 2 | Fiche PDV | Aucun contrôle d'appartenance : `buildPdvRapportDG(pdvId)` cherche dans le registre complet (`pdv-rapport-builder.ts:140-143`) ; un commercial peut ouvrir la fiche de n'importe quel PDV par l'URL `/points-de-vente/{id}` (route autorisée pour son rôle, `route-access.ts:38`) et voir CA, créance, factures d'un client d'un autre portefeuille |
| 3 | Liste PDV | Badge « échantillon réseau 1 847 » et KPI « CA réseau », « Impayés total », « Actions prioritaires réseau » pour un commercial dont la liste est filtrée à son portefeuille (`PointsDeVenteView.tsx:77`, `:82-89`, `:122`) ; pied « rapport détaillé DG » (`:304`) |
| 4 | Liste PDV | MARKETING et RECOUVREMENT voient tout le réseau (assiette `RESEAU`, `perimetre.ts:141-143`) avec le sous-titre « Vue DG » et le « Rapport DG » ; ils voient CA, créances, scores de tous les PDV (`PointsDeVenteView.tsx:28-32`, `:267`) |
| 5 | `/commandes` terrain | Les cartes de commande montrent « Marge {marge_brute_pct}% » de la société et la priorité « BLOQUÉE IA » (`CommandesView.tsx:59-77`) ; le bandeau freelance promet « marge non visible par la société » (`:138`) alors que la carte expose la marge brute société |
| 6 | `/commercial` | Non filtré par périmètre : aucun `useHubContext`, `buildCommerciauxTerrainDG()` retourne les 22 commerciaux (`CommercialTerrainView.tsx:134`, `commercial-terrain-dg-builder.ts:206-231`). Un SUPERVISEUR ou un RESP_VENTES voit tout le réseau ; l'écran ne montre que la vue DG (« Pilotage commercial terrain », analyses sur Mawuena/Komlan). Le commercial n'y a plus accès (`route-access.ts:41`) |
| 7 | `/equipe` | « Vue DG » comme sous-titre par défaut (CONTROLE_GESTION) ; pour SUPERVISEUR/RESP_VENTES, les encadrés « Top performers » montrent la **rémunération mensuelle** de chaque commercial (`EquipeView.tsx:226`) ; l'onglet comparatif montre Commission, Prime, Total rémun. (`:295`, `:311-313`) ; les fiches ouvrent « Retour IA pour le DG » (`:448-450`), « Retour DG » dans l'onglet coaching (`:334`). Le CONTROLE_GESTION a accès aux rémunérations individuelles sans que le code l'ait décidé explicitement |
| 8 | `/equipe` | Repli sur toute l'équipe si le filtre de périmètre est vide (`:118-121`, `:123-127`) : un superviseur non rattaché voit tout |
| 9 | `/objectifs` | « Réalisé / quota région » affiché pour un DG (réseau) ; le mix produit est identique pour toutes les zones et tous les périmètres (`objectifs-builder.ts:146-162`) |
| 10 | `/tournees` | Pour un DG ou un DC, 22 commerciaux (réseau entier) ; la mention « Mon équipe sur le terrain — {périmètre} » (`TourneesView.tsx:202`) reste valable mais la vue est celle d'un chef d'équipe |
| 11 | `/prospection` | Le chargé de prospection ne voit pas la fiche PDV orientée « survie post-ouverture » (M+1/M+3) : il tombe sur la même fiche terrain que le commercial (l'audit §3.7 le demandait ; non fait) |
| 12 | Tous | Aucun contrôle côté serveur : tout le filtrage est du JavaScript client sur des registres embarqués dans le bundle ; les données des autres périmètres sont dans le code téléchargé |

---

## 11. Ce qu'une application mobile hors connexion (Flutter) devrait reprendre de `mon-activite`, `disponibilite`, `tournees`

À reprendre (comportements déjà esquissés dans le front) :
1. **Agenda du jour et de la semaine du commercial** : liste ordonnée de `Visite` (heure, durée, motif, statut, ordre, adresse, lat/lng, conseil), navigation par semaine du lundi au samedi, historique des 40 dernières visites (`MonActiviteView.tsx:260-493`). Modèle `Visite` tel quel (`types/index.ts:444-470`).
2. **Cycle de visite** : `PLANIFIEE` → `EN_COURS` (« Y aller » avec horodatage) → `FAITE` (« Clôturer »), avec `demarreeAt` / `clotureeAt` conservés dans le modèle (`terrain-workflow.ts:20-29`) ; ajouter ce qui manque et que la tournée a besoin de connaître : `REPORTEE` et `ANNULEE` avec motif.
3. **Clôture de visite** : 5 résultats, montant de commande, montant encaissé (Mobile Money / espèces), commentaire (`ClotureVisiteModal.tsx`). À durcir : lier la commande à la visite et au panier, typer le contrôle GPS (distance en mètres, booléen « sur place ») plutôt qu'une chaîne dans le commentaire (`:73-87`), imposer le contrôle ou tracer son absence.
4. **Contrôle de présence** : rayon de 200 m autour du PDV, position lue à la clôture, avec tolérance « clôture possible mais signalée » (`:10-11`, `:191-196`). C'est une règle à garder côté appareil (GPS local) et à contrôler côté serveur.
5. **Itinéraire** : ordre de priorité (impayés > réclamation > réassort > lancement > fidélisation > prospection), comparaison avec un ordre plus proche voisin, durée estimée (22 km/h, 12 min/arrêt), lancement de la navigation externe (Google Maps) (`itineraire-builder.ts`). Calcul entièrement local, sans API de routage : compatible hors ligne ; la carte de fond (OSM/Leaflet dans le front) devra être mise en cache.
6. **Disponibilité produit** : statuts `DISPONIBLE` / `LIMITE` / `RUPTURE` sans exposer la quantité (`DisponibiliteView.tsx:25-29`), recherche + catégories, prix société (« votre coût » pour le freelance). Hors ligne : le catalogue et le dernier statut de stock doivent être synchronisés ; afficher l'âge de la dernière synchronisation (le front n'a pas ce signal) ; décider si `LIMITE` autorise la saisie (« quantité confirmée à la validation par l'entrepôt »).
7. **Panier et commande terrain** : lignes, quantités, canal (`TERRAIN` / `WHATSAPP` / `TELEPHONE`), total, transmission (`terrain-workflow.ts:31-49`). Hors ligne : file d'envoi persistante et idempotente avec un identifiant client (le front utilise `genId('cmd-terrain')`, `persistence.ts:29-31`), statut visible `BROUILLON` → `TRANSMISE` (le premier n'est jamais produit aujourd'hui) puis `VALIDEE`, etc. ; sélection du PDV dans le portefeuille (`pdv_id`) au lieu du texte libre ; contrôle du plafond de crédit à l'ouverture de la commande (aujourd'hui seulement affiché ailleurs).
8. **Côté superviseur (`tournees`)** : PJP planifié / réalisé, strike rate (cible 50 %), **espèces encaissées / remises / écart de caisse / jours sans remise**, exécution en magasin (5 critères), rejeu de la journée par position. Pour que cela fonctionne il faut **ajouter ce que le front ne capture pas** : la **remise de caisse** (saisie du montant remis, date, destinataire) et le **relevé d'exécution en magasin** (cases à cocher à la visite) doivent être saisis dans l'application mobile ; sans cela, les indicateurs de `/tournees` restent des estimations (cash = 55 % du CA, `tournees-builder.ts:90-91` ; critères codés en dur, `:211-228`).
9. **Synchronisation** : le front n'a aucun mécanisme (badge « Mode offline OK » statique, `MonActiviteView.tsx:227`). À spécifier : file d'actions hors ligne, résolution de conflits (visite clôturée deux fois, commande sur un stock devenu nul), horodatage serveur vs appareil, statut de synchronisation visible par visite et par commande.
10. **Prospection terrain (même appli)** : recensement par pointage GPS (nom + type de commerce + coordonnées, `prospection-workflow.ts:338-347`), `window.prompt` à remplacer par un vrai formulaire ; passation d'une ouverture à un commercial de secteur.

À ne pas reprendre en l'état : les chiffres de `/tournees` (aléatoires déterministes), le statut `ALERTE_GPS` dérivé du score de performance, l'objectif du mois d'un PDV (= CA × 1,1), la rémunération freelance, la valeur « Mode offline OK ».

---

## 12. Termes qui changeraient côté IMF (traces dans le code)

Le code du Distributeur ne porte **aucune trace IMF** : une recherche sur « agent de collecte », « agence », « microfinance », « IMF », « membre », « épargne » ne donne rien dans le périmètre (seuls « membres » comme tableau d'équipe, `EquipeView.tsx:115`, et « TVA collectée », hors sujet). La correspondance ci-dessous est donc une proposition de cadrage, non une reprise.

| Terme Distributeur (code) | Équivalent probable IMF | Remarque |
|---|---|---|
| `COMMERCIAL` « Commercial Terrain », `VRP` (affiché dans `/commercial`, `CommercialTerrainView.tsx:293`, `:388`) | Agent de collecte / agent de crédit | Même rôle de portefeuille ; le VRP encaisse (« Encaissé sur le terrain »), l'agent de collecte collecte l'épargne et les remboursements |
| `FREELANCE` (grille de prix, marge nette) | Pas d'équivalent direct (agent commissionné / apporteur d'affaires) | Notion de marge propre sans objet |
| `PROSPECTION` « Chargé de conquête », `Prospect`, `Ouverture`, `ZoneConquete` | Chargé de développement / recrutement de membres ; prospect = futur client ; « ouverture » = ouverture de compte | La survie M+3 devient rétention des comptes ou taux de remboursement à 3 mois ; `impaye_1re_commande` devient impayé sur 1ᵉʳ crédit |
| `PointDeVente`, `pipeline` (`PROSPECTION` … `A_RISQUE`) | Client / membre / groupe solidaire ; `A_RISQUE` = portefeuille à risque (PAR) | Le pipeline devient statut de relation (prospect, actif, en retard, contentieux) |
| `SUPERVISEUR` de zone, `zone`, `RESP_VENTES` de région | Chef d'agence, agence, directeur régional | `zone` → `agence` ; la hiérarchie région → zone → commercial se retrouve en région → agence → agent |
| `Visite` + `ResultatVisite` (`COMMANDE`, `ENCAISSEMENT`, `PROMESSE`, `SANS_SUITE`, `ABSENT`) | Visite de collecte / de recouvrement ; résultats : collecte d'épargne, remboursement, promesse, absent | `ENCAISSEMENT` et `PROMESSE` sont déjà des notions d'IMF ; `COMMANDE` n'a pas d'équivalent |
| `MotifVisite.RELANCE_IMPAYE` | Relance d'impayé / recouvrement | Identique |
| « Tournées & Cash », `PJP`, `strike rate`, `écart de caisse`, `remise d'espèces` | Tournée de collecte, remise de caisse de l'agent, écart de caisse | Le contrôle d'écart de caisse est central en IMF et existe déjà comme idée |
| `Commande`, `panier`, `catalogue` | Demande de crédit / dossier de prêt ; opération (dépôt, retrait) | Pas d'équivalent de stock ni de disponibilité produit |
| `créance`, `creance_jours`, `plafond_credit_1re_commande` | Encours de crédit, jours de retard, plafond du 1ᵉʳ cycle de prêt | Même logique de garde-fou |
| `Objectifs & Quotas`, `quota`, `atterrissage`, `DN` (distribution numérique) | Objectifs de collecte / décaissement ; taux de couverture des membres | `DN` n'aurait pas de sens ; le mix produit serait un mix de produits financiers |
| `Marge`, `commission`, `prime` | Commission de l'agent, prime de performance | Le barème n'existe pas dans le code Distributeur |
| `Géofencing 200 m` à la clôture | Contrôle de présence chez le membre | Identique et réutilisable |

---

## 13. Synthèse des constats pour le PRD

1. **La boucle terrain existe en démonstration mais ne produit rien de réel** : visite démarrée, clôturée, panier transmis, passation transférée sont stockés dans le `localStorage` du navigateur et ne remontent ni vers `/tournees`, ni vers `/commandes`, ni vers le superviseur, ni vers le commercial de secteur (§5.3, §6.3, §8.3).
2. **Les indicateurs de supervision (`/tournees`, `/commercial`, `/equipe`, `/objectifs`) sont calculés sur des constantes ou des tirages déterministes**, pas sur les visites ni les remises de caisse (§4.4, §3.4, §9). Les saisies à prévoir côté mobile : remise de caisse, relevé d'exécution en magasin, objectifs par commercial, taux de commission.
3. **La notion d'objectif est absente à l'échelle du commercial et du PDV** : quota de zone seulement ; l'« objectif du mois » d'un PDV vaut `CA × 1,1` (§2.4, §9.1).
4. **La séparation des périmètres est incomplète** : fiche PDV ouvrable hors portefeuille, `/commercial` non filtré, repli sur le réseau entier dans `/equipe`, rémunérations visibles du superviseur et du contrôle de gestion (§10).
5. **Les règles métier vraiment spécifiques et à reprendre** : ordre de tournée par priorité de motif, garde-fous de conquête (plafond de crédit à la 1ʳᵉ commande 1,5 M, distance maximale rentable 35 km, dossier dormant à 21 j, passation sous 45 j), survie à M+1 et M+3, valeur nette d'une ouverture (marge − coût − impayés), géofencing 200 m, statut de disponibilité sans exposer les quantités (§5.4, §6.4, §8.4).
6. **Pas de segmentation actifs / dormants / VIP** et **pas de formule de score de santé** dans le front : à spécifier (§1.4).
