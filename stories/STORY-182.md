# STORY-182 : Deux opérateurs peuvent trancher **le même dossier** sans que rien ne le dise

**Epic :** EPIC-003 — KYC (`kyc-service`)
**Réf. :** ticket §D · **AP-03** · **STORY-013** *(revue admin)* · **STORY-128** *(verdict par pièce)*
**Découverte par :** AP-INT-1 — écart nº5 d'AP-INT-0, relevé alors et **jamais formulé**
**Priorité :** Should Have — ⚠️ **arbitrage à rendre avant de coder** *(voir §Décision attendue)*
**Story Points :** 3
**Statut :** À faire
**Créée le :** 2026-08-04
**Sprint :** 20
**Service :** `kyc-service` (`:3002`)

---

## Le constat

`POST /admin/kyc/:orgId/approve|reject` n'admet **aucune concurrence optimiste** : ni version, ni
`If-Match`, ni horodatage attendu. Le dernier appel gagne, **en silence**.

**Conséquence :** une revue est un travail **long, interrompu, repris** — c'est même la raison pour
laquelle la console en a fait une route partageable plutôt qu'une modale. Deux opérateurs qui
ouvrent le même dossier produisent deux décisions ; la seconde écrase la première, et **le premier ne
saura jamais que sa décision a été annulée**.

Sur un acte qui décide de l'entrée d'un client dans le système, c'est une perte d'information
silencieuse — et **impossible à reconstituer après coup** tant qu'il n'y a pas d'historique
*(cf. `STORY-183`)*.

> ⚡ **Le front porte déjà l'écran de conflit, entièrement écrit** — `KycConflictError` et son rendu
> *(« un autre opérateur a tranché ce dossier pendant que vous le revoyiez, voici qui et quand »)*.
> Il est **inatteignable** : rien en amont ne produit jamais ce signal. Sa seule présence dans le
> code laisse croire que le cas est traité.

## Ce qui rend la question réelle et pas théorique

La file est **partagée** et **triée par ancienneté** : tous les opérateurs voient la même tête de
file, et sont donc incités à ouvrir **le même dossier**. Ce n'est pas une collision improbable, c'est
le comportement que la file encourage.

---

## Décision attendue AVANT de coder

| Issue | Conséquence |
|---|---|
| **① Porter la concurrence optimiste** *(par défaut)* | Le service refuse une décision fondée sur un état périmé *(`409`)* et nomme la décision gagnante. ⚡ **Le front est déjà prêt à la rendre** — cette story livre le signal |
| ② **Acter que le dernier gagne** | Alors il faut **supprimer l'écran de conflit du front** et le dire dans `AP-03`. Un écran qui traite un cas que le système ne produit jamais est un mensonge par omission |

⚠️ **Ce qui ne se défend pas, c'est de garder l'écran sans l'amont** — c'est l'état actuel, et il
donne à la relecture l'impression rassurante d'un problème résolu.

---

## Périmètre *(issue ①)*

- Une **précondition** sur la décision globale : l'appelant transmet l'état sur lequel il a fondé son
  jugement *(`updatedAt` du dossier, ou un `version`/ETag — à trancher au lancement)*.
- `409` quand l'état a bougé, avec de quoi **nommer** la décision gagnante : verdict, auteur, date.
  ⚠️ Un `409` nu obligerait l'opérateur à recharger pour comprendre ce qu'il a perdu.
- ⚠️ **La marque par pièce reste hors concurrence** : deux opérateurs qui marquent deux pièces
  *différentes* ne sont pas en conflit, et les mettre en concurrence transformerait un travail
  parallèle légitime en collision.

### Hors périmètre

Le verrou exclusif *(« ce dossier est en cours de revue par X »)*. C'est une autre réponse au même
risque, plus coûteuse et plus intrusive — à ouvrir séparément si l'optimiste ne suffit pas.

---

## Critères d'acceptation

1. Deux décisions concurrentes sur le même dossier : la première passe, la seconde reçoit `409`.
2. Le corps du `409` nomme le verdict rendu, son auteur et sa date.
3. Une décision fondée sur l'état courant passe toujours — **aucune régression** sur le cas nominal,
   qui reste de très loin le plus fréquent.
4. La précondition est **obligatoire** : une décision sans elle est refusée. ⚠️ La rendre optionnelle
   la viderait de son sens — tout appelant qui l'omet retrouverait le défaut d'aujourd'hui.
5. Les marques **par pièce** ne sont pas soumises à la précondition.
6. ⚡ **Preuve navigateur depuis `:3110`** : deux sessions, deux onglets, même dossier — le second
   voit l'écran de conflit **au lieu d'écraser** la décision du premier.

---

## Definition of Done

- [ ] Arbitrage tranché et **consigné** dans `AP-03` et dans le ticket
- [ ] Les 6 critères vérifiés *(issue ①)* · `lint` 0 · couverture ≥ 90 %
- [ ] ⚡ Issue ② retenue ⇒ l'écran de conflit et `KycConflictError` sont **retirés** de la console,
      et `AP-03` dit que le dernier gagne
- [ ] Branche `MNV-182`, PR rebase-mergée sur `dev`
