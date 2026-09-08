# STORY-639 : La période de consommation se clôt et devient immuable

Status: done

**Épic :** EPIC-060 — Mesure de consommation, multi-devise et console d'exploitation
**Service :** `notification-service`
**Points :** 5 · **Sprint :** S40
**Prérequis :** **STORY-596** (consommation par période), **STORY-597** (compteurs pré-agrégés), **STORY-624** (barème contracté)
**Origine :** rail D, bloc D3 · AD-16, FR-N59, FR-N63.

---

## Le récit

En tant que **plateforme**, je veux qu'une période de consommation cesse de bouger, afin que le
chiffre d'un mois soit le même la semaine prochaine qu'aujourd'hui.

## Le fait

⛔ **C'est la story qui rend la facturation possible sans la faire** — et la garde
`aucune-facturation.spec.ts` doit rester **verte** à la fin.

⚡ **Un compteur qui bouge encore n'est pas facturable.** La période vient de `prepareLe` et le
compteur se maintient dans la transaction du fait ; un accusé tardif peut donc changer le passé.

## Critères d'acceptation

- [x] AC-1 — Une période close porte un **arrêté** : totaux par canal et par devise, **jamais
      additionnés entre devises**.
- [x] AC-2 — Un fait arrivant après la clôture tombe dans la période **suivante**. ⛔ Il ne rouvre
      rien.
- [x] AC-3 — La clôture est **idempotente** et rejouable : deux appels produisent un seul arrêté.
- [x] AC-4 — L'arrêté cite la **révision de barème** qui l'a produit.
- [x] AC-5 — ⛔ Aucun solde lu, aucun quota comparé, aucun envoi refusé parce qu'il coûte.

---

## Journal de livraison (2026-09-08) — branche `MNV-639`

**Livré :** `domain/consommation/arrete.ts`, `ArreteConsommation`, `ClotureService`, l'imputation
des faits tardifs dans le compteur, deux routes. Lint, build, unitaires et e2e au vert — et la garde
d'absence de facturation **verte**.

### ⛔⛔ « On ne clôt qu'une période TERMINÉE » est ce qui rend la story tenable

C'est l'invariant central, et il n'est pas seulement de bon sens comptable. Un fait dont la période
est le **mois courant** ne peut pas tomber dans une période close : le compteur n'a donc **aucune
lecture** à faire pour l'immense majorité des écritures. Sans cet invariant, chaque `Envoi` écrit
aurait payé une lecture de plus — dans la transaction la plus chaude du service, sur le chemin de
chaque message. Seul un fait **tardif** consulte les clôtures, et c'est exactement le cas que la
clôture existe pour traiter.

⚠️ Un test vérifie que la clôture n'est **jamais** consultée pour un fait du mois courant.

### ⛔ AC-1 — l'agrégation se fait EN MÉMOIRE, et pas par un `$group`

Deux raisons, et la seconde décide. `$group` n'accepte que des accumulateurs **plats** — un total
par couple (canal, devise) demanderait une clé composite puis une seconde passe. Et surtout **aucun
double de collection n'interprète un pipeline** : la règle la plus chère du service — ne jamais
additionner deux devises — ne serait éprouvée par **aucun test unitaire**. Le volume est celui d'une
organisation sur un mois : une dizaine de documents.

⛔ La clé d'agrégation porte la **devise**. Sans elle, 300 XOF et 5 000 NGN tomberaient dans la même
case et produiraient un nombre qui n'a pas d'unité — et qui n'a pas non plus de faute : il
s'affiche, il se somme, il se compare. C'est le mode de panne qu'AD-16 ferme depuis STORY-595, et un
arrêté est précisément l'endroit où l'on est tenté de « donner un total général ».

⚠️ La **nature** disparaît du total, et c'est voulu : un arrêté dit ce que la période a coûté, pas
comment il se ventile. La ventilation reste sur les compteurs, qui **ne sont pas effacés** —
déplacer les données aurait fait de la clôture une migration, donc un geste qu'on n'ose plus
rejouer.

### ⛔ AC-3 — l'idempotence vient de l'INDEX, jamais d'une lecture préalable

Deux appels concurrents tentent tous deux l'insertion ; le second reçoit un `E11000`, qui est un
**succès** — la période est close, ce qui est exactement ce qu'on voulait. Un test vérifie que la
première clôture n'a lu **aucun** arrêté avant d'écrire.

⚡ **Et le second appel rend l'arrêté D'ORIGINE, avec son auteur d'origine.** Rendre les totaux
qu'on vient de recalculer aurait produit deux réponses différentes pour la même période — la seconde
tenant compte des faits arrivés depuis, c'est-à-dire exactement de ce que la clôture fige.

### ⛔ AC-2 — un report se MARQUE, sinon il est invisible

Un fait tardif est imputé à la première période ouverte ; la date d'origine reste sur son `Envoi`.
Mais sans marque, un mois grossirait de faits qui n'ont pas eu lieu pendant lui, et personne ne
saurait pourquoi. Le compteur porte donc un ensemble `periodesReportees`.

⚡ **Un ensemble, pas une clé.** Ajouter la période d'origine à la clé d'unicité aurait multiplié les
cases — une par couple (origine, imputation) — et dédoublé toutes celles qui existent déjà.

⚠️ **La boucle d'imputation est bornée à douze pas.** Sans borne, une base incohérente ferait tourner
un compteur **dans une transaction** ; au-delà, on impute au mois courant, qui n'est jamais clos par
construction.

⛔ **Et `periodeSuivante` traite décembre.** Sans ce cas, `2026-13` serait écrit en base, aucune
lecture ne le retrouverait, et un mois entier disparaîtrait des restitutions — silencieusement. Le
mois garde toujours deux chiffres : `2027-1` casserait l'ordre lexicographique dont dépendent toutes
les comparaisons de période du service.

### ⚡ AC-4 — la révision de barème est DÉRIVÉE du contenu

Un barème vit dans les réglages d'une passerelle : il n'a ni numéro ni horodatage propre. Citer « la
configuration du jour » aurait fait dire à un arrêté de janvier ce que l'organisation paie en juin.
La révision se dérive donc du contenu — le remède exact de STORY-614 pour une passerelle candidate.
L'absence de barème contracté **se dit** (`aucun-bareme-contracte`), elle ne se tait pas.

⚠️ Les trois champs sont concaténés dans un **ordre fixe** : un `JSON.stringify` de l'objet suivrait
l'ordre d'insertion, et deux barèmes identiques saisis différemment auraient produit deux révisions
— donc un arrêté citant un changement de tarif qui n'a pas eu lieu.

### ⚠️ Le choix de BASE est décidé par FR-N67, pas par le goût de la preuve

Un arrêté est tentant à ranger dans la base protégée. Il n'y va **pas** : la base de preuves (AD-14)
atteste ce qui a été remis **à une personne**, et elle est ineffaçable par construction. Or un
arrêté est une **mesure interne** qui doit disparaître avec l'organisation (FR-N67) — l'y ranger
aurait créé une contradiction directe entre deux invariants du service. L'immutabilité tient donc à
l'index unique et au filtre d'insertion, pas au serveur.

⚠️ **Neuvième rattrapage de la garde de suppression complète**, et elle a encore raison :
`arretes_consommation` part avec l'organisation, comme les compteurs qu'elle fige.

### ⚡ Le test a trouvé une lecture de trop

Le test « un fait antérieur consulte les clôtures » attendait **un** appel et en a compté **deux** :
la clé et la marque de report résolvaient chacune l'imputation. Le second n'apprenait rien de plus
que le premier. Les deux viennent désormais d'une seule résolution.

### ⚠️ Points ouverts

- La clôture est **manuelle** : aucune tâche planifiée ne la déclenche. C'est délibéré tant que
  personne ne facture — un arrêté automatique serait un chiffre que personne n'a demandé, produit
  un jour que personne n'a choisi.
- L'arrêté ne porte **aucun total général**, par construction. Une console qui voudrait en afficher
  un devrait convertir, donc connaître des taux — ce que ce service ne détient pas.
- Aucune conformité Docker : l'idempotence par index unique est prouvée par test.
