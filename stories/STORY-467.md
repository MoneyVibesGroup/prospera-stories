# STORY-467 : Un emprunt ne coûte rien : aucune hypothèse de taux d'intérêt, aucune charge financière dans le modèle

Status: done

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 5 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-035** (hypothèses de prévisionnel paramétrables), 2026-08-27.
Relevé en lisant le plan de trésorerie du moteur : `fluxFinancement = financement − remboursements`, et rien au compte de résultat.

---

## Le fait

`financement` entre en trésorerie, `remboursements` en sort. **Aucune charge financière** ne rejoint
jamais le compte de résultat prévisionnel : `resultatNet = margeBrute − chargesExploitation`, point.

Conséquence : **un plan financé par emprunt produit exactement le même résultat qu'un plan financé par
apport en capital.** Aucun banquier ne signerait un prévisionnel qui affirme cela, et c'est justement
le lecteur principal du document.

`tauxChargesPct` ne peut pas y suppléer : il porte sur les **produits**, pas sur l'encours de dette.
Et rien ne modélise les **agios** quand la trésorerie devient négative — ce qui arrive dans deux des
trois scénarios de la maquette FE-035.

## Critères d'acceptation

- [x] AC-1 — Une hypothèse `tauxInteretPct` (et, si l'échéancier de **STORY-460** est livré, la durée)
      s'ajoute au jeu, bornée et versionnée.
- [x] AC-2 — Le CR prévisionnel porte `chargesFinancieres`, calculées sur l'**encours** de dette
      (financement cumulé − remboursements cumulés), et le résultat en tient compte.
- [x] AC-3 — Une trésorerie de clôture négative génère un **coût de découvert** au taux saisi, ou
      **est refusée** comme hypothèse — l'un ou l'autre, jamais le silence actuel.
- [x] AC-4 — ⚠️ Le plafond de déductibilité des **intérêts de comptes courants d'associés** (taux légal
      majoré de 3 points, Art. 99 m / 102 CGI — le paquet fiscal le publie déjà) est **hors périmètre**
      de cette story : il appartient au résultat fiscal, pas au modèle de projection. À nommer pour ne
      pas être redécouvert.
- [x] AC-5 — `MODELE_PROJECTION_VERSION` incrémentée.

## Conséquences ailleurs

- Interagit avec **STORY-458** : les charges financières réduisent le bénéfice imposable — mais pas le
  MFP, assis sur le CA. L'ordre de calcul doit être écrit une fois pour toutes.

## Décisions de cadrage (2026-09-07)

- **D-467-1 — `tauxInteretPct` est REQUIS, jamais optionnel avec un défaut à 0.** Un défaut à
  zéro affirmerait « l'emprunt ne coûte rien » — le défaut **exact** que cette story ferme, et
  il pencherait du côté **faussement rassurant** sur un document remis à une banque. Même parti
  que `dureeAmortissementAns` (D-459-2). Conséquence assumée et symétrique de STORY-459 : un jeu
  enregistré **avant** cette story n'est plus **projetable** tant qu'il n'est pas ré-enregistré,
  et `exigerFormeCourante` le refuse en nommant le champ — jamais un `NaN` qui sortirait en
  HTTP 200 avec des montants à `null` (la panne mesurée de STORY-457).
- **D-467-2 — les intérêts portent sur l'ENCOURS MOYEN de l'exercice**, `(ouverture + clôture)/2`,
  et non sur l'un des deux bouts. L'**ouverture** dirait qu'un emprunt contracté en N+1 ne coûte
  rien en N+1 — le silence même qu'on ferme. La **clôture** ferait payer une année pleine sur une
  dette remboursée en cours d'année.
- **D-467-3 — ⚠️ l'encours ne porte que la dette PROJETÉE.** L'encours de dette de l'exercice de
  base n'est **pas isolable** des agrégats d'ancrage — `AncresProjection` ne porte ni dettes
  financières ni charges d'intérêts de la base. C'est **exactement** la limite de D-459-1 sur le
  stock d'immobilisations, et elle se traite pareil : **publiée** dans la réponse (`dettesBase
  NonPortees` + motif), jamais tue. Un cabinet déjà endetté verra donc des charges financières
  **inférieures** à sa réalité, et il doit l'apprendre du contrat.
- **D-467-4 — AC-3 tranché du côté du COÛT, pas du refus.** Refuser une trésorerie de clôture
  négative rendrait l'outil inutilisable sur **deux des trois scénarios** de FE-035. Un
  prévisionnel doit pouvoir **montrer** un besoin de trésorerie : c'est précisément ce que son
  lecteur principal vient y lire. Le refuser reviendrait à cacher le fait au lieu de le chiffrer.
- **D-467-5 — le coût de découvert est calculé sur la clôture AVANT ce coût lui-même : UNE
  itération, jamais un point fixe.** Le coût dépend de la trésorerie, qui dépend du résultat, qui
  dépend du coût — la boucle est réelle. Le découvert **réel** est donc légèrement supérieur à
  celui facturé, d'un montant borné par `taux × coût`. ⛔ Le plafond est **nommé dans le
  contrat** : l'assiette retenue est publiée, pour qu'aucun lecteur n'ait à deviner sur quoi le
  taux a été appliqué.
- **D-467-6 — le taux de découvert EST le taux d'intérêt saisi**, la fiche disant « au taux
  saisi ». Un taux de découvert **distinct** — en pratique bien supérieur à un taux d'emprunt —
  est **hors périmètre** et nommé ici pour ne pas être redécouvert.
- **D-467-7 — le MENSUEL décaisse ces charges, sinon `ecartArticulation` cesse d'être nul.** Les
  charges financières entrent dans la CAF, donc dans le flux annuel ; un mensuel qui ne les
  décaisserait pas ferait diverger un contrôle que le contrat publie comme une **identité**
  (même piège que STORY-460, cité dans le moteur). Elles y sont une **ligne publiée** : « un
  total ne contient que des lignes vues ».
- **D-467-8 — ordre de calcul vis-à-vis de STORY-458, écrit une fois pour toutes.** Les charges
  financières réduisent le **résultat avant impôt**, donc l'IS — mais **pas** le MFP, assis sur
  le chiffre d'affaires. C'est automatique : `liquiderImpot` reçoit le résultat et le CA
  **séparément**, et il n'y a rien à ordonner de plus.

### Hors périmètre (explicite)

- **AC-4 — le plafond de déductibilité des intérêts de comptes courants d'associés** (taux légal
  majoré de 3 points, Art. 99 m / 102 CGI). Il appartient au **résultat fiscal**, pas au modèle
  de projection : celui-ci calcule un résultat **comptable** avant de le confier à
  `liquiderImpot`. Le paquet fiscal publie déjà le plafond ; c'est une story du moteur fiscal.
- Un **taux de découvert distinct** du taux d'emprunt (D-467-6).
- Les **intérêts sur la dette de la base** (D-467-3), faute d'ancre pour l'encours.
- Le **point fixe** du coût de découvert (D-467-5).

---

## Progress Tracking

**Statut : done** — clôturée le 2026-09-07. PR `bilan-service` #99 rebase-mergée sur `dev`.

### Livré

| Fichier | Ce qui change |
|---|---|
| `projection/charges-financieres.ts` **(neuf)** | unité **pure** : `interetsSurEncours`, `coutDeDecouvert` |
| `hypotheses.schema.ts` + `dto/hypotheses.dto.ts` | `tauxInteretPct` **requis**, borné `[0 ; 100]` **dans le contrat** |
| `projection/forme-hypotheses.ts` | 3ᵉ branche de la garde — absence et négatif refusés, **`0` accepté** |
| `projection-annuelle.service.ts` | intérêts sur l'encours moyen + coût de découvert en **deux passes** |
| `projection-mensuelle.service.ts` + ses types | ligne `decaissementsChargesFinancieres`, sans quoi l'articulation diverge |
| `projection.types.ts` | bloc `ChargesFinancieresExercice`, `MODELE_PROJECTION_VERSION` **1.4.0** |
| les 3 DTO de réponse | le bloc publié, décomposé, et les descriptions de version |
| `export/modele-previsionnel.ts` | **la ligne du compte de résultat et la colonne mensuelle** |

### Portes de qualité

| Porte | Résultat |
|---|---|
| Lint | 0 erreur, 0 avertissement |
| Build | `nest build` OK |
| Unitaires + couverture | **2 124 tests verts** — 98,90 % lignes / 94,65 % branches (planchers 90/65). `charges-financieres.ts`, `projection-annuelle.service.ts` et `projection-mensuelle.service.ts` à **100 %** sur les quatre axes |
| E2E | **637 tests verts** (`--runInBand`) |

### Table de mutations — 10 mutations, 10 rouges

| # | Mutation | Verdict |
|---|---|---|
| M1 | assiette = **clôture** au lieu de la moyenne | ROUGE |
| M2 | assiette = **ouverture** au lieu de la moyenne | ROUGE |
| M3 | borne d'encours négatif retirée (**produit financier** tiré d'une dette) | ROUGE |
| M4 | le découvert n'est plus facturé | ROUGE |
| M5 | charges financières retirées du résultat avant impôt | ROUGE |
| M6 | charges financières **réintégrées dans la CAF**, comme une dotation | ROUGE |
| M7 | le mensuel ne les décaisse plus | ROUGE |
| M8 | **transposition** impôt ↔ charges financières dans le mensuel | ROUGE |
| M9 | garde de forme retirée sur `tauxInteretPct` | ROUGE |
| M10 | ligne d'export du compte de résultat retirée | ROUGE |

⚠️ **M8 a été écrite parce que la signature l'appelle** : le moteur mensuel reçoit désormais
**quatre `number` positionnels adjacents**, dont deux montants voisins. Les transposer **compile**.
Un essai les discrimine par des montants volontairement différents.

⚠️ **M10 n'aurait pas rougi avec la fixture d'origine.** La garde de recomposition du compte de
résultat exporté ne discrimine une ligne **manquante** que si son montant est **non nul** ; la
fixture portait `0`. Elle porte désormais **500**, la charge d'exploitation ayant été descendue de
30 000 à 29 500 pour que la somme retombe sur les mêmes 8 000 — aucun autre montant ne bouge.

### Vérification docker (stack réelle, données réelles)

Base `bilan_service` du dossier de vérification, **25 jeux d'hypothèses** antérieurs à la story.

| Mesure | Résultat |
|---|---|
| ⚡⚡ **D-467-1, conséquence MESURÉE et non supposée** | Les **25 jeux existants** rendent **422 `HYPOTHESES_FORME_OBSOLETE`** en projection, avec un message qui **nomme le champ**. Aucun `NaN`, aucun HTTP 200 aux montants à `null`. |
| ⚡⚡ **AC-2 — le fait de la story, chiffré** | Deux jeux identiques au taux près : résultat net **584 912** à 0 % contre **526 512** à 8 %. L'écart, **58 400**, vaut exactement `80 000 × (1 − 27 %)` — le coût de l'emprunt **après impôt**. Un plan financé par emprunt ne rend plus le même résultat qu'un plan financé par apport. |
| AC-2 | Bloc publié entier : encours 0 → 2 000 000, moyen 1 000 000, intérêts 80 000. Compte de résultat **recomposable** ligne à ligne sur les trois exercices, **équilibre `ecart = 0`** partout. |
| ⚡ **AC-3 sur un scénario qui plonge** | Investissement 50 000 000 sans financement : clôtures **−46 921 051**, −102 827 890, −163 022 590, et un coût de découvert de **3 475 633**, 7 616 881 puis 12 075 747. Chiffré, jamais tu. |
| ⛔ **D-467-5, plafond visible** | L'assiette publiée (**−43 445 418**) est bien **au-dessus** de la clôture finale (−46 921 051) : une seule itération, et le lecteur voit sur quoi le taux a porté. |
| ⛔ **D-467-8** | Sur l'exercice déficitaire, `is: 0` et **`mfp: 137 500` toujours dû** — les charges financières réduisent l'IS, jamais le minimum assis sur le chiffre d'affaires. |
| **D-467-7** | Plan mensuel : `ecartArticulation = 0`, somme des douze lignes = **80 000** = la charge annuelle, flux net recomposable **les douze mois**, clôture du mois 12 = clôture annuelle N+1. |
| **AC-1** | Corps sans le champ → **400**. Taux `-1`, `800`, `100.01` → **400**. Persisté en `number`. |
| **Le document du banquier** | Export **xlsx et pdf en 200**, et la chaîne « Charges financières » **est dans le classeur**, colonne mensuelle comprise. Sans elle, le document aurait été **arithmétiquement faux**. |
| **Rétro-compatibilité** | 25 documents sans le champ se **relisent** sans erreur ; aucun champ inventé. Seul le **calcul** est refusé. |

⚠️ **Le conteneur servait encore le modèle 1.3.0** au premier appel : le `nest --watch` n'avait pas
repris le changement de branche. Un `docker compose restart` a suffi — mais la mesure aurait
« confirmé » l'ancien modèle. **Vérifier `modeleVersion` avant de conclure quoi que ce soit d'une
projection.**

### Revue de code — 9 constats, aucun bloquant, tous corrigés

**Trois gardes qui ne gardaient rien**, et c'est le cœur de ce que la revue a rapporté :

1. ⚡⚡ **LE CÂBLAGE du moteur mensuel n'était gardé par RIEN dès qu'il y a découvert.** Toutes
   les batteries mensuelles tournaient à taux nul sauf une — **sans découvert** — donc
   `total === interetsDette` partout. Remplacer `.chargesFinancieres.total` par
   `.interetsDette` aux **deux** sites de production laissait **1 678 unitaires et 72 e2e
   VERTS**, alors que l'annuel retranchait le coût de découvert par la CAF pendant que le
   mensuel ne décaissait que les intérêts : `ecartArticulation = coutDecouvert`, sur une route
   dont le contrat publie l'articulation comme une **identité**. **Le scénario exact pour
   lequel AC-3 existe n'était pas articulé.** Trois gardes ajoutées : le moteur, puis les
   **deux appelants par leur vraie route** — `ProjectionService` et `ComparaisonService`, ce
   dernier étant le troisième chemin que STORY-457 avait déjà oublié.

   ⚠️ **Mon premier correctif ne fermait que la moitié du trou** : il gardait le moteur, pas le
   fil qui lui apporte la valeur. La mutation rejouée est restée **verte** jusqu'à ce que les
   deux e2e de câblage existent.

2. **La colonne mensuelle de l'export n'était gardée par rien** : la fixture portait `0`, et
   une garde de recomposition ne discrimine une colonne **manquante** que si son montant est
   **non nul**. C'est la correction que j'avais déjà faite du côté annuel et pas du mensuel.

3. **Les bornes PUBLIÉES du taux (AC-1) n'étaient gardées par rien** : les retirer de
   l'`@ApiProperty` laissait les **130** essais du contrat verts. Le précédent existait à
   l'identique pour les délais BFR ; la garde compare à la **constante**, jamais au littéral.

**Six scories**, toutes corrigées : l'encours moyen était **publié non arrondi** alors que tout
le modèle est en unités entières — et la batterie affirmait le contraire ; un commentaire
décrivait l'**opérateur inverse** du code ; la docstring de portée du juge de forme énumérait
trois causes sur quatre ; la numérotation des étapes avait désaccordé le docblock et le corps ;
le document d'export portait un montant de charges financières **sans son taux ni son
périmètre**, alors que la réponse HTTP publie `dettesBaseNonPortees` en disant jouer « le même
rôle **exactement** » que le stock non amorti, qui a sa mention depuis STORY-459 ; et **AC-4
n'était nommé nulle part dans le code** alors que la fiche demande de le nommer *pour ne pas
être redécouvert* — il l'est désormais à l'endroit exact de la déduction.

**Mutations après correctifs : 15, toutes rouges.**

### Revue de sécurité — 0 vulnérabilité

Six axes instruits et clos. Les plus utiles, **mesurés et non déduits** :

- **Déni de service par le calcul** : les deux passes sont bornées par l'horizon (3 exercices),
  soit 6 liquidations au lieu de 3 — facteur **constant**, aucune récursion, aucun point fixe.
  Moteur exécuté sur les extrêmes autorisés (`financement = MAX_SAFE_INTEGER`, taux 100,
  croissance 10 000, trésorerie très négative) : **aucune** valeur non finie, `ecart = 0` aux
  trois exercices **même au-delà de `MAX_SAFE_INTEGER`**, aucun `-0` sérialisé. `Infinity`
  n'apparaît qu'à partir d'un taux ≈ `1e300`, **inatteignable** : les seuls chemins d'écriture
  composent le DTO borné, `dupliquer` recopie et `rebaser` ne touche pas les hypothèses.
- **Déterminisme du modèle à deux passes** : deux appels sur la même entrée rendent des JSON
  **strictement identiques**.
- **Aucun quatrième chemin de projection non gardé** : l'export passe par `ProjectionService`,
  donc les trois appelants de `exigerFormeCourante` sont bien tous les appelants — le piège de
  STORY-445 est évité.
- **Anti-énumération du 422** : sur la comparaison, un jeu hors périmètre tombe en **404 avant**
  la garde de forme. On n'apprend pas le nom d'un jeu d'un autre tenant.
- **Coercition** : `""`, `" "` et `false` deviennent `0` — valeur **légitime** de ce champ, donc
  rien qu'une requête honnête ne puisse déjà écrire.

### Vérification docker REJOUÉE sur l'état final

Les correctifs de revue ont touché le moteur (encours moyen arrondi) et l'export (métadonnée) :
la mesure a été **refaite après**, jamais reportée.

| Mesure rejouée | Résultat |
|---|---|
| Modèle | `1.4.0`, encours moyen **entier**, bloc **recomposable** (`interetsDette = round(moyen × taux/100)`), compte de résultat recomposable |
| ⛔ **Le câblage, sur un exercice qui plonge** | coût de découvert **3 475 633**, `total ≠ interetsDette`, `ecartArticulation = 0`, somme des douze lignes = **3 475 633**, clôture du mois 12 = clôture annuelle N+1 |
| Export | classeur en **200**, portant la mention, **le taux**, **le périmètre** et l'annonce du découvert |
