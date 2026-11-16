# STORY-1032 : Zones et agences

Status: done

**Complexité :** moyenne (deux spécialisations, codes stables, fermeture refusée et nommée, droits du module)

**Épic :** EPIC-045 (zones et agences : deux agrégats, jamais un lieu générique)
**Dépôt :** `MoneyVibesGroup/reseau-service`
**Plage :** groupe D, n° 3 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §5). Dépend de STORY-1031.

---

## Pourquoi

Le réseau d'une organisation commence par ses **zones** (des périmètres) et ses **agences** (des lieux). Ce sont deux
objets différents (AD-1), chacun repéré par un **code stable** que d'autres modules garderont longtemps (AD-3). On
**ferme**, on ne supprime jamais, et une fermeture refusée doit dire **ce qui l'empêche**.

## Ce qui doit être vrai à la fin (plan lot 2, §5, n° 3)

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | Créer une zone (code, nom, type propre à l'organisation, localités déclarées) et une agence (adresse, géolocalisation, horaires, calendrier de fermetures, paramètres opérationnels) | intégration HTTP |
| AC-2 | **Code jamais réattribué** : unique dans l'organisation, nœuds fermés compris ; `CODE_DEJA_ATTRIBUE` ne laisse rien d'écrit | intégration (aucun nœud ni fait après le refus) |
| AC-3 | Une agence garde le code du cœur de l'IMF s'il est fourni, sinon Prospera attribue `AG-0001`… (amendement microfinance du 2026-11-13) | intégration |
| AC-4 | **Fermeture sans suppression** : aucune route `DELETE` ; la fermeture est refusée `FERMETURE_REFUSEE` tant qu'un enfant est ouvert, avec `details.empechements` (nature, id, code, nom) ; un nœud fermé reste lisible et ne se modifie plus | intégration, invariant des routes |
| AC-5 | **Montants entiers avec leur devise** : un paramètre monétaire est `{ valeur entière, devise }` ; `1500.5 XOF` est refusé `MONTANT_NON_ENTIER`, jamais arrondi | unitaires, intégration |
| AC-6 | Faits `reseau.noeud.created@1` et `reseau.noeud.closed@1` écrits dans l'outbox, dans la transaction, avec l'identifiant, le rang et la version de découpage | intégration |
| AC-7 | Droits du module : les lectures exigent `reseau:noeud:consulter`, les écritures `reseau:noeud:modifier` ; refus `DROIT_INSUFFISANT` | unitaires, intégration, invariant des routes |

## Décisions retenues par défaut (contestables)

- **D-1032-1 — Le nœud porte le code ; zone et agence en sont les spécialisations** (spine, Structural Seed :
  « Zone et Agence en sont deux spécialisations »). Collections `noeuds`, `zones`, `agences`. Aucun objet « lieu »
  partagé (AD-1).
- **D-1032-2 — Les droits se déduisent du rôle exercé**, par une table du service : `TENANT_ADMIN` a les cinq droits,
  `TENANT_USER` consulte. Les droits hors du jeton (B-949) et les rôles métier du distributeur (STORY-942, 166)
  remplaceront ou compléteront la table. Garde `GardeDesDroits` en dernier maillon de la chaîne globale.
- **D-1032-3 — Un parent est permis dès la création** (un nœud ouvert de la même organisation) : c'est ce qui rend la
  fermeture refusable ici. La profondeur, l'anti-cycle, le déplacement et le chemin sont STORY-1033.
- **D-1032-4 — Codes** : majuscules, chiffres, tirets, 32 caractères au plus ; normalisés en majuscules (deux casses
  ne font pas deux codes). Code absent : Prospera attribue `ZN-0001` / `AG-0001`, en sautant un code déjà pris à la
  main. L'amendement microfinance ne vise que l'agence ; le même mécanisme sert la zone.
- **D-1032-5 — Le parent est « touché » dans la transaction de son enfant** (`revisionDesEnfants`) : une fermeture
  concurrente du parent entre en conflit d'écriture et se rejoue sur l'état neuf. Pas d'enfant sous un parent qui se
  ferme.
- **D-1032-6 — Lectures selon le manifeste** : `GET /api/v1/noeuds` (filtres `nature`, `statut`) et
  `GET /api/v1/noeuds/{noeudId}` ; écritures `POST /zones`, `PATCH /zones/{id}`, `POST /agences`,
  `PATCH /agences/{id}`, `POST /noeuds/{id}/fermeture`. Un invariant vérifie que chaque lecture est déclarée au
  manifeste (`routesLectureSeule`).
- **D-1032-7 — La version de découpage vaut 1** dans les faits tant qu'aucun redécoupage n'existe ; STORY-1038 la
  versionne.
- **D-1032-8 — Pas de fait pour une modification** (nom, type, adresse…) : le manifeste ne déclare que
  `created`, `moved`, `closed`. Le rang monte à chaque écriture et voyage dans le fait suivant.
- **D-1032-9 — Le journal d'audit** des écritures du réseau (AD-14) vient avec sa route de lecture (STORY-1041).

## Preuves

- Stage `verification` (Node 24) : lint 0 ; **40 suites, 381 tests** unitaires ; **13 e2e** ; build.
- MongoDB réel, banc HTTP avec la vraie chaîne de gardes : **17 tests** (création, codes, doublon sans rien écrit, même
  code dans une autre organisation, montant à décimales, fermeture refusée nommée puis permise, nœud fermé figé,
  nature incompatible, cloisonnement, organisation dans le corps refusée, droits, lecture seule à l'échéance) ;
  **29** tests d'intégration au total.
- Défaut trouvé par la preuve et corrigé avant fusion : le banc fermait l'application avant de vider la base.
- Mutation : index unique `(organisationId, code)` retiré ⇒ 2 rouges.
- Pile `grp-d` : service `healthy`, 25 routes montées (tête de pile) ; recette depuis `origin/dev` (b12a988, volumes
  neufs, image reconstruite) : `healthy`, **62/62** tests d'intégration des stories 1031 → 1035.
- PR reseau-service#3, `dev` e96d5da.
