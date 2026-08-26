# STORY-414 : Les types de crédits d'impôt sont validés mais jamais publiés — jumelle de STORY-397

Status: ready-for-dev

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
