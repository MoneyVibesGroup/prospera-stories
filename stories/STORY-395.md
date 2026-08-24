# STORY-395 : Les pièces sont conservées, mais rien ne les range par exercice — un contrôle fiscal ne peut pas les rassembler

**Epic :** EPIC-020 — Adaptateur #3, construction chemin A (cahiers recettes/dépenses + OCR + rattachement plan comptable)
**Réf. :** exigence PO du 2026-08-24 à la validation de la maquette **FE-043** — *« n'oublie pas de bien garder les images qui sont les preuves et de bien les horodater par exercice, pour que demain, dans le cas d'un contrôle, ce soit beaucoup plus facile »*
**Priorité :** Must Have
**Story Points :** 3
**Statut :** not_started
**Complexité :** medium
**Sprint :** 20
**Service :** `document-service` (`:3006`) — **avec un versant `balance-service`** (cf. « Qui écrit »)

---

## Les deux moitiés de l'exigence, et elles n'ont pas le même état

### ✅ « garder les images » — **déjà vrai**, mais par absence de purge

Vérifié à la source le 2026-08-24 : **aucun index TTL, aucune tâche de purge, aucun
`removeObject`, aucune règle de cycle de vie** sur le bucket `piece-documents` ni sur la
collection `piece_extractions`. Les pièces sont donc conservées **indéfiniment**.

⚠️ **Mais ce n'est pas une politique, c'est un silence.** Rien dans le code ne dit que cette
conservation est *voulue*, ni pour combien de temps. La prochaine personne qui verra un bucket
grossir n'aura **aucun signal** lui disant qu'elle regarde des **pièces justificatives
opposables** et non un cache d'OCR. ⇒ la conservation doit être **écrite et testée**, pas
constatée.

### ⛔ « les horodater par exercice » — **pas servable du tout**

`piece_extractions` porte `orgId`, `correlationId`, `pieceId`, `dossierId?`, `type`,
`storageKey`, `statut`, `champs`, `confianceGlobale` et les `timestamps`. **Il n'y a ni exercice,
ni date d'opération.**

Et l'exercice **est connu** — mais ailleurs : `AppliquerLotDto` le porte
(`{ exercice: { debut, fin }, lignesRetenues: [{ pieceId, valeurs }] }`) au moment où le comptable
applique le lot, **côté `balance-service`**, et rien ne le renvoie jamais à `document-service`.

**Deux conséquences, et la seconde est un piège :**

1. On ne peut pas répondre à « **montre-moi toutes les pièces de l'exercice 2026** ». La seule
   lecture disponible, `GET /dossiers/{id}/pieces`, trie par **date de dépôt décroissante** — sur
   un dossier de trois exercices, c'est une pile indifférenciée.
2. ⚠️ **`createdAt` est la date de DÉPÔT, jamais celle de l'OPÉRATION.** Un commerçant qui
   photographie en janvier 2027 le cahier de mars 2026 produit une pièce `createdAt: 2027-01`
   justifiant une recette de l'exercice **2026**. Horodater « par exercice » **en se servant de
   `createdAt` rangerait la preuve dans le mauvais exercice** — c'est-à-dire produirait
   exactement la fausse assurance que cette story existe pour empêcher. **C'est le cas nominal du
   persona, pas un cas limite** : on ne tient pas un cahier papier au jour le jour dans une appli.

---

## Ce qui est demandé

### Qui écrit — et pourquoi ça ne peut pas être le dépôt

Le dépôt (`POST /piece-extractions`) **ne connaît pas l'exercice** : à ce moment-là, la date de
l'opération n'a pas encore été lue par l'OCR, et surtout **elle n'a pas encore été validée par un
humain**. L'exercice n'est certain qu'à l'**application** — le geste où le comptable retient la
pièce et confirme sa date.

⇒ `balance-service`, dans `PiecesOcrService.appliquer`, **stampe** chaque pièce retenue avec
l'exercice du lot et la **date d'opération retenue** (celle des `valeurs`, pas celle de l'OCR brut
si elle a été corrigée).

1. Ajouter à `PieceExtraction` : `exerciceDebut?`, `exerciceFin?`, `dateOperation?`,
   `ligneCahierId?` — tous **facultatifs**, parce qu'une pièce **déposée et non appliquée** n'a
   légitimement pas d'exercice, et qu'un `required` la ferait échouer au dépôt (le défaut payé par
   STORY-372, puis rappelé par le `dossierId?` de STORY-358).
2. Exposer l'écriture : soit une route interne idempotente (`PATCH /piece-extractions/{id}/rattachement`),
   soit la consommation d'un événement émis à l'application. **Le choix appartient à l'archi** —
   la contrainte est l'**idempotence** : réappliquer un lot ne doit jamais dupliquer ni contredire
   un rattachement existant.
3. Ajouter le filtre de lecture sur `GET /dossiers/{id}/pieces` :
   `?exerciceDebut=&exerciceFin=`, et le tri par **`dateOperation` décroissante** quand elle
   existe (dépôt en repli). C'est **la** requête du contrôle fiscal.
4. **Écrire la conservation** : commentaire de politique sur le schéma + le bucket, et un **test
   qui échouerait si un TTL ou une purge apparaissait**. Une garantie que rien ne teste n'est pas
   une garantie — c'est ce que la moitié « déjà vrai » nous apprend.

## Critères d'acceptation

1. Une pièce **appliquée** porte `exerciceDebut`, `exerciceFin` et `dateOperation` ; une pièce
   **déposée et non appliquée** ne les porte pas — et les deux restent distinguables.
2. `dateOperation` est **la date retenue par le comptable**, jamais `createdAt`, jamais la date
   OCR brute si elle a été corrigée. **Un test couvre explicitement le cas « pièce de mars 2026
   déposée en janvier 2027 »** : elle doit ressortir dans l'exercice **2026**.
3. `GET /dossiers/{id}/pieces?exerciceDebut=…&exerciceFin=…` ne rend que les pièces de cet
   exercice, triées par `dateOperation` décroissante.
4. Réappliquer le même lot **n'altère pas** le rattachement déjà posé (idempotence).
5. Un test **interdit la purge** : présence d'un TTL ou d'une suppression sur `piece_extractions`
   ou sur le bucket ⇒ rouge.
6. Aucune régression : les pièces déjà déposées (sans exercice) restent listées et consultables.

## Recouvrement assumé avec STORY-392

STORY-392 ajoute `pieceId`/`correlationId` et un filtre à **la même route**. Les deux touchent
`PieceDossierResponseDto` et `listerParDossier` — **les livrer ensemble évite deux passes** sur le
même DTO. Elles restent **distinctes** parce qu'elles répondent à deux questions différentes :
392 = « quelle image justifie *cette ligne* ? » (l'écran) ; 395 = « quelles pièces justifient *cet
exercice* ? » (le contrôle). L'une sert le comptable au quotidien, l'autre l'inspecteur trois ans
plus tard.

## Ce que le front fait en attendant

FE-043 affiche la preuve **par mois**, en s'appuyant sur la date de la **ligne de cahier** — qui,
elle, est bien dans le bon exercice. La **pièce**, en revanche, reste non filtrable par exercice :
l'onglet « Pièces » du dossier montre une pile triée par dépôt. Le contournement se retire quand
cette story est livrée.
