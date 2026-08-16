# STORY-371 : Le **catalogue des types d'action** devient un référentiel versionné — et le module `assistant` existe enfin

Status: not_started

**Epic :** EPIC-014 — Catalogue plateforme (`platform-catalog-service`)
**Points :** 5 · **Sprint :** 21 (backend) · **Service :** `platform-catalog-service` (`:3003`)
**Décision :** **AD-4** — [`architecture/architecture-assistant-service-2026-08-16/ARCHITECTURE-SPINE.md`](../architecture/architecture-assistant-service-2026-08-16/ARCHITECTURE-SPINE.md)
**Réf. PRD :** [`prds/prd-assistant-ia-2026-08-02/prd.md`](../prds/prd-assistant-ia-2026-08-02/prd.md) — **FR-IA23b**, **FR-IA23c**, FR-IA27, **NFR-2**, **Q7 tranchée le 2026-08-16**
**Réf. code livré :** **STORY-032** *(catalogue `Module`/`Version`/`ReferentielVersion` — le patron à recopier)* · **STORY-033** *(entitlements + réconciliation)* · `paquet-fiscal-togo-2026.json` *(le même circuit, déjà en service)*
**Bloque :** ⛔ **EPIC-095** *(entitlement du module `assistant`)* et ⛔ **EPIC-101** *(contrôle de mode)* — les deux premiers épics tirables du module Assistant IA
**Créée le :** 2026-08-16, au découpage de `assistant-service`
**Assigné à :** null

---

## Pourquoi cette story existe

Le §2 du PRD Assistant IA pose une doctrine : *l'IA peut agir seule **si et seulement si** l'acte est
réversible et n'engage rien*. La revue de ce PRD a classé **`critical`** le trou qui l'accompagnait :

> **La doctrine n'a pas de mécanisme.** FR-IA27 dit que le mode est contraint par la nature de
> l'action et que le service *« refuse la configuration »*. Mais **rien ne dit d'où le service tire
> cette nature**. Réversible ? engageant ? Ce n'est ni déductible d'un libellé, ni devinable par un
> modèle.

FR-IA23b y répond par un **catalogue des types d'action** — et FR-IA23c dit qui le remplit : **les
modules qui exécutent**. *C'est `notification-service` qui sait qu'un envoi WhatsApp n'est pas
rattrapable, pas l'assistant.*

⚡ **Ce catalogue n'a donc pas sa place dans la base de l'assistant.** AD-4 le place là où le programme
range déjà ses connaissances versionnées : `platform-catalog-service`, au patron exact du paquet fiscal.

### Les deux alternatives écartées, pour ne pas les re-débattre

| Alternative | Pourquoi non |
| --- | --- |
| **Auto-déclaration** par appel machine-à-machine des modules exécutants | Dépend de **C8**, condition **programme** encore ouverte — et rendrait le contrôle de mode **indisponible au démarrage** de l'assistant |
| **Table locale** dans `assistant_service` | Contredit FR-IA23c : l'assistant deviendrait juge de la réversibilité d'actions qu'il n'exécute pas |

---

## Périmètre

### 1. Le référentiel `types-action@AAAA.N`

Une `ReferentielVersion` de plus — **aucun registre nouveau à inventer** : `code`, `version`,
`artifactUri`, `checksum`, publication, événement `referentiel.changed`.

Chaque entrée de l'artefact déclare :

| Champ | Valeurs | Ce qu'il commande |
| --- | --- | --- |
| `code` | identifiant stable de l'action | La règle le fige avec la version (AD-5) |
| `reversible` | `OUI` · `NON` · `SOUS_CONDITIONS` | Condition n°1 du mode `AUTO` |
| `engageant` | `OUI` · `NON` | Interdit `AUTO` quand `OUI` — c'est la doctrine du §2 |
| `moyenAnnulation` | référence opaque | Ce que l'assistant demandera pour **compenser** (AD-10) |
| `serviceExecutant` | code de service | À qui la demande d'exécution est adressée |

### 2. Le module `assistant` au catalogue

Enregistrer `assistant` comme `Module` — sans lui, aucun entitlement ne peut être octroyé et le gate
`@RequiresAssistantAccess` d'EPIC-095 n'a rien à lire. ⚠️ **Même famille de trou que les six modules du
pack distributeur**, dont l'absence fait échouer le provisioning en `422` depuis le 2026-08-11.

---

## Critères d'acceptation

- **AC-01** — Le référentiel `types-action` se publie, se version et se relit **par le même chemin que
  le paquet fiscal**. Aucune route, aucun modèle, aucun registre spécifique n'est créé pour lui.
- **AC-02** — L'artefact est **validé par schéma à la publication**. Une entrée sans `reversible`,
  sans `engageant`, sans `moyenAnnulation` ou sans `serviceExecutant` **fait échouer la publication**,
  avec l'entrée fautive nommée.
- **AC-03** — `referentiel.changed` est émis à la publication *(patron STORY-032/033)*, de sorte qu'un
  consommateur recharge sans redémarrer.
- **AC-04** — Le `checksum` est vérifié à la lecture ; un artefact altéré est **refusé**, pas chargé
  partiellement.
- **AC-05** — Le module `assistant` existe au catalogue ; un entitlement peut lui être octroyé et
  révoqué, et la réconciliation le voit.
- **AC-06** — ⚡ **Le premier artefact publié est volontairement MINIMAL** : les seuls types d'action
  réellement connus au 2026-08-16, c'est-à-dire ceux de `notification-service` *(envoi par canal —
  `engageant: NON`, `reversible: NON` une fois parti)*. ⛔ **Aucun type d'action inventé pour un module
  qui n'existe pas encore.**
- **AC-07** — ⛔ **Le défaut strict est prouvé côté consommateur, pas seulement documenté** : un type
  d'action **absent** du référentiel est traité par l'assistant comme **engageant ET irréversible**.
  Le test vit dans EPIC-101 ; **cette story livre le cas de référence** (un code inconnu) qu'il
  utilise.

---

## Ce que cette story ne fait pas

- ⛔ **Elle n'implémente aucun contrôle de mode** — c'est EPIC-101, dans `assistant-service`.
- ⛔ **Elle ne remplit pas le catalogue pour les modules à venir** (stock, PDV, commande…). Chaque
  module exécutant fournira ses entrées quand il existera ; le défaut strict rend l'attente **sûre**.
- ⛔ **Elle ne nomme pas le responsable de publication** — c'est le reliquat de **Q7**, une décision
  d'exploitation, pas de code.

---

## Pièges

1. ⚠️ **Ne pas créer un second registre.** `ReferentielVersion` existe et sert déjà au paquet fiscal et
   aux référentiels comptables. Un registre parallèle « pour l'IA » ferait diverger les deux chemins de
   publication — et le second serait celui que personne ne surveille.
2. ⚡ **`engageant` n'est pas `reversible`.** Un envoi WhatsApp **n'engage rien** (aucun argent, aucune
   signature) mais **n'est pas rattrapable**. Une commande fournisseur est **engageante** et pourtant
   annulable sous conditions. Les deux champs sont **indépendants** : les fusionner en un seul
   « niveau de risque » détruit précisément la distinction sur laquelle repose le §2 du PRD.
3. ⚠️ **Un artefact publié est immuable.** Corriger une propriété se fait par une **nouvelle version** —
   et c'est ce qui permet à la règle qui a figé l'ancienne d'être **suspendue** plutôt que de basculer
   en silence (AD-5).
