# STORY-388 : Un socle d'à-nouveaux est indiscernable d'une balance importée, et son chaînage est invisible

**Epic :** EPIC-021 — Import & migration Sage (reprise à-nouveaux)
**Réf. :** écart remonté par **FE-047** *(reprise d'à-nouveaux / continuité N-1)*, 2026-08-23 — prolonge **STORY-087** et **STORY-147**
**Priorité :** Should Have
**Story Points :** 2
**Statut :** done
**Date de clôture :** 2026-08-25
**Complexité :** low
**Sprint :** 20
**Service :** `balance-service` (`:3007`)

---

## Le constat

`BalanceResponseDto` publie quinze champs. **Deux manquent**, et ils vivent tous les deux en base :

```ts
// balance.schema.ts
origine?: OrigineBalance;          // ← 'A_NOUVEAUX' pour un socle d'ouverture
balanceSourceId?: Types.ObjectId;  // ← la balance de clôture N-1 dont il est issu
```

Aucun des deux n'est exposé. Trois conséquences, dans l'ordre de gravité.

### ① Le front ne peut pas dire quelle balance sera reprise — alors que c'est ce que le PO demande

À la revue de maquette FE-047, le PO a tranché : l'écran doit **rendre visible** la balance que le
service va reprendre, sans pour autant fabriquer un choix que l'API n'offre pas.

Le service la sélectionne ainsi (`BalanceRepository.trouverDerniereValidee`) :

```ts
{ 'exercice.debut', 'exercice.fin', etat: 'VALIDÉE', origine: { $ne: ORIGINE_A_NOUVEAUX } }
  .sort({ horodatageValidation: -1, version: -1 })
```

Le front peut reproduire **trois** de ces quatre critères. Il ne peut pas reproduire
`origine ≠ A_NOUVEAUX` : le champ n'est pas servi. Sur un dossier en **continuité d'année en
année** — le cas nominal après la première reprise — l'exercice repris porte à la fois sa balance de
clôture *et* le socle qui l'a ouvert. Si le socle a été validé plus récemment, l'écran désignerait
**le socle** là où le serveur prendra **la clôture**. Un chiffre plausible et faux, sans erreur.

### ② Un socle d'à-nouveaux est indiscernable d'une balance importée, partout

L'onglet « Balances » (FE-027) affiche exercice, source, version, état, statut de preuve, équilibre.
Un socle y apparaît comme une balance ordinaire — il hérite même de la `source` de sa balance
d'origine (`sage`, `direct`…), qui décrit alors **la provenance de son ancêtre**, pas la sienne.
Rien à l'écran ne dit « celle-ci n'a pas été importée, elle a été *reprise* ».

### ③ Le chaînage de la continuité n'existe que dans une réponse éphémère

`ANouveauxResponseDto.balanceSourceId` porte le lien N-1 → N — mais **seulement dans la réponse à la
génération**. Rouvrez la balance le lendemain : le lien a disparu du contrat. La continuité, qui est
l'objet même de STORY-087, n'est consultable qu'au moment où on la crée.

---

## Ce qu'il faut livrer

1. `BalanceResponseDto` publie **`origine`** en **enum OpenAPI** (`SAISIE` | `IMPORT` |
   `A_NOUVEAUX` | … — les valeurs réelles d'`OrigineBalance`), pas en `string` libre : c'est la
   leçon de STORY-385, on ne la repaie pas.
2. `BalanceResponseDto` publie **`balanceSourceId`** (optionnel — seules les balances issues d'une
   reprise en portent un).
3. `GET /dossiers/{id}/balances` accepte un filtre **`origine`**, pour que le front demande
   « les balances hors socle » au serveur au lieu de trier ce qu'il a sous la main.

⚠️ **Aucun changement de calcul, aucun événement touché** : les deux champs sont déjà écrits et déjà
persistés. La story ouvre le contrat de lecture, elle ne produit rien de neuf.

---

## Critères d'acceptation

1. `origine` figure au DTO de lecture, en enum, avec la valeur réelle des documents existants — y
   compris les balances antérieures qui ne portent pas le champ (`origine` absent ⇒ le DTO dit quoi,
   explicitement : ni `A_NOUVEAUX` deviné, ni valeur inventée).
2. `balanceSourceId` figure au DTO, absent quand il n'y en a pas — *absent*, pas `null` ni chaîne vide.
3. `GET …/balances?origine=…` filtre côté serveur ; une valeur inconnue est refusée, pas ignorée.
4. `ANouveauxResponseDto` est inchangé.

---

## Notes

- **Ce que FE-047 a livré en attendant** : l'écran n'affirme rien qu'il ne sache. Avant l'aperçu il
  annonce « dernière balance validée de cet exercice » — une phrase vraie de ce que le front voit ;
  après l'aperçu, il affiche la balance que le **serveur** dit avoir reprise (`balanceSourceId` de la
  réponse), résolue dans la liste déjà chargée. Le contournement se retire quand cette story est
  livrée, **pas avant**.
- Voisine de **STORY-386** et **STORY-387** (mêmes routes, même revue) mais indépendante : celle-ci
  porte sur le **DTO de lecture des balances**, pas sur les refus.

---

## Progress Tracking

**Statut : `done`** — implémentée, vérifiée en docker, revue, sécurisée et mergée le 2026-08-25.

### Décision de conception — D-388-1 : le filtre est une **égalité**, pas une négation

Le § *Ce qu'il faut livrer* motive le filtre par « que le front demande **les balances hors socle** au
serveur ». Or « hors socle » est le critère de `trouverDerniereValidee` — `origine: { $ne: A_NOUVEAUX }` —
et il **conserve** les balances `PROVISIONS_FISCALES`. Aucune égalité ne l'exprime : ni
`?origine=A_NOUVEAUX` (l'inverse), ni un hypothétique `?origine=AUCUNE` (qui exclurait les provisions,
donc **plausible et faux** — précisément ce que ce dépôt interdit).

Le filtre livré est donc l'égalité que l'**AC-3 énonce littéralement** (`?origine=…`, vocabulaire fermé,
400 sur valeur inconnue), et **pas** un paramètre de négation. Ce qui le justifie : le blocage réel décrit
au § ① n'était pas l'absence de filtre mais l'absence du **champ** — « le front ne peut pas reproduire
`origine ≠ A_NOUVEAUX` : le champ n'est pas servi ». L'AC-1 le sert désormais **sur chaque ligne** : le
sous-ensemble se calcule **exactement**, sur une donnée que le serveur a lui-même fournie. Ajouter un
second vocabulaire de négation au contrat pour un ensemble déjà calculable serait une surface publique de
plus, indéfiniment à maintenir.

⚠️ **Si le PO veut malgré tout la négation côté serveur, c'est une story à part** — et elle devra trancher
son nom et sa forme (`?horsOrigine=`, `?origine!=`…). Noté ici pour que ce ne soit pas redécouvert comme un
oubli.

### Ce qui a été livré

| | |
|---|---|
| `BalanceResponseDto.origine` | **énumération NOMMÉE** (`enumName: 'OrigineBalance'`) — côté client une union de littéraux réutilisable, là où un enum inline produirait un type anonyme par site d'usage. Patron de STORY-386 (`GrandeurEquilibre`), leçon de STORY-385. |
| `BalanceResponseDto.balanceSourceId` | le chaînage N/N-1 **survit à la génération**. Il ne vivait que dans `ANouveauxResponseDto`, c'est-à-dire dans une réponse éphémère : rouvrir la balance le lendemain le faisait disparaître du contrat. |
| `ListBalancesQueryDto.origine` | `@IsIn(ORIGINES_BALANCE)` + `enumName` — **vocabulaire fermé**, refus 400. Un filtre ignoré en silence est pire que pas de filtre. |
| `BalanceRepository.listByOrg` | le filtre est posé **dans la requête Mongo**, jamais après coup. |
| `OrigineBalance` | schéma OpenAPI **partagé** entre le DTO de réponse et le paramètre de requête — les deux déclarations dérivent de la **même** constante `ORIGINES_BALANCE`, elles ne peuvent pas diverger en valeurs. |

⚠️ **Aucun calcul, aucun événement, aucune écriture** : les deux champs étaient déjà écrits et déjà
persistés depuis STORY-087. La story ouvre le contrat de **lecture**.

### « Absent », et non `null` — le seul niveau où ça se vérifie

L'AC-2 exige *absent*, pas `null` ni chaîne vide. C'est une propriété de la **sérialisation**, pas de
l'objet TypeScript : `toEqual`/`toBeUndefined` ne distinguent pas « clé absente » de « clé à `undefined` ».
Les tests assertent donc sur `Object.keys` du **corps JSON** — ce que le client reçoit réellement.

### Portes de qualité

`eslint --max-warnings 0` **0** · `nest build` **OK** · `test:cov` **2 973 / 2 973**, couverture
**98,98 st / 91,83 br / 98,17 fn / 99,06 li** (seuils 65/90/90/90) · `test:e2e` **689 / 689** (681 + 8).

### AC-4 — diff OpenAPI `dev` → `MNV-388`

Document dumpé sur les deux révisions (même harnais que `openapi-contract.e2e-spec.ts`, 30 contrôleurs
montés) et comparé **schéma par schéma** :

```
schémas AJOUTÉS   : ['OrigineBalance']
schémas RETIRÉS   : []
schémas MODIFIÉS  : ['BalanceResponseDto']  → props + ['balanceSourceId', 'origine'] ; `required` INCHANGÉ
routes  MODIFIÉES : ['/dossiers/{dossierId}/balances']   (le paramètre de requête)
```

**`ANouveauxResponseDto` n'apparaît pas** dans les modifiés ⇒ AC-4 tenu, et prouvé plutôt qu'affirmé. Une
garde le fige en plus dans `openapi-contract.e2e-spec.ts` (liste exacte de ses douze propriétés).

### Table de mutations exécutée (chacune restaurée)

| Mutation | Test attendu rouge | Constat |
|---|---|---|
| `origine` n'est plus mappée dans la vue | contrôleur ×2 | 🔴 2 rouges |
| `balanceSourceId` sort en `null` au lieu d'être absent | « ABSENTS … ni `null` » + « origine SANS chaînage » | 🔴 2 rouges |
| le filtre n'est plus posé sur la requête Mongo | « pose le filtre d'ORIGINE dans la requête Mongo » | 🔴 1 rouge |
| `enumName` retiré (l'enum redevient **inline**) | garde OpenAPI « énumération NOMMÉE » | 🔴 1 rouge |
| `@IsIn` retiré du filtre (vocabulaire plus fermé) | e2e « une origine inconnue est REFUSÉE » | 🔴 1 rouge |

🪤 **La 4ᵉ mutation a d'abord rougi POUR LA MAUVAISE RAISON** : retirer `enum: ORIGINES_BALANCE` rendait
l'import orphelin ⇒ `TS6133`, suite non compilée (`Tests: 0 total`). Rejouée en ne retirant que
`enumName` — l'import reste lu, `tsc --noEmit` muet, et la garde rougit sur ce qu'elle prétend garder.
*(Même piège qu'en STORY-387, STORY-386, STORY-385 et STORY-179.)*

### Vérification docker réelle — 2026-08-25

Même tenant que STORY-387 (org `6a8cde6d…4eb0`, dossier `6a8cde6f…ed61`), **documents réels** : deux
balances de clôture `VALIDÉE` (2023, 2024) et le socle `A_NOUVEAUX` de 2026 généré par la vérification
précédente.

| # | Appel | HTTP | Ce qui est prouvé |
|---|---|---|---|
| 1 | `GET /dossiers/{d}/balances` | **200** | 3 balances : le socle sort `origine: "A_NOUVEAUX"` **et** `balanceSourceId: 6a8cded0…67d4` ; les deux balances ordinaires sortent les **deux clés ABSENTES** (testé par `'origine' in b`, pas par la valeur) |
| 2 | en base : `db.balances.findOne({_id: socle.balanceSourceId})` | — | pointe sur la balance **2023 `VALIDÉE`**, et `source.exercice.fin < socle.exercice.debut` ⇒ le chaînage désigne bien **N-1**, pas un identifiant plausible |
| 3 | `?origine=A_NOUVEAUX` | **200** | **1** balance sur 3 |
| 4 | `?origine=PROVISIONS_FISCALES` | **200** | **0** balance ⇒ le filtre **filtre réellement**. C'est le cas qui **discrimine** : un filtre ignoré en silence rendrait 3 |
| 5 | `?origine=SAISIE` | **400** | `origine must be one of the following values: A_NOUVEAUX, PROVISIONS_FISCALES` ⇒ refus explicite, vocabulaire nommé |

### Revue de code (⑥)

**1 constat**, non bloquant, **corrigé** avant le merge (commit dédié).

Les trois `mockResolvedValue([…] as never)` ajoutés aux e2e n'étaient pas nécessaires : le double de
document se type sans aide. Un `as never` posé « au cas où » éteint le contrôle qui signalerait un double
devenu incompatible avec le service qu'il remplace — c'est-à-dire exactement le filet que ces tests posent.
Retiré : `tsc --noEmit` muet, 51/51 verts.

**Écarté explicitement** : `enumName: 'OrigineBalance'` est déclaré à **deux** endroits (DTO de réponse et
DTO de requête). Ce n'est pas une duplication de valeur — les deux dérivent de la **même** constante
`ORIGINES_BALANCE`, et la garde OpenAPI assert le contenu de l'énumération publiée : une divergence
rougirait.

### Revue de sécurité (⑦)

**0 vulnérabilité.** Le point qui méritait d'être **discriminé**, et pas seulement raisonné : le nouveau
paramètre alimente un **filtre Mongo**, donc la question est l'injection d'opérateur. Sondé sur la stack :

| Requête | HTTP | Message |
|---|---|---|
| `?origine[$ne]=A_NOUVEAUX` | **400** | `property origine[$ne] should not exist` |
| `?origine[$regex]=.` | **400** | `property origine[$regex] should not exist` |
| `?origine=A_NOUVEAUX&origine=PROVISIONS_FISCALES` *(tableau)* | **400** | `origine must be one of the following values: …` |
| `?origine=` *(vide)* | **400** | idem |
| `?origine=A_NOUVEAUX` | **200** | 1 balance |

⇒ **aucun objet ne peut atteindre `filter.origine`** : la clé crochetée reste littérale et tombe sur
`forbidNonWhitelisted`, le tableau et la chaîne vide tombent sur `@IsIn`. Et même en aval, la garde
`if (options.origine)` écarte toute valeur falsy.

Vérifié et écarté par ailleurs :

- **aucune donnée neuve exposée** : `origine` et `balanceSourceId` étaient **déjà** publiés par
  `ANouveauxResponseDto` à la génération du socle. Cette story les rend **relisibles**, elle ne divulgue
  rien qui ne l'était pas ;
- **`balanceSourceId` est un `ObjectId` du même dossier** — il ne devient jamais un vecteur
  d'énumération : la route de lecture d'une balance reste dossier-scopée et rend **404** sur une balance
  d'un autre dossier (anti-énumération inchangée) ;
- **aucune surface d'écriture ajoutée** : la story ne touche ni `SubmitBalanceDto`, ni un guard, ni un
  événement ; `listByOrg` reste org- **et** dossier-scopé, les deux identifiants venant du JWT et de
  `DossierScopeGuard`, jamais de la requête.
