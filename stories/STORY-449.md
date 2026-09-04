# STORY-449 : `GET /bilan/etats/:id` RE-CALCULE la liasse d'un jeu VALIDÉ au lieu de rendre son snapshot — deux nombres pour un même état figé

Status: done

**Épic :** EPIC-012 — Validation, immutabilité, exercices, audit
**Service :** `bilan-service`
**Points :** 3 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-034** (cycle brouillon → validé, snapshot immuable, piste d'audit), 2026-08-27.
Relevé en lisant les contrôleurs de `bilan-service` sur `origin/dev`.

---

## Le fait

`JeuEtatsService.consulter()` fait, **quel que soit le statut** :

```ts
const jeu = await this.chargerParId(id);
const liasse = await this.produireLiasse(organizationId, jeu);   // ← re-production
const dernier = jeu.statut === VALIDE ? await this.snapshots.dernier(jeu._id) : null;
return { jeu, liasse, version: dernier?.version ?? null };
```

La réponse porte donc `statut: 'VALIDE'`, `version: 2` — **et une liasse recalculée à l'instant**,
pas celle qui a été figée. Tant que le paquet référentiel ne bouge pas, les deux coïncident. Le jour
où l'administrateur publie une révision du paquet (D12 : les référentiels sont administrables),
`GET /:id` rend des chiffres **différents du snapshot**, sous un badge « VALIDÉ », **sans que rien
ne le signale**.

C'est le mode de panne le plus coûteux de la série : plausible, silencieux, et il contredit
l'invariant que la story vend (NFR-004).

## Critères d'acceptation

- [x] AC-1 — Pour un jeu `VALIDE`, `GET …/etats/:id` rend la **liasse du dernier snapshot**, jamais
      une re-production.
- [x] AC-2 — La réponse porte `origine: 'SNAPSHOT' | 'CALCUL'` : le client doit pouvoir savoir ce
      qu'il regarde sans déduire du statut.
- [x] AC-3 — Un jeu `BROUILLON` continue d'être produit à la volée (`origine: 'CALCUL'`) —
      c'est la définition d'un brouillon.
- [x] AC-4 — Un jeu `VALIDE` **sans** snapshot (donnée antérieure, incohérence) → `500` explicite,
      **jamais** un repli silencieux sur le calcul.
- [x] AC-5 — Un test **de non-régression du référentiel** : figer une version, changer la version du
      paquet, relire — les chiffres sont **identiques** et `origine: 'SNAPSHOT'`.

## Conséquences ailleurs

- **Actionnable côté front dès aujourd'hui, sans backend** : lire une liasse VALIDÉE depuis
  `GET …/versions/:version`, jamais depuis `GET …/etats/:id`. C'est la règle d'appel que FE-034
  inscrit et que la maquette écrit à l'écran.
- Même famille que **STORY-452** (le snapshot n'a pas d'empreinte de son contenu) : sans elle, rien
  ne permettrait même de **constater** la divergence.

---

## Progress Tracking

**Statut : `done`** — implémentée, validée, revue (code + sécurité), **vérification docker
rejouée sur l'état final**, PR `bilan-service` **#81** (2 commits) rebase-mergée sur `dev`
le 2026-09-04.

Branches créées **avant** la première ligne de code :

```
docs             MNV-449
bilan-service    MNV-449
```

**Un seul dépôt impacté.** Aucune écriture, aucune transaction, aucun contrat d'événement.

### Ce qui est livré

- **AC-1** — un jeu **`VALIDE` ou `DEPOSE`** rend la liasse du **dernier snapshot**. Le
  prédicat est `!== BROUILLON`, jamais `=== VALIDE` : c'est le piège que la revue de
  STORY-446 avait déjà relevé sur `version`, et l'appliquer ici laisserait la liasse **la
  plus avancée du cycle** être recalculée.
- **AC-2** — `origine: SNAPSHOT | CALCUL`, publiée en **énumération** OpenAPI sur les
  **sept** routes qui rendent `JeuEtatsResponseDto`.
- **AC-3** — un `BROUILLON` reste produit à la volée, et le snapshot n'est **même pas lu**.
- **AC-4** — jeu figé **sans** snapshot ⇒ **500 `LIASSE_FIGEE_INTROUVABLE`**. Aucun repli :
  il rendrait des chiffres plausibles sous « VALIDÉ », le mode de panne exact que la story
  ferme.
- **AC-5** — gardé par un test qui fait rendre au moteur une liasse **différente** de celle
  du snapshot. C'est la seule façon de distinguer les deux sources : elles coïncident au
  franc près tant que le paquet ne bouge pas.

### ⚠️ La fiche est antérieure à STORY-446

Elle cite le code avec `=== VALIDE` ; le statut `DEPOSE` n'existait pas encore. « Un jeu
VALIDE » y désigne « un jeu **figé** », ce qui vaut aujourd'hui `VALIDE ∪ DEPOSE`.

### ⚠️ `origine` est un paramètre REQUIS, sans défaut

`JeuEtatsResponseDto.from(jeu, liasse, version, origine)` : un défaut ferait passer en
silence l'appelant qui l'oublierait, et le champ ne vaut que s'il est **vrai sur les sept
routes**. Le compilateur le réclame. C'est ce qui a forcé à regarder `deposer`, qui servait
la même liasse recalculée sur l'acte le plus engageant du cycle — sa réponse sert désormais
la liasse figée **de la version déposée**, pas la dernière : c'est celle-là qui fait foi
devant l'administration.

### ⚡⚡ Revue de code — `consulter()` a changé de SENS, ses DEUX autres appelants étiquetaient en dur

**C'est le constat de la story, et il n'était visible d'aucun test.** `consulter()` n'est pas
appelée que par `GET /:id` : `ExportService` et `ConsultationService` l'appellent aussi, et
**coiffaient son résultat d'étiquettes posées en dur**. Tant qu'elle re-produisait toujours
la liasse, ces étiquettes étaient vraies. Depuis qu'elle sert le snapshot d'un jeu figé,
elles mentent — et le contenu, lui, est devenu **opposable**.

**⛔ BLOQUANT — l'export imprimait les chiffres FIGÉS sous « Brouillon — non figé ».**
`chargerBrouillon` posait `statut: 'BROUILLON'`, `version: null`, le `checksum` du **jeu** et
la version de moteur **courante**. Un `GET …/export/etats/:id?format=pdf` **sans** `version`
sur un jeu validé produisait `liasse-2025-brouillon.pdf`, en-tête « BROUILLON — NON FIGÉ »,
**contenant la liasse opposable**. Et la piste d'audit enregistrait `statut: BROUILLON`,
`version: null`, `snapshotId: null` **avec l'empreinte du document** : plus rien ne disait
ensuite **quels chiffres** ce PDF portait. La description Swagger publiée affirmait la même
chose. Un jeu figé est désormais **redirigé vers `chargerVersionFigee`**, qui tire *tout* du
snapshot — checksum, moteur d'alors, `_id` pour l'audit. Recopier ces champs les aurait fait
diverger une deuxième fois.

**⚠️ La vue de consultation publiait `vue: {type: 'BROUILLON', version: null}`** en servant le
snapshot. Ce DTO ne porte **pas** `origine` : `vue.type` est sa seule indication, et elle
était fausse.

**⚠️ JSDoc détaché par insertion** — le bloc documentant la garde des six montants de
STORY-448 avait été séparé de son test par l'insertion du test de cette story. Recollé ; ce
serait la **10ᵉ récidive** de la famille.

**⚠️ Deux doubles e2e omettaient `origine` et `version`** : la branche « jeu figé » n'était
jamais empruntée, et la consultation publiait `version: undefined` — une clé **absente** du
JSON, que le contrat n'autorise pas.

Instruits puis **écartés** : un snapshot ancien sans `referentiel`/`checksum`/`controles` est
**impossible** (ces champs sont dans `LiasseProduite` depuis MNV-064, **avant** la création de
`snapshots_liasse` en MNV-065) · la modification de `deposer` est **nécessaire**, pas un
débordement · aucune tautologie ni garde vacante dans les nouveaux tests, qui distinguent les
deux sources par **identité d'objet**.

### ⚡ Revue de sécurité — aucun constat

Blanchi **avec preuve** : le diff ne touche aucun `@Roles`, guard, `@Public`, `@Throttle`,
`APP_GUARD`, `process.env` ni secret, et n'ajoute ni ne retire **aucune route**.

- **Divulgation par changement de source** — le snapshot porte `tenantId`, `dossierId`,
  `soldesN`, `validePar`… mais **rien ne traverse** : `LiasseProduite` est un type **fermé**
  de 8 clés, et les trois chemins projettent champ par champ. `modeleLiasse` ne lit du
  document snapshot **qu'une** valeur, `valideAt`.
- **Cloisonnement de la seconde lecture** — `snapshots.dernier()` passe par `scope()`,
  surchargée par `DossierScopedRepository`, qui fusionne `{dossierId}` **par-dessus**
  `{tenantId}` ; les deux résolutions **lèvent** sans contexte. Même couple que
  `chargerParId`.
- **Le 500 n'est pas un oracle** — il ne se déclenche qu'après un `chargerParId` réussi, sur
  une ressource déjà lisible. Corps en liste blanche stricte, stack seulement dans le log.
  L'état « figé sans snapshot » n'est pas atteignable par un appelant : `valider` écrit
  snapshot **et** bascule dans **une** transaction.
- **Export** — throttler 10/60 s intact ; le préfixe `vN` est un nombre passé par l'allowlist
  `assainirNomFichier` ; le `snapshotId` ajouté à l'audit **y était déjà publié** par le
  dépôt.
- ⚠️ **Perte de défense en profondeur instruite** : un jeu figé ne passe plus par
  `resolveReferentielForOrg`, qui rejouait le contrôle d'entitlement. **Non exploitable** —
  le `BilanAccessGuard` interroge le **même** modèle, par le **même** `organizationId`, avec
  le **même** prédicat, **avant** le handler.

### Vérification

Lint 0 warning · build OK · **1 742 unitaires + 482 e2e verts** · couverture **94 / 98,77 /
98,84 / 98,82** · **8 mutations rouges par assertion**, aucune par erreur de compilation :

| mutation | ce qui vire au rouge |
|---|---|
| la liasse est **toujours** re-produite (le défaut d'origine) | 7 unitaires |
| `!== VALIDE` : un jeu **DÉPOSÉ** est recalculé | 2 unitaires |
| **repli silencieux** sur le calcul quand le snapshot manque | unitaires AC-4 |
| `origine` ment : `SNAPSHOT` annoncé `CALCUL` | 3 unitaires |
| le **dépôt** re-produit sa liasse au lieu de servir la figée | 1 unitaire |
| `origine` n'est pas projetée au contrat | e2e |
| l'**export** réétiquette en dur « BROUILLON » sur un jeu figé | spec export |
| la **consultation** réétiquette en dur « BROUILLON » / `null` | spec consultation |

⚠️ Une exécution intermédiaire de la suite complète a vu `bilan-referentiel` tomber en
**timeout** sous charge machine (un test qui itère sur **tous** les postes publiés) ; verte
en isolation (20/20) et à la réexécution complète. Signature **distincte** du flake
d'authentification déjà fiché.

**Vérification docker sur jeton RS256 réel, REJOUÉE sur l'état final** (après les correctifs
de revue, qui touchent le chemin de l'export) :

| critère | mesure |
|---|---|
| AC-1 / AC-2 | `GET /:id` ⇒ `origine: SNAPSHOT`, `version: 3` |
| ⚡⚡ AC-1 par **sonde** | une valeur qu'**aucun recalcul ne peut produire** (777 777 777) plantée **dans le snapshot en base** ressort telle quelle, et `valide` est dérivé de la liasse **figée** |
| AC-4 | snapshots rendus introuvables ⇒ **500 `LIASSE_FIGEE_INTROUVABLE`** |
| AC-3 | réouverture ⇒ `CALCUL` / `version: null` ; re-validation ⇒ `SNAPSHOT` / `version: 3` |
| revue ① | export **sans** `version` sur le jeu figé ⇒ **`liasse-2025-v3.pdf`**, plus `…-brouillon.pdf` |
| revue ① | l'audit enregistre `statut: VERSION`, `version: 3`, `snapshotId` — **vérifié égal au `_id` réel de la v3** |
| revue ② | consultation **sans** `version` ⇒ `vue: {type: 'VERSION', version: 3}` |
| non-régression | `versions/:version` et `versions/comparaison` toujours **200** |

### ⛔ Ce qui n'a PAS été fait, et pourquoi

- ⚠️ **`POST …/rouvrir` rend `version: 2` là où `GET /:id` rend `version: null`**, sur le même
  jeu à la même seconde, et le DTO documente `version` comme « null si jamais validé » — ce
  qui est **faux** pour un jeu rouvert. Vérifié sur `origin/dev` : le calcul de `version` est
  **inchangé ligne à ligne** par cette story, le défaut date de **STORY-065**. Hors périmètre,
  **à ficher séparément**.
- Quand l'accusé porte sur une version qui n'est **plus la dernière**, `POST /deposer` et
  `GET /:id` servent des chiffres différents, tous deux `origine: SNAPSHOT`. Ce n'est pas une
  contradiction : chaque réponse porte le `version` du snapshot qu'elle sert. Publier ici la
  dernière dirait **le contraire de ce que l'accusé atteste**. Documenté dans le code.
