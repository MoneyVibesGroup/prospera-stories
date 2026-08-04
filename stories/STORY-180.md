# STORY-180 : Semer un **dossier KYC en revue** — l'écran central d'AP-03 n'est vérifiable par personne

**Epic :** EPIC-003 — KYC (`kyc-service`)
**Réf. :** ticket §B · **AP-03** · **STORY-178** *(même défaut, autre objet : le seed de l'administrateur)* · **STORY-179** *(URL présignée joignable)*
**Découverte par :** AP-INT-1, en écrivant les e2e de la revue KYC
**Priorité :** Must Have — ⚡ **bloque la vérification, pas le code**
**Story Points :** 3
**Statut :** À faire
**Créée le :** 2026-08-04
**Sprint :** 20
**Service :** `kyc-service` (`:3002`) · **cible réelle : `OPS`**

---

## Le constat

`kyc-service` n'a **aucun répertoire de seeds**. `auth-service`, lui, en a un
*(`src/seeds/seed-platform-admin.ts`)*, et `STORY-178` s'apprête à le brancher au démarrage — mais
elle ne sème **que l'administrateur**, c'est-à-dire de quoi **se connecter** à une console qui n'a
**rien à montrer**.

**Conséquence :** sur une stack fraîche, `GET /api/v1/admin/kyc?status=UNDER_REVIEW` renvoie une
liste vide. La file est vide, aucune revue ne s'ouvre, et **l'écran le plus important de la console
n'a jamais été vu fonctionner de bout en bout** — ni par un développeur, ni par un testeur, ni par le PO.

> ⚡ **Un aveu est déjà écrit dans le code livré.** Trois tests d'`e2e/integration-gate.spec.ts` se
> mettent en `test.skip` faute de dossier. Un test qui se saute n'est pas un test qui passe : c'est
> un trou qui se présente comme une couverture, et c'est la pire des deux situations — la suite est
> verte.

## Pourquoi ce n'est pas « juste des données de test »

Trois défauts d'AP-03 ont vécu des semaines **parce qu'aucun dossier n'existait pour les révéler** :
un chemin d'API faux *(404 sur toutes les revues)*, une détection de 404 sur un champ inexistant, et
une visionneuse qui dessinait un document au lieu de l'afficher. Aucun n'a été trouvé par les tests
unitaires ; tous auraient été trouvés en ouvrant **un** dossier.

---

## Périmètre

Un seed **idempotent**, sur le patron de `seedPlatformAdmin` *(`upsert`, journalisation explicite
« créé » / « retrouvé »)*, produisant au minimum :

1. une **organisation** et son dossier KYC au statut **`UNDER_REVIEW`** ;
2. ses **deux pièces** (`RCCM`, `CFE`) — ⚡ **réellement déposées dans le bucket MinIO** ;
3. une **extraction OCR** portant un **écart déclaré ↔ lu** sur le numéro d'immatriculation.

### Trois exigences qui ont l'air décoratives et ne le sont pas

- ⚠️ **Les fichiers doivent exister dans le bucket.** Des métadonnées sans objet produiraient des
  URL présignées **valides pointant vers le vide** : c'est-à-dire le symptôme exact de `STORY-179`,
  sans en être la cause. Les deux se confondraient au diagnostic, et on « corrigerait » 179 sans
  jamais voir un document.
- ⚠️ **L'écart OCR est le seul cas qui démontre la confrontation** — et avec elle l'invariant
  **`DO-1`** *(l'OCR assiste, il ne décide pas)*. Un jeu de données où tout concorde ne prouve que le
  cas où l'écran n'a rien à dire.
- ⚠️ **Deux pièces, pas une** : la consolidation d'un dossier *(« on ne soumet que lorsque chaque
  pièce présente est marquée »)* est inobservable sur une pièce unique.

### Hors périmètre

Un jeu de données exhaustif *(dossier dégradé, pièce illisible, resoumission…)*. Un cas nominal
**complet** vaut mieux que six cas partiels : c'est le nominal qui est aujourd'hui invérifiable.

---

## Critères d'acceptation

1. Sur base **vierge**, `GET /admin/kyc?status=UNDER_REVIEW` renvoie au moins un dossier.
2. Rejouable : deux démarrages consécutifs ne créent ni doublon ni seconde pièce.
3. Les deux pièces sont **téléchargeables** par leur URL présignée *(⚠️ dépend de `STORY-179` pour
   l'être depuis un navigateur — ici, le service suffit)*.
4. L'extraction porte un écart nommé dans `discrepancies`, et les valeurs `declared`/`extracted`
   diffèrent réellement.
5. ⚠️ **Rien n'est semé hors développement** : le seed est conditionné comme celui de
   l'administrateur, et un environnement sans les variables démarre normalement, avec un
   avertissement.
6. ⚡ **Preuve navigateur depuis `:3110`** : `docker compose down -v` puis `up`, se connecter,
   ouvrir la file KYC, **ouvrir un dossier et voir ses deux pièces**, sans aucune commande manuelle.

---

## Definition of Done

- [ ] Les 6 critères vérifiés · `lint` 0 · couverture ≥ 90 %
- [ ] ⚡ **Vérifié sur volume vierge** — sur une base déjà peuplée, ce défaut ne se manifeste pas
- [ ] Les trois `test.skip` d'`e2e/integration-gate.spec.ts` **s'exécutent** au lieu de se sauter
- [ ] À tirer **avec `STORY-179`** : sans elle, on sème des pièces qu'on ne peut toujours pas voir
- [ ] Branche `MNV-180`, PR rebase-mergée sur `dev`
