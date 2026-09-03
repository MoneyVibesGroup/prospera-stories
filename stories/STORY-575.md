# STORY-575 : Rendu par substitution de variables déclarées — aucune compilation d'un modèle client

Status: ready-for-dev

**Épic :** EPIC-055 — Modèles versionnés, multilingues, et un rendu qui n'exécute rien
**Service :** `notification-service` (nouveau)
**Points :** 3 · **Sprint :** S41
**Prérequis :** **STORY-574** (modèle et ses variables déclarées)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-8, AR-09.

---

## Le fait

⛔ **C'est la story de sécurité du bloc.** FR-N12 laisse les clients écrire leurs propres modèles, et
**compiler un template lu en base est une surface d'exécution de code côté serveur**. La
recommandation universelle est de ne jamais compiler un modèle de source non fiable.

⚠️ **La frontière est à portée de main de qui voudrait « juste » compiler** : `handlebars@4.7.8` est
**déjà au dépôt**, hérité d'`auth-service`. Il reste autorisé pour les gabarits HTML **livrés avec le
code**. La frontière est l'**origine du texte**, pas sa forme.

## Critères d'acceptation

- [ ] AC-1 — Le rendu d'un modèle stocké en base est une **substitution sur une liste fermée de
      variables déclarées**. Aucun helper, aucun partiel, aucune expression de bloc, aucune boucle,
      aucun accès au prototype. Le moteur **ne compile rien**.
- [ ] AC-2 — ⛔ Un test refuse la compilation d'un texte venu de la base : une chaîne d'expression
      de template placée dans le corps d'un modèle client **ressort littéralement**, elle n'est
      jamais évaluée. Sans ce test, la règle n'est qu'une intention de revue.
- [ ] AC-3 — `handlebars` n'est importé que par le module des **gabarits HTML système**. Un test de
      présence refuse tout import de `handlebars` depuis le chemin de rendu des modèles de base.
- [ ] AC-4 — ⚡ Le **rendu d'essai** (FR-N15) emprunte un chemin qui **ne peut pas produire d'`Envoi`** :
      la fonction de rendu est **pure et partagée**, l'écriture ne l'est pas. Aucun quota consommé,
      aucune ligne au journal, aucun coût. Prouvé en comptant les documents avant et après.
- [ ] AC-5 — Le rendu d'essai fonctionne **sur chaque canal** et rend le résultat sans le persister.

## Notes

⚠️ **Coût assumé, à écrire dans la documentation du module** : pas de conditionnel dans un modèle
client. Une variante se fait par **deux modèles et une règle de déclenchement** — ce qui a l'avantage
d'être visible au journal.
