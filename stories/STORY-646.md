# STORY-646 : Où vit un test inter-services, et comment on le lance

Status: done

**Bloc :** Convergence E0 — le substrat de recette (`CONVERGENCE-RAILS-C-D-2026-09-08.md`)
**Dépôt :** `prospera-recette` (**nouveau**, frère des services) · **Points :** 5
**Prérequis :** STORY-644, STORY-645 (fusionnée / branche `MNV-645`)
**Branche :** `MNV-646` sur `prospera-recette` (base `dev`, socle `9d18cf1`)

---

## Le récit

En tant qu'**équipe**, je veux un endroit où un test qui traverse deux services puisse vivre et être
lancé, afin que les recettes croisées ne soient pas des procédures manuelles.

## Le présupposé était faux, et l'arbitrage PO l'a tranché

La fiche du 2026-09-08 comptait se brancher sur « l'espace de travail créé par STORY-268 ». Il
n'existe pas : STORY-268 a constaté qu'**il n'y a aucun monorepo** — quinze dépôts côte à côte dans
un dossier sous aucun contrôle de version, le `docker-compose.yml` racine compris — et a dupliqué son
paquet dans chaque dépôt consommateur. Un `package.json` posé à la racine n'aurait existé que sur un
poste.

**Arbitrage PO du 2026-10-29 : un nouveau dépôt `prospera-recette`**, cloné à côté des services,
dans le dossier qui porte le compose (les deux autres options — versionner la racine, ou des fichiers
non versionnés — écartées).

## Ce que le dépôt contient

| Élément | Rôle |
|---|---|
| `package.json` | **l'espace de travail npm** (`workspaces: ["paquets/*"]`) |
| `paquets/recette-croisee` | le paquet de recette : convention, pilotage de la pile, amorçage, recettes |
| `docker-compose.recette.yml` | le **profil `recette`** : surcouche du compose racine — le service `amorcage`, Mailhog (18025) et la console MinIO (19001) republiés, `NODE_ENV: production` pour kyc et catalogue |
| `README.md` | commandes, réglages, comment écrire une recette croisée |

## Critères d'acceptation — verdicts

- **AC-1 ✅** — le paquet `@prospera/recette-croisee` vit dans l'espace de travail, avec ses propres
  commandes : `npm test`, `npm run verifier`, `npm run pile`, `npm run recette`,
  `npm run pile:descendre` (relayées par la racine).
- **AC-2 ✅** — `npm run pile` lève les cinq services (auth, kyc, catalogue, notification,
  paiement) et leur infrastructure, attend la convention de disponibilité, puis **amorce** :
  conteneur jetable `amorcage` (l'amorçage de STORY-613, déjà compilé dans l'image du paiement — ni
  ts-node ni image de plus), jeton de l'opérateur plateforme obtenu par la vraie route ; si
  l'amorçage s'arrête sur la vérification d'adresse (code 2), le lien est **lu dans Mailhog** et
  l'amorçage relancé. Une commande, aucun geste humain.
- **AC-3 ✅** — le profil ne pose que des réglages : deux services (amorçage, relais de courriel),
  aucun volume, aucun client ni script de base. Une garde (`profil-de-recette.spec.ts`) relit la
  surcouche — hors commentaires — et rougit sinon.
- **AC-4 ✅** — la suite échoue **en nommant le service** : `PileIndisponible` liste chaque service
  en défaut avec ce qu'elle a vu (« `kyc-service : arrêté (code 1) — lire docker logs` »,
  « `paiement-service : /api/v1/health/live injoignable sur le port 3005` », « `le groupe Kafka
  paiement-entitlement n'existe pas` ») ; la recette a **un test par service**.
- **AC-5 ✅** — `npm test` ne lit que `src/**/*.spec.ts` (sans Docker) ; la recette a sa propre
  configuration jest et sa commande. Une garde le vérifie.

## Décisions de conception

1. **La convention de disponibilité est du code** (`src/convention.ts`), la même table que la doc
   d'amorçage de STORY-645 : `/api/v1/health` = 200 pour quatre services, **`/api/v1/health/live`**
   pour le paiement (503 voulu sur `/health`), groupes Kafka `Stable` (`paiement-kyc`,
   `paiement-identity`, `paiement-entitlement`, `notification-kyc`, `notification-entitlement`).
2. **`run amorcage` plutôt que `--profile recette up`** : les `depends_on` du conteneur jetable lèvent
   exactement les cinq services, pas les quinze du compose racine ; et `run` rend le code de sortie
   de l'amorçage (0 / 1 / 2).
3. **`pile:descendre` n'arrête que les services nommés** : la pile est partagée avec d'autres
   sessions sur ce poste ; un `stop` global couperait leurs conteneurs. Une garde le vérifie.
4. **Un build rouge arrête tout** : `up` redémarrerait sinon l'image périmée sans un mot (piège du
   2026-09-08).
5. **`RECETTE_SURCOUCHES`** : des fichiers compose de plus pour éprouver une **branche** (un
   `build.context` repointé vers un worktree) sans toucher aux checkouts partagés — c'est ainsi que
   le gate ci-dessous a éprouvé `MNV-645` avant sa fusion.
6. **Mailhog republié sur 18025** (`ports: !override`) : sur ce poste, 1025 et 8025 sont tenus par le
   Mailpit de Laragon, et un port pris empêche le conteneur de démarrer.

## La première recette croisée : le rail de STORY-644

`recette/pile.recette.ts` exécute, **depuis le conteneur du paiement et avec son jeton** (lu dans
son environnement, jamais dans le test), un appel à la route directe de la notification avec le
modèle `lien-de-paiement`, puis relit Mailhog jusqu'à trouver le courriel. C'est l'assertion que
STORY-644 rendait possible et qu'aucun dépôt ne pouvait porter seul.

## Le gate Docker du 2026-10-30 — ce que la recette a appris à la pile

La recette a servi dès son premier lancement : chaque échec y était **nommé**, et chacun a donné
un correctif.

| Passage | Ce que la recette a dit | Ce que c'était | Correctif |
|---|---|---|---|
| 1 | `ports are not available … 9001` | la console MinIO, tenue sur ce poste par Herd | profil : console republiée sur **19001** |
| 2 | `unknown blob … in history` | cache BuildKit (deux builds parallèles) | aucun — passager ; le message d'échec, lui, a été corrigé (il disait « image périmée » à tort) |
| 3 | `kyc-service : redémarre en boucle` · `platform-catalog-service : redémarre en boucle` | leur `.env` pose `NODE_ENV=development` ⇒ `pino-pretty`, absent de l'image `runtime` | profil : `NODE_ENV: production` pour ces deux-là, et rien d'autre (garde) |
| 4–6 | l'amorçage, dans le réseau du compose | trois écarts de contrat de l'amorçage | voir STORY-645 (`a664d74`) |
| — | `run --build amorcage` recréait toute la chaîne | une pile prête redevenait une pile qui démarre | `run --rm --build --no-deps amorcage` |
| 7 | **7/7** | | |

```
PASS recette/pile.recette.ts
  ✓ auth-service est prêt selon la convention de disponibilité
  ✓ kyc-service est prêt …
  ✓ platform-catalog-service est prêt …
  ✓ notification-service est prêt …
  ✓ paiement-service est prêt …          (vivacité ; /health à 503 voulu)
  ✓ l'amorçage a rendu l'organisation Money Vibes
  ✓ STORY-644 — depuis le conteneur du paiement, avec SON jeton, la route
    directe accepte et le courriel arrive
```

⚠️ **Deux défauts de la pile, laissés là où ils sont nés** (hors périmètre, nommés ici) : les `.env`
de `kyc-service` et `platform-catalog-service` sont incompatibles avec leur propre image `runtime` ;
la console MinIO publiée sur 9001 entre en conflit sur certains postes.

⚠️ **Poste** : à 0,6 Go de mémoire libre, le healthcheck de Kafka a expiré (10 s) et a fait tomber la
pile. La recette exige quelques Go libres.

## Preuves

| Contrôle | Résultat |
|---|---|
| `npm test` | 6 suites / **54 tests**, couverture ≈ 98 % des instructions |
| `npm run verifier` | typage strict + prettier : propres |
| `npm run recette` (pile réelle, `MNV-645` par `RECETTE_SURCOUCHES`) | **7/7** |

⛔ **Push bloqué** : `git push` vers `MoneyVibesGroup/prospera-recette` rend `403 — Write access to
repository not granted`. Le jeton GitHub de ce poste n'a pas d'accès en écriture à ce nouveau dépôt
(les autres dépôts acceptent). Branches prêtes en local : `main` et `dev` (`9d18cf1`), `MNV-646`
(`0ed6930`).
