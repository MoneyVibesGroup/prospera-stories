# STORY-664 : Le QR dynamique d'une demande — la référence qui rapproche toute seule

Status: in-progress

**Épic :** EPIC-036 — Fournisseurs de paiement interchangeables et simultanés
**Service :** `paiement-service`
**Points :** 3 · **Sprint :** ⚠️ **NON SLOTTÉE** — `PLAN-PI-SPI-CAS-D-USAGE-2026-09-15`, phase A
**Prérequis :** **STORY-655** (la charge utile EMV et son vecteur de test), **STORY-253** (le rendu
SVG), **STORY-665** (le tunnel, sans lequel AC-5 n'est pas mesurable)
**Origine :** STORY-655 a construit le QR interopérable et ne l'expose **nulle part** : elle a laissé
l'arbitrage de son canal ouvert, en le nommant. Le plan le tranche — ce QR se **présente**.

---

## Le fait

STORY-655 produit la charge utile EMV du schéma, vecteur de test reproduit à l'octet près, et
s'arrête là : aucune route ne la rend, parce qu'exposer un QR suppose tranché **qui** le demande,
**pour quel compte** et **dans quel canal**.

⚡ **Le canal est tranché, et ce n'est pas celui du paiement à distance.** STORY-600 a écarté le QR
de la demande **poussée** : là, la demande va dans l'application du payeur, il n'y a rien à scanner.
Ce QR-ci se **présente** — au comptoir, sur une facture — et il porte **notre référence de demande**
dans son champ de référence, avec le montant.

⛔⛔ **« LA RÉFÉRENCE QUI RAPPROCHE TOUTE SEULE » EST UNE HYPOTHÈSE, PAS UN ACQUIS.** Le rapprochement
automatique suppose que le `PAIEMENT_RECU` d'un paiement **par QR** porte la référence du QR. Or la
seule mesure que nous ayons (STORY-665, webhook réel) porte sur une demande **poussée**, où le
`txId` est le nôtre parce que **c'est nous qui l'avons posé**. Un paiement par QR n'est pas émis par
nous : rien ne prouve encore que notre référence traverse. Si elle ne traverse pas, l'encaissement
arrive **orphelin** (STORY-271) et le rapprochement reste manuel. **AC-5 mesure, il ne suppose pas.**

⛔ **L'adresse de paiement que ce QR publie est SCELLÉE.** C'est le seul chemin du service qui sorte
un SHID en clair : un QR est fait pour être lu par n'importe qui. Le scellé ne s'ouvre donc que par
la porte de l'adaptateur (STORY-243), laquelle **exige un compte vérifié** — et c'est juste : un QR
imprimé vers un compte que le schéma ne reconnaît pas est un code qu'on distribue pour rien.

## Critères d'acceptation

- [ ] AC-1 — Une route rend le QR interopérable **dynamique** d'une demande : sa charge utile EMV,
      son SVG, son canal, sa référence et son montant. Droit `paiement:demande:emettre`, `404` — jamais
      `403` — sur la demande d'une autre organisation, et jamais de cache (ce QR **est** un
      identifiant de paiement).
- [ ] AC-2 — L'adresse publiée sort du **coffre**, par la porte de l'adaptateur, et de nulle part
      ailleurs ; un compte **non vérifié** ne produit aucun QR, sans que cette règle soit réécrite ici.
- [ ] AC-3 — Le compte se résout par la **même règle** que la file d'initiation (défaut du couple
      pays × devise, fournisseur du tarif poussé, vérifié). La règle vit à **un** endroit : deux
      lectures du même choix seraient deux vérités sur l'endroit où l'argent arrive.
- [ ] AC-4 — Un fournisseur qui ne sait pas présenter ce QR n'en rend **aucun** : son absence de
      méthode le déclare, le refus est nommé, et **le QR du lien ne s'y substitue jamais** — deux
      objets, deux lecteurs, deux risques (leçon STORY-655).
- [ ] AC-5 — Une demande **terminée** (soldée, révoquée, expirée) ne rend aucun QR : imprimer un code
      pour une demande éteinte, c'est encaisser sans créance.
- [ ] AC-6 — Recette **réelle** : le QR d'une demande est scanné et payé dans l'application du bac à
      sable, et la **mesure est consignée** — le `PAIEMENT_RECU` porte-t-il notre référence, ou un
      identifiant du schéma ? De la réponse dépend si le rapprochement est automatique ou orphelin.

## Ce que cette story ne fait pas

- Elle **ne change pas** ce que rend `initier` : la présentation d'une demande poussée reste
  `DEMANDE_POUSSEE`. Les deux canaux coexistent, ils ne fusionnent pas.
- Elle **ne produit pas** de QR **statique** réutilisable — celui d'un point de vente est
  [[STORY-667]], et il suppose le raccordement par organisation ([[STORY-666]]).
- Elle **ne décide pas** qu'une demande déjà poussée ne peut pas être présentée (voir le point PO
  ci-dessous).

## Point à trancher (PO)

⚠️ **Une demande poussée ET présentée est payable deux fois** : le payeur peut régler la demande dans
son application *et* scanner le QR au comptoir. Le service ne l'interdit pas — il ne peut pas savoir
ce qui a été montré à qui, et la créance sait absorber un trop-perçu (STORY-259). Faut-il refuser le
QR d'une demande déjà poussée, au prix du cas légitime « le payeur n'a pas réglé dans son
application, je lui présente le code » ?

## Notes

- Voir [[STORY-655]] (la charge utile et l'arbitrage laissé ouvert), [[STORY-253]] (le QR du lien, à
  ne pas confondre), [[STORY-665]] (le tunnel et la mesure des clefs), [[STORY-271]] (les orphelins),
  [[STORY-667]] (le QR imprimé).
