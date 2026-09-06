# STORY-585 : Durées paramétrables et plafond opposable — un dépassement est refusé, jamais ramené en silence

Status: done

**Épic :** EPIC-062 — Rétention, purge et fin de relation
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S42
**Prérequis :** **STORY-579** (journal et ses horloges)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-15.

**Livrée le 2026-09-06** — branche `MNV-585` de `prospera-notification-service`, sur `origin/dev`.
1 819 tests unitaires (151 suites) + 139 e2e ; couverture 99,06 / 91,85 / 96,90 / 99,09.

---

## Le fait

⛔ **Le cœur de cette story est le refus, pas le paramètre.** Toute durée est paramétrable par
organisation **dans la limite d'un plafond que le service refuse de dépasser**.

Ramener en silence est le défaut coûteux : l'organisation **croit** avoir configuré ce qu'elle n'a
pas, et ne le découvre qu'au litige.

## Critères d'acceptation

- [x] AC-1 — Les durées de conservation sont paramétrables **par organisation** (FR-N64), chacune
      bornée par un **plafond opposable**.
- [x] AC-2 — ⛔ Une tentative au-delà du plafond est **rejetée** par l'erreur nommée
      `DUREE_AU_DELA_DU_PLAFOND` (`422`), **jamais ramenée silencieusement**. Test explicite.
- [x] AC-3 — Les plafonds ne sont **pas en configuration d'environnement** : ce sont des données du
      domaine, versionnées et lisibles.
- [x] AC-4 — La durée effective d'une organisation est **restituable** : elle doit pouvoir vérifier
      ce qui s'applique réellement.

## Notes

- Exception connue et bornée : le message à valeur probante (mise en demeure) est conservé **5 ans**,
  plafond **10** (AD-15).

---

## Ce que la livraison a appris

### ⛔ Le plafond n'est PAS une contrainte de forme

Un `@Max(plafond)` sur le DTO a l'air de la même règle : il refuse aussi. Il refuse en
`400 VALIDATION` — *« votre corps est mal formé »* — là où le plafond dit *« votre demande est bien
formée et la politique la refuse »*. La réponse n'aurait porté ni le code `DUREE_AU_DELA_DU_PLAFOND`,
ni la catégorie fautive, ni le plafond applicable. Le DTO ne valide donc que la **forme** (un entier
de jours, au moins un) ; le plafond est une règle du **domaine** et rend `422`. Un test e2e exige les
deux statuts côte à côte, sur la même route.

**Contre-preuve, des deux côtés :** en unitaire, aucune valeur n'est rendue (la fonction lève, et
l'implémentation naïve tourne à côté pour montrer ce qu'on aurait obtenu) ; en e2e, **la lecture qui
suit le refus rend la politique d'avant**. Sous un `Math.min`, la réponse aurait été `200` et cette
lecture afficherait le plafond — sans une trace de la demande refusée.

### ⚡ Une règle qui relie deux valeurs interdit une surface qui en modifie une

Les variables ne peuvent pas survivre au journal détaillé qui les interprète : un nom et un montant
sans l'envoi qui dit à qui et pourquoi est la donnée la plus exposée du service et la moins utile.
Cette cohérence n'est pas évaluable sur une catégorie isolée — une route par catégorie aurait rendu
le résultat dépendant de l'**ordre** des appels, et refusé `journal=200` à qui n'avait pas encore
baissé ses variables. D'où un **`PUT` de la politique entière**, dont l'omission d'une catégorie
signifie explicitement « reviens au défaut ».

Et **deux causes qui ne se soignent pas pareil ne portent pas le même nom** :
`VARIABLES_SURVIVRAIENT_AU_JOURNAL` se corrige en baissant les variables **ou** en remontant le
journal, et l'appelant ne peut choisir que si le refus le lui dit.

### ⚡ Le catalogue est une donnée du domaine, versionnée par son CONTENU

| catégorie | défaut | plafond |
| --- | --- | --- |
| `VARIABLES` | 90 j | 396 j (celui du journal) |
| `JOURNAL` | 396 j | 396 j — **ne se relève pas** |
| `MESSAGE_PROBANT` | 5 ans | 10 ans |

`JOURNAL` porte le même défaut et le même plafond parce que **FR-N66 n'énonce pas une valeur par
défaut : il énonce un fait**. À treize mois, le journal détaillé *est* remplacé par des agrégats
anonymes. Une organisation conserve moins, jamais plus ; ce qui doit durer au-delà est la trace
d'audit de la base protégée (AD-14), qui ne porte aucune variable.

La version est **dérivée** de la forme canonique (empreinte SHA-256 tronquée, leçon STORY-603 de
`paiement-service`) : écrite à la main, elle se corrige après les valeurs — ou pas du tout — et la
restitution affirmerait à l'organisation qu'elle relit ce qu'elle a déjà lu. Le **libellé** n'entre
pas dans l'empreinte : il s'affiche, il ne s'applique pas, et une version qui bougerait pour une
faute d'orthographe apprendrait à ne plus la regarder.

⛔ **Aucune de ces valeurs n'est en configuration d'environnement**, et une garde le tient. Elle est
écrite en **inventaire** : `FILES_RETENTION_*` règle la durée de vie des travaux BullMQ dans Redis,
pas une politique de conservation — une interdiction absolue aurait rougi le jour de son écriture,
donc se serait fait désactiver.

> ⚡ **La contre-preuve de cette garde a trouvé un vrai défaut.** Le motif
> `[A-Z][A-Z0-9_]*(RETENTION|…)` réclamait **au moins un caractère avant** le mot cherché : il voyait
> `FILES_RETENTION_TERMINES_MS` et **ne voyait pas** `RETENTION_JOURNAL_JOURS`, c'est-à-dire
> exactement le nom qu'on écrirait. La garde aurait été verte sur la seule faute qu'elle existe pour
> refuser. Même famille que l'espace oubliée de STORY-575 : *une garde ne se croit pas, elle se
> falsifie.*

### ⚡ L'échéance est la PROMESSE faite au moment de la collecte

`expireLe` est écrit à la création du document et ne bouge plus. Ce n'est pas une commodité de purge :
le recalculer à la lecture rendrait un **allongement** rétroactif — la donnée qui devait mourir à
quatre-vingt-dix jours survivrait parce que l'organisation a changé d'avis après coup, ce qu'aucune
information donnée à la personne n'aurait annoncé.

**Conséquence à dire :** raccourcir une durée ne raccourcit pas ce qui est déjà écrit. Ce qui
s'applique à l'existant est l'effacement de FR-N51 (STORY-584).

Trois branchements en découlent, et sans eux le réglage aurait été un formulaire :

1. **l'`Envoi` et ses variables** — les deux échéances sont résolues **une fois, avant la
   transaction** ; les lire deux fois aurait laissé une écriture de politique concurrente
   s'intercaler entre le squelette et ses variables, seule façon d'obtenir l'orphelin que le contrôle
   de cohérence refuse ;
2. **l'accusé** — il ne recopie plus une durée, il recopie **l'échéance de son `Envoi`**. « Les
   accusés suivent le journal » (AD-15) cesse d'être une valeur égale par convention et devient la
   même date ; le seul cas qui calcule est l'accusé **orphelin**, celui qui ne qualifie rien ;
3. **la cloche in-app** — l'adaptateur écrit dans notre base, donc son échéance suit la politique de
   l'organisation qui parle.

⛔ **`horloges-journal.ts` ne porte plus aucune durée.** Une constante importable au point d'écriture
a exactement l'apparence de la valeur qui s'applique : un site qui l'emploierait aurait rendu le
paramétrage inerte **sans qu'aucun test ne rougisse**, et l'organisation aurait lu sa politique dans
la restitution pendant que le service en appliquait une autre. Un test vérifie qu'aucun export
`RETENTION_*` n'y revient.

**Nouveau champ `Envoi.variablesExpireLe`.** `rejouable` se lisait de `prepareLe + 90 jours` ; sous
une durée paramétrable, ce calcul répondrait avec la politique **d'aujourd'hui** à propos d'un
document écrit sous celle de sa collecte. Le journal en liste des centaines à la fois : une requête
par ligne était exclue. Les deux échéances sont donc figées **ensemble**. La route de rejeu, elle,
lit le document de variables lui-même — elle ne peut pas se tromper.

## ⛔ Décisions PO et points ouverts

1. **Aucun des cinq droits ne garde ces routes — 4ᵉ fois**, après le carnet (STORY-573), la demande
   d'envoi (STORY-579) et les droits des personnes (STORY-584). L'emprunt était tentant :
   `notification:canal:administrer` est un droit d'administration et couvre déjà une configuration
   d'organisation. Il est refusé parce que la séparation des cinq n'a de sens que si chacun nomme
   **ce qu'il autorise** — régler la durée de vie de données personnelles est une décision de
   conformité, opposable au régulateur, et une organisation qui ne peut pas la distinguer du réglage
   des identifiants SMTP a perdu ce qu'AD-18 lui promet. Emprunter `notification:journal:consulter`,
   droit de **lecture**, serait pire. **Un sixième droit `notification:retention:administrer` amende
   AD-18, qui en énumère cinq** ; l'ajout sera un décorateur sur la classe, et le test qui fige le
   manque devra alors être retourné.
2. **Un plafond ABAISSÉ après coup** laisse des politiques enregistrées au-dessus. Le refus s'oppose
   à une demande, pas à une décision déjà prise ; la ramener en silence à la lecture serait le défaut
   de la story, cette fois sans même un appelant à qui le dire. La restitution le **signale**
   (`dansLePlafondCourant: false`), le document porte la `versionPlafonds` en vigueur à l'écriture,
   et **abaisser un plafond est une migration**, pas un changement de valeur.
3. **`MESSAGE_PROBANT` n'a aucun écrivain** : le rendu figé d'une mise en demeure n'existe dans
   aucune collection. Son plafond est déclaré maintenant parce qu'un plafond décidé le jour où
   l'objet arrive serait décidé par celui qui a besoin de le dépasser. STORY-586 vérifie que ce rendu
   **n'existe pas**.
4. **Rien ne purge encore** : `expireLe` est écrit partout et lu nulle part (STORY-586).
