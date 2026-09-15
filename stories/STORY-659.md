# STORY-659 : Le portefeuille d'une IMF ne se classe ni ne se provisionne — il manque le texte prudentiel BCEAO, pas du code

Status: done

**Complexité :** high

**Épic :** EPIC-121 — Socle vertical SFD (paquet prudentiel séparé, AD-3)
**Service :** `microfinance-service` (artefact `prudentiel-sfd-bceao`, validateur `scripts/referentiels/valider-paquet-prudentiel.mjs`)
**Points :** 5 · **Sprint :** S20
**Origine :** dette **déclarée** par STORY-498 (D-498-A), puis par STORY-503 (D-503-A) et STORY-504 (D-504-A), et
**remesurée le 2026-09-15** à la clôture de STORY-504.

> ⛔ **Bloquée par une ENTRÉE, pas par une dépendance technique.** Toute la mécanique existe et est prouvée ; ce qui
> manque est le **texte réglementaire opposable**. Inventer une tranche ou un taux « vraisemblable » est exactement ce
> que la règle du projet interdit (STORY-498 AC-2 : une valeur sans référence fait échouer le build).

---

## Le fait

Une IMF qui ouvre Prospera aujourd'hui obtient, pour **chaque** crédit décaissé, le classement `NON_CLASSABLE`
(motif `AUCUNE_TRANCHE_DANS_LE_PAQUET`), et toute proposition de provisionnement répond
`409 PAQUET_PRUDENTIEL_SANS_VALEUR`. Le produit sait dériver le retard d'un crédit à une date d'arrêté, le classer par
tranche, calculer l'assiette, la dotation en complément et la reprise, écrire un arrêté de provision — **sur aucune
valeur réelle**.

⛔ C'est le seul endroit du programme où l'absence est un risque réglementaire pour le client, pas un inconfort : une
IMF sous-provisionnée est **en infraction**, pas en retard (spine microfinance, AD-4).

**Mesuré le 2026-09-15, pas supposé :**

| Constat | Mesure |
|---|---|
| le paquet servi est une amorce vide | `prudentiel-sfd-bceao-1.0.json` : `statut: amorce`, `provisionnement.tranches: []`, `provisionnement.garantiesAdmises: []`, `declassement.regles: []`, `ratios.seuils: []` |
| sa `normeSource` ne cite aucun texte | « Aucune — aucun texte prudentiel de la BCEAO ou de la Commission Bancaire de l'UMOA applicable aux SFD n'a été fourni au projet (D-498-A) » |
| le classement ne produit jamais `CLASSE` en production | STORY-503, vérification docker R2 : `NON_CLASSABLE`, `tranchesLivrees: false` ; `CLASSE` n'est prouvé que par le paquet de TEST fictif |
| le provisionnement refuse avant toute lecture de crédit | STORY-504, vérifications docker S2, T1→T6, U1→U5, V1→V4 : `409 PAQUET_PRUDENTIEL_SANS_VALEUR` |
| la mécanique qui recevra les valeurs est prête | schéma + validateur (P1 amorce, P2 partition des tranches, P3 une garantie admise par type), chargeur vérifié par checksum, `tranchesLivrees` / `valeursLivrees` |
| le référentiel COMPTABLE, lui, est complet | `sfd-bceao@2.0` : 372 comptes du RCSFD (instructions n°025 et n°026-02-2009) — ⚠️ ce ne sont PAS des normes prudentielles |

## Ce qui débloque (l'entrée attendue)

Le **texte prudentiel opposable** applicable aux Systèmes Financiers Décentralisés de l'UMOA, fourni au projet
(PDF ou extrait intégral), avec pour chaque élément **l'instruction, l'article et l'année** :

1. les **tranches d'ancienneté de retard** des créances en souffrance et leur **taux de provision** ;
2. les **garanties admises en déduction** de l'assiette et leur **quotité** ;
3. les **règles de déclassement** (dont la contagion par débiteur, utile à STORY-505) ;
4. les **seuils des ratios prudentiels** (utiles à STORY-510).

⚠️ Et l'identité du **praticien SFD** qui relira la transcription : sans relecture, le paquet ne quitte pas le statut
`a-valider-par-expert` (STORY-498 AC-3, vocabulaire `meta-vocabulaire.json`).

## Critères d'acceptation

- [x] AC-1 — Les tranches, taux, garanties admises (et, si le texte les porte, règles de déclassement et seuils) sont
      transcrits dans une **nouvelle version** du paquet (`prudentiel-sfd-bceao@1.1` ou `@2.0` selon l'ampleur),
      **chaque élément portant sa `source`** (instruction, article, année). La version `1.0` reste lisible et son
      checksum inchangé.
- [x] AC-2 — ⛔ **Aucune valeur sans référence** : la garde R4 et les règles P1→P3 passent ; une fixture temporaire
      portant une valeur sans source fait échouer la garde (preuve non vacante, patron STORY-498).
- [x] AC-3 — `_meta.statut` vaut `a-valider-par-expert` tant que le praticien n'a pas relu ; `normeSource` cite le
      texte ; `miseEnGarde` dit ce qui reste à valider. Le passage à un statut certifié est une étape **distincte**,
      datée et attribuée.
- [x] AC-4 — Les tranches forment une **partition de [0, +∞)** (P2) ; une trouée ou un chevauchement dans le texte est
      signalé à l'user, jamais « corrigé » en silence.
- [x] AC-5 — Sur la stack docker, avec le paquet réel servi : un crédit en retard est `CLASSE` dans la tranche attendue
      par le texte ; une proposition de provisionnement rend assiette, taux, dotation et formule, montants **calculés
      d'avance à la main depuis le texte** ; un arrêté s'applique (TENANT_ADMIN) et se rejoue `dejaApplique`.
- [x] AC-6 — Non-régression : les suites de STORY-503/504 fondées sur le paquet fictif restent vertes ; le checksum et
      le manifeste du paquet servi sont mis à jour ; `sfd-bceao-2.0` est intact.

## Hors périmètre

Contagion par débiteur et crédits restructurés (STORY-505) · ratios prudentiels et états (STORY-509/510) · publication
en balance (STORY-507) · tout calcul nouveau : cette story **transcrit** un texte dans une mécanique existante.

## Progress Tracking

### Déblocage — le texte a été trouvé (2026-09-15, demande user)

- Recherche en ligne à la demande de l'user. **Provisionnement, garanties, déclassement** : *Référentiel comptable
  spécifique des SFD de l'UMOA*, version allégée, comptes 29/299, p. 64-65 (PDF cb-umoa.org, pages lues **en image** :
  police sans table Unicode). **Seuils** : Instruction n°010-08-2010, annexes I à IX (recueil BCEAO). Provenance,
  empreintes des PDF et table de transcription : `docs/referentiels/README-prudentiel-sfd-bceao.md`.
- ⚠️ L'Instruction n°026-11-2016 vise les **banques**, pas les SFD ; le guide d'audit de 2010 (findevgateway) est une
  source secondaire, écartée.

### Décisions de transcription

- **D-659-A — version allégée seulement.** L'Instruction n°021-12-2010 la réserve aux SFD de moins de 50 M FCFA
  d'encours ; la version développée n'est publiée nulle part (cb-umoa, BCEAO, DRS-SFD Sénégal, Trésor ivoirien).
  Signalé à l'user avant transcription, accepté. Dite dans la `miseEnGarde`.
- **D-659-B — une borne = la durée la plus courte de N mois civils** : 0-89 j, 90-181 j, 182-365 j, 366-730 j,
  731 j et plus (minima mesurés de 2024 à 2031). ⚡ **Révisée par la revue de code** : la première lecture
  « 1 mois = 30 jours » affirmait ne jamais sous-provisionner, et c'était faux à la borne des 3 mois.
- **D-659-C** — au-delà de 24 mois, taux 100 % (le texte dit « classée en charges » sans taux).
- **D-659-D** — de 0 à 3 mois, taux nul (provisionnement facultatif).
- Garantie admise : `NANTISSEMENT_DEPOT` à quotité 1 ; les dépôts de la **caution** ne sont pas représentables, donc
  pas déduits. Seuils en **pour cent**, comme le texte. Version `1.1` (ajout de valeurs, schéma inchangé).

### Développement (branches MNV-659, flux APEX complet dans la session)

- `prudentiel-sfd-bceao@1.1` (`a-valider-par-expert`) : 5 tranches, 1 garantie admise, 5 règles, 11 seuils, chaque
  élément sourcé (texte, page ou annexe). `PAQUET_PRUDENTIEL_SERVI` = 1.1 ; la 1.0 reste au manifeste, empreinte
  `b4b79e8a…` figée en littéral dans `referentiel-assets-coherence.spec.ts`.
- Specs : AC-2 non vacant sur le paquet **servi** (source retirée de chaque collection ⇒ refus nommé ; valeur réelle
  hors source ⇒ R4), partition et taux épinglés, chaque source cite son texte ; preuves de `NON_CLASSABLE` et du
  `409 PAQUET_PRUDENTIEL_SANS_VALEUR` **conservées sur l'amorce 1.0** ; e2e Mongo réel AC-5 aux montants posés à la
  main.
- ⚡ Un test d'égalité sur des `DecimalExact` (BigInt) faisait tomber toute la suite en « failed to run » : Jest ne
  sait pas transmettre un échec contenant un BigInt depuis un worker. Comparé en texte.

### Mutations (toutes rouges)

| Mutation | Tests rouges |
|---|---|
| bornes 90/91 décalées (checksum recalé) | 2 |
| un octet de l'amorce 1.0 (checksum recalé) | 1 (AC-1) |
| paquet servi remis à 1.0 | 4 |
| taux 3-6 mois 0,4 → 0,35 — e2e Mongo réel AC-5 | 1 |
| garantie admise retirée | 3 |

### Revue de code (⑥) — un bloquant, corrigé (commit `30d2ef0`)

- **[90] Sous-provisionnement à la borne des 3 mois** : du 15 février au 15 mai il n'y a que 89 jours ; un retard de
  90 jours restait à 0 % au lieu de 40 %, alors que la mise en garde servie affirmait l'inverse. Corrigé par D-659-B
  révisée ; empreinte `0d320dc6…` → `c76b1afe…`. Montants de l'AC-5 inchangés (94/186/40/132 jours dans les mêmes
  tranches).
- Écartés (< 80) : un crédit sans retard est `CLASSE` dans la tranche 0-3 mois (imposé par P2, effet en balance =
  STORY-507) ; libellé « compte 2991 » sur la tranche 90-181 j ; `NON_CLASSABLE` ne se prouve plus sur Mongo réel (reste
  en unitaire sur la 1.0). Seconde lentille `ponytail-review` : rien à retrancher.

### Revue de sécurité (⑦) — aucune vulnérabilité

- 0 constat ≥ 80. Le code rendu atteignable (proposition, arrêté) a été relu : nantissement déduit seulement s'il cite
  un blocage réel du membre, non levé, d'un montant ≥ valeur nantie, jamais nanti deux fois ; checksum vérifié avant
  parse ; acte réservé à `TENANT_ADMIN`, verrou et index unique contre le rejeu. Risque résiduel déjà accepté (D-504-Q/R/S).

### Vérification docker (état final, empreinte `c76b1afe…`) — AC-5 prouvé, aucun défaut

Stack réelle : auth, KYC, catalogue, dossiers, microfinance, Mongo rs0, Kafka. Organisation inscrite, e-mail vérifié
(Mailhog), référentiel `sfd-bceao@2.0` déclaré et entitlement octroyé **par le catalogue** (projection Kafka), dossier
MICROFINANCE et exercice 2026 **par l'API des dossiers** ; membre, produit, trois crédits, décaissements et remboursement
**par l'API microfinance**. Seul le statut KYC est semé dans les deux read-models (chemin de garde, pas une valeur
sous test). Service redémarré après le correctif ; la route du paquet sert `1.1`, `a-valider-par-expert`,
`c76b1afe…`, `valeursLivrees: true`. Attendus écrits avant appel.

| Point | Verdict |
|---|---|
| Classement au 20/05 : C1 `CLASSE` 94 j `SOUFFRANCE_3_6_MOIS`, C2 hors bilan, C3 `CLASSE` 40 j `SOUFFRANCE_0_3_MOIS`, paquet 1.1 | **PROUVÉ** |
| Proposition au 20/05 : C1 assiette 600 000 × 0,4 = 240 000 (hypothèque et caution non admises), C3 0 ; formule citée | **PROUVÉ** |
| Acte (TENANT_ADMIN) 201 puis rejeu 200 `dejaApplique` ; en base : 1 en-tête (paquet 1.1 + empreinte), 3 lignes, 0 orpheline | **PROUVÉ** |
| Rang 2 au 20/08 : C1 186 j × 0,8 = 480 000 (dotation 240 000), C3 132 j × 0,4 = 110 000 ; requise 590 000, déjà 240 000, dotation 350 000 ; en base 2 en-têtes, 6 lignes | **PROUVÉ** |
| 0 erreur ni réponse 5xx dans les journaux du service | **PROUVÉ** |

Effets de bord en base de dev : organisation « IMF Verif 659 », `sfd-bceao@2.0` déclaré au catalogue. Stack arrêtée.

### ⚠️ Régression rattrapée avant le merge (commit `c15e006`)

- Le premier e2e complet rougissait sur `test/credits.e2e-spec.ts` : trois tests assertaient encore le paquet servi
  vide. Je l'avais d'abord pris pour le flake de port connu — **à tort** : ma sortie filtrée (`head -30`) ne montrait
  que les dépôts, qui passent seuls. Rejoué isolément, l'échec était reproductible.
- ⚡ **Cause de l'oubli** : ce fichier porte un **octet NUL** hérité de `dev` (MNV-504) ; `grep` le traite en binaire
  et n'affiche aucune correspondance — l'inventaire des dépendances du paquet l'avait sauté. Inventaire refait en
  mode binaire : 4 fichiers suivis portent un octet NUL, seul celui-ci mentionnait le paquet vide.
- Corrigé : routage et classement attendent `CLASSE` ; la preuve HTTP du `409` sert l'amorce 1.0 chargée par le
  **vrai** chargeur. Les octets NUL de `dev` restent hors périmètre (dette).

### Portes sur l'état final (rejouées en session)

Lint 0 warning · build OK · **2 397** unitaires / 122 suites, couverture **99,75 / 97,17 / 99,62 / 99,77** (seuils
65/90/90/90 inchangés) · **357** e2e / 12 suites (71 sautés : les suites Mongo réel sans URI) · **37/37** sur Mongo réel
(classement, provisionnement, route du paquet). ⚠️ Tests lancés hors Portly : l'application s'est arrêtée en cours de
session et ne se relançait pas.

### Dettes consignées, hors périmètre

- Relecture par un **praticien SFD** nommé et passage au statut `certifie` (étape distincte, datée, attribuée).
- **Version développée** du RCSFD : confirmer que ses taux sont ceux de la version allégée (D-659-A).
- **Octets NUL bruts** dans 4 fichiers de test de `microfinance-service` (hérités de `dev`) : `grep` les rend
  invisibles.
- Passage en perte au-delà de 24 mois (compte 669) non modélisé ; dépôts de la caution non déductibles.

## Notes

- ⛔ Tant que le texte n'est pas fourni, **aucune valeur ne s'écrit**, ni « à titre d'exemple », ni dans un commentaire,
  ni dans un exemple Swagger (garde de STORY-504 : aucune valeur d'exemple dans le contrat OpenAPI).
- Voir [[STORY-498]] (paquet séparé, mécanique seule), [[STORY-503]] (classement), [[STORY-504]] (provisionnement),
  spine microfinance AD-3 et AD-4.
