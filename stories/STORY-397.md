# STORY-397 : Les codes de réintégration sont validés mais jamais publiés — le comptable les tape à l'aveugle

Status: done

**Épic :** EPIC-020 — Cahiers & pièces (Atelier Balance)
**Service :** `balance-service` (`:3007`) — `referentiel` / `cahiers`
**Points :** 3 · **Sprint :** S20 · **Complexité :** medium
**Origine :** remontée le **2026-08-24** par **FE-044**, en dessinant le formulaire de
création d'une catégorie de dépense.

---

## Le fait, relevé à la source

Une catégorie de dépense peut porter un `codeReintegration`, et le serveur le **valide
strictement** contre les codes publiés par le paquet fiscal de l'exercice :

```ts
// cahiers-depenses.regles.ts — fail-closed, et c'est la bonne décision
export function estCodeReintegrationAdmis(code: string, codes: CodesReintegration): boolean {
  return codes.codes.includes(code);
}
```

Refus : `400 CODE_REINTEGRATION_INCONNU`. La règle est saine — un code de liasse ne se
suppose pas, et un paquet muet doit refuser **tous** les codes (sinon la réintégration
finit dans une case inexistante de la DSF, donc se perd au dépôt).

⛔ **Mais AUCUNE route ne publie la liste.** Vérifié : `GET /referentiels/actifs` rend
`fiscal.rubriquesCount` — **un compte**, pas les rubriques. Aucun contrôleur du service
n'expose `reintegrations_codes`, ni aucune autre rubrique du paquet.

⛔ **Et le paquet les publie SANS LIBELLÉS.** `togo@2026` porte
`reintegrations_codes: ["10","11","12",…]` — douze chaînes nues. Même en les exposant
telles quelles, rien ne dit lequel désigne « charges non justifiées » ou « amendes et
pénalités ». ⇒ fiché séparément le 2026-08-26 : **STORY-415**.

---

## ⚡ AMENDEMENT du 2026-08-26 — la portée de cet écart était SURESTIMÉE

Relevé en construisant la maquette **FE-050**. La phrase « **aucune** route ne publie la
liste » est vraie de `referentiel` et de `cahiers` — et **fausse du module fiscal** :

```ts
// fiscal-response.dto.ts — ResultatFiscalResponseDto
postesDsf!: PosteRetraitementResponseDto[];
// « Grille complète de la liasse : TOUS les codes du paquet, à 0 quand rien ne les
//   alimente, plus les postes sans code. » (D-091-11)
```

`construireTableauDsf` parcourt `codes.reintegrations` **puis** `codes.deductions` et pousse
un poste **pour chaque code publié**, avec son `sens`. Autrement dit
`GET /dossiers/{id}/fiscal/resultat-fiscal` **publie déjà la liste complète des codes admis
et leur sens**, dans une réponse que l'écran fiscal reçoit de toute façon.

**Deux conséquences, et elles vont en sens inverse :**

1. **FE-050 n'est PAS bloquée par cette story.** Son sélecteur de code se remplit de
   `postesDsf` — zéro appel supplémentaire, zéro code inventé, et le `sens` dérivé du code
   plutôt que choisi (ce qui rend aussi `SENS_INCOHERENT` inatteignable par construction).
   Laisser croire l'inverse aurait retardé une story qui était actionnable.
2. **Cette story reste entièrement nécessaire pour l'écran des CAHIERS** (FE-044), qui
   n'appelle pas `resultat-fiscal` — et ne devrait pas l'appeler pour ça : ce calcul peut
   refuser (`409 PAQUET_FISCAL_NON_PACKAGE`, `409 CLASSES_GESTION_NON_SOURCEES`,
   `404 BALANCE_INTROUVABLE`) pour des raisons étrangères à la saisie d'une catégorie de
   dépense. **Une liste de référence ne doit pas dépendre d'un calcul.**

⇒ Le périmètre ci-dessous ne change pas. Ce qui change, c'est le **consommateur** : FE-044,
pas FE-050. Et la leçon générale : *un écart se vérifie module par module — « aucune route »
veut souvent dire « aucune route que j'ai regardée ».*

---

## Ce que ça coûte, concrètement

Le comptable doit **taper un code de mémoire** pour recevoir un `400`, ou renoncer. Il
n'y a pas de troisième possibilité : l'écran ne peut offrir ni liste déroulante, ni
autocomplétion, ni même un message d'aide qui nommerait les valeurs admises.

⚠️ **Et la conséquence n'est pas cosmétique.** Sans code, la ligne reste bien
réintégrée — le **motif** (`CHARGE_NON_JUSTIFIEE`, `CATEGORIE_NON_DEDUCTIBLE`,
`DECISION_HUMAINE`) est toujours présent et c'est lui que STORY-091 agrège. Ce qui
manque, c'est **la case de la liasse**. Le résultat fiscal est juste ; le **dépôt de la
DSF**, lui, devra être complété à la main, poste par poste, hors de l'outil.

⇒ **Contournement en place (FE-044), et il est volontairement pauvre** : le champ est
**absent du formulaire de création** et rendu **en lecture seule** sur les catégories
qui en portent déjà un. Offrir un champ libre aurait été offrir un piège.

---

## Périmètre

**Inclus**

- Publier les codes de réintégration admis pour l'exercice courant de l'organisation.
  Forme la plus simple qui serve : un tableau `{ code, libelle? }` sur une route de
  lecture — soit en enrichissant `GET /referentiels/actifs` (volet `fiscal`), soit sur
  une route dédiée `GET /referentiels/reintegrations`.
- **`libelle` OPTIONNEL au contrat**, parce que le paquet n'en publie pas aujourd'hui.
  Le rendre obligatoire forcerait à **inventer** un libellé côté serveur — exactement ce
  que NFR-A06 interdit, avec une étape de plus.
- Un paquet qui n'en publie aucun rend **une liste vide**, jamais un 404 ni une erreur :
  « aucun code admis » est une réponse, et l'écran doit pouvoir la dire.

**Hors périmètre**

- **Deviner la correspondance motif → code.** `CodesReintegration.parMotif` existe déjà
  dans le service et est **vide** pour `togo@2026` : c'est une donnée du paquet fiscal,
  pas une règle à écrire. La remplir relève du **référentiel**, pas de ce service.
- Ajouter les libellés au paquet `togo@2026` — même raison : c'est un travail de
  référentiel fiscal, à traiter avec les sources OTR.

---

## Critères d'acceptation

1. Une route de lecture rend les codes de réintégration admis pour l'exercice courant
   de l'organisation, avec un `libelle` **optionnel**.
2. Un paquet sans code rend une **liste vide** (200), jamais une erreur.
3. La liste rendue est **exactement** celle que `estCodeReintegrationAdmis` accepte —
   un test le vérifie sur la **même source**, pas sur deux listes parallèles.
4. La route est soumise aux mêmes gates que le reste de l'Atelier
   (`@RequiresBalanceAccess`).

---

## Notes

- ⚠️ **Écart JUMEAU de STORY-394** (« aucune route n'énumère les comptes de classe 7 »),
  remonté par FE-043. Même forme exactement : *le serveur valide contre une liste qu'il
  ne publie pas*. Deux occurrences ⇒ ce n'est pas un oubli isolé, c'est un **angle mort
  de conception** — toute validation fail-closed contre un référentiel a besoin de sa
  route de lecture, sinon elle rend l'écran inutilisable là où elle voulait le protéger.
  ⇒ **Les livrer ensemble** est probablement plus économique que séparément.
- Créée par **FE-044**, qui a fait le choix de ne pas offrir le champ plutôt que d'offrir
  un champ libre menant au refus.

---

## Progress Tracking

**Statut : `done`** — implémentée, validée, vérifiée en docker, revue (code + sécurité), mergée en
rebase sur `dev`. Clôturée le **2026-08-27**.

**PR** : `prospera-balance-service` **#62**, 2 commits — feature (`39022b3`) puis revue (`4b320be`).
Un seul dépôt : la story ne touche aucun contrat d'événement.

### Décision de conception — QUEL paquet fiscal la route lit-elle ?

Il existe **deux** validateurs de `codeReintegration` dans le service, et ils ne résolvent pas le
même paquet :

| appelant | paquet résolu | pourquoi |
|---|---|---|
| `categories-depenses.validerCodeReintegration` | `chargerPaquetFiscal(orgId)` — **sans exercice** | une catégorie n'est **rattachée à aucun exercice** (D-083-3) |
| `cahiers-depenses.construireContexte` | `chargerPaquetFiscal(orgId, exercice)` | une **ligne** connaît son exercice, et son taux doit être celui-là |

Le consommateur de cette story est **FE-044, le formulaire de catégorie** — donc le premier. La
route résout le paquet **sans exercice**, ce qui la met sur la **source exacte** du validateur
qu'elle sert (AC-3). Un exercice arbitraire aurait publié une liste que ce validateur n'applique
pas : l'écart précis que l'AC-3 interdit.

### Livré

- **`GET /api/v1/referentiels/reintegrations`** — jumelle exacte de `plan-comptes` (STORY-394) :
  même contrôleur, mêmes gates (`@RequiresBalanceAccess` + `@Roles(TENANT_ADMIN, TENANT_USER)`),
  `orgId` **toujours** pris au JWT, jamais en paramètre. Rend
  `{ paquetFiscal: { pays, annee }, codes: [{ code, libelle? }] }`.
- **`ReintegrationsResponseDto` / `CodeReintegrationDto`** — des **classes** décorées, pas des
  interfaces : seule une classe entre au document OpenAPI en `$ref` (leçon STORY-376). Le contrat
  publié ne porte donc aucun `object` opaque, ce que la garde `openapi-contract.e2e-spec.ts`
  vérifie déjà pour tout le service.
- **`ReferentielService.codesReintegration`** — la liste sort d'`extraireCodesReintegration`, les
  libellés d'`extraireCodesRetraitement` (`reintegrations_libelles`). Aucune **troisième** lecture
  de la rubrique n'a été écrite.

### Ce qui décide de la story : publier ce qui est RÉELLEMENT appliqué

L'AC-3 (« la liste rendue est exactement celle que `estCodeReintegrationAdmis` accepte ») ne se
satisfait pas d'un code qui « lit le même champ ». Deux choix la portent :

1. **La liste sort de la fonction du validateur**, pas d'une seconde lecture de
   `reintegrations_codes`. Deux extracteurs parallèles lisant la même clé auraient été verts le
   jour de la livraison et libres de diverger ensuite — et une liste qui propose un code que la
   saisie refuse est **pire** que pas de liste : elle promet.
2. **Le paquet est résolu sans exercice** (cf. la table plus haut). C'est le seul choix qui met la
   route sur le paquet que le validateur de **catégories** applique réellement.

⚠️ **Limite connue et assumée** : le validateur de **lignes** (`cahiers-depenses`) résout, lui, le
paquet **de l'exercice de la ligne**. Sur un exercice dont la loi de finances changerait les codes,
sa liste pourrait différer de celle publiée ici. C'est l'approximation que **D-083-3** a déjà
prise et documentée (les codes sont structurellement stables, les **taux** ne le sont pas — eux
sont lus au paquet de l'exercice). La lever demanderait une route scopée au dossier/exercice :
hors périmètre, et sans consommateur aujourd'hui (FE-044 saisit une catégorie, pas une ligne).

### Portes de qualité

Lint **0 warning** · build OK · **3110 unitaires** + **751 e2e** verts · `referentiel.service.ts`
et `referentiel.controller.ts` à **100 / 100 / 100 / 100** (seuils 65/90/90/90).

**6 mutations appliquées, chacune vérifiée ROUGE puis restaurée** :

| # | mutation | test qui vire au rouge |
|---|---|---|
| 1 | le paquet est résolu **avec** un exercice (`{ fin: 2027-12-31 }`) | « résout le paquet SANS exercice (même paquet que le validateur de catégories) » |
| 2 | la liste sort des **déductions** du même paquet (`extraireCodesRetraitement().deductions`) | « AC-3 : équivalence stricte …, dans les deux sens » + e2e « les codes de DÉDUCTION … ne sont pas publiés ici » |
| 3 | un `.sort()` est introduit sur les codes | « publie les codes du paquet, dans SON ordre » |
| 4 | la branche `libelles[code] === undefined` est supprimée (libellé toujours attaché) | « sans libellé, la clé est OMISE — jamais `libelle: undefined` » + e2e « aucun libellé inventé » |
| 5 | `@RequiresBalanceAccess()` est retiré du contrôleur | e2e « AC-4 : entitlement révoqué → 403 » et « AC-4 : KYC non approuvé → 403 » |
| 6 | la route se met à charger **aussi** le référentiel comptable | e2e « aucun référentiel comptable attribué → 200 quand même (D-078-1) » |

⚡ **Deux enseignements de la passe de mutation**, tous deux invisibles avant elle :

- **La mutation n° 3 ne rougissait pas sur le paquet réel.** Les douze codes de `togo@2026`
  (`10, 11, 12, 15, 20, 25, 30, 40, 45, 50, 60, 80`) sont **déjà dans l'ordre trié** : l'assertion
  e2e « dans l'ordre du paquet » est donc **vraie d'un service qui trie**. Le fixture unitaire a
  été réordonné (`['30','10','20']`) exprès — c'est lui, et lui seul, qui garde la propriété.
- **La mutation n° 2 ne compilait pas** au premier essai (import devenu inutilisé) : une mutation
  rouge **par erreur de compilation** ne prouve rien sur les tests. Elle a été rejouée en retirant
  aussi l'import, et c'est cette seconde forme — qui compile — qui a fait rougir l'AC-3.

### Vérification docker — la liste publiée EST celle que la saisie applique

Stack `mongo + kafka + redis + auth-service + balance-service`, code de la branche exécuté en
volume (`Found 0 errors` à 05:32, `Nest application successfully started`). Org réelle créée par
`register` + `login` (jeton RS256), read-models `orgbalanceentitlements` (ACTIVE,
`syscohada-revise@2.1`), `orgkycstatuses` (APPROVED) et `dossiers_dossier` (ACTIF) semés par
`mongosh`.

| # | ce qui est prouvé | résultat |
|---|---|---|
| 1 | la route est **montée** (elle refuse, elle ne manque pas) | sans jeton → **401**, jamais 404 |
| 2 | AC-1 sur le **vrai** artefact `togo@2026` | **200** `{"paquetFiscal":{"pays":"togo","annee":2026},"codes":[{"code":"10"},…,{"code":"80"}]}` — 12 codes, **aucune clé `libelle`** |
| 3 | **AC-3, sens « tout ce qui est publié est accepté »** | les **12** codes envoyés un par un à `POST /dossiers/{id}/cahiers/categories` → **201 × 12**, et les 12 documents relus en base portent exactement `["10","11","12","15","20","25","30","40","45","50","60","80"]` |
| 4 | **AC-3, sens inverse — rien d'autre n'est accepté** | les **5 codes de déduction du même paquet** (`90, 95, 100, 120, 125`) + `99` + `13` → **400 `CODE_REINTEGRATION_INCONNU`**, message « *12 code(s) admis* », **aucun document persisté** |
| 5 | AC-4, la gate réelle | entitlement `REVOKED` → **403 `BALANCE_NOT_ENTITLED`** ; retour `ACTIVE` → **200** |

⚡ **La ligne 4 est celle qui compte, et aucun test mocké ne pouvait la produire** : `90…125`
vivent dans **la même rubrique du même paquet** que les réintégrations. Une implémentation qui
aurait publié « les codes de la rubrique » au lieu des **réintégrations** aurait rendu 17 codes,
dont 5 que la saisie refuse — l'écran aurait proposé au comptable des cases menant droit au `400`
que la story existe pour supprimer.

> Données de vérification laissées en base de dev (12 catégories `MNV397-*`, une org
> `cabinet-mnv-397`) : le dev repart de zéro, aucune reprise n'est due.

---

## Revue de code — 3 constats, aucun bloquant

Deux lentilles sur le même diff : `prospera-code-review` (correctness, périmètre, tests) et
`ponytail-review` (sur-ingénierie). **Elles ont convergé sur le même endroit** — ce qui est en
soi le résultat le plus utile de la passe.

### ⛔ Le constat qui comptait : un 409 documenté que cette route ne peut PAS produire

`@ApiConflictResponse` annonçait `REFERENTIEL_NON_PACKAGE` sur `GET /referentiels/reintegrations`.
Vérifié dans le code : `ArtefactNonPackageError` n'est levée **qu'à un seul endroit du dépôt** —
`referentiel-registry.ts:197`, axe **comptable**, cas `smt-togo` — et le manifeste **fiscal** ne
porte même pas la notion (`EntreePaquetFiscal` = `{ locator, checksum, paysSource }`, aucun champ
`nonPackage`). Une année fiscale absente donne un `ArtefactNotFoundError`, donc un **500
`REFERENTIEL_UNAVAILABLE`** — ce que le e2e de cette même story épinglait déjà.

⚡ **L'aggravant est le vrai défaut, et il est du genre qui survit à une suite verte** : le test
unitaire « paquet fiscal non packagé → 409 motivé » **injectait** cette erreur dans le loader
fiscal. Il passait au vert en validant un **chemin mort**, et donnait l'apparence que le 409
documenté était réel. Un mock accepte n'importe quelle erreur — c'est précisément ce qui rend un
test de mapping capable de certifier une branche que la production ne peut pas atteindre.

⇒ `@ApiConflictResponse` retiré (documenter un refus impossible fait coder au client une branche
morte **et** le laisse sans code pour le vrai refus) ; test remplacé par la panne réellement
atteignable (`ArtefactNotFoundError` → 500), **mutation n° 7 vérifiée rouge** (`catch` avalant
l'erreur et rendant une liste vide).

### Les deux autres

- **Le contrat ne disait pas QUEL paquet.** Deux validateurs produisent `CODE_REINTEGRATION_INCONNU`
  avec deux paquets différents ; la route s'aligne sur celui des **catégories** (par défaut,
  D-083-3). C'était dit dans le JSDoc du service — donc invisible du consommateur, qui lit Swagger.
  L'`@ApiOperation` et le DTO le disent désormais, en renvoyant vers `resultat-fiscal` pour la
  grille de l'exercice. Latent aujourd'hui (le manifeste ne porte que `togo@2026`), certain le jour
  où `togo@2027` est publié.
- Le JSDoc de classe annonçait « **deux** routes » et en énumérait trois — décompte cassé **par ce
  diff**.

### Écartés, avec leur raison

- `extraireCodesRetraitement` parcourt `deductions_libelles` **après** `reintegrations_libelles` :
  un paquet qui keyerait un code de réintégration dans la mauvaise table publierait ici un libellé
  de déduction. Exige un artefact malformé (checksum vérifié), impact = une étiquette d'écran, et
  les deux tables sont absentes du paquet réel. Confiance ~60, sous le seuil.
- `toBeGreaterThan(0)` sur `codes.length` dans le e2e « aucun référentiel comptable attribué » : le
  critère y est « 200 malgré l'axe comptable absent », pas une égalité de liste — laquelle est
  épinglée exactement ailleurs (les 12 codes ordonnés).
- Import croisé `referentiel/` → `cahiers/` + `fiscal/` : vérifié, **aucun cycle à l'exécution**
  (les deux fichiers de règles n'importent de `referentiel/` que des **types**, effacés à la
  compilation).
- Chevauchement avec la grille de `resultat-fiscal` : réel, assumé, non substituable (cette
  grille-là est scopée à l'exercice et exige une balance **et** un dossier).

## Revue de sécurité — 0 vulnérabilité

12 pistes examinées, toutes écartées avec leur raison : contournement JWT (RS256/JWKS imposé,
route non `@Public()`), IDOR (le handler n'a **ni `@Param` ni `@Query` ni `@Body`** — l'org vient
du seul claim `org` du jeton), application effective des gardes de classe au nouveau handler
(`getAllAndOverride([handler, class])`, non redéfini), `PLATFORM_ADMIN` / jeton sans `org` (double
refus fail-closed), anti-énumération (la réponse ne varie pas selon l'organisation), pollution de
prototype via `libelles[code]` (le code vient **exclusivement** d'un artefact vérifié par sha256,
l'appelant ne fournit rien), injection NoSQL (aucune requête Mongo sur ce chemin), fuite d'info
(le mapper neutralise les messages porteurs de checksum et de locator), secrets, DoS (throttler
global, artefact caché en *single-flight*, réponse bornée par l'artefact), intégrité fiscale
(prémisse **revérifiée dans le code**, pas crue).

⚠️ **Un point noté, délibérément non retenu comme vulnérabilité — mais à connaître** :
`resoudrePaquetFiscal` **ignore** son paramètre `_organizationId`, là où `resoudreReferentiel`
relit l'entitlement en base et rejoue le refus. `codesReintegration` n'a donc que la **garde HTTP**
comme contrôle d'accès, sans la défense en profondeur de ses deux routes jumelles. Sans impact
ici : la donnée servie n'est **pas scopée au tenant** — c'est le paquet fiscal par défaut de la
plateforme, une référence légale identique pour toutes les organisations. Il n'y a rien à
exfiltrer. Le jour où la résolution du paquet deviendra org-dépendante (hook STORY-079/080, déjà
annoncé dans le résolveur), **cette route devra regagner la défense en profondeur** — et c'est
exactement le moment où l'oubli serait invisible.
