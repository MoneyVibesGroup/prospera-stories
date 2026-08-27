# STORY-436 : Quatre lignes du TFT ne sont dérivables d'aucune balance, et aucune route n'accepte de les saisir — le tableau des flux ne peut jamais être complété

Status: ready-for-dev

**Épic :** EPIC-010 — États financiers (`bilan-service`)
**Service :** `bilan-service` (`:3004`) — `modules/bilan/etats`, `dto`, contrôleur `bilan-diagnostics.controller.ts`
**Points :** 5 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-033** (TFT/TAFIRE, notes annexes, contrôles de cohérence), 2026-08-27.
Vérifié contre la DSF déposée `1000745307_2025_Definitif (1).xlsx`, feuille *« TFT »*.

---

## Le fait

Quatre lignes du formulaire portent `statutTft: 'A_COMPLETER'` et `montantN: null` :

| Code | Libellé | Pourquoi la balance ne peut pas le dire |
|---|---|---|
| `FJ` | + Encaissements liés aux cessions d'immobilisations financières | un encaissement ne laisse pas de solde |
| `FM` | − Prélèvements sur le capital | mouvement, pas position |
| `FN` | − **Dividendes versés** | idem — et c'est une ligne **obligatoire** dès qu'il y a distribution |
| `FQ` | − **Remboursements des emprunts et autres dettes financières** | seul le **solde** est connu, pas les flux bruts |

Le service a **raison** de rendre `null` plutôt que zéro (invariant P7 : jamais de montant
inventé). Le problème est ailleurs : **aucune route n'accepte de les compléter.** Les trois
endpoints de la liasse sont des `dry-run` en `@LectureSeule()` qui ne persistent rien.

⇒ **Tant que ces quatre cases restent vides, la liasse n'est pas déposable.** Le module produit
un état que personne ne peut finir.

⚠️ Et le défaut est plus large que ces quatre lignes : les **trames de notes** (`mode: 'TRAME'`,
notes 3, 4, 7 — mouvements d'immobilisations, antériorité des créances) sont dans le **même cas**.
La ligne de saisie qui sert le TFT doit servir les notes, ou il y en aura deux.

## ✅ Arbitrage (2026-08-27) — **sur le jeu d'états persisté**

Ces valeurs sont des **faits de l'exercice déposé**, pas des paramètres du dossier : un dividende
est voté par une assemblée, un remboursement d'emprunt appartient à un exercice et à un seul.
Trois conséquences décident :

1. **Elles doivent être figées avec la liasse.** Rattachées au dossier, elles flotteraient d'un
   exercice à l'autre et une liasse rouverte changerait **en silence** — exactement ce que
   STORY-065 existe pour empêcher.
2. **Elles doivent être auditables.** La piste d'audit (FR-017) porte sur le jeu d'états ; les
   poser ailleurs obligerait à réinventer datation et attribution.
3. **Elles n'ont de sens qu'avec un état.** Compléter le `FN` d'un TFT qui n'existe pas encore
   n'a pas de signification comptable.

⇒ **`PUT /bilan/etats/{id}/complements`**, dépendance assumée à **STORY-064**.

⚠️ **La dérivation depuis le journal (4ᵉ voie) est écartée pour l'instant, mais elle est la plus
juste** — aucune saisie, aucune erreur de report. Elle est inapplicable ici : l'entrée du module
est une **balance**, pas un journal, et un dossier alimenté par import de balance n'a pas les
écritures. À rouvrir quand le dossier portera son journal (elle deviendra alors un **contrôle**
de la saisie, pas son remplacement).

## Critères d'acceptation

- [ ] AC-1 — Une route accepte les **compléments hors balance** d'une liasse, par code de poste,
      avec leur exercice : `PUT /bilan/etats/{id}/complements`. Elle refuse tout code dont le
      `statutTft` n'est **pas** `A_COMPLETER` — on ne surcharge pas ce que le moteur calcule.
- [ ] AC-2 — Le TFT produit reprend le complément quand il existe : `montantN` renseigné,
      `statut: 'SAISI'` (**5ᵉ valeur**, distincte de `CALCULE` — la provenance ne se perd pas).
- [ ] AC-3 — Les Z-sous-totaux propagent `SAISI` comme ils propagent `ESTIME` (héritage du pire),
      `SAISI` étant **meilleur** qu'`A_COMPLETER` et **moins bon** que `CALCULE`.
- [ ] AC-4 — Les trames de notes (`mode: 'TRAME'`) passent par la **même** route.
- [ ] AC-5 — Un complément saisi est **daté et attribué** (piste d'audit, FR-017) et **figé** par
      la validation (STORY-065) comme le reste de la liasse.
- [ ] AC-6 — Agnosticisme P7 : aucun code de poste en dur ; la liste des cases complétables est
      **dérivée du paquet** (`statutTft: 'A_COMPLETER'` + `mode: 'TRAME'`).

## Conséquences ailleurs

- ⛔ **FE-080** est la moitié frontend et ne peut pas commencer avant l'arbitrage.
- **STORY-434** : si la voie B (note 3A) est retenue là-bas, elle passe par **cette** route.
- **STORY-064/065** : la saisie n'a de sens que sur un état **persisté** — la dépendance est réelle.
