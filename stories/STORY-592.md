# STORY-592 : Instantané de liste, curseur et matérialisation par lot avec reprise

Status: done

**Épic :** EPIC-061 — Envoi de masse : listes, lots avec reprise et garde-fous
**Service :** `notification-service`
**Points :** 5 · **Sprint :** S43
**Prérequis :** **STORY-591** (liste) · **STORY-578** (file `masse`) · **STORY-579** (index d'idempotence)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-13, AR-19.

**Livrée le 2026-09-06** — branche `MNV-592` de `prospera-notification-service`, sur `origin/dev`.
2 030 tests unitaires (167 suites) + 172 e2e ; lint et types propres.

---

## Le fait

⛔ **Keystone du bloc 3, et son test appartient à la définition de terminé.** Ce qu'elle empêche : un
arrêt en plein lot qui rejoue jusqu'à **500 remises déjà faites** — chez de vrais destinataires, avec
de vrais SMS **facturés deux fois**.

⚡ **`EnvoiDeMasse` est un orchestrateur, pas un `Envoi`** (AD-1) : il produit N `Envoi`, il n'en est
pas un.

## Critères d'acceptation

- [x] AC-1 — ⚡ **Instantané** : la préparation **fige l'appartenance de la liste**. L'exécution ne
      relit **jamais** la liste vivante. C'est ce qui rend la preuve possible — comparer le journal
      **à l'instantané**.
- [x] AC-2 — ⚡ **Matérialisation par lot** : chaque lot écrit ses lignes `Envoi{prepare}` en
      `insertMany(ordered: false)` **avant toute remise à un canal**, sous l'index unique
      `(envoiDeMasseId, contactId, canal)`. **Rien n'est écrit d'avance pour la liste entière** — le
      profil de coût reste celui d'un curseur.
- [x] AC-3 — ⛔ **Test de la définition de terminé** (NFR-2, AR-19) : interrompre en plein lot puis
      reprendre laisse **zéro destinataire non servi et zéro servi deux fois**, prouvé **en
      comptant** le journal contre l'instantané. Pas une recette, pas une inspection.
- [x] AC-4 — Une reprise avant l'avancée du curseur rejoue l'`insertMany` : les doublons sont
      **rejetés par la base, jamais ré-envoyés**.
- [x] AC-5 — ⛔ **Un `EnvoiDeMasse` n'a jamais deux exécutants concurrents** : le travail BullMQ porte
      l'identifiant de l'envoi de masse comme **clé de travail** (AD-18). Test avec deux exécutants
      lancés simultanément.
- [x] AC-6 — L'exécution vit sur la file `masse` et **ne peut en aucun cas** être placée sur une file
      transactionnelle (STORY-578 AC-2).

## Notes

- Progression **observable** : NFR-3 ne fixe pas de cible de bout en bout pour la masse, mais exige
  qu'on puisse voir où en est le curseur.

---

## Ce que la livraison a appris

### ⛔⛔ Ce qui garantit « zéro servi deux fois » n'est PAS le curseur

Le curseur évite de relire l'instantané depuis le début : c'est une **optimisation**. Confondre
l'optimisation avec la garantie serait exactement l'erreur qui coûte cinq cents SMS.

Un arrêt entre la matérialisation d'un lot et l'avancée du curseur fait rejouer le lot **entier**, et
ce rejeu est sûr pour **deux raisons distinctes** : l'`insertMany(ordered: false)` se heurte à l'index
unique (rien n'est écrit deux fois), et l'enfilement ne reprend **que les lignes encore `prepare`**
(rien n'est remis deux fois).

⛔ **Le filtre `statut: 'prepare'` est durable ; la déduplication de la file ne l'est pas.** Sa fenêtre
est **finie** (STORY-578) : une reprise le lendemain d'un incident aurait renvoyé tout le dernier lot.
Ce que l'état de l'`Envoi` dit ne périme pas — une ligne encore `prepare` **n'est jamais partie**, donc
l'enfiler à nouveau est *correct*.

⚡ **L'ordre du lot est un invariant** : matérialiser, enfiler, **puis** avancer. Avancer avant ferait
sauter un lot qu'un arrêt aurait interrompu — le seul défaut de cette story qui se découvrirait chez
les destinataires qui n'ont **rien** reçu.

### ⛔ AC-3 prouve par COMPTAGE, et sa contre-preuve compte autant

Le test interrompt **en plein second lot**, reprend, puis compte le journal contre l'instantané. Il est
doublé d'une **contre-preuve sans coupure** : sans elle, il resterait vert quelle que soit la
conception, y compris le jour où quelqu'un supprimerait le curseur.

⚠️ **La coupure porte sur l'ENFILEMENT, pas sur la matérialisation** : AC-2 exige que le lot écrive
toutes ses lignes avant la moindre remise. Ce qui est incomplet après une coupure, c'est ce qui est
**parti**.

### ⚡ L'instantané fige le destinataire, pas seulement le contact

Résoudre l'identifiant à l'exécution laisserait une rectification (FR-N51) déplacer un message en plein
envoi : la moitié du lot partirait à l'ancienne adresse, l'autre à la nouvelle, et le journal ne dirait
pas laquelle. Le prix est assumé.

⚡ **Le figement est lui-même idempotent.** ⚠️ Un contact sans identifiant sur ce canal n'entre pas dans
l'instantané : le figer aurait fait compter comme non servi quelqu'un que rien n'aurait pu servir.

### ⚡ L'index d'idempotence de STORY-579 arbitre déjà

L'identifiant de l'envoi de masse **est** la clé d'idempotence, avec une règle constante. L'index
qu'AC-2 nomme est néanmoins déclaré, en **partiel** : sans `partialFilterExpression`, le **deuxième**
envoi transactionnel du service serait entré en collision avec le premier sur leur `null` commun, et
le service aurait cessé d'envoyer.

⚡ Et `envoiDeMasseId` était **déjà déclaré sans écrivain** par STORY-586 (agrégats anonymes), pour
n'avoir pas à reprendre un index unique sur une collection peuplée. Il en a un.

### ⚠️ La file d'orchestration est distincte de la file `masse`

« L'exécution vit sur la file `masse` » (AC-6) vaut pour les **remises**, et c'est structurellement
tenu par `enfilerMasse` (STORY-578). Le travail d'**orchestration** n'est pas une remise : il ne
s'adresse à personne, il lit un curseur. Le poser sur `masse` aurait fait cohabiter deux formes de
charge utile sur un exécutant dont toute la conception tient à ce qu'il n'en traite qu'une — et il
aurait occupé une place du pool en retardant les remises qu'il vient lui-même de produire.

### ⚡ Le rendu est figé UNE FOIS par exécution

Les variables sont **communes** : le même texte part à tout le monde. Rendre par destinataire aurait
multiplié par cinquante mille un travail identique — et fait de la liste un jeu de données, donc du
service un moteur de publipostage (AD-19). ⛔ L'apposition du moyen de désabonnement, elle, est **par
destinataire** : `enfilerMasse` n'accepte qu'un `RenduDeMasse`, et l'apposeur émet un jeton par
message.

## ⛔ Points ouverts après 592

1. **Aucune conformité contre un vrai Redis ni un vrai Mongo** : la clé de travail, l'index partiel et
   le comportement de `insertMany(ordered: false)` sont éprouvés contre des doubles fidèles, pas contre
   les vraies pièces.
2. **Aucune surface HTTP** : préparer et lancer un envoi de masse appartiennent à STORY-593 et
   STORY-594. `EnvoisDeMasseService.preparer` et `ExecutionDeMasseService.demander` n'ont donc **aucun
   appelant** — c'est le rappel voulu.
3. **La progression n'est pas exposée** : elle est observable en base (`curseur` contre
   `tailleInstantane`), pas encore par une route (STORY-598).
