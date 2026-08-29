# STORY-409 : la devise d'un compte de trésorerie est imposée `XOF` en dur — un relevé étranger serait lu comme des francs CFA

Status: review
**Service :** `balance-service` (`:3007`) · **Module :** `tresorerie`
**Points :** 5 · **Sprint :** S20 · **Epic :** EPIC-022 · **Complexité :** high
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

---

## Conception — écrite AVANT le code

Le cadrage porte **une prémisse fausse et une tension**, et les deux se voient dès qu'on cherche où
poser le refus.

### D-409-1 — « la devise du fichier » n'existe pas : aucun relevé ne la déclare

L'AC-2 demande de refuser « un fichier dont la devise contredirait celle du compte ». Or **rien, sur
tout le chemin de lecture, ne porte une devise** : `MAPPING_CLES_RELEVE` n'a pas de champ de devise,
`lireMontantEtSens` rend un entier, et `enMineures` multiplie par 100 sans rien savoir de l'unité. Un
export TMoney et un export Ecobank Ghana sont **le même octet** à la lecture.

Le seul endroit où un humain déclare quoi que ce soit **à propos d'un fichier**, c'est le **profil
d'import** — qui porte déjà son séparateur, son encodage et son mapping. La devise d'un format en est
exactement de la même nature : *« ce format-là contient des cédis »*.

⇒ **Le profil d'import de cible `RELEVE` gagne une `devise` facultative.** Renseignée et différente de
celle du compte ⇒ **refus `DEVISE_PROFIL_INCOMPATIBLE`**. Absente ⇒ **aucun refus** : le profil ne dit
rien, et le cas courant ne devient pas plus coûteux (exigence explicite du cadrage).

⚠️ Elle est **facultative et le restera** : la rendre obligatoire ferait échouer d'un coup **tous** les
profils déjà enregistrés, pour un client qui n'a rien changé.

### D-409-2 — le refus d'import et le refus de rapprochement ne gardent PAS la même chose

Si l'import refusait tout compte dont la devise diffère de celle de la comptabilité, alors un compte
non-XOF n'aurait **jamais** de ligne — et l'AC-3 (« l'état de rapprochement rend `ecart: null` +
`motifNonCalculable` ») serait **vraie par vacuité** : sans ligne, `soldeReleve` est déjà `null` et le
motif existant (« aucune ligne ne porte de solde après opération ») répondrait à sa place. La garde
passerait au vert **sans jamais exercer la devise**.

Les deux refus gardent donc deux comparaisons distinctes :

| Refus | Compare | Code |
|---|---|---|
| **import** | la devise **déclarée par le profil** et celle du **compte** | `DEVISE_PROFIL_INCOMPATIBLE` |
| **rapprochement** | la devise du **compte** et celle de la **comptabilité du dossier** | `motifNonCalculable` |

⇒ **L'import n'est PAS refusé sur un compte non-XOF.** Le comptable importe son relevé ghanéen, le
consulte, lit sa situation de compte — et l'**écart**, lui, n'est pas calculé. C'est très exactement
« le service cesse de mélanger, il n'arbitre pas ».

### D-409-3 — la devise de la comptabilité est celle que STORY-387 a déjà posée

`BalanceService.deviseDuDossier` la lit depuis le **profil société** (repli `DEVISE_PAR_DEFAUT`), avec
une subtilité payée en revue : `||` et non `??`, pour qu'une devise **vide** — écrite par une reprise de
données hors Mongoose — ne produise pas un montant sans unité.

⇒ **Aucune seconde lecture.** La règle est extraite en fonction pure `deviseDuProfil(profil)`, appelée
par les deux services. Recopier `profil?.devise || DEVISE_PAR_DEFAUT` dans la trésorerie, c'est signer
que les deux copies divergeront — et l'écart serait alors invisible.

⚠️ `TresorerieModule` **ne peut pas** importer `BalanceModule` (cycle : `sage-import` → `TresorerieModule`).
Le modèle `ProfilSociete` est donc enregistré localement, **exactement comme `BalanceModule` le fait déjà
pour `CompteTresorerie`** — le précédent est écrit dans `balance.service.ts:466`.

### D-409-4 — deux listes de devises, et elles ne disent PAS la même chose

`DEVISES_SUPPORTEES = ['XOF']` déclare aujourd'hui « le service est mono-devise ». Deux besoins
distincts s'y cachent :

- **la devise dans laquelle une comptabilité est tenue** — reste `XOF` en v1, **hors périmètre** : la
  changer déplacerait l'unité de toutes les balances du service ;
- **le vocabulaire ISO-4217 que le service sait nommer** — s'ouvre ici, parce qu'un compte de trésorerie
  ghanéen doit pouvoir se déclarer.

⇒ `DEVISES_ISO` est ajoutée **dans le même fichier**, et un test garde l'inclusion
`DEVISES_SUPPORTEES ⊆ DEVISES_ISO` : deux listes qui se croisent sans se contenir seraient un compte
déclarable dans une devise que la comptabilité ne saurait pas nommer.

### D-409-5 — la ligne **fige** la devise de son compte, et le compte se verrouille

Une ligne persistée porte sa devise. Sans cela, changer la devise d'un compte **réinterpréterait
rétroactivement** des montants déjà écrits — 1 000 cédis deviendraient 1 000 francs sans qu'aucune
écriture ne bouge.

Et le corollaire : **la devise d'un compte qui porte déjà une ligne ne se modifie plus**
(`DEVISE_COMPTE_FIGEE`, même famille que `COMPTE_TRESORERIE_REFERENCE`). La ligne fige, le compte
verrouille : les deux ensemble, sinon le figeage n'est qu'un enregistrement de plus à contredire.

### D-409-6 — AC-4 : le test qui fige le défaut est **remplacé**, pas supprimé

`« la devise est imposée à XOF »` devient `« l'omettre donne XOF »` : le même octet de comportement,
mais gardé comme un **défaut** et non comme une **contrainte**. Supprimer le test perdrait la garantie
que le cas courant reste gratuit.

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

---

## Progress Tracking

**2026-08-29 — conception écrite avant le code, statut `in_progress`.**
Branche `MNV-409` ouverte sur `docs/` (base `main`) et sur `balance-service` (base `dev`, après
`git fetch` — `origin/dev` porte bien les 3 commits de STORY-408).
Décisions **D-409-1 à D-409-6** posées avant la première ligne. Les deux structurantes :
**D-409-1** (« la devise du fichier » n'existe nulle part — le profil d'import est le seul endroit où
un humain peut la déclarer) et **D-409-2** (refuser l'import sur un compte non-XOF rendrait l'AC-3
**vraie par vacuité**, puisque sans ligne le motif « aucun solde de fin » répondrait à la place de la
devise).
Statut aligné aux 3 endroits (en-tête, `sprint-status.yaml`, cette section).

**2026-08-29 — développée, validée, vérifiée sur stack docker neuve. Statut `review`.**

Branche `MNV-409` sur `balance-service`, commit `f7854ce`.

### Portes de qualité

Lint **0 warning** · build OK · **3211 unitaires verts** (177 suites) · **805 e2e verts** (26 suites) ·
couverture **99,15 % stmts / 92,04 % branches / 98,64 % fonctions / 99,24 % lignes**
(seuils 65/90/90/90).

⚠️ **Portly indisponible** pendant toute la passe, comme en STORY-408 et STORY-411 : tout lancé
directement, hors Portly.

### Passe de mutation — 10 mutations, 10 rouges, toutes restaurées

| # | Mutation | Ce qui vire au rouge |
|---|---|---|
| **M1** | la devise redevient une constante en dur à la création | « la devise DÉCLARÉE est écrite telle quelle » |
| **M2** | le verrou de devise saute (`> 0` → `< 0`) | les 2 tests de `DEVISE_COMPTE_FIGEE` |
| **M3** | l'écart se calcule quand même sur deux devises | AC-3 unitaire **et** e2e |
| **M4** | la comparaison de devises disparaît | AC-3 unitaire |
| **M5** | le refus d'import s'inverse | AC-2 + figeage de la ligne |
| **M6** | le refus devient aveugle au profil **muet** | « un profil MUET ne refuse rien » *(voir ci-dessous)* |
| **M7** | la ligne ne fige plus la devise du compte | « la ligne persistée FIGE la devise » |
| **M8** | `\|\|` redevient `??` dans `deviseDuProfil` | « une devise VIDE replie aussi » |
| **M9** | `DEVISES_SUPPORTEES` sort du vocabulaire ISO | D-409-4 (inclusion) |
| **M10** | le refus « devise hors cible » s'inverse | les 2 tests de `DEVISE_HORS_CIBLE` |

⚡ **M6 a démasqué une contre-épreuve faible, et le typage a démasqué M6.**
Écrite au plus simple (`profil.devise !== compte.devise`), la mutation **ne compilait pas** : retirer
le `!== undefined` fait perdre le narrowing, et `DeviseProfilIncompatibleException` exige une `string`.
Un rouge par erreur de compilation ne prouve rien (leçon STORY-179/407). Réécrite en repli implicite
(`profil.devise ?? 'XOF'`), elle **passait au vert** : mon test « un profil muet ne refuse rien » tournait
sur un compte en **XOF**, où un tel repli est indistinguable du comportement correct. Le test a été
refait sur un compte **GHS** — le seul cas où la mutation se voit, et exactement celui qui casserait tous
les profils déjà enregistrés.

### Vérification docker — stack neuve (`down -v`), parcours HTTP réel

Organisation `6a93…72b4`, dossier `6a93…85d2`. Service redémarré sur la branche (`Found 0 errors`
compté avant toute mesure).

**① AC-1 — la devise devient une donnée**

| Appel | Résultat |
|---|---|
| compte **sans** `devise` | **201**, `devise: "XOF"` — la zone UEMOA ne paie rien |
| compte `devise: "GHS"` | **201**, `devise: "GHS"` |
| compte `devise: "cedi"` | **400** — la liste est fermée, pas une chaîne libre |

**② AC-2 — le profil est le seul endroit où un fichier déclare sa devise**

| Appel | HTTP | Code |
|---|---|---|
| profil **XOF** → compte **GHS** | **400** | `DEVISE_PROFIL_INCOMPATIBLE`, `details: { deviseProfil: "XOF", deviseCompte: "GHS" }` |
| profil **GHS** → compte **GHS** | **201** | 3 lignes, 0 rejet |
| profil de cible **BALANCE** portant une devise | **400** | `DEVISE_HORS_CIBLE` |

En base : `lignes_releve` groupées par devise ⇒ **3 lignes `GHS`** sur le compte ghanéen, **3 lignes
`XOF`** sur le compte togolais. La devise est **figée par ligne**, pas relue.

**③ D-409-5 — la ligne fige, le compte verrouille**

| Geste sur le compte GHS (3 lignes, 1 lot) | HTTP |
|---|---|
| `PATCH { devise: "XOF" }` | **409 `DEVISE_COMPTE_FIGEE`**, `details: { deviseActuelle: "GHS", lignes: 3, imports: 1 }` |
| `PATCH { libelle }` seul | **200** — renommer reste possible |
| `PATCH { devise: "GHS" }` (identique) | **200** — re-poster n'est pas changer |
| `PATCH { devise: "EUR" }` sur un compte **vierge** | **200** |

**④ ⚡⚡ AC-3 — LA mesure, et sa contre-épreuve, sur les MÊMES données**

Une balance réelle posée sur l'exercice, un `soldeApres` sur la dernière ligne : **les deux soldes sont
présents des deux côtés**, ce qui est tout l'intérêt — le refus ne peut pas être confondu avec « il
manque une donnée » (D-409-2).

| Compte | `soldeComptableTheorique` | `soldeComptable` | `ecart` |
|---|---|---|---|
| **GHS** (comptabilité XOF) | `0` | `0` | **`null`** + motif nommant `GHS` et `XOF` |
| **XOF** (mêmes lignes, même balance) | `0` | `0` | **`0`**, aucun motif |

⛔ **C'est ce `0` que le compte ghanéen aurait affiché** avant la story : une réconciliation parfaite, et
parfaitement fausse — le mode de panne n°2 du programme, sur le chiffre que le cabinet signe.

Stack arrêtée (`docker compose stop`).
