# STORY-598 : Console d'exploitation bornée à quatre actions, et le fournisseur de candidats de l'assistant

Status: done

**Épic :** EPIC-060 — Mesure de consommation, multi-devise et console d'exploitation 🏁
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S43
**Prérequis :** **STORY-594** (envoi de masse suspendable) · **STORY-586** (fenêtre de rejeu de 90 jours)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-19.

---

## Le fait

⚡ **Bornée à quatre actions, et la borne est la fonctionnalité** : file d'attente, échecs et motifs,
rejeu d'un envoi échoué, suspension d'un envoi de masse (FR-N55). Une cinquième action ferait de la
console un **second chemin d'écriture** sur des objets qui ont déjà le leur.

## Critères d'acceptation

- [x] AC-1 — Console sur `admin-panel`, **exactement quatre actions**, énumérées. Un test de contrat
      refuse toute route supplémentaire.
- [x] AC-2 — ⚠️ **Le rejeu est borné à 90 jours (STORY-586 AC-4) et la console l'annonce.** Au-delà,
      les variables ont été retirées et le message ne peut plus être rendu — erreur nommée
      `FENETRE_REJEU_EXPIREE`. *Une action grisée sans motif serait lue comme une panne.*
- [x] AC-3 — ⛔ Les secrets de passerelle ne sont **jamais restitués** en lecture, ni journalisés, ni
      renvoyés par l'API (FR-N56, NFR-7). **La console est le dernier endroit où la tentation
      existe** — un test le vérifie sur la réponse réelle, pas sur le DTO.
- [x] AC-4 — ⚡ **Fournisseur de candidats** pour le moteur de règles de l'assistant (FR-N56b,
      `FR-IA03b`) : envois échoués non rejoués, destinataires dont **tous** les canaux échouent,
      modèles en attente d'approbation, envois de masse préparés jamais exécutés.
- [x] AC-5 — ⛔ Il **propose** des candidats ; **il ne déclenche aucune automatisation** (AD-19). Un
      test refuse tout chemin d'exécution depuis ce fournisseur.

## Notes

🏁 Clôt EPIC-060, le **bloc 3**, et le **Module 1** — hors EPIC-063 et EPIC-064, dont le déclencheur
est la signature du premier contrat de passerelle.

⚠️ **Une exigence reste partielle** : FR-N47 exige un moyen de désabonnement **adapté au canal**.
STORY-583 le livre pour l'e-mail et l'in-app ; sur les canaux où le refus arrive comme un message
entrant, il exige l'interception d'EPIC-064. **Les deux ne se séparent pas.**

---

## Ce que la livraison a appris

### ⛔⛔ La borne n'est pas une liste : c'est un module qui n'a AUCUNE route d'écriture

Deux des quatre actions — rejouer un envoi échoué, suspendre un envoi de masse — **existaient déjà**,
livrées par les stories qui possèdent ces objets. La console les **désigne** ; elle ne les
réimplémente pas.

⚡ **Conséquence : le module de console est entièrement en lecture.** Ce n'est pas une discipline de
revue, c'est une propriété vérifiable — un test lit les décorateurs du contrôleur et exige qu'ils
soient tous des `@Get`. « Une cinquième action ferait de la console un second chemin d'écriture »
cesse alors d'être une phrase : il n'y a pas de premier chemin d'écriture ici auquel en ajouter un
second.

⚡ **L'inventaire des quatre actions est SERVI, pas seulement documenté** (`GET /console/actions`).
`admin-panel` construit ses boutons depuis cette réponse : une cinquième action ne s'ajoute donc pas
« côté écran ». Et un test de contrat vérifie que chaque action déclarée **existe réellement** sur un
contrôleur du service — une console qui annoncerait une action sans route grise un bouton, et un
bouton grisé sans motif se lit comme une panne. C'est exactement le défaut qu'AC-2 ferme, retourné
contre l'inventaire lui-même.

### ⛔ « Rien à proposer » et « on ne sait pas encore » ne se lisent pas pareil

L'approbation de modèle n'a **aucun écrivain** dans ce service : `approbationModeleRequise` est une
**capacité de canal** (AD-6), pas un état de modèle, et aucune story n'a livré le circuit
d'approbation.

Rendre une liste vide aurait dit au moteur de règles de l'assistant « il n'y a rien à approuver » — un
**silence sur lequel il aurait construit une règle**. La famille est donc déclarée `disponible:
false`, avec son motif nommé. ⚡ C'est la transposition d'une leçon de STORY-249 : l'astuce
« l'absence EST la déclaration » ne se transpose pas quand l'absence se lirait « tout va bien ».

### ⚡ « Non rejoué » se lit de l'ABSENCE d'un envoi qui le rejoue

Un drapeau `rejoue: true` sur l'envoi échoué aurait fait dépendre la vérité d'une **écriture
supplémentaire** au moment du rejeu — donc d'un oubli possible, et d'un oubli qu'aucun test ne
verrait. La chaîne `rejeuDe` de STORY-579, elle, existe **parce que** le rejeu existe : elle ne peut
pas manquer sans que le rejeu manque aussi.

### ⚡ « TOUS les canaux échouent » se mesure par COMPARAISON, jamais par comptage

Un destinataire dont neuf envois sur dix échouent n'est pas injoignable ; celui dont **aucun** envoi
n'aboutit l'est. La différence sépare un incident d'un contact à corriger — et c'est précisément ce
que le moteur de règles doit pouvoir distinguer. Le pipeline compare donc `total` et `echoues`
(`$expr`), il ne seuille pas un nombre d'échecs.

⚠️ Et le destinataire ressort **masqué** : un fournisseur de candidats n'est pas une exemption à
NFR-7.

### ⚠️ « Préparé jamais exécuté » exige l'ABSENCE de `demarreLe`, pas seulement l'état

Un envoi de masse suspendu au premier lot est aussi « pas terminé », mais quelqu'un l'a bel et bien
lancé. L'état seul aurait proposé au moteur de règles de relancer ce que l'opérateur venait
d'arrêter.

### ⛔ Compter les files vit dans l'unique surface BullMQ, pas dans la console

`une-seule-surface-bullmq.spec.ts` (STORY-578) refuse tout import de la bibliothèque hors
d'`adapters/bullmq/`. La console reçoit donc des **nombres** : elle ne connaît ni `Queue`, ni Redis,
ni le nom d'une file — qui reste ce que le domaine décide, jamais ce qu'un appelant écrit.

⚡ **Trois comptes séparés, jamais totalisés.** Un total dirait « quatre-vingt mille en attente » là
où la vraie information est « la file du code de vérification est vide, celle de la campagne est
pleine » — c'est-à-dire tout ce que la disjonction d'AD-13 sert à savoir.

⚠️ **Une file injoignable rend des zéros, elle ne fait pas échouer la console.** L'exploitation
regarde cet écran **pendant** un incident : lui refuser la réponse au moment où Redis vacille lui
retire précisément l'information qu'elle vient chercher. L'indisponibilité, elle, est déjà dite par
`/health`.

### ⛔ AC-3 se vérifie sur la RÉPONSE, jamais sur le DTO — et le test ne peut pas passer à vide

Un DTO ne prouve rien de ce qu'un service sérialise : `class-transformer` n'est pas appliqué aux
objets rendus tels quels, et un champ ajouté au service **sort même s'il n'est déclaré nulle part**.

Le document que le double rend porte donc **deux secrets, sous deux noms différents** — exactement ce
qui arriverait si quelqu'un ajoutait un jour la configuration de passerelle à la ligne d'échec « pour
déboguer ». ⚡ **Et une assertion vérifie que le document les porte vraiment** : sans elle, un double
qui cesserait de les porter rendrait le test vert sur un service qui les recopie.

### ⚡ Quatrième droit existant qui couvre exactement ce qu'on ajoute

`notification:journal:consulter` garde toute la console. Elle **lit** ; ce qu'elle écrit, elle
l'écrit ailleurs, sous les droits de là-bas — `envoi-de-masse:executer` pour la suspension. Un droit
« console » aurait regroupé sous un seul nom deux niveaux d'autorisation que FR-N53 sépare exprès :
celui qui regarde une file d'attente n'est pas celui qui coupe une campagne de cinquante mille
messages.

Après `modele:rediger` (STORY-588), `envoi-de-masse:valider` (STORY-594) et
`journal:consulter` (STORY-596).

## Points ouverts

- ⚠️ **La console vit sur `admin-panel`, qui n'est pas ce dépôt.** Ce service livre son **contrat** :
  l'inventaire servi, les deux surfaces de lecture, et les deux routes d'écriture déjà existantes.
  L'écran reste à construire, et il n'a rien à décider — le test de contrat le lui interdit.
- ⛔ **`MODELE_EN_ATTENTE_APPROBATION` restera indisponible tant qu'aucun circuit d'approbation
  n'existera.** C'est une exigence de canal (WhatsApp, `approbationModeleRequise`) qui n'a jamais eu
  sa story. À trancher avec EPIC-063, dont le déclencheur est la signature du premier contrat de
  passerelle.
- ⚠️ **FR-N47 reste partielle**, et la fiche le disait déjà : le moyen de désabonnement adapté au
  canal est livré pour l'e-mail et l'in-app (STORY-583) ; sur les canaux où le refus arrive comme un
  **message entrant**, il exige l'interception d'EPIC-064. Les deux ne se séparent pas.
- ⚠️ La fenêtre d'observation des candidats est de **trente jours** et le plafond de **cinquante par
  famille** : deux constantes du code, non réglables. Elles bornent une **proposition**, pas une
  décision — mais elles mériteront d'être discutées le jour où le moteur de règles existera
  vraiment.
