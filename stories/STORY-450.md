# STORY-450 : Ni le jeu d'états ni son snapshot ne nomment la balance dont ils sortent

Status: done

**Épic :** EPIC-012 — Validation, immutabilité, exercices, audit
**Service :** `bilan-service`
**Points :** 5 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-034** (cycle brouillon → validé, snapshot immuable, piste d'audit), 2026-08-27.
Relevé en lisant les contrôleurs de `bilan-service` sur `origin/dev`.

---

## Le fait

*« Elle sort de quelle balance ? »* est la première question d'un réviseur devant une liasse.
Le produit ne sait pas y répondre.

`POST …/bilan/etats` reçoit un **tableau de `soldesN` bruts**, sans aucune référence à la balance
d'origine — `bilan-service` ne connaît **aucun `balanceId`** (écart déjà relevé par FE-028 sous le
ticket `TICKET-BACKEND-bilan-ne-reference-pas-sa-balance-source`, que cette story **régularise en
story**). Le snapshot fige donc les **soldes** — ce qui suffit à la reproductibilité — mais pas
l'**identité** de leur source.

Conséquence propre au cycle de vie, et invisible aujourd'hui : après une réouverture, la
**version 2 peut être arrêtée sur une balance différente de la version 1**, sans que l'historique
ni le journal ne le montrent. Deux versions « du même exercice » peuvent ne pas parler du même
arrêté.

## Critères d'acceptation

- [x] AC-1 — `CreerJeuEtatsDto` et `RecalculerJeuEtatsDto` acceptent
      `source: { balanceId, version, checksum }` — **obligatoire** à terme, optionnel pendant la
      transition.
- [x] AC-2 — Le jeu et **chaque snapshot** conservent cette source ; `JeuEtatsResponseDto` et
      `SnapshotSommaireDto` la publient.
- [x] AC-3 — Le serveur **vérifie** que la balance citée existe, appartient au dossier et est
      **VALIDÉE** — aujourd'hui seul l'écran le fait (FE-028), c'est-à-dire personne.
- [x] AC-4 — Deux versions d'un même jeu bâties sur des balances **différentes** sont **signalées**
      dans la liste des versions (drapeau, pas refus : c'est parfois légitime).
- [x] AC-5 — Dépendance nommée : sans **STORY-134** (consommation de `balance.created`), la
      référence reste déclarative. La vérification d'AC-3 exige le read-model.

## Conséquences ailleurs

- Remplace le ticket ouvert par FE-028 (un écart sans numéro est invérifiable depuis une maquette —
  règle FE-046).
- La maquette FE-034 affiche « **non publiée** » dans la colonne *Balance source* de l'historique,
  plutôt qu'une valeur plausible : le snapshot n'en garde rien.

---

## Progress Tracking

**Statut : `done`** — PR `bilan-service` **#82** (2 commits) rebase-mergée sur `dev` le
2026-09-04. Revue de code + revue de sécurité + **vérification docker avec sonde**.

Branches créées **avant** la première ligne de code :

```
docs             MNV-450
bilan-service    MNV-450
```

## ⚠️⚠️ La fiche était en grande partie PÉRIMÉE — le vérifier a été le premier travail

Le « fait » qu'elle décrit — « `bilan-service` ne connaît **aucun** `balanceId` », « le
snapshot fige les soldes mais pas l'**identité** de leur source » — est **faux depuis
STORY-381**, mergée entre l'écriture de cette fiche (2026-08-27) et son implémentation.

| AC | État réel | Preuve |
|---|---|---|
| AC-1 | ✅ **déjà livré (381)** | `CreerJeuEtatsDto.balanceId` et `RecalculerJeuEtatsDto.balanceId` sont **requis** |
| AC-2 | ✅ **déjà livré (381)** | le jeu **et** chaque snapshot portent `balanceId`, `balanceVersion`, `balanceChecksum`, `balanceChecksumVersion`, `exerciceId` ; `JeuEtatsResponseDto` et `SnapshotSommaireDto` les publient |
| AC-3 | ✅ **déjà livré (381)** | `exigerBalancePortante` : existence **dans le dossier gardé** (404 `BALANCE_INTROUVABLE`, anti-énumération) + état `VALIDÉE` (409 `BALANCE_NON_VALIDEE`) + exercice projeté |
| AC-5 | ✅ **déjà livré** | read-model `balances_balance` alimenté par `BalanceConsumer` sur `balance.created` + `balance.etat.document.change` |
| **AC-4** | ⚡ **le livrable de cette story** | ci-dessous |

⚠️ **La forme de l'AC-1 diffère, et l'écart est en faveur du code.** La fiche demandait
`source: { balanceId, version, checksum }` envoyé par le client. STORY-381 n'accepte que
`balanceId` et **dérive** `version`/`checksum` du read-model : un sceau fourni par
l'appelant n'atteste rien. Aucune raison de revenir à la lettre de la fiche.

### Ce qui est livré (AC-4)

`GET …/etats/:id/versions` rend `SnapshotVersionListeDto` — l'ancien sommaire **plus**
`balanceChangee: boolean | null` : cette version repose-t-elle sur une **autre** balance
que la précédente ?

- ⚠️ **`null` n'est pas `false`.** La version la plus ancienne n'a pas de précédente, et un
  snapshot figé avant STORY-381 ne porte aucune provenance. Comparer deux `undefined`
  répondrait « même balance » — une affirmation qu'aucune donnée ne soutient, sur la
  question même que la story existe pour rendre lisible.
- ⚠️ **« Précédente » = le plus grand NUMÉRO strictement inférieur**, jamais la ligne
  d'avant : `listerPourJeu` trie du plus récent au plus ancien, et l'ordre d'affichage n'a
  pas à décider du sens de la comparaison.
- Le drapeau vit sur la **liste**, pas sur `GET …/versions/:version` : il décrit une
  relation entre **deux** versions, et le publier sur le détail obligerait à charger la
  fratrie entière (liasses et soldes compris) pour un champ.

## ⛔⛔ Point d'arbitrage laissé au PO — la garde de STORY-381 n'a PAS été renversée

**`balanceChangee: true` n'est pas atteignable par l'API aujourd'hui.** `refuserSiAutreBalance`
(STORY-381, AC-5) **refuse** un recalcul qui nomme une autre balance — décision **délibérée
et documentée**, dont le motif écrit est précisément *« de nouveaux soldes venus d'une autre
balance rendraient la provenance figée fausse **sans que rien ne le signale** »*.

Or l'AC-4 dit *« drapeau, **pas refus** : c'est parfois légitime »*. **Les deux stories
s'arbitrent en sens opposé**, et la fiche de 450 a été écrite sans savoir que 381 avait
tranché. Relâcher la garde est une décision produit sur l'**intégrité comptable** : elle
n'appartient pas à cette implémentation. La garde reste intacte, le drapeau est livré comme
**détecteur** — `changement-balance.spec.ts` l'éprouve sur l'entrée exacte que la garde
interdit, et la vérification docker le prouve par sonde sur des données réelles.

⚠️⚠️ **Et le refus nomme un geste IMPOSSIBLE — c'est un cul-de-sac produit.** Le message dit
« créer une liasse sur celle-ci plutôt que de recalculer celui-là » ; or `POST /` rend
**409 `EXERCICE_A_DEJA_UN_JEU`** sur un exercice qui a déjà sa liasse. Une balance corrigée
et re-déposée pour cet exercice est donc **inexploitable** : ni recalcul, ni nouvelle liasse.
**À trancher par le PO**, et à ficher en story dédiée si le geste doit s'ouvrir.

### ⚡⚡ Revue de code — la batterie était VACANTE sur le seul verdict que l'API sache rendre

Toutes les fixtures du chemin `false` réutilisaient **la même instance** `ObjectId` des deux
côtés de la comparaison — le spec pur, le spec de contrôleur, et jusqu'au double e2e, qui
recopie l'objet posé **une seule fois** par `creerBrouillon`. Une implémentation par
`precedent.balanceId !== courant.balanceId` restait donc **verte partout** : mutation
mesurée, **26 unitaires et l'e2e AC-2/AC-4 au vert**.

⛔ En production, Mongoose hydrate **chaque document séparément** : deux `ObjectId`
**distincts** de même valeur. Sous ce code, l'historique aurait publié `balanceChangee: true`
sur **toutes** les versions ≥ 2 d'un jeu qui n'a jamais changé de balance — un signal
d'alerte permanent et faux. Et comme `true` est par ailleurs inatteignable, `false`/`null`
est **tout** ce que le livrable produit : le seul chemin vivant n'était gardé par rien.

⚠️ **Le dépôt connaissait ce piège par écrit** : `refuserSiAutreBalance` (STORY-381) le
documente sur la fonction sœur — « aucun test ne pouvait le voir : tous fabriquaient leur
identifiant par `new Types.ObjectId().toHexString()` ». La leçon n'avait pas été rejouée.

⚠️ **JSDoc détaché par insertion, deuxième fois dans le même fichier** : le bloc STORY-450
avait été inséré entre le JSDoc de STORY-448 et le test qu'il documente. Recollé.

### ⚡ Revue de sécurité — aucun constat

`balanceChangee` est calculée **sur le tableau publié lui-même**, et `balanceId` y est déjà
servi depuis STORY-381 : **entropie ajoutée nulle**, aucun oracle sur `balances_balance`
(la fonction ne lit **aucune** balance) · filtre effectif `{jeuEtatsId, tenantId, dossierId}`,
fail-closed · `fromListe` rend un **littéral de champs nommés**, jamais un `...doc.toObject()`
· throttler global intact, l'apport est une copie de **références** + un tri · pas de faux
`true` par casse hexadécimale (`balanceId` vient canonique du read-model, jamais du client) ·
le balayage anti-`object`-opaque est une **égalité exacte** : 31 entrées, aucune perdue.

### Vérification

Lint 0 warning · build OK · **1 752 unitaires + 484 e2e verts** · couverture **94,02 / 98,78
/ 98,84 / 98,82** (`changement-balance.ts` à **100 / 100 / 100 / 100**) · **5 mutations
rouges par assertion** :

| mutation | ce qui vire au rouge |
|---|---|
| comparaison par **référence** au lieu de valeur | 2 unitaires (verte AVANT le correctif de revue) |
| `null` remplacé par `false` quand une borne manque | 6 unitaires |
| le tri par numéro de version retiré | 2 unitaires |
| `?? null` devient `?? false` dans le contrôleur | 2 unitaires |
| `type: Boolean` retiré du contrat | 2 e2e |

**Vérification docker sur jeton RS256 réel**, jeu à **3 versions** :

| critère | mesure |
|---|---|
| AC-2 | les trois versions **nomment** leur balance, avec `balanceVersion` et `balanceChecksum` |
| AC-4 nominal | `v3: false`, `v2: false`, **`v1: null`** — jamais `false` sur la plus ancienne |
| ⚡⚡ **AC-4 par SONDE** | un `balanceId` **différent** planté sur la v3 **en base** ⇒ `[[3, true], [2, false], [1, null]]` |

⚠️⚠️ **C'est la sonde qui rend le livrable non décoratif** : elle prouve que le drapeau
**détecte**, sur des `ObjectId` réellement hydratés par Mongoose — donc du même coup que la
comparaison se fait bien **par valeur** en production. Sonde retirée après mesure.

### ⛔ Ce qui n'a PAS été fait

- La garde `BALANCE_DIFFERENTE` de STORY-381 (arbitrage PO ci-dessus).
- La **liste allégée des versions de `GET …/consultation/:exercice`** ne porte que
  `{version, valideAt, checksum}` : elle ne publie ni la provenance ni le drapeau. L'AC-4 nomme
  « la liste des versions », c'est-à-dire la route qui porte ce nom. À étendre le jour où
  l'écran de consultation affiche la colonne *Balance source*.
- ⚠️ La maquette FE-034 affiche « **non publiée** » dans cette colonne : **c'est elle qui est
  périmée**, la provenance est publiée depuis STORY-381.
