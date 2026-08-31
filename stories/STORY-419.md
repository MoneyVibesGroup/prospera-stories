# STORY-419 : Une règle de rattachement peut être enregistrée, listée, affichée « posée »… et n'agir sur rien

Status: in_progress

**Épic :** EPIC-020 — Cahiers & rattachement (Atelier Balance)
**Service :** `balance-service` (`:3007`) — `modules/cahiers/rattachement`
**Points :** 3 · **Sprint :** S20
**Origine :** relevée le **2026-08-26** en construisant la maquette **FE-046**, à la revue « expert-comptable venant de Sage » demandée par le PO.

---

## Le fait, relevé à la source

Une règle de rattachement (`surcharge`) peut être **sans effet** de deux façons différentes, et
`SurchargeRattachementDto` n'en publie **aucune**.

### ① Le compte visé n'est plus au plan — le serveur IGNORE la règle, en silence

```ts
// rattachement.regles.ts — proposerRattachement
const surcharge = resoudreSurcharge(entree, surcharges);
if (surcharge && compteDeposable(surcharge.compte)) {   // ⬅ le test
  return { compte: surcharge.compte, /* … */ surcharge: true };
}
const proposition = proposerCompteProduit(entree);      // ⬅ on retombe sur le moteur
return { ...proposition, surcharge: false };
```

Le commentaire du fichier assume la décision, et elle est **bonne** :

> *« Une surcharge dont le compte n'est **plus** reconnu (référentiel changé depuis) est
> **ignorée** au profit du moteur… La règle reste en base — c'est à lui de la corriger, pas au
> système de la supprimer dans son dos. »*

Sauf que « c'est à lui de la corriger » suppose qu'**on le lui dise**. `GET
…/rattachement/surcharges` rend `id`, `type`, `valeur`, `valeurSaisie`, `compte`, `parUserId`,
`le` — et **rien** sur l'applicabilité. La règle s'affiche exactement comme une règle vivante.

### ② La clé ne correspond à aucune ligne — parce que la comparaison est EXACTE

```ts
// rattachement.regles.ts — resoudreSurcharge
const trouvee = surcharges.find(
  (s) => s.type === candidat.type && s.valeur === candidat.cle,   // ⬅ égalité stricte
);
```

Alors que le moteur de mots-clés, lui, compare par **inclusion** :

```ts
// cahiers-recettes.regles.ts — proposerCompteProduit
const trouve = regle.motsCles.find((mot) => ligne.includes(mot));
```

⇒ **L'asymétrie est à l'envers de ce qu'un comptable attend** : la devinette de la machine est
plus large que la règle délibérée de l'humain. Une règle `TIERS « SODIGAZ »` ne prend **ni**
« SODIGAZ SA » **ni** « Sodigaz Lomé ». Elle est acceptée (`200`), listée, tracée — et prend
zéro ligne.

⚠️ C'est le **jumeau** de **STORY-400** (`bilan-service` : surcharge en égalité stricte contre
un référentiel qui rattache par préfixe, « acceptée-puis-inerte »). **Deuxième occurrence du
même patron, dans un second service** — donc un angle mort de conception, pas un oubli isolé.

---

## Ce que ça coûte, concrètement

Le cabinet fait le geste, voit la règle dans la liste, et **croit le travail fait**. Six mois
plus tard, le chiffre d'affaires est ventilé comme si la règle n'existait pas — et personne ne
remonte de la balance vers la règle morte.

⇒ **Contournement en place (maquette FE-046), et il ne tient qu'à moitié** : l'écran croise
`GET /referentiels/plan-comptes` (STORY-394) avec les lignes de l'exercice déjà chargées pour
recalculer les deux verdicts côté client. **Ça marche**, mais c'est une vérité que **chaque
client devra reconstruire**, à partir de règles métier qui vivent côté serveur — exactement ce
que NFR-A06 refuse ailleurs. Et le second calcul (la portée) coûte au client de charger toutes
les transactions de l'exercice pour compter des égalités de chaînes.

---

## Ce qui est demandé

Enrichir `SurchargeRattachementDto` de **deux champs**, calculés là où l'information vit :

```ts
@ApiProperty({ description:
  'La règle est-elle APPLICABLE ? Faux si son compte n’appartient plus au plan de comptes ' +
  'actif — le moteur l’ignore alors et retombe sur les mots-clés.' })
applicable!: boolean;

@ApiProperty({ description:
  'Nombre de lignes de l’exercice que cette règle prend RÉELLEMENT (égalité stricte sur la ' +
  'clé normalisée). Zéro = règle sans effet.' })
lignesPrises!: number;
```

1. **`applicable`** est le test que le serveur fait déjà : `referentiel.isCompteDeDetail(compte)`.
   Zéro logique nouvelle, un booléen à publier.
2. **`lignesPrises`** demande un exercice de référence ⇒ le paramétrer :
   `GET …/rattachement/surcharges?exercice=2026`. **Sans le paramètre, le champ est omis** —
   jamais `0`, qui se lirait « règle morte » là où il faut lire « on n'a pas compté ».
3. ⚠️ **Le format de réponse ne se met pas à `{ regles: [...] }`** sans le dire : la route rend
   aujourd'hui un tableau nu (`ApiOkResponse({ type: [SurchargeRattachementDto] })`). Si
   l'enveloppe change, c'est un **changement cassant** à annoncer au front.

---

## Critères d'acceptation

1. `GET …/rattachement/surcharges` publie `applicable` sur chaque règle.
2. Une règle dont le compte a disparu du plan rend `applicable: false` — testé **contre un
   référentiel différent de celui de l'écriture**, pas contre un plan bricolé.
3. Avec `?exercice=`, chaque règle porte `lignesPrises` ; sans, le champ est **absent**.
4. `lignesPrises` compte sur la **clé normalisée** (`cleSurcharge`), donc identiquement à ce que
   `resoudreSurcharge` prendrait — un test doit rougir si l'un des deux passe en `includes`.
5. OpenAPI régénéré ; types du front régénérés.

---

## Notes

- ⚠️ **Question laissée ouverte, et elle est de produit** : faut-il *aussi* permettre une règle
  **par préfixe** (« SODIGAZ* ») ? STORY-400 pose la même question côté `bilan-service`. Les
  deux devraient être tranchées **ensemble** — deux réponses différentes au même geste seraient
  pires que l'absence des deux. Cette story-ci ne l'anticipe pas : elle rend seulement le
  problème **visible**, ce qui est le préalable.
- Voir [[FE-046]] (maquette), `stories/STORY-400.md` (le jumeau), `stories/STORY-394.md`.

---

## Progress Tracking

**Statut : `in_progress`** — démarrée le **2026-08-31**, branches `MNV-419` sur `docs/` et
`balance-service`. PR module **#76**. **Un seul dépôt.**

### Conception

| Décision | Ce qu'elle tranche |
|---|---|
| **D-419-1** | ⛔ **Le décompte PASSE PAR `resoudreSurcharge`, il ne le réimplémente pas.** Une seconde implémentation de « quelles lignes cette règle prend » divergerait au premier correctif — et c'est **exactement** la divergence que la story existe pour rendre visible. Conséquence **voulue** : l'**éclipse** est respectée. Le libellé primant sur le tiers, une ligne dont le libellé matche une règle `A` n'est **pas** comptée pour la règle `TIERS` `B` qu'elle matche aussi — `B` ne la prend pas, et le dire autrement **sur-déclarerait sa portée**. Une règle systématiquement éclipsée prend donc `0`, ce qui est la vérité. |
| **D-419-2** | **`applicable` et `lignesPrises` restent ORTHOGONAUX.** Une règle peut porter sur **douze** lignes **et** viser un compte disparu du plan. Les fondre en `0 / false` laisserait le cabinet ignorer s'il doit corriger la **clé** ou le **compte** — « douze lignes concernées, compte hors plan » est le seul message actionnable. |
| **D-419-3** | `lignesPrises` est **absent** sans exercice désigné, **jamais `0`** (`0` se lirait « règle morte » là où il faut lire « on n'a pas compté »). ⚠️ **Mais un exercice FOURNI et INVALIDE est refusé en 400**, jamais assimilé à une absence : un client croirait qu'on a compté et lirait « aucune règle n'agit ». C'est la distinction **absent ≠ invalide**, et elle est testée des deux côtés. |
| **D-419-4** | `applicable` réutilise **exactement** le prédicat du moteur (`isCompteDeDetail`), y compris dans la réponse du **`PUT`**, où il est **calculé** et non posé à `true` en dur. La valeur y est nécessairement vraie — `validerCompte` vient de l'exiger — mais la **dériver du même prédicat** interdit que la réponse du `PUT` contredise un jour celle du `GET`. |
| **D-419-5** | **Seul le cahier de RECETTES est parcouru.** Une règle de rattachement vise un compte de **classe 7** (validé à l'écriture), et les dépenses passent par le `compteCharge` de leur **catégorie** — qui **est déjà** la surcharge `(org, catégorie) → compte` (D-085-6). Compter les dépenses annoncerait une portée que le moteur n'exerce nulle part. |
| **D-419-6** | La réponse **reste un tableau nu**. La story prévenait qu'une enveloppe `{ regles: [...] }` serait un changement cassant : le test de contrat OpenAPI le **verrouille** désormais (`type: array` + `$ref`), pour qu'un futur enrichissement ne l'introduise pas par inadvertance. |

### Implémentation

| Fichier | Ce qui change |
|---|---|
| `rattachement/types/rattachement.ts` | `SurchargeEvaluee extends SurchargeRattachement` (+ `applicable`, `lignesPrises?`) |
| `rattachement/rattachement.regles.ts` | `compterLignesPrises` — **pure**, clé = la **référence** de la règle (son `id` est facultatif au type) |
| `rattachement/rattachement.service.ts` | `lister` charge le référentiel et, **si et seulement si** un exercice est désigné, le cahier de recettes |
| `rattachement/rattachement.controller.ts` | `@Query() ExerciceQueryDto` **réutilisé** (pas un DTO de plus), 400 documenté |
| `dto/surcharge-rattachement.dto.ts` | `applicable` requis, `lignesPrises` facultatif |
| `test/openapi-contract.e2e-spec.ts` | ⛔ **le seul filet** : `*.dto.ts` est hors `collectCoverageFrom` |

### Portes DoD

lint **0 warning** · build OK · **3 378** unitaires · **844** e2e (26 suites) · couverture
**99,14 / 92,27 / 98,61 / 99,24** — `rattachement.regles.ts` et `rattachement.service.ts` à
**100 %** lignes et fonctions.

⚠️ **Deux branches restent non couvertes, et elles sont inatteignables** : les `?? 0` sur
`Map.get`. `resoudreSurcharge` rend un élément **du tableau** (`find`) et la table est semée depuis
ces mêmes règles — le `??` satisfait le **type**, pas un cas. Les retirer exigerait une assertion
non nulle, qui serait un mensonge de plus dans le même sens ; c'est **documenté sur place** pour
qu'une passe anti-complexité ne les « nettoie » pas à tort.

### ⚠️ Un changement de comportement de REQUÊTE, là où la story surveillait la réponse

La story prévenait qu'une enveloppe `{ regles: [...] }` serait un changement cassant — et le
contrat la verrouille (D-419-6). Mais le changement cassant, si petit soit-il, est **du côté de la
requête** : la route n'avait **aucun** `@Query()`, donc `forbidNonWhitelisted` n'avait rien à
filtrer et un paramètre inconnu était **ignoré**. Avec `ExerciceQueryDto`, `?foo=bar` sur
`GET …/rattachement/surcharges` passe désormais en **400**.

C'est un **durcissement**, cohérent avec tout le reste du service — mais il se **constate**, il ne
se découvre pas en production. Relevé par la revue de sécurité, consigné ici.

### Passe de mutation — 8 mutations, 8 rouges, 8 compilent

| # | Mutation | Verdict |
|---|---|---|
| M1 | le décompte passe en **inclusion** au lieu de l'égalité stricte | 🔴 |
| M2 | l'**éclipse** ignorée : chaque règle compte indépendamment | 🔴 |
| M3 | les règles sans ligne **absentes** de la table au lieu d'être à zéro | 🔴 |
| M4′ | `applicable` dérivé du **mauvais test** | 🔴 |
| M5 | `lignesPrises` publié à `0` au lieu d'être **absent** sans exercice | 🔴 |
| M6′ | un exercice invalide **avalé** au lieu d'être refusé | 🔴 |
| M7 | `applicable` rendu **facultatif** au contrat | 🔴 |
| M8 | `lignesPrises` rendu **requis** au contrat | 🔴 |

⚠️ **M4 et M6 ont d'abord été REJETÉES** — supprimer l'usage d'une variable la rend « déclarée et
jamais lue » (`noUnusedLocals`), donc la mutation ne compilait pas et **n'aurait rien prouvé**
(leçon STORY-411/412). Rejouées sous une forme compilable (`applicable` dérivé d'un autre test
toujours vrai ; l'exception conservée derrière une condition impossible), **les deux rougissent**.

### Vérification docker — la règle inerte se démasque, et le contrôle DISCRIMINE

Stack réelle, tenant réel, **deux règles** et **trois recettes** créées **par l'API** :

| Règle | compte | `applicable` | `lignesPrises` |
|---|---|---|---|
| `SODIGAZ` | 706 | `true` | **1** |
| `TOTAL ENERGIES` | 707 | `true` | **0** |

⚡ **« SODIGAZ SA » n'a PAS été pris** par la règle `SODIGAZ` : l'égalité stricte, mesurée sur le
service réel. ⛔ **`TOTAL ENERGIES` : enregistrée, listée, tracée — et zéro ligne.** C'est
littéralement le titre de la story, servi par le contrat.

**Sans exercice**, `lignesPrises` est **absent** des deux règles (et le cahier de recettes n'est pas
lu). **Avec `?exerciceDebut=` seul**, la réponse est **`400 EXERCICE_INDETERMINE`** — jamais un
comptage silencieusement omis.

**AC-2 sur la machine, avec un VRAI second référentiel** : une règle sur `781` (« Transferts de
charges », présent au plan `syscohada-revise@2.1`) est écrite, puis le référentiel de
l'organisation est basculé sur **`sfd-bceao@2.0`**, dont aucune racine ne préfixe `781`.

```
Transfert de charges   compte 781   applicable=False
SODIGAZ                compte 706   applicable=True
TOTAL ENERGIES         compte 707   applicable=True
```

⚡ **Et c'est le contrôle qui discrimine** : `706` et `707` restent `true` sous le même référentiel
basculé. Un prédicat constamment faux aurait passé le premier test et échoué celui-ci.
