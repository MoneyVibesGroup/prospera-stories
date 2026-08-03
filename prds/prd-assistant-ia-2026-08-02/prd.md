---
title: "PRD — Assistant IA socle (assistant-service)"
status: final
created: 2026-08-02
updated: 2026-08-02
project: prospera
service: assistant-service
epic: EPIC-026
position_sequence: 6
mode: coaching
---

# PRD — Assistant IA socle (`assistant-service`)

**Position 6 de la séquence** · Verticales : **les 5** · Dépend du Bloc 0
Fondé sur `architecture-assistant-ia-2026-07-20.md` · Décisions tracées dans `.memlog.md`

---

## 1. Contexte et problème

### 1.1 Trois documents, trois définitions de « l'IA Prospera »

| Source | Ce qu'elle décrit |
|---|---|
| **Note d'architecture** (2026-07-20) | Un LLM + un RAG légal. 6 surfaces, toutes comptables/fiscales. **« Rien n'est appliqué sans validation humaine. »** |
| **Offre commerciale** (catalogues IMF et Distributeur) | **~100 « IA » nommées et vendues** : scoring client 0-100, probabilité de défaut, détection de churn, prévision de demande, optimisation de tournées, prévision PAR, détection de fraude caisse, coaching commercial |
| **Prototype** (`automation-types.ts`) | Un moteur de règles à **trois modes** — `AUTO` · `VALIDATION` · `SUGGESTION` — avec garde-fous, quotas et cibles scorées |

Ce ne sont pas trois formulations d'une même chose. Ce sont trois produits, et l'un d'eux contredit
frontalement les deux autres : la note interdit l'action autonome, l'offre et le prototype la vendent.

### 1.2 Ce que ce PRD tranche

| Question | Réponse |
|---|---|
| L'IA peut-elle agir seule ? | **Oui, sous condition stricte** — voir §2, la doctrine |
| Ce PRD couvre-t-il les ~100 IA vendues ? | **Non.** Il couvre le **socle de langage** et le **moteur de règles**. Le scoring et la prévision sont un autre métier (§5.3) |
| Le Copilot conversationnel ? | **Hors périmètre** — choix assumé, voir §5.3 et R3 |

### 1.3 Pourquoi maintenant

Le conseil fiscal (`EPIC-024`, FR-A22→A24) est **déjà vendu et déjà cadré**, et il ne peut pas
s'écrire sans ce socle : il suppose une proposition justifiée, ancrée sur un article du CGI, validée
par un humain. Le corpus est **déjà livré** (`corpus-complet-cgi-lpf-togo.json`, 1 185 articles).
Le socle est le seul maillon manquant.

---

## 2. La doctrine — ce qui remplace « l'IA propose, l'humain valide »

> **Le curseur n'est pas « IA ou humain ». Il est : l'acte est-il réversible et sans engagement ?**

| | L'IA ne peut **jamais** | L'IA **peut**, seule |
|---|---|---|
| **Critère** | L'acte produit un **chiffre officiel** ou un **engagement** — *sauf mandat humain préalable, voir ci-dessous* | L'acte est **réversible** et **n'engage rien** |
| **Exemples** | Un montant de liasse · un IS · un plafond de crédit · une décision de prêt · une écriture comptable · une validation de balance | Un rappel d'échéance · un accusé de réception · une relance préventive de réapprovisionnement |
| **Régime** | L'IA **propose**, un humain tranche, le **moteur déterministe recalcule** | L'IA **exécute**, sous garde-fous, quota et journal — et l'action reste **annulable et visible** |

**Ce que cette formulation change.** La note d'architecture interdisait toute action autonome, ce qui
rendait invendable le module Automatisations. Le prototype autorisait un mode `AUTO` sans dire où il
s'arrête. La ligne ci-dessus dit **où exactement** : elle ne dépend ni de la confiance dans le modèle,
ni du niveau de l'utilisateur, mais de la **nature de l'acte** — critère observable, opposable, et
qui ne se dégrade pas quand le modèle s'améliore.

### La nuance du mandat *(ajoutée 2026-08-02, atelier Stock)*

Un cas réel a obligé à préciser la ligne : le prototype prévoit une **commande fournisseur automatique
sous plafond** (`AUTO_SI_SOUS_PLAFOND`, 3 M FCFA). Or une commande fournisseur **engage de l'argent** —
donc, en première lecture, elle ne pourrait jamais être automatique.

**La résolution n'est pas d'assouplir le critère, mais de nommer ce qui se passe vraiment :** un humain
a délivré d'avance une **délégation de signature** bornée. L'assistant ne décide rien ; il **exécute
un mandat**. Trois conditions rendent cette lecture tenable — le mandat est **daté**, **révocable**,
et **délivré par quelqu'un qui détient lui-même l'autorité** (FR-IA36b → FR-IA36d).

Sans ces trois conditions, « sous plafond » redevient de l'autonomie déguisée.

L'intuition était déjà écrite dans le prototype :

> *« AUTO — part sans intervention humaine. Réservé aux actions réversibles et sans risque
> relationnel. VALIDATION — dès qu'il y a de l'argent, une remise, ou la réputation de l'entreprise
> en jeu. »*

---

## 3. Vision produit

> `assistant-service` est **la capacité de jugement assisté de Prospera** : il propose ce qu'il ne
> peut pas décider, il exécute ce qui ne l'engage pas, et il justifie tout ce qu'il avance.

Trois propriétés :

1. **Un seul contrat de sortie.** Que la suggestion vienne d'un modèle de langage ou d'une règle
   métier, elle prend la forme d'une **Proposition** — même cycle de vie, même audit, mêmes
   garde-fous. C'est ce qui rend le socle commun aux deux moteurs plutôt que juxtaposé.
2. **Rien n'est affirmé sans source.** Toute affirmation à portée légale cite son article, ou elle
   est marquée *non sourcée* et devient inapplicable.
3. **Les modèles sont interchangeables et hébergés chez Money Vibes.** Les données des clients ne
   quittent pas l'infrastructure.

---

## 4. Glossaire

| Terme | Définition |
|---|---|
| **Proposition** | Sortie persistée de l'assistant, jamais un effet de bord direct. Porte son contenu, ses justifications, sa confiance, son modèle et son cycle `PROPOSED → ACCEPTED / REJECTED / EXPIRED`. |
| **Surface** | Domaine où l'assistant intervient (mapping de comptes, conseil fiscal, anomalies…). Une surface consomme des Propositions ; elle ne les applique jamais elle-même sans son flux déterministe. |
| **Justification** | Ancrage d'une affirmation : source (`CGI`, `LPF`, `AUDCIF`, `RÈGLE_COMPTABLE`, `DONNÉE`), référence, extrait. |
| **Règle** | Automatisation déclarée : un déclencheur, une action, un canal, un **mode**, des garde-fous, un quota. |
| **Mode d'exécution** | `AUTO` (l'IA agit) · `VALIDATION` (l'IA prépare, l'humain clique) · `SUGGESTION` (l'IA signale, l'humain fait). |
| **Cible** | Occurrence concrète produite par l'évaluation d'une règle : un destinataire, un message prêt, une valeur, un score. |
| **Garde-fou** | Ce qu'une règle refuse de faire. Bloque une cible **visiblement**, jamais en silence. |
| **Corpus** | Base documentaire versionnée par pays et par année sur laquelle s'ancrent les affirmations légales (CGI, LPF, textes comptables). Donnée, jamais contenu en dur. |
| **Type d'action** | Entrée du catalogue déclarant ce qu'une action fait et ce qu'elle coûte à défaire : **réversible**, **engageante**, moyen d'annulation, service exécutant. Source unique du contrôle de mode. |
| **Moteur déterministe** | `bilan-service`, moteur fiscal, table de passage : source de vérité des chiffres. L'IA ne s'y substitue jamais. |

---

## 5. Périmètre

### 5.1 Deux moteurs, un contrat

| Moteur | Ce qu'il produit | Exemple |
|---|---|---|
| **Langage** (LLM + RAG) | Une Proposition argumentée et sourcée | « Ce compte 6132 correspond au poste TC — Art. 8 AUDCIF » |
| **Règles** | Une Proposition ou une action, selon le mode | « 14 factures échues depuis 1 jour → rappel WhatsApp, mode AUTO » |

Les deux passent par le **contrat Proposition**. C'est la thèse du document : sans lui, on aurait deux
services parallèles avec deux audits, deux régimes de validation et deux façons de se tromper.

### 5.2 Dans le périmètre

- Service `assistant-service` (relying party, base propre, démarrage dégradé)
- `LlmProvider` interchangeable, modèle auto-hébergé
- Contrat **Proposition** : persistance, cycle de vie, audit
- **RAG** sur le corpus légal versionné + règle de citation obligatoire
- **Surface pilote : mapping de comptes** (la moins risquée — alimente un flux de validation existant)
- **Moteur de règles** : déclencheur, action, mode, garde-fous, quota
- **Évaluation** des règles et production de cibles avec message prêt
- **Les trois modes d'exécution** et leurs garanties respectives
- **File d'arbitrage** et journal des exécutions
- Audit intégral : prompt, réponse, citations, modèle, version

### 5.3 Hors périmètre — et pourquoi

| Hors périmètre | Motif |
|---|---|
| **Scoring et prévision** (churn, probabilité de défaut, prévision de demande, PAR, optimisation de tournées) | **Module dédié, plus tard** (décision utilisateur 2026-08-02). **Autre métier** : un modèle de langage ne calcule pas une probabilité de défaut. Ces capacités demandent des modèles statistiques et de l'**historique** que les premiers clients n'ont pas *[voir Q1]* |
| **Copilot conversationnel** (Q&A en langage naturel par rôle) | **Module dédié, plus tard** (décision utilisateur 2026-08-02). Il est vendu dans **tous** les dashboards des deux catalogues et déjà prototypé sur 1 190 lignes. Le contrat Proposition et le `LlmProvider` livrés ici lui serviront de socle → **R3** |
| **OCR par IA** | Reste `document-service` avec Tesseract. Un LLM texte ne fait pas d'OCR ; il faudrait un modèle vision, hors périmètre |
| **Exécution des actions** (envoyer le message, écrire l'écriture) | L'assistant **décide qu'il faut agir** ; `notification-service` envoie, les moteurs déterministes écrivent |
| **Calcul de tout chiffre officiel** | **Interdit par NFR-1** |

---

## 6. Fonctionnalités & exigences (FR)

### A — Socle de service

| # | Exigence |
|---|---|
| **FR-IA01** | `assistant-service` est une **relying party** : jetons RS256/JWKS validés localement, isolation par organisation, base propre. Mêmes invariants que les autres services. |
| **FR-IA02** | **Démarrage dégradé** : si le fournisseur de modèle est indisponible, le service démarre et l'annonce (`llm: down`). Le moteur de règles, lui, continue de fonctionner — il ne dépend d'aucun modèle. |
| **FR-IA03** | ⚡ Le service **ne détient aucune copie de donnée métier** — ni read-model, ni abonnement au bus pour en constituer un. Il obtient les données de deux façons seulement : **le contexte fourni par l'appelant** (usage interactif), ou **une demande au module détenteur au moment de l'évaluation** (usage automatique). *Décision tranchée 2026-08-02.* |
| **FR-IA03b** | Tout module dont les données peuvent déclencher une règle expose un **fournisseur de candidats** : un contrat par lequel l'assistant demande « quelles entités remplissent cette condition maintenant ? » et reçoit la liste. Le module reste **seul détenteur** et seul juge de ses données. |
| **FR-IA03c** | Si le module détenteur est **indisponible** au moment de l'évaluation, la règle **ne s'exécute pas** — et cette non-exécution est **inscrite au journal et visible**, jamais silencieuse. Une règle qui n'a pas tourné et que personne ne voit est pire qu'une règle désactivée. |
| **FR-IA04** | Aucun nouveau bus : pas de topic Kafka créé. Les traitements différés utilisent une file interne. |

### B — Fournisseur de modèle

| # | Exigence |
|---|---|
| **FR-IA05** | Le service ne dépend **jamais d'un modèle concret**. Un contrat `LlmProvider` expose un échange conversationnel sur une API standard du marché. |
| **FR-IA06** | Environnement de développement : petit modèle local en conteneur. Il sert à **valider la mécanique** — appel, RAG, contrat de Proposition — **pas la qualité** : un petit modèle hallucine les citations légales, et le PRD l'assume. |
| **FR-IA07** | Production : **modèle auto-hébergé sur l'infrastructure Money Vibes**. Le changement de modèle est une **configuration** : URL et nom du modèle, zéro code. |
| **FR-IA08** | Chaque Proposition enregistre **le modèle et la version de gabarit** qui l'ont produite. Sans cette trace, aucune régression de qualité n'est diagnosticable. |
| **FR-IA09** | Le recours à une **API externe** est possible mais exige : accord de traitement interdisant l'entraînement sur les données, **minimisation** du contexte envoyé, **activation explicite par organisation**, et audit de chaque envoi. Jamais un défaut. |

### C — Contrat Proposition

| # | Exigence |
|---|---|
| **FR-IA10** | Toute sortie de l'assistant est une **Proposition persistée** : organisation, surface, référence de contexte, contenu, justifications, indice de confiance, statut, modèle, horodatage. Jamais un effet de bord direct. |
| **FR-IA11** | Cycle explicite : `PROPOSED → ACCEPTED` ou `REJECTED`, plus `EXPIRED`. La personne qui tranche est enregistrée. |
| **FR-IA12** | Une Proposition acceptée est **transmise à la surface consommatrice**, qui l'applique **par son propre flux déterministe**. L'assistant n'écrit jamais dans les données d'un autre service. |
| **FR-IA12b** | ⚡ **L'écart entre l'impact annoncé et l'impact recalculé est restitué et visible.** Quand une Proposition annonce un effet (« −1,2 M d'IS ») et que le moteur déterministe en calcule un autre, l'utilisateur qui a tranché sur le premier chiffre doit voir le second **et l'écart**. C'est le point précis où NFR-1 se prouve : sans cette restitution, « le déterministe fait foi » reste une affirmation. |
| **FR-IA12c** | Un écart significatif et **répété** sur une surface est remonté comme **défaut de qualité de cette surface**, avec son taux — pas comme un incident isolé. |
| **FR-IA13** | Une Proposition porte un **indice de confiance exposé**. Il informe l'humain ; il ne déclenche jamais d'application automatique — un seuil de confiance ne remplace pas un jugement. |
| **FR-IA14** | Une Proposition **expire**. Une suggestion fondée sur une balance de mars n'a plus de sens en juillet ; la laisser applicable serait un piège. |
| **FR-IA15** | Les Propositions sont **immuables** : rejeter puis re-proposer crée une nouvelle Proposition, ne réécrit pas l'ancienne. L'historique des refus est la matière première de l'amélioration. |

### D — Ancrage & RAG

| # | Exigence |
|---|---|
| **FR-IA16** | Le corpus légal est une **donnée versionnée par pays et par année**, jamais du contenu en dur — même invariant que les paquets de référentiels. |
| **FR-IA17** | Toute affirmation à portée **légale ou fiscale** cite son **article source**, retourné par la recherche documentaire. |
| **FR-IA18** | Sans citation, la Proposition est marquée **« non sourcée »** et **rendue inapplicable** — elle reste visible, mais ne peut pas être acceptée. C'est le garde-fou structurel contre l'hallucination. |
| **FR-IA19** | La citation est **vérifiable** : l'extrait affiché provient du corpus, et l'utilisateur peut remonter à l'article complet. Une référence qui ne résout pas est traitée comme une absence de citation. |
| **FR-IA20** | Le moteur d'embeddings est **interchangeable**, au même titre que le modèle de langage. |

### E — Surface pilote : mapping de comptes

| # | Exigence |
|---|---|
| **FR-IA21** | Pour un compte que le référentiel ne reconnaît pas, l'assistant **propose un rattachement** à un poste, justifié par la règle comptable applicable. |
| **FR-IA22** | La proposition alimente le **flux de surcharge existant** (`bilan-service`, FR-008) — déjà « une proposition validée par un humain et tracée ». L'IA **alimente** ce flux, elle ne le court-circuite pas. |
| **FR-IA23** | Le choix de cette surface comme pilote est délibéré : c'est la seule dont **le pire cas est une suggestion refusée**. Aucun chiffre officiel n'en dépend avant validation. |

### F — Règles d'automatisation

| # | Exigence |
|---|---|
| **FR-IA23b** | ⚡ **Catalogue des types d'action.** Chaque type d'action que l'assistant peut déclencher est **déclaré** avec ses propriétés : **réversible** (oui/non/sous conditions), **engageant** (produit-il un chiffre officiel ou un engagement ?), moyen d'annulation, service exécutant. **Ce catalogue est la seule source du contrôle de mode** (FR-IA27). Sans lui, la doctrine du §2 n'est qu'une intention : ni un libellé, ni un modèle ne permettent de déduire qu'une action engage. |
| **FR-IA23c** | Le catalogue est une **donnée versionnée**, alimentée par les modules qui exécutent les actions — c'est `notification-service` qui sait qu'un envoi WhatsApp n'est pas rattrapable, pas l'assistant. Un type d'action **non déclaré** est traité comme **engageant et irréversible** : le défaut est le régime le plus strict, jamais le plus permissif. |
| **FR-IA24** | Une **règle** déclare : un déclencheur, une action **prise au catalogue**, un canal, un **mode d'exécution**, des **garde-fous**, un **quota de sollicitation**, et le poste qui en est responsable. |
| **FR-IA25** | Les règles sont **des données**, pas du code : une organisation active, désactive et paramètre les siennes sans développement. |
| **FR-IA26** | Prospera livre un **socle de règles standard** par métier ; une organisation peut les surcharger sans les altérer pour les autres. |
| **FR-IA27** | Le **mode d'exécution d'une règle est contraint par les propriétés de son type d'action** au catalogue (FR-IA23b) : une action déclarée **engageante** ou **irréversible** ne peut pas être placée en `AUTO`. Le service **refuse la configuration** ; il ne se contente pas de la déconseiller. Le contrôle est rejoué **à l'exécution** : si le type d'action a changé de propriétés depuis, la règle est suspendue, pas exécutée. |
| **FR-IA28** | Un **quota de sollicitation** est obligatoire pour toute règle qui contacte une personne — plafond par destinataire et par période. Une règle sans quota est refusée. |

### G — Évaluation & cibles

| # | Exigence |
|---|---|
| **FR-IA29** | Une règle s'**évalue** sur les données réelles et produit la liste des **cibles qu'elle déclencherait maintenant**, message rédigé compris. Une règle qu'on ne peut pas prévisualiser est une règle qu'on n'active pas. |
| **FR-IA30** | Une cible porte : son libellé, son canal, le **message réellement prêt à partir** (personnalisé, pas un gabarit), sa valeur, son score et son échéance. |
| **FR-IA31** | Une cible **retenue par un garde-fou reste visible**, avec le garde-fou qui l'a retenue. *Une automatisation qui bloque en silence est une automatisation qu'on finit par ne plus croire.* |
| **FR-IA32** | Le **score d'une cible** est produit par un calculateur **interchangeable**. Au v1 c'est une **règle experte** explicable ; un modèle statistique pourra s'y brancher plus tard sans changer le contrat *[ASSUMPTION A2]*. |
| **FR-IA33** | Un score est **toujours explicable** : la cible porte les facteurs qui l'ont produit. Un score opaque sur une décision commerciale est inexploitable et indéfendable. |

### H — Les trois modes

| # | Exigence |
|---|---|
| **FR-IA34** | **`SUGGESTION`** — l'assistant signale, l'humain décide et agit. Aucune action n'est préparée. |
| **FR-IA35** | **`VALIDATION`** — l'assistant prépare tout (cible, canal, message) ; **un humain déclenche**. C'est le mode par défaut de toute règle touchant à l'argent, à une remise ou à la réputation. |
| **FR-IA36** | **`AUTO`** — l'assistant exécute, sous quatre conditions **cumulatives et vérifiées** : l'action est **réversible**, elle **n'engage rien** (§2), un **quota** la borne, et elle est **journalisée**. Une seule condition manquante ⇒ la règle ne peut pas être en `AUTO`. |
| **FR-IA36b** | ⚡ **`AUTO_SOUS_MANDAT`** — une action **engageante** peut être exécutée sans validation au coup par coup **si et seulement si** un humain a délivré un **mandat** préalable : plafond de montant, périmètre d'articles ou de fournisseurs, **date d'expiration**, révocabilité immédiate. Le mandat est une **délégation de signature**, pas une propriété de l'action : l'assistant n'a rien décidé, il exécute une autorisation humaine bornée. |
| **FR-IA36c** | Un mandat est **délivré par quelqu'un qui détient lui-même l'autorité correspondante**. Un responsable stock ne peut pas s'attribuer le plafond d'un directeur financier. Le service refuse la délivrance, il ne la signale pas. |
| **FR-IA36e** | ⚡ **Le plafond d'un mandat porte sa devise** et suit les règles d'exactitude de la plateforme : entier d'unité mineure, décimales de la devise (⚠️ **le XOF n'en a aucune**). Un mandat de « 3 000 000 » sans devise est un mandat dont personne ne connaît la portée réelle. *Ajouté à la revue croisée.* |
| **FR-IA36d** | Chaque exécution sous mandat **cite le mandat qui l'autorise** dans son journal, avec son plafond et son échéance. Un mandat **expiré ou révoqué** suspend immédiatement les règles qui s'y adossent — elles retombent en `VALIDATION`, jamais en silence. |
| **FR-IA37** | Toute action exécutée en `AUTO` est **annulable** et **notifiée au responsable de la règle**. L'autonomie n'est jamais silencieuse. |
| **FR-IA38** | Une organisation peut **abaisser** le mode d'une règle (`AUTO` → `VALIDATION`) mais jamais l'**élever** au-delà de ce que la nature de l'action autorise (FR-IA27). |
| **FR-IA39** | **Interrupteur général** par organisation : suspendre toutes les exécutions autonomes immédiatement, sans désactiver les règles une par une. |

### I — File d'arbitrage & journal

| # | Exigence |
|---|---|
| **FR-IA40** | Les cibles en attente de décision humaine forment une **file d'arbitrage**, triée par valeur et par urgence, filtrable par règle et par poste. |
| **FR-IA41** | La file permet la **décision groupée** — accepter ou refuser un lot — **avec le détail de chaque cible accessible**. Décider en masse doit rester décider : le lot est **plafonné** (défaut 25 cibles, plafond 100), et au-delà du plafond par défaut un **motif** est exigé. Le PRD crée le risque de validation de façade avec cette fonction ; il le borne ici et le surveille par CM-1. |
| **FR-IA42** | **Journal des exécutions** : ce que chaque règle a fait, sur quelles cibles, avec quel résultat. Restituable par période et par règle. |
| **FR-IA43** | Chaque règle expose ses **statistiques** : exécutions, succès, impact, temps de travail évité. Une règle qui n'a jamais réussi doit être visible comme telle. |
| **FR-IA44** | **Audit intégral et append-only** de toute interaction avec un modèle : contexte envoyé, réponse reçue, citations, modèle, version de gabarit, décision humaine. |

### J — Administration & droits

| # | Exigence |
|---|---|
| **FR-IA45** | Droits portés par le catalogue de permissions plateforme, distincts : créer une règle, changer son mode, arbitrer une file, accepter une Proposition, administrer les modèles. |
| **FR-IA46** | **Changer le mode d'une règle est un droit à part** — plus restreint que celui de l'arbitrer. Passer une règle en `AUTO` est une décision de gouvernance, pas une opération quotidienne. |
| **FR-IA47** | Cloisonnement strict par organisation : Propositions, règles, journaux, corpus surchargés. |
| **FR-IA48** | Le **contexte envoyé au modèle est minimisé** : seules les données nécessaires à la surface, jamais un dossier entier par confort d'implémentation. |

### K — Consommation d'inférence

L'inférence coûte du temps de calcul sur un serveur partagé entre toutes les organisations. Sans
mesure ni plafond, une seule organisation peut dégrader le service pour toutes les autres.

| # | Exigence |
|---|---|
| **FR-IA49** | Chaque invocation de modèle est **comptée et attribuée** : organisation, surface, utilisateur ou règle à l'origine, taille du contexte, durée, modèle utilisé. Aucune invocation anonyme. |
| **FR-IA50** | **Quota d'invocation par organisation et par période**, paramétrable, avec plafond opposable. Le dépassement dégrade proprement — la fonctionnalité est refusée avec un message clair, jamais une attente sans fin. |
| **FR-IA51** | Restitution de la consommation d'inférence **par organisation, surface et période**, plus une **vue plateforme** réservée au rôle plateforme. Même patron que la mesure de consommation de `notification-service`. |
| **FR-IA52** | Les **traitements longs** (dossier fiscal argumenté) sont différés et ne bloquent pas les demandes interactives d'autres organisations. La file d'inférence est équitable entre organisations, pas premier arrivé premier servi. |

---

## 7. Exigences non fonctionnelles (NFR)

### NFR-1 — Frontière déterministe *(structurante)*

L'IA ne calcule **aucun** chiffre officiel. Les moteurs déterministes — liasse, moteur fiscal, table
de passage — restent la source de vérité. Une Proposition acceptée est **recalculée** par le moteur
compétent, qui seul en établit l'impact réel.

### NFR-2 — La réversibilité conditionne l'autonomie

Le mode `AUTO` n'est pas un réglage de confiance : c'est une **propriété de l'action**. Le service
vérifie les quatre conditions de FR-IA36 à la configuration **et** à l'exécution.

### NFR-3 — Pas d'affirmation sans source

Aucune affirmation à portée légale n'est présentée comme applicable sans citation vérifiable.
**Condition observable :** un jeu de questions dont la réponse n'est pas dans le corpus doit produire
100 % de Propositions marquées *non sourcée* — et zéro invention plausible.

### NFR-4 — Les données ne quittent pas l'infrastructure

Modèle auto-hébergé par défaut. Toute API externe exige activation explicite par organisation,
minimisation et audit (FR-IA09).

### NFR-5 — Démarrage dégradé et indépendance des moteurs

L'absence du modèle de langage n'empêche ni le démarrage, ni le fonctionnement du moteur de règles.
Les deux moteurs partagent un contrat, pas une dépendance.

### NFR-6 — Traçabilité opposable

Tout ce qui a été envoyé à un modèle, reçu de lui, et décidé par un humain est journalisé en
append-only. Un conseil fiscal contesté doit être reconstituable deux ans plus tard.

### NFR-7 — Délais *(cibles proposées, à confirmer après mesure)*

| Opération | Cible proposée |
|---|---|
| Proposition interactive (mapping, analyse courte) | P95 < 10 s |
| Évaluation d'une règle et production des cibles | P95 < 30 s |
| Dossier argumenté long (conseil fiscal) | traitement différé, avec progression visible |

---

## 8. Métriques de succès

| # | Métrique | Cible | Ce qu'elle valide |
|---|---|---|---|
| **SM-1** | Propositions appliquées sans validation humaine, hors mode `AUTO` autorisé | **0** | NFR-1 et la doctrine |
| **SM-2** | Affirmations légales sans citation vérifiable présentées comme applicables | **0** | NFR-3 |
| **SM-3** | Taux d'acceptation des Propositions | **entre 40 % et 85 %** *(bornes proposées — la borne haute dérive de CM-1, la borne basse est à confirmer après 30 j)* | Voir CM-1 |
| **SM-7** | Écart entre l'impact annoncé par une Proposition et l'impact recalculé par le moteur déterministe | **restitué dans 100 % des cas**, taux d'écart significatif suivi par surface | FR-IA12b — c'est la preuve opérationnelle de NFR-1 |
| **SM-4** | Actions `AUTO` ayant fait l'objet d'une annulation ou d'une plainte | **< 1 %** | La frontière de réversibilité est bien placée |
| **SM-5** | Coût d'ajout d'une surface | gabarit + configuration, **cœur non touché** | Le socle est un socle |
| **SM-6** | Règles évaluables en prévisualisation avant activation | **100 %** | FR-IA29 |

### Contre-métriques

| # | Contre-métrique | Seuil d'alerte |
|---|---|---|
| **CM-1** | **Taux d'acceptation proche de 100 %** | ⚠️ Ce n'est **pas** un succès : c'est le signal que l'humain valide sans lire. Une validation de façade est pire qu'une absence de validation — elle donne à l'automatisation une caution qu'elle n'a pas. Seuil d'alerte : **> 90 % sur 30 jours** |
| **CM-2** | Délai médian entre proposition et décision | En baisse continue avec un taux d'acceptation en hausse = même signal que CM-1 |
| **CM-3** | Part des règles jamais arbitrées, dont la file s'accumule | Hausse — une file qu'on ne traite plus est une automatisation abandonnée qui continue de tourner |

---

## 9. Découpage en incréments

| Incrément | Pts est. | Titre | Contenu | Critère de sortie |
|:--:|:--:|---|---|---|
| **1** | ~29 | **Le socle propose** | A · B · C · K — service, `LlmProvider`, contrat Proposition, cycle, audit, mesure d'inférence | Une Proposition est produite, tracée, acceptée ou refusée par un humain, et transmise à sa surface |
| **2** | ~26 | **Le socle ne ment pas** | D · E — RAG, citation obligatoire, surface pilote mapping, écart annoncé/recalculé | Une question hors corpus produit une Proposition *non sourcée*, jamais une invention |
| **3** | ~37 | **Le socle agit** | F · G · H · I · J — catalogue des types d'action, règles, évaluation, trois modes, file d'arbitrage, journal, droits | Une règle dont le type d'action est déclaré engageant est **refusée en `AUTO` à la configuration** |

⚠️ **~92 points, soit 3 sprints pleins.** L'estimation de la séquence des modules (2 sprints) était
basse, comme pour `notification-service`. Le motif est le même : le périmètre réel apparaît au
découpage, pas au cadrage.

**Pourquoi cet ordre.** L'incrément 1 est utile seul : le contrat Proposition est ce que les surfaces
consommeront. L'incrément 2 est celui qui rend le conseil fiscal **écrivable** — il débloque
`EPIC-024`. L'incrément 3 est le plus vendu et le plus risqué : il vient quand le contrat est éprouvé.

---

## 10. Dépendances

| Dépendance | État | Impact |
|---|---|---|
| Corpus CGI/LPF versionné (1 185 articles) | ✅ **livré** 2026-07-19 | — |
| Table de passage compte → poste (FR-006/008) | ✅ livré (`bilan-service`) | Surface pilote |
| Catalogue de permissions plateforme | ✅ livré S18 | Droits FR-IA45 |
| Identité, isolation, démarrage dégradé | ✅ patrons établis | — |
| **Moteur fiscal** (`EPIC-023`) | 🟡 S19 | Surface conseil fiscal — **hors de ce PRD**, s'y branche ensuite |
| **`notification-service`** | ⬜ à construire | Les règles décident d'envoyer ; elles n'envoient pas. **Sans lui, l'incrément 3 ne peut pas exécuter ses actions de communication** |
| **Serveur d'inférence** (GPU pour un modèle performant) | ⛔ **non spécifié** | Décision ouverte n° 1 de la note d'architecture, toujours ouverte — voir Q2 |

---

## 11. Risques

| # | Risque | Traitement |
|---|---|---|
| **R1** | Le petit modèle de développement hallucine les citations légales, et sa sortie est prise pour de la qualité | Assumé et écrit (FR-IA06). Le développement valide la **mécanique**, jamais la qualité. NFR-3 est le filet |
| **R2** | La validation humaine devient une formalité — on clique sans lire | **CM-1** en fait un signal surveillé plutôt qu'un angle mort. C'est le risque le plus probable de tout le module |
| **R3** | Le Copilot conversationnel est vendu dans tous les dashboards des deux catalogues et n'est pas dans ce périmètre | ✅ **Résolu — module dédié plus tard** (décision utilisateur 2026-08-02). Différé assumé, à inscrire dans la séquence des modules. Le contrat Proposition et le `LlmProvider` livrés ici lui serviront de socle |
| **R4** | Les ~100 IA vendues (scoring, prévision, churn, PD, PAR, optimisation de tournées) ne sont couvertes par aucun PRD | ✅ **Résolu — module dédié plus tard** (décision utilisateur 2026-08-02). Autre métier : modèles statistiques, pas modèles de langage. La question du démarrage à froid (Q1) reste attachée à ce module |
| **R5** | Une règle passe en `AUTO` sur une action qui engage, par méconnaissance | FR-IA27 **refuse la configuration** au lieu de la déconseiller. Le droit de changer un mode est distinct (FR-IA46) |
| **R6** | Le serveur d'inférence n'existe pas : le socle est livré et ne tourne qu'en développement | Q2. L'incrément 1 reste démontrable ; la qualité, non |
| **R7** | Le moteur de règles a besoin de données métier alors que le service ne doit détenir aucune copie | ✅ **Résolu 2026-08-02 — le module détenteur expose ses candidats** (FR-IA03b). Risque résiduel assumé : un module indisponible empêche sa règle de tourner ; traité par FR-IA03c (non-exécution visible au journal) |

---

## 12. Questions ouvertes

| # | Question | Statut |
|---|---|---|
| Q1 | **Scoring et prévision** (churn, PD, demande, PAR) : quel module, quand, et sur quel historique ? Un premier client arrive avec zéro mois de données | ⏸ **reportée** (décision utilisateur : « arrivé là-bas on va le faire »). Sans effet sur ce PRD — hors périmètre. Reste à traiter avant de vendre ces IA |
| Q2 | **Serveur d'inférence** : quelle machine, quel modèle de production ? | ⛔ **ouverte** — décision n° 1 de la note d'architecture, jamais tranchée. Bloque la qualité, pas la livraison |
| Q3 | Nom du service : `assistant-service`, `conseil-service`, `copilote-service` | ouverte — sans conséquence technique |
| Q4 | Le stockage vectoriel : index simple ou moteur dédié | ouverte — à trancher quand le corpus devient multi-pays |
| Q5 | Qui, chez le client, a le droit de passer une règle en `AUTO` ? | ouverte — décision de gouvernance, à trancher au découpage en stories |
| Q6 | Comment le moteur de règles atteint-il les données métier sans détenir de copie ? | ✅ **tranchée 2026-08-02** — **le module détenteur expose un fournisseur de candidats** ; aucun abonnement au bus, aucune copie locale (FR-IA03 → IA03c) |
| Q7 | Qui alimente le **catalogue des types d'action** (FR-IA23b/c) et le valide ? | ouverte — à trancher au découpage en stories. Le défaut strict (non déclaré = engageant) rend l'absence non dangereuse |

---

## Index des assumptions

| # | Assumption | Où | Confirmation attendue |
|---|---|---|---|
| ~~A1~~ | ✅ **Devenue une décision, pas une assumption** (2026-08-02) : le module détenteur expose ses candidats, l'assistant détient la règle, le mode, les garde-fous et le journal. L'alternative — abonnement au bus et copies locales — a été **écartée** : une copie qui dérive produit une relance sur une facture déjà payée, défaut invisible en test | FR-IA03, FR-IA03b, FR-IA03c | — |
| **A2** | Une règle experte explicable suffit à scorer les cibles au v1 ; un modèle statistique s'y branchera sans changer le contrat | FR-IA32 | Module scoring (Q1) |
| **A3** | Le corpus légal togolais suffit au v1 ; l'extension multi-pays est une donnée, pas un développement | FR-IA16 | 1ᵉʳ client hors Togo |
| **A4** | Les surfaces consommatrices (mapping, conseil fiscal) acceptent de recalculer l'impact d'une Proposition par leur propre flux plutôt que de faire confiance au contenu proposé | FR-IA12 | Intégration `bilan-service` |
