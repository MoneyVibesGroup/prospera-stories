# Lot 7 du groupe B : le moteur tient ses jalons de décembre, et prépare janvier

> **Date :** 2026-11-25 · **Statut :** proposition écrite par la session A (moneyvibes-apps-1b) sur consigne de
> l'utilisateur (« maintenant pour le groupe B »), **en attente de validation par l'utilisateur**. En vigueur à la
> fusion de ce document ; la session B la lit à son rituel et peut la contester dans son journal.
> **Complète** `PLAN-LOT-7-2026-11-24.md` (C et D) et `PLAN-LOT-7-GROUPE-A-2026-11-25.md` (A).
> **Sources :** `PLAN-FEVRIER-2027-TOUT-CHARGE-2026-11-14.md` (tableau des épics du moteur, §3.1), `PLAN-LOT-6-2026-11-23.md`
> (§5, D-L6-5), `journal-groupe-B.md` (« État », « Dépôts tenus », « Suivante »), les demandes « → B » des journaux de
> A, C et D, `PLAN-COQUE-EPIC-265-2026-11-24.md` §4.

---

## 0. Où en est B

- **Lot 6 : 6 sur 7 faites.** STORY-1080, 1112 (et le premier membre d'un essai), 1113, 1114, 1103, 1115, plus la
  remise à niveau des manifestes et des droits (979). **Reste STORY-1116** (cinq essais simultanés, démo du 15/01) :
  ni fiche ni PR visibles le 25/11.
- **Dépôts tenus :** `platform-catalog-service`, `auth-service`, `admin-panel-service` (BFF), `prospera-recette`,
  `centrale-service`, `agent-instance`, la part « moteur » de `prospera-plateforme`, et par défaut `dossier-service`
  et `paiement-service` (prêtés à D pour STORY-1073 seule). `kyc-service` n'était à B que pour le lot 6 : **il le
  garde au lot 7** (personne d'autre n'y travaille). `bilan-service` est à D, `notification-service` à D, balance et
  comptabilité à C.
- **Poste :** au lot 7, B partage l'autre poste et son verrou Docker avec C et D (`PLAN-LOT-7-2026-11-24.md`, §2).

## 1. Les dates qui commandent le lot (plan de février)

| Jalon | Date | Épic | Ce qui doit être vrai |
|---|---|---|---|
| contrat d'état publié figé | **11/12** | EPIC-142 | plus aucun champ ajouté après cette date sans version neuve |
| le catalogue connaît chaque module par son manifeste | 18/12 | EPIC-143 | — |
| **le cabinet sur le moteur** | **18/12** | EPIC-144, EPIC-159 | les quatre chemins d'octroi retirés, recettes croisées réécrites sur le moteur |
| l'état publié fait foi ; deux espaces ; essai du prospect | 08/01 | EPIC-145, 146, 147 | — |
| démo de vente | **15/01** | EPIC-147, 1116 | cinq prospects essaient en même temps |
| interface de l'agent publiée ; licence signée | 08/01 | EPIC-148, 150 | travail commencé le 04/01 (S7) |

## 2. Le lot 7 de B, dans l'ordre

| # | Story | Dépôt | Pourquoi maintenant | Source |
|:--:|---|---|---|---|
| 1 | **STORY-1116** cinq essais simultanés, chacun dans son espace (si le lot 6 ne l'a pas finie) | recette, catalogue | démo du 15/01 | PLAN-LOT-6 §5 n° 7 |
| 2 | **à créer** : `referentiels` (facultatif) dans l'état publié | catalogue | **avant le gel du 11/12** ; permet à C de retirer son consommateur de `entitlement.changed` (STORY-1006) | journal B (D-972-10), journal C (17/11) |
| 3 | **inventaire écrit** des stories restantes d'EPIC-142, 143, 144, 145, 146, 147 et 159, sur ce que les lots 1 à 6 ont déjà livré | — (journal de B) | les épics sont à moitié faits, et rien ne dit ce qui reste ; il donne les numéros 4 → 13 | tracker (`Lot B`, `Lot 2 de B`…), plan de février |
| 4 → 13 | **les stories de cet inventaire, jalon par jalon** : d'abord le gel du contrat (11/12), puis le cabinet sur le moteur (18/12), puis 145 → 147 (08/01) | catalogue, auth, BFF, recette | jalons du §1 | inventaire du n° 3 |
| 14 | **retrait de l'octroi par `PUT`** de la console, juste après la fusion d'AP-55 (A, lot 7) ; `PUT …/entitlements` gardé pour la sanction seulement | BFF, catalogue | partie de « cabinet sur le moteur » (18/12) | AP-55 AC-5, plan de février §3.1 |
| 15 | **à créer** : effacer le dossier de démonstration à la fin d'un essai (D-1082-10) | dossier, catalogue | l'effacement complet d'un essai, avant le certificat d'essai | journal B (D-1082-10) |
| 16 | **à créer** : le consommateur de `facturation.avoir.emis@1` dans `paiement` | paiement | le reste dû baisse après un avoir (1066 de D) ; **après le retour de `paiement` par D** (fin de 1073) | journal B, journal D |
| 17 | **à créer** : poser `ESPACE_KYC_URL` dans la pile de la recette et rejouer l'e-mail de renvoi KYC | recette | AC-5 de 1103 prouvé dans la recette | journal D (1072) |
| 18 | **fiches d'EPIC-148, 149 et 150** (agent, confiance hors ligne, licence), écrites et chiffrées | — | le travail commence le 04/01 ; l'interface de l'agent et la licence sont attendues le 08/01 | plan de février, tableau des épics |

**Remplaçantes** si une story bloque : relais BFF de la complétude du dossier (seulement si un écran le demande, journal
de A) ; tickets `dates-cibles-de-module` et `repartition-par-version` (contrôles de la console AP-22 et AP-10) ;
vérifier le rôle « sans rôle métier » de la liste des membres (le journal de B le dit servi par 942, puis « non
traité » : à trancher).

## 3. Ce qui n'entre pas au lot 7 de B

- **EPIC-151, 152, 153, 154, 157** et **désinstaller / réinstaller** (EPIC-144, écrans en S9) : janvier, lot 8.
- **Le financement** (STORY-1104 → 1111) : dans `bilan-service`, à D ; recommandé à Dev A (plan du lot 7 de A, §2).
- **Déjà servi, à ne pas replanifier** : relais de l'état publié (`GET /admin/orgs/{orgId}/etat-publie`, 1080) ;
  liste des essais et « naissance + essai en un geste » (1112) ; mise en service (1113) ; métier (1114) ; recopies
  de manifestes (`comptabilite` 0.5.0, `ged` 1.3.0, `facturation` 1.1.0, assurance, expertises, sinistres) ; droits
  du cabinet et de la facturation (979) ; recette sur pile neuve (940) ; `prospera-plateforme` (941).
  Les journaux de C et D gardent quelques « → B » non barrés alors que B les a servis : à barrer par leurs auteurs.

## 4. Risque à dire

Le plan de février (R12) donne à Dev B 17 à 20 semaines de moteur pour 10 disponibles. Le lot 7 de B ne tient que s'il
reste sur le moteur : aucune story d'un autre domaine n'y entre sans en sortir une.

## 5. Gestes réservés à l'utilisateur

- Valider ce plan.
- Dire qui tient `prospera-expert-comptable` (B a posé la question ; défaut écrit : D).
- À l'arrivée de Dev A (04/12) : ce qu'il prend dans les dépôts de B (le plan de février lui donne des passages dans
  `auth-service` en S4 et S8).
