# STORY-459 : Aucune dotation aux amortissements : l'investissement gonfle l'actif sans jamais le déprécier, et la CAF est prise pour le résultat

Status: done

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 8 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-035** (hypothèses de prévisionnel paramétrables), 2026-08-27.
Relevé en lisant `projection-annuelle.service.ts` (`capaciteAutofinancement: resultatNet`, `actifImmobiliseNet += hypotheses.investissements`).

---

## Le fait

Deux lignes du moteur, et elles se renforcent :

1. `actifImmobiliseNet += hypotheses.investissements` — l'investissement **s'ajoute** à l'actif
   immobilisé **net**, exercice après exercice, et **rien ne l'amortit jamais**.
2. `capaciteAutofinancement: resultatNet` — la CAF est **assimilée** au résultat, sans réintégration
   des dotations (le commentaire l'assume : « hors du modèle simplifié FR-019 — hook documenté »).

Sur le scénario prudent de la maquette : **3 600 000** investis sur trois ans font passer l'actif
immobilisé net de **2 243 646** à **5 843 646**, sans **une seule** dotation.

⚠️ **Les deux approximations ne se compensent pas** — c'est le point qui rend la story nécessaire :

- si le comptable **loge** la dotation dans `tauxChargesPct`, le résultat devient juste mais la CAF
  est **sous-évaluée du montant de la dotation**, donc la trésorerie projetée est pessimiste ;
- s'il **ne** l'y loge **pas**, le résultat est **surévalué**, l'impôt qui en découlera (STORY-458)
  aussi, et l'actif ne se déprécie jamais.

Il n'existe aucune saisie qui donne les deux à la fois. Le modèle est donc **faux dans les deux cas**,
et rien dans l'écran ne dit lequel choisir.

## Critères d'acceptation

- [x] AC-1 — Une hypothèse `dureeAmortissementAns` (ou `tauxAmortissementPct`) s'ajoute au jeu, bornée,
      avec la même exigence de version que les autres (`versions_hypotheses`).
- [x] AC-2 — Le CR prévisionnel porte une ligne `dotationsAmortissements`, déduite du résultat.
- [x] AC-3 — `capaciteAutofinancement = resultatNet + dotations` — la définition comptable, pas une
      assimilation.
- [x] AC-4 — `actifImmobiliseNet` est **diminué** des dotations cumulées ; l'équilibre `ecart = 0`
      reste vrai après arrondis (le test de cohérence existant doit rester vert).
- [x] AC-5 — Le stock d'immobilisations **existant** au bilan de base continue de s'amortir : l'ancre
      résiduelle n'est pas un actif neuf. À défaut de donnée, la story **le déclare** au lieu de le
      supposer.
- [x] AC-6 — `MODELE_PROJECTION_VERSION` incrémentée.

## Arbitrages PO du 2026-09-05 (avant écriture d'une ligne)

### D-459-1 — le stock d'immobilisations de la base n'est **pas** amorti, et la réponse le DIT

AC-5 exige que le stock existant continue de s'amortir, **ou** que la story le déclare. La donnée
n'existe pas au niveau d'agrégation où la projection s'ancre, et c'est **mesuré, pas supposé** :

- l'ancre des emplois durables est un **solde d'ancrage** (`totalActifBase − bfrBase − tresorerieBase`)
  qui absorbe tout ce que le modèle simplifié ne ventile pas — immobilisations, **mais aussi** autres
  créances et dettes. L'amortir en bloc amortirait des créances ;
- `MappingRule` ne déclare **aucun** marqueur d'immobilisations. Les trois marqueurs additifs existants
  sont `tresorerie`, `role` et `chiffreAffaires` (STORY-457) ;
- `ancrage.ts` ne lit que des **agrégats** (invariant P7) : ni `postes`, ni `sousTotaux`, ni `actif`.
  Déduire les immobilisations en sommant les postes d'actif porteurs d'un amortissement non nul serait
  une **heuristique non sourcée**, et franchirait la frontière que cette story n'a pas mandat de bouger.

**Retenu** : seuls les **investissements projetés** s'amortissent. La réponse publie le fait
(`amortissement.stockExistantAmorti: false`) avec son **motif**, sur le patron de `fiscalite` et de
`tresorerieAncree` — jamais un silence qui laisserait croire que la base est amortie.

**Chemin de reprise nommé** (hook inerte, non codé) : un marqueur additif de paquet référentiel
`MappingRule.dotationsAmortissements`, sur le patron **exact** de `chiffreAffaires` (STORY-457) — il
ferait remonter la dotation constatée de l'exercice de base comme un agrégat, sans toucher P7. C'est une
story à part entière : elle touche les artefacts des cinq référentiels.

### D-459-2 — `dureeAmortissementAns` est **requis** ; un jeu antérieur est **refusé au calcul**

`hypotheses` est persisté en `@Prop({ type: Object })` : un jeu enregistré avant cette story se relit sans
erreur et le moteur lirait `undefined`. `investissements / undefined` vaut `NaN`, que JSON sérialise en
`null` — exactement la panne que STORY-457 a mesurée (HTTP 200, montants à `null`, `equilibre: false`
accusant le modèle) et pire encore sur la comparaison, où `NaN` fabriquait des **entiers plausibles**.

**Retenu** : le champ est **obligatoire** au DTO, et `exigerFormeCourante` — le **juge unique** des trois
appelants de moteur — refuse de **calculer** un jeu qui ne le porte pas, ou qui le porte hors de ses
bornes. Compléter par un défaut serait pire : la valeur choisie déplacerait des montants remis à une
banque sans que personne ne l'ait saisie. **Consulter** un ancien jeu reste possible (`getVersion` n'est
pas gardé) ; la migration des documents reste différée, règle projet.

### D-459-3 — linéaire, année pleine, **sans** prorata temporis

Le modèle annuel ne connaît **aucune date d'acquisition** : l'investissement est un montant annuel
récurrent. Un prorata exigerait une donnée qui n'existe pas. Chaque **génération** d'investissement
s'amortit donc linéairement sur `dureeAmortissementAns` années pleines, la première étant l'exercice de
son acquisition — soit `dotations(n) = arrondir(min(n, durée) × investissements / durée)`.

⚠️ **C'est cette forme qui rend l'actif net des investissements structurellement positif** : la dotation
annuelle plafonne à l'investissement annuel, donc le cumul des dotations ne peut pas dépasser le cumul
des investissements, **y compris** quand la durée est plus courte que l'horizon (durée = 1 an :
l'actif net revient à zéro, il ne devient jamais négatif). Une formule naïve `n × I / d` le rendrait
négatif dès `n > d`.

## Conséquences ailleurs

- Interagit directement avec **STORY-458** : l'IS se calcule après dotations.
- Le libellé de `tauxChargesPct` dans la maquette FE-035 pose explicitement la question
  (« dotations aux amortissements comprises ? ») : elle ne pourra être retirée qu'avec cette story.

## Progress Tracking

**Statut : `done`** (2026-09-05) — PR `bilan-service` **#89** rebase-mergée sur `dev`, branche supprimée.
Branches `MNV-459` créées dans `bilan-service` et `docs/` **avant** la première ligne de code.

```
bilan-service : MNV-459
docs          : MNV-459
```

**Périmètre — un seul dépôt** : `bilan-service`. Aucun contrat d'événement Kafka n'est touché, donc pas
de second dépôt à synchroniser.

### Ce qui a été livré

- **Unité pure `amortissement.ts`** (patron de `bfr.ts` / `impot.ts`) : `dotationExercice` et le
  type publié `AmortissementProjection`.
- **Hypothèse `dureeAmortissementAns`** — entier 1..50 au DTO, versionnée comme les autres.
- **Moteur annuel** : ligne `dotationsAmortissements` au compte de résultat, déduite **avant**
  l'impôt ; `capaciteAutofinancement = resultatNet + dotations` ; `actifImmobiliseNet` net des
  dotations cumulées, elles-mêmes publiées (`amortissementsCumules`).
- **`exigerFormeCourante` étendue** au second champ dont un document ancien peut être dépourvu,
  avec un message qui nomme le champ fautif. Même code d'erreur, le geste de reprise étant le même.
- **Export** : ligne « Dotations aux amortissements » (en négatif, comme l'impôt), ligne « dont
  amortissements cumulés » au bilan, et métadonnée « Amortissements » qui **dit le périmètre**.
- **`MODELE_PROJECTION_VERSION` 1.1.0 → 1.2.0.**
- **Hors périmètre, trouvé par le balayage de contrat** : `ExerciceProjeteDto.exercice` se publiait
  en `object` opaque faute de `type: String` — le **millésime**, c'est-à-dire le libellé de colonne
  de tout tableau prévisionnel. Corrigé plutôt qu'inventorié : monter `ProjectionResponseDto` au
  balayage OpenAPI était nécessaire pour garder les `@ApiProperty` de cette story, et c'est ce
  montage qui l'a révélé. Aucun autre opaque n'est apparu dans la grappe.

### Le mensuel n'a demandé aucune ligne — et c'est le contrôle

Une dotation n'est **pas décaissée** : le plan mensuel compose son flux ligne à ligne, et aucune
de ces lignes ne bouge. Tout l'écart mensuel tient dans la colonne d'impôt, qui baisse parce que
l'IS se liquide sur un résultat diminué des dotations. L'attendu figé des douze périodes le
**vérifie colonne par colonne** : cinq colonnes identiques à l'octet au modèle 1.1.0, la sixième
à 675 000 au lieu de 742 500. Une dotation qui aurait fui dans le plan de trésorerie ferait
bouger une autre colonne.

### Mutations volontaires (chacune restaurée, chacune compilant)

| Mutation | Compile | Tests rouges |
|---|---|---|
| `min(rang, durée)` retiré de `dotationExercice` (formule naïve) | oui | 3 |
| `capaciteAutofinancement = resultatNet` (le défaut d'origine) | oui | 11 |
| dotations non retranchées du résultat avant impôt | oui | 10 |
| dotations non retranchées de `actifImmobiliseNet` | oui | 9 |
| garde `dureeAmortissementAns` désarmée | oui | 7 |
| ligne « Dotations aux amortissements » retirée de l'export | oui | 2 |
| `type: String` retiré du millésime publié | oui | 1 |

⚠️ **Chaque mutation a été vérifiée par `tsc` avant d'être jugée** : une mutation qui ne compile
pas rougit par erreur de type et ne prouve rien (leçon STORY-458).

### Portes de qualité

Lint 0 warning · build OK · **1 928 unitaires** + **524 e2e** verts · couverture globale
**98,87 / 94,26 / 98,85 / 98,90** (seuils 65/90/90/90), les trois fichiers neufs à 100 % de
branches.

### Vérification docker (2026-09-05, stack `docker compose`, `Found 0 errors`)

Parcours réel sur le dossier de démonstration, base `bilan_service`.

1. **Contrat servi par le conteneur** — `dureeAmortissementAns` publié avec sa description,
   `AmortissementProjectionDto` présent, et `ExerciceProjeteDto.exercice` passé de
   `{"type":"object"}` à `{"type":"string"}`.
2. **Bornes** — création sans le champ ⇒ **400** ; `dureeAmortissementAns: 0` ⇒ **400**.
3. **Persistance** — `db.jeux_hypotheses` porte `dureeAmortissementAns: 5` (type `number`).
4. **Versionnement** — `versions_hypotheses` fige la durée. Après une édition à 3 ans,
   `?versionHypotheses=1` rejoue avec **5** (dotations 1 000 000 / 2 000 000 / 3 000 000) et la
   version courante avec **3** (1 666 667 / 3 333 333 / **5 000 000**, plafonnées à
   l'investissement annuel).
5. **⚡⚡ Le document ANCIEN, celui qui dormait vraiment en base** — `verif-458-prudent`, écrit par
   la vérification de STORY-458 et dépourvu du champ, rend **422 `HYPOTHESES_FORME_OBSOLETE`** sur
   la projection annuelle **et** sur la comparaison (le 3ᵉ chemin), avec un message qui nomme le
   champ **et** le scénario fautif. Jamais un 200 aux montants `null`.
6. **Projection réelle** (investissements 5 000 000, durée 5) — dotations 1 000 000 / 2 000 000 /
   3 000 000 ; résultat avant impôt N+1 = 5 403 750 − 3 602 500 − 1 000 000 = **801 250** ; IS =
   27 % = **216 338** ; résultat net **584 912** ; CAF **1 584 912** = 584 912 + 1 000 000 ;
   `ecart = 0` sur les trois exercices.
7. **⚡ Durée de 1 an, le cas que le `min` protège** — l'actif immobilisé net vaut **908 334** aux
   trois exercices, exactement l'ancre résiduelle recalculée à la main
   (`totalActif − BFR − trésorerie`) : il y revient et n'y descend **jamais**, pendant que les
   amortissements cumulés montent à 5 000 000 / 10 000 000 / 15 000 000. `ecart = 0`.
8. **Plan mensuel** — aucune ligne de dotation parmi les huit publiées, `fluxNet` du mois 1
   recomposable de ses lignes, `ecartArticulation = 0`.
9. **Document remis à un tiers** — le PDF **et** le classeur portent « Dotations aux
   amortissements » (en négatif), « dont amortissements cumulés », et la métadonnée
   *« Amortissements : Linéaire sur 1 an(s), investissements projetés seuls — les immobilisations
   déjà au bilan de base ne sont pas amorties (le référentiel n'en déclare pas le montant) »*.
   C'est AC-5 jusque dans la pièce que lit le banquier.

### Hooks inertes documentés (hors périmètre, non codés)

- **Marqueur `MappingRule.dotationsAmortissements`** (D-459-1) : ferait remonter la dotation
  constatée de la base comme un agrégat, sur le patron exact de `chiffreAffaires` (STORY-457), et
  permettrait d'amortir le stock existant sans toucher l'invariant P7. Touche les artefacts des
  cinq référentiels ⇒ story à part entière.
- **`HypothesesResponseDto.hypotheses` reste publié `type: Object`** : en **lecture**, le nouveau
  champ est donc invisible d'un client généré — exactement comme les neuf autres, depuis
  STORY-068. Défaut **pré-existant et uniforme**, non traité ici : le typer ferait entrer tout le
  contrôleur d'hypothèses dans le balayage de contrat, avec ses opaques. L'écriture, elle, publie
  bien le champ (`HypothesesDto`), qui est ce qu'AC-1 demande.
- **Prorata temporis** (D-459-3) : demanderait une date d'acquisition que le modèle annuel n'a pas.
  Se tient avec STORY-460, qui doit décider si l'investissement est récurrent ou échelonné.

### Revue de code — 4 constats, tous corrigés (commit dédié `c643ecb`)

1. **⚡⚡ Les TROIS réponses qui publient `MODELE_PROJECTION_VERSION` ne disaient pas la même
   version.** `ProjectionResponseDto` était passé à 1.2.0 ; `ProjectionMensuelleResponseDto` et
   `ComparaisonResponseDto` annonçaient encore « 1.1.0 (STORY-458) livre l'impôt », alors que les
   deux endpoints rendent bien `1.2.0` (ils renvoient la **même constante**). Point de recopie :
   trois sites, un seul traité — et le champ qui mentait sur sa version est précisément celui dont
   la description entière sert à dire **« ne comparez pas deux versions de modèle »**. La garde
   AC-6 que j'avais ajoutée ne balayait que `ProjectionResponseDto` : elle ne pouvait pas le voir.
2. **La métadonnée « Amortissements » et la ligne « dont amortissements cumulés » n'étaient
   gardées par AUCUN test.** Ce sont pourtant la déclaration d'AC-5 et l'explication d'AC-4 **dans
   la pièce remise au banquier**. Un refactor du tableau de métadonnées les aurait fait disparaître
   du PDF avec 1 928 unitaires et 524 e2e au vert. Deux tests ajoutés, dont un qui vérifie que le
   « dont » reste **immédiatement sous** la ligne qu'il détaille.
3. **Une branche morte dans une phrase remise à une banque.** `mentionAmortissement` portait un
   ternaire sur `stockExistantAmorti`, dont la branche « stock amorti » n'est atteignable par rien
   (`regimeAmortissement` rend `false` pour tout référentiel). Écrite en dur, avec le hook de
   reprise nommé — même arbitrage qu'en STORY-457 sur le repli de `exigerFormeCourante`. La
   couverture de branches du fichier passe de 85 % à 88,9 %.
4. **⚡ Convention de signe : deux charges voisines sous deux conventions opposées.** J'avais publié
   la dotation en **négatif** par analogie avec l'impôt de STORY-458 — mais l'analogie est fausse.
   L'impôt est négatif parce qu'il **s'additionne** au résultat avant impôt pour donner le résultat
   net, deux lignes adjacentes. La section du compte de résultat, elle, ne s'additionne pas : `coût
   des ventes` et `charges d'exploitation` sont publiées **positives** et se retranchent de la
   marge. Le PDF affichait donc `Marge brute 33 000 000 / Charges 22 000 000 / Dotations
   −1 000 000`, et un lecteur appliquant le signe montré ligne à ligne tombait à côté du résultat.
   ⚠️ **Ma propre garde de recomposition contenait la preuve du défaut** : elle devait nier la ligne
   de charges à la main (`+ -val("Charges d'exploitation")`) pour tomber juste. Les deux lignes
   passent en positif, au compte de résultat comme au bilan.

Deux nits corrigés au passage : une fixture e2e dont le `fluxExploitation` ne recomposait plus, et
une anti-assertion asymétrique (`not.toContain('croissanceCaPct')` n'excluait pas
`croissanceProduitsPct`, que le message de croissance cite aussi).

**Vérification docker rejouée sur l'état final** (le correctif de signe touche l'export déjà
vérifié) : le PDF recompose `54 037,50 − 36 025,00 − 10 000,00 = 8 012,50`, et le bilan publie
`Actif immobilisé net 49 083,34 / dont amortissements cumulés 10 000,00`.

### Revue de sécurité — aucune vulnérabilité

Périmètre couvert : validation d'entrée sur les trois sources (HTTP, document ancien, rejeu d'une
version antérieure), couverture des **trois** chemins de calcul, intégrité comptable, fuite
d'information par le message de refus, déni de service, puis le référentiel habituel (auth,
autorisation/IDOR/multi-tenant, injection NoSQL, secrets, Docker/Redis/Kafka, désérialisation,
rejeu).

Deux points confirmés au passage :

- le message de refus interpole le **nom** du jeu, mais les trois appelants lisent ce document via
  `DossierScopedRepository` (fail-closed sur `tenantId` + `dossierId`), et la comparaison lève son
  `404 HYPOTHESES_INTROUVABLE` générique **avant** la garde de forme : un identifiant d'un autre
  tenant ne peut pas produire un 422 qui nomme sa ressource ;
- `dureeAmortissementAns` n'entre dans **aucune** boucle — `dotationExercice` est en O(1).

Deux observations sous le seuil de signalement, notées sans correctif : la garde accepte tout
entier ≥ 1 là où le DTO plafonne à 50 (non exploitable, le DTO est le seul écrivain et une durée
plus longue ne fait qu'une dotation plus petite) ; et `ComparaisonService` charge les ancres et la
fiscalité avant d'appliquer la garde de forme (coût borné à 5 snapshots, chargeur mémoïsé).
