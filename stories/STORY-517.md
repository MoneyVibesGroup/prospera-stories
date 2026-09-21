# STORY-517 : Une provision technique est une évaluation datée, versionnée, avec sa méthode et son auteur — jamais un solde

Status: in_progress

**Complexité :** high

**Épic :** EPIC-131 — Provisions techniques ⚠️ **PALIER 2**
**Service :** `assurance-service`
**Points :** 13 · **Sprint :** S20
**Prérequis :** **STORY-513** (le contrat, qui porte la catégorie et la monnaie)
**Origine :** découpage `epics-assurance-2026-08-27.md`, **AD-2** de la spine.

---

## Le fait

Les provisions techniques représentent **l'essentiel du passif** d'un assureur. Le plan CIMA leur
donne un poste dédié : `CP3` — *« Provisions techniques brutes »*, mappé aux comptes `31`, `32`,
`34`, `35`, `38`. *(Lu dans l'artefact le 2026-08-27.)*

⚡ **Ce qui distingue une provision technique d'un solde ordinaire, c'est qu'elle n'est pas
constatée : elle est ÉVALUÉE.** Deux actuaires, deux méthodes, deux montants — tous deux
défendables. Le montant seul ne prouve rien ; ce qu'un contrôle CIMA demande, c'est **la méthode**.

⇒ **Le modèle ne peut donc pas être un champ « montant » que l'on met à jour.** C'est ce qui rend
cette story structurelle et non cosmétique : le mauvais modèle ici ne se rattrape pas, parce qu'il
détruit l'historique des évaluations à mesure qu'il les écrase.

## Cadrage mesuré avant de coder (2026-09-21)

⛔⛔ **Le Code CIMA a été dépouillé, et il AUGMENTE l'AC-1 sur un point structurant : il n'y a pas
UNE liste de provisions techniques, il y en a DEUX — et le TYPE dépend de la CATÉGORIE.** Les
citations ont été relues sur la source officielle (`cima-afrique.org`, une page par article) **et**
confrontées au Code intégral (361 p., texte extrait localement).

### M1 — ⚡⚡ DEUX listes, et elles ne se recouvrent presque pas

> **Art. 334-2** *(modifié 2016 et 2018)* — « Les provisions techniques correspondant aux opérations
> d'assurance **sur la vie** et aux opérations de **capitalisation** sont les suivantes :
> 1°) **provision mathématique** […] ; 2°) **provision pour participation aux excédents** […] ;
> 3°) **provision de gestion** […] ; 4°) **provision pour risque d'exigibilité des engagements
> techniques** […] ; 5°) toutes autres provisions techniques qui peuvent être fixées par la
> Commission de Contrôle des Assurances. »

> **Art. 334-8** *(modifié 2006 et 2016)* — « Les provisions techniques correspondant aux **autres
> opérations** d'assurance sont les suivantes : 1°) **provision mathématique des rentes** […] ;
> 2°) **provision pour risques en cours** […] ; 3°) **provision pour sinistres à payer** […] ;
> 4°) **provision pour risques croissants** […] ; 5°) **provision pour égalisation** […] ;
> 6°) **provision mathématique des réassurances** […] ; 7°) **provision pour annulation de primes**
> […] ; 8°) **provision pour risque d'exigibilité des engagements techniques** […] ; 9°) toutes
> autres provisions techniques […]. »

⇒ **Une « provision de gestion » n'existe qu'en Vie ; une « provision pour risques en cours »
n'existe qu'en Non-Vie.** Le modèle doit donc **refuser un type incompatible avec la catégorie** —
c'est une règle **transcrite**, pas inventée.

⚠️ **Une seule figure dans les deux listes** : la provision pour **risque d'exigibilité** (334-2 4°
et 334-8 8°).

⚠️ **Et « primes non acquises » de l'AC-1 n'existe toujours pas** : le concept s'appelle
**« provision pour risques en cours »** (leçon D-514-1, mesurée sur les 608 pages).

### M2 — ⚠️ PIÈGE DE VERSION, et il est daté

L'édition **2014** du Code ne compte que **8** postes en Non-Vie et **3** en Vie. Les décisions du
Conseil des Ministres du **08/04/2016** et du **12/04/2018** ont ajouté la **provision pour risque
d'exigibilité** et la **provision de gestion**. ⇒ Un module calé sur un PDF pré-2016 **omet deux
postes**, et l'omission ne se voit qu'au premier contrôle.

### M3 — ⛔⛔ La part des réassureurs : le texte l'impose, et un article la VERROUILLE

> **Art. 334** — « Les provisions techniques mentionnées au 1°) du présent article sont calculées,
> **sans déduction des réassurances cédées** à des entreprises agréées ou non […]. »

> **Art. 334-11 — Réassurance** — « La provision […] relative aux cessions en réassurance ou
> rétrocessions **ne doit en aucun cas être portée au passif du bilan pour un montant inférieur à
> celui pour lequel la part du réassureur ou du rétrocessionnaire […] figure à l'actif.** »

Et le plan comptable le traduit en **deux endroits** : le **brut au passif** (comptes `31` à `38`,
poste `CP3`), la **part cédée à l'actif** (compte `39`, poste `CA2`). Mesuré dans l'artefact
`cima-assurances@1.0` : `CP3 ← [31, 32, 34, 35, 38]` et `CA2 ← [39]`.

⇒ **AC-5 confirmé par le texte** : deux champs, jamais une différence. La compensation n'est pas
une préférence de présentation, elle est **interdite**.

### M4 — L'AUTEUR : ce que ce service peut savoir, et ce qu'il ne peut pas

L'AC-4 exige que « l'auteur soit une personne identifiée, et son rôle porté », en citant le défaut
de STORY-441 — *publier un `ObjectId` nu sur l'écran où l'identité **est** l'information*.

⛔ **Le jeton de cet écosystème ne porte ni nom ni e-mail** (`sub`, `org`, `roles`,
`emailVerified`), et ce service n'a **aucun read-model d'identité** : STORY-441 a résolu le même
problème par un read-model alimenté par `identity.*`, ce qui déborde très largement de cette story.

⇒ **L'évaluation porte l'auteur DÉCLARÉ — nom et qualité — EN PLUS du `userId` de l'opérateur.** Et
ce n'est pas un pis-aller : *une provision technique engage **celui qui la signe***, qui n'est pas
forcément un utilisateur de la plateforme — un actuaire externe signe le rapport sans avoir de
compte. Le nom est donc **publié**, simplement **déclaré** et non résolu, et le hook vers un
read-model d'identité est **nommé**.

### M5 — ⚠️ Deux registres pour un même type, et il faut le dire

Le module `provisions` de **STORY-514 CALCULE** la provision pour risques en cours (art. 334-9 et
334-10). Ce registre-ci **HÉBERGE** des évaluations **déclarées**, de toute nature. Pour le type
`RISQUES_EN_COURS`, deux sources coexistent donc.

⇒ Les deux restent **distincts** — *calculée* contre *hébergée* —, et c'est **STORY-518** qui dira
laquelle entre au compte de résultat. Hook inerte documenté, conformément au périmètre BMAD.

### M6 — ⛔ Le chargement et les méthodes prescrites ne sont PAS ici

L'art. 334-12 (dossier par dossier, tardifs) et l'art. 334-13 (chargement ≥ 5 %) décrivent
**comment calculer** une PSAP. L'AC-6 l'exclut en propre — « aucun calcul n'est fait ici » — et
AD-12 interdit d'inventer une méthode actuarielle. Le module **héberge** l'évaluation et sa
méthode ; **STORY-519** dira ce qui se calcule, et à quelle condition.

## Décisions de cadrage du 2026-09-21

| # | Décision | Pourquoi |
|---|---|---|
| **D-517-1** ⚡⚡ | Le **type** de provision est **contraint par la CATÉGORIE** : un type de l'art. 334-2 n'est acceptable qu'en Vie, un type de l'art. 334-8 qu'en Non-Vie | Le Code publie **deux listes**, et elles ne se recouvrent presque pas. Accepter une « provision de gestion » en Non-Vie ferait entrer au bilan un poste que le texte n'y prévoit pas — et personne ne le verrait, puisque le montant resterait plausible |
| **D-517-2** | L'**énumération transcrit les deux articles**, dans leur version **en vigueur** (modifiée 2016 et 2018) | Un module calé sur une édition pré-2016 omet la **provision pour risque d'exigibilité** et la **provision de gestion** — deux postes sur quatorze |
| **D-517-3** ⛔⛔ | Le **brut** et la **part des réassureurs** sont **deux champs**, jamais une différence | Art. 334 : « calculées **sans déduction des réassurances cédées** » ; art. 334-11 : la part cédée « ne doit **en aucun cas** » être inférieure à ce qui figure à l'actif. Le plan le traduit en deux endroits : `CP3` au passif (comptes 31-38), `CA2` à l'actif (compte 39). La compensation est **interdite**, pas déconseillée |
| **D-517-4** | **Append-only et chaîné par rang**, comme les deux registres voisins | AD-2 : « une évaluation datée et versionnée, jamais un solde qu'on écrase ». Le chaînage porte sur le triplet **(catégorie, type, exercice)** : chaque provision a sa propre suite de versions |
| **D-517-5** ⚡ | La provision **retenue à une date d'arrêté** est la **dernière version antérieure** à cette date | AC-3. Même règle que l'état C10b de STORY-516, et même piège : un arrêté 2025 qui consommerait une réévaluation de 2026 publierait un chiffre que personne ne pouvait connaître à la date affichée |
| **D-517-6** | L'**auteur est DÉCLARÉ** — nom et qualité — **en plus** du `userId` de l'opérateur | M4. Une provision technique engage **celui qui la signe**, qui n'est pas forcément un utilisateur de la plateforme. Le nom est **publié**, simplement déclaré et non résolu ; 🪝 le hook vers un read-model d'identité (patron STORY-441) est **nommé** |
| **D-517-7** | La **méthode** est un **texte structuré libre**, accompagné de ses **paramètres** | AC-1. Le Code ne prescrit aucune nomenclature de méthodes pour l'ensemble des provisions — en inventer une imposerait à chaque assureur le vocabulaire d'un autre. ⚠️ Ce que le texte prescrit (forfait de 36 %, prorata) vit déjà dans le module **calculé** de STORY-514 |
| **D-517-8** | ⛔ **Aucun calcul** (AC-6, AD-12) : ni tardifs, ni chargement de 5 %, ni méthode prescrite | Art. 334-12 et 334-13 décrivent **comment calculer** une PSAP ; **STORY-519** dira ce qui se calcule et à quelle condition. Ce module **héberge** |
| **D-517-9** | Les **deux registres coexistent** — celui **calculé** de STORY-514 et celui **hébergé** ici — et la story le **dit** | M5. C'est **STORY-518** qui tranchera lequel entre au compte de résultat. Hook inerte documenté |
| **D-517-10** | ⛔ **Aucun numéro de compte, aucun poste de liasse, aucun producteur Kafka** | D-513-1. `CP3` et `CA2` existent dans le paquet, mais l'imputation appartient à l'adaptateur de balance (AD-5) |

## Critères d'acceptation

- [ ] AC-1 — Une provision technique porte : **type** (PSAP, primes non acquises, risques en cours,
      mathématique vie, autres), **catégorie Vie/Non-Vie**, **exercice**, **date d'évaluation**,
      **montant**, **méthode** (texte structuré), **paramètres** utilisés, **auteur**, et
      **version**.
      ⚡⚡ **AUGMENTÉ par le texte (M1, D-517-1)** : les types ne sont pas libres — le Code en
      publie **deux listes**, l'une pour la Vie (art. 334-2, cinq postes), l'autre pour les autres
      opérations (art. 334-8, neuf postes), et **le type dépend de la catégorie**. ⚠️ « primes non
      acquises » **n'existe pas** : le concept s'appelle **« provision pour risques en cours »**
      (D-514-1).
- [ ] AC-2 — ⛔ **Append-only** : une réévaluation crée une **nouvelle version**, l'ancienne reste
      lisible. Le schéma le refuse, pas seulement la convention — même invariant que le journal
      d'audit.
- [ ] AC-3 — La provision **retenue à une date d'arrêté** est la dernière version antérieure à cette
      date. Un arrêté 2025 ne doit **jamais** consommer une réévaluation faite en 2026.
- [ ] AC-4 — L'**auteur** est une personne identifiée, et son rôle est porté. ⚠️ Une provision
      technique engage celui qui la signe ; publier un `ObjectId` nu reproduirait le défaut de
      STORY-441 sur l'écran où l'identité **est** l'information.
      ⚡ **Précisé (M4, D-517-6)** : le jeton ne porte ni nom ni e-mail et ce service n'a aucun
      read-model d'identité. L'auteur est donc **déclaré** — nom et qualité — **en plus** du
      `userId`, et le hook vers le read-model est nommé.
- [ ] AC-5 — La **part des réassureurs** dans chaque provision est portée **séparément** du brut
      (AD-4) : `CP3` est le brut, `CA2` est la part des cessionnaires. Les compenser est interdit.
      ⚡ **Confirmé par le texte (M3)** : l'art. 334 impose le calcul « sans déduction des
      réassurances cédées », et l'art. 334-11 verrouille la part cédée en propre.
- [ ] AC-6 — ⛔ **Aucun calcul n'est fait ici** (AD-12) : le module **héberge** l'évaluation et sa
      méthode. C'est STORY-519 qui dit ce qui sera calculé, et à quelle condition.

## Périmètre

### Livré

- L'agrégat **provision technique** : type **contraint par la catégorie** (D-517-1), exercice
  résolu sur `exercices_dossier`, date d'évaluation, **montant brut**, **part des réassureurs**
  portée séparément, méthode et paramètres, **auteur déclaré** (nom et qualité) et opérateur.
- **Append-only, chaîné par rang** sur le triplet (catégorie, type, exercice) : une réévaluation
  est une **nouvelle version**, et la précédente reste lisible.
- La lecture **à une date d'arrêté** : la dernière version **antérieure** à cette date.
- La **variation** entre deux versions, **dérivée** et jamais stockée.

### Hors périmètre

- ⛔ **Tout calcul** (AC-6, AD-12) : tardifs (art. 334-12), chargement de gestion de 5 %
  (art. 334-13), méthodes prescrites de la provision pour risques en cours (art. 334-9 et 334-10,
  déjà livrées **calculées** par STORY-514) → **STORY-519**.
- ⛔ **L'entrée au compte de résultat** des variations → **STORY-518**, qui tranchera aussi lequel
  des deux registres — calculé ou hébergé — l'alimente (D-517-9).
- ⛔ **La modélisation de la réassurance à la cession** (traités, cessions, commissions) → EPIC-132,
  **STORY-520**. Cette story porte la **part des réassureurs dans la provision**, rien de plus.
- ⛔ **La résolution de l'auteur en identité** (read-model `identity.*`, patron STORY-441) : hors
  périmètre, et **nommée** comme telle.
- ⛔ **Tout numéro de compte et tout poste de liasse** (D-517-10).

## Progress Tracking

**Statut : `in_progress`** — cadrage réglementaire mesuré le 2026-09-21 sur la source officielle
(`cima-afrique.org`, art. 334-2 et 334-8 dans leur version **en vigueur**) **et** sur le Code
intégral (art. 334 « sans déduction des réassurances cédées », art. 334-11, confrontés au texte
extrait localement).

Branches créées **avant** la première ligne de code :

```
docs               MNV-517
assurance-service  MNV-517
```

## Notes

- Voir [[STORY-513]] (le contrat, qui porte la catégorie et la monnaie), [[STORY-514]] (la provision
  pour risques en cours, **calculée** — et le registre coexiste avec elle, D-517-9),
  [[STORY-515]] et [[STORY-516]] (les sinistres et leur état), [[STORY-518]] (les variations au CR),
  [[STORY-519]] (ce qui se calcule), [[STORY-520]] (la réassurance à la cession),
  [[STORY-441]] (le patron de résolution d'identité, non repris ici), spine AD-2, AD-3, AD-4, AD-12.
- Sources officielles : *Code CIMA*, art. **334** (« sans déduction des réassurances cédées »),
  **334-2** (provisions techniques vie et capitalisation, **cinq** postes depuis 2018), **334-8**
  (autres opérations, **neuf** postes depuis 2016), **334-11** (réassurance — le verrou
  anti-compensation), **334-14** (risque d'exigibilité), **431** (plan comptable : `31`-`38` au
  passif, `39` à l'actif).
  https://cima-afrique.org/wp-content/code-cima/fr/Article334-8Provisionstechniques.html
