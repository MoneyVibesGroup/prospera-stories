# STORY-642 : Recette du rail D — de la panne jusqu'à l'arrêté

Status: done

**Épic :** EPIC-060 — Mesure de consommation, multi-devise et console d'exploitation
**Service :** `notification-service`
**Points :** 5 · **Sprint :** S41 · 🏁 **Recette du rail D**
**Prérequis :** l'ensemble du rail D (**STORY-633 → 641**)
**Origine :** rail D, bloc D4.

---

## Le récit

En tant qu'**équipe**, je veux une recette qui traverse une panne de passerelle, une adresse morte,
un envoi différé et une clôture de période, afin de savoir que le service tient un mois de
production sans le rail C.

## Critères d'acceptation

- [x] AC-1 — Une passerelle tombe, la quarantaine s'ouvre, le repli nommé prend, la vérification la
      rouvre.
- [x] AC-2 — Une adresse rebondit dur ; le second envoi sort en `ecarte` et **le premier reste
      `delivre`**.
- [x] AC-3 — Un envoi programmé hors fenêtre attend, part à l'heure, et un code de vérification le
      double.
- [x] AC-4 — Un accusé arrive **après** la clôture et tombe dans la période suivante, sans rouvrir
      l'arrêté.
- [x] AC-5 — Un fait est remis chez l'organisation, signé, sans contenu ; le rejeu recopie.
- [x] AC-6 — ⛔ Aucun code conditionnel `si production` sur ce chemin, et `aucune-facturation.spec.ts`
      est **verte**.

---

## Journal de livraison (2026-09-08) — branche `MNV-642`

**Livré :** `src/recette/rail-d.recette.spec.ts`. 🏁 **Rail D complet — STORY-633 → 642.**
Lint, build, unitaires et e2e au vert.

### ⛔ Une recette ne remesure pas ce que chaque story a déjà prouvé

Chacune des neuf précédentes porte ses propres tests, sur ses propres doubles. Recopier leurs
assertions ici aurait produit une **seconde vérité** à tenir d'accord avec la première — et le jour
de l'écart, personne n'aurait su laquelle avait raison. Ce que la recette prouve, c'est que les
règles **se chaînent** :

- la quarantaine s'ouvre sur le refus qu'un adaptateur produit **vraiment**, et pas sur un refus
  métier ;
- l'écart d'une adresse supprimée **n'efface pas** la remise précédente ;
- la fenêtre d'envoi ne peut pas concerner un code de vérification ;
- la période d'un fait vient de l'envoi, jamais de l'accusé.

### ⚡ Elle compose les FONCTIONS DE DÉCISION, pas des doubles de base

Un scénario monté sur des doubles de collection aurait mesuré **les doubles** — c'est la faute que
STORY-592 a nommée en exigeant un *comptage* plutôt qu'une mise en scène, et que la présente série a
retrouvée sept fois sous la forme « le double doit se comporter comme Mongo ». Ici chaque assertion
traverse le code qui décide réellement : `compteVersLaQuarantaine`, `etatDe`, `qualifier`,
`projeterStatut`, `dansLaFenetre`, `prochaineOuverture`, `delaiDeRemise`, `agregerTotaux`,
`periodeMensuelle`, `corpsDuFait`, `signerCorps`. Si deux stories du rail se contredisent, la
contradiction apparaît **ici**.

### ⛔⛔ L'assertion qui vaut le rail entier

`projeterStatut('delivre', 'echoue')` rend **`delivre`**. C'est la phrase que `statut-envoi.ts`
portait depuis STORY-579 — *« un rejet différé, une plainte, est un fait nouveau […] il produira son
propre objet »* — et le rail D a construit cet objet. La recette vérifie les deux moitiés dans le
même test : le passé n'est pas réécrit, **et** le fait est bien qualifié.

### ⚡ Le même instant, deux verdicts

`21 h 30 UTC` est **dans** la fenêtre `8 h – 22 h` à Lomé et **hors** de celle-ci à Paris. C'est
exactement l'assomption A4 que STORY-594 avait nommée et que STORY-636 a fermée — et c'est la seule
assertion de la recette qui échouerait si quelqu'un remettait un jour la lecture en UTC.

### ⛔ AC-6 se prouve par l'EXISTENCE des deux gardes de programme, pas par leur copie

`aucune-facturation.spec.ts` (STORY-596) et `aucun-si-production.spec.ts` (STORY-577) balaient déjà
**l'intégralité de `src`** — donc tout ce que le rail D a ajouté. Les rejouer dans la recette aurait
créé la seconde vérité qu'on refuse partout ailleurs. La recette vérifie qu'elles sont là, et la
suite complète vérifie qu'elles sont vertes.

⚡ Fait notable : **aucune des dix stories du rail n'a eu à toucher ces deux gardes.** La clôture de
période (STORY-639) est celle qui aurait pu — c'est elle qui rend la facturation possible — et elle
ne lit aucun solde, ne compare aucun quota, ne refuse aucun envoi.

### ⚠️ Ce que la recette ne prouve pas, et le dire fait partie du travail

- **Aucune traversée HTTP.** La recette du rail B (STORY-629) monte l'application ; celle-ci compose
  des fonctions. La raison est que les objets du rail D sont majoritairement **sans surface HTTP sur
  le chemin de traversée** — la quarantaine s'ouvre dans un exécutant de file, la clôture est un
  geste d'exploitation, le fait sortant part d'un drain planifié. Un scénario HTTP aurait dû
  simuler ces trois-là, c'est-à-dire mesurer la simulation.
- **Aucune conformité Docker.** Aucune des dix stories du rail n'a été éprouvée contre un vrai Mongo
  ni un vrai Redis. Les index partiels (suppressions, arrêtés, faits sortants), le comportement
  `delayed` de BullMQ et les deux planifications sont prouvés **par test sur les options**. C'est le
  point ouvert le plus lourd du rail, et il est le même pour les dix.
- **Le rail C n'est pas là.** La convergence (STORY-643 → 649) reste à faire : un arrêté ne devient
  pas une créance, un encaissement ne fait pas partir de reçu, un distributeur n'est pas facturé.

### 🏁 Le rail D, en une phrase par story

| Story | Ce qu'elle ferme |
| --- | --- |
| 633 | Un rebond dur cesse d'être réessayé — la qualification est une table, jamais un texte libre. |
| 634 | Une passerelle en panne cesse d'être appelée — la santé publie, la quarantaine décide. |
| 635 | Un secret tourne sans couper — l'ancien cesse d'être servi à une **date**. |
| 636 | La fenêtre se lit dans le **fuseau** de l'organisation — A4 est fermée. |
| 637 | Un envoi se programme et s'annule — le point de non-retour est la sortie de `prepare`. |
| 638 | Le journal produit un extrait **opposable** — trois réponses par statut, jamais deux. |
| 639 | Une période **cesse de bouger** — sans lire un solde ni comparer un quota. |
| 640 | L'organisation voit tout, et n'écrit **rien**. |
| 641 | Les faits partent chez le client, **signés et sans contenu**. |
| 642 | Les neuf tiennent ensemble. |
