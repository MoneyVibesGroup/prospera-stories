# STORY-339 : La base légale citée mot pour mot sur chaque retraitement — défendre un montant article en main

Status: in-progress — écrite le 2026-11-26 par la session du groupe C juste avant de la coder (lot 7, n° 10 du fiscal,
`PLAN-LOT-7-2026-11-24.md` §3) ; contrat et communs annoncés avant le code (« ⚠ Contrats » et « ⚠ Communs » du journal de
C). Il n'existait pas de fiche : les critères viennent de `epics-fiscalite-2026-08-03.md` (EPIC-032, STORY-339) et du PRD
fiscalité (FR-F55). Elle prolonge l'étape `detail` du chemin d'un montant (STORY-329, D-329-11).

**Epic :** EPIC-032 · **Points :** 3 · **FR :** FR-F55 (chaque retraitement fiscal appliqué est adossé à sa base légale
citée verbatim, depuis le corpus légal packagé) · **Architecture :** AD-1 (le fiscal ne calcule aucun impôt : il cite ce que
le moteur a appliqué), AD-9 (le paquet de l'exercice fait foi), NFR-A06 (aucun texte de loi dans le code)
**Services :** `prospera-fiscal-service` (dossier `obligations`, à C ; communs nommés plus bas) et `balance-service` (la
source du paquet fiscal Togo, à C depuis D-L7-3).
**Après :** STORY-329 (le chemin d'un montant, fiscal #80), STORY-564 (l'article et le millésime sur les éléments du paquet,
garde R11). **Suite :** STORY-338 (la liaison écriture ↔ pièce, comptabilité), STORY-336 de D (le dossier de contrôle, qui
pourra lire ces citations).

## Histoire

En tant qu'**expert-comptable**, je veux que chaque retraitement porte son texte de loi, afin de le défendre article en
main. *(FR-F55)*

## Critères d'acceptation (`epics-fiscalite-2026-08-03.md`, EPIC-032)

1. **Étant donné** un retraitement fiscal appliqué **quand** je consulte sa justification **alors** l'article et son texte
   verbatim sont restitués depuis le corpus packagé.
2. **Étant donné** un retraitement sans base légale au paquet **quand** il est appliqué **alors** il est signalé comme non
   justifié.

## Ce que le code porte déjà (lu sur `origin/dev`, fiscal `94baf9f`, balance `effdc4a`)

| Pièce | Ce qu'elle porte | Où |
|---|---|---|
| Le chemin (329) | l'étape `detail` : la ressource (`TVA`, `TPU`, `IS_ACOMPTE`), les grandeurs **sous le nom du moteur** (`tvaCollectee`, `tvaDeductible`, `tvaEcartee`, `creditAnterieurImpute`, `aPayer`, `tpuCalculee`, `tpuDue`, `theorique`…), la formule, le **tampon du paquet** que le moteur a appliqué (`pays`, `annee`, `checksum`) | `domain/obligations/chemin.ts` |
| Le paquet de l'obligation (326, 327) | `PaquetsService.chargerVersionDeLObligation` : la version exacte de la dérivation, vérifiée par son empreinte ; sous dérogation, la surcouche fusionnée sur sa base (`paquetEffectif`) | `application/obligations/coherence-obligations.service.ts` |
| L'article et le millésime (564) | sur chaque élément de l'IRPP (`article`, `millesime` : « CGI OTR 2025 (LF 2023) »), garde **R11** au packaging ; ailleurs, une `source` en prose (« Art. 195 CGI (taux unique…) ») | `balance-service/scripts/referentiels/` |
| Le corpus | `referentiels/corpus-complet-cgi-lpf-togo.json` (`prospera-stories`, `main` `2af503f0`) : **1 185 articles** (CGI 644, LPF 541), chacun `livre`, `article` (« Art. 196 »), `page`, `texte` verbatim ; extraction automatique du PDF OTR 2025, avertissement à rendre | **packagé nulle part** |

**Ce qui manque** : aucun retraitement ne nomme son article sous une forme qu'on puisse chercher ; le corpus n'est packagé
dans aucun service ; rien ne dit qu'un retraitement appliqué n'a pas de base légale.

## Contrat annoncé avant le code (2026-11-26)

**Ajouts seuls** : un champ neuf de l'étape `detail` du chemin, un bloc neuf du paquet, une clé neuve d'un bloc existant du
paquet. Aucune route, aucun droit, aucun événement ; aucun champ existant ne change ; manifeste `declarations` inchangé ;
aucune route de `balance-service` ne change (le moteur ne lit pas le bloc neuf).

### `GET /api/v1/obligations/{id}/chemin` — `detail.basesLegales` (AC-1, AC-2)

Même route, mêmes rôles, même portée (329). L'étape `detail` gagne **`basesLegales`** `{ statut: RESTITUE | ARRETE |
NON_ATTEINT, motif, message, paquet: { code, version, checksum } | null, corpus: { artefact, source, avertissement,
empreinte, articles }, retraitements: [...] }`, chaque retraitement :

`{ grandeur, montant, libelle | null, justifie, motif | null, message | null, reference: { livre, article, millesime } |
null, aConfirmer | null, citation: { livre, article, page, texte } | null }`.

- **Les retraitements appliqués** : les grandeurs du détail qui sont des retraitements de leur ressource (D-339-1), rendues
  par le moteur avec un montant non nul, dans l'ordre du moteur.
- **`reference`** : l'article et le millésime **comme le paquet les donne** (`basesLegales.retraitements.<RESSOURCE>.<grandeur>`
  du paquet de l'obligation) ; **`citation`** : l'article retrouvé dans le corpus packagé, son `texte` **mot pour mot** et sa
  page (D-339-3).
- **`justifie: false`**, avec un motif d'une liste fermée (AC-2) : `BASE_LEGALE_ABSENTE_DU_PAQUET`,
  `BASE_LEGALE_A_CONFIRMER` (le paquet dit qu'elle reste à confirmer : `aConfirmer` le rend), `BASE_LEGALE_MAL_FORMEE`,
  `ARTICLE_ABSENT_DU_CORPUS`, `MILLESIME_SANS_CORPUS`, `PAQUET_NON_LISIBLE` (le paquet de l'obligation n'est plus octroyé
  ou ne se lit pas), `PAQUET_DU_MOTEUR_DIFFERENT` (le moteur a appliqué un autre paquet que celui de l'exercice : la
  citation reste montrée, elle n'est pas tenue pour la base de ce calcul).
- **L'étape** : `NON_ATTEINT` quand le détail n'est pas restitué ; `RESTITUE` quand chaque retraitement appliqué est
  justifié (aucun retraitement : liste vide) ; `ARRETE RETRAITEMENT_NON_JUSTIFIE` dès qu'un ne l'est pas, ou `ARRETE
  PAQUET_NON_LISIBLE`. Jamais une erreur : le reste du chemin se rend comme avant.

### Le paquet fiscal Togo 2026 (`balance-service`, source et artefact)

- **Bloc neuf `basesLegales`** `{ _note, corpus, retraitements: { <RESSOURCE>: { <grandeur>: { libelle, livre: CGI | LPF,
  article: "Art. N", millesime } | { libelle, aConfirmer } } } }` — `TVA` : `tvaDeductible` (CGI Art. 196), `tvaEcartee`
  (Art. 197), `creditAnterieurImpute` (Art. 204) ; `TPU` : `tpuCalculee` (Art. 133) ; `IS_ACOMPTE` : `theorique`
  (Art. 114) ; millésime « CGI OTR 2025 (LF 2023) ». Garde **R12** au packaging : une entrée porte son livre, son article
  (forme du corpus) et son millésime, **ou** dit ce qui reste à confirmer — jamais les deux, jamais aucun.
- **`irpp.retenueALaSource.reversement.organisme`** = « service des impôts » (LPF Art. 27 : « reversé au plus tard le 15 du
  mois suivant à la caisse du service des impôts »), avec sa source — la demande de D (349 → 331, D-339-8).
- `tva.declaration.reportCredit.source` cite l'Art. 204 (il disait « non extrait de l'édition OTR 2025 ») ; `_meta.revision`
  gagne sa ligne. Nouvelle empreinte, réépinglée ; **B prévenu** (recopie de `dossier-service`), **D prévenu**.

## Persistance et fichiers communs (D-L7-2)

**Aucune migration**, aucune collection. Communs touchés dans le fiscal : **le contrat OpenAPI** (le champ neuf de
`EtapeDetailDto`) ; **la copie du paquet** (`test/fixtures/paquet-fiscal/paquet-fiscal-togo-2026.json`, recopiée à l'octet
de balance-service) ; et, parce que la donnée change, **une attente d'un test de D** :
`src/domain/remuneration/obligations-sociales.spec.ts` (le canal de `RETENUE_IRPP` lu sur la copie du paquet n'est plus
`NON_DECLARE` mais l'organisme nommé ; la logique de D ne change pas). Tout le reste dans les dossiers de C
(`domain/obligations`, `application/obligations`, `modules/obligations/dto`) : le corpus packagé
(`src/domain/obligations/assets/corpus-complet-cgi-lpf-togo.json`, importé : ni `nest-cli.json`, ni `package.json`), la
citation (`domain/obligations/bases-legales.ts`), le chargement du paquet de l'obligation (partagé par la cohérence et le
chemin). Ni `app.module.ts`, ni `read-models/`, ni manifeste.

## Décisions (D-339-n) — prises le 2026-11-26, contestables

- **D-339-1 — Ce qu'est un retraitement dans le chemin.** Une règle du paquet que le moteur applique entre les agrégats de
  la balance et le montant : liste fermée par ressource, lue dans les grandeurs du détail — TVA : `tvaDeductible` (la
  déduction), `tvaEcartee` (l'exclusion du droit à déduction), `creditAnterieurImpute` (l'imputation du crédit antérieur) ;
  TPU : `tpuCalculee` (la TPU établie sur le chiffre d'affaires) ; acompte d'IS : `theorique` (le quart de l'impôt du
  dernier exercice clos). Les agrégats bruts (`tvaCollectee`, `chiffreAffaires`) et les soldes (`soldeBrut`, `aPayer`,
  `tpuDue`…) n'en sont pas. **Appliqué** = rendu par le moteur avec un montant non nul (une TVA écartée nulle n'a rien
  écarté).
- **D-339-2 — La référence vient du paquet, le texte du corpus.** Le paquet nomme l'article et son millésime
  (`basesLegales.retraitements`, en donnée, comme R11 l'a fait pour l'IRPP) ; le texte n'est jamais dans le paquet ni dans
  le code : il est lu dans le corpus packagé, **copie à l'octet** de `prospera-stories/referentiels/corpus-complet-cgi-lpf-togo.json`
  (`main` `2af503f0`, sha256 `0e38f784…d5f7`), qu'un test tient à son origine. Le corpus est importé par le domaine (pas de
  lecture de fichier au démarrage, pas de `nest-cli.json` à toucher).
- **D-339-3 — Mot pour mot, jusqu'à ses défauts.** Le `texte` du corpus est rendu tel quel, avec les restes de l'extraction
  du PDF (un numéro de page, le titre de la section qui suit) : le nettoyer serait le paraphraser. L'avertissement du corpus
  (« à valider contre le code officiel avant tout usage contentieux ») est rendu avec chaque chemin.
- **D-339-4 — Le millésime se compare.** Le corpus packagé est l'édition OTR 2025 qui consolide la loi de finances 2023 :
  millésimes « CGI OTR 2025 (LF 2023) » et « LPF OTR 2025 (LF 2023) » (ceux de R11) ; un test lie cette déclaration au
  `_meta` du corpus et à `_meta.loiDeFinances` du paquet. Un article cité dans un autre millésime n'est pas cité depuis
  celui-ci : `MILLESIME_SANS_CORPUS`.
- **D-339-5 — Non justifié, nommé (AC-2).** Sept motifs fermés ; la référence que le paquet donne reste montrée (on voit ce
  qui ne se retrouve pas). Un retraitement non justifié n'arrête rien d'autre : le chemin se rend, l'étape `basesLegales`
  le dit.
- **D-339-6 — Le paquet lu est celui de l'obligation.** La version de sa dérivation (AD-9, la même que la cohérence lit ;
  surcouche fusionnée sur sa base sous dérogation), comparée au tampon du moteur (empreintes comparées sans le préfixe
  `sha256:`) : si le moteur a appliqué un autre paquet, chaque retraitement est `PAQUET_DU_MOTEUR_DIFFERENT` — la base d'un
  paquet que le moteur n'a pas appliqué n'est pas celle de ce calcul. Un tampon absent ou illisible se traite de même.
- **D-339-7 — Les articles, lus dans le corpus.** CGI Art. 196 (« La taxe sur la valeur ajoutée qui grève les éléments du
  prix d'une opération imposable est déductible… »), Art. 197 (« Sont exclus du droit à déduction… »), Art. 204 (« …l'excédent
  est imputé sur la taxe exigible au titre de la ou des déclarations ultérieures »), Art. 133 (la TPU du régime déclaratif
  établie sur le chiffre d'affaires, celle du forfaitaire selon l'article 135), Art. 114 (quatre acomptes égaux au quart des
  cotisations du dernier exercice clos). Un test vérifie que chaque article cité par le paquet est au corpus.
- **D-339-8 — Demande de D servie (349 → 331).** LPF Art. 27 nomme l'organisme : « à la caisse du service des impôts ».
  `irpp.retenueALaSource.reversement.organisme` = « service des impôts », sa source citée. Le texte ne nomme aucun
  télé-service : ce n'est pas un canal inventé, c'est l'organisme du texte ; le canal de `RETENUE_IRPP` (D-349-4) devient
  cet organisme, et le format `TG × RETENUE-IRPP` reste à D. Aucune question au PO.
- **D-339-9 — Le crédit de TVA.** `tva.declaration.reportCredit.source` disait le régime « non extrait de l'édition OTR
  2025 » ; l'Art. 204 est au corpus : la source le cite. Le moteur ne lit pas ce texte (aucun comportement ne change) ; la
  ligne de `aFaire` qui le reprenait est mise à jour.
- **D-339-10 — Rien n'est stocké.** La citation se compose à la lecture du chemin (paquet de l'obligation + corpus
  packagé) ; une version scellée garde l'empreinte du paquet de sa dérivation, qui suffit à la recomposer.
- **D-339-11 — Hors périmètre, nommé.** Les réintégrations et déductions du résultat fiscal (DSF, `…/fiscal/resultat-fiscal`
  de balance-service) : la DSF n'est pas un montant chiffré du chemin (327) ; leurs codes de liasse n'ont pas d'article au
  paquet, et une saisie de clôture porte déjà sa `baseLegale`. Le passage `tpuCalculee → tpuDue` (minimum, exonération
  temporaire) : le moteur n'en rend pas la grandeur. L'IRPP de D (calcul social) : ses éléments portent déjà leur article
  (R11). L'écran (A, FE-081), le dossier de contrôle (336, D).

## Preuves attendues

Unitaires (Node 24, `-w 2`) : la citation (chaque motif, l'ordre, le non nul, le millésime, la référence montrée), le corpus
packagé (copie à l'octet de l'origine, 1 185 articles, chaque article cité par le paquet retrouvé), le service (le paquet
de l'obligation, sous dérogation, illisible ; le tampon du moteur différent) ; balance-service : R12 (le paquet Togo la
passe, chaque faute refusée), l'artefact régénéré et réépinglé ; e2e (le chemin d'une TVA cite ses articles mot pour mot ;
un retraitement sans base au paquet est non justifié) ; toute la suite du fiscal, celles de D comprises ; mutations sur la
logique neuve ; `docker compose up` du fiscal, sain.

## Progress Tracking

| Date | Événement |
|---|---|
| 2026-11-26 | Fiche écrite, contrat et communs annoncés avant le code. |
