# Addendum — PRD « Les services du cabinet » (2026-11-18)

Ce qui ne tient pas dans le PRD : l'inventaire de l'existant (relevé le 2026-11-18 sur `origin/dev` des services et
`origin/main` de `prospera-stories`), le placement technique, les alternatives écartées et la veille.

## 1. L'existant, service par service

### 1.1 Financement (`bilan-service`)

- **États** : bilan N/N-1, compte de résultat, SIG SYSCOHADA (STORY-111), TFT (`etats/tft-production.service.ts`),
  annexes, contrôles. Export PDF/Excel : `GET /api/v1/dossiers/:dossierId/bilan/export/etats/:jeuEtatsId?format=`.
- **Prévisionnel (EPIC-013), livré** : `projection/` (modèle 1.13.0) — compte de résultat, plan de trésorerie, bilan
  simplifié sur N+1..N+3 ; mensuel 12 mois (TVA, saisonnalité, créances et dettes) ; BFR, IS, amortissements,
  charges financières, besoin de financement, point mort, CAF. Hypothèses (`hypotheses/hypotheses.schema.ts`) dont
  `empruntsNouveaux`, remboursements, `tauxInteretPct` ; versions, verrouillage, rebasage ; scénarios comparés
  (`GET …/bilan/previsionnel/comparaison?ids=`, STORY-071) ; export `…/bilan/export/previsionnel/:hypothesesId`.
- **Analyse (STORY-552 → 554)** : `GET …/bilan/analyse`, 19 indicateurs avec formule, sources, N-1 et verdict par
  seuils sectoriels NAEMA du paquet. Prévisionnel : `projection/ratios.ts` (endettement, autonomie, capacité de
  remboursement, CAF, point mort).
- **Manque** : objet « dossier de financement » ; tableau d'amortissement par emprunt (les emprunts sont agrégés,
  intérêts sur l'encours moyen) ; DSCR ; plan de financement emplois/ressources ; ratios dans les exports ; document
  assemblé ; aucun écran (FE-035 bloquée, FE-036/037/038 prêtes, aucune story d'écran pour l'analyse).

### 1.2 Archivage (`document-service`)

- **Chemin cabinet en service** (rôles `TENANT_*`, sans gate) : `POST /piece-extractions`, `POST /profil-extractions`,
  `PATCH :id/dossier`, `GET /dossiers/{id}/pieces` (URL signées) ; buckets `profil-documents`, `piece-documents` ;
  aucune purge (STORY-395) ; ni versions, ni scellé, ni numéro d'archive, ni recherche.
- **Module `ged` (STORY-995, 996, 997)** : `@ExigeModule('ged')` ; pièces versionnées, SHA-256, doublons, file « à
  rattacher » ; contrôle humain avant archivage ; OCR hors ligne ; lots `LOT-AAAA-NNNNN` ; versement
  `ARC-AAAA-CCCC-NNNNN`, bordereau, complémentaire `/Cn`, scellé chaîné (`fonds/fonds.controller.ts`) ; chiffrement
  des pièces de santé seulement ; port S3 sans suppression. **Collé à l'assurance** : `dossierId` = dossier
  `sinistres` (topic des dossiers), volet CORP/MATL/DIVR/RECS, statuts terminés des sinistres, rôles d'assurance codés
  en dur (`acces.ts`), droits `ged:*` non posés dans auth.
- **Physique** : seulement dans le PRD assurance (FR-170 → 175 : cote, chemise, 2 500 pages par boîte, étiquette,
  sortie/restitution, double support, reconstitution, 10 ans, destruction visée) ; aucun code (STORY-997 le classe
  hors périmètre).

### 1.3 Missions et facturation

- `dossier-service` : identité du client, affectation, archivage du dossier, exercices, portefeuille ; mandat =
  ligne de journal `MANDAT_ATTESTE` (STORY-301) ; rien sur la mission, le tarif, les honoraires.
- `prospera-paiement-service` : créance générique (`moduleAppelant` libre, `src/domain/creance/creance.ts`), saisie sur
  facture papier (STORY-290), encaissement, rapprochement, liens PI-SPI/FedaPay ; **abonnement** (STORY-277/280,
  `src/domain/abonnement/abonnement.ts`) mensuel/trimestriel/annuel → créance par échéance, grâce, suspension — mais
  contrôleur `@SurfacePlateforme` et **créancier toujours Money Vibes**.
- Facture et numérotation : aucune pour le cabinet ; M09 `facturation` (série `FAC-AAAA-NNNN`, avoirs) est réservé au
  distributeur (`prospera-ventes-service`, groupe D).

### 1.4 Paie

- `prospera-fiscal-service` : base de rémunération (STORY-345, `src/domain/remuneration/ligne-de-remuneration.ts`) par
  (dossier, `AAAA-MM`, bénéficiaire), types `SALARIE`/`DIRIGEANT`/`ASSOCIE`, cinq rubriques soumises, une exclue,
  versionnée, `SAISIE` ou `IMPORT`, sans contrat ni identifiant national (AD-21). À venir : STORY-348 (calcul
  CNSS/IRPP aiguillé), 364 ; sans fiche : 346 (import de paie), 349 (calendrier social), 350 (rapprochement).
- Paquet `paquet-fiscal-togo-2026.json` : `cnss` employeur 17,5 %, salarié 4 %, assiette ; `aCompleter` : plafond,
  branches, **valeur du SMIG** ; barème IRPP annuel (art. 74, 0 → 35 %, 8 tranches) ; pas de retenue mensuelle, ni
  abattements, ni charges de famille, ni taxe sur salaires.
- Décisions antérieures : FR-F28 (paie hors Prospera) — **renversée le 2026-11-18** ; PO 2026-08-15 « IRPP oui, CNSS
  différée » ; FR-F80 (rien d'approximé) — **conservée** ; microfinance FR-242 (pas de paie à l'IMF) — inchangée.

### 1.5 Écrans

- **App cabinet** (`prospera-frontend-expert-comptable`, :3100) : navigation `src/components/layout/nav-config.ts`
  (sections « cabinet » et « modules », entrées par entitlement) ; routes `accueil`, `activite`, `atelier/*`,
  `bilan/{etats,table-de-passage}`, `billing` (plans Prospera seulement), `dossiers`, `dossiers/[id]` (panneaux
  exercices, journal, axes, affectation, archivage du dossier, pièces), `kyc`, `parametres/cabinet`, `users`. Onglet
  `/bilan/previsionnel` déclaré inactif (FE-035).
- **Console** (`frontend-admin-panel`, :3110 ; BFF `admin-panel`) : organisations, revue KYC, catalogue des modules et
  référentiels (dépôt de paquet, version, provenance, intégrité), entitlements, provisionnement par packs, accès RBAC ;
  ni facturation, ni paiement, ni notification. Aucune maquette de console (AP-30 impose un prototype séparé).

## 2. Placement technique (proposé)

| Module | Service | Dépôt | Groupe porteur proposé |
|---|---|---|---|
| `financement` (M49) | `bilan-service` (nouveau dossier `financement/`, réutilise `projection/` et `analyse/`) | existant | A |
| `ged` étendu à la verticale cabinet | `document-service` (porteur générique, plan de classement, physique) | existant | C (tient la GED) ou A |
| `missions` (M39) | `prospera-cabinet-service` (neuf) + `paiement-service` (abonnement à créancier cabinet) | **à créer** | A (paiement : demande à B) |
| `paie` (M41) | `prospera-paie-service` (neuf) + `prospera-fiscal-service` (réception `IMPORT`) | **à créer** | A |
| Console | `frontend-admin-panel` + BFF `admin-panel` ; référentiels publiés par le catalogue | existants | D (console) / A (BFF) |
| Écrans cabinet | `prospera-frontend-expert-comptable` | existant | D |

Les référentiels de la console (exigences bancaires, modèles de lettre, référentiel social) passent par le mécanisme
existant des **référentiels du catalogue** (dépôt d'un paquet versionné, empreinte, pointeur de version) ; la console
ajoute un **éditeur** par référentiel au lieu du dépôt de JSON brut.

## 3. Alternatives écartées

- **Une GED neuve pour le cabinet** : deux GED à tenir, deux chemins de scellé ; écartée (D-SC-4).
- **Les factures du cabinet dans `facturation` (M09) du distributeur** : le module est taillé pour la vente de
  marchandises (proformas, avoirs de retour, stock) et vit dans le service de ventes de D ; la facture d'honoraires est
  plus simple et liée à la mission. Écartée au jour 1 ; la numérotation et les avoirs reprennent son modèle.
- **Les missions dans `dossier-service`** : il porterait la facturation et la signature ; il est le socle de tous les
  modules du cabinet. Écartée.
- **La paie dans `prospera-fiscal-service`** : le fiscal refuse par construction les données de contrat et les
  identifiants nationaux (AD-21) ; la paie en a besoin. Écartée.
- **Transmettre le dossier à la banque par API** : aucune banque raccordée, et la vision place la banque en dernier.

## 4. Veille (2026-11-18, sources secondaires, à vérifier)

- **Missions** : Pennylane facture au cabinet un abonnement distinct des honoraires et recueille les mandats ; des
  tiers vendent la signature électronique aux experts-comptables. Aucune norme ONECCA Togo trouvée sur la lettre de
  mission (https://www.ifac.org/system/files/publications/files/Q%26A%20with%20ONECCA-TOGO.pdf).
- **Conservation OHADA** : 10 ans pour les livres et pièces (AUDCIF 2017 ; l'article reste à confirmer —
  https://www.vie-publique.sn/documents/11026/acte-uniforme-droit-comptable-information-financiere-ohada-2017).
- **Écrit électronique au Togo** : loi 2017-07 sur les transactions électroniques ; décret 2018-062 ; référentiel
  d'archivage électronique ARTP v2.0 (https://arcep.tg/wp-content/uploads/2021/03/Référentiel-Archivage-Electronique-ARTP-V2.0.pdf).
- **Paie** : CNSS salarié 4 %, employeur 17,5 % (3 % prestations familiales, 2 % risques professionnels, 12,5 %
  vieillesse — CLEISS au 01/01/2023, https://www.cleiss.fr/docs/cotisations/togo.html) ; AMU : décret 2023-096 (10 %
  du salaire, au moins la moitié à l'employeur, application à vérifier) ; SMIG 52 500 FCFA depuis 2023 selon plusieurs
  sources ; barème de la retenue mensuelle contradictoire selon les sources — **aller au CGI 2025 (otr.tg)**. Le
  référentiel du projet (paquet fiscal Togo 2026, depuis le CGI et le LPF de l'OTR) fait foi pour ce qu'il contient.
- **Banques UEMOA** : Centrale des bilans de la BCEAO (notation A → E), Bureau d'information sur le crédit, dispositif
  de soutien au financement des PME (https://www.bceao.int/fr/content/presentation-du-dispositif-de-soutien-au-financement-des-pmepmi) ;
  aucune liste publique des pièces exigées : à obtenir d'une banque (Q-SC-1).
