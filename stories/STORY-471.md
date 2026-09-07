# STORY-471 : Le prévisionnel est le seul objet du module sans piste d'audit — ni auteur, ni motif, ni événement de journal

Status: done

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 3 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-035** (hypothèses de prévisionnel paramétrables), 2026-08-27.
Relevé par la passe expert-comptable sur l'écran FE-035 fini, en cherchant quoi afficher dans la colonne « qui » de l'historique des versions.

---

## Le fait

Trois constats, tous vérifiables en une lecture :

1. **`AuditType` ne connaît pas les hypothèses.** L'énumération compte huit actes — `JEU_CREE`,
   `JEU_RECALCULE`, `JEU_VALIDE`, `JEU_ROUVERT`, `EXERCICE_CREE`, `EXERCICE_CLOS`,
   `EXERCICE_ROUVERT`, `EXPORT_EFFECTUE` — et **aucun** ne concerne le prévisionnel.
2. **`JeuHypothesesController` n'injecte pas `AuditService`**, contrairement à `JeuEtatsController`,
   `ExerciceController` et `ExportService`.
3. **`versions_hypotheses` ne stocke ni `userId` ni motif** : `tenantId`, `dossierId`,
   `jeuHypothesesId`, `version`, `hypotheses`, `base`, `createdAt`. C'est **moins** que le journal de
   la liasse, qui porte au moins un identifiant d'utilisateur (et dont l'absence de **nom** est déjà
   l'objet de STORY-441).

L'historique des versions dit donc **ce qui** a changé, jamais **qui** ni **pourquoi**. Six mois plus
tard, personne ne peut expliquer pourquoi la croissance est passée de 8 à 5 % — alors que c'est
exactement la question qu'un associé, un banquier ou un contrôleur posera.

Le versionnement append-only a été construit (D1 du cadrage du 2026-07-23) pour rendre les projections
**rejouables**. Il l'est. Mais il n'est pas **explicable**, et une projection qu'on ne peut pas
justifier ne vaut pas beaucoup mieux qu'une projection qu'on ne peut pas rejouer.

## Critères d'acceptation

- [ ] AC-1 — `AuditType` gagne `HYPOTHESES_CREEES`, `HYPOTHESES_MODIFIEES` et — si elles sont livrées —
      `HYPOTHESES_SUPPRIMEES`, `HYPOTHESES_REBASEES`.
- [ ] AC-2 — `JeuHypothesesController` journalise sur le patron **exact** de `JeuEtatsController`
      (`journaliser` est sûr par conception : il ne throw jamais, un échec de journal ne casse pas
      l'acte).
- [ ] AC-3 — `versions_hypotheses` stocke `creePar: userId`, écrit par le **service** au moment de
      l'insertion — jamais transmis par l'appelant.
- [ ] AC-4 — Un `motif` **optionnel** accompagne l'édition (`EditerHypothesesDto.motif`, borné), stocké
      sur la version sortante. Optionnel : l'imposer ferait saisir « maj » à tout le monde.
- [ ] AC-5 — `GET …/:id/versions` publie auteur et motif ; l'anti-énumération reste inchangée.

## Conséquences ailleurs

- Même famille que **STORY-441** (le journal de la liasse ne sert ni nom ni rôle) et **STORY-456** (le
  déficit reportable persiste sa piste d'audit sans la publier). Trois occurrences : c'est un patron de
  module, à trancher une fois.
- L'écran FE-035 affiche aujourd'hui « Auteur non tracé » en pointillé, faute de mieux.


---

## Progress Tracking

**Statut : done** — clôturée le 2026-09-07. PR `bilan-service` #102 rebase-mergée sur `dev`.

### Ce que la lecture du code a démenti ou précisé, AVANT d'écrire

⚡ **La fiche est PARTIELLEMENT PÉRIMÉE.** Elle a été rédigée le 2026-08-27 ; **STORY-464 a
été clôturée le 2026-09-06**, et elle a livré une partie du constat n° 1 :

| Constat de la fiche | État réel au 2026-09-07 |
|---|---|
| « `AuditType` compte huit actes, aucun sur le prévisionnel » | **Faux** : `HYPOTHESES_SUPPRIMEES` existe depuis STORY-464, et elle est journalisée **dans la transaction** de suppression. L'énumération compte aussi `JEU_COMPLEMENTS_SAISIS`, `LIASSE_DEPOSEE`, `JEU_SUPPRIME` et les trois `MAPPING_SURCHARGE_*`. |
| « `JeuHypothesesController` n'injecte pas `AuditService` » | **Vrai du contrôleur**, mais le **service**, lui, l'injecte déjà (garde `aEteExporte` + journal de suppression). |
| « `versions_hypotheses` ne stocke ni `userId` ni motif » | **Vrai**, inchangé. |

Restent donc à livrer : `HYPOTHESES_CREEES`, `HYPOTHESES_MODIFIEES`, `HYPOTHESES_REBASEES`.

### Décisions de conception

- **D-471-1 — L'auteur d'une version est REPORTÉ, jamais celui de l'acte qui l'archive.**
  La version historisée porte les paramètres de l'état **précédent** ; elle est insérée par
  l'édition **suivante**. Écrire l'auteur de l'acte d'archivage y ferait dire « Awa a saisi
  ces paramètres » alors qu'Awa vient de les **remplacer** — un journal plausible et faux,
  exactement ce que la story existe pour fermer. Le `JeuHypotheses` **courant** porte donc
  `creePar` (et `motif`) de sa version courante, et `versionner()` les **reporte** dans la
  version sortante, comme il reporte déjà la `base` sortante.
- **D-471-2 — Le `motif` accompagne les paramètres qu'il justifie**, donc le jeu en `V+1`,
  puis migre dans l'historique quand cette version est à son tour archivée. La fiche écrit
  « stocké sur la version sortante » ; pris à la lettre sur le vocabulaire du code
  (`versionSortante = doc.version`), le motif « passage de 8 à 5 % » se serait attaché à la
  version qui portait **8 %**, décalé d'un cran.
- **D-471-3 — La DUPLICATION est journalisée en `HYPOTHESES_CREEES`**, avec
  `contexte.duplicateDe`. STORY-466 (livrée le 2026-09-07, après la rédaction de la fiche)
  a ouvert un **second** chemin de création : ne journaliser que `POST` ferait apparaître
  des jeux dont le journal ne porte aucun acte de naissance. Aucun type neuf n'est inventé
  hors des quatre que l'AC-1 nomme.
- **D-471-4 — Le RENOMMAGE n'est pas journalisé.** Aucun des quatre types de l'AC-1 ne le
  couvre, il ne crée pas de version et ne change aucun chiffre. Hors périmètre, à dessein.
- **D-471-5 — Rebaser sur une base déjà à jour (le no-op de STORY-465, AC-4) ne
  journalise RIEN.** Une ligne « rebasé » sur un acte qui n'a rien écrit est du bruit dans
  le journal même qu'on construit pour expliquer les changements. `rebaser()` rend donc
  `{ jeu, versionCreee }` : le contrôleur ne peut pas déduire le fait autrement, et un
  drapeau **optionnel** ajouté au type de retour commun aurait été `undefined` sur les cinq
  autres chemins.

### Livré

| Fichier | Ce qui change |
|---|---|
| `audit/audit.enums.ts` | `HYPOTHESES_CREEES`, `HYPOTHESES_MODIFIEES`, `HYPOTHESES_REBASEES` (AC-1) |
| `hypotheses.schema.ts` | `versionPar` + `motif` sur le jeu **courant** — attributs de sa version courante |
| `versions/version-hypotheses.schema.ts` | `creePar` + `motif`, **reportés** du parent à l'archivage (AC-3) |
| `dto/editer-hypotheses.dto.ts` | `motif?` facultatif, rogné, borné 3..500, sans caractère invisible (AC-4) |
| `hypotheses.service.ts` | `creer`/`dupliquer`/`editer` prennent l'auteur ; `versionner` reporte auteur et motif ; `rebaser` rend `{ jeu, versionCreee }` |
| `hypotheses.controller.ts` | journalise les 4 actes ; résout les auteurs **en un lot** (patron `AuditController`) |
| `dto/version-hypotheses.dto.ts` | `auteur` (`AuteurDto \| null`) et `motif` publiés sur la liste **et** le détail (AC-5) |

### Portes de qualité

| Porte | Résultat |
|---|---|
| Lint | 0 erreur, 0 avertissement (`{src,test}/**/*.ts`) |
| Build | `nest build` OK |
| Unitaires | 2 221 tests, 0 échec (122 sur le module) |
| e2e | 94 tests sur `bilan-hypotheses`, 0 échec |
| Mutation | **8 mutations volontaires, 8 rouges** (cf. ci-dessous) |

### Mutations volontaires — ce que chaque test filtre vraiment

| Mutation | Test devenu rouge |
|---|---|
| `creePar: doc.versionPar` → `patch.versionPar` | D-471-1, en unitaire **et** en e2e |
| `$unset` du motif supprimé | « le motif d'une édition SANS motif est EFFACÉ » |
| le no-op rend `versionCreee: true` | « le NO-OP rend `versionCreee: false` » |
| le contrôleur journalise aussi le no-op | « le NO-OP de rebasage ne journalise RIEN » |
| version **entrante** dans le journal au lieu de la sortante | les deux essais du contexte de `HYPOTHESES_MODIFIEES` |
| auteurs résolus dans une **autre** organisation | « SÉCURITÉ — résolus dans l'organisation du JWT » |
| filtre des identifiants nuls retiré | « une version SANS auteur ne fait résoudre personne » |
| la ligne **courante** perd son auteur | « l'historique rend l'auteur de CHAQUE version » |

⚠️ Une neuvième mutation — l'organisation remplacée par un `ObjectId` neuf — a rougi par
**erreur de compilation** (`tenantId` devenu inutilisé) : elle ne prouvait rien, et a été
refaite en gardant le paramètre employé.

### Vérification docker — base réelle `bilan_service`

Stack `docker compose` en marche, `bilan-service` **redémarré** pour garantir que le code
servi est celui de la branche (confirmé : `Found 0 errors`, puis une création acceptée avec
les champs neufs). Deux jetons RS256 signés localement pour **deux identités réelles** du
read-model — Ada Verif et Ama Koffi — la clé privée lue sans être affichée puis effacée.

Scénario : Ada crée le jeu · Ama édite **avec** motif · Ama réédite **sans** motif · Ada
rebase (deux fois : un no-op puis un rebasage réel après réouverture/revalidation de la
liasse, snapshot v4).

| Fait mesuré | Résultat |
|---|---|
| ⚡⚡ `versions_hypotheses` v1 porte **Ada**, pas Ama qui l'a remplacée | ✅ (D-471-1) |
| v2 porte le motif qui **justifie ses** paramètres | ✅ (D-471-2) |
| Le motif est **effacé** par une édition sans motif | ✅ le champ est retiré |
| `motif` de **type** `null` en base | **0 partout** — le `$unset` retire, il ne met pas `null` |
| Journal : `HYPOTHESES_CREEES` puis 2 × `MODIFIEES` (versions sortantes 1 et 2) | ✅ |
| **Une seule** ligne `HYPOTHESES_REBASEES` pour **deux** appels | ✅ (D-471-5 : le no-op n'écrit rien) |
| Le rebasage ne touche ni `versionPar` ni `motif` | ✅ |
| `GET …/versions` publie « Ada Verif » sur v1, « Ama Koffi » sur v2 et v3 | ✅ (AC-5) |
| Un `creePar` versé par l'appelant | **400** `property creePar should not exist` (AC-3) |
| Motif d'espaces · saut de ligne | **400** · **400** (AC-4) |
| Jeu **antérieur** à la story (32 en base) | `auteur: null`, `motif: null`, **200** — jamais un nom inventé |
| Versions **orphelines** · versions sans `dossierId` | **0** · **0** |

⚠️ **Un faux positif de ma propre mesure, et il vaut d'être écrit** : la requête
`{ motif: null }` a d'abord rendu 8 versions et 33 jeux, ce qui se lisait comme « le `$unset`
écrit `null` ». C'est faux — en Mongo, `{ champ: null }` matche **aussi l'absence du champ**.
Le seul test qui sépare les deux est `{ $type: "null" }`, et il rend **0**. Une mesure ne
prouve que ce qu'elle interroge (famille STORY-455).

### Non livré, à dessein

- **`HYPOTHESES_DUPLIQUEES`** — la duplication émet `HYPOTHESES_CREEES` avec
  `contexte.duplicateDe` (D-471-3). Aucun type n'est inventé hors des quatre que l'AC-1 nomme.
- **Le renommage n'est pas journalisé** (D-471-4) : hors des quatre types, aucune version
  créée, aucun chiffre changé.
- **`HypothesesResponseDto` ne publie pas l'auteur** : l'AC-5 porte sur l'historique, et la
  version courante y figure déjà avec le sien.

### Revue de code — 5 constats, tous corrigés (commit dédié)

| Constat | Ce qu'il cassait |
|---|---|
| ⛔ **bloquant** — `rebaser` résolvait l'auteur **après** l'écriture | La garde de `userObjectId` ne tombait qu'au moment de journaliser, donc **après** le commit. Un jeton dont le `sub` n'est pas un `ObjectId` — rien ne le valide en amont — recevait un **403 sur un rebasage déjà écrit** : le client croit l'acte refusé pendant que ses chiffres de départ ont changé. Famille STORY-451. |
| ⚡ un essai **vacant**, seul filet du contexte de rebasage | La fixture donnait `jeu.version = 2` sur un snapshot version 1 : `version` (2−1) et `snapshotVersion` (1) valaient **tous deux 1**. Publier l'un à la place de l'autre — la confusion exacte que le docstring sépare — laissait l'essai **vert**. Fixture rendue discriminante (4 contre 2). |
| ⚡ le **contrat publié** devenait faux | `AuditEventResponseDto.contexte` énumère quels types portent quelles clés et annonçait « Six types ». Le compte était **déjà faux d'une unité** (STORY-464) et cette story en ajoutait trois. Décompte retiré, les quatre actes du prévisionnel décrits — dont le fait que leur `motif` est une **saisie libre publiée**. |
| ⚡ `contexte.duplicateDe` journalisait la **chaîne d'URL brute** | `isValid` accepte l'hexadécimal en **majuscules** : la ligne d'audit ne correspondait alors ni au champ de la réponse, ni à un `?cibleId=` construit depuis elle. Précédent STORY-464. |
| ⚡ `PUT :id` gagnait **quatre causes de 400** sans les publier | `@ApiBadRequestResponse` les documente, comme le fait déjà son patron sœur `POST …/:id/rouvrir`. |

### Revue de sécurité — 1 constat, corrigé (commit séparé)

⚡⚡ **Le constat portait sur ma propre justification.** Le docstring qui motive le canal
best-effort affirme que les quatre actes « laissent chacun un document porteur de leur
auteur ». Vrai de trois — ils posent `versionPar` — et **faux du quatrième** : D-471-1
avait décidé, à raison, que le rebasage ne touche pas `versionPar` puisqu'il ne change pas
les paramètres. La ligne `HYPOTHESES_REBASEES` était donc la **seule trace attribuée** d'un
acte qui change la base de calcul d'un document remis à une banque, confiée à un canal dont
le `catch` avale ses erreurs : un `SIGTERM` entre le commit et l'audit rendait l'acte
**répudiable**. Même famille que STORY-454, sur un acte engageant plutôt que destructeur.

**Corrigé à la racine, pas en réécrivant le commentaire** : `jeux_hypotheses` gagne
`rebasePar`, posé **dans la transaction**. La propriété redevient vraie des quatre actes, et
le docstring dit désormais que c'en est la **condition** — quiconque ajoutera un acte ici
devra vérifier qu'il laisse un document nommant son auteur, sinon c'est
`journaliserDansTransaction` qu'il lui faut.

Les onze autres pistes examinées ont été écartées, dont la principale : l'invariant d'appel
d'`AuteursRepository` (read-models d'identité **globaux à la plateforme**) **tient** sur le
nouvel appelant — les `userId` versés viennent tous d'un jeu chargé par le repository
dossier-scopé, et l'organisation passée est celle du JWT.

### ⚡⚡ Vérification docker REJOUÉE — et ce qu'elle a attrapé

Le correctif de sécurité touchait un chemin déjà vérifié, donc la mesure a été rejouée sur
l'état final. **Elle a d'abord rendu `rebasePar` ABSENT.**

> **`Found 0 errors` du watcher ne prouve PAS que le nouveau code est servi.** Deux
> recompilations vertes n'avaient produit **aucun** `Nest application successfully started` :
> le port était encore tenu par le process précédent, qui a continué de servir le code
> d'avant le correctif. C'est le démarrage réussi qu'il faut compter, pas la compilation.

Après redémarrage effectif, scénario complet rejoué sur l'état final, avec **deux identités
réelles** du read-model :

| Fait mesuré | Résultat |
|---|---|
| Ada rebase un jeu dont les paramètres sont d'Ama | `rebasePar` = **Ada**, `versionPar` reste **Ama** |
| La version 1 porte **Ada**, pas Ama qui l'a remplacée | ✅ (D-471-1) |
| Le motif est effacé par une édition sans motif | ✅ · `$type: "null"` rend **0** partout |
| Duplication appelée avec un id en **MAJUSCULES** | le journal porte la forme **canonique**, identique au champ du document |
| Journal : `CREEES` (Ada) puis 2 × `MODIFIEES` (Ama, versions sortantes 1 et 2) | ✅ |

### Portes finales

Lint 0 · build OK · **2 227** unitaires (1 ignoré) · **94** e2e · couverture globale
**99,02 / 94,68 / 99,28 / 99,04** — très au-dessus des seuils 65/90/90/90 · **12 mutations
volontaires** au total, toutes rouges (deux premières tentatives rouges par **erreur de
compilation** écartées : elles ne prouvaient rien, et ont été refaites en gardant le
paramètre employé).
