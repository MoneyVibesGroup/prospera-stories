# STORY-557 : Le contrat de balance porte les mouvements antérieurs — la colonne qui manque à l'édition Sage, et les cinq portes qui doivent la fournir

Status: ready-for-dev

**Épic :** EPIC-017 — Socle `balance-service` + contrat de balance canonique
**Service :** `balance-service` (`:3007`) — `modules/balance`, ses **cinq** adaptateurs d'entrée
**Points :** 8 · **Sprint :** S20
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
