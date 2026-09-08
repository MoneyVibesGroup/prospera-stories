# Convergence — treize stories, dont quatre à tirer AVANT les rails

**Date :** 2026-09-08 · **Total :** 62 points · **13 stories**, dont **7 nouvelles** et **2 renumérotées**.
**Remplace** la version du 2026-09-07, réanalysée en partant des besoins de test.

> ⚡⚡ **La réanalyse a retourné le plan.** La convergence n'est pas un bloc de fin : quatre de ses
> stories sont des **prérequis de tout**, y compris des deux rails. Sans elles, aucun test
> inter-services ne peut exister — et l'une d'elles protège les rails eux-mêmes contre le défaut
> qui a coûté la journée du 7 septembre.

---

## Ce que la recette Docker du 7 septembre a appris, et ce que ça change

**5 703 tests verts, zéro application qui démarre.** Les deux services avaient quatre défauts de
câblage Nest (`UnknownDependenciesException`). Aucun test ne les voyait : chaque spec monte son
propre module de test avec ses propres fournisseurs. **Le graphe d'injection réel n'est évalué que
par un démarrage.**

⚡ **Le remède est éprouvé et coûte 40 lignes :** `NestFactory.create(AppModule, { preview: true })`
construit le graphe et résout les dépendances **sans rien instancier** — ni Mongo, ni Kafka, ni
Redis, ni BullMQ. 12 secondes par dépôt, dans `npm test`, sans Docker.

⛔ **Conséquence directe sur ce découpage :** une recette croisée est le premier moment où plusieurs
vrais services doivent démarrer ensemble. **Quatre des cinq services qu'elle traverse n'ont jamais
été démarrés**, et aucun ne porte la garde.

---

## Les quatre constats vérifiés le 2026-09-08, qui décident du contenu de E0

### 1 · La garde de câblage n'existe que dans un dépôt sur six

| Service | Garde `app-cablage.invariant.spec.ts` | Déjà démarré ? |
|---|---|---|
| `notification-service` | ✅ **sur `origin/dev`** | ✅ 2026-09-07 |
| `paiement-service` | ⛔ **absente de TOUTES les branches** | ✅ 2026-09-07 |
| `platform-catalog-service` | ⛔ absente | ❌ jamais |
| `auth-service` | ⛔ absente | ❌ jamais |
| `kyc-service` | ⛔ absente | ❌ jamais |
| `admin-panel` | ⛔ absente | ❌ jamais |

⚠️ **La note de recette dit « posée dans les DEUX dépôts le 2026-09-07 ». Le balayage des branches
distantes de `paiement-service` n'en trouve aucune trace.** Elle n'a pas été commitée de ce côté-là.
C'est exactement le patron « la fiche ne fait pas foi sur l'état réel », sur un fichier cette fois.

### 2 · Les deux services ne peuvent pas se parler dans la pile locale

`NOTIFICATION_BASE_URL` et `NOTIFICATION_JETON_SERVICE` sont **absents du `docker-compose.yml`
racine** et du `.env.example`. L'adaptateur de STORY-608 lève alors `EchecDeRemise` et laisse la
ligne en attente — **par choix**, et c'est le bon choix.

⛔ **Mais il n'existe donc aujourd'hui aucun chemin par lequel un lien de paiement puisse
réellement partir.** Toutes les recettes croisées en dépendent, et aucune story ne le porte.

### 3 · L'amorçage vise le mauvais port du catalogue

`src/seeds/amorcage/reglages.ts` (STORY-613, sur `origin/dev`) :

```
AMORCAGE_URL_CATALOGUE ?? 'http://platform-catalog-service:3004'
```

Or `platform-catalog-service` publie `'3003:3003'` au compose racine ; **3004 est
`bilan-service`**. Les deux autres cibles sont justes (`auth-service:3001`, `kyc-service:3002`).

⛔ **L'amorçage échoue donc à l'étape 2 — déclarer le module au catalogue — contre la vraie pile**,
à moins de poser la variable à la main. Et l'étape 4, l'octroi du droit d'usage, en dépend. C'est
le prérequis de **toutes** les recettes croisées, et il est faux dans son réglage par défaut.

### 4 · Aucune recette ne peut exprimer « la pile est prête »

`paiement-service` reste **`unhealthy` volontairement** : `API_BUSINESS` est déclaré, aucun
`PI_SPI_*` n'existe, donc `/health` rend 503 **en nommant les réglages manquants** (STORY-249).

⛔ **Conséquence à connaître : aucun `depends_on: service_healthy` ne pourra jamais viser
`paiement-service`** tant que PI-SPI n'a pas d'identifiants. Une recette croisée a donc besoin
d'une convention de disponibilité **qui n'est pas le healthcheck du compose**.

Et il n'y a **ni `package.json` racine, ni espace de travail npm, ni `.github/workflows`** : un test
qui traverse deux dépôts n'a aujourd'hui **ni endroit où vivre, ni moyen d'être lancé**.

---

## Ce qui sort du périmètre après réanalyse

| Story | Pourquoi elle sort |
|---|---|
| ~~STORY-287~~ — candidats pour l'assistant | ⛔ **`assistant-service` n'existe pas** : ni dossier au dépôt, ni entrée au compose. Le module est cadré (PRD, EPIC-095→105), pas échafaudé. Même raison exactement que STORY-267 et Relance — je l'avais laissée entrer hier par erreur. |

---

## Le tableau des treize

| # | Story | Ce qu'elle traverse | Quand | Pts |
|---|---|---|---|---|
| 1 | **STORY-643** 🆕 | 5 services · la garde de câblage | ⚡ **avant les rails** | 5 |
| 2 | **STORY-644** 🆕 | `paiement` ↔ `notification` au compose | ⚡ **avant les rails** | 3 |
| 3 | **STORY-645** 🆕 | amorçage + disponibilité de la pile | ⚡ **avant les rails** | 5 |
| 4 | **STORY-646** 🆕 | espace de travail + profil de recette | ⚡ **avant les rails** | 5 |
| 5 | STORY-279 | `paiement` → `catalogue` | dès maintenant | 5 |
| 6 | STORY-609 | `catalogue`, lu par tous les verticaux | dès maintenant | 5 |
| 7 | STORY-610 | `auth` → `notification` | dès maintenant | 8 |
| 8 | STORY-286 | `paiement` → `admin-panel` | après rail C | 3 |
| 9 | **STORY-647** 🆕 | `notification` → `paiement` | après C et D | 5 |
| 10 | **STORY-648** 🆕 | `paiement` → `notification` | après C et D | 3 |
| 11 | STORY-631 | les quatre services | à la fin | 5 |
| 12 | STORY-632 | les quatre, sans Money Vibes au milieu | à la fin | 5 |
| 13 | **STORY-649** 🆕 | les cinq, l'argent qui revient | à la fin | 5 |

---

# Bloc E0 — Le substrat de recette · 18 pts · ⚡ À TIRER AVANT LES RAILS

**Aucune de ces quatre stories ne produit de fonctionnalité.** Elles produisent la capacité de
savoir si les autres marchent. Tirées après les rails, elles découvriraient vingt stories de
défauts d'un coup — et les défauts de câblage **se découvrent en cascade, un par redémarrage**.

### 1 · STORY-643 🆕 — La garde de câblage dans les cinq dépôts qui ne l'ont pas

**Services :** `paiement`, `platform-catalog`, `auth`, `kyc`, `admin-panel` · **Points :** 5
⚡ **Prérequis d'absolument tout, rails compris.**

**Récit :** en tant qu'**équipe**, je veux qu'une suite verte signifie que l'application démarre,
afin de ne plus livrer un module qui ne boote pas.

⚡ **La garde est portable telle quelle** — seule la liste des variables d'environnement change.
La contre-épreuve a été faite des deux côtés le 7 septembre : en retirant un import, elle rougit en
rendant **mot pour mot** l'exception que le conteneur affichait.

- AC-1 — Chaque dépôt porte `src/app-cablage.invariant.spec.ts` : `NestFactory.create(AppModule,
  { preview: true })` résout le graphe **sans instancier** Mongo, Kafka, Redis, BullMQ ni minuterie.
- AC-2 — ⛔ `abortOnError: false` est **obligatoire** : par défaut Nest appelle `process.exit(1)`
  dans sa zone d'exceptions, jest rend « process.exit called with 1 » et **le message de l'erreur
  est perdu**.
- AC-3 — ⚠️ La garde pose elle-même son décor d'environnement, et importe `app.module`
  **tardivement** (`await import`) : la validation d'environnement refuse un environnement vide
  **bien avant** l'injection, et la garde rougirait pour une raison qui n'est pas la sienne.
- AC-4 — ⛔ La contre-épreuve est **dans la story** : retirer un import connu fait rougir la garde
  avec le nom du fournisseur irrésolu. Une garde qui ne sait plus échouer est verte pour la pire
  des raisons.
- AC-5 — Les cinq applications démarrent réellement : `docker compose up -d --build` puis
  `docker logs` jusqu'à `Nest application successfully started`, **en bouclant** — Nest s'arrête au
  premier fournisseur irrésolu, corriger le premier fait apparaître le deuxième.
- AC-6 — ⚠️ Le correctif de `paiement-service` part de `origin/dev` et se fusionne **seul** : le
  défaut de `RoutageModule` vit dans la pile non fusionnée, et reprendre le commit coupable
  imposerait de rebaser toutes les branches en aval, déjà poussées.

### 2 · STORY-644 🆕 — Le rail paiement → notification, câblé et authentifié

**Services :** `paiement` + `notification` + compose racine · **Points :** 3 · **Prérequis :** 643

**Récit :** en tant qu'**équipe**, je veux qu'un lien de paiement puisse réellement partir dans la
pile locale, afin qu'une recette croisée ait quelque chose à observer.

⛔ **Aujourd'hui l'adaptateur lève `EchecDeRemise` et laisse la ligne en attente. C'est correct, et
c'est pour ça que personne ne l'a vu :** rien ne rougit, la demande est écrite, et l'envoi n'existe
simplement pas.

- AC-1 — `NOTIFICATION_BASE_URL` et `NOTIFICATION_JETON_SERVICE` sont posés au compose racine **et**
  au `.env.example`, avec la même discipline que les autres réglages : valeur par défaut de
  développement, jamais de production.
- AC-2 — Le jeton de service porte l'audience de `notification-service`. ⚠️ L'`AUTH_AUDIENCE` de
  l'IdP racine **liste déjà** les deux services : c'est la seule moitié du câblage qui existe.
- AC-3 — ⛔ Le jeton n'apparaît ni au journal, ni dans un travail de file, ni dans une trace
  d'erreur — la même garde que le secret de passerelle de STORY-604.
- AC-4 — Une remise refusée pour cause d'authentification se distingue d'une remise refusée parce
  que le service est absent : **deux remèdes, deux codes**.
- AC-5 — La ligne en attente **repart** quand le câblage arrive : le rejeu recopie, il ne résout pas.

### 3 · STORY-645 🆕 — L'amorçage atteint le catalogue, et la pile déclare qu'elle est prête

**Services :** `paiement` (amorçage) + compose racine · **Points :** 5 · **Prérequis :** 643

**Récit :** en tant qu'**équipe**, je veux que la commande d'amorçage marche contre la vraie pile,
afin que les recettes croisées partent d'un état connu au lieu d'un état supposé.

⛔ **Le réglage par défaut vise `platform-catalog-service:3004`, et ce conteneur écoute sur `3003`
— 3004 est `bilan-service`.** L'étape qui déclare le module échoue, donc l'octroi du droit d'usage
aussi, donc l'organisation Money Vibes ne franchit pas son propre contrôle d'accès.

⚠️ **Ce défaut prouve que l'amorçage n'a jamais tourné contre la pile complète** — seulement contre
des doubles. C'est le premier besoin de test, et il n'était couvert nulle part.

- AC-1 — Le réglage par défaut du catalogue vise le port réellement publié. Les trois cibles sont
  **vérifiées contre le compose**, pas contre une note de port.
- AC-2 — ⛔ Une garde compare les trois URL par défaut aux ports du `docker-compose.yml` racine et
  **rougit** quand ils divergent. Sans elle, le prochain déplacement de port refait le même trou.
- AC-3 — L'amorçage rend un rapport qui **nomme le service injoignable**, pas un échec générique :
  un port fermé et une route absente ne se corrigent pas pareil.
- AC-4 — ⛔ La disponibilité de la pile est une **convention explicite**, pas le healthcheck du
  compose : `paiement-service` est `unhealthy` **volontairement** (503 nommant les `PI_SPI_*`
  absents, STORY-249), et **aucun `depends_on: service_healthy` ne pourra jamais le viser**.
  La convention s'appuie sur `/health/live` et sur l'appartenance des consommateurs à leurs groupes.
- AC-5 — La commande est **idempotente** : la rejouer sur une pile déjà amorcée ne duplique rien et
  le dit.

### 4 · STORY-646 🆕 — Où vit un test inter-services, et comment on le lance

**Portée :** racine du dépôt · **Points :** 5 · **Prérequis :** 644, 645 · **et STORY-268** (rail C)

**Récit :** en tant qu'**équipe**, je veux un endroit où un test qui traverse deux services puisse
vivre et être lancé, afin que les recettes croisées ne soient pas des procédures manuelles.

⛔ **Il n'y a ni `package.json` racine, ni espace de travail npm, ni `.github/workflows`.** Les
recettes croisées 631, 632 et 649 n'ont aujourd'hui **ni fichier où être écrites, ni commande qui
les lance**. C'est la même dette racine qui bloque la moitié d'AC-5 de STORY-570 depuis le 3 septembre.

⚡ **STORY-268 du rail C crée déjà l'espace de travail** pour extraire le noyau de rapprochement.
Cette story-ci s'y branche au lieu d'en créer un second — et c'est la seule raison pour laquelle
elle ne coûte que 5 points.

- AC-1 — Un paquet de recette vit dans l'espace de travail, avec sa propre commande.
- AC-2 — Un profil de compose nommé lève la pile des cinq services **et l'amorce**, en une commande.
- AC-3 — ⛔ Le profil de recette ne réécrit **aucune** valeur métier : il pose des réglages
  d'environnement, jamais un état en base. Un état posé directement en base sauterait les événements
  qui alimentent les read-models — le piège déjà nommé par STORY-613.
- AC-4 — La suite de recette **échoue** quand un service ne démarre pas, avec le nom du service.
- AC-5 — ⚠️ Elle n'est pas dans `npm test` : elle exige Docker, et
  [[regle-docker-a-la-demande]] veut qu'on ne démarre Docker qu'aux portes d'intégration.

---

# Bloc E1 — Les trois héritées, tirables dès maintenant · 18 pts

Le rail B est **entièrement sur `origin/dev`**. Le rail A y est **à trois commits près** (283, 284
et la recette 288 restent sur des branches non fusionnées). Ces trois stories n'attendent rien
d'autre.

### 5 · STORY-279 — Le catalogue consomme les événements d'abonnement

**Service :** `platform-catalog-service` · **Points :** 5

⚡ **C'est ce qui remplace la décision C8, ouverte depuis STORY-034.** Sans elle, encaisser un
abonnement ne fait rien : les droits restent ce qu'un humain en a fait.

- Échéance encaissée → entitlement octroyé, **idempotent sur l'identifiant d'événement**.
- Impayé → révoqué. Régularisé → rétabli.
- ⛔ `paiement-service` **n'écrit jamais** d'entitlement : il déclenche, il relit comme tout le monde.
- ⚠️ **Avant d'ajouter ce consommateur, regarder la clef du marqueur d'idempotence** du service :
  un marqueur keyé par identifiant d'événement seul impose **un seul groupe par topic**, et un
  second consommateur trouverait tout déjà marqué sans jamais rien écrire — la leçon de STORY-573.

### 6 · STORY-609 — Le droit d'usage porte une échéance, le renouvellement prolonge

**Service :** `platform-catalog-service` · **Points :** 5 · **Fiche écrite :** `stories/STORY-609.md`

⛔ **La seule story de cet ensemble qui ne serve pas la démonstration mais le REVENU.** Un droit
octroyé ne s'éteint aujourd'hui que sur révocation, qui exige le réseau **et** quelqu'un qui y pense.
Un droit qui expire par défaut fait que **le silence ferme**.

⚠️ **Change un contrat lu par `bilan`, `fiscal`, `dossier`, `balance` et `paiement`.** Un service qui
teste *différent de révoqué* ouvrirait un module expiré. À annoncer avant livraison.

### 7 · STORY-610 — Les sept courriels de compte passent par la notification

**Service :** `auth-service` · **Points :** 8 · **Fiche écrite :** `stories/STORY-610.md`

⛔ **Le sens des dépendances est le risque.** L'authentification est la **racine** du graphe ; la
notification en est une feuille. L'appel n'est acceptable qu'à une condition, vérifiée par un test
avec le service coupé : **l'inscription réussit quand même**.

⚡ **Elle exige le même câblage que STORY-644, mais depuis `auth-service`** : une adresse de base et
un jeton de service, absents eux aussi du compose. À poser dans la même passe.

---

# Bloc E2 — Ce que le rail C ouvre ailleurs · 3 pts

### 8 · STORY-286 — Console d'exploitation bornée sur `admin-panel`

**Services :** `paiement` + `admin-panel` · **Points :** 3 · **Prérequis :** rail C (270, 272), 643

Exactement quatre lectures : suivre les demandes, consulter les notifications de fournisseur
rejetées, réacheminer une demande, consulter les écarts de rapprochement.

⛔ **La console n'est PAS un chemin d'écriture privilégié** : un réacheminement lancé depuis elle
exige une révocation prouvée, comme partout ailleurs.

⚡ **Elle n'a de sens qu'après STORY-270** : les écarts de rapprochement qu'elle affiche n'existent
pas avant.

---

# Bloc E3 — Le pont entre les deux rails · 8 pts

### 9 · STORY-647 🆕 — L'arrêté de consommation devient une créance

**Services :** `notification` → `paiement` · **Points :** 5
**Prérequis :** rail D (639), rail C (272), et 644

**Récit :** en tant que **Money Vibes**, je veux facturer à une organisation les messages qu'elle a
consommés, afin que le canal qui coûte de l'argent en rapporte.

⚡⚡ **C'est le seul endroit du programme où la facturation peut apparaître sans casser la garde qui
l'interdit.** `aucune-facturation.spec.ts` balaie tout `notification-service` et échoue si un solde
y est lu, un quota comparé, un envoi refusé parce qu'il coûte. Elle **reste verte**, parce que la
créance n'est pas écrite là : la notification **publie un arrêté**, le paiement **matérialise une
créance**.

- AC-1 — Un arrêté de période close publie `notification.consommation.arretee` **via l'outbox**,
  keyé par organisation, portant les totaux **par devise** et la révision de barème.
- AC-2 — `paiement-service` matérialise une créance par upsert **idempotent sur l'identifiant
  d'arrêté** — le mécanisme de STORY-251, sans une ligne nouvelle sur la créance.
- AC-3 — ⛔ La créance a pour bénéficiaire **Money Vibes**, jamais l'organisation consommatrice.
- AC-4 — ⛔ Une devise sans barème publié ne produit **aucune créance** et **aucune conversion** :
  la non-compensation de STORY-284 s'applique sans exception.
- AC-5 — ⛔ Une garde vérifie que `notification-service` n'importe rien du paiement et n'appelle
  aucune de ses routes. **Le pont est un topic, pas un appel.**
- AC-6 — Une consommation nulle ne produit pas de créance à zéro.

### 10 · STORY-648 🆕 — Un encaissement fait partir un reçu

**Services :** `paiement` → `notification` · **Points :** 3
**Prérequis :** rail C (273, 275), rail B (611, 617), et 644

⚡ **Le rail C livre le producteur, le rail B livre les modèles et la marque. Il ne manque que le
consommateur** — et il vit du côté de la notification, jamais du côté du paiement.

- AC-1 — `paiement.encaissement.confirme` fait partir un reçu au payeur, sous **l'identité d'envoi
  de l'organisation créancière**, pas sous celle de Money Vibes.
- AC-2 — `paiement.encaissement.annule` fait partir un avis d'annulation au même destinataire, qui
  cite le reçu d'origine.
- AC-3 — ⛔ L'événement ne porte **ni jeton, ni adresse de paiement** : l'arbitrage de STORY-607
  vaut pour toute la famille, pas pour le seul lien.
- AC-4 — Le destinataire est résolu par le **carnet, à la remise**. Un payeur inconnu ne fait pas
  échouer l'encaissement : le fait est écrit, l'envoi est `ecarte` avec son motif.
- AC-5 — Ces messages sont **transactionnels** : ni la fenêtre d'envoi (636) ni le « STOP » (628)
  ne les retiennent ; la **suppression pour rebond dur** (633), si.
- AC-6 — ⚠️ Avant d'ajouter ce consommateur, **regarder la clef du marqueur d'idempotence** —
  même contrôle qu'en 279.

---

# Bloc E4 — Les trois recettes croisées · 15 pts

⛔ **Aucune n'est écrivable avant STORY-646** : elles n'ont ni fichier où vivre, ni commande qui
les lance.

### 11 · STORY-631 — Recette croisée : un cabinet paie son abonnement

**Points :** 5 · **Prérequis :** E0 complet, 279, 609, 610 · *(renumérotée depuis 630)*

- AC-1 — Un utilisateur s'inscrit ; le message de vérification part **par la notification**, sous la
  marque de son organisation.
- AC-2 — Money Vibes ouvre un abonnement : périodicité, montant, échéance.
- AC-3 — L'échéance **est une créance** ; une demande est émise, un lien est créé.
- AC-4 — Le lien **arrive** au cabinet par courriel, sous l'identité d'envoi de Money Vibes.
  ⚡ C'est l'assertion que le câblage de STORY-644 rend possible pour la première fois.
- AC-5 — ⛔ Aucun jeton de lien n'a transité par le bus ni n'apparaît dans un journal. Vérifié sur
  la trace, pas sur le code.
- AC-6 — Le cabinet paie sur la page publique ; la notification signée du fournisseur crée
  l'encaissement.
- AC-7 — Le droit d'usage s'**ouvre** sans intervention manuelle, et son échéance est **prolongée**,
  pas recréée.
- AC-8 — Une cloche annonce l'échéance suivante dans l'application du cabinet.
- AC-9 — ⛔ Le compte crédité est celui de **Money Vibes**, et un test vérifie l'invariant inverse :
  aucune créance du cas client n'a pour bénéficiaire un compte que Money Vibes contrôle.

### 12 · STORY-632 — Recette croisée : un distributeur encaisse pour lui-même

**Points :** 5 · **Prérequis :** 631 · *(renumérotée depuis 631)*

⚡ **C'est la recette qui matérialise NFR-1.** Les deux cas empruntent le même code ; seule la
configuration change.

- AC-1 — Le distributeur enregistre **ses propres** clés de fournisseur et **son propre** compte
  d'encaissement, par la surface de l'organisation, pas par l'administration.
- AC-2 — Il enregistre **sa propre** passerelle ; son message part sous **son** expéditeur, prouvé
  par comparaison avec l'envoi de Money Vibes du scénario précédent.
- AC-3 — Il matérialise une créance, encaisse par lien, et le solde se **décompose** (STORY-272).
- AC-4 — Il encaisse aussi **en espèces déclarées**, validées par un **second rôle**.
- AC-5 — Un encaissement est **annulé par contre-passation** (274), un **second rôle** est exigé
  (275), et l'avis d'annulation part (648).
- AC-6 — ⛔ L'argent atterrit sur le compte du distributeur. Un test vérifie qu'aucun compte
  contrôlé par Money Vibes n'apparaît dans la chaîne.
- AC-7 — Un second distributeur ne voit **rien** du premier : ni compte, ni passerelle, ni créance,
  ni suppression. Le refus est un **introuvable**, jamais un interdit.

### 13 · STORY-649 🆕 — Recette croisée : le distributeur est facturé pour ce qu'il consomme

**Points :** 5 · **Prérequis :** 632, 647

**Récit :** en tant que **direction**, je veux voir l'argent revenir **vers** Money Vibes sans que
Money Vibes n'ait touché celui du client, afin de savoir que les deux flux coexistent sans se mélanger.

⚡⚡ **C'est la seule recette qui fasse tourner les deux flux en même temps, dans la même
organisation** — le seul état réel.

- AC-1 — Le distributeur envoie 200 SMS sous **sa** passerelle. Le coût réel rapporté gagne sur
  l'estimé, et le **premier** rapporté gagne.
- AC-2 — La période se clôt ; l'arrêté est immuable ; un accusé tardif tombe dans la période suivante.
- AC-3 — Une créance naît chez Money Vibes, et un lien de paiement part au distributeur — **sous
  l'identité de Money Vibes**.
- AC-4 — Pendant ce temps, le distributeur encaisse ses **propres** créances sur son **propre** compte.
- AC-5 — ⛔ Les deux flux ne se compensent **jamais** : ce qu'il nous doit ne réduit pas ce que ses
  clients lui doivent. Un test vérifie qu'aucune écriture ne relie les deux créances.
- AC-6 — ⛔ `aucune-facturation.spec.ts` est **verte** à la fin de la recette.

---

## Ordre de tirage — la moitié du plan a changé de place

```
        ┌─────────── E0 · LE SUBSTRAT (18 pts) ───────────┐
        │  643 ──► 644 ──┐                                │
        │       └──► 645 ─┴──► 646  (a besoin de C-268)   │
        └──────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
    Rail C (37 pts)              Rail D (40 pts)
        │                             │
        ├──► 272 ──► 286              ├──► 639 ──► 647 ──┐
        └──► 273 ──────────► 648 ◄────┘                  │
                                                          │
    279 ──► 609 ──┐                                       │
    610 ──────────┴──► 631 ──► 632 ──────────────────────► 649
```

**279, 609 et 610 partent dès maintenant, en parallèle de E0.** Elles ne dépendent d'aucun des deux
rails neufs, et 610 a besoin du même câblage que 644 — à poser dans la même passe.

---

## Identifiants — ce qu'il faut inscrire dans `sprint-status.yaml`

⛔ **Rien de ce document ne réserve quoi que ce soit tant que cette inscription n'est pas fusionnée
sur `main`.** C'est la règle du bloc `RESERVED_RANGES`, et c'est elle qui a coûté la collision du 630.

```yaml
story_id_high_water_mark: "STORY-649"

reserved_ranges:
  - range: "STORY-631 → STORY-649"
    status: "RÉSERVÉ"
    owner: "Rails C et D + convergence (paiement-service, notification-service, substrat de recette)"
    source_doc: "prospera-stories/CONVERGENCE-RAILS-C-D-2026-09-08.md"
    reserved_on: "2026-09-08"
    note: >
      631-632 recettes croisées (renumérotées depuis 630-631 : STORY-630 a été prise le
      2026-09-07 par l'outillage e2e de bilan-service, fusionné sur main).
      633-642 rail D (notification-service, 10 stories, 40 pts).
      643-646 substrat de recette — garde de câblage Nest dans 5 dépôts, câblage
      paiement->notification au compose, amorçage vers le bon port du catalogue et
      convention de disponibilité, espace de travail et profil de recette.
      647-648 pont consommation/facturation et reçus d'encaissement.
      649 recette croisée de la facturation.
      Le rail C ne consomme AUCUN identifiant : ses 10 stories (268-276, 285) existent
      depuis le découpage du 2026-08-03.
      STORY-287 RETIREE du périmètre : assistant-service n'existe pas (ni dépôt, ni compose).
```

| Plage | Pour quoi | Nouvelles fiches |
|---|---|---|
| 631 → 632 | Recettes croisées, renumérotées | 2 |
| 633 → 642 | Rail D — `notification-service` | 10 |
| 643 → 646 | **Substrat de recette** — à tirer avant les rails | 4 |
| 647 → 649 | Pont, reçus, recette de facturation | 3 |
| — | Rail C — `paiement-service` | **0** |

**Prochain identifiant libre après cette réservation : `STORY-650`.**

---

## Le compte

| Ensemble | Stories | Points |
|---|---|---|
| Convergence E0 — substrat, **avant les rails** | 4 | 18 |
| Rail C — `paiement-service` | 10 | 37 |
| Rail D — `notification-service` | 10 | 40 |
| Convergence E1 → E4 | 9 | 44 |
| **Total** | **33** | **139** |
