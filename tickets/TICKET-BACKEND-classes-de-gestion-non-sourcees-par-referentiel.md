# TICKET backend — les classes de gestion sont codées en dur et **mentent** pour CIMA

**Type :** défaut d'intégrité comptable **silencieux** (constante structurelle invalidée par un référentiel)
**Dépôt :** `prospera-balance-service` (:3007) — correction complète = **2 dépôts** (cf. § Résolution)
**Fichier :** `src/modules/fiscal/types/fiscal.ts` (`CLASSES_DE_GESTION`) + `src/modules/fiscal/fiscal.regles.ts` (`calculerResultatComptable`)
**Ouvert par :** constat de **revue de code de STORY-292**, 2026-08-10
**Priorité :** Should aujourd'hui, **Must dès la première organisation CIMA** — voir § Portée du risque

---

## Le problème

`CLASSES_DE_GESTION = [6, 7, 8]` est documentée comme une **constante structurelle** : « le plan
comptable ne change pas avec la loi de finances ». L'admission tenait parce que les deux référentiels
servis jusqu'ici la vérifiaient :

| Référentiel | Classe 8 | La constante est… |
|---|---|---|
| `syscohada-revise@2.1` | `81`→`89`, **entièrement** HAO/gestion | **juste** (D-091-3) |
| `sfd-bceao@2.0` | **aucune** classe 8 | **vacuellement juste** |
| `cima-assurances@1.0` | gestion réelle **+ 3 comptes de regroupement** | ⛔ **fausse** |

STORY-292 ajoute `cima-assurances@1.0` au contrat de balance. Sa classe 8 mêle de la gestion réelle
(`80` Exploitation générale, `82`→`86`) et **trois comptes de REGROUPEMENT** :

- `87` — Compte général de pertes et profits
- `88` — Résultats en instance d'affectation
- `89` — Bilan

`calculerResultatComptable` somme `Σ (soldeCrediteur − soldeDebiteur)` sur les classes 6/7/8 : elle
additionne donc le résultat **une seconde fois** via `87`/`88`.

### ⚡ Mesuré, pas supposé

Sur une balance CIMA dont le résultat de **140 000 000** est porté par `88` :

```
calculerResultatComptable() = 280 000 000   (attendu : 140 000 000)
```

Le résultat est **exactement doublé**, donc la **base imposable** l'est aussi.

### Et le garde-fou qui devrait le pincer est inapplicable

`articulerResultat` existe précisément pour rapprocher le résultat calculé du compte de résultat net
de la balance. Or pour CIMA :

```
resoudreCompteResultatNet(cima)   = null   → articulation « COMPTE_RESULTAT_NON_SOURCE »
resoudreCompteImpotResultat(cima) = null   → « Impôts sur les bénéfices » ≠ « impôts sur le résultat »
```

L'articulation sort donc `applicable: false` **au lieu de signaler un écart de 140 M**. Le chiffre
faux est publié **sans le moindre signal** — c'est le mode de défaillance que le projet traite comme
le plus grave.

## Portée du risque **à ce jour**

- **Aucune organisation CIMA n'existe** (cf. `GAP-cima-non-servi-par-balance`) ⇒ impact production nul.
- Le contenu comptable du plan CIMA reste **suspendu à une validation actuarielle** (AC-18 de
  STORY-122, blocker **non levé**) : aucune organisation CIMA ne devrait produire de liasse fiscale
  avant cette validation.
- Le **provisionnement** (STORY-094) **refuse déjà** pour CIMA, `resoudreCompteImpotResultat` rendant
  `null` — l'écriture est protégée. C'est le calcul du résultat fiscal **en lecture** qui est muet.

⇒ Le défaut est **latent**, pas actif. Il devient bloquant à la première organisation CIMA réelle.

## Pourquoi STORY-292 ne l'a pas corrigé

La correction juste n'est **pas** d'arbitrer les classes dans le `.ts` : retirer la classe 8 serait
**faux pour SYSCOHADA** (résultat avant HAO et avant impôt, D-091-3). Il faut que **le référentiel
déclare ses classes de gestion**, comme il déclare déjà ses règles `CHARGE`/`PRODUIT`.

Cela suppose de régénérer l'artefact via le `build.mjs` de `bilan-service` — **source de vérité
unique des octets** (D-078-2) — donc **2 dépôts**, deux nouveaux checksums, livrés ensemble. C'est
**exactement** la même dette que `longueurCompteDetail` (tracée dans `ReferentielRegistry` depuis
STORY-146). Hors périmètre de 292, qui *transporte* l'artefact et ne le *juge* pas.

Un **hook inerte documenté** a été posé sur `CLASSES_DE_GESTION` (chiffres, mesure et renvoi vers ce
ticket).

## Résolution attendue

- [ ] Publier les classes de gestion **dans l'artefact** (`regles`), pour les 3 référentiels, via le
      `build.mjs` de `bilan-service`.
- [ ] `balance-service` lit la déclaration ; **absence ⇒ refus explicite**, jamais un défaut
      `[6,7,8]` (le fail-open est précisément ce qui rend le défaut actuel silencieux).
- [ ] Retirer le hook inerte de `fiscal.ts` une fois la donnée sourcée.
- [ ] Test de non-régression SYSCOHADA (le résultat comptable ne bouge pas d'un franc) **et** test
      CIMA prouvant que `87`/`88`/`89` sont exclus.
- [ ] Mutation-test : rétablir `[6,7,8]` en dur ⇒ le test CIMA doit virer au **rouge**.

## Definition of Done

- [ ] Aucune classe de gestion n'est écrite en dur dans le `.ts`.
- [ ] Une balance CIMA portant `88` produit un résultat comptable **non doublé**.
- [ ] Un référentiel qui ne déclare pas ses classes est **refusé bruyamment**, jamais calculé au défaut.
