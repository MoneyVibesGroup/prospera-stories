---
title: "PRD — PI-SPI & encaissement (paiement-service)"
status: final
created: 2026-08-02
updated: 2026-08-02
project: prospera
service: paiement-service
position_sequence: "Bloc 0 (avancé — décision PO)"
mode: coaching
---

# PRD — PI-SPI & encaissement (`paiement-service`)

**Bloc 0 — avancé par décision PO** · Verticales : IMF · Distributeurs · Assurance · Money Vibes App
Décisions tracées dans `.memlog.md`

---

## 1. Contexte et problème

### 1.1 Trois objets, un seul mot

Le mot « paiement » recouvre trois choses différentes dans les documents Prospera. Ce PRD en couvre
deux et en écarte une — explicitement, parce que les confondre serait la première erreur :

| | Objet | Qui paie qui | Statut |
|---|---|---|---|
| **A** | **Encaissement du client final** — lien de paiement, réconciliation facture ↔ paiement | Le détaillant paie **le distributeur** ; l'emprunteur paie **l'IMF** | ✅ **dans ce PRD** |
| **B** | **Caisse & guichet** — espèces, fond de caisse, clôture journalière, écarts, rapprochement MoMo | L'emprunteur paie **au guichet** | ❌ **module Caisse #15** — déjà prototypé (`caisse-hub.ts` : `ESPECES · MOMO_MIXX · MOMO_FLOOZ · VIREMENT · CHEQUE`) |
| **C** | **Abonnement Prospera** | Le client paie **Money Vibes** | ✅ **dans ce PRD** |

A et C partagent la même mécanique — une demande de paiement, un fournisseur, un accusé, une
réconciliation. Seul le **bénéficiaire** change. B est un métier différent (manipulation d'espèces,
responsabilité du caissier, écart de caisse) et reste chez lui.

### 1.2 D'où vient le besoin

| Constat | Où |
|---|---|
| **PI-SPI est vendu** comme module commercial 11 « Encaissements & PI-SPI », et le lien de paiement figure au module 5 (application mobile terrain) | `prospera_modules_bundles_distributeur.md` |
| Le bundle **Finance & Recouvrement** est vendu autour de la promesse « rapprochement manuel → 0 » | idem §2 |
| `paiement-service` est `proposed`, **sans PRD** ; `STORY-016` à `019` n'ont **aucun fichier** — cinq stories qui n'existent qu'en titre | `sprint-status.yaml` |
| Cinq modules en dépendent : Caisse (#15), Facturation (#17), Finance (#21), Épargne (#22), Abonnements (#26) | séquence v2 |

### 1.3 Ce qui rend ce module tenable

**Prospera ne détient jamais les fonds.** L'argent va directement sur le compte du client — chez son
PSP, sa banque, ou son numéro mobile money enregistré à son nom. Prospera **déclenche, suit et
réconcilie** ; il n'encaisse pas.

Ce n'est pas une préférence d'architecture, c'est ce qui maintient le module hors du champ de
l'agrément : encaisser pour le compte d'un tiers en UEMOA suppose un statut d'établissement de
monnaie électronique — capital réglementaire, supervision BCEAO, obligations LCB/FT propres. Le
module tel que défini ici n'y est pas soumis.

> **Le seul chemin par lequel cet invariant peut se rompre** est un compte de collecte au nom de
> Money Vibes « juste pour démarrer les tests ». Il ressemble à un raccourci d'implémentation et
> constitue un changement de régime juridique. D'où NFR-1.

---

## 2. Vision produit

> `paiement-service` est **l'orchestrateur d'encaissement de Prospera** : il demande le paiement,
> constate ce qui a été payé — par lui ou en dehors de lui — et rend une créance dont le solde est
> vrai.

Trois propriétés :

1. **Il ne touche pas l'argent.** Il connaît le mouvement, jamais les fonds.
2. **Il constate autant qu'il déclenche.** Le paiement en espèces au commercial est un cas de premier
   rang, pas un rattrapage — sans quoi la balance créances ment.
3. **Les fournisseurs sont interchangeables et coexistent.** Plusieurs PSP actifs en même temps,
   routés par pays et par devise.

---

## 3. Le seul parcours qui compte — UJ-1

Ce module n'a qu'une surface publique, et l'adoption s'y joue entièrement.

> **Kossi** tient une boutique à Agoè. Il doit 400 000 F à son distributeur. Un mardi soir, il reçoit
> un message WhatsApp : *« Facture FA-2312, 400 000 F — payer »*. Il ouvre le lien sur un téléphone
> Android d'entrée de gamme, en 3G.
>
> La page s'ouvre. Elle dit qui il paie, pour quoi, **400 000 F + 8 000 F de frais = 408 000 F**.
> Kossi n'a pas 408 000 F ce soir — il a 150 000 F. Il choisit de payer une partie. La page lui dit
> alors ce que ça lui coûtera : **3 000 F de frais sur ce versement**, et que payer en plusieurs fois
> lui coûtera plus cher au total. Il accepte, paie 153 000 F par Mixx, et voit s'afficher
> **« payé — reste 250 000 F »**.
>
> On lui propose d'indiquer quand il complétera. Il dit vendredi. C'est enregistré.
>
> Le lendemain, son commercial passe. Kossi lui donne 100 000 F en espèces. Le commercial le saisit
> sur son téléphone : le solde de Kossi tombe à 150 000 F, **marqué comme déclaré, pas encore
> confirmé**. Le soir, le commercial remet ses espèces à la caisse ; le rapprochement valide
> l'encaissement de Kossi. **Vendredi, la promesse arrive à échéance et le système constate.**

**Ce que ce parcours impose** : les frais annoncés avant le choix (FR-P23b), le paiement partiel avec
solde restant (FR-P26), la promesse datée au sort observable (FR-P28/P29), la déclaration manuelle
validée par la remise (FR-P31→P33), et une page qui tient sur un téléphone modeste en réseau lent
(NFR-8). Aucune de ces exigences n'est décorative — chacune est un moment de ce parcours.

---

## 4. Glossaire

| Terme | Définition |
|---|---|
| **Créance projetée** | Ce que le service retient d'une créance née ailleurs : référence externe, montant d'origine, devise, échéance, libellé. **Le service n'émet pas la facture, mais il maintient le solde encaissé** — sans quoi il ne pourrait ni réconcilier ni relancer. Facturation (#17) reste propriétaire de la facture ; ce module est propriétaire de **ce qui a été payé dessus**. |
| **Demande de paiement** | Intention d'encaisser un montant auprès d'un payeur identifié, rattachée à une créance projetée. Objet central du module. |
| **Lien de paiement** | Surface publique d'une demande, communiquée au payeur (WhatsApp, SMS, e-mail, QR). |
| **Encaissement** | Constatation qu'un montant a été payé — **par le lien** ou **hors Prospera**. Terme unique : le PRD ne dit jamais « règlement ». |
| **Paiement hors Prospera** | Encaissement réalisé sans passer par le service (espèces au commercial, MoMo direct). Déclaré manuellement, puis validé. |
| **Promesse de paiement** | Engagement daté du payeur à compléter un solde restant. Alimente la relance. |
| **Bénéficiaire** | Le titulaire du compte qui reçoit les fonds. Toujours l'organisation cliente (cas A) ou Money Vibes (cas C). **Jamais un compte de transit.** |
| **Compte d'encaissement** | Coordonnées du bénéficiaire chez un fournisseur : compte marchand, compte bancaire, ou numéro mobile money enregistré à son nom. |
| **Fournisseur / PSP** | Prestataire qui achemine le paiement (FedaPay, agrégateur, banque, SPI). Interchangeable. |
| **Frais** | Commission prélevée par le fournisseur. **Supportée par le payeur** et affichée avant confirmation. |
| **Abonnement** | Contrat périodique d'une organisation avec Money Vibes, ouvrant droit à des modules. |
| **Période de grâce** | Délai dérogatoire accordé après impayé, avant suspension. Attribuée, jamais automatique. |

---

## 5. Périmètre

### 5.1 Dans le périmètre

- Raccordement du compte d'encaissement d'une organisation (par elle-même ou par l'administration)
- Fournisseurs de paiement interchangeables et simultanés, routés par pays et devise
- Demandes de paiement, liens, QR, relance du lien
- Encaissement par lien, **paiement partiel**, promesse de compléter
- **Paiement hors Prospera** : déclaration manuelle puis validation par la remise d'espèces
- Réconciliation créance ↔ encaissements, solde vrai
- Enregistrement d'une annulation constatée (sans initier de remboursement)
- Abonnements Prospera : cycle, échéance, impayé, suspension, période de grâce
- Octroi et révocation d'entitlements à l'activation et à la suspension
- Multi-pays et multi-devise d'Afrique de l'Ouest

### 5.2 Hors périmètre

| Hors périmètre | Où ça vit | Pourquoi |
|---|---|---|
| Caisse, guichet, fond de caisse, clôture, écarts | Caisse (#15) | Métier différent : manipulation d'espèces et responsabilité du caissier |
| Émission de la facture, proforma, e-facture, avoir | Facturation (#17) | Ce module encaisse une créance, il ne la crée pas |
| Décision de relance, escalade, recouvrement | Relance (#24) | Ce module **fournit** la promesse et le solde ; il ne décide pas |
| Envoi du lien au payeur | `notification-service` (#1) | Le lien est un message ; l'organe de parole est unique |
| Écritures comptables | `balance-service` / Comptabilité | Ce module publie l'événement, il n'écrit pas le journal |
| **Initiation de remboursement** | Chez le client et son PSP | Prospera ne détient pas les fonds : il ne peut pas les rendre |
| **Conversion de devise** | Nulle part | Convertir serait une activité de change, donc un agrément |
| Détention de fonds, compte de transit, séquestre | — | **Interdit par NFR-1** |

---

## 6. Fonctionnalités & exigences (FR)

### A — Compte d'encaissement

| # | Exigence |
|---|---|
| **FR-P01** | Une organisation déclare un ou plusieurs **comptes d'encaissement** : compte marchand chez un fournisseur, compte bancaire, ou **numéro mobile money enregistré à son nom**. |
| **FR-P02** | Le compte est saisi **par l'organisation elle-même ou par l'administration Prospera**. Les deux chemins produisent le même objet et sont tracés distinctement (qui a saisi, quand). |
| **FR-P03** | Un compte d'encaissement porte **obligatoirement** un titulaire, un pays et une devise. Un compte sans titulaire identifié est refusé — c'est le contrôle qui matérialise NFR-1. |
| **FR-P04** | Le service **vérifie** le compte avant activation par **appel de validation au fournisseur** — jamais par une transaction de montant symbolique, qui coûte de l'argent et suppose un débit sur un compte pas encore approuvé. Si le fournisseur n'offre pas de validation, le compte est marqué `non vérifiable` et l'organisation en est informée. Un compte non vérifié ne peut recevoir aucune demande de paiement. |
| **FR-P05** | Une organisation peut détenir plusieurs comptes (un par pays, par devise ou par fournisseur) et désigner celui qui sert par défaut à chaque couple pays × devise. |
| **FR-P06** | Les identifiants de compte sont **des secrets** : jamais restitués en lecture, jamais journalisés, jamais renvoyés par l'API — même patron que `notification-service`. |

### B — Fournisseurs de paiement

| # | Exigence |
|---|---|
| **FR-P07** | Les fournisseurs sont implémentés derrière un contrat unique `PaymentProvider` — même patron que `OcrProvider`, `LlmProvider`, `ChannelProvider`. |
| **FR-P08** | **Plusieurs fournisseurs sont actifs simultanément** — ce n'est pas un simple remplaçable. Le routage se fait par **pays × devise × méthode**, configurable par organisation. |
| **FR-P09** | Chaque fournisseur déclare ses **capacités** : pays, devises, méthodes (mobile money, carte, virement), montants minimum et maximum, paiement partiel, remboursement, délai de règlement. |
| **FR-P10** | Fournisseur du v1 : **FedaPay en environnement de développement**. Le passage en production, et l'ajout du SPI BCEAO ou de tout autre fournisseur, sont une **configuration** — pas une réécriture. |
| **FR-P11** | Aucun fournisseur n'est un prérequis de démarrage : le service démarre en mode dégradé et l'annonce dans son état de santé. |
| **FR-P12** | Un fournisseur indisponible n'échoue pas silencieusement : la demande reste ouverte et peut être **réacheminée** vers un autre fournisseur éligible. Le réacheminement est **explicite — jamais automatique** : il exige la **révocation prouvée** de la demande précédente chez le fournisseur d'origine. Un réacheminement automatique d'une demande déjà communiquée au payeur créerait un risque direct de double encaissement (NFR-3). |

### C — Demande de paiement & lien

| # | Exigence |
|---|---|
| **FR-P13** | Le service détient une **créance projetée** : référence externe, montant d'origine, devise, échéance, libellé — fournis par le module appelant à la première demande. Il n'émet pas la facture ; il **maintient le solde encaissé** de cette créance. |
| **FR-P13b** | Une **demande de paiement** se rattache à une créance projetée et porte : un montant, un payeur, un bénéficiaire, une durée de validité et **l'identité du module appelant**. Plusieurs demandes peuvent viser la même créance (relance, fractionnement). |
| **FR-P14** | Le **lien de paiement** est la surface publique de la demande. Il est consultable sans compte Prospera, sur mobile, et affiche : le bénéficiaire, le motif, le montant dû, **les frais**, et le total à payer. |
| **FR-P15** | Un lien porte une **durée de validité** — **défaut 30 jours**, paramétrable par organisation, plafond 90 jours. Expiré, il n'encaisse plus et le dit clairement au payeur, avec le moyen d'en demander un nouveau. |
| **FR-P16** | Le lien est disponible en **QR** — le commercial en tournée le présente sans réseau du payeur. |
| **FR-P17** | Le lien est **transmis par `notification-service`** (WhatsApp, SMS, e-mail). Ce module ne parle jamais directement au payeur. |
| **FR-P18** | Un lien peut être **révoqué** avant paiement par un rôle habilité. |

### D — Encaissement par lien

| # | Exigence |
|---|---|
| **FR-P19** | Le service reçoit les notifications du fournisseur (webhook) et fait progresser la demande. La **signature est vérifiée** ; une notification non signée ou mal signée est rejetée et tracée. |
| **FR-P20** | Le traitement des notifications est **idempotent** : un rejeu du fournisseur ne crée jamais un second encaissement. Invariant prouvé par test. |
| **FR-P21** | États d'une demande, transitions explicites : `créée → envoyée → partiellement payée → soldée`, plus `expirée`, `révoquée`, `échouée`. `soldée` est atteignable depuis `partiellement payée`. Aucun retour arrière. |
| **FR-P22** | Aucune demande ne progresse sur la seule foi de l'appelant : le passage à un état payé exige **la confirmation du fournisseur** ou une **déclaration validée** (groupe F). |
| **FR-P23** | La **politique de frais est décidée par l'organisation qui émet la créance**, pas par Prospera. Trois valeurs : `payeur` (défaut — le payeur règle montant dû + frais), `bénéficiaire` (le payeur règle le montant dû, le bénéficiaire reçoit net de frais), `payeur au 1ᵉʳ versement puis bénéficiaire` (le fractionnement ne pénalise pas le payeur). |
| **FR-P23b** | **Les frais s'appliquent à chaque encaissement, donc le fractionnement les multiplie.** Quelle que soit la politique retenue, le lien **annonce avant** que le payeur choisisse : frais du versement en cours, qui les supporte, frais déjà supportés sur cette créance, et surcoût prévisible s'il fractionne encore. Aucun montant n'est découvert après coup. |
| **FR-P23c** | La politique de frais est **figée à l'émission de la demande de paiement**, jamais relue à l'encaissement. Un changement de politique ne modifie aucune demande déjà communiquée à un payeur — même principe que le tarif enregistré avec l'encaissement (**FR-P24b**). |
| **FR-P24** | Le service ne connaît jamais les fonds : il enregistre **le mouvement constaté** (montant, devise, horodatage, référence fournisseur), pas un solde de compte. |
| **FR-P24b** | ⚡ **Le tarif et les frais appliqués sont enregistrés avec l'encaissement**, jamais recalculés à la lecture. Un changement de tarif de fournisseur ne modifie pas rétroactivement ce qu'un payeur a supporté ni ce qu'un bénéficiaire a reçu. *Ajouté à la revue croisée : le patron existait dans quatre PRD et manquait précisément là où il compte le plus.* |

### E — Paiement partiel & promesse

| # | Exigence |
|---|---|
| **FR-P25** | Le **paiement partiel est autorisé**. Le payeur règle ce qu'il peut ; le lien enregistre le montant effectivement payé. |
| **FR-P26** | Une demande partiellement payée conserve un **solde restant** et reste payable — le même lien sert aux règlements successifs jusqu'au solde. |
| **FR-P27** | L'historique des encaissements successifs sur une même créance est **conservé et restituable** : qui a payé combien, quand, par quel moyen, avec quels frais. |
| **FR-P28** | Une **promesse de paiement** peut être enregistrée sur un solde restant : montant promis, **date promise**, auteur de la saisie, canal de l'engagement. |
| **FR-P29** | Une promesse a un **sort observable** : tenue, non tenue, partiellement tenue — constaté à sa date, sans intervention. C'est ce qui la rend exploitable par la relance. |
| **FR-P30** | Les promesses et les soldes sont **publiés** (événement sortant) à destination du module Relance (#24) et de `notification-service`. Ce module ne décide d'aucune relance. |

### F — Paiement hors Prospera

En distribution ouest-africaine, l'encaissement en espèces sur tournée n'est pas le cas marginal.
Un module qui ne le traite pas produit une balance créances fausse.

| # | Exigence |
|---|---|
| **FR-P31** | Un encaissement réalisé hors du service peut être **déclaré manuellement** : montant, devise, moyen (espèces, MoMo direct, virement, chèque), date, encaisseur, créance rattachée. |
| **FR-P32** | Une déclaration crée un encaissement à l'état **`déclaré`** — provisoire. Il diminue le solde affiché mais est **distingué visuellement et dans les données** d'un encaissement confirmé. |
| **FR-P33** | Un encaissement déclaré passe à **`validé`** par **rapprochement avec la remise d'espèces** du jour, ou par confirmation d'un rôle habilité. Le patron est celui du rapprochement bancaire déjà livré (`balance-service`, STORY-089/090) — réutilisé, non réinventé. |
| **FR-P34** | Un encaissement déclaré non validé au-delà d'un délai — **défaut 48 h ouvrées**, paramétrable par organisation, plafond 7 jours — **remonte comme écart**, avec son encaisseur. |
| **FR-P35** | Une déclaration est **traçable et attribuable** : l'auteur de la saisie et l'encaisseur sont deux champs distincts — ils ne sont pas toujours la même personne. |
| **FR-P36** | La déclaration d'un encaissement est réservée à un **rôle habilité**. |

### G — Réconciliation & restitution

| # | Exigence |
|---|---|
| **FR-P37** | Pour toute créance, le service restitue : montant d'origine, encaissements confirmés, encaissements déclarés non validés, solde restant, promesses en cours. **Le solde distingue toujours le certain du déclaré.** |
| **FR-P38** | Import du **relevé du fournisseur** et rapprochement automatique, selon une cascade de clés explicite : **(1) référence de transaction du fournisseur** — clé primaire, rapprochement certain ; **(2) référence de demande portée au libellé** — certain si présente ; **(3) triplet montant + devise + date à ±1 jour** — rapprochement **proposé**, jamais appliqué sans confirmation humaine. Ce qui ne tombe dans aucune des trois est listé comme écart, avec son motif. |
| **FR-P39** | Un encaissement reçu **sans créance identifiable** (paiement spontané, référence erronée) n'est pas perdu : il est mis en attente d'affectation et rattachable manuellement. |
| **FR-P40** | Les encaissements sont **publiés** (événement sortant) pour la Facturation (#17), la Finance (#21) et la comptabilité. Ce module ne passe aucune écriture. |
| **FR-P41** | Consultation et export des encaissements, filtrables par période, fournisseur, moyen, état, encaisseur et module appelant. |

### H — Abonnement Prospera

| # | Exigence |
|---|---|
| **FR-P42** | Un **abonnement** lie une organisation à un ensemble de modules, avec une périodicité, un montant, une devise et une échéance. |
| **FR-P43** | Le bénéficiaire d'un abonnement est **Money Vibes**, jamais l'organisation. C'est la seule différence de configuration avec le cas A. |
| **FR-P44** | À l'encaissement d'une échéance, le service **octroie les entitlements** correspondants auprès du `platform-catalog-service` — reprend `STORY-039`, dépend de la décision **C8** (authentification machine-à-machine). |
| **FR-P45** | **Impayé = suspension.** C'est la règle par défaut, pas un délai implicite. La suspension révoque les entitlements. |
| **FR-P46** | Une **période de grâce** peut être attribuée, selon le type de client. Elle est **explicite, datée, motivée, attribuée par un rôle habilité et tracée** — jamais un défaut de configuration. Elle porte **obligatoirement une durée maximale** (défaut 30 jours, plafond 90) : une grâce sans terme est une suspension qui n'arrive jamais. |
| **FR-P47** | Une suspension pour impayé est **réversible** : l'encaissement du retard rétablit les entitlements sans intervention manuelle. |
| **FR-P48** | L'organisation est **prévenue avant** l'échéance et avant la suspension, via `notification-service`. Une coupure sans préavis est un défaut, pas une politique. |

### I — Annulation & régularisation

| # | Exigence |
|---|---|
| **FR-P49** | Le service **n'initie aucun remboursement** : ne détenant pas les fonds, il ne peut pas les rendre. Le remboursement se règle entre le client et son fournisseur. |
| **FR-P50** | Le service **enregistre une annulation constatée** : encaissement concerné, motif, date, pièce justificative éventuelle. La créance retrouve son solde. |
| **FR-P51** | L'enregistrement d'une annulation est réservé à un **rôle habilité, distinct de celui qui déclare un encaissement** — celui qui constate l'entrée ne doit pas pouvoir l'effacer seul. |
| **FR-P52** | Une annulation est **append-only** : elle ne supprime pas l'encaissement d'origine, elle le contre-passe. L'historique reste lisible. |
| **FR-P53** | L'annulation est **publiée** pour la Facturation (avoir) et la comptabilité. |

### J — Pays, devises & montants

| # | Exigence |
|---|---|
| **FR-P54** | Le service couvre les **pays d'Afrique de l'Ouest avec leur devise propre** — pas seulement la zone XOF. Pays et devises sont des **données de référence versionnées**, pas du code : la carte politique et monétaire de la région bouge. |
| **FR-P55** | Les montants sont stockés en **entier d'unité mineure**, avec le nombre de décimales de la devise (ISO 4217). ⚠️ **Le XOF et le GNF n'ont pas de décimale** ; le NGN, le GHS, le GMD, le LRD, le SLE et le CVE en ont deux. Aucun montant n'est manipulé en flottant. |
| **FR-P56** | **Aucune conversion de devise.** Une créance, sa demande de paiement et son encaissement sont dans **une seule et même devise**. Convertir serait une activité de change — hors périmètre et hors agrément. |
| **FR-P57** | Une organisation opérant dans plusieurs pays détient un compte d'encaissement par pays et devise (FR-P05) ; ses créances ne se compensent pas entre devises. |
| **FR-P58** | Les montants minimum et maximum, les frais et les méthodes disponibles sont **propres au couple fournisseur × pays × devise** et lus des capacités déclarées (FR-P09), jamais codés. |

### K — Administration & sécurité

| # | Exigence |
|---|---|
| **FR-P59** | Les droits sont portés par le **catalogue de permissions plateforme** (STORY-140), distincts et attribuables séparément : émettre une demande, révoquer un lien, déclarer un encaissement, valider un encaissement, enregistrer une annulation, attribuer une grâce, administrer les comptes d'encaissement. |
| **FR-P60** | **Séparation des pouvoirs** : déclarer un encaissement, le valider, et enregistrer son annulation sont trois droits qui ne doivent pas se cumuler par défaut sur un même rôle. |
| **FR-P61** | Toute opération d'argent est journalisée en **piste d'audit append-only** : qui, quoi, quand, sur quelle créance, depuis quelle origine. |
| **FR-P62** | Cloisonnement strict par organisation : comptes, demandes, encaissements, relevés, abonnements. Aucune requête ne traverse cette frontière. |
| **FR-P63** | Console d'exploitation sur `admin-panel`, bornée : suivre les demandes, consulter les notifications de fournisseur rejetées, réacheminer une demande, consulter les écarts de rapprochement. |
| **FR-P64** | Le service expose un **fournisseur de candidats** pour le moteur de règles de l'assistant (`FR-IA03b`) : demandes de paiement expirées sans relance, **promesses de paiement échues et non tenues**, encaissements déclarés non validés au-delà du délai, créances sans encaissement depuis N jours, abonnements arrivant à échéance. *Ajouté à la revue croisée.* ⚠️ Ces candidats alimentent le module **Relance (#24)** ; ce module ne relance pas. |

---

## 7. Exigences non fonctionnelles (NFR)

### NFR-1 — Prospera ne détient jamais les fonds *(structurante — régime juridique)*

Aucun compte contrôlé par Money Vibes ne peut être bénéficiaire d'un encaissement du cas A, à aucun
moment, y compris transitoirement et y compris en environnement de test.

**Conséquences opposables :**

- **NFR-1a** — Tout compte d'encaissement porte un titulaire identifié ; un compte sans titulaire est
  refusé à l'enregistrement (FR-P03).
- **NFR-1b** — Le modèle de données ne comporte **aucune notion de solde détenu, de portefeuille, de
  séquestre ou de reversement**. Leur apparition serait le signal d'un changement de régime.
- **NFR-1c** — Le seul cas où Money Vibes est bénéficiaire est l'**abonnement** (cas C), sur son
  propre compte, pour son propre compte.

> **Motif.** Encaisser pour le compte d'un tiers en UEMOA suppose un statut d'établissement de monnaie
> électronique : capital réglementaire, supervision BCEAO, obligations LCB/FT propres. Le raccourci
> qui rompt l'invariant — un compte de collecte « juste pour les tests » — ne ressemble pas à une
> décision juridique, et c'en est une.

### NFR-2 — Exactitude monétaire

Aucun montant n'est manipulé en virgule flottante. Stockage en entier d'unité mineure, avec le nombre
de décimales de la devise. **Le XOF n'a pas de décimale** : un traitement à deux décimales par défaut
produit des montants faux d'un facteur 100 sur le marché principal.

### NFR-3 — Idempotence et non-duplication

Toute notification de fournisseur, toute demande d'encaissement et tout rejeu produit **au plus un**
encaissement. C'est l'invariant le plus coûteux à violer : un double encaissement se voit chez le
payeur, pas dans les journaux.

**Condition observable :** rejouer N fois la même notification de fournisseur — dans le désordre, en
parallèle, et après redémarrage du service — produit exactement **un** encaissement et **un seul**
mouvement de solde. Le test fait partie de la définition de terminé, pas de la campagne de recette.

### NFR-4 — Traçabilité opposable

Toute opération d'argent est journalisée en append-only, attribuée à une personne ou à un module, et
non modifiable. Une correction est une écriture de plus, jamais une réécriture.

### NFR-5 — Le sandbox est un chemin complet

Le service est livrable et démontrable de bout en bout sur l'API de développement du fournisseur. Le
passage en production est un changement de configuration, sans code conditionnel `si production`.

### NFR-6 — Confidentialité des secrets

Les identifiants de fournisseur et de compte ne sont ni restitués en lecture, ni journalisés, ni
inclus dans une réponse d'API ou une trace d'erreur.

### NFR-7 — Délais *(cibles proposées, à confirmer après mesure réelle)*

Ces seuils ne dérivent d'aucun usage observé — le service n'existe pas encore. Ils sont posés comme
défauts raisonnables et **doivent être reconfirmés après 30 jours d'exploitation**, comme SM-2 de
`notification-service`.

| Opération | Cible proposée |
|---|---|
| Création d'une demande et disponibilité du lien | P95 < 2 s |
| Prise en compte d'une notification de fournisseur | P95 < 5 s |
| Restitution du solde d'une créance | P95 < 1 s |

### NFR-8 — Le lien de paiement fonctionne sur un téléphone modeste

Le payeur n'est pas un utilisateur Prospera et n'a pas choisi son appareil. La page de paiement doit
s'ouvrir sur un navigateur mobile d'entrée de gamme, sur réseau lent, et rester lisible en cas
d'échec réseau au milieu du paiement — le payeur doit toujours savoir s'il a payé ou non.

---

## 8. Métriques de succès

| # | Métrique | Cible | Ce qu'elle valide |
|---|---|---|---|
| **SM-1** | Comptes bénéficiaires contrôlés par Money Vibes sur des encaissements du cas A | **0** | NFR-1 — le régime juridique |
| **IND-1** *(indicateur, sans cible)* | Part des encaissements **confirmés par fournisseur** vs **déclarés manuellement** | à observer | Le taux d'adoption réel du lien face aux espèces. Sans valeur de référence, une cible serait inventée |
| **SM-3** | Écart entre le solde restitué et le relevé du fournisseur | **0 après rapprochement** | La promesse « rapprochement manuel → 0 » du bundle Finance |
| **SM-4** | Encaissements déclarés jamais validés au-delà du délai | tendance **décroissante** | La boucle de validation par la remise fonctionne |
| **SM-5** | Doubles encaissements | **0** | NFR-3 |
| **SM-6** | Coût d'ajout d'un fournisseur | `PaymentProvider` + configuration, **cœur non touché** | FR-P07/P08 |

### Contre-métriques

| # | Contre-métrique | Seuil d'alerte |
|---|---|---|
| **CM-1** | Suspensions d'abonnement pour impayé | Hausse — une coupure est une perte de client, pas un succès de recouvrement |
| **CM-2** | Liens de paiement émis mais jamais ouverts | Hausse — le canal ne convient pas au payeur, ou les frais le dissuadent |

---

## 9. Découpage en incréments

| Incrément | Pts est. | Titre | Critère de sortie |
|:--:|:--:|---|---|
| **1** | ~34 | **Encaisser par lien** — comptes d'encaissement, `PaymentProvider` + FedaPay sandbox, demande, lien, QR, webhook signé et idempotent, partiel | Un lien émis en sandbox est payé partiellement puis soldé, sans double encaissement |
| **2** | ~34 | **Dire la vérité sur la créance** — paiement hors Prospera (déclaré → validé), promesses, réconciliation, relevé, annulation, audit | Le solde d'une créance est juste alors que la moitié a été payée en espèces |
| **3** | ~26 | **Abonnements & multi-pays** — abonnement, échéance, impayé, grâce, entitlements (C8), pays/devises, console, e2e | Une échéance encaissée octroie les entitlements ; un impayé suspend et un règlement rétablit |

**Pourquoi cet ordre.** L'incrément 1 ne dépend d'aucun accès de production. L'incrément 2 est celui
qui **tient la promesse commerciale** du bundle Finance & Recouvrement. L'incrément 3 dépend de C8,
non tranché — il est donc le seul décalable.

---

## 10. Cadre réglementaire

| Sujet | Position |
|---|---|
| **Détention de fonds** | Aucune. Le module est orchestrateur (NFR-1). Pas d'agrément d'établissement de monnaie électronique requis à ce titre **[à faire confirmer juridiquement]** |
| **Agrément des fournisseurs** | Porté par le PSP, pays par pays. Prospera ne s'y substitue pas et ne le revend pas |
| **Change** | Hors périmètre (FR-P56). Convertir supposerait un agrément distinct |
| **LCB/FT** | Portée par le PSP sur le flux monétaire. Prospera conserve la traçabilité (FR-P61) et alimentera le module Conformité (#27) |
| **Données personnelles du payeur** | Le payeur n'a pas de compte Prospera : même régime que le carnet de contacts de `notification-service` — voir son §9 |

---

## 11. Dépendances

### 11.1 Disponible

| Dépendance | État |
|---|---|
| Bus Kafka + *transactional outbox* | ✅ livré |
| Identité, jetons RS256/JWKS | ✅ livré |
| Catalogue de permissions plateforme | ✅ livré S18 (STORY-140) |
| `platform-catalog-service` — entitlements | ✅ livré (EPIC-007) |
| Patron de rapprochement (relevé ↔ mouvements) | ✅ livré `balance-service` STORY-089/090 — **à réutiliser** |

### 11.2 Manquant

| Dépendance | Impact si absent |
|---|---|
| **Décision C8** (authentification machine-à-machine vers le catalogue) | FR-P44 inapplicable → **bloque l'incrément 3** |
| **`notification-service`** (envoi du lien) | Le lien existe mais n'est pas distribué automatiquement. L'incrément 1 reste démontrable |
| **Facturation (#17)** | Ce module encaisse une créance dont il n'est pas l'émetteur. Au v1, la créance est une **référence externe fournie par l'appelant** *[ASSUMPTION A2]* |
| **Accès SPI de production (PS-1)** | Aucun — le v1 est en sandbox par conception (NFR-5) |
| **Module Terrain — remise d'espèces** | FR-P33 se rabat sur la validation par un rôle habilité *[ASSUMPTION A3]* |

---

## 12. Risques

| # | Risque | Traitement |
|---|---|---|
| **R1** | Un compte de collecte au nom de Money Vibes est ouvert « pour les tests » et jamais défait → changement de régime juridique | **NFR-1 + SM-1 à 0.** Le contrôle est dans le modèle de données, pas dans la vigilance |
| **R2** | Le XOF traité à deux décimales → montants faux d'un facteur 100 | **NFR-2.** Unité mineure par devise, jamais de flottant |
| **R3** | Les frais à la charge du payeur dissuadent l'usage du lien, et tout le monde reste aux espèces | **CM-2** surveille. Le module reste juste grâce au groupe F |
| **R4** | C8 non tranché à l'ouverture de l'incrément 3 | Incrément 3 décalable par conception |
| **R5** | Périmètre géographique élargi à toute l'Afrique de l'Ouest sans client hors Togo identifié | Pays et devises en **données de référence** (FR-P54) : le coût est dans la conception, pas dans chaque ajout |

---

## 13. Questions ouvertes

| # | Question | Statut |
|---|---|---|
| Q1 | Cadrage A / B / C | ✅ **tranchée** — A + C ; B reste au module Caisse #15 |
| Q2 | Où va l'argent | ✅ **tranchée** — directement chez le client. Invariant NFR-1 |
| Q3 | Accès SPI | ✅ **tranchée** — API de développement au v1 (NFR-5) |
| Q4 | Fournisseurs | ✅ **tranchée** — FedaPay pour tester, multi-fournisseur par conception (FR-P08) |
| Q5 | Raccordement du compte | ✅ **tranchée** — par le client ou par l'administration ; numéro mobile money au nom du client accepté |
| Q6 | Frais | ✅ **tranchée** — à la charge du payeur, affichés sur le lien (FR-P23) |
| Q7 | Pays et devises | ✅ **tranchée** — toute l'Afrique de l'Ouest, en données de référence (FR-P54) |
| Q8 | Annulation | ✅ **tranchée** — enregistrée, jamais initiée ; rôle distinct (FR-P49→P53) |
| **Q9** | **C8** — comment `paiement-service` s'authentifie auprès du `platform-catalog-service` | ⛔ **ouverte, bloquante pour l'incrément 3.** Différée depuis STORY-034 |
| Q10 | Statut de la créance | ✅ **tranchée** — le service détient une **créance projetée** dont il maintient le solde encaissé (FR-P13). Facturation reste propriétaire de la facture |
| **Q11** | Grille des périodes de grâce par type de client | ouverte — décision commerciale. Bornée en attendant : 30 j par défaut, 90 j de plafond (FR-P46) |
| Q12 | Le surcoût du fractionnement | ✅ **tranchée** — **c'est l'émetteur de la facture qui décide** : la politique de frais est un paramètre de l'organisation créancière, figé à l'émission de la demande (FR-P23 → P23c). Prospera n'impose rien, il rend transparent |
| **Q13** | Qui fait autorité sur le montant d'origine en cas de divergence entre la créance projetée et la facture ? | ouverte — à trancher au PRD Facturation (#17) |

---

## Index des assumptions

| # | Assumption | Où | Confirmation attendue |
|---|---|---|---|
| **A1** | Les fournisseurs visés restituent des notifications signées et rejouables, et acceptent le paiement partiel sur une même référence | FR-P19, FR-P25 | Intégration FedaPay sandbox |
| **A2** | Le module appelant fournit un montant d'origine fiable pour la créance projetée ; Facturation (#17) n'existe pas encore pour en faire foi | FR-P13, §11.2, Q13 | PRD Facturation |
| **A3** | La remise d'espèces du soir n'existe pas encore comme objet ; FR-P33 se rabat sur une validation par rôle habilité | FR-P33 | Module Terrain / Caisse |
| **A4** | Les décimales par devise suivent l'ISO 4217 — XOF et GNF à zéro décimale, NGN/GHS/GMD/LRD/SLE/CVE à deux | FR-P55 | Vérification à l'implémentation |
| **A5** | Aucun client hors Togo n'est identifié à ce jour ; le multi-pays est une exigence d'anticipation | FR-P54, R5 | 1er client hors Togo |
