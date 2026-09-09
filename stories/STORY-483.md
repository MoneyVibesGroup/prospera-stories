# STORY-483 : Le bilan prévisionnel ne sépare pas capitaux propres et dettes — donc aucun ratio bancaire

Status: done

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 5 · **Complexité :** high · **Assigné à :** vivianMoneyVibesGroupes · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
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

---

## Progress Tracking

### Développement (2026-09-09)

Deux dépôts, deux branches `MNV-483` : `bilan-service` (le livrable) et `balance-service` (la
contrepartie d'artefact). Les cinq AC sont livrés, AC-3 **pleinement** et non par son repli.

Preuve de branchement avant la première ligne :

```
docs               MNV-483
bilan-service      MNV-483
balance-service    MNV-483
```

**Ce que la lecture du code a changé au cadrage** — trois faits relevés avant d'écrire :

1. **Le repli d'AC-3 aurait vidé la story de son objet.** Sans ancre, `dettesFinancieres` ne compte
   que les emprunts **neufs** : le dossier de vérification, qui porte 63 000 000 d'emprunts, aurait
   affiché un endettement de **2 000 000** — soit un ratio de 0,018 au lieu de 0,58. Trente fois trop
   bas, sous un nom qui promet l'exactitude.
2. **CIMA et SFD-BCEAO ne peuvent pas déclarer le marqueur, et c'est une bonne nouvelle.** Leur passif
   **agrège** : `CP4` de CIMA porte « Dettes (financières, réassureurs, tiers) », `BP1`/`BP2` de SFD
   mêlent trésorerie interbancaire et dépôts des membres. Le repli n'est donc pas du code mort à
   écrire par acquit de conscience : c'est le comportement de **deux paquets sur quatre**.
3. **STORY-459 est livrée**, donc la CAF intègre les dotations et `capaciteRemboursement` est
   défendable. La note « Conséquences ailleurs » de cette fiche est **périmée** sur ce point.

**Le point de recopie que la story a coûté :** le checksum de `syscohada-revise@2.1` est écrit **en
dur en douze endroits, répartis sur les deux dépôts** — manifeste, garde de byte-identité, quatre
specs et deux e2e côté `balance-service`. Le paquet `zone-franche-togo@1.0` partage la table de
passage SYSCOHADA : son empreinte change aussi, en deux points de plus. `sfd-bceao` et
`cima-assurances` restent **byte-identiques**, ce que le générateur garantit par construction (champ
additif émis en dernier, uniquement si la source le déclare).

### Table de mutations — 12 sur 12 ROUGES, dont une d'abord FAUSSE

| # | Mutation | Résultat |
|---|---|---|
| M1 | la dette de base n'est plus découpée dans l'ancre | ROUGE |
| M2 | la dette projetée oublie l'ancre | ROUGE |
| M3 | le cas « financement nul » n'est plus déterminé | ROUGE |
| M4 | l'indétermination devient un zéro silencieux | ROUGE |
| M5 | `capitauxPropres > 0` devient `!== 0` (endettement négatif publié) | ROUGE |
| M6 | le 5ᵉ échéancier sort de `CHAMPS_ECHEANCIER` | ROUGE |
| M7 | la garde 422 du chemin `Mixed` est retirée | ROUGE |
| M8 | un paquet muet publie `0` au lieu de `null` | ROUGE |
| M9 | la somme absorbe les postes NON marqués | ROUGE |
| M10 | le câblage du marqueur dans le bilan produit est neutralisé | **d'abord FAUX ROUGE** → ROUGE |
| M11 | le `?? null` de l'ancrage est retiré | ROUGE |
| M12 | un **sous-total** porte le marqueur (source d'artefact) | ROUGE — le générateur LÈVE |

⚡⚡ **M10 est la mutation la plus instructive, et elle a d'abord menti.** Remplacer l'appel par `null`
faisait échouer la campagne **par erreur de compilation** — l'import devenait inutile — et non par
assertion : exactement le piège relevé en STORY-411 et STORY-412. Rejouée avec un appel qui **compile**
(`dettesFinancieres(pkg, [])`), les deux batteries de la story restaient **VERTES**. Le câblage du
marqueur dans le bilan produit n'était gardé par **rien** — le même trou que STORY-461 avait payé sur
`bfrReel`, au même endroit, une story plus tard. Un `describe` neuf le garde, avec un poste de passif
**émis mais non marqué** dans la fixture : sans lui, une implémentation qui sommerait tout le passif
passerait.

M12 nomme le poste fautif dans son message : `BILAN/DZ (total)`.

### Vérification docker — parcours HTTP complet, sur données réellement persistées

⚠️ **Version servie confirmée AVANT de conclure** (piège STORY-467) : le conteneur annonce
`bilan-engine@1.17.0` et porte `dettes-financieres.ts`. ⚠️ Le volume Kafka a dû être réinitialisé
(`Shutdown broker because all log dirs have failed`) — dev uniquement, Mongo intact.

Parcours réel : organisation → dossier `SARL VERIF 483` → exercice 2025 → axes `SN`/`REEL` → balance
soumise et validée → jeu d'états produit et **figé** → jeu d'hypothèses → projection HTTP.

**① AC-3 — l'ancre, sur le snapshot RÉELLEMENT figé :**

```
moteurVersion           : bilan-engine@1.17.0
bilan.dettesFinancieres : 63000000
postes passif emis      : CA=62000000  DA=55000000  DB=8000000  DJ=21000000
equilibre               : actif=165000000 passif=146000000 resultat=19000000 ecart=0
```

`63 000 000 = DA (55) + DB (8)`. **Les fournisseurs `DJ` (21 000 000) sont exclus** — c'est ce que le
marqueur discrimine, et un poste de passif émis non marqué le prouve dans la même mesure.

**② AC-2 et AC-5 — la projection servie en HTTP, les trois exercices :**

| | capitaux propres | dettes fin. | concours | somme | totalPassif | écart |
|---|---|---|---|---|---|---|
| N+1 | 112 365 600 | 65 000 000 | 0 | 177 365 600 | 177 365 600 | 0 |
| N+2 | 122 461 100 | 67 000 000 | 0 | 189 461 100 | 189 461 100 | 0 |
| N+3 | 132 358 770 | 69 000 000 | 0 | 201 358 770 | 201 358 770 | 0 |

`65 000 000 = 63 ancrés + 6 empruntés − 4 remboursés`. L'identité tient **au franc** sur les trois
exercices.

**③ AC-4 — les ratios servis**, `endettement` 0,5785 → 0,5471 → 0,5213, `autonomieFinanciere` 0,6335 →
0,6464 → 0,6573, `capaciteRemboursement` 8,82 → 8,28 → 7,75 années, `dettesFinancieresAncrees: true`.

**④ Le champ saisi est bien persisté, et l'absent n'est PAS persisté en `null`** (piège STORY-460,
mesuré en docker parce qu'il est invisible en unitaire) :

```
empruntsNouveaux persiste            : 6000000
empruntsNouveauxParExercice present  : false
```

Sur le jeu jumeau sans ventilation, **aucune des deux clés n'est écrite**.

**⑤ Les contre-épreuves** — sans elles la mesure ne prouverait qu'une démonstration :

- ventilation incohérente (`empruntsNouveaux` 11 M > `financement` 10 M) ⇒ **400
  `VENTILATION_FINANCEMENT_INCOHERENTE`**, message nommant l'exercice N+1 ;
- même jeu **sans** ventilation ⇒ `capitauxPropres: null`, `dettesFinancieres: null`, les trois ratios
  `null` avec `VENTILATION_FINANCEMENT_INDETERMINEE`, **`ecart` toujours 0** et `totalPassif`
  **identique au franc** à celui du jeu ventilé (177 365 600) — la ventilation ne déplace rien.

**⑥ Non-régression mesurée sur TOUT le portefeuille persisté**, par sonde rejouant le moteur sur les
54 jeux et leurs snapshots réels (54 jeux, 0 sans snapshot) :

| Mesure | Résultat |
|---|---|
| jeux refusés par une garde | **25** — le compte exact d'avant la story (STORY-467), inchangé |
| jeux refusés **par la garde neuve** | **0** — D-483-1 mesurée, pas supposée |
| jeux projetables | 29 (27 d'avant + les 2 de cette vérification) |
| exercices projetés | 87 |
| exercices dont `ecart !== 0` | **0** |
| exercices dont `CP + DF + concours !== totalPassif` | **0** |
| exercices publiant une dette financière négative | **0** |
| jeux assis sur un snapshot ANTÉRIEUR (`dettesFinancieresAncrees: false`) | **27** — le `?? null` traverse sans casser |

⚡⚡ **Un fait mesuré qui VALIDE D-483-7, et qui aurait pu être perdu.** **33 jeux sur 54** portent un
financement **nul sur tout l'horizon** : leur ventilation est connue sans ambiguïté, et ils obtiennent
leurs ratios sans rien saisir. Un repli naïf — « pas de `empruntsNouveaux` ⇒ indéterminé » — aurait
privé de ratios **61 % du portefeuille réel**, dont les prévisionnels de reprise d'activité et de
désendettement, qui sont précisément ceux qu'on porte à une banque.

**⚠️ Une limite, nommée plutôt que tue.** La sonde du point ⑥ applique `SANS_IMPOT`, là où la route
résout le paquet fiscal du référentiel : ses **montants** ne sont donc pas au franc ceux de la route.
Les **invariants** qu'elle mesure — écart nul, identité de somme, absence de montant négatif, compte
des refus — ne dépendent d'aucune fiscalité. Le trajet HTTP réel, lui, a bien été exercé (points ① à
⑤), contrairement à la vérification de STORY-482.

**⚠️ Quatre raccourcis de configuration assumés**, tous en dehors du périmètre mesuré : KYC approuvé,
entitlements Balance et Bilan activés et habilités au couple `syscohada-revise@2.1`, e-mail marqué
vérifié — écrits directement dans les read-models, parce que leurs flux amont ne sont pas l'objet de
cette story. Aucun ne touche un champ que la story lit ou écrit.

### Écart CONNU, laissé hors périmètre et publié au contrat

⚠️ **Les charges financières restent assises sur le financement net cumulé ENTIER**, apports en
capital compris (`encoursOuvertureDette`, STORY-467). Sur un jeu qui **ventile**, les intérêts portent
donc une assiette **plus large** que la dette publiée : la vérification ci-dessus paie 6 % sur
10 000 000 de financement alors que 4 000 000 sont un apport.

Ce n'est **pas** corrigé ici, et c'est délibéré : D-483-1 pose que cette story ne change **aucun
montant de trésorerie**, et le corriger déplacerait le résultat, l'impôt et la clôture de tous les
jeux qui ventilent. L'écart est **publié dans la description OpenAPI de `dettesFinancieres`** plutôt
que tu, et appelle une story propre — assiette d'intérêts limitée aux emprunts, avec la migration de
contrat que cela suppose.

### Revue de code et revue de sécurité — 12 constats, tous réels, tous traités

Les deux revues ont tourné sur le même diff, en `opus`, sans PR (les dépôts distants sont
inaccessibles). **Aucun faux positif** : chaque constat a été reproduit avant d'être corrigé.

⚠️ **Un seul commit de correction pour les deux revues**, délibérément : leurs constats se
recouvrent sur les mêmes fonctions — le signe de la dette a été trouvé par les deux — et un
découpage aurait produit un commit intermédiaire qui ne compile pas.

**Quatre bloquants, dont deux que la vérification docker de la veille n'avait pas rencontrés.**

| # | Constat | Ce qu'il produisait |
|---|---|---|
| 1 | `empruntsNouveaux: null` valait « zéro emprunt » et non « absent » | trois ratios **donnés pour exacts** sur un endettement **sous-estimé de 40 %** |
| 2 | la dette projetée pouvait être **négative**, sans garde | un endettement négatif, qui **se lit comme un endettement faible** |
| 3 | `COUPLES_ECHEANCIER` non étendu | deux scénarios du **même plan** signalés divergents |
| 4 | la garde 400 des trois écrivains n'était gardée par **aucun test** | la retirer laissait la campagne entièrement verte |

⚡⚡ **Le constat 1 est celui qui aurait survécu à tout.** `@IsOptional()` laisse passer un
`null` explicite, le pilote Mongo le persiste tel quel, et le code le lisait par
`=== undefined` : un front qui sérialise un champ de formulaire vide — le cas **ordinaire** —
envoyait donc l'intégralité du financement en capitaux propres. Ni les 2 512 unitaires, ni les
785 e2e, ni ma vérification docker ne l'auraient vu : **je n'avais éprouvé que l'absence du
champ, jamais son `null`**. La convention est pourtant énoncée en toutes lettres cinquante
lignes plus loin dans le fichier voisin — « un `null`, que `@IsOptional()` laisse passer à
l'écriture, doit valoir « absent » aux DEUX endroits ».

⚡⚡ **Le constat 2 montre une garde posée d'un seul côté de la fraction.** Le refus sur des
capitaux propres négatifs existait, et son motif était écrit noir sur blanc : « un nombre
négatif, qui se lit comme un endettement faible ». La dette est le **numérateur** de deux
ratios sur trois, et rien ne regardait son signe. Le scénario n'est pas de laboratoire : un
plan de désendettement est la branche **déterminée** de D-483-7, celle qui couvre 61 % du
portefeuille. Pire encore, deux composantes **toutes deux négatives** donnaient une autonomie
financière d'apparence **saine** — « 60 % des ressources sont propres » — pour une entreprise
structurellement insolvable, sur l'indicateur exact que regarde le banquier. ⛔ Le **montant**
reste publié : l'écrêter à zéro casserait l'identité de somme constante, donc AC-5. C'est le
**ratio** qui se tait, pas la mesure.

⚡ **Le constat 3 est un point de recopie que j'avais cherché et manqué.** La story avait bien
recensé `CHAMPS_ECHEANCIER` et lui avait dédié un test **et** une mutation (M6) — mais il
existe une **seconde** liste, `COUPLES_ECHEANCIER`, dans un autre fichier, que rien ne relie à
la première. Chercher les points de recopie ne suffit pas quand la copie porte un autre nom.

**Deux constats de sécurité de plus :** la garde de ventilation consommait les échéanciers
**avant** leur validation de forme, rendant un **500 anonyme** là où les six causes voisines
rendent un 422 nommé — le constat exact que la revue de sécurité de STORY-482 avait déjà porté,
réintroduit par un ordre d'insertion ; et l'ancre de dette est désormais lue **typée**, parce
que c'est la **seule** expression du moteur où une ancre est le premier opérande d'un `+` : une
chaîne y était **concaténée** au lieu de produire un `NaN` visible.

**Quatre non-bloquants traités** : `apportsCapitalCumules` et `empruntsNouveauxCumules` sont
publiés (le contrat promettait la ventilation et laissait l'apport à déduire) ; la description
d'`autonomieFinanciere` ne promet plus un intervalle `[0, 1]` que le code ne tient pas ;
l'énumération OpenAPI des motifs est **annotée sur son type**, donc en retirer une valeur est
une erreur de compilation ; et l'**export** — le document qu'on pose sur le bureau du banquier —
porte enfin la ventilation, **après** le total, sans séparer les concours bancaires du total
qui les inclut.

### Table de mutations finale — 21 mutations, 21 rouges, dont TROIS d'abord fausses

Neuf mutations de plus après correctifs. ⚡⚡ **Deux d'entre elles étaient VERTES au premier
tour** : le cinquième couple d'échéancier et la lecture typée de l'ancre n'étaient gardés par
rien. Avec M10 au premier tour, cela fait **trois fausses lectures sur vingt-et-une** — et
aucune des trois n'aurait été vue sans rejouer la mutation en lisant *pourquoi* le rouge
apparaît.

### Portes et vérification docker REJOUÉES sur l'état final

Les correctifs touchent le moteur : la vérification a été **rejouée en entier**, jamais
reportée depuis la mesure d'avant.

Lint 0 warning · build OK · **2 525 unitaires + 785 e2e verts** · couverture **99,11 / 95,20 /
99,34 / 99,17** · `balance-service` inchangé et vert (3 662 + 899).

Les montants nominaux sont **identiques au franc** à ceux d'avant les correctifs — 112 365 600
de capitaux propres en N+1, 65 000 000 de dettes, identité de somme vérifiée sur les trois
exercices — ce qui est le résultat attendu : aucun correctif ne devait déplacer le chemin
nominal.

Deux contre-épreuves neuves, en HTTP réel :

| Cas | Avant correctif | Après |
|---|---|---|
| `empruntsNouveaux: null` | trois ratios publiés, `motif: null` | `capitauxPropres: null`, `VENTILATION_FINANCEMENT_INDETERMINEE` |
| plan de désendettement, dette **−27 000 000** en N+3 | endettement négatif donné pour exact | `DETTES_FINANCIERES_NEGATIVES` sur les deux ratios concernés |

Sonde de non-régression rejouée sur les **56 jeux** persistés : **25 refusés** (le compte
d'avant la story, inchangé), **0 refusé par la garde neuve**, **93 exercices**, **0 écart non
nul**, **0 identité cassée**. Le seul exercice à dette négative est celui de la contre-épreuve
ci-dessus, et son identité de somme tient : le correctif fait taire le ratio sans toucher à
l'équilibre.

### ⛔ Une heure perdue sur un diagnostic FAUX — la fiche mémoire existait

Le push a rendu `remote: Repository not found`, `gh repo list MoneyVibesGroup` n'a listé qu'un
dépôt, et `gh api user/orgs` n'a pas renvoyé `MoneyVibesGroup`. J'en ai conclu que l'accès était
perdu, arrêté la story en `review`, et écrit une fiche mémoire disant que les dépôts étaient
inaccessibles.

**C'était faux.** Le compte `gh` actif était `kodjo007` ; `gh auth switch --user
vivianMoneyVibesGroupes` a suffi, et les **trois** dépôts sont en `WRITE`.

⛔⛔ **La fiche mémoire du projet le disait déjà, depuis le 2026-08-31** : « le compte actif
REVIENT à `kodjo007` en cours de session, et l'échec MENT — un 404 qui se lit « le repo n'existe
pas » alors que c'est « ce compte-là n'y a pas accès ». **Ne jamais conclure à un repo absent sur
ce message.** » Je ne l'ai pas lue avant d'agir.

⚠️ **Ce qui rend ce piège pire que sa description** : `gh repo list` **et** `gh api user/orgs`
corroborent le mensonge — trois sources concordantes qui interrogent toutes le **mauvais compte**.
Un diagnostic croisé sur trois commandes n'est pas un diagnostic croisé si elles partagent la même
prémisse.

### Clôture — 2026-09-09

**PR `MNV-483(bilan)` #115** et **PR `MNV-483(balance)` #94** rebase-mergées sur `dev` **ensemble**
(contrat d'artefact partagé, leçon STORY-428), branches supprimées. PR `docs/` mergée sur `main`.

Assigné à : `vivianMoneyVibesGroupes`.
