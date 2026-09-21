# STORY-520 : La réassurance se modélise à la cession — pas en correction finale

Status: in_progress

**Complexité :** high

**Épic :** EPIC-132 — Réassurance ⚠️ **PALIER 2**
**Service :** `assurance-service` + référentiel `cima-assurances`
**Points :** 13 · **Sprint :** S20
**Prérequis :** **STORY-513** (contrats et quittances) · **STORY-515** (registre des sinistres) ·
**STORY-517** (provisions hébergées, `partDesReassureurs`) · **STORY-518** (`RT` est un écart de provisions)
**Origine :** découpage `epics-assurance-2026-08-27.md`, **AD-4** de la spine. Réservée explicitement
par le *Hors périmètre* de STORY-518 — « la part des réassureurs dans les prestations au CR ».

---

## Le fait

La réassurance est **omniprésente** dans le plan CIMA, et l'artefact packagé le montre à moitié :

- `CA2` existe à l'actif — *« Part des cessionnaires et rétrocessionnaires dans les provisions
  techniques »* ;
- `RP3` existe en produit — *« Commissions et participations reçues des réassureurs »* ;
- `RV2` est entré au compte de résultat avec `@2.0` — *variation* de `CA2` ;
- ⛔ **et rien ne distingue, au compte de résultat, les primes cédées ni la part des réassureurs
  dans les sinistres.**

⇒ Le résultat technique actuel est un **résultat brut de réassurance**, présenté sans le dire. Pour
un assureur qui cède 40 % de son portefeuille, l'écart n'est pas une nuance : c'est presque la
moitié du compte.

⚡ **AD-4 est une décision d'ordre, pas de contenu :** la réassurance traverse primes, sinistres,
provisions et commissions. La modéliser **à la cession** — c'est-à-dire au moment où l'affaire est
cédée — coûte une story ; l'ajouter après en correction oblige à reprendre les quatre.

## Cadrage mesuré avant de coder (2026-09-21)

Sources dépouillées : **art. 431** (liste des comptes) et **art. 432** (terminologie explicative,
« 80. Exploitation générale ») du Code CIMA, pages officielles `cima-afrique.org` ; **art. 334-11**
(compensation interdite) ; **art. 308** (cessions hors zone CIMA) ; le code des cinq modules
existants d'`assurance-service` ; les octets de `cima-assurances@2.0`.

### M1 — ⚡⚡ Les deux comptes EXISTENT, et le compte de résultat les COMPENSE aujourd'hui, en silence

La rédaction initiale de cette story écrivait « il n'y a **RIEN** au compte de résultat pour les
primes cédées ni pour la part des réassureurs dans les sinistres ». **C'est faux, et ce qui est vrai
est pire.** L'article 431 porte les deux comptes, nommément :

> `609.` **Part des réassureurs dans les prestations et frais**
> `709.` **Part des réassureurs dans les primes**

et l'article 432 les désigne comme les **cessions** des postes du compte 80 :

> « Prestations et frais payés : 602, 604, 605, 606, 6902, 6904, 6905 et **(cessions) 609, 6909.** »
> « Primes : 702, 704, 705, 706, 7902, 7904, 7905 et **(cessions) 709, 7909.** »

⛔ **Or le plan packagé s'arrête à 2 chiffres.** La résolution au **plus long préfixe** rabat donc
`609` sur `60` — c'est-à-dire sur `RC1` — et `709` sur `70` — c'est-à-dire sur `RP1`. Le compte de
résultat servi aujourd'hui **n'omet pas** les cessions : il les **compense**. `RP1` « Primes ou
cotisations » est déjà **net** de réassurance, `RC1` « Charges de prestations » est déjà **net** de
la part des réassureurs, et **aucun libellé ne le dit**.

⚡ Une omission se voit ; une compensation ne se voit pas. C'est très exactement ce que l'**AC-4**
interdit, et ce que l'**art. 334-11** verrouille au bilan.

### M2 — ⛔ La séparation EXIGE que le plan descende sous deux chiffres — pour exactement deux comptes

STORY-518 avait pu séparer le brut (`CP3`) des cessions (`CA2`) **parce que `39` est une racine à
2 chiffres**. Au compte de résultat, les comptes de cession sont à **3 chiffres**. À 2 chiffres,
l'AC-4 n'est pas « difficile » : elle est **impossible**, et tout poste ajouté serait décoratif.

⇒ Le plan de `@3.0` gagne **exactement deux comptes**, `609` et `709`, libellés **verbatim de
l'art. 431**. Ce n'est pas la transcription du plan (**STORY-671**, 972 comptes) : ce sont les deux
comptes que l'art. 432 nomme lui-même « (cessions) » pour les deux postes du compte 80 que cette
story sépare.

### M3 — ⚠️ `7909` est cité par l'art. 432 et **absent** de l'art. 431 — les cessions « étranger » restent dehors

Même contradiction que **D-518-7** (six comptes cités par le 432 et absents du 431). Mesuré le
2026-09-21 : `609`, `709`, `6091`, `6092`, `6094`, `6095`, `7091`, `7092`, `7094`, `7095` sont bien
énumérés à l'art. 431 ; **`7909` ne l'est pas**, et la classe `790` n'y est pas développée du tout.

Et ce serait de toute façon incohérent : `69` (« Charges par nature à l'étranger ») et `79`
(« Produits par nature à l'étranger ») **ne sont rattachés à aucun poste** de la table de passage,
dans `@1.0` comme dans `@2.0`. Rattacher `6909` sans rattacher `69` accrocherait un fragment d'une
classe dont le tout est libre. ⇒ Les cessions « étranger » sont **nommées et laissées dehors**,
avec la lacune de rattachement de `69`/`79` qu'elles révèlent.

### M4 — ⛔⛔ `RN` doit recevoir les deux nouveaux postes, sinon l'égalité terminale casse EN SILENCE

**D-518-5** l'a établi : `RN` est le poste **terminal**, confronté à `Σ_CR (crédit − débit)` par
`coherenceSig`, dont dépendent le contrôle `COHERENCE_RESULTAT` et l'articulation
`RN == bilan.controle.resultatNetN`.

Extraire `709` de l'assiette de `RP1` et `609` de celle de `RC1` **laisse la somme inchangée** — à
la seule condition que `RN` énumère les deux nouveaux postes avec le **bon signe**. Les oublier ne
produirait aucune erreur : cela ferait passer **tout** dossier CIMA en `ANOMALIE` sur une balance
pourtant juste, exactement comme la variation l'aurait fait en STORY-518.

### M5 — ⚡ Le signe des deux postes n'est pas choisi : il vient du plan

`709` est un compte de **produit** qui se **débite** (la prime cédée diminue la prime) ; `609` est un
compte de **charge** qui se **crédite** (la part du réassureur diminue la prestation). Sous les
règles `PRODUIT` et `CHARGE` du référentiel, les deux ressortent donc **négatifs**.

⇒ Au `RT` : `+RP6` (un produit négatif = la charge de cession) et `−RC9` (une charge négative
retranchée = l'atténuation). **Aucun signe inversé à la main** : le sens vient du compte, et un test
doit l'exercer sur une balance où les deux comptes sont mouvementés dans leur sens réel.

### M6 — ⛔ Ce service ne peut dériver que le **proportionnel** — et il doit le dire au lieu de l'inventer

L'AC-2 demande des primes cédées « dérivées des quittances selon le traité ». Mesuré dans le code :

- `Contrat` ne porte **aucun capital assuré**, et rien ne porte de plein. ⇒ pour un **excédent de
  plein**, le taux de cession se calcule risque par risque sur `(capital − plein) / capital` :
  la donnée est **absente de ce service**.
- Pour un **excédent de sinistre**, la prime cédée est **contractuelle** (négociée sur l'assiette de
  l'exercice), elle ne se dérive **pas** d'une quittance. Sa part de sinistres, elle, se dérive :
  c'est la tranche comprise entre la **priorité** et la **portée**.
- Seule la **quote-part** est dérivable de bout en bout : un taux, la même part sur toutes les
  primes et tous les sinistres.

⇒ Le module **déclare** ce qu'il dérive et ce qu'il ne dérive pas, par type de traité, avec sa
raison — le patron du `catalogue-des-methodes` de STORY-519, qui existe déjà trois fichiers plus
loin. ⛔ **Un taux inventé pour un excédent de plein serait un chiffre faux publié comme juste.**

### M7 — ⚠️ L'art. 308 borne les cessions hors zone CIMA, et ce module n'a pas la donnée

L'article 308 (réformé en 2016) plafonne les cessions **hors zone CIMA** par branche, en interdit
certaines entièrement, et soumet à autorisation ministérielle toute cession de plus de 50 % d'un
risque situé dans un État membre. Ce module ne porte **ni la branche au sens de l'art. 328, ni le
territoire du réassureur** : la règle est **nommée et laissée dehors**, comme la rétrocession
(AC-6), plutôt que passée sous silence.

## Décisions de cadrage du 2026-09-21

| # | Décision | Pourquoi |
|---|---|---|
| **D-520-1** | Le plan de `cima-assurances@3.0` gagne **exactement deux comptes** — `609` et `709`, libellés verbatim de l'art. 431 | **Mesuré (M1/M2)** : à 2 chiffres, l'AC-4 est impossible et tout poste ajouté serait décoratif. Ce n'est pas la transcription du plan (**STORY-671**) : ce sont les deux comptes que l'art. 432 nomme « (cessions) » |
| **D-520-2** | Deux postes de **détail** au `COMPTE_RESULTAT` : `RP6` « Part des réassureurs dans les primes » (`PRODUIT` ← `709`) et `RC9` « Part des réassureurs dans les prestations et frais » (`CHARGE` ← `609`). **Aucun poste « net »** | AC-4. Le net est une **présentation**, jamais un stockage — art. 334-11. Deux postes rendent la compensation **impossible**, pas seulement interdite |
| **D-520-3** | `RT` gagne `+RP6 −RC9` ; **`RN` aussi** | **Mesuré (M4)** : `RN` est confronté à `Σ_CR (crédit − débit)`. L'oubli ne lèverait rien et passerait tout dossier en `ANOMALIE` |
| **D-520-4** | `RP1` et `RC1` **nomment désormais leur caractère brut** — « (brutes de cessions) » / « (brutes de la part des réassureurs) » | Sans cela, le **même libellé** désignerait une assiette **nette** en `@2.0` et **brute** en `@3.0`. C'est le défaut que le libellé de `RT` évitait déjà en `@1.0` |
| **D-520-5** | Les cessions **« étranger »** (`6909`, `7909`) restent dehors, et la lacune de rattachement de `69`/`79` qu'elles révèlent est **consignée** | **Mesuré (M3)** : `7909` est cité par le 432 et absent du 431 ; `69`/`79` ne sont rattachés à **aucun** poste. Matière pour **STORY-671** / **STORY-522** |
| **D-520-6** | Le **traité** est **append-only** et sa période fait foi : une cession se dérive du traité **en vigueur à la date de la quittance ou du sinistre**, jamais du dernier enregistré | Leçon [[story-502-nouvelle-version-efface-le-retard]] et [[story-505-decision-heritee-par-un-reechelonnement-antidate]]. Deux traités du même dossier, de la même catégorie et du **même type** ne peuvent pas se chevaucher — refus |
| **D-520-7** | Le module **déclare** sa capacité de dérivation par type de traité (`catalogue-des-cessions`), et **refuse fail-closed** là où la donnée manque | **Mesuré (M6)**, patron de `catalogue-des-methodes` (STORY-519). AD-12 : on n'invente aucun taux |
| **D-520-8** | `cima-assurances@3.0` devient la version **SERVIE** ; `@1.0` et `@2.0` restent packagées et **intactes** | D-518-6 : un paquet publié non servi est **inerte** ([[story-173-cors-bff-admin]]). ⚠️ `estHabiliteParmi` compare le couple **exact** : l'octroi est à rejouer. **Migration = souci de prod, différé** |
| **D-520-9** | Aucun champ de cession n'est ajouté à `Quittance` ni à `EvenementSinistre` | Les deux sont **append-only** et la cession est **dérivée** (AC-2/AC-3). Un champ stocké se désynchroniserait du traité, et « à la cession » ne veut pas dire « recopié dans la quittance » |

## Périmètre

### Livré

**`assurance-service`** — module `reassurance` :
- Schéma `Traite` (collection `reassurance_traites`), **append-only**, avec garde de
  **non-chevauchement** par `(dossier, catégorie, type)` et index unique de référence.
- `TypeTraite` = `QUOTE_PART | EXCEDENT_DE_PLEIN | EXCEDENT_DE_SINISTRE`, paramètres **discriminés
  par le type** (taux de cession / plein de conservation / priorité + portée), taux de commission,
  réassureurs et leurs parts (somme **exactement** 10 000 points de base).
- `catalogue-des-cessions.ts` — ce que le module dérive, ce qu'il ne dérive pas, et **pourquoi**
  (D-520-7).
- Fichiers purs `cession-de-primes.ts` et `part-des-reassureurs.ts`.
- Routes : `POST` / `GET` des traités, `GET .../methodes` (le catalogue servi), et l'**état des
  cessions** d'un exercice — brut et cédé **côte à côte**, jamais compensés (AC-4).
- Refus dédiés, DTO, inventaire, garde d'exhaustivité.

**`bilan-service`** — `cima-assurances@3.0` :
- Sources `plan-comptable-cima-v3.json`, `postes-cima-v3.json`, `table-de-passage-cima-v3.json`,
  entrée `@3.0` dans `build.mjs`, artefact généré — **`@1.0` et `@2.0` intacts, octet pour octet**.
- `RP6` / `RC9`, `RT` et `RN` amendés (D-520-3), libellés de `RP1` / `RC1` amendés (D-520-4).
- Le test de l'**AC-5** : le résultat technique **brut** et **net de réassurance** sur deux jeux.

**`balance-service`**, **`assurance-service`** — artefact recopié **byte-identique**, manifestes,
digests épinglés, bascule de la version servie (D-520-8).
**`platform-catalog-service`** — snapshot des paquets, pack `assurance-cima → @3.0`.

### Hors périmètre

- ⛔ **La rétrocession** — nommée, jamais traitée (AC-6).
- ⛔ **Les cessions « étranger »** (`6909`, `7909`) et le rattachement de `69`/`79` (D-520-5).
- ⛔ **Les plafonds de l'art. 308** — branche et territoire du réassureur absents du module (M7).
- ⛔ **L'adaptateur de balance AD-5** — réservé par D-511-I à sa propre story : aucun montant calculé
  ici n'atteint la liasse, le câblage reste un **hook inerte documenté**.
- ⛔ **La séparation Vie / Non-Vie** des comptes techniques → **STORY-521**.
- ⛔ **La transcription du plan à 3/4/5 chiffres** → **STORY-671**.
- ⛔ **Les deux contraintes d'inégalité de l'art. 334-11** sur la provision pour risques en cours
  (réserve posée par STORY-519) : elles supposent une **provision cédée**, que cette story ne
  calcule pas.

## Critères d'acceptation

- [ ] AC-1 — Un **traité** de réassurance : type (quote-part, excédent de plein, excédent de
      sinistre), taux ou plein de conservation, commissions, période, réassureurs et leurs parts.
      ⚠️ **Amendé par D-520-6** : append-only, périodes non chevauchantes par `(catégorie, type)` —
      le traité en vigueur à une date doit être **sans ambiguïté**.
- [ ] AC-2 — Les **primes cédées** sont dérivées des quittances selon le traité, et entrent au
      compte de résultat comme **charge de cession** — nouveau poste, nouvelle version du paquet.
      ⚠️ **Amendé par M1/M5** : le poste `RP6` porte le compte `709`, qui est un **produit débité** ;
      la « charge de cession » est ce produit négatif, jamais un poste de classe 6 inventé.
      ⚠️ **Amendé par M6** : dérivable pour la **quote-part** ; pour l'excédent de sinistre la prime
      cédée est **contractuelle** et **saisie** ; pour l'excédent de plein la donnée est **absente de
      ce service** et le module **refuse** au lieu d'inventer.
- [ ] AC-3 — La **part des réassureurs dans les sinistres** est dérivée des sinistres selon le
      traité, et entre en **atténuation** — nouveau poste également (`RC9` ← `609`).
- [ ] AC-4 — ⛔ **Aucune compensation.** Brut et cédé sont publiés séparément partout : au bilan
      (`CP3` brut / `CA2` part des cessionnaires), au compte de résultat, et dans chaque provision
      (STORY-517 AC-5). Une présentation nette est une **présentation**, jamais un stockage.
      ⚡ **Mesuré (M1)** : aujourd'hui `RP1` et `RC1` **compensent** — le critère porte donc autant
      sur ce qu'il faut **extraire** que sur ce qu'il faut ajouter.
- [ ] AC-5 — `RT` intègre les postes de cession (STORY-518), et un test compare le résultat
      **brut** et **net de réassurance** : les deux doivent différer sur un jeu avec traité, et être
      **égaux** sur un jeu sans traité.
- [ ] AC-6 — La **rétrocession** est nommée et **exclue** du périmètre, plutôt que passée sous
      silence : le plan la mentionne (`CA2`), le module ne la traite pas dans cette story.
- [ ] AC-7 — ⛔ **Aucune régression** : `EQUILIBRE_BILAN`, `COHERENCE_RESULTAT` et l'articulation
      `RN == bilan.controle.resultatNetN` restent verts sur une balance CIMA équilibrée portant
      `609` et `709` (M4). Un dossier `@1.0` ou `@2.0` produit **exactement** les mêmes états
      qu'avant, octet pour octet sur les deux artefacts.

## Notes

- Voir [[STORY-513]], [[STORY-515]], [[STORY-517]], [[STORY-518]], [[STORY-521]], [[STORY-522]],
  [[STORY-671]], spine AD-4.
- Sources officielles dépouillées le 2026-09-21 : art. **431** (liste des comptes), art. **432**
  (« 80. Exploitation générale »), art. **334-11** (compensation interdite), art. **308** (cessions
  hors zone CIMA) — pages officielles `cima-afrique.org`.

## Progress Tracking

**Statut : `in_progress` le 2026-09-21.** Cinq dépôts, cinq branches `MNV-520`.
