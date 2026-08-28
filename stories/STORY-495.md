# STORY-495 : Aucune opération en devise étrangère n'est exprimable — un importateur n'a ni écart de conversion, ni gain, ni perte de change

Status: ready-for-dev

**Épic :** EPIC-107 — Devise, unités et arrondis (socle d'internationalisation)
**Service :** `balance-service` + `bilan-service`
**Points :** 8 · **Sprint :** S20 *(décision PO du 2026-08-27)* — ⚠️ **se tire APRÈS STORY-489 et STORY-490**, du même sprint
**Origine :** revue **expert-comptable** de la maquette cumulative, 2026-08-27.

---

## Le fait

Zéro occurrence de « taux de change » dans le produit et dans la maquette. Or le dossier de
démonstration est un **distributeur**, et un distributeur ouest-africain **importe** : il achète en
EUR, en USD ou en CNY, et paie parfois plusieurs mois après la facture.

Le SYSCOHADA révisé traite ce cas explicitement, et il n'est pas optionnel à l'arrêté des comptes :

| Moment | Traitement |
|---|---|
| Comptabilisation initiale | cours du jour de l'opération |
| Clôture — créances et dettes en devises | réévaluation au cours de clôture |
| Différence latente | **écarts de conversion** — actif (perte latente) et passif (gain latent) |
| Perte latente | **provision pour perte de change** |
| Règlement | **perte de change (654) / gain de change (754)**, cette fois réalisé |

**Rien de tout cela n'est exprimable.** Un montant du produit est un entier sans devise, sans cours
et sans date de cours. Le distributeur qui a une dette fournisseur de 50 000 EUR au 31 décembre ne
peut ni la réévaluer, ni constater son écart, ni provisionner sa perte latente.

⚠️ **Et l'omission ne se voit pas.** La balance reste équilibrée, la liasse se calcule, tous les
contrôles passent. Ce qui est faux, c'est le **résultat** — d'un montant qui, sur une dette
fournisseur importante et une monnaie qui a bougé, dépasse largement le seuil de signification.

## Ce que la story fait, et ce qu'elle ne fait pas

**Fait :** rendre l'opération en devise **exprimable et traçable**.
**Ne fait pas :** aller chercher un cours. Le produit ne s'abonne à aucune source de taux ; le cours
est **saisi et justifié** par le comptable, comme il l'est aujourd'hui dans son dossier de travail.
⚡ Un cours automatique sans source opposable serait pire que pas de cours : il aurait l'air juste.

## Critères d'acceptation

- [ ] AC-1 — Une ligne peut porter un **montant en devise d'origine**, son **cours** et la **date du
      cours**, en plus de son montant en devise de tenue. Les trois vont ensemble ou aucun : un
      montant en devise sans cours est refusé (`400`).
- [ ] AC-2 — Le cours porte sa **source** en texte libre obligatoire (« BCEAO 31/12/2025 »,
      « avis de la banque X ») — même exigence de justification que le registre des autres impôts
      et taxes, et pour la même raison : c'est ce qui rend le chiffre opposable.
- [ ] AC-3 — La réévaluation de clôture produit les **écarts de conversion actif et passif**, aux
      comptes SYSCOHADA prévus, et **ne compense jamais** un écart actif par un écart passif.
- [ ] AC-4 — La **provision pour perte de change** est **proposée et jamais appliquée d'office** :
      c'est un jugement, au même titre que l'affectation du résultat. Rien n'est pré-rempli.
- [ ] AC-5 — Pertes et gains de change **réalisés** (règlement) sont distingués des **latents**
      (clôture) partout où ils apparaissent, y compris au compte de résultat. Les confondre est
      l'erreur classique, et elle est invisible à l'équilibre.
- [ ] AC-6 — Un dossier **mono-devise ne change pas d'un octet** : aucune ligne supplémentaire,
      aucun champ obligatoire nouveau. Vérifié par la non-régression du dossier de démonstration.

## Conséquences ailleurs

- Prérequis strict : **STORY-489** (devise au contrat) et **STORY-490** (propagation aval).
- ⚠️ Le rapprochement bancaire (FE-049) et les cahiers touchent des comptes de trésorerie qui
  peuvent être en devises. Le périmètre s'arrête aux **créances et dettes** dans cette story ;
  les comptes de trésorerie en devises sont **nommés et exclus**, pas oubliés.

## Notes

- Voir [[STORY-489]], [[STORY-490]], SYSCOHADA révisé (opérations en monnaies étrangères).
