# STORY-400 : Affecter une RACINE de comptes — et refuser la surcharge acceptée-puis-inerte

Status: in_progress

**Épic :** EPIC-010 — Référentiels & table de passage (FR-005..FR-008)
**Service :** `bilan-service` (`:3004`) — `modules/bilan/mapping-override`, `modules/bilan/table-de-passage`
**Points :** 5 · **Sprint :** S20 · **Complexité :** high
**Origine :** remontée le **2026-08-24** à la **revue métier de la maquette FE-030** par un
expert-comptable habitué à Sage — avant toute ligne de code frontend.

---

## Le fait, relevé à la source

Une surcharge s'applique par **égalité stricte** sur le numéro de compte :

```ts
// mapping-override.repository.ts
return new Map(actives.map((s) => [s.compte, s.cible]));   // Map(compte → cible)

// table-de-passage.service.ts
const surcharge = surcharges?.get(compte);                 // .get() — exact
```

Alors que la table de passage **packagée**, elle, rattache par **préfixe le plus long** :

```ts
for (let len = compte.length; len >= 1; len--) {
  const regles = index.get(compte.slice(0, len));
  if (regles) return regles.map(/* … */);
}
```

⇒ Le référentiel raisonne en **racines** ; la surcharge, non.

### Et il y a pire qu'une ergonomie pauvre : un piège silencieux

`ProposerSurchargeDto.compte` accepte `^\d[0-9A-Za-z]{1,19}$` — **`4762` passe le
format**. `MappingOverrideService.proposer` ne valide que la **cible**
(`POSTE_INCONNU`), **jamais le compte** : il n'est confronté ni au plan de comptes du
référentiel, ni aux comptes de la balance.

⛔ Conséquence, vérifiable de bout en bout : une surcharge sur `4762` est **acceptée
(201)**, **validée par un administrateur (200)**, s'affiche « **Validée** » dans le
journal, et **ne s'applique à rien** — aucun compte ne s'appelle littéralement `4762`.
Le cabinet croit avoir fait le travail. Rien, nulle part, ne le détrompe.

---

## Ce que ça coûte, concrètement

Un compte d'attente ou de régularisation n'existe jamais au singulier : `476200`,
`476210`, `476220`… Sur Sage, on affecte la racine **une fois**. Ici, quarante comptes
valent **quarante propositions et quarante validations d'administrateur** — un geste que
personne ne fera, et l'écran sera contourné.

⇒ **Contournement en place (FE-030), et il ne traite que le piège** : le dialogue
d'affectation **n'a aucun champ « compte »**. Le compte vient de la ligne d'où l'on
arrive, donc d'un compte **réellement présent dans la balance retenue**. Une racine est
ainsi **impossible à saisir** — mais rien n'est gagné sur le volume : le comptable
affecte toujours compte par compte.

---

## Périmètre

**Inclus**

- Une surcharge peut porter une **racine** aussi bien qu'un compte exact. Forme la plus
  simple qui serve : un champ `portee: 'COMPTE' | 'RACINE'` sur `ProposerSurchargeDto`
  (absent ⇒ `COMPTE`, donc **aucune migration et aucun client cassé**).
- `TableDePassageService.mapComptes` applique les surcharges au **préfixe le plus long**,
  exactement comme la table packagée — et **une surcharge sur un compte exact l'emporte
  sur une surcharge de racine**, comme un préfixe long l'emporte sur un court.
- **Fermer le piège côté serveur, indépendamment de la portée** : une surcharge validée
  qui ne couvre **aucun** compte connu doit être refusée ou signalée, jamais acceptée en
  silence. Deux pistes, à trancher à la conception :
  ① valider le compte/la racine contre `pkg.planDeComptes` à la **proposition** ;
  ② exposer sur `SurchargeResponseDto` un `couvre: number` (comptes de la balance
  courante réellement atteints) — plus riche, mais suppose une balance, ce que le service
  ne connaît pas encore (STORY-381).
- L'index d'unicité partielle suit la portée : deux surcharges `VALIDATED` ne peuvent pas
  se contredire sur **le même** couple `(dossier, portée, valeur)`.

**Hors périmètre**

- **Affecter en masse depuis l'écran** en envoyant N propositions : c'est le problème
  d'origine déplacé, pas résolu — N validations d'administrateur restent N validations.
- Toucher la table de passage **packagée** : une surcharge reste locale au dossier, le
  paquet n'est jamais modifié (FR-008).

---

## Critères d'acceptation

1. Une surcharge de **racine** validée rattache **tous** les comptes de la balance qui
   commencent par cette racine, sans en avoir été nommés.
2. Une surcharge de **compte exact** l'emporte sur une surcharge de racine qui le
   couvrirait — même règle de spécificité que le préfixe le plus long.
3. Une proposition dont le compte ou la racine ne correspond à **aucun** compte connu du
   référentiel est **refusée avec un code nommé**, ou porte au contrat un indicateur de
   couverture. Elle ne peut plus être acceptée **puis** validée **puis** inerte.
4. Un corps sans `portee` se comporte **exactement** comme aujourd'hui (non-régression :
   les surcharges déjà en base restent des surcharges de compte exact).
5. `PosteRattache.prefixe` porte la **racine** quand le rattachement vient d'une surcharge
   de racine — la traçabilité doit dire *ce qui* a produit l'affectation, ici comme pour
   le référentiel.

---

## Notes

- ⚠️ **Le mécanisme existe déjà dans ce service** : `indexerPrefixes` + la boucle
  longest-prefix de `rattacher`. Il ne s'agit pas d'inventer une sémantique, mais
  d'appliquer aux surcharges celle que la table packagée utilise déjà.
- ⚠️ **Recouvrement avec STORY-399** (le référentiel n'est lisible par aucune route) :
  l'AC-3 ci-dessus a besoin de `pkg.planDeComptes`, que 399 expose. **Les livrer ensemble**
  est plus économique — et sans 399, l'écran affectera toujours à l'aveugle, racine ou pas.
- ⚠️ **Recouvrement avec STORY-381** (`bilan-service` ne connaît aucune balance) : la
  piste ② de la couverture en dépend. La piste ① n'en dépend pas — c'est un argument pour
  elle.
- ⚡ **SECOND CONSOMMATEUR, RELEVÉ LE 2026-08-25 : FE-046** (rattachement du plan comptable, Atelier).
  Le même piège y a été retrouvé sur une **racine de produits** (`70`) : proposée, acceptée, validée,
  puis sans effet. Deux modules différents, deux services différents, le même mode de panne — ce
  n'est donc pas une particularité du Bilan mais **la sémantique de la surcharge elle-même**.
  ⇒ Ce qui change pour cette story : elle cesse d'être une commodité d'un écran pour devenir un
  **correctif de contrat**, et sa garde front doit être posée **dans les deux écrans**.
- Consommateurs nommés : **FE-030**, **FE-046**.

---

## Progress Tracking

**Statut : `in_progress`** — implémentée, portes DoD vertes, passe de mutation faite,
**vérification docker réelle** faite sur stack neuve. Revue de code et revue de sécurité
à suivre.

**Branches** : `MNV-400` sur `bilan-service` **et** sur `docs`. **Un seul dépôt de code** :
aucun contrat d'événement Kafka n'est touché (la surcharge est locale au dossier, FR-008).

### Conception — les deux arbitrages que la story laissait ouverts

**① La couverture : piste ① retenue, et sa borne est NOMMÉE au contrat.** La piste ②
(`couvre: number`) suppose une balance, que `bilan-service` ne connaît toujours pas
(STORY-381) : elle reste hors d'atteinte. La piste ① valide donc le compte (ou la racine)
contre `pkg.planDeComptes`, exposé par STORY-399 — refus **422 `COMPTE_HORS_REFERENTIEL`**.

⚠️ **Le test posé est « la valeur DESCEND d'un compte du plan », pas l'égalité.** L'égalité
aurait été un contresens : le plan normalisé SYSCOHADA porte des comptes de **2 à 4
chiffres** (`47`, `211`, `6031`) là où une balance de cabinet porte des comptes de 6
(`476200`). Une garde en égalité stricte aurait refusé **tout compte réel** — donc
exactement ce que l'écran FE-030 envoie. C'est le témoin `AC-3 — une RACINE qui DESCEND du
plan est acceptée` qui l'interdit, et la mutation **M4b** le prouve : passer la garde en
égalité fait rougir **4 tests**.

⚠️ **Le test réciproque (« la valeur est l'ANCÊTRE d'un compte du plan ») n'a pas été posé,
parce qu'il est MESURÉ inutile.** Sur les **5** paquets embarqués (syscohada-revise 2.1,
sfd-bceao 1.0 et 2.0, cima-assurances 1.0, zone-franche-togo 1.0), **aucun** préfixe de
longueur ≥ 2 d'un compte du plan n'échappe à la descendance : tout ancêtre est lui-même au
plan. La branche aurait été morte. La mesure est **gardée** par
`mapping-override.plan.exhaustivite.spec.ts` : un paquet futur qui déclarerait `211` sans
`21` la fait rougir, au lieu de refuser en silence une racine légitime.

⛔ **Et la borne, dite franchement** : ce contrôle porte sur le **référentiel**, pas sur la
balance du dossier. Un compte formellement valide mais **absent** de la balance du cabinet
reste acceptable — le service ne peut pas en juger. C'est écrit dans la description du 422
publiée en OpenAPI, plutôt que tu.

**② La `Map` injectée au moteur devait changer de clé — sinon l'index de l'AC aurait créé
une perte silencieuse.** Le périmètre demande que l'unicité porte sur
`(dossier, portée, valeur)` : `4762` en `RACINE` et `4762` en `COMPTE` peuvent donc
**coexister validées**. Or `chargerSurchargesActives` rendait une `Map(compte → cible)` —
les deux se seraient écrasées, et **laquelle survit aurait dépendu de l'ordre de lecture
Mongo**. La clé est désormais `portée|valeur` (`cleSurcharge`, une seule fonction pour
l'écrivain et le lecteur). Aucune signature n'a bougé : les 7 sites qui transportent la
`Map` sont inchangés.

**③ La boucle s'arrête au premier préfixe APPLICABLE, pas au premier TROUVÉ.** Une
surcharge `COMPTE` posée sur `4762` est bien dans la `Map` quand on examine `476200`, mais
elle ne s'y applique pas : il faut **continuer** vers `476`, `47`… sinon elle masquerait une
racine plus courte parfaitement valide. Mutation **M2**.

### Portes DoD

| Porte | Résultat |
|---|---|
| lint | **0 erreur, 0 warning** (`eslint --max-warnings 0`) |
| build | `nest build` **OK** |
| unitaires | **113 suites, 1186 passés**, 1 skippé |
| couverture | **98.7 st / 93.76 br / 98.41 fn / 98.65 li** — seuils 65/90/90/90 ; module `mapping-override` et `table-de-passage` à **100 % sur les 4 axes** |
| e2e | **22 suites, 333 tests** verts |

### Table de mutations — chaque garde vérifiée non-vacante

| # | Mutation appliquée | Attendu | Mesuré |
|---|---|---|---|
| M1 | la garde d'égalité stricte retirée (une surcharge `COMPTE` s'applique aussi aux descendants) | rouge | **2 rouges** |
| M2 | la boucle s'arrête au premier préfixe **trouvé** (une racine plus courte est masquée) | rouge | **1 rouge** |
| M3 | `prefixe` = le compte entier, même sous une surcharge de racine (AC-5) | rouge | **4 rouges** |
| M4 | `descendDuPlan` rend toujours `true` (garde AC-3 retirée) | rouge | **2 rouges** |
| M4b | `descendDuPlan` exige l'**égalité** au plan (garde trop stricte) | rouge | **4 rouges** |
| M5 | le repli `?? 'COMPTE'` retiré du repository (une surcharge d'avant 400 devient inerte) | rouge | **1 rouge** |
| M6 | `portee` retirée de la clé d'index unique | rouge | **1 rouge** |
| M7 | `from()` cesse de poser `portee` (contrat menteur) | rouge | **3 rouges** (e2e contrat) |
| M8 | `@IsIn` élargi (`PREFIXE` admis en écriture) | rouge | **1 rouge** (e2e) |

⚠️ **Deux mutations ont d'abord échoué par ERREUR DE COMPILATION** (`if (false as boolean)`,
puis un paramètre devenu inutilisé) : une suite qui ne **tourne pas** ne prouve rien. Elles
ont été rejouées sous une forme qui compile — c'est la seule façon d'obtenir un rouge qui
soit un rouge de **test**.

### Vérification docker — stack NEUVE (`down -v`), service réel, Mongo réel

`mongo` + `auth-service` + `bilan-service`, organisation créée par `register`/`login` réels
(JWT RS256), read-models `orgkycstatuses` / `orgbilanentitlements` / `dossiers_dossier`
semés en `mongosh`, référentiel effectif `syscohada-revise@2.1` (174 comptes au plan).

| Mesure | Résultat |
|---|---|
| index réel de `mapping_overrides` | **`{tenantId, dossierId, portee, compte}`**, `unique`, `partialFilterExpression: {statut:'VALIDATED'}` — **aucun index obsolète** (base neuve) |
| `POST` compte `999999` (classe 9 absente du plan) | **422 `COMPTE_HORS_REFERENTIEL`**, **0 document écrit** |
| `POST` racine `4762` / compte `476200` | **201** — la racine du §*Le fait* est désormais saisissable |
| `4762` en `RACINE` **et** `4762` en `COMPTE`, tous deux `VALIDATED` | **coexistent** (2 documents) — c'est l'index de l'AC qui le permet |
| 2ᵉ `VALIDATED` sur le **même** couple `(RACINE, 4762)` | **409 `SURCHARGE_EXISTE`** — l'unicité garde toujours |
| document **legacy** inséré **sans** le champ `portee` | `hasOwnProperty('portee') === false` en base |

**Le rattachement réel** (`POST …/table-de-passage/dry-run`, surcharges relues depuis Mongo) :

| compte | poste | `prefixe` | `source` | ce que ça prouve |
|---|---|---|---|---|
| `476200` | `DK` | **`4762`** | surcharge | **AC-1** — couvert par la racine, jamais nommé |
| `476220` | `DK` | **`4762`** | surcharge | **AC-1** — idem, un compte que personne n'a saisi |
| `476210` | `BI` | `476210` | surcharge | **AC-2** — le compte exact l'emporte sur la racine |
| `4762` | `AF` | `4762` | surcharge | **AC-2** — à valeur égale, `COMPTE` l'emporte sur `RACINE` |
| `211000` | `DK` | `211000` | surcharge | **AC-4** — le document *legacy* **sans champ** s'applique toujours, et **exactement** |
| `211001` | `BQ` | **`211`** | surcharge | **AC-4** — son voisin d'un caractère retombe sur la racine, pas sur lui |
| `999999` | — | — | — | non mappé : aucune surcharge, aucun préfixe |

⚠️ **Atomicité : rien à prouver ici, et le dire vaut mieux que l'affirmer.** Toutes les
écritures de cette story sont **mono-document** (`create`, `updateOne`) — aucune transaction
multi-documents n'est ouverte. Le seul invariant croisé est l'**index unique partiel**, et
il est vérifié ci-dessus dans les deux sens (il refuse le doublon de couple, il autorise les
deux portées).

### Hors périmètre, tenu

- **Affectation en masse depuis l'écran** : non implémentée (c'eût été le problème déplacé).
- **Table de passage packagée** : jamais touchée — une surcharge reste locale au dossier (FR-008).
- **Piste ② `couvre: number`** : hors d'atteinte tant que `bilan-service` ne connaît aucune
  balance (STORY-381). Le refus `COMPTE_HORS_REFERENTIEL` est le hook documenté : le jour où
  la balance sera là, c'est là qu'il faudra l'enrichir.

⚠️ **Migration de production, différée et NOMMÉE** : Mongoose ne supprime jamais un index
devenu obsolète (leçon STORY-357). Sur une base **existante**, l'ancien
`(tenantId, dossierId, compte)` survivrait et interdirait la coexistence des deux portées.
En dev la base repart de zéro ; en production il faudra un `dropIndex` explicite. C'est écrit
au-dessus de l'index, dans `mapping-override.schema.ts`.

### ⚡ Second consommateur (FE-046) — ce que cette story lui donne, et ce qu'elle ne lui donne pas

La racine de produits `70` citée par FE-046 est désormais **exprimable** (`portee: RACINE`)
et **vérifiée** (`70` est au plan SYSCOHADA). Le mode de panne « proposée, acceptée, validée,
puis sans effet » est donc fermé **côté `bilan-service`**. ⚠️ FE-046 vise l'**Atelier**
(`balance-service`) : le même correctif de contrat y reste à faire — ce n'est pas le
périmètre de cette story, qui cadre `bilan-service`.
