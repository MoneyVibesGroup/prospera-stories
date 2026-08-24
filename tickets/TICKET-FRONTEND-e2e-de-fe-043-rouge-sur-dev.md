# TICKET FRONTEND — `atelier-cahier-recettes.spec.ts` est ROUGE sur `dev` : 5 tests sur 8

**Ouvert le** 2026-08-24 par **FE-044**, en faisant tourner son propre E2E.
**Dépôt** `prospera-frontend-expert-comptable` · **Story concernée** FE-043
**Gravité** — la suite E2E de `dev` ne peut pas passer au vert tant que ce ticket est ouvert.

---

## Le fait, MESURÉ (pas déduit)

Sur `origin/dev` en **detached HEAD**, sans une ligne de FE-044 dans l'arbre :

```
npx playwright test e2e/atelier-cahier-recettes.spec.ts --workers=1
  5 failed
  3 passed (5.8m)
```

Les **mêmes 5** échouent avec FE-044 appliquée. ⇒ **FE-044 n'y est pour rien**, et
c'est pour l'établir que la mesure a été faite plutôt que raisonnée.

⚠️ **Deux premières tentatives de mesure n'ont RIEN mesuré**, et le piège vaut d'être
écrit : lancées depuis `MoneyVibes_Apps` (la racine, qui n'est **pas** un dépôt git et
n'a **pas** de `playwright.config.ts`), elles produisaient
`Error: Playwright Test did not expect test.describe() to be called here` +
`No tests found`, **et un `exit 1`**. Un `exit 1` sans ligne `passed`/`failed` n'est pas
un rouge de test : c'est **une absence de mesure**. Le `git stash` de ces tentatives
avait échoué au même endroit, silencieusement, en court-circuitant le `&&`.

---

## Pourquoi ces tests n'ont JAMAIS pu passer

Ce ne sont pas des régressions : ce sont **deux défauts d'écriture**, présents depuis
la rédaction du spec.

### ① Le fixture rend le sélecteur ambigu (1 test)

```ts
await expect(page.getByRole("cell", { name: "701", exact: true })).toBeVisible();
```

`ligne()` pose `compteProduit: "701"` par défaut, et **les deux lignes de `LIGNES_MARS`
le gardent**. Le mode strict de Playwright résout donc **2 cellules** et échoue —
quelle que soit la qualité de l'écran.

### ② `getByRole("alert")` attrape l'annonceur de route de Next (4 tests)

```
strict mode violation: getByRole('alert') resolved to 2 elements:
  1) <div role="alert" class="… border-amber-500/40 …">…</div>
  2) <div role="alert" aria-live="assertive" id="__next-route-announcer__"></div>
```

`__next-route-announcer__` est monté par Next sur **chaque** page. Vide, mais bien
présent, et porteur du rôle `alert`. Tout `getByRole("alert")` non filtré échoue.

⇒ Correctif appliqué dans `atelier-cahier-depenses.spec.ts` (FE-044), à reprendre ici :

```ts
const alerte = page.getByRole("alert").filter({ hasText: "L’exercice est clos" });
await expect(alerte).toBeVisible();
```

---

## Ce que ça dit du process, et qui est le vrai sujet

**FE-043 a été mergée sans que son E2E soit exécuté.** Son message de livraison
revendique, mot pour mot : *« `tsc` vert · lint vert · build vert · 126 fichiers / 1211
tests unitaires verts »* — **jamais** les E2E. Les 5 échecs sont structurels : une seule
exécution les aurait montrés.

⚠️ **C'est la DEUXIÈME occurrence du même motif dans ce dépôt**, après
`TICKET-FRONTEND-preuve-par-les-chiffres-de-fe-063-injouable.md` — une story mergée sur
une preuve qu'elle n'avait pas. La règle `e2e-playwright.md` dit pourtant : *« Un tel
epic n'est pas “done” sans son E2E vert. »*

⇒ Le correctif de fond n'est pas dans ces 5 assertions : c'est que **le job `e2e` de la
CI ne bloque pas le merge**, ou qu'il n'a pas tourné. À vérifier avant de refermer.

---

## Pourquoi FE-044 ne l'a pas corrigé elle-même

Toucher les assertions d'acceptation d'une **autre** story, sans son auteur ni le PO,
c'est décider à leur place de ce que l'écran doit prouver — en particulier sur les deux
`409` dont la distinction est **l'invariant central de FE-043** (⇒ STORY-393). La règle
posée par FE-062 s'applique : **un gate qu'on ne peut pas jouer se TRANSMET, il ne se
coche pas.**

Le travail est petit (un fixture, quatre sélecteurs) mais il appartient à FE-043.

---

## À faire

- [ ] Différencier les `compteProduit` du fixture `LIGNES_MARS`, ou lever l'ambiguïté du
      sélecteur.
- [ ] Filtrer les 4 `getByRole("alert")` sur leur texte attendu.
- [ ] Rejouer `npx playwright test e2e/atelier-cahier-recettes.spec.ts` **depuis
      `prospera-frontend-expert-comptable`** et exiger `8 passed`.
- [ ] Vérifier **pourquoi** le job `e2e` de la CI n'a pas bloqué le merge de FE-043.
