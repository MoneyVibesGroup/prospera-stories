# STORY-364 : Un dirigeant dont le régime social n'est pas déterminable sort BLOQUÉ, jamais approximé

Status: not_started

**Epic :** EPIC-034 — Base de rémunération et obligations sociales
**Points :** 3 · **Sprint :** 28 (backend) · **Service :** `fiscal-service` (`:3012`)
**FR :** `FR-F25` *(obligation bloquée avec indication de ce qui manque)* · `FR-F30` amendé
**Origine :** **arbitrage PO du 2026-08-15** sur `tickets/TICKET-BACKEND-dirigeants-et-associes-hors-regime-salarial.md` — « IRPP oui, CNSS différée »
**Dépendances :** **STORY-345** *(la base porte le type de bénéficiaire)* et **STORY-348** *(le calcul s'aiguille dessus)*

---

## Pourquoi cette story existe

L'arbitrage du 2026-08-15 coupe le périmètre **au sourcing, pas au bénéficiaire** :

| Volet | v1 |
| --- | --- |
| IRPP salariés (Art. 74) | ✅ |
| IRPP gérants / associés (**Art. 75**) | ✅ — **même barème**, donc un aiguillage, pas un second moteur |
| Affiliation et cotisations **CNSS des gérants** | ⏸️ **non sourcé** |
| Revenus distribués (**Art. 79**) | ⏸️ **non sourcé** |

Il existe donc, **par construction et pour un temps indéterminé**, une catégorie de bénéficiaire dont
le **volet fiscal se calcule** et dont le **volet social ne se calcule pas**. Cette story décide ce que
le système fait dans ce cas — et ce qu'il ne fait **jamais**.

> ⚡ Sans elle, l'arbitrage produit exactement le défaut qu'il voulait corriger : le gérant entre dans
> la base, l'IRPP sort, et la cotisation sociale sort **à zéro ou au régime salarié** — un chiffre
> plausible que rien ne pince. Le silence aurait simplement changé d'endroit.

## Ce que la story livre

Le refus **sourcé** : quand une obligation sociale porte un bénéficiaire dont le régime n'est pas
déterminable depuis le paquet fiscal, elle sort en **`BLOQUÉE`**, avec l'indication précise de ce qui
manque — mécanisme que **`FR-F25` prévoit déjà** et qui n'est donc pas à inventer.

## Critères d'acceptation

- **Étant donné** un bénéficiaire de type `DIRIGEANT` **quand** l'obligation **IRPP** est calculée
  **alors** elle aboutit normalement, au barème de l'Art. 74/75.
- **Étant donné** ce même bénéficiaire **quand** l'obligation **sociale (CNSS)** est calculée **alors**
  elle sort **`BLOQUÉE`**, et **jamais** avec un montant.
- **Étant donné** une obligation sociale bloquée **quand** le cabinet la consulte **alors** le motif
  nomme **ce qui manque dans le paquet**, pas une erreur technique : « le régime d'affiliation CNSS
  des gérants n'est pas défini dans `paquet-fiscal-togo-2026` ».
- ⛔ **Étant donné** un bénéficiaire `DIRIGEANT` **quand** aucune règle d'affiliation n'existe
  **alors** le système **n'applique PAS le régime salarié par défaut**. C'est le cœur de la story : un
  repli silencieux sur le régime salarié produirait une cotisation **fausse et vraisemblable**, la
  pire des deux issues.
- **Étant donné** le paquet fiscal **quand** on y cherche le régime des gérants **alors** l'absence est
  **lue depuis l'artefact** (`cnss.aCompleter`), jamais codée en dur dans le service — le jour où le
  paquet sera complété, **le déblocage doit se faire sans livraison de code**.
- **Étant donné** un bénéficiaire `ASSOCIE` et une distribution **quand** l'obligation Art. 79 est
  demandée **alors** même traitement : bloquée et motivée, tant que l'obligation n'est pas écrite.
- **Étant donné** un dossier dont **tous** les bénéficiaires sont `SALARIE` **quand** le calcul social
  s'exécute **alors** **rien ne change** par rapport à l'état antérieur — cette story n'introduit
  aucune régression sur le chemin nominal.

## Ce que cette story ne fait PAS

- ⛔ Elle **n'invente aucun taux**, aucune assiette, aucune règle d'affiliation. Le paquet déclare
  lui-même `cnss.aCompleter` : « plafond éventuel de cotisation, ventilation par branche
  (prestations familiales / risques professionnels / pensions), **valeur SMIG à jour** ».
  ⚡ Précédent : **STORY-172** a refusé d'inventer `longueurCompteDetail` pour CIMA, et
  `TICKET-BACKEND-classes-de-gestion-non-sourcees-par-referentiel` montre le coût de s'en écarter —
  un résultat comptable **doublé** (280 M au lieu de 140 M, mesuré), sans témoin.
- ⛔ Elle ne rouvre pas le bornage « sans devenir un logiciel de paie ».
- ⛔ Elle ne porte pas le **type de bénéficiaire** lui-même (STORY-345) ni son **aiguillage de calcul**
  (STORY-348) : elle porte ce qui se passe quand l'aiguillage ne trouve pas de règle.

## Definition of Done

- [ ] Un dirigeant produit son IRPP et **aucune** cotisation sociale chiffrée.
- [ ] Le motif de blocage nomme le manque du **paquet**, et un test le vérifie sur le **texte rendu**,
      pas seulement sur le statut.
- [ ] **Test de non-repli** : muter le code pour qu'il applique le régime salarié à un dirigeant doit
      faire **virer un test au rouge**. Sans ce test, la règle centrale de la story n'est pas tenue.
- [ ] Compléter `cnss` dans un paquet de test **débloque** l'obligation **sans recompiler**.
