# STORY-663 : L'échéance d'abonnement émet sa demande — la facturation récurrente

Status: review

**Épic :** EPIC-036 — Fournisseurs de paiement interchangeables et simultanés
**Service :** `paiement-service`
**Points :** 3 · **Sprint :** ⚠️ **NON SLOTTÉE** — phase A de `PLAN-PI-SPI-CAS-D-USAGE-2026-09-15`.
**Prérequis :** **STORY-277** (l'échéance est une créance), **STORY-661** (l'adresse du payeur),
**STORY-662** (l'émission pousse la demande)
**Origine :** inventaire du 2026-09-15 : `genererLEcheance` matérialise la créance de Money Vibes sur
le cabinet, puis s'arrête — le cabinet n'a rien avec quoi payer.

---

## Le fait

Une échéance d'abonnement est une créance de Money Vibes sur le cabinet (STORY-277). Elle naît,
fait avancer le contrat, programme le préavis et l'impayé… et **aucune demande n'est émise**. Le
cabinet n'a ni lien, ni demande dans son application ; la veille constatera un impayé que personne
n'a pu régler.

⚡⚡ **ÉMETTRE SOUS LE MODULE D'ORIGINE, SUR LA MÊME CRÉANCE.** L'émission ordinaire matérialise sous
`SAISIE_MANUELLE` : elle ferait naître une seconde dette pour la même période. L'émission accepte
désormais le module appelant, venu du code et jamais d'un corps de requête ; sous `ABONNEMENT` et la
référence de l'échéance, l'upsert retrouve la créance existante.

⚡⚡ **« PAS DE DEMANDE OUVERTE », ET NON « ÉCHÉANCE NOUVELLE ».** L'émission a sa propre transaction.
Si le service tombe entre les deux, rejouer l'échéance ne la dit plus nouvelle — une condition sur
`nouvelle` ne rattraperait jamais la demande perdue. Regarder les demandes de la créance rattrape
le trou, et n'en émet jamais deux.

⚡ **L'adresse du cabinet est un canal du contrat** (STORY-661) : donnée à l'engagement ou posée
ensuite, elle entre dans le payeur de chaque échéance future — et STORY-662 pousse alors la demande
dans l'application du cabinet.

## Critères d'acceptation

- [ ] AC-1 — Produire une échéance émet sa demande, sur **la même créance** (même module, même
      référence) : aucune seconde dette.
- [ ] AC-2 — Rejouer l'échéance **n'émet pas une seconde demande** tant qu'une demande de la créance
      est ouverte ; il **rattrape** une émission perdue.
- [ ] AC-3 — Un refus d'émettre (aucun tarif, bénéficiaire inconnu…) **ne défait pas l'échéance** :
      il est rendu dans la réponse, par son code.
- [ ] AC-4 — Le contrat porte une **adresse de paiement facultative** du cabinet, contrôlée comme
      celle d'un payeur, posée à l'engagement ou par `PUT /abonnements/:id/adresse-de-paiement` ;
      l'acte d'audit dit qu'elle a été posée, **jamais laquelle**.
- [ ] AC-5 — Une échéance d'un contrat qui porte l'adresse produit une créance dont le payeur la
      porte : la demande est poussée par STORY-662.
- [ ] AC-6 — Recette Docker : Money Vibes engage un abonnement pour un cabinet avec son adresse,
      produit l'échéance, et la demande arrive dans le bac à sable PI-SPI.

## Livraison (2026-09-15)

- [x] AC-1 à AC-6 — branche `MNV-663`, sur `dev` (662 fusionnée).
- `EmettreLaDemande.emettrePourLeModule(org, { auteur, moduleAppelant }, …)` ; le premier jet passait
  le module en argument positionnel, et **la garde de STORY-290 a rougi à raison** — elle lit
  `moduleAppelant: MODULE_SAISIE_MANUELLE` en toutes lettres. Corrigé côté code, garde intacte.
- Contrat : `adresseDePaiementDuPayeur` (engagement ou `PUT /abonnements/:id/adresse-de-paiement`),
  reportée dans le payeur des échéances futures ; acte `ABONNEMENT_ADRESSE_PAYEUR_POSEE` sans la valeur.
- 🏁 Recette Docker tout par l'API : décor PI-SPI de Money Vibes (compte vérifié par l'annuaire réel),
  abonnement du cabinet avec son adresse, échéance produite → **une seule créance `ABONNEMENT`**, demande
  émise dans la même réponse, poussée par le relais (`INITIEE`, `Envoyee`). ⚠️ Un second appel produit
  l'échéance **suivante** (le contrat a avancé) : le rejeu d'une même période n'est pas atteignable par
  l'API, il est prouvé par les tests unitaires (demande ouverte → rien ; demandes closes → rattrapage).
- Suites : 3 391 unitaires, 261 e2e, lint et compilation propres.

## Ce que la story ne fait pas

- **Générer les échéances automatiquement à leur date** : elles restent produites par la route
  existante ; l'automatisation est un travail d'échéancier distinct.
- **Réécrire le payeur d'une créance déjà matérialisée** : l'adresse vaut pour les échéances futures.

## Notes

- Voir [[STORY-277]], [[STORY-661]], [[STORY-662]].
