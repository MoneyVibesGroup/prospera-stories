# STORY-178 : Semer l'**administrateur plateforme au démarrage** — une stack fraîche est aujourd'hui inutilisable

**Epic :** EPIC-025 — RBAC plateforme *(exploitation)*
**Réf. :** ticket §F · **AP-01** · `src/seeds/seed-platform-admin.ts` *(existe, idempotent, jamais appelé)*
**Découverte par :** AP-INT-0, en essayant simplement de se connecter à la console
**Priorité :** Must Have — ⚡ **bloque toute première installation**
**Story Points :** 2
**Statut :** À faire
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

- [ ] Les 6 critères vérifiés · `lint` 0 · couverture ≥ 90 %
- [ ] ⚡ **Vérification sur volume vierge**, pas sur la base de développement existante — c'est le
      seul scénario où le défaut se manifeste, et le vérifier sur une base déjà peuplée ne prouve
      rien
- [ ] La note de prérequis en tête de `e2e/integration-gate.spec.ts` est **retirée** côté console
- [ ] Branche `MNV-178`, PR rebase-mergée sur `dev`
