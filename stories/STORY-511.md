# STORY-511 : Socle `assurance-service` — et l'amorce est publiée comme telle, partout

Status: done

**Complexité :** high
**Épic :** EPIC-128 — Socle vertical CIMA
**Service :** `assurance-service` (nouveau)
**Points :** 13 · **Sprint :** S20
**Prérequis :** **STORY-488** (CIMA entre au contrat canonique de balance) · **STORY-533** (N référentiels
par organisation) · **STORY-422** (le plan suit le dossier) · **STORY-489** (le contrat porte sa devise)
**Assigné :** `vivianMoneyVibesGroupes`
**Origine :** découpage `epics-assurance-2026-08-27.md`, spine AD-6/AD-7/AD-8/AD-10.

---

## Le fait

`cima-assurances@1.0` est packagé et fonctionne : 80 comptes de l'article 431 (2 chiffres, libellés
verbatim), 25 postes, 25 mappings, 4 agrégats en `FORMULE` (`CAT`, `CPT`, `RT`, `RN`).

Et il est une **amorce**, ce que son auteur a écrit **dans l'artefact lui-même** — vérifié le
2026-09-19 :

> `_meta.statut` : **`amorce`**
> `_meta.miseEnGarde` : « *Structure de liasse et plan de comptes proposés depuis le référentiel CIMA ;
> provisions techniques, résultat technique vie/non-vie et états C1..C25 NON couverts. À VALIDER par un
> actuaire avant tout usage réglementaire.* »
> Poste `RT` : « *Résultat technique (amorce — hors variations de provisions techniques et séparation
> Vie/Non-Vie* »

⛔ **C'est le point le plus important de tout ce vertical : un résultat technique faux publié SANS
son statut serait le pire livrable du programme.** Un assureur lit « résultat technique » et agit.

## Cadrage mesuré avant de coder (2026-09-19)

| Mesure | État constaté | Conséquence pour STORY-511 |
|---|---|---|
| Le service | N'existe pas : aucun dossier, aucun dépôt dans l'organisation | Dépôt `prospera-assurance-service` créé (accord user du 2026-09-19) |
| Le moule | `microfinance-service` est le socle le plus récent (STORY-497) : **125 fichiers, 20 576 lignes** pour la seule amorce | On **copie le moule**, on ne le réinvente pas — « aucun écart au moule » est un critère, pas une intention |
| Le socle, précisément | 180 fichiers TS hors modules métier (116 sources, 64 specs) : `common/`, `config/`, `database/`, `health/`, `kafka/` + outbox, `modules/auth`, `read-models`, `diagnostics`, `referentiel` | C'est le périmètre exact à reprendre |
| Ports pris | 3000-3004, 3006, 3007, 3009-3012 | `assurance-service` prend **3013** |
| L'artefact CIMA | `statut: amorce`, `miseEnGarde` explicite, `RT` qui se déclare amorce **dans son libellé** | L'AC-4 a déjà sa matière : rien à inventer, tout à **faire traverser** |
| Prérequis | STORY-488, 533, 422, 489 : **toutes `done`** | AC-3 est déverrouillé — l'axe CIMA existe au contrat de balance |
| Devise | `_meta` de l'artefact ne déclare aucune devise ; la zone CIMA couvre 14 États dont des pays hors franc CFA | AC-5 : **aucune constante `XOF`**, la devise vient du contrat (STORY-489) |

## Décisions de cadrage du 2026-09-19 — à relire en revue

- **D-511-A — le moule est copié, pas réinventé.** Le socle reprend `microfinance-service` fichier par
  fichier : chaîne de guards, `TenantScopedRepository`, config validée au boot, outbox transactionnel,
  démarrage dégradé, filtre d'erreurs et canal `details`, horloge injectable. Un écart au moule est un
  constat de revue, pas une liberté.
- **D-511-B — identité du service.** Port **3013**, base **`assurance_service`**, gate
  **`@RequiresAssuranceAccess`**, entitlement **`assurance`**, référentiel **`cima-assurances`**,
  `typeEntite` **`ASSURANCE`** au read-model dossier.
- **D-511-C — ⛔ le statut d'amorce voyage avec la donnée, pas à côté.** Toute réponse qui sert le
  référentiel porte son `statut` et sa `miseEnGarde` **dans son enveloppe**, jamais seulement dans
  l'artefact. Un test vérifie qu'**aucune route** ne rend le poste `RT` sans son statut. ⚡ Le statut
  n'est pas un ornement : il est la différence entre une proposition et une norme.
- **D-511-D — aucune constante `XOF`, nulle part.** Ni dans le code, ni dans un DTO, ni dans une
  fixture de test qui la rendrait invisible. La zone CIMA couvre 14 États ; naître mono-devise deux mois
  après avoir payé pour en sortir serait la même faute que celle qu'AD-11 a évitée au SFD.
- **D-511-E — aucun calcul actuariel, et aucun agrégat qui en tiendrait lieu** (AD-12). Le socle
  **héberge** ; il ne produit ni provision technique, ni résultat technique, ni cadence de règlement.
  Aucune collection de provisions n'est créée, même vide : un schéma présent appelle une écriture.
- **D-511-F — tout agrégat appartient à un dossier** (AD-6/AD-7). Hors portée ⇒ **`404`, jamais `403`**
  (un `403` révèle l'existence). La garde d'exercice clos interroge **`exercices_dossier`**, jamais
  `exercices_atelier` — c'est le piège de STORY-374, et `estClos` rendant `false` sur un exercice
  introuvable, s'y tromper laisse la garde **ouverte en permanence**.
- **D-511-G — le référentiel résolu est celui du DOSSIER** (AD-8), jamais celui de l'organisation : un
  cabinet tient une compagnie d'assurance **et** des SARL (STORY-533). Une valeur de `typeEntite`
  inconnue est **refusée** avec un code qui la nomme, jamais repliée sur un défaut.
- **D-511-H — la classe 8 ne se lit jamais par racine** (AD-9). Le socle n'en lit aucune, mais le
  commentaire qui l'interdit est posé là où la lecture se fera : la classe 8 CIMA mêle comptes de
  **gestion** et comptes de **regroupement**, et le repli générique du moteur fiscal y a déjà **doublé
  exactement** la base imposable sans qu'aucun contrôle ne s'en aperçoive.
- **D-511-J — le socle ne sert AUCUN poste de liasse.** Le contrat rend l'**identité** et la **maturité**
  du référentiel — code, version, checksum, statut, mise en garde, source, pays, devise de présentation —
  et rien d'autre. Les postes (`CAT`, `CPT`, `RT`, `RN`) font la **liasse**, que `bilan-service` produit :
  les recopier ici créerait une **seconde source** pour la même chose, et c'est exactement ainsi qu'un `RT`
  finirait publié sans son statut par la route qui l'aurait recopié. Un e2e balaye les routes **découvertes
  sur l'application montée** — pas une liste écrite à la main — et vérifie qu'aucune ne porte de poste.
- **D-511-K — aucun niveau de détail de compte n'est déclaré.** Les 80 comptes de l'article 431 sont tous
  à **deux chiffres**, mais c'est ce que le texte **énumère**, pas une longueur qu'il **fixerait**. Déclarer
  `2` trancherait la question que **STORY-512** pose explicitement, et refuserait le compte `3012` d'un
  assureur qui subdivise, au nom d'une exigence que personne n'a écrite. `undefined` = aucune exigence, le
  rattachement reste **par préfixe**. ⚠️ Le vertical SFD a payé cette question **deux fois** (STORY-172,
  STORY-368) pour l'avoir devinée.
- **D-511-I — le socle ne publie aucune balance.** AD-5 la promet au vertical ; elle suppose des
  quittances et des sinistres, qui n'existent pas encore. Hook inerte documenté.

## Périmètre

### Livré

- Le dépôt `prospera-assurance-service` et le service au moule commun : NestJS 11, `main.ts` (Helmet,
  préfixe `api` + versionnement URI v1, pino, Swagger `/api/docs`), config validée au boot, Mongo,
  health, Kafka + outbox transactionnel, Redis, Dockerfile multi-stage, entrée au compose racine.
- La chaîne de guards complète et le gate `@RequiresAssuranceAccess` — e-mail → KYC → entitlement →
  référentiel habilité, **dans cet ordre**.
- Les read-models locaux : dossier, exercice du dossier, statut KYC, entitlement, `processed_events`.
- La portée dossier (`@RequiresDossierScope`) et la garde d'exercice clos.
- La résolution du référentiel **du dossier** et son artefact `cima-assurances@1.0` packagé.
- ⛔ La publication du **statut d'amorce** dans toute réponse qui sert le référentiel.
- Le diagnostic `whoami` et la route `/health`.

### Hors périmètre

- **Contrats, quittances, primes** (STORY-513) · **sinistres** (EPIC-130) · **provisions techniques**
  (EPIC-131) · **réassurance** (EPIC-132) · **résultat technique Vie/Non-Vie** (EPIC-133) · **états
  art. 433 et marge de solvabilité** (EPIC-134).
- Toute **publication de balance canonique** (AD-5) — hook inerte.
- Tout **calcul actuariel**, toute **méthode d'évaluation** (AD-12).
- Le **niveau de détail du plan CIMA** (STORY-512) : l'artefact s'arrête à 2 chiffres, et c'est
  exactement ce que l'article 431 énumère.
- **IFRS 17** : hors zone CIMA, sans rapport avec ce plan.
- Le **front** : l'« à l'écran » de l'AC-4 d'origine relève d'une story frontend ; ici, le statut est
  publié **au contrat**, ce qui est la condition pour qu'un écran puisse le montrer.

## Critères d'acceptation

- [x] **AC-1 — Scaffold sur le moule commun.** NestJS, config validée au boot, Swagger, health, docker,
      outbox, gate `@RequiresAssuranceAccess` dans l'ordre e-mail → KYC → entitlement, habilitation
      exigeant `cima-assurances` (STORY-533 AC-3). Aucun écart au moule.
- [x] **AC-2 — Dossier et exercice du dossier** (AD-6/AD-7). Hors portée ⇒ **`404`, jamais `403`**.
      La garde d'exercice clos interroge `exercices_dossier`, **pas** `exercices_atelier`.
- [x] **AC-3 — Le référentiel résolu est celui du dossier** (AD-8), avec son `code@version` et son
      checksum vérifié. Une valeur de `typeEntite` inconnue est refusée par un code qui la nomme.
- [x] **AC-4 — ⛔ Le statut d'amorce est publié partout où le référentiel est servi** : au contrat et
      dans l'enveloppe de réponse. Un test vérifie qu'**aucune route** ne rend un poste `RT` sans son
      statut ni sa mise en garde.
- [x] **AC-5 — ⚠️ Aucune constante `XOF`** dans le code, les DTO ou les fixtures. La devise vient du
      contrat canonique (STORY-489).
- [x] **AC-6 — ⛔ Aucun calcul actuariel n'est écrit dans cette story** (AD-12) : le socle héberge, il
      ne produit pas. Aucun agrégat de provision, même vide.
- [x] **AC-7 — Le service démarre en mode dégradé.** Kafka absent au boot ⇒ HTTP up et
      `/health` `kafka: down` ; une erreur de connexion Kafka ne tue jamais le process.

## Table de mutations obligatoire

13 mutations **réellement appliquées**, chacune prouvée rouge puis restaurée. ⚠️ **Deux ont produit des
constats réels** et une troisième a d'abord été mal formulée de ma part — le détail est dans le
*Progress Tracking*.

| ID | Mutation appliquée | Ce qui vire au rouge |
|---|---|---|
| M1 | Retirer `AssuranceAccessGuard` de la chaîne d'`AppModule` | **15 e2e sur 15** — ⚠️ et la suite **PENDAIT** au lieu d'échouer (voir suivi) |
| M2 | Palier 1 du gate : rendre `KYC_NOT_APPROVED` au lieu d'`EMAIL_NOT_VERIFIED` | 2 tests de la spec du gate — ⚠️ **survit en e2e**, et c'est instructif (voir suivi) |
| M3 | Répondre 403 au lieu de 404 hors portée de dossier | 2 e2e : l'anti-énumération |
| M4 | Collection `exercices_atelier` au lieu d'`exercices_dossier` | 1 test des read-models |
| M5 | Résoudre le référentiel depuis une constante au lieu du `typeEntite` du dossier | 4 tests du service |
| M6 | Replier tout `typeEntite` sur le référentiel servi | 19 tests du module référentiel |
| M7 | Forcer `statut: 'certifie'` dans l'enveloppe | 2 tests — **AC-4** |
| M8 | Retirer la `miseEnGarde` de l'enveloppe | 1 test — **AC-4** |
| M9 | Faire fuiter un poste `RT` dans la réponse | 1 e2e — **AC-4**, le test le plus important |
| M10 | Substituer `XOF` à une devise de présentation absente | 1 test — **AC-5** |
| M11 | Inverser la comparaison de checksum du chargeur | 17 tests + la suite du chargeur ne démarre plus (le loader rejette tout artefact valide : « attendu X, obtenu X ») |
| M12 | Rendre fatale l'indisponibilité de Kafka au boot | 2 tests — **AC-7**, démarrage dégradé |
| M13 | Rendre `MONGODB_URI` optionnelle au validateur d'env | 1 test de config |

⚠️ **Trois mutations écartées parce qu'elles ne mesuraient rien** : `MONGODB_URI!` → `MONGODB_URI?` (le `?`
de TypeScript est **compile-time seulement** — class-validator continue d'exiger la variable, donc la
mutation était inerte, pas le test insuffisant) ; et deux formulations qui ne compilaient pas (un `logger`
devenu inutilisé, une condition toujours fausse). Reformulées en M13, M11 et M12.

## Definition of Done

- [x] Statut synchronisé dans ce document, `sprint-status.yaml` et le présent Progress Tracking.
- [x] Dépôt `prospera-assurance-service` créé, `main` et `dev` poussés, branche `MNV-511`.
- [x] Lint 0 warning, build, couverture ≥ 65/90/90/90, unit + e2e verts ; chaque fichier neuf couvert.
- [x] M1 à M13 appliquées une par une, prouvées rouges, puis restaurées.
- [x] Vérification docker : le service démarre dans la stack, `/health` répond, l'artefact est chargé
      et son checksum vérifié, et le **démarrage dégradé** est éprouvé Kafka arrêté.
- [x] Revue de code et revue de sécurité sans constat ouvert.
- [x] Entrée au `docker-compose.yml` racine (⚠️ non versionné), à l'`override` dev et au `.env.example`.
- [x] ⛔ `assurance-service` ajouté à l'**`AUTH_AUDIENCE` de l'IdP** au compose racine — sans quoi tout
      jeton légitime est rejeté en 401 et le service est livré inerte. Prouvé par un appel authentifié réel.
- [x] Revues passées, PR module vers `dev`, PR docs vers `main`, rebase-merge, branches supprimées.

## Progress Tracking

- **Statut courant :** `done` — ouverte le 2026-09-19, clôturée le **2026-09-20**.
- **2026-09-19 — cadrage mesuré :** branche `MNV-511` sur `docs`. Prérequis vérifiés `done`
  (488, 533, 422, 489). Artefact `cima-assurances@1.0` relu : `statut: amorce`, `miseEnGarde` explicite,
  `RT` qui se déclare amorce dans son propre libellé — l'AC-4 a sa matière, il s'agit de la faire
  traverser. Socle de `microfinance-service` mesuré : 180 fichiers TS hors métier, à reprendre sans
  écart. Port 3013 retenu (3000-3004, 3006, 3007, 3009-3012 pris).

## Notes

- Voir la spine `architecture/architecture-assurance-service-2026-08-27/ARCHITECTURE-SPINE.md`
  (AD-5, AD-6, AD-7, AD-8, AD-9, AD-10, AD-12), [[STORY-497]] (le socle jumeau, côté SFD),
  [[STORY-488]], [[STORY-533]], [[STORY-512]] (le niveau de détail du plan), [[STORY-513]].
