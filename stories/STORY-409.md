# STORY-409 : la devise d'un compte de trésorerie est imposée `XOF` en dur — un relevé étranger serait lu comme des francs CFA

Status: todo
**Service :** `balance-service` (`:3007`) · **Module :** `tresorerie`
**Points :** 5 · **Sprint :** S20 · **Epic :** EPIC-022
**Origine :** constat PO du 2026-08-25, à la revue de la maquette **FE-049** — « une société peut
avoir un compte dans différentes banques de différents pays ».

---

## Le constat, relevé à la source

`CompteTresorerieResponseDto` **publie** une `devise` (`@example XOF`). L'écran l'affiche.
On croit donc le champ paramétrable. Il ne l'est pas :

| où | ce qui s'y passe |
|---|---|
| `CreerCompteTresorerieDto` | **aucun champ `devise`** — rien à envoyer |
| `comptes-tresorerie.service.ts:81` | `devise: 'XOF'` — **écrit en dur** à la création |
| `comptes-tresorerie.service.spec.ts:251` | un test **fige** le comportement : « la devise est imposée à XOF » |
| `types/tresorerie.ts` → `EtatLigneReleve.montant` | documenté « **unités mineures XOF**, entier strictement positif » |
| `ModifierCompteTresorerieDto` | ne la reprend pas davantage |

⇒ **La `devise` n'est pas une donnée, c'est une constante habillée en donnée.**

## Pourquoi ça compte — et pourquoi ce n'est pas qu'un libellé

Le cabinet togolais qui ouvre ce module a des clients qui **commercent avec le Ghana et le
Nigeria**. Un compte en `GHS`, en `NGN` ou un compte `EUR` chez un correspondant n'est pas un cas
d'école : c'est le client qui exporte.

Or le rapprochement ne compare pas des libellés, il compare des **entiers** :

```
ecart = soldeReleve − enCoursCredit + enCoursDebit − soldeComptable
```

`soldeReleve` vient du **fichier importé** ; `soldeComptable` vient de la **balance**, en unités
mineures XOF. Rien, sur tout ce chemin, ne porte ni ne vérifie une devise.

⛔ **Un relevé en cédis serait donc lu comme des francs CFA, comparé à un compte comptable en
francs CFA, et l'écart s'afficherait sans le moindre signal.** Ce n'est pas une donnée manquante
— c'est un **écart plausible et faux**, exactement le mode de panne n°2 du programme. Et l'écran
afficherait « XOF » sur ce compte : une devise **fausse**, pas une devise absente. Un champ vide
se remarque ; un champ faux se recopie.

⚠️ **Ce que la zone UEMOA masque.** Les **huit** pays que l'assistant de dossier propose partagent
tous le XOF. Un client avec des comptes au Togo, au Bénin et en Côte d'Ivoire fonctionne
**parfaitement aujourd'hui** — et c'est ce qui rend le défaut dangereux : il ne se déclenche
jamais sur le cas courant, seulement au premier compte hors zone, chez le client le plus gros.

## Ce qui est demandé

1. `devise` devient un **champ de création**, validé contre une liste fermée (ISO-4217), avec
   `XOF` **par défaut** — le cas courant ne doit pas devenir plus coûteux.
2. Une ligne de relevé **porte la devise de son compte**, et l'import **refuse** un fichier dont
   la devise contredirait celle du compte plutôt que de convertir en silence.
3. L'**état de rapprochement** refuse de calculer un écart entre deux devises et le **dit**
   (`motifNonCalculable`, déjà au contrat) — plutôt que de rendre un nombre.
4. ⚠️ **La conversion n'est PAS demandée.** Un taux de change est une décision comptable datée, pas
   un calcul d'écran : la comptabilité de la société est tenue dans **sa** monnaie, et c'est
   l'écriture de conversion qui fait foi. Ce qui est demandé, c'est que le service **cesse de
   mélanger** — pas qu'il arbitre.

## Ce que le front peut faire en attendant, et ce qu'il ne peut pas

**Peut** : afficher la devise servie telle quelle. **Ne peut pas** : la corriger, la choisir, ni
détecter qu'un fichier est dans une autre devise — rien au contrat ne le lui dit. ⇒ **aucune garde
côté client n'est possible**, et c'est pourquoi cette story ne peut pas être contournée.

## Critères d'acceptation

1. Un compte se déclare avec une devise ; l'omettre donne `XOF`.
2. Un relevé importé sur un compte d'une autre devise est **refusé**, avec un code nommé.
3. L'état de rapprochement d'un compte non-XOF rend `ecart: null` + `motifNonCalculable`.
4. Le test `« la devise est imposée à XOF »` est **remplacé**, pas supprimé — il devient le test du
   défaut par défaut.
5. OpenAPI régénéré ; la `devise` cesse d'être un `@example` pour devenir un enum.

## Notes

⚠️ **Le test existant fige le défaut.** `comptes-tresorerie.service.spec.ts:251` s'appelle
littéralement « la devise est imposée à XOF » : il est **vert**, et il le restera en protégeant
exactement ce que cette story corrige. Un test protège un bug aussi fidèlement qu'une règle —
même famille que les trois tests d'AP-22 qui asseyaient une date non choisie.
