# STORY-342 : Le rapprochement du règlement, et le refus d'une imputation incohérente

Status: done — **livrée le 2026-11-27** : balance-service **#176** (`4f75f4e` sur `dev`) et prospera-fiscal-service **#93** (`6cd99ee` sur `dev`) ; voir « Livraison ». Écrite le 2026-11-27 par la session du groupe C juste avant de la coder (lot 7, n° 14 du fiscal,
`PLAN-LOT-7-2026-11-24.md` §3) ; contrat et communs annoncés avant le code (« ⚠ Contrats » et « ⚠ Communs » du journal de
C). Il n'existait pas de fiche : les critères viennent de `epics-fiscalite-2026-08-03.md` (EPIC-033, STORY-342), du PRD
fiscalité (FR-F48, FR-F59, §3.3 « Le règlement n'est pas le dépôt », §8 étape 7) et de la fiche STORY-565 de D (AC-6 :
« le passage à payée reste un acte humain »).

**Epic :** EPIC-033 · **Points :** 5 · **FR :** FR-F48 (le règlement est rapproché de la déclaration : montant, date,
référence, canal ; un règlement imputé sur une période ou une taxe incohérente est refusé ou signalé), FR-F59 (le droit
« règlement », qu'aucun autre n'implique) · **Architecture :** AD-9 (la version scellée fait foi), AD-10 (le journal chaîné,
les textes par leur empreinte), AD-13 (aucun accès bancaire), AD-17 (un champ humain ne se récrit pas par le système),
NFR-A06 (aucun texte de loi ni aucun organisme dans le code) · **PRD** §3.3 : « Prospera prépare, rapproche et prouve ; il
n'exécute pas. »
**Services :** `prospera-fiscal-service` (dossier `reglement`, à C par D-L7-1 ; communs nommés plus bas) et
`balance-service` (la source du paquet fiscal Togo, à C depuis D-L7-3).
**Après :** STORY-340 (le montant à régler, `MontantAReglerService`), 341 (l'ordre de règlement, `ordreDeReglement`, la garde
FR-F47), 322 (le triplet : le payé est un champ humain), 325 (la version scellée), 317 (l'échéance applicable), 339 (la
citation mot pour mot), 563 (les redevables et leur NIF).
**Suite :** STORY-343 (« déposée » ≠ « payée » : elle lit les règlements rapprochés) ; 344 (les pénalités : elle lit le
signalement « réglé après la date limite ») ; **565 de D** (l'ordre transporté : il dit désormais le reste, net de ce qui est
rapproché) ; le dossier de contrôle de D (336 : la section du règlement).

## Histoire

En tant qu'**expert-comptable**, je veux qu'un règlement s'impute sur la bonne période et la bonne taxe, afin d'éviter
l'erreur qui coûte une majoration. *(FR-F48)*

## Critères d'acceptation (`epics-fiscalite-2026-08-03.md`, EPIC-033)

1. **Étant donné** un règlement **quand** il est rapproché **alors** montant, date, référence et canal sont enregistrés
   contre la déclaration.
2. **Étant donné** un règlement imputé sur une période ou une taxe incohérente **quand** il est soumis **alors** il est
   refusé ou signalé, jamais accepté en silence.

Et, de la fiche STORY-565 (D) et du PRD (§8, étape 7) : le règlement constaté est **déclaré par le cabinet** (la personne a
payé elle-même, le produit ne paie jamais) ; le passage à « Payée » reste un **acte humain** ; « déposée » et « payée » ne se
déduisent jamais l'un de l'autre (343).

## Ce que le code porte déjà (lu sur `origin/dev`, fiscal `481a8f4`, balance `53e1595`)

| Pièce | Ce qu'elle porte | Où |
|---|---|---|
| Le montant à régler (340) | la référence (le déclaré de la version scellée), les imputations du paquet, le **déjà réglé = le payé du triplet**, `aRegler = max(0, dû − payé)`, `excedents`, `complet`, `manques` | `domain/reglement/montant-a-regler.ts`, `MontantAReglerService` |
| L'ordre (341) | le redevable et son NIF, la taxe, la période, le montant, l'échéance applicable, la caisse ; produit sur la déclaration déposée et un montant complet et positif seulement | `domain/reglement/ordre-de-reglement.ts`, `OrdreDeReglementService` |
| Le triplet (322) | le payé, **champ humain**, saisi à « À payer » / « Payée » sous `preparer` (`POST …/montant-paye`) | `domain/obligations/triplet.ts` |
| Les droits (300, 902) | trois droits, `preparer`, `valider`, `deposer` ; « `lire`, `controler` et `regler` attendront les routes qui les exercent » | `common/rbac/droits-fiscalite.ts` ; auth-service les attribue |
| La garde FR-F47 (341) | aucune route qui paie, aucun champ d'accès bancaire ; la liste fermée des routes qui **consignent** un paiement déjà fait | `domain/reglement/garde-aucune-execution-de-paiement.spec.ts` |

**Ce qui manque** : rien n'enregistre le règlement que le redevable a fait (la quittance) contre la déclaration ; rien ne
vérifie qu'il est imputé sur la bonne taxe, la bonne période et le bon redevable ; et **un ordre continue de demander le
montant entier après un règlement**, tant que le payé du triplet n'est pas saisi — de quoi payer deux fois.

## Ce que dit le texte (corpus OTR 2025, relu le 2026-11-27)

- **LPF Art. 460** : « Les impôts et taxes visés par la législation fiscale sont payables à la caisse de l'Office, soit en
  numéraire, soit par chèque, soit par virements postaux, mandats cartes, mandats lettres et mandats contributions, par
  billet à ordre, par obligations cautionnées. Les redevables peuvent également effectuer leur paiement au moyen des
  télépaiements ou toute autre procédure dans les conditions prévues par l'Office. […] En cas de télépaiement ou paiement en
  ligne, les redevables bénéficient d'un délai supplémentaire de trois (03) jours. »
- **LPF Art. 461** : « La remise d'un chèque en paiement laisse subsister la créance initiale avec toutes ses garanties
  jusqu'au paiement effectif du chèque. »
- **LPF Art. 462** : « Tout versement d'impôt donne obligatoirement lieu à la délivrance d'une quittance. »
- **LPF Art. 463** : « En matière de taxes intérieures sur le chiffre d'affaires, les redevables peuvent effectuer le
  paiement en obligations cautionnées. […] Si les obligations ne sont pas apurées à l'échéance, le receveur poursuit
  immédiatement […] le recouvrement des droits garantis […]. »
- **LPF Art. 458** : « La créance fiscale dont la perception est obligatoire ne peut faire l'objet de compensation. »

## Contrat annoncé avant le code (2026-11-27)

**Ajouts** : deux routes (une écriture, une lecture), un droit, une collection, un acte au journal, deux sous-blocs du paquet
et l'organisme de deux obligations ; **un comportement de 340 change** (le montant à régler compte les règlements rapprochés,
D-342-8) : `aRegler` peut baisser, un champ `rapproche` s'ajoute, un code de manque s'ajoute. Aucun événement ; aucun champ
existant ne disparaît ; aucune route de `balance-service` ne change (le moteur ne lit pas le bloc).

### `POST /api/v1/obligations/{id}/reglements` — rapprocher un règlement (AC-1, AC-2)

Rôles `TENANT_ADMIN`, `TENANT_USER`, accès fiscal, **droit `fiscalite:declaration:regler`** (neuf, D-342-9 ; sans lui
`403 DROIT_FISCAL_REFUSE`, journalisé) ; portée de l'obligation (`404 OBLIGATION_INTROUVABLE`). Corps — ce que porte la
quittance :

```
{ reference (la quittance, 1 à 64 caractères), montant (entier > 0), regleLe (AAAA-MM-JJ, jamais dans le futur),
  canal (un code de reglement.canaux du paquet),
  imputation: { taxe, periode, identifiantFiscal } (ce sur quoi la quittance impute le versement) }
```

Réponse **`201`** — le règlement rapproché, immuable :

```
{ reglementId, obligationId, dossierId, rang, reference, montant, regleLe,
  canal: { code, libelle, baseLegale, delaiSupplementaireJours | null },
  declaration: { numero, versionId | null },
  rapprochement: { du, dejaRapproche, reste, dateLimite | null, empreinteOrdre | null },
  signalements: [{ code: RESTE_A_REGLER | REGLE_APRES_LA_DATE_LIMITE | RESERVE_DU_CANAL, message, details }],
  quittance: baseLegale | null, paquet: { code, version, checksum }, rapprochePar, rapprocheLe }
```

- **Une imputation incohérente est refusée, jamais corrigée** (AC-2) : `409 IMPUTATION_INCOHERENTE`, rien n'est écrit,
  `details.motifs` les nomme **tous** : `AUTRE_TAXE`, `AUTRE_PERIODE`, `AUTRE_REDEVABLE` (le NIF de la quittance n'est pas
  celui du redevable de l'obligation), `MONTANT_SUPERIEUR_AU_RESTE` (`{ du, dejaRapproche, reste }`) — chacun avec
  `attendu` et `declare`. Le règlement n'est jamais réimputé en silence sur une autre obligation.
- **Contre la déclaration déposée, sur un montant prouvé** (comme l'ordre) : `409 DECLARATION_NON_DEPOSEE`,
  `MONTANT_A_REGLER_INDISPONIBLE`, `MONTANT_A_REGLER_INCOMPLET` (`details.manques`), `REDEVABLE_INTROUVABLE`,
  `IDENTIFIANT_FISCAL_ABSENT` ; `OBLIGATION_CLOTUREE`, `OBLIGATION_DESACTIVEE`.
- **Une quittance ne se rapproche qu'une fois dans le dossier** : `409 QUITTANCE_DEJA_RAPPROCHEE`
  (`details.obligationId`) ; deux rapprochements simultanés de la même obligation : `409 RAPPROCHEMENT_CONCURRENT`.
- **Validation** (`400`) : corps mal formé ; `CANAL_INCONNU` (`details.canaux` : ceux du paquet) ;
  `DATE_DE_REGLEMENT_INVALIDE` (pas une date, ou dans le futur).
- **Signalé, sans refus** : `RESTE_A_REGLER` (un règlement partiel), `REGLE_APRES_LA_DATE_LIMITE` (après l'échéance
  applicable, plus le délai supplémentaire du canal : la base de 344), `RESERVE_DU_CANAL` (le chèque, LPF Art. 461 ; les
  obligations cautionnées, Art. 463 : cités mot pour mot).
- Ni le payé du triplet ni le cycle ne changent (D-342-8) : « Payée » reste un acte humain.
- L'acte **`OBLIGATION_REGLEMENT_RAPPROCHE`** entre au journal chaîné de l'obligation dans la même transaction (la référence
  par son empreinte, son texte hors du journal, comme en 329 ; jamais le NIF).

### `GET /api/v1/obligations/{id}/reglements` — les règlements rapprochés

Rôles, accès fiscal, portée (comme le montant à régler). `200 { obligationId, du | null, rapproche, reste | null, paye |
null, ecartPaye | null, chemin, reglements: [le règlement rapproché, par rang] }` — `du` et `reste` sont `null` quand le
montant à régler ne se lit pas (son motif dans `motif`).

### Le montant à régler (340) et l'ordre (341) comptent ce qui est rapproché (D-342-8)

- `MontantARegler` gagne **`rapproche: { montant, nombre, chemin } | null`** ; **`aRegler = max(0, dû − max(payé,
  rapproché))`** (le payé du triplet et les quittances disent le même argent : ils ne s'additionnent pas) ; le trop-versé se
  lit sur le plus grand des deux ; **payé et rapproché différents ⇒ manque `PAYE_DIFFERENT_DU_RAPPROCHE`** (le montant est
  incomplet : aucun ordre n'est produit tant que l'un ne rejoint pas l'autre).
- L'ordre (341) : `montant.dejaRegle` devient le plus grand des deux ; un ordre déjà réglé par un rapprochement est
  `409 RIEN_A_REGLER`. 565 (D) transporte donc le reste, jamais le montant entier une seconde fois.

### En processus (343, le dossier de contrôle de D)

`RapprochementReglementService` (exporté par `ReglementModule`) : `rapprocher(acteur, id, quittance)` et
`deLObligation(acteur, id)` (la lecture de la route GET).

### Le paquet fiscal Togo 2026 (`balance-service`, source et artefact)

- **`reglement.canaux`** : `[{ code, libelle, livre, article, millesime, delaiSupplementaireJours?, reserve?: { libelle,
  livre, article, millesime } }]` — `NUMERAIRE`, `CHEQUE` (réserve LPF Art. 461), `VIREMENT_POSTAL`, `MANDAT`,
  `BILLET_A_ORDRE`, `OBLIGATION_CAUTIONNEE` (réserve LPF Art. 463), `TELEPAIEMENT` (délai supplémentaire de trois jours) —
  tous de LPF Art. 460.
- **`reglement.quittance`** : `{ libelle, livre: LPF, article: Art. 462, millesime }`.
- **`reglement.obligations.TVA.versement`** et **`.TPU.versement`** : `{ organisme: "caisse de l'Office", livre: LPF,
  article: Art. 460, millesime }` (D-342-12 ; ils étaient `aConfirmer` en 341).
- Garde **R13** étendue : chaque canal porte un code unique en capitales, son libellé et sa référence (ou `aConfirmer`,
  jamais les deux) ; le délai, s'il est là, est un entier > 0 ; la réserve, si elle est là, porte son libellé et sa
  référence ; la quittance aussi. `_meta.revision` gagne sa ligne. Nouvelle empreinte, réépinglée ; **B prévenu** (recopie
  de `dossier-service`), **D prévenu**.

## Persistance et fichiers communs (D-L7-2)

**Aucune migration** : la collection neuve **`reglements_rapproches`** (dossier de C) a ses index posés par Mongoose au
démarrage (patron de `rejets_depot`, 334) — `(orgId, dossierId, referenceCle)` unique, `(orgId, obligationId, rang)` unique ;
elle est **immuable** (`rendreImmuable`, 325). Communs touchés dans le fiscal : **`common/rbac/droits-fiscalite.ts`** et sa
spec (le droit neuf) ; **le contrat OpenAPI** (deux routes) ; **la copie du paquet**
(`test/fixtures/paquet-fiscal/paquet-fiscal-togo-2026.json`, à l'octet de balance-service) ;
**`src/app.module.invariant.spec.ts`** (l'export du service du rapprochement) ; **`src/garde-routes-ecriture.spec.ts`**
n'est pas touché (la route porte son droit). Tout le reste dans des dossiers de C : `domain/reglement`,
`application/reglement`, `modules/reglement`, `adapters/mongo` (le schéma et le registre neufs),
`domain/obligations/historique.ts` (le libellé de l'acte), `domain/redevables/garde-identifiant-fiscal.spec.ts` (deux
porteurs du NIF de la quittance), la garde FR-F47 (**inchangée** : la route qui rapproche ne paie pas et son nom ne le
laisse pas croire ; le témoin de 565 passe sans modification),
`test/obligations.e2e-spec.ts`, un double en mémoire et une suite de conformité neufs. **`MontantAReglerService`** gagne une
dépendance (le registre des règlements, fourni dans `ReglementModule`) ; **`deLObligation` et `lire` gardent leur
signature** ; `OrdreDeReglementService` garde son constructeur et sa signature. Aucune classe instanciée par `DepotsModule`
ne change. Ni `app.module.ts`, ni `package.json`, ni `read-models/`, ni `config/`.

## Décisions (D-342-n) — prises le 2026-11-27, contestables

- **D-342-1 — Le règlement constaté est une pièce neuve, immuable, déclarée par le cabinet.** Le redevable a payé lui-même
  (FR-F47) ; le cabinet reporte ce que porte la quittance (LPF Art. 462 : « Tout versement d'impôt donne obligatoirement
  lieu à la délivrance d'une quittance ») : sa référence, le montant, la date, le canal, l'imputation. Une collection
  `reglements_rapproches`, un document par règlement, jamais récrit ; l'acte au journal chaîné dans la même transaction.
- **D-342-2 — Rapprocher, c'est confronter la quittance à l'ordre de l'obligation.** L'imputation que la quittance porte
  (taxe, période, NIF) face à l'ordre (341 : la taxe, la période, le NIF du redevable) ; le montant face au **reste** (le dû
  net de 340, moins les règlements déjà rapprochés). Chaque écart est un **motif nommé** (`AUTRE_TAXE`, `AUTRE_PERIODE`,
  `AUTRE_REDEVABLE`, `MONTANT_SUPERIEUR_AU_RESTE`), **tous rendus ensemble** dans un `409 IMPUTATION_INCOHERENTE` ; rien n'est
  écrit. Le règlement n'est **jamais réimputé en silence** sur l'obligation qui conviendrait : la quittance dit où l'argent
  est allé chez le receveur, et une erreur d'imputation se corrige auprès de lui (LPF Art. 458 : la créance fiscale ne se
  compense pas). Le NIF se compare sans espaces et sans casse ; la taxe et la période, à l'identique (les codes du
  catalogue).
- **D-342-3 — Contre la déclaration déposée, sur un montant prouvé.** Les refus de l'ordre (D-341-2, D-341-3) valent ici :
  un règlement se rapproche de la version **scellée** (AD-9). `RIEN_A_REGLER` n'est pas un refus à part : le reste est 0 et
  le motif `MONTANT_SUPERIEUR_AU_RESTE` le dit. Seul le manque `PAYE_DIFFERENT_DU_RAPPROCHE` (D-342-8) ne bloque pas un
  rapprochement — sinon l'écart ne pourrait jamais se résorber.
- **D-342-4 — Le règlement partiel est admis, et dit.** Plusieurs quittances peuvent régler une déclaration ; chacune
  porte son rang, le dû, ce qui était déjà rapproché et le reste ; un reste > 0 est signalé (`RESTE_A_REGLER`). Au-delà du
  reste : refus (un trop-versé ne se constate pas par un rapprochement).
- **D-342-5 — Le canal est une donnée du paquet, lue du texte.** `reglement.canaux` (LPF Art. 460) ; un canal inconnu ⇒
  `400 CANAL_INCONNU` avec la liste du paquet. Aucun code de canal dans le code (NFR-A06). Le canal est un **mode**, jamais
  un accès : aucun numéro de compte, de chèque ou de carte n'est demandé ni gardé (AD-13, garde FR-F47).
- **D-342-6 — La référence est la quittance, et elle ne sert qu'une fois dans le dossier.** Index unique
  `(orgId, dossierId, referenceCle)` (espaces réduits, capitales) : `409 QUITTANCE_DEJA_RAPPROCHEE`, avec l'obligation qui
  la porte. Par dossier, pas par organisation : deux clients du cabinet peuvent recevoir le même numéro de deux caisses.
- **D-342-7 — « Signalé » : ce qui compte sans rendre l'imputation incohérente.** Réglé après la date limite (l'échéance
  applicable de 317, plus le délai supplémentaire du canal : trois jours pour le télépaiement, LPF Art. 460) ; reste à
  régler ; réserve du canal (le chèque laisse subsister la créance jusqu'à son paiement effectif, Art. 461 ; les obligations
  cautionnées non apurées, Art. 463). Portés par le règlement, rendus, jamais un refus ; 344 lira le retard.
- **D-342-8 — Le payé du triplet reste un champ humain ; le montant à régler compte ce qui est rapproché.** Le
  rapprochement n'écrit pas le payé (322, AD-17) et ne change pas le cycle (« Payée » reste un acte humain : 565 AC-6, PRD §8
  étape 7). Mais un ordre qui redemanderait le montant entier après un règlement ferait payer deux fois : le montant à
  régler (340) lit les règlements rapprochés, et `aRegler = max(0, dû − max(payé, rapproché))` (deux mesures du même argent,
  jamais additionnées) ; s'ils diffèrent, le manque `PAYE_DIFFERENT_DU_RAPPROCHE` rend le montant incomplet — l'ordre n'est
  pas produit tant que l'un ne rejoint pas l'autre.
- **D-342-9 — Le droit `fiscalite:declaration:regler` naît avec la route qui l'exerce** (FR-F59 ; D-341-10). Aucun droit ne
  l'implique ni n'est impliqué par lui (`preparer` ne suffit pas). Il s'attribue chez auth-service (B) : **→ B**, choix par
  défaut : l'associé et le collaborateur (au PRD §8, c'est la collaboratrice qui rapproche). **Tant que B ne l'attribue
  pas, la route refuse à tous (`403 DROIT_FISCAL_REFUSE`, journalisé)** : c'est voulu, il n'existe plus de compatibilité par
  le rôle (902). `POST …/montant-paye` et les transitions vers « À payer » / « Payée » restent sous `preparer` : les passer
  à `regler` avant son attribution les fermerait (à poser avec 343, une fois B servi).
- **D-342-10 — La concurrence ne dépasse jamais le reste.** Chaque règlement d'une obligation a un rang (index unique
  `(orgId, obligationId, rang)`) ; le rapprochement lit les rangs, vérifie le reste, écrit le rang suivant : de deux
  rapprochements simultanés, l'un passe, l'autre lève `409 RAPPROCHEMENT_CONCURRENT` (relire, resoumettre).
- **D-342-11 — La date du règlement est celle de la quittance**, `AAAA-MM-JJ`, jamais dans le futur. Avant le dépôt :
  admise (le guichet peut encaisser avant le dépôt), le rapprochement, lui, attend la version scellée.
- **D-342-12 — LPF Art. 460 nomme la caisse de toutes les impositions.** « Les impôts et taxes visés par la législation
  fiscale sont payables à la caisse de l'Office » : la TVA et le solde de TPU, laissés `aConfirmer` en 341 (D-341-5),
  reçoivent cet organisme, cité ; la question de 341 au PO est **répondue par le texte** (le paquet reste, comme tout
  entier, à valider par un fiscaliste). Les caisses déjà nommées par un article propre (Art. 27, 55, 57, 99) ne changent pas.
- **D-342-13 — Une lecture, et un service exporté.** `GET …/reglements` (le dû, le rapproché, le reste, le payé du triplet
  et son écart) ; `RapprochementReglementService` exporté par `ReglementModule` pour 343 et pour la section du règlement du
  dossier de contrôle (D, 336). `ReglementModule` n'importe toujours aucun module de D.
- **D-342-14 — Hors périmètre, nommé.** (1) L'**annulation motivée** d'un rapprochement saisi par erreur (un acte neuf qui
  le neutralise ; la pièce reste) : avec 343. (2) La quittance numérisée rangée à la GED (B) et sa référence. (3) Une
  quittance qui couvre **plusieurs** obligations (une quittance, une obligation, ici). (4) « Déposée » / « payée » au
  calendrier (343) ; les pénalités (344) ; l'écran (A) ; le transport (565, D). (5) Le passage de `montant-paye` et des
  transitions de paiement sous `regler` (D-342-9). (6) Un acompte réglé par une quittance rapprochée **sans** payé saisi
  n'est pas encore lu comme payé par la TPU qui l'impute (340 lit le payé des acomptes) : le solde reste « incomplet » —
  jamais faux ; à poser avec 343.

## Preuves attendues

Unitaires (Node 24, `-w 2`) : le rapprochement pur (chaque motif, tous ensemble, le reste, le partiel, la date limite et le
délai du canal, la réserve citée, la normalisation de la référence et du NIF, aucune clé bancaire), le montant à régler
avec ce qui est rapproché (le plus grand, jamais la somme ; le manque ; le trop-versé ; l'ordre), le service (portée, refus
de l'ordre, quittance déjà rapprochée, concurrence, le droit), le contrôleur, le droit neuf (indépendant), la garde FR-F47
(inchangée, verte), la garde AD-21 étendue, l'invariant d'`AppModule` ; balance-service : R13 étendue (le paquet
Togo la passe, chaque faute refusée), l'artefact régénéré et réépinglé ; conformité MongoDB (une transaction : le règlement et
son acte ; les deux index ; l'immuabilité ; vingt rapprochements simultanés ne dépassent pas le reste) ; e2e (un acompte d'IS
réglé : 201, l'ordre en `RIEN_A_REGLER`, le montant à régler à 0 ; chaque motif d'incohérence, puis les quatre ensemble, rien
d'écrit ; le partiel et le reste ; la quittance déjà rapprochée ; le télépaiement dans son délai ; le chèque et sa réserve ;
sans le droit `regler` : 403 ; `preparer` seul : 403 ; avant le dépôt : 409 ; hors portée : 404 ; canal inconnu : 400 ; payé
et rapproché différents : l'ordre en `MONTANT_A_REGLER_INCOMPLET`) ; toute la suite du fiscal, celles de D comprises ;
mutations sur la logique neuve ; `docker compose up` du fiscal, sain (le module change de fournisseurs).

## Livraison (2026-11-27)

- **Paquet** : balance-service **#176** (`MNV-342`, `9c7a077` poussé, rejoué `4f75f4e` sur `dev`) : `reglement.canaux` (sept
  modes de LPF Art. 460, réserves Art. 461 et 463, délai de trois jours du télépaiement), `reglement.quittance` (Art. 462),
  `TVA.versement` et `TPU.versement` « caisse de l’Office » (Art. 460, l'apostrophe du corpus, pour que l'organisme se lise
  mot pour mot dans l'article), garde **R13** étendue, schéma, `_meta.revision` ; artefact régénéré, empreinte
  **`4959061a28feb884a7efbc77f6249a80b95e6023bba0adc4104075db1a96e3e2`**, réépinglée (registre, spec, e2e). Le test de 340
  « aucun nombre au bloc » admet le seul délai d'un canal.
- **Fiscal** : **#93** (`MNV-342`, `add9b44` poussé, rejoué `6cd99ee` sur `dev`, sur `680164e` de D — la 337, fichiers
  disjoints ; rebasé **avant** les preuves). Fichiers : `domain/reglement/reglement-rapproche.ts` (la règle pure),
  `application/reglement/rapprochement-reglement.service.ts`, `redevable-du-reglement.ts` (le redevable de 341, factorisé),
  `OrdreDeReglementService.depuis` (constructeur et `deLObligation` inchangés), `MontantAReglerService` (une dépendance de
  plus : le registre des règlements ; `lire` rend aussi `reglements`), `montant-a-regler.ts` (`rapproche`, le plus grand
  des deux, le manque), `ordre-de-reglement.ts` (`dejaRegle`), le port, le schéma et le registre Mongo, la route et la
  lecture, les DTO, `ReglementModule` (+ `HabilitationsModule`, la collection, l'export), le droit `regler`, le libellé de
  l'acte (329), la garde AD-21 (deux porteurs), l'invariant d'`AppModule`, la copie du paquet, le double en mémoire, la
  suite de conformité, les e2e. **Écart à l'annonce** : la garde FR-F47 n'a pas eu à nommer la route (ni son chemin ni son
  nom ne paient) — elle passe **sans modification**, ce qui la garde intacte comme témoin de 565.
- **Preuves** (Node 24, étage `verification`, archive LF de `0363f48`, arbre identique au commit poussé ; verrou pris une
  fois, 08:59 → 09:22, script autonome, rendu par son `trap`) : unitaires **270/271 (1 ignorée) suites, 4130 tests** ; e2e
  **15/15, 409** ; conformité MongoDB (jeu de répliques) **33/33, 216** (dont `reglements.conformite-spec.ts` : deux index,
  vingt rapprochements parallèles du même rang → un seul, tout ou rien sur une panne du journal, immuable et strict) ;
  `nest build` vert, le corpus dans `dist/` ; balance-service unitaires **300/302 (2 ignorées), 5846** ; e2e **38/38,
  2324** ; **pile `grp-c`** fiscal + balance saine (santé `ok` des deux ; `…/reglements` GET et POST en 401 sans jeton ;
  six routes du règlement et du cycle montées ; `ReglementModule` et `HabilitationsModule` initialisés ; les neuf « Error: »
  sont l'« Unknown topic or partition » connu d'une pile neuve ; aucun redémarrage). Aucun conteneur, volume ni réseau
  `grp-c` restant.
- **Mutations** : fiscal **36/36** tuées (domaine 28, montant et ordre 6, service 5, route 1 — huit réécrites après un rouge
  de compilation, toutes tuées ensuite sur l'assertion) ; balance-service **R13 10/10**.
- **B prévenu** (le droit `regler` à attribuer ; recopie du paquet de `dossier-service` : `dev` `4f75f4e`, sha256
  `4959061a…e3e2`) ; **D prévenu** (empreinte ; le montant à régler net des règlements rapprochés, que 565 transportera ;
  `RapprochementReglementService` pour la section du règlement du dossier de contrôle).

## Progress Tracking

| Date | Événement |
|---|---|
| 2026-11-27 | Fiche écrite, contrat et communs annoncés avant le code. |
| 2026-11-27 | **DONE.** Paquet : balance-service #176 (`4f75f4e`) ; code : fiscal #93 (`6cd99ee`). Preuves : voir « Livraison ». B et D prévenus. |
