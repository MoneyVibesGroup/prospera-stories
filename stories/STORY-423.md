# STORY-423 : La balance à 4 colonnes replie les à-nouveaux dans le solde — l'égalité « solde = à-nouveau + mouvements » devient invérifiable

Status: ready-for-dev

**Épic :** EPIC-020 — Cahiers & rattachement (Atelier Balance)
**Service :** `balance-service` (`:3007`) — `modules/cahiers/agregation`, `modules/balance`
**Points :** 3 · **Sprint :** S20
**Origine :** relevée le **2026-08-26** à la **seconde passe** « expert-comptable venant de Sage » sur la maquette **FE-046** — relecture de l'écran **fini**, après celle menée pendant sa construction (qui avait produit STORY-418 à 422).

---

## Le fait, relevé à la source

La ligne de balance publie **quatre** colonnes de montants :

```ts
// dto/agregation.dto.ts — LigneBalanceApercuDto
mouvementDebit!: number;
mouvementCredit!: number;
soldeDebiteur!: number;   // « = à-nouveau + mouvements, net »
soldeCrediteur!: number;  // idem
```

Et le contrat le dit lui-même, mot pour mot :

> *« Solde débiteur = **à-nouveau + mouvements**, net (unités mineures XOF). **Égal au net des
> mouvements lorsqu'aucun socle d'à-nouveaux (STORY-087) n'est chaîné à l'exercice.** »*

⇒ Dès qu'un **socle d'à-nouveaux est chaîné**, le solde contient une composante que **rien ne
publie**. Le client reçoit `mouvements` et `solde` ; il ne peut pas en déduire l'à-nouveau, parce
que `solde − mouvements` n'est calculable que si l'on sait de quel côté (débit ou crédit)
l'à-nouveau tombait — et la compensation nette a déjà eu lieu.

---

## Ce que ça coûte, concrètement

**Une balance SYSCOHADA se lit en six colonnes**, et c'est ce que sort n'importe quel logiciel du
marché :

| | À-nouveaux D | À-nouveaux C | Mouvements D | Mouvements C | Solde D | Solde C |
|---|---|---|---|---|---|---|

C'est la forme que l'expert-comptable **contrôle** : il vérifie ligne à ligne que
`solde = à-nouveau + mouvements`, et c'est ce contrôle qui attrape une reprise d'à-nouveaux
fausse ou incomplète. Avec quatre colonnes, **le contrôle est impossible** : il faut croire le
serveur sur parole, sur le seul poste que personne ne veut croire sur parole — celui qui vient de
l'exercice précédent.

⚠️ **Le défaut est invisible sur le cas nominal**, ce qui explique qu'il ait traversé la première
revue : sans socle chaîné, `solde = mouvements` et tout se recoupe. Il n'apparaît **que sur les
dossiers en deuxième année** — c'est-à-dire, à terme, sur tous.

⛔ **Et il touche les trois adaptateurs, pas seulement les cahiers** : `LigneBalanceApercuDto` est
la forme canonique (STORY-147). Un import Sage qui portait bien ses six colonnes en entrée les
**perd** en sortie.

---

## Ce qui est demandé

1. Publier les deux colonnes manquantes sur la ligne de balance :

   ```ts
   @ApiProperty({ description:
     'À-nouveau débiteur repris du socle d’ouverture (STORY-087). 0 si aucun socle n’est chaîné.' })
   aNouveauDebit!: number;
   @ApiProperty({ description: 'À-nouveau créditeur. Exclusif de `aNouveauDebit`.' })
   aNouveauCredit!: number;
   ```

2. **L'invariant devient contrôlable, donc testable** :
   `soldeDebiteur − soldeCrediteur === (aNouveauDebit − aNouveauCredit) + (mouvementDebit − mouvementCredit)`
   — un test doit **rougir** si la compensation nette est appliquée avant la publication.

3. **Sur une balance sans socle, les deux champs valent `0`** — et c'est le seul endroit de ce
   contrat où `0` est juste : il n'y a pas d'à-nouveau, ce n'est pas une valeur non calculée.
   ⚠️ Ne **pas** les omettre : leur absence se lirait « on ne sait pas », alors qu'on sait.

4. ⚠️ **Vérifier le chemin de la reprise (STORY-087)** : le socle est lui-même une balance. Ses
   propres à-nouveaux valent `0` — c'est le point de départ de la chaîne, pas une lacune.

---

## Critères d'acceptation

1. `POST …/balance/depuis-cahiers` (aperçu **et** persistance) publie `aNouveauDebit` /
   `aNouveauCredit` sur chaque ligne.
2. Sur un exercice **avec** socle chaîné, l'invariant du §2 est vérifié ligne à ligne par un test.
3. Sur un exercice **sans** socle, les deux champs valent `0` et les soldes sont inchangés —
   testé, pour prouver l'absence de régression.
4. Les balances des **trois** adaptateurs (cahiers, Sage, saisie directe) portent les mêmes
   colonnes : c'est le contrat canonique, pas un extra du chemin A.
5. OpenAPI régénéré ; types du front régénérés.

---

## Notes

- ⚠️ **Ce que cette story ne demande pas** : changer l'affichage. Le front décidera s'il montre
  six colonnes en permanence ou seulement quand un socle existe — c'est une question d'écran, et
  elle ne se pose que parce que la donnée existe.
- ⚡ **Ce que cette story enseigne sur la méthode** : elle n'a été vue qu'à la **seconde** lecture
  de la maquette, celle faite sur l'écran **fini** plutôt que pendant sa construction. En
  construisant, on regarde si chaque élément est juste ; en relisant, on regarde **ce qui manque à
  l'ensemble**. Les deux passes n'attrapent pas les mêmes défauts.
- Voir [[FE-046]], `stories/STORY-087.md` (le socle d'à-nouveaux), `stories/STORY-147.md`
  (la ligne à 4 colonnes), `stories/STORY-101.md` (le contrat canonique).
