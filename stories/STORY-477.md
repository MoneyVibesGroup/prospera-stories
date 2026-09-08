# STORY-477 : Deux jeux d'hypothèses aux neuf paramètres identiques sont comparés sans un mot

Status: in_progress

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 2 · **Complexité :** medium · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-036** (projection 3 ans, trésorerie 12 mois, scénarios comparés), 2026-08-27.
Relevé en cochant, dans le sélecteur de la maquette, le jeu « Optismiste 2026 » — la faute de frappe que FE-035 a montrée indéboulonnable.

---

## Le fait

`ComparaisonQueryDto` porte une garde `IdsDupliquesConstraint` : elle refuse deux fois le **même
identifiant**. Elle ne regarde **jamais les valeurs**.

Le dossier de démonstration porte « Optimiste 2026 » et « Optismiste 2026 » — deux jeux distincts, aux
**neuf paramètres identiques**, nés de la faute de frappe que **STORY-464** a établie comme
indéboulonnable (ni suppression, ni renommage). Les comparer rend **tous les écarts à 0** et superpose
deux courbes, sans un mot.

Ce n'est pas un cas de laboratoire : c'est la conséquence mécanique de l'absence de duplication
(**STORY-466**) — l'utilisateur ressaisit à la main, et une ressaisie produit tôt ou tard un doublon.

## Critères d'acceptation

- [ ] AC-1 — La réponse porte `doublons: [{ hypothesesIds: string[] }]` — les groupes de scénarios dont
      les neuf paramètres sont **strictement égaux**. Comparaison sur les valeurs, pas sur un hachage
      d'objet dont l'ordre des clés varierait.
- [ ] AC-2 — Ce n'est **pas** un refus : comparer un scénario avec sa copie est un usage légitime
      (vérifier qu'une ressaisie est fidèle). Le contrat le **signale**, il ne l'interdit pas.
- [ ] AC-3 — Test : deux jeux aux mêmes valeurs ⇒ `doublons` non vide et tous les écarts nuls.

---

## Progress Tracking

**Statut : in_progress** — ouverte le 2026-09-08, branche `MNV-477`.

### Prémisses vérifiées AVANT d'écrire

**Le fait est exact.** `IdsDupliquesConstraint` (`dto/comparaison-query.dto.ts`) fait
`new Set(ids).size === ids.length` : elle refuse deux fois le même **identifiant**, et ne lit jamais
les valeurs. Deux jeux distincts aux mêmes paramètres passent, tous les écarts sortent à `0`, et la
réponse ne dit rien.

⚠️ **« Les neuf paramètres » est FAUX — il y en a 18**, et c'est la troisième fois que la même
erreur traverse une fiche de cette épopée (STORY-474 l'avait déjà relevée : la fiche en annonçait
neuf là où le schéma en portait dix-huit). Le nombre n'entre dans aucun critère — l'AC-1 dit
« strictement égaux », pas « neuf égaux » — mais l'écrire faux invite à recopier une liste close, et
c'est exactement ce que D-474-1 interdit. **Le livrable ne compte aucun paramètre : il compare des
formes effectives.**

### Décisions de conception

- **D-477-1 — `doublons` réutilise l'égalité de `parametresDivergents`, il n'en définit pas une
  autre.** `formeEffective` + `valeurComparable` (STORY-474) portent déjà deux subtilités **mesurées
  en revue** : un échéancier absent vaut le montant récurrent répété (donc `investissements: 5 000 000`
  et `[5 000 000 × 3]` sont le **même** plan), et `tauxTvaPct` absent ne vaut **pas** `0` (absent, le
  taux du paquet fiscal s'applique ; `0` dit « non assujetti »). Une seconde notion d'égalité ferait
  **se contredire deux champs de la même réponse** — « aucun paramètre ne diverge » d'un côté,
  « aucun doublon » de l'autre.
- **D-477-2 — La signature est bâtie sur l'UNION des clés**, comme `parametresDivergents` (D-474-2) :
  un paramètre saisi par un **seul** scénario le distingue des autres. Clés **triées** avant
  concaténation, pour qu'un ordre d'insertion Mongo ne fabrique pas un faux doublon — c'est
  littéralement ce que l'AC-1 demande en écartant « un hachage d'objet dont l'ordre des clés
  varierait ».
- **D-477-3 — Des GROUPES, pas des paires.** Trois scénarios identiques rendent **un** groupe de
  trois, jamais trois paires : l'écran doit dire « ces trois courbes sont superposées », et une liste
  de paires l'obligerait à recomposer la classe d'équivalence.
- **D-477-4 — Ce n'est PAS un refus** (AC-2). Comparer un scénario avec sa copie est l'usage
  légitime qui vérifie qu'une ressaisie est fidèle — précisément le geste que l'absence de
  duplication (STORY-466) impose. Le contrat le **signale**.
- **D-477-5 — `doublons` est un champ à part, et NON un code de `avertissements`.** La fiche de
  STORY-476 annonçait l'inverse (hook D-476-5). Arbitré ici : `avertissements` est un canal de
  **message** (une phrase à afficher), `doublons` est un **constat structuré** qu'un écran consomme
  directement pour griser des courbes superposées. Publier les mêmes identifiants dans les deux
  ferait **deux sources de vérité** pour le même fait. Le hook de 476 reste ouvert pour un
  avertissement qui, lui, n'aura pas de forme propre.
