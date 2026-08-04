---
title: "PRD — Fiscalité (module Prospera Expert-Comptable)"
status: draft
created: 2026-07-31
updated: 2026-08-03
version: "0.3"
---

# PRD — Fiscalité

**Module** de Prospera Expert-Comptable, aux côtés de l'Atelier Balance et du Bilan.
**Service candidat :** `fiscal-service` (Module 3, re-scopé le 2026-07-12 puis redéfini ici).
**Version :** v0.3 — intègre le type d'entité comme dimension de premier rang et les décisions PO du
2026-08-03. La v0.2 corrigeait les constats de la revue (`review-rubric.md`, `review-adversarial.md`).

> **Identifiants figés depuis la v0.2.** FR-F01→F78 et NFR-F01→F16 ne sont jamais renumérotés ; une
> exigence retirée garde son numéro et porte la mention *retirée*, une exigence nouvelle prend le numéro
> libre suivant.

---

## 1. Le problème

Un cabinet d'expertise comptable qui accompagne une centaine d'entreprises ne fait pas « de la
comptabilité ». Il tient une chaîne :

> Collecte des pièces → Saisie → Contrôle → Réconciliation → Clôture → Bases fiscales → Calcul de
> l'impôt → Préparation des déclarations → Validation → Dépôt administratif → Règlement → Archivage →
> Suivi des contrôles

Pour chaque client, il doit pouvoir répondre à cinq questions : **quoi déclarer, combien, quand, qui en
est responsable, et comment prouver que ça a été fait.**

Prospera sait aujourd'hui répondre à « combien » — c'est le moteur fiscal de `balance-service`
(EPIC-023/024). Il ne sait répondre à aucune des quatre autres. Concrètement, le cabinet garde son
calendrier dans un tableur, ses accusés dans une boîte mail, ses mots de passe de portail dans un carnet,
et il n'a aucun moyen de reconstituer, deux ans après, comment un montant déclaré a été obtenu.

Ce dernier point est le vrai risque. En contrôle, l'administration ne demande pas seulement si le montant
est juste : elle demande **comment il a été obtenu**. Un cabinet qui ne peut pas remonter la chaîne
`montant déclaré → calcul → balance → journal → factures → pièces` est en difficulté même quand il a
raison.

### Ce que la conformité coûte quand elle échoue

Le corpus LPF togolais chiffre le risque : majorations de **30 / 40 / 80 %** selon la gravité, amendes
propres à la facture normalisée et à la caisse. Une déclaration déposée en retard, un règlement imputé
sur la mauvaise période, une pièce justificative absente — ce sont des pertes sèches, et elles se
produisent aujourd'hui par défaut d'outillage, pas par incompétence.

---

## 2. Vision

> **Prospera transforme les données comptables d'une entreprise en obligations fiscales calculées,
> validées, déposées et traçables — pays par pays.**

Le positionnement n'est pas « Prospera calcule vos impôts ». Le calcul est la partie standardisable, donc
la moins défendable. L'avantage concurrentiel est la **preuve** : un expert-comptable doit pouvoir ouvrir
un dossier client et voir toutes ses obligations depuis son entrée en portefeuille — ce qui a été
calculé, par qui, ce qui a été modifié et pourquoi, qui a validé, quand c'est parti à l'administration,
l'accusé, le règlement, et l'ensemble des pièces qui justifient le montant.

**Le principe structurant du produit :** la comptabilité et le calcul fiscal sont largement
standardisables ; la **conformité** ne l'est pas. Dès qu'on atteint le portail, les pièces, la signature
et le paiement, chaque pays impose ses règles et ses contraintes opérationnelles. Toute l'architecture du
module découle de cette ligne de partage.

Ni CassKai ni KiboERP, les deux comparables identifiés sur la zone OHADA, ne sont positionnés sur la
preuve de dépôt et la piste d'audit inter-pays.

---

## 3. Périmètre

### 3.1 Les quatre niveaux

| Niveau | Contenu | Statut v1 |
| --- | --- | --- |
| **N1 — Préparation** | Récupérer les données comptables, calculer, contrôler, détecter les anomalies, préparer la déclaration, générer le livrable | **Obligatoire** |
| **N2 — Validation** | Collaborateur prépare → expert-comptable contrôle → validation du client capturée comme preuve | **Obligatoire** |
| **N3 — Dépôt** | Produire le livrable au format exact, guider le dépôt, récupérer l'accusé, archiver la preuve, mettre à jour le statut | **v1 en mode assisté** |
| **N4 — Règlement de l'impôt** | Calculer le montant dû, générer l'ordre ou les instructions, rapprocher, enregistrer la référence, suivre le statut | **Préparation oui, exécution non** |

### 3.2 Dépôt assisté, pas automatisé — et pourquoi

Aucun des portails de la zone n'expose d'API publique documentée : GUDEF (`gudef.otr.tg`),
e-services OTR, eSINTAX (Burkina), e-impôts (Côte d'Ivoire), SEN-ETAFI (Sénégal) sont des portails web
avec authentification et souvent MFA. Un dépôt « automatisé » signifierait piloter un navigateur sur un
système tiers avec les identifiants d'un client — fragile (toute évolution du portail casse le
connecteur) et exposé du point de vue des conditions d'utilisation.

La v1 livre donc le **dépôt assisté** : Prospera produit le livrable au format national exact,
pré-remplit ce qui peut l'être, guide le déposant pas à pas, puis récupère l'accusé (téléversement du
document ou saisie de la référence) et l'archive contre la déclaration. Cela donne **la totalité de la
valeur de preuve** sans dépendre d'un connecteur. Les connecteurs automatisés viennent ensuite, portail
par portail, et chacun se justifie par son volume.

**Deux conséquences assumées.** Le coffre-fort d'identifiants n'est pas sur le chemin critique de la v1 —
il le devient au premier connecteur. Et le produit **ne détient pas le dernier maillon du dépôt**, ce qui
détermine la façon dont son succès se mesure (§10).

### 3.3 Le règlement n'est pas le dépôt

Deux chaînes distinctes, juridiquement et techniquement :

| Chaîne fiscale | Chaîne financière |
| --- | --- |
| Calcul · Préparation · Signature · Dépôt | Ordre de paiement · Validation bancaire · Débit |

Le règlement effectif peut exiger le compte bancaire du client, une authentification forte, un OTP, la
validation du dirigeant, une signature électronique, une autorisation bancaire. **Le cabinet ne doit
jamais supposer qu'il peut payer à la place de son client.** Prospera prépare, rapproche et prouve ; il
n'exécute pas — sauf si un mandat légal *et* technique l'autorise, pays par pays, ce qui sera traité
comme une extension et non comme le défaut.

### 3.4 Hors périmètre v1

- Exécution automatique d'un règlement fiscal.
- Connecteurs de dépôt automatisés (v1.x, portail par portail).
- **Les familles de calcul non supportées en v1** (§7.3) : taxes spécifiques à l'unité physique, taxes
  par acte, taxes assises sur la valeur locative. Concrètement, cela laisse hors v1 les droits d'accises
  pétroliers, les droits d'enregistrement, la patente et la taxe foncière.
- Logiciel de paie complet : bulletins, congés, soldes de tout compte, déclarations sociales nominatives.
- Portail douanier et portail social au sens « connecteur ».
- Facturation électronique certifiée (§12, risque réglementaire).
- Accès applicatif pour la société cliente (§5).

---

## 4. Frontières avec l'existant

Le module s'insère dans un système déjà livré. Ces frontières sont des engagements, pas des indications.

| Brique existante | Ce qu'elle garde | Ce que `fiscal-service` prend |
| --- | --- | --- |
| `balance-service` — moteur fiscal (EPIC-023/024) | **Tout le calcul** : résultat fiscal et codes DSF, `IS = max(MFP, IS)` + acomptes, TVA et taxes, provisions, TPU, scénarios d'optimisation et dossier de justification | Rien du calcul. `fiscal-service` **consomme** ces résultats |
| `balance-service` — contrat canonique (STORY-101) | La balance, sa clé, son immuabilité, son statut de preuve | Ajoute la dimension **implantation fiscale** (§6.2) |
| `bilan-service` | Production de la liasse et de la DSF, validation figée, prévisionnel, export — **y compris le contenu du livrable GUDEF** | L'**emballage** du livrable pour le canal, le dépôt, l'accusé et la preuve. `fiscal-service` ne reproduit jamais une liasse |
| `document-service` | Stockage, OCR, URL présignées, date et statut par pièce | Le rattachement d'une pièce à une **obligation** |
| `platform-catalog-service` + admin-panel | Packaging et versionnement des référentiels et paquets fiscaux (D12) | Le **catalogue d'obligations** dérivé du paquet (§7.2) |
| App expert-comptable (FE-EPIC-008) | Portefeuille de dossiers, dossier actif, RBAC, affectation aux collaborateurs | Les surfaces fiscales, scopées `/dossiers/:id/…` |

**Règle de partage du livrable de dépôt :** le service qui *produit le contenu* n'est pas celui qui
*porte le dépôt*. La DSF est produite par `bilan-service` (EPIC-010/011, déjà livrés) ;
`fiscal-service` l'obtient, la met au format attendu par le canal, la dépose et en conserve la preuve.
Toute autre déclaration dont le contenu n'existe nulle part ailleurs est produite par `fiscal-service`.

**Le moteur de calcul est déjà multi-pays par construction** — ce n'est pas une intention, c'est vérifié :
STORY-078 charge le paquet fiscal keyé pays × année ; STORY-080 lit ses seuils *dans le paquet*
(`plafondCA`), rien n'est codé en dur (NFR-A06). Ce PRD n'a donc pas à reconstruire un moteur de règles
par pays : il a à **le remplir** et à bâtir tout ce qui l'entoure.

---

## 5. Personas

Deux opérateurs, conformément au PRD Atelier Balance validé. La société traitée est un **dossier client**,
pas un utilisateur.

| Persona | Rôle |
| --- | --- |
| **Collaborateur de cabinet** | Prépare les déclarations des dossiers qui lui sont affectés, saisit, corrige, soumet au contrôle |
| **Expert-comptable** *(nouveau rôle interne)* | Contrôle, valide, engage sa responsabilité, dépose. Voit tout le portefeuille |
| **Admin de cabinet** | Crée les dossiers, affecte les collaborateurs, paramètre les implantations et les mandats |
| **Admin plateforme (MoneyVibes)** | Publie et versionne les paquets fiscaux et les gabarits, suit la conformité réglementaire |

**La société cliente n'a pas d'accès applicatif en v1.** Sa validation et son mandat existent dans le
système en tant que **pièces déposées** — PDF signé, courriel, ou mention manuelle horodatée et attribuée
— jamais en tant qu'actions dans l'application. Cela évite d'ouvrir un persona externe, un parcours
d'invitation et une surface de sécurité, tout en gardant la validation opposable.

---

## 6. Modèle et glossaire

### 6.1 Le dossier fiscal client

Indépendant du pays. Il porte l'identité permanente : raison sociale, forme juridique, RCCM ou
équivalent, identifiant fiscal, adresse, activité, date de début d'activité, exercice comptable,
coordonnées bancaires, dirigeants, représentants légaux, associés, statuts, contrats importants,
documents administratifs, anciennes déclarations, correspondances avec l'administration.

Il réutilise le profil société existant (STORY-079) plutôt que de le dupliquer.

### 6.2 L'implantation fiscale

**Le client est une entité unique ; chaque implantation fiscale est un contexte distinct.**

```
CLIENT
  └── Société A
        ├── Togo          → identifiant fiscal · régime TVA · régime fiscal · canal · obligations
        ├── Bénin         → identifiant fiscal · régime TVA · obligations
        └── Côte d'Ivoire → identifiant fiscal · obligations
```

C'est une dimension de clé nouvelle, et elle est posée **maintenant** — dans le même lot que les
amendements de contrat STORY-146/147, avant que le moteur fiscal ne consomme le contrat. Le raisonnement
est celui qui a déjà fait placer 147 → 146 → 145 avant 091 au Sprint 19 : changer le contrat après avoir
construit dessus revient à le reconstruire.

### 6.3 Obligation et déclaration — deux objets, pas un

C'est la distinction la plus importante du modèle, et celle qu'il ne faut pas confondre.

**Une obligation** est *ce qui doit être fait* : une implantation × une taxe × une période. Elle est
**dérivée** du catalogue, jamais saisie. Elle porte l'échéance légale, le responsable désigné, le statut
d'avancement et le lien vers ses déclarations. Elle existe même si personne n'a encore rien préparé —
c'est précisément ce qui permet au calendrier de signaler ce qui manque.

**Une déclaration** est *ce qui a été produit pour satisfaire une obligation* : une version datée,
attribuée, portant les montants (calculé, déclaré, payé), le livrable de dépôt, l'accusé et le règlement.
Une obligation porte **une à N déclarations** : la première, puis les rectificatives.

| | Obligation | Déclaration |
| --- | --- | --- |
| Origine | Dérivée du catalogue | Produite par un humain |
| Cardinalité | Une par implantation × taxe × période | 1..N par obligation |
| Porte | Échéance, responsable, statut | Montants, livrable, accusé, règlement, motif |
| Muable | Statut seulement | Immuable une fois déposée ; une correction crée une version |

Le cycle de vie du §7.6 est celui de **l'obligation** ; les montants et les versions du §7.4 et du §7.9
sont ceux de la **déclaration**.

### 6.4 Le type d'entité — deuxième dimension du référentiel

La fiscalité ne dépend pas que du pays. **Elle dépend du type d'entité**, et pas marginalement : le type
change le plan comptable, les états à produire, les taxes applicables et jusqu'aux dates de dépôt.

| Type d'entité | Référentiel comptable | Taxes propres | Dépôt annuel |
| --- | --- | --- | --- |
| Entreprise commerciale, production, services | SYSCOHADA révisé (SN ou SMT) | TVA, IS/MFP, TPU si synthétique | 30/04 (société), 31/03 (entreprise individuelle) |
| **Institution de microfinance (SFD)** | **SFD-BCEAO** (RCSFD, plan 156 comptes) | **TAF** sur les activités financières, exonérations propres au secteur | **31/05** |
| **Assurance** | **CIMA** | **TCA** aux taux différenciés par branche | **31/05** |
| **Distributeur** | SYSCOHADA révisé | Régime de droit commun, spécificités de commissionnement | 30/04 |
| **Régime dérogatoire (zone franche)** | SYSCOHADA révisé | Paquet fiscal **dérogatoire** : exonérations et taux réduits | selon statut |

Ce n'est pas une projection : le système sait déjà le faire côté comptable. Le référentiel SFD-BCEAO est
livré (STORY-057, plan de 156 comptes, 24 postes, 22 règles de passage) et a servi à **prouver** le
multi-référentiel ; la liasse CIMA est produite (STORY-122) ; le référentiel Zone Franche est spécifié ;
et le référentiel est déjà keyé **type × pays × année** (STORY-137). Le module fiscal hérite de cette
clé au lieu d'en inventer une autre.

**Conséquence sur l'intégrabilité.** Le module doit servir les verticaux Prospera — microfinance,
assurance, distributeur — et pas seulement les dossiers tenus par un cabinet. C'est faisable sans travail
d'intégration spécifique parce que ces verticaux alimentent déjà la même balance canonique par
l'adaptateur d'ingestion directe (`balance.submitted`, D13/STORY-102). Le module fiscal se branche sur le
**contrat**, jamais sur une source.

### 6.5 Glossaire

| Terme | Définition |
| --- | --- |
| **Obligation** | Ce qui doit être déclaré : implantation × taxe × période. Dérivée, jamais saisie |
| **Déclaration** | Version produite pour satisfaire une obligation. Porte les montants et le livrable |
| **Implantation fiscale** | Contexte national d'une société : pays, identifiant fiscal, régimes, canal |
| **Type d'entité** | Nature réglementaire du dossier : entreprise, microfinance (SFD), assurance, distributeur, régime dérogatoire. Détermine le référentiel comptable *et* les obligations |
| **Paquet fiscal** | Artefact de données versionné, keyé **type d'entité × pays × année** : taxes, familles, taux, seuils, échéances, gabarits, bases légales |
| **Catalogue d'obligations** | Ensemble des obligations applicables, dérivé du paquet et du profil du dossier |
| **Famille de calcul** | Forme mathématique d'une taxe (§7.3). Détermine ce que le paquet doit décrire |
| **Canal** | Moyen par lequel une déclaration atteint l'administration (guichet de dépôt, portail de télédéclaration, dépôt physique) |
| **Livrable de dépôt** | Fichier ou formulaire remis à l'administration, au format exact du canal |
| **Accusé** | Preuve de réception émise par l'administration : document ou référence |
| **Mandat** | Autorisation donnée par le client au cabinet d'agir en son nom, bornée en périmètre et en durée |
| **Règlement** | Paiement de l'impôt dû. À ne pas confondre avec le paiement des abonnements Prospera |

---

## 7. Exigences fonctionnelles

### 7.1 Dossier fiscal et implantations

- **FR-F01** — Le dossier client porte une ou plusieurs implantations fiscales, chacune identifiée par un
  pays, un identifiant fiscal, un régime fiscal et un régime de TVA propres.
- **FR-F02** — Chaque implantation porte les coordonnées de son canal administratif (adresse, identifiant
  contribuable), sans jamais stocker de secret en v1.
- **FR-F03** — Le système propose les régimes de l'implantation à partir du pays, de l'objet social et du
  chiffre d'affaires, et exige une confirmation humaine ; toute divergence par rapport à la proposition
  exige un motif. *(Réutilise STORY-080, étendu à l'implantation.)*
- **FR-F04** — Toute modification du dossier ou d'une implantation est historisée en append-only, avec
  auteur, horodatage et motif, et l'état du dossier à une date passée est reconstituable.
- **FR-F05** — Une implantation peut être clôturée (cessation d'activité dans un pays) sans que son
  historique d'obligations ne soit altéré.

### 7.2 Catalogue d'obligations dérivé

- **FR-F06** — Le système dérive automatiquement la liste des obligations applicables à une implantation
  depuis le paquet fiscal, en fonction du **type d'entité**, du pays, du régime fiscal, du régime de TVA
  et de l'activité. Le type d'entité et le pays sont les deux clés du paquet ; les autres critères
  sélectionnent à l'intérieur.
- **FR-F07** — Chaque entrée du catalogue porte : famille de calcul, assiette, périodicité, règle
  d'échéance, gabarit de livrable, canal, et base légale citée (article et texte verbatim).
- **FR-F08** — Une obligation peut être **activée ou désactivée manuellement** sur un dossier donné, avec
  motif obligatoire — le référentiel propose, le professionnel décide.
- **FR-F09** — L'ajout d'une taxe, d'un taux, d'un barème ou d'une règle d'échéance **appartenant à une
  famille de calcul supportée** se fait par publication d'une version de paquet fiscal, sans déploiement
  de code. Une taxe d'une famille non supportée exige du développement, et le système le signale au lieu
  de produire un montant faux.
- **FR-F10** — Le système signale les obligations qu'il ne sait pas dériver faute de donnée dans le
  paquet, plutôt que de les omettre silencieusement.

### 7.3 Familles de calcul

> Cette section répond au constat critique de la revue : « ajouter une taxe = ajouter une donnée » n'est
> vrai que dans des formes de calcul bornées et déclarées.

- **FR-F11** — Chaque taxe du paquet déclare une **famille de calcul** parmi un ensemble fermé et
  versionné. La v1 supporte :

  | Famille | Forme | Exemples togolais |
  | --- | --- | --- |
  | `PROPORTIONNELLE` | assiette × taux | TVA 18 %, IS 27 %, MFP 1 %, TAF 10 %, RSL 8,75 %, retenues sur capitaux |
  | `BAREME_TRANCHES` | barème progressif par tranches | IRPP, 8 tranches jusqu'à 35 % |
  | `FORFAIT_TRANCHE` | montant fixe selon la tranche d'assiette | TPU forfaitaire (CA ≤ 30 M) |

- **FR-F12** — Les familles se combinent avec des **modificateurs** déclarés, cumulables :
  `MINIMUM_PERCEPTION` (TPU, minimum 20 000 F), `PLANCHER_ASSIETTE` et `PLAFOND_ASSIETTE` (assiette
  sociale au SMIG), `MAXIMUM_DE` (IS = max(MFP, IS)), et `AIGUILLAGE` — sélection du taux ou de la
  famille selon un critère déclaré : nature de l'activité (TPU déclaratif 2 % commerce / 8 % services),
  ou état d'un tiers (RSH 3 / 5 / 20 % selon la régularité fiscale du prestataire).
- **FR-F13** — Un `AIGUILLAGE` dont le critère porte sur un tiers exige que ce critère soit **saisi et
  daté** au dossier ; à défaut, l'obligation est bloquée avec le motif, jamais calculée par défaut.
- **FR-F14** — Les familles **hors v1** sont déclarables dans le paquet mais non calculables :
  `SPECIFIQUE_UNITE` (montant par unité physique — accises pétrolières, Art. 241), `PAR_ACTE` (droits
  d'enregistrement, sans périodicité), `VALEUR_LOCATIVE` (patente, foncière — assiette non comptable).
  Le système les fait apparaître au calendrier avec un montant **à saisir**, plutôt que de les ignorer.
- **FR-F15** — Toute famille et tout modificateur produit un **détail de calcul** restituable : entrées,
  étapes, arrondis, résultat.

### 7.4 Calendrier fiscal

- **FR-F16** — Le système génère un calendrier fiscal centralisé couvrant tout le portefeuille, avec pour
  chaque ligne : dossier, pays, obligation, période, échéance, responsable, statut.
- **FR-F17** — Le calendrier est filtrable et triable par dossier, pays, collaborateur, type
  d'obligation, période et statut, et projetable sur un mois donné.
- **FR-F18** — Le système calcule les échéances depuis les règles du paquet fiscal — y compris les dates
  fixes des acomptes (31/01, 31/05, 31/07, 31/10) et les échéances de dépôt annuel qui varient selon la
  forme de l'entité (31/03 entreprise individuelle, 30/04 société, 31/05 banque et assurance). Aucune de
  ces dates n'est écrite dans le code.
- **FR-F19** — Le système alerte sur les échéances à risque selon un horizon paramétrable, et distingue
  « pas encore préparée », « en retard de préparation » et « échéance dépassée ».
- **FR-F20** — Le calendrier absorbe les **reports d'échéance** décidés par l'administration, saisis comme
  donnée datée et tracée, sans altérer l'échéance légale d'origine. `[HYPOTHÈSE H1]`
- **FR-F21** — Chaque obligation a un responsable désigné ; la vue par collaborateur montre sa charge et
  ses retards.

### 7.5 Alimentation et calcul

- **FR-F22** — Les bases fiscales d'une déclaration sont alimentées depuis les données comptables de
  l'exercice concerné (balance canonique et écritures sous-jacentes), sans ressaisie.
- **FR-F23** — Le calcul de l'impôt est délégué au moteur fiscal de `balance-service` ; `fiscal-service`
  ne recalcule rien qu'il pourrait consommer.
- **FR-F24** — Chaque déclaration conserve, distinctement et définitivement : **montant calculé**,
  **montant déclaré**, **montant payé**. Un écart entre les trois est visible et doit être motivé.
- **FR-F25** — Toute obligation dont l'assiette ne peut être établie faute de données comptables est
  marquée bloquée, avec l'indication précise de ce qui manque.
- **FR-F26** — Le système restitue, pour tout montant déclaré, le chemin complet qui l'a produit :
  montant → détail de calcul → balance → journal → pièces disponibles.

### 7.6 Base de rémunération et obligations sociales

> `[HYPOTHÈSE H2]` Prospera collecte le strict nécessaire pour déclarer, **sans devenir un logiciel de
> paie** : ni bulletins, ni congés, ni soldes de tout compte.

- **FR-F27** — Le système gère une base de rémunération par salarié et par période : salaires, primes,
  gratifications, commissions, avantages en nature, avec exclusion des remboursements de frais.
- **FR-F28** — La base de rémunération est alimentée de **deux façons également prises en charge** :
  **import** d'un fichier issu de l'outil de paie du cabinet ou du client, et **saisie manuelle** dans
  Prospera. L'import est le chemin nominal ; la saisie couvre les dossiers sans outil de paie.
- **FR-F29** — Un import de rémunération est rejouable et idempotent : réimporter la même période ne
  duplique rien, et un réimport corrigé versionne la base sans effacer l'antérieur.
- **FR-F30** — Le système calcule les cotisations sociales employeur et salarié et les retenues d'impôt
  sur les revenus salariaux selon les taux, assiettes, planchers et barèmes du paquet fiscal du pays.
- **FR-F31** — Les obligations sociales apparaissent dans le calendrier, le workflow et la preuve au même
  titre que les obligations fiscales.
- **FR-F32** — Les charges sociales calculées sont rapprochées des comptes de personnel de la balance ;
  tout écart au-delà de la tolérance déclarée est signalé.

### 7.7 Cycle de vie de l'obligation

- **FR-F33** — Chaque obligation suit un cycle de vie unique et universel : `À préparer → En préparation
  → À contrôler → À valider → Validée → À déposer → Déposée → Accusé reçu → À payer → Payée → Clôturée`.
- **FR-F34** — Les transitions sont soumises aux rôles : le collaborateur prépare et soumet, l'expert
  comptable contrôle, valide et déclare déposé.
- **FR-F35** — La validation du client est enregistrée comme pièce (document signé, courriel, ou mention
  manuelle horodatée et attribuée) ; une obligation ne peut être marquée déposée sans elle lorsque le
  dossier l'exige.
- **FR-F36** — Chaque changement de statut est daté, attribué et motivé lorsqu'il constitue un retour en
  arrière.
- **FR-F37** — Une **déclaration rectificative** est une nouvelle version rattachée à la même obligation,
  qui conserve la version antérieure, le motif de correction, l'auteur et la date. L'obligation revient
  au statut approprié ; la déclaration antérieure reste immuable.
- **FR-F38** — Une obligation clôturée n'accepte plus que des rectificatives ; aucune autre mutation.

### 7.8 Dépôt assisté et preuve

- **FR-F39** — Le système produit le livrable de dépôt au format exact attendu par le canal, depuis les
  données validées — en obtenant le contenu de `bilan-service` lorsqu'il s'agit de la liasse ou de la
  DSF (§4), et en le produisant lui-même sinon.
- **FR-F40** — `[HYPOTHÈSE H3]` Le format exact de chaque canal est décrit **comme donnée** dans le
  paquet (gabarit, champs, contraintes). Aucun format n'est développé avant d'avoir été confirmé sur une
  pièce réelle — c'est un prérequis de lot, pas une supposition (§9, jalon *format confirmé*).
- **FR-F41** — Le système guide le dépôt : canal, adresse, étapes ordonnées, points de vigilance, valeurs
  à reporter — sans jamais exiger que le déposant ressaisisse un montant que le système connaît (§8).
- **FR-F42** — L'accusé de dépôt est capturé (document téléversé ou référence saisie), horodaté, et
  rattaché à la déclaration ; sans accusé, l'obligation ne peut pas atteindre l'état « Accusé reçu ».
- **FR-F43** — Le système enregistre la **date réelle de dépôt**, la compare à l'échéance légale, et
  qualifie le retard et le risque associé.
- **FR-F44** — Le système gère le **rejet** par l'administration : motif, date, et retour de l'obligation
  dans le cycle sans perte d'historique. `[HYPOTHÈSE H4]`
- **FR-F45** — L'ensemble des livrables et accusés est archivé dans `document-service`, rattaché au
  dossier, à l'implantation, à l'obligation et à la période.

### 7.9 Règlement de l'impôt

- **FR-F46** — Le système calcule le montant à régler en tenant compte des acomptes déjà versés, des
  crédits d'impôt, des retenues déjà opérées et des reports antérieurs.
- **FR-F47** — Le système produit un ordre ou des instructions de règlement, sans jamais l'exécuter.
- **FR-F48** — Le règlement est rapproché de la déclaration : montant, date, référence, canal ; un
  règlement imputé sur une période ou une taxe incohérente est refusé ou signalé.
- **FR-F49** — Le système distingue explicitement « déposée » et « payée », et met en évidence les
  obligations déposées mais non réglées.
- **FR-F50** — Les pénalités et majorations encourues (30 / 40 / 80 % selon la gravité) sont estimées à
  partir des règles du paquet fiscal et affichées comme **risque estimé**, jamais confondues avec un
  montant dû constaté. `[HYPOTHÈSE H5]`

### 7.10 Piste d'audit et dossier de contrôle

- **FR-F51** — Toute action sur une obligation ou une déclaration est journalisée : qui, quoi, quand,
  depuis quel état, vers quel état, avec quel motif. Le journal est append-only et ne peut être ni
  modifié ni supprimé.
- **FR-F52** — Le système produit à la demande un **dossier de contrôle** pour un périmètre choisi
  (dossier, période, taxe) : historique complet des versions, validations, dépôts, accusés, règlements,
  pièces justificatives et bases légales invoquées.
- **FR-F53** — Le système rapproche le montant déclaré des **pièces justificatives disponibles** et
  chiffre l'écart non documenté au niveau où la liaison existe. En v1 la liaison est établie au niveau du
  compte et de la période, pas de la facture individuelle ; le système annonce cette granularité au lieu
  de la laisser supposer.
- **FR-F54** — Établir la liaison entre une écriture comptable et la pièce qui la justifie est une
  exigence à part entière, prérequise à toute restitution au niveau de la facture. Elle n'existe pas
  aujourd'hui : `document-service` gère la date et le statut par pièce (STORY-128) sans rattachement à
  une ligne d'écriture.
- **FR-F55** — Chaque retraitement fiscal appliqué est adossé à sa base légale citée verbatim, depuis le
  corpus légal packagé.
- **FR-F56** — L'historique d'un dossier est consultable sur toute sa durée en portefeuille, y compris
  pour les exercices clos et les collaborateurs partis.

### 7.11 Habilitations

> **Décision PO du 2026-08-03 — le mandat n'est pas un objet de Prospera.** La relation entre le cabinet
> et son client est un accord entre eux ; dès lors que le cabinet saisit les informations d'un client
> dans Prospera, il déclare détenir le mandat de le représenter. Le produit ne gère donc ni cycle de vie
> ni validité juridique du mandat. Ce qui reste, ce sont les habilitations **internes** au cabinet.

- **FR-F57** — À la création d'un dossier, le cabinet **atteste détenir le mandat** de représenter le
  client. L'attestation est horodatée et attribuée à son auteur, une seule fois, sans pièce jointe
  exigée. C'est une ligne de journal, pas un formulaire.
- **FR-F58** — Le système distingue cinq natures d'accès et ne les confond jamais : identifiant fiscal de
  l'entreprise (donnée métier), compte de canal (donnée d'accès), habilitation applicative, certificat
  électronique, accès bancaire. Cette séparation reste un garde-fou de conception même sans gestion de
  mandat. `[HYPOTHÈSE H6]`
- **FR-F59** — Les habilitations applicatives sont graduées par action : lecture, préparation, contrôle,
  validation, dépôt, règlement. Aucune n'implique l'autre.
- **FR-F60** — *Retirée en v0.3* (décision PO — la validité du mandat n'est pas contrôlée par Prospera).
- **FR-F61** — *Retirée en v0.3* (même décision).

### 7.12 Contrôles et anomalies

- **FR-F62** — Le système contrôle la cohérence entre déclarations d'une même période : TVA déclarée
  contre chiffre d'affaires comptabilisé, acomptes contre résultat de l'exercice précédent, charges
  sociales contre comptes de personnel.
- **FR-F63** — Chaque contrôle de cohérence porte une **tolérance déclarée dans le paquet fiscal**, à
  l'image de la tolérance d'équilibre déjà en place sur la balance canonique. Aucun contrôle ne compare à
  l'égalité stricte.
- **FR-F64** — Le système contrôle la continuité entre périodes : crédits reportés, déficits reportables,
  acomptes cumulés. `[HYPOTHÈSE H7]`
- **FR-F65** — Chaque anomalie porte un niveau de gravité, une explication en langage clair et l'action
  attendue ; une anomalie bloquante empêche la transition vers « Validée ».
- **FR-F66** — Une anomalie peut être levée avec motif obligatoire ; la levée est journalisée et apparaît
  au dossier de contrôle.

### 7.13 Administration et gouvernance du paquet fiscal

- **FR-F67** — L'admin plateforme publie des versions de paquet fiscal keyées pays × année, contenant
  taxes, familles de calcul, taux, assiettes, barèmes, seuils, tolérances, périodicités, règles
  d'échéance, gabarits, canaux et bases légales.
- **FR-F68** — Une version publiée est immuable et vérifiée par empreinte ; une correction produit une
  nouvelle version. **La publication a un propriétaire unique** et la liste de ses consommateurs
  (moteur fiscal, catalogue d'obligations, production de liasse) est déclarée dans l'artefact.
- **FR-F69** — Chaque élément du paquet porte un **statut de validation** (à valider, validé par expert,
  daté) et le système signale les montants calculés à partir d'éléments non validés.
- **FR-F70** — Un exercice reste attaché à la version du paquet en vigueur pour cet exercice. Une
  publication en cours d'exercice n'a aucun effet rétroactif automatique ; le recalcul est une action
  explicite, tracée, et refusée sur les déclarations déjà déposées.

### 7.14 Type d'entité et intégration aux verticaux

- **FR-F71** — Le paquet fiscal est keyé **type d'entité × pays × année**. Un même pays porte plusieurs
  paquets — entreprise, microfinance, assurance, régime dérogatoire — et le système résout celui qui
  s'applique depuis le profil du dossier, sans arbitrage humain.
- **FR-F72** — Le type d'entité sélectionne **conjointement** le référentiel comptable et le paquet
  fiscal. Les deux ne peuvent pas diverger : un dossier microfinance ne peut pas être calculé sur le
  paquet entreprise, et le système refuse la combinaison au lieu de produire un montant.
- **FR-F73** — Les taxes sectorielles s'activent par le type d'entité, jamais par une case à cocher :
  **TAF** pour les activités financières (microfinance, banque), **TCA** aux taux différenciés par
  branche pour l'assurance, régime de droit commun pour le distributeur.
- **FR-F74** — Les règles d'échéance sont portées par le paquet du type : le dépôt annuel au **31/05**
  des institutions financières et des assurances n'est pas une exception codée, c'est une donnée du
  paquet correspondant.
- **FR-F75** — Un **régime dérogatoire** (zone franche) est un paquet fiscal à part entière, appliqué à
  la place du paquet de droit commun, portant ses exonérations et ses taux réduits. Le système signale
  visiblement qu'un dossier est calculé sous dérogation.
- **FR-F76** — Le module fiscal consomme la **balance canonique quelle que soit sa source** — atelier du
  cabinet, import de logiciel comptable, ou ingestion directe d'un vertical (`balance.submitted`). Il ne
  connaît que le contrat, jamais l'origine.
- **FR-F77** — Un vertical intégré (microfinance, assurance, distributeur) obtient le module fiscal sans
  développement spécifique : il lui suffit de soumettre une balance conforme, taguée du bon référentiel,
  et de disposer d'un paquet fiscal publié pour son type d'entité.
- **FR-F78** — Un type d'entité sans paquet fiscal publié pour son pays et son exercice produit un refus
  explicite et nommé, jamais un repli silencieux sur un paquet voisin.

---

## 8. Parcours — le dépôt assisté

Le dépôt assisté est le différenciateur de la v1 et c'est un parcours, pas une exigence isolée. Il est
décrit ici avec un protagoniste nommé ; sa mise en forme relève d'une spécification UX distincte.

**Afi, collaboratrice au cabinet.** Elle a douze dossiers, dont sept déposent la TVA le même mois.

1. Elle ouvre son calendrier et voit ses obligations du mois, triées par échéance. Trois sont en rouge.
2. Elle ouvre la première. Prospera a déjà calculé les montants depuis la balance ; deux anomalies sont
   signalées, dont une bloquante — un écart entre TVA collectée et chiffre d'affaires au-delà de la
   tolérance.
3. Elle corrige, l'anomalie tombe, elle soumet au contrôle.
4. **Kodjo, expert-comptable**, reçoit l'obligation dans sa file « à contrôler ». Il ouvre le détail de
   calcul, remonte jusqu'aux écritures, valide. La validation du client est déjà au dossier — un courriel
   déposé la semaine dernière.
5. Afi passe au dépôt. Prospera lui présente le canal, le livrable prêt à téléverser, et la liste ordonnée
   des écrans du portail avec, pour chacun, les valeurs à reporter. **Elle ne retape aucun montant : elle
   copie.**
6. Le portail rend son accusé. Afi le téléverse ; Prospera l'horodate, le rattache à la déclaration,
   compare la date réelle à l'échéance et passe l'obligation à « Accusé reçu ».
7. Deux semaines plus tard, le règlement est rapproché. L'obligation passe « Payée », puis « Clôturée ».

**Ce que ce parcours exige et qui n'est pas évident :** les valeurs à reporter doivent être copiables
individuellement ; l'ordre des écrans doit venir du paquet et non du code ; et l'étape 6 doit accepter
aussi bien un document qu'une simple référence, parce que tous les portails ne rendent pas de fichier.

---

## 9. Trajectoire — cinq incréments ordonnés

La v1 ne se livre pas en bloc. Chaque incrément est livrable, et l'ordre suit la dépendance réelle.

| # | Incrément | Exigences | Ce qu'il rend possible |
| --- | --- | --- | --- |
| **I1** | **Socle fiscal** — dossier, implantations, **type d'entité**, catalogue dérivé, familles de calcul, gouvernance du paquet | FR-F01→F15, F67→F78 | *Savoir quoi déclarer.* Le cabinet voit, par dossier, la liste exacte de ses obligations — et les verticaux deviennent servables |
| **I2** | **Calendrier et responsabilité** | FR-F16→F21 | *Savoir quand et qui.* Premier gain opérationnel réel : le tableur disparaît |
| **I3** | **Chaîne déclarative** — alimentation, calcul, cycle de vie, contrôles, journal | FR-F22→F26, F33→F38, F51, F56, F62→F66 | *Savoir combien et le faire valider.* **Premier jalon vendable** |
| **I4** | **Dépôt assisté et preuve** — livrable, guidage, accusé, dossier de contrôle, habilitations | FR-F39→F45, F52→F55, F57→F59 | *Prouver.* Le différenciateur du §2 |
| **I5** | **Règlement et social** | FR-F46→F50, F27→F32 | *Boucler le cycle* et couvrir le calendrier social |

**Jalon bloquant avant I4 — « format confirmé ».** Aucune exigence de dépôt (FR-F39→F41) ne part en
développement avant qu'une pièce réelle par canal n'ait été obtenue et analysée : gabarit de dépôt,
capture du parcours, accusé, et si possible une déclaration rejetée avec son motif (§13, question 4).

**Après la v1 :** paquets fiscaux des autres pays UEMOA (donnée uniquement, familles supportées
seulement) · premier connecteur de dépôt automatisé sur le canal à plus fort volume, avec le coffre-fort
d'identifiants · familles `SPECIFIQUE_UNITE`, `PAR_ACTE` et `VALEUR_LOCATIVE` · règlement par mandat
habilité là où le cadre légal et technique le permet · facturation électronique certifiée · multi-devises
hors zone franc.

---

## 10. Mesure du succès

Le produit ne dépose pas lui-même en v1 (§3.2). Le succès se mesure donc en deux temps : ce que le
module **contrôle**, et ce qu'il **constate**.

**Métrique principale — obligations prêtes à temps.** Part des obligations parvenues à l'état « À
déposer » au moins *N* jours avant l'échéance légale, *N* étant paramétrable par cabinet. C'est
intégralement sous le contrôle du produit, et c'est ce que le calendrier et le workflow promettent.

**Métrique de résultat — dépôts hors délai.** Part des obligations dont la date réelle de dépôt dépasse
l'échéance. Constatée, non garantie en v1 ; elle devient une promesse tenable avec les connecteurs
automatisés.

Métriques secondaires :

- **Preuve complète et opposable** — part des déclarations dont la chaîne est entièrement remontable,
  accusé archivé compris.
- **Temps de préparation** — durée entre la clôture des données comptables et l'état « À déposer ».
- **Dossiers par collaborateur** — nombre de dossiers tenus sans dégradation ; c'est la métrique
  économique qui justifie le prix de l'abonnement.

### Contre-métriques

À surveiller, parce qu'elles se dégradent quand on optimise trop fort les précédentes :

- **Taux de rejet par l'administration** — un dépôt rapide et rejeté n'est pas un dépôt.
- **Taux de déclarations rectificatives** après dépôt — indicateur de précipitation dans le workflow.
- **Taux d'anomalies levées sans correction** — si les garde-fous sont contournés avec un motif de
  complaisance, ils ne protègent plus personne.
- **Part des dépôts assistés abandonnés** — mesure honnête de l'utilité réelle du guidage.
- **Part des obligations à montant saisi** (familles hors v1, FR-F14) — mesure ce que le moteur ne couvre
  pas encore.

---

## 11. Exigences non fonctionnelles

### Conformité — non négociable

- **NFR-F01** — Le module **optimise la base par leviers légaux et sécurise la justification ; il ne
  minore jamais la réalité.** Dissimuler des recettes réelles ou introduire des charges fictives est de
  la fraude et le système ne doit offrir aucun chemin qui y conduise.
- **NFR-F02** — Aucune déclaration ne peut atteindre un état « Validée » sans action humaine identifiée.
  L'automatisation prépare, elle n'engage pas.
- **NFR-F03** — Tout calcul opposable est **déterministe et reproductible** : mêmes entrées, même version
  de paquet, même résultat, quelle que soit la date d'exécution.
- **NFR-F04** — Aucun taux, seuil, barème, tolérance ou échéance n'est codé en dur. Tout provient du
  paquet fiscal du pays et de l'année.

### Sécurité

- **NFR-F05** — Aucun secret d'accès à un canal administratif n'est stocké en v1. Lorsque les connecteurs
  arriveront, ce sera par coffre-fort dédié : chiffrement fort, rotation, MFA, séparation des rôles,
  journalisation de chaque accès, et **sans que le collaborateur ait à connaître le secret**.
- **NFR-F06** — L'isolation entre organisations et entre dossiers est absolue : l'appartenance est
  toujours dérivée du jeton, jamais du corps de la requête.
- **NFR-F07** — Les documents fiscaux ne sont accessibles que par URL présignée à durée limitée, vérifiée
  depuis le client qui la consommera.

### Traçabilité et données

- **NFR-F08** — Journal d'audit append-only, protégé au niveau du stockage — aucun chemin applicatif ne
  doit pouvoir supprimer ou réécrire une trace.
- **NFR-F09** — Les montants sont manipulés en unités mineures entières, cohérentes avec le contrat de
  balance canonique. Aucune arithmétique en virgule flottante sur un montant opposable.
- **NFR-F10** — Les données fiscales et leurs preuves sont conservées **dix ans**, valeur par défaut
  alignée sur l'obligation OHADA de conservation des documents comptables, surchargeable par pays dans
  le paquet fiscal. `[HYPOTHÈSE H8]`

### Multi-pays

- **NFR-F11** — Ajouter un pays ne doit coûter que de la donnée — **dans la limite des familles de calcul
  supportées** (FR-F11). Toute autre exception est un défaut de conception à corriger, pas un cas
  particulier à accepter.
- **NFR-F12** — Le vocabulaire du modèle est neutre : « obligation », « implantation », « canal »,
  « famille » — jamais un nom national dans le code.

### Exploitation

- **NFR-F13** — Sur un portefeuille de **500 dossiers portant chacun jusqu'à 12 obligations annuelles**
  (soit ~6 000 lignes par exercice) : premier rendu du calendrier sous **2 secondes**, application d'un
  filtre ou d'un tri sous **500 ms**.
- **NFR-F14** — La dérivation du catalogue d'obligations d'un dossier s'exécute en moins de **1 seconde**
  et est recalculable à la demande après changement de régime ou de version de paquet.
- **NFR-F15** — Une indisponibilité d'un canal administratif ne bloque ni la préparation ni la
  validation ; seul l'acte de dépôt est différé, et cette attente est visible dans le calendrier.
- **NFR-F16** — Un import de rémunération de **1 000 lignes** est traité de façon transactionnelle : soit
  la période entière est importée, soit rien ne l'est.

---

## 12. Risques

| Risque | Portée | Traitement |
| --- | --- | --- |
| **Le multi-*pays* n'est pas prouvé en v1** | Élevée | Assumé. La v1 ne livre qu'un pays (Togo) ; NFR-F11/F12 contraignent l'architecture mais rien ne la démontre. **Atténué depuis la v0.3 :** le multi-*type d'entité* (§6.4), lui, est livré dès I1 et prouvé par l'existant (SFD-BCEAO, CIMA). L'axe pays reste à démontrer — **recommandation : un 2ᵉ paquet pays dès la v1.x** |
| **Périmètre de la validation experte** | Moyenne | Le paquet fiscal a été validé (PO, 2026-08-03). Reste à consigner **qui, quand et sur quel périmètre** : les statuts par élément du paquet doivent être basculés en « validé » avec l'identité du valideur et la date, faute de quoi FR-F69 continuera de signaler des éléments non validés. Action de données, pas de développement |
| **Formats de dépôt inconnus** | Élevée | Aucune pièce réelle n'a été fournie. Traité par le jalon bloquant « format confirmé » avant I4 (§9) — le risque est converti en condition d'entrée, pas absorbé |
| **Loi de finances non calée** | Élevée | Le corpus OTR consolide jusqu'à LF 2023 ; la LF 2026 existe. FR-F70 traite le rattachement version ↔ exercice, mais la mise à jour du corpus reste à faire |
| **Facturation électronique certifiée** | Moyenne, croissante | Introduite dans la LF 2026 togolaise (LPF art. 63), modalités à venir par textes d'application. Hors v1 mais susceptible de devenir obligatoire pendant sa durée de vie |
| **Absence d'API sur les portails** | Structurelle | Traitée par le dépôt assisté (§3.2). Le risque se déplace sur les connecteurs futurs |
| **5ᵉ dimension de clé** | Moyenne | L'implantation fiscale amende le contrat canonique en même temps que STORY-146/147. Impact à chiffrer au sprint-planning du Sprint 19 |
| **Base de rémunération peu alimentée** | Moyenne | Le risque d'écran vide est traité par FR-F28 (import *et* saisie). Si l'import n'est pas livré avec I5, la saisie seule ne sera pas utilisée |

---

## 13. Impacts sur l'existant

- **Sprint 19** — l'ordre `147 → 146 → 145 → 091 → 092 → 093` est confirmé. L'implantation fiscale (§6.2)
  doit être arbitrée dans ce lot, ce qui aggrave un dépassement déjà signalé (37 pts pour 34).
  **Recommandation : décaler STORY-094 (provisions) et STORY-095 (TPU) au S20** — c'est déjà la coupe que
  le tracker envisageait, et elle libère les 6 points nécessaires.
- **Module 3 `fiscal-service`** — sa définition dans `sprint-status.yaml` est à remplacer par le présent
  périmètre.
- **`bilan-service`** — devient fournisseur du contenu de la liasse pour le dépôt (§4). Aucune
  fonctionnalité nouvelle exigée en v1, mais une interface de récupération à exposer.
- **Collision de nom** — le « module paiement » du Sprint 20 désigne le paiement des **abonnements
  Prospera**. Le §7.9 traite du **règlement de l'impôt**.
- **Nomenclature** — le guichet de dépôt togolais s'appelle **GUDEF**, pas « GUIDEF » comme écrit
  aujourd'hui dans `prospera-stories/` et dans les référentiels. À corriger partout.
- **Rôle expert-comptable** — nouveau rôle interne au cabinet, à ajouter au RBAC dossier livré
  (FE-EPIC-008, STORY-136).

---

## 14. Index des hypothèses

| # | Hypothèse | Où | Ce qui la confirmerait |
| --- | --- | --- | --- |
| **H1** | Les reports d'échéance administratifs doivent être saisis comme donnée datée sans altérer l'échéance légale | FR-F20 | Un communiqué de report réel et la façon dont les cabinets le traitent aujourd'hui |
| **H2** | Une base de rémunération suffit pour déclarer, sans logiciel de paie | §7.6 | Entretien cabinet : que font-ils aujourd'hui pour la CNSS ? Attendent-ils des bulletins ? |
| **H3** | Le format de chaque canal est descriptible comme donnée dans le paquet | FR-F40 | Deux gabarits réels de canaux différents, comparés |
| **H4** | L'administration notifie les rejets avec un motif exploitable | FR-F44 | Une déclaration rejetée réelle avec son motif |
| **H5** | Les majorations 30/40/80 % sont estimables mécaniquement depuis le paquet | FR-F50 | Validation par un fiscaliste : le taux dépend-il d'une appréciation ? |
| **H6** | Les cinq natures d'accès s'appliquent au contexte togolais | FR-F58 | Le parcours réel d'un cabinet sur e-services et GUDEF |
| **H7** | Les reports (crédits, déficits, acomptes) se contrôlent d'une période à l'autre sans intervention | FR-F64 | Un cas réel de report de crédit de TVA sur deux exercices |
| **H8** | Dix ans de conservation par défaut | NFR-F10 | Le délai de prescription et l'obligation de conservation applicables au Togo |

---

## 15. Questions ouvertes

1. **Bulletins de paie** — la base de rémunération (§7.6) suffit-elle, ou les cabinets attendent-ils un
   vrai module de paie ? Si oui, c'est un autre produit. *(Bloquant pour I5, pas pour I1→I4.)*
2. **Format d'import de paie** — quel outil utilisent réellement les cabinets cibles, et quel fichier en
   sort ? *(Bloquant pour FR-F28.)*
3. **Pièces réelles manquantes** — demande formalisée et transmissible à l'expert-comptable :
   `demande-pieces-fiscales-2026-08-03.md`. *(Bloquant pour I4.)*
4. **Paquets fiscaux par type d'entité** — les paquets microfinance, assurance et régime dérogatoire
   existent-ils au même niveau de complétude que le paquet entreprise, ou seulement en amorce ? Le
   référentiel *comptable* SFD-BCEAO est livré et validé, mais son pendant *fiscal* (TAF, exonérations
   sectorielles) reste à confirmer. *(Bloquant pour FR-F71→F75.)*
5. **Où vit le code** de Prospera Microfinance et de Prospera Distributeur, et qu'est-ce qui y est
   réellement réutilisable — le socle identifié dans ce dépôt est `auth`, `kyc`, `document`, `balance`,
   `bilan`, `platform-catalog` et l'app expert-comptable. *(Devient structurant depuis FR-F77.)*
6. **Traçabilité de la validation experte** — identité du valideur, date, périmètre couvert, à consigner
   dans les statuts du paquet (§12).
