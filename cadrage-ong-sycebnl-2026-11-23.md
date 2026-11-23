# Cadrage — les ONG et associations (SYCEBNL)

> **Date :** 2026-11-23 · **Demandé par :** l'utilisateur (Dev B), après l'analyse du pack de 25 livres comptables
> **Lu par :** le PO, puis la session qui écrira le PRD ou les épics
> **Statut :** cadrage. Aucune story, aucun identifiant réservé : les plages se réservent au découpage, selon le plan
> des sessions en vigueur.

## 0. Sources et fichiers

| Source | Nature | Ce qu'on en a tiré |
|---|---|---|
| **Journal officiel OHADA, numéro spécial du 22 février 2023** (`SYSCEBNL.pdf`, 438 p., scanné) | **texte officiel** de l'Acte uniforme et de son annexe | articles de l'Acte, modèles d'états et tables de correspondance (§ 9) |
| Guide d'application SYCEBNL (`SYCEBNL-GUIDE-D-APPLICATION.pdf`, 37 p., avril 2023) | 22 cas pratiques corrigés | mécanismes, cas de test, tableau emplois-ressources avec formules |
| plan-comptable-ohada.com/sycebnl | site non officiel : Acte (art. 1 à 28) et plan de comptes | plan complet (1 130 comptes), dates, seuils, liste des notes |
| Projet ONEC de 2021 (`…SYCEBUNOL-PROJET-ONEC.pdf`, 386 p.) | projet antérieur au texte final | aide de lecture, écarts avec le texte final |
| Livre 20 du pack (cours IPP 2023) | 49 diapositives | premier cadrage |

Fichiers produits dans [`referentiels/`](referentiels/) : `sycebnl-amorce.json` (règles, mécanismes, tableau
emplois-ressources, 6 cas chiffrés équilibrés, écarts entre sources), `plan-comptable-sycebnl.json` (**1 130 comptes**,
9 classes, contrôlés par classe), et les fichiers tirés du Journal officiel (§ 9).

## 1. Pourquoi maintenant

Les ONG sont le seul vertical comptable qui n'a **rien** dans Prospera : ni type d'entité, ni référentiel, ni épic, ni
plage réservée (vrai sur `origin/dev` le 2026-11-23). Les deux autres verticaux exclus du SYSCOHADA ont leur paquet
(`sfd-bceao@2.0`, `cima-assurances@7.0`).

Pour un cabinet togolais, les associations, églises, mosquées, fondations et projets financés par des bailleurs sont
des clients réels. Leur besoin ne ressemble pas à celui d'une PME : elles rendent des comptes **à chaque bailleur**
avant de les rendre au fisc.

## 2. Ce que dit la norme

**Un référentiel à part, obligatoire depuis le 1er janvier 2024.** L'AUDCIF (art. 5) exclut les entités à but non
lucratif du SYSCOHADA. L'Acte uniforme SYCEBNL a été adopté le 22 décembre 2022, publié au Journal officiel le
22 février 2023, et s'applique depuis le 1er janvier 2024 (art. 28).

**Deux familles d'entités, deux jeux d'états (art. 4).**

| Famille | Qui | États annuels | Amortissement |
|---|---|---|---|
| Associations et ordres professionnels | associations, fondations, organisations religieuses, ordres professionnels | bilan, compte de résultat, tableau des flux de trésorerie, notes | oui, compensé par la reprise du fonds qui a financé le bien |
| Projets de développement | entités qui gèrent un projet financé par des bailleurs | **tableau emplois-ressources**, **tableau d'exécution budgétaire**, tableau de réconciliation de trésorerie, bilan, compte d'exploitation, notes | **non** (art. 7, 9, 11) |
| Système minimal de trésorerie | petites entités des deux familles | bilan, compte de résultat, notes 1 à 5 (dont un journal unique de trésorerie) | — |

**Taille mesurée par type de ressource (art. 6).** Une entité relève du SMT, sauf option, si **chacune** de ses
ressources (subventions ; cotisations et autres revenus ; dons et legs ; ressources de projet ; autres) est au plus de
**30 millions FCFA**. Elle passe au Système normal si l'une dépasse ce seuil, ou si « de manière cumulée sur deux
exercices » les ressources dépassent 30 millions. Cette dernière phrase est ambiguë ; choix par défaut proposé :
basculer si une ressource dépasse 30 M dans l'exercice, ou si le total dépasse 30 M deux exercices de suite, en
affichant la règle appliquée.

**Auditeur obligatoire (art. 19)** dès qu'un critère est atteint à la clôture : total du bilan > 100 M FCFA,
ressources annuelles > 200 M FCFA, ou effectif permanent > 20 personnes. L'obligation cesse quand aucun critère
n'est rempli pendant les deux exercices qui précèdent la fin du mandat ; 10 % des membres peuvent demander en justice
la nomination d'un auditeur. Les états et le rapport de gestion lui sont transmis **45 jours au moins** avant
l'assemblée ou avant la transmission de son rapport aux bailleurs. Le dépôt des états relève du droit de chaque État
(art. 5) : l'Acte ne fixe ni délai d'établissement, ni délai d'approbation, ni durée de conservation. *(art. 5, 6 et
19 vérifiés sur l'image du Journal officiel, p. 17 et 22.)*

**Registre des donateurs (art. 17)** pour tout don, donation et legs : date, identité complète du donateur (avec NIF
et immatriculation pour une personne morale), montant, mode de libération. Signé par le représentant légal, tenue
électronique admise, vérifié par l'auditeur (art. 18). **C'est une fonction logicielle à part entière.**

**Un plan de 1 130 comptes en 9 classes**, avec des comptes propres : dotations (101 sans droit de reprise, 102 avec,
104 consomptible), droit d'entrée (103), fonds affectés et dons et legs d'immobilisations (16x), fonds reportés (17x),
apporteurs (45x par type d'entité : associations, fondations, ordres, partis, syndicats, organisations religieuses,
mécènes et bénévoles), bailleurs et fonds d'administration (462 bailleurs, 463 État, 464 autres), revenus de la
générosité (704x : dons, legs, deniers du culte, zakat, dîme et quête, célébrations, mécénat, parrainage), reprises de
fonds (79x). La **classe 9** porte les contributions volontaires en nature (900-904 emplois, 910-914 contreparties).

## 3. Les mécanismes qu'un logiciel doit porter

1. **Neutralisation des charges financées par des fonds dédiés.** Une charge payée par un bailleur ou une dotation
   consomptible est compensée par un produit de transfert (702, 703) ou une reprise de fonds (7923, 7925, 7961, 7962,
   799). Le résultat d'un projet est nul par construction ; le résultat d'une association ne bouge pas quand elle
   amortit un bien reçu en legs.
2. **Fonds reçus mais pas encore dépensés.** Ils restent au passif (165 fonds affectés, 162 fonds d'investissement des
   projets) et passent en produit au rythme des dépenses. En fin d'exercice, les fonds d'investissement non consommés
   d'un projet passent de 162 à 165, extournés au 1er janvier.
3. **Suivi par bailleur.** Le guide d'application propose de **suffixer le numéro de compte** par un identifiant de
   bailleur ou de sous-projet (245125 et 625225 pour le bailleur 25) ; dans ce cas, des **états combinés** sont
   obligatoires. Le plan sépare aussi les origines (462 / 463 / 464, 162 / 163 / 164) et la note 9 des projets porte
   les « fonds du bailleur ».
4. **Contributions volontaires en nature.** Bénévolat, prêt de locaux, dons de biens : enregistrés en classe 9 s'ils
   sont significatifs et valorisables, avec une pièce par contribution ; ni trésorerie ni résultat ; présentés en
   note 1. Le bénévolat sans compétence particulière se valorise au **SMIG horaire du pays**.
5. **Le tableau emplois-ressources se calcule depuis la balance.** Le guide donne pour chaque poste (FA → FZ,
   GR → GZ) la formule en mouvements et soldes des balances N et N-1, avec un contrôle final (encaisse calculée =
   trésorerie au bilan). **Il entre dans la mécanique actuelle de Prospera (balance → postes) sans comptabilité
   générale** — à condition que la trésorerie soit ventilée par origine de fonds.
6. **Le tableau d'exécution budgétaire** compare, ligne par ligne du budget : budget, décaissé, engagé, réalisé,
   disponible, taux d'exécution. Il demande la **saisie du budget** et des engagements hors comptabilité (bons de
   commande, contrats signés).

## 4. Ce que le produit a déjà, et ce qui manque

| Brique | Aujourd'hui | Pour les ONG |
|---|---|---|
| Type d'entité (`dossier-service`, `TypeEntite`) | `ENTREPRISE`, `MICROFINANCE`, `ASSURANCE` | ajouter `EBNL` + une famille (association / projet), et la résolution de référentiel (`resolution-referentiel.util.ts`, exhaustive à la compilation) |
| Forme juridique (`FormeJuridique`) | SA, SARL, SAS, SUARL, EI, AUTRE | ajouter association, fondation, organisation religieuse, ordre professionnel, projet |
| Pont des tags de balance (`balance-service`, `PONT_TAG`) | SN, SMT, SFD-BCEAO, CIMA | ajouter un tag `SYCEBNL` |
| Paquet de référentiel (`bilan-service`) | SYSCOHADA, SMT Togo, SFD, CIMA, consolidation, zone franche | **aucun** paquet SYCEBNL ; le `_meta` existant (`zoneComptable: "OHADA"`, `statut`) suffit |
| Bascule SN/SMT | au chiffre d'affaires | par type de ressource (art. 6) |
| Classe 9 | engagements hors bilan, analytique | contributions volontaires en nature |
| Budget | rien (le prévisionnel est un bilan prévisionnel) | budget par projet et par ligne, engagements |
| Registre des donateurs | rien | registre signé, exportable pour l'auditeur |
| Fiscalité | IS, MFP, TVA | régime des associations au Togo à sourcer |

## 5. Découpage proposé (épics candidats, non numérotés)

1. **Paquet `sycebnl@1.0`, famille « associations »** depuis le Journal officiel : plan, postes, table de passage,
   contrôles (fichiers du § 9, déjà extraits). *Une story de référentiel, comme STORY-057 pour la SFD ; ses sources
   sont réunies.*
2. **Type d'entité EBNL et formes juridiques** dans `dossier-service`, résolution de référentiel, tag de balance. Tant
   que le paquet manque, refus explicite en 409 (comme le SMT) plutôt qu'un calcul faux sur le plan entreprise.
3. **Projets de développement** : tableau emplois-ressources (calculable depuis la balance), compte d'exploitation,
   tableau de réconciliation de trésorerie.
4. **SMT des EBNL** avec la règle de taille par ressource.
5. **Suivi par bailleur** : suffixe de compte ou axe d'analyse (Q3), états combinés.
6. **Budget et tableau d'exécution budgétaire.**
7. **Registre des donateurs.**
8. **Contributions volontaires en nature** (classe 9, note 1).
9. **Fiscalité des associations au Togo.**

Les étapes 1 et 2 donnent un produit vendable à un cabinet qui tient des associations et des églises ; les étapes 3,
5 et 6 en font un produit pour les ONG financées par des bailleurs, qui est le vrai marché.

## 6. Questions au PO (avec le choix retenu par défaut)

| # | Question | Choix par défaut |
|---|---|---|
| Q1 | Les ONG entrent-elles au programme, et à quel rang ? | Après février 2027 (expert-comptable, distributeur, assurance et IMF passent avant) ; l'étape 1 peut démarrer plus tôt, ses sources sont maintenant réunies. |
| Q2 | Un type d'entité EBNL, ou deux (association / projet) ? | Un type `EBNL` et une **famille** en attribut : le plan est commun, les états diffèrent. |
| Q3 | Suivi par bailleur : suffixe dans le numéro de compte, ou axe d'analyse de l'écriture ? | **Accepter le suffixe à l'import** (c'est la pratique recommandée par le guide et ce que les cabinets saisissent déjà dans leurs logiciels) et le traiter comme un axe : la balance d'une ONG arrive avec des comptes suffixés, Prospera reconnaît le compte racine pour la table de passage et le suffixe pour les états par bailleur. |
| Q4 | Le SMIG horaire du bénévolat : saisi par le cabinet ou tiré du paquet paie ? | Tiré du paquet du pays (SMIG togolais), modifiable par dossier. |

## 7. Pièces encore utiles

- Un jeu réel d'états ou de balance d'une ONG togolaise ou d'un projet financé (pour tester la table de passage).
- Un rapport financier type exigé par un bailleur (Union européenne, AFD, USAID, Banque mondiale).
- Les dispositions fiscales togolaises applicables aux associations et ONG.

## 8. Écarts entre sources (à ne pas reprendre sans vérifier)

Le livre 20 parle d'un compte « 46 Fonds d'administration » : c'est 462 (bailleurs), 463 (État), 464 (autres). Le
guide cite des comptes absents du plan publié (192, 4751) ou numérotés autrement (8311, 8421, 70410 à 70442), et deux
erreurs de calcul ou d'imputation. Détail dans `sycebnl-amorce.json`, clé `ecartsEntreSources`.

## 9. Ce que le Journal officiel ajoute

Les pages scannées ont été lues en image le 2026-11-23 et transcrites dans trois fichiers. Un échantillon a été
recontrôlé à la main sur l'image (articles 6 et 19, table de correspondance du bilan p. 395).

| Fichier | Contenu | Couverture |
|---|---|---|
| [`acte-sycebnl-articles.json`](referentiels/acte-sycebnl-articles.json) | les **28 articles** de l'Acte, texte transcrit, articles utiles marqués | complet ; adopté à Niamey le 22/12/2022 |
| [`etats-sycebnl-associations.json`](referentiels/etats-sycebnl-associations.json) | bilan actif (30 postes), passif (29), compte de résultat (27), flux de trésorerie (25), 45 notes, **table de passage officielle** du bilan et du compte de résultat (65 postes de détail, tous couverts), 16 contrôles imprimés | le TFT n'a pas de table de correspondance au JO |
| [`etats-sycebnl-projets-smt.json`](referentiels/etats-sycebnl-projets-smt.json) | projets : tableau emplois-ressources (35 postes), exécution budgétaire, réconciliation de trésorerie (9), bilan (39), compte d'exploitation (19), 26 notes, table de passage du bilan et du compte d'exploitation ; SMT : bilan (11), compte de résultat (16), 5 notes | pas de table au JO pour le tableau emplois-ressources, la réconciliation et le SMT |

**Ce que le texte officiel change dans le cadrage :**

- **Le paquet `sycebnl@1.0` des associations peut être construit dès maintenant** : postes et table de passage
  officielle du bilan et du compte de résultat sont là, avec le plan complet. C'est la même matière que celle qui a
  servi au paquet SYSCOHADA. Reste à reprendre les comptes « pour partie » (suffixe « p » du Journal, perdu à
  l'extraction : voir les alertes du fichier) et à relire les libellés.
- **Le tableau emplois-ressources n'a pas de formules officielles.** Ses 35 codes sont confirmés, mais les formules de
  calcul depuis la balance viennent du seul guide d'application. Elles sont utilisables comme règle par défaut,
  affichée et contestable, pas comme norme.
- **Les dettes sont des soldes créditeurs** dans la table officielle du bilan : le « solde débiteur » du guide pour
  les comptes 401 et 44 est une erreur probable du guide.
- **Écarts avec le projet de 2021** (utile si un cabinet a commencé sur le projet) : le seuil d'audit passe de « deux
  critères sur trois, effectif 30 » à « un critère, effectif 20 » ; la classe 9 passe de 96/97 à 90/91 ; les fonds
  affectés ne passent plus par une charge 692 à la clôture mais directement de la trésorerie au 165 ; l'« état des
  dépenses et ressources » unique des projets est remplacé par six états ; la première année, le bilan n'exige que
  la colonne N-1 d'ouverture.
- **Partie 3 du Journal** : une subvention d'investissement qui finance un bien non amortissable se reprend sur la
  durée d'inaliénabilité du contrat, à défaut **sur 10 ans sans prorata** ; la réévaluation partielle est interdite ;
  le droit d'entrée est soit un dépôt (1851), soit un produit (701), au choix écrit dans les notes ; à la fin d'un
  projet, les immobilisations sortent par le débit des comptes 162 à 164.
- **Anomalies du Journal à ne pas corriger en silence** : codes TJ et TK imprimés deux fois dans le compte
  d'exploitation des projets ; le total XA des associations est imprimé « somme RA à RG » et exclut les reprises
  (RH) ; la colonne « Note » des projets est décalée d'un rang. Toutes sont listées dans les fichiers.
