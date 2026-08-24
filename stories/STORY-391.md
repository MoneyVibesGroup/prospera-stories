# STORY-391 : Le cahier ne publie pas sa preuve — une ligne née d'une pièce ne sait pas le dire

**Epic :** EPIC-020 — Adaptateur #3, construction chemin A (cahiers recettes/dépenses + OCR + rattachement plan comptable)
**Réf. :** écart remonté par **FE-043** *(cahier de recettes)*, 2026-08-24 — prolonge **STORY-082**, **STORY-083** et **STORY-084**
**Priorité :** Must Have
**Story Points :** 3
**Statut :** not_started
**Complexité :** medium
**Sprint :** 20
**Service :** `balance-service` (`:3007`)

> Story **jumelle de STORY-392** (`document-service`). Chacune ferme **un bout** de la même
> chaîne, et **aucune des deux ne suffit seule** : celle-ci nomme la pièce depuis la ligne, l'autre
> retrouve l'image depuis ce nom. Les livrer séparément ne rend rien de visible.

---

## Le constat

Demande PO du 2026-08-24, à la revue de maquette FE-043 :
*« il faut aussi que pour le cahier, la preuve, je puisse la voir de façon claire »*.

C'est la demande la plus légitime de tout l'Atelier — une balance de commerçant ne se défend que
par ses pièces. **Elle n'est servable par aucune route aujourd'hui**, et le plus troublant est que
**rien ne manque en base** : la donnée est écrite, l'image est stockée, seul le **contrat de
lecture** est muet.

### ① `LigneRecetteResponseDto` ne publie pas `auditOcr`

La ligne de cahier porte, depuis STORY-084 :

```ts
// schemas/audit-ocr.schema.ts — écrit à chaque `POST …/pieces/ocr/{lotId}/appliquer`
export class AuditOcrSub {
  lotId!: string;
  pieceId!: string;
  confiance!: number;               // la confiance OCR au moment de l'application
  brut!: Record<string, string>;    // le texte OCR source, champ par champ
}
```

`versLigneRecetteResponse()` projette quinze champs. **`auditOcr` n'en fait pas partie** —
vérifié à la source sur `origin/dev` le 2026-08-24. Idem pour `versLigneDepenseResponse`.

Conséquence directe : depuis le cahier, **le front ne peut même pas NOMMER la pièce** dont une
ligne est issue. Il voit `origine: 'OCR'` et `niveauPreuve: 'fichier'` — deux mots qui *affirment*
qu'une preuve existe **sans donner le moindre moyen d'y accéder**. C'est la pire des trois formes :
l'écran promet une justification qu'il ne peut pas produire.

### ② `LignePreProposeeDto` porte un `pieceId`, mais aucune URL

Sur l'écran de relecture, avant application, le lot expose bien chaque pièce
(`pieceId`, `type`, `confiance`, `brut`, `avertissements`) — mais **aucune URL d'image**. Le front
s'en tire *pendant* le dépôt parce qu'il détient encore les fichiers choisis par l'utilisateur et
peut en faire des vignettes locales. **Il perd tout au rechargement de la page** : rouvrir un lot
`PRET` déposé la veille montre des chiffres sans les images qui les justifient — exactement le
moment où la relecture compte le plus.

### ③ Et la trace `brut` ne remonte nulle part

`auditOcr.brut` contient le **texte OCR source par champ** — « ce que la machine a cru lire ».
C'est la pièce d'audit prévue par NFR-A07, et le seul moyen d'expliquer un écart *sans* rouvrir
l'image. Elle est écrite à chaque ligne appliquée, et **aucune route ne la rend**.

---

## Ce qui est demandé

1. Publier `auditOcr` sur `LigneRecetteResponseDto` **et** `LigneDepenseResponseDto`, en objet
   **typé** (`@ApiProperty({ type: AuditOcrDto })` — pas un `example` nu : c'est la leçon de
   STORY-376 et STORY-389, on ne la repaie pas une troisième fois).
2. Ajouter à `LignePreProposeeDto` un **`apercuUrl`** — l'URL présignée de consultation de la
   pièce, **valable depuis un navigateur**. Le patron existe déjà et est prouvé en navigateur réel
   (FE-064 / STORY-358, `PieceUrlSigner` + endpoint public MinIO) : il s'agit de le rebrancher,
   pas de l'inventer.
3. **Ne rien changer d'autre.** Aucun calcul, aucun événement, aucune écriture : les trois données
   sont déjà persistées. Cette story ouvre un **contrat de lecture**.

## Critères d'acceptation

1. `GET …/cahiers/recettes` et `GET …/cahiers/recettes/{…}` rendent `auditOcr` sur toute ligne
   d'origine `OCR`, et **l'omettent** sur une ligne `MANUELLE` — l'absence est signifiante et doit
   rester distinguable, jamais un objet vide.
2. `auditOcr` est **typé dans l'OpenAPI** : le client généré expose `lotId`, `pieceId`,
   `confiance`, `brut`, et non `Record<string, never>`.
3. `LignePreProposeeDto.apercuUrl` ouvre l'image **depuis un navigateur** (endpoint public), et
   non depuis le réseau docker interne — le piège `MINIO_PUBLIC_ENDPOINT` de FE-023 est vérifié
   par un test qui charge réellement l'URL.
4. Un lot rechargé le lendemain rend des `apercuUrl` **valides** (signature regénérée à la lecture,
   jamais figée au dépôt).
5. Aucune régression sur `POST …/appliquer` : les charges utiles écrites sont identiques.

## Ce que le front fait en attendant — et pourquoi ce n'est pas suffisant

FE-043 affiche les vignettes **locales** pendant la relecture (les `File` que l'utilisateur vient
de choisir) : c'est réel, c'est honnête, et **ça ne survit pas à un rechargement**. Dans le cahier,
la colonne « preuve » ne peut afficher qu'un mot (`photo` / `fichier` / `saisie`) et renvoyer vers
l'onglet « Pièces » du dossier — une liste **non filtrée**, où retrouver *la* pièce d'*une* ligne
se fait à l'œil. Le contournement se retire quand cette story **et** STORY-392 sont livrées.
