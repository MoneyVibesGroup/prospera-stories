# STORY-669 : Le relevé par l'API du participant — il ne se dépose plus, il se relève

Status: review

**Épic :** EPIC-036 — Fournisseurs de paiement interchangeables et simultanés
**Service :** `paiement-service`
**Points :** 5 · **Sprint :** ⚠️ **NON SLOTTÉE** — `PLAN-PI-SPI-CAS-D-USAGE-2026-09-15`, phase C
**Prérequis :** **STORY-269** (le relevé, référentiel de comparaison), **STORY-270** (la cascade de
rapprochement), **STORY-666** (le raccordement par organisation)
**Origine :** le parcours « Suivi de trésorerie en temps réel » du catalogue PI-SPI. Aujourd'hui,
rapprocher exige qu'une personne exporte un fichier chez son établissement et le téléverse
([[STORY-269]]). Le participant sait pourtant dire lui-même ce qui est arrivé sur un compte.

⚠️ **Le titre du plan disait « la trésorerie ».** Le mot ne peut pas entrer dans ce service : la
garde NFR-1b (`detention-de-fonds.invariant.spec.ts`) l'interdit comme identifiant **partout**, et
interdit `solde` dans le modèle de données — parce que « Prospera ne détient jamais de fonds » ne
tient à rien d'autre qu'à l'absence de ces concepts dans le code. Elle a raison, et cette story s'y
range : elle parle de **relevé** et de **position d'un compte**, lue chez le participant, jamais rangée.

---

## Le fait — mesuré sur le bac à sable le 2026-09-21, en lecture seule

| Appel (sous `/TGD999`, raccordement de Money Vibes) | Ce qu'il rend |
| --- | --- |
| `GET /comptes/{numero}` (portée `compte.read`) | `{type, numero, solde: 1000000700, statut, dateOuverture, preConfirmation}` |
| `GET /paiements-recus` (portée `paiement.read`) | les paiements **reçus** : `txId`, **`end2endId`**, `montant`, `payeCompte`, `categorie`, `statut: IRREVOCABLE`, `dateIrrevocabilite`, `motif`, et l'identité du payeur |
| `GET /paiements/{end2endId}` | le détail d'un paiement |
| `GET /paiements-envoyes`, `GET /comptes/transactions` | existent, vides |
| `/comptes/{n}/solde`, `/transactions`, `/releve`, `/operations`, `/transferts`… | **n'existent pas** (`403` de la passerelle) |

⚡ **Le solde dit vrai** : 1 000 000 000 à l'ouverture, plus 300 + 200 + 200 — exactement les trois
paiements des recettes de [[STORY-663]], [[STORY-664]] et [[STORY-670]]. Le relevé et la position se
recoupent au franc près.

⚡ **Filtres mesurés un par un** (l'API ne nomme qu'une erreur par réponse) : `payeCompte`, `txId`,
`montant`, `payeurAlias`, `payeAlias`, `sort`, et `dateIrrevocabilite` avec les opérateurs `[gte]`,
`[lte]`, `[gt]` — **appliqués, pas seulement acceptés** (le `numero` de `GET /comptes` est accepté et
ignoré : un filtre ne se croit pas, il se mesure). `statut`, `dateDebut`, `dateFin`… sont refusés.

⚡ **La pagination est un curseur.** `meta.page` est une chaîne opaque à repasser en `?page=` ; la
dernière page est vide et n'en porte plus. ⛔ **`meta.total` n'est PAS le total** : c'est la taille
de la page (`size=1` rend `total: 1` sur trois paiements). Qui s'y fierait croirait avoir tout lu.

⚡⚡ **`/paiements-recus` porte `txId` ET `end2endId` ENSEMBLE** — les deux identifiants que
[[STORY-665]] avait mesurés sur deux chemins qui ne se rejoignaient pas (le webhook ne connaît que le
premier, la consultation range sous le second). C'est la seule réponse du schéma qui les relie.

## Critères d'acceptation

- [x] AC-1 — Une organisation **relève** un de ses comptes sur une période : le service interroge le
      participant **sous le raccordement de l'organisation** ([[STORY-666]] — aucun repli), pour le
      compte désigné et lui seul, et range les mouvements dans le **même** registre que l'import de
      [[STORY-269]]. Droit : celui de l'import. Gate d'AD-16, trace au journal chaîné.
- [x] AC-2 — ⛔⛔ **L'invariant de STORY-269 tient toujours, et par le même moyen.** Relever ne
      constate **aucun** encaissement : un relevé est un référentiel de comparaison, jamais une
      source d'écriture (AD-4). Le cas d'usage n'injecte ni le registre des encaissements, ni les
      créances — une **absence d'injection**, pas une garde.
- [x] AC-3 — **Relever deux fois n'ajoute rien.** L'empreinte et le rang parmi les jumelles de
      STORY-269 s'appliquent tels quels : deux relèves qui se chevauchent rangent chaque mouvement
      une fois, et le bilan **compte** ce qui était déjà là.
- [x] AC-4 — ⛔ **On lit TOUTES les pages, ou on le dit.** Le curseur est suivi jusqu'à la page vide ;
      `meta.total` n'est jamais cru. Au-delà du plafond de lignes d'un lot (STORY-269), la relève
      **refuse** et nomme le remède — raccourcir la période — plutôt que de ranger un relevé
      tronqué qui se lirait « complet ».
- [x] AC-5 — ⛔ **Seul l'argent arrivé entre au relevé.** Un paiement qui n'est pas irrévocable n'est
      pas un mouvement : il est écarté et **compté**. Les filtres du participant sont **revérifiés**
      à la lecture (compte, période) : un filtre accepté n'est pas un filtre appliqué.
- [x] AC-6 — ⚡ **Le rapprochement devient CERTAIN sans que personne ne saisisse rien.** Chaque
      mouvement relevé porte l'identifiant de transaction du schéma, et son libellé porte **notre
      référence de demande** ; la cascade de [[STORY-270]] la cherche désormais au libellé. Un
      encaissement constaté par webhook et le mouvement qui lui correspond s'apparient par une clef
      certaine, plus par « même montant, à un jour près ».
- [x] AC-7 — La **position du compte** chez le participant est rendue avec la relève, datée, et
      **n'est rangée nulle part** : ni schéma, ni journal. Un nombre rangé est faux la seconde
      d'après, et c'est exactement le champ que NFR-1b interdit.
- [x] AC-8 — Méthode **facultative** du port : un fournisseur qui ne sait pas relever garde l'import
      par fichier, et le refus le dit. Déléguée par l'enveloppe d'observation **avec** `suivre` —
      celle-ci PARLE au fournisseur.
- [x] AC-9 — Recette **réelle** : le compte de Money Vibes relevé sur le bac à sable, les trois
      paiements rangés, la seconde relève n'en ajoute aucun, et le rapprochement apparie par clef
      certaine.

## Ce que cette story ne fait pas

- Elle **ne planifie rien** : la relève est un geste, pas une veille. La périodicité est une
  décision d'exploitation (coût d'appel, quotas du participant) qui viendra avec sa mesure.
- Elle **ne relève pas les paiements envoyés** : le service n'en émet aucun ([[STORY-668]], bloquée
  par l'amendement du PRD). Le relevé ne porte donc que des crédits.
- Elle **n'unifie pas** les clefs d'unicité du webhook et de la consultation. Elle mesure que le
  pont existe (`/paiements-recus?txId=`) ; le construire reste la story nommée par [[STORY-665]]
  (id ≥ 674).
- Elle **ne touche pas** FedaPay : son relevé reste un fichier.

## Livraison (2026-09-21 — branche `MNV-669`, commit `375fd0b`, empilée sur `MNV-667`)

**Suites :** 3 703 unitaires (274 suites), 309 e2e, lint 0, `tsc` 0. **Recette RÉELLE sur le bac à sable,
par le vrai conteneur : 17/17** — rien n'y est joué.

### ⚡⚡ AC-9 — la mesure

Le compte de Money Vibes (`44511072980305975922`), relevé sur septembre 2026 sous son raccordement
scellé :

| Ce qui a été mesuré | Résultat |
| --- | --- |
| Mouvements relevés | **5** : 200, 200, 300, 150, 175 — les trois recettes de 663/664/670 et les **deux scans du comptoir** de [[STORY-667]] |
| Position rendue | **1 000 001 025**, soit 1 000 000 000 + 1 025 : **elle recoupe le relevé au franc près** |
| Seconde relève de la même période | **0 retenue, 5 ignorées** — comptées |
| Période d'un seul jour (le 16) | **1** ligne : les bornes sont appliquées, crochets encodés compris |
| Période sans mouvement (août) | `201`, zéro ligne, position rendue — une réponse, pas un lot invalide |
| Organisation **sans** raccordement | `422 RACCORDEMENT_FOURNISSEUR_ABSENT` — aucun repli |
| Rapprochement sur ce relevé | **3 couples CERTAINS, 0 proposition** : 1 par l'identifiant du schéma (constaté par consultation), **2 par notre référence au libellé** (constatés par webhook) |
| Écart résiduel | **325 = 150 + 175** : les deux paiements du comptoir, qui attendent leur affectation |

⚡ **Le dernier chiffre est celui qui compte.** Avant cette story, ces trois encaissements ne
s'appariaient à leur mouvement que par « même montant, à un jour près » — une *proposition*. Et
l'écart de 325 n'est pas un défaut : c'est exactement l'argent arrivé sans créance, vu cette fois
du côté de la banque. Les deux stories se recoupent sans s'être concertées.

### Ce qui a été construit

- `POST /v1/comptes-encaissement/:compteId/releves/relevements` — `{depuis, jusqua?, simulation?}`,
  droit de l'import. Rend le bilan de l'import, `origine: FOURNISSEUR`, les mouvements écartés et
  la `position` datée.
- Méthode facultative du port `releverUnCompte?` (déléguée **avec** `suivre`), registre
  `saitReleverUnCompte()`. Portées `paiement.read` + `compte.read`.
- `releve-api-business.ts` — **pur** : ce qui décide de ce qui entre dans un relevé se prouve sans
  réseau, sur les corps **mesurés** du bac à sable. Irrévocable seulement, compte et période
  **revérifiés**, payeur **jamais** repris.
- `ReleverUnCompte` : trois dépendances (comptes, registre des fournisseurs, `ImporterLeReleve`) —
  **un seul chemin d'écriture d'une ligne**, celui de [[STORY-269]]. C'est pourquoi « relever deux
  fois n'ajoute rien » n'a demandé aucun code.
- La trace d'import dit `origine` (`FICHIER` | `FOURNISSEUR`). `versVersement` ajoute la référence
  de **demande** aux références attendues au libellé (AC-6).

### Ce que la story a tranché, et qu'il ne faut pas refaire

- ⛔⛔ **« TRÉSORERIE » N'ENTRE PAS DANS CE SERVICE.** La garde NFR-1b interdit le mot partout et
  `solde` dans le modèle de données. La position est **rendue et jamais rangée** : ni schéma, ni
  journal, ni trace (prouvé en e2e : le nombre n'apparaît dans rien de ce qui s'écrit).
- ⚡ **L'identifiant du schéma en référence, NOTRE référence au libellé.** Les deux clefs de la
  cascade servent alors chacune un chemin de constat : la première la consultation
  ([[STORY-670]]), la deuxième le webhook ([[STORY-665]]). Un seul champ n'aurait servi qu'un des deux.
- ⚡ **Une période sans mouvement n'est pas un lot vide.** L'import refuse un fichier sans ligne —
  à raison, c'est une erreur de téléversement. Ici personne ne s'est trompé : rien n'est écrit, rien
  n'est tracé, et la position est rendue quand même.
- ⚡ **La position est lue APRÈS, et son échec ne coûte pas les mouvements** : le détail d'un compte
  a déjà été la route malade de ce simulateur ([[STORY-654]]).
- ⚡ **Le compte s'ouvre par le coffre** (`utiliser`), comme pour pousser une demande : c'est le
  seul chemin par lequel un adaptateur apprend le numéro du compte, et il refuse un compte non
  vérifié. L'adresse de paiement sort donc du coffre sans servir — coût accepté, nommé ici.

### Pièges payés

- ⛔⛔ **`sort=dateIrrevocabilite` NE TRIE QUE LA PAGE RENDUE.** Sur une seule page il range du plus
  ancien au plus récent ; avec un curseur, la liste part quand même du plus récent. Le premier jet
  s'y fiait. Remède : aucun `sort`, et un **dédoublonnage par identifiant du schéma** — un paiement
  qui arrive *pendant* la lecture décale tout d'un rang et répète une ligne (c'est arrivé pendant la
  sonde : les deux scans de 667 sont tombés au milieu).
- ⛔ **L'API ne nomme qu'UNE erreur par réponse.** Trente paramètres candidats envoyés d'un coup
  n'apprennent rien : il faut les sonder un par un. `size=x` masquait tout le reste.
- ⛔ **`meta.total` est la taille de la page.** `size=1` → `total: 1` sur un compte à cinq paiements.
- ⛔ **Git Bash réécrit tout argument qui commence par `/`** — `node sonde.js /comptes` a interrogé
  `C:/Program Files/Git/comptes`, et la passerelle a répondu un `403` qui ressemblait à une route
  absente. `MSYS_NO_PATHCONV=1`.
- ⛔ Un `403 « Invalid key=value pair … Authorization header »` de la passerelle = **route
  inconnue**, pas un défaut d'authentification.
- ⚠️ La garde de [[STORY-269]] est une **liste blanche d'imports** : y inscrire le registre des
  fournisseurs a été un geste explicite, commenté — exactement ce pour quoi elle existe. L'inventaire
  fermé des clefs de la trace a rougi sur `origine`, à raison.

### ⚠️ Points ouverts pour le PO

1. **La relève est un geste, pas une veille.** Une relève quotidienne automatique est une décision
   d'exploitation : elle consomme le quota du raccordement de **chaque** organisation.
2. **Le pont `txId` ↔ `end2endId` existe** (`GET /paiements-recus?txId=`) : l'unification des clefs
   d'unicité nommée par [[STORY-665]] a maintenant de quoi se faire (id ≥ 674).
3. **Un paiement de comptoir reste un écart tant qu'il n'est pas affecté** — et après affectation
   il ne s'appariera que par proposition (montant + date) : sa référence est celle d'un lieu, pas
   d'une demande. À instruire si les comptoirs prennent du volume.
4. **Les paiements ENVOYÉS ne sont pas relevés** (`/paiements-envoyes` existe, vide) : ils le seront
   avec [[STORY-668]], si l'amendement du PRD l'ouvre.

## Notes

- Voir [[STORY-269]] (le relevé et son empreinte), [[STORY-270]] (la cascade), [[STORY-666]] (le
  raccordement), [[STORY-665]] (les deux clefs), [[STORY-242]] (NFR-1b et sa garde).
- ⚠️ Le relevé du participant **nomme le payeur** (`payeurNom`, `payeurAlias`). Rien de cela n'entre
  dans une ligne : le libellé porte le motif et notre référence, et c'est tout ce dont la cascade
  a besoin.
