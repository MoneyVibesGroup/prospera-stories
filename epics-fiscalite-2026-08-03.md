---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - prospera-stories/prds/prd-fiscalite-2026-07-31/prd.md
  - prospera-stories/prds/prd-fiscalite-2026-07-31/addendum.md
  - prospera-stories/prds/prd-fiscalite-2026-07-31/.memlog.md
  - prospera-stories/architecture/architecture-fiscal-service-2026-08-03/ARCHITECTURE-SPINE.md
  - prospera-stories/architecture-fiscal-service-2026-08-03.md
  - prospera-stories/architecture-prospera-ecosystem-2026-07-04.md
  - prospera-stories/architecture-catalog-service-2026-07-07.md
  - prospera-stories/architecture-bilan-service-2026-07-07.md
  - prospera-stories/referentiels/paquet-fiscal-togo-2026.json
  - prospera-stories/referentiels/procedures-fiscales-togo.json
  - prospera-stories/sprint-status.yaml
---

# Fiscalité (`fiscal-service`) — Découpage en épics

## Vue d'ensemble

Découpage du PRD Fiscalité v0.3 et de la colonne vertébrale `fiscal-service` (AD-1 → AD-19) en épics et
stories implémentables. Série continuée : **épics à partir de EPIC-027**, **stories à partir de
STORY-179**. Périmètre backend uniquement ; le frontend suit sa série `FE-*` dans son tracker propre.

## Inventaire des exigences

### Exigences fonctionnelles

- **FR-F01** — Le dossier client porte une ou plusieurs implantations fiscales, chacune identifiée par un pays, un identifiant fiscal, un régime fiscal et un régime de TVA propres.
- **FR-F02** — Chaque implantation porte les coordonnées de son canal administratif (adresse, identifiant contribuable), sans jamais stocker de secret en v1.
- **FR-F03** — Le système propose les régimes de l'implantation à partir du pays, de l'objet social et du chiffre d'affaires, et exige une confirmation humaine ; toute divergence par rapport à la proposition exige un motif. *(Réutilise STORY-080, étendu à l'implantation.)*
- **FR-F04** — Toute modification du dossier ou d'une implantation est historisée en append-only, avec auteur, horodatage et motif, et l'état du dossier à une date passée est reconstituable.
- **FR-F05** — Une implantation peut être clôturée (cessation d'activité dans un pays) sans que son historique d'obligations ne soit altéré.
- **FR-F06** — Le système dérive automatiquement la liste des obligations applicables à une implantation depuis le paquet fiscal, en fonction du **type d'entité**, du pays, du régime fiscal, du régime de TVA et de l'activité. Le type d'entité et le pays sont les deux clés du paquet ; les autres critères sélectionnent à l'intérieur.
- **FR-F07** — Chaque entrée du catalogue porte : famille de calcul, assiette, périodicité, règle d'échéance, gabarit de livrable, canal, et base légale citée (article et texte verbatim).
- **FR-F08** — Une obligation peut être **activée ou désactivée manuellement** sur un dossier donné, avec motif obligatoire — le référentiel propose, le professionnel décide.
- **FR-F09** — L'ajout d'une taxe, d'un taux, d'un barème ou d'une règle d'échéance **appartenant à une famille de calcul supportée** se fait par publication d'une version de paquet fiscal, sans déploiement de code. Une taxe d'une famille non supportée exige du développement, et le système le signale au lieu de produire un montant faux.
- **FR-F10** — Le système signale les obligations qu'il ne sait pas dériver faute de donnée dans le paquet, plutôt que de les omettre silencieusement.
- **FR-F11** — Chaque taxe du paquet déclare une **famille de calcul** parmi un ensemble fermé et versionné. La v1 supporte : | Famille | Forme | Exemples togolais | | --- | --- | --- | | `PROPORTIONNELLE` | assiette × taux | TVA 18 %, IS 27 %, MFP 1 %, TAF 10 %, RSL 8,75 %, retenues sur capitaux | | `BAREME_TRANCHES` | barème progressif par tranches | IRPP, 8 tranches jusqu'à 35 % | | `FORFAIT_TRANCHE` | montant fixe selon la tranche d'assiette | TPU forfaitaire (CA ≤ 30 M) |
- **FR-F12** — Les familles se combinent avec des **modificateurs** déclarés, cumulables : `MINIMUM_PERCEPTION` (TPU, minimum 20 000 F), `PLANCHER_ASSIETTE` et `PLAFOND_ASSIETTE` (assiette sociale au SMIG), `MAXIMUM_DE` (IS = max(MFP, IS)), et `AIGUILLAGE` — sélection du taux ou de la famille selon un critère déclaré : nature de l'activité (TPU déclaratif 2 % commerce / 8 % services), ou état d'un tiers (RSH 3 / 5 / 20 % selon la régularité fiscale du prestataire).
- **FR-F13** — Un `AIGUILLAGE` dont le critère porte sur un tiers exige que ce critère soit **saisi et daté** au dossier ; à défaut, l'obligation est bloquée avec le motif, jamais calculée par défaut.
- **FR-F14** — Les familles **hors v1** sont déclarables dans le paquet mais non calculables : `SPECIFIQUE_UNITE` (montant par unité physique — accises pétrolières, Art. 241), `PAR_ACTE` (droits d'enregistrement, sans périodicité), `VALEUR_LOCATIVE` (patente, foncière — assiette non comptable). Le système les fait apparaître au calendrier avec un montant **à saisir**, plutôt que de les ignorer.
- **FR-F15** — Toute famille et tout modificateur produit un **détail de calcul** restituable : entrées, étapes, arrondis, résultat.
- **FR-F16** — Le système génère un calendrier fiscal centralisé couvrant tout le portefeuille, avec pour chaque ligne : dossier, pays, obligation, période, échéance, responsable, statut.
- **FR-F17** — Le calendrier est filtrable et triable par dossier, pays, collaborateur, type d'obligation, période et statut, et projetable sur un mois donné.
- **FR-F18** — Le système calcule les échéances depuis les règles du paquet fiscal — y compris les dates fixes des acomptes (31/01, 31/05, 31/07, 31/10) et les échéances de dépôt annuel qui varient selon la forme de l'entité (31/03 entreprise individuelle, 30/04 société, 31/05 banque et assurance). Aucune de ces dates n'est écrite dans le code.
- **FR-F19** — Le système alerte sur les échéances à risque selon un horizon paramétrable, et distingue « pas encore préparée », « en retard de préparation » et « échéance dépassée ».
- **FR-F20** — Le calendrier absorbe les **reports d'échéance** décidés par l'administration, saisis comme donnée datée et tracée, sans altérer l'échéance légale d'origine.
- **FR-F21** — Chaque obligation a un responsable désigné ; la vue par collaborateur montre sa charge et ses retards.
- **FR-F22** — Les bases fiscales d'une déclaration sont alimentées depuis les données comptables de l'exercice concerné (balance canonique et écritures sous-jacentes), sans ressaisie.
- **FR-F23** — Le calcul de l'impôt est délégué au moteur fiscal de `balance-service` ; `fiscal-service` ne recalcule rien qu'il pourrait consommer.
- **FR-F24** — Chaque déclaration conserve, distinctement et définitivement : **montant calculé**, **montant déclaré**, **montant payé**. Un écart entre les trois est visible et doit être motivé.
- **FR-F25** — Toute obligation dont l'assiette ne peut être établie faute de données comptables est marquée bloquée, avec l'indication précise de ce qui manque.
- **FR-F26** — Le système restitue, pour tout montant déclaré, le chemin complet qui l'a produit : montant → détail de calcul → balance → journal → pièces disponibles.
- **FR-F27** — Le système gère une base de rémunération par salarié et par période : salaires, primes, gratifications, commissions, avantages en nature, avec exclusion des remboursements de frais.
- **FR-F28** — La base de rémunération est alimentée de **deux façons également prises en charge** : **import** d'un fichier issu de l'outil de paie du cabinet ou du client, et **saisie manuelle** dans Prospera. L'import est le chemin nominal ; la saisie couvre les dossiers sans outil de paie.
- **FR-F29** — Un import de rémunération est rejouable et idempotent : réimporter la même période ne duplique rien, et un réimport corrigé versionne la base sans effacer l'antérieur.
- **FR-F30** — Le système calcule les cotisations sociales employeur et salarié et les retenues d'impôt sur les revenus salariaux selon les taux, assiettes, planchers et barèmes du paquet fiscal du pays.
- **FR-F31** — Les obligations sociales apparaissent dans le calendrier, le workflow et la preuve au même titre que les obligations fiscales.
- **FR-F32** — Les charges sociales calculées sont rapprochées des comptes de personnel de la balance ; tout écart au-delà de la tolérance déclarée est signalé.
- **FR-F33** — Chaque obligation suit un cycle de vie unique et universel : `À préparer → En préparation → À contrôler → À valider → Validée → À déposer → Déposée → Accusé reçu → À payer → Payée → Clôturée`.
- **FR-F34** — Les transitions sont soumises aux rôles : le collaborateur prépare et soumet, l'expert comptable contrôle, valide et déclare déposé.
- **FR-F35** — La validation du client est enregistrée comme pièce (document signé, courriel, ou mention manuelle horodatée et attribuée) ; une obligation ne peut être marquée déposée sans elle lorsque le dossier l'exige.
- **FR-F36** — Chaque changement de statut est daté, attribué et motivé lorsqu'il constitue un retour en arrière.
- **FR-F37** — Une **déclaration rectificative** est une nouvelle version rattachée à la même obligation, qui conserve la version antérieure, le motif de correction, l'auteur et la date. L'obligation revient au statut approprié ; la déclaration antérieure reste immuable.
- **FR-F38** — Une obligation clôturée n'accepte plus que des rectificatives ; aucune autre mutation.
- **FR-F39** — Le système produit le livrable de dépôt au format exact attendu par le canal, depuis les données validées — en obtenant le contenu de `bilan-service` lorsqu'il s'agit de la liasse ou de la DSF (§4), et en le produisant lui-même sinon.
- **FR-F40** —  Le format exact de chaque canal est décrit **comme donnée** dans le paquet (gabarit, champs, contraintes). Aucun format n'est développé avant d'avoir été confirmé sur une pièce réelle — c'est un prérequis de lot, pas une supposition (§9, jalon *format confirmé*).
- **FR-F41** — Le système guide le dépôt : canal, adresse, étapes ordonnées, points de vigilance, valeurs à reporter — sans jamais exiger que le déposant ressaisisse un montant que le système connaît (§8).
- **FR-F42** — L'accusé de dépôt est capturé (document téléversé ou référence saisie), horodaté, et rattaché à la déclaration ; sans accusé, l'obligation ne peut pas atteindre l'état « Accusé reçu ».
- **FR-F43** — Le système enregistre la **date réelle de dépôt**, la compare à l'échéance légale, et qualifie le retard et le risque associé.
- **FR-F44** — Le système gère le **rejet** par l'administration : motif, date, et retour de l'obligation dans le cycle sans perte d'historique.
- **FR-F45** — L'ensemble des livrables et accusés est archivé dans `document-service`, rattaché au dossier, à l'implantation, à l'obligation et à la période.
- **FR-F46** — Le système calcule le montant à régler en tenant compte des acomptes déjà versés, des crédits d'impôt, des retenues déjà opérées et des reports antérieurs.
- **FR-F47** — Le système produit un ordre ou des instructions de règlement, sans jamais l'exécuter.
- **FR-F48** — Le règlement est rapproché de la déclaration : montant, date, référence, canal ; un règlement imputé sur une période ou une taxe incohérente est refusé ou signalé.
- **FR-F49** — Le système distingue explicitement « déposée » et « payée », et met en évidence les obligations déposées mais non réglées.
- **FR-F50** — Les pénalités et majorations encourues (30 / 40 / 80 % selon la gravité) sont estimées à partir des règles du paquet fiscal et affichées comme **risque estimé**, jamais confondues avec un montant dû constaté.
- **FR-F51** — Toute action sur une obligation ou une déclaration est journalisée : qui, quoi, quand, depuis quel état, vers quel état, avec quel motif. Le journal est append-only et ne peut être ni modifié ni supprimé.
- **FR-F52** — Le système produit à la demande un **dossier de contrôle** pour un périmètre choisi (dossier, période, taxe) : historique complet des versions, validations, dépôts, accusés, règlements, pièces justificatives et bases légales invoquées.
- **FR-F53** — Le système rapproche le montant déclaré des **pièces justificatives disponibles** et chiffre l'écart non documenté au niveau où la liaison existe. En v1 la liaison est établie au niveau du compte et de la période, pas de la facture individuelle ; le système annonce cette granularité au lieu de la laisser supposer.
- **FR-F54** — Établir la liaison entre une écriture comptable et la pièce qui la justifie est une exigence à part entière, prérequise à toute restitution au niveau de la facture. Elle n'existe pas aujourd'hui : `document-service` gère la date et le statut par pièce (STORY-128) sans rattachement à une ligne d'écriture.
- **FR-F55** — Chaque retraitement fiscal appliqué est adossé à sa base légale citée verbatim, depuis le corpus légal packagé.
- **FR-F56** — L'historique d'un dossier est consultable sur toute sa durée en portefeuille, y compris pour les exercices clos et les collaborateurs partis.
- **FR-F57** — À la création d'un dossier, le cabinet **atteste détenir le mandat** de représenter le client. L'attestation est horodatée et attribuée à son auteur, une seule fois, sans pièce jointe exigée. C'est une ligne de journal, pas un formulaire.
- **FR-F58** — Le système distingue cinq natures d'accès et ne les confond jamais : identifiant fiscal de l'entreprise (donnée métier), compte de canal (donnée d'accès), habilitation applicative, certificat électronique, accès bancaire. Cette séparation reste un garde-fou de conception même sans gestion de mandat.
- **FR-F59** — Les habilitations applicatives sont graduées par action : lecture, préparation, contrôle, validation, dépôt, règlement. Aucune n'implique l'autre.
- **FR-F60** — *Retirée en v0.3* (décision PO — la validité du mandat n'est pas contrôlée par Prospera).
- **FR-F61** — *Retirée en v0.3* (même décision).
- **FR-F62** — Le système contrôle la cohérence entre déclarations d'une même période : TVA déclarée contre chiffre d'affaires comptabilisé, acomptes contre résultat de l'exercice précédent, charges sociales contre comptes de personnel.
- **FR-F63** — Chaque contrôle de cohérence porte une **tolérance déclarée dans le paquet fiscal**, à l'image de la tolérance d'équilibre déjà en place sur la balance canonique. Aucun contrôle ne compare à l'égalité stricte.
- **FR-F64** — Le système contrôle la continuité entre périodes : crédits reportés, déficits reportables, acomptes cumulés.
- **FR-F65** — Chaque anomalie porte un niveau de gravité, une explication en langage clair et l'action attendue ; une anomalie bloquante empêche la transition vers « Validée ».
- **FR-F66** — Une anomalie peut être levée avec motif obligatoire ; la levée est journalisée et apparaît au dossier de contrôle.
- **FR-F67** — L'admin plateforme publie des versions de paquet fiscal keyées pays × année, contenant taxes, familles de calcul, taux, assiettes, barèmes, seuils, tolérances, périodicités, règles d'échéance, gabarits, canaux et bases légales.
- **FR-F68** — Une version publiée est immuable et vérifiée par empreinte ; une correction produit une nouvelle version. **La publication a un propriétaire unique** et la liste de ses consommateurs (moteur fiscal, catalogue d'obligations, production de liasse) est déclarée dans l'artefact.
- **FR-F69** — Chaque élément du paquet porte un **statut de validation** (à valider, validé par expert, daté) et le système signale les montants calculés à partir d'éléments non validés.
- **FR-F70** — Un exercice reste attaché à la version du paquet en vigueur pour cet exercice. Une publication en cours d'exercice n'a aucun effet rétroactif automatique ; le recalcul est une action explicite, tracée, et refusée sur les déclarations déjà déposées.
- **FR-F71** — Le paquet fiscal est keyé **type d'entité × pays × année**. Un même pays porte plusieurs paquets — entreprise, microfinance, assurance, régime dérogatoire — et le système résout celui qui s'applique depuis le profil du dossier, sans arbitrage humain.
- **FR-F72** — Le type d'entité sélectionne **conjointement** le référentiel comptable et le paquet fiscal. Les deux ne peuvent pas diverger : un dossier microfinance ne peut pas être calculé sur le paquet entreprise, et le système refuse la combinaison au lieu de produire un montant.
- **FR-F73** — Les taxes sectorielles s'activent par le type d'entité, jamais par une case à cocher : **TAF** pour les activités financières (microfinance, banque), **TCA** aux taux différenciés par branche pour l'assurance, régime de droit commun pour le distributeur.
- **FR-F74** — Les règles d'échéance sont portées par le paquet du type : le dépôt annuel au **31/05** des institutions financières et des assurances n'est pas une exception codée, c'est une donnée du paquet correspondant.
- **FR-F75** — Un **régime dérogatoire** (zone franche) est un paquet fiscal à part entière, appliqué à la place du paquet de droit commun, portant ses exonérations et ses taux réduits. Le système signale visiblement qu'un dossier est calculé sous dérogation.
- **FR-F76** — Le module fiscal consomme la **balance canonique quelle que soit sa source** — atelier du cabinet, import de logiciel comptable, ou ingestion directe d'un vertical (`balance.submitted`). Il ne connaît que le contrat, jamais l'origine.
- **FR-F77** — Un vertical intégré (microfinance, assurance, distributeur) obtient le module fiscal sans développement spécifique : il lui suffit de soumettre une balance conforme, taguée du bon référentiel, et de disposer d'un paquet fiscal publié pour son type d'entité.
- **FR-F78** — Un type d'entité sans paquet fiscal publié pour son pays et son exercice produit un refus explicite et nommé, jamais un repli silencieux sur un paquet voisin. ---

### Exigences non fonctionnelles

- **NFR-F01** — Le module **optimise la base par leviers légaux et sécurise la justification ; il ne minore jamais la réalité.** Dissimuler des recettes réelles ou introduire des charges fictives est de la fraude et le système ne doit offrir aucun chemin qui y conduise.
- **NFR-F02** — Aucune déclaration ne peut atteindre un état « Validée » sans action humaine identifiée. L'automatisation prépare, elle n'engage pas.
- **NFR-F03** — Tout calcul opposable est **déterministe et reproductible** : mêmes entrées, même version de paquet, même résultat, quelle que soit la date d'exécution.
- **NFR-F04** — Aucun taux, seuil, barème, tolérance ou échéance n'est codé en dur. Tout provient du paquet fiscal du pays et de l'année.
- **NFR-F05** — Aucun secret d'accès à un canal administratif n'est stocké en v1. Lorsque les connecteurs arriveront, ce sera par coffre-fort dédié : chiffrement fort, rotation, MFA, séparation des rôles, journalisation de chaque accès, et **sans que le collaborateur ait à connaître le secret**.
- **NFR-F06** — L'isolation entre organisations et entre dossiers est absolue : l'appartenance est toujours dérivée du jeton, jamais du corps de la requête.
- **NFR-F07** — Les documents fiscaux ne sont accessibles que par URL présignée à durée limitée, vérifiée depuis le client qui la consommera.
- **NFR-F08** — Journal d'audit append-only, protégé au niveau du stockage — aucun chemin applicatif ne doit pouvoir supprimer ou réécrire une trace.
- **NFR-F09** — Les montants sont manipulés en unités mineures entières, cohérentes avec le contrat de balance canonique. Aucune arithmétique en virgule flottante sur un montant opposable.
- **NFR-F10** — Les données fiscales et leurs preuves sont conservées **dix ans**, valeur par défaut alignée sur l'obligation OHADA de conservation des documents comptables, surchargeable par pays dans le paquet fiscal.
- **NFR-F11** — Ajouter un pays ne doit coûter que de la donnée — **dans la limite des familles de calcul supportées** (FR-F11). Toute autre exception est un défaut de conception à corriger, pas un cas particulier à accepter.
- **NFR-F12** — Le vocabulaire du modèle est neutre : « obligation », « implantation », « canal », « famille » — jamais un nom national dans le code.
- **NFR-F13** — Sur un portefeuille de **500 dossiers portant chacun jusqu'à 12 obligations annuelles** (soit ~6 000 lignes par exercice) : premier rendu du calendrier sous **2 secondes**, application d'un filtre ou d'un tri sous **500 ms**.
- **NFR-F14** — La dérivation du catalogue d'obligations d'un dossier s'exécute en moins de **1 seconde** et est recalculable à la demande après changement de régime ou de version de paquet.
- **NFR-F15** — Une indisponibilité d'un canal administratif ne bloque ni la préparation ni la validation ; seul l'acte de dépôt est différé, et cette attente est visible dans le calendrier.
- **NFR-F16** — Un import de rémunération de **1 000 lignes** est traité de façon transactionnelle : soit la période entière est importée, soit rien ne l'est. ---

### Exigences additionnelles (issues de l'architecture)

Travail imposé par la colonne vertébrale et absent du PRD, qui ne descendait pas à ce niveau. Ces
exigences produisent de vraies stories — surtout dans le socle.

- **AR-01** — Scaffold `fiscal-service` : NestJS 11, port `:3012`, entrée au `docker-compose` racine,
  socle transverse dupliqué (`Throttler` → `JwtAuth` RS256/JWKS → `EmailVerified` → `Roles`), `helmet`,
  `nestjs-cls`, `nestjs-pino`, Swagger, Terminus. Inscription dans l'`AUTH_AUDIENCE` de l'IdP. *(AD-16)*
- **AR-02** — **Deux bases MongoDB** sur le réplica set `rs0` : `fiscal` (métier) et `fiscal_audit`
  (journal). Deux comptes, provisionnés par environnement : l'applicatif (`readWrite` sur `fiscal`,
  `find`+`insert` seulement sur `fiscal_audit`) et un compte de maintenance absent de la configuration du
  service. *(AD-10, AD-19)*
- **AR-03** — Read-models locaux alimentés par trois consommateurs Kafka : `identity.*`,
  `kyc.status.changed`, `entitlement.changed`. *(hérité, AD-16)*
- **AR-04** — Gate `@RequiresFiscalAccess` : `emailVerified` + KYC `APPROVED` + entitlement fiscal
  `ACTIVE`, entièrement local. *(AD-16)*
- **AR-05** — Squelette hexagonal : `domain/` sans dépendance framework, `application/`, `ports/`,
  `adapters/`, `modules/`. *(paradigme)*
- **AR-06** — Chargeur de paquet fiscal depuis `catalog-service` : résolution `(type, pays, année)` →
  `ReferentielVersion`, chargement par `artifactUri`, vérification `checksum` sha256, cache, et **refus
  d'un paquet dont la liste de consommateurs déclarés ne nomme pas `fiscal-service`**. *(AD-5, AD-6)*
- **AR-07** — Journal d'audit : chaînage d'empreintes **par périmètre** (une chaîne par obligation),
  index unique `(perimetre, seq)`, écriture dans la même transaction que le fait qu'elle trace.
  *(AD-10)*
- **AR-08** — Outbox transactionnelle et trois événements `fiscal.obligation.derivee`,
  `fiscal.declaration.deposee`, `fiscal.reglement.rapproche`. *(hérité de STORY-099)*
- **AR-09** — Infrastructure de travaux récurrents BullMQ à clés idempotentes ; aucun ordonnancement en
  mémoire de processus. *(AD-18)*
- **AR-10** — Correspondance fixe code d'erreur → statut HTTP, et point de santé Terminus couvrant Mongo
  (état du réplica set), Kafka, Redis et la résolution du paquet fiscal actif. *(conventions)*
- **AR-11** — **Coordination hors service** : faire acter la sémantique « entité = implantation » sur le
  contrat de balance canonique **avant le départ de STORY-135**. Sans cet acte, AD-7 devient faux.
  *(AD-7 — ce n'est pas du code, c'est une décision de sprint-planning)*

## Liste des épics

Huit épics, `EPIC-027` → `EPIC-034`, dans l'ordre de dépendance. Chacun est autonome : il utilise les
précédents et **n'exige aucun suivant** pour fonctionner. Le découpage suit les cinq incréments du PRD,
avec le socle technique extrait en tête parce que l'architecture l'a rendu explicite.

### EPIC-027 : Socle `fiscal-service` et gouvernance du paquet fiscal

Le service existe, il est gouverné, et il sait quelle réglementation s'applique. À la fin de cet épic,
une organisation habilitée obtient le paquet fiscal résolu pour son type d'entité, son pays et son
exercice — avec refus explicite si rien n'est publié.

**Couvre :** FR-F67, FR-F68, FR-F69, FR-F70, FR-F58, FR-F59 · AR-01 à AR-08, AR-10
**Autonome :** oui — livre un service déployé, authentifié, gaté, avec chargement de paquet vérifié.

### EPIC-028 : Dossier fiscal, implantations et catalogue d'obligations dérivé

Le cabinet sait **quoi** déclarer, pour chaque client et chaque pays. Le dossier porte ses implantations,
chacune avec son type d'entité et ses régimes ; le catalogue en dérive la liste exacte des obligations.

**Couvre :** FR-F01 à FR-F10, FR-F57, FR-F71 à FR-F78 · AR-11
**Autonome :** oui — le catalogue est consultable sans qu'aucune déclaration n'existe.

### EPIC-029 : Moteur de familles de calcul

Un montant est produit et **explicable**. Le registre de stratégies typées et le pipeline de
modificateurs couvrent TVA, IS avec plancher MFP, IRPP, TPU forfaitaire et déclaratif, retenues à taux
conditionnel — et refusent nommément les familles hors périmètre.

**Couvre :** FR-F11 à FR-F15
**Autonome :** oui — testable sur les valeurs réelles du paquet togolais, sans workflow.

### EPIC-030 : Calendrier fiscal et responsabilité

Le cabinet voit tout son portefeuille : échéances, retards, charge par collaborateur, alertes. Le tableur
disparaît.

**Couvre :** FR-F16 à FR-F21 · AR-09
**Autonome :** oui — le calendrier vaut même si aucune déclaration n'est encore préparée.

### EPIC-031 : Chaîne déclarative — alimentation, cycle de vie, contrôles et piste d'audit

Le cœur du produit. La déclaration est alimentée depuis la balance, calculée, contrôlée, versionnée,
validée — et chaque geste laisse une trace inviolable.

**Couvre :** FR-F22 à FR-F26, FR-F33 à FR-F38, FR-F51, FR-F56, FR-F62 à FR-F66
**Autonome :** oui — **premier jalon vendable** : le cabinet produit et valide ses déclarations.

### EPIC-032 : Dépôt assisté, accusé et dossier de contrôle

Le différenciateur. Le livrable est produit au format du canal, le dépôt est guidé, l'accusé est capturé
et archivé, le retard qualifié — et le dossier de contrôle se produit à la demande.

**Couvre :** FR-F39 à FR-F45, FR-F52 à FR-F55
**Autonome :** oui. ⛔ **Jalon bloquant `format confirmé`** : aucune story de cet épic ne démarre sans
pièce réelle en main (accusé, gabarit, parcours de dépôt).

### EPIC-033 : Règlement de l'impôt

Le cycle se boucle : montant dû net des acomptes et crédits, ordre de règlement produit, rapprochement,
et mise en évidence des déclarations déposées mais non payées.

**Couvre :** FR-F46 à FR-F50
**Autonome :** oui.

### EPIC-034 : Base de rémunération et obligations sociales

Les échéances sociales rejoignent le calendrier fiscal, avec leurs cotisations et retenues calculées. La
base est **importée** depuis l'outil de paie ou **saisie**, les deux étant pris en charge.

**Couvre :** FR-F27 à FR-F32
**Autonome :** oui. ⚠️ Dépend de la question ouverte n°2 du PRD (format d'import de paie).

---

## Carte de couverture des exigences

| Exigences | Épic |
| --- | --- |
| FR-F01 → FR-F10 | EPIC-028 — dossier, implantations, catalogue dérivé |
| FR-F11 → FR-F15 | EPIC-029 — familles de calcul et modificateurs |
| FR-F16 → FR-F21 | EPIC-030 — calendrier et responsabilité |
| FR-F22 → FR-F26 | EPIC-031 — alimentation depuis la balance et restitution du chemin |
| FR-F27 → FR-F32 | EPIC-034 — base de rémunération et obligations sociales |
| FR-F33 → FR-F38 | EPIC-031 — cycle de vie, rôles, rectificatives |
| FR-F39 → FR-F45 | EPIC-032 — livrable, guidage, accusé, rejet, archivage |
| FR-F46 → FR-F50 | EPIC-033 — règlement, rapprochement, pénalités estimées |
| FR-F51, FR-F56 | EPIC-031 — journal d'audit et historique |
| FR-F52 → FR-F55 | EPIC-032 — dossier de contrôle, pièces, base légale |
| FR-F57 | EPIC-028 — attestation de mandat à la création du dossier |
| FR-F58, FR-F59 | EPIC-027 — natures d'accès et habilitations graduées |
| FR-F60, FR-F61 | *retirées en v0.3 — sans objet* |
| FR-F62 → FR-F66 | EPIC-031 — contrôles de cohérence et anomalies |
| FR-F67 → FR-F70 | EPIC-027 — publication, intégrité, statut de validation, rattachement à l'exercice |
| FR-F71 → FR-F78 | EPIC-028 — type d'entité, taxes sectorielles, intégration aux verticaux |
| AR-01 → AR-08, AR-10 | EPIC-027 — socle technique |
| AR-09 | EPIC-030 — travaux récurrents BullMQ |
| AR-11 | EPIC-028 — coordination du contrat canonique (hors code) |

**Couverture : 76 exigences fonctionnelles sur 78 mappées ; 2 retirées en v0.3.** Les 16 NFR sont
transverses et portées par les critères d'acceptation des stories concernées, pas par un épic dédié.

---

# EPIC-027 : Socle `fiscal-service` et gouvernance du paquet fiscal

Le service existe, il est gouverné, et il sait quelle réglementation appliquer.

### STORY-179 — Scaffold `fiscal-service` (:3012), socle transverse et point de santé

En tant qu'**équipe plateforme**, je veux un service `fiscal-service` déployé et authentifié, afin que les capacités fiscales aient un hôte conforme aux conventions de l'écosystème. *(AR-01, AR-05, AR-10)*

**Critères d'acceptation**

- **Étant donné** la stack montée par `docker-compose` **quand** le conteneur démarre **alors** il écoute sur `:3012` **et** `GET /health` répond `200` en couvrant Mongo (état du réplica set), Kafka et Redis.
- **Étant donné** une requête portant un JWT RS256 valide **quand** elle atteint une route protégée **alors** le jeton est validé localement via JWKS caché **et** aucun appel réseau n'est émis vers `auth-service`.
- **Étant donné** l'arborescence du service **quand** on inspecte `src/domain/` **alors** aucun import de `@nestjs/*` ni de `mongoose` n'y figure.
- **Étant donné** un code d'erreur métier **quand** il est rendu **alors** son statut HTTP suit la correspondance fixe des conventions (`409` transition interdite, `502` intégrité d'artefact, `422` règle métier, `400` validation, `404` hors organisation).

### STORY-180 — Deux bases MongoDB et rôles restreints (`fiscal`, `fiscal_audit`)

En tant qu'**expert-comptable**, je veux que le journal de preuve soit techniquement ineffaçable, afin qu'aucune évolution future du code ne puisse en supprimer une trace. *(AR-02, AD-10, AD-19)*

**Critères d'acceptation**

- **Étant donné** le compte applicatif **quand** il tente `deleteOne` ou `updateOne` sur une collection de `fiscal_audit` **alors** MongoDB refuse l'opération **et** l'échec provient du serveur, pas d'un garde applicatif.
- **Étant donné** le même compte **quand** il écrit dans la base `fiscal` **alors** il dispose de `readWrite` complet.
- **Étant donné** un environnement de développement **quand** on vérifie les rôles **alors** ils sont identiques à ceux de production ; un environnement où l'applicatif détient `remove` sur `fiscal_audit` est déclaré non conforme par un test.
- **Étant donné** le compte de maintenance **quand** on inspecte la configuration du service **alors** ses identifiants n'y figurent pas.

### STORY-181 — Read-models locaux et gate `@RequiresFiscalAccess`

En tant que **membre d'un cabinet habilité**, je veux accéder aux capacités fiscales sans latence d'autorisation, afin que le service reste utilisable même si un service voisin est indisponible. *(AR-03, AR-04, AD-16)*

**Critères d'acceptation**

- **Étant donné** les événements `identity.*`, `kyc.status.changed` et `entitlement.changed` **quand** ils sont publiés **alors** les read-models locaux sont mis à jour de façon idempotente.
- **Étant donné** une organisation dont le KYC n'est pas `APPROVED` **quand** elle appelle une opération métier **alors** la réponse est `403 KYC_NOT_APPROVED`.
- **Étant donné** une organisation sans entitlement fiscal `ACTIVE` **quand** elle appelle une opération métier **alors** la réponse est `403 FISCAL_NOT_ENTITLED`.
- **Étant donné** `auth-service`, `kyc-service` et `catalog-service` arrêtés **quand** un JWT encore valide est présenté **alors** l'autorisation aboutit depuis les read-models seuls.

### STORY-182 — Chargeur de paquet fiscal depuis `catalog-service`

En tant qu'**administrateur plateforme**, je veux que le service charge le paquet publié et en vérifie l'intégrité, afin qu'aucun calcul ne parte d'une donnée réglementaire altérée. *(FR-F67, FR-F68, AR-06, AD-5, AD-6)*

**Critères d'acceptation**

- **Étant donné** un dossier de type entreprise au Togo pour l'exercice 2026 **quand** le paquet est résolu **alors** le service charge la `ReferentielVersion` `fiscal-tg-entreprise@2026.1` par son `artifactUri`.
- **Étant donné** un artefact dont un octet a été modifié **quand** il est chargé **alors** le service répond `502 REFERENTIEL_INTEGRITY` **et** ne sert aucun contenu.
- **Étant donné** un artefact dont la liste de consommateurs déclarés ne nomme pas `fiscal-service` **quand** il est chargé **alors** le chargement est refusé avec un code nommé.
- **Étant donné** un paquet déjà chargé **quand** il est redemandé **alors** il provient du cache sans nouvel accès au registre.

### STORY-183 — Statut de validation des éléments et rattachement version ↔ exercice

En tant qu'**expert-comptable**, je veux savoir si un montant repose sur une donnée validée par un expert, afin de ne pas déposer sur la foi d'une amorce. *(FR-F69, FR-F70)*

**Critères d'acceptation**

- **Étant donné** un élément de paquet au statut « à valider » **quand** une obligation en dérive un montant **alors** l'obligation porte un signalement visible nommant l'élément concerné.
- **Étant donné** un exercice ouvert **quand** une nouvelle version de paquet est publiée en cours d'exercice **alors** l'exercice reste attaché à la version en vigueur à son ouverture **et** aucun recalcul n'a lieu automatiquement.
- **Étant donné** une déclaration déjà déposée **quand** un recalcul explicite est demandé **alors** il est refusé avec un code nommé.

### STORY-184 — Journal d'audit chaîné par périmètre et outbox transactionnelle

En tant qu'**expert-comptable**, je veux pouvoir démontrer qu'aucune trace n'a disparu, afin que la piste d'audit tienne devant un contrôle. *(AR-07, AR-08, AD-10)*

**Critères d'acceptation**

- **Étant donné** deux transitions concurrentes sur **deux obligations différentes** **quand** elles écrivent leur audit **alors** les deux réussissent sans contention : les chaînes sont indépendantes.
- **Étant donné** deux écritures concurrentes sur la **même** obligation **quand** elles tentent le même `seq` **alors** l'index unique `(perimetre, seq)` en rejette une proprement, sans fourche de chaîne.
- **Étant donné** une chaîne d'entrées **quand** on la vérifie **alors** chaque empreinte correspond à l'entrée précédente **et** toute rupture est détectée et nommée.
- **Étant donné** une transition métier qui échoue **quand** la transaction est annulée **alors** aucune entrée d'audit ni aucun message d'outbox ne subsiste.

### STORY-185 — Habilitations graduées et séparation des natures d'accès

En tant qu'**administrateur de cabinet**, je veux distribuer des droits par action, afin qu'un collaborateur puisse préparer sans pouvoir déposer. *(FR-F58, FR-F59)*

**Critères d'acceptation**

- **Étant donné** un collaborateur habilité à préparer mais pas à déposer **quand** il tente de marquer une obligation déposée **alors** la réponse est `403` **et** le refus est journalisé.
- **Étant donné** les cinq natures d'accès **quand** on inspecte le modèle **alors** identifiant fiscal, compte de canal, habilitation applicative, certificat et accès bancaire sont des concepts distincts, aucun n'en impliquant un autre.

---

# EPIC-028 : Dossier fiscal, implantations et catalogue d'obligations dérivé

Le cabinet sait **quoi** déclarer, pour chaque client et chaque pays.

### STORY-186 — Dossier fiscal, attestation de mandat et historisation

En tant que **collaborateur de cabinet**, je veux créer le dossier fiscal d'un client, afin de regrouper ses implantations et de tracer que le cabinet le représente. *(FR-F04, FR-F57)*

**Critères d'acceptation**

- **Étant donné** la création d'un dossier **quand** elle aboutit **alors** une attestation de mandat horodatée et attribuée à son auteur est écrite au journal, sans formulaire ni pièce exigée.
- **Étant donné** un dossier modifié plusieurs fois **quand** on demande son état à une date passée **alors** il est reconstitué fidèlement depuis l'historique append-only.
- **Étant donné** un dossier d'une autre organisation **quand** il est demandé **alors** la réponse est `404`, jamais `403`.

### STORY-187 — Implantations fiscales : création, type d'entité, clôture

En tant que **collaborateur de cabinet**, je veux déclarer les implantations d'un client, afin que chaque contexte national ait son identité fiscale et ses obligations propres. *(FR-F01, FR-F02, FR-F05, AD-7)*

**Critères d'acceptation**

- **Étant donné** un dossier **quand** j'y ajoute une implantation **alors** elle porte un pays, un type d'entité, un identifiant fiscal et ses régimes.
- **Étant donné** deux implantations du même dossier dans deux pays **quand** on les consulte **alors** chacune porte ses propres obligations, sans mélange.
- **Étant donné** une implantation clôturée pour cessation d'activité **quand** on consulte son historique **alors** ses obligations passées demeurent intactes.
- **Étant donné** une tentative d'enregistrer un secret d'accès à un portail **quand** elle est soumise **alors** elle est refusée : aucun champ du modèle ne l'accepte.

### STORY-188 — Proposition et confirmation des régimes par implantation

En tant qu'**expert-comptable**, je veux que le système propose les régimes et me demande de confirmer, afin que la responsabilité professionnelle reste humaine. *(FR-F03)*

**Critères d'acceptation**

- **Étant donné** un pays, un objet social et un chiffre d'affaires **quand** je demande une proposition **alors** les régimes comptable et fiscal sont proposés **et** les seuils viennent du paquet, jamais du code.
- **Étant donné** une proposition **quand** je confirme un régime divergent **alors** un motif est obligatoire, sans quoi la réponse est `400`.
- **Étant donné** un chiffre d'affaires absent ou à moins de 10 % d'un seuil **quand** la proposition est rendue **alors** elle porte un avertissement de confiance dégradée.

### STORY-189 — Résolution conjointe type d'entité → référentiel et paquet

En tant qu'**administrateur plateforme**, je veux qu'un dossier microfinance ne puisse jamais être calculé sur le paquet entreprise, afin d'éviter un montant faux et opposable. *(FR-F71, FR-F72, FR-F78, AD-15)*

**Critères d'acceptation**

- **Étant donné** une implantation de type SFD **quand** le référentiel et le paquet sont résolus **alors** les deux partent du même type d'entité.
- **Étant donné** une combinaison incohérente entre type et référentiel comptable **quand** elle est soumise **alors** elle est refusée avec `REFERENTIEL_INCOHERENT`.
- **Étant donné** un type d'entité sans paquet publié pour son pays et son exercice **quand** on tente une dérivation **alors** la réponse est `PAQUET_NON_PUBLIE`, jamais un repli sur un paquet voisin.

### STORY-190 — Dérivation du catalogue d'obligations

En tant que **collaborateur de cabinet**, je veux que le système établisse seul la liste des obligations d'un client, afin de ne plus la tenir de mémoire. *(FR-F06, FR-F07, FR-F09, FR-F10, AD-17)*

**Critères d'acceptation**

- **Étant donné** une implantation renseignée **quand** la dérivation s'exécute **alors** les obligations applicables sont créées avec assiette, périodicité, échéance, canal et base légale citée.
- **Étant donné** une dérivation déjà exécutée **quand** elle est rejouée **alors** aucune obligation n'est dupliquée : la clé `(implantation, taxe, période)` est unique.
- **Étant donné** une obligation déjà affectée et en préparation **quand** une re-dérivation survient **alors** échéance et montant attendu sont actualisés **mais** statut, responsable et déclarations sont préservés.
- **Étant donné** une entrée de catalogue dont une donnée manque au paquet **quand** la dérivation s'exécute **alors** l'obligation est signalée comme non dérivable, jamais omise en silence.

### STORY-191 — Activation et désactivation manuelle d'une obligation

En tant qu'**expert-comptable**, je veux écarter une obligation qui ne s'applique pas à mon client, afin que le référentiel propose sans décider à ma place. *(FR-F08)*

**Critères d'acceptation**

- **Étant donné** une obligation dérivée **quand** je la désactive sans motif **alors** la réponse est `400`.
- **Étant donné** une désactivation motivée **quand** elle est enregistrée **alors** elle est journalisée **et** l'obligation disparaît du calendrier sans être supprimée.
- **Étant donné** une obligation désactivée **quand** une re-dérivation survient **alors** elle n'est pas réactivée automatiquement.

### STORY-192 — Taxes sectorielles et échéances portées par le type d'entité

En tant qu'**expert-comptable d'une institution de microfinance**, je veux que les taxes de mon secteur apparaissent sans configuration, afin de ne rien oublier. *(FR-F73, FR-F74)*

**Critères d'acceptation**

- **Étant donné** une implantation de type SFD **quand** le catalogue est dérivé **alors** la taxe sur les activités financières y figure, sans case à cocher.
- **Étant donné** une implantation de type assurance **quand** le catalogue est dérivé **alors** la taxe sur les conventions d'assurance y figure avec ses taux différenciés par nature.
- **Étant donné** une entité financière ou d'assurance **quand** l'échéance de dépôt annuel est calculée **alors** elle vaut le 31/05 **et** cette date provient du paquet, pas d'une exception codée.

### STORY-193 — Régime dérogatoire et signalement

En tant qu'**expert-comptable**, je veux qu'un dossier sous régime dérogatoire soit visiblement signalé, afin de ne jamais lui appliquer le droit commun par inadvertance. *(FR-F75)*

**Critères d'acceptation**

- **Étant donné** une implantation en zone franche **quand** son paquet est résolu **alors** c'est le paquet dérogatoire qui s'applique, à la place du paquet de droit commun.
- **Étant donné** un dossier calculé sous dérogation **quand** on consulte ses obligations **alors** un signalement explicite l'indique.

### STORY-194 — Agnosticisme de la source de balance

En tant que **vertical microfinance, assurance ou distributeur**, je veux obtenir les capacités fiscales sans développement spécifique, afin qu'une balance conforme suffise. *(FR-F76, FR-F77, AD-14)*

**Critères d'acceptation**

- **Étant donné** une balance issue de l'ingestion directe d'un vertical **quand** elle alimente une déclaration **alors** le traitement est identique à celui d'une balance issue de l'atelier ou d'un import.
- **Étant donné** le code du domaine **quand** on le fouille **alors** aucune lecture ni test sur l'origine de la balance n'y figure.
- **Étant donné** un vertical disposant d'un paquet publié pour son type d'entité **quand** il soumet une balance conforme **alors** ses obligations sont dérivées sans code dédié.

---

# EPIC-029 : Moteur de familles de calcul

Un montant est produit et **explicable**, ou refusé nommément.

### STORY-195 — Registre de familles, famille proportionnelle et détail de calcul

En tant qu'**expert-comptable**, je veux voir comment un montant a été obtenu, afin de pouvoir le défendre. *(FR-F11, FR-F15, AD-2)*

**Critères d'acceptation**

- **Étant donné** une taxe déclarée `PROPORTIONNELLE` au taux de 18 % **quand** l'assiette vaut 10 000 000 **alors** le montant vaut 1 800 000, en unités mineures entières.
- **Étant donné** un calcul exécuté **quand** on demande son détail **alors** entrées, étapes, arrondis et résultat sont restitués.
- **Étant donné** des paramètres de paquet non conformes au schéma de la famille **quand** le paquet est chargé **alors** le chargement échoue, jamais au moment du calcul.
- **Étant donné** le code du moteur **quand** on le fouille **alors** aucune évaluation dynamique d'expression n'y figure.

### STORY-196 — Familles barème par tranches et forfait par tranche

En tant qu'**expert-comptable**, je veux que les impôts progressifs et forfaitaires se calculent depuis le paquet, afin qu'un changement de barème ne demande aucune livraison. *(FR-F11)*

**Critères d'acceptation**

- **Étant donné** le barème d'impôt sur le revenu à huit tranches du paquet togolais **quand** un revenu tombe dans la tranche haute **alors** le calcul applique 35 % à la seule fraction concernée.
- **Étant donné** une taxe forfaitaire par tranche de chiffre d'affaires **quand** l'assiette tombe dans une tranche **alors** le montant fixe de cette tranche est rendu.
- **Étant donné** une assiette exactement égale à une borne **quand** le calcul s'exécute **alors** la tranche retenue est celle que le paquet déclare comme incluant la borne.

### STORY-197 — Pipeline de modificateurs ordonné

En tant qu'**expert-comptable**, je veux que plancher, taux et minimum s'appliquent toujours dans le même ordre, afin que deux calculs de la même taxe donnent le même montant. *(FR-F12, AD-3)*

**Critères d'acceptation**

- **Étant donné** l'impôt sur les sociétés et son minimum forfaitaire **quand** le résultat de droit commun est inférieur au minimum **alors** `MAXIMUM_DE` retient le minimum.
- **Étant donné** une taxe professionnelle unique dont le montant calculé est inférieur au minimum de perception **quand** le pipeline s'exécute **alors** le montant rendu vaut le minimum.
- **Étant donné** une assiette sociale inférieure au salaire minimum **quand** `PLANCHER_ASSIETTE` s'applique **alors** l'assiette retenue vaut le plancher.
- **Étant donné** un modificateur absent de la liste déclarée **quand** il apparaît dans un paquet **alors** le chargement échoue.

### STORY-198 — Aiguillage, y compris sur l'état d'un tiers

En tant qu'**expert-comptable**, je veux que le taux applicable se déduise du critère prévu par la loi, afin de ne pas choisir à la main entre trois taux. *(FR-F12, FR-F13)*

**Critères d'acceptation**

- **Étant donné** une taxe unique déclarative **quand** l'activité est commerciale **alors** le taux retenu est 2 % ; **quand** elle est de services **alors** il est 8 %.
- **Étant donné** une retenue dont le taux dépend de la régularité fiscale du prestataire **quand** ce critère n'est pas saisi et daté au dossier **alors** l'obligation est bloquée avec le motif, aucun taux par défaut n'étant appliqué.
- **Étant donné** le critère saisi et daté **quand** le calcul s'exécute **alors** le taux correspondant est retenu et figure au détail de calcul.

### STORY-199 — Familles hors périmètre : déclarables, non calculables

En tant qu'**expert-comptable**, je veux qu'une taxe que le moteur ne sait pas calculer apparaisse quand même à mon calendrier, afin de ne pas l'oublier. *(FR-F14, AD-4)*

**Critères d'acceptation**

- **Étant donné** une taxe déclarée dans une famille sans stratégie enregistrée **quand** le catalogue est dérivé **alors** l'obligation existe, porte `montantASaisir` **et** un refus de calcul nommé.
- **Étant donné** une telle obligation **quand** un montant est saisi **alors** elle suit le cycle de vie normal.
- **Étant donné** l'ensemble des obligations d'un portefeuille **quand** on mesure la part à montant saisi **alors** elle est restituable : c'est une contre-métrique du produit.

---

# EPIC-030 : Calendrier fiscal et responsabilité

Le cabinet voit tout son portefeuille : échéances, retards, charge. Le tableur disparaît.

### STORY-200 — Calendrier fiscal centralisé, filtres et tri

En tant qu'**expert-comptable**, je veux voir en une page toutes les obligations de mon portefeuille, afin de savoir ce qui risque d'être en retard. *(FR-F16, FR-F17)*

**Critères d'acceptation**

- **Étant donné** un portefeuille de dossiers **quand** j'ouvre le calendrier **alors** chaque ligne porte dossier, pays, obligation, période, échéance, responsable et statut.
- **Étant donné** un calendrier **quand** je filtre par pays, collaborateur, type d'obligation, période ou statut **alors** le résultat est cohérent et combinable.
- **Étant donné** un portefeuille de 500 dossiers portant jusqu'à 12 obligations annuelles **quand** le calendrier est demandé **alors** le premier rendu tient sous 2 secondes **et** un filtre s'applique sous 500 ms. *(NFR-F13)*

### STORY-201 — Calcul des échéances depuis le paquet

En tant qu'**expert-comptable**, je veux que les dates limites viennent de la réglementation et non du code, afin qu'un changement de loi de finances ne demande aucune livraison. *(FR-F18, NFR-F04)*

**Critères d'acceptation**

- **Étant donné** une société au réel **quand** ses acomptes sont générés **alors** leurs échéances tombent aux quatre dates du paquet (31/01, 31/05, 31/07, 31/10).
- **Étant donné** une entreprise individuelle, une société, puis une banque **quand** l'échéance de dépôt annuel est calculée **alors** elle vaut respectivement 31/03, 30/04 et 31/05, toutes trois lues du paquet.
- **Étant donné** le code du service **quand** on y cherche une date d'échéance en dur **alors** on n'en trouve aucune.

### STORY-202 — Reports d'échéance administratifs

En tant qu'**expert-comptable**, je veux enregistrer un report accordé par l'administration, afin que mon calendrier reflète la réalité sans perdre la date légale d'origine. *(FR-F20)*

**Critères d'acceptation**

- **Étant donné** un report saisi et daté **quand** il s'applique à une obligation **alors** l'échéance affichée devient la date reportée **et** l'échéance légale d'origine reste enregistrée et consultable.
- **Étant donné** une obligation dont l'échéance a été reportée **quand** le retard est qualifié **alors** il se calcule sur la date reportée.
- **Étant donné** un report **quand** il est enregistré **alors** son auteur, sa date et sa portée sont journalisés.

### STORY-203 — Alertes d'échéance et états de retard

En tant que **collaborateur de cabinet**, je veux être alerté avant l'échéance, afin de ne pas découvrir le retard une fois la majoration acquise. *(FR-F19, AR-09, AD-18)*

**Critères d'acceptation**

- **Étant donné** un horizon d'alerte paramétrable **quand** une obligation entre dans cet horizon sans être préparée **alors** une alerte est produite.
- **Étant donné** deux répliques du service **quand** l'ordonnanceur s'exécute **alors** l'alerte n'est produite qu'une fois, grâce à la clé de travail idempotente.
- **Étant donné** le service redémarré **quand** l'ordonnanceur reprend **alors** aucun travail programmé n'est perdu.
- **Étant donné** trois obligations distinctes **quand** on consulte leur état **alors** le système distingue « pas encore préparée », « en retard de préparation » et « échéance dépassée ».
- **Étant donné** le code du service **quand** on le fouille **alors** aucun `setInterval` ni minuterie applicative n'y figure.

### STORY-204 — Responsable désigné et vue de charge par collaborateur

En tant qu'**administrateur de cabinet**, je veux savoir qui porte quoi, afin de répartir la charge avant l'échéance et non après. *(FR-F21)*

**Critères d'acceptation**

- **Étant donné** une obligation **quand** je lui affecte un responsable **alors** l'affectation est journalisée et visible au calendrier.
- **Étant donné** un collaborateur **quand** j'ouvre sa vue **alors** sa charge et ses retards sont restitués.
- **Étant donné** une re-dérivation du catalogue **quand** elle s'exécute **alors** les affectations existantes sont préservées.

---

# EPIC-031 : Chaîne déclarative — alimentation, cycle de vie, contrôles et piste d'audit

Le cœur du produit, et le **premier jalon vendable**.

### STORY-205 — Alimentation depuis la balance et blocage motivé

En tant que **collaborateur de cabinet**, je veux que les bases fiscales viennent des données comptables, afin de ne rien ressaisir. *(FR-F22, FR-F25)*

**Critères d'acceptation**

- **Étant donné** une balance validée pour l'exercice **quand** je prépare une déclaration **alors** ses bases sont alimentées sans ressaisie.
- **Étant donné** une période sans balance exploitable **quand** je prépare la déclaration **alors** l'obligation est marquée bloquée **et** le message nomme précisément ce qui manque.
- **Étant donné** une balance en brouillon plutôt que validée **quand** elle alimente une déclaration **alors** la déclaration porte la mention du statut de preuve de sa source.

### STORY-206 — Délégation du calcul au moteur de `balance-service`

En tant qu'**équipe plateforme**, je veux que le calcul reste au seul endroit qui en a la charge, afin qu'aucun second moteur fiscal ne diverge. *(FR-F23, AD-1)*

**Critères d'acceptation**

- **Étant donné** une déclaration à chiffrer **quand** le montant est produit **alors** il provient du moteur de `balance-service`, consommé par un port.
- **Étant donné** le code du domaine **quand** on le fouille **alors** aucune règle d'imposition n'y est implémentée.
- **Étant donné** `balance-service` indisponible **quand** une préparation est tentée **alors** l'échec est explicite et retentable, sans montant partiel enregistré.

### STORY-207 — Triplet calculé, déclaré, payé

En tant qu'**expert-comptable**, je veux que les trois montants restent distincts, afin de pouvoir expliquer tout écart en contrôle. *(FR-F24)*

**Critères d'acceptation**

- **Étant donné** une déclaration **quand** on la consulte **alors** montant calculé, déclaré et payé sont trois valeurs distinctes et durables.
- **Étant donné** un montant déclaré différent du montant calculé **quand** la déclaration est validée **alors** un motif est exigé.
- **Étant donné** un tel écart **quand** on consulte le dossier de contrôle **alors** l'écart et son motif y figurent.

### STORY-208 — Cycle de vie de l'obligation et rôles

En tant qu'**expert-comptable**, je veux un cheminement unique de la préparation à la clôture, afin que chaque dossier suive la même discipline. *(FR-F33, FR-F34)*

**Critères d'acceptation**

- **Étant donné** une obligation **quand** elle progresse **alors** elle suit exactement le cycle `À préparer → En préparation → À contrôler → À valider → Validée → À déposer → Déposée → Accusé reçu → À payer → Payée → Clôturée`.
- **Étant donné** un collaborateur **quand** il tente de valider **alors** la transition est refusée : seul l'expert-comptable valide.
- **Étant donné** une transition quelconque **quand** elle aboutit **alors** l'état et son entrée d'audit sont écrits dans la **même** transaction.
- **Étant donné** une transition non prévue par le cycle **quand** elle est tentée **alors** la réponse est `409`.

### STORY-209 — Validation du client capturée comme pièce

En tant qu'**expert-comptable**, je veux consigner l'accord du client sans lui ouvrir l'application, afin que la validation reste opposable. *(FR-F35)*

**Critères d'acceptation**

- **Étant donné** un dossier exigeant la validation du client **quand** aucune pièce de validation n'est déposée **alors** l'obligation ne peut pas atteindre « Déposée ».
- **Étant donné** une pièce de validation (document signé, courriel, ou mention manuelle) **quand** elle est enregistrée **alors** elle est horodatée et attribuée à celui qui la consigne.
- **Étant donné** la société cliente **quand** on cherche son accès applicatif **alors** il n'en existe aucun.

### STORY-210 — Rectificatives versionnées, immuabilité et clôture

En tant qu'**expert-comptable**, je veux corriger une déclaration sans effacer la précédente, afin que l'historique tienne devant l'administration. *(FR-F36, FR-F37, FR-F38, AD-9)*

**Critères d'acceptation**

- **Étant donné** une déclaration déposée **quand** une rectificative est créée **alors** une nouvelle version apparaît **et** la précédente reste inchangée, avec motif, auteur et date.
- **Étant donné** une version existante **quand** une mise à jour est tentée par n'importe quel chemin applicatif **alors** elle échoue.
- **Étant donné** une obligation clôturée **quand** une mutation autre qu'une rectificative est tentée **alors** la réponse est `409 OBLIGATION_CLOTUREE`.
- **Étant donné** un retour en arrière dans le cycle **quand** il est effectué **alors** un motif est obligatoire.

### STORY-211 — Contrôles de cohérence intra-période avec tolérances

En tant qu'**expert-comptable**, je veux que le système repère les incohérences avant l'administration, afin de ne pas déposer une déclaration qui sera rejetée. *(FR-F62, FR-F63)*

**Critères d'acceptation**

- **Étant donné** une déclaration de taxe sur la valeur ajoutée **quand** elle est contrôlée **alors** elle est rapprochée du chiffre d'affaires comptabilisé, dans la tolérance déclarée au paquet.
- **Étant donné** un contrôle **quand** il s'exécute **alors** il n'utilise jamais une égalité stricte : la tolérance vient du paquet, comme la tolérance d'équilibre de la balance.
- **Étant donné** des acomptes **quand** ils sont contrôlés **alors** ils sont rapprochés du résultat de l'exercice précédent.

### STORY-212 — Continuité inter-périodes

En tant qu'**expert-comptable**, je veux que les reports d'une période à l'autre soient vérifiés, afin qu'un crédit de taxe ne disparaisse pas en route. *(FR-F64)*

**Critères d'acceptation**

- **Étant donné** un crédit de taxe reporté **quand** la période suivante est préparée **alors** le report est repris et rapproché.
- **Étant donné** un déficit reportable **quand** il est imputé **alors** l'imputation respecte les règles du paquet.
- **Étant donné** une rupture de continuité **quand** elle est détectée **alors** une anomalie est levée en nommant les deux périodes concernées.

### STORY-213 — Anomalies : gravité, blocage et levée motivée

En tant qu'**expert-comptable**, je veux distinguer ce qui empêche de valider de ce qui mérite un regard, afin de ne pas traiter tout au même niveau. *(FR-F65, FR-F66)*

**Critères d'acceptation**

- **Étant donné** une anomalie **quand** elle est levée par le système **alors** elle porte une gravité, une explication en langage clair et l'action attendue.
- **Étant donné** une anomalie bloquante non traitée **quand** la validation est tentée **alors** elle est refusée.
- **Étant donné** une anomalie levée par un utilisateur **quand** aucun motif n'est fourni **alors** la levée est refusée ; **quand** un motif est fourni **alors** elle est journalisée et apparaît au dossier de contrôle.

### STORY-214 — Restitution du chemin d'un montant et historique complet

En tant qu'**expert-comptable**, je veux remonter d'un montant déclaré jusqu'aux pièces, afin de répondre à un contrôleur sans reconstituer à la main. *(FR-F26, FR-F51, FR-F56)*

**Critères d'acceptation**

- **Étant donné** un montant déclaré **quand** j'en demande l'origine **alors** le chemin `montant → détail de calcul → balance → journal → pièces disponibles` est restitué.
- **Étant donné** un exercice clos et un collaborateur ayant quitté le cabinet **quand** on consulte l'historique **alors** il reste complet et lisible.
- **Étant donné** toute action sur une obligation ou une déclaration **quand** on consulte le journal **alors** qui, quoi, quand, depuis quel état, vers quel état et avec quel motif y figurent.

---

# EPIC-032 : Dépôt assisté, accusé et dossier de contrôle

Le différenciateur. ⛔ **Jalon bloquant `format confirmé`** : aucune story de cet épic ne démarre sans pièce réelle en main.

### STORY-215 — Port de canal asynchrone et production du livrable

En tant que **collaborateur de cabinet**, je veux obtenir le fichier exact attendu par l'administration, afin de ne pas le reconstituer à la main. *(FR-F39, AD-11, AD-12)*

**Critères d'acceptation**

- **Étant donné** une déclaration validée **quand** je demande son livrable **alors** il est produit au format déclaré du canal.
- **Étant donné** une déclaration de liasse ou d'états financiers **quand** le livrable est produit **alors** son contenu est **obtenu de `bilan-service`** et n'est jamais reproduit ici.
- **Étant donné** un dépôt **quand** il est engagé **alors** l'appel rend un identifiant de dépôt **et** l'accusé n'est jamais une valeur de retour : il arrive comme un fait séparé.
- **Étant donné** le domaine **quand** on le fouille **alors** aucun nom de pays, de portail ou de guichet n'y figure.

### STORY-216 — Format de canal décrit comme donnée du paquet

En tant qu'**administrateur plateforme**, je veux décrire un nouveau canal sans livrer de code, afin qu'un second pays ne coûte que de la donnée. *(FR-F40, NFR-F11)*

**Critères d'acceptation**

- **Étant donné** un canal décrit au paquet (gabarit, champs, contraintes) **quand** un livrable est produit **alors** il respecte cette description sans code spécifique.
- **Étant donné** un canal dont la description est incomplète **quand** un livrable est demandé **alors** le refus nomme le champ manquant.
- **Étant donné** deux canaux de nature différente (téléversement de classeur, saisie de formulaire) **quand** ils sont décrits **alors** les deux passent par le même port.

### STORY-217 — Guidage de dépôt pas à pas

En tant que **collaborateur de cabinet**, je veux être guidé écran par écran sur le portail, afin de ne retaper aucun montant. *(FR-F41)*

**Critères d'acceptation**

- **Étant donné** un dépôt engagé **quand** le guidage est affiché **alors** les étapes sont ordonnées et proviennent du paquet, pas du code.
- **Étant donné** une étape comportant des valeurs à reporter **quand** je la consulte **alors** chaque valeur est **copiable individuellement**.
- **Étant donné** un montant déjà connu du système **quand** le guidage le présente **alors** il n'est jamais demandé en saisie.

### STORY-218 — Capture de l'accusé et qualification du retard

En tant qu'**expert-comptable**, je veux archiver la preuve du dépôt, afin de pouvoir la produire deux ans plus tard. *(FR-F42, FR-F43)*

**Critères d'acceptation**

- **Étant donné** un accusé sous forme de document **quand** je le téléverse **alors** il est horodaté et rattaché à la déclaration.
- **Étant donné** un accusé sous forme de simple référence **quand** je la saisis **alors** elle est acceptée au même titre qu'un document.
- **Étant donné** une obligation sans accusé **quand** on tente de la passer à « Accusé reçu » **alors** la transition est refusée avec `ACCUSE_REQUIS`.
- **Étant donné** une date réelle de dépôt postérieure à l'échéance **quand** elle est enregistrée **alors** le retard est qualifié et le risque associé affiché.

### STORY-219 — Rejet administratif

En tant qu'**expert-comptable**, je veux traiter un rejet sans perdre l'historique, afin que la reprise reste traçable. *(FR-F44)*

**Critères d'acceptation**

- **Étant donné** un rejet notifié **quand** je l'enregistre avec son motif et sa date **alors** l'obligation revient dans le cycle sans qu'aucune version antérieure ne soit altérée.
- **Étant donné** une obligation rejetée puis redéposée **quand** on consulte son dossier de contrôle **alors** le rejet, son motif et le nouveau dépôt y figurent tous les trois.

### STORY-220 — Archivage des livrables et accusés

En tant qu'**expert-comptable**, je veux retrouver toute pièce depuis l'obligation qu'elle concerne, afin de ne plus fouiller une boîte mail. *(FR-F45)*

**Critères d'acceptation**

- **Étant donné** un livrable ou un accusé **quand** il est archivé **alors** il l'est dans `document-service`, rattaché au dossier, à l'implantation, à l'obligation et à la période.
- **Étant donné** une pièce archivée **quand** je la consulte **alors** l'accès passe par une URL présignée à durée limitée, vérifiée depuis le client qui la consomme. *(NFR-F07)*

### STORY-221 — Dossier de contrôle à la demande

En tant qu'**expert-comptable**, je veux produire en une action tout ce qu'un contrôleur peut demander, afin d'aborder un contrôle sans reconstitution. *(FR-F52)*

**Critères d'acceptation**

- **Étant donné** un périmètre choisi (dossier, période, taxe) **quand** je demande le dossier de contrôle **alors** il contient versions, validations, dépôts, accusés, règlements, pièces et bases légales invoquées.
- **Étant donné** un dossier de contrôle produit **quand** on vérifie les chaînes d'audit qu'il couvre **alors** leur intégrité est attestée.

### STORY-222 — Rapprochement des pièces justificatives, granularité annoncée

En tant qu'**expert-comptable**, je veux savoir quelle part d'un montant n'est pas documentée, afin de la traiter avant le contrôle. *(FR-F53)*

**Critères d'acceptation**

- **Étant donné** un montant déclaré **quand** le rapprochement s'exécute **alors** la part non documentée est chiffrée au niveau du compte et de la période.
- **Étant donné** ce résultat **quand** il est restitué **alors** la granularité est **annoncée explicitement** — compte et période, pas facture individuelle.
- **Étant donné** aucune pièce rattachée **quand** le rapprochement s'exécute **alors** le résultat le dit, plutôt que de rendre zéro.

### STORY-223 — Liaison entre écriture comptable et pièce justificative

En tant qu'**expert-comptable**, je veux relier une écriture à la pièce qui la justifie, afin de descendre au niveau de la facture. *(FR-F54)*

**Critères d'acceptation**

- **Étant donné** une écriture comptable **quand** une pièce lui est rattachée **alors** la liaison est persistée et consultable dans les deux sens.
- **Étant donné** cette liaison disponible **quand** le rapprochement de STORY-222 s'exécute **alors** il peut descendre au niveau de la pièce.
- **Étant donné** l'absence de liaison **quand** le rapprochement s'exécute **alors** il retombe sur la granularité compte × période sans échouer.

### STORY-224 — Base légale citée verbatim sur chaque retraitement

En tant qu'**expert-comptable**, je veux que chaque retraitement porte son texte de loi, afin de le défendre article en main. *(FR-F55)*

**Critères d'acceptation**

- **Étant donné** un retraitement fiscal appliqué **quand** je consulte sa justification **alors** l'article et son texte verbatim sont restitués depuis le corpus packagé.
- **Étant donné** un retraitement sans base légale au paquet **quand** il est appliqué **alors** il est signalé comme non justifié.

---

# EPIC-033 : Règlement de l'impôt

Le cycle se boucle. Prospera prépare et rapproche ; il n'exécute jamais.

### STORY-225 — Montant à régler net d'acomptes, crédits et retenues

En tant qu'**expert-comptable**, je veux connaître le solde réellement dû, afin de ne pas payer deux fois ce qui l'a déjà été. *(FR-F46)*

**Critères d'acceptation**

- **Étant donné** des acomptes versés, des crédits d'impôt, des retenues opérées et des reports antérieurs **quand** le montant à régler est calculé **alors** tous sont déduits.
- **Étant donné** un excédent de versement **quand** le calcul s'exécute **alors** il est restitué comme excédent, jamais comme un montant dû négatif.

### STORY-226 — Ordre de règlement produit, jamais exécuté

En tant qu'**expert-comptable**, je veux préparer le règlement sans que l'outil touche aux comptes de mon client, afin que la chaîne financière reste chez lui. *(FR-F47, AD-13)*

**Critères d'acceptation**

- **Étant donné** un montant à régler **quand** je demande l'ordre de règlement **alors** un ordre ou des instructions sont produits.
- **Étant donné** le service **quand** on cherche une capacité d'exécution de paiement **alors** il n'en existe aucune, sous aucune forme.
- **Étant donné** un ordre produit **quand** on l'inspecte **alors** il ne contient aucun identifiant d'accès bancaire.

### STORY-227 — Rapprochement du règlement et refus d'imputation incohérente

En tant qu'**expert-comptable**, je veux qu'un règlement s'impute sur la bonne période et la bonne taxe, afin d'éviter l'erreur qui coûte une majoration. *(FR-F48)*

**Critères d'acceptation**

- **Étant donné** un règlement **quand** il est rapproché **alors** montant, date, référence et canal sont enregistrés contre la déclaration.
- **Étant donné** un règlement imputé sur une période ou une taxe incohérente **quand** il est soumis **alors** il est refusé ou signalé, jamais accepté en silence.

### STORY-228 — Distinction « déposée » et « payée »

En tant qu'**expert-comptable**, je veux voir immédiatement ce qui est déposé mais non payé, afin de corriger la croyance « j'ai déclaré donc c'est fini ». *(FR-F49)*

**Critères d'acceptation**

- **Étant donné** une obligation déposée sans règlement rapproché **quand** j'ouvre le calendrier **alors** elle est mise en évidence.
- **Étant donné** les deux états **quand** on les consulte **alors** « déposée » et « payée » sont distincts et ne se déduisent jamais l'un de l'autre.

### STORY-229 — Estimation des pénalités et majorations comme risque

En tant qu'**expert-comptable**, je veux mesurer ce qu'un retard coûterait, afin de prioriser mes rattrapages. *(FR-F50)*

**Critères d'acceptation**

- **Étant donné** une obligation en retard **quand** l'estimation s'exécute **alors** les majorations sont calculées depuis les règles du paquet (30 / 40 / 80 % selon la gravité).
- **Étant donné** cette estimation **quand** elle est affichée **alors** elle est présentée comme un **risque estimé**, jamais confondue avec un montant dû constaté.

---

# EPIC-034 : Base de rémunération et obligations sociales

Le calendrier social rejoint le calendrier fiscal.

### STORY-230 — Base de rémunération par salarié et par période

En tant que **collaborateur de cabinet**, je veux disposer des rémunérations d'une période, afin de calculer les cotisations et les retenues. *(FR-F27)*

**Critères d'acceptation**

- **Étant donné** une période **quand** la base est constituée **alors** elle porte, par salarié, salaires, primes, gratifications, commissions et avantages en nature.
- **Étant donné** des remboursements de frais **quand** ils sont présents **alors** ils sont exclus de l'assiette.
- **Étant donné** une base constituée **quand** elle est modifiée **alors** la version antérieure est conservée.

### STORY-231 — Import d'un fichier de paie, idempotent et versionné

En tant que **collaborateur de cabinet**, je veux importer la sortie de mon outil de paie, afin de ne pas ressaisir chaque mois ce que je possède déjà. *(FR-F28, FR-F29)*

**Critères d'acceptation**

- **Étant donné** un fichier de paie **quand** je l'importe **alors** la base de la période est constituée sans saisie.
- **Étant donné** le même fichier réimporté **quand** l'import s'exécute **alors** rien n'est dupliqué.
- **Étant donné** un fichier corrigé **quand** il est réimporté **alors** la base est versionnée **et** l'antérieure reste consultable.
- **Étant donné** un import de 1 000 lignes dont une est invalide **quand** il s'exécute **alors** la période entière est refusée : soit tout est importé, soit rien. *(NFR-F16)*

### STORY-232 — Saisie manuelle de la base de rémunération

En tant que **collaborateur de cabinet** dont le client n'a pas d'outil de paie, je veux saisir les rémunérations, afin que ce dossier ne soit pas exclu du calcul social. *(FR-F28)*

**Critères d'acceptation**

- **Étant donné** un dossier sans fichier de paie **quand** je saisis les rémunérations **alors** la base est constituée à l'identique de celle issue d'un import.
- **Étant donné** une base saisie **quand** elle alimente un calcul **alors** son origine (saisie ou import) est tracée.

### STORY-233 — Calcul des cotisations et des retenues sur salaires

En tant qu'**expert-comptable**, je veux que les charges sociales et les retenues se calculent depuis le paquet, afin qu'un changement de taux ne demande aucune livraison. *(FR-F30)*

**Critères d'acceptation**

- **Étant donné** une base de rémunération **quand** le calcul s'exécute **alors** les parts employeur et salarié sont produites depuis les taux du paquet.
- **Étant donné** une assiette inférieure au salaire minimum **quand** le calcul s'exécute **alors** le plancher du paquet s'applique.
- **Étant donné** un revenu salarial **quand** la retenue d'impôt est calculée **alors** elle suit le barème par tranches du paquet.

### STORY-234 — Obligations sociales dans le calendrier, le cycle et la preuve

En tant qu'**expert-comptable**, je veux voir mes échéances sociales à côté des fiscales, afin d'avoir un calendrier complet. *(FR-F31)*

**Critères d'acceptation**

- **Étant donné** une obligation sociale dérivée **quand** j'ouvre le calendrier **alors** elle y figure au même titre qu'une obligation fiscale.
- **Étant donné** une obligation sociale **quand** elle progresse **alors** elle suit le même cycle de vie et produit la même piste d'audit.

### STORY-235 — Rapprochement des charges sociales et des comptes de personnel

En tant qu'**expert-comptable**, je veux confronter ce que j'ai calculé à ce que la comptabilité enregistre, afin de détecter l'écart avant l'administration. *(FR-F32)*

**Critères d'acceptation**

- **Étant donné** des charges sociales calculées **quand** le rapprochement s'exécute **alors** elles sont confrontées aux comptes de personnel de la balance.
- **Étant donné** un écart supérieur à la tolérance déclarée au paquet **quand** il est détecté **alors** une anomalie est levée en nommant les deux valeurs.
