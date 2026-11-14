# STORY-178 : Semer l'**administrateur plateforme au démarrage** — une stack fraîche est aujourd'hui inutilisable

**Epic :** EPIC-025 — RBAC plateforme *(exploitation)*
**Réf. :** ticket §F · **AP-01** · `src/seeds/seed-platform-admin.ts` *(existe, idempotent, jamais appelé)*
**Découverte par :** AP-INT-0, en essayant simplement de se connecter à la console
**Priorité :** Must Have — ⚡ **bloque toute première installation**
**Story Points :** 2
**Statut :** En revue (2026-11-14)
**Créée le :** 2026-08-04
**Sprint :** 21
**Service :** `auth-service` (`:3001`)

---

## Le constat

`seedPlatformAdmin` est un **script autonome** (`npm run seed:admin`). **Aucun service ne l'appelle
au démarrage.**

Vérifié le 2026-08-03 sur la base de développement : **49 utilisateurs** issus de campagnes de
tests, et **`admin@prospera.local` n'existait pas** — alors que `PLATFORM_ADMIN_EMAIL` et
`PLATFORM_ADMIN_PASSWORD` sont renseignés dans le compose depuis des mois, et que les **rôles**
système, eux, sont bien semés au boot (`PlatformRolesSeedService`, juste à côté).

**Conséquence :** une stack fraîche démarre **sans aucun administrateur plateforme**. La console est
donc inutilisable à l'installation.

> ⚡ **Et rien ne le dit.** L'écran de login répond « identifiants invalides » — le message exact
> qu'on obtiendrait avec une faute de frappe. Le diagnostic part donc chercher un mauvais mot de
> passe, puis la configuration, puis le backend, dans cet ordre. C'est ce qui s'est passé.

## Ce qui rend la correction sûre

**Le seed est déjà idempotent** : il fait un `upsert` et journalise explicitement « créé » ou « mis
à jour ». L'appeler à chaque démarrage ne crée aucun doublon — c'est exactement ce que fait déjà
`PlatformRolesSeedService`. Il n'y a rien à réécrire, seulement à brancher.

---

## Périmètre

- Appel du seed au démarrage, **sur le même patron** que les rôles système, avec le même style de
  log — un opérateur doit lire dans les logs de boot si l'administrateur a été créé ou retrouvé.
- ⚠️ **Ne rien semer si `PLATFORM_ADMIN_EMAIL`/`PASSWORD` sont absents** : journaliser un
  avertissement explicite et **continuer**. Un service qui refuse de démarrer parce qu'une variable
  optionnelle manque serait pire que le défaut qu'on corrige.
- ⚠️ **Aucune valeur par défaut dans le code.** En production, un mot de passe d'administrateur
  codé en dur serait un trou de sécurité ; les défauts restent dans le compose de développement, où
  ils sont visibles et remplaçables.

### Hors périmètre

Rotation ou expiration du mot de passe initial — autre question, autre story.

---

## Critères d'acceptation

1. Au démarrage, l'administrateur est créé s'il est absent, retrouvé sinon — journalisé dans les
   deux cas.
2. Rejouable : deux démarrages consécutifs ne créent aucun doublon.
3. Variables absentes ⇒ **avertissement** et démarrage normal ; aucun mot de passe par défaut dans
   le code.
4. ⚡ **Preuve sur base VIERGE** : `docker compose down -v` puis `up`, et la connexion à la console
   fonctionne **sans aucune commande manuelle**.
5. Le compte semé porte bien `PLATFORM_ADMIN` et ses permissions dans le jeton.
6. Non-régression : le seed manuel (`npm run seed:admin`) continue de fonctionner.

---

## Definition of Done

- [x] Les 6 critères vérifiés · `lint` 0 · couverture ≥ 90 %
- [x] ⚡ **Vérification sur volume vierge**, pas sur la base de développement existante — c'est le
      seul scénario où le défaut se manifeste, et le vérifier sur une base déjà peuplée ne prouve
      rien
- [x] La note de prérequis en tête de `e2e/integration-gate.spec.ts` est **retirée** côté console
- [ ] Branche `MNV-178`, PR rebase-mergée sur `dev`

---

## Suivi — 2026-11-14 (livrée, en revue)

**PR :** MoneyVibesGroup/prospera-auth-service#35 (code) · MoneyVibesGroup/frontend-admin-panel#25 (e2e de la console, à fusionner après #35).

### ⚡ Décision prise contre « il n'y a qu'à le brancher » : CRÉATION SEULE au démarrage

`seedPlatformAdmin` **réécrit** le mot de passe, réactive le compte, efface sa suppression et lui
rend `PLATFORM_ADMIN` à chaque appel. Branché tel quel au démarrage, un simple redémarrage aurait
annulé le changement de mot de passe de l'administrateur (le mot de passe du compose serait resté
valable pour toujours) et ressuscité un compte suspendu après une compromission. Le critère 1 dit
« créé s'il est absent, **retrouvé** sinon » : `PlatformAdminSeedService` fait exactement cela.

| Ce que le démarrage trouve | Ce qu'il fait |
|---|---|
| aucun compte | le **crée** (`PLATFORM_ADMIN`, actif, e-mail vérifié) |
| administrateur actif | **retrouvé**, rien n'est écrit |
| compte suspendu, supprimé ou simple locataire | **conflit nommé** au journal, rien n'est écrit |
| variables absentes ou vides | avertissement, démarrage normal |

`npm run seed:admin` reste le geste délibéré pour rétablir un compte (critère 6, inchangé).

### Preuves

- Unitaires : 13 tests ; le double de `UsersService` est une petite base en mémoire (leçon de
  STORY-180 : un double figé ne garde pas l'ordre lecture/écriture). Suite complète 1 228/1 229 ;
  le seul échec est un test de durée (`svg-sanitizer` < 2 s) pendant un build docker parallèle,
  vert rejoué seul. Nouveau fichier : 100 % des lignes. Garde de câblage (STORY-643) verte.
- **Docker sur volumes vierges** (projet compose à part, `down -v`) : ① « créé » au premier
  démarrage ; ② connexion 200 sans aucune commande, jeton `roles: [PLATFORM_ADMIN]` + 17
  permissions ; ③ mot de passe changé en base puis redémarrage ⇒ « retrouvé (compte inchangé) »,
  1 seul compte, le mot de passe du compose est refusé (401) ; ④ `node dist/seeds/seed-platform-admin.js`
  ⇒ 200 de nouveau ; ⑤ compte `SUSPENDED` puis redémarrage ⇒ conflit nommé, il reste suspendu ;
  ⑥ variables vides ⇒ avertissement nommant les deux, conteneur `healthy`.

### Restes et pièges

- ⚠️ Le compose racine écrit `${PLATFORM_ADMIN_EMAIL:-…}` : une variable **vide** y réactive le
  défaut. Le cas ⑥ a été joué par `docker compose run -e PLATFORM_ADMIN_EMAIL=`. Passer à
  `${VAR-…}` (comme `DEMO_ORG_*`) se fait dans le compose racine, qui n'est dans aucun dépôt.
- Le script manuel monte `AppModule` : le semis du démarrage s'y exécute avant lui. Sans effet
  (création seule), mais sur une base vide le script journalise « mis à jour » au lieu de « créé ».
- Sur ce poste, Herd tient les ports 9001 et 8025 : une pile de vérification à part doit retirer
  les ports publiés de MinIO et Mailhog (surcouche `ports: !reset []`).
