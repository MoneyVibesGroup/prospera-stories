# Rail E — `paiement-service` : PI-SPI prêt, preuve et règles de gestion

**Date :** 2026-10-23 · **Service :** `prospera-paiement-service` · **Branche d'intégration :** `dev`
**Total :** 11 stories · 43 points · **Identifiants :** STORY-674, 675, 286 (existantes) +
**STORY-715 → STORY-722** (neuves) · **STORY-723** (hors liste — défaut mesuré pendant 674).

> Se termine sur un raccordement PI-SPI prêt pour la production, et une piste d'audit qu'un auditeur
> peut vérifier lui-même.

⛔ **Consigne du 2026-10-23 : la production PI-SPI reste fermée — on se limite au bac à sable.** Les
stories qui ne servent que la production (le mTLS) sont réservées et décrites, pas implémentées.

Chaque manque a été **vérifié dans le code** le 2026-10-23, sur `origin/dev` (`3709b3b`).

---

## E1 · Fiches prêtes · 16 pts

| Story | Titre | Pts | État |
|---|---|---|---|
| STORY-674 | Les paiements envoyés entrent au relevé | 5 | ✅ Livrée le 2026-10-23 (fusionnée dans `dev`). |
| STORY-675 | Une seule clé d'unicité par paiement | 8 | ✅ Livrée le 2026-10-23, voie A (fusionnée dans `dev`). |
| STORY-286 | Console d'exploitation en lecture seule | 3 | ✅ Écrite et livrée le 2026-10-23. |

## E2 · PI-SPI en production · 13 pts

| Story | Titre | Pts | Constat dans le code |
|---|---|---|---|
| STORY-715 | mTLS sur la route de rappel et les appels | ≈5 | Les appels partent par un `fetch` sans agent TLS ; l'hôte à mTLS du simulateur refuse la connexion. ⛔ **Production fermée : non implémentée.** |
| STORY-716 | Santé du raccordement, par organisation | ≈3 | Un raccordement n'est éprouvé qu'à sa déclaration ; rien ne dit qu'il a cessé de marcher. |
| STORY-717 | Plusieurs participants dans un déploiement | ≈5 | `PI_SPI_API_BASE_URL` porte le code d'UN participant (`…/TGD999`). Arbitrage. |

## E3 · Preuve et règles de gestion · 14 pts

| Story | Titre | Pts | Constat dans le code |
|---|---|---|---|
| STORY-718 | Chaîne d'audit vérifiable par route | ≈3 | `JournalAudit.verifierChaineDeCreance` n'a aucun appelant HTTP. |
| STORY-719 | Jours fériés UEMOA, versionnés | ≈3 | `CalendrierOuvre.joursFeries` existe et vaut `[]` : le délai en heures ouvrées compte les fériés. |
| STORY-720 | Délai de validation par organisation | ≈3 | `encaissement.delaiValidationHeuresOuvrees` est un réglage du SERVICE. |
| STORY-721 | Frais imputés par moyen de paiement | ≈3 | `tarifDe` choisit par fournisseur « et non par méthode », même quand la notification nomme le moyen. |
| STORY-722 | Audit des notifications rejetées | ≈2 | STORY-286 COMPTE les refus hors de toute chaîne ; reste à décider ce qui en est opposable. Arbitrage. |

## Hors liste

| Story | Titre | Pts | Constat |
|---|---|---|---|
| STORY-723 | Un ordre exécuté se reconnaît après son doublon | ≈3 | ✅ Livrée le 2026-10-29 (`MNV-723`). La mesure du 2026-10-27 a corrigé la cause : le participant oublie les exécutions (< 27 h), pas les rejets. Constat d'origine — ⛔ Mesuré le 2026-10-23 : le participant ne garde qu'une tentative par `txId`, la dernière — après un doublon `DU03`, la liste ne montre plus l'exécution, et `nouvellesDeLaListe` lit `INCONNU`. |
