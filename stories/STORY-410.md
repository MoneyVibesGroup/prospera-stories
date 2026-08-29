# STORY-410 : un compte de microfinance n'a pas de canal — déclaré en « Banque », il hérite du compte comptable de la banque

Status: done
**Service :** `balance-service` (`:3007`) · **Module :** `tresorerie`
**Points :** 3 · **Sprint :** S20 · **Epic :** EPIC-022 · **Complexité :** medium
**Origine :** constat PO du 2026-08-25, à la revue de la maquette **FE-049** — « …et différents
comptes microfinance et autres ».

---

## Le constat, relevé à la source

Le canal d'un compte de trésorerie est fermé à **trois** valeurs :

```ts
// balance-service/src/modules/tresorerie/types/tresorerie.ts
export const TYPES_COMPTE_TRESORERIE = ['BANQUE', 'MOBILE_MONEY', 'CAISSE'] as const;
```

Un compte ouvert dans une **institution de microfinance** (SFD au sens BCEAO) n'y figure pas. Le
comptable n'a donc qu'une issue : le déclarer en `BANQUE`.

## Pourquoi ce n'est pas qu'une étiquette

Le premier effet est visible et bénin : l'écran affiche « Banque » sur un compte qui n'en est pas
une. **Le second ne se voit pas**, et c'est lui qui compte.

Le **compte comptable par défaut** d'un compte de trésorerie n'est pas saisi : il est **relu du
paramétrage de ventilation**, indexé **par canal** —

```ts
export const CLE_VENTILATION_PAR_TYPE = {
  BANQUE: 'banque', MOBILE_MONEY: 'mobileMoney', CAISSE: 'caisse',
} as const satisfies Record<TypeCompteTresorerie, string>;
```

⇒ un compte SFD déclaré en `BANQUE` hérite du **compte de banque** de la ventilation, et
`compteComptableParDefaut: true` — donc il **suivra silencieusement** toute correction future de ce
paramétrage. Sur un dossier dont le référentiel est `sfd-bceao@2.0`, ce n'est pas le même plan de
comptes que `syscohada-revise@2.1` : le défaut hérité peut être un compte qui **n'existe pas** dans
le plan du dossier, ou qui y désigne autre chose.

⚠️ **Et le rattachement est la donnée dont FE-049 a montré qu'elle décide de tout** : c'est lui qui
rend l'état de rapprochement lisible ou qui fond plusieurs comptes dans une racine. Un défaut
hérité du mauvais canal se propage donc jusqu'à l'état signé.

## Le contexte métier qui le rend courant

La microfinance n'est pas un cas marginal ici : **`sfd-bceao@2.0` est un référentiel packagé** de
`balance-service`, et l'assistant de création de dossier propose « Microfinance (SFD) » comme type
de client. La plateforme sait donc parfaitement qu'une IMF est un client — mais pas qu'une **PME
peut détenir un compte chez une IMF**, ce qui est le cas ordinaire d'un commerçant qui épargne
dans une mutuelle plutôt qu'en banque.

## Ce qui est demandé

1. Ajouter `MICROFINANCE` à `TYPES_COMPTE_TRESORERIE`.
2. Lui donner **sa** clé de ventilation (`microfinance`), et le paramétrage qui va avec — sans
   quoi l'ajout du canal déplacerait simplement le défaut au lieu de le corriger.
3. ⚠️ **Le canal est immuable après import** (le service l'interdit déjà, à raison : le basculer
   sous des lignes existantes les réécrirait rétroactivement). ⇒ prévoir **comment les comptes
   SFD déjà déclarés en `BANQUE`** rejoignent le bon canal — migration nommée, ou acceptation
   écrite qu'ils y restent.
4. L'enum sort à l'OpenAPI : le client doit **casser à la compilation** si une valeur s'ajoute
   (règle de STORY-375), pas l'ignorer en silence.

## Conception — écrite AVANT le code

### D-410-1 — `MICROFINANCE` est un **canal**, jamais un moyen de paiement

L'ajout se fait dans `TYPES_COMPTE_TRESORERIE` **seulement**. `MOYENS_PAIEMENT`
(`ESPECES | BANQUE | MOBILE_MONEY`, côté cahiers) reste à trois valeurs : l'ouvrir toucherait les
deux cahiers, leurs DTO, la ventilation et l'OCR — hors périmètre — et n'apporterait rien ici. Le
canal décrit **où l'argent est déposé** (un compte de trésorerie) ; le moyen de paiement décrit
**comment une transaction a circulé** (une ligne de cahier). Les deux ne se recouvrent pas.

### D-410-2 — sa clé de ventilation est `microfinance`, son défaut `538`

Sourcé, pas deviné : SYSCOHADA révisé, racine **`53` Établissements financiers et assimilés**,
sous-compte **`538` Autres organismes financiers**. Un SFD au sens BCEAO n'est pas une banque
(`52`) — c'est précisément la distinction que `53` porte.

⚠️ **Le choix du numéro n'est pas cosmétique.** `ComptesVentilationService.validerTous` valide
**tous** les comptes effectifs — les défauts compris — contre le plan du dossier avant chaque
agrégation. Un défaut non rattachable ferait échouer l'agrégation de **tous** les dossiers, y
compris ceux qui n'ont aucun compte microfinance. `538` franchit `estCompteRattachable` (le plan
packagé déclare la racine `53`), fait 3 caractères comme les six autres défauts, et reste sous
`longueurCompteDetail = 6`. La table de passage rattache déjà `53` au poste **`BS`** du bilan
(« Banques, chèques postaux, caisse », trésorerie **ACTIF**) : le nouveau défaut atterrit au bon
endroit de la liasse sans qu'aucun état ne bouge.

### D-410-3 — un canal sans moyen de paiement compatible serait **muet**, pas neutre

`MOYEN_PAR_CANAL` (`Record<TypeCompteTresorerie, MoyenPaiement>`, D-090-2) **casse à la
compilation** dès l'ajout de la valeur — c'est le garde-fou qui impose de trancher, et la réponse
est `MICROFINANCE → 'BANQUE'`.

Ce n'est pas un pis-aller. Le comptable qui paie depuis son compte SFD saisit `BANQUE` dans son
cahier : c'est la seule valeur que D-410-1 lui laisse. Mapper le canal sur autre chose — ou ne pas
le mapper — rendrait **toute** ligne portant un moyen de paiement incompatible avec un relevé
microfinance : le rapprochement automatique ne proposerait plus rien, sans erreur ni message. Un
appariement muet est pire qu'un appariement large : l'écart se voit, le silence non.

### D-410-4 — les comptes SFD déjà déclarés en `BANQUE` y restent (acceptation écrite)

Point 3 de la story, tranché : **aucune migration**. Trois raisons, dans cet ordre :

1. **Rien en base ne permet de les reconnaître.** Le seul indice serait le `libelle`, du texte
   libre. Une migration serait une devinette sur une chaîne — exactement ce qui déplacerait
   silencieusement la nature comptable d'un compte que personne n'a demandé à déplacer.
2. **Le canal est immuable après import, à raison** (`ModifierCompteTresorerieDto`) : le basculer
   sous des lignes déjà importées réinterpréterait rétroactivement des flux passés.
3. **Ne rien faire ne dégrade rien.** Un compte SFD resté en `BANQUE` garde le défaut `banque`
   (`521`) — l'état exact d'avant cette story. Elle n'aggrave pas la situation existante : elle
   ouvre le bon canal pour ce qui sera déclaré ensuite.

Le chemin de reprise existe et est **explicite** : le comptable pose un `compteComptable` sur le
compte (surcharge, toujours modifiable), ou déclare un nouveau compte au bon canal. ⇒ **AC-2 est
satisfait par construction** : rien ne bouge de soi-même.

### Périmètre — ce que cette story ne fait pas

- **Aucune valeur au-delà de `MICROFINANCE`** (« et autres » : cf. *Notes*).
- **`MOYENS_PAIEMENT` intouché** (D-410-1).
- **Aucune correction du fait que les défauts SYSCOHADA sont sémantiquement faux sur un dossier
  `sfd-bceao@2.0`** — `521`, `551`, `571` y existent tous les trois et y désignent autre chose
  (« Provisions pour risques… », « Primes liées au capital », « Capital »). Le nouveau défaut
  `538` n'échappe pas à la règle. C'est un défaut **préexistant**, qui vise tous les canaux à la
  fois, et qui appelle des défauts *par référentiel* : un autre sujet, une autre story.
- **Aucune migration de données** (D-410-4).

## Critères d'acceptation

1. Un compte se déclare en `MICROFINANCE` ; son compte comptable par défaut vient de **sa** clé.
2. Les comptes existants en `BANQUE` ne changent pas d'eux-mêmes.
3. Le front affiche le nouveau canal sans modification de code au-delà des libellés — la garde
   d'exhaustivité (`Record<CanalTresorerie, …>`) le force déjà.
4. Tests : le défaut de ventilation d'un compte `MICROFINANCE` **n'est pas** celui de `BANQUE`.

## Notes

⚠️ **« et autres » est resté hors périmètre, délibérément.** Le PO a dit « différents comptes
microfinance **et autres** ». Ouvrir le canal à une liste extensible (coopérative, caisse
d'épargne postale, compte de monnaie électronique non bancaire…) est un autre sujet : chaque
valeur exige **sa** clé de ventilation et donc **son** paramétrage. Cette story ajoute le canal
que le produit connaît déjà par ailleurs (un référentiel SFD packagé, un type de dossier
« Microfinance ») ; les suivants se décideront un par un, pas par un champ libre.

---

## Progress Tracking

**Statut : `in_progress`** — branche `MNV-410` (`docs/` et `balance-service`), ouverte le 2026-08-29.

### Conception (fait)

D-410-1 à D-410-4 écrites **avant** la première ligne de code, ci-dessus. Les deux points qui ont
demandé une vérification plutôt qu'une intuition :

- le numéro de compte par défaut (`538`) a été **sourcé** sur la nomenclature SYSCOHADA révisé
  (racine `53` → `538 Autres organismes financiers`), puis **confronté au plan packagé du service**
  (`estCompteRattachable` sur la racine `53`, `longueurCompteDetail = 6`) — parce que
  `validerTous` fait passer **les défauts eux-mêmes** devant le plan à chaque agrégation ;
- `MOYEN_PAR_CANAL` est un `satisfies Record<TypeCompteTresorerie, MoyenPaiement>` : il **casse à
  la compilation**, ce qui est exactement le mécanisme voulu par le point 4 de la story.

### Implémentation (fait) — commit `ca4aa43`

| Fichier | Ce qui change |
|---|---|
| `tresorerie/types/tresorerie.ts` | `MICROFINANCE` dans l'énumération + sa clé `microfinance` |
| `cahiers/agregation/types/ventilation.ts` | `ComptesVentilation.microfinance`, défaut `538` |
| `agregation/schemas/comptes-ventilation.schema.ts` | `@Prop() microfinance?` |
| `agregation/dto/agregation.dto.ts` | la clé au corps du PUT **et** à la réponse |
| `rapprochement/types/rapprochement.ts` | `MOYEN_PAR_CANAL.MICROFINANCE = 'BANQUE'` (D-410-3) |
| `tresorerie/dto/*.ts` | `enumName: 'CanalTresorerie'` aux **trois** sites (point 4) |

Le `Record<TypeCompteTresorerie, MoyenPaiement>` a bien **cassé à la compilation** à l'ajout de la
valeur — le mécanisme que le point 4 de la story attendait a fonctionné.

### Portes DoD

Lint **0 warning** · build OK · **3 223** unitaires verts · **809** e2e verts · couverture globale
**99,14 / 92,02 / 98,64 / 99,25** (seuils 65/90/90/90), `modules/tresorerie/types` à 100 %.

### Passe de mutation — 4 mutations, 4 rouges, aucune par erreur de compilation

| Mutation | Test qui vire au rouge |
|---|---|
| `MICROFINANCE: 'banque'` dans `CLE_VENTILATION_PAR_TYPE` | `AC-1/AC-4 — prend SA clé, jamais celle de la banque` |
| `microfinance: '999'` (défaut hors plan) | `les défauts sont des comptes de DÉTAIL du plan SYSCOHADA livré` |
| `MOYEN_PAR_CANAL.MICROFINANCE = 'ESPECES'` | `un relevé MICROFINANCE apparie les lignes saisies « BANQUE »` |
| `enumName` retiré de `CreerCompteTresorerieDto` | `le compte de trésorerie la publie en LECTURE, l'accepte en ÉCRITURE et en FILTRE` |

⚠️ La première est celle qui compte : `Record<…, string>` accepte `'banque'` **sans broncher** — le
compilateur ne dit rien, seul le test parle. Une mutation rouge par erreur de compilation n'aurait
rien prouvé (leçon STORY-411/179).

### Vérification docker — stack neuve (`down -v`), parcours HTTP réel

Organisation `6a93…4cca`, dossier `6a93…4ccf`, référentiel `syscohada-revise@2.1`. Service
redémarré sur la branche (`Found 0 errors. Watching for file changes.` compté **avant** toute
mesure).

**① Le canal existe, et il prend SA contrepartie (AC-1)**

| Appel | HTTP | Résultat |
|---|---|---|
| `POST` compte `MICROFINANCE` | **201** | `compteComptable: "538"`, `compteComptableParDefaut: true` |
| `POST` compte `BANQUE` | **201** | `compteComptable: "521"` — **inchangé** (AC-2) |
| `POST` compte `COOPERATIVE` | **400** | `type must be one of … BANQUE, MOBILE_MONEY, CAISSE, MICROFINANCE` |
| `GET ?type=MICROFINANCE` | **200** | le filtre reconnaît le canal neuf |

**② Le paramétrage est bien LE SIEN, et il est relu (D-089-4)**

| Appel | HTTP | Résultat |
|---|---|---|
| `GET comptes-ventilation` (aucune surcharge) | **200** | `"microfinance":"538"` publié à côté des 7 autres |
| `PUT { "microfinance": "5381" }` | **200** | la clé est acceptée par la whitelist stricte |
| `GET` des comptes après la surcharge | **200** | `MICROFINANCE → 5381`, **`BANQUE → 521` immobile** |
| `PUT { "microfinance": "999" }` | **400** | `COMPTE_VENTILATION_INCONNU`, le compte et le référentiel nommés |
| `PATCH { "type": "BANQUE" }` sur le compte SFD | **400** | `property type should not exist` — canal immuable (D-410-4) |

**③ En base — ce que les e2e ne peuvent pas prouver**

```
comptes_tresorerie  : 2 documents, 0 sans dossierId,
                      0 document portant un `compteComptable` FIGÉ
                      { type: 'MICROFINANCE', libelle: 'FUCEC — compte mutuelle' }
comptes_ventilation : 1 document, portant `microfinance: '5381'` — et RIEN d'autre
                      (les 7 défauts ne sont pas recopiés)
```

⚡ Les deux compteurs à `0` sont l'essentiel : le compte de microfinance **ne fige pas** son défaut
en base, donc il suivra une correction du paramétrage — et le paramétrage **ne recopie pas** les
défauts, donc il suivra une correction du plan. Le canal neuf hérite des deux garanties de la
story d'origine, sans en affaiblir aucune.

Aucune écriture multi-documents n'est introduite par cette story (un compte = un document, un
paramétrage = un document upserté) : il n'y a pas de transaction à prouver ici.

Stack arrêtée (`docker compose stop`).

### ⛔ Constat relevé au passage — HORS PÉRIMÈTRE, non corrigé

Le défaut `fournisseurs: '401'` **n'est rattachable à aucune racine du plan `sfd-bceao@2.0`** (le
RCSFD n'a pas de racine de classe 4 sous `41`). Or `agregation.service.ts:143` appelle
`validerTous` avant chaque agrégation ⇒ sur un dossier au référentiel SFD, l'agrégation des
cahiers échoue en `COMPTE_VENTILATION_INCONNU`. C'est **antérieur à cette story** et vise un autre
canal ; le corriger demande des défauts **par référentiel**, ce que le périmètre exclut
explicitement. Signalé pour arbitrage PO.

---

## Revue de code — 3 constats, 3 corrigés, dont **1 bloquant** (commit `b709ce7`)

### ⚡⚡ BLOQUANT — le canal neuf **dégradait** la lecture du rapprochement (D-410-5)

`MICROFINANCE` est le **premier** canal sans moyen de paiement correspondant (D-410-1 :
`MOYENS_PAIEMENT` reste à trois valeurs). Conséquence que la conception avait manquée : un cahier
payé depuis un compte SFD se saisit en `BANQUE`, la ventilation impute donc `banque` (`521`), et la
balance **ne porte jamais** `538`. `apparierCompteBalance('538', …)` ne retenait alors aucune ligne
⇒ `nbComptes = 0` ⇒ `soldeComptable = 0`.

Et **aucun** des deux avertissements existants ne pouvait le voir : `nbComptes > 1` est faux à zéro,
`cumulNonVentilable` aussi. L'écran publiait un écart égal à la **totalité** du solde du relevé, en
le présentant comme une donnée comptable — le **quatrième** zéro faussement comptable de ce même
calcul, après ceux de STORY-147, 172 et 370. ⛔ Le même compte déclaré en `BANQUE` — le
contournement d'**avant** la story — s'appariait, lui.

**Correctif (D-410-5)** : un avertissement quand la balance est **présente** et qu'aucune ligne
n'apparie le compte déclaré. Le `0` reste publié — c'est le seul chiffre honnête — mais il cesse de
se taire. Jamais un refus. La garde est **générique** : elle couvre aussi un `compteComptable`
saisi à côté du plan de saisie, quel que soit le canal.

### NON-BLOQUANT — le test qui disait « et en FILTRE » ne gardait pas le filtre

`ListerComptesTresorerieQueryDto` n'est pas un schéma de `components` : c'est un **paramètre de
requête**, invisible aux deux assertions du test. Mutation prouvée par la revue : retirer son
`enumName` laissait les 53 tests du fichier **au vert**. Le test lit désormais
`paths[…].get.parameters`.

### NON-BLOQUANT — la garde neuve annonçait une portée qu'elle n'avait pas

Le docblock disait « tous les dossiers du référentiel » alors que le balayage ne charge que
`syscohada-revise@2.1`. La portée est maintenant **écrite avec sa raison** — sur `sfd-bceao@2.0` le
défaut *antérieur* `fournisseurs: '401'` n'est rattachable à aucune racine — et le défaut que
**cette** story ajoute (`538`) est vérifié sur les **trois** référentiels packagés.

### Écartés par la revue, à raison

`538` sémantiquement faux sur un dossier SFD (exclu nommément du périmètre, comme `521`/`551`/`571`)
· `fournisseurs: '401'` cassant l'agrégation SFD (antérieur, signalé pour arbitrage PO) ·
`MOYEN_PAR_CANAL.MICROFINANCE = 'BANQUE'` (D-410-3, écrite avant le code).

## Revue de sécurité — **0 vulnérabilité** (confiance ≥ 80)

Les quatre pistes instruites, toutes écartées avec leur raison :

| Piste | Pourquoi elle ne tient pas |
|---|---|
| Injection NoSQL / pollution de prototype par la clé `microfinance` du PUT | la clé itérée vient de `CLES_COMPTES_VENTILATION` (liste **fermée** de 8 littéraux), jamais des clés du corps ; `whitelist` + `forbidNonWhitelisted` refusent en 400 en amont ; la valeur n'atterrit qu'en **valeur** d'un `$set`, jamais en clé ni en filtre |
| Une valeur d'enum en plus contournant une garde ailleurs | les deux seules tables indexées par canal sont des `satisfies Record<TypeCompteTresorerie, …>` — un `Record` partiel est **impossible** ; aucun `switch` sur le canal ; aucune garde d'autorisation ni d'entitlement n'est indexée par canal |
| Fuite inter-tenant / XSS par l'avertissement neuf | `compte` vient de `trouver(user, dossier, id)` — org du JWT, dossier du param gardé, **404** hors portée ; et `compteComptable` était **déjà publié en clair** dans la réponse : l'avertissement n'ajoute aucune information |
| Intégrité comptable de `MICROFINANCE → BANQUE` | `canalCompatible` est un filtre **restrictif** sur un vivier déjà scopé ; le vivier exclut les lignes engagées et justifiées ; l'appariement manuel refait le contrôle et l'index unique partiel reste le filet (409) |

## Vérification docker REJOUÉE sur l'état final — le correctif D-410-5, en vrai

Service recompilé sur le commit de revue (`Found 0 errors.` horodaté **après** le correctif), même
organisation et même dossier. Balance posée sur l'exercice portant `521100` et `701000` — **aucune
ligne `53x`**.

| Compte interrogé | `nbComptesApparies` | `soldeComptable` | Avertissement |
|---|---|---|---|
| **MICROFINANCE** (`5381`) | **0** | `0` | **présent**, nommant `5381` et disant que ce `0` n'est pas un solde à zéro |
| **BANQUE** (`521`) | 1 | `122 500 000` | **aucun** — pas de bruit permanent |

⚡ C'est la **contre-épreuve sur les mêmes données** qui compte : le même appel, la même balance, et
seul le compte qui n'y figure pas déclenche le mot. Sans le correctif, la première ligne aurait
publié `0` et un écart plein, en silence.

Stack arrêtée (`docker compose stop`).

## Progress Tracking — clôture

**Statut : `done`** — implémentée, validée, vérifiée sur stack docker neuve, revue (3 constats, 3
corrigés, dont 1 bloquant), revue de sécurité (0 vulnérabilité), puis **re-vérifiée en docker sur
l'état final**. PR **#68** rebase-mergée sur `dev` (2 commits), branche supprimée.

Les 4 critères d'acceptation sont tenus : **AC-1** (le canal prend sa clé, `538`), **AC-2** (les
comptes restés en `BANQUE` ne bougent pas d'eux-mêmes), **AC-3** (l'énumération sort **nommée**,
`CanalTresorerie`, aux trois sites — écriture, lecture, filtre), **AC-4** (le défaut d'un compte
`MICROFINANCE` n'est pas celui de `BANQUE`, prouvé en unitaire, en e2e et en docker).

⛔ **Hors périmètre, signalé pour arbitrage PO** : le défaut `fournisseurs: '401'` n'est rattachable
à aucune racine de `sfd-bceao@2.0` ⇒ sur un dossier au référentiel SFD, l'agrégation des cahiers
échoue en `COMPTE_VENTILATION_INCONNU`. Antérieur à cette story, il appelle des défauts **par
référentiel** — un sujet à lui seul.
