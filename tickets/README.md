# `tickets/` — les manques découverts **chez l'autre**

## À quoi sert ce dossier

Un **ticket** naît quand une story livrée dans un dépôt découvre un manque qui appartient à **un autre
dépôt**. L'auteur ne peut pas le corriger là où il travaille, et il n'a pas d'autorité pour ouvrir une
story dans le backlog d'en face. Le ticket est le **véhicule de ce passage de main**.

C'est le seul cas légitime. Tout le reste est une **story**.

## Convention de nommage

```
TICKET-<CIBLE>-<sujet-en-kebab-case>.md
```

- `<CIBLE>` = le dépôt qui doit agir, en majuscules : `BACKEND` · `FRONTEND` · `ADMIN` · `OPS`.
  **C'est la cible, pas l'origine** — un ticket se range par qui doit le traiter.
- `<sujet>` = le symptôme, en kebab-case, sans numéro de story (l'origine se lit dans l'en-tête du
  fichier et dans `git log`, elle n'a rien à faire dans le nom de fichier : un ticket peut être
  découvert deux fois, il n'a qu'une cible).

## Cycle de vie — un ticket est un état transitoire, pas une destination

1. **Ouvert** — l'auteur crée le fichier ici et **l'inscrit dans le tracker de la cible**
   (`sprint-status.yaml` → `open_contract_gaps`, ou le tracker frontend). Un ticket qui n'est pas
   dans un tracker est **invisible du sprint-planning**, et c'est exactement comme ça que
   `TICKET-fe-026` a dormi deux jours et que STORY-133/134/135/136/144 sont devenues orphelines.
2. **Repris** — dès qu'il a un porteur, il devient une **story numérotée** dans le backlog de la
   cible. Le ticket est alors stampé en tête (« repris par X ») et **X devient la source de vérité**.
3. **Résolu** — la story est livrée ; le ticket est stampé « résolu par X ».

⚠️ **Un ticket stampé ne se modifie plus.** Il est conservé pour tracer l'origine — pas pour être
maintenu en parallèle de la story. Deux sources de vérité sur le même sujet, c'est précisément le
défaut que ce dépôt a rencontré trois fois (statuts périmés, stories orphelines, 134/135/136 vs 144).

## État au 2026-08-09

| Ticket | Cible | Ouvert par | État |
|---|---|---|---|
| `TICKET-BACKEND-dossier-client-entite-de-premier-rang.md` | backend *(+ volet frontend)* | question du PO (barry thierno alhassane, 09/08) | ➡️ **REPRIS le 09/08 par 13 stories `EPIC-043`, toutes au SPRINT 20** (8 créées : 353→360 · 5 **réancrées** : 236 du S22, 301/302/304 du S23, 303 du S24). **73 pts.** Les stories font foi. Décision PO : fermer balance+bilan d'une société **avant** que la fiscalité ne démarre au S22. — Historique : 🟠 décisions D1→D16 prises, découpage suspendu. ⚡ Exception au cycle ci-dessus : ce ticket ne naît pas d'une story mais d'une **décision produit** qui renverse une invariante livrée (« une organisation = une société », `profil-societe.schema.ts`). Il porte **16 blocs** de travail A→P, non numérotés **volontairement**. ⬆️ **2ᵉ entrée du 09/08** — maquette validée : blocs **J** (aucun `GET` n'existe sur les exercices), **K** (vue consolidée + compteurs de portefeuille), **L** (audit du profil **écrit mais illisible** — répétition de STORY-144), **M** (régime non daté par exercice). ⬆️ **3ᵉ entrée du 09/08** — analyse de la partie dossier, 6 décisions D11→D16 : blocs **N** (⚡ `notification-service` **n'existe pas** alors que « l'admin est informé » en dépend), **O** (unicité du NIF société, aucun index aujourd'hui), **P** (échéance au portefeuille — la donnée existe dans le paquet fiscal, aucune route ne la sert). Q3/Q4/Q5 tranchées, **Q6→Q12** ouvertes |
| `TICKET-BACKEND-mapping-profile-accepte-mais-ignore.md` | backend | FE-025 (barry thierno alhassane, 25/07) | ✅ **résolu** par STORY-088 — reste la régénération des types, portée par FE-057 |
| `TICKET-FRONTEND-retrait-dictionnaire-plan-comptes.md` | frontend | STORY-139 (vivianMoneyVibesGroupes, 29/07) | ✅ **résolu** par **FE-056** le 2026-08-07 (commit `c1b777f`) |
| `TICKET-BACKEND-ecarts-releves-par-integration-gate-console.md` | backend | Integration Gate console (03/08) | ➡️ voir `GAP-integration-gate-console` |
| `TICKET-BACKEND-ap-int-1-revue-kyc-sans-document.md` | backend | AP-INT-1 (04/08) | ➡️ **repris** par STORY-179→184 (sprint 20) |
| `TICKET-BACKEND-console-inexercable-faute-de-donnees.md` | backend | console (05/08) | ➡️ voir `GAP-console-inexercable-faute-de-donnees` |
| `TICKET-BACKEND-referentiels-attribuables-mais-non-servis.md` | backend + console | maquette **FE-056** (barry thierno alhassane, 07/08) | ➡️ **repris** — ① par **STORY-292**, ③ par **STORY-293** (sprint 20) ; ② clos sans action |
| `TICKET-BACKEND-tag-referentiel-non-expose.md` | backend | **FE-056** à l'intégration (barry thierno alhassane, 07/08) | ⛔ **ouvert** — aucune route ne donne au client le tag `SN\|SMT\|SFD-BCEAO` que `POST /balances` exige |
| `TICKET-OPS-atelier-injoignable-depuis-un-navigateur.md` | ops (+ backend) | **FE-057** à l'Integration Gate (barry thierno alhassane, 08/08) | ✅ **corrigé** le 08/08 — ① CORS ajouté à `balance-service` **et** `bilan-service` (7/7 services au préflight) ; ② `.gitattributes` (`-text`) posé dans `balance-service` et `bilan-service` — dont les 5 artefacts étaient **déjà** en CRLF, défaut actif sans témoin. Les deux pannes étaient **invisibles au curl**. Reste : relire et pousser les 2 branches `fix-gitattributes-artefacts-checksum` |
| `TICKET-BACKEND-objets-imbriques-non-types-dans-l-openapi.md` | backend | **FE-057** à la régénération (barry thierno alhassane, 08/08) | ⛔ **ouvert** — 33 objets déclarés par `@ApiProperty({ example })` sans schéma sortent en `Record<string, never>` ; le front renonce à afficher `referentiel{code,version}` et `paquetFiscal{pays,annee}` que le serveur envoie pourtant |
| `TICKET-BACKEND-journal-d-audit-des-organisations-non-lisible.md` | backend | **AP-20** à l'intégration (barry thierno alhassane, 07/08) | ➡️ **repris** le 08/08 par **STORY-294** (sprint 20) — consommateur **AP-24** nommé en même temps, pour ne pas rejouer l'orphelinat de STORY-144. `admin_audit_logs` est écrit transactionnellement, **aucune route ne le relit** ; 3 arbitrages portés par la story |
| `TICKET-FRONTEND-regeneration-types-cima-story-292.md` | frontend | **STORY-292** à la livraison (vivianMoneyVibesGroupes, 10/08) | ⛔ **ouvert** — `REFERENTIELS_BALANCE` gagne `CIMA` côté backend (additif) ; les types générés côté front restent figés à 3 valeurs tant qu'ils ne sont pas régénérés depuis l'`openapi.json` de `balance-service` |
| `TICKET-BACKEND-classes-de-gestion-non-sourcees-par-referentiel.md` | backend *(2 dépôts)* | **revue de code de STORY-292** (vivianMoneyVibesGroupes, 10/08) | ⛔ **ouvert** — `CLASSES_DE_GESTION=[6,7,8]` **ment** pour CIMA (classe 8 = gestion **+** `87`/`88`/`89` de regroupement) ⇒ résultat comptable **doublé** (280 M au lieu de 140 M, mesuré), et l'articulation qui le pincerait est inapplicable ⇒ **silence total**. Latent (aucune org CIMA, plan suspendu à AC-18). Correction = sourcer les classes dans l'artefact ⇒ `build.mjs` de `bilan-service` |

### Ce qui a été corrigé le 2026-07-31

Les deux fichiers vivaient dans `stories/` — **le dossier des stories backend** — alors que l'un des
deux est un ticket *frontend*. Ils suivaient deux schémas de nommage différents
(`TICKET-<story>-<sujet>` vs `TICKET-<sujet>`) et deux casses différentes (`fe-026` vs
`mappingProfile`), et **aucun des deux n'était référencé par un tracker**.
