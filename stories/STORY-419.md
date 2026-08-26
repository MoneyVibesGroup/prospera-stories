# STORY-419 : Une règle de rattachement peut être enregistrée, listée, affichée « posée »… et n'agir sur rien

Status: ready-for-dev

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
