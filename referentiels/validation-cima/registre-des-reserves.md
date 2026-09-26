# Registre des réserves — `cima-assurances@5.0`

> **Ce registre est la mémoire de la validation** (STORY-540, AC-3). Une réserve qui n'y figure pas
> est une réserve que personne ne suit. Il est amorcé le 2026-09-26 avec ce que le produit **sait
> déjà** de ses limites (stories 512 à 524, 671, 672) et avec ce que la lecture des textes a relevé
> **avant** tout expert (cadrage de STORY-540, M1 à M12).

## Comment il vit

1. **Une réserve ne disparaît jamais.** Son statut change, avec la date et la pièce qui le fonde —
   la fiche de réponse signée, ou la story qui l'a traitée.
2. **Une réserve que la validation INFIRME devient une story, et la story cite son identifiant**
   (`R-NN`). Si la correction touche l'artefact, elle produit une **nouvelle version** (`@6.0`…) ;
   `@1.0` à `@5.0` restent packagées **intactes**, parce que des organisations ont reçu leurs
   chiffres. Si elle touche une méthode de provisionnement, elle produit une **nouvelle version
   d'évaluation** (STORY-517, AD-2) : l'évaluation antérieure reste lisible, datée, avec sa méthode.
3. **Une réserve que la validation CONFIRME reste une limite**, désormais adossée à un avis signé ;
   elle continue d'être dite partout où elle l'était (mise en garde, contrat d'API).
4. **Une réserve qu'une story corrige passe à LEVÉE**, avec le numéro de la story.
5. **Tout verdict porte l'empreinte qu'il a examinée.** Un avis rendu sur `@5.0` (`5234764a…`) ne
   vaut pas pour `@6.0` : la réserve concernée est rouverte si la ligne en cause a changé.
6. **Les réserves nouvelles** qu'apporteront les fiches de réponse s'ajoutent à la suite (`R-47`…),
   jamais en renumérotant.

⚠️ **« L'historique n'est jamais réécrit » vaut au niveau applicatif** : les registres de provisions
sont append-only côté service, mais une écriture directe en base le contournerait (STORY-521). C'est
la réserve **R-46**.

## Légende

| Nature | Ce que c'est | Qui y répond |
|---|---|---|
| `ÉCART AU TEXTE` | le texte tranche, et le paquet s'en écarte | l'expert **confirme notre lecture** ; la correction est une story |
| `LECTURE` | le texte tranche, et le paquet le suit | l'expert **confirme** |
| `QUESTION` | le texte ne tranche pas | l'expert **arbitre** |
| `DÉFAUT` | défaut du produit, sans question à poser | une story |
| `LIMITE` | limite connue, déclarée et assumée | l'expert dit si elle est **acceptable** |
| `DONNÉE` | donnée ou texte manquant | celui qui détient la donnée ou le texte |
| `DÉCISION PO` | arbitrage de produit | le PO |

| Statut | Sens |
|---|---|
| `OUVERTE` | en attente de verdict ou de traitement |
| `CONFIRMÉE` | l'expert confirme — la limite reste, adossée à son avis |
| `INFIRMÉE` | l'expert infirme — une story la porte et cite son identifiant |
| `LEVÉE` | une story l'a corrigée |

**Profils** (voir [`README.md`](README.md)) : **A** expert-comptable ou commissaire aux comptes pratiquant
l'assurance en zone CIMA — **B** actuaire.

## Ce qui presse — recommandation au PO

Hors code, cette story **inscrit** et **ne corrige pas** (D-540-9). Les défauts ci-dessous rendent
**faux ou trompeur un document que le produit publie déjà** ; ils n'attendent aucun expert :

| Priorité | Réserve | Pourquoi maintenant |
|:---:|---|---|
| 1 | **R-01** — statut et mise en garde absents du jeu d'états et de l'export | la liasse CIMA exportée en PDF ne dit pas qu'elle vient d'une amorce — AD-10 de la spine |
| 2 | **R-02** — la liasse validée ne contient pas les comptes 80 et 87 | l'état que l'art. 422 exige en premier n'entre pas dans le document scellé |
| 3 | **R-09** à **R-14** — le bilan s'écarte du modèle de l'art. 433 | le bilan, lui, est scellé et exporté |
| 4 | **R-28**, **R-29** — IS jamais repris, aucun contrôle d'articulation | le module fiscal calcule une base sur un résultat que rien ne recoupe |

---

## A. Publication du statut et validation

| ID | Réserve | Source | Texte | Nature | Question | Statut | Story |
|---|---|---|---|---|---|---|---|
| **R-01** | ⛔ Le `statut` et la `miseEnGarde` du paquet ne sont **pas** servis par le jeu d'états (création, lecture, recalcul, compléments, validation, réouverture, dépôt : `stamp` forcé à `undefined`), l'export PDF/XLSX (son « Statut » est le cycle de vie), les versions et leurs comparaisons, la consultation sans version, la comparaison d'exercices, la consolidation, le prévisionnel, les routes fiscales de `balance-service`, `platform-catalog-service` et `admin-panel`. Ils le sont sur onze routes seulement : catalogue et diagnostic du référentiel, les six dry-runs d'états, référentiel et suggestions de `balance-service`, référentiel d'`assurance-service`. | STORY-540 M3 ; `bilan-service` `jeu-etats-response.dto.ts:616-627` (« 🪝 Story à part », sans numéro) | spine AD-10 | `DÉFAUT` | — | `OUVERTE` | **à ouvrir — priorité 1** |
| **R-02** | La liasse **validée** — scellée, exportée, déposée — ne contient pas les comptes 80 et 87 : seul le dry-run `resultat-cima` les produit. | STORY-540 M6-g ; `bilan-engine.service.ts` (liasse complète sans les états CIMA) | art. 422 | `DÉFAUT` | Q1 | `OUVERTE` | à ouvrir |
| **R-03** | Le générateur packagerait un `statut: certifie` **sans signataire** : le `meta` n'a aucune clé pour lui, et seule la garde `statut-paquet.spec.ts` (« aucun paquet ne se déclare `certifie` ») l'empêche. | STORY-540 D-540-2 ; `build.mjs` (`CLES_META`) | — | `DÉFAUT` | — | `OUVERTE` | à ouvrir **le jour d'une signature** |
| **R-04** | Aucun article du Code n'exige qu'un actuaire valide une méthode ; le certificateur des états est un mandataire social, sous sanction. La validation est une exigence **du produit**. Les trois règlements de 2024 lus n'en créent pas. | STORY-519 M1 ; STORY-540 M8 | art. 425 | `LECTURE` | Q5 | `OUVERTE` | — |
| **R-05** | Personne n'est désigné pour valider (« Q2 : qui valide l'amorce ? », non tranchée). | spine `architecture-assurance-service-2026-08-27` ; STORY-540 M11 | — | `DÉCISION PO` | — | `OUVERTE` | — |

## B. Plan de comptes

| ID | Réserve | Source | Texte | Nature | Question | Statut | Story |
|---|---|---|---|---|---|---|---|
| **R-06** | Le plan packagé porte 90 comptes sur les 1 052 de l'art. 431 ; **26 des 79 libellés** à deux chiffres sont abrégés ; la racine `05` est déduite de ses enfants. | STORY-512 ; `README-cima-assurances.md` | art. 430, 431 | `DÉFAUT` | Q1 | `OUVERTE` | STORY-671 |
| **R-07** | La profondeur est plafonnée à **6 chiffres** (D-512-1) : l'art. 430 s'arrête à 4, l'art. 431 énumère des comptes à 5, la clause de l'art. 432 (classe 4) nomme 6, l'art. 412 ferme le reste. Deux comptes longs ramenés au même compte du plan fusionnent leurs soldes. | STORY-512 | art. 412, 430, 431, 432 | `LECTURE` | Q1 | `OUVERTE` | — |
| **R-08** | Comptes que l'art. 432 cite et que l'art. 431 n'énumère pas : `360`, `3910`, `3930`, `3950`, `3955`, `3960`, `603`, `606`, `703`, `706`, `7909` ; coquilles de la page officielle : `6126` pour `6026`, `6905` sans point, `6029` en double (sous `602` et sous `620`, où il faut lire `6209`). | STORY-512, 515, 518, 520, 521 | art. 431, 432 | `QUESTION` | Q1, Q3 | `OUVERTE` | STORY-671 (en partie) |

## C. Bilan — écarts au modèle de l'art. 433

| ID | Réserve | Source | Texte | Nature | Question | Statut | Story |
|---|---|---|---|---|---|---|---|
| **R-09** | Le modèle **déduit de l'actif** la provision pour dépréciation des immobilisations et titres (`192`, `197`) et celle des titres de placement (`195`) ; le paquet présente tout le compte `19` **au passif** (`CP2`). Actif et passif sont gonflés du même montant : aucun contrôle ne le voit. | STORY-540 M6-c | art. 433 (bilan) | `ÉCART AU TEXTE` | Q1 | `OUVERTE` | à ouvrir |
| **R-10** | Le modèle porte `41` à `45` **des deux côtés** (renvoi ➀ sans texte sur la page), scinde `40` **par sous-compte** (`4000`, `4040`, `4080` débiteurs à l'actif ; `4001`, `4041`, `4081` créditeurs au passif) et les créditeurs divers (`4600`, `4601`, `4603`, `4604`, `462` à `468`). Le paquet met `40`, `41`, `44`, `45` à l'actif seul et `42`, `43` au passif seul : un solde de sens inverse **diminue** son poste, compté en négatif, sans signal. Seul `46` est réparti, compte par compte, selon son solde. | STORY-540 M6-d ; `bilan-production.service.ts` (`choisirRattachement`, `appliquer`) | art. 433 (bilan) | `ÉCART AU TEXTE` | Q1 | `OUVERTE` | à ouvrir |
| **R-11** | Le compte `49` doit figurer au bilan s'il n'a pu être reclassé, « sans compensation » des soldes ; le paquet ne le route vers aucun poste — un `49` non soldé bloque la validation de la liasse (`COMPTES_NON_AFFECTES`). | STORY-540 M6-e | art. 432 (compte 49), 433 | `ÉCART AU TEXTE` | Q1 | `OUVERTE` | à ouvrir |
| **R-12** | Le compte `17` (liaison avec le siège) figure au modèle **des deux côtés** (créances, dettes) ; le paquet le met au passif seul. | STORY-540 M6-e | art. 433 (bilan) | `ÉCART AU TEXTE` | Q1 | `OUVERTE` | à ouvrir |
| **R-13** | Le modèle porte le résultat en **`87`** (« excédent avant affectation » au passif, « pertes de l'exercice » à l'actif). Le paquet ajoute le résultat calculé à `CP1` **pour le seul total**, la ligne publiée ne le contient pas, et range `88` dans `CP1`. Quel compte porte le résultat au bilan CIMA, et la ligne publiée doit-elle le contenir ? | STORY-540 M6-e ; `bilan-production.service.ts` (total du passif) | art. 432 (comptes 87, 88), 433 | `QUESTION` | Q1, Q4 | `OUVERTE` | à ouvrir |
| **R-14** | Le modèle **déduit des immobilisations** les versements restant à effectuer sur titres non libérés (`4611` à `4618`) ; le paquet range tout `46` en créances ou en dettes selon son solde. | STORY-540 M6 | art. 433 (bilan) | `ÉCART AU TEXTE` | Q1 | `OUVERTE` | à ouvrir |
| **R-15** | Le bilan du paquet a **4 postes par côté** ; le modèle en détaille plusieurs dizaines (immeubles, matériel, valeurs admises en représentation, primes et sinistres à la part des cessionnaires…). Le paquet agrège — l'usage auquel cette agrégation serait acceptable n'est tranché nulle part. | STORY-523 ; STORY-540 M6 | art. 433 | `QUESTION` | Q1 | `OUVERTE` | — |

## D. Compte 80 et compte de résultat

| ID | Réserve | Source | Texte | Nature | Question | Statut | Story |
|---|---|---|---|---|---|---|---|
| **R-16** | Le modèle **Vie** du paquet reçoit `605` (`EV1`) et `705` (`EV10`), acceptations **dommages** ; les listes vie de l'art. 432 ne les nomment pas (sinistres `6010`, `6030`, `6040`, `6060`, `6901`, `6904` ; primes `701`, `703`, `704`, `706`, `7901`, `7904`). STORY-521 écrivait « les acceptations figurent dans les deux listes » : vrai pour `604`/`704`, faux pour `605`/`705`. | STORY-540 M6-a | art. 432 (compte 80) | `ÉCART AU TEXTE` | Q3 | `OUVERTE` | à ouvrir |
| **R-17** | Dix comptes de gestion ne sont routés vers **aucun** poste : `73` (« soldé en fin d'année par les comptes 701 à 706 »), `74` (« Produits accessoires : 74, 76… »), `78` (« Travaux faits par l'entreprise pour elle-même »), `69` et `79` (l'étranger, que l'art. 432 répartit ligne à ligne : `6901`, `691`…, `7901`…), `82` à `86`. Tant que `73` n'est pas soldé, les primes des états servis en dry-run sont surévaluées de ses ristournes et la liasse ne peut pas être validée (compte non affecté) ; la route des comptes 80 et 87, elle, l'écarte **en silence**. | STORY-672 ; STORY-540 M6-b ; `formules-en-clair.md` § 8 | art. 432 | `DÉFAUT` | Q2, Q4 | `OUVERTE` | STORY-672 |
| **R-18** | Le modèle place la variation des provisions de **sinistres** avec les prestations (débit), celle des provisions de **primes** avec les primes (crédit), et la dotation aux **provisions mathématiques** en vie ; le paquet publie une seule ligne `Δ CP3` (et `Δ CA2` pour les cessions), faute de plan détaillé. | STORY-518 ; STORY-540 M6-f | art. 432, 433 (compte 80) | `ÉCART AU TEXTE` | Q2 | `OUVERTE` | STORY-671 (préalable) |
| **R-19** | Présentation : l'art. 432 range `75` (et `795`) en **cessions** de la ligne « Commissions et autres charges » ; le paquet le publie comme un **produit** (`EV12`, `EN12`, `RP3`). Les dotations aux amortissements des placements (`6812`, `6813`) vont aux charges des placements ; le paquet met tout `68` dans une ligne. Les ajustements des contrats à capital variable (`679`, `779`) ont leur ligne. | STORY-540 M6 | art. 432 (compte 80) | `ÉCART AU TEXTE` | Q2 | `OUVERTE` | — |
| **R-20** | `RT` n'est pas le solde du compte 80 : il laisse dehors frais de personnel, impôts, travaux, frais divers, subventions et produits accessoires, que l'art. 432 range dans le compte 80 ; il reste servi, avec son libellé d'amorce, dans un état `COMPTE_RESULTAT` qui n'est **pas** un modèle du Code. | STORY-521 ; `README-cima-assurances.md` | art. 432 | `QUESTION` | Q1, Q2 | `OUVERTE` | — |
| **R-21** | Sans colonne N-1, `RV1`, `RV2`, `RT` et les soldes du compte 80 ne sont pas publiés — jamais mis à 0. Une N-1 fournie **sans** compte de classe 3 est lue comme des provisions nulles à l'ouverture : la variation vaut alors le stock entier — juste pour une entreprise nouvelle, faux pour une N-1 incomplète, et rien ne distingue les deux. Rien ne vérifie non plus que la N-1 est l'exercice précédent (limite déjà déclarée par le moteur : `IDENTITE_EXERCICES_COMPARES`). | STORY-518 ; `compte-resultat-production.service.ts` (`semerPostesBilan`) ; `controles-coherence.types.ts` | — | `LIMITE` | Q2 | `OUVERTE` | à ouvrir |
| **R-22** | D-518-5 renvoyait à STORY-522 « l'écriture d'inventaire passée contre `80` » pour les variations ; STORY-522 n'en parle pas. Si la variation des provisions techniques ne passe **que** par le compte 80 — l'art. 431 n'a aucun compte de gestion pour elle —, le résultat comptable que le module fiscal calcule sur les racines de gestion l'**ignore** sur une balance où cette écriture est passée : son sort, et son effet sur la base imposable, ne sont écrits nulle part. | STORY-518 ; STORY-522 | art. 432 | `QUESTION` | Q2, Q4 | `OUVERTE` | — |
| **R-23** | Le compte 87 est servi en **squelette** (`A_COMPLETER`) ; faute de formule de solde, chacune de ses lignes — `PPN` compris — sort avec le sens `CHARGE`. | STORY-672 ; `comptes-cima-production.service.ts` (`sensDe`) | art. 433 (compte 87) | `DÉFAUT` | Q4 | `OUVERTE` | STORY-672 |
| **R-24** | Le compte 88 (résultats en instance d'affectation), que l'art. 422 exige, n'est pas produit. | STORY-521 ; mise en garde de `@5.0` | art. 422, 433 | `DÉFAUT` | Q4 | `OUVERTE` | à ouvrir |
| **R-25** | La clé de répartition de l'art. 433 (produits financiers au prorata des provisions techniques nettes, plafonds de 10 % en transports et 2,5 % en acceptations) n'est pas convoquée ; elle sert l'état C1, que ce paquet ne produit pas — elle sera posée avec lui. | STORY-521 ; STORY-523 | art. 433, 411 | `QUESTION` | — | `OUVERTE` | — |
| **R-26** | Sur une balance à deux chiffres (`60`, `70`), l'agrément sort `INDETERMINABLE` : aucun des deux comptes 80 n'est calculé. | STORY-521 | art. 300, 326 | `LIMITE` | Q3 | `OUVERTE` | STORY-671 (en partie) |
| **R-27** | `704` (acceptations vie) figure dans les **deux** listes de l'art. 432 : une société de toute nature peut-elle accepter en réassurance des risques vie, et dans quel compte 80 ? | STORY-521 | art. 326 al. 1 et 3, 432 | `QUESTION` | Q3 | `OUVERTE` | — |

## E. Classe 8, impôt, articulation

| ID | Réserve | Source | Texte | Nature | Question | Statut | Story |
|---|---|---|---|---|---|---|---|
| **R-28** | La charge d'IS (`85`) n'est **jamais reprise** avant l'assiette fiscale d'un dossier CIMA : le compte d'impôt n'est pas reconnu. | STORY-522 ; `balance-service` `fiscal.regles.ts` | — | `DÉFAUT` | Q4 | `OUVERTE` | à ouvrir |
| **R-29** | Aucun contrôle d'articulation ne s'exécute sur CIMA (aucun compte de résultat net identifiable) ; le résultat fiscal (racines de gestion) et `RN` (classes 6 et 7 routées) diffèrent dès qu'un compte non routé porte un solde, et rien ne les rapproche ; la route des comptes 80 et 87 ne publie pas ses comptes non rattachés. | STORY-522 ; moteur | — | `DÉFAUT` | Q4 | `OUVERTE` | à ouvrir |
| **R-30** | `80`, `87`, `88`, `89` sont des comptes de **regroupement** ; `82` à `86` des comptes de gestion à mouvements propres. Une porte du générateur l'impose. | STORY-522 | art. 432 | `LECTURE` | Q4 | `OUVERTE` | — |

## F. Provisions techniques et méthodes

| ID | Réserve | Source | Texte | Nature | Question | Statut | Story |
|---|---|---|---|---|---|---|---|
| **R-31** | Le plancher publié de la provision pour risques en cours ne couvre que l'art. 334-10 ; l'art. 334-11, que l'art. 334-9 rend obligatoire, n'est appliqué nulle part (la réserve est servie en mise en garde). | STORY-519 M4 | art. 334-9, 334-10, 334-11 | `DÉFAUT` | Q5 | `OUVERTE` | à ouvrir |
| **R-32** | La provision pour risques en cours est calculée **par catégorie** (Vie, Non-Vie), pas **par branche** d'agrément comme le demande l'art. 334-10. | STORY-514 ; STORY-519 M5 | art. 334-10, 328 | `LIMITE` | Q5 | `OUVERTE` | — |
| **R-33** | La condition du prorata temporis (« en cas d'inégale répartition des échéances ») est **déclarée** par l'évaluateur, jamais vérifiée : le texte ne donne aucun seuil. | STORY-519 M5 | art. 334-10 | `QUESTION` | Q5 | `OUVERTE` | — |
| **R-34** | Le module calcule aussi une provision pour risques en cours en **Vie**, que la liste de l'art. 334-2 ne contient pas ; elle est servie sans fondement, statut `A_VALIDER_PAR_UN_EXPERT`. | STORY-519 (revue) | art. 334-2, 334-8 | `QUESTION` | Q5 | `OUVERTE` | — |
| **R-35** | Les **tardifs** ne sont pas estimés. La circulaire n° 00230/CIMA/CRCA/PDT/2005 impose la cadence des **déclarations** (tableau C de l'état C10b, quatre années, coût moyen) ; l'état C10b du module ne publie pas la ligne « Dont déclarés au cours de l'exercice écoulé », alors que dates de survenance et de déclaration sont collectées. | STORY-516 M1 ; STORY-540 M8, M9 | art. 334-12 ; circ. 00230 | `QUESTION` | Q5, Q6 | `OUVERTE` | — |
| **R-36** | Une méthode statistique (chain-ladder compris) n'est licite qu'avec l'**accord de la Commission**, donné à **une entreprise**, et pour les **deux derniers exercices** : ce n'est pas une propriété que le produit peut acquérir. | STORY-519 M3 ; STORY-540 M8 | art. 334-12 | `LECTURE` | Q5 | `OUVERTE` | — |
| **R-37** | Le chargement de gestion de la PSAP (« ne peut être inférieure à 5 % ») n'est pas calculé ; l'article ne dit pas de quoi. | STORY-519 M3 | art. 334-13 | `QUESTION` | Q5 | `OUVERTE` | — |
| **R-38** | La provision mathématique vie n'est pas calculée (donnée absente). Le **règlement n° 02/2024** — le « Règlement 2024 » de la FANAF, même fichier à l'octet — ne modifie **que** l'art. 334-4 : il supprime les dispositions transitoires de 2018, autorise **durablement** la compensation entre catégories homogènes de contrats, et confie la fixation des modalités de la provision de gestion au **Secrétariat Général**, après avis de la Commission. ⛔ La mise en garde que le catalogue des méthodes sert pour `VIE / DE_GESTION` cite encore la phrase de 2018 : « La Commission « peut préciser et fixer des modalités d'évaluation » ». | STORY-519 M2 ; STORY-540 M7 ; `assurance-service` `catalogue-des-methodes.ts` | art. 334-2, 334-4 (2024), 338 | `DÉFAUT` | Q5 | `OUVERTE` | à ouvrir (texte du catalogue) |
| **R-39** | L'état C10b du module est tenu **par catégorie Vie / Non-Vie** ; le modèle est « à répéter pour toutes catégories des assurances terrestres », et celui de 2024 porte dix exercices et des tableaux B bis. Tableau F non produit, tableau A renvoyé à STORY-514. | STORY-516 ; STORY-540 M9 ; règlement 006/2024 | art. 422, 433 | `QUESTION` | Q6 | `OUVERTE` | — |
| **R-40** | Non couverts : transports (rattachés à l'exercice de souscription, état C10c), maladie, sauvetages (sans compte au plan), risque d'exigibilité. | STORY-515, 516, 519 | art. 334-14, 415, 416 | `LIMITE` | Q5 | `OUVERTE` | — |

## G. Réassurance

| ID | Réserve | Source | Texte | Nature | Question | Statut | Story |
|---|---|---|---|---|---|---|---|
| **R-41** | Nommés, non traités : la **rétrocession** ; les cessions « à l'étranger » (`6909`, `7909`) ; les plafonds de l'art. 308 ; l'excédent de plein (aucun capital assuré) ; l'assiette des cessions, hors taxes et accessoires. | STORY-520 | art. 308, 432 | `LIMITE` | Q2 | `OUVERTE` | — |

## H. Chaîne vers la liasse

| ID | Réserve | Source | Texte | Nature | Question | Statut | Story |
|---|---|---|---|---|---|---|---|
| **R-42** | L'**adaptateur de balance** d'`assurance-service` (AD-5) n'existe pas : aucune provision, aucun sinistre, aucune cession calculés ou hébergés par le module **n'atteint la liasse**. Une méthode validée ne change la liasse que si l'entreprise en passe le résultat en balance. | STORY-518 ; STORY-520 ; STORY-521 | — | `LIMITE` | Q5 | `OUVERTE` | — |

## I. Textes de 2024 et artefacts voisins

| ID | Réserve | Source | Texte | Nature | Question | Statut | Story |
|---|---|---|---|---|---|---|---|
| **R-43** | Le **règlement n° 006/2024** ajoute les états **C10e** et **C6S**, rend semestriels le bilan et les comptes 80 et 87, republie les modèles C10, C10 B, C10 C, C25 bis, RA2 et RS1, et laisse aux entreprises jusqu'au **31 décembre 2027**. Le catalogue `etats-cima@1.0` (46 états) n'a ni C10e ni C6S. Le texte se contredit lui-même sur ce qu'est le tableau A du C25 bis. | STORY-540 M7 ; `textes-de-reference.md` § 9 | art. 422, 422-2 (2024) | `DÉFAUT` | — | `OUVERTE` | à ouvrir |
| **R-44** | `etats-cima@1.0` déclare le pays `GN` (Guinée) et non `GW` (Guinée-Bissau), là où `cima-assurances@5.0` déclare `GW` ; les sources secondaires donnent la Guinée-Bissau membre depuis 2002 et la Guinée non membre — la page officielle des États membres était injoignable. Son `_meta` ne porte pas de `statut`. | STORY-540 M7 | Traité CIMA | `DÉFAUT` | — | `OUVERTE` | à ouvrir (après confirmation de la liste officielle) |
| **R-45** | `etats-cima@1.0` et `solvabilite-cima@1.0` (« transcription non relue par un actuaire ni par un praticien CIMA ») sont **hors** de ce dossier : chacun appelle son propre dossier de validation. | STORY-523 ; STORY-524 | — | `DÉCISION PO` | — | `OUVERTE` | à ouvrir |

## J. Architecture de la preuve

| ID | Réserve | Source | Texte | Nature | Question | Statut | Story |
|---|---|---|---|---|---|---|---|
| **R-46** | Les registres de provisions sont **append-only au niveau applicatif** ; rien ne l'impose en base. « L'historique n'est jamais réécrit » vaut pour le produit, pas contre une écriture directe. | STORY-521 ; STORY-540 M12 | — | `LIMITE` | — | `OUVERTE` | — |

---

## Réserves déjà levées — pour mémoire

| Réserve d'origine | Levée par |
|---|---|
| Les variations de provisions techniques n'entraient pas au résultat | STORY-518 (`@2.0`) — en agrégat seulement, voir R-18 |
| Les cessions `609` / `709` étaient compensées dans `RC1` / `RP1` | STORY-520 (`@3.0`) |
| Pas de séparation Vie / Non-Vie | STORY-521 (`@4.0`) |
| `80` capté par les racines de gestion — base imposable exactement doublée | STORY-522 (`@5.0`), porte du générateur |
| Niveau de détail du plan jamais déclaré | STORY-512 (`longueurCompteDetail: 6`) |
| Provision calculée et provision saisie indiscernables au contrat | STORY-519 (`origine`, `methodeServie`) |
| « Règlement CIMA 2024 » sur la vie introuvable | STORY-540 M7 — obtenu : n° 02/2024, voir R-38 |
| Statut annoncé `a-valider-par-expert` au lieu de `amorce` | STORY-540 M2 — la story se corrige, l'artefact n'avait pas à l'être |
