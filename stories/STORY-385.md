# STORY-385 : Les pièces d'un dossier se lisent sans leurs enums ni ce que l'OCR en a tiré

**Epic :** EPIC-043 — Dossier client, unité de travail du cabinet
**Réf. :** écart remonté par **FE-064** *(les pièces du dossier)*, 2026-08-23 — prolonge **STORY-358**
**Priorité :** Should Have
**Story Points :** 3
**Statut :** in_progress
**Complexité :** low
**Sprint :** 20
**Service :** `document-service` (`:3006`)

---

## Le constat — deux manques du même contrat de lecture

`GET /api/v1/dossiers/:dossierId/pieces` rend un `PieceDossierResponseDto` qui dit **qu'une lecture a
eu lieu**, jamais **ce qu'elle a lu** — et qui publie ses deux champs discriminants en **`string`
libre**.

### ① `type` et `statutOcr` ne sont pas des enums OpenAPI

```ts
@ApiProperty({ description: 'Type de pièce. Pièce de dossier : STATUTS | CARTE_CFE | …' })
type!: string;              // ← les valeurs sont dans la PROSE, pas dans le schéma
@ApiProperty({ description: "Statut d'extraction OCR : EN_COURS | PRETE | ECHEC, ou SANS_OCR…" })
statutOcr!: string;
```

Le client généré reçoit donc `string`, et **aucune garde d'exhaustivité n'est possible sur la
réponse** : le jour où une septième valeur de `type` apparaît, le front l'affichera sous un libellé
de repli — sans que rien ne rougisse nulle part. C'est **le défaut que STORY-375 vient de fermer sur
les codes d'erreur** *(« un code ajouté doit CASSER la compilation du client au lieu de tomber en
silence »)*, resté ouvert ici.

⚠️ **Les enums existent déjà côté serveur** — `TypePieceDossier`, le type des pièces comptables, et
les quatre statuts : ils sont d'ailleurs **correctement publiés sur les routes de DÉPÔT** de ce même
service. Seule la route de **lecture** les perd. FE-064 a donc dû poser sa garde sur les unions des
routes de dépôt, plus un repli explicite — une garde qui protège *à côté* de ce qu'elle vise.

### ② Rien ne relie une pièce à ce que l'OCR en a tiré

`statutOcr: 'PRETE'` dit que la lecture a réussi. Le DTO ne publie **ni les champs lus, ni le
`correlationId`** — c'est-à-dire rien qui permette de répondre à la question pour laquelle le cabinet
ouvre la pièce : *« d'où vient ce NIF ? »*.

Aller chercher la proposition chez `balance-service` n'est pas une alternative :
`GET /profil-societe/ocr/:extractionId` est **org-keyed**, son identifiant est le `correlationId`
(que la lecture ne publie pas), et la proposition **groupe les deux pièces d'un même dépôt** — elle
ne se rattache donc à aucune pièce en particulier.

**Conséquence** : FE-064 n'a pas pu livrer le §5 de son périmètre *(restitution « déclaré ↔ lu » par
pièce, composant de FE-018)*. Le brancher sur du vide aurait affiché un tableau de tirets, et **une
colonne à moitié servie se lit comme un fait** *(leçon FE-066)*.

---

## User Story

En tant que **collaborateur de cabinet**,
je veux **voir, pièce par pièce, ce que le système y a lu**,
afin de **justifier chaque donnée d'identité par le document dont elle vient — et pas seulement
savoir qu'une lecture a eu lieu**.

---

## Ce que la story doit livrer

- **`type` et `statutOcr` publiés en `enum`** sur `PieceDossierResponseDto` *(`@ApiProperty({ enum:
  … })`)*, comme ils le sont déjà au dépôt. ⚠️ Le `type` d'une pièce de dossier et celui d'une pièce
  comptable sont **deux enums distincts** que la liste fusionne : publier leur **union** est le
  livrable, pas en choisir un.
- **`correlationId`** sur la réponse — la clé de regroupement d'un même dépôt. Elle suffit à relier
  une pièce à la proposition de profil correspondante, sans nouveau modèle.
- **Les champs lus par pièce**, servis par ce service *(il les possède : c'est lui qui parse)* :
  au minimum `{ champ, valeurLue, confiance }`. ⚠️ **`document-service` est la bonne source** — le
  read-model de `balance-service` est org-keyed et groupé ; ré-agréger côté client reviendrait à
  reconstituer un lien que le producteur a déjà.
- ⚠️ **Aucun changement de contrat d'ÉVÉNEMENT** : `document.profil.extrait` reste tel quel *(P9,
  compat BACKWARD)*. Cette story n'ajoute que des champs **de lecture HTTP**, tous facultatifs pour
  les pièces déposées avant STORY-358.

---

## Acceptance Criteria

- [ ] `PieceDossierResponseDto.type` et `.statutOcr` sont des **enums** dans `/api/docs-json` ; le
      client régénéré obtient une **union**, et une valeur ajoutée côté serveur **casse la
      compilation** d'un `Record<Union, …>` côté front *(vérifié par mutation)*.
- [ ] La réponse porte le `correlationId` de la pièce.
- [ ] La réponse porte ce que l'OCR a lu, **par pièce**, avec sa confiance — **absent** *(et non
      vide)* pour une pièce `SANS_OCR`, `EN_COURS` ou `ECHEC` : « pas encore lu », « illisible » et
      « lu, rien trouvé » sont trois faits différents et ne se confondent pas.
- [ ] Non-régression : les pièces déposées **avant** STORY-358 restent listables *(champs
      facultatifs absents, jamais `null`)*.
- [ ] Non-régression : le chemin **KYC** n'est pas touché *(D2)*.

---

## Dépendances

**Prérequise :** **STORY-358** ✅.
**Consommateur :** **FE-064** *(livrée le 2026-08-23 — l'onglet affiche l'état de lecture ; la
restitution « déclaré ↔ lu » attend cette story)*, et **FE-018** dont le composant est déjà écrit.

---

## Note de provenance

Remontée par **FE-064**. Les deux manques sont regroupés **délibérément** : ils portent sur le même
DTO, et l'un sans l'autre laisserait le front avec des champs lus qu'il ne peut pas typer, ou des
types qu'il ne peut rien faire lire.

---

## Progress Tracking

| Phase | État | Preuve |
|---|---|---|
| Cadrage / branche | ✅ 2026-08-24 | branche `MNV-385` sur `docs/` et sur `prospera-ocr-service` |
| Développement | ⏳ | — |
| Portes DoD | ⏳ | — |
| Vérification docker | ⏳ | — |
| Revue de code | ⏳ | — |
| Revue de sécurité | ⏳ | — |
| Merge | ⏳ | — |
