# STORY-392 : Les pièces d'un dossier portent leur URL, mais rien ne dit quelle ligne elles justifient

**Epic :** EPIC-020 — Adaptateur #3, construction chemin A (cahiers recettes/dépenses + OCR + rattachement plan comptable)
**Réf. :** écart remonté par **FE-043** *(cahier de recettes)*, 2026-08-24 — prolonge **STORY-358**
**Priorité :** Must Have
**Story Points :** 2
**Statut :** not_started
**Complexité :** low
**Sprint :** 20
**Service :** `document-service` (`:3006`, dépôt `prospera-ocr-service`)

> Story **jumelle de STORY-391** (`balance-service`). Celle-ci rend la pièce **retrouvable** ;
> l'autre la rend **nommable** depuis la ligne. **Aucune des deux ne produit d'écran seule.**

> ⛔ **CORRECTION DE PRÉMISSE, posée le 2026-08-26 en instruisant STORY-391.** Le constat ci-dessous
> dit que `GET /dossiers/{id}/pieces` « fait déjà PRESQUE tout : il agrège les pièces COMPTABLES ».
> C'est vrai du **code**, et c'était **faux des données** : `listerParDossier` filtre sur
> `{ orgId, dossierId }`, et `document-piece.client.ts` (`balance-service`) **ne propageait pas
> `dossierId`** au dépôt d'une pièce de cahier — alors que le chemin ne s'ouvre que sous
> `/dossiers/:dossierId/pieces/ocr`, donc que le dossier est **toujours** connu. **Aucune pièce de
> cahier n'entrait dans cette liste** : mesuré en docker, dépôt `dev` ⇒ `dossierId` absent,
> `storageKey = {org}/{lot}/{uuid}`, pièce introuvable dans la liste. Le filtre `?pieceId=` que
> cette story ajoute aurait donc filtré **un ensemble vide**. ⇒ **Corrigé par STORY-391**
> (`MNV-391`, `balance-service`) : le dépôt propage `dossierId`, la pièce est listée, son
> `urlConsultation` charge l'image depuis un navigateur. **Cette story dépend de ce correctif** —
> l'implémenter avant que `MNV-391` soit sur `dev` la rendrait verte et inopérante.
>
> ⛔ **PÉRIMÈTRE ÉLARGI — `apercuUrl` arrive ici.** STORY-391 demandait un `apercuUrl` sur
> `LignePreProposeeDto` (`balance-service`) : **non livrable dans ce dépôt-là** — `balance-service`
> n'a aucun client MinIO, l'événement `document.piece.extrait` ne porte pas de `storageKey`, et le
> garde-fou #2 de STORY-084 interdit explicitement tout re-appel HTTP à `document-service` depuis
> `lire`. **Voie C, tranchée par l'user le 2026-08-26** : l'écran de relecture d'un lot obtient son
> image par **cette** story, en appelant `GET /dossiers/{id}/pieces?pieceId=…` — la route qui signe
> **déjà**, avec le patron `PieceUrlSigner` prouvé en navigateur réel (FE-064). Rien de neuf à
> inventer côté signature ; c'est le filtre `?pieceId=` déjà au périmètre qui le sert.

---

## Le constat

`GET /dossiers/{dossierId}/pieces` (STORY-358) fait déjà **presque** tout ce qu'il faut : il
agrège les pièces de constitution **et les pièces comptables** (`CAPTURE_TRANSACTION`, `FACTURE`),
et il rend pour chacune une **`urlConsultation` présignée valable depuis un navigateur** — prouvée
en navigateur réel par FE-064.

Il manque **l'identité que balance-service connaît**. Or elle est stockée :

```ts
// document-service · schemas/piece-extraction.schema.ts
correlationId!: string;  // = lotId côté balance-service
pieceId!: string;        // = la pièce dans le lot
// index : { orgId: 1, correlationId: 1, pieceId: 1 }
```

Les deux champs sont **persistés et indexés** — mais `listerParDossier` ne les **projette pas** :

```ts
export interface PieceExtractionListee {
  _id; type; statut; storageKey; nomOrigine; deposePar; createdAt;   // ← ni pieceId, ni correlationId
}
```

et `PieceDossierResponseDto.id` est l'`_id` de **l'extraction**, une valeur que balance-service
n'a jamais vue : c'est lui qui **génère** le `pieceId` et l'envoie en champ de formulaire à
`POST /piece-extractions`.

⇒ **La jointure est impossible dans les deux sens.** L'image est *listable*, jamais *rattachable*
à la ligne de cahier qu'elle justifie. Un cabinet qui a importé 300 pièces sur l'exercice se
retrouve, pour vérifier **une** recette, à parcourir une liste de 300 vignettes à l'œil.

⚠️ **Ce n'est pas un oubli de STORY-358** : elle répondait à « quelles pièces ce dossier
porte-t-il ? », une question de niveau dossier à laquelle `pieceId` n'apportait rien. La question
« **quelle image justifie CETTE ligne ?** » n'existait pas encore — elle naît avec le cahier de
recettes, et c'est FE-043 qui l'a posée.

---

## Ce qui est demandé

1. Projeter et publier `pieceId` et `correlationId` sur `PieceDossierResponseDto` — **optionnels**,
   parce qu'une pièce de constitution (statuts, carte CFE) n'en porte pas, et que les rendre
   obligatoires forcerait une valeur inventée sur toute la famille `PROFIL`.
2. Accepter un filtre serveur `?pieceId=` (répétable) **ou** `?correlationId=` sur la route. Sans
   lui, afficher la preuve d'un mois de cahier veut dire charger **toutes** les pièces du dossier
   pour en garder quatre — le défaut exact que STORY-383 a corrigé sur `GET /activite`, et qu'on
   ne réintroduit pas ici.
3. **Rien d'autre.** Aucune écriture, aucune migration : les deux champs sont écrits depuis
   STORY-084 et déjà indexés ensemble.

## Critères d'acceptation

1. `GET /dossiers/{id}/pieces` publie `pieceId` et `correlationId` sur les pièces **comptables**,
   et les **omet** sur les pièces de constitution.
2. `?pieceId=a&pieceId=b` ne rend que ces pièces — et **une pièce d'une autre organisation ou d'un
   autre dossier n'est jamais rendue**, même si son `pieceId` est deviné (le filtre s'ajoute aux
   critères de portée, il ne les remplace pas : c'est la garde qui compte, pas le filtre).
3. Un `pieceId` inconnu rend une **liste vide**, jamais un 404 — l'anti-énumération de la maison.
4. Aucune régression sur FE-064 : l'appel sans filtre rend exactement les mêmes pièces qu'avant,
   dans le même ordre.

## Le contournement en place, et son coût

FE-043 renvoie vers l'onglet « Pièces » du dossier — non filtré. C'est vrai, et c'est presque
inutilisable dès la deuxième dizaine de pièces. Le contournement se retire quand cette story
**et** STORY-391 sont livrées.
