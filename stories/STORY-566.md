# STORY-566 : Expliquer l'impôt du dirigeant salarié, et lui proposer des options chiffrées — le patron de STORY-096/097, appliqué à une personne physique

Status: ready-for-dev

**Épic :** EPIC-024 — Simulation & conseil fiscal
**Service :** `fiscal-service` (`:3012`)
**Points :** 8 · **Sprint :** S30
**Origine :** **décision PO du 2026-08-28** — *« en lui expliquant, voire optimiser aussi, pour une
personne physique salarié dirigeant, pour un début »*.
**Prérequis :** **STORY-563** (le redevable) · **STORY-564** (le barème IRPP)
**Réf. :** **STORY-096** (scénarios d'optimisation légale — leviers → impact IS) · **STORY-097**
(comparatif « déposé vs optimisé » + dossier de justification + **garde-fous de conformité**)

---

## Deux demandes, et la première compte plus que la seconde

Le PO demande **d'expliquer**, puis *« voire optimiser »*. L'ordre n'est pas anodin.

⚡ **Un dirigeant qui comprend son IRPP n'a plus besoin qu'on l'optimise pour lui faire confiance.**
Aujourd'hui il reçoit un montant à payer et n'a aucun moyen de savoir d'où il sort — c'est
exactement le défaut que le produit corrige partout ailleurs : *un chiffre dont on ne peut pas
remonter la composition n'est pas auditable*.

⇒ **L'explication est le livrable ; l'optimisation est le supplément.**

## Le patron existe déjà, et il faut le suivre

**STORY-096/097** ont posé l'optimisation pour l'**IS de l'entreprise** : leviers → impact,
comparatif « déposé vs optimisé », dossier de justification, **garde-fous de conformité**. Cette
story applique le même patron à une **personne physique**, avec une différence qui change tout :

⛔ **Le sujet n'est pas le client du cabinet, c'est une personne.** Un conseil chiffré donné à une
personne physique sur son revenu engage plus qu'une simulation d'IS : c'est de la **matière
personnelle**, et le produit ne doit jamais la présenter comme une décision prise.

## Périmètre

**Inclus — l'explication**

- **La décomposition complète du calcul**, du revenu brut au montant dû : rémunération déclarée,
  abattements appliqués, tranche par tranche avec son taux et sa part d'impôt, retenues déjà
  opérées par l'entreprise, solde.
- **Chaque étape cite son article** du CGI et le millésime du paquet (STORY-564). Le dirigeant, ou
  son conseil, peut refaire le calcul sans le produit.
- **Le lien avec l'entreprise est montré** : la rémunération qui alimente l'IRPP vient des lignes
  de rémunération du dossier, et les retenues à la source imputées sont celles que l'entreprise a
  versées. ⚡ C'est **le seul endroit du produit où les deux volets se rejoignent visiblement**, et
  c'est ce qui rend la double déclaration compréhensible.

**Inclus — les options**

- Des **leviers déclarés au paquet**, jamais en dur : chacun avec son article, sa condition
  d'éligibilité, et son effet chiffré sur le montant dû.
- Un **comparatif « situation actuelle vs option »**, patron STORY-097, avec le **dossier de
  justification** que le cabinet pourra produire.
- ⛔ **Toute option porte sa condition et sa contrepartie.** Un levier présenté par son seul gain
  est une publicité, pas un conseil.

**Hors périmètre**

- **Appliquer une option.** Le produit calcule et présente ; **le cabinet conseille et le dirigeant
  décide.** ⛔ Aucun bouton n'applique un levier à une déclaration.
- Les revenus autres que traitements et salaires. *« Pour un début »* : le dirigeant **salarié**.
  Les revenus fonciers, de capitaux et les BIC/BNC sortent du périmètre, et le paquet le déclare
  pour que `FR-F80` bloque proprement.
- L'optimisation **conjointe** entreprise + dirigeant — arbitrer entre rémunération et dividendes,
  par exemple. ⚠️ C'est le vrai sujet du conseil, et il mérite sa fiche : il exige les deux
  calculs, leurs interactions, et un cadrage que *« pour un début »* n'ouvre pas.

## Critères d'acceptation

1. Le calcul est restitué **étape par étape**, avec les tranches, leurs taux et leurs parts ; la
   somme des parts égale le montant dû, et l'écart est publié s'il existe.
2. Chaque étape cite **son article et le millésime** du paquet.
3. Les retenues imputées sont **traçables jusqu'aux lignes de rémunération** qui les ont produites.
4. Un levier sans article, sans condition d'éligibilité ou sans contrepartie **fait échouer la
   validation du paquet** — au packaging, pas à l'exécution.
5. Un levier non éligible n'est **pas affiché avec un gain grisé** : il est absent, ou présent avec
   le motif d'inéligibilité. ⛔ Un gain montré puis retiré est une promesse.
6. Le comparatif porte la mention que **rien n'est appliqué** et qu'aucune déclaration n'est
   modifiée. Témoin : aucune route n'écrit une déclaration depuis cet écran.
7. Aucun taux, aucun levier, aucun seuil dans le code (NFR-F04).
8. Les montants individuels du dirigeant suivent la **restriction de lecture** d'AD-21 : servis aux
   seuls rôles qui en ont l'usage déclaratif.

## Notes

- ⚡ **Ce que le PO achète vraiment avec « en lui expliquant ».** Le dirigeant d'une PME togolaise
  découvre souvent son IRPP au moment de le payer. Un décompte qui part de sa rémunération et
  descend jusqu'au solde, avec les retenues déjà faites, transforme une facture subie en un calcul
  vérifiable — et c'est ce qui fait qu'il ne conteste pas le cabinet.
- ⚠️ **Le mot « optimiser » demande de la prudence dans l'écran, pas dans le code.** Le produit ne
  se prononce jamais sur l'opportunité : il chiffre des options prévues par la loi, cite l'article,
  et laisse le conseil au professionnel qui en a le titre. C'est déjà la position de STORY-097 pour
  l'IS ; elle vaut davantage encore ici.
- ⛔ **Ne pas dériver de leviers du corpus pédagogique ni d'une pratique observée.** Chaque levier
  vient du CGI, avec son article. Un « on fait souvent comme ça » n'entre pas au paquet.
