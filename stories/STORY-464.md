# STORY-464 : Un jeu d'hypothèses ne se supprime pas et ne se renomme pas — et son nom, saisi à la main, est confisqué pour toujours

Status: in_progress

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 3 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-035** (hypothèses de prévisionnel paramétrables), 2026-08-27.
Relevé en lisant `JeuHypothesesController` : POST / GET / GET :id / GET :id/versions / GET :id/versions/:v / PUT :id. Rien d'autre.

---

## Le fait

`JeuHypothesesController` n'expose **ni `DELETE`, ni renommage** : `EditerHypothesesDto` ne contient
qu'un objet `hypotheses`, jamais le `nom`. Et l'index unique porte sur `(tenantId, dossierId, nom)`,
donc sur un **libellé saisi à la main**.

Conséquence, quotidienne en cabinet : « Optismiste 2026 » créé sur une faute de frappe reste dans la
liste du dossier **pour toujours**, et **confisque son nom** — recréer le jeu correctement exige d'en
choisir un autre. Le refus est en outre muet sur le coupable : il vient d'un `E11000` traduit en
`409 HYPOTHESES_EXISTE`, qui **ne nomme pas** le jeu en conflit.

C'est la **deuxième occurrence** du même angle mort après **STORY-454** (un brouillon de liasse créé par
erreur ne s'annule pas). Le patron se répète : un objet métier créé par un geste d'écran n'a aucun
geste d'annulation.

## Critères d'acceptation

- [x] AC-1 — `DELETE /dossiers/:dossierId/bilan/hypotheses/:id` — supprime le jeu **et** ses versions,
      dans une transaction (deux collections écrites).
- [x] AC-2 — La suppression est **refusée** (409) si une version du jeu a servi à un export figé —
      dès que **STORY-073** journalise le triplet de reproductibilité, cette condition devient
      vérifiable. Tant qu'elle ne l'est pas, la suppression est autorisée et l'écran le dit.
- [x] AC-3 — `PATCH …/:id` (ou l'extension de `PUT`) accepte un `nom` ; l'unicité est re-vérifiée et le
      `E11000` reste traduit en 409.
- [x] AC-4 — Le 409 de nom pris **nomme** le jeu en conflit (`conflitAvec: { id, nom }`) — un refus qui
      oblige l'écran à retrouver le coupable dans sa propre liste est un refus incomplet.
- [x] AC-5 — Rôle : suppression réservée au `TENANT_ADMIN` (voir **STORY-470**).

## Conséquences ailleurs

- Même famille que **STORY-454**. À traiter d'un même mouvement si le PO le souhaite : le patron
  « créer sans pouvoir annuler » est un défaut de module, pas d'agrégat.

---

## Progress Tracking

### Livrable

| AC | État | Où |
|---|---|---|
| AC-1 | ✅ | `DELETE …/hypotheses/:id` — jeu **et** historique de versions retirés dans **une transaction**, avec la ligne de journal (`HYPOTHESES_SUPPRIMEES`) écrite **dedans**. |
| AC-2 | ✅ | Refus **409 `HYPOTHESES_EXPORTEES`** dès qu'un `EXPORT_EFFECTUE` vise ce jeu. |
| AC-3 | ✅ | `PATCH …/hypotheses/:id` avec `{ nom }` — **sans** créer de version. |
| AC-4 | ✅ | Le 409 de nom pris porte `details.conflitAvec: { id, nom }`, sur **les deux** chemins d'écriture du nom. |
| AC-5 | ✅ | Suppression `@Roles(TENANT_ADMIN)` + `@CodeRefusRole('SUPPRESSION_RESERVEE_ADMIN')`. |

### ⚡⚡ Deux prémisses de la fiche démenties par le code

**1. AC-2 était réputé non encore vérifiable.** La fiche dit « dès que **STORY-073** journalise le
triplet de reproductibilité, cette condition devient vérifiable. Tant qu'elle ne l'est pas, la
suppression est autorisée ». STORY-073 est **livrée depuis le 2026-07-24**, et `exporterPrevisionnel`
écrit déjà un `EXPORT_EFFECTUE` dont la **cible est le jeu d'hypothèses lui-même**. La garde est donc
posée **pour de bon**, pas en hook inerte — et elle a été prouvée en docker par un **export PDF réel**,
pas par un drapeau simulé.

⛔ **Interrogée sur la CIBLE, jamais sur `contexte.versionHypothesesId`.** Ce champ vaut l'`_id` du
**jeu** pour la version courante mais celui du **document de version** pour une version historisée : une
garde bâtie dessus aurait exigé de réunir d'abord les ids de toutes les versions, et **oublier cette
réunion l'aurait rendue muette sur les exports les plus anciens** — les plus susceptibles d'être partis
chez un banquier.

**2. Le 409 d'AC-4 n'arrivait pas au client, et rien ne l'aurait dit.** Le filtre d'exceptions **global**
`AllExceptionsFilter` **reconstruit** le corps d'erreur : il ne recopiait que `message` et `code`, et
**jetait en silence** tout autre champ posé sur la charge de l'exception. `conflitAvec` était donc perdu
entre le service et la réponse HTTP, **sans erreur** — ni au build, ni aux tests unitaires, qui
inspectent l'exception et non la réponse. Même mécanisme que la disparition d'`error` en STORY-447.

⛔ **Correctif : un point d'extension `details`, opt-in, jamais un épandage de la charge.** Recopier tout
champ inconnu publierait au client ce qu'un développeur met dans une exception pour son propre usage.
Seul ce qui est **délibérément** placé sous `details` sort.

### Décisions

- **`PATCH` et non l'extension de `PUT`.** `PUT` édite les paramètres et incrémente la version ; un nom
  ne change aucun chiffre. Le faire passer par `PUT` fabriquerait une version d'historique aux hypothèses
  **identiques** à la précédente, et le rejeu `?versionHypotheses=` gagnerait un numéro ne désignant rien.
- **Type d'audit propre (`HYPOTHESES_SUPPRIMEES`), pas `JEU_SUPPRIME` réutilisé** : collections, gardes et
  conséquences différentes. Vérifié qu'aucune lecture n'est **exhaustive** sur `AuditType` (ni
  `Record<AuditType, …>`, ni `Object.values`) — l'étendre est sans risque.
- **La trace commite AVEC l'acte** (`journaliserDansTransaction`), leçon de la revue de sécurité de
  STORY-454 : une suppression ne laisse **aucun** document, donc cette ligne est la seule trace
  *attribuée* qui existera jamais.

### Mutations

| # | Mutation | Constaté |
|---|---|---|
| M1 | garde AC-2 **retirée** | ⚠️ **rouge par ERREUR DE COMPILATION — ne prouve rien** (`conflitExporte` devient inutilisée). Rejouée sous M1 bis. |
| M1 bis | garde AC-2 posée **APRÈS** la suppression (compile) | **1 e2e rouge** |
| M2 | trace confiée au canal best-effort `journaliser` | **2 unitaires rouges** |
| M3 | garde interrogeant `JEU_CREE` au lieu d'`EXPORT_EFFECTUE` | **1 unitaire rouge** |
| M4 | suppression ouverte au `TENANT_USER` | **1 e2e rouge** |
| M5 | filtre cessant de transmettre `details` | **2 e2e rouges** |

### Vérification docker (stack réelle, export PDF réel)

| Mesure | Résultat |
|---|---|
| AC-1 | jeu **et ses 2 versions** retirés ensemble ; `0` orphelin ; ligne `HYPOTHESES_SUPPRIMEES` portant l'auteur, le libellé `v464-a-supprimer` et `contexte.versions = 2`. |
| AC-2 | **export PDF réel → 200**, puis `DELETE` → **409 `HYPOTHESES_EXPORTEES`**, et le jeu est **toujours en base**. |
| AC-3 | après `PATCH`, `version` reste à **1** et l'historique reste **vide**. |
| AC-4 | renommage **et** création rendent `details.conflitAvec: { id, nom }` du jeu occupant. |
| AC-4 | ⚡ **le nom libéré est réattribuable** : recréer sous le nom du jeu supprimé → **201**. C'est le fait de la story. |
| AC-5 | `DELETE` en `TENANT_USER` → **403 `SUPPRESSION_RESERVEE_ADMIN`** ; **témoin** : le même jeton **renomme** en 200. |

### Portes

Lint 0 warning · build OK · **2 049** unitaires verts, seuils tenus (98,90 / 94,35 / 98,88 / 98,93) ·
**577** e2e verts.

⚠️ **Les e2e ne sont verts en parallèle que sur une machine au repos.** Avec la stack docker complète en
marche, deux passes ont rendu des échecs **par dépassement de délai à 5 s** (jusqu'à une suite entière),
sur des suites que ce diff ne touche pas — `bilan-referentiel`, `bilan-jeu-etats`. Chaque suite passe
**isolément**, et la mesure de référence a été prise **en séquentiel** (`--runInBand`) : **577/577,
22 suites sur 22**. C'est une fragilité d'ordonnancement pré-existante, pas un effet de la story.

### Couverture : quatre trous dans le code NEUF, comblés

Le rapport **par fichier** montrait `hypotheses.repository.ts` à 33 % de fonctions,
`version-hypotheses.repository.ts` à 80 %, `audit.service.ts` à 80 % et `hypotheses.controller.ts` à
54 % — les seuils **globaux** passaient pourtant. Deux des essais ajoutés ont révélé des défauts dans
mes propres tests :

- passer `undefined` à un paramètre **à valeur par défaut** déclenche cette valeur : mes deux essais
  fail-closed se lisaient **verts sur un contexte bien présent**. Le piège était déjà documenté trois
  lignes plus bas dans le même fichier ;
- ma suppression **levait de façon synchrone** alors que l'appelant a déjà ouvert sa transaction. Le
  dépôt voisin (`supprimerSiBrouillon`) documente explicitement pourquoi une telle garde doit **rejeter
  la promesse** ;
- une assertion « le canal best-effort n'est pas emprunté » était **vacante** : le mock ne portait pas la
  méthode, donc elle était vraie par absence. Le canal est désormais **fourni exprès** pour que
  l'assertion mesure quelque chose.

### Hors périmètre, assumé

- **Le renommage n'est pas journalisé.** Les AC ne le demandent pas, et il ne détruit rien : le document
  survit et porte son nom courant. Seule la **suppression** exige une trace attribuée.
- **`STORY-470`** reste le lieu de la systématisation des rôles ; AC-5 ne nomme que le refus **que cette
  story restreint**, conformément au contrat de `@CodeRefusRole`.
