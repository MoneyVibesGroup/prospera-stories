# STORY-903 : La vérification KYC du BFF tient quand le catalogue est injoignable

Status: done

**Complexité :** petite (un dépôt)

**Épic :** EPIC-025 (exploitation de la console)
**Service :** `prospera-admin-panel-service` (BFF de la console, `:3010`)
**Plage :** groupe A (`PLAN-4-SESSIONS-2026-11-14.md` §1), n° 6 du lot de A
**Origine :** reste de **STORY-175** (constat du 2026-11-14), repris dans le §3.2 du plan.

---

## Le constat

`GET /admin/orgs` enrichit chaque ligne de la page de deux sources :
- le statut KYC, par un index qui demande **un** appel à `kyc` ;
- le nombre d'octrois actifs, par **un appel au catalogue par organisation**, lancés tous à la fois
  (`Promise.allSettled`).

Si le catalogue est injoignable (hôte non résolu), chaque appel commence par une résolution DNS. Or Node les fait
sur son pool de fils (4 par défaut). Dix résolutions qui échouent occupent ce pool pendant environ 3 secondes, et
l'appel à `kyc`, qui attend son tour pour résoudre son propre hôte, **dépasse son délai : 503 intermittent**. Une
source dégradable, le décompte des octrois, fait tomber une source dure, le KYC.

Le BFF promet l'inverse : « une source d'enrichissement en panne dégrade sa colonne, jamais la page ».

## Ce que la story livre

1. **Un coupe-circuit sur le client du catalogue.**
   - Après une **panne de transport** (aucune réponse : DNS, connexion refusée, délai dépassé), le circuit s'ouvre
     pendant `UPSTREAM_COUPE_CIRCUIT_MS` (10 s par défaut).
   - Tant qu'il est ouvert, une lecture du catalogue échoue **immédiatement, sans DNS ni réseau**, et la colonne
     est signalée `unavailable`.
   - Au terme du délai, **un seul** appel d'essai passe : s'il réussit, le circuit se referme.
   - Une réponse de l'amont, même un 5xx, ne l'ouvre pas : l'hôte a répondu, le DNS n'est pas en cause.
   - L'ouverture et la fermeture sont journalisées, une fois chacune.
2. **Un fan-out borné** pour le comptage des octrois : au plus 2 appels en vol. Le circuit s'ouvre donc au plus
   après 2 résolutions perdues, et le pool reste libre pour `kyc`.
3. `kyc` et `auth` n'ont **pas** de coupe-circuit : ce sont des dépendances dures de leurs vues, et les couper
   masquerait leur rétablissement.
4. Les écritures vers le catalogue (octroyer, révoquer) ne passent **pas** par le coupe-circuit : un refus d'écrire
   doit venir de l'amont, jamais d'un état local du BFF.

## Critères d'acceptation

- **AC-1** : un coupe-circuit ouvert refuse sans appeler l'amont, et le refus se classe `unavailable`.
- **AC-2** : une panne de transport ouvre le circuit ; une réponse HTTP (4xx, 5xx) ne l'ouvre pas.
- **AC-3** : au terme du délai, un seul appel d'essai passe. Une réussite referme le circuit ; un échec le rouvre
  pour un nouveau délai.
- **AC-4** : sur une page de 10 organisations dont le catalogue ne répond pas, **au plus 2** appels au catalogue
  partent. La colonne des octrois est `unavailable`, le statut KYC est servi, et la réponse est 200.
- **AC-5 (Docker)** : sur une pile où le catalogue est **arrêté**, 20 appels successifs à `GET /admin/orgs`
  rendent tous 200, avec `sources.kyc = ok` et `sources.entitlements = unavailable`. Aucun 503.

## Definition of Done

- [x] Tests, lint et build verts ; `docker compose up` du BFF sur une image reconstruite.
- [x] Mutation-test : retirer la borne du fan-out, ou le coupe-circuit, fait rougir AC-4.
- [x] AC-5 joué sur la pile, catalogue arrêté.

---

## Livraison (2026-11-15)

**PR :** MoneyVibesGroup/prospera-admin-panel-service#33, fusionnée sur `dev` (`b10fedd`). L'arbre Git fusionné est
identique à l'arbre éprouvé.

### Décisions (contestables ; règle de l'utilisateur : « appliquer ce que je recommande »)

- **D-903-1 : seule une panne de TRANSPORT ouvre le circuit.** Une réponse de l'amont, même un 5xx, prouve que
  l'hôte se résout et répond : le pool DNS n'est pas en cause, et couper masquerait un amont simplement en erreur.
- **D-903-2 : le coupe-circuit ne protège que le catalogue, et seulement en lecture.** `kyc` et `auth` sont des
  dépendances dures, que leur vue doit voir tomber et revenir. Une écriture refusée par un état local du BFF
  mentirait à l'opérateur.
- **D-903-3 : fan-out borné à 2.** Le pool de fils de Node compte 4 fils, partagés par toutes les résolutions DNS.
  Deux restent toujours libres pour `kyc` et `auth`. Monter `UV_THREADPOOL_SIZE` aurait déplacé le seuil sans
  supprimer la cause.

### Preuves

- Unitaires **519/519** (41 suites) ; lint et build verts.
- **Mutations** :
  - porter la borne à 100 fait rougir AC-4. Un premier essai ne l'avait **pas** attrapée, parce que le test comparait
    les appels à la constante qu'il testait ; la borne est maintenant figée dans le test ;
  - retirer le coupe-circuit du client du catalogue fait rougir son test.
- **AC-5, Docker** (pile `grp-a` : auth, kyc, BFF ; catalogue **non levé**, hôte non résolu ; 12 cabinets inscrits
  par l'API, 13 puis 20 lignes) :
  - **20 appels sur 20** rendent `200`, avec `kyc=ok` et `entitlements=unavailable` ;
  - le 1er appel prend 2,7 s (deux résolutions perdues), les suivants **≈ 35 ms**, circuit ouvert ;
  - `Amont « platform-catalog-service » injoignable : coupe-circuit OUVERT pour 10000 ms.` est journalisé une seule
    fois.
- **Témoin sur l'image de `dev`** (sans la correction ; modifications mises de côté et image reconstruite, après un
  premier témoin invalide qui embarquait le code de la branche) : le 503 **ne se reproduit pas** en 20 appels sur ce
  poste. Mais **chaque** appel coûte ≈ 3,1 s, pour un délai `kyc` de 3 s. C'est cette marge quasi nulle qui rendait
  le 503 intermittent.
