# Amendement du plan de février 2027 : recalage sur l'arrivée de Dev A et l'ordre des clients

> **Date :** 2026-11-14 · **Statut :** proposition de Dev B, **à valider par le PO** · **Auteur :** Dev B
> **Amende :** `PLAN-FEVRIER-2027-TOUT-CHARGE-2026-11-14.md` (PR #446). Une fois validé, ce document fait foi là où
> les deux diffèrent ; le reste du plan #446 (règles de dépôt, entrées extérieures, risques) tient.
> **Période :** S2 (16/11/2026) → S14 (26/02/2027), pause du 21/12 au 01/01 inchangée.

---

## 1. Les faits nouveaux

| # | Fait | Source |
|:--:|---|---|
| F1 | **Dev A commence le 04/12/2026**, donc code à partir du lundi 07/12 (S5). Il fait **le backend seulement**. | Dev B, 2026-11-14 |
| F2 | **Ordre des clients : 1) le cabinet d'expert-comptable ; 2) le distributeur et la compagnie d'assurance, au même niveau ; 3) l'IMF.** | Dev B, 2026-11-14 |
| F3 | Le cabinet en premier **inclut la fiscalité (EPIC-027 → 034) et la comptabilité du cabinet (EPIC-111 → 120)**, en plus du passage du cabinet sur le moteur. | Dev B, 2026-11-14 |
| F4 | **Chaque semaine, chaque projet avance**, backend et écrans : à la fin de la semaine, une étape de plus est visible à l'écran, sur le vrai backend. | Dev B, 2026-11-14 |

**Ce que F1 change au plan #446.** Le plan donnait à Dev A, de S2 à S4, le réseau (EPIC-044 → 053), la mécanique de la
coque (EPIC-265), les droits à tiret (EPIC-264) et le socle EPIC-155, fini le 04/12, en tête du chemin critique de la
démo. Ces trois semaines n'ont plus de porteur : Dev B en prend une partie (§3), le reste glisse.

---

## 2. La capacité, chiffrée là où une source le permet

| Chantier | Taille connue | Source |
|---|---|---|
| Réseau, points de vente, catalogue, stock (tous leurs épics) | **522 points** | plan v2 §2 |
| Fiscalité du cabinet | **61 stories ouvertes, ≈ 320 points** ; 14 fiches écrites sur 61 | `sprint-status.yaml`, 2026-11-14 |
| Comptabilité du cabinet | **non chiffrable** : ni PRD, ni spine, ni story ; Q1 et Q2 non tranchées ; service inexistant | `epics-comptabilite-2026-08-27.md` |
| Moteur d'installation complet | **17 à 20 semaines** de Dev B pour 10 disponibles | amendement v3 §5 |
| Épics de novembre (distributeur, assurance, IMF, IA) | **non chiffrés** | plan #446, R11 |
| Vitesse de référence | 80 à 100 points par semaine et par développeur, **mesurée sur un seul développeur** qui connaissait le code | plan v2 §2 |

**Ce que cela dit, sans détour.** Dev B dispose de 12 semaines de travail jusqu'au 19/02, Dev A de 9 (S5 → S13) et de
la réserve S14. La fiscalité seule prend environ quatre semaines de Dev B ; le réseau, les points de vente, le catalogue
et le stock en prennent cinq à six de Dev A avant la première commande du distributeur. **Le cabinet complet, le circuit
complet de l'assurance et le distributeur complet ne tiennent pas ensemble en février.** Ce plan tient l'ordre F2 :
le cabinet d'abord, puis **le parcours principal** du distributeur et de l'assurance, le reste après février (§5).

---

## 3. Qui fait quoi

| | Dev B (l'utilisateur) | Dev A (à partir du 07/12) |
|---|---|---|
| **Cabinet** | tout : fiscalité, comptabilité, passage sur le moteur, backend et écrans | rien : il n'entre pas dans les dépôts du cabinet |
| **Moteur et coque** | la tranche mince (§4) : contrat d'état publié, manifestes, garde partagée, installation, coque | les migrations de socle (Node 24, client Confluent) **dans les dépôts où il travaille**, au passage |
| **Distributeur** | S2 → S4 : socle du réseau, coque, fiches de Dev A ; puis **tous les écrans** | **tout le backend** à partir de S5 |
| **Assurance** | S2 → S4 : fiches de Dev A, écran de déclaration ; puis **tous les écrans** | **tout le backend** à partir de S5 |
| **IMF** | la démo du 15/01 sur le code actuel | rien avant février (§5) |

**Règle tenue :** A et B jamais dans le même dépôt la même semaine. Dev B écrit le contrat de chaque route **avant**
que Dev A la code (types générés depuis l'OpenAPI), et ne touche plus au backend des verticales après le 04/12.

---

## 4. Le calendrier, semaine par semaine

Chaque case est **une étape visible à l'écran à la fin de la semaine**, pas une liste d'épics actifs. Une semaine qui
glisse décale la suite de son projet, pas celle des autres.

| Sem. | Cabinet (B) | Moteur et coque (B) | Distributeur | Assurance | IMF |
|---|---|---|---|---|---|
| **S2** 16/11 → 20/11 | Recette du parcours complet (FE-069, STORY-100) ; STORY-178, 177 ; fiches d'EPIC-027 et 028 | STORY-365 requalifiée (166 et 167 ont avancé sur le même terrain) | B : `reseau` au catalogue, socle de `reseau-service` (EPIC-044) | B : fiches 201, 205, 206 | — |
| **S3** 23/11 → 27/11 | Fiscalité EPIC-027 (298 → 300) | EPIC-155 sur les dépôts du cabinet, `auth-service` et le catalogue ; contrat d'état publié rédigé (EPIC-142) | B : squelette de la coque sur doublure (EPIC-265), écran du réseau | B : fiches 203, 204, 207 ; écran de déclaration dans la coque, sur le service existant | — |
| **S4** 30/11 → 04/12 | Fiscalité EPIC-028 ; PRD court et spine de la comptabilité (Q1, Q2) | Manifestes du cabinet (EPIC-143, en mince) | B : fiches de Dev A prêtes (réseau 045 → 053, PDV 085 → 087) | B : fiches de Dev A prêtes (201 → 206, 209 → 211) | — |
| **S5** 07/12 → 11/12 | Fiscalité EPIC-029 | Contrat d'état **figé le 11/12** ; garde partagée (EPIC-145, en mince) | A : réseau 045 → 051 · B : écrans | A : socle et migrations (201) · B : écrans | — |
| **S6** 14/12 → 18/12 | Fiscalité EPIC-030 | 🎯 **le cabinet sur le moteur** (EPIC-159) | A : réseau 052-053, PDV 085 → 087 | A : machine à états (205) | — |
| *pause* | | | | | |
| **S7** 04/01 → 08/01 | Fiscalité EPIC-031 (1/2) | Installation, seul chemin vers `ACTIVE` (EPIC-144) ; essai du prospect (EPIC-147, en mince) | A : catalogue 065 → 068, 070 | A : déclarer (206) ; compagnie fictive minimale (203, 204) | — |
| **S8** 11/01 → 15/01 | Fiscalité EPIC-031 (2/2) | Offres d'essai et jeux de démo (EPIC-160) ; 🎯 **démo du 15/01** | A : stock 075 → 078 ; 🎯 démo : réseau, PDV, catalogue | A : 🎯 démo : un sinistre de `DECLARE` à `CLOTURE` | 🎯 démo du code actuel |
| **S9** 18/01 → 22/01 | Fiscalité EPIC-033 (règlement) | Profil de démarrage par module ; images reconstruites depuis `dev` | A : services neufs (222), séries sans perte (224) | A : instruire, automobile matériel (207) | — |
| **S10** 25/01 → 29/01 | Fiscalité EPIC-034 (social) | Montage de l'instance de l'assureur (selon D3) | A : commande (228), garde-fous et réservation (225, 227 en mince) | A : décider (209), contrat lu et provision (215) | — |
| **S11** 01/02 → 05/02 | Fiscalité EPIC-032 (dépôt, 1/2) | Recette croisée | A : entrepôt et bon de livraison (229), Créance (231) | A : payer par chèque (210, après 231) | — |
| **S12** 08/02 → 12/02 | Fiscalité EPIC-032 (2/2), 560 → 569 | — | A : **la facture juste** (230) | A : clore (211), pièces sans OCR de lot (214, en mince) | — |
| **S13** 15/02 → 19/02 | Comptabilité : socle (EPIC-111), si la mesure du 27/11 le permet | — | A : encaisser et envoyer (232) ; 🎯 mise en service | 🎯 mise en service sur site | — |
| **S14** 22/02 → 26/02 | Réserve | Réserve | Réserve | Réserve | — |

**Points de mesure.**
- **27/11** : vitesse réelle de Dev B, seul, sur S2-S3. Elle remplace l'hypothèse de 80 à 100 points.
- **04/12** : chiffrage consolidé (inchangé) ; il chiffre ce calendrier, pas celui du plan #446.
- **11/12** : première semaine de Dev A mesurée ; contrat d'état figé.
- **Chaque vendredi** : une étape par projet est montrée à l'écran. Une étape non montrée déclenche l'ordre de coupe du §6.

---

## 5. Ce qui sort de février (proposé, à valider)

| Bloc | Sort de février | Ce qui reste en février |
|---|---|---|
| **Cabinet** | Comptabilité EPIC-112 → 120 (et 111 si la mesure ne le permet pas) | Fiscalité complète ; comptabilité cadrée (PRD court, spine, Q1, Q2) |
| **Distributeur** | La tournée et l'application Flutter (233, 234), le recouvrement (235), 236 → 243, les épics non ★ du catalogue, du stock et des points de vente, la reprise automatisée depuis l'ancien logiciel (244) | Le parcours **« la facture juste »** : commande → stock réservé → bon de livraison → facture → envoi → encaissement |
| **Assurance** | Expertises externes (208), recours et fraude (212), recherche unique (213), tableaux (216), IA (217, 218), reprise des archives par l'API (219), portail des cabinets d'expertise (220), OCR de lot | Le circuit déclarer → instruire → décider → payer par chèque → clore, contre la compagnie fictive |
| **IMF** | **Toute la chaîne crédit (180 → 200)** | La démo du code actuel ; démarrage chez l'IMF après février |
| **IA commune** | **EPIC-245 → 261** | Rien : aucune proposition d'IA à la démo du 15/01 |
| **Moteur** | Partie B (agent, licence signée, horloge scellée, gel à 30 jours, mise à jour à distance, vagues, centrale) et partie C (apprentissage) | Partie A en mince ; les instances sur site s'installent **à la main**, avec le même profil de démarrage |
| **Reprise** | Le lot, les adaptateurs, le feu vert automatisé (162 → 168) | Une reprise par fichiers, faite par nous avec le client à la mise en service |
| **Connecteurs** | Déjà hors février (AD-32) | — |

---

## 6. L'ordre de coupe, si une étape glisse

Appliqué dans cet ordre, sans attendre le 04/12 :
1. **Comptabilité EPIC-111** → mars.
2. **Fiscalité : dépôt automatisé** (561, 565) → mars ; le livrable produit reste en février.
3. **Assurance : pièces (214)** → mars ; le dossier garde ses pièces jointes simples.
4. **Distributeur : encaissement PI-SPI** → mars ; FedaPay et les espèces restent.

---

## 7. Les stories non terminées du registre

| Sort | Stories | Pourquoi |
|---|---|---|
| **Finir en S2** | STORY-178 (administrateur semé au démarrage), 177 (date d'octroi), 293 (en revue) ; STORY-365 requalifiée | Une pile neuve doit démarrer utilisable avant toute recette |
| **Jouer en S2** | STORY-100 et FE-069 (recettes de bout en bout du cabinet) | Le cabinet passe le premier sur le moteur : on sait qu'il marche avant de le migrer |
| **Dans le calendrier** | Fiscalité EPIC-027 → 034 (≈ 320 points), dans l'ordre du registre | F3 |
| **Avec l'encaissement du distributeur (S13)** | STORY-673, 247 (FedaPay réel) ; 715 (mTLS, bloquée) | Rien n'en dépend avant S13 |
| **Après février** | STORY-267, 287, 170 | Aucun parcours de février n'en dépend |

---

## 8. À lancer dès le lundi 16/11 (hors code)

| Action | Qui | Pourquoi maintenant |
|---|---|---|
| Désigner **un juriste** (revue obligatoire avant la mise en service de l'assurance) et **un fiscaliste** (CNSS, loi de finances, SMIG du paquet Togo) | PO | Leur avis conditionne la mise en service et la fiscalité ; il faut des semaines |
| Obtenir les **exports de l'ancien logiciel du distributeur** (clients, articles, factures ouvertes, modèle de facture, dernier numéro) | PO | Le format du numéro de facture (224) en dépend ; échéance du plan #446 : 14/12 |
| Obtenir les **documents de la compagnie** et tenir la séance d'immersion | PO | Paramètres de 205 → 209 ; au plus tard le 22/01 |
| Signer le **compte marchand FedaPay** réel | PO | Encaissement du distributeur en S13 |

---

## 9. Décisions demandées au PO

| # | Décision | Recommandation de Dev B |
|:--:|---|---|
| D1 | Valider F2, F3 et F4 comme règles de planification | ✅ |
| D2 | **IMF en février = la démo du code actuel**, pas une exploitation ; le dire à l'IMF maintenant | ✅ |
| D3 | **Partie B du moteur hors février** ; instances sur site installées à la main. Amende la liste « jamais sacrifiées » du 10/11 (FR-14, FR-15, FR-17, FR-18, FR-22) | ✅ : avec deux instances, l'installation à la main coûte quelques heures ; la partie B coûte sept à huit semaines |
| D4 | **IA commune hors février** ; mesurer un modèle de langage en français sur une machine type avant toute promesse | ✅ |
| D5 | **Reprise par fichiers**, faite par nous à la mise en service | ✅ |
| D6 | Comptabilité : **Q1 = exclusivité cahiers ou grand livre par exercice** (recommandation d'août) ; Q2 = échéance du brouillard | ✅ pour Q1 ; Q2 à trancher au PRD court (S4) |
| D7 | Le parcours principal du distributeur et de l'assurance (§5) est **ce qui est promis aux deux clients pour février** | ✅ : à leur dire avant la démo du 15/01 |

---

## 10. Incohérences relevées dans les documents (à corriger, sans urgence)

- **EPIC-264** porte deux chantiers sans lien : droits à tiret (S4) et Mobile Money sortant (S11-S12).
- **EPIC-159** : « cabinet sur le moteur » le 18/12 au §3.1 du plan #446, le 08/01 au §7.1.
- **EPIC-187 et EPIC-189** dépendent l'un de l'autre.
- **`champs-sensibles`** : la spine de l'assurance le dit hérité de la microfinance, aucun épic ne le construit.
- **Voix de l'IMF** : « au premier jour » dans le PRD de l'IA, placée en S13-S14 (après la mise en service).
- **Fiscalité EPIC-027 → 034** : absente du plan #446, qui annonce placer tous les épics ouverts.
- **Service porteur de l'IA** : encore « à cadrer » dans les épics de l'IMF et de l'assurance, tranché depuis (`prospera-ia-service` :3417).
- **Mobile Money sortant** : « bientôt » dans le PRD de l'assurance (FR-223) et la spine de l'IMF (AD-24), construit en S11-S12 au plan #446.
