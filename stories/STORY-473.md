# STORY-473 : La comparaison ne publie aucune série mensuelle — le graphe comparatif coûte un appel par scénario

Status: ready-for-dev

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
