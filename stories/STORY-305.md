---
baseline_commit: 831a2f9 (prospera-fiscal-service), balance-service et dossier-service origin/dev
---

# STORY-305 : Dérivation du catalogue d'obligations

Status: ready-for-dev

**Complexité :** high

**Épic :** EPIC-028 — Implantations multiples et catalogue d'obligations dérivé  
**Services :** `balance-service` (source du paquet), `dossier-service` (copie à l'octet), `fiscal-service` (dérivation)  
**Points :** 8 · **Sprint :** S24 du tracker ; groupe B du plan du 14/11  
**Assigné à :** Dev B  
**Prérequis :** STORY-362 (implantations), STORY-298 (rattachement version ↔ exercice, validation par élément), STORY-299 (journal chaîné), STORY-300 (droits)  
**Origine :** FR-F06, FR-F07, FR-F09, FR-F10 ; spine AD-5, AD-6, AD-8, AD-17, AD-18.

---

## User Story

En tant que **collaborateur de cabinet**, je veux que le système établisse seul la liste des
obligations d'un client, afin de ne plus la tenir de mémoire.

## Décisions confrontées au code réel (2026-11-14)

- **Le catalogue vit DANS le paquet fiscal** (décision de l'utilisateur du 2026-11-14, conforme à
  FR-F67 et AD-5/AD-6) : section `catalogueObligations` de la source
  `balance-service/scripts/referentiels/sources/paquet-fiscal-togo-2026.json`, validée par le schéma
  du paquet, régénérée par `build.mjs` ; nouvelle empreinte reportée au registre de
  `balance-service` et à la copie à l'octet de `dossier-service`. La republication au catalogue
  (`fiscal-tg-entreprise@2026.x`) reste un geste d'administration.
- **Aucun chiffre recopié** (la note du paquet l'interdit : deux copies divergent à la première loi
  de finances). Une entrée de catalogue **référence** les rubriques qui font foi (`ref` : chemin,
  filtre, champ) — `acomptesProvisionnels.echeances`, `depot.echeances[…].dateLimite`,
  `tva.declaration.periodicites`. Une référence qui ne se résout pas, ou une échéance
  `NON_CONSTATABLE`, rend l'obligation **non dérivable, nommée** (FR-F10), jamais omise.
- **Entrées de février (Togo 2026)** : TVA (mensuelle, échéance absente du paquet ⇒ non dérivable),
  acomptes d'IS (dates fixes Art. 114-116), DSF par type d'entité et régime (assurance 31/05 ;
  synthétique 31/03 ; réel : `NON_CONSTATABLE` ⇒ non dérivable ; microfinance : indéterminable ⇒ non
  dérivable). Les taxes sectorielles (TAF, TCA) sont STORY-307.
- **Applicabilité** : `typesEntite` et `regimesFiscaux` (`REEL` / `SYNTHETIQUE`, vocabulaire de
  `dossier-service`). Le régime de l'implantation principale est lu chez `dossier-service`
  (`regimeFiscal`, déjà exposé) ; une entrée restreinte par régime sur une implantation de régime
  inconnu ⇒ non dérivable `REGIME_FISCAL_INCONNU`. Le régime d'une implantation secondaire
  (STORY-362) s'aligne sur le même vocabulaire.
- **La version de paquet** : l'implantation principale dérive sur la version **rattachée à
  l'exercice** (STORY-298) ; une implantation d'un autre pays sur la version octroyée de son pays.
  L'obligation stocke la version qui l'a dérivée (AD-8).
- **Clé d'idempotence** `(organisation, dossier, implantation, taxe, période)` — index unique ; la
  re-dérivation fait `$set` des champs dérivés (échéance, montant attendu, canal, base légale,
  version, signalements) et `$setOnInsert` de statut (`A_PREPARER`), responsable et déclarations :
  rien de l'humain n'est écrasé (AD-17). Montant attendu : `null` jusqu'au moteur de calcul
  (EPIC-029).
- **Signalements de validation** (STORY-298) : chaque obligation porte les éléments du paquet
  qu'elle utilise et qui ne sont pas validés par un expert.
- **Déclencheurs** (AD-17) : un seul cas d'usage. Cette story livre le déclencheur explicite
  (ouverture de période : `POST /v1/exercices/:id/obligations/derivation`, droit `preparer`). Les
  deux autres (implantation, publication de paquet) passeront par la file BullMQ (AD-18) — suite.
- **Journal** : `OBLIGATION_DERIVEE` à la création, `OBLIGATION_REDERIVEE` quand l'échéance change,
  au journal chaîné `obligation:<id>`, dans la transaction.

## Critères d'acceptation

- [ ] **AC-1** — Une implantation renseignée : les obligations applicables sont créées avec
  assiette, périodicité, échéance, canal et base légale citée.
- [ ] **AC-2** — Rejouée, la dérivation ne duplique rien : clé `(implantation, taxe, période)`
  unique (index réel).
- [ ] **AC-3** — Une obligation affectée et en préparation : une re-dérivation actualise échéance et
  montant attendu, préserve statut, responsable et déclarations.
- [ ] **AC-4** — Une entrée dont une donnée manque au paquet : obligation signalée non dérivable,
  motif nommé, jamais omise.
- [ ] **AC-5** — Le paquet régénéré est identique à l'octet chez `balance-service` et
  `dossier-service` ; le schéma refuse une entrée de catalogue mal formée.

## Definition of Done

- [ ] Branches `MNV-305` (balance, dossier, fiscal) depuis `origin/dev`, PR vers `dev` fusionnées en
  rebase dans l'ordre balance → dossier → fiscal ; fiche et tracker par PR sur `main`.
- [ ] Portes qualité vertes sur les trois dépôts ; conformité Mongo réel ; mutations rouges.

## Progress Tracking

**2026-11-14 — fiche écrite** (bmad-create-story) juste avant de coder ; décision « catalogue dans le
paquet » prise par l'utilisateur le même jour.
