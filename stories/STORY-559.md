# STORY-559 : Le référentiel déclare 11 notes annexes, le dépôt en attend 44 — les 33 manquantes, avec leurs règles d'alimentation

Status: ready-for-dev

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
