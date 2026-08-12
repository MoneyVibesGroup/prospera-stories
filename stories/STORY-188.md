# STORY-188 : Le garde-fou **N/N-1** n'existe que dans la console — un appel direct au service le contourne sans rien signaler

**Epic :** EPIC-014 — Catalogue plateforme (`platform-catalog-service`)
**Réf. :** **AP-04** *(l'écran qui l'applique aujourd'hui)* · **STORY-032** *(le CRUD à amender)* · `frontend-admin-panel/src/features/catalog/support-window.ts` *(la règle, écrite en TypeScript)*
**Découverte par :** audit des actions du catalogue de la console, 2026-08-06
**Priorité :** Must Have — ⚡ **une règle métier contournable n'est pas une règle**
**Story Points :** 5
**Statut :** in_progress
**Complexité :** high
**Créée le :** 2026-08-06
**Sprint :** 20
**Service :** `platform-catalog-service` (`:3003`)
**Assignée à :** `vivianMoneyVibesGroupes`

---

## Le constat

La règle *« pas de troisième majeure active sans dépréciation datée de la sortante »* — la **fenêtre
de support N/N-1** — est un invariant produit. Elle est aujourd'hui **entièrement côté console**.

`CreateModuleVersionDto` ne porte que `{ version, releasedAt? }`. **Ni `supersedesMajor`, ni la
notion de fenêtre de support.** Le service accepte donc une troisième majeure active sans rien dire.

Le client de la console le documente lui-même, sans le maquiller :

> *« Conséquence à connaître : la règle est tenue tant qu'on passe par cette console. Un appel direct
> au service la contourne sans rien signaler. Ce n'est donc **pas un invariant du système** — c'est
> une politique d'interface. »*

### Second défaut, du même endroit : la dépréciation n'est pas atomique

Le service n'offre **aucun geste atomique** pour « déprécier la sortante **et** publier la nouvelle ».
La console le fait donc en **deux appels** :

```
1. PATCH …/versions/:sortante   { status: DEPRECATED, deprecationDate }
2. POST  …/versions             { version, releasedAt }
```

⚠️ **Si le second échoue, le premier reste.** L'ancienne majeure est dépréciée, la nouvelle n'existe
pas : le module se retrouve avec **zéro version active** — un état que personne n'a demandé et que
rien ne rattrape. La console peut le dire à l'écran ; elle ne peut pas l'empêcher.

---

## ⚡ Vérification de la prémisse au démarrage (2026-08-12) — elle est **à moitié fausse**

Lecture de `module-versions.service.ts` **avant** d'écrire une ligne : le garde-fou **existe déjà côté
service**. `ModuleVersionsService.assertMajorBudget()` compte les majeures `ACTIVE` du module et refuse
une troisième — depuis STORY-032. Un appel direct au service **ne la contourne donc pas**.

Ce qui est vrai, et qui reste le cœur de la story :

| Affirmation de la story | Verdict | Ce qui est réellement en cause |
|---|---|---|
| « le service accepte une 3ᵉ majeure active sans rien dire » | ❌ **faux** | il refuse — `ConflictException` 409 |
| « `CreateModuleVersionDto` ne porte que `{version, releasedAt}` » | ✅ vrai | ni `supersedesMajor` ni `deprecationDate` |
| « aucun geste atomique déprécier + publier » | ✅ vrai | **la seule voie** est PATCH puis POST, non atomique |
| « le refus ne nomme ni le champ fautif ni les majeures » | ✅ vrai | phrase en français, sans `code`, `field`, ni majeures structurées |

⚡ **Le vrai défaut est plus retors que celui décrit.** Le garde-fou n'est pas absent : il est
**infranchissable**. N'ayant aucune façon de désigner la sortante dans l'appel de publication, l'admin
est *obligé* de passer par les deux appels — c'est le refus lui-même qui **impose** la séquence non
atomique dont la story décrit les dégâts. Le trou de « zéro version active » n'est pas un chemin de
traverse : c'est **le seul chemin offert**.

La story n'en est pas invalidée, son livrable ne change pas — mais l'AC 1 change de nature : il ne s'agit
pas d'**ajouter** un refus, il s'agit de le rendre **actionnable** (422 + `code` + `field` + majeures) et
de lui donner **une issue en un seul appel**.

---

## Périmètre

**Inclus :**

- `CreateModuleVersionDto` accepte `supersedesMajor?: number` et `deprecationDate?: string`.
- **Le service applique la règle**, quel que soit l'appelant : refuser en **422** la publication d'une
  majeure qui porterait à trois le nombre de majeures actives, **sauf** si l'appel désigne la sortante
  *et* sa date de fin de support.
- **Publication atomique** : dépréciation de la sortante et création de la nouvelle dans une seule
  transaction. Un échec ne laisse aucun état intermédiaire.
- Le refus nomme le **champ fautif** et les majeures en cause — l'écran doit pouvoir l'ancrer sur le
  bon input, pas afficher un message générique.

**Hors périmètre :**

- Changer la règle elle-même *(deux majeures actives, pas trois)* — elle est acquise.
- Le retrait (`RETIRED`) : geste distinct, déjà servi.
- La console : elle garde son calcul d'annonce **avant** le clic — c'est une aide à la décision, pas
  la garde. ⚡ Elle enverra désormais `supersedesMajor`, qu'elle calcule déjà et **jette** aujourd'hui.

---

## ⚠️ Ce qui existe déjà côté front, et qu'il ne faut pas réinventer

`support-window.ts` porte la règle et sa fonction `publishEffect(versions, moduleCode, version)`,
couverte par `support-window.test.ts` *(« l'arbitrage N/N-1 est annoncé AVANT la publication »)*. Elle
rend trois verdicts : rien à faire · arbitrage requis · refus. **C'est la spécification exécutable de
cette story** — la porter côté service, c'est la traduire, pas la redécouvrir.

---

## Décisions de conception (tranchées ici, absentes du cadrage)

1. **Le refus N/N-1 passe de `409` à `422`** — la story l'exige (« échoue en **422** »). C'est un
   **changement de contrat** : `ApiConflictResponse` de la route perd le motif N/N-1, qui devient un
   `ApiUnprocessableEntityResponse`. Le `409` reste pour ce qui est **vraiment** un conflit d'état :
   la version en double. Défendable : « trois majeures actives » n'est pas un conflit de ressource,
   c'est une **entité non traitable en l'état** — et c'est le statut que le service utilise déjà pour
   ses autres refus de règle métier porteurs d'un `code` (`REFERENTIEL_FAMILY_UNKNOWN`, STORY-148).
2. **Trois codes d'erreur stables**, portés **dans le corps** (patron STORY-138/148/185) :
   `SUPPORT_WINDOW_ARBITRATION_REQUIRED` · `SUPERSEDES_MAJOR_NOT_ACTIVE` · `DEPRECATION_DATE_REQUIRED`.
3. ⚠️ **Les majeures en cause exigent un champ de plus dans `AllExceptionsFilter`.** Ce corps est
   construit par **liste blanche** : poser `majors` sur l'exception ne suffit pas, il serait **jeté sans
   erreur** et l'AC « les majeures en cause » passerait pour satisfait alors que la console ne recevrait
   rien. C'est la **4ᵉ fois** que ce piège se présente (`code`, `limitBytes`, `field` avant lui).
4. **`supersedesMajor` est honoré dès qu'il est fourni**, pas seulement quand l'arbitrage est requis :
   c'est une intention explicite (« celle-ci sort du support »), et elle n'ouvre aucun pouvoir nouveau
   — le `PATCH` de dépréciation existe déjà et est ouvert à la même permission. Il doit désigner une
   majeure **`ACTIVE` du module** et **différente** de celle publiée (sinon `422`).
5. **Toute publication passe par une transaction**, arbitrage ou non. Un second chemin « sans session »
   pour le cas simple dédoublerait le garde-fou : la règle serait évaluée à deux endroits, et c'est
   exactement ainsi qu'une des deux copies se met à mentir.
6. **Mapping `E11000`** de l'index unique `(moduleCode, version)` vers le même `409` que le pré-contrôle.
   Sans lui, la publication concurrente de la même version répondait **500**. L'index est le vrai filet,
   le pré-contrôle n'est qu'une amabilité.

## Critères d'acceptation

- [ ] Publier une majeure qui ferait **trois** majeures actives, **sans** `supersedesMajor`, échoue en
      **422** avec le champ fautif et les majeures en cause.
- [ ] Le même appel **avec** `supersedesMajor` + `deprecationDate` réussit et déprécie la sortante.
- [ ] `supersedesMajor` sans `deprecationDate` échoue en **422** — une dépréciation sans date de fin
      de support n'est pas une dépréciation.
- [ ] **Atomicité prouvée** : un échec de création laisse la sortante **ACTIVE**. Test qui force
      l'échec après la dépréciation et vérifie qu'aucune version n'a changé d'état.
- [ ] Un module ne peut **jamais** se retrouver sans version active du fait de cette route.
- [ ] La règle s'applique **à l'appelant direct**, pas seulement à la console — testé sans passer par elle.
- [ ] OpenAPI à jour ; la console peut retirer sa note « la règle n'est pas un invariant du système ».

---

## Tâches

- [ ] Étendre `CreateModuleVersionDto` (AC 1, 2, 3)
- [ ] Porter `publishEffect` côté service comme règle de validation (AC 1, 6)
- [ ] Rendre la publication transactionnelle (AC 4, 5)
- [ ] OpenAPI + tests (AC 7)

---

## ⚠️ Note de capacité

Le S20 passe de **75 à 80 points pour 34 de capacité**. Le slot est celui qui a été demandé.
Ordre de décalage défendable : garder **179 + 180**, décaler **181 · 185 · 186 · 187 · 188** au S21.
⚡ Si un seul de ces cinq doit rester, c'est **188** : les autres décrivent des manques, celui-ci
décrit une **règle métier que le système n'applique pas**.

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
