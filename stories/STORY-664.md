# STORY-664 : Le QR dynamique d'une demande — la référence qui rapproche toute seule

Status: review

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
arrive **orphelin** (STORY-271) et le rapprochement reste manuel. **AC-6 mesure, il ne suppose pas.**

⛔ **L'adresse de paiement que ce QR publie est SCELLÉE.** C'est le seul chemin du service qui sorte
un SHID en clair : un QR est fait pour être lu par n'importe qui. Le scellé ne s'ouvre donc que par
la porte de l'adaptateur (STORY-243), laquelle **exige un compte vérifié** — et c'est juste : un QR
imprimé vers un compte que le schéma ne reconnaît pas est un code qu'on distribue pour rien.

## Critères d'acceptation

- [x] AC-1 — Une route rend le QR interopérable **dynamique** d'une demande : sa charge utile EMV,
      son SVG, son canal, sa référence et son montant. Droit `paiement:demande:emettre`, `404` — jamais
      `403` — sur la demande d'une autre organisation, et jamais de cache (ce QR **est** un
      identifiant de paiement).
- [x] AC-2 — L'adresse publiée sort du **coffre**, par la porte de l'adaptateur, et de nulle part
      ailleurs ; un compte **non vérifié** ne produit aucun QR, sans que cette règle soit réécrite ici.
- [x] AC-3 — Le compte se résout par la **même règle** que la file d'initiation (défaut du couple
      pays × devise, fournisseur du tarif poussé, vérifié). La règle vit à **un** endroit : deux
      lectures du même choix seraient deux vérités sur l'endroit où l'argent arrive.
- [x] AC-4 — Un fournisseur qui ne sait pas présenter ce QR n'en rend **aucun** : son absence de
      méthode le déclare, le refus est nommé, et **le QR du lien ne s'y substitue jamais** — deux
      objets, deux lecteurs, deux risques (leçon STORY-655).
- [x] AC-5 — Une demande **terminée** (soldée, révoquée, expirée) ne rend aucun QR : imprimer un code
      pour une demande éteinte, c'est encaisser sans créance.
- [x] AC-6 — Recette **réelle** : le QR d'une demande est scanné et payé dans l'application du bac à
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


## Livraison (2026-09-20)

- [x] AC-1 à AC-6 — branche `MNV-664`, sur `origin/dev` (665 fusionnée).
- `GET /v1/demandes/:id/qr-interoperable` → `{ chargeUtile, svg, canal, reference,
  montantMineur, devise }` ; port `construireUnQrPresente?` ; `CompteDeLaDemande`
  (la destination d'une demande, extraite de la file d'initiation) ; `svgDuQr`
  (le dessin, partagé avec le QR du lien).
- Suites : 3 473 unitaires, 274 e2e, lint 0.

### ⚡⚡ AC-6 — LA MESURE : NOTRE RÉFÉRENCE TRAVERSE

QR scanné et payé (300 XOF) dans l'application du bac à sable, sur une demande
**non poussée** — donc le QR était la seule voie de règlement, et la mesure est
sans ambiguïté. Corps reçu par le tunnel, verbatim :

```json
{"data":[{"evCode":"PAIEMENT_RECU","evDate":"2026-09-20T22:54:40.344Z",
"montant":300,"client":"thierno barry","alias":"6feb273d-…f36b",
"txId":"6ab05033ad1470ddc71dbe2b"}],"meta":{"total":1}}
```

⚡ **Le `txId` de l'événement est la référence que NOUS avons mise dans le QR** :
le schéma reprend le champ de référence du code comme identifiant de
transaction. Conséquence mesurée, pas supposée : clé `PAIEMENT_RECU:6ab05033…`,
encaissement `CONFIRME`, demande **`Soldee`**, **0 orphelin**. Le rapprochement
est automatique, et le titre de cette story tient.

⚡ **Et l'événement d'un paiement par QR porte `evDate`, là où celui d'une
demande poussée n'en porte pas** (mesure de STORY-665, même participant, même
`evCode`). L'attestation gagne donc un `survenuLe` sur ce canal et pas sur
l'autre : **le même type d'événement ne porte pas les mêmes champs selon le
canal**, et la lecture tolérante de STORY-660 (`dateOuIndefinie`) était le bon
choix. Aucun des deux canaux ne porte d'`end2endId`.

### ⛔⛔ Le défaut que la recette Docker a trouvé, et que 3 473 tests verts ne voyaient pas

**Le registre ne rend pas l'adaptateur : il rend son enveloppe d'observation**
(STORY-249), et celle-ci ne délègue que les méthodes qu'elle énumère. La
nouvelle méthode facultative du port était donc **absente à l'exécution**, et la
route répondait « `API_BUSINESS` ne présente pas de QR interopérable » — un refus
parfaitement formé, parfaitement faux. Aucun test unitaire ne pouvait le voir :
ils construisent l'adaptateur en direct, sans passer par le registre.

⚡ **Remède ET garde** : la délégation est ajoutée **sans `suivre`** — le critère
de l'observation n'est pas « est-ce que ça attend » mais « qu'apprend-on en LUI
parlant », et construire un QR ne parle à personne ; compter ce succès
repeindrait en vert un participant injoignable. Et
`fournisseur-observe.spec.ts` compare désormais les méthodes `nom?(...)` du
**port** à celles que l'enveloppe branche, avec sa contre-preuve : la prochaine
méthode facultative oubliée rougira avant Docker.

### Autres pièges payés

- ⛔ **Un `RefusMetier` de nature `REGLE_METIER` rend `422`, pas `404`.** La
  demande d'une autre organisation exigeait donc `refusHorsOrganisation()` — seule
  la nature `HORS_ORGANISATION` correspond au `404` qu'AD-16 demande. Mesuré par
  l'e2e de cette story.
- ⚠️ **L'espace de noms SVG est une URL**, et une garde « aucune ressource
  externe » qui interdit `http` rougit sur `xmlns` : ce qu'il faut interdire est
  ce qui **ferait sortir un octet** (`<image`, `src=`), pas toute occurrence.
- ⚡ Les trois e2e qui construisent `DemandesController` reçoivent un double du
  QR interopérable **qui REFUSE** : un test qui s'en servirait sans le dire échoue
  au lieu de passer sur un silence.

## Ce qui reste ouvert

- Le point PO ci-dessus (une demande poussée **et** présentée est payable deux
  fois) n'est pas tranché : le service ne l'interdit pas.
- ⚡ **La mesure renforce le remède nommé par [[STORY-665]]** : sur les deux
  canaux, le webhook clé sur `txId` et n'apporte **jamais** d'`end2endId`.
  Unifier la dérivation sur `txId` est donc encore plus défendable — mais un
  paiement **spontané** ([[STORY-667]]) n'a pas de demande, donc pas de `txId`
  à nous : l'arbitrage reste à faire, dans une story à part (id ≥ 673, 671 et 672
  étant pris par le chantier CIMA).

## Notes

- Voir [[STORY-655]] (la charge utile et l'arbitrage laissé ouvert), [[STORY-253]] (le QR du lien, à
  ne pas confondre), [[STORY-665]] (le tunnel et la mesure des clefs), [[STORY-271]] (les orphelins),
  [[STORY-667]] (le QR imprimé).
