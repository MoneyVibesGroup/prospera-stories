# STORY-441 : La piste d'audit et le snapshot ne nomment personne — `userId` et `validePar` sont des `ObjectId` nus

Status: done

**Épic :** EPIC-012 — Validation, immutabilité, exercices, audit
**Service :** `bilan-service`
**Points :** 5 · **Complexité :** high · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-034** (cycle brouillon → validé, snapshot immuable, piste d'audit), 2026-08-27.
Relevé en lisant les contrôleurs de `bilan-service` sur `origin/dev`.

---

## Le fait

`AuditEventResponseDto` publie `userId: string` — un `ObjectId` de 24 caractères. `SnapshotSommaireDto`
publie `validePar: string`, de même. **Aucune route de `bilan-service` ne résout un utilisateur en nom**,
et l'écran de la piste d'audit est précisément celui où l'identité **est** l'information.

Conséquence directe : l'**AC-4 de FE-034** — « journal d'audit : action, **auteur**, horodatage, cible » —
est **inapplicable**. Trois des quatre colonnes sont servies. Le front ne peut afficher que
`68a1f3…4c31`, et un journal dont l'auteur est un identifiant opaque n'est pas une piste d'audit :
c'est une liste d'horodatages.

Même remarque pour l'**AC-2** (« statut VALIDÉ + horodatage/**validateur** affichés »).

## Critères d'acceptation

- [x] AC-1 — `AuditEventResponseDto` publie `auteur: { id, nom, email, role }` en plus de `userId`
      (rétrocompatible : `userId` reste).
- [x] AC-2 — `SnapshotSommaireDto.validePar` gagne la même enveloppe (`validePar` reste un id ;
      `validateur: { id, nom, email, role }` s'ajoute).
- [x] AC-3 — La résolution passe par un **read-model local** alimenté par les événements
      `auth-service` (le patron déjà utilisé pour les entitlements), **jamais** par un appel
      synchrone dans la boucle de lecture du journal.
- [x] AC-4 — Un utilisateur **supprimé ou désactivé** garde son nom dans le journal : c'est un
      **fait daté**, pas une jointure vivante. Le read-model ne supprime jamais une ligne.
- [x] AC-5 — Un auteur non résolu (événement antérieur au read-model) rend
      `auteur: null` — et **jamais** un nom inventé ou un « Utilisateur inconnu » qui se lirait
      comme un compte réel.

## Conséquences ailleurs

- **Bloque FE-034** : c'est le seul écart de la série qui rend un critère d'acceptation
  inapplicable, pas seulement dégradé. La maquette affiche donc l'identifiant **tel quel**,
  nom et rôle marqués en pointillé (« reconstitué »), pour ne pas laisser croire l'écart réglé.
- Même patron que l'affichage des dossiers affectés (STORY-136) : le nom d'un collaborateur
  est déjà une donnée que le front doit résoudre ailleurs.


## Progress Tracking

**Statut : `done`** — implémentée, validée, revue (code + sécurité), **vérification docker rejouée sur
l'état final**, PR `bilan-service` **#73** (2 commits) rebase-mergée sur `dev` le 2026-09-03.

Branches créées **avant** la première ligne de code :

```
docs             MNV-441
bilan-service    MNV-441
```

⚠️ **Un seul dépôt de module, vérifié avant de coder** : les quatre topics `identity.*` sont **déjà
publiés** par `auth-service`. Le contrat d'événement ne change pas — la règle « un changement de
contrat touche 2 dépôts » ne s'applique donc pas. En revanche, **le miroir consommateur, lui, était
faux** : voir le second bloquant.

### Ce qui est livré

| AC | Livré |
|---|---|
| AC-1 | `auteur: { id, nom, email, role }` sur chaque ligne du journal ; `userId` conservé. Le nom est **composé**, jamais stocké : le stocker doublerait la source de vérité. |
| AC-2 | `validateur` sur le sommaire **et** le détail d'un snapshot ; `validePar` conservé. ⚠️ Résolu **à la lecture**, jamais figé : un nom écrit dans un snapshot append-only serait une donnée personnelle que plus rien n'efface. |
| AC-3 | Deux read-models locaux (`identity_users`, `identity_memberships`), consumer group dédié `bilan-identity`. Résolution **par lot** : deux requêtes par page, jamais une par ligne, jamais un appel REST à l'IdP. |
| AC-4 | Aucune ligne n'est jamais supprimée, et **la lecture ne filtre sur aucun statut** — un collaborateur suspendu ou parti garde son nom. |
| AC-5 | Auteur non résolu ⇒ `null`. Jamais un « Utilisateur inconnu », qui se lirait comme un compte réel. |

### ⛔⛔ Revue — trois bloquants, dont un qui aurait gelé la fonctionnalité en production

**① Un *poison pill* permanent** (trouvé par les **deux** revues, mesuré sur une vraie base). La
garde dernier-écrit-gagne était fusionnée au **filtre** de l'`upsert`. Un événement plus ancien que
l'état en base ne matche alors **aucune** branche du `$or` ; Mongo bascule sur le chemin
d'insertion — qu'il construit depuis les seules **égalités de premier niveau**, le `$or` étant
ignoré — et l'index unique rend `E11000` **sur un message parfaitement légitime**. Le marqueur
`ProcessedEvent` étant annulé avec la transaction, le rejeu refait exactement la même chose.

⇒ Les quatre topics d'identité gelés, et `auteur: null` partout — **indiscernable du cas nominal de
l'AC-5**. Déclenché au **premier boot** (`fromBeginning`, quatre topics que Kafka n'ordonne pas
entre eux) et **avec certitude** après la purge TTL des marqueurs.

⚠️ La branche `$exists: false` censée fermer ce cas était **morte** : le champ est `required` et
réécrit par chaque `$set`. Et le dépôt portait **déjà** l'avertissement (`dossier.projection`) et le
remède (`expert-comptable`, `dossier-service` : lire, comparer, puis écrire avec une **clé pure**).

**② Un vocabulaire d'événement INVENTÉ.** Le contrat consommateur n'était pas le miroir du
producteur : `REVOKED` n'est émis **par personne** — l'IdP dit `SUSPENDED`, à chaque révocation de
membre. `lireIdentite` rejetait donc la charge utile **entière**, offset avancé, **perdue**. Un
`TENANT_ADMIN` rétrogradé et suspendu dans le même geste serait resté `TENANT_ADMIN` dans la piste
d'audit **pour toujours**. `INVITED` manquait aussi côté utilisateur.

⚠️ Les tests ne pouvaient pas le voir : ils éprouvaient `'ZOMBIE'` et `'PENDING'`, deux valeurs
qu'aucun producteur n'émet, et jamais `'SUSPENDED'` sur une appartenance. **La batterie était
cohérente avec le contrat inventé**, donc aveugle au contrat réel.

**③ L'AC-2 n'était prouvé par RIEN.** Les cinq harnais doublent la résolution par une carte
**toujours vide**, donc `validateur` était **toujours `null`** dans toute la batterie — et
`*.dto.ts` est hors couverture. La mutation « keyer sur l'id du snapshot au lieu de `validePar` »
laissait **1 570 unitaires et 414 e2e verts**.

### Non-bloquants traités

- **Trois décisions traînaient dans le `*bootstrap*`** — corps absent, `JSON.parse`, résolution de
  l'`eventId` — dans le fichier exclu de `collectCoverageFrom`, alors que son JSDoc affirmait
  « aucune décision n'est prise ici ». Elles rejoignent `lireIdentite`, sur le patron du voisin.
- Le log annonçait un consumer group **en dur**, qui aurait menti dès la variable d'env surchargée —
  au moment précis où on lit ce log pour diagnostiquer un consommateur qui ne consomme pas.
- La docstring du marqueur partagé parlait encore de **deux** consommateurs sur six.
- **Constat de sécurité F3** : les read-models d'identité sont **globaux à la plateforme**, et seul
  le **rôle** est scopé par `orgId`. Aucune fuite inter-tenant aujourd'hui — les appelants n'y
  versent que des identifiants **déjà tenant-scopés** — mais l'invariant est désormais **écrit à
  l'endroit exact où une story future le casserait**.
- **Lentille over-engineering** : les interfaces du contrat miroir n'étaient utilisées par rien. Elles
  **typent maintenant les fixtures** — un contrat recopié mais jamais typé ne garde rien.

### Vérification

Lint 0 warning · build OK · **1 578** unitaires + **414** e2e verts · couverture
**98,79 / 93,87 / 98,73 / 98,81**. Les fichiers neufs sont à **100 %** (`auteurs.repository`,
`identity-payload.util`) et **98 %** (`identity.projection.service`). **10 mutations rouges par
assertion**, dont les quatre qui rejouent les bloquants ci-dessus.

**Vérification docker — round-trip Kafka RÉEL, pas un mock.** Les utilisateurs enregistrés dans
`auth-service` sont arrivés par l'outbox et le read-model a convergé seul.

| cas | résultat |
|---|---|
| auteur connu | `auteur: {nom: "Verif Story439", role: "TENANT_ADMIN"}` |
| `userId` inconnu (AC-5) | `auteur: null` |
| auteur **suspendu** (AC-4) | **garde son nom** |
| ⛔ événement **périmé** publié sur le bus | ignoré, **zéro `E11000`**, aucun doublon, état non rétrogradé |
| ⛔ événement **récent** publié ensuite | **appliqué** — la partition n'est pas bouchée |
| ⛔ appartenance `SUSPENDED` | **projetée** — elle était jetée en silence avant |

Les trois dernières lignes sont la preuve des deux bloquants, mesurée sur le bus réel. ⚠️ La
première vérification docker, elle, ne prouvait rien sur ces cas : le jeu de données ne contenait
**que le chemin heureux** (un événement par entité, tous `ACTIVE`).
