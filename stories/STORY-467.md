# STORY-467 : Les surcharges de mapping — le seul acte humain qui change les chiffres — ne sont pas journalisées

Status: ready-for-dev

**Épic :** EPIC-012 — Validation, immutabilité, exercices, audit
**Service :** `bilan-service`
**Points :** 2 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-034** (cycle brouillon → validé, snapshot immuable, piste d'audit), 2026-08-27.
Relevé en lisant les contrôleurs de `bilan-service` sur `origin/dev`.

---

## Le fait

`AuditType` compte **huit** valeurs : `JEU_CREE`, `JEU_RECALCULE`, `JEU_VALIDE`, `JEU_ROUVERT`,
`EXERCICE_CREE`, `EXERCICE_CLOS`, `EXERCICE_ROUVERT`, `EXPORT_EFFECTUE`. Aucune ne couvre les
**surcharges de mapping**, et `mapping-override.controller.ts` n'appelle jamais `journaliser()`
(seuls `jeu-etats`, `exercice` et `export` le font).

Or une surcharge validée **change les montants de la liasse** : c'est l'arbitrage d'un compte vers
un autre poste, décidé par un humain, appliqué à la production. Entre deux versions figées, c'est
souvent **la seule** chose qui a bougé — et le journal ne la voit pas.

Le journal trace donc les **transitions d'état** de la liasse, mais pas les **décisions** qui en
changent le contenu. La fiche FE-034 demande de tracer « import / mapping / validation / export » :
**deux sur quatre** sont servis.

## Critères d'acceptation

- [ ] AC-1 — `AuditType` gagne `MAPPING_SURCHARGE_PROPOSEE`, `MAPPING_SURCHARGE_VALIDEE`,
      `MAPPING_SURCHARGE_REJETEE`.
- [ ] AC-2 — `mapping-override.controller` journalise les trois, avec
      `cible: { collection: 'mapping_overrides', id, libelle: compte }` et
      `contexte: { compte, cibleEtat,ciblePoste, motif }`.
- [ ] AC-3 — La journalisation suit le patron du service : **hook post-action isolé**, jamais dans
      la transaction, jamais propagée en erreur.
- [ ] AC-4 — Aucune reprise rétroactive : les surcharges antérieures n'ont pas d'événement, et le
      journal ne l'invente pas.
- [ ] AC-5 — ⚠️ L'**import de balance** reste hors périmètre : il vit dans `balance-service`, qui a
      sa propre trace. Le journal du Bilan doit **pointer** vers elle (STORY-466), pas la recopier.

## Conséquences ailleurs

- La maquette FE-034 dessine cette ligne manquante **en filigrane** dans le journal, marquée
  « non journalisé », pour rendre le trou visible plutôt que de le taire.
