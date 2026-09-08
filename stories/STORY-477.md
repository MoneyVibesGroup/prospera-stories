# STORY-477 : Deux jeux d'hypothèses aux neuf paramètres identiques sont comparés sans un mot

Status: done

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

**Statut : done** — clôturée le 2026-09-08. PR `bilan-service` #109 rebase-mergée sur `dev`.

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
  un paramètre saisi par un **seul** scénario le distingue des autres. ⛔⛔ **C'est cette liste
  PARTAGÉE — et rien d'autre — qui rend la signature immune à l'ordre des clés**, ce que l'AC-1
  exige en écartant « un hachage d'objet dont l'ordre des clés varierait » : toutes les signatures
  d'un même appel sont construites sur elle, jamais sur `Object.entries` de chaque objet.
  ⚠️ **Rédaction corrigée** : la première attribuait le mérite à un `.sort()` sur cette liste.
  Mesuré par mutation, ce tri **ne gardait rien** — il a été retiré plutôt que laissé se faire
  passer pour la garantie, et deux documents de la même story auraient sinon désigné deux
  mécanismes opposés (patron STORY-432/400).
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

### Livré

`doublons: [{ hypothesesIds }]` publié dans tous les cas, vide quand tous les scénarios diffèrent, et
bâti sur la **même** égalité que `parametresDivergents`. `groupesIdentiques` est une fonction pure de
`parametres-divergents.ts` : aucune écriture en base, aucun calcul de projection nouveau.

### Portes

Lint 0 · build OK · **2 303** essais unitaires · **703** e2e · couverture 99 / 94,56 / 99,31 / 99,05 ·
**6 mutations volontaires, 6 rouges** — plus une septième, **verte**, qui a fait retirer du code mort.

### ⚡ Une justification fausse, trouvée par mutation avant la revue

D-477-2 attribuait l'immunité à l'ordre des clés à un `.sort()` sur la liste de l'union. **Mesuré : le
retirer ne fait rougir aucun essai.** La garantie vient de `unionDesCles`, qui donne à **toutes** les
signatures d'un même appel la **même** liste de clés — le tri n'y ajoute rien. Il est retiré plutôt
que laissé se faire passer pour la garantie, et la mutation qui bâtit la signature sur l'ordre propre
de chaque objet, elle, vire bien au rouge.

### ⚡⚡ Revue de code — 3 constats, dont un bloquant

**⛔⛔ La description PUBLIÉE promettait des CHIFFRES, alors que le champ ne compare que des
PARAMÈTRES.** Elle annonçait « mêmes chiffres, courbes superposées, tous les écarts à zéro ». Or
`groupesIdentiques` ne reçoit que des `Hypotheses` — **jamais la base**. Deux scénarios aux mêmes
paramètres ancrés sur deux **versions figées** différentes de la même liasse, c'est-à-dire le cas que
`?autoriserBasesHeterogenes=true` autorise **depuis la veille** (STORY-476), sont un doublon **et**
ont des écarts non nuls : leurs projections partent de bilans différents. Un écran qui grise une
courbe sur ce seul champ **cacherait une courbe réellement différente** — le défaut « graphe
parfaitement lisible et parfaitement faux » que STORY-476 venait de fermer, réintroduit par une
phrase de contrat.

⚠️ **Aucune batterie ne pouvait le montrer**, et c'est le vrai enseignement : la fixture e2e rendait
la **même** liasse pour les deux identifiants de snapshot. Les écarts d'une comparaison forcée
sortaient donc à zéro **par construction du double**, jamais par le calcul — la seule chose qui aurait
contredit la description était rendue impossible par la fixture. Fixture corrigée (la v3 porte
d'autres chiffres), essai du cas ajouté.

**⚡ La fiche contredisait le code sur D-477-2** — elle décrivait encore le `.sort()` retiré. Deux
documents de la même story désignaient deux mécanismes opposés comme la garantie de l'AC-1 (patron
STORY-432/400).

**⚡ L'assertion e2e de l'AC-3 verrouillait l'ARITÉ des écarts, pas leur nullité.**
`expect(Object.values(e)).toEqual([0, 0, 0, 0, 0, 0])` mesurait aussi « il y a exactement six
mesures ». La prochaine story qui en ajoute une (STORY-475 en a ajouté quatre d'un coup) aurait fait
rougir l'essai sur une longueur de tableau, et la correction mécanique — rallonger le littéral —
n'oblige personne à vérifier que la **nouvelle** mesure sort bien à zéro. Chaque écart est désormais
confronté à zéro **par son nom**.

### Revue de sécurité — 0 constat

Le champ ne publie **rien de neuf** : chaque scénario publie déjà l'intégralité de ses paramètres dans
la même réponse depuis STORY-474, donc un client pouvait recalculer les groupes lui-même. Aucun
oracle : un identifiant hors portée fait rendre **404** sur la requête entière, jamais de réponse
partielle. La collision de signature par les séparateurs `|` et `=` est constructible dans l'absolu
mais **inatteignable** — aucun champ d'`Hypotheses` n'est une chaîne, et `forbidNonWhitelisted`
refuse toute clé étrangère au DTO avant persistance. Et le calcul est borné de bout en bout
(`@ArrayMaxSize(5)`, échéanciers tronqués à l'horizon).

### Vérification en réel (docker)

Quatre jeux semés, dont un portant les mêmes valeurs dans un **ordre de clés inversé** en base :

| Cas | Résultat |
|---|---|
| « Optimiste 2026 » + « Optismiste 2026 » (ordre de clés inversé) | un groupe · `parametresDivergents: []` · **zéro** écart non nul |
| trois ressaisies identiques | **un** groupe de trois, jamais trois paires |
| deux jeux qui divergent | `doublons: []` · 21 écarts non nuls |
| un doublon + un intrus | le groupe ne contient **que** les deux |
| **doublon de paramètres sur deux bases différentes, forcé** | un groupe · `baseHomogene: false` · **écarts non nuls** — le cas que la description promettait à tort impossible |
