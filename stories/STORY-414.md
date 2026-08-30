# STORY-414 : Les types de crédits d'impôt sont validés mais jamais publiés — jumelle de STORY-397

Status: done

**Épic :** EPIC-023 — Fiscalité (résultat fiscal, liquidation, TVA, provisions, TPU)
**Service :** `balance-service` (`:3007`) — `modules/fiscal` (liquidation)
**Points :** 2 · **Sprint :** S20
**Origine :** relevée le **2026-08-26** en construisant la maquette **FE-051**, en dessinant le
formulaire « Déclarer un crédit d'impôt ».

---

## Le fait, relevé à la source

`POST …/fiscal/credits` valide strictement le type déclaré contre les types publiés par le paquet
fiscal — décision **D-092-7**, et c'est la bonne :

```
@ApiBadRequestResponse({ description: 'TYPE_CREDIT_INCONNU | EXERCICE_INDETERMINE.' })
```

**Aucune route ne publie ces types.** `GET …/fiscal/credits` rend les crédits **déclarés**
(`CreditImpotResponseDto`), pas les types **déclarables** : le `libelle` et le `posteLiasse` n'y
apparaissent qu'**après** qu'un crédit a été créé, c'est-à-dire après avoir deviné juste.

⚠️ **Le contre-exemple est dans le même module, à un contrôleur près.** `GET …/fiscal/taxes` rend
un `RegistreTaxesResponseDto` qui publie `types[]` — code, libellé, compte comptable,
déductibilité, code de réintégration — **exactement ce qu'il faut pour construire un choix**. Deux
formulaires voisins, deux traitements opposés.

---

## Pourquoi c'est coûteux

Le formulaire « Déclarer un crédit » ne peut offrir **aucune liste**. Il ne reste qu'un champ
libre, dans lequel le comptable tape `RCM`, `RSL`, `RSH` **de mémoire** — et découvre l'invalidité
**après l'envoi**, sur un `400` qui ne dit pas ce qui aurait été admis.

Trois conséquences, par ordre de coût croissant :

1. le geste échoue et se répète ;
2. le comptable renonce et **ne déclare pas** un crédit auquel il a droit — l'impôt payé est trop
   élevé, et rien ne le signale ;
3. il déclare le crédit sous un type **admis mais faux** (`RCM` au lieu de `RSH`), qui passe la
   validation et **alimente la mauvaise case de la liasse** — `RCM` a une case (`I`), `RSH` n'en a
   pas. La grille devient fausse sans qu'aucun total ne bouge : le montant total des crédits est
   juste, sa ventilation ne l'est pas.

⚠️ Le cas 3 est le seul des trois qui soit **invisible en aval**, et c'est celui que l'absence de
liste rend le plus probable — un champ libre invite à écrire le code qu'on connaît, pas celui qui
convient.

⚡ **Troisième occurrence du même défaut** : « le serveur valide contre une liste qu'il ne publie
pas ». STORY-397 pour les codes de réintégration (relevée par FE-044), STORY-394 pour son jumeau,
celle-ci pour les types de crédits. ⇒ **Le sujet n'est plus le champ, c'est le patron** : une
validation `fail-closed` contre une liste du paquet doit s'accompagner, **dans la même story**,
de la route qui publie cette liste. À porter dans la définition de fini du module fiscal.

---

## Ce qui est demandé

1. Publier les **types de crédits d'impôt** du paquet fiscal de l'exercice, avec pour chacun :
   `code`, `libelle?`, `posteLiasse?`, `restituable?`, `source?` — c'est-à-dire le
   `TypeCreditImpot` **déjà défini** dans `types/liquidation.ts` et déjà lu par le service.
   **Rien à modéliser** : il n'y a qu'à l'exposer.
2. **Où** — au choix du back, deux options tenables :
   - dans `LiquidationResponseDto`, un champ `typesCredits[]`, comme
     `RegistreTaxesResponseDto.types[]` (l'écran charge déjà la liquidation) ;
   - ou une route dédiée `GET …/fiscal/credits/types`.

   ⇒ **Recommandation : le champ dans la liquidation.** L'écran appelle déjà cette route, la liste
   dépend du même exercice et du même paquet, et une route de plus ajoute un aller-retour et un
   quatrième chemin littéral sous un préfixe qui en compte déjà beaucoup.
   ⚠️ Si une route dédiée est retenue, `credits/types` doit être déclarée **avant**
   `credits/:id` — l'ordre inverse est invisible à la compilation comme aux tests unitaires, et le
   contrôleur le documente déjà pour les routes existantes.
3. Paquet muet ⇒ **liste vide + motif publié**, jamais un tableau vide silencieux : le formulaire
   doit pouvoir dire « aucun type n'est publié pour cet exercice » plutôt que d'afficher un choix
   sans options.
4. ⚠️ `posteLiasse` **facultatif est une information, pas un trou** : le formulaire doit pouvoir
   avertir, **à la saisie**, qu'un `RSL`/`RSH` s'imputera sans alimenter de case — l'écran le dit
   déjà après coup (`creditsHorsGrille`), il faut pouvoir le dire **avant**.

---

## Critères d'acceptation

1. Le front peut construire un choix de types **sans écrire aucun code en dur**.
2. Chaque type porte son `posteLiasse` quand le paquet en désigne un, et son absence est
   distinguable d'un `posteLiasse` non renseigné.
3. Paquet sans types ⇒ liste vide **et** motif ; le `POST` reste `fail-closed` (tout crédit refusé,
   comme aujourd'hui).
4. Test de contrat : l'ensemble des codes publiés est **exactement** celui que le `POST` accepte —
   une liste qui admettrait un code refusé, ou tairait un code admis, recréerait le défaut d'un
   cran plus loin.

---

## Dépendances

- **STORY-092** (D-092-7 : types lus du paquet) · **STORY-078** (le paquet les publie).
- **STORY-397** — jumelle, même patron, même service. **Les traiter ensemble si elles tombent dans
  le même sprint** : le correctif est le même geste appliqué à deux listes.

---

## Notes

- Créée le 2026-08-26 par la revue métier de la maquette **FE-051**, demandée par le PO.
- La maquette FE-051 **affiche l'écart à l'écran** en attendant, pour que le comptable sache que le
  champ est libre et pourquoi.

---

## Progress Tracking

**Statut : `done`** — clôturée le **2026-08-30**. PR **#72** (`balance-service`) rebase-mergée sur
`dev`, branche supprimée.
**Un seul dépôt module** : la story ne touche **pas** le paquet fiscal, donc pas d'octets, donc pas
de `dossier-service`.

### Conception

| Décision | Ce qu'elle tranche |
|---|---|
| **D-414-1** | La liste est publiée **dans `LiquidationResponseDto`** (`typesCredits[]`), comme la story le recommande : l'écran appelle déjà cette route, la liste dépend du même exercice et du même paquet, et une route dédiée ajouterait un aller-retour **et** un quatrième chemin littéral sous un préfixe qui en compte déjà beaucoup. ⇒ le piège de l'ordre des routes (`credits/types` avant `credits/:id`) ne se pose même pas. |
| **D-414-2** | ⛔ **La même valeur, pas deux extractions.** `typesCredits` est la variable `types` que le service extrait **déjà** pour valider le `POST` (`extraireTypesCreditImpot`). Deux extractions, ce serait une liste qui pourrait proposer un code refusé — le défaut d'origine reculé d'un cran, exactement ce qu'AC-4 interdit. |
| **D-414-3** | AC-2 (« l'absence de `posteLiasse` est **distinguable** d'un `posteLiasse` non renseigné ») est tenu en publiant la **note du paquet** (`noteTypesCredits`), qui **atteste** lesquels n'ont pas de case : « RSL, RSH et la retenue non-résidents n'ont pas de case dédiée dans la grille A..L ». ⛔ Dériver un booléen « sans case » de l'absence du champ aurait **inventé une certitude que le paquet ne donne pas** — c'est du fiscal déduit, ce que NFR-A06 interdit. |
| **D-414-4** | Liste vide ⇒ `motifTypesCredits: TYPES_CREDITS_NON_PACKAGES`, jamais un tableau vide muet (AC-3). Le `POST` reste **fail-closed** : tout crédit est alors refusé, comme aujourd'hui. |

### Implémentation

| Fichier | Ce qui change |
|---|---|
| `types/liquidation.ts` | `MOTIFS_TYPES_CREDITS_ABSENTS` + trois champs sur `Liquidation` |
| `liquidation.regles.ts` | `extraireNoteTypesCreditImpot` (6 lignes) ; `liquider()` publie liste, note et motif |
| `liquidation.service.ts` | passe la variable `types` **déjà extraite** — aucune seconde lecture du paquet |
| `dto/liquidation-response.dto.ts` | `TypeCreditImpotResponseDto` + `typesCredits`, `noteTypesCredits`, `motifTypesCredits` |

⛔ **Zéro changement de comportement sur le `POST`** : la validation, ses codes de refus et son
caractère fail-closed sont **intacts**. Cette story ne fait que **publier ce qui était déjà là**.

### Portes DoD

lint 0 warning · build OK · **3 276** unitaires · **817** e2e · couverture
**99,15 / 92,10 / 98,65 / 99,26**.

⚠️ Un fichier e2e a échoué **une fois** sur quatre exécutions, sans reproduction (les trois autres
passages : 817/817). Aucun lien avec le diff — aucune des routes touchées n'y figure.

### Passe de mutation — 3 mutations, 3 rouges **par assertion**

| Mutation | Effet |
|---|---|
| la liste publiée est **tronquée** (`types.slice(0, 2)`) — le scénario exact d'AC-4 | rouge : le test traverse les **deux** chemins réels (publication **et** validation), il ne compare pas une extraction à elle-même |
| le motif disparaît quand la liste est vide | rouge (AC-3) |
| la note du paquet remplacée par une chaîne **valide mais fausse** | rouge (AC-2) |

⚠️ La 3ᵉ mutation a d'abord rougi **par erreur de compilation** (import devenu inutilisé) — ce qui
ne prouve rien. Refaite en valeur *valide mais fausse* (`'note du paquet'`), elle rougit par
**assertion**.

### Vérification docker — AC-4 prouvé de bout en bout

`GET …/fiscal/liquidation` publie les **cinq** types, `RCM`→`I`, `REGIME_DEROGATOIRE`→`J`, et
`RSL`/`RSH`/`RETENUE_NON_RESIDENTS` **sans case**, avec la note qui l'atteste.

Puis, sur le **même** dossier, les six `POST …/fiscal/credits` :

| Code envoyé | HTTP |
|---|---|
| `RCM`, `REGIME_DEROGATOIRE`, `RSL`, `RSH`, `RETENUE_NON_RESIDENTS` (les 5 **publiés**) | **201** × 5 |
| `RCM_BIS` (hors liste) | **400** |

⇒ la liste publiée est **exactement** celle que le `POST` accepte : elle ne promet rien qu'elle ne
tienne, et ne tait rien qu'elle admette. `creditsHorsGrille` sort à **3 000** sur 5 000 de crédits
— les trois types sans case, cohérents avec la note publiée **avant** la saisie.

---

## Progress Tracking — clôture

**Statut : `done`** — implémentée, validée, vérifiée sur stack docker, revue (**4 constats, 3
corrigés, 1 consigné**), revue de sécurité (**0 vulnérabilité**). PR **#72** rebase-mergée sur
`dev` (2 commits).

Les 4 critères d'acceptation sont tenus.

### Revue de code — 4 constats (commit `a1cd65c`)

| Constat | Ce qu'il valait |
|---|---|
| **F-414-1 — bloquant** | trois champs neufs, **un schéma neuf** et **une énumération neuve** entraient au contrat OpenAPI **sans une seule assertion** dans le fichier qui garde ce contrat — alors que le bloc STORY-412, dans **le même fichier** et sur **le même DTO**, porte l'avertissement : `collectCoverageFrom` exclut les `*.dto.ts`, donc retirer un champ ou un `enumName` **ne fait bouger aucun chiffre de couverture**. Le client généré par `openapi-typescript` aurait perdu la liste et le formulaire serait retombé sur les codes en dur — **AC-1 défait sans qu'un test rougisse**. 3 tests ajoutés. |
| **F-414-2** | la description interdisait au front la **seule lecture machine** dont il dispose (« c'est la note qui l'atteste, jamais l'absence seule ») et contredisait le champ jumeau. Or **le moteur lui-même ne connaît que l'absence** : `creditsHorsGrille` se calcule dessus. ⇒ l'absence dit **que**, la note dit **pourquoi**, et les deux descriptions sont alignées. ⚡ Ma décision **D-414-3 était à moitié fausse** : la note atteste, mais elle ne remplace pas le signal exploitable. |
| **F-414-4** | le motif affirmait « le paquet ne publie pas la rubrique » alors qu'il est **aussi** émis quand des entrées **sans `code`** sont écartées : celui qui diagnostique serait allé chercher une rubrique **absente** au lieu d'une rubrique **malformée**. Libellé rendu neutre. |
| **F-414-3 — consigné, non corrigé** | ⛔ **La liste n'est disponible que là où la liquidation aboutit.** `GET …/fiscal/liquidation` répond **404** sans balance de base fiscale, **409** si un taux n'est pas packagé ou le CA non sourcé — alors que `POST …/fiscal/credits` fonctionne **sans aucune balance**. Sur un dossier neuf, le comptable peut donc saisir ses attestations de retenue **sans jamais obtenir la liste**, et retombe sur les codes de mémoire : le défaut que la story ferme, dans le seul état où il reste ouvert. C'est la conséquence directe de D-414-1 (l'option **recommandée par la story**) ; le refermer demande la **route dédiée** que la story écarte — à ficher si le PO le veut. |

**5 mutations au total, 5 rouges par assertion**, dont les deux qui prouvent le nouveau filet de
contrat : `enumName` retiré ⇒ 2 rouges, `type: [String]` à la place du schéma ⇒ 2 rouges.

### Revue de sécurité — 0 vulnérabilité

PR **strictement additive en lecture**, sur une donnée **non tenant** (l'artefact `pays × année`,
identique pour toutes les organisations), derrière une chaîne de guards **inchangée**.

| Piste instruite | Pourquoi elle ne tient pas |
|---|---|
| Élargissement de surface de lecture | du **droit fiscal publié**, identique pour tous ; route toujours `@Roles(TENANT_ADMIN, TENANT_USER)` + `@RequiresBalanceAccess()` + `@RequiresDossierScope()`, `orgId` du JWT. Le second consommateur (`GET …/fiscal/moteur`) porte **les mêmes** gardes. |
| Canal d'inférence sur le paquet appliqué | la **même réponse** publiait déjà `paquetFiscal: { pays, annee, checksum }` : aucun canal nouveau. |
| Pollution de prototype | **lectures** par clés **littérales** uniquement, aucune clé dynamique, aucune écriture indexée ; valeurs filtrées par `texteNonVide`. |
| Manipulation de la ventilation | `versCredit` prend `posteLiasse`/`restituable`/`libelle` **exclusivement** du type packagé et persiste `type.code`, jamais la chaîne brute du DTO. Aucun champ d'entrée neuf ⇒ aucune voie de mass-assignment. |
| Le `POST` deviendrait plus permissif | `declarerCredit` est **inchangé** — même extraction, même `typeCreditConnu`, même 400. La liste publiée **est** la valeur qui valide. |
