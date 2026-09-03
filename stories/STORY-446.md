# STORY-446 : « Liasse déposée » est affiché pour une liasse seulement FIGÉE — et l'état DÉPOSÉ n'existe nulle part

Status: done

**Épic :** EPIC-012 — Validation, immutabilité, exercices, audit
**Service :** `bilan-service · dossier-service`
**Points :** 5 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-034** (cycle brouillon → validé, snapshot immuable, piste d'audit), 2026-08-27.
Relevé en lisant les contrôleurs de `bilan-service` sur `origin/dev`.

---

## Le fait

Deux constats qui se renforcent.

**① Le produit dit « déposée » là où il ne sait que « figer ».** `AvancementDossier.LIASSE_FIGEE`
est documenté dans `dossier-service` par : *« `LIASSE_FIGEE` → « Liasse déposée »»*, et la carte du
portefeuille l'affichait ainsi. Or au Togo, **déposer** est un acte devant l'**OTR**, avec un
accusé et une date d'échéance opposable. Un cabinet qui lit « Liasse 2024 déposée » sur un dossier
croit sa DSF télédéclarée alors qu'elle est seulement figée dans Prospera.

**② L'état n'existe pas.** `JeuEtatsStatut` ne compte que `BROUILLON` et `VALIDE` ;
`liasse.etat.change` ne publie que `FIGEE`/`BROUILLON` ; et `etats-amont-enveloppe.util` de
`dossier-service` **rejette explicitement** `DEPOSEE` (« *etat inconnu (DEPOSEE)* »).

## Critères d'acceptation

- [ ] AC-1 — **Correction immédiate, sans dépendance** : tout libellé « déposée » adossé à
      `LIASSE_FIGEE` devient « **figée** » (commentaire de l'énuméré, maquette, front).
- [ ] AC-2 — `JeuEtatsStatut` gagne `DEPOSE`, atteignable **uniquement** depuis `VALIDE`, et
      **jamais** rouvrable sans passer par une réouverture tracée (STORY-444).
- [ ] AC-3 — Le dépôt porte ses **faits** : date de dépôt, canal, **numéro d'accusé**,
      **identité du signataire** (nom + n° d'inscription à l'ordre), et le **`snapshotId`** de la
      version déposée — une liasse se dépose dans **une** version, pas « en général ».
- [ ] AC-4 — `liasse.etat.change` publie `DEPOSEE` ; `etats-amont-enveloppe` l'accepte ;
      `AvancementDossier` gagne `LIASSE_DEPOSEE`.
- [ ] AC-5 — `AuditType` gagne `LIASSE_DEPOSEE`, avec le `contexte` du dépôt.
- [ ] AC-6 — **Rien n'est déposé par le produit** dans cette story : la télédéclaration appartient
      à `fiscal-service`. On enregistre un dépôt **constaté**, on ne le réalise pas.

## Conséquences ailleurs

- Écran : **FE-081** (dépôt & accusé).
- L'AC-1 est appliquée **par la maquette FE-034** : la carte du portefeuille dit désormais
  « Liasse 2024 **figée** ».
- Ouvre la question de l'**approbation par le client** avant dépôt : le produit ne connaît que des
  utilisateurs du cabinet (personas du PRD Atelier). À instruire avec FE-081, pas ici.

---

## Progress Tracking

**Statut : `done`** — implémentée, validée, revue (code + sécurité), **vérification docker
rejouée sur l'état final**, PR `dossier-service` **#22** (3 commits) puis PR `bilan-service`
**#78** (3 commits) rebase-mergées sur `dev` le 2026-09-03, **dans cet ordre**.

Branches créées **avant** la première ligne de code :

```
docs               MNV-446
bilan-service      MNV-446
dossier-service    MNV-446
```

⚠️ **Contrat d'événement ⇒ deux dépôts, et un ORDRE de merge.** `dossier-service` d'abord :
le consommateur **rejette** ce qu'il ne connaît pas, donc un producteur mergé seul enverrait
ses dépôts **dans le vide**, sans erreur visible côté utilisateur.

### Ce qui est livré

- **AC-1** — tout libellé « déposée » adossé à `LIASSE_FIGEE` devient « **figée** », côté
  énuméré comme côté commentaires (cinq occurrences de `bilan-service` employaient encore
  « déposée » pour dire figée, dont deux dans le fichier de contrat lui-même).
- **AC-2** — `JeuEtatsStatut.DEPOSE`, atteignable **uniquement depuis `VALIDE`**, et dont
  `rouvrir` est la **seule** porte de sortie — celle qui exige un motif depuis STORY-444. Un
  statut sans issue aurait condamné toute déclaration rectificative.
- **AC-3** — `POST …/deposer` porte les **faits** : date réelle, canal, numéro d'accusé,
  signataire (nom + n° d'ordre) et le `snapshotId`, **résolu** depuis le numéro de version —
  jamais reçu du client, qui pourrait nommer le snapshot d'un autre jeu.
- **AC-4** — `liasse.etat.change` publie `DEPOSEE` avec la version **déposée** ;
  `etats-amont-enveloppe` l'accepte ; `AvancementDossier.LIASSE_DEPOSEE` et sa branche de
  dérivation, testée **avant** celle de `FIGEE`.
- **AC-5** — `AuditType.LIASSE_DEPOSEE`, avec les faits en `contexte`.
- **AC-6** — **rien n'est déposé par le produit** : on enregistre un dépôt **constaté**.

### ⛔ Ce que la story a refusé d'inventer

**`canal` n'est PAS une énumération.** Le vocabulaire des canaux administratifs appartient au
catalogue de `fiscal-service`, qui le porte **comme donnée** (FR-F07/FR-F40), et NFR-F12
impose un vocabulaire neutre — « jamais un nom national dans le code ». En figer une liste ici
rendrait **400** sur un dépôt parfaitement réel le jour où un canal y manquerait, et cette
story ne connaît aucun canal de première main. Vérifié ligne à ligne dans
`epics-fiscalite-2026-08-03.md` par la revue de code.

### ⛔ Le seul chemin d'écriture dont l'absence de garde d'exercice clos est un CHOIX

STORY-445 vient de poser `refuserSiExerciceClos` sur `valider`, `rouvrir` et `recalculer`.
`deposer` ne l'appelle **délibérément pas** : une DSF se dépose **après** la clôture, et la
garder ici refuserait le cas nominal. Dit à quatre endroits — JSDoc du service,
`@ApiOperation` publiée, un unitaire et un e2e nommés AC-6.

### ⚡⚡ Revue de code — trois lectures étaient exhaustives sous DEUX statuts

Ajouter une valeur à `JeuEtatsStatut` a rendu incomplètes trois lectures qui disaient
`=== VALIDE` — le piège de l'énumération étendue, déjà payé en STORY-292 :

| lecture | ce qu'elle faisait sur une liasse DÉPOSÉE |
|---|---|
| `refuserSiValide` | laissait passer : le refus venait du **filtre atomique**, donc avec un code de **course concurrente**. `recalculer` répondait « un autre utilisateur vient de valider » là où personne n'est en concurrence, et `valider` allait jusqu'à **produire la liasse et exécuter la batterie de contrôles** sur des comptes déjà remis à l'administration |
| `consulter` | rendait `version: null` sur la liasse la **plus avancée** du cycle, alors que `validePar` restait renseigné et que le dépôt portait sa version dans la même réponse |
| base de prévisionnel | refusait en `BASE_NON_VALIDEE` : le dépôt **fermait une porte ouverte**, sur la base la plus opposable qui soit |

Les trois lisent désormais « tout ce qui n'est pas `BROUILLON` » : un statut de plus n'ouvre
plus de trou, il est refusé par défaut.

⚠️ Autres constats traités : le `version` publié sur `DEPOSEE` est la version **déposée**, pas
la dernière figée — le commentaire du code le disait, les **quatre** descriptions publiées
(dont deux chez le consommateur) disaient l'inverse · les deux `EtatAmontDto` énuméraient
encore `FIGEE`/`BROUILLON` · `LIASSE_DEPOSEE` n'est visible sur la carte que tant que
l'exercice déposé est **encore ouvert** (préexistant, STORY-359, désormais écrit à l'énuméré)
· `instantDeBorne` rejoint `estInstantIso` dans `common/validation` · re-export mort ·
renvoi croisé cassé · **JSDoc de classe détaché par insertion, 8ᵉ récidive** · la garde de
réouverture du service partage la **liste blanche** du repository au lieu d'une liste noire
divergente.

### ⚡⚡ Revue de sécurité — la preuve d'un dépôt ne pouvait pas reposer sur le journal

Trois constats, tous corrigés avant le merge.

**① La preuve était confiée à un canal documenté comme non fiable.** Le document ne gardait
qu'**un** dépôt, qu'une déclaration rectificative écrasait ; le contrat renvoyait la preuve du
premier accusé à la piste d'audit. Or celle-ci est écrite **hors transaction**, **après** le
commit, et `journaliser` **avale ses erreurs** — son propre docstring dit que « l'absence
d'une ligne ne prouve rien ». `depots[]` est désormais **append-only**, empilé par un `$push`
dans la **même écriture** que la bascule de statut.

**② La date de dépôt n'avait aucune borne de plausibilité.** La garde de calendrier ferme
`2026-02-30`, jamais `9999-12-31` ni une date antérieure au figeage — et c'est la date dont
dépend l'appréciation d'une **échéance opposable** : un dépôt tardif antidaté à la veille de
l'échéance passait, avec le vrai numéro d'accusé. ⚠️ **La borne basse porte sur le JOUR du
figeage, pas sur son INSTANT**, et c'est l'e2e qui l'a montré : comparée à l'instant, elle
refusait « validée ce matin à 10 h, déposée le même jour à 14 h », la journée de travail
ordinaire d'un cabinet.

**③ Quatre saisies entraient au journal publié sans que le contrat l'annonce**, et deux
d'entre elles sont une **donnée personnelle d'un tiers**. L'identité du signataire **sort du
journal** : `audit_events` est append-only, un nom saisi par erreur y serait publié
définitivement à tous les collaborateurs du dossier **sans rectification possible**. Elle vit
sur `depots[]` ; un contrôle la retrouve par le `snapshotId` que la ligne porte. Les quatre
champs annoncent désormais leur publication, et `AuditEventResponseDto` disait « deux types
portent un contexte » : ils sont trois.

⚠️ Durcissement retenu : `numeroAccuse` et `numeroOrdre` **sont des codes**, pas des phrases.
Le raisonnement publié pour un motif de réouverture (« c'est une phrase en français ») n'y
vaut pas — un charset y ferme le balisage stocké.

**Explicitement blanchi** : aucun IDOR sur `version → snapshotId` (le filtre effectif est
`{tenantId, dossierId, jeuEtatsId, version}`) · aucune injection de clé dans le chemin `Mixed`
(la validation imbriquée applique `forbidNonWhitelisted`, et le service reconstruit l'objet
champ par champ) · aucune injection NoSQL · transition atomique, double dépôt et rejeu fermés
· consumer idempotent et garde de fraîcheur inchangés · `rouvrir` acceptant `DEPOSE` n'est pas
une élévation (mêmes rôles que `valider`, sortie tracée).

### Vérification

`bilan-service` : lint 0 · build OK · **1 702 unitaires + 468 e2e verts** · couverture
**98,8 / 93,9 / 98,76 / 98,82**.
`dossier-service` : lint 0 · build OK · **1 130 unitaires + 255 e2e verts** · couverture
**99,28 / 93,83 / 96,68 / 99,3**.
**13 mutations rouges par assertion**, aucune par erreur de compilation — trois ont dû être
**réécrites** pour compiler avant d'être comptées.

⚠️ **Une mutation a révélé un test qui ne gardait rien** : le charset des champs de code
n'était éprouvé par **aucun** cas que la garde de caractères invisibles n'attrapait déjà. Cinq
cas discriminants ajoutés (`<script>`, `&`, un accent, des guillemets, un tiret cadratin).

⚠️ **Et une porte n'en était pas une** : `npm run test:cov | grep` renvoie le code de sortie de
**grep**, pas celui de jest. Une suite qui ne compilait plus (38 tests muets) est ainsi passée
au commit. Toutes les portes sont désormais lancées **sans pipe**, code de sortie vérifié.

**Vérification docker — le round-trip Kafka complet** : dossier, exercice et axes créés dans
`dossier-service`, propagés à `bilan-service`, liasse validée puis **déposée** :

| critère | mesure |
|---|---|
| AC-3 | `depots[]` persisté avec un **`ObjectId`** et une **`Date`** réels, canal **rogné**, et chaque `snapshotId` désigne bien **sa** version de **ce** jeu |
| AC-3 / ① | après le chemin recommandé (rouvrir → corriger → re-valider → re-déposer), **deux** accusés sur le document — `ACC-2026-004182` (v1) et `ACC-2026-RECTIF` (v2) |
| ② | date **future** et date **antérieure au figeage** ⇒ `409 DEPOT_DATE_INVALIDE` ; la date du **jour** de figeage est acceptée |
| ③ | les deux lignes `LIASSE_DEPOSEE` portent leurs cinq clés, et **aucune** ne porte l'identité du signataire |
| durcissement | `ACC<script>` ⇒ **400**, message de charset de code |
| AC-4 | outbox `etat: DEPOSEE, version: 2` ⇒ read-model `DEPOSEE/2` ⇒ **portefeuille `LIASSE_DEPOSEE`** |
| revue | `valider` ⇒ `JEU_DEJA_VALIDE`, `recalculer` ⇒ `JEU_VALIDE_NON_RECALCULABLE`, `GET` ⇒ `version: 2` et `validePar` renseigné |

⚠️⚠️ **Non-vacance prouvée par le défaut lui-même** : sur le consommateur **muté** (`DEPOSEE`
retiré de la liste acceptée), le producteur rend **200**, le consommateur journalise
« Message liasse.etat.change ignoré — etat inconnu (DEPOSEE) », le read-model **reste** à
`FIGEE` et le portefeuille continue d'afficher « liasse figée ». C'est exactement le scénario
que la règle « les deux PR se livrent ensemble » existe pour empêcher.

⚠️ Deux observations à ne pas mal lire : après une réouverture, le portefeuille affiche
`BALANCE_ATTENDUE` et non `BILAN_EN_COURS` — `dossier-service` n'a jamais reçu d'événement de
`balance-service`, absent de cette stack de vérification. Et le jeu de dev portait encore
l'ancien champ `depot` : le renommage a eu lieu **dans la PR**, aucune base de production ne
l'a jamais vu.
