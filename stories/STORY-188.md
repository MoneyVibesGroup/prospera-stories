# STORY-188 : Le garde-fou **N/N-1** n'existe que dans la console — un appel direct au service le contourne sans rien signaler

**Epic :** EPIC-014 — Catalogue plateforme (`platform-catalog-service`)
**Réf. :** **AP-04** *(l'écran qui l'applique aujourd'hui)* · **STORY-032** *(le CRUD à amender)* · `frontend-admin-panel/src/features/catalog/support-window.ts` *(la règle, écrite en TypeScript)*
**Découverte par :** audit des actions du catalogue de la console, 2026-08-06
**Priorité :** Must Have — ⚡ **une règle métier contournable n'est pas une règle**
**Story Points :** 5
**Statut :** À faire
**Créée le :** 2026-08-06
**Sprint :** 20
**Service :** `platform-catalog-service` (`:3003`)

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
