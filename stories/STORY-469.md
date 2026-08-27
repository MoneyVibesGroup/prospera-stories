# STORY-469 : Le BFR est calculé sur des montants HT, alors que créances clients et dettes fournisseurs sont TTC

Status: ready-for-dev

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 5 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-035** (hypothèses de prévisionnel paramétrables), 2026-08-27.
Relevé en lisant `bfr.ts` et en le confrontant au calcul de délai qu'un cabinet fait réellement.

---

## Le fait

`bfrNormatif` calcule :

```
creancesClients    = produits        × delaiClients      / 360
dettesFournisseurs = coutDesVentes   × delaiFournisseurs / 360
stocks             = coutDesVentes   × delaiStocks       / 360
```

`produits` et `coutDesVentes` sont des montants **hors taxes** — ce sont des soldes de comptes de
gestion. Or une **créance client** et une **dette fournisseur** au bilan sont **TTC** : elles incluent
la TVA. Le calcul du métier est `créances TTC / CA TTC × 360`, jamais HT.

Au taux togolais de **18 %** (taux unique, Art. 195 CGI), les deux plus gros postes du BFR sont donc
minorés d'environ 18 %. Sur le dossier de démonstration : créances **2 046 875** au lieu d'environ
**2 415 313**, dettes fournisseurs **2 237 917** au lieu d'environ **2 640 742**.

Les stocks, eux, sont bien HT — le calcul est juste pour ce poste, et c'est ce qui rend l'erreur
difficile à voir : deux tiers de la formule sont faux, un tiers est juste.

⚠️ Et le **crédit ou la dette de TVA** — un poste de BFR à part entière, souvent le plus volatil —
n'existe pas dans le modèle.

## Critères d'acceptation

- [ ] AC-1 — Une hypothèse `tauxTvaPct` (défaut : le taux du paquet fiscal du dossier) entre dans le
      jeu, ou le taux est lu directement du paquet — arbitrage PO ; l'assujettissement doit rester
      exprimable (une entreprise exonérée saisit 0).
- [ ] AC-2 — `creancesClients` et `dettesFournisseurs` sont calculées **TTC**.
- [ ] AC-3 — Le BFR porte une ligne `tvaNette` (crédit ou dette), ou la story **déclare** qu'elle est
      hors périmètre — pas de silence.
- [ ] AC-4 — Le cas **exonéré** (zone franche, régime TPU) est testé : à taux 0 le résultat est
      identique à celui d'aujourd'hui, ce qui donne le test de non-régression.
- [ ] AC-5 — `MODELE_PROJECTION_VERSION` incrémentée.

## Conséquences ailleurs

- Se combine avec **STORY-461** : le délai constaté doit être calculé de la **même** façon que le délai
  projeté, sinon la comparaison qu'offre l'écran est un rapprochement de deux conventions.
