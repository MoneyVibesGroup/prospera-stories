# STORY-413 : Aucun contrat fiscal ne publie de date limite — l'écran dit « combien », jamais « pour quand »

Status: done

**Épic :** EPIC-023 — Fiscalité (résultat fiscal, liquidation, TVA, provisions, TPU)
**Service :** `balance-service` (`:3007`) — `modules/fiscal` · **et** le paquet fiscal `TG@YYYY` (STORY-078)
**Points :** 3 · **Sprint :** S20
**Origine :** relevée le **2026-08-26** en construisant la maquette **FE-051**, au moment de
répondre à la question qui suit immédiatement le solde à payer.

---

## Le fait, relevé à la source

Le référentiel du projet **porte les dates**, dans `referentiels/procedures-fiscales-togo.json` :

```json
"depotEtatsFinanciers": { "echeances": [
  { "typeContribuable": "entreprise individuelle", "dateLimite": "31-03",
    "note": "TPU declaratif : etats financiers SMT au plus tard le 31 mars (LPF Art. 56)" },
  { "typeContribuable": "societe",                 "dateLimite": "30-04" },
  { "typeContribuable": "assurance / banque",      "dateLimite": "31-05" }
]}
```

**Aucun des trois contrats fiscaux ne les publie** : ni `LiquidationResponseDto`, ni
`TpuResponseDto`, ni `DeclarationTvaResponseDto`. Le calendrier des **acomptes**, lui, est bien
servi (`echeances[].date`) — la lacune ne porte donc pas sur « les dates » en général, mais
précisément sur **l'échéance de la déclaration elle-même**.

Côté TVA, `PeriodeTvaResponseDto` publie `debut` et `finExclusive` : les bornes de la **période
déclarée**, pas la date à laquelle la déclaration est **due**.

---

## Pourquoi c'est coûteux

Un expert-comptable qui ouvre un écran de liquidation ne pose pas une question, il en pose deux :
**combien** et **pour quand**. Le produit répond à la première avec une précision remarquable —
formule, taux, poste de liasse, checksum du paquet — et **reste muet sur la seconde**.

Or les deux ne se valent pas :

- un montant erroné se corrige au dépôt suivant ;
- une **échéance manquée** déclenche la taxation d'office et une **majoration de 40 %**
  (`procedures-fiscales-togo.json` → `sanctions.defautDeclarationTaxationOffice`).

⇒ Le produit est précis sur ce qui se rattrape et muet sur ce qui ne se rattrape pas.

⚠️ **La date n'est pas la même pour tout le monde**, et c'est ce qui interdit de la coder dans
l'écran : elle dépend du **type de contribuable** (société 30-04, entreprise individuelle et TPU
déclaratif 31-03, assurance et banque 31-05) et de la **date de clôture**. Une constante `30 avril`
dans le front serait fausse pour le portefeuille TPU d'un cabinet — c'est-à-dire précisément pour
les dossiers les plus nombreux.

---

## Ce qui est demandé

1. **Transcrire les échéances de dépôt en donnée structurée** dans le paquet fiscal (STORY-078) :
   `depot.echeances[] = { typeContribuable, dateLimite: "JJ-MM", source }` — même patron que
   `acomptesProvisionnels.echeances`, déjà transcrit et déjà consommé.
2. **Publier la date résolue** dans les trois contrats : `dateLimiteDepot` (projetée sur l'année
   suivant la clôture de l'exercice, comme les échéances d'acomptes le sont déjà sur l'année de
   clôture) + `typeContribuableRetenu`, pour que l'écran puisse dire **pourquoi** c'est cette
   date-là.
3. ⛔ **Type de contribuable indéterminable ⇒ aucune date.** Pas de repli sur « société » : une
   date fausse est pire qu'une date absente — elle est **crue**, et elle fait manquer l'échéance
   avec la conscience tranquille. Motif publié (`DATE_LIMITE_INDETERMINABLE`), comme
   `motifTheorique` le fait déjà pour l'acompte non proposable.
4. **TVA** : la date d'exigibilité de chaque période relève du même mécanisme. Le paquet la publie
   déjà pour les retenues (`versementRetenuesSource` : *« au plus tard le 15 du mois suivant »*) ;
   le calendrier TVA mensuel/trimestriel est encore listé dans `aFaire` du référentiel — cette
   story le **nomme** comme prérequis, elle ne le tranche pas.

---

## Critères d'acceptation

1. Le paquet publie `depot.echeances[]` structuré, avec sa source d'article.
2. `LiquidationResponseDto` et `TpuResponseDto` publient `dateLimiteDepot` (date pleine) et le
   type de contribuable retenu.
3. Type indéterminable ⇒ champ **absent** + motif publié. **Jamais une date par défaut.**
4. Une échéance publiée mais inexploitable est **écartée et signalée**, jamais roulée au mois
   suivant — même règle que `echeancesIgnorees` sur les acomptes.
5. Test : un dossier TPU rend `31-03`, une société `30-04`, un dossier sans type rend l'absence
   **et** son motif.

---

## Ce que la maquette FE-051 fait en attendant

Elle **dessine** la date sous le solde — « Déclaration à déposer au plus tard le 30 avril 2025 » —
et la marque **« non servi par l'API »**, conformément à la règle du gate de maquette (« dessiner
la cible, annoncer ce qui n'est pas servi, ouvrir une story par manque »). Elle ne la calcule pas :
un front qui déduirait cette date de la clôture se tromperait sur tout le portefeuille TPU.

---

## Dépendances

- **STORY-078** — paquet fiscal : la transcription y atterrit.
- **STORY-092 / 093 / 095** — les trois contrats qui exposeront la date résolue.
- ⚠️ Le **type de contribuable** doit être lisible depuis le dossier ou le profil de société. À
  vérifier avant de chiffrer : si la donnée n'existe pas, cette story en ouvre une autre plutôt
  que de deviner.

---

## Notes

- Créée le 2026-08-26 par la revue métier de la maquette **FE-051**, demandée par le PO.
- ⚠️ Le référentiel lui-même porte une réserve à lever : `aFaire` demande de *« confirmer la date
  de dépôt société (30/04) et le calendrier TVA mensuel/trimestriel »*. **Ne pas publier une date
  non confirmée comme si elle l'était** — c'est exactement ce que cette story reproche à l'absence.

---

## Progress Tracking

**Statut : `done`** — clôturée le **2026-08-30**. PR **#71** (`balance-service`) et **#21**
(`dossier-service`) rebase-mergées **ensemble** sur `dev`, branches supprimées.

### ⚠️ La dépendance que la story demandait de vérifier AVANT de chiffrer, vérifiée — et elle manque

> « Le **type de contribuable** doit être lisible depuis le dossier ou le profil de société. À
> vérifier avant de chiffrer : si la donnée n'existe pas, cette story en ouvre une autre plutôt que
> de deviner. »

Vérification faite, et le résultat commande toute la conception :

| Donnée | Où elle vit | Lisible par `balance-service` ? |
|---|---|---|
| `regimeFiscal` (`REEL` / `SYNTHETIQUE`) | décision **datée** portée par le dossier (STORY-303) | ✅ oui |
| `typeEntite` (`ENTREPRISE` / `MICROFINANCE` / `ASSURANCE`) | read-model `dossiers_dossier` | ✅ oui |
| **`formeJuridique`** (`SA`, `SARL`, `SAS`, `SUARL`, **`EI`**, `AUTRE`) | **saisie et obligatoire** à la création du dossier | ⛔ **non** — absente de `DossierEtatV1`, le contrat de `dossier.created`/`dossier.updated` |
| `formeJuridique` du **profil de société** | `profils_societe`, **index unique sur `orgId`** | ⛔ inutilisable : c'est le profil **du cabinet**, pas de son client — la relire pour un dossier client rejouerait exactement le défaut que STORY-303 a fermé |

⇒ **Rien dans les données détenues ne distingue une SOCIÉTÉ d'une ENTREPRISE INDIVIDUELLE au régime
réel.** L'échéance « société » (30-04) est donc **transcrite, publiée, et jamais appliquée**.

### Conception

| Décision | Ce qu'elle tranche |
|---|---|
| **D-413-1** | Les échéances sont **transcrites** dans le paquet (`depot.echeances[]`), depuis `docs/referentiels/procedures-fiscales-togo.json` qui les portait déjà — même patron que `acomptesProvisionnels.echeances`. La prose de référence reste en place et n'est **jamais parsée**. |
| **D-413-2** | Chaque échéance publie un **`modeConstatation`** — `REGIME_SYNTHETIQUE`, `TYPE_ENTITE_ASSURANCE`, `NON_CONSTATABLE`. Ce n'est **pas** une catégorie juridique : c'est ce que la plateforme sait **prouver**. Patron repris mot pour mot de `ModeConstatationMfp` (STORY-412). Un mode **inconnu** vaut `NON_CONSTATABLE` : un paquet plus récent que le moteur ne voit pas son échéance appliquée sur une valeur non interprétée. |
| **D-413-3** | ⛔ **`MICROFINANCE` n'est PAS rattachée à « assurance / banque ».** Un SFD au sens BCEAO n'est ni une assurance ni une banque au sens du LPF, et rien ne le tranche. Il sort **indéterminable** — c'est le comportement voulu, pas un oubli. |
| **D-413-4** | Le paquet publie sa **clôture de référence** (`31-12`, Art. 96 CGI) et le moteur la **vérifie**. Les dates publiées sont des **jours de calendrier** valables pour cette clôture-là : sur un exercice clos au 30 juin, « 30 avril » serait faux de mois. Clôture non conforme ⇒ `CLOTURE_NON_CALENDAIRE`, aucune date. |
| **D-413-5** | **Deux** échéances constatables applicables ⇒ `PLUSIEURS_ECHEANCES_APPLICABLES`, aucune date. Servir la première ferait dépendre l'échéance de **l'ordre de publication du paquet**. Cas atteignable : une entité au régime synthétique **et** de `typeEntite` `ASSURANCE`. |
| **D-413-6** | La primitive de projection `JJ-MM` (le garde-fou de la date fantôme `31-06`, que `Date` reporterait au 1ᵉʳ juillet) est **descendue** dans `fiscal.regles.ts` et **partagée** avec le calendrier des acomptes, qui la portait. Deux implémentations, ce serait la même date fantôme rattrapée d'un côté et servie de l'autre (même admission qu'en D-083-1). |

⛔ **Hors périmètre, conformément à la story** : la TVA (point 4 — la story la **nomme** comme
prérequis, elle ne la tranche pas) et la propagation de `formeJuridique` au read-model de
`balance-service`, qui **touche 2 dépôts** et vaut sa propre story.

### Implémentation

| Fichier | Ce qui change |
|---|---|
| `scripts/referentiels/sources/paquet-fiscal-togo-2026.json` | rubrique **`depot`** : 3 échéances + `clotureReference` + les réserves `A_CONFIRMER` conservées |
| `src/modules/referentiel/assets/…` + `paquet-fiscal-registry.ts` | artefact reconstruit, empreinte `4c1c7342…` (ex-`fcf5bcf4…`) |
| `types/fiscal.ts` | `ModeConstatationDepot`, `EcheanceDepot`, `CalendrierDepot`, `MotifDateLimiteAbsente`, `DateLimiteDepot` |
| `fiscal.regles.ts` | `projeterJourMois` / `versJourMois` (descendues), `extraireCalendrierDepot`, `resoudreDateLimiteDepot` |
| `liquidation.regles.ts` | `projeterEcheances` **rebranchée** sur la primitive partagée ; `liquider()` publie les 5 champs |
| `liquidation.service.ts` · `tpu.service.ts` | **le même** moteur sur les **deux** surfaces : deux résolutions, ce serait deux dates pour un même dossier selon la surface interrogée |
| `dto/liquidation-response.dto.ts` · `dto/tpu-response.dto.ts` | `dateLimiteDepot`, `typeContribuableRetenu`, `sourceDateLimiteDepot`, `motifDateLimiteDepot`, `echeancesDepotIgnorees` |
| `dossier-service` (2ᵉ dépôt) | artefact recopié + empreinte reportée ; ⚠️ ce service ne lit **pas** `depot` — son échéance reste celle des **acomptes** |

### Portes DoD

**balance-service** : lint 0 warning · build OK · **3 272** unitaires · **817** e2e · couverture
**99,15 / 92,09 / 98,65 / 99,25**.
**dossier-service** : lint 0 · build OK · **1 126** unitaires · **255** e2e · couverture
99,28 / 93,83 / 96,68 / 99,30.

### Passe de mutation — 5 mutations, 5 rouges **par assertion**

| Mutation | Effet |
|---|---|
| `NON_CONSTATABLE` devient applicable (**le repli sur « société »**) | 8 tests rouges, dont l'AC-3 et les deux surfaces |
| projection sur l'année **de clôture** au lieu de N+1 | 3 rouges |
| la garde de clôture désarmée (`\|\|` → `&&`) | rouge |
| `applicables.length > 1` → `> 99` (on prend la première) | rouge **des deux côtés** : moteur pur **et** surface TPU |
| la **relecture** de la date reconstruite retirée (`31-06` acceptée) | ⚡ rouge sur les tests de la story **ET** sur ceux des acomptes (STORY-092) — la preuve que le partage de D-413-6 est **réel**, pas déclaré |

### Vérification docker — les trois cas de l'AC-5, sur la stack réelle

Trois dossiers, un seul paquet (`4c1c7342…`, empreinte confirmée par `/referentiels/actifs`) :

| Dossier | Surface | `dateLimiteDepot` | `typeContribuableRetenu` | `motifDateLimiteDepot` |
|---|---|---|---|---|
| `ENTREPRENANT VERIF 413` (axes `SYNTHETIQUE` datés au 01/01/2026) | `GET …/fiscal/tpu` | **2027-03-31** | `entreprise individuelle / TPU declaratif` (`LPF Art. 56`) | — |
| `ASSURANCE VERIF 413 SA` (`typeEntite: ASSURANCE`) | `GET …/fiscal/liquidation` | **2027-05-31** | `assurance / banque` (source **`A_CONFIRMER …`**) | — |
| `SOCIETE VERIF 415 SA` (`ENTREPRISE`, réel) | `GET …/fiscal/liquidation` | **absente** | **absent** | **`DATE_LIMITE_INDETERMINABLE`** |

⚡ La **réserve du paquet voyage avec la date** : `sourceDateLimiteDepot` sort à
`A_CONFIRMER — date fournie par l'utilisateur le 2026-07-19, non retrouvée telle quelle dans le
LPF`. C'est la note de la story appliquée à la lettre — « ne pas publier une date non confirmée
comme si elle l'était ».

Côté `dossier-service`, la garde de byte-identité (paresseuse) a été déclenchée dans le conteneur :
paquet chargé, et `echeancesDuPaquet('TG')` rend toujours `["31-01","31-05","31-07","31-10"]` —
mise à niveau d'octets, comportement inchangé.

---

## Progress Tracking — clôture

**Statut : `done`** — implémentée, validée, vérifiée sur stack docker, revue (**2 constats, 2
corrigés**), revue de sécurité (**0 vulnérabilité**, confiance ≥ 80). PR **#71**
(`balance-service`, 3 commits) et **#21** (`dossier-service`, 1 commit) rebase-mergées
**ensemble**.

Les 5 critères d'acceptation sont tenus — **AC-5 avec une déviation assumée et argumentée** :

| AC | État |
|---|---|
| **AC-1** — le paquet publie `depot.echeances[]` avec sa source | ✅ 3 échéances + `clotureReference`, réserves `A_CONFIRMER` conservées |
| **AC-2** — les deux contrats publient la date et le type retenu | ✅ `LiquidationResponseDto` **et** `TpuResponseDto`, par le **même** moteur |
| **AC-3** — indéterminable ⇒ champ absent + motif, **jamais** de date par défaut | ✅ et c'est le cœur de la story |
| **AC-4** — échéance inexploitable **écartée et signalée** | ✅ les deux moitiés gardées (la seconde ne l'était pas — cf. F-413-1) |
| **AC-5** — TPU `31-03`, société `30-04`, sans type ⇒ absence + motif | ⚠️ **déviation** : la société rend **l'absence + son motif**, pas `30-04` — parce que rien dans les données détenues ne la reconnaît comme société. C'est exactement ce que la story prescrit au point 3, et ce que sa section *Dépendances* demandait de vérifier avant de chiffrer. |

### Revue de code — 2 constats, 2 corrigés (commit `a2d4282`)

| Constat | Ce qu'il valait |
|---|---|
| **F-413-1** | `echeancesDepotIgnorees` n'était asserté qu'en `toEqual([])` sur une liste **vide par construction** — le vrai paquet ne publie aucune échéance inexploitable. Remplacer le champ par un `[]` littéral laissait **879 tests verts** : un futur `31-06` aurait été écarté correctement et **jamais signalé au front**. AC-4 dit « écartée **et** signalée » ; seule la première moitié était prouvée. |
| **F-413-2** | un paquet publiant `depot.echeances` **sans** `clotureReference` rendait `CLOTURE_NON_CALENDAIRE` : l'écran disait au comptable que **son** exercice n'était pas calendaire, alors qu'il l'était et que c'était le **paquet** qui manquait sa clé. Deux causes, deux motifs désormais. Dans une story qui se justifie tout entière par la fiabilité du « pourquoi » publié, un motif qui ment coûte plus cher qu'ailleurs. |

⚡ La revue a par ailleurs **vérifié la prémisse centrale** plutôt que de la croire : `formeJuridique`
absente de `DossierEtatV1`, obligatoire à la création du dossier, read-model limité à `typeEntite`,
`profils_societe` unique par `orgId` — les quatre points confirmés dans le code, et le piège du
profil du cabinet **déjà documenté** dans `contexte-fiscal.service.ts` depuis STORY-303.

**7 mutations au total, 7 rouges par assertion.**

### Revue de sécurité — 0 vulnérabilité

| Piste instruite | Pourquoi elle ne tient pas |
|---|---|
| `typeEntite` contrôlable par l'appelant ⇒ il choisirait son échéance | seul `DossierScopeGuard` écrit `request.dossierScope` (grep exhaustif), depuis le read-model local projeté par Kafka. Ni param, ni en-tête, ni corps. Le `?? ''` est **fail-closed** : aucune échéance rattachée ⇒ aucune date. |
| Portée org du régime | `orgId` du JWT, `dossierId` du scope gardé, `axes.resoudre(orgId, dossierId, …)` doublement scopé ; autre organisation ⇒ **404 générique** en amont. |
| Pollution de prototype / injection / ReDoS | l'extraction n'indexe que des **littéraux**, aucune clé n'est dérivée d'une valeur du paquet ; aucun filtre Mongo (moteur pur) ; `/^(\d{2})-(\d{2})$/` ancrée et de longueur fixe. |
| Fuite par `sourceDateLimiteDepot` | divulgation de **processus** (qualité de transcription), aucun secret, aucune donnée d'un autre tenant. ⚡ Le champ `note` du paquet — qui décrit l'angle mort du contrat d'événement — est extrait mais **jamais retourné**. |
| Manipulation de la date par les bornes d'exercice | l'appelant ne vise que **son** dossier ; une borne absurde échoue **du bon côté** (`Invalid Date` ⇒ `ECHEANCE_INEXPLOITABLE`, jamais d'exception) ; le calcul **n'écrit rien**, donc rien n'est opposable. |
| Garde sha256 / chaîne de guards | empreintes **recalculées** : les deux artefacts valent `4c1c7342…`, cohérents à l'octet. Refus **avant** tout `JSON.parse`. Chaîne de guards inchangée, aucun `@Public()` ajouté. |

### ⛔ Ce qui reste ouvert, et qui vaut sa story

**Propager `formeJuridique` au read-model de `balance-service`** — c'est-à-dire l'ajouter à
`DossierEtatV1` (producteur) **et** à `dossiers_dossier` (consommateur) : un changement de contrat
d'événement, donc **2 dépôts**, exactement le geste que cette story n'avait pas le périmètre de
faire. Tant qu'il n'est pas fait, l'échéance du **30 avril** — celle de la majorité du portefeuille
— reste publiée et jamais servie, et l'écran ne peut dire que « indéterminable ».
