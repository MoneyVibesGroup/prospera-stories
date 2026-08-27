# STORY-435 : Le squelette TFT du paquet n'est pas le formulaire déposé — ni rubriques, ni ligne de besoin de financement, ni ligne de contrôle, ni renvois A…H

Status: ready-for-dev

**Épic :** EPIC-010 — États financiers (`bilan-service`)
**Service :** `bilan-service` (`:3004`) — paquet référentiel + `scripts/referentiels`, `referentiel-package.interface.ts`
**Points :** 3 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-033** (TFT/TAFIRE, notes annexes, contrôles de cohérence), 2026-08-27.
Vérifié contre la DSF déposée `1000745307_2025_Definitif (1).xlsx`, feuille *« TFT »*.

---

## Le fait

Le paquet déclare **26 postes** `etat: 'TFT'` (en-tête comprise). Le formulaire déposé en
compte **31 lignes**, et les cinq manquantes ne sont pas décoratives :

| Manque | Ce qu'on perd |
|---|---|
| 4 **intitulés de rubrique** (« Flux de trésorerie provenant des activités opérationnelles », « …d'investissements », « …du financement par les capitaux propres », « Trésorerie provenant du financement par les capitaux étrangers ») | l'état devient une liste de 25 lignes sans structure |
| la ligne **« Variation du BF lié aux activités opérationnelles (FB+FC+FD+FE) »** | le sous-total métier du besoin en fonds de roulement |
| la ligne **« Contrôle : Trésorerie actif N − Trésorerie passif N »** en pied | **le contrôle que le formulaire porte lui-même** |
| les **renvois `A`…`H`** sur les huit lignes `Z` (`note` vaut `null` sur les **26** postes) | les libellés « *somme FA à FE* », « *(B+C+F)* », « *(G+A)* » deviennent **illisibles** : rien ne dit quelle ligne est `B` |
| le **renvoi de bas de page `(1)`** | `FB` et `FE` portent l'appel « (1) » dans leur libellé et renvoient à une note **qui n'existe pas** — or elle énonce la règle d'exclusion des créances d'investissement |

## Critères d'acceptation

- [ ] AC-1 — `PosteEtat` gagne un `type: 'RUBRIQUE' | 'LIGNE' | 'CONTROLE'` (défaut `'LIGNE'`,
      rétrocompatible). Les rubriques n'ont ni montant ni opérandes ; le moteur ne les évalue pas.
- [ ] AC-2 — Le paquet `syscohada-revise@2.1` gagne les 4 rubriques, la ligne de BF (avec ses
      opérandes `FB+FC+FD+FE`) et la ligne de contrôle (opérandes : postes marqués `tresorerie`),
      **dans l'ordre du formulaire** — c'est-à-dire dans `pkg.postes`.
- [ ] AC-3 — Les huit postes `Z` portent leur `note` (`A`…`H`).
- [ ] AC-4 — Le paquet porte les **renvois de bas de page** de l'état (`renvois: {"1": "À
      l'exclusion des variations des créances et dettes liées aux activités d'investissement…"}`),
      pour que l'appel « (1) » des libellés de `FB`/`FE` ait une cible.
- [ ] AC-5 — Un test **de forme** : la suite des codes de `pkg.postes` filtrée sur `etat: 'TFT'`
      égale la constante extraite du formulaire. Il échoue si quelqu'un réordonne le paquet.
- [ ] AC-6 — Agnosticisme P7 : un référentiel sans TFT (`sfd-bceao@2.0`) est inchangé.

## Conséquences ailleurs

- Même famille que **STORY-427** (ordre légal, lignes à zéro, colonne Note du compte de résultat)
  et **4ᵉ occurrence** de « l'ordre légal ne vit que dans `pkg.postes`, qu'aucune route ne publie »
  (**STORY-399**). La maquette FE-033 dessine ces cinq lignes **d'après le formulaire**, pas
  d'après le contrat — et le dit à l'écran.
