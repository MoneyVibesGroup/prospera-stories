# STORY-474 : La comparaison ne publie pas les hypothèses des scénarios comparés

Status: done

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 2 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-036** (projection 3 ans, trésorerie 12 mois, scénarios comparés), 2026-08-27.
Relevé en essayant d'écrire la ligne « ce qui distingue ces trois scénarios » du tableau comparatif.

---

## Le fait

`ComparaisonScenario` porte `hypothesesId`, `nom`, `hypothesesVersion`, `base` et les résultats —
**aucun des neuf paramètres**. Le tableau comparatif peut donc afficher que « Prudent 2026 » finit à
−4 092 714 et « Optimiste 2026 » à −2 087 764, mais **pas pourquoi**.

C'est la première question de celui qui regarde deux colonnes côte à côte, et c'est la seule que la
réponse ne permet pas de traiter. L'écran doit émettre **2 à 5 appels** `GET …/bilan/hypotheses/:id`
supplémentaires pour pouvoir écrire « croissance 5 % contre 15 %, financement 0 contre 2 000 000/an ».

Le service **a** les jeux en main : `comparer()` les charge (`this.hypotheses.find({_id: {$in}})`),
lit `jeu.hypotheses` pour projeter, et ne les reporte pas dans la réponse.

## Critères d'acceptation

- [ ] AC-1 — `ComparaisonScenario.hypotheses` porte les neuf paramètres du jeu **dans la version
      utilisée pour la projection** (pas la version courante si elles diffèrent).
- [ ] AC-2 — La réponse porte aussi, au niveau racine, la **liste des paramètres qui diffèrent** entre
      les scénarios comparés (`parametresDivergents: string[]`) : c'est le seul calcul que le serveur
      peut faire mieux que le client, puisqu'il voit tous les jeux d'un coup.
- [ ] AC-3 — Aucun appel supplémentaire n'est nécessaire pour légender la comparaison : un test e2e
      compose la colonne « hypothèses » depuis **une seule** réponse.

## Conséquences ailleurs

- Avec **STORY-473**, ces deux ajouts ramènent la comparaison à **un** appel là où l'écran en fait
  aujourd'hui **1 + 2n**.


---

## Progress Tracking

**Statut : done** — clôturée le 2026-09-08. PR `bilan-service` #106 rebase-mergée sur `dev`.

### ⚡ Deux prémisses de la fiche corrigées AVANT d'écrire

| Affirmation | État réel au 2026-09-08 |
|---|---|
| « les **neuf** paramètres » | **Faux — il y en a 18.** La fiche date du 2026-08-27 ; cinq stories les ont étendus depuis : 459 (durée d'amortissement), 460 (trois échéanciers), 467 (taux d'intérêt), 469 (taux de TVA) et 472 (deux charges fixes + leur échéancier). **Un décompte chiffré dans une fiche se périme en silence** — le dépôt a déjà tranché cette famille sur le contrat d'audit (STORY-471). |
| AC-1 : « dans la version utilisée pour la projection (**pas la version courante si elles diffèrent**) » | **La distinction n'existe pas sur cette route.** `comparer(ids)` ne prend aucun paramètre de version, charge les jeux par `find({_id: {$in}})` et projette `jeu.hypotheses`, c'est-à-dire **toujours la courante** — que `hypothesesVersion` publie déjà. L'AC-1 se réduit donc à publier ce qui a **effectivement** servi, et le sélecteur `?versionHypotheses=` reste propre à `…/:id/projection`. |

### Décisions de conception

- **D-474-1 — Publier l'objet d'hypothèses TEL QU'IL A SERVI**, jamais une recopie champ par
  champ. Une énumération manuelle se périme à la première story qui ajoute un paramètre —
  c'est déjà arrivé cinq fois depuis la rédaction de la fiche — et le champ oublié serait
  **absent sans que rien ne le dise**.
- **D-474-2 — `parametresDivergents` est calculé sur l'UNION des clés présentes**, pas sur
  celles du premier scénario : un paramètre saisi par un seul scénario est précisément une
  divergence, et le lire depuis la référence seule le rendrait invisible.
- **D-474-3 — La comparaison est structurelle, pas textuelle** : deux échéanciers `[1, 2, 3]`
  ne divergent pas, et un champ **absent** face à un champ **à zéro** ne divergent pas non
  plus — absent vaut 0 pour tous les paramètres facultatifs du modèle (D-472-2). Comparer les
  formes brutes signalerait des divergences qui ne changent **aucun chiffre**, sur l'écran
  même qui sert à expliquer les écarts.
- **D-474-4 — La liste est TRIÉE**, pour qu'une réponse soit comparable à une autre et qu'un
  essai ne dépende pas de l'ordre d'itération d'un objet.

### Livré

`ComparaisonScenario.hypotheses` (l'objet tel qu'il a servi, typé `HypothesesDto`) et
`parametresDivergents: string[]` au niveau racine, calculé par l'unité pure
`parametres-divergents.ts`. Aucune écriture en base, aucune route neuve.

### Portes

Lint 0 · build OK · **2 280** essais unitaires · **694** e2e · **6 mutations volontaires, 6 rouges**.

### ⚡⚡ Revue de code — 4 constats, dont un MAJEUR

**Ma normalisation masquait la divergence de `tauxTvaPct`.** J'avais posé « absent vaut 0 » comme
règle générale : vraie de **17 paramètres sur 18**, et fausse du seul qui compte ici. Absent, c'est
le taux du **paquet fiscal** qui s'applique (18 %) ; `0` dit « non assujetti ». Ce sont les deux
seules valeurs qui déplacent les **deux plus gros postes du BFR**.

> Deux scénarios aux trésoreries différentes, tous autres paramètres identiques, et
> `parametresDivergents` rendait **`[]`** : *l'écran dont la raison d'être est d'expliquer pourquoi
> deux colonnes diffèrent taisait précisément le paramètre qui l'explique.*

Et l'erreur **symétrique** : un échéancier absent face au même montant **répété** était signalé,
alors que les deux décrivent le même plan au centime. **Corrigé à la racine** — la comparaison porte
désormais sur ce que le **moteur** utilise, jamais sur la forme écrite en base, et les champs dont
l'absence vaut réellement zéro sont **énumérés un par un**, parce que la règle générale est fausse.

**La garde du tri était VACANTE** (mutation vérifiée par la revue) : retirer le `.sort()` laissait
**361 essais verts**. Deux causes cumulées — mes deux paires étaient **déjà** dans l'ordre
alphabétique selon l'ordre d'insertion des clés, et mon assertion `toEqual([...r].sort())` était la
tautologie exacte de STORY-427/430, vraie de n'importe quelle sortie.

Plus une description **publiée** fausse dans les deux sens (recopiée à trois endroits), et une
assertion e2e toujours vraie (le séparateur venait du `join`, pas des données).

### Revue de sécurité — 0 constat

Mêmes rôles que la route qui publie déjà le même objet, cloisonnement fail-closed inchangé, aucun
champ technique dans le sous-objet publié.
