# STORY-483 : Le bilan prévisionnel ne sépare pas capitaux propres et dettes — donc aucun ratio bancaire

Status: in_progress

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 5 · **Complexité :** high · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-036** (projection 3 ans, trésorerie 12 mois, scénarios comparés), 2026-08-27.
Relevé en cherchant, dans le bilan prévisionnel simplifié, les trois chiffres qu'un banquier demande.

---

## Le fait

`BilanSimplifiePrevisionnel` publie trois ressources :

- `ressourcesStablesInitiales` — le **total actif de la base**, figé sur l'horizon. Ce n'est **pas** un
  montant de fonds propres : c'est un solde d'ancrage, posé là pour que la cascade boucle. Le contrat
  le documente honnêtement.
- `resultatsCumules` — les résultats projetés.
- `financementNetCumule` — la somme de `financement − remboursements`, qui **agrège apports en capital
  et emprunts** en une seule ligne.

Il est donc **impossible** de dériver :

| Indicateur | Pourquoi il est indérivable |
|---|---|
| Ratio d'endettement | on ne sait pas quelle part des ressources est de la dette |
| Autonomie financière | on n'a pas de capitaux propres |
| Capacité de remboursement (dette / CAF) | on n'a ni l'encours de dette, ni une CAF fiable (**STORY-459**) |

Ce sont les trois chiffres qu'une banque calcule devant un prévisionnel. Sur le dossier de
démonstration, `financementNetCumule` vaut **−1 800 000** en N+3 : trois années de remboursements sans
un apport — et **rien ne dit de quelle dette il s'agit, ni combien il en reste à devoir**.

Le bilan simplifié de FR-019 est délibérément simplifié, et c'est défendable **pour piloter**. Ce qui
ne l'est pas, c'est qu'il soit le **seul** bilan que le prévisionnel produise, alors que le document
qui en sort est celui qu'on pose sur le bureau d'un banquier.

## Critères d'acceptation

- [ ] AC-1 — Le jeu d'hypothèses distingue `apportsCapital` et `empruntsNouveaux` là où il ne connaît
      aujourd'hui qu'un `financement` — dépend d'un ajout au DTO de **STORY-068**.
- [ ] AC-2 — Le bilan prévisionnel publie `capitauxPropres` (ancre + résultats cumulés + apports) et
      `dettesFinancieres` (encours de départ + emprunts nouveaux − remboursements cumulés).
- [ ] AC-3 — L'**encours de dette de la base** est une nouvelle **ancre**, extraite par `ancrage.ts`
      dans le respect de l'invariant P7 (un agrégat, pas un code de poste) — à défaut, la réponse
      publie `dettesFinancieresAncrees: false` et les ratios sont **relatifs**, jamais silencieux.
- [ ] AC-4 — `ratios: { endettement, autonomieFinanciere, capaciteRemboursement }` par exercice, chacun
      `null` **motivé** quand une composante manque.
- [ ] AC-5 — Le contrôle d'équilibre est maintenu : `ecart === 0` après la ventilation.

## Conséquences ailleurs

- Sans **STORY-459** (dotations aux amortissements), la capacité de remboursement reste fausse : la
  CAF vaut le résultat net. Les deux stories se tiennent.

---

## Arbitrages de cadrage (2026-09-09, avant la première ligne)

Sept décisions, prises après lecture du code et **avant** d'écrire. Elles fixent ce que la story livre
et ce qu'elle ne livre pas.

### D-483-1 — `financement` reste le TOTAL, la ventilation est ADDITIVE

`Hypotheses.financement` (et son échéancier `financementParExercice`) est lu par les **trois** moteurs —
annuel, mensuel, comparaison — et par le profil de saisonnalité de STORY-479. Le scinder en deux champs
requis casserait tout jeu enregistré et les trois moteurs d'un coup, pour une story qui n'a **aucun**
montant de trésorerie à changer.

⇒ `financement` garde son sens et reste la **seule** grandeur qui entre en trésorerie. La ventilation est
un champ **facultatif** posé à côté. **Un jeu qui ne la saisit pas rend les chiffres d'avant AU CENTIME** :
c'est la règle déjà appliquée en STORY-479 (saisonnalité) et STORY-461 (BFR réel).

### D-483-2 — un SEUL champ saisi, l'autre DÉRIVÉ

⛔ **La story demande deux champs ; on n'en saisit qu'un.** `empruntsNouveaux` est saisi,
`apportsCapital` vaut `financement − empruntsNouveaux`, et les deux sont **publiés**.

Motif : deux champs saisis redondants avec un troisième qui doit les totaliser, c'est une identité tenue
par une **garde**, et ce dépôt a payé quatre fois le même défaut — une garde posée sur un seul des
chemins d'écriture (STORY-445), sur deux des trois (STORY-457). Avec un seul champ saisi, l'identité
`apports + emprunts = financement` est vraie **par construction** : aucune garde, aucun chemin à oublier,
et AC-5 ne peut pas se casser par cette porte.

Ce qui reste à garder est un **encadrement**, pas une identité : `0 ≤ empruntsNouveaux ≤ financement`,
exercice par exercice. Un emprunt négatif ou supérieur au financement de l'exercice ferait des capitaux
propres négatifs sortis de nulle part.

Surface exacte : `empruntsNouveaux?: number` et `empruntsNouveauxParExercice?: number[]`, sur le patron
mot pour mot de `financement` / `financementParExercice`. ⚠️ Le nouvel échéancier doit être ajouté à
`CHAMPS_ECHEANCIER` — l'oublier persisterait un `null` sur tout jeu qui n'en saisit pas, défaut mesuré en
docker en STORY-460 et invisible en unitaire.

### D-483-3 — la dette de base est DÉCOUPÉE DANS L'ANCRE, jamais ajoutée au passif

C'est le piège de cette story, et il casse AC-5 en silence si on le rate.

`totalPassif = totalActifBase + resultatsCumules + financementNetCumule + concoursBancaires`, où
`totalActifBase` est l'ancre qui **absorbe déjà tout ce que le modèle simplifié ne ventile pas**, dettes
financières de la base comprises. Publier `dettesFinancieres = encoursBase + …` **en plus** de l'ancre
compterait cette dette **deux fois** et ferait un écart d'équilibre égal à l'encours.

⇒ ventilation à somme **constante**, et l'écart reste nul par **identité**, pas par compensation :

```
capitauxPropres   = (totalActifBase − detteBaseAncree) + resultatsCumules + apportsCapitalCumules
dettesFinancieres = detteBaseAncree + empruntsNouveauxCumules − remboursementsCumules
concoursBancaires = inchangé (STORY-482)
```

La somme des trois vaut, terme à terme, le `totalPassif` d'avant la story. `ressourcesStablesInitiales`,
`resultatsCumules` et `financementNetCumule` restent publiés tels quels : rien n'est retiré du contrat.

### D-483-4 — AC-3 est livré PLEINEMENT, pas par son repli

La story offre un repli (`dettesFinancieresAncrees: false`). Il est **refusé comme livrable principal** :
sans ancre, `dettesFinancieres` ne compte que les emprunts **neufs**, donc un dossier qui porte déjà un
emprunt de 50 M affiche un endettement de **zéro** — exactement le défaut que la story dénonce, sous un
nom qui promet le contraire.

⇒ nouvelle ancre `dettesFinancieresBase`, extraite par `ancrage.ts` **dans le respect de P7** : par un
**marqueur additif de paquet** `dettes_financieres`, sur le patron mot pour mot de `bfr` (STORY-461),
`chiffreAffaires` (STORY-457) et `margeBrute` (STORY-462) — dérivé en amont par la production du Bilan,
lu ici comme un simple agrégat. **Aucun code de poste** n'entre dans `ancrage.ts`.

Le repli reste **implémenté et publié** (`dettesFinancieresAncrees: false`) : un paquet qui ne déclare
pas le marqueur — et il y en aura — doit s'ancrer quand même, avec des ratios déclarés relatifs.

⚠️ Contrairement au chiffre d'affaires (un seul poste par paquet), **plusieurs postes portent le
marqueur** et se somment : SYSCOHADA a `DA` (emprunts et dettes financières diverses) **et** `DB` (dettes
de location acquisition). Patron `bfr`, pas patron `chiffreAffaires`.

⛔ Pas de règle « complet ou absent » ici : il n'y a **pas** de liste fermée de composantes à laquelle
comparer, contrairement aux trois catégories du BFR. Un paquet déclare ce que sa liasse porte.

### D-483-5 — DEUX dépôts

Les artefacts `syscohada-revise-2.1.json`, `cima-assurances-1.0.json` et `sfd-bceao-2.0.json` sont
recopiés **à l'octet** dans `balance-service/src/modules/referentiel/assets/` (vérifié : les trois
empreintes SHA-256 sont identiques ce jour). Régénérer d'un côté fait rougir l'autre — leçon STORY-428.

⇒ une branche `MNV-483` **par dépôt**, `bilan-service` et `balance-service`, ouvertes et intégrées
**ensemble**.

### D-483-6 — les ratios sont `null` MOTIVÉS, jamais un chiffre par défaut

Trois ratios par exercice, chacun `null` avec son motif quand une composante manque :

| Ratio | Formule | `null` motivé quand |
|---|---|---|
| `endettement` | `dettesFinancieres / capitauxPropres` | capitaux propres nuls ou négatifs, ou ventilation indéterminée |
| `autonomieFinanciere` | `capitauxPropres / (capitauxPropres + dettesFinancieres)` | ressources totales nulles, ou ventilation indéterminée |
| `capaciteRemboursement` | `dettesFinancieres / capaciteAutofinancement` | CAF nulle ou négative, ou ventilation indéterminée |

⛔ **`capaciteRemboursement` est publiée, et son motif dit sa limite.** Sans STORY-459 la CAF valait le
résultat net ; **STORY-459 est livrée** (`dotationsAmortissements` est au compte de résultat projeté et
`capaciteAutofinancement` la reprend), donc le chiffre est défendable. La note de la story
(« Conséquences ailleurs ») est **périmée** sur ce point.

### D-483-7 — ventilation INDÉTERMINÉE ⇒ `capitauxPropres` et `dettesFinancieres` valent `null`

Un jeu qui ne saisit pas `empruntsNouveaux` alors qu'il porte un `financement` non nul ne permet **aucune**
répartition : tout mettre en capital sous-estime l'endettement, tout mettre en dette le surestime. Le
modèle **ne choisit pas** — il publie `null` et le dit.

⚠️ **Un cas reste déterminé sans saisie, et il est fréquent** : un plan **sans financement neuf**
(`financement` nul sur tout l'horizon). La ventilation y est connue sans ambiguïté — zéro apport, zéro
emprunt — et les ratios se calculent alors sur la seule dette de base. Ne pas traiter ce cas priverait de
ratios la majorité des prévisionnels de reprise d'activité.

### Hors périmètre, nommé

- **Le bilan prévisionnel détaillé** (autre chose que 3 emplois / 3 ressources) : la story dit que le
  simplifié est défendable pour piloter, elle lui ajoute les trois ressources bancaires, elle ne le
  remplace pas.
- **Le mensuel (FR-020) et la comparaison de scénarios (FR-021)** : ils lisent `financement` comme total
  et ne changent pas d'un centime. Aucun de leurs champs n'est touché.
- **Le retraitement courant / non courant** : arbitré voie A ailleurs (STORY-552), sans objet ici.
- **`zone-franche-togo-1.0` et `sfd-bceao-1.0`** : marqueur déclaré si et seulement si leur liasse porte
  un poste de dettes financières identifiable dans la source déjà transcrite ; sinon repli déclaré.
