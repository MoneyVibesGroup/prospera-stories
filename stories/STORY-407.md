# STORY-407 : Un relevé importé ne se retire jamais — l'erreur de compte est définitive

Status: in_progress

**Épic :** EPIC-022 — Rapprochement bancaire (relevés + mobile money) · *clôturé le 2026-07-30 ;
cette story y atterrit sans le rouvrir*
**Service :** `balance-service` (`:3007`) — `modules/tresorerie`
**Points :** 5 · **Sprint :** S20 · **Complexité :** high
**Origine :** relevée le **2026-08-25** en dessinant la maquette **FE-049** — au moment d'écrire
ce que l'écran devait promettre juste avant le bouton « Importer ».

---

## Le fait, relevé à la source

`RelevesController` publie **deux** routes, et pas une de plus :

```ts
@Post()   // importer  (dryRun → 200, persist → 201)
@Get()    // consulter
```

Aucun `DELETE`. Aucun `PATCH`. Une ligne de relevé écrite ne se corrige pas, ne se retire pas, ne
se déplace pas. Le seul geste voisin — `DELETE /tresorerie/comptes/:id` — est refusé
(`409 COMPTE_TRESORERIE_REFERENCE`) dès qu'une ligne y est rattachée : **le compte fautif ne peut
même pas être supprimé avec ses lignes**.

---

## Ce que ça coûte, concrètement

L'erreur qui arrive vraiment n'est pas « un mauvais fichier » : c'est **le bon fichier sur le
mauvais compte**. Le cabinet tient une seule liste de comptes de trésorerie pour tous ses clients
(STORY-402) : « BOA — courant » y voisine avec « BOA — courant » d'un autre dossier. Un import
mal aiguillé y reste, et il n'est pas inerte :

- il **fabrique des écarts** dans un dossier auquel ces flux n'appartiennent pas ;
- il **participe à l'état de rapprochement** — donc au chiffre que le cabinet signe ;
- il est **idempotent par empreinte**, ce qui aggrave la situation au lieu de l'aider : réimporter
  le fichier au bon endroit ne retire rien du mauvais.

⚠️ **La seule sortie actuelle est une intervention en base.** C'est-à-dire : pas de sortie.

---

## Périmètre

**Inclus**

- Un geste de **retrait d'un lot importé**, tracé, réservé aux lignes **non appariées**.
- La borne qui donne son sens à la story : une ligne `RAPPROCHE` ne se retire **pas** sans
  dé-pointer d'abord. Retirer sous un appariement laisserait une ligne de cahier au niveau de
  preuve « fichier » sans le fichier qui la portait — une preuve orpheline, c'est-à-dire une
  balance indéfendable qui *se présente* comme défendable.
- La **granularité est à trancher, et c'est le cœur du cadrage** : par ligne (précis, mais on ne
  retire pas 156 lignes une à une), par **import** (naturel, mais rien ne rattache aujourd'hui une
  ligne à l'import qui l'a créée — `LigneReleve` ne porte ni `importId` ni horodatage d'import),
  ou par **fenêtre de dates sur un compte** (faisable sans nouveau champ, mais grossier).
  ⇒ Si la réponse est « par import », **elle exige un champ nouveau** et donc une migration.
- Trace de l'acte : qui, quand, combien de lignes, sur quel compte.

**Hors périmètre**

- La correction d'une ligne (montant, libellé, sens) : un relevé est la copie d'une pièce d'un
  tiers, on ne la corrige pas — on la réimporte.
- Le re-scopage au dossier : STORY-402.

---

## Conception — les cinq décisions écrites avant d'être codées

> **AC-3 est rempli ici.** La granularité et la migration sont tranchées **avant** la première
> ligne de code, avec ce qui a été écarté et pourquoi.

### D-407-1 · La granularité est le **lot d'import** — et elle exige `importId` sur `LigneReleve`

Les trois candidates de la story, confrontées à **l'erreur qui arrive vraiment** (le bon fichier
sur le mauvais compte) :

| Granularité | Verdict |
|---|---|
| **par ligne** | ✗ Ne répond pas à l'erreur visée : elle est *entière*. 156 lignes retirées une à une, c'est 156 occasions d'en oublier une — et une seule oubliée laisse un écart fabriqué dans le dossier, exactement ce que la story ferme. |
| **par fenêtre de dates sur un compte** | ✗ **Faisable sans nouveau champ, et c'est son seul mérite.** Le ré-import chevauchant est le cas NORMAL (D-089-3) : sur un même compte, les lignes de deux imports **s'entrelacent sur les mêmes dates**. Une fenêtre retirerait donc des lignes d'un import *correct*. Un geste destructif qui emporte de la donnée juste est pire que l'absence de geste. |
| **par import** ✅ | C'est l'unité dans laquelle l'erreur est *commise* — donc la seule dans laquelle elle se défait sans arbitrage. Elle exige un champ nouveau : `LigneReleve.importId`. |

⇒ **`importId: ObjectId` sur `LigneReleve`**, `required: true` au **schéma** (le seul écrivain est
`insererPlusieurs`, cf. leçon STORY-372 : un `required` sans écrivain ne refuse rien), optionnel
dans le type TS — même asymétrie assumée que `dossierId` pendant STORY-356, ici parce que les
lignes **antérieures** à cette story n'en portent pas (D-407-4). Index `{dossierId, importId}` :
il a son lecteur — le retrait — au **même commit** (discipline D-411-2).

⛔ **Écartée : ranger la liste des `_id` créés dans le document d'import.** Elle évite le champ
*et* la migration, mais met un tableau **non borné** dans un document : un relevé de 100 000
lignes y écrit 1,2 Mo, et la borne des 16 Mo devient une limite d'import déguisée. Un champ
indexé sur la ligne est borné par construction.

### D-407-2 · Le lot part en **dur** ; c'est la **trace** qui survit

Nouvelle collection **`imports_releve`** (snake_case explicite — le pluriel Mongoose donnerait
`importreleves`, et un `mongosh` sur le bon nom renverrait `0` sans erreur). Un document par
import **persisté** : compte, exercice, profil, nom de fichier, nombre de lignes, auteur, date —
puis, au retrait, `retrait { parUserId, le, lignesRetirees, qualificationsRetirees }`. C'est ce
document qui répond à « qui, quand, combien de lignes, sur quel compte », **après** que les
lignes ont disparu.

⛔ **Écartée : la suppression logique** (`retireLe` sur chaque ligne). Elle oblige **chaque**
lecture du module à filtrer, et surtout : l'index unique `{dossierId, compteTresorerieId,
checksumLigne}` continuerait de compter les lignes retirées. **Ré-importer le même fichier sur le
même compte après correction serait refusé** — or c'est le geste suivant le plus probable (mauvais
exercice, mauvais profil). Le remède serait un index partiel, c'est-à-dire de la complexité pour
défaire ce que la suppression logique venait d'ajouter.

### D-407-3 · La borne est **l'appariement**, jamais `statutRapprochement`

Le raccourci qui vient à l'esprit — « ne retirer que les lignes `NON_RAPPROCHE` » — est **faux
dans les deux sens**, et c'est le cœur du soin de cette story :

- **il laisse passer** la ligne sous un appariement `PROPOSE` : une proposition **n'a aucun
  effet** sur le statut de la ligne (elle reste `NON_RAPPROCHE`), et retirer sous elle laisse un
  appariement pointant sur une ligne de relevé qui n'existe plus ;
- **il refuse à tort** la ligne `ECARTE` : celle-là n'est pas *appariée*, elle est **qualifiée**
  — et la story dit « réservé aux lignes **non appariées** ».

⇒ La garde interroge la collection `appariements` sur `lignesReleve ∈ lot`, **tous statuts
confondus**, et refuse **le lot entier** (jamais un retrait partiel : une moitié de lot laisserait
une trace qui ment sur ce qu'elle a retiré). Code stable **`IMPORT_RELEVE_LIGNES_APPARIEES`**
(409), `details` portant le nombre et un échantillon borné d'`appariementIds`, et le message
nommant le geste : `DELETE …/rapprochement/appariements/:id` — **dé-pointer d'abord**.

La lecture des appariements reste **org-large** sur le côté relevé, comme `lignesConfirmees` et
**pour la même raison, écrite là-bas** : pour une garde de **refus**, une portée strictement plus
large est fail-safe ; la resserrer ne peut que rendre le refus plus rare.

### D-407-4 · **Migration : aucune reconstitution des lots antérieurs** — et c'est un choix de sûreté

Les lignes importées **avant** cette story ne portent pas d'`importId` : elles n'appartiennent à
aucun lot, ne sont listées par aucun `GET …/imports`, et ne se retirent pas.

⛔ **Écartée : reconstituer les lots par heuristique** (`compte + exercice + auteur + `createdAt`
à la seconde`). Vérifié dans `mongoose/lib/model.js:3153` — `insertMany` appelle
`initializeTimestamps()` **document par document** : les lignes d'un même import ne partagent donc
pas un horodatage exact, et un gros import peut **franchir la seconde**. L'heuristique **fusionne**
donc parfois deux imports et **coupe** parfois un import en deux. Sur un geste **destructif**, un
lot fusionné à tort fait supprimer les lignes d'un import **correct** : on livrerait, sous couvert
de réparation, la panne exacte que la story vient fermer.

⛔ **Écartée aussi : un lot « origine inconnue » par (dossier, compte, exercice).** Honnête si
étiqueté, mais c'est la granularité **fenêtre de dates** que D-407-1 vient de rejeter, sous un
autre nom — et elle emporterait, elle aussi, des lignes justes.

⇒ **Rien à migrer, et la règle du projet le dit déjà** : « migration de données = souci de prod,
différé ; le dev repart de zéro » (`CLAUDE.md`). Le champ est `required` au schéma : il n'oblige
que les écritures **neuves**, ne valide rien à la lecture, et ne casse donc aucun chemin existant
sur une base déjà peuplée. Aucun index obsolète n'est créé par ce geste — rien à ajouter à
`INDEX_OBSOLETES`.

### D-407-5 · Ce que le retrait emporte, et les deux verrous qu'il garde

**Il emporte les qualifications d'écart** des lignes retirées (`qualifications_ecart`), dans la
**même transaction**. Le schéma dit que la décision « survit tant que la ligne existe » : la
laisser derrière produirait un document orphelin — précisément ce que la vérification docker de
la DoD cherche. `QualificationsRepository.supprimerPourLignes` existe déjà et fait exactement
cela ; rien à écrire.

**Il garde le verrou de l'exercice clos.** Retirer des lignes d'un exercice `CLOS`, c'est écrire
dans une période que personne n'assume plus (D-089-6) — même refus que l'import, `EXERCICE_CLOS`.

**Il ne garde pas celui du compte inactif**, et c'est délibéré : un compte désactivé reste
lisible « pour que ses lignes déjà importées restent explicables ». Refuser le retrait dessus
rendrait la seule sortie… l'intervention en base, pour le sous-cas le plus banal (on désactive
justement le compte sur lequel on s'est trompé). Le retrait passe donc par `comptes.trouver`
(chemin de **lecture**), pas par `chargerPourImport`.

**Surface HTTP** — deux routes, sur le contrôleur existant, **littérales avant paramétrées** :

| Route | Rôle |
|---|---|
| `GET  /dossiers/:dossierId/tresorerie/:compteId/releves/imports` | Les lots d'un compte, du plus récent au plus ancien, retirés compris (la trace se lit). |
| `DELETE …/releves/imports/:importId` | Retire le lot. **204**. |

⚠️ Sans le `GET`, le `DELETE` serait **inerte** : l'erreur se découvre des jours plus tard, et
personne ne garde l'`importId` rendu par l'import. C'est le minimum pour que le consommateur nommé
(FE-049) puisse atteindre le geste — leçon STORY-173 (un livrable mergé et totalement inerte).

---

## Critères d'acceptation

1. Un lot importé par erreur se retire **sans intervention en base**, et la trace le dit.
2. Une ligne engagée dans un appariement (proposé ou confirmé) **refuse** d'être retirée, avec un
   code stable et un geste : dé-pointer d'abord.
3. La granularité retenue est **écrite** dans la story avant d'être codée, et si elle exige un
   champ nouveau sur `LigneReleve`, la migration l'est aussi.
4. L'état de rapprochement et les écarts du compte reflètent immédiatement le retrait.

---

## Notes

- ⚠️ **Ce n'est pas une demande de confort.** L'import est la seule écriture irréversible de tout
  l'Atelier : une balance se re-soumet en nouvelle version, une ligne de cahier se supprime, un
  appariement s'annule, un socle d'à-nouveaux se regénère en version. Le relevé est l'exception, et
  rien ne la justifie — elle vient de ce que personne n'a eu à retirer un relevé jusqu'ici.
- FE-049 le **dit à l'écran** faute de pouvoir l'éviter : le compte visé est rappelé juste au-dessus
  du bouton, et l'aperçu est le chemin nominal. C'est une atténuation, pas une réponse.
- Consommateur nommé : **FE-049**.

---

## Progress Tracking

**2026-08-28 — conception écrite avant le code, statut `in_progress`.**
Branches `MNV-407` ouvertes sur `docs/` (base `main`) et sur `balance-service` (base `dev`, après
`git fetch` — `origin/dev` porte les 3 commits de STORY-411, dont l'index
`dossierId_1_exercice.debut_1_date_1` que ce geste ne touche pas).
Décisions **D-407-1 → D-407-5** posées avant la première ligne de code : la granularité (**le lot
d'import**), le retrait **en dur** avec trace survivante, la borne posée sur **l'appariement** et
non sur `statutRapprochement`, l'absence délibérée de reconstitution des lots antérieurs, et ce
que le retrait emporte (les qualifications d'écart) comme ce qu'il garde (l'exercice clos).
Statut aligné aux 3 endroits (en-tête, `sprint-status.yaml`, cette section).
