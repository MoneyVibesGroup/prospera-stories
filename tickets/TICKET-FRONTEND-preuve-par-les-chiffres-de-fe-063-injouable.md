# TICKET-FRONTEND — la « preuve par les chiffres » de FE-063 vise un écran qui n'affiche aucun chiffre

**Cible :** `prospera-frontend-expert-comptable` — `e2e/atelier-scope-dossier.spec.ts`
**Ouvert par :** **FE-061** (barry thierno alhassane, 2026-08-19) — constat de **suite e2e complète**, rejouée sérialisée
**Priorité :** Must — **2 tests sont rouges sur `dev`**, donc toute PR frontend hérite d'une CI rouge
**État :** ⛔ ouvert

---

## Le constat

Deux tests de `atelier-scope-dossier.spec.ts` échouent **de façon reproductible**
(rejoués seuls, `--workers=1`, hors contention) :

```
FE-063 › A → B → A : les balances suivent le dossier, jamais le cabinet
FE-063 › pendant le chargement de B, aucun chiffre de A ne subsiste

  expect(page.getByRole("table").getByText(/452\s?000/)).toBeVisible()
  → Error: element(s) not found
```

**La cause n'est pas une régression** : `balances-list-view.tsx`, sur `origin/dev`
et inchangé depuis, rend six colonnes —

```
exercice · source · version · état · statut de preuve · équilibre
```

— et **aucune ne porte de montant**. Le fichier le dit lui-même en deux endroits :
« pas de total exposé par le service : on ne l'invente pas ». L'assertion cherche
un montant dans la **liste** ; les montants vivent dans le **détail** d'une
balance. Elle ne peut donc pas passer, et n'a jamais passé.

Vérifié aussi côté écran : une capture de la page au moment de l'échec montre
l'Atelier rendu correctement, bandeau de contexte compris, avec la ligne de
balance attendue (exercice 2025, Sage 100, Brouillon, Justifiée, Équilibrée).
**Ce n'est pas l'écran qui est cassé, c'est l'assertion qui vise le mauvais.**

## Pourquoi ça compte plus qu'un test rouge

FE-063 est enregistrée au tracker avec cette affirmation :

> « la bascule A→B est désormais prouvée **PAR LES CHIFFRES** (deux dossiers
> portant des balances réellement différentes, assertions négatives + inspection
> du réseau) »

**C'est exactement l'assertion qui échoue.** Et les assertions négatives voisines
—

```ts
await expect(table.getByText(MONTANT_B)).toHaveCount(0);
```

— passent **par vacuité** : elles ne voient aucun chiffre nulle part, donc elles
seraient vertes même si l'écran affichait le mauvais dossier. La seule preuve
réellement portée aujourd'hui est **l'exercice** (`2025` sous A, `2024` sous B)
et **l'inspection du réseau** (chaque appel porte un `dossierId`) — c'est
solide, mais ce n'est pas ce qui a été consigné.

⚠️ Le « 588/588, aucun test supprimé » consigné pour FE-063 portait sur la suite
**Vitest**. La suite **Playwright** n'a pas été rejouée avant le merge.

## Ce qui est demandé — deux voies, à trancher

1. **Corriger le test** *(test seulement)* : réancrer les assertions sur ce que
   la liste rend (exercice, source, version) et déplacer la preuve chiffrée vers
   un test du **détail** de balance, qui affiche les lignes. ⚠️ Alors la note de
   FE-063 doit être corrigée : la preuve n'est pas « par les chiffres ».
2. **Corriger l'écran** *(produit)* : porter le total de la balance dans la liste
   — `sommaire.mouvements.totalDebit` est servi au contrat. La promesse de FE-063
   devient vraie. ⚠️ Exige une passe de maquette : la liste dense a été validée
   sans colonne de montant.

**FE-061 n'a délibérément touché à aucune des deux.** L'absorber aurait masqué
qu'une story a été mergée sur une preuve qu'elle n'avait pas — et c'est
précisément le genre de constat qui doit rester visible.

## Note connexe

`atelier-saisie.spec.ts:169` a aussi échoué **dans la suite complète**, mais
**passe seul** : c'est de la contention de poste (même famille que la
sérialisation exigée pour Vitest), pas un défaut. Ne pas le confondre avec les
deux ci-dessus.
