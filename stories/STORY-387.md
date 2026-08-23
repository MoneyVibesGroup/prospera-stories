# STORY-387 : Les montants des refus sortent en unités mineures, et le geste manque là où il coûte le plus

**Epic :** EPIC-021 — Import & migration Sage (reprise à-nouveaux)
**Réf. :** décision PO du 2026-08-23, à la revue de maquette **FE-047** — *« le service doit dire cela, ce n'est pas à l'écran de le faire »*
**Priorité :** Should Have
**Story Points :** 2
**Statut :** not_started
**Complexité :** low
**Sprint :** 20
**Service :** `balance-service` (`:3007`)

---

## Le constat

### ① Un montant de refus est publié dans la représentation de **stockage**

Le contrat canonique porte les montants en **unités mineures XOF** (valeur × 100) — c'est juste, et
ça ne se discute pas *pour les données*. Mais les **messages de refus** les recopient tels quels :

> « Balance déséquilibrée (FR-A25) — équilibre des soldes non satisfait : écart de **2 450 000 000**
> (unités mineures XOF) entre 41 238 000 000 au débit et 41 483 000 000 au crédit. »

Le comptable qui lit cette phrase cherche **24 500 000 F CFA**. Il lit un nombre cent fois trop grand,
suivi d'une parenthèse technique qui lui demande de faire la conversion de tête, au moment précis où
il vient d'être refusé.

⚠️ **Et le service est le seul à pouvoir la faire correctement.** Il connaît la devise du dossier
(`fiscal.devise`) et l'échelle du contrat ; l'écran, lui, devrait ré-appliquer une règle de
présentation à une phrase qu'il n'a pas produite — c'est-à-dire parser du texte pour le réécrire.

### ② Le refus qui coûte le plus cher est le seul à ne pas dire quoi faire

Ce module **sait** nommer le geste. Ses propres exceptions le font, et bien :

| refus | ce qu'il dit de faire |
|---|---|
| `BALANCE_SOURCE_NON_VALIDEE` | « validez la balance de clôture avant de générer les à-nouveaux » |
| `RESULTAT_NON_DETERMINE` | « déterminez le résultat de l'exercice avant de générer les à-nouveaux » |
| `SOCLE_INTROUVABLE` | « générez-le avant d'affecter le résultat » |
| `SOCLE_DEJA_GENERE` | « il ne se régénère pas » |
| **déséquilibre (FR-A25)** | **— rien.** Il énonce un écart et s'arrête. |

Or c'est le seul dont la cause est **ailleurs** : elle est dans la balance de clôture N-1, pas dans le
geste que l'utilisateur vient de faire. Sans le dire, le refus laisse chercher au mauvais endroit —
exactement le motif « refus loin de la cause, cause jamais nommée » que STORY-172 a corrigé ailleurs,
et que `ResultatNonDetermineException` a été écrite pour éviter sur ce même écran.

---

## Ce qu'il faut livrer

1. **Le montant lisible sort du service.** Tout montant cité dans un **message** de refus est rendu
   dans l'unité que l'utilisateur lit (24 500 000 F CFA), la valeur machine restant disponible en
   `details` *(cf. **STORY-386** pour la structure)*. Périmètre : les refus de
   `balance.validator.ts` et de `reprise.exceptions.ts` qui citent un montant — aujourd'hui le
   déséquilibre FR-A25 et `AffectationIncompleteException`.
2. **Le refus d'équilibre nomme son geste**, sur le patron des quatre autres : la correction se fait
   dans la balance de clôture de l'exercice repris.
3. **Aucun changement sur les données.** Les DTO de réponse gardent leurs unités mineures : la story
   porte sur ce que le service **dit**, jamais sur ce qu'il **sert**.

---

## Critères d'acceptation

1. Le message d'un refus FR-A25 cite l'écart dans l'unité lue par l'utilisateur, avec sa devise, sans
   parenthèse technique demandant une conversion.
2. Ce message nomme le geste qui corrige, et il désigne la balance source — pas l'écran courant.
3. `AffectationIncompleteException` suit la même règle sur `resultat` et `total` *(son `details`
   chiffré, lui, ne change pas : c'est ce que le client calcule)*.
4. Les DTO de réponse sont inchangés — vérifié par diff d'OpenAPI.
5. La devise vient du dossier, jamais d'une constante `XOF` codée en dur : `cima-assurances` et les
   futurs référentiels hors zone franc ne doivent pas hériter d'un libellé faux.

---

## Notes

- **Décision PO explicite, pas une préférence d'implémentation** : à la revue de FE-047 le
  2026-08-23, le front proposait d'ajouter lui-même la conversion en francs et la phrase du geste. Le
  PO l'a refusé — *« le service doit dire cela car ce n'est pas à l'écran de le faire »*. FE-047 rend
  donc le message du serveur **tel quel** en attendant cette story.
- Se livre naturellement **avec STORY-386**, qui touche la même exception ; les deux restent
  séparables (386 = le contrat, 387 = ce qu'il dit).
