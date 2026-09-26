# STORY-539 : Le calendrier de dépôt — multi-pays, multi-état, et l'échéance se calcule depuis la clôture réelle

Status: in_progress

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle
**Service :** `fiscal-service` — `dossier-service` **lu par événements déjà publiés, non modifié**
**Points :** 8 · **Sprint :** S20 · **Complexité :** high · **Assigné à :** `vivianMoneyVibesGroupes`
**Prérequis :** ✅ **STORY-536** (le paquet porte le calendrier) · ✅ **STORY-532** (les bornes de
l'exercice) · ✅ **STORY-537** (premier paquet `TG` × `DSF`) · ✅ **STORY-538** (le cycle du dépôt)
**Origine :** arbitrage PO du 2026-08-28 — voie A.

---

## Le fait

Une échéance de dépôt se calcule **depuis la date de clôture réelle**, par une règle du type
`clôture + N mois`. Deux choses manquent aujourd'hui pour la produire :

1. ⛔ **La liasse ne connaît pas sa date de clôture** — elle porte un **libellé libre de 1 à 64
   caractères** ([[STORY-532]]). Une échéance calculée depuis « 2025 » suppose un 31 décembre, ce qui
   est faux pour tout exercice décalé.
2. ⚠️ **Le paquet fiscal togolais annonce des « dates de dépôt DSF » qu'il ne porte pas** — relevé par
   **STORY-413**. L'information est promise et absente.

Et sous la voie A, l'échéance cesse d'être un affichage : **c'est ce qui déclenche le dépôt**.

⚡ **Multi-pays, multi-état, multi-périodicité.** Un même cabinet aura, la même semaine, une DSF
annuelle togolaise, une déclaration de TVA mensuelle, un état DIMF trimestriel d'IMF et une échéance
CIMA. **Le calendrier n'est pas une propriété du dossier : c'est un croisement (dossier × état ×
période).**

## Critères d'acceptation

- [ ] AC-1 — L'échéance est **calculée** depuis les **bornes réelles de l'exercice** (STORY-532) et
      la règle du paquet de dépôt (STORY-536), jamais depuis un libellé ni une constante.
- [ ] AC-2 — La **périodicité** est portée par l'état, pas par le dossier : annuel, trimestriel,
      mensuel. Un même dossier porte des échéances de périodicités différentes.
- [ ] AC-3 — Le **report au jour ouvré** est déclaré par le paquet, pays par pays. ⚠️ Le supposer
      universel est faux, et un jour d'écart sur une pénalité de 40 % n'est pas une nuance.
- [ ] AC-4 — Une échéance **non calculable** rend `INDETERMINABLE` **avec son motif** — bornes
      d'exercice absentes, paquet non packagé — **jamais une date par défaut**. ⛔ Une échéance
      inventée est pire qu'une échéance absente : elle rassure.
- [ ] AC-5 — Le **retard** est calculé et publié avec sa **pénalité chiffrée** depuis le paquet. Le
      produit est déjà précis sur ce qui se rattrape ; il doit l'être sur ce qui ne se rattrape pas.
- [ ] AC-6 — Les échéances d'un portefeuille sont restituables **par cabinet**, triées par urgence.
      ⚠️ `EcheanceChip` existe déjà au portefeuille avec sa garde « absente ≠ zéro » : **s'y brancher,
      ne pas en créer une seconde.**

---

## ⚖️ Cadrage confronté au code (2026-09-26) — décisions prises avant la première ligne

### D-539-1 — Les bornes réelles se lisent À LA SOURCE, par événement, pas par HTTP

Trois porteurs de bornes existent, et deux sont des impasses :

| Porteur | Ce qu'il porte | Verdict |
|---|---|---|
| `liasse.etat.change` (`bilan-service`) | le **libellé** d'exercice, et son contrat **refuse explicitement** de republier les bornes | ⛔ inutilisable |
| `GET …/bilan/etats/:id/versions/:v` | `periode.exerciceN{debut,fin}` — déjà lue par `fiscal-service` (`contrat-bilan-service.ts`) | ⚠️ HTTP synchrone, **par liasse** : un portefeuille de 60 dossiers ferait 60 appels sur une route de lecture |
| `dossier.exercice.{ouvert,clos,rouvert}` (`dossier-service`) | `{exerciceId, dossierId, orgId, libelle, debut, fin, statut}` — bornes **minuit UTC, fin incluse**, à la source | ✅ retenu |

⇒ `fiscal-service` **réplique un read-model local d'exercices** alimenté par les trois topics
`dossier.exercice.*`, et un read-model de dossiers alimenté par `dossier.created` / `dossier.updated`
(qui portent `pays` et `orgId`). **Invariant d'archi nº 2 appliqué tel quel** — et **aucun contrat
d'événement n'est touché** : les deux contrats sont publiés et émis depuis STORY-355 / STORY-236.
⇒ **un seul dépôt, `fiscal-service`**, malgré l'apparence transverse.

⚠️ Les deux énumérations de topics restent **séparées** (`DossierTopic` ≠ `ExerciceTopic`) et les
abonnements **explicites** : le producteur documente nommément qu'un abonnement par
`Object.values()` croisé projetterait un exercice dans un read-model de dossier — « un portefeuille
faux mais parfaitement plausible ».

### D-539-2 — La périodicité est déclarée par le PAQUET, donc par l'état (AC-2)

Dans `fiscal-service`, un état n'existe que par son paquet de dépôt, identifié `(pays, etat)`. La
périodicité y entre donc, sous `calendrier.periodicite = { rythme, source }`, `rythme ∈ {ANNUEL,
SEMESTRIEL, TRIMESTRIEL, MENSUEL}`.

⚡ **Vocabulaire repris, pas inventé** : `etats-cima-1.0.json` et `etats-dimf-sfd-bceao-1.0.json`
(`bilan-service`) portent déjà `depot.periodicite.rythme` avec `ANNUEL | SEMESTRIEL | TRIMESTRIEL`.
En créer un troisième aurait garanti la divergence le jour où ces paquets migrent ici.

⚠️ **Conséquence assumée** : `validerPaquetDepot` impose une **liste fermée et exacte** de clés ;
`tg-dsf-1.0.json` gagne donc `calendrier.periodicite` et **son checksum change**. L'artefact est
reconstruit par son producteur (`npm run paquet:tg-dsf`), jamais édité à la main, et la garde
`prebuild` le revérifie.

### D-539-3 — Version du paquet inchangée (`1.0`), et pourquoi

Bumper en `1.1` obligerait à toucher le miroir `PAQUETS_DEPOT_PACKAGES` de `dossier-service`
(second dépôt, hors périmètre annoncé) sans rien prouver de plus : **aucun dépôt réel n'existe** et
la migration de données est un souci de prod, explicitement différé au projet. Le jour où un dépôt
produit en base référence un format publié, l'archivage (`actif: false`) de la version précédente
devient obligatoire — **hook inerte documenté**, le registre le sait déjà faire.

### D-539-4 — Un report au jour ouvré ne se calcule pas sans dire QUELS jours ne le sont pas (AC-3)

Le paquet déclare aujourd'hui `ajustementJourOuvre: AUCUN | PRECEDENT | SUIVANT` — **la direction,
jamais le calendrier**. Appliquer `SUIVANT` en supposant samedi-dimanche serait exactement la faute
que l'AC-3 nomme : *juste au Togo et faux ailleurs, sans qu'aucun test ne le voie*.

⇒ `calendrier.joursNonOuvres = { semaine: [...], feries: ['JJ-MM', ...], source }` devient
**obligatoire dès que `ajustementJourOuvre ≠ AUCUN`**, et **interdit** sinon. Un paquet qui déclare
un report sans son calendrier **fait échouer `npm run build`** — même garde que « une case sans
source » (STORY-536 AC-2).

`TG × DSF` déclare `AUCUN` : **son artefact ne gagne aucun jour non ouvré**, et la branche de report
est éprouvée par des paquets de test, jamais par un pays servi.

⛔ **Les fêtes mobiles (Pâques, fêtes lunaires) ne sont pas exprimables** en `JJ-MM` : elles sont
**hors périmètre et nommées**, pas oubliées.

### D-539-5 — `INDETERMINABLE` porte un motif d'un vocabulaire FERMÉ (AC-4)

`EXERCICE_ABSENT` · `PAQUET_DEPOT_NON_PUBLIE` · `EXERCICE_HORS_BORNES` ·
`REPORT_JOUR_OUVRE_SANS_ISSUE`. Les deux premiers sont ceux que l'AC nomme ; les deux suivants sont
des refus de calcul (cf. D-539-6). **Jamais de date par défaut, jamais une absence muette.**

### D-539-6 — Le découpage en périodes est BORNÉ, et c'est une garde de coût

`MENSUEL` sur un exercice de 18 mois rend 18 périodes ; sur un exercice aberrant de mille ans, il en
rendrait 12 000, **par dossier**, sur une route de lecture authentifiée. Les bornes viennent d'un
read-model alimenté par un autre service : elles sont **crues, pas vérifiées**. ⇒ un exercice dont
la durée dépasse **36 mois** rend `EXERCICE_HORS_BORNES`, et la garde est mesurée par un **test de
coût dimensionné sur le mutant**, jamais sur le code sain.

### D-539-7 — `clôture + N mois` se cale sur la fin de mois, et ça se prouve

`31-10 + 4 mois` n'est pas le 31 février. La règle retenue : **même quantième, rabattu au dernier
jour du mois d'arrivée** — rabattu, jamais prolongé. `31-12 + 4 = 30-04` (le cas togolais),
`31-10 + 4 = 28-02` (29 en bissextile), et `30-06 + 4 = 30-10` : le quantième reste 30 parce
qu'octobre le porte, il ne glisse pas au 31. ⚠️ Aucune conversion « un mois = 30 jours » n'est employée —
la leçon de STORY-659 : *une conversion mois → jours annoncée prudente sous-provisionnait*.

### D-539-8 — La pénalité est PUBLIÉE chiffrée, elle n'est pas MONÉTISÉE (AC-5)

Le paquet togolais porte trois taux (**30 %**, **40 %**, **80 %**) dont l'assiette est du texte de
droit — *« droits dus pour chaque période d'imposition »*. `fiscal-service` **ne connaît aucun droit
dû** : produire un montant exigerait d'inventer une base. ⇒ le retard publie **les jours** et **les
taux applicables avec leur assiette et leur source**, jamais un montant.

⛔ Et il n'en **choisit aucun** : distinguer les 30 % des 40 % suppose de savoir si une taxation
d'office a été notifiée et régularisée sous quinze jours — un fait que ce service n'a pas. Les trois
sont publiés tels que déclarés.

### D-539-9 — L'échéance relayée de `bilan-service` n'est ni remplacée ni doublée ici

`GET /depots` relaie l'échéance DSF résolue par `balance-service` (STORY-453). Elle **reste telle
quelle** : juxtaposer deux dates dans une même réponse, l'une relayée l'autre calculée, est
précisément ce qui fait croire à un écart de droit là où il n'y a qu'un écart de source. Le
rapprochement des deux — et la bascule de l'une vers l'autre — est **nommé, pas fait**.

### D-539-10 — Le cabinet est `orgId`, et il vient du jeton seul

`org` du JWT → `tenantId` en CLS. Jamais un paramètre de route, jamais un corps. Un `dossierId`
passé en filtre **restreint** à l'intérieur du cabinet, il n'élargit jamais : un dossier d'un autre
cabinet rend une **liste vide**, jamais un 403 (anti-énumération).

---

## Hors périmètre (cadrage du 2026-09-26)

- ⛔ **L'assujettissement** — *quel dossier doit quel état*. Le calendrier est restitué pour les
  états **packagés du pays du dossier** ; décider qu'une boulangerie ne doit pas un DIMF relève
  d'une matrice d'obligations (type d'entité, régime, secteur) que le produit ne porte nulle part.
  `typeEntite` et `secteur` arrivent déjà dans le read-model de dossiers : **le hook est posé,
  inerte**. Aujourd'hui un seul paquet est actif (`TG × DSF`), obligation générale de toute société.
- ⛔ **Le rapprochement échéance ↔ dépôt effectué.** Un dépôt est keyé par liasse (`jeuEtatsId`), une
  échéance par période : les apparier tiendrait de la devinette dès la première TVA mensuelle. L'état
  de dépôt par échéance est une story suivante (cf. FE-094 / FE-095).
- ⛔ **Aucune notification.** La vue est consultative ; l'alerte relève de `notification-service`.
- ⛔ **Aucun écran.** `EcheanceChip` et la vue « Échéances » du portefeuille sont **FE-094** : cette
  story livre le contrat HTTP qui l'alimente, et rien d'autre côté restitution.
- ⛔ **Aucun second paquet pays.** Le contrat gagne la périodicité et les jours non ouvrés ; seuls
  des paquets de **test** exercent `TRIMESTRIEL`, `MENSUEL`, `PRECEDENT` et `SUIVANT`.
- ⛔ **Les fêtes mobiles** (D-539-4) et le **bump de version de paquet** (D-539-3).

---

## Tâches

- [ ] T1 — Étendre le contrat du paquet de dépôt : `calendrier.periodicite` (obligatoire) et
  `calendrier.joursNonOuvres` (obligatoire **ssi** report ≠ `AUCUN`, interdit sinon), avec leurs
  sources ; garde `prebuild` qui refuse un paquet incohérent.
- [ ] T2 — Reconstruire `tg-dsf-1.0.json` par son producteur (`npm run paquet:tg-dsf`), mettre à jour
  le checksum du manifeste, et vérifier l'artefact octet à octet.
- [ ] T3 — Écrire le moteur de calendrier en domaine pur : découpage en périodes par rythme, ajout de
  mois rabattu en fin de mois, report au jour ouvré déclaré, borne de durée d'exercice, retard signé,
  vocabulaire fermé d'`INDETERMINABLE`.
- [ ] T4 — Répliquer en read-models locaux les dossiers (`dossier.created|updated`) et les exercices
  (`dossier.exercice.ouvert|clos|rouvert`) : consumers idempotents (`ProcessedEvent`), état absolu,
  démarrage dégradé si Kafka est absent.
- [ ] T5 — Exposer `GET /api/v1/echeances` : par cabinet (jeton seul), filtre facultatif par dossier,
  tri par urgence, `INDETERMINABLE` avec motif, retard et taux de pénalité sourcés.
- [ ] T6 — Prouver par mutation chaque garde, passer les portes complètes, et vérifier sur stack
  docker **neuve** le round-trip Kafka et la restitution réelle ; puis revue de code et revue de
  sécurité.

## Definition of Done

- [ ] Aucune échéance produite sans bornes réelles ; aucune date par défaut ; aucun montant de
  pénalité inventé ; aucun report au jour ouvré supposé.
- [ ] Un paquet déclarant un report sans ses jours non ouvrés, un paquet sans périodicité, un
  checksum faux : chacun **fait échouer le build**, et une mutation de chaque garde rend des tests
  rouges.
- [ ] Le cloisonnement par cabinet est prouvé sur un jeton réel : un dossier d'un autre cabinet rend
  une liste vide, jamais un 403.
- [ ] eslint 0 warning, build, `test:cov` ≥ 65/90/90/90, `test:e2e` verts.
- [ ] Vérification docker consignée : round-trip Kafka `dossier.*` + `dossier.exercice.*` mesuré en
  base, échéances restituées depuis des bornes réellement projetées.
- [ ] PR `fiscal-service` sur `dev` et PR `docs/` sur `main`, rebase-mergées, statut synchronisé aux
  trois emplacements et `completed_date`.

## Notes

- Voir [[STORY-532]], [[STORY-413]], [[STORY-453]], [[STORY-536]], [[STORY-537]], [[STORY-538]],
  [[FE-094]].

## Progress Tracking

**Statut : `in_progress` (2026-09-26).** Branches `MNV-539` créées sur `docs` (base `main`) et
`fiscal-service` (base `dev`) **avant la première ligne de code**.

### Ce qui est livré — `fiscal-service` seul

| Couche | Livrable |
|---|---|
| Contrat (`domain/paquets-depot`) | `calendrier.periodicite` obligatoire · `calendrier.joursNonOuvres` obligatoire **ssi** report ≠ `AUCUN`, interdit sinon · garde `prebuild` |
| Artefact | `tg-dsf-1.0.json` reconstruit par son producteur (`ANNUEL`, sourcé CGI art. 96), checksum du manifeste aligné |
| Domaine (`domain/calendrier-depot`) | moteur pur : découpage par rythme, `clôture + N mois` rabattue en fin de mois, report au jour ouvré déclaré, borne de durée, retard signé, vocabulaire fermé d'`INDETERMINABLE` |
| Read-models | `dossiers_fiscal` ← `dossier.created|updated` · `exercices_dossier` ← `dossier.exercice.ouvert|clos|rouvert` — **deux consumer groups**, deux abonnements explicites, idempotence `processed_events` |
| Application / HTTP | `SourcePortefeuille` (port + adaptateur Mongo) · `EcheancesService` · `GET /api/v1/echeances` |

⛔ **Aucun contrat d'événement touché, aucun second dépôt** : les deux contrats consommés sont
publiés et émis depuis STORY-355 / STORY-236.

### Portes de qualité

| Porte | Résultat |
|---|---|
| eslint `--max-warnings 0` | 0 warning |
| `npm run build` (avec `prebuild`) | OK |
| `npm run test:cov` | **1 197 tests verts** · **99,1 / 95,71 / 98,79 / 99,53** (seuils 65/90/90/90) |
| `npm run test:e2e` | 89 verts (7 suites) |

⚠️ **L'empreinte épinglée du livrable AC-7 a bougé, et c'est la preuve que la provenance tient** :
le classeur produit embarque `PROSPERA format checksum` en propriété de document (STORY-536 AC-3).
`calendrier.periodicite` change les octets du paquet, donc le checksum, donc l'empreinte du
livrable. Une empreinte **inchangée** aurait signifié que le livrable ne porte plus son format.
Gabarit, schéma de classeur et montants sont identiques — vérifié champ par champ contre `HEAD`.

### Gardes de build — un paquet incohérent casse `npm run build`

Chaque cas a été **écrit dans l'artefact, avec son checksum réaligné** (pour que la garde
d'empreinte ne masque pas celle du calendrier), puis restauré :

| Paquet muté | Refus obtenu |
|---|---|
| report `SUIVANT` sans `joursNonOuvres` | `calendrier : champs invalides — manquants joursNonOuvres` |
| `periodicite` retirée | `calendrier : champs invalides — manquants periodicite` |
| semaine entièrement non ouvrée | `…semaine déclare la semaine entière : aucun report ne retomberait sur un jour ouvré` |
| férié `31-04` | `…feries[0] doit être une date fixe JJ-MM existante` |

Et le paquet réel repasse la garde.

### Table de mutations — chaque garde abîmée rend des tests ROUGES

⚠️ Deux mutations écrites d'abord **n'ont pas mordu** (`M4`, `M18`) : leur motif ne matchait plus
le fichier reformaté par `eslint --fix`. Une mutation qui ne s'applique pas passe pour une preuve —
elles ont été réécrites sur le texte réel avant d'être retenues.

| # | Garde abîmée | Résultat |
|---|---|---|
| M1 | le vocabulaire des rythmes n'est plus imposé | 🔴 1 |
| M2 | un report n'exige plus son calendrier de jours non ouvrés | 🔴 2 |
| M3 | une semaine entièrement non ouvrée est acceptée | 🔴 1 |
| M4 | un férié `31-04` est accepté | 🔴 2 |
| M5 | le quantième n'est plus rabattu en fin de mois | 🔴 6 |
| M6 | « un mois = 30 jours » remplace l'arithmétique civile | 🔴 6 |
| M7 | la borne de durée d'exercice est levée | 🔴 4 |
| M8 | le report recule toujours, quel que soit le sens déclaré | 🔴 1 |
| M9 | une échéance atteinte le jour même ouvre déjà les pénalités | 🔴 1 |
| M10 | l'indéterminable est trié comme un zéro | 🔴 2 |
| M11 | un dossier archivé revient au portefeuille | 🔴 1 |
| M12 | la requête des exercices n'est plus cloisonnée par cabinet | 🔴 1 |
| M13 | le consumer des dossiers s'abonne AUSSI aux exercices | 🟢 **puis** 🔴 1 |
| M14 | un pays sans paquet rend une liste vide au lieu d'un motif | 🔴 2 |
| M15 | des bornes inversées entrent dans le read-model | 🔴 1 |
| M16 | un porteur sans cabinet n'est plus refusé | 🔴 1 |
| M17 | la restitution n'est plus bornée | 🔴 1 |
| M18 | `ANNUEL` rend l'année civile au lieu de l'exercice | 🔴 2 |

⛔ **M13 est le constat de la passe.** Abonner le consumer des dossiers **aussi** aux topics
d'exercice ne faisait rougir **aucun** test : la suite vérifiait les constantes de topics et les
consumer groups, jamais l'appel `subscribe` réel. Un exercice projeté dans le read-model des
dossiers serait donc passé sans un rouge — `raisonSociale` absente, statut `OUVERT` au lieu
d'`ACTIF`, *un portefeuille faux et parfaitement plausible*, exactement ce que le contrat amont
documente comme le piège du projet. Deux tests ont été ajoutés (abonnement exact de chaque
consumer, et démarrage dégradé Kafka absent) ; M13 rougit désormais.
