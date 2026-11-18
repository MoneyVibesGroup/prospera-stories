# STORY-1098 : La mémoire des choix du cabinet — la facture suivante du même fournisseur reprend l'écriture déjà faite

Status: ready-for-dev — **créée le 2026-11-18** à la demande de l'utilisateur. Non slottée : à placer au prochain plan.

**Service :** `prospera-comptabilite-service` (tenu par B au lot 4) · **Points :** 8 · **Dépend de :** STORY-1097
**Pendant pour les cahiers :** STORY-1099 · **Écran :** FE-150

---

## Pourquoi

Un cabinet comptabilise chaque mois les mêmes fournisseurs : la CEET, Togocom, le loyer, le transitaire. Il refait
chaque fois le même choix : tel compte, telle TVA, tel journal. L'utilisateur l'a décrit le 2026-11-18 : « je rentre
une première facture ; pour une ligne, la suggestion n'est pas prise ; c'est ce que le client rentre qui compte. Si le
même libellé arrive, je dois lui rappeler son écriture comptable en premier comme suggestion. »

## Ce qui est attendu

1. **Retenir chaque choix validé.** Quand une écriture proposée (STORY-1097) est inscrite au brouillard, on mémorise
   pour la **clé** de la pièce :
   - la clé : le **NIF du tiers** s'il est lu ; sinon le **nom du tiers normalisé** (casse, accents et espaces
     retirés) ; sinon le **libellé** normalisé ;
   - le sens (achat ou vente) ;
   - le choix : compte de charge ou de produit, traitement de la TVA (récupérable ou non, taux), journal, tiers ;
   - la provenance : la date, l'auteur, et la pièce d'où vient le choix (numéro de facture).

   Un choix **corrigé** par le comptable **remplace** l'ancien pour cette clé : c'est la dernière décision qui fait foi.
2. **Deux étages de mémoire**, lus dans cet ordre :
   1. la mémoire **du dossier** : ce que le cabinet a choisi pour **ce client** ;
   2. la mémoire **du cabinet** : ce qu'il a choisi pour ce fournisseur chez d'autres clients de même référentiel ;
   3. la proposition par défaut (compte par défaut du tiers), puis rien.

   Seuls les choix **validés** remontent au niveau du cabinet. Un brouillard abandonné n'apprend rien.
3. **La proposition porte sa source**, toujours : par exemple `{ origine: "MEMOIRE_DOSSIER", pieceRef: "FA-0142",
   choisiLe, choisiPar }`. L'écran écrit alors « Repris de votre saisie du 12/03, facture FA-0142 ». Une proposition
   sans source n'existe pas.
4. **Le comptable garde la main** :
   - la suggestion est **pré-remplie**, jamais appliquée seule ;
   - une mémoire se **consulte** (liste par dossier et par cabinet) et s'**oublie** (route de suppression, journalisée) ;
   - un compte **désactivé** (plan propre) ou **absent** du référentiel du dossier n'est jamais reproposé : la
     suggestion est écartée, et l'écart est dit.
5. **Explicable, pas de modèle.** Ce sont des règles déterministes : « même clé, même choix ». C'est l'exigence du
   produit tant qu'aucun modèle d'IA n'est installé. Un futur modèle pourra proposer **après** ces règles, jamais à
   leur place.

## Critères d'acceptation

- **AC-1** : une première facture du fournisseur X est comptabilisée en 6052 (le comptable a changé la proposition). La
  facture suivante de X dans ce dossier propose 6052, avec la source « saisie du jj/mm, facture … ».
- **AC-2** : chez un autre client de même référentiel, la facture de X propose 6052 avec l'origine `MEMOIRE_CABINET`,
  et la mémoire du dossier prime quand elle existe.
- **AC-3** : un nouveau choix pour la même clé remplace l'ancien ; un brouillard non inscrit n'apprend rien.
- **AC-4** : une mémoire oubliée n'est plus proposée, et l'oubli est journalisé.
- **AC-5** : un compte désactivé, ou absent du référentiel du dossier, n'est jamais reproposé.
- **AC-6** : la mémoire d'un cabinet n'est jamais lue par un autre cabinet.
