# STORY-1099 : La mémoire des choix dans les cahiers — la pièce suivante du même fournisseur reprend la catégorie déjà choisie

Status: ready-for-dev — **créée le 2026-11-18** à la demande de l'utilisateur. Non slottée : à placer au prochain plan.

**Service :** `prospera-balance-service` (cahiers, tenu par B au lot 4) · **Points :** 5
**Pendant pour les écritures :** STORY-1098 · **Écran :** FE-150

---

## Pourquoi

Aujourd'hui, une pièce lue par l'OCR des cahiers (STORY-084, `cahiers/pieces-ocr/pieces-ocr.regles.ts`) devient une
**ligne pré-proposée** avec sa date, son montant, sa TVA et son sens. La **catégorie**, et donc le compte, est choisie
par le comptable **à chaque fois** : rien ne retient ce qu'il a choisi pour ce fournisseur ou ce libellé. Le petit
commerçant (SMT) a les mêmes fournisseurs chaque mois, et le même besoin que l'entreprise au système normal
(STORY-1098).

## Ce qui est attendu

Les mêmes règles que STORY-1098, appliquées aux cahiers de recettes et de dépenses :

1. À l'application d'un lot (`POST …/pieces/ocr/{lotId}/appliquer`), chaque ligne **retenue** mémorise, pour sa clé
   (NIF lu, sinon fournisseur normalisé, sinon libellé normalisé) et son cahier (recettes ou dépenses) :
   - la **catégorie** choisie ;
   - le **compte** si le comptable s'est écarté de celui de la catégorie, **avec le motif déjà exigé** ;
   - la provenance : date, auteur, pièce.
2. À la lecture d'un lot (`GET …/pieces/ocr/{lotId}`), chaque ligne pré-proposée porte une **suggestion de
   catégorie**. On lit d'abord la mémoire du dossier, puis celle du cabinet, avec la **source** de la suggestion. Sans
   mémoire, aucune catégorie n'est suggérée : on ne devine pas.
3. La saisie à la main d'une ligne de cahier propose la même chose dès que le libellé correspond à une clé connue.
4. On peut **consulter** et **oublier** une mémoire. Une catégorie supprimée ou désactivée n'est jamais reproposée.
5. Le contrat existant ne change pas pour un client qui ignore les nouveaux champs : la suggestion est **ajoutée**,
   jamais imposée.

## Critères d'acceptation

- **AC-1** : la deuxième pièce du même fournisseur, dans le même dossier, suggère la catégorie choisie pour la
  première, avec sa source.
- **AC-2** : la mémoire du dossier prime sur celle du cabinet ; sans mémoire, aucune catégorie n'est suggérée.
- **AC-3** : une suggestion n'est **jamais** appliquée sans geste du comptable ; le dépôt reste sans écriture
  (NFR-A05).
- **AC-4** : oublier une mémoire est journalisé, et elle n'est plus suggérée.
- **AC-5** : étanchéité entre cabinets et entre dossiers (patron du gate FE-069).
