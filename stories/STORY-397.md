# STORY-397 : Les codes de réintégration sont validés mais jamais publiés — le comptable les tape à l'aveugle

Status: ready-for-dev

**Épic :** EPIC-020 — Cahiers & pièces (Atelier Balance)
**Service :** `balance-service` (`:3007`) — `referentiel` / `cahiers`
**Points :** 3 · **Sprint :** S20
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
