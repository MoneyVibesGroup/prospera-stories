# STORY-456 : Le déficit reportable est le seul poste de la liasse sans piste d'audit publiée — alors qu'il est persisté

Status: ready-for-dev

**Épic :** EPIC-023 — Fiscalité (résultat fiscal, liquidation, TVA, provisions, TPU)
**Service :** `balance-service` (`:3007`) — `modules/fiscal`
**Points :** 2 · **Sprint :** S20
**Origine :** relevée le **2026-08-27** par la **passe expert-comptable de FE-050**, en cherchant quoi
afficher dans la colonne de justification du stock de déficits — et en ne trouvant rien à afficher.

---

## Le fait, relevé à la source

Le schéma **persiste** la piste d'audit. Le DTO ne la **publie pas**.

`deficit-reportable.schema.ts` :

```ts
@Prop() baseLegale?: string;
@Prop() justification?: string;
@Prop({ required: true }) parUserId!: string;   // « piste d'audit (NFR-A07) »
createdAt?: Date;  updatedAt?: Date;            // { timestamps: true }
```

`DeclarerDeficitDto` **accepte** `baseLegale` et `justification`, et `declarerDeficit` les **écrit**
(`resultat-fiscal.service.ts`, avec `parUserId: user.userId`).

`DeficitResponseDto` / `DeficitDeclareResponseDto` publient : `id`, `exerciceOrigine`, `montant`,
`montantDejaImpute`, `restant`, `expireApres`, `perime`, `imputableSurExercice`.

⛔ **Aucun des cinq champs d'audit ne ressort.** Le cabinet écrit une justification que **personne ne
peut relire** — ni lui, ni l'écran, ni un contrôle.

### Le contraste, dans le même service et sur le même écran

`PosteRetraitementResponseDto` publie, lui, **tout** : `baseLegale`, `justification`, `pieceRef`,
`parUserId`, `le`. FE-050 affiche donc, côte à côte sur le même écran :

| | traçabilité à l'écran |
|---|---|
| un retraitement de 1 800 000 F, sur **un** exercice | article invoqué, motif écrit, auteur, date, pièce |
| un report de 8 000 000 F, sur **plusieurs** exercices | **rien** |

**C'est l'inverse de la hiérarchie du risque.**

---

## ⚖️ AVIS D'EXPERT-COMPTABLE

### ① En contrôle, le report est ce qui se justifie en premier

Un retraitement se défend sur l'exercice vérifié : la pièce est dans le dossier de l'année. Un
**report déficitaire**, lui, vient d'un exercice **antérieur** — souvent hors période vérifiée,
souvent antérieur au cabinet en place. C'est pour cela que le vérificateur commence par là : il
demande la liasse d'origine, et à défaut il **rejette l'imputation**. Un report non justifié n'est
pas un report faible : c'est un report perdu.

### ② `montantDejaImpute` est *déclaré* — donc c'est une affirmation, pas une donnée

Le produit le dit lui-même (D-091-9) : cette colonne n'est pas dérivée, elle est **saisie**. Une
affirmation non signée et non datée ne vaut rien : le confrère qui reprend le dossier ne peut ni la
vérifier, ni savoir si elle a été posée avant ou après la liasse qu'il a sous les yeux. C'est
d'autant plus vrai que le stock est **figé par le gel** dès la première clôture suivante — ce qui a
été déclaré une fois ne se corrige plus (et, tant que **STORY-455** n'est pas livrée, ne se met jamais
à jour non plus).

### ③ La date de déclaration compte autant que l'auteur

`createdAt` existe déjà. Savoir qu'un report de 8 000 000 F a été déclaré **le lendemain d'un
contrôle** ou **trois ans avant** ne dit pas la même chose sur le dossier. C'est le champ le moins
cher du lot et probablement le plus utile.

### ④ Le coût est nul, et c'est ce qui rend le manque anormal

Il n'y a **rien à collecter, rien à migrer, rien à calculer** : la donnée est écrite en base depuis
STORY-091. Il manque cinq lignes de DTO. Un écart de ce prix qui survit à deux revues mérite qu'on
note **pourquoi** il a survécu : la revue de contrat lit ce que le contrat **publie**, jamais ce que
le schéma **stocke** — les deux listes n'ont jamais été confrontées.

⇒ **Règle : quand un schéma porte un champ d'audit, vérifier qu'un DTO le rend. Un champ persisté et
jamais publié est du travail déjà payé, et une garantie qui n'existe pas.**

---

## Critères d'acceptation

1. `DeficitResponseDto` **et** `DeficitDeclareResponseDto` publient `baseLegale`, `justification`,
   `parUserId` et la **date de déclaration** (`createdAt`, exposée sous un nom métier — `le`, comme
   sur les retraitements, pour que les deux surfaces se lisent pareil).
2. Les champs sont **optionnels au contrat** (`@ApiPropertyOptional`) : les déficits déclarés avant
   cette story n'ont ni `baseLegale` ni `justification`, et un défaut inventé serait pire que
   l'absence. `parUserId` et la date, eux, existent sur **tous** les documents (`required` /
   `timestamps`) et sont donc publiés sans réserve.
3. **`justification` devient obligatoire à la déclaration** — même exigence que sur un retraitement
   (`JUSTIFICATION_REQUISE`, NFR-A04), et pour la même raison : un report non motivé est
   indéfendable. ⚠️ **Rupture de contrat assumée** sur `DeclarerDeficitDto` : à annoncer, et à ne
   retenir que si le PO l'arbitre — sinon, se limiter aux AC-1/2 et laisser le champ facultatif.
   *(L'écran FE-050 propose déjà les deux champs ; il ne les impose pas.)*
4. **Aucune rétro-attribution** : un déficit sans auteur exploitable rend le champ absent, jamais un
   utilisateur système. Signer a posteriori une déclaration qu'on n'a pas vue est pire que ne pas la
   signer.
5. ⚠️ **Correctif de commentaire, dans la même passe** : `resultat-fiscal.service.ts` documente
   l'index unique comme `(orgId, exerciceOrigine)` alors que le schéma porte
   `(dossierId, exerciceOrigine)` (corrigé par STORY-236, le commentaire ne l'a pas suivi). Tel quel,
   il décrit un défaut multi-dossiers **qui n'existe pas** — un cabinet ne pourrait déclarer qu'un
   seul déficit 2022 pour tous ses clients. Il a déjà coûté une vérification.
6. **Tests** : ① les quatre champs ressortent sur un déficit déclaré avec justification ; ② un
   déficit antérieur ressort sans `baseLegale`/`justification` mais **avec** auteur et date ;
   ③ (si AC-3 retenu) une déclaration sans justification est refusée `400 JUSTIFICATION_REQUISE`.

---

## Impact frontend

FE-050 affiche aujourd'hui, pour chaque déficit, sa règle de report et son imputation — et **rien**
sur son origine. Les quatre champs se posent dans la colonne « Exercice d'origine » sur le patron
**déjà écrit** pour les retraitements (`saisi par {auteur} le {date}`), soit une ligne de composant.
⇒ story frontend **inutile** : à intégrer au premier passage sur l'écran.

**Dépendance de lecture :** se lit avec **STORY-455**. Celle-ci rend le stock *justifiable*, 455 le
rend *juste*. Livrer 456 seule affiche proprement l'origine d'un chiffre qui continue de dériver.
