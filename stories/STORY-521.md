# STORY-521 : Vie et Non-Vie deviennent étanches — deux comptes techniques, jamais une somme

Status: in_progress

**Complexité :** high

**Épic :** EPIC-133 — Comptes de résultat technique Vie / Non-Vie et compte non technique
**Service :** `assurance-service` + référentiel `cima-assurances`
**Points :** 13 · **Sprint :** S20
**Prérequis :** **STORY-518** (les variations au CR) · **STORY-520** (la réassurance)
**Origine :** revue de l'artefact, 2026-08-27 — **AD-3** de la spine.

---

## Le fait, mesuré dans l'artefact

`cima-assurances@1.0` portait **un seul `COMPTE_RESULTAT` plat** : 25 postes, `RC1..RC8` / `RP1..RP5`,
`RT`, `RN`. **Aucune séparation Vie / Non-Vie.** Le libellé de `RT` le dit lui-même, et il le dit
encore en `@3.0` : *« Résultat technique (amorce — hors séparation Vie/Non-Vie) »*.

Or le code CIMA impose des **comptes distincts**, et c'est une contrainte réglementaire, pas une
préférence de présentation.

⇒ **Une somme Vie + Non-Vie n'est pas un compte technique : c'est un total qui n'existe dans aucun
état réglementaire.**

---

## Cadrage mesuré avant de coder (2026-09-21)

Douze constats, relevés sur les **pages officielles `cima-afrique.org`** — corpus de **940 pages** de
l'édition « CODE CIMA 2019 », ce qui rend les recherches négatives rejouables — et dans l'artefact
packagé. **Quatre contredisent la story**, et l'un d'eux en déplace la raison d'être.

### M1 — ⛔⛔ La prémisse est FAUSSE : en zone CIMA, **nul ne peut être agréé pour les deux**

La story écrit : *« un assureur agréé pour les deux doit présenter les deux comptes »*. Le Code dit
l'inverse, à la lettre.

**Article 326, alinéa 3, verbatim :**

> « Toute entreprise réalisant des opérations définies au 1°) de l'article 300 ne peut pratiquer
> **en même temps** les opérations définies au 2°) du même article. »

**Article 300**, qui définit les deux ensembles :

> « 1°) les entreprises qui contractent des engagements dont l'exécution dépend de la durée de la vie
> humaine ou qui font appel à l'épargne en vue de la capitalisation […] »
> « 2°) les entreprises d'assurance de toute nature y compris les entreprises exerçant une activité
> d'assistance et **autres que celles visées au 1°)**. »

L'alinéa 4 de l'art. 326 donnait **trois ans** aux sociétés composites pour se mettre en conformité —
délai expiré depuis 1998. ⚡ **La spécialisation est donc la règle, et l'étanchéité est obtenue par
l'agrément, pas par deux colonnes dans une même liasse.**

⇒ **AC-5 se renverse** : *« un assureur mono-activité (Non-Vie seul, **cas le plus fréquent**) »* — ce
n'est pas le cas le plus fréquent, c'est le **seul cas légal**. L'état de l'autre catégorie n'est pas
vide par accident de portefeuille : il est **non applicable par construction**.

⚠️ **Une seule brèche, art. 326 alinéa 1 :** « Toutefois, en ce qui concerne les opérations
d'**acceptation en réassurance**, cet agrément n'est pas exigé. » L'agrément est levé ; la
spécialisation de l'alinéa 3, elle, ne l'est pas. Le plan en porte la trace — `604` *acceptations
vie* et `605` *acceptations dommages* existent séparément des affaires directes `601` / `602`. Le
module **ne tranche pas** cette question : il la nomme (D-521-7).

### M2 — ⚠️ Le régulateur ne dit ni « compte technique », ni « Non-Vie », ni « compte non technique »

**Article 433** publie les états modèles. Relevé sur la page officielle, il y a **deux modèles du
compte 80**, chacun en DÉBIT et en CRÉDIT, puis le compte 87 :

| Intitulé **exact** du modèle | Ce que la story l'appelait |
|---|---|
| `Compte 80 - Vie / Capitalisation` | « compte technique Vie » |
| `Compte 80 - Assurances de toute nature` | « compte technique Non-Vie » |
| `COMPTE 87 - COMPTE GENERAL DE PERTES ET PROFITS` | « compte non technique » |

« Assurances de toute nature » **est** le non-vie : l'art. 300 2°) le définit comme « autres que
celles visées au 1°) ». Le périmètre est exact, le mot ne l'est pas.

⚡ **« NON VIE » existe bien dans le Code** — mais pour les **états de réassurance** (`ETAT RS2 VIE` /
`ETAT RS2 NON VIE`, art. 433). Une recherche négative n'aurait donc prouvé que l'absence du
vocabulaire cherché, jamais celle du concept ([[STORY-512]]). Le vocabulaire existe, il désigne
autre chose.

### M3 — ⚡ Les colonnes du modèle sont l'axe que STORY-520 vient de livrer

Les deux modèles du compte 80 portent **trois colonnes** :

> `Opérations brutes` | `Cessions et rétrocessions` | `Opérations nettes`

C'est **exactement** D-520-2 : le brut et la cession sont deux postes, le **net est une
présentation**, jamais un stockage. La séparation Vie/Non-Vie s'ajoute donc à un axe déjà en place,
elle ne le remplace pas.

### M4 — ⛔⛔ AC-3 est FAUX : les charges communes sont **DANS** le compte 80, pas au 87

AC-3 énonce : *« Ce qui n'est affectable ni à l'une ni à l'autre va au compte non technique — jamais
réparti par une clé inventée. »* Le Code fait **l'inverse du premier membre**.

**L'article 432 organise le compte 80 en TROIS listes**, et c'est la troisième qui tranche :

1. « 80. Exploitation générale (comptes spéciaux aux **sociétés vie et capitalisation**) » — sinistres
   survenus, capitaux échus, arrérages échus, rachats, participations aux excédents, **provisions
   mathématiques** (310, 340, 3810, 3840), ajustement ACAV (679 / 779), intérêts servis à la
   provision pour participation aux excédents (676, 6976), primes (701, 703, 704, 706…).
2. « 80. Exploitation générale (comptes spéciaux aux **entreprises de toute nature**) » —
   prestations et frais payés (602, 604, 605, 606, 6902, 6904, 6905 et **(cessions) 609, 6909**),
   **provisions de sinistres** (325, 355, 3825, 3855), **provisions de primes** (320, 340, 350, 360…).
3. « 80. Exploitation générale (**comptes communs à toutes les entreprises**) » — **commissions
   (65, 695), frais de personnel (61), impôts et taxes (62), travaux / fournitures / services
   extérieurs / transports (63, 64, 693, 694), frais divers de gestion (66, 696), dotations aux
   amortissements et provisions, frais financiers, produits des placements, subventions
   d'exploitation (71, 791), produits accessoires (74, 76), travaux faits par l'entreprise pour
   elle-même (78, 798)**.

⇒ Les charges de structure et les produits financiers que la story envoie au « compte non technique »
sont **nommément rattachés au compte 80** par le Code. Le **compte 87**, lui, ne reçoit que le
**solde** du 80 (« Pertes d'exploitation de l'exercice (80) » / « Profits d'exploitation de
l'exercice (80) »), puis les exercices antérieurs (820 / 822), les provisions pour moins-values
(150, 19), les dotations hors exploitation et réglementaires (831, 833, 839), l'exceptionnel (840),
les pertes de change et l'impôt.

⚡ **Et c'est une bonne nouvelle pour AC-3** : puisque la spécialisation (M1) fait qu'une seule
activité existe par entreprise, et puisque les charges communes ont leur place écrite dans le compte
80, **il n'y a aucune clé de répartition à inventer**. Le risque contre lequel AC-3 était écrit
n'existe pas dans ce plan. Le critère est **tenu par construction**, pas par une garde.

### M5 — ⛔ La séparation vit au **3ᵉ chiffre**, et le plan packagé s'arrête à 2

Mesuré dans `cima-assurances-3.0.json` : **les classes 6 et 7 ne portent aucun axe Vie/Non-Vie**.
`60 Prestations dans le pays concerné`, `70 Primes ou cotisations dans le pays concerné` — rien ne
distingue.

Mesuré dans l'**article 431** officiel, l'axe est systématique, au **3ᵉ chiffre**, et il est régulier :

| Compte | Libellé verbatim |
|---|---|
| `601` | Prestations échues (**affaires directes vie**) |
| `602` | Prestations et frais payés (**affaires directes dommages, RC et risques divers**) |
| `604` | Prestations échues (**acceptations vie**) |
| `605` | Prestations et frais (**acceptations d'affaires dommages, RC et risques divers**) |
| `701` | Primes (**affaires directes vie**) |
| `702` | Primes (**affaires directes dommages, RC et risques divers**) |
| `704` | Primes (**acceptations vie**) |
| `705` | Primes (**acceptations dommages, RC et risques divers**) |

⇒ **Même situation qu'en M2 de STORY-520** : la séparation *exige* que le plan descende sous deux
chiffres, pour un nombre **exact** de comptes. Ici **huit**, et pas un de plus.

⚡ **Ce qui ne descend PAS, et pourquoi c'est mesuré et non choisi :**
- Les **cessions** restent entières. L'art. 432 cite `609` et `709` **à trois chiffres dans les deux
  listes** — chaque modèle prend la totalité du compte de cession, puisqu'un seul modèle s'applique.
  `RC9` / `RP6` livrés par STORY-520 traversent donc `@4.0` **inchangés**.
- La **classe 3** porte déjà l'axe **dès deux chiffres** : `31` / `34` *vie*, `32` / `35` *dommages,
  RC et risques divers*, `38` *étranger*. Aucun compte à ajouter.
- `603` et `606` (classe 6), `703` et `706` (classe 7) sont **cités par l'art. 432 et absents de
  l'art. 431** — exactement la contradiction déjà relevée pour `7909` (D-518-7, D-520-5). Ils
  restent dehors, et la lacune est consignée.

### M6 — ⚡⚡ `RN` ne peut pas être la somme des trois : mesuré dans le moteur

AC-4 énonce : *« `RN` = résultat technique Vie + résultat technique Non-Vie + résultat non
technique. »* **Cette égalité ne peut pas tenir**, et la raison est déjà écrite dans le dépôt.

Mesuré dans `compte-resultat-production.service.ts` :

- `resultatNetDirect` = `Σ_CR (crédit − débit)` sur **tout compte rattaché au compte de résultat**
  (`appliquer`, l. 647-651) ;
- `coherenceSig` (l. 406-440) confronte le **poste terminal** à cette somme, et `ecart === 0` est
  **vrai par construction** sur une balance équilibrée ;
- **D-518-5** a retiré `RN` de la cascade de `RT` précisément pour cela : `RT` intègre `−RV1 +RV2`,
  lus en `mode: VARIATION` sur des postes de **BILAN** (classe 3), donc **hors `Σ_CR`**.

⇒ L'égalité réelle est `résultat Vie + résultat Non-Vie + compte 87 = RN − RV1 + RV2`. Écrire AC-4 à
la lettre ferait entrer une variation de classe 3 dans le terminal et passerait **tout dossier CIMA
en `ANOMALIE` sur une balance pourtant juste** — le défaut exact que D-518-5 et M4 de STORY-520 ont
déjà évité deux fois.

### M7 — ⛔⛔ Le poste terminal est le **DERNIER `FORMULE` déclaré**, et rien ne le nomme

`compte-resultat-production.service.ts:417-423` :

```ts
const declarations = pkg.tableDePassage.filter(
  (r) => r.etat === ETAT_CR && r.regle === REGLE_FORMULE && (r.operandes?.length ?? 0) > 0,
);
const codeTerminal = declarations.at(-1)?.poste;
```

Le terminal n'est pas `RN` parce qu'il s'appelle `RN` : il l'est parce qu'il est **la dernière ligne
`FORMULE` garnie de l'état `COMPTE_RESULTAT`, dans l'ordre du fichier**. Deux conséquences, toutes
deux silencieuses :

1. Déclarer un poste `FORMULE` **après** `RN` dans la table de passage **déplace le terminal**, et
   `COHERENCE_RESULTAT` confronte alors la mauvaise grandeur à la balance — sans lever.
2. Si l'état `COMPTE_RESULTAT` **cessait d'exister**, `coherenceSig` rendrait `resultatNetSig: null`,
   donc le contrôle deviendrait `NON_APPLICABLE` — et `bloquantSatisfait`
   (`controles-coherence.types.ts:228-231`) **admet `NON_APPLICABLE` sur un contrôle BLOQUANT**. La
   liasse resterait **`valide: true` sans rien mesurer**.

⇒ `COMPTE_RESULTAT` et son terminal `RN` sont **intouchables** dans cette story. Les états
réglementaires s'ajoutent **à côté**, jamais à la place.

### M8 — ⛔⛔ « comptes techniques » **existe** dans le Code CIMA, et désigne autre chose

Recherche menée sur les **940 pages** de l'édition officielle « CODE CIMA 2019 ». L'expression
« compte(s) technique(s) » y apparaît **une seule fois**, et pas là où la story la place :

> **Art. 432, classe 7** — « En dehors des **comptes techniques (comptes 70, 73, 75 et 79)**, les
> produits comprennent […] »

⇒ En CIMA, « comptes techniques » désigne **quatre comptes de la classe 7**, pas un compte de
résultat. « non technique » n'y paraît qu'une fois aussi, en **adjectif** (art. 432, compte 82 :
« les pertes et profits au titre des exercices antérieurs sur les **postes non techniques** »).

⚡ Nommer nos états « compte technique Vie / Non-Vie / non technique » créerait donc **un second sens
pour une expression que le Code emploie déjà** — le défaut exact de [[STORY-503]]. C'est ce qui rend
**D-521-1 non négociable**, au-delà d'une préférence de style.

Contrôle des deux autres formulations, sur le même corpus : « compte d'exploitation générale »
**19 occurrences**, « compte général de pertes et profits » **22 occurrences**. Le vocabulaire du
régulateur est sans ambiguïté.

⚠️ **Recherche négative, et ce qu'elle prouve exactement** : « gestion distincte », « comptabilité
distincte », « gestion séparée » — **zéro occurrence** dans le Code. Elle ne prouve pas que
l'étanchéité n'existe pas : elle prouve que **CIMA l'obtient par l'interdiction structurelle de
l'art. 326**, et non par une règle de cloisonnement comptable interne. Les deux mènent au même
résultat par des chemins opposés, et seul le second aurait demandé une clé de répartition.

### M9 — ⚡ La clé de répartition EXISTE — mais entre **catégories**, jamais entre vie et non-vie

AC-3 se méfie d'« une clé inventée ». Le Code en publie une, et il faut savoir qu'elle existe pour ne
pas la ramasser au mauvais endroit. **Art. 433, « Dispositions communes à toutes les entreprises »**,
placé après les deux modèles de l'état C1 :

> « La répartition **par catégorie ou sous-catégorie** des frais de gestion et des dotations aux
> amortissements s'effectue en rapportant à chaque branche les frais qui lui sont directement
> applicables et en ventilant les autres frais généraux aussi exactement que possible […] Sauf
> justification spéciale, le total des frais respectivement affectés aux catégories transports et
> acceptations ne devra pas dépasser **10 %** et **2,5 %** des primes.
> **Les produits financiers sont, à défaut d'une étude plus poussée, ventilés par catégorie ou
> sous-catégorie au prorata des provisions techniques nettes de réassurance.** »

⇒ Cette clé ventile **à l'intérieur d'une activité**, entre les **23 catégories de l'art. 411**, et
elle appartient à l'**état C1** — donc à **[[STORY-523]]**, pas à celle-ci. Elle est **supplétive**
(« à défaut d'une étude plus poussée »), ce qui la rend précisément indisponible comme défaut de
moteur. **AC-3 reste tenu : aucune clé n'est inventée ici, et celle du Code n'est pas convoquée hors
de son état.**

### M10 — ⚠️ Les comptes d'**acceptations** figurent dans les DEUX listes de l'art. 432, et c'est cohérent

L'art. 432 cite `604` et `606` dans la liste **vie** *et* dans la liste **toute nature**, et `704`
dans les deux également. Ce n'est pas une coquille : l'**art. 326 alinéa 1** exempte les
**acceptations en réassurance** d'agrément. Une société non-vie peut donc légitimement porter des
acceptations vie, et son compte 80 doit pouvoir les recevoir.

⇒ **Conséquence directe sur la dérivation (D-521-4)** : un compte d'acceptation **ne prouve rien** sur
l'agrément. Seules les **affaires directes** le prouvent — `601` / `701` (vie) contre `602` / `702`
(dommages). Dériver la catégorie d'un `604` ferait conclure « vie » sur une société non-vie
parfaitement régulière.

### M11 — ⚡ Le seul régime mixte du Code ne produit **qu'un seul** compte 80

**Art. 715** (microassurance) : une entreprise de microassurance peut être agréée pour la
microassurance **non vie** *et* pour l'**assurance temporaire décès** — le seul cas mixte pérenne du
Code. Et l'**art. 723** tranche la conséquence comptable :

> « **Le mode de gestion de la branche 11 est assimilé dans ce cas à celui de l'IARD.** »

⇒ Même dans le cas mixte, **un seul compte 80**, sur le modèle « Assurances de toute nature ».
L'**art. 337-4** (sociétés mixtes héritées de l'avant-Code) va dans le même sens pour la marge de
solvabilité : calcul **séparé puis sommé**, jamais une base agrégée.

⚡ **Le Code ne connaît donc aucune situation où deux comptes 80 coexistent.** C'est la confirmation
la plus forte de M1 — et elle vient d'un article que la story ne cite pas.


### M12 — ⚠️ Deux défauts que seules les PORTES ont vus, et jamais la compilation

Consignés parce qu'ils se reproduiront :

1. **`npm run build` attrape ce que `tsc --noEmit` laisse passer.** Le moteur compilait sous
   `tsc --noEmit -p tsconfig.json` et échouait sous `nest build` : `eslint --fix` avait retiré deux
   assertions de type qu'il jugeait « inutiles », et c'est **elles** qui fermaient l'union. ⇒ La
   porte est `npm run build`, jamais un `tsc` de contrôle.
2. ⛔ **Ajouter une dépendance au constructeur d'un service casse TOUS les modules de test qui
   l'instancient.** `BilanEngineService` a fait rougir d'abord sa propre spec unitaire (`Expected
   10 arguments, but got 9`), puis **huit** modules e2e (`Nest can't resolve dependencies […]
   ComptesCimaProductionService at index [9]`). C'est le **manquement structurel n°1** de
   `.agents/rules/qualite-verification.md`, et **seul `npm run test:e2e` le révèle**.

---

## Décisions de cadrage du 2026-09-21

| # | Décision | Pourquoi |
|---|---|---|
| **D-521-1** | Les trois états portent le **numéro de compte du Code** : `COMPTE_80_VIE_CAPITALISATION`, `COMPTE_80_TOUTE_NATURE`, `COMPTE_87_PERTES_ET_PROFITS` | **Mesuré (M2)** : « compte technique », « Non-Vie » et « compte non technique » ne sont pas les mots du Code à cet endroit. Le numéro de compte, lui, est sans ambiguïté et traverse les 14 États. Leçon [[STORY-503]] : un brief qui nomme les champs crée un second nom pour un concept publié |
| **D-521-2** | **`COMPTE_RESULTAT` est conservé tel quel**, `RN` reste son dernier `FORMULE` et le terminal confronté à `Σ_CR` | **Mesuré (M6/M7)**. Les trois états réglementaires sont des **présentations** ajoutées à côté ; l'articulation avec le bilan ne bouge pas d'un franc. Régression interdite (AC-7) |
| **D-521-3** | Le plan gagne **exactement huit comptes à trois chiffres** — `601`, `602`, `604`, `605`, `701`, `702`, `704`, `705` — libellés verbatim de l'art. 431 | **Mesuré (M5)**. Sans eux, les deux modèles seraient alimentés par le même `60`/`70` et l'étanchéité serait décorative. Ce n'est **pas** la transcription du plan ([[STORY-671]]) : ce sont les huit comptes que l'axe exige |
| **D-521-4** | La **catégorie du dossier se DÉRIVE des comptes d'AFFAIRES DIRECTES présents dans la balance**, jamais d'un paramètre saisi, et **jamais d'un compte d'acceptation** | Le référentiel produit la liasse depuis une balance, qui ne porte aucun axe de catégorie. `601` / `701` ⇒ vie ; `602` / `702` ⇒ toute nature. **Mesuré (M10)** : `604`, `606`, `704` figurent dans les DEUX listes de l'art. 432 parce que l'art. 326 al. 1 exempte les acceptations d'agrément — en dériver la catégorie conclurait « vie » sur une société non-vie régulière. C'est AC-6 mot pour mot : ce qui n'est pas dans la donnée ne se devine pas |
| **D-521-5** | Le modèle qui ne s'applique pas est servi **`NON_APPLICABLE`, squelette compris** — jamais absent | AC-5, patron du TFT absent du SFD (`tft-production.service.ts:137-163`) : l'onglet reste visible, les mesures valent `null` et jamais `0`. *Un état qui disparaît fait chercher ce qu'on a cassé* |
| **D-521-6** | Une balance portant **à la fois** des comptes du 1°) et du 2°) de l'art. 300 produit un constat **nommé et bloquant** ; une balance ne portant que `60`/`70` à deux chiffres rend la catégorie **`INDETERMINABLE`** | **Mesuré (M1)** : le premier cas décrit une entreprise que l'art. 326 interdit. Le second est le cas de **toutes les balances CIMA existantes** — il doit se dire, pas se deviner (AC-6) |
| **D-521-7** | Les comptes d'**acceptations** sont routés dans **le modèle effectivement servi**, et **exclus de la dérivation** | **Mesuré (M10)** : l'art. 432 les cite dans les deux listes, et l'art. 326 al. 1 explique pourquoi. Le module ne tranche pas la licéité d'une acceptation vie par une société non-vie — il cesse simplement d'en **tirer une conclusion d'agrément**. AD-12 : on n'invente rien |
| **D-521-8** | `cima-assurances@4.0` devient la version **SERVIE** ; `@1.0`, `@2.0` et `@3.0` restent packagées et **intactes, octet pour octet** | D-518-6 / D-520-8 : un paquet publié non servi est **inerte**. ⚠️ `estHabiliteParmi` compare le couple **exact** : l'octroi est à rejouer. **Migration = souci de prod, différé** |
| **D-521-9** | `assurance-service` : la **quittance** reçoit sa catégorie **recopiée du contrat**, aux **trois** chemins qui en écrivent une (prime, annulation, ristourne), comme le sinistre | AC-1. Mesuré : la quittance est le **seul maillon** du cycle prime qui ne la portait pas |
| **D-521-9 bis** | ⛔ **Aucun index, et aucune requête ne filtre sur ce champ.** ⚠️ *Amende D-521-9, qui annonçait l'inverse* | **Mesuré en cours de dev** : en BSON un champ **absent** ne satisfait aucune égalité — une quittance écrite avant ce champ sortirait **silencieusement** de l'assiette de cession. C'est le défaut exact de la vérif docker de STORY-520 (777 000 disparus, HTTP 200), dont le correctif avait lui-même dû être repris faute d'index. L'autorité reste le **contrat** ; ce champ rend la catégorie *lisible*, pas *interrogeable*. ⇒ Les bornes `QUITTANCES_MAX_*` continuent de compter les deux catégories : c'est **consigné, pas corrigé** |
| **D-521-10** | Le **statut du paquet reste `amorce`** | La réserve levée est celle de la séparation Vie/Non-Vie, **pas** celle des états C1..C25 ([[STORY-523]]) ni celle du niveau de détail du plan ([[STORY-671]]). Le libellé de `RT` cesse en revanche de dire « hors séparation Vie/Non-Vie » |

---

## Périmètre

### Livré

**`bilan-service`** — `cima-assurances@4.0` :
- Sources `plan-comptable-cima-v4.json`, `postes-cima-v4.json`, `table-de-passage-cima-v4.json`,
  entrée `@4.0` dans `build.mjs`, artefact généré — **`@1.0`, `@2.0` et `@3.0` intacts, octet pour
  octet**.
- Les **huit comptes** de D-521-3, libellés verbatim art. 431.
- Les **trois états** de D-521-1, avec les postes des modèles de l'art. 433.
- **Dérivation de la catégorie** depuis les comptes de la balance, `NON_APPLICABLE` sur le modèle qui
  ne s'applique pas, `INDETERMINABLE` quand la balance ne permet pas de trancher, constat nommé
  quand elle porte les deux (D-521-4 / D-521-5 / D-521-6).
- `COMPTE_RESULTAT`, `RT`, `RN` et l'articulation `Σ_CR` **inchangés** (D-521-2) ; seul le libellé de
  `RT` perd sa réserve « hors séparation Vie/Non-Vie ».

**`assurance-service`** :
- `categorie` sur `Quittance`, **recopiée du contrat** à l'émission, `required`, indexée ; exposée en
  réponse ; filtrage **dans la requête** pour la cession et la provision (D-521-9).
- Bascule de `REFERENTIEL_SERVI` vers `@4.0`, artefact recopié byte-identique.

**`balance-service`**, **`platform-catalog-service`** — enregistrement de `@4.0`, bascule de la
version servie, digests épinglés, artefact recopié byte-identique, snapshot et pack
`assurance-cima → @4.0`. ⚡ Au passage, l'assertion **registre ↔ octets** manquante pour `@3.0`
(oubliée par STORY-520) est rétablie.

**`docs`** — cette story, la section `@4.0` du README du référentiel, le ticket frontend,
`sprint-status.yaml`.

### Hors périmètre

- ⛔ **La transcription du plan à 3/4/5/6 chiffres** → **STORY-671**. Huit comptes, pas un de plus.
- ⛔ **Les états annexes C1..C25** et les états `RS2 VIE` / `RS2 NON VIE` → **STORY-523**.
- ⛔ **Le compte 88** (résultats en instance d'affectation) — publié par l'art. 433, hors de l'axe de
  cette story.
- ⛔ **La licéité d'une acceptation vie par une société non-vie** (D-521-7).
- ⛔ **Les comptes `603`, `606`, `703`, `706`** — cités par l'art. 432, absents de l'art. 431 (M5).
- ⛔ **L'adaptateur de balance AD-5** — toujours réservé par D-511-I : aucun montant d'
  `assurance-service` n'atteint la liasse dans cette story.
- ⛔ **La migration des octrois** vers `@4.0` — souci de prod, différé.

---

## Critères d'acceptation

- [ ] AC-1 — La **catégorie Vie / Non-Vie** est portée par le contrat (STORY-513 AC-1) et se
      propage à tout : quittances, sinistres, provisions, traités de réassurance.
      ⚠️ **Amendé par D-521-9** : mesuré, seuls **sinistres**, **provisions** (× 2) et **traités** la
      portaient. La **quittance** ne la portait pas, et les lectures de cession et de provision
      ramenaient **les deux catégories** avant de trancher en mémoire — bornes de sécurité
      comprises.
- [ ] AC-2 — Le référentiel publie **trois états de résultat** : technique Vie, technique Non-Vie,
      non technique. Nouvelle version du paquet, `@1.0` conservé intact.
      ⚠️ **Amendé par M2 / D-521-1** : ce sont les **modèles de l'art. 433**, et ils portent les mots
      du Code — `Compte 80 - Vie / Capitalisation`, `Compte 80 - Assurances de toute nature`,
      `Compte 87 - Compte général de pertes et profits`.
      ⚠️ **Amendé par D-521-2** : ils s'ajoutent **à côté** de `COMPTE_RESULTAT`, jamais à sa place.
- [ ] AC-3 — ⛔ **Aucun poste n'est imputable aux deux à la fois.** Ce qui n'est affectable ni à
      l'une ni à l'autre va au **compte non technique** — jamais réparti par une clé inventée. Une
      clé de répartition est une décision de direction, pas un défaut de moteur.
      ⚠️ **Amendé par M4** : le Code range les charges communes **dans le compte 80** (art. 432,
      liste « comptes communs à toutes les entreprises »), pas au compte 87. Et **M1 le rend vrai par
      construction** : une entreprise n'ayant qu'une activité, aucun poste ne peut être imputable aux
      deux. **Aucune clé n'est inventée parce qu'aucune n'est nécessaire.**
- [ ] AC-4 — `RN` = résultat technique Vie + résultat technique Non-Vie + résultat non technique.
      Le contrôle d'articulation le vérifie, et un écart est **bloquant**.
      ⛔ **Amendé par M6** : l'égalité littérale est **fausse** — `RT` intègre `−RV1 +RV2` lus sur le
      **bilan**, hors `Σ_CR`. Le contrôle vérifie donc l'articulation **réellement vraie** :
      `solde du compte 80 servi + éléments propres au compte 87 = RN − RV1 + RV2`, la variation étant
      **nommée** dans l'écart et non passée sous silence. Un écart reste **bloquant**.
- [ ] AC-5 — Un assureur **mono-activité** rend le compte technique de l'autre catégorie **vide, pas
      absent**, avec statut `NON_APPLICABLE`. ⚡ Même doctrine que le TFT absent du SFD : *un état qui
      disparaît fait chercher ce qu'on a cassé*.
      ⚠️ **Amendé par M1** : « mono-activité (cas le plus fréquent) » — c'est le **seul cas légal**
      (art. 326). L'état de l'autre catégorie est non applicable **par construction**, et le dire
      ainsi est plus juste que de le présenter comme un portefeuille incomplet.
- [ ] AC-6 — ⚠️ La **ventilation ne se reconstitue pas après coup** : un jeu de données historiques
      sans catégorie ne peut pas être réparti, et le module doit le dire plutôt que de deviner.
      ⚡ **Mesuré (D-521-4/6)** : c'est le cas de **toutes** les balances CIMA existantes, qui ne
      portent que `60`/`70` à deux chiffres ⇒ catégorie `INDETERMINABLE`, les deux modèles non
      servis, et l'indétermination **publiée**.
- [ ] AC-7 — ⛔ **Aucune régression** : `EQUILIBRE_BILAN`, `COHERENCE_RESULTAT` et l'articulation
      `RN == bilan.controle.resultatNetN` restent verts. Un dossier `@1.0`, `@2.0` ou `@3.0` produit
      **exactement** les mêmes états qu'avant, octet pour octet sur les trois artefacts.

## Notes

- Voir [[STORY-513]], [[STORY-518]], [[STORY-520]], [[STORY-522]], [[STORY-523]], [[STORY-671]],
  spine AD-3.
- Sources officielles dépouillées le 2026-09-21 — édition « CODE CIMA 2019 », `cima-afrique.org`,
  **940 pages** parcourues (les recherches négatives de M8 sont donc rejouables) : art. **300**
  (objet du contrôle, 1°) et 2°)), art. **326** (agrément, spécialisation, exemption des
  acceptations), art. **328** (branches 1-18 IARD / 20-23 vie), art. **337-4** (sociétés mixtes),
  art. **411** (23 catégories), art. **422** (liste des états comptables), art. **431** (liste des
  comptes), art. **432** (terminologie, les trois listes du compte 80, « comptes techniques » =
  70/73/75/79), art. **433** (états modèles et clé de ventilation par catégorie), art. **715** et
  **723** (microassurance mixte).

## Progress Tracking

**Statut : `in_progress` le 2026-09-21.** Cinq dépôts branchés `MNV-521` **avant la première ligne de
code** — `assurance-service`, `bilan-service`, `balance-service`, `platform-catalog-service`, `docs`.

### Cadrage

Fait le 2026-09-21 sur les pages officielles et sur l'artefact packagé. **Onze constats M1-M11, dont quatre
contredisent la story** : la spécialisation imposée par l'art. 326 (M1), le vocabulaire du régulateur
(M2), le rattachement des charges communes au compte 80 (M4), et l'existence d'un sens CIMA déjà pris
pour « comptes techniques » (M8). Dix décisions D-521-1 à D-521-10.

### Ce qui est livré

**`bilan-service`** — `cima-assurances@4.0` (`021992b5…`) : sources `plan-comptable-cima-v4.json`,
`postes-cima-v4.json`, `table-de-passage-cima-v4.json`, entrée `@4.0` dans `build.mjs`, artefact
généré. **`@1.0`, `@2.0` et `@3.0` intacts — vérifié par `git diff --stat` sur le répertoire
`assets/` : aucune ligne.** Moteur `ComptesCimaProductionService`, module `etats-cima.ts`, DTO et
route `POST /bilan/etats/resultat-cima/dry-run`.

**`assurance-service`** — `categorie` sur `Quittance`, recopiée du contrat aux **trois** chemins qui
en écrivent une ; `REFERENTIEL_SERVI` → `@4.0` ; artefact recopié byte-identique.

**`balance-service`**, **`platform-catalog-service`** — enregistrement, bascule du tag servi,
digests épinglés, snapshot et pack. ⚡ Au passage, l'assertion **registre ↔ octets** manquante pour
`@3.0` — oubliée par STORY-520 — est rétablie.

### ⛔ Ce que la réutilisation a coûté, et pourquoi elle était obligatoire

Les deux modèles du compte 80 agrègent **exactement** comme le compte de résultat. Une seconde
implémentation aurait divergé sans que rien ne confronte les deux sorties — la règle n°5 des
consignes de dev l'interdit (« ne jamais réécrire une formule qui existe déjà : l'importer »).

Le compte de résultat a donc été rendu **réutilisable par état** : `agreger`, `choisirPosteCR`,
`emettrePostes`, `contexteDetailCR`, `produireSig`, `metaPostes` et `ordreInconnu` prennent un
paramètre `etat` valant `COMPTE_RESULTAT` par défaut. **Le comportement du compte de résultat est
inchangé** — 527 tests de `etats/` verts immédiatement après le paramétrage, puis 3 072 au total.

⚠️ Le prix : les types littéraux `PosteResultat.etat` et `PosteSig.etat` passent de
`'COMPTE_RESULTAT'` à `string`. Le littéral promettait sur la **structure** ce qui n'était vrai que
d'un **appelant** ; le DTO du compte de résultat, lui, continue de publier l'enum fermé, et cette
promesse-là reste exacte.

### Table de mutations — 11 mutations, 11 rouges

| # | Mutation | Effet attendu | Mesuré |
|---|---|---|---|
| M1 | `RC1` cesse d'énumérer les comptes à trois chiffres | `6010` quitte `Σ_CR` ⇒ `RN` change | **3 rouges** |
| M2 | le modèle NON servi est calculé au lieu d'être rendu vide | les charges communes fuitent dans les deux états | **6 rouges** |
| M3 | le signe des variations est inversé dans l'articulation | `ecart ≠ 0` | **1 rouge** |
| M4 | un compte d'ACCEPTATION dérive l'agrément | « vie » conclu sur une société de toute nature | **1 rouge** |
| M5 | le squelette rend `0` au lieu de `null` | « néant » publié à la place de « sans objet » | **3 rouges** |
| M6 | le solde devient la PREMIÈRE formule au lieu de la dernière | la mauvaise grandeur est publiée en solde | **1 rouge** |
| M7 | une opérande du modèle Vie vise le poste `RESULTAT_BILAN` | la garde `operandes-coherence` doit couvrir les états neufs | **1 rouge** |
| M8 | la catégorie de la **prime** est figée | la recopie du contrat n'est plus lue | **2 rouges** |
| M9 | idem sur l'**annulation** | idem | **1 rouge** |
| M10 | idem sur la **ristourne** | idem | **1 rouge** |
| M11 | le signe qui donne le `sens` d'un agrégat est inversé | la part des cessionnaires est annoncée `CHARGE` | **1 rouge** |

⛔⛔ **Deux leçons de la passe elle-même, payées comptant :**

1. **Une mutation qui ne compile pas rend « 0 test », et ce n'est PAS un rouge.** Figer la catégorie
   par `CategorieAssurance.NON_VIE` sans importer l'enum a produit une suite qui ne démarre pas —
   mesure vide prise pour une détection. Refaite en `'NON_VIE' as typeof contrat.categorie`, elle
   vire bien au rouge. *(Leçon déjà écrite par STORY-505, et rejouée ici.)*
2. ⚠️ **`git checkout --` efface le travail NON COMMITTÉ.** Deux fois : les trois recopies de
   catégorie d'`assurance-service`, puis le correctif du `sens` de `bilan-service`. **Committer
   AVANT de muter** n'est pas une précaution, c'est la condition pour que la passe soit réversible.

### Portes de qualité

| Dépôt | lint | build | unitaires | couverture | e2e |
|---|---|---|---|---|---|
| `bilan-service` | 0 | OK | **3 072** | fichiers neufs 98,71 / 91,11 / 100 / 100 | **822** |
| `assurance-service` | 0 | OK | **2 010** | 99,6 / 94,49 / 99,18 / 99,65 | **201** |
| `balance-service` | 0 | OK | **4 179** | 99,16 / 92,74 / 98,58 / 99,26 | 1 077 |
| `platform-catalog-service` | 0 | OK | 740 | 99,73 / 96,81 / 100 / 99,78 | 200 |

⚠️ **Deux défauts que seules les portes ont vus**, consignés en M12 : `npm run build` attrape ce que
`tsc --noEmit` laisse passer, et une dépendance ajoutée au constructeur de `BilanEngineService` a
cassé sa spec unitaire **puis les huit modules de test e2e**.

### ⛔⛔ Vérification docker — stack neuve, jeton IdP réel, Kafka réel

**Contexte**, dit franchement : `docker compose up --build` est resté bloqué **25 minutes** sans
progresser. La voie documentée par `CLAUDE.md` a été prise — démarrage **sans reconstruire**, `src/`
étant monté en volume avec `nest start --watch`, donc le code exécuté est celui de la branche.

⚠️ **Et ce n'est pas suffisant comme preuve** : `nest --watch` peut annoncer « Found 0 errors » en
servant encore l'ancien code. Le témoin retenu est donc **fonctionnel** :

```
GET /api/v1/whoami/assurance-access
→ { "acces": "accorde", "referentielExige": "cima-assurances@4.0" }
```

`@4.0` n'existe que sur cette branche. Le conteneur exécutait bien son code.

**Mise en place** — stack rebâtie depuis zéro (`docker compose down -v`) :

| Étape | Moyen | Résultat |
|---|---|---|
| Compte + organisation | `POST /auth/register` puis `/auth/login` sur l'IdP | jeton **RS256 réel**, `org = 6ab1a896…` |
| E-mail vérifié | `emailVerifiedAt` posé en base `auth_service` | ⚡ le claim `emailVerified` se **calcule** dessus |
| KYC + entitlement | read-models locaux de chaque service | `whoami` passe de `403 KYC_NOT_APPROVED` à `accorde` |
| Dossier `ASSURANCE` | `POST /dossiers` sur **`dossier-service`** | `typeEntite: ASSURANCE`, `referentielComptable: CIMA` |
| Exercice 2026 | `POST /dossiers/{id}/exercices` | `statut: OUVERT` |
| **Propagation** | **Kafka réel** | `dossiers_dossier` **2** · `exercices_dossier` **1**, sans intervention manuelle |

**La mesure** — un contrat par catégorie, puis les **trois** chemins qui écrivent une quittance :

```
=== VERIFICATION FINALE, sur données non corrompues ===
OK   PRIME      POL-521-VIE     → VIE
OK   PRIME      POL-521-NON_VIE → NON_VIE
OK   RISTOURNE  POL-521-VIE     → VIE
OK   ANNULATION POL-521-NON_VIE → NON_VIE

quittances = 4 | concordantes = 4 | divergentes = 0 | sans categorie = 0
contrats   = 2 (un par categorie)
```

La jointure est faite **en base** : pour chaque quittance, sa catégorie est confrontée à celle de
**son** contrat, relu par `contratId`. Une recopie figée aurait produit un `ECART` sur la moitié des
lignes.

**D-521-9 bis vérifié sur les index réels** — les huit index de `quittances` sont :

```
{_id} {quittanceVisee} {orgId,dossierId,contratId,_id} {orgId,dossierId,contratId,quittanceVisee}
{orgId,dossierId,exerciceDebut,exerciceFin,_id} {orgId,dossierId,exerciceDebut,rattachement,_id}
{orgId,dossierId,periodeFin,periodeDebut} {orgId,dossierId,type,periodeDebut}
```

**Aucun ne porte `categorie`** — la décision tient dans la base, pas seulement dans le code.

#### ⚠️ Ce que la vérification a révélé par accident, et qu'il faut dire

En testant « la collection refuse-t-elle la réécriture ? », un `updateOne` lancé **directement dans
`mongosh`** a **réussi** et corrompu une quittance. Le champ a été restauré et la mesure finale
refaite sur données propres.

⇒ **L'append-only de `quittances` est APPLICATIF**, porté par un hook `pre` de Mongoose : il ne
s'applique qu'aux écritures qui passent par le modèle. Une écriture directe en base le contourne.
Ce n'est pas un défaut de cette story — c'est une propriété du garde qu'il vaut mieux avoir mesurée
que supposée.

#### ⚠️ Ce que la vérification NE couvre PAS

- **`bilan-service` n'écrit rien** dans cette story : ses trois états sont servis par une route
  `dry-run`, en lecture seule. Il n'y a donc aucune persistance à prouver de ce côté — seulement le
  **graphe d'injection réel**, vérifié séparément par un démarrage du service.
- La stack a été **tuée en cours de route par manque de mémoire** (`mongo` et `kafka`, exit `137`) :
  cette VM docker héberge sept conteneurs étrangers au projet. Relancée, les read-models avaient
  survécu au checkpoint, et la mesure a été refaite ensuite.

#### ⚡ Et le graphe d'injection RÉEL de `bilan-service`, exercé de bout en bout

La leçon de [[STORY-517]] — *aucun test n'instanciait le graphe d'injection* — est la raison de cette
mesure. `bilan-service` a été démarré dans la stack : **`healthy`**, aucun
`Nest can't resolve dependencies`. Le `ComptesCimaProductionService` entre donc bien dans le vrai
`AppModule`, pas seulement dans un `RootTestModule`.

**La route existe** — témoin par contraste, sans jeton :

| Appel | Code |
|---|---|
| `POST …/bilan/etats/resultat-cima/dry-run` | **401** (la route est là, la garde répond) |
| `POST …/bilan/etats/resultat-inexistant/dry-run` | **404** (témoin : une route absente rend 404) |

et le contrat OpenAPI servi publie `EtatsResultatCimaDto`, `EtatResultatCimaDto`, `LigneEtatCimaDto`.

**Quatre balances CIMA, quatre comportements** (`HTTP 200`, `cima-assurances@4.0`) :

| # | Balance | `agrement` | Vie | Toute nature | Articulation |
|---|---|---|---|---|---|
| ① | `6010`/`7010`, primes 8 M | `VIE_CAPITALISATION` | `CALCULE`, solde **0** | `NON_APPLICABLE` | `OK`, écart **0** |
| ② | la même, primes 9 M | `VIE_CAPITALISATION` | `CALCULE`, solde **1 000 000** | `NON_APPLICABLE` | `OK`, écart **0** |
| ③ | `60`/`70` à deux chiffres | `INDETERMINABLE` | `INDETERMINABLE`, solde `null` | idem | `NON_APPLICABLE` |
| ④ | `6010` **et** `6020` | `INCOMPATIBLE_ART_326` | `INCOMPATIBLE_ART_326` | idem | `NON_APPLICABLE` |

⛔⛔ **Le cas ① méritait qu'on s'y arrête** : un solde de **0** est un mauvais témoin — un moteur qui
ne calculerait rien le rendrait aussi. Ce qui prouve qu'il est **mesuré** et non vide :

```
compte80Vie          statut=CALCULE         solde=0     lignes=18  non nulles=9
compte80TouteNature  statut=NON_APPLICABLE  solde=null  lignes=18  non nulles=0
compte87             statut=A_COMPLETER     solde=null  lignes= 7  non nulles=0

  EV1   CHARGE     5 500 000   Prestations échues (affaires directes et acceptations vie)
  EV2   CHARGE    −1 400 000   Part des réassureurs dans les prestations et frais
  EV3   CHARGE     1 200 000   Charges de commissions
  EV4   CHARGE       900 000   Frais de personnel
  EV10  PRODUIT    8 000 000   Primes et accessoires, nets d'annulations
  EV11  PRODUIT   −2 000 000   Part des réassureurs dans les primes
  EV13  PRODUIT    1 200 000   Produits des placements
  EV16  CHARGE     1 500 000   Variation des provisions techniques brutes
  EV17  PRODUIT      500 000   Variation de la part des cessionnaires
```

Et le cas ② lève le doute pour de bon : la même balance, une prime portée de 8 à 9 millions, rend un
solde de **1 000 000**. Le moteur suit la donnée.

**Trois choses que ce relevé prouve, et qu'aucun test unitaire ne prouvait :**

1. **AC-5, en vrai** : le modèle non applicable est servi avec ses **18 lignes**, toutes à `null` —
   *présent et vide*, jamais omis, jamais `0`.
2. **Les signes viennent des comptes, pas du code** : `EV2` et `EV11` ressortent **négatifs** parce
   que `609` est une charge créditée et `709` un produit débité. Personne ne les a posés.
3. **Le `sens` est dérivé** : `EV16` sort `CHARGE` et `EV17` `PRODUIT`, conformément aux signes
   qu'ils portent dans le solde — le correctif d'auto-revue est **vivant en production**, pas
   seulement testé.

**L'articulation de l'AC-4, recomposée depuis les quatre grandeurs publiées :**

```
soldeCompte80 = 0   resultatNetCR = 1 000 000
variationProvisionsBrutes = 1 500 000   variationPartCessionnaires = 500 000
0 == 1 000 000 − 1 500 000 + 500 000   →  True    ecart = 0    statut = OK
```

⇒ `RN` **ne vaut pas** le solde du compte 80, et la différence est **exactement** la variation de
provisions — celle que l'égalité littérale de l'AC-4 passait sous silence.

---

## ⑥⑦ Revues — quatre bloquants, aucune vulnérabilité

**Revue de sécurité : AUCUNE vulnérabilité.** Route gardée exactement comme ses cinq voisines
(comparaison ligne à ligne), bornes d'entrée déjà couvertes par `@ArrayMaxSize(5000)`, isolation
tenant étanche (`404` et non `403` sur un dossier d'une autre organisation), bascule de version
**fail-closed** sans rapprochement de version voisine, artefact toujours chargé sous vérification
sha256, aucun secret dans les 5 501 lignes du diff.

**Revue de code : quatre bloquants et sept constats.** ⛔ **Le plus grave n'était pas le mien.**

### ⛔⛔ Un commerçant togolais qualifié d'assureur-vie

`syscohada-revise@2.1` déclare **exactement les mêmes huit numéros de compte** : `601 Achats de
marchandises`, `602 Achats de matières premières`, `701 Ventes de marchandises`, `705 Travaux
facturés`… La dérivation ne regardait que le **numéro**.

| Balance d'une PME commerciale | Ce que le module publiait |
|---|---|
| `601` = 5 000 000, `701` = 9 000 000 | `agrement: VIE_CAPITALISATION` |
| la même + `602` = 1 000 000 | `agrement: INCOMPATIBLE_ART_326` |

Le second cas publie à un commerçant, mot pour mot, *« la balance décrit une entreprise que le Code
interdit »*. C'est le **renversement complet de l'AC-6** que cet état revendique.

⇒ Le correctif ne teste **pas** `meta.code === 'cima-assurances'` : il regarde si le paquet **porte
réellement les deux modèles**. Un test sur le nom cesserait de garder le jour où un référentiel se
renomme — sans rien lever.

### ⛔⛔ Les acceptations sortaient de l'état servi — et mon code contredisait ma décision

D-521-7 dit « routées dans le modèle **effectivement servi** ». Le code les routait dans le modèle
de **leur nature**. L'art. 326 al. 1 exemptant les acceptations d'agrément, une société de toute
nature porte légitimement un `604` :

```
RC1 = 5 550 000   contre   EN1 = 5 500 000
RP1 = 8 090 000   contre   EN10 = 8 000 000
articulation : ecart = −40 000, ANOMALIE  ⇐ exactement le montant perdu
```

⚡ **Et le correctif était déjà dans le Code** : l'art. 432 cite `604` dans les **deux** listes du
compte 80. Un seul modèle étant servi, les router dans les deux ne compte jamais deux fois.

### ⛔⛔ Les surcharges d'organisation, perdues

`agregerPourEtat` **déclarait** un paramètre `surcharges` que personne n'alimentait. Le compte de
résultat les honore, le compte 80 lisait la table packagée : `RC1 = 0` contre `EN1 = 5 500 000`,
écart **−5 500 000**. Deux lectures de la même balance — le défaut contre lequel le JSDoc de
`choisirPosteBilan` met explicitement en garde.

### ⛔ Mon test verrouillait le défaut

Le test de l'AC-3 exigeait que les comptes d'`EV1` et d'`EN1` soient **disjoints**. Appliquer la
lecture juste de l'art. 432 le faisait **rougir** : il refusait la correction. Et le témoin qui
aurait dû voir le défaut — « un compte d'acceptation ne prouve aucun agrément » — construisait
exactement la balance fautive et n'assertait **que** l'agrément, jamais `EN1` ni l'articulation, qui
était en `ANOMALIE` dans ce test même, en vert.

L'invariant est restaté : les **affaires directes** sont disjointes, et le recouvrement des deux
modèles est **exactement** l'ensemble des acceptations — égalité, pas inclusion.

### Les autres constats, tous corrigés

| # | Constat | Conséquence mesurée |
|---|---|---|
| N7 | un compte **ouvert mais non mouvementé** qualifiait | une balance générale exportée en entier faisait sortir un dossier régulier en `INCOMPATIBLE_ART_326` |
| N4 | le squelette annonçait **tout** en `CHARGE` | « Primes et accessoires » et « SOLDE DU COMPTE 80 » rangés au débit |
| N5 | un état `INDETERMINABLE` publiait des lignes `NON_APPLICABLE` | le lecteur des lignes conclut l'inverse de ce que l'état annonce |
| N1 | ⛔ **livrable annoncé non réalisé** | trois documents affirmaient que `RT` perdait sa réserve « hors séparation Vie/Non-Vie ». Il ne l'avait pas perdue |
| N2 | `build.mjs` promettait que « `PP1` se dérive du solde du modèle servi » | aucun chemin ne le fait |
| N3 | deux JSDoc **de plus** détachés par mes insertions | `produireLiasseComplete` et `agregerPourEtat` sans documentation |
| N6 | aucun e2e n'exerçait la route neuve | c'est **pourquoi** le défaut de mappage d'erreur était passé |
| (sécu) | la route était la seule des six sans `try/catch` | le `MONTANT_HORS_BORNES` que son propre contrat annonce en 400 sortait en **500** |

### Table de mutations de la passe de revue — 7 mutations

| # | Mutation | Mesuré |
|---|---|---|
| M12 | `EN1` reperd les acceptations vie | **3 rouges** — le balayage rougit sur `TOUTE_NATURE + 604/704` |
| M13 | les surcharges n'arrivent plus au compte 80 | **1 rouge** |
| M14 | la garde de paquet retirée | **1 rouge** — SYSCOHADA redevient qualifiable |
| M15 | le filtre des comptes non mouvementés retiré | **1 rouge** |
| M16 | la règle `PRODUIT` du squelette | ⚡ **SURVIVANTE** |
| M16 quater | le repli de `sensDe` forcé à `CHARGE` | **2 rouges** |
| M17 | le statut des lignes toujours `NON_APPLICABLE` | **1 rouge** |

⚡⚡ **La survivante est la plus instructive** : forcer `REGLE_PRODUIT` à une valeur impossible
laissait les 31 tests **verts**. La branche ne servait à rien — les opérandes signées du solde
donnent déjà le bon sens pour tout poste qui y entre. **Une mutation survivante s'est donc soldée
par du code en moins, pas par un test de plus autour de code mort.**

⚠️ **Et deux leçons de méthode, payées comptant une seconde fois** : une mutation qui ne compile pas
rend « 0 test » — ce n'est **pas** un rouge, et trois mutations ont dû être refaites en version
compilable. `git checkout --` a effacé du travail non committé **trois fois** dans cette passe.

### ④ bis — Vérification docker REJOUÉE sur l'état final

L'artefact a changé **trois fois** pendant les revues (`021992b5…` → `4ff0478b…` → `c541b92c…`). Les
mesures de la phase ④ ne valaient donc plus rien. Rejouées sur la stack, artefact servi vérifié dans
le conteneur (`sha256 = c541b92c…`) :

| Cas | Avant correctif | Après |
|---|---|---|
| toute nature **portant des acceptations vie** | `ecart = −40 000`, `ANOMALIE` | `OK`, **écart 0** |
| comptes de l'autre famille **ouverts à 0/0** | `INCOMPATIBLE_ART_326` | `VIE_CAPITALISATION`, **écart 0** |
| PME commerciale sous **plan SYSCOHADA** | `INCOMPATIBLE_ART_326` | `REFERENTIEL_SANS_COMPTE_80`, 0 compte relevé, 0 ligne, articulation `NON_APPLICABLE` |
| cas nominal vie (témoin) | `OK` | `OK` |

**Persistance rejouée** : `8 quittances | concordantes 8 | divergentes 0 | sans categorie 0`, sur
`4 contrats`, et **aucun index ne porte `categorie`** — D-521-9 bis tient toujours dans la base.

### Portes après revue

| Dépôt | lint | build | unitaires | couverture | e2e |
|---|---|---|---|---|---|
| `bilan-service` | 0 | OK | **3 093** | 99,01 / 95,08 / 99,25 / 99,08 — fichiers neufs à **100 %** de lignes | **827** |
| `balance-service` | 0 | OK | 388 (référentiel) | — | — |
| `assurance-service` | 0 | OK | 161 (référentiel) | — | — |
