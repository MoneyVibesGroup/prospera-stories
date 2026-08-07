# TICKET-BACKEND — les **dates de disponibilité cible** d'un module ne sont servies par aucune route

**Cible :** `platform-catalog-service` (:3003)
**Ouvert par :** **AP-22** (barry thierno alhassane, 2026-08-07) — conséquence directe d'un **arbitrage PO**
**Priorité :** Could — rien n'est cassé, mais un contrôle de la console reste sans effet tant que ce ticket n'est pas repris
**État :** ⛔ ouvert

---

## Pourquoi ce ticket existe

Ce n'est pas une découverte d'intégration : l'écart était **déjà tracé** dans `catalog-client.ts`
depuis AP-INT-0, en toutes lettres.

```ts
// src/features/catalog/api/catalog-client.ts — écart nº4
// | 4 | `CatalogModule.targets` (scénarios t3/t5/t7) | **n'existe pas** | invention front — jamais servi |
```

Ce que AP-22 ajoute, c'est **l'arbitrage**. La règle PO du 2026-08-06 — « je ne veux pas voir dans le
code frontend un truc affiché s'il n'y a pas d'API, sauf si la story backend n'est pas présente » —
laissait deux issues : retirer le sélecteur de scénario, ou le garder en nommant le contrat absent.

**Le PO a tranché le 2026-08-07 : option B — on le garde.** Et l'option B a un prix, qui est
précisément ce ticket : *« conserve l'intention visible, mais impose d'ouvrir une story backend pour
`targets` »*. Le ticket est donc la moitié backend d'une décision déjà prise, pas une demande neuve.

## Le constat

`ModuleResponseDto` ne porte pas `targets`. `toCatalogModule` ne peut donc rien en faire :

```ts
// catalog-client.ts:80-88
function toCatalogModule(dto: ModuleDto): CatalogModule {
  return { code, name, description, status, organizations: undefined };
}
```

Conséquence à l'écran, **sur données réelles** : la colonne « Cible » est vide pour les 18 modules,
dans les trois scénarios. Le sélecteur `t3/t5/t7` change la note explicative et **rien d'autre**.

⚠️ Ce n'était visible d'aucun test avant AP-22 : les fixtures, elles, portent `targets`. Deux tests
de `catalog-view.test.tsx` vérifiaient même que les dates « se recalculent » d'un scénario à
l'autre — ils passaient au vert sur une donnée que la production ne sert jamais. Ils ont été
réécrits.

## Ce que la console fait en attendant

Elle **le dit**. Un encart nomme le contrat manquant au-dessus des tables, et une constante unique
(`TARGETS_SERVED`, dans `src/features/catalog/types.ts`) commande toutes les lectures :

```ts
export const TARGETS_SERVED = false;
```

⇒ **Le jour où ce ticket est repris, la reprise côté console tient en une ligne** : passer la
constante à `true`. Les trois lectures se rallument, l'encart disparaît de lui-même. C'est
délibérément le seul point de bascule — il y avait auparavant six `mod.targets?.[scenario]` dispersés
dans trois fichiers.

## ⚠️ La question à trancher AVANT d'écrire la moindre route

**Ces dates ont-elles leur place dans le catalogue ?**

Le catalogue décrit ce qui est **octroyable aujourd'hui**. Or `targets` décrit une **feuille de route
de recrutement** : `t3`, `t5`, `t7` sont trois hypothèses d'effectif (3, 5 ou 7 personnes), et les
dates qu'elles produisent sont des projections internes — jamais des engagements client.

Loger une donnée de planification RH dans le service qui décide de ce qu'une organisation peut
activer, c'est mélanger deux autorités qui n'ont ni le même cycle de vie, ni le même public, ni le
même niveau de confidentialité. **Une roadmap de recrutement n'a rien à faire dans une réponse d'API
lue par une console d'exploitation.**

⇒ **Recommandation de l'auteur : ne PAS ajouter `targets` à `ModuleResponseDto`.** Si le besoin de
planification est réel, il mérite son propre objet (et probablement son propre service), avec sa
propre garde d'accès. Ce ticket peut donc parfaitement se refermer sur un **« non »** argumenté — ce
serait une issue légitime, et il faudrait alors revenir devant le PO pour repasser à l'option A
(retrait du sélecteur).

## Ce qu'il faudrait, si la réponse est « oui »

- `ModuleResponseDto.targets?: { t3: string; t5: string; t7: string }` — trois dates, ou aucune.
- Le champ doit être **facultatif et absent** pour un module livré : une date cible sur un module
  déjà `ACTIVE` n'a pas de sens, et l'écran ne l'affiche que pour un module `PLANNED`.
- ⚠️ **Format** : la console rend la valeur telle quelle (« janvier 2027 »). Si le service envoie une
  date ISO, c'est le front qui devra la mettre en forme — à décider ici, pas à découvrir à l'écran.

## Ce que ça débloque

Rien de bloqué aujourd'hui. C'est l'honnêteté d'un écran, pas une fonction manquante — et c'est
pourquoi la priorité est `Could`. Le coût de l'inaction est borné et **visible** : l'encart reste.

---

## Traçabilité

- Story d'origine : **AP-22** (`prospera-stories/frontend-stories/AP-22.md`)
- Décision PO : 2026-08-07, option B (§ « Décision PO » de la story)
- Point de bascule console : `TARGETS_SERVED` — `frontend-admin-panel/src/features/catalog/types.ts`
- Écart d'origine : `catalog-client.ts`, tableau des écarts de contrat, ligne nº4
