# STORY-280 : Impayé, suspension et préavis — un impayé SUSPEND les accès, payer son retard les rétablit

Status: done

**Épic :** EPIC-041 — Abonnements Prospera et entitlements par événement
**Services :** `paiement-service` (producteur, déjà livré) · `platform-catalog-service` (consommateur, cette livraison)
· **Recette :** `prospera-recette` (STORY-631)
**Branches :** `MNV-280` dans `platform-catalog-service` et `prospera-recette` (base `origin/dev`)
**Fiche :** écrite à la livraison (2026-11-09). Elle n'existait pas : le tracker portait l'entrée seul.
**Arbitrage PO (2026-11-08, STORY-727 point 2) :** un impayé **suspend** les accès, sans supprimer
aucune donnée ; la régularisation les **rétablit**.

---

## Ce qui existait, et ce qui manquait

Côté **paiement**, la story était déjà sur `dev` sans que le tracker le dise : `72921cc`
(MNV-280, préavis et constat), `1aa8399` (MNV-281, grâce bornée), `2d2a91a` (MNV-282,
régularisation). Le paiement publie :

- `paiement.abonnement.preavis.emis` 7 jours avant l'échéance ;
- `paiement.abonnement.impayee` 7 jours après, **refusé** sans le préavis de CETTE échéance
  (`SUSPENSION_SANS_PREAVIS`, lu dans le journal du contrat). C'est l'AC-4 d'origine : une coupure
  sans préavis est un défaut ;
- `paiement.abonnement.regularise` quand le retard est **intégralement** soldé.

**Personne ne consommait les deux derniers** (STORY-279, « ce qui reste ») : un impayé ne coupait
rien. Cette livraison les fait consommer par le catalogue, dans le groupe des abonnements.

## Critères d'acceptation

- [x] AC-1 — Un impayé passe `SUSPENDED` chaque module que le contrat avait ouvert : les modules
      de ses **packages** et ses **options**. La même lecture de l'offre que l'octroi
      (`modulesDeLOffre`).
- [x] AC-2 — ⛔ **Rien n'est supprimé** : version, configuration (palier), référentiels, échéance et
      naissance (`createdAt`) restent. Chaque service en aval refuse déjà un droit `SUSPENDED`
      (`entitlement.changed`, état absolu).
- [x] AC-3 — Un droit **SANS TERME** n'est jamais suspendu par un impayé : octroi d'opérateur ou
      comptabilité incluse d'un vertical (727, lot 7). Aucun paiement ne l'a ouvert, aucun impayé
      ne le ferme.
- [x] AC-4 — Le droit suspendu porte la marque `suspension` (`IMPAYE`, contrat, échéance, date).
      La régularisation ne lève **que** ce que l'impayé du **même contrat** a fermé : une suspension
      d'opérateur (litige) n'est pas levée par un paiement. Un `PUT` d'opérateur efface la marque :
      sa décision remplace celle de l'impayé.
- [x] AC-5 — Payer son retard rétablit le droit **tel quel**, sans intervention (FR-P47) ; un
      règlement partiel ne publie rien côté paiement (STORY-282, AC-3), donc ne rétablit rien.
- [x] AC-6 — ⚡ **Deux topics, sans ordre entre eux.** Un impayé lu APRÈS la régularisation de la
      même échéance ne suspend rien (`DEJA_REGULARISE`, lu dans la trace d'idempotence datée).
- [x] AC-7 — Idempotent : la trace (`eventId`), les statuts et leurs `entitlement.changed` sont
      écrits dans une même transaction. Un message relivré n'écrit rien. Un message illisible, ou
      dont le `statut` contredit son topic, est écarté sans lever (« poison pill »).
- [x] AC-8 — La réponse d'un droit expose `suspension` quand c'est un impayé (absente pour une
      suspension d'opérateur) : la console distingue un retard d'une sanction.
- [x] AC-9 — **Recette sur la vraie pile** (`abonnement.recette.ts`, étape STORY-280). Le cas :
      un second cabinet est suspendu pour CETTE échéance, préavis publié avant ; le premier cabinet
      ne perd rien ; payer le retard rétablit et prolonge le droit. ✅ Jouée depuis `dev`
      (pile `recette728` du 2026-11-09 — images construites depuis `origin/dev` après fusion, volumes neufs) : `abonnement` vert.
      Au premier passage du 2026-11-09 (28/29), le « cabinet retardataire » était créé par
      `accueil.accueillir`, qui le reclasse distributeur (comptabilité incluse, sans terme, donc
      jamais suspendue). Corrigé dans `prospera-recette` #8 : il s'inscrit en `cabinet`.

## Décisions

- **Suspendre, pas révoquer.** AD-13 du paiement disait « révoquer ». STORY-609 sépare *expiré*
  (se soigne en payant), *suspendu* (se soigne en régularisant) et *révoqué* (sanction). Le PO a
  tranché : suspendre.
- **La recette se fait sans horloge.** Un contrat dont les échéances sont déjà passées a des jalons
  échus (`aLe` dans le passé), et BullMQ les exécute dès qu'ils sont posés. Un constat qui part
  avant son préavis est refusé, puis rejoué au bout de 60 s, puis 120 s : l'attente de la recette
  couvre quatre minutes.
- **Plusieurs contrats sur les mêmes modules** (cas non rencontré) : l'impayé d'un contrat suspend
  les droits des modules de son offre, même si un autre contrat les a prolongés. En revanche, la
  régularisation ne rétablit que la marque de son contrat. Un cabinet n'a qu'un contrat
  aujourd'hui ; à revoir si l'on vend des contrats qui se chevauchent.

## Preuves

- `platform-catalog-service` `MNV-280` (`cc2b907`, `e62ab92`) :
  - 1 013 unitaires et 202 e2e, `tsc` propre, lint propre sur les fichiers touchés (le checkout du
    poste est en CRLF, ce qui fait rougir le lint global sur des `␍`) ;
  - garde de câblage complétée (`SuspensionParImpaye` résolu) ;
  - mutations : sans la garde « sans terme », 1 test rouge ; sans la garde « déjà régularisé »,
    2 tests rouges.
- Les doubles **honorent les filtres** de `findOneAndUpdate` (statut, terme, marque) : un double
  qui les ignorerait prouverait l'inverse.
- `prospera-recette` `MNV-280` (`65ab459`) : l'étape de recette ; #8 (`MNV-280-recette-cabinet`) :
  le retardataire est un vrai cabinet.
- Recette depuis `dev` : abonnement, délégation, distributeur et facturation verts (pile `recette728` du 2026-11-09 — images construites depuis `origin/dev` après fusion, volumes neufs).

## Notes

Voir [[STORY-279]], [[STORY-282]], [[STORY-609]], [[STORY-727]], [[STORY-631]].
