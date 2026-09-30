# STORY-551 : La colonne N-1 est retraitée avec la table de passage d'aujourd'hui — et la liasse ne le dit pas

Status: done

**Épic :** EPIC-011 — États financiers (liasse OHADA : Bilan, CR, TFT/TAFIRE, annexes)
**Service :** `bilan-service` (`:3004`) — `modules/bilan/etats`, `modules/bilan` (moteur)
**Points :** 3 · **Sprint :** S20 · **Complexité :** medium
**Origine :** lecture du corpus pédagogique `Image_lecons` (2026-08-28) — fiches **2.2 permanence
des méthodes** et **2.5 indépendance des exercices**, qui sont la justification comptable de la
colonne N-1 et du verrou de référentiel.
**Réf. code :** `bilan-engine.service.ts` (`soldesN`, `soldesN1` → **un seul** `pkg` résolu) ·
`bilan-production.service.ts:construireControle` ·
`comparaison-exercices.service.ts` (`referentielHomogene`, `referentielsEnPresence`)

---

## Le fait

Le moteur résout **un** paquet de référentiel et le passe aux deux agrégations :

```ts
produireBilan(referentielRef, soldesN, soldesN1?)  // un pkg, deux jeux de soldes
```

La colonne N-1 est donc calculée avec **la table de passage, les formules et les surcharges
d'aujourd'hui**, appliquées à la balance de l'année dernière.

⚡ **Ce n'est pas un défaut : c'est ce que la permanence des méthodes demande.** Comparer deux
exercices ventilés selon deux méthodes différentes produirait des variations qui ne mesurent que
le changement de méthode. Le moteur a raison.

⛔ **Le défaut est qu'il le fait en silence.** Le SYSCOHADA révisé impose de **mentionner** tout
retraitement des comparatifs. Ici, un lecteur de la liasse — banquier, associé, contrôleur — voit
deux colonnes qu'il croit être « ce qui a été déposé l'an dernier » et « ce qui sera déposé cette
année ». La colonne N-1 n'est ni l'un ni l'autre : c'est **la balance N-1 relue avec la méthode
N**, ce qui peut différer poste à poste de la liasse réellement déposée en N-1.

## Le contraste interne, et il est frappant

`bilan-service` sait déjà dire ça — **ailleurs**. `ComparaisonExercicesService` (FR-024,
STORY-074) publie :

| Champ | Ce qu'il dit |
|---|---|
| `referentielHomogene: boolean` | les exercices comparés partagent-ils la même version |
| `referentielsEnPresence[]` | lesquelles, nommément |
| `409 REFERENTIELS_HETEROGENES` | codes différents ⇒ aucun tableau honnête n'existe |
| garantie **D4** | *« chaque valeur vient de la colonne N du snapshot de son exercice ; la colonne N-1 d'un snapshot n'est jamais réutilisée »* |

⇒ **La comparaison par snapshots déclare sa méthode. La colonne N-1 du Bilan ne déclare rien.**
Et c'est la seconde que l'écran affiche (FE-031 amendement ① : le comparatif N-1 passe par
`soldesN1` dans le corps du dry-run, pas par `…/comparaison/…`).

⚠️ Les deux ne peuvent pas être alignées par la même réponse : la comparaison lit des liasses
**figées** (D1), le Bilan **recalcule**. C'est justement pourquoi la seconde doit dire qu'elle
recalcule.

## Périmètre

**Inclus**

- `BilanDto` publie un bloc `methodeN1`, présent **uniquement quand `soldesN1` est fourni** :
  - `retraite: true` — la colonne N-1 est produite par la méthode N, pas relue d'un dépôt ;
  - `referentiel: { code, version }` et `stamp` — les mêmes que N, **affirmés** plutôt que
    supposés (aujourd'hui le lecteur doit déduire de l'absence d'un second `stamp`) ;
  - `surchargesAppliquees: number` — combien d'arbitrages de la table de passage ont été
    appliqués aux deux colonnes. Zéro est une information ; le champ absent n'en est pas une.
- Le même bloc sur `CompteResultatDto` et `TftDto`, qui prennent `soldesN1` par le même chemin.

**Hors périmètre**

- **Comparer la colonne N-1 recalculée à la liasse N-1 réellement déposée.** Ce serait la vraie
  information (« votre poste AZ valait 12 M au dépôt, il en vaut 11 M relu à la méthode
  d'aujourd'hui »), et elle exige de lire un `SnapshotLiasse` — donc la persistance, hors
  périmètre ici. ⇒ **À ficher à part si le PO la veut** ; c'est le prolongement naturel de
  FR-024 et le seul chemin qui rendrait le retraitement *chiffré* et non seulement *déclaré*.
- Refuser un `soldesN1` d'un exercice non comparable. Rien ne relie encore une balance à un
  exercice du dossier autrement que par des dates (STORY-381 a livré `exerciceId` côté balance ;
  le dry-run, lui, reçoit des soldes bruts).

## Critères d'acceptation

1. Un dry-run **avec** `soldesN1` publie `methodeN1` complet ; **sans** `soldesN1`, le bloc est
   absent — pas présent à `null`, ce qui laisserait croire à un comparatif vide.
2. `methodeN1.surchargesAppliquees` compte les surcharges `VALIDATED` effectivement appliquées,
   et vaut `0` quand il n'y en a aucune.
3. Une liasse **persistée** (`POST …/bilan/etats`) porte le même bloc dans son snapshot : le
   retraitement doit survivre au figement, sinon la mention disparaît là où elle compte le plus.
4. Le bloc est au contrat OpenAPI avec ses types explicites (règle STORY-398).
5. Témoin de non-régression : aucune valeur de poste, aucun total, aucun `ecartN` ne change.

## Notes

- ⚡ **Deux principes, une seule story** : *permanence des méthodes* (2.2) dit qu'on applique la
  même méthode aux deux exercices — le moteur le fait ; *indépendance des exercices* (2.5) dit
  que chaque exercice porte ses propres charges et produits — d'où l'obligation de signaler
  qu'une des deux colonnes a été relue. Les deux ensemble donnent : **retraiter, et le dire.**
- ⚠️ L'écran distingue déjà « N-1 absent » de « N-1 = 0 »
  (`bilan.etats.comparatif.legendeSansComparatif`). Cette story ajoute la troisième mention qui
  manque : **« N-1 recalculé »**. Restitution : **FE-087**.

---

## Cadrage du 2026-09-30 — ce que le code dit, et les décisions qui en sortent

### Constats (prémisses vérifiées contre le code)

1. **« Un seul paquet pour les deux colonnes » est exact**, à une nuance près sur la signature : le
   moteur résout le référentiel lui-même (`produireBilan(organizationId, soldesN, soldesN1?)`) et passe
   **la même** `Map` de surcharges aux deux passes d'agrégation (Bilan, CR, TFT, liasse complète).
2. **« Compter les surcharges appliquées » n'est pas « compter les surcharges »** : une surcharge
   `VALIDATED` peut ne viser aucun compte de la balance, ou viser une cible sans ligne de détail — le
   compte part alors en **non mappé** (STORY-676) et rien n'est appliqué. Et deux surcharges de **même
   valeur** et de portées différentes (`COMPTE`, `RACINE`) peuvent coexister et s'appliquer chacune :
   compter les valeurs distinctes sous-compterait.
3. ⛔ **AC-3 inexact tel qu'écrit** : `POST …/bilan/etats` crée un **brouillon sans snapshot** ; le
   snapshot naît à `POST …/:id/valider`. Reformulé : le brouillon consulté **et** le snapshot figé à la
   validation portent le bloc.
4. **La sonde de forme ne voyait pas le cas** : `moteur-version.spec.ts` produisait ses états **sans**
   `soldesN1` — un bloc qui n'existe qu'avec un comparatif y serait entré sans rien faire rougir.

### Décisions

- **D-551-1 — calculé dans les services de production**, pas dans le moteur : `methodeN1(pkg,
  surchargesN, surchargesN1)` (fonction pure, `etats/methode-n1.ts`) ; le tampon est
  `toEffectiveStamp(pkg.meta)`, le même que celui de N. Bilan et CR le produisent quand la passe N-1
  existe (`soldesN1?.length`, un `[]` vaut absent) ; le TFT le **recopie** du Bilan dont il dérive.
- **D-551-2 — clé ABSENTE sans comparatif** (épandage conditionnel), jamais `null`.
- **D-551-3 — `surchargesAppliquees` = taille de l'union N ∪ N-1 des clés `portée|valeur` réellement
  appliquées** (`clesSurchargesAppliquees`, à côté de `cleSurcharge`) ; portée reconstituée exactement
  comme `resoudreSurcharge` la choisit (`COMPTE` à l'égalité stricte si une telle surcharge existe,
  `RACINE` sinon). Le décompte porte sur la **balance**, pas sur un état : Bilan et CR publient le
  même nombre (testé).
- **D-551-4 — TFT** : une passe N-2 (`soldesN2`) est produite avec la même méthode, mais ses
  surcharges ne sont pas comptées (documenté sur le type). Un TFT `NON_APPLICABLE` (référentiel sans
  tableau) n'a pas de colonne N-1, donc pas de bloc.
- **D-551-5 — `MOTEUR_VERSION` 1.21.0 → 1.22.0** ; la sonde produit désormais aussi Bilan, CR et TFT
  **avec** comparatif et fige la forme du bloc. ⚠️ Un snapshot figé avant 1.22.0 ne porte pas le bloc :
  son absence y signifie « non déclaré », pas « non retraité » (collection append-only).
- **D-551-6 — contrat** : `MethodeN1Dto` (classe, `type` explicite partout), publié `@ApiPropertyOptional`
  sur `BilanDto`, `CompteResultatDto` et `TftDto`.
- **Hors périmètre confirmé** : l'export PDF/Excel de la liasse n'imprime pas encore la mention (le
  toucher changerait l'empreinte du document) — restitution écran : FE-087.

## Progress Tracking

- 2026-09-30 — cadrage (D-551-1..6) ; branches `MNV-551` ouvertes (`docs/`, `bilan-service`) ; statut
  `in_progress`. Dev fait dans un worktree pendant la vérif docker de STORY-550, puis rebasé sur `dev`.
- 2026-09-30 — dev (`bilan-service` `MNV-551`) : `etats/methode-n1.ts` (fonction pure),
  `clesSurchargesAppliquees` à côté de `cleSurcharge`, bloc produit par Bilan et CR, recopié par le
  TFT ; `MethodeN1Dto` sur les trois réponses ; `MOTEUR_VERSION` 1.22.0, sonde avec comparatif.
- **Portes** (arbre principal, état final) : lint 0 · build OK · 281 suites / 10 553 unitaires +
  2 490 e2e verts · couverture 99,41 / 97,01 / 99,61 / 99,48. ⚠️ Dans le worktree de dev, une suite
  (`migrate-dossiers-rollback.bootstrap.spec.ts`) échouait par épuisement des workers Jest avec un
  `node_modules` en lien symbolique : artefact d'environnement, vert sur l'arbre principal.
- **Mutations — 9/9 tuées, toutes COMPILABLES** (`tmp/mutations-551/`) : bloc publié sans comparatif,
  décompte de N seul, portée ignorée, garde « surcharge COMPTE existe » retirée (ajoutée après la
  revue), TFT sans bloc, CR sans bloc, référentiel compté comme surcharge, bloc publié opaque au
  contrat, valeur N-1 altérée à côté du bloc (AC-5 renforcé). ⚠️ Quatre premières rédactions ne
  COMPILAIENT pas (paramètre ou import devenu inutilisé, rétrécissement de type sur `&& false`) :
  réécrites ; « Tests: 0 total » n'est jamais compté comme un rouge.
- **Revue de code** (opus) : 0 bloquant ; **3 corrigés** (commit `MNV-551(revue)`) — garde de portée
  non couverte (mutant survivant), test AC-5 qui ne comparait que la colonne N, description « même
  tampon que N » inexacte sur les routes des jeux d'états (le bloc porte `statut`/`miseEnGarde`, le
  tampon racine non : comparer par code/version/checksum).
- **Revue de sécurité** (opus) : **0 constat** — surcharges chargées par un dépôt scopé tenant +
  dossier, fail-closed ; le nombre ne révèle rien hors du dossier de l'appelant ; aucune route ni
  `@Public()` ajoutée ; snapshots append-only intacts.
- **Vérification docker sur stack NEUVE, état final** (`tmp/verif-docker-551/`, `72dd241`) :
  **56 OK, 0 KO**. Dossier Z : surcharge `COMPTE 411000 → BILAN_ACTIF|BJ` proposée puis VALIDÉE par
  l'API ; jeu avec `soldesN` + `soldesN1` ⇒ `methodeN1` = { retraite, `syscohada-revise@2.2` (pack),
  tampon au sha256 du paquet, `surchargesAppliquees: 1` } **identique** sur Bilan, CR et TFT ; liasse
  figée ⇒ `snapshots_liasse` porte le bloc sur les trois états, `moteurVersion 1.22.0` ; `GET
  …/versions/1` rend exactement la base. Dossier W : sans comparatif ⇒ clé absente des trois états.
  ⚠️ Un lancement avorté par le démon Docker (500 sur `down -v` après un `compose stop`) : Docker
  redémarré, stack neuve rejouée.
- 2026-09-30 — `bilan-service#149` rebase-mergée sur `dev` (`1895cb1`, `0f05a57`), branche supprimée ;
  statut `done`.

