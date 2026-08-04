# STORY-187 : **Provisionner un vertical** en une opération — reprise et trace comprises

**Epic :** EPIC-025 — RBAC plateforme *(exploitation de la console)*
**Réf. :** **AP-06** *(assistant de provisioning — AC 3 et 4)* · **STORY-033** *(entitlements grant/revoke)* · **STORY-034** *(`entitlement.changed`)* · **STORY-171** *(le vertical porté par l'organisation)* · `architecture-prospera-ecosystem-2026-07-04.md` §P8
**Découverte par :** revue de la maquette AP-06 *(commit `d66e1e5`)* confrontée au contrat généré, 2026-08-04
**Priorité :** Should Have
**Story Points :** 8
**Statut :** À faire
**Créée le :** 2026-08-04
**Sprint :** 21
**Service :** `prospera-admin-panel-service` (`:3010`) — 1 dépôt, 1 branche, 1 PR
**Branche :** `MNV-187`

---

## Le constat

AP-06 est **maquettée et validée** *(cinq étapes : vertical → pack proposé → pré-requis KYC →
exécution → récapitulatif)*. Ses critères d'acceptation 3 et 4 demandent :

> « Exécution = **séquence** d'octrois d'entitlements ; récapitulatif des modules activés ; **échec
> partiel géré (idempotence/reprise)**. »
> « **Trace de l'action** (auteur/horodatage/cible) si l'API la fournit. »

**L'API ne fournit ni l'une ni l'autre.** Il n'existe qu'un `PUT /catalog/entitlements/:orgId/:moduleCode`,
unitaire. Donc, aujourd'hui, « activer le vertical Distribution » = **six `PUT` émis depuis un
navigateur**, dans une boucle `for`, sans rien autour.

**Ce que ça donne concrètement :**

| Ce qui arrive | Ce qui se passe |
|---|---|
| L'onglet est fermé après le 3ᵉ octroi sur 6 | 3 droits posés, 3 non. **Aucune trace de l'intention.** Personne ne saura jamais qu'un provisioning a été tenté |
| Le 4ᵉ échoue *(référentiel non conforme)* | La maquette propose « Reprendre » — mais la reprise **n'existe que dans la mémoire de l'onglet**. Rafraîchir la page perd la liste des échecs |
| Un audit demande qui a ouvert ce client | Six `grantedBy` isolés, **aucun lien entre eux**, aucun « pourquoi ». Le vertical, qui est **la** décision, n'est écrit nulle part |

> ⚡ **L'idempotence amont ne suffit pas, et c'est le cœur du sujet.** `PUT` est bien idempotent :
> rejouer ne duplique pas. Mais l'idempotence garantit qu'**un** appel rejoué est sans danger — elle
> ne dit rien de **la séquence**. Rien ne sait qu'elle a existé, où elle s'est arrêtée, ni ce qu'il
> reste à faire. La maquette a raison de montrer la reprise ; elle n'a simplement rien pour la tenir.

---

## Pourquoi une opération, et pas une transaction

Deux réflexes seraient faux ici, et il vaut mieux les écarter tout de suite :

**① « Il faut du tout-ou-rien. »** Non. Trois octrois réussis sont **trois octrois réels et utiles**
— le client peut déjà travailler avec. Un rollback annulerait du travail valide pour la seule
satisfaction d'un état propre, et forcerait l'admin à **re-décider ce qui est déjà décidé**. La
maquette a tranché dans le bon sens : *« l'échec partiel ne perd pas le travail fait »*.

**② « Il suffit que le front retienne les échecs. »** Non plus : un état qui ne survit pas à un
rafraîchissement n'est pas un état, c'est un affichage. Et il ne répond à **aucune** question
d'audit.

⇒ Ce qu'il faut est **une opération persistée** : l'intention *(qui, quand, quelle org, quel
vertical)* et le sort **de chaque ligne**. La reprise devient alors une lecture — pas une mémoire.

---

## Périmètre

### 1. `POST /api/v1/admin/orgs/:orgId/provisioning`

**Corps :** `{ vertical: string, modules: [{ moduleCode, versionCode, referentiel? }] }`

⚠️ **Le pack vient du client, pas du serveur.** La composition d'un vertical est une **décision
produit** qui vit en config front *(`vertical-packs.ts`, AP-06 AC 1 : « packs config-driven »)*. La
dupliquer côté serveur créerait deux vérités qui divergeront au premier ajout de module. Le serveur
**exécute et trace** ; il ne décide pas du contenu.

**Ce qu'il fait :**

- **Vérifie le pré-requis** : KYC `APPROVED`. Sinon **409**, avec le statut réel dans le corps —
  l'écran doit pouvoir dire *lequel* et renvoyer vers la revue *(AP-06 AC 2)*.
- **Crée l'opération** *(`PENDING`)*, puis exécute les lignes **séquentiellement**.
- **Répond `207 Multi-Status`** avec le sort de chaque ligne :
  `created` · `already` *(le `PUT` a répondu 200 — déjà octroyé)* · `failed` *(avec le motif amont)*
  · `skipped` *(module non octroyable — voir plus bas)*.

⚡ **`already` est un statut de succès, distinct de `created`.** C'est ce qui rend l'idempotence
**visible**, et la maquette en a fait son premier parti pris : *« chaque ligne dit, AVANT exécution,
si elle sera créée ou ignorée »*. Les confondre ferait lire un ré-octroi comme un échec silencieux.

⚡ **`skipped` n'est pas `failed`.** Un module annoncé mais non livré *(2 modules sur 18 le sont)*
n'est pas une erreur de l'admin, c'est un état du produit. Le compter en rouge accuserait
l'utilisateur d'une décision qui n'est pas la sienne — second parti pris de la maquette, et il a
raison.

### 2. `GET /api/v1/admin/orgs/:orgId/provisioning/:id`

Relire l'opération et **le sort de chaque ligne**. C'est ce qui fait survivre la reprise à un
rafraîchissement, et ce qui répond à l'audit.

### 3. `POST …/provisioning/:id/retry`

**Rejoue uniquement les lignes `failed`.** Pas les `created`, pas les `already`, pas les `skipped`.

⚡ Le `PUT` amont étant idempotent, rejouer une ligne réussie serait **inoffensif** — et ce serait
quand même une faute : le récapitulatif dirait « 6 octroyés » sur une reprise qui n'a rien fait de
neuf, et l'admin n'apprendrait rien.

### 4. La trace — l'objet `ProvisioningOperation`

`{ id, organizationId, vertical, requestedBy, requestedAt, status, lines[], completedAt? }`

`status` : `PENDING` · `PARTIAL` · `COMPLETED` · `FAILED`.

⚡ **`vertical` est le champ qui justifie tout le reste.** Six `grantedBy` isolés disent *quels
droits* ont été posés ; seule l'opération dit **pourquoi** — « on a ouvert un cabinet ». C'est la
seule réponse possible à « qui a activé ce client, et sur quelle décision ». `AP-06 AC 4` disait
« si l'API la fournit » : cette story fait qu'elle la fournit.

⚠️ **`requestedBy` vient du JWT, jamais du corps.** Un auteur qu'on peut se choisir n'est pas une
trace.

### 5. Autorisation

Permission **`entitlement:grant`** — c'est ce que l'opération fait, en série. ⚠️ **Pas de permission
neuve** *(catalogue figé, D15)* : provisionner n'est pas un droit d'une autre nature qu'octroyer.

### Hors périmètre

- **La composition des packs** *(quels modules pour quel vertical)* — config front, cf. §1.
- **Le déploiement d'infrastructure** *(instance dédiée pour une IMF)* — hors v1, cadré JIT, dit
  explicitement par AP-06.
- **Le dé-provisionnement groupé.** Révoquer en masse est un geste **bien plus dangereux** que
  d'octroyer, et rien ne le demande aujourd'hui. À ouvrir séparément, avec ses propres garde-fous —
  pas en miroir automatique de celle-ci.
- **La reprise automatique** *(rejouer sans qu'on le demande)*. La reprise est **déclenchée par un
  humain** : une opération qui se relance seule sur un échec métier boucle.

---

## Critères d'acceptation

1. `POST …/provisioning` sur un KYC non approuvé répond **409** en nommant le statut réel ; **aucun**
   droit n'est posé.
2. Une exécution nominale pose les droits et répond **207**, chaque ligne portant son sort.
3. ⚡ **`already` est distingué de `created`** : provisionner deux fois de suite le même vertical
   renvoie 0 `created` et N `already` — **et ne duplique rien**.
4. ⚡ **`skipped` est distingué de `failed`** : un module non octroyable n'est pas compté en échec et
   **ne bloque pas** les lignes suivantes.
5. Un échec au milieu de la séquence **n'annule pas** les octrois déjà posés *(vérifié : 2 posés,
   3 en échec ⇒ les 2 sont bien en base)*.
6. `GET …/provisioning/:id` relit l'opération **après redémarrage du service** — la reprise ne dépend
   d'aucun état en mémoire.
7. ⚡ `retry` rejoue **exactement** les lignes `failed` — vérifié par le scénario de la maquette :
   2 octroyés + 3 échecs, puis **5 octroyés** après reprise, et **pas 8**.
8. `requestedBy` provient du JWT ; un `requestedBy` envoyé dans le corps est **ignoré ou refusé**,
   jamais retenu.
9. **403** sans `entitlement:grant`.
10. Chaque octroi émet `entitlement.changed` **comme un octroi unitaire** — l'opération groupée ne
    change pas le contrat d'événement, sinon les read-models aval devraient la connaître.

---

## Definition of Done

- [ ] Les 10 critères vérifiés · `lint` 0 · couverture ≥ 90 %
- [ ] **Vérification docker, les quatre scénarios de la maquette** : nominal · KYC non approuvé ·
      déjà provisionné · échec partiel **puis reprise**
- [ ] ⚡ **Preuve croisée DG-1** : après provisioning, les modules apparaissent côté app cliente —
      c'est la seule preuve que la séquence a réellement allumé quelque chose
- [ ] ⚡ **AP-06 débloquée** : ses AC 3 et 4 ont un amont, et la phase 2 *(implémentation de
      l'assistant)* peut démarrer — c'est le signal que la dette est soldée
- [ ] Branche `MNV-187`, PR rebase-mergée sur `dev`

---

## Lié

- **STORY-171** *(vertical porté par l'organisation)* — ⚡ **complémentaire, pas redondante.** 171 dit
  ce qu'une organisation **est** ; 187 trace ce qu'on lui a **fait**. Sans 171, l'assistant ne peut
  ni pré-sélectionner le vertical ni signaler qu'on en active un second — l'opération reste juste,
  l'écran reste aveugle.
- **STORY-189** *(verdict d'intégrité d'un référentiel)* — c'est ce qui rend `skipped` **justifiable**
  sur un pack dont le référentiel n'est pas chargeable. Sans elle, la ligne échouera chez le client au
  chargement du paquet, **loin d'ici et sans lien visible avec ce geste**.
