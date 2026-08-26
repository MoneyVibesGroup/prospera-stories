# STORY-394 : Aucune route n'énumère les comptes de produits — corriger un rattachement se fait à l'aveugle

**Epic :** EPIC-020 — Adaptateur #3, construction chemin A (cahiers recettes/dépenses + OCR + rattachement plan comptable)
**Réf. :** écart remonté par **FE-043** *(cahier de recettes)*, 2026-08-24 — prolonge **STORY-078**, **STORY-085** et **STORY-139**
**Priorité :** Should Have
**Story Points :** 3
**Statut :** in_progress
**Complexité :** medium
**Sprint :** 20
**Service :** `balance-service` (`:3007`)

---

## Le constat

Le rattachement d'une recette à un compte de **classe 7** est **automatique**, et c'est la
décision PO du 2026-08-24 : *« pour le compte, normalement ça doit être automatique »*. Le service
le fait déjà bien — règle du cabinet d'abord, moteur de mots-clés ensuite
(`proposerRattachement`), et il refuse ce qui n'est pas un produit
(`COMPTE_HORS_CLASSE_7`) ou n'existe pas au plan (`COMPTE_INCONNU`).

Reste le cas où la déduction est **fausse**. Le comptable doit alors choisir un autre compte —
et **le contrat ne lui en propose aucun**. Vérifié route par route sur l'OpenAPI vivant de `:3007`
le 2026-08-24, les trois seules routes qui touchent au plan de comptes rendent toutes **un compte
à la fois, à partir d'un texte** :

| route | rend | ce qu'elle ne fait pas |
|---|---|---|
| `POST /balances/suggest-comptes` | 1 compte par libellé soumis (+ `alternatives` en cas d'égalité) | n'énumère rien : il faut **déjà** un libellé |
| `GET …/rattachement/proposition` | 1 compte pour 1 transaction | idem |
| `GET /referentiels/actifs` | le **diagnostic** du référentiel (`planCount`, `checksum`, intégrité) | ne rend **aucun** compte |

⇒ Un écran qui veut offrir « choisissez le bon compte » n'a **rien à afficher**. La correction se
fait donc au clavier, en tapant un numéro **de mémoire**, et c'est le serveur qui dit non après
coup. Pour un cabinet qui connaît son plan, c'est pénible. **Pour le commerçant en SMT — le client
même de ce module — c'est infaisable.**

⚠️ **La nuance qui fait la valeur de cette story :** `planCount` est publié, donc le plan **est
chargé, résolu et compté côté serveur** à chaque appel de `GET /referentiels/actifs`. La donnée
est là, en mémoire, derrière un artefact dont le checksum est vérifié. Ce n'est pas un travail de
constitution : **c'est une route de lecture qui manque.**

---

## Ce qui est demandé

`GET /referentiels/plan-comptes` — les comptes du référentiel **actif de l'organisation**.

1. **Aucun paramètre de référentiel.** Il vient du read-model d'entitlement, comme
   `GET /referentiels/actifs` et `POST /balances/suggest-comptes`. Laisser l'appelant le choisir
   permettrait de lire le plan d'un référentiel auquel l'organisation n'a pas droit.
2. Filtre `?classe=7` (et `?prefixe=70`) — un plan SYSCOHADA complet se compte en milliers de
   lignes ; renvoyer tout pour n'en afficher qu'une classe est un gaspillage que le mobile paiera.
3. **Comptes de détail uniquement** par défaut (`isCompteDeDetail`) : ce sont les seuls
   imputables, et proposer une racine non imputable ferait échouer la saisie sur un compte que
   l'écran vient lui-même de suggérer — le piège que STORY-172 a déjà payé une fois.
4. Réponse : `{ referentiel: { code, version }, comptes: [{ compte, libelle }] }`, **triée par
   numéro**. Le tag du référentiel dans l'enveloppe n'est pas décoratif : c'est ce qui permet au
   client de mettre en cache par version d'artefact.

## Critères d'acceptation

1. `GET /referentiels/plan-comptes?classe=7` rend les comptes de produits **imputables** du
   référentiel actif, triés, avec l'enveloppe `referentiel { code, version }`.
2. Deux organisations sur deux référentiels différents obtiennent **deux plans différents** avec
   le même jeton d'appel — la portée est l'organisation, jamais un paramètre.
3. Les refus d'artefact déjà en place sont réutilisés **tels quels** :
   `409 REFERENTIEL_UNRESOLVED | REFERENTIEL_NON_PACKAGE`, `502 REFERENTIEL_INTEGRITY`,
   `503 REFERENTIEL_UNAVAILABLE_TRANSIENT`. Aucun refus nouveau.
4. La route est **typée dans l'OpenAPI** (`type:` sur le tableau — leçon STORY-389).
5. `classe` hors `1..9` ⇒ `400`, jamais une liste vide silencieuse.

## Portée : pourquoi ça ne s'arrête pas au cahier de recettes

La même absence frappe **FE-044** (rattachement d'une dépense à la classe 6), **FE-046**
(arbitrage des comptes non mappés) et **FE-030** (table de passage). Elle est simplement *visible*
pour la première fois ici, parce que FE-043 est le premier écran où **l'utilisateur final** — et
non le comptable de cabinet — doit trancher un compte.

## Le contournement en place

FE-043 laisse le champ **libre** et affiche le compte **proposé par le serveur** avec son motif.
Sur le chemin nominal, cela ne se voit pas : le compte est juste. Le jour où il faut le corriger,
l'écran ne peut offrir **aucune** liste. Le contournement se retire quand cette story est livrée.

---

## Progress Tracking

**Statut :** `in_progress` — développement terminé sur `MNV-394` (`balance-service`), portes DoD vertes.

### ③④ Développement, portes DoD

`GET /api/v1/referentiels/plan-comptes?classe=&prefixe=` ajouté à `ReferentielController`
(`referentiel.controller.ts`) + `ReferentielService.planComptes` (`referentiel.service.ts`),
sur le **même** patron que `diagnostic()`/`suggest-comptes` : `orgId` du JWT uniquement,
`chargerReferentiel` réutilisé tel quel, erreurs traduites par `versHttpDepuisErreurReferentiel`
(**aucun refus nouveau**, AC-3). Filtrage : `isCompteDeDetail` (comptes de détail uniquement,
AC-1, piège STORY-172) puis `classe`/`prefixe` (`?classe=` borné `1..9` par `class-validator`,
`?prefixe=` gardé par `CARACTERES_COMPTE`/`LONGUEUR_MAX_COMPTE` déjà partagés — AC-5). Réponse
`{ referentiel: {code, version}, comptes: [{compte, libelle}] }`, typée dans l'OpenAPI
(`type: [CompteDuPlanDto]`, leçon STORY-389) et vérifiée par `openapi-contract.e2e-spec.ts`
(balayage des `object` opaques, contrôleur inclus).

**⚡ Piège trouvé et évité avant livraison — le tri « par numéro » n'est pas ce qu'on croit.**
Un premier réflexe a été de réutiliser `comparerComptes` (déjà partagé côté suggestion,
tri « le plus court d'abord »). Vérifié contre le **vrai** plan SYSCOHADA (`syscohada-revise-2.1.json`,
21 comptes de classe 7, têtes à 2 chiffres entrelacées avec des détails à 3/4) : ce comparateur
regroupe **toutes** les têtes avant **tous** les détails (`70,71,...,79,701,702,...`) au lieu de
l'ordre naturel `70,701,...,707,71,72,...`. La numérotation comptable est hiérarchique **par
préfixe** : un tri lexicographique **simple** (sans priorité de longueur) la respecte déjà,
prouvé sur les données réelles. `comparerComptes` reste inchangé dans `suggestion.regles.ts`
(son usage — départager des candidats à égalité pour un même libellé — n'a jamais cette
pathologie) ; aucune extraction croisée n'était donc justifiée.

**Table de mutations — 5 mutations, 5 rouges** (`git diff` de contrôle après restauration) :

| # | mutation | test qui rougit |
|---|---|---|
| M1 | tri remplacé par `comparerComptes` (priorité longueur) | unitaire tri + e2e ordre 70/701/706/71 |
| M2 | filtre `classe` retiré | unitaire filtre classe + e2e `?classe=7` (compte hors classe 7 présent) |
| M3 | filtre `isCompteDeDetail` retiré | unitaire « exclut hors niveau de détail » |
| M4 | `@Max(9)` → `@Max(19)` sur `classe` | e2e `classe hors 1..9 -> 400` (`?classe=10`) |
| M5 | filtre `prefixe` neutralisé | unitaire filtre préfixe |

**Portes DoD** — lint 0 warning · build OK · **3061** unitaires (+21 nouveaux : 7 service,
2 controller, 12 e2e) + **738** e2e verts · couverture **98,99 / 91,87 / 98,18 / 99,07**
(seuils 65/90/90/90) · `referentiel.service.ts`/`referentiel.controller.ts` à 100 % lignes/fonctions/statements.

### Vérification docker — non applicable (pas d'écriture)

Cette story **ne modifie aucune écriture en base** : `GET /referentiels/plan-comptes` réutilise
tel quel le chemin de lecture déjà vérifié en docker par STORY-078 (résolution `read-model`
d'entitlement → artefact vérifié par checksum) et aucun schéma/repository n'est touché. La
règle *« toute story qui écrit en base »* de `qualite-verification.md` ne s'applique donc pas
ici. Preuve équivalente apportée par l'e2e : **vrais artefacts embarqués** (pas de mock du
chargement/checksum), sur le plan SYSCOHADA réel (21 comptes classe 7) **et** CIMA (pour
prouver AC-2 : deux référentiels ⇒ deux plans différents, même jeton).

### Portée hors périmètre (rappel de la story)

FE-044 (classe 6), FE-046 (comptes non mappés) et FE-030 (table de passage) partagent la même
absence mais restent **hors périmètre** — cette story ne livre que la route de lecture.
