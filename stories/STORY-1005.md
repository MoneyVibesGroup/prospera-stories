# STORY-1005 : la garde lit l'état publié

Status: done

**Complexité :** moyenne (un adaptateur par service, une garde partagée copiée, un consommateur et une projection
remplacés, la configuration, trois dépôts, une preuve de pile)

**Épic :** EPIC-201 (socle des modules)
**Dépôts :** `prospera-sinistres-service`, `prospera-liaison-assureur-service`, `document-service`
(dépôt GitHub `prospera-ocr-service`)
**Plage :** groupe C, n° 1 du lot 3 (`coordination/PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §5) ; dépendait de
`garde-etat-publie-v1` (publiée par B, STORY-937), annoncée à B le 15/11 (D-980-2).

---

## Pourquoi

Les trois services de C savaient si un module était ouvert en consommant `entitlement.changed` : un fait de droit,
propre à chaque service, qui ne dit ni « lecture seule », ni « suspendu », ni l'époque du moteur d'installation. Le
moteur publie désormais **l'état publié** de chaque module (`etat-publie.changed.<espace>@1`), avec un numéro
d'ordre ; une garde partagée, écrite par B, le lit en échec fermé. Tant que C lisait l'ancien fil, deux vérités
coexistaient. Cette story n'en laisse qu'une.

**Source** : plan lot 3 §5 (ligne 1005) ; contrat `etat-publie.changed.<espace>@1` et garde `garde-etat-publie-v1`
(B-937) ; spine assurance (AD-3, modules) ; D-980-2 (annonce à B).

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | L'adaptateur du port `EtatDesModules` lit la projection de `etat-publie.changed.<espace>@1` ; la garde et les routes ne changent pas | tests ; pile |
| AC-2 | La garde partagée de B est copiée **à l'octet** dans `src/vendor/garde-etat-publie/` (étiquette `garde-etat-publie-v1`, sha256 `a830c449…`) | pile (empreinte identique dans les trois) |
| AC-3 | Module sans état publié ou état inconnu : refus `*_NOT_ENTITLED` (échec fermé) ; `EN_SERVICE` servi ; `LECTURE_SEULE` : lecture 200, écriture `ABONNEMENT_EXPIRE` ; `SUSPENDU` refusé | tests ; pile |
| AC-4 | Un état plus ancien (même époque, numéro plus petit) est sans effet ; `entitlement.changed` n'ouvre plus rien ; l'état de l'autre espace est ignoré ; un état plus récent rouvre | pile |
| AC-5 | Le consommateur, la projection et le schéma d'`entitlement.changed` sont retirés ; nouvelles variables `KAFKA_ETAT_PUBLIE_GROUP_ID` et `INSTANCE_ESPACE` (défaut `REEL`) | tests |
| AC-6 | `sinistres` lit toujours l'état de `reseau` (portée réseau, STORY-1004) par la même projection | pile |

## Décisions retenues par défaut (contestables)

- **D-1005-1 — L'état publié décide seul, sans double lecture.** Pas de repli sur l'ancien fil « au cas où » : deux
  sources qui peuvent se contredire sont pires qu'une seule qui peut manquer. Absent ou inconnu : refus.
- **D-1005-2 — `LECTURE_SEULE` se traduit en `ACTIVE` avec une échéance à l'époque 0.** La garde existante, qui
  connaît `ACTIVE` et son échéance, refuse alors l'écriture par `ABONNEMENT_EXPIRE` et laisse passer la lecture, sans
  qu'on touche à la garde ni aux routes.
- **D-1005-3 — L'espace est `INSTANCE_ESPACE`** (défaut `REEL`) : le service s'abonne à `etat-publie.changed.<espace>`
  et ignore tout fait portant un autre espace, même arrivé sur son topic.
- **D-1005-4 — Plus de registre d'`eventId`** : l'idempotence se fait par `(epoque, numero)`, ce que la garde de B
  prévoit. Un rejeu, un doublon ou un fait plus ancien ne changent rien.
- **D-1005-5 — `reseau` reste un voisin suivi dans `sinistres`** : la projection de l'état publié garde aussi l'état
  de `reseau` (sans gate) pour la portée réseau de STORY-1004, qui n'a plus à lire `entitlement.changed`.
- **D-1005-6 — La collection `socle_etat_des_modules` est laissée orpheline** (aucune migration, aucune suppression) :
  elle n'est plus lue ni écrite ; l'état publié vit dans `socle_etat_publie`. Un nettoyage se fait à la main quand le
  poste le décide.
- **D-1005-7 — L'erreur de lint déjà présente sur `dev` dans `document-service` est corrigée ici** (une ligne de
  `sources-des-manifestes.spec.ts`, prettier) : le dépôt est tenu par C, et un lint rouge ne doit pas accompagner une
  story qui prétend avoir tout vérifié.

## Ce qui a été livré

**2026-11-17** — trois PR fusionnées en « Rebase and merge » :

| Dépôt | PR | SHA sur `dev` | Node 24 |
|---|:--:|---|---|
| `prospera-sinistres-service` | **#16** | `4041d70` | 970 unitaires (MongoDB réel), 19 e2e, lint 0, build 0 |
| `prospera-liaison-assureur-service` | **#7** | `faf4f7c` | 480 unitaires, 21 e2e, lint 0, build 0 |
| `document-service` (GitHub `prospera-ocr-service`) | **#29** | `da4ddf2` | 1060 unitaires (1 ignoré), 193 e2e (OCR compris), lint 0, build 0 |

- Dans chacun : l'adaptateur de `EtatDesModules` lit la projection de l'état publié ; la garde de B copiée à l'octet
  (`ORIGINE.json`, sha256 `a830c4491491e9505a9a761ecc549b11e10779bd13577bdd59bcffff17f892f7`) ; le consommateur
  `consommateur-etat-publie` (groupe `KAFKA_ETAT_PUBLIE_GROUP_ID`) et la projection `socle_etat_publie` ; plus de
  schéma d'`eventId`.
- **Pile `grp-c-1005`** (les trois services, Kafka, MongoDB, MinIO), pour chacun des quatre modules gardés
  (`sinistres`, `expertises`, `liaison-assureur`, `ged`) : module sans état refusé `*_NOT_ENTITLED` ; `EN_SERVICE`
  servi ; `LECTURE_SEULE` lecture 200 et écriture `ABONNEMENT_EXPIRE` ; `SUSPENDU` refusé ; rejeu du n°1 sans effet ;
  `entitlement.changed ACTIVE` n'ouvre plus rien ; état de l'autre espace (`ESSAI`) ignoré ; n°6 rouvre ; `reseau`
  toujours lu dans `sinistres` (la portée réseau s'applique) ; 0 erreur aux journaux.
- **Rejouée sur les images reconstruites depuis `dev`** (pile `grp-c-1005d`, `origin/dev` des trois dépôts, arbres
  identiques à ceux des branches) : même issue, 0 erreur.
- **Corrections faites avant la PR** : (1) lint de `document-service` : l'erreur prettier de
  `sources-des-manifestes.spec.ts` existait déjà sur `origin/dev` (vérifié sur un export) ; corrigée (D-1005-7) ;
  (2) `liaison-assureur`, `test/echange.e2e-spec.ts` : 12 échecs vus une fois, sous charge, dans l'étage de
  vérification ; **non reproduits** (l'e2e ouvre le module par un port en mémoire, pas par l'ancien fil) : le fichier
  seul 12/12, la suite e2e 21/21 deux fois, puis la séquence complète avec MongoDB 480 + 21. Classé comme échec
  intermittent sous charge, pas comme régression.

**Écarts nommés**
- **Recette complète de l'Atelier (STORY-100) non rejouée** : elle demande la pile de `prospera-recette` (cinq services
  et Money Vibes), non levée dans cette session pour ne pas tenir le poste partagé avec le groupe A. Ce qui a été
  rejoué pour `document-service`, qui sert aussi le cabinet : la suite e2e complète (13 suites, 193 tests, OCR compris)
  et la garde du module `ged` sur la pile.
- Le premier passage du scénario de rejeu a rougi sur une connexion HTTP réutilisée et fermée par le serveur
  (`other side closed`, côté script, 0 erreur de service) : le script ouvre désormais une connexion par appel et
  réessaie ; la seconde passe est verte.

**Reste** : `assurance-service` lit encore l'interrupteur `compta-cima` dans la configuration du droit (STORY-1006) ;
la collection `socle_etat_des_modules` est à nettoyer à la main.
