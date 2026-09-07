# STORY-469 : Le BFR est calculé sur des montants HT, alors que créances clients et dettes fournisseurs sont TTC

Status: review

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

- [x] AC-1 — Une hypothèse `tauxTvaPct` (défaut : le taux du paquet fiscal du dossier) entre dans le
      jeu, ou le taux est lu directement du paquet — arbitrage PO ; l'assujettissement doit rester
      exprimable (une entreprise exonérée saisit 0).
- [x] AC-2 — `creancesClients` et `dettesFournisseurs` sont calculées **TTC**.
- [x] AC-3 — Le BFR porte une ligne `tvaNette` (crédit ou dette), ou la story **déclare** qu'elle est
      hors périmètre — pas de silence.
- [x] AC-4 — Le cas **exonéré** (zone franche, régime TPU) est testé : à taux 0 le résultat est
      identique à celui d'aujourd'hui, ce qui donne le test de non-régression.
- [x] AC-5 — `MODELE_PROJECTION_VERSION` incrémentée.

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

---

## Progress Tracking

**Statut : review** (dev + validation + vérification docker faits ; revues à suivre).
⚠️ **AC-3 est livré comme un HORS PÉRIMÈTRE DÉCLARÉ** (D-469-4), pas comme une ligne de calcul :
c'est l'une des deux branches que l'AC offre explicitement.

### Livré

| Fichier | Ce qui change |
|---|---|
| `projection/tva.ts` **(neuf)** | unité **pure** : `tvaAppliquee` (saisie ▸ paquet ▸ zéro) et `enTtc` |
| `projection/impot.ts` | `resoudreTva` — le taux du paquet, résolu **indépendamment** de l'impôt |
| `projection/bfr.ts` | créances et dettes **TTC**, stocks **HT**, et `delaisConstates` sur la même convention |
| `hypotheses.schema.ts` + son DTO | `tauxTvaPct` **facultatif**, borné, avec ses bornes **publiées** |
| les deux moteurs | résolvent le taux **une fois**, par la **même** unité |
| `projection.types.ts` + DTO | `BfrNormatif.tva` publié, `MODELE_PROJECTION_VERSION` → **1.6.0** |

### Portes de qualité

| Porte | Résultat |
|---|---|
| Lint | 0 erreur, 0 avertissement |
| Build | `nest build` OK |
| Unitaires + couverture | **2 190 tests verts** — 98,85 % lignes / 94,48 % branches. `tva.ts` et `bfr.ts` à **100 %** sur les quatre axes |
| E2E | **649 tests verts** (`--runInBand`) |

### Table de mutations — 13 mutations, 13 rouges

| # | Mutation | Verdict |
|---|---|---|
| M1 | les créances restent hors taxes (**le défaut de la story**) | ROUGE |
| M2 | les dettes restent hors taxes | ROUGE |
| M3 | les **stocks** passent en TTC eux aussi (D-469-5) | ROUGE |
| M4 | `delaisConstates` garde une assiette HT (D-469-6) | ROUGE |
| M5 | la **saisie à 0** ne l'emporte plus sur le paquet | ROUGE |
| M6 | un taux inconnu vaut 18 % au lieu de 0 | ROUGE |
| M7 | l'**exonération est lue APRÈS le taux** | ROUGE |
| M8 | `exoneration` lu en vérité plutôt qu'en `=== true` | ROUGE |
| M9 | la TVA est logée dans `parametres` (inaccessible si `applicable: false`) | ROUGE |
| M10 | le moteur annuel ne passe plus le taux au BFR des exercices | ROUGE |
| M11 | le moteur annuel ne passe plus le taux au BFR de la base | ROUGE |
| M12 | le moteur mensuel résout un taux différent | ROUGE |
| M13 | le **câblage** : la réponse HTTP ne porte plus le taux saisi | ROUGE |

⚠️ **M7 et M8 gardent un piège RÉEL du paquet de la zone franche** : il porte
`tva.exoneration: true` **et** `tva.tauxDroitCommunRappel: 0.18` — un **rappel** du droit commun.
Lire le taux d'abord ferait facturer 18 % de TVA à une entreprise franche, sur la foi d'un champ
dont le nom dit qu'il est un rappel.

### Vérification docker (stack réelle, données réelles)

| Mesure | Résultat |
|---|---|
| ⚡⚡ **AC-1 — le référentiel RÉEL publie le taux** | `fiscalite.tauxTvaPct: 18`, `motifTva: TAUX_PUBLIE`, lu de `tva.tauxStandard` du paquet SYSCOHADA révisé. Aucun taux du code. |
| ⚡⚡ **AC-2 — les chiffres de la fiche, confirmés À L'UNITÉ** | Créances **2 046 875 → 2 415 313**. La fiche annonçait « 2 046 875 au lieu d'environ **2 415 313** » : le montant tombe **exactement** dessus. Dettes **1 910 417 → 2 254 292**, soit **+18,0 %** sur les deux postes. |
| ⛔ **D-469-5** | Stocks **955 208** dans les deux cas : le poste qui était déjà juste ne bouge **pas d'une unité**. |
| ⛔ **AC-4 — la non-régression, mesurée** | Le jeu à taux **0** rend `créances 2 046 875` — le montant d'**avant la story**, au chiffre près. |
| AC-1 | Une **saisie à 0** l'emporte sur les 18 % publiés (`source: HYPOTHESE_SAISIE`) : l'assujettissement reste exprimable. |
| ⚡ **D-469-6** | Délai clients **constaté** : **44 → 37** jours entre le jeu exonéré et le jeu assujetti. Les deux lectures suivent la même convention que le BFR projeté — la confrontation de STORY-461 reste une identité. |
| D-469-7 | Plan mensuel : `ecartArticulation = 0`, et le mensuel voit le **même** BFR (2 415 313, taux 18). |
| Équilibre | `ecart = 0` sur les trois exercices, et chacun porte le taux appliqué. |
| **Champ facultatif** | Sans surcharge, le champ n'est **pas persisté** ; avec, il l'est en `number`. **31 jeux** antérieurs n'en portent pas et se projettent au taux du référentiel — **aucun refus**. |
| AC-5 | `modeleVersion: 1.6.0`. |

⚠️ **Un écart avec l'estimation de la fiche, et il s'explique** : elle annonçait des dettes
fournisseurs à « environ 2 640 742 », la mesure donne **2 254 292**. L'estimation supposait un
**taux de marge** différent du 30 % de mon jeu — le coût des ventes, assiette des dettes, en
dépend directement. Les créances, elles, ne dépendent que des produits et du délai : elles
tombent au franc près.
