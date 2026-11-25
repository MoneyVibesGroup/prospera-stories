# STORY-326 : Les contrôles de cohérence d'une période, avec des tolérances lues au paquet

Status: in-progress — **écrite le 2026-11-25** par la session du groupe C, juste avant de la coder (lot 6) ; contrat
annoncé ci-dessous avant le code.

**Epic :** EPIC-031 · **Points :** 5 · **FR :** FR-F62, FR-F63
**Services :** `prospera-fiscal-service` (contrôle, signale) ; `balance-service` (sert les chiffres du moteur, et porte
la source du paquet fiscal).
**Après :** STORY-322 (le triplet, le déclaré), STORY-328 (anomalies signalées, levée motivée), STORY-1117 (la balance
de référence). **Suite :** STORY-1101 (le rapprochement annuel, face à la liasse), STORY-327 (continuité entre périodes).

## Histoire

En tant qu'**expert-comptable**, je veux que le système repère les incohérences avant l'administration, afin de ne pas
déposer une déclaration qui sera rejetée.

## Critères d'acceptation

1. **Étant donné** une déclaration de TVA dont le montant est déclaré **quand** elle est contrôlée **alors** elle est
   rapprochée de ce que le moteur tire de la comptabilité pour la même période, dans la tolérance déclarée au paquet.
2. **Étant donné** un contrôle **quand** il s'exécute **alors** il n'utilise jamais une égalité stricte : la tolérance
   vient du paquet. Sans tolérance au paquet, le contrôle **ne s'exécute pas** et le dit.
3. **Étant donné** des acomptes d'impôt sur les sociétés **quand** ils sont contrôlés **alors** chacun est rapproché de
   l'acompte que le moteur tire du résultat de l'exercice précédent.
4. **Étant donné** un écart hors tolérance **quand** le contrôle s'exécute **alors** une anomalie bloquante est signalée
   (le dépôt est refusé tant qu'elle n'est pas corrigée ou levée en motivant) ; **quand** l'écart disparaît, elle est
   retirée.
5. **Étant donné** un cabinet A **quand** il contrôle une obligation **alors** il ne lit jamais les chiffres d'un dossier
   du cabinet B.

## Contrat annoncé avant le code (2026-11-25)

**Ajouts seuls.**

### Le paquet porte ses tolérances (`balance-service`, source du paquet)

- Bloc neuf **`coherence`** dans la source `scripts/referentiels/sources/paquet-fiscal-togo-2026.json` (et la zone
  franche) : `{ "tolerances": { "TVA": { "absolue": 1000 }, "IS_ACOMPTE": { "absolue": 1000 } }, "source": … }`, clés
  = codes du catalogue des obligations. Une tolérance : `absolue` (montant de la devise du paquet, ≥ 0) et, facultatif,
  `relative` (fraction ≥ 0 de l'attendu) ; l'écart admis est le plus grand des deux. Le schéma
  `paquet-fiscal.schema.json` le valide ; les artefacts se régénèrent par `build.mjs` (empreinte au manifeste du
  paquet). Les copies du fiscal (`test/fixtures/paquet-fiscal/`) suivent.

### Le contrôle (`prospera-fiscal-service`)

- **Quand** : à l'enregistrement du montant déclaré (`POST /obligations/{id}/montant-declare`, STORY-322), et sur
  demande : **`POST /api/v1/obligations/{id}/coherence`** (droit `fiscalite:declaration:preparer`, comme le déclaré) →
  `200 { controles: [{ code, statut: CONFORME | ECART | NON_EXECUTE, declare, attendu, ecart, tolerance, motif? }] }`.
  Une obligation sans contrôle applicable rend `controles: []`.
- **TVA** (`TVA`, période `AAAA-MM` ou `AAAA-Tn`) : l'attendu est le **montant à payer de la période** que sert le
  moteur, `GET {balance-service}/api/v1/dossiers/{dossierId}/fiscal/tva?periode=<mois de début>&exerciceDebut=&exerciceFin=`
  (bornes de la balance de référence de l'obligation, STORY-1117, sinon `exercice=<année>`), champ `aPayer` de la
  période.
- **Acompte d'IS** (`IS_ACOMPTE`, période `AAAA-En`) : l'attendu est le `theorique` de l'échéance de rang `n` de
  `GET …/fiscal/acomptes` ; `theorique: null` ⇒ `NON_EXECUTE`, avec le `motifTheorique` du moteur.
- **Règle** : `ecart = |declare − attendu|` ; `CONFORME` si `ecart ≤ max(absolue, relative × |attendu|)`, sinon `ECART`.
  `NON_EXECUTE` (motif nommé) : pas de déclaré, pas de tolérance au paquet (`TOLERANCE_ABSENTE`), moteur muet
  (`MOTEUR_INDISPONIBLE`, `MOTEUR_NON_LISIBLE` pour un `403`/`404`, `PERIODE_INCONNUE_DU_MOTEUR`). Jamais un calcul de
  taxe dans le fiscal (AD-1, AD-4) : il compare deux montants.
- **Anomalies** (patron de 328, `origine: 'SIGNALEE'`) : **`TVA_ECART_COMPTABILITE`** et **`ACOMPTE_ECART_RESULTAT_N1`**,
  `BLOQUANTE`, `bloque: ['A_DEPOSER']`, levables en motivant ; signalées par `AnomaliesObligationsService.signaler` avec
  l'empreinte du fait (`declare`, `attendu`, la balance de référence) ; retirées (`retirer`) quand le contrôle redevient
  `CONFORME`. Un `NON_EXECUTE` ne signale ni ne retire rien.
- Lecture avec le jeton de l'appelant (aucune identité machine) : `balance-service` applique sa portée (AC-5).

### Décisions prises au contrat (contestables)

- **D-326-1** : l'attendu de la TVA est celui du **moteur** (TVA collectée − déductible − crédit imputé, tirée de la
  comptabilité), pas un « chiffre d'affaires × taux » recalculé ici : la cohérence du chiffre d'affaires avec la TVA
  collectée (`coherenceTaux` du moteur) n'est servie que pour l'exercice entier ; elle revient au rapprochement annuel
  (STORY-1101).
- **D-326-2** : tolérance de travail **1 000 FCFA** pour la TVA et l'acompte d'IS (les arrondis de liquidation et de
  saisie), sans part relative ; valeur du paquet, donc modifiable sans code. À confirmer par un fiscaliste.
- **D-326-3** : bloquant au **dépôt** (`A_DEPOSER`), pas au visa : l'associé vise en voyant l'anomalie ; il ne dépose pas
  une déclaration que la comptabilité contredit sans l'avoir levée en motivant.
- **D-326-4** : l'acompte de TPU (`TPU_ACOMPTE`) n'est pas contrôlé ici (sa base n'est pas le résultat N-1) ; nommé pour
  une story suivante.
- **D-326-5** : quand le moteur écrira le calculé (STORY-321), le contrôle de la TVA rejoindra l'écart du triplet ; il
  restera la seule comparaison **avec tolérance**.
