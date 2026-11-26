# STORY-364 : Un dirigeant dont le régime social n'est pas déterminable sort BLOQUÉ, jamais approximé

Status: done (2026-11-26 — prospera-fiscal-service#68, `dev` d41dbe6 ; lot 7 de D, n° 5)

**Epic :** EPIC-034 — Base de rémunération et obligations sociales
**Points :** 3 · **Service :** `fiscal-service` (`:3012`), dossier de D `remuneration` (D-L7-1) :
`src/domain/remuneration/calcul-social.ts`
**FR :** `FR-F25` *(obligation bloquée avec indication de ce qui manque)* · `FR-F30` amendé · `FR-F80` *(bloqué et
motivé)* · `NFR-F04` *(aucune règle dans le code)*
**Décision :** **AD-4** *(une famille sans stratégie refuse, elle n'approxime jamais)* — `architecture-fiscal-service-2026-08-03`
**Origine :** **arbitrage PO du 2026-08-15** sur `tickets/TICKET-BACKEND-dirigeants-et-associes-hors-regime-salarial.md` — « IRPP oui, CNSS différée » ;
**mise à jour le 2026-11-25** après STORY-348 (D-564-5, D-348-2) : voir « Ce que 348 livrait déjà ».
**Dépendances :** **STORY-345** ✅ *(la base porte le type de bénéficiaire)* · **STORY-348** ✅ *(le calcul s'aiguille
dessus ; prospera-fiscal-service#67, `dev` `bc0c09f`)*
**Débloque :** STORY-349 (les obligations sociales au calendrier ; attend aussi STORY-319 de C).

---

## Pourquoi cette story existe

L'arbitrage du 2026-08-15 coupe le périmètre **au sourcing, pas au bénéficiaire** :

| Volet | v1 |
| --- | --- |
| IRPP salariés (Art. 74) | ✅ (348, par le calcul de C) |
| IRPP gérants / associés (**Art. 28, 75**) | ⛔ **bloqué et motivé** — le barème est commun, pas la base (D-564-5, ci-dessous) |
| Affiliation et cotisations **CNSS des gérants** | ⏸️ **non sourcé** (`cnss.aCompleter` : « affiliation et cotisations des gerants ») |
| Revenus distribués (**Art. 79**) | ⏸️ **non sourcé** (`irpp.revenusCategoriels.nonCouverts` : `CAPITAUX_MOBILIERS`) |

Il existe donc, **par construction et pour un temps indéterminé**, une catégorie de bénéficiaire dont le **volet social
ne se calcule pas**. Cette story décide ce que le système fait dans ce cas — et ce qu'il ne fait **jamais**.

> ⚡ Sans elle, l'arbitrage produit exactement le défaut qu'il voulait corriger : le gérant entre dans la base et la
> cotisation sociale sort **à zéro ou au régime salarié** — un chiffre plausible que rien ne pince. Le silence aurait
> simplement changé d'endroit.

## Ce que 348 livrait déjà, et ce qui manquait (mesuré le 2026-11-25 sur `dev` `bc0c09f`)

| Exigence de 364 | 348 | Ce que 364 livre |
| --- | --- | --- |
| Cotisations d'un `DIRIGEANT` / `ASSOCIE` `BLOQUEE`, sans montant | ✅ `REGIME_SOCIAL_NON_DETERMINE`, aucun champ chiffré | gardé |
| ⛔ Jamais le régime salarié par défaut | ✅ mais **par une liste codée** (`TYPES_AU_REGIME_SALARIE = ['SALARIE']`) | la règle devient une **donnée du paquet** ; le non-repli est tenu par un test et une mutation |
| Le motif nomme **ce qui manque au paquet** | ❌ `objet: 'typeBeneficiaire DIRIGEANT'`, un texte du code (« aucun régime social n'est déterminé… ») qui ne nomme ni le paquet ni la clé | le chemin du paquet (`cnss.affiliation.DIRIGEANT`), le paquet (`code`, `version`), ce que le paquet déclare à compléter (`cnss.aCompleter`, cité) et **qui lève le blocage** |
| L'absence **lue à l'artefact**, déblocage **sans livraison** | ❌ aucun paquet ne pouvait débloquer un dirigeant | `cnss.affiliation.<TYPE>` lue au paquet : la déclarer débloque, sans recompiler (test) |
| IRPP du dirigeant | ✅ `BLOQUEE`, `REVENU_CATEGORIEL_NON_COUVERT` (`REMUNERATION_GERANT`, Art. 28) | inchangé (D-364-2) |
| `ASSOCIE` et distribution (Art. 79) | ✅ en partie (IRPP de l'associé bloqué ; Art. 79 refusé par le calcul de C) | la preuve qu'une distribution n'entre pas dans la base (D-364-7) |
| L'agrégat d'une période qui contient une ligne bloquée | ✅ `totaux.lignesBloquees`, totaux des seules lignes calculées | la preuve que la ligne bloquée n'ajoute **rien** aux totaux (D-364-8) |
| 100 % `SALARIE` : rien ne change | ✅ | les tests de 348 passent **sans changement** ; un paquet qui déclare l'affiliation des dirigeants ne change rien à un dossier de salariés |

## Ce que la story livre

Le refus **sourcé** : quand une ligne porte un bénéficiaire dont le régime d'affiliation n'est pas déclaré au paquet
fiscal, ses cotisations sortent **`BLOQUEE`** (`REGIME_SOCIAL_NON_DETERMINE`), avec le manque **du paquet** écrit en
toutes lettres ; et le jour où le paquet déclare ce régime, la ligne se calcule **sans livraison de code**.

## Décisions

- **D-364-1 — Ce qui manquait à 348** : le tableau ci-dessus. 364 ne change que `calcul-social.ts` (la lecture de
  l'affiliation) et ses tests ; ni route, ni forme de réponse, ni motif neuf.
- **D-364-2 — L'IRPP du dirigeant reste bloqué.** L'ancien premier critère (« l'IRPP du dirigeant aboutit normalement,
  au barème de l'Art. 74/75 ») **tombe** : il est remplacé par D-564-5 (fiche 348) — le barème est commun (Art. 75),
  pas la base (Art. 28 : frais forfaitaires de 20 % sur 10 000 000 au plus, revenu net sans abattement) ; le paquet
  déclare `REMUNERATION_GERANT` non couvert et le calcul de C le rend `BLOQUEE`, nommément. Le jour où le paquet couvre
  l'Art. 28, c'est une story du calcul de C. 364 ne touche pas l'IRPP.
- **D-364-3 — La règle d'affiliation est une donnée du paquet.** Le calcul lit `cnss.affiliation.<TYPE>` —
  `{ regime, source }` — pour `DIRIGEANT` et `ASSOCIE`. `SALARIE` relève **par définition** du régime salarié du
  paquet (`cnss.branches.salarie`, dont la ventilation porte le nom) : c'est le seul lien que le code pose, et il n'est
  pas lu (un dossier de salariés ne dépend d'aucune clé neuve, d'où aucune régression). ⛔ Aucun autre type n'est
  supposé au régime salarié.
- **D-364-4 — L'absence est lue à l'artefact, et `cnss.aCompleter` est cité, jamais analysé.** Le refus naît de
  l'**absence de la déclaration** au paquet (`cnss.affiliation.<TYPE>` absente ou `null`) ; le texte que le paquet
  écrit lui-même à compléter (`cnss.aCompleter`, une phrase ou une liste de phrases) est **recopié tel quel** dans le
  motif. Il n'est pas analysé : chercher le mot « gerants » dans une phrase libre serait une règle cachée dans le code,
  et un paquet qui reformule sa phrase débloquerait sans rien déclarer. Sans `cnss.aCompleter`, le refus tient, sans
  citation.
- **D-364-5 — Le motif rendu.** `{ statut: 'BLOQUEE', motif: 'REGIME_SOCIAL_NON_DETERMINE', manques: [{ objet:
  'cnss.affiliation.DIRIGEANT', manque }] }`, où `manque` dit, dans cet ordre : *le régime d'affiliation CNSS des
  dirigeants (gérants)* [*des associés*] *n'est pas défini dans le paquet fiscal-tg-entreprise 2026.1
  (cnss.affiliation.DIRIGEANT)* ; *ce que le paquet déclare à compléter : « … »* (la citation de D-364-4) ; *ses
  cotisations ne sont pas chiffrées, et jamais au régime salarié* ; *le blocage se lève au paquet fiscal, sans
  livraison : aucune saisie de la base ne le lève*. Le cabinet n'a rien à fournir dans la base pour le lever : c'est
  le paquet qui manque, et le texte le dit, plutôt que de laisser chercher une erreur de saisie. Le code du motif et la
  forme de la réponse sont ceux de 348 : **aucun contrat ne change**.
- **D-364-6 — Le déblocage, et ce qui reste bloqué.** `cnss.affiliation.DIRIGEANT: { regime: 'salarie', source:
  '<texte>' }` ⇒ les cotisations des dirigeants se calculent au régime salarié du paquet (branches, plancher SMIG,
  plafond, AMU : le même calcul que pour un salarié), **sans livraison** ; l'IRPP reste bloqué (D-364-2), l'associé
  aussi tant que sa propre clé manque. La déclaration est **par type** : un gérant minoritaire et un gérant majoritaire
  sont tous deux `DIRIGEANT` (D-348-2), le paquet les déclare ensemble. Toute autre déclaration bloque, nommément,
  motif `PAQUET_INCOMPLET` : une déclaration sans `regime` ou sans `source` (une règle sans texte ne se suit pas) ; un
  régime autre que `salarie` (par exemple `travailleurIndependant`, dont le paquet ne donne ni part employeur ni part
  salarié, et dont l'assiette n'est pas un salaire) — son calcul est une story, pas une donnée.
- **D-364-7 — `ASSOCIE` et distribution (Art. 79).** Une distribution n'est pas une rémunération : elle **n'entre pas**
  dans la base (une rubrique `dividendes` est refusée `RUBRIQUE_INCONNUE`, rien n'est écrit) et ne peut donc pas être
  chiffrée par le calcul social. La retenue de l'Art. 79 n'est pas écrite : le paquet déclare `CAPITAUX_MOBILIERS` non
  couvert et le calcul de C le refuse nommément (`irpp-traitements-salaires.spec.ts`, Art. 79 et 80). La ligne de
  rémunération d'un associé sort cotisations bloquées (motif sourcé) et IRPP bloqué (`REMUNERATION_GERANT`).
- **D-364-8 — L'agrégat d'une période.** Inchangé depuis 348 : les totaux sont la somme des seules lignes calculées,
  et `totaux.lignesBloquees` compte les lignes bloquées par volet. Aucun champ neuf (un drapeau « complet » doublerait
  `lignesBloquees`, et changerait le contrat pour aucune information) ; la preuve est que les totaux d'une période
  « salarié + dirigeant bloqué » sont **égaux, à l'unité**, à ceux du salarié seul : la ligne bloquée n'y ajoute ni
  zéro chiffré ni approximation.
- **D-364-9 — Contrat, communs, demandes.** Aucune route, aucun champ, aucun motif neuf ; aucun fichier commun ; aucune
  migration. **→ C (information, non bloquante)** : la clé que le calcul lit, `cnss.affiliation.<TYPE>` `{ regime,
  source }`, à écrire au paquet le jour où l'affiliation des gérants sera sourcée (relecture du bloc `cnss` par un
  fiscaliste, geste de l'utilisateur, plan §8).

## Critères d'acceptation

- **Étant donné** un bénéficiaire `DIRIGEANT` **quand** l'IRPP est calculé **alors** il sort `BLOQUEE`
  (`REVENU_CATEGORIEL_NON_COUVERT`, `REMUNERATION_GERANT`, Art. 28) avec le manque écrit au paquet — *(remplace
  l'ancien critère « aboutit normalement », D-364-2)*.
- **Étant donné** ce même bénéficiaire **quand** les cotisations sociales sont calculées **alors** elles sortent
  **`BLOQUEE`**, et **jamais** avec un montant.
- **Étant donné** une cotisation bloquée **quand** le cabinet la consulte **alors** le motif nomme **ce qui manque dans
  le paquet**, pas une erreur technique : « le régime d'affiliation CNSS des dirigeants (gérants) n'est pas défini dans
  le paquet fiscal-tg-entreprise 2026.1 (cnss.affiliation.DIRIGEANT) », la citation de `cnss.aCompleter`, et que le
  blocage se lève au paquet — vérifié **sur le texte rendu** (domaine et HTTP).
- ⛔ **Étant donné** un bénéficiaire `DIRIGEANT` **quand** aucune règle d'affiliation n'existe **alors** le système
  **n'applique PAS le régime salarié par défaut**, même sur un paquet dont le régime salarié est complet.
- **Étant donné** le paquet fiscal **quand** on y cherche le régime des gérants **alors** l'absence est **lue depuis
  l'artefact** (`cnss.affiliation`, `cnss.aCompleter` cité), jamais codée en dur : un paquet de test qui déclare
  `cnss.affiliation.DIRIGEANT` **débloque** la ligne sans livraison de code.
- **Étant donné** un bénéficiaire `ASSOCIE` et une distribution **quand** l'obligation Art. 79 est demandée **alors**
  même traitement : la distribution n'entre pas dans la base, la retenue de l'Art. 79 est refusée nommément par le
  calcul de C, la ligne de l'associé sort bloquée et motivée.
- **Étant donné** une période qui contient une ligne bloquée **quand** les totaux sont lus **alors** ils sont ceux des
  seules lignes calculées, et `lignesBloquees` compte la ligne.
- **Étant donné** un dossier dont **tous** les bénéficiaires sont `SALARIE` **quand** le calcul social s'exécute
  **alors** **rien ne change** par rapport à 348.

## Ce que cette story ne fait PAS

- ⛔ Elle **n'invente aucun taux**, aucune assiette, aucune règle d'affiliation. Le paquet déclare lui-même
  `cnss.aCompleter`. ⚡ Précédent : **STORY-172** a refusé d'inventer `longueurCompteDetail` pour CIMA, et
  `TICKET-BACKEND-classes-de-gestion-non-sourcees-par-referentiel` montre le coût de s'en écarter — un résultat
  comptable **doublé** (280 M au lieu de 140 M, mesuré), sans témoin.
- ⛔ Elle ne modifie pas le paquet (à C, D-L7-3), ni le calcul de l'IRPP (C), ni la route ou la forme de la réponse
  (348).
- ⛔ Elle ne rouvre pas le bornage « sans devenir un logiciel de paie », ni le type de bénéficiaire (345), ni son
  aiguillage (348) : elle porte ce qui se passe quand l'aiguillage ne trouve pas de règle.

## Definition of Done

- [x] Un dirigeant produit un IRPP bloqué et motivé par le paquet et **aucune** cotisation sociale chiffrée.
- [x] Le motif de blocage nomme le manque du **paquet**, et un test le vérifie sur le **texte rendu** (domaine et e2e),
      pas seulement sur le statut.
- [x] **Test de non-repli** : muter le code pour qu'il applique le régime salarié à un dirigeant sans déclaration doit
      faire **virer un test au rouge**.
- [x] Déclarer `cnss.affiliation.DIRIGEANT` dans un paquet de test **débloque** la ligne **sans recompiler**.
- [x] Les tests de 348 passent sans changement (hors l'`objet` du manque, qui devient le chemin du paquet).

## Livraison (2026-11-26)

- **Code** : prospera-fiscal-service#68, fusionnée en rebase sur `dev` (`d41dbe6`, contenu identique à la tête poussée
  `0a8c20c`). Aucune annonce avant le code : ni contrat ni fichier commun ne bouge (D-364-9).
- **Fichiers** (dossier `remuneration` de D) : `src/domain/remuneration/calcul-social.ts` (`lireAffiliation`, la
  citation de `cnss.aCompleter`, la liste codée `TYPES_AU_REGIME_SALARIE` retirée) et son test ;
  `test/remuneration-import.e2e-spec.ts` (l'`objet` du manque devient `cnss.affiliation.DIRIGEANT`, le texte rendu par
  HTTP et le déblocage par un paquet de test).
- **Communs** (D-L7-2) : aucun. Aucune migration.
- **Preuves** :
  - Node 24 (image `verification` de l'archive LF de `0a8c20c`) : unitaires 203/203 suites, 2 958 tests (1 ignoré) ;
    e2e 13/13 suites, 273 tests. Pas de `test:conformite` (le stockage ne change pas) ni de compose (§1.5 : aucun
    module, dépendance ni Dockerfile).
  - Node 25 : rémunération 148/148 (5 suites ; 137 avant 364, les tests de 348 inchangés), e2e de la base 31/31.
  - **Mutations 10/10 rouges sur une assertion** : repli sur le régime salarié sans déclaration (le test de non-repli
    de 348 et celui de 364 rougissent), affiliation ignorée par les cotisations, clé nulle prise pour une déclaration,
    citation de `cnss.aCompleter` retirée, citation codée en dur, source non exigée, tout régime déclaré accepté, paquet
    non nommé dans le motif, « qui lève le blocage » non dit, liste `aCompleter` ignorée. (Six d'entre elles ne
    compilaient pas au premier essai : réécrites pour compiler et rejouées, piège (1) au journal de D.)
  - Cas chiffré à la main : un dirigeant déclaré au régime salarié à 500 000 cotise 112 500 / 45 000 (domaine) ; à
    450 000, 101 250 / 40 500 (HTTP). Son IRPP reste `BLOQUEE` (`REMUNERATION_GERANT`).
  - Lint des fichiers touchés, `tsc`, `nest build` : 0. Verrou Docker pris à 00:38 et rendu à 00:42 par le `trap` du
    script autonome.
- **Ce qui reste** : `cnss.affiliation` au paquet, le jour où l'affiliation des gérants sera sourcée (→ C, information ;
  relecture du bloc `cnss` par un fiscaliste, geste de l'utilisateur) ; `cnss.collecte` (→ C, toujours ouverte, 348) ;
  l'Art. 28 (la base des gérants) et l'Art. 79 au paquet et au calcul de C.
