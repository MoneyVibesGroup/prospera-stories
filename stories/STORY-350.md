# STORY-350 : Le rapprochement des charges sociales avec les comptes de personnel

Status: in-progress — écrite le 2026-11-27 par la session du groupe C juste avant de la coder (lot 7, n° 17 du fiscal,
`PLAN-LOT-7-2026-11-24.md` §3 ; **elle finit EPIC-034**, que D a laissé `in_progress` après 349). Il n'existait pas de
fiche : les critères viennent de `epics-fiscalite-2026-08-03.md` (EPIC-034, STORY-350) et de ce que D a laissé pour elle
(STORY-348, D-348-12 : « `CalculRemunerationService` est exporté pour STORY-350, qui lit les totaux sans nom du calcul » ;
STORY-349 : « `ObligationsModule` ne doit pas importer `RemunerationModule` : un module de 350 importe les deux »). Contrat
et communs annoncés avant le code (« ⚠ Contrats » et « ⚠ Communs » du journal de C).

**Epic :** EPIC-034 · **Points :** 3 · **FR :** FR-F32 · **Architecture :** AD-21 (« le rapprochement à la balance n'a pas
besoin de savoir qui gagne combien »), AD-14 (la balance de référence, jamais son origine), NFR-A06 (aucun compte en dur :
le paquet), AD-27 (on ajoute un code d'anomalie, on n'en renomme aucun).
**Service :** `prospera-fiscal-service` — un **module neuf de C** (`modules|application|domain/rapprochement-social`, un
port et un adaptateur neufs) ; **la source du paquet fiscal Togo** dans `prospera-balance-service` (à C, D-L7-3).
**Après :** 348 (D : le calcul social, ses totaux sans nom), 349 (D : les obligations `COTISATIONS_SOCIALES` et
`RETENUE_IRPP`), 1101 (C : le patron du rapprochement par couples du paquet), 326 (la règle d'écart `juger`, la
tolérance), 328 (les anomalies signalées), 1117 (la balance de référence).
**Dans la même story** : la **demande de D (STORY-562, D-562-3)** — le sous-schéma `suivi` du connecteur au schéma du
paquet (« la première story de C qui touche le paquet »), `attend` requis sur chaque étape (décision de la session de
groupe). La demande FE-158 de A est servie avant, dans une PR à part de la comptabilité (#22).
**Suite :** STORY-566 (la dernière du lot 7 de C ; elle porte aussi l'alignement du manifeste `declarations`).

## Histoire

En tant qu'**expert-comptable**, je veux confronter ce que j'ai calculé à ce que la comptabilité enregistre, afin de
détecter l'écart avant l'administration. *(FR-F32)*

## Critères d'acceptation (`epics-fiscalite-2026-08-03.md`, EPIC-034)

1. **Étant donné** des charges sociales calculées **quand** le rapprochement s'exécute **alors** elles sont confrontées aux
   comptes de personnel de la balance.
2. **Étant donné** un écart supérieur à la tolérance déclarée au paquet **quand** il est détecté **alors** une anomalie est
   levée en nommant les deux valeurs.
3. ⚠️ **Étant donné** ce rapprochement **quand** il s'affiche **alors** il travaille sur des **totaux par compte de
   personnel**, ⛔ **jamais sur des lignes nominatives** (AD-21).

Et, posés pour cette story : elle **lit** `remuneration` par son API (`CalculRemunerationService`, exporté par D pour
elle) et n'écrit rien dans le dossier de D ; un écart se dit comme une anomalie (patron de 326 / 1101), **jamais corrigé
en silence** ; une période sans base est **nommée**, jamais comptée pour zéro ; les comptes et la tolérance viennent **du
paquet** ; un pays sans couple n'a pas de rapprochement, et le produit le dit.

## Ce que le code porte déjà (lu sur `origin/dev`, fiscal `81e7605`, balance `8884bf3`)

| Pièce | Ce qu'elle porte | Où |
|---|---|---|
| `CalculRemunerationService.calculer(acteur, dossierId, periode)` | le calcul d'une période (`AAAA-MM`) : `totaux { cotisations { employeur, salarie, branches, amu }, retenuesIrpp, lignesBloquees { cotisations, irpp } }`, sans nom ; `BASE_INTROUVABLE` sans base | D, 348, exporté par `RemunerationModule` |
| obligations `COTISATIONS_SOCIALES`, `RETENUE_IRPP` | une par période de paie, redevable entreprise, `annee` = année de la période | D, 349, par `RegistreObligations` (C) |
| `RapprochementLiasseService`, `domain/obligations/rapprochement-liasse.ts` | couples lus au paquet (`rapprochementAnnuel`), « non défini » sans couple, `INCOMPLET` nommé, anomalie signalée puis retirée | C, 1101 |
| `juger`, `toleranceValide` | `écart = |a − b|`, conforme si `écart ≤ max(absolue, relative × |attendu|)`, jamais d'égalité stricte | C, 326 |
| `AnomaliesObligationsService.signaler / retirer`, `CATALOGUE` | les anomalies `SIGNALEE` ; on ajoute un code | C, 328 |
| `GET …/balances/reference?au=` (balance-service) | la balance que le moteur retient à la date, **avec ses lignes** (`compte`, `mouvementDebit`, `mouvementCredit`, à-nouveaux, soldes, en unités de la devise) | balance, 1117 ; le fiscal la lit **sans lignes** (`BalanceVue`) |
| paquet Togo : `taxes.types` `CNSS_PATRONALE` → `compteComptable: 664` (Art. 99) ; le plan `syscohada-revise` : `431` « Sécurité sociale », `447` « État, impôts retenus à la source » | les comptes de personnel, déclarés | balance, 093 et le référentiel |

## Décisions (par défaut, contestables)

- **D-350-1 — Un module neuf de C**, `RapprochementSocialModule` (`src/modules/rapprochement-social/`), importe
  `RemunerationModule` (D : `CalculRemunerationService`, en lecture), `ObligationsModule` (`RegistreObligations`,
  `AnomaliesObligationsService`) et `ExercicesModule` (`PaquetExerciceService`) ; il est monté dans `app.module.ts`
  (commun). Ni `ObligationsModule` ni `RemunerationModule` ne changent : aucun cycle, aucun `forwardRef`. Aucun fichier de D
  ne change ; aucune classe que `DepotsModule` instancie ne change.
- **D-350-2 — La route** : `POST /api/v1/exercices/{exerciceId}/rapprochement-social` (200), comme 1101 : rôles
  `TENANT_ADMIN` / `TENANT_USER`, accès fiscal, droit `fiscalite:declaration:preparer` (elle signale une anomalie). Sur
  demande : la balance d'un exercice ne s'arrête qu'à sa fin.
- **D-350-3 — Le calculé** : chaque mois de l'exercice (du mois de `debut` à celui de `fin`, read-model des exercices), par
  `calculer` ; on additionne les **totaux** seulement (AD-21). Trois grandeurs, nommées au paquet :
  `COTISATIONS_TOTALES` (`employeur + salarie`, branches et AMU), `COTISATIONS_EMPLOYEUR`, `RETENUES_IRPP`. Un mois **sans
  base** (`BASE_INTROUVABLE`) est **nommé** (`periodesSansBase`), jamais compté pour zéro ; il n'empêche pas de conclure (un
  mois sans paie est un fait). Un mois dont des lignes sont **bloquées** (348 / 364 : un dirigeant sans régime) rend le
  couple qui en dépend **`INCOMPLET`** (`periodesIncompletes`) : le calculé y est sous-estimé, on ne conclut pas. Un autre
  refus du calcul (paquet de l'année illisible) refuse le rapprochement tel quel.
- **D-350-4 — Les comptes de personnel** : la **balance de référence** au dernier jour de l'exercice (1117, AD-14), lue
  **avec ses lignes** par un port à part (`SourceLignesBalance`, patron du piège de 329 : `SourceBalances` ne change pas).
  Pour un couple, la somme du mouvement déclaré (`mouvementCredit` ou `mouvementDebit`, **les mouvements de l'exercice**,
  jamais les à-nouveaux ni le solde) des lignes dont le compte commence par un préfixe du couple. La réponse rend **le
  total de chaque compte retenu** (`comptes: [{ compte, montant }]`) : des totaux par compte de personnel, aucun nom
  (AC-3). Aucune balance retenue ⇒ `SANS_BALANCE`, rien n'est signalé ; une balance dans une autre devise que le paquet ⇒
  `DEVISE_DIFFERENTE`, rien n'est signalé.
- **D-350-5 — Le paquet déclare les couples** : rubrique racine `rapprochementSocial { _note, couples: [{ code, libelle,
  obligation: COTISATIONS_SOCIALES | RETENUE_IRPP, calcule: COTISATIONS_TOTALES | COTISATIONS_EMPLOYEUR | RETENUES_IRPP,
  comptes: { prefixes: [...], mouvement: CREDIT | DEBIT }, tolerance { absolue, relative? } }], source }`, gardée par **R15**
  (`valider-paquet-fiscal.mjs`). Togo 2026, trois couples : **`COTISATIONS_CNSS`** (les cotisations dues, employeur et
  salarié, face au **crédit de 431** « Sécurité sociale ») ; **`CHARGES_SOCIALES_PATRONALES`** (la part employeur face au
  **débit de 664**, le compte que le paquet range déjà à `CNSS_PATRONALE`) ; **`RETENUES_IRPP`** (les retenues d'IRPP face
  au **crédit de 447** « État, impôts retenus à la source »). Tolérance **de travail** `{ absolue: 1000 }`, celle de 326 et
  1101, **à confirmer par un expert** (question au PO). Sans couple ou couple mal formé : **« Rapprochement social non défini
  pour ce pays. »**, rien n'est lu ni signalé (patron de 1101).
- **D-350-6 — L'anomalie** : un code **ajouté** au catalogue, `RAPPROCHEMENT_SOCIAL_ECART`, `SIGNALEE`, **`AVERTISSEMENT`**,
  ne bloque aucune étape, levable en motivant. Elle est posée sur l'obligation **de la dernière période de l'exercice** du
  code du couple (`COTISATIONS_SOCIALES` ou `RETENUE_IRPP`) : c'est celle qui clôt l'exercice. Son explication nomme, par
  couple, **les deux valeurs**, l'écart et la tolérance (AC-2). Un retour dans la tolérance de tous les couples de ce code
  la retire ; un couple `INCOMPLET` ne retire rien. **Pourquoi un avertissement, et pas un blocage** : la déclaration
  sociale suit la paie, et sa date limite est le 15 du mois suivant ; un écart avec la comptabilité désigne le plus souvent
  une écriture à reprendre, pas une déclaration à retenir — le bloquer empêcherait un dépôt légal. Aucune obligation de ce
  code dans l'exercice : l'écart est rendu, et dit qu'il n'a pas où se signaler.
- **D-350-7 — L'empreinte** : chaque couple signalé (code, calculé, comptabilisé), la balance (`id@version`, `checksum`) ;
  la même photographie ne rouvre pas une levée.
- **D-350-8 — L'entreprise seule** : les obligations sociales sont celles de l'entreprise (349) ; la route ne prend pas de
  redevable.
- **D-350-9 — Un exercice à cheval** (2025-2026) : les obligations se lisent pour chaque année civile qu'il couvre.
- **D-350-10 — Ce que D a nommé, et que 350 ne couvre pas** : « relier le calculé du triplet d'une obligation sociale au
  calcul social ». 350 **lit** le calcul et le confronte à la balance ; elle **n'écrit pas** le `calcule` du triplet des
  obligations sociales (aujourd'hui `montantASaisir`). Ce lien reste à faire, dans une story de C (le triplet est dans
  `domain/obligations`), hors du lot 7.
- **D-350-11 — ← D (562, D-562-3) servie dans la même PR de balance** : `suivi` déclaré au schéma sous
  `automatisation.connecteurs[]`, sans instance au paquet Togo ; `attend` requis sur chaque étape.
- **D-350-12 — Aucune migration**, aucune collection, aucun événement ; le fiscal lit, signale par le registre existant.

## Contrat de service (« ⚠ Contrats »)

`POST /api/v1/exercices/{exerciceId}/rapprochement-social` ⇒ `200 { exerciceId, dossierId, defini, message?, balance: {
balanceId, version, checksum } | null, statut: RAPPROCHE | SANS_BALANCE | DEVISE_DIFFERENTE | NON_DEFINI, couples: [{
code, libelle, obligation, calcule, comptabilise, ecart, tolerance, statut: CONFORME | ECART | INCOMPLET, comptes: [{
compte, montant }], periodes, periodesSansBase, periodesIncompletes }], anomalies: [{ obligationId, periode, code,
posee | retiree | inchangee }] }`. Refus : `404 EXERCICE_INTROUVABLE` (hors portée compris), `403` d'accès ou de droit,
ceux de la balance (`BALANCE_NON_LISIBLE`, `SERVICE_AMONT_INDISPONIBLE`, `BALANCE_AMONT_INVALIDE`) et du paquet.

## Fichiers communs (« ⚠ Communs »)

`app.module.ts` (le module neuf) ; le contrat OpenAPI (la route et ses DTO) ; la **copie du paquet** du fiscal
(`test/fixtures/paquet-fiscal/paquet-fiscal-togo-2026.json`, nouvelle empreinte) ; `domain/obligations/anomalies.ts` (un
code ajouté, de C). Aucun fichier de D ; aucune migration.

## Question au PO

Les trois couples et la tolérance de 1 000 F sont des **valeurs de travail** : 431 au crédit pour les cotisations dues,
664 au débit pour la part patronale, 447 au crédit pour les retenues d'IRPP (447 peut porter d'autres retenues : l'écart le
montrera, à lever en motivant). **Choix par défaut** : ces trois couples, à confirmer par un expert-comptable togolais.
