# STORY-586 : Deux horloges, purge tracée et agrégats anonymes à 13 mois

Status: done

**Épic :** EPIC-062 — Rétention, purge et fin de relation
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S42
**Prérequis :** **STORY-585** (plafonds) · **STORY-579** AC-9 (squelette et variables séparés)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-15, AD-18.

**Livrée le 2026-09-06** — branche `MNV-586` de `prospera-notification-service`, sur `origin/dev`.
1 884 tests unitaires (156 suites) + 142 e2e ; couverture 98,91 / 91,52 / 95,96 / 98,97.

---

## Le fait

⚡ **Deux horloges, et c'est cette story qui consomme l'AC-9 de STORY-579.** Le journal détaillé vit
**13 mois** puis devient des agrégats anonymes ; les **variables** vivent **90 jours** puis sont
retirées, laissant le squelette : destinataire, `modele@version`, canal, statut, coût.

Si le schéma de STORY-579 avait mélangé les deux, cette story exigerait une **migration**.

## Critères d'acceptation

- [x] AC-1 — À **90 jours**, les variables sont retirées de l'`Envoi`. Le squelette reste.
- [x] AC-2 — À **13 mois**, le journal détaillé est remplacé par des **agrégats anonymes** —
      compteurs par envoi de masse, canal et période (FR-N66).
- [x] AC-3 — ⚡ **Les accusés suivent le journal** (13 mois) et n'ont **pas d'horloge propre** : un
      accusé sans l'`Envoi` qu'il qualifie ne prouve rien et ne s'interprète plus.
- [x] AC-4 — ⚠️ **Conséquence à dire, pas à subir** : la fenêtre de **rejeu manuel** d'un envoi échoué
      (FR-N40) est donc **bornée à 90 jours**, et STORY-598 doit l'annoncer dans la console.
- [x] AC-5 — Chaque exécution de purge écrit son **compte rendu consultable** — volume, catégorie,
      échéance appliquée (FR-N65). *Une purge qui ne laisse pas de trace n'est pas vérifiable.*
- [x] AC-6 — ⛔ La purge est un **travail BullMQ à clé idempotente** (AD-18). Aucun `setInterval`,
      aucune minuterie applicative. ⛔ **La seconde moitié de cet AC — « avec le second compte de
      maintenance » — n'est PAS livrée, et ce n'est pas un oubli : voir ci-dessous.**
- [x] AC-7 — La purge **préserve** la preuve de consentement et de désabonnement au-delà de la donnée
      qu'elle protège (FR-N68).

## Notes

- Le **rendu figé n'est jamais conservé** (AD-15). Cette story ne le purge pas : elle vérifie qu'il
  n'existe pas. ✅ Fait, par une garde sur les schémas de l'`Envoi` et de ses variables.

---

## Ce que la livraison a appris

### ⛔ L'idempotence d'une purge ne vient PAS de sa clé de travail

Supprimer deux fois est inoffensif : le second passage ne trouve rien. **Compter** deux fois ne l'est
pas — un agrégat incrémenté puis réincrémenté raconte un volume qui n'a jamais eu lieu, et **rien ne
le contredira jamais**, puisque les `Envoi` qui auraient servi de preuve viennent d'être détruits.

La clé idempotente du travail BullMQ empêche deux exécutions du **même jour** ; elle n'empêche pas un
double comptage entre deux jours. Ce qui l'empêche est structurel : **compter et supprimer sont le
MÊME geste**, dans la même transaction. Un document est compté exactement quand il disparaît — jamais
avant, jamais après. Un test repasse la purge sur une base déjà purgée et vérifie que l'agrégat ne
bouge pas.

*Généralisable : quand une opération détruit ce qui prouverait son résultat, la trace ne peut pas
être postérieure au geste.*

### ⛔ AC-6 et AC-7 sont incompatibles, et c'est le modèle de privilèges qui gagne

L'AC-6 demande que la purge tourne avec le **second compte de maintenance** (STORY-571 AC-4). Deux
faits vérifiés :

1. ce compte est `dbOwner` sur la base de **preuves** et n'a **aucun droit** sur la base métier,
   c'est-à-dire sur tout ce que cette purge retire ;
2. surtout, l'employer **détruirait AC-7**. Aujourd'hui le serveur refuse toute suppression sur
   `consentements`, `audit_envois` et `actes_droits` au compte du service : la preuve survit à la
   donnée qu'elle protège **par privilège, pas par vigilance**. Avec `dbOwner` dans le processus, la
   purge gagnerait le pouvoir d'effacer exactement ce qu'elle doit préserver — et le boot-guard
   `verifierAbsenceDuCompteDeMaintenance` (STORY-571) refuse d'ailleurs de démarrer si ses
   identifiants apparaissent dans l'environnement.

La purge tourne donc avec le **compte applicatif**, et c'est précisément ce qui tient AC-7. Le compte
de maintenance garde son emploi : l'exploitation de la base de preuves, que ce service ne fait pas.
Une garde ferme l'autre moitié — ni le service de purge ni son module ne peuvent **nommer** une
collection protégée. *Même famille que STORY-583 : quand un AC et une règle du dépôt se contredisent,
la règle gagne et l'AC s'amende.*

### ⛔ Aucun index TTL, nulle part

MongoDB sait supprimer seul un document expiré. Un `expireAfterSeconds` sur `expireLe` aurait tenu
AC-1, AC-2 et AC-3 à lui seul, en trois lignes — et rendu **AC-5 impossible** : pas de volume, pas de
catégorie, pas d'échéance appliquée, et surtout aucun moyen de savoir que la purge a cessé de
tourner. La règle était déjà écrite par STORY-583 sur le jeton de désabonnement (*une expiration de
serveur ne se raconte dans aucun journal*) ; elle est désormais tenue par une garde qui balaie tous
les schémas, écrite en **inventaire** — le marqueur d'idempotence Kafka de STORY-572 porte
légitimement un TTL, et il est nommé.

### ⚡ Ce qui reste après treize mois, et pourquoi la devise est dans la clé

| clé de l'agrégat | pourquoi |
| --- | --- |
| organisation | sans elle, l'agrégat ne sert à personne et le cloisonnement n'a plus de clé |
| période (mois **UTC**) | découpée sur `prepareLe`, jamais sur la date de purge |
| canal, nature | ce que FR-N66 demande de compter |
| **devise** | **dans la clé** : additionner des XOF et des NGN demande alors de fusionner deux documents, ce qu'on ne fait pas par distraction (AD-16) |
| `envoiDeMasseId` | déclaré **sans écrivain** — l'ajouter plus tard à un index unique imposerait de le reprendre sur une collection peuplée (patron STORY-574) |

Et rien d'autre : aucun destinataire, aucune variable, aucun identifiant d'envoi. Une garde refuse
ces champs **par leur nom**, parce que le geste qui les rendrait (« juste pour déboguer ») rendrait au
journal, sous un autre nom, ce que les treize mois viennent de lui retirer.

### ⚡ Le compte rendu est par ORGANISATION, et il s'écrit lot par lot

Un compte rendu global n'aurait eu d'autre lecteur que l'exploitation — alors que la conservation est
opposable à l'**organisation**. C'est pour cela que la purge **lit les identifiants avant de
supprimer** au lieu d'un `deleteMany` global : `deletedCount` ne dit pas de quelle organisation
venaient les documents, et une ventilation au prorata aurait produit un nombre exact en apparence et
faux en fait.

Il s'écrit **dans la transaction qui supprime**, lot par lot. Écrit à la fin de l'exécution, il
n'existerait pas du tout si le processus s'arrêtait au milieu — or c'est exactement le passage dont on
voudrait la trace. ⚠️ Une organisation dont rien n'a été purgé **n'a pas de ligne**.

### ⚡ Un `setInterval` aurait échoué de deux façons à la fois

① Il vit dans un processus : le jour où celui-ci redémarre à 02 h 59, la purge du jour n'a pas lieu et
rien ne le dit. ② Il vit dans **chaque** processus : deux répliques purgent deux fois, en même temps,
chacune supprimant des lots que l'autre vient de compter. La file répond aux deux — la planification
survit au redémarrage parce qu'elle vit dans Redis, et sa **clé fixe** fait que N répliques
programment **une** purge.

⚠️ **La cadence vit dans le code**, et ce n'est pas un oubli : la garde d'AC-3 de STORY-585 refuse
toute variable d'environnement dont le nom porte `PURGE`. Le choix est explicite plutôt qu'absent.

⚡ **L'identifiant d'exécution est dérivé du jour traité**, jamais tiré au sort : le compte rendu est
keyé par `(executionId, organizationId)`, et un identifiant aléatoire ferait d'une reprise après
incident une **seconde** ligne — « ce qu'a retiré la purge de mardi » aurait alors deux réponses.

### ⚠️ Le reste, en bref

- **L'ordre des étapes compte.** Les variables partent **avant** le journal : un arrêt entre les deux
  laisse un squelette privé de ses variables — l'état visé — et jamais l'inverse.
- **Les accusés partent avec leur `Envoi`, dans la même transaction**, même quand leur échéance est
  future : ce qui les gouverne est l'`Envoi` qu'ils qualifient. Le seul accusé qui expire de lui-même
  est l'**orphelin**, celui qui ne qualifie rien.
- **Les jetons de désabonnement périmés partent enfin**, laissé ouvert par STORY-583. ⚠️ Leur échéance
  ne vient **pas** de la politique de conservation — un lien n'est pas une donnée qu'on conserve,
  c'est un droit d'accès qui périme. La route rend cette table avec les volumes, faute de quoi un
  volume `JETONS_DESABONNEMENT` se lirait comme une durée configurable.
- **Les lots sont bornés à 500** : un `deleteMany` sans limite sur treize mois de journal est une
  transaction déguisée dont personne ne connaît la taille (leçon STORY-584).

## ⛔ Décisions PO et points ouverts

1. **AC-6 est amendé** : la purge tourne avec le compte applicatif, pas avec le compte de
   maintenance. Le motif est écrit ci-dessus ; il n'y a pas d'arbitrage à rendre, seulement un texte
   d'AC à corriger.
2. **Aucun droit ne garde la lecture du compte rendu** — c'est le rappel de la décision ouverte
   depuis STORY-573, et elle vaut désormais pour six surfaces.
3. **Rien n'a été éprouvé contre un vrai Mongo** : la purge exige des transactions multi-collections,
   donc un réplica set. Les tests unitaires simulent `$lte`, `$in` et `$exists` vraiment, mais la
   preuve que les écritures d'un lot **commitent ensemble** appartient à une conformité Docker, à
   ajouter quand la stack sera relancée.
