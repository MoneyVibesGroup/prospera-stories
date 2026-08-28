# STORY-407 : Un relevé importé ne se retire jamais — l'erreur de compte est définitive

Status: done

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

**2026-08-28 — développée, validée, vérifiée sur stack docker neuve. Statut `review`.**

Branche `MNV-407` sur `balance-service`, commit `4df6f91`.

### Portes de qualité

Lint **0 warning** · build OK · **3172 unitaires verts** (176 suites) · **791 e2e verts** (26 suites) ·
seuils de couverture 65/90/90/90 franchis (`modules/tresorerie` : 99,4 % stmts / 84,1 % branches /
98,9 % fonctions / 99,6 % lignes ; les 5 fichiers neufs de la story à 100 % de lignes sauf
`imports-releve.repository.ts`, complété ensuite).

### Passe de mutation — 10 mutations, 10 rouges, toutes restaurées

| # | Mutation | Ce qui vire au rouge |
|---|---|---|
| M1 | `idsPourLignesReleve` filtre `statut: 'CONFIRME'` | unit ✗ « le filtre ne porte AUCUN statut » |
| M2 | la garde d'appariement passe à `total > 999` | unit ✗ + **e2e ✗** (appariement PROPOSÉ) |
| M3 | `marquerRetire` perd `retrait: { $exists: false }` | unit ✗ « le second retrait concurrent perd » |
| M4 | `supprimerParImport` oublie `compteTresorerieId` | unit ✗ « le retrait porte org, dossier, COMPTE et lot » |
| M5 | la trace publie `lot.lignesCreees` au lieu du `deletedCount` | unit ✗ « les compteurs RÉELS » |
| M6 | le retrait n'efface plus les qualifications | unit ✗ « une ligne QUALIFIÉE se retire » |
| M7 | le retrait refuse un compte désactivé (la garde de trop) | unit ✗ + **e2e ✗** |
| M8 | `insererPlusieurs` intervertit `compteTresorerieId` et `importId` | unit ✗ |
| M9 | `estClos` évalué sur des bornes autres que celles du lot | unit ✗ « l'exercice DU LOT » |
| M10 | `imports.trouver` oublie `compteTresorerieId` | unit ✗ « deux params d'URL discordants ⇒ 404 » |

⚠️ **M8 a d'abord été écrite comme une SUPPRESSION du champ — mutation invalide** : elle rendait le
paramètre `importId` inutilisé et **échouait à la compilation** (`TS6133`). Un rouge par erreur de
compilation ne prouve rien ; la mutation a été réécrite en **interversion** (les deux paramètres
restent lus), qui compile — et c'est elle qui a viré au rouge.

⚠️ **M1, M3, M8 et M10 laissent l'e2e VERT, et c'est structurel, pas un trou** : cet e2e double les
**dépôts** par des magasins en mémoire (choix assumé depuis STORY-088) — muter le dépôt réel ne peut
donc rien y changer. C'est la vérification docker ci-dessous qui exerce ces quatre chemins pour de
vrai.

### Vérification docker — stack neuve (`down -v`), Mongo `rs0`, mongosh direct

Organisation `6a91…b017`, dossier cabinet `6a91…b0a1`, compte `BOA — courant` `6a91…1486`, profil
d'import `RELEVE` `6a91…14a2`. Relevé BOA de mars importé par l'API (`201`, `dryRun=false`) :
2 lignes (6 400 000 crédit / 5 100 000 débit).

**① Le lot naît AVEC ses lignes, et l'index existe**

`db.imports_releve` : **1 document** — `nomFichier: 'releve-mars.csv'`, `lignesCreees: 2`,
`parUserId`, compte, exercice et profil. `db.lignes_releve` : **2 documents**, tous deux
`importId = 6a91b159…14b4`, **exactement l'`_id` du lot** et l'`importId` publié par la réponse HTTP.
`getIndexes()` : `dossierId_1_importId_1` (lignes) et
`dossierId_1_compteTresorerieId_1_createdAt_-1` (lots) **présents**.

**② ⚡⚡ AC-2 — l'appariement `PROPOSE`, le cas que l'e2e ne peut PAS prouver**

Appariement `statut: 'PROPOSE'` inséré sur la 1ʳᵉ ligne. La ligne reste
**`statutRapprochement: 'NON_RAPPROCHE'`** — mesuré en base. `DELETE …/imports/{lot}` ⇒ **409
`IMPORT_RELEVE_LIGNES_APPARIEES`**, `details: { appariements: 1, appariementIds: [...] }`, message
citant `DELETE …/rapprochement/appariements/{id}`. **`db.lignes_releve` = 2** : le lot est resté
**entier**, jamais à moitié retiré.

⚡ **C'est LA mesure de la story.** Une garde bâtie sur `statutRapprochement` aurait rendu **204** ici
et laissé un appariement pointant sur des lignes disparues.

**③ ⚡⚡ L'autre sens — la ligne `ECARTE` se retire, et sa décision part avec elle**

Appariement supprimé, 2ᵉ ligne passée `ECARTE` + une `qualifications_ecart` `JUSTIFIE` posée dessus.
`DELETE` ⇒ **204**. Après : `lignes_releve = 0`, `qualifications_ecart = 0`, et la trace du lot :
`retrait { parUserId, le, lignesRetirees: 2, qualificationsRetirees: 1 }`. La garde naïve aurait
refusé ce retrait-là.

**④ AC-1 / D-407-2 — la suppression est DURE, mesurée par le ré-import**

Second `DELETE` du même lot ⇒ **409 `IMPORT_RELEVE_DEJA_RETIRE`**. **Ré-import du MÊME fichier sur le
MÊME compte ⇒ 201, `nouvelles: 2, ignorees: 0`** — donc l'index unique
`(dossierId, compteTresorerieId, checksumLigne)` ne compte plus les lignes retirées. Une suppression
logique aurait rendu `nouvelles: 0, ignorees: 2` : le geste suivant le plus probable après une erreur
d'exercice ou de profil aurait été refusé.

`GET …/imports` : **2 lots**, du plus récent au plus ancien, le retiré **toujours listé** avec son
bloc `retrait` — la trace est lisible après la disparition des lignes.

**⑤ Atomicité — prouvée par un ÉCHEC provoqué, service REDÉMARRÉ**

`marquerRetire` muté en `retrait: { $exists: true }` (le marquage ne peut plus aboutir : c'est le cas
du retrait concurrent perdant), conteneur **redémarré** pour ne rien devoir au hot-reload
(`Found 0 errors` compté 2 fois dans les logs). `DELETE` ⇒ **409**, et **`lignes_releve = 2`** :
la suppression a été **annulée avec la transaction**. Sans ce `throw`, les lignes du perdant seraient
parties sans qu'aucune trace ne les compte. Code restauré, service redémarré (`Found 0 errors` ×3).

**⑥ Refus et anti-énumération**

| Appel | HTTP | Code |
|---|---|---|
| lot de A demandé sous le compte **B** du même dossier | **404** | `IMPORT_RELEVE_INTROUVABLE` |
| lot **inconnu** | **404** | identique — rien ne distingue les deux |
| `importId` **malformé** (`0x`) | **404** | identique, **aucun 500 `BSONError`** (leçon STORY-405) |
| exercice **CLOS** (`exercices_dossier` projeté `CLOS`) | **409** | `EXERCICE_CLOS`, lignes intactes |

**⑦ Zéro orphelin, mesuré et non supposé**

Après le retrait final : `lignes_releve = 0` · **lignes sans lot connu = 0** · **qualifications
`RELEVE` orphelines = 0** · `imports_releve = 2`, dont **2 retirés** (les documents de lot survivent,
c'est le contrat).

Stack arrêtée (`docker compose stop`) à la fin de la passe.

---

## Revue de code — 4 constats, 4 corrigés (commit `8694b1e`)

Scan par le skill `prospera-code-review` (préparation `haiku`, analyse `opus`), **plus** une seconde
lentille `ponytail-review` sur le même `diff.patch` (over-engineering uniquement — verdict :
*« Lean already. Ship. »*, net −0 ligne ; les deux candidats qu'elle nomme — le `total` compté à part
et la borne du nom de fichier — sont gardés parce que la convention du DTO et la DoD les imposent).
Synthèse, filtrage et correctifs **en session**.

**① — le compte redevenait supprimable APRÈS un retrait, et emportait la trace avec lui.**
`COMPTE_TRESORERIE_REFERENCE` ne comptait que `lignes_releve` — à **0** une fois le lot retiré. Le
compte partait donc, ses documents `imports_releve` restaient en base à référencer un compte disparu
(**orphelins**, que la DoD interdit), et `GET …/{compte}/releves/imports` répondait **404** : le
retrait effaçait la seule trace qu'il était censé rendre auditable. ⚡ C'est le trou que **cette
story** venait d'ouvrir, et la vérification ④ ne l'avait pas mesuré — elle comptait les lignes sans
lot et les qualifications orphelines, jamais **les lots sans compte**. La garde compte désormais les
lots, et le message **suit la cause réelle** : parler de « lignes » quand il n'y en a plus enverrait
chercher au mauvais endroit.

**② — la garde d'appariement n'était servie par AUCUN index.** Le seul index portant
`{orgId, lignesReleve}` est **partiel** (`partialFilterExpression: { statut: 'CONFIRME' }`) : MongoDB
ne l'utilise que si le prédicat garantit l'appartenance au sous-ensemble — or `idsPourLignesReleve`
**omet `statut`**, et c'est précisément tout son intérêt (D-407-3). Les deux lectures de la garde
faisaient donc un **COLLSCAN** de `appariements`, sur un service mutualisé entre tous les tenants.
Index `{lignesReleve, orgId}` posé **avec son lecteur** (discipline D-411-2), `lignesReleve` en tête
parce que c'est le champ sélectif. ⚡ La même story appliquait pourtant cette discipline à
`{dossierId, importId}` : elle ne l'avait pas appliquée au **second** lecteur qu'elle ajoutait.

**③ — le `$or` par ligne de `supprimerPourLignes`.** Écrit pour les quelques lignes d'un appariement,
il recevait ici **le lot entier**. Un relevé de 300 000 lignes (≈ 35 Mo, sous `TAILLE_MAX_IMPORT`)
produisait 300 000 clauses : commande BSON de plusieurs mégaoctets, planificateur incapable
d'énumérer autant de branches ⇒ **500 sur le lot le plus coûteux à défaire à la main**, c'est-à-dire
celui pour lequel l'endpoint existe. Les identifiants passent par **tranches de 500**. La garde
d'appariement, elle, **reste une seule requête** : son `$in` est un tableau BSON plat (12 octets par
identifiant), pas N branches — et la découper ferait **compter deux fois** un appariement engageant
des lignes de deux tranches, rendant `details.appariements` faux.

**④ — un commentaire d'index faux à la naissance.** Il affirmait porter le tri
`{createdAt: -1, _id: -1}` que la clé `{dossierId, compteTresorerieId, createdAt}` ne peut pas
satisfaire (`_id` absent) : SORT bloquant, 900 lots triés en mémoire pour n'en rendre 200 — exactement
ce que la phrase prétendait éviter. `_id: -1` ajouté à la clé.

⚠️ **`ImportsReleveRepository` devenant une dépendance de `ComptesTresorerieService`, le module de
test e2e du *rapprochement* a dû recevoir son double** — sans quoi Nest ne résout plus ses
dépendances et la suite entière tombe (le piège nommé dans `qualite-verification.md`).

### Vérification docker REJOUÉE sur l'état final — stack neuve (`down -v`)

Deux correctifs touchent des **index**, artefact déjà vérifié en ④ : la passe est rejouée entière sur
une stack neuve, pas reportée depuis la mesure d'avant.

- **Index posés par une stack neuve** : `imports_releve` →
  `dossierId_1_compteTresorerieId_1_createdAt_-1__id_-1` (④) · `appariements` →
  `lignesReleve_1_orgId_1` (②), à côté des cinq existants.
- **② prouvé par le plan d'exécution**, sur un appariement **`PROPOSE`** (celui que l'index partiel
  n'indexe justement pas) : `explain('executionStats')` ⇒ **`IXSCAN` sur `lignesReleve_1_orgId_1`**,
  `totalDocsExamined = 1` pour `nReturned = 1`. Sans lui : COLLSCAN.
- **① prouvé de bout en bout** : compte **avec** ses 2 lignes ⇒ `DELETE` du compte **409**
  (`details: {lignes: 2, imports: 1}`) · retrait du lot **204** ⇒ `lignes = 0, lots = 1` · `DELETE` du
  compte à nouveau ⇒ **409**, `details: {lignes: 0, imports: 1}`, message *« garde la trace
  d'imports »* et non *« porte des lignes »* · `GET …/releves/imports` toujours **200**, la trace
  lisible. Avant le correctif, ce troisième appel rendait **204** et la trace devenait injoignable.

Stack arrêtée (`docker compose stop`).

---

## Revue de sécurité — 0 constat, et ce qu'il a fallu pour le dire

Scan par `prospera-security-review` (éligibilité + contexte `haiku`, analyse `opus`, **aucun
downgrade**) sur le diff **incluant** les correctifs de revue. Synthèse en session.

**0 vulnérabilité à confiance ≥ 80.** Ce qui a été effectivement mesuré, et non supposé :

- **Chaîne d'autorisation** — les deux routes héritent des décorateurs de classe
  (`@Roles(TENANT_ADMIN, TENANT_USER)`, `@RequiresBalanceAccess()`, `@RequiresDossierScope()`).
  `DossierScopeGuard` classe tout ce qui n'est ni `GET` ni `HEAD` en **écriture** : le `DELETE` est
  donc refusé **409 `DOSSIER_ARCHIVE`** sur dossier archivé, **404 `DOSSIER_INTROUVABLE`** sur un
  dossier d'une autre organisation. Aucun `@Public()`, aucun `@SkipThrottle`.
- **Le `compteId` utilisé après la garde est celui RELU EN BASE** (`compte.doc._id`), jamais celui de
  l'URL ; les quatre méthodes de dépôt du chemin destructif portent `orgId` + `dossierId` (+ compte,
  + lot) — le `deleteMany` ne peut structurellement pas porter sur la portée entière.
- **Anti-énumération** : lot inconnu, lot d'un autre compte, lot d'un autre dossier et identifiant
  **malformé** rendent le **même 404**. Les deux 409 ne sont atteignables qu'**après** que la
  propriété du lot est prouvée : ils ne disent rien qu'un 404 aurait tu.
- **Injection NoSQL fermée par construction** : les trois identifiants sont des `@Param` de *chemin*
  (Express n'y produit jamais d'objet — `?importId[$ne]=` ne les atteint pas), chacun passant par
  `Types.ObjectId.isValid` puis `new Types.ObjectId()`.
- **Période** : `estClos` reçoit `lot.exercice` — les bornes **persistées**, non falsifiables (ce
  `DELETE` n'a ni corps ni paramètre d'exercice).

Constat **écarté** et pourquoi, parce qu'il est le plus tentant : `idsPourLignesReleve` filtre
`orgId` **sans** `dossierId` et rend des `appariementIds` au client. Les `ligneIds` interrogés sont
**déjà** bornés au dossier par `idsParImport` ; pour qu'un identifiant d'un autre dossier sorte, il
faudrait qu'un appariement du dossier B référence une ligne de relevé du dossier A — impossible
depuis STORY-402. Cross-tenant fermé par `orgId`. Et sur une garde de **refus**, une portée plus
large est fail-safe : elle ne peut que refuser plus souvent.

⚠️ **Signalé, non corrigé (décision produit, pas faille)** : un **`TENANT_USER`** peut appeler ce
`DELETE` destructif. C'est cohérent avec **toutes** les écritures du service (suppression d'un compte
de trésorerie, annulation d'un appariement, cahiers, balance) — les réserver au `TENANT_ADMIN` serait
un arbitrage à porter sur l'ensemble du module, pas sur cette seule route.

---

## Progress Tracking — clôture

**2026-08-28 — `done`.** PR module [#65](https://github.com/MoneyVibesGroup/prospera-balance-service/pull/65)
rebase-mergée sur `dev` (commits `8faaceb` + `8694b1e`), branche supprimée. Revue de code : 4 constats,
4 corrigés. Revue de sécurité : 0 constat. Vérification docker rejouée sur l'état final.

**Ce que la story laisse volontairement ouvert**, et qui n'est pas un oubli :

- les lignes importées **avant** cette story n'appartiennent à aucun lot et ne se retirent pas
  (D-407-4 — reconstituer par heuristique ferait supprimer les lignes d'un import **correct**) ;
- la **course résiduelle** « appariement créé entre la garde et le commit », documentée dans
  `retirerImport` : dégât borné à un document d'appariement orphelin, visible et annulable ;
- le retrait reste ouvert au `TENANT_USER`, comme toutes les écritures du module.
