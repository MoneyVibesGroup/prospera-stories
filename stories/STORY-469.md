# STORY-469 : Le BFR est calculé sur des montants HT, alors que créances clients et dettes fournisseurs sont TTC

Status: in_progress

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

## Décisions de cadrage (2026-09-07)

- **D-469-1 — AC-1 tranché : le taux vient du PAQUET FISCAL, une hypothèse OPTIONNELLE le
  surcharge** (arbitrage user du 2026-09-07). Le paquet publie déjà `tva.tauxStandard` (0,18,
  Art. 195 CGI) pour SYSCOHADA révisé, et `tva.exoneration: true` pour la zone franche togolaise
  — l'invariant du projet est que **les taux viennent du référentiel, jamais du code**, comme
  l'IS et le minimum forfaitaire. Mais l'**assujettissement est une propriété de l'ENTREPRISE**,
  pas du référentiel : une société non assujettie ou au régime TPU sous SYSCOHADA doit pouvoir
  saisir **0**. D'où la surcharge, **optionnelle** — aucun jeu existant n'est refusé de plus.
- **D-469-2 — deux référentiels n'ont AUCUN paquet fiscal** (`cima-assurances`, `sfd-bceao`) :
  le taux y est **inconnu**, et le modèle applique **0** — c'est-à-dire le comportement
  d'aujourd'hui, en HT. ⛔ **Mais il le DÉCLARE** : la réponse publie le taux appliqué et d'où il
  vient. Un `0` silencieux serait indiscernable d'une exonération constatée.
- **D-469-3 — l'exonération publiée vaut ZÉRO, pas « inconnu ».** `tva.exoneration: true` de la
  zone franche est une **mesure**, pas une absence : le modèle l'applique et le dit. Confondre
  les deux ferait passer une exonération légale pour un trou de données.
- **D-469-4 — AC-3 tranché : `tvaNette` est HORS PÉRIMÈTRE, et déclarée** (arbitrage user).
  La TVA nette au bilan est ce qui **reste dû à la clôture** : elle dépend de la **périodicité de
  déclaration**, que le paquet fiscal **ne publie pas** — c'est le même angle mort que
  STORY-478 relève pour son AC-3. La chiffrer supposerait un calendrier **inventé**, sur le poste
  de BFR que la fiche décrit elle-même comme « souvent le plus volatil ». ⛔ **Le flux de TVA
  appartient à STORY-478** (8 points), qui écrit noir sur blanc : « ⚠️ Distinct de STORY-469, qui
  porte sur le MONTANT du BFR ; ici c'est l'ABSENCE D'UNE LIGNE ». Le hors-périmètre est **nommé
  dans le code et publié dans la réponse**, jamais tu.
- **D-469-5 — seuls les CRÉANCES et les DETTES passent en TTC, jamais les stocks.** Un stock est
  valorisé au **coût d'acquisition hors taxes récupérables** : la TVA déductible n'y entre pas.
  C'est ce qui rend l'erreur difficile à voir — deux tiers de la formule sont faux, un tiers est
  juste — et c'est aussi ce qui interdit de « corriger » les trois d'un coup.
- **D-469-6 — `delaisConstates` suit la MÊME convention, sinon l'écran rapproche deux
  conventions.** Un délai constaté vaut `créances RÉELLES du bilan (TTC) / assiette × 360` : si
  l'assiette reste HT alors que le BFR projeté devient TTC, la confrontation que STORY-461 offre
  cesse d'être une identité. Les deux bougent ensemble ou aucun ne bouge.
- **D-469-7 — le taux effectif est résolu par une unité PURE et PARTAGÉE**, jamais recopiée dans
  chaque moteur. Le mensuel dérive ses agrégats de N+1 lui-même : deux résolutions divergentes
  casseraient `ecartArticulation` — le piège de STORY-460, de STORY-467 et de STORY-468.
- **D-469-8 — AC-4 est la garde de non-régression, et elle est structurelle** : à taux **0**, la
  formule TTC **est** la formule HT. C'est ce qui rend le cas exonéré et le cas « paquet absent »
  identiques au chiffre près à ce que le modèle rendait avant.

### Hors périmètre (explicite)

- **AC-3 / `tvaNette`** au BFR (D-469-4) — faute de périodicité publiée. Renvoyé à STORY-478.
- Le **flux** de TVA du plan de trésorerie mensuel : c'est STORY-478.
- Les **taux réduits** et les opérations à taux multiples : le paquet publie `type: "taux unique"`.
- La **TVA déductible sur immobilisations** : elle ne touche pas le BFR d'exploitation.
