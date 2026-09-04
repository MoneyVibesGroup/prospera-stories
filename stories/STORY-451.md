# STORY-451 : Les surcharges de mapping — le seul acte humain qui change les chiffres — ne sont pas journalisées

Status: done

**Épic :** EPIC-012 — Validation, immutabilité, exercices, audit
**Service :** `bilan-service`
**Points :** 2 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-034** (cycle brouillon → validé, snapshot immuable, piste d'audit), 2026-08-27.
Relevé en lisant les contrôleurs de `bilan-service` sur `origin/dev`.

---

## Le fait

`AuditType` compte **huit** valeurs : `JEU_CREE`, `JEU_RECALCULE`, `JEU_VALIDE`, `JEU_ROUVERT`,
`EXERCICE_CREE`, `EXERCICE_CLOS`, `EXERCICE_ROUVERT`, `EXPORT_EFFECTUE`. Aucune ne couvre les
**surcharges de mapping**, et `mapping-override.controller.ts` n'appelle jamais `journaliser()`
(seuls `jeu-etats`, `exercice` et `export` le font).

Or une surcharge validée **change les montants de la liasse** : c'est l'arbitrage d'un compte vers
un autre poste, décidé par un humain, appliqué à la production. Entre deux versions figées, c'est
souvent **la seule** chose qui a bougé — et le journal ne la voit pas.

Le journal trace donc les **transitions d'état** de la liasse, mais pas les **décisions** qui en
changent le contenu. La fiche FE-034 demande de tracer « import / mapping / validation / export » :
**deux sur quatre** sont servis.

## Critères d'acceptation

- [x] AC-1 — `AuditType` gagne `MAPPING_SURCHARGE_PROPOSEE`, `MAPPING_SURCHARGE_VALIDEE`,
      `MAPPING_SURCHARGE_REJETEE`.
- [x] AC-2 — `mapping-override.controller` journalise les trois, avec
      `cible: { collection: 'mapping_overrides', id, libelle: compte }` et
      `contexte: { compte, cibleEtat,ciblePoste, motif }`.
- [x] AC-3 — La journalisation suit le patron du service : **hook post-action isolé**, jamais dans
      la transaction, jamais propagée en erreur.
- [x] AC-4 — Aucune reprise rétroactive : les surcharges antérieures n'ont pas d'événement, et le
      journal ne l'invente pas.
- [x] AC-5 — ⚠️ L'**import de balance** reste hors périmètre : il vit dans `balance-service`, qui a
      sa propre trace. Le journal du Bilan doit **pointer** vers elle (STORY-450), pas la recopier.

## Conséquences ailleurs

- La maquette FE-034 dessine cette ligne manquante **en filigrane** dans le journal, marquée
  « non journalisé », pour rendre le trou visible plutôt que de le taire.

---

## Progress Tracking

**Statut : `done`** — PR `bilan-service` **#83** (3 commits) rebase-mergée sur `dev` le
2026-09-04. Revue de code + revue de sécurité + **vérification docker**.

Branches créées **avant** la première ligne de code :

```
docs             MNV-451
bilan-service    MNV-451
```

### Ce qui est livré

- **AC-1** — `MAPPING_SURCHARGE_PROPOSEE`, `…_VALIDEE`, `…_REJETEE`. **Les trois
  moments**, pas seulement la validation : ne garder que celle-ci ferait un journal où
  les arbitrages **refusés** n'ont jamais existé.
- **AC-2** — `cible: {collection: 'mapping_overrides', id, libelle: compte}` ·
  `contexte: {compte, portee, cibleEtat, ciblePoste}` (+ `motif` sur la proposition,
  + `ancienEtat`/`ancienPoste` sur la validation — voir ci-dessous).
- **AC-3** — hook **post-action isolé** : après la persistance, hors transaction,
  `journaliser` ne lève jamais. Une action **refusée** ne laisse **aucune** ligne.
- **AC-4** — aucune reprise rétroactive.
- **AC-5** — l'import de balance reste hors périmètre (`balance-service` a sa trace).

### ⚠️ Deux clés au-delà de la lettre de l'AC-2

- **`portee`** : une surcharge `RACINE` s'applique à **tous** les comptes qui commencent
  par la valeur — son effet sur les montants n'a rien de commun avec celui d'une
  `COMPTE`. Un journal qui tairait la portée décrirait **mal** l'acte qu'il existe pour
  défendre (STORY-400).
- **`ancienEtat`/`ancienPoste`, sur la validation seule** — le seul moment où ils
  existent, `valider` capturant le rattachement référentiel courant juste avant de le
  remplacer. Sans eux, l'entrée dirait où va le compte sans dire **ce qu'elle remplace**.

### ⛔⛔ Revue de sécurité — le `motif` du PROPOSANT sortait sous l'identité de l'ADMINISTRATEUR

**Le constat de la story, et il porte contre la propriété que STORY-441 a établie** (« la
piste d'audit nomme son auteur »).

Le même `doc.motif` était versé sur les trois lignes. Sur `…_PROPOSEE`, l'auteur du texte
et l'auteur de la ligne sont la même personne. Sur `…_VALIDEE` et `…_REJETEE` — actes
réservés au `TENANT_ADMIN` — ils **divergent** : le journal résout `userId` **en nom**
depuis les read-models `identity.*`, et rendait donc « *Marie Dupont a validé la
surcharge — motif : « … »* » alors que la phrase est celle du `TENANT_USER` qui a
proposé. **Aucun champ ne disait qu'elle n'était pas d'elle.**

⚠️ **Première divergence de ce genre dans tout le journal** : le `motif` de `JEU_ROUVERT`
(444) et l'accusé de `LIASSE_DEPOSEE` (446) viennent de routes `@Roles(TENANT_ADMIN)`
seules — texte et ligne y ont toujours le même auteur ; `EXPORT_EFFECTUE` ne porte que du
calculé. Un `TENANT_USER` pouvait donc faire publier, dans une collection **append-only
non rectifiable**, une affirmation attribuée à un administrateur, devant le lecteur même
pour qui la ligne existe.

**Le motif est désormais journalisé sur la SEULE ligne où il est un fait** : la
proposition, sous son vrai auteur. Rien n'est perdu — les trois lignes partagent le même
`cible.id`, et `?cibleId=<id>` les chaîne. ⛔ **Écarté** : renommer en `motifProposition`
et ajouter `motifAuteur`, qui republierait un **ObjectId nu** là où le journal résout des
noms — le défaut exact que STORY-441 a fermé.

### ⛔⛔ Revue de code — le hook d'audit LEVAIT, après l'écriture

`journaliserSurcharge` appelait `userObjectId(user)` **en son sein**. Sur `proposer` et
`valider` c'était inoffensif — l'auteur est résolu avant l'appel service. Mais `rejeter`
ne résolvait que le **tenant** : le hook devenait le **premier** endroit où `userId` était
éprouvé, et il l'était **après** que la surcharge avait été rejetée en base.
`JwtStrategy.validate` recopie `payload.sub` verbatim, sans contrôle de format — un jeton
RS256 **valide** au `sub` non-ObjectId faisait donc **écrire puis rendre 403**, là où
l'API rendait 200 la veille, et **sans laisser de ligne de journal**.

⚠️ Le commentaire posé juste au-dessus affirmait l'inverse : la garantie « ne lève
jamais » porte sur `AuditService.journaliser`, pas sur ce hook — qui n'était même pas
`async` et levait donc **synchronement**. Le hook prend désormais un `Types.ObjectId`
**déjà résolu** : le compilateur oblige chaque appelant à résoudre l'auteur **avant**
l'action, et la classe de défaut devient **impossible**.

**⛔ Second bloquant — le contrat publiait « DEUX valeurs de `cibleCollection` »**, il y
en a trois. `mapping_overrides` traverse le filtre sans problème ; c'est la **description**
qui mentait. Un écran bâti dessus proposerait un sélecteur à deux entrées, et filtrer sur
`jeux_etats` pour comprendre **pourquoi les montants ont bougé** ne montrerait aucune
ligne de surcharge — précisément celles que la story crée. C'est le piège de STORY-446,
dans sa variante **documentaire**.

⚠️ **Trois autres inventaires rendus faux**, tous corrigés : « trois types portent un
contexte » (ils sont **six**) · l'inventaire des porteurs du schéma, **déjà** amputé de
`LIASSE_DEPOSEE` avant cette PR · et la **cardinalité « neuf valeurs »** qui justifie
l'**absence d'index** sur `type` — dix avant, treize après. Le décompte a été **retiré** :
une décision d'indexation ne doit pas reposer sur un nombre recopié à la main.

⚠️⚠️ **Retombée de STORY-449 rattrapée ici** : la description publiée de
`AuditEventDto.contexte` affirmait qu'« un jeu VALIDE exporté sans `?version` produit
`statut: "BROUILLON"` ». STORY-449 avait **précisément corrigé ce comportement** deux
heures plus tôt — ni sa revue de code ni sa revue de sécurité ne l'avaient vue.

⚠️ **QUATRIÈME harnais e2e** : `bilan-dossier-scope` monte aussi `MappingOverrideController`
avec un double d'audit **sans** `journaliser`. Il ne cassait pas parce que **toutes** ses
écritures sont attendues refusées (409 `DOSSIER_ARCHIVE`) — la suite était **aveugle** au
mode de panne. C'est le manquement nommé par `qualite-verification.md` : ajouter une
dépendance au constructeur oblige à mettre à jour **TOUS** les modules de test, y compris
ceux que la suite n'exerce pas encore.

### ⛔ Le `motif` est une saisie libre versée au journal

`AuditService.journaliser` pose ses conditions noir sur blanc : toute saisie versée au
`contexte` doit être **bornée, rognée, sans caractère invisible**, et son champ doit
**annoncer au contrat qu'il sera publié**. `@MaxLength(500)` bornait déjà ; le rognage et
le refus des invisibles manquaient. Corrigé avec l'outil du dépôt.

⚠️ **Aucune borne BASSE n'a été ajoutée**, contrairement au `motif` de `rouvrir` (10
caractères) : celui-ci est **optionnel** et existe depuis STORY-058. Lui poser un minimum
refuserait en 400 des motifs courts que l'API accepte aujourd'hui.

⚠️ **Le durcissement est PROSPECTIF** : `valider`/`rejeter` journalisaient le motif
**persisté**, écrit possiblement sous l'ancien DTO. Depuis le correctif de sécurité ils ne
le journalisent plus du tout, ce qui ferme aussi cette porte. Hook documenté.

### Vérification

Lint 0 warning · build OK · **1 763 unitaires + 494 e2e verts** · couverture **94,05 /
98,78 / 98,84 / 98,82** · **11 mutations rouges par assertion**, aucune par erreur de
compilation :

| mutation | ce qui vire au rouge |
|---|---|
| `proposer` ne journalise plus | 1 unitaire |
| le type de `valider` remplacé par celui de la proposition | 1 unitaire |
| `rejeter` journalise **avant** la réponse du service | 4 unitaires |
| la **portée** retirée du contexte | 2 unitaires |
| l'**ancien poste** retiré du contexte de validation | 2 unitaires |
| le refus des caractères invisibles retiré | e2e |
| le rognage du motif retiré | e2e |
| `rejeter` résout l'auteur **après** l'écriture (le bloquant) | 1 unitaire |
| le motif du proposant ressort sur les lignes d'**arbitrage** | 2 unitaires **+** 1 e2e |
| le motif disparaît **aussi** de la proposition | 1 unitaire |

⚠️ Deux exécutions de la suite complète ont vu des suites tomber en **cascade de
timeouts** sous charge machine (51 s au lieu de 8 s) ; vertes en isolation et à la
réexécution complète. Signature **distincte** du flake d'authentification déjà fiché.

**Vérification docker sur jeton RS256 réel** :

| critère | mesure |
|---|---|
| AC-1 / AC-2 | **deux lignes réellement écrites** dans `audit_events`, même `cible.id`, relues par `GET …/bilan/audit` |
| revue ② | `?cibleCollection=mapping_overrides` **filtre bien** — la troisième valeur que le contrat taisait |
| AC-2 | `…_VALIDEE` porte `ancienEtat: BILAN_ACTIF`, `ancienPoste: BJ` → `cibleEtat: BILAN_PASSIF`, `ciblePoste: DJ` : l'écart **capturé sur le référentiel réel** |
| ⛔ sécurité | **`motif` est sur `…_PROPOSEE` SEULEMENT** — absent de la ligne de validation |
| durcissement | motif entouré d'espaces **rogné** ; motif portant **U+202E** ⇒ **400** |

### ⛔ Ce qui n'a PAS été fait

- **`proposer` n'a pas de `@Throttle` dédié**, contrairement aux routes d'export (10/60 s).
  Chaque appel réussi écrit désormais **deux** documents (surcharge + ligne d'audit) dans
  des collections jamais purgées, là où il en écrivait un. Le throttler global (100/60 s)
  s'applique ; ce n'est pas une classe de vecteur neuve — `POST …/export` fait déjà écrire
  de l'audit à un `TENANT_USER`. **Durcissement possible, fiché, non fait ici.**
- La **reprise** des surcharges antérieures : l'AC-4 l'interdit explicitement.
