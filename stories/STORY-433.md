# STORY-433 : Le tableau des flux ne publie qu'une seule colonne — `PosteTft` n'a pas de `montantN1`, alors que le formulaire déposé en a deux

Status: in_progress

**Épic :** EPIC-010 — États financiers (`bilan-service`)
**Service :** `bilan-service` (`:3004`) — `etats/tft.types.ts`, `dto/tft-response.dto.ts`, `etats/tft-production.service.ts`
**Points :** 3 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-033** (TFT/TAFIRE, notes annexes, contrôles de cohérence), 2026-08-27.
Vérifié contre la DSF déposée `1000745307_2025_Definitif (1).xlsx`, feuille *« TFT »*.

---

## Le fait

```ts
export interface PosteTft {
  etat: 'TFT'; code: string; libelle: string; note: string | null;
  montantN: number | null;      // ← et rien d'autre
  statut: StatutLigneTft;
}
```

La feuille *« TFT »* de la liasse déposée porte **`EXERCICE 2025` et `EXERCICE 2024`**, comme
le Bilan et le compte de résultat. Sur l'entité examinée, la colonne N-1 est **alimentée**
(`ZA` 427 364, `FA` −1 557 920, `FC` 3 500 000, `ZB` 369 000, `ZG` 369 000, `ZH` 796 364).

Ce n'est pas un manque de données : `POST …/bilan/etats/tft/dry-run` reçoit **déjà**
`soldesN1` dans son corps, `contexteMultiEtats` peuple **déjà** la colonne N-1 de tout le
contexte (« *les colonnes N-1 sont peuplées partout : les modes `VARIATION`/`VALEUR_N_1` en
dépendent* »), et `EvaluateurFormuleService` rend **déjà** un `valeurN1`. Le service le
**calcule** puis le **jette** : `MONTANT.set(r.poste, r.valeurN)`.

⚠️ Un flux N-1 n'est pas la variation N-1 → N-2 recalculée à la volée : il faut **trois**
jeux de soldes pour le produire honnêtement, ou bien accepter que la colonne N-1 du TFT ne
soit servie **que** lorsque `soldesN2` est fourni. **C'est la question à trancher**, et elle
doit l'être avant de coder : publier un `montantN1` faux serait pire que ne rien publier.

## Critères d'acceptation

- [ ] AC-1 — `PosteTft` porte `montantN1: number | null`. `null` = « non produit » ; `0` =
      « produit, et il vaut zéro » (convention FE-031, inchangée).
- [ ] AC-2 — Les lignes dont la valeur N-1 **est** dérivable des seuls `soldesN`/`soldesN1`
      (ancres `ZA`, et toute ligne sans mode `VARIATION`) la publient. Les lignes en mode
      `VARIATION` rendent `montantN1: null` **tant que** `soldesN2` n'est pas fourni — jamais 0.
- [ ] AC-3 — `BilanDryRunRequestDto` accepte un `soldesN2` **optionnel**. Fourni, il alimente
      la colonne N-1 complète ; absent, AC-2 s'applique. Aucun comportement existant ne change.
- [ ] AC-4 — `tresorerieOuvertureN1` / `tresorerieClotureN1` suivent la même règle.
- [ ] AC-5 — Test : sans `soldesN2`, `postes.every(p => p.montantN1 === null || modeNonVariation)` ;
      avec `soldesN2`, `ZG(N-1)` est calculé et `ZH(N-1) = ZG(N-1) + ZA(N-1)`.
- [ ] AC-6 — Non-régression `sfd-bceao@2.0` : `postes: []`, rien ne change.

## Conséquences ailleurs

- **FE-033** dessine la colonne et l'annonce **non servie** : c'est le seul écart de la maquette
  qui se voit d'un coup d'œil (une colonne entière de « — »).
- Même famille que **STORY-427** (le compte de résultat ne permet pas de rendre la liasse légale)
  et **STORY-430** (le comparatif n'est ni ordonné, ni daté, ni duré) : sans STORY-430, un
  `soldesN2` non identifié aggraverait le problème au lieu de le résoudre. **Les instruire ensemble.**

---

## Progress Tracking

**Statut : `in_progress`** — branche `MNV-433` ouverte sur `bilan-service` (base `dev`), flux
APEX-PROSPERA lancé le 2026-09-02.

### La question à trancher, tranchée sur MESURE — et l'AC-2 se trompe sur `ZA`

Inventaire des **21 lignes `FORMULE` du TFT** de `syscohada-revise@2.1`, par mode d'opérande :

| mode | lignes | N-1 dérivable de `soldesN`/`soldesN1` seuls ? |
|---|---|---|
| `VALEUR_N_1` | **1** — `ZA` | ❌ **non** |
| `VARIATION` | 11 — `FB FC FD FE FF FG FH FK FL FO FP` | ❌ non (il faut N-2) |
| `VALEUR` | 9 — `FA FI ZB ZC ZD ZE ZF ZG ZH` | ⚠️ **seulement `FA` et `FI`** |

⛔ **L'AC-2 écrit « (ancres `ZA`, et toute ligne sans mode `VARIATION`) ». C'est faux deux fois.**

1. **`ZA` est justement la ligne la moins dérivable** : son mode est `VALEUR_N_1` (trésorerie de
   clôture N-1 lue sur `BT`/`DT`). Sa colonne **N-1** est donc la trésorerie de clôture **N-2** —
   elle exige `soldesN2`, exactement comme les lignes `VARIATION`.
2. **« sans mode `VARIATION` » ne suffit pas** : les sept **Z-sous-totaux** (`ZB ZC ZD ZE ZF ZG ZH`)
   sont en mode `VALEUR`, mais leurs opérandes sont **d'autres lignes du TFT**, dont des lignes
   `VARIATION`. Leur N-1 est donc indéterminée par propagation.

**Seules `FA` (CAFG, lue sur le compte de résultat) et `FI` (cessions) ont un N-1 dérivable
sans `soldesN2`.** Le critère opérationnel n'est pas « le mode de la ligne » mais **la propagation**
— et le moteur la fait déjà : `EvaluateurFormuleService.sommeSignee` rend `null` dès qu'une opérande
rend `null`, et la réinjection en cascade **conserve** ce `null`. `r.valeurN1` implémente donc
l'AC-2 **exactement**, sans une ligne de règle en plus.

### Périmètre retenu

1. **AC-1/AC-2** — `montantN1` alimenté par `r.valeurN1` de la cascade courante quand `soldesN2` est
   absent : **`null` partout sauf `FA` et `FI`**, jamais `0`.
2. **AC-3** — `soldesN2` optionnel sur `BilanDryRunRequestDto` ; fourni, la colonne N-1 complète est
   produite en rejouant la chaîne sur `(soldesN1, soldesN2)` et en prenant sa **colonne N**. C'est
   la seule façon honnête : un flux est une variation, pas un solde.
3. **AC-4** — `tresorerieOuvertureN1` / `tresorerieClotureN1` suivent la même règle.
4. ⚠️ **`exerciceN2`, exigé par la Vigilance de la fiche** (« sans STORY-430, un `soldesN2` **non
   identifié** aggraverait le problème ») : STORY-430 est livrée, et sa garde de chronologie porte
   sur `exerciceN`/`exerciceN1`. Un `soldesN2` **sans borne** rejouerait à une colonne de distance
   ce que 430 a fermé — rien n'empêcherait de passer l'exercice **N** comme N-2 et de publier un
   flux N-1 absurde. `exerciceN2` optionnel entre donc au corps et à la garde.
5. **AC-6** — non-régression `sfd-bceao@2.0` à mesurer, pas à supposer.
