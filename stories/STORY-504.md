# STORY-504 : Provisionnement réglementaire par tranche — calculé, proposé, jamais appliqué d'office

Status: in-progress

**Complexité :** high

**Épic :** EPIC-124 — Classement et provisionnement réglementaire
**Service :** `microfinance-service`
**Points :** 13 · **Sprint :** S20
**Prérequis :** **STORY-503** (le classement dérivé)
**Origine :** découpage `epics-microfinance-2026-08-27.md`, **AD-4** de la spine — Q1 tranchée.

---

## ⚡ Le cœur du vertical

C'est ce qu'une IMF cherche dans les cinq premières minutes, et c'est le **seul endroit du programme
où l'absence est un risque réglementaire pour le client, pas un inconfort** : une IMF
sous-provisionnée est **en infraction**, pas en retard.

## Pourquoi « proposé » et non « appliqué »

Une dotation aux provisions est **une écriture**. La passer sans décision humaine ferait signer à
l'outil ce que la direction et le conseil arrêtent. C'est exactement la doctrine déjà appliquée à
l'**affectation du résultat** dans la reprise d'à-nouveaux — *« rien n'est proposé par défaut »* —
et à la **provision pour perte de change** (STORY-495 AC-4).

## Cadrage mesuré avant de coder (2026-09-14)

| Affirmation | Verdict | Mesure |
|---|---|---|
| Les taux de provision par tranche existent | **FAUX** | `prudentiel-sfd-bceao@1.0` : aucune tranche, aucun taux (D-498-A) ; le classement rend `NON_CLASSABLE` (STORY-503) |
| Les garanties admises en déduction sont déclarées par le paquet | **FAUX** | le type `PaquetPrudentielPackage` n'a **aucune rubrique** de garanties admises |
| L'assiette (capital restant dû) est dérivée | **VRAI** | STORY-502 : encours = capital restant dû de la version en vigueur, à toute date |
| Une « version de balance » existe pour empiler la dotation | **FAUX** | la publication en balance est STORY-507, sans code |

### Décisions du 2026-09-14 (user)

- **D-504-A — MÉCANIQUE SEULE** : assiette, taux, provision requise, **dotation en complément** et reprise, chaque
  montant avec sa formule ; paquet servi vide ⇒ `409 PAQUET_PRUDENTIEL_SANS_VALEUR`, **aucune provision proposée sur une
  valeur inventée** ; tout est prouvé par un paquet de test fictif. La rubrique « garanties admises » est ajoutée au
  paquet, **vide**.
- **D-504-B — l'acte explicite d'application écrit un ARRÊTÉ DE PROVISION** append-only (`arretes_provision`), daté,
  attribué, avec formules et checksum du paquet ; dry-run par défaut ; la provision déjà constatée est celle du dernier
  arrêté appliqué ; un contenu identique n'écrit rien. La version de balance est un emplacement inerte (STORY-507).

### Hors périmètre, déclaré

Valeurs BCEAO réelles · écriture comptable et publication en balance (STORY-507) · reprise liée au rééchelonnement
(STORY-505).

## Critères d'acceptation

- [ ] AC-1 — Pour une date d'arrêté : par crédit et par tranche, l'**assiette** (capital restant dû,
      éventuellement diminué des garanties admises), le **taux** du paquet, la **dotation** et la
      **reprise** par rapport à la provision déjà constatée.
- [ ] AC-2 — ⚡ **La dotation est un COMPLÉMENT, jamais un brut.** Une provision déjà constatée se
      déduit. C'est exactement l'erreur que le moteur fiscal a évitée sur le compte 891 (« écrire
      1 402 650 en brut aurait doublé la charge, et aucun contrôle d'équilibre ne s'en serait
      aperçu »). Ici le montant est bien plus gros.
- [ ] AC-3 — **Chaque montant porte sa formule** : assiette × taux, avec la tranche et sa borne. Un
      montant sans sa formule est un chiffre qu'il faut croire — même exigence que les écritures
      d'impôt.
- [ ] AC-4 — ⛔ **Dry-run par défaut.** L'écriture demande un acte explicite, et elle **empile une
      version** de balance : on n'écrase jamais, on ajoute. Même patron que « provisions à la
      balance » du moteur fiscal.
- [ ] AC-5 — Les **garanties admises en déduction** sont déclarées par le paquet prudentiel, jamais
      supposées. ⚠️ Déduire une garantie non admise **sous-provisionne** — c'est-à-dire produit
      exactement l'infraction que la story sert à éviter.
- [ ] AC-6 — Réappliquer un contenu identique **n'écrit rien** : l'opération se répète sans dégât.

## Progress Tracking

**Statut : `in-progress` (2026-09-14).** Branches `MNV-504` ouvertes sur `docs` (base `main`) et
`microfinance-service` (worktree empilé sur la 503, rebasé sur `dev` après son merge). Décisions D-504-A et B ci-dessus.
PR `microfinance-service` **#8** (un commit `a84951c`, rebasé sur `dev`).

### Développement — livré (sous-agent `opus`, rapport à vérifier en revue)

- `GET …/provisionnement?dateArrete=` (dry-run) : par crédit, assiette, taux, provision requise, dotation ou reprise,
  formule ; sous-totaux par tranche ; crédits non provisionnés comptés par statut ; empreinte de la proposition.
- `POST …/arretes-provision` `{ dateArrete, empreinte }` : l'acte explicite écrit un arrêté dans `arretes_provision`
  (201) ou répond `dejaApplique` (200) pour un contenu identique.
- Paquet prudentiel : rubrique `provisionnement.garantiesAdmises: []` ajoutée **vide** (schéma, validateur, chargeur,
  types) ; checksum `a4d29eb5…` → `b4b79e8a…` ; `sfd-bceao-2.0` inchangé.

### Décisions prises pendant le dev (2026-09-14)

- **D-504-C** — paquet servi sans tranche ⇒ `409 PAQUET_PRUDENTIEL_SANS_VALEUR` avant toute lecture de crédit ; taux ou
  garantie illisible ⇒ 500 journalisée.
- **D-504-D** — une garantie admise par type (règle P3), déduite à la quotité du paquet ; un nantissement dont le
  blocage est levé à l'arrêté n'est pas déduit.
- **D-504-E** — calcul exact en BigInt, **un seul arrondi par ligne, par excès** (prudence) ; totaux = sommes de lignes ;
  dépassement des entiers sûrs ⇒ `409 PROVISIONNEMENT_HORS_BORNE`.
- **D-504-F** — empreinte = sha256 du contenu canonique hors provision déjà constatée, dotation, reprise et formule ;
  empreinte périmée ⇒ `409 PROPOSITION_PROVISION_PERIMEE`.
- **D-504-G** — provision déjà constatée = provision requise au dernier arrêté ; date antérieure au dernier arrêté ⇒ 409.
- **D-504-H** — rang par dossier sous index unique ; le perdant d'une course relit le gagnant (`dejaApplique` ou 409).
- **D-504-I** — un crédit non classé donne une ligne **sans** provision, jamais une provision à 0.
- **D-504-J** — l'arrêté est la seule exemption, fermée, du contrôle « aucun état de classement stocké » de 503.
- Réserves avouées : ≈ 21 000 crédits au plus par arrêté (limite de document) ; pas de route de lecture des arrêtés ;
  dotations écrites ≠ revues si un arrêté intervient entre la revue et l'acte ; mainlevée suivie pour le seul
  nantissement ; une devise divergente bloque la proposition.

### Portes (HEAD `a84951c`, rejouées en session dans le worktree, en séquence)

Lint 0 · build OK · **2 289** unitaires / 116 suites (1 saut conditionnel préexistant), couverture
**99,78 / 97,17 / 99,59 / 99,81** · **341** e2e (56 sautés : suites Mongo sans URI) · **46/46** sur Mongo réel
(`credits.mongo`, `depots.mongo`, `classement-credits.mongo`, `provisionnement.mongo`).

### Revue de code (⑥) — un bloquant, cinq non bloquants (fonctions pures exécutées par script)

- **[bloquant, 90] Un arrêté daté dans le futur était accepté et bloquait tout arrêté antérieur** : le 14/09, un arrêté
  au 31/12 compte comme impayées des échéances futures (provision 291 369 au lieu de 4 567), puis toute proposition et
  tout arrêté au 30/09, 31/10 ou 30/11 rendent 409 — irréversible (append-only, aucune route), et STORY-507 le
  publierait.
- **[90] L'acte pouvait écrire des dotations que personne n'avait revues** : l'empreinte excluait la provision déjà
  constatée ; revue contre v1 (dotation 774 100), un autre arrêté appliqué entre-temps, même empreinte ⇒ v3 écrit
  274 100 jamais vu, alors que le contrat promet « ce qui est écrit est ce qui a été revu, ou rien ».
- **[85] Un arrêté tient en un document** : au-delà de 16 000 à 34 000 crédits selon les garanties (mesure bson), l'acte
  finit en 500 non typé après le calcul complet.
- **[80] La provision d'une date passée n'était plus consultable** dès qu'un arrêté postérieur existait (écart au brief,
  qui ne refusait que l'écriture).
- **[80] `typeGarantie` contre `type`** pour la même garantie dans le même contrat HTTP (défaut déjà corrigé en 503).
- **[80] Chaque page recalcule tout le portefeuille** et relit l'arrêté entier.
- Validés : dotation en complément, garantie non admise jamais déduite, arrondi par excès une fois par ligne, crédit non
  classé nommé sans montant, idempotence et concurrence sur Mongo réel, paquet (checksum, validateur, aucune valeur).

### Revue de sécurité (⑦) — deux constats LATENTS (aucune écriture possible tant que le paquet est vide)

- **[85] C-1 — même défaut que le bloquant de revue** (arrêté futur), vu comme verrouillage exploitable par un simple
  `TENANT_USER` (CWE-841).
- **[80] C-2 — consommation de ressources non bornée** (CWE-770) : recalcul intégral par requête, `limite` ne borne que
  la réponse ; à 100 appels par minute sur une IMF de 20 000 crédits, le processus partagé sature.
- Écartés avec preuve : IDOR (arrêté, levées de blocage, lot du portefeuille), 404 jamais 403, injection (empreinte au
  motif sha256 strict), mass assignment, rejeu d'empreinte, courses, exercice clos, fuites d'erreurs, intégrité de
  l'artefact, paquet fictif inchargeable en production. **Aucune élévation de privilège** : toutes les écritures du
  service sont ouvertes à `TENANT_USER` — la réserve de l'acte est une décision produit.

### Vérification docker — premier passage (HEAD `a84951c`, avant correctifs de revue) — six points prouvés

Code servi, démarrage et **chargement réel de l'artefact modifié** prouvés avant tout point : 322 fichiers de `src`
identiques hôte/conteneur ; sha256 des octets de `prudentiel-sfd-bceao-1.0.json` identique sur l'hôte, dans `dist` et
au manifeste (`b4b79e8a…`), rendu par `GET …/prudentiel` ; journal du chargeur « tranches=0, garanties admises=0 ».

| Point | Verdict |
|---|---|
| **S1** démarrage, `/health`, route du paquet de 498, classement de 503 inchangé (23 lignes), `sfd-bceao-2.0` intact | **PROUVÉ** |
| **S2** paquet servi vide ⇒ 409 `PAQUET_PRUDENTIEL_SANS_VALEUR` sur GET et POST ; collection et index nommé présents, 0 document | **PROUVÉ** |
| **S3** 10 propositions ⇒ aucune collection modifiée, profiler : 0 écriture, aucun crédit lu | **PROUVÉ** (chemin de refus seulement) |
| **S4** autre organisation ⇒ 404 au corps de l'inexistant ; dossier d'entreprise ⇒ 409 ; `TENANT_USER` admis sur le POST (**avant** D-504-K) | **PROUVÉ** |
| **S5** 15 POST et 6 GET invalides ⇒ 400, empreinte jamais recopiée | **PROUVÉ** |
| **S6** 0 réponse 5xx, 0 pile, aucune valeur de taux journalisée | **PROUVÉ** |

⚠️ Le calcul réel (dotation, reprise, idempotence, concurrence) **n'est pas productible** sur la stack tant que le
paquet servi est vide : il est prouvé par le paquet fictif des tests, jamais injecté dans le conteneur.

⛔ **Défaut constaté hors périmètre, antérieur à 504 (depuis STORY-497)** : `LoggingInterceptor` lit
`response.statusCode` dans `tap({ error })` **avant** que le filtre d'exceptions n'y pose le vrai statut ⇒ il journalise
200 ou 201 pour une requête refusée. Mesuré : 22 lignes `POST …/arretes-provision 201` alors que le client a reçu 409 ou
400 et qu'aucun arrêté n'existe ; même motif sur les routes de 501 à 503. Sur un acte réglementaire, la piste d'audit
compterait des arrêtés jamais écrits. **Non corrigé ici** (périmètre) — à traiter par une story dédiée.

### Décisions du 2026-09-14 (après revues)

- **D-504-K — appliquer un arrêté est réservé à `TENANT_ADMIN` (décision user)** ; la proposition reste ouverte à
  `TENANT_USER`. Exception fermée et testée à l'invariant « aucun rôle sur un handler ».
- **D-504-L** — un arrêté daté après le jour courant est refusé à l'application (`ARRETE_PROVISION_DATE_FUTURE`).
- **D-504-M** — l'acte engage aussi la **version de référence** revue : un arrêté intervenu entre la revue et l'acte ⇒
  proposition périmée ; un contenu identique au dernier arrêté reste `dejaApplique`.
- **D-504-N** — portefeuille compté **avant** le calcul et refusé au-delà d'une borne déduite de la taille maximale d'un
  document (`PORTEFEUILLE_TROP_VOLUMINEUX_POUR_UN_ARRETE`), filet de taille BSON avant l'insertion.
- **D-504-O** — la proposition d'une date passée se calcule contre le dernier arrêté daté au plus tard à cette date ;
  seule l'écriture antérieure est refusée.
- `type` au lieu de `typeGarantie` dans la ligne ; relecture projetée du dernier arrêté ; recalcul par page consigné en
  dette.

### Correctifs de revue livrés (commit `1029fce`)

- **D-504-K** : `@Roles(TENANT_ADMIN)` sur le seul handler d'application, inscrit comme **unique exception nommée** à
  l'invariant de portée. ⚡ En l'écrivant, l'invariant s'est révélé **vacant** sur les handlers (il ne balayait que les
  décorateurs de classe) : il lit désormais le corps de chaque classe. Anti-énumération : la garde de rôle passe avant la
  garde de dossier ⇒ un `TENANT_USER` reçoit le même 403 quel que soit le dossier, jamais lu.
- **D-504-L** : horloge injectable (`src/common/horloge/horloge.ts`), `ARRETE_PROVISION_DATE_FUTURE` jugé avant
  l'exercice ; la proposition ne lit pas l'horloge.
- **D-504-M** : `versionDeReference` publiée par la proposition, exigée par l'acte ; `dejaApplique` jugé avant la version.
- **D-504-O** : la proposition d'une date passée part du dernier arrêté daté au plus tard à cette date.
- `type` dans la ligne ; relecture projetée du dernier arrêté.
- 15 mutations rouges par assertion ; portes du dev : 2 323 unitaires, 352 e2e, 48/48 Mongo réel.

### Décision du 2026-09-14 (user) — la borne de 2 000 crédits refusait une IMF moyenne

- ⛔ Le correctif D-504-N bornait le portefeuille à **2 000 crédits par arrêté** (pire cas théorique : 20 garanties par
  crédit dans un seul document de 16 Mo), alors qu'une IMF moyenne porte « plusieurs milliers » de crédits (503 AC-5).
- **D-504-P — les lignes d'un arrêté sortent du document d'en-tête (décision user)** : en-tête dans
  `arretes_provision`, une ligne par crédit dans la collection append-only `lignes_arrete_provision`, écrites **dans une
  seule transaction** (aucun en-tête sans ses lignes, aucune ligne orpheline). La limite de document disparaît ; il reste
  un **plafond de coût** par requête, compté avant le calcul (50 000 crédits).

### ⚡ Ce que Mongo réel a montré pendant D-504-P

- ⛔ **Un arrêté de 20 000 lignes validait ses lignes DANS la transaction** : la transaction dépassait la limite de
  **60 s** de MongoDB, le serveur l'annulait, `ExecuteurTransactions` la rejouait **cinq fois** puis abandonnait — et le
  service traduisait l'abandon en conflit d'écriture : **409 au bout de 579 s**, sans rien écrire. Invisible aux
  doublures : seule la mesure sur Mongo réel l'a montré.
- Correctif : lignes construites et **validées avant l'ouverture de la transaction** ; la transaction ne fait plus
  qu'insérer l'en-tête puis les lignes validées par lots ordonnés de 1 000, sous la même session ; une ligne invalide est
  refusée avant toute transaction. Atomicité prouvée par un doublon glissé dans le 2ᵉ lot (0 en-tête, 0 ligne en base).

### D-504-P livrée (commit `346a692`)

- **`arretes_provision`** : l'en-tête seul (version, date, paquet, empreinte, `versionDeReference`, totaux, sous-totaux par
  tranche, crédits non provisionnés, `nombreLignes`, auteur) ; index unique (dossier, version) inchangé.
- **`lignes_arrete_provision`** (append-only) : une ligne par crédit (arrêté, version, crédit, membre, statut, jours de
  retard, provision détaillée avec sa formule) ; index `unicite_ligne_arrete_provision_par_credit` (arrêté, crédit) et
  `lecture_lignes_arrete_provision_par_version` (org, dossier, version, crédit). Les deux schémas refusent toute réécriture.
- ⚡ **Second défaut vu sur 20 000 lignes** : validées d'un seul bloc, les lignes tenaient la boucle d'événements **25 s** ;
  le pilote ne recevait plus ses battements de cœur et Mongoose 8 considérait la connexion perdue **sans émettre
  d'événement** ⇒ `startSession` expirait. Validation par lots de 1 000 rendant la main entre deux lots.
- Preuves sur Mongo réel (3 500 crédits) : doublon dans le 2ᵉ lot ⇒ 0 en-tête et 0 ligne ; ligne invalide refusée avant
  toute transaction ; deux applications concurrentes ⇒ un en-tête et exactement 3 500 lignes ; réapplication ⇒ aucune
  commande d'écriture.

| Mesure (Mongo réel) | 5 000 lignes | 20 000 lignes |
|---|---|---|
| Acte complet | 8,6 s | 29,7 s |
| dont validation hors transaction | 4,6 s | 15,4 s |
| dont écriture dans la transaction | 1,0 s (5 lots) | 2,5 s (20 lots) |
| Proposition | 2,9 s | 11,8 s |
| Plus long blocage de la boucle | 1,9 s | 1,9 s |

- Mutations P1 → P7 rouges par assertion (lignes hors transaction ⇒ 1 500 lignes orphelines ; index non unique ⇒
  3 501 lignes ; déjà constatée lue au mauvais rang ; plafond ignoré ; crochets append-only neutralisés ×2 ; validation
  sans rendre la main ⇒ 0 en-tête après 30,7 s de silence du pilote).
- Réserves : plafond de 50 000 **non mesuré** (extrapolé ≈ 75 s) ; la validation bloque encore la boucle ≈ 1,9 s par
  lot ; la proposition est recalculée à chaque appel (dette `CACHE_DE_LA_PROPOSITION_DE_PROVISION`).

### Re-vérification docker ciblée (HEAD `346a692`) — neuf points prouvés, deux limites

Code servi prouvé avant tout point (331 fichiers identiques hôte/conteneur ; `dist` recompilé contenant
`ARRETE_PROVISION_DATE_FUTURE` et le plafond de coût à 50 000, sans l'ancienne borne ni `taille-arrete` ; schéma d'en-tête
sans lignes ; checksum du paquet servi `b4b79e8a…`).

| Point | Verdict |
|---|---|
| **T1** (D-504-K) `TENANT_USER` en POST ⇒ 403 sans code, 0 en-tête et 0 ligne ; proposition identique pour les deux rôles | **PROUVÉ** |
| **T2** (D-504-K) même 403 pour son dossier, une autre organisation, un inexistant, un malformé ; `TENANT_ADMIN` : autre organisation = inexistant (404 identiques) | **PROUVÉ** |
| **T3** (D-504-L) lendemain ⇒ `ARRETE_PROVISION_DATE_FUTURE` (jugé avant l'exercice) ; la proposition ne lit pas l'horloge ; rien écrit | **PROUVÉ** |
| **T4** (D-504-M) 16 corps invalides ⇒ 400 (dont `versionDeReference` absente, négative, décimale, textuelle, objet, tableau, 2⁵³) | **PROUVÉ** |
| **T5** non-régression : `/health`, paquet de 498, classement de 503 identique au premier passage, dry-run sans écriture (16 collections, profiler : 0 écriture) | **PROUVÉ** |
| **T6** 0 réponse 5xx, 0 pile ; 55 refus appariés à leur ligne WARN au même statut | **PROUVÉ** |
| **P1** (D-504-P) deux collections, index nommés des lignes, aucun en-tête portant des lignes | **PROUVÉ** |
| **P2** agrégations de cohérence (orphelines, `nombreLignes`, doublons) exécutées — **à vide** | **PROUVÉ (à vide)** |
| **P3** dossiers de 2 000 crédits jamais refusés par le plafond | **Réponse PROUVÉE** — la disparition de l'ancienne borne ne l'est que par le code servi (refus du paquet vide avant tout comptage) |

Réserves : dotation, reprise, écriture des lignes, atomicité, courses, `dejaApplique`, proposition périmée et plafond ne
sont **pas productibles** avec le paquet servi vide (prouvés par la spec Mongo réel) ; frontière de minuit UTC non testée ;
le défaut antérieur du `LoggingInterceptor` se reproduit (42 lignes au faux statut, non compté). Script de cohérence
`coherence-arretes-504b.js` prêt pour le jour où un paquet réel sera servi.

### Revue ciblée des correctifs (code et sécurité) — mergeable, un constat de sécurité latent corrigé avant merge

- Constats de la première revue **fermés** (vérifiés dans le code et les journaux des portes) : date future, dotations
  revues (empreinte + version fixent les dotations, les lignes d'un rang étant immuables), taille, date passée, `type`,
  relecture projetée, RBAC. Atomicité : une seule session pour l'en-tête et tous les lots, rejeu sur les mêmes `_id`.
  Anti-énumération du 403 de rôle **conforme** (il ne dépend que du rôle et précède toute lecture du dossier).
- **[sécurité, 85] S-1 — aucune borne sur les calculs SIMULTANÉS** (CWE-400/770) : au plafond, une proposition ≈ 30 s et
  0,1 Gio, un acte ≈ 75 s ; un `TENANT_USER` à 100 propositions par minute sur un dossier de 50 000 crédits dépasse le tas
  Node ; quelques actes parallèles affament la boucle au-delà de 20 s ⇒ Mongoose tient la connexion pour perdue ⇒ **toutes
  les écritures transactionnelles de tous les tenants échouent**. Inexploitable tant que le paquet est vide ; bloquant
  avant de servir un paquet réel ⇒ **corrigé avant merge** (règle du projet).
- **[90] C-1** — « lignes validées » garanti par convention seulement (type structurel, insertion `lean` sans
  validation) ⇒ type nominal.
- **[85] C-2** — plafond recopié en dur dans Swagger, trois noms pour un concept, compte de lectures faux dans un
  commentaire.

### Décision du 2026-09-14 (après revue ciblée)

- **D-504-Q — borner la simultanéité** : au plus deux calculs de provisionnement par processus (refus immédiat
  retryable), verrou par dossier pris **avant** le recalcul de l'acte (expiration automatique), propositions identiques
  mutualisées, throttle propre aux deux routes, lots de validation de 200 avec assertion sur le blocage de la boucle.

### D-504-Q livrée (commit `e3111d0`) — le coût simultané borné

- **Sémaphore par processus** : deux calculs de provisionnement au plus (propositions et actes confondus), au-delà
  `409 PROVISIONNEMENT_CALCULS_SATURES` immédiat, emplacement libéré en `finally`.
- **Verrou d'acte par dossier** (`verrous_arrete_provision`, index unique + TTL) : prise atomique par un upsert filtré sur
  l'expiration, `409 ARRETE_PROVISION_DEJA_EN_COURS` immédiat pour un second acte, relâché avec son jeton ; durée 5 min,
  daté par l'horloge système (l'horloge métier figée des tests purgerait le verrou en plein acte). Il **précède** l'index
  unique (dossier, version), qui reste le filet de correction.
- **Propositions identiques en cours mutualisées** ; throttle propre par IP : 10 propositions et 3 actes par minute (429 +
  `Retry-After`).
- **Lots de validation de 200** : plus long blocage de la boucle pendant la validation 284 ms (5 000 lignes) et 427 ms
  (20 000 lignes), contre ≈ 1,1 s avec des lots de 1 000 ; assertion relative dans la spec de mesure.
- **C-1** : `LignesArreteValidees` devient une classe nominale (constructeur privé, marque privée, fabrique unique).
- **C-2** : `PORTEFEUILLE_AU_DELA_DU_PLAFOND_DE_COUT`, clé `plafondDeCout`, plafond interpolé dans Swagger.
- Mutations Q1 → Q5 rouges par assertion (deux tests durcis qui rougissaient d'abord par exception). Portes du dev :
  2 362 unitaires, 355 e2e, 58/58 Mongo réel.
- Réserves : sémaphore et throttle en mémoire (N instances ⇒ 2 × N calculs) ; throttle par IP avant authentification
  (quota partagé derrière un même NAT) ; un processus tué en plein acte bloque les actes du dossier jusqu'à 5 min ; le
  cache des propositions terminées reste une dette.

### Complément de vérification docker (HEAD `e3111d0`) — quatre points prouvés, un non productible

Code servi prouvé avant tout point (335 fichiers identiques hôte/conteneur ; constantes du `dist` = source ; OpenAPI
servie : l'ancien code de plafond absent, `PORTEFEUILLE_AU_DELA_DU_PLAFOND_DE_COUT`, `PROVISIONNEMENT_CALCULS_SATURES`,
`ARRETE_PROVISION_DEJA_EN_COURS` et plafond interpolé présents). Ordre des gardes **lu dans le code servi** avant les
attendus.

| Point | Verdict |
|---|---|
| **U1** code servi et contrat publié | **PROUVÉ** |
| **U2** `verrous_arrete_provision` et ses index (unique par dossier, TTL) présents ; 10 actes refusés ⇒ profiler : 0 opération sur les verrous (jamais pris avant le refus du paquet vide), 0 verrou résiduel | **PROUVÉ** |
| **U3** throttle propre de `e3111d0` : 429 au 11ᵉ appel de proposition et au 4ᵉ acte, `Retry-After: 60` ; la route voisine non limitée ; retour après la fenêtre | **PROUVÉ** (pour `e3111d0`, retiré par D-504-R) |
| **U4** saturation et verrou concurrent | **NON PRODUCTIBLE** — emplacement et verrou suivent le refus du paquet vide ; couverts par les unitaires et la spec Mongo réel |
| **U5** non-régression : 403 du rôle sans écriture, 16 corps invalides en 400, index des en-têtes, lignes et verrous, dossier de 2 000 crédits jamais refusé par le plafond, `/health`, paquet de 498 ; 0 réponse 5xx, 56 refus appariés à leur ligne WARN | **PROUVÉ** |

⛔ **Défaut du stockage de `@nestjs/throttler` 6.5.0 reproduit sur la stack** (hors code de la story, tout le service) :
après la levée d'un blocage sur l'acte, le compteur de `classement-credits` reste à **93** au lieu de revenir à 99 après la
fenêtre — six requêtes jamais décomptées. Les limites publiées (« N par 60 s par IP ») ne sont plus tenues après une
levée, limite globale comprise. Confirme le retrait du throttle propre (D-504-R) ; la limite globale reste touchée —
**dette à traiter par une story dédiée**, avec le défaut du `LoggingInterceptor`.

### Revue ciblée de D-504-Q (code et sécurité) — mergeable, cinq constats non bloquants corrigés d'office

- **Validé** : aucune fuite d'emplacement du sémaphore sur aucun chemin ; prise du verrou atomique (deux reprises d'un
  verrou expiré ⇒ une seule réussit, l'autre bute sur l'index unique) ; libération par jeton ; marque de
  `LignesArreteValidees` infalsifiable à l'exécution et `@ts-expect-error` effectif.
- **[sécurité, 85] Le throttle propre déclenche un défaut du stockage de `@nestjs/throttler` 6.5.0** : les minuteurs de
  décrément sont rangés par nom de throttler et non par clé ; le retour d'une clé bloquée efface ceux de **toutes** les
  clés, dont les compteurs cessent de décroître. Défaut antérieur, mais le throttle propre en faisait tomber le coût de
  ≈ 102 à **4 requêtes anonymes par minute** (script sur la vraie classe : victime refusée dès la minute 5,5).
- **[sécurité, 90] Throttle compté par IP avant l'authentification** : un anonyme derrière le même NAT épuise le quota
  d'actes de toute une IMF.
- **[sécurité, 85] Sémaphore global sans part par organisation** : un seul utilisateur occupe les deux emplacements en
  permanence (deux dates distinctes toutes les 30 s), toutes les autres organisations sont refusées.
- **[85] L'isolation de la clé de mutualisation n'est protégée par aucun test** : retirer le dossier de la clé ferait
  servir à un tenant la proposition complète d'un autre, sans qu'un test rougisse.
- **[80] Chiffres périmés** dans les commentaires qui justifient les bornes (acte ≈ 91 s au plafond, pas 75).

### Décisions du 2026-09-14 (après revue ciblée de D-504-Q)

- **D-504-R — le throttle propre aux deux routes est retiré** : il aggravait un défaut de bibliothèque exploitable sans
  authentification ; le sémaphore et le verrou bornent le coût. Le défaut du stockage du throttler (antérieur, tout le
  service) est consigné comme dette, avec le throttle par utilisateur authentifié qui le remplacerait.
- **D-504-S — au plus un emplacement de calcul par organisation**, dans le plafond global du processus.

### Portes sur l'état final (HEAD `e3111d0`, rejouées en session dans le worktree, en séquence)

Lint 0 · build OK · **2 362** unitaires / 121 suites (1 saut conditionnel préexistant), couverture
**99,79 / 97,15 / 99,61 / 99,82** · **355** e2e dont la suite dédiée au throttle (68 sautés : suites Mongo sans URI) ·
**58/58** sur Mongo réel (`credits.mongo`, `depots.mongo`, `classement-credits.mongo`, `provisionnement.mongo`, aucun sauté).

### Portes sur l'état final (HEAD `346a692`, rejouées en session dans le worktree, en séquence)

Lint 0 · build OK · **2 342** unitaires / 119 suites (1 saut conditionnel préexistant), couverture
**99,78 / 97,2 / 99,6 / 99,81** · **352** e2e (64 sautés : suites Mongo sans URI) · **54/54** sur Mongo réel
(`credits.mongo`, `depots.mongo`, `classement-credits.mongo`, `provisionnement.mongo`, aucun sauté).

## Notes

- Voir [[STORY-498]], [[STORY-503]], [[STORY-507]] (la publication en balance).
