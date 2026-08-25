# STORY-390 : L'analyse ne dit pas avec quel séparateur ni quel encodage elle a lu le fichier

**Epic :** EPIC-021 — Import & migration Sage (profils d'import)
**Réf. :** écart remonté par **FE-048** *(profil d'import & mapping réutilisable)*, 2026-08-24 — prolonge **STORY-088**
**Priorité :** Should Have
**Story Points :** 2
**Statut :** done
**Date de clôture :** 2026-08-25
**Complexité :** low
**Sprint :** 20
**Service :** `balance-service` (`:3007`)

---

## Le constat

`POST /dossiers/{id}/imports/analyser` **auto-détecte** le séparateur d'un CSV (`;`, `,`, tab) et
lit en `utf-8` sauf mention contraire. C'est le bon défaut.

Mais la réponse ne dit pas ce qui a été retenu :

```ts
// AnalyseFichierResponseDto — ce qui est publié
colonnesDetectees, ligneEntete, ligneDebutDonnees, apercu, cible,
mappingPropose, manquants, signature, profilReconnu, formatFichier
//  ↑ ni `separateur`, ni `encodage`
```

Or `CreerProfilImportDto` les **accepte** — et le profil est censé rejouer la lecture que l'analyse
vient de faire.

## Pourquoi c'est un vrai trou, et pas une coquetterie

Le client n'a que deux façons de remplir ces deux champs, et **aucune n'est correcte** :

- **recopier ce qu'il a imposé** — ne marche que s'il a imposé quelque chose. Dans le cas nominal
  (auto-détection), il n'a rien à recopier ;
- **deviner** — poser `;` « parce que c'est fréquent au Togo ». Le profil figerait alors un choix
  que personne n'a fait, et qui peut différer de celui que le serveur a réellement employé.

`FE-048` a donc retenu la seule option honnête : **ne rien poser quand rien n'a été imposé**, et
laisser le serveur re-détecter à l'import. C'est cohérent tant que la détection est déterministe et
que le fichier ne change pas.

⚠️ **Et c'est exactement là que ça casse.** La signature de reconnaissance automatique est calculée
sur les en-têtes **tels qu'ils ont été lus**. STORY-088 le documente déjà comme un piège payé
(« un latin1 lu en utf-8 fige une signature abîmée »), et la parade retenue était de rendre
`separateur`/`encodage` paramétrables **dès `/analyser`**. La parade est bonne — elle est
simplement **à moitié posée** : on peut imposer les réglages, on ne peut pas savoir lesquels ont
servi.

Conséquence concrète, sur un export dont le séparateur varie d'un mois sur l'autre (cas réel : un
logiciel qui bascule `;` → `,` selon la locale du poste qui exporte) :

1. janvier — analyse auto-détectée en `;`, signature `S1`, profil enregistré **sans séparateur** ;
2. février — même fichier logique, exporté en `,`. Auto-détection en `,`, en-têtes identiques mais
   lus comme **une seule colonne** si les guillemets diffèrent ⇒ signature `S2 ≠ S1` ;
3. le profil n'est **pas reconnu**. Il est actif, intact, correctement mappé — et invisible.

Le comptable n'a aucun moyen de comprendre pourquoi : ni l'écran ni la réponse ne mentionnent le
séparateur, puisqu'il n'est jamais rendu.

## Ce qui est demandé

Ajouter les deux champs **effectivement retenus** à la réponse d'analyse :

```ts
// AnalyseFichierResponseDto
@ApiPropertyOptional({ enum: SEPARATEURS_CSV, description: 'Séparateur retenu (imposé ou auto-détecté). Absent pour un XLSX.' })
separateur?: SeparateurCsv;

@ApiProperty({ enum: ENCODAGES, description: 'Encodage retenu pour la lecture.' })
encodage!: Encodage;
```

Ils existent déjà dans `ProfilParserService` au moment où il lit le fichier : il s'agit de les
faire remonter, pas de les calculer.

⚠️ **`separateur` reste facultatif** : un XLSX n'en a pas. Le rendre obligatoire obligerait à
inventer une valeur pour la moitié des fichiers.

## Critères d'acceptation

1. `POST …/imports/analyser` sur un **CSV** renvoie le `separateur` réellement employé, qu'il ait
   été imposé ou auto-détecté.
2. La même route sur un **XLSX** omet `separateur` et renvoie `encodage`.
3. Un profil créé en recopiant ces deux champs, puis employé à l'import du **même fichier**, est
   reconnu par signature (test e2e de bout en bout).
4. Le contrat est publié en énumération dans `/api/docs-json` (pas en `string` libre).

## Effet côté frontend, une fois livrée

`ProfilMappingForm` cesse de recevoir les réglages par sa prop `reglages` — un contournement dont le
commentaire nomme déjà ce ticket — et les relit dans la réponse, comme il le fait déjà pour
`ligneEntete` et `ligneDebutDonnees`. Le profil enregistré porte alors **toujours** la façon exacte
dont son fichier d'exemple a été lu.

---

## Progress Tracking

**Statut : `done`** — implémentée, vérifiée en docker, revue, sécurisée et mergée le 2026-08-25.

### Décision de conception — D-390-1 : la **tabulation** entre dans le vocabulaire

L'énoncé ne la mentionne pas, et pourtant la story ne tient pas sans elle.

`detecterSeparateur` **teste déjà** la tabulation, et la description de `AnalyserFichierDto.separateur`
l'annonce mot pour mot (« auto-détecté parmi “;” “,” tab »). Mais `SEPARATEURS_CSV` ne valait que
`[',' , ';']` : la tabulation était **détectable et inexprimable**. Conséquence concrète, antérieure à
cette story — un export TSV se lisait parfaitement, et son profil ne pouvait **pas** enregistrer le
séparateur employé. La parade de STORY-088 était donc inapplicable à toute une famille de fichiers.

Publier `separateur` transforme cet écart en **faute de contrat**, et c'est l'AC-2 qui le décide : elle
fait de l'**absence** de `separateur` la signature d'un **XLSX**. Laisser un TSV sortir sans séparateur
rendrait cette absence **ambiguë** — le client ne saurait plus distinguer « ce fichier n'est pas délimité »
de « je ne sais pas dire son délimiteur ». Et l'AC-3 y ajoute une contrainte dure : ce que la **lecture**
publie doit être **acceptable par l'écriture**, sinon le round-trip qu'elle exige tombe en `400`.

Le vocabulaire est donc élargi **une fois, à un seul endroit**, et tout en dérive : `@IsIn` des trois DTO,
`enum` du schéma Mongo, corps multipart, énumérations publiées. `detecterSeparateur` rend désormais un
`SeparateurCsv` plutôt qu'une `string` — le compilateur devient le garde-fou qui empêche d'y faire entrer
un séparateur que l'énumération ne déclare pas.

### Les copies littérales — ce qui rendait l'élargissement dangereux

Trois listes recopiées à la main auraient survécu à l'élargissement en restant à deux valeurs :

| endroit | ce qu'il publiait | risque |
|---|---|---|
| `ProfilImportResponseDto` (3 champs) | `enum: [',', ';']`, `['utf-8','latin1']`, `['XLSX','CSV']` | contrat de **lecture** plus **étroit** que l'écriture |
| **corps multipart de `/analyser`**, écrit **à la main** dans le contrôleur | idem | un client généré n'aurait **jamais** pu imposer un TSV que `@IsIn` autorise |
| `profil-import.schema.spec.ts` | assertions sur littéraux | Mongo aurait **refusé** un séparateur que les DTO acceptent, et l'écart ne serait apparu qu'à l'écriture, en production |

⚠️ Le corps multipart est le cas le plus vicieux : `@ApiBody({ type })` ne sait pas décrire un
`multipart/form-data` mêlant binaire et champs, il est donc **écrit à la main** — sans compilateur
au-dessus. Toutes ces listes dérivent désormais des constantes, et `openapi-contract.e2e-spec.ts` **garde
l'égalité** entre ce que la route accepte et ce qu'elle publie.

### Ce qui a été livré

| | |
|---|---|
| `lireMatriceAvecReglages` | la lecture **rapporte** ce qu'elle a employé. Les réglages sortent **de là** — les recalculer chez l'appelant poserait une **seconde règle**, et deux règles qui décident de la même chose finissent par diverger. `lireMatrice` délègue et garde son contrat : ses **trois autres appelants** (Sage, relevés, profils) sont inchangés. |
| `AnalyseFichierResponseDto` | `separateur` **facultatif** (un XLSX n'en a pas) + `encodage` **requis** (il n'y a pas de lecture sans encodage), en énumérations **nommées** — côté client, une union de littéraux réutilisable. |
| `SEPARATEURS_CSV` | gagne `\t` (D-390-1). `detecterSeparateur` rend le type du contrat. |
| énumérations dérivées | `ProfilImportResponseDto`, `CreerProfilImportDto`, `ModifierProfilImportDto`, `AnalyserFichierDto` et le corps multipart référencent tous les **mêmes** schémas nommés. |

### Portes de qualité

`eslint --max-warnings 0` **0** · `nest build` **OK** · `test:cov` **2 984 / 2 984**, couverture
**98,98 st / 91,79 br / 98,17 fn / 99,06 li** (seuils 65/90/90/90) · `test:e2e` **709 / 709** (694 + 15).

### Diff OpenAPI `dev` → `MNV-390`

```
schémas AJOUTÉS  : ['Encodage', 'FormatFichier', 'SeparateurCsv']
schémas RETIRÉS  : []
MODIF AnalyseFichierResponseDto | props + ['encodage','separateur'] | required + ['encodage'] seul
MODIF CreerProfilImportDto / ModifierProfilImportDto / ProfilImportResponseDto
      | aucune propriété ajoutée ni retirée, `required` INCHANGÉ
      | enum INLINE → $ref partagé  (ex. {"type":"string","enum":[",",";"]} → {"allOf":[{"$ref":"…/SeparateurCsv"}]})
routes MODIFIÉES : ['/dossiers/{dossierId}/imports/analyser']
```

### Table de mutations exécutée (chacune restaurée)

| Mutation | Test attendu rouge | Constat |
|---|---|---|
| la lecture rapporte le réglage **demandé** au lieu de l'**appliqué** | `lireMatriceAvecReglages` + round-trip de signature | 🔴 3 rouges |
| le séparateur d'un XLSX est **inventé** au lieu d'être omis | « OMET le séparateur d'un XLSX » | 🔴 1 rouge |
| la tabulation **ressort** du vocabulaire | 4 tests (TSV, round-trip, schéma, vocabulaire décidé) | 🔴 4 rouges |
| le corps multipart publie un vocabulaire **plus étroit** | « le corps multipart publie le MÊME vocabulaire » | 🔴 1 rouge |
| `encodage` retiré de la réponse d'analyse | e2e AC-1 + AC-2 + AC-3 | 🔴 3 rouges |
| *(après revue)* un séparateur **déclaré mais jamais essayé** | « essaie TOUS les séparateurs déclarés » + 2 | 🔴 3 rouges |

🪤 Une mutation a d'abord rougi **pour la mauvaise raison** : remplacer `[...SEPARATEURS_CSV]` par un
littéral dans le contrôleur rendait l'import orphelin ⇒ `TS6133`, suite non compilée. Rejouée en
**rétrécissant** la liste dérivée (`.slice(0, 2)`) — le symbole reste lu, `tsc --noEmit` muet, et la garde
rougit sur ce qu'elle prétend garder.

### Vérification docker réelle — round-trip complet, 2026-08-25

| # | Appel | HTTP | Ce qui est prouvé |
|---|---|---|---|
| 1 | `POST …/imports/analyser`, CSV `;`, **rien d'imposé** | **200** | `separateur: ";"`, `encodage: "utf-8"` ⇒ **AC-1 sur le cas nominal** — celui, précisément, où le client n'avait rien à recopier |
| 2 | idem, fichier **TSV** | **200** | `separateur: "\t"` ⇒ **D-390-1** : le séparateur que le contrat ne savait pas dire |
| 3 | `POST …/imports/profils` **en recopiant** les deux réglages rapportés | **201** | l'écriture **accepte** ce que la lecture publie. Avant D-390-1 : `400 — separateur must be one of the following values: , ;` |
| 4 | le **même** fichier rejoué à l'analyse | **200** | `profilReconnu: "Export TSV …"` ⇒ **AC-3 de bout en bout, sur la vraie stack** |
| 5 | un **XLSX** | **200** | `separateur` **absent**, `encodage` rendu ⇒ **AC-2** |
| 6 | en base | — | `profils_import.separateur === "\t"` (comparaison stricte) ⇒ l'`enum` Mongo a bien suivi le vocabulaire, la valeur est **persistée**, pas seulement acceptée |

⚠️ **Observation, hors périmètre et non corrigée** : au cas 5, le XLSX porte les mêmes en-têtes que le TSV,
donc la **même signature**, donc le profil TSV lui est **proposé**. C'est le comportement d'origine — la
signature est l'empreinte des **en-têtes**, elle ne connaît pas le format — et il reste sûr : le profil
n'est jamais appliqué en silence (confirmation humaine requise), et `parserAvecProfil` **avertit** quand le
format du fichier diffère de celui du profil. Noté pour que ce ne soit pas relu comme une régression.

### Revue de code (⑥)

**2 constats**, non bloquants, **corrigés** avant le merge (commit dédié `63bab33`).

1. ⚡ **Le correctif réintroduisait la coupure que la story ferme ailleurs.** `SEPARATEURS_ESSAYES` — la
   liste de **priorité** de l'auto-détection — est une seconde liste retapée à la main depuis
   `SEPARATEURS_CSV`. Les deux ne *peuvent* pas partager le même ordre (l'une est un vocabulaire, l'autre
   une priorité où `;` gagne les ex æquo et sert de repli), mais elles doivent porter le **même
   ensemble** : un séparateur déclaré au contrat et jamais essayé serait **déclarable et introuvable** —
   le client peut l'imposer, l'analyse ne le rend jamais. Un test le garde désormais, et il passe par la
   **détection réelle** plutôt que par la liste interne : il rougit aussi si l'ordre d'essai existe mais ne
   sert plus. Mutation-testé (3 rouges).
2. `ENCODAGE_PAR_DEFAUT` était **exporté sans consommateur** hors du module — repassé privé, comme
   `ENCODAGE_LATIN1`. `SEPARATEURS_ESSAYES` remonte par la même occasion **avant** son unique lecteur
   (plus de zone morte temporelle si un appel au niveau module apparaissait).

🪤 **Le premier correctif a été effacé une fois par un `git checkout --` de restauration de mutation**, le
travail n'étant pas encore indexé. Réappliqué, puis **commité avant** de rejouer la mutation. *(Piège déjà
payé en STORY-385.)*

### Revue de sécurité (⑦)

**0 vulnérabilité.** Le point à discriminer était l'élargissement d'une entrée utilisateur qui pilote un
**parseur** :

- **aucun chemin vers un moteur de regex** — vérifié : `grep 'new RegExp\|RegExp('` sur tout le module
  d'import ne rend **rien**. `detecterSeparateur` fait `header.split(s)` avec une **chaîne** (pas un motif),
  et `decouperLigneCsv` est une boucle caractère par caractère (`c === sep`). Un séparateur ne peut donc
  pas provoquer de ReDoS, quel qu'il soit ;
- **`encodage` reste une valeur d'un couple fermé** passé à `Buffer.toString()` — deux encodages Node
  valides, jamais une chaîne libre. `@IsIn` + `whitelist`/`forbidNonWhitelisted` ferment l'entrée en amont ;
- **aucune divulgation neuve** : la réponse ne fait qu'**écho** de réglages que l'appelant a imposés ou qui
  se déduisent du fichier qu'il vient lui-même de déposer ;
- **aucune surface d'écriture ajoutée** : un seul littéral de plus dans une énumération déjà validée, côté
  DTO **et** côté schéma Mongo. Les profils restent org-keyed, derrière `@RequiresBalanceAccess` +
  `@RequiresDossierScope` ;
- **pas d'amplification** : `lireMatriceAvecReglages` fait exactement le travail de `lireMatrice`, la
  taille du fichier reste bornée par `TAILLE_MAX_IMPORT`.
