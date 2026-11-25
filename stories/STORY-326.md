# STORY-326 : Les contrôles de cohérence d'une période, avec des tolérances lues au paquet

Status: done — **livrée le 2026-11-25** : balance-service **#162** (`8b154df` sur `dev`, le paquet) et
prospera-fiscal-service **#59** (`2aed546` sur `dev`, le contrôle) ; voir « Livraison ». Écrite le 2026-11-25 par la
session du groupe C juste avant de la coder (lot 6) ; contrat #857 avant le code.

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

### Livraison (2026-11-25)

- **balance-service** (#162) : bloc `coherence` dans la source du paquet Togo 2026 et dans son schéma ; artefact
  régénéré par `build.mjs`, empreinte **`e223056938cab1df7938fa7358d05965d6440d5101eaabf5b8eb4a062645ea21`** au registre
  (`paquet-fiscal-registry.ts`, « seizième fois ») ; la surcouche zone franche en hérite (son empreinte ne bouge pas).
- **fiscal** (#59) : `domain/obligations/coherence.ts` (règle pure), port `SourceMoteurFiscal` et adaptateur
  `HttpSourceMoteurFiscal` (`contrat-moteur-fiscal.ts`), `CoherenceObligationsService`, route
  `POST /api/v1/obligations/{id}/coherence`, deux codes au catalogue des anomalies (6 au lieu de 4), copie du paquet
  dans `test/fixtures/paquet-fiscal/`. Codé par une sous-session ; paquet, revue, preuves et gate par C.
- **Preuves** (Node 24) : balance-service unitaires **5552** (2 suites lentes rejouées seules, 46/46), e2e **36/36
  suites, 1973** ; fiscal unitaires **2602** (2 suites lentes rejouées seules, 51/51), e2e **11/11 suites, 216** (dont 8
  neufs : écart, levée, rouverture, retrait, acompte, tolérance absente, moteur muet, 403/404, jeton de l'appelant) ;
  mutation **6/6** (égalité stricte, tolérance absente prise pour conforme, écart qui ne signale pas, conforme qui ne
  retire pas, `theorique: null` pris pour 0, 403 amont devenu 5xx) ; gate `grp-c` (`docker compose up` de
  balance-service et fiscal-service depuis l'archive de leurs branches) : les deux `healthy`, sans redémarrage ; la route
  neuve et les trois routes du moteur lues par le fiscal répondent `401` sans jeton depuis le conteneur du fiscal.
- `test:conformite` non rejoué : aucun adaptateur Mongo ne change (le signalement est celui de 328, déjà prouvé sur un
  vrai Mongo).

### Écarts au contrat, décidés au code

- **D-326-6** : motifs de `NON_EXECUTE` ajoutés : `DECLARE_ABSENT`, `MOTEUR_REPONSE_INVALIDE` (réponse amont hors forme,
  un 400 ou un 500 compris), `ATTENDU_INDISPONIBLE` (`theorique: null` sans motif ; avec motif, celui du moteur).
- **D-326-7** : la version du paquet de l'obligation n'est plus octroyée ⇒ `TOLERANCE_ABSENTE`, pas une erreur.
- **D-326-8** : une panne du contrôle à l'enregistrement du déclaré est journalisée ; la réponse reste celle de
  l'enregistrement (avec l'anomalie posée ou retirée, si elle l'a été).
- **D-326-9** : le signalement est fait par `systeme:coherence` ; empreinte `sha256(code | déclaré | attendu |
  balanceId@version)`.
- **D-326-10** : sous dérogation, le paquet de l'obligation est la surcouche seule : `PaquetsService` charge la version
  exacte et la base, la tolérance se lit sur le paquet effectif (le bloc `coherence` survit à la fusion, prouvé).
- **D-326-11** : la périodicité de la TVA n'est pas passée au moteur : le paquet Togo ne publie que `MENSUELLE`. Un
  paquet qui publiera une périodicité trimestrielle devra la passer (sinon un faux écart).
- **D-326-12** : l'exercice demandé au moteur : les bornes de la balance de référence, sinon l'année de l'obligation.
- **D-326-13** : **le paquet publié sur MinIO** (bucket `referentiel-packages`, lu par le fiscal hors des tests) doit
  être republié pour porter le bloc ; tant qu'il ne l'est pas, le contrôle rend `NON_EXECUTE` `TOLERANCE_ABSENTE`
  (dégradation sûre, jamais un faux conforme). La copie de `dossier-service` diverge de la source, sans effet sur lui.

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
