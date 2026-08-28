# STORY-519 : Aucun calcul actuariel n'est inventé — ce que le module calcule, et à quelle condition

Status: needs-po-decision

**Épic :** EPIC-131 — Provisions techniques ⚠️ **PALIER 2**
**Service :** `assurance-service`
**Points :** 8 · **Sprint :** S20
**Origine :** découpage `epics-assurance-2026-08-27.md`, **AD-12** de la spine — Q2 non tranchée.

---

## Le fait

STORY-517 **héberge** une provision et sa méthode. STORY-518 la fait **entrer au résultat**. Aucune
des deux ne dit **d'où vient le montant**. Cette story pose la question, et refuse de la trancher
seule.

Trois familles de provisions, trois niveaux d'exigence :

| Provision | Ce qu'il faut | Verdict |
|---|---|---|
| **Primes non acquises** | un prorata temporis sur la période couverte | ✅ **calculable sans actuaire** — STORY-514 le fait déjà |
| **PSAP** | une cadence de règlement + une méthode de projection (chain-ladder ou équivalent) | ⚠️ **méthode à valider** — la cadence est collectée par STORY-516 |
| **Provisions mathématiques vie** | tables de mortalité, taux d'actualisation, méthode prospective | ⛔ **actuaire obligatoire** — hors de portée de ce module |

## ⛔ Ce qui doit être tranché avant de coder

**Q2 de la spine, non tranchée : qui valide l'amorce ?**

Le référentiel `cima-assurances@1.0` porte le statut *« à valider par un actuaire / expert
assurance »*. **Tant qu'aucune personne n'est nommée, le palier 2 ne peut pas démarrer** — non pas
par prudence excessive, mais parce qu'une méthode de provisionnement fausse produit un passif faux,
donc une **marge de solvabilité fausse**, donc un avis de conformité faux.

⚡ **Écrire un chain-ladder « qui a l'air juste » est le pire résultat possible** : le calcul serait
correct, sa provenance impeccable, et sa méthode non validée. C'est exactement le patron de
STORY-412 — *la provenance rend l'erreur plus difficile à mettre en doute qu'un chiffre sans
provenance*.

## Critères d'acceptation *(applicables une fois Q2 tranchée)*

- [ ] AC-1 — Les provisions **calculables sans actuaire** (primes non acquises) le sont, avec leur
      méthode publiée.
- [ ] AC-2 — Les provisions **exigeant une méthode validée** sont **saisies**, avec leur méthode et
      leur auteur (STORY-517), et le module **ne propose aucun montant**.
- [ ] AC-3 — ⛔ Une provision saisie et une provision calculée sont **distinguées au contrat** et à
      l'écran. Les confondre ferait porter au produit une responsabilité qu'il n'assume pas.
- [ ] AC-4 — Le nom de l'actuaire ou de l'expert qui a validé une méthode est **porté par la
      méthode**, pas par une note. Sans validation, la méthode est servie avec son statut.

## Notes

- Voir [[STORY-516]] (la cadence, collectée dès le palier 1), [[STORY-517]], spine AD-12 / Q2.
