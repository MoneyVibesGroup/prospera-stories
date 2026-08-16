# Demande de pièces — module Fiscalité Prospera

**Date :** 3 août 2026
**Destinataire :** expert-comptable partenaire
**Objet :** obtenir des exemplaires réels de documents fiscaux pour construire le module de déclaration
**Émetteur :** équipe produit Prospera / MoneyVibes

---

## Pourquoi cette demande

Nous construisons le module qui prépare, contrôle et dépose les déclarations fiscales de vos dossiers
clients, puis en conserve la preuve. Nous savons calculer ; ce que nous ne pouvons pas deviner, c'est la
**forme exacte** de ce que l'administration attend et de ce qu'elle renvoie.

Un taux se lit dans le Code général des impôts. Un formulaire, un accusé de réception ou un motif de
rejet, non : il faut en avoir vu un vrai. Sans ces pièces, nous développerions à l'aveugle et vous
livrerions un module qui produit des fichiers que le portail refuse.

**Un seul exemplaire de chaque suffit.** Nous n'avons pas besoin de volume, nous avons besoin d'exactitude.

## Comment nous les transmettre

- **Format préféré :** le fichier d'origine (Excel, PDF, XML) plutôt qu'une photo ou une capture d'écran.
  Un tableur nous en apprend dix fois plus qu'une image du même tableau.
- **Captures d'écran :** acceptées et même utiles pour les parcours de portail — dans ce cas, une capture
  par étape, dans l'ordre.
- **Confidentialité :** ces documents contiennent des données de vos clients. **Masquez ce qui doit
  l'être** — raison sociale, numéro d'identification fiscale, adresse — ou remplacez-les par des valeurs
  fictives. En revanche, **conservez les montants et la structure** : ce sont eux qui nous intéressent.
  Si un document ne peut pas être transmis même masqué, dites-le-nous, nous chercherons un équivalent
  public.

---

## Priorité 1 — bloquantes

Sans ces cinq pièces, nous ne pouvons pas développer la partie « dépôt » du module.

### 1. Un gabarit de dépôt des états financiers (GUDEF)

**Ce que nous demandons :** le fichier modèle que le guichet attend, vierge ou rempli, et si possible les
deux. Idéalement pour le **Système Normal** et pour le **Système Minimal de Trésorerie**.

**À quoi ça sert :** c'est le format de sortie exact du système. Nous devons produire un fichier que le
guichet accepte du premier coup, pas un fichier « proche ».

**Ce que ça nous évite :** redévelopper le générateur après le premier rejet.

### 2. Un accusé de réception électronique

**Ce que nous demandons :** l'accusé rendu par le guichet ou par le portail après un dépôt réussi —
n'importe quelle déclaration, n'importe quelle année.

**À quoi ça sert :** c'est la pièce maîtresse de la preuve. Nous devons savoir ce qu'elle contient
(référence, date, horodatage, signature ?) pour l'archiver correctement et la restituer en cas de
contrôle.

**Question associée :** l'accusé est-il toujours un **fichier téléchargeable**, ou parfois seulement un
**numéro affiché à l'écran** ? Les deux cas nous intéressent, et ils ne se traitent pas pareil.

### 3. Un bordereau de déclaration périodique rempli

**Ce que nous demandons :** une déclaration de TVA remplie, et si possible une déclaration d'acompte.

**À quoi ça sert :** connaître les rubriques exactes, leur ordre, ce qui est calculé automatiquement par
le portail et ce qui doit être saisi. C'est ce qui nous permettra de vous présenter, ligne à ligne, les
valeurs à reporter — sans que vous ayez à retaper un seul montant.

### 4. **Une déclaration rejetée, avec son motif**

**Ce que nous demandons :** un rejet, un avis de non-conformité, une demande de correction — quelle
qu'en soit la cause.

**À quoi ça sert :** c'est la pièce la plus précieuse de toute cette liste, et c'est celle qu'on nous
donne le moins souvent. Elle nous apprend ce que l'administration vérifie réellement, donc **ce que nous
devons contrôler avant vous**. Une seule suffit à orienter tous nos contrôles de cohérence.

Si vous n'en avez pas conservé, un souvenir précis suffit : quelle déclaration, quel motif, comment vous
l'avez su.

### 5. Les étapes du dépôt, en images

**Ce que nous demandons :** une capture d'écran par étape du parcours de dépôt, de la connexion jusqu'à
l'accusé — sur le guichet des états financiers et sur le portail de télédéclaration.

**À quoi ça sert :** notre module doit vous guider écran par écran. Nous ne pouvons pas décrire un
parcours que nous n'avons jamais vu.

---

## Priorité 2 — très utiles

### 6. Un bordereau de paiement et une preuve de règlement

Quittance, avis de paiement, reçu de télépaiement. Nous devons rapprocher un règlement d'une déclaration :
quelles références font le lien ? Le paiement par mobile money laisse-t-il une trace exploitable ?

### 7. Le guide utilisateur officiel du portail

S'il en existe une version plus récente que celle publiée en ligne, ou une note interne de votre cabinet.

### 8. Un export de votre outil de paie

**Ce que nous demandons :** le fichier que produit l'outil avec lequel vous établissez les salaires — une
période, quelques salariés, montants réels ou fictifs mais structure d'origine.

**À quoi ça sert :** le module calcule les cotisations sociales et les retenues sur salaires. Nous
voulons **importer** ces données depuis votre outil plutôt que vous les faire ressaisir chaque mois. Pour
cela il nous faut voir le format de sortie réel.

**Question associée :** quel outil utilisez-vous, et vos confrères ?

### 9. Le barème des cotisations sociales en vigueur — ⛔ **PASSÉE BLOQUANTE le 2026-08-16**

Taux employeur et salarié, assiette, plafond éventuel, salaire minimum de référence, avec la date
d'entrée en vigueur. Nous avons des valeurs, nous voulons les confirmer et les dater.

> ### ⛔ Une pièce précise nous manque **complètement** : la valeur du SMIG
>
> Cette demande était classée « utile ». **Elle est bloquante**, et nous ne l'avions pas vu.
>
> Notre référentiel porte bien les **taux** (17,5 % employeur / 4 % salarié) et la **règle** du
> plancher : *« l'assiette ne peut être inférieure au SMIG en vigueur »*. Mais **la valeur du SMIG n'y
> figure nulle part** — le référentiel le déclare lui-même : *« valeur SMIG à jour »* reste dans sa
> liste de champs à compléter.
>
> ⚡ **Conséquence concrète :** tant que cette valeur manque, toute rémunération proche du minimum sort
> en **obligation bloquée**, avec le motif « valeur du SMIG absente ». C'est volontaire — nous refusons
> d'appliquer un plancher que nous ne pouvons pas sourcer. ⛔ **Nous n'irons pas chercher un chiffre en
> ligne** : un SMIG périmé produirait une assiette **fausse et vraisemblable** sur exactement la
> population la plus exposée.
>
> **Ce dont nous avons besoin, très précisément :**
>
> | Élément | Pourquoi |
> | --- | --- |
> | **La valeur du SMIG** et **le texte qui la fixe** (décret, date) | c'est le plancher d'assiette |
> | Le **plafond** de cotisation — **ou la confirmation qu'il n'y en a pas** | notre source dit « éventuel », ce qui ne tranche rien |
> | La **ventilation par branche** (prestations familiales / risques professionnels / pensions) | le 17,5 % est un total ; les déclarations les demandent parfois séparés |
>
> **Question associée :** ces trois éléments changent-ils par décret, et à quelle fréquence ? Nous
> voulons savoir **à quel rythme cette donnée périme**, pour prévoir qui la surveille.
>
> ⚡ Le jour où vous nous les donnez, **le déblocage ne demande aucune livraison de logiciel** — nous
> mettons la donnée dans le référentiel et le calcul repart. C'est exactement pour ça que nous
> refusons de la coder en dur.

### 9 bis. Le barème des durées d'amortissement *(ajouté le 2026-08-16)*

Les **durées admises par nature de bien** — bâtiments, matériel, mobilier, véhicules, informatique,
agencements — avec le **texte qui les fixe**.

> ⚡ **Même visite, deuxième donnée.** Nous avons la même situation que pour le SMIG : notre référentiel
> porte le **régime** — *« linéaire, dégressif ou accéléré (Art. 100) »*, et *« petit outillage de valeur
> unitaire HT ≤ 100 000 FCFA déductible immédiatement »* — mais **aucune durée**. Le système sait
> **quels modes existent** et **pas combien d'années**.
>
> **À quoi ça sert :** la ligne **`11` — amortissements excédentaires** du tableau de détermination du
> résultat fiscal. Aujourd'hui vous la **saisissez à la main**, avec sa justification, et c'est très
> bien : nous ne prévoyons **pas** de la calculer à votre place. Nous voulons pouvoir **la recontrôler**
> et vous signaler un écart avant l'administration.
>
> **Question associée :** appliquez-vous des durées d'usage différentes des durées fiscales, et si oui,
> sur quelles natures de biens ? C'est exactement l'écart qui alimente cette ligne.

---

## Priorité 3 — par type d'entité

Le module doit servir les cabinets, mais aussi les institutions de microfinance, les compagnies
d'assurance et les distributeurs. Chaque type d'entité a ses propres obligations, ses propres états et
ses propres échéances.

### 10. Microfinance (SFD)

- Un état ou une déclaration propre au secteur, tel que déposé.
- Le traitement de la **taxe sur les activités financières** : assiette retenue, exonérations appliquées.
- Confirmation de la date de dépôt annuel.

### 11. Assurance

- Une déclaration de **taxe sur les contrats d'assurance**, montrant la ventilation par branche et les
  taux appliqués.
- Un état réglementaire déposé, si le dépôt suit un circuit différent.

### 12. Régime dérogatoire (zone franche)

- Le document qui atteste du statut.
- Une déclaration établie sous ce régime, montrant concrètement les exonérations et les taux réduits.

### 13. Distributeur

- Toute spécificité de déclaration liée aux commissions, remises ou rétrocessions.

---

## Priorité 4 — un dossier hors Togo

**Ce que nous demandons :** un jeu équivalent aux points 1 à 5, pour **un seul autre pays** — Bénin,
Côte d'Ivoire ou Sénégal, celui pour lequel vous avez le plus de matière.

**À quoi ça sert :** notre architecture prétend qu'ajouter un pays ne coûte que de la donnée. Tant que
nous n'avons vu qu'un seul pays, ce n'est qu'une affirmation. Un deuxième jeu la prouve ou la casse — et
il vaut mieux le savoir maintenant.

---

## Récapitulatif

| # | Pièce | Priorité | Reçue |
| --- | --- | --- | --- |
| 1 | Gabarit de dépôt des états financiers (SN et SMT) | Bloquante | ☐ |
| 2 | Accusé de réception électronique | Bloquante | ☐ |
| 3 | Bordereau de déclaration périodique rempli (TVA, acompte) | Bloquante | ☐ |
| 4 | **Déclaration rejetée avec son motif** | Bloquante | ☐ |
| 5 | Captures du parcours de dépôt, étape par étape | Bloquante | ☐ |
| 6 | Bordereau de paiement et preuve de règlement | Utile | ☐ |
| 7 | Guide utilisateur du portail | Utile | ☐ |
| 8 | Export de l'outil de paie | Utile | ☐ |
| 9 | **Barème social daté — dont ⛔ la VALEUR DU SMIG, le plafond et la ventilation par branche** | **Bloquante** *(promue le 2026-08-16)* | ☐ |
| 9 bis | **Barème des durées d'amortissement par nature de bien** *(ajouté le 2026-08-16 — à demander avec le n°9)* | Utile | ☐ |
| 10 | Pièces microfinance | Par type | ☐ |
| 11 | Pièces assurance | Par type | ☐ |
| 12 | Pièces régime dérogatoire | Par type | ☐ |
| 13 | Spécificités distributeur | Par type | ☐ |
| 14 | Jeu équivalent pour un second pays | Bonus, à forte valeur | ☐ |

---

## Trois questions, si vous avez cinq minutes

Les réponses valent presque autant que les documents.

1. **Qui dépose, en pratique ?** Le cabinet avec ses propres accès, avec ceux du client, ou le client
   lui-même après que vous lui avez envoyé le fichier ?
2. **Qu'est-ce qui vous fait perdre le plus de temps** dans un mois de déclarations : le calcul, la
   collecte des pièces, la saisie sur le portail, ou la relance des clients ?
3. **Qu'est-ce qui vous a déjà valu une majoration ?** Un retard, une erreur de période, une pièce
   manquante en contrôle ? Un cas concret nous aiderait plus que dix règles générales.

---

*Merci. Chaque pièce reçue supprime une hypothèse dans notre conception — et une hypothèse en moins,
c'est une correction en moins après la mise en service.*
