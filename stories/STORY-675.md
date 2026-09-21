# STORY-675 : Une seule clef d'unicité par paiement — webhook et consultation cessent de se contredire

Status: ready-for-dev

**Épic :** EPIC-036 — Fournisseurs de paiement interchangeables et simultanés
**Service :** `paiement-service`
**Points :** 8 · **Sprint :** ⚠️ **NON SLOTTÉE** — suite du `PLAN-PI-SPI-CAS-D-USAGE-2026-09-15`
**Prérequis :** **STORY-665** (la mesure des deux clefs), **STORY-670** (la consultation et sa
règle-donnée), **STORY-667** (l'instant dans la clef d'un point de vente), **STORY-669** (le pont
`txId` ↔ `end2endId`)
**Origine :** le remède **nommé et reporté** par [[STORY-665]] (AC-6), renforcé par [[STORY-664]],
et dont [[STORY-667]] puis [[STORY-669]] ont fourni les deux pièces qui manquaient.

⚠️ **UN ARBITRAGE EST À TRANCHER À L'OUVERTURE** (§ « Les trois voies »). La fiche porte la
recommandation et ses raisons ; elle ne la décide pas à la place du PO.

---

## Le fait

**Un même paiement du schéma reçoit aujourd'hui deux clefs d'unicité, selon le chemin par lequel on
l'apprend** ([[STORY-665]], AC-6, mesuré) :

| Chemin | Ce que l'événement porte | Clef produite |
| --- | --- | --- |
| Webhook `PAIEMENT_RECU` | `txId`, `montant`, parfois `evDate` — **jamais d'`end2endId`** | `PAIEMENT_RECU:<txId>` |
| Consultation ([[STORY-670]]) | `txId` **et** `end2endId` | `PAIEMENT_RECU:<end2endId>` |

Les deux barrières d'idempotence de [[STORY-257]] ne peuvent donc pas voir que c'est le même
argent : vus par les deux chemins, un versement se compterait **deux fois**. Ce qui l'empêche
aujourd'hui n'est pas une clef, c'est une **règle-donnée** : la consultation refuse de constater
quand un webhook peut atteindre le compte (`aUnSecretDeNotification`, [[STORY-670]]). Elle tient —
et elle coûte : un compte qui a un webhook **ne peut pas** rattraper par consultation un événement
que le participant n'a jamais livré.

⛔⛔ **ET `txId` SEUL N'EST PAS UNE CLEF DE PAIEMENT — mesuré deux fois.**

- Sur un **QR réutilisable**, tous les paiements d'une affiche portent le même `txId`
  ([[STORY-667]], AC-7 : deux scans réels, même identifiant). Remède livré : l'**instant** de
  l'événement entre dans la clef — pour un point de vente seulement.
- Sur un **QR dynamique scanné deux fois**, le défaut est le même et il est **toujours ouvert**
  (point ouvert n° 2 de [[STORY-667]]) : le second paiement est écarté comme un rejeu du premier —
  `204`, aucune erreur — alors que c'est un **trop-perçu** à constater ([[STORY-259]]).

⚡ **Les deux pièces qui manquaient à [[STORY-665]] existent depuis le 2026-09-21.**

1. **Le pont** : `GET /paiements-recus?txId=…` rend, pour un `txId`, **tous** ses paiements avec
   leur `end2endId` et leur `dateIrrevocabilite` ([[STORY-669]]). C'est la seule réponse du schéma
   qui relie les deux identifiants.
2. **L'instant est une propriété du PAIEMENT** : l'`evDate` d'un webhook de QR **est** la
   `dateIrrevocabilite` du paiement, **à la milliseconde** — mesuré sur le canal statique
   ([[STORY-667]]) **et** sur le dynamique ([[STORY-664]] : `22:54:40.344Z` dans le webhook comme dans
   `/paiements-recus`).
   ⚠️ Un webhook de **demande poussée** ne porte **pas** d'`evDate` ([[STORY-665]]).

## Les trois voies — à trancher à l'ouverture

| Voie | Clef canonique | Ce qu'elle coûte |
| --- | --- | --- |
| **A — `txId` + instant** *(recommandée)* | `PAIEMENT_RECU:<txId>:<instant>` quand l'événement porte un instant ; `PAIEMENT_RECU:<txId>` sinon (demande poussée : une demande, un paiement) | Aucun appel de plus. Les **deux** chemins savent la composer : le webhook a `txId` + `evDate`, la consultation et la relève ont `txId` + `dateIrrevocabilite`. Généralise le remède de 667 au lieu d'en ajouter un second. ⚠️ Repose sur l'égalité `evDate` = `dateIrrevocabilite`, mesurée sur deux canaux — à **garder** par un test sur les corps mesurés. |
| **B — `end2endId` partout** | `PAIEMENT_RECU:<end2endId>` | La clef la plus « vraie » (le schéma la garantit unique). Mais le webhook ne la porte pas : il faudrait **interroger le pont pendant la réception** — un appel sortant, authentifié, sous le raccordement de l'organisation, déclenché par une **route publique**. Une panne du participant ferait échouer des webhooks qu'il rejouerait… pendant sa panne. |
| **C — deux clefs et une table de correspondance** | inchangées | Rien ne se réécrit, mais la règle-donnée de 670 reste, et la vérité sur « est-ce le même paiement ? » vit dans une troisième collection que deux chemins doivent tenir à jour. |

## Critères d'acceptation

- [ ] AC-1 — **Un paiement, une clef, quel que soit le chemin.** Webhook, consultation
      ([[STORY-670]]) et — si la voie retenue le demande — relève dérivent la **même** référence
      d'événement pour le même paiement. La dérivation vit à **un** endroit du domaine ; les
      adaptateurs ne la recomposent pas chacun de leur côté.
- [ ] AC-2 — ⛔⛔ **Un QR dynamique payé DEUX fois produit DEUX encaissements** : le second est un
      **trop-perçu** constaté ([[STORY-259]]), plus un rejeu avalé. La re-livraison du **même**
      événement, elle, reste écartée.
- [ ] AC-3 — ⛔ **Vu par les deux chemins, un paiement se compte UNE fois** — prouvé par un test qui
      fait passer le même paiement par le webhook **puis** par la consultation (et l'inverse), avec
      des doubles qui **dédoublonnent par clef** (leçon de [[STORY-667]] : un double qui répond
      toujours « rangé » rendrait ce critère vert sans une ligne de production).
- [ ] AC-4 — ⚡ **La règle-donnée de [[STORY-670]] est levée — ou gardée, et la fiche dit
      pourquoi.** Si les clefs se rejoignent, la consultation peut rattraper un événement non
      livré sur un compte qui a un webhook. La lever est le bénéfice attendu de cette story ; la
      garder doit être une décision, pas un oubli.
- [ ] AC-5 — ⛔⛔ **RIEN NE SE RÉÉCRIT.** Le registre des encaissements et la boîte de réception sont
      **append-only** ([[STORY-257]]) : les clefs déjà rangées restent ce qu'elles sont. La story
      dit comment un paiement **déjà constaté sous l'ancienne clef** est reconnu quand il revient
      sous la nouvelle — sans quoi la mise en service elle-même compterait deux fois tout ce qui
      est rejoué ce jour-là.
- [ ] AC-6 — La clef d'un **point de vente** ([[STORY-667]]) devient un **cas particulier** de la
      règle commune, et non une seconde règle à côté : `attestationAuPointDeVente` se range dedans
      ou disparaît.
- [ ] AC-7 — ⛔ **Sans instant, on ne devine toujours pas** : l'heure de **réception** n'entre dans
      aucune clef (elle distinguerait aussi deux livraisons du même paiement) — la règle de
      [[STORY-667]], AC-4, vaut pour tous les canaux.
- [ ] AC-8 — Recette **réelle** : un QR dynamique scanné **deux fois** sur le bac à sable (il faut un
      téléphone) → deux encaissements, dont un trop-perçu ; puis le **même** paiement constaté par
      webhook et redemandé par consultation → **un** seul encaissement.

## Ce que cette story ne fait pas

- Elle **ne touche pas** FedaPay : ses événements portent leur propre identifiant.
- Elle **ne change pas** ce qu'un encaissement en attente d'affectation devient ([[STORY-271]]).
- Elle **ne relève rien** : le pont de [[STORY-669]] est une **lecture** qu'elle peut emprunter,
  pas une écriture qu'elle ajoute.

## Notes

- Voir [[STORY-665]] (AC-6, la mesure fondatrice), [[STORY-664]] (la référence traverse ; `evDate`
  sur le canal QR), [[STORY-667]] (l'instant dans la clef, et la preuve `evDate` =
  `dateIrrevocabilite`), [[STORY-669]] (le pont, et ses pièges : `meta.total`, `sort`, une erreur
  par réponse), [[STORY-670]] (la règle-donnée), [[STORY-257]] (les deux barrières), [[STORY-259]]
  (le trop-perçu).
- ⚠️ `categorie` distingue les canaux chez le schéma — `000` QR statique, `400` QR dynamique, `401`
  demande poussée, `733` envoi. Elle n'est **pas** dans le webhook : on ne peut pas s'en servir pour
  choisir une règle de clef à la réception.
