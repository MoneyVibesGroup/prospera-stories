---
baseline_commit: a1c4d188251e404f1283755cf02fac4436ec1e81
---

# STORY-536 : Le paquet de dépôt — format, canal, calendrier et gabarit, packagés par pays et par état

Status: done

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle
**Service :** `fiscal-service` (registre) + `dossier-service` (statut pays) ; consommateurs futurs `bilan-service` / `microfinance-service` / `assurance-service`
**Points :** 13 · **Sprint :** S20 · **Complexité :** high · **Assigné à :** `vivianMoneyVibesGroupes`
**Origine :** arbitrage PO du 2026-08-28 — **voie A**, [[STORY-525]].

---

## Le fait

La voie A engage le produit à **produire des fichiers déposables**. Le premier réflexe serait
d'écrire un générateur e-DSF togolais et de le dupliquer par pays. **C'est la faute qu'il faut
éviter avant la première ligne** : un format de dépôt est **du droit administratif**, il change sans
prévenir, et neuf générateurs codés en dur, c'est neuf régressions par an que personne ne voit
venir.

⚡ **Le produit sait déjà faire l'inverse, et il le fait bien** : le référentiel comptable, le paquet
fiscal et le paquet prudentiel sont des **artefacts packagés, versionnés, vérifiés par checksum**,
et « ajouter un référentiel ne demande pas une ligne de code d'écran ». **Le dépôt doit hériter de ce
patron, pas en inventer un second.**

## Ce que le paquet de dépôt déclare

| Champ | Contenu |
|---|---|
| `pays` · `etat` | ISO 3166-1 alpha-2 · l'état concerné (DSF, DIMF 2000, C-xx CIMA…) |
| `format` | structure attendue (XML, CSV positionné, tableur, PDF/A) + son schéma |
| `gabarit` | la correspondance **poste de liasse → case du formulaire**, sourcée |
| `canal` | téléservice, dépôt physique, courriel — et son adresse |
| `calendrier` | date d'échéance, règle de calcul (`clôture + N mois`), jours ouvrés |
| `penalites` | ce que coûte le retard — au Togo, **40 %** |
| `version` · `checksum` · `statut` | comme tout artefact du programme |

## Critères d'acceptation

- [x] AC-1 — Le paquet est un **artefact packagé**, chargé et **vérifié par checksum**, comme les
      référentiels et les paquets fiscaux. Aucun format de dépôt codé dans un service.
- [x] AC-2 — ⛔ **La correspondance poste → case est SOURCÉE**, case par case, avec sa référence.
      Une case sans source **fait échouer le build** — même garde que STORY-493 AC-2. C'est ici que
      « vraisemblable » ferait le plus de dégâts : une case décalée passe tous les contrôles internes
      et est rejetée au guichet.
- [x] AC-3 — Un dépôt produit **porte la version de format qui l'a produit**. Un format révisé ne
      réécrit jamais un dépôt passé — même règle que les snapshots de liasse.
- [x] AC-4 — ⚠️ **Aucun pays n'est déclaré `servi` pour le dépôt sans son paquet packagé.** Le
      registre des pays (STORY-492) gagne un statut de dépôt, distinct du statut comptable et
      fiscal : un pays peut être `servi` pour la liasse et `non-servi` pour le dépôt.
- [x] AC-5 — Une route publie le paquet de dépôt actif d'un couple (pays, état), avec sa version et
      son checksum. C'est ce que l'écran affiche à côté du bouton de dépôt.
- [x] AC-6 — ⛔ **Aucun générateur dans cette story.** Elle livre le contrat et le registre ;
      STORY-537 livre le premier pays. Les mêler ferait naître le générateur togolais comme
      référence implicite du contrat, et tous les autres comme des cas particuliers.

## Notes

- Voir [[STORY-525]] (la doctrine), [[STORY-537]], [[STORY-538]], [[STORY-539]], [[STORY-492]].

## Cadrage confronté au code (2026-09-19)

- `fiscal-service` sait déjà vérifier le SHA-256 d'un paquet fiscal privé (STORY-297), mais ne
  possède ni paquet de dépôt ni registre correspondant. Le nouveau contrat reprend la séparation
  manifeste/artefact/empreinte ; il ne copie aucun gabarit fiscal réel dans le code.
- `dossier-service` possède le registre de pays de STORY-492. Son statut actuel décrit la
  comptabilité et la fiscalité, **pas** le dépôt ; cette story y ajoute une capacité de dépôt
  distincte, déduite des seuls paquets réellement présents.
- STORY-537 est propriétaire de la première instance togolaise. **Aucun paquet actif n'est semé
  ici** : la route de lecture répond par un refus nommé pour un couple absent et le registre pays
  annonce `non-servi` pour le dépôt. Les fixtures de test ne sont pas des pays servis.
- AC-3 fixe le **contrat obligatoire** de provenance `(pays, etat, version, checksum)` que tout
  dépôt produit devra porter. La création et la transmission d'un dépôt réel restent aux stories
  537/538 ; déclarer un dépôt effectivement généré dans 536 contredirait AC-6.
- Le contrat couvre les trois verticaux sans introduire de générateur ni de copie de paquet chez
  les consommateurs. STORY-509 consommera ce contrat après son propre jalon `format confirmé`.

## Tâches

- [x] T1 — Définir un schéma de paquet de dépôt et la référence de format obligatoire du dépôt
  produit, avec provenance et liste fermée des champs, sans format pays en dur.
- [x] T2 — Construire le registre de paquets `(pays, etat, version)`, la validation de chaque
  correspondance poste → case avec source non vide, et la garde build d'intégrité des octets.
- [x] T3 — Exposer le paquet actif et sa provenance via une route authentifiée ; refus nommé et
  aucun contenu pour un couple absent, ambigu, invalide ou altéré.
- [x] T4 — Ajouter au registre `dossier-service` une capacité de dépôt distincte, dérivée des
  paquets actifs, sans changer l'éligibilité comptable/fiscale des pays.
- [x] T5 — Prouver les mutations des gardes, les portes complètes des dépôts touchés et le
  comportement Docker sur stack neuve, puis revues de code et de sécurité.

## Definition of Done

- [x] Aucun paquet pays semé ni générateur, aucun pays déclaré servi pour le dépôt sans artefact.
- [x] Une case sans référence source, un checksum faux et une identité pays/état incohérente
  font échouer leurs témoins ; une mutation de chaque garde rend ces tests rouges.
- [x] eslint, build, test:cov et test:e2e verts pour chaque service modifié ; vérification Docker
  consignée sans revendiquer un dépôt réel non livré.
- [x] PR des services sur `dev` et de la documentation sur `main`, revues Codex, rebase-merge,
  statut synchronisé aux trois emplacements et `completed_date`.

## Progress Tracking

**Statut : `done` (2026-09-19).** PR `prospera-fiscal-service` **#5** (commit `4f97f7d` + revue
`b0c8e45`) puis `prospera-dossier-service` **#31** (`8d86032` + revue `7cfe86a`) rebase-mergées sur
`dev` **dans cet ordre**, branches supprimées. La garde de cohérence a été rejouée sur `dev` avec
les deux dépôts à jour : **15 tests verts**.

### Ce qui est livré

| Dépôt | Livrable |
|---|---|
| `fiscal-service` | Contrat du paquet (`src/domain/`, sans framework) · registre manifeste + artefacts vérifiés SHA-256 · garde `prebuild` · route `GET /api/v1/paquets-depot/:pays/:etat` |
| `dossier-service` | `StatutDepotPays` + `CapaciteDepotPays` au registre des pays · miroir `PAQUETS_DEPOT_PACKAGES` · garde de cohérence croisée avec le manifeste réel de `fiscal-service` |

⛔ **Le manifeste part vide, et c'est le livrable** (AC-4/AC-6) : aucun pays n'est servi pour le
dépôt, aucun générateur n'est écrit. STORY-537 est propriétaire de la première instance togolaise.

### Portes de qualité

| Dépôt | Lint | Build | Unitaires | Couverture (seuils 65/90/90/90) | e2e |
|---|---|---|---|---|---|
| `fiscal-service` | 0 warning | OK | 462 verts | **98,54 / 94,17 / 96,73 / 98,87** | 28 verts |
| `dossier-service` | 0 warning | OK | 1 373 verts | **99,44 / 94,85 / 98,06 / 99,47** | 304 verts |

### Table de mutations — chaque garde abîmée rend des tests ROUGES

⚠️ Trois mutations écrites d'abord **ne compilaient pas** (`M3`, `M7`, `M8`) : une mutation qui ne
compile pas vaut « 0 test », jamais un rouge. Elles ont été réécrites pour compiler avant d'être
retenues.

| # | Garde abîmée | Résultat |
|---|---|---|
| M1 | la source d'une case du gabarit n'est plus exigée | 🔴 3 tests |
| M2 | deux postes peuvent écrire la même case | 🔴 1 test |
| M3 | la comparaison de checksum est neutralisée | 🔴 2 tests |
| M4 | l'identité (pays, état, version) n'est plus confrontée au manifeste | 🔴 3 tests |
| M5 | deux paquets actifs du même couple sont acceptés | 🔴 1 test |
| M6 | le motif du `locator` n'est plus appliqué | 🔴 3 tests |
| M7 | la route perd `@RequiresFiscalAccess()` (décorateur **et** import) | 🔴 1 test |
| M8 | le refus du couple absent est retiré | 🔴 1 unitaire + 1 e2e |
| M9 | le statut de dépôt est recopié du statut comptable/fiscal | 🔴 6 tests |
| M10 | le filtre par pays des paquets de dépôt est retiré | 🔴 2 tests |
| M11 | le miroir déclare un paquet qu'aucun artefact ne porte | 🔴 4 tests |
| M12 | les 9 refus du registre basculent en `REGLE_METIER` (422 au lieu de 502) | 🔴 25 tests |
| M13 | la clé d'ambiguïté est élargie à la version | 🔴 1 test |
| M14 | le filtre `actif` de `trouver()` est retiré | 🔴 5 tests |

⚠️ M12, M13 et M14 **n'existaient pas** avant la revue : ce sont trois gardes correctes que *rien*
ne faisait rougir. Et ma première écriture de M12 était fausse — elle ajoutait une valeur par
défaut que les neuf appels surchargeaient, donc elle ne changeait rien. Une mutation qui ne mord
pas est aussi trompeuse qu'un test qui ne filtre pas.

### Vérification Docker — stack NEUVE (`down -v` puis rebuild)

Services `mongo`, `mongo-fiscal` (rs-fiscal), `kafka`, `redis`, `auth-service`, `fiscal-service`,
`dossier-service`. Jeton **réel** d'un cabinet inscrit via l'IdP (`register` → vérification e-mail
par le lien Mailhog → `login`), read-models semés **selon leurs schémas**.

⚠️ Piège payé au passage : le read-model KYC de `dossier-service` s'appelle **`orgkycstatuses`**
(pluriel Mongoose), pas `org_kyc_status` — écrire dans le mauvais nom crée une collection fantôme
et le service continue de refuser, sans la moindre erreur.

| Ce qui est mesuré | Résultat |
|---|---|
| `/api/v1/health` des deux services | `ok` (mongo, mongo-audit, kafka, redis `up`) |
| route de dépôt sans jeton | `401` |
| entitlement fiscal révoqué | `403 FISCAL_NOT_ENTITLED`, aucun contenu |
| KYC non approuvé | `403 KYC_NOT_APPROVED`, aucun contenu |
| couple non packagé, jeton habilité | `422 PAQUET_DEPOT_NON_PUBLIE`, aucun contenu |
| `pays` en minuscules · tentative `..%2F..%2F` | `400` au bord HTTP |
| `GET /api/v1/pays` | **23 pays, tous `depot: non-servi`, aucun état déposable** |
| ⚡ **le Togo** | `statut: servi` (liasse) **et** `depot: non-servi` — AC-4 mesuré, pas supposé |
| manifeste embarqué dans l'image | `{"paquets": []}` |
| OpenAPI | route publiée avec `200/403/422/502` |

**La garde de build fait bien échouer `docker build`**, prouvé deux fois sur l'étape `build` :

1. checksum annoncé faux → `RefusMetier: L'empreinte du paquet de dépôt ne correspond pas au
   manifeste.` → `exit code: 1` ;
2. checksum **exact** mais case `A1` sans source → `RefusMetier: La structure du paquet de dépôt
   est invalide : gabarit[0] : champs invalides — manquants source.` → `exit code: 1`.

⛔ **Aucun dépôt réel n'est revendiqué** : cette story ne produit aucun fichier déposable, et la
vérification ci-dessus ne prétend pas le contraire.

### Revues ⑥ et ⑦

**Revue de sécurité : aucune vulnérabilité de confiance ≥ 80.** Sept axes éprouvés — traversée de
chemin, fuite d'information dans les corps d'erreur, anti-énumération, déni de service, intégrité
de l'artefact, chaîne de gardes, validation d'entrée. Deux points établis qui méritaient de
l'être : `pays`/`etat` ne construisent **aucun** chemin (ils ne servent que de clé d'égalité pour
sélectionner une entrée du manifeste), et la mémorisation est **bornée par le manifeste**, non par
les appels — sa clé dérive d'une entrée du manifeste, jamais de la requête.

**Revue de code : aucun constat bloquant, six non-bloquants**, dont quatre mesurés par mutation.
Tous corrigés, tous sur le même angle — *une garde correcte, qu'aucun test ne faisait rougir* :

| # | Ce que la mutation révélait | Correctif |
|---|---|---|
| ① | basculer les 9 refus en `REGLE_METIER` laissait **71 unit + 12 e2e verts** — un artefact corrompu aurait répondu `422`, indiscernable d'un couple non publié | le témoin rend la `nature` et non le seul `code` |
| ② | la fixture d'ambiguïté passait **deux fois la même entrée** : élargir la clé à la version restait vert | deux **versions** distinctes, toutes deux actives |
| ③ | l'entrée active étant en tête, retirer `candidat.actif &&` laissait vert le test nommé « ne sert jamais la version archivée » — il prouvait « sert la première entrée » | l'archive passe en tête, comme dans un manifeste réel |
| ④ | retirer `PaquetsDepotModule` d'`AppModule` laissait **456 unit + 28 e2e verts** pendant que le service répondait `404` | invariant sur le vrai module racine (leçon STORY-497) |
| ⑤ | `binaire.length === 0` **inatteignable**, subsumée par le contrôle canonique — et Istanbul annonçait 100 % de branches dessus, parce qu'il compte l'*évaluation* des opérandes d'un `\|\|`, pas leur issue | clause retirée |
| ⑥ | `fiscal-service` fondu dans le drapeau `presents` faisait sauter **toute** la batterie AC-5 de STORY-492 si seul ce dépôt manquait | deux drapeaux distincts, chacun nommant ce qui lui manque |

**Durcissements retenus** (constats de sécurité sous le seuil) : le gate `@RequiresFiscalAccess()`
passe au niveau de la **classe** — une route ajoutée demain naît gardée ; et l'e2e monte les
**mêmes** options de `ValidationPipe` que `main.ts`, `enableImplicitConversion` compris.

**Supprimé** : `couplesActifs`, sans aucun appelant en production — `dossier-service` relit le
manifeste directement, un appel cross-service violerait l'invariant d'archi n° 2.

**Écarté, mesure à l'appui** : porter le socle `ArtefactLoader` de `balance-service` /
`microfinance-service` exigerait d'importer **264 lignes** d'infrastructure absente de
`fiscal-service` (le socle, le port `ArtifactSource`, une seconde taxonomie d'erreurs), plus une
couche de conversion vers `RefusMetier` et un passage en asynchrone — pour remplacer ~60 lignes qui
suivent l'idiome déjà en place ici (`PaquetsService`, STORY-297).

⚠️ **Vérification docker REJOUÉE sur l'état final**, image reconstruite (et non hot-reload) : le
gate hissé au niveau classe change le comportement d'exécution de la route. `401` sans jeton,
`403 FISCAL_NOT_ENTITLED`, `403 KYC_NOT_APPROVED`, `422 PAQUET_DEPOT_NON_PUBLIE`, `400` sur
paramètre mal formé et sur traversée — identiques.

⛔ **Ordre d'intégration imposé** : la PR `fiscal-service` **avant** celle de `dossier-service`. La
garde de cohérence de `dossier-service` lit le manifeste de `fiscal-service` ; dans l'ordre
inverse, tout poste ayant les deux dépôts côte à côte sur `dev` aurait `dossier-service` rouge
jusqu'au second merge.

### À acter dans le cadrage de STORY-537

L'alphabet d'`etat` (`^[A-Z][A-Z0-9-]{1,39}$`, identique dans le DTO, le manifeste et le contrat)
n'accepte ni espace ni minuscule : deux des exemples que cite cette story — « DIMF 2000 »,
« C-xx CIMA » — devront être **codifiés** (`DIMF-2000`, `C-11`). Ce n'est pas un défaut ici, c'est
une décision de nommage qui appartient à la story qui livre la première instance.

### Deux gardes ajoutées au-delà de l'énoncé strict

- **Une case ne peut être alimentée que par un poste.** Deux postes visant `A1` laisseraient le
  second écraser le premier en silence — c'est exactement la « case décalée » qu'AC-2 nomme, celle
  qui franchit tous les contrôles internes et n'est refusée qu'au guichet. L'inverse reste permis :
  un même poste alimente légitimement un détail et son total.
- **`locator` contraint à un nom de fichier simple** : il est concaténé au répertoire privé des
  assets, et tout ce qui ressemble à `../` meurt avant d'atteindre `join`.

### Ce que la reprise a corrigé dans le travail partiel trouvé sur la branche

Le contrat avait été enrichi (schéma machine, calendrier structuré, pénalités chiffrées) **sans que
les specs suivent** : 4 tests rouges, et surtout un test **vert pour la mauvaise raison** — il
annonçait garder la source d'une case et virait au vert sur un `toThrow('Champs invalides')`
générique que la forme du *schéma* produisait. Les messages du validateur portent désormais leur
chemin (`gabarit[0] : champs invalides — manquants source`), et chaque cas de test nomme le champ
qu'il éprouve.
