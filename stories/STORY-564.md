# STORY-564 : Le barème IRPP entre au paquet fiscal Togo — aujourd'hui il est cité comme « présent dans le CGI » et rien ne le calcule

Status: ready-for-dev

**Épic :** EPIC-029 — Familles de calcul et modificateurs
**Service :** `fiscal-service` (`:3012`) · **paquet :** `paquet-fiscal-togo-2026`
**Points :** 8 · **Sprint :** S30
**Origine :** **décision PO du 2026-08-28** — le dirigeant déclare et paie ses propres impôts.
**Prérequis :** **STORY-563** (le redevable personne physique)
**Réf. :** **FR-F80** (régime non déterminable ⇒ obligation bloquée) · **NFR-F04** (aucun taux
codé en dur) · `referentiels/corpus-complet-cgi-lpf-togo.json` (1 185 articles)

---

## Le fait, mesuré dans le paquet

`paquet-fiscal-togo-2026.json` porte `tva`, `is`, `minimumForfaitairePerception`,
`acomptesProvisionnels`, `resultatFiscal`, `regimesImposition`, `factureNormalisee`. **L'IRPP n'y
est pas un calcul** — il est **cité dans une liste** :

```json
"autresImpotsTaxes": {
  "presentsDansCGI": [
    "IRPP (bareme progressif, tranche haute 30%)",
    "TVM (taxe sur les vehicules a moteur)",
    ...
  ]
}
```

⇒ **Une mention, pas un barème.** Aucune tranche, aucun taux, aucun abattement, aucune règle de
quotient. Et le champ `aFaire` du paquet **ne le liste même pas** parmi les manques identifiés :
il cite les taux TPU, les seuils de régime, TAF/TCA/TVM, la CNSS — **pas l'IRPP**.

⚡ **La matière brute existe, mais pas sous forme calculable.** Le corpus CGI du dépôt porte
**1 185 articles** en texte ; l'IRPP y est cité par les articles **63, 74, 113 et 129**, et
l'article **447** est le seul à croiser « tranches » et « personne physique ». C'est du texte de
loi, pas une table de barème.

⛔ **Conséquence immédiate, et elle est correcte :** sans barème au paquet, `FR-F80` marque
l'obligation du dirigeant **bloquée**, avec l'indication de ce qui manque. Le produit ne se trompe
pas — **il ne peut simplement rien faire.**

## ⚠️ Une contradiction à trancher avant de saisir

Le paquet dit **« tranche haute 30 % »**. Le travail de référentiel fiscal mené sur le CGI/LPF OTR
avait retenu **35 %**.

⇒ **Les deux ne peuvent pas être vrais.** Cette story ne tranche pas de mémoire : elle **relève le
barème dans les articles du corpus**, cite l'article et le millésime, et corrige la mention si elle
est fausse. ⚠️ Une source normative crédible mais non vérifiée est plus dangereuse qu'une source
absente — c'est la leçon déjà payée sur le plan comptable du corpus pédagogique.

## Périmètre

**Inclus**

- Le **barème IRPP** au paquet, comme donnée : tranches, taux, et tout ce que le CGI y attache —
  abattements, minimum, quotient familial s'il existe, plafonds.
- **Chaque élément cite son article** et le millésime du texte. Un taux sans référence d'article
  n'entre pas : c'est la règle qui rend le calcul opposable et refaisable.
- Les **revenus catégoriels** nécessaires au dirigeant salarié : traitements et salaires d'abord.
  ⚠️ *« Pour un début »*, dit le PO — les revenus fonciers, de capitaux mobiliers et les BIC/BNC
  sont hors périmètre, et le paquet le **déclare** pour que `FR-F80` bloque proprement le reste.
- Les **retenues à la source** déjà opérées par l'entreprise sur la rémunération du dirigeant,
  imputées sur son IRPP — c'est le lien entre les deux redevables, et il évite une double
  imposition à l'écran.
- Le calcul est une **famille de calcul** au sens d'AD-2, aiguillée par le type de redevable :
  ⛔ **aucun chemin de code spécifique « dirigeant ».**

**Hors périmètre**

- La **CNSS**. Différée par l'arbitrage PO du 2026-08-15 (*« IRPP oui, CNSS différée »*), et le
  paquet la liste toujours comme à fournir. Non rouvert ici.
- Les autres impôts de la personne physique — TVM, taxe foncière, taxe d'habitation. Le mécanisme
  les accueillera ; les saisir est un autre travail de sourcing.
- Le paiement : **STORY-565**. L'explication et l'optimisation : **STORY-566**.

## Critères d'acceptation

1. Le barème est **entièrement en donnée** : aucun taux, aucune tranche, aucun seuil dans le code
   (NFR-F04). Témoin : changer une tranche au paquet change le résultat, sans déploiement.
2. Chaque élément du barème porte **son article de référence et le millésime**. Un élément sans
   référence fait **échouer la validation du paquet**, au packaging.
3. La contradiction 30 % / 35 % est **tranchée, sourcée et écrite** — la mention
   `autresImpotsTaxes` est corrigée ou supprimée, pas laissée à côté du barème réel.
4. Un revenu catégoriel non couvert rend l'obligation **bloquée** avec le motif exact (`FR-F80`),
   jamais un calcul partiel présenté comme complet.
5. Les retenues à la source opérées par l'entreprise sont imputées, et **traçables jusqu'à la
   ligne de rémunération** qui les a produites.
6. Le calcul est reproductible : même paquet, mêmes entrées, même résultat, et le millésime du
   paquet est publié avec le montant.
7. `aFaire` du paquet est mis à jour — l'IRPP en sort, et ce qui reste manquant y entre nommément.

## Notes

- ⚡ **C'est un travail de sourcing, pas de développement.** Le moteur de familles de calcul
  (AD-2) sait déjà appliquer un barème progressif ; ce qui manque, c'est la **table**. Les 8 points
  sont surtout de la lecture d'articles et de la vérification.
- ⚠️ **Le champ `aFaire` n'avait pas vu ce trou** — il liste cinq manques et pas celui-là. Un
  registre de manques incomplet est plus trompeur qu'une absence de registre : il donne
  l'impression que le reste est couvert.
- ⛔ **Faire valider par un fiscaliste togolais avant figement.** C'est déjà ce que `aFaire`
  demande pour l'ensemble du paquet, et cette table servira à calculer ce qu'une personne
  physique doit à l'État.
