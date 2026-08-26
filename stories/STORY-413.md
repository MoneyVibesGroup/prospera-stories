# STORY-413 : Aucun contrat fiscal ne publie de date limite — l'écran dit « combien », jamais « pour quand »

Status: ready-for-dev

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
