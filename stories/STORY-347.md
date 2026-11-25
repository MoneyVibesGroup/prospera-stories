# STORY-347 : Saisie manuelle de la base de rémunération

Status: done (2026-11-25 — prospera-fiscal-service#65, `dev` 4a1d938 ; lot 7 de D, n° 3)

**Épic :** EPIC-034 — Base de rémunération et obligations sociales
**Points :** 3 · **Service :** `fiscal-service` (`:3012`), dossier de D `modules/remuneration` (D-L7-1)
**FR :** `FR-F28` (la saisie, pour le dossier sans outil de paie, aboutit à la même base que l'import)
**Décision :** **AD-20** (import et saisie au même chemin, l'idempotence par le document) · **AD-21** (minimisation)
— `architecture-fiscal-service-2026-08-03`
**Dépend de :** **STORY-345** ✅ (#42, `d9a7ae2` : l'agrégat, la route de saisie, la provenance par version) ·
**STORY-346** ✅ (#64, `e4630f1` : l'import, l'écriture unique `ecrire`).
**Débloque :** STORY-348 (le calcul lit la base avec son origine).

**Critères de l'épic** (`epics-fiscalite-2026-08-03.md`, STORY-347) — *en tant que collaborateur de cabinet dont le
client n'a pas d'outil de paie, je veux saisir les rémunérations, afin que ce dossier ne soit pas exclu du calcul
social.*

---

## Ce qui existe déjà, et ce que cette story livre

Relu avant d'écrire la fiche (`stories/STORY-345.md`, `stories/STORY-346.md`, le code de `dev` `e4630f1`) :

| Déjà là | Par |
|---|---|
| La route de saisie `PUT /api/v1/dossiers/{dossierId}/remuneration/{periode}` (base complète, `PREPARER`, 201 `CREEE` / 200 `INCHANGEE`, `forbidNonWhitelisted`) | 345 |
| La validation d'une ligne (`validerLigne`) et d'une base (`validerBase`), sans type par défaut | 345, 346 |
| **L'écriture unique** `RemunerationService.ecrire` : la saisie (`constituer`, `SAISIE`) et l'import (`importer`, `IMPORT`) n'en diffèrent que par la provenance ; le document canonique et son empreinte excluent la provenance | 345, 346 |
| La **provenance par version** (`VersionDeBase.provenance`), servie par le détail (`version`, `versions[]`), les totaux et la trace `BASE_REMUNERATION_CONSTITUEE` | 345 |
| La preuve sur MongoDB que la saisie puis l'import du même contenu ⇒ `INCHANGEE` | 346 (conformité) |

**Il n'y a donc pas de seconde route de saisie à écrire.** Ce qui manque, et que 347 livre :

1. **La saisie n'a aucune preuve HTTP** : 345 n'a pas écrit d'e2e de la route `PUT` (seul l'import en a un, 346). La
   saisie est jouée de bout en bout (gardes, 201 / 200, refus, version antérieure lisible), et l'égalité avec l'import
   l'est **dans les deux sens** (import puis saisie, saisie puis import) par la route, pas seulement par le service.
2. **Un écart « à l'identique » non couvert** : le même nom écrit dans un écran et dans un tableur peut arriver en deux
   suites d'octets (un « é » composé ou décomposé, Unicode NFC ou NFD) ; les deux chemins le gardaient tel quel, donc
   deux documents et une version de plus pour un contenu identique à l'œil (D-347-2).
3. **L'origine qui alimente un calcul** (critère 2) : aucun calcul n'existe encore (348). La base est mise à la
   disposition du calcul par une lecture qui ne rend **jamais des lignes sans leur origine** (D-347-4).

## Critères d'acceptation

- **Étant donné** un dossier sans fichier de paie **quand** je saisis les rémunérations **alors** la base est
  constituée à l'identique de celle issue d'un import : même document, même empreinte ; la saisie du contenu d'un
  import déjà là rend 200 `INCHANGEE`, et l'inverse aussi.
- **Étant donné** un nom saisi en Unicode décomposé (NFD) et le même nom importé en composé (NFC) **quand** la base
  est constituée **alors** c'est le même document (200 `INCHANGEE`).
- **Étant donné** une base saisie **quand** elle alimente un calcul **alors** son origine est tracée : le calcul la
  reçoit avec `origine { dossierId, periode, version, provenance, empreinte, constitueeLe }`, et la version demandée
  rend sa propre provenance (une base importée en version 1 et corrigée par saisie en version 2 rend `IMPORT` pour la
  1 et `SAISIE` pour la 2).
- **Étant donné** une base saisie **quand** elle est lue par HTTP **alors** la provenance est servie par le détail
  (`version`, `versions[]`) et par les totaux.
- ⛔ **Étant donné** une ligne saisie sans `typeBeneficiaire` **quand** elle est soumise **alors** 422
  `TYPE_BENEFICIAIRE_ABSENT`, rien n'est écrit (FR-F79, comme 345 et 346).
- ⛔ **Étant donné** un champ hors contrat dans la saisie (un NIF, un numéro CNSS) **quand** elle est soumise **alors**
  400, rien n'est écrit (AD-21).

## Décisions (contestables ; appliquées par défaut, `REGLES-DES-GROUPES.md` §1.2)

- **D-347-1 — Pas de route de saisie neuve.** La route `PUT` de 345 est la saisie ; elle passe déjà par l'écriture
  unique de 346. Une seconde route (ligne à ligne, brouillon) ferait un second chemin d'écriture, ce qu'AD-20 interdit.
- **D-347-2 — La désignation est mise en forme NFC** dans `validerLigne`, donc pour les deux chemins, avant le
  document et l'empreinte. NFC est l'équivalence canonique d'Unicode : deux suites qui s'affichent pareil deviennent la
  même. Rien d'autre n'est réécrit (ni la casse, ni les espaces intérieures : deux noms qui diffèrent à l'œil restent
  deux noms). La référence `beneficiaireId` est en ASCII (`FORMAT_BENEFICIAIRE`) et n'en a pas besoin. *Effet de
  bord :* une base de `dev` dont une désignation aurait été écrite en NFD donnerait une version de plus à sa prochaine
  soumission identique ; aucune donnée réelle n'existe.
- **D-347-3 — La saisie reste stricte sur la forme.** Le type s'écrit exactement `SALARIE`, `DIRIGEANT` ou `ASSOCIE`
  (l'énumération du contrat), la référence sans espace autour. La tolérance de l'import (casse du type, cellule rognée,
  D-346-9) est celle d'une cellule de tableur écrite à la main, pas celle de la règle : l'écran propose une liste. Les
  deux chemins refusent ce qu'ils ne reconnaissent pas et rendent le même document pour le même contenu.
- **D-347-4 — L'origine qui alimente un calcul.** `RemunerationService.baseDuCalcul(acteur, dossierId, periode,
  version?)` rend `{ origine, lignes }`, où `origine = origineDe(version)` (domaine) :
  `{ dossierId, periode, version, provenance, empreinte, constitueeLe }`. Mêmes gardes que le détail (dossier dans la
  portée, sinon 404 ; `BASE_INTROUVABLE`). **STORY-348 lira la base par là** et recopiera `origine` dans son résultat
  et sa trace : c'est la version qui fait foi (« une déclaration cite la version qui l'a produite », 345). Pas de route
  neuve : le calcul vit dans le service. `constitueePar` n'y entre pas (le calcul n'en a pas l'usage, AD-21).
- **D-347-5 — L'origine est celle du contenu, pas du dernier geste.** Une saisie qui égale la dernière version importée
  rend 200 `INCHANGEE` avec la version existante (`provenance: IMPORT`) ; rien n'est écrit ni tracé (D-346-6). Le
  calcul cite donc l'import, qui a constitué ce document.
- **D-347-6 — Pas de saisie ligne à ligne ni de brouillon serveur** (D-345-3 : une version est la base complète).
  L'écran (A) part de `GET …/remuneration/{periode}` (la dernière version), la modifie et renvoie la base entière.

## Contrat

**Aucun changement.** Aucune route, aucun champ, aucun code de refus neuf ; aucun topic, schéma de fait ni manifeste.
`baseDuCalcul` est une lecture interne au service. La mise en forme NFC (D-347-2) ne change pas la forme de la réponse :
la désignation reste un texte libre de 120 caractères au plus.

## Fichiers communs touchés (D-L7-2)

**Aucun** : ni `app.module.ts`, ni le contrat OpenAPI (aucun décorateur ne change), ni `package.json`, ni migration,
ni `read-models/`, ni copie du paquet, ni manifeste `declarations`. Tout est dans les dossiers de D (`remuneration`) et
leurs tests.

## Ce que cette story ne fait PAS

- ⛔ Elle ne calcule rien (STORY-348) : elle prépare la lecture que le calcul emploiera.
- ⛔ Elle n'ajoute ni route de saisie, ni brouillon, ni écran (→ A : l'écran de saisie, plus tard).
- ⛔ Elle ne change pas l'import (346), sauf par la règle commune `validerLigne` (NFC).

## Definition of Done

- [x] Domaine : la désignation NFC (un nom NFD et le même en NFC ⇒ même ligne, même empreinte) ; `origineDe`.
- [x] Service : `baseDuCalcul` (dernière version, version demandée, `BASE_INTROUVABLE`, hors portée) ; import puis
      saisie du même contenu ⇒ `INCHANGEE`, l'origine reste `IMPORT`.
- [x] e2e de la saisie (Node 24) : gardes ; 201 `SAISIE`, 200 pour le même contenu dans un autre ordre, 201 version 2,
      la 1 lisible ; 422 sans type ; 400 sur un champ hors contrat ; parité avec l'import dans les deux sens et en NFD ;
      la provenance au détail et aux totaux.
- [x] Conformité sur `mongo-fiscal` (jeu de répliques) : import puis saisie du même contenu ⇒ une version ; saisie
      corrigée ⇒ version 2 `SAISIE`, `baseDuCalcul` rend `IMPORT` pour la 1 et `SAISIE` pour la 2, avec l'empreinte
      de l'en-tête enregistré.
- [x] **Mutations** (sur l'assertion) : NFC retiré ; provenance de la saisie écrite `IMPORT` ; origine à provenance
      constante ; version demandée ignorée ; provenance entrée dans l'empreinte.
- [x] Lint des fichiers touchés, `tsc`, build. Pas de `docker compose up` (§1.5 : aucun module, aucune dépendance,
      aucun Dockerfile ne change).

---

## Livré (2026-11-25) — prospera-fiscal-service#65, `dev` 4a1d938

**Aucun écart à la fiche**, aucun contrat ni fichier commun touché.

- **Domaine** `domain/remuneration/ligne-de-remuneration.ts` : `designationDe` (rognée, NFC), employée par la
  validation de la longueur et par la ligne validée ; `OrigineDeBase` et `origineDe(version)`.
- **Application** : `RemunerationService.baseDuCalcul(acteur, dossierId, periode, version?)` ⇒ `BaseDuCalcul
  { origine, lignes }` (dossier dans la portée, `BASE_INTROUVABLE`).
- **Tests** : domaine +4 (NFC : même document, ni casse ni espaces réécrites, longueur en NFC ; `origineDe`) ;
  service +3 (import puis saisie ⇒ `INCHANGEE` et l'origine reste `IMPORT` ; `baseDuCalcul` version 1 `IMPORT` /
  version 2 `SAISIE` ; refus) ; e2e +8 (le bloc « la saisie (STORY-347) » de `test/remuneration-import.e2e-spec.ts`) ;
  conformité +1 (`import-paie.conformite-spec.ts`).

## Preuves

- **Node 24** (étage `verification`, archive LF de `ff516f8`) : unitaires **200/200 suites, 2 870 tests (1 ignoré)** ; e2e **13/13 suites, 261 tests** ;
  **`test:conformite` 18/18 suites, 115 tests** sur `mongo-fiscal` en jeu de répliques (dont le cas 347 : import puis saisie NFD ⇒ une
  version, deux lignes ; corrigée ⇒ version 2 ; `baseDuCalcul` ⇒ `IMPORT` pour la 1, `SAISIE` pour la 2, empreintes
  égales à celles des en-têtes enregistrés ; chaîne d'audit `[1, IMPORT]`, `[2, SAISIE]`, intacte).
- **Node 25** (local) : domaine et service 95/95 ; e2e de la base 19/19 (import 11, saisie 8).
- **Mutations 7/7 tuées** (Node 25, sur l'assertion, jamais une compilation) : NFC retiré (domaine 2 rouges ; e2e NFD
  1 rouge) ; saisie écrite `IMPORT` par le contrôleur (e2e 3) ; origine à provenance constante (domaine 1, service 1) ;
  version demandée ignorée par `baseDuCalcul` (service 1) ; portée non vérifiée par `baseDuCalcul` (service 1) ;
  provenance entrée dans l'empreinte (service 3, e2e 3).
- Lint des fichiers touchés 0 ; `tsc` 0 ; `nest build` 0. Pas de `docker compose up` (§1.5 : aucun module, aucune
  dépendance, aucun Dockerfile ne change).
- Verrou Docker : pris à 22:08 (une seule passe : unitaires, e2e, conformité), rendu à 22:13 par le trap du script autonome ; B et C prévenus ; aucun conteneur, volume ni réseau grp-d.

## Ce qui reste (nommé, hors de cette story)

- **STORY-348** lit la base par `baseDuCalcul` et recopie `origine` dans son résultat et sa trace (D-347-4). Elle
  attend **STORY-564** de C (le barème IRPP au paquet).
- **→ A** (écran du cabinet, plus tard) : l'écran de saisie part de `GET …/remuneration/{periode}` et renvoie la base
  entière (D-347-6) ; il propose les types par une liste (D-347-3).
