# STORY-448 : Aucune route ne compare deux versions figées — alors que les deux liasses complètes sont stockées

Status: done

**Épic :** EPIC-012 — Validation, immutabilité, exercices, audit
**Service :** `bilan-service`
**Points :** 5 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-034** (cycle brouillon → validé, snapshot immuable, piste d'audit), 2026-08-27.
Relevé en lisant les contrôleurs de `bilan-service` sur `origin/dev`.

---

## Le fait

`SnapshotLiasse` stocke la **liasse entière** (`liasse`), les **soldes sources** (`soldesN`,
`soldesN1`) et le tampon référentiel — pour **chaque** version. Il existe `GET …/versions` (la
liste) et `GET …/versions/:version` (une version). **Il n'existe rien pour les comparer.**

Or la question vient immédiatement après la première réouverture : *« qu'est-ce qui a changé entre
la version que j'ai remise au client et celle-ci ? »*. C'est aussi la question à laquelle il faut
répondre devant un contrôle, et celle qui justifie la réouverture.

Aujourd'hui l'écran ne peut que **soustraire deux totaux** — c'est-à-dire refaire un calcul,
exactement ce que la règle « pas de second arbitre » interdit (FE-030/FE-031).

## Critères d'acceptation

- [x] AC-1 — `GET …/etats/:id/versions/comparaison?de=1&a=2` rend, **poste par poste**, les seuls
      postes dont la valeur diffère : `{ etat, code, libelle, avant, apres, ecart }`.
- [x] AC-2 — Le **référentiel** des deux versions est comparé et publié : deux versions produites
      sous des versions de paquet différentes ne dénotent pas tout à fait les mêmes agrégats —
      même garde que `referentielHomogene` (FE-076).
- [x] AC-3 — La différence des **soldes sources** est résumée (comptes ajoutés / retirés / modifiés
      avec leur écart), sans rendre les deux balances entières.
- [x] AC-4 — `de` et `a` doivent exister et être **distinctes** → `404 VERSION_INTROUVABLE` /
      `400`. L'ordre est libre ; l'`ecart` est signé `apres − avant`.
- [x] AC-5 — **Aucun recalcul** : la comparaison lit deux snapshots figés. Une liasse re-produite
      pour l'occasion ne serait plus la version qui fait foi.

## Conséquences ailleurs

- L'écran vit dans l'onglet **Validation** de FE-034 (bouton « Comparer v1 et v2 », désactivé dans
  la maquette et nommant cette story).
- Se combine à **STORY-444** : le motif de la réouverture explique *pourquoi*, la comparaison
  montre *quoi*. Les deux ensemble constituent le dossier de justification d'une correction.

---

## Progress Tracking

**Statut : `done`** — implémentée, validée, revue (code + sécurité), **vérification docker
rejouée sur l'état final**, PR `bilan-service` **#80** (2 commits) rebase-mergée sur `dev`
le 2026-09-04.

Branches créées **avant** la première ligne de code :

```
docs             MNV-448
bilan-service    MNV-448
```

**Un seul dépôt impacté** : la route, son moteur et son contrat vivent dans `bilan-service`.
Aucun contrat d'événement ne change, aucune écriture, aucune transaction.

### Ce qui est livré

`GET /dossiers/:dossierId/bilan/etats/:id/versions/comparaison?de=1&a=2`

- **AC-1** — poste par poste, les **seuls** postes dont la valeur diffère :
  `{etat, code, libelle, sens, nature, avant, apres, ecart}`. Un tableau vide signifie
  deux liasses identiques.
- **AC-2** — `referentielHomogene` + `referentielsEnPresence`, dédupliqués sur le triplet
  `{code, version, checksum}` — **et non sur la version** : un paquet est révisé *en place*
  tant que sa version reste attribuée, donc seule l'empreinte identifie le contenu. Garde
  **non bloquante**, comme celle de STORY-074.
- **AC-3** — résumé de la différence des balances sources **N et N-1** : comptes ajoutés /
  retirés / modifiés avec leur écart, plus `nombreAvant`/`nombreApres` pour l'ordre de
  grandeur. Jamais les deux balances entières.
- **AC-4** — `de`/`a` entières ≥ 1 (400 par DTO), **distinctes** (400 `VERSIONS_IDENTIQUES`),
  existantes (404 `VERSION_INTROUVABLE`, **sans dire laquelle** manque). Ordre **libre**,
  `ecart` signé `apres − avant`.
- **AC-5** — **aucun recalcul** : les deux liasses sont lues telles que figées.

### ⚠️ Deux champs publiés au-delà de la lettre de l'AC-1

`sens` (repris de la liasse) et surtout **`nature: AJOUTE | RETIRE | MODIFIE`**. Sans cette
étiquette, un poste **apparu** se lit comme une correction de fond : depuis
`bilan-engine@1.3.0`, le compte de résultat émet **tous** les postes de détail déclarés, y
compris ceux qu'aucun compte n'alimente. Comparer une version figée avant à une version
figée après fait donc sortir une quinzaine de lignes en `avant: null → apres: 0` — vraies
différences de **présence**, fausses différences de **valeur**. Les deux `moteurVersion`
sont publiés à côté pour trancher.

### ⛔ L'ordre de déclaration des routes est le vrai risque de cette story

`:id/versions/comparaison` est déclarée **AVANT** `:id/versions/:version`. Placée après,
Nest apparie l'URL sur la route paramétrée, `ParseIntPipe` refuse le mot `comparaison`, et
la route rend **400 — définitivement, sans que rien ne compile en rouge**. Ni le build, ni
les unitaires du service, ni le contrôleur testé par appel direct ne le voient.
`jeu-etats.routes.spec.ts` garde l'ordre de façon **générique** (toute future sous-route
littérale de `:id/versions/…`), et l'e2e le prouve par un appel réel.

### ⚡⚡ Revue de code — six montants publiés en `object` opaque, et un ordre annoncé faux

**⛔ Le livrable même de la story était illisible du contrat.** `avant`, `apres` et `ecart`
de `DifferencePosteDto` et `DifferenceCompteDto` sont des `number | null` :
`emitDecoratorMetadata` réfléchit une union nullable en `Object`, et un `@ApiProperty` sans
`type: Number` publiait `"ecart": {"type": "object"}`. Un client généré typait `any` la
valeur que l'écran FE-034 compare à zéro et formate. **Quatrième récidive** du patron déjà
refermé sur `resultatPorteAuPassif` (426), `coherenceResultat` (432) et les ancres du TFT
(433).

**⛔ Et rien ne pouvait le voir.** `collectCoverageFrom` exclut les `*.dto.ts`, et
`openapi-contract.e2e-spec.ts` — le **seul** filet du dépôt contre cette classe de défaut —
ne montait que `BilanDiagnosticsController` et `MappingOverrideController` : **toute la
surface `/bilan/etats` était hors du balayage**. Le prédicat du balayage matchait pourtant
exactement ces six propriétés. `JeuEtatsController` y entre désormais, et le prix de la
vérité est déclaré : les **vingt `object` opaques pré-existants** de cette surface sont
**inventoriés, pas corrigés** — dont ⚠️ **trois scalaires qui relèvent du défaut exact
corrigé ici** (`JeuEtatsResponseDto.version`, `.validePar`, `.valideAt`, plus les deux
mêmes sur `JeuEtatsSommaireDto`). Geste trivial, hors périmètre : **hook inerte nommé pour
la story suivante.**

**⚠️ L'ordre publié n'était pas celui que la description annonçait.** « Ordre du référentiel
de `a` d'abord, puis les postes que seul `de` portait » décrit ce que fait
`construireFamille` **à l'intérieur** d'une famille ; la sortie, elle, est groupée **par
état** d'abord. Un poste retiré de l'actif précède donc un poste modifié du passif, et un
écran qui couperait la liste au premier `RETIRE` rangerait ce dernier du mauvais côté.
C'est la **phrase** qui était fausse, pas l'ordre : les trois proses (contrat, types,
moteur) disent maintenant le vrai.

**ponytail-review** — `indexerSoldes` tenait deux `Map` (cumul `{d, c}` puis nets) là où la
somme des nets vaut le net des sommes. −9 lignes, sémantique identique, **vérifiée en docker
à l'octet**.

Instruits puis **écartés** : la duplication de `referentielsUniques` (six lignes ; l'extraire
d'une méthode privée d'un service injectable ferait porter une régression à STORY-074 pour
un gain nul) · JSDoc détaché (aucun, les trois insertions laissent chaque bloc collé à sa
déclaration) · périmètre (**0 suppression** sur 12 fichiers).

### ⚡ Revue de sécurité — aucun constat

Blanchi **avec preuve**, pas par intuition :

- **Le cloisonnement des DEUX lectures**, le point réellement à risque : `trouverVersion`
  prend sa clé du résultat de `chargerParId`. Sonde exécutée sur les filtres Mongo réels —
  les deux portent `{tenantId, dossierId}`, et `dossierIdCourant()` **lève avant**
  `model.findOne` quand le contexte n'a pas de dossier. Fail-closed **mesuré**, pas déclaré.
- **Le 400 placé avant le 404 n'est pas un oracle** : `P(400 | jeu existe) = P(400 | jeu
  absent) = 1`, information mutuelle **nulle**. L'ordre inverse serait strictement plus
  bavard.
- **Divulgation** : la réponse est un **sous-ensemble strict** de `GET …/versions/:version`
  (mêmes rôles), qui publie déjà la liasse et les balances **entières**. Elle publie même
  moins — ni auteur résolu, ni `balanceChecksum`, ni `complements` — et ne fuit ni
  `tenantId`, ni `dossierId`, ni `_id`/`__v` : `construireComparaison` reconstruit des
  objets plats champ par champ au lieu de rendre le sous-document Mongoose.
- **Injection NoSQL** : `?de[$ne]=1` refusé en 400 **avant tout accès base** ; indexation par
  `Map`/`Set` partout, donc un poste nommé `__proto__` est une clé inerte.
- **DoS par volume** : borné à la source par `@ArrayMaxSize(5000)` sur les soldes — pire cas
  ~1,5 Mo, **moins** que deux appels à la route de version. Throttler global 100/60 s.
- **Ordre des routes** : le piège d'AGENTS.md est un défaut d'**autorisation** ; ici les deux
  handlers portent **le même** couple de rôles, donc aucun différentiel de privilège.
- **Harnais e2e** : `main.ts` porte déjà `enableImplicitConversion`. Le test était **plus
  strict** que la production ; aucun comportement de production ne change.

### Vérification

Lint 0 warning · build OK · **1 732 unitaires + 477 e2e verts** · couverture **93,99 /
98,77 / 98,83 / 98,81** (moteur neuf à **100 / 100 / 100 / 100**) · **10 mutations rouges
par assertion**, aucune par erreur de compilation :

| mutation | ce qui vire au rouge |
|---|---|
| route littérale déclarée **après** la paramétrée | `jeu-etats.routes.spec.ts` + 1 e2e (400 au lieu de 200) |
| garde `de === a` retirée | 1 unitaire de service |
| seule la borne « avant » est vérifiée | 1 unitaire de service |
| les postes **identiques** sont publiés aussi | 4 unitaires du moteur |
| occurrences répétées d'un compte non sommées | 1 unitaire du moteur |
| solde comparé = le **débit**, plus le net | 2 unitaires du moteur |
| toute différence étiquetée `MODIFIE` | 2 unitaires du moteur |
| clé de référentiel sans le **checksum** | 1 unitaire du moteur |
| écart calculé sans garde de borne absente | unitaires du moteur |
| `type: Number` retiré d'**un seul** champ | 2 e2e de contrat OpenAPI |

**Vérification docker sur jeton RS256 réel** — cabinet inscrit à l'IdP (`register` + e-mail
vérifié + login), KYC `APPROVED`, entitlement `bilan` `ACTIVE`, dossier / exercice / balance
semés dans les read-models. Deux versions **réellement différentes** figées **par l'API**
(créer → valider v1 → rouvrir avec motif → recalculer `411000` et `401000` +150 000 →
valider v2), puis :

| critère | mesure |
|---|---|
| AC-1 | **7 postes publiés sur 58** — `BI`, `DJ`, `BG`, `BK`, `BZ`, `DP`, `DZ`, tous `MODIFIE` à ±150 000 |
| AC-2 | `referentielHomogene: true`, **une** entrée en présence |
| AC-3 | `soldesN` : 2 comptes modifiés (`411000` +150 000, `401000` −150 000), **0 ajouté, 0 retiré**, sur 7 comptes ; `soldesN1` vide, jamais `null` |
| AC-4 | `de=a` → **400 `VERSIONS_IDENTIQUES`** · `a=99` **et** `de=99` → **404 `VERSION_INTROUVABLE`** (message identique) · `de=abc`, `de=0`, `a` absent, `de[$ne]=1` → **400** |
| AC-4 | ordre inversé (`de=2&a=1`) → **mêmes 7 lignes, signes opposés** |
| ordre des routes | la route rend **200** sur la stack réelle — et `…/versions/2` rend toujours 200, aucune régression |
| cloisonnement | jeu d'une autre org → **404 `JEU_ETATS_INTROUVABLE`** · dossier d'une autre org → **404 `DOSSIER_INTROUVABLE`** |

⚠️⚠️ **AC-5 prouvé par sonde, et c'est la seule preuve qui vaille.** Une valeur qu'**aucun
recalcul ne peut produire** (`999 999 999`) a été plantée **directement dans le snapshot v1
en base**, sur le poste `AE`. La comparaison l'a rendue telle quelle en `avant` — elle lit
donc le document figé, elle ne re-produit rien. Sonde retirée après mesure.

⚠️ **Vérification docker REJOUÉE sur l'état final**, après les correctifs de revue (le
raccourcissement d'`indexerSoldes` touche le chemin de calcul) : résultat **identique à
l'octet** — postes, soldes et métadonnées comparés champ à champ.

### ⛔ Ce qui n'a PAS été fait, et pourquoi

- Les **vingt `object` opaques** de la surface `/bilan/etats` sont **inventoriés, pas
  corrigés** — dont cinq scalaires du défaut exact corrigé ici. Hors périmètre ; l'inventaire
  les tient désormais et rougira si l'un d'eux change.
- **Aucun `moteurVersionHomogene`** à côté de `referentielHomogene`, alors que
  `evolution.ts` nomme ce manque depuis STORY-427 : les deux `moteurVersion` sont publiés,
  le client peut les comparer. Écart **distinct**, à ficher séparément.
- La comparaison **ne journalise rien** : c'est une lecture, aucun AC ne le demande, et la
  piste d'audit est append-only.
