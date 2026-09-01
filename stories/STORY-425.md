# STORY-425 : Une opération porte deux comptes — le contrat n'en publie qu'un, et le client doit refaire la règle

Status: done

**Épic :** EPIC-020 — Cahiers & rattachement (Atelier Balance)
**Service :** `balance-service` (`:3007`) — `modules/cahiers`, `modules/cahiers/agregation`
**Points :** 5 · **Sprint :** S20
**Origine :** **retour direct d'un expert-comptable**, transmis par le PO le **2026-08-26** : *« quelle que soit recette ou dépense, une opération est liée à deux comptes, celui du débiteur et celui du créditeur, et en fonction de ma position »*.

---

## La remarque, et pourquoi elle est structurante

C'est la partie double, et c'est la façon dont un comptable **lit** une opération. Le produit,
lui, stocke **un seul compte par ligne** :

```ts
// LigneRecette → compteProduit  (classe 7)
// LigneDepense → compteCharge   (classe 6)
```

L'autre compte n'existe **nulle part** avant l'agrégation, où il est **déduit** :

```ts
// ventilation.regles.ts — resoudreContrepartie
case 'ESPECES':      return comptes.caisse;
case 'BANQUE':       return comptes.banque;
case 'MOBILE_MONEY': return comptes.mobileMoney;
default:
  if (entree.tiers == null || entree.tiers.trim() === '') return null;
  return sens === 'RECETTE' ? comptes.clients : comptes.fournisseurs;
```

⇒ **Aucune route ne rend, pour une transaction donnée, le couple (compte débité, compte
crédité).** `GET …/cahiers/recettes` rend le compte de produit et le moyen de paiement ; c'est
tout.

---

## Ce que ça coûte, concrètement

**Un écran qui veut montrer une opération comme un comptable la lit doit ré-implémenter
`resoudreContrepartie` côté client** — c'est-à-dire recopier une **règle métier** et la
maintenir en double. C'est exactement ce que le programme refuse ailleurs (NFR-A06, et la leçon
de FE-056 : *« le plan de comptes vient du SERVEUR »*).

Et la copie serait **fragile sur le point qui compte** : le sens.

| opération | compte débité | compte crédité |
|---|---|---|
| vente encaissée en espèces | `571…` **Caisse** | `701…` Ventes |
| achat payé en espèces | `605…` Achats | `571…` **Caisse** |

**Le même compte de trésorerie est débité dans un cas et crédité dans l'autre.** Le sens
n'appartient pas au compte, il appartient à l'opération — c'est le « en fonction de ma
position » de la remarque. Un client qui se trompe d'un cran inverse une trésorerie sans
qu'aucun total ne bouge (les deux restent équilibrés).

⚠️ **Et la contrepartie n'est pas toujours déterminable** : ni moyen de paiement ni tiers ⇒
`null`, la transaction est **écartée**. Le client ne peut le savoir qu'en refaisant le test —
donc en connaissant aussi les **comptes de contrepartie du dossier**
(`GET …/balance/comptes-ventilation`, un second appel) **et** la règle de priorité.

---

## Ce qui est demandé

Publier le couple sur la **transaction**, là où il se lit :

```ts
// LigneRecetteResponseDto / LigneDepenseResponseDto
@ApiProperty({ description: 'Compte débité — reconstitué par la règle de ventilation.' })
compteDebit!: string | null;
@ApiProperty({ description: 'Compte crédité — idem.' })
compteCredit!: string | null;
@ApiProperty({
  enum: ['MOYEN_PAIEMENT', 'TIERS_SANS_MOYEN_PAIEMENT', 'INDETERMINABLE'],
  description: 'D’où vient la contrepartie — et pourquoi elle manque, le cas échéant.',
})
origineContrepartie!: string;
```

1. **`null` des deux côtés quand la contrepartie est indéterminable** — et `origineContrepartie:
   'INDETERMINABLE'`. C'est ce qui permet à l'écran de signaler la ligne **avant** l'agrégation,
   au lieu de la découvrir dans les `nonVentilables` d'un aperçu.
2. **Le sens est porté par le couple, pas par le compte** : un test doit rougir si une dépense
   rend le compte de trésorerie au débit.
3. ⚠️ **Ces champs sont *dérivés*, pas persistés.** Les persister créerait une seconde source de
   vérité qui divergerait au premier changement de `comptes-ventilation` — exactement ce que
   D-085-6 refuse pour les surcharges. Ils se calculent à la lecture, avec les comptes de
   contrepartie **effectifs du dossier**.
4. ⚠️ **Conséquence à assumer** : la lecture d'un cahier charge désormais les comptes de
   ventilation du dossier. C'est **un** aller-retour de plus par requête, pas par ligne
   (`chargerSurcharges` fait déjà exactement ça pour les règles).

---

## Critères d'acceptation

1. `GET …/cahiers/recettes` et `GET …/cahiers/depenses` publient `compteDebit`, `compteCredit`
   et `origineContrepartie` sur chaque ligne.
2. Une recette encaissée en espèces rend `compteDebit = caisse` / `compteCredit = compteProduit` ;
   une dépense payée en espèces rend l'**inverse** sur la trésorerie — testé sur les deux sens.
3. Sans moyen de paiement mais avec tiers : `411…` / `401…` selon le sens, et
   `origineContrepartie = 'TIERS_SANS_MOYEN_PAIEMENT'`.
4. Sans moyen de paiement ni tiers : les deux comptes à `null`, `'INDETERMINABLE'` — et la ligne
   reste **lisible** (aucune erreur).
5. Le couple est cohérent avec ce que `POST …/balance/depuis-cahiers` produira : un test
   compare, sur un jeu de lignes, la ventilation et les champs publiés.
6. OpenAPI régénéré ; types du front régénérés.

---

## Notes

- **Complémentaire de STORY-421**, pas redondante : 421 demande la répartition **agrégée** des
  contreparties sur l'aperçu (« combien de créances fantômes ») ; 425 demande le couple
  **par opération** (« laquelle, et pourquoi »). L'une donne le compteur, l'autre la liste.
- ⚡ **Ce que cette story change pour l'écran** : la partie double cesse d'être une
  *démonstration* dans un encart et devient la **forme normale** de lecture d'une opération —
  c'est ce que la maquette FE-046 dessine désormais, en tête du panneau « Contreparties ».
- Voir [[FE-046]], `stories/STORY-085.md` (D-085-2, D-085-3, D-085-5), `stories/STORY-421.md`.

---

## Progress Tracking

**Statut : `done`** — développée **et clôturée** le **2026-09-01**. PR `balance-service` **#83**
(4 commits : le livrable, le correctif de boot trouvé en vérif docker, la revue de code, la revue de
sécurité), **rebase-mergée sur `dev`**.

### Ce que la conception a tranché

**`resoudreCouple` est la LECTURE de la règle existante, jamais une seconde.** Elle appelle
`resoudreContrepartie` — la fonction que la ventilation emploie. Toute divergence entre l'écran d'un
cahier et l'aperçu de balance est ainsi **impossible par construction**, et c'est ce que l'AC-5
vérifie en rejouant `ventiler*` pour comparer le **sens réellement produit**.

**Les 4 routes de chaque cahier publient le couple**, pas seulement le `GET` : un champ déclaré au
contrat ne peut pas manquer à la réponse d'un `POST`. Le paramètre `comptes` du présentateur est
**obligatoire** — le rendre facultatif aurait laissé un appelant publier un couple bâti sur les
défauts SYSCOHADA au lieu du paramétrage réel : plausible, et faux.

**`ORIGINES_CONTREPARTIE` est dérivé** de `MOTIFS_CONTREPARTIE` + `INDETERMINABLE`. Une liste
littérale divergerait au premier motif ajouté — le défaut de STORY-390.

**`ComptesVentilationModule` extrait d'`AgregationModule`** : ce dernier importe `CahiersModule`,
donc l'inverse fermerait un **cycle**. Ni `forwardRef`, ni un second jeu de providers — re-fournir le
service aurait donné **deux instances** de la règle qui décide des comptes de contrepartie.

⚠️ **Interaction avec STORY-424, assumée** : le couple publie le compte **tel que saisi**
(`70730000`), alors que la ligne de balance portera le compte de plan (`707300`). C'est cohérent —
le couple décrit l'**écriture**, et c'est bien ce numéro-là que `ventiler*` impute ; seule la ligne
de balance porte le compte dérivé, avec `comptesSources` pour dire d'où elle vient.

### ⚠️⚠️ Le piège de ce cahier

La ligne de **dépense** nomme son tiers `fournisseur` quand `resoudreContrepartie` lit `tiers`.
Passer le document tel quel rendrait `INDETERMINABLE` sur **toute** dépense à crédit — la ligne
serait signalée comme condamnée à être écartée de l'agrégation alors qu'elle y entrera parfaitement.
`ventilerDepense` fait exactement cette projection ; un test unitaire **et** un e2e la gardent.

### ⚡⚡ Ce que la VÉRIFICATION DOCKER a trouvé — l'application ne démarrait pas

**3 579 unitaires et 884 e2e VERTS**, lint et build compris, et l'`AppModule` ne bootait **pas** :
`AgregationModule` exportait encore un service qu'il ne **fournit** plus après l'extraction
(`UnknownExportException`). Aucune suite ne pouvait le voir — les unitaires instancient les services
avec `new`, les e2e les remplacent par un `useValue`, et personne ne montait ces modules-là. C'est le
constat de STORY-145 sur `BalanceModule`, qui avait produit `balance.module.spec.ts` ;
`AgregationModule` et `CahiersModule` n'en avaient pas. `agregation.module.spec.ts` ferme le trou.

⚠️ **Et sa première version restait VERTE sous mutation** : `module.get()` fouille le conteneur
entier et trouve un provider **non exporté**. L'assertion passe donc par une **sonde** — un module
tiers qui n'importe qu'`AgregationModule` et **injecte** le service.

### ⚡⚡ Ce que la passe de MUTATION a trouvé

Remplacer le corps de `comptesDeContrepartie` par les défauts SYSCOHADA laissait **84 tests VERTS** :
les specs de contrôleur mockent le service, et le double de la suite rendait justement les défauts.
Un cabinet ayant paramétré sa caisse aurait vu publier un couple bâti sur un compte qu'il n'utilise
pas. Comblé par un test à valeur **volontairement différente du défaut**, avec assertion du scope
`(org, dossier)`.

Mutations passées et toutes rouges ensuite : sens ignoré (trésorerie toujours au débit) · piège
`fournisseur`↔`tiers` · écriture à une jambe quand la contrepartie manque · vocabulaire tronqué ·
paramétrage du dossier écrasé · recette ventilée dans le sens d'une dépense · liste sans
paramétrage · export de module retiré · dépendance de module retirée · durcissement du `Promise.all`
retiré.

### Vérification docker — état FINAL (après ⑥ et ⑦)

| opération | couple publié |
|---|---|
| recette encaissée en banque (paramétrée `52100001`) | `D=52100001` `C=70730000` · `MOYEN_PAIEMENT` |
| recette à crédit (tiers nommé) | `D=411` `C=701000` · `TIERS_SANS_MOYEN_PAIEMENT` |
| recette sans rien | `null` / `null` · `INDETERMINABLE` |
| dépense payée en mobile money | `D=60510000` `C=551` · `MOYEN_PAIEMENT` |
| dépense à crédit (fournisseur nommé) | `D=60510000` `C=401` · `TIERS_SANS_MOYEN_PAIEMENT` |
| dépense sans rien | `null` / `null` · `INDETERMINABLE` |

⇒ La trésorerie est **débitrice** sur les recettes et **créditrice** sur les dépenses — le sens
appartient bien à l'opération. Le compte publié est celui **paramétré par le dossier**, pas le
défaut. **AC-5** : les **2** lignes `INDETERMINABLE` correspondent exactement aux **2**
`CONTREPARTIE_INDETERMINABLE` que l'aperçu de balance écarte.

### Portes de qualité

Lint **0 warning** · build OK · **3 584** unitaires + **884** e2e verts · couverture
**99,14 / 92,37 / 98,65 / 99,24** (seuils 65/90/90/90).

⚠️ **Angle mort signalé, non corrigé** : les présentateurs vivent dans des `*.dto.ts`, exclus de
`collectCoverageFrom` — la projection qui porte le sens n'entre donc dans aucun seuil. Placement
**préexistant** ; la logique est gardée par les specs de contrôleur et les e2e.

### AC-6 — OpenAPI

Les trois champs sont déclarés sur `LigneRecetteResponseDto` et `LigneDepenseResponseDto`, **requis**
et les deux comptes **`nullable`** (sans quoi un client généré typerait `string` et casserait sur la
ligne indéterminable — celle-là même que la story veut rendre visible). `origineContrepartie` est une
énumération **nommée** `OrigineContrepartie`, dont un test de contrat vérifie l'égalité avec la
source. ⚠️ Les **types du front** restent à régénérer côté FE-046 — hors périmètre de ce dépôt.

---

## Revue de code (phase ⑥) — 3 constats, **3 traités**

| # | Constat | Traitement |
|---|---|---|
| **F-425-1** | **JSDoc détaché par insertion — 4ᵉ récidive** (après 417, 420, 423). `comptesDeContrepartie` inséré **entre** le one-liner de `lister` et `lister` : le commentaire orphelin surplombait la méthode neuve, et `lister` n'avait plus aucune doc. Dans les **deux** services. | **corrigé** |
| **F-425-2** | Le test « une seule instance de la règle » était **tautologique** : `module.get(X)` vs `module.get(X)`, vrai par construction. **Mesuré par la revue** — re-fournir le service dans `CahiersModule` (deux règles concurrentes) laissait les 3 tests **verts**. | **corrigé** — comparaison des instances **réellement injectées** dans les deux consommateurs ; la mutation vire au rouge. |
| **F-425-3** | Le test « `ORIGINES_CONTREPARTIE` est dérivé » était **tautologique** (70 tests verts sous une liste littérale). | **corrigé** — balayage exhaustif de l'espace d'entrée de `resoudreContrepartie`, avec garde d'anti-vacuité. ⚠️ Documenté honnêtement : une liste **incomplète** ne **compile pas** (garantie plus forte qu'un rouge), une liste **complète** est un mutant **équivalent aujourd'hui** — seule la dérivation ferme le cas futur. |

Écarté par la revue : graphe DI (RAS, vérifié module par module) · toutes les surfaces publient le
couple (aucun `GET :id`, `pieces-ocr` ne rend pas de `Ligne*ResponseDto`) · divergence assumée avec
STORY-424 sur le compte saisi · `PATCH` séquentiel vs `Promise.all` (traité en ⑦).

## Revue de sécurité (phase ⑦) — **0 vulnérabilité**

Vérifié et écarté, code réel à l'appui : **fuite inter-dossiers** (scope `(orgId, dossierId)`, filtre
Mongo à deux clés, `DossierScopeGuard` rend **404 générique** avant le handler) · **divulgation**
(les deux comptes publiés étaient déjà lisibles par le même public via
`GET …/balance/comptes-ventilation`, aux mêmes `@Roles`) · **DoS** (un `findOne` par requête, jamais
par ligne : 10 000 lignes ⇒ **1** lecture) · **extraction de module** (repository et token Mongoose
restent privés, aucun contrôleur dupliqué, `grep` sur le diff : **zéro** occurrence de
`Roles|Requires|@Public|Throttl|APP_GUARD`) · **injection / pollution de prototype** (`switch` sur
littéraux, aucune clé d'objet ni `RegExp` dérivée d'une entrée, filtre casté en `ObjectId`) ·
**retour à 3 clés littérales**, donc aucun champ du document Mongoose réémis malgré l'appel avec le
`doc` complet.

**Durcissement relevé par les DEUX revues** (chacune l'ayant écarté de son propre périmètre) : le
paramétrage est désormais lu **AVANT** l'écriture, et non plus en parallèle (`creer`) ni après
(`creerLot`, `modifier`). En parallèle, une panne de cette lecture rendait une erreur sur une ligne
**pourtant créée** — le client la rejouait et fabriquait un **doublon** dans le cahier. Séquentiel et
d'abord, l'échec précède le commit : rien n'est écrit.
