# STORY-665 : Le secret de notification après la déclaration, et deux secrets pendant la bascule

Status: in-progress

**Épic :** EPIC-036 — Fournisseurs de paiement interchangeables et simultanés
**Service :** `paiement-service`
**Points :** 5 · **Sprint :** ⚠️ **NON SLOTTÉE** — `PLAN-PI-SPI-CAS-D-USAGE-2026-09-15`, phase A
**Prérequis :** **STORY-660** (les notifications signées PI-SPI), **STORY-256** (la clef de
vérification et le second scellé)
**Origine :** défaut EXISTANT relevé à la clôture de STORY-660 — **aucune route ne pose la clef de
vérification d'un compte déjà déclaré**, alors qu'aucun fournisseur ne la rend avant.

---

## Le fait

La clef avec laquelle un fournisseur signe ses notifications n'entre dans le service qu'**à la
déclaration du compte** (`POST /v1/comptes-encaissement`, champ `secretNotification`). Or :

- **PI-SPI** ne rend le secret qu'à la **création du webhook**, et l'URL du webhook contient
  l'identifiant du compte — donc elle n'existe qu'**après** la déclaration ;
- **FedaPay** ne le rend qu'au tableau de bord, quand l'organisation y colle cette même URL.

⛔⛔ **LE CHEMIN NOMINAL ÉTAIT INFAISABLE, ET AUCUN TEST NE POUVAIT LE DIRE.** Un compte déclaré
sans clef encaisse — mais aucune notification ne le fera jamais progresser, et le refus qui le dit
(`COMPTE_SANS_CLEF_NOTIFICATION`) arrive chez le fournisseur, pas chez l'organisation. Le
contournement de STORY-660 (déclarer un webhook sur une URL provisoire pour obtenir le secret, puis
corriger l'URL) n'est pas un chemin : c'est une manœuvre qu'aucune organisation ne devinera.

⚡ **ET LE SECRET DU SCHÉMA A UNE ÉCHÉANCE.** La documentation PI-SPI donne au secret d'un webhook
une date d'expiration (`dateExpirationSecret` dans le guide, `dateExpiration` dans la spécification —
elle se contredit) et le renouvellement impose d'**accepter les deux** jusqu'au terme de l'ancien.
Un service qui n'accepte qu'une clef à la fois perd toutes les notifications émises pendant la
bascule — c'est-à-dire des encaissements réels, le jour même de la rotation.

⛔ **« Retirer l'ancienne clef au premier succès de la nouvelle » ne se termine jamais** (arbitrage
repris de `notification-service`) : tant que le fournisseur ne signe pas avec la nouvelle, aucun
succès n'arrive, et la bascule reste ouverte indéfiniment. Ce qui ferme une bascule est une
**durée**, jamais un événement qu'on attend.

## Critères d'acceptation

- [ ] AC-1 — Une route dépose la clef de vérification d'un compte **déjà déclaré** (droit
      `paiement:compte:administrer`, gate d'AD-16, cloisonnement par l'organisation du jeton). La
      clef entre au coffre sous le lien de notification, n'est **restituée par aucun chemin**, et le
      dépôt est consigné dans la chaîne d'audit du compte — le **fait**, jamais la valeur.
- [ ] AC-2 — Déposer une clef sur un compte qui en porte déjà une ouvre une **bascule** : l'ancienne
      reste acceptée jusqu'à `min(son échéance déclarée, instant de bascule + plafond)`, la nouvelle
      l'est immédiatement. Une notification signée de l'**une ou de l'autre** est vérifiée, rangée et
      constatée une seule fois. L'échéance déclarée ne peut que **retrancher**.
- [ ] AC-3 — Passé ce terme, l'ancienne cesse d'être acceptée **par lecture** — comparaison à
      l'instant, aucune tâche planifiée, aucune écriture différée. Un **premier** dépôt (compte sans
      clef) n'ouvre aucune bascule.
- [ ] AC-4 — L'organisation lit **l'adresse à déclarer chez son fournisseur** et l'état de sa clef
      (présence, échéance, bascule en cours) — jamais la clef. Sans cette adresse, AC-1 n'a pas
      d'objet : l'URL porte l'identifiant du compte, que seule cette API connaît.
- [ ] AC-5 — Recette **réelle** : tunnel public, webhook créé chez le schéma sur l'adresse du compte,
      secret déposé par AC-1, paiement du bac à sable → notification signée **reçue**, vérifiée,
      encaissement constaté, demande soldée.
- [ ] AC-6 — **Mesure consignée** : le webhook et la consultation (STORY-670) d'une **même** demande
      désignent-ils le même paiement ? La réponse est écrite ici. Elle conditionne la levée — dans
      une story ultérieure, jamais dans celle-ci — de la règle-donnée de STORY-670.

## Ce que cette story ne fait pas

- Elle **ne crée pas** le webhook chez le fournisseur. Le raccordement d'une organisation à PI-SPI
  (identifiants client, clé d'API, déclaration du webhook) est [[STORY-666]] ; ici, le webhook est
  créé à la main pendant la recette, comme le SHID l'a été en STORY-661.
- Elle **ne retire pas** une clef. Un compte dont la clef part cesse d'être notifiable, ce qui est le
  contraire du but.
- Elle **ne change pas** la règle de STORY-670 (un compte avec clef ne se constate que par webhook).
  AC-6 la mesure, il ne la tranche pas.

## Notes

- Voir [[STORY-660]], [[STORY-670]], [[STORY-256]], [[STORY-243]], [[STORY-666]].
