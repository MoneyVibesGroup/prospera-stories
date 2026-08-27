# STORY-433 : Le tableau des flux ne publie qu'une seule colonne — `PosteTft` n'a pas de `montantN1`, alors que le formulaire déposé en a deux

Status: ready-for-dev

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
