# STORY-521 : Vie et Non-Vie deviennent étanches — deux comptes techniques, jamais une somme

Status: ready-for-dev

**Épic :** EPIC-133 — Comptes de résultat technique Vie / Non-Vie et compte non technique
**Service :** `assurance-service` + référentiel `cima-assurances`
**Points :** 13 · **Sprint :** S20
**Prérequis :** **STORY-518** (les variations au CR) · **STORY-520** (la réassurance)
**Origine :** revue de l'artefact, 2026-08-27 — **AD-3** de la spine.

---

## Le fait, mesuré dans l'artefact

`cima-assurances@1.0` porte **un seul `COMPTE_RESULTAT` plat** : 25 postes, `RC1..RC8` /
`RP1..RP5`, `RT`, `RN`. **Aucune séparation Vie / Non-Vie.** Le libellé de `RT` le dit lui-même.

Or le code CIMA impose des **comptes techniques distincts** : un compte technique **Vie**, un compte
technique **Non-Vie**, et un compte **non technique** qui reçoit ce qui n'est imputable ni à l'un ni
à l'autre (produits financiers non affectés, charges de structure, impôt).

⚠️ **Ce n'est pas une préférence de présentation, c'est une contrainte réglementaire** : les deux
activités ne sont pas cantonnables l'une dans l'autre, et un assureur agréé pour les deux doit
présenter les deux comptes.

⇒ **Une somme Vie + Non-Vie n'est pas un compte technique : c'est un total qui n'existe dans aucun
état réglementaire.**

## Critères d'acceptation

- [ ] AC-1 — La **catégorie Vie / Non-Vie** est portée par le contrat (STORY-513 AC-1) et se
      propage à tout : quittances, sinistres, provisions, traités de réassurance.
- [ ] AC-2 — Le référentiel publie **trois états de résultat** : technique Vie, technique Non-Vie,
      non technique. Nouvelle version du paquet, `@1.0` conservé intact.
- [ ] AC-3 — ⛔ **Aucun poste n'est imputable aux deux à la fois.** Ce qui n'est affectable ni à
      l'une ni à l'autre va au **compte non technique** — jamais réparti par une clé inventée. Une
      clé de répartition est une décision de direction, pas un défaut de moteur.
- [ ] AC-4 — `RN` = résultat technique Vie + résultat technique Non-Vie + résultat non technique.
      Le contrôle d'articulation le vérifie, et un écart est **bloquant**.
- [ ] AC-5 — Un assureur **mono-activité** (Non-Vie seul, cas le plus fréquent) rend le compte
      technique Vie **vide, pas absent**, avec statut `NON_APPLICABLE`. ⚡ Même doctrine que le TFT
      absent du SFD : *un état qui disparaît fait chercher ce qu'on a cassé*.
- [ ] AC-6 — ⚠️ La **ventilation ne se reconstitue pas après coup** : un jeu de données historiques
      sans catégorie ne peut pas être réparti, et le module doit le dire plutôt que de deviner.

## Notes

- Voir [[STORY-513]], [[STORY-518]], [[STORY-523]], spine AD-3.
