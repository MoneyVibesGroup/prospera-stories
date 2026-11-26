# STORY-321 : Le calcul délégué au moteur de `balance-service` — le calculé vient du moteur, jamais d'ici

Status: in-progress — écrite le 2026-11-26 par la session du groupe C juste avant de la coder (lot 7, n° 5 du fiscal,
`PLAN-LOT-7-2026-11-24.md` §3) ; contrat annoncé avant le code (« ⚠ Contrats » et « ⚠ Communs » du journal de C).
Il n'existait pas de fiche : les critères viennent de `epics-fiscalite-2026-08-03.md` (EPIC-031, STORY-321).

**Epic :** EPIC-031 · **Points :** 5 · **FR :** FR-F23 · **Architecture :** AD-1 (le noyau ne calcule aucun impôt), AD-4
(jamais un zéro à la place d'un montant), AD-14 (l'origine d'une balance n'est jamais lue), AD-17 (les champs humains
survivent à la re-dérivation)
**Service :** `prospera-fiscal-service` (dossier `obligations`, à C ; fichiers communs nommés plus bas).
`balance-service` est **lu seulement** : aucune PR de code chez lui (D-321-1).
**Après :** STORY-320 (les bases : la balance qui fonde l'obligation, #55) et STORY-322 (le triplet, #56), livrées par A au
lot 6 ; STORY-326 (le port du moteur fiscal, `SourceMoteurFiscal`, #59) et STORY-1117 (la balance de référence, #161), de C.
**Suite :** STORY-340 (le montant à régler, net d'acomptes) ; STORY-328 lit déjà `triplet.calcule.indisponible`.

## Histoire

En tant qu'**équipe plateforme**, je veux que le calcul reste au seul endroit qui en a la charge, afin qu'aucun second
moteur fiscal ne diverge. *(FR-F23, AD-1)*

## Critères d'acceptation (`epics-fiscalite-2026-08-03.md`, EPIC-031)

1. **Étant donné** une déclaration à chiffrer **quand** le montant est produit **alors** il provient du moteur de
   `balance-service`, consommé par un port.
2. **Étant donné** le code du domaine **quand** on le fouille **alors** aucune règle d'imposition n'y est implémentée.
3. **Étant donné** `balance-service` indisponible **quand** une préparation est tentée **alors** l'échec est explicite et
   retentable, sans montant partiel enregistré.

## Ce que le code porte déjà (lu sur `origin/dev`, fiscal `0cc79a7` ; balance-service `44be0c1`)

| Pièce | Ce qu'elle porte | Où |
|---|---|---|
| `montantAttendu` | toujours `null` ; **remis à `null` par chaque dérivation** (`$set`) | `obligation.schema.ts`, `mongo-registre-obligations.ts` |
| Le triplet (322) | le calculé lit `montantAttendu` (origine `MOTEUR`), sinon `montantSaisi` (`SAISI_CABINET`), sinon indisponible nommé (`CALCUL_DELEGUE_NON_DISPONIBLE`, `MONTANT_A_SAISIR`, `SANS_MONTANT`) ; figé sur le déclaré au visa (`calculeFige`) | `domain/obligations/triplet.ts` |
| Les bases (320, 1117) | à la prise en charge, la balance de référence du dossier à la date de la période : `basesFiscales.source { balanceId, version, etat, statutPreuve, checksum, exercice }` ; bloquées ⇒ `409 BASES_FISCALES_BLOQUEES` ; amont injoignable ⇒ `503`, rien d'écrit | `bases-obligations.service.ts` |
| Le port du moteur (326) | `SourceMoteurFiscal.tvaAPayer(dossier, 'AAAA-MM', exercice)` (`GET …/fiscal/tva`, `aPayer` de la période) et `acompte(dossier, rang, exercice)` (`GET …/fiscal/acomptes`, `theorique`) ; refus nommés (`MOTEUR_INDISPONIBLE`, `MOTEUR_NON_LISIBLE`, `MOTEUR_REPONSE_INVALIDE`, `PERIODE_INCONNUE_DU_MOTEUR`), jamais une exception ; jeton de l'appelant | `ports/source-moteur-fiscal.ts`, `HttpSourceMoteurFiscal` |
| Le moteur de la balance | par dossier et par exercice : `GET /dossiers/{id}/fiscal/tva?periode=`, `…/acomptes`, `…/tpu` (`tpuDue`, `balance { id, version }`), `…/liquidation`, `…/moteur` ; un paramétrage insuffisant est un `409` nommé, jamais un zéro | `balance-service`, `modules/fiscal` |
| Le catalogue Togo 2026 | `TVA` (mensuelle), `IS_ACOMPTE` (`AAAA-En`), `TPU` (annuelle, synthétique), `TPU_ACOMPTE`, `TAF`, `TCA`, `RSH` (familles calculables) ; `DSF`, `IRPP_DECLARATION` (sans montant) | copie du paquet |

## Contrat annoncé avant le code (2026-11-26)

**Ajouts seuls**, plus deux précisions de comportement (la prise en charge chiffre ; un `409` du moteur se nomme). Aucun
champ, aucune route, aucun code renommé ; aucun droit neuf ; aucun événement ; manifeste `declarations` inchangé ;
**rien d'écrit chez `balance-service`**.

### Ce que le fiscal demande au moteur (AC-1, D-321-2)

| Obligation | Période | Lecture du moteur (jeton de l'appelant) | Le calculé |
|---|---|---|---|
| `TVA` | `AAAA-MM` ; `AAAA-Tn` → son mois de début | `GET {balance}/api/v1/dossiers/{dossierId}/fiscal/tva?periode=AAAA-MM&exerciceDebut=&exerciceFin=` (lu depuis 326) | `aPayer` de la période |
| `IS_ACOMPTE` | `AAAA-En` | `GET …/fiscal/acomptes?exerciceDebut=&exerciceFin=` (lu depuis 326) | `theorique` de l'échéance de rang `n` |
| `TPU` | `AAAA` | **`GET …/fiscal/tpu?exerciceDebut=&exerciceFin=`** (neuf pour le fiscal) | `tpuDue` (la TPU due de l'exercice, avant les acomptes : le net est STORY-340) |
| `TAF`, `TCA`, `RSH`, `TPU_ACOMPTE`, toute autre forme de période | — | **aucun appel** | indisponible : `TAXE_NON_CALCULEE_PAR_LE_MOTEUR` |

L'exercice demandé est **celui de la balance des bases** (`basesFiscales.source.exercice`, D-320-1 : « par cette
référence ») ; ne sont chiffrées que les obligations **de l'entreprise**, d'une famille calculable, qui ne sont ni « à
saisir » (314) ni sans montant (DSF).

### Quand (D-321-3)

- **À la prise en charge** (`POST /obligations/{id}/transition`, `A_PREPARER → EN_PREPARATION`) : après les bases, si
  elles ne sont pas bloquées ; le constat du calcul part dans **la même transaction** que la transition et les bases.
- **Sur demande** : **route neuve `POST /api/v1/obligations/{id}/calcul`** (sans corps, droit
  `fiscalite:declaration:preparer`) → `200` l'obligation. Permise de `EN_PREPARATION` à `A_VALIDER`.
- **Jamais après le visa** : à partir de `VALIDEE`, `409 CALCUL_NON_ACTUALISABLE` (le calculé est **figé au visa** ; 322
  le fige aussi sur le déclaré, `calculeFige`). Avant la prise en charge : le même `409` (« prenez-la en charge »).
- `POST /obligations/{id}/bases` **ne recalcule pas** (inchangé, 320) : on revérifie les bases, puis on recalcule.

Refus de la route : `403 DROIT_FISCAL_REFUSE`, `404 OBLIGATION_INTROUVABLE` (même réponse hors portée), `409`
`OBLIGATION_DESACTIVEE`, `OBLIGATION_BLOQUEE` (redevable bloqué), **`CALCUL_NON_DELEGUE`** (une obligation que le moteur
ne chiffre pas : taxe hors du tableau, à saisir, sans montant, redevable personne physique), **`CALCUL_NON_ACTUALISABLE`**,
`TRANSITION_CONCURRENTE` ; **`503 SERVICE_AMONT_INDISPONIBLE`** (rien n'est écrit).

### Quand le moteur ne rend pas de montant (AC-3, D-321-4, D-321-5)

| Ce que rend le moteur | Prise en charge | `POST …/calcul` |
|---|---|---|
| un montant (entier ≥ 0) | `CALCULE`, `montantAttendu` = le montant | idem |
| injoignable, délai, `429`, `5xx` | la transition passe ; constat `INDISPONIBLE` **`MOTEUR_INDISPONIBLE`** (retentable par la route), aucun montant | **`503`, rien n'est écrit** (le calcul précédent reste) |
| `403` / `404` | `INDISPONIBLE` `MOTEUR_NON_LISIBLE` | idem |
| `409` (paramétrage insuffisant du dossier) | `INDISPONIBLE` **`MOTEUR_PARAMETRAGE_INSUFFISANT`**, avec le code du moteur (`motifMoteur`) | idem |
| réponse hors forme, montant non entier ou négatif | `INDISPONIBLE` `MOTEUR_REPONSE_INVALIDE` | idem |
| période absente de la réponse | `INDISPONIBLE` `PERIODE_INCONNUE_DU_MOTEUR` | idem |
| `theorique: null` (acompte) | `INDISPONIBLE` `ATTENDU_INDISPONIBLE`, avec le `motifTheorique` du moteur | idem |
| (bases bloquées ou absentes, recalcul seulement) | — (la prise en charge est refusée, 320) | `INDISPONIBLE` **`BASES_NON_EXPLOITABLES`**, le moteur n'est pas lu |

Un constat `INDISPONIBLE` remet `montantAttendu` à `null` : un constat est celui **de la dernière tentative** (comme les
bases, D-320-13). **Jamais un montant inventé** : ni zéro, ni montant partiel, ni calcul local.

### Champs neufs (ajouts)

- **`ObligationResponseDto.calculMoteur`** (facultatif, `null` tant qu'aucun calcul n'a été demandé) :
  ```
  { statut: 'CALCULE' | 'INDISPONIBLE',
    montant: number | null,                // non nul si CALCULE
    motif: 'MOTEUR_INDISPONIBLE' | 'MOTEUR_NON_LISIBLE' | 'MOTEUR_PARAMETRAGE_INSUFFISANT' | 'MOTEUR_REPONSE_INVALIDE'
         | 'PERIODE_INCONNUE_DU_MOTEUR' | 'ATTENDU_INDISPONIBLE' | 'BASES_NON_EXPLOITABLES' | null,
    motifMoteur: string | null,            // le code du 409 ou le motifTheorique du moteur, tel qu'il le nomme
    message: string | null,                // en clair, ce qu'il faut faire (INDISPONIBLE)
    demande: { ressource: 'TVA' | 'IS_ACOMPTE' | 'TPU', periode: string | null, rang: number | null,
               exercice: { debut, fin } },
    bases: { balanceId, version, etat, statutPreuve, checksum } | null,   // la balance des bases au moment du calcul
    balanceDuMoteur: { id, version } | null,                              // celle que le moteur dit avoir lue (TPU)
    calculeLe: ISO, par: userId }
  ```
- **`montantAttendu`** : désormais **écrit** par le calcul (le montant si `CALCULE`, sinon `null`). Sa description change.
- **`triplet.calcule.motif`** (nouveau, `string | null`) : quand le calculé est indisponible, le code précis —
  `TAXE_NON_CALCULEE_PAR_LE_MOTEUR`, `NON_ENCORE_CALCULE` (pas encore demandé), ou le `motif` du constat ; `null` sinon.
  `triplet.calcule.indisponible` garde ses trois valeurs (`CALCUL_DELEGUE_NON_DISPONIBLE` couvre tout ce qui vient du
  moteur) ; `message` dit quoi faire. `triplet.calcule.source` d'un calculé `MOTEUR` = `calculMoteur.bases` (la balance
  sur laquelle le calcul a été demandé).
- **Comportement de 326** : un `409` du moteur rend le contrôle de cohérence `NON_EXECUTE` avec le motif
  `MOTEUR_PARAMETRAGE_INSUFFISANT` (avant : `MOTEUR_REPONSE_INVALIDE`).
- **Journal chaîné** : acte neuf **`OBLIGATION_CALCUL_CONSTATE`** (`obligation:<id>` : `statut`, `montant`, `precedent`,
  `motif`, `ressource`, `balanceId`, `version`), dans la transaction de l'écriture.
- **→ A et D (écrans, FE-081)** : types à régénérer ; afficher le calculé du moteur et sa balance ; quand
  `triplet.calcule.motif` est non nul, le `message` tel quel, et le bouton « Recalculer » (`POST …/calcul`) de
  `EN_PREPARATION` à `A_VALIDER`.

### Persistance et fichiers communs (D-L7-2)

- **Aucune migration** : `calculMoteur` est un champ neuf de `obligations` (absent ⇒ `null`) ; `montantAttendu` existe
  déjà (`null` partout). **La dérivation cesse de le remettre à `null`** : il passe de `$set` à `$setOnInsert` (AD-17).
- Communs touchés : **le contrat OpenAPI** seul (une route, deux champs). Ni `app.module.ts`, ni `package.json`, ni
  `read-models/`, ni migration, ni copie du paquet, ni manifeste. Transverse : `adapters/http/lecture-amont.ts` gagne un
  traitement **facultatif** du `409` (un appelant qui ne le demande pas garde son comportement). Rien dans les dossiers
  de D.

## Décisions prises au contrat (contestables)

- **D-321-1 — Le fiscal demande au moteur ; la correspondance obligation → lecture reste ici, `balance-service` n'est pas
  touché.** D-322-1 recommandait une route « un calcul par obligation » côté balance. Retenu autrement : cette
  correspondance n'est pas une règle d'imposition (elle dit *quel chiffre déjà calculé par le moteur répond à cette
  obligation*), STORY-326 l'a déjà écrite (`objetDuControle`) et lue (`SourceMoteurFiscal`) ; une route de plus chez la
  balance la doublerait, changerait son contrat et son manifeste (recopie au catalogue par B). Une seule PR de code. Si
  la balance publie un jour une telle route, seul l'adaptateur change.
- **D-321-2 — Ce que le moteur chiffre : TVA, acompte d'IS, TPU.** La TPU se lit sur `tpuDue` (après plancher et
  exonération, avant les acomptes versés : le montant à régler net d'acomptes est STORY-340). `TAF`, `TCA`, `RSH` et
  `TPU_ACOMPTE` : le moteur n'a pas de surface qui les rende ; ils restent indisponibles, nommés
  `TAXE_NON_CALCULEE_PAR_LE_MOTEUR`, sans appel. Les ouvrir est une story de `balance-service` (à nommer).
- **D-321-3 — Le point d'ancrage est la prise en charge, et le calculé se fige au visa.** Prise en charge : bases puis
  calcul, une transaction. Recalcul à la demande de `EN_PREPARATION` à `A_VALIDER` ; à partir de `VALIDEE`, refus
  (`CALCUL_NON_ACTUALISABLE`) : ce que l'associé a visé ne bouge plus. La route des bases ne recalcule pas (320 inchangée).
- **D-321-4 — Le moteur injoignable : explicite et retentable, jamais un montant.** À la prise en charge, la transition
  passe (les bases ont été lues chez le même service) et le constat dit `MOTEUR_INDISPONIBLE` : le cabinet commence sa
  préparation et recalcule quand le moteur répond. Sur la route de recalcul : `503`, rien d'écrit. Si la balance entière
  est injoignable, les bases lèvent déjà `503` à la prise en charge (D-320-9) : rien n'est écrit.
- **D-321-5 — Un montant indisponible se nomme.** Les motifs du tableau ci-dessus ; du `409` du moteur, seul son `code`
  est recopié (`^[A-Z][A-Z0-9_]{2,63}$`, sinon `null`) : ni message ni corps (règle de 537). Un montant qui n'est pas un
  entier ≥ 0 n'est pas arrondi ici : `MOTEUR_REPONSE_INVALIDE`.
- **D-321-6 — Le constat est un champ humain, `montantAttendu` le suit.** `calculMoteur` et `montantAttendu` s'écrivent
  ensemble, par comparaison-échange sur l'état lu ; une re-dérivation ne touche ni l'un ni l'autre. Un calculé du moteur
  sur une obligation devenue « à saisir » par une re-dérivation n'est plus lu par le triplet.
- **D-321-7 — Audit.** `OBLIGATION_CALCUL_CONSTATE`, montant compris (c'est le chiffre de l'entreprise, aucune donnée
  personnelle) ; à la prise en charge, après `OBLIGATION_TRANSITION` et `OBLIGATION_BASES_CONSTATEES`, inchangés.
- **D-321-8 — La balance du calcul est dite, jamais comparée.** La référence des bases est la balance de clôture
  (D-1117-1, provisionnée comprise) ; le moteur calcule sur sa propre base. `calculMoteur.bases` dit sur quelles bases le
  calcul a été demandé, `balanceDuMoteur` ce que le moteur dit avoir lu (TPU). L'origine n'est jamais lue (AD-14).
- **D-321-9 — AC-2 exécutable : une garde par l'AST.** `src/garde-calcul-delegue.spec.ts` : la chaîne des obligations
  (`domain/obligations`, `application/obligations`, `modules/obligations`, leurs adaptateurs) n'importe aucune stratégie
  de calcul de `domain/familles` (seulement `famille-calcul`, pour ses listes de familles) et n'appelle aucun `calculer` ;
  `montantAttendu` ne reçoit de valeur qu'en un endroit (le constat du calcul). **Écart nommé** : `domain/familles`
  (AD-2, STORY-310 → 313, 564) porte des formes de calcul paramétrées par le paquet, qu'emploie le calcul social de D
  (AD-20) ; aucune n'alimente le calculé d'une obligation. La tension AD-1 / AD-2 est dans l'architecture, pas créée ici.
- **D-321-10 — La cohérence (326) ne change pas de logique.** Elle relit toujours le moteur (son rapprochement avec le
  triplet, D-326-5, reste une suite) ; seul le motif d'un `409` se précise.
- **D-321-11 — Aucun droit neuf, aucun événement, manifeste inchangé** ; aucun recalcul sur `balance.validated` (comme
  D-320-13 : le cabinet recalcule).

## Hors périmètre

`TAF`, `TCA`, `RSH`, `TPU_ACOMPTE` au moteur (balance-service) ; le montant net d'acomptes (340) ; la cohérence lue sur le
triplet (suite de 326) ; une alerte « à recalculer » quand les bases changent (le triplet expose déjà les deux balances) ;
l'écran (FE-081).

## Preuves attendues

Unitaires (`-w 2`, Node 24, étage `verification`) du domaine (correspondance, constat et ses motifs, gardes d'état), du
service (ordre des vérifications, aucun appel au moteur sur un refus, `503` sans écriture), de l'adaptateur (`fetch`
simulé : `…/fiscal/tpu`, `409` nommé avec son code) et de la garde AST ; `test:conformite` sur `mongo` en jeu de répliques
(calcul et audit dans la même transaction, comparaison-échange, une re-dérivation n'efface ni `calculMoteur` ni
`montantAttendu`, la prise en charge pose état, bases et calcul ensemble) ; e2e ; mutations qui rougissent sur
l'assertion ; `docker compose up` du service (§1.5 : le module des obligations change), sain, la route neuve en `401` sans
jeton. Pas de preuve Kafka (aucun événement).

## Progress Tracking

| Date | Événement |
|---|---|
| 2026-11-26 | Fiche écrite, contrat et communs annoncés (PR de docs) avant le code. |
