# STORY-904 : Le fiscal tient sur un vrai MongoDB

Status: done

**Complexité :** petite à moyenne (un service, surtout des preuves)

**Épic :** EPIC-028 (le socle du service fiscal : audit, transactions)
**Service :** `fiscal-service`
**Plage :** groupe A, n° 9 du lot de A. Réservée par la relecture du 2026-11-15
(`coordination/relecture-groupe-A-2026-11-14.md`, STORY-299 et STORY-563). Fiche écrite **avant** de coder.

---

## Pourquoi

La relecture de STORY-299 et de STORY-563 n'a trouvé aucun défaut bloquant. Elle a trouvé en revanche ce que les
doubles ne prouvent pas, et une porte laissée ouverte :

- **sans jeu de répliques, le service démarre quand même**, puis chaque écriture échoue en 500. Seule la santé le
  signale ;
- **la sérialisation canonique de l'audit laisse passer une `Date`, un `ObjectId` ou un `Buffer`** sans erreur. Une
  `Date` devient `{}`, et deux dates différentes donnent alors la même empreinte. Le défaut est latent : le type
  l'interdit, mais un `as` le ferait entrer ;
- **la course sur un même périmètre d'audit** n'a été prouvée que sur des doubles ;
- **l'atomicité de l'audit et de l'écriture tracée** n'a été prouvée que sur des doubles ;
- **le rejeu de la dérivation sur une obligation d'avant 563** (sans `redevableId`) n'a été prouvé qu'en lecture de code.

## Ce que la story livre

1. **Une garde au démarrage** (`GardeJeuDeRepliques`, `onApplicationBootstrap`) : si le MongoDB métier n'appartient à
   aucun jeu de répliques (`hello.setName` vide), le service **refuse de démarrer**, avec un message qui dit pourquoi
   et quoi faire. Un secondaire au démarrage ne bloque pas : c'est une bascule, que la santé signale.
2. **La sérialisation canonique fermée** : seuls les objets **simples** (prototype `Object.prototype` ou `null`) sont
   admis. Une `Date`, un `ObjectId`, un `Buffer`, une `Map`, un `Set` ou une instance de classe lèvent une erreur
   nommée, qui dit le type rencontré.
3. **Trois preuves sur un vrai MongoDB** (`test:conformite`) :
   - deux écritures **parallèles** sur un même périmètre d'audit produisent les `seq` 1 et 2, aucune erreur, et une
     chaîne intacte ;
   - un audit qui échoue **annule** l'écriture qu'il trace : rien n'est écrit, ni la donnée ni la trace ;
   - une obligation d'**avant STORY-563** (sans `redevableId`, sans les champs de 314) est **reprise** par la
     dérivation de l'entreprise : aucun doublon, champs dérivés récrits, champs humains intacts.

## Critères d'acceptation

- **AC-1** : `hello` sans `setName` ⇒ le démarrage échoue avec un message nommé ; avec un `setName`, le démarrage se
  poursuit, même sur un secondaire. Prouvé en unitaire **et** par `docker run` du service contre un MongoDB autonome.
- **AC-2** : `serialiserCanonique` refuse `Date`, `ObjectId`, `Buffer`, `Map`, `Set` et une instance de classe, en
  nommant le type. Les objets simples, `null`, les tableaux, les chaînes, les nombres finis et les booléens passent.
  Tous les faits d'audit existants passent.
- **AC-3** : sur un vrai MongoDB, deux écritures simultanées sur un même périmètre donnent `seq` 1 et 2, une chaîne
  intacte, et aucune erreur.
- **AC-4** : sur un vrai MongoDB, un audit qui échoue dans la transaction laisse la collection métier **inchangée**,
  sans aucune entrée au journal.
- **AC-5** : sur un vrai MongoDB, une obligation sans `redevableId` est reprise par la dérivation de l'entreprise : une
  seule ligne, `montantASaisir` posé, statut conservé.

## Definition of Done

- [x] Unitaires, e2e, conformité, lint et build verts.
- [x] Mutation-tests :
  - retirer la garde fait rougir AC-1 ;
  - rouvrir la sérialisation (laisser passer `Date`) fait rougir AC-2.
- [x] AC-1 joué sous Docker : le service s'arrête contre un MongoDB autonome, et démarre contre le jeu de répliques de
      la recette.
- [x] README « Mise en service » : la garde remplace la phrase « le service démarre quand même ».

---

## Livraison (2026-11-15)

**PR :** MoneyVibesGroup/prospera-fiscal-service#46, fusionnée sur `dev` (`8fdfc14`), arbre identique à l'arbre
testé.

### Décisions

- **D-904-1 : un secondaire au démarrage ne bloque pas.** Seule l'**absence** de jeu de répliques est refusée : une
  bascule de primaire est transitoire, et la santé la signale. Refuser de démarrer sur un secondaire bloquerait un
  redémarrage pendant une élection.
- **D-904-2 : la garde vit dans `DatabaseModule`**, à `onApplicationBootstrap`. L'invariant de câblage crée
  l'application en mode `preview`, sans ce crochet ; il n'en est pas perturbé.

### Preuves

- Unitaires **2376/2376** (dont la garde et les 7 refus de type), e2e **191/191**, conformité **65/65**, lint et build
  verts.
- **Conformité sur un vrai MongoDB** (`tenue-mongo.conformite-spec.ts`) :
  - **AC-3** : 5 écritures **simultanées** sur un même périmètre donnent `seq` 1 → 5, aucun rejet, chaîne intacte ;
  - **AC-4** : un audit qui échoue (une `Date` dans le contenu) laisse la collection métier sans la donnée, et le
    journal sans entrée ;
  - **AC-5** : une obligation d'avant 563, sans `redevableId` ni champs de 314, est reprise par la dérivation de
    l'entreprise. Le bilan vaut `inchangees: 1`, avec une seule ligne ; `montantASaisir` est posé, et le statut
    `EN_COURS` comme le responsable sont conservés. Rejouée, elle reste à une ligne.
- **Mutations** :
  - sérialisation rouverte : 7 tests unitaires et 1 de conformité rougissent ;
  - garde retirée du module : 1 test rougit.
- **Docker (AC-1)** :
  - contre un MongoDB **autonome** authentifié (`fiscal_app`), l'image s'arrête avec **le code 1** et le message
    « MongoDB n'appartient à aucun jeu de répliques : fiscal-service refuse de démarrer… » ;
  - contre `rs-fiscal`, elle démarre (« MongoDB : jeu de répliques « rs-fiscal », primaire »).

### Reste

- **Dette** (journal de A) : l'ancre externe de la tête de chaîne d'audit (299). Elle n'est pas dans cette story.
