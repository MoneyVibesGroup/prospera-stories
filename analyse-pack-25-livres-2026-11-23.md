# Analyse du pack de 25 livres comptables

> **Date :** 2026-11-23 · **Demandé par :** l'utilisateur (Dev B) : « dis-moi s'il y a des trucs nouveaux, intègre ce
> qui est utile »
> **Lu par :** le PO, et toute session qui ouvrira la comptabilité générale, la défense en contrôle fiscal, l'analyse
> financière ou les ONG
> **Source :** dossier `PACK DE 25 LIVRES COMPTABLES` (à la racine de `MoneyVibes_Apps`, non versionné) : 25 PDF,
> environ 2 800 pages, lus en entier ou par recherche ciblée pour les plus longs (livres 10 et 22)

## 1. Verdict

**Le pack apprend peu de choses à Prospera, mais six points valent d'être gardés.**

- **14 livres sur 25 sont de la prose générique** : aucun chiffre, aucun article de loi, presque aucun numéro de
  compte, des chapitres qui se renvoient l'un à l'autre. Ils sont très probablement générés. Ce sont les livres 01, 02,
  03, 04, 07, 09, 13, 14, 15, 17, 19, 21, 24 et 25.
- **Aucun livre ne porte sur le Togo.** Les livres sérieux viennent d'ailleurs : Maroc (05, 23), Cameroun (06, ancien
  plan), Belgique (10), RD Congo (11), Congo-Brazzaville (16, 18). Le livre 12 est le modèle OHADA de **1998**, d'avant
  la révision de 2017.
- Ce qui est utile a été **transformé en fichiers de référentiel** (§3) et vérifié à la source quand c'était possible.

## 2. Qualité de chaque livre

| Livre | Sujet | Origine | Verdict |
|---|---|---|---|
| 01 | Fondamentaux | générique | vide ; présente encore **trois** systèmes comptables (le système allégé a disparu en 2017) |
| 02 | Cadre SYSCOHADA | générique | vide ; ni article ni seuil |
| 03 | Plan de comptes | générique | presque aucun numéro de compte ; deux idées de contrôle (classe 8 récurrente, comptes de liaison) |
| 04 | IFRS et SYSCOHADA | générique | aucune norme IFRS nommée ; utile seulement pour le principe d'un « pont » de retraitements |
| 05 | Opérations courantes | Maroc (plan CGNC, dirhams, TVA 20 %) | à ne pas utiliser |
| 06 | Immobilisations | Cameroun, ancien plan SYSCOHADA | principes justes, comptes datés |
| 07 | Stocks | générique | vide |
| 08 | Comptes de paie | une page | plan en désordre : ne pas reprendre |
| 09 | Devises | générique | aucun compte, aucun chiffre |
| 10 | Marchés financiers | brochure d'un courtier belge | hors sujet (rien sur la BRVM) |
| **11** | **Travaux de fin d'exercice** | séminaire CPCC, RD Congo, 2017 | **sérieux**, SYSCOHADA révisé, exemples chiffrés justes |
| 12 | États financiers modèles | JO OHADA, modèle 1998 | sérieux mais **daté** |
| 13 | Annexe | générique | cite le TAFIRE, remplacé en 2017 |
| 14 | Consolidation | générique | n'apporte rien : le paquet `consolidation-audcif@1.5` de `bilan-service` couvre déjà consolidés et combinés, sur le texte officiel |
| 15 | Fiscalité africaine | générique | tableaux « variable selon le pays », aucun taux |
| **16** | **TVA et facturation** | Congo-Brazzaville (CEMAC) | précis, mais hors UEMOA |
| 17 | IS et liasse | générique | aucun taux |
| **18** | **Contrôle fiscal** | Congo-Brazzaville | bon plan, délais **faux pour le Togo** (§4) |
| 19 | PME et informel | générique | vide (rien sur la reconstitution, les tontines, TMoney/Flooz) |
| **20** | **ONG (SYCEBNL)** | cours IPP Dakar, 2023 | court mais fiable : **seule matière sur un sujet où le produit n'a rien** |
| 21 | Comptabilité sectorielle | générique | définitions seulement |
| **22** | **Audit et commissariat aux comptes** | guide professionnel, ISA 2015 + AUSCGIE | **le plus dense et le plus utile** |
| 23 | Contrôle de gestion | cours marocain (dirhams) | méthodes transposables (budget de trésorerie, coûts) |
| 24 | Logiciels comptables | générique | aucun nom de logiciel ni prix ; quelques exigences de sécurité |
| 25 | Transformation digitale | générique | aucun fait concret |

## 3. Ce qui a été intégré

| Apport | Livre | Fichier | Pour quel module |
|---|---|---|---|
| ONG et associations — **complété par quatre sources fournies ensuite par l'utilisateur** : le Journal officiel OHADA du 22/02/2023, le guide d'application, le projet de 2021 et plan-comptable-ohada.com | 20 + sources officielles | [`cadrage-ong-sycebnl-2026-11-23.md`](cadrage-ong-sycebnl-2026-11-23.md) ; `acte-sycebnl-articles.json`, `etats-sycebnl-associations.json`, `etats-sycebnl-projets-smt.json`, `plan-comptable-sycebnl.json`, `sycebnl-amorce.json` | nouveau vertical (rien aujourd'hui) ; le paquet des associations devient constructible |
| Alertes juridiques et contrôles d'intégrité sur la balance | 22, 03, 11, 12 | [`referentiels/controles-balance-ohada.json`](referentiels/controles-balance-ohada.json) | `bilan-service` (analyse), comptabilité générale, IA d'anomalie, dossier de prêt |
| Contrôle fiscal et contentieux du Togo, en machine à états | 18 (plan) + **LPF togolais** (délais) | [`referentiels/procedure-controle-fiscal-togo.json`](referentiels/procedure-controle-fiscal-togo.json) | défense de la liasse (AB-07), conseil fiscal |
| Écritures de clôture du SYSCOHADA révisé et cas chiffrés recalculés | 11 | [`referentiels/ecritures-cloture-syscohada-revise.json`](referentiels/ecritures-cloture-syscohada-revise.json) | `comptabilite-service` (EPIC-111 → 120) : jeux de tests |
| Pièces à obtenir (SYCEBNL officiel, AUSCGIE à recouper) | 20, 22 | [`referentiels/documents-a-fournir.md`](referentiels/documents-a-fournir.md) (F.4, H2) | — |

### Les trois apports les plus rentables

1. **Capitaux propres inférieurs à la moitié du capital** (AUSCGIE 371-373 pour la SARL, 664-669 pour la SA). Le
   contrôle se calcule depuis la liasse déjà produite et la forme juridique déjà portée par `dossier-service`. Il donne
   au cabinet une **échéance légale** à annoncer au client (décision des associés dans les 4 mois après l'approbation
   des comptes) et répond à la première question d'un banquier. C'est le lien direct avec l'assistance aux prêts
   bancaires, le service que les cabinets disent le plus demandé.
2. **La procédure de contrôle fiscal togolaise en machine à états**, avec ses délais : un module « contrôle fiscal en
   cours » qui compte les jours à la place du cabinet et vérifie la régularité de la procédure (avis de vérification
   7 jours avant, durée sur place plafonnée sous peine de nullité).
3. **Le cadrage ONG** : le seul vertical sans rien, des clients réels pour les cabinets. Avec le Journal officiel
   fourni ensuite, les postes et la table de passage officielle des associations sont extraits : le paquet
   `sycebnl@1.0` est constructible.

## 4. Pièges trouvés dans les livres (à ne pas reprendre)

- **Délais de contrôle fiscal congolais (livre 18) ≠ Togo.** Vérifié dans le LPF togolais : réponse à un redressement
  **45 jours** (30 au Congo), avis de vérification **7 jours** avant (5 au Congo), reprise **3 ans** (4 au Congo).
  Coder le livre 18 aurait donné des échéances fausses.
- **Trois systèmes comptables** (livre 01) : faux depuis 2017. Il n'en reste que deux, Normal et Minimal de trésorerie.
- **TAFIRE et codes de postes de 1998** (livres 12 et 13) : AA charges immobilisées, AX frais d'établissement, AY
  charges à répartir… n'existent plus. Un cabinet peut encore envoyer une vieille liasse dans ce format : il faut la
  refuser ou la convertir, jamais la lire avec la table de passage révisée.
- **Coefficients d'amortissement dégressif** donnés pour la France, le Maroc, la RDC et le Cameroun, jamais pour le
  Togo.
- **Livre 11, pourtant le meilleur** : reprises de dépréciation imputées à 492 au lieu de 491 (créances) et à 594 au
  lieu de 593 ; deux conventions de prorata incompatibles (en mois et en jours) ; une annuité pleine passée là où le
  livre exige le prorata. Les 13 cas chiffrés de `ecritures-cloture-syscohada-revise.json` ont été recalculés : 12
  tombent juste, le treizième (`CDT-AMORT-01`) porte l'écriture corrigée.
- **Plan de comptes de paie du livre 08** : numérotation décalée. **Compte « 4434 »** du livre 16 : douteux.
- **Livre 04** : affirme que le SYSCOHADA révisé « n'impose pas » l'approche par composants ; c'est discutable (à
  vérifier dans le texte révisé avant de s'en servir).

## 5. Notes gardées sans fichier

- **Facturation (livre 16).** Ordre de calcul fixe : remises, TVA, taxes additionnelles, TTC, puis escompte de
  règlement (qui ne change pas la base de TVA). Une remise après facture passe par un avoir qui régularise la TVA.
  En zone CEMAC existent des **centimes additionnels** égaux à 5 % du montant de la TVA, non récupérables chez
  l'acheteur : un type de taxe adossée à une autre taxe que le paquet fiscal ne sait pas porter. À prévoir le jour où
  la CEMAC s'ouvre, inutile pour l'UEMOA.
- **Dossier de prêt bancaire (livre 23).** Le budget de trésorerie mensuel (encaissements, décaissements, TVA à
  décaisser, solde cumulé) et la marge sur coût variable sont les deux tableaux qu'un banquier attend, à côté du
  bilan prévisionnel que Prospera produit déjà.
- **Sécurité du logiciel (livre 24).** Quatre niveaux de droits (consultation, saisie, validation et clôture,
  administration), journal de chaque action, inaltérabilité par **extourne tracée**, jamais par modification, et
  **test périodique de restauration** des sauvegardes. Ce dernier point manque souvent : à vérifier dans le plan de
  la comptabilité générale.
- **Audit (livre 22, ISA 530).** Un traitement automatisé autorise l'examen à 100 % de la population au lieu d'un
  échantillon : argument commercial pour les contrôles de Prospera auprès des cabinets qui font du commissariat aux
  comptes.

## 6. Ce que le pack ne contient pas

Les taux et seuils des autres pays de l'UEMOA ; la facture électronique (MECeF au Bénin, FNE en Côte d'Ivoire) ; la
durée légale de conservation des documents ; les seuils de désignation d'un commissaire aux comptes en SARL et en SAS ;
les secteurs BTP, hôtellerie, transport et immobilier. (L'état des emplois et ressources des ONG, absent du pack, est
désormais couvert par le Journal officiel et le guide d'application.)

## 7. Suite recommandée

1. **Contrôle « capitaux propres < ½ capital »** dans `bilan-service`, à côté de l'analyse financière (STORY-552) :
   une story, entrées déjà disponibles. À réserver dans la plage du groupe qui tient `bilan-service`.
2. **Les quatre contrôles d'intégrité** (FRNG = BFR + TN, caisse créditrice, amortissements > brut, perte de change
   sans provision) : une story, même endroit.
3. **Machine à états du contrôle fiscal** : à placer dans le pack cabinet (module de conseil fiscal), après février.
4. **ONG** : les sources officielles sont extraites ; la story de paquet `sycebnl@1.0` (associations) peut s'écrire
   dès que le PO place le vertical (Q1 du cadrage).
5. **Comptabilité générale** : brancher `ecritures-cloture-syscohada-revise.json` comme jeux de tests dès la première
   story de clôture.
