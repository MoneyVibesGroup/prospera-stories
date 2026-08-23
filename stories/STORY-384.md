# STORY-384 : Une pièce déposée avant la création du dossier ne peut plus JAMAIS lui être rattachée

**Epic :** EPIC-043 — Dossier client, unité de travail du cabinet
**Réf. :** écart remonté par **FE-064** *(les pièces du dossier)*, 2026-08-23 — prolonge **STORY-358**
**Priorité :** Should Have
**Story Points :** 3
**Statut :** not_started
**Complexité :** low
**Sprint :** 20
**Service :** `document-service` (`:3006`) *(+ `balance-service` : un champ de plus au proxy OCR)*

---

## Le constat

STORY-358 a livré le rattachement d'une pièce à un dossier — **au dépôt, et seulement au dépôt** :
`dossierId` est un champ du corps multipart de `POST /profil-extractions` et de
`POST /piece-extractions`. Il n'existe **aucune** route pour rattacher une pièce déjà déposée.

Or le seul moment où le cabinet dépose ses statuts et sa carte CFE est l'**étape 1 de l'assistant de
création** (FE-060) — c'est-à-dire **avant que le dossier existe**. Et ce dépôt-là ne passe même pas
par `document-service` : il passe par `balance-service` (`POST /profil-societe/ocr`), qui proxifie
chaque pièce avec un `correlationId` commun (D4) et **ne transporte pas de `dossierId`**.

La séquence est donc structurellement fermée :

```
étape 1 : dépôt des pièces  →  (pas de dossier : rien à rattacher)
étape n : création du dossier  →  (pas de route : plus rien ne rattache)
```

**Conséquence vécue, vérifiée en docker le 2026-08-23** : un dossier créé par l'assistant s'ouvre
sur un onglet « Pièces » **vide**, alors que ses statuts et sa carte CFE ont bel et bien été déposés,
lus, et ont pré-rempli son identité. Les pièces existent — dans `profil_extractions`, sans
`dossierId` — et plus personne ne peut les retrouver depuis le dossier qu'elles ont constitué.

⚠️ **Ce n'est pas la même chose que « la pièce est perdue »** : elle est stockée, elle est opposable,
elle est même consultable par qui connaît son identifiant d'extraction. Ce qui manque est **le lien**,
et c'est précisément ce que STORY-358 existait pour créer.

---

## User Story

En tant que **collaborateur de cabinet**,
je veux **retrouver dans le dossier les pièces qui ont servi à le créer**,
afin de **justifier son identité fiscale par les documents dont elle sort**.

---

## Ce que la story doit livrer

Deux chemins sont possibles ; **le second est recommandé**, le premier est le repli.

### Option A — le rattachement a posteriori *(une route de plus)*

`PATCH /api/v1/profil-extractions/:id/dossier` *(et son jumeau pour les pièces comptables)*, corps
`{ dossierId }`, gardé par `DossierGate.exigerPourDepot` — **404** si le dossier n'existe pas dans
l'organisation de l'appelant, **409 `DOSSIER_ARCHIVE`** sur un dossier archivé.

⚠️ **La clé de stockage NE bouge PAS.** `dossiers/<orgId>/<dossierId>/<uuid>` est la convention des
pièces déposées *avec* un dossier ; déplacer un objet MinIO déjà écrit pour la respecter ferait
courir le risque d'un orphelin — exactement ce que D-358-2 refuse. Le chemin d'origine
(`<orgId>/<uuid>`) reste valide, et la lecture signe déjà d'après `storageKey`.

⚠️ **Rattachement UNIQUEMENT si la pièce n'en a pas déjà un.** Déplacer une pièce d'un dossier à un
autre est un geste différent — et non demandé : une pièce est opposable, la voir changer de dossier
réécrirait l'histoire d'un contrôle. Une pièce déjà rattachée ⇒ **409**.

### Option B — porter le `dossierId` jusqu'au bout du parcours *(recommandé)*

Le vrai défaut est en amont : l'assistant **connaît** le dossier au moment où il le crée, mais plus
rien ne redescend vers les pièces. Deux ajouts suffisent :

1. `balance-service` : `POST /profil-societe/ocr` accepte un `dossierId` **facultatif** et le
   propage au proxy vers `document-service` — le champ existe déjà côté destinataire.
2. `document-service` : la route de rattachement d'Option A, **pour le cas où le dossier n'existe
   pas encore au dépôt** — c'est le cas nominal de l'assistant, pas un cas de bord.

⇒ **Les deux sont nécessaires** : (1) sert les dépôts faits *après* création (import d'une pièce sur
un dossier existant, par un autre écran), (2) sert l'assistant. Sans (2), l'assistant reste bloqué.

---

## Acceptance Criteria

- [ ] Une pièce déposée **sans** `dossierId` peut être rattachée ensuite à un dossier de la **même
      organisation** ; elle apparaît alors dans `GET /dossiers/:dossierId/pieces`.
- [ ] Le rattachement vers un dossier **inexistant ou d'une autre organisation** rend **404**, corps
      strictement identique dans les deux cas *(anti-énumération, comme STORY-358)*.
- [ ] Le rattachement vers un dossier **archivé** rend **409 `DOSSIER_ARCHIVE`** — on ne verse plus
      de pièce à un dossier clos *(D9)*.
- [ ] Une pièce **déjà rattachée** ne se re-rattache pas *(409)* : elle est opposable.
- [ ] `POST /profil-societe/ocr` (`balance-service`) accepte un `dossierId` facultatif et le
      **propage tel quel** ; l'omettre garde le comportement actuel, **202** inchangé.
- [ ] Non-régression : le chemin **KYC** n'est pas touché *(D2 — le KYC ne descend pas au dossier)*.
- [ ] Vérification **docker réelle** : un dossier créé par l'assistant expose ses **deux** pièces.

---

## Dépendances

**Prérequise :** **STORY-358** ✅ *(le champ, la garde et la lecture existent — il manque le geste)*.
**Consommateur :** **FE-060** *(l'assistant)* et **FE-064** *(l'onglet « Pièces », livré le
2026-08-23)*. ⚠️ **Le front est prêt des deux côtés** : la liste sait afficher les pièces, le dépôt
sait envoyer un `dossierId`. Il ne manque que le maillon serveur.

---

## Note de provenance

Remontée par **FE-064**, dont le §4 de périmètre demandait exactement ce rattachement. Il a été
**constaté non servi plutôt que simulé** : le simuler côté client aurait supposé re-déposer les mêmes
fichiers après création — un second objet MinIO, une seconde extraction OCR, et un second
`document.profil.extrait` portant un `correlationId` qu'aucune proposition ne connaît.
