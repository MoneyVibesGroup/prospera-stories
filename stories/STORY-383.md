# STORY-383 : Le fil d'activité se filtre par dossier — la recherche cesse de s'arrêter à la page

**Epic :** EPIC-043 — Dossier client, unité de travail du cabinet
**Réf. :** ticket `TICKET-BACKEND-activite-filtre-par-dossier.md` · **STORY-360** *(le fil existe)* · **STORY-144** *(le défaut du résultat partiel)* · décision **D12** · question **Q10-b**
**Priorité :** Should Have
**Story Points :** 3
**Statut :** `review`
**Complexité :** medium
**Créée le :** 2026-08-22 — **par FE-068 v2**, sur retour PO direct
**Sprint :** 20
**Service :** `dossier-service`

---

## Le constat

Le PO a rejeté le premier rendu du fil pour une raison d'**usage**, pas d'esthétique :

> « J'ai plusieurs modifications, je vais faire suivant, fatigué. […] pourquoi pas un tableau pour
> faciliter, mais aussi une **recherche par dossier ou par nom de client**. »

Il a raison, et la conséquence est un manque **de contrat** : la question réelle n'est pas
« rends-moi les 128 actes dans l'ordre », c'est **« qu'est-ce qui a bougé chez Kossi »**.

`LireJournalQueryDto` n'expose que **`page`** et **`size`**. Aucun filtre.

## Ce que le front fait en attendant, et pourquoi ce n'est pas suffisant

1. Il demande **`size=100`** sur `/activite` — le plafond du service — pour que la recherche porte sur
   le maximum servi en un appel.
2. Il filtre les lignes sur `raisonSociale`, **côté client**.
3. ⚠️ Il **ANNONCE la portée** : le pied de table lit « 1 acte trouvé **sur cette page** ». Un test
   unitaire **et** une étape d'e2e verrouillent cette mention.

Le point 3 rend la situation **acceptable, pas satisfaisante**. Sans lui, l'écran produirait
exactement le défaut que ce dépôt documente depuis STORY-144 : **un résultat partiel qui se lit comme
un fait** — « Kossi n'a rien eu ce mois-ci », alors que la page 2 dit le contraire.

⚡ **Un cabinet de 60 dossiers actifs dépasse 100 actes en quelques jours.** La recherche devient alors
**structurellement incomplète**, et « sur cette page » cesse d'être une nuance pour devenir un aveu.

---

## User Story

En tant qu'**administratrice de cabinet**,
je veux **filtrer le fil sur un dossier ou un nom de client**,
afin de **répondre à « qu'est-ce qui a bougé chez ce client » sans dérouler tout l'historique du
cabinet**.

---

## Ce que la story livre

Deux paramètres **facultatifs** et **cumulables** avec la pagination existante, sur `GET /activite` :

| Paramètre | Type | Effet |
|---|---|---|
| `dossierId` | `ObjectId` | restreint le fil à **un** dossier du cabinet |
| `q` | `string` | recherche sur la **raison sociale** du dossier concerné, insensible à la casse **et aux accents** |

⚡ **L'index de `dossierId` existe déjà** : `{ dossierId: 1, le: -1, _id: -1 }`, posé par STORY-360.
`q` demande en revanche de résoudre les dossiers **avant** la lecture du journal — les raisons
sociales vivent dans `dossiers`, pas dans `dossiers_journal`. Chemin naturel :
`dossiers.find({ orgId, raisonSociale: /…/i })` → liste d'`_id` → `$in` sur le journal.

⚠️ **`total` et `nonLus` doivent rester cohérents avec le filtre appliqué** — ou déclarer
explicitement qu'ils ne le sont pas. Un `total` non filtré sous une liste filtrée **redonnerait le
problème par l'autre bout**.

## Hors périmètre

- ⛔ **Aucun filtre par AUTEUR**, et c'est délibéré : `LireJournalQueryDto` documente déjà que
  « montre-moi ce que X a fait » ouvrirait une **énumération d'identifiants**. La recherche reste sur
  le dossier.
- ⛔ Aucune recherche **plein texte** dans les valeurs d'un diff : l'utilisateur ne saurait pas
  reproduire le résultat.
- ⛔ Le journal d'**un** dossier (`GET /dossiers/:id/journal`) : on y est déjà dans un dossier, et le
  service n'y sert même pas `raisonSociale`.

---

## Acceptance Criteria

- [ ] `GET /activite?dossierId=…` rend **uniquement** les actes de ce dossier, **dans la portée du
      jeton** ; un dossier hors portée rend une liste **vide**, jamais `403` *(anti-énumération, comme
      le journal du dossier)*.
- [ ] `GET /activite?q=kossi` rend les actes des dossiers correspondants, sans distinction de casse
      **ni d'accents** — « Société » doit se trouver en tapant « societe ».
- [ ] **`total` reflète le filtre appliqué**, pas l'historique entier.
- [ ] Les deux paramètres se combinent avec `page` / `size` ; une page hors bornes rend une liste
      vide, jamais une erreur.
- [ ] Un `q` **vide ou fait d'espaces** est traité comme **absent**, pas comme « ne correspond à
      rien ».
- [ ] Le filtre n'introduit **pas de `COLLSCAN`** sur `dossiers_journal` — un test le vérifie sur le
      plan d'exécution.

---

## Dépendances

**Prérequise :** **STORY-360** *(le fil, ses index et son curseur de non-lus)*.
**Consommateur :** **FE-068**. À la livraison, le front :

1. déplace la recherche vers le serveur (`useActivite(page, { recherche, dossierId })`) ;
2. **retire la mention « sur cette page »** de `JournalPied` — ⚡ **c'est le vrai livrable de cette
   story** : cette mention existe pour dire une limite, elle doit disparaître avec elle ;
3. redescend `TAILLE_PAGE_FIL` de 100 à 25 — les 100 ne servaient qu'à élargir un filtre client.

⚠️ **Tant que cette story n'est pas livrée, ne pas retirer la mention** : c'est elle qui empêche un
résultat partiel de se lire comme un fait.

## Definition of Done

- [ ] Lint 0 · build OK · couverture ≥ seuils.
- [ ] e2e : filtre par dossier, filtre par `q` accentué, combinaison avec la pagination, `total`
      cohérent, dossier hors portée → liste vide.
- [ ] Vérification docker : deux dossiers, un filtre, et le plan d'exécution lu sur la vraie base.
- [ ] `/code-review` + `/security-review` *(un paramètre de recherche est une surface d'injection —
      `q` ne doit jamais atteindre Mongo comme opérateur)*.

## Story Points Breakdown

- `dossierId` : validation, portée, index existant : 0,5 pt
- `q` : résolution des dossiers puis `$in`, insensibilité aux accents : 1,5 pt
- Cohérence de `total` / `nonLus` sous filtre : 0,5 pt
- Tests (e2e, plan d'exécution, injection) : 0,5 pt
- **Total : 3 points**


---

## Progress Tracking

**Statut :** `review` — implémentée, portes vertes, vérification docker faite. *(2026-08-25)*
**Branche :** `MNV-383` sur `dossier-service` · **dépôt unique** (aucun contrat d'événement touché).

### Ce qui a été livré

`GET /activite` accepte deux paramètres **facultatifs et cumulables**, portés par un
**DTO à part** (`LireActiviteQueryDto`) :

| Paramètre | Validation | Chemin |
|---|---|---|
| `dossierId` | `@EstObjectId()` (STORY-405 — `@IsMongoId()` accepte `0x` et le 400 sortirait en 500) | `dossiers.find({portée, _id})` |
| `q` | `@IsString()` + `@MaxLength(120)` + `trim`, motif **échappé** | `dossiers.find({portée, statut: $in[tous], rechercheNormalisee: /…/})` |

Les deux se résolvent **d'abord sur `dossiers`** — les raisons sociales n'existent pas dans
`dossiers_journal` — puis le journal est filtré par `dossierId: { $in: [...] }`.

⚡ **Aucun index nouveau** : `{ dossierId: 1, le: -1, _id: -1 }` (STORY-360) et
`{ orgId: 1, statut: 1, rechercheNormalisee: 1 }` (STORY-359) existaient déjà.

### Les trois décisions qui portent la story

1. **`undefined` (aucun filtre) et `[]` (filtre sans correspondance) sont des réponses
   OPPOSÉES.** Les confondre — un `if (ids.length === 0)` qui laisserait tomber la clause —
   ferait rendre **l'historique entier du cabinet** en réponse à `?q=inconnu` : le défaut que
   cette story ferme, redonné par l'autre bout. `$in: []` atteint donc Mongo tel quel.
2. **`nonLus` NE SUIT PAS le filtre**, et le contrat le publie (`ActiviteResponseDto.nonLus`).
   La story autorisait « suivre le filtre **ou** déclarer qu'on ne le suit pas » ; c'est le
   second, pour une raison décisive : `POST /activite/lu` ne connaît **aucun** filtre — il pose
   un curseur unique par administrateur. Un compteur filtré à `2` suivi d'un acquittement
   éteindrait les `12` non-lus réels, et dix actes jamais vus disparaîtraient sans trace. Faire
   suivre le filtre au compteur exigerait un curseur **par recherche**. `total`, lui, suit le
   filtre (même filtre que la page).
3. **Aucune exclusion des dossiers ARCHIVÉS.** Le fil non filtré montre leurs actes (il lit
   `{ orgId }` sur le journal, et D9 archive sans effacer) : les exclure ferait qu'une recherche
   par nom **cache** des lignes que la même page rend sans filtre.

Les filtres vivent sur `LireActiviteQueryDto`, **jamais** sur `LireJournalQueryDto` : le journal
d'un dossier rend `400` dessus (`forbidNonWhitelisted`) plutôt que de les accepter **sans
effet** — un paramètre qu'on peut envoyer et qui ne filtre rien se lit comme un filtre appliqué.

### Portes de qualité

- Lint **0 warning** · build OK.
- **1 101 unitaires** + **253 e2e** verts (dont **51** sur `journal.e2e-spec.ts`, +24 pour cette story).
- Couverture **99,28 / 93,59 / 96,68 / 99,3** — `modules/journal` à **100 %** sur les 4 axes.

### Mutations éprouvées — 14, chacune rouge sur son test

| # | Mutation | Test qui rougit |
|---|---|---|
| 1 | `$in: []` traité comme « pas de filtre » | 8 e2e (hors portée, inexistant, `q` sans correspondance, motifs) |
| 2 | `echapperRegex` neutralisé | e2e `.*`, `^`, `.+`, `kossi|mensah` |
| 3 | `filtrePortee` → `orgId` nu | unit « part de la PORTÉE » |
| 4 | `dossierId` ignoré à la résolution | 6 e2e |
| 5 | intersection → `$or` | e2e « les deux filtres se CROISENT » |
| 6 | `nonLus` « harmonisé » avec la liste | e2e « `nonLus` reste le compteur du CABINET » |
| 7 | saisie non normalisée | e2e accents (`SOCIÉTÉ`, `Société`) |
| 8 | résolution excluant les archivés | e2e « dossier ARCHIVÉ » |
| 9 | `orgId` retiré du filtre journal | 2 unit repository *(vert en e2e — la garde est de la défense en profondeur)* |
| 10 | sortie anticipée « aucun filtre » retirée | 2 unit service |
| 11 | filtres remontés dans `LireJournalQueryDto` | 2 unit DTO |
| 12 | prédicat acceptant `0x` | e2e « 400, pas 500 » |
| 13 | borne d'index en sous-ensemble (`[ACTIF]`) | e2e « dossier ARCHIVÉ » |
| 14 | borne recopiée `['ACTIF','ARCHIVE']` | ⚠️ **aucun** — cf. ci-dessous |

⚠️ **Deux constats de la mutation, consignés parce qu'ils corrigent une illusion :**

- Un cas de `it.each` s'est révélé **VACANT** : `(a+)+$` ne correspond à aucune raison sociale,
  échappé ou non — il restait **vert** sous un motif non échappé. Déplacé là où l'assertion porte
  sur la valeur **réellement transmise** à Mongo (`journal.repository.spec.ts`).
- La mutation 14 est **indistinguable** par la valeur : `['ACTIF','ARCHIVE']` recopié à la main
  égale la liste dérivée tant que l'énumération en compte deux. Le test le **dit** au lieu de
  laisser croire à une garde qu'il n'a pas ; c'est le commentaire de `TOUS_LES_STATUTS` qui porte
  la règle.

### Vérification docker — `dossier_service`, stack réelle

Cabinet de vérification : **531 dossiers**, **3 010 actes** de journal, un dossier **archivé**.

**Comportement observé** (`GET /api/v1/activite`) :

| Appel | `total` | `nonLus` | Dossiers rendus |
|---|---|---|---|
| sans filtre | 3 010 | 3 001 | les 3 |
| `?dossierId=<Kossi>` | 103 | **3 001** | Kossi seul |
| `?q=societe` *(sans accent)* | 103 | 3 001 | « Société Générale du Bè » |
| `?q=SOCIÉTÉ` *(maj. accentuées)* | 103 | 3 001 | idem |
| `?q=mensah` *(dossier **ARCHIVÉ**)* | 103 | 3 001 | « Garage Mensah » |
| `?dossierId=<Kossi>&q=kossi` | 103 | 3 001 | Kossi *(intersection non vide)* |
| `?dossierId=<Kossi>&q=mensah` | **0** | 3 001 | — *(intersection vide, pas un `$or`)* |
| `?q=inconnu` | **0** | 3 001 | — |
| `?q=.*` | **0** | 3 001 | — *(motif échappé)* |

`nonLus` **immobile à 3 001** sous tous les filtres : le choix n° 2 est vérifié en base, pas
seulement affirmé.

**Refus** : `dossierId` d'un **autre cabinet** → `200` + liste vide *(jamais 403/404)* ·
`dossierId=pas-un-id` → `400` · `dossierId=0xaaaaaaaaaaaaaaaaaaaaaa` → `400` *(pas 500)* ·
`q[$ne]=x` → `400` · `dossierId[$ne]=null` → `400` · `?q=` sur le journal d'un dossier → `400`.

**AC « pas de `COLLSCAN` » — plans lus au profiler Mongo sur la vraie base :**

| Requête | Plan retenu | Docs lus | Rendus |
|---|---|---|---|
| fil non filtré, page 1 | `IXSCAN {orgId, le, _id}` | 25 | 25 |
| un dossier (`$in` de 1) | `IXSCAN {dossierId, le, _id}` | 25 | 25 |
| deux dossiers (`$in` de 2) | `SORT_MERGE` sur `{dossierId, le, _id}` | 25 | 25 |
| `$in: []` | `IXSCAN {dossierId, le, _id}` | 0 | 0 |

**Aucun `COLLSCAN`**, et **aucun tri en mémoire** sauf sur le `$in` vide — où trier zéro document
est gratuit (0 clé lue, 0 document lu). Le `countDocuments` du fil **non filtré** parcourt les
3 009 clés de l'organisation : c'est le comportement **pré-existant** de STORY-360, et il descend
à 103 dès qu'un filtre est posé.

### ⚡⚡ Un défaut trouvé PAR la vérification docker, invisible au HTTP

La recherche rendait le **bon résultat** en **lisant tous les dossiers du cabinet** : sans clause
sur `statut`, l'index `{orgId, statut, rechercheNormalisee}` est inutilisable — sa 3ᵉ composante
n'est atteignable que si la 2ᵉ est bornée — et Mongo retombait sur `{orgId, statut}` avec un
FETCH par dossier.

| Filtre émis | Index retenu | Documents **lus** |
|---|---|---|
| `{orgId, rechercheNormalisee}` | `{orgId, statut}` | **531** |
| `{orgId, statut: $in[tous], rechercheNormalisee}` | `{orgId, statut, rechercheNormalisee}` | **1** |

La clause énumère **tous** les statuts : elle ne sélectionne rien de moins, elle donne seulement
ses bornes à l'index — et elle est **dérivée de l'énumération**, jamais recopiée.

🪤 **Et la première mesure du correctif était FAUSSE** : `nest --watch` n'avait pas repris
l'édition, si bien que le service exécutait encore l'ancien code. Le résultat HTTP étant
**identique dans les deux cas** — seul le plan change —, rien ne le signalait. C'est le
**profiler Mongo** qui a montré le filtre réellement émis (sans `statut`, 531 documents lus) ;
la mesure consignée ci-dessus est celle d'**après redémarrage** du conteneur.

### Hors périmètre — respecté

Aucun filtre par **auteur** *(énumération d'identifiants)* · aucune recherche **plein texte** dans
les valeurs d'un diff · le journal d'un dossier (`GET /dossiers/:id/journal`) **inchangé**, et il
**refuse** désormais explicitement les deux paramètres.

### Pour le consommateur FE-068

Le contrat est en place : `useActivite(page, { recherche, dossierId })` peut passer côté serveur,
**la mention « sur cette page » de `JournalPied` doit disparaître** — c'est le vrai livrable — et
`TAILLE_PAGE_FIL` peut redescendre de 100 à 25. ⚠️ Le compteur de non-lus n'est **pas** un
compteur de résultats : afficher « n actes trouvés » se lit sur **`total`**, jamais sur `nonLus`.
