# STORY-568 : Avant de demander quoi que ce soit, dire à la personne SI elle doit déclarer — l'article 21 du LPF dispense la plupart des salariés

Status: ready-for-dev

**Épic :** EPIC-030 — Calendrier et responsabilité
**Service :** `fiscal-service` (`:3012`) · **paquet :** `paquet-fiscal-togo-2026`
**Points :** 8 · **Sprint :** S30
**Origine :** **décision PO du 2026-08-28** — *« pour un salarié, par rapport à ses impôts, le
système doit le lui donner et lui expliquer, mais pour cela le salarié doit lui donner les
informations nécessaires »* + demande explicite d'un **avis de fiscaliste**.
**Prérequis :** **STORY-563** (le `Redevable`) · **STORY-567** (les trois portes)
**Réf. :** **LPF Art. 20, 21, 38** · **CGI Art. 1, 17** — tous présents dans
`referentiels/corpus-complet-cgi-lpf-togo.json` (1 185 articles)

---

## ⚡ Le fait juridique qui commande tout le parcours

Relevé **dans le corpus du dépôt**, pas de mémoire :

> **LPF Art. 20** — *« Tout contribuable assujetti à l'Impôt sur le Revenu des Personnes Physiques
> est tenu de souscrire, **au plus tard le 31 mars** de chaque année une déclaration détaillée des
> revenus dont il a disposé au cours de l'année fiscale écoulée. »*

> **LPF Art. 21** — *« Les contribuables **ne jouissant que** des traitements, salaires, pensions,
> rentes viagères et/ou des revenus des capitaux mobiliers **sont dispensés de l'obligation
> déclarative** prévue ci-dessus, **dès lors que l'impôt a été retenu à la source**. »*

> **LPF Art. 38** — *« Cette obligation est étendue aux personnes qui, **quel que soit le montant
> de leurs revenus**, disposent de certains éléments de train de vie énumérés à l'article 239. »*

⇒ **La majorité des salariés togolais n'ont rien à déclarer.** Un produit qui leur demanderait
d'abord de saisir leurs bulletins de paie leur ferait faire un travail que la loi ne leur impose
pas — et se tromperait sur sa propre proposition de valeur.

## ⚠️ Et le dirigeant n'est pas l'exception qu'on croit — il faut le vérifier, pas le supposer

**CGI Art. 17** met les rémunérations de gérants **dans la même catégorie** que les salaires :

> *« Sont imposables au titre de cette catégorie les traitements, émoluments, salaires […] ainsi
> que **les rémunérations des gérants** des sociétés en nom collectif, des sociétés en commandite
> simple, des **sociétés à responsabilité limitée** et de sociétés civiles ainsi que les
> rémunérations de l'associé unique de la société anonyme s'ils sont admis en déduction des
> bénéfices soumis à l'impôt sur les sociétés. »*

Et **CGI Art. 1** le confirme : *« les traitements, salaires, indemnités, émoluments **et
rémunérations des gérants** sont constitutifs des **revenus d'emplois** »*.

⛔ **Mais l'Art. 21 du LPF énumère « traitements, salaires, pensions, rentes viagères » — il ne
nomme pas les rémunérations de gérants.** Deux lectures s'affrontent :

- **lecture large** — le gérant est dans la catégorie « revenus d'emplois », donc dispensé si
  retenue à la source ;
- **lecture stricte** — l'Art. 21 est une exception, les exceptions sont d'interprétation stricte,
  et l'énumération ne le mentionne pas ⇒ il déclare.

⇒ ⛔ **Cette story ne tranche pas cette question : elle la POSE au paquet comme un point à faire
valider par un fiscaliste togolais**, et le produit se comporte de la façon prudente tant qu'elle
n'est pas tranchée — il **dit qu'il ne sait pas**, il ne dispense pas.

⚡ **Ce qui fait sortir du bénéfice de l'Art. 21, en revanche, est certain et fréquent** : un
**revenu foncier** (un dirigeant qui loue un immeuble), un **BIC/BNC** accessoire, une **retenue
non opérée**, ou les **éléments de train de vie** de l'Art. 38.

## ⇒ Ce que le produit doit faire, dans cet ordre

1. **Qualifier** — quelles catégories de revenus la personne a-t-elle eues ? Cinq à sept questions
   fermées, tirées de la liste de l'**Art. 1 du CGI**, plus la question de la retenue.
2. **Rendre un verdict motivé** — « vous êtes dispensé, au titre de l'article 21 du LPF, parce
   que… » ou « vous devez déclarer avant le 31 mars, parce que… ».
3. **Ne demander des informations que dans le second cas**, et seulement celles que les catégories
   déclarées rendent nécessaires.

⚡ **C'est l'inversion qui fait la valeur** : la plupart des utilisateurs obtiennent une réponse
utile **sans rien saisir**, et ceux qui doivent déclarer ne saisissent que ce qui les concerne.

## Périmètre

**Inclus**

- Le **questionnaire de qualification**, décrit **comme donnée du paquet pays** : les catégories,
  leurs questions, et la règle qui en dérive le verdict. ⛔ Aucune question, aucune catégorie,
  aucun article en dur (NFR-F04).
- Le **verdict motivé**, citant l'article et le millésime : dispensé, redevable, ou **indéterminé**.
- ⛔ **`INDETERMINE` est une issue de plein droit**, et c'est celle du gérant tant que la lecture
  de l'Art. 21 n'est pas tranchée. Le produit dit *« votre situation demande l'avis de votre
  conseil, voici pourquoi »* — il ne dispense jamais par défaut. **Dispenser à tort expose la
  personne à une sanction ; sur-déclarer ne lui coûte que du temps.**
- La **collecte ciblée** : pour un redevable qui doit déclarer, la liste des pièces et montants
  attendus, catégorie par catégorie.
- **Le dirigeant est pré-rempli** : sa rémunération et les retenues opérées viennent du dossier de
  sa société (STORY-563/567). Il **confirme**, il ne saisit pas.
- L'**échéance du 31 mars** entre au calendrier du redevable (EPIC-030), avec sa base légale.

**Hors périmètre**

- Le calcul lui-même : **STORY-564** (le barème). L'explication : **STORY-566**.
- L'import automatique de bulletins de paie. ⚠️ C'est là que ces produits meurent — la saisie
  manuelle décourage — mais c'est un chantier OCR à part, et `document-service` existe déjà.
  **À ficher si le parcours salarié est ouvert au public.**
- Les revenus autres que d'emplois, en v1. Le questionnaire les **détecte** (c'est son objet) et
  l'obligation devient **bloquée** au sens de `FR-F80`, avec le motif exact.

## Critères d'acceptation

1. Une personne n'ayant que des revenus d'emplois avec retenue obtient **« dispensé »** avec la
   citation de l'Art. 21 — **sans avoir saisi le moindre montant**.
2. La présence d'un revenu foncier, d'un BIC/BNC ou d'une retenue non opérée bascule le verdict en
   **« vous devez déclarer »**, avec le motif et l'échéance du 31 mars.
3. Le cas du **gérant** rend `INDETERMINE` tant que le paquet ne porte pas d'arbitrage, avec les
   deux lectures exposées. ⛔ Jamais « dispensé » par défaut.
4. Le questionnaire, les catégories et les règles sont **entièrement en donnée** : les modifier ne
   demande aucun déploiement. Témoin exécutable.
5. Chaque verdict cite **son article et le millésime** du paquet.
6. Une personne qui doit déclarer ne se voit demander **que** les informations des catégories
   qu'elle a déclarées.
7. Un dirigeant rattaché voit sa rémunération et ses retenues **pré-remplies et sourcées** — la
   ligne de rémunération d'origine est traçable.
8. L'échéance du 31 mars apparaît au calendrier du redevable, jamais mélangée à celles de
   l'entreprise (STORY-563).

## Notes

- ⚡⚡ **Ce que je recommanderais en tant que fiscaliste, et c'est l'objet même de cette story** :
  le produit qui « déclare les impôts du salarié » se trompe de promesse pour le Togo. La valeur
  n'est pas de remplir une déclaration — **c'est de dire, en une minute et avec la base légale, si
  elle est due.** Pour la majorité, la réponse est non ; pour la minorité, elle vaut cher, parce
  que c'est celle qui découvre un revenu foncier oublié avant que l'administration ne le fasse.
- ⚠️ **Le 31 mars est une date, pas un principe** : elle vient du paquet, comme le reste. Un
  report administratif se saisit sans altérer l'échéance légale (`FR-F20`, `[H1]`).
- ⛔ **Faire valider l'arbitrage Art. 21 / gérant par un fiscaliste togolais avant de le figer.**
  C'est la seule question de cette story dont la réponse change le comportement pour **tous** les
  dirigeants du produit.
