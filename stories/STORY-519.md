# STORY-519 : Aucun calcul actuariel n'est inventé — ce que le module calcule, et à quelle condition

Status: ready-for-dev

**Épic :** EPIC-131 — Provisions techniques ⚠️ **PALIER 2**
**Service :** `assurance-service`
**Points :** 8 · **Sprint :** S20
**Origine :** découpage `epics-assurance-2026-08-27.md`, **AD-12** de la spine — Q2 non tranchée.

---

## ✅ DÉCISION PO — 2026-08-28 : on avance en considérant `cima-assurances` validé

> « Prends comme `cima-assurances` validé ; dans le cas contraire, écris la story pour mettre en
> place cela, avec les informations dont tu as besoin. » — PO, 2026-08-28.

**Ce que cette décision débloque : le DÉVELOPPEMENT.** Le palier 2 démarre, cette story est
chiffrable, et STORY-517/518/520/521 ne sont plus suspendues.

⛔ **Ce qu'elle ne peut pas faire, et il faut le dire une fois clairement : une décision produit ne
valide pas une méthode actuarielle.** La validation est un **acte d'expert**, pas un statut qu'on
pose. Un référentiel dont le `statut` dit « certifié » sans qu'aucun actuaire ne l'ait signé serait
**la seule affirmation de ce programme qu'un régulateur pourrait retenir contre son utilisateur**.

⇒ **Conduite retenue, qui honore les deux :**

1. **On construit** — le palier 2 est ouvert, sur les méthodes de l'amorce.
2. **Le `statut` de l'artefact reste `a-valider-par-expert`** et continue d'être **publié partout
   où il est servi** (STORY-511 AC-4). Il ne bascule à `certifie` que le jour où quelqu'un signe.
3. **La validation est mise en chantier en parallèle** : [[STORY-540]] porte le dossier à soumettre
   et la liste exacte de ce qu'il faut obtenir.

⚠️ **Le jour où la validation infirme une méthode**, l'impact est borné et connu d'avance : les
provisions sont des **évaluations versionnées** (STORY-517 AD-2), donc une méthode corrigée produit
**une nouvelle version**, sans réécrire l'historique. C'est précisément ce que cette architecture
protège.

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

## Ce qui devait être tranché — RÉSOLU le 2026-08-28, conservé pour la traçabilité

**Q2 de la spine, non tranchée : qui valide l'amorce ?**

Le référentiel `cima-assurances@1.0` porte le statut *« à valider par un actuaire / expert
assurance »*. **Tant qu'aucune personne n'est nommée, le palier 2 ne peut pas démarrer** — non pas
par prudence excessive, mais parce qu'une méthode de provisionnement fausse produit un passif faux,
donc une **marge de solvabilité fausse**, donc un avis de conformité faux.

⚡ **Écrire un chain-ladder « qui a l'air juste » est le pire résultat possible** : le calcul serait
correct, sa provenance impeccable, et sa méthode non validée. C'est exactement le patron de
STORY-412 — *la provenance rend l'erreur plus difficile à mettre en doute qu'un chiffre sans
provenance*.

## Critères d'acceptation

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
