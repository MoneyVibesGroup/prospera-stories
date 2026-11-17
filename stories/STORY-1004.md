# STORY-1004 : les portées par volet et l'accès par dossier

Status: done

**Complexité :** grande (un paramètre de périmètre, un read-model et son consommateur Kafka, la portée appliquée à
chaque lecture et chaque commande, la suite de conformité de D copiée et jouée, l'inscription au registre)

**Épic :** EPIC-202 (rôles, portées, séparation des tâches)
**Dépôts :** `prospera-sinistres-service`
**Plage :** groupe C, n° 15 (dernière) du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §4) ; dépendait de
D-1036 et D-1037, livrées le 16/11 (`reseau-service` `dev` `17dcf14`, étiquette `conformite-portee-reseau-v1`).

---

## Pourquoi

Jusqu'ici, tout agent du circuit voyait tous les dossiers de l'organisation : un gestionnaire du matériel lisait un
dossier corporel par son identifiant, et la portée d'un agent dans le réseau de la compagnie (agences, zones) n'était
pas lue. Le PRD (FR-6) donne un périmètre à chaque rôle ; la spine assurance (AD-26) impose que chaque service applique
la portée ou la refuse ; la spine `reseau` (AD-6) la publie en état absolu, fail-closed, et laisse chaque consommateur
la tenir — « le défaut le plus coûteux du programme, et il est silencieux » (ticket de D).

**Source** : PRD FR-6 (et annexe B) ; spine assurance AD-26 ; spine `reseau` AD-5, AD-6, AD-9 ; ticket
`tickets/TICKET-BACKEND-conformite-portee-reseau-sinistres.md` ; plan (« un agent ne voit aucun dossier hors de sa
portée ; une portée vide est vide ; les routes par `dossierId` refusent hors portée ; la suite de conformité du réseau
passe »).

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | **Le périmètre par rôle** (FR-6) est un paramètre figé (`perimetres-2026.1`) : DG, DT, RESP, AUD, ACC voient tout ; GEST le volet du registre des gestionnaires (absent du registre : rien) ; GREC le recours ; MED le corporel ; CPT les statuts de paiement ; EXPI, EXPE, NUM, ARCH, ADMIN rien par les routes de `sinistres` | tests |
| AC-2 | **La portée réseau** : `sinistres` consomme `reseau.portee.changed@1` (groupe `sinistres-service.portee-reseau`, topic créé avant l'abonnement, métadonnées à 10 s) dans un read-model par `(organisation, utilisateur)` qui garde la plus haute révision ; appliquée quand `reseau` est installé ; sans fait, retirée ou vide : rien ; totale : toute l'organisation, jamais une autre ; l'écriture suit `ecriture` | tests ; pile |
| AC-3 | **Appliquée au serveur** : files de travail (dans la requête), lecture du dossier, piste, échéances, liste de choix, et chaque commande (en écriture) ; un dossier hors portée est **introuvable** (404, jamais un 403 révélateur) ; déclarer hors de sa portée d'écriture : 403 | tests ; pile |
| AC-4 | **La suite de conformité** de D, copiée à l'octet (empreinte gardée), passe ses six cas sur le **vrai** read-model et le **vrai** filtre, en mémoire et sur MongoDB | tests (Node 24, MongoDB réel) |
| AC-5 | **Inscription au registre** des consommateurs conformes de `reseau-service` après un passage vert ; la vérification `consommateurs-conformes` est verte pour une organisation qui installe `sinistres` | pile |

## Décisions retenues par défaut (contestables)

- **D-1004-1 — Deux couches, toutes deux en échec fermé, qui se cumulent** : le périmètre du rôle (FR-6) et la portée
  réseau (AD-6). Un agent qui cumule des rôles voit l'union de leurs périmètres.
- **D-1004-2 — « `reseau` installé » se lit dans l'état des modules** : la projection de `entitlement.changed` garde
  aussi l'état de `reseau` (voisin suivi, sans gate) ; absent ou retiré : un seul site, la couche réseau ne restreint
  rien (C4 du manifeste : « sans `reseau`, un seul site »). Avec 1005, l'état publié remplacera la source.
- **D-1004-3 — Le volet d'un `GEST` se lit au registre des gestionnaires** (STORY-1002) ; absent du registre ou
  inactif : aucun dossier.
- **D-1004-4 — Les périmètres de MED (corporel) et de CPT (statuts de paiement)** sont tirés de FR-6 et de l'annexe B ;
  EXPI et EXPE voient leurs missions dans `expertises`, pas dans `sinistres`.
- **D-1004-5 — Le dossier porte un `noeudId`** (agence ou zone), donné à la déclaration ; quand `reseau` est installé,
  il doit être dans la portée d'écriture du déclarant (sinon 403) ; un dossier sans nœud n'est vu que d'une portée
  totale.
- **D-1004-6 — La portée n'est jamais lue dans le jeton** (spine `reseau` AD-5, ticket de D) ; `reseau-service` n'est
  jamais appelé sur le chemin de lecture (AD-9).
- **D-1004-7 — Les commandes du système** (numéro officiel, pièce contrôlée) ne passent pas par la portée : elles
  n'ont pas d'agent.

## Ce qui a été livré

**2026-11-17** — `prospera-sinistres-service` **#15** (`dev` `29069cc`), fusionnée en « Rebase and merge » :

- `src/modules/sinistres/portee/` : le périmètre par rôle (`perimetres-2026.1`, figé), la portée (`portee.ts`, pure),
  le read-model `sinistres_portees_reseau` et son consommateur (`sinistres-service.portee-reseau`), le service
  `PorteeDesDossiers` ; la suite de D copiée à l'octet (`conformite-portee-reseau.ts`, `f2779975…`).
- La portée appliquée aux files (dans la requête Mongo), à la lecture, à la piste, aux échéances, à la liste de choix et
  à chaque commande ; `noeudId` au dossier ; l'état de `reseau` projeté comme voisin suivi (`MODULES_VOISINS_SUIVIS`).
- Le contrat consommé `contrat/consommes/reseau.portee.changed.json` (copie de `reseau-service@91b7f63`, empreinte
  gardée dans `ORIGINE-DES-SCHEMAS.json`).
- **Node 24** : 956 unitaires sur vrai MongoDB, 19 e2e ; lint 0, build vert ; **les six cas de la suite verts sur
  MongoDB** (et en mémoire).
- **Pile `grp-c-1004`** (`sinistres` + `reseau-service`, faits de portée au contrat) :
  - sans `reseau` : un GEST matériel ne lit pas un dossier corporel (**404**) ; un GEST absent du registre ne voit rien ;
  - `reseau` installé, aucun fait : rien (files vides, 404) ; l'accueil ne déclare pas (403) ;
  - portée sur l'agence A1 : les seuls dossiers d'A1 ; une commande sur un dossier d'A2 → **404** ; sur A1 → 200 ;
    l'accueil déclare sur A1 (201), pas sur A2 (403) ;
  - portée retirée (révision 2), puis le fait de révision 1 rejoué : rien ;
  - **inscription au registre des consommateurs conformes de `reseau-service`** (les six cas, version 1.0.0) ; la
    vérification `consommateurs-conformes` d'une organisation qui installe `sinistres` : **VERT** ;
  - 0 erreur aux journaux, 0 fait écarté.
- **Rejouée sur l'image reconstruite depuis `dev`** (`29069cc`, pile `grp-c-1004d`) : même issue ; l'inscription au
  registre porte la référence `prospera-sinistres-service@29069cc`.
- ⚠️ Le premier passage a rougi une ligne de la preuve (une affectation au statut `DECLARE`, refusée à juste titre) :
  la preuve écrit désormais avec la transition 2 ; la portée, elle, était juste.

**Reste** : l'état publié remplacera `entitlement.changed` pour savoir si `reseau` est installé (STORY-1005) ; la
portée par dossier des autres services (`ged`, `expertises`, `assurance` : chacun l'applique chez lui, AD-26) ; l'accès
par dossier aux données de santé (`sinistres.acces-sante.*@1`) ; le nœud du guichet déduit de l'agent (aujourd'hui
donné à la déclaration).
