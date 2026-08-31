# STORY-423 : La balance à 4 colonnes replie les à-nouveaux dans le solde — l'égalité « solde = à-nouveau + mouvements » devient invérifiable

Status: done

**Épic :** EPIC-020 — Cahiers & rattachement (Atelier Balance)
**Service :** `balance-service` (`:3007`) — `modules/cahiers/agregation`, `modules/balance`
**Points :** 3 · **Sprint :** S20
**Origine :** relevée le **2026-08-26** à la **seconde passe** « expert-comptable venant de Sage » sur la maquette **FE-046** — relecture de l'écran **fini**, après celle menée pendant sa construction (qui avait produit STORY-418 à 422).

---

## Le fait, relevé à la source

La ligne de balance publie **quatre** colonnes de montants :

```ts
// dto/agregation.dto.ts — LigneBalanceApercuDto
mouvementDebit!: number;
mouvementCredit!: number;
soldeDebiteur!: number;   // « = à-nouveau + mouvements, net »
soldeCrediteur!: number;  // idem
```

Et le contrat le dit lui-même, mot pour mot :

> *« Solde débiteur = **à-nouveau + mouvements**, net (unités mineures XOF). **Égal au net des
> mouvements lorsqu'aucun socle d'à-nouveaux (STORY-087) n'est chaîné à l'exercice.** »*

⇒ Dès qu'un **socle d'à-nouveaux est chaîné**, le solde contient une composante que **rien ne
publie**. Le client reçoit `mouvements` et `solde` ; il ne peut pas en déduire l'à-nouveau, parce
que `solde − mouvements` n'est calculable que si l'on sait de quel côté (débit ou crédit)
l'à-nouveau tombait — et la compensation nette a déjà eu lieu.

---

## Ce que ça coûte, concrètement

**Une balance SYSCOHADA se lit en six colonnes**, et c'est ce que sort n'importe quel logiciel du
marché :

| | À-nouveaux D | À-nouveaux C | Mouvements D | Mouvements C | Solde D | Solde C |
|---|---|---|---|---|---|---|

C'est la forme que l'expert-comptable **contrôle** : il vérifie ligne à ligne que
`solde = à-nouveau + mouvements`, et c'est ce contrôle qui attrape une reprise d'à-nouveaux
fausse ou incomplète. Avec quatre colonnes, **le contrôle est impossible** : il faut croire le
serveur sur parole, sur le seul poste que personne ne veut croire sur parole — celui qui vient de
l'exercice précédent.

⚠️ **Le défaut est invisible sur le cas nominal**, ce qui explique qu'il ait traversé la première
revue : sans socle chaîné, `solde = mouvements` et tout se recoupe. Il n'apparaît **que sur les
dossiers en deuxième année** — c'est-à-dire, à terme, sur tous.

⛔ **Et il touche les trois adaptateurs, pas seulement les cahiers** : `LigneBalanceApercuDto` est
la forme canonique (STORY-147). Un import Sage qui portait bien ses six colonnes en entrée les
**perd** en sortie.

---

## Ce qui est demandé

1. Publier les deux colonnes manquantes sur la ligne de balance :

   ```ts
   @ApiProperty({ description:
     'À-nouveau débiteur repris du socle d’ouverture (STORY-087). 0 si aucun socle n’est chaîné.' })
   aNouveauDebit!: number;
   @ApiProperty({ description: 'À-nouveau créditeur. Exclusif de `aNouveauDebit`.' })
   aNouveauCredit!: number;
   ```

2. **L'invariant devient contrôlable, donc testable** :
   `soldeDebiteur − soldeCrediteur === (aNouveauDebit − aNouveauCredit) + (mouvementDebit − mouvementCredit)`
   — un test doit **rougir** si la compensation nette est appliquée avant la publication.

3. **Sur une balance sans socle, les deux champs valent `0`** — et c'est le seul endroit de ce
   contrat où `0` est juste : il n'y a pas d'à-nouveau, ce n'est pas une valeur non calculée.
   ⚠️ Ne **pas** les omettre : leur absence se lirait « on ne sait pas », alors qu'on sait.

4. ⚠️ **Vérifier le chemin de la reprise (STORY-087)** : le socle est lui-même une balance. Ses
   propres à-nouveaux valent `0` — c'est le point de départ de la chaîne, pas une lacune.

---

## Critères d'acceptation

1. `POST …/balance/depuis-cahiers` (aperçu **et** persistance) publie `aNouveauDebit` /
   `aNouveauCredit` sur chaque ligne.
2. Sur un exercice **avec** socle chaîné, l'invariant du §2 est vérifié ligne à ligne par un test.
3. Sur un exercice **sans** socle, les deux champs valent `0` et les soldes sont inchangés —
   testé, pour prouver l'absence de régression.
4. Les balances des **trois** adaptateurs (cahiers, Sage, saisie directe) portent les mêmes
   colonnes : c'est le contrat canonique, pas un extra du chemin A.
5. OpenAPI régénéré ; types du front régénérés.

---

## Notes

- ⚠️ **Ce que cette story ne demande pas** : changer l'affichage. Le front décidera s'il montre
  six colonnes en permanence ou seulement quand un socle existe — c'est une question d'écran, et
  elle ne se pose que parce que la donnée existe.
- ⚡ **Ce que cette story enseigne sur la méthode** : elle n'a été vue qu'à la **seconde** lecture
  de la maquette, celle faite sur l'écran **fini** plutôt que pendant sa construction. En
  construisant, on regarde si chaque élément est juste ; en relisant, on regarde **ce qui manque à
  l'ensemble**. Les deux passes n'attrapent pas les mêmes défauts.
- Voir [[FE-046]], `stories/STORY-087.md` (le socle d'à-nouveaux), `stories/STORY-147.md`
  (la ligne à 4 colonnes), `stories/STORY-101.md` (le contrat canonique).

---

## Progress Tracking

**Statut : `done`** — démarrée **et** clôturée le **2026-08-31**. PR `balance-service` **#81**
(2 commits : le livrable, puis la revue), **rebase-mergée sur `dev`**.

### Ce que la conception a tranché, et pourquoi

**L'à-nouveau est CONSTATÉ par le serveur, jamais déclaré par l'adaptateur.** Il est résolu dans
`BalanceService.aNouveauxDuSocle()` puis projeté par `buildCanonique()`, appelé par
`submitInSession()` **et** `dryRun()` — le point unique où les **trois** adaptateurs du hub
convergent. Même doctrine qu'`origine`, `exerciceId` et `libelleSource` (STORY-420).

⛔ **Le poser dans les adaptateurs aurait livré l'AC-4 à moitié.** Seul le chemin des cahiers
fusionne un socle (`fusionnerParCompte`) ; l'import Sage et la saisie directe, eux, ne le
connaissent pas. Ils auraient publié `0` sur tout dossier en deuxième année — la même affirmation
fausse que la story supprime, déplacée d'un cran.

⚡⚡ **L'à-nouveau ne se DÉDUIT pas de `solde − mouvements`**, et c'est la décision de conception
qui compte. La déduction est arithmétiquement exacte et **sans valeur** :

1. sur une balance que la plateforme **fusionne**, elle rend le même chiffre que le socle — le
   contrôle de l'AC-2 devient une **tautologie**, vraie même si la reprise est fausse ;
2. sur un **import**, `detecterDivergencesSoldes` (STORY-147) tolère **délibérément** un écart entre
   solde annoncé et solde recalculé (avertissement, jamais blocage : un décalage de date d'arrêté est
   licite). La déduction y fabriquerait un à-nouveau qui **recoupe la ligne toute seule** — elle
   masquerait exactement l'anomalie que la sixième colonne existe pour montrer.

⇒ La valeur vient du socle, ou vaut `0`.

### Périmètre : ce qui a changé et ce qui n'a PAS bougé

| | |
|---|---|
| Contrat canonique | `LigneBalance` gagne `aNouveauDebit`/`aNouveauCredit`, **requis** |
| Type des producteurs | **neuf** — `LigneBalanceSource = Omit<LigneBalance, 'aNouveau*'>` |
| Persistance | `LigneBalanceSub` : deux `@Prop({required: true})`, **sans `default`** |
| Surfaces publiées | **4** vues de ligne : `LigneView`, `LigneBalanceApercuDto`, `PreviewLineDto`, `LigneSocleView` |
| **Checksum** | **`v2` INCHANGÉ** — il projette 7 champs explicitement ; ni `v3`, ni migration |
| **Contrat `balance.submitted`** | **INCHANGÉ** — `lignes` passe à `LigneBalanceSource`, qui a exactement la forme d'avant ⇒ **aucun second dépôt à toucher** |
| `SubmitBalanceDto` | **INCHANGÉ** — aucun client ne change |

⚡ **`LigneBalanceSource` n'est pas une commodité de typage, c'est la garde.** Un producteur ne
*peut pas* poser ces colonnes : il ne les voit pas. C'est ce qui interdit le second point de recopie
— celui qui, en STORY-420, avait laissé cinq projections justes et une sixième muette.

### Vérification docker — la persistance réelle

Stack neuve (`down -v`) : `mongo` (rs0) + `kafka` + `redis` + `auth-service` + `balance-service`,
hot-reload confirmé (`Found 0 errors` postérieur au dernier commit). Organisation
`cabinet423@prospera.local`, dossier `SARL Test 423`, read-models semés directement (ils ne sont
alimentés que par Kafka). ⚠️ Le checksum du harnais est calculé par **le code du serveur lui-même**
(`dist/modules/balance/balance.checksum`) — c'est ce qui a débloqué la soumission complète que
STORY-422 n'avait pas pu rejouer.

| # | Ce qui est prouvé | Résultat mesuré |
|---|---|---|
| ⓐ | **Une balance ANTÉRIEURE à la story reste lisible** — socle inséré à la main **sans** les colonnes | `GET` rend `aNouveauDebit: 0 / aNouveauCredit: 0` : le repli `?? 0` de `versLigne` fonctionne sur un **vrai** document, pas sur un mock |
| ⓑ | **Les colonnes sont RÉELLEMENT en base** (le piège de STORY-370 : Mongoose élague ce que le schéma ne déclare pas — invisible aux unitaires) | agrégation `$type` sur le document : `lignes = 4`, `avecColonnes = 4` |
| ⓒ | **AC-1 — la valeur vient du SOCLE** (le corps soumis n'en portait aucune) | `411 → aNouveauDebit 10 000 000` · `401 → aNouveauCredit 10 000 000` · `601`/`701 → 0` |
| ⓓ | **AC-2 — invariant ligne à ligne sur le document réel** | 4/4 lignes vérifiées, **somme des écarts = 0** |
| ⓔ | **AC-3 — sans socle, `0` et soldes INCHANGÉS** (exercice 2027, aucun socle) | les 4 lignes à `0/0`, soldes identiques au corps soumis |
| ⓕ | **§4 — un socle ne se reprend pas lui-même**, cas **discriminant** : `affecterResultat` écrit une **2ᵉ version** du socle alors que la v1 existe sur le **même** exercice | socle 2027 v1 **et** v2 : colonnes présentes, **toutes à `0`**. Sans la garde, la v2 aurait repris les soldes de la v1 |
| ⓖ | XOR et signe | aucune ligne des **deux** côtés, aucune colonne négative, sur tout le dossier |
| ⓗ | **Le checksum tient sans `v3`** | les 5 balances scellées `checksumVersion: v2` ; un adaptateur qui signe **4 colonnes** est toujours accepté |

⚠️ **Deux résultats à lire correctement, et je les écris plutôt que de les taire** :

- **L'invariant n'est PAS une propriété du socle.** Un socle porte des soldes, aucun mouvement et
  aucun à-nouveau : `solde ≠ 0 + 0`. C'est exactement ce que le §4 sanctionne — ses soldes sont
  **reportés**, pas dérivés. L'invariant est une propriété d'une balance **de l'exercice**.
- **La balance 2026 v3 sort avec 2 lignes hors invariant, et c'est la fonctionnalité.** Ses soldes
  déclarés ne se recoupent pas avec le socle : l'écart est désormais **visible dans la balance**, au
  lieu d'être absorbé par la compensation nette. C'est le cas que le test
  « import qui **contredit** le socle » verrouille.
- ⚠️ **Un événement `balance.created` orphelin** subsiste en `outbox_events` : il pointe la balance
  2027 v1 que **j'ai supprimée à la main** en cours de vérification, pour libérer la clé
  d'idempotence que le socle réclamait. Artefact du harnais, pas du code.

Stack arrêtée après la vérification.

### Passe de mutation — exécutée, pas cochée

| Mutation | Attendu | Constaté |
|---|---|---|
| Projection neutralisée (`repartirANouveau(0)`) — la compensation nette appliquée avant publication | rouge | **5 tests rouges** (AC-1, AC-2, AC-4, provisions, import contredisant) |
| Garde du socle inversée (`origine !== A_NOUVEAUX`) | rouge | **2 tests rouges** (§4 et provisions) |
| Dérivation tautologique (`solde − mouvements`) | rouge | **2 tests rouges** |
| Repli `?? 0` retiré (`as number`) | rouge | **1 test rouge** (ajouté par la revue — il était vert avant, cf. F-423-1) |
| `@ApiProperty` retirés de `PreviewLineDto` | rouge | **2 tests rouges** (contrat OpenAPI) |
| Recopies runtime retirées (`previewLines`, socle) | rouge | **refusé par `tsc`** — gardées par le **compilateur**, pas par un test |

⚡⚡ **Ce que la passe de mutation a appris, et qui a changé les tests** : la mutation
« dérivation tautologique » laissait **AC-1 et AC-2 verts**. Sur une balance fusionnée,
`solde − mouvements` rend *exactement* l'à-nouveau du socle — la déduction y est **indiscernable** de
la lecture. Le seul cas qui les sépare est celui d'une balance **importée qui contredit le socle** :
un test dédié a été ajouté pour ça, et le commentaire d'AC-2 dit désormais **ce qu'il ne peut pas
attraper**.

### AC-5 — OpenAPI et types du front

Le service n'a **aucun artefact OpenAPI committé** : la spec est produite au runtime depuis les
décorateurs (`/api/docs`). AC-5 se réduit donc à **déclarer** les propriétés — et le filet est
`test/openapi-contract.e2e-spec.ts`, seul garde-fou possible puisque `collectCoverageFrom` exclut les
`*.dto.ts` (retirer un `@ApiProperty` ne fait bouger aucun chiffre de couverture). ⚠️ **La
régénération des types côté front n'est pas faite ici** : les dépôts frontend ne sont pas poussables
depuis ce poste.

### Hooks inertes documentés

- Le **sommaire** ne gagne **pas** de troisième équilibre `Σ aNouveauDebit = Σ aNouveauCredit`.
  Ce serait faux : seuls les comptes **présents dans la balance** reçoivent leur à-nouveau, et une
  balance importée qui omet un compte du socle rendrait ce total déséquilibré sans faute.
- Un **compte porté par le socle mais absent de la balance soumise** ne publie aucun à-nouveau —
  il n'a simplement pas de ligne. Inchangé par rapport à aujourd'hui, et hors périmètre.
- `bilan-service` relit la balance en HTTP : il **peut** consommer les deux colonnes, il ne le fait
  pas encore. Aucun changement de contrat ne le lui impose.

---

## Revue de code (phase ⑥) — 3 constats, 3 corrigés

### ① ⚡⚡ F-423-1 — le repli `?? 0` de `versLigne` n'était gardé par **rien**

C'est le seul mécanisme qui empêche une balance scellée **entre STORY-147 et STORY-423** de sortir
sans ses deux colonnes : Mongoose n'hydrate que ce que le schéma déclarait à l'écriture,
`versLigne` rendait `undefined`, et **`JSON.stringify` supprime la clé** — `GET /balances/:id`
omettait alors deux champs que l'OpenAPI déclare `required`. L'inverse exact de l'AC-3 : l'absence
se lit « on ne sait pas », alors qu'on sait.

⚠️ **Mesuré** : remplacer le repli par `source.aNouveauDebit as number` laissait les **3 494 tests
verts**. Le cas « ligne courante » portait les colonnes ; le cas « sans à-nouveau » passait par la
branche **héritée**, qui les pose depuis une constante. Aucun test n'empruntait le repli.

⛔ **Ce qui rendait la suppression probable** : `toBalanceResponse` — le seul site de production qui
lit un document réel — typait encore ses lignes `LigneBalance`, donc les colonnes **requises**,
alors que la story venait d'introduire `LignePersistee` pour dire l'inverse. Un lecteur y voyait un
champ non-optionnel et concluait que `?? 0` était du code mort.

**Correctif** : test dédié sur le repli (mutation vérifiée **rouge**) + `toBalanceResponse` type
enfin ses lignes en `LignePersistee`.

### ② ⚡⚡ F-423-2 — JSDoc orphelin, **3ᵉ récidive du même piège**

Mon bloc de contrat OpenAPI s'est inséré **entre** le commentaire de STORY-421 et le `describe`
qu'il documentait. L'avertissement rédigé pour 421 se lisait comme s'il portait sur 423, et le bloc
421 perdait la mise en garde qui explique **pourquoi** ce fichier est son seul filet.

Piège déjà fiché : **fait en STORY-417, refait en STORY-420, refait ici**. Le commentaire de 421 est
recollé à son `describe`.

### ③ F-423-3 — le contrat énonçait comme une **identité** une égalité que la story rend falsifiable

`LigneView.soldeDebiteur` affirmait sans réserve « **net** d'`aNouveauDebit − aNouveauCredit +
mouvementDebit − mouvementCredit` ». Or `LigneView` sert **toutes** les balances, Sage et saisie
directe comprises — dont les **soldes sont déclarés par la source** quand les **à-nouveaux sont
constatés depuis le socle**. Le service ne rapproche jamais les deux, délibérément.

**Scénario** : un export Sage tronqué déclare `411` à `5 000 000` ; le socle porte `10 000 000`, les
mouvements `−3 000 000`. Un consommateur appliquant la phrase du contrat — un tableau front qui
recalcule la colonne, ou `bilan-service` qui contrôle avant d'assembler la liasse — obtient
`7 000 000` : un écart de **2 000 000 XOF effacé**, sur le poste même que la sixième colonne existe
pour rendre visible. Les deux autres surfaces étaient correctement rédigées ; seule la plus large
énonçait un fait. Précédent : STORY-400, où le bloquant n'était **qu'une description OpenAPI**.

**Correctif** : la description dit l'écart possible, en nomme la cause, et **interdit** le recalcul.

---

## Revue de sécurité (phase ⑦) — **0 vulnérabilité**

Six points instruits explicitement, tous négatifs :

1. **Lecture du socle cross-tenant** — impossible : le filtre porte **conjointement** `orgId` et
   `dossierId`, tous deux castés en `ObjectId` (pas d'injection d'opérateur). Les trois adaptateurs
   les tiennent du JWT et du param d'URL gardé ; sur la voie Kafka, `dossierId` revendiqué est
   **vérifié** contre le read-model avant tout appel.
2. **Checksum `v2` ne couvrant pas les colonnes** — non exploitable : elles ne transitent jamais
   (rien à falsifier en transit), le sceau est un SHA-256 **non clé** qui ne protégeait déjà pas au
   repos, et aucune colonne ne pilote un calcul, un contrôle ou une autorisation.
3. **`required: true` sans `default`** — aucun chemin d'écriture cassable : `repo.insert` est le seul
   producteur de documents et passe toujours par `buildCanonique` ; `updateStateAtomic` est un
   `findOneAndUpdate` **sans** `runValidators`, donc une balance antérieure reste validable.
4. **Injection par un émetteur Kafka** — impossible, et **trois** barrières indépendantes :
   `ingestion.regles` lit le payload en **liste blanche de sept champs**, `buildCanonique` écrase de
   toute façon, et `forbidNonWhitelisted` rejette côté HTTP.
5. **Le repli `?? 0`** ne masque aucun contrôle : équilibre, divergences, gate de validation,
   immutabilité et moteurs fiscaux lisent **exclusivement** les quatre colonnes de STORY-147.
6. **`origine` choisie par l'appelant** — impossible : elle vit dans `MarquageBalance`, paramètre de
   service sans contrepartie au DTO. La sortie anticipée n'est pas atteignable par un attaquant.

⚠️ **Deux limites signalées sous le seuil, consignées plutôt que tues** :

- Les à-nouveaux sont un **instantané figé à l'insert** : une balance déposée **avant** que le socle
  n'existe gardera `0` définitivement. L'effet est *fail-visible* — le contrôle
  `solde = à-nouveau + mouvements` échouera bruyamment — et l'ordre nominal du workflow est
  « socle d'abord ». Non corrigé : hors périmètre, et le rattrapage exigerait de réécrire des
  balances déjà scellées.
- `trouverSocleANouveaux` ne filtre pas sur `etat` : un socle **rejeté** peut alimenter les colonnes.
  Comportement **strictement préexistant** — cette même méthode pilote déjà les *soldes* des balances
  construites et le contrôle de divergence Sage, une influence bien plus forte que l'affichage ajouté
  ici. Cette story ne le rend pas nouvellement exploitable ; à trancher dans une story dédiée.
