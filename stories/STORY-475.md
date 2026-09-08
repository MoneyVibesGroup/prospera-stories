# STORY-475 : La comparaison se limite à deux mesures annuelles — ni produits, ni marge, ni BFR, ni CAF

Status: done

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 3 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-036** (projection 3 ans, trésorerie 12 mois, scénarios comparés), 2026-08-27.
Relevé en confrontant `ComparaisonAnnuel` à ce qu'un dirigeant lit dans une comparaison de plans d'affaires.

---

## Le fait

`ComparaisonAnnuel` porte `resultatNet` et `tresorerieCloture`. Rien d'autre.

Sur le dossier de démonstration, « Optimiste 2026 » et « Prudent 2026 » diffèrent de **5 948 219 F de
produits en N+3** — près d'un tiers du chiffre — et **la comparaison ne le montre pas**. Comparer deux
plans d'affaires sans comparer l'activité qui les produit n'a pas de sens : c'est la ligne qu'on lit en
premier.

Manquent aussi, et pour la même raison : la **marge brute** (l'écart de structure entre deux
scénarios), le **BFR** (ce que la croissance immobilise) et la **CAF** (ce qui rembourse).

Second manque, plus discret : **aucun cumul**. Un arbitrage entre scénarios se fait sur le résultat
**cumulé** de l'horizon, pas exercice par exercice. Sur ce dossier le classement s'inverse selon la
mesure — « Optimiste » dégage **2 288 704** de résultat cumulé contre **975 659** à « Prudent », et
c'est pourtant « Prudent » qui finit le plus bas en trésorerie. **La rentabilité et la trésorerie ne
classent pas les scénarios dans le même ordre**, et c'est exactement ce qu'une comparaison doit rendre
lisible.

## Critères d'acceptation

- [ ] AC-1 — `ComparaisonAnnuel` porte `produits`, `margeBrute`, `bfr` et `capaciteAutofinancement`
      en plus des deux mesures actuelles.
- [ ] AC-2 — `ComparaisonScenario.cumul` porte `{ resultatNet, produits, investissements }` sur
      l'horizon complet, et les écarts vs référence sont calculés dessus comme sur le reste.
- [ ] AC-3 — Les écarts (`ComparaisonEcartsAnnuel`) couvrent **toutes** les mesures publiées : un
      champ comparé sans son écart oblige le client à refaire la soustraction, et deux soustractions
      divergent tôt ou tard.

## Conséquences ailleurs

- Ces mesures sont **déjà calculées** par `ProjectionAnnuelleService` : la story est une projection de
  champs, pas un calcul neuf.


---

## Progress Tracking

**Statut : done** — clôturée le 2026-09-08. PR `bilan-service` #107 rebase-mergée sur `dev`.

### Prémisses vérifiées AVANT d'écrire

**Exactes.** Les quatre mesures de l'AC-1 sont déjà calculées par exercice :
`produits` et `margeBrute` dans `compteResultat`, `bfr` dans `bilanSimplifie`,
`capaciteAutofinancement` dans `tresorerie`. La story est bien **une projection de champs**.

⚠️ Pour l'AC-2, `investissements` est disponible **par exercice** dans le moteur, mais n'est
**pas publié** sur `ExerciceProjete` : seul `fluxInvestissement` l'est, en négatif. Le cumul se
déduit donc de ce flux, sans champ neuf.

### Décisions de conception

- **D-475-1 — L'écart accompagne CHAQUE mesure comparée** (AC-3). Un champ publié sans son
  écart oblige le client à refaire la soustraction, et deux soustractions divergent tôt ou
  tard — sur des arrondis, sur un signe, ou parce que l'une oublie un cas. Le contrat
  `ComparaisonEcartsAnnuel` reprend donc **exactement** les six mesures de
  `ComparaisonAnnuel`.
- **D-475-2 — Le cumul d'INVESTISSEMENTS est publié en valeur POSITIVE** (un montant investi),
  là où le moteur porte `fluxInvestissement` **négatif** (une sortie de trésorerie). Publier le
  flux tel quel sous le nom « investissements » ferait lire « −15 000 000 investis ». Le signe
  est fixé une fois, à la publication, et documenté.
- **D-475-3 — Le cumul est celui de l'HORIZON COMPLET** (les trois exercices), jamais une
  moyenne : c'est la grandeur sur laquelle un arbitrage se fait, et c'est elle qui montre que
  **la rentabilité et la trésorerie ne classent pas les scénarios dans le même ordre**.

### Livré

Six mesures annuelles au lieu de deux, `cumul` par scénario, et les écarts sur **toutes** les
mesures. Aucune écriture en base, aucun calcul neuf : toutes les mesures venaient déjà du moteur.

### Portes

Lint 0 · build OK · **2 287** essais unitaires · **694** e2e · **9 mutations volontaires, 9 rouges**.

### ⚡⚡ Revue de code — 7 constats

**`capaciteAutofinancement` n'était gardé par RIEN** (mutation confirmée) : le remplacer par `0`
laissait **2 286 unitaires et 694 e2e verts**, y compris l'essai qui se présentait comme le filet
anti-remplissage. Trois causes cumulées — un `typeof === 'number'` vrai de zéro, un essai qui
omettait ce champ, et un écart devenu `0 === 0 - 0`.

**Et ma garde « pas des zéros » ne prouvait que la VARIABILITÉ** : elle comparait les deux
scénarios entre eux, donc **n'importe quel** champ du moteur qui varie la satisfaisait — câbler
`margeBrute` sur `produits` la laissait verte. Elle confronte désormais chaque mesure à **la valeur
du moteur**.

**Deux DTO n'implémentaient pas leurs interfaces** — précisément ceux qui portent `cumul`, alors que
j'avais écrit la justification de l'`implements` trois classes plus haut. Supprimer `cumul` du DTO
laissait `tsc` **et** 2 286 essais verts : le champ serait parti dans le JSON **sans être déclaré au
contrat**.

**Les écarts de cumul publiaient une garantie de signe fausse** : « en valeur positive » sur une
**différence**, que le code viole dès qu'un scénario investit moins que la référence. Un client
lisant « 6 000 000 investis **en plus** » là où le chiffre dit « de moins » — l'inversion exacte que
D-475-2 existe pour empêcher, **réintroduite par la description**.

Plus la description de l'endpoint qui énumérait deux mesures sur six, un titre d'essai promettant
plus que ce qu'il mesure, et trois fixtures de cumul contredisant leurs propres lignes.

### Revue de sécurité — 0 constat

Aucune route ni garde modifiée ; toutes les mesures viennent du moteur invoqué sur le snapshot du
dossier autorisé ; même classe de sensibilité que les deux déjà servies ; volume borné à 5 scénarios.

### Vérification en réel

Les six mesures servies, les **six** écarts re-dérivables des mesures publiées, le cumul
re-dérivable des exercices, et les investissements cumulés **positifs**.
