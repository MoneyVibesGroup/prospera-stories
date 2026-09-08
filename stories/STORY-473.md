# STORY-473 : La comparaison ne publie aucune série mensuelle — le graphe comparatif coûte un appel par scénario

Status: done

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 3 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-036** (projection 3 ans, trésorerie 12 mois, scénarios comparés), 2026-08-27.
Relevé en transcrivant `comparaison.service.ts` puis en essayant d'en tirer le « graphe comparatif » que la story FE-036 demande.

---

## Le fait

`ComparaisonMensuel` porte **quatre scalaires** :

```ts
{ tresorerieMinimale, moisTresorerieMinimale, moisTresorerieNegative, tresorerieCloture12 }
```

Le service a pourtant **calculé les douze clôtures** pour les produire — `comparer()` appelle
`ProjectionMensuelleService.projeter()` par scénario, lit `periodes.map(p => p.tresorerieCloture)`,
en extrait un minimum, un rang et un compte, puis **jette la série**.

Conséquence directe sur l'écran : le critère d'acceptation « comparaison de ≥ 2 scénarios (tableau
**et graphe**) » ne peut pas être servi par `GET …/previsionnel/comparaison` seul. Pour tracer la
courbe comparée des 12 mois il faut **un appel `…/:id/projection-mensuelle` par scénario** — trois de
plus sur le dossier de démonstration, cinq au maximum du contrat — et le front recompose ce que le
serveur venait de produire. Sur un écran dont la story exige un **recalcul réactif** à chaque édition
d'hypothèses (NFR-006, < ~2 s), c'est le facteur de coût dominant.

## Critères d'acceptation

- [ ] AC-1 — `ComparaisonMensuel` porte `clotures: number[12]` (les soldes de clôture, dans l'ordre
      des mois). Les quatre scalaires existants sont **conservés** : ils restent le résumé.
- [ ] AC-2 — La série est celle **exactement** dont les scalaires sont dérivés : `min(clotures)`,
      `indexOf(min)+1`, `filter(c => c < 0).length`, `clotures[11]` — vérifié par un test qui
      re-dérive les quatre depuis la série publiée.
- [ ] AC-3 — Le contrat OpenAPI type le tableau (`@ApiProperty({ type: [Number] })`) — sans quoi les
      types générés le rendent en `Record<string, never>`, le patron déjà relevé par STORY-398.
- [ ] AC-4 — Aucun appel supplémentaire n'est nécessaire pour tracer la courbe comparée : un test e2e
      trace les trois séries depuis **une seule** réponse.

## Conséquences ailleurs

- Publier la série ne coûte **rien** de plus au serveur : elle est déjà en mémoire.
- Si la charge de la réponse devient un sujet (5 scénarios × 12 nombres = 60 entiers), un paramètre
  `?detail=mensuel` serait préférable à l'omission — mais 60 entiers ne sont pas un sujet.


---

## Progress Tracking

**Statut : done** — clôturée le 2026-09-08. PR `bilan-service` #105 rebase-mergée sur `dev`.

### Prémisses vérifiées dans le code AVANT d'écrire

**La fiche est exacte, au mot près.** `comparaison.service.ts` calcule bien
`clotures = mensuelComplet.periodes.map(p => p.tresorerieCloture)`, en tire les quatre
scalaires, puis **laisse tomber la série**. Publier ce que l'on vient de produire ne coûte
rien : elle est en mémoire.

### Décisions de conception

- **D-473-1 — Les quatre scalaires sont CONSERVÉS** (AC-1). Ils sont le **résumé** de la
  série, pas son substitut : un client qui n'a besoin que du creux ne doit pas avoir à le
  recalculer, et `ecarts.mensuel` continue de porter le seul écart de trésorerie minimale.
- **D-473-2 — `type: [Number]` explicite au contrat** (AC-3), et ce n'est pas décoratif :
  sans lui `@nestjs/swagger` publie le tableau en `object` opaque, qu'un client généré type
  `Record<string, never>`. Le champ serait **servi mais illisible**, et la story n'aurait
  rien livré — patron relevé par STORY-398 puis STORY-432.
- **D-473-3 — Aucun paramètre `?detail=mensuel`.** La fiche l'envisage si la charge devenait
  un sujet ; 5 scénarios × 12 entiers n'en est pas un, et une option de format qu'aucun
  appelant ne demande est une flexibilité à maintenir sans preneur.

### Livré

`ComparaisonMensuel.clotures: number[12]`, publiée par scénario, typée `[Number]` au contrat.
Les quatre scalaires sont conservés. **Aucune écriture en base, aucune route neuve, aucun calcul
supplémentaire** : la série était déjà en mémoire.

### Portes

Lint 0 · build OK · **2 268** essais unitaires · **691** e2e · **3 mutations volontaires, 3 rouges**.

### ⚡⚡ Revue de code — 4 constats, dont mon filet d'AC-3 au mauvais niveau

**Le filet d'AC-3 ne mesurait pas le contrat.** Il lisait `res.body` — ce que le **service**
produit — alors que le DTO de réponse est l'identité et que cette batterie ne monte aucun
sérialiseur : le décorateur `@ApiProperty` n'avait **aucune influence** sur ce qu'il vérifiait.
Retirer `type: [Number]` le laissait **vert**. C'est le même défaut de niveau que STORY-470, deux
stories plus tôt. Le filet interroge désormais le **document publié**.

**Et ma justification publiée était fausse**, ce qui orientait le diagnostic à l'envers : elle
annonçait un `object` opaque, donc désignait implicitement l'inventaire des opaques comme filet.
**Mesuré** : la dégradation réelle est `items: { type: 'string' }` — un `string[]` — et cet
inventaire reste **vert** dessus. C'est le patron STORY-427, pas STORY-398.

**Les fixtures du contrôleur contredisaient l'invariant** que la PR publie : douze zéros à côté
d'un minimum de 12 229 164. C'est la seule réponse complète du dépôt ; recopiée, elle aurait rendu
**rouge un code juste**.

**Et l'essai e2e nommait « trois séries » pour deux scénarios aux hypothèses identiques** : les
deux séries étaient égales, donc la boucle ne distinguait pas « chacun publie la sienne » de
« celle de référence recopiée ».

### Revue de sécurité — 0 constat

Aucune route ni garde ajoutée ; la série est celle du scénario déjà servi au même appelant sous les
mêmes rôles ; `ids` est borné à 5 sans doublons ; aucun moteur ni accès base supplémentaire.

### Vérification en réel

Deux scénarios, **12 points chacun**, séries **différentes**, et les quatre scalaires se
**re-dérivent exactement** de la série publiée.
