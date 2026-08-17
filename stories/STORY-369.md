# STORY-369 : Les classes de gestion sont publiées par le référentiel, et leur absence REFUSE — jamais `[6,7,8]` par défaut

Status: in_progress

**Epic :** EPIC-017 — Socle balance-service + contrat de balance canonique
**Points :** 8 · **Sprint :** 20 (backend) · **Services :** `bilan-service` (`:3004`) **+**
`balance-service` (`:3007`) — ⚠️ **DEUX DÉPÔTS**
**Gap repris :** `GAP-classes-de-gestion-non-sourcees`
**Décision :** **D-078-2** *(source de vérité unique des octets)* · **D-091-3** *(la classe 8 est juste
pour SYSCOHADA)* · **AD-5** de `architecture-balance-service-2026-08-15`
**Dépendances :** ⛔ **STORY-368** — *le manifeste de `balance-service` affirme aujourd'hui une
byte-identité que sa garde ne tient pas ; ajouter une règle pilotée par le référentiel avant de la
réparer, c'est bâtir sur ce mensonge*

---

## Pourquoi cette story existe

`CLASSES_DE_GESTION = [6, 7, 8]` vit dans `src/modules/fiscal/types/fiscal.ts`, **documentée comme une
constante STRUCTURELLE**. Elle a tenu **par accident** :

| Référentiel | Classe 8 | La constante tient ? |
| --- | --- | --- |
| `syscohada-revise@2.1` | **Entièrement HAO/gestion** (81→89) | ✅ oui |
| `sfd-bceao@2.0` | **Aucune classe 8** | ✅ oui |
| `cima-assurances@1.0` | Gestion réelle (80, 82→86) **ET trois comptes de REGROUPEMENT** — `87` *Compte général de pertes et profits*, `88` *Résultats en instance d'affectation*, `89` *Bilan* | ⛔ **NON** |

> ⚡ **Une règle qui appartient au RÉFÉRENTIEL — quelles classes portent la gestion — est écrite en dur
> dans le code du moteur fiscal**, alors que le référentiel publie déjà ses règles `CHARGE`/`PRODUIT`.
> **Rien ne confronte les deux.**

## ⚡ La conséquence est MESURÉE, pas supposée

Sur une balance CIMA dont le résultat de **140 M** est porté par `88`, `calculerResultatComptable`
rend **280 M**.

> ⛔ **Le résultat — donc LA BASE IMPOSABLE — est EXACTEMENT DOUBLÉ.**

### Et le garde-fou qui devrait le pincer est inapplicable

`resoudreCompteResultatNet(cima)` rend `null` (aucun compte de résultat net en classe 1) ⇒
`articulerResultat` sort **`COMPTE_RESULTAT_NON_SOURCE`** au lieu de **signaler l'écart**.

⇒ **chiffre faux publié SANS AUCUN SIGNAL.**

## 🔒 Portée réelle à ce jour : latent, et c'est pourquoi il dort

Aucune organisation CIMA n'existe ; le plan CIMA reste suspendu à **AC-18** (validation actuarielle,
blocker non levé) ; et le provisionnement (STORY-094) **refuse déjà pour CIMA**
(`resoudreCompteImpotResultat` rend `null` aussi).

⚠️ **Défaut LATENT, bloquant à la première organisation CIMA.** *Rien ne le pousse aujourd'hui — c'est
exactement pourquoi il est encore ouvert, et pourquoi il se réveillera sur un chiffre faux et
plausible.*

## Ce que la story livre

1. **Les classes de gestion sont publiées DANS l'artefact**, pour les trois référentiels — via le
   `build.mjs` de `bilan-service` (**D-078-2**), donc **deux dépôts**.
2. **`balance-service` les lit depuis le référentiel résolu**, et ⛔ **`CLASSES_DE_GESTION` disparaît du
   code**.
3. ⛔ **Un référentiel qui ne les déclare PAS produit un REFUS EXPLICITE.**

## ⛔ Les deux fausses réparations, écrites pour qu'on ne les tente pas

**① Ne JAMAIS retomber sur `[6,7,8]` par défaut.**
⚡ *Ce fail-open est précisément ce qui rend le défaut silencieux.* Un référentiel muet doit **refuser**,
pas produire un chiffre.

**② Ne JAMAIS « réparer » en retirant la classe 8.**
Elle est **JUSTE pour SYSCOHADA** (**D-091-3**) : l'en retirer y produirait un **résultat avant HAO et
avant impôt**. ⇒ **la règle appartient au référentiel, dans les deux sens** — ni ajoutée en dur, ni
retirée en dur.

## Critères d'acceptation

- **Étant donné** `syscohada-revise@2.1` **quand** le résultat comptable est calculé **alors** il est
  **inchangé** par rapport à aujourd'hui — ⛔ **aucune régression sur le chemin nominal**, qui est le
  seul en production.
- **Étant donné** une balance **CIMA** dont le résultat est porté par `88` **quand**
  `calculerResultatComptable` s'exécute **alors** il rend **140 M**, ⛔ **et non 280 M**.
- **Étant donné** un référentiel **qui ne déclare pas** ses classes de gestion **quand** le moteur en a
  besoin **alors** il **REFUSE avec un code machine stable**, ⛔ **jamais un chiffre**.
- **Étant donné** `sfd-bceao@2.0` — **sans aucune classe 8** — **quand** le moteur s'exécute **alors** le
  comportement est **inchangé** : l'absence d'une classe n'est pas l'absence de la déclaration.
- ⛔ **Étant donné** le code du moteur **quand** on le cherche **alors** **aucune liste de classes
  comptables n'y figure** — l'autorité est l'artefact (`AD-5`).

## Definition of Done

- [ ] Les trois artefacts déclarent leurs classes de gestion ; les deux dépôts portent **les mêmes
      octets** et **les mêmes checksums**.
- [ ] ⚡ **MUTATION-TEST EXIGÉ** : rétablir `[6,7,8]` en dur ⇒ **le test CIMA vire au rouge**. C'est la
      seule preuve que la règle est réellement sourcée.
- [ ] **Test de non-régression SYSCOHADA** : le résultat comptable d'une balance existante est
      **strictement identique**.
- [ ] Un référentiel sans déclaration produit un **refus nommé**, vérifié par un test.
- [ ] `CLASSES_DE_GESTION` **n'existe plus** dans `src/`.
- [ ] Les snapshots de liasse impactés par la régénération sont **identifiés et traités**.

## Progress Tracking

▶️ **Démarrée le 2026-08-17** — branches `MNV-369` sur `bilan-service` et `balance-service`
(+ `docs/`). Amont `STORY-368` **done** le 2026-08-17 : le manifeste de `balance-service` dit
désormais la vérité sur ses octets, et sa garde inter-dépôts lit réellement l'autre dépôt.
