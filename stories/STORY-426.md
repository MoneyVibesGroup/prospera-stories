# STORY-426 : Le contrôle « résultat du CR = résultat au passif du Bilan » est une tautologie — le seul chiffre indépendant, la case `CJ`, n'est comparé à rien

Status: done

**Épic :** EPIC-010 — États financiers (`bilan-service`)
**Service :** `bilan-service` (`:3004`) — `modules/bilan/etats`, `modules/bilan/bilan-engine.service.ts`
**Points :** 5 · **Sprint :** à slotter
**Origine :** maquette **FE-032** (compte de résultat N/N-1), 2026-08-27. Confronté au fichier
client réel `1000745307_2025_Definitif (1).xlsx` — une **DSF déposée**, feuille
*« Contôle de Cohérence »*.

---

## ✅ RATIFIÉ PAR LE PO — 2026-08-28

La conduite proposée est retenue **telle quelle** : **avertissement au `dry-run`, bloquant à la
validation**, sur le critère de **co-occurrence** (`solde(13) ≠ 0` **ET** `resultatNetCR ≠ 0`).
Les critères d'acceptation révisés du 2026-08-27 font foi.

---

## Le fait

`CompteResultatDto.coherenceResultat` porte le nom du contrôle nº 2 de la liasse déposée
(« *Contrôle Egalité Résultat Net Comptable au CR et au Passif du Bilan* »). Il n'en fait pas
le travail.

`bilan-engine.service.ts` :

```ts
const compteResultat = this.crProduction.produire(pkg, soldesN, soldesN1, surcharges);
const bilan          = this.production.produire(pkg, soldesN, soldesN1, surcharges);
const coherence      = this.coherenceResultat(bilan, compteResultat);
// ecart = compteResultat.resultatNetN − bilan.controle.resultatNetN
```

Les **deux** grandeurs sont produites dans le même appel, depuis les **mêmes** soldes, par la
**même** agrégation `Σ (crédit − débit)`. Le code le dit lui-même : « *ecart=0 **par
construction*** ». Le champ **prouve un invariant du moteur** ; il ne contrôle rien, et il ne
peut jamais rougir.

## Le chiffre indépendant existe, et il n'est publié nulle part

Le référentiel packagé rattache le **compte 13** au poste `CJ` :

```json
{ "etat": "BILAN_PASSIF", "poste": "CJ",
  "libelle": "Resultat net de l'exercice (+ benefice / - perte)",
  "regle": "SOLDE_CREDITEUR", "comptesSyscohada": ["13"], "role": "RESULTAT_BILAN" }
```

C'est **cette case** que la DSF contrôle. `emettrePassif` la produit — avec le solde du compte
13 **et rien d'autre** ; le résultat calculé n'entre que dans le contexte des **sous-totaux**
(`contexteDetailBilan`, placement `role='RESULTAT_BILAN'`). Personne ne compare les deux.

## Le cas ordinaire qui rend la faille visible — et il ne déséquilibre rien

Un dossier dont l'assemblée n'a pas encore **affecté** le résultat porte au compte 13 le
résultat de l'exercice **précédent**, pendant que les classes 6 et 7 portent celui de
l'exercice en cours.

| ce que l'écran montre | valeur | verdict |
|---|---|---|
| `controle.equilibre` | `true` | ✅ (une balance vérifie `A = P + R` par construction) |
| `coherenceSousTotaux.coherent` (`BZ = DZ`) | `true` | ✅ (le placement du résultat ferme la cascade) |
| `coherenceResultat.coherent` | `true` | ✅ (200 000 = 200 000) |
| **ligne `CJ` du passif** | **800 000** | ⛔ **c'est le résultat de l'an dernier** |
| résultat net du CR (`XI`) | 200 000 | — |

⚠️ **Trois voyants au vert et une case fausse.** Aucune valeur de `CJ` ne peut être juste tant
que le compte 13 n'est pas soldé : ni `800 000` (le compte seul), ni `1 000 000` (compte +
résultat placé) ne valent `200 000`. La liasse partirait au dépôt et **c'est l'OTR qui le
dirait**.

---

## ⛔ CORRECTION DU 2026-08-27 — le critère de la première rédaction était FAUX

> Question du PO : *« un compte 13 non soldé rend-il la liasse non validable, ou est-ce un simple
> avertissement ? »* — et la recommandation de départ était **« bloquant »**. En re-dérivant le
> critère, puis en ouvrant la **balance client réelle du dépôt**, les deux se sont révélés faux.

### ① L'écart `résultat CR − CJ` ne peut pas servir de critère : il est non nul dans les DEUX états normaux

Une balance au 31/12 existe dans **trois** états, et le premier réflexe — « CJ doit égaler le
résultat du CR » — n'en décrit **aucun** :

| état de la balance | comptes 6/7 | compte 13 | `résultat CR` | `CJ` | écart | verdict |
|---|---|---|---|---|---|---|
| **(a)** avant écritures de clôture | ouverts | 0 | 200 000 | 0 | **200 000** | ✅ **normal** — c'est l'état attendu pour produire la liasse |
| **(b)** après détermination du résultat | soldés | 200 000 | **0** | 200 000 | **−200 000** | ✅ **légitime** — mais le compte de résultat est **entièrement VIDE** *(→ STORY-432)* |
| **(c)** résultat antérieur non affecté | ouverts | 800 000 | 200 000 | 800 000 | 600 000 | ⚠️ **ambigu** |

⇒ Le critère de la première rédaction **rougirait sur (a)**, c'est-à-dire sur **toute balance
correctement préparée**. Un contrôle qui refuse le cas nominal n'est pas un contrôle, c'est une
panne.

### ② Et la co-occurrence — le critère de repli — est l'état d'une VRAIE balance client

`Balance_des_comptes.pdf` (**ETS RELAXED**, Sage 100 i7, exercice 2023, 51 comptes) porte
**simultanément** :

```
13100000  Résultat net de l'exercice        ← compte 13 alimenté
13110000  Résultat net de l'exercice        ← et un second sous-compte
12000000  Report à nouveau
60150000 … 66410000   (8 comptes de charges)  ← classes 6 et 7 OUVERTES
70110000              (1 compte de produits)
```

⇒ Le cas **(c)** n'est pas une anomalie de laboratoire : **c'est ce que Sage sort chez un client
ordinaire**. Bloquer dessus reviendrait à bloquer la quasi-totalité des dossiers d'un cabinet — et
à enseigner aux comptables à contourner le contrôle.

⚠️ Et le moteur **ne peut pas** trancher : distinguer « résultat de l'exercice précédent non
affecté » (à corriger) de « résultat déjà déterminé » (légitime) suppose de connaître **l'exercice
des soldes**, que le `dry-run` ne reçoit même pas (**STORY-430**). L'ambiguïté est structurelle.

---

## ✅ RECOMMANDATION RÉVISÉE — avertir au diagnostic, bloquer au dépôt, et sur la CO-OCCURRENCE

**Q1 — bloquant ou avertissement ? Les deux, mais pas au même endroit.**

- **Au `dry-run` : AVERTISSEMENT, jamais un blocage.** C'est l'écran qui *diagnostique* ; refuser
  de produire l'état priverait le comptable de ce qui lui dit quoi corriger. *(Cohérent avec
  FE-031 : pas de bouton « Valider » sur un dry-run.)*
- **À la validation d'une liasse persistée (STORY-063/064) : BLOQUANT.** À cet instant on est sur
  le point de **déposer**, et la case `CJ` ne peut pas porter deux résultats à la fois : le
  contrôle nº 2 de l'OTR échouera au guichet. Le coût du blocage est nul (l'affectation est une
  écriture ordinaire) ; le coût du non-blocage est un rejet de dépôt.

**Q1 bis — le critère : la CO-OCCURRENCE, pas l'écart.**
`solde(13) ≠ 0` **ET** `resultatNetCR ≠ 0`. Zéro faux positif sur (a) et (b) ; le seul cas visé
est celui où deux résultats coexistent.

**Q2 — `coherenceResultat` gagne des champs, il n'en change pas le sens.** *(inchangé)* Le champ
actuel prouve un invariant utile du moteur ; le renommer ferait mentir les tests de
STORY-060/063 qui l'attestent.

---

## Critères d'acceptation (révisés le 2026-08-27)

- [x] AC-1 — `CompteResultatDto.coherenceResultat` et `BilanDto.controle` publient
      `resultatPorteAuPassif: number | null` = `montantN` du poste marqué `role='RESULTAT_BILAN'`.
      ⚠️ **`null` veut dire « le référentiel ne déclare pas ce poste »** ; un poste déclaré mais
      **non alimenté** vaut **`0`**. Les deux ne se confondent pas — c'est précisément la
      confusion qui rendait le critère d'origine faux.
- [x] AC-2 — `etatBalance: 'AVANT_CLOTURE' | 'APRES_DETERMINATION' | 'RESULTAT_NON_AFFECTE'`,
      dérivé de la co-occurrence ci-dessus (`13 = 0` / `CR = 0` / les deux non nuls). Une seule
      grandeur à lire pour l'écran, une seule règle à tester.
- [x] AC-3 — **Aucun refus au `dry-run`.** `etatBalance = 'RESULTAT_NON_AFFECTE'` est une
      **information**, pas une erreur : `200`, l'état est produit.
- [x] AC-4 — À la **validation** (STORY-063) : `etatBalance = 'RESULTAT_NON_AFFECTE'` ⇒
      `422 LIASSE_NON_VALIDABLE`, motif `RESULTAT_NON_AFFECTE`. Le motif **nomme le compte**
      (13, avec son solde) et le **geste** (affecter le résultat de l'exercice précédent).
- [x] AC-5 — Un référentiel sans poste `role='RESULTAT_BILAN'` ⇒ `resultatPorteAuPassif: null`,
      `etatBalance: null`, **non applicable, jamais « échec »** — patron `coherenceSig` / SFD-BCEAO.
- [x] AC-6 — **Trois tests, un par état.** (a) balance sans compte 13 ⇒ `AVANT_CLOTURE`, aucun
      motif, **validable** ; (b) classes 6/7 soldées ⇒ `APRES_DETERMINATION`, **validable** ;
      (c) les deux non nuls ⇒ `RESULTAT_NON_AFFECTE`, `dry-run` en `200`, validation en `422`.
      **Le test (a) est le plus important : c'est celui que la première version aurait fait rougir.**

## Vigilance

- ⛔ **Ne pas « corriger » `emettrePassif` en y ajoutant le résultat.** `BZ = DZ` tient
  aujourd'hui *parce que* le placement se fait dans le contexte des sous-totaux et **là
  seulement**. L'ajouter aussi au poste de détail compterait le résultat deux fois dans `DZ`.
- ⚠️ La valeur reste en **unités mineures XOF**, comme tout le reste du contrat.
- ⚠️ Le rattachement est **par préfixe** : `13100000` et `13110000` tombent tous deux sur `CJ`
  (vérifié sur la table de passage). Le critère porte sur la **somme** du poste, pas sur un compte.

## Conséquences ailleurs

- **FE-032** (compte de résultat) et **FE-079** (ligne `CJ` au passif du Bilan) consomment ce
  champ. Sans lui, les deux écrans affichent un ✅ qui rassure à tort.
- **STORY-063** (contrôles d'articulation) est le point d'accroche naturel de Q1.

---

## ⛔ CORRECTION DU 2026-09-01 — le marqueur `RESULTAT_BILAN` n'est pas une MESURE

> Mesuré au développement, sur les **cinq artefacts packagés**. L'AC-1 posait
> « `resultatPorteAuPassif` = `montantN` du poste marqué `role='RESULTAT_BILAN'` » comme si
> ce poste portait le résultat et rien d'autre. C'est vrai pour SYSCOHADA. Ce ne l'est
> **pas** pour la moitié des référentiels qui déclarent le marqueur.

| artefact | poste marqué | racines rattachées | le montant mesure… |
|---|---|---|---|
| `syscohada-revise@2.1` | `CJ` | `13` | **le résultat** ✅ |
| `zone-franche-togo@1.0` | `CJ` | `13` | **le résultat** ✅ |
| `cima-assurances@1.0` | `CP1` « Capitaux propres » | `10,11,12,13,14,88` | les capitaux propres ⛔ |
| `sfd-bceao@2.0` | `BP4` « Provisions, fonds propres et assimilés » | `50`→`59` | les fonds propres ⛔ |
| `sfd-bceao@1.0` | *(aucun)* | — | rien à mesurer |

⚡⚡ **Le marqueur a été posé par STORY-112 comme CIBLE DE PLACEMENT du résultat**, pour que
le grand total passif l'absorbe et que `BZ = DZ` se ferme. Rien n'oblige le poste receveur à
ne porter *que* le résultat — et deux artefacts en profitent. Publier le montant de `CP1`
sous le nom `resultatPorteAuPassif` ferait passer le **capital social** pour le résultat de
l'exercice, et le critère de co-occurrence rougirait sur **tout** dossier CIMA doté d'un
capital : c'est-à-dire sur le cas nominal, celui-là même que la §① de cette story refuse de
faire rougir. Le défaut aurait été déplacé d'un référentiel à l'autre, pas corrigé.

**Règle retenue, dérivée des données et non d'une convention** : le montant du poste ne
mesure le résultat que s'il ne rattache **qu'une seule racine** de comptes. Une racine + le
marqueur ⇒ cette racine **est** le compte de résultat, et le montant du poste **est** son
solde. Deux racines ou plus ⇒ on se tait (`null` / `NON_APPLICABLE`) plutôt que de publier un
chiffre faux. **L'AC-5 s'étend donc à ce second cas de non-applicabilité.**

🪝 Un référentiel qui voudrait le contrôle sans perdre son agrégat devra **déclarer** son
poste de résultat séparément — évolution de paquet, hors périmètre ici.

⚠️ **La règle compte les racines, pas leur LARGEUR** : un paquet futur posant le marqueur sur
une racine unique mais large (`['1']`) serait déclaré exploitable et publierait toute la
classe 1. Aucun des cinq artefacts ne le fait — `resultat-bilan-marqueur.spec.ts` le mesure.

---

## ⛔ SECOND ÉCART, LATENT DEPUIS STORY-063 — `NON_APPLICABLE` bloquait en code

`ControlesCoherenceProduit.valide` se calculait `every(statut === 'OK')` sur les contrôles
`BLOQUANT`, quand le JSDoc de `STATUTS_CONTROLE` dit depuis STORY-063 que `NON_APPLICABLE`
signifie « aucune anomalie, **jamais bloquant** ». L'écart était **invisible** : aucun
contrôle bloquant ne rendait ce statut, seuls les informatifs le faisaient.

`RESULTAT_NON_AFFECTE` est le premier — et sans correction, il aurait rendu **toute** liasse
`cima-assurances@1.0` et `sfd-bceao@2.0` non validable, en refusant une structure que le cadre
comptable ne porte simplement pas. Le prédicat `bloquantSatisfait` est désormais l'**unique
écrivain** de cette règle, partagé avec la liste d'anomalies du refus 422 : deux prédicats
parallèles auraient fini par diverger, et l'un des deux aurait mené à un **422 au message
vide**.

---

## Progress Tracking

**Statut : `done`** — implémentée, validée, revue (code + sécurité), **vérification docker
réelle rejouée sur l'état final**, PR `bilan-service` **#56** rebase-mergée sur `dev`.

### Ce qui est livré

- `ControleEquilibre` (donc `BilanDto.controle`) publie `resultatPorteAuPassif`,
  `posteResultatBilan`, `comptesResultatBilan` et `etatBalance` ; `CoherenceResultat` (donc
  `CompteResultatDto.coherenceResultat`) **recopie** les deux premiers champs métier —
  **un seul écrivain**, le `BilanProductionService`, seul à disposer du référentiel *et* des
  postes émis.
- `etatBalance` dérivé de la **co-occurrence**, jamais de l'écart. Les deux grandeurs nulles
  tombent en `AVANT_CLOTURE` (les deux états « nuls » sont de toute façon validables).
- 6ᵉ contrôle `RESULTAT_NON_AFFECTE`, **BLOQUANT**, `ecart: null` par nature — rien n'est à
  ramener à zéro, il faut **affecter** le résultat antérieur.
- `MOTEUR_VERSION` `1.1.0` → `1.2.0`, et `moteur-version.spec.ts` fige désormais aussi
  `Object.keys(bilan.controle)` : les quatre champs de cette story vivaient **hors de la vue**
  du garde-fou, que seul l'ajout du 6ᵉ code faisait rougir.

### Portes DoD

Lint 0 warning · build OK · **1 254 unitaires + 352 e2e** verts · couverture
**98,62 / 93,41 / 98,30 / 98,57** (seuils 90/65/90/90).

### Passe de mutation — 7 mutations, 7 rouges, aucune par erreur de compilation

| mutation | test qui rougit |
|---|---|
| garde « une seule racine » retirée | production + les deux liasses réelles CIMA/SFD |
| co-occurrence remplacée par l'écart | **AC-6 (a) et (b)** — le critère naïf refuse les deux états normaux |
| poste déclaré non alimenté → `null` au lieu de `0` | AC-1 (`null` ≠ `0`) |
| `valide` redevient `every(statut === 'OK')` | AC-5 + les deux liasses réelles |
| `etatBalance` retiré du contrôle d'équilibre | `moteur-version.spec.ts` (après extension) |
| éléments du refus ne nommant plus le compte | AC-4 |
| borne du message 422 retirée | e2e de sécurité |

### Vérification docker — stack NEUVE (`down -v`), Mongo réel, référentiels réels

Organisation créée par `register`/`login` réels (JWT RS256), read-models `orgkycstatuses` /
`orgbilanentitlements` / `dossiers_dossier` / `exercices_dossier` / `balances_balance` semés
en `mongosh`.

| Mesure | Résultat |
|---|---|
| **(a)** comptes de gestion ouverts, `13` absent — **l'état NOMINAL** | `CJ=0`, `resultatNetN=400 000`, `AVANT_CLOTURE`, contrôle **OK**, **validable** |
| **(b)** classes 6/7 soldées, résultat au `13` | `CJ=400 000`, `resultatNetN=0`, `APRES_DETERMINATION`, contrôle **OK**, **validable** |
| **(c)** les deux alimentés | `CJ=800 000`, `resultatNetN=400 000`, `RESULTAT_NON_AFFECTE` — et **`equilibreN=true`**, `EQUILIBRE_BILAN` **OK**, `COHERENCE_RESULTAT` **OK** |
| `POST …/valider` sur (c) | **422 `LIASSE_NON_VALIDABLE`**, motif nommant le compte, son solde et le geste ; **aucune ligne** `EQUILIBRE_BILAN` ni `COHERENCE_RESULTAT` |
| état après le refus | `jeux_etats` **`BROUILLON`**, `validePar: null` · `snapshots_liasse` **0 doc** · `outbox_events` **0 doc** — aucun orphelin |
| validation d'une liasse saine | snapshot **v1** figé, `moteurVersion=bilan-engine@1.2.0`, les 4 champs persistés, `outbox` **`SENT`** |
| ⚡⚡ **`cima-assurances@1.0`, `CP1` alimenté à 1 100 000 de capital + résultat non nul** | `resultatPorteAuPassif: null`, `etatBalance: null`, contrôle **`NON_APPLICABLE`**, `valide: true`, **validation HTTP 200** — sans la garde, cette liasse serait refusée, comme toutes les liasses CIMA |

⚠️ **Atomicité : rien de neuf à prouver, et le dire vaut mieux que l'affirmer.** Cette story
n'ouvre aucune transaction ; celle de `valider()` (snapshot + jeu + outbox, 3 documents) est
celle de STORY-065. Ce qui est vérifié ici, c'est le **chemin d'échec** : le 422 est levé
**avant** l'ouverture de la transaction, et rien n'est écrit.

### Revue de code — 6 constats, tous traités (commit dédié)

**Trois bloquants, tous des descriptions PUBLIÉES en OpenAPI restées à l'état d'avant.** Un
`*.dto.ts` est hors `collectCoverageFrom` : aucun seuil ne les regarde.

- `ControlesCoherenceDto.controles` énumérait la partition bloquant/informatif **sans**
  `RESULTAT_NON_AFFECTE`. Un intégrateur qui code d'après cette phrase le range en
  « informatif », affiche « liasse validable », et prend un **422** dont il n'a aucun libellé
  — le scénario que la story ferme, réintroduit à l'étage contrat.
- `valide` disait « ⟺ tous les BLOQUANT sont **OK** » quand la PR l'a changé. Un client qui
  recalcule le drapeau selon la règle publiée grise « Valider » sur **toutes** les liasses
  CIMA et SFD v2 : la panne que `bloquantSatisfait` existe pour éviter, **déplacée du serveur
  vers le client**. (2 DTO.)
- `ecart` disait « `null` si `INDETERMINABLE`/`NON_APPLICABLE` », or `RESULTAT_NON_AFFECTE`
  rend `null` **en `ANOMALIE`**, par conception. Un rendu qui formate `ecart` dans cette
  branche affiche « NaN FCFA » sur le seul contrôle qui explique le refus.

**Trois non-bloquants.**

- ⚡⚡ `resultat-bilan-marqueur.spec.ts` **RECOPIAIT** la règle « une seule racine » au lieu
  d'interroger le moteur : retirer la garde le laissait **entièrement vert** pendant que le
  service publiait `CP1` sous le nom `resultatPorteAuPassif`. Un second écrivain de la même
  règle — le défaut exact que `bloquantSatisfait` venait de fermer ailleurs. Il produit
  désormais un Bilan réel ; mutation rejouée, il rougit.
- Branche pluriel `compte${…length > 1 ? 's' : ''}` : chemin **mort** (la garde n'admet qu'une
  racine), et un test la certifiait depuis un `ControleEquilibre` que le moteur **ne peut pas
  produire** — vert, couvrant du code mort, faisant croire à une capacité absente.
- Le motif nommait « compte 13 » un montant lu sur le **poste émis** : une surcharge
  d'organisation redirigeant un compte vers ce poste enverrait solder un `13` vide. Il dit
  maintenant `CJ (référentiel : compte 13)` — quel poste porte le montant, quel compte le
  paquet y rattache, sans confondre les deux.

### Revue de sécurité — 1 constat, né du commit de revue lui-même (commit dédié)

⚡⚡ **Le refus 422 recopiait la balance du cabinet dans le journal, sans borne.** Le filtre
global journalise `JSON.stringify(message)` au niveau `warn` ; en enrichissant la ligne
d'anomalie des `elements`, la revue de code y avait fait entrer une liste **non bornée** —
ceux de `COMPTES_NON_AFFECTES` valent **un par compte non rattaché fourni par l'appelant**,
jusqu'à `@ArrayMaxSize(5000)`.

Amplification **asymétrique et rejouable** : `POST …/valider` a un corps **vide** (les soldes
viennent du brouillon stocké) et laisse le jeu en `BROUILLON` quand il échoue. 200 octets
d'appel → ~200 Ko de journal, à volonté sous le throttler. Et les comptes du cabinet partaient
dans un flux dont l'audience dépasse le tenant.

⇒ `elementsLisibles` borne à **10 éléments + « … et N autres »**. ⚠️ On borne le **message**,
jamais le contrôle : `GET …/bilan/etats/:id` sert toujours `liasse.controles[].elements` en
entier, au même appelant, sous les mêmes gardes.

**Écartés, vérifiés un par un** : fuite d'information dans le 422 (tout le contenu ajouté est
déjà connu de l'appelant — il a fourni les soldes ; le reste vient du référentiel packagé,
déjà servi par `GET …/referentiel/postes`) · contournement du gate par `bloquantSatisfait`
(**no-op strict** : aucun des 3 bloquants préexistants ne rend `NON_APPLICABLE`, et le seul
déclencheur vient du paquet de référentiel, non sélectionnable par requête) · contournement du
contrôle par une surcharge de mapping (possible, mais **les soldes sont auto-déclarés** : le
cabinet peut trivialement omettre le `13` — assistance, pas frontière de sécurité) ·
réécriture de snapshot (collection append-only, `creer` unique écrivain, bump `1.2.0` correct)
· injection (`compte` contraint `^\d[0-9A-Za-z]{1,19}$` : ni CR/LF, ni `<`, ni `=`/`+`/`-`/`@`
en tête ; artefacts vérifiés par sha256 ; les `elements` n'atteignent ni l'export Excel ni le
PDF).

### Bornes assumées, nommées plutôt que tues

- **Exercice `N` seul** — la colonne comparative `N-1` n'est pas qualifiée, sur le patron déjà
  retenu par `soldesComptesNonMappes` (STORY-401). L'étendre est un écart distinct.
- `CompteResultatDto.coherenceResultat` reste un **`object` opaque** au contrat : dette
  pré-existante, inventoriée et figée dans `openapi-contract.e2e-spec.ts`, hors périmètre. Les
  deux champs sont bien servis à l'exécution, et décrits par `BilanDto.controle` — qui, lui,
  est un vrai DTO et publie l'`enum` `EtatBalance`.
