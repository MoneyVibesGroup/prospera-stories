# STORY-431 : Les comptes écartés ne sont relevés que sur N — la colonne N-1 peut être minorée sans qu'aucun avertissement ne le dise

Status: in_progress

**Épic :** EPIC-010 — États financiers (`bilan-service`)
**Service :** `bilan-service` (`:3004`) — `etats/compte-resultat-production.service.ts`,
`etats/bilan-production.service.ts`
**Points :** 2 · **Sprint :** à slotter
**Origine :** maquette **FE-032**, 2026-08-27.

---

## Le fait

Les deux moteurs agrègent **deux jeux de soldes** et **jettent la moitié du diagnostic** :

```ts
const aggN  = this.agreger(pkg, soldesN,  surcharges);
const aggN1 = soldesN1 ? this.agreger(pkg, soldesN1, surcharges) : undefined;
…
comptesNonMappes: aggN.nonMappes,      // ← aggN1.nonMappes n'est jamais lu
```

`aggN1` calcule ses propres `nonMappes` — puis ils disparaissent.

## Ce que ça produit

Un compte présent **uniquement en N-1** et rattaché à aucun poste (un compte que le cabinet a
soldé et cessé d'utiliser, un compte d'attente de l'exercice précédent, un compte dont la
surcharge de rattachement a été créée **après** la clôture N-1) :

- son solde **n'entre pas** dans les colonnes N-1 ;
- il **n'apparaît dans aucune liste** ;
- la variation N/N-1 affichée est donc fausse, **et l'écran l'annonce comme un fait**.

⚠️ Et l'avertissement existant dit le contraire de ce qui se passe : l'écran affiche
« *aucun compte écarté* » sur la foi de `comptesNonMappes: []` — vrai pour N, muet sur N-1.

C'est la **même famille de défaut** que celui relevé par FE-030 sur la compensation
(« *autant de débit que de crédit écartés se compensent : l'équation tombe juste et la liasse
est fausse* ») : un contrôle qui ne couvre qu'une partie du périmètre est **plus dangereux**
qu'un contrôle absent, parce qu'il rassure.

---

## Critères d'acceptation

- [ ] AC-1 — `BilanDto` et `CompteResultatDto` publient `comptesNonMappesN1: string[] | null`
      (`null` si aucun jeu N-1 n'a été produit — **jamais `[]`**, qui voudrait dire
      « produit, et aucun écarté »).
- [ ] AC-2 — Le champ existant `comptesNonMappes` **ne change pas de sens** (il reste N) ; le
      renommer casserait STORY-059/060 et leurs tests.
- [ ] AC-3 — Test : un compte non mappé présent **seulement** dans `soldesN1` ⇒
      `comptesNonMappes: []` **et** `comptesNonMappesN1: ['<compte>']`. C'est la preuve du
      manque actuel.
- [ ] AC-4 — Sans `soldesN1` : `comptesNonMappesN1: null`.

## Vigilance

- ⚠️ Ne **pas fusionner** les deux listes. Un compte écarté en N-1 mais rattaché en N est une
  information différente d'un compte écarté dans les deux : les fondre reproduirait, à l'envers,
  le défaut que STORY-427 corrige sur les postes.
- ⚠️ La même remarque vaut pour le **TFT** (`tft-production.service.ts`) et les **contrôles de
  cohérence** (`controles-coherence-production.service.ts`) s'ils lisent `aggN` seul :
  à vérifier au passage, et à ficher séparément le cas échéant.

## Conséquences ailleurs

- **FE-032** affiche déjà l'avertissement dans l'état « Comptes écartés » et **le dit
  explicitement** : « ce contrôle ne porte que sur N ».

---

## Progress Tracking

**Statut : `in_progress`** — branche `MNV-431` ouverte sur `bilan-service` (base `dev`), flux
APEX-PROSPERA lancé le 2026-09-02.

### Périmètre confirmé à l'ouverture

Les deux moteurs `bilan-production.service.ts` (l. 137) et `compte-resultat-production.service.ts`
(l. 112) calculent bien `aggN1` et n'en publient **jamais** les `nonMappes`. Le champ manquant
est donc **additif** des deux côtés.

⚠️ **Vérification demandée par la Vigilance — TFT et contrôles de cohérence** : ni
`tft-production.service.ts` ni `controles-coherence-production.service.ts` n'agrègent de soldes.
Ils travaillent sur les **états déjà produits** (`produire(pkg, bilan, cr)` et
`produire(bilan, coherence, tft, notes, coherenceSig)`) et n'ont donc **pas** de passe `aggN1` à
récupérer. Le seul point de contact est `controleComptesNonAffectes`, qui lit
`bilan.soldesComptesNonMappes` — c'est-à-dire **N seul** — et dont le JSDoc le dit déjà. Étendre le
**contrôle** à `N-1` reste un écart distinct : voir « Écart relevé au passage » ci-dessous.
