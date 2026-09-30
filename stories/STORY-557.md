# STORY-557 : Le contrat de balance porte les mouvements antérieurs — la colonne qui manque à l'édition Sage, et les cinq portes qui doivent la fournir

Status: done

**Épic :** EPIC-017 — Socle `balance-service` + contrat de balance canonique
**Service :** `balance-service` (`:3007`) — `modules/balance`, ses **cinq** adaptateurs d'entrée
**Points :** 8 · **Sprint :** S20 · **Complexité :** high · **Assigné à :** `vivianMoneyVibesGroupes`
**Origine :** **arbitrage PO du 2026-08-28** sur STORY-555 — *« exporter la balance au format Sage
pour obtenir un format identique »*. C'est la **voie B**, celle que STORY-555 avait mise hors
périmètre en la renvoyant à une fiche propre. La voici.
**Débloque :** **STORY-555** (l'export lui-même)
**Réf. :** **STORY-101** (contrat de balance canonique — la pièce qui rend cabinet, IMF et
distributeur interchangeables) · **STORY-087** (reprise d'à-nouveaux)

---

## Le fait

L'édition Sage 100 Comptabilité i7 porte **trois** paires de colonnes ; `LigneBalance` en porte
**deux** :

| Bloc du PDF | Colonnes | Dans le schéma |
|---|---|---|
| **Mouvements au 31/12/N-1** | Débit / Crédit | ⛔ **absent** |
| Mouvements | Débit / Crédit | `mouvementDebit` / `mouvementCredit` |
| Soldes cumulés | Débit / Crédit | `soldeDebiteur` / `soldeCrediteur` |

⛔ **Et la paire manquante ne se calcule pas.** Les soldes cumulés sont des soldes **nets** portés
d'un côté ou de l'autre ; les mouvements antérieurs sont des **cumuls bruts** au débit et au
crédit. De `(mouvements de la période, solde net)` on ne retrouve pas
`(cumul débit antérieur, cumul crédit antérieur)` : deux comptes ayant le même solde net peuvent
avoir des cumuls antérieurs radicalement différents. **L'information est perdue à l'entrée.**

⚡ **C'est pourquoi cette story n'est pas « ajouter deux champs ».** Un champ ajouté au schéma que
personne ne remplit produit une colonne de zéros — c'est-à-dire une affirmation fausse
(« ce compte n'avait pas bougé ») sur un document destiné à être remis. **Le travail est aux
cinq portes d'entrée, pas au schéma.**

## Les cinq portes, et ce que chacune peut fournir

| Porte | Peut-elle fournir les cumuls antérieurs ? | À faire |
|---|---|---|
| **Import Sage** (`sage-import.controller`) | ✅ **oui** — le fichier les porte, c'est sa source | Les lire au lieu de les jeter |
| **Import tabulaire** (`imports/profil-parser`) | ⚠️ selon le profil | Deux colonnes **optionnelles** dans le profil d'import |
| **Reprise d'à-nouveaux** (STORY-087) | ⚠️ à vérifier | Le socle d'ouverture porte des **soldes**, pas des cumuls — à instruire, pas à supposer |
| **Cahiers** (`depuis-cahiers`) | ⛔ non | Une PME qui tient des cahiers n'a pas d'antériorité en cumuls |
| **OCR / saisie** | ⛔ non | Idem |

⇒ **La donnée est structurellement partielle, et le contrat doit le dire.** Trois portes sur cinq
ne l'auront jamais. Un champ obligatoire les casserait toutes.

## Périmètre

**Inclus**

- Deux champs **optionnels** sur `LigneBalance` : `cumulAnterieurDebit` et `cumulAnterieurCredit`.
  ⛔ **Optionnels, et distincts de zéro** — `undefined` signifie « non fourni par la source »,
  `0` signifie « fourni, et nul ». La confusion entre les deux est exactement ce que cette story
  existe pour empêcher.
- Un indicateur au niveau de la **balance**, pas de la ligne : `anteriorite: 'COMPLETE' |
  'PARTIELLE' | 'ABSENTE'`. Une balance dont 3 lignes sur 400 portent l'antériorité n'est pas
  exportable au format Sage, et c'est le document qui doit le savoir, pas le lecteur.
- **L'import Sage les lit** — c'est la porte qui les a, et celle du cas d'usage.
- Le **profil d'import tabulaire** gagne deux colonnes optionnelles, décrites comme les autres.
- Le contrôle d'équilibre existant est **étendu sans être remplacé** : quand l'antériorité est
  complète, `cumulAnterieur + mouvement` doit reconstituer le cumul, et l'écart est publié.

**Hors périmètre**

- Rendre l'antériorité obligatoire. Elle ne le sera jamais pour les cahiers et l'OCR.
- Reconstituer l'antériorité depuis l'exercice précédent stocké dans le produit. ⚠️ Tentant, et
  **piégeux** : le produit ne détient l'exercice N-1 que s'il l'a traité lui-même. Reconstituer
  donnerait une antériorité **vraie pour Prospera et fausse pour la comptabilité du client**, dont
  le grand livre a vécu ailleurs. À ficher à part si le PO le veut, avec sa mention de calcul.
- L'export lui-même : **STORY-555**.

## Critères d'acceptation

1. Une balance importée depuis Sage porte ses cumuls antérieurs et `anteriorite: 'COMPLETE'`.
2. Une balance issue des cahiers porte `anteriorite: 'ABSENTE'` et **aucun champ à zéro** — les
   deux champs sont absents, pas nuls.
3. Une balance dont une partie seulement des lignes porte l'antériorité rend `'PARTIELLE'`, et le
   **nombre** de lignes concernées est publié.
4. **Témoin de non-régression du contrat** : une balance produite avant cette story se relit et se
   calcule à l'identique. Le contrat est **additif** — c'est la condition pour toucher STORY-101
   sans casser les adaptateurs IMF et distributeur.
5. Quand l'antériorité est complète, le contrôle `cumulAnterieur + mouvement = cumul` est exécuté
   et son écart publié ; il **n'est pas bloquant** (une source peut arrondir).
6. Le profil d'import tabulaire accepte un fichier **sans** ces colonnes — témoin que
   l'optionalité tient jusqu'au bout de la chaîne.

## Notes

- ⚠️ **Cette story touche STORY-101, la pièce la plus structurante du produit.** Le contrat de
  balance est ce qui rend cabinet, IMF et distributeur interchangeables. Toute modification y est
  **additive et optionnelle**, jamais un champ requis de plus.
- ⚡ **Le vrai livrable est l'honnêteté du document.** Ce que cette story achète, ce n'est pas
  « deux colonnes », c'est la capacité de dire *« cette balance n'a pas d'antériorité, elle ne peut
  pas être éditée au format Sage »* au lieu d'imprimer des zéros.
- ⚠️ **Instruire `POST …/balance/a-nouveaux` avant de conclure** (STORY-087) : c'est le seul endroit
  du produit où des cumuls d'exercice antérieur pourraient déjà exister. À regarder dans le code,
  pas à déduire de son nom.

## Cadrage de conception — instruction du code (2026-09-30)

⛔⛔ **Le défaut n'est pas seulement une colonne absente : elle est aujourd'hui LUE À LA PLACE
d'une autre.** `sage-parser.service.ts` classe une colonne en « mouvement » dès que son en-tête
contient `mouvement` (`MOTS_MOUVEMENT`), et retient la **première** (`mouvements[0]`). Dans
l'édition Sage, « Mouvements au 31/12/N-1 » **précède** « Mouvements » : ce sont les cumuls
antérieurs qui entrent comme mouvements de l'exercice. La colonne antérieure doit être reconnue
**avant** la classification mouvement / solde — test rouge d'abord, dans l'ordre réel des colonnes.

⚠️ **`aNouveauDebit` / `aNouveauCredit` existent déjà sur la ligne — et ne sont PAS cette colonne.**
Ils sont **constatés depuis le socle Prospera** (`aNouveauxDuSocle`, STORY-423) : c'est
l'antériorité *vue par le produit*, exactement ce que le hors-périmètre interdit de présenter comme
celle de la comptabilité du client. Les deux nouveaux champs portent ce que **la source** déclare.

| Point de décision | Décision |
|---|---|
| `anteriorite` | **Dérivée** des lignes par une fonction pure, jamais persistée : toujours cohérente, aucune migration, et une balance d'avant la story se lit `ABSENTE` sans réécriture (AC-4). Forme : `{ statut, lignesPorteuses, lignesTotal }`. |
| Recopies explicites | `buildCanonique`, `versLigne`, `LigneView`, `lireSoumission`, `LigneBalanceDto`, `CHAMPS_MAPPING.BALANCE` (liste blanche qui **supprime en silence**) — chacune porte les deux champs, jamais `?? 0`. |
| Regroupement de comptes (`normaliserEtRegrouper`) | Les cumuls **se somment** ; une seule ligne du groupe sans antériorité ⇒ la ligne regroupée n'en porte pas. |
| Reprise d'à-nouveaux (STORY-087) | **Instruite** : `lignesReportees` produit un socle de **soldes**, mouvements à 0. Aucun cumul N-1 n'existe dans le produit ⇒ `ABSENTE`, rien de fabriqué. |
| Balances dérivées (provisions, dotations, inventaire) | Une ligne héritée de la base **conserve** son antériorité (les écritures de la période ne réécrivent pas le passé) ; une ligne créée par la dérivation n'en a pas ⇒ `PARTIELLE`. |
| Saisie directe / `balance.submitted` | Le contrat HTTP et l'événement entrant acceptent les deux champs **optionnels** (ajout de propriétés facultatives : rétrocompatible) — c'est la forme publique de STORY-101. |
| Checksum | `sceller` v2 ne projette pas les champs optionnels ⇒ **aucun checksum existant ne bouge** (témoin AC-4). |
| Contrôle AC-5 | `(antD − antC) + (mvtD − mvtC) = soldeD − soldeC` par compte, publié comme `detecterDivergencesSoldes` (plafonné, total donné), **uniquement** si `COMPLETE`, jamais bloquant. |

## Progress Tracking

- **2026-09-30 — `in_progress`.** Instruction du code faite (cf. cadrage). Branche `MNV-557`
  ouverte sur `balance-service` (base `dev`).
- **2026-09-30 — développement** (`balance-service#123`, 6 commits). Le défaut du parser est reproduit
  par un test ROUGE avant correction (dans l'ordre des colonnes de l'édition Sage, les cumuls
  antérieurs étaient lus comme les mouvements de la période), vert après.
- **Portes rejouées en session** : lint 0 · build · 4 793 unitaires (99,26 / 93,24 / 98,88 / 99,38) ·
  1 252 e2e. **Table de mutations** : 22 mutants (champ omis dans `buildCanonique`, `?? 0` réintroduit,
  regroupement qui garde la 1re ligne, mot-clé antérieur retiré, liste blanche du profil, contrôle
  exécuté en `PARTIELLE`, `default: 0` au schéma…), chacun rougit sur un code qui compile.
- **Revue de code (⑥, opus)** — 2 constats retenus, corrigés dans un commit dédié :
  1. ⛔ *bloquant* — la règle de date rangeait aussi un en-tête de **période** (« Mouvements du
     01/01/23 au 31/12/23 », « Période du … ») parmi les antérieurs : la période perdait ses
     mouvements. Un intervalle ou le mot « période » n'est jamais antérieur par la date ; une colonne
     antérieure *par sa seule date* redevient la période quand son côté n'a pas d'autre mouvement.
  2. *non bloquant* — des cumuls posés à côté d'une grandeur **dérivée** (profil sans mouvements)
     déclaraient `COMPLETE` une balance aux mouvements fabriqués : cumuls écartés, avec avertissement.
  Mutations du correctif : 3/3 rougissent. Lentille ponytail : 6 simplifications de forme, non
  appliquées (code prouvé par sa table de mutations) — dette nommée : `detecterDivergencesAnteriorite`
  recopie la boucle de `detecterDivergencesSoldes`, `anterieursIncomplets` celle de `mouvementsIncomplets`.
- **Revue de sécurité (⑦, opus)** — **0 constat** (regex linéaires, validation des trois entrées
  HTTP/Kafka/fichier, entier sûr au regroupement, aucune route touchée). Garde de paire et
  `isSafeInteger` vérifiées dans le validateur.
- **Points laissés, assumés** : checksum v2 hors cumuls (précédent de `sources`, AC-4) ⇒ renvoyer la
  même version avec des cumuls ajoutés est un NOP ; `divergencesSoldes` signale sur un fichier Sage à
  trois blocs sans socle chaîné tout compte qui a un passé (le socle Prospera ne connaît pas
  l'antériorité — à arbitrer par le PO) ; « Solde N-1 » placé avant « Soldes » reste lu comme solde
  (défaut antérieur à la story).

- **Vérification docker (④, stack NEUVE `down -v`, 2026-09-30)** — `tmp/verif-docker-555-557/`, **249 verdicts OK, 0 KO**, commune à 555/556/557 ; p0 prouve les commits exécutés (`balance-service` b962ebb, `bilan-service` 29a7aab, `fiscal-service` d2d744a) et l'identité sha256 hôte = `src` monté, `pdfkit` 0.19.1 dans l'image.
  Par la VRAIE route d'import Sage, un fichier dans l'ordre de l'édition : en base, `401000.mouvementDebit` = la période (2 000 000,00), **jamais** l'antérieure (3 000 000,00) ; cumuls ×100 ; `COMPLETE` 6/6. Sans bloc : clé **absente** (jamais 0), `ABSENTE`. Soumission directe partielle : `PARTIELLE` 3/6 ; demi-paire ⇒ 400 sans écriture. En-tête de période daté « du … au … » : lu comme la période.
- **Mutations rejouées en session** : 19/19 rouges (+ 3 de revue), code compilable (`TS:0`).
- **Intégration (⑧)** : `balance-service#123` rebase-mergée sur `dev` le 2026-09-30 ; branche supprimée APRÈS re-ciblage de #124 (supprimer la base d'une PR empilée la ferme).
- **2026-09-30 — `done`.** Statut synchronisé : en-tête, `sprint-status.yaml` (+ `completed_date`), ce suivi.
