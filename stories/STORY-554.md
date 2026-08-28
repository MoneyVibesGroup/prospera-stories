# STORY-554 : La lecture courant / non courant est offerte comme SUGGESTION — déclarée, sourcée, et jamais confondue avec le chiffre

Status: ready-for-dev

**Épic :** EPIC-014 — Consultation & export — `bilan-service`
**Service :** `bilan-service` (`:3004`) — `modules/bilan/analyse`, `modules/bilan/referentiel`
**Points :** 5 · **Sprint :** S20
**Prérequis :** **STORY-552** (les indicateurs sur masses SYSCOHADA — la valeur de référence)
**Origine :** **arbitrage PO du 2026-08-28** sur STORY-552 : *« voie A oui mais avec suggestion
possible pour faciliter »*.
**Réf. :** **STORY-553** (les seuils comme donnée de référentiel versionnée — même mécanique,
même exigence de `source`) · **STORY-551** (retraiter, et le dire)

---

## L'arbitrage, et ce qu'il tranche exactement

STORY-552 posait deux voies :

- **voie A** — indicateurs sur les **masses SYSCOHADA**. Exacts au sens du référentiel,
  comparables entre dossiers Prospera, **non** comparables aux benchmarks internationaux ;
- **voie B** — **retraitement** en courant / non courant. Comparables aux benchmarks, au prix
  d'arbitrages que le produit ferait à la place du comptable, en silence.

⚡ **Le PO a tranché : voie A pour le chiffre, et une suggestion par-dessus pour le confort.**

C'est le seul montage qui prend les deux bénéfices sans le défaut. Le défaut de la voie B n'a
jamais été le retraitement lui-même — un expert-comptable retraite tous les jours — **c'est le
silence**. Un retraitement déclaré, sourcé et présenté comme une lecture parmi d'autres n'est pas
un mensonge : c'est un service.

⇒ **La règle qui en découle, et qui commande toute la story :**

> Le chiffre publié est celui des masses SYSCOHADA. La lecture alternative est une **suggestion**,
> nommée comme telle dans le contrat, dans l'écran et dans l'export. Elle n'est jamais la valeur
> par défaut d'un indicateur, jamais le support d'un verdict, et jamais imprimée sans sa mention.

⚠️ **C'est exactement la symétrie de STORY-551.** Là : la colonne N-1 est retraitée, et il faut le
dire. Ici : la lecture courant / non courant est un retraitement, et il faut le dire. Deux fois le
même principe — **retraiter est légitime, ne pas le déclarer ne l'est pas.**

## Périmètre

**Inclus**

- **La correspondance vit dans le paquet de référentiel, pas dans le code.** Même mécanique que
  les seuils (STORY-553) : un bloc `lecturesAlternatives`, versionné, couvert par le `checksum`
  existant, avec une `source` **obligatoire et non vide** validée **au packaging**.
- Chaque poste déplacé porte son **motif**, en clair et lisible par un comptable — par exemple
  *« actif circulant HAO classé en courant : réalisable à moins d'un an par nature »*. Un
  retraitement dont on ne peut pas lire la raison est une voie B déguisée.
- La réponse de `…/bilan/analyse` publie, à côté de chaque indicateur concerné :
  `lectureAlternative: { valeur, postesDeplaces[], source, suggestion: true }`.
  **Le champ `suggestion` est dans les données, pas seulement dans l'écran** — il doit survivre à
  l'export, au PDF et à tout consommateur futur de l'API.
- **Une seule alternative à la fois.** S'il existait deux jeux de règles de retraitement pour un
  même référentiel, le produit choisirait pour le comptable : le paquet n'en déclare qu'un, et
  publier deux jeux est une erreur de packaging.
- Un indicateur **sans** correspondance déclarée ne porte **aucune** `lectureAlternative` — pas un
  bloc vide, pas un `null` qui laisserait croire à un calcul impossible.

**Hors périmètre**

- **Faire porter un verdict à la lecture alternative.** Les seuils de STORY-553 s'appliquent à la
  valeur SYSCOHADA. ⚠️ Si le PO veut un jour des seuils sectoriels internationaux adossés à la
  lecture alternative, c'est une story à part — et elle devra dire lequel des deux chiffres est
  coloré, sinon l'écran affichera deux verdicts pour un même indicateur.
- Rendre les règles de retraitement modifiables par cabinet ou par dossier. Un retraitement qu'un
  utilisateur déplace n'est plus comparable à quoi que ce soit — c'est-à-dire qu'il perd sa seule
  raison d'être.
- Peupler la correspondance pour SFD-BCEAO et CIMA. Leurs masses sont autres, et CIMA a ses
  propres états réglementaires (STORY-523/524). **SYSCOHADA d'abord**, le contenant est générique.

## Critères d'acceptation

1. Un paquet **sans** bloc `lecturesAlternatives` reste valide : les cinq référentiels packagés ne
   sont pas cassés, et l'analyse rend simplement des indicateurs sans suggestion.
2. Une règle de retraitement dont la `source` est absente ou vide **fait échouer le packaging** —
   pas l'exécution. Même garde que STORY-553.
3. Une règle qui déplace un poste **inconnu du paquet** fait échouer le packaging. Un
   retraitement qui vise un poste inexistant produit un chiffre silencieusement faux — le défaut
   exact de STORY-486, rejoué ici.
4. `lectureAlternative.suggestion` vaut `true` dans **toutes** les réponses qui la portent : il
   n'existe aucun chemin où la valeur retraitée sort sans son étiquette.
5. Chaque poste déplacé est publié avec son motif ; un motif vide fait échouer le packaging.
6. La valeur SYSCOHADA de l'indicateur est **strictement inchangée** par la présence ou l'absence
   d'une lecture alternative. **Témoin : le même jeu d'états, calculé avec un paquet portant les
   règles et un paquet sans, rend les mêmes valeurs de référence.**
7. Le `checksum` du paquet change quand les règles changent — le diagnostic reste refaisable.
8. Deux appels sur le même jeu d'états rendent la même suggestion, avec la même version citée.

## Notes

- ⚡ **Ce que la suggestion facilite, concrètement.** Les grilles d'analyse que le cabinet
  consulte (et celles du corpus `Image_lecons`) sont écrites en courant / non courant. Sans cette
  couche, l'expert-comptable qui veut situer son client par rapport à un repère sectoriel doit
  refaire le retraitement lui-même — c'est-à-dire exactement le travail au tableur que
  STORY-552 existe pour supprimer.
- ⛔ **Le mot « suggestion » n'est pas une précaution de langage, c'est une contrainte de
  conception.** Dès qu'un chemin publie la valeur retraitée sans l'étiquette — un export, un PDF,
  une API tierce — la voie B est revenue par la fenêtre, et avec elle le seul défaut que
  l'arbitrage voulait éviter.
- ⚠️ **Ne pas dériver la correspondance du corpus pédagogique.** Ses posters supposent le
  retraitement fait, ils ne le décrivent pas ; et ils sont bâtis sur des masses qui ne sont pas
  celles du SYSCOHADA révisé. La source doit être comptable et citable — c'est tout l'objet du
  champ `source`.
