# STORY-522 : La classe 8 CIMA se lit par liste explicite, jamais par racine — la base imposable exactement doublée

Status: in_progress

**Complexité :** high

**Épic :** EPIC-133 — Comptes de résultat technique Vie / Non-Vie et compte non technique
**Service :** `assurance-service` + `balance-service` (`modules/fiscal`) + référentiel
**Points :** 8 · **Sprint :** S20
**Origine :** revue de l'artefact, 2026-08-27 — **AD-9** de la spine ; consolide la garde de STORY-488 AC-5.

---

## Le fait, mesuré dans l'artefact

```
racinesDeGestion: ['6', '7', '80', '82', '83', '84', '85', '86']
```

La **classe 8 du plan CIMA mêle des comptes de gestion et des comptes de REGROUPEMENT**. Un compte
de regroupement reprend, par construction, des montants déjà portés par les comptes qu'il regroupe.

⇒ Un repli générique qui balaie ces racines **compte deux fois les mêmes montants**. Le repli a déjà
été **mesuré** sur ce référentiel : la base imposable ressortait **exactement doublée**, et **aucun
contrôle ne s'en apercevait** — le calcul était juste, sa source ne l'était pas.

⚡ **C'est le meilleur avertissement de tout ce vertical, et il se généralise :** sur un référentiel
sectoriel, **un traitement générique qui « marche » est le mode de panne le plus probable**, pas le
rassurant. Rien ne refuse, rien ne déséquilibre, et le nombre est faux d'un facteur deux.

---

## Cadrage mesuré avant de coder (2026-09-21)

### M1 — ⛔⛔ Le doublement n'est pas un risque théorique : il est dans les racines PUBLIÉES

STORY-369 avait supprimé le repli générique `[6, 7, 8]`. Le paquet publie depuis ses propres racines
— et **l'une d'elles est un compte de regroupement** :

```
cima-assurances@4.0 → racinesDeGestion: ['6', '7', '80', '82', '83', '84', '85', '86']
```

**Mesuré** en rejouant `calculerResultatComptable` (`balance-service/src/modules/fiscal/fiscal.regles.ts:432-444`)
sur une balance d'après inventaire — classes 6/7 encore soldées **et** compte 80 ayant reçu le
virement de clôture :

| ligne | débit | crédit | racine qui capte |
|---|---|---|---|
| `70` primes | — | 900 000 000 | `'7'` |
| `60` prestations | 760 000 000 | — | `'6'` |
| `80` exploitation générale | — | 140 000 000 | **`'80'`** |

```
résultat RÉEL de l'exercice      : 140 000 000
avec les racines PUBLIÉES (@4.0) : 280 000 000     ⇐ facteur 2
avec 80 retiré des racines       : 140 000 000
```

⚠️ Et la sélection se fait **par préfixe** (`startsWith`), jamais par égalité : la racine `'80'`
capte aussi `801`, `8012`, `8099`.

### M2 — ⚡ Le texte tranche en une phrase, et elle est déjà dans le Code

**Article 432**, verbatim :

> « **Le solde du compte 80 est viré, pour clôture des écritures, au compte 87.** »

La chaîne est donc `classes 6/7 → compte 80 → compte 87 → compte 88 → bilan (89)`. Le compte `80`
reprend **par construction** ce que les classes 6 et 7 portent déjà — c'est **exactement** la
définition de compte de regroupement que le dépôt applique déjà pour exclure `87`, `88` et `89`.

⛔ **Et l'artefact le prouve tout seul** : aucune des 65 lignes de sa table de passage ne rattache le
compte `80` à un poste, tandis que les deux états `COMPTE_80_*` livrés par STORY-521 sont alimentés
**exclusivement** par des comptes des classes 6 et 7. Le paquet décrit `80` comme une
récapitulation, et le déclare en même temps comme une source primaire.

### M3 — ⛔⛔ Un test EXIGE aujourd'hui que `80` soit capté — et l'appelle « la gestion réelle »

`bilan-service/src/modules/bilan/referentiel/referentiels-additionnels-coherence.spec.ts:617-637` :

```ts
it('CIMA — les trois comptes de REGROUPEMENT (87/88/89) sont HORS gestion', () => {
  // …
  for (const gestion of ['80', '82', '83', '84', '85', '86']) {
    expect({ gestion, capte: racines.some((r) => gestion.startsWith(r)) })
      .toEqual({ gestion, capte: true });          // ⛔ exige que 80 soit capté
  }
});
```

C'est un **test qui verrouille le défaut** : appliquer la lecture juste de l'art. 432 le fait
rougir. ⚠️ Et son titre énumère **trois** comptes de regroupement là où le texte en fait **quatre**.

### M4 — ⚠️ La garde « permanente » de STORY-488 AC-5 ne lit PAS l'artefact

`balance-service/src/modules/fiscal/fiscal.regles.spec.ts:410-443` mesure bien « 140 M et non
280 M », mais sur une **constante locale** `GESTION_CIMA` (`:74`), pas sur les racines du paquet.
Idem `resultat-fiscal.service.spec.ts:1297-1358`, qui injecte les racines dans un mock.

⇒ **Aucune assertion métier ne garde les racines de `@4.0`**, la version que le pont sert réellement.
On pourrait y remettre `'8'` — la classe entière — sans faire rougir autre chose que les checksums.
C'est le trou que l'AC-3 doit fermer.

### M5 — ⚡ AC-4 : le défaut n'est PAS ailleurs, et c'est une réponse utile

Relevé sur les cinq paquets packagés :

| paquet | `racinesDeGestion` | compte de regroupement capté |
|---|---|---|
| `syscohada-revise@2.1` | `['6','7','8']` | **non** |
| `zone-franche-togo@1.0` | `['6','7','8']` | **non** |
| `smt-togo@1.0` | `['6','7','8']` | **non** |
| `sfd-bceao@2.0` | `['6','7']` | **non** |
| `cima-assurances@4.0` | `['6','7','80','82',…]` | ⛔ **oui — `80`** |

Les trois plans SYSCOHADA/SMT/zone franche portent la **même** classe 8, intégralement de la
gestion : `81` valeurs comptables des cessions, `82` produits des cessions, `83`→`86` HAO, `87`
participation des travailleurs, `88` subventions d'équilibre, `89` impôts sur le résultat. **Aucun
compte de regroupement**, donc `'8'` y est juste — et l'en retirer produirait un résultat *avant*
HAO et *avant* impôt (fausse réparation déjà documentée, **D-091-3**). `sfd-bceao` n'a pas de
classe 8.

⇒ **Le défaut est propre au plan CIMA**, seul plan sectoriel du dépôt et seul à mêler gestion et
regroupement dans une même classe. L'AC-4 est tenue par une mesure **négative** : elle dit où **ne
pas** aller corriger.

### M6 — ⛔ Aucun filet ne peut voir le doublement sur un dossier CIMA

`resoudreCompteResultatNet` (`fiscal.regles.ts:470-484`) rend **`null`** pour CIMA : le paquet ne
publie pas `regles.COMPTE_RESULTAT_NET`, et aucun compte de classe 1 n'a un libellé commençant par
« résultat net » (`13` = « Réserves réglementaires »). ⇒ `articulerResultat` rend
`{ applicable: false, motif: 'COMPTE_RESULTAT_NON_SOURCE' }` : **le contrôle d'écart ne s'exécute
jamais** sur un dossier CIMA. Le doublement est donc structurellement **silencieux**, ce qui est
précisément l'avertissement que la story porte.

### M7 — ⚠️ Un second défaut sur le même chemin, HORS périmètre et nommé

`85 Impôts sur les bénéfices` **est** dans `racinesDeGestion`, mais
`resoudreCompteImpotResultat` (`fiscal.regles.ts:518-530`) rend `null` pour CIMA ⇒
`chargeImpotComptabilisee = 0`. La charge d'impôt déjà comptabilisée **entre donc dans le résultat
comptable et n'est jamais reprise** avant l'assiette.

⛔ C'est un défaut **réel et distinct**, sur le même chemin que celui de cette story. Il n'est **pas**
corrigé ici — le périmètre de STORY-522 est la lecture de la classe 8, pas la reprise de l'impôt —
et il est consigné pour sa propre story.

---

## Décisions de cadrage du 2026-09-21

| # | Décision | Pourquoi |
|---|---|---|
| **D-522-1** | `cima-assurances@5.0` retire **`80`** de `racinesDeGestion`. `@1.0` à `@4.0` restent packagées et **intactes** | **Mesuré (M1/M2)**. Un chiffre déjà servi ne se réécrit pas — même faux : il se corrige par une version, comme `@2.0`, `@3.0` et `@4.0` avant elle |
| **D-522-2** | Le plan packagé gagne un marqueur **`nature: 'REGROUPEMENT'`** sur `80`, `87`, `88`, `89`, sourcé de l'art. 432 | **AC-2.** Le marqueur est **déclaré**, jamais déduit d'un numéro. Patron additif de `role?` / `tresorerie?` / `chiffreAffaires?` : spread conditionnel, vocabulaire fermé, vérifié au build ⇒ les quatre autres paquets gardent leurs octets |
| **D-522-3** | ⛔ **`build.mjs` REFUSE de packager** un paquet dont une racine de gestion capte un compte marqué `REGROUPEMENT`, **en le nommant** | **AC-1 + AC-5.** C'est la seule forme qui tienne : corriger `80` une fois laisse le défaut revenir. Une porte au build le rend **impossible à empaqueter**, et vaut pour tout référentiel futur |
| **D-522-4** | La garde permanente **lit l'artefact**, plus une constante locale | **Mesuré (M4)** : la garde de 488/AC-5 mesurait une constante du fichier de test. Une garde qui ne lit pas ce qu'elle prétend garder ne garde rien |
| **D-522-5** | Le test de `referentiels-additionnels-coherence.spec.ts:617` est **retourné**, avec sa justification | **Mesuré (M3)** : il verrouille le défaut et appelle `80` « la gestion réelle ». Son titre passe de trois à **quatre** comptes de regroupement |
| **D-522-6** | ⛔ **La reprise de l'impôt (M7) et l'absence de contrôle d'articulation (M6) ne sont PAS corrigées ici** — elles sont nommées et consignées | Périmètre. Les deux méritent leur story ; les traiter au passage mélangerait trois corrections dans une mesure |


## Critères d'acceptation

- [x] AC-1 — Toute lecture de la classe 8 passe par une **liste explicite de comptes**, jamais par
      une racine. `racinesDeGestion` cesse de porter des racines de classe 8 en bloc.
- [x] AC-2 — Les comptes de **regroupement** sont **identifiés et marqués** dans le plan packagé,
      depuis l'article 431 — pas déduits de leur numéro.
- [x] AC-3 — ⛔ **Test de régression permanent, et c'est LE test :** un jeu de balance CIMA où la
      classe 8 est renseignée doit produire une base imposable **simple**. Remettre la racine `80`
      dans `racinesDeGestion` doit faire **doubler le résultat et virer le test au rouge** — sinon
      la garde ne garde rien.
- [x] AC-4 — ⚡ **Tenue par une mesure NÉGATIVE** (M5) : les quatre autres référentiels sont sains,
      leur classe 8 étant intégralement de la gestion. Le défaut est **propre à CIMA**.
      La même vérification est faite pour **les trois autres référentiels** : le repli
      générique est **partagé**, et le défaut est un défaut de repli, pas de CIMA. Le trouver
      ailleurs serait le résultat le plus utile de la story.
- [x] AC-5 — Le repli, quand il ne sait pas décider, **refuse plutôt que de deviner** et nomme le
      compte en cause. Une base imposable calculée sur une source douteuse est pire qu'une erreur
      déclarée.

## Notes

- Consolide [[STORY-488]] AC-5, qui posait la garde ; celle-ci la rend explicite et la généralise.
- Voir spine AD-9, `analyse-referentiels-sfd-zonefranche-cima-2026-07-21.md` §3.

## Progress Tracking

**Statut : `in_progress` le 2026-09-22.** Cinq dépôts branchés `MNV-522` **avant la première ligne de
code** — `bilan-service`, `assurance-service`, `balance-service`, `platform-catalog-service`, `docs`.

### Ce qui est livré

**`bilan-service`** — `cima-assurances@5.0` (`5234764a…`) :
- sources `plan-comptable-cima-v5.json` (le marqueur), `postes-cima-v5.json`,
  `table-de-passage-cima-v5.json` (les racines perdent `80`), entrée `@5.0` dans `build.mjs` ;
- ⛔ **`nature: 'REGROUPEMENT'`** sur `80`, `87`, `88`, `89`, en **spread conditionnel** et
  **vocabulaire fermé** — les quatre autres paquets gardent leurs octets à l'identique, vérifié ;
- ⛔⛔ **`exigerRacinesSansRegroupement`** : le générateur **refuse d'empaqueter** un référentiel
  dont une racine capte un compte marqué, **en le nommant** ;
- `CompteReferentiel.nature?` au contrat, `NatureCompte` au vocabulaire ;
- la garde de `referentiels-additionnels-coherence.spec.ts` **retournée** et **dérivée du marqueur**.

**`balance-service`** — la garde permanente de l'AC-3 **lit l'artefact** ; registre, `PONT_TAG` et
digests basculés.
**`assurance-service`**, **`platform-catalog-service`** — artefact recopié byte-identique, version
servie, snapshot et pack.

### ⛔ Ce que la garde disait, et qui était faux

`referentiels-additionnels-coherence.spec.ts:617` affirmait :

```ts
it('CIMA — les trois comptes de REGROUPEMENT (87/88/89) sont HORS gestion', () => {
  // …et la gestion réelle de la même classe, elle, est bien captée.
  for (const gestion of ['80', '82', '83', '84', '85', '86']) { … capte: true }
});
```

Elle **exigeait** que `80` soit capté et l'appelait « la gestion réelle » : appliquer la lecture
juste de l'art. 432 la faisait **rougir**. Son titre annonçait **trois** comptes de regroupement là
où le texte en fait **quatre**. C'est le **troisième test qui verrouille un défaut** rencontré dans
ce dépôt.

⇒ La règle n'est plus **écrite** : elle est **dérivée du marqueur** que le plan déclare, exactement
comme la porte du générateur. Elle vaut pour tout référentiel, présent et futur, sans que personne
ait à s'en souvenir.

### ⚠️ Deux trous de garde comblés au passage

1. **`@4.0` était absente** de la liste `ARTEFACTS` de cette même suite : la version que le pont
   servait réellement n'était gardée par **aucune** assertion métier. On pouvait y remettre `'8'` —
   la classe entière — sans faire rougir autre chose que les checksums.
2. **La garde « permanente » de STORY-488 AC-5 mesurait une constante locale** (`GESTION_CIMA`,
   `fiscal.regles.spec.ts:74`), pas l'artefact. Et **aucun de ses tests ne mettait un compte `80`
   dans la balance** — ils portaient le résultat récapitulé sur `88`, un compte déjà exclu. C'est
   exactement pourquoi le défaut a survécu.

### Table de mutations

| # | Mutation | Mesuré |
|---|---|---|
| M1 | on remet `80` dans les racines de la **source** `v5` | ⛔ **le build ÉCHOUE**, en nommant `80 « Exploitation générale »` |
| M2 | on remet `80` dans les racines de l'**artefact servi** | **3 rouges** dans `fiscal.regles.spec.ts` — dont le témoin des racines |

## ⑥⑦ Revues — six constats, aucune vulnérabilité

**Revue de sécurité : AUCUNE vulnérabilité applicative.** Pas de route, pas de changement d'authZ,
pas d'entrée utilisateur, pas de secret, isolation tenant intacte. Le relecteur a **rejoué le
générateur en bac à sable** : les dix artefacts ressortent **octet pour octet identiques** à ceux du
dépôt — le spread conditionnel de `nature` fait ce qu'il annonce. Bascule de version **fail-closed**.

**Revue de code : six constats**, tous réels, tous corrigés. Trois touchaient au cœur de la story.

### ⛔⛔ C1 — la porte ne survivait pas à une version future

`exigerRacinesSansRegroupement` ne filtre que les comptes **déjà marqués** : un plan qui n'en
déclare aucun la rend vraie **à vide**. Rien n'obligeait une version ultérieure du même code à
conserver les marqueurs de la précédente ⇒ **l'affirmation centrale de la story ne tenait pas.**

⚡ Le scénario est nommé dans la mise en garde de `@5.0` elle-même : **STORY-671** re-transcrit
l'art. 431 depuis le texte officiel, produit un `plan-comptable-cima-v6.json` sans re-poser
`nature: 'REGROUPEMENT'`, reprend les racines de `@4.0` — et **tout serait vert**, la garde dérivée
passant à vide et son témoin ne lisant que `@5.0`.

⇒ `exigerMarqueursMonotones` : tout numéro marqué par une version antérieure du **même code** doit
l'être encore s'il figure au plan. Le retirer **sciemment** reste possible — il faut retirer le
compte du plan, ce qui se voit.

### ⛔ C2 — ma garde AC-3 lisait un nom de fichier, pas ce que le pont sert

Elle nommait `'cima-assurances-5.0.json'` **en dur**. Le jour où `PONT_TAG.CIMA` passe à la version
suivante, elle continuerait de mesurer un fichier **gelé pour toujours**, donc structurellement
incapable de régresser — pendant que la version servie pourrait republier `['6','7','8']` sans rien
faire rougir. **C'était le défaut que la story corrige, déplacé d'une constante vers un nom de
fichier.** Elle dérive désormais du pont, avec un témoin qui vérifie la liaison.

### ⛔ C3 — la documentation qui aurait survécu à sa propre correction

**Huit endroits** affirmaient encore que `80` est « de la gestion réelle » et qu'il n'y a que
**trois** comptes de regroupement — dont la documentation **normative** de `racinesDeGestion`
(`balance-service/src/modules/referentiel/types/referentiel-package.ts`). Un futur auteur de plan
sectoriel l'aurait ouverte, y aurait lu le modèle, et aurait déclaré son propre compte de
regroupement en gestion.

### Les trois autres

| # | Constat | Conséquence |
|---|---|---|
| C4 | **quatre JSDoc détachés** par mes insertions, dont un en production | `calculerResultatComptable` perdait l'avertissement « le nettage par ligne est obligatoire » — un refactor l'aurait doublée |
| C5 | la prose de bascule disait encore `@4.0` **là où le code dit à l'exploitant d'aller lire** | l'octroi se rejoue à la main : il aurait ré-octroyé `@4.0`, et le vertical entier serait resté fermé (403/409) |
| C6 | `bundled-artifact-source.spec.ts` sans son cas `@5.0` | le seul test prouvant que la source embarquée récupère les octets visait une version que personne ne sert |

### ⚠️ Et deux erreurs de ma part, attrapées en chemin

1. **Ma première mutation de la monotonie était VIDE.** `@5.0` est la première version à poser des
   marqueurs : il n'y avait rien à comparer, et « 0 erreur » n'était **pas** une détection. Refaite
   en marquant `87` dans `@4.0` puis en l'oubliant dans `@5.0`, elle lève bien, en nommant le compte.
2. ⛔ **Ma correction de prose par expression régulière a renommé une CLÉ du registre.** `re.sub` sur
   `cima-assurances@4.0` a frappé la clé du manifeste, pas seulement un commentaire : deux clés
   `@5.0`, plus de `@4.0`. **Attrapée par la garde des empreintes**, restaurée, et les cinq couples
   clé/locator sont désormais contrôlés un par un.

### ⚡ Un refus de plus, né de la revue de sécurité

Signalé comme « risque résiduel à arbitrer », retenu : depuis que `80` sort des racines, une balance
**déjà clôturée** rend un résultat comptable de **zéro** — donc une base imposable nulle, sans
qu'aucun contrôle ne s'en aperçoive. `BalanceDejaRegroupeeException` **refuse et nomme le compte**.
La condition est volontairement **étroite** : un exercice dont les produits égalent exactement les
charges ne déclenche rien, et c'est testé.

⚡ **Et une garde du dépôt l'a complété toute seule** : un test énumère **tous** les codes de refus
fiscaux et exige que chacun soit **publié au contrat OpenAPI**. Le mien ne l'était pas — la DoD
« endpoints documentés dans Swagger », rendue mécanique.

### Table de mutations — 4 mutations

| # | Mutation | Mesuré |
|---|---|---|
| M1 | `80` remis dans les racines de la **source** | ⛔ le **build échoue**, en nommant `80 « Exploitation générale »` |
| M2 | `80` remis dans les racines de l'**artefact servi** | **3 rouges** dans `fiscal.regles.spec.ts` |
| M3 | une racine **descendante** (`801`) | ⛔ le **build échoue** — la comparaison va dans les deux sens |
| M4 | `@4.0` marque `87`, `@5.0` l'oublie | ⛔ le **build échoue** : « marqueur REGROUPEMENT PERDU sur 87 » |

### Portes finales

| Dépôt | lint | build | unitaires | e2e |
|---|---|---|---|---|
| `bilan-service` | 0 | OK | **3 127** | **827** |
| `balance-service` | 0 | OK | **4 193** | **1 078** |
| `assurance-service` | 0 | OK | **2 015** | **202** |
| `platform-catalog-service` | 0 | OK | **740** | **200** |

### ⚠️ Vérification docker — NON APPLICABLE, et pourquoi

**Cette story n'écrit rien en base** : elle change un paquet de référentiel et un calcul en lecture
seule. La règle du projet vise les stories qui **persistent**.

⚠️ Une vérification **fonctionnelle** sur stack réelle aurait tout de même eu de la valeur. Elle n'a
pas pu être faite : le **démon docker est tombé** en fin de flux (500 sur toutes ses routes API).
⛔ Il n'a **pas** été redémarré : cette machine héberge sept conteneurs étrangers au projet, qu'un
redémarrage aurait tués. Le dire plutôt que de prétendre la vérification faite.

⇒ Ce que couvre à sa place la garde de l'AC-3 : elle lit l'**artefact réellement servi**, résolu par
le pont, et mesure le calcul dessus. C'est la même chaîne, sans le réseau.
