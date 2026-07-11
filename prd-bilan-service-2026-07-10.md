# Product Requirements Document : Bilan & Prévisionnel (bilan-service)

**Date :** 2026-07-10
**Auteur :** vivian
**Version :** 1.0
**Type de projet :** API (micro-service NestJS)
**Niveau de projet :** 3
**Statut :** Draft
**Écosystème :** PROSPERA / Money Vibes

---

## Vue d'ensemble du document

Ce PRD définit le **fonctionnel comptable** de `bilan-service` — le domaine explicitement renvoyé par l'architecture d'intégration (décision **B8**) à un « PRD/tech-spec Bilan dédié ». Il couvre le **Module 1** du PLAN FINAL (« Bilan & prévisionnel », livraison interne oct. 2026) sous la décision **NB-1** : Bilan v1 calculé **depuis une balance importée** (Excel/CSV), pas depuis des écritures saisies.

**Documents liés :**
- Périmètre programme : `docs/synthese-services-prospera-2026-07-10.md` (PLAN FINAL — NB-1, DG-1) et `docs/architecture-prospera-ecosystem-2026-07-04.md` (rev 1.3)
- **Architecture d'intégration (décidée) : `docs/architecture-bilan-service-2026-07-07.md`** — moteur paramétré par référentiel, gate `@RequiresBilanAccess`, read-models `entitlement.changed`/`kyc.status.changed`, versioning multi-version. **Ce PRD ne redéfinit PAS ces éléments** ; il les prend comme socle (EPIC-008, squelette) et spécifie ce qui tourne dessus (EPIC-009…EPIC-014).

> **Frontière PRD ↔ architecture.** Le *comment* d'intégration (relying party, read-models, gate, chargement de référentiel, déploiement) est fixé par l'architecture. Ce PRD fixe le *quoi* fonctionnel : import de balance, table de passage, liasse d'états financiers, validation/immutabilité, prévisionnel, restitution.

---

## Résumé exécutif

`bilan-service` permet à une organisation de produire ses **états financiers** (liasse complète OHADA) et son **prévisionnel** à partir d'une **balance comptable importée**, selon le **référentiel** qui lui est attribué (SYSCOHADA révisé ou SFD-BCEAO). Le premier utilisateur est la **comptabilité interne de Money Vibes Group** (dogfooding, DG-1) : le service est éprouvé en production interne avant toute ouverture externe.

Le parcours cœur : **importer** une balance (exercice N + comparatif N-1) → **contrôler** son équilibre → **rattacher** ses comptes aux postes d'états via la table de passage du référentiel (l'automatisation **propose**, l'humain **valide**) → **générer** la liasse (Bilan, Compte de résultat, Tableau des flux, notes annexes) en **brouillon** → **valider** pour figer un **snapshot immuable** → dériver un **prévisionnel** (plan de trésorerie mensuel 12 mois + projection annuelle 3 ans) → **exporter** (PDF/Excel).

---

## Objectifs & métriques

### Objectifs métier

1. **Doter Money Vibes de ses propres états financiers** dès oct. 2026 sans logiciel comptable tiers, depuis la balance déjà tenue.
2. **Éprouver en interne** la capacité Bilan (dogfooding) pour dé-risquer l'ouverture externe (cabinets, distributeurs, IMF) module par module.
3. **Poser le socle réutilisable** multi-référentiel (SYSCOHADA/SFD-BCEAO) sans fork, conformément à P7.

### Métriques de succès

- La liasse d'un exercice MV est produite **de bout en bout** depuis une balance importée et **validée** (snapshot figé) avant fin oct. 2026.
- **Équilibre garanti** : 100 % des liasses validées passent les contrôles d'articulation (actif=passif ; trésorerie TFT = variation trésorerie bilan).
- **Zéro mutation** d'un état validé (immutabilité) — vérifiable par la piste d'audit.
- Un **prévisionnel** (12 mois + 3 ans) est produit à partir d'une liasse validée avec au moins deux scénarios.

---

## Exigences fonctionnelles

### FR-001 : Import de balance (Excel/CSV)

**Priorité :** Must Have
**Description :** L'utilisateur téléverse un fichier de balance (`.xlsx`/`.csv`) contenant, par ligne, un compte (numéro, libellé) et ses montants (débit, crédit et/ou solde débiteur/créditeur). Le service détecte le format, propose un aperçu et enregistre la balance source rattachée à un exercice et à l'organisation.
**Critères d'acceptation :**
- [ ] Formats `.xlsx` et `.csv` (séparateurs `,`/`;`, encodage UTF-8/Latin-1) acceptés ; taille et type contrôlés (magic-bytes).
- [ ] Aperçu des N premières lignes avant confirmation.
- [ ] La balance importée est stockée keyée `orgId` + `exerciceId`, horodatée et attribuée à l'utilisateur.
**Dépendances :** EPIC-008 (scaffold + gate) ; FR-016 (exercice).

### FR-002 : Contrôle d'intégrité de la balance

**Priorité :** Must Have
**Description :** À l'import, le service vérifie la cohérence de la balance et signale les anomalies sans les corriger silencieusement.
**Critères d'acceptation :**
- [ ] Contrôle d'équilibre : Σ débits = Σ crédits **et** Σ soldes = 0 (tolérance d'arrondi paramétrable).
- [ ] Détection des lignes en doublon, comptes vides, montants non numériques.
- [ ] Une balance déséquilibrée est **bloquée à la validation** (import possible en brouillon avec alerte explicite).
**Dépendances :** FR-001.

### FR-003 : Import comparatif de l'exercice précédent (N-1)

**Priorité :** Must Have
**Description :** L'utilisateur peut importer la balance de l'exercice N-1 (ou la reprendre d'un exercice précédent déjà présent) pour alimenter les **colonnes comparatives** exigées par la présentation OHADA.
**Critères d'acceptation :**
- [ ] Association explicite balance N ↔ balance N-1 d'un même `orgId`.
- [ ] Les états générés présentent les colonnes **N et N-1**.
- [ ] Si N-1 est absent, la colonne comparative est vide (jamais inventée).
**Dépendances :** FR-001, FR-009.

### FR-004 : Mapping de colonnes assisté & profil d'import

**Priorité :** Should Have
**Description :** Quand l'entête du fichier ne correspond pas au format attendu, l'utilisateur associe manuellement les colonnes source aux champs cibles ; l'association est mémorisée comme **profil d'import** réutilisable.
**Critères d'acceptation :**
- [ ] Mapping colonne→champ (compte, libellé, débit, crédit, solde) éditable avant import.
- [ ] Profil d'import nommé, réutilisable pour les imports suivants de l'org.
**Dépendances :** FR-001.

### FR-005 : Chargement du référentiel actif de l'organisation

**Priorité :** Must Have
**Description :** Le service détermine, via le read-model d'entitlement, le référentiel attribué à l'org (`syscohada-revise@x.y` ou `sfd-bceao@x.y`) et charge le paquet correspondant (plan de comptes, table de passage, règles de présentation) via le `ReferentielLoader` (artefact + checksum + cache — EPIC-008).
**Critères d'acceptation :**
- [ ] Le référentiel utilisé pour un calcul est celui de l'entitlement `ACTIVE` de l'org.
- [ ] Un paquet dont le checksum est invalide est refusé (aucun calcul sur référentiel non intègre).
- [ ] Le référentiel effectif (code+version) est enregistré dans chaque jeu d'états produit.
**Dépendances :** EPIC-008 (ReferentielLoader, read-model entitlement).

### FR-006 : Table de passage comptes → postes d'états

**Priorité :** Must Have
**Description :** Chaque compte de la balance est rattaché à un poste d'état financier selon la **table de passage** du référentiel. Les rattachements sont **proposés** par le référentiel ; les comptes non reconnus sont listés pour arbitrage humain.
**Critères d'acceptation :**
- [ ] Tout compte de la balance est soit mappé à un poste, soit explicitement signalé « non mappé ».
- [ ] La liasse ne peut être **validée** tant que des comptes significatifs restent non mappés.
- [ ] Le mapping appliqué est traçable (compte → poste → référentiel).
**Dépendances :** FR-005.

### FR-007 : Support multi-référentiel SYSCOHADA révisé + SFD-BCEAO

**Priorité :** Must Have
**Description :** Deux tables de passage sont packagées et sélectionnables selon le référentiel de l'org, sans fork de code (dimension de configuration, P7).
**Critères d'acceptation :**
- [ ] `syscohada-revise` et `sfd-bceao` disponibles comme paquets de référentiel versionnés.
- [ ] Une org SYSCOHADA et une org SFD tournent sur la **même** version de code, avec des tables de passage distinctes.
- [ ] Les états produits reflètent la présentation propre à chaque référentiel.
**Dépendances :** FR-005, FR-006. *(SYSCOHADA révisé = référentiel pilote MV ; SFD-BCEAO validé quand des données SFD internes sont disponibles.)*

### FR-008 : Ajustements de mapping par l'organisation

**Priorité :** Should Have
**Description :** L'org peut surcharger localement le rattachement d'un compte au poste attendu (cas particulier), via une proposition validée par un humain et tracée.
**Critères d'acceptation :**
- [ ] Surcharge au niveau `(orgId, compte) → poste`, sans modifier le référentiel packagé.
- [ ] Toute surcharge est journalisée (auteur, date, ancien/nouveau poste).
**Dépendances :** FR-006.

### FR-009 : Bilan (actif / passif)

**Priorité :** Must Have
**Description :** Génération du Bilan selon le référentiel, colonnes N et N-1, à partir des soldes mappés.
**Critères d'acceptation :**
- [ ] Postes d'actif et de passif calculés selon la table de passage.
- [ ] Contrôle **total actif = total passif** (sinon anomalie bloquante à la validation).
- [ ] Colonnes N / N-1 présentes.
**Dépendances :** FR-006, FR-003.

### FR-010 : Compte de résultat

**Priorité :** Must Have
**Description :** Génération du Compte de résultat (charges/produits, soldes intermédiaires, résultat net), colonnes N et N-1.
**Critères d'acceptation :**
- [ ] Produits, charges et résultat net calculés selon le référentiel.
- [ ] Cohérence : résultat net du CR = résultat repris au passif du Bilan.
- [ ] Colonnes N / N-1 présentes.
**Dépendances :** FR-006, FR-009.

### FR-011 : Tableau des flux de trésorerie (TFT / TAFIRE)

**Priorité :** Must Have
**Description :** Construction du tableau des flux de trésorerie du référentiel à partir du Bilan N/N-1 et du Compte de résultat.
**Critères d'acceptation :**
- [ ] Flux d'exploitation / d'investissement / de financement produits selon le référentiel.
- [ ] Contrôle : variation de trésorerie du TFT = variation de trésorerie du Bilan (N vs N-1).
**Dépendances :** FR-009, FR-010.

### FR-012 : Notes annexes de la liasse

**Priorité :** Should Have
**Description :** Production des états annexes réglementaires de la liasse, dans les limites de ce que la balance importée permet de renseigner automatiquement (le reste laissé à compléter).
**Critères d'acceptation :**
- [ ] Les tableaux annexes calculables depuis la balance/liasse sont générés.
- [ ] Les zones non déductibles de la balance sont identifiées comme « à compléter ».
**Dépendances :** FR-009, FR-010, FR-011.

### FR-013 : Contrôles de cohérence de la liasse

**Priorité :** Should Have
**Description :** Batterie de contrôles d'articulation entre états, restituée comme liste d'anomalies avant validation.
**Critères d'acceptation :**
- [ ] Articulation Bilan ↔ CR ↔ TFT vérifiée (actif=passif ; résultat ; variation de trésorerie).
- [ ] Anomalies listées avec le poste/compte concerné ; validation possible seulement si les contrôles bloquants passent.
**Dépendances :** FR-009, FR-010, FR-011.

### FR-014 : Cycle de vie brouillon → validé (l'humain valide)

**Priorité :** Must Have
**Description :** Un jeu d'états est d'abord **BROUILLON** (recalculable à volonté). L'automatisation (mapping, calcul) **propose** ; la **validation** est un acte humain explicite. Invariant programme : l'automatisation ne valide jamais.
**Critères d'acceptation :**
- [ ] État `BROUILLON` recalculable ; `VALIDÉ` non recalculable.
- [ ] La validation requiert que les contrôles bloquants (FR-002, FR-006, FR-009, FR-013) passent.
- [ ] La validation enregistre l'auteur et l'horodatage.
**Dépendances :** FR-013.

### FR-015 : Snapshot figé immuable à la validation

**Priorité :** Must Have
**Description :** La validation crée un **snapshot immuable** contenant les états produits, la balance source, le référentiel (code+version), la version de code du moteur, l'horodatage et le validateur. Toute correction ultérieure produit une **nouvelle version**, l'ancienne étant conservée.
**Critères d'acceptation :**
- [ ] Le snapshot validé est **append-only** : aucune mutation en place possible (invariant d'immutabilité).
- [ ] Une correction rouvre un nouveau brouillon → nouvelle version validée ; l'historique des versions est conservé.
- [ ] Le snapshot est reproductible (mêmes entrées → mêmes états).
**Dépendances :** FR-014.

### FR-016 : Gestion des exercices comptables

**Priorité :** Must Have
**Description :** L'org déclare des exercices (dates début/fin). Un exercice porte au plus un jeu d'états validé « courant » ; la ré-ouverture pour correction est contrôlée.
**Critères d'acceptation :**
- [ ] CRUD d'exercice (dates, statut ouvert/clos), keyé `orgId`.
- [ ] Un seul jeu d'états validé courant par exercice ; les versions antérieures restent consultables.
- [ ] Chaînage N/N-1 entre exercices consécutifs.
**Dépendances :** —

### FR-017 : Piste d'audit

**Priorité :** Should Have
**Description :** Journal horodaté et attribué des actions structurantes (import, mapping, validation, ré-ouverture, export).
**Critères d'acceptation :**
- [ ] Chaque action enregistre `userId`, `orgId`, type, cible, horodatage.
- [ ] Journal consultable et non modifiable (append-only).
**Dépendances :** FR-014, FR-015.

### FR-018 : Hypothèses de prévisionnel paramétrables

**Priorité :** Must Have
**Description :** À partir d'une liasse **validée** comme base, l'utilisateur saisit des hypothèses de projection (croissance du CA, taux de marge/charges, délais BFR clients/fournisseurs/stocks, investissements, financement/remboursements).
**Critères d'acceptation :**
- [ ] Jeu d'hypothèses nommé, rattaché à un exercice de base validé.
- [ ] Hypothèses éditables et versionnées ; base = snapshot validé (traçable).
**Dépendances :** FR-015.

### FR-019 : Projection annuelle sur 3 ans

**Priorité :** Must Have
**Description :** Génération d'un Compte de résultat prévisionnel, d'un plan de trésorerie annuel et d'un bilan prévisionnel simplifié sur N+1 à N+3.
**Critères d'acceptation :**
- [ ] CR prévisionnel + trésorerie + bilan simplifié pour chacun des 3 exercices.
- [ ] Les projections découlent des hypothèses (FR-018) et de la base validée.
**Dépendances :** FR-018.

### FR-020 : Plan de trésorerie mensuel sur 12 mois

**Priorité :** Must Have
**Description :** Échéancier mensuel des encaissements/décaissements sur 12 mois glissants, dérivé des hypothèses (notamment délais BFR) et du solde de trésorerie initial.
**Critères d'acceptation :**
- [ ] 12 périodes mensuelles ; solde de trésorerie cumulé par mois.
- [ ] Cohérence : la somme annualisée s'articule avec la projection annuelle N+1.
**Dépendances :** FR-018.

### FR-021 : Scénarios comparés

**Priorité :** Should Have
**Description :** Plusieurs jeux d'hypothèses (p. ex. prudent / central / optimiste) comparables côte à côte sur les mêmes indicateurs.
**Critères d'acceptation :**
- [ ] ≥ 2 scénarios coexistants pour un même exercice de base.
- [ ] Restitution comparative des indicateurs clés (résultat, trésorerie de fin de période).
**Dépendances :** FR-019, FR-020.

### FR-022 : Consultation des états & du prévisionnel

**Priorité :** Must Have
**Description :** Restitution structurée (API) des états (brouillon et validés, N/N-1) et du prévisionnel, protégée par le gate d'accès.
**Critères d'acceptation :**
- [ ] Lecture d'un jeu d'états par exercice/version, avec statut (brouillon/validé).
- [ ] Accès soumis à `@RequiresBilanAccess` (EPIC-008) ; isolation `orgId`.
**Dépendances :** FR-009…FR-011, EPIC-008.

### FR-023 : Export PDF / Excel

**Priorité :** Must Have
**Description :** Export de la liasse et du prévisionnel en **PDF** (restitution) et **Excel** (retraitement), reflétant fidèlement le snapshot figé.
**Critères d'acceptation :**
- [ ] Export PDF de la liasse (Bilan, CR, TFT, annexes) et du prévisionnel.
- [ ] Export Excel structuré (postes, montants N/N-1).
- [ ] L'export d'un état validé reproduit exactement le snapshot (FR-015).
**Dépendances :** FR-015, FR-022.

### FR-024 : Comparaison inter-exercices

**Priorité :** Could Have
**Description :** Restitution de l'évolution des postes sur plusieurs exercices validés (au-delà du simple N/N-1).
**Critères d'acceptation :**
- [ ] Sélection de ≥ 2 exercices validés ; tableau d'évolution par poste.
**Dépendances :** FR-016, FR-022.

---

## Exigences non fonctionnelles

### NFR-001 : Sécurité & contrôle d'accès

**Priorité :** Must Have
**Description :** Relying party RS256/JWKS ; toute opération métier protégée par `@RequiresBilanAccess` (`emailVerified` + KYC `APPROVED` + entitlement `bilan` `ACTIVE`), codes d'erreur explicites.
**Critères d'acceptation :** [ ] Accès refusé (403 explicite) si l'une des conditions manque ; [ ] anti-énumération (404 générique inter-org).
**Rationale :** Données financières sensibles ; gate déjà spécifié en architecture (EPIC-008).

### NFR-002 : Isolation multi-tenant

**Priorité :** Must Have
**Description :** Toutes les données (balances, états, prévisionnels, audit) keyées `orgId` via `TenantScopedRepository`.
**Critères d'acceptation :** [ ] Aucune requête ne retourne de données d'une autre org ; [ ] tests d'isolation e2e.
**Rationale :** Multi-vertical partagé.

### NFR-003 : Exactitude & intégrité comptable

**Priorité :** Must Have
**Description :** Calculs déterministes et rapprochables ; gestion des arrondis en XOF sans perte ; articulation des états garantie.
**Critères d'acceptation :** [ ] Jeux de test comptables de référence rejoués à chaque build ; [ ] contrôles d'articulation (actif=passif, trésorerie) au vert sur les liasses validées.
**Rationale :** Une liasse fausse est pire qu'absente.

### NFR-004 : Immutabilité & traçabilité

**Priorité :** Must Have
**Description :** Snapshots validés append-only (aucune mutation en place) ; piste d'audit non modifiable.
**Critères d'acceptation :** [ ] Toute correction crée une nouvelle version ; [ ] l'audit conserve l'historique complet.
**Rationale :** Invariant programme (l'automatisation propose, l'humain valide).

### NFR-005 : Sauvegardes & durabilité

**Priorité :** Must Have
**Description :** Sauvegardes de la base `bilan_service` **dès la mise en production interne** (c'est la comptabilité réelle de MV).
**Critères d'acceptation :** [ ] Sauvegardes Mongo planifiées et testées (restauration vérifiée) ; RPO/RTO précisés au doc ops (M11).
**Rationale :** DG-1 : ce qui ne se relâche pas — sauvegardes dès septembre.

### NFR-006 : Performance

**Priorité :** Should Have
**Description :** Import + génération d'une liasse pour une balance de taille courante (quelques milliers de comptes) en temps interactif ; recalcul de prévisionnel réactif.
**Critères d'acceptation :** [ ] Génération liasse < ~10 s pour une balance courante ; [ ] recalcul prévisionnel < ~2 s.
**Rationale :** Usage interactif par un comptable.

### NFR-007 : Observabilité

**Priorité :** Should Have
**Description :** Logs pino (`requestId`) ; traçabilité des événements consommés (`eventId`) ; surveillance du lag de consommation des read-models (fraîcheur du gate).
**Critères d'acceptation :** [ ] Logs corrélés ; [ ] métrique de lag exposée.
**Rationale :** Cohérence éventuelle du gate à surveiller.

### NFR-008 : Documentation & tests

**Priorité :** Should Have
**Description :** Swagger `/api/docs` ; seuils Jest 65/90/90/90 ; e2e par service + cross-service docker ; jeux de test comptables de référence.
**Critères d'acceptation :** [ ] Couverture au seuil ; [ ] e2e du parcours import→validation→export.
**Rationale :** Standard PROSPERA (NFR-006 programme).

### NFR-009 : Intégrité des artefacts de référentiel

**Priorité :** Should Have
**Description :** Vérification du checksum sha256 des paquets de référentiel avant usage (B5).
**Critères d'acceptation :** [ ] Paquet au hash non conforme refusé ; [ ] cache local tolérant à une indisponibilité transitoire du registre.
**Rationale :** Un référentiel altéré fausserait tous les états.

---

## Epics

### EPIC-009 : Import & normalisation de balance

**Description :** Téléversement, parsing, contrôle d'intégrité et normalisation des balances (N et N-1), profils d'import.
**Exigences fonctionnelles :** FR-001, FR-002, FR-003, FR-004
**Estimation stories :** 4-6
**Priorité :** Must Have
**Valeur métier :** Porte d'entrée du module — sans import fiable, rien en aval.

### EPIC-010 : Référentiels & table de passage

**Description :** Chargement du référentiel de l'org, table de passage comptes→postes, multi-référentiel SYSCOHADA/SFD, surcharges locales.
**Exigences fonctionnelles :** FR-005, FR-006, FR-007, FR-008
**Estimation stories :** 4-6
**Priorité :** Must Have
**Valeur métier :** Cœur du découplage P7 (moteur ⊥ référentiel) ; conditionne l'exactitude des états.

### EPIC-011 : États financiers (liasse OHADA)

**Description :** Génération de la liasse : Bilan, Compte de résultat, Tableau des flux, notes annexes, contrôles de cohérence.
**Exigences fonctionnelles :** FR-009, FR-010, FR-011, FR-012, FR-013
**Estimation stories :** 5-8
**Priorité :** Must Have
**Valeur métier :** Le livrable central — les états financiers de l'org.

### EPIC-012 : Validation, clôture & immutabilité

**Description :** Cycle brouillon→validé, snapshot figé immuable, exercices comptables, piste d'audit.
**Exigences fonctionnelles :** FR-014, FR-015, FR-016, FR-017
**Estimation stories :** 4-6
**Priorité :** Must Have
**Valeur métier :** Applique l'invariant d'immutabilité (l'humain valide) — indispensable pour une compta de référence.

### EPIC-013 : Prévisionnel

**Description :** Hypothèses paramétrables, projection annuelle 3 ans, plan de trésorerie mensuel 12 mois, scénarios comparés.
**Exigences fonctionnelles :** FR-018, FR-019, FR-020, FR-021
**Estimation stories :** 4-6
**Priorité :** Must Have
**Valeur métier :** Différenciateur produit (Bilan **& prévisionnel**) et outil de pilotage interne MV.

### EPIC-014 : Consultation & export

**Description :** Restitution structurée des états et du prévisionnel, export PDF/Excel, comparaison inter-exercices.
**Exigences fonctionnelles :** FR-022, FR-023, FR-024
**Estimation stories :** 3-5
**Priorité :** Must Have (FR-024 Could)
**Valeur métier :** Rend le travail exploitable et partageable.

> **Note de continuité tracker.** Ces six epics (EPIC-009…EPIC-014) détaillent ce que `sprint-status.yaml` référençait comme placeholder « EPIC-009 (moteur v1) ». Ils s'appuient sur **EPIC-008** (squelette d'intégration : scaffold, read-models, gate, `ReferentielLoader` — STORY-035→038). Le découpage en stories et l'ordonnancement en sprints se font au `/bmad:sprint-planning` **juste-à-temps** (dev sept.-oct. 2026).

---

## User Stories (haut niveau)

- *EPIC-009* — « En tant que comptable MV, je veux **importer ma balance Excel** et être alerté si elle est déséquilibrée, afin de partir de données fiables. »
- *EPIC-010* — « En tant que comptable, je veux que **mes comptes soient rattachés automatiquement** aux postes SYSCOHADA et arbitrer les cas non reconnus, afin d'obtenir des états corrects. »
- *EPIC-011* — « En tant que gestionnaire, je veux **générer la liasse complète (Bilan, CR, flux)** avec colonnes N/N-1, afin de disposer de mes états financiers. »
- *EPIC-012* — « En tant que responsable, je veux **valider et figer** un exercice, afin que les états ne puissent plus être modifiés en douce. »
- *EPIC-013* — « En tant que dirigeant, je veux **projeter ma trésorerie sur 12 mois et mon résultat sur 3 ans** selon des hypothèses, afin de piloter. »
- *EPIC-014* — « En tant qu'utilisateur, je veux **exporter en PDF/Excel** la liasse validée, afin de la partager. »

Le détail des stories est produit en Phase 4 (sprint planning).

---

## User Personas

- **Comptable / gestionnaire interne Money Vibes** *(persona pilote v1)* — importe la balance, arbitre le mapping, valide la liasse, construit le prévisionnel.
- **Dirigeant MV** — consomme états et prévisionnel pour le pilotage.
- **Administrateur plateforme (PLATFORM_ADMIN)** — supervise l'usage (la revue KYC / l'octroi d'entitlement se font hors bilan-service).
- **(Futurs, externes)** cabinet d'expertise comptable (SYSCOHADA révisé), IMF/SFD (référentiel SFD-BCEAO), distributeur — verticaux consommateurs à l'ouverture externe.

---

## User Flows

1. **Import → liasse → validation.** Upload balance N (+ N-1) → contrôle d'équilibre → mapping référentiel proposé → arbitrage des comptes non mappés → génération de la liasse (BROUILLON) → contrôles de cohérence → **validation** → snapshot figé immuable.
2. **Prévisionnel.** Depuis une liasse validée → saisie/édition des hypothèses → génération CR + trésorerie prévisionnels (12 mois mensuels + 3 ans annuels) → duplication en scénarios → export.
3. **Consultation & export.** Sélection exercice/version → consultation N/N-1 → export PDF/Excel (fidèle au snapshot).

---

## Dépendances

### Internes
- **auth-service** — jetons RS256/JWKS ; `bilan-service` dans `AUTH_AUDIENCE`.
- **kyc-service** — `kyc.status.changed` → read-model `OrgKycStatus` (gate).
- **platform-catalog-service** — `entitlement.changed` → read-model `OrgBilanEntitlement` (version, référentiel, statut ACTIVE).
- **bilan-service EPIC-008 (squelette)** — scaffold `:3004`, relying party, read-models, gate `@RequiresBilanAccess`, `ReferentielLoader` — **prérequis** des epics fonctionnels.
- **Registre d'artefacts (MinIO)** — paquets de référentiel versionnés.

### Externes
- **Référentiels comptables OHADA** — plan de comptes + tables de passage **SYSCOHADA révisé** et **SFD-BCEAO** à constituer/versionner comme paquets (source réglementaire).
- **Formats de balance** des logiciels comptables sources utilisés par MV (structure Excel/CSV).
- Bibliothèques de génération **PDF/Excel**.

---

## Hypothèses

- Client zéro = **Money Vibes Group** (dogfooding, DG-1), société commerciale sous **SYSCOHADA révisé** ; **SFD-BCEAO** packagé mais éprouvé quand des données SFD internes existent.
- **NB-1** : calcul **depuis balance importée** ; pas de saisie d'écritures (`comptabilite-service` différé, FI-2).
- **Une seule version de code** en service (N/N-1 & multi-version différés, DG-1) — le mécanisme d'entitlement reste prévu.
- L'entitlement `bilan` `ACTIVE` est maintenu par le vertical/admin (séparation abonnement ≠ entitlement).
- Monnaie **XOF** unique en v1.

---

## Hors périmètre (v1)

- **Saisie d'écritures comptables / moteur d'écritures** (`comptabilite-service`, décision FI-2).
- **OCR de pièces comptables** (`document-service` — périmètre strictement KYC en v1, DO-1).
- **Fiscalité** : DSF, liasse fiscale, TVA déclarative (`fiscal-service`, Module 3).
- **Consolidation multi-sociétés**, comptabilité **analytique**, **multi-devises** (hors XOF).
- **Migration d'historique inter-versions majeures** du moteur (doc ops).
- **Édition du catalogue / des référentiels** (`platform-catalog-service` ; le paquet est téléchargé, pas édité ici).
- **Routage multi-version / N-1** (différé jusqu'au 1er client externe, DG-1).

---

## Questions ouvertes

1. **Format(s) de balance prioritaire(s)** : quel logiciel/source la compta MV utilise-t-elle (structure exacte des colonnes) ?
2. **Constitution du paquet SYSCOHADA révisé v1** : source de vérité du plan de comptes normalisé + table de passage (qui la fournit/valide) ?
3. **Méthode de construction du TFT/TAFIRE** (directe vs indirecte) retenue au référentiel OHADA.
4. **Périmètre précis des notes annexes** générables automatiquement en v1 (lesquelles) vs « à compléter ».
5. **Politique de sauvegarde** (RPO/RTO) → à arrêter au doc ops (M11) avant la prod de septembre.
6. **Bibliothèque PDF/Excel** retenue (contrainte de rendu de la liasse).

---

## Approbation & signatures

### Parties prenantes
- **Product Owner :** vivian
- **Utilisateur pilote :** comptabilité interne Money Vibes Group
- **Eng lead :** vivian (équipe 3 devs)

### Statut d'approbation
- [ ] Product Owner
- [ ] Engineering Lead
- [ ] Utilisateur pilote (compta MV)
- [ ] QA

---

## Historique des révisions

| Version | Date | Auteur | Changements |
|---------|------|--------|-------------|
| 1.0 | 2026-07-10 | vivian | PRD initial du fonctionnel Bilan (NB-1) : import de balance N/N-1, table de passage SYSCOHADA révisé + SFD-BCEAO, liasse complète (Bilan, CR, TFT/TAFIRE, annexes), validation/immutabilité, prévisionnel mensuel 12 mois + annuel 3 ans, consultation/export. 24 FR, 9 NFR, 6 epics (EPIC-009…EPIC-014) sur le squelette EPIC-008. |

---

**Document créé avec BMAD Method v6 — Phase 2 (Planning)**

*Prochaine étape : l'architecture d'intégration existe déjà (`architecture-bilan-service-2026-07-07.md`). Il reste à **co-concevoir l'interface de référentiel** (moteur ⊥ table de passage — risque #2 de l'archi) puis `/bmad:sprint-planning` pour découper EPIC-009…EPIC-014 en stories (dev sept.-oct. 2026).*

---

## Annexe A : Matrice de traçabilité

| Epic | Nom | Exigences fonctionnelles | Stories (est.) |
|------|-----|--------------------------|----------------|
| EPIC-009 | Import & normalisation de balance | FR-001, FR-002, FR-003, FR-004 | 4-6 |
| EPIC-010 | Référentiels & table de passage | FR-005, FR-006, FR-007, FR-008 | 4-6 |
| EPIC-011 | États financiers (liasse OHADA) | FR-009, FR-010, FR-011, FR-012, FR-013 | 5-8 |
| EPIC-012 | Validation, clôture & immutabilité | FR-014, FR-015, FR-016, FR-017 | 4-6 |
| EPIC-013 | Prévisionnel | FR-018, FR-019, FR-020, FR-021 | 4-6 |
| EPIC-014 | Consultation & export | FR-022, FR-023, FR-024 | 3-5 |

**Prérequis transverse :** EPIC-008 (squelette d'intégration, STORY-035→038) — scaffold, read-models, gate, `ReferentielLoader`.

---

## Annexe B : Détails de priorisation

**Exigences fonctionnelles (24) :**
- **Must Have (16) :** FR-001, FR-002, FR-003, FR-005, FR-006, FR-007, FR-009, FR-010, FR-011, FR-014, FR-015, FR-016, FR-018, FR-019, FR-020, FR-022, FR-023
- **Should Have (7) :** FR-004, FR-008, FR-012, FR-013, FR-017, FR-021
- **Could Have (1) :** FR-024

**Exigences non fonctionnelles (9) :**
- **Must Have (5) :** NFR-001, NFR-002, NFR-003, NFR-004, NFR-005
- **Should Have (4) :** NFR-006, NFR-007, NFR-008, NFR-009

**Lecture MoSCoW.** Le v1 fonctionnel est volontairement large (liasse complète + 2 référentiels + prévisionnel double) : le **noyau Must** (import fiable → mapping → Bilan/CR/TFT → validation figée → prévisionnel → export) constitue le premier jalon interne livrable ; les **Should** (annexes, surcharges, scénarios, audit enrichi) et le **Could** (multi-exercices) s'ajoutent en itérations sans bloquer le jalon oct. 2026.
