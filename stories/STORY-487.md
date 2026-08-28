# STORY-487 : Une balance dont le référentiel du dossier n'est pas packagé ne se construit pas — le refus remonte à la construction

Status: ready-for-dev

**Épic :** EPIC-106 — Socle multi-référentiel (habilitation, résolution, refus)
**Service :** `balance-service` (`:3007`) — `modules/cahiers/agregation`, `modules/balance`
**Points :** 3 · **Sprint :** S20
**Prérequis :** **STORY-422** (le plan suit le dossier) — le refus n'a de sens qu'une fois le référentiel du dossier devenu l'autorité.
**Origine :** **Q2 de STORY-422**, tranchée par le PO le 2026-08-27.

---

## Le fait

Aujourd'hui une balance taguée d'un référentiel **non packagé** est **acceptée**. Le refus
(`REFERENTIEL_NON_PACKAGE`) n'arrive qu'au moment où quelqu'un veut en faire quelque chose — au
Bilan, c'est-à-dire à l'**arrêté des comptes**.

Le cas n'est pas théorique : `smt-togo@1.0` est **déclaré et non packagé** (D-078-3). Un dossier au
Système Minimal de Trésorerie — c'est-à-dire la petite entreprise, la persona la plus nombreuse du
marché visé — produit donc aujourd'hui des balances qui ne deviendront jamais une liasse, sans que
rien ne le dise.

## Pourquoi refuser en amont, et pas en aval

Une balance n'est pas un brouillon : c'est une **pièce datée, chiffrée, versionnée et opposable**,
qui porte un checksum et une piste d'audit. En produire une dont le cadre comptable ne peut pas être
résolu, c'est fabriquer un document dont on découvrira l'inutilité **au moment de l'arrêté** — le
seul moment de l'année où l'on n'a plus le temps de recommencer.

⚠️ Le coût du refus tardif n'est pas le refus : c'est le **travail de saisie déjà fait**. Un cahier
de recettes tenu douze mois, agrégé, et refusé en avril.

## Critères d'acceptation

- [ ] AC-1 — L'agrégation et la soumission refusent en `409 REFERENTIEL_NON_PACKAGE` quand le
      référentiel résolu du **dossier** n'a pas d'artefact au manifeste.
- [ ] AC-2 — Le motif nomme **le référentiel demandé, le dossier, et l'état exact** — « déclaré,
      non packagé » n'est pas « inconnu » et n'appelle pas le même geste. Rien à réessayer : le
      message le dit, plutôt que de laisser un bouton qui échouera à l'identique.
- [ ] AC-3 — Le refus arrive **avant** toute écriture : aucune version de balance créée, aucun
      événement publié. Vérifié en rejouant l'appel et en comptant les documents.
- [ ] AC-4 — ⚠️ **Les balances déjà construites sous l'ancien comportement ne sont pas détruites**
      et restent lisibles. Une story de refus ne supprime pas rétroactivement des pièces : elle
      cesse d'en produire. Un inventaire de ces balances est publié (route de diagnostic ou
      script), parce qu'un cabinet doit savoir lesquelles de ses balances sont dans ce cas.
- [ ] AC-5 — Test de rejeu : le même appel, répété, refuse à l'identique et n'écrit toujours rien.

## Conséquences ailleurs

- ⚡ **Cette story rend STORY-494 urgente** (packager `smt-togo@1.0`) : sans elle, le refus est juste
  mais il ferme la porte à la TPE au lieu de la lui ouvrir. **Les deux se tirent ensemble ou pas du
  tout** — livrer 487 seule transformerait un défaut silencieux en blocage bruyant.

## Notes

- Voir [[STORY-422]] (Q2), `stories/STORY-078.md` (D-078-3), [[STORY-494]].
