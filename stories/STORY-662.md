# STORY-662 : La demande part dans l'application du payeur — l'émission appelle enfin le fournisseur

Status: done

**Épic :** EPIC-036 — Fournisseurs de paiement interchangeables et simultanés
**Service :** `paiement-service`
**Points :** 5 · **Sprint :** ⚠️ **NON SLOTTÉE** — phase A de `PLAN-PI-SPI-CAS-D-USAGE-2026-09-15`.
**Prérequis :** **STORY-661** (l'adresse du payeur), **STORY-653** (le corps de la demande),
**STORY-608** (la file de sortie et son relais), **STORY-242** (le compte par défaut)
**Origine :** inventaire du 2026-09-15 : `initier` n'est appelée par aucun cas d'usage.

---

## Le fait

Une demande émise matérialise sa créance, fige ses tarifs et produit un lien. **Aucun fournisseur
n'est jamais appelé.** Pour PI-SPI, où il n'y a ni checkout ni retour de navigateur, cela veut dire
qu'aucun cabinet ne reçoit jamais la demande de Money Vibes dans son application.

La recette d'appel réel du 2026-09-15 a prouvé que l'adaptateur sait pousser une demande et que le
schéma l'accepte (visible `ENVOYE` sur le portail). Ce qui manque est le chemin qui y mène depuis
l'émission.

⚡⚡ **L'APPEL SORTANT NE VIT PAS DANS LA TRANSACTION.** Appeler le participant pendant l'écriture
de la demande lierait une transaction Mongo à un tiers qui peut répondre en plusieurs secondes, et un
`rollback` après une demande acceptée ferait exister chez le payeur une demande que le service ne
connaît pas. Le patron existe déjà (STORY-608) : l'initiation est **enfilée dans la transaction de
l'émission**, puis un relais l'exécute, avec reprises bornées.

⚡ **Ce qui déclenche la poussée est une DONNÉE, pas un choix de l'appelant.** Une demande part au
schéma quand trois choses sont vraies : un tarif `PI_SPI` a été figé, le payeur porte une adresse
de paiement (STORY-661), et l'organisation a un compte par défaut sur ce pays et cette devise, chez
le fournisseur du tarif. Sans adresse, la demande reste un lien — rien n'est refusé.

⛔⛔ **UN ÉCHEC DU FOURNISSEUR NE FERME PAS LA DEMANDE** (FR-P12). Elle reste ouverte, son lien
reste payable. Un échec passager est repris ; un refus définitif est **tracé** et visible, jamais
silencieux.

⚡ **Notre référence est l'identifiant de la demande.** C'est par `txId` que la notification signée
(STORY-660) retrouve la demande : l'envoyer sous une autre forme rendrait tout paiement accepté
orphelin.

## Critères d'acceptation

- [ ] AC-1 — À l'émission, une demande éligible (tarif `PI_SPI`, adresse du payeur, compte par défaut
      chez le même fournisseur) enfile son **initiation dans la même transaction**. Une demande non
      éligible n'enfile rien, et l'émission répond comme aujourd'hui.
- [ ] AC-2 — Un relais appelle `initier` du fournisseur **hors transaction**, avec `txId` = identifiant
      de la demande, le montant, le motif, la fin de validité et l'adresse du payeur.
- [ ] AC-3 — Succès : la demande passe à `Envoyee` et un acte d'audit consigne l'initiation (fournisseur,
      référence) — **jamais** l'adresse du payeur.
- [ ] AC-4 — Échec passager (`FOURNISSEUR_INJOIGNABLE`…) : reprise bornée. Refus (`A_REFUSE`,
      `APPEL_NON_CONFORME`, refus métier) ou reprises épuisées : échec **définitif tracé**, la demande
      reste ouverte.
- [ ] AC-5 — ⛔ Rejouer l'émission ou le relais **ne pousse pas deux fois** la même demande.
- [ ] AC-6 — Recette : dans Docker, une demande émise par l'API avec l'adresse réelle du payeur arrive
      dans le bac à sable PI-SPI.

## Livraison (2026-09-15)

- [x] AC-1 à AC-6 — branche `MNV-662`, empilée sur `MNV-661`.
- File `initiations_sortantes` (clef = demande), relais `RelaisDInitiation`, module `InitiationsModule`.
- ⛔⛔ **Deux défauts trouvés par la recette Docker, invisibles aux tests** :
  1. sans délai, cinq reprises tenaient en quinze secondes → délai doublé à chaque échec
     (30 s → 4 min, plafond 30 min), le tour ne relit que les lignes échues ;
  2. `LIEN_PUBLIC_BASE_URL` absente du compose : l'émission répondait 500 **après** avoir écrit
     la demande → ajoutée au compose racine et documentée.
- 🏁 Recette tout par l'API, dans Docker : marché TG ouvert, barème contractuel, routage, compte
  PI-SPI MONEY VIBES déclaré puis **vérifié par l'annuaire réel**, désigné par défaut ; demande de
  150 XOF émise avec l'adresse du payeur → 3 s plus tard ligne `INITIEE` (1 tentative), demande
  `Envoyee`, acte `DEMANDE_INITIEE` — **le schéma PI-SPI a accepté la demande**
  (`6aa97f28152bcee98aa71ca6`).
- Suites : 3 378 unitaires, 261 e2e, lint et compilation propres.

## Ce qui sera facile à rater

1. ⛔⛔ **Appeler le fournisseur dans `ecrire`.** Voir « Le fait ».
2. ⛔ **Envoyer une autre référence que l'identifiant de la demande** : la notification ne la
      retrouverait jamais.
3. ⚠️ **Passer la demande à `Echouee` sur un échec d'initiation** : `Echouee` exige une révocation
      prouvée pour remonter, et la demande deviendrait impayable pour une panne du tiers.
4. ⚠️ **Tracer l'adresse du payeur** dans l'acte d'initiation (STORY-661, AC-4).

## Ce que la story ne fait pas

- **Annuler la demande chez le schéma à la révocation** : exige la route d'annulation d'une demande
      de paiement (documentation à fournir), story suivante.
- **Consulter l'état d'une demande chez le schéma** : même raison.
- **L'échéance d'abonnement** : STORY-663.

## Notes

- Voir [[STORY-608]] (file de sortie), [[STORY-660]] (notifications), [[STORY-661]] (adresse).
