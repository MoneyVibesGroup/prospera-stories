# STORY-985 : l'échange par API, la file d'envoi acquittée, le numéro officiel et la file des écarts

Status: done

**Complexité :** grande (un second transport, une file d'envoi ordonnée, deux objets reçus, une file des écarts)

**Épic :** EPIC-203 (l'échange avec le logiciel de la compagnie)
**Dépôt :** `MoneyVibesGroup/prospera-liaison-assureur-service` (tenu par C)
**Plage :** groupe C, n° 6 du lot (`coordination/PLAN-4-SESSIONS-2026-11-14.md` §5).

---

## Pourquoi

STORY-984 a posé le contrat de l'annexe C, le service et le transport par fichiers dans le sens LC → Prospera.
Il manque l'autre sens et ce qui le rend sûr :

- **la file d'envoi acquittée** (AD-13) : déclaration, évaluation et provision, règlement, recours, décision (C-13 →
  C-17), **ordonnée par entité**, aux états `à envoyer | envoyé | accepté | refusé | jamais confirmé après 24 h` ;
- **les accusés du LC** (C-12) qui font avancer cette file ; un refus motivé ouvre un **écart** ;
- **le numéro officiel** (C-11 ; AD-6) : la référence `DEC-` d'abord, le numéro du LC ensuite, **un seul numéro**,
  rattaché une fois ;
- **la file des écarts** : deux valeurs, une résolution tracée (FR-200) ;
- **le transport par API** : le même objet que par fichiers (AD-13 : un port, deux transports, Prospera tire).

## Ce qui doit être vrai à la fin (plan §5, n° 6)

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | **File d'envoi** : un envoi C-13 → C-17 se valide contre son schéma (aucun motif libre, rien de médical) et s'enfile `A_ENVOYER` ; même clé et même contenu : un seul envoi ; même clé, contenu différent : refus, jamais un écrasement | unitaires ; e2e |
| AC-2 | **Ordre par entité** : pour une même référence, rien ne part tant que l'envoi de rang inférieur (déclaration, puis évaluation, règlement, recours, décision) n'est pas **accepté** ; les envois partent en lots `<objet>_<lotId>_1.json` déposés atomiquement, et passent `ENVOYE` | unitaires ; e2e (vrai disque) |
| AC-3 | **Accusés (C-12)** : `ACCEPTE` → `ACCEPTE` ; `DOUBLON` → `ACCEPTE` (le LC l'a déjà) ; `REFUSE` → `REFUSE` avec le code et le motif du LC, **et un écart** ; un accusé d'une clé jamais envoyée est refusé `IDENTIFIANT_INCONNU` | unitaires ; e2e |
| AC-4 | **Jamais confirmé** : un envoi `ENVOYE` sans accusé après 24 h (paramètre) passe `JAMAIS_CONFIRME` et ouvre un écart | unitaires (horloge figée) |
| AC-5 | **Numéro officiel (C-11, AD-6)** : rattaché à sa `DEC-` une fois, voie `AUTO` ; un second numéro pour la même `DEC-` : écart `NUMERO_OFFICIEL_DEJA_ATTRIBUE`, jamais un second rattachement ; un numéro déjà porté par une autre `DEC-` : écart `DOUBLON` ; un « doublon + numéro existant » du LC : écart ; une `DEC-` jamais déclarée : `IDENTIFIANT_INCONNU` | unitaires ; e2e |
| AC-6 | **File des écarts** : chaque écart porte sa nature, l'objet, la clé, les deux valeurs quand il y en a deux, son ouverture ; la résolution (décision et motif obligatoire) est tracée avec son auteur ; un écart résolu ne se rouvre pas ; les `DOUBLON` de l'intégration (STORY-984) y entrent aussi | unitaires ; e2e |
| AC-7 | **Transport par API** : relever et déposer **le même lot** que par fichiers, par HTTP (Prospera appelle, aucun port entrant) ; une API injoignable n'arrête ni le relevé des autres organisations ni la file, qui attend | unitaires (serveur HTTP local réel) |
| AC-8 | Lint 0, build, suites vertes sous Node 24 ; prouvé sur la pile `grp-c` | sorties ; pile |

## Décisions retenues par défaut (contestables)

- **D-985-1 — Hors de cette story, vers STORY-991** (plage de C, EPIC-203) : la **publication des faits**
  `liaison-assureur.*@1` (leur schéma doit classer chaque champ au registre `classification-sante`, AD-16 et AD-23),
  la **fraîcheur** par objet et par transport (`fraicheur.changed@1`) et la **liste « à saisir »** (C-18), qui
  dépend du mode « le LC ne sait pas recevoir ». Les documents reçus (C-10) attendent le point d'import de `ged`.
- **D-985-2 — L'enfilement se fait par une route du module** (`POST …/echange/envois`), en attendant les faits de
  `sinistres` (EPIC-205 et suivants) qui l'appelleront par leur consommateur ; la route et le consommateur passent par
  le même service.
- **D-985-3 — L'API transporte les lots tels quels** : `GET {base}/entree` (noms des lots disponibles),
  `GET {base}/entree/{nom}` (le lot), `PUT {base}/sortie/{nom}` (dépôt), jeton porteur. Le même gabarit, la même
  empreinte, la même intégration que les fichiers : un LC qui sait faire l'un sait faire l'autre. Un LC par instance
  (`LIAISON_TRANSPORT=api`, `LIAISON_API_URL`, `LIAISON_API_JETON`, `LIAISON_API_ORGANISATION`).
- **D-985-4 — L'ordre par entité attend l'acceptation**, pas seulement l'envoi : une évaluation ne part pas avant que
  le LC ait accepté la déclaration (AD-13 : « les envois attendent dans la file, dans l'ordre »). Un refus bloque
  l'entité jusqu'à la résolution de l'écart.
- **D-985-5 — Un `DOUBLON` accusé vaut acceptation** : le LC dit qu'il a déjà l'objet ; l'envoi passe `ACCEPTE` avec
  la mention, sans écart.
- **D-985-6 — Les décisions de résolution** : `GARDER_PROSPERA`, `PRENDRE_LC`, `RENVOYER` (un envoi refusé repart
  `A_ENVOYER`), `CLASSER` ; motif obligatoire, auteur = l'utilisateur du jeton.

## Ce qui a été livré

**2026-11-15** — `prospera-liaison-assureur-service` **#2**, fusionnée en « Rebase and merge » sur `dev` (`3a2a6f0`).

- File d'envoi (`liaison-assureur_envois`), numéros (`liaison-assureur_numeros`, une `DEC-` ↔ un numéro, index
  uniques), écarts (`liaison-assureur_ecarts`, un seul OUVERT par nature, objet, clé et version) ; transport par API.
- Node 24 (export LF) : **409 unitaires, 20 e2e**, lint 0, build ; le transport API éprouvé contre un vrai serveur HTTP ;
  image reconstruite depuis `dev` : healthy.
- **Pile réelle** `grp-c` (MongoDB, Kafka, volume d'échange, IdP de test sur le réseau de la pile, hors dépôt) :
  enfiler 201, le même 200, autre contenu 409, déclaration corporelle avec gravité 422 ; cycle : la déclaration part
  (lot dans la sortie) ; le LC la refuse : écart `REFUS_LC` ; résolution `RENVOYER` signée par l'auteur du jeton,
  seconde résolution 409, sans motif 400 ; la déclaration repart (second lot) ; le numéro du LC revient, rattaché
  voie `AUTO` ; sans jeton 401.
- **Constaté** : un numéro reçu pour une déclaration déjà refusée est rattaché, mais l'envoi reste `REFUSE` jusqu'à la
  résolution de l'écart ; c'est la décision humaine qui tranche (D-985-4).

**Reste, vers STORY-991** (D-985-1) : la publication des faits `liaison-assureur.*@1` (champs classés au registre),
la fraîcheur, la liste « à saisir » (C-18) ; les documents (C-10) avec le point d'import de `ged`.
