# Lot 7 du groupe B : les archives complètes, et le backend prêt pour janvier, février et après

> **Date :** 2026-11-25 · **Statut :** proposition écrite par la session A (moneyvibes-apps-1b) sur consigne de
> l'utilisateur, **en attente de validation par l'utilisateur**. En vigueur à la fusion de ce document ; la session B
> la lit à son rituel et peut la contester dans son journal.
> **Consigne de l'utilisateur (25/11) :** « C et D sont là pour terminer les modules Bilan et états financiers, Atelier
> de balance, Conseil fiscal. Moi je veux que le groupe B se charge de ce qui va rester côté archives pour que ce soit
> parfait, complet, un vrai process côté backend, et ajouter à cela faire les backend permettant d'être prêt pour
> janvier, février et même après. »
> **Complète** `PLAN-LOT-7-2026-11-24.md` (C et D) et `PLAN-LOT-7-GROUPE-A-2026-11-25.md` (A).
> **Sources :** PRD `prds/prd-services-cabinet-2026-11-18/` (§4.2, FR-7 → FR-11, FR-19 ; addendum §4 : AUDCIF, loi
> 2017-07, référentiel d'archivage électronique ARTP v2.0), `epics-services-cabinet-2026-11-18.md` (EPIC-267),
> fiches STORY-1087, 1088, 1100 (« nommé pour plus tard »), `PLAN-FEVRIER-2027-TOUT-CHARGE-2026-11-14.md` (épics du
> moteur), `PLAN-LOT-6-2026-11-23.md` (§5), `journal-groupe-B.md`.

---

## 0. Où en sont les archives et B

- **Archives : le socle est livré par C le 24/11.** STORY-1087 (la GED s'ouvre au cabinet : fonds, plan de classement,
  lots, contrôle, versement, natures sensibles, chiffrement), STORY-1088 (originaux papier : réception, cotes,
  étiquettes, sorties et retours, récolement, restitution, recherche dans un fonds, durée de conservation affichée),
  STORY-1100 (mémoire de classement, factures inscrites rangées d'elles-mêmes). **Ce qui manque pour un vrai process
  complet est écrit dans ces fiches comme « nommé pour plus tard »** : c'est la première moitié du lot.
- **Lot 6 de B : 6 sur 7 faites** (1080, 1112, 1113, 1114, 1103, 1115). Reste STORY-1116.
- **Passation à écrire : `document-service` passe de C à B**, par une ligne au journal de C (C est sur le fiscal au
  lot 7). C reste joignable pour les questions sur ce qu'il a livré.
- **Dépôts de B au lot 7 :** `document-service` (en plus), `platform-catalog-service`, `auth-service`,
  `admin-panel-service` (BFF), `prospera-recette`, `centrale-service`, `agent-instance`, la part « moteur » de
  `prospera-plateforme`, `kyc-service`, et par défaut `dossier-service` et `paiement-service` (prêtés à D pour 1073).
- **Poste :** B partage l'autre poste et son verrou Docker avec C et D (`PLAN-LOT-7-2026-11-24.md`, §2).

## 1. Les 18 stories, dans l'ordre

Chaque fiche est écrite par B juste avant le code (identifiant pris à l'écriture, au-dessus du plafond du tracker),
contrat annoncé avant le code, preuve sur une pile neuve.

### Première partie : les archives, complètes (8 stories, `document-service`)

| # | Story | Ce que le cabinet obtient | Source du manque |
|:--:|---|---|---|
| 1 | **Les archives ont valeur de preuve** | journal d'intégrité chaîné (chaque versement, chaque consultation d'une pièce sensible), contrôle périodique des empreintes avec écarts nommés, attestation de numérisation et certificat d'intégrité d'un fonds, téléchargeables | addendum §4 (loi 2017-07, ARTP v2.0) ; FR-9 |
| 2 | **Fin de mission et réversibilité** | quand la mission s'arrête ou le client part : fermeture du fonds, export complet (copies, index, bordereaux, empreintes) et bordereau de restitution signé ; le fonds se ferme avec le dossier client (« archiver un dossier ») | FR-10 (restitution), PRD §3 (« archiver ») |
| 3 | **La destruction proposée, puis visée** | à l'échéance de conservation : liste des pièces échues, proposition, visa de l'associé, accord du client, procès-verbal et registre ; jamais automatique, jamais une pièce encore en litige ou en contrôle | FR-11 ; 1087 (« d'un lot suivant ») |
| 4 | **Retrouver dans tous les fonds du cabinet** | une recherche sur tous les fonds, et un index qui tient sur un gros fonds sans déchiffrer le texte en clair | D-1088-4, D-1088-6 |
| 5 | **Les alertes de l'archiviste** | retard de retour d'un original, échéance de conservation proche, quota de l'offre dépassé : faits publiés, cloche et e-mail (le consommateur est dans `notification-service`, chez D : à lui demander) | D-1088-3, D-1087-5 |
| 6 | **Le circuit sans trou** | réception et boîtes dans une transaction, deux sorties d'une même pièce verrouillées, et le retrait d'une facture désinscrite de la comptabilité (fait de désinscription) | D-1088-11, D-1100-3 |
| 7 | **L'archivage se mesure et se vend** | compteurs par cabinet (fonds, pages versées, volume, boîtes cotées, par mois et au total), quota de l'offre, aucun contenu de pièce ; relais BFF pour la console (AP-51) | FR-19, AP-51 |
| 8 | **La recette des archives de bout en bout** | le parcours UJ-2 sur pile neuve : 40 boîtes reçues, numérisées, versées, cotées, une facture de 2019 retrouvée en moins de trois gestes, une pièce sortie et rentrée, un récolement, une restitution | PRD UJ-2, salle du 19/11 (V9) |

### Deuxième partie : le backend prêt pour janvier, février et après (10 stories, moteur)

| # | Story | Dépôt | Date | Pourquoi |
|:--:|---|---|---|---|
| 9 | **STORY-1116** cinq essais simultanés, chacun dans son espace (si le lot 6 ne l'a pas finie) | recette, catalogue | **démo du 15/01** | la démo de vente |
| 10 | **`referentiels` dans l'état publié** (champ facultatif) | catalogue | **avant le gel du 11/12** | C retire son consommateur de `entitlement.changed` (STORY-1006) |
| 11 | **le contrat d'état publié figé** (EPIC-142), avec l'inventaire écrit de ce qui reste dans EPIC-142 → 147 et 159 | catalogue, plateforme | **11/12** | plus rien ne s'ajoute sans version neuve |
| 12 | **le cabinet sur le moteur** (EPIC-144, 159) : les chemins d'octroi retirés après AP-55 (A), `PUT …/entitlements` gardé pour la sanction seule, recettes croisées réécrites | BFF, catalogue, recette | **18/12** | jalon « cabinet sur le moteur » |
| 13 | **effacer le dossier de démonstration à la fin d'un essai** (D-1082-10) | dossier, catalogue | avant le certificat d'essai | effacement complet d'un essai |
| 14 | **les restes d'EPIC-145, 146, 147** nommés par l'inventaire du n° 11 | catalogue, auth, BFF | 08/01 | l'état publié fait foi, deux espaces, essai du prospect |
| 15 | **la licence signée** (EPIC-150), premier incrément : ouvrir, prolonger | auth, paiement, centrale | **08/01** | la mise en service vend une licence |
| 16 | **l'interface de l'agent publiée** (EPIC-148) | agent-instance, centrale, plateforme | **08/01** | instance montée sur site en S10 (29/01) |
| 17 | **l'instance garde la confiance, coupée de Money Vibes** (EPIC-149) | agent-instance, centrale | 15/01 | prérequis de la licence et des mises à jour |
| 18 | **mettre à jour sans peur** (EPIC-151), premier incrément : essayer, promouvoir, revenir | agent, centrale, catalogue | 22/01 | la mise en service de février (S13, 19/02) |

**Remplaçantes** si une story bloque : le consommateur de `facturation.avoir.emis@1` dans `paiement` (après le retour
de `paiement` par D) ; `ESPACE_KYC_URL` dans la pile de la recette ; consentements et indicateurs (EPIC-157).

## 2. Ce qui n'entre pas au lot 7 de B

- **Les modules Bilan et états financiers, Atelier de balance, Conseil fiscal** : C et D (consigne de l'utilisateur).
- **Le financement** (STORY-1104 → 1111, `bilan-service`, à D) : recommandé à Dev A (plan du lot 7 de A, §2).
- **Les écrans** des archives (FE-143, AP-51) : A, au lot 8, quand ces routes sont sur `dev`.
- **EPIC-152, 153, 154, 157, 158** et **désinstaller / réinstaller** : lot 8 (S9 et après).
- **Déjà servi, à ne pas replanifier** : relais de l'état publié (1080), essais (1112), mise en service (1113), métier
  (1114), recopies de manifestes (979), droits du cabinet et de la facturation (979), recette sur pile neuve (940),
  `prospera-plateforme` (941).

## 3. Risque à dire

Le plan de février (R12) donnait déjà à Dev B 17 à 20 semaines de moteur pour 10 disponibles. Avec huit stories
d'archives devant, les n° 14 à 18 glissent sur janvier : **les dates du 11/12 et du 18/12 passent avant les
archives** si elles sont menacées (n° 10 → 12 avancés).

## 4. Gestes réservés à l'utilisateur

- Valider ce plan.
- Dire qui tient `prospera-expert-comptable` (B a posé la question ; défaut écrit : D).
- À l'arrivée de Dev A (04/12) : ce qu'il prend dans les dépôts de B.
