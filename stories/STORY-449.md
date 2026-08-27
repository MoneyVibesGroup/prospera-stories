# STORY-449 : `GET /bilan/etats/:id` RE-CALCULE la liasse d'un jeu VALIDÉ au lieu de rendre son snapshot — deux nombres pour un même état figé

Status: ready-for-dev

**Épic :** EPIC-012 — Validation, immutabilité, exercices, audit
**Service :** `bilan-service`
**Points :** 3 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-034** (cycle brouillon → validé, snapshot immuable, piste d'audit), 2026-08-27.
Relevé en lisant les contrôleurs de `bilan-service` sur `origin/dev`.

---

## Le fait

`JeuEtatsService.consulter()` fait, **quel que soit le statut** :

```ts
const jeu = await this.chargerParId(id);
const liasse = await this.produireLiasse(organizationId, jeu);   // ← re-production
const dernier = jeu.statut === VALIDE ? await this.snapshots.dernier(jeu._id) : null;
return { jeu, liasse, version: dernier?.version ?? null };
```

La réponse porte donc `statut: 'VALIDE'`, `version: 2` — **et une liasse recalculée à l'instant**,
pas celle qui a été figée. Tant que le paquet référentiel ne bouge pas, les deux coïncident. Le jour
où l'administrateur publie une révision du paquet (D12 : les référentiels sont administrables),
`GET /:id` rend des chiffres **différents du snapshot**, sous un badge « VALIDÉ », **sans que rien
ne le signale**.

C'est le mode de panne le plus coûteux de la série : plausible, silencieux, et il contredit
l'invariant que la story vend (NFR-004).

## Critères d'acceptation

- [ ] AC-1 — Pour un jeu `VALIDE`, `GET …/etats/:id` rend la **liasse du dernier snapshot**, jamais
      une re-production.
- [ ] AC-2 — La réponse porte `origine: 'SNAPSHOT' | 'CALCUL'` : le client doit pouvoir savoir ce
      qu'il regarde sans déduire du statut.
- [ ] AC-3 — Un jeu `BROUILLON` continue d'être produit à la volée (`origine: 'CALCUL'`) —
      c'est la définition d'un brouillon.
- [ ] AC-4 — Un jeu `VALIDE` **sans** snapshot (donnée antérieure, incohérence) → `500` explicite,
      **jamais** un repli silencieux sur le calcul.
- [ ] AC-5 — Un test **de non-régression du référentiel** : figer une version, changer la version du
      paquet, relire — les chiffres sont **identiques** et `origine: 'SNAPSHOT'`.

## Conséquences ailleurs

- **Actionnable côté front dès aujourd'hui, sans backend** : lire une liasse VALIDÉE depuis
  `GET …/versions/:version`, jamais depuis `GET …/etats/:id`. C'est la règle d'appel que FE-034
  inscrit et que la maquette écrit à l'écran.
- Même famille que **STORY-452** (le snapshot n'a pas d'empreinte de son contenu) : sans elle, rien
  ne permettrait même de **constater** la divergence.
