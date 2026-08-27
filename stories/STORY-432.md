# STORY-432 : Une balance après détermination du résultat produit un compte de résultat ENTIÈREMENT VIDE — et tous les contrôles restent verts

Status: ready-for-dev

**Épic :** EPIC-010 — États financiers (`bilan-service`)
**Service :** `bilan-service` (`:3004`) — `modules/bilan/etats`, `dto`
**Points :** 3 · **Sprint :** S20
**Origine :** arbitrage PO sur **STORY-426**, 2026-08-27. Trouvé en re-dérivant le critère de
STORY-426 contre les **trois états possibles d'une balance**.

---

## Le fait

Le comptable importe la balance qu'il considère comme la **bonne** : la *balance après
inventaire*, définitive, celle sur laquelle il arrête ses comptes. Dans cet état, l'**écriture de
détermination du résultat** est déjà passée : les classes 6, 7 et 8 sont **soldées**, et le
résultat est au compte **13**.

Le module produit alors :

| grandeur | valeur | contrôle |
|---|---|---|
| `produits[]` / `charges[]` | tous les montants à **0** | — |
| `resultatNetN` (`XI`) | **0** | — |
| `sig[]` (`XA`…`XI`) | **0** partout | `coherenceSig.coherent` = ✅ (`0 = 0`) |
| `coherenceResultat.ecart` | **0** | ✅ (`0 = 0`) |
| `controle.equilibre` | **true** | ✅ (`A = P + 0`, le compte 13 est au passif) |
| `coherenceSousTotaux` (`BZ = DZ`) | **true** | ✅ |

⇒ **Une liasse complète, équilibrée, cohérente sur les quatre contrôles — et un compte de
résultat entièrement vide.** Rien, nulle part, ne dit pourquoi.

## Pourquoi c'est le piège le plus coûteux du lot

- Il ne se manifeste **par aucun symptôme technique** : pas d'erreur, pas de 4xx, pas de drapeau.
  L'écran affiche une liasse d'apparence normale dont une moitié est à zéro.
- Le premier réflexe du comptable sera de croire à un **bug d'import** ou à un **rattachement
  raté** — et il ira chercher dans la table de passage, où il ne trouvera rien d'anormal
  (les comptes de gestion *sont* bien rattachés ; ils valent zéro).
- Le geste correctif est **immédiat une fois nommé** — reprendre la balance *avant* écritures de
  clôture — mais **impossible à deviner** depuis l'écran actuel.
- Et le produit **ne dit nulle part quelle balance il attend**. C'est une hypothèse implicite du
  module depuis STORY-059.

---

## Critères d'acceptation

- [ ] AC-1 — La réponse publie `etatBalance` (champ introduit par **STORY-426**) :
      `APRES_DETERMINATION` quand `resultatNetCR = 0` **et** `solde(poste RESULTAT_BILAN) ≠ 0`.
- [ ] AC-2 — Cet état est une **information**, pas une erreur : `200`, la liasse est produite,
      et elle reste **validable** (le Bilan, lui, est juste — c'est le CR qui est vide, et il
      l'est légitimement).
- [ ] AC-3 — ⚠️ **Ne pas confondre avec une balance creuse.** Une balance sans aucun compte de
      gestion **ni** compte 13 (dossier neuf, aucune écriture) est `AVANT_CLOTURE` avec un CR à
      zéro lui aussi — mais la cause est autre, et le geste aussi. Un test couvre les deux.
- [ ] AC-4 — La documentation du module (`@ApiOperation` du `dry-run`) **énonce l'hypothèse** :
      *la liasse se produit sur une balance **avant écritures de clôture** ; sur une balance après
      détermination du résultat, le compte de résultat est vide par construction.*
- [ ] AC-5 — Test : balance à classes 6/7/8 soldées + compte 13 alimenté ⇒ `etatBalance =
      'APRES_DETERMINATION'`, `resultatNetN = 0`, **les quatre contrôles verts**, et le champ
      présent. C'est la preuve que l'information manquante est désormais servie.

## Vigilance

- ⛔ **Ne pas refuser la production.** Un cabinet peut légitimement vouloir le **Bilan** depuis une
  balance après clôture — c'est le CR qui n'a plus rien à dire, pas la liasse entière.
- ⚠️ Le **TFT** (STORY-061) est concerné de la même façon : ses ancres de trésorerie viennent du
  Bilan, mais sa variation N/N-1 se lit sur des flux. À vérifier au passage.

## Conséquences ailleurs

- **FE-032** doit porter un **troisième état** de démonstration (« balance après clôture ») et
  l'expliquer à l'écran, à côté de « Servi » et « Résultat non affecté ».
- **STORY-426** partage le champ `etatBalance` : les deux stories se tirent ensemble.
