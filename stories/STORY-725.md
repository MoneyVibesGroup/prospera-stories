# STORY-725 : Le lien d'une échéance part au courriel de facturation du cabinet

Status: done

**Service :** `paiement-service` · **Points :** 2 · **Branche :** `MNV-725`
**Origine :** constat fait en préparant la recette STORY-631 (2026-11-07) — un blocage que sa fiche
ne listait pas.
**Arbitrage PO (2026-11-07) :** le courriel est un **champ sur le contrat**, posé par Money Vibes —
pas une lecture du courriel d'un utilisateur dans l'identité.

---

## Le fait

⛔ **Le lien d'une échéance d'abonnement ne partait vers personne.** STORY-663 donne au payeur d'une
échéance le nom projeté du cabinet et, s'il y en a une, son adresse de paiement PI-SPI. Ni courriel
ni téléphone. Or la remise du lien (`NotificationHttpAdapter.remettre`) exige l'un des deux : sans
eux, elle échoue en `SANS_DESTINATAIRE`, abandonnée dès la première tentative. Aucun test ne le
voyait, puisqu'aucun ne suivait une échéance jusqu'à Mailhog.

⚡ **Pourquoi un champ sur le contrat.** Le courriel de facturation suit la **facturation**, pas une
personne : le comptable qui change de poste ne doit pas faire changer l'adresse où arrivent les
factures. Le lire dans l'identité aurait aussi fait entrer une donnée personnelle de plus dans la
projection du paiement.

## Critères d'acceptation

- [x] AC-1 — Le payeur de chaque échéance FUTURE porte `courriel` : le lien a un destinataire. Le
      payeur est figé dans la créance, comme tout canal (STORY-290).
- [x] AC-2 — Le courriel se pose à l'engagement (`courrielDeFacturation`, facultatif) ou par
      `PUT /abonnements/:id/courriel-de-facturation` (droit `paiement:demande:emettre`, porte de la
      plateforme). Un contrat résilié ne le reçoit plus (404).
- [x] AC-3 — **Borné, pas validé** (règle de `preparerPayeur`) : vide, espace, absence d'arobase ou
      plus de 160 caractères sont refusés en `ABONNEMENT_INVALIDE`, **sans recopier la valeur**.
      `notification-service` reste seul juge de ce qu'il sait joindre.
- [x] AC-4 — L'acte `ABONNEMENT_COURRIEL_FACTURATION_POSE` dit **qu'il** est posé, jamais lequel
      (AD-5 ; le tamis du journal refuse une clé nommée `courriel`).
- [x] AC-5 — Les deux canaux coexistent : l'adresse pousse la demande, le courriel porte le lien.

## Ce que la livraison a appris

- ⚡ **Une faute de destinataire ne se voit qu'au bout de la chaîne.** Le contrat, la créance et la
  demande étaient justes ; seul le dernier maillon, la remise, savait que le payeur était
  injoignable, et il le consignait sur une ligne de file que personne ne lit. Ce trou n'a été
  trouvé qu'en écrivant une recette qui attend le courriel dans Mailhog.
- ⚠️ **La recette ne pose pas l'adresse de paiement en même temps.** Une demande poussée chez le
  fournisseur ne présente plus son lien (STORY-670) : la page publique d'AC-6 de 631 serait fermée.

## Preuves

`MNV-725` (`bfb8702`) : 4 335 unitaires verts ; e2e du paiement 27/27 suites (340 tests), lancées
en série. Recette STORY-631 AC-3/AC-4 sur la vraie pile.

⚡ **Même branche (`be631f2`)** : l'e2e de l'amorçage (`test/amorcage-money-vibes.e2e-spec.ts`)
était **rouge sur `origin/dev` depuis MNV-171** (4 tests) — le seed reclasse Money Vibes en
`plateforme` par `PATCH /admin/organizations/:id/vertical`, que le faux ne simulait pas. Corrigé
en tête de pile, à la demande du PO, pour que chaque branche soit verte d'elle-même.

## Notes

Voir [[STORY-663]] (le payeur de l'échéance), [[STORY-631]] (la recette qui l'a trouvée),
[[STORY-726]], [[STORY-648]] (même règle « borné, pas validé » pour les avis).
