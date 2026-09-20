# STORY-670 : Consulter une demande chez le schéma — le paiement se constate sans webhook

Status: done

**Épic :** EPIC-036 — Fournisseurs de paiement interchangeables et simultanés
**Service :** `paiement-service`
**Points :** 5 · **Sprint :** ⚠️ **NON SLOTTÉE** — ajoutée au `PLAN-PI-SPI-CAS-D-USAGE-2026-09-15`
après réception de la documentation « Consulter une demande » (2026-09-15).
**Prérequis :** **STORY-662** (la demande est poussée), **STORY-660** (l'attestation et la boîte de
réception)
**Origine :** sans tunnel public, aucun webhook n'arrive : un paiement accepté dans l'application du
payeur reste invisible pour le service.

---

## Le fait

`GET /demandes-paiements/{txId}` (portée `demande_paiement.read`) rend l'état d'une demande chez le
schéma : `INITIE`, `ENVOYE`, `IRREVOCABLE`, `REJETE` (avec `statutRaison`), `ANNULE`. Mesuré le
2026-09-15 sur le simulateur : la demande d'octobre payée depuis l'application du payeur rend
`IRREVOCABLE`, et son `end2endId` reste celui de la demande.

⚡⚡ **DÉCISION PO DU 2026-09-15 — « OUI ET NON ».** Une consultation, obtenue avec **notre** jeton
sur TLS, **vaut preuve de paiement** tant qu'aucun webhook n'est possible — c'est ce qui rend la
chaîne testable maintenant. Le webhook par tunnel (STORY-665) reste le chemin nominal.

⛔⛔ **LA RÈGLE QUI ÉVITE LE DOUBLE COMPTAGE EST UNE DONNÉE, PAS UN PARI SUR UNE CLEF.** Rien ne
prouve aujourd'hui que l'`end2endId` d'une demande payée est celui que porterait le webhook du
paiement : la liste des transactions de nos comptes reste vide. Donc :

- un compte **sans** secret de notification (aucun webhook ne peut l'atteindre) : la consultation
  **constate** l'encaissement ;
- un compte **avec** secret : la consultation **ne constate rien**, elle rapporte l'état — le webhook
  fait foi.

Dans le premier cas, l'attestation passe par la **même** boîte de réception et la **même** barrière
d'idempotence qu'un webhook (AD-4), sous la clef que le webhook utiliserait ; la pièce rangée est le
corps brut de la réponse, marqué `CONSULTATION`.

⚠️ **Une demande `ENVOYE` ne s'annule pas chez le schéma** (documentation) : l'annulation n'existe que
pour `INITIE`. Une révocation côté Prospera ne retire pas la demande de l'application du payeur.

## Critères d'acceptation

- [ ] AC-1 — Le port gagne une méthode **facultative et asynchrone** de consultation, qui rend des
      **attestations** (jamais un champ d'état) et la pièce brute ; la garde du port en tient compte.
- [ ] AC-2 — `IRREVOCABLE` → attestation `PAIEMENT_RECU` (montant, `end2endId`, `txId`) ;
      `REJETE` → `RTP_REJETE` ; `ANNULE` rangée sans effet ; `INITIE`/`ENVOYE` → rien.
- [ ] AC-3 — Compte **sans** secret : l'attestation est constatée par le chemin des notifications
      (encaissement, solde, transition de la demande) ; rejouer la consultation ne constate rien de plus.
- [ ] AC-4 — Compte **avec** secret : aucune écriture d'argent, l'état est seulement rapporté.
- [ ] AC-5 — Une veille consulte les demandes poussées, à intervalle croissant, et s'arrête sur un état
      final ; `POST /demandes/:id/consultation` la force pour une demande.
- [ ] AC-6 — Recette Docker : la demande d'abonnement payée dans le bac à sable est consultée, son
      encaissement constaté, la demande et l'échéance soldées.

## Livraison (2026-09-15)

- [x] AC-1 à AC-6 — branche `MNV-670`, sur `dev` (663 fusionnée).
- Port `consulterUneDemande?` → `{ attestations, corpsBrut, situation }` ; client
  `consulterUneDemandeDePaiement` ; `attesterUneConsultationApiBusiness` (même clef que le webhook,
  prouvé par une recette) ; `RecevoirLaNotification.constaterUneConsultation` ; cas d'usage
  `ConsulterUneDemande` ; veille `VeilleDesDemandesPoussees` ; `POST /v1/demandes/:id/consultation`.
- ⛔ **La garde de STORY-243 a rougi à raison** sur le premier jet, qui relisait le champ scellé du
  secret depuis le cas d'usage : la question vit dans le coffre (`aUnSecretDeNotification`).
- 🏁 Recette Docker sur la demande d'abonnement **payée** dans le bac à sable : `IRREVOCABLE`,
  1 encaissement constaté, demande `Soldee` ; rejeu → 0 ; demande `ENVOYE` → rien, consultation
  reprogrammée ; demande non poussée → `DEMANDE_NON_POUSSEE`.
- Suites : 3 415 unitaires, 261 e2e, lint et compilation propres.

## Notes

- Voir [[STORY-660]], [[STORY-662]], [[STORY-663]], [[STORY-665]].
