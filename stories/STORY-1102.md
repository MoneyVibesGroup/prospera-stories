# STORY-1102 : Le premier dépôt réel — une liasse acceptée sur GUDEF et un mois déclaré sur dimana, pour un cabinet pilote, avant toute vente

Status: ready-for-dev — **créée le 2026-11-19** depuis la salle des cabinets (points V1, V2 et V3 de
`salle-cabinets-validations-2026-11-19.md`). Non slottée : à placer au prochain plan, **avant** la première démarche
commerciale auprès des cabinets.

**Service :** aucun code neuf — une recette de terrain sur la pile livrée (`prospera-recette` pour la partie
reproductible) · **Points :** 3
**Dépend de :** STORY-537 (fichier e-DSF Togo), STORY-538 (transmis, accusé, rejet), STORY-332 (guidage), STORY-333
(capture de l'accusé), FE-081 (écran du dépôt)

---

## Pourquoi

Me Akossiwa, associée d'un cabinet de 180 dossiers, en séance du 19/11 : « Je ne vendrai rien à mes confrères avant
d'avoir vu UN dépôt réel sur GUDEF, accepté, avec son accusé. Un seul fichier rejeté pendant la saison, et tout le
marché de Lomé le sait le lendemain. »

Tout ce qui précède le portail est testé chez nous. Le portail, non : GUDEF et dimana n'ont pas d'API, et le jalon
« format confirmé » de STORY-537 prouve le format sur une pièce réelle, pas l'acceptation par l'administration. Cette
story est la preuve qui manque, et elle se fait avec un vrai cabinet sur un vrai dossier.

## Ce qui est attendu

1. Un cabinet pilote (le contact du 18/11 ou un autre que le PO désigne) choisit **un dossier réel** dont la
   balance sort de Sage 100.
2. La balance est déposée telle qu'elle sort, sans retouche. Le produit rend les 92 feuilles et les 44 notes annexes.
3. Le cabinet dépose le fichier sur GUDEF en suivant le guidage du produit. Le chronomètre tourne de la balance déposée
   à l'accusé obtenu.
4. Pour le même client, un mois de déclarations (TVA, retenues sur salaires) est déposé sur dimana à partir des valeurs
   copiables du produit.
5. Les accusés sont capturés dans le produit et archivés contre leur obligation.

## Critères d'acceptation

- **AC-1** : la liasse est **acceptée** par GUDEF du premier coup ; l'accusé est archivé (STORY-333, STORY-335) et
  retrouvé depuis le dossier en moins de trois gestes.
- **AC-2** : aucune valeur des 92 feuilles n'a été ressaisie à la main. Toute retouche est consignée avec sa cause et
  devient un ticket.
- **AC-3** : la déclaration du mois est acceptée par dimana ; chaque montant reporté a été copié depuis le produit,
  aucun n'a été recalculé à côté.
- **AC-4** : le temps total et le temps sur le portail sont mesurés et comparés à la façon de faire habituelle du
  cabinet sur un dossier de même taille. Les deux chiffres entrent dans `salle-cabinets-validations-2026-11-19.md`.
- **AC-5** : si un rejet survient, il est enregistré (STORY-334), sa cause est nommée (feuille, cellule, règle), la
  correction est faite **dans le produit** et le second dépôt est accepté. La story n'est `done` qu'après un dépôt
  accepté.
- **AC-6** : le cabinet pilote donne son accord écrit pour que le résultat soit cité, sans nom de client, dans la
  présentation de la solution cabinet.

## Hors périmètre

- Le dépôt automatique (STORY-560, STORY-561) : ici, c'est le cabinet qui dépose, guidé.
- Un second pays.
