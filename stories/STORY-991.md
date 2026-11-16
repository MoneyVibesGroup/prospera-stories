# STORY-991 : les faits de l'échange et du dossier — outbox, schémas au registre classés, fraîcheur

Status: done

**Complexité :** grande (deux outbox, quatorze faits, leurs schémas classés au registre `classification-sante`, la
fraîcheur par objet et par transport)

**Épics :** EPIC-203 (l'échange avec le logiciel de la compagnie), EPIC-205 (le dossier)
**Dépôts :** `prospera-liaison-assureur-service`, `prospera-sinistres-service`, `prospera-plateforme` (dossiers de C :
`contrats/assurance/`, `classification-sante/`)
**Plage :** groupe C, n° 2 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §4).

---

## Pourquoi

`liaison-assureur` tient les projections du logiciel de la compagnie (LC), le numéro officiel, les envois et les
écarts ; `sinistres` tient le dossier. Les autres modules ne lisent jamais leurs bases : ils lisent leurs **faits**
(spine assurance AD-16, liste fermée des faits et de leurs consommateurs). Le premier consommateur arrive juste après
(`assurance`, STORY-993, copie de lecture des polices). Chaque fait passe par une **outbox** écrite dans la transaction
de l'objet (AD-16 : le fait et l'objet ensemble, même version), et chaque champ de chaque schéma est **classé** au
registre `classification-sante` avant d'être publié (AD-23 : aucun champ de santé, aucune donnée personnelle directe).

La **fraîcheur** (FR-201 ; AD-1) est calculée par `liaison-assureur` seul, par objet et par transport, et publiée :
elle dit à chaque écran depuis quand la donnée du LC est lue, et quand elle est périmée.

**Source** : spine assurance AD-1, AD-16, AD-23, AD-27 ; PRD FR-201, annexe C, annexe D (`echange.fraicheur_*`,
`echange.perime_facteur`) ; manifestes `liaison-assureur` et `sinistres` (C5).

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | **Deux outbox** (`socle_outbox`, relais avec bail Mongo, client Confluent, en-têtes `eventId` et `schemaVersion`, topics publiés créés avant la première publication) : un fait est écrit **dans la même transaction** que l'objet qu'il décrit, ou pas du tout | tests ; vrai MongoDB |
| AC-2 | **`liaison-assureur` publie** : `assure.recu`, `police.recue`, `garantie.recue`, `prime.recue`, `intermediaire.recu`, `coassurance.recue`, `produit.recu`, `sinistre-existant.recu` (une nouvelle version intégrée) ; `numero-sinistre.attribue` ; `envoi.etat` (état absolu de l'envoi) ; `ecart.ouvert`, `ecart.resolu` ; `fraicheur.changed` — **clés, identifiants, empreintes et états seulement** | tests ; pile |
| AC-3 | **`sinistres` publie `sinistres.dossier.changed@1`** (état absolu : statut, version, références) à la création, à chaque transition et à chaque suspension ; un refus ne publie rien | tests ; pile |
| AC-4 | **Les schémas** (JSON Schema draft-07, `title` = topic, sujet `<topic>-value`, BACKWARD) vivent dans `prospera-plateforme/contrats/assurance/<module>/` et sont copiés à l'octet dans chaque service ; **chaque champ est classé** au registre `classification-sante` (`champsOrdinaires` de `sinistres` et `liaison-assureur`) ; la garde passe ; un champ de santé ou une donnée personnelle ajoutés font échouer le test | tests ; Karapace réel |
| AC-5 | **La fraîcheur** par objet et par transport : dernière lecture **valide**, seuil (5 min par l'API, 24 h par fichiers), `FRAICHE`, `PERIMEE` au-delà du double, `JAMAIS_LUE` ; « LC indisponible depuis » quand aucune lecture valide depuis le double ; `GET …/echange/fraicheur` ; `fraicheur.changed@1` publié à chaque changement d'état | tests ; pile |
| AC-6 | Suites vertes sous Node 24, lint 0, build ; la pile démarre ; les faits arrivent sur Kafka et leurs schémas au Karapace de la pile | pile `grp-c` |

## Décisions retenues par défaut (contestables)

- **D-991-1 — La liste « à saisir » (C-18) passe à STORY-992**, avec le circuit qui continue quand le LC est muet ou
  ne reçoit pas, la voie `SAISIE_MANUELLE` et le numéro officiel : c'est le même sujet. Son fait
  (`liste-a-saisir.changed@1`) et `sans-numero.alerte@1` partent avec elle ; `document.recu@1` attend le point
  d'import de `ged`.
- **D-991-2 — `sinistres.dossier.changed@1` part maintenant**, pour ses consommateurs de la liste fermée (`ged`,
  `expertises`) et pour l'écran (D-989-6). **Question au PO** : C-17 (rejet, sans suite, réouverture vers le LC) n'a
  pas de fait source pour `liaison-assureur` ; amender AD-16 pour qu'il lise ce fait (recommandé) se décide avec 992.
- **D-991-3 — La graphie des sujets** : topic sans `@1` (`liaison-assureur.police.recue`), version dans l'enveloppe et
  l'en-tête `schemaVersion`, sujet `<topic>-value` (comme le catalogue et le réseau, D-1031-4). D-983-6 citait
  `…@1-value` : la garde ne lit que le premier segment, rien ne change pour elle.
- **D-991-4 — Les transactions de `liaison-assureur`** passent par le stockage local asynchrone de Mongoose
  (`transactionAsyncLocalStorage`) : chaque opération lancée dans `connexion.transaction()` y prend la session sans la
  passer à la main, sans réécrire les dépôts. `sinistres` garde ses sessions explicites.
- **D-991-5 — La fraîcheur des fichiers est de 24 h** (FR-201, spine AD-1), paramétrable ; `seuils-fraicheur@1`
  (Connecteurs, B) servira l'affichage de la coque, sans changer ce calcul.
- **D-991-6 — `rang`** (manifeste C5) = la version de l'objet chez Prospera, croissante par clé.

## Ce qui a été livré

**2026-11-16** — trois PR fusionnées en « Rebase and merge » :

- `prospera-plateforme` **#10** (`dev` `a7da946`) : `contrats/assurance/liaison-assureur/` (14 schémas) et
  `contrats/assurance/sinistres/dossier.changed.schema.json` ; `champsOrdinaires` de `liaison-assureur` (29) et de
  `sinistres` (9) au registre `classification-sante` ; 319/319, le registre rejoue les 35 contrats de C ; trois mutations
  (champ de santé, téléphone, champ non classé) rougissent la suite.
- `prospera-liaison-assureur-service` **#3** (`dev` `1e0ad73`) : outbox, dépôts qui publient (l'objet et son fait dans
  la même transaction), fraîcheur et `GET …/echange/fraicheur`, schémas copiés à l'octet, `schemas:enregistrer`.
  Node 24 : 447 unitaires + 21 e2e, lint 0, build.
- `prospera-sinistres-service` **#5** (`dev` `3aa085b`) : outbox, `sinistres.dossier.changed@1` à la création, à chaque
  transition et à chaque suspension. Node 24 : 750 unitaires (MongoDB réel) + 19 e2e, lint 0, build.
- **Pile `grp-c` avec un Karapace réel** :
  - `sinistres` : trois `dossier.changed` sur Kafka (clé `organisationId`, en-têtes `eventId` et `schemaVersion`) ;
    schéma enregistré BACKWARD ; garde `classification-sante` contre Karapace : 0 refus, et un sujet portant
    `tauxIncapacite` refusé (`CHAMP_SANTE`, sortie 1).
  - `liaison-assureur` avec le LC fictif : le jeu réduit relevé → **5 189 faits** (5 180 projections + 9 fraîcheurs),
    autant de messages sur Kafka, 0 échec ; une déclaration → `envoi.etat` `A_ENVOYER` → `ENVOYE` → `ACCEPTE` et
    `numero-sinistre.attribue` ; aucune donnée du déclarant dans un fait ; le jeu republié et relevé : aucun fait de
    plus ; 14 sujets enregistrés, garde : 0 refus.
  - Images reconstruites depuis `dev` : `sinistres` sain, trois `dossier.changed` sur Kafka ; `liaison-assureur` avec le LC fictif : 5 180 projections → 5 189 faits publiés, 0 en attente, fraîcheur FRAICHE ; aucune erreur.
- **Défauts trouvés et corrigés en route** : l'étage `verification` des Dockerfile ne copiait ni `contrat/` ni
  `scripts/` (le test du contrat ne s'y jouait pas) ; mon `prettier --write src` avait reformaté les copies à l'octet du
  contrat d'échange (restaurées, Prettier ne passe plus que sur les `.ts`).

**Reste** : la liste « à saisir », `liste-a-saisir.changed@1` et `sans-numero.alerte@1` (STORY-992, D-991-1) ;
`document.recu@1` avec `ged` ; ⚠️ **le coût d'une transaction par ligne** : le jeu réduit s'intègre en 106 s contre 29 s
avant ; regrouper les écritures par lot avant la reprise du jeu complet (209 000 lignes) ; la question au PO de
D-991-2 (C-17).
