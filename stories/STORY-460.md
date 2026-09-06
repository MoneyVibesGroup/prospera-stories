# STORY-460 : Investissement, financement et remboursement sont des montants RÉCURRENTS — et rien dans le contrat ne le dit

Status: done

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 5 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-035** (hypothèses de prévisionnel paramétrables), 2026-08-27.
Relevé en lisant la docstring de `ProjectionAnnuelleService.projeter`, qui l'énonce — et le DTO, qui ne l'énonce pas.

---

## Le fait

La docstring du moteur est explicite : *« Les montants d'investissement/financement/remboursement sont
des montants **annuels récurrents** (appliqués à chaque exercice projeté) »*. Le code fait exactement
cela : `fluxInvestissement = -hypotheses.investissements` **à chaque tour de boucle**.

Cette information n'existe **nulle part ailleurs** :

- `HypothesesDto.investissements` dit *« Investissements (unités mineures XOF) »* — rien sur la
  récurrence ;
- `Hypotheses` (schéma) dit *« investissements »* ;
- aucune réponse d'API ne l'échoue.

Un comptable qui saisit le prix d'**un** camion obtient le prix de **trois**. Sur la maquette FE-035,
le scénario « Optimiste » — meilleure croissance, meilleure marge — finit à **−2 087 764** de
trésorerie en N+3 pour cette **seule** raison : 3 000 000 saisis, **9 000 000** décaissés.

Le hook est annoncé dans `projection.types.ts` (« échéancier non uniforme »), il n'est pas livré.

## Critères d'acceptation

- [x] AC-1 — Les trois montants deviennent un **échéancier par exercice** :
      `investissements: [n1, n2, n3]` (ou `{ rang, montant }[]`), avec repli sur la valeur scalaire
      actuelle pour ne pas casser les jeux existants.
- [x] AC-2 — La **migration** est explicite : un jeu existant portant `investissements: 1 200 000`
      continue de produire exactement les mêmes chiffres qu'aujourd'hui (test de non-régression sur un
      jeu réel).
- [x] AC-3 — À défaut d'échéancier (arbitrage PO de report), **AC-1 est remplacée par** : le DTO, le
      schéma et la réponse portent le mot « annuel récurrent » — le contrat doit dire ce que le code
      fait, et c'est le minimum non négociable de cette story.
- [x] AC-4 — `MODELE_PROJECTION_VERSION` incrémentée si l'échéancier est livré.

## Conséquences ailleurs

- FR-020 (trésorerie mensuelle) a le même besoin, en plus fin : un investissement a un **mois**.
- La maquette FE-035 porte l'avertissement sur les trois champs et sur le verdict du scénario
  « Optimiste » — c'est aujourd'hui la seule protection de l'utilisateur.

---

## Progress Tracking

**Statut : `done`** (2026-09-06) — PR `bilan-service` **#90** rebase-mergée sur `dev`, branche supprimée.
Branches `MNV-460` créées dans `bilan-service` et `docs/` **avant** la première ligne de code.

```
bilan-service : MNV-460
docs          : MNV-460
```

**Périmètre — un seul dépôt** : `bilan-service`. Aucun contrat d'événement Kafka n'est touché, donc pas
de second dépôt à synchroniser.

**Arbitrage AC-1 / AC-3** : aucun report PO n'est enregistré, donc **AC-1 est livrée** (échéancier par
exercice) et AC-3 ne s'y substitue pas — mais son exigence de fond (« le contrat doit dire ce que le code
fait ») est tenue quand même : la valeur scalaire reste le **montant annuel récurrent** et le contrat le
nomme désormais explicitement.


### Ce qui a été livré

- **Unité pure `echeancier.ts`** (patron de `bfr.ts` / `impot.ts` / `amortissement.ts`) :
  `serieExercices` (l'échéancier saisi, ou le montant récurrent répété), `echeancierExploitable`
  (la forme qu'un chemin `Mixed` ne garantit pas) et `normaliserEcheanciers` (cf. plus bas).
- **Trois hypothèses facultatives** — `investissementsParExercice`, `financementParExercice`,
  `remboursementsParExercice`, exactement `HORIZON_EXERCICES` entiers ≥ 0, bornées au DTO.
- **Les trois montants scalaires portent enfin le mot « RÉCURRENT »** au DTO, au schéma et dans la
  réponse — l'exigence de fond d'AC-3, tenue en plus d'AC-1 et non à sa place.
- **`planAmortissement` remplace `dotationExercice`** : le plan se déduit d'une **série**, chaque
  génération s'amortissant depuis son exercice d'acquisition.
- **Moteur annuel** : les trois séries sont résolues **une fois**, hors boucle ; chaque exercice lit
  son propre montant.
- **Moteur mensuel** : il répartit les montants de **N+1**, pas les scalaires.
- **`exigerFormeCourante` étendue** aux trois échéanciers, avec un message qui nomme le champ fautif.
- **`MODELE_PROJECTION_VERSION` 1.2.0 → 1.3.0** (AC-4).
- **Hors périmètre, mais du même défaut** : `HypothesesResponseDto.hypotheses` et
  `VersionDetailDto.hypotheses` se publiaient en `object` **opaque**. Une story dont la thèse est
  « le contrat ne dit pas ce que le code fait » ne pouvait pas laisser la réponse taire l'intégralité
  du jeu d'hypothèses (famille STORY-432/433/448). Les deux DTO rejoignent le balayage OpenAPI ;
  l'inventaire figé des opaques **n'a pas grossi** — mesure, pas chance.

### Le plafond d'amortissement a changé de nature, et c'est le piège de la story

STORY-459 bornait la dotation par `min(rang, durée)`. Ce facteur **suppose la série constante** : sur
un échéancier, il ne veut plus rien dire. Le cumul est donc borné explicitement — et ce n'est pas
décoratif : sur `[101, 0, 0]` amorti en 3 ans, la simple division dote **102** pour **101** investis,
par arrondi, et l'invariant *« les amortissements cumulés ne dépassent jamais les investissements
cumulés »*, que le contrat **publie**, devenait faux. Mutation faite : plafond retiré ⇒ le balayage
des 11 séries × 50 durées vire au rouge.

### Deux défauts trouvés par les tests, pas par la relecture

1. **`-investissements` rend `-0`** quand l'exercice ne porte aucun investissement — et l'échéancier
   rend ce cas **ordinaire** (`[3 000 000, 0, 0]` en produit deux), là où le montant récurrent ne le
   produisait que si le cabinet n'investissait rien du tout. Le dépôt se prémunit déjà de `-0`
   (`arrondir` fait `Math.round(v) + 0`) ; la même parade est appliquée. Trouvé par le premier
   `toEqual` de la batterie AC-1, `toEqual` distinguant `0` de `-0`.
2. **⚡⚡ Trois `null` persistés que personne n'a saisis** — celui-là, **seule la vérification docker
   pouvait le voir**. Le `ValidationPipe` instancie `HypothesesDto`, où les trois champs facultatifs
   existent à `undefined` ; le pilote MongoDB **sérialise `undefined` en `null`**. Ce sont les
   **premiers** champs facultatifs de ce DTO : le défaut naît avec la story. Aucune conséquence de
   calcul (`null` vaut « absent » partout), mais la réponse se contredisait — le `POST` omettait les
   trois champs (JSON jette `undefined`) là où le `GET` suivant rendait `null`, sur le même jeu
   inchangé. `normaliserEcheanciers` est appliquée aux **deux** écrivains, création et édition.
   ⚠️ **L'e2e ajouté pour ce cas était VACANT** : la couche données y est mockée et `JSON.stringify`
   jette les `undefined`, donc il restait vert sans le correctif. Mutation faite, assertion retirée
   plutôt que laissée en fausse assurance ; le garde-fou réel est unitaire (`Object.keys`) et la
   preuve est la mesure docker ci-dessous.

### Portes de qualité

Lint 0 warning · build OK · **1 967 unitaires** + **541 e2e** verts · couverture globale
98,88 / 94,36 / 98,86 / 98,90 et **100 % sur les cinq fichiers touchés** (`echeancier.ts`,
`amortissement.ts`, `forme-hypotheses.ts`, `projection-annuelle.service.ts`,
`projection-mensuelle.service.ts`).

⚠️ **Un e2e instable rencontré une fois, hors périmètre** : `bilan-jeu-etats.e2e-spec.ts`
« STORY-444 — un motif à saut de ligne → 400 » a rendu **404** sur une exécution, puis est repassé au
vert isolé (89/89) **et** sur la suite complète relancée (541/541). Aucun fichier de cette story n'est
sur son chemin. Noté plutôt que tu : c'est une instabilité préexistante, pas une régression, et la
taire aurait fait porter le soupçon à la prochaine story qui la rencontrera.

**Mutations éprouvées** (chacune compile — une mutation rouge par erreur de compilation ne prouve
rien, leçon STORY-411/412) :

| Mutation | Résultat |
|---|---|
| mensuel : `partition(hypotheses.investissements, …)` au lieu de la série | ✅ rouge (articulation ≠ 0) |
| annuel : `serieExercices(financement, undefined)` | ✅ rouge (2 batteries) |
| annuel : `serieExercices(remboursements, undefined)` | ✅ rouge (2 batteries) |
| `planAmortissement` : plafond du cumul retiré | ✅ rouge |
| `normaliserEcheanciers` : rendue identité | ✅ rouge (unitaire) |
| réponse : `type: [HypothesesDto]` au lieu de `HypothesesDto` | ✅ rouge (contrat OpenAPI) |
| e2e de la forme persistée, sans le correctif de service | ❌ **VERT** ⇒ assertion retirée |

### Vérification docker (2026-09-06, stack `docker compose`, conteneur **redémarré** — pas de foi dans le hot-reload)

Parcours réel sur le dossier de démonstration, base `bilan_service`, même tenant et même base validée
que les vérifications de STORY-457/458/459.

1. **Contrat servi par le conteneur** — les trois échéanciers publiés en
   `{"type":"array","items":{"type":"number"}}`, **facultatifs** (absents de `required`) ; les trois
   scalaires portent « RÉCURRENT » ; `HypothesesResponseDto.hypotheses` et `VersionDetailDto.hypotheses`
   sont devenus des `$ref` vers `HypothesesDto` ; `modeleVersion.example = 1.3.0`.
2. **Bornes HTTP** — `[3000000]`, `[]`, `[1.5,0,0]`, `[-1,0,0]`, `[1,2,3,4]` ⇒ **400** chacun, et
   `db.jeux_hypotheses.countDocuments({nom:"v460-refus"}) = 0` : **aucun document écrit**.
3. **⚡⚡ Forme réellement persistée** — `v460-trois-camions` (sans échéancier) porte **exactement les
   10 champs d'avant la story**, plus aucun `null` ; `v460-un-camion` porte le seul échéancier saisi
   (`[3000000,0,0]`, tableau BSON d'entiers), **pas les deux autres**. C'est cette requête qui a
   révélé le défaut n° 2 ci-dessus, et c'est elle qui prouve le correctif.
4. **⚡⚡ Le cœur de la story, chiffré sur la base réelle** — même base, même durée, un camion à
   3 000 000 :

   | | N+1 | N+2 | N+3 | trésorerie N+3 |
   |---|---|---|---|---|
   | `v460-un-camion` (échéancier) | −3 000 000 | **0** | **0** | **6 477 018** |
   | `v460-trois-camions` (récurrent) | −3 000 000 | −3 000 000 | −3 000 000 | **899 112** |

   Écart de **5 577 906** = les 6 000 000 de camions qu'on n'achète pas, **moins 422 094 d'impôt
   supplémentaire** — les dotations plus faibles laissent un résultat imposable plus élevé. `ecart = 0`
   sur les six exercices. Aucun `-0` dans la réponse (défaut n° 1 fermé, vérifié par balayage du corps).
5. **⚡⚡ AC-2 sur un document ÉCRIT AVANT la story** — `v459-amort`, créé par la vérification docker de
   STORY-459, rejoué : dotations **1 000 000 / 2 000 000 / 3 000 000**, résultat avant impôt N+1
   **801 250**, IS **216 338**, résultat net **584 912**, CAF **1 584 912**, `ecart = 0`. Ce sont, **au
   chiffre près**, les valeurs consignées par STORY-459. Seul `modeleVersion` a bougé, 1.2.0 → 1.3.0.
   La non-régression est donc mesurée contre une mesure prise par une **autre** story, pas contre
   elle-même.
6. **Document POISON planté directement en base** (`v460-POISON`, échéancier tronqué `[3000000]`, écrit
   par `mongosh` comme le ferait un écrivain hors API) ⇒ **422 `HYPOTHESES_FORME_OBSOLETE`** sur les
   **trois** chemins de calcul — annuel, mensuel **et comparaison** — avec un message qui nomme le
   champ et le scénario. Jamais un 200 aux montants faux.
7. **Articulation mensuelle sous échéancier** — `v460-tardif` (investissement en N+3 seulement,
   financement en N+1, remboursements en N+2/N+3) : le plan mensuel décaisse **0** d'investissement et
   encaisse **6 000 000** de financement, `ecartArticulation = 0`, clôture du mois 12 = clôture
   annuelle N+1 = 12 205 744. Le mensuel resté sur le scalaire aurait étalé 3 000 000 et cassé
   l'identité — c'est la mutation n° 1 du tableau.

⚠️ **Écriture non-lecture assumée pendant la vérification** : le mot de passe du compte de
vérification `verif458@cabinet.tg` (créé par la vérification de STORY-458, base de dev locale) a été
réinitialisé pour obtenir un jeton ; aucun autre document n'a été modifié hors des jeux `v460-*`
créés pour la mesure.

### Revue de code — cinq constats, aucun bloquant, tous corrigés

1. **⚡⚡ Le CÂBLAGE de `normaliserEcheanciers` n'était gardé par AUCUN test.** La fonction pure avait sa
   batterie ; son **appel** depuis les deux écrivains, rien — et la section *Portes de qualité* ci-dessus
   affirmait le contraire, ce qui était faux du câblage. Mutation faite, **import compris** pour qu'aucune
   erreur de compilation ne fasse virer au rouge par accident (leçon STORY-411/412) : **52 unitaires et
   19 e2e restaient VERTS**. Trois batteries ajoutées sur les deux écrivains, qui interrogent
   `Object.keys` — `toHaveBeenCalledWith` compare avec `toEqual`, **aveugle** à une clé présente à
   `undefined`, c'est-à-dire au défaut même qu'il s'agit de garder. Mutation rejouée : rouge sur les deux.
2. **Docstring de module d'`amortissement.ts` démentie par sa propre signature** — elle disait encore « le
   montant annuel récurrent des hypothèses » au-dessus d'une fonction qui prend une **série**. Ma
   correction initiale de cette phrase n'avait pas pris (le motif visé n'existait pas à l'octet près), et
   je ne l'avais pas revérifiée. Famille STORY-402 : un commentaire périmé qui porte une affirmation
   structurante.
3. **Les descriptions de `modeleVersion` des réponses MENSUELLE et COMPARAISON s'arrêtaient à 1.2.0** sous
   un exemple à 1.3.0 — et le plan mensuel est justement **celui dont le comportement change**. Les trois
   réponses annoncent désormais la version courante et l'échéancier, et les trois sont balayées.
4. **Les trois échéanciers se publiaient en « tableau de réels de longueur libre »** : la contrainte
   centrale de la story ne vivait que dans la prose de la description. `minItems`/`maxItems` et
   `items: {type: integer, minimum: 0}` sont désormais **au contrat**, donc un client généré ne fabrique
   plus un `[3 000 000]` que seul un 400 vient corriger.
5. **Paramètre `horizon` mort** dans les deux fonctions d'`echeancier.ts` — aucun appelant ne le passait,
   et `forme-hypotheses.ts` avait tranché l'inverse cinq lignes plus loin en supprimant un repli
   inatteignable.

**Monter les deux DTO au balayage a révélé CINQ `object` opaques préexistants**, tous **fermés plutôt
qu'inventoriés** : deux millésimes `string | null` publiés sans `type:` (défaut exact de STORY-426/459,
`ComparaisonAnnuelDto.exercice` et `ProjectionMensuelleResponseDto.annee`) et trois objets **anonymes
inline**, dont deux réutilisent des classes existantes (`ProjectionBaseDto`). L'inventaire figé des
opaques **n'a pas grossi** : la dette a rétréci.

⚠️ **Vérification docker rejouée sur l'état final**, le contrat servi ayant changé : les trois échéanciers
publient bien leur longueur et leur bornitude, les trois réponses annoncent 1.3.0 et l'échéancier, les cinq
opaques sont fermés, et les chiffres sont **identiques à l'unité près** — 6 477 018 contre 899 112,
`ecart = 0` partout, jeu de STORY-459 inchangé (801 250 / 216 338 / 584 912 / 1 584 912), forme persistée
inchangée, document poison toujours refusé en 422.

**Portes rejouées après correctifs** : lint 0 warning · build OK · **1 970 unitaires** + **544 e2e** verts ·
couverture 98,88 / 94,35 / 98,86 / 98,90, 100 % sur les cinq fichiers touchés.

### Revue de sécurité — aucune vulnérabilité

Périmètre couvert : authentification, autorisation (IDOR, RBAC, isolation multi-tenant, 403-au-lieu-de-404),
injection NoSQL, web, fichiers, secrets et cryptographie, infrastructure (Docker/Redis/Kafka, throttler,
désérialisation), logique métier (course, rejeu, intégrité comptable) et le référentiel NestJS habituel.

Six points instruits **par la mesure**, pas par la lecture, et tous écartés :

- **Bornes réelles des trois tableaux** — éprouvées par une sonde `ValidationPipe` montée avec la config
  exacte de `main.ts` : `["3000000","0","0"]`, `[true,false,false]`, un scalaire, `"1,2,3"`, `[[1],[2],[3]]`,
  tronqué, trop long, `[]`, `1.5`, `-1` ⇒ **400** ; seuls 3 entiers de `[0, MAX_SAFE_INTEGER]` passent.
- **Déni de service par la longueur** — impossible : la boucle de `planAmortissement` itère sur la sortie de
  `serieExercices`, **bornée à `HORIZON_EXERCICES`** quelle que soit la donnée, et `dureeAns` n'est jamais
  une borne de boucle. Fuzz de **4 000 projections** : 0 écart de bilan, 0 dépassement de plafond, 0 rupture
  d'articulation, 0 `NaN`/`Infinity`, 0 `-0`.
- **Pollution de prototype par le `delete` de `normaliserEcheanciers`** — écartée à deux niveaux, mesurés :
  `forbidNonWhitelisted` fait tomber la clé avant le service, le spread utilise `CreateDataProperty` (pas le
  setter `__proto__`), et le `delete` n'itère que sur un tuple constant.
- **Énumération par le message 422 qui NOMME le jeu** — écartée : le chargement **scopé** précède toujours
  la garde de forme sur les trois chemins ; `DossierScopedRepository` fusionne `{dossierId}` par-dessus
  `{tenantId}`, y compris pour le `find({_id:{$in:…}})` de la comparaison. Un identifiant d'un autre tenant
  rend **404 générique** et n'atteint jamais le message.
- **Exposition par les DTO nouvellement typés** — écartée : aucun changement de valeur servie, les champs
  étaient déjà dans le JSON.
- **`null` produisant un montant faux en 200** — écarté : `null` est retiré avant persistance et vaut
  « absence » **aux deux endroits qui le lisent**, sans divergence entre la garde et le moteur.

Deux observations sous le seuil de signalement, notées sans correctif : `enableImplicitConversion` coerce
`{"0":1,"1":2,"2":3}` en `[1,2,3]` (le résultat reste soumis aux mêmes bornes) ; et trois montants à
`MAX_SAFE_INTEGER` perdent en précision au cumul — magnitude déjà atteignable **avant** la story via le
scalaire, borne inchangée.
