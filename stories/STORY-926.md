# STORY-926 : Chaque ligne de balance porte sa provenance, et les lignes sources d'un compte de cahiers se lisent

Status: done

**Complexité :** petite à moyenne (un service, un champ servi sur la ligne, une route de lecture, un marqueur écrit)

**Épic :** EPIC-159 (le cabinet sur le moteur), dette d'intégration du front du cabinet
**Service :** `balance-service`
**Plage :** groupe A, n° 7 du lot 3 (`coordination/PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §2). Source :
`tickets/TICKET-BACKEND-ligne-de-balance-sans-provenance.md` (25/08). Consommateur nommé : **FE-075**.
Fiche écrite avant de coder ; **l'état du code a été relu d'abord** (ci-dessous).

---

## Ce que le code faisait déjà (lu sur `origin/dev`, `055b423`)

- **STORY-391 et STORY-392 sont livrées** (26/08) : la ligne de cahier publie son `auditOcr` (`lotId`, `pieceId`,
  confiance, brut) et `GET /dossiers/{id}/pieces?pieceId=…` rend la pièce avec son URL. L'amont « réel » de FE-075
  est donc levé ; il ne restait que ce ticket.
- **STORY-388** a publié `origine` et `balanceSourceId` au niveau de la **balance** ; `profilImportId` et
  `signatureFichier` (import Sage) sont rangés mais pas servis.
- La ligne servie porte `niveauPreuve`, `sources` (comptes auxiliaires d'un fichier, STORY-370), `libelleSource`,
  `categories`, `comptesSources` (STORY-424). **Aucun de ces champs ne dit d'où vient la ligne**, ni ne permet de
  remonter aux transactions qui la composent.
- À la source (`AgregationService.construire`), le lien existe pendant le calcul : chaque transaction est ventilée en
  écritures, puis agrégée par compte (`agregerEcritures`). Il n'est écrit nulle part.

## Ce qui manquait réellement

1. **La nature de la provenance n'est pas toujours rangée.** `source` (`sage` | `direct` | `ocr`) est requise sur toute
   balance, mais le chemin **cahiers** écrit `source: 'ocr'` sans rien d'autre : une balance « cahiers » est
   **indiscernable** d'une balance `ocr` soumise directement. Pour les balances déjà stockées, cette information est
   **perdue** et ne peut pas être reconstituée sans migration.
2. **Aucune route ne rend les transactions d'un compte.** Les trois contournements du ticket restent faux
   (`RecettesQueryDto` sans filtre `compte`, `totaux-comptes` rend « combien » pas « lesquelles », le fichier importé
   n'est pas référencé).

## Ce que la story livre (ajouts seuls, §1.8)

### 1. Un marqueur d'adaptateur, écrit désormais, hors sceau
`Balance.adaptateur` (facultatif, énumération `ADAPTATEURS_BALANCE = ['cahiers']`) est posé par le seul
`AgregationService`, via le marquage **interne** (jamais le corps client, comme `origine`). Il n'entre ni dans le
`checksum` (le sceau ne couvre que le contenu métier ; vérifié : `computeBalanceChecksum` lit `exercice`, `source`,
`referentiel`, `version`, `lignes`) ni dans l'index d'idempotence. **Aucune migration.**

### 2. `provenance` sur chaque ligne servie (`GET …/balances`, `GET …/balances/{id}`)
Champ **facultatif**, **dérivé à la lecture** de ce que la balance porte déjà (rien n'est copié sur les lignes
stockées). Énumération `ProvenanceLigne` :

| Valeur | Quand | Ce que la ligne permet d'ouvrir |
|---|---|---|
| `CAHIERS` | `adaptateur = cahiers` (balance construite depuis les cahiers) | les transactions du compte : route ci-dessous |
| `FICHIER` | `source = sage` | rien de plus que `sources` (comptes auxiliaires du fichier) quand elles y sont |
| `DIRECTE` | `source = direct`, sans origine | rien : déclarée telle quelle par l'émetteur |
| `DERIVEE` | une `origine` est posée (à-nouveaux, provisions, amortissements, inventaire, `comptabilite`…) | rien ici : `origine` (et `balanceSourceId`) disent de quoi elle dérive |
| `NON_ENREGISTREE` | `source = ocr` **sans** `adaptateur` : balance d'avant cette story, ou soumission `ocr` directe | rien. **Ce n'est pas « aucune pièce »** : la provenance n'a pas été enregistrée |

Cette distinction « provenance non enregistrée » / « aucune pièce » est la garde que demande le ticket et que FE-075
(D2) exige pour être livrée.

### 3. `GET /api/v1/dossiers/{dossierId}/balance/{id}/lignes/{compte}/provenance`
(la route est dans `AgregationController`, qui détient déjà les cahiers, sous `/balance/` au singulier avec `depuis-cahiers` ; même garde, même portée de dossier ; D-926-6). Pour une
balance `CAHIERS` seulement. Rend les **transactions des cahiers de l'exercice qui alimentent ce compte**, rejouées par
la **même ventilation** que la construction (une seule règle) :

```
{ balanceId, compte, provenance: 'CAHIERS',
  lignes: [ { transactionId, sens: 'RECETTE'|'DEPENSE', date, libelle, montantDebit, montantCredit,
              niveauPreuve, pieceId?, lotId? } ],
  totaux: { mouvementDebit, mouvementCredit },          // ce que les cahiers donnent AUJOURD'HUI
  balance: { mouvementDebit, mouvementCredit },         // ce que la ligne de la balance dit
  ecart:  { mouvementDebit, mouvementCredit, nul } }    // balance - cahiers, signé, jamais absorbé
```
`pieceId` / `lotId` viennent de `auditOcr` de la ligne de cahier (STORY-391) ; leur absence veut dire « ligne saisie à
la main », pas « oubli ». Les transactions non ventilables sont comptées (`nonVentilees`) sans être listées.

Refus : balance d'un autre dossier / inconnue ⇒ **404** ; compte absent de la balance ⇒ **404**
`COMPTE_ABSENT_DE_LA_BALANCE` ; balance non `CAHIERS` ⇒ **409** `PROVENANCE_NON_OUVRABLE` avec la `provenance` de la
balance (l'écran dit pourquoi, il ne montre pas un tiroir vide).

## Critères d'acceptation

- **AC-1** : une ligne de chaque nature (`CAHIERS`, `FICHIER`, `DIRECTE`, `DERIVEE`, `NON_ENREGISTREE`) est servie avec
  la bonne valeur ; une balance cahiers **persistée** porte `adaptateur` ; une balance ancienne (`source: ocr`, pas
  d'`adaptateur`) rend `NON_ENREGISTREE`.
- **AC-2** : le `checksum` d'une balance est le même avec ou sans `adaptateur` ; aucune balance stockée n'est réécrite.
- **AC-3** : la route de provenance rend les transactions du compte, leur `pieceId`, les totaux et l'écart signé ;
  une dépense à la TVA non déductible et une recette ventilée sur le même compte sont toutes deux listées.
- **AC-4** : cloisonnement : autre organisation / autre dossier ⇒ 404.
- **AC-5** : balance non cahiers ⇒ 409 `PROVENANCE_NON_OUVRABLE` ; compte inconnu ⇒ 404.
- **AC-6** : la forme d'origine de la ligne est intacte pour les appelants existants (aucun champ renommé ni retiré).
- **AC-7** : une mutation de l'assertion (nature, écart) rougit sur l'assertion, pas sur la compilation.

## Décisions

- **D-926-1 — la provenance se dérive à la lecture ; seul un marqueur est écrit.** Écrire un objet sur chacune des
  1 284 lignes de chaque balance (option (a) du ticket) paierait en permanence pour un geste ponctuel ; la ligne ne porte
  qu'une valeur courte d'énumération (≈ 25 octets), le détail se lit à la demande (option (b), recommandée par le
  ticket). Les deux options sont donc livrées dans leur forme la plus légère.
- **D-926-2 — balances déjà stockées : valeur nommée `NON_ENREGISTREE`, pas de migration.** Une balance cahiers d'avant
  la story ne peut pas être distinguée d'une balance `ocr` directe sans réécrire la base (règle du lot : pas de
  migration). Le champ n'est ni absent ni muet : il dit que l'information manque. Ce qui se ferait avec une migration
  (poser `adaptateur: cahiers` sur les balances `ocr` sans origine) est **nommé et laissé** : à décider par le PO, c'est
  une supposition (les balances `ocr` directes existent, bien que rares).
- **D-926-3 — la route rejoue les cahiers d'aujourd'hui, et le dit.** Les lignes de cahier restent modifiables tant que
  l'exercice n'est pas figé : le rejeu peut différer de la balance. C'est **l'écart signé** qui le publie
  (D3 de FE-075 : l'écart est un livrable). Aucun instantané des transactions n'est stocké (migration et volume).
- **D-926-4 — `adaptateur` ne remplace pas `source`.** `source` reste le vocabulaire du contrat canonique
  (`balance.submitted`, sceau) ; `adaptateur` est un marqueur interne de lecture, jamais émis sur Kafka.
- **D-926-6 — la route vit sous `/balance/` (singulier), pas `/balances/`.** Le préfixe d'un contrôleur ne se surcharge pas : la placer sous `/balances/` demandait un contrôleur neuf déclaré au module (donc `docker compose up`, règle §1.5) ou une dépendance du module balance vers les cahiers. Sous `/balance/`, elle reste dans `AgregationController`, le contrôleur des cahiers : aucun module, provider ni dépendance neufs, pas de Docker. Contestable par D si l'écran préfère le pluriel (un contrôleur neuf, 10 lignes).
- **D-926-5 — le BFF ne relaie pas la route** (comme la complétude et le référentiel : relais à nommer par A si
  l'écran le demande).

## Preuves (relevées)

- Code : balance-service #155 (dev `6df0ce6`). `tsc` propre ; lint des seuls fichiers touchés propre.
- Unitaires : provenance des lignes (dto, 12/12), rejeu pur (10/10) ; `src/modules/cahiers`, `balance` et `referentiel` en bloc : seules échouent les `*.module.spec.ts` (`Cannot find module 'bindings'`, Node v25, **préexistant** : même échec sur `origin/dev` en mettant la story de côté) ; `sage-parser` et `rendu-excel`, lents sous charge, passent seuls.
- e2e : `agregation-cahiers` 41/41 (13 neufs : marqueur posé à la persistance, 701 avec pièce, 6132 saisie à la main, écart signé, non ventilable, 409 x4 natures, 404 compte absent, cloisonnement x4, id malformé), `openapi-contract` 223/223 (enum nommée, champ facultatif, route publiée), `balance`, `cahiers-recettes`, `pieces-ocr`, `balance-export` verts (434 sur les 6 fichiers).
- Mutations rouges sur l'assertion (pas à la compilation) : marqueur retiré de la persistance ⇒ 1 rouge ; signe de l'écart inversé ⇒ rouge (unitaire et e2e) ; `NON_ENREGISTREE` rendu `CAHIERS` ⇒ 2 rouges.
- **Docker non requis** : un champ de schéma, une route dans un contrôleur existant, aucun module ni provider neuf (verrou non pris).

## Reste nommé

- Balances `ocr` d'avant la story : `NON_ENREGISTREE`. Poser `adaptateur: cahiers` sur celles qui viennent des cahiers = migration + supposition : à décider par le PO.
- Le BFF ne relaie pas la route (relais à nommer par A si l'écran le demande).
- `FICHIER` : pas de lignes sources d'un import Sage (le fichier n'est pas rejoué) ; `sources` (comptes auxiliaires) reste la seule ouverture.
