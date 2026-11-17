# STORY-1055 : l'import réseau par la Reprise — les zones et les commerciaux reçus par `kit-cible` 1.0.1, un seul moteur des zones avec l'import par fichier

Status: in-progress

**Épic :** EPIC-165 (les modules cibles reçoivent la reprise : un point d'import dans le « fini » de chacun) · **Dépôts :**
`reseau-service` (tenu par D, port 3419) ; `prospera-plateforme`, dossier `contrats/objets/reseau/` seulement (écrit par
le module `reseau`, README de la plateforme, « Qui écrit dans quel dossier »). **Plage :** groupe D, n° 11 du lot 3
(`PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §4). **Dépend de :** B-956 (faite : `kit-cible-v1.0.1`, plateforme `189183f`).
**Suivante :** STORY-1056 (la commande (1), `ventes`).

**Sources :** D-1041-3 (« l'import ne porte que des zones ; les commerciaux arrivent par la Reprise (objet
`reseau.commercial@1`) ; le volet Reprise attend le kit des cibles : le même point d'écriture s'y branchera ») ;
manifeste `reseau` (`objetsDeReprise: ['reseau.zone@1', 'reseau.commercial@1']`, objet « commercial » validé par le PO
le 2026-11-12, « les portées ne sont pas reprises ») ; EPIC-165 (« fini » d'un module cible : schémas d'objets dans
`contrats/objets/<code>/`, raccord ou `juger`, valeurs de contrôle, suite de conformité verte) ; STORY-947 et 956 (le
kit, sa suite, D-956-4 : le banc fournit `panne`) ; journal de B, « → D (2026-11-17) : D-1055 copie la distribution à
`kit-cible-v1.0.1` » ; relecture de A (`relecture-kit-cible-1.0.0-groupe-A.md` : `ajv` en dépendance, `src/vendor` hors
lint, deux copies de la garde) ; spine de la Reprise AD-2, AD-3, AD-4, AD-5, AD-9, AD-13, AD-23, AD-27, AD-30 ; spine
`reseau` AD-2 (profondeur configurable), AD-3 (code jamais réattribué), AD-8 (portées), FR-R13, FR-R14, FR-R20, FR-R37.

## Pourquoi

1041 a livré l'import du réseau par fichier, tout ou rien, et a laissé le volet Reprise en attente du kit des cibles
(D-1041-3). Le kit est publié (`kit-cible` 1.0.1, B-956) : `reseau` doit maintenant recevoir la reprise comme toute
cible de février, en servant `SIMULER` et `APPLIQUER` pour ses deux objets, sans écrire une seconde fois les règles
d'une zone que l'import par fichier applique déjà.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | **Le kit copié à l'octet** depuis `kit-cible-v1.0.1` (`git -c core.autocrlf=false show`), les empreintes refigées par un test, hors lint et formatage ; `ajv` en dépendance d'exécution | test d'empreinte ; build ; image |
| AC-2 | **Les deux objets servis** : `POST /api/v1/reprise/reseau/{organisationId}/objets/{zone|commercial}` (`SIMULER`, `APPLIQUER`) et `…/controles/{zone|commercial}`, schémas `reseau.zone@1.0` et `reseau.commercial@1.0` publiés dans `prospera-plateforme/contrats/objets/reseau/` et copiés à l'octet | intégration HTTP ; e2e ; pile |
| AC-3 | **La suite de conformité du kit passe telle que publiée** (aucune ligne modifiée), sur MongoDB réel en jeu de répliques, avec la panne de l'atomicité ; les cas sans objet sont nommés | intégration ; mutations |
| AC-4 | **Un seul moteur des zones** : l'import par fichier (1041) et la Reprise jugent une zone par les mêmes règles (mêmes codes) et l'écrivent par le même chemin (nœud, zone, fait `reseau.noeud.created@1`, journal, portées republiées une fois par transaction) | unitaires ; intégration 1041 inchangée et verte |
| AC-5 | **Tout ou rien** : une requête s'écrit dans une transaction ; une panne au milieu ne laisse ni nœud, ni fiche, ni clé, ni fait dans l'outbox ; un fichier fautif est refusé nommé, rien n'est écrit | intégration ; pile |
| AC-6 | **`SIMULER` n'écrit rien** (ni nœud, ni commercial, ni fait) ; `APPLIQUER` écrit tout ; **un second `APPLIQUER` est idempotent** (même réponse, aucune écriture, aucun fait de plus) | intégration ; pile (Kafka lu) |
| AC-7 | **Cloisonnement** : l'organisation du chemin est celle du jeton (403 `ORGANISATION_HORS_JETON`) ; une organisation témoin reste intacte | conformité ; pile |
| AC-8 | **Les faits restent compatibles** : `reseau.noeud.created@1`, `reseau.noeud.closed@1`, `reseau.commercial.changed@1`, `reseau.portee.changed@1`, sans champ neuf, par l'outbox dans la transaction | contrat ; pile (Kafka lu) |
| AC-9 | `conformite-portee-reseau-v1` toujours verte ; les invariants du module (routes, cloisonnement, journal) tenus | intégration ; unitaires |

## Décisions retenues par défaut (contestables)

- **D-1055-1 — Ce que la Reprise importe dans `reseau`, et dans quel ordre.**
  - `reseau.zone@1.0` : les zones, et la hiérarchie par leur référence `parent` (une zone).
  - `reseau.commercial@1.0` : le commercial à inviter (prénom, nom, e-mail, téléphone, statut d'emploi), et sa zone
    d'affectation courante, datée (`zone`, `affecteDepuis` ; `partiLe` pour un commercial parti).
  - **Pas d'agences** : le distributeur n'en a pas (A4) ; l'objet viendra en mineure avec la microfinance.
  - **Pas de portées** : elles s'attribuent dans Prospera par qui détient `reseau:portee:attribuer` (AD-8, manifeste).
  - **Pas de responsable**, ni d'affectations antérieures à la reprise : une nomination est un acte humain (FR-R21) ;
    l'historique d'affectation des points de vente est porté par `pdv.affectation@1`. Une mineure `1.1` pourra ajouter
    des affectations passées.
  - **Ordre** : zone avant commercial, parent avant enfant ; c'est l'ordre des références, que la Reprise trie (AD-23).
- **D-1055-2 — Un seul moteur des zones** (`src/modules/reseau/import/moteur-des-zones.ts`) :
  - les règles d'une zone en fonctions pures, partagées : `CODE_INVALIDE`, `CODE_DEJA_ATTRIBUE`, `PARENT_INCONNU`,
    `PARENT_FERME`, `PROFONDEUR_MAX_ATTEINTE` ;
  - un chantier par transaction : la création (`creerZoneDansLaSession` : nœud, zone, `reseau.noeud.created@1`, journal),
    la modification, la fermeture différée, puis la **republication des portées une seule fois**, en fin de
    transaction ;
  - l'import par fichier (1041) et le raccord de la Reprise passent tous deux par lui.
  - Ce qui diffère par construction : le fichier est jugé en entier, et une erreur n'écrit rien (FR-R37) ; la Reprise
    juge objet par objet, et rend un verdict par objet (AD-4), la requête restant une seule transaction.
- **D-1055-3 — Le kit est copié à l'octet** dans `src/vendor/kit-cible/` (13 fichiers et `EMPREINTES.json`), depuis
  `kit-cible-v1.0.1`, jamais la 1.0.0. Un test recalcule les sha256. La copie est hors lint, hors formatage et hors
  couverture. `ajv` passe en dépendance d'exécution. La garde jointe au kit (`9f0b6f18…`) et celle de
  `src/vendor/garde-etat-publie/` (`garde-etat-publie-v1`, la garde du module) sont deux copies distinctes, chacune
  figée.
- **D-1055-4 — Les schémas d'objets sont écrits par D** dans `prospera-plateforme/contrats/objets/reseau/`
  (`zone@1.0.json`, `commercial@1.0.json`), avec un test qui les compile par le kit (étiquette `objets-reseau-v1`), puis
  copiés à l'octet dans `reseau-service` (`src/modules/reseau/reprise/objets/`, empreintes figées).
- **D-1055-5 — Les routes et les identités.**
  - Routes : `POST /api/v1/reprise/reseau/{organisationId}/objets/{objet}` et `…/controles/{objet}`, servies par
    `traiterRequete` du kit.
  - Jetons de service : patron de STORY-948 et de STORY-1046 (`identite` `REPRISE`, `CONNECTEURS` ou `MOTEUR`, avec
    `organisationId`). Ils sont admis sur ces deux routes seulement ; partout ailleurs, 403
    `IDENTITE_DE_SERVICE_REFUSEE`.
  - La garde est celle du kit : l'état publié (la projection de STORY-1050) jugé par la matrice. Elle n'ouvre jamais
    ces routes à un utilisateur. Ni KYC ni droit de tenant sur ces routes (spine de la Reprise, AD-27 et AD-30).
  - L'analyseur JSON du service passe à 2 Mio : c'est le kit qui répond 413 `LOT_TROP_GROS` au-delà de 1 Mio.
- **D-1055-6 — Cloisonnement par organisation.**
  - Tout se lit et s'écrit sous l'organisation : nœuds, commerciaux, fiches de reprise, clés, résultats, lots.
  - Le chemin doit porter l'organisation du jeton : le kit le vérifie (403 `ORGANISATION_HORS_JETON`).
  - Les organisations de `reseau` sont des `ObjectId` (auth). Le banc de conformité traduit donc les deux
    organisations de la suite (`org-conformite-a`, `org-conformite-b`) en deux `ObjectId` fixes, par une bijection
    posée devant la cible. La suite elle-même n'est pas touchée.
- **D-1055-7 — Atomicité.**
  - Une requête de reprise, c'est une transaction : celle du magasin MongoDB du kit, ouverte sur le client du service.
  - La transaction porte : nœud, zone, commercial, affectation, fiche, clés, résultat, version du lot, outbox, journal
    et portées.
  - Une erreur, où qu'elle survienne, ne laisse rien.
  - `SIMULER` joue le même code, y compris la fermeture différée et la republication des portées, puis annule. Rien
    n'entre dans l'outbox, donc aucun fait ne part.
- **D-1055-8 — Les règles d'une zone reprise.**
  - **Création** :
    - le code doit être libre, sinon `CODE_DEJA_ATTRIBUE` (la Reprise rattache alors la zone existante par
      `rattacherA`) ;
    - une zone `VIVANT` exige un parent ouvert ;
    - la profondeur reste dans la configuration de l'organisation.
  - **`HISTORIQUE`** :
    - la zone est créée, puis fermée en fin de transaction, les enfants avant les parents ;
    - un enfant `HISTORIQUE` y est admis ; un enfant `VIVANT` est refusé (`PARENT_FERME`).
  - **Modification** : seuls `nom`, `type` et `localites` changent. Changer le code, le parent ou le régime est refusé :
    déplacer et fermer sont des actes de Prospera, précédés de leur compte rendu (FR-R14).
  - **Même contenu redonné** : `INCHANGE`, sans écriture, même si la zone a été retouchée dans Prospera entre-temps.
  - Chaque refus est un `REFUSE_PAR_LA_CIBLE` dont la raison commence par le code de l'écart.
- **D-1055-9 — Les règles d'un commercial repris.**
  - Le régime donne l'état : `VIVANT` = `EN_POSTE`, `HISTORIQUE` = `PARTI` avec `partiLe`. Un `etat` fourni doit
    concorder avec le régime.
  - **Doublons** : un e-mail, puis un téléphone, déjà porté par un autre commercial de l'organisation donne
    `COMMERCIAL_EN_DOUBLE`. En `SIMULER`, les commerciaux qui portent le même e-mail ou le même téléphone sont rendus
    en `doublonsProbables` (AD-9).
  - **Zone** :
    - `zone` exige `affecteDepuis`, au plus tard le jour du départ ;
    - un commercial `EN_POSTE` exige une zone ouverte ;
    - l'affectation `MEMBRE` court depuis `affecteDepuis`, jusqu'à `partiLe` pour un commercial parti.
  - **Modification** : l'identité seule (prénom, nom, e-mail, téléphone, statut d'emploi). Une autre zone, une autre
    date ou un départ est refusé : ce sont des actes de Prospera.
  - **Aucune invitation** ne part de la reprise (manifeste). La clé d'origine vit dans l'index du kit (`reprise_cles`),
    pas sur le commercial : le raccord du kit ne la reçoit pas.
  - Chaque écriture publie `reseau.commercial.changed@1`, par la méthode existante.
- **D-1055-10 — La chaîne de 600 de la suite** se joue sur des zones liées par `parent`. Le banc pose
  `profondeurMax` à 1 000 pour ses deux organisations, directement dans la configuration. La règle de profondeur ne
  change pas ; seule la valeur change, hors de la borne de l'API (`PROFONDEUR_LIMITE`, 10), qui reste en place.
  → B, pour information : la suite suppose une auto-référence sans borne de profondeur.
- **D-1055-11 — `rattacherA` vise toute zone (ou tout commercial) de l'organisation**, même créé dans Prospera sans
  reprise. La fiche se reconstruit alors depuis l'objet vivant, avec une empreinte vide : la première livraison sur
  la clé rattachée est un `MODIFIE`, jugé par les règles de modification.
- **D-1055-12 — Les fiches de reprise sont rangées à part**, dans `reprise_fiches` : organisation, objet, identifiant,
  champs reçus, régime, marqueurs, état retenu, empreinte. Les collections du kit s'y ajoutent (`reprise_cles`,
  `reprise_resultats`, `reprise_lots`, `reprise_traces`). Les collections métier (`noeuds`, `zones`, `commerciaux`,
  `reseau_affectations`) ne gagnent aucun champ.
- **D-1055-13 — Les valeurs de contrôle se lisent sur l'objet vivant** : le statut du nœud (`OUVERT`, `FERME`) et
  l'état du commercial (`EN_POSTE`, `PARTI`). Ce ne sont pas les champs livrés : c'est ce que la Reprise doit
  comparer à la source (AD-13).

## Avancement (pour reprendre après une coupure)

- 13:47 — rituel fait (plan, règles, journaux A, B, C, D ; fiches 1041, 947, 956 ; EPIC-165 ; kit 1.0.1 lu) ; branches
  `docs-1055` (prospera-stories) et `MNV-1055` (reseau-service) posées depuis `origin/main` et `origin/dev`.
  Verrou Docker tenu par B (« B STORY-965 13:35 ») : code d'abord.
- 14:45 — annonce « ⚠ Contrats » fusionnée (prospera-stories #650, `main` 6c77cc2). Plateforme : branche `MNV-1055`
  poussée (`2e59857`, schémas `zone@1.0` et `commercial@1.0`, test de compilation par le kit ; PR à ouvrir après la
  preuve Node 24). `reseau-service` : branche `MNV-1055` poussée (`c4f643c`) : kit copié, moteur des zones, routes,
  raccords, bancs ; tsc et lint verts, unitaires touchés verts sous Node 25 ; intégration et Node 24 à jouer sous le
  verrou (toujours tenu par B).
