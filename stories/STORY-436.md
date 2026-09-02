# STORY-436 : Quatre lignes du TFT ne sont dérivables d'aucune balance, et aucune route n'accepte de les saisir — le tableau des flux ne peut jamais être complété

Status: done

**Épic :** EPIC-010 — États financiers (`bilan-service`)
**Service :** `bilan-service` (`:3004`) — `modules/bilan/etats`, `dto`, contrôleur `bilan-diagnostics.controller.ts`
**Points :** 5 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-033** (TFT/TAFIRE, notes annexes, contrôles de cohérence), 2026-08-27.
Vérifié contre la DSF déposée `1000745307_2025_Definitif (1).xlsx`, feuille *« TFT »*.

---

## Le fait

Quatre lignes du formulaire portent `statutTft: 'A_COMPLETER'` et `montantN: null` :

| Code | Libellé | Pourquoi la balance ne peut pas le dire |
|---|---|---|
| `FJ` | + Encaissements liés aux cessions d'immobilisations financières | un encaissement ne laisse pas de solde |
| `FM` | − Prélèvements sur le capital | mouvement, pas position |
| `FN` | − **Dividendes versés** | idem — et c'est une ligne **obligatoire** dès qu'il y a distribution |
| `FQ` | − **Remboursements des emprunts et autres dettes financières** | seul le **solde** est connu, pas les flux bruts |

Le service a **raison** de rendre `null` plutôt que zéro (invariant P7 : jamais de montant
inventé). Le problème est ailleurs : **aucune route n'accepte de les compléter.** Les trois
endpoints de la liasse sont des `dry-run` en `@LectureSeule()` qui ne persistent rien.

⇒ **Tant que ces quatre cases restent vides, la liasse n'est pas déposable.** Le module produit
un état que personne ne peut finir.

⚠️ Et le défaut est plus large que ces quatre lignes : les **trames de notes** (`mode: 'TRAME'`,
notes 3, 4, 7 — mouvements d'immobilisations, antériorité des créances) sont dans le **même cas**.
La ligne de saisie qui sert le TFT doit servir les notes, ou il y en aura deux.

## ✅ Arbitrage (2026-08-27) — **sur le jeu d'états persisté**

Ces valeurs sont des **faits de l'exercice déposé**, pas des paramètres du dossier : un dividende
est voté par une assemblée, un remboursement d'emprunt appartient à un exercice et à un seul.
Trois conséquences décident :

1. **Elles doivent être figées avec la liasse.** Rattachées au dossier, elles flotteraient d'un
   exercice à l'autre et une liasse rouverte changerait **en silence** — exactement ce que
   STORY-065 existe pour empêcher.
2. **Elles doivent être auditables.** La piste d'audit (FR-017) porte sur le jeu d'états ; les
   poser ailleurs obligerait à réinventer datation et attribution.
3. **Elles n'ont de sens qu'avec un état.** Compléter le `FN` d'un TFT qui n'existe pas encore
   n'a pas de signification comptable.

⇒ **`PUT /bilan/etats/{id}/complements`**, dépendance assumée à **STORY-064**.

⚠️ **La dérivation depuis le journal (4ᵉ voie) est écartée pour l'instant, mais elle est la plus
juste** — aucune saisie, aucune erreur de report. Elle est inapplicable ici : l'entrée du module
est une **balance**, pas un journal, et un dossier alimenté par import de balance n'a pas les
écritures. À rouvrir quand le dossier portera son journal (elle deviendra alors un **contrôle**
de la saisie, pas son remplacement).

## Critères d'acceptation

- [x] AC-1 — Une route accepte les **compléments hors balance** d'une liasse, par code de poste,
      avec leur exercice : `PUT /bilan/etats/{id}/complements`. Elle refuse tout code dont le
      `statutTft` n'est **pas** `A_COMPLETER` — on ne surcharge pas ce que le moteur calcule.
- [x] AC-2 — Le TFT produit reprend le complément quand il existe : `montantN` renseigné,
      `statut: 'SAISI'` (**5ᵉ valeur**, distincte de `CALCULE` — la provenance ne se perd pas).
- [x] AC-3 — Les Z-sous-totaux propagent `SAISI` comme ils propagent `ESTIME` (héritage du pire),
      `SAISI` étant **meilleur** qu'`A_COMPLETER` et **moins bon** que `CALCULE`.
- [x] AC-4 — Les trames de notes (`mode: 'TRAME'`) passent par la **même** route.
- [x] AC-5 — Un complément saisi est **daté et attribué** (piste d'audit, FR-017) et **figé** par
      la validation (STORY-065) comme le reste de la liasse.
- [x] AC-6 — Agnosticisme P7 : aucun code de poste en dur ; la liste des cases complétables est
      **dérivée du paquet** (`statutTft: 'A_COMPLETER'` + `mode: 'TRAME'`).

## Conséquences ailleurs

- ⛔ **FE-080** est la moitié frontend et ne peut pas commencer avant l'arbitrage.
- **STORY-434** : si la voie B (note 3A) est retenue là-bas, elle passe par **cette** route.
- **STORY-064/065** : la saisie n'a de sens que sur un état **persisté** — la dépendance est réelle.

---

## Progress Tracking

**Statut : `done`** — implémentée, validée, revue (code + sécurité), **vérification docker rejouée sur
l'état final**, PR `bilan-service` **#67** (3 commits) rebase-mergée sur `dev` le 2026-09-02.

### Ce qui est livré

`PUT /dossiers/:dossierId/bilan/etats/{id}/complements` — sémantique **PUT** : l'ensemble est remplacé,
ce que le corps ne porte pas cesse d'être saisi. Les compléments vivent sur le **jeu d'états** (arbitrage
de la fiche), datés et attribués, figés par la validation.

| AC | Livré |
|---|---|
| AC-1 | La route accepte poste par poste et **refuse en 422** tout ce que le référentiel ne déclare pas hors balance. |
| AC-2 | La ligne porte son montant et le statut **`SAISI`**. Le montant entre dans le **contexte de cascade**, donc dans les Z-sous-totaux. |
| AC-3 | Héritage du pire sur l'échelle `CALCULE < SAISI < ESTIME`. |
| AC-4 | Les trames de notes passent par la **même** route ; une trame renseignée rend ses `lignes` et cesse d'être à compléter. |
| AC-5 | `saisiPar`/`saisiAt` posés par le service, jamais reçus du client ; gel par le **filtre atomique** `majSiBrouillon`, et compléments **recopiés dans le snapshot**. |
| AC-6 | Cases dérivées du paquet — `etat='TFT'`, `regle='FORMULE'`, `statutTft='A_COMPLETER'`, **sans opérande**. Aucun code OHADA dans le service. |

`MOTEUR_VERSION` 1.8.0 → **1.9.0** : la valeur produite change à balance égale, ce que ce tampon existe
pour distinguer. Nouveau type d'audit `JEU_COMPLEMENTS_SAISIS`.

### ⚠️ La convention de signe, dite au contrat

Le montant est **signé comme la ligne contribue à son sous-total** : un dividende de 1 500 000 se saisit
`-1500000` sur `FN` (« − Dividendes versés »). Le paquet fait déjà porter son sens à chaque ligne `F…`
(`FB` vaut `−Δ(BA)`, `FI` vaut `+TN`) et les Z-sous-totaux les somment tels quels. **Aucune règle de signe
n'est déduite du libellé** : le « − » qui ouvre le libellé est du texte, et le lire ferait du moteur un
lecteur d'intitulés.

### ⚡⚡ Deux défauts refermés, sans quoi l'AC-4 ne livrait rien

1. **`NotesAnnexesDto.notes` était typé par une INTERFACE** — Swagger publiait `items: {type: 'string'}`,
   donc un client généré typait la liste `string[]` et ne pouvait lire **aucun** champ, `lignes` compris.
   C'est le **3ᵉ état** à porter ce défaut après STORY-427 (compte de résultat) et STORY-433 (TFT) ;
   `moteur-version.ts` le nommait déjà « **le dernier trou connu** ». Refermé par `NoteAnnexeDto`.
2. **`class-validator` ne descend qu'UN niveau avec `each: true`** : `@IsString({ each: true })` sur un
   `string[][]` juge chaque **ligne** (un tableau) et rendait **400** sur une saisie parfaitement formée,
   là où la règle métier attend `422`. *Mesuré : la première version du DTO refusait toute trame.*

### ⛔ Revue de code — 8 constats, dont un BLOQUANT

**Le bloquant (confiance 95) : le complément était écrit AVANT que la liasse soit produite.**
`isInt(1e16)` vaut `true` — un montant hors entier sûr traversait le DTO, était **persisté**, puis faisait
lever la cascade. À partir de là, consultation, recalcul **et** validation rendaient toutes `400` : **le
jeu devenait inconsultable** jusqu'à ce qu'un appelant devine qu'il fallait re-saisir. `creerBrouillon`
fait l'inverse et son commentaire l'énonce (« *une agrégation hors bornes échoue avant toute écriture* ») ;
`saisirComplements` le fait désormais aussi, et `montant` porte les bornes d'entier sûr — **signées**,
`Min(0)` serait ici une faute.

Les sept autres : ② une clé de contexte fausse (`etat|poste` contre `etat:poste`) rendant une branche
**morte**, retirée plutôt que réparée puisque rien ne pouvait l'éprouver ; ③ `casesCompletables` acceptait
une case quel que soit l'`etat` et la `regle` quand le moteur filtre `TFT`+`FORMULE` — **trois lectures
divergentes de la même donnée**, dont une qui aurait écrasé la valeur produite du Bilan *et perdu ses
colonnes brutes* ; ④ le **snapshot ne figeait pas les compléments**, donc rejouer ses entrées ne
reproduisait plus sa sortie (NFR-003) et rouvrir puis re-saisir effaçait la provenance de la version
antérieure ; ⑤ une description publiée énumérant quatre statuts quand le même document en publie cinq ;
⑥ **une trame renseignée disparaissait du document exporté** — `detailACompleter` bascule à `false`, donc
la mention « Détail à compléter » n'était plus imprimée, et les `lignes` n'étaient lues par personne : le
cabinet exportait une note présentée comme achevée dont le détail ne figurait **nulle part** ;
⑦ `MatriceDeChainesConstraint` vivait dans un `*.dto.ts`, **hors couverture**, et n'était exercée par
rien — alors que cette logique a déjà été fautive une fois ; ⑧ deux commentaires périmés.

### Revue de sécurité — aucun constat, une réserve refermée

**Aucune vulnérabilité** au seuil : course fermée par le filtre atomique à quatre clés,
`whitelist`+`forbidNonWhitelisted` contre toute propriété étrangère, `etat`/`code`/`note` persistés comme
**valeurs** et jamais comme clés Mongo, corps plafonné à 100 Ko par le défaut body-parser bien avant les
bornes du DTO, messages 422 ne recopiant qu'**une** case fautive, `saisiPar` issu du JWT, append-only du
snapshot préservé.

⚠️ **Injection de formule écartée sur MESURE** : ExcelJS pose `cell.value` en chaîne partagée, jamais en
`<f>` — **zéro cellule de type formule** dans le classeur réellement produit. Il n'existe pas d'export CSV.

**Réserve (b), refermée** — le moteur appliquait les compléments **sans les re-confronter au paquet
courant**. La garde d'écriture juge le paquet du jour de la saisie ; celui de la production peut avoir
changé. Un poste qui cesse d'être déclaré complétable retombe à `A_COMPLETER` sur sa ligne pendant que le
Z-sous-total somme encore la valeur saisie : **la ligne vide et son total garni**. `saisiesRecevables`
applique désormais le même prédicat que la garde d'écriture — un seul juge pour deux moments. Une saisie
écartée n'est pas perdue : elle reste sur le jeu, servie avec sa provenance.

🪝 **Réserve (a), NON traitée et nommée** : le TOCTOU entre `saisirComplements` et `valider` est celui que
`recalculer` porte déjà avec `soldesN` depuis STORY-064/065 — même forme, même impact, même prérequis (le
tenant doit courir contre lui-même). Le correctif de fond est une **concurrence optimiste** sur le jeu, à
traiter pour les **deux** écrivains ensemble.

### Vérification

Lint 0 warning · build OK · **1 467** unitaires + **408** e2e verts · couverture
**98,74 / 93,78 / 98,67 / 98,72**.

**14 mutations**, chacune rouge sur l'assertion visée. Deux méritent d'être nommées :

- ⚡ **hisser `SAISI` au niveau d'`ESTIME` laissait 145 tests VERTS.** Aucun Z réel n'a pour seule
  imperfection une saisie, ni une saisie **avant** une estimation dans ses opérandes — et c'est là
  seulement que l'ordre décide (à sévérité égale, le premier composant rencontré l'emporte). Un
  référentiel synthétique l'éprouve désormais.
- ⚡ **la mutation du correctif de sécurité a demandé TROIS essais.** Mes deux premières versions restaient
  vertes parce que l'évaluateur **réécrit lui-même** un poste porteur d'opérandes : la divergence réelle
  est ailleurs, sur un poste qui **sort de la cascade**.

**Vérification docker — rejouée sur l'état FINAL** (stack réelle, tenant amorcé, gates posées) :

- `montant: 1e16` → **400, et `complements` reste `null` en base** — le correctif bloquant, prouvé ;
- saisie nominale : `FN = -1 500 000 / SAISI`, `ZD` mis à jour, note 3 rendue avec `detailACompleter: false` ;
- persistance prouvée par `mongosh` : `saisiPar` **ObjectId**, `saisiAt` **Date**, zéro orphelin ;
- refus aux bons codes : `422 COMPLEMENT_NON_COMPLETABLE`, `422 TRAME_LARGEUR_INVALIDE` (message nommant
  la ligne et le nombre de colonnes attendu), `409 JEU_VALIDE_NON_MODIFIABLE` ;
- audit `JEU_COMPLEMENTS_SAISIS` journalisé ;
- **snapshot v1 figé avec ses `complements` et sa trame**, en `bilan-engine@1.9.0` ;
- **export xlsx** portant « Terrains · 12000000 » sous ses colonnes officielles, **zéro cellule formule**.

### Hooks et dettes nommés

- **Colonne N-1** : un complément est un fait de l'exercice de **ce** jeu, jamais du précédent — la colonne
  N-1 d'une ligne saisie reste `null`. Servir un comparatif exigerait de saisir sur le jeu N-1, qui est un
  jeu d'états à part entière : rien à ajouter ici.
- **Dérivation depuis le journal** (4ᵉ voie de la fiche) : toujours écartée, l'entrée du module restant une
  balance. À rouvrir quand le dossier portera ses écritures — elle deviendra un **contrôle** de la saisie.
- **Concurrence optimiste** sur le jeu d'états : réserve (a) ci-dessus, deux écrivains concernés.
- **FE-080** est débloquée.

