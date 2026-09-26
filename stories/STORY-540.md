# STORY-540 : Le dossier de validation de `cima-assurances` — ce qu'on soumet, à qui, et ce qu'on attend en retour

Status: in_progress

**Complexité :** medium

**Épic :** EPIC-128 — Socle vertical CIMA
**Service :** *(hors code — livrable documentaire et artefact)* `assurance-service` / `referentiels/`
**Points :** 5 · **Sprint :** S20
**Origine :** décision PO du 2026-08-28 — *« prends `cima-assurances` comme validé ; dans le cas contraire, écris la story pour mettre cela en place, avec les informations dont tu as besoin »*.

> ⚡ **Complexité `medium`** : aucune ligne de code, aucun contrat, aucune persistance. Mais le
> livrable est lu par un expert externe et parle au nom du Code CIMA : chaque affirmation du dossier
> se source sur le texte ou sur le code, jamais sur une story précédente recopiée.

---

## Pourquoi cette story existe

Le PO a décidé qu'on **avance** en considérant `cima-assurances` validé : le palier 2 démarre, et
[[STORY-519]] n'est plus suspendue. **C'est la bonne décision pour le développement.**

⛔ **Et elle ne peut pas remplacer la validation elle-même.** Une méthode de provisionnement est
validée par un **actuaire**, pas par un statut qu'on pose. Un artefact dont le `statut` dirait
« certifié » sans signature serait **la seule affirmation de ce programme qu'un régulateur pourrait
retenir contre son utilisateur**.

⇒ Cette story **met la validation en chantier en parallèle du développement**. Elle ne bloque rien.

## Ce qu'il faut soumettre — le dossier

> ⚠️ **Table écrite le 2026-08-28 sur `cima-assurances@1.0`.** Cinq versions ont été servies depuis,
> et trois de ces cinq lignes ne sont plus vraies : voir **M1** (l'artefact à soumettre est `@5.0`),
> **M4** (le plan n'est pas verbatim) et **M10** (`80` a quitté les racines). La table à jour est
> celle du dossier : `referentiels/validation-cima/README.md`.

| Pièce | Où elle est aujourd'hui | État |
|---|---|---|
| **Le plan de comptes** — liste de l'art. 431, 80 comptes à 2 chiffres, libellés verbatim | `cima-assurances-1.0.json`, `planDeComptes` | ✅ officiel |
| **Les 25 postes et la table de passage** — la structure Bilan / CR proposée | même artefact | ⚠️ **proposition à valider** |
| **Les 4 formules** — `CAT`, `CPT`, `RT`, `RN`, avec leurs opérandes signées | `tableDePassage` | ⚠️ **`RT` est incomplet et le dit** |
| **Les `racinesDeGestion`** — `['6','7','80','82','83','84','85','86']` | même artefact | ⛔ **classe 8 déclarée en bloc** ([[STORY-522]]) |
| **Les méthodes de provisionnement** retenues au palier 2 | [[STORY-517]] / [[STORY-519]] | ⚠️ à produire |

## Les questions à poser — et ce sont elles, le livrable

> ⚠️ **Reposées sur le texte le 2026-09-26** (M5 à M10) : plusieurs de ces six questions trouvent
> déjà leur réponse dans les art. 432 et 433, ou ont été tranchées par les stories 516 à 522. La
> version soumise est `referentiels/validation-cima/questions.md` — même numérotation, questions
> reformulées en **lecture à confirmer**, **écart à arbitrer** ou **question ouverte**.

1. **Le découpage en 25 postes est-il celui de l'article 433**, ou une agrégation acceptable ? ⚠️ Le
   plan s'arrête à **2 chiffres** : un assureur réel tient des comptes à 4-6 chiffres, qui se
   rattacheront tous par préfixe **sans qu'aucune erreur ne soit détectable** ([[STORY-512]]).
2. **Quels postes de variation de provisions techniques** doivent entrer au compte de résultat, et
   dans quel ordre de cascade ? ([[STORY-518]])
3. **Où passe la frontière Vie / Non-Vie** dans le plan, compte par compte ? ([[STORY-521]])
4. **Quels comptes de la classe 8 sont des comptes de REGROUPEMENT** ? ⚡ La question la plus urgente :
   le repli générique y a déjà **doublé exactement la base imposable**, sans qu'aucun contrôle ne
   s'en aperçoive.
5. **Quelles méthodes de provisionnement** sont admises par la Commission Régionale de Contrôle des
   Assurances, et **lesquelles exigent une signature d'actuaire agréé** ?
6. **La cadence de règlement** collectée par [[STORY-516]] est-elle la bonne maille (par branche,
   par exercice de survenance) pour alimenter une PSAP ?

## Cadrage mesuré avant de rédiger (2026-09-26)

Sources croisées, toutes relevées ce jour :

- l'**artefact servi** `cima-assurances@5.0` — empreinte `5234764a…0859`, ses **trois** copies
  identiques à l'octet (`bilan-service`, `balance-service`, `assurance-service`) et la même empreinte
  épinglée dans les **trois** manifestes ;
- le **code** des services sur `origin/dev` (`bilan-service` `8226ebf`, `balance-service`
  `b6d9a03`, `assurance-service` `c030b85`, `platform-catalog-service` `f112770`, `admin-panel`
  `23f184b`, `fiscal-service` `5500197`) ;
- les **pages officielles** `cima-afrique.org` des **art. 432** (modifié le 20 avril 1995) et
  **433** (modifié le 2 avril 2008), et de la **circulaire n° 00230/CIMA/CRCA/PDT/2005** ;
- les **règlements CIMA de 2024** n° 02, 004 et 006, lus sur les PDF officiels scannés hébergés par
  la Direction des Assurances de Côte d'Ivoire ;
- les stories [[STORY-512]] à [[STORY-524]], [[STORY-671]], [[STORY-672]].

### M1 — L'artefact à soumettre est `@5.0`, et il n'a plus rien de l'amorce décrite ici

| | décrit par cette story (`@1.0`) | mesuré sur `@5.0` |
|---|---|---|
| postes | 25 | **72**, en **5 états** (bilan actif/passif, compte de résultat, compte 80 Vie, compte 80 toute nature, compte 87) |
| lignes de table de passage | 25 | **65** |
| formules | 4 (`CAT`, `CPT`, `RT`, `RN`) | **12** (+ `RV1`, `RV2`, `EV16`–`EV18`, `EN16`–`EN18`) |
| comptes au plan | 80 | **90** (79 racines + `05` + 10 comptes à 3 chiffres) |
| `racinesDeGestion` | `6, 7, 80, 82…86` | `6, 7, 82…86` — `80`, `87`, `88`, `89` marqués `REGROUPEMENT` |

⚠️ **Les versions `@1.0` à `@4.0` restent packagées et servies** : `bilan-service` sert la version
**octroyée** à l'organisation, potentiellement l'une d'elles. On ne réécrit pas un chiffre déjà
publié — et une validation de `@5.0` ne vaut donc **pas** pour elles.

### M2 — ⛔ Le statut vaut `amorce`, et c'est la bonne valeur

La réserve M6 de [[STORY-519]] est confirmée : les **cinq** versions déclarent `statut: amorce`,
aucune `a-valider-par-expert`. Et le vocabulaire fermé le veut ainsi (D-491-3,
`referentiel-package.interface.ts`) :

- `certifie` — une validation par un professionnel qualifié est **consignée** ;
- `a-valider-par-expert` — transcription **couvrant les états de sa norme**, sans validation ;
- `amorce` — le paquet **déclare lui-même** ne pas couvrir des parties obligatoires de sa norme.

La `miseEnGarde` de `@5.0` énumère ce qu'elle ne couvre pas : états C1..C25, reprise de l'IS,
rétrocession, cessions à l'étranger, plafonds de l'art. 308, compte 88, niveau de détail du plan.
⇒ **Passer à `a-valider-par-expert` serait le même mensonge que `certifie`, un cran plus bas.**

### M3 — ⛔⛔ « Continue d'être publié partout où il est servi » est FAUX aujourd'hui

Mesuré dans le code : le statut et la mise en garde du paquet sont servis sur **7 routes** —
catalogue `GET /referentiels`, diagnostic `…/bilan/referentiel`, les dry-runs d'états, balance
`…/referentiels/actifs` et `suggest-comptes`, assurance `…/assurance/referentiel`.

Ils sont **absents** du circuit principal :

| Où | Pourquoi |
|---|---|
| le **jeu d'états** — création, lecture, recalcul, compléments, validation, réouverture, dépôt | `stamp` forcé à `statut: undefined, miseEnGarde: undefined` (`jeu-etats-response.dto.ts:616-627`), avec un commentaire « 🪝 Story à part » **sans numéro** |
| l'**export PDF/XLSX** de la liasse | son « Statut » imprimé est `Brouillon` / `Version`, le cycle de vie — jamais la maturité |
| les versions, leurs comparaisons, la consultation sans version, la comparaison d'exercices, la consolidation, le prévisionnel | aucun des deux champs |
| les routes fiscales de `balance-service` | seul le statut du **paquet fiscal** est servi |
| `platform-catalog-service`, `admin-panel` | ne portent pas la maturité |

⚠️ La liasse **scellée** stocke bien `liasse.statut` et `liasse.miseEnGarde`, mais ne les ressert
que sous `liasse`, sur deux routes, sans description au contrat.

⇒ **AD-10 de la spine** (« l'amorce est publiée COMME TELLE, statut compris, partout où elle est
servie ») n'est pas tenue : la liasse CIMA qu'un utilisateur exporte en PDF ne dit pas qu'elle vient
d'une amorce. Cette story étant **hors code**, le défaut part au registre en **R-01**, première
réserve du dossier.

### M4 — ⛔ Le plan de comptes n'est pas « verbatim » depuis STORY-512

[[STORY-512]] l'a mesuré : l'art. 431 énumère **1 052 comptes** sur quatre niveaux ; le paquet en
porte 90, et **26 des 79 libellés** à deux chiffres sont **abrégés**. Leur transcription est
[[STORY-671]]. ⇒ Ce que l'AC-4 exclut de la validation, c'est le **texte** de l'art. 431 — pas sa
transcription, qui est notre affaire, et qui est connue imparfaite. Le **niveau de détail** retenu
(deux chiffres, plus dix comptes à trois) est, lui, une **proposition** : il entre en Q1.

### M5 — ⚡⚡ Le texte répond déjà à une partie des questions

L'art. 432 publie **la composition officielle de chaque poste du compte 80** (« Les comptes
constituant les postes du compte 80 sont indiqués dans les listes ci-après »), et l'art. 433 les
**modèles** du bilan et des comptes 80, 87 et 88. Demander à l'expert ce que ces listes disent
paierait sa compétence pour une lecture.

⇒ Chaque question du dossier est classée : **lecture à confirmer** (le texte tranche, on soumet notre
lecture), **écart à arbitrer** (le paquet s'écarte du texte, sciemment ou non) ou **question
ouverte** (le texte ne tranche pas).

### M6 — ⛔⛔ Lu contre ces textes, le paquet s'écarte du modèle — avant tout expert

| # | Ce que dit le texte | Ce que fait `@5.0` | Registre |
|---|---|---|---|
| a | Art. 432, listes **vie** : sinistres `6010, 6030, 6040, 6060, 6901, 6904` ; primes `701, 703, 704, 706, 7901, 7904` — **ni `605` ni `705`** | `EV1` porte `605`, `EV10` porte `705`. ⚠️ [[STORY-521]] écrivait « les acceptations figurent dans les deux listes » : vrai pour `604`/`704`, **faux pour `605`/`705`** | R-16 |
| b | `74` → « Produits accessoires : 74, 76, 794, 796 » ; `78` → « Travaux faits par l'entreprise pour elle-même » ; `73` « est, en fin d'année, soldé par les comptes 701 à 706 » | aucun des trois n'est routé ([[STORY-672]]) | R-17 |
| c | Bilan : la provision pour dépréciation (`192`, `197`) et `195` sont **déduites de l'actif** | `19` est présenté **au passif** (`CP2`) — actif et passif gonflés du même montant, aucun contrôle ne le voit | R-09 |
| d | Bilan : `41` à `45` figurent **des deux côtés** ; `40` est scindé **par sous-compte** (`4000/4040/4080` débiteurs à l'actif, `4001/4041/4081` créditeurs au passif) | `40, 41, 44, 45` à l'actif seul, `42, 43` au passif seul : un solde inverse **diminue** son poste, sans signal | R-10 |
| e | Art. 432 : `49` figure au bilan s'il n'a pu être reclassé, « sans compensation » ; `17` des deux côtés ; le résultat de l'exercice en `87` | `49` n'est routé nulle part, `17` au passif seul, le résultat est ajouté à `CP1` pour le seul total | R-11 à R-13 |
| f | Compte 80 : la variation des provisions de **sinistres** passe aux prestations (débit), celle des provisions de **primes** aux primes (crédit) | une seule ligne `Δ CP3` et une `Δ CA2` — faute de plan détaillé ([[STORY-518]]) | R-18 |
| g | Art. 422 : le compte d'exploitation générale fait partie des états annuels | la liasse **validée** (scellée, exportée) ne contient **pas** les comptes 80 et 87 : seul le dry-run `resultat-cima` les sert | R-02 |

Aucun de ces écarts n'est corrigé ici (hors code) : chacun est soumis à l'expert comme **lecture à
confirmer**, et inscrit au registre avec « story à ouvrir ».

### M7 — ⚡⚡ Trois règlements CIMA de 2024, absents de l'édition 2019 que le dépôt cite partout

| Règlement | Ce qu'il change | Effet sur le dossier |
|---|---|---|
| **n° 006/CIMA/PCMA/CE/SG/CIMA/2024** (Abidjan, 8 août 2024) | art. **422** (état **C10e** nouveau), art. **422-2** (bilan, comptes 80 et 87 **semestriels**, état **C6S** nouveau), art. 730 ; modèles annexés C6 S, C10, C10 B, C10 C, C25 bis, RA2, RS1, C10E ; transition jusqu'au **31 décembre 2027** | ne republie **pas** les modèles du bilan ni des comptes 80, 87 et 88 : la base de `@5.0` tient. ⛔ Mais `etats-cima@1.0` (46 états) n'a **ni C10e ni C6S** — R-43 |
| **n° 02/CIMA/PCMA/CE/SG/2024** (Dakar, 16 janvier 2024) | art. **334-4** : méthode de la **provision de gestion** en vie | c'est le « Règlement 2024 » que STORY-519 (M2) n'avait pas pu obtenir. Sans effet sur ce que le module calcule (il ne calcule pas la vie) — R-38 |
| n° 004/CIMA/PCMA/CE/SG/CIMA/2024 (Abidjan, 8 août 2024) | art. 329-3 : capital minimum | hors périmètre |

### M8 — Q5 : « admises par la Commission » n'est pas une propriété d'une méthode

- Le Code n'exige **pas** d'actuaire (M1 de [[STORY-519]]) : le certificateur est un **mandataire
  social** (art. 425). Les trois règlements de 2024 lus n'en créent pas.
- L'**accord** de la Commission sur une méthode statistique est donné **à une entreprise** (art.
  334-12, « l'entreprise peut, avec l'accord de la Commission… »), jamais à un logiciel. Le produit
  ne peut pas l'obtenir pour ses utilisateurs.
- Ce que le texte fixe déjà pour les **tardifs** : la **circulaire n° 00230/CIMA/CRCA/PDT/2005 du
  24 octobre 2005** — « la méthode de la cadence des déclarations des tardifs », construite sur le
  **tableau C de l'état C10b**, moyenne sur quatre années de déclaration, nombre estimé multiplié par
  le **coût moyen** des sinistres déclarés.

### M9 — Q6 : la cadence que le régulateur nomme est une cadence de DÉCLARATIONS

- « Cadence de règlement » n'existe pas dans le Code (M1 de [[STORY-516]]).
- La circulaire des tardifs s'appuie sur la ligne « **Dont déclarés au cours de l'exercice
  écoulé** » du tableau C. L'état C10b produit par `assurance-service` ne la publie **pas**
  (`tableau-c10b.ts` : terminés, restant à payer, réouverts), alors que la donnée — date de
  survenance, date de déclaration — est collectée par [[STORY-515]].
- Sa maille est **survenance × exercice d'opération, par catégorie Vie/Non-Vie**. Le modèle C10 B
  est, lui, « à répéter pour toutes catégories des assurances terrestres », et celui de 2024 porte
  **dix** exercices.

### M10 — Q4 est répondue ; ce qui reste de la classe 8 est autre chose

[[STORY-522]] a tranché sur le texte (art. 432 : « Le solde du compte 80 est viré […] au compte 87 ») :
`80`, `87`, `88`, `89` sont des comptes de regroupement, et une **porte** du générateur l'impose. La
question devient une **lecture à confirmer**. Ce qui reste ouvert n'est pas une question de
regroupement :

- la charge d'IS (`85`) n'est **jamais reprise** avant l'assiette fiscale d'un dossier CIMA ;
- **aucun contrôle d'articulation** ne s'exécute sur CIMA, et les deux « résultats » — fiscal (racines
  de gestion) et `RN` (classes 6 et 7 routées) — ne sont **jamais rapprochés** ;
- l'« écriture d'inventaire passée contre `80` » à laquelle renvoyait D-518-5 n'est reprise **nulle
  part** par STORY-522.

### M11 — « À qui » n'est écrit nulle part — et c'est la Q2 de la spine, « non tranchée »

Le titre promet « à qui » ; le corps ne le dit pas, et la spine
(`architecture-assurance-service-2026-08-27`) laisse ouverte « Q2 : qui valide l'amorce ? ». Le
dossier ne peut pas nommer une personne — c'est le choix du PO. Il peut dire **quels profils**, **pour
quelles questions**, et **qui n'est pas un destinataire** (la Commission, cf. M8).

### M12 — « L'historique n'est jamais réécrit » : vrai au niveau applicatif, pas en base

Les évaluations sont **append-only** côté application (STORY-517 AD-2) ; une écriture directe en base
le contournerait ([[STORY-521]]). L'AC-3 reste juste pour le produit ; le registre le nuance.

## Décisions de cadrage du 2026-09-26

| # | Décision | Pourquoi |
|---|---|---|
| **D-540-1** | Le dossier soumet **`cima-assurances@5.0`**, identifié par son **empreinte** (`5234764a…0859`) et une copie octet pour octet ; une validation vaut **pour cette empreinte et elle seule** | M1. Une signature sur « cima-assurances » sans version ne dirait rien : cinq versions sont servies, et la suivante (STORY-671) changera le plan |
| **D-540-2** ⛔ | Le statut **reste `amorce`**. La signature est une condition **nécessaire, pas suffisante**, de `certifie` : tant que la `miseEnGarde` énumère des parties obligatoires non couvertes, une validation se **consigne** (registre + fiche signée) sans changer le statut. La bascule sera une **story propre**, qui ajoutera au `meta` le bloc du signataire et fera **refuser par le générateur** un `certifie` sans lui | M2. Publier `certifie` sur un paquet dont la mise en garde dit « Restent NON couverts » ferait se contredire l'artefact. Et aujourd'hui `build.mjs` packagerait un `certifie` **sans signataire** : seule la garde `statut-paquet.spec.ts` (« aucun paquet ne se déclare `certifie` ») l'en empêche |
| **D-540-3** | Les formules en clair sont **dérivées** de l'artefact par un générateur versé au dossier, avec un mode `--verifier` qui échoue dès que le document ou la copie diverge | Leçon de [[STORY-519]] : *une déclaration de plus ne mesure le comportement que si elle en est dérivée*. Un expert qui signerait une transcription manuscrite ne validerait pas ce que le produit calcule |
| **D-540-4** | Les **textes de référence** sont versés au dossier en extraits verbatim — art. 432, art. 433, circulaire 00230, règlements 2024 — avec URL, date de relevé et empreinte de la source | M5, M7. Une lecture soumise à confirmation doit montrer le texte qu'elle lit ; et la page officielle a déjà été injoignable (le PDF de droit-afrique.com l'est) |
| **D-540-5** | Chaque question est classée **lecture à confirmer**, **écart à arbitrer** ou **question ouverte**, et renvoie aux réserves qu'elle met à l'épreuve | M5. On paie l'expert pour arbitrer, pas pour lire |
| **D-540-6** | **À qui** : profil **A**, expert-comptable ou commissaire aux comptes pratiquant l'assurance en zone CIMA (Q1 à Q4) ; profil **B**, actuaire (Q5, Q6). La Commission n'est **pas** un destinataire : ce qu'on attend d'elle est un **texte**. Le PO désigne les personnes | M8, M11. La qualité du validateur reste un **texte libre** (D-519-4) : le Code ne nomme aucune profession |
| **D-540-7** | **Ce qu'on attend en retour** : une fiche de réponse signée par profil — pour chaque sous-question un verdict (validé / à corriger / hors compétence), la correction et **la référence qui la fonde** ; l'identité du signataire (nom, qualité, date) ; l'empreinte examinée | Une correction sans référence ne peut pas entrer dans la `normeSource` d'une version suivante |
| **D-540-8** | **Registre** : un identifiant stable par réserve (`R-NN`), sa source, la question qui la met à l'épreuve, un statut (`OUVERTE`, `CONFIRMÉE`, `INFIRMÉE`, `LEVÉE`) et la story qui la porte. Une réserve infirmée **devient une story qui cite son identifiant** ; une correction d'artefact est une **nouvelle version**, les précédentes restant intactes ; une correction de méthode est une **nouvelle version d'évaluation** | AC-3 |
| **D-540-9** ⛔ | **Hors code, à la lettre** : aucun service, aucun artefact, aucun générateur modifié. Les défauts relevés (M3, M6, M7) sont **inscrits** au registre avec « story à ouvrir », **pas corrigés**, et **aucune story n'est créée ici** : leur ordre est un arbitrage du PO | Périmètre BMAD. Le premier d'entre eux (R-01) est signalé comme prioritaire |
| **D-540-10** | La fiche `fiche-validation-referentiels-2026-07-21.md` §2 (sur `@1.0`) reçoit un bandeau qui la déclare **remplacée** ; elle n'est ni réécrite ni supprimée | Elle a pu être envoyée : un document qui disparaît fait chercher ce qu'on a cassé |

## Critères d'acceptation

- [ ] AC-1 — Le dossier ci-dessus est **constitué et versé au dépôt**, sous
      `referentiels/validation-cima/`, avec l'artefact, ses formules **écrites en clair** (pas en
      JSON) et les six questions.
      ⚡ **PRÉCISÉ (M1, D-540-1, D-540-3, D-540-4)** : l'artefact est `@5.0`, copié octet pour octet
      et identifié par son empreinte ; les formules sont **générées** depuis lui (`--verifier`) ; les
      questions sont **reposées sur le texte** ; les textes de référence sont versés.
- [ ] AC-2 — ⛔ **Le `statut` de l'artefact reste `a-valider-par-expert`** et continue d'être publié
      partout où il est servi. Il ne bascule à `certifie` que **le jour où quelqu'un signe**, et le
      nom du signataire entre au `_meta`.
      ⚡⚡ **CORRIGÉ PAR LA MESURE (M2, M3, D-540-2)** : le statut **reste `amorce`** — la valeur que
      le vocabulaire assigne à ce paquet. Il **n'est pas** publié partout : servi sur 7 routes, absent
      du jeu d'états et de l'export ⇒ réserve **R-01**, première du registre, story à ouvrir (hors
      code). La bascule exige la signature **et** la fin de l'amorce ; elle se fera par une story
      propre, qui ajoutera le signataire au `meta` et la garde au générateur.
- [ ] AC-3 — Un **registre des réserves** : chaque point que la validation infirme devient une story,
      et la story cite la réserve. ⚠️ Les provisions étant des **évaluations versionnées**
      (STORY-517), une méthode corrigée produit **une nouvelle version** — l'historique n'est jamais
      réécrit, et c'est ce que cette architecture protège.
      ⚡ **PRÉCISÉ (D-540-8, M12)** : le registre est amorcé avec les réserves **déjà connues** (stories
      512 à 524, 671, 672) et celles de ce cadrage, chacune rattachée à la question qui la met à
      l'épreuve ; l'append-only est applicatif, pas garanti en base.
- [ ] AC-4 — Le dossier nomme **ce que le produit ne demande PAS de valider** : le plan de comptes
      (officiel, verbatim) et l'architecture du moteur. On fait relire ce qui est une proposition,
      pas ce qui est une transcription.
      ⚡ **CORRIGÉ (M4)** : on ne fait pas valider le **texte** de l'art. 431 ; sa **transcription**
      est de notre ressort et connue imparfaite (STORY-671) ; son **niveau de détail** est une
      proposition (Q1). On ne fait pas valider l'**architecture** du moteur ; ses **règles** de
      rattachement, qui décident des montants, sont écrites en clair et soumises.

## Périmètre

### Livré

- `referentiels/validation-cima/` :
  - `README.md` — la page de garde : ce qu'on soumet, à qui, ce qu'on attend en retour, ce qu'on ne
    demande pas, le statut et sa bascule, ce qui se passe au retour ;
  - `questions.md` — les six questions reposées, avec la **fiche de réponse** et le bloc de signature ;
  - `registre-des-reserves.md` — AC-3 ;
  - `formules-en-clair.md` — **généré** ; `generer_formules.py` — son générateur (`--verifier`) ;
  - `cima-assurances-5.0.json` — l'artefact soumis, copie octet pour octet ;
  - `textes-de-reference.md` — les extraits verbatim sur lesquels portent les lectures.
- Un bandeau « remplacée » sur la §2 de `fiche-validation-referentiels-2026-07-21.md`, et un renvoi
  depuis `referentiels/README-cima-assurances.md`.

### Hors périmètre

- ⛔ **Tout code** : services, générateur `build.mjs`, artefacts packagés (D-540-9).
- ⛔ **La correction** des défauts relevés (R-01, R-02, R-09 à R-18…) et **la création** des stories
  qui les porteront : arbitrage du PO.
- ⛔ **L'envoi** du dossier et **le choix** des personnes : le PO.
- ⛔ **La bascule** à `certifie` et le bloc signataire du `meta` : story propre, le jour où quelqu'un
  signe (D-540-2).
- ⛔ **Les artefacts voisins** `etats-cima@1.0` et `solvabilite-cima@1.0` : nommés au registre
  (R-43 à R-45), à soumettre par un dossier propre.

## Definition of Done

- [ ] `python3 generer_formules.py --verifier` vert, et **rouge** quand on altère le document généré
      ou la copie de l'artefact (table de mutations consignée).
- [ ] L'empreinte de la copie égale celle des **trois** manifestes de service.
- [ ] `python3 outils/verifier.py` : **aucun `ECHEC` nouveau** par rapport à la mesure d'avant la
      story.
- [ ] Tout lien relatif du dossier résout vers un fichier existant.
- [ ] Revue de code et revue de sécurité passées (`opus`), constats traités.
- [ ] ⚠️ **Vérification docker : non applicable** — la story ne persiste rien et ne touche aucun
      service. Dit, pas omis.
- [ ] Statut aligné aux **3 endroits**.

## Notes

- Voir [[STORY-519]], [[STORY-517]], [[STORY-518]], [[STORY-521]], [[STORY-522]], [[STORY-512]].
- Voir aussi [[STORY-515]], [[STORY-516]], [[STORY-520]], [[STORY-523]], [[STORY-524]],
  [[STORY-671]], [[STORY-672]] ; spine `architecture-assurance-service-2026-08-27` (AD-10, AD-12, Q2).

## Progress Tracking

**Statut : `in_progress` le 2026-09-26.** Cadrage mesuré **avant** toute rédaction du dossier : douze
constats (M1 → M12), dont **trois qui contredisent la story** — le statut vaut `amorce` (M2), il n'est
**pas** publié partout (M3), le plan n'est pas verbatim (M4) — et **deux qui la dépassent** : les
textes publient déjà une partie des réponses (M5, M6), et trois règlements de 2024 manquaient au
corpus (M7).

Branche créée **avant** la première ligne, sur l'unique dépôt touché :

```
docs  MNV-540
```

Mesure du vérificateur du dépôt **avant** la story (`outils/verifier.py`) : 33 contrôles, 24 OK,
6 alertes, **3 échecs préexistants** (T2 `story_path`, T5 engagement, T7 compteur) — la référence à
ne pas dégrader.
