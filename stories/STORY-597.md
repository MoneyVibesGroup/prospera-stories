# STORY-597 : Vue plateforme sur compteurs pré-agrégés — le filtre d'organisation n'est jamais levé

Status: done

**Épic :** EPIC-060 — Mesure de consommation, multi-devise et console d'exploitation
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S43
**Prérequis :** **STORY-596** (restitution par organisation)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-16, AR-12.

---

## Le fait

⛔⛔ **L'erreur de cette story ne se voit pas en test fonctionnel, seulement en audit.** La restitution
commerciale est **la porte** par laquelle le cloisonnement tombe.

Le raccourci coûte cinq minutes à écrire — un `if PLATFORM_ADMIN` dans un dépôt — et rend lisibles
hors de leur organisation un contact, un journal ou un modèle. **Ce qu'aucune exigence ne demande.**

## Critères d'acceptation

- [x] AC-1 — La vue toutes-organisations (FR-N61) lit **exclusivement des compteurs pré-agrégés** par
      `(orgId, canal, nature, période, devise)`, **maintenus à l'écriture** (AR-12).
- [x] AC-2 — ⛔ **Aucun chemin de code ne rend l'`orgId` facultatif sur une collection
      opérationnelle** : pas de `if PLATFORM_ADMIN` dans un dépôt, pas de filtre conditionnel.
      **Test de présence** sur l'ensemble des dépôts du service.
- [x] AC-3 — La vue est réservée au **rôle plateforme**, et un rôle tenant y reçoit `404` — jamais
      `403` (anti-énumération).
- [x] AC-4 — Aucun contact, aucun modèle, aucune ligne de journal n'est atteignable par ce chemin :
      il ne rend que des **nombres**. Test explicite.
- [x] AC-5 — Les compteurs sont **par devise** et ne sont jamais totalisés entre devises.

## Notes

- C'est la story du module dont la revue de sécurité doit être la plus attentive : le défaut est
  **fail-open par construction** si la garde est écrite comme une exception plutôt que comme une
  absence de chemin.

---

## Ce que la livraison a appris

### ⛔⛔ AC-2 ne se tient pas par une garde : il se tient par une ABSENCE D'INJECTION

La garde de balayage existe et refuse les trois écritures du raccourci — l'étalement conditionnel, le
ternaire sur la valeur, le `delete filtre.organizationId`. Mais ce n'est pas elle qui rend l'AC vrai.

Ce qui le rend vrai, c'est que `VuePlateformeService` **n'a aucun modèle opérationnel injecté**. Il ne
connaît qu'une collection, `compteurs_consommation`, dont aucun document ne désigne quiconque. La
question « et si on relevait le filtre d'organisation ? » n'a **aucun endroit où se poser** : il n'y a
pas de dépôt à assouplir.

⚡ **Corollaire qui n'était pas évident** : puisque la vue **additionne** toutes les organisations,
l'`orgId` n'est pas « facultatif » — il n'est pas dans la question. Un test vérifie que le mot
n'apparaît nulle part dans le pipeline.

### ⛔⛔ Le gate d'AD-18 et la porte plateforme sont EXCLUSIFS, jamais superposés

Découvert par l'e2e de STORY-596 et exploité ici. `@RequiresEnvoiAccess()` exige un droit d'usage
`ACTIVE` sur une **organisation** ; un opérateur plateforme n'en a aucune et reçoit
`403 NOTIFICATION_NOT_ENTITLED` **avant** le contrôleur. Une vue toutes-organisations posée sous le
gate aurait été inatteignable par son seul public — et le défaut se serait présenté comme un problème
de droits, c'est-à-dire au mauvais endroit.

⚡ **Deux publics, deux gardes.** L'e2e monte le gate d'AD-18 **exprès**, pour prouver que la route
n'est pas sous son autorité.

⚡ **Le critère est l'ABSENCE d'organisation, pas le nom d'un rôle.** Les rôles plateforme sont des
**données** (D15) : un `roles.includes('PLATFORM_ADMIN')` figerait dans le code une liste que l'IdP
fait vivre, et un persona ajouté demain exigerait de livrer ce service pour voir quoi que ce soit.
`tenantId === null` est la seule chose que le jeton dit sans convention. Un test le prouve dans les
deux sens : un persona inconnu passe, un porteur de tenant **portant** un rôle plateforme est refusé.

⚠️ **`404`, jamais `403`, et le même code que « la ressource n'existe pas ».** Un `403` apprend que la
route existe — donc qu'une vue toutes-organisations existe. L'anti-énumération d'AD-17 vaut aussi pour
les **surfaces**.

### ⛔ « Maintenus à l'écriture » veut dire : dans la MÊME transaction que le fait

Un compteur mis à jour après coup — par un travail de file, par un cron nocturne — diverge au premier
arrêt entre les deux, et **rien ne le dit** : le nombre reste plausible. Ici, si l'`Envoi` n'est pas
écrit, le compteur ne bouge pas ; s'il l'est, le compteur a bougé. La session de l'écrivain est passée
jusqu'au bout, et un test le vérifie.

⛔ **La période vient de `prepareLe`, jamais de « maintenant ».** Un accusé qui arrive le 1er du mois
suivant fait avancer le statut d'un envoi de la veille : compter la transition dans le mois **courant**
aurait fait décroître un mois clos et grossir le suivant — sur des chiffres déjà restitués.

⚡ **Le statut se maintient par TRANSITION, jamais par recomptage.** Un recomptage aurait relu la
collection opérationnelle : exactement le chemin que ces compteurs existent pour fermer.

### ⛔ La transition se compte depuis le statut qu'on QUITTE — et `enregistrerEchec` ne le savait plus

Deux écrivains ont un filtre à **une** origine (`statut: 'prepare'`) : la transition est connue sans
relecture. Le troisième, `enregistrerEchec`, admet **deux** origines — et il rendait le document
d'**après** (`new: true`). Le statut quitté y était déjà écrasé.

Il rend désormais l'instantané d'avant (`new: false`). ⚠️ **Une transition comptée depuis le mauvais
statut ne se rattrape pas** : elle laisse une case négative que rien ne recalcule, puisque justement
on ne recalcule jamais.

⚠️ **Et le double de test a dû apprendre à honorer `new`** — troisième occurrence de cette leçon après
`champ: null` (STORY-594) et `cout.source` (STORY-595). Un double qui rend toujours le document mutable
aurait rendu **vert** un test de « on compte depuis l'ancien statut » sur un service qui compte depuis
le nouveau.

### ⚠️ Le double doit rendre `modifiedCount`, comme Mongo

Le service ne corrige le compteur que si l'`Envoi` a **réellement** changé — le filtre
`cout.source: 'BAREME'` fait qu'un second accusé ne modifie rien. Un double qui rend `{}` aurait rendu
vert un test de « on corrige une fois » sur un service qui ne corrige jamais. Même famille que
ci-dessus : **un double qui ne rend pas ce que le code lit teste le double, pas le code.**

### ⚡ Un lot compte en UNE écriture, et le nombre vient du COMPTAGE

Les lignes d'un envoi de masse partagent organisation, canal, nature, devise et période : une écriture
par ligne aurait ajouté cinq cents allers-retours pour incrémenter cinq cents fois la même case.

⛔ **Et le nombre vient de `apres − avant`, jamais de `lot.length`.** Une reprise réinsère des lignes
que l'index unique rejette (STORY-592) : compter la taille du lot aurait gonflé le compteur à chaque
reprise — exactement le défaut que la reprise existe pour éviter, transposé sur les chiffres.

⚠️ **C'est aussi là que l'entier sort de ses bornes** : cinquante mille messages multiplient un tarif
par cinquante mille. Le contrôle `isSafeInteger` est posé sur le cumul, pas sur l'unité.

### ⛔ Un `Cout` traverse le compteur — la garde de STORY-595 l'a exigé

`FaitCompte` déclarait `montantMineur: number` à côté de `devise: string`. La garde `aucun-cout-nu` a
rougi, et elle avait raison : c'est une **signature interne**, exactement ce qu'AC-3 de STORY-595
ferme. Le type porte maintenant `cout: Cout`. Trois autres appelants s'en sont trouvés simplifiés.

⚡ La même garde a attrapé une **projection Mongo** (`lean<{ cout: { montantMineur: number } }>`) —
une redéclaration de coût dans un endroit auquel personne n'aurait pensé.

### ⛔⛔ La garde de suppression complète (STORY-587) a réclamé une DÉCISION, pas une ligne

Toute collection portant un `organizationId` doit figurer soit dans ce qu'on efface à la résiliation,
soit dans ce qu'on conserve **avec sa raison**. Il n'existe pas de troisième case, et la garde ne
laisse pas passer un nouveau schéma.

Les compteurs suivent `agregats_envois` : ils sont **effacés**. ⚠️ **La conséquence est assumée et doit
être dite** : la vue toutes-organisations perd l'historique d'un client résilié, y compris pour des
périodes déjà restituées. C'est ce que FR-N67 promet, et la mesure commerciale d'un client parti est
exactement ce qu'il peut demander d'effacer. Ce qui subsiste est la trace d'audit d'AD-14.

### ⚠️ La garde AC-2 a rougi sur la JOURNALISATION, et elle avait tort

`...(tenantId ? { tenantId } : {})` enrichit une ligne de log quand il y a un tenant. C'est la même
écriture qu'un filtre conditionnel et **le geste opposé** : un champ absent d'une ligne de log ne rend
rien de visible à personne ; un champ absent d'un filtre rend tout visible à tout le monde. La garde
est donc un **inventaire** d'un seul fichier, doublé d'une assertion plus forte : aucun fichier de
`modules/` n'en pose.

### ⚠️ Un `?orgId=` doit être REFUSÉ, pas ignoré

`whitelist: true` le transforme en `400`. Ignoré, il aurait laissé croire à une vue paramétrable qui
n'existe pas — et le jour où quelqu'un l'aurait câblée, personne n'aurait vu la porte s'ouvrir. La vue
n'accepte **que** deux bornes de période : pas même un filtre de canal, parce que chaque filtre offert
à la plateforme est une occasion de cibler.

## Points ouverts

- ⛔ **`compteurs_consommation` et `agregats_envois` comptent les mêmes faits, par deux mécanismes.**
  Le premier existe dès le premier envoi et se maintient à l'écriture ; le second est écrit par la
  purge à treize mois. Aucun double comptage — la vue plateforme ne lit que le premier — mais c'est une
  redondance, et une redondance de **compte** finit par diverger. **Recommandation** : les fondre en
  une seule collection dans une story ultérieure, la purge n'ayant alors plus qu'à supprimer le détail.
  Non fait ici parce que cela change le comportement et le compte rendu d'une story déjà livrée
  (STORY-586).
- ⚠️ **Une passerelle qui facturerait dans une autre devise que le barème n'est pas traitée.** La
  correction de coût s'applique sous la devise **figée** : corriger sous une autre ouvrirait une
  seconde case et laisserait la première trop haute. Un tel écart est un fait à traiter, pas un écart
  à cumuler.
- ⛔ **Aucun droit ne garde la vue plateforme, seulement l'absence d'organisation.** Les cinq droits de
  FR-N53 s'exercent chez un client ; un opérateur plateforme n'en détient aucun (claim `perms` vide
  pour un rôle tenant, D15), donc un `@RequiertDroit` aurait fermé la route à tout le monde. **Point
  PO** : un droit de portée **plateforme** est exactement ce que le catalogue sait porter aujourd'hui
  — c'est la leçon de `paiement-service` STORY-289 — mais AD-18 en énumère cinq, et en ajouter un
  sixième est un arbitrage.
- ⚠️ **Les compteurs démarrent vides.** Les envois écrits avant cette story ne sont comptés nulle part ;
  la vue plateforme ne montre donc que ce qui est parti depuis. Aucune reprise n'est prévue — elle
  exigerait de relire la collection opérationnelle, c'est-à-dire d'écrire une fois le chemin que toute
  la story ferme.
