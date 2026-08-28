# STORY-533 : Une organisation est habilitée à N référentiels, pas à un seul — le champ singleton bloque tout cabinet multi-secteur

Status: ready-for-dev

**Épic :** EPIC-106 — Socle multi-référentiel (habilitation, résolution, refus)
**Service :** `platform-catalog-service` (`:3006`) + read-model `balance-service` (`:3007`) + `bilan-service`
**Points :** 5 · **Sprint :** S20
**Bloque :** **STORY-422** (le plan de comptes suit le dossier) — c'est son « seul vrai inconnu », nommé tel quel dans sa recommandation du 26/08.
**Origine :** revue **expert-comptable** de la maquette cumulative, 2026-08-27, demandée par le PO.

---

## Le fait

`OrgBalanceEntitlement.referentiel` est un **champ unique**. Le référentiel est attribué à
l'**octroi**, par la console (pack vertical AP-06), et vaut pour toute l'organisation.

Or l'organisation qui utilise ce produit est un **cabinet d'expertise comptable**, et un cabinet ne
tient pas un seul type d'entité. Le portefeuille de démonstration du produit le montre déjà : la
maquette liste *Ets Kossi Distribution* (SARL commerciale, SYSCOHADA) **et** *Mutuelle d'Épargne Bè*
(agrément SFD BCEAO) **dans le même cabinet**. Avec un champ singleton, l'un des deux dossiers est
nécessairement validé contre le plan de l'autre.

⚡ **Ce n'est pas une limite théorique : c'est le modèle économique du client.** Un cabinet togolais
qui ne tiendrait qu'un seul secteur n'existe pas. Le champ singleton dit l'inverse.

## Ce qui a caché le défaut

Le champ n'est faux **qu'en présence de plusieurs dossiers de natures différentes**. Tant que la
plateforme n'avait qu'un dossier par organisation (`POST /profil-societe` répond encore aujourd'hui
`409 PROFIL_SOCIETE_DEJA_EXISTANT`, index unique sur `orgId`), un référentiel par organisation était
exactement un référentiel par dossier. **Les deux modèles coïncidaient, donc le mauvais paraissait
juste.** EPIC-043 a séparé les deux, et le champ ne s'en est pas aperçu.

## Critères d'acceptation

- [ ] AC-1 — `OrgBalanceEntitlement.referentiel` devient `referentiels: string[]` (non vide). La
      lecture d'un octroi existant rend un tableau à un élément : **aucune migration de données à
      la main**, la projection le fait.
- [ ] AC-2 — La console (AP-06) octroie **une liste** de référentiels par pack vertical. Un pack
      « cabinet » en porte plusieurs ; un pack « microfinance » un seul.
- [ ] AC-3 — Nouvelle question, servie et testée : **`estHabilite(orgId, referentiel)`**. C'est
      elle, et elle seule, que STORY-422 appelle. Elle répond `false` sur un référentiel absent de
      la liste — jamais sur une liste vide traitée comme « tout permis ».
- [ ] AC-4 — ⛔ **Fail-closed prouvé par mutation** : une organisation dont la liste est **vide** ou
      absente ne peut charger **aucun** plan. Le test doit virer au rouge si la garde est retirée —
      une liste vide qui ouvre tout est le mode de panne le plus coûteux du programme (même patron
      que la portée vide d'EPIC-049/050, tracé dans `reserved_ranges`).
- [ ] AC-5 — La route publie **la liste des référentiels habilités**, pas seulement un verdict :
      l'écran doit pouvoir dire « votre cabinet est habilité à SYSCOHADA et SFD-BCEAO, ce dossier
      demande CIMA », qui est actionnable, plutôt que « accès refusé », qui ne l'est pas.

## Conséquences ailleurs

- **STORY-422** devient chiffrable et démarrable : son estimation basse (5 pts « si l'entitlement
  porte déjà l'information ») ne s'applique pas ; c'est 8, et cette story-ci est le complément.
- L'écran de la console (AP-06) passe d'un sélecteur à une liste à cocher — **FE à ficher**.
- ⚠️ `bilan-service` lit le même read-model pour la liasse : la propagation doit être vérifiée dans
  les **deux** services, comme l'a exigé la byte-identité des artefacts (STORY-368).

## Notes

- Voir [[STORY-422]], `stories/STORY-394.md` (l'énumération org-scopée qui a fermé la question de
  sécurité), `stories/STORY-366.md` (les quatre verticaux reçoivent `balance`).
