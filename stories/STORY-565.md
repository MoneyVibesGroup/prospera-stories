# STORY-565 : Le dépôt automatisé sert les deux redevables — et le règlement reste produit, jamais exécuté

Status: in-progress

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle
**Service :** `fiscal-service` (`:3012`) — adaptateur de canal
**Points :** 13 → **5** ⬇️ *(2026-08-28 : l'exécution du paiement sort du périmètre, décision PO)*
**Sprint :** S30
**Origine :** décision PO du **2026-08-28**, en **deux temps** — cf. §« Ce que cette fiche a
failli devenir ».
**Prérequis :** **STORY-563** (les deux redevables) · **STORY-560** (coffre-fort et mandat) ·
**STORY-561** (le connecteur et son repli)
**Réf. :** **FR-F47** et **STORY-341** *(« ordre de règlement produit, jamais exécuté »)* —
⚡ **conservées, non amendées** · PRD fiscalité §3.3

---

## ⚠️ Ce que cette fiche a failli devenir, et pourquoi elle ne l'est pas

Le PO a d'abord demandé *« automatiser le paiement des taxes pour la société […] mais aussi
automatiser le paiement des taxes d'une personne physique avec son NIF »*. Cette fiche portait
alors l'**amendement de FR-F47** et de **STORY-341**, dont le critère d'acceptation est une
interdiction testable : *« quand on cherche une capacité d'exécution de paiement, il n'en existe
aucune, sous aucune forme »*.

⇒ ⛔ **Le PO a tranché autrement dans le même échange : *« on ne fait que la déclaration, la
personne même va payer après. »***

**FR-F47 et STORY-341 restent donc intactes.** Aucune capacité d'exécution de paiement n'entre au
service. C'est consigné ici pour que personne ne rouvre le sujet en croyant qu'il l'avait été.

⚡ **Et c'est la bonne frontière, pas un renoncement.** Le produit garde la totalité du gain de
temps — calculer le montant net d'acomptes et de retenues, déposer la déclaration, produire l'ordre
de règlement pré-rempli — sans jamais répondre d'un décaissement. Un dépôt en double se rectifie ;
un décaissement en double se récupère auprès d'une administration.

## Le périmètre réel : le dépôt, pour deux redevables

Le connecteur de **STORY-561** dépose pour l'entreprise. Cette story lui apprend le second
redevable.

| Redevable | Identifiant | Ce qui est déposé |
|---|---|---|
| **L'entreprise** | son NIF | ses déclarations — IS, TVA, TPU, acomptes, retenues |
| **Le dirigeant / la personne physique** | son NIF **personnel** | sa déclaration de revenus, **si elle est due** (STORY-568) |

⚡ **Deux canaux OTR, et il ne faut pas les confondre :**

- **GUDEF** — le *guichet unique de dépôt des états financiers*, institué par le **LPF Art. 17**
  (*« Il est institué un guichet unique de dépôt des états financiers (GUDEF) placé sous la tutelle
  de l'Office »*). C'est le canal de la **liasse** — STORY-537.
- **dimana** — le portail OTR de **déclaration des impôts**, confirmé par le PO le 2026-08-28.
  C'est le canal des **déclarations** — celui de cette story.

⚠️ Les deux sont des **canaux déclarés au paquet pays** (STORY-331/561) : adresse, parcours,
marqueurs. ⛔ Aucun nom de portail dans le code (AD-12). Leur caractérisation exacte — URL, écrans,
point de reprise humaine — se relève sur le portail, elle ne se suppose pas.

## Périmètre

**Inclus**

- Le canal de dépôt de **STORY-561** accepte un `redevableId` : **aucun code spécifique par nature
  de redevable**. ⛔ Deux chemins de dépôt fabriqueraient deux séries de bugs, et le second serait
  toujours en retard sur le premier.
- Le **repli** de STORY-561 s'applique à l'identique : pas de canal, secrets ou mandat absents,
  échec ⇒ dépôt assisté (STORY-332/333). Il n'existe aucun état où déclarer devient impossible.
- **Le mandat est vérifié par redevable** : le mandat de l'entreprise n'autorise pas à déposer pour
  le dirigeant. Deux personnes juridiques, deux consentements (STORY-563).
- **L'ordre de règlement pré-rempli** accompagne la déclaration déposée — montant de STORY-340,
  taxe, période, référence, et le canal de paiement **indiqué à la personne**. C'est STORY-341 qui
  le produit ; cette story le **transporte jusqu'au bon redevable**.
- La distinction **« déposée » / « payée »** de STORY-343 reste la vérité du cycle de vie : le
  produit sait ce qu'il a déposé, et il **attend** que la personne dise qu'elle a payé.

**Hors périmètre**

- ⛔ **Toute exécution de paiement**, sous toute forme. FR-F47 et STORY-341 s'appliquent sans
  réserve, y compris pour le redevable personne physique.
- Stocker un moyen de paiement ou un mandat de prélèvement.
- La qualification de l'obligation du redevable personne physique — **STORY-568** : on ne dépose
  pas une déclaration qui n'est pas due.

## Critères d'acceptation

1. ⛔ **Témoin de non-régression de STORY-341** : la recherche d'une capacité d'exécution de
   paiement dans le service ne rend **rien**, après cette story comme avant. Le test existant
   passe sans modification.
2. Une déclaration de personne physique se dépose par le **même adaptateur** que celle de
   l'entreprise — aucun `if` sur la nature du redevable dans le chemin de dépôt.
3. Un mandat valide pour l'entreprise **ne suffit pas** à déposer pour le dirigeant : refus
   explicite nommant le mandat manquant.
4. Sans canal déclaré pour le redevable, le **dépôt assisté** prend le relais, et le parcours reste
   complet.
5. L'ordre de règlement produit est rattaché au **bon redevable** et porte son identifiant fiscal,
   la taxe, la période et le montant — jamais une coordonnée bancaire.
6. Le cycle de vie distingue « déposée » et « payée » pour les deux redevables, et le passage à
   « payée » reste un **acte humain**.
7. Une déclaration non due (verdict de STORY-568) **ne peut pas être déposée** : le refus cite le
   motif de dispense.

## ✅ Ce que les cabinets veulent qu'on leur valide — salle du 2026-11-19 (V3)

Ajouté depuis `salle-cabinets-validations-2026-11-19.md`. Ce sont les critères qu'un cabinet vérifie lui-même avant d'adopter la solution.

- Pour un même client, l'entreprise et le dirigeant ont chacun leurs déclarations du mois, leurs valeurs copiables et leur accusé ; rien ne se mélange (test : deux NIF, deux accusés).
- Le montant à payer s'affiche avec sa date limite ; le produit ne paie jamais.

## Notes

- ⚡ **La décision du PO simplifie le produit et réduit son risque en une phrase.** Elle supprime
  le besoin d'un mandat de paiement distinct, la question de l'autorisation de débit, le risque de
  double décaissement, et la dépendance à un écran de paiement qui change. Ce qui reste — déposer
  et pré-remplir l'ordre — est ce qui faisait perdre du temps.
- ⚠️ **Ne pas rouvrir FR-F47 en croyant bien faire.** Sa formulation est une interdiction testable ;
  elle a été mise en cause le 2026-08-28 et **explicitement maintenue** le même jour. Le §« Ce que
  cette fiche a failli devenir » existe pour ça.
- ⚠️ **GUDEF ≠ dimana.** Le premier reçoit les états financiers (base légale : LPF Art. 17), le
  second les déclarations d'impôts. Une seule fiche qui confondrait les deux enverrait la liasse
  sur le mauvais portail.

## Réalignement du 2026-11-27, avant le code (lu sur `origin/dev` du fiscal `81e7605`)

La fiche date du 2026-08-28. Depuis, 563, 568, 560, 561 et 562 (D), et 340 → 344 (C) ont été livrées. Relue contre le
code :

### Ce qui existe déjà, et que 565 emploie tel quel

| Livré | Ce que 565 en prend |
|---|---|
| **563** — `Obligation.redevableId` (`entreprise`, dérivé du dossier, ou l'identifiant d'une personne physique du dossier) ; `RedevablesService` (C) : `lister` (l'entreprise en tête, son NIF lu chez `dossier-service`), `duDossierVerifie` ; le mandat de la personne (`MandatRedevable`) | le redevable de la déclaration, **lu, jamais choisi** ; son NIF par la même lecture pour les deux natures |
| **568** — le verdict « Dois-je déclarer ? » (`POST /moi/qualification`), **calculé, jamais stocké** ; une dispense établie ne retire pas l'obligation : le professionnel l'**écarte** avec un motif (FR-F08) | le dépôt d'une obligation écartée est déjà refusé (`OBLIGATION_DESACTIVEE`, 330) ; 565 y joint le motif |
| **560** — le coffre : portée `{organisation, dossier, canal}`, mandat de canal (`DEPOSER`, `SUIVRE`), secret déposé par son propriétaire, jeton d'usage | **ne connaît pas le redevable** : c'est le cœur de 565 (D-565-1) |
| **561 / 562** — le connecteur derrière le port AD-12, choisi par `(canal, code)` de la déclaration ; le repli nommé ; le suivi | le même adaptateur, sans branche par nature ; une source de valeur de plus (D-565-4) |
| **340 → 343** (C) — `ReglementModule` exporte `OrdreDeReglementService.deLObligation(acteur, id)` (`PRODUIT` \| `NON_PRODUIT` nommé), net des règlements rapprochés non annulés, sans coordonnée bancaire ; `RapprochementReglementService.deLObligation` (avec `annules`) ; la garde `garde-aucune-execution-de-paiement.spec.ts` ; « Payée » et `…/montant-paye` sous `fiscalite:declaration:regler` | l'ordre **transporté tel quel** (D-565-7) ; la section du règlement du dossier de contrôle (D-565-8) ; la garde, verte sans modification (AC-1) |

### Ce que la fiche demande et qui se précise

- *« Le mandat est vérifié par redevable »* : aujourd'hui le coffre ne le peut pas, sa portée n'a pas de redevable. Le
  dirigeant a **ses propres** identifiants de portail (son NIF personnel) et **son propre** mandat de canal : la portée
  du coffre gagne le redevable (D-565-1), ce qui demande une migration d'index (D-565-2).
- *« L'ordre accompagne la déclaration déposée »* : l'ordre de 341 n'existe qu'après « Déposée » (`DECLARATION_NON_DEPOSEE`
  sinon), et « Déposée » reste la porte de C, tenue par un membre (D-330-7, D-562-4). Le parcours du connecteur rend donc
  l'ordre **à la lecture**, composé à la demande : nommé `NON_PRODUIT` tant que la déclaration n'est pas « Déposée »,
  `PRODUIT` ensuite (D-565-7). Rien n'est stocké.
- *« Une déclaration non due ne peut pas être déposée »* : 568 ne stocke aucun verdict. Ce qui rend une déclaration non
  due dans le produit, c'est l'obligation écartée avec son motif (FR-F08) ; le dépôt la refuse déjà, 565 cite le motif
  (D-565-6, Q-D-38).
- *« GUDEF ≠ dimana »* : aucun nom de portail n'entre au code (AD-12). Le connecteur est choisi par le **canal de la
  déclaration** (paquet) et son code : un connecteur d'un autre canal n'est jamais emprunté, même s'il liste le code
  (D-565-5).

### Décisions

- **D-565-1 — Le coffre a une dimension redevable.** La portée devient `{organisation, dossier, redevable, canal}`. Les
  routes `…/dossiers/{dossierId}/coffre/…` gagnent le paramètre de requête facultatif `redevable` (absent : `entreprise`,
  la réponse d'aujourd'hui) ; une personne physique doit être un redevable de **ce** dossier (`RedevablesService
  .duDossierVerifie`, lu chez C), sinon `404 REDEVABLE_INTROUVABLE`. `EtatCanal` gagne `redevableId`. Le lien de dépôt,
  la révocation par le propriétaire et le jeton d'usage portent la portée entière : le dirigeant dépose **son** secret.
  ⚡ L'entreprise garde à l'octet son contexte de chiffrement (AAD) et son périmètre d'audit (`coffre:<dossier>_<canal>`) :
  aucun secret n'est rechiffré. Une personne : `coffre:<redevable>_<canal>` (64 caractères au plus) et un AAD qui nomme
  le redevable.
- **D-565-2 — Une migration d'index**, `npm run migrate:portee-coffre-redevable` (patron de 563) : elle range
  `redevableId: 'entreprise'` sur les canaux et jetons qui n'en ont pas, crée l'index unique
  `coffre_une_portee_redevable` `{orgId, dossierId, redevableId, canal}` **avant** de supprimer `coffre_une_portee`.
  Idempotente. Avant qu'elle passe, un canal de l'entreprise ne se lit plus : `MANDAT_ABSENT`, donc l'assisté
  (fail-closed, jamais un dépôt sans mandat).
- **D-565-3 — Le connecteur passe `declaration.redevableId` au coffre** (`repliPourDeposer`, `emettre`,
  `emettrePourSuivre`), sans test sur la nature. Le mandat de canal de l'entreprise vit dans sa portée : pour le
  dirigeant, la portée sans mandat rend `MANDAT_ABSENT` (AC-3), avec `details { redevableId, canal }` dans le chemin.
- **D-565-4 — Le NIF du redevable, une source de valeur du parcours** : `REDEVABLE|identifiantFiscal` (seul nom
  permis), dans le corps ou le chemin d'une étape du **dépôt** (pas du suivi). Résolue à la demande, comme les valeurs du
  formulaire, par `RedevablesService.lister` (l'entreprise et les personnes, la même lecture). Absente :
  `REPLI_ASSISTE`, raison `IDENTIFIANT_FISCAL_ABSENT`. Ce n'est pas un secret ; il n'entre ni au journal ni au parcours
  rangé (AD-21 amendé, 563). Le schéma de C (344) laisse `champs` libre : aucune demande à C.
- **D-565-5 — GUDEF ≠ dimana, par construction** : le connecteur est celui du canal de la déclaration ; une table de
  tests le prouve (la déclaration de revenus du dirigeant et la TVA de l'entreprise vont au même canal de déclaration ;
  un connecteur d'un autre canal qui liste le même code n'est jamais emprunté).
- **D-565-6 — Non due : le refus cite le motif.** `OBLIGATION_DESACTIVEE` (409) porte `details.motif`, le motif posé par
  le professionnel qui a écarté l'obligation. Le même refus pour les deux redevables.
- **D-565-7 — L'ordre transporté.** `GET /api/v1/connecteurs-depot/depots/{depotId}/parcours` gagne `reglement` :
  `null` tant que l'issue n'est pas `DEPOSE` ; ensuite le résultat de `OrdreDeReglementService.deLObligation` **tel
  quel** — `{ statut: PRODUIT, ordre }` ou `{ statut: NON_PRODUIT, motif, message, details }` (jamais avalé). D ajoute un
  seul motif : `ORDRE_D_UN_AUTRE_REDEVABLE`, si le redevable de l'ordre n'est pas celui de la déclaration. Aucun champ
  n'est ajouté à l'ordre, aucune coordonnée bancaire ; rien n'est stocké ; « Payée » reste un acte humain sous
  `fiscalite:declaration:regler` (343). `ConnecteurDepotModule` importe `ReglementModule` (sans cycle). Une garde de D
  (`garde-ordre-transporte.spec.ts`) le fige.
- **D-565-8 — La section du règlement du dossier de contrôle (336).** Chaque obligation gagne `reglement` :
  `{ statut: LU, du, rapproche, annules, reste, ecartPaye, motif, chemin, reglements }`, lu par
  `RapprochementReglementService.deLObligation` — **sans `paye`** : le triplet de 322 le porte déjà
  (`obligation.montantPaye`) ; ou `{ statut: INDISPONIBLE, code, message }` : le dossier ne tombe pas. `DepotsModule`
  importe `ReglementModule`. Un commit à part.
- **D-565-9 — Le mandat de 563 n'autorise pas le dépôt** : c'est le mandat de canal de la portée du redevable, comme
  pour l'entreprise (D-560-4 : celui de 301 ne suffit pas). La même règle pour les deux natures.
- **D-565-10 — Les preuves** : le portail simulé de 561 et 562, étendu au second redevable (un NIF personnel, ses
  identifiants, sa déclaration de revenus), sur la pile `grp-d` avec Redis ; aucun portail réel, aucun identifiant réel.

### Contrat de service (« ⚠ Contrats »)

Ajouts seuls, sauf la portée du coffre :
- coffre : `?redevable=<id>` sur les routes `…/dossiers/{dossierId}/coffre/…` ; `EtatCanal.redevableId` ;
  `404 REDEVABLE_INTROUVABLE` ;
- parcours : `reglement` (D-565-7) ; chemin : la raison `IDENTIFIANT_FISCAL_ABSENT` ;
- dossier de contrôle : `obligations[].reglement` (D-565-8) ;
- `POST /depots-declaration` : `409 OBLIGATION_DESACTIVEE` porte `details.motif` ;
- donnée lue neuve : la source `REDEVABLE|identifiantFiscal` dans un parcours du bloc `automatisation`.

### Fichiers communs (« ⚠ Communs »)

- **Une migration** (D-565-2) : `src/migrate-portee-coffre-redevable.ts` et son script dans `package.json`.
- Le contrat OpenAPI.
- Lus sans écriture : `RedevablesModule`, `ReglementModule` (C). Aucun fichier de C modifié ; la garde FR-F47 de C passe
  sans modification.
