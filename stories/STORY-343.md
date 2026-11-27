# STORY-343 : La distinction entre « déposée » et « payée »

Status: in-progress — écrite le 2026-11-27 par la session du groupe C juste avant de la coder (lot 7, n° 15 du fiscal,
`PLAN-LOT-7-2026-11-24.md` §3) ; contrat et communs annoncés avant le code (« ⚠ Contrats » et « ⚠ Communs » du journal de
C). Il n'existait pas de fiche : les critères viennent de `epics-fiscalite-2026-08-03.md` (EPIC-033, STORY-343), du PRD
fiscalité (FR-F49 : « Le système distingue explicitement « déposée » et « payée », et met en évidence les obligations
déposées mais non réglées » ; §3.3 « Le règlement n'est pas le dépôt ») et de ce que STORY-342 a nommé pour elle
(D-342-9, D-342-14).

**Epic :** EPIC-033 · **Points :** 3 · **FR :** FR-F49 · **Architecture :** AD-9 (la version scellée fait foi), AD-10 (le
journal chaîné, les textes par leur empreinte), AD-17 (un champ humain ne se récrit pas par le système) · **PRD** §3.3 :
« Prospera prépare, rapproche et prouve ; il n'exécute pas. »
**Service :** `prospera-fiscal-service` (dossiers `reglement` et `obligations`, à C par D-L7-1 ; communs nommés plus bas).
Le paquet fiscal n'est pas touché (la demande `automatisation` de D, 561, attend la prochaine story de C qui le touche, au
plus tard 344).
**Après :** STORY-342 (`RapprochementReglementService`, la collection `reglements_rapproches`), 340 (le montant à régler),
341 (l'ordre), 325 (la version scellée), 323 (le cycle), 315 (le calendrier du portefeuille), 318 (l'état d'échéance).
**Suite :** STORY-344 (les pénalités : elle lit le retard des règlements **non annulés**) ; **565 de D** (l'ordre
transporté : net des seuls règlements non annulés, et des acomptes rapprochés pour la TPU) ; l'écran du calendrier (A).

## Histoire

En tant qu'**expert-comptable**, je veux voir immédiatement ce qui est déposé mais non payé, afin de corriger la croyance
« j'ai déclaré donc c'est fini ». *(FR-F49)*

## Critères d'acceptation (`epics-fiscalite-2026-08-03.md`, EPIC-033)

1. **Étant donné** une obligation déposée sans règlement rapproché **quand** j'ouvre le calendrier **alors** elle est mise
   en évidence.
2. **Étant donné** les deux états **quand** on les consulte **alors** « déposée » et « payée » sont distincts et ne se
   déduisent jamais l'un de l'autre.

Et, nommés par STORY-342 pour celle-ci : « Payée » reste un **acte humain** — le rapproché ne fait jamais passer seul une
obligation à « Payée », il peut le proposer ou le constater (565 AC-6, PRD §8 étape 7) ; l'**annulation motivée** d'un
rapprochement saisi par erreur (D-342-14, 1) ; l'**acompte réglé par une quittance** que la TPU ne lit pas encore comme
payé (D-342-14, 6) ; `montant-paye` et les transitions de paiement sous `regler` **une fois B servi** (D-342-9).

## Ce que le code porte déjà (lu sur `origin/dev`, fiscal `6cd99ee`)

| Pièce | Ce qu'elle porte | Où |
|---|---|---|
| Le calendrier du portefeuille (315, 317, 318) | une page de lignes : échéance applicable et légale, `etatEcheance` (`DEPOSEE` pour **tout** ce qui a atteint « Déposée », « Payée » comprise), `statut` du cycle | `application/obligations/calendrier-portefeuille.service.ts`, `domain/obligations/alertes-echeance.ts` |
| Le cycle (323) | `… → Déposée → Accusé reçu → À payer → Payée → Clôturée`, séquentiel ; « À payer » et « Payée » sous `preparer` | `domain/obligations/cycle.ts`, `application/obligations/droits-du-cycle.ts` |
| La version scellée (325) | le dépôt scelle la version courante (`versionCourante.versionId`) dans la transaction de l'état ; une rectificative ou un rejet ouvre la n + 1, non scellée | `domain/obligations/version-declaration.ts` |
| Le rapprochement (342) | `reglements_rapproches`, immuable ; `rapprocher`, `deLObligation` ; le montant à régler et l'ordre nets du rapproché | `domain/reglement/reglement-rapproche.ts`, `RapprochementReglementService` |
| Le montant à régler (340) | la TPU déduit les **payés saisis** des `TPU_ACOMPTE` de l'année (`ACOMPTE_SANS_PAIEMENT_ENREGISTRE` sinon) | `domain/reglement/montant-a-regler.ts` |

**Ce qui manque** : le calendrier ne dit pas si une obligation déposée est réglée — son seul état, `DEPOSEE`, vaut pour la
déposée impayée comme pour la payée : c'est exactement la croyance que la story corrige. Rien ne défait un rapprochement
saisi par erreur. Un acompte réglé par quittance, sans payé saisi, laisse la TPU incomplète.

## Contrat annoncé avant le code (2026-11-27)

**Ajouts** : trois champs à chaque ligne du calendrier du portefeuille, une route d'écriture (l'annulation), une collection,
un acte au journal, un champ à chaque règlement rapproché, deux champs à la lecture des règlements, un champ à la provenance
d'une imputation et un code de manque. **Deux comportements changent** : un règlement annulé ne compte plus (montant à
régler, ordre, reste) ; un acompte rapproché compte pour la TPU. Aucun événement ; aucun champ existant ne disparaît ; le
paquet ne change pas.

### `GET /api/v1/obligations/calendrier` — chaque ligne gagne trois champs (AC-1, AC-2)

```
deposee: boolean   — la version courante est scellée (le dépôt, 325) ; jamais lu du paiement
payee:   boolean   — l'acte humain : le cycle a atteint « Payée » ; jamais lu du dépôt ni du rapproché
reglement: {
  etat: NON_DEPOSEE | SANS_MONTANT | RIEN_A_REGLER | DEPOSEE_SANS_REGLEMENT | REGLEMENT_PARTIEL | RESTE_A_RELIRE
        | REGLEE_A_CONFIRMER | PAYEE,
  miseEnEvidence: boolean,            — déposée, non payée, et rien ne la règle entièrement (★ ci-dessous)
  rapproche: entier ≥ 0, nombre: entier ≥ 0,   — les règlements rapprochés NON annulés
  reste: entier ≥ 0 | null,           — null : rien de rapproché, ou un dû lu sur une autre version
  proposition: PASSER_A_PAYEE | null, — le rapproché couvre le dû : « Payée » peut être posée, par un humain
  chemin: "/api/v1/obligations/{id}/reglements"
}
```

| `etat` | Quand | Mise en évidence |
|---|---|---|
| `PAYEE` | le cycle a atteint « Payée » (l'acte humain fait foi, avec ou sans quittance : `nombre` le dit) | non |
| `NON_DEPOSEE` | la version courante n'est pas scellée | non |
| `SANS_MONTANT` | déposée, d'une famille sans montant (`DECLARATIVE`) | non |
| `RIEN_A_REGLER` | déposée, déclaré 0, rien de rapproché | non |
| `DEPOSEE_SANS_REGLEMENT` | déposée, non payée, **aucun règlement rapproché** (AC-1) | **★** |
| `REGLEMENT_PARTIEL` | déposée, non payée, des règlements rapprochés et un reste > 0 | **★** |
| `RESTE_A_RELIRE` | déposée, non payée, rapprochée sur une version antérieure (rectificative déposée depuis) | **★** |
| `REGLEE_A_CONFIRMER` | déposée, non payée, le rapproché couvre le dû : `proposition: PASSER_A_PAYEE` | non |

`etatEcheance` (318) ne change pas. La vue de charge (319) ne change pas (elle écarte les déposées).

### `POST /api/v1/obligations/{id}/reglements/{reglementId}/annulation` — annuler un rapprochement (D-342-14, 1)

Rôles `TENANT_ADMIN`, `TENANT_USER`, accès fiscal, droit **`fiscalite:declaration:regler`** (`403 DROIT_FISCAL_REFUSE`,
journalisé) ; portée de l'obligation (`404 OBLIGATION_INTROUVABLE`). Corps `{ motif }` (3 à 500 caractères, sans caractère
invisible, comme le motif d'une rectificative). Réponse **`201`** : le règlement rapproché, avec
`annulation: { motif, annulePar, annuleLe }`. Refus : `404 REGLEMENT_INTROUVABLE` (pas un règlement de cette obligation) ;
`409 REGLEMENT_DEJA_ANNULE` ; `409 OBLIGATION_CLOTUREE` ; `400` (motif). La pièce reste, son rang aussi ; l'acte
**`OBLIGATION_REGLEMENT_ANNULE`** entre au journal chaîné de l'obligation dans la même transaction (le motif par son
empreinte, son texte hors du journal, comme en 329). Ni le payé du triplet ni le cycle ne changent.

### Les règlements rapprochés (342)

- Chaque règlement (`POST …/reglements`, `GET …/reglements`) gagne **`annulation: { motif, annulePar, annuleLe } | null`**.
- `GET …/reglements` : `rapproche`, `reste`, `ecartPaye` ne comptent que les règlements **non annulés** ; gagne
  **`annules`** (le nombre d'annulés) ; `reglements[]` les rend tous, par rang.
- `POST …/reglements` : le reste et `MONTANT_SUPERIEUR_AU_RESTE` ne comptent que les non-annulés ; **la quittance d'un
  rapprochement annulé se rapproche de nouveau** (sur la même obligation ou une autre du dossier) ; le rang continue.

### Le montant à régler (340) et l'ordre (341)

- `rapproche` (et donc `aRegler`, `PAYE_DIFFERENT_DU_RAPPROCHE`, `montant.dejaRegle` de l'ordre, `RIEN_A_REGLER`) ne compte
  que les règlements **non annulés**.
- **Un acompte rapproché compte pour la TPU** : chaque provenance d'une imputation déduite gagne
  **`rapproche: { montant, nombre } | null`** ; le montant déduit d'un acompte est le plus grand de son payé saisi et de
  son rapproché (le même argent, jamais additionné) ; ni l'un ni l'autre ⇒ `ACOMPTE_SANS_PAIEMENT_ENREGISTRE` (inchangé) ;
  les deux et différents ⇒ manque neuf **`ACOMPTE_PAYE_DIFFERENT_DU_RAPPROCHE`** (le montant est incomplet, aucun ordre).

### Le droit des transitions de paiement (D-342-9)

Relu au journal de B (« Réponses ») juste avant le push. **Demande « k » servie** (auth-service attribue
`fiscalite:declaration:regler` à `CAB_ASSOCIE` et `CAB_COLLABORATEUR`) : `POST …/montant-paye` et les transitions vers
« À payer » et « Payée » passent sous **`regler`** (et le retour qui quitte « À payer » ou « Payée », par la règle de 325).
**Pas servie** : elles restent sous `preparer`, et la fiche le dit.

## Persistance et fichiers communs (D-L7-2)

**Aucune migration** : la collection neuve **`annulations_reglements`** (dossier de C) a ses index posés par Mongoose au
démarrage — `(orgId, reglementId)` unique, `(orgId, dossierId, referenceBase)` ; elle est **immuable** (`rendreImmuable`).
`reglements_rapproches` ne change ni de schéma ni d'index (D-343-6). Communs touchés dans le fiscal : **le contrat OpenAPI**
(la ligne du calendrier, la route neuve, les règlements, la provenance) ; **`src/common/rbac/droits-fiscalite.ts`**
seulement si la bascule a lieu (son commentaire). Tout le reste dans des dossiers de C : `domain/reglement`,
`domain/obligations` (la situation du règlement d'une ligne ; le libellé de l'acte, `historique.ts`),
`application/reglement`, `application/obligations` (`CalendrierPortefeuilleService` gagne une dépendance : la lecture des
règlements rapprochés ; `droits-du-cycle.ts` si la bascule a lieu), `modules/reglement`, `modules/obligations`
(`ObligationsModule` enregistre en lecture les deux collections du règlement, comme `ObligationEnBase` l'est deux fois :
il ne peut pas importer `ReglementModule`, qui l'importe), `ports`, `adapters/mongo`, `test/` (doubles, conformité, e2e).
**`MontantAReglerService`** garde son constructeur et ses signatures, mais **ce qu'il lit change** (les annulations, les
rapprochés des acomptes) : **→ D (565)**. `OrdreDeReglementService` inchangé. Aucune classe instanciée par `DepotsModule`
ne change. Ni `app.module.ts`, ni `package.json`, ni `read-models/`, ni `config/`, ni la copie du paquet. La garde FR-F47
passe **sans modification** (l'annulation ne paie pas, son nom non plus).

## Décisions (D-343-n) — prises le 2026-11-27, contestables

- **D-343-1 — « Déposée » et « payée » : deux faits, deux lectures, jamais l'une de l'autre** (AC-2). **Déposée** : la
  version courante est scellée — le dépôt la scelle dans la transaction de l'état (325) ; une rectificative ouverte ou un
  rejet consigné ouvre la n + 1, non scellée : l'obligation n'est plus « déposée ». Une obligation antérieure à 325, sans
  pointeur de version, n'a pas d'autre témoin de son dépôt que le cycle (≥ « Déposée ») : c'est lui qu'on lit, pour elle
  seule. **Payée** : l'acte humain, le cycle qui a atteint « Payée » (une transition, sous son droit). Ni le dépôt, ni le
  règlement rapproché, ni le payé saisi au triplet ne font « payée » ; « payée » ne fait pas « déposée ».
- **D-343-2 — La mise en évidence est un champ de la ligne, calculé à la lecture** (AC-1, FR-F49 « déposées mais non
  réglées »). `reglement.miseEnEvidence` : déposée, non payée, d'une famille à montant, et rien ne la règle entièrement
  (aucun règlement, un reste, ou un reste à relire). `RIEN_A_REGLER` ne l'est pas (un déclaré nul) ; `REGLEE_A_CONFIRMER`
  non plus (le règlement est là, l'acte humain manque : il est proposé). Rien n'est stocké ; aucun filtre neuf (D-343-9).
- **D-343-3 — Le rapproché propose, l'humain pose « Payée ».** `REGLEE_A_CONFIRMER` porte `proposition: PASSER_A_PAYEE` ;
  aucune transition n'est jamais faite par le système, et la garde « aucune capacité de paiement » reste verte sans
  changer. Une obligation payée sans quittance rapprochée est `PAYEE` (l'acte humain fait foi) et `nombre: 0` le constate.
- **D-343-4 — Le reste au calendrier, sans recalculer le montant à régler.** Le calendrier ne relit ni le paquet, ni la
  portée de dossier-service, ni les versions de chaque ligne (une page en compte 500) : il lit les règlements rapprochés
  de la page (une requête) ; le reste est le dû que le **dernier** règlement non annulé a lu (`rapprochement.du`), moins
  tous les non-annulés — la règle même de 342. Si ce dû a été lu sur une autre version que la courante (une rectificative
  déposée depuis) : `reste: null`, `RESTE_A_RELIRE`, et `chemin` mène à la lecture exacte.
- **D-343-5 — L'annulation motivée d'un rapprochement : un acte neuf, la pièce reste** (D-342-14, 1). Sous `regler` ; un
  motif (3 à 500 caractères) ; un document de `annulations_reglements` (immuable, un par règlement : `409
  REGLEMENT_DEJA_ANNULE`) et l'acte `OBLIGATION_REGLEMENT_ANNULE` au journal chaîné, dans une transaction. Le règlement
  annulé reste lisible, son rang aussi ; il ne compte plus nulle part (reste, montant à régler, ordre, calendrier, 344).
  Refusée sur une close (325, AC-3) ; admise sur une écartée (on doit pouvoir défaire une erreur pour rapprocher la
  quittance ailleurs) et sur une payée (l'acte humain n'est pas défait : la ligne le montre).
- **D-343-6 — La quittance d'un rapprochement annulé se rapproche de nouveau, sans migration.** La clé d'unicité de la
  référence (342 : un index unique `(orgId, dossierId, referenceCle)`) devient « la référence normalisée, suivie du nombre
  d'annulations de cette référence dans le dossier » : `REF`, puis `REF⇥1`, `REF⇥2`… (une tabulation, qu'une référence
  normalisée ne contient jamais : `cleDeReference` réduit tout blanc à une espace). Les clés déjà écrites ne changent pas ;
  l'index ne change pas ; deux rapprochements simultanés de la même quittance s'excluent toujours par lui.
- **D-343-7 — Un acompte réglé par quittance compte pour la TPU** (D-342-14, 6). La règle de D-342-8 appliquée à
  l'acompte : le plus grand de son payé saisi et de son rapproché non annulé ; leur écart rend le montant incomplet
  (`ACOMPTE_PAYE_DIFFERENT_DU_RAPPROCHE`), jamais une déduction choisie au hasard.
- **D-343-8 — Le droit des transitions de paiement suit l'attribution de B** (D-342-9) : voir « Le droit des transitions de
  paiement ». Basculer avant l'attribution fermerait « À payer », « Payée » et le payé à tout le monde.
- **D-343-9 — Hors périmètre, nommé.** (1) Un filtre du calendrier par état de règlement (une requête jointe sur deux
  collections ; le filtre `statuts=DEPOSEE,ACCUSE_RECU,A_PAYER` existe déjà). (2) La vue de charge (319) : elle écarte les
  déposées. (3) L'écran (A). (4) La section du règlement du dossier de contrôle (D, 336) : elle lira `annulation`. (5) Les
  pénalités (344).

## Preuves attendues

Unitaires (Node 24, `-w 2`) : la situation du règlement d'une ligne (chaque état, chaque mise en évidence ; déposée et
payée lues chacune de son fait, les cas qui les séparent : payée puis rectificative, rejet, antérieure à 325 ; le reste et
la version ; jamais une transition) ; l'annulation pure (motif, déjà annulé, le règlement d'une autre obligation, l'acte et
son empreinte) ; la clé d'occurrence ; le rapprochement après annulation (le reste, le rang, la clé) ; le montant à régler
(les annulés exclus ; l'acompte rapproché, le plus grand, le manque neuf) ; les services (calendrier : une seule lecture
des règlements pour la page ; annulation : portée, droit, close, écartée) ; le contrôleur ; la garde FR-F47 (inchangée,
verte) ; conformité MongoDB (l'annulation et son acte tout ou rien ; l'index d'une annulation par règlement sous
concurrence ; l'immuabilité ; la quittance annulée rapprochée de nouveau, deux fois en parallèle : une seule ; la lecture
groupée du calendrier) ; e2e (le calendrier : déposée sans règlement mise en évidence, partielle, réglée à confirmer,
payée, non déposée ; l'annulation : 201, le reste qui remonte, la quittance rapprochée de nouveau, 409, 404, 403 ;
l'acompte rapproché lu par la TPU) ; toute la suite du fiscal, celles de D comprises ; mutations sur la logique neuve ;
`docker compose up` du fiscal, sain (des modules changent de fournisseurs).

## Progress Tracking

| Date | Événement |
|---|---|
| 2026-11-27 | Fiche écrite, contrat et communs annoncés avant le code. |
