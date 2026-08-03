# Chaîne distributeur × PI-SPI — inventaire des stories et **règle de report**

**Date :** 2026-08-02 · **Décision :** les stories liées au distributeur sont **différées** jusqu'à ce
que les vraies données existent, côté backend **et** frontend.

---

## 1. Le constat qui commande tout

`prospera-distributeur` (25 écrans, Next 16) **n'a aucune couche de données** :

| Recherche dans `src/` | Occurrences |
|---|:--:|
| `fetch(` · `axios` · `apiClient` | **0** |
| `useQuery` (TanStack) | **0** |
| `NEXT_PUBLIC_*_URL` | **0** |
| Sources de données | `lib/generators/mock-seed.ts`, `generate-{pdv,commandes,factures,relances}.ts` |

**Ce n'est pas une application en attente d'intégration : c'est une maquette.** L'app cabinet possède
un client API, des types générés et un Integration Gate (`FE-INT-0`) ; le distributeur n'a aucun des
trois. La différence n'est pas de maturité, elle est de nature.

> ⚡ **Conséquence sur l'estimation :** brancher le distributeur n'est pas un « gate d'intégration »
> de 8 points. C'est **construire sa couche de données**, écran par écran, au fur et à mesure que les
> services qui la portent existent.

---

## 2. Convention de préfixe

`frontend-stories/README.md` fixe la règle : *« le préfixe porte l'application »*.

| Préfixe | Application | Dépôt | État |
|---|---|---|---|
| `FE-…` | app cliente cabinet | `prospera-frontend-expert-comptable` | 57 stories |
| `AP-…` | console interne Money Vibes | `frontend-admin-panel` | 16 stories *(AP-13→16 ajoutées)* |
| **`DI-…`** | **app distributeur** | `prospera-distributeur` | ✅ **validé 2026-08-02** |
| **`PY-…`** | **page publique de paiement** | ⚡ **servie par `paiement-service`** | ✅ **validé 2026-08-02** |

**Pourquoi `PY-` séparé de `DI-`.** La page qu'ouvre un détaillant (`STORY-153`) n'a ni compte, ni
session, ni rôle, ni design system commun. La loger dans `DI-` reviendrait à mettre une surface
publique dans une application authentifiée — le contraire de ce que `NFR-8` demande.

**Où elle vit — tranché :** ⚡ **`paiement-service` la sert lui-même** (décision PO). Conséquences à
porter dans les stories `PY-` :

| Conséquence | Détail |
|---|---|
| Pas de déploiement séparé | Un service, une surface publique et une API — l'URL du lien est celle du service |
| **Le service devient exposé publiquement** | Jusqu'ici tous les services sont derrière l'authentification. Celui-ci porte une route **sans jeton** : limitation de débit, anti-énumération et durcissement sont **obligatoires**, pas optionnels |
| Rendu côté serveur | La page doit s'ouvrir sur un téléphone modeste en réseau lent (`NFR-8`) — un rendu serveur léger sert mieux qu'une application cliente à charger |
| Pas de dépendance au design system | Il vit dans les dépôts frontend ; la page embarque son propre style minimal |

---

## 3. ⚡ Le chaînon manquant : d'où vient la créance ?

PI-SPI **encaisse** une créance ; il ne la crée pas. Le PRD est explicite : la créance projetée est
*« fournie par le module appelant »*, et l'appelant naturel est **Facturation (#17)**.

**Facturation n'existe pas, n'a pas de PRD, et est en position 17 sur 29.**

Sans elle, l'app distributeur n'a **rien à encaisser** — l'écran « déclarer un paiement en espèces »
porte sur un objet qui n'existe pas.

### Deux chemins, un recommandé

| | Chemin | Coût | Ce qu'il permet |
|---|---|---|---|
| **A** ✅ | **Créance saisie manuellement** dans le distributeur, en attendant Facturation | **~10 pts** *(1 story backend + 1 frontend)* | PI-SPI devient **démontrable et vendable** chez un distributeur sans attendre 15 modules |
| B | Attendre **Facturation (#17)** | ~4-6 sprints, après catalogue/stock/PDV/commande | Rien avant 2028 |

> ✅ **Chemin A retenu** (décision PO, 2026-08-02). Une créance saisie à la main n'est pas une dette
> technique — c'est la réalité de beaucoup de distributeurs aujourd'hui, qui facturent sur papier et
> suivent sur cahier. Le contrat de créance projetée (`FR-P13`) est déjà conçu pour cela : il n'exige
> rien de Facturation.

---

## 3-bis. ⚡ Ce qui doit marcher **avant** tout écran de paiement

Formulation du PO :

> *« Le but : je crée l'organisation sur l'AP avec un administrateur et son rôle selon les rôles du
> distributeur, et lui il vient, il configure tout pour gérer. **Alors que dans le cas présent c'est
> pas possible.** »*

C'est le parcours d'entrée du produit, et il faut nommer précisément où il casse aujourd'hui :

| Étape | Aujourd'hui | Ce qui manque |
|---|:--:|---|
| Money Vibes crée l'organisation dans la console | ✅ possible | — *(AP-02, chaîne KYC livrée)* |
| Money Vibes lui octroie ses modules | ✅ possible | — *(AP-05, entitlements)* |
| Money Vibes crée **son administrateur** | ✅ possible | — *(invitation, `STORY-008`)* |
| …avec **un rôle de distributeur** | ⛔ **impossible** | **Les rôles métier distributeur n'existent pas** au catalogue de permissions. `STORY-140` en a livré trois (Comptable, Marketing, DG) ; les quatorze personas distributeur n'y sont pas |
| L'administrateur **se connecte à son application** | ⛔ **impossible** | `prospera-distributeur` **n'a aucune authentification** — ni login, ni jeton, ni garde de rôle |
| Il **configure son organisation** (utilisateurs, rôles, moyens de paiement) | ⛔ **impossible** | Aucune couche de données, aucun écran de configuration |
| Il encaisse | ⛔ | Tout ce qui précède |

> **Le premier livrable du distributeur n'est donc pas un écran de paiement. C'est qu'un
> administrateur puisse exister, se connecter et configurer sa maison.** Tout le reste en découle.

---

## 3-ter. ⚡ L'application est **réécrite**, pas branchée — décision PO

> *« Il n'y a pas de vraie couche de données, donc l'app doit être réécrite, avec toutes les bonnes
> informations et les bonnes stories importantes en premier. »*

**Ce que ça veut dire concrètement :**

| | Ce qui est conservé | Ce qui est refait |
|---|---|---|
| **Le prototype** | ✅ **Référence d'expérience** — les 25 écrans montrent ce que le produit doit faire, et les registres commentés portent une vraie pensée métier *(les quatre cas de stock mort, les garde-fous de réappro, la double tarification)* | ❌ Le code : aucune couche de données, aucun appel réseau, données générées |
| **L'application** | — | ✅ **Reconstruite sur un socle de données**, écran par écran, chacun **gaté sur le service qui le porte** |

**Conséquence sur le découpage :** un écran du prototype ne devient une story `DI-` **que lorsque son
service existe**. Les 25 écrans ne sont pas un périmètre — ce sont **25 candidats**, dont seuls
quelques-uns sont ouvrables aujourd'hui.

> ⚡ **La règle qui en découle** — et c'est elle qui rend la réécriture tenable : *on ne réécrit pas
> l'application, on réécrit **un écran à la fois, quand sa donnée existe**.* Une réécriture globale
> reproduirait la maquette avec un autre outillage, et rien de plus.

---

## 4. Inventaire complet des stories

### Vague 0 — « L'organisation existe et son administrateur peut travailler » · **à écrire maintenant**

C'est le parcours du §3-bis, rendu possible. **Rien de tout cela ne dépend d'un module non construit.**

| # | Story | Type | Pts | Objet |
|:--:|---|---|:--:|---|
| 1 | `STORY-166` | back | **8** | ⚡ **Rôles métier distributeur** au catalogue de permissions — étend `STORY-140`. Sans elle, l'administrateur créé dans la console n'a **aucun rôle** à recevoir. *(5 → 8 le 2026-08-03 : décision Q5, les 14 personas)* |
| 2 | `STORY-169` | back | 5 | **Créance saisie manuellement** — le chaînon manquant (§3, chemin A). ⚠️ **Déplacée au bloc distributeur différé** — voir §5-bis |
| 3 | `DI-01` | front | 8 | ⚡ **Socle : l'administrateur se connecte.** Authentification via l'IdP, jeton, garde de rôle, client API, types générés, mise en page. **La première chose qui n'existe pas du tout aujourd'hui** |
| 4 | `DI-02` | front | 8 | ⚡ **Il configure sa maison.** Profil de l'organisation (pays, devise, identité), **création de ses utilisateurs et attribution de leurs rôles** — le parcours que le PO décrit comme impossible aujourd'hui |
| 5 | `DI-INT-0` | front | 8 | **Integration Gate** — zéro fixture sur le périmètre livré, types générés du vrai backend |

À l'issue : *Money Vibes crée l'organisation et son administrateur → celui-ci se connecte → il crée
son équipe et distribue les rôles.* Le produit devient **démontrable** avant même d'encaisser quoi que
ce soit.

> ⚠️ **Ce tableau est l'inventaire initial, pas le périmètre retenu.** Le socle effectivement slotté
> est celui du **§5-bis** (45 pts : `166`, `167`, `DI-01`, `DI-02`, `AP-17`, `DI-INT-0`) — `STORY-169`
> en est sortie vers le bloc distributeur différé.

### Vague 1 — PI-SPI côté distributeur · **différée** jusqu'à `STORY-150→165` **et** vague 0

| # | Story | Pts | Backend requis |
|:--:|---|:--:|---|
| 6 | `DI-03` — **Configuration des moyens de paiement** *(compte d'encaissement, politique de frais)* | 5 | STORY-151, 152 |
| 7 | `DI-04` — Créances : saisie et liste | 5 | STORY-169 |
| 8 | `DI-05` — Émettre une demande + lien + **QR en tournée** | 5 | STORY-153 |
| 9 | `DI-06` — **Déclarer un paiement en espèces** *(mobile, terrain)* | 8 | STORY-156 |
| 10 | `DI-07` — **Valider par la remise du soir** | 5 | STORY-156 |
| 11 | `DI-08` — Solde **certain vs déclaré** + promesses | 5 | STORY-155, 159 |
| 12 | `DI-09` — Réconciliation : relevé, écarts | 5 | STORY-157 |
| 13 | `DI-10` — Annulation constatée | 3 | STORY-158 |

**41 points.** Toutes différées, aucune bloquée par un module absent **une fois la vague 0 faite**.

> **Les cockpits par persona ne sont pas ici.** Un cockpit agrège des données de modules non
> construits (stock, commandes, tournées) : le proposer avant eux reproduirait la maquette. Chaque
> persona reçoit d'abord **les écrans de son métier**, le cockpit vient quand il a de quoi agréger.

### Vague 1-bis — La page publique · **différée** jusqu'à `STORY-153/154`

⚡ **Servies par `paiement-service` lui-même** (décision PO) — pas de dépôt ni de déploiement séparé.

| # | Story | Pts | Note |
|:--:|---|:--:|---|
| 14 | `PY-00` — **Exposition publique durcie** : route sans jeton, limitation de débit, anti-énumération, rendu serveur léger | 5 | ⚡ **Nouvelle.** C'est le premier service exposé sans authentification : le durcissement est une story, pas une option |
| 15 | `PY-01` — Page de paiement : montant, **frais avant le choix**, méthodes réelles | 8 | `NFR-8` — téléphone modeste, réseau lent |
| 16 | `PY-02` — Paiement partiel + **promesse de compléter** | 5 | ⚡ État **non ambigu** sur coupure réseau |
| 17 | `PY-03` — Expiration, QR, nouveau lien | 3 | — |

**21 points.** ⚠️ Vérification en **navigateur réel hors réseau Docker** obligatoire (piège `STORY-011`).

### Vague 2 — Les vraies données · **différée**, PRD faits, stories à écrire

| Module | PRD | Pts back | Front `DI-` |
|---|:--:|:--:|:--:|
| **PDV & portefeuille** (#2) | ✅ | ~81 | ~30 |
| **Catalogue produits** (#3) | ✅ | ~89 | ~25 |
| **Réseau & zones** (#4) | ✅ | ~76 | ~20 |
| **Stock** (#7) | ✅ | ~97 | ~30 |

**~343 pts backend + ~105 front.** Les quatre PRD existent ; **aucune story n'est écrite**.

### Vague 3 — Ce qui n'a même pas de PRD

| Module | Pourquoi il compte ici |
|---|---|
| **Commande (#11)** | Sans elle, `réservé = 0` dans le Stock (`FR-S08c`) |
| **Facturation (#17)** | Le vrai producteur de créances — remplace le chemin A du §3 |
| **Relance (#24)** | Consommateur des promesses et des soldes |

---

## 5. La règle de report, en une phrase

> **Une story `DI-` n'est ouverte que lorsque le service qui porte ses données est livré — jamais sur
> une fixture.**

C'est la règle que le programme s'est déjà donnée pour l'app cabinet (*Integration Gate en fin
d'epic : brancher le vrai backend, remplacer les contrats supposés, zéro mock*) et qu'il a payée pour
ne pas l'avoir tenue : `FE-008/009/010` livrées en miroir de contrats supposés, `FE-023` découvrant
au gate qu'une URL présignée était invisible du navigateur.

**Le distributeur part de plus loin** : il n'a pas de contrat supposé, il n'a pas de contrat du tout.

---

## 5-bis. ⚡ Inversion de priorité — décision PO du 2026-08-02

> *« Mets tout en place, le socle avec les stories backend et frontend, **avant** maintenant de tomber
> sur le PI-SPI lui-même. Et même cela, le PI-SPI lié au distributeur n'est pas évident parce qu'il
> est lié aux stocks et tout — donc **le créer mais en bloqué**. Le PI-SPI important actuellement doit
> être celui lié à l'admin panel : la configuration manuelle, les fournisseurs de paiement, leur
> configuration, les logs de paiement, les abonnements. »*

**L'ordre devient :**

| Rang | Bloc | État |
|:--:|---|---|
| **1** | **Socle** — rôles, authentification, configuration de l'organisation | ✅ **stories écrites** |
| **2** | **PI-SPI console** — fournisseurs, comptes, logs, abonnements, impayés | ✅ **stories écrites** |
| **3** | **PI-SPI distributeur** — créance, lien, espèces, remise, réconciliation | ⛔ **créées et bloquées** |
| **4** | **Page publique** de paiement | ⛔ **bloquée** |
| **5** | Les vraies données — PDV, Catalogue, Réseau, Stock | ⏸ différé |

### Stories du socle — **écrites**

| Story | Type | Pts | Objet |
|---|---|:--:|---|
| `STORY-171` | back | **5** | ⚡ **Le vertical porté par l'organisation** — *créée le 2026-08-03 en appliquant Q5*. `grep -i vertical` sur tout `auth-service@origin/dev` : **zéro occurrence** ; `organization.schema.ts` n'a ni vertical ni type de client. Le mot traverse un an de décisions sans exister comme donnée. **À livrer AVANT `STORY-166`** — son AC 10 et `AP-17` §1 n'ont rien à lire sans elle |
| `STORY-166` | back | **8** | Rôles métier distributeur — ⚡ **les 14 personas + `DIST_ADMIN`**, avec attribut de couverture, extensibles sans migration *(5 → 8 le 2026-08-03, décision Q5)* |
| `STORY-167` | back | 8 | **Rôles personnalisés** par organisation + lecture console |
| `DI-01` | front | 8 | Socle app : authentification, routage **direct-par-service** *(Q7)*, types générés |
| `DI-02` | front | 8 | **Configuration de l'organisation** : profil, membres, rôles, `RoleBuilder` |
| `AP-17` | front | 5 | Console : attribuer un rôle système *(avec sa couverture)*, voir les rôles personnalisés |
| `DI-INT-0` | front | 8 | Integration Gate — zéro fixture, parcours d'entrée en navigateur réel |

**50 points** *(42 + 3 pour la décision Q5 sur `STORY-166`, + 5 pour `STORY-171` découverte en l'appliquant)*.

> ⚡ **Ce que la découverte de `STORY-171` dit du reste du plan.** Elle n'est pas sortie d'une revue :
> elle est sortie de l'écriture d'**un seul critère d'acceptation** (`STORY-166` AC 10), vérifié dans
> le code au lieu d'être supposé. Le dépôt a documenté **trois fois** le même motif — une délégation
> nominative jamais retombée (`GAP-balance-validation-etat`, `GAP-compte-non-valide-par-referentiel`,
> `GAP-bff-admin-sans-consommateur`). C'est la quatrième, et la première trouvée **avant** d'être
> payée. Les stories `DI-` et `PY-` en portent d'autres, encore non vérifiées : elles seront ouvertes
> une par une, et chaque « le backend fournit X » devra être ouvert dans le code avant d'être cru.

### Stories PI-SPI console — **écrites**

| Story | Type | Pts | Objet |
|---|---|:--:|---|
| `STORY-168` | back | 5 | **Registre plateforme des fournisseurs** — activer un pays sans déploiement |
| `AP-18` | front | 5 | Fournisseurs : déclaration, configuration, matrice d'activation, suspension |
| `AP-13` | front | 5 | Comptes d'encaissement *(déjà écrite)* |
| `AP-14` | front | 5 | **Logs de paiement** : demandes, rejets, écarts, réacheminement *(déjà écrite)* |
| `AP-15` | front | 5 | Abonnements *(déjà écrite)* |
| `AP-16` | front | 5 | Impayés, grâce, rétablissement *(déjà écrite)* |

**30 points** — plus les 94 de `STORY-150→165`, dont les incréments 1 et 3 servent directement la console.

### Stories PI-SPI distributeur — **⛔ bloquées**

`DI-03` → `DI-10` et `PY-00` → `PY-03` : **à créer en état `blocked`**, avec leur bloqueur nommé.

| Bloqueur | Stories concernées |
|---|---|
| `STORY-169` *(créance manuelle)* non livrée | `DI-04` |
| Backend PI-SPI `STORY-150→165` non livré | `DI-03` → `DI-10` |
| `STORY-153/154` non livrées | `PY-00` → `PY-03` |
| **Modules Stock, Catalogue, PDV absents** | Tout écran distributeur qui agrège *(cockpits, tableaux de bord)* |

> ⚡ **Pourquoi les créer quand même :** le dépôt a documenté qu'une story rédigée et non slottée
> **disparaît** — huit orphelines relevées le 2026-07-31, dont trois doublons. La règle retenue est
> qu'une story est *« slottée **ou** explicitement marquée `deferred`, jamais laissée sans sprint »*.
> Bloquée et visible vaut mieux qu'oubliée.

---

## 6. L'ordre de marche

| Étape | Contenu | Pts | Ce qu'on peut montrer à la fin |
|:--:|---|:--:|---|
| **1** | **Vague 0** — rôles, socle, configuration *(périmètre §5-bis)* | **45** | *« Je crée un distributeur, son administrateur se connecte et constitue son équipe **avec les 14 rôles de sa maison**. »* |
| **2** | **PI-SPI backend** `STORY-150→165` | 94 | *(déjà écrites)* |
| **3** | **Vague 1** — encaissement côté distributeur | 41 | *« Il saisit une créance, émet un lien, encaisse, déclare des espèces, valide par la remise, réconcilie. »* |
| **4** | **Vague 1-bis** — la page publique | 21 | *« Son détaillant paie depuis son téléphone. »* |
| **5** | **Vague 2** — les vraies données, module par module | ~448 | Le produit complet |

**107 points pour les étapes 1, 3 et 4** *(45 + 41 + 21)* — le plus petit chemin vers un produit qui
**se configure et encaisse**, sans catalogue, sans stock, sans PDV. Avec le backend PI-SPI de l'étape 2
*(94 pts)*, **201 points** en tout.

> ⚡ **Ce qui rend cet ordre défendable :** chaque étape produit une démonstration complète, pas une
> demi-boucle. C'est le principe que le programme s'est déjà donné pour la console et le cabinet
> (*« l'admin octroie, le client s'allume ; découper par app produit des demi-boucles
> indémontrables »*).

---

## 7. Décisions prises et ce qui reste

### ✅ Tranché le 2026-08-02

| # | Question | Décision |
|:--:|---|---|
| 1 | La créance en attendant Facturation | **Chemin A** — saisie manuelle |
| 2 | Préfixes | **`DI-`** et **`PY-`** validés |
| 3 | Où vit la page publique | ⚡ **Servie par `paiement-service`** — d'où la nouvelle story `PY-00` (durcissement de l'exposition publique) |
| 4 | Prototype repris ou app réécrite | ⚡ **Réécrite**, avec la règle du §3-ter : **un écran à la fois, quand sa donnée existe** |

### ✅ Tranché le 2026-08-03 — **plus rien d'ouvert**

| # | Question | Décision | Effet |
|:--:|---|---|---|
| 5 | Quels rôles distributeur au v1 ? | ⚡ **Les 14 personas** du catalogue commercial — pas le sous-ensemble encaissement | `STORY-166` **réécrite** : 14 personas + `DIST_ADMIN` = **15 rôles**, **5 → 8 pts**. Huit n'ont aucun écran ⇒ **attribut de couverture** (`servi` / `partiel` / `en_attente_de_module`) porté par la donnée, affiché avant l'attribution (`AP-17`) et expliqué après la connexion (`DI-01`) |
| 6 | La portée d'accès par zone est-elle nécessaire au v1 ? | **Reportée** — elle viendra avec `Réseau & zones` (#4) | ⚠️ Conséquence assumée : `DIST_SUPERVISEUR` et `DIST_DC` voient **toute** l'organisation. Tenable pour un premier distributeur mono-zone, **à rouvrir avant le premier multi-zones** |
| 7 | Direct-par-service, ou BFF ? | ⚡ **Direct-par-service**, comme l'app cabinet | ⚠️ Chaque service appelé doit **activer CORS** pour l'origine du distributeur. `STORY-109` a dû le faire en urgence sur cinq services livrés sans, et **le blocage n'apparaît qu'en navigateur réel** — jamais en `curl`. `DI-01` et `DI-INT-0` le portent |

> ⚡ **Ce que la décision Q5 change vraiment.** Livrer six rôles aurait obligé le distributeur à ranger
> son responsable de stock sous un rôle qui n'est pas le sien, puis à l'en sortir plus tard — une
> migration de données pour une décision qu'on pouvait prendre tout de suite. Le prix à payer est
> que huit rôles ne servent encore rien : **on le paie en le disant**, pas en les cachant.
