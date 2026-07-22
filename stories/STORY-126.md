# STORY-126 : Sessions d'authentification — une par appareil, listables et révocables (remplace le `refreshTokenHash` unique)

**Epic :** EPIC-002 — Authentification & sécurité du compte (auth-service)
**Réf. architecture :** `architecture-auth-service-2026-07-04.md` § jetons & rafraîchissement
**Priorité :** **Must Have** ⚠️ (corrige un **défaut de conception en place**, pas seulement un manque de fonctionnalité)
**Story Points :** 8
**Statut :** defined 📝
**Sprint :** 16 (proposé — avec le triptyque identité 123/124/125, même service, même surface de test)
**Créée le :** 2026-07-22
**Services :** `auth-service` (:3001)
**Couvre :** dette de conception + FR « sessions ouvertes » (origine : maquette FE-015, retour PO du 2026-07-22)

> **Le point dur en une phrase :** l'IdP stocke **un seul `refreshTokenHash`, scalaire, sur le document `User`**
> (`src/modules/users/schemas/user.schema.ts:40`). Il n'existe donc **aucune notion de session** — et
> **se connecter sur un second appareil invalide silencieusement le premier**. Ce n'est pas une
> fonctionnalité manquante : c'est un comportement déjà subi par tout utilisateur qui ouvre Prospera sur
> son téléphone après son ordinateur.

---

## User Story

En tant qu'**utilisateur de Prospera (cabinet ou plateforme)**,
je veux **rester connecté sur plusieurs appareils, voir lesquels sont ouverts et pouvoir en fermer un à distance**,
afin de **ne pas être déconnecté sans raison quand je change d'appareil, et de reprendre la main si je ne reconnais pas une connexion.**

---

## Description

### Contexte — vérifié dans le code, pas supposé

`user.schema.ts` porte `@Prop() refreshTokenHash?: string;` — **un champ, une valeur**. `auth.service.ts:215-221`
compare le jeton présenté à cette unique empreinte. Conséquences mesurables :

1. **Éviction silencieuse.** Le login écrase l'empreinte : l'appareil précédent voit son rafraîchissement
   refusé au prochain cycle, sans message, sans trace. L'utilisateur croit à un bug.
2. **Rien à lister.** Aucun agent utilisateur, aucune IP, aucune date de création n'est conservé ⇒ l'écran
   « Sessions ouvertes » de FE-015 n'a aucune donnée à afficher.
3. **Révocation tout-ou-rien.** `logout` efface l'empreinte ; on ne peut pas fermer *une* session
   (téléphone perdu) sans fermer *toutes* les autres.
4. **Angle mort de sécurité.** Une connexion depuis un lieu inhabituel est invisible, pour l'utilisateur
   comme pour le support.

### Ce que la story change

Le jeton de rafraîchissement cesse d'être un attribut de l'utilisateur pour devenir une **entité `Session`**
(une ligne par appareil connecté). `login` en crée une, `refresh` la fait vivre, `logout` en ferme une seule.

### Ce qu'elle ne fait pas

Pas de reconnaissance d'appareil (« nouvel appareil, confirmez par e-mail »), pas de 2FA, pas de scoring de
risque. Le drapeau « lieu inhabituel » de la maquette est **purement dérivé côté affichage** (IP différente
de la session courante) : aucune intelligence côté serveur ici.

---

## Scope

**Inclus**

- **Collection `sessions`** (Mongo) : `userId`, `tokenHash`, `userAgent`, `ip`, `createdAt`, `lastUsedAt`,
  `expiresAt`, `revokedAt?`, `revokedReason?`. Index sur `userId` + TTL sur `expiresAt`.
- **`login`** : crée une session, capte `User-Agent` et l'IP d'origine (voir Technical Notes — proxy).
- **`refresh`** : retrouve la session par empreinte, met à jour `lastUsedAt`, **rotation** de l'empreinte
  dans la même session (l'identité de session ne change pas).
- **`logout`** : révoque **la session courante seulement**.
- **`GET /users/me/sessions`** : liste des sessions actives de l'appelant, la courante marquée
  (`current: true`), triées par `lastUsedAt` décroissant.
- **`DELETE /users/me/sessions/:id`** : révoque une session ciblée (403 si elle n'appartient pas à l'appelant).
- **`DELETE /users/me/sessions`** : révoque **toutes sauf la courante**.
- **Migration** : les `refreshTokenHash` existants sont convertis en une session « héritée »
  (`userAgent: null`, `ip: null`) — personne n'est déconnecté par le déploiement.
- Retrait du champ `refreshTokenHash` du schéma `User` **après** migration.

**Hors périmètre**

- Changement de mot de passe et réinitialisation → **STORY-123** / **STORY-125** (qui devront révoquer
  *toutes* les sessions : dépendance croisée notée ci-dessous).
- Géolocalisation IP (ville/pays). L'UI affichera l'IP brute tant qu'aucune source n'est décidée — voir
  question ouverte.

---

## Acceptance Criteria

- **AC-01** — Un utilisateur connecté sur l'appareil A puis sur l'appareil B **reste connecté sur A** :
  après le login B, un `refresh` depuis A renvoie 200 (aujourd'hui : 401).
- **AC-02** — `GET /users/me/sessions` renvoie une entrée par appareil connecté, avec `userAgent`, `ip`,
  `createdAt`, `lastUsedAt`, et **exactement une** entrée `current: true`.
- **AC-03** — `DELETE /users/me/sessions/:id` sur la session de l'appareil B : le `refresh` depuis B renvoie
  **401**, celui depuis A reste **200**.
- **AC-04** — `DELETE /users/me/sessions` ferme toutes les autres et **conserve** la session appelante.
- **AC-05** — Une session d'un **autre** utilisateur ne peut être ni lue ni révoquée : **404** (et non 403 —
  on ne révèle pas l'existence de l'identifiant).
- **AC-06** — La rotation du jeton au `refresh` **ne crée pas** de nouvelle session (le nombre de sessions
  reste stable après 3 rafraîchissements).
- **AC-07** — Après migration, un utilisateur qui avait un `refreshTokenHash` valide **n'est pas déconnecté**
  et voit une session « héritée » dans la liste.
- **AC-08** — Un `logout` sur A laisse la session B active.
- **AC-09** — Les sessions expirées (TTL) disparaissent de la liste sans intervention.
- **AC-10** — `userAgent` est stocké **tronqué à 256 caractères** et jamais interprété comme du HTML par les
  consommateurs (l'UI l'affiche en texte).

---

## Technical Notes

- **IP derrière proxy** : en dev l'app tape le service en direct ; en production il y aura un ingress.
  Utiliser `X-Forwarded-For` **uniquement si** le proxy est de confiance (`app.set('trust proxy', …)`),
  sinon l'IP est falsifiable par le client. À trancher au déploiement, mais coder l'extraction dans un seul
  utilitaire testable.
- **Empreinte** : garder le hachage existant (`compareRefreshHash`, comparaison à temps constant) — on
  déplace le champ, on ne change pas la primitive.
- **Rotation** : à chaque `refresh`, remplacer `tokenHash` **dans la même ligne**. Une réutilisation d'un
  ancien jeton (rejeu) devrait révoquer la session — comportement recommandé, à confirmer.
- **Dépendance croisée 123/125** : le changement et la réinitialisation de mot de passe doivent passer de
  « effacer `refreshTokenHash` » à « révoquer toutes les sessions ». Si 126 est livrée après, prévoir le
  correctif dans la foulée — sinon la révocation redevient partielle.
- **Volumétrie** : une ligne par appareil et par utilisateur, TTL sur `expiresAt` ⇒ la collection reste petite.

---

## Dependencies

- **Bloque** : **FE-021** (écran « Sessions ouvertes ») — sans cette story, l'écran n'a rien à afficher.
- **Interagit avec** : STORY-123 (mot de passe) et STORY-125 (réinitialisation) — révocation globale.
- **Aucun prérequis** : la story est autonome dans `auth-service`.

---

## Definition of Done

- Les 10 AC passent, dont **AC-01 et AC-07 vérifiés sur deux navigateurs réels** (l'éviction silencieuse ne
  se voit pas en test unitaire).
- Migration jouée sur une base contenant des `refreshTokenHash` : aucun utilisateur déconnecté.
- OpenAPI à jour (les 3 routes + le DTO de session) — le frontend génère ses types depuis là.
- Tests : unitaires (rotation, révocation, isolation entre utilisateurs) + e2e du parcours multi-appareils.

---

## Progress Tracking

**Status History :**
- 2026-07-22 : Créée (Scrum Master) — écart **trouvé en lisant `user.schema.ts` et `auth.service.ts` sur
  `origin/dev`** pendant la conception de la maquette FE-015 « Sessions ouvertes » demandée par le PO.
  Requalifiée en cours de route : la demande était « afficher les sessions », le constat est
  « **il n'y a pas de sessions, et la connexion multi-appareils est cassée** ».

---

**Cette story a été créée avec la BMAD Method v6 — Phase 4 (Planification d'implémentation).**
