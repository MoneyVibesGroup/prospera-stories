# Rail C — `paiement-service` : les 10 stories qui ferment le module

**Date :** 2026-09-07 · **Service unique :** `prospera-paiement-service` · **Branche d'intégration :** `dev`
**Total :** 37 points · **10 stories, toutes déjà écrites** dans `epics-paiement-2026-08-03.md`.
**Aucun identifiant nouveau n'est consommé par ce rail.**

> Le rail A s'est arrêté sur *l'argent qui entre*. Le rail C porte *l'argent qu'on prouve* :
> le relevé du fournisseur, le rapprochement, la contre-passation et la piste opposable.
> C'est le bloc qui transforme un encaissement en fait défendable devant un auditeur.

---

## Pourquoi ces dix-là, et pas les cinq autres qui restent

Le rail A a livré 237 → 266 (moins 247), 277 → 284, 288 → 290, 599 → 603, 606 → 608 et 613.
Il reste **quinze** stories au découpage du 2026-08-03. Dix entrent dans ce rail. Cinq n'y entrent
pas, et chacune pour une raison nommée :

| Story | Pourquoi elle n'est pas dans le rail C |
|---|---|
| STORY-247 — checkout API directe | ⛔ Porte le risque **R4** : la conformité carte devient un NFR de premier rang le jour où elle est livrée. À instruire avec le responsable conformité **avant** de la démarrer, pas à tirer dans un sprint. |
| STORY-267 — publication vers Relance | Le module **Relance (#24) n'existe pas**. Publier vers un consommateur absent, c'est figer un contrat que personne ne lira. |
| STORY-286 — console d'exploitation | Traverse `admin-panel`. Passe en **convergence**. |
| STORY-287 — candidats pour l'assistant | Traverse `assistant-service`. Passe en **convergence**. |
| STORY-285 — bornes lues des capacités | ✅ **Elle, si** — 2 pts, entièrement dans le service. Elle est au bloc C3. |

---

## Bloc C1 — Le rapprochement · 24 pts

### 1 · STORY-268 — Extraction du noyau `@prospera/rapprochement` et workspace npm

**Points :** 8 · ⚠️ **Hors service** — porte sur `balance-service` et sur l'outillage du dépôt.
⛔ **Bloque STORY-270. À tirer en premier, seule.**

⚡ **C'est la seule story du rail qui sorte du dépôt de paiement, et c'est pour cette raison
qu'elle existe.** `rapprochement.regles.ts` vit dans `balance-service` — 598 lignes pures, déjà
servies depuis STORY-089/090 — typées sur `LigneCahierAApparier`, `TypeCompteTresorerie` et
`MoyenPaiement`. Écrire STORY-270 sans cette extraction fabrique une **seconde** définition de
l'ambiguïté et de la fenêtre de date, dans un second service, et les deux divergeront en silence.

⚠️ **Le dépôt n'a toujours aucun `package.json` racine ni workspace npm** (constat du 2026-08-03,
non démenti au 2026-09-07). La story livre l'outillage autant que le paquet.

- Le paquet ne contient **que l'agnostique** : types génériques de ligne et de candidat, fenêtre
  floue de date, refus d'apparier en cas d'ambiguïté, scoring de libellé, qualification d'écart,
  empreinte de ligne anti-doublon. **Aucun type métier d'un service n'y figure.**
- Deux candidats équivalents ⇒ les **deux** sont proposés, **aucun** n'est choisi.
- `balance-service` rebranché, sa suite passe intégralement : le comportement de 089/090 est préservé.

### 2 · STORY-269 — Import du relevé de fournisseur

**Points :** 5 · **Prérequis :** aucun (peut partir en parallèle de 268)

⛔ **Un relevé est un référentiel de comparaison, pas une source d'écriture.** L'import ne crée
**aucun** encaissement. Le jour où quelqu'un l'écrit « pour rattraper les manquants », le service
cesse d'avoir une seule source de vérité sur l'argent.

- Empreinte de ligne : le ré-import chevauchant **ignore, compte et liste** — jamais ne duplique.
- Un import en simulation rend un aperçu **sans persistance**.

### 3 · STORY-270 — Cascade de clés de rapprochement

**Points :** 5 · **Prérequis :** 268 et 269

⚡ **Trois clés, et la troisième ne s'applique jamais seule.** Référence de transaction du
fournisseur ⇒ **certain**, appliqué. Référence de demande au libellé ⇒ **certain**, appliqué.
Triplet montant + devise + date à ±1 jour ⇒ **proposé**, et **jamais appliqué sans confirmation
humaine**. Hors des trois ⇒ **écart, avec son motif**, jamais comblé d'office.

### 4 · STORY-271 — Encaissement orphelin et affectation manuelle

**Points :** 3 · **Prérequis :** 270

Un paiement spontané est mis **en attente d'affectation** : ni rejeté, ni rattaché d'office. Le
rattachement porte son auteur et son motif.

### 5 · STORY-272 — Restitution du solde décomposé et export filtrable

**Points :** 3 · **Prérequis :** 271

⛔ **Aucun champ unique ne prétend être « le » solde.** Montant d'origine, encaissements confirmés,
encaissements déclarés non validés, `restantCertain`, `restantAffiche`, promesses en cours,
trop-perçu. C'est la story que liront **tous** les modules appelants — et celle sur laquelle se
branche la facturation de la consommation en convergence.

---

## Bloc C2 — L'annulation et la trace opposable · 8 pts

### 6 · STORY-274 — Annulation constatée par contre-passation

**Points :** 3

⛔ **Une contre-passation est une écriture de plus, jamais une correction.** L'encaissement
d'origine n'est **ni modifié ni supprimé**. Et il n'existe **aucune** initiation de remboursement :
le service ne détient pas les fonds — c'est NFR-1, vu depuis l'autre bout.

### 7 · STORY-275 — Rôle distinct et publication de l'annulation

**Points :** 2 · **Prérequis :** 274

⚡ **Celui qui a déclaré ou validé un encaissement ne peut pas l'annuler seul**, quelles que soient
ses permissions — `SEPARATION_POUVOIRS_VIOLEE`. Le refus vient de l'**historique de l'objet**, pas
du profil de la personne : c'est le seul endroit où une permission ne suffit pas.

### 8 · STORY-276 — Piste d'audit opposable sur toute opération d'argent

**Points :** 3 · **Prérequis :** 275

Toute opération d'argent — émission, encaissement, déclaration, validation, annulation, grâce,
réacheminement — produit une entrée attribuée à une personne **ou** à un module, avec son origine.
La chaîne d'empreintes détecte l'altération d'une entrée intermédiaire.

⚠️ **La restauration de `paiement_service_audit` est un acte tracé HORS application** : aucun
chemin applicatif ne peut la déclencher, et les chaînes sont revérifiées après.

---

## Bloc C3 — Ce que les autres modules attendent · 5 pts

### 9 · STORY-273 — Publication des encaissements vers Facturation, Finance et comptabilité

**Points :** 3 · **Prérequis :** 274

`paiement.encaissement.*` publié **via l'outbox, dans la même transaction** que l'écriture.
`paiement.creance.soldee` et `paiement.creance.tropPercu` sur les états atteints.

⛔ **Le service publie l'événement, il n'écrit pas le journal comptable.** Une garde le vérifie.

⚡ **C'est le producteur qui rend possible la convergence 644** : le jour où un encaissement doit
faire partir un reçu, c'est ce topic qui parle — pas un appel du paiement vers la notification.

### 10 · STORY-285 — Bornes de montant et méthodes lues des capacités

**Points :** 2

Min, max, barème et méthode sont lus des capacités du couple **fournisseur × pays × devise**,
jamais codés ni mis en configuration. Hors bornes ⇒ `MONTANT_HORS_CAPACITE` **en nommant la borne**.
Un fournisseur qui met à jour ses capacités change les bornes **sans déploiement**.

---

## Ce que le rail C ne peut pas prouver seul

| Question | Portée par |
|---|---|
| Un exploitant suit les demandes et les écarts | convergence (STORY-286, `admin-panel`) |
| L'assistant sait quelles situations relancer | convergence (STORY-287, `assistant-service`) |
| Un encaissement fait partir un reçu | convergence (STORY-644, `notification-service`) |

---

## Ordre de tirage

```
268 ──┐
      ├──► 270 ──► 271 ──► 272
269 ──┘

274 ──► 275 ──► 276
   └──► 273

285  (indépendante, à placer où il reste de la place)
```
