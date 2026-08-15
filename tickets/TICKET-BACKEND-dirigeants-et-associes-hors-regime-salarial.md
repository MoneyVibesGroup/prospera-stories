# TICKET backend — la base de rémunération est « par salarié », et un gérant n'est pas un salarié

**Type :** manque de **périmètre produit** (le référentiel connaît la règle, le PRD ne l'a jamais traduite en exigence)
**Cible :** `prds/prd-fiscalite-2026-07-31/prd.md` (§7.6) · `epics-fiscalite-2026-08-03.md` (EPIC-034) · `architecture/architecture-fiscal-service-2026-08-03/ARCHITECTURE-SPINE.md`
**Ouvert par :** revue de couverture du module employé, demandée par le PO, 2026-08-15
**Priorité :** **Must AVANT le découpage en sprints d'EPIC-034** (sprints 22-30). Après, c'est une reprise de modèle.
**Statut :** ➡️ **REPRIS le 2026-08-15 par STORY-345 (amendée), STORY-348 (amendée) et STORY-364 (neuve).**
**LES STORIES FONT DÉSORMAIS FOI** — étape 2 du cycle de vie décrit dans `tickets/README.md`. Ce ticket
n'est plus maintenu en parallèle ; il est conservé pour tracer l'origine.
Inscrit au tracker : `sprint-status.yaml` → `open_contract_gaps` → `GAP-dirigeants-hors-regime-salarial`.

---

## ⚡ ARBITRAGE PO DU 2026-08-15 — « IRPP oui, CNSS différée »

**Décision : la base de rémunération porte un TYPE DE BÉNÉFICIAIRE** — `SALARIE` | `DIRIGEANT` |
`ASSOCIE` — et le périmètre est **coupé au sourcing**, pas au bénéficiaire.

| Volet | Décision | Pourquoi |
| --- | --- | --- |
| **IRPP salariés (Art. 74)** | ✅ **v1** | déjà couvert |
| **IRPP gérants / associés (Art. 75)** | ✅ **v1** | **même barème que l'Art. 74** — c'est un aiguillage de bénéficiaire, pas un second moteur de calcul. Le coût est faible et le gérant cesse d'être silencieusement exclu |
| **Affiliation et cotisations CNSS des gérants** | ⏸️ **différé jusqu'au sourcing** | le paquet déclare lui-même `cnss.aCompleter` : plafond, ventilation par branche, **valeur SMIG à jour** — tous absents. Inventer une règle d'affiliation ici rejouerait ce que STORY-172 a évité pour CIMA |
| **Revenus distribués (Art. 79)** | ⏸️ **différé jusqu'au sourcing** | les taux sont dans le paquet, mais l'obligation qui les consomme touche la distribution de dividendes — un objet que le produit ne modélise pas encore |

### Ce que l'arbitrage impose, et ce qu'il interdit

- ✅ `FR-F27` est amendé : **« par bénéficiaire »**, plus « par salarié ». Le type est un champ de la
  base, pas une collection séparée.
- ✅ `FR-F30` s'aiguille sur le type de bénéficiaire — via le modificateur **`AIGUILLAGE`** de
  `FR-F12`, **qui existe déjà** (il sert au RSH 3/5/20 % selon l'état du tiers). Rien de nouveau à
  inventer côté moteur.
- ⛔ **AUCUN taux CNSS ni règle d'affiliation pour les gérants tant que ce n'est pas sourcé.** Un
  dirigeant dont le régime social n'est pas déterminable sort en **obligation bloquée**, avec
  l'indication précise de ce qui manque — c'est exactement ce que `FR-F25` prévoit déjà. **Il ne sort
  jamais avec un montant approximatif.**
- ⛔ Ne pas rouvrir le bornage « sans devenir un logiciel de paie ». Il tient.

### Reste à faire

- [x] ✅ **FAIT le 2026-08-15** (`398cde8`) — **PRD Fiscalité v0.3 → v0.4** : `FR-F27` amendé
      (« par bénéficiaire »), `FR-F30` amendé (aiguillage sur le type via le modificateur `AIGUILLAGE`
      de `FR-F12`, qui existe déjà), **`FR-F79`** créé (type de bénéficiaire, ensemble fermé, attribut
      de la ligne) et **`FR-F80`** créé (régime non déterminable ⇒ obligation bloquée, aucun régime de
      repli). Le périmètre v1 du volet social est arrêté sous `[HYPOTHÈSE H2]`, avec son tableau.
      ⚠️ Numérotation : ce PRD fixe sa propre règle (« une exigence nouvelle prend le numéro libre
      suivant ») ⇒ F79/F80, **pas** de suffixes — la convention `FR-C10b`/`FR-N57b` de la revue croisée
      vaut pour d'autres PRD.
- [x] ✅ **FAIT le 2026-08-15** — EPIC-034 re-découpée : **STORY-345** amendée (la base porte le type
      de bénéficiaire), **STORY-348** amendée (le calcul s'aiguille dessus), **STORY-364** créée (le
      refus sourcé `FR-F25` sur un dirigeant non déterminable, 3 pts, sprint 28). La plage déclarée de
      l'epic passe de `STORY-345..350` à `STORY-345..350 + STORY-364`.
      ⚡ **STORY-364 n'est pas une formalité** : sans elle, l'arbitrage produit le défaut qu'il voulait
      corriger — le gérant entre dans la base, l'IRPP sort, et la cotisation sociale sort à zéro ou au
      régime salarié. Le silence aurait simplement changé d'endroit.
- [x] ✅ **FAIT le 2026-08-15** (`398cde8`) — **AD-20** ajoutée à la spine `fiscal-service` : agrégat
      `LigneDeRemuneration` keyé `(dossier, période, bénéficiaire)`, **idempotence portée par la clé**
      et non par un `findOne` avant `insert`, versionnement du réimport, import et saisie sur le
      **même** agrégat, aucun régime de repli. AD-20 est posée comme **l'application d'AD-4 au volet
      social**. La carte des capacités est corrigée : I5 citait AD-9 et AD-10, deux décisions qui ne
      parlent pas de rémunération.
- [x] ✅ **FAIT le 2026-08-15** (`398cde8`) — **AD-21** : la rémunération est la **seule donnée
      personnelle de tiers** du service, dont le sujet n'a aucun compte et aucun moyen de savoir
      qu'elle existe. Minimisation, restriction de lecture aux rôles à usage déclaratif, conservation
      bornée **lue dans le paquet**. ⚠️ Piège central consigné : **le journal d'audit trace l'ACTE,
      jamais les montants** — sinon la piste d'audit, délibérément inaltérable et conservée à part
      (AD-10, AD-19), devient le contournement de toute règle de conservation posée par AD-21.

⇒ **Il ne reste plus AUCUNE action documentaire.** Ce ticket attend uniquement le développement de
STORY-345, STORY-348 et STORY-364 (sprint 28).

---

## Le problème

`FR-F27` fonde tout le module social sur **une base de rémunération « par salarié »** :

> **FR-F27** — Le système gère une base de rémunération **par salarié** et par période : salaires, primes,
> gratifications, commissions, avantages en nature, avec exclusion des remboursements de frais.

Le mot **« dirigeant »** apparaît quatre fois dans le PRD Fiscalité — **toujours comme champ d'identité**
(profil société §5, validation humaine avant dépôt §3) et **jamais comme contribuable**. Recherche
exhaustive sur le PRD, l'addendum et les epics : **zéro occurrence** de `gérant majoritaire`,
`rémunération de gérance`, `jetons de présence`, `tantièmes`, `IRCM`.

⚠️ **Ce n'est pas une omission de rédaction : le référentiel, lui, connaît la règle.**
`referentiels/paquet-fiscal-togo-2026.json`, bloc `irpp.source`, dit **textuellement** :

```json
"source": "Art. 74 CGI (barème IRPP). S'applique aussi aux rémunérations de
           gérants/associés Art. 75 et pensions/rentes Art. 76."
```

Le paquet cite l'article. Le produit ne l'a jamais lu. Un gérant majoritaire :

- **n'est pas affilié à la CNSS dans les mêmes termes** qu'un salarié — or `FR-F30` calcule les
  cotisations « employeur et salarié » sans autre catégorie ;
- **sa rémunération relève de l'Art. 75**, distinct du régime salarial de l'Art. 74 même si le barème
  IRPP est le même ;
- il est **fréquemment le seul « payé » d'une TPE togolaise** — la cible même du produit.

⇒ Une base « par salarié » l'exclut **par construction, et silencieusement** : aucune erreur, aucun
blocage, juste une déclaration sociale incomplète.

## Le second volet, dans le même angle mort

Le paquet porte les **retenues sur capitaux mobiliers** (`retenuesSource.capitauxMobiliers`, Art. 79) :
revenus distribués **13 %**, dividendes CREPMF **7 %** personne morale / **3 %** personne physique,
libératoire IRPP **13 %**, exonération mère-filiale (Art. 107).

**Aucun FR du PRD Fiscalité ne couvre la distribution aux associés.** `FR-F11` cite pourtant
« retenues sur capitaux » comme exemple de la famille `PROPORTIONNELLE` — la famille de calcul existe,
l'obligation qui l'utiliserait n'a jamais été écrite. C'est l'autre moitié de ce que perçoit un
dirigeant de PME.

## Ce qui existe déjà et n'est pas en cause

Le module employé est, pour le reste, **correctement cadré** — ce ticket ne le remet pas en question :

| Où | Quoi |
| --- | --- |
| PRD §7.6 | FR-F27 → FR-F32 : base, double alimentation import/saisie, idempotence, calcul, calendrier, rapprochement |
| EPIC-034 | STORY-345 → 350 |
| Paquet fiscal | CNSS 17,5 % employeur / 4 % salarié, assiette (inclus/exclus), plancher SMIG, déductibilité patronale |
| Familles | `BAREME_TRANCHES` (IRPP, 8 tranches jusqu'à 35 %) · `PLANCHER_ASSIETTE` (SMIG) · `PROPORTIONNELLE` (RSL 8,75 %) |

Le bornage « **sans devenir un logiciel de paie** : ni bulletins, ni congés, ni soldes de tout compte »
est explicite et assumé. **Ce ticket ne le rouvre pas** — il constate qu'une catégorie de bénéficiaire
manque à la base, pas qu'il faut un module de paie.

⚡ Et la donnée d'identité existe **déjà** : `dossier.schema.ts` porte un tableau `dirigeants[]`
(`nom`, `fonction`, `nif`) depuis STORY-301. Le dirigeant est **connu du système**, il n'est
simplement **jamais calculé**.

## ~~Résolution attendue~~ — SECTION HISTORIQUE, D'AVANT L'ARBITRAGE

> ⚠️ **Ce qui suit décrit l'état du 2026-08-15 AU MATIN, avant que le PO tranche. Conservé pour tracer
> l'origine, PAS maintenu.** Le `README.md` de ce dossier est explicite : « un ticket stampé ne se
> modifie plus […] deux sources de vérité sur le même sujet, c'est précisément le défaut que ce dépôt
> a rencontré trois fois ». Cocher ces cases une par une serait maintenir le ticket en parallèle des
> stories.
>
> **Ce qui fait foi désormais :** la section « ARBITRAGE PO » en tête de ce fichier, puis
> **STORY-345**, **STORY-348** et **STORY-364**.
>
> Pour mémoire, l'état réel au 2026-08-15 au soir : l'arbitrage est rendu · `FR-F27` et `FR-F30` sont
> amendés, `FR-F79` et `FR-F80` créés (PRD v0.4) · EPIC-034 est re-découpée · AD-20 et AD-21 sont dans
> la spine. **Un seul point de cette liste reste ouvert, et il l'est par DÉCISION** : le FR pour les
> revenus distribués (Art. 79) n'est pas écrit parce que l'arbitrage l'a placé **hors v1 faute de
> source**, pas parce qu'il a été oublié. Le garde-fou « ne pas inventer de taux » n'est pas une tâche
> mais une contrainte permanente : elle est tenue par `FR-F80` et par le test de mutation de
> STORY-364.

- [ ] **Arbitrage PO d'abord** — la question est de périmètre, pas de technique : la base de
      rémunération porte-t-elle **un type de bénéficiaire** (`SALARIE` | `DIRIGEANT` | `ASSOCIE`), ou
      les rémunérations de dirigeants sont-elles **hors périmètre v1**, explicitement et par écrit ?
      **Les deux réponses sont acceptables ; l'absence de réponse ne l'est pas** — c'est elle qui
      produit une déclaration sociale fausse sans que rien ne le signale.
- [ ] Si retenu : amender **`FR-F27`** (bénéficiaire, pas « salarié ») et **`FR-F30`** (le régime de
      cotisation dépend du type de bénéficiaire — un `AIGUILLAGE` au sens de `FR-F12`, la mécanique
      existe déjà et n'est pas à inventer).
- [ ] Ajouter un **FR pour les revenus distribués** (Art. 79) : la famille `PROPORTIONNELLE` et les
      taux sont dans le paquet, il manque l'**obligation** qui les consomme.
- [ ] ⚠️ **Ne PAS inventer de taux ni de règle d'affiliation CNSS pour les gérants.** Le paquet
      déclare lui-même `cnss.aCompleter` : « plafond éventuel de cotisation, ventilation par branche,
      **valeur SMIG à jour** ». Sourcer avant de coder — c'est la règle qui a évité l'invention de
      `longueurCompteDetail` pour CIMA (STORY-172), et le `TICKET-BACKEND-classes-de-gestion-non-sourcees-par-referentiel`
      montre ce que coûte de s'en écarter : un résultat comptable **doublé**, sans témoin.

## Deux constats connexes, relevés dans la même revue

Ils appartiennent au même périmètre et sont notés ici pour ne pas être redécouverts, **mais ils ne
dépendent pas de l'arbitrage ci-dessus** :

1. ⛔ **EPIC-034 n'a AUCUNE décision d'architecture.** La spine `fiscal-service` porte AD-1 → AD-19.
   `application/remuneration` n'y apparaît **qu'une seule fois**, dans le tableau des incréments (I5),
   rattaché à **AD-9** (la déclaration est append-only) et **AD-10** (le journal d'audit) — deux
   décisions qui ne parlent pas de rémunération. Rien n'est décidé sur l'agrégat, sur l'idempotence de
   l'import (**pourtant exigée par `FR-F29`**), ni sur le format de fichier. Six stories sur du vide.
2. ⛔ **La paie est de la donnée personnelle, et la spine n'en dit rien.** Noms, salaires et avantages
   en nature de **personnes physiques tierces** — la seule catégorie de donnée du produit qui ne
   concerne pas l'entreprise cliente. La spine traite les secrets de canal (AD-13) et le journal
   d'audit (AD-10, AD-19) ; **aucune règle de conservation, de minimisation ou de restriction de
   lecture** sur les données de salariés.

## ~~Definition of Done~~ — SECTION HISTORIQUE

> ⚠️ Même remarque. La DoD qui compte est celle de **STORY-345**, **STORY-348** et **STORY-364**.
> Le seul critère de cette liste qui survit — « le paquet fiscal ne contient aucun taux inventé,
> chaque valeur porte sa source » — est repris **textuellement** dans les AC de STORY-364, où il est
> vérifiable par un test de mutation au lieu d'être une intention.

- [ ] L'arbitrage est écrit dans le PRD (retenu **ou** exclu — et si exclu, la limite est visible du
      cabinet à l'écran, pas seulement dans un document).
- [ ] Si retenu : les FR amendés, EPIC-034 re-découpée, et **une AD dans la spine** couvrant l'agrégat
      de rémunération et le traitement des données personnelles.
- [ ] Le paquet fiscal ne contient **aucun taux inventé** — chaque valeur porte sa source.
