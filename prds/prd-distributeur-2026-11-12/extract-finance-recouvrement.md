# Extrait PRD Distributeur : finance, recouvrement, comptabilité, pilotage (front de démo)

Source : `C:/Users/thier/Documents/prospera-font-end/prospera-distributeur` (Next.js, aucun backend). Les chemins ci-dessous sont relatifs à `src/`. Les numéros de ligne sont ceux du code lu le 2026-11-12.

Légende d'état des actions :
- **MORT** : bouton sans `onClick`, ou désactivé sans effet.
- **SIMULÉ** : l'état change en local (state React, ou `localStorage` via `lib/persistence.ts`) et un message s'affiche. Rien n'est envoyé, aucune pièce n'est créée.
- **BRANCHÉ** : appel à un vrai service. **Aucune action de ces modules n'est BRANCHÉE** : zéro appel réseau, zéro API.

Les docs (`docs/AUDIT_PERSONAS_AMELIORATIONS.md`, fiches personas) sont en partie périmées. Plusieurs boutons qu'elles donnent pour « MORTS » sont désormais SIMULÉS. Ce qui suit se fonde sur le code.

---

## 0. Cadre commun

- **Rôles** (`types/index.ts:1-15`) : `DG, DC, RESP_VENTES, SUPERVISEUR, COMMERCIAL, FREELANCE, PROSPECTION, RESP_STOCK, GEST_ENTREPOT, DAF, COMPTABLE, CONTROLE_GESTION, MARKETING, RECOUVREMENT`.
- **Accès par route** (`lib/route-access.ts`) :
  - `/facturation` (l.36) : DG, DC, RESP_VENTES, COMMERCIAL, FREELANCE, PROSPECTION, DAF, COMPTABLE, CONTROLE_GESTION, RECOUVREMENT.
  - `/relances` (l.37) : DG, DC, RESP_VENTES, SUPERVISEUR, COMMERCIAL, DAF, RECOUVREMENT.
  - `/comptabilite` (l.55) : DG, DAF, COMPTABLE, RECOUVREMENT.
  - `/pilotage-financier` (l.11) : DG, DC, DAF.
  - `/controle-gestion` (l.14) : CONTROLE_GESTION seul. DG et DAF ne reçoivent que les rapports envoyés.
- **Persistance** : `lib/persistence.ts` (`loadJSON`/`saveJSON` sur `localStorage`, erreurs ignorées). Clés :
  - `prospera.facturation.proformas.v1`
  - `prospera.facturation.events.v1`
  - `prospera-recouvrement-events`
  - `prospera.decisions.journal.v1`
  - `prospera.cdg.rapports.v1`
- **Date figée** : le jeu de démo est calé au **11/06/2026**. Cette date est codée en dur dans `joursAvantExpiration` (`lib/proforma-builder.ts:106`), dans `ProformaBuilder.tsx:26`, dans `convertirEnCommande` (`proforma-builder.ts:129`) et dans la synthèse comptable (`comptabilite-dg-builder.ts:65`).
- **Devise** : FCFA entier, sans devise portée par les objets.
- **Pas de journal d'audit commun**. Chaque module a son propre journal local, sans identifiant d'organisation ni de tenant.

---

## 1. Route `/facturation` (`app/(dashboard)/facturation/page.tsx`)

`FacturationShell` (`components/facturation/FacturationShell.tsx:14-27`) affiche trois onglets selon le rôle. Le rôle atterrit sur son onglet par défaut (l.38-44). Le paramètre `?tab=` est accepté.

| Onglet | Id | Rôles |
|---|---|---|
| Factures & créances | `factures` | DG, DC, DAF, COMPTABLE, RECOUVREMENT |
| Proformas | `proformas` | DG, DC, RESP_VENTES, SUPERVISEUR, COMMERCIAL, FREELANCE, PROSPECTION, DAF, COMPTABLE |
| E-facturation & avoirs | `efacture` | DG, DAF, COMPTABLE |

Remarque : CONTROLE_GESTION et RESP_VENTES ont accès à la route (`route-access.ts:36`) mais aucun onglet dans le Shell pour CONTROLE_GESTION. `disponibles.length === 0` renvoie `null` (l.46), donc un écran vide. À corriger dans le PRD.

### 1.1 Factures & créances (`FacturationView.tsx`, 368 lignes)

**Ce que l'écran montre**
- 8 KPI (l.101-117) :
  - CA facturé
  - Encaissé
  - Créances ouvertes
  - Impayés en retard
  - Taux de recouvrement
  - Délai d'encaissement
  - Factures en retard
  - Clients à risque
- Bloc « Top clients impayés » (5 premiers) avec pastille « PLAFOND DÉPASSÉ ».
- Bloc « Recouvrement par commercial ».
- Liste filtrable : 7 vues (`VUE_OPTIONS` l.22-30) + 5 filtres de statut. Triée par `EN_RETARD, PARTIELLE, EMISE, PAYEE, BROUILLON`, puis par jours de retard décroissants (l.84-87).
- **Grille tarifaire** par type de client (l.209-241) : remise de base, délai de paiement, plafond type, exemple de produit, prix public et prix client.
- « Analyses IA créances » (panneau latéral).
- Fiche facture dépliable : lignes, marge facture, plafond, lien commande.

**Périmètre de données** : `getFacturationHub(ctx)` (`lib/facturation-hub.ts`) filtre par périmètre du rôle via `scopeDocumentsPdv`. Un commercial ne voit que son portefeuille.

**Objets métier** (`types/index.ts`)
- `FactureStatut` (l.32) : `'BROUILLON' | 'EMISE' | 'PARTIELLE' | 'PAYEE' | 'EN_RETARD'`.
- `ModePaiementFacture` (l.101) : `'VIREMENT' | 'ESPECES' | 'CHEQUE' | 'CREDIT_30J' | 'CREDIT_45J' | 'CREDIT_60J'`.
- `TypeDocument` (l.151) : `'DEVIS' | 'PROFORMA' | 'FACTURE' | 'AVOIR' | 'FACTURE_ACHAT'`.
- `LigneFacture` (l.103-110) : `reference, produit, quantite, prix_unitaire, remise_pct, total`.
- `Facture` (l.112-145) :
  - Champs de base : `id, numero, pdv_nom, montant, paye, statut, echeance, jours_retard`.
  - Champs optionnels, registre DG :
    - `pdv_id, zone, commercial, type_client, type_magasin, date_emission, commande_ref, entrepot`
    - `lignes[], plafond_credit, marge_facture_pct, mode_paiement, score_risque_ia`
    - `nb_relances, dernier_paiement, synthese_ia`
    - `type_document, montant_ht, tva_pct, montant_ttc, proforma_ref, efacture: EFactureMeta`
  - `montant` est le TTC (libellé « Montant TTC », `FacturationView.tsx:290`). `montant_ht`, `tva_pct` et `montant_ttc` sont déclarés mais **non renseignés** dans le registre : l'écran ne les lit jamais.
- `FactureDG` (`lib/facturation-dg-builder.ts:23-27`) ajoute `reste_a_payer`, `pct_paye` et `niveau_risque ('CRITIQUE'|'ELEVE'|'MODERE'|'FAIBLE')`.
- `ClientImpayeurDG` (l.9-21) :
  - `pdv_id, pdv_nom, zone, commercial, nb_factures_impayees, creance_totale, plus_ancien_retard_j`
  - `plafond_credit, depassement_plafond, score_risque_ia, facture_ids`
- `SyntheseFacturationDG` (l.29-41).
- `AnalyseFacturationIA` (l.43-48) : `severite ('CRITIQUE'|'HAUTE'|'MODEREE'), titre, detail, action`.
- **Pas de type « paiement » ni « encaissement » rattaché à la facture** : seul `paye` (montant cumulé) et `dernier_paiement` (date). Voir §1.5.

**Actions**

| Libellé | Effet attendu | État | Fichier:ligne |
|---|---|---|---|
| Boutons de vue (« Vue globale », « Créances ouvertes », « En retard », « Émises (échéance future) », « Payées », « Partenaires B2B », « Enseigne Atlas Shop ») | Filtre la liste | BRANCHÉ en local (filtre pur) | `FacturationView.tsx:22-30`, `facturation-dg-builder.ts:235-243` |
| Filtres de statut | Filtre | idem | `FacturationView.tsx:259-267` |
| Clic sur une ligne de facture | Ouvre la fiche | idem | `FacturationView.tsx:127` |

**Il n'y a AUCUNE action d'écriture sur une facture** dans cet onglet : ni « Envoyer », ni « Relancer », ni « Imprimer/PDF », ni « Enregistrer un paiement », ni « Créer un avoir ». Les boutons « Envoyer au client » et « Imprimer / PDF » n'existent que dans `DocumentPreview` (§1.4), ouvert depuis l'onglet e-facture et le générateur de proforma.

**Règles de calcul telles que codées** (`lib/facturation-dg-builder.ts`)
- `reste_a_payer = montant − paye` (l.78). `pct_paye = round(paye/montant × 100)` (l.82).
- **Niveau de risque** (`niveauRisque`, l.67-74), évalué dans cet ordre :
  - `CRITIQUE` si `jours_retard > 30` OU `score_risque_ia < 35` OU `reste > plafond_credit`.
  - `ELEVE` si `jours_retard > 14` OU `score < 55`.
  - `MODERE` si `jours_retard > 0` OU statut `PARTIELLE`.
  - `FAIBLE` sinon.
  - Le score par défaut est 70 si absent.
- **Retard** : `EN_RETARD`, ou `PARTIELLE` avec `jours_retard > 0` (l.92, 238).
- **CA facturé** = somme des `montant` (TTC) de toutes les factures chargées. Il n'y a ni filtre de période ni calcul HT (l.89).
- **Taux de recouvrement** = `encaissé / CA × 100`, arrondi à 0,1 (l.115).
- **Délai moyen d'encaissement** (l.95-100, 114) :
  - Moyenne de `dernier_paiement − date_emission` sur les factures `PAYEE`.
  - **25 j par défaut** si les dates manquent (l.96) ; **28 j** si aucune facture payée (l.114).
- **Clients à risque** = nombre de `pdv_id` distincts ayant une facture `CRITIQUE` ou `ELEVE` (l.102-104).
- **Top impayeurs** (l.121-151) :
  - Regroupe par client les factures dont `reste > 0`.
  - `depassement_plafond = plafond > 0 && creance > plafond`.
  - **Le plafond est celui de la première facture du client** (`first.plafond_credit`), pas une valeur portée par le client.
- **Marge par facture** : lue sur `marge_facture_pct`, avec **15 % par défaut codé en dur** (`FacturationView.tsx:293` et `facturation-dg-builder.ts:116`). Le front **ne recalcule jamais** la marge à partir des lignes.
- **Plafond de crédit** : donnée (`plafond_credit`, en FCFA) portée par la facture. Les fourchettes par type de client sont dans `GRILLE_PRIX_ENTREPRISE` (`lib/registries/factures-registry.ts:287-301`) :

  | Type de client | Remise de base | Délai de paiement | Plafond type |
  |---|---|---|---|
  | Dépôt / Grossiste volume | 8 % | CREDIT_60J | 5–15 M |
  | Grossiste | 5 % | CREDIT_30J | 3–10 M |
  | Superette | 3 % | CREDIT_30J | 5–12 M |
  | Épicerie / Kiosque | 0 % | CREDIT_30J | 1–4 M |
  | Enseigne Atlas Shop | 0 % | VIREMENT | illimité (interne) |

  Ces plafonds sont du texte libre (`plafond_type: string`), non exécutable.
- **Numérotation** : `FAC-AAAA-NNNN` (ex. `FAC-2026-8821`) dans le registre de factures. La comptabilité utilise un autre format (`FAC-8840`, voir §4).
- **Incohérence de données à ne pas reprendre** : le total des `lignes` d'une facture ne rejoint pas `montant`. Exemple `FAC-2026-8821` : lignes = 3 450 000 contre `montant` = 2 840 000 (`factures-registry.ts:41-52`). Le PRD doit imposer l'identité `Σ lignes = HT`, `HT × 1,18 = TTC`.

**Analyses IA (`buildAnalysesFacturationIA`, l.178-233)** : ce sont des **textes écrits à la main sur des noms de clients précis** (Kiosque Port, Grossiste Adidogomé, Komlan Tetteh, Épicerie Mama T.), pas un modèle. Les seuils codés : commercial concentré si impayés > 5 M ; blocage livraison immédiat, mise en demeure et contentieux sous 7 j pour Kiosque Port ; acompte 50 % et plafond ramené à 3 M pour Grossiste Adidogomé ; « automatiser relance J+3 via WhatsApp » ; « bonus commercial lié au DSO < 35 j ».

### 1.2 Proformas (`ProformasView.tsx` + `ProformaBuilder.tsx` + `lib/proforma-builder.ts`)

**Ce que l'écran montre**
- 6 KPI (l.67-74) :
  - Proformas en attente
  - Taux d'acceptation
  - Délai proforma → cmd
  - Montant en jeu
  - Expirent sous 48 h
  - Score moyen IA
- Liste filtrée (7 statuts, `ProformasView.tsx:20-22`).
- Pour les rôles de pilotage (`ROLES_PILOTAGE` l.25 : DG, DC, RESP_VENTES, SUPERVISEUR, DAF, COMPTABLE) : panneau « Acceptation par commercial ».
- Un rôle portefeuille (COMMERCIAL, FREELANCE, PROSPECTION…) ne voit que ses proformas : `p.commercial === user.nom` (l.40-42).
- Aperçu imprimable (`DocumentPreview`) de la proforma sélectionnée.

**Objets** (`types/index.ts`)
- `ProformaStatut` (l.153-154) : `'BROUILLON' | 'ENVOYEE' | 'VUE' | 'ACCEPTEE' | 'REFUSEE' | 'EXPIREE' | 'CONVERTIE'`.
- `CanalEnvoiProforma` (l.156) : `'WHATSAPP' | 'EMAIL' | 'SMS' | 'IMPRESSION'`.
- `Proforma` (l.158-183) :
  - Identité : `id, numero, pdv_id, pdv_nom, commercial, zone`.
  - Dates : `date_emission, date_validite`.
  - Contenu : `lignes: LigneFacture[]`.
  - Montants : `montant_ht, tva_pct, montant_ttc, remise_globale_pct`.
  - Statut et conditions : `statut, conditions_paiement: ModePaiementFacture`.
  - Liens : `commande_ref?, facture_ref?`.
  - Aide IA : `score_acceptation_ia` (0-100), `suggestion_ia?`.
  - Envoi : `canal_envoi`, `vue_le?`, `relances_envoyees`.
- `DocEvent` (`lib/facturation-workflow.ts:14-24`) : `kind ('CONVERSION'|'RELANCE'|'RETRANSMISSION'), refId, at, by, payload`. C'est un journal idempotent par couple `kind + refId`.

**Actions**

| Libellé | Effet attendu | État | Fichier:ligne |
|---|---|---|---|
| « Créer une proforma » / « ← Retour à la liste » | Bascule vers le builder | local | `ProformasView.tsx:84-88` |
| « Convertir en commande » | Crée commande et facture | **SIMULÉ** : génère `CMD-2026-NNNN` et `FAC-2026-NNNN` via `genererReference`, stocke un `DocEvent` `CONVERSION`, passe la proforma créée à `CONVERTIE`. **Aucune commande ni facture n'apparaît dans les autres écrans**, et le statut des proformas du registre n'est pas modifié (seule `estConvertie` les affiche comme converties). | bouton `ProformasView.tsx:174-177`, logique `contexts/FacturationWorkflowContext.tsx:94-115` |
| « Relancer par {canal} » | Relance le client | **SIMULÉ** : incrémente un compteur (`DocEvent` `RELANCE` avec `count, canal`), toast. Rien n'est envoyé. | `ProformasView.tsx:178-181`, `FacturationWorkflowContext.tsx:123-134` |
| « Envoyer au client » (dans l'aperçu du builder) | Envoie la proforma | **SIMULÉ** : `creerProforma` écrit dans `localStorage`, statut `ENVOYEE`. Le texte annonce WhatsApp « mise en file si hors réseau », mais **aucune file d'envoi n'existe**. | `ProformaBuilder.tsx:98-122, 327`, `DocumentPreview.tsx:156` |
| « Imprimer / PDF » | PDF | **SIMULÉ** : `window.print()` (impression du navigateur, pas de génération de PDF). | `DocumentPreview.tsx:160-165` |

Le bouton « Convertir en commande » est affiché pour les statuts `ENVOYEE, VUE, ACCEPTEE, BROUILLON` (l.172). Il est donc possible de convertir une proforma jamais acceptée, ce que la règle métier du PRD devra interdire.

**Règles de calcul** (`lib/proforma-builder.ts`)
- **TVA** : `TVA_PCT = 18` (l.14, constante globale « TVA Togo »).
- **Totaux** (`calculerTotaux`, l.24-29) :
  - `brut = Σ lignes.total`.
  - `HT = round(brut × (1 − remise_globale/100))`.
  - `TVA = round(HT × 0,18)`.
  - `TTC = HT + TVA`.
  - L'arrondi est à l'unité (FCFA entier).
- **Ligne** (`ligneDepuisProduit`, l.31-41) : `total = round(prix_unitaire × qte × (1 − remise_ligne/100))`. Prix unitaire = `ProduitStock.prix_unitaire`, sans lecture de la grille tarifaire par type de client dans le builder.
- **Validité** : `VALIDITE_JOURS = 15` (l.16). `date_validite = date_émission + 15 j`. Commentaire : au-delà, la proforma passe `EXPIREE`. **Ce passage à `EXPIREE` n'est codé nulle part** : le statut est une donnée du registre.
- **Expirante** (`estExpirante`, l.112-116) : statut `ENVOYEE|VUE|BROUILLON` et jours restants entre 0 et 2 inclus. Le KPI « Expirent sous 48 h » en découle.
- **Probabilité d'acceptation** (`scoreAcceptationIA`, l.47-80), base 25 pts :
  - Départ : `score = score_pdv × 0,5`.
  - Pénalité de plafond : `− min(25, (creance/plafond) × 30)`.
  - Bonus de remise : `+ min(20, remise_globale_pct × 3,5)`.
  - Panier : si `ratio = TTC / panier_habituel > 1,5`, alors `− min(18, (ratio−1,5) × 12)` ; si `ratio < 0,8`, alors `+ 6`.
  - Vue : `+ 8` si la proforma a été vue.
  - Relances : `− 4 × relances_envoyees`.
  - Résultat final : `clamp(0, 100, round(score + 25))`.
  - Dans le builder (`ProformaBuilder.tsx:56, 60-70`) :
    - `plafond = max(1 000 000, round(ca_mois × 1,5))`
    - `panier_habituel = max(200 000, round(ca_mois / 3))`
    - `vue` et `relances_envoyees` ne sont **pas** passés (nouvelle proforma)
  - Seuils d'affichage (`ProformasView.tsx:156-157`) : ≥ 70 vert, ≥ 50 orange, sinon rouge.
- **Suggestion IA** (`suggestionIA`, l.83-103), 1er cas qui s'applique :
  - Si `ACCEPTEE` ou `CONVERTIE` : aucune suggestion.
  - Créance > 0 et score < 50 : solder l'impayé avant de relancer.
  - Remise globale < 3 et score < 65 : proposer une remise de 3 % (+10 pts annoncés, soit `min(20, 3 × 3,5)` arrondi).
  - `ENVOYEE` sans relance : relance WhatsApp le jour même.
  - `VUE` : appeler.
  - `scorePdv ≥ 80` et score ≥ 70 : convertir directement.
- **Synthèse** (`buildSyntheseProformas`, l.151-177) :
  - Taux d'acceptation = `(ACCEPTEE + CONVERTIE) / (ACCEPTEE + CONVERTIE + REFUSEE + EXPIREE)`.
  - Montant en jeu = Σ TTC des `BROUILLON|ENVOYEE|VUE`.
  - **Délai moyen de conversion** : pour chaque `CONVERTIE`, `max(1, round((date_validite − date_emission) / 2))`. C'est un **proxy factice** (la moitié de la durée de validité), pas un délai mesuré.
- **Conversion → commande** (`convertirEnCommande`, l.119-139) : produit une `Commande` `statut: 'VALIDEE'`, `montant_societe = TTC`, `marge_brute_pct: 16` en dur, `priorite_ia: 'NORMALE'`. **Cette fonction n'est appelée nulle part** : le contexte génère juste deux références (`FacturationWorkflowContext.tsx:94-115`). Le séquenceur démarre à `210 + nb conversions + 1` (l.98).
- **Numérotation** : `genererReference(prefixe: 'CMD'|'FAC'|'PRO', seq)` → `${prefixe}-2026-${seq sur 4 chiffres}` (`facturation-workflow.ts:81-83`). **L'année 2026 est figée.** Le numéro de proforma du builder = `143 + nb proformas créées + 1` (`ProformaBuilder.tsx:96`). Le compteur n'est donc **ni global, ni transactionnel, ni par organisation**.

**Contrôle de plafond à la saisie (builder)** : `encoursApres = creance + TTC` ; si `> plafond` : bandeau rouge « Validation superviseur requise » (`ProformaBuilder.tsx:56-58, 157-163`). **Aucune validation n'est réellement demandée** : l'envoi reste possible.

**Marge freelance** (`ProformaBuilder.tsx:22-23, 72-74`) :
- Marge = `TTC × majoration (15 % par défaut)`.
- Minimum **12 %** (`MARGE_MIN_FREELANCE_PCT`) sous lequel un bandeau d'alerte s'affiche. L'envoi n'est pas bloqué.

### 1.3 E-facturation et avoirs (`EFactureView.tsx` + `lib/efacture-builder.ts`)

**Ce que l'écran montre**
- 6 KPI (l.47-54) :
  - Taux de certification
  - Certifiées
  - Transmises
  - En file
  - Rejets à corriger
  - Montant non certifié
- Bloc « Rejets à corriger » avec motif et nombre de tentatives.
- Tableau « File de transmission » :
  - Facture, client, montant, statut, n° de certification, archive.
  - Filtre par statut, tri : `REJETEE, EN_ATTENTE, TRANSMISE, NON_TRANSMISE, CERTIFIEE` (l.16).
  - Clic ouvre la facture en modale.
- Liste des avoirs.

**Objets**
- `EFactureStatut` (`types/index.ts:185-186`) : `'NON_TRANSMISE' | 'EN_ATTENTE' | 'TRANSMISE' | 'CERTIFIEE' | 'REJETEE'`.
- `EFactureMeta` (l.188-201) :
  - Identité : `facture_id`.
  - Statut : `statut`.
  - Certification : `numero_certification?`.
  - Dates : `date_transmission?`.
  - QR : `qr_code_payload?`.
  - Intégrité : `hash_document?`.
  - Rejet : `motif_rejet?`.
  - Plateforme : `plateforme: 'OTR_TOGO' | 'INTERNE'`.
  - Suivi : `tentatives`.
  - Archivage : `archive_legale_url?` (« conservation légale 10 ans »).
- `Avoir` (`efacture-builder.ts:134-143`, **type local, pas dans `types/index.ts`**) : `id, numero, facture_ref, pdv_nom, motif, montant_ht, montant_ttc, date, statut: 'EMIS' | 'IMPUTE' | 'REMBOURSE'`. Les 3 avoirs (`AV-2026-0010` à `0012`) sont **codés en dur** (`REGISTRE_AVOIRS`, l.146-159) et **aucune ligne** n'est portée (pas de `LigneFacture[]`).

**Actions**

| Libellé | Effet attendu | État | Fichier:ligne |
|---|---|---|---|
| « Corriger et retransmettre » | Corrige le rejet et renvoie à la plateforme fiscale | **SIMULÉ** : crée un `DocEvent` `RETRANSMISSION`, bascule l'affichage sur « Corrigée et retransmise — certification en attente ». **Aucune correction du NIF, de la TVA ou du code douanier n'est possible**, et la facture reste `REJETEE` dans les données. | `EFactureView.tsx:92-95`, `FacturationWorkflowContext.tsx:141-144` |
| « Voir » (ligne de file) | Ouvre la facture imprimable avec QR | local | `EFactureView.tsx:138-162, 175-209` |
| « Fermer » | Ferme la modale | local | `EFactureView.tsx:188-191` |

Aucun bouton de **création d'avoir**, de **transmission manuelle** ou de **téléchargement de l'archive**. L'icône « Archive » est décorative.

**Règles**
- **Le statut e-facture est DÉRIVÉ, non reçu d'une plateforme** (`statutPour`, `efacture-builder.ts:41-48`) :
  - `BROUILLON` donne `NON_TRANSMISE`.
  - Les numéros listés dans `MOTIFS_REJET` donnent `REJETEE`.
  - Sinon, avec `jours = jours_retard > 0 ? jours_retard : index` :
    - `≥ 10` donne `CERTIFIEE`.
    - `≥ 3` donne `TRANSMISE`.
    - sinon `EN_ATTENTE`.
  - Le critère « ancienneté de l'impayé » comme preuve de certification est un artefact de démo.
- **Tentatives** : 2 si rejetée, 0 si non transmise, 1 sinon (l.59).
- **N° de certification** : `OTR-2026-{chiffres du numéro de facture}` (l.53).
- **Hash du document** : empreinte pseudo-hash (`h = h × 31 + charCode`) sur `numéro|montant|OTR_TOGO`, répétée pour 32 caractères hex (l.15-22). **Ce n'est pas une signature**, pas de clé, pas de SHA.
- **QR** : `OTR:{cert};FAC:{numero};TTC:{montant};DATE:{date}` (l.25-32). Le rendu est une icône `QrCode` générique, pas un vrai QR (`DocumentPreview.tsx:143-150`).
- **Archive légale** : `archive://otr/2026/{numero}.xml`, seulement pour `CERTIFIEE`. URL fictive.
- **Motifs de rejet simulés** (3 factures, l.35-39) :
  - `FAC-2026-8821` : « NIF du client absent… sur la fiche Kiosque Port ».
  - `FAC-2026-8830` : « TVA incohérente : 18 % attendus, 17,4 % déclarés après remise ligne non répercutée sur la TVA ».
  - `FAC-2026-8825` : « Référence produit inconnue de la nomenclature fiscale sur 2 lignes — code douanier à renseigner ».

  Ces cas disent ce que la plateforme fiscale vérifie : **NIF client**, **cohérence du taux de TVA** et **nomenclature produit**. Le PRD en tire des contrôles préalables à la transmission.
- **Synthèse** (`buildSyntheseEFacture`, l.106-123) :
  - Taux de certification = `certifiées / (toutes − NON_TRANSMISE)`.
  - Montant non certifié = Σ `montant` des factures non `CERTIFIEE`.
- **HT d'une facture en e-facture** : `Math.round(montant / 1,18)` codé en dur dans la vue (`EFactureView.tsx:201`). Pas de TVA multi-taux, pas d'exonération.
- **Écart de périmètre** : `buildFileEFacture()` lit `REGISTRE_FACTURES` **entier**, sans filtre de périmètre ni de rôle (l.26).

### 1.4 Document imprimable et mentions légales (`DocumentPreview.tsx`)

Le modèle de facture / proforma existe. C'est un composant d'écran qui sert d'aperçu et d'impression navigateur.

**Mentions portées par le code**

| Zone | Contenu | Lignes |
|---|---|---|
| Émetteur | `ENTREPRISE_REGISTRY.nomLegal` (« Atlas Distribution SARL »), « Distribution B2B », villes (Lomé · Kara · Sokodé), pays | 281-283 |
| **Mentions légales** | **NIF 1000 4471 · RCCM TG-LOM-2019-B-1284** : valeurs **en dur dans le composant** (l.284), non issues du registre entreprise | 284 |
| Type de document | « Facture proforma » ou « Facture » | 289 |
| Numéro, date d'émission, échéance (ou « Valable jusqu'au » pour une proforma) | | 291-294 |
| Client | Nom du client et zone uniquement | 301-303 |
| Tableau des lignes | Désignation, Réf., Qté, P.U. HT, Remise (%), Total HT | 307-337 |
| Totaux | Sous-total, Remise globale (si > 0), Total HT, TVA 18 %, Total TTC (`formatFcfaFull`) | 341-365 |
| Conditions de paiement | Libellé issu de `MODE_PAIEMENT_LABEL` | 371-373 |
| Proforma | Texte : « Ce document n'a pas valeur de facture. Il devient commande à votre acceptation, et expire le … » | 374-379 |
| E-facture | « Certification {numéro} · empreinte {12 premiers caractères}… » + bloc QR « Vérification OTR » (si `qr_code_payload`) | 380-394 |

**Absent du modèle** :
- NIF, RCCM, adresse et téléphone du **client** (alors que le rejet simulé de `FAC-2026-8821` est causé par l'absence du NIF client).
- Adresse du siège de l'émetteur, capital social, forme juridique détaillée, régime fiscal, coordonnées bancaires / RIB, numéro de compte Mobile Money.
- Mention de pénalités de retard, d'escompte, d'indemnité de recouvrement.
- Numéro de commande ou de BL.
- Signature et cachet.

**Actions**
- « Envoyer au client » : n'apparaît que si la prop `onEnvoyer` est passée. Seul le builder de proforma la passe (SIMULÉ, §1.2).
- « Imprimer / PDF » : `window.print()` (§1.2). Pas de génération PDF serveur, pas de feuille de style d'impression dédiée.

### 1.5 Encaissements : ce qui existe réellement

Aucun module « Encaissements » n'existe. L'info est éparpillée :

| Besoin | Où c'est dans le code | État |
|---|---|---|
| **Paiements reçus** (par facture) | Seul `Facture.paye` et `dernier_paiement` (`types/index.ts:134, 136`). Pas de liste de paiements. | donnée statique |
| **Liens de paiement mobile** | **N'EXISTE PAS.** Aucun écran, type ni action « lien de paiement ». Seules mentions : textes de messages de relance « Vous pouvez régler par Mobile Money ou virement » (`lib/automation/recouvrement-automations.ts:106`) et libellé « Référence Mobile Money / note… » dans le formulaire de paiement (`RelancesView.tsx:637`). | ABSENT |
| **Rapprochement facture ↔ paiement** | 1) `ComptabiliteComptableView` : « Lettrage du compte client 411 » (voir §4.2). 2) Règle d'automation `rec-rapprochement` (`recouvrement-automations.ts:345-377`) : texte et statistiques simulés, « Paiement reçu → lettrage et arrêt des relances ». | SIMULÉ (lettrage) ; règle = vitrine |
| **Remises d'espèces terrain** | Deux endroits. (a) Saisie : `components/terrain/ClotureVisiteModal.tsx:42-43, 76-81` : à la clôture d'une visite, résultat `ENCAISSEMENT` ou `COMMANDE`, champ « Encaissé sur place (Mobile Money / espèces) » → `Visite.montant_encaisse` (`types/index.ts:466`) via `lib/terrain-workflow.ts`. (b) Contrôle : `ComptabiliteComptableView.tsx:272-326`, bloc « Remises de caisse — tournées terrain » (registre `REMISES_CAISSE`, `comptable-registry.ts:68-101`). **Aucun lien entre (a) et (b)** : `REMISES_CAISSE` est un tableau statique ; l'encaissé saisi par le commercial ne l'alimente pas. | saisie : SIMULÉ ; contrôle : donnée statique, lecture seule |
| Encaissement depuis un dossier de relance | Formulaire « Enregistrer paiement » : montant + référence (voir §2). | SIMULÉ ; ne modifie ni `Facture.paye` ni le lettrage (le toast dit « lettrage 411 à venir », `RecouvrementWorkflowContext.tsx:34`) |

**Objets** (`comptable-registry.ts`)
- `EncaissementALettrer` (l.13-28) :
  - `id, date`
  - `mode: 'MOBILE_MONEY'|'ESPECES'|'VIREMENT'|'CHEQUE'`
  - `montant`
  - `reference_brute` (ex. `TMONEY 22890***441 — "PAIEMENT"`, `FLOOZ 90***227 — "KOMLAN"`)
  - `facture_proposee?, client_propose?`
  - `confiance` (0-100)
  - `difficulte?`
  - `anciennete_j`
- `RemiseCaisse` (l.68-79) :
  - `id, commercial, zone`
  - `encaisse_theorique, remis, ecart`
  - `date_tournee, jours_sans_remise`
  - `statut: 'CONFORME'|'ECART'|'NON_REMIS'`

  Opérateurs cités dans le registre : **TMONEY et FLOOZ** (Togo).

---

## 2. Route `/relances` (`RelancesView.tsx`, 688 lignes)

**Ce que l'écran montre** (rôles : DG, DC, RESP_VENTES, SUPERVISEUR, COMMERCIAL, DAF, RECOUVREMENT)
- Titre « Pipeline relances & recouvrement ».
- 8 KPI (l.205-212) :
  - En cours
  - Montant en jeu
  - Résolues
  - Contentieux
  - Recouvré mois
  - Taux réponse
  - Auto / jour
  - Visites plan.
- Bandeau des **6 règles d'automatisation** (l.223-230).
- Onglets : « Recouvrement impayés », « Réapprovisionnement », « Prospection », « Tous les flux ».
- Recherche client et filtre de zone.
- Pour les impayés : **carte des débiteurs géolocalisés** (taille ∝ montant, couleur ∝ priorité) + **tournée de recouvrement** (jusqu'à 9 plus gros débiteurs, itinéraire optimisé, bouton « Lancer la tournée » → lien de navigation externe, `RelancesView.tsx:175-178`).
- **Kanban à 8 colonnes** (`PIPELINE_ETAPES`, `relances-registry.ts:221-230`).
- Âge de la créance (4 tranches).
- Répartition par zone.
- Analyses IA.
- Fiche dossier (`DetailRelance`, l.483-688).

**Objets** (`types/index.ts:374-415` et `lib/recouvrement-workflow.ts`)
- `RelanceStatut` : `'DETECTION' | 'PLANIFIEE' | 'ENVOYEE' | 'REPONDUE' | 'VISITE' | 'ACCORD' | 'PAYEE' | 'ECHEC'`. Libellés colonnes : Détection IA, Planifiée, Envoyée, Réponse client, Visite terrain, Accord paiement, Résolue, **Contentieux** (= `ECHEC`).
- `RelancePriorite` : `'CRITIQUE' | 'HAUTE' | 'NORMALE' | 'BASSE'`.
- `Relance` (dossier, l.393-415) :
  - Identité : `id, pdv_nom, pdv_id?, zone?, commercial?`.
  - Type : `type: 'IMPAYE'|'REAPPRO'|'PROSPECTION'`.
  - Canal : `canal: 'WHATSAPP'|'SMS'|'VISITE'|'APPEL'|'EMAIL'`.
  - Créance : `montant?, facture_ref?, jours_retard?`.
  - Pipeline : `statut`, `date`, `priorite?`.
  - Automatisation et IA : `score_succes` (0-100), `automate?`, `message_template?`, `synthese_ia?`.
  - Suite à donner : `prochaine_action?, prochaine_action_date?`.
  - Historique : `historique?: HistoriqueRelance[]` (`{date, action, auteur, canal?}`), `nb_tentatives?`.
  - **Un dossier est rattaché à un PDV et à UNE facture de référence** (`facture_ref`), pas à un ensemble de factures.
- `CanalRelance` : `'WHATSAPP'|'SMS'|'APPEL'|'EMAIL'|'VISITE'`.
- `EvenementRecouvrementType` : `'RELANCE'|'PAIEMENT'|'PROMESSE'|'ESCALADE'|'BLOCAGE_CREDIT'|'DEBLOCAGE_CREDIT'|'CLOTURE'`. Libellés (`EVENEMENT_LABEL`) : « Relance envoyée », « Paiement encaissé », « Promesse de paiement », « Escaladé en contentieux », « Crédit bloqué », « Crédit débloqué », « Dossier clôturé ».
- `EvenementRecouvrement` : `id, dossierId, type, date, auteur, canal?, montant?, echeance?, note?`.
- `DossierRecouvrementState` : `{events, creditBloque, cloture}`. L'état est **rejoué depuis le journal** (`etatDossier`, `recouvrement-workflow.ts:69-85`) : `BLOCAGE_CREDIT` met `creditBloque` à vrai, `DEBLOCAGE_CREDIT` à faux, `CLOTURE` à vrai.
- `PromessePaiement` (`lib/automation/recouvrement-automations.ts:30-44`) :
  - Identité : `id, client_id, client_nom`.
  - Engagement : `montant, date_promise, jours_restants`.
  - Statut : `statut: 'EN_ATTENTE'|'TENUE'|'ROMPUE'|'ECHUE_AUJOURDHUI'`.
  - Origine : `canal_obtention`.
  - Fiabilité : `fiabilite_pct, historique_promesses, promesses_rompues`.
  - Note : `note`.
  - 5 promesses codées en dur (l.52-88), affichées dans le tableau de bord RECOUVREMENT (`DashboardRecouvrement.tsx:185`), **pas** dans `/relances`.
- `DossierRecouvrement` (`lib/recouvrement-builder.ts:39-47`) : étend `CreanceComptable` (`client_id, client_nom, compte_aux, montant, paye, reste, jours_retard, commercial, provision_pct, factures[]`) avec `probabilite_recouvrement, valeur_esperee, score_pdv, credit_bloque, action_recommandee`. C'est un second « dossier », distinct du `Relance` ci-dessus.
- `TrancheAgee` : `tranche, min_jours, max_jours, montant, clients, color`.

**Actions de la fiche dossier** (`DetailRelance`, `RelancesView.tsx`)

| Libellé | Effet attendu | État | Ligne |
|---|---|---|---|
| « Envoyer relance » + choix du canal (WhatsApp / SMS / Appel / Email / Visite) + note facultative, puis « Envoyer la relance {canal} » | Envoie un message | **SIMULÉ** : journalise `RELANCE` (`canal`, `note`). **Rien n'est envoyé.** | 600, 617-628, 500-503 |
| « Enregistrer paiement » (montant + « Référence Mobile Money / note… ») | Encaisse | **SIMULÉ** : journalise `PAIEMENT` (`montant`, `note`). Ne diminue ni `reste_creance`, ni le statut du kanban, ni la facture. Le montant n'est pas validé contre le reste dû. | 603-605, 631-639, 504-508 |
| « Promesse » (date de règlement promise, montant facultatif, note) | Enregistre une promesse | **SIMULÉ** : journalise `PROMESSE` (`echeance` obligatoire). Pas de rappel à J-1, pas de bascule automatique à « rompue ». | 606-608, 642-649, 509-515 |
| « Escalader » | Passe en contentieux | **SIMULÉ** : journalise `ESCALADE` (libellé « Escaladé en contentieux »), sans bouger la carte. **Un seul cran, pas d'échelle** (pas de choix de palier). | 609-611, 516-518 |
| « Bloquer crédit » / « Débloquer crédit » | Coupe ou rétablit le crédit | **SIMULÉ** : journalise `BLOCAGE_CREDIT` / `DEBLOCAGE_CREDIT`, badge « Crédit bloqué ». **Aucune conséquence sur les commandes ou les livraisons.** | 612-614, 519-521 |
| « Annuler la dernière action » | Supprime le dernier événement du dossier | local | 675-677 |
| « Lancer la tournée » | Ouvre l'itinéraire de navigation | BRANCHÉ à un lien externe (`lienNavigationMulti`) | 175-178, 301-307 |
| « Fermer le panneau » | | local | 681-683 |

Toutes les actions sauf les deux dernières passent par `useRecouvrementWorkflow.ajouterEvenement` (`contexts/RecouvrementWorkflowContext.tsx`), qui écrit dans `localStorage` (clé `prospera-recouvrement-events`) et affiche un toast. Chaque événement a pour auteur le nom de l'utilisateur connecté.

Le formulaire « Enregistrer paiement » comporte un champ « Référence Mobile Money » : c'est la seule trace de l'encaissement mobile côté recouvrement.

**Dead-end** : `DashboardRecouvrement.tsx:127-137` : « Envoyer maintenant », « Enregistrer une promesse », « Modifier », « Reporter » n'ont **aucun `onClick`** → MORT. Les mêmes actions sont fonctionnelles (SIMULÉES) dans `/relances`.

**Composant orphelin** : `components/relances/BalanceAgeeClientPanel.tsx` (balance âgée client + priorisation par valeur espérée + blocage/déblocage avec journal local `TraceBlocage`) n'est **importé nulle part**. C'est la seule implémentation de la balance âgée « par créance comptable » ; `RelancesView` n'affiche que sa propre version simplifiée (tranches ci-dessous). Le PRD doit donc décider laquelle devient la référence.

### 2.1 Règles codées : balance âgée, escalade, blocage, probabilité

**A. Balance âgée : DEUX versions incompatibles**
- **Version « relances »** (`getRelancesAgingBuckets`, `lib/relances-dg-builder.ts` l.173-184) : 4 tranches, uniquement sur les dossiers `IMPAYE` non `PAYEE` :
  - **J+0–15**, **J+16–30**, **J+31–60**, **J+60+**
  - Pour chacune : nombre de dossiers et volume.
  - Affichée dans `RelancesView.tsx` (onglet « impayés »).
- **Version « comptable »** (`buildBalanceAgeeClient`, `lib/recouvrement-builder.ts:18-37`) : 5 tranches sur `CREANCES_COMPTABLES` (`reste > 0`) :
  - **Non échu** (−999 à 0), **1–30 j**, **31–60 j**, **61–90 j**, **> 90 j**.
  - Les tranches vides sont masquées.
  - Utilisée seulement par le composant orphelin.
- Le PRD doit trancher : 5 tranches « SYSCOHADA » (les créances non échues y sont visibles) ou 4. Le front n'a **pas de balance âgée fournisseur** malgré la spec V2 (§7.10 : « client ET fournisseur »), mais une dette échue/échéancier existe dans le pilotage DAF (§5).

**B. Échelle d'escalade : DEUX échelles incompatibles**
- **Échelle affichée dans `/relances`** (`REGLES_AUTOMATION_RELANCES`, `lib/registries/relances-registry.ts:212-219`) :

  | Déclencheur | Action | Canal | Délai |
  |---|---|---|---|
  | Facture impayée J+3 | WhatsApp automatique | WHATSAPP | 3 j après échéance |
  | Pas de réponse J+7 | SMS rappel | SMS | 7 j |
  | Impayé J+14 | Visite commercial assigné | VISITE | 14 j |
  | **Impayé J+30** | **Alerte DG + blocage crédit** | EMAIL | 30 j |
  | Stock PDV < 5 j couverture | WhatsApp réappro | WHATSAPP | temps réel |
  | Prospect sans commande J+21 | Relance catalogue | WHATSAPP | 21 j |

  C'est le sens « WhatsApp → SMS → visite → direction ».
- **Échelle des automatisations** (`buildReglesRecouvrement`, `lib/automation/recouvrement-automations.ts:379-435`, écran `/automatisations`) :

  | Règle | Retard | Canal / mode | Garde-fous |
  |---|---|---|---|
  | `rec-preventif` (l.137-175) | J−3 avant échéance (échéance entre 0 et 5 j, 12 cibles max) | WhatsApp, AUTO | un seul rappel par facture, jamais si déjà payé |
  | `rec-j1` | 1–7 j | WhatsApp avec relevé de compte joint, AUTO | ton neutre, aucune menace |
  | `rec-j7` | 8–15 j | **SMS + appel programmé**, AUTO | 2 appels max/jour, promesse enregistrée avec montant et date |
  | `rec-j15` | 16–30 j | **Visite terrain** insérée dans la tournée, **VALIDATION** | le commercial ne négocie jamais d'abandon de créance (décision DAF) |
  | `rec-j30` | 31–**60** j | **Mise en demeure + alerte DG**, **VALIDATION** | jamais envoyée sans validation humaine (acte juridique) |
  | `rec-blocage` (l.248-279) | **> 60 j** OU encours > plafond | blocage automatique | journalisé, **déblocage jamais automatique** (acompte ou échéancier signé) |
  | `rec-promesses` (l.212-247) | promesse non tenue | escalade d'un cran | délai de grâce de 24 h sur la 1re promesse ; au-delà de 2 promesses rompues, accord écrit obligatoire |
  | `rec-prevention` (l.280-343) | client en dégradation (partenaire, créance 1–30 j, score < 72) | **SUGGESTION** : réduire le plafond | aucune réduction automatique |
  | `rec-rapprochement` (l.345-377) | paiement détecté | lettrage et arrêt des relances | paiement partiel : suspension, non arrêt |

- **Conflit à lever dans le PRD** : l'échelle de `/relances` bloque le crédit à **J+30**, celle de `/automatisations` et de `recouvrement-builder.ts` à **> 60 j** (`SEUIL_BLOCAGE_JOURS = 60`, l.85). Les paliers visite sont J+14 contre 16–30. Une seule échelle paramétrable par organisation est à spécifier.
- **Ton des messages** (`messageRelance`, `recouvrement-automations.ts:101-121`) :
  - Gradation : avant échéance, ≤ 7 j, ≤ 15 j, ≤ 30 j, ≤ 60 j (« MISE EN DEMEURE »), > 60 j.
  - Textes en français avec marque, nom du client, montant et références de facture.
  - Mention « Mobile Money ou virement ».

**C. Blocage du crédit**
- Seuil : `SEUIL_BLOCAGE_JOURS = 60` (`recouvrement-builder.ts:85`) ; `credit_bloque = jours_retard > 60` (l.94).
- Déclencheur énoncé dans la règle : « un client dépasse 60 jours de retard, **ou son encours dépasse son plafond** » (`recouvrement-automations.ts:264`). Le test du plafond n'est **pas codé** dans `buildDossiersRecouvrement` (seul le retard est testé).
- Surcharge manuelle (composant orphelin `BalanceAgeeClientPanel.tsx:29-45`) : « la décision humaine prime, mais elle est tracée » ; motif auto-généré « Crédit coupé — créance au-delà de 60 j ou risque avéré » / « Crédit rétabli — accord d'échéancier signé avec le client ».
- Dans `/relances`, un dossier `priorite = CRITIQUE` affiche : « validation DG requise avant nouvelle livraison crédit » (l.567-570), sans mécanisme de validation.

**D. Probabilité de recouvrement** (`probabiliteRecouvrement`, `recouvrement-builder.ts:53-66`)
- Base selon le retard : 95 (≤ 0 j), 82 (1–30 j), 65 (31–60 j), 45 (61–90 j), **30** (> 90 j).
- Ajustements : `− provision_pct × 0,4`, `+ (score_pdv − 60) × 0,25`, `+ 10` si un paiement partiel a déjà eu lieu.
- Résultat borné entre **5 et 98**.
- `valeur_espérée = round(reste × proba/100)` ; **priorisation par valeur espérée décroissante** (l.104-106).
- **Perte attendue** = encours − valeur espérée. **Contentieux** = dossiers avec proba < 40 (`buildSyntheseRecouvrement`, l.117-126).
- **Action recommandée** (`actionRecommandee`, l.68-82) :
  - proba < 40 : contentieux ou échéancier avec abandon partiel, et blocage immédiat si non bloqué.
  - retard > 60 j : visite physique.
  - retard > 30 j : appel direct puis échéancier.
  - paiement partiel déjà obtenu : relancer sur le solde.
  - sinon : WhatsApp automatique.

**E. Prévision d'encaissement** (`lib/recouvrement-cockpit-builder.ts`, tableau de bord RECOUVREMENT)
- Buckets : `quasi_certain` (proba ≥ 80), `probable` (55–79), `incertain` (35–54), `perdu` (< 35). **Attendu à 30 j** = Σ valeur espérée.
- **Capacité du jour** : `CAPACITE_JOUR = 12` dossiers (l.24). La file du jour est bornée à 12 (hors canal `SYSTEME`).
- **DSO** : moyenne des jours de retard pondérée par le reste, par zone et par commercial (l.119, 150). Ce n'est pas un vrai DSO (retard moyen pondéré).
- Objectif d'encaissement du mois : **40 000 000** codé en dur (l.179).

**F. Pipeline** (`lib/relances-dg-builder.ts`)
- `en_cours` = tout sauf `PAYEE` et `ECHEC`.
- `contentieux` = `ECHEC`.
- `recouvré mois` = Σ montant des `PAYEE`.
- `taux de réponse` = `{REPONDUE, ACCORD, VISITE, PAYEE} / {ENVOYEE, REPONDUE, VISITE, ACCORD, PAYEE, ECHEC}`.
- `taux de conversion` = `PAYEE / toutes`.
- `relances auto/jour` = dossiers `automate` en `PLANIFIEE|ENVOYEE|DETECTION`.
- Analyses IA : textes nominatifs à la main (Kiosque Port, Grossiste Adidogomé, Mama T.).
- **Les transitions de colonne du kanban ne sont pas pilotées par les actions** : le journal d'événements et le statut du dossier sont indépendants.

---

## 3. Route `/pilotage-financier` (`PilotageFinancierShell.tsx`)

Aiguillage par rôle (l.14-18) : **DAF** → `PilotageDAFView` ; **DG et DC** → `ComptabiliteDGView`.

### 3.1 Vue DG (`ComptabiliteDGView.tsx`)

- 6 KPI (l.71-76) :
  - Trésorerie disponible
  - Créances à risque
  - Dette fournisseurs
  - Marge brute
  - Résultat net
  - Encours clients
- Bloc **« Décisions à trancher »** (5 décisions issues de `DECISIONS_COMPTA_DG`, `comptabilite-registry.ts:282-288`) avec boutons **Valider** / **Reporter** (l.145-158).
- « Trésorerie — 7 prochains jours » (l.180).
- « Clients à surveiller ».
- « Dette fournisseurs — échéancier & impact trésorerie ».
- « Rentabilité du mois — vue synthétique ».

**Actions Valider / Reporter** : **SIMULÉ**. `decider('DECISION_DG', refId, 'VALIDE'|'REPORTE', …)` écrit dans le journal `prospera.decisions.journal.v1`. Une même décision re-cliquée s'efface, une autre la remplace (`lib/decisions-workflow.ts:7-11`). Aucune écriture comptable n'est passée, aucune notification n'est envoyée au DAF. Le texte de la décision « Valider provision Kiosque Port 1,42 M » désigne l'écriture `PROV-411` (§4.1) qui reste `ATTENTE_VALIDATION`.

Le DG consulte aussi la même donnée statique que le DAF (soldes, échéances).

### 3.2 Vue DAF (`PilotageDAFView.tsx`, 630 lignes)

**Blocs et objets** (`lib/registries/daf-registry.ts`, `lib/daf-pilotage-builder.ts`)

1. **Arbitrages du jour** : `buildArbitragesDaf()` (`daf-pilotage-builder.ts:237-281`) : 5 arbitrages écrits à la main avec valeurs injectées (run de paiement, TVA + CNSS à 4 j, marge du pire canal, ristournes, BFR).
2. **Run de paiement** : liste de `LignePaiement` (daf-registry l.37-54) :
   - `fournisseur_id, fournisseur, montant_du, jours_retard, echeance`
   - `consequence_non_paiement, couverture_stock_j`
   - `escompte_pct, penalite_retard_pct`
   - `reco: 'PAYER'|'PARTIEL'|'REPORTER'`, `reco_motif`
3. **BFR**, 4. **Marge nette par canal**, 5. **Encadrement du crédit client** (`DemandeCredit`), 6. **Ristournes fournisseurs** (`Ristourne`), 7. **Échéances fiscales et sociales** (`EcheanceFiscale`), 8. **Lignes bancaires** (`LigneBancaire`).

**Actions**

| Libellé | Effet attendu | État | Fichier:ligne |
|---|---|---|---|
| « Payer » / « Partiel » / « Reporter » (par ligne fournisseur) | Arbitre le paiement et recalcule la trésorerie projetée | **SIMULÉ** (journal `ARBITRAGE_PAIEMENT`) ; le **recalcul est réel** (simulation locale) | `PilotageDAFView.tsx:28-32, 228-231` |
| **« Geler le run et générer les ordres de virement »** | Génère les ordres de virement | **MORT** : aucun `onClick` ; désactivé si la trésorerie projetée passe sous le plancher | `PilotageDAFView.tsx:316-319` |
| « Revenir aux recommandations » | Efface tous les arbitrages | local | l.320-323 |
| « Accorder » / « Sous condition » / « Refuser » (par demande de crédit) | Décide du crédit | **SIMULÉ** (journal `CREDIT_CLIENT`) : ne modifie aucun `plafond_credit` et ne débloque aucune commande | l.475-488 |

Les **ordres de virement n'existent pas comme objet** (aucun type `OrdreVirement`). Le PRD doit les créer.

**Règles de calcul** (`daf-pilotage-builder.ts`)
- **Trésorerie actuelle** = Σ soldes de `COMPTES_TRESORERIE` (3 comptes : Ecobank 98,2 M ; Caisse Lomé Port 22,4 M ; Caisse Kara 7,8 M = 128,4 M) (l.16).
- **Trésorerie projetée après le run** (`simulerRunPaiement`, l.88-126) : `solde_projete = TRESORERIE_ACTUELLE + ENCAISSEMENTS_CERTAINS_7J − décaissé`.
  - `ENCAISSEMENTS_CERTAINS_7J = 32 400 000` : **constante en dur**, non calculée depuis les créances.
  - `PLANCHER_TRESORERIE = 40 000 000` : constante en dur.
  - `marge_plancher = solde_projete − plancher`.
  - `sous_plancher` bloque le bouton d'ordres de virement.
- **Montant arbitré** (`montantArbitre`, l.80-86) : `PAYER = montant_dû` ; `PARTIEL = round(montant_dû × 0,6)` (60 % fixe) ; `REPORTER = 0`.
- **Escompte capté** : si `PAYER`, `escompte_pct > 0` et `jours_retard ≤ 0` → `round(montant × escompte_pct/100)` (l.103-105).
- **Pénalités encourues** : si le choix n'est pas `PAYER` et `penalite_retard_pct > 0` → `round((dû − payé) × pénalité/100)` (l.106-108). Le commentaire du type dit « par mois entamé », le calcul ne l'applique pas.
- **Ruptures risquées** : lignes `REPORTER` avec `couverture_stock_j < 10` (l.109-111).
- **BFR** (`buildSyntheseBfr`, l.38-57) :
  - `BFR = stock + créances clients − dettes fournisseurs`.
  - `DIO = round(stock / (achats_mois/30))`.
  - `DPO = round(dettes / (achats_mois/30))`.
  - `marge de manœuvre = DPO − DIO` (positif : le fournisseur finance le stock).
  - `BFR en jours = round(BFR / achats_jour)`.
  - `variation = BFR − BFR_mois_précédent`.
  - Registre (`BFR_REGISTRY`) : stock 86,5 M ; créances 18,35 M ; achats 68,4 M ; CA 89,2 M ; BFR M−1 14,2 M.
  - **Le DPO est calculé sur les achats du mois mais rapporté au solde total de dette**, sans lien avec les délais réels de paiement.
- **Marge nette par canal** (`buildMargesCanal`, l.145-158) : `marge_nette = marge_brute − remises − commissions − transport − coût_du_crédit_client − pertes_sur_créances`. `marge_nette_pct = marge_nette / ca_mois`. Canal « destructeur » si `marge_nette / ca < 2 %`. Les 4 canaux sont : Boutiques de proximité, Dépôts & superettes, Grossistes (marge nette = −0,4 % en pratique), Enseigne B2B (Atlas Shop). **Les coûts sont des données saisies, non calculées depuis les factures**.
- **Décision de crédit** (`buildDemandesCredit`, l.172-184) :
  - `exposition_après` = montant demandé (relèvement de plafond) ou `encours + montant demandé` (déblocage ponctuel).
  - `dépassement = max(0, encours − plafond_actuel)`.
  - `rendement_crédit = marge_12m / exposition_après × 100`, affiché en rouge si < 100 %.
  - Retards 12 mois en rouge si > 5 ; délai moyen en rouge si > 45 j.
  - Types `DemandeCredit` : `demande: 'DEBLOCAGE_COMMANDE'|'RELEVEMENT_PLAFOND'`, `risque: 'FAIBLE'|'MOYEN'|'ELEVE'`, plus `retards_12m, delai_paiement_moyen_j, ca_12m, marge_12m, anciennete_mois`.
- **Ristournes** (`buildRistournes`) : `en_peril` = Σ acquis `A_RECLAMER` dont `jours_restants ≤ 30`. Statuts : `'A_RECLAMER'|'RECLAMEE'|'ENCAISSEE'|'SEUIL_NON_ATTEINT'`. Aucun bouton « Réclamer ».
- **Échéances fiscales** : statuts `'A_PREPARER'|'PRETE'|'DECLAREE'|'PAYEE'` ; `non_pretes` = `A_PREPARER` à ≤ 7 j. Pénalités citées : TVA « 10 % du montant + 1 %/mois » ; CNSS « 10 % de majoration » ; IS « 5 % + intérêts de retard ». Ces taux sont du texte libre.
- **Lignes bancaires** : `autorisé − utilisé = disponible` ; covenants rompus listés (« trésorerie nette ≥ 40 M à la clôture de chaque trimestre »).
- **Trésorerie 7 jours** : `PREVISIONS_TRESORERIE` (`comptabilite-registry.ts:236-244`) : 7 lignes `{date, entrees, sorties, solde_fin, commentaire?, alerte?}` **statiques** (11→17 juin ; pic de sortie du 16 : 28,6 M). Le solde du 11/06 (128,4 M) correspond à la somme des comptes, mais les jours suivants ne sont **pas recalculés** depuis les échéances clients et fournisseurs.
- **Alerte J+30 liée aux créances** : docs mentionnent un « impact trésorerie à J+30 si aucune créance ne rentre » ; non vérifié dans le code lu.

---

## 4. Route `/comptabilite` (`ComptabiliteShell.tsx`)

Aiguillage (l.14-18) : **COMPTABLE** → `ComptabiliteComptableView` (poste de travail) ; **autres rôles** (DG, DAF, RECOUVREMENT) → `ComptabiliteView` (analytique, lecture seule).

### 4.1 Vue analytique DAF/DG (`ComptabiliteView.tsx`, 751 lignes)

- 8 KPI cliquables (l.94-144) : trésorerie consolidée, encours clients (411), créances > 30 j, écritures du jour, marge brute, résultat net, % de rapprochement, suspens critiques.
- 6 onglets (l.22-29) : Trésorerie & flux, Journal, Balance SYSCOHADA, Créances clients, Compte de résultat, Rapprochements.
- **Aucune action d'écriture** : tout est lecture et détail au clic. L'écriture `PROV-411` (provision Kiosque Port, statut `ATTENTE_VALIDATION`) ne peut pas être validée ici.

**Objets** (`lib/registries/comptabilite-registry.ts`)
- `StatutEcriture` (l.6) : `'VALIDEE' | 'BROUILLON' | 'ATTENTE_VALIDATION'`.
- `StatutRapprochement` (l.7) : `'POINTE' | 'EN_COURS' | 'ECART'`.
- `LigneEcriture` (l.19-24) : `compte, libelle, debit, credit`.
- `EcritureJournal` (l.25-36) : `id, date, journal ('VT','BQ','AC','OD','CA','CH'), piece, libelle, montant, lignes[], statut, source, auteur`. Sources vues : « Facturation auto », « Banque auto », « Achats », « IA DAF », « Caisse Lomé », « Paie ».
- `BalanceLigne` (l.37-47) : `compte (6 chiffres), libelle, classe, debit_mois, credit_mois, solde, sens ('D'|'C'), variation_pct?, alerte?`.
- `CompteTresorerie` (l.8-18) : `id, libelle, type ('BANQUE'|'CAISSE'|'MOBILE'), entrepot?, solde, entrees_jour, sorties_jour, evolution_7j[], alerte?`. Aucun compte `MOBILE` n'est défini dans les données, seulement banque et caisses.
- `CreanceComptable` (voir §2) : l'auxiliaire client (`compte_aux` 411xxx), `provision_pct`, `factures[]`.
- `RapprochementCompta` : `id, compte, banque, periode, solde_comptable, solde_releve, ecart, statut, operations_non_pointees`. 3 rapprochements (Ecobank, Caisse Lomé Port avec écart de 20 000, Caisse Kara).
- `LigneResultat` : `libelle, montant_mois, montant_ytd, section ('PRODUITS'|'ACHATS'|'MARGE'|'CHARGES'|'RESULTAT'), pct_ca?`.
- `SuspensComptable` : `id, libelle, montant, anciennete_j, statut ('CRITIQUE'|'MODERE'), action`.
- Référentiel : `REFERENTIEL_COMPTA` = « SYSCOHADA révisé », plan OHADA, exercice 2026, période « Juin 2026 », FCFA.

**Écritures SYSCOHADA générées depuis les factures** (modèle des écritures `VT` du registre, l.130-165)
- Facture de vente : Débit `411xxx` Client (TTC) / Crédit `701100` Ventes de marchandises (HT) / Crédit `443100` TVA collectée.
- Encaissement : Débit `512100` Banque ou `531100` Caisse / Crédit `411xxx`.
- Achat : Débit `601100` Achats / Débit `445200` TVA déductible / Crédit `401100` Fournisseur.
- Provision : Débit `657100` Pertes sur créances / Crédit `491200` Provision clients douteux.
- Charges de personnel : Débit `661100` / Crédit `421100`.
- **Ces écritures sont des données statiques**. Le front ne génère aucune écriture à partir d'une facture, et l'indicateur « Facturation auto » est une étiquette (`source`).
- **Incohérence TVA dans les données** : `ecr-3` (Mama T.) : TVA 288 000 sur 1 920 000 TTC, soit 15 % du TTC ; `ecr-1` et `ecr-4` : TVA ≈ 15 % du TTC. Seule `ecr-8` respecte 18 % (884 746 = 5 800 000 × 18/118). Le PRD impose `TVA = TTC × 18/118`, c'est-à-dire HT × 18 %.
- **Numérotation des pièces** : `FAC-8840` (comptabilité) ≠ `FAC-2026-8821` (facturation) ≠ `FAC-8841` (lettrage). Trois formats pour un même objet.

**Synthèse** (`comptabilite-dg-builder.ts`)
- Trésorerie = Σ soldes. Encours clients = Σ `reste` des créances. Créances > 30 j = Σ `reste` avec `jours_retard > 30`. % rapprochement = `POINTE / total`.
- **Marge brute %** = `pct_ca` de la ligne MARGE (= 23 %), **objectif 25 %** (l.111-112 de la vue). **Jours avant clôture : 19, codé en dur** (l.78).
- Les « analyses IA » (`buildAnalysesComptabiliteIA`, l.82-115) sont 5 textes à la main : pic de sortie J+5 de 28,6 M, créances > 30 j, marge, écritures en attente, rapprochement caisse.

### 4.2 Poste comptable (`ComptabiliteComptableView.tsx`, 511 lignes)

**Ce que l'écran montre** (rôle COMPTABLE)
- `PerformancePostePanel role="COMPTABLE"`.
- 6 KPI de charge de travail (l.79-86) : à lettrer, lettrages manuels, écritures à traiter, suspens ouverts, pièces manquantes, avancement clôture.
- Bloc **Déclaration TVA** (l.96-154).
- **Lettrage du compte client 411** (l.157-270).
- **Remises de caisse terrain** (l.273-326).
- **Pièces à réclamer** (l.329-362).
- **Clôture {période}** : checklist cochable (l.383-410).
- `FacturesAchatPanel` (l.425).
- Journal, rapprochements et suspens.

**Objets** (`comptable-registry.ts`)
- `EncaissementALettrer` et `RemiseCaisse` : voir §1.5.
- `DECLARATION_TVA` (l.106-122), objet non typé :
  - `periode` (« Mai 2026 »), `date_limite` (2026-06-15), `jours_restants`.
  - `tva_collectee` (13 240 000), `tva_deductible` (6 400 000), `credit_reporte` (0).
  - `statut: 'A_PREPARER'|'PRETE'|'TELEDECLAREE'`.
  - `bloquants[]` : `{libelle, impact}`.
  - Deux bloquants codés : « 3 factures d'achat non saisies — TVA déductible manquante » (940 000) et « 1 avoir client à émettre (écart de BL Kiosque Port) » (180 000).
- `TacheCloture` : `id, libelle, categorie ('SAISIE'|'RAPPROCHEMENT'|'CUT_OFF'|'PROVISIONS'|'DECLARATIF'), fait, bloque_par?`. 12 tâches ; « Déclaration TVA » et « Déclaration CNSS » en font partie.
- `PieceManquante` : `id, piece, libelle, montant, detenteur, role_detenteur, relances, anciennete_j, bloque`.

**Actions**

| Libellé | Effet attendu | État | Fichier:ligne |
|---|---|---|---|
| **« Télédéclarer sur le portail OTR »** | Dépose la déclaration de TVA | **MORT** : aucun `onClick` ; désactivé tant que `bloquants.length > 0` | `ComptabiliteComptableView.tsx:127-130` |
| « Lettrer » | Affecte l'encaissement à la facture proposée | **SIMULÉ** : journal `LETTRAGE` = `LETTRE`. Désactivé si pas de facture proposée. Ne modifie aucun solde, ni `Facture.paye`, ni `CreanceComptable.reste`. | l.234-248 |
| « Mettre en suspens » | Met l'encaissement de côté | **SIMULÉ** : journal `LETTRAGE` = `A_ENQUETER`. Aucune création de suspens. | l.249-262 |
| Cases de la checklist de clôture | Coche ou rouvre une tâche | **SIMULÉ** : journal `CLOTURE_TACHE` = `FAIT`/`A_FAIRE` | l.386-388 |
| **« Relancer »** (pièces manquantes) | Relance le détenteur de la pièce | **MORT** : aucun `onClick` | l.355-358 |
| « Saisir la facture d'achat » | Valide l'écriture d'achat et la dette fournisseur | **SIMULÉ** : état local `Set`, **non persisté** (perdu au rechargement) | `FacturesAchatPanel.tsx:139-143` |

Le lettrage n'est **pas** branché sur la relance : lettrer ne ferme pas le dossier de recouvrement correspondant.

**Règles de calcul** (`lib/comptable-poste-builder.ts`)
- **Lettrage auto vs manuel** : une proposition est « automatique » si `confiance ≥ 70`, sinon manuelle (l.23, 33-34 ; `ComptabiliteComptableView.tsx:180`). Ancienneté ≥ 5 j : badge rouge (l.195).
- **Règles de lettrage implicites vues dans les données** (`ENCAISSEMENTS_A_LETTRER`) :
  - Un paiement groupé pour 2 factures doit être **ventilé** (cas `let-4`).
  - Un encaissement partiel (1,45 M sur 1,82 M) doit être identifié comme tel (cas `let-2`).
  - Un virement Mobile Money au nom du commercial, non du client, signale un encaissement terrain non déclaré (cas `let-3`).
  - Une remise d'espèces sans bordereau est à réclamer (cas `let-5`).
- **TVA à payer** (`buildSyntheseTva`, l.60-69) : `tva_collectee − tva_deductible − credit_reporte` (13,24 M − 6,4 M = 6,84 M). Cela correspond à `ECHEANCES_FISCALES fis-1` : 6 840 000 (le pilotage DAF affiche donc la même valeur).
- **Surcoût si non saisi** = Σ impacts des bloquants. **Urgence** : `jours_restants ≤ 7` et statut ≠ `TELEDECLAREE`.
- **Remises de caisse** : écart total = Σ `ecart` des lignes non conformes ; « non remis » signale par ex. 1,24 M à Kara depuis 5 j (« À escalader au superviseur aujourd'hui »).
- **Clôture** : `cloture_pct = faites / total`, recalculé sur la base du journal local (l.64-65 de la vue). Les tâches bloquées par un tiers sont isolées (`bloquees`).
- **Facture d'achat** (`FacturesAchatPanel.tsx`) :
  - Candidates : commandes fournisseur de statut `RECUE`, `RECUE_PARTIELLE` ou `LITIGE`.
  - Écriture générée : HT = `round(TTC / 1,18)` ; débit `601100` HT ; débit `445200` TVA = TTC − HT ; crédit `401100` TTC (l.16-23).
  - Avertissement en cas d'écart BL : ne saisir que les quantités reçues et passer l'écart en avoir fournisseur (l.89-96).
  - Statut de paiement : `NON_DUE | A_PAYER | PARTIEL | PAYEE | ECHUE` (`types/index.ts:318`).
  - `echeance_paiement = date de réception + delai_paiement_j` du fournisseur.

---

## 5. Route `/controle-gestion` (`ControleGestionView.tsx`, 548 lignes)

**Ce que l'écran montre** (rôle CONTROLE_GESTION uniquement)
6 onglets (l.28-35) :
- Cockpit
- Budgets
- Écarts
- P&L analytique
- Forecast
- Rapports

**Objets** (`lib/registries/cdg-registry.ts`)
- `AxeCdg` : `'ZONE'|'CANAL'|'FAMILLE'`.
- `PosteBudget` : `'CA'|'MARGE'|'CHARGES'|'STOCK'`.
- `SeveriteEcart` : `'CRITIQUE'|'HAUTE'|'MODEREE'|'FAIBLE'`.
- `ConfianceIa` : `'AUTO'|'A_VALIDER'|'SUGGESTION'`.
- `ScenarioForecast` : `'BASE'|'HAUT'|'BAS'`.
- `DestinataireRapport` : `'DG'|'DAF'`.
- `BudgetLigne` : `id, axe, centre, poste, budget, reel, forecast, version`.
- `EcartCdg` : `id, severite, axe, centre, poste, budget, reel, atterrissage, ecart_pct, ecart_fcfa, cause_ia, action_suggeree, confiance`.
- `PnLSegment` : `id, axe, centre, produits, charges, marge_brute, marge_brute_pct, resultat, resultat_pct`.
- `ForecastMois` : `id, mois, scenario, ca, marge, charges, tresorerie, budget_ca`.
- `DecisionCdg` : `id, priorite, titre, detail, impact, action, confiance, ecart_id?`.
- `RapportCdgModele` : `id, titre, resume, ecarts_ids[], destinataires_defaut[]`.
- `RapportCdgEnvoye` (`lib/cdg-rapports-workflow.ts:8-19`) : `id, modele_id?, titre, resume, ecarts_ids, destinataires, statut ('BROUILLON'|'ENVOYE'|'LU'), envoye_at, envoye_par, lus_par`.
- Constantes : `PERIODE_CDG = 'Juin 2026'`, `VERSION_BUDGET = 'BUD-2026-06-V1'`, **`MARGE_CIBLE_PCT = 16,5`**, **`BANDE_ECART_PCT = 3`**.
- **Les budgets sont rattachés à un centre = zone, canal ou famille** (une `BudgetLigne` par couple axe × centre × poste). 19 lignes de budget pour juin 2026 : 8 sur l'axe zone (CA + marge), 6 sur canaux, 4 familles, plus charges et stock « Réseau ».

**Actions**

| Libellé | Effet attendu | État | Fichier:ligne |
|---|---|---|---|
| Onglets, filtres d'axe (Zone/Canal/Famille/Tous), scénario (BASE/HAUT/BAS) | Filtre | local | l.221, 281, 337, 418 |
| Cartes de décision (clic) | Bascule vers l'onglet Écarts ou Rapports | local | l.201-203 |
| Choix du modèle de rapport (3 modèles) et des destinataires (DG / DAF) | Prépare le rapport | local ; au moins un destinataire reste coché (`toggleDest`, l.84-92) | l.455-472 |
| **« Envoyer le rapport »** | Transmet au DG et au DAF | **SIMULÉ** : écrit un `RapportCdgEnvoye` dans `prospera.cdg.rapports.v1` (`lib/cdg-rapports-workflow.ts:197-221`) ; DG et DAF le voient dans `RapportsCdgInbox` (tableau de bord) et peuvent le « marquer lu » (`marquerRapportLu`). **Pas de PDF, pas de courriel, pas de notification.** | l.93-106, 479-486 |
| « Export fichier » | Exporte CSV / PDF | CSV BRANCHÉ côté client (Blob) ; PDF = `window.print()` ; contenu : 1 ligne `Titre, Résumé, Destinataires` | l.493-498, `lib/export-utils.ts` |

**Aucune action de saisie ou d'édition de budget**, ni de création de version, ni de « Figer le budget juillet » (la décision `dec-cdg-4` n'est qu'une carte, `cdg-registry.ts:216-222`). Les budgets, écarts, P&L et prévisions sont des **tableaux statiques**.

**Règles de calcul** (`lib/cdg-builder.ts`)
- **Écart %** (`ecartPct`, l.42-45) : `(réel − budget) / |budget| × 100`, arrondi à 0,1. Si budget = 0 : 0 si réel = 0, sinon **100**.
- **Sous contrôle** : `|écart %| ≤ BANDE_ECART_PCT` (3 %).
- **KPI hub** (`buildHubCdgKpis`, l.51-81) :
  - CA budget et CA réel : Σ des lignes `axe = ZONE`, `poste = CA` hors centre « Réseau ». Marge : lignes `ZONE`, `MARGE` (3 zones seulement).
  - Lignes sous contrôle % = lignes dans la bande / toutes.
  - **Précision du forecast** = `1 − |CA forecast BASE − budget_CA| / budget_CA`, pour le mois courant. Valeur de repli : 91.
- **Les écarts (`ECARTS_CDG`) ne sont PAS calculés depuis `BUDGET_LIGNES`** : ce sont des lignes distinctes saisies (`ecart_pct`, `ecart_fcfa` en dur). Exemple : `ec-1` Grossistes marge, budget 2,88 M, réel −170 K, écart −3,05 M (−105,9 %). Risque d'incohérence entre les deux tables.
- **Compte de résultat par axe** : `PNL_SEGMENTS` statique : produits, charges, marge brute % et résultat par zone, canal et famille. Le compte de résultat entreprise (`COMPTE_RESULTAT`, SYSCOHADA) est repris tel quel en bas de l'onglet P&L (l.398).
- **Marge nette par canal** (`buildMargesCanalEnrichies`, l.108-121) : même formule que le DAF (`marge_brute − remises − commissions − transport − coût crédit − pertes`), mais calculée une seconde fois dans ce module. Les données viennent de `MARGES_CANAL` du registre DAF. Le CdG utilise `buildMargesCanalEnrichies`, le DAF `buildMargesCanal` : duplication à factoriser.
- **Prévision glissante 3 mois** : `FORECAST_ROLLING` = Juin, Juillet, Août 2026 × 3 scénarios (BASE / HAUT / BAS) = 9 lignes **statiques** (`cdg-registry.ts:183-193`), avec CA, marge, charges, trésorerie indicative et CA budgété. L'écran affiche « Rolling 3 mois — scénario {x} » et l'écart vs budget par mois. **Pas de modèle de prévision.**
- **Rapports au DG et au DAF** : 3 modèles écrits (`MODELES_RAPPORTS`, l.232-254) : « Pack comité direction — Juin 2026 » (DG + DAF, écarts ec-1 à ec-4), « Alerte marge canal Grossistes » (DAF), « Flash zone Lomé Sud » (DG).
- **Synthèse IA CdG** : paragraphe fixe (`SYNTHESE_IA_CDG`) : CA consolidé −3,9 % vs budget, stock +17,4 M au-dessus du budget BFR.

---

## 6. Synthèse des points à retenir pour le PRD

### 6.1 Constats clés
1. **Rien n'est branché.** L'ensemble du périmètre finance et recouvrement est du front de démonstration : données figées au 11/06/2026, journaux en `localStorage`, boutons qui journalisent sans effet métier. Les actions les plus critiques (télédéclaration OTR, génération d'ordres de virement, envoi réel WhatsApp/SMS, conversion proforma → commande → facture, création d'avoir, enregistrement et lettrage d'un paiement) sont soit MORTES soit SIMULÉES.
2. **Le cycle documentaire n'est complet qu'en types** : devis → proforma → commande → facture → e-facture. `TypeDocument` liste `DEVIS`, `AVOIR` et `FACTURE_ACHAT`, mais il n'y a ni écran devis, ni création d'avoir, ni bon de livraison. La « conversion » ne crée aucune commande ni facture visibles ailleurs.
3. **Quatre modèles de « créance » coexistent sans pont** : `Facture` (registre factures), `CreanceComptable` (registre compta : client + `factures[]`), `Relance` (dossier avec une `facture_ref`), `DossierRecouvrement` (calcul sur la créance comptable). Aucune clé commune au-delà du `pdv_id`/`client_id`. Le PRD doit définir un seul objet `Créance`/`Échéance` avec des paiements affectables.
4. **Deux échelles d'escalade contradictoires** (J+30 vs > 60 j pour le blocage ; paliers visite J+14 vs 16–30) et **deux balances âgées** (4 tranches vs 5), dont la plus riche est un composant orphelin.
5. **Pas de module d'encaissement** : pas de liste de paiements, pas de liens de paiement mobile, aucun lien entre l'encaissement saisi sur le terrain (`Visite.montant_encaisse`), la remise de caisse et le lettrage. L'écart de caisse et le lettrage sont des tableaux statiques indépendants.
6. **Données de démo incohérentes à ne pas reproduire** : lignes ≠ montant de facture ; TVA à 15 % du TTC sur plusieurs écritures ; trois formats de numéro de facture ; NIF et RCCM de l'émetteur en dur dans le composant d'aperçu ; année 2026 figée dans la numérotation ; plafond de crédit porté par la facture et non par le client.

### 6.2 Commun avec une IMF (créance générique, dossier, escalade) vs propre au distributeur

**Commun (à extraire en module générique, candidat « Reprise de contexte » avec l'IMF)**

| Brique | Équivalent IMF | Où dans ce front |
|---|---|---|
| **Créance / échéance** (montant dû, payé, reste, échéance, jours de retard) | Échéance de prêt | `Facture.montant/paye/echeance/jours_retard`, `CreanceComptable` |
| **Balance âgée** par tranche de retard | Portefeuille à risque (PAR 1-30 / 31-60 / 61-90 / > 90) | `buildBalanceAgeeClient`, `getRelancesAgingBuckets` |
| **Dossier de recouvrement** (id, débiteur, montant, canal, priorité, statut, historique, prochaine action) | Dossier d'impayé | `Relance`, `RelanceStatut` |
| **Échelle d'escalade** paramétrable (rappel préventif, WhatsApp, SMS/appel, visite, mise en demeure, contentieux) | Idem (rappel, relance, visite d'agent, mise en demeure) | `REGLES_AUTOMATION_RELANCES`, `buildReglesRecouvrement` |
| **Promesse de paiement** (date, montant, fiabilité, rompue/tenue) | Idem | `PromessePaiement` |
| **Journal d'événements de dossier** (relance, paiement, promesse, escalade, blocage, clôture) | Idem | `EvenementRecouvrement`, `etatDossier` |
| **Blocage / déblocage d'octroi** avec trace | Blocage de nouveaux décaissements | `BLOCAGE_CREDIT` / `DEBLOCAGE_CREDIT` |
| **Probabilité de recouvrement** et **valeur espérée** pour prioriser | Idem (scoring de recouvrement) | `probabiliteRecouvrement`, `valeur_esperee` |
| **File du jour bornée** (capacité de dossiers par agent) | Tournée de recouvrement de l'agent | `CAPACITE_JOUR = 12`, tournée géolocalisée |
| **Provision** (`provision_pct`) et écriture de provision | Provision sur prêts (classes de risque) | `CreanceComptable.provision_pct`, `PROV-411` |
| **Encaissement avec lettrage** (Mobile Money, espèces, virement, chèque) et **remise de caisse d'agent** | Remboursement collecté par l'agent, versement de caisse | `EncaissementALettrer`, `RemiseCaisse` |
| **Comptabilité SYSCOHADA** (journal, balance, rapprochements, suspens, clôture, déclaration TVA/fiscales) | Idem (SYSCOHADA, plan de comptes) | `comptabilite-registry.ts` |
| **Contrôle de gestion** (budget/réel/prévision par axe, écarts, P&L par axe, rapport à la direction) | Budget par agence / produit | `cdg-registry.ts` |
| **Pilotage de trésorerie** (plancher, covenants, lignes bancaires, échéances fiscales) | Idem (liquidité, ratios prudentiels) | `daf-registry.ts` |

**Propre au distributeur (ne pas généraliser)**
- **Facture, ligne de facture, proforma, devis, avoir sur vente, commande et BL**, remise de ligne et remise globale, grille tarifaire par type de client (`GRILLE_PRIX_ENTREPRISE`), marge par facture.
- **E-facture OTR Togo** (certification, QR, hash, archive 10 ans, NIF client, nomenclature fiscale) : propre au contexte fiscal de la vente de marchandises, applicable à toute entité qui facture, mais pas à une IMF (qui facture des commissions et frais, hors périmètre).
- **TVA 18 %** sur ventes de marchandises (`443100`, `445200`) et factures d'achat fournisseurs (`FACTURE_ACHAT`).
- **Plafond de crédit client commercial** et décision DAF « accorder / sous condition / refuser » basée sur la marge 12 mois / crédit engagé (une IMF a un scoring et des paliers de montant différents).
- **BFR, DIO/DPO**, run de paiement fournisseurs, ristournes fournisseurs (marge arrière), ordres de virement fournisseurs, escompte et pénalités fournisseur.
- **Marge nette par canal de distribution** (remises, commissions commerciales, transport, coût du crédit client, pertes sur créances).
- **Remise de caisse du commercial terrain** liée à une tournée de vente (une IMF a des versements d'agents de collecte, de nature proche mais pas d'objet « tournée de vente »).
- **Rapport de gestion par zone / canal / famille de produits** (une IMF raisonne par agence / produit de crédit).

### 6.3 Ce que les docs disent mais que le code ne contient pas
- « Balance âgée client **et fournisseur** » (spec V2 §7.10) : seule la version client est codée (et orpheline). Il existe un échéancier fournisseur dans le pilotage DAF, pas une balance âgée.
- Onglet **« Avoirs »** séparé (spec V2 §4.3) : les avoirs sont une section de l'onglet e-facturation.
- Colonne « statut e-facture » sur la liste des factures (spec V2 §4.3) : absente de `FacturationView`.
- Onglet « Factures » ouvert à RECOUVREMENT et DC (spec V2) : DC et RECOUVREMENT y sont, mais le Shell n'a pas CONTROLE_GESTION (voir §1).
