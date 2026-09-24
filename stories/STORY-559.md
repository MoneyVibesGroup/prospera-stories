# STORY-559 : Le référentiel déclare 11 notes annexes, le dépôt en attend 44 — les 33 manquantes, avec leurs règles d'alimentation

Status: done

**Épic :** EPIC-010 — Référentiels & table de passage
**Service :** `bilan-service` (`:3004`) — `modules/bilan/referentiel/assets`, `etats/notes-annexes`
**Points :** 13 · **Sprint :** S20
**Origine :** mesure du 2026-08-28 sur la pièce de dépôt réelle, à la demande du PO.
**Débloque :** **STORY-537** (le gabarit de dépôt Togo) — sans les notes, le classeur sort avec 33
feuilles vides.
**Réf. :** `fiche-questions-comptables-REMPLIE-2026-07-19.md` (§D — périmètre automatisable, déjà
instruit et **revalidé contre les postes GUDEF réels** le 2026-07-20) · **tech-spec Bilan B8**

---

## Le fait, mesuré

`syscohada-revise@2.1` déclare **11 notes** :

```
Note 3  Immobilisations (incorporelles, corporelles, avances/acomptes)
Note 4  Immobilisations financières
Note 5  Actif circulant HAO
Note 6  Stocks et en-cours
Note 7  Clients (antériorité des créances)
Note 8  Autres créances
Note 9  Titres de placement
Note 10 Valeurs à encaisser
Note 11 Banques, chèques postaux, caisse et assimilés
Note 12 Écart de conversion-Actif
Note 17 Fournisseurs, avances versées
```

⇒ **L'actif, et une seule note de passif.** Le classeur de dépôt en porte **44 feuilles** —
Notes 1 → 35, avec les déclinaisons `3A`, `3B`, `3C`, `3D`, `3E`, `8A`, `15A`, `15B`, `16A`,
`16B`, `16B bis`, `16C`, `27A`, `27B`, `23-24`.

⚠️ **Ce n'est pas un défaut de l'export : c'est un trou de référentiel.** Aucune ligne de code ne
peut produire une note que le paquet ne déclare pas — et c'est la bonne architecture (les postes
et leurs règles vivent en donnée versionnée, jamais en dur). Le trou est donc **exactement là où
il doit être réparé**.

## Ce qui est déjà instruit, et qu'il ne faut pas refaire

La fiche de questions comptables du **2026-07-19**, revalidée le **20/07 contre les postes GUDEF
réels** du dépôt, a déjà tranché le périmètre automatisable :

| Traitement | Notes |
|---|---|
| **Automatique** (ventilation de solde) | 5, 6, 8, 9, 10, 11, 12, 17 |
| **À compléter manuellement** (mouvements bruts, antériorité) | 3, 4, 7 |
| **Forme retenue pour les notes à compléter** | **trame pré-structurée** — titre + tableau aux colonnes officielles GUDEF, lignes vides. *« Coût faible, gain de conformité fort et prêt à saisir. »* |

⇒ **Les 11 notes existantes sont précisément celles-là.** Ce qui reste à faire, ce sont les
**notes de passif, de résultat et de détail** — le travail que la fiche n'avait pas couvert.

⚠️ **Et la fiche avait laissé une question ouverte au PO** (E1) : quelles notes le pilote exige en
v1. Elle citait comme candidates fréquemment exigées : **15** (capitaux propres), **16** (dettes
financières et échéances), **27** (chiffre d'affaires), **28** (achats et charges), **3C**
(amortissements), **8** (provisions). ⇒ **À trancher ici, ou à assumer comme périmètre complet.**

## Périmètre

**Inclus**

- Les **33 notes manquantes** déclarées au paquet `syscohada-revise`, chacune avec : son code, son
  libellé officiel, **ses colonnes GUDEF**, et sa **règle d'alimentation** — comptes ou postes
  sources, ou la mention explicite « à compléter ».
- Trois natures assumées et **distinguées dans la donnée**, pas dans le code :
  - `AUTOMATIQUE` — ventilation de soldes, produite intégralement ;
  - `TRAME` — colonnes officielles, lignes vides, prête à saisir ;
  - `MIXTE` — une part calculée, une part à compléter (l'antériorité, les mouvements bruts).
- La montée de version du paquet — `syscohada-revise@2.2` — avec son `checksum`.
- Le moteur `notes-annexes-production` produit les notes `AUTOMATIQUE` **sans branche par note** :
  s'il faut un `if` par note, la règle n'est pas assez déclarative.

**Hors périmètre**

- Les notes **hors SYSCOHADA** : SFD-BCEAO et CIMA ont leurs propres états (STORY-523/524).
- Le rendu dans le classeur de dépôt : **STORY-537**.
- Les feuilles de **détail** P64 → P86 du classeur. Ce ne sont pas des notes annexes SYSCOHADA
  mais des annexes fiscales OTR — même famille de travail, autre source. ⚠️ **À ficher à part**
  plutôt qu'à absorber : les confondre ferait passer une exigence fiscale nationale pour une
  exigence comptable OHADA.

## ⚖️ Décisions du 2026-09-24 — avant la première ligne

**Arbitrages user** (rendus à l'ouverture du dev) :

| Question | Décision |
|---|---|
| STORY-437 (en `review`, AC-1/2/7/8/9 non livrés) couvre la moitié de cette story | **Absorbée** : ses AC restants sont livrés ici, en `@2.2`, et 437 se clôt avec cette PR. |
| AC-6 exige « les 11 notes à l'identique », or les renvois du GUIDEF ajoutent des postes de passif/CR aux notes 5, 6, 7, 12, 17 et 437 AC-9 réaligne leurs titres | **`@2.1` figé octet pour octet** (une liasse figée se relit telle quelle) ; en `@2.2`, sur les mêmes soldes, les **lignes d'actif** des 11 notes (postes, montants, ventilation) sont identiques. Titres, colonnes et renvois passif/CR ajoutés = **delta assumé et déclaré**. |
| E1 — quelles notes en v1 | **Périmètre complet** : les 44 feuilles. |

**Source unique : la DSF réelle** `1000745307_2025_Definitif (1).xlsx` (versée au dépôt de travail le
2026-09-24, **non committée** — pièce client). Les titres, les colonnes et les renvois sont **relevés
cellule par cellule** sur ses feuilles, par un script qui lit les cellules fusionnées (méthode en
*Progress Tracking*). Contre-épreuve : les **66 renvois poste → note** relus sur les colonnes `E`/`F`/`H`
des feuilles d'états = l'annexe A de STORY-437, **0 écart sur 66**.

### Le contrat, amendé au minimum

| Besoin mesuré | Réponse | Pourquoi pas autre chose |
|---|---|---|
| `RL`/`RN` impriment `3C&28` | `postes[].note: string \| string[]` (437 AC-8) | une chaîne `'3C&28'` serait une note fantôme |
| le GUIDEF imprime `3e` sur `CE` | normalisé `3E` à la transcription, garde de test | `3e` ≠ `3E` comme clé : renvoi orphelin **silencieux** |
| l'état imprime `3`, `15`, `16`, `27`, les feuilles n'existent qu'en sous-notes | `NoteMeta.renvoi` : la sous-note **déclare** le numéro parent dont elle justifie les postes (`3A←3`, `15A←15`, `16A←16`, `27A←27`) | la résolution « par préfixe » de 437 AC-7 dit *qu'*une note existe, pas **laquelle** porte les postes (`3` → `3A`…`3E` ?) |
| 1, 31 à 34 ne sont citées par aucun état | `NoteMeta.autonome: true`, **dans le paquet** (437 AC-7) | une liste dans le moteur ferait tomber P7 |
| une part calculée + une part à compléter | `mode: 'MIXTE'` (= nature MIXTE) ; `VENTILATION` = nature AUTOMATIQUE | renommer `VENTILATION` casserait le contrat publié |
| notes 5, 6, 7, 12, 17, 28… mêlent actif/passif ou produits/charges | `totalN: null` quand les postes couvrent plus d'une famille | `BU + DV + TI + TM` est un chiffre sans signification (même règle que STORY-438) |

### Nature de chaque feuille (44)

| Nature | Notes | Motif |
|---|---|---|
| `VENTILATION` | 5, 6, 9, 10, 11, 14, 20, 21, 22, 23, 24, 25, 26, 27A, 29, 30 | feuille « Libellés · Année N · Année N-1 · Variation » : tout se ventile par compte |
| `MIXTE` | 3C, 3D, 3E, 4, 7, 8, 12, 13, 15A, 16A, 17, 18, 19, 28 | montants ventilables ; échéances, devises, actionnaires, mouvements → à compléter |
| `TRAME` | 1, 3A (alimentée par le registre), 3B, 8A, 15B, 16B, 16Bbis, 16C, 27B, 31, 32, 33, 34 | aucune donnée de balance ne les produit |
| **hors périmètre** | **2**, **35** | feuilles **narratives** (sections de texte, liste de questions) : ni ventilation ni trame à colonnes ne les représente — rendu texte au gabarit de STORY-537 |

`NOTE 23 24` est **une** feuille pour **deux** notes (`23`, `24`) : 44 feuilles ⇒ 45 numéros ⇒ 43 notes
déclarées + 2 hors périmètre. Les notes 4, 7, 8 et 17 changent de nature (`TRAME`/`VENTILATION` →
`MIXTE`) : leurs colonnes `@2.1` n'étaient **pas** celles de la feuille (échéances, pas mouvements) —
elles avaient été écrites avant STORY-437 et jamais confrontées au formulaire.

⚠️ `colonnes` porte le **tableau principal** de la feuille, de gauche à droite, colonne de libellés
comprise quand elle est imprimée, en-têtes à plusieurs niveaux joints par « — ». Les tableaux
**secondaires** (1 : engagements financiers ; 4 : filiales ; 5 : dettes HAO ; 12 : transferts de
charges ; 16B/16Bbis : 2ᵉ et 3ᵉ tableaux) relèvent du **gabarit case par case** de STORY-537.

## Critères d'acceptation

1. Les 44 feuilles de notes du classeur de référence ont chacune un code déclaré au paquet, ou
   sont **explicitement listées comme hors périmètre** avec leur motif.
2. Chaque note déclare sa nature — `AUTOMATIQUE`, `TRAME`, `MIXTE` — et ses colonnes officielles.
3. Une note `AUTOMATIQUE` se produit **sans code spécifique** : témoin exécutable — ajouter une
   note au paquet la rend produite, sans toucher au moteur.
4. Une note `TRAME` sort avec ses colonnes et **zéro ligne**, jamais avec des lignes à zéro.
5. `ARTICULATION_NOTES` (le contrôle existant) couvre les notes neuves : une note dont le total
   ne rejoint pas son poste de bilan lève une anomalie.
6. **Non-régression** : les 11 notes existantes sortent à l'identique après la montée de version.
   Deux paquets, `@2.1` et `@2.2`, sur le même jeu de soldes, rendent les mêmes 11 notes.
7. Le `checksum` du paquet change, et une liasse figée sous `@2.1` reste relisible.

## Notes

- ⚡ **C'est le préalable de tout le reste.** STORY-537 produit le classeur, mais un classeur avec
  33 feuilles vides n'est pas déposable. **Cette story a plus de valeur que celle qui la
  consomme.**
- ⚠️ **La matière existe, elle est juste dispersée** : les postes GUDEF sont au dépôt
  (`referentiels/postes-syscohada-guidef-togo`), les règles de SIG et de TFT sont figées au tech-spec
  B8, et la fiche du 19/07 porte les arbitrages. **Ce n'est pas un travail de recherche, c'est un
  travail de saisie rigoureuse** — et c'est ce qui le rend chiffrable à 13 points.
- ⛔ **Aucune règle ne se dérive du corpus pédagogique `Image_lecons`** : ses numéros de comptes
  sont ceux du plan **français**. Source unique : le plan du dépôt et les postes GUDEF.

## Progress Tracking

**Statut : `done` (2026-09-24).** PR `prospera-bilan-service` **#137** rebase-mergée sur `dev` (`54447ec` + revue `763fb95`). Branches `MNV-559` : `prospera-bilan-service` (base `dev`) et
`docs` (base `main`).

- 2026-09-24 — ① cadrage (`docs` `3392ef3`) : arbitrages user (absorption de STORY-437, AC-6 lu
  « `@2.1` figé + lignes d'actif identiques », E1 = périmètre complet), contrat amendé, nature des 44
  feuilles.
- 2026-09-24 — ③ **dev** (`prospera-bilan-service` `a0b0957`). **Méthode de transcription** : un script
  lit le classeur (openpyxl, cellules fusionnées résolues) ; pour chaque feuille, le titre après « : »
  et les en-têtes du tableau principal, empilés de haut en bas et joints par « — », espaces
  consécutifs réduits ; deux corrections manuelles consignées (8A : `2018` est une valeur, pas un
  en-tête ; 27B : « AUTRES ETATS DE L'OHADA » est un seul libellé sur deux lignes). La provenance de
  chaque note (feuille, cellule de titre, plage d'en-tête) est portée par la clé `source` des sources
  — **non packagée**, et sans le nom du classeur (il porte le NIF du contribuable, cf. `build.mjs`).
  Contre-épreuve : 66 renvois relus sur les feuilles d'états = annexe A de 437, **0 écart**.
  `syscohada-revise@2.2` = `292f8d78…` ; `@2.1` inchangé (`24d3e5ab…`) ; `bilan-engine@1.20.0`.
- 2026-09-24 — ④ portes : lint 0 · build · `test:cov` 4 172 verts (99,22 % lignes / 95,53 % branches /
  99,41 % fonctions) · e2e 887 verts. Tests d'acceptation sur l'artefact RÉEL
  (`notes-syscohada-2.2.spec.ts`) : AC-1 (44 feuilles listées en dur → code déclaré ou motif hors
  périmètre), AC-2 (modes, colonnes, 13/21/32 renvois, `CE → 3E`, `RL/RN → [3C, 28]`), AC-3 (les 43
  notes sortent, les 12 non citées avec `postes: []`), AC-4 (trame : colonnes, aucune ligne), AC-5
  (anomalie d'articulation levée sur la note 19, passif), AC-6 (sortie `@2.1` épinglée par empreinte
  mesurée sur le code d'AVANT la story ; lignes d'actif des 11 notes identiques en `@2.2`), AC-7
  (checksums distincts, les deux paquets chargés, tampon d'une liasse figée `@2.1` inchangé).
  **Mutations** : 25 sur le moteur, les gardes et la donnée (note retirée, note sans feuille, `CE →
  3e`, `RL` réduit à `3C`, `DK` sans renvoi, colonnes vidées, `3A` sans `renvoi`, `@2.1` révisé en
  place…) — **toutes rouges** ; les mutants qui ne compilaient pas (« 0 total ») ont été réécrits,
  un survivant (dédoublonnage redondant) a conduit à supprimer le code.
- 2026-09-24 — ⑥ **revue de code** (scan `opus` + lentille `ponytail-review`, synthèse en session) :
  **1 bloquant** — le `totalN: null` d'une note hétérogène se lisait sur les postes PRODUITS : une
  ligne `419`/`409`/`478` à 0/0 faisait passer les notes 7/12/17 de 380 000/50 000/200 000 à des
  cases vides, sur des chiffres identiques (le même exercice imprimé différemment selon la liasse qui
  le lit). La famille se lit désormais sur la **déclaration** : le total ne dépend que du couple
  (paquet, note). Non bloquants corrigés : ventilation des postes de PRODUIT gardée (mutant
  survivant), AC-5 à égalité exacte, specs dédiées des deux fichiers neufs, garde « pas de somme
  hétérogène » testée au dépassement d'entier sûr, Swagger du statut, 4 commentaires devenus faux ;
  `ponytail` : `exigerRenvoiNote` supprimé. Commit dédié `8d3555f`.
- 2026-09-24 — ⑦ **revue de sécurité** (scan `opus`, synthèse en session) : **0 constat** ≥ 80 —
  saisie sur une note `MIXTE` (n'entre dans aucun montant ni contrôle ; gel et 404 inter-tenant
  inchangés ; largeur/tailles bornées), injection de formule à l'export (exceljs écrit une chaîne en
  texte), total `null` et contrôles, service de `@2.2` à une org non habilitée (le référentiel se lit
  dans l'entitlement), **fuite de la pièce client** (aucun nom, NIF, adresse ni montant dans le diff —
  contrôlé aussi en session).
- 2026-09-24 — ④ **vérification docker sur stack NEUVE, sur l'état final `8d3555f`** : **71 contrôles,
  0 échec**, API réelles + `mongosh` en lecture. Habilitation **par la voie réelle** (catalogue →
  `entitlement.changed` → `orgbilanentitlements`) : A en `@2.2`, B en `@2.1`. A : 43 notes dans
  l'ordre du formulaire, non citées à `postes: []`, 16A/18/15A `MIXTE` ventilées et complétables,
  totaux `null` sur 12/6/28, `RL`/`RN` dans 3C et 28. B : 11 notes, `3` et non `3A` ; lignes d'actif
  identiques entre les deux paquets (même empreinte). `PUT …/complements` 16A → 200 et persisté ;
  refus 422 (note ventilée, largeur, note inconnue, parent `3`) **sans écriture** (`updatedAt` et
  compteurs inchangés) ; 409 sur un jeu validé. Snapshots : A `2.2`/`292f8d78…`/43 notes, B
  `2.1`/`24d3e5ab…`/11 notes ; relecture `versions/1` identique au snapshot. B → jeu de A : 404 ×4.
  Compteurs finaux `jeux_etats=2`, `snapshots_liasse=2`, 0 orphelin. `docker compose stop` ensuite.
  ⚠️ Un premier passage a été **jeté** : le correctif de revue était appliqué pendant qu'il tournait
  (`src/` monté, `nest --watch` redémarré en boucle, VM à une charge de 220).

**Constats hors périmètre, à ficher** (aucun n'est une régression de 559) :

- ⚠️ **Octroi de `@2.2`** — packagé et chargeable, **servi à personne** tant que le pack du catalogue
  ne le cite pas et que le pont `SN → syscohada-revise@2.1` de `balance-service` ne suit pas (sinon la
  balance d'une org passée en `@2.2` ne résout plus). **Préalable de STORY-537.**
- ⚠️ **Notes 3/3A et 4 : les renvois portent sur des postes-titres** (`AD`, `AI`, `AQ`) que le Bilan ne
  produit jamais (les comptes vont au plus long préfixe : `231 → AK`, `271 → AS`). Mesuré en docker :
  la note 3A totalise 1 000 000 face à 47 000 000 d'immobilisations au Bilan, la note 4 vaut 0 face à
  2 000 000. **Identique en `@2.1`**, et aucun contrôle ne le signale (`ARTICULATION_NOTES` classe 3A
  « non dérivable »).
