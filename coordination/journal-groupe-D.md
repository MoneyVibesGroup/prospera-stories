# Journal du groupe D

> Écrit par le groupe D seulement. Lot 1 : `PLAN-4-SESSIONS-2026-11-14.md` §6 (le frontend, jamais commencé). **Lot 2 :
> `PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §5 (backend : `reseau-service`, puis le socle du distributeur).**

## État

### Lot 7 (ouvert le 2026-11-25) — `PLAN-LOT-7-2026-11-24.md` §4

- **Plan** : le dépôt, le social et le premier dépôt réel, **18 stories, 95 points**, dans l'ordre du tableau §4 :
  **560** (le coffre des secrets de canal, amende AD-13) → 346 → 347 → 348 → 364 → 349 → 330 → 331 → 332 → 333 → 334 →
  335 → 336 → 337 → 561 → 562 → 565 → **1102** (le premier dépôt réel). Attentes de C (plan §5) : 348 attend 564, 349
  attend 319, 330 attend 325, 337 attend 338, 565 attend 341 — une story qui attend C s'écrit « → C : … — ouverte » et
  la session de groupe décide de la suite. Aucun identifiant neuf (plan §7).
- **Le fiscal partagé par dossier avec C** (D-L7-1 → 3) : dossiers de D `depots`, `livrables-depot`, `paquets-depot`,
  `completude-depot`, `remuneration` et le coffre des secrets de canal (`coffre-secrets`, créé par 560) ; dossiers de
  C : `echeances`, `obligations`, `familles`, `qualification`, `paquets`, `redevables`, le futur `reglement` et les
  autres déjà là. **Fichiers communs** (`app.module.ts`, manifeste `declarations`, contrat OpenAPI, `package.json`,
  migrations, `read-models/`, copies du paquet) : dits dans la PR, rebasée sur `origin/dev` juste avant la fusion, et
  dans « ⚠ Communs » ci-dessous **avant** la fusion ; une seule migration en vol. Le paquet fiscal est à C (D-L7-3).
- **Poste** : l'autre poste (`C:\Users\USER\…`), **B, C et D sur le même poste et le même verrou Docker**
  (`MoneyVibes_Apps\.verrou-docker`, pris par `noclobber`, rendu par un `trap EXIT` dans un script autonome ; B et C
  prévenus à chaque reddition). Le fiscal de D se travaille dans le worktree **`_wt-d-fiscal`** (jamais le checkout
  `prospera-fiscal-service`, que C emploie), remis en HEAD détachée sur `origin/dev` à la fin de chaque story. Aucun
  `.env` sur ce poste : les tests posent leurs variables. Une sous-session neuve par story (`REGLES-DES-GROUPES.md`
  §1.2).
- **Non placé des réponses du 25/11 — à placer par l'utilisateur** : `zone-franche-togo@1.1` (« au lot 7 », sans
  numéro au tableau §4) ; Q-D-14 (les seuils des seize indicateurs, cherchés et modifiables) ; Q-D-15 (le numéro de
  compte imprimable) ; Q-D-19 (l'export C13 aussi en CSV). Aucune story de ce lot ne les porte.
- **Amendement du 26/11** (consigne de l'utilisateur, plan §4 bis) : D-1078-10, Q-D-14, Q-D-19 et Q-D-15 entrent au lot 7
  de D, ce qui fait **22 stories**. Ce sont **STORY-1138** (le rapprochement liasse ↔ balance par l'empreinte, bilan),
  **1139** (les repères des seize indicateurs, sourcés et modifiables, bilan), **1140** (l'export C13 aussi en CSV,
  bilan ; → B : le contrat) et **1141** (le numéro de compte imprimable : paiement par une passation de B limitée à la
  story, puis ventes). Elles passent pendant que D attend C (349 attend 319, 330 attend 325). Dès qu'une des deux est
  fusionnée, D reprend le tableau §4. `zone-franche-togo@1.1` reste à placer par l'utilisateur.
  **→ B : passation de `prospera-paiement-service` limitée à STORY-1141 — servie (#936, e2be149).**
- **STORY-560** ✅ 🔐 — le coffre des secrets de canal, adossé au mandat écrit du client, **AD-13 amendé**
  (prospera-fiscal-service#63, `dev` `cf8b583` ; annonce avant le code #905, `main` 0f4dae3 : fiche D-560-1 → 15, AD-13
  amendé dans la spine du fiscal ; communs complétés avant la fusion #908, `main` 5a2f26c). Rituel (2026-11-25) :
  aucune demande neuve à D chez A, B et C ; passation de C constatée (« Passations ») ; aucune PR ouverte sur le
  fiscal, aucune migration en vol chez C.
  - **Livré** (module neuf `coffre-secrets`, dossiers de D) : le mandat de canal spécifique (actes `DEPOSER`, `SUIVRE`,
    dates), vérifié à chaque usage ; le lien de dépôt (72 h, usage unique) que le cabinet remet au client ; le dépôt du
    secret par le client sur une route publique (jeton dans le corps, tout autre champ refusé, un code MFA compris) ;
    la révocation souveraine (client par son jeton, ou cabinet sur instruction) qui efface le chiffré, annule jetons et
    liens et fait retomber le canal sur l'assisté ; l'état du canal (`AUTOMATISABLE` | `ASSISTE` et sa raison,
    échéances à 15 jours). AES-256-GCM en enveloppe sous `COFFRE_CLE_MAITRE` (jamais en base ; absente :
    `NON_CONFIGURE`, le service démarre ; mal formée : refus de démarrer). Port **`UsageSecretDeCanal`** pour 561 (jeton
    d'usage 5 min, usage unique, lié à un dépôt ; le clair n'existe que dans le rappel). Journal chaîné
    `coffre:<dossier>_<canal>` sans valeur, fragment ni jeton. Garde AD-13 structurelle ; le dépôt assisté n'importe
    pas le coffre.
  - **Communs** (D-L7-2, annoncés avant la fusion) : `app.module.ts`, `common/filters/all-exceptions.filter.ts`
    (`CORPS_ILLISIBLE` : un `JSON.parse` en échec ne recopie plus un extrait du corps, pour tout le service),
    `domain/habilitations/natures-acces.ts` (`COMPTE_DE_CANAL` → `COFFRE_SEUL`), `garde-routes-ecriture.spec.ts`,
    `.env.example`, contrat OpenAPI. Aucune migration.
  - Preuves : Node 24 (image de l'archive LF) unitaires **199/199 suites, 2 816 tests**, e2e **12/12, 242**,
    **`test:conformite` 17/17, 109** (coffre : 7, dont usages et dépôts parallèles ⇒ un seul) ; **mutations 15/15** ;
    `docker compose -p grp-d` du fiscal sain, routes du coffre jouées, 0 fragment du témoin dans 449 lignes de
    journal, clé mal formée ⇒ refus de démarrer.
  - Décisions D-560-1 → 15 (fiche ; « Ce qui reste » : envoi du lien par `notification`, liste des échéances du
    cabinet, rotation de la clé maîtresse, purge du chiffré d'un secret expiré, la clé d'un environnement réel —
    geste de l'utilisateur —, la note périmée du manifeste `declarations`). **Verrou Docker : attendu (C puis B), pris à
    20:29, une seule prise, rendu à 20:42 par le `trap` du script autonome ; B et C prévenus ; aucun conteneur, volume
    ni réseau `grp-d`.** (Une coupure réseau de l'API a interrompu la sous-session pendant le code, sans verrou tenu ;
    reprise sans perte.)
  - **Suivante : STORY-346** (l'import d'un fichier de paie, idempotent et versionné ; `remuneration`, dossier de D ;
    fiche à écrire depuis `epics-fiscalite-2026-08-03.md` juste avant de coder).

- **STORY-346** ✅ 📥 — l'import d'un fichier de paie, idempotent et versionné (prospera-fiscal-service#64, `dev`
  `e4630f1` ; annonce avant le code #915 : fiche D-346-1 → 11, ⚠ Contrats, ⚠ Communs, Q-D-21). Rituel (2026-11-25) :
  aucune demande neuve à D chez A, B et C ; aucune PR ouverte ni migration en vol sur le fiscal.
  - **Livré** (dossier `remuneration`) : `POST /api/v1/dossiers/{dossierId}/remuneration/{periode}/import` (droit
    `PREPARER`, multipart `fichier`, 2 Mio, mémoire seule) ; le **gabarit de Prospera** (`fichier-de-paie.ts`, pur) :
    CSV UTF-8 (BOM), `;` `,` ou tabulation, guillemets RFC 4180, en-tête **fermé** aux noms des champs de la saisie,
    montants en francs CFA entiers, colonne `periode` comparée ; **tout ou rien** : chaque ligne jugée par la règle de la
    saisie (`validerLigne`, extraite de `validerBase`), une erreur ⇒ 422 `IMPORT_REFUSE` qui nomme chaque ligne (100 au
    plus), rien d'écrit ; **le même chemin que la saisie** (`ecrire`, provenance `IMPORT`) : même fichier ⇒ 200
    `INCHANGEE`, fichier corrigé ⇒ version suivante, l'antérieure lisible. Aucun écart au contrat annoncé.
  - **D-346-12** : la garde AD-13 de 560 (« une seule route reçoit un fichier ») admet la route d'import, parce que
    l'en-tête est fermé (une colonne `motDePasse` refuse le fichier avant toute lecture de cellule).
  - **Communs** (D-L7-2, annoncés avant le code) : le contrat OpenAPI seul (une route neuve). Aucune migration.
  - Preuves : Node 24 unitaires 200/200 suites, 2 863 tests (sur e402ba1), e2e **13/13, 253**, **`test:conformite` 18/18, 114** (import de paie : 5,
    dont 1 000 lignes en une version, trois imports parallèles ⇒ une, 1 000 lignes dont une fautive ⇒ aucune écriture) ;
    **mutations 16/16** ; `docker compose -p grp-d` du fiscal sain, route montée, import sans jeton 401. **Verrou
    Docker** : pris à 21:20 (première passe : unitaires, e2e, conformité, compose), rendu à 21:31 par le trap ; repris à 21:40 après C (seconde passe : unitaires de la tête corrigée), rendu à 21:47 ; B et C prévenus ; aucun conteneur, volume ni réseau grp-d.
  - **Q-D-21** (l'outil de paie réel) : choix par défaut, le gabarit. **→ A** (plus tard) : l'écran d'import et son
    rapport d'erreurs.
  - **Suivante : STORY-347** (la saisie manuelle de la base de rémunération ; `remuneration`, dossier de D ; fiche à
    écrire depuis `epics-fiscalite-2026-08-03.md` juste avant de coder ; la saisie et l'import passent déjà par la même
    écriture).

- **STORY-347** ✅ ✍️ — la saisie manuelle de la base de rémunération (prospera-fiscal-service#65, `dev` `4a1d938` ;
  fiche écrite juste avant le code, D-347-1 → 6 ; aucune annonce : ni contrat ni fichier commun ne bouge). Rituel
  (2026-11-25) : aucune demande neuve à D chez A, B et C (une information de C, D-1021-7 : balance sert l'export d'instance
  en CSV par objet, bilan pourra prendre la même forme) ; aucune PR ouverte ni migration en vol sur le fiscal.
  - **Ce qui existait déjà** (345, 346) : la route de saisie `PUT …/remuneration/{periode}`, l'écriture unique `ecrire`
    (saisie `SAISIE`, import `IMPORT`), le document sans provenance, la provenance par version servie aux lectures.
    **Pas de route neuve** (D-347-1, AD-20 : un seul chemin d'écriture).
  - **Livré** (dossier `remuneration`) : la désignation en **NFC** pour les deux chemins (D-347-2 : un nom saisi en NFD
    et le même importé en NFC font le même document) ; **`RemunerationService.baseDuCalcul`** : la base qu'un calcul
    lit, jamais des lignes sans leur `origine` (`version`, `provenance`, `empreinte`, `constitueeLe` ; ni auteur ni nom),
    que 348 recopiera (D-347-4) ; l'origine est celle du contenu (une saisie égale à un import reste `IMPORT`,
    D-347-5) ; **l'e2e de la saisie**, qui n'existait pas (gardes, 201 / 200 / version 2, 422, 400 hors contrat,
    parité avec l'import dans les deux sens et en NFD, provenance au détail, aux versions et aux totaux) ; la
    conformité (import puis saisie ⇒ une version ; `baseDuCalcul` ⇒ `IMPORT` puis `SAISIE`, empreintes des en-têtes).
  - **Communs** : aucun. Aucune migration.
  - Preuves : Node 24 unitaires 200/200 suites, 2 870 tests (1 ignoré), e2e 13/13 suites, 261 tests, **`test:conformite` 18/18 suites, 115 tests** ; Node 25 : domaine et service 95/95,
    e2e de la base 19/19 ; **mutations 7/7** ; lint, `tsc`, build 0 ; pas de compose (§1.5 : aucun module, dépendance ni
    Dockerfile). **Verrou Docker** : pris à 22:08 (une seule passe : unitaires, e2e, conformité), rendu à 22:13 par le trap du script autonome ; B et C prévenus ; aucun conteneur, volume ni réseau grp-d.
  - **→ A** (plus tard) : l'écran de saisie part de la dernière version et renvoie la base entière (D-347-6), les types
    par une liste (D-347-3).
  - **Suivante : STORY-348** (le calcul des cotisations et des retenues, aiguillé sur le type de bénéficiaire ; fiche à
    relire et mettre à jour ; elle lit la base par `baseDuCalcul`). **Elle attend STORY-564 de C** (le barème IRPP au
    paquet, et la recopie du paquet fiscal dans le service, plan §6) : 564 **en cours** chez C (fiche relue, D-564-1 → 12, et annonce avant le code, `main` 1d64753 ; branche `MNV-564` du fiscal, recopie du paquet comprise ; C préviendra D à la fusion). La session de groupe de D décide de la
    suite : les autres stories de D attendent 348 (364, 349) ou C (330 ← 325, puis 331 → 337 et 561 → 565).

- **STORY-348** ✅ 🧮 — le calcul des cotisations et des retenues, aiguillé sur le type de bénéficiaire
  (prospera-fiscal-service#67, `dev` `bc0c09f` ; annonce avant le code #925, `main` 20705a8 : fiche D-348-1 → 12,
  ⚠ Contrats, ⚠ Communs, Q-D-22). Rituel (2026-11-25) : aucune demande neuve à D chez A, B et C ; aucune PR ouverte ni
  migration en vol sur le fiscal. **← C : 564 — servie** (prospera-fiscal-service#66, `dev` `fd34834` ;
  balance-service#168 `c9e94c6` ; annonce #921, clôture e2dc974 ; paquet LF sha256 `bfcc3fc9…c065`).
  - **Livré** (dossier `remuneration`) : `calcul-social.ts` (pur) — les trois branches de `cnss.branches.salarie`
    contrôlées contre `cnss.tauxEmployeur` / `tauxSalarie`, **le plancher SMIG** du paquet, **aucun plafond** (le paquet
    le dit ; un plafond chiffré s'appliquerait sans livraison), **l'AMU** (5 % + 5 %, sur le brut) ; la **retenue
    d'IRPP du mois** par `calculerIrppTraitementsSalaires` de C (importé, non modifié), le mois annualisé puis ÷ 12
    (D-348-7) ; les échéances lues au paquet (retenue d'IRPP au 15 du mois suivant ; cotisations `NON_DECLAREE` tant
    que `cnss.collecte` manque). Aiguillage : `DIRIGEANT` / `ASSOCIE` jamais au régime salarié, IRPP sur
    `REMUNERATION_GERANT` non couvert (D-564-5). `personnesACharge` facultatif sur la ligne (saisie, import, détail,
    stockage `null`) : sans lui, retenue `CHARGES_DE_FAMILLE_NON_RENSEIGNEES` ; empreinte d'avant 348 inchangée.
    `CalculRemunerationService` (exporté pour 350) et `GET …/remuneration/{periode}/calcul` (`PREPARER`). Aucun écart
    au contrat annoncé.
  - **Communs** (D-L7-2, annoncés avant le code) : le contrat OpenAPI seul. Aucune migration. Lus sans écriture :
    `domain/familles/irpp-traitements-salaires.ts`, `decimal-exact.ts` (C).
  - Preuves : Node 24 unitaires 203/203 suites, 2 947 tests (1 ignoré), e2e 13/13 suites, 272 tests, **`test:conformite` 18/18 suites, 116 tests** ; Node 25 : rémunération 137/137, e2e de
    la base 30/30 ; **mutations 15/15** ; cas chiffré à la main (500 000, 2 personnes : 112 500 / 45 000, retenue
    11 008) ; §1.5 : `docker compose -p grp-d` du fiscal (image runtime de l'archive LF) sain, `GET …/calcul` montée, 401 sans jeton, 0 `UnknownDependencies` sur 444 lignes de journal. **Verrou Docker** : attendu (C, STORY-1022), pris à 23:19 (une seule passe : unitaires, e2e, conformité, compose), rendu à 23:30 par le trap du script autonome ; B et C prévenus ; aucun conteneur, volume ni réseau grp-d.
  - **→ C : `cnss.collecte` au paquet — ouverte** (« Demandes aux autres groupes »). **Q-D-22** (AMU : collecte par la
    CNSS, part salariale hors base de l'IRPP) : choix par défaut appliqué. **→ A** (plus tard) : l'écran du calcul et
    `personnesACharge` à la saisie.
  - **Suivante : STORY-364** (un dirigeant dont le régime social n'est pas déterminable sort BLOQUÉ, jamais approximé ;
    fiche à relire et mettre à jour ; elle remplace le motif `REGIME_SOCIAL_NON_DETERMINE` de 348 par le refus sourcé
    au paquet, `cnss.aCompleter`, et le déblocage sans livraison ; le calcul est dans `domain/remuneration/calcul-social.ts`).

- **STORY-364** ✅ 🚧 — un dirigeant dont le régime social n'est pas déterminable sort BLOQUÉ, jamais approximé
  (prospera-fiscal-service#68, `dev` `d41dbe6` ; fiche relue et mise à jour juste avant le code, D-364-1 → 9 ;
  aucune annonce : ni contrat ni fichier commun ne bouge). Rituel (2026-11-25, reprise le 26/11) : aucune demande neuve à D chez A, B et
  C ; aucune PR ouverte ni migration en vol sur le fiscal (C est sur STORY-1023, dans `balance-service`).
  - **Mesuré avant le code** (sur `dev` `bc0c09f`) : 348 rendait déjà le dirigeant et l'associé `BLOQUEE`
    (`REGIME_SOCIAL_NON_DETERMINE`, aucun montant) et leur IRPP bloqué (`REMUNERATION_GERANT`, D-564-5), et ses totaux
    comptaient les lignes bloquées. **Manquaient** : un motif qui nomme le **paquet** (348 rendait `objet:
    'typeBeneficiaire DIRIGEANT'`, un texte du code), l'absence **lue à l'artefact** (348 : une liste codée
    `['SALARIE']`) et le **déblocage sans livraison** (aucun paquet ne pouvait débloquer un dirigeant). L'ancien premier
    critère (« l'IRPP du dirigeant aboutit normalement ») tombe, remplacé par D-564-5 (D-364-2).
  - **Livré** (`domain/remuneration/calcul-social.ts`, dossier de D) : `lireAffiliation` — l'affiliation d'un
    `DIRIGEANT` ou d'un `ASSOCIE` se lit au paquet, **`cnss.affiliation.<TYPE>` `{ regime, source }`** ; `SALARIE` au
    régime salarié par définition (D-364-3). Sans déclaration : `BLOQUEE`, `objet: 'cnss.affiliation.DIRIGEANT'`, et le
    texte rendu dit « le régime d'affiliation CNSS des dirigeants (gérants) n'est pas défini dans le paquet
    fiscal-tg-entreprise 2026.1 », cite `cnss.aCompleter` **tel quel, jamais analysé** (D-364-4), « jamais au régime
    salarié », et que « le blocage se lève au paquet fiscal, sans livraison : aucune saisie de la base ne le lève »
    (D-364-5). `regime: 'salarie'` + `source` ⇒ les cotisations du type se calculent, sans recompiler ; sans source, ou
    à un autre régime (`travailleurIndependant`…) ⇒ `PAQUET_INCOMPLET` nommé (D-364-6). Art. 79 : une distribution
    n'entre pas dans la base (`RUBRIQUE_INCONNUE`), la retenue est refusée par le calcul de C (D-364-7). Agrégat :
    inchangé, prouvé égal à l'unité aux totaux du salarié seul (D-364-8). Aucun motif, champ ni route neuf.
  - **Communs** : aucun. Aucune migration.
  - Preuves : Node 24 (image `verification` de l'archive LF) unitaires 203/203 suites, 2 958 tests (1 ignoré), e2e 13/13 suites, 273 tests ; Node 25 : rémunération 148/148 (les tests de 348 inchangés), e2e de la base 31/31 ; **mutations 10/10** (dont le repli sur le régime salarié, la citation codée en dur, la source non exigée) ; lint, `tsc`, build 0 ; pas de conformité ni de compose (ni stockage, ni module, ni Dockerfile). **Verrou Docker** : pris à 00:38 (26/11 ; une seule passe : unitaires, e2e), rendu à 00:42 par le `trap` du script autonome ; B et C prévenus ; aucun conteneur ni réseau grp-d. (La limite de 5 h de l'API a interrompu la sous-session avant le commit, sans verrou tenu ; reprise sans perte.)
  - **→ C (information, non bloquante)** : la clé `cnss.affiliation.<TYPE>` que le calcul lit, à écrire au paquet le
    jour où l'affiliation des gérants sera sourcée (« Demandes aux autres groupes »). **→ C : `cnss.collecte` —
    toujours ouverte** (non servie au 26/11 : la copie du paquet du fiscal ne la porte pas ; C est sur 1023).
  - **Suivante : STORY-349** (les obligations sociales dans le calendrier, le cycle et la preuve ; EPIC-034 fini).
    **Elle attend STORY-319 de C** (plan §5) : **→ C : 319 — ouverte**. État constaté au journal de C (`origin/main`,
    26/11 à 00:40) : 319 **pas commencée** — C fait 1023 (balance, annonce `main` 28dc047), puis 317 → 318 → **319** ;
    aucune fiche, aucune branche. La session de groupe de D décide de la suite (les autres stories de D attendent C :
    330 ← 325, puis 331 → 337 et 561 → 565).

- **STORY-1138** ✅ 🔗 — la liasse rapprochée de sa balance par l'empreinte des soldes (prospera-bilan-service#193,
  `dev` `65eecdc` ; annonce avant le code #937, `main` 69c1cfe : fiche D-1138-1 → 11, ⚠ Contrats). Plan §4 bis, n° 5a
  (D-1078-10). Rituel (2026-11-26) : aucune demande neuve à D chez A, B et C ; 319 et 325 de C non fusionnées (fiscal
  `origin/dev` `d41dbe6`) ; bilan : aucune PR ouverte, `origin/dev` `4317dd2`, deux brouillons non suivis connus
  (`cr-map.txt`, `cr-postes.txt`) laissés. **← C : 1022 — vérifiée sur le code** (`d5878be` : `computeSoldesChecksumV1`,
  `verifierSoldesChecksum`, `empreinteDesSoldes` ; les deux vecteurs recalculés hors service).
  - **Constat avant le code** : l'empreinte publiée depuis `d5878be` était **reçue et jetée** (la projection ne recopie
    que les champs connus ; Mongoose `strict` retire du `$set` un champ non déclaré).
  - **Livré** (`read-models/`, `kafka/events/`, `bilan/analyse/`) : la paire lue ensemble ou pas du tout, jamais en
    poison-pill ; deux `@Prop` sans défaut au read-model `balances_balance` ; `soldes-v1` recopié du contrat de C et
    indexé par sa version ; bloc **`rapprochementBalance`** de la réponse d'analyse : `CONCORDANT` | `DISCORDANT` |
    `NON_VERIFIABLE` (`VERSION_EMPREINTE_INCONNUE` : aucun recalcul ; `BALANCE_INTROUVABLE`) | `SANS_EMPREINTE`
    (`BALANCE_SCELLEE_V1`, `EMPREINTE_NON_RECUE`) | `NON_APPLICABLE` (`JEU_SANS_BALANCE`, `SOLDES_FOURNIS`). Les soldes
    et la balance sont ceux du document servi (jeu, ou snapshot de la version demandée). Aucun écart au contrat annoncé.
  - **Communs** : sans objet (le bilan est à D seul). Aucune migration, aucune collection neuve, aucun module ni
    Dockerfile ; plans C13 d'export et d'effacement inchangés (`balances_balance` y est déjà).
  - Preuves : Node 24 (image `verification` de l'archive LF de `7680a51`) **e2e 45/45 suites, 3 565 tests**, `npm run
    build` 0, unitaires **369/369 suites, aucun rouge**, en deux passes sur la même image : 286 suites dans la première (coupée par la borne de 40 min du script, piège 1138-2), les 83 restantes dans la seconde (518 tests verts, 2 ignorés) ; **mutations 18/18** (sur une assertion) ; lint et `tsc` 0 ; vecteurs de C écrits en
    dur. Pas de compose (§1.5). **Verrou Docker** : pris à 01:29, rendu à 02:24 par le trap du script autonome ; seconde
    passe prise à 02:50, rendue à 02:54 ; B et C prévenus ; aucun conteneur `grp-d` restant.
  - **Ce qui reste** : un rejeu des deux topics de la balance sur une instance déjà en service, pour que les balances
    projetées avant 1138 reçoivent leur empreinte (D-1138-7, geste d'exploitation). **→ A (plus tard)** : l'écran de
    l'analyse affiche le bloc (`message` tel quel).
  - **Suivante : STORY-1139** (les repères des seize indicateurs de l'analyse financière, sourcés et modifiables, Q-D-14 ; `prospera-bilan-service` ; plan §4 bis, n° 5b ; fiche à écrire juste avant de coder). Au 26/11 à 02:55, 319 et 325 de C ne sont pas fusionnées (fiscal `origin/dev` `d41dbe6` ; C fait 317, annonce `main` 5c56b2d, qui porte aussi `cnss.collecte` au paquet) : D reste sur 5b → 5d.

- **STORY-1139** ✅ 📏 — les repères de l'analyse financière, sourcés et modifiables par dossier, chaque changement tracé
  (prospera-bilan-service#194, `dev` `027075d` ; annonce avant le code #946, `main` b3d9e23 : fiche D-1139-1 → 15,
  ⚠ Contrats, Q-D-23). Plan §4 bis, n° 5b (Q-D-14). Rituel (2026-11-26) : aucune demande neuve à D chez A et B ;
  **← C : `cnss.collecte` servie** (317) ; 319 et 325 de C non fusionnées ; bilan : aucune PR ouverte, `origin/dev`
  `65eecdc`, deux brouillons non suivis connus (`cr-map.txt`, `cr-postes.txt`) laissés.
  - **La recherche (26/11)** : BCEAO (procédure des accords de classement, mars 2020, relue en entier : quatre ratios de
    décision seulement), OHADA (guide d'application du SYSCOHADA : aucun ratio), Les clés de la banque (cinq pages : des
    repères d'usage qui ne disent pas à quelle formule ils s'appliquent, ou portent sur une autre). **Aucune norme sur la
    même formule pour les seize** : ils restent « aucun repère déclaré », raison par raison (tableau de la fiche). Aucun
    paquet ne change.
  - **Livré** (`bilan/analyse/reperes/`) : `GET …/analyse/reperes`, `PUT …/reperes/{indicateur}` (`TENANT_ADMIN`),
    `GET …/{indicateur}/journal` ; collection append-only `reperes_analyse`, une insertion par changement, l'index unique
    `(organisation, dossier, indicateur, version)` pour verrou ; l'analyse applique le repère du dossier
    (`seuilApplique.origine`, `repereDossier`). Aucun écart au contrat annoncé.
  - **Communs** : sans objet (le bilan est à D seul). Aucune migration, aucun droit neuf, aucun topic ; plans C13 :
    la collection y entre (effacement par `tenantId`, export `reperes-analyse`).
  - Preuves : Node 24 (image `verification` de l'archive LF) **unitaires 372/372 suites, 12 792 tests, aucun rouge**, en deux passes `--shard` (186 + 186) ; e2e 43/45 sur `f1266a1` (deux e2e comptaient en dur 25 contrôleurs gardés et 7 objets d'export), corrigées en `850c127` : **4/4 suites, 1 180 tests** ; `npm run build` 0 ; **vrai MongoDB 4/4** (dix changements simultanés : un seul passe, neuf 409) ; **mutations 22/22** ; lint et `tsc` 0. §1.5 : pile `grp-d` (mongo, kafka, image runtime) saine, trois routes montées, 401 sans jeton, 0 `UnknownDependencies`, l'index unique posé par l'application. **Verrou Docker** : pris à 04:26, rendu à 05:01 ; seconde passe 05:01 → 05:03 ; B et C prévenus ; aucun conteneur, volume ni réseau `grp-d`.
  - **Ce qui reste** : → A (plus tard) l'écran (origine, source, modification et journal) ; Q-D-23 au PO.
  - **Suivante : STORY-1140** (l'export C13 aussi en CSV, Q-D-19 ; `prospera-bilan-service` ; plan §4 bis, n° 5c ; → B : le
    contrat dans `prospera-plateforme/contrats/instance/`). Au 26/11 vers 04:40, 319 et 325 de C ne sont pas fusionnées
    (fiscal `origin/dev` `cefbe20`, 318) : D reste sur 5c → 5d.

- **STORY-1140** ✅ 📤 — l'export C13 du bilan aussi en CSV, à la forme par objet de balance (prospera-bilan-service#195,
  `dev` `c29fcc2`, `7f96163` ; annonce avant le code #953, `main` 67efaf9 : fiche D-1140-1 → 8, ⚠ Contrats, → B). Plan
  §4 bis, n° 5c (Q-D-19). Rituel (2026-11-26, 05:10) : aucune demande neuve à D chez A, B et C ; 319 et 325 de C non
  fusionnées ; bilan : aucune PR ouverte, `origin/dev` `027075d`, deux brouillons non suivis connus laissés.
  - **Livré** (`instance-c13/`) : `?format=json|csv` et `?objet=` sur `GET …/instance/bilan/{organisationId}/export` ; un
    objet par fichier CSV (`export-bilan-<objet>-<organisationId>.csv`), les règles et l'aplatissement de balance
    recopiés (`export-csv.ts`, ses six vecteurs repris à la lettre) ; refus avant toute lecture 400 `FORMAT_NON_SERVI`,
    400 `OBJET_REQUIS`, 422 `OBJET_INCONNU`, puis l'état publié ; `Cache-Control: no-store` sur le JSON et le CSV.
    **← B : le contrat servi pendant la story** (plateforme #41, `contrats-instance-v1.1`, d68a468) : recopié à l'octet
    dans la même PR (D-1140-9), la réponse JSON relue par Ajv, les huit cas du CSV rejoués à l'octet. Aucun écart à
    l'annonce.
  - **Communs** : sans objet (le bilan est à D seul). Aucun module Nest, aucune dépendance, aucun Dockerfile, aucune
    collection, aucune migration ; plans C13 inchangés.
  - Preuves : Node 24 (image `verification` de l'archive LF de `e13d874`) **unitaires 373/373 suites, 12 817 tests, aucun
    rouge** (deux passes `--shard`, 187 + 186), **e2e 45/45, 3 592**, `npm run build` 0 ; sur `f2186c9` : suites touchées
    52/52, e2e `instance-c13` et `openapi-contract` 2/2 (608) ; **mutations 32/32** (sept réécrites : leur première forme
    ne compilait pas) ; lint et `tsc` 0. **Pile `grp-d`** (mongo, kafka, IdP de test RS256, image runtime) : **15/15 cas**
    (JSON, CSV et ses octets, refus, état publié, identité, santé). **Verrou Docker** : pris à 07:26, rendu à 08:10 ;
    repris à 08:23, rendu à 08:28 ; B et C prévenus ; aucun conteneur, volume ni réseau `grp-d`.
  - **Ce qui reste** : → C (information) : `balance-service` peut se ranger au même contrat (copie et cas) ; → A : rien.
  - **Suivante : STORY-349** (le calendrier reçoit les obligations sociales ; plan §4, D reprend le tableau). **319 de C
    est fusionnée** (fiscal `origin/dev` `0cc79a7`, docs `main` 5b54ed7) : 349 est débloquée ; 325 ne l'est pas encore.
    Après 349 et la suite du tableau, D finit **STORY-1141** (5d, la passation de paiement de B est servie, #936).

- **STORY-349** ✅ 🗓️ — les obligations sociales dans le calendrier, le cycle et la preuve (prospera-fiscal-service#73,
  `dev` `a7d42cc`, `a145468`, `136efdf` ; annonce avant le code #962, `main` 9a83ce8 : fiche D-349-1 → 8, ⚠ Contrats,
  ⚠ Communs, Q-D-24, Q-D-25). Rituel (2026-11-26) : aucune demande neuve à D chez A, B et C (les demandes de
  notification de C et de B restent hors lot 7) ; **← C : 319 — servie** (fiscal #71, `0cc79a7`) ; 321 de C fusionnée
  pendant la story (#72, `493a817`) : 349 rebasée dessus.
  - **Mesuré avant le code** (sur `0cc79a7`) : le calendrier, le cycle, l'affectation, la charge et les alertes reçoivent
    toute obligation écrite par `RegistreObligations.enregistrer` ; le catalogue Togo 2026 ne porte aucune obligation
    sociale ; rien ne les dérivait.
  - **Livré** (dossier `remuneration`) : `deriverObligationsSociales` (pur) — une base de `AAAA-MM` ⇒
    `COTISATIONS_SOCIALES` et `RETENUE_IRPP` de l'employeur (redevable `entreprise`, implantation `principale`),
    datées par `echeancesDe` de 348 (le 15 du mois suivant au paquet 2026 ; non datées et nommées
    `ECHEANCE_ABSENTE_DU_PAQUET` sinon) ; familles `PROPORTIONNELLE` / `BAREME_TRANCHES` ; canal = l'organisme du paquet
    (« CNSS Togo »), `NON_DECLARE` pour la retenue ; le catalogue fait foi s'il porte le code (`CATALOGUE_LA_PORTE`).
    `ObligationsSocialesService` les écrit par l'écriture unique des obligations (AD-17) ; la saisie et l'import
    dérivent après la base, `CREEE` comme `INCHANGEE` ; paquet inaccessible : base écrite, `NON_DERIVEES` dit. Aucun
    écart au contrat annoncé.
  - **Communs** (D-L7-2, annoncés avant le code) : le contrat OpenAPI seul. Aucune migration, aucun fichier de C ;
    `remuneration.module.ts` importe `ObligationsModule`. Plus `libelle-imprime.spec.ts` (D, borne 500 → 2000 ms,
    demande de C, commit séparé).
  - Preuves : Node 24 (image `verification` de l'archive LF) unitaires 216/216 suites, 3 148 tests, e2e 13/13, 299 ;
    **`test:conformite` 23/23, 144** (seconde passe, sur `713295a` : la première avait rougi de deux attentes de test) ;
    Node 25 : rémunération 172/172, e2e de la base 38/38 ; **mutations 14/14** ; lint, `tsc` 0 ; §1.5 : pile `grp-d`
    du fiscal **avec Redis** saine, deux routes en 401 sans jeton, 0 `UnknownDependencies`. **Verrou Docker** : pris à
    09:41 (après le redémarrage du poste à 09:29 ; la première prise de 09:2x n'avait rien fait), rendu à 09:55 par
    le trap ; repris à 09:55 (seconde conformité), rendu à 09:59 ; aucun conteneur, volume ni réseau `grp-d`. B et C
    n'ont pas pu être prévenus par SendMessage (sessions renommées après le redémarrage) : dit dans le rapport.
  - 🏁 **La part de D d'EPIC-034 est finie** (345, 346, 347, 348, 364, 349) ; l'épic se ferme avec **STORY-350 de C**
    (le rapprochement des charges sociales, n° 17 du tableau de C).
  - **Suivante : STORY-1141** (le numéro de compte imprimable, Q-D-15 : paiement par la passation de B limitée à la
    story, #936, `e2be149`, puis ventes ; plan §4 bis, n° 5d). Au 26/11 à 10:00, 325 de C n'est pas fusionnée (fiscal
    `origin/dev` `136efdf` ; C fait 324) : 330 et sa chaîne attendent.

- **STORY-1141** ✅ 🧾 — le numéro de compte imprimable sur la facture (prospera-paiement-service#126, `dev`
  `f6a4800`, `64b5838` ; prospera-ventes-service#17, `dev` `dcb5d3b` ; annonce avant le code #967, `main` 6a5d3ab :
  fiche D-1141-1 → 12, ⚠ Contrats, manifeste `paiement` 1.2.0, Q-D-26). Plan §4 bis, n° 5d (Q-D-15). Rituel
  (2026-11-26, vers 10:30) : aucune demande neuve à D chez A, B et C ; **← B : passation de `prospera-paiement-service`
  pour 1141 — servie** (#936, `e2be149`, aucune PR ouverte, checkout propre) ; 325 de C non fusionnée ; ventes : aucune
  PR ouverte, `origin/dev` `bc0f85c`.
  - **Livré** (paiement) :
    - `numeroImprimable` se déclare avec le compte, pour `BANCAIRE` et `MOBILE_MONEY`.
    - Il se pose, se remplace ou se retire par `PUT …/comptes-encaissement/{compteId}/numero-imprimable` et par sa route
      déléguée.
    - Il est rangé normalisé et doit finir comme l'identifiant scellé. Le contrôle lit l'empreinte visible, jamais le
      coffre.
    - Chaque changement est un acte `COMPTE_ENCAISSEMENT_NUMERO_IMPRIMABLE_DECLARE` du journal chaîné du compte : les
      empreintes SHA-256 de l'avant et de l'après, jamais le clair, que le tamis refuserait pour un numéro de téléphone.
      L'acte part dans la transaction de l'écriture et de son fait.
    - Reposer le même numéro n'écrit rien ; un changement concurrent rend 409.
    - `paiement.compte.changed@1` gagne `numeroImprimable`, facultatif.
  - **Livré** (ventes) : la facture imprime le numéro déclaré en entier (`origineDuNumero`). À défaut, elle imprime la
    destination PI-SPI ou l'empreinte (D-1073-6). Aucun écart au contrat annoncé.
  - **Communs** : sans objet (paiement prêté, ventes à D). Aucune migration.
  - **Preuves** :
    - Node 24, paiement : unitaires **351/351 suites, 4 776 tests** ; e2e 28/30. Les deux suites rouges, `health` et
      `notifications-webhook`, sont rouges aussi sur `e2be149` (rejouées dans la même image) ; la seconde ne compilait
      même plus depuis 1073 et est recompilée. `test:schemas` **14/14** sur le Karapace de la pile.
    - Node 24, ventes : unitaires **66/66, 720** ; e2e 2/2 ; intégration sur MongoDB réel **18/18, 206**.
    - **Mutations 19/19** (paiement) et **8/8** (ventes) ; lint et `tsc` 0.
    - **Pile `grp-d`** (paiement, ventes, dossier, Kafka, Karapace) : **38/38**. Le registre porte 1073 puis 1141 en
      BACKWARD. Trois factures : le numéro, le nouveau numéro, puis l'empreinte après le retrait. Le PDF de la première
      ne change pas d'un octet. L'identifiant scellé n'apparaît nulle part.
    - **Verrou Docker** : pris à 10:51 (une seule prise) et rendu à 11:22 par le trap du script autonome. B l'a repris
      aussitôt (1125). B et C ont été prévenus, sous les noms `-be` et `-f7`. Aucun conteneur, volume ni réseau `grp-d`.
  - **→ B : recopie du manifeste `paiement` 1.2.0 au catalogue — ouverte** (« Demandes aux autres groupes ») ;
    servie (catalogue #83, dev `ce8cbc0` ; journal de B `main` 1206297).
    **`prospera-paiement-service` est rendu à B** (« Passations »). **→ A (plus tard)** : l'écran des comptes (le
    numéro à imprimer). **Q-D-26** au PO.
  - 🏁 **Les quatre stories de l'amendement du 26/11 sont faites** (1138, 1139, 1140, 1141).
  - **Suivante : D attend STORY-325 de C**, qui débloque 330 → 337. Au 26/11 à 11:25, 325 n'est pas fusionnée :
    fiscal `origin/dev` `060c85c`, C vient de fusionner 324. **→ C : 325 — ouverte** (servie : fiscal #75, `7e2bff8` ; voir STORY-330).
    - 561 attend 331 (donc 330 et 325), et 562 attend 561 : **aucune des deux n'est libre**.
    - Il en va de même de 565 (562, 341 de C) et de 1102 (332, 333).
    - Toute la suite du lot 7 de D attend 325. La session de groupe de D décide.

- **STORY-330** ✅ 📨 — le port de canal asynchrone et la production du livrable : le fichier exact, estampillé de la
  version qu'il emballe, et un dépôt engagé qui rend un identifiant, jamais un accusé (prospera-fiscal-service#76, `dev`
  `7d48fd9` ; annonce avant le code #978, `main` 6f6b797 : fiche D-330-1 → 16, ⚠ Contrats, ⚠ Communs, Q-D-27). Plan §4,
  n° 7 ; **la première story de D dans EPIC-032**. Rituel (2026-11-26) : aucune demande neuve à D chez A, B et C ;
  **← C : 325 — servie (fiscal #75, 7e2bff8)** ; aucune PR ouverte ni migration en vol sur le fiscal.
  **→ B : recopie du manifeste `paiement` 1.2.0 au catalogue — servie (catalogue #83, dev ce8cbc0 ; journal de B main
  1206297).**
  - **Livré** (dossiers `depots` et `livrables-depot` de D) :
    - `POST /api/v1/livrables-declaration/{obligationId}` (droit `preparer`) : le classeur de 537, produit depuis une
      déclaration `VALIDEE` ou au-delà ; le format est celui que le `gabarit` de la déclaration nomme, jamais la
      requête ; le dossier est celui de la déclaration ; la liasse vient de `bilan-service` par le producteur de 537,
      inchangé (AC-2). L'estampille `{ numero, empreinte }` (la version scellée si elle l'est, sinon le contenu
      courant, D-325-11) part dans trois propriétés du fichier et dans `X-Declaration-Version` /
      `X-Declaration-Empreinte`.
    - Le port **`CanalDeDepot`** et le **dépôt assisté** : engager rend `{ depotId, mode, statut, engageLe, rejoue }`,
      sans aucun champ d'accusé (AC-3).
    - `POST /api/v1/depots-declaration` (droit `deposer`) et `GET /api/v1/depots-declaration/{depotId}` : l'obligation
      reste `A_DEPOSER` (D-330-7, Q-D-27) ; `409 LIVRABLE_PERIME` ; un seul engagement en vol par version (index unique
      partiel de `engagements_depot`) ; rejeu ⇒ 200, même identifiant ; un contenu nouveau ⇒ l'ancien `REMPLACE`, en une
      transaction avec ses deux actes au journal chaîné (`depot-declaration:<id>`) ; la lecture dit `perime`.
    - La **garde d'AD-12** (AC-4) : aucun nom de pays, de portail ni de guichet, commentaires compris, dans le domaine,
      le port, l'adaptateur et les cas d'usage du dépôt ; éprouvée sur des témoins.
    - Aucun écart au contrat annoncé. **D-330-17** : la garde d'AD-13 de 560 admet la route du livrable d'une
      déclaration (le même classeur que 537).
  - **Communs** (D-L7-2, annoncés avant le code) : le contrat OpenAPI (trois routes neuves) et `src/main.ts` (deux
    en-têtes exposés au CORS). Aucune migration, aucun fichier de C ; `DepotsModule` et `LivrablesDepotModule` importent
    `ObligationsModule`.
  - **Preuves** :
    - Node 24 (image `verification` de l'archive LF de `fb518ba`) : unitaires **231/231 suites, 3 341 tests** (1 suite
      ignorée : BullMQ sans Redis), e2e **14/14, 325**, **`test:conformite` 26/26, 167** (dont `engagements-depot`, 7 :
      dix engagements parallèles ⇒ un seul, remplacement tout ou rien, chaînes intactes).
    - Node 25 : les 35 suites du dépôt, du livrable, des paquets, de la complétude et du coffre, 578 tests ; lint et
      `tsc` 0 ; **mutations 25/25**.
    - §1.5 : pile `grp-d` du fiscal **avec Redis** saine, les trois routes montées et en 401 sans jeton,
      0 `UnknownDependencies`, l'index posé par l'application.
    - **Verrou Docker** : pris à 12:39 (une seule prise), rendu à 12:48 par le trap du script autonome ; B l'a repris
      aussitôt (1126) ; B et C prévenus (`-be`, `-f7`) ; aucun conteneur, volume ni réseau `grp-d`.
  - **Ce qui reste** :
    - → A (plus tard) : l'écran du livrable d'une déclaration et de son engagement (FE-081).
    - 331 (les formulaires des déclarations du mois comme donnée du paquet), 332 (le guidage, et la vérification de
      l'exercice de la liasse, D-330-5), 333 (l'accusé d'un dépôt engagé et sa jonction avec la chaîne de 538,
      D-330-15), 561 (le connecteur ; l'accord du client avant d'agir, D-330-13). Q-D-27 au PO.
    - la note « paiement 1.1.0 » de `paiement.compte.changed@1` dans
      `prospera-plateforme/contrats/distributeur/catalogue-faits.json` est à passer à 1.2.0 (numeroImprimable, 1141) :
      une étiquette `contrats-distributeur-v3` et sa recopie à l'octet dans
      `prospera-ventes-service/src/socle/contrats-distributeur/` (source.ts, empreinte) ; non urgent.
  - **Suivante : STORY-331** (le format de canal décrit comme une donnée du paquet ; dossiers de D ; fiche à écrire depuis
    `epics-fiscalite-2026-08-03.md` juste avant de coder ; le paquet fiscal est à C, D-L7-3).
- **STORY-331** ✅ 📨 — le format de canal décrit comme une donnée du paquet : le classeur à téléverser et le formulaire à
  saisir, deux natures d'une même description, derrière le même port. Code : prospera-fiscal-service#78, `dev`
  `6e9fbbe`. Annonce avant le code : #986, `main` 756fc0f (fiche D-331-1 → 12, ⚠ Contrats, ⚠ Communs, Q-D-28). Plan
  §4, n° 8.
  - **← C : 327 reçue, rebasé (fiscal #77, 9db1653)** : la branche, partie de `7d48fd9`, a été rebasée sur `9db1653`
    avant les preuves sous Node 24 ; `origin/dev` n'a plus bougé jusqu'à la fusion. Aucune migration en vol sur le
    fiscal.
  - **Livré** (dossiers `paquets-depot`, `livrables-depot` et `depots` de D) :
    - **Une seconde nature de format, décrite comme donnée** : le formulaire à saisir (`SAISIE_FORMULAIRE`), à côté du
      classeur à téléverser (`TELEVERSEMENT_FICHIER`). Son contrat est strict et pur. Il porte les déclarations servies
      (`canal`, `taxe`), le canal, et les champs dans l'ordre du formulaire (`code`, `libelle`, `valeur` du contenu
      déclaré, contraintes `MONTANT` | `PERIODE`, `source`). Il vit dans un second manifeste, vérifié par sha256, que
      `etatsActifs` ne voit jamais.
    - **Les deux formats du « fini quand »** : dimana, avec `TG × TVA` 1.0 (`statut: 'amorce'`, Q-D-28 : la période, la
      base imposable, la TVA due) ; le GUDEF, avec `TG × DSF` 1.3, dont aucun octet n'a changé.
    - **Un seul résolveur** du format : le gabarit du paquet fiscal prime (330 inchangé) ; sinon, le formulaire qui sert
      le couple `(canal, taxe)` ; sinon, `FORMAT_DE_CANAL_NON_DECLARE`. Deux formulaires pour un même couple sont
      refusés au build (`PAQUET_DEPOT_AMBIGU`).
    - `GET /api/v1/livrables-declaration/{obligationId}/formulaire` (droit `preparer`) : les valeurs sont lues dans le
      contenu de l'estampille (la version scellée si elle l'est), prêtes à recopier. Rien n'est écrit. La route du
      classeur rend `422 FORMAT_DE_CANAL_AUTRE_NATURE` sur une déclaration que seul un formulaire décrit.
    - **AC-2** : une description incomplète est refusée en nommant le champ, au build (`verifierFormulaires`) et à la
      demande (`422 FORMAT_DE_CANAL_INCOMPLET`, `details.champ`).
    - **AC-3** : une TVA s'engage avec la référence de son format. `nature` est déduite de la référence et n'est jamais
      stockée. Les deux natures passent par le même `CanalDeDepot`.
    - Aucun écart au contrat annoncé.
  - **Communs** (D-L7-2, annoncés avant le code) : le contrat OpenAPI seulement. Aucune migration, aucun stockage,
    aucun fichier de C ; `contenuDeclareDe` est lu sans écriture.
  - **Preuves** :
    - **Node 24** (image `verification` de l'archive LF de `914cd8a`) : unitaires **235/235 suites, 3 484 tests** (une
      suite ignorée : BullMQ sans Redis), e2e **14/14, 339**, **`test:conformite` 27/27, 173**.
    - **Node 25** : 47/47 suites, 890 tests (dépôt, livrable, paquets, complétude, coffre, échéances, garde d'AD-12) ;
      e2e `depots-declaration` 27/27 ; lint et `tsc` 0 ; **mutations 19/19**.
    - §1.5 : pile `grp-d` du fiscal **avec Redis** saine. Les quatre routes sont montées et répondent 401 sans jeton,
      avec 0 erreur au journal et les index posés.
    - **Verrou Docker** : pris à 13:35:35 (une seule prise), rendu à 13:43:48 par le `trap` du script autonome. B et C
      ont été prévenus (`-be`, `-f7`). Il ne reste aucun conteneur, volume ni réseau `grp-d`.
  - **Ce qui reste** :
    - **→ C : nommer le canal du reversement de la retenue d'IRPP au paquet fiscal — ouverte** (non bloquante ;
      « Demandes aux autres groupes »). D ajoutera ensuite `TG × RETENUE-IRPP` par donnée seule.
    - Q-D-28 au PO.
    - → A (plus tard) : FE-081 lit `nature`.
    - 332 (le guidage, dans l'ordre du formulaire) ; 561 (le bloc `automatisation`, adressé par `code`).
  - **Suivante : STORY-332** : le guidage de dépôt pas à pas, dans les dossiers de D. Sa fiche est à écrire depuis
    `epics-fiscalite-2026-08-03.md` juste avant de coder. Elle lit le livrable d'un formulaire de 331 (D-331-12) et le
    dépôt engagé de 330 (D-330-5).
- **STORY-332** ✅ 📨 — le dépôt guidé pas à pas : les étapes viennent du paquet, les valeurs suivent l'ordre du
  formulaire, chacune prête à copier, et rien de ce que le produit connaît n'est demandé en saisie. Code :
  prospera-fiscal-service#79, `dev` `8d85c10`. Annonce avant le code : #991, `main` 72e9915 (fiche D-332-1 → 12, ⚠
  Contrats, ⚠ Communs, Q-D-29). Plan §4, n° 9 (« fini quand » : salle des cabinets V3).
  - **Livré** (dossiers `depots` et `paquets-depot` de D) :
    - **Le guidage, un paquet de dépôt à part.** Il est publié par un troisième manifeste, `manifeste-guidages.json`,
      et vérifié par sha256. Les formats et leurs deux manifestes restent intacts d'un octet. Son contrat est strict et
      pur : le format guidé (sa nature, ses versions), la source, puis les étapes (`code`, `libelle`, `geste`,
      `consigne`, et `champs` pour une saisie). Les gestes forment une liste fermée, et **aucun ne demande une valeur**
      (AC-3).
    - **Les règles du parcours**, tenues au build et à la lecture (`GUIDAGE_INCOMPLET`, `details.champ`) :
      - un fichier : une seule étape de téléversement, aucune saisie (AC-4, « un seul fichier ») ;
      - un formulaire : aucun téléversement, et les champs reportés sont exactement ceux du formulaire, dans son
        ordre (AC-5) ;
      - l'accusé : relevé une seule fois, en dernier.
    - **Les deux guidages du « fini quand »**, en `amorce` (Q-D-29) :
      - `TG × TVA`, pour dimana : six étapes, et les trois valeurs dans l'ordre du formulaire ;
      - `TG × DSF`, pour le GUDEF : un seul fichier, désigné par son estampille.
    - **`GET /api/v1/depots-declaration/{depotId}/guidage`** (droit `deposer`) :
      - les valeurs viennent de `valeursDuFormulaire` (331), sur la version engagée et le contenu de l'estampille (la
        version scellée si elle l'est) ; chacune est une chaîne prête à copier (AC-2) ;
      - le redevable est nommé : l'entreprise et le dirigeant ont chacun leur dépôt et leur guidage (AC-5) ;
      - refus : `DEPOT_REMPLACE`, `OBLIGATION_DESACTIVEE`, `LIVRABLE_PERIME`, `FORMAT_DE_CANAL_NON_DECLARE`,
        `GUIDAGE_NON_DECLARE` ;
      - rien n'est écrit.
    - **332 ne dépose pas** : « Déposée » reste `CycleObligationsService.transitionner` (C).
    - **Un écart, sans effet sur le contrat** : la garde de build ne compte plus elle-même les guidages actifs. C'était
      du code mort : l'analyse du manifeste refuse déjà deux guidages actifs d'un même couple (536). Il a été retiré.
  - **Communs** (D-L7-2, annoncés avant le code) : le contrat OpenAPI seulement. Aucune migration, aucun stockage,
    aucun fichier de C.
  - **Preuves** :
    - **Node 24** : sur `da293d6`, unitaires **239/239 suites, 3 549 tests** (une suite ignorée : BullMQ sans Redis), e2e
      **14/14, 345**, **`test:conformite` 27/27, 173** ; sur `891574b`, les mêmes nombres (unitaires 239/239 suites, 3 549 tests ; e2e 14/14, 345 ; `test:conformite` 27/27, 173), et la pile `grp-d` avec Redis saine, la route du guidage en `401` sans jeton.
    - **Node 25** : contrat, domaine, registre, service et OpenAPI (70 tests), e2e `depots-declaration` 33/33 ; lint et
      `tsc` 0 ; **mutations 25/25**.
    - §1.5 : pile `grp-d` du fiscal **avec Redis** saine. La route du guidage est montée et répond `401` sans jeton,
      avec 0 erreur au journal.
    - **Verrou Docker** : deux prises, chacune par le script autonome et rendue par son `trap` : de 14:15:43 à 14:28:57 (sur `da293d6`), puis de 14:44:36 à 14:51:21 (sur `891574b`). B et C ont été prévenus à chaque reddition (`-be`, `-f7`). Il ne reste aucun conteneur, volume ni réseau `grp-d`.
  - **Ce qui reste** :
    - Q-D-29 au PO ;
    - → A (plus tard) : FE-081 affiche les étapes, avec un bouton « copier » par valeur ;
    - D-332-9 : l'exercice de la liasse, vérifié automatiquement, avec 1102 ;
    - les déclarations propres du dirigeant attendent leur format (→ C : canal de la retenue d'IRPP, ouverte).
  - **Suivante : STORY-333** (la capture de l'accusé et la qualification du retard ; dossiers de D). Il faut **d'abord
    la réaligner** avec 537 → 539 et 688 → 691, qui la couvrent en partie (plan §4, n° 10). Sa fiche est à écrire depuis
    `epics-fiscalite-2026-08-03.md` juste avant de coder. Elle prend la suite de l'étape `RELEVER_ACCUSE` du guidage
    et du dépôt engagé de 330 (D-330-15).
- **STORY-333** ✅ 📨 — l'accusé d'un dépôt engagé : un document ou une simple référence, consigné une fois par
  version, horodaté, rattaché à la version déposée ; le retard qualifié à la date réelle du dépôt. Code :
  prospera-fiscal-service#81, `dev` `fc317a1`. Annonce avant le code : #998, `main` 572be5d (fiche D-333-1 → 13, ⚠
  Contrats, ⚠ Communs, → C, Q-D-30). Plan §4, n° 10.
  - **Réalignement** (fiche, avant le code) : 333 n'était **pas** couverte. 538 et 691 couvrent l'accusé du **dépôt de
    liasse** (l'ancien modèle, que `bilan-service` consomme) ; manquaient l'accusé de la **déclaration** (le dépôt engagé
    de 330, la version scellée de 325), la garde `ACCUSE_REQUIS` (le cycle de C passait `DEPOSEE → ACCUSE_RECU` sans
    garde) et le retard à la date réelle. 688 et 690 sont sans rapport. 333 complète sans réécrire 538.
  - **Livré** (dossier `depots` de D) :
    - **`POST /api/v1/depots-declaration/{depotId}/accuse`** (droit `deposer`, multipart : `piece`, `reference`,
      `deposeLe`) :
      - un document (PDF, PNG, JPEG ou XML lu dans ses octets, archivé dans le bucket privé de 682, empreinte calculée),
        une référence (gardée à l'octet), ou les deux (AC-1, AC-2) ; aucun ⇒ `422 ACCUSE_REQUIS` ;
      - sur une déclaration « Déposée » ou au-delà, dont la version déposée est celle du dépôt engagé
        (`ACCUSE_NON_CONSIGNABLE`, `LIVRABLE_PERIME`, `DEPOT_REMPLACE`, `OBLIGATION_DESACTIVEE`) ;
      - une fois par version (`409 ACCUSE_DEJA_CONSIGNE`, index unique `un_accuse_par_version`) ; la pièce d'une
        écriture perdue est supprimée ;
      - `deposeLe` entre le jour de l'engagement et aujourd'hui (`DATE_DEPOT_HORS_BORNES`) ;
      - **le retard** (AC-4) : `qualifierRetard` de C sur l'échéance applicable (le report compris) à la date réelle ;
        `DANS_LES_DELAIS`, `EN_RETARD` ou `ECHEANCE_INCONNUE` ; les pénalités du paquet de dépôt du format, ouvertes par
        le retard seul, jamais chiffrées ; `source: null` pour un formulaire du mois (Q-D-30) ; figé à la consignation ;
      - acte `DEPOT_DECLARATION_ACCUSE` au journal chaîné, dans la transaction de l'accusé (la référence par son
        empreinte seule).
    - **`GET …/{depotId}/accuse`** et **`GET /api/v1/depots-declaration/accuses?obligationId=`** (AC-5, V2 : dossier →
      déclaration → accusés, deux gestes).
    - **Pour la porte de C** (D-333-3) : `AccusesDepotModule` (sans `ObligationsModule`), le port `PreuvesDAccuse`, la
      règle `verifierAccuseAuRecu` (`409 ACCUSE_REQUIS`).
    - **333 ne fait pas avancer le cycle** : ni « Déposée » ni « Accusé reçu » (`CycleObligationsService` n'est pas
      exporté ; la porte reste à C).
  - **Communs** (D-L7-2, annoncés avant le code) : le contrat OpenAPI seulement. Aucune migration, aucun fichier de C.
  - **Preuves** :
    - Node 24 : unitaires **246/246 suites, 3 681 tests** (1 suite et 3 tests ignorés : la spec BullMQ sans Redis) ; e2e **14/14 suites, 354 tests** (dont `depots-declaration`) ; **`test:conformite` 29/29 suites, 183 tests** (dont `accuses-depot.conformite-spec.ts` : l'index unique, dix consignations parallèles ⇒ une seule et un seul acte, une rectificative a le sien, tout ou rien sur une panne du journal, la relecture et l'isolement, le schéma strict). Le dernier commit (`f232d9d`, trois assertions de test, aucun code de production) a été rejoué sous Node 25 : service 18/18, e2e `depots-declaration` 39/39 ;
    - mutations 26/26 ; lint des fichiers touchés et `tsc` 0 ;
    - §1.5 : pile `grp-d` du fiscal **avec Redis** (image runtime de l'archive de `7df3823`) : santé `ok` (mongodb, audit, kafka, redis) ; les trois routes neuves montées et en `401` sans jeton ; `AccusesDepotModule` initialisé ; 0 `UnknownDependencies` sur 491 lignes de journal ; les index `un_accuse_par_version` et `accuse_par_depot` posés par l'application.
    - **Verrou Docker** : une prise, par le script autonome, de 16:31:49 à 16:46:34, rendue par son `trap`. B et C ont été prévenus (`-be`, `-f7`), après coup : une coupure réseau a interrompu la sous-session pendant la passe. Il ne reste aucun conteneur, volume ni réseau `grp-d`.
  - **Ce qui reste** :
    - → C : la garde `ACCUSE_REQUIS` dans `transitionner` — acceptée, placée en tête de 339 (après la fusion de 333) ;
      SHA de la fusion envoyé à C ;
    - Q-D-30 au PO ;
    - → A (plus tard) : FE-081 consigne l'accusé à l'étape `RELEVER_ACCUSE` du guidage ;
    - `prospera-assurance-service` : le consommateur `entitlement.changed` (D-1006-5, palier ④) peut être remplacé par
      `module.referentiels` de l'état publié (B, 1127, catalogue #84 efedd3e, contrat-etat-publie-v1.1) — optionnel,
      hors lot 7.
  - **Suivante : STORY-334** (le rejet administratif, `DEPOSEE → A_DEPOSER`, D-325-9 ; dossiers de D). Même
    réalignement que 333 (plan §4, n° 11) : 538 porte déjà le rejet du dépôt de liasse. Garder la version scellée, en
    sceller une de plus à la retransmission ; l'accusé de 333 est par version.

- **STORY-334** ✅ 📨 — le rejet administratif d'un dépôt engagé : consigné une fois par version, avec son motif à
  l'octet, sa cause en clair et la correction proposée ; la reprise dans le produit ; la version déposée intacte. Code :
  prospera-fiscal-service#82, `dev` `69d7e65`. Annonce avant le code : #1004, `main` 9bcdf01 (fiche D-334-1 → 15, ⚠
  Contrats, ⚠ Communs, → C, Q-D-31, Q-D-32). Plan §4, n° 11.
  - **Réalignement** (fiche, avant le code) : 334 n'était **pas** couverte. 538 couvre le rejet du **dépôt de liasse**
    (l'ancien modèle, qui reste) ; manquaient le rejet de la **déclaration** (le dépôt engagé de 330, la version scellée
    de 325), sa cause en clair et sa reprise, et le retour de l'obligation à « À déposer » (dans un fichier de C, D-325-9).
    537, 539, 688, 690 et 691 sont sans rapport. 334 complète sans réécrire 538.
  - **Livré** (dossier `depots` de D) :
    - **`POST /api/v1/depots-declaration/{depotId}/rejet`** (droit `preparer`, D-538-8 ; JSON : `rejeteLe`, `motif`,
      `reference?`, `cause?: { feuille?, cellule?, regle? }`, `correctionProposee?`) :
      - sur une déclaration exactement « Déposée », dont la version déposée est celle du dépôt engagé
        (`REJET_NON_CONSIGNABLE`, `LIVRABLE_PERIME`, `DEPOT_REMPLACE`, `OBLIGATION_DESACTIVEE`) ;
      - le motif par la règle de 538 (`MOTIF_INVALIDE`) ; les autres textes à l'octet (`TEXTE_REJET_INVALIDE`, `{ champ
        }`) ; `rejeteLe` entre le jour de l'engagement et aujourd'hui (`DATE_REJET_HORS_BORNES`) ;
      - une fois par version (`REJET_DEJA_CONSIGNE`, index `un_rejet_par_version`) ; accusé et rejet s'excluent
        (`ACCUSE_DEJA_CONSIGNE` ici, **`409 DEPOT_REJETE`** sur la route de l'accusé de 333) ;
      - `reprise` (la version rejetée, le retour à `A_DEPOSER`, six étapes dans le produit) ; `retard` à la date du rejet
        (l'échéance court toujours, les pénalités du paquet de dépôt jamais chiffrées) ;
      - acte `DEPOT_DECLARATION_REJET` au journal chaîné (empreintes seules), textes en clair dans `textes_audit` (329),
        dans la même transaction.
    - **`GET …/{depotId}/rejet`** et **`GET /api/v1/depots-declaration/rejets?obligationId=`** (AC-2 : chaque rejet et
      `retransmission`, la première version scellée après lui).
    - **Pour la porte de C** (D-334-8) : `AccusesDepotModule` exporte aussi `PreuvesDeRejet` ; la règle
      `verifierRejetAuRetour` (`409 REJET_REQUIS`).
    - **334 ne fait pas revenir le cycle** et n'écrit aucune version (le retour est dans `CycleObligationsService`).
  - **Communs** (D-L7-2, annoncés avant le code) : le contrat OpenAPI seulement. Aucune migration, aucun fichier de C.
  - **Preuves** :
    - Node 24 (image `verification` de l'archive LF de `8959a3a`, avant le rebase) : unitaires **248/249 suites, 3 708
      tests** (1 suite et 3 tests ignorés : la spec BullMQ sans Redis) ; e2e **14/14 suites, 360 tests** ; **`test:conformite`
      30/30 suites, 189 tests** (dont `rejets-depot.conformite-spec.ts` : l'index unique, dix consignations parallèles ⇒ un
      seul rejet et un seul acte, les textes en clair hors du journal sous leur empreinte, tout ou rien sur une panne du
      journal — ni rejet ni texte —, la relecture et l'isolement, le schéma strict). Après le rebase sur `c459960` (339 de C, au-dessus
      de `74b33ec` : la garde `ACCUSE_REQUIS`, qui fait importer `AccusesDepotModule` par `ObligationsModule`), archive LF
      de `b44eae6` : e2e **14/14 suites, 361 tests**.
    - Node 25 (local) : domaine 12/12, service 13/13, accusé 19/19, OpenAPI et gardes du module `depots` (9 suites, 125
      tests), e2e `depots-declaration` 44/44.
    - **Mutations 29/29**, chacune rouge sur une assertion : la porte du retour sans rejet ; « Accusé reçu » puis « À
      déposer » consignables ; un texte blanc, trop long, porteur d'un contrôle, rogné ; le motif non vérifié ; la
      correction sans ses sauts de ligne ; le nom du champ de la cause perdu ; une cause vide admise ; chaque borne de date
      retirée ; les étapes de la reprise perdues ; le motif en clair au journal ; la cellule perdue à l'acte ; les textes
      absents gardés ; le périmé non vérifié ; « consignable » non vérifié ; l'accusé de la version ignoré ; le rejet déjà
      consigné ignoré ; la date de l'engagement ignorée ; la retransmission qui prend la version rejetée, puis la plus
      récente ; les versions lues sans rejet ; l'accusé admis sur une version rejetée ; le droit `preparer` retiré ; la
      règle de la cause et la correction perdues dans la réponse. Quatre mutants qui rougissaient en compilation (un
      import devenu inutile) ont été réécrits en gardant l'intention ; deux restés verts au premier passage (la règle de la
      cause dans la réponse, le rejet déjà consigné vu avant l'écriture) ont reçu leur assertion, puis ont été rejoués.
    - lint des fichiers touchés et `tsc` 0.
    - §1.5 : pile `grp-d` du fiscal **avec Redis** (image runtime de l'archive de `8959a3a`) : santé `ok` (mongodb, audit,
      kafka, redis) ; les trois routes neuves montées et en `401` sans jeton ; `AccusesDepotModule` initialisé ; 0
      `UnknownDependencies` sur 497 lignes de journal ; les index `un_rejet_par_version` et `rejet_par_depot` posés par
      l'application. Rejouée sur l'arbre rebasé (archive de `b44eae6`) : santé `ok`, les trois routes en `401`, `AccusesDepotModule` initialisé (importé par `DepotsModule` et par `ObligationsModule`), 0 erreur sur 497 lignes, les index posés.
    - **Verrou Docker** : deux prises par les scripts autonomes, de 21:24:18 à 21:43:47 (la passe complète) et de 22:20:23 à 22:22:51 (la passe courte après le rebase), rendues par leur `trap`. B et C prévenus à chaque reddition. Il ne reste aucun conteneur, volume ni réseau
      `grp-d`.

  - **Ce qui reste** :
    - → C : ouvrir `DEPOSEE → A_DEPOSER` sur un rejet consigné (D-334-8) — ouverte. Jusque-là, la reprise passe par la
      rectificative de 325 (n + 1 nommée `RECTIFICATIVE`, la version n intacte) ;
    - Q-D-31, Q-D-32 au PO ;
    - → A (plus tard) : FE-081 consigne le rejet et affiche la reprise ; → 336 : le dossier de contrôle lit le rejet, son
      motif et la retransmission ;
    - bilan, assurance et notification ne lisent pas encore l'état publié (préalable un jour au retrait
      d'`entitlement.changed`, non demandé ; B 1128, contrat-etat-publie-v1.1 figé à 1.1.0) ;
    - assurance, liaison-assureur et sinistres : aucun test ne vérifie leur copie de `garde-etat-publie` (relevé par B,
      1128) — un test d'empreinte à ajouter ;
    - ← C : canal de la retenue d'IRPP — servie (339, fiscal #84 c459960 ; balance #173 61997fd ; organisme « service
      des impôts », LPF Art. 27) ; le format `TG × RETENUE-IRPP` (D-331-9) est à écrire par D, par donnée du paquet de
      dépôt ; non urgent ;
    - → C : garde `ACCUSE_REQUIS` — servie (fiscal #83, 74b33ec) ;
    - pour 336 : `GET /obligations/{id}/chemin` porte désormais `detail.basesLegales` (339 de C).
  - **Suivante : STORY-335** (l'archivage des livrables et des accusés, l'URL présignée ; dossiers de D). Même
    réalignement, en partie (plan §4, n° 12) : 682 archive déjà le fichier transmis d'une liasse, 333 la pièce d'un
    accusé (sous `accuses/`, sans URL).

- **STORY-335** ✅ 📨 — l'archive d'une déclaration déposée : le livrable déposé, archivé une fois par version et
  rattaché ; le livrable et la pièce de l'accusé relus par URL présignée après re-hachage ; l'archive par version. Code :
  prospera-fiscal-service#85, `dev` `108221e`. Annonce avant le code : #1009, `main` af552d3 (fiche D-335-1 → 10, ⚠
  Contrats, ⚠ Communs, → B, Q-D-31). Plan §4, n° 12.
  - **Réalignement** (fiche, avant le code) : 335 n'était couverte **qu'en partie**. 682 archive le fichier transmis
    d'une **liasse** (bucket privé `fiscal-depots`, URL présignée re-vérifiée) ; 333 archive la pièce d'un accusé sans
    la relire. Manquaient le livrable **déposé** d'une déclaration (330 le produit sans état), la relecture de la pièce
    de l'accusé, et l'archive par version. La copie dans `document-service` (AC-1, V9) n'est pas dans les dossiers de D :
    elle est demandée à B. 335 complète sans réécrire 538, 682, 333 ni 334.
  - **Livré** (dossier `depots` de D) :
    - **`POST /api/v1/depots-declaration/{depotId}/livrable`** (droit `deposer` ; multipart, un seul champ `fichier`) :
      - sur une déclaration « Déposée » ou au-delà (`LIVRABLE_NON_ARCHIVABLE`), par la règle du guidage
        (`DEPOT_REMPLACE`, `OBLIGATION_DESACTIVEE`, `LIVRABLE_PERIME`) ;
      - un format à fichier : le fichier réellement déposé, dont les trois propriétés d'estampille de 330 doivent être
        celles de la version déposée (`LIVRABLE_REQUIS`, `LIVRABLE_NON_CONFORME` `{ attendu, lu }`) ;
      - un formulaire : aucun fichier (`FICHIER_NON_ATTENDU`) ; le produit archive les valeurs de la version déposée
        (331) en JSON ;
      - une fois par version (`LIVRABLE_DEJA_ARCHIVE`, index `un_livrable_par_version`) ; l'objet sous
        `livrables/<orgId>/<archiveId>` avant l'écriture, supprimé si elle échoue ; rattaché au dossier, à
        l'implantation, au redevable, à la taxe et à la période ;
      - acte `DEPOT_DECLARATION_LIVRABLE_ARCHIVE` au journal chaîné (empreintes seules), dans la même transaction.
    - **`GET …/{depotId}/livrable`** et **`GET …/{depotId}/accuse/piece`** (AC-2, NFR-F07) : l'objet relu et re-haché
      (`FICHIER_ARCHIVE_ALTERE`, jamais une URL), puis une URL signée par l'endpoint public, `expireLe`, throttle 20/min ;
      `LIVRABLE_NON_ARCHIVE`, `PIECE_ACCUSE_ABSENTE`.
    - **`GET /api/v1/depots-declaration/archives?obligationId=`** : les rattachements de la déclaration et, par version
      (la plus récente d'abord), le livrable, l'accusé et le rejet. **C'est ce que 336 lira**
      (`ArchivesDepotService.deLaDeclaration`).
    - **La copie au fonds du client** passe par le port `CopieAuFondsDArchives`, branché sur un adaptateur **inerte** :
      rien ne sort tant que B n'a pas choisi la forme du lien (D-335-9, demande « h »). Si la copie échoue, l'archivage
      n'échoue pas.
  - **Communs** (D-L7-2, annoncés avant le code) : le contrat OpenAPI seulement. Aucune migration, aucun fichier de C ;
    `AccusesDepotModule` porte aussi le registre des livrables archivés, sans importer `ObligationsModule`.
  - **Preuves** :
    - Node 24 (image `verification` de l'archive LF de `91d7069`) : unitaires **252/253 suites, 3 798 tests** (1 suite et 3
      tests ignorés : la spec BullMQ sans Redis) ; **`test:conformite` 31/31 suites, 195 tests** (dont
      `livrables-archives.conformite-spec.ts` : les deux index, dix archivages parallèles ⇒ un seul livrable et un seul acte,
      ni la clé ni le nom du fichier au journal, une rectificative a le sien, tout ou rien sur une panne du journal, la
      relecture par version, par dépôt et par déclaration avec les rattachements, l'isolement, le schéma strict) ; e2e
      **13/14 suites, 368/369** : le seul rouge est un délai, `CLASSEUR_TROP_COUTEUX` sur la production du classeur (le fil
      isolé de 537 dépasse sa durée de 30 s) sous la charge du poste (les mutations tournaient en même temps). Une seconde
      passe, sur `f645baf`, a montré cinq rouges de la même cause : chaque cas de 335 produisait son classeur. L'e2e le
      produit désormais une seule fois (`418a22d`). Tout a été rejoué
      sur l'archive LF de `e55baa5` (rebasée sur `ffd6f2a`, C #86 ; l'e2e produit désormais le classeur une seule fois) : unitaires **252/253 suites, 3 807 tests** ; e2e **14/14 suites, 369 tests** ; `test:conformite` **31/31 suites, 196 tests** ; la pile `grp-d` rejouée elle aussi (santé `ok`, les quatre routes en `401`, 0 erreur sur 505 lignes, les index posés).
    - Node 25 (local) : les 21 suites du dépôt et du coffre, **450 tests** (domaine de l'archive 26, service 21, OpenAPI 9,
      gardes d'AD-12 et d'AD-13) ; e2e `depots-declaration` **52/52** (huit cas de 335).
    - **Mutations 33/33**, chacune rouge sur une assertion :
      - le domaine : « À déposer » archivable, puis « Déposée » refusée ; un format à fichier sans fichier admis ; un
        formulaire avec fichier admis ; l'obligation, la version, puis l'empreinte de l'estampille non comparées ; la version
        comparée après `trim` ; une propriété absente lue comme une chaîne vide ; l'estampille, puis les valeurs perdues dans
        le formulaire sérialisé ; la taille perdue dans l'acte ; l'archive triée en ordre croissant, puis lexical ; le rejet
        perdu ; les versions sans livrable ignorées ;
      - le service : le périmé non vérifié ; « archivable » non vérifié ; l'estampille du fichier non lue ; un livrable déjà
        archivé vu après l'archive ; l'orphelin non supprimé ; l'implantation perdue ; l'empreinte calculée sur d'autres
        octets ; une URL sans re-hachage ; une pièce absente dite autrement ; une copie au fonds dont l'échec fait échouer
        l'archivage ; une copie jamais demandée ; une relecture hors de la portée ; l'archive par version sans les accusés ;
      - la route et le stockage : le droit `deposer` retiré ; un fichier vide pris pour un fichier ; la clé publiée dans la
        réponse ; le doublon d'un autre index pris pour celui de la version (MongoDB réel, sous Docker) : rouge sur une assertion (1 échec sur 6) ; une première écriture, qui retirait le test du doublon, rougissait en compilation (un import devenu inutile).
      - Six mutants rougissaient d'abord en compilation (un membre privé ou un import devenus inutiles, un `null`, du code
        inatteignable) : ils ont été réécrits en gardant l'intention, puis rejoués. Un seul est resté vert au premier
        passage (le fichier vide) : il a reçu son assertion (e2e) et a été rejoué.
    - lint des fichiers touchés et `tsc` : 0.
    - §1.5 : pile `grp-d` du fiscal **avec Redis** (image runtime de l'archive de `91d7069`) :
      - santé `ok` (mongodb, audit, kafka, redis) ;
      - les quatre routes neuves montées et en `401` sans jeton (celles de 330 → 334 aussi) ;
      - `DepotsModule`, `AccusesDepotModule` et `ObligationsModule` initialisés ; 0 `UnknownDependencies` sur 511 lignes de journal ;
      - les index `un_livrable_par_version` et `livrable_par_depot` posés par l'application.
    - **Verrou Docker** : trois prises par des scripts autonomes, chacune rendue par son `trap` : 00:30:18 → 00:48:05 (passe 1, `91d7069`), 00:48:27 → 00:56:44 (l'e2e rejoué et la mutation du registre), 01:18:16 → 01:25:48 (passe finale sur `e55baa5`). Un quatrième script, lancé puis arrêté avant toute prise, quand C a fusionné #86. B et C prévenus à chaque reddition. Il ne reste aucun conteneur, volume ni réseau
      `grp-d`.

  - **Ce qui reste** :
    - → B : la copie dans le fonds d'archives du client — ouverte, placée par B (« h », après 1129, avant 1130). D
      branchera l'adaptateur (un fait ou un appel) dès la réponse de B ; jusque-là AC-1 est tenu dans le fiscal (Q-D-31) ;
    - → 336 : le dossier de contrôle lit l'archive par version, `detail.basesLegales` (339 de C) et la validation du
      client (port de C) ;
    - → A (plus tard) : FE-081 archive le livrable déposé et ouvre les pièces ;
    - → C : `DEPOSEE → A_DEPOSER` sur un rejet consigné (D-334-8) — servie (C, fiscal #86, `ffd6f2a`) ;
    - Q-D-30, Q-D-31 au PO.
  - **Suivante : STORY-336** (le dossier de contrôle à la demande ; dossiers de D). Il lit l'archive par obligation et
    par version (`GET /api/v1/depots-declaration/archives`, ou `ArchivesDepotService.deLaDeclaration`).

### Lot 6 (ouvert le 2026-11-24)

- **Plan** : `PLAN-LOT-6-2026-11-23.md` §6 : **STORY-1065 → 1071** (le reste de la plage 1030 → 1079 de D), quatre stories
  d'assurance et trois de distributeur, au backend, les deux verticaux alternés : 1065 (la facture juste (3)), 1066
  (l'avoir), 1067 (la commande (3)), puis 1068 → 1071 (l'assurance : `sinistres` lit `provision.changed@1`,
  `sinistres.evaluation.arretee@1`, l'alerte bloquante, la mission d'expertise). Une sous-session neuve par story
  (`REGLES-DES-GROUPES.md` §1.2). **Dépôts** : ceux du distributeur (comme au lot 4), **plus `prospera-sinistres-service`
  et `prospera-assurance-service`** (D-L6-3 : repris de C, qui écrit sa passation avant 1068 ; la première story
  d'assurance de D la constate). **Même poste que B** (BFF de la console, recette, catalogue, auth, kyc, bilan, balance,
  dossier ; quatre stories sur sept avec une pile complète) : **même verrou Docker**. Avant le 04/12 : la passation à
  Dev A mise à jour (D-L3-6), par 1071 — **faite le 2026-11-24 ; le lot 6 de D est fini (7/7)**.
- **STORY-1065** ✅ 🚚 — la facture juste (3) : les mentions légales, le PDF figé, le lien public d'envoi
  (prospera-ventes-service#13, `dev` 3242844, ca44566, 5929438 ; annonce « ⚠ Contrats » #763 avant le code, manifeste
  `facturation` amendé, C7). Rituel (2026-11-24) : aucune demande neuve à D pour le distributeur dans les journaux de A,
  B et C (la passation de C, D-L6-3, vise 1068).
  - **Les mentions légales** (FR-44, liste de travail jusqu'à A-1) : `facturation_parametres` versionnés (`GET|PUT
    /api/v1/facturation/parametres`, droit neuf `facturation:parametres:modifier`, servi par B : STORY-979) — la fiche de
    l'émetteur saisie par le DAF faute de propriétaire (Q-D-12), quatorze codes de mention (toutes exigées par défaut),
    pénalités, escompte, durée du lien (7 j), conservation (10 ans) ; client et articles lus dans
    `facturation_clients_lus` et `facturation_articles_lus` (futures projections de `pdv` et `catalogue`, remplies par
    personne) ; **`MENTION_OBLIGATOIRE_MANQUANTE` jugée dans la transaction du numéro, aucun numéro consommé** ; mentions
    figées sur la facture (`mentions`, `parametresVersion`).
  - **Le PDF figé** (FR-46, AD-6) : pdfkit 0.19.1 épinglé, Liberation Sans embarquée (OFL, empreintes figées),
    déterministe (dates du document = émission) ; `pdf.etat` `EN_ATTENTE` → `PRODUIT` (`ECHEC` après cinq essais),
    produit après la réponse et par un balayage (2 s) ; octets dans `facturation_pdfs` (écriture majoritaire) avant
    `PRODUIT` ; empreinte vérifiée à chaque lecture (`PDF_ALTERE`) ; `GET …/factures/{id}/pdf`.
  - **Le lien public** (AD-33) : jeton de 128 bits haché, adresse rendue une fois, expiration figée, révocation ; `GET
    /api/v1/facturation/liens-publics/{jeton}` sans compte (statut « route publique » neuf dans l'invariant des routes),
    30 ouvertures par minute et par adresse, chaque ouverture tracée dans la piste.
  - Node 24 : 634 unitaires (63/63 suites), 24 e2e, 171 d'intégration (21 neufs) ; mutations 11/11 (pures) et 9/9
    (MongoDB réel). Pile `grp-d` : `docker compose up` sain, pilote 27/27 (texte du PDF servi lu par `pdfjs-dist`), rejoué
    sur les images reconstruites depuis `origin/dev` (`--no-cache`, volumes neufs).
  - Décisions D-1065-1 → 15 (fiche ; D-1065-15 : la version du manifeste `facturation` monte avec 1066) ; recette
    versionnée `scripts/recette/1065/` ; Q-D-12 au PO. **Verrou Docker tenu par B (1080) de 02:00 à 03:27 ; attendu par
    boucles bornées, pris à 03:27, une seule prise, rendu à 04:09** ; aucun conteneur, volume ni réseau `grp-d` ne reste.
  - **Suivante : STORY-1066** 🚚 (l'avoir, `ventes` : `AV-`, `AVOIR_SUPERIEUR_A_LA_FACTURE`, `facturation.avoir.emis@1`, son
    PDF « Avoir » ; **monter le manifeste `facturation` à la source**, D-1065-15).
- **STORY-1066** ✅ 🚚 — l'avoir (prospera-ventes-service#14, `dev` d9f4264, 2937af8, e9f77dd, adaa2bb ; annonce
  « ⚠ Contrats » #782 avant le code, `main` 24049e4 : **manifeste `facturation` 1.1.0 à la source**, C7 : +
  `facturation:avoir:valider` ; D-1065-15). Rituel (2026-11-24) : aucune demande neuve à D pour le distributeur dans les
  journaux de A, B et C (la réponse de B à 1065, D-979-7, est celle que D-1065-15 sert ici).
  - **L'avoir** (`POST /api/v1/facturation/factures/{factureId}/avoirs`, `facturation:avoir:emettre`) : `TOTAL`, `LIGNES`,
    `MONTANT`, motif de FR-48 ; jamais plus que le reste à créditer, ligne par ligne et taux par taux
    (`AVOIR_SUPERIEUR_A_LA_FACTURE`, jugé dans la transaction du numéro sur le crédit de la facture,
    `facturation_credits_des_factures` : aucun numéro consommé ; deux avoirs simultanés, un seul passe) ; la TVA d'un
    taux soldé est son reste exact (le cumul égale la facture au franc).
  - **La numérotation suivie** : série `avoirs`, `AV-AAAA-NNNNNN`, tête sur `facturation.serie.changed@1` (énumération de
    `serie` retirée, BACKWARD) ; suite reprenable de Sage (`PUT /numerotation/avoirs`, FR-217).
  - **Le fait** `facturation.avoir.emis@1` (neuf ; clé `<org>:<factureId>`, `cumulTtcMineur`, `soldeLaFacture`) ; **le PDF
    « Avoir »** figé (`facturation_pdfs_avoirs`) ; **la facture lue** gagne `statut` (`ANNULEE_PAR_AVOIR`) et `avoirs`, son
    document n'est pas modifié (AD-6).
  - **Le seuil du DAF** : `seuilValidationAvoirMineur` (500 000, facultatif au `PUT`, repris de la version lue), droit
    neuf `facturation:avoir:valider` (→ B), 403 `VALIDATION_DU_DAF_REQUISE` sans numéro.
  - Node 24 : 654 unitaires (64/64 suites), 24 e2e, 181 d'intégration (10 neufs) ; mutations 10/10 (pures) et 6/6
    (MongoDB réel) ; Karapace : avoir neuf, série BACKWARD (témoin INCOMPATIBLE). Pile `grp-d` : `docker compose up` sain,
    pilote 25/25 (texte du PDF lu par `pdfjs-dist`), rejoué sur les images reconstruites depuis `origin/dev`.
  - Décisions D-1066-1 → 14 (fiche) ; recette versionnée `scripts/recette/1066/` ; → B (le droit, la recopie du
    manifeste 1.1.0 à `24049e4`, le consommateur de `paiement`). **Verrou Docker libre ; pris à 09:20, rendu à 09:58, une seule
    prise** ; aucun conteneur, volume ni réseau `grp-d` ne reste.
  - **Suivante : STORY-1067** 🚚 (la commande (3) : modifier une commande transmise, `ventes` ; ordre de D-1062-12).
- **STORY-1067** ✅ 🚚 — la commande (3) : modifier une commande `BROUILLON`, `TRANSMISE` ou `VALIDEE` non commencée
  (prospera-ventes-service#15, `dev` cd5fc87, dab9b3e, f9f2d37, da44015, 52971b5 ; annonce « ⚠ Contrats » #792 avant le code,
  `main` 6f939fa ; aucun schéma ni manifeste ne change). **Dernière story du distributeur de ce lot.** Rituel
  (2026-11-24) : aucune demande neuve à D pour le distributeur ; B a servi les points (1) et (2) de la demande de 1066
  (voir « Réponses aux demandes reçues »). « Fini quand » fixé par la fiche (D-1067-1 : le plan ne le fixait pas).
  - **La modification** (`POST /api/v1/commande/commandes/{id}/modifications`, `commande:commande:saisir`) à la révision
    lue (`REVISION_PERIMEE`), par l'auteur ou le bureau (`commande:reseau:consulter`) ; une `VALIDEE` demande aussi
    `commande:commande:valider` (`ROLE_NON_AUTORISE`) ; lignes gardées au prix figé, neuves au prix de la grille ;
    `COMMANDE_NON_MODIFIABLE`, `VALIDATION_EN_COURS`, `COMMANDE_FACTUREE` (un avoir, 1066).
  - **L'historique** champ par champ (`commande_modifications`, `GET …/modifications`), en lecture seule ; piste
    `MODIFICATION`.
  - **Une `VALIDEE`** rejugée sur la différence (FR-33 : la commande non comptée deux fois), réservation remplacée en un
    seul appel au port `stock.remplacer` (AD-8 ; `STOCK_INSUFFISANT` : tout comme avant ; `RESERVATION_INDISPONIBLE` :
    la modification attend son rejeu, `MODIFICATION_EN_COURS` entre-temps), bons qui gardent leur numéro,
    `validee@1` et `chiffree@1` au rang neuf (`facturation` facture la commande modifiée) ; points de stock inchangés
    (`POINT_DE_STOCK_CHANGE`, D-1067-12).
  - **La fenêtre avec `facturation`** : la baisse d'engagement d'une facture attend une modification en cours ; la facture
    d'une commande modifiée après elle baisse l'engagement du TTC de la commande (`FACTURE_D_UNE_COMMANDE_MODIFIEE`).
  - Node 24 : 667 unitaires (65/65 suites), 24 e2e, 199 d'intégration (17/17 suites ; `commande-3.int-spec.ts` 16, 2 HTTP) ;
    mutations 11/11 (pures) et 12/12 (MongoDB réel). Pile `grp-d` : `docker compose up` sain, pilote 23/23, rejoué sur les
    images reconstruites depuis `origin/dev` (volumes neufs).
  - Décisions D-1067-1 → 16 (fiche ; D-1067-16 : ce qui reste) ; recette versionnée `scripts/recette/1067/`. **Verrou
    Docker libre au rituel (B l'avait rendu) ; pris à 10:33, une seule prise, rendu à 11:04** ; aucun conteneur, volume ni réseau
    `grp-d` ne reste.
  - **Suivante : STORY-1068** 🛡️ (assurance : `sinistres` lit `provision.changed@1` ; première story d'assurance de D :
    constater la passation de C, D-L6-3, et noter `prospera-liaison-assureur-service` resté à C).

- **STORY-1068** ✅ 🛡️ — `sinistres` lit `assurance.provision.changed@1` : le dossier montre la provision en vigueur
  (prospera-sinistres-service#29, `dev` 2a8f9f1, ddcf52a ; annonce « ⚠ Contrats » #796 avant le code, `main` 53f9e2a ;
  aucun schéma ni manifeste ne change ; `assurance` non touché). **Première story d'assurance de D** : passation de C
  constatée (« Passations » : sinistres `ea1a111`, assurance `8dc3285`, les SHA de C ; `prospera-liaison-assureur-service`
  reste à C). Rituel (2026-11-24) : aucune demande neuve à D dans les journaux de A, B et C. « Fini quand » fixé par la
  fiche (D-1068-1 : le plan ne le fixait pas).
  - **Le consommateur** `sinistres-service.provision` (topic créé avant l'abonnement, métadonnées à 10 s) ; un fait
    illisible ou hors contrat écarté entier ; **le read-model** `sinistres_provisions_en_vigueur` (plus haute séquence
    par dossier : rejeu, doublon, retard et course sans effet ; le dossier ne gagne ni version, ni piste, ni fait).
  - **La vue** : `provision` au dossier lu, `montants.provision` aux évaluations : `EN_VIGUEUR` (montant, devise,
    séquence, avant, motif, origine, date d'effet), `SANS_MOUVEMENT`, `NON_INSTALLE` (`assurance` voisin suivi, C4),
    `NON_LISIBLE` (hors DG, DT, RESP, GEST, AUD : annexe B, ligne 12). « En attente du `RESP` » n'est pas lu (D-1068-6).
  - Node 24 : 1328 unitaires (67 suites) sur MongoDB et Redis réels, 33 e2e, lint, build ; mutations 12/12 (Node 25) et
    4/4 (MongoDB réel). Pile `grp-d` (sinistres + assurance, même Kafka) : `docker compose up` sain, pilote 27/27
    (latence du premier mouvement 1,3 s), rejoué sur l'image reconstruite depuis `origin/dev`.
  - Décisions D-1068-1 → 11 (fiche ; D-1068-11 : ce qui reste) ; recette versionnée `scripts/recette/1068/`. **Verrou
    Docker libre au moment des preuves (B l'avait rendu après 1113) ; pris à 11:29, une seule prise, rendu à 11:48** ;
    aucun conteneur, volume ni réseau `grp-d` ne reste.
  - **Suivante : STORY-1069** 🛡️ (`sinistres.evaluation.arretee@1` publié, D-1013-9 ; `sinistres`).

- **STORY-1069** ✅ 🛡️ — `sinistres.evaluation.arretee@1` publié : l'arrêt de l'évaluation publie le fait au contrat, dans
  sa transaction (prospera-plateforme#38, `dev` 9560b44 ; prospera-sinistres-service#30, `dev` a2671c6, a5fae87 ; annonce
  « ⚠ Contrats » #800 avant le code, `main` 4aabfd2 ; aucun manifeste ne change : le fait était déjà en C5). Rituel
  (2026-11-24) : aucune demande neuve à D dans les journaux de A, B et C. « Fini quand » fixé par la fiche (D-1069-1 :
  le plan ne le fixait pas).
  - **Le schéma** (`contrats/assurance/sinistres/evaluation.arretee.schema.json`, fermé, Ajv strict) : `versionObjet` (la
    version du `dossier.changed@1` de la transaction), `rang`, `montant` au franc, `devise`, auteur et rôle, dates ;
    avec un décompte : tables et `franchiseRetenue`. Jamais le motif écrit, le décompte détaillé, la nature corporelle,
    la provision. Cinq champs classés au registre `classification-sante`.
  - **La publication** : à chaque arrêt accepté (premier ou correction, tout volet), dans le crochet `faits` de
    l'écriture : `dossier.changed` → `evaluation.arretee` → `provision.revisee` (1016) ; rien pour un refus ou un rejeu.
  - **Le consommateur** nommé par la spine (AD-16) : `liaison-assureur`, à C (envoi C-14) — demande d'information
    écrite (« Demandes aux autres groupes ») ; `expertises` n'en est pas (spine), à revoir avec 1071.
  - Node 24 : plateforme 121 + 29 tests, `tsc` ; sinistres lint 0, **1336 unitaires (67 suites) sur MongoDB et Redis
    réels** (8 délais de crochet de 5 s sous charge au premier passage, jamais sur 1069 : rejoués, verts ; piège 1069-1),
    33 e2e, build ; mutations 10/10 (Node 25) et 3/3 (MongoDB réel), mutation du registre rouge. Pile `grp-d`
    (sinistres + assurance + Karapace) : `docker compose up` sain, **pilote 28/28** (sujet neuf BACKWARD, témoins,
    garde `classification-sante` 0 refus, faits valides au schéma relu du registre, ordre de l'outbox, provision alignée
    à 558 000), rejoué sur l’image reconstruite depuis `origin/dev` (28/28).
  - Décisions D-1069-1 → 11 (fiche ; D-1069-11 : ce qui reste) ; recette versionnée `scripts/recette/1069/`. **Verrou
    Docker libre au rituel ; pris à 12:13, une seule prise, rendu à 13:09** ; aucun conteneur, volume ni réseau
    `grp-d` ne reste.
  - **Suivante : STORY-1070** 🛡️ (lever une alerte bloquante avec motif, D-1013-10 ; `sinistres`).

- **STORY-1070** ✅ 🛡️ — lever une alerte bloquante : le gestionnaire lève avec un motif l'alerte `BLOQUANT` du
  décompte, et l'évaluation s'arrête (prospera-sinistres-service#31, `dev` 6a0c28d ; #32, le banc MongoDB, `dev` 6002aac ; annonce « ⚠ Contrats » #803 avant le
  code, `main` 36d4acf ; aucun schéma de fait ni manifeste ne change). Rituel (2026-11-24) : aucune demande neuve à D
  dans les journaux de A, B et C. « Fini quand » fixé par la fiche (D-1070-1 : le plan ne le fixait pas).
  - **La levée** (`POST …/dossiers/{id}/instruction/levees`, GEST, GREC, RESP ; `EN_INSTRUCTION` ou `EVALUE`) : motif
    ≥ 10 caractères (`MOTIF_ECRIT`) ; seulement une alerte `BLOQUANT` présente au décompte du **dernier** enregistrement
    (`ALERTE_ABSENTE`), une fois par enregistrement (`ALERTE_DEJA_LEVEE`) ; hors fenêtre `LEVEE_IMPOSSIBLE`. Rangée dans
    `instruction.levees` (ajout seul), piste `LEVER_ALERTE`, `dossier.changed@1` seul.
  - **L'arrêt** : levée sur l'enregistrement en vigueur, l'alerte ne bloque plus ; l'évaluation copie `alertesLevees` ;
    un nouvel enregistrement qui garde l'alerte la rebloque (D-1070-3). **Lever, c'est évaluer** (partie `EVALUER`).
  - **La raison s'affiche** : `GET …/instruction` gagne `alertes` (et leur levée) et `levees`.
  - **Les délais de crochet de 1069 sont revenus** au rejeu sur `origin/dev` (7 échecs, après un premier passage vert) :
    cause mesurée (une base, six collections et leurs index créés puis supprimés **par test**, sérialisés dans `mongod`)
    et corrigée dans le banc (#32 : base créée une fois, collections vidées entre deux tests ; aucun délai relevé ;
    D-1070-10, piège 1070-1).
  - Node 24 : lint 0, **suite unitaire complète d'un trait 1366/1366 (68 suites) au délai de 5 s, 85 s** (168 s avant),
    34 e2e, build ; mutations 11/11 et 3/3 (MongoDB réel) ; rejoué sur l'export d'`origin/dev`.
  - Décisions D-1070-1 → 11 (fiche ; D-1070-11 : ce qui reste) ; recette versionnée `scripts/recette/1070/`. Pas de pile
    `grp-d` (D-1070-9). **Verrou Docker libre au rituel ; pris à 13:40, une seule prise, rendu à 14:34** ; aucun
    conteneur, volume ni réseau `grp-d` ne reste.
  - **Suivante : STORY-1071** 🛡️ (la mission d'expertise, FR-61 ; `sinistres` ; dernière du lot 6 : « Le lot 6 de D est
    fini » et la passation à Dev A, D-L3-6).

- **STORY-1071** ✅ 🛡️ — la mission d'expertise et sa machine unique (FR-61), et l'évaluation qui l'attend
  (prospera-plateforme#39, `dev` 2c96703 ; prospera-sinistres-service#33, `dev` 9c9a997, 1c7b49a, b327f18, 095e577 ;
  annonce « ⚠ Contrats » #809 avant le code, `main` 77bd6c4 ; aucun manifeste ne change). Rituel (2026-11-24) : une
  demande neuve de B à D (STORY-1103 : prévenir le cabinet d'un renvoi KYC), **placée en STORY-1072** (« Réponses aux
  demandes reçues ») ; rien d'autre pour D dans les journaux de A et C. « Fini quand » fixé par la fiche (D-1071-1 : le
  plan ne le fixait pas).
  - **La mission** (`expertises`, `src/modules/expertises/missions/`) : la machine en données
    (`machine-des-missions-2026.1.json` : treize états, treize actes, rôles, motifs, délais de rapport par domaine) ;
    `POST /api/v1/expertises/missions` (GEST, RESP ; `A_DESIGNER`) et `POST …/missions/{id}/actes` ; `GET …/missions` et
    `/{id}` (déjà déclarées). Désignation jugée par `exigerDesignable` (1014) après le rôle et le graphe ; l'expert qui a
    décliné n'est plus désignable (`EXPERT_NON_ELIGIBLE`) ; externe imposé (contre-expertise, contradictoire) ;
    `TRANSMISE` pour un externe ; actes de l'expert par son compte, ou « saisis pour le cabinet » sans compte ; rapport =
    `pieceId` + `versionPiece` (+ chiffrage) ; `COMPLEMENT_EXPERT_RECU` ; arbitrage RESP, DG, DT. Mission médicale non
    servie (D-1071-5).
  - **Le fait** `expertises.mission.changed@1` (schéma fermé, neuf champs classés ; ni domaine, ni texte, ni expert
    nommé), publié par l'outbox du service (code commun : `topics.ts` gagne `ExpertisesTopic`, l'invariant vérifie chaque
    topic au manifeste de son module).
  - **`sinistres`** : consommateur `sinistres-service.missions` ; mission rangée au dossier (commande du système, piste
    `MISSION_CHANGEE`) ; **`EXPERTISE_VALIDEE` devient une condition calculée** (elle n'était posée par personne : la
    transition 7 refusait tout dossier) — un dossier sans mission passe, une mission ouverte est nommée, à la transition
    et à l'arrêt ; **le chiffrage validé est le repère du montant arrêté** (D-1070-11 : motif s'il diffère,
    `chiffrageDExpertise` copié).
  - Node 24 : lint 0, **suite unitaire complète d'un trait 1437/1437 (73 suites) sur MongoDB et Redis réels, 140 s**, 37
    e2e, build ; mutations 22/22 (Node 25) et 5/5 (MongoDB réel) ; plateforme 657 tests (0 échec), `typecheck`. Pile
    `grp-d` (sinistres + Karapace) : `docker compose up` sain, **pilote 27/27** (mission lue en 0,3 s, arrêt refusé puis
    repéré sur le chiffrage, transition 7 sans constat, huit faits valides au schéma du registre).
    Rejoué sur l'export d'`origin/dev` (`095e577`, images `--no-cache`, volumes neufs) : lint 0, unitaires 1437/1437 d'un
    trait (73 s), 37 e2e, build 0, pilote 27/27.
  - Décisions D-1071-1 → 12 (fiche ; D-1071-12 : ce qui reste) ; recette versionnée `scripts/recette/1071/`. **Verrou
    Docker libre au rituel ; pris à 15:19, une seule prise, rendu à 15:46** ; aucun conteneur, volume ni réseau `grp-d`
    ne reste.
  - **Suivante** : aucune dans le lot 6. Hors du lot : **STORY-1072** (la demande de B : le cabinet prévenu par e-mail
    d'un renvoi KYC), placée ici, fiche à écrire juste avant de coder ; puis **STORY-1073** (la facture lit sa fiche
    légale chez `dossier-service` et ses comptes chez `paiement`, Q-D-12 répondue le 2026-11-24 ; dépend de B).

- **Le lot 6 de D est fini : 7 stories sur 7 (1065 → 1071), le 2026-11-24.** Trois de distributeur (1065 la facture
  juste (3), 1066 l'avoir, 1067 la commande (3)), quatre d'assurance (1068 → 1071) ; la passation à Dev A est mise à
  jour (« Passations », D-L3-6, avant le 04/12).
- **Le lot 6 de D est rouvert le 2026-11-24 (soir)** par l'amendement du plan (`PLAN-LOT-6-2026-11-23.md` §2 D-L6-5,
  §6) : consigne de l'utilisateur, les manques de l'Atelier, de la balance et du bilan entrent au lot 6, répartis par
  dépôt. **D prend `prospera-bilan-service`** (repris de B, passation demandée ci-dessous) et cinq stories :
  **STORY-1076** (les seuils de l'analyse financière) → **1077** (capitaux propres < ½ capital) → **1078** (les quatre
  contrôles d'intégrité, et la liasse rapprochée de sa balance par l'empreinte de 1022, C) → **1074** (la consolidation
  s'installe à part) → **1075** (les routes d'instance du bilan). **D'abord STORY-1072** (demande de B, 1103), le temps de
  la passation du bilan ; **STORY-1073** juste après 1076 : D y fait aussi les deux côtés producteurs
  (`dossier-service`, `paiement`), sur consigne de l'utilisateur du 24/11 (soir) : « gère tout cela dans la story 1073 sans attendre la livraison de B », après la passation de B limitée à
  1073. Les douze identifiants (1019 → 1023 de C, 1072 → 1078 de D)
  sont réservés au tracker ; la marque haute ne bouge pas. **Ordre de D mis à jour le 2026-11-25 (STORY-1118)** :
  1072 ✅ → 1076 ✅ → 1073 ✅ → 1077 ✅ → 1078 ✅ → 1118 ✅ (les amortissements rattachés aux postes) → 1079 ✅ (la garde
  de bilan dans l'essai, demande de B, Q-D-17) → **1074** → 1075.

- **STORY-1072** ✅ 📨 — le cabinet prévenu par e-mail du renvoi de son dossier KYC (demande de B, STORY-1103)
  (prospera-notification-service#92, `dev` 7a11331, 749b3cd ; prospera-expert-comptable#11, `dev` 4154038, b540904 ;
  annonce « ⚠ Contrats » #816 avant le code, `main` af601d7, et complément D-1072-12 #832 avant la fusion de #92, `main`
  a61893c). **`prospera-expert-comptable` porté par D le temps de la story** (Q-D-13, choix par défaut ; le dépôt garde
  « aucun titulaire »). Rituel (2026-11-24) : la demande de B (#805) est celle-ci ; rien d'autre pour D chez A et C ; B a
  écrit sa passation de `prospera-bilan-service` (« Passations » de B, dernier commit `7b53ff5`). « Fini quand » fixé par
  la fiche (D-1072-1).
  - **`notification`** : modèle système `kyc-dossier-renvoi-correction` (e-mail, `fr`/`en`), variables `texte` (recopié
    tel quel, D-1103-5) et **`lienEspace`** (pas `lien`, nom réservé aux secrets, D-1072-2) ; `CLES_MESSAGES_KYC` à
    quatre clés, seul `expert-comptable` le fait partir.
  - **`expert-comptable`** : le groupe `expert-comptable-kyc` lit aussi `kyc.correction.requested` (aiguillage par
    topic) ; enveloppe jugée par une fonction pure ; la file d'abord, le marqueur ensuite (D-1072-7) ; une demande par
    administrateur actif ; `ESPACE_KYC_URL` facultative (absente : pas d'e-mail du renvoi, D-1072-9) ; schéma de kyc
    copié à l'octet et confronté aux champs lus (D-1072-10).
  - **Relevé sur la pile et corrigé à la cause (D-1072-12)** : le premier administrateur recevait l'e-mail deux fois — le
    journal d'une remise déjà acceptée perdait sa transaction sur un conflit d'écriture transitoire avec la préparation
    du second envoi (même compteur de période), BullMQ rejouait la remise. Le journal rejoue désormais sa transaction
    (cinq essais) ; vaut pour tous les appelants de `notification`.
  - Preuves : expert-comptable 390 tests (Node 25, kafkajs), notification **288/288 suites, 4233 tests sous Node 24** ;
    mutations 18/18, 4/4 et 5/5. Pile `grp-d` (kyc d'`origin/dev`, notification, expert-comptable, Kafka, mailhog, faux
    JWKS) : **AC-5 de STORY-1103 vu dans mailhog, pilote 35/35** (renvoi par les vraies routes de kyc, deux e-mails mot
    pour mot 2,2 s après, rejeu muet, fait hors contrat écarté) ; arbres fusionnés identiques aux images testées.
  - Décisions D-1072-1 → 12 (fiche) ; recette versionnée `expert-comptable/scripts/recette/1072/`. **Verrou Docker : pris
    à 18:24 (image de kyc), rendu à 18:25 pendant les mutations ; repris à 18:38, rendu à 19:35 ; repris à 19:36, rendu à
    20:06** (un passage du pilote perdu : Kafka `unhealthy` sous la charge de la suite Node 24 lancée en même temps,
    piège 1072-2) ; aucun conteneur, volume ni réseau `grp-d` ne reste.
  - **Suivante : STORY-1076** (les seuils de l'analyse financière, `prospera-bilan-service` ; première story de bilan de
    D : constater la passation de B, `7b53ff5`, dans « Passations »).

- **STORY-1076** ✅ 📊 — les seuils de l'analyse financière, sourcés et versionnés dans le paquet : FE-141 reçoit ses
  verdicts (prospera-bilan-service#186, `dev` e4cee3e ; annonce « ⚠ Contrats » #835 avant le code, `main` cb0c2da).
  **Première story de bilan de D** : passation de B constatée au rituel (`origin/dev` = `7b53ff5`, aucune PR ouverte ;
  « Passations »). Rituel (2026-11-24) : rien d'autre pour D chez A, B et C (l'écart FE-141 du journal de A est cette
  story).
  - **La recherche des sources** (fiche) : aucune source citable dans `prospera-stories` (pack de 25 livres, référentiels,
    rapports, PRD : les « couverture 1,20, autonomie 33 % » du PRD sont des [ASSUMPTION]) ; une source publique
    officielle : **BCEAO, procédure révisée du dispositif des accords de classement des entreprises non financières (mars
    2020)**, quatre ratios de décision en codes de la liasse SYSCOHADA révisé. Trois ont **la même formule** qu'un
    indicateur publié : autonomie financière CP / DZ ≥ 20 % (`POIDS_CAPITAUX_PROPRES`), liquidité générale (BK + BT) /
    (DP + DT) ≥ 1, marge nette XI / XB positive. La quatrième (capacité de remboursement ≤ 4) divise par la **CAFG**,
    l'indicateur par l'EBE : non appliquée (D-1076-8).
  - **Livré** : le bloc `seuils` de `syscohada-revise@2.1`, `@2.2`, `@2.3` et `zone-franche-togo@1.0` (même bloc,
    `TOUS` secteurs, deux niveaux `RISQUE` / `BON`, source citée avec paragraphe, phrase et URL), **révision en place**
    (D-1076-2 : additif, liasse inchangée, prouvé bloc retiré) ; empreintes à jour ; les **seize autres** indicateurs
    restent sans repère (**Q-D-14**, défaut appliqué). Le contrat d'analyse ne change pas, son contenu si.
  - Preuves : Node 25, suite complète : 333 suites vertes sur 349, 11 973 tests verts (les 16 rouges connues : 13
    binding de Confluent, deux chemins Windows, `homogeneisation.regles` sous la charge — vert seul) ; spec neuve
    `analyse.seuils-livres` 22/22 (quatre paquets par le vrai chargeur, liasse saine « BON », fragile « RISQUE », seize
    sans repère) ; e2e `bilan-analyse` + `openapi-contract` 583/583 (dry-run réel : trois verdicts « BON ») ; **mutations
    9/9 tuées sur l'assertion** ; lint 0, build OK ; arbre fusionné identique au commit testé.
  - Décisions D-1076-1 → 8 (fiche) ; Q-D-14 au PO ; → C : recopie à l'octet des trois `syscohada-revise` dans
    `balance-service` (ticket). **Sans Docker** (aucun module, dépendance ni Dockerfile ne change ; précédent de B
    pour 483/065/1084) : verrou non pris (tenu par B, 1112, au moment de la story).
  - **Suivante : STORY-1073** (plan amendé, `main` a39f250 : ordre 1072 ✅ → 1076 ✅ → **1073** → 1077 → 1078 → 1074 →
    1075) — la facture lit sa fiche légale, D faisant aussi les côtés producteurs (`dossier-service`, `paiement`) ; B
    a écrit leur passation limitée à 1073 (journal de B, `main` dde8f19 : dossier `2bf9dbd`, paiement `4684d22`) : la
    sous-session de 1073 la constate. Puis STORY-1077 (capitaux propres < ½ capital, `bilan-service`).

- **STORY-1073** ✅ 🧾 — la facture lit sa fiche légale de ses deux sources, et D fait aussi les côtés producteurs
  (consigne de l'utilisateur, 24/11 soir) : prospera-dossier-service#58 (`dev` **4352ac3**), prospera-paiement-service#125
  (`dev` **e2be149**), prospera-ventes-service#16 (`dev` **bc0f85c**), prospera-plateforme#40 (`dev` **de8f0d3**, étiquette
  **`contrats-distributeur-v2`**) ; annonce « ⚠ Contrats » #845 avant le code (`main` bd9340e : manifestes `facturation`
  1.2.0 et `paiement` 1.1.0 à la source). **Passation de B constatée** au rituel (dossier `2bf9dbd`, paiement `4684d22`,
  aucune PR ouverte) ; **dossier et paiement rendus à B** (« Passations »). « Fini quand » fixé par la fiche (D-1073-1).
  - **`dossier-service`** : `DossierEtatV1` + neuf champs facultatifs (sigle, forme, NIF saisi, RCCM, CNSS, capital,
    adresse, téléphone, e-mail) **sur le seul dossier propre** ; un dossier client inchangé ; ni le régime fiscal (axes
    datés, D-1073-3). Le rejeu : `npm run republier:dossiers` (STORY-696) suffit (D-1073-10). **Un distributeur reçoit
    son dossier propre à sa naissance** : prouvé (test du service sur un vrai document, et sur la pile : organisation née
    par `identity.org.created`, dossier propre `AUTRE` projeté par `facturation` en 3,5 à 4,5 s).
  - **`paiement`** : `paiement.compte.changed@1` (sans tiret : convention de `paiement`), état imprimable d'un compte,
    **jamais un secret du coffre**, dans la transaction de la déclaration et de chaque vérification ; révision = rang de
    l'acte au journal chaîné du compte (`EcritureDArgent` passe l'entrée consignée à `publier`) ; schéma fermé au registre
    (BACKWARD). Le numéro complet ne s'imprime pas : **Q-D-15** au PO.
  - **`ventes` (`facturation`)** : groupe `ventes-service.emetteur` ; mentions tirées des deux projections, figées ; le DAF
    ne choisit plus que `comptesImprimes` et garde le régime fiscal (D-1073-4) ; `emetteur` facultatif au `PUT` ; forme
    `AUTRE` non imprimée ; PDF : sigle, contacts, CNSS, un compte par ligne ; manifeste `facturation` 1.2.0 ; catalogue des
    faits v2.
  - Preuves : Node 24 — dossier 116/116 suites (1896 tests), e2e 395 ; paiement 348/348 suites (4719 tests, 2 ignorés),
    Karapace 11/11 ; ventes 66/66 suites (708), intégration 18/18 suites (204, `fiche-legale.int-spec.ts` neuf), e2e
    24/24 ; plateforme 657 (0 échec), `tsc` ; lint et build partout. Mutations 7/7 (dossier), 7/7 (paiement), 13/13
    (ventes). **Pile `grp-d` (dossier, paiement, ventes, Kafka, Karapace) : pilote 29/29**, rejoué **29/29 sur les images
    reconstruites depuis `origin/dev`** (volumes neufs) : un dossier propre mis à jour par `PATCH /dossiers/{id}` et un
    compte déclaré par `POST /comptes-encaissement` apparaissent sur la facture émise et dans son PDF (texte lu par
    pdfjs) ; ni l'identifiant en clair ni la saisie du DAF.
  - Décisions D-1073-1 → 12 (fiche) ; Q-D-15 au PO ; → B (recopies des manifestes au catalogue, information sur le rejeu
    des comptes) ; recette versionnée `prospera-ventes-service/scripts/recette/1073/`. **Verrou Docker : tenu par B
    (1112) au rituel ; libre à 21:58, pris à 21:58, une seule prise, rendu le 25/11 à 00:31** — dont ≈ 1 h 50 perdues à une
    coupure du réseau pendant les `docker build` (piège 1073-1) ; aucun conteneur, volume ni réseau `grp-d` ne reste.
  - **Suivante : STORY-1077** (capitaux propres < ½ capital, `prospera-bilan-service` ; la forme juridique et le capital
    d'un dossier client ne sont pas publiés par `dossier-service` : D-1073-2, à demander à B ou lire par route).

- **STORY-1077** ✅ ⚖️ — l'alerte « capitaux propres < ½ capital » (AUSCGIE révisé 2014 : 371-373 SARL et SUARL, 664-669 SA
  et SAS par 853-3) et ses échéances légales, dans la réponse d'analyse (prospera-bilan-service#187, `dev` **9fed378** ;
  annonce « ⚠ Contrats » #853 avant le code, `main` 4222321, complément #859, `main` 9be68d5). Rituel (2026-11-25) :
  aucune demande neuve à D pour le bilan chez A et C ; chez B, le ticket `TICKET-BACKEND-modules-ouverts-dans-l-essai.md`
  (1116) nomme D pour la garde de bilan dans l'espace d'essai — **à placer par la session de groupe**, hors de cette story.
  « Fini quand » fixé par la fiche (D-1077-1).
  - **Les articles relus au texte officiel** (édition intégrale d'ohada.com, adoptée le 30/01/2014, JO OHADA du
    04/02/2014) : 140, 309, 334, 348, 371-373, 548, 664-669, 853-3. Écart relevé dans `controles-balance-ohada.json` : le
    renvoi de la SAS aux règles de la SA est l'article **853-3** (le référentiel disait « 853-1 et suivants ») ; SUARL →
    SARL (309, 334) et SAS → SA confirmés.
  - **La règle en données sourcées du paquet** (révision en place, D-1077-3, doctrine de D-1076-2) : marqueur
    `capitauxPropresStricts` (`CAPITAL` sur le capital, `COMPOSANTE` sur les sept autres postes des capitaux propres
    stricts ; ni subventions d'investissement ni provisions réglementées) et bloc `alerteCapitauxPropres` (fraction ½,
    approbation 6 mois, deux régimes, délais, citations verbatim, URL) dans `syscohada-revise@2.1`, `@2.2`, `@2.3` et
    `zone-franche-togo@1.0` ; garde de packaging `gardes-alerte-capitaux-propres.mjs` ; hors ajouts, chaque artefact
    identique à l'octet. SMT, SFD, CIMA : `NON_APPLICABLE`.
  - **L'alerte** (`alerteCapitauxPropres`, toujours présente) : colonne N, comparaison exacte en entiers (la moitié
    atteinte ne déclenche pas), lecture large publiée à côté (**Q-D-16**) ; trois échéances : approbation (clôture + 6
    mois), décision (approbation + 4 mois, datée par **`dateApprobation`** facultative, sinon « si approbation au terme
    légal »), régularisation (SARL : clôture + 2 ans ; SA : non datable, art. 665) ; `400 APPROBATION_AVANT_CLOTURE`.
  - **La forme juridique** projetée de `dossier.*` dans `dossiers_dossier` (D-1077-2 ; mal typée ⇒ `null`, message
    gardé) ; publiée aujourd'hui pour le seul dossier propre : un dossier client rend le constat chiffré **sans échéance**
    (`FORME_JURIDIQUE_INCONNUE`) jusqu'à la demande à B (reçue par B, à placer).
  - **Dette de preuve de 1076 soldée** : suite unitaire complète de `bilan-service` sous Node 24 sur `origin/dev` `e4cee3e` (étage `verification`, image depuis `git -c core.autocrlf=false archive`, sous le verrou) **349/349 suites, 12 212 tests verts (5 ignorés), 641 s** en `-w 4 --workerIdleMemoryLimit=700MB` ; aucun rouge, rien à corriger dans les paquets de 1076 (un premier passage à 8 workers avait saturé la VM : quatre workers tués, piège 1077-2).
  - Preuves de la story : Node 24, branche : **351/351 suites, 12 294 tests** ; Node 25 : 12 056 tests (15 suites rouges connues) ; specs neuves `alerte-capitaux-propres` (43 tests, dont `ajouterMois`, les quatre paquets, les bornes 499 999 / 500 000, les formes, les échéances) et garde de packaging (25 : 23 refus) ; e2e `bilan-analyse` + `openapi-contract` **591/591** (une alerte ATTEINTE d'une SA décrite exactement par le contrat) ; **mutations 22/22** ; lint 0, build OK ; arbre fusionné identique au commit testé. Sans `docker compose up` (aucun module, dépendance ni Dockerfile ne change).
  - Décisions D-1077-1 → 13 (fiche) ; Q-D-16 au PO ; → B (forme des dossiers clients) ; → C (recopie, ticket de 1076 mis
    à jour). **Verrou Docker : tenu par B (1116) de 00:31 à 01:42 ; attendu par boucles bornées, pris à 01:42, une seule prise, rendu à 02:51 (suites Node 24 de la dette et de la branche, conteneurs supprimés) ; aucun conteneur, volume ni réseau `grp-d` ne reste.**
  - **Suivante : STORY-1078** (les quatre contrôles d'intégrité de la liasse et le rapprochement par l'empreinte de
    1022, `prospera-bilan-service`).


- **STORY-1078** ✅ 🧮 — les quatre contrôles d'intégrité de la liasse dans la réponse d'analyse : FRNG = besoin de
  financement global + trésorerie nette, écarts de conversion éliminés (Note 34 du SYSCOHADA révisé), caisse créditrice,
  amortissements et dépréciations au-delà du brut (AUDCIF 45-47), perte de change latente sans provision (AUDCIF 54)
  (prospera-bilan-service#188, `dev` **d2c65c6** ; annonce « ⚠ Contrats » #865 avant le code, `main` d206f38). Rituel
  (2026-11-25) : aucune demande neuve à D chez A et C ; chez B, le ticket « modules ouverts dans l'essai » (point 3,
  bilan) — **placé en STORY-1079** (ci-dessous). **STORY-1022 (C) non livrée** : le rapprochement par l'empreinte de la
  balance est **reporté** (D-1078-10), la demande à C reste ouverte. « Fini quand » fixé par la fiche (D-1078-1).
  - **Les sources** : les livres du pack (11, 12) cités par `controles-balance-ohada.json` sont remplacés par les textes
    officiels relus le 25/11 — AUDCIF 2017 (art. 45-48, 54, 56, 57) et le Guide d'application du SYSCOHADA révisé
    (ohada.com : Note 34 p. 393, Bilan p. 329, caisse p. 46, amortissements p. 78, dépréciations p. 81, provisions
    p. 84-85, devises p. 207-210). La Note 34 dit le contrôle exact : « TRESORERIE NETTE (5) = (1) - (4) », écarts de
    conversion éliminés — sans quoi l'identité rougirait sur toute liasse saine portant un écart (prouvé : 30 000 sur la
    liasse témoin).
  - **Livré** : liste `controlesIntegrite` (quatre entrées, termes, comptes ou groupes en cause, message, sources du
    paquet) ; identité exacte en entiers, `INDETERMINE` (`BILAN_DESEQUILIBRE`) sur un bilan déséquilibré ; caisse
    compte par compte (racine `57`) ; amortissements **sur les soldes**, sept groupes `21`…`27` face à `281`…`284` et
    `291`…`297` (les tables de passage SYSCOHADA ne rattachent aucun compte `28`/`29` à un poste : relevé au code,
    D-1078-5) ; perte de change : `478` hors `4788` (couverture), provisions `194`, `499`, `599`, provision partielle non
    jugée (art. 56, 57). Bloc `controlesIntegrite` des quatre paquets SYSCOHADA révisé (révision en place, hors bloc
    chaque artefact identique à l'octet), garde de packaging `gardes-controles-integrite.mjs`. Des signaux : ni `valide`
    ni la liasse ne changent.
  - Preuves : Node 24, branche `8bebeb5` : **353/353 suites, 12 344 tests verts (5 ignorés), 722 s** (étage `verification`, `-w 4`) ; specs neuves `controles-integrite` 25/25, garde de packaging 21/21, service d'analyse 25/25 ; e2e `bilan-analyse` + `openapi-contract` **594/594** (trois `ANOMALIE` décrites exactement par le contrat) ; **mutations 22/22** ; lint 0, build OK ; paquets en LF, empreintes du registre ; arbre fusionné identique au commit testé. Sans `docker compose up` (aucun module, dépendance ni Dockerfile ne change).
  - **⛔ Constat vérifié, ticket ouvert (non corrigé ici)** : les tables de passage de `syscohada-revise@2.1`, `@2.2`, `@2.3`, `zone-franche-togo@1.0` et `smt-togo@1.0` ne rattachent **aucun** compte `28`/`29`/`39` (ni `49`/`59` hors `499`, `599`) — la règle `NET_ACTIF` du paquet les nomme, la table ne les câble pas. Cas chiffré (moteur réel) : matériel 1 000 000, amortissements 400 000, capital 800 000, caisse 200 000 ⇒ `AM` net 1 000 000, actif 1 200 000, passif 800 000, écart **400 000**, `EQUILIBRE_BILAN` et `COMPTES_NON_AFFECTES` bloquants ⇒ `valide: false` ; FRNG publié −200 000 au lieu de +200 000. Une surcharge `RACINE 2844 → BILAN_ACTIF|AM` le rétablit. Toute balance réelle amortie est touchée : `tickets/TICKET-BACKEND-bilan-amortissements-non-rattaches.md` (Must avant un client réel ; une story de `bilan-service` à placer).
  - Décisions D-1078-1 → 11 (fiche) ; → C (recopie, ticket de 1076 mis à jour ; 1022 : l'empreinte avec son algorithme
    et sa version). **Verrou Docker : pris à 03:54 (libre, aucun conteneur `grp-d`), une seule prise, rendu à 04:07 (image de vérification construite depuis l'archive, suite Node 24 ; conteneur et image supprimés) ; aucun conteneur, volume ni réseau `grp-d` ne reste.**
  - **Suivante : STORY-1079** (dans l'espace d'essai, la garde de bilan ne lit pas le KYC ; Q-D-17) — **ordre de D mis à
    jour : 1078 ✅ → 1079 → 1074 → 1075** ; **mis à jour le 2026-11-25 : 1078 ✅ → STORY-1118** (les amortissements rattachés aux postes, ticket `TICKET-BACKEND-bilan-amortissements-non-rattaches.md`, Must avant toute liasse réelle : toute entité qui amortit a aujourd'hui une liasse déséquilibrée) **→ 1079 → 1074 → 1075**.
- **STORY-1118** ✅ 📉 — les comptes d'amortissement et de dépréciation (28, 29, 39, 49 hors 499, 59 hors 599) rattachés
  au poste de leur actif : la liasse d'une entité qui amortit sort équilibrée et validable (prospera-bilan-service#189,
  `dev` **b6f2d49**, **5055933** ; annonce « ⚠ Contrats » #872 avant le code, `main` 651d4d6). Ticket
  `TICKET-BACKEND-bilan-amortissements-non-rattaches.md` (constat de D-1078-5) **corrigé**. Rituel (2026-11-25) : aucune
  demande neuve à D chez A, B et C. Identifiant réservé au tracker par la session de groupe (marque haute inchangée).
  - **La règle** : la subdivision « à l'image » (Guide d'application du SYSCOHADA révisé, p. 68 : « Le compte principal 28
    est subdivisé à l'image des comptes 21 à 24. Ses soldes créditeurs figureront à l'actif du Bilan, en soustraction » ;
    p. 81, p. 329 ; AUDCIF art. 47) : `28xy`/`29xy` au poste de `2xy`, `39x` à celui de `3x`, `49x` à `4x`, `59x` à `5x` ;
    490 → `BH`, 491 → `BI`, 492 → 497 → `BJ`, 498 → `BA`, 590 → `BQ`, 591 → `BR`, 592 → 594 → `BS` ; en-cours non
    subdivisés (2919, 2939, 2949) au résidu de leur rubrique ; SMT : `AC1`, `AC2`, `AC3`, `AC5`. `499` et `599` vérifiés :
    au passif, une fois. Dans les données des cinq paquets, jamais dans le moteur (P7) ; +117 comptes officiels aux plans.
  - **Révision en place, sciemment** (D-1118-5) : seules changent les liasses qui portent un solde sur ces comptes, toutes
    `valide: false` jusqu'ici (jamais figées ni déposées) ; une surcharge qui les rattachait l'emporte toujours. Les
    liasses figées restent figées (tampon complet, ancienne empreinte) ; les brouillons se recalculent. `MOTEUR_VERSION`
    inchangée.
  - **Garde de packaging** `gardes-nomenclature.mjs` (tout paquet bâti sur `plan-comptable-syscohada*`) : aucun compte de
    bilan de la nomenclature sans poste, chaque contrepartie à l'actif et au poste de son actif, 499/599 au passif ; les
    tables d'avant la rougissent.
  - Preuves : Node 24 **355/355 suites, 12 554 tests verts (5 ignorés), 883 s** ; e2e 3 486/3 488 (deux rouges **déjà sur
    `dev` d2c65c6**, constat ci-dessous) ; e2e liasse et analyse **776/776** ; spec neuve 196/196, garde 14/14 ;
    **mutations 18/18** ; lint 0. Cas du ticket : `AM` 1 000 000 / 400 000 / 600 000, équilibré, FRNG **+200 000**,
    identité `OK` ; `valide: true` sous `@2.2`, `@2.3`, SMT (sous `@2.1` et la zone franche, seul reste
    `CASCADE_SOUS_TOTAUX`, défaut connu de STORY-678). Tests mis à jour : fiche (« Preuves »).
  - **Constat (non corrigé ici)** : deux e2e de `bilan-service` sont rouges sur `dev` depuis avant 1118 —
    `ecoute-stable` (`instance-c13.e2e-spec.ts` importe `ecouterPourSupertest` sous l'alias `ecouter`, l'invariant cherche
    le texte `ecouterPourSupertest(app)`) et `bilan-dossier-portee-collaborateur` (25 contrôleurs gardés, 24 attendus).
    Vérifié dans une image de `dev` `d2c65c6`. À reprendre par une story de bilan de D (1079 peut les solder en commit
    séparé avant son code).
  - Décisions D-1118-1 → 10 (fiche) ; → C (recopie de **quatre** artefacts, `smt-togo-1.0.json` compris ; ticket de 1076
    mis à jour). **Verrou Docker : pris à 04:51 (libre), une seule prise, rendu à 05:14 ; aucun conteneur, volume, réseau
    ni image `grp-d` ne reste.**
  - **Suivante : STORY-1079** (dans l'espace d'essai, la garde de bilan ne lit pas le KYC ; Q-D-17) — **ordre de D : 1118 ✅
    → 1079 → 1074 → 1075**.
- **STORY-1079** 📌 placée le 2026-11-25 (par STORY-1078) — le point 3 du ticket de B
  `tickets/TICKET-BACKEND-modules-ouverts-dans-l-essai.md` (STORY-1116, D-1116-1) : dans l'espace d'essai, la garde de
  `bilan-service` (`requires-bilan-access`) ne lit pas le KYC, l'état publié décide seul. Dernier numéro de la plage
  1030 → 1079 de D ; Must de la démo du 15/01 ; fiche à écrire juste avant de coder ; choix par défaut en **Q-D-17**
  (décision d'architecture, AD-15). **Livrée ci-dessous.**
- **STORY-1079** ✅ 🧪 — dans l'espace d'essai, la garde de bilan ne lit pas le KYC : l'état publié décide seul
  (prospera-bilan-service#190, `dev` `7ed3335`, `2d186b9` ; annonce « ⚠ Contrats » #877 avant le code, `main` 36ccec7).
  Ticket `TICKET-BACKEND-modules-ouverts-dans-l-essai.md`, point 3 (bilan) **fait** ; Q-D-17 : choix par défaut
  appliqué, à confirmer. Rituel (2026-11-25) : aucune demande neuve à D chez A, B et C.
  - **Avant la story (commit séparé)** : les deux e2e rouges sur `dev` — `ecoute-stable` (alias `ecouter` de
    `instance-c13.e2e-spec.ts`, STORY-928) et `bilan-dossier-portee-collaborateur` (25ᵉ contrôleur niché de STORY-1083,
    `FinancementController`, compte resté à 24 ; la batterie reçoit `FinancementAccessGuard` à sa place d'`AppModule`) —
    causes dans `bilan-service`, corrigées sans délai relevé.
  - **Livré** : sur une instance `INSTANCE_ESPACE=ESSAI`, `@RequiresBilanAccess` saute le palier KYC sans lire le
    read-model ; e-mail vérifié, organisation du jeton et état publié (garde partagée) restent exigés, même ordre. Même
    règle pour `@RequiresFinancementAccess` (D-1079-4). Espace de l'instance par `EspaceDeLInstance` (STORY-928),
    fourni par `AppModule` ; dépendance facultative : seul un `EspaceDeLInstance` fait l'essai, absent ou `{}` ⇒ réel
    (fail-closed). Réel : rien ne change.
  - Preuves : Node 24 **357/357 suites, 12 578 tests verts (5 ignorés), 1 073 s** ; e2e **45/45 suites, 3 497/3 497** (les deux anciennes rouges comprises), 250 s ; specs neuves 16/16 et 9/9, e2e `bilan-access-espace` 8/8 ; **mutations
    12/12** ; pile `grp-d` (deux instances, essai et réel, mêmes faits Kafka, aucun KYC) : essai **200** (gate et liasses
    du dossier), réel **403 `KYC_NOT_APPROVED`** (y compris avec en-tête et paramètre « essai »), témoin réel 200 après
    `kyc.status.changed` `APPROVED`.
  - Décisions D-1079-1 → 6 (fiche). **→ B et → C** : la même règle dans `dossier-service` et `balance-service`
    (« Demandes aux autres groupes »). **Pour la recette (B)** : `INSTANCE_ESPACE=ESSAI` sur le bilan de l'essai.
    **Verrou Docker : pris à 07:14 (libre, aucun conteneur `grp-b`), une seule prise, rendu à 08:02 ; aucun
    conteneur, volume ni réseau `grp-d` ne reste.**
  - **Suivante : STORY-1074** (la consolidation s'installe à part) — **ordre de D : 1079 ✅ → 1074 → 1075**.
- **STORY-1074** ✅ 🧩 — la consolidation s'installe à part : sa garde propre et ses trois vérifications
  (prospera-bilan-service#191, `dev` `130f8a5`, `c0dc720` ; annonce « ⚠ Contrats » #883 avant le code, `main` bd83fda).
  Rituel (2026-11-25) : aucune demande neuve à D chez A, B et C. (Reprise après un gel de la première sous-session,
  constaté à 08:32 : rien n'était engagé.)
  - **Livré** : `ConsolidationAccessGuard`, garde globale opt-in (`@RequiresConsolidationAccess()` sur les douze
    contrôleurs), après la garde de bilan et avant la portée : une organisation qui a `bilan` sans `consolidation` reçoit
    **403 `CONSOLIDATION_NOT_ENTITLED`** sur chacune des 50 routes ; `LECTURE_SEULE` ⇒ `ABONNEMENT_EXPIRE` en
    écriture ; essai : KYC non lu (règle de 1079). L'état publié de `consolidation` projeté
    (`etats_publies_consolidation`, plan C13). `POST /api/v1/instance/consolidation/{org}/verifications/{code}` :
    `perimetre-arrete` (🟠), `ecritures-equilibrees` (🔴), `gate-consolidation` (🔴, chaîne réelle lue par
    `DiscoveryService`). Manifeste M45 copié à l'octet, **inchangé à la source** (aucune recopie au catalogue).
  - Preuves : Node 24 **362/363 suites, 12 648 tests** (la rouge : le compte de l'invariant de portée, corrigé en
    `c0dc720` et rejoué vert) ; e2e **45/45, 3 554** ; batterie de portée **550/550** (chaque route de consolidation
    refusée, route par route ; les 13 autres contrôleurs inchangés) ; **mutations 19/19** ; pile `grp-d` (réel et
    essai) : B et Q refusés `CONSOLIDATION_NOT_ENTITLED`, A et P 200, les trois vérifications par la route d'instance
    (ORANGE 1 → VERT, ROUGE 1 → VERT, VERT sur 50 routes).
  - Décisions D-1074-1 → 11 (fiche). Reste (fiche, « Ce qui reste ») : droits C7 `consolidation:*` (auth, B) ; autres
    routes d'instance de `consolidation` ; `consolidation` dans `INSTALLATION_SERVICES` de la recette (B).
    **Verrou Docker : pris à 08:51 (libre), une seule prise, rendu à 09:15 ; aucun conteneur, volume ni réseau `grp-d`.**
  - **Suivante : STORY-1075** (les routes d'instance `export`, `sante` et `migrer` du bilan) — **ordre de D : 1074 ✅ →
    1075 (la dernière)**.
- **STORY-1075** ✅ 🛰️ — les routes d'instance `export`, `sante` et `migrer` du bilan (prospera-bilan-service#192,
  `dev` `993b78f`, `4317dd2` ; annonce « ⚠ Contrats » #885 avant le code, `main` b2eadd0). Rituel (2026-11-25) : aucune
  demande neuve à D chez A, B et C. Aucun service ne les servait encore : pas de patron à copier ; contrat de la santé
  publié (`sante@1`), ceux de l'export et de `migrer` non (**Q-D-18 → 20**, défauts appliqués).
  - **Livré** (contrôleur `instance/bilan`, identité `MOTEUR` seule, deux espaces) : `GET …/{org}/export` (JSON, plan
    d'export qui couvre le plan d'effacement, objets au motif C13, Extended JSON relaxed ; matrice : `NON_INSTALLE` ou
    absent ⇒ 403 `BILAN_NOT_ENTITLED`, `SUSPENDU` ⇒ 200) ; `GET …/{org}/sante` (`sante@1` copié à l'octet : MongoDB et la
    sonde Kafka de `/health`) ; `POST /api/v1/instance/bilan/migrer` (`dossiers-d8`, idempotente ; orphelins ⇒ 409
    `MIGRATION_INCOMPLETE`). Utilisateur ⇒ 403 `IDENTITE_DE_SERVICE_REQUISE`.
  - Preuves : Node 24 **367/367 suites, 12 678 tests** ; e2e **45/45, 3 560** ; après le second commit, 42/42 suites
    ciblées et e2e 45/45 suites, 3 560/3 560 ; **mutations 19/19 + 6/6** ; pile `grp-d` (réel et essai) : export de A 200 (ses seuls
    documents, ni financement ni copie de voisin), B 403, `SUSPENDU` 200, `NON_INSTALLE` 403 ; santé OK puis DEGRADE
    Kafka arrêté ; `migrer` 409 puis 200 puis rejouée sans effet ; export → effacement → export 403 → import 422
    `OBJET_INCONNU` (l'aller-retour n'est pas possible pour bilan : aucun objet importable, D-928-5).
  - Décisions D-1075-1 → 13 (fiche). **Verrou Docker : pris à 09:46 (libre), tenu pendant la suite Node 24, les mutations et une première pile ; la sous-session coupée par une erreur réseau vers 11:15, le verrou rendu orphelin par la session principale ; repris à 13:06, pile rejouée sur les images de `d28630b`, rendu à 13:09 après `down -v` ; aucun conteneur, volume ni réseau `grp-d`.**
  - **Suivante** : aucune — **dernière story du lot 6 amendé de D**.

- **Le lot 6 amendé de D est fini, le 2026-11-25 : seize stories.** Le lot 6 (1065 → 1071, sept, fini le 24/11), puis
  l'amendement : **1072** (le cabinet prévenu d'un renvoi KYC), **1073** (la facture lit sa fiche légale, avec les deux
  côtés producteurs), **1076** (les seuils de l'analyse financière), **1077** (capitaux propres < ½ capital), **1078**
  (les quatre contrôles d'intégrité), **1118** (les amortissements rattachés aux postes), **1079** (la garde de bilan
  dans l'essai), **1074** (la consolidation s'installe à part), **1075** (les routes d'instance du bilan). La passation à
  Dev A est mise à jour (« Passations », D-L3-6, avant le 04/12).
- **À placer (en attente de la décision de l'utilisateur)** : `zone-franche-togo@1.0` garde le défaut de cascade des
  sous-totaux (STORY-678, corrigé en `@2.2` seulement) : une entité en zone franche n'a pas de liasse `valide: true`.
  Proposé : une story `zone-franche-togo@1.1` qui reprend la correction de `@2.2`.


### Lot 4 (ouvert le 2026-11-18)

- **Plan** : `PLAN-4-SESSIONS-LOT-4-2026-11-18.md` §4 : **STORY-1060 → 1064**, le distributeur au backend (cinq stories ;
  aucune pile prévue, §1.5 reste) ; une sous-session neuve par story (`REGLES-DES-GROUPES.md` §1.2). Même poste que B, qui
  tient ce lot aussi le backend du cabinet (dix stories, cinq avec pile) : même verrou Docker. **Lot 4 constaté au rituel
  de 1060** (le 2026-11-18) : aucune demande neuve à D dans les journaux de B et C ; celle de A (réponses de
  l'utilisateur à Q-D-1 → 10) est lue (« Réponses aux demandes reçues »).
- **STORY-1060** ✅ 🚚 — un calendrier propre à chaque organisation (prospera-plateforme#32, `dev` 8c61c48, étiquette
  **`calendrier-distributeur-v1`** ; prospera-terrain-service#4, `dev` fd5f4ee, d9b524f, 17bdba7 ; annonce « ⚠ Contrats »
  #681 avant le code, manifeste `terrain` amendé). **Q-D-9 renversée par l'utilisateur, appliquée.**
  - **La règle** (plateforme, `contrats/distributeur/src/calendrier.ts`, copiée à l'octet par `terrain`) : jours
    travaillés ; jours fériés `FIXE` (MM-JJ), `PAQUES` (décalage : lundi de Pâques, Ascension, Pentecôte) et `DATE` ;
    jour ouvré, n-ième jour ouvré (rang 0 = le jour même), jours ouvrés d'une période (pour FR-85). Défaut : lundi →
    samedi, dix jours fériés du Togo (Q-D-11).
  - **Le paramètre** : `terrain_parametres` (AD-12, patron de `commande_parametres`), `GET|PUT /api/v1/terrain/parametres`
    (droit propre `terrain:parametres:modifier`, « → B »), versions immuables, changement tracé.
  - **La résolution à l'import** : chaque plan de journée est daté par le calendrier de l'organisation, lu dans la
    transaction du lot, et garde `parametresVersion` (figé) ; `terrain_parametres` effacé par la route C13.
  - Node 24 : plateforme 634 tests (633 pass, 0 fail) ; `terrain` 348 unitaires, 29 e2e, 23 d'intégration sur MongoDB
    réel ; mutations 16/16 (règle) et 13/13 (`terrain`). Pile `grp-d` : `docker compose up` sain, **21/21** sur appels
    réels (deux organisations, deux calendriers, deux plans différents ; plan figé ; effacement ; témoin intact) ;
    rejouée sur les images reconstruites depuis `origin/dev` (`--no-cache`, volumes neufs) : 349 unitaires, 29 e2e, 23 d'intégration, pilote 21/21.
  - Décisions D-1060-1 → 11 (fiche) ; Q-D-11 au PO ; → B (le droit). **Verrou Docker pris à 12:57 sans attente (libre au rituel), une seule prise, rendu à 13:18** ; aucun conteneur, volume ni réseau `grp-d` ne reste.
  - **Suivante : STORY-1061** 🚚 (la facture juste (2), `ventes`).
- **STORY-1061** ✅ 🚚 — la facture juste (2) (prospera-ventes-service#10, `dev` 33bd0e7, 29b55a7, 88d50d6, e1d370c,
  68b293c ; annonce « ⚠ Contrats » #689 avant le code). **Q-D-10 répondue, appliquée.** Rituel : aucune demande neuve à D
  dans les journaux de A, B et C.
  - **La suite de Sage, une fois, avant la première facture** : `PUT /api/v1/facturation/numerotation/factures`
    (`facturation:numerotation:administrer`, le DAF ; corps = champs de l'objet de Reprise `facturation.suite-numerotation@1`) ;
    amorçage du compteur, suite, tête `facturation.serie.changed@1` et piste dans une transaction `majority` ; plancher dans
    l'ancre après l'acquittement ; `SUITE_INVALIDE`, `SUITE_DEJA_REPRISE`, `NUMEROTATION_DEJA_ENGAGEE` ;
    `GET /api/v1/facturation/numerotation`.
  - **Le format du numéro** (préfixe, année, séparateur, largeur), lu dans la transaction de l'émission : `FAC-2026-8821`
    ⇒ `FAC-2026-8822` ; `FAC-2026-0412` émise le 01/02/2027 ⇒ `FAC-2027-0413` ; sans suite, rien ne change.
  - **Le règlement lu chez `paiement`** : `paiement.creance.changed@1` projeté (`facturation_creances_lues`, groupe
    `ventes-service.reglements`) ; `reglement` (`INCONNU`, `EMISE`, `PARTIELLE`, `PAYEE`, `CLOTUREE`, en retard) sur chaque
    facture rendue ; la facture ne tient toujours aucun solde.
  - **Deux défauts trouvés par la preuve, corrigés** (D-1061-13) : deux classes `@Schema` `CreanceLue` (commande,
    facturation) sur la même connexion ; la plus haute révision perdue sous concurrence (clé dupliquée de l'upsert).
    Invariant neuf : un nom de modèle par service.
  - Node 24 : 569 unitaires (55/55 suites), 24 e2e, 123 d'intégration ; 19/19 mutations ; Karapace : les deux schémas
    relâchés compatibles BACKWARD (témoin : un motif changé est refusé). Pile `grp-d` : `docker compose up` sain, pilote
    22/22, rejoué sur les images reconstruites depuis `origin/dev` (`--no-cache`, volumes neufs).
  - Décisions D-1061-1 → 13 (fiche) ; recette versionnée `scripts/recette/1061/`. **Verrou Docker pris à 13:47 sans attente (libre au rituel), une seule prise, rendu à 15:07** ; aucun conteneur, volume ni réseau `grp-d` ne reste.
  - **Suivante : STORY-1062** 🚚 (la commande (2), `ventes`).
- **STORY-1062** ✅ 🚚 — la commande (2) (prospera-ventes-service#11, `dev` 339a1ad → f49f3a6 ; annonce « ⚠ Contrats »
  #698 avant le code, manifeste `facturation` amendé). Rituel : aucune demande neuve à D dans les journaux de A, B et C.
  - **Le défaut de D-1061-13** (décision du groupe) : prouvé **rouge** sur MongoDB réel au commit du test (339a1ad, avant
    la correction), puis corrigé dans `ProjectionDuCredit.plusHauteRevision` et `CommandesChiffrees.appliquer` comme
    1061 (clé dupliquée rejouée, la révision tenue décide) ; deux tests déterministes le gardent.
  - **`CMD-AAAA-NNNNNN`** tiré dans la transaction de la commande (série `commandes`, tête sur `commande.serie.changed`).
  - **La commande terrain** : canal `TERRAIN` ⇒ `TRANSMISE` ; `PRIX_CHANGE` à la transmission et à la validation,
    confirmé par `prixConfirmes.revision` ; `COMMANDE_PROBABLEMENT_DOUBLE` (paramètre `fenetreCommandeDoubleMinutes`).
  - **L'annulation** : `POST /commande/commandes/{id}/annulation` ; bons `ANNULE` qui gardent leur `BL-` ; engagement
    rendu ; réservations rendues (port `liberer`) ; `commande.commande.annulee@1` ; `facturation` refuse
    `COMMANDE_ANNULEE`.
  - Node 24 : 599 unitaires, 24 e2e, 150 d'intégration ; mutations 5/5 (pures) et 17/17 (MongoDB réel) ; Karapace
    BACKWARD. Pile `grp-d` : `docker compose up` sain, pilote 24/24, rejoué sur les images reconstruites depuis
    `origin/dev` (`--no-cache`, volumes neufs).
  - Décisions D-1062-1 → 13 (fiche) ; recette versionnée `scripts/recette/1062/`. **Verrou Docker pris à 20:39 sans
    attente (libre au rituel), une seule prise, rendu à 21:43** ; aucun conteneur, volume ni réseau `grp-d` ne reste.
  - **Suivante : STORY-1063** 🚚 (les référentiels du distributeur côté réseau, `reseau`).
- **STORY-1063** ✅ 🚚 — les référentiels du distributeur côté réseau : le gabarit à zones à plat, les zones et les lieux
  rattachés du jeu « Grossiste du Golfe » (reseau-service#16, `dev` 25de958, c11d990, 4b55ac1 ; prospera-plateforme#36,
  `dev` 26977ca, étiquette **`jeu-grossiste-golfe-v1.1`** ; annonce « ⚠ Contrats » #712 avant le code). Rituel : aucune
  demande neuve à D dans les journaux de A, B et C (l'information de B sur 976, D-976-7, est lue).
  - **Le gabarit** (FR-180) : une donnée de la part du jeu (`hierarchie` : un niveau, libellé « Zone »), appliquée par la
    règle de `PUT /hierarchie/configuration` ; sous lui, une zone sous une zone est refusée `PROFONDEUR_MAX_ATTEINTE`, par
    la route **et par la Reprise** ; un réseau déjà plus profond refuse le gabarit.
  - **Les zones** par le moteur des zones, **sous l'identifiant du jeu** (celui que `commande` et `terrain` portent en
    `noeudId`) : la portée de `reseau` cadre désormais les points de vente du jeu chez `commande`, sans traduction.
  - **Les lieux rattachés** en nombre : chaque point de vente et chaque point de stock (Lomé Port ; Kara dans la taille de
    la démo), sous les identifiants de `commande` ; la résolution et la couverture les lisent ; le client comptoir ne l'est
    pas (FR-241). Rejouer ne double rien ; un lieu rattaché ailleurs voit l'ancien rattachement terminé.
  - **Les routes C13 de `reseau`** (import, effacement de fin d'essai), en essai seulement (`KAFKA_ESPACE=ESSAI`) ; le socle
    C13 copié de `ventes` (Ajv 8 : seul écart) ; un invariant rougit sur toute collection oubliée par le plan.
  - Node 24 : 50/50 suites unitaires (523 tests), e2e 17/17, intégration 16/16 suites (177 tests, 22 neufs) ; plateforme
    647 tests (646 pass, 0 fail), générateur 31/31, `jeu:verifier` 3/3 ; mutations 12/12 (`reseau`) et 6/6 (générateur).
    Pile `grp-d` : `docker compose up` sain, pilote 11/11 (essai) et 2/2 (réel), rejoué sur les images reconstruites
    depuis `origin/dev` (`--no-cache`, volumes neufs).
  - Décisions D-1063-1 → 12 (fiche) ; recette versionnée `scripts/recette/1063/` ; → B (information : `INSTALLATION_SERVICES`
    nommera `reseau` au passage à `v1.1`). **Verrou Docker pris à 22:10 sans attente (libéré par B au rituel), une seule
    prise, rendu à 22:55** ; aucun conteneur, volume ni réseau `grp-d` ne reste.
  - **Suivante : STORY-1064** 🚚 (les comptes du bureau dans le jeu « Grossiste du Golfe », plateforme et `ventes` ; le jeu
    est désormais en 1.1.0 : la version suivante sera 1.2.0, ses empreintes à refiger dans `generer.test.mjs`).
- **STORY-1064** ✅ 🚚 — les comptes du bureau dans le jeu « Grossiste du Golfe » (prospera-plateforme#37, `dev`
  50c12a6, étiquette **`jeu-grossiste-golfe-v1.2`** ; prospera-ventes-service#12, `dev` edb3f8f ; annonce « ⚠ Contrats »
  #715 avant le code). Rituel : aucune demande neuve à D dans les journaux de A, B et C (la réponse de l'utilisateur sur
  D-972-9, relayée par A, est celle que cette story sert).
  - **Le fichier des comptes** (`comptes.json`, dans chaque taille : 8, 16, 44 comptes) : le bureau (`compte` :
    `AKOSSIWA` Akossiwa ATTISSO `DIST_COMPTABLE`, `MENSAH` Mensah KPOGO `DIST_RECOUVREMENT`, `YAWA` Yawa AMEDOME
    `DIST_SUPERVISEUR`, `AYITE` Ayité GBADOE `DIST_DG`), puis un compte par agent (`commercial`, `COM-nn`, prénom et nom de
    `terrain`, `DIST_COMMERCIAL` | `DIST_FREELANCE` | `DIST_PROSPECTION`) ; chaque compte est **exactement** le corps de la
    pose d'auth (`{ objet, cle, prenom, nom, roleMetier }`).
  - **Hors des parts, pas encore déclaré** : `jeu-demonstration@1` est fermé, `comptes` est à B (D-1064-4) ; `jeu.json`
    1.2.0 en porte le nombre (`generateur.parametres.comptes`). Les neuf fichiers de données de 1.1.0 inchangés à l'octet.
  - **Une identité** : le compte d'un agent est son commercial de `terrain` (`identifiantDuJeu(org, 'commercial',
    COM-nn)`), dans une zone de `reseau` ; vecteurs figés dans le générateur et dans `ventes` (Kodjo
    `c6e2275ff50ddb28e5cf12c2`, celui d'auth).
  - Node 24 : plateforme `typecheck`, `npm test` **647 tests (646 pass, 1 sauté, 0 fail)**, `generer.test.mjs` **48/48**, `jeu:verifier` 3/3 ; `ventes`
    unitaires **58/58 suites, 602 tests** ; mutations 11/11 (générateur) et 3/3 (règle). Aucune pile (rien qui démarre ne change).
  - Décisions D-1064-1 → 9 (fiche) ; → B (`comptes` dans `jeu-demonstration@1`, la pose par le catalogue). **Verrou
    Docker attendu de 23:20 (B, 975) à 23:27, une seule prise, rendu à 23:32** ; aucun conteneur, volume ni
    réseau `grp-d` ne reste.
- **Le lot 4 de D est fini : 5 stories sur 5 (1060 → 1064)**, le 2026-11-18. Passation à Dev A mise à jour (« Passations »,
  « Ce qui reste », dans l'ordre conseillé). Aucune story de D n'est réservée au-delà ; la suivante viendra du plan
  suivant.

### Lot 3 (ouvert le 2026-11-17)

- **Plan** : `PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §4 : **STORY-1045 → 1059**, distributeur 🚚 et assurance 🛡 en
  alternance ; une sous-session neuve par story (`REGLES-DES-GROUPES.md` §1.2). Même poste que B, même verrou Docker.
- **STORY-1045** ✅ — `vocabulaires/` et `contrats/distributeur/` dans la plateforme (PR prospera-plateforme#21, `dev`
  baa38dd ; étiquettes `vocabulaires-v1` et `contrats-distributeur-v1`). **Solde D-1042-3.** Aucun fichier de B
  touché : le `test` et le `typecheck` racines lisaient déjà ces dossiers (STORY-941).
- **STORY-1046** ✅ 🛡 — la compagnie de démonstration (PR prospera-assureur-fictif#3, `dev` 626b93e et e265b0a ;
  PR prospera-plateforme#23, `dev` a938c38, étiquette `jeu-assurance-v1`). Le jeu de l'assurance au format
  `jeu-demonstration@1` : `assurance-compagnie-demo` (205 915 enregistrements, produit par `npm run jeu:ecrire`, non
  versionné) et `assurance-compagnie-demo-reduite` (5 180, dans `prospera-plateforme/jeux-demonstration/`) ;
  `jeu:verifier` conforme pour les deux (Node 24). Routes C13 d'import et d'effacement du LC fictif, sous l'identité
  `MOTEUR` seule ; effacement idempotent. Pile `grp-d` : jeu complet importé en 136 s, puis effacé.
  **Passation de `prospera-assureur-fictif` constatée** (voir « Passations »).
- **STORY-1047** ✅ 🚚 — la bibliothèque d'encours (PR prospera-plateforme#24, `dev` b061cec, étiquette
  `encours-v1`). Une seule règle (AD-9, FR-52) : `encours = créances ouvertes + engagement non facturé − crédit du
  tiers`, par `(tiers, périmètre)`, en deux lectures (certain, qui juge ; affiché, déclarés en moins) ; même résultat
  pour la même entrée (720 ordres d'arrivée prouvés) ; `ABSENTE` dite ; plafond jugé strictement. 38 tests, 10 vecteurs
  d'or, 16/16 mutations ; Node 24 : typecheck racine vert, `npm test` racine 550 pass, 0 fail. Contrat `encours@1`
  **annoncé avant la fusion du code** (prospera-stories #589). Aucun fichier de B touché. Décisions D-1047-1 → 12
  (fiche) ; Q-D-4 au PO. Verrou Docker attendu ~44 min (B, STORY-957), puis pris et rendu.
- **STORY-1048** ✅ 🛡 — le LC fictif refuse l'espace réel (PR prospera-assureur-fictif#4, `dev` 4f4aa89 ; annonce
  « ⚠ Contrats » #597 avant le code). L'espace de l'instance fait foi (`INSTANCE_ESPACE`, STORY-934) : `ESSAI` démarre,
  `REEL` ou toute autre valeur refusent même avec `FICTIF_ESPACE=essai`, qui seule démarre comme avant (piles de C).
  Refus avant le chargement des modules : une ligne `ASSUREUR_FICTIF_INTERDIT` (motif nommé), sortie 78. **Défaut
  corrigé** : la remise à zéro laissait relire la sortie de Prospera (anciennes clôtures rejouées, déclarations
  renumérotées) ; elle l'écarte et efface l'entrée. La partie des quatre scénarios `SIN-2026` rejouée après la remise à
  zéro rend les mêmes réponses, par fichiers et par l'API (pile `grp-d`, témoin d'`origin/dev`, rejouée depuis `dev`).
  Node 24 : 419 unitaires + 23 e2e ; 10/10 mutations. Décisions D-1048-1 → 7 (fiche). Verrou Docker pris sans attente,
  rendu.
- **STORY-1049** ✅ 🚚 — les garde-fous de la commande (PR prospera-ventes-service#3, `dev` c8f5fd2 ; annonce
  « ⚠ Contrats » #605 avant le code). **Premier consommateur d'`encours-v1`** : `src/socle/encours/` copié à l'octet
  (empreintes figées par un test, dix vecteurs d'or rejoués). Paramètres de `commande` versionnés par organisation
  (`commande_parametres`, AD-12), l'acte garde sa `parametresVersion` ; plafond jugé sur l'encours certain sous verrou
  par tiers (AD-9) ; échec fermé tant que la Créance n'est pas branchée (`ENCOURS_NON_INSTALLE`) ; squelette de la saga
  (AD-34 : transaction locale, puis `stock` par ligne de bon, reprise sans double réservation). Node 24 : 339
  unitaires, 11 e2e, 32 d'intégration sur MongoDB réel ; 12/12 mutations. Pile `grp-d` (puis rejouée depuis `dev`) :
  `PLAFOND_CREDIT_DEPASSE` sur appel réel, l'acte relu garde sa version 1 après le passage à la version 2. Décisions
  D-1049-1 → 11 (fiche). Verrou Docker pris sans attente (B l'avait rendu), rendu.
- **STORY-1050** ✅ 🚚 — les dettes de `reseau-service` (PR reseau-service#13, `dev` a3d2f59 ; PR #14, `dev` 49c4d01 ;
  annonce « ⚠ Contrats » #613 avant le code). **Soldées : D-1030-2, D-1032-2, D-1034-5.** La garde lit l'état publié
  seul (`etat-publie.changed.<espace>@1`, `garde-etat-publie-v1` copiée à l'octet) ; les droits viennent de
  `GET /moi/droits` (`droits ∪ droitsHorsJeton`, cache 60 s, 503 `DROITS_INDISPONIBLES`) ; la table rôle → droits est
  retirée ; `reseau.commercial.changed@1` est republié quand seul l'état du compte change, dans la transaction du fait
  `identity.*`. Node 24 : 463 unitaires, 17 e2e, 118 d'intégration sur MongoDB réel ; 17/17 mutations. Pile `grp-d`
  (rejouée depuis `dev`, témoin d'`origin/dev`) : refus sur appels réels, droits lus de `/moi/droits`, trois faits du
  commercial lus sur Kafka. Décisions D-1050-1 → 10 (fiche). Verrou Docker pris sans attente (B l'avait rendu), rendu.
  ⚠️ En réel, les routes de `reseau` qui exigent un droit répondent 403 jusqu'à B-960 (« → B »).
- **STORY-1051** ✅ 🛡 — prévenir l'assuré (1) (PR prospera-notification-service#90, `dev` 7d4b24d, cdbcd8a, b3d4388 ;
  annonce « ⚠ Contrats » #620 avant le code). **Premier travail de D dans `notification`** (passation de B constatée).
  Neuf modèles système de l'assurance (`assurance-*`, SMS et e-mail, `fr`/`en`, variables `reference` et
  `numeroOfficiel` seules). Le test des interdits parcourt les 36 textes et rougit sur une variable de santé (registre
  `classification-sante` copié à l'octet), un montant d'indemnité ou « fraude », casse et accents comprises ; une
  surcharge fautive est refusée `CONTENU_INTERDIT_A_L_ASSURE`. Déclenchement par `sinistres.dossier.changed@1` (matrice
  fermée, jamais la fraude), destinataire enregistré par `sinistres-service` (route de service ; sans lui
  `CANAL_ABSENT`). Relances de pièces : file BullMQ, J+5 de la demande puis J+5 de la relance envoyée, trois au plus,
  horloge de référence, identifiants déterministes. Node 24 : 281/281 suites unitaires, intégration Mongo+Redis 9/9,
  15/15 mutations ; e2e : 4 suites rouges **héritées** (identiques sur `dev` avant 1051, voir « Pièges »). Pile `grp-d`
  (rejouée depuis `dev`) : `/health` 200, deux messages sans interdit, relance trop tôt replacée, puis envoyée à J+5
  avec la suivante à J+10. Décisions D-1051-1 → 11 (fiche). Verrou Docker attendu ~1 min (B, STORY-961), rendu.
- **STORY-1052** ✅ 🚚 — les séries hébergées (PR prospera-plateforme#27, `dev` bb6d96c → 1fe8c5e, étiquette
  **`series-v1.1`** ; PR prospera-ventes-service#4, `dev` 32d8b5f, 4782467, dbe3fa6, e4a27c7 ; annonce « ⚠ Contrats »
  #632 avant le code). `series-v1.1` (compatible ; `series-v1` ne bouge pas) : écriture `majority` + `j`, lecture
  `linearizable` ; **ancre en écriture anticipée** hors de la base qu'on restaure (chaque numéro réservé avant d'être
  rendu, confirmé après l'acquittement) ; une base derrière l'ancre a été restaurée : relève au maximum connu, nouvelle
  époque, **trou déclaré** (série, piste d'audit, `SERIE_DERIVE` au journal), jamais comblé ni réémis — à l'émission
  et au démarrage. `ventes` : `NumerotationDesSeries` (émission dans une transaction `majority` avec sa pièce), jeu de
  répliques exigé au démarrage, `GET /api/v1/commande/series`, `docker-compose.heberge.yml` (trois membres porteurs,
  ancre à part). Node 24 : plateforme 574 pass / 0 fail, 12/12 mutations ; ventes 348 unitaires, 11 e2e, 44
  d'intégration sur MongoDB réel, 11/11 mutations. **Pile `grp-d` réelle** (rejouée depuis `dev`) : `mongodump`,
  émissions, `mongorestore --drop` service en marche puis service arrêté : **56 numéros rendus, 56 distincts, aucun
  réémis**, trous 21 → 35 et 41 → 45 déclarés et tracés ; un membre sur trois arrêté : émissions continues ; sans
  majorité : aucun numéro rendu. Décisions D-1052-1 → 14 (fiche). Verrou Docker pris sans attente (B l'avait rendu),
  rendu.
- **STORY-1053** ✅ 🚚 — les 15 rôles appliqués par le serveur, dans les cinq services (PR prospera-plateforme#28,
  `dev` e3727f8, étiquette **`acces-distributeur-v1`** ; ventes #5, `dev` 9e626fa ; terrain #2, `dev` 5b701a8 ;
  recouvrement #2, `dev` 2879924 ; pilotage #2, `dev` faa553a ; croissance #2, `dev` a035e61 ; annonce « ⚠ Contrats »
  #638 avant le code). La règle est une bibliothèque de D dans `contrats/distributeur/src/acces.ts` (dossier déjà lu
  par les scripts racines : **aucun fichier de B touché**), copiée à l'octet dans `src/socle/acces/`, dossier
  identique dans les cinq services. Chaque route d'un module exige un droit de la table d'accès, lu de
  `GET /moi/droits` (`droits ∪ droitsHorsJeton`, cache 60 s, `dv`, `identity.droits.changed@1`) : 403
  `DROIT_INSUFFISANT`, 503 `DROITS_INDISPONIBLES` ; `AUTH_SERVICE_URL` requise. Les cinq services projettent
  `reseau.portee.changed@1` (`socle_portees_reseau`, plus haute révision, échec fermé) et passent
  `conformite-portee-reseau-v1` sur MongoDB réel ; **inscrits au registre de `reseau`** pour leurs treize modules (sur
  la pile). `commande` lit et écrit ses actes dans la portée (`GET /commande/validations`, 404 hors lecture,
  `HORS_PORTEE`), et la marge est **absente** sans `catalogue:marge:consulter`. Paramètres : droit neuf
  `commande:parametres:modifier` (D-1053-7, **→ B**, Q-D-5). Node 24 : tout vert dans les cinq ; mutations 16/16
  (bibliothèque) et 14/14 (`ventes`). Pile `grp-d` (rejouée depuis `dev`, droits dérivés de la table d'auth) : 34/34
  appels conformes ; témoin d'`origin/dev` : `TENANT_ADMIN` sans rôle ouvrait tout. Décisions D-1053-1 → 12 (fiche).
  Verrou Docker pris à 11:05 sans attente (B l'avait rendu), rendu.
- **STORY-1054** ✅ 🛡 — prévenir l'assuré (2) (PR prospera-notification-service#91, `dev` d9de737, e0a50c0 ; annonce
  « ⚠ Contrats » #647 avant le code). **L'accusé de réception est l'accusé de transmission rendu au dossier**
  (D-1054-1 : les accusés que l'assuré reçoit, FR-36 et FR-48, partent depuis 1051) : `GET
  …/service/assurance/dossiers/{id}/messages` rend, par message, la voie, l'état (`EN_COURS`, `TRANSMIS`, `REMIS`, `LU`,
  `NON_REMIS`, `EN_CLOCHE`) et ses dates, jamais l'adresse. **Repli dans la cloche de l'assuré** (boîte du dossier
  tenue par `notification`) : consentement absent ou retiré, pas de destinataire, canal refusé, envoi en échec sans
  maillon restant (signalé par l'`Envoi` via `FinsDeChaine`, à la remise et à l'accusé « échoué ») ; texte SMS passé
  au contrôle des interdits de 1051 ; un dépôt par message. **Consentements par finalité** : `SUIVI_DU_SINISTRE`
  (obligatoire, sans décision possible) et `INFORMATION_DU_DOSSIER` (facultative, le numéro officiel, échec fermé),
  en ajout seul, tracés (qui, quand, version du texte, appelant). Une relance déposée compte comme donnée. Node 24 :
  287/287 suites unitaires ; e2e : les 4 suites rouges héritées identiques au témoin ; intégration Mongo+Redis 15/15 ;
  18/18 mutations. Pile `grp-d` (rejouée depuis `dev`) : `/health` 200, accusé `TRANSMIS`, numéro officiel en cloche
  sans accord et après retrait, SMS en échec déposé `ECHEC_DU_CANAL`, rejeu sans envoi ni dépôt de plus. Décisions
  D-1054-1 → 12 (fiche) ; Q-D-6 au PO ; → C. Verrou Docker pris à 12:38 sans attente, rendu à 13:35.
- **STORY-1055** ✅ 🚚 — l'import réseau par la Reprise (reseau-service#15, `dev` c62f586, 25d236c, 2d3db2a,
  d31f744 ; prospera-plateforme#29, `dev` a458b26, étiquette **`objets-reseau-v1`** ; annonce « ⚠ Contrats » #650 avant
  le code). **Solde D-1041-3.**
  - `reseau` reçoit `reseau.zone@1.0` (zones et hiérarchie par `parent`) et `reseau.commercial@1.0` (la personne à
    inviter, sa zone courante datée), par `kit-cible` 1.0.1 copié à l'octet. Ni agence, ni portée, ni responsable.
  - Routes `reprise/reseau/{org}/objets|controles/{objet}`. Jetons de service `REPRISE`, `CONNECTEURS` et `MOTEUR`,
    admis là seulement ; la garde est celle du kit (état publié, matrice).
  - **Un seul moteur des zones** pour l'import par fichier de 1041 et la Reprise : mêmes règles, mêmes codes, même
    écriture ; portées republiées une fois par transaction ; zone `HISTORIQUE` fermée en fin de transaction.
  - Node 24 : 502 unitaires, 17 e2e, 155 d'intégration sur MongoDB réel ; plateforme 615 pass, 0 fail.
  - **La suite de conformité du kit, telle que publiée : 16/16** (6 cas sans objet, nommés) ; 15/15 mutations.
  - Pile `grp-d`, rejouée depuis `dev` : `SIMULER` n'écrit rien ; un lot fautif est refusé nommé (422) sans trace ;
    `APPLIQUER` importe tout ; un second `APPLIQUER` est identique à l'octet ; le témoin reste intact ; les faits sont
    lus sur Kafka.
  - Décisions D-1055-1 → 13 (fiche) ; → B pour information (D6, la chaîne).
  - **Verrou Docker attendu 69 min** (B, STORY-965, de 13:47 à 14:56), puis pris et rendu à 15:21.
- **STORY-1056** ✅ 🚚 — la commande (1) (PR prospera-ventes-service#6, `dev` 10b8ba5, bf00355, 7221f4c ; annonce
  « ⚠ Contrats » #654 avant le code, avec le manifeste `commande` amendé, C5).
  - **Saisie** `POST /commande/commandes` : le point de vente (nœud, point de stock) et les prix (« ce client », puis
    société ; taux de TVA) sont lus chez `commande` (read-models remplis par personne aujourd'hui) ; portée d'écriture
    (`PDV_HORS_PERIMETRE`) ; HT, TVA par taux sur le total HT, TTC en entiers ; `BROUILLON` ; idempotente.
  - **Validation** `POST /commande/validations` reçoit `{ commandeId }` (forme définitive) : l'acte de 1049, construit
    depuis la commande, la lie dans sa transaction.
  - **Bon `EMIS`** et **`BL-AAAA-NNNNNN`** par `NumerotationDesSeries`, dans la transaction du bon (aucun numéro sans
    bon, aucun bon sans numéro ; numéro unique en base) ; la commande passe `VALIDEE` au dernier bon.
  - **Faits** par l'outbox (`socle_outbox`, patron de `reseau`) : `commande.engagement-tiers.changed`,
    `.bon-livraison.emis`, `.serie.changed`, `.commande.validee` ; schémas au registre (BACKWARD) ;
    `contrats-distributeur-v1` copié à l'octet (`verifierFaitsDuModule` sur les quatre manifestes).
  - Node 24 : 411 unitaires, 16 e2e, 75 d'intégration sur MongoDB réel (20 validations parallèles : 20 numéros
    continus ; trois émissions simultanées d'un bon : un numéro) ; 16/16 mutations.
  - Pile `grp-d`, rejouée depuis `dev` : 16/16 (saisie, validation, `BL-2026-000001`, 403, rejeu sans numéro, plafond,
    12 validations parallèles continues, outbox vidée, faits lus sur Kafka).
  - Décisions D-1056-1 → 13 (fiche). **Verrou Docker pris à 16:01 sans attente** (B l'avait rendu), rendu à 16:36.
- **STORY-1057** ✅ 🛡 — la recette de la démo assurance (PR prospera-assureur-fictif#5, `dev` 51f2639, 9e98f70,
  f9bbea5 ; annonce « ⚠ Contrats » #658 avant le code).
  - **`npm run recette:demo`** joue, par HTTP, contre un LC fictif vivant : la table de l'annexe E extraite du PRD
    (`recette/table-annexe-e.json`, 104 vérifications et 21 refus) et **classée** : **17 lignes dont le LC joue la
    part** (n° 3, 11, 25, 49, 64, 70, 71, 74, 78, 79, 80, 86, 90, 94, 95, 97, 104 : chiffres de référence de
    `SIN-2026-9002` recalculés au franc près — décompte 395 500, recours 276 850 —, réponses du LC à la partie de la
    démo, remise à zéro, partie rejouée), **108 lignes non jouables par le LC seul**, nommées avec leur destination
    (65 → C ; 22 → C et l'écran ; les 21 refus → C). Sortie 0 si la part du LC est verte. Profil compose `recette`.
  - **Les cinq routes de vérification C13** servies (`verification-installation@1`, `MOTEUR` seul, banc en mémoire,
    aucune ne modifie l'organisation) : **reste 1 de 1048 soldé**. **Après un effacement C13, l'organisation est fermée
    à la boîte aux lettres** jusqu'au premier import ou à une remise à zéro : **reste 2 de 1048 soldé** (D-1057-5).
  - Node 24 : 451 unitaires, 30 e2e ; 12/12 mutations (dont une vérification de l'annexe E sabotée). Pile `grp-d` :
    recette verte (17/17, C13 5/5), rejouée, jeu de la démo vert (244 s) ; puis image reconstruite depuis `origin/dev`,
    volumes neufs : verte, rejouée, tables identiques.
  - Décisions D-1057-1 → 9 (fiche) ; Q-D-7 et Q-D-8 au PO ; → C, → A, → B. **Verrou Docker pris à 17:10 sans attente**
    (B l'avait rendu avant 17:00), rendu à 17:45.
- **STORY-1058** ✅ 🚚 — le jeu « Grossiste du Golfe » (prospera-plateforme#30, `dev` d36623b, étiquette
  **`jeu-grossiste-golfe-v1`** ; prospera-ventes-service#7, `dev` 88ee146 → 7f674ef ; prospera-terrain-service#3, `dev`
  cefe9b9, 068e1c0 ; annonce « ⚠ Contrats » #662 avant le code).
  - **Le jeu**, `jeu-demonstration@1`, graine 20270115, trois tailles versionnées (FR-10) : `grossiste-golfe-petit`
    (476 enregistrements), `grossiste-golfe` (la démo de FR-9 : 2 120), `grossiste-golfe-grand` (6 937) ; deux parts,
    **`commande`** (point-de-vente, plafond, prix) puis **`terrain`** (commercial, point-de-vente, plan-de-journee) ;
    générateur sans dépendance dans `jeux-demonstration/grossiste-golfe/generateur/` ; `jeu:verifier` conforme.
  - **Les routes C13** d'import et d'effacement de `commande` et de `terrain` : `MOTEUR` seul, espace d'essai seul
    (`INSTANCE_ESPACE=ESSAI`), corps de `contrats-instance-v1` copiés à l'octet ; `IMPORTE` puis `DEJA_IMPORTE` ;
    `EFFACE` puis `DEJA_EFFACE` ; témoin intact. Un jeton de service ailleurs : 403 `IDENTITE_DE_SERVICE_REFUSEE`.
    Exemption de la table d'accès : `@RoutesDInstance` + `MOTEUR` seul + routes de `routesInstance`, gardée par
    `acces.invariant.spec.ts`.
  - **`reseau` n'a pas de route C13** (D-1058-2) ; ses nœuds et les comptes du jeu prendront les identifiants de
    `identifiantDuJeu` (D-1058-4). Les read-models `commande_points_de_vente`, `commande_plafonds`, `commande_prix`
    sont remplis par l'import ; les sources de l'encours ne le sont pas (une commande à crédit attend 1059).
  - Node 24 : plateforme 616 tests (615 pass, 1 sauté), générateur 25/25 ; ventes 444 unitaires, 24 e2e, 82
    d'intégration ; terrain 341, 24, 15 ; mutations 11/11, 16/16, 10/10.
  - Pile `grp-d` (branches) : ventes 25/25 (une vente du jeu saisie et validée `BL-2026-000001`), terrain 22/22 (Kodjo :
    14 visites au jour 0) ; espace réel 403. Rejeu sur images reconstruites depuis origin/dev (--no-cache, volumes neufs) : ventes 25/25 et espace réel 403 ; terrain
    rejoué depuis origin/dev (`068e1c0`, `--no-cache`, volumes neufs) par la session de 1059 : **22/22**, Kodjo 14 visites
    au jour 0, témoin intact, espace réel 403.
  - Décisions D-1058-1 → 14 (fiche) ; Q-D-9 au PO ; → B. Verrou Docker attendu ~30 min (B, 967), pris à 18:32 ; rendu à B par la session de groupe après le blocage du rejeu de terrain ; aucun conteneur, volume ni réseau grp-d ne reste.
- **STORY-1059** ✅ 🚚 — la facture juste (1) (PR prospera-ventes-service#8, `dev` 1c1e944, 101fbe8, bd8d211 ; annonce
  « ⚠ Contrats » #666 avant le code, avec les manifestes `commande` et `facturation` amendés, C5). **Dernière story du
  lot.**
  - **La facture** (module `facturation`) : `POST /facturation/factures { commandeId }` facture une commande `VALIDEE`
    (option « dès la validation », AD-29 ; la livraison n'existe pas encore) ; la commande est lue sur
    `commande.commande.chiffree@1` (publié par `commande` à la validation), jamais dans son code ; échéance figée par la
    condition de règlement du point de vente (`CONDITIONS_REGLEMENT_MANQUANTES` sinon) ; **`FAC-AAAA-NNNNNN` tiré dans
    la transaction de la facture** ; une facture par commande (clé d'origine `<commandeId>:facture`, index unique) ;
    faits `facturation.facture.emise` et `facturation.serie.changed` par l'outbox (BACKWARD au registre).
  - **La Créance** : `PUT /api/v1/creances/sources/FACTURE/{factureId}` chez `paiement` (B-963), jeton du membre, après
    la transaction ; `paiement` indisponible : la facture existe (`A_OUVRIR`), relance en mémoire tant que le jeton vit,
    rejeu, `POST …/factures/{id}/creance` — même clé, **jamais deux Créances**. La charge de `facturation.facture.emise@1`
    est celle que B attend pour son consommateur (« → B »).
  - **La Créance projetée dans `commande`** : `paiement.creance.changed@1` (plus haute révision, trop-perçu = crédit du
    tiers) ; **les sources de l'encours sont branchées au premier fait de l'organisation : fin d'`ENCOURS_NON_INSTALLE`**,
    la commande à crédit est jugée sur l'encours ; l'engagement baisse à la Créance de sa facture, une fois, dans les deux
    ordres (AD-9).
  - Node 24 : 506 unitaires (52/52 suites), 24 e2e, 98 d'intégration sur MongoDB réel (10 émissions concurrentes : une
    facture, un numéro) ; 16/16 mutations ; Karapace : 7 sujets BACKWARD.
  - **Pile `grp-d` avec le vrai `paiement` construit depuis `origin/dev` (`ad35786`)** : 30/30 (Créance relue par l'API de
    paiement, rejeu, 8 émissions concurrentes, paiement arrêté puis relancé : Créance ouverte 2 s après son retour, sans
    doublon ; projection, jugement sur l'encours, `PLAFOND_CREDIT_DEPASSE`) ; rejoué sur les images reconstruites depuis `origin/dev` (`--no-cache`, volumes neufs) : 30/30, deux fois ; 16/16 mutations rejouées.
  - **Reste de 1058 joué** : `terrain` sur l'image d'`origin/dev` (`068e1c0`, `--no-cache`, volumes neufs) : 22/22, espace
    réel 403.
  - Décisions D-1059-1 → 12 (fiche) ; Q-D-10 au PO ; → B (consommateur de `facturation.facture.emise@1`). **Verrou Docker
    pris à 22:37 sans attente (B l'avait rendu), une seule prise, rendu à 23:29** ; aucun conteneur, volume ni réseau
    `grp-d` ne reste.
  - **Recette versionnée** (à la demande de l'utilisateur, le 2026-11-17) : `prospera-ventes-service/scripts/recette/1059/`
    (PR ventes#9, `dev` 2453485), avec la pile, l'émetteur de jetons, le pilote et le `README.md` qui explique comment la
    rejouer. Avant, ces scripts n'existaient que dans un dossier temporaire du poste.
- **Le lot 3 de D est fini : 15 stories sur 15 (1045 → 1059)**, le 2026-11-17. Passation à Dev A mise à jour en entier
  (« Passations »), avant le 04/12 (D-L3-6). Suivantes du distributeur, hors lot : la facture juste (2), la commande (2),
  les remplaçantes d'EPIC-227.

### Lots 1 et 2

- **2026-11-14** : journal ouvert, lot 1 pas encore commencé.
- **2026-11-16** : lot 2 lancé par l'utilisateur (« prends le lot 2 du groupe D et tu fais toutes les stories de ce
  lot »). La session tourne sur un poste à part (`C:\Users\USER\…`), pas sur le poste principal de A et C.
  - **STORY-1030** ✅ — le squelette de `reseau-service` (PR reseau-service#1, `dev` 80a4a29 ; `main` dc44bbf).
  - **STORY-1031** ✅ — gate complète (KYC), read-models KYC et identité, cloisonnement par le jeton, outbox
    transactionnelle (PR reseau-service#2, `dev` 64537b1).
  - **STORY-1032** ✅ — zones et agences, codes jamais réattribués, fermeture refusée et nommée, montants entiers,
    droits du module (PR reseau-service#3, `dev` e96d5da).
  - **STORY-1033** ✅ — hiérarchie récursive, 3 → 4 niveaux par configuration, anti-cycle, déplacement sur compte
    rendu (PR reseau-service#4, `dev` 2ddbebd).
  - **STORY-1034** ✅ — affectations datées, responsable unique, commerciaux et état de leur compte (PR
    reseau-service#5, `dev` 3ff9958).
  - **STORY-1035** ✅ — modèle de portée, héritage, gouvernance, journal avant/après (PR reseau-service#6, `dev`
    b12a988).
  - **STORY-1036** ✅ — `reseau.portee.changed@1` publié (PR reseau-service#7, `dev` 17dcf14) : **jalon du 27/11 tenu
    le 16/11**.
  - **STORY-1037** ✅ — suite de conformité (étiquette `conformite-portee-reseau-v1`) et registre des consommateurs
    (PR reseau-service#8, `dev` 91b7f63).
  - **STORY-1038** ✅ — redécoupage versionné, période passée restituée avec sa version (PR reseau-service#9, `dev`
    a8a047a).
  - **STORY-1039** ✅ — rattachements et résolution (PR reseau-service#10, `dev` 9117794).
  - **STORY-1040** ✅ — couverture, zones blanches, candidats (PR reseau-service#11, `dev` 98ed21c).
  - **STORY-1041** ✅ — import tout ou rien, journal lisible, vérifications du manifeste (PR reseau-service#12, `dev`
    5922180). **`reseau-service` : les douze stories du lot sont livrées.**
  - **STORY-1042** ✅ — socle de `prospera-ventes-service` (PR #1, `dev` 80c2cfb) ; **reste** : `vocabulaires/` et
    `contrats/distributeur/` dans la plateforme (D-1042-3).
  - **STORY-1043** ✅ — terrain, recouvrement, pilotage, croissance (PR #1 de chacun).
  - **STORY-1044** ✅ — bibliothèque `series` (plateforme #14, étiquette `series-v1`), copiée et éprouvée dans ventes.
  - **Le lot 2 de D est fini : 15 stories sur 15** (1030 → 1044), le 2026-11-16.

## Dépôts tenus

- **Lot 7 (D-L7-1, ouvert par C le 2026-11-25, constaté au rituel de 560)** : `prospera-fiscal-service` (3012),
  **partagé par dossier avec C**. Dossiers de D : `src/modules/` (et `application/`, `domain/`, `adapters/` du même
  nom) `depots`, `livrables-depot`, `paquets-depot`, `completude-depot`, `remuneration`, `coffre-secrets` (560). Le
  reste est à C ; les fichiers communs suivent D-L7-2 (« ⚠ Communs »). Worktree `_wt-d-fiscal`.
- **Lot 6 (D-L6-3, reçus de C le 2026-11-23, constatés au rituel de 1068)** : `prospera-sinistres-service` (3409, modules
  `sinistres` et `expertises`) et `prospera-assurance-service` (3013, module `assurance`) ; dans `prospera-plateforme`,
  `contrats/assurance/`, `champs-sensibles/`, `classification-sante/`. `prospera-liaison-assureur-service` reste à C.
- Distributeur (lot 2) : `prospera-ventes-service` (3412), `prospera-terrain-service` (3413),
  `prospera-recouvrement-service` (3414), `prospera-pilotage-service` (3415), `prospera-croissance-service` (3416).
- `prospera-plateforme` : `series/` (`series-v1`, **`series-v1.1`** depuis STORY-1052), `vocabulaires/` (`vocabulaires-v1`), `contrats/distributeur/`
  (`contrats-distributeur-v1` ; **`acces-distributeur-v1`** depuis STORY-1053, `src/acces.ts`) ; **lot 3** : `encours/` (inscrit au README par B-956) ;
  `contrats/objets/reseau/` (module `reseau`, README ; **`objets-reseau-v1`** depuis STORY-1055) ;
  `jeux-demonstration/grossiste-golfe-petit/`, `grossiste-golfe/` (avec son générateur), `grossiste-golfe-grand/`
  (**`jeu-grossiste-golfe-v1`** depuis STORY-1058) ; **lot 4** : `contrats/distributeur/src/calendrier.ts`
  (**`calendrier-distributeur-v1`** depuis STORY-1060).
- **`prospera-assureur-fictif`** (lot 3, reçu de C, passation constatée le 2026-11-17 au rituel de 1046) : port 3411,
  profil `assureur-fictif`, « Rebase and merge » seul ; dans `prospera-plateforme`, le jeu
  `jeux-demonstration/assurance-compagnie-demo-reduite/` (étiquette `jeu-assurance-v1`). Le générateur reste dans le
  dossier de C (`contrats/assurance/demo/generateur.ts`), copié à l'octet.
- **`prospera-notification-service`** (lot 3, reçu de B à la fusion de B-957, passation constatée le 2026-11-17 au
  rituel de 1051) : port 3008, compose racine du poste (`notification-service`, `mongo-notification`, `kafka`, `redis`,
  `mailhog`).

- `reseau-service` (lot 2) : `main` et `dev` posées le 2026-11-16 ; port de développement **3419** ; piles Docker
  `grp-d`.
- À venir : `prospera-ventes-service`, `prospera-terrain-service`, `prospera-recouvrement-service`,
  `prospera-pilotage-service`, `prospera-croissance-service` (à créer par l'utilisateur) ; dans `prospera-plateforme` :
  `series/`, `vocabulaires/`, `contrats/distributeur/`.
- Lot 1 (frontend) : rien n'a été écrit ; `frontend-admin-panel` n'est tenu par personne pendant le lot 2.

## Passations

- **← B : passation de `prospera-paiement-service` (1141) — rendu à B** (2026-11-26, fin de STORY-1141). Le prêt (#936,
  journal de B, « Passations ») a commencé à l'ouverture de 1141, à `origin/dev` **`e2be149`**.
  - Derniers commits de D sur `dev` : **`f6a4800`** (MNV-1141, le numéro à imprimer) et **`64b5838`** (MNV-1141,
    `test:schemas`), par **#126**, fusionnée en rebase. **SHA final : `64b5838`.**
  - **Aucune PR de D ouverte.** Le checkout du poste est sur `dev`, à jour (`64b5838`) et propre ; la branche locale
    `MNV-1141` est supprimée.
  - **Ce qui a changé** (information à B) :
    - `numeroImprimable` est facultatif à la déclaration.
    - Deux routes `PUT …/numero-imprimable` : celle de l'organisation et celle de la surface déléguée.
    - Un acte neuf `COMPTE_ENCAISSEMENT_NUMERO_IMPRIMABLE_DECLARE`, avec sa phrase de signalement.
    - Une propriété facultative de `paiement.compte.changed@1`.
    - Manifeste 1.2.0 à la source.
  - **Les deux suites e2e déjà rouges sur `e2be149`** restent à B :
    - `health` : `admin.listTopics` manque au double (MNV-957).
    - `notifications-webhook` : `EtatsDeCreance` manque au module de test (MNV-965). Cette suite compile de nouveau
      (`publier` à deux arguments).
  - L'e2e `recette-uj1` réécrit `docs/recette-uj1-mesures.md` à chaque passage (remis en place).

- **← C, `prospera-fiscal-service` partagé par dossier, constatée par D au rituel de 560, le 2026-11-25** (lot 7,
  D-L7-1 ; passation de C du 25/11, « Passations » de son journal). Constat : `origin/dev` = **`f1296ae`** (MNV-316,
  fiscal #62), **exactement le SHA de la passation** ; `gh pr list --state open` : aucune PR ; aucune migration en vol
  chez C (sa section « ⚠ Contrats » n'annonce que 316, 315, 1101, 326, fusionnées) ; worktree `_wt-d-fiscal` en HEAD
  détachée sur `f1296ae`, propre, sans `node_modules`. Les deux worktrees « prunable » du checkout, venus de l'autre
  poste, sont laissés. Repris de la passation : dossiers de D et de C, règle des communs, une seule migration en vol,
  paquet à C ; pièges du fiscal (gate avec `prospera-recette/docker-compose.fiscal.yml` et une surcouche pointant
  l'archive de la branche, `test:conformite` sur `mongo-fiscal` en jeu de répliques, scripts `mongo/` en LF, suite
  unitaire en `-w 2`, `# syntax=` à retirer dans la copie archivée si la VM Docker n'a pas de DNS).

- **→ B (2026-11-25, fin de STORY-1073) : `prospera-dossier-service` et `prospera-paiement-service` sont RENDUS À B.**
  Derniers commits de D sur `dev` : dossier **`4352ac3`** (MNV-1073, #58 ; avant lui `2bf9dbd` de B), paiement
  **`e2be149`** (MNV-1073, #125 ; avant lui `4684d22` de B). **Aucune PR de D ouverte** dans ces deux dépôts. Checkouts
  remis comme D les a trouvés : `dossier-service` sur `MNV-1082` (propre), `prospera-paiement-service` sur `dev` à jour
  (`e2be149`), propre ; les branches locales `MNV-1073` supprimées (les distantes restent, fusionnées). Pièges vus :
  « Pièges rencontrés », STORY-1073. D n'y écrit plus ; une demande passe par le journal de B.

- **← B (2026-11-24, soir, prospera-stories #837, `main` dde8f19) : `prospera-dossier-service` et
  `prospera-paiement-service` prêtés à D pour STORY-1073 seule — constatée par STORY-1073** (rituel, 24/11) :
  `origin/dev` de dossier = **`2bf9dbd`** (MNV-1082), de paiement = **`4684d22`** (MNV-976), les SHA nommés par B ;
  **aucune PR ouverte** (`gh pr list`, deux dépôts). Checkouts : `dossier-service` sur `MNV-1082` (propre, fusionnée) —
  branche `MNV-1073` partie d'`origin/dev`, `MNV-1082` gardée ; `prospera-paiement-service` sur `dev` à jour, propre. D
  les rend à B par une ligne de ce journal à la fin de 1073.

- **← B, `prospera-bilan-service`, constatée par D au rituel de 1076, le 2026-11-24** (lot 6 amendé, D-L6-5 ; passation
  de B du 24/11, « Passations » de son journal, prospera-stories #820). Constat de la sous-session de 1076 :
  `origin/dev` = **`7b53ff5`** (MNV-065), **exactement le SHA de la passation** ; `gh pr list --state open` : aucune PR
  ; le checkout du poste (`bilan-service`) était sur `dev` à `7b53ff5`, propre hormis les deux brouillons connus
  `cr-map.txt` et `cr-postes.txt` (non suivis, laissés). Repris de la passation : le garde des noms de schéma
  (D-1084-17), le modèle de projection 1.14.0, la `version` de la liasse rouverte, les trois vérifications
  d'installation ; les pièges (15 suites rouges connues sous Node 25, CRLF des JSON d'un worktree, fixture de
  `bilan-export.e2e`, plan d'effacement C13, mutations longues). À reprendre (plan §6) : 1076 → 1077 → 1078 → 1074 →
  1075.

- **← C, `prospera-sinistres-service` et `prospera-assurance-service`, constatée par D au rituel de 1068, le 2026-11-24**
  (lot 6, D-L6-3 ; passation de C du 2026-11-23, « Passations » de son journal). Constat de la session de groupe à 11:06,
  revérifié par la sous-session de 1068 : `origin/dev` de sinistres = **`ea1a111`** (MNV-1016), d'assurance =
  **`8dc3285`** (MNV-1016), **exactement les SHA de la passation** ; aucune PR ouverte dans les deux dépôts ; checkouts
  propres mais en retard (33 et 11 commits) : 1068 part d'`origin/dev` (`npm ci --ignore-scripts` refait : les
  dépendances avaient changé). Repris de la passation : Node 24 pour les tests du client de Confluent (étage
  `verification`), `admin.createTopics` avant `subscribe` et `metadataMaxAge: 10_000` (le patron des consommateurs de
  sinistres le porte déjà), les « ⚠ Contrats » de C (1015, 1016 : le motif `EVALUATION` des trois faits de provision) et
  ses « Pièges rencontrés ». À reprendre (plan §6) : 1068 (`provision.changed@1`, D-1016-10), 1069
  (`sinistres.evaluation.arretee@1`, D-1013-9), 1070 (lever une alerte bloquante, D-1013-10), 1071 (la mission
  d'expertise, FR-61). **`prospera-liaison-assureur-service` reste à C** (le plan ne le nomme pas ; C le cède sur simple
  demande dans son journal) : D n'y touche pas. Dans `prospera-plateforme`, les dossiers que C y tenait
  (`contrats/assurance/`, `champs-sensibles/`, `classification-sante/`) passent par `_wt-d-plateforme`.

- **← B, `prospera-notification-service`, constatée par D au rituel de 1051, `dev` 5e6c553** (2026-11-17, D-L3-3). Au
  rituel : aucune PR ouverte, dernier commit sur `dev` = celui de la passation (MNV-957), checkout propre. Repris de la
  passation : Node 24 (`verification`) seulement pour les tests du client de Confluent ; AC-5 refuse toute minuterie ;
  sonde `/api/v1/health` ; ouvert : la vérification des sorties d'essai avant envoi (STORY-951), la bascule de la garde
  sur l'état publié seul, les canaux sms, whatsapp et push sans adaptateur configuré sur la pile, le résidu de 957
  (7,5 s au redémarrage sans Kafka).
- **← C, `prospera-assureur-fictif`, constatée par D au rituel de 1046, `dev` 78ad10c** (2026-11-17, plan du lot 3
  §5). C n'avait pas écrit sa passation (« Passations : aucune ») ; au rituel : aucune PR ouverte, dernier commit sur
  `dev` du 2026-11-16 (MNV-987). C est actif ailleurs (sinistres, 1001 → 1002), pas sur ce dépôt.
- **→ Dev A (mise à jour complète le 2026-11-25, à la fin du lot 6 amendé ; les précédentes : 2026-11-24, fin du lot
  6 ; 2026-11-17, fin du lot 3 ; D-L2-5, D-L3-6 : avant le 04/12) : le distributeur, l'assurance reprise de C, le
  bilan repris de B, et ce que D tient d'autre.** La synthèse
  d'abord, puis le détail par sujet (les sous-points qui suivent).
  - **Dépôts tenus par D** : `reseau-service` (3419), `prospera-ventes-service` (3412 : `commande`, `facturation`,
    `approvisionnement`, `entrepot`), `prospera-terrain-service` (3413 : `terrain`, `conquete-objectifs`),
    `prospera-recouvrement-service` (3414), `prospera-pilotage-service` (3415), `prospera-croissance-service` (3416),
    `prospera-assureur-fictif` (3411, reçu de C), `prospera-notification-service` (3008, reçu de B), **et depuis le lot
    6 (D-L6-3) `prospera-sinistres-service` (3409, modules `sinistres` et `expertises`) et `prospera-assurance-service`
    (3013)**, **et depuis le lot 6 amendé (D-L6-5) `prospera-bilan-service` (3004, modules `bilan`, `consolidation`,
    `financement`), repris de B le 24/11 : il revient à la décision du prochain plan** (dernier commit de D sur `dev` :
    `4317dd2`, aucune PR de D ouverte ; le checkout du poste garde les deux brouillons non suivis `cr-map.txt` et
    `cr-postes.txt`, laissés) ; `prospera-expert-comptable` porté le temps de 1072 seulement (Q-D-13) ;
    `prospera-dossier-service` et `prospera-paiement-service` prêtés pour 1073 et **rendus à B** ; dans
    `prospera-plateforme` : `series/`, `vocabulaires/`, `contrats/distributeur/`, `encours/`,
    `contrats/objets/reseau/`, `jeux-demonstration/grossiste-golfe*/` et `assurance-compagnie-demo-reduite/`, **et
    `contrats/assurance/`, `champs-sensibles/`, `classification-sante/`** (repris de C ; `prospera-liaison-assureur-service`
    reste à C). Étiquettes : `series-v1`,
    `series-v1.1`, `vocabulaires-v1`, `contrats-distributeur-v1`, `acces-distributeur-v1`, `encours-v1`,
    `objets-reseau-v1`, `jeu-grossiste-golfe-v1`, `jeu-grossiste-golfe-v1.1`, `jeu-grossiste-golfe-v1.2`,
    `calendrier-distributeur-v1`, `jeu-assurance-v1`, `conformite-portee-reseau-v1`. Fusion en « Rebase
    and merge » seulement ; branches `MNV-<n>` depuis `origin/dev` ; Node 24 pour les tests du client Kafka de Confluent
    (étage `verification` des Dockerfile).
  - **Livré** : lot 2 (1030 → 1044 : `reseau-service` complet, les cinq squelettes, `series-v1`) ; lot 3 (1045 → 1059) :
    vocabulaires et catalogue des faits, encours, garde-fous et plafond, séries hébergées sans perte, les 15 rôles dans
    les cinq services, la Reprise réseau, la commande (1), le jeu « Grossiste du Golfe » et ses routes C13, **la facture
    juste (1)** ; côté assurance : compagnie de démonstration, LC fictif refusé en réel, sa recette, prévenir l'assuré (1)
    et (2) ; **lot 4** (1060 → 1064) : le calendrier de l'organisation, la facture juste (2), la commande (2), la
    tranche de `reseau`, les comptes du jeu ; **lot 6** (1065 → 1071) : la facture juste (3) (mentions légales, PDF
    figé, lien public), l'avoir, la commande (3) (modifier une commande transmise), puis l'assurance : `sinistres` lit
    la provision en vigueur (1068), publie `sinistres.evaluation.arretee@1` (1069), lève une alerte bloquante (1070), et
    la mission d'expertise avec sa machine unique, l'évaluation qui l'attend (1071) ; **lot 6 amendé** (le 24 et le
    25/11) : le cabinet prévenu d'un renvoi KYC (1072), la facture qui lit sa fiche légale et ses comptes d'encaissement
    (1073), puis le bilan : les seuils de l'analyse (1076), l'alerte « capitaux propres < ½ capital » (1077), les
    contrôles d'intégrité de la liasse (1078), les amortissements rattachés aux postes (1118), la garde dans l'essai
    (1079), la consolidation à part (1074), les routes d'instance `export`, `sante`, `migrer` (1075). Détail et SHA :
    « État », plus haut.
  - **Mise en service d'un client qui quitte Sage** (réponse de l'utilisateur à Q-D-10, 2026-11-18) : la reprise du
    dernier numéro de facture (`facturation.suite-numerotation@1`, EPIC-244) se pose **avant sa première facture** ; à
    la liste de mise en service du distributeur de février.
  - **Le calendrier de l'organisation** (STORY-1060, lot 4 ; `terrain` `dev` 17bdba7, plateforme `8c61c48`) : la règle
    est `prospera-plateforme/contrats/distributeur/src/calendrier.ts` (`calendrier-distributeur-v1`), copiée à l'octet dans
    `terrain/src/socle/calendrier/` (empreinte dans `src/calendrier.invariant.spec.ts`) ; `pilotage` la copiera pour
    compter les jours ouvrés du mois (FR-85) et lira le calendrier de `terrain` (route ou fait à ajouter, D-1060-10). Le
    paramètre est `terrain_parametres` (`src/modules/terrain/parametres/`) : les distances et le géorepérage de `terrain`
    (AD-12) s'y ajoutent comme clés de plus (valeurs complètes à chaque version). Un plan de journée garde
    `parametresVersion` ; un plan créé ailleurs qu'à l'import (EPIC-233) se datera par `dateDuPlanDeJournee`.
  - **Ce qui reste, dans l'ordre conseillé (mis à jour le 2026-11-25, fin du lot 6 amendé)** — d'abord le bilan et les
    demandes ouvertes, puis les restes nommés par les fiches 1065 → 1071 et la liste d'avant (qui garde son
    historique) :
    - **Bilan (`prospera-bilan-service`), dans l'ordre** : (a) **à placer** : `zone-franche-togo@1.1`, qui reprend la
      correction de la cascade des sous-totaux de `@2.2` (STORY-678) — une entité en zone franche n'a pas de liasse
      `valide: true` (constat de 1118 ; en attente de la décision de l'utilisateur) ; (b) le rapprochement de la liasse
      et de sa balance par l'empreinte, dès que STORY-1022 (C) est livrée (D-1078-10) ; (c) les droits C7
      `consolidation:*` au catalogue d'auth (B), puis un droit par route (D-1074-4), et `consolidation` dans
      `INSTALLATION_SERVICES` de la recette (B) ; (d) les routes d'instance de `consolidation` et de `financement`
      (export, import, effacement, santé, `migrer`), sur le patron de 1075 ; (e) les contrats d'export et de `migrer`,
      quand B les publie (Q-D-19, Q-D-20) : recopie à l'octet, CSV, pagination de l'export ; les commentaires « à créer »
      du manifeste `bilan` à sa prochaine révision ; (f) l'alerte « ½ capital » sur un dossier client, dès que B publie
      sa forme juridique et son capital (D-1077) ; les seize indicateurs de l'analyse sans repère (Q-D-14) ; (g) le
      consommateur de `fiscal.declaration.deposee` hors de la règle de l'essai (D-1079-5).
    - **Facture (`ventes`), restes de 1073** (D-1073-12) : le numéro complet imprimé si le PO le veut (Q-D-15, une donnée
      non secrète déclarée chez `paiement`, B) ; la republication des comptes déclarés avant 1073 (B) ; l'écran des
      paramètres de la facture (A ou D, front) ; le statut et le libellé d'un compte retiré (`paiement`, B) ; 1072 : une
      pile qui veut l'e-mail du renvoi KYC pose `ESPACE_KYC_URL`.
    - **Demandes ouvertes chez B** : `dossier-service` — la règle de l'essai (KYC non lu, 1079) et la forme juridique
      (et le capital) des dossiers clients publiés (1077) ; recette — `INSTANCE_ESPACE=ESSAI` sur le bilan de l'essai
      (1079) ; `paiement` — le consommateur de `facturation.avoir.emis@1` (1066, rendu à B) ; catalogue — les recopies
      des manifestes `facturation` 1.2.0 et `paiement` 1.1.0 (1073). **Chez C** : la recopie à l'octet des paquets
      révisés par 1076, 1077, 1078 et 1118 (quatre artefacts, `smt-togo-1.0.json` compris) ; STORY-1022 (l'empreinte de
      la balance, avec son algorithme et sa version) ; la règle de l'essai (KYC non lu) dans `balance-service`.
    - **Questions au PO ouvertes** : Q-D-14 (repères de l'analyse sans source), Q-D-15 (numéro de compte imprimé), Q-D-16
      (capitaux propres des art. 371 et 664), Q-D-17 (KYC sauté dans l'essai, AD-15), Q-D-18 → 20 (l'export de
      l'utilisateur, la forme de l'export, le contrat de `migrer`) ; chacune a son défaut appliqué. Q-D-12 et Q-D-13 sont
      répondues ou closes.
    - ~~**Placée** : **STORY-1072**~~ **livrée le 2026-11-24** (notification #92, expert-comptable #11) — la demande de B (STORY-1103) : le cabinet prévenu par e-mail d'un renvoi de son
      dossier KYC (modèle `kyc-dossier-renvoi-correction` dans `notification`, consommateur de
      `kyc.correction.requested@1` dans `prospera-expert-comptable`, preuve AC-5 dans mailhog) ; voir « Réponses aux
      demandes reçues ».
    - ~~**Placée** : **STORY-1073**~~ **livrée le 2026-11-24** (dossier #58, paiement #125, ventes #16, plateforme #40) — la facture lit sa fiche légale (Q-D-12 répondue par l'utilisateur, D-Q12-1) :
      l'identité légale projetée du dossier propre de l'organisation (`dossier-service`), les coordonnées de paiement
      des comptes d'encaissement de `paiement` ; le DAF ne choisit plus que le ou les comptes imprimés ; la fiche saisie
      en 1065 n'est plus lue. **D fait aussi les deux côtés producteurs** (consigne de l'utilisateur du 24/11 (soir) : « gère tout cela dans la story 1073 sans attendre la livraison de B ») :
      les champs légaux dans `DossierEtatV1` (`dossier-service`) et la publication des comptes d'encaissement
      (`paiement`), après la passation de B limitée à 1073 ; fiche à écrire juste avant de coder.
    - **Distributeur**, dans l'ordre : (a) **l'envoi de la facture par `notification`** (D-1065-14 (2) : le geste
      « envoyer », lien public, WhatsApp puis SMS, e-mail avec le PDF ; `ENVOYE` / `ECHEC`) ; (b) **l'avoir (2)**
      (D-1066-14 : la demande du comptable validée par le DAF, `IMPUTE` / `REMBOURSE` lus chez `paiement`, le retour en
      stock, `facturation.facture.changed@1`, l'envoi et la liste des avoirs, les avoirs du freelance, les routes C13) ;
      (c) **la commande (4)** (D-1067-16 : ajouter un point de stock ou vider un bon d'une `VALIDEE`, la modification qui
      attend la réservation, `commande.commande.changed@1`, la modification par l'application terrain, la facture
      complémentaire), puis la livraison et le reliquat (`entrepot`) et la facture par livraison, l'allocation du matin,
      la remise, la dérogation (D-1062-12) ; (d) la liste des factures, les balances, la proforma, le lien de paiement,
      les routes C13 de `facturation` (D-1065-14 (3)–(5)) ; (e) les portées des comptes du jeu (3 bis, plus bas) ; (f)
      les consommateurs `pdv`, `catalogue`, `stock` et les routes C13 des autres modules (4), (5) plus bas.
    - **Assurance**, dans l'ordre : (a) **la mission (2)** (D-1071-12) : la contre-expertise qui ouvre sa mission
      (FR-66, `CONTRE_EXPERTISE_NON_AUTORISEE`, la contestée `ARBITREE` à sa validation), le passage outre du `RESP` sur
      un complément non revenu (FR-67), les seuils et le classement de la désignation (FR-62, FR-59 : validation du
      `RESP`, externe au-delà de 3 000 000), le rapport déposé dans `ged` par la mission (`expertises.rapport.depose@1`),
      les honoraires (cinq montants, visa, FR-68, FR-182), le retard de rapport (FR-184) ; (b) **`expertises` lit le
      dossier** (`sinistres.dossier.changed@1` : existence, volet, portée de l'agent, D-1071-11) et la provision pour le
      budget indicatif (D-1068-11, FR-185) ; (c) **la mission médicale** (FR-63, FR-63a : sous-étapes, convocation,
      `MED`, santé ; D-1071-5) ; (d) les autres alertes de FR-55 (vol sans plainte, seuils d'`alertes_instruction`) et
      l'écran « Lever » (D-1070-11) ; (e) « en attente du `RESP` » au dossier (`assurance.provision.a-valider@1`, amender
      la spine, D-1068-6, D-1068-11) ; (f) le « montant validé » du C-14 (`sinistres.decision.validee@1`, D-1069-11) ; (g)
      les routes C13 et les vérifications d'`expertises` (manifeste), la proposition de l'IA (`SUGGEREE`, FR-58), le
      portail des cabinets (AD-15), les écrans (coque `prospera-app`).
    - **La liste d'avant (lots 3 et 4)** : (1) ~~la facture juste (2)~~ **livrée par 1061** (suite de Sage, format,
    `PARTIELLE`/`PAYEE`) ; ~~la facture juste (3)~~ **livrée par 1065** (mentions légales en paramètre, PDF figé, lien
    public d'AD-33 ; reste l'envoi par `notification`, D-1065-14) ; puis, dans l'ordre de D-1061-12 : l'avoir ; la facture par livraison et `SANS_BON` (après la commande (2)) ;
    la liste des factures et les balances ; (2) ~~la commande (2)~~ **livrée par 1062** (`CMD-`, `TRANSMISE`, annuler) ;
    **la commande (3)** et suivantes, dans l'ordre de D-1062-12 : modifier, livraison et reliquat (avec `entrepot`, puis la
    facture par livraison), allocation du matin, remise, dérogation ; détail plus bas, « La commande (2) » ; (3) ~~les remplaçantes d'EPIC-227~~
    **la tranche de `reseau` livrée par 1063** (gabarit à zones à plat, zones et lieux rattachés du jeu, routes C13) ;
    restent, dans `reseau`, les commerciaux du jeu, le consommateur de `pdv.point-de-vente.changed@1`, les faits
    d'entrepôt de `stock`, l'export et la santé C13 (D-1063-12) ; **(3 bis) avant que la démo se joue : les portées des
    comptes du jeu dans `reseau`** (D-1064-8 ; un objet de plus dans la part `reseau`, 1.3.0) : chaque agent → sa zone,
    Yawa → `LOME-CENTRE`, Ayité, Akossiwa, Mensah → `TOTALE` ; sans elles, un compte du jeu ne voit aucun point de vente
    (échec fermé) ; avec elles, les commerciaux du jeu dans `reseau` (même identité que leur compte) ; puis, quand B aura
    `comptes` dans `jeu-demonstration@1`, **déclarer `comptes.json` dans `jeu.json`** (D-1064-4) ; (4) les consommateurs qui
    rempliront les read-models aujourd'hui remplis par personne (`pdv`, `catalogue`, `stock`) ; (5) les routes C13 de
    `facturation`, `approvisionnement`, `entrepot`, `conquete-objectifs` ; (6) les dettes héritées de `notification`
    (4 suites e2e rouges). Les restes nommés par story, dans les fiches : D-1061-12 (la facture), D-1062-12 (la
    commande), D-1063-12 (`reseau`), D-1064-9 (les comptes du jeu).
  - **Demandes ouvertes chez les autres groupes** (détail dans « Demandes aux autres groupes ») : **chez B (lot 6)** —
    **le consommateur de `facturation.avoir.emis@1` dans `paiement`** (STORY-1066, point (3) : après le lot 6 de B,
    D-979-14 ; d'ici là, le reste dû lu chez `paiement` ne baisse pas après un avoir), `terrain:parametres:modifier`
    (1060), `comptes` dans `jeu-demonstration@1` (1064) ; **chez C (lot 6)** — consommer `sinistres.evaluation.arretee@1`
    pour l'envoi C-14 (1069, information) ; **chez B (lots 3 et 4)** — le jeu
    « Grossiste du Golfe » (README, `INSTALLATION_SERVICES` avec `commande` et `terrain`, comptes du jeu : STORY-972
    annoncée), **le consommateur de `facturation.facture.emise@1`** (charge fixée par 1059), le crédit du tiers (2)
    (`paiement.credit-tiers.changed@1`) ; **chez C** — la part Prospera de l'annexe E et trois écarts du générateur
    (documents C-10, noms, garantie de 9002), l'enregistrement du destinataire de l'assuré (1051), les consentements et
    l'accusé (1054), la suite de conformité de la portée pour `sinistres` (C-1004) ; **chez A** — assembler la recette de
    la démo assurance (information).
  - **Questions au PO, avec le choix retenu par défaut** (détail dans « Questions à l'utilisateur ou au PO ») : Q-D-4
    (encours certain pour le plafond), Q-D-5 (`commande:parametres:modifier`, DG et `DIST_ADMIN`), Q-D-6 (seul le numéro
    officiel est facultatif à l'assuré), Q-D-7 (la recette lit la personne par son rôle), Q-D-8 (`objets-de-l-annexe-c`
    vert sans documents), Q-D-9 (dimanche chômé, samedi travaillé), **Q-D-10** (la série `FAC-` démarre à 0 sans reprise
    de Sage), **Q-D-11** (les jours fériés du calendrier par défaut : du lundi au samedi travaillés, dix fériés du Togo),
    **Q-D-12** (la fiche légale de l'organisation saisie par le DAF dans les paramètres de la facture, D-1065-2) ;
    **Q-D-13** (qui tient `prospera-expert-comptable` : choix par défaut, D y porte le consommateur de
    `kyc.correction.requested@1` pour 1072).
  - **Pièges** : la section « Pièges rencontrés » (par story, la plus récente d'abord). À lire avant tout : le verrou
    Docker du poste et les commandes courtes (1058-5, 1055-2), les fins de ligne et `git archive` (§1.7), les mutations
    qui rougissent sur une compilation (1053-2, 1058-2, 1059-1), `--load` au `docker build` (1056-1), Karapace qui
    répond 500 juste après `healthy`, `pino-pretty` absent de l'image `runtime` (1052-2, 1058-1).
  - Le détail, sujet par sujet :
  - `reseau-service` complet pour le lot (EPIC-044 → 053) : `dev` 5922180 ; contrat `reseau.portee.changed@1` publié
    et au registre ; suite de conformité `conformite-portee-reseau-v1` ; C-1004 est le premier consommateur attendu.
  - Les cinq services du distributeur en squelette (garde par module, profil, manifestes, piste d'audit chaînée,
    aucun import croisé) : ventes 3412, terrain 3413, recouvrement 3414, pilotage 3415, croissance 3416.
  - `prospera-plateforme/series/` : `series-v1` (STORY-1044) et **`series-v1.1`** (STORY-1052, `dev` 1fe8c5e),
    copiée dans ventes (`src/socle/series/series.ts`, empreinte `68833b1a…` figée par `src/series.invariant.spec.ts`).
    **Les séries hébergées** (STORY-1052) :
    - **Émettre un numéro** = `NumerotationDesSeries.emettreDansUneTransaction(module, organisationId, serie,
      travail)` : la transaction (`majority`) porte le numéro ET la pièce que `travail` écrit avec la session ; le
      numéro est confirmé dans l'ancre après l'acquittement ; une transaction périmée (`SERIE_INSTABLE`) est rejouée.
      **1056** l'emploie pour `BL-` (série `bons-livraison`, déclarée par `SeriesDeCommande`) ; `facturation`
      déclarera ses séries de même (`declarer('facturation', { … })`). Ne jamais tirer un numéro hors d'elle.
    - **L'hébergé est une configuration** (AD-26) : `SERIES_ANCRE_URI` (l'ancre, une base **hors** de celle du
      service ; en production, celle de la plateforme Money Vibes), `MONGODB_MEMBRES_PORTEURS_MIN=3` ; sans elles, le
      service se comporte comme `series-v1` et le dit (`SERIES_SANS_ANCRE`). Profil de pile :
      `docker-compose.heberge.yml`.
    - **Une restauration se voit seule** : au démarrage (avant d'écouter) ou à l'émission, la série est relevée au
      maximum de l'ancre, le trou est déclaré (`GET /api/v1/commande/series`), tracé dans `commande_audit` et signalé
      `SERIE_DERIVE` au journal (l'alerte d'AD-32, à brancher sur la supervision). Le résidu (une panne entre
      l'acquittement et la confirmation, puis une restauration) est écrit dans la fiche (D-1052-6).
    - Reste : publier `commande.serie.changed@1` (1056, avec le manifeste), remettre chaque jour la tête à l'agent
      (EPIC-148, B), brancher l'alerte `SERIE_DERIVE` sur la supervision du moteur (AD-40) ; la route de recette
      (`SERIES_EMISSIONS_DE_RECETTE`, jamais en production) sert les recettes de restauration.
  - `prospera-plateforme/vocabulaires/` (`vocabulaires-v1`) et `contrats/distributeur/` (`contrats-distributeur-v1`),
    STORY-1045, `dev` baa38dd : le vocabulaire par verticale et la garde du catalogue des faits d'AD-20. **Aucun
    service ne les copie encore** : chacun les copie à l'octet (empreintes dans `stories/STORY-1045.md`) avec sa
    première story qui affiche un libellé ou publie un fait, et rejoue `verifierFaitsDuModule` sur la clause C5 de
    chacun de ses manifestes. Les 13 faits « nouveaux » d'AD-20 manquent encore aux manifestes (PR d'AD-27).
  - ~~`vocabulaires/` et `contrats/distributeur/` dans la plateforme (D-1042-3)~~ : **soldé par STORY-1045**.
  - `prospera-plateforme/encours/` (`encours-v1`, STORY-1047, `dev` b061cec) : **la seule règle de calcul de
    l'encours** (AD-9), pour `commande`, `pdv` et `recouvrement`. **`ventes` la copie depuis STORY-1049**
    (`src/socle/encours/`, empreintes figées par `src/encours.invariant.spec.ts`, vecteurs d'or rejoués) ; `pdv` et
    `recouvrement` la copieront de même. Ce qui en est exclu et pourquoi : D-1047-3. Reste à y ajouter, en `1.x`, l'exclusion du
    montant dérogé pour l'évaluation du blocage (avec la story de `recouvrement`). La correspondance avec les faits de
    B-963 et B-965 est **faite par 1059**, chez le consommateur (`src/modules/commande/credit/faits-lus.ts`).
  - ~~Le volet Reprise de l'import réseau (D-1041-3)~~ : **soldé par STORY-1055** (`dev` c62f586 → d31f744) :
    - **la cible** : `src/modules/reseau/reprise/`, sur `src/vendor/kit-cible/` (`kit-cible-v1.0.1`, empreintes dans
      `src/reprise.invariant.spec.ts`). Pour passer à une version suivante du kit, recopier toute la distribution à la
      nouvelle étiquette (`git -c core.autocrlf=false show`), refiger les empreintes, puis rejouer
      `test/integration/reprise-conformite.int-spec.ts` sans y toucher ;
    - **les schémas** : écrits dans `prospera-plateforme/contrats/objets/reseau/` (`objets-reseau-v1`, `a458b26`).
      Une mineure (`zone@1.1`) se publie là, s'étiquette, puis se recopie dans `reprise/objets/` avec `ORIGINE.json` ;
    - **le moteur des zones** (`import/moteur-des-zones.ts`, `regles-des-zones.ts`) est le seul chemin d'une zone en
      nombre. Un redécoupage ou un import futur passe par lui ;
    - restent hors de la reprise : agences (avec la microfinance), portées (AD-8), responsable, affectations antérieures
      (une mineure `commercial@1.1`), déplacement ou fermeture d'une zone existante (actes de Prospera) ;
    - pour la Reprise (`reprise-service`) : un lot par sorte d'objet, car la version vaut par `lotId` (D6 du kit). Les
      zones partent avant les commerciaux, le parent avant l'enfant.
    ~~D-1034-5, D-1032-2, D-1030-2~~ : **soldées par STORY-1050** (`dev` a3d2f59, 49c4d01) :
    - la garde de `reseau` lit l'état publié seul (`src/socle/etat-des-modules/`, projection `socle_etats_publies`,
      copie `src/vendor/garde-etat-publie/` à `garde-etat-publie-v1`) ; `socle_etat_des_modules` (ancienne projection
      d'`entitlement.changed`) n'est plus lue : la supprimer d'une base existante est sans risque ;
    - les droits viennent de `/moi/droits` (`src/socle/droits-du-membre/`, `AUTH_SERVICE_URL` requise) ; aucune table
      de rôles dans le service ; **1053** n'aura qu'à vérifier que la table d'accès de B-960 rend les cinq `reseau:*`
      aux bons rôles (rien à coder côté garde) ;
    - le commercial suit son compte (`personnes/comptes-des-commerciaux.ts`, suites inscrites dans
      `socle/identite/suites-de-l-identite.ts`) ; `comptePublie` retenu sur la fiche ;
    - la doublure de recette de `/moi/droits` est dans l'émetteur du profil `recette` (revendications
      `droitsDeRecette`, `droitsHorsJetonDeRecette`).
  - Outils : banc HTTP d'intégration sur MongoDB réel (`test/integration/application-http.ts`), émetteur de jetons de
    recette (profil compose `recette`), Karapace (profil `registre`).
  - **Assurance (lot 3), pour mémoire** : D tient aussi `prospera-assureur-fictif` (la démo, EPIC-204), qui n'est pas
    du distributeur ; le jeu de l'assurance et les routes C13 y sont depuis STORY-1046, le refus de l'espace réel
    (`INSTANCE_ESPACE`, sortie 78) et la remise à zéro qui rejoue les quatre scénarios depuis STORY-1048 (`dev`
    4f4aa89) ; la recette de la démo (`npm run recette:demo`, table de l'annexe E classée), les cinq routes de
    vérification C13 et la boîte aux lettres fermée après un effacement depuis STORY-1057 (`dev` f9bbea5). Ce qui
    reste à l'assurance de D : rien d'ouvert dans le dépôt ; les demandes à C (documents C-10, noms, garantie de 9002)
    changent le générateur de C, que D recopie alors à l'octet (empreinte du jeu à refiger).
  - **Les garde-fous de `commande`** (STORY-1049, `ventes` `dev` c8f5fd2), `src/modules/commande/garde-fous/` :
    - paramètres versionnés (`commande_parametres`, une version immuable par changement, la première écrite à la
      première lecture) ; changés par `TENANT_ADMIN` jusqu'à 1053 ; un acte garde sa `parametresVersion` ;
    - le crédit se lit par le port `SourcesDuCredit` dans des read-models **remplis par personne aujourd'hui** :
      `commande_plafonds` (projection future de `pdv.plafond.changed@1`, avec `suspendu` = crédit bloqué, **toujours
      remplie par personne** hors du jeu C13), `commande_creances`, `commande_credits_tiers` et
      `commande_sources_encours` : **remplis depuis 1059** par le consommateur de `paiement.creance.changed@1` (sans
      Créance projetée pour l'organisation, la source reste `ABSENTE` et la commande à crédit est refusée
      `ENCOURS_NON_INSTALLE`) ;
    - ~~l'acte reçoit la commande dans son corps (squelette, D-1049-9)~~ : **soldé par 1056** (voir « La commande (1) »
      plus bas) ;
    - l'adaptateur de `stock` est `ReservationStockNonBranchee` (motif `RESERVATION_NON_BRANCHEE`) tant que l'API de
      réservation de `stock` n'existe pas ; la projection des droits garde le voisin `stock` (`MODULES_VOISINS`).
  - **`prospera-notification-service` (reçu de B, lot 3), pour mémoire** : D y porte la communication de l'assurance
    (EPIC-220), pas du distributeur. Depuis STORY-1051 (`dev` b3d4388) : `src/domain/assurance/` (matrice statut →
    message, interdits, relances), `src/modules/assurance/` (consommateur de `sinistres.dossier.changed@1`, groupe
    `notification-assurance` ; route de service du destinataire, `sinistres-service` seul), file
    `notification:relances-pieces` (`adapters/bullmq/relances-pieces-*.ts`), neuf modèles `assurance-*` au socle,
    copie `src/vendor/classification-sante/` (à recopier et refiger si C change son registre). Depuis STORY-1054 (`dev`
    e0a50c0) : `assurance_messages` (journal des messages de l'assuré : voie, accusé calculé des `Envoi`, cloche),
    `assurance_consentements` (actes en ajout seul, deux finalités), `MessagesAssureService` (tout message de
    l'assurance y passe : relances comprises), `FinsDeChaine` dans `envois` (l'assurance s'y inscrit ; un autre module
    peut le faire), trois routes de la même porte de service (`sinistres-service` seul). Reste : WhatsApp et ses
    modèles approuvés (D-1054-12), le courrier avec preuve, un fait d'accusé poussé si C le demande, l'effacement des
    destinataires de l'assuré par les droits des personnes (dette de 1051, toujours ouverte).
    Dettes héritées : 4 suites e2e rouges (voir « Pièges ») ; ouvert de la passation de B (vérification des sorties
    d'essai, bascule de la garde sur l'état publié seul).
  - **L'accès des cinq services** (STORY-1053, EPIC-223) :
    - **la règle** : `prospera-plateforme/contrats/distributeur/src/acces.ts` (`acces-distributeur-v1`, e3727f8),
      copiée à l'octet dans `src/socle/acces/acces-distributeur.ts` de chaque service (empreinte dans
      `src/acces.invariant.spec.ts`) ; le dossier `src/socle/acces/` est **le même dans les cinq** : une évolution se
      fait dans `ventes`, puis se recopie dans les quatre autres (vérifier avec `diff -r`) ;
    - **une route neuve** déclare `@ExigeDroit('<droit du manifeste>', …)` (l'un suffit) ou `@ExigeUnDroitDuModule()` ;
      sinon `src/acces.invariant.spec.ts` rougit. Les droits viennent de `/moi/droits` ; jamais de `roles`,
      `perms[]` ou `roleMetier` ;
    - **la portée** : `PorteesDesMembres.portee(org, userId, 'LECTURE'|'ECRITURE')` (échec fermé), ou
      `.condition(org, userId, sorte, '<champ du nœud>')` à **ajouter** à la condition d'organisation ; lecture hors
      portée ⇒ 404, écriture ⇒ 403 `HORS_PORTEE` (patron : `commande`, `garde-fous.service.ts`) ; les douze autres
      modules l'appliqueront avec leur première route de données ;
    - **une donnée privée** : la déclarer dans les champs privés du module (`ChampsPrives`, patron
      `commande/garde-fous/donnees-privees.ts`) : elle est retirée de la réponse (clé absente) et sa consultation
      journalisée (`DONNEE_PRIVEE_SERVIE`) ;
    - **recette** : l'émetteur de jetons de 1053 dérive les droits de chaque rôle de
      `auth-service/src/modules/rbac/table-d-acces-distributeur.ts` (scripts décrits dans la fiche) ; un vrai
      auth-service se branche par `AUTH_SERVICE_URL` et `AUTH_JWKS_URI`.
  - **La commande (1)** (STORY-1056, `ventes` `dev` 10b8ba5 → 7221f4c), `src/modules/commande/commandes/` :
    - **la saisie** (`commandes.service.ts`) lit le point de vente dans `commande_points_de_vente` et les prix dans
      `commande_prix` : **personne ne les remplit encore**. Les consommateurs de `pdv.point-de-vente.changed@1` (nœud,
      point de stock source) et de `catalogue.grille.publiee@1` (prix « ce client » et société, unité, **taux de TVA du
      paquet fiscal**, version de grille) sont à écrire quand `pdv` et `catalogue` publieront ; sans document,
      `POINT_DE_VENTE_INCONNU` ou `ARTICLE_SANS_PRIX` (échec fermé) ;
    - **la validation** : `CommandesDuModule.valider` construit l'acte depuis la commande (`entreeDe`, déterministe) et
      appelle `GardeFousDeCommande.valider` avec `dansLaTransaction` (le lien de la commande) ; l'engagement part dans
      l'outbox de la même transaction ;
    - **l'émission** (`emission-des-bons.service.ts`) : seul chemin d'un numéro `BL-`. Elle tourne après la réservation
      (validation) et après la reprise ; un bon déjà émis annule la transaction (le numéro n'est pas engagé) ;
    - **les transitions** sont une donnée (`transitions.ts`, `transitions-commande@1`) : la commande (2) y ajoute ses
      routes sans changer la table (ou publie une v2 que les commandes neuves portent) ;
    - **l'outbox** est au socle (`src/kafka/outbox/`) : un module neuf (`facturation`) déclare son énumération de
      topics dans `topics.ts`, ses schémas dans `contrat/schemas/`, et l'invariant `contrats-distributeur.invariant`
      exige le manifeste et le catalogue ;
    - **recette** : `COMMANDE_RESERVATION_STOCK=recette` (refusé en production) réserve tout ; la surcouche de pile
      (émetteur de jetons, Karapace) et le script de recette sont décrits dans la fiche ;
    - **reste (la commande (2), remplaçante)** : `TRANSMISE` (terrain, WhatsApp transmis, `PRIX_CHANGE`,
      `COMMANDE_PROBABLEMENT_DOUBLE`) ; modifier, annuler (delta de réservation, bons `ANNULE` qui gardent leur numéro,
      historique) ; remise et décision ; dérogation au plafond et son fait ; numéro `CMD-` ; `commande.commande.chiffree@1`,
      `.changed@1`, `.annulee@1` ; marge (coût de `stock`) ; livraison et reliquat (`livre@1`) ; allocation du matin ; PDF
      du bon ; alertes à N jours ; les consommateurs qui remplissent les read-models ; la rétention sans expiration du
      topic `commande.serie.changed` (réglage du broker) ; l'API de réservation de `stock`.
  - **Le jeu « Grossiste du Golfe » et les routes C13** (STORY-1058, étiquette `jeu-grossiste-golfe-v1` ; ventes
    `dev` 7f674ef, terrain `dev` 068e1c0) :
    - **le jeu** : `prospera-plateforme/jeux-demonstration/grossiste-golfe*/` ; le régénérer :
      `node jeux-demonstration/grossiste-golfe/generateur/generer.mjs <dossier> PETIT|MOYEN|GRAND`, puis
      `node --test …/generer.test.mjs` (les empreintes des `jeu.json` y sont figées : une version neuve du jeu les
      refige et change `version`) ; une part de plus (pdv, catalogue, stock, facturation…) s'ajoute au générateur, dans
      l'ordre des dépendances ;
    - **la règle des identifiants** : `src/socle/instance/identifiant-du-jeu.ts` (24 hex de
      `sha256("jeu-demonstration|<org>|<objet>|<clef>")`) ; tout module qui reçoit une part l'applique ;
    - **le socle C13** : `src/socle/instance/` (identique dans ventes et terrain, `diff -r`) ; un module de plus sert ses
      routes avec un contrôleur `@RoutesDInstance('<code>')` + `@AdmetIdentitesDeService('MOTEUR')`, une `PartDuModule`
      (objets, `ouVivent`, plan d'effacement), un invariant d'inventaire du plan, et son code dans
      `MODULES_AVEC_ROUTES_C13` (`src/droits-des-modules.ts`) ;
    - **la recette** : pilote de la partie A et surcouche (émetteur RS256, `INSTANCE_ESPACE=ESSAI`) décrits dans la fiche ;
    - **reste** : les routes C13 de `facturation`, `approvisionnement`, `entrepot`, `conquete-objectifs` ; ~~la part
      `reseau`~~ (**livrée par 1063**) ; les routes de lecture des tournées (EPIC-233).
  - **La facture juste (1)** (STORY-1059, `ventes` `dev` 1c1e944 → bd8d211), `src/modules/facturation/` et
    `src/modules/commande/credit/` :
    - **l'émission** (`factures/factures.service.ts`) : `POST /facturation/factures { commandeId }` facture une commande
      `VALIDEE` (option « dès la validation », AD-29 : quantités commandées, prix figés) ; la commande est lue dans
      `facturation_commandes_chiffrees` (projection de `commande.commande.chiffree@1`, jamais le code de `commande`) ;
      l'échéance vient de `facturation_conditions_reglement` (**remplie par personne** : projection future de
      `pdv.point-de-vente.changed@1` ; sans elle, `CONDITIONS_REGLEMENT_MANQUANTES`) ; le numéro `FAC-` est tiré dans
      la transaction de la facture (série `factures`, `SERIES_DE_FACTURATION`) ; clé d'origine `<commandeId>:facture`
      (index unique) ;
    - **la Créance** (`creances/`) : port `OuvertureDeCreance` (adaptateur HTTP vers `PUT
      {PAIEMENT_SERVICE_URL}/api/v1/creances/sources/FACTURE/{factureId}`, jeton du membre) ; `OuverturesDesCreances`
      note l'issue (`A_OUVRIR`, `OUVERTE`, `REFUSEE`) et relance en mémoire tant que le jeton vit ; après un
      redémarrage, une facture `A_OUVRIR` se reprend par le rejeu ou `POST …/factures/{id}/creance` — **jusqu'au
      consommateur de `facturation.facture.emise@1` chez B**, qui la rendra durable (même clé) ;
    - **la projection du crédit** (`commande/credit/`) : groupe `ventes-service.creances` sur `paiement.creance.changed`
      et `facturation.facture.emise` ; plus haute révision par Créance ; crédit du tiers = trop-perçu (B-965) ; sources
      de l'encours posées au premier fait de l'organisation ; l'engagement baisse du TTC à la Créance de la facture,
      une fois (`commande_factures.engagementSolde`) ;
    - **pour la facture par livraison (2)** : une seconde clé d'origine (`<livraisonId>:facture`), la quantité facturée
      par ligne de bon, la lecture de `commande.bon-livraison.livre@1` ; le mode se fige par commande (AD-29) ;
    - **recette** : pile `grp-d` avec le vrai `paiement` d'`origin/dev` (Mongo `rs-paiement` provisionné par ses
      scripts, Redis, `NODE_ENV=production`, `/health/live` : il est `unhealthy` par construction), KYC et droit
      `paiement` publiés sur Kafka, jetons à double audience (`ventes-service`, `paiement-service`) avec
      `perms: ['paiement:demande:emettre']` ; pilote et surcouche décrits dans la fiche 1059.
  - **La facture juste (2)** (STORY-1061, `ventes` `dev` 33bd0e7 → 68b293c), `src/modules/facturation/numerotation/` et
    `reglements/` :
    - **la suite de Sage** : `SuitesDeNumerotation.poser` est **le** geste ; le point d'import de la Reprise
      (`facturation.suite-numerotation@1`, EPIC-244) l'appellera tel quel (même corps). Une série de plus qui reprend
      Sage (avoir, proforma) s'ajoute à `SERIES_REPRISES` et à l'énumération de la route ;
    - **le format** se lit par `SuitesDeNumerotation.formatDe(org, série, session)` **dans** la transaction du numéro ;
      `mettreEnForme` / `lireLeNumero` (`numerotation/format.ts`) sont la seule règle ;
    - **le socle** : `NumerotationDesSeries.amorcerDansUneTransaction` (le compteur amorcé et l'écrit dans une même
      transaction ; plancher posé dans l'ancre après) ;
    - **le règlement** : `ReglementsDesFactures.reglement(org, factureId, echeanceLe)` ; la balance clients et la balance
      âgée liront `facturation_creances_lues` ;
    - ~~défaut latent nommé~~ (`ProjectionDuCredit.plusHauteRevision`, `CommandesChiffrees.appliquer`) : **corrigé par
      1062** (`dev` b9a82a6), prouvé rouge puis vert sur MongoDB réel ;
    - **recette** : `scripts/recette/1061/` (pile sans `paiement`, son fait publié par le pilote ; mutations).
  - **La commande (2)** (STORY-1062, `ventes` `dev` 339a1ad → f49f3a6), `src/modules/commande/commandes/` :
    - **le numéro `CMD-`** : série `commandes` de `SeriesDeCommande`, tirée dans la transaction de la saisie
      (`emettreDansUneTransaction`) ; une commande d'avant 1062 n'a pas de numéro (`null`) ;
    - **la commande terrain** : `TRANSMISE` dès la saisie ; `jugerLePrix` (commandes.service) relit la grille à la
      validation et pose `ecartDePrix` ; la confirmation cite la révision ; le double se cherche par `empreinteDuContenu`
      **dans** la transaction du numéro (le compteur sérialise deux transmissions) ;
    - **l'annulation** : `AnnulationDesCommandes` ; le port `ReservationStock.liberer` est celui que l'API de `stock`
      devra servir (même clé `<bonId>:<ligne>`) ; une ligne `A_LIBERER` se rend au rejeu de l'annulation ;
    - **facturation** lit `commande.commande.annulee@1` (groupe `ventes-service.commandes-chiffrees`,
      `facturation_commandes_annulees`) ; la fenêtre résiduelle (facture émise avant que l'annulation soit lue) est
      tracée `FACTURE_D_UNE_COMMANDE_ANNULEE` et se corrigera par l'avoir ;
    - **recette** : `scripts/recette/1062/` (pile sans `stock` ni `paiement`, adaptateur de réservation de recette).
  - **Les référentiels côté réseau** (STORY-1063, `reseau` `dev` 25de958 → 4b55ac1 ; plateforme 26977ca,
    `jeu-grossiste-golfe-v1.1`), `src/modules/reseau/instance/` et `src/socle/instance/` :
    - **la part du jeu** (`part-reseau.ts`) : `hierarchie` (le gabarit, `HierarchieService.configurerDansLaSession`),
      `zone` (moteur des zones, identifiant imposé `identifiantDuJeu(org, 'zone', clé)` ; une zone déjà là est gardée),
      `rattachement` (`RattachementsService.rattacherEnNombreDansLaSession` ; la zone vérifiée dans la transaction, car
      l'identifiant d'un nœud est un ObjectId que la vérification des références du socle ne voit pas) ;
    - **un objet de plus** (les commerciaux du jeu : `commercial`) s'ajoute à `partDuReseau` et au générateur
      (`PARTS`, part `reseau`), dans l'ordre des références ; le jeu change de version et ses empreintes se refigent ;
    - **le plan d'effacement** (`PLAN_DE_RESEAU`, `EXCLUES_DU_PLAN`) : une collection neuve du service rougit
      `plan-d-effacement.invariant.spec.ts` tant qu'elle n'y est pas (les constantes `COLLECTION_* = '…'` sont lues) ;
    - **le socle C13** est la copie de `ventes` (Ajv 8 dans `contrats-instance.ts`) : une évolution du socle se fait dans
      `ventes`, puis se recopie ici et dans `terrain` ;
    - **l'espace** : `KAFKA_ESPACE` (pas `INSTANCE_ESPACE`) ; **recette** : `scripts/recette/1063/` (pilote de la pile,
      mutations).
  - **Les comptes du jeu** (STORY-1064, plateforme `50c12a6`, `jeu-grossiste-golfe-v1.2` ; `ventes` `edb3f8f`) :
    - **le fichier** : `jeux-demonstration/grossiste-golfe*/comptes.json`, produit par le générateur (`COMPTES_DU_BUREAU`,
      `ROLE_METIER_DES_AGENTS`, `compteDeLAgent`), sans tirer un nombre ; le corps exact de `PUT
      /api/v1/interne/organisations/{org}/comptes-du-jeu` d'auth (B, STORY-972) : un champ de plus y est refusé ;
    - **la déclaration** dans `jeu.json` attend `comptes` dans `jeu-demonstration@1` (B) : ajouter alors l'entrée au
      manifeste dans `jeu()` du générateur, version 1.3.0, et refiger les empreintes de `generer.test.mjs` ;
    - **l'identité** : un compte d'agent = son commercial de `terrain` ; un compte du bureau a l'objet `compte` ; vecteurs
      dans `generer.test.mjs` et `ventes` (`src/socle/instance/identifiant-du-jeu.spec.ts`) ;
    - **les portées** des comptes dans `reseau` sont la suite (D-1064-8, « Ce qui reste » (3 bis)).
  - **Le lot 3 de D est fini.** **Le lot 4 de D est fini** (1060 → 1064, le 2026-11-18) : ~~les remplaçantes
    d'EPIC-227 (1063)~~ **livrée**, ~~les comptes du jeu (1064)~~ **livrée**. **Le lot 6 de D est fini** (1065 → 1071,
    le 2026-11-24).
  - **L'assurance reprise de C (lot 6), pour Dev A** :
    - **`sinistres`** : le dossier et sa machine (table `table-des-transitions-2026.2.json`, conditions lues dans les
      constats ou calculées : `CONDITIONS_CALCULEES` de `machine/machine.ts`, dont **`EXPERTISE_VALIDEE` depuis 1071**) ;
      toute écriture du dossier passe par `ecrireUneCommande` (version, piste chaînée, `dossier.changed@1`, faits de
      l'acte dans la même transaction) ; un fait d'un autre module s'applique par une commande du système (patron :
      `appliquerPieceControlee`, `appliquerMissionChangee`).
    - **Les consommateurs** (patron : `provision/consommateur-provision.service.ts`, `missions/consommateur-missions.service.ts`) :
      topic créé avant l'abonnement, `metadataMaxAge: 10_000`, relance avec recul, fait hors contrat écarté ; tests du
      client de Confluent sous Node 24 (étage `verification`).
    - **Les faits publiés** : schéma dans `prospera-plateforme/contrats/assurance/<module>/`, chaque champ classé au
      registre `classification-sante`, copie à l'octet dans `contrat/schemas/` (empreintes dans
      `ORIGINE-DES-SCHEMAS.json`) ; l'outbox du service sert `sinistres` ET `expertises` (`kafka/outbox/topics.ts`).
    - **`expertises`** : le référentiel des experts (1014 : `exigerDesignable`) et la mission (1071 : la machine en données
      `machine-des-missions-2026.1.json`, `jugerLActe` pur, `MissionsService`). Un acte de plus = une ligne de la table
      (et sa règle dans `jugerLActe`) ; une version neuve de la table se publie à côté, la mission garde la sienne.
    - **Bancs MongoDB** : une base par fichier, vidée entre deux tests (D-1070-10) ; jamais de DDL par test.
    - **Recettes** : `scripts/recette/1068` → `1071` (piles `grp-d`, pilotes Python, mutations).

## Demandes aux autres groupes

- **→ C (2026-11-27, STORY-336) : information, non bloquante — exporter, si C le préfère,
  `HistoriqueObligationsService` et `RegistreValidationsClient` depuis `ObligationsModule`.** Le dossier de contrôle lit le
  chemin d'un montant (329, 339) et les pièces de validation du client (324) ; `ObligationsModule` ne les exporte pas, et
  D les fournit donc lui-même dans `DepotsModule`, en lecture, avec les adaptateurs de C (D-336-4), sans toucher un fichier
  de C. Si C exporte les deux, D importera au lieu de fournir (une ligne). Un constructeur qui change chez C se verra au
  démarrage de la pile (§1.5) : le dire à D dans « ⚠ Communs » de C suffit.

- **→ B (2026-11-26, STORY-335) : recevoir dans le fonds d'archives du client les pièces du dépôt d'une déclaration —
  ouverte, placée par B (« h », après sa 1129, avant 1130).** B choisira la forme (un fait consommé par la GED, ou une
  route de dépôt de la GED) et répondra dans « Réponses » de son journal, avec un message, avant tout code de D. Côté D,
  le lien est derrière le port `CopieAuFondsDArchives` (adaptateur inerte, fiscal #85).
  - Pourquoi : AC-1 de 335 (« archivé dans `document-service`, rattaché au dossier, à l'implantation, à l'obligation et à
    la période ») et V9 de la salle du 19/11 (« la liasse figée, son accusé et la validation du client dans le même fonds
    d'archives que les pièces », 1100). Le fonds est la GED de B ; sa pièce ne s'indexe aujourd'hui ni par obligation, ni
    par implantation, ni par période, et aucun fait du fiscal n'y est consommé.
  - Ce que D fournit (fiscal, `MNV-335`) : l'original, dans le bucket privé du fiscal (682), rattaché (`obligationId`,
    `dossierId`, `implantationId`, `redevableId`, `taxe`, `periode`, `numero`, `empreinte` sha256), relu par URL présignée
    re-vérifiée ; l'archive par version (`GET /api/v1/depots-declaration/archives?obligationId=…`).
  - Ce que B choisit : la forme de la copie (un fait du fiscal, `fiscal.depot.piece-archivee`, que la GED consomme en
    demandant les octets par une route de service du fiscal ; ou une route de dépôt de la GED que le fiscal appelle), et
    l'indexation (obligation, implantation, période, version). D émet le fait ou appelle la route dès que B a choisi ; rien
    n'est émis d'ici là (D-335-9). La copie ne remplace pas l'original : la preuve reste re-vérifiée au fiscal (Q-D-31).

- **→ C (2026-11-26, STORY-334) : ouvrir `DEPOSEE → A_DEPOSER` sur un rejet consigné — servie (C, fiscal #86, `dev`
  `ffd6f2a`).** Livré par D :
  fiscal #82 (`dev` `69d7e65`) ; le SHA a été envoyé à C (`moneyvibes-apps-f7`).
  - Pourquoi : AC-1 de 334 (« un rejet enregistré, l'obligation revient dans le cycle sans qu'aucune version antérieure
    ne soit altérée ») ; D-325-9 laisse ce retour à 334, mais il est dans `CycleObligationsService.revenir` et
    `verifierRetour` (`domain/obligations/version-declaration.ts`), fichiers de C, et le service n'est pas exporté.
  - Ce que D fournit (fiscal, `MNV-334`) : `AccusesDepotModule` (le même qu'en 333, sans `ObligationsModule`) exporte
    aussi le port `PreuvesDeRejet` (`src/ports/preuves-rejet.ts` : `rejetDe(orgId, obligationId, numero)`) ; la règle pure
    `verifierRejetAuRetour(preuve, { obligationId, numero })` (`src/domain/depot/rejet-depot.ts`) lève `409 REJET_REQUIS`.
  - Ce que C fait : dans `revenir`, de `DEPOSEE` vers `A_DEPOSER` seulement (les autres retours au-delà du dépôt restent
    `RETOUR_AU_DELA_DU_DEPOT`), `verifierRejetAuRetour(await preuves.rejetDe(orgId, id, versionCouranteDe(o).numero), …)` ;
    la version scellée n intacte ; le pointeur passe à `{ numero: n + 1, nature: 'RETRANSMISSION', versionId: null }` ; le
    dépôt suivant scelle n + 1. Le motif du retour reste exigé ; l'acte peut citer `rejetId`. Aucune migration. Le même
    import d'`AccusesDepotModule` que la garde `ACCUSE_REQUIS` de 339.
  - En attendant : la reprise passe par la rectificative de 325 (n + 1 nommée `RECTIFICATIVE`, la version n intacte).

- **→ C (2026-11-26, STORY-333) : garde ACCUSE_REQUIS — servie (fiscal #83, 74b33ec).** `ObligationsModule` importe
  `AccusesDepotModule` ; les doubles de C doublent `PreuvesDAccuse` (consigné par défaut). Acceptée d'abord, placée en tête
  de 339 (après la fusion de 333).
  333 est fusionnée (fiscal #81, `dev` `fc317a1`) ; le SHA a été envoyé à C (`moneyvibes-apps-f7`).
  - Pourquoi : AC-3 de 333 (« une obligation sans accusé ne passe pas à "Accusé reçu" ») ; `DEPOSEE → ACCUSE_RECU` n'a
    aujourd'hui aucune garde, et le service n'est pas exporté : D ne peut pas le garder sans toucher le dossier de C.
  - Ce que D fournit (fiscal, `MNV-333`) : le module `AccusesDepotModule` (`src/modules/depots/accuses-depot.module.ts`,
    il n'importe pas `ObligationsModule`) qui exporte le port `PreuvesDAccuse` (`src/ports/preuves-accuse.ts`) ; la règle
    pure `verifierAccuseAuRecu(accuse)` (`src/domain/depot/accuse-depot.ts`), qui lève `409 ACCUSE_REQUIS`.
  - Ce que C fait : importer `AccusesDepotModule` dans `ObligationsModule` ; injecter `PreuvesDAccuse` dans
    `CycleObligationsService` ; à `vers === 'ACCUSE_RECU'`, `verifierAccuseAuRecu(await preuves.accuseDe(orgId, id,
    versionCouranteDe(obligation).numero))`, après les gardes d'état. Aucune migration. Les fixtures de C qui passent à
    `ACCUSE_RECU` devront consigner un accusé (ou doubler le port).

- **→ B (2026-11-26, STORY-1141) : recopier le manifeste `paiement` 1.2.0 au catalogue — servie (catalogue #83, dev
  `ce8cbc0` ; journal de B `main` 1206297).**
  - Source : `prospera-stories/manifestes/paiement.manifest.ts`, `main` 6a5d3ab (#967).
  - Cible : `platform-catalog-service/src/modules/catalog/manifeste/copies.json`, où `paiement` est encore en 1.1.0.
  - Ce qui change : `paiement.compte.changed@1` gagne `numeroImprimable`, facultatif, et part aussi au changement de ce
    numéro. La route d'écriture neuve `PUT /api/v1/comptes-encaissement/{compteId}/numero-imprimable` reste hors
    `routesLectureSeule`. La liste des faits, les droits et les routes de lecture seule ne changent pas.
  - Le schéma est au dépôt de paiement (`contrat/schemas/paiement.compte.changed.json`), au registre par son script.
  - La note du catalogue des faits du distributeur (`prospera-plateforme/contrats/distributeur/catalogue-faits.json`)
    dit encore « manifeste paiement 1.1.0 » : une note, qu'aucune garde ne lit.
  - Prévenu par SendMessage.

- **→ C (2026-11-26, STORY-349) — information, non bloquante** : (1) le paquet ne nomme pas l'organisme du reversement
  de la retenue d'IRPP : le canal de `RETENUE_IRPP` sort `NON_DECLARE` ; `irpp.retenueALaSource.reversement.organisme`
  le nommerait sans livraison. (2) `COTISATIONS_SOCIALES` et `RETENUE_IRPP` sont écrites par la dérivation sociale
  de D ; si le catalogue les porte un jour, il fait foi (D-349-5). (3) Pour 350 : `ObligationsModule` ne peut pas
  importer `RemunerationModule` sans `forwardRef` (cycle) ; un module de 350 peut importer les deux.
  - **→ C : canal de la retenue d'IRPP — servie (339, fiscal #84 c459960 ; balance #173 61997fd ; organisme « service des
    impôts », LPF Art. 27).** Le format `TG × RETENUE-IRPP` (D-331-9) reste à écrire par D, par donnée du paquet de dépôt.
  - **Ajout du 2026-11-26 (STORY-331), toujours non bloquant — → C : nommer le canal du reversement de la
    retenue d'IRPP au paquet fiscal — servie (ci-dessus)** (rappelée à la clôture de 331, fiscal #78, `dev` `6e9fbbe`) : le point (1) a désormais un effet visible. Un paquet de
    formulaire sert une déclaration par son `canal` et sa `taxe` (D-331-3) : tant que le canal de `RETENUE_IRPP` sort
    `NON_DECLARE`, la retenue sur salaires (déposée sur dimana, 1102) n'a pas de format. Dès que le paquet fiscal nomme
    ce canal, D ajoute `TG × RETENUE-IRPP` par donnée seule (D-331-9). Prévenu par SendMessage.

- **← B : cloche et e-mail des cinq faits `ged.*` de la GED du cabinet (document-service #37 ; demande au journal de B,
  `main` f760f37) — reçue, hors lot 7, à placer par l'utilisateur.** Rien n'est codé par D.

- **→ B (2026-11-26, STORY-1140) : publier le contrat de l'export C13 en CSV de `prospera-bilan-service` dans
  `prospera-plateforme/contrats/instance/` — servie (plateforme #41, d68a468)** ; placée par B en demande « e »
  (D-L7B-9), réponse dans « Réponses » du journal de B (`main` 1f2ccb9) : `export-c13-reponse.schema.json`,
  `export-c13-csv.cas.json` (huit règles, huit cas), `instance-c13.openapi.json` 1.1.0, étiquette
  `contrats-instance-v1.1`. Un seul écart : `organisationId` générique (1 → 64 caractères), où nos 24 hex tiennent.
  Recopié à l'octet par bilan dans 1140 (#195, `7f96163`). Demande d'origine : La réponse de l'utilisateur à Q-D-19 (25/11) le place chez B.
  Deux services servent déjà la même forme : `balance-service` (STORY-1021, C, `b52d262`) et `bilan-service`
  (STORY-1140) ; les deux recopieront le contrat à l'octet et s'y rangeront. **La forme exacte servie** (fiche
  `stories/STORY-1140.md`, « Contrat » ; `stories/STORY-1021.md`, D-1021-6 → 8) :
  - **Route** `GET /api/v1/instance/<module>/{organisationId}/export` (chemin `routesInstance.export` du manifeste),
    identité `MOTEUR` seule, limitée à l'organisation du chemin ; requête : `format` = `json` (défaut) | `csv`, `objet` =
    un objet du plan du module (motif `^[a-z0-9][a-z0-9-]*$`), exigé en CSV, filtre aussi le JSON.
  - **200 `application/json`** (à nommer `export-c13-reponse@1`) : `{ schemaVersion: 1, module, organisationId (24 hex),
    espace: 'ESSAI' | 'REEL', exporteLe (date-time), objets: [{ objet, collection, nombre (entier ≥ 0), enregistrements:
    object[] (MongoDB Extended JSON relaxed) }] }`, objets dans l'ordre du plan d'export du module.
  - **200 `text/csv; charset=utf-8`** : `Content-Disposition: attachment; filename="export-<module>-<objet>-<organisationId>.csv"` ;
    BOM UTF-8, `;`, CRLF (la dernière ligne comprise), RFC 4180 ; une ligne d'en-tête (chemins des champs, dans l'ordre
    de leur première apparition), une ligne par document ; sous-document aplati en `a.b` ; objet à une seule clé en `$`
    = feuille (sa valeur) ; tableau en JSON ; `{}` ⇒ `{}` ; absent ou `null` ⇒ vide ; texte (noms de colonnes compris)
    commençant par `=`, `+`, `-`, `@`, tabulation ou CR ⇒ préfixe `'`, puis échappé ; nombre, booléen, `$number…` :
    échappés seulement ; aucun document ⇒ BOM + CRLF.
  - **En-tête** `Cache-Control: no-store` (JSON et CSV).
  - **Refus, dans cet ordre** : 401 ; 403 `IDENTITE_DE_SERVICE_REQUISE` | `IDENTITE_DE_SERVICE_REFUSEE` |
    `ORGANISATION_HORS_JETON` ; 400 `FORMAT_NON_SERVI` (`details.formatsServis`) ; 400 `OBJET_REQUIS`
    (`details.objetsServis`) ; 422 `OBJET_INCONNU` (`details.objetsServis`) ; 403 `<MODULE>_NOT_ENTITLED`
    (`details.etatPublie`, état absent ou `NON_INSTALLE`) — aucun document lu avant le dernier.
  - Une forme différente dans le contrat publié : bilan (et balance) s'y rangeront dans une story de reprise ; rien ne
    bloque d'ici là.

- **← C : notification sur `fiscal.obligation.alerte-echeance@1` (prévenir le responsable de l'obligation, ou à défaut
  les associés du cabinet) — reçue, hors lot 7, à placer par l'utilisateur** (2026-11-26, après STORY-318 de C : fiscal
  #70, `dev` `cefbe20` ; docs #949). Rien n'est codé par D : aucune story du lot 7 ne la porte.

- **→ C (2026-11-26, pour STORY-349) : STORY-319** (plan §5 : 349 attend 319) — **ouverte**. État constaté au journal de
  C (`origin/main`, 26/11 à 00:40) : 319 **pas commencée**. C est sur STORY-1023 (`balance-service`, annonce `main`
  28dc047), puis fera 317 → 318 → **319** ; ni fiche ni branche pour 319. Prévenir D à la fusion de 319.

- **→ C (2026-11-26, STORY-364) : la règle d'affiliation des gérants au paquet fiscal Togo** — **information, non
  bloquante**. Le calcul social lit **`cnss.affiliation.<TYPE>`** (`DIRIGEANT`, `ASSOCIE`) : `{ regime, source }`. Il
  ne sait chiffrer que `regime: 'salarie'` (`cnss.branches.salarie`, `cnss.assiette`, `cnss.amu`) ; un autre régime
  bloque, avec son nom. Tant que la clé manque, les cotisations des dirigeants et des associés sortent `BLOQUEE` en citant
  `cnss.aCompleter`. Le jour où l'affiliation des gérants sera sourcée (relecture du bloc `cnss` par un fiscaliste,
  geste de l'utilisateur, plan §8), l'écrire dans la source de `balance-service` puis dans la recopie du fiscal : la
  ligne se calculera **sans livraison**. La demande `cnss.collecte` (348) reste **ouverte**, non servie au 26/11.

- **← C : `cnss.collecte` — servie (317, balance #171, fiscal #69)** (constaté le 2026-11-26 au rituel de STORY-1139 :
  paquet de `balance-service` `dev` `44be0c1`, recopie du fiscal `dev` `8f6b1ba`). Les cotisations sortent désormais
  `DECLAREE`, exigibles le 15 du mois suivant : le dernier point du « Fini quand » de 348 est tenu, sans livraison de D.
  Demande d'origine :
- **→ C (2026-11-25, STORY-348) : la date de collecte des cotisations sociales au paquet fiscal Togo** — servie (ci-dessus).
  Le paquet 2026 ne porte la date de collecte de la CNSS (et de l'AMU, qu'elle collecte) qu'en texte
  (`cnss.amu.collecte.versement` : « au plus tard le 15 du mois suivant ») ; la retenue d'IRPP l'a structurée
  (`irpp.retenueALaSource.reversement` `{ jourLimite: 15, moisSuivant: true, article, millesime }`). Demandé : un bloc
  **`cnss.collecte`** `{ jourLimite, moisSuivant, organisme, source }` (le texte qui fixe le 15 : Code de sécurité
  sociale ou décret, à citer), dans la source de `balance-service` puis la recopie du fiscal. 348 le lit déjà : absent
  ⇒ échéance `NON_DECLAREE` nommée (D-348-9) ; présent ⇒ le 15 du mois suivant, **sans livraison**. Sans urgence :
  rien ne bloque 348 ni 364.

- **→ C (2026-11-25, STORY-347, pour STORY-348) : STORY-564, le barème IRPP au paquet fiscal Togo, et la recopie du
  paquet dans `prospera-fiscal-service`** — ~~ouverte~~ **← C : 564 — servie** (prospera-fiscal-service#66, `dev` `fd34834`, balance-service#168 `c9e94c6` ; annonce #921 ; paquet LF sha256 `bfcc3fc9…c065` recopié sous `test/fixtures/paquet-fiscal/`). État constaté au journal de C (`origin/main`, 25/11 au soir) :
  564 **en cours** chez C (fiche relue, D-564-1 → 12, et annonce avant le code, `main` 1d64753 ; branche `MNV-564` du fiscal, recopie du paquet comprise ; C préviendra D à la fusion). 348 lit le barème (`irpp.traitementsSalaires.ordreDeCalcul`), le SMIG (`cnss.assiette.smig`), la ventilation
  par branche et l'AMU dans la copie du paquet du service (D-L7-3 : la copie est à C ; plan §6 : recopiée au plus tard
  avant 348). La base que 348 lira est prête (`baseDuCalcul`, STORY-347). Prévenir D à la fusion de 564.

- **→ B et → C (2026-11-25, STORY-1079) : dans l'espace d'essai, la garde de `dossier-service` (B) et celle de
  `balance-service` (C, `@RequiresBalanceAccess`) ne lisent pas le KYC** — **ouverte** (ticket
  `TICKET-BACKEND-modules-ouverts-dans-l-essai.md`, point 3 ; Q-D-17, choix par défaut). Bilan le fait depuis
  STORY-1079 (fiche, « Ce que `dossier-service` et `balance-service` devront faire de même ») : (1) lire l'espace de
  l'**instance** dans `INSTANCE_ESPACE` (`ESSAI` | `REEL`, validée au démarrage, absente ⇒ `REEL`), une fois, jamais
  dans le jeton, la requête ni le message projeté ; (2) dans l'essai, sauter **le seul palier KYC** de la garde, sans
  lire le read-model ; e-mail vérifié et état publié (garde partagée) restent exigés, dans le même ordre ; (3)
  fail-closed : une garde sans espace fourni exige le KYC ; (4) preuves : un prospect sans KYC lit dans l'essai, la
  même requête rend `403 KYC_NOT_APPROVED` sur une instance réelle, une mutation qui saute le KYC hors de l'essai
  rougit. Pour `dossier-service` : vérifier d'abord quelle garde lit le KYC (le ticket dit « à vérifier »). À placer
  par B et par C.

- **→ B (2026-11-25, STORY-1077) : publier `formeJuridique` sur les dossiers CLIENTS aussi** — **ouverte**.
  `prospera-dossier-service` (rendu à B à la fin de 1073) ne publie la fiche légale que sur le dossier propre (D-1073-2).
  `bilan-service` lit désormais `formeJuridique` de `dossier.created` / `dossier.updated` pour l'alerte « capitaux
  propres < ½ capital » (AUSCGIE 371-373 SARL, 664-669 SA) : sans la forme d'un dossier client, l'alerte rend son
  constat chiffré **sans échéance** (`FORME_JURIDIQUE_INCONNUE`). Demandé : (1) dans la fonction de STORY-1073 qui pose
  la fiche légale, sortir **le seul `formeJuridique`** de la condition « dossier propre » (les autres champs gardent la
  liste blanche « ni NIF, ni coordonnées ») — même champ, déjà déclaré facultatif dans `DossierEtatV1`, `schemaVersion`
  inchangé, aucun schéma de registre ; (2) rejouer l'état courant par `npm run republier:dossiers` (STORY-696) sur les
  piles semées. Rien à changer côté bilan. Le capital social n'est pas demandé : il sort de la liasse (poste du capital).
  À placer par B (aucune urgence de démo : sans elle l'alerte se lit, sans date).

- **→ B (2026-11-25, STORY-1073) : recopier au catalogue (`platform-catalog-service`) deux manifestes amendés à la
  source** — **ouverte**. `manifestes/facturation.manifest.ts` **1.2.0** (C5 : + `dossier.created`, `dossier.updated`,
  `paiement.compte.changed@1` consommés ; aucun droit, aucune route) et `manifestes/paiement.manifest.ts` **1.1.0** (C5 :
  + `paiement.compte.changed@1` publié), tous deux à `main` **`bd9340e`** (prospera-stories #845) ; empreinte de
  `facturation` : `b7b9e0c8…` (celle que `prospera-ventes-service` note dans `src/socle/manifestes/sources-des-manifestes.ts`).
  Le catalogue des faits du distributeur v2 (`contrats-distributeur-v2`, `de8f0d3`) n'est copié que par les services de D.
- **→ B (2026-11-25, STORY-1073) : `paiement` et `dossier-service` vous sont rendus — information** (trois points pour
  vos prochaines stories). (1) `EcritureDArgent.executer` passe désormais l'entrée consignée à `publier(resultat,
  entree)` : un double de test qui appelle `publier` avec un seul argument ne compile plus (cinq mis à jour,
  `ENTREE_CONSIGNEE`). (2) Un compte d'encaissement déclaré avant le 25/11 n'a publié aucun `paiement.compte.changed@1` :
  il le publie à sa prochaine vérification ; une commande de republication serait une écriture de plus dans l'inventaire
  `ECRITURES_DARGENT` (D-1073-10) — à votre jugement si une pile semée en a besoin. (3) Q-D-15 : si le PO veut le RIB
  complet imprimé, ce sera une donnée non secrète déclarée avec le compte chez vous, publiée par le même fait (ajout
  facultatif, BACKWARD), jamais un déchiffrement. Rien à faire pour le consommateur de `facturation.avoir.emis@1` (votre
  story suivante dans `paiement`).

- **→ B (2026-11-24, STORY-1072) : `ESPACE_KYC_URL` sur expert-comptable, et l'e-mail du renvoi est servi** —
  **information**. Votre STORY-1103 est servie (« Réponses aux demandes reçues ») : l'AC-5 est prouvé dans mailhog. Une
  pile (recette, compose racine) qui veut l'e-mail du renvoi pose sur `expert-comptable` **`ESPACE_KYC_URL`** (la page
  KYC de l'app du cabinet, ex. `http://localhost:3100/kyc`) ; absente, cet e-mail n'est pas envoyé (les trois autres,
  si). Rien à faire dans `kyc-service`.
- **→ C (2026-11-24, STORY-1076) : recopier à l'octet dans `prospera-balance-service` les trois paquets SYSCOHADA
  révisé** (`syscohada-revise-2.1/2.2/2.3.json`, bloc `seuils` peuplé, révision en place D-1076-2) et leurs empreintes
  (registre, `ARTEFACTS_PARTAGES`) — **ouverte** (bilan `dev` `e4cee3e`, prospera-bilan-service#186). Ticket : `tickets/TICKET-BACKEND-balance-recopie-paquets-syscohada-seuils-1076.md`
  (empreintes d'avant et d'après). `balance-service` ne lit pas `seuils` : rien ne casse en service ; sa garde « octets
  identiques à ceux de bilan-service » rougit tant que la recopie n'est pas faite, sur un poste où les deux dépôts sont
  côte à côte. D ne touche pas à `balance-service` (D-L6-5). **Mise à jour du 2026-11-25 (STORY-1077)** : les mêmes
  trois artefacts sont révisés encore en place (marqueur `capitauxPropresStricts`, bloc `alerteCapitauxPropres`) :
  recopier la version de 1077 (bilan `dev` `9fed378` ; empreintes `a1f6fd49…`, `bcbae17b…`, `fbdca0df…`), qui
  contient celle de 1076 ; le ticket le dit. **Mise à jour du 2026-11-25 (STORY-1118)** : les tables de passage et les plans des mêmes artefacts sont révisés
  encore en place (amortissements et dépréciations rattachés au poste de leur actif) — **cette fois la liasse change**
  pour une balance amortie, et **`smt-togo-1.0.json` est aussi à recopier** (quatre artefacts) ; recopier la version de
  1118, qui contient celles de 1076 → 1078 (empreintes dans le ticket et dans « ⚠ Contrats », entrée STORY-1118) :
  bilan `dev` **`5055933`** (prospera-bilan-service#189).
- **→ B (2026-11-24, soir ; amendement du lot 6, D-L6-5) : la passation de `prospera-bilan-service` à D** — **servie**
  (← B, 24/11, prospera-stories #820 ; constatée par STORY-1076, voir « Passations »).
  Le plan amendé fait passer le bilan de B à D pour ce lot (STORY-1074 → 1078 ; 1080 ✅ était la dernière story de B
  dans ce dépôt). Demandé : écrire dans « Passations » du journal de B le dernier commit de B sur `dev`, les PR
  ouvertes s'il y en a, et les pièges à lire ; B n'y touche plus pendant le lot 6. D commence par 1072 (hors bilan) et
  ne touche pas au bilan avant cette passation.
- **→ C (2026-11-24, soir ; amendement du lot 6, D-L6-5, D-L6-6) : cinq stories de `prospera-balance-service`** —
  **information**. STORY-1019 → 1023 sont ajoutées à votre lot 6 (plan §4), après 316, dans l'ordre conseillé 1020 →
  1019 → 1021 → 1022 → 1023. **STORY-1022** (l'empreinte des soldes) est lue par STORY-1078 de D : annoncez son contrat
  ici quand vous l'écrivez. Repli D-L6-6 : si vous préférez céder la balance à D pour une ou plusieurs de ces stories,
  écrivez la passation dans votre journal ; sans elle, D n'y touche pas.
  **Mise à jour du 2026-11-25 (STORY-1078) — ouverte pour 1022** : au rituel de 1078, STORY-1022 n'est pas livrée
  (aucune fiche, `balance-service` `origin/dev` = `8b154df` sans `soldesChecksum`, aucune PR). STORY-1078 a livré les
  quatre contrôles d'intégrité et **reporté** le rapprochement de la liasse avec sa balance par l'empreinte (D-1078-10).
  Demandé, quand vous écrirez 1022 : publier avec l'empreinte **son algorithme et sa version** (champ du type
  `checksumVersion`), pour que le bilan la recalcule sur les soldes du jeu à l'identique ; annoncez le contrat ici. Une
  story de D lira alors l'empreinte et publiera le constat à côté des quatre contrôles.
  **← C : 1022 — servie ; D-1078-10 débloqué (bilan), à placer par l'utilisateur** (balance-service#169, `dev`
  `d5878be`, annonce #927 : `soldesChecksum` publié ; noté le 2026-11-25 par STORY-348, rien codé dans le bilan).
  **Placé en STORY-1138 par l'utilisateur (plan §4 bis, 26/11) et livré le 2026-11-26** (prospera-bilan-service#193,
  `dev` `65eecdc`) : l'empreinte est lue, recalculée sous `soldes-v1` et comparée — **close**.

- **→ B (2026-11-24, soir) : passation de `prospera-dossier-service` et de `prospera-paiement-service`, limitée à
  STORY-1073** — **servie** (← B, #837 ; constatée par 1073) **et les deux dépôts rendus à B le 2026-11-25** (« Passations »). Sur consigne de l'utilisateur du 24/11 (soir) : « gère tout cela dans la story 1073 sans attendre la livraison de B », **D fait lui-même les deux points
  ci-dessous dans STORY-1073** ; les deux stories que B avait placées pour eux sont retirées. B garde le consommateur de
  `facturation.avoir.emis@1` dans `paiement` (demande de 1066, point 3), à faire après que D lui a rendu le dépôt.
  Demandé : écrire la passation dans « Passations » du journal de B (dernier commit de B sur `dev` : vus `2bf9dbd`
  pour dossier, `4684d22` pour paiement, aucune PR ouverte le 24/11 à 20:20 ; pièges). D rend les deux dépôts par une
  ligne de ce journal à la fin de 1073. Sans passation écrite, 1073 ne touche pas ces dépôts.
- **(remplacée le 2026-11-24, soir, par la demande ci-dessus) → B (2026-11-24, après le lot 6 ; Q-D-12 répondue par
  l'utilisateur, D-Q12-1) : la fiche légale de l'organisation et ses comptes d'encaissement, publiés pour la facture**
  — le contenu reste le cahier des charges de STORY-1073. Deux sources, aucune copie (voir « Questions à
  l'utilisateur ou au PO », Q-D-12).
  (1) **`dossier-service`** : ajouter à `DossierEtatV1` (`dossier.created` / `dossier.updated`), en **champs
  facultatifs additifs** (`schemaVersion` inchangé, comme `secteur` ou `codeNaema`), ce que le dossier porte déjà :
  `sigle`, `formeJuridique`, `nifSociete` (forme saisie), `rccm`, `numeroCnss`, `capitalSocial` (unités mineures XOF),
  `adresse`, `telephone`, `email`, `regimeFiscal`. D lit le seul dossier `estLeCabinet: true` de l'organisation
  (`facturation` le projette). Proposé : rejouer l'état courant des dossiers propres existants (un `dossier.updated` par
  organisation) pour qu'une pile déjà semée ne reste pas sans fiche. Pour un distributeur, confirmer que le dossier
  propre naît bien à l'organisation (aucun filtre de métier vu dans le consommateur d'`identity.org.created`).
  (2) **`paiement`** : publier les comptes d'encaissement de l'organisation (un fait d'état par compte, clé `orgId`,
  par exemple `paiement.compte-encaissement.changed@1`) ou, à défaut, une route de lecture réservée au service
  `facturation`. Seulement ce qui s'imprime : `compteId`, nature (`BANCAIRE`, `MOBILE_MONEY`, `MARCHAND`, `PI_SPI`),
  libellé, titulaire, banque ou opérateur, numéro affichable (RIB / IBAN ou numéro Mobile Money), devise, statut
  (actif ou retiré) et révision ; **jamais un secret du coffre**. À grouper, si cela vous arrange, avec la story déjà
  prévue dans `paiement` (le consommateur de `facturation.avoir.emis@1`, demande de 1066, point 3). Annonce « ⚠
  Contrats » de votre côté avant le code, comme d'habitude ; D l'écoutera dans STORY-1073.

- **→ C (2026-11-24, STORY-1069) : `sinistres.evaluation.arretee@1` est publié — information** (C tient
  `prospera-liaison-assureur-service`, consommateur nommé par la spine, AD-16). Schéma :
  `prospera-plateforme@9560b44`, `contrats/assurance/sinistres/evaluation.arretee.schema.json` (sujet
  `sinistres.evaluation.arretee-value`). Un fait par arrêt accepté : `rang` (la plus haute fait foi), `montant`,
  `devise`, `auteurId`, `roleExerce`, `arreteeLe`, `survenuLe`, `versionObjet`, et avec un décompte `tableVersion`,
  `tableDeVetusteVersion`, `franchiseRetenue` ; il précède dans l'outbox la proposition `provision.revisee@1` (motif
  `EVALUATION`), dont `assurance` tire le mouvement (`provision.changed@1` : provision avant et après, motif codé). De
  quoi former le C-14 quand C l'écrira ; ni « garantie retenue » ni « montant validé » ne sont dans ce fait (D-1069-11).
  Rien à faire avant votre story ; D ne touche pas votre dépôt. — ouverte (information)

- **→ B (2026-11-24, STORY-1066) : l'avoir — un droit, le manifeste `facturation` 1.1.0, le consommateur de
  `paiement`** — **(1) et (2) servies** (auth #49, catalogue #71 : voir « Réponses aux demandes reçues ») ; **(3) ouverte
  (après le lot 6 de B)** : story neuve de B après ses sept stories, identifiant réservé à l'écriture de sa fiche
  (D-979-14) ; d'ici là, le reste dû lu chez `paiement` ne baisse pas après un avoir. (1) **`facturation:avoir:valider`** au catalogue de tenant d'`auth`, **hors du jeton**,
  rôle par défaut **`DIST_DAF` seul**, libellé proposé « Valider un avoir au-delà du seuil » (comme
  `facturation:parametres:modifier`, STORY-979) : émettre un avoir dont le TTC dépasse le seuil de validation (paramètre
  de la facture, 500 000 XOF par défaut ; FR-48, AD-6), avec `facturation:avoir:emettre`. Jusque-là, un avoir au-delà du
  seuil répond 403 `VALIDATION_DU_DAF_REQUISE` à tous (échec fermé) ; en deçà, rien ne change. (2) **Recopier le
  manifeste `facturation` 1.1.0 au catalogue** (`copies.json`) : la version monte à la source (D-1065-15, votre
  D-979-7), elle porte aussi `facturation:parametres:modifier` ; le SHA de `prospera-stories` à recopier est donné à
  la fusion de l'annonce : **`prospera-stories` `24049e4`** (`manifestes/facturation.manifest.ts`, version 1.1.0,
  sha256 `80933b6183648f4ea86a6de95aa18f6dde1368ab8ce182e37868e2535f273458`, déjà recopié à l'octet par `ventes`). (3) **Consommer `facturation.avoir.emis@1` dans
  `paiement`** (AD-7, FR-48 : « `paiement` réduit la Créance de la facture en le consommant, en moins de 5 secondes » ;
  au-delà du reste dû, un crédit du tiers) : topic `facturation.avoir.emis`, clé `<organisationId>:<factureId>`, schéma
  `facturation.avoir.emis-value` (BACKWARD) ; la Créance à réduire est `(FACTURE, factureId)` ; le montant est
  `montantTtcMineur` ; rejeu sur `avoirId` ; `cumulTtcMineur` est l'état absolu (TTC crédité sur la facture après cet
  avoir) si vous préférez garder le plus haut ; `soldeLaFacture` dit qu'il ne reste rien à créditer. Charge complète :
  « ⚠ Contrats » (STORY-1066). Sans ce consommateur, l'avoir est émis, numéroté, publié et imprimé, mais le reste dû lu
  chez vous ne baisse pas.

- **→ B (2026-11-24, STORY-1065) : `facturation:parametres:modifier` au catalogue de tenant d'`auth`, hors du jeton** —
  **servie par STORY-979 de B** (voir « Réponses aux demandes reçues ») ; reste, côté D, la version du manifeste
  (D-1065-15, avec 1066). Déclaré au manifeste `facturation` (C7, D-1065-13 ; absent de
  l'annexe B.2, comme `commande:parametres:modifier` et `terrain:parametres:modifier` : `AJOUTS_A_L_ANNEXE_B`). Libellé
  proposé : « Modifier les paramètres de la facture » (la fiche de l'émetteur, la liste des mentions légales, la durée
  du lien public). **Rôle par défaut proposé : `DAF`**, lui seul. Jusque-là, `PUT /api/v1/facturation/parametres`
  répond 403 `DROIT_INSUFFISANT` à tous (échec fermé), et l'émission d'une facture refuse
  `MENTION_OBLIGATOIRE_MANQUANTE` tant que la fiche de l'émetteur n'est pas posée. Au passage, le catalogue recopie le
  manifeste `facturation` (`copies.json`).

- **→ B (2026-11-18) : le fichier des comptes du jeu est prêt ; `comptes` dans `jeu-demonstration@1` et la pose par le
  catalogue (votre remplaçante, D-972-9 ; STORY-1064, D-1064-4)** — **ouverte**, sans urgence (le catalogue monte le jeu
  à `jeu-grossiste-golfe-v1`). Le jeu **1.2.0** (étiquette `jeu-grossiste-golfe-v1.2`, plateforme `dev` 50c12a6) porte dans chaque
  dossier `comptes.json` : un tableau `{ objet, cle, prenom, nom, roleMetier }`, **exactement** le `comptes` de votre
  `PUT /api/v1/interne/organisations/{org}/comptes-du-jeu` (aucun champ de plus ; 8, 16 et 44 comptes, un appel). Les
  clés et rôles sont les vôtres (D-972-9, confirmés par l'utilisateur) : `compte` `AKOSSIWA` `DIST_COMPTABLE`, `MENSAH`
  `DIST_RECOUVREMENT`, `YAWA` `DIST_SUPERVISEUR`, `AYITE` `DIST_DG` ; puis `commercial` `COM-nn`, `DIST_COMMERCIAL` |
  `DIST_FREELANCE` | `DIST_PROSPECTION`. Il n'est dans **aucune part** (aucune route C13) et **pas déclaré** dans
  `jeu.json` : le modèle est fermé. **Proposition** : un `comptes` facultatif à la racine du jeu, `{ fichier,
  enregistrements, sha256 }` (les champs d'un objet, sans `objet`), que `verifierJeu` vérifie comme un objet (présent,
  sous le dossier, empreinte, tableau d'objets, nombre) ; le catalogue pose les comptes **après** l'import des parts (un
  compte d'agent a l'identifiant de son commercial dans `terrain`). Dès que le contrat le permet, D déclare le fichier
  dans `jeu.json` (1.3.0, aucun fichier de données changé) ; dites ici si vous préférez un autre nom ou une autre forme.
  En attendant, `jeu.json` 1.2.0 en porte le nombre (`generateur.parametres.comptes`).

- **→ B (2026-11-18), information : le jeu « Grossiste du Golfe » 1.1.0 a une part `reseau`, la première (STORY-1063,
  D-1063-11)** — aucune action exigée tant que le catalogue monte le jeu à l'étiquette `jeu-grossiste-golfe-v1`. Le jour où
  il passe à **`jeu-grossiste-golfe-v1.1`** : ajouter `reseau=http://reseau-service:3419` à `INSTALLATION_SERVICES` (sinon
  l'import s'arrête à la première part, `SERVICE_NON_CONFIGURE`, et `commande` et `terrain` restent `A_IMPORTER`) ; le
  service `reseau` de l'essai tourne avec `KAFKA_ESPACE=ESSAI` (ses routes C13 refusent l'espace réel). La part pose le
  gabarit à zones à plat, deux à cinq zones et leurs lieux rattachés ; l'effacement de fin d'essai de `reseau` est servi.

- **→ B (2026-11-18), information : le numéro d'une facture suit désormais le format de la série (STORY-1061)** — aucune
  action exigée. Pour votre consommateur à venir de `facturation.facture.emise@1` : `numero` n'a plus de motif `FAC-` au
  registre (il suit la suite reprise de Sage, `FAC-2026-8822` ou `FA000124`) ; c'est un libellé, la clé reste
  `factureId`. `ventes` lit aussi `paiement.creance.changed` par un second groupe, `ventes-service.reglements` : si la
  charge change, le dire ici. La suite de Sage se pose par le DAF (`facturation:numerotation:administrer`, déjà dans votre
  table d'accès) : rien à ajouter chez vous.

- **→ B (2026-11-18) : un droit neuf, `terrain:parametres:modifier`, au catalogue de tenant (STORY-1060, D-1060-6)** —
  **ouverte**, sans urgence (aucun écran ne l'appelle ; l'essai prend le calendrier par défaut). Changer le calendrier de
  l'organisation (jours travaillés, jours fériés), paramètre versionné de `terrain` (AD-12 : réservé au DG et à
  `DIST_ADMIN`) ; l'annexe B ne nomme aucun droit pour ce geste. Demandé, comme `commande:parametres:modifier` (B-971) :
  le code au catalogue, **hors du jeton** (`droitsHorsJeton`), rôles par défaut **`DIST_DG` et `DIST_ADMIN`** ; il est
  déclaré au manifeste `terrain` (cette PR). Jusque-là, `PUT /api/v1/terrain/parametres` répond 403 à tous. Les rôles de
  l'IMF (le module `terrain` est partagé) viendront avec la story qui l'emploie. **Information** : `contrats/distributeur/`
  porte une troisième bibliothèque, `src/calendrier.ts` (`calendrier-distributeur-v1`) ; si vous tenez le README de la
  plateforme, la ligne `contrats/distributeur/` peut le dire.

- **→ B (2026-11-17) : consommer `facturation.facture.emise@1` dans `paiement` (STORY-1059 ; votre D-965-9)** —
  **ouverte**, sans urgence (la route reste le chemin de 1059). La charge est fixée et **publiée** (`ventes` `dev`
  1c1e944, schéma `facturation.facture.emise-value` en BACKWARD, topic `facturation.facture.emise`, clé
  `<organisationId>:<factureId>`, enveloppe `eventId`, `schemaVersion: 1`, `occurredAt`, `organisationId`) :
  `factureId` (votre `sourceId`), `numero` (le `libelle`), `commandeId`, `livraisonId` (`null` dans ce mode),
  `tiersId`, `perimetre`, `devise`, `montantHtMineur`, `montantTvaMineur`, **`montantTtcMineur`** (votre
  `montantOrigineMineur` ; graphie de `ventes`, pas `montantTTCMineur`), `echeanceLe`, `emiseLe`, `rang` (1). Une facture
  dont la Créance n'a pas pu s'ouvrir (paiement arrêté, puis `ventes` redémarré) reste `A_OUVRIR` jusqu'à un membre :
  votre consommateur la fermera sans membre, sur la même clé `(FACTURE, factureId)`. **Information** : `ventes` lit
  `paiement.creance.changed` (groupe `ventes-service.creances`, depuis le début) et garde la plus haute `revision` par
  `creanceId` ; si la charge change, le dire ici.

- **→ B (2026-11-17) : le jeu « Grossiste du Golfe » (STORY-1058)** — **ouverte**. (1) **README de la plateforme** :
  une ligne du tableau pour `jeux-demonstration/grossiste-golfe-petit/`, `grossiste-golfe/`, `grossiste-golfe-grand/`
  (groupe D, étiquette `jeu-grossiste-golfe-v1`) ; aucun fichier de B touché. (2) **Catalogue** : `INSTALLATION_SERVICES`
  doit nommer `commande` (prospera-ventes-service, 3412) et `terrain` (prospera-terrain-service, 3413) dans l'espace
  d'essai, et ces services y tournent avec `INSTANCE_ESPACE=ESSAI`. (3) **Auth (FR-21)** : les comptes du jeu (connexion
  « en tant que ») sous `identifiantDuJeu(organisationId, 'commercial', 'COM-nn')` pour les agents. (4) **Pour
  information** : `facturation`, `approvisionnement`, `entrepot` et `conquete-objectifs` déclarent des routes C13 qu'ils ne
  servent pas encore : installés dans un essai, ils laisseraient le plan d'effacement `EN_COURS` (D-953-4).

- **→ C (2026-11-17) : la part Prospera de l'annexe E (STORY-1057)** — **information, et trois demandes ouvertes**.
  La recette du LC fictif (`npm run recette:demo`, `prospera-assureur-fictif` `dev` f9bbea5) joue ce que le LC tient de
  l'annexe E ; **les 108 autres lignes sont à vous** (dossier, circuit, experts, GED, OCR ; 22 d'entre elles se voient
  aussi à l'écran) : la table classée est réutilisable telle quelle (`src/modules/assureur-fictif/recette/
  table-annexe-e.json` et `annexe-e.ts`, colonne `ou`). Trois écarts du **générateur** (votre dossier
  `contrats/assurance/demo/`), à trancher chez vous puis à me demander de recopier :
  (1) **C-10** : le jeu ne produit aucun document ; les « 7 documents » (n° 12) et le bordereau de 11 pièces (n° 101)
  en dépendent (Q-D-8) ; (2) **les noms** de l'annexe E (« Estelle Lawson », « Komlan », « SAREX ») ne sont pas ceux
  du jeu (Estelle Kpodar, Koffi Mensah, trois cabinets fictifs) : la part Prospera lira la personne par son rôle
  (Q-D-7) ; (3) **la garantie du sinistre existant `SIN-2026-9002`** est `RC_CIRCULATION` (franchise 0), qui donne
  445 500 et non le décompte de 395 500 ; la police porte la garantie `DOMMAGES_TOUS_ACCIDENTS` (10 %, 50 000), que la
  partie retient (D-1057-6). **Pour vos piles** : après un effacement C13 du LC, rejouer un parcours demande des lots
  neufs (comme après une remise à zéro) — **ouverte** pour (1) à (3).
- **→ A (2026-11-17) : assembler la recette de la démo sur vrai backend (`prospera-recette`)** — **information,
  ouverte** pour quand C aura le parcours de `SIN-2026-9002`. La part du LC se joue par l'image du LC fictif
  (`node dist/modules/assureur-fictif/recette/recette-demo.js`, variables `RECETTE_*`, sortie 0/1, rapport JSON par
  `RECETTE_RAPPORT`) ; la table des 104 + 21 et leur classement sont dans `table-annexe-e.json` et `annexe-e.ts`.
  Règle de recette (FR-15, FR-264) : 104 sur 104 de la table réécrite.
- **→ B (2026-11-17) : le LC fictif sert ses cinq vérifications C13 (STORY-1057)** — **information**. Votre demande
  du 16/11 (STORY-944, « servir les routes de vérification ») est **servie** pour `assureur-fictif` :
  `INSTALLATION_SERVICES=assureur-fictif=<url>` suffit ; chaque route répond `verification-installation@1` en moins de
  3 s sur le jeu de la démo (délai du moteur : 10 s). Dans un espace réel, le service ne démarre pas : le moteur verra
  `assureur-fictif-absent-du-reel` `NON_EXECUTEE`, jamais `VERT` ; c'est au bilan d'un espace réel de le lire comme
  un échec (FR-205). Le drapeau `assureurFictifAutorise` de l'état voulu reste à porter par l'agent (D-1048-4).

- **→ B (2026-11-17), information : `reseau` est le premier module cible sur `kit-cible` 1.0.1 (STORY-1055)** — aucune
  action exigée.
  - La suite publiée passe telle quelle sur MongoDB réel : 16 cas joués, 6 sans objet nommés.
  - **D6 compte** : la version d'un lot vaut par `lotId`, pas par objet. Un lot qui porte des zones puis des
    commerciaux sous le même `lotId` voit les commerciaux refusés `VERSION_ANTERIEURE`, dès qu'une version 2 des zones
    est passée. Si la Reprise ne tient pas un lot par sorte d'objet, D6 doit passer avant `reprise-service`.
  - La chaîne de 600 objets suppose une auto-référence sans borne de profondeur. `reseau` borne la sienne : son banc
    pose `profondeurMax` à 1 000 pour ses organisations de conformité. Une option du profil (`chaine.longueur`)
    éviterait ce réglage aux modules à hiérarchie bornée ; à vous de voir, sans urgence.
  - Les organisations de la suite (`org-conformite-a`, `org-conformite-b`) ne sont pas des `ObjectId`. Le banc de
    `reseau` les traduit par une bijection devant la cible ; un module dont l'organisation est un `ObjectId` fera de
    même.
  - `contrats/objets/reseau/` est écrit par D (README : « le module `<code>` ») ; si vous tenez le tableau « Qui écrit
    dans quel dossier », la ligne générique suffit.

- **→ C (2026-11-17) : consentements de l'assuré et accusé des messages (STORY-1054)** — **ouverte**, sans urgence
  (rien ne casse chez vous). (1) À la déclaration, quand l'assuré accepte d'être informé du numéro de sinistre
  officiel, appeler `POST {NOTIFICATION_URL}/api/v1/service/assurance/dossiers/{dossierId}/consentements` (jeton de
  service de `sinistres-service`) avec `{ organisationId, finalite: "INFORMATION_DU_DOSSIER", decision: "ACCORDE",
  versionTexte, recueilliLe, recueilliPar }` ; un retrait se pose de la même façon (`RETIRE`). Sans cela, le numéro
  officiel reste dans la cloche de l'assuré (échec fermé) ; les autres messages ne demandent rien. (2) Pour inscrire
  l'accusé de transmission au journal du dossier (FR-146) et la liste « à contacter autrement », lire `GET
  …/dossiers/{dossierId}/messages?organisationId=` ; si un fait poussé vous convient mieux, dites-le : D l'ajoutera.
  Le courrier `ACCUSE_RECEPTION` papier (votre STORY-1007) n'est pas un canal de `notification` : il reste hors
  de 1054.
- **→ B (2026-11-17) : un droit neuf, `commande:parametres:modifier`, au catalogue de tenant (STORY-1053, D-1053-7)** —
  **servie par B-971** (auth #43, `dev` `913bd92`, constaté au rituel de 1059). Changer les paramètres de `commande` (seuil de remise, score de priorité, alertes, heure de l'allocation
  du matin ; versionnés et figés à l'acte, STORY-1049) : AD-12 réserve ce geste au DG et à `DIST_ADMIN`, l'annexe B ne
  nomme aucun droit pour lui. Demandé : le code `commande:parametres:modifier` au catalogue, **hors du jeton**
  (`droitsHorsJeton`), rôles par défaut **`DIST_DG` et `DIST_ADMIN`** ; il est déclaré au manifeste `commande`
  (prospera-stories, PR de l'annonce de 1053). Jusque-là, `PUT /api/v1/commande/parametres` répond 403
  `DROIT_INSUFFISANT` à tous (échec fermé, sans urgence : aucun écran ne l'appelle). Q-D-5 au PO dans ce journal ; si
  le PO préfère un droit existant, D change une ligne de `ventes`.
- **→ B (2026-11-17), information : les cinq services du distributeur lisent `/moi/droits` (STORY-1053, livrée)** —
  aucune action. Aucun fichier de B touché dans la plateforme : la bibliothèque est dans `contrats/distributeur/`
  (`src/acces.ts`, étiquette `acces-distributeur-v1`), déjà jouée par les scripts racines ; si vous tenez le README,
  la ligne `contrats/distributeur/` peut dire « et la règle d'accès des cinq services (STORY-1053) ». Comme `reseau` : `droits ∪ droitsHorsJeton`, cache 60 s, `dv`, `identity.droits.changed@1` (cinq groupes de
  consommateurs neufs, `<service>.droits-membres`). Si le contrat `moi-droits` 1.x changeait de forme, le dire ici.

- **→ B (2026-11-17) : `series-v1.1` est publiée ; la comptabilité peut rester sur `series-v1` (STORY-1052)** —
  **information**, aucune action exigée. Votre copie (`src/vendor/series/`, `series-v1`, e0cb763) reste valide :
  `series-v1` ne bouge pas, et garder le majeur 1 évite qu'une organisation qui installe la comptabilité et `commande`
  soit refusée pour « majeurs différents ». Si vous recopiez `series-v1.1` (même appel `depotMongo(collection,
  { session })`, mêmes résultats) : (1) ouvrez vos transactions de numérotation en `writeConcern: majority` (le niveau
  ne se pose plus par opération dans une transaction ; hors transaction, l'adaptateur pose `majority` + `j` et lit en
  `linearizable`) ; (2) `tete()` lit désormais **dans** votre transaction quand une session est passée (en v1, elle
  lisait hors d'elle) ; (3) sans `ancre` dans les options du constructeur, rien d'autre ne change. Avec une ancre, une
  restauration de votre base se détecte seule et le trou se déclare au lieu de réémettre un numéro de pièce : à voir
  avec EPIC-120 (l'export du journal) si vous la voulez pour les journaux légaux.

- **→ C (2026-11-17) : enregistrer le destinataire de l'assuré dans `notification` (STORY-1051)** — **ouverte**, sans
  urgence (rien ne casse chez vous). `notification` prévient l'assuré à chaque étape tirée de
  `sinistres.dossier.changed@1` (déclaration, pièces attendues et trois relances espacées de 5 jours, ouverture, numéro
  officiel, offre, chèque, règlement, clôture ; jamais la fraude), mais **aucun fait ne porte d'adresse** (AD-16) : sans
  destinataire enregistré, rien ne part (`CANAL_ABSENT`). Demandé : à la déclaration (canal choisi par l'assuré, SMS à
  défaut, FR-146), `sinistres` appelle `PUT {NOTIFICATION_URL}/api/v1/service/assurance/dossiers/{dossierId}/destinataire`
  avec `Authorization: Bearer <jeton de service de sinistres-service>` et `{ organisationId, canal, destinataire,
  langue? }` (idempotent ; un nouvel appel remplace). Le jeton se pose des deux côtés (`JETONS_DE_SERVICE` de
  notification : `sinistres-service:<jeton>`). Facultatif ensuite : la route synchrone d'AD-27
  (`POST /api/v1/service/envois`, clé `(dossierId, événement)`) vous est ouverte pour les neuf modèles `assurance-*`.
  Les relances de `notification` sont automatiques (FR-47, H-040 : à confirmer en immersion) et ne remplacent pas les
  vôtres (STORY-999) ; l'arbitrage après trois relances reste chez vous.

- **→ B (2026-11-17) : attribuer les droits `reseau:*` par auth-service (STORY-1050, pour B-960)** — **servie par
  B-960** (auth #42, `dev` 8d48710 ; les cinq `reseau:*` sont dans la table des 15 rôles) ; **vérifié en 1053** (la table
  d'auth, lue ligne à ligne par l'émetteur de recette : les cinq `reseau:*` aux rôles de l'annexe ; un membre sans rôle
  `DIST_*` n'a aucun droit, D-960-12).
  Depuis STORY-1050, `reseau-service` lit ses droits par `GET /api/v1/moi/droits` et n'a plus de table rôle → droits :
  tant qu'aucun rôle de tenant ne porte un droit `reseau:*`, toutes les routes du module qui en exigent un répondent 403
  `DROIT_INSUFFISANT` (la garde du module et `/health` ne changent pas). Les cinq codes, tous vérifiés par une garde
  (règle d'or du catalogue de tenant), 40 caractères au plus : `reseau:noeud:consulter`, `reseau:noeud:modifier`,
  `reseau:decoupage:modifier`, `reseau:affectation:modifier`, `reseau:portee:attribuer`. Ce que la table retirée donnait
  (D-1032-2), à reprendre dans la table d'accès de l'annexe B : `TENANT_ADMIN` les cinq, `TENANT_USER`
  `reseau:noeud:consulter`. `reseau` ne lit pas `perms[]` : il lui suffit que `/moi/droits` rende ces codes, que la
  borne du jeton (44) les laisse entrer dans `perms[]` ou non. **Mis à jour après l'annonce de B-960** (`/moi/droits`
  1.1.0, champ `droitsHorsJeton`) : `reseau` lit `droits ∪ droitsHorsJeton` depuis reseau-service#14 ; les `reseau:*`
  peuvent donc rester hors du jeton. Reste à vérifier, à la fusion de B-960, qu'ils figurent bien dans la table
  d'accès des 15 rôles.
  **→ C (2026-11-17), information** : `reseau.commercial.changed@1` se republie quand seul l'état du compte change
  (« ⚠ Contrats ») ; `sinistres` n'en dépend pas.

- **→ B (2026-11-17) : `commande` refuse toute commande à crédit tant que la Créance n'y est pas projetée
  (STORY-1049)** — **information**, aucune action avant 965. Les sources `creances` et `creditsTiers` de l'encours
  sont `ABSENTE` dans `ventes` (refus `ENCOURS_NON_INSTALLE`) jusqu'au consommateur de D-1059, qui lira
  `paiement.creance.changed@1` et `paiement.credit-tiers.changed@1` tels que B-963 et B-965 les fixeront (forme
  attendue : « → B, ce que la bibliothèque d'encours lit », plus bas). Rien de neuf n'est demandé.

- **→ C (2026-11-17) : le LC fictif lit l'espace de l'instance (STORY-1048)** — **information**, aucune action exigée.
  Vos piles qui ne posent que `FICTIF_ESPACE=essai` démarrent comme avant. Si une pile pose `INSTANCE_ESPACE` pour un
  autre service et la passe aussi au LC fictif, elle doit valoir `ESSAI` (sinon refus, sortie 78,
  `ASSUREUR_FICTIF_INTERDIT`). Conseillé : poser `INSTANCE_ESPACE=ESSAI` au LC fictif. La remise à zéro du LC n'est plus
  suivie d'une relecture de votre `sortie` : rejouer un parcours après elle demande des lots neufs (ce que
  `liaison-assureur` fait de lui-même).

- **→ B (2026-11-17) : ce que la bibliothèque d'encours lit de la Créance (B-963, B-965)** — **information**, aucune
  action exigée avant 1059. `encours@1` (STORY-1047) prend en entrée l'**état absolu** de chaque Créance et de chaque
  crédit du tiers, par clé, avec une **révision croissante** (la plus haute l'emporte) : pour la Créance, `statut`
  (`OUVERTE` | `CLOTUREE`), les **deux restants** de STORY-259 (`restantCertain`, `restantAffiche` ; ou le montant
  déclaré à part, comme le dit l'amendement du 2026-11-13), `echeanceLe`, `perimetre`, `devise`, montants entiers en
  unité mineure ; pour le crédit du tiers, son `solde`. Si `paiement.creance.changed@1` ou
  `paiement.credit-tiers.changed@1` s'en écarte (pas de révision, un seul restant), le dire ici : D adapte la
  correspondance chez le consommateur, la règle ne change pas. Une Créance `CLOTUREE` sort de l'encours (D-1047-3).
- **→ C (2026-11-17) : passation de `prospera-assureur-fictif` constatée** — **pour information**. D tient le dépôt
  depuis STORY-1046 (`dev` 78ad10c au rituel, e265b0a après). C continue de jouer ses parcours contre le LC fictif et
  demande à D toute modification (ici). Ce qui change pour vous : deux routes neuves (C13, identité `MOTEUR` seule) ; un
  jeton de service présenté à toute autre route du LC fictif est refusé 403 `IDENTITE_DE_SERVICE_REFUSEE` ; vos jetons
  d'utilisateur, l'API du LC (`/lc/echange`) et l'administration ne changent pas. Le générateur reste dans votre dossier
  `contrats/assurance/demo/` : s'il change, D recopie et refige les empreintes du jeu (à demander ici).
- **→ B (2026-11-17) : le jeu de l'assurance est dans `jeux-demonstration/`** — **information**. D-1046-4 : D a ajouté
  `jeux-demonstration/assurance-compagnie-demo-reduite/` (données seules, plateforme #23), sur la phrase du README « les
  jeux des verticales viennent de leurs propriétaires ». Si vous tenez le tableau « Qui écrit dans quel dossier » à jour,
  la ligne est : `jeux-demonstration/assurance-compagnie-demo-reduite/` → groupe D. Le jeu à la taille de la démo
  (`assurance-compagnie-demo`, ~80 Mo) n'est pas versionné : `npm run jeu:ecrire -- <dossier> DEMO` dans
  `prospera-assureur-fictif` le produit à l'octet, pour `JEUX_DEMONSTRATION_DIR` du catalogue de l'espace d'essai. Le
  catalogue le joue avec `INSTALLATION_SERVICES` → `assureur-fictif` et un jeton de service `MOTEUR` ; prouvé avec des
  lots de 500 (416 appels, 136 s), sans limite de débit côté LC.
- **→ C (2026-11-16) : consommer `reseau.portee.changed@1` et passer la suite de conformité pour STORY-1004** — ouverte.
  Le contrat est publié (reseau-service#7, `dev` 17dcf14) et la suite étiquetée (`conformite-portee-reseau-v1`,
  sha256 `f27799758591688e283c10e7bee04ea8ca7f3edb8c37dcd135f59e2b0851a15c`). Mode d'emploi :
  `tickets/TICKET-BACKEND-conformite-portee-reseau-sinistres.md`. Inscription au registre :
  `PUT /api/v1/instance/reseau/conformite/consommateurs/sinistres` (`PLATFORM_ADMIN`). D-1036 tient le jalon du 27/11
  en avance : C-1004 n'attend plus rien de D.

## Réponses aux demandes reçues

- **D-334-8 → C : servie (C #86, ffd6f2a)** (2026-11-27). `CycleObligationsService.revenir` : `DEPOSEE → A_DEPOSER`
  exige `PreuvesDeRejet.rejetDe(orgId, id, versionCourante.numero)`, sinon `409 REJET_REQUIS` (`{ obligationId, numero
  }`) ; le pointeur passe à `{ numero: n + 1, nature: 'RETRANSMISSION', versionId: null, rectificative: null }` ; l'acte
  `OBLIGATION_RETOUR_ARRIERE` cite `rejetId` et `versionRetransmise` ; `NATURES_VERSION` gagne `RETRANSMISSION`. Côté D
  (dans 335, fiscal #85, commit à part) : la description de `RetransmissionDto` le dit. L'archive par version de 335
  n'a rien à changer : la n + 1 retransmise est une version comme une autre (clé : le numéro).

- **← C (2026-11-26, après STORY-321) : la borne de temps de `libelle-imprime.spec.ts`** (851 ms sous la suite complète
  de C, borne 500) — **servie** dans 349 (fiscal #73, commit séparé `a7d42cc`) : 2000 ms, l'assertion (linéaire sur
  400 000 caractères) inchangée.

- **← B (2026-11-25, STORY-1116, `TICKET-BACKEND-modules-ouverts-dans-l-essai.md`) : dans l'espace d'essai, la garde de
  bilan ne lit pas le KYC (point 3, « D (bilan) »)** — **placée en STORY-1079 le 2026-11-25** (par STORY-1078, sur
  consigne de la session de groupe de D) : le dernier numéro de la plage 1030 → 1079 de D, entrée du tracker `RÉSERVÉ`
  (`source_doc` = le ticket), fiche à écrire juste avant de coder. **Ordre de D : après 1078, avant 1074 et 1075** —
  c'est un Must de la démo du 15/01. Choix par défaut, contestable : `INSTANCE_ESPACE=ESSAI` ⇒ le palier KYC de
  `requires-bilan-access` est sauté et l'état publié du module (`ESSAI_PROSPECT`) décide seul ; décision d'architecture
  (AD-15, NFR-A01) à confirmer : **Q-D-17**. Les points 1 et 2 (jeux dans le catalogue de l'essai, installation des
  modules à l'ouverture) restent à B ; le point 3 de `balance-service` reste à C, celui de `dossier-service` à B.
  Historique : lue par STORY-1077, à placer par la session de groupe.
- **← B (2026-11-24, STORY-1103, prospera-stories #805) : consommer `kyc.correction.requested@1` pour prévenir le cabinet
  par e-mail** — **servie par STORY-1072** (notification #92, `dev` 7a11331, 749b3cd ; expert-comptable #11, `dev`
  4154038, b540904) : l'AC-5 de 1103 est prouvé dans mailhog (pilote 35/35, `expert-comptable/scripts/recette/1072/`) ;
  la variable du lien s'appelle `lienEspace` (D-1072-2) ; une pile qui veut cet e-mail pose `ESPACE_KYC_URL` sur
  expert-comptable. — Historique : **lue au rituel de 1071 ; placée en STORY-1072** (plage de D, la première hors du lot 6 ; fiche écrite
  juste avant de coder ; le plafond du tracker ne monte qu'à son écriture). Contenu retenu : (1) dans
  `prospera-notification-service` (tenu par D), le modèle **`kyc-dossier-renvoi-correction`** (variables `texte`, déjà
  composé par `kyc`, et `lien`, l'espace du cabinet), à côté des trois modèles KYC du socle ; (2) le **consommateur de
  `kyc.correction.requested`** dans **`prospera-expert-comptable`**, au même endroit que celui de `kyc.status.changed`
  (même patron, une demande par administrateur du cabinet, clé d'idempotence = `eventId`) — ce dépôt n'a pas de
  titulaire (plan maître §2) : **question à l'utilisateur, choix par défaut : D le porte avec le modèle** ; (3) la preuve
  de l'**AC-5** : l'e-mail vu dans mailhog, dans la recette. Aucune urgence de démo (la console renvoie, le cabinet lit
  les motifs dans son statut).

- **← B (2026-11-24, STORY-979, « Suite du 2026-11-24 », D-979-10 → 16) : la demande de 1066, points (1) et (2) servis**
  — **lue** (relayée par la session de groupe de D, à la PR finale de 1067 ; annonce de B : prospera-stories **#789**,
  `a0f49f0`). (1) prospera-auth-service **#49**, `dev` `b49d8ab` : `facturation:avoir:valider` (« Valider un avoir
  au-delà du seuil ») au catalogue de tenant, **hors du jeton**, `DIST_DAF` seul ; servi par `GET /moi/droits` dans
  `droitsHorsJeton` ; jusqu'à 60 s de cache (`dv` n'avance pas) ; `moi-droits` reste en 1.1.0. (2)
  prospera-platform-catalog-service **#71**, `dev` `de988b1` : `copies.json` recopié depuis prospera-stories@24049e4,
  `facturation` 1.0.0 → **1.1.0** (sha256 vérifié), `droits[7] = facturation:avoir:valider` ; garde des manifestes verte
  (48) ; une base déjà semée sème la 1.1.0 à côté de la 1.0.0. (3) Le consommateur de `facturation.avoir.emis@1` dans
  `paiement` : **ouvert**, après le lot 6 de B (D-979-14).

- **← B (2026-11-24, STORY-979) : `facturation:parametres:modifier` servi** — **lue** (relayée par la session de groupe de
  D, à la PR finale de 1065). auth : prospera-auth-service **#48**, `dev` `c0f6243` — le droit est au catalogue de
  tenant, **hors du jeton** : servi par `GET /api/v1/moi/droits` dans `droitsHorsJeton`, jamais dans `perms[]` ; rôle par
  défaut **`DIST_DAF` seul** (« Modifier les paramètres de la facture ») ; jusqu'à 60 s de cache (pas d'avance de `dv`).
  Catalogue : prospera-platform-catalog-service **#68**, `dev` `d7e67f1`, `copies.json` recopié depuis
  prospera-stories@1561370, garde des manifestes verte (48). Annonce de B : prospera-stories **#777**. **D-979-7
  (information)** : le manifeste `facturation` est resté en 1.0.0 ; un catalogue déjà semé garde l'ancienne 1.0.0 sans le
  droit et la signale « divergente ». **Décision de D (D-1065-15)** : la version monte à la source dans **STORY-1066**
  (l'avoir touche `facturation`) ; si l'avoir n'ajoute rien au manifeste, 1066 la monte quand même en **1.0.1** ; B la
  recopie ensuite. Le code de 1065 n'est pas rouvert.

- **← A (2026-11-18) : réponses de l'utilisateur à Q-D-1 → Q-D-10** — **lue** au rituel de 1060. Q-D-9 **renversée** ⇒
  STORY-1060 (un calendrier propre à chaque organisation) ; les neuf autres **confirmées** (« Questions à l'utilisateur
  ou au PO ») ; la reprise du dernier numéro de facture avant la première facture d'un client qui quitte Sage est
  inscrite à la liste de mise en service (passation, « Ce qui reste », à la PR finale de 1060) ; D-972-9 (les comptes du
  bureau dans le jeu) : STORY-1064.

- **← B (2026-11-17) : D-1059 débloquée (STORY-963, 965)** — **appliquée par 1059** : la route `PUT
  …/creances/sources/FACTURE/{factureId}` est appelée avec le jeton du membre ; `paiement.creance.changed@1` est lu tel
  que publié (plus haute `revision` par `creanceId`, trop-perçu = crédit du tiers) ; prouvé sur une pile avec le vrai
  `paiement` d'`origin/dev` (`ad35786`). Rien n'a manqué chez vous ; aucun ticket.
- **← B (2026-11-17) : le jeu « Grossiste du Golfe » (votre réponse à D-1058)** — **lue** : les trois gestes sont placés
  avant STORY-969 ou en remplaçante ; les comptes du jeu viennent avec STORY-972 (annoncée, `main`
  9fad661). La demande reste **ouverte** jusqu'à leur fusion.

- **← B (2026-11-16) : servir les routes de vérification de vos modules (STORY-944)** — **servie pour
  `assureur-fictif`** par prospera-assureur-fictif#5 (STORY-1057, `dev` f9bbea5) : les cinq codes du manifeste, au contrat
  `verification-installation@1`. Les modules du distributeur (`reseau`, `ventes`…) n'en servent pas encore : à leur
  installation par le moteur.

- **← B (2026-11-17) : `commande:parametres:modifier` au catalogue de tenant (STORY-971, annoncée)** — **lue** au
  rituel de 1056. Hors du jeton, `DIST_DG` et `DIST_ADMIN` seulement, servi par `/moi/droits` (`droitsHorsJeton`) :
  rien à changer dans `ventes` (la route lit déjà ce droit depuis 1053). La demande D-1053-7 reste **ouverte** jusqu'à
  la fusion de 971 ; Q-D-5 au PO est tenue par ce choix.

- **← B (2026-11-17) : les 15 rôles du distributeur sont servis, D-1053 est débloquée (STORY-960)** — **lue** au
  rituel de 1052 ; **appliquée par 1053** (livrée le 17/11) (droits `droits ∪ droitsHorsJeton` de `/moi/droits`, `roleMetier` jamais
  pour décider d'un droit, aucun droit sans rôle `DIST_*`). Les paramètres de `commande` (D-1049-4) et la lecture des
  séries (D-1052-12) restent au `TENANT_ADMIN` jusqu'à 1053, qui choisira entre un droit neuf et `roleMetier`.
- **← B (2026-11-17) : comment ouvrir une Créance dans `paiement` (STORY-963, pour D-1059)** — **lue** ; servira
  **1059** (`PUT {PAIEMENT}/api/v1/creances/sources/FACTURE/{factureId}`, rejouable).

- **← A (2026-11-17) : `PATCH /api/v1/dossiers/{id}` relayé par le BFF (STORY-923)** — **lue**. Pour l'écran de la
  fiche dossier (onglet Identité) : frontend, hors du lot 3 de D (backend) ; reprise avec le lot frontend.

- **← B (2026-11-17) : le lot 3 de D** — `PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §4 : **STORY-1045 → 1059**, distributeur
  et assurance en alternance. D reçoit `prospera-assureur-fictif` (de C) et `prospera-notification-service` (de B, à la
  fusion de B-957), et le dossier `encours/` de la plateforme. Ce que D attend de B : 956 (README, kit 1.0.1) pour
  1047 et 1055 ; 957 pour 1051 ; 960 pour 1053 ; 963 et 965 pour 1059. Passation à Dev A à mettre à jour **avant
  le 04/12**.

- ← A (2026-11-15) : les deux demandes adressées à D au lot 1 (point de départ AP-38 ; motif KYC perdu, reste de
  STORY-176) portent sur le frontend. Le lot 2 fait passer D au backend : elles **restent ouvertes** et reviendront
  avec le lot frontend. D n'y touche pas pendant le lot 2.

## Demandes à l'utilisateur (gestes réservés)

- **`reseau-service` : poser « Rebase and merge » seul.** Au 2026-11-16, la fusion par squash et par commit de fusion
  est encore permise. La session ne fusionne qu'en `gh pr merge --rebase`.
- ~~Créer les cinq dépôts du distributeur~~ : **faits** ; D y a posé `main` et `dev`. **Poser « Rebase and merge »
  seul** sur chacun (squash et commit de fusion encore permis), comme sur `reseau-service`.

## ⚠ Communs

> Lot 7, D-L7-2 : un fichier commun de `prospera-fiscal-service` (`app.module.ts`, manifeste `declarations`, contrat
> OpenAPI, `package.json`, migrations, `read-models/`, copies du paquet, et tout fichier d'un dossier de C) ne change
> que dans une PR qui le dit, rebasée sur `origin/dev` juste avant la fusion, et annoncée ici **avant** la fusion.
> Une seule migration en vol sur le service.

- **ANNONCÉ (2026-11-27, STORY-336, avant le code)** — branche `MNV-336` de `prospera-fiscal-service`, partie de
  `origin/dev` `108221e`. **Aucune migration**, aucune collection, aucune écriture ; ni `app.module.ts` (la route entre
  dans `DepotsModule`, fichier de D, déjà monté), ni `package.json`, ni `read-models/` (deux schémas lus, `IdentityUser` et
  `IdentityMembership`, enregistrés en lecture dans `DepotsModule` pour l'annuaire du chemin), ni copie du paquet, ni
  manifeste `declarations`. Touché parmi les communs : **le contrat OpenAPI** (une route neuve). **Aucun fichier de C** :
  `HistoriqueObligationsService` (le chemin) et `RegistreValidationsClient` (les pièces du client), que `ObligationsModule`
  n'exporte pas, sont **fournis en lecture** par `DepotsModule` avec les adaptateurs de C (D-336-4). Aucune minuterie neuve
  (garde de 318).

- **FUSIONNÉ (2026-11-27, prospera-fiscal-service#85, `dev` `108221e`, rebasée sur `origin/dev` `ffd6f2a` (C #86, D-334-8 servie) sans conflit avant la fusion ; un commit à part met à jour la description de `RetransmissionDto`), conforme à l'annonce ;
  ANNONCÉ (2026-11-26, STORY-335, avant le code)** — branche `MNV-335` de `prospera-fiscal-service`, partie de
  `origin/dev` `69d7e65`. **Aucune migration** (une collection neuve, `livrables_archives_depot`, index posés par Mongoose
  au démarrage), ni `app.module.ts` (les routes entrent dans `DepotsDeclarationController`, déjà monté ; le registre des
  livrables archivés est fourni par `AccusesDepotModule`, fichier de D, qui n'importe toujours pas `ObligationsModule`),
  ni `package.json`, ni `read-models/`, ni copie du paquet, ni manifeste `declarations`. Touché parmi les communs : **le
  contrat OpenAPI** (quatre routes neuves). **Aucun fichier de C.** Aucune minuterie neuve (garde de 318).

- **FUSIONNÉ (2026-11-26, prospera-fiscal-service#82, `dev` `69d7e65`, rebasée sur `origin/dev` `c459960` — 339 de C, au-dessus de `74b33ec`, qui touchait aussi le contrat OpenAPI et `ObligationsModule` : aucun conflit — avant la fusion), conforme à l'annonce ;
  ANNONCÉ (2026-11-26, STORY-334, avant le code)** — branche `MNV-334` de `prospera-fiscal-service`, partie de
  `origin/dev` `fc317a1`. **Aucune migration** (une collection neuve, `rejets_depot`, index posés par Mongoose au
  démarrage), ni `app.module.ts` (les routes neuves entrent dans `DepotsDeclarationController`, déjà monté ; le registre
  des rejets est fourni par `AccusesDepotModule`, fichier de D), ni `package.json`, ni `read-models/`, ni copie du paquet,
  ni manifeste `declarations`. Touché parmi les communs : **le contrat OpenAPI** (trois routes neuves, un refus de plus sur
  la route de l'accusé). **Aucun fichier de C** : le retour du cycle est demandé à C (« → C : … — ouverte »). Pour ne pas
  croiser la garde `ACCUSE_REQUIS` que C pose en tête de 339 : D ne touche ni `obligations.module.ts` ni le cycle ;
  `AccusesDepotModule` garde son nom et ses exports (`PreuvesDeRejet` s'y ajoute).

- **FUSIONNÉ (2026-11-26, prospera-fiscal-service#81, `dev` `fc317a1`, rebasée sur `origin/dev` `94baf9f` — 329 de C,
  qui touchait aussi le contrat OpenAPI : aucun conflit — avant la fusion), conforme à l'annonce ; ANNONCÉ (2026-11-26,
  STORY-333, avant le code)** — branche `MNV-333` de `prospera-fiscal-service`, partie de
  `origin/dev` `8d85c10`. **Aucune migration** (une collection neuve, `accuses_depot`, index posé par Mongoose au
  démarrage), ni `app.module.ts` (les routes neuves entrent dans `DepotsDeclarationController`, déjà monté ;
  `AccusesDepotModule`, neuf, est importé par `DepotsModule`, fichier de D), ni `package.json`, ni `read-models/`, ni
  copie du paquet, ni manifeste `declarations`. Touché parmi les communs : **le contrat OpenAPI** (trois routes neuves).
  **Aucun fichier de C** : `qualifierRetard`, le cycle, les ports des obligations et des versions sont lus. C a 329 en
  vol sur le contrat OpenAPI et le journal partagé : la PR de 333 se rebase sur sa fusion si elle passe avant.

- **FUSIONNÉ (2026-11-26, prospera-fiscal-service#79, `dev` `8d85c10`, sur `origin/dev` `6e9fbbe`, qui n'avait pas
  bougé : aucun rebase), conforme à l'annonce ; ANNONCÉ (2026-11-26, STORY-332, avant le code)** — branche `MNV-332` de `prospera-fiscal-service`, partie de
  `origin/dev` `6e9fbbe`. **Aucune migration** (aucun stockage ne change), ni `app.module.ts` (la route neuve entre dans
  `DepotsDeclarationController`, déjà monté ; le service neuf est fourni par `DepotsModule`, fichier de D), ni
  `package.json` (le `prebuild` appelle la même garde, étendue aux guidages), ni `read-models/`, ni copie du paquet
  fiscal, ni manifeste `declarations`. Touché parmi les communs : **le contrat OpenAPI** (une route neuve : « ⚠
  Contrats »). Données neuves dans le dossier de D : `modules/paquets-depot/assets/manifeste-guidages.json`,
  `tg-tva-guidage-1.0.json` et `tg-dsf-guidage-1.0.json` (LF, vérifiées par sha256) ; les formats et leurs deux
  manifestes **intacts**. **Lus, sans y écrire** (dossiers de C) : `REDEVABLE_ENTREPRISE` et `NatureRedevable`
  (`domain/redevables/redevable.ts`), les ports des obligations et des versions. **→ C** : rien à faire pour un rebase.
- **FUSIONNÉ (2026-11-26, prospera-fiscal-service#78, `dev` `6e9fbbe`, rebasée sur `origin/dev` `9db1653` — 327
  de C, qui touchait aussi le contrat OpenAPI — avant la fusion), conforme à l'annonce ; ANNONCÉ (2026-11-26,
  STORY-331, avant le code)** — branche `MNV-331` de `prospera-fiscal-service`, partie de
  `origin/dev` `7d48fd9`. **Aucune migration** (aucun stockage ne change), ni `app.module.ts` (la route neuve entre dans
  `LivrablesDeclarationController`, déjà monté), ni `package.json` (le `prebuild` appelle la même garde, étendue), ni
  `read-models/`, ni copie du paquet fiscal, ni manifeste `declarations`. Touché : **le contrat OpenAPI** (une route
  neuve, un refus de plus sur la route du classeur de 330, un champ `nature` sur les deux réponses du dépôt engagé :
  « ⚠ Contrats »). Données neuves dans le dossier de D : `modules/paquets-depot/assets/manifeste-formulaires.json` et
  `tg-tva-1.0.json` (LF, vérifiées par sha256) ; `manifeste.json` et `tg-dsf-*.json` **intacts**. **Lus, sans y écrire**
  (dossiers de C) : `domain/obligations/version-declaration.ts` (`contenuDeclareDe`), les ports des obligations et des
  versions. **→ C** : rien à faire pour un rebase ; `etatsActifs` (le calendrier des dépôts que lisent les échéances) ne
  voit jamais un formulaire (D-331-2).
- **FUSIONNÉ (2026-11-26, prospera-fiscal-service#76, `dev` `7d48fd9`, sur `origin/dev` `7e2bff8`, qui n'avait pas
  bougé : aucun rebase), conforme à l'annonce, plus un fichier de D : `src/modules/coffre-secrets/garde-ad13.spec.ts`
  (la route du livrable d'une déclaration reçoit le classeur de 537, D-330-17) ; ANNONCÉ (2026-11-26, STORY-330, avant
  le code)** — branche `MNV-330` de `prospera-fiscal-service`, partie de
  `origin/dev` `7e2bff8`. **Aucune migration** (une collection neuve, `engagements_depot`, son index unique partiel posé
  par Mongoose au démarrage), ni `app.module.ts` (les deux contrôleurs neufs entrent dans `DepotsModule` et
  `LivrablesDepotModule`, déjà montés ; ces deux modules importent `ObligationsModule`), ni `package.json`, ni
  `read-models/`, ni copie du paquet, ni manifeste `declarations`. Touchés : **le contrat OpenAPI** (trois routes neuves :
  « ⚠ Contrats ») et **`src/main.ts`** (transverse : deux en-têtes de réponse de plus dans `exposedHeaders` du CORS,
  `X-Declaration-Version` et `X-Declaration-Empreinte`). **Lus, sans y écrire** (dossiers de C) :
  `ports/registre-obligations.ts`, `ports/registre-versions-declaration.ts` (exporté pour 330, D-325-11),
  `domain/obligations/version-declaration.ts` (`contenuDeclareDe`, `empreinteDuContenu`, `versionCouranteDe`),
  `domain/obligations/cycle.ts` (`CYCLE`, `obligationDesactivee`), `test/utils/registre-obligations-memoire.ts` (l'e2e).
  Tout le reste dans les dossiers de D (`depots`, `livrables-depot`, `adapters/canal-depot`, `adapters/mongo` de
  l'engagement, `ports/canal-depot.ts`, `ports/registre-engagements-depot.ts`) et une garde neuve
  `src/modules/depots/garde-ad12.spec.ts`. **→ C** : rien à faire pour un rebase ; aucune voie de D ne passe une obligation
  à « Déposée » (D-330-7).
- **FUSIONNÉ (2026-11-26, prospera-fiscal-service#73, `dev` `136efdf`, rebasée sur `origin/dev` `493a817` avant la
  fusion), conforme à l'annonce, plus un fichier de D : `src/domain/paquets-depot/libelle-imprime.spec.ts` (la borne de
  temps passe de 500 à 2000 ms, demande de C, commit séparé) ; ANNONCÉ (2026-11-26, STORY-349, avant le code)** —
  branche `MNV-349` de `prospera-fiscal-service`. **Aucune
  migration**, aucune collection, aucun index ; ni `app.module.ts` (`RemunerationModule` et `ObligationsModule` y sont
  déjà), ni `package.json`, ni `read-models/`, ni copie du paquet, ni manifeste `declarations`. Touché : **le contrat
  OpenAPI** (un champ ajouté à deux réponses : « ⚠ Contrats »). **Lus, sans y écrire** (dossiers de C) :
  `ports/registre-obligations.ts` (`RegistreObligations.enregistrer`, exporté par `ObligationsModule`),
  `domain/obligations/derivation.ts` (le type `ObligationDerivee`), `catalogue.ts` (`lireCatalogue`), `montant.ts`
  (`modeDuMontant`), `domain/paquet-fiscal/validation-paquet.ts` (`signalementsNonValides`). Tout le reste dans le dossier
  `remuneration` de D : `remuneration.module.ts` importe `ObligationsModule`. **→ C** : rien à faire pour un rebase ; les
  obligations `COTISATIONS_SOCIALES` et `RETENUE_IRPP` sont écrites par la dérivation sociale (le catalogue fait foi s'il
  les porte un jour, D-349-5) ; pour 350, `ObligationsModule` ne peut pas importer `RemunerationModule` sans
  `forwardRef` (cycle) : le module de 350 peut importer les deux.
- **Note de lecture (2026-11-26, après STORY-318 de C, fiscal #70, `dev` `cefbe20`)** : depuis 318, le relais de l'outbox
  du fiscal tourne sur **BullMQ** — toute pile ou tout e2e de D qui démarre le fiscal doit lever **Redis** ; une garde
  par l'AST interdit `setInterval` dans le fiscal.
- **← C (2026-11-26, STORY-317, prospera-fiscal-service#69, `dev` `98ab317` / `8f6b1ba`) : trois specs du dossier
  `remuneration` de D modifiées par C — acceptées par D** : `src/domain/remuneration/calcul-social.spec.ts`,
  `src/application/remuneration/calcul-remuneration.service.spec.ts` et `test/remuneration-import.e2e-spec.ts` (elles
  attendaient `NON_DECLAREE` ; le vrai paquet déclare désormais `cnss.collecte`). Dit par C dans « ⚠ Communs » de son
  journal.
- **FUSIONNÉ (2026-11-25, prospera-fiscal-service#67, `dev` `bc0c09f`, rebasée sur `origin/dev` avant la fusion) ; ANNONCÉ (2026-11-25, STORY-348, avant le code)** — branche `MNV-348`. **Aucune migration** (un champ facultatif
  `personnesACharge`, `null` par défaut, sur `lignes_remuneration` : une ligne déjà écrite se lit `null`), ni
  `app.module.ts` (`RemunerationModule` est déjà monté), ni `package.json`, ni `read-models/`, ni copie du paquet, ni
  manifeste `declarations`. Touché : **le contrat OpenAPI** (une route neuve, un champ facultatif : « ⚠ Contrats »).
  **Lu, sans y écrire** : `src/domain/familles/irpp-traitements-salaires.ts` et `decimal-exact.ts` (dossier de C),
  importés par le calcul de D (D-348-1). Tout le reste est dans les dossiers de D (`remuneration`). **→ C** : rien à
  faire pour un rebase ; 350 lira `CalculRemunerationService` (exporté par `RemunerationModule`).
- **FUSIONNÉ (2026-11-25, prospera-fiscal-service#64, `dev` `e4630f1`, rebasée sur `origin/dev` avant la fusion) ; ANNONCÉ (2026-11-25, STORY-346, avant le code)** — branche `MNV-346`. **Aucune migration** (aucune collection,
  aucun index, aucun champ neuf : l'import écrit dans `bases_remuneration` et `lignes_remuneration` de 345), ni
  `app.module.ts` (`RemunerationModule` est déjà monté), ni `package.json` (multer vient avec
  `@nestjs/platform-express`), ni `read-models/`, ni copie du paquet, ni manifeste `declarations`. Touché : **le contrat
  OpenAPI**, une route neuve (« ⚠ Contrats »). Tout le reste est dans les dossiers de D (`remuneration`).
  **→ C** : rien à faire.
- **FUSIONNÉ (2026-11-25, prospera-fiscal-service#63, `dev` `cf8b583`, rebasée sur `origin/dev` `f1296ae` avant la
  fusion) ; ANNONCÉ (2026-11-25, STORY-560, avant le code)** — branche `MNV-560`. **Aucune migration** (deux collections
  neuves, `coffre_canaux` et `coffre_jetons`, index posés par Mongoose au démarrage), ni `package.json`, ni
  `read-models/`, ni copie du paquet, ni manifeste `declarations` (sa note « aucun secret de canal n'est stocké »
  devient périmée : à corriger à la prochaine version du manifeste, avec 561, qui apporte la vraie ressource
  extérieure). Touchés :
  - `src/app.module.ts` : import de `CoffreSecretsModule` ;
  - **complément du 2026-11-25, avant la fusion (#905 ne le nommait pas)** —
    `src/common/filters/all-exceptions.filter.ts` et son test (dossier transverse, donc commun) : une
    `BadRequestException` née du `SyntaxError` de body-parser (hors route, message de `JSON.parse`) rend désormais un
    message constant et le code **`CORPS_ILLISIBLE`** au lieu de recopier un extrait du corps reçu (D-560-15 : sur
    `POST /coffre/depots`, l'extrait peut être le mot de passe du client). **Vaut pour toutes les routes du service** :
    un client qui lisait le message de `JSON.parse` lit maintenant `code`. Aucun autre 400 ne change (un 400 levé par
    une route garde son message) ;
  - le contrat OpenAPI : huit routes neuves (« ⚠ Contrats ») ;
  - `src/garde-routes-ecriture.spec.ts` : les deux routes publiques du client (`POST /coffre/depots`,
    `POST /coffre/revocations`) entrent dans la liste des écritures sans droit fiscal, avec leur raison ;
  - `src/domain/habilitations/natures-acces.ts` et son test (dossier de C) : `COMPTE_DE_CANAL` passe de
    `JAMAIS_STOCKEE` à `COFFRE_SEUL` (D-560-14) ;
  - `.env.example` : `COFFRE_CLE_MAITRE` et `COFFRE_CLE_ID`, commentées, sans valeur ;
  - fichiers neufs dans `src/ports/` (`coffre-*.ts`).
  **→ C** : rien à faire ; un rebase de C après la fusion ne rencontre que ces lignes.

## ⚠ Contrats

- **ANNONCÉ (2026-11-27, STORY-336, avant le code) — le dossier de contrôle à la demande** (`prospera-fiscal-service`,
  module `depots`). Fiche : `stories/STORY-336.md` (D-336-1 → 12, section « Contrat »). **Ajouts seuls** :
  - **`GET /api/v1/dossiers-controle?dossierId=…&annee=…[&redevableId=…][&taxe=…][&periode=…]`** (accès fiscal, throttle
    10/min) : 200 `{ perimetre, produitLe, produitPar, exigenceValidationClient, obligations: [{ …ce qui situe
    l'obligation, baseLegale, versionCourante, versions, validations: { visa, client }, depots, archive (335), triplet,
    anomalies, chemin (329, `detail.basesLegales` de 339), rapprochementPieces: null }], integrite: { statut: ATTESTEE |
    ROMPUE | RIEN_A_ATTESTER, chaines: [{ perimetre, obligationId, depotId, intacte, entrees, rupture, tete, journal }],
    versions: [{ obligationId, numero, empreinte, recalculee, intacte }] }, empreinte }`. Refus : `404 DOSSIER_INTROUVABLE`
    (même réponse hors portée), **`422 PERIMETRE_TROP_LARGE`** (`{ obligations, maximum: 100 }`), `400`, `403`, `429`,
    `503`.
  - Aucune collection, aucun acte au journal, aucun topic, aucun droit, aucun champ d'une route existante. **→ A (plus
    tard)** : l'écran et l'export du dossier de contrôle ; types à régénérer depuis l'OpenAPI vivant
    (`DossierDeControleDto`). **→ 337** : `rapprochementPieces` est sa place (D-336-9).

- **PUBLIÉ (2026-11-27, STORY-335 : prospera-fiscal-service#85, `dev` `108221e`) sans écart ; ANNONCÉ (2026-11-26,
  STORY-335, avant le code, prospera-stories#1009, `main` af552d3) — l'archive d'une déclaration déposée** (`prospera-fiscal-service`,
  module `depots`). Fiche : `stories/STORY-335.md` (D-335-1 → 10, section « Contrat »). **Ajouts seuls** :
  - **`POST /api/v1/depots-declaration/{depotId}/livrable`** (droit `fiscalite:declaration:deposer`, multipart : `fichier`
    pour un format à fichier, aucun pour un formulaire) : 201 `{ archiveId, depotId, obligationId, dossierId,
    implantationId, redevableId, taxe, periode, numero, empreinte, nature: FICHIER | FORMULAIRE, format, fichier: { sha256,
    taille, type, nom }, archivePar, archiveLe, statutObligation }`. Refus neufs : **`409 LIVRABLE_NON_ARCHIVABLE`**
    (`{ statut }`), **`409 LIVRABLE_DEJA_ARCHIVE`** (`{ archiveId }`), **`422 LIVRABLE_REQUIS`**, **`422
    FICHIER_NON_ATTENDU`**, **`422 LIVRABLE_NON_CONFORME`** (`{ attendu, lu }`) ; et ceux du dépôt engagé (`404
    DEPOT_INTROUVABLE`, `409 DEPOT_REMPLACE`, `409 OBLIGATION_DESACTIVEE`, `409 LIVRABLE_PERIME`, `422
    FORMAT_DE_CANAL_NON_DECLARE`, `422 CLASSEUR_*`, `413`).
  - **`GET /api/v1/depots-declaration/{depotId}/livrable`** (accès fiscal) : 200 `{ livrable, url, expireLe }` (URL
    présignée éphémère, objet re-haché d'abord, 682) ; **`404 LIVRABLE_NON_ARCHIVE`**, `502 FICHIER_ARCHIVE_ALTERE`.
  - **`GET /api/v1/depots-declaration/{depotId}/accuse/piece`** (accès fiscal) : 200 `{ accuseId, piece, url, expireLe }` ;
    `404 ACCUSE_INTROUVABLE`, **`404 PIECE_ACCUSE_ABSENTE`**, `502 FICHIER_ARCHIVE_ALTERE`.
  - **`GET /api/v1/depots-declaration/archives?obligationId=…`** (accès fiscal) : 200 `{ obligationId, dossierId,
    implantationId, redevableId, taxe, periode, statutObligation, versions: [{ numero, livrable, accuse, rejet }] }` (la
    plus récente d'abord, aucune URL) — **ce que 336 lira**.
  - Collection neuve `livrables_archives_depot` ; acte `DEPOT_DECLARATION_LIVRABLE_ARCHIVE`. Aucun topic, aucun droit
    neuf, aucun champ d'une route existante. **→ A (plus tard)** : FE-081 archive le livrable déposé et ouvre les pièces.

- **PUBLIÉ (2026-11-26, STORY-334 : prospera-fiscal-service#82, `dev` `69d7e65`) sans écart ; ANNONCÉ (2026-11-26,
  STORY-334, avant le code, prospera-stories#1004, `main` 9bcdf01) — le rejet administratif d'un dépôt engagé**
  (`prospera-fiscal-service`, module `depots`). Fiche : `stories/STORY-334.md` (D-334-1 → 15, section « Contrat »).
  **Ajouts, et un refus de plus sur une route de 333** :
  - **`POST /api/v1/depots-declaration/{depotId}/rejet`** (droit `fiscalite:declaration:preparer`, JSON : `rejeteLe`,
    `motif` à l'octet, `reference?`, `cause?: { feuille?, cellule?, regle? }`, `correctionProposee?`) : 201 `{ rejetId,
    depotId, obligationId, dossierId, numero, empreinte, rejeteLe, motif, reference, cause, correctionProposee,
    consignePar, consigneLe, retard, reprise: { versionRejetee, retour: { vers: 'A_DEPOSER' }, etapes }, statutObligation
    }`. Refus : `400` (`MOTIF_INVALIDE`, **`TEXTE_REJET_INVALIDE`** `{ champ }`), `404 DEPOT_INTROUVABLE`, `409
    DEPOT_REMPLACE`, `409 OBLIGATION_DESACTIVEE`, `409 LIVRABLE_PERIME`, **`409 REJET_NON_CONSIGNABLE`** (`{ statut }`),
    `409 ACCUSE_DEJA_CONSIGNE`, **`409 REJET_DEJA_CONSIGNE`** (`{ rejetId }`), **`422 DATE_REJET_HORS_BORNES`**.
  - **`GET /api/v1/depots-declaration/{depotId}/rejet`** (accès fiscal) : 200 le rejet ; **`404 REJET_INTROUVABLE`**.
  - **`GET /api/v1/depots-declaration/rejets?obligationId=…`** (accès fiscal) : 200 `{ obligationId, statutObligation,
    rejets: [{ ...rejet, retransmission: { numero, nature, versionId, scelleLe } | null }] }`.
  - **Route de 333, un refus de plus** : `POST …/{depotId}/accuse` répond **`409 DEPOT_REJETE`** (`{ rejetId }`) sur une
    version rejetée (D-334-5 : accusé et rejet s'excluent, par version).
  - **Pour C** : `409 REJET_REQUIS` sur `POST /api/v1/obligations/{id}/retour` `{ vers: 'A_DEPOSER' }` depuis `DEPOSEE`, et
    la nature de version `RETRANSMISSION`, quand C l'aura ouvert (D-334-8, « → C » ci-dessous). Collection neuve
    `rejets_depot` ; acte `DEPOT_DECLARATION_REJET` (empreintes seules), textes en clair dans `textes_audit` (329). Aucun
    topic, aucun droit neuf. **→ A (plus tard)** : FE-081 consigne le rejet et affiche la reprise.

- **PUBLIÉ (2026-11-26, STORY-333 : prospera-fiscal-service#81, `dev` `fc317a1`) sans écart ; ANNONCÉ (2026-11-26,
  STORY-333, avant le code, prospera-stories#998, `main` 572be5d) — l'accusé d'un dépôt engagé et le retard qualifié à
  la date réelle**
  (`prospera-fiscal-service`, module `depots`). Fiche : `stories/STORY-333.md` (D-333-1 → 13, section « Contrat »).
  **Ajout seul** : aucune route, aucun champ, aucun topic existant ne change.
  - **`POST /api/v1/depots-declaration/{depotId}/accuse`** (droit `fiscalite:declaration:deposer`, multipart : `piece`
    facultatif, `reference` facultative, `deposeLe` exigée) : 201 `{ accuseId, depotId, obligationId, dossierId, numero,
    empreinte, nature, reference, piece, deposeLe, consignePar, consigneLe, retard: { echeance, echeanceLegale, reportee,
    joursDeRetard, qualification, penalites, source }, statutObligation }`. Refus : `404 DEPOT_INTROUVABLE`, `409
    DEPOT_REMPLACE`, `409 OBLIGATION_DESACTIVEE`, **`409 ACCUSE_NON_CONSIGNABLE`** (`{ statut }` : la déclaration n'est
    pas déposée), `409 LIVRABLE_PERIME`, **`409 ACCUSE_DEJA_CONSIGNE`** (`{ accuseId }`), **`422 ACCUSE_REQUIS`**, **`422
    DATE_DEPOT_HORS_BORNES`** (`{ min, max }`), **`422 PIECE_ACCUSE_TYPE_REFUSE`**, `413`.
  - **`GET /api/v1/depots-declaration/{depotId}/accuse`** (accès fiscal) : 200 l'accusé ; **`404 ACCUSE_INTROUVABLE`**.
  - **`GET /api/v1/depots-declaration/accuses?obligationId=…`** (accès fiscal) : 200 `{ obligationId, accuses }`.
  - **Code neuf pour C** : `409 ACCUSE_REQUIS` sur `POST /api/v1/obligations/{id}/transition` vers `ACCUSE_RECU`, quand C
    l'aura branché (D-333-3, « → C » ci-dessous). Collection neuve `accuses_depot` ; objets sous `accuses/` dans le
    bucket privé de 682 ; acte `DEPOT_DECLARATION_ACCUSE` au journal chaîné. Aucun topic ni droit. **→ A (plus tard)** :
    FE-081 consigne l'accusé à l'étape `RELEVER_ACCUSE` du guidage.

- **PUBLIÉ (2026-11-26, STORY-332 : prospera-fiscal-service#79, `dev` `8d85c10`) sans écart ; ANNONCÉ (2026-11-26,
  STORY-332, avant le code, prospera-stories#991, `main` 72e9915) — le dépôt guidé pas à pas** (`prospera-fiscal-service`, modules
  `depots` et `paquets-depot`). Fiche : `stories/STORY-332.md` (D-332-1 → 12, section « Contrat »). **Ajout seul** :
  aucune route, aucun champ, aucun topic existant ne change.
  - **`GET /api/v1/depots-declaration/{depotId}/guidage`** (droit `fiscalite:declaration:deposer`) : 200 `{ depotId,
    obligationId, dossierId, redevable: { id, nature: 'ENTREPRISE' | 'PERSONNE_PHYSIQUE' }, taxe, periode, nature,
    format, guidage: { pays, etat, version, checksum, statut }, canal: { type, adresse }, estampille: { numero, empreinte
    }, etapes: [{ rang, code, libelle, geste, consigne, valeurs: [{ rang, code, libelle, type, valeur }] | null, fichier:
    { format, numero, empreinte, periode } | null }] }`. Les étapes viennent du paquet de guidage, dans son ordre. Les
    valeurs sont celles du formulaire de 331, dans l'ordre du formulaire, chacune une chaîne prête à copier. `geste`
    prend sa valeur dans une liste fermée : `SE_CONNECTER`, `OUVRIR`, `SAISIR_VALEURS`, `TELEVERSER_FICHIER`,
    `VERIFIER`, `SOUMETTRE`, `RELEVER_ACCUSE`. Aucun geste ne demande une valeur.
  - Refus : `404 DEPOT_INTROUVABLE`, **`409 DEPOT_REMPLACE`** (`{ remplacePar }`), `409 OBLIGATION_DESACTIVEE`, `409
    LIVRABLE_PERIME` (`{ numero, empreinte }`), `422 FORMAT_DE_CANAL_NON_DECLARE`, **`422 GUIDAGE_NON_DECLARE`** (`{
    champ: 'guidage', pays, etat, version }`), **`422 GUIDAGE_INCOMPLET`** (`{ champ }`), `422
    FORMAT_DE_CANAL_INCOMPLET`, `422 VALEUR_DE_CANAL_ABSENTE`, `422 VALEUR_DE_CANAL_HORS_CONTRAINTE`, `502
    PAQUET_DEPOT_INTEGRITE`, `502 VERSION_SCELLEE_INTROUVABLE`.
  - **Données** : deux guidages `amorce` (Q-D-29), `TG × TVA` (dimana : six étapes, les trois valeurs dans l'ordre) et
    `TG × DSF` (GUDEF : un seul fichier à téléverser). Aucun topic, droit, acte ni stockage. **→ A (plus tard)** :
    FE-081 affiche les étapes et met un bouton « copier » sur chaque valeur.

- **PUBLIÉ (2026-11-26, STORY-331 : prospera-fiscal-service#78, `dev` `6e9fbbe`) sans écart ; ANNONCÉ (2026-11-26,
  STORY-331, avant le code, prospera-stories#986, `main` 756fc0f) — le format de canal décrit comme une donnée du
  paquet**
  (`prospera-fiscal-service`, modules `paquets-depot`, `livrables-depot` et `depots`). Fiche : `stories/STORY-331.md`
  (D-331-1 → 12, section « Contrat »).
  - **`GET /api/v1/livrables-declaration/{obligationId}/formulaire`** (droit `fiscalite:declaration:preparer`) : 200
    `{ obligationId, nature: 'SAISIE_FORMULAIRE', format: { pays, etat, version, checksum }, statutFormat, estampille:
    { numero, empreinte }, champs: [{ rang, code, libelle, type: 'MONTANT' | 'PERIODE', valeur: string | null }] }` —
    les valeurs du contenu de l'estampille (la version scellée si elle l'est), dans l'ordre du formulaire. Refus : `404
    OBLIGATION_INTROUVABLE`, `409 DECLARATION_NON_VALIDEE`, `409 OBLIGATION_DESACTIVEE`, `422
    FORMAT_DE_CANAL_NON_DECLARE`, `422 FORMAT_DE_CANAL_ILLISIBLE`, **`422 FORMAT_DE_CANAL_AUTRE_NATURE`** (`{ nature
    }`), **`422 FORMAT_DE_CANAL_INCOMPLET`** (`{ champ }`), **`422 VALEUR_DE_CANAL_ABSENTE`** (`{ champ, valeur }`),
    **`422 VALEUR_DE_CANAL_HORS_CONTRAINTE`** (`{ champ, contrainte }`), `502 PAQUET_DEPOT_INTEGRITE`, `502
    VERSION_SCELLEE_INTROUVABLE`.
  - **Changé** : `POST /api/v1/livrables-declaration/{obligationId}` (330) rend `422 FORMAT_DE_CANAL_AUTRE_NATURE` (`{
    nature: 'SAISIE_FORMULAIRE' }`) sur une déclaration que seul un formulaire décrit (elle rendait
    `FORMAT_DE_CANAL_NON_DECLARE`). `POST /api/v1/depots-declaration` et `GET /api/v1/depots-declaration/{depotId}`
    gagnent **`nature`** (`TELEVERSEMENT_FICHIER` | `SAISIE_FORMULAIRE` | `null`) ; le `format` d'une TVA sur dimana y
    est la référence de `TG × TVA` 1.0 (il valait `null`). Toujours aucun champ d'accusé.
  - **Données** : le paquet de formulaire `TG × TVA` 1.0 (dimana), `statut: 'amorce'` (Q-D-28) ; le GUDEF reste `TG ×
    DSF` 1.3. Aucun topic, droit, acte ni stockage. **→ A (plus tard)** : FE-081 lit `nature` pour choisir l'écran
    (téléverser ou recopier) ; 332 affichera les valeurs dans l'ordre.

- **PUBLIÉ (2026-11-26, STORY-330 : prospera-fiscal-service#76, `dev` `7d48fd9`) sans écart ; ANNONCÉ (2026-11-26,
  STORY-330, avant le code, prospera-stories#978, `main` 6f6b797) — le livrable d'une déclaration et le dépôt engagé**
  (`prospera-fiscal-service`, modules `livrables-depot` et `depots`). Fiche : `stories/STORY-330.md` (D-330-1 → 16,
  section « Contrat »). **Ajouts seuls** : aucune route, aucun champ, aucun topic existant ne change ; la route de 537
  (`POST /livrables-depot/{pays}/{etat}`) et la chaîne de 538 (`/depots`) restent identiques.
  - **`POST /api/v1/livrables-declaration/{obligationId}`** (droit `fiscalite:declaration:preparer`) : multipart de 537
    moins `dossierId` (pris sur l'obligation) ; le format est celui que le `gabarit` de l'obligation nomme ; la
    déclaration doit être `VALIDEE` ou au-delà. 200 : le classeur rempli, en-têtes de 537 **+ `X-Declaration-Version` +
    `X-Declaration-Empreinte`** (la version scellée si elle l'est, sinon le contenu courant). Refus neufs : `409
    DECLARATION_NON_VALIDEE`, `422 FORMAT_DE_CANAL_NON_DECLARE` (`{ champ: 'gabarit', canal }`), `422
    FORMAT_DE_CANAL_ILLISIBLE` ; plus `404 OBLIGATION_INTROUVABLE`, `409 OBLIGATION_DESACTIVEE`, `422
    PAQUET_DEPOT_NON_PUBLIE` et ceux de 537.
  - **`POST /api/v1/depots-declaration`** (droit `fiscalite:declaration:deposer`) : corps `{ obligationId, numero,
    empreinte }` ; 201 (créé) ou 200 (rejeu) `{ depotId, obligationId, dossierId, numero, empreinte, canal, format |
    null, mode: 'ASSISTE', statut: 'ENGAGE', engagePar, engageLe, rejoue }` — **aucun champ d'accusé** (AD-12 : il
    arrivera comme un fait séparé, 333). L'obligation reste à `A_DEPOSER` (Q-D-27). Refus : `409 DEPOT_NON_ENGAGEABLE`,
    `409 LIVRABLE_PERIME`, `409 ENGAGEMENT_CONCURRENT`, `409 OBLIGATION_DESACTIVEE`, `404 OBLIGATION_INTROUVABLE`, `422`
    du format.
  - **`GET /api/v1/depots-declaration/{depotId}`** : le dépôt engagé + `statut` (`ENGAGE` | `REMPLACE`), `remplacePar`,
    `perime`, `statutObligation` ; `404 DEPOT_INTROUVABLE`.
  - **Journal chaîné** : périmètre `depot-declaration:<depotId>`, actes `DEPOT_DECLARATION_ENGAGE` et
    `DEPOT_DECLARATION_REMPLACE`. Aucun topic, aucun droit neuf.
  - **→ A (plus tard)** : l'écran du livrable d'une déclaration et de son engagement (FE-081). **→ C** : rien à faire.

- **PUBLIÉ (2026-11-26, STORY-1141 : prospera-paiement-service#126, `dev` `f6a4800`, `64b5838` ;
  prospera-ventes-service#17, `dev` `dcb5d3b`) sans écart ; ANNONCÉ (2026-11-26, avant le code, prospera-stories#967,
  `main` 6a5d3ab) — le numéro de compte imprimable sur la facture (Q-D-15)** (`prospera-paiement-service`, prêté par B pour cette story, #936 ; `prospera-ventes-service`, module
  `facturation`). Fiche : `stories/STORY-1141.md` (D-1141-1 → 11, section « Contrat »). **Ajouts seuls** : aucun champ,
  aucune route, aucun topic existant n'est renommé ni retiré.
  - **`paiement`, déclaration** (`POST /api/v1/comptes-encaissement` et sa route déléguée `POST
    /api/v1/admin/organisations/{orgId}/comptes-encaissement`) : corps + **`numeroImprimable`** facultatif (chaîne,
    80 au plus ; normalisé : espaces réduits, majuscules ; `^\+?[A-Z0-9]+( [A-Z0-9]+)*$`, 4 à 64 sans les espaces) ;
    servi pour `BANCAIRE` et `MOBILE_MONEY` seulement ; il doit finir, sans ses espaces, par les quatre caractères
    visibles de l'empreinte. Refus neufs : `400 COMPTE_NUMERO_IMPRIMABLE_INVALIDE`, `422
    COMPTE_NUMERO_IMPRIMABLE_NON_SERVI`, `422 COMPTE_NUMERO_IMPRIMABLE_DISCORDANT`.
  - **`paiement`, route neuve** `PUT /api/v1/comptes-encaissement/{compteId}/numero-imprimable` et sa route déléguée
    `PUT /api/v1/admin/organisations/{orgId}/comptes-encaissement/{compteId}/numero-imprimable` : corps `{
    numeroImprimable: string | null }` (clé exigée, aucune autre ; `null` retire), droit `paiement:compte:administrer` ;
    200 la vue du compte (le même numéro reposé : 200, rien d'écrit ni de publié) ; 404 commun ; les trois refus
    ci-dessus ; `409 ECRITURE_CONCURRENTE`. **Vue du compte** : + `numeroImprimable` (absent si rien).
  - **`paiement.compte.changed@1`** (sujet `paiement.compte.changed-value`, BACKWARD) : + **`numeroImprimable`**
    facultatif, **absent** quand rien n'est déclaré (jamais `null`), absent toujours pour `PI_SPI` et `MARCHAND` ; le
    fait part aussi au changement du numéro, à la révision de son acte. Topic toujours `@1`. Pour son seul consommateur
    (`facturation`, D) : rien à faire avant la PR de `ventes` (sa lecture ignore un champ inconnu).
  - **Journal chaîné du compte** : acte neuf `COMPTE_ENCAISSEMENT_NUMERO_IMPRIMABLE_DECLARE` (`…_PAR_MONEY_VIBES`
    délégué ; phrase au client) — `compteId`, `empreinteVisible`, `empreinteNumeroImprimableAvant`,
    `empreinteNumeroImprimableApres` (SHA-256 du numéro normalisé, ou `null`) ; la déclaration gagne
    `empreinteNumeroImprimable` quand un numéro est déclaré. Jamais le numéro en clair au journal (ineffaçable ; son
    tamis refuse un numéro de téléphone).
  - **Manifeste `paiement` 1.1.0 → 1.2.0** à la source (C5 : la propriété facultative du fait, la route d'écriture,
    hors `routesLectureSeule`) — **→ B** : la recopie au catalogue (demandée dans la PR de docs finale).
  - **`ventes` (`facturation`)** : projection `facturation_comptes_lus` + `numeroImprimable` (`null` si absent ; une
    révision sans la clé le retire) ; facture lue (`mentions.emetteur.comptes[]`) : `numero` est le numéro déclaré,
    en entier, quand il existe (sinon la destination PI-SPI ou l'empreinte, D-1073-6) ; + **`origineDuNumero`**
    (`DESTINATION_PI_SPI` | `NUMERO_IMPRIMABLE` | `EMPREINTE_VISIBLE`) sur les factures émises depuis 1141. Aucune
    route, aucun droit, aucun topic neuf ; manifeste `facturation` inchangé. Pour les lecteurs de la facture (A, écran) :
    rien d'obligatoire (champ neuf facultatif).

- **PUBLIÉ (2026-11-26, STORY-349, prospera-fiscal-service#73, `dev` `136efdf`) sans écart ; ANNONCÉ (2026-11-26,
  STORY-349, avant le code, prospera-stories#962) — les obligations sociales d'une période naissent de l'écriture de sa
  base** (`prospera-fiscal-service`, dossier `remuneration`). Fiche : `stories/STORY-349.md` (D-349-1 → 8, section
  « Contrat »). **Un champ ajouté**, aucune route neuve :
  - `PUT /api/v1/dossiers/{dossierId}/remuneration/{periode}` et `POST …/{periode}/import` : statuts, refus et gardes
    inchangés ; leur réponse gagne **`obligationsSociales`** (toujours présent après une écriture réussie) —
    `DERIVEES` : `{ statut, paquet { code, version }, enregistrement { creees, actualisees, inchangees }, obligations[]
    { taxe: COTISATIONS_SOCIALES | RETENUE_IRPP, periode, echeance | null, derivable, motifNonDerivable,
    detailNonDerivable }, ecartees[] { taxe, motif: CATALOGUE_LA_PORTE } }` · `NON_DERIVEES` : `{ statut, refus { code,
    message } }` (le refus du paquet, tel quel ; la base est écrite).
  - **Au calendrier** (routes de C, inchangées) : deux obligations de plus par période qui a une base — redevable
    `entreprise`, implantation `principale`, période `AAAA-MM`, échéance lue au paquet (`cnss.collecte`,
    `irpp.retenueALaSource.reversement`), non datée et nommée (`ECHEANCE_ABSENTE_DU_PAQUET`) si le paquet ne la déclare
    pas ; même cycle, mêmes actes d'audit (`OBLIGATION_DERIVEE`, `OBLIGATION_TRANSITION`…).
  - Aucun droit, topic, collection ni migration. **→ A (écrans, plus tard)** : afficher `obligationsSociales` après la
    saisie ou l'import (`NON_DERIVEES` : le message tel quel) ; les deux taxes au filtre du calendrier.
- **PUBLIÉ (2026-11-26, STORY-1140, prospera-bilan-service#195, `dev` `c29fcc2`, `7f96163`) sans écart, et rangé au
  contrat de B (`contrats-instance-v1.1`, d68a468 : `export-c13-reponse@1`, `export-c13-csv@1`, recopiés à l'octet) ;
  ANNONCÉ (2026-11-26, STORY-1140, avant le code, prospera-stories#953) — l'export C13 du bilan aussi en CSV, à la forme
  par objet de balance** (`prospera-bilan-service`, Q-D-19). Fiche : `stories/STORY-1140.md` (D-1140-1 → 8, section « Contrat »).
  **Ajouts seuls** sur la route existante `GET /api/v1/instance/bilan/{organisationId}/export` (identité `MOTEUR`
  seule, limitée à l'organisation du chemin : inchangé) ; l'enveloppe JSON de 1075 ne change pas.
  - **Deux paramètres de requête, facultatifs** : `format` (`json` par défaut | `csv`) ; `objet` (un objet du plan :
    `jeux-etats`, `snapshots-liasse`, `jeux-hypotheses`, `versions-hypotheses`, `mapping-overrides`, `exercices`,
    `reperes-analyse`, `audit-events`), **exigé en CSV**, et qui réduit aussi le JSON à cet objet.
  - **200 CSV** : `text/csv; charset=utf-8`, pièce jointe `export-bilan-<objet>-<organisationId>.csv` ; BOM UTF-8, `;`,
    CRLF, RFC 4180 ; en-tête = chemins des champs dans l'ordre de leur première apparition, puis une ligne par document ;
    sous-document `a.b`, valeur Extended JSON en feuille, tableau en JSON, absent ou `null` vide ; texte neutralisé
    (`= + - @`, tabulation, CR ⇒ apostrophe) puis échappé, nombre et booléen seulement échappés. **La forme de balance
    (D-1021-7), à l'octet** : mêmes vecteurs de test.
  - **En-tête neuf** (JSON et CSV) : `Cache-Control: no-store`.
  - **Refus, avant toute lecture** (après l'identité) : **400 `FORMAT_NON_SERVI`** (`details.formatsServis`), **400
    `OBJET_REQUIS`** (`details.objetsServis`), **422 `OBJET_INCONNU`** (`details.objetsServis`) ; puis 403
    `BILAN_NOT_ENTITLED` (inchangé). Deux codes neufs à `CODES_REFUS_C13` (ceux de balance).
  - **Ce qui ne change pas** : plans C13, santé, `migrer`, import, effacement ; manifeste `bilan` (rien à recopier au
    catalogue) ; aucun topic, aucune collection, aucun droit. **→ B** : le contrat à publier (« Demandes »). **→ A** :
    rien (aucune route d'écran).

- **PUBLIÉ (2026-11-26, STORY-1139, prospera-bilan-service#194, `dev` `027075d`) sans écart ; ANNONCÉ (2026-11-26, STORY-1139, avant le code, prospera-stories#946) — les repères de l'analyse financière, modifiables par dossier et
  tracés** (`prospera-bilan-service`). Fiche : `stories/STORY-1139.md` (D-1139-1 → 12, tableau « Contrat » ; Q-D-23).
  **Ajouts seuls** : aucun champ, aucune route, aucune valeur d'énumération existante ne change ni ne disparaît.
  - **Trois routes neuves**, nichées sous le dossier, gardées comme le reste du module (`@RequiresBilanAccess`, état
    publié) : `GET /api/v1/dossiers/{dossierId}/bilan/analyse/reperes` (`TENANT_ADMIN` | `TENANT_USER` : les 19
    indicateurs, `version` 0 si jamais modifié, `statut` `PAQUET` | `DECLARE` | `SANS_REPERE`, `sens`, `bornes`, `source`,
    `nature` `REGLEMENTAIRE` | `CONTRACTUEL` | `USAGE` | `AVIS_PROFESSIONNEL`, `motif`, `modifiePar`, `modifieLe`) ;
    `GET …/analyse/reperes/{indicateur}/journal` (mêmes rôles : chaque version, `par`, `le`, `motif`, `avant`, `apres`) ;
    **`PUT …/analyse/reperes/{indicateur}`** (`TENANT_ADMIN` seul ; corps fermé `{ versionAttendue, statut, sens?, bornes?,
    source?, nature?, motif }` ; refus `400 INDICATEUR_INCONNU`, `409 REPERE_CONCURRENT`, `422 REPERE_INVALIDE`,
    `422 REPERE_INCHANGE`).
  - **Réponse d'analyse** (`GET …/bilan/analyse`, `POST …/analyse/dry-run`) : `indicateurs[].seuilApplique` gagne
    `origine` (`PAQUET` | `DOSSIER`) et `repereDossier` (`{ version, nature, modifieLe }` ou `null`). Un repère
    `SANS_REPERE` du dossier rend `AUCUN_REPERE_DECLARE` (valeur existante) même si le paquet en porte un.
  - **Collection neuve `reperes_analyse`** (append-only, par organisation et dossier) : au **plan d'effacement** (par
    `tenantId`) et au **plan d'export C13** (objet `reperes-analyse`). Aucune migration. Aucun droit neuf (rôles seuls) :
    **rien à demander à B**. Aucun topic, aucun paquet ne change (les seize restent sans repère : aucune source sur la
    même formule, fiche).
  - **→ A (plus tard)** : l'écran de l'analyse peut afficher `origine` et la source du dossier, et offrir au
    `TENANT_ADMIN` la modification et le journal.

- **PUBLIÉ (2026-11-26, STORY-1138, prospera-bilan-service#193, `dev` `65eecdc`) sans écart ; ANNONCÉ (2026-11-26, avant le code, prospera-stories#937) — la liasse rapprochée de sa balance par l'empreinte des soldes**
  (`prospera-bilan-service`). Fiche : `stories/STORY-1138.md` (D-1138-1 → 11, tableau « Contrat »). **Ajouts seuls** :
  aucun champ, aucune route, aucune valeur d'énumération existante ne change ni ne disparaît ; aucune collection neuve,
  aucune migration ; plans C13 d'export et d'effacement inchangés (`balances_balance` y est déjà).
  - **Événements consommés** (contrat de C, STORY-1022, inchangé chez C) : `balance.created` et
    `balance.etat.document.change` sont lus avec `soldesChecksum` et `soldesChecksumVersion`, **ensemble ou pas du
    tout** ; une paire incomplète ou hors forme est ignorée sans faire rejeter le message.
  - **Read-model `balances_balance`** : deux champs facultatifs, sans défaut, `soldesChecksum`, `soldesChecksumVersion`
    (un `$set` qui ne les porte pas ne les efface pas).
  - **Réponse d'analyse** (`GET /dossiers/{id}/bilan/analyse` et `POST …/analyse/dry-run`) : bloc neuf
    **`rapprochementBalance`**, toujours présent, à côté de `controlesIntegrite` : `statut` (`CONCORDANT` | `DISCORDANT`
    | `NON_VERIFIABLE` | `SANS_EMPREINTE` | `NON_APPLICABLE`), `motif` (`VERSION_EMPREINTE_INCONNUE`,
    `BALANCE_INTROUVABLE`, `BALANCE_SCELLEE_V1`, `EMPREINTE_NON_RECUE`, `JEU_SANS_BALANCE`, `SOLDES_FOURNIS`, ou `null`
    pour les deux premiers statuts), `balanceId`, `balanceChecksumVersion` (le sceau, tel que publié), `soldesChecksumVersion`
    et `soldesChecksumPublie` (tels que publiés), `soldesChecksumRecalcule` (seulement sous une version connue : `soldes-v1`),
    `message`. Les soldes comparés sont ceux de la liasse servie (jeu, ou version figée demandée) ; la balance est celle que
    ce document nomme. **Un signal** : ni `valide`, ni la batterie, ni la liasse, ni le jeu ou ses snapshots ne changent.
  - **→ A (plus tard)** : l'écran de l'analyse peut afficher le bloc (`message` tel quel).

- **PUBLIÉ (2026-11-25, STORY-348, prospera-fiscal-service#67, `dev` `bc0c09f`) sans écart ; ANNONCÉ (2026-11-25, avant le code, prospera-stories#925) — le calcul des cotisations et des retenues** (`prospera-fiscal-service`,
  dossier `remuneration`). Fiche : `stories/STORY-348.md` (D-348-1 → 12, tableau « Contrat » ; Q-D-22).
  - **Route neuve** : `GET /api/v1/dossiers/{dossierId}/remuneration/{periode}/calcul` (`?version=` facultative ;
    garde fiscale, rôle `TENANT_ADMIN` | `TENANT_USER`, droit `fiscalite:declaration:preparer` : résultat par
    bénéficiaire, AD-21 ; aucun corps). 200 `{ origine, paquet { code, version, checksum }, lignes[], totaux,
    echeances[] }` ; une ligne : `{ beneficiaireId, typeBeneficiaire, cotisations, irpp }`, chacun `CALCULEE` (montants
    en francs entiers, branches, AMU, retenue du mois et étapes de l'IRPP avec leurs articles) ou `BLOQUEE` (`motif`,
    `manques[]`). Motifs : `REGIME_SOCIAL_NON_DETERMINE`, `PAQUET_INCOMPLET`, `PAQUET_INCOHERENT` (cotisations) ;
    `REVENU_CATEGORIEL_NON_COUVERT`, `REVENU_CATEGORIEL_INCONNU`, `PAQUET_INCOMPLET` (de C),
    `CHARGES_DE_FAMILLE_NON_RENSEIGNEES`, `COTISATIONS_NON_CALCULEES` (IRPP). Échéances `COTISATIONS_SOCIALES` et
    `RETENUE_IRPP` : `DECLAREE` (`exigibleLe`, `source`) ou `NON_DECLAREE` (`manque`). Refus : 400 `PERIODE_INVALIDE`,
    403, 404 `DOSSIER_INTROUVABLE` | `BASE_INTROUVABLE`, refus du paquet tels quels.
  - **Champ ajouté, facultatif** : `personnesACharge` (entier 0 → 99) dans `lignes[]` du `PUT
    …/remuneration/{periode}`, en colonne facultative du gabarit d'import (cellule vide ⇒ non renseigné), et dans
    `lignes[]` du détail (`null` si non renseigné). Sans lui, la retenue d'IRPP de la ligne est bloquée ; une base
    constituée avant 348 garde son empreinte.
  - Rien n'est renommé ; aucun topic, schéma de fait ni manifeste. **→ A** (écrans du cabinet, plus tard) : le champ à
    la saisie, le calcul de la période. **→ C** (350) : les totaux sans nom du calcul.
- **PUBLIÉ (2026-11-25, STORY-346, prospera-fiscal-service#64, `dev` `e4630f1`) sans écart ; ANNONCÉ (2026-11-25, avant le code) — l'import d'un fichier de paie** (`prospera-fiscal-service`,
  dossier `remuneration`). Fiche : `stories/STORY-346.md` (D-346-1 → 11, tableau « Contrat » ; Q-D-21).
  - **Route neuve** : `POST /api/v1/dossiers/{dossierId}/remuneration/{periode}/import` (garde fiscale, rôle
    `TENANT_ADMIN` | `TENANT_USER`, droit `fiscalite:declaration:preparer`, dossier dans la portée). Corps
    `multipart/form-data`, un seul champ `fichier`, 2 Mio au plus, aucun autre champ. 201 `CREEE` | 200 `INCHANGEE`,
    `{ statut, version, lignesLues }` (`version` : la `VersionDeBase` de 345, `provenance` `IMPORT` si elle est créée).
  - **Le gabarit** (D-346-1 → 4) : CSV UTF-8 (BOM permis), `;`, `,` ou tabulation, guillemets RFC 4180 ; en-tête aux
    noms des champs de la saisie, sans casse : `beneficiaireId`, `designation`, `typeBeneficiaire` (obligatoires),
    `redevableId`, `periode`, `salaireDeBase`, `primes`, `gratifications`, `commissions`, `avantagesEnNature`,
    `remboursementsDeFrais` (facultatives, vide ⇒ 0) ; toute autre colonne refuse le fichier. Montants : francs CFA
    entiers, groupes de trois séparés par une espace permis ; point, virgule ou signe refusés.
  - **Refus publiés** : 400 `FICHIER_ABSENT`, `MULTIPART_INVALIDE`, `ENCODAGE_INVALIDE`, `FICHIER_ILLISIBLE`,
    `EN_TETE_INVALIDE` (`details.manquantes`, `inconnues`, `enDouble`), `BASE_TROP_GRANDE`, `PERIODE_INVALIDE` ; 404
    `DOSSIER_INTROUVABLE` ; 409 `DOSSIER_ARCHIVE`, `BASE_CONCURRENTE` ; 413 `FICHIER_TROP_VOLUMINEUX` ; 422
    **`IMPORT_REFUSE`** (`details.erreurs[] { ligne, code, message }` — les 100 premières —, `nombreErreurs`,
    `lignesLues` ; tout ou rien, NFR-F16), `BASE_VIDE`. Codes d'une ligne : ceux de la saisie, plus
    `COLONNES_EN_NOMBRE_INCORRECT` et `PERIODE_DISCORDANTE`.
  - Aucune route existante ne change ; aucun topic, schéma de fait ni manifeste. **→ A** (écran du cabinet, plus tard) :
    l'import et l'affichage du rapport d'erreurs ; l'en-tête du gabarit est dans la description OpenAPI (pas de route de
    gabarit, D-346-10).

- **PUBLIÉ (2026-11-25, STORY-560, prospera-fiscal-service#63, `dev` `cf8b583`) ; ANNONCÉ avant le code (#905), deux
  écarts** : (1) les révocations du cabinet (`…/mandat/revocation`, `…/secret/revocation`) n'ont **pas de corps** (le
  `motif` annoncé est retiré) et sont idempotentes ; (2) un acte de plus au journal, `COFFRE_USAGE_TERMINE`
  (`resultat` `TERMINE` | `ECHEC`). Et un code commun neuf, `CORPS_ILLISIBLE` (400, tout le service : « ⚠ Communs »).
  Annonce :
- **ANNONCÉ (2026-11-25, STORY-560, avant le code) — le coffre des secrets de canal** (`prospera-fiscal-service`,
  module neuf `coffre-secrets`). Fiche : `stories/STORY-560.md` (D-560-1 → 15, tableau « Contrat »). **AD-13 est
  amendé** (spine du fiscal, même PR de docs) : « aucun secret de canal n'entre hors du coffre, et aucun n'en sort en
  clair ».
  - **Routes du cabinet** (garde fiscale, dossier dans la portée de l'appelant, droit `fiscalite:declaration:deposer`
    pour les écritures ; aucun droit neuf) : `GET /api/v1/dossiers/{dossierId}/coffre` et `…/coffre/{canal}` (l'état :
    `chemin` `AUTOMATISABLE` | `ASSISTE`, `raison`, mandat et secret par leur état, dates, `joursRestants`,
    `aRenouveler` à 15 jours ; **jamais une valeur**) ; `POST …/coffre/{canal}/mandat` (`reference`, `signeLe`,
    `valableJusquAu`, `actes` ⊂ `DEPOSER`, `SUIVRE`) ; `POST …/mandat/revocation` ; `POST …/liens-de-depot` (jeton
    rendu une fois, 72 h, usage unique) ; `POST …/secret/revocation`.
  - **Routes publiques du client** (sans compte, jeton dans le corps, 10 par minute) : `POST /api/v1/coffre/depots`
    (`jeton`, `identifiant`, `motDePasse`, `expireLe` ≤ 365 jours ; rend un jeton de révocation une fois ; tout autre
    champ, un code MFA compris, est refusé) ; `POST /api/v1/coffre/revocations` (`jeton`).
  - **Port en mémoire pour 561** : `UsageSecretDeCanal` — `emettre` (jeton d'usage de 5 minutes, à usage unique, lié à
    un `depotId` et à un acte) et `utiliser(jeton, depotId, travail)` ; le clair n'existe que dans `travail`.
  - **Refus publiés** : `CANAL_INVALIDE`, `MANDAT_DATES_INVALIDES`, `SECRET_EXPIRATION_INVALIDE` (400) ;
    `DOSSIER_INTROUVABLE`, `LIEN_DE_DEPOT_INVALIDE`, `JETON_DE_REVOCATION_INVALIDE` (404) ; `DOSSIER_ARCHIVE`,
    `COFFRE_CONCURRENT` (409) ; `MANDAT_ABSENT`, `MANDAT_EXPIRE`, `MANDAT_REVOQUE`, `MANDAT_NON_COUVRANT` (422) ;
    `COFFRE_NON_CONFIGURE` (503) ; au port : `SECRET_ABSENT`, `SECRET_EXPIRE`, `SECRET_REVOQUE`, `JETON_USAGE_*`.
  - **Variables** : `COFFRE_CLE_MAITRE` (32 octets en base64 ; absente ⇒ coffre `NON_CONFIGURE`, le service démarre ;
    mal formée ⇒ refus de démarrer), `COFFRE_CLE_ID` (défaut `cle-1`). **Pour la recette (B)** : aucune variable
    n'est exigée ; poser une clé de test pour jouer le coffre.
  - Aucun topic, aucun schéma de fait, aucun manifeste ne change. **→ A** (écrans du cabinet, plus tard) : l'état du
    coffre et l'émission du lien ; **→ B** : l'envoi du lien au client par `notification` est un reste, pas une demande.

- **PUBLIÉ (2026-11-25, STORY-1075, prospera-bilan-service#192, `dev` `993b78f`, `4317dd2`) ; ANNONCÉ avant la fusion du
  code (prospera-stories #885, `main` b2eadd0), deux écarts écrits ci-dessous — Les routes d'instance `export`,
  `sante` et `migrer` du bilan.** Fiche : `stories/STORY-1075.md` (D-1075-1 → 13 ; Q-D-18 → 20, choix par défaut).
  **Écarts à l'annonce, vus sur la pile** : (1) `DEGRADE` aussi quand **Kafka ne répond pas** (la santé lit la sonde
  Kafka de `/health`, broker borné à 5 s : le registre des consommateurs seul ne voyait pas un broker arrêté) ; (2) les
  objets de l'export sont nommés au **motif des objets C13** (`jeux-etats`, `snapshots-liasse`, … ; `collection` donne
  le nom d'origine). Aucun champ, aucun topic, aucune garde métier ne change ; le manifeste `bilan` (1.0.0) non plus.
  - **Routes neuves** (contrôleur existant `instance/bilan`, identité `MOTEUR` seule, hors limite de débit, **dans les
    deux espaces**) :
    - `GET /api/v1/instance/bilan/{organisationId}/export` (limitée à l'organisation du chemin) : 200, une enveloppe JSON
      `{ schemaVersion: 1, module: 'bilan', organisationId, espace, exporteLe, objets: [{ objet, nombre, enregistrements }] }`,
      documents en MongoDB Extended JSON (relaxed) : `jeux_etats`, `snapshots_liasse`, `jeux_hypotheses`,
      `versions_hypotheses`, `mapping_overrides`, `exercices`, `audit_events` (forme par défaut, **Q-D-19** : la
      plateforme n'en publie aucune ; pas de CSV). État publié absent ou `NON_INSTALLE` ⇒ **403 `BILAN_NOT_ENTITLED`**,
      aucune donnée ; tout autre état ⇒ 200 (`SUSPENDU` compris, C2). L'utilisateur détenteur de
      `instance:donnees:exporter` n'est pas servi (**Q-D-18** : AD-37, l'export de l'écran passe par la partie A).
    - `GET /api/v1/instance/bilan/{organisationId}/sante` (limitée à l'organisation du chemin) : 200 **`sante@1`**
      (`OK`, ou `DEGRADE` + `raison` : MongoDB non connecté, consommateur hors groupe ou bloqué) ; jamais un refus pour
      la santé ; quel que soit l'état publié. Copie à l'octet de `prospera-plateforme@contrats-instance-v1`
      (`contrats/reprise/sante.schema.json`, sha256 `74b74a6c…`).
    - `POST /api/v1/instance/bilan/migrer` (le moteur, quelle que soit l'organisation de son jeton ; sans corps) : joue
      `dossiers-d8` (STORY-356/357, idempotente) ; 200 `{ schemaVersion: 1, module: 'bilan', statut: 'MIGRE',
      migrations: [{ code, ...rapport }] }` ; orphelins ⇒ **409 `MIGRATION_INCOMPLETE`** avec le rapport (forme par
      défaut, **Q-D-20**).
  - **Refus** : jeton d'utilisateur ⇒ 403 `IDENTITE_DE_SERVICE_REQUISE` ; autre organisation ⇒ 403
    `ORGANISATION_HORS_JETON` ; autre identité de service ⇒ 403 `IDENTITE_DE_SERVICE_REFUSEE` ; sans jeton 401. Deux codes
    neufs à l'inventaire C13 : `BILAN_NOT_ENTITLED` (déjà celui de la garde de bilan), `MIGRATION_INCOMPLETE`.
  - **L'aller-retour export → effacement → import** n'est pas possible pour `bilan` : l'import n'a aucun objet (D-928-5).
  - **Pour B (catalogue, agent, recette)** : rien à recopier (manifeste inchangé) ; le moteur peut appeler les trois
    routes aux chemins du manifeste ; publier un contrat d'export et de `migrer` dans `prospera-plateforme` tranchera
    Q-D-19 et Q-D-20 (bilan suivra). **Pour A** : rien (aucune route d'écran).

- **PUBLIÉ (2026-11-25, STORY-1074, prospera-bilan-service#191, `dev` 130f8a5, c0dc720) ; ANNONCÉ avant la fusion du
  code (prospera-stories #883, `main` bd83fda), sans écart. — La consolidation s'installe à part : sa garde propre et
  ses trois vérifications.** Fiche : `stories/STORY-1074.md` (D-1074-1 → 11).
  - **Ce qui change (comportement)** : chaque route de `dossiers/:dossierId/consolidation/…` (douze contrôleurs, 50
    routes) exige l'état publié du module **`consolidation`** en plus de celui de `bilan` : une organisation qui a
    `bilan` sans `consolidation` (état inconnu, `NON_INSTALLE`, `ESSAI_TERMINE`, `DESINSTALLE`, `SUSPENDU`) reçoit **403
    `CONSOLIDATION_NOT_ENTITLED`** (code neuf), avant la portée du dossier et du groupe ; `LECTURE_SEULE` ⇒ les
    lectures passent, une écriture rend 403 `ABONNEMENT_EXPIRE`. Dans l'espace d'essai, le KYC n'est pas lu (règle de
    STORY-1079). **Aujourd'hui, aucun état n'est publié pour `consolidation` : toutes ces routes ferment.**
  - **Route neuve** : `POST /api/v1/instance/consolidation/{organisationId}/verifications/{code}` (identité `MOTEUR`,
    limitée à l'organisation du chemin ; `verification-installation@1`) : `perimetre-arrete`, `ecritures-equilibrees`,
    `gate-consolidation` — telles que le manifeste M45 les déclare. 404 `VERIFICATION_INCONNUE` pour un autre code.
  - **Collection neuve** : `etats_publies_consolidation` (projection de `etat-publie.changed.<espace>`, même enveloppe,
    aucun topic neuf), effacée par le plan C13.
  - **OpenAPI** : l'enum de `RefusConsolidationDto` gagne `CONSOLIDATION_NOT_ENTITLED` et `ABONNEMENT_EXPIRE` (ce
    dernier était déjà rendu par la garde de bilan, non inventorié).
  - **Ce qui ne change pas** : le manifeste `consolidation` (1.0.0, à la source et au catalogue : **aucune recopie
    demandée**) ; les routes hors consolidation ; les rôles (les droits C7 `consolidation:*` ne sont pas lus).
  - **Pour A (app, écrans de consolidation)** : régénérer les types (deux codes de plus) ; un cabinet sans le module voit
    `CONSOLIDATION_NOT_ENTITLED` (proposer l'option), plus seulement `BILAN_NOT_ENTITLED`.
  - **Pour B (catalogue, recette)** : pour ouvrir `consolidation` par le moteur, l'adresse de bilan-service pour ses
    vérifications (comme `bilan`) et `consolidation` dans `INSTALLATION_SERVICES` de la recette quand une recette
    l'installera ; rien à faire pour les recettes actuelles (aucune n'appelle une route de consolidation).

- **PUBLIÉ (2026-11-25, STORY-1079, prospera-bilan-service#190, `dev` 7ed3335, 2d186b9) ; ANNONCÉ avant la fusion du
  code (prospera-stories #877, `main` 36ccec7), sans écart. — Dans l'espace d'essai, la garde de bilan (et celle du
  module `financement`) ne lit plus le KYC : l'état publié décide seul.** Fiche : `stories/STORY-1079.md` (D-1079-1 →
  6 ; Q-D-17, choix par défaut). **Aucun champ, aucune route, aucun code d'erreur, aucun topic ne change ; un
  comportement, si — et dans l'essai seulement.**
  - **Ce qui change** : sur une instance `INSTANCE_ESPACE=ESSAI`, `@RequiresBilanAccess` et `@RequiresFinancementAccess`
    ne rendent plus `403 KYC_NOT_APPROVED` et ne lisent plus le read-model KYC ; l'e-mail vérifié (`EMAIL_NOT_VERIFIED`,
    en premier) et l'état publié du module (`BILAN_NOT_ENTITLED` / `FINANCEMENT_NOT_ENTITLED` / `ABONNEMENT_EXPIRE`,
    garde partagée) restent exigés, dans le même ordre ; le droit de la route du financement aussi.
  - **Ce qui ne change pas** : sur une instance réelle (`INSTANCE_ESPACE=REEL` ou absente), rien. L'espace vient de la
    configuration de l'instance, validée au démarrage — jamais du jeton, d'un en-tête, d'un paramètre ni du message
    projeté. Une garde sans espace fourni exige le KYC (fail-closed).
  - **Pour B (recette de l'essai, ticket point 3 puis « la recette lève `dossier`, `balance` et `bilan` »)** : poser
    `INSTANCE_ESPACE=ESSAI` sur le `bilan-service` de l'espace d'essai de la pile (il lit déjà par là le topic
    `etat-publie.changed.essai`) ; aucun KYC à semer.
  - **Pour A (console, app)** : aucun type à régénérer ; dans l'essai, l'écran ne verra plus `KYC_NOT_APPROVED` sur le
    bilan.

- **PUBLIÉ (2026-11-25, STORY-1118, prospera-bilan-service#189, `dev` b6f2d49, 5055933) ; ANNONCÉ avant la fusion du
  code (prospera-stories #872, `main` 651d4d6), sans écart. — Les amortissements et les dépréciations rattachés au
  poste de leur actif : LES MONTANTS DES LIASSES CHANGENT.** Fiche :
  `stories/STORY-1118.md` (D-1118-1 → 10). **Aucun champ, aucune route, aucune valeur d'énumération ne change ;
  les valeurs, si.**
  - **Ce qui change** : les tables de passage de `syscohada-revise@2.1`, `@2.2`, `@2.3`, `zone-franche-togo@1.0` et
    `smt-togo@1.0` rattachent les comptes `28`, `29`, `39`, `49` (hors `499`) et `59` (hors `599`) au poste de leur
    actif (subdivision « à l'image », Guide d'application du SYSCOHADA révisé p. 68, 81, 329 ; AUDCIF art. 47) : `2845`
    → `AN`, `28441` → `AM`, `391` → `BB`, `491` → `BI`, `590` → `BQ`… (table complète : fiche, D-1118-2 ; SMT : `AC1`,
    `AC2`, `AC3`, `AC5`). **Pour toute balance qui porte l'un de ces comptes** : la colonne « Amort./Dépréc. » de
    l'actif se remplit, le net baisse d'autant, le bilan s'équilibre, `comptesNonMappes` et `COMPTES_NON_AFFECTES` ne
    les nomment plus, `EQUILIBRE_BILAN` passe `OK`, la liasse devient validable ; les indicateurs d'analyse (FRNG,
    BFR, poids des capitaux propres, liquidité…) et l'identité du fonds de roulement de 1078 (`OK` au lieu
    d'`INDETERMINE`) suivent. Cas du ticket : `AM` net 1 000 000 → **600 000**, FRNG −200 000 → **+200 000**. Une
    balance sans ces comptes : rien ne bouge.
  - **Plans de comptes** : +117 comptes officiels (281 → 2848, 291 → 2978, 391 → 398, 490 → 4983, 590 → 594) dans les
    cinq paquets (libellés servis par la route catalogue).
  - **Révision EN PLACE** (D-1118-5), les versions ne bougent pas : les liasses validées ou figées restent figées
    (snapshot et tampon complet, ancienne empreinte), jamais reproduites ; les brouillons se recalculent avec la table
    corrigée. `MOTEUR_VERSION` inchangée (`bilan-engine@1.24.0`).
  - **Empreintes** : `syscohada-revise@2.1` `3880b6c2b9ccef9cc063258489f8df1d130a77adb02b4da2616d9ae7e1c05c8b`, `@2.2`
    `16071b45406637e9714c2ee58860536c88915649efa53b75939e8d7b78237df5`, `@2.3`
    `ea5798e908f6e3f3cb5576ce04dbaa66543e2a571d2c3fa28e26ed917540f5d0`, `zone-franche-togo@1.0`
    `58e5bc9962bcfc41286f3621538b34eaeb22dcfad1f794d9d8ac0085a220d5eb`, `smt-togo@1.0`
    `5b614bd829b06c73b3b5988e18f1f778e208d71e8468544ffc35ef220e1d37b4`. Aucun autre paquet ne bouge.
  - **Garde de packaging** neuve (`scripts/referentiels/gardes-nomenclature.mjs`) : un paquet bâti sur le plan SYSCOHADA
    qui laisse un compte de bilan sans poste, ou range une contrepartie hors du poste de son actif, ne se package plus.
  - **Pour A (FE-141, écrans de la liasse)** : aucun type à régénérer ; les montants affichés changent pour une balance
    amortie (et deviennent justes).
  - **`balance-service` (C)** : recopie à l'octet de **quatre** artefacts (`syscohada-revise-2.1/2.2/2.3.json` et
    `smt-togo-1.0.json`), ticket de recopie de 1076 mis à jour ; effet en balance : libellés plus précis des comptes
    `28x`… (le plan s'enrichit), aucune classe ne change.

- **PUBLIÉ (2026-11-25, STORY-1078, prospera-bilan-service#188, `dev` d2c65c6) ; ANNONCÉ avant la fusion du code
  (prospera-stories #865, `main` d206f38), sans écart. — Les
  quatre contrôles d'intégrité de la liasse, dans la réponse d'analyse.** Fiche : `stories/STORY-1078.md` (D-1078-1 →
  11). **Ajouts seuls** : aucun champ, aucune route, aucune valeur d'énumération existante ne change ni ne disparaît.
  - **Réponse d'analyse** (`GET /dossiers/{id}/bilan/analyse` et `POST …/analyse/dry-run`) : liste neuve
    **`controlesIntegrite`**, toujours présente, **quatre entrées dans cet ordre** : `IDENTITE_FRNG_BFR_TRESORERIE`
    (FRNG = besoin de financement global + trésorerie nette, écarts de conversion éliminés : Note 34 du SYSCOHADA
    révisé), `CAISSE_CREDITRICE`, `AMORTISSEMENTS_SUPERIEURS_AU_BRUT` (AUDCIF 45-47), `PERTE_CHANGE_SANS_PROVISION`
    (AUDCIF 54). Chaque entrée : `code`, `libelle`, `statut` (`OK` | `ANOMALIE` | `INDETERMINE` | `NON_APPLICABLE`),
    `motif` (`PAQUET_SANS_CONTROLE`, `CONTROLE_NON_DECLARE`, `BILAN_DESEQUILIBRE`, ou un motif d'indétermination des
    indicateurs : `MARQUEUR_ABSENT`, `MONTANT_HORS_BORNES`…, sinon `null`), **`termes`** (`{ code, libelle, montant }` ;
    codes `FRNG`, `BFR`, `TRESORERIE_NETTE`, `ECART_CONVERSION_ACTIF`, `ECART_CONVERSION_PASSIF`, `ECART`,
    `ECART_EQUILIBRE_BILAN`, `SOLDES_CREDITEURS_CAISSE`, `EXCEDENT_AMORTISSEMENTS`, `PROVISIONS` ; montants en unités
    mineures, colonne N, `null` si non mesuré), **`elements`** (`{ nature: COMPTE | GROUPE_DE_COMPTES, ref, libelle,
    brut, amortissements, montant }` : la caisse créditrice et son solde, l'écart de conversion non provisionné, le
    groupe d'immobilisations amorti au-delà de son brut avec l'excédent), `message` (affichable tel quel, ou `null`),
    **`sources`** (`{ texte, citation, url }`, lues du paquet ; `[]` quand le contrôle n'est pas déclaré). **Des
    signaux** : ni `valide`, ni la batterie des contrôles de cohérence, ni la liasse ne changent.
  - **Les soldes lus** : ceux de la liasse servie (soldes du jeu ; ceux de la version figée quand `version` est
    demandée ; ceux du corps du `dry-run`).
  - **Paquets** (révision en place ; liasse produite inchangée, chaque artefact identique à l'octet hors du bloc) :
    `syscohada-revise@2.1`, `@2.2`, `@2.3`, `zone-franche-togo@1.0` gagnent le bloc **`controlesIntegrite`** (racines de
    caisse `57` ; sept groupes d'immobilisations `21`…`27` face à `281`…`284` et `291`…`297` ; écarts de conversion-actif
    `478` hors `4788` ; provisions `194`, `499`, `599` ; sources). Empreintes : `syscohada-revise@2.1` `a2da57d7…`,
    `@2.2` `65c9c9a9…`, `@2.3` `39bb9f99…`, `zone-franche-togo@1.0` `70c87a37…`. SMT, SFD-BCEAO, CIMA : inchangés, les
    quatre contrôles `NON_APPLICABLE`.
  - **Non livré : le rapprochement de la liasse avec sa balance par l'empreinte des soldes** (STORY-1022 de C non
    livrée, D-1078-10) ; il s'ajoutera à côté, sans changer ce qui précède.
  - **Pour A (FE-141)** : types à régénérer (`npm run gen:api -- bilan`) ; afficher `message` et `sources` tels quels,
    les `elements` en liste ; un écran qui ignore la liste ne change rien.
  - **`balance-service` (C)** : la recopie à l'octet des trois `syscohada-revise` (ticket de 1076, mis à jour) prend la
    version de 1078 ; sans effet en service.

- **PUBLIÉ (2026-11-25, STORY-1077, prospera-bilan-service#187, `dev` 9fed378) ; ANNONCÉ avant la fusion du code
  (prospera-stories #853, `main` 4222321 ; complément #859, `main` 9be68d5), sans autre écart. — L'alerte « capitaux
  propres inférieurs à la moitié du
  capital social » (AUSCGIE 371-373, 664-669) et ses échéances légales, dans la réponse d'analyse.** Fiche :
  `stories/STORY-1077.md` (D-1077-1 → 13, Q-D-16). **Ajouts seuls** : aucun champ, aucune route, aucune valeur
  d'énumération existante ne change ni ne disparaît.
  - **Réponse d'analyse** (`GET /dossiers/{id}/bilan/analyse` et `POST …/analyse/dry-run`) : bloc neuf
    **`alerteCapitauxPropres`**, toujours présent (jamais `null`) — `code` (`CP_INFERIEURS_MOITIE_CAPITAL`), `statut`
    (`ATTEINTE` | `NON_ATTEINTE` | `INDETERMINEE` | `NON_APPLICABLE`), `motif` (`PAQUET_SANS_ALERTE`,
    `FORME_SANS_CAPITAL`, ou un motif d'indétermination des indicateurs : `DENOMINATEUR_NUL`, `DENOMINATEUR_NEGATIF`,
    `RESULTAT_NON_AFFECTE`, `MONTANT_HORS_BORNES`…, sinon `null`), `fraction` (`{ numerateur: 1, denominateur: 2 }`),
    `capitalSocial`, `capitauxPropres` (lecture stricte : sans subventions d'investissement ni provisions réglementées,
    D-1077-4), `capitauxPropresEtRessourcesAssimilees` (lecture large, poste `CP`), **`pourcentageDuCapital`**
    (capitaux propres stricts / capital × 100, au centième, ou `null` ; complément du 2026-11-25 avant la fusion du
    code), `atteinteSurRessourcesAssimilees`
    (booléen ou `null`), montants en unités mineures de la liasse ; `postes` (même forme que les postes d'un indicateur :
    le capital en `DENOMINATEUR`, les capitaux propres stricts en `NUMERATEUR`) et **`marqueursManquants`** (liste de
    chaînes, comme un indicateur ; complément du 2026-11-25) ; `formeJuridique` (`{ valeur, statut:
    CONNUE | INCONNUE }`) ; `regime` (`null` ou `{ formes, articles, renvois, sanction, exclusion }`, articles et citations
    du paquet) ; `dateCloture` et `dateApprobation` (`AAAA-MM-JJ` ou `null`) ; **`echeances`** (`null` ou trois entrées
    `{ code: APPROBATION_DES_COMPTES | DECISION | REGULARISATION, quoi, delaiMois, pointDeDepart, dateLimite,
    dateSiApprobationAuTerme, motifDate, articles, citation }`) et `motifSansEcheance` (`ALERTE_NON_CONSTATEE`,
    `FORME_JURIDIQUE_INCONNUE`, `FORME_SANS_REGIME`, ou `null` quand les échéances sont servies) ; `message`, `source`
    (`{ texte, url }`), `referentiel`. Les dix-neuf indicateurs ne changent pas.
  - **Paramètre neuf, facultatif : `dateApprobation`** (`AAAA-MM-JJ`) — en requête du `GET`, dans le corps du `dry-run`.
    Elle date la décision (approbation + 4 mois) ; **`400 APPROBATION_AVANT_CLOTURE`** si elle n'est pas postérieure à la
    clôture de l'exercice analysé ; `400` de validation si elle est malformée. Sans elle, la décision porte `dateLimite:
    null` et `dateSiApprobationAuTerme` (approbation le dernier jour des six mois légaux, + 4 mois).
  - **Consommateur de `dossier.created` / `dossier.updated`** : `bilan-service` lit désormais **`formeJuridique`**
    (facultatif depuis STORY-1073) et le projette dans `dossiers_dossier` (absent ⇒ `null`, état absolu ; mal typé ⇒
    `null`, le message n'est pas écarté). Aucun changement de schéma côté producteur ; **demande à B** : le publier aussi
    sur les dossiers clients (« Demandes aux autres groupes »). D'ici là, un dossier client rend `formeJuridique.statut:
    INCONNUE` et le constat chiffré **sans échéance**.
  - **Paquets** (révision en place, D-1077-3 ; liasse produite inchangée) : `syscohada-revise@2.1`, `@2.2`, `@2.3`,
    `zone-franche-togo@1.0` gagnent le marqueur de table de passage `capitauxPropresStricts` (`CAPITAL` | `COMPOSANTE`)
    et le bloc `alerteCapitauxPropres` (règle, délais, articles et citations de l'AUSCGIE) ; leurs empreintes changent
    (`syscohada-revise@2.1` `a1f6fd49…`, `@2.2` `bcbae17b…`, `@2.3` `fbdca0df…`, `zone-franche-togo@1.0` `5c910373…`).
    SMT, SFD-BCEAO, CIMA : inchangés, alerte `NON_APPLICABLE`.
  - **Pour A (FE-141)** : types à régénérer (`npm run gen:api -- bilan`) ; afficher `message` tel quel, les échéances
    datées, et la lecture large à côté quand elle diffère ; un écran qui ignore le bloc ne change rien.
  - **`balance-service` (C)** : la recopie à l'octet des trois `syscohada-revise` (ticket de 1076, mis à jour) prend la
    version de 1077 ; sans effet en service.

- **PUBLIÉ (2026-11-25, STORY-1073 : prospera-dossier-service#58, `dev` 4352ac3 ; prospera-paiement-service#125, `dev`
  e2be149 ; prospera-ventes-service#16, `dev` bc0f85c ; prospera-plateforme#40, `dev` de8f0d3, étiquette
  `contrats-distributeur-v2`) ; ANNONCÉ avant la fusion du code (prospera-stories #845, `main` bd9340e), sans écart. —
  La facture lit sa fiche légale de ses deux sources ; D
  fait aussi les côtés producteurs (`dossier-service` et `paiement`, prêtés par B pour cette story, #837).** Fiche :
  `stories/STORY-1073.md` (D-1073-1 → 11, Q-D-15). **Ajouts seuls** : aucun champ, aucune route, aucun topic existant
  n'est renommé ni retiré ; trois PR de code et une de la plateforme.
  - **`dossier-service`, `DossierEtatV1`** (`dossier.created`, `dossier.updated` ; `schemaVersion` **1 inchangé**) : neuf
    champs **facultatifs** — `sigle`, `formeJuridique` (`SA`, `SARL`, `SAS`, `SUARL`, `EI`, `AUTRE`), `nifSociete` (forme
    saisie), `rccm`, `numeroCnss`, `capitalSocial` (entier ≥ 0, unités mineures de `devise`), `adresse`, `telephone`,
    `email` — **sur le seul dossier propre** (`estLeCabinet: true`) ; clé **absente** (jamais `null` ni vide) quand le
    dossier ne la porte pas, **toujours absente sur un dossier client** (sa liste blanche ne change pas). Ni le régime
    fiscal (sa source est `dossier.axes.decides`, D-1073-3), ni dirigeants, ni actionnaires. Pour les consommateurs
    actuels (balance, bilan, document, microfinance, ventes…) : rien à faire, ils lisent nommément. La commande
    opérateur `npm run republier:dossiers` (STORY-696) republie ces champs pour les dossiers propres existants.
  - **`paiement`, fait neuf `paiement.compte.changed@1`** (sujet `paiement.compte.changed-value`, JSON, **BACKWARD**,
    modèle fermé, `contrat/schemas/paiement.compte.changed.json` ; clé de partition `orgId`) : l'état imprimable d'un
    compte d'encaissement, **enfilé dans la transaction de sa déclaration et de chaque vérification**. Enveloppe de
    `paiement` (`schemaVersion` 1, `eventId`, `orgId`, `occurredAt` = l'instant de l'acte) ; charge : `organisationId`,
    `compteId`, `revision` (**le rang de l'acte au journal chaîné du compte** : croissant, jamais réutilisé ; la plus haute
    fait foi, deux faits de même révision sont identiques), `nature` (`MARCHAND`, `BANCAIRE`, `MOBILE_MONEY`, `PI_SPI`),
    `titulaire`, `fournisseur`, `pays`, `devise`, `empreinteVisible`, `destinationPiSpi` (`{ numeroDeCompte,
    participant }` pour un compte PI-SPI, sinon `null`), `verifie` (booléen). **Jamais un secret du coffre** :
    l'identifiant scellé (numéro, IBAN, identifiant marchand), la clef de notification et son ancienne clef ne sortent
    pas (NFR-1, AD-14) ; un compte déclaré avant la story ne publie qu'à sa prochaine vérification (D-1073-10). Topic
    sans tiret : la convention de `paiement` le refuse (D-1073-6). Code commun : `EcritureDArgent.executer` passe
    désormais l'entrée consignée à `publier(resultat, entree)` ; ses autres appelants l'ignorent.
  - **`ventes` (`facturation`)** : groupe neuf **`ventes-service.emetteur`** (`KAFKA_EMETTEUR_GROUP_ID`, facultative),
    depuis le début, sur `dossier.created`, `dossier.updated` et `paiement.compte.changed` ; deux collections neuves
    (`facturation_organisations_lues`, `facturation_comptes_lus`). **Paramètres de la facture** (`PUT
    /api/v1/facturation/parametres`, même route, même droit) : `comptesImprimes` **neuf et facultatif** (au plus 5
    `compteId`, distincts, dans l'ordre ; le premier est le compte par défaut) ; `emetteur` **devient facultatif**
    (absent, la version lue est gardée) et **seul `emetteur.regimeFiscal` y est encore lu** (D-1073-4). **Facture lue**
    (`mentions.emetteur`) : les champs de 1065 restent (`rib` et `mobileMoney` valent `null` sur une facture émise
    depuis) ; s'y ajoutent, facultatifs, `sigle`, `telephone`, `email`, `numeroCnss`, `comptes` (`compteId`,
    `revision`, `nature`, `titulaire`, `fournisseur`, `numero`, `participant`, `devise`, `verifie`), `dossierId`,
    `versionDuDossier`. **`MENTION_OBLIGATOIRE_MANQUANTE`** : `EMETTEUR_REGIME_FISCAL` et
    `EMETTEUR_COORDONNEES_DE_PAIEMENT` nomment désormais la fiche `PARAMETRES` (avant : `ORGANISATION`) ; la forme
    `AUTRE` manque (D-1073-8). Le PDF imprime le sigle, les contacts, le n° CNSS et un compte par ligne (nature,
    fournisseur ou participant, n° affichable, titulaire). Pour l'écran des paramètres (A ou D) : le formulaire ne
    saisit plus la fiche, il choisit les comptes et le régime fiscal.
  - **Manifestes** (à la source dans ce dépôt) : `facturation` **1.2.0** (C5 : + `dossier.created`, `dossier.updated`,
    `paiement.compte.changed@1` consommés ; aucun droit, aucune route) ; `paiement` **1.1.0** (C5 : +
    `paiement.compte.changed@1` publié). **Catalogue des faits du distributeur v2** (`prospera-plateforme`,
    `contrats/distributeur/catalogue-faits.json`, étiquette `contrats-distributeur-v2` après la fusion ; `src/index.ts`
    inchangé) : + `paiement.compte.changed@1` (origine `MANIFESTE`, consommateur `facturation`). → B : recopies du
    catalogue de `platform-catalog-service` (les deux manifestes), « Demandes aux autres groupes ».

- **PUBLIÉ (2026-11-24, STORY-1076, prospera-bilan-service#186, `dev` e4cee3e) ; ANNONCÉ avant la fusion du code
  (prospera-stories #835, `main` cb0c2da), sans écart. — Les seuils de
  l'analyse financière, sourcés (BCEAO), dans les paquets SYSCOHADA révisé : FE-141 reçoit des verdicts.** Fiche :
  `stories/STORY-1076.md` (D-1076-1 → 8, Q-D-14). **Aucune route, aucun champ, aucune valeur d'énumération ne change** :
  le contrat de `GET|POST …/bilan/analyse` (STORY-552/553) est inchangé ; ce qui change, c'est son **contenu**.
  - **Réponse d'analyse** (`/dossiers/{id}/bilan/analyse` et `…/analyse/dry-run`, paquets `syscohada-revise@2.1`,
    `@2.2`, `@2.3`, `zone-franche-togo@1.0`) : trois indicateurs portent désormais `seuilApplique` (non `null`) et un
    `verdict` (`BON` ou `RISQUE`, `motifVerdict: null` ; `VALEUR_INDETERMINEE` si la valeur est `null`) :
    `POIDS_CAPITAUX_PROPRES` (RISQUE < 20 ≤ BON), `LIQUIDITE_GENERALE` (RISQUE < 1 ≤ BON), `MARGE_NETTE` (RISQUE < 0 ≤
    BON), `secteurRetenu: "TOUS"`, `source` = la procédure BCEAO de mars 2020 (paragraphe, phrase, URL). Les **seize
    autres** gardent `seuilApplique: null`, `AUCUN_REPERE_DECLARE` (Q-D-14). Aucune **valeur** ne change. Pour FE-141
    (A) : les verdicts sont servis ; seuls deux niveaux sortent (D-1076-3) ; les repères d'exemple de la maquette
    (D-M141-1) peuvent céder la place aux vrais sur ces trois lignes.
  - **Empreintes des paquets** (révision en place, D-1076-2 ; liasse produite inchangée) : `syscohada-revise@2.1`
    `abaffa01…`, `@2.2` `8b6255f7…`, `@2.3` `7a39c0da…`, `zone-franche-togo@1.0` `11f60ebc…`. Le `stamp` de l'analyse
    les publie ; une liasse figée avant la story se relit avec `memePaquet: false` (comme après 552).
  - **`balance-service` (C)** : recopie à l'octet des trois `syscohada-revise` demandée (« Demandes aux autres
    groupes », ticket) ; sans effet en service.

- **PUBLIÉ (2026-11-24, STORY-1072, prospera-notification-service#92, `dev` 7a11331, 749b3cd ;
  prospera-expert-comptable#11, `dev` 4154038, b540904) ; ANNONCÉ avant la fusion du code (prospera-stories #816, `main`
  af601d7 ; complément D-1072-12 #832, `main` a61893c, avant la fusion de #92), sans autre écart. — Le cabinet prévenu par e-mail du renvoi de son dossier KYC (demande de B,
  STORY-1103).** Fiche : `stories/STORY-1072.md` (D-1072-1 → 11). **Ajouts seuls** : aucune clé, aucun texte, aucune
  variable, aucun topic, aucun groupe existant ne change ; `kyc-service` n'est pas touché.
  - **`notification`, modèle système neuf `kyc-dossier-renvoi-correction`** (e-mail seulement, `fr` et `en`), dans la
    famille KYC du socle, après `kyc-dossier-a-corriger`. Variables **obligatoires** : **`texte`** (le texte composé par
    kyc, recopié tel quel, D-1103-5) et **`lienEspace`** (la page KYC de l'espace du cabinet ; **pas `lien`**, nom réservé
    aux secrets dans ce service, D-1072-2). Aucun secret. **Route directe** (`POST /api/v1/service/envois`) : le périmètre
    d'`expert-comptable` (`CLES_MESSAGES_KYC`) passe de trois à quatre clés ; aucun autre appelant ne la fait partir.
    `CLES_MODELES_SYSTEME` passe de 30 à 31 (inventaire écrit en toutes lettres).
  - **`expert-comptable`, consommateur** : le groupe existant **`expert-comptable-kyc`** s'abonne aussi à
    **`kyc.correction.requested`** (v1, schéma de kyc ; `fromBeginning`), et rien ne change pour `kyc.status.changed`. Un
    fait valide (`schemaVersion` 1, `eventId`, `orgId`, `texte` non vide, `occurredAt`) devient une demande d'envoi par
    administrateur actif du cabinet (clé d'idempotence par destinataire, comme 590) ; un fait hors contrat est écarté et
    journalisé ; un rejeu n'envoie rien de plus ; une panne de la file fait rejouer Kafka (D-1072-7). Marqueur
    d'idempotence dans la collection existante `processed_kyc_events`.
  - **`expert-comptable`, variable d'environnement neuve `ESPACE_KYC_URL`** (facultative ; URL avec protocole ; exemple
    `http://localhost:3100/kyc`). **Absente : l'e-mail du renvoi n'est pas envoyé** (travail arrêté sur une erreur nommée)
    ; les trois e-mails existants n'en dépendent pas (D-1072-9). Une pile qui veut cet e-mail la pose.
  - ⚠️ **Complément (2026-11-24, 19:40), avant la fusion de #92 — un comportement de `notification` change (D-1072-12).**
    Relevé sur la pile `grp-d` de la story : deux demandes d'un même appelant l'une derrière l'autre (le renvoi à deux
    administrateurs) ; la remise de la première, **déjà acceptée par le relais**, écrivait son journal pendant que la
    seconde se préparait (même compteur de période) ; MongoDB abandonnait la transaction du journal
    (`TransientTransactionError`), BullMQ rejouait la remise et **le premier destinataire recevait le message deux
    fois**. Désormais le journal d'une remise (`JournalRemiseService` : remise, échec, écart) **rejoue sa transaction
    entière** sur l'étiquette `TransientTransactionError`, cinq essais au plus ; toute autre erreur remonte comme avant.
    Aucune route, aucun champ, aucun statut, aucun fait ne change ; vaut pour **tous** les appelants et tous les modèles
    (les trois e-mails KYC, le paiement, l'assurance…), qui ne reçoivent plus de doublon dans ce cas.

- **PUBLIÉ (2026-11-24, STORY-1071, prospera-plateforme#39, `dev` 2c96703 ; prospera-sinistres-service#33, `dev`
  9c9a997, 1c7b49a, b327f18, 095e577) ; ANNONCÉ avant la fusion du code (prospera-stories #809, `main` 77bd6c4), sans
  écart ; schéma enregistré dans Karapace (sujet neuf, BACKWARD) et accepté par la garde `classification-sante`. —
  `prospera-sinistres-service`, modules `expertises` et `sinistres` : la mission d'expertise et sa
  machine unique (FR-61), un fait neuf `expertises.mission.changed@1` (schéma dans `prospera-plateforme`,
  `contrats/assurance/expertises/`), et l'évaluation qui l'attend.** Fiche : `stories/STORY-1071.md` (D-1071-1 → 11).
  **Ajouts seuls**, sauf un comportement qui change (⚠ plus bas) ; **aucun manifeste ne change** (les deux lectures
  étaient déjà déclarées en lecture seule ; le fait est déjà en C5 `publie` d'`expertises` et `consomme` de `sinistres`).
  - **Routes neuves** (module `expertises`, garde `EXPERTISES_NOT_ENTITLED`) : `POST /api/v1/expertises/missions` (201 ;
    `{ dossierId, domaine, type, priorite?, objet, pointsATraiter?, elementsAExaminer?, roleExerce, cleIdempotence }` ;
    GEST, RESP ; une mission `A_DESIGNER`) et `POST /api/v1/expertises/missions/{id}/actes` (200 ; `{ acte, versionLue,
    roleExerce, cleIdempotence, motif?, expertId?, voie?, rapport?: { pieceId, versionPiece, chiffrage? }, decision?,
    chiffrage? }` ; treize actes : `CONFIRMER`, `DESIGNER`, `ACCEPTER`, `DECLINER`, `TRANSMETTRE`, `COMMENCER`,
    `EXAMINER`, `DEPOSER_RAPPORT`, `DEMANDER_COMPLEMENT`, `VALIDER`, `CONTESTER`, `ARBITRER`, `ANNULER`). Lectures
    servies : `GET /api/v1/expertises/missions?roleExerce=&dossierId=` et `GET …/missions/{id}?roleExerce=` (GEST,
    GREC, RESP, DG, DT, AUD ; EXPI et EXPE : leurs missions seulement). Refus : 400 `MISSION_INVALIDE`, `MOTIF_ECRIT`,
    `EXPERT_REQUIS`, `PIECE_JOINTE_OBLIGATOIRE`, `CHIFFRAGE_INVALIDE` ; 403 `DROIT_INSUFFISANT`, `HORS_MISSION` ; 404
    `MISSION_INTROUVABLE`, `EXPERT_INTROUVABLE` ; 409 `TRANSITION_MISSION_INTERDITE` (détails : `etat`, `actesPermis`),
    `COMPLEMENT_EXPERT_RECU`, `EXPERT_NON_ELIGIBLE`, `EXPERTISE_EXTERNE_IMPOSEE`, `MISSION_MEDICALE_NON_SERVIE`, ceux du
    référentiel (`AGREMENT_ECHU`, `AGREMENT_ABSENT`, `EXPERT_INACTIF`, `DOMAINE_NON_COUVERT`), `ETAT_PERIME`,
    `CLE_REUTILISEE`.
  - **Le fait** (topic `expertises.mission.changed`, sujet `expertises.mission.changed-value`, JSON Schema draft-07
    fermé, BACKWARD, clé = organisation ; publié par l'outbox du service dans la transaction de chaque acte accepté et
    de la création) : `missionId`, `dossierId`, `versionObjet` (la version de la mission : la plus haute fait foi),
    `etat` (les treize), `type`, `bloquante` (ni `VALIDEE`, ni `ARBITREE`, ni `ANNULEE`), `chiffrage` et `devise`
    (ensemble, seulement validée ou arbitrée avec un chiffrage), `changeeLe`. ⛔ Ni le domaine, ni l'objet, ni les points,
    ni un motif, ni l'expert nommé. Neuf champs classés au registre `classification-sante` (module `expertises`).
    **Consommateur** : `sinistres` (groupe `sinistres-service.missions`, spine AD-16).
  - **`sinistres`** : le fait est rangé au dossier par une commande du système (version + 1, piste `MISSION_CHANGEE`,
    `sinistres.dossier.changed@1`, sans contenu) ; `GET …/dossiers/{id}` gagne **`missions`** (`missionId`, `version`,
    `etat`, `type`, `bloquante`, `chiffrage?`, `devise?`, `changeeLe`) ; `POST …/evaluations` gagne le refus **409
    `EXPERTISE_VALIDEE`** (détails : `missions`, celles en attente et leur état) ; avec un chiffrage validé, c'est lui le
    repère : un montant qui en diffère exige un motif (`MOTIF_ECRIT`, détails : `chiffrageDExpertise`), et l'évaluation
    arrêtée porte **`chiffrageDExpertise`**.
  - ⚠️ **Un comportement change : `EXPERTISE_VALIDEE` devient une condition calculée** par la machine du dossier
    (transitions 7 et 22), sur les missions rangées au dossier. Le constat du même nom n'était posé par personne : la
    transition 7 était refusée à tout dossier (échec fermé). Désormais **un dossier sans mission passe** (FR-61), un
    dossier dont une mission est ouverte est refusé, la mission nommée (`details.missions`). Un constat
    `EXPERTISE_VALIDEE` posé à la main n'est plus lu.
  - ⚠️ **Pour un consommateur de `sinistres.dossier.changed@1`** (`liaison-assureur`, `notification`, `ged`) : chaque
    mission lue fait avancer `versionEtat` d'un rang sans changer le statut (comme une pièce contrôlée, 1001).

- **PUBLIÉ (2026-11-24, STORY-1070, prospera-sinistres-service#31, `dev` 6a0c28d) ; ANNONCÉ avant la fusion du code
  (prospera-stories #803, `main` 36d4acf), sans écart. — `prospera-sinistres-service`, module `sinistres` :
  lever une alerte bloquante du décompte (FR-55, D-1013-10).** Fiche : `stories/STORY-1070.md` (D-1070-1 → 11).
  **Ajouts seuls** ; **aucun schéma de fait ne change** (ni `dossier.changed@1`, ni `evaluation.arretee@1`) ; **aucun
  manifeste ne change** (une route d'écriture n'est pas déclarée ; la lecture reste `GET …/instruction`) ; aucune
  collection ne change (la levée est rangée dans `instruction`, déjà persisté).
  - **Route neuve** : `POST /api/v1/sinistres/dossiers/{id}/instruction/levees` (200, rend la lecture du formulaire),
    corps `{ code, motif, roleExerce, versionLue, cleIdempotence }` ; rôles GEST, GREC, RESP ; dossier `EN_INSTRUCTION`
    ou `EVALUE`. Refus : 400 `MOTIF_ECRIT` (motif < 10 caractères) ; 403 `DROIT_INSUFFISANT` ; 404 ; 409
    **`ALERTE_ABSENTE`** (neuf : pas d'alerte `BLOQUANT` de ce code au décompte du dernier enregistrement ; détails :
    `bloquantes`), **`ALERTE_DEJA_LEVEE`** (neuf), **`LEVEE_IMPOSSIBLE`** (neuf : hors fenêtre), `INSTRUCTION_NON_ENREGISTREE`,
    `TYPE_DE_SINISTRE_ABSENT`, `DECOMPTE_IMPOSSIBLE`, `DECOMPTE_INVALIDE`, `SEPARATION_DES_TACHES`, `ETAT_PERIME`,
    `CLE_REUTILISEE`.
  - **Lectures changées** (ajouts) : `GET …/dossiers/{id}/instruction` gagne **`alertes`** (les alertes du décompte du
    dernier enregistrement : `code`, `niveau`, `message` ; pour un `BLOQUANT`, `levee` ou `null`) et **`levees`**
    (l'historique : `code`, `enregistrement`, `motif`, `par`, `roleExerce`, `le`) ; `GET …/evaluations` : une évaluation
    arrêtée après une levée porte **`alertesLevees`** (les levées qui ont servi, copiées).
  - ⚠️ **Pour un écran ou un client de `POST …/evaluations`** : `ALERTE_BLOQUANTE_NON_LEVEE` ne change pas de forme
    (`details.alertes` : les codes **non levés** sur l'enregistrement en vigueur) ; une levée vaut pour l'enregistrement
    du formulaire sur lequel elle est faite (D-1070-3) : un nouvel enregistrement qui garde l'alerte la rebloque.
  - ⚠️ **Séparation des tâches** : l'auteur d'une levée devient partie (`EVALUER`, D-1070-5) : il ne valide, ne contrôle
    ni n'enregistre l'accord ensuite.

- **PUBLIÉ (2026-11-24, STORY-1069, prospera-plateforme#38, `dev` 9560b44 ; prospera-sinistres-service#30, `dev`
  a2671c6, a5fae87) ; ANNONCÉ avant la fusion du code (prospera-stories #800, `main` 4aabfd2), sans écart ; schéma
  enregistré dans Karapace (sujet neuf, BACKWARD) et accepté par la garde `classification-sante`. — un fait neuf : `sinistres.evaluation.arretee@1`
  (`prospera-sinistres-service`, module `sinistres` ; schéma dans `prospera-plateforme`, `contrats/assurance/sinistres/`).**
  Fiche : `stories/STORY-1069.md` (D-1069-1 → 11). **Ajouts seuls** ; aucune route, aucun manifeste (le fait est déjà en
  C5 `publie`), aucune collection ne change ; `prospera-assurance-service` et `prospera-liaison-assureur-service` ne
  changent pas.
  - **Le fait** (topic `sinistres.evaluation.arretee`, sujet `sinistres.evaluation.arretee-value`, JSON Schema draft-07
    fermé, BACKWARD, clé = organisation) : `dossierId`, `reference` (`DEC-`), `numeroOfficiel?`, **`versionObjet`** (= le
    `versionEtat` du `sinistres.dossier.changed@1` de la même transaction), **`rang`** (version de l'évaluation : la plus
    haute fait foi), **`montant`** (entier ≥ 1, au franc), `devise` (`XOF`), `auteurId`, `roleExerce` (`GEST`, `GREC`,
    `RESP`), `arreteeLe`, `survenuLe` ; avec un décompte : `tableVersion`, `tableDeVetusteVersion?`, `franchiseRetenue`.
    ⛔ Jamais le motif écrit, le décompte détaillé, le formulaire, la nature corporelle ni la provision (elle est à
    `assurance`, AD-11). Cinq champs classés au registre `classification-sante` (`sinistres`).
  - **Quand** : à chaque arrêt accepté (`POST …/dossiers/{id}/evaluations`, premier ou correction), tout volet ; rien pour
    un arrêt refusé ou rejoué. **Ordre dans la transaction** : `sinistres.dossier.changed@1` → `sinistres.evaluation.arretee@1`
    → `sinistres.provision.revisee@1` (motif `EVALUATION`, s'il y a une provision ouverte, 1016).
  - ⚠️ **Pour un consommateur des faits de `sinistres`** : un topic de plus (créé par le relais de l'outbox au démarrage) ;
    `sinistres.dossier.changed@1` et `provision.revisee@1` ne changent pas.
  - **Consommateur nommé par la spine (AD-16)** : **`liaison-assureur`** (C), pour l'envoi **C-14** (avec la provision
    avant et après d'`assurance.provision.changed@1`) — à écrire par C, hors de cette story (D-1069-8). `expertises` n'est
    pas consommateur (spine) : à revoir avec la mission d'expertise (1071) par un amendement si besoin.

- **PUBLIÉ (2026-11-24, STORY-1068, prospera-sinistres-service#29, `dev` 2a8f9f1, ddcf52a) ; ANNONCÉ avant la fusion
  du code (prospera-stories #796, `main` 53f9e2a), sans écart. —
  `prospera-sinistres-service`, module `sinistres` : le dossier montre la provision en vigueur, lue dans
  `assurance.provision.changed@1` (AD-11, D-1016-10).**
  Fiche : `stories/STORY-1068.md` (D-1068-1 → 11). **Ajouts seuls** ; **aucun schéma de fait ne change** ; **aucun
  manifeste ne change** (la consommation est déjà déclarée en C5) ; `prospera-assurance-service` **ne change pas**.
  - **Routes changées** (ajouts) : `GET /api/v1/sinistres/dossiers/{id}` gagne **`provision`** ; `GET …/dossiers/{id}/evaluations`
    : **`montants.provision`** prend la même forme. Forme : `{ etat, montant, tenueParAssurance: true }` avec `etat`
    `EN_VIGUEUR` (et `devise`, `sequence`, `montantAvant`, `motif`, `origine`, `effectiveLe`, `propositionId?`, `pieceId?` :
    le dernier mouvement effectif, plus haute séquence), `SANS_MOUVEMENT`, `NON_INSTALLE` (`assurance` absent ou retiré :
    « provision non tenue », C4) ou `NON_LISIBLE` (rôles hors DG, DT, RESP, GEST, AUD : annexe B, ligne 12) ; hors
    `EN_VIGUEUR`, `montant` vaut `null`, jamais 0. ⚠️ **Pour un lecteur de `montants.provision`** : la valeur d'avant
    (`{ montant: null, tenueParAssurance: true }`) gagne `etat` ; un `GREC` ou le comité y lisent `NON_LISIBLE`.
  - **Consommateur neuf** : groupe `sinistres-service.provision` sur `assurance.provision.changed` (topic créé avant
    l'abonnement ; un fait hors contrat est écarté, journalisé). « En attente du `RESP` » (`a-valider`) n'est pas lu
    (D-1068-6) : il se lit chez `assurance`.
  - **État publié** : `sinistres` projette désormais l'état du module **`assurance`** (voisin suivi, comme `reseau`) depuis
    `etat-publie.changed.<espace>` ; rien à publier de plus pour le moteur (l'état d'`assurance` y est déjà).
  - **Collection neuve** : `sinistres_provisions_en_vigueur` (une ligne par dossier provisionné, copie dérivée) ; copie
    du contrat consommé `contrat/consommes/assurance.provision.changed.json` (`prospera-plateforme@8ce4325`).

- **PUBLIÉ (2026-11-24, STORY-1067, prospera-ventes-service#15, `dev` cd5fc87 → 52971b5) ; ANNONCÉ avant la fusion du
  code (prospera-stories #792, `main` 6f939fa), sans écart. —
  `prospera-ventes-service`, module `commande` : modifier une commande (FR-35).**
  Fiche : `stories/STORY-1067.md` (D-1067-1 → 16). **Ajouts seuls** ; **aucun schéma de fait ne change** ; **aucun
  manifeste ne change** (`commande:commande:saisir` couvre déjà « modifier »).
  - **Route neuve** `POST /api/v1/commande/commandes/{commandeId}/modifications` (`commande:commande:saisir` ;
    `Idempotency-Key`) corps `{ revision, lignes?, dateLivraisonSouhaitee?, messageClient? }` (`revision` : celle de la
    commande lue ; `lignes` absent : inchangées, présent : la liste neuve entière ; date et message absents : inchangés,
    `null` : effacés) ⇒ 201 `{ …la commande, modification: { version, statut: APPLIQUEE | EN_ATTENTE_DE_STOCK | REFUSEE,
    statutDeLaCommande, demandeePar, demandeeLe, appliqueeLe, revisionAvant, revisionApres, changements: [{ champ, avant,
    apres }], montantTtcAvantMineur, montantTtcApresMineur, jugement, remplacements, refus }, rejeu }`. Qui : l'auteur de
    la commande, ou un membre qui a aussi `commande:reseau:consulter` ; une `VALIDEE` demande en plus
    `commande:commande:valider` ; sinon 403 `ROLE_NON_AUTORISE` (`details.droitRequis`). Refus : 400
    `CLE_D_IDEMPOTENCE_MANQUANTE`, `COMMANDE_SANS_LIGNE`, `MONTANT_HORS_BORNES`, `MODIFICATION_SANS_EFFET` ; 403
    `HORS_PORTEE` ; 404 `COMMANDE_INCONNUE` ; 409 `REVISION_PERIMEE` (`details` : `revisionLue`, `revision`),
    `COMMANDE_NON_MODIFIABLE`, `VALIDATION_EN_COURS`, `COMMANDE_FACTUREE` (`factureId`, `numero` : un avoir),
    `MODIFICATION_EN_COURS`, `POINT_DE_STOCK_CHANGE` (`ajoutes`, `vides`), `ARTICLE_SANS_PRIX`, `UNITE_NON_VENDUE`,
    `CREDIT_BLOQUE`, `PLAFOND_INCONNU`, `STOCK_NON_INSTALLE`, `ENCOURS_NON_INSTALLE`, `PLAFOND_CREDIT_DEPASSE`,
    `STOCK_INSUFFISANT`, `CLE_REUTILISEE_AVEC_AUTRE_CHARGE` ; 503 `RESERVATION_INDISPONIBLE` (la modification attend :
    rejouer la même demande).
  - **Route neuve** `GET /api/v1/commande/commandes/{commandeId}/modifications` (`commande:reseau:consulter` ou
    `commande:portefeuille:consulter`, portée de lecture ; 404 `COMMANDE_INCONNUE`) ⇒ `{ modifications: [...] }` par
    version.
  - **Routes changées** (ajouts) : la commande lue gagne `modifications` (nombre appliqué) et `modificationEnCours`
    (`{ version, depuis }` ou `null`) ; `POST /commandes/{commandeId}/annulation` peut refuser 409 `MODIFICATION_EN_COURS`.
  - **Faits** (schémas inchangés) : après la modification d'une commande `VALIDEE`, **`commande.commande.validee@1` et
    `commande.commande.chiffree@1` repartent pour la même commande à un rang plus haut** (états absolus : garder le plus
    haut rang ; `facturation` le fait déjà) ; `commande.engagement-tiers.changed@1` suit la différence (relevé à la
    transaction 1 si le TTC monte, rendu si `stock` refuse). `commande.bon-livraison.emis@1` n'est pas republié : un bon
    garde son identité et son numéro, ses lignes suivent la commande.
  - **Port `stock`** (AD-8, pour l'API de réservation de `stock` quand elle existera) : `remplacer({ organisationId, cle:
    <commandeId>:<version>, lignes: [{ cle: <commandeId>:<version>:<rang du bon>.<ligne>, reservation: <bonId>:<ligne>,
    bonId, ligne, pointDeStockId, articleId, quantite }] })` : toutes ou aucune, idempotent par `cle`, 0 = rendue ;
    réponses `REMPLACEE`, `REFUSEE` (`STOCK_INSUFFISANT`, `lignes`), `INDISPONIBLE`.
  - **Collection neuve** : `commande_modifications` (au plan d'effacement C13). **Champ neuf** sur `commande_bons` :
    `derniereLigne` (facultatif).

- **PUBLIÉ (2026-11-24, STORY-1066, prospera-ventes-service#14, `dev` d9f4264 → adaa2bb) ; ANNONCÉ avant la fusion du
  code (prospera-stories #782, `main` 24049e4), sans écart ; schémas vérifiés au registre (Karapace, contre les versions
  d'`origin/dev`). — `prospera-ventes-service`, module `facturation` : l'avoir.**
  Fiche : `stories/STORY-1066.md` (D-1066-1 → 14). **Ajouts seuls** ; un fait neuf publié (déjà déclaré au manifeste) ;
  un schéma relâché ; **manifeste `facturation` 1.1.0** (C7 : + `facturation:avoir:valider` ; D-1065-15).
  - **Routes neuves** (préfixe `/api/v1/facturation`) : `POST /factures/{factureId}/avoirs` (`facturation:avoir:emettre`
    ; au-delà du seuil, + `facturation:avoir:valider` ; `Idempotency-Key`) corps `{ motif: RETOUR_DE_MARCHANDISE |
    ERREUR_DE_PRIX | REMISE_COMMERCIALE | LITIGE_DE_LIVRAISON | ERREUR_DE_FACTURATION, texte?, nature: TOTAL | LIGNES |
    MONTANT, lignes?: [{ ligne, quantite, prixUnitaireHtMineur? }], montant?: { montantHtMineur, tauxTvaPourDixMille } }`
    ⇒ 201 l'avoir (`avoirId`, `numero` `AV-…`, `factureId`, `factureNumero`, `motif`, `texte`, `nature`, `lignes`, `tva`,
    HT, TVA, TTC, `ordre`, `cumulTtcMineur`, `resteACrediterTtcMineur`, `soldeLaFacture`, `statut: EMIS`, `emisLe`,
    `emisPar`, `pdf`, `rejeu`), 200 au rejeu ; 400 `AVOIR_INVALIDE` (`details.erreurs`), `CLE_D_IDEMPOTENCE_MANQUANTE` ; 403
    `VALIDATION_DU_DAF_REQUISE` (`details` : `seuilMineur`, `montantTtcMineur`), `HORS_PORTEE` ; 404 `FACTURE_INCONNUE` ;
    409 `AVOIR_SUPERIEUR_A_LA_FACTURE` (`details` : ce qui dépasse, le reste à créditer ; aucun numéro consommé),
    `CLE_REUTILISEE_AVEC_AUTRE_CHARGE`. `GET /factures/{factureId}/avoirs`, `GET /avoirs/{avoirId}` (404 `AVOIR_INCONNU`),
    `GET /avoirs/{avoirId}/pdf` (`application/pdf`, `ETag`, `X-Empreinte-Sha256` ; 409 `PDF_EN_ATTENTE`,
    `PDF_INDISPONIBLE` ; 500 `PDF_ALTERE`) : `facturation:facture:consulter`.
  - **Routes changées** (ajouts) : `PUT /numerotation/{serie}` accepte `avoirs` (la suite de Sage des avoirs, une fois) ;
    `GET /numerotation` rend aussi la série `avoirs` ; la facture rendue gagne `statut` (`EMISE | PARTIELLE | PAYEE |
    CLOTUREE | ANNULEE_PAR_AVOIR`) et `avoirs { nombre, montantHtMineur, montantTvaMineur, montantTtcMineur,
    resteACrediterTtcMineur }` ; les paramètres de la facture gagnent `seuilValidationAvoirMineur` (500 000 par défaut, de
    0 à 10¹², **facultatif au `PUT`**, rendu par toute version lue).
  - **Fait neuf publié** : `facturation.avoir.emis@1` (topic `facturation.avoir.emis`, clé `<organisationId>:<factureId>`,
    schéma fermé `facturation.avoir.emis-value` en BACKWARD) : `avoirId`, `numero`, `factureId`, `factureNumero`,
    `commandeId`, `livraisonId` (`null`), `tiersId`, `perimetre`, `devise`, `motif`, `nature`, `lignes` (`ligne`,
    `articleId`, `quantite`, `prixUnitaireHtMineur`, `tauxTvaPourDixMille`, `montantHtMineur` ; vide pour un montant libre),
    `tva` (par taux), `montantHtMineur`, `montantTvaMineur`, `montantTtcMineur`, `ordre`, `cumulTtcMineur`,
    `resteACrediterTtcMineur`, `soldeLaFacture`, `emisLe`, `rang` (1). Ni désignation, ni nom, ni texte libre.
  - **Fait relâché** : `facturation.serie.changed@1` — l'énumération `["factures"]` de `serie` est **retirée**
    (BACKWARD, vérifié au registre avant la fusion) ; la série `avoirs` (`prefixe` `AV-`) y paraît. Un consommateur qui
    ne gardait que la tête des factures filtre `serie = factures`.
  - **Collections neuves** : `facturation_avoirs`, `facturation_credits_des_factures`, `facturation_pdfs_avoirs`.
  - **Pour B** : voir « Demandes aux autres groupes » (le droit, le manifeste 1.1.0, le consommateur de `paiement`).

- **PUBLIÉ (2026-11-24, STORY-1065, prospera-ventes-service#13, `dev` 3242844, ca44566, 5929438) ; ANNONCÉ avant la
  fusion du code (prospera-stories #763), sans écart. — `prospera-ventes-service`, module `facturation` : les
  mentions légales, le PDF figé, le lien public d'envoi.** Fiche : `stories/STORY-1065.md` (D-1065-1 → 15 ; la version
  du manifeste, restée en 1.0.0, monte avec 1066 : D-1065-15). **Ajouts
  seuls** ; **aucun fait ne change** (`facturation.facture.emise@1` ne porte ni mention ni PDF) ; **manifeste
  `facturation` amendé** (C7 : + `facturation:parametres:modifier`, recopié à l'octet dans `ventes`).
  - **Routes neuves** (préfixe `/api/v1/facturation`) : `GET /parametres` (un droit du module) et `PUT /parametres`
    (`facturation:parametres:modifier` ; corps `{ versionAttendue, valeurs, motif }` ; 400 `PARAMETRES_INVALIDES`
    `details.erreurs`, 409 `PARAMETRES_VERSION_PERIMEE`) : `valeurs = { emetteur: { raisonSociale, formeJuridique,
    capital, adresseDuSiege, nif, rccm, regimeFiscal, rib, mobileMoney }, mentionsExigees: [codes], penalitesDeRetard,
    escompte, dureeDuLienJours (7), conservationAnnees (10) }` ; `GET /factures/{factureId}/pdf`
    (`facturation:facture:consulter` ; `application/pdf`, `ETag`, `X-Empreinte-Sha256` ; 409 `PDF_EN_ATTENTE`,
    `PDF_INDISPONIBLE` ; 404 `FACTURE_INCONNUE` ; 500 `PDF_ALTERE`) ; `POST /factures/{factureId}/liens`
    (`facturation:facture:emettre`, `Idempotency-Key` ; 201 `{ lienId, factureId, numero, url, creeLe, expireLe, etat,
    ouvertures, rejeu }`, l'`url` rendue une seule fois, `null` au rejeu) ; `GET /factures/{factureId}/liens`
    (consulter ; jamais le jeton) ; `POST /factures/{factureId}/liens/{lienId}/revocation` (émettre ; 404 `LIEN_INCONNU`) ;
    **`GET /liens-publics/{jeton}`, publique** (sans compte : le PDF `inline` ; 404 `LIEN_INCONNU`, 410 `LIEN_EXPIRE`,
    `LIEN_REVOQUE`, 503 `PDF_EN_ATTENTE`, 429 au-delà de 30 ouvertures par minute et par adresse).
  - **Routes changées** (ajouts) : `POST /factures` peut refuser **409 `MENTION_OBLIGATOIRE_MANQUANTE`** (`details.manquantes
    : [{ code, fiche: ORGANISATION | POINT_DE_VENTE | ARTICLE | PARAMETRES, id }]`, aucun numéro consommé) ; la facture
    rendue gagne `parametresVersion`, `mentions` (émetteur, client, désignations, pénalités, escompte, conservation) et
    `pdf { etat: EN_ATTENTE | PRODUIT | ECHEC, empreinteSha256, octets, produitLe }`.
  - **Collections neuves** : `facturation_parametres`, `facturation_clients_lus` et `facturation_articles_lus` (futures
    projections de `pdv` et de `catalogue`, remplies par personne aujourd'hui), `facturation_pdfs`,
    `facturation_liens_publics`. **Configuration** : `FACTURATION_LIENS_BASE_URL`, `FACTURATION_PDF_INTERVALLE_MS`.
    **Dépendance** : `pdfkit` 0.19.1 (épinglée) ; polices Liberation Sans (SIL OFL 1.1) dans le dépôt.
  - **Pour B** : voir « Demandes aux autres groupes » (le droit au catalogue de tenant d'`auth`).

- **PUBLIÉ (2026-11-18, STORY-1064, prospera-plateforme#37, `dev` 50c12a6, étiquette `jeu-grossiste-golfe-v1.2` ;
  prospera-ventes-service#12, `dev` edb3f8f) ; ANNONCÉ avant la fusion du code (prospera-stories #715), sans écart. —
  `prospera-plateforme`, jeu « Grossiste du Golfe » 1.2.0 : le fichier des comptes.** Fiche : `stories/STORY-1064.md`
  (D-1064-1 → 9). Aucun manifeste, aucun fait, aucune route, aucun droit ne change ; `jeu-demonstration@1` n'est pas
  touché (il est à B).
  - **Fichier neuf** `comptes.json` à la racine de `grossiste-golfe-petit/`, `grossiste-golfe/`, `grossiste-golfe-grand/`
    (8, 16, 44 comptes) : `{ objet, cle, prenom, nom, roleMetier }`, le corps de la pose d'auth (STORY-972). Le bureau
    (`compte` : Akossiwa ATTISSO, Mensah KPOGO, Yawa AMEDOME, Ayité GBADOE), puis un compte par agent (`commercial`,
    `COM-nn`, prénom et nom de `terrain/commercial.json`).
  - **Le jeu 1.2.0** (étiquette `jeu-grossiste-golfe-v1.2` après la fusion) : les neuf fichiers de données de 1.1.0
    inchangés à l'octet ; `jeu.json` change de version, de `generateur.source` et ajoute `generateur.parametres.comptes`.
  - **Identités** : un compte a l'identifiant `identifiantDuJeu(org, objet, cle)` ; celui d'un agent est son commercial de
    `terrain` (et son `saisiePar` chez `commande`). Vecteurs (organisation `665f1c2a9b1e8a0012345678`), figés dans le
    générateur et dans `ventes` : `COM-01` `c6e2275ff50ddb28e5cf12c2`, `AKOSSIWA` `a4408f644e46aee756455091`, `MENSAH`
    `e47c3a156183ff30ed0ffc1a`, `YAWA` `df4829148668086cc8a39a72`, `AYITE` `d2d106c1f6f43af99764ba0c`.
  - **Pour B** : voir « Demandes aux autres groupes » (`comptes` dans `jeu-demonstration@1`, la pose par le catalogue).

- **PUBLIÉ (2026-11-18, STORY-1063, reseau-service#16, `dev` 25de958 → 4b55ac1 ; prospera-plateforme#36, `dev` 26977ca,
  étiquette `jeu-grossiste-golfe-v1.1`) ; ANNONCÉ avant la fusion du code (prospera-stories #712), sans écart. —
  `reseau-service`, routes C13 du module ; `prospera-plateforme`, jeu « Grossiste du Golfe » 1.1.0.** Fiche :
  `stories/STORY-1063.md` (D-1063-1 → 12). **Aucun manifeste amendé** (les routes sont déjà déclarées à
  `routesInstance`), aucun fait neuf, aucun droit neuf.
  - **Routes servies** (au moteur seul, limitées à son organisation, en essai seulement : `KAFKA_ESPACE=ESSAI`) : `POST
    /api/v1/instance/reseau/{organisationId}/import` (`import-c13-demande@1` → `import-c13-reponse@1`), objets
    **`hierarchie`** (`{ profondeurMax, libellesDeNiveaux }` : le gabarit), **`zone`** (`{ cle, nom, type, localites }`,
    sans parent), **`rattachement`** (`{ lieu: POINT_DE_VENTE|ENTREPOT, cle, zone, role: PRINCIPAL|SECOURS }`) ; `POST
    /api/v1/instance/reseau/{organisationId}/effacement` (`FIN_ESSAI` ; `effacement-c13-accuse@1`, `module: reseau`).
    Refus du socle C13 de 1058 (`ESPACE_REEL_REFUSE`, `ENREGISTREMENT_INVALIDE` avec le rang, `REFERENCE_INCONNUE`,
    `IDEMPOTENCE_REUTILISEE`, `IDENTITE_DE_SERVICE_REQUISE`, `ORGANISATION_HORS_JETON`…).
  - **Le jeu 1.1.0** (`jeux-demonstration/grossiste-golfe*/`, étiquette `jeu-grossiste-golfe-v1.1` après la fusion) :
    une part **`reseau`, la première**, avant `commande` et `terrain` ; leurs fichiers de 1.0.0 inchangés à l'octet.
  - **Identifiants** : une zone du jeu a l'identifiant `identifiantDuJeu(org, 'zone', clé)` (celui que `commande` et
    `terrain` portent déjà en `noeudId`) ; un lieu rattaché porte l'identifiant de `commande` (`point-de-vente`,
    `point-de-stock`). La zone d'un point de vente ou d'un point de stock se lit par `GET
    /api/v1/resolution?lieuType=POINT_DE_VENTE|ENTREPOT&lieuId=…` (route existante).
  - **Pour B** : voir « Demandes aux autres groupes » (le passage du catalogue à `v1.1`).

- **PUBLIÉ (2026-11-18, STORY-1062, prospera-ventes-service#11, `dev` 339a1ad → f49f3a6) ; ANNONCÉ avant la fusion du
  code (prospera-stories #698), sans écart ; schémas enregistrés en BACKWARD (Karapace, contre les versions
  d'`origin/dev`). — `prospera-ventes-service`, modules `commande` et `facturation` : le numéro `CMD-`, la commande
  transmise du terrain, l'annulation.** Fiche : `stories/STORY-1062.md`
  (D-1062-1 → 13). **Manifeste `facturation` amendé** (C5) : + consommé `commande.commande.annulee@1` (recopié à l'octet
  dans `ventes`). Le manifeste `commande` ne change pas (`commande.commande.annulee@1` et `commande:commande:annuler` y
  sont déjà).
  - **Fait neuf publié** : `commande.commande.annulee@1` (topic `commande.commande.annulee`, clé
    `<organisationId>:<commandeId>`, schéma `commande.commande.annulee-value` en BACKWARD) : `commandeId`, `numero`
    (`CMD-…` ou `null`), `pointDeVenteId`, `noeudId`, `canal`, `statutAvant`, `motif` (`CLIENT_ANNULE`,
    `ERREUR_DE_SAISIE`, `RUPTURE`, `PLAFOND_DE_CREDIT`, `AUTRE`), `bons` (`bonId`, `numero` `BL-` ou `null`,
    `pointDeStockId`), `annuleeLe`, `rang`. Ni prix, ni montant, ni texte libre. Consommé par `facturation` (même
    groupe `ventes-service.commandes-chiffrees`).
  - **Fait relâché** : `commande.serie.changed@1` porte aussi la série `commandes` (préfixe `CMD-`) : les
    énumérations de `serie` et de `prefixe` sont **retirées** (BACKWARD, vérifié au registre). Un consommateur qui
    gardait la tête des seuls bons filtre `serie = bons-livraison`.
  - **Routes** : `POST /api/v1/commande/commandes` sert le canal `TERRAIN` (la commande naît `TRANSMISE` ; corps
    `+ visiteId?`, `+ lignes[].grilleVersion`, exigée sur ce canal : 400 `GRILLE_VERSION_MANQUANTE` ; 409
    `COMMANDE_PROBABLEMENT_DOUBLE`) ; `CANAL_NON_SERVI` n'est plus rendu. **Neuve** : `POST
    /api/v1/commande/commandes/{commandeId}/annulation` (`commande:commande:annuler`, `Idempotency-Key`, corps `{ motif,
    texte? }`) ⇒ 201 la commande (+ `rejeu`, `liberations`) ; 400 `MOTIF_A_PRECISER` ; 404 ; 403 `HORS_PORTEE` ; 409
    `TRANSITION_INTERDITE`, `COMMANDE_FACTUREE`, `COMMANDE_DEJA_ANNULEE`, `CLE_REUTILISEE_AVEC_AUTRE_CHARGE`. `POST
    /api/v1/commande/validations` : `+ prixConfirmes?: { revision }` ; 409 `PRIX_CHANGE` (`details` : `revision`,
    `montantTtcMineur`, `lignes` avant et après). `POST /api/v1/facturation/factures` : 409 `COMMANDE_ANNULEE`.
  - **Lectures** (ajouts) : la commande rend `numero`, `revision`, `visiteId`, `ecartDePrix`, `annulation`, `lignes[]
    .grilleVersionAffichee`, `bons[].annuleLe` ; un bon peut être `ANNULE`. Les paramètres de `commande` gagnent
    `fenetreCommandeDoubleMinutes` (30 par défaut, de 1 à 1 440), **facultatif au `PUT`** (la forme de 1049 reste
    valide) et rendu par toute version lue.
  - **Aucun droit neuf** ; `commande:commande:annuler` est déjà dans la table d'accès d'`auth` (DC, RESP_VENTES,
    COMPTABLE). Rien n'est demandé aux autres groupes.

- **PUBLIÉ (2026-11-18, STORY-1061, prospera-ventes-service#10, `dev` 33bd0e7 → 68b293c) ; ANNONCÉ avant la fusion du
  code (prospera-stories #689), sans écart ; schémas enregistrés en BACKWARD (Karapace, contre les versions d'`origin/dev`).
  — `prospera-ventes-service`, module `facturation` : la suite de Sage posée avant la première facture, le format du
  numéro, le règlement de la facture lu chez `paiement`.** Fiche : `stories/STORY-1061.md` (D-1061-1 → 13). Aucun manifeste amendé : le droit (`facturation:numerotation:administrer`), le
  fait publié (`facturation.serie.changed@1`) et le fait lu (`paiement.creance.changed@1`) y sont déjà.
  - **Routes neuves** (garde `FACTURATION_NOT_ENTITLED`, table d'accès) :
    - `PUT /api/v1/facturation/numerotation/factures` (**`facturation:numerotation:administrer`**, le `DAF`) corps
      `{ format: { prefixe, annee, separateur, largeur }, dernierNumero, gelLe }` ⇒ 201 `{ serie, format, reprise:
      { dernierNumero, rang, annee, gelLe, poseeLe, posePar }, dernier, epoque, prochainNumero, rejeu }` ; la même suite
      rejouée : 200 (`rejeu: true`). Refus : 400 `SUITE_INVALIDE` (`details.erreurs`) ; 409 `SUITE_DEJA_REPRISE`, 409
      `NUMEROTATION_DEJA_ENGAGEE` (une facture a déjà été émise par Prospera).
    - `GET /api/v1/facturation/numerotation` (`facturation:numerotation:administrer` ou `facturation:facture:consulter`)
      ⇒ `{ series: [{ serie, format, reprise | null, dernier, epoque, trous, prochainNumero }] }`.
  - **Champ neuf** dans toute facture rendue (`POST /facturation/factures`, `GET …/factures/{id}`, `POST …/creance`) :
    `reglement: { statut: INCONNU|EMISE|PARTIELLE|PAYEE|CLOTUREE, enRetard, joursDeRetard, resteDuMineur,
    resteDuAfficheMineur, encaisseMineur, declareMineur, tropPercuMineur, revision, lueLe }` (montants `null` tant que
    `INCONNU`) : lu de `paiement`, jamais tenu par `facturation`.
  - **Comportement qui change** : une organisation dont la suite est posée numérote ses factures dans le format de la
    suite, à partir du rang repris + 1 (`FAC-2026-8821` ⇒ `FAC-2026-8822`). **Sans suite, rien ne change** (`FAC-AAAA-NNNNNN`
    depuis 1, Q-D-10).
  - **Schémas relâchés (ajout de liberté, rien de renommé ; compatibilité BACKWARD vérifiée au registre avant la
    fusion)** : `facturation.facture.emise-value`, champ `numero` : le motif `^FAC-[0-9]{4}-[0-9]{6,}$` est retiré (le
    numéro suit le format de la série) ; `facturation.serie.changed-value`, champ `prefixe` : l'énumération `["FAC-"]` est
    retirée. **Pour B** (consommateur à venir de `facturation.facture.emise@1`) : ne pas valider le numéro sur `FAC-` ;
    c'est un libellé, la clé reste `factureId`.
  - **Fait publié de plus** : `facturation.serie.changed@1` part aussi à la pose de la suite (`dernier` = le rang repris).
  - **Fait lu de plus** : `paiement.creance.changed` par un groupe neuf, `ventes-service.reglements` (depuis le début),
    variable facultative `KAFKA_REGLEMENTS_GROUP_ID`. **Pour B** : rien à faire ; si la charge change, le dire ici.
  - **Collections neuves** : `facturation_suites_numerotation`, `facturation_creances_lues`.

- **PUBLIÉ (2026-11-18, STORY-1060, prospera-plateforme#32, `dev` 8c61c48, étiquette `calendrier-distributeur-v1` ;
  prospera-terrain-service#4, `dev` fd5f4ee → 17bdba7) ; ANNONCÉ avant la fusion du code (prospera-stories #681), sans
  écart. — `prospera-plateforme` (`contrats/distributeur/`) et
  `prospera-terrain-service` (module `terrain`) : le calendrier de l'organisation, paramètre versionné, lu à l'import.**
  Fiche : `stories/STORY-1060.md` (D-1060-1 → 11). Tout est AJOUT ; un comportement change (la date des plans importés).
  - **Bibliothèque neuve** : `contrats/distributeur/src/calendrier.ts`, étiquette **`calendrier-distributeur-v1`**
    (1.0.0), copiée à l'octet par `terrain` (puis `pilotage`, FR-85). Aucun fichier de B touché (dossier de D déjà lu par
    les scripts racines) ; `contrats/distributeur/package.json` exporte `./calendrier`.
  - **Routes neuves** de `terrain` (garde `TERRAIN_NOT_ENTITLED`, table d'accès) : `GET /api/v1/terrain/parametres`
    (l'un des droits du module) ; `GET /api/v1/terrain/parametres/versions/{version}` (idem ; 404
    `PARAMETRES_VERSION_INCONNUE`) ; `PUT /api/v1/terrain/parametres` (**`terrain:parametres:modifier`**) corps
    `{ versionAttendue, valeurs: { calendrier: { joursTravailles, joursFeries } }, motif }` ⇒ la version suivante ; 400
    `PARAMETRES_INVALIDES` (`details.erreurs`), 409 `PARAMETRES_VERSION_PERIMEE` (`details.versionCourante`). Réponse :
    `{ version, valeurs, effetLe, auteur, motif }`.
  - **Droit neuf** au manifeste `terrain` (amendé dans cette PR, C7) : `terrain:parametres:modifier` ⇒ **→ B** (catalogue
    des droits de tenant). Jusqu'à lui, `PUT` répond 403 `DROIT_INSUFFISANT` à tous (échec fermé).
  - **Comportement qui change** : la route C13 d'import de `terrain` (contrat inchangé) date les plans de journée par le
    calendrier de l'organisation, et non plus « hors dimanche » : un jour férié du calendrier par défaut (25 décembre,
    1er janvier…) est sauté. Chaque plan porte `parametresVersion` (champ neuf de `terrain_plans_de_journee`).
  - **Collection neuve** : `terrain_parametres` (une version par changement, la première posée à la première lecture ou
    au premier import), effacée par la route C13 d'effacement (plan de 1058). Aucun fait publié (D-1060-10).

- **PUBLIÉ (2026-11-17, STORY-1059, prospera-ventes-service#8, `dev` 1c1e944 → bd8d211) ; ANNONCÉ avant la fusion du
  code (prospera-stories #666). Un écart : `COMMANDE_INCONNUE` n'est pas émis (un `commandeId` mal formé rend la 400 de
  validation, une commande inconnue de `facturation` 409 `COMMANDE_NON_FACTURABLE`). Schémas enregistrés en BACKWARD
  (`commande.commande.chiffree-value`, `facturation.facture.emise-value`, `facturation.serie.changed-value`). —
  `prospera-ventes-service`, modules `facturation` et `commande` : la facture émise, sa Créance ouverte dans
  `paiement`, trois faits neufs publiés, la Créance projetée.**
  Fiche : `stories/STORY-1059.md` (D-1059-1 → 12). Tout est AJOUT : aucune route, aucun topic, aucun champ existants ne
  changent. Manifestes amendés dans cette PR (C5) : `commande` publie `commande.commande.chiffree@1` et consomme
  `facturation.facture.emise@1` ; `facturation` publie `facturation.serie.changed@1` et consomme
  `commande.commande.chiffree@1` (les trois noms sont au catalogue `contrats-distributeur-v1`).
  - **Routes neuves** (garde `FACTURATION_NOT_ENTITLED`, droits de la table d'accès, portée du nœud de la commande) :
    - `POST /api/v1/facturation/factures` (`facturation:facture:emettre` ; `Idempotency-Key` exigée) : corps
      `{ commandeId }` (une commande `VALIDEE`) ; 201 la facture `{ factureId, numero (FAC-AAAA-NNNNNN), commandeId,
      mode: DES_LA_VALIDATION, tiersId, perimetre, devise, lignes, montantHtMineur, tva, montantTvaMineur,
      montantTtcMineur, echeanceLe, emiseLe, bons, ouvertureDeLaCreance: { etat: OUVERTE|A_OUVRIR|REFUSEE, motif?,
      tentatives, ouverteLe?, cleRegistre? }, rejeu }`. Rejeu (même clé, ou même commande) : la même facture, aucun
      numéro de plus.
    - `GET /api/v1/facturation/factures/{factureId}` (`facturation:facture:consulter`) ; hors portée ou inconnue : 404
      `FACTURE_INCONNUE`.
    - `POST /api/v1/facturation/factures/{factureId}/creance` (`facturation:facture:emettre`) : relance l'ouverture de
      la Créance (même clé chez `paiement`) ; rend la facture.
  - **Codes neufs** : `CLE_D_IDEMPOTENCE_MANQUANTE`, `COMMANDE_INCONNUE` (400/404), `COMMANDE_NON_FACTURABLE`,
    `CONDITIONS_REGLEMENT_MANQUANTES`, `CLE_REUTILISEE_AVEC_AUTRE_CHARGE` (409), `HORS_PORTEE` (403),
    `FACTURE_INCONNUE` (404).
  - **Appel sortant** : `PUT {PAIEMENT_SERVICE_URL}/api/v1/creances/sources/FACTURE/{factureId}` (B-963), jeton du
    membre qui émet, corps `{ tiersId, perimetre, montantOrigineMineur, devise, echeanceLe, libelle }`. **Pour B** :
    aucune action ; la route est rejouée sur la même clé (relance, rejeu), comme votre fiche le permet.
  - **Faits neufs** (outbox `socle_outbox`, topic sans `@1`, `schemaVersion: 1`, enveloppe `eventId`, `schemaVersion`,
    `occurredAt`, `organisationId` ; schémas dans `contrat/schemas/`, au registre en **BACKWARD**) :
    - `commande.commande.chiffree` (clé `<organisationId>:<commandeId>`), dans la transaction où la commande passe
      `VALIDEE` : `commandeId`, `pointDeVenteId`, `noeudId`, `canal`, `perimetre`, `devise`, `lignes[{ ligne,
      articleId, pointDeStockId, quantite, prixUnitaireHtMineur, tauxTvaPourDixMille, montantHtMineur }]`, `tva[]`,
      `montantHtMineur`, `montantTvaMineur`, `montantTtcMineur`, `bons[{ bonId, numero, pointDeStockId }]`,
      `valideeLe`, `rang` — **jamais la marge** (donnée privée) ;
    - `facturation.facture.emise` (clé `<organisationId>:<factureId>`) : `factureId` (le `sourceId` de la Créance),
      `numero`, `commandeId`, `livraisonId` (`null`), `tiersId`, `perimetre`, `devise`, `montantHtMineur`,
      `montantTvaMineur`, `montantTtcMineur`, `echeanceLe`, `emiseLe`, `rang` — **la charge que B attend pour son
      consommateur** (D-965-9 ; écart à la proposition : `montantTtcMineur`) ;
    - `facturation.serie.changed` (clé `<organisationId>:factures`) : `serie`, `prefixe`, `dernier`, `epoque`.
  - **Faits lus** (groupes neufs, depuis le début, §1.9) : `ventes-service.creances` (`paiement.creance.changed`,
    `facturation.facture.emise`) ; `ventes-service.commandes-chiffrees` (`commande.commande.chiffree`).
  - **Comportement qui change pour `commande`** : dès que la Créance d'une organisation est projetée, une commande à
    crédit n'est plus refusée `ENCOURS_NON_INSTALLE` : elle est jugée sur l'encours (`PLAFOND_CREDIT_DEPASSE` au-delà) ;
    l'engagement baisse du TTC d'une facture à la réception de sa Créance (et publie son état absolu).
  - **Collections neuves** : `facturation_factures`, `facturation_commandes_chiffrees`,
    `facturation_conditions_reglement` (projection future de `pdv.point-de-vente.changed@1`, remplie par personne
    aujourd'hui), `facturation_series`, `commande_factures`. **Variables** (facultatives) : `PAIEMENT_SERVICE_URL`
    (absente : `A_OUVRIR`, motif `PAIEMENT_NON_CONFIGURE`), `PAIEMENT_DELAI_MS`, `FACTURATION_RELANCE_CREANCE_MS`,
    `KAFKA_CREANCES_GROUP_ID`, `KAFKA_COMMANDES_CHIFFREES_GROUP_ID`.

- **PUBLIÉ (2026-11-17, STORY-1058 ; prospera-ventes-service#7 `dev` 88ee146 → 7f674ef, prospera-terrain-service#3
  `dev` cefe9b9, 068e1c0, prospera-plateforme#30 `dev` d36623b) ; ANNONCÉ avant la fusion du code (prospera-stories
  #662). Aucun écart avec l'annonce ; le `commercial` du jeu porte aussi sa `commune`. — `prospera-ventes-service` (module `commande`),
  `prospera-terrain-service` (module `terrain`) : les routes C13 d'import et d'effacement ; `prospera-plateforme` : le
  jeu « Grossiste du Golfe ».** Fiche : `stories/STORY-1058.md` (D-1058-1 → 14). Tout est AJOUT : aucune route, aucun
  topic, aucun champ existants ne changent.
  - **Routes neuves** (déjà déclarées aux manifestes, `routesInstance`), aux corps exacts de `contrats-instance-v1`
    (copies à l'octet) : `POST /api/v1/instance/commande/{organisationId}/import` et `…/effacement`,
    `POST /api/v1/instance/terrain/{organisationId}/import` et `…/effacement`. Import : `IMPORTE`, puis `DEJA_IMPORTE` ;
    effacement : `EFFACE`, puis `DEJA_EFFACE`. **Seul le jeton de service du moteur** (`identite: MOTEUR`, limité à
    l'organisation du chemin) ; **seulement dans un espace d'essai** (`INSTANCE_ESPACE=ESSAI`, variable neuve des deux
    services, absente ⇒ réel). Refus : 401 `JETON_DE_SERVICE_INVALIDE` ; 403 `IDENTITE_DE_SERVICE_REQUISE`,
    `ORGANISATION_HORS_JETON`, `ESPACE_REEL_REFUSE` ; 400 `IMPORT_HORS_CONTRAT`, `EFFACEMENT_HORS_CONTRAT`,
    `ORGANISATION_INCOHERENTE` ; 409 `IDEMPOTENCE_REUTILISEE` ; 422 `SOURCE_NON_SERVIE` (`DOSSIER_INSTALLATION`),
    `MOTIF_NON_SERVI` (`FIN_CONTRAT`), `OBJET_NON_IMPORTABLE`, `ENREGISTREMENT_INVALIDE`, `REFERENCE_INCONNUE`.
  - **Un jeton de service sur toute autre route** de `ventes` ou de `terrain` : 403 **`IDENTITE_DE_SERVICE_REFUSEE`**
    (code de garde neuf dans les deux services, celui du catalogue et du LC fictif).
  - **Objets importés** : `commande` ← `point-de-vente`, `plafond`, `prix` (ils remplissent `commande_points_de_vente`,
    `commande_plafonds`, `commande_prix`) ; `terrain` ← `commercial`, `point-de-vente`, `plan-de-journee`. Les références
    sont des clefs du jeu, traduites par `identifiantDuJeu(organisationId, objet, clef)` (24 hex de
    `sha256("jeu-demonstration|<org>|<objet>|<clef>")`, D-1058-4) : **pour B** (comptes du jeu, `objet = commercial`), et
    pour les parts futures de `reseau`, `pdv`, `catalogue`, `stock`.
  - **Jeux** : `jeux-demonstration/grossiste-golfe-petit/`, `grossiste-golfe/`, `grossiste-golfe-grand/` (deux parts,
    `commande` puis `terrain`), étiquette `jeu-grossiste-golfe-v1`. **Pour B** : `INSTALLATION_SERVICES` doit nommer
    `commande` (ventes) et `terrain` ; une ligne du tableau du README de la plateforme (dossiers de D).

- **PUBLIÉ (2026-11-17, STORY-1057, prospera-assureur-fictif#5, `dev` 51f2639 → f9bbea5) ; ANNONCÉ avant la fusion
  du code (prospera-stories #658). Aucun écart avec l'annonce. — `prospera-assureur-fictif` : les cinq routes de
  vérification C13, la recette de la démo, la boîte aux lettres fermée après un effacement.** Ajouts au cycle
  d'administration (`POST /assureur-fictif/cycle`) : `fermee: true` quand l'organisation est effacée. Fiche :
  `stories/STORY-1057.md` (D-1057-1 → 9). Rien d'existant ne change de forme : ni l'API du LC (`/lc/echange`), ni le fil
  (lots, accusés, numéros), ni l'import et l'effacement C13, ni l'administration.
  - **Routes neuves** (déjà déclarées au manifeste, C13 points 2 et 8), sous le seul jeton de service du **moteur**
    (`identite: MOTEUR`, limité à l'organisation du chemin ; sinon 403 `IDENTITE_DE_SERVICE_REQUISE`,
    `ORGANISATION_HORS_JETON`), hors de la garde du module :
    `POST /api/v1/instance/assureur-fictif/{organisationId}/verifications/<code>`, corps ignoré, `Idempotency-Key`
    acceptée (aucune ne modifie l'organisation). Réponse 200 au contrat **`verification-installation@1`**
    (`{ schemaVersion: 1, code, voyant: VERT|ORANGE|ROUGE, mesure, detail, action? }`, copie à l'octet de
    `platform-catalog-service/contrat/verification-installation.schema.json`). Codes : `assureur-fictif-absent-du-reel`,
    `objets-de-l-annexe-c`, `numero-sans-trou`, `jeu-sans-personne-reelle`, `remise-a-zero` ; tout autre : 404
    `VERIFICATION_INCONNUE`. **Pour B** : `INSTALLATION_SERVICES=assureur-fictif=<url>` suffit ; le LC fictif devient
    installable par un plan dans un espace d'essai. **Dans un espace réel**, le service ne démarre pas (STORY-1048) : la
    vérification `assureur-fictif-absent-du-reel` y est `NON_EXECUTEE` chez le moteur, jamais `VERT`.
  - **Boîte aux lettres** : après un **effacement C13**, le LC ne relève plus la `sortie` de l'organisation ni ne dépose
    rien dans son `entree`, jusqu'au **premier import C13 suivant** ou à une **remise à zéro**, qui écartent alors ce que
    Prospera y avait déposé avant (journal des reçus : `IGNORE`, code neuf **`ANTERIEUR_A_L_EFFACEMENT`**, ou
    `ANTERIEUR_A_LA_REMISE_A_ZERO`). Pour C : rejouer un parcours après un effacement demande des lots neufs, comme
    après une remise à zéro.
  - **La recette** : `npm run recette:demo` (dans l'image : `node dist/modules/assureur-fictif/recette/recette-demo.js`),
    variables `RECETTE_LC_URL`, `RECETTE_ORGANISATION`, `RECETTE_JETON_LC`, `RECETTE_JETON_ADMIN`,
    `RECETTE_JETON_MOTEUR` (ou `RECETTE_EMETTEUR_URL`, qui les fournit), `RECETTE_TAILLE` (`REDUITE` par défaut,
    `DEMO`) ; sortie 0 si la part du LC est verte, 1 sinon. Profil compose **`recette`** (neuf) :
    `emetteur-de-recette` (JWKS et jetons d'essai), `droit-de-recette` (le droit du module sur `entitlement.changed`),
    `recette-demo`. Aucun port publié de plus.

- **PUBLIÉ (2026-11-17, STORY-1056, prospera-ventes-service#6, `dev` 10b8ba5 → 7221f4c) ; ANNONCÉ avant la fusion
  du code (prospera-stories #654). Aucun écart avec l'annonce, sauf un code de plus : `MONTANT_HORS_BORNES` (400, une
  saisie dont un montant dépasse les entiers sûrs). — `prospera-ventes-service`, module `commande` : la saisie, la
  validation branchée sur elle, le bon `EMIS` et son numéro `BL-`, quatre faits publiés.** Fiche :
  `stories/STORY-1056.md` (D-1056-1 → 13). Aucun topic, aucune route existants ne sont renommés. Schémas enregistrés
  sur `commande.*-value` en BACKWARD (`npm run schemas:enregistrer`).
  - **Routes neuves** (garde `COMMANDE_NOT_ENTITLED`, droits de la table d'accès) :
    - `POST /api/v1/commande/commandes` (`commande:commande:saisir` ; `Idempotency-Key` exigée) : corps
      `{ commandeId (UUID né chez l'appelant), pointDeVenteId, canal: BUREAU|TELEPHONE|WHATSAPP|COMPTOIR,
      devise? (XOF), pointDeStockId?, dateLivraisonSouhaitee? (AAAA-MM-JJ), messageClient?, lignes: [{ articleId,
      quantite: { valeur, unite }, pointDeStockId? }] }` ; 201 la commande `BROUILLON` (lignes au prix figé, origine
      et version de grille, totaux HT, TVA par taux, TTC) ; rejeu : la même commande.
    - `GET /api/v1/commande/commandes?limite=` et `GET /api/v1/commande/commandes/{commandeId}`
      (`commande:reseau:consulter` ou `commande:portefeuille:consulter`) : la commande avec son acte et ses bons
      (numéros), dans la portée de lecture ; hors portée, 404 `COMMANDE_INCONNUE`. La marge reste une donnée privée
      (`catalogue:marge:consulter`), `null` tant que le coût de `stock` n'est pas branché.
  - **Route qui prend sa forme définitive** (annoncée « squelette » par 1049, D-1049-9 ; aucun consommateur) :
    `POST /api/v1/commande/validations` reçoit **`{ commandeId }`**, la commande saisie ; les champs du squelette
    (`tiersId`, `perimetre`, `devise`, `montantTtcMineur`, `noeudId`, `margeMineur`, `bons`) sont **refusés** (400).
    L'acte rendu gagne, par bon, `etat: EMIS`, `numero` (`BL-AAAA-NNNNNN`), `rangDansLaSerie`, `epoque`, `emisLe` ; et
    `commande: { statut }`. `POST …/validations/{commandeId}/reservations` (reprise) émet en plus les bons devenus
    complets.
  - **Codes neufs** : `COMMANDE_INCONNUE` (404), `COMMANDE_DEJA_SAISIE`, `POINT_DE_VENTE_INCONNU`,
    `ARTICLE_SANS_PRIX`, `UNITE_NON_VENDUE`, `TRANSITION_INTERDITE` (409), `PDV_HORS_PERIMETRE` (403),
    `COMMANDE_SANS_LIGNE`, `CANAL_NON_SERVI` (400).
  - **Faits publiés** (outbox transactionnelle `socle_outbox`, un seul relais ; topic sans `@1`, `schemaVersion: 1`,
    en-têtes `eventId` et `schemaVersion` ; enveloppe `eventId`, `schemaVersion`, `occurredAt`, `organisationId` ; un
    `rang` par objet ; schémas dans `contrat/schemas/` de `ventes`, au registre sur `<topic>-value` en **BACKWARD**) :
    - `commande.engagement-tiers.changed` (clé `<organisationId>:<tiersId>:<perimetre>`) : `revision`, `tiersId`,
      `perimetre`, `devise`, `restantAFacturerMineur`, `versionEncours` — la forme de l'entrée `engagement`
      d'`encours@1` ; écrit dans la transaction de l'acte ; pour `pdv` et `recouvrement` ;
    - `commande.bon-livraison.emis` (clé `<organisationId>:<commandeId>`) : `bonId`, `commandeId`, `numero`,
      `rangDansLaSerie`, `epoque`, `pointDeStockId`, `pointDeVenteId`, `lignes[{ ligne, articleId, quantite }]`,
      `emisLe` — **sans prix** ;
    - `commande.serie.changed` (clé `<organisationId>:bons-livraison`) : `serie`, `prefixe`, `dernier`, `epoque` ;
    - `commande.commande.validee` (clé `<organisationId>:<commandeId>`) : `commandeId`, `pointDeVenteId`, `noeudId`,
      `canal`, `bons[{ bonId, numero, pointDeStockId, lignes }]`, `valideeLe` — **sans prix ni identité de
      freelance**.
  - **Manifeste `commande`** (prospera-stories, C5) : `publie` gagne `commande.engagement-tiers.changed@1` et
    `commande.serie.changed@1` (faits « nouveaux » d'AD-20) ; recopié à l'octet dans `ventes`.
  - **Collections neuves** : `commande_commandes`, `commande_points_de_vente` et `commande_prix` (read-models,
    projections futures de `pdv.point-de-vente.changed@1` et `catalogue.grille.publiee@1`, **remplis par personne
    aujourd'hui** : sans document, `POINT_DE_VENTE_INCONNU` ou `ARTICLE_SANS_PRIX`), `commande_reservations_de_recette`,
    `socle_outbox`, `socle_verrous`. `commande_bons` gagne `numero`, `rangDansLaSerie`, `epoque`, `emisLe` ; l'état
    `EMIS`.
  - **Variables** (facultatives) : `COMMANDE_RESERVATION_STOCK` (`non-branchee` par défaut ; `recette` **refusée en
    production**), `OUTBOX_RELAIS_INTERVALLE_MS`, `OUTBOX_TAILLE_PAQUET`, `OUTBOX_VERROU_TTL_MS`.
  - **Copie neuve** : `contrats/distributeur/src/index.ts` et `catalogue-faits.json` à `contrats-distributeur-v1`, dans
    `src/socle/contrats-distributeur/` (la copie d'`acces.ts` ne change pas).

- **PUBLIÉ (2026-11-17, STORY-1055, reseau-service#15, `dev` c62f586 → d31f744 ; prospera-plateforme#29, `dev`
  a458b26, étiquette `objets-reseau-v1`) ; ANNONCÉ avant la fusion du code (prospera-stories #650). Aucun écart avec
  l'annonce.** `reseau-service` reçoit la Reprise : `reseau.zone@1.0` et
  `reseau.commercial@1.0`, par `kit-cible` 1.0.1.** Rien d'existant ne change de forme. Ce sont des **ajouts** :
  - **Deux routes neuves** (contrat `reprise-cible.openapi.json` de la plateforme, servi par `traiterRequete` du kit) :
    `POST /api/v1/reprise/reseau/{organisationId}/objets/{zone|commercial}` (`SIMULER`, `APPLIQUER`) et
    `POST /api/v1/reprise/reseau/{organisationId}/controles/{zone|commercial}`. Corps et refus : `enveloppe-reprise@1`,
    `reponse-reprise@1`, `refus-reprise@1`, `controles-*@1`.
    - L'organisation du chemin est celle du jeton (403 `ORGANISATION_HORS_JETON`).
    - L'état publié du module et la matrice décident seuls : 403 `RESEAU_NOT_ENTITLED` ou `ABONNEMENT_EXPIRE`.
    - Ni KYC ni droit de tenant sur ces routes.
  - **Jetons de service** (patron de STORY-948 et de STORY-1046) : `identite` `REPRISE`, `CONNECTEURS` ou `MOTEUR`,
    avec `organisationId`. Ils sont admis sur ces deux routes seulement ; ailleurs, 403
    `IDENTITE_DE_SERVICE_REFUSEE`. Un jeton d'utilisateur n'est jamais ouvert par la matrice sur ces routes.
  - **Deux schémas d'objets** écrits par D dans `prospera-plateforme/contrats/objets/reseau/` (`zone@1.0.json`,
    `commercial@1.0.json`, étiquette `objets-reseau-v1`) :
    - **zone** : `code`, `nom`, `type`, `parent` (référence vers une zone), `localites`, `statut` (`OUVERT`, `FERME`) ;
    - **commercial** : `prenom`, `nom`, `email`, `telephone`, `statutEmploi`, `etat` (`EN_POSTE`, `PARTI`), `zone`
      (référence vers une zone), `affecteDepuis`, `partiLe`.
    - Les deux admettent `VIVANT` et `HISTORIQUE`. Valeurs de contrôle : `statut` et `etat`, lues sur l'objet vivant.
  - **Manifeste `reseau`** : `objetsDeReprise` ne change pas (`reseau.zone@1`, `reseau.commercial@1`). Son
    commentaire dit ce qui est servi (prospera-stories `manifestes/reseau.manifest.ts`, recopié à l'octet dans le
    service).
  - **Faits** : aucun topic neuf, aucun champ neuf. Une reprise appliquée publie les faits existants, par l'outbox,
    dans sa transaction : `reseau.noeud.created@1`, `reseau.noeud.closed@1` (zone `HISTORIQUE`),
    `reseau.commercial.changed@1` et `reseau.portee.changed@1` quand la hiérarchie change une portée résolue. `SIMULER`
    ne publie rien.
  - **Collections neuves** : `reprise_fiches`, `reprise_cles`, `reprise_resultats`, `reprise_lots`, `reprise_traces`.
    Les collections métier ne gagnent aucun champ.
  - **Exploitation** : l'analyseur JSON du service passe de 100 Kio à 2 Mio (le kit répond 413 au-delà de 1 Mio) ;
    `ajv` passe en dépendance d'exécution.
  - **L'import par fichier de 1041** (`POST /api/v1/import/compte-rendu`, `POST /api/v1/import`) ne change pas de forme.
    Il juge et écrit par le même moteur des zones (D-1055-2).
  - Fiche : `stories/STORY-1055.md` (D-1055-1 → 13).

- **PUBLIÉ (2026-11-17, STORY-1054, prospera-notification-service#91, `dev` d9de737 → e0a50c0) ; ANNONCÉ avant la
  fusion du code (prospera-stories #647) — `prospera-notification-service` : prévenir l'assuré (2).** Écarts avec
  l'annonce : `DOSSIER_INVALIDE` répond 400 (comme 1051) ; le dépôt ne garde `code` que s'il est un code nommé ;
  `voie` est absente tant qu'un message est en cours de remise. Rien d'existant ne change de forme ; **ajouts** et **deux comportements** qui changent. Fiche :
  `stories/STORY-1054.md` (D-1054-1 → 12).
  - **Routes neuves, appel de service** (même porte que le destinataire, `sinistres-service` seul ; 401
    `JETON_DE_SERVICE_INVALIDE`, 403 `APPELANT_HORS_PERIMETRE`) :
    - `POST /api/v1/service/assurance/dossiers/{dossierId}/consentements`, corps `{ organisationId, finalite,
      decision: "ACCORDE"|"RETIRE", versionTexte? (exigée pour ACCORDE), recueilliLe (ISO), recueilliPar }` ;
      200 `{ dossierId, finalite, obligatoire, etat, decision? }` ; 422 `FINALITE_INCONNUE`, `FINALITE_OBLIGATOIRE`,
      `VERSION_DU_TEXTE_REQUISE`, `DATE_DE_DECISION_FUTURE`, `DOSSIER_INVALIDE`. En ajout seul ; le même acte rejoué
      n'ajoute rien.
    - `GET /api/v1/service/assurance/dossiers/{dossierId}/consentements?organisationId=` : par finalité,
      `{ finalite, obligatoire, etat: ACCORDE|RETIRE|INCONNU, historique[] }`.
    - `GET /api/v1/service/assurance/dossiers/{dossierId}/messages?organisationId=` : par message, `{ evenement, cle,
      finalite, demandeLe, voie: EXTERNE|CLOCHE, canal?, etat: EN_COURS|TRANSMIS|REMIS|LU|NON_REMIS|EN_CLOCHE,
      transmisLe?, remisLe?, luLe?, cloche?: { motif, deposeLe, objet?, corps } }` ; jamais l'adresse.
  - **Finalités** : `SUIVI_DU_SINISTRE` (obligatoire : huit messages, dont les relances) et `INFORMATION_DU_DOSSIER`
    (facultative : `assurance-numero-officiel`).
  - **Comportements qui changent** : (1) le numéro officiel **ne part plus par SMS ou e-mail sans `ACCORDE`** sur
    `INFORMATION_DU_DOSSIER` (échec fermé) : il tombe dans la cloche de l'assuré ; (2) un message qui ne peut pas
    partir (pas de destinataire, canal refusé, envoi en échec sans maillon restant) **tombe dans la cloche** au lieu
    de se perdre au journal, et une relance déposée compte comme donnée (la chaîne ne s'arrête plus faute de
    destinataire).
  - **Collections neuves** (effacées avec l'organisation) : `assurance_messages`, `assurance_consentements`.
  - **Aucun** topic, aucun consommateur, aucune variable d'environnement neufs.
  - **→ C** : voir « Demandes aux autres groupes » (consentements à la déclaration, lecture de l'accusé).
- **PUBLIÉ (2026-11-17, STORY-1053 : prospera-plateforme#28, `dev` e3727f8, étiquette `acces-distributeur-v1` ;
  ventes #5 `dev` 9e626fa ; terrain #2 5b701a8 ; recouvrement #2 2879924 ; pilotage #2 faa553a ; croissance #2
  a035e61) ; ANNONCÉ avant la fusion du code (prospera-stories #638) — les 15 rôles appliqués par les cinq services du
  distributeur** (`prospera-ventes-service`, `-terrain-`, `-recouvrement-`, `-pilotage-`, `-croissance-service`) et
  la bibliothèque `acces-distributeur` (`prospera-plateforme/contrats/distributeur/src/acces.ts`, étiquette
  `acces-distributeur-v1`, rien d'existant n'y change). Aucun topic, aucun champ n'est renommé ni retiré ; **ce qui
  change, ce sont des refus et une variable requise.** Fiche : `stories/STORY-1053.md` (D-1053-1 → 9).
  - **Écart avec l'annonce** : les deux réglages facultatifs s'appellent `DROITS_DELAI_MS` et `DROITS_CACHE_TTL_MS`,
    comme dans `reseau` (D-1053-10), au lieu des `AUTH_DROITS_*` annoncés. Rien d'autre.
  - **Variable neuve, REQUISE dans les cinq services** : `AUTH_SERVICE_URL` (auth-service, pour
    `GET /api/v1/moi/droits`) ; facultatives : `DROITS_DELAI_MS` (2 000), `DROITS_CACHE_TTL_MS` (60 000, 60 s
    au plus), `KAFKA_DROITS_MEMBRES_GROUP_ID`, `KAFKA_PORTEES_GROUP_ID`. Une pile sans `AUTH_SERVICE_URL` ne démarre
    plus.
  - **Refus neufs sur toute route d'un module** (après la garde du module) : **403 `DROIT_INSUFFISANT`** (le membre n'a
    pas le droit que la route déclare) et **503 `DROITS_INDISPONIBLES`** (auth injoignable, plus de 2 s, réponse
    illisible). ⚠ **Un membre sans rôle `DIST_*` n'a plus accès à aucun module des cinq services** (D-960-12), y compris
    `TENANT_ADMIN` : `GET /<module>/module` et `GET /<module>/piste` exigent l'un des droits du module (manifeste, C7).
    Le module `support-client` est fermé à tous tant que ses droits ne sont pas au catalogue.
  - **Faits consommés en plus par les cinq services** : `reseau.portee.changed@1` (groupe `<service>.portee-reseau`,
    projection `socle_portees_reseau`) et `identity.droits.changed@1` (groupe `<service>.droits-membres`, invalidation
    du cache). Chaque service passe `conformite-portee-reseau-v1` et s'inscrit au registre de `reseau` pour ses
    modules.
  - **`commande` (`ventes`)** : `PUT /api/v1/commande/parametres` exige le droit **neuf**
    `commande:parametres:modifier` (au lieu de `TENANT_ADMIN`) — **403 pour tous jusqu'à ce qu'auth l'attribue** (→ B
    plus bas) ; `GET /api/v1/commande/series` et les émissions de recette exigent `commande:bon-livraison:emettre` ;
    valider et reprendre la saga exigent `commande:commande:valider` ; lire un acte, `commande:reseau:consulter` ou
    `commande:portefeuille:consulter`. **Route neuve** : `GET /api/v1/commande/validations?limite=` (les actes du
    périmètre). **Corps de `POST /commande/validations`** : deux champs AJOUTÉS, facultatifs, `noeudId` (ObjectId hex)
    et `margeMineur` (entier). **Lecture filtrée par la portée** : un acte hors du périmètre rend 404
    `VALIDATION_INCONNUE` ; un acte sans nœud n'est visible que d'une portée totale. **Code neuf** : 403 `HORS_PORTEE`
    (créer ou reprendre hors de l'écriture). **Donnée privée** : `margeMineur` est **absent** de l'acte rendu à qui n'a
    pas `catalogue:marge:consulter`.
  - **Manifeste `commande`** (prospera-stories) : droit AJOUTÉ `commande:parametres:modifier` (D-1053-7, Q-D-5) ; copié
    à l'octet dans `ventes`.

- **PUBLIÉ (2026-11-17, STORY-1052, prospera-plateforme#27, `dev` 1fe8c5e, étiquette `series-v1.1` ;
  prospera-ventes-service#4, `dev` 32d8b5f → e4a27c7) ; ANNONCÉ avant la fusion du code (prospera-stories #632) —
  `series-v1.1` (plateforme) et les séries hébergées de `prospera-ventes-service`.** Rien d'existant ne change de
  forme ; `series-v1` ne bouge pas. Écart avec l'annonce : une variable de plus, `LOG_PRETTY` (facultative ; par
  défaut rien ne change), pour qu'une pile de recette démarre sur l'image runtime. sha256 de `series/src/index.ts` à
  `series-v1.1` : `68833b1af555ab70f50054f11f9bfddf37316d692082d11bd62b8a42f37a13a4`.
  - **`series-v1.1`** (`prospera-plateforme/series/src/index.ts`, version `1.1.0`, majeur 1, compatible avec
    `series-v1`) : ajouts seulement — `new Series(depot, prefixes, { ancre, horloge })` (sans ancre : comme v1),
    `confirmer`, `reconcilier`, `reconcilierTout`, `etat`, `lister`, `ancreMongo`, `ancreEnMemoire`, types
    `TrouDeclare`, `EtatDAncre`, `AncreDesSeries`, `Reconciliation`, `NiveauxMongo` ; méthodes **facultatives** du
    dépôt (`sauter`, `lister`, `enTransaction`, `assurer`, `lireEngage`) ; refus neufs `ANCRE_INDISPONIBLE`,
    `DEPOT_INCOMPLET`, `SERIE_INSTABLE` ; `NumeroEmis.trou` n'apparaît que lors d'un saut. `emettre`, `amorcer`,
    `tete`, `reprendreApresRestauration` gardent leur forme (la reprise déclare désormais son trou dans la série).
    **Changements de comportement de `depotMongo`** (plus stricts) : hors transaction, `w: majority`, `j: true`,
    `wtimeoutMS` 10 s et lecture `linearizable` (`maxTimeMS` 10 s) ; `lire` passe la session ; en transaction, la
    série est créée **hors** de la transaction avant l'incrément (`assurer`). Étiquette `series-v1.1` posée à la
    fusion ; empreinte dans la fiche.
  - **`ventes`** : variables neuves, facultatives — `SERIES_ANCRE_URI` (l'ancre, base à part ; absente :
    `SERIES_SANS_ANCRE` au journal), `MONGODB_MEMBRES_PORTEURS_MIN` (1 par défaut ; 3 en hébergé : sinon le service
    **ne démarre pas**, `JEU_DE_REPLIQUES_INSUFFISANT`), `SERIES_EMISSIONS_DE_RECETTE` (`actif` refusé en
    production). Collections neuves : `commande_series` (une série par organisation, `<organisationId>:bons-livraison`),
    `commande_numeros_de_recette` ; dans la base de l'ancre, `series_ancre`. Routes neuves (garde
    `COMMANDE_NOT_ENTITLED`, `TENANT_ADMIN` jusqu'à 1053) : `GET /api/v1/commande/series` (têtes, époques, trous
    déclarés) ; `POST /api/v1/commande/series/{serie}/emissions-de-recette` (fermée sauf recette). Codes neufs de
    `commande` : `SERIE_INCONNUE`, `ROUTE_DE_RECETTE_FERMEE`. Journal : `SERIE_DERIVE` (erreur, l'alerte d'AD-32) quand
    une restauration est constatée. Compose neuf : `docker-compose.heberge.yml` (trois membres, ancre). Aucun fait
    publié, aucun topic.
  - **→ B** : voir « Demandes aux autres groupes » (information).

- **PUBLIÉ (2026-11-17, STORY-1051, prospera-notification-service#90, `dev` 7d4b24d → b3d4388) ; ANNONCÉ avant la
  fusion du code (prospera-stories #620) — `prospera-notification-service` : prévenir l'assuré (1).** Rien d'existant
  ne change de forme ; ajouts seulement. Écart avec l'annonce : aucun.
  - **Fait consommé** : `sinistres.dossier.changed@1` (contrat de C, inchangé), groupe neuf `notification-assurance`
    (`KAFKA_ASSURANCE_GROUP_ID`). Un message part au **changement** d'état du dossier, côté assuré seulement
    (D-1051-3) ; `FRAUDE_SUSPECTEE`, `LITIGE`, `REJETE`, `SANS_SUITE` et les états internes ne produisent rien.
  - **Route neuve, appel de service** : `PUT /api/v1/service/assurance/dossiers/{dossierId}/destinataire` (jeton de
    service, appelant **`sinistres-service`** seul ; corps `{ organisationId, canal: "sms"|"email", destinataire,
    langue? }` ; 200 `{ dossierId, canal, langue, enregistreLe }`, l'adresse n'est jamais rendue ; 403
    `APPELANT_HORS_PERIMETRE`, 422 `IDENTIFIANT_NON_NORMALISABLE`, `CANAL_NON_SERVI_A_L_ASSURE`). Sans destinataire
    enregistré, aucun message ne part (`CANAL_ABSENT`, journalisé).
  - **Appelant de service neuf** : `sinistres-service` entre à `JETONS_DE_SERVICE` ; son périmètre sur
    `POST /api/v1/service/envois` (AD-27) est limité aux neuf modèles `assurance-*`.
  - **Neuf modèles système** (SMS et e-mail, `fr`/`en`) : `assurance-declaration-enregistree`,
    `assurance-pieces-attendues`, `assurance-relance-pieces`, `assurance-dossier-ouvert`, `assurance-numero-officiel`,
    `assurance-offre-envoyee`, `assurance-cheque-a-retirer`, `assurance-reglement-effectue`, `assurance-dossier-clos`.
    Variables : `reference` (et `numeroOfficiel` pour le numéro officiel), rien d'autre.
  - **Refus neuf** : `CONTENU_INTERDIT_A_L_ASSURE` (422) à la création ou à la nouvelle version d'une surcharge d'un
    modèle `assurance-*` qui porte une donnée de santé, un montant d'indemnité, le mot « fraude » ou une variable hors
    liste.
  - **Relances de pièces** : file BullMQ `notification:relances-pieces` (Redis déjà requis), trois au plus, espacées de
    5 jours sur l'horloge de référence (`RECETTE_HORLOGE_AVANCE_JOURS` en recette).
  - **→ C** : voir « Demandes aux autres groupes ».

- **PUBLIÉ (2026-11-17, STORY-1050, reseau-service#13, `dev` a3d2f59, et #14, `dev` 49c4d01) ; ANNONCÉ avant la
  fusion du code (prospera-stories #613) — `reseau-service` : la garde lit l'état publié, les
  droits viennent de `/moi/droits`, le commercial est republié quand son compte change.** Aucun topic, aucune route,
  aucun champ n'est renommé ni retiré du fil ; ce qui change, ce sont **trois comportements**.
  - **La garde du module** lit `etat-publie.changed.<espace>@1` (contrat figé `contrat-etat-publie-v1`, groupe neuf
    `reseau-service.etat-publie`, espace par `KAFKA_ESPACE`, `REEL` par défaut) et décide par la garde partagée
    `garde-etat-publie-v1` copiée à l'octet. **`entitlement.changed` n'est plus lu** (groupe `reseau-service.droits`
    arrêté). Mêmes codes : `RESEAU_NOT_ENTITLED` (aucun état reçu, état inconnu, `NON_INSTALLE`, `SUSPENDU`,
    `ESSAI_TERMINE`, `DESINSTALLE`, `EN_INSTALLATION`), `ABONNEMENT_EXPIRE` (écriture en `LECTURE_SEULE`).
    **Pour B (catalogue)** : une organisation dont le droit `reseau` date d'avant le moteur se lit `NON_INSTALLE` tant
    que `migrate:reamorcage-moteur` n'a pas été joué ; la couverture lit `pdv`, `stock`, `freelance` de la même façon
    (installé = lecture ouverte à l'utilisateur).
  - **Les droits du module** (`reseau:noeud:consulter`, `reseau:noeud:modifier`, `reseau:decoupage:modifier`,
    `reseau:affectation:modifier`, `reseau:portee:attribuer`) sont lus par `GET {AUTH_SERVICE_URL}/api/v1/moi/droits`
    (B-949), avec le jeton de l'appelant ; seuls les `droits` de tenant comptent. La table rôle → droits du service est
    retirée. Cache 60 s au plus, relu sur un `dv` plus récent, invalidé par `identity.droits.changed@1` (groupe
    `reseau-service.droits-membres`). Depuis #14 : les droits effectifs sont `droits ∪ droitsHorsJeton` (`/moi/droits`
    1.1.0 de B-960 ; absent = `[]`). **Code neuf** : 503 `DROITS_INDISPONIBLES` (auth injoignable, délai de 2 s,
    réponse illisible). **Variable neuve, requise** : `AUTH_SERVICE_URL`. ⚠️ **En réel, toute route du module qui exige
    un droit répond 403 `DROIT_INSUFFISANT` jusqu'à ce qu'auth-service attribue les droits `reseau:*`** (B-960 ; voir
    « → B » plus haut), comme la comptabilité (D-959-4).
  - **`reseau.commercial.changed@1`** est désormais **republié quand seul l'état du compte change** (`etatDuCompte` :
    invitation, acceptation, suspension, appartenance) **ou le compte lié** (`userId`), à la réception du fait
    `identity.*`. Même topic, même clé (`organisationId`), même charge, même `rang` (il suit les écritures du commercial,
    comme pour une affectation). Un consommateur reçoit donc des faits de plus, en état absolu ; il garde le plus
    récent par `commercialId` (`occurredAt`). Consommateur aujourd'hui : aucun (pdv, demain) ; **→ C pour
    information** : `sinistres` ne lit que `reseau.portee.changed@1`, qui ne change pas (la suite
    `conformite-portee-reseau-v1` passe toujours).

- **PUBLIÉ (2026-11-17, STORY-1049, prospera-ventes-service#3, `dev` c8f5fd2) ; ANNONCÉ avant la fusion du code
  (prospera-stories #605) — `prospera-ventes-service`, module `commande` : les garde-fous.** Aucun fait publié, aucun topic, aucun contrat existant ne change. Ajouts seulement, **sans consommateur
  aujourd'hui** (ni écran, ni service).
  - **Routes** (garde `COMMANDE_NOT_ENTITLED`) : `GET /api/v1/commande/parametres` (version courante),
    `GET /api/v1/commande/parametres/versions/{version}`, `PUT /api/v1/commande/parametres` (`TENANT_ADMIN` jusqu'à
    D-1053 ; corps `{ versionAttendue, valeurs, motif }`), `GET /api/v1/commande/tiers/{tiersId}/credit` (le
    disponible à crédit, FR-187), `POST /api/v1/commande/validations` (l'acte, `Idempotency-Key` exigée ; **squelette** :
    sa forme définitive vient avec la saisie, STORY-1056), `GET /api/v1/commande/validations/{commandeId}`,
    `POST /api/v1/commande/validations/{commandeId}/reservations` (reprise de la saga).
  - **Codes de refus neufs** : `PARAMETRES_INVALIDES`, `PARAMETRES_VERSION_PERIMEE`, `PARAMETRES_VERSION_INCONNUE`,
    `CLE_D_IDEMPOTENCE_MANQUANTE`, `CLE_REUTILISEE_AVEC_AUTRE_CHARGE`, `COMMANDE_DEJA_VALIDEE`, `VALIDATION_INCONNUE`,
    `PLAFOND_INCONNU`, `CREDIT_BLOQUE`, `STOCK_NON_INSTALLE`, `ENCOURS_NON_INSTALLE`, `ENCOURS_INCALCULABLE`,
    `PLAFOND_CREDIT_DEPASSE` (ceux de la spine gardent son sens).
  - **Échec fermé, pour information de B et de qui construira `pdv`** : tant que la Créance (B-963, B-965) n'est pas
    projetée dans `commande`, ses sources sont `ABSENTE` et **toute commande à crédit est refusée**
    `ENCOURS_NON_INSTALLE` ; sans plafond connu du tiers, `PLAFOND_INCONNU`. Ce que `commande` attend de
    `pdv.plafond.changed@1` (fait du catalogue, schéma non fixé) : par `(tiersId, perimetre)`, un état absolu avec une
    `revision` croissante, `devise`, `statut` `FIXE` (avec le montant en unité mineure) ou `SANS_OBJET`, et `suspendu`
    (le crédit bloqué, FR-189). De la Créance : rien de neuf (voir « → B, ce que la bibliothèque d'encours lit »).

- **PUBLIÉ (2026-11-17, STORY-1048, prospera-assureur-fictif#4, `dev` 4f4aa89) ; ANNONCÉ avant la fusion du code
  (prospera-stories #597) — `prospera-assureur-fictif` : le démarrage et la remise à zéro.** Rien ne change sur le fil ni dans l'API du LC (`/lc/echange`).
  - **Démarrage** : le LC fictif lit désormais l'espace de l'instance, **`INSTANCE_ESPACE`** (STORY-934, `ESSAI` |
    `REEL`). `ESSAI` démarre ; `REEL`, toute autre valeur ou une chaîne vide **refusent**, même avec
    `FICTIF_ESPACE=essai`. `FICTIF_ESPACE=essai` seule (piles de C, STORY-986) **démarre comme avant** ; posées toutes
    deux, elles doivent s'accorder. Le refus arrête le processus avant tout chargement (aucune connexion, aucun port) :
    une ligne JSON sur la sortie d'erreur (`"code":"ASSUREUR_FICTIF_INTERDIT"`, `motif` parmi `ESPACE_REEL`,
    `ESPACE_INCONNU`, `ESPACES_EN_DESACCORD`, `AUCUNE_PREUVE_D_ESSAI`), puis le **code de sortie 78**. Le compose du
    dépôt pose `INSTANCE_ESPACE=ESSAI` et `FICTIF_ESPACE=essai`.
  - **Remise à zéro** (`POST /api/v1/assureur-fictif/remise-a-zero`) : elle efface aussi l'**entrée** que le LC a écrite
    et **écarte** ce que Prospera avait déposé dans `sortie` avant elle (inscrit au journal des reçus, `IGNORE`, code
    `ANTERIEUR_A_LA_REMISE_A_ZERO`, jamais relu ; rien n'est supprimé de `sortie`). Réponse : `{ lots }` devient
    `{ lots, sortieEcartee, entreeEffacee }` (ajouts). Ce que Prospera dépose après la remise à zéro est reçu
    normalement.

- **PUBLIÉ (2026-11-17, STORY-1047, prospera-plateforme#24, `dev` b061cec, étiquette `encours-v1`) ; ANNONCÉ avant la
  fusion du code (prospera-stories #589) — `encours@1`, bibliothèque neuve** (`prospera-plateforme/encours/` ; rien
  d'existant ne change). sha256 : `src/index.ts` `4b5c9bff…`, `vecteurs-or.json` `23e3c260…` (complets dans la fiche). Consommateurs : `commande`
  (STORY-1049, qui juge), `pdv` (le disponible à crédit), `recouvrement` (l'évaluation du blocage), chacun par **copie à
  l'octet** de `encours/src/index.ts` et de `encours/vecteurs-or.json`, vecteurs d'or rejoués dans ses tests (AD-2).
  - **La règle** (AD-9, FR-52), par `(tiers, périmètre)` : `encoursCertain = Σ restantCertain des Créances OUVERTE +
    restantAFacturer de l'engagement − Σ solde des crédits du tiers` ; `encoursAffiche`, la même avec `restantAffiche`
    (encaissements déclarés en moins). L'encours **certain** juge, dit « dépassé » et sert au blocage ; l'affiché se
    montre (D-1047-2, Q-D-4). Pas de champ `encours` nu (comme `restant` chez `paiement`).
  - **API** : `calculerEncours(entree, le)` (date `AAAA-MM-JJ` en paramètre, aucune horloge) ;
    `disponibleACredit(plafond, resultat)` (`CALCULE` | `NON_INSTALLE` | `SANS_OBJET`) ;
    `jugerPlafond(plafond, resultat, supplementMineur)` (`ACCEPTEE` | `REFUSEE` `PLAFOND_CREDIT_DEPASSE`, strict |
    `NON_INSTALLE` | `SANS_OBJET`) ; `VERSION_ENCOURS = '1.0.0'`, `MAJEUR_ENCOURS = 1`.
  - **Entrée** : trois sources `{ statut: 'ABSENTE' }` ou `{ statut: 'PRESENTE', faits }` — `creances` (états absolus de
    `paiement.creance.changed@1` : `creanceId` = `<source>:<sourceId>`, `revision`, `tiersId`, `perimetre`, `devise`,
    `statut` `OUVERTE`|`CLOTUREE`, `restantCertainMineur`, `restantAfficheMineur`, `echeanceLe`), `creditsTiers`
    (`paiement.credit-tiers.changed@1` : `creditId`, `revision`, …, `soldeMineur`), `engagement`
    (`commande.engagement-tiers.changed@1` : `revision`, …, `restantAFacturerMineur`, `versionEncours`). Par clé, la plus
    haute `revision` l'emporte, quel que soit l'ordre d'arrivée.
  - **Refus nommés** (`RefusEncours.code`) : `ENTREE_INVALIDE`, `DATE_INVALIDE`, `HORS_TIERS`, `HORS_PERIMETRE` (AD-31 :
    jamais filtré en silence), `DEVISE_DIFFERENTE`, `REVISION_INCOHERENTE`, `VERSION_ENCOURS_DIFFERENTE` (l'engagement
    porte la version de la fonction ; un autre majeur est refusé), `MONTANT_HORS_BORNES`.
  - **Hors de l'encours** (D-1047-3) : Créance `CLOTUREE` ; autre tiers, périmètre ou devise (refusés) ; commandes non
    validées ; le montant d'une dérogation **reste** dans l'encours (c'est `recouvrement` qui l'exclut de son évaluation,
    en `1.x` avec sa story).

- **PUBLIÉ (2026-11-17, STORY-1046, prospera-assureur-fictif#3, `dev` 626b93e ; plateforme #23, `jeu-assurance-v1`) —
  ajouts seulement** (annoncés ici avec la PR de docs, juste après la fusion du code : rien d'existant ne change de
  forme).
  - `POST /api/v1/instance/assureur-fictif/{organisationId}/import` et `…/effacement` (déjà déclarées au manifeste),
    aux corps exacts de `contrats/instance/` (`contrats-instance-v1`) ; refus 400 `IMPORT_HORS_CONTRAT`,
    `EFFACEMENT_HORS_CONTRAT`, `ORGANISATION_INCOHERENTE` ; 403 `IDENTITE_DE_SERVICE_REQUISE`,
    `ORGANISATION_HORS_JETON` ; 409 `IDEMPOTENCE_REUTILISEE` ; 422 `OBJET_NON_IMPORTABLE`, `ENREGISTREMENT_INVALIDE`.
  - Le LC fictif lit les jetons de service (STORY-948) : 403 `IDENTITE_DE_SERVICE_REFUSEE` hors des routes C13 ; 401
    `JETON_DE_SERVICE_INVALIDE` pour une identité inconnue.
  - Les jeux `assurance-compagnie-demo@1.0.0` (`jeu.json` sha256 `f58ddf1a…`) et
    `assurance-compagnie-demo-reduite@1.0.0` (`23602877…`) : une version publiée ne change plus.

- **PUBLIÉ (2026-11-17, STORY-1045, prospera-plateforme#21, `dev` baa38dd) — deux contrats neufs** (rien d'existant ne
  change ; aucun fichier hors des dossiers de D).
  - **`catalogue-faits@1`** (`contrats/distributeur/`, étiquette `contrats-distributeur-v1`) : le catalogue des faits
    d'AD-20 (129 noms) et la garde `verifierFaitsDuModule`. **Pour B** : les 18 faits déjà codés de `paiement` y sont,
    sans `@1`, avec les trois faits de l'amendement du 2026-11-13 ; un fait **neuf** de `paiement` (Créance, B-963 et
    B-965 : `paiement.creance.changed@1`, `.credit-tiers.changed@1` y sont déjà) qu'un module du distributeur lit doit
    y entrer avant d'être consommé : le demander ici. **Pour C et la microfinance** : les faits que vos spines ou PRD
    ajoutent aux modules du noyau (`recouvrement`, `equipe`, `dashboard`…) y entrent de la même façon, avec leur source.
  - **`vocabulaire@1`** (`vocabulaires/`, étiquette `vocabulaires-v1`) : un tableau par verticale (`distributeur`,
    `imf`, `assurance`), clés neutres, `null` = sans objet. Les colonnes IMF et assurance sont celles du PRD
    distributeur (propositions) : **une correction se demande à D** (écart connu : le PRD microfinance §3 met
    « client » avant « membre »).

- **PUBLIÉ (2026-11-16, STORY-1036, reseau-service#7, `dev` 17dcf14) — `reseau.portee.changed@1`, contrat neuf** (rien d'existant ne change). Producteur
  unique : `reseau-service`. Consommateurs attendus : **C-1004** (sinistres), puis pdv, stock et le distributeur.
  - **Topic** `reseau.portee.changed` (le `@1` est la version du contrat, pas du nom) ; **clé** `<organisationId>:<userId>` ;
    schéma `reseau-service/contrat/schemas/reseau.portee.changed.json`, enregistré dans Karapace sur
    `reseau.portee.changed-value` en **BACKWARD** (modèle fermé : ajouts facultatifs seulement, sinon un `@2`).
  - **Corps** : `schemaVersion: 1`, `eventId`, `occurredAt`, `organisationId`, `userId`, `statut` (`ATTRIBUEE` |
    `RETIREE`), `lecture` et `ecriture` (`{ totale: true }` **ou** `{ totale: false, noeuds: [ObjectId…] }`), `version`
    (portée déclarée), `revision` (publication, croissante par clé), `versionDecoupage`.
  - **État absolu et RÉSOLU** : la liste des nœuds est déjà calculée (héritage, exclusions) ; le consommateur n'a pas
    l'arbre. Il se republie quand l'arbre change la résolution (nœud créé sous un nœud hérité, déplacement).
  - ⛔ **Fail-closed, à appliquer chez le consommateur** (AD-6) : aucun fait pour l'utilisateur, un fait `RETIREE`, ou
    `noeuds: []` ⇒ **zéro** enregistrement. Seul `totale: true` ouvre tout. Garder par clé le fait de plus haute
    `revision`. L'écriture est toujours contenue dans la lecture.
  - Client de Confluent : créer le topic avant de s'abonner et `metadataMaxAge: 10_000` (règles §1.9).
  - La suite de conformité (six cas) et le registre des consommateurs arrivent avec **STORY-1037**, avec un ticket à C.

## Questions à l'utilisateur ou au PO

- **Q-D-33 (2026-11-27, STORY-336) — La production d'un dossier de contrôle se trace-t-elle ?** Qui l'a produit, quand,
  sur quel périmètre, avec quelle empreinte. **Choix par défaut** (D-336-3) : non, c'est une lecture ; l'empreinte rendue
  prouve qu'un exemplaire remis n'a pas été retouché. Si oui : un acte au journal chaîné d'un périmètre
  `dossier-controle:<dossierId>`.

- **Q-D-31 (2026-11-26, STORY-335) — La preuve du dépôt vit dans le fiscal ; le fonds du client en reçoit-il une
  copie ?** L'AC-1 de 335 dit « dans `document-service` » ; le lot 6 a mis la preuve du dépôt dans le bucket privé du
  fiscal (682). **Choix par défaut** (D-335-9) : l'original reste au fiscal (l'empreinte, l'URL présignée re-vérifiée) ;
  la GED de B en reçoit une copie rattachée quand B l'aura ouverte (« → B » ci-dessus).

- **Q-D-30 (2026-11-26, STORY-333) — Les majorations de retard des déclarations du mois : quel paquet les déclare ?**
  **Choix par défaut** (D-333-8) : seul le paquet de dépôt de la liasse (`TG × DSF`) porte `penalites[]`. Le retard d'une
  déclaration du mois est qualifié (jours, `EN_RETARD`), et son risque dit `source: null` (« aucun paquet ne déclare de
  pénalité ») au lieu d'inventer un taux. Les déclarer ne coûtera qu'une donnée de paquet.

- **Q-D-29 (2026-11-26, STORY-332) — Les écrans réels de dimana et du GUDEF : quelles étapes, dans quel ordre ?**
  **Choix par défaut** : deux guidages `amorce` de six étapes (se connecter avec le compte du redevable, ouvrir,
  reporter les valeurs ou téléverser le fichier, vérifier, valider, relever l'accusé). Ils seront relevés sur les
  portails au premier dépôt réel (1102). Changer une étape ne coûte qu'une version du paquet de guidage, sans code et sans
  toucher au format. Les lignes du formulaire réel que le produit ne tient pas (Q-D-28) restent à remplir sur le
  portail, et la consigne de l'étape de saisie le dit.

- **Q-D-28 (2026-11-26, STORY-331) — Le formulaire mensuel de TVA de dimana : quelles lignes, dans quel ordre ?**
  **Choix par défaut** (D-331-9) : les trois valeurs que le produit tient (la période, la base imposable, la TVA due),
  dans cet ordre, au paquet `TG × TVA` 1.0 en `statut: 'amorce'` ; le relevé du formulaire réel se fait au premier dépôt
  réel (1102). Une ligne de plus ne coûte qu'une version du paquet si sa valeur existe dans le produit ; sinon, elle reste
  à saisir sur le portail, et le guidage (332) le dira.

- **Q-D-27 (2026-11-26, STORY-330) — Engager un dépôt fait-il passer la déclaration à « Déposée » ?** **Choix par
  défaut** (D-330-7) : non. « Déposée » est la transmission (D-323-3) et reste la porte de C, avec l'accord du client et
  le scellement de la version ; un dépôt engagé que personne n'a encore fait sur le portail garde son alerte d'échéance. Si
  le PO veut l'inverse, l'engagement appellera la porte de C (D-324-7), sans autre changement.

- **Q-D-26 (2026-11-26, STORY-1141) — Un compte `MARCHAND` (ou `PI_SPI`) peut-il porter un numéro imprimable ?**
  **Choix par défaut** (D-1141-3) : non. Seuls `BANCAIRE` et `MOBILE_MONEY` en portent un : un compte marchand se paie
  par un lien, et un compte PI-SPI imprime déjà sa destination en clair. Pour l'ouvrir au marchand, il suffit d'ajouter
  une valeur à une liste du domaine, sans toucher au contrat.

- **Q-D-24 (2026-11-26, STORY-349) — Un mois sans base de rémunération doit-il porter ses obligations sociales ?**
  Une obligation sociale naît de la base d'une période (D-349-2) : un mois sans base n'en a pas. **Choix par défaut** :
  non — rien ne dit au code qu'un dossier est employeur ce mois-là, et une déclaration « néant » à la CNSS n'est pas
  sourcée au paquet. Une réponse contraire demande une donnée du dossier (« employeur depuis… ») et la règle de la
  déclaration néant au paquet.
- **Q-D-25 (2026-11-26, STORY-349) — Sur quoi se fonde la prise en charge d'une obligation sociale ?** Elle suit le même
  cycle que les fiscales (D-349-7) : à la prise en charge, ses bases sont la balance du dossier qui couvre le dernier
  jour du mois (320). **Choix par défaut** : gardé tel quel ; la base de rémunération reste son fondement de calcul (`GET
  …/calcul`). Une réponse contraire (« les bases d'une obligation sociale sont sa base de rémunération ») touche les
  bases de 320 et le triplet (dossier de C).

- **Réponses de l'utilisateur du 2026-11-25 (après la clôture du lot 6 amendé de D), données à la session de groupe
  de D.** Chaque question garde son énoncé ci-dessous ; la réponse fait foi. **Aucune story n'est créée ni placée pour
  les suites** : l'utilisateur gère lui-même le lot 7 (« ne touche rien pour le lot 7, laisse-moi, je vais gérer ça »).
  - **Q-D-17 — confirmée.** Dans l'espace d'essai, la garde saute le seul palier KYC et l'état publié décide
    (D-1079-1 → 4 tels quels). La même règle vaudra pour `balance-service` (C) et `dossier-service` (B) : leurs demandes
    (« Demandes aux autres groupes », STORY-1079) ne sont plus un choix par défaut.
  - **Q-D-15 — un numéro imprimable.** Le DAF déclare avec le compte un numéro « à imprimer », non secret et tracé ;
    `paiement` le publie avec le compte ; la facture et son PDF l'impriment en entier. Jamais un déchiffrement du
    coffre. Le choix par défaut de D-1073-6 (l'empreinte visible seule) reste en service jusqu'à la story qui le fera.
  - **Q-D-13 — personne.** `prospera-expert-comptable` reste sans titulaire ; chaque story qui en a besoin l'emprunte par
    une passation écrite.
  - **Q-D-16 — la lecture stricte est gardée** (D-1077-4 tel quel) : l'alerte se juge sans subventions d'investissement
    ni provisions réglementées ; la lecture large reste publiée à côté.
  - **Q-D-14 — chercher sur le web les seuils des seize autres indicateurs, modifiables ensuite.** Chaque seuil trouvé
    porte sa source ; un seuil introuvable reste sans repère ; les seuils doivent pouvoir être modifiés après coup, sans
    version neuve du moteur, et la modification doit être tracée.
  - **Q-D-18 → 20 — validés, avec le CSV en plus.** L'export reste réservé au moteur (Q-D-18), la migration garde sa
    route sans corps (Q-D-20), et l'export sort **aussi en CSV** (Q-D-19, C13 point 7). Les contrats restent à publier
    par B dans `prospera-plateforme/contrats/instance/`.
  - **La zone franche** : `zone-franche-togo@1.1`, qui reprend la correction des sous-totaux de `@2.2` (STORY-676, 678),
    se fera **au lot 7**.

- **Q-D-23 (2026-11-26, STORY-1139) — Les repères de l'analyse : par dossier, et les repères d'usage écartés.**
  La recherche du 26/11 (fiche, S1 → S6) ne trouve aucune norme sur la même formule que l'un des seize indicateurs : ils
  restent « aucun repère déclaré ». **Choix par défaut appliqués** : (1) les repères se modifient **par dossier**
  (`TENANT_ADMIN`, D-1139-3, D-1139-7), pas pour tout un cabinet ni pour toute la plateforme ; (2) les repères d'usage
  français que la source n'attache pas à notre formule (« inférieur à 1 » pour l'endettement, « 1 à 2 » pour la liquidité,
  Les clés de la banque) **ne sont pas importés** (D-1139-2) — un cabinet peut les déclarer sur un dossier, avec
  `nature: USAGE`. Une réponse contraire en (1) ajoute un niveau « cabinet » (une route hors dossier) ; en (2), une
  révision des paquets.

- **Q-D-22 (2026-11-25, STORY-348) — L'AMU : qui la collecte, et sa part salariale sort-elle de la base de l'IRPP ?**
  Deux points laissés ouverts par le plan (§8, relecture du bloc `cnss` par un fiscaliste, geste de l'utilisateur).
  **Choix par défaut appliqués (D-348-6, D-348-7, D-348-9)** : (1) **la CNSS** collecte l'AMU avec les cotisations, à
  la même échéance (`cnss.amu.collecte.CNSS` : salariés relevant du Code du travail ; l'INAM ne vise que les agents
  publics) ; (2) **la part salariale (5 %) est retranchée du brut** avant l'IRPP, au titre de l'Art. 26, 2°
  (`cnss.amu.deductibiliteIRPP`). Le décret n° 2023-097/PR reste à lire. Une réponse contraire change le paquet (C), pas
  le code, sauf pour (1) si l'AMU avait sa propre échéance (une échéance de plus au résultat).

- **Q-D-21 (2026-11-25, STORY-346) — Quel outil de paie, et quel fichier en sort ?** C'est la question ouverte n° 2 du
  PRD fiscalité ; la pièce n° 8 de `demande-pieces-fiscales-2026-08-03.md` (« un export de votre outil de paie ») n'a
  jamais été reçue. **Choix par défaut appliqué (D-346-1)** : le gabarit CSV de Prospera, aux noms des champs de la
  saisie ; le cabinet y verse la sortie de son outil. Un export réel reçu ⇒ une correspondance de colonnes devant le
  même lecteur, sans rien changer d'autre.

- **Q-D-20 (2026-11-25, STORY-1075) — Le contrat de `migrer`.** Le manifeste déclare `POST /api/v1/instance/bilan/migrer`
  et AD-33 dit « idempotent, additif, appelé par l'agent sous verrou », mais aucun schéma de la plateforme ne fixe la
  demande, la réponse ni l'échec (et AD-33 parle d'un point d'entrée lancé « en conteneur dédié », le manifeste d'une
  route). **Choix par défaut appliqué (D-1075-9)** : la route, sans corps, sous l'identité du moteur (n'importe quelle
  organisation de son jeton : la migration vaut pour le service) ; 200 `{ schemaVersion: 1, module, statut: 'MIGRE',
  migrations: [{ code, ...rapport }] }` ; des orphelins ⇒ 409 `MIGRATION_INCOMPLETE` avec le rapport. À trancher par
  l'architecte du moteur (B) en publiant le contrat dans `prospera-plateforme/contrats/instance/`.

- **Q-D-19 (2026-11-25, STORY-1075) — La forme de l'export C13 (et le CSV).** C13 point 7 dit « un export en CSV et
  JSON » ; aucun schéma ne fixe le corps. **Choix par défaut appliqué (D-1075-6)** : du JSON seul, une enveloppe
  `{ schemaVersion: 1, module, organisationId, espace, exporteLe, objets: [{ objet, nombre, enregistrements }] }`, les
  documents en MongoDB Extended JSON (relaxed), aucun CSV (des documents imbriqués n'ont pas de CSV évident). À trancher
  avec Q-D-20 (contrat publié par B) ; bilan suivra.

- **Q-D-18 (2026-11-25, STORY-1075) — L'utilisateur détenteur de `instance:donnees:exporter` appelle-t-il la route
  d'export du module, ou la partie A ?** Le tableau de C13 le nomme (« par le chemin public ») ; AD-37 fait passer
  l'export de l'écran Administration par les commandes de la partie A, qui appelle le module sous l'identité du moteur.
  **Choix par défaut appliqué (D-1075-3)** : le moteur seul ; un jeton d'utilisateur reçoit 403
  `IDENTITE_DE_SERVICE_REQUISE` (le jeton que lit bilan ne projette pas `perms[]`). Si le PO retient le chemin public :
  projeter `perms[]` dans la stratégie JWT du service et ouvrir la route au détenteur du droit, limité à son organisation.

- **Q-D-17 (2026-11-25, placée par STORY-1078, pour STORY-1079 ; choix par défaut APPLIQUÉ par 1079, fiche D-1079-1 →
  4, toujours à confirmer) — Dans l'espace d'essai, la garde de `bilan-service` peut-elle sauter le palier KYC ?** Un prospect n'a pas de KYC (l'espace d'essai n'a ni `kyc-service` ni
  `kyc.status.changed`) : aujourd'hui `requires-bilan-access` rend `403 KYC_NOT_APPROVED` même module installé (ticket
  `TICKET-BACKEND-modules-ouverts-dans-l-essai.md`, point 3). **Choix par défaut (appliqué par 1079 sans réponse) :
  `INSTANCE_ESPACE=ESSAI` ⇒ le palier KYC est sauté, l'état publié du module décide seul** (l'essai est déjà borné par
  `ESSAI_PROSPECT` et son effacement, AD-15) ; dans l'espace réel, rien ne change (e-mail vérifié, KYC `APPROVED`, état
  publié). C'est une décision d'architecture (AD-15, NFR-A01) : à confirmer par l'architecte ou le PO avant la démo du
  15/01. La même règle vaudra pour `balance-service` (C) et `dossier-service` (B).

- **Q-D-16 (2026-11-25, STORY-1077) — Les capitaux propres des art. 371 et 664 de l'AUSCGIE comprennent-ils les
  subventions d'investissement et les provisions réglementées ?** Le SYSCOHADA révisé les range dans « capitaux propres et
  ressources assimilées ». **Choix par défaut appliqué (D-1077-4)** : l'alerte se juge sans eux (lecture stricte, plus
  prudente : elle se déclenche plus tôt), la lecture large est publiée à côté avec son propre constat
  (`atteinteSurRessourcesAssimilees`) et le message dit laquelle déclenche. Si la doctrine retient la lecture large :
  poser `COMPOSANTE` sur les deux postes par une révision du paquet, rien à changer dans le code. Question à poser à un
  expert-comptable inscrit à l'Ordre.

- **Q-D-15 (2026-11-24, STORY-1073) — Le numéro complet d'un compte d'encaissement (RIB, IBAN, numéro Mobile Money)
  s'imprime-t-il sur la facture ?** Dans `paiement`, l'identifiant d'un compte est **scellé au coffre** (STORY-243, AD-14
  : « aucun chemin ne restitue ») ; seule son empreinte visible (« ••••4521 ») est en clair, avec la destination d'un
  compte PI-SPI (numéro de compte et participant, en clair par construction). **Choix par défaut appliqué (D-1073-6) :**
  la facture imprime l'empreinte visible (et, pour un compte PI-SPI, sa destination), le titulaire et le fournisseur ;
  jamais le clair. Un payeur qui doit virer sur un RIB complet ne le lit donc pas sur la facture. Si le PO veut le RIB
  complet imprimé : une donnée **non secrète** « numéro imprimable » déclarée avec le compte dans `paiement` (tracée
  comme la déclaration), publiée par le même fait — une story de `paiement` (B), jamais un déchiffrement.

- **Q-D-14 (2026-11-24, STORY-1076) — Les repères de l'analyse financière sans source citable.** Seuls trois des 19
  indicateurs ont une norme publiée par une source citable sur la même formule (BCEAO, accords de classement, mars
  2020 : autonomie financière ≥ 20 %, liquidité générale ≥ 1, marge nette positive) ; ils sont livrés. **Choix par
  défaut appliqués :** (1) les seize autres restent **sans repère** (« aucun repère déclaré ») jusqu'à une source
  citable par indicateur (exigences écrites d'une banque, Q-SC-1 / STORY-1085 ; étude sectorielle BCEAO ou INSEED ;
  validation écrite d'un expert-comptable inscrit) ; (2) **pas** de 20ᵉ indicateur « capacité de remboursement à la
  formule BCEAO » (dettes financières / CAFG ≤ 4 ; l'indicateur publié divise par l'EBE, D-1076-8) ; (3) la norme de
  liquidité s'applique **à tous les secteurs**, télécommunications comprises (la BCEAO cite leur « cas particulier »
  sans le chiffrer). Détail : `stories/STORY-1076.md`.

- **Q-D-13 — choix par défaut appliqué par STORY-1072 (2026-11-24) : D a porté `prospera-expert-comptable` le temps de
  la story (#11) ; le dépôt reste sans titulaire.** Énoncé d'origine :
- **Q-D-13 (2026-11-24, STORY-1071, pour STORY-1072) — Qui tient `prospera-expert-comptable` ?** Le dépôt n'a pas de
  titulaire (plan maître §2) ; la demande de B (STORY-1103) y place le consommateur de `kyc.correction.requested@1`, à
  côté de celui de `kyc.status.changed` (les trois e-mails KYC du cabinet en partent). **Choix par défaut : D le porte**
  avec le modèle `kyc-dossier-renvoi-correction` de `notification` (STORY-1072), le temps de cette story ; le dépôt ne
  change pas de titulaire pour autant. À trancher par l'utilisateur avant 1072 si un autre groupe doit le tenir.

- **Q-D-12 — répondue par l'utilisateur le 2026-11-24 (après le lot 6), appliquée par STORY-1073.** « La fiche légale
  de l'organisation est normalement renseignée lors de la création d'un dossier. » Vérifié sur `origin/dev` de
  `dossier-service` : chaque organisation a son **dossier propre** (`estLeCabinet: true`, posé par le consommateur
  d'`identity.org.created`, un seul par organisation, ni supprimable ni détachable, aucun filtre de métier) qui porte
  `raisonSociale`, `sigle`, `formeJuridique`, `nifSociete`, `rccm`, `numeroCnss`, `capitalSocial`, `adresse`, `email`,
  `telephone`, `regimeFiscal`, `systemeComptable`. Mais `dossier.created` / `dossier.updated` (`DossierEtatV1`) n'en
  publient ni le NIF, ni le RCCM, ni la forme juridique, ni le capital, ni l'adresse ; et le RIB n'est dans aucun
  dossier. **Décision de l'utilisateur (« fais-le comme tu le vois ») — D-Q12-1 : une seule source par donnée.**
  L'identité légale vient du dossier propre de l'organisation (`dossier-service`) ; les coordonnées de paiement
  imprimées (RIB, Mobile Money) viennent des **comptes d'encaissement** de `paiement` (STORY-242, FR-P01 → P03, NFR-1 :
  titulaire identifié, saisie tracée, secrets au coffre), et non d'un champ neuf du dossier (un second registre de
  comptes) ni de la saisie du DAF (une troisième copie ; le changement de RIB est la fraude classique de la facture).
  Il ne reste au DAF que le choix du ou des comptes imprimés (un compte par défaut). La saisie de D-1065-2 devient ce
  choix, et la fiche saisie en 1065 cesse d'être lue dès que les deux sources sont publiées. Demandes à B ci-dessus
  (« Demandes aux autres groupes », 2026-11-24, fiche légale) ; story de D : **STORY-1073**, placée après 1072.
  — Énoncé d'origine :
- **Q-D-12 (2026-11-24, STORY-1065) — Qui tient la fiche légale de l'organisation (raison sociale, forme juridique,
  capital, siège, NIF, RCCM, régime fiscal, RIB, compte Mobile Money) qu'imprime chaque facture ?** FR-44 la veut « lue
  de la fiche de l'Organisation », mais aucun service ne la porte : `auth` publie le nom, le pays et le logo
  (`identity.org.*`), `kyc` ne publie aucune donnée déclarée. **Choix par défaut (D-1065-2) : le DAF la saisit dans les
  paramètres versionnés de `facturation`** (`PUT /api/v1/facturation/parametres`, droit `facturation:parametres:modifier`),
  jamais en dur ; le jour où un propriétaire la publie (`auth`, ou une fiche de l'organisation du moteur), `facturation`
  la lit. **Et A-1 reste à faire** : la liste de travail des mentions (quatorze codes, toutes exigées par défaut) et la
  durée de conservation (10 ans) attendent l'expert-comptable du client avant la recette de la facture ; elles se
  corrigent par le même paramètre, sans développement.

- **Q-D-11 (2026-11-18, STORY-1060) — Quels jours fériés le calendrier par défaut déclare-t-il ?** Choix par défaut
  (D-1060-4) : du lundi au samedi travaillés ; dix jours fériés légaux du Togo que l'on sait dater : 1er janvier, lundi
  de Pâques, 27 avril, 1er mai, Ascension, lundi de Pentecôte, 21 juin, 15 août, 1er novembre, 25 décembre. Les fêtes
  musulmanes (Aïd el-Fitr, Tabaski, Maouloud s'il est chômé) se déclarent par l'organisation en `DATE`, chaque année.
  **À confirmer** : la liste, et le 13 janvier. Une organisation la change par `PUT /api/v1/terrain/parametres`.

- **Réponses de l'utilisateur (2026-11-18, journal de A, « → D »)** : Q-D-1 → Q-D-8 et Q-D-10 **confirmées** (les choix par
  défaut tiennent ; Q-D-7 : vérifier que « SAREX » est bien fictif ; Q-D-8 : l'utilisateur cherche des documents
  générables pour le jeu) ; **Q-D-9 renversée** ⇒ STORY-1060 ; Q-D-10 : la reprise du dernier numéro de facture
  (`facturation.suite-numerotation@1`) se pose avant la première facture d'un client qui quitte Sage.

- **Q-D-10 (2026-11-17, STORY-1059) — Une organisation qui n'a rien à reprendre de Sage émet-elle ses factures dès
  `FAC-AAAA-000001` ?** AD-5 veut que la série des factures reprenne le dernier numéro de Sage, posé une fois par la
  Reprise (`facturation.suite-numerotation@1`), et refuse l'émission tant qu'elle ne l'est pas
  (`NUMEROTATION_NON_INITIALISEE`). La Reprise de la facturation (EPIC-244) n'existe pas encore. **Choix par défaut : la
  série démarre à 0** (essai, démonstration, client sans Sage) ; la reprise devra se poser avant la première facture
  d'un client qui migre (EPIC-244 refusera une initialisation après elle). Alternative : refuser toute facture tant que
  la suite n'est pas posée, au prix de bloquer l'essai.

- **Q-D-9 (2026-11-17, STORY-1058) — Les jours d'un plan de journée du jeu sautent-ils le seul dimanche ?** **Renversée par l'utilisateur le 2026-11-18** :
  un calendrier propre à chaque organisation ⇒ STORY-1060. Le jeu dit
  « aujourd'hui et les dix jours ouvrés suivants » (FR-9). **Choix par défaut : le dimanche est chômé, le samedi
  travaillé** (commerce de gros au Togo) ; les jours fériés ne sont pas sautés. Alternative : un calendrier en
  paramètre de l'organisation (C6), qui changerait la résolution à l'import.

- **Q-D-8 (2026-11-17, STORY-1057) — La vérification C13 `objets-de-l-annexe-c` est-elle verte sans documents
  (C-10) ?** Le générateur du jeu n'en produit pas. **Choix par défaut : `VERT`**, C-10 nommé `SANS_OBJET` dans le
  détail (avec C-18 et C-19, exports tirés de Prospera, jamais déposés au LC) ; demande à C pour les documents.
  Alternative : `ORANGE` (le moteur n'installerait plus le LC fictif) tant que le jeu n'a pas de documents.
- **Q-D-7 (2026-11-17, STORY-1057) — Les noms de l'annexe E (« Estelle Lawson », « Komlan », « SAREX ») sont-ils à
  garder ?** Ce sont ceux de la démo d'origine ; le jeu fictif en a d'autres (Estelle Kpodar, Koffi Mensah, cabinets
  fictifs). **Choix par défaut : la recette lit la personne par son rôle dans le jeu**, la part du LC ne juge aucun nom
  (D-1057-8). Alternative : le générateur de C reprend les noms de l'annexe (s'ils sont fictifs, FR-202).

- **Q-D-6 (2026-11-17, STORY-1054) — Quels messages à l'assuré demandent son consentement ?** FR-19 veut un
  consentement par finalité ; FR-36, FR-48 et FR-18 font des étapes du dossier des messages dus. **Choix par défaut :
  seul le numéro officiel (« assuré (information) », FR-146) est facultatif** (`INFORMATION_DU_DOSSIER`, échec
  fermé) ; les relances de pièces restent du suivi obligatoire (D-1054-6). Alternative : rendre les relances
  facultatives aussi (une ligne de la table des finalités).
- **Q-D-5 (2026-11-17, STORY-1053) — Quel droit change les paramètres de `commande` ?** AD-12 nomme le DG et
  `DIST_ADMIN` ; l'annexe B n'a pas de droit pour ce geste. **Choix par défaut : un droit propre,
  `commande:parametres:modifier`, donné au DG et à `DIST_ADMIN`** (D-1053-7), comme `commande:plafond:deroger` l'a été le
  13/11. Alternative : se contenter d'un droit existant (`dashboard:alerte:configurer`, qui va déjà au DG et à
  `DIST_ADMIN`), au prix d'un sens détourné.

- **Q-D-4 (2026-11-17, STORY-1047) — La commande se juge-t-elle sur l'encours certain ou sur l'encours affiché ?** Le
  PRD dit qu'un encaissement déclaré (espèces, virement) « diminue l'encours affiché » et que le blocage « lit le reste
  dû confirmé », sans trancher pour le plafond. **Choix par défaut : l'encours certain** (D-1047-2) : un encaissement
  déclaré mais non confirmé ne libère pas de crédit ; celui qui déclare ne confirme pas (FR-P60).
- **Q-D-1 (2026-11-16, STORY-1031) — Le KYC dans la garde de `reseau` en mode « sur site ».** La spine (AD-10)
  exige le KYC Money Vibes de l'organisation ; une instance installée chez le client (EPIC-148) n'aura pas forcément
  de `kyc-service`. **Choix par défaut : KYC exigé partout** (D-1031-2), à revoir avec l'agent d'instance.
- **Q-D-2 (2026-11-16, STORY-1034) — Q3 du PRD réseau** : une personne peut-elle être affectée à des nœuds de branches
  différentes ? **Choix par défaut : oui** (avis du PRD, le superviseur itinérant ; D-1034-1).
- **Q-D-3 (2026-11-16, STORY-1035) — Qui est la racine de l'autorité sur les portées ?** Sans racine, personne ne peut
  attribuer la première portée (AD-8 : nul n'attribue plus que la sienne). **Choix par défaut : le `TENANT_ADMIN` de
  l'organisation**, qui détient par son rôle une portée totale pour la gouvernance, non publiée (D-1035-3). Les portées
  « totales » attribuées à quelqu'un d'autre lèvent l'alerte CM-2.

## Pièges rencontrés

- **STORY-333** (fiscal) :
  - (1) **Un heredoc de bash qui contient du TypeScript ou du Python avec apostrophes casse la commande entière**
    (« unexpected EOF while looking for matching `'` ») : rien n'est écrit, et rien ne le dit. Écrire les fichiers et les
    scripts par l'outil d'écriture, puis les lancer (la règle du brief, vérifiée deux fois).
  - (2) **Un `'﻿'` écrit par un script Python dans une chaîne non brute devient un vrai BOM dans le source** :
    `no-irregular-whitespace` le refuse. Garder l'échappement dans le source (`/^﻿/u`).
  - (3) **Le service de cycle de C n'est pas exporté** par `ObligationsModule` : une story de D qui doit faire avancer
    une obligation, ou garder une transition, demande à C (export ou garde) au lieu de fournir le service dans son
    module. 333 a fourni la preuve et la règle dans un module qui n'importe pas `ObligationsModule`, pour que C puisse
    l'importer sans cycle.
- **STORY-332** (fiscal) :
  - (1) **Une mutation qui laisse une variable ou un paramètre inutilisé rougit en compilation, pas sur une
    assertion.** Avec `noUnusedLocals` et `noUnusedParameters`, supprimer un appel (`verifierEstampille(depot, courante)`)
    ou une lecture (`parCode.get(code)`) rend `courante` ou `code` inutilisés. Écrire la mutation en gardant l'usage :
    rendre la condition toujours fausse (`&& x < 0`), ou passer une valeur neutre (`{ ...courante, numero:
    depot.numero, … }`).
  - (2) **Une mutation restée verte peut révéler du code mort, pas un test manquant.** La garde « deux guidages actifs
    de la même version » ne pouvait jamais se déclencher : `analyserManifeste` refuse déjà deux entrées actives d'un même
    couple (`PAQUET_DEPOT_AMBIGU`). Avant d'écrire un test de plus, chercher si une couche plus basse tient déjà la
    règle. Si c'est le cas, retirer le code et le dire dans la fiche.
  - (3) Sous Node 25, les trois tests de régénération du classeur à l'octet (`paquet-tg-dsf-11/12/13`) rougissent tant
    que les copies de `completude-depot/assets/` sont en CRLF (le piège (1) de 331, qui vaut aussi pour ce dossier).
    Ils sont verts sous Node 24.
- **STORY-331** (fiscal) :
  - (1) **Les copies du paquet de dépôt en CRLF doivent être réécrites par `git show` pour les tests locaux.** Cela vaut
    aussi pour les deux copies neuves, `manifeste-formulaires.json` et `tg-tva-1.0.json`. Avec `core.autocrlf=true`,
    un fichier ajouté ou rebasé ressort en CRLF, et son sha256 ne correspond plus au manifeste. Sous Node 25, avant les
    suites, faire `git show HEAD:<f> > <f>` sur chaque copie de `paquets-depot/assets/` et de `completude-depot/assets/`.
    `git status` les dit alors « M » sans aucun diff (`--ignore-cr-at-eol` vide). Ne jamais les ajouter, et faire
    `git checkout -- <dossiers>` avant le commit et avant de rendre le worktree. L'archive LF de Docker n'a pas ce
    problème.
  - (2) **Un motif de mutation doit viser un texte unique dans le fichier, pas un texte partagé.** Un motif qui se
    trouve aussi ailleurs dans le fichier mute la mauvaise occurrence, ou les deux. La mutation rougit alors pour une
    autre raison que celle qu'elle prétend éprouver, ou ne rougit pas. Le script compte les occurrences (exactement 1,
    sinon il s'arrête), et le motif est élargi jusqu'à la ligne qui ne se trouve qu'à l'endroit visé.

- **STORY-330** (fiscal) :
  - (1) **Les copies du paquet de dépôt (`paquets-depot/assets/`, `completude-depot/assets/`) sont vérifiées par leur
    sha256 sur les octets LF du dépôt** ; avec `core.autocrlf=true`, le checkout les écrit en CRLF et les suites du
    livrable rougissent localement (« L'empreinte du paquet de dépôt ne correspond pas au manifeste »). Pour les
    tests sous Node 25, réécrire les blobs (`git show HEAD:<f> > <f>`) : `git status` les dit alors « M » sans aucun
    diff. Ne jamais les ajouter ; `git checkout -- <dossiers>` avant de rendre le worktree. L'archive LF de Docker
    n'a pas ce problème.
  - (2) **Une route neuve qui reçoit un fichier rougit la garde d'AD-13 de 560** (« une seule route reçoit un
    fichier ») : elle n'est vue qu'à la suite complète. L'ajouter à `ROUTES_DE_FICHIER` avec sa raison, dans la même PR.
  - (3) **Un motif de mutation écrit sur une ligne que prettier a coupée** n'est pas trouvé (« MOTIF INTROUVABLE ») :
    écrire le motif sur le texte formaté (retour à la ligne compris) et rejouer la mutation seule.

- **STORY-1141** (paiement, ventes) :
  - (1) **Le tamis du journal de paiement refuse une VALEUR qui a la forme d'un téléphone**, pas seulement un nom de
    champ (`verifierCeQuiNeDoitPasEntrerAuJournal`). Un numéro Mobile Money en clair ferait refuser l'opération entière.
    Le faux `EcritureDArgent` des specs existantes ne passe que le tamis « paiement » : un test neuf doit passer le
    tamis complet.
  - (2) **Karapace dit compatible le passage d'une propriété facultative à requise** quand elle existe déjà dans la
    dernière version. Il faut juger contre la version d'avant (`/compatibility/subjects/{s}/versions/1`).
  - (3) **Les suites e2e de paiement ne sont pas toutes vertes sur `dev`** (`health`, `notifications-webhook`). Avant
    de croire un rouge sien, monter `src` et `test` de `dev` dans la même image (`-v …:/app/src:ro`).
  - (4) **Une mutation qui laisse un import ou une variable sans usage ne compile pas** (`noUnusedLocals`). Il faut
    garder l'usage (`…length > 0`) au lieu de le supprimer.
  - (5) **Un `heredoc` Python qui écrit un motif `\+` ou un `'\n'`** casse le fichier écrit (JSON invalide, chaîne
    coupée). Le Write ou l'Edit le fait juste, comme le dit le brief.

- **STORY-349** (fiscal) :
  - (1) **Un redémarrage du poste tue la sous-session et ses boucles, pas le travail poussé** : la tête poussée et la PR
    restent, la preuve Docker non rendue se refait (vécu à 09:29 : le script n'avait pas pris le verrou ; relancé à
    09:41). Après un redémarrage, vérifier `docker ps -a`, `docker volume ls`, le fichier du verrou, puis relancer.
  - (2) **Les noms des sessions de groupe changent après un redémarrage** : `SendMessage` vers `moneyvibes-apps-86` /
    `-5e` échoue (« not reachable »). Ne pas deviner : le dire dans le rapport, la session de groupe relaie.
  - (3) **Un test de conformité qui compare la réponse entière** (`toEqual({ statut, version })`) rougit dès qu'un champ
    s'ajoute ; la conformité ne tourne que sous Docker, donc la faute ne se voit qu'au verrou. Chercher les `toEqual` sur
    la réponse modifiée dans `test/*.conformite-spec.ts` avant la passe, et compter les obligations mensuelles du vrai
    paquet (`TVA` **et** `RSH`) avant d'écrire une liste attendue.
  - (4) **Une borne de temps dans un test unitaire** (`libelle-imprime.spec.ts`, 500 ms) rougit sous la suite complète
    d'un poste chargé (851 ms chez C) : borner large (2000 ms), là où un comportement quadratique prendrait des minutes.
- **STORY-1140** (dixième passage de D dans `bilan-service`) :
  - (1) **`MSYS_NO_PATHCONV=1` et `curl.exe`** : dans un script de preuve, `curl -o /c/…` n'écrit rien (le chemin POSIX
    n'est plus converti, et `curl` est un binaire Windows). Passer les chemins de sortie par `cygpath -m`. Vécu : une
    pile saine sans aucune réponse enregistrée, rejouée.
  - (2) **Mutations sur un paramètre ou un import** : le service compile avec `noUnusedLocals` / `noUnusedParameters`
    (`TS6133`) ; une mutation qui supprime l'usage d'un paramètre de contrôleur ou d'une fonction importée ne compile pas
    (« 0 total », ou « 8 passed » sans la suite visée). La réécrire en gardant l'usage (`format === 'csv' ? undefined :
    format`, `slice(1)`).
  - (3) **`sed 's/…/\\uFEFF/'`** : `\u` est pour GNU sed « la lettre suivante en majuscule » ; il écrit `FEFF`. Écrire les
    échappements par un script Python ou par l'outil d'écriture (un BOM littéral dans un test rougit aussi
    `no-irregular-whitespace`).

- **STORY-1139** (neuvième passage de D dans `bilan-service`) :
  - (1) **Deux e2e comptent en dur ce que les invariants unitaires comptent aussi** : `bilan-dossier-portee-collaborateur`
    (contrôleurs gardés, dont ceux hors consolidation) et `instance-c13` (les objets de l'export, dans l'ordre). Un
    contrôleur niché ou une collection au plan C13 de plus ⇒ les mettre à jour avec `dossier-scope.invariant`,
    `plan-d-export.invariant` et `export-c13.spec` — sinon une seconde passe Docker (vécu ici).
  - (2) **Un nom de fichier qui finit comme un autre** : `reperes-analyse.controller.ts` finit par `analyse.controller.ts`,
    et le filtre `endsWith('analyse.controller.ts')` de l'invariant de portée en voyait deux. Filtrer avec le séparateur.
  - (3) **`analyse.agnosticisme` coupe les mots aux lettres accentuées** : « DERNIÈRE » donne le jeton `RE` (`` ne voit
    pas `È` comme une lettre), pris pour un code de poste. Pas de majuscules accentuées dans les commentaires du module.
  - (4) **La garde des objets opaques de `openapi-contract` attrape un `string | null` sans `type: String`** dans un
    `@ApiPropertyOptional` (publié `object`) : la poser sur chaque champ nullable d'un DTO de requête aussi.
  - (5) **Le verrou s'attrape mal à une minute d'intervalle** : B et C l'ont repris entre deux essais. Tenter toutes les
    10 s (journaliser une fois sur trente), et ne poser le `trap` de reddition qu'après la prise — un script tué en
    attente ne doit jamais effacer le verrou d'un autre groupe.

- **STORY-1138** (huitième passage de D dans `bilan-service`) :
  - (1) **Un champ neuf d'un producteur est « reçu et jeté » en silence** : la projection ne recopie que les champs que
    `versBalanceProjetable` connaît, et Mongoose (`strict`) retire du `$set` un champ que le schéma ne déclare pas —
    aucune erreur nulle part. Un test sur le **vrai schéma** (`new Modele({...}).toObject()`) le voit ; les tests de la
    projection, qui mockent le modèle, non.
  - (2) **La suite unitaire complète de bilan sous Node 24 a pris plus de 40 min** (12 min au 25/11) sous la charge du
    poste : le `timeout 2400 docker wait` du script l'a coupée à 286/369 suites, sans un rouge, et le conteneur a été
    retiré avec sa sortie partielle. Seconde passe sur la liste des suites restantes (`comm` des fichiers `*.spec.ts`
    et des lignes `PASS`). Attendre un conteneur par son état (`docker inspect -f '{{.State.Running}}'`) avec une borne
    large, et copier la sortie avant de le retirer.
  - (3) **`MSYS_NO_PATHCONV=1` casse le contexte de `docker build` en Git Bash** (« path "/c/Users/…" not found ») :
    passer les chemins de l'hôte par `cygpath -m` (contexte, `-f`, destination de `docker cp`).
  - (4) **`analyse.agnosticisme.spec.ts` balaie les commentaires du module d'analyse** : un mot de deux majuscules
    (« CE dossier ») y est pris pour un code de poste du référentiel ; et la liste des fichiers du module y est fermée
    (un fichier neuf s'y ajoute).
  - (5) Trois mutations sur dix-huit « rougissaient » à la compilation (constante de forme devenue inutilisée,
    rétrécissement de type perdu) : réécrites en gardant la constante lue (`!(FORME.test(x) || /^.+$/.test(x))`) et le
    type (`version as string`), puis tuées sur une assertion.

- **STORY-364** (le refus sourcé du dirigeant) :
  - (1) **Six mutations sur dix « rougissaient » sur une erreur de compilation**, pas sur une assertion. Trois causes :
    un `return` qui laisse du code mort derrière lui ; `if (false as boolean)` qui retire le rétrécissement du type (un
    `affiliation.motif` qui ne compile plus) ; une fonction ou un paramètre devenu inutilisé (`noUnusedLocals`,
    `noUnusedParameters`). Le script de mutations classe donc `COMPILATION` à part de `ROUGE`. Pour garder la mutation
    compilable : ajouter `&& (false as boolean)` à la condition plutôt que la remplacer, garder l'appel `(f(x), null)`,
    garder le paramètre lu `p.code.slice(0, 0)`, et préférer `if (objet) return …` (toujours vrai) à un `return` nu.
  - (2) Le piège (1) de 348 vaut aussi pour **`cat >> fichier <<'EOF'`** (environ 150 lignes de TS avec des `’`) : il
    échoue sans rien écrire. Ajouter un bloc de tests par l'outil d'édition.
  - (3) **La limite de 5 h de l'API** a interrompu la sous-session après les mutations, avant le commit, sans verrou
    tenu. La reprise s'est faite sans perte, depuis le worktree non commité. Commiter dès que les preuves locales sont
    vertes, avant la passe Docker.

- **STORY-348** (le calcul des cotisations et des retenues) :
  - (1) **Un heredoc de plus de ~180 lignes vers `python -`** échoue (« unexpected EOF while looking for matching `'` »)
    sans rien écrire : script par l'outil d'écriture, le bloc de texte inséré passé dans un second fichier.
  - (2) **`pgrep` n'existe pas dans Git Bash** : une attente `until [ -s f ] || ! pgrep …` sort aussitôt. Attendre sur
    le seul fichier de résultat (`timeout … bash -c "until [ -s f ]; do sleep 15; done"`).
  - (3) **Rien sur le worktree pendant un script de mutations** : un `prettier`, un `tsc` ou un `jest` lancé à côté lit
    le fichier muté (et `prettier --write` le réécrirait). Attendre la fin du script.
  - (4) **`npm run build` échoue en local** sur le `prebuild` (paquets de dépôt en CRLF, `PAQUET_DEPOT_INTEGRITE`) :
    `npx nest build` prouve la compilation ; l'image de l'archive LF passe le `prebuild`.
  - (5) **Une mutation `if (true)` sur une condition qui rétrécit le type ne compile pas** (`p` devient `never` plus
    bas) : muter l'affectation (`plafond = null`) ou garder la variable lue (`typeof x === 'boolean'`).

- **STORY-347** (la saisie de la paie) :
  - (1) Le piège (6) de 560 vaut aussi pour **`'\r\n'` dans un script Python passé par heredoc** : le fichier TS reçoit
    un vrai CRLF au milieu d'une chaîne (`Unterminated string literal`). Écrire le script par l'outil d'écriture, ou
    `bytes([92])` pour la barre oblique inverse.
  - (2) **L'e2e de la base de rémunération tourne sous Node 25** (il ne monte que `RemunerationController`, sans
    `AppModule` ni client Kafka) : les mutations du contrôleur s'y jouent sans Docker ni verrou.
- **STORY-346** (le fichier de paie) :
  - (1) **Un échappement `\uXXXX` écrit par l'outil d'écriture arrive en caractère réel** dans le fichier (une espace
    insécable dans une classe de regex, un BOM dans une chaîne de test) : `eslint` le voit (`no-irregular-whitespace`),
    `tsc` non. Le repérer par `od -c`, le réécrire en échappement par un script Python **dans un fichier** (un heredoc
    vers `python -` n'y arrive pas non plus).
  - (2) **La garde AD-13 de 560 rougit pour toute route neuve qui reçoit un fichier** (`garde-ad13.spec.ts`,
    critère 8) : la suite unitaire du seul module ne la voit pas. Lancer la suite complète (Node 25 suffit pour les
    unitaires purs) **avant** de prendre le verrou ; sinon il faut une seconde passe Docker.
  - (3) **`String.prototype.trim()` retire U+FEFF** : une mutation « BOM gardé » survit tant qu'aucun test ne place
    un champ entre guillemets juste derrière le BOM.
  - (4) Une mutation qui rend un import inutile ne compile pas (`noUnusedLocals`) : la garder lue (`void f;`).
- **STORY-560** (premier passage de D dans `prospera-fiscal-service`, worktree `_wt-d-fiscal`) :
  - (1) **`npm ci` échoue sur ce poste** (le client Kafka de Confluent compile son binding sous Node 25, faute de
    binaire, et Visual Studio manque) : `npm ci --ignore-scripts`. Sous Node 25, 18 suites unitaires et 4 e2e rougissent
    alors (client Kafka natif absent, paquets de dépôt en CRLF) ; sous Node 24, sur l'archive LF, tout passe.
  - (2) **`JSON.parse` cite un extrait du corps reçu** (`Unexpected token 'Z', ..."DePasse": Zq7…" is not valid JSON`),
    et Nest le renvoie tel quel (`routes-resolver.js`, `mapExternalException`) : le filtre global le masque désormais
    (`CORPS_ILLISIBLE`). Un témoin doit employer un corps qui produit CE message (une valeur sans guillemets) : `{…, oups}`
    donne « Expected double-quoted property name », sans extrait, et ne prouve rien.
  - (3) **`@nestjs/testing` tait les `warn` et `log` de Nest** : un test qui cherche une fuite dans les journaux doit
    poser `.setLogger(new ConsoleLogger())` sur le module de test, et vérifier que la capture voit bien une ligne.
  - (4) **Un assistant de test à paramètre par défaut** (`construire(cle = CLE)`) : `construire(undefined)` reprend le
    défaut (piège déjà payé par C) ; passer `null`.
  - (5) **Une mutation qui rend un paramètre inutile ne compile pas** (`noUnusedParameters`) : la garder lue
    (`contexte.slice(0, 0)`, `&& acte === …`).
  - (6) **Un `\n` écrit dans une chaîne Python par heredoc ou par l'outil d'écriture devient un vrai retour à la ligne** :
    `chr(10)` ou une chaîne entre triples guillemets.
  - (7) Le verrou a été tenu par C puis par B plus de 40 min : le script autonome réessayé par une boucle de relance
    (huit prises de 9 min au plus) a pris la main sans intervention.

- **STORY-1075** (septième passage de D dans `bilan-service`) :
  - (1) **Une route de santé qui ne lit que le registre des consommateurs dit `OK` broker arrêté** : le client de
    Confluent ne marque pas « hors groupe » quand Kafka tombe (mesuré : `OK` pendant 2 min, `/health` déjà 503). Lire la
    sonde Kafka de `/health` (broker borné à 5 s), pas seulement le registre.
  - (2) **Les noms d'objet C13 n'admettent pas `_`** (`^[a-z0-9][a-z0-9-]*$`) : un nom pris d'une collection
    (`jeux_etats`) est refusé `SCHEMA_NON_CONFORME` par l'import avant même `OBJET_INCONNU`.
  - (3) **Sous la charge du poste** (suite Node 24 dans la VM, build, mutations en local), une mutation a dépassé 400 s
    (le script l'a abandonnée en restaurant le fichier) et une suite ciblée sous Node 25 a pris 100 s : lancer les
    mutations après les suites Docker, avec un délai large.
  - (4) **Les boucles d'attente au premier plan sont coupées vers 150-180 s** (passées en arrière-plan) : des boucles
    courtes, ou `run_in_background` avec un seul observateur (arrêter les doublons).

- **STORY-1074** (sixième passage de D dans `bilan-service`) :
  - (1) **La première sous-session s'est figée 600 s** (sans verrou, rien d'engagé), sur une commande de lecture sans
    `timeout`. Mettre `timeout` même aux lectures (`grep`, `find`, `git grep`).
  - (2) **Un remplacement par script Python sur un checkout CRLF échoue en silence** (le motif écrit en LF ne correspond
    pas) : normaliser en LF, remplacer, réécrire dans la fin de ligne d'origine, et exiger exactement une occurrence.
  - (3) **Un contrôleur dont le chemin contient `consolidation`** (`instance/consolidation`) entre dans le balayage par
    chemin de `portee-groupe.invariant` (13 au lieu de 12) et dans le compte de `dossier-scope.invariant` (29 → 30) :
    exclusion justifiée des routes C13 dans le premier, compte relevé dans le second — le second vu seulement par la
    suite complète.
  - (4) **Importer `AppModule` dans une spec unitaire** charge le client Kafka natif : l'ordre des `APP_GUARD` se lit
    sur le texte d'`app.module.ts`.
  - (5) **Une sélection de suites sans `-w` dans le conteneur Node 24** : un worker tué par SIGKILL (mémoire) rend une
    suite rouge sans rapport ; garder `-w 2` (ou `-w 4 --workerIdleMemoryLimit=700MB`) même pour une sélection.
  - (6) **Mutations** : retirer un décorateur ou une constante laisse un import inutilisé ⇒ « Tests: 0 total » (la
    mutation « survit » sans rien prouver) ; garder l'usage (`@(Decorateur(), (() => undefined) as ClassDecorator)`).
    Un script Python qui imprime « Σ » sous la console cp1252 meurt après la première mutation :
    `sys.stdout.reconfigure(encoding='utf-8')`.

- **STORY-1079** (cinquième passage de D dans `bilan-service`) :
  - (1) **`docker compose exec … /opt/kafka/bin/…` depuis Git Bash** : le chemin est réécrit en
    `C:/Program Files/Git/opt/…` (« no such file ») ; poser `MSYS_NO_PATHCONV=1`.
  - (2) **Deux instances du même service sur un même Kafka** se partagent les partitions si elles gardent les groupes
    de consommateurs par défaut : donner à chacune ses `KAFKA_*_GROUP_ID` (dix variables dans bilan).
  - (3) **Une mutation qui laisse un paramètre inutilisé ne compile pas** sous ts-jest (« Tests: 0 total », suites
    rouges) : elle « meurt » sans rien prouver. Écrire des mutations qui gardent le paramètre lu
    (`espace?.estEssai() === undefined`).
  - (4) **Un script de mutation arrêté en cours laisse le fichier muté et son `.bak`** : indexer le code juste avant
    (`git add`), puis restaurer par `git checkout --` depuis l'index.
  - (5) **`useMocker(() => ({}))` fournit `{}` aussi aux dépendances `@Optional()`** : une garde qui fait
    `dep?.methode()` lève un `TypeError` dans les batteries qui montent les contrôleurs ainsi
    (`bilan-dossier-portee-collaborateur`) — vu seulement par la suite e2e complète ; rejouer l'e2e qu'on a réparé APRÈS
    avoir codé. Tester `instanceof` de la classe attendue.

- **STORY-1118** (quatrième passage de D dans `bilan-service`) :
  - (1) **Une balance de test générée des préfixes de la table** (`notes-syscohada-2.2.spec.ts`, `balances()`) change de
    rang — donc de sens et de montant pour CHAQUE compte — dès qu'on ajoute un préfixe à la table : ses empreintes et ses
    écarts « mesurés à la main » rougissent sans rapport avec la règle touchée. Écarter les préfixes neufs du générateur
    garde la balance d'avant (et prouve la non-régression), plutôt que de remesurer.
  - (2) **Un compte « qu'aucun poste ne reçoit » dans un test** (`281000` en consolidation) cesse de l'être quand la
    table s'étend : prendre un compte hors des classes 2 à 5, que la garde de nomenclature ne couvre pas (`108000`).
  - (3) **Une mutation qui retire un préfixe long peut être équivalente** : le préfixe résiduel (`284` en `AM`) reprend le
    compte (`2844`). Choisir le compte dont le résidu va ailleurs (`2845` : sans lui, `284` l'envoie en `AM` au lieu
    d'`AN`).
  - (4) **Muter un artefact sans réépingler le registre** fait rougir le checksum, pas l'assertion : réécrire l'empreinte
    du registre dans la même mutation (script `muter_artefact`), puis tout restaurer par
    `git -c core.autocrlf=false checkout --` et relancer `build.mjs`.
  - (5) **Deux e2e sont rouges sur `dev` avant toute story** (`ecoute-stable`, `bilan-dossier-portee-collaborateur`) :
    une suite e2e complète qui sort « 2 failed » n'accuse pas forcément la story — rejouer les deux sur une image de `dev`
    avant de conclure.
  - (6) `@2.1` et la zone franche ne rendent pas `valide: true` sur une balance réaliste, même équilibrée :
    `CASCADE_SOUS_TOTAUX` (STORY-678) reste bloquant ; une attente « liasse valide » s'écrit sous `@2.2`/`@2.3`.

- **STORY-1078** (troisième passage de D dans `bilan-service`) :
  - (1) **Un `git stash` / `git stash pop` dans `bilan-service` réécrit en CRLF les JSON des paquets** (`autocrlf` du
    poste) : empreintes fausses, garde et registre rouges sans que le diff le montre. Ne pas stasher ; si c'est fait,
    reconstruire les artefacts par `node scripts/referentiels/build.mjs` (ou `git -c core.autocrlf=false checkout --`),
    puis vérifier `sha256sum` contre le registre.
  - (2) **Le démon Docker ne résout pas `registry-1.docker.io`** pour la ligne `# syntax=docker/dockerfile:1` du
    Dockerfile (téléchargement du frontend BuildKit) : contourné par un `Dockerfile.local` sans cette ligne, écrit dans
    la copie d'archive (`tail -n +2 Dockerfile > Dockerfile.local`, `docker build -f Dockerfile.local --target
    verification --load`) ; l'image `node:24-slim` en cache suffit.
  - (3) **Les tables de passage SYSCOHADA ne rattachent aucun compte d'amortissement** : un jeu de test « réaliste »
    qui porte un `28x` sort déséquilibré ; les contrôles qui doivent le voir lisent les soldes, pas la liasse (D-1078-5,
    ticket ouvert).

- **STORY-1077** (deuxième passage de D dans `bilan-service`) :
  - (1) **Un heredoc de Git Bash mange un antislash même entre apostrophes** (`<<'EOF'`) : `'\\'` d'un script Python y
    devient `'\'` (chaîne non fermée), et `split('\\')` d'un TypeScript y perd le sien. Écrire tout script qui porte un
    antislash avec l'outil d'écriture, puis le lancer.
  - (2) **La suite complète de bilan sous Node 24 sature la VM Docker** (8 cœurs, 7,6 Gio) : à 8 workers, quatre workers
    tués (SIGKILL), des hooks au-delà de 5 s, puis l'API de Docker en 500 (« unexpected EOF » sur `docker run`, `docker ps`
    qui ne répond plus) — le conteneur `--rm` tourne encore, et disparaît avec sa sortie. **Jouer la suite en `-w 4
    --workerIdleMemoryLimit=700MB`, dans un conteneur nommé sans `--rm`, sortie écrite dans le conteneur** (`> /tmp/jest.txt`,
    lue par `docker exec`), puis `docker rm -f`. Jamais une suite complète pendant qu'une pile tourne.
  - (3) Les textes du paquet citent la loi avec l'apostrophe droite (`'`), le code du message la typographique (`’`) :
    une attente de test qui recopie le message doit garder celle de la donnée.
  - (4) `scripts/*.mjs` est hors du projet ESLint (« not found by the project service ») et hors de prettier, comme
    `gardes-analyse.mjs` : `node --check` et la spec en `node` fils sont leurs preuves.

- **STORY-1073** (D dans `dossier-service` et `paiement`, dépôts de B prêtés) :
  - (1) **Une coupure du réseau pendant les `docker build`** (« lookup auth.docker.io: no such host », `npm ci` de 6 546 s,
    binaire de Confluent introuvable sur GitHub) : 1 h 50 de verrou perdues sans qu'aucune commande n'échoue vite. Avant
    un `docker build` sous le verrou : `curl -sS -o /dev/null -w '%{http_code}' https://registry.npmjs.org/` ; un build qui
    dépasse 10 min est à regarder, pas à attendre.
  - (2) **Karapace 500 juste après `healthy`, encore** (`PUT /config/<sujet>` du script `registre.mjs enregistrer`) : une
    recette qui l'oublie lit un registre vide — et un fait validé contre le schéma relu **vide** (`{}`) passe toujours.
    Enregistrer en boucle bornée (20 × 3 s) et vérifier le sujet avant de valider un fait.
  - (3) **`dossier-service` en `NODE_ENV=staging` ne démarre pas sur son image runtime** (« unable to determine transport
    target for pino-pretty ») : `production` sur une pile.
  - (4) **`PATCH /dossiers/{id}` d'une SARL exige un dirigeant** (`400 DIRIGEANT_REQUIS`) : la forme juridique et les
    dirigeants se posent ensemble.
  - (5) **Changer la signature d'un rappel de `EcritureDArgent` rougit cinq suites à la compilation** (doubles qui appellent
    `operation.publier?.(resultat)`), visibles seulement à la ligne `Test Suites:` (§1.5) : les autres doubles, typés
    plus lâchement, passent.
  - (6) **Un motif de mutation lu en JSON perd ses échappements** : `"\u00a0"` y devient le caractère insécable, et le
    motif ne se trouve plus dans le source (qui porte les six caractères) ; l'écrire par Python (`chr(92)`).

- **STORY-1076** (premier passage de D dans `bilan-service`) :
  - (1) **`prettier --write` sur un motif (`referentiel/*.spec.ts`) réécrit en LF tous les fichiers du dossier** du
    checkout (CRLF par `autocrlf`) : `git status` les dit modifiés sans aucun diff (`--ignore-cr-at-eol` identique).
    Ne passer à prettier que ses fichiers ; sinon `git checkout --` des seuls fichiers sans diff avant le commit.
  - (2) **Un artefact de référentiel se restaure par `git -c core.autocrlf=false checkout --`** (sinon CRLF, empreinte
    fausse) ; un `.ts` du checkout par un `git checkout --` ordinaire (il y est en CRLF). Les sources JSON et les
    artefacts réécrits par `build.mjs` sont en LF dans le checkout. **Le `git switch dev` d'après la fusion
    les a réécrits en CRLF** (empreinte de `@2.3` fausse) : supprimer, puis `git -c core.autocrlf=false checkout --`.
  - (3) **Jest écrit son rapport sur stderr** : `npx jest > f 2>&1`, jamais `2>&1 > f` (le fichier reste vide).
  - (4) **Un paquet livré porte désormais des seuils** : une spec qui fabrique une variante de l'artefact réel pour
    éprouver un AUTRE bloc doit retirer `seuils` (sinon la version citée par le seuil appliqué suit la variante) ; le
    patron est dans `analyse.lecture-alternative.spec.ts`.
  - (5) **Changer une empreinte de paquet** : elle est épinglée dans le registre et dans quatre specs
    (`referentiel-registry`, `referentiels-additionnels-coherence`, `notes-syscohada-2.2`, `titres-rubriques-2.2`) ;
    un remplacement des quatre valeurs par un script, puis un commentaire « MAJ STORY-n » à chaque endroit.

- **STORY-1072** :
  - (1) **Un e-mail envoyé deux fois à un seul des destinataires** : chercher le rejeu côté `notification`, pas chez
    l'appelant. Le flux `notification:transactionnel:events` (Redis, `XRANGE`) le montre : le travail passe `delayed`
    juste après une remise acceptée. Cause : une transaction écrite à la main (sans rejeu de
    `TransientTransactionError`) qui partage un compteur avec une transaction concurrente ; patron :
    `withTransaction`, ou rejouer sur l'étiquette (D-1072-12). Les journaux de `notification` ne disent rien de
    l'échec intermédiaire (seul l'échec final est consigné).
  - (2) **Une suite Node 24 complète lancée en même temps qu'une pile** fait passer Kafka `unhealthy` (son contrôle de
    santé dépasse son délai) : `up` refuse de lever les services. Jouer la suite, puis la pile.
  - (3) **L'objet d'un e-mail arrive en mots encodés RFC 2047** (`=?UTF-8?Q?…?= =?UTF-8?Q?…?=`) : l'espace entre deux
    mots adjacents ne compte pas ; le corps texte est en quoted-printable (décoder en octets, puis UTF-8).
  - (4) Une mutation qui compare un littéral sans recouvrement (`fait.schemaVersion === -1` sur un type `1`) ou qui
    lit un champ hors du rétrécissement d'une union (`lecture.raison` dans la branche `lisible`) ne compile pas :
    garder sur une autre variable (`&& corps.length < 0`). Un texte d'essai sans espaces autour rend la mutation
    « rogné » équivalente : éprouver « tel quel » avec des espaces.
  - (5) Un `python - <<'EOF'` qui écrit `\n` dans une chaîne Python d'un fichier CRLF y met des LF seuls (fichier
    mixte) : passer par l'outil d'écriture ou convertir la fin de ligne du fichier.

- **STORY-1071** :
  - (1) **Une condition de la machine du dossier peut n'être posée par personne** : `EXPERTISE_VALIDEE` était un constat
    (échec fermé, D-988-1) qu'aucune commande n'écrivait — la transition 7 refusait tout dossier, et les tests la
    posaient à la main. Avant de compter sur un constat, chercher qui l'écrit (`grep "constats"` dans `dossiers.service.ts`) ;
    sinon, en faire une condition calculée (`CONDITIONS_CALCULEES`) et l'éprouver dans les tests générés de la table.
  - (2) **Une mutation qui laisse une variable sans usage, ou qui compare deux littéraux sans recouvrement, ne compile
    pas** (`m.etat === ''` dans un bloc qui teste `m.etat === 'COMPLEMENT_DEMANDE'` ; `close &&` retiré) : muter la
    valeur (`const close = m.etat !== ''`) ou garder sur une autre variable (`m.version < 0`).
  - (3) Le pilote Python imprime des `✔` : sous Git Bash la sortie est en cp1252 (`UnicodeEncodeError`) ; lancer
    `python -X utf8`.
  - (4) Une recherche de bloc YAML par `index('  mongo:')` trouve d'abord `      mongo:` (une dépendance) : chercher
    `'\n  mongo:\n    image'`.

- **STORY-1070** :
  - (1) **Les délais de crochet du banc MongoDB (1069-1) venaient de la DDL par test, pas du code** : une suite verte
    une fois (1366/1366, 168 s) a rougi au rejeu (7 délais). Un banc créait par test une base, six `createCollection` +
    `syncIndexes`, puis un `dropDatabase`, sérialisés dans `mongod` (0,5 s seul, 1,6 s à 4 bancs, 2,8 s à 8). Corrigé
    dans `dossiers.service.spec.ts` (#32) : base créée une fois par fichier, `deleteMany` entre deux tests, `afterAll`
    qui la supprime ⇒ 0 délai, 85 s. Un nouveau banc MongoDB suit ce patron ; on ne relève pas le délai.
    Une seule réussite ne prouve pas l'absence de délai : rejouer.
  - (2) **Une mutation qui lit un champ absent du type ne compile pas** (`e.code` dans `alertesDuFormulaire`) : la
    garder sur une variable du bloc (`moment.enregistrement < 0 ? … : undefined`).
  - (3) Une portée de dossier : un gestionnaire non affecté ne voit pas le dossier (404 `DOSSIER_INTROUVABLE`, pas 403) ;
    un test d'un « autre » acteur passe par le `RESP` qui a affecté.
  - (4) Un paramètre par défaut d'une aide de test (`motif = '…'`) avale un `undefined` explicite : passer `''`.

- **STORY-1069** :
  - (1) **Délais de crochet de 5 s sur le banc MongoDB réel sous charge** : la suite complète (`-w 2`) a compté 8
    échecs « Exceeded timeout of 5000 ms for a hook » (portée, relances 999), jamais sur les tests de la story ; rejoués
    seuls : portée verte, puis `dossiers.service.spec` encore 4 délais (1002) en `-w 1`, vert à `--testTimeout=20000`
    (244/244). Lire le message (`thrown: "Exceeded timeout…"`) avant de chercher une régression.
  - (2) **Un `docker run` de jest sans `--forceExit` ne s'arrête pas** (poignée ouverte) : le conteneur est resté en
    marche, a tenu le réseau de la pile (`Resource is still in use` au `down`) ; `docker rm -f`, et toujours
    `--forceExit` pour un rejeu.
  - (3) **`gh pr merge` a répondu « TLS handshake timeout » mais la fusion était faite** côté GitHub : relire
    `gh pr view` (`MERGED`, `headRefOid`) avant de relancer (« already merged »).
  - (4) **Une mutation par `sed` d'une ligne qui figure dans plusieurs modules** (`"rang",` dans `ged` et `sinistres` du
    registre) les retire toutes ; et `git checkout --` pour rendre le fichier efface aussi les modifications non
    commitées : copier le fichier avant, muter par numéro de ligne, rendre la copie.
  - (5) Le « Rebase and merge » de la plateforme change le SHA : l'origine des copies (`ORIGINE-DES-SCHEMAS.json`) se
    corrige dans un second commit, après la fusion de la plateforme (patron de 1016).

- **STORY-1068** :
  - (1) **`NODE_ENV: staging` fait tomber `assurance-service` au démarrage** (« unable to determine transport target for
    "pino-pretty" » : le paquet n'est pas dans l'image de production) ; `sinistres` aussi le lirait. Sur une pile de
    preuve des deux services d'assurance : `NODE_ENV: production` (comme leurs compose de développement).
  - (2) **Une mutation qui rend un import ou une fonction inutiles ne compile pas** (piège 1063-1, encore) : retirer
    `entierPositif(...)` ou `EntitlementStatus.REVOKED` ; la garder lue (`entierPositif(x) || x === 0`,
    `!== ("X" as EntitlementStatus)`). Dans un script de mutations, une apostrophe dans une chaîne entre apostrophes casse
    le script entier en silence : `node --check` avant de le lancer.
  - (3) **La course d'un upsert ne se prouve pas par `Promise.all`** (piège 1062-1) : l'espion sur `updateOne` du modèle
    joue l'écrivain concurrent (il insère, puis rend `matchedCount: 0`) ; la mutation « le perdant abandonne » n'est
    tuée que par lui.
  - (4) Le checkout de `sinistres` avait 33 commits de retard et ses dépendances avaient changé (`bullmq`, `ioredis`,
    `ajv`…) : `npm ci --ignore-scripts` avant toute suite locale.

- **STORY-1067** :
  - (1) **Un pilote qui « attend » un refus en rejouant l'acte le fait passer** : la boucle qui guettait
    `COMMANDE_FACTUREE` a modifié la commande facturée avant que `commande` sache la facture (la fenêtre de D-1067-14,
    jouée pour de vrai : anomalie `FACTURE_D_UNE_COMMANDE_MODIFIEE`, engagement juste). Attendre l'état voulu en base
    (`commande_factures`), puis jouer l'acte une fois ; rejouer le pilote sur une organisation neuve.
  - (2) **Une garde jouée deux fois** (avant la transaction, puis dedans) fait survivre une mutation qui n'en retire
    qu'une : muter la règle elle-même. Une mutation qui casse le rétrécissement d'une union (`reponse.issue === 'X'`)
    ne compile pas : ajouter une condition au lieu de changer le littéral.
  - (3) Une ligne neuve d'une facture exige la fiche de son article (`LIGNE_DESIGNATION`, 1065) : la poser dans le test.
  - (4) `docker compose down` d'une pile qui monte `${RECETTE_DIR}` échoue sans la variable (« empty section between
    colons ») : la reposer au `down -v`.

- **STORY-1066** :
  - (1) **`npm ci` de l'étage `base` a échoué deux fois** (DNS de GitHub injoignable depuis le constructeur, puis
    « Completion callback never invoked » au déballage du binaire de Confluent) : le cache de la couche était perdu.
    Vérifier la sortie (`VERIF 1`), relancer la construction ; ne jamais lever une pile sur une image du même nom plus
    ancienne (piège 1065-4).
  - (2) **Une pile recomposée par copie de deux piles** (1065 + le bloc Karapace de 1061) a gardé deux fois
    `emetteur-de-test` : `docker compose` refuse (« mapping key already defined »). Relire le YAML assemblé.
  - (3) **Importer une fixture d'un `*.spec.ts`** dans une autre suite y rejoue ses `describe` : la reposer dans le test.
    Une série de plus change les lectures qui listent les séries et un PUT vers une série qui devient servie : les
    tests de 1061 qui comparaient en `toEqual` ou attendaient 400 ont été mis à jour (piège 1062-4).
  - (4) **Une mutation sur une règle d'arrondi peut être équivalente sur les cas d'UJ-1** (le reste exact égale l'arrondi) :
    un cas de 12 F à 18 % (cinq avoirs de 1 F, puis le reste) la tue.
  - (5) La session a été coupée par une limite d'API à 04:30 (travail non commité intact, repris à 09:01) : commiter par
    étapes dès que le code compile.

- **STORY-1065** :
  - (1) **Un PDF à police embarquée n'a pas de texte lisible dans ses flux** (glyphes en hexadécimal) : un test qui
    cherche « FAC-2026-000001 » dans les octets ne trouve rien. Vérifier les mentions par un espion sur
    `PdfDocument.prototype.text` (unitaires) et lire le PDF servi avec un vrai lecteur (`pdfjs-dist` de
    `document-service`, hors des dépendances du service, `scripts/recette/1065/texte-du-pdf.mjs`) ; `pdfjs` rend l'espace
    insécable comme une espace : comparer sans elle. Les métadonnées (`/CreationDate`, `/Title`) sont des objets
    indirects : chercher `(D:…)`, pas `/CreationDate (D:…)`.
  - (2) **Le cache des droits est par membre (piège 1056-3) a resservi** dans un test HTTP : un membre lu d'abord avec
    d'autres droits garde ceux-là ; un refus (403) se prouve avec un membre neuf, et chaque jeu de droits a son membre.
  - (3) **Le verrou a été tenu 87 min par B (1080, recette complète)** : code, unitaires sous Node 25, mutations pures,
    lint, recette et fiche faits d'abord ; boucles bornées de 9 min ; une prise, toutes les preuves d'affilée (41 min).
  - (4) **Un `docker compose up` lancé pendant la construction `--no-cache` prend l'ancienne image du même nom** (la
    construction n'avait pas fini) : attendre « IMAGES OK », vérifier `docker images` (« Created ») et le contenu de
    l'image (les polices dans `dist`) avant de lever la pile du rejeu ; la pile levée trop tôt a été descendue sans
    preuve.
  - (5) Une mutation qui retire un décorateur rend son import inutile (`noUnusedLocals`) : la garder par
    `...[Public()].filter(() => false)`. Un heredoc Python long avec des apostrophes a encore échoué : script ou
    remplacements par l'outil d'édition.

- **STORY-1064** :
  - (1) **Le piège 1063-2 (CRLF du journal) a resservi**, aggravé : un script de remplacements corrigé par un second
    script **écrit par heredoc** a perdu ses antislashs (`\r\n` devenus de vraies fins de ligne), puis réécrit en mode
    texte sous Windows (chaque `\n` devenu `\r\n`, et `\r\n` devenu `\r\r\n`). Écrire ces scripts **avec l'outil
    d'écriture**, et y nommer les fins de ligne par `chr(13)` et `chr(10)`, jamais par un littéral (§1.7).
  - (2) **Sous Node 25, deux suites de `ventes` rougissent** (`app.module.invariant`, `app-cablage.invariant` : elles
    chargent l'`AppModule` et le client Kafka natif) : attendu ; la suite complète se juge sous Node 24 (étage
    `verification`).
  - (3) **Un contrat fermé** (`additionalProperties: false`) qu'on ne tient pas : ne rien y glisser (le jeu serait refusé
    par `jeu:verifier` et par le catalogue) ; poser le fichier à côté, le vérifier par son propre test (la règle de
    `verifierJeu` jouée par le test, plus les règles du consommateur), et demander le champ au groupe qui tient le
    contrat.
  - (4) Le verrou Docker était tenu par B (975, pris à 22:55) : tout ce qui ne demandait pas Docker (code, tests sous
    Node 25, mutations, PR, annonce fusionnée) a été fait d'abord ; attente par boucles bornées de 9 min ; une prise.

- **STORY-1063** :
  - (1) **Une mutation qui rend une variable « peut-être `undefined` »** (`if (!noeud && …) throw`, puis `noeud.nature`)
    ne compile pas (TS18048) : muter l'appel (`if (lignes.length < 0) await exigerLesZones(…)`). Retirer une constante
    d'un tableau rend son import inutile (`noUnusedLocals`) : la garder par `...[X].filter((c) => c.length < 0)`.
  - (2) **Le journal de D et le tracker sont en CRLF dans `_wt-d-stories`** (`core.autocrlf=true`) ; une fiche neuve écrite
    par l'outil est en LF : un remplacement Python sur `\n` ne trouve rien dans le journal. Normaliser à la lecture, rendre
    les fins de ligne d'origine à l'écriture (script de remplacements de la session).
  - (3) **Un pilote HTTP sur la pile, entre deux `docker compose exec`** : le serveur ferme la connexion gardée ouverte
    (5 s), `fetch` échoue « other side closed » au milieu d'un import ; et des organisations fixes rendent le pilote non
    rejouable après un passage partiel. Rejouer sur `UND_ERR_SOCKET` (la route est idempotente) ; deux organisations
    neuves à chaque passage.
  - (4) **Le kit des cibles assemble le nom de ses collections à l'exécution** (préfixe `reprise_`) : l'invariant du plan
    d'effacement ne les lit pas dans les sources ; elles sont nommées dans la part, et un test vérifie que le kit les crée.
  - (5) Le verrou Docker était libre au rituel suivant (B l'avait rendu) : tout ce qui ne demandait pas Docker (générateur,
    code, unitaires sous Node 25, lint) était fait avant ; une seule prise, toutes les preuves d'affilée.
  - (6) **Sous charge (une construction `--no-cache` en parallèle)**, une passe d'intégration a compté un échec que la sortie
    résumée ne nommait pas, et un `docker exec … mongosh` du pilote a échoué sans message (déjà vu en 1061-4). Rejouées
    seules : vertes (deux fois). Ne pas jouer une suite pendant une construction ; garder la sortie complète (`●`), pas
    seulement le résumé, pour pouvoir nommer un échec.

- **STORY-1062** :
  - (1) **Une course réelle ne prouve pas à chaque passage** : le test de dix états concurrents (même sur trente objets)
    n'a montré le défaut que deux fois sur trois ; une mutation a survécu. Rendre la course **déterministe** : un espion
    sur `updateOne` du modèle joue l'écrivain concurrent (la ligne d'un état plus ancien) puis lève l'erreur 11000.
  - (2) **Karapace refuse une contrainte ajoutée** : remplacer une énumération par `minLength: 1` est `INCOMPATIBLE` ;
    retirer l'énumération sans rien ajouter est BACKWARD. Vérifier la compatibilité **avant** d'enregistrer (le script
    s'arrête au premier refus, mais il avait déjà enregistré les sujets précédents).
  - (3) **L'invariant des modules isolés vaut aussi pour les tests** : un `*.spec.ts` de `commande` qui importe le
    lecteur de `facturation` le fait rougir. La lecture du fait se prouve dans `facturation`, sur un fait écrit à la main
    et validé contre le schéma publié.
  - (4) Une série de plus (`commandes`) change les lectures qui listent les séries (`GET /commande/series`) et un
    paramètre de plus change toute version lue (`parametres.valeurs`) : des tests HTTP de 1052 et 1049 les comparaient
    en `toEqual`. Les jouer tous sous Node 24 avant de pousser.
  - (5) Une commande Docker longue (`jest` complet) dépasse les 180 s de l'outil et part en arrière-plan : écrire sa
    sortie dans un fichier et attendre ce fichier, une suite par conteneur, en parallèle.
  - (6) La session a été coupée une fois par une erreur réseau pendant l'écriture de la recette ; le travail non commité
    était intact. Commiter par étapes (test rouge, correctif, la story) avant de longues écritures.

- **STORY-1061** :
  - (1) **Deux classes `@Schema` du même nom dans deux modules d'un même service** (`CreanceLue` de `commande` et de
    `facturation`) : le nom de la classe est celui du modèle Mongoose, et la connexion est partagée ; l'un écrivait dans la
    collection de l'autre, sans erreur de compilation ni de démarrage. Seuls les tests d'intégration de 1059 (rouges sur
    des montants) l'ont montré. Invariant `src/modeles-uniques.invariant.spec.ts` : nommer un modèle par son module.
  - (2) **Un upsert conditionnel sur une ligne absente perd le plus récent sous concurrence** (déjà vu en 1050) : un test
    de dix états simultanés passait deux fois sur trois. Jouer chaque test de concurrence **plusieurs fois** avant de
    conclure (cinq passages d'affilée ici).
  - (3) **Karapace juge un motif modifié incompatible, un motif retiré compatible** : un relâchement passe par le retrait
    (motif, énumération), jamais par un motif élargi ; témoin joué.
  - (4) Sous Git Bash, un `docker exec` (producteur et consommateur de console Kafka) échoue parfois sans message sur le
    poste chargé, et le consommateur sort sur son délai avec un code non nul : le pilote rejoue et lit la sortie, pas le
    code.
  - (5) Les commandes passent en arrière-plan après 180 s : attendre sur le **fichier de sortie** que la commande écrit,
    pas sur la sortie de la tâche (un `grep` sur le mauvais fichier n'aboutit jamais). Un heredoc avec des apostrophes et
    des antiquotes a encore échoué : script écrit par l'outil d'écriture.

- **STORY-1060** :
  - (1) **Un mutant « lu hors de la transaction » survit aux tests d'intégration de l'import C13** : les références se
    vérifient avant l'écriture, si bien qu'aucun lot refusé n'atteint `ecrire` ; et lire le calendrier hors de la session
    rend le même résultat sans concurrence. Le tuer par un test unitaire de `ecrire` sur une connexion factice qui note la
    session de chaque appel.
  - (2) **L'invariant du plan d'effacement lit `collection: '…'` en clair dans les sources** : un `@Schema({ collection:
    UNE_CONSTANTE })` lui échappe (la collection paraît inconnue, le plan « nomme une coquille »). Écrire le nom en clair
    dans le décorateur, et vérifier la constante par un test.
  - (3) **`python - <<'EOF'` avec des accents dans le script** : sous Git Bash, l'entrée standard n'arrive pas en UTF-8 et
    une assertion `s.count(…) == 1` échoue sur un motif accentué ; la commande suivante (après `;`) tourne quand même.
    Écrire le script au fichier (outil d'écriture), le lancer avec `python -X utf8`, et chaîner par `&&`.
  - (4) Le verrou Docker était libre au rituel ; tout ce qui ne demandait pas Docker (règle, tests locaux sous Node 25,
    mutations unitaires, annonce fusionnée, pile et pilote écrits) a été fait **avant** de le prendre : une seule prise.

- **STORY-1059** :
  - (1) **`eslint --fix` retire un `as string` devenu inutile après une garde** (`if (c.creanceId !== \`…\`)` rétrécit
    le type) : une mutation qui affaiblit la garde (`&& …`) casse alors la compilation (TS2322). Muter vers une garde
    qui garde le rétrécissement (`typeof c.creanceId !== 'string'`).
  - (2) **Une vérification redondante rend une mutation équivalente** : `FacturesDuModule` et `OuverturesDesCreances`
    vérifient tous deux « déjà `OUVERTE` » ; muter l'un survit. Éprouver le chemin intérieur directement (`tenter`), et
    la condition d'écriture (`$ne: 'OUVERTE'`) par une tentative qui finit **après** une ouverture concurrente.
  - (3) **Un état absolu rejoué à l'identique ne prouve pas « la plus haute révision »** : `updateOne` sur `$lte` rend
    `modifiedCount: 0` si le contenu ne change pas. Rejouer la même révision **avec un autre contenu**.
  - (4) **`paiement` met le `sourceId` en majuscules dans l'identifiant du registre** (`…|FACTURE:D079FA5B-…`), pas dans
    `creanceId` (`FACTURE:d079fa5b-…`) ni dans `referenceExterne` : ne jamais rapprocher par `cleRegistre`.
  - (5) **La pile avec le vrai `paiement`** : il est `unhealthy` par construction (fournisseurs déclarés sans
    raccordement) : `depends_on` en `service_started`, vivacité sur `/api/v1/health/live` ; son MongoDB exige les
    scripts de `mongo/` du dépôt en LF (`git -c core.autocrlf=false archive`), montés en lecture ; il lit le KYC
    (`kyc.status.changed`, `APPROVED`) et son droit (`entitlement.changed`, `moduleCode: paiement`) sur Kafka ; le jeton
    porte les deux audiences et `perms: ['paiement:demande:emettre']` (lu dans le jeton, pas dans `/moi/droits`).
  - (6) **Le rejeu de `terrain` laissé par 1058 a pris dix minutes** sous le verrou (image `--no-cache` en arrière-plan,
    pilote en commande courte) : le jouer dès la prise du verrou, avant les preuves de la story.

- **STORY-1058** :
  - (1) **`terrain-service` hors `NODE_ENV=production` ne démarre pas** dans l'image `runtime` : `pino-pretty` (dépendance
    de développement) y manque ; `ventes` lit `LOG_PRETTY`, `terrain` non. Une surcouche de recette de `terrain` garde
    `production` (à corriger avec une story du socle de terrain).
  - (2) **Une mutation qui laisse un import ou un paramètre inutilisé ne compile pas** (`noUnusedLocals`,
    `noUnusedParameters`) : muter la condition (`… && false`, `'REPRISE'` pour `'MOTEUR'`), jamais retirer la ligne.
  - (3) **Un banc qui lève « aucun refus »** fait rougir le test sur une exception, pas sur l'assertion : rendre un
    résultat sentinelle (`AUCUN_REFUS`) que l'`expect` compare.
  - (4) **Express plafonne un corps JSON à 100 Ko** : un lot C13 de 500 plans de journée le dépasse ;
    `app.useBodyParser('json', { limit: '10mb' })` dans `main.ts`.
  - (5) **Une suite longue (rejeu complet) lancée en arrière-plan avec une attente qui boucle** a bloqué la session :
    commandes courtes, une étape à la fois, et le verrou rendu aussitôt la pile descendue.

- **STORY-1057** :
  - (1) **Un `foo.ts` et un `foo.json` dans le même dossier** (`annexe-e.ts`, `annexe-e.json`) : `import … from
    './annexe-e'` charge le JSON sous `ts-node` et jest (« not iterable ») ; le `dist` compilé, lui, marche. Nommer le
    JSON autrement (`table-annexe-e.json`). Déjà vu en 1051 : à éviter d'emblée.
  - (2) **`cat > fichier` sans entrée en tête d'une commande** attend la console : la commande ne finit jamais (tâche
    d'arrière-plan à arrêter). Et un heredoc mange encore l'antislash d'un `'\n'` dans un script Python : écrire au
    fichier, ou par l'outil d'édition.
  - (3) **Les e2e chargent `AppModule`** (la chaîne de gardes) : elles tirent le client Kafka natif et ne tournent que
    sous Node 24, dans l'image `verification` ; les unitaires purs tournent sous Node 25 en local.
  - (4) Un `tsc --noEmit` local écrit `dist/tsconfig.tsbuildinfo` (incrémental) : supprimer `dist/` avant de rendre
    le checkout.
  - (5) Sous Git Bash, `docker compose run -e RECETTE_RAPPORT=/tmp/r.json` réécrit le chemin en chemin Windows :
    `MSYS_NO_PATHCONV=1`.
  - (6) Un message d'échec énorme (une expression régulière sur 46 000 lignes) dépasse le tampon de `spawnSync` : la
    mutation paraît survivre (« Tests: ? »). Écrire l'assertion sur une liste courte (`filter` puis `toEqual([])`).
  - (7) **Un contrôle de rejeu « mêmes réponses » survit à un état gardé** (deux parties identiques, mais fausses) :
    exiger aussi les réponses attendues au rejeu.
  - (8) `rm -rf "$S/…"` est refusé par la garde de l'outil : écrire `"${S:?}"/…`.

- **STORY-1056** :
  - (1) **`docker build` sur ce poste passe par le constructeur `desktop-linux` (pilote `docker-container`)** : sans
    `--load`, l'image reste dans le cache de build et `docker images` ne la voit jamais (« No output specified »). Une
    attente « jusqu'à ce que l'image existe » tourne alors sans fin : construire avec `--load`.
  - (2) Un tableau de promesses de refus créées d'avance (`[['CODE', service.saisir(…)], …]`) les lance toutes en
    parallèle ; leurs rejets sont pris en charge trop tard et jest compte un échec par rejet. Mettre des fonctions
    (`() => service.saisir(…)`) et les appeler une par une.
  - (3) Un test HTTP qui veut un 403 pour un membre « avec moins de droits » doit prendre un **membre neuf** : le cache
    des droits est par membre (60 s), un jeton réduit d'un membre déjà lu garde ses anciens droits.
  - (4) Karapace a encore répondu 500 au premier enregistrement juste après `healthy` (§1.9) : rejouer.
  - (5) Une mutation qui retire la seule lecture d'un paramètre (`empreinte`) casse la compilation
    (`noUnusedParameters`) : la tourner (`&& empreinte.length > 0`).
  - (6) Un heredoc Python de plus de ~180 lignes, ou qui porte des antiquotes, échoue (« unexpected EOF ») : script écrit
    par l'outil d'écriture, puis lancé.

- **STORY-1055** :
  - (1) **La version d'un lot du kit vaut par `lotId`** : un banc qui livre des zones puis des commerciaux sous le même
    lot voit `INCHANGE/VERSION_ANTERIEURE`. Il faut un lot par sorte d'objet.
  - (2) **Le verrou Docker a été tenu 80 min par B.** Coder et pousser d'abord tout ce qui ne demande pas Docker :
    tsc, lint, unitaires locaux. Ceux du client de Confluent échouent sous Node 25 (« Could not locate the bindings
    file »), c'est attendu. Puis tout jouer d'affilée sous le verrou.
  - (3) **La suite de conformité doit passer sans retouche** : le banc s'adapte au module (organisations traduites,
    profondeur posée), jamais la suite.
  - (4) **Un manifeste recopié change son empreinte** : mettre à jour `socle/manifestes/sources-des-manifestes.ts`
    (commit et sha256) dans le même commit, sinon `pile-du-moteur.invariant` rougit.
  - (5) **Un script Python passé par heredoc** qui écrit une séquence d'échappement de fin de ligne écrit de vrais
    retours chariot dans son propre source. Un heredoc d'une centaine de lignes avec des apostrophes échoue aussi.
    Écrire le script avec l'outil d'écriture (`chr(13)`).
  - (6) `python -I` ignore `PYTHONIOENCODING` : employer `python -X utf8 -I` pour afficher les émojis du tracker.

- **STORY-1054** : (1) **deux suites e2e de `notification` lancées en parallèle dans deux conteneurs ont fait tomber
  Docker Desktop** (API en 500, conteneurs orphelins) ; une à la fois, `--runInBand --forceExit`, sortie écrite dans
  un fichier du conteneur. Un `--memory 4g` sur la suite unitaire complète fait tomber six suites « failed to run »
  (aucun test rouge) : sans plafond, 287/287. (2) Une mutation `if (false && …)` ou une comparaison sans recouvrement
  casse la compilation (ts-jest) : écrire `… && x.length < 0`. (3) Le motif d'un `Envoi` échoué est le **texte** de
  l'adaptateur (« Le canal SMS n'est pas configuré… »), pas un code : ne le recopier que s'il a la forme d'un code
  nommé. (4) Un heredoc de plus de ~180 lignes échoue (« unexpected EOF ») : bloc écrit par l'outil d'écriture puis
  ajouté par un petit script.

- **STORY-1053** : (1) un émetteur de jetons de recette qui **régénère sa clé** à chaque démarrage, arrêté puis relancé
  (recette « auth arrêté »), fait répondre **401** à tous les services (même `kid`, clé changée, JWKS en cache) : garder
  la clé dans un fichier du conteneur. (2) Une mutation qui retire un appel laisse un import ou un paramètre inutilisé :
  ts-jest refuse de charger la suite (« Test suite failed to run ») ; tourner la mutation pour garder le symbole
  (`… && unParmi.length < 0`, `delaiMs * 1000`). (3) Sous Git Bash, `python` (Windows) ne lit pas `/tmp/…` : écrire
  les réponses de `curl` dans un chemin `cygpath -m`. (4) Le cache des droits compte son âge depuis l'**écriture** :
  une recette longue qui suppose qu'un membre lu au début est encore en cache après `stop` d'auth se trompe (60 s) ;
  prendre un membre jamais lu pour prouver le 503. (5) Un dossier racine neuf dans la plateforme fait rougir
  `test/scripts-racines.test.ts` tant que B ne l'a pas inscrit : mettre le code de D dans un dossier déjà lu
  (`contrats/distributeur/`).

- **STORY-1052** : (1) **deux transactions MongoDB qui créent le même document (upsert) ne se heurtent qu'à
  l'acquittement** : chacune voit son propre document neuf et tire le même numéro ; sur un document qui existe, le
  second incrément est refusé tout de suite (`WriteConflict`, rejoué par `withTransaction`). Une logique qui lit un
  état extérieur pendant la transaction (ici l'ancre) voit alors ce qu'a écrit la gagnante : créer le document hors
  de la transaction avant d'y entrer. Mesuré : rouge une fois sur trois, vert seul ; un diagnostic instrumenté (une
  ligne par appel) l'a montré, pas la relecture du code. (2) `NODE_ENV=staging` sur l'image runtime de `ventes` : pas
  de `pino-pretty`, le service ne démarre pas ; poser `LOG_PRETTY=false`. (3) `docker compose … down -v` lit les
  variables d'interpolation de la surcouche : sans elles, la descente échoue en silence (sortie redirigée) ;
  vérifier `docker ps -a` et `docker volume ls` après. (4) Un heredoc de plus de cent lignes avec des apostrophes et
  des antiquotes échoue au découpage (« unexpected EOF ») : script Python écrit par l'outil d'écriture. (5) Un mutant
  peut être équivalent sur le chemin employé (ancre « état d'après » au lieu d'« état d'avant » avec `$max`) : le
  dire, le remplacer par une mutation qui compte.

- **STORY-1051** : (1) **quatre suites e2e de `notification` sont rouges sur `dev` avant 1051** (témoin rejoué :
  `appel-de-service`, `envois`, `rail-notification` — le banc n'a pas `UtilisateurModel`, ajouté à `EnvoisService` par
  STORY-651 — et `health` — le faux client Kafka n'a pas `admin.listTopics`, depuis STORY-957) : 68 tests rouges des
  deux côtés ; à réparer dans une story de D (dette héritée), pas à confondre avec une régression. (2) Sous jest, un
  `foo.ts` et un `foo.json` dans le même dossier : `import … from './foo'` résout le JSON (ordre `js, json, ts`) ; d'où
  `garde.ts` pour la copie de C. (3) La garde « une seule porte de service » (`appel-de-service.invariant.spec.ts`), la
  garde de suppression complète (toute collection à `organizationId` dans `COLLECTIONS_A_SUPPRIMER`) et le relevé des
  consommateurs supervisés rougissent sur un ajout légitime : les inventorier, avec le motif. (4) L'image `runtime` pose
  `NODE_ENV=production`, qui refuse `RECETTE_HORLOGE_AVANCE_JOURS` : une pile de recette pose `NODE_ENV=staging`. (5)
  `docker run node … /chemin` sous Git Bash : `MSYS_NO_PATHCONV=1` aussi devant `docker create`. (6) `npm run
  test:conformite` complet sur la pile reste bloqué (les autres suites visent des hôtes par défaut `127.0.0.1`) :
  jouer la suite visée par chemin. (7) Un BullMQ `promote()` d'une relance trop tôt la replace à son échéance
  (`moveToDelayed`) : c'est la preuve que rien ne part avant l'intervalle.

- **STORY-1050** : (1) un `docker run … sh -c '… | grep …' | tail` ne montre rien tant que tout n'est pas fini : écrire
  la sortie dans un fichier et le lire ; une suite d'intégration qui casse au montage du module (dépendance Nest
  manquante dans le banc HTTP) ressemble alors à un blocage. (2) Le banc HTTP (`application-http.ts`) prend les
  fournisseurs de `ReseauModule` : tout fournisseur neuf du module dont la dépendance vient d'un module global du socle
  (ici `SuitesDeLIdentite`) doit y être fourni aussi. (3) Une mutation qui laisse une variable inutilisée échoue à la
  compilation (ts-jest) : la tourner pour garder le symbole employé. (4) `git checkout -- <fichier>` pour défaire une
  mutation jouée sur un fichier **non commité** défait aussi le vrai changement : muter seulement après le commit. (5)
  Deux écritures concurrentes sur une ligne absente : l'upsert conditionnel perd le plus récent sur la clé dupliquée ;
  rejouer une fois. (6) Dans une transaction MongoDB, pas de `Promise.all` de lectures sur la même session.

- **STORY-1049** : (1) un banc HTTP monté sur `monterSurMongo` se ferme **base d'abord** (`dropDatabase`, puis
  `app.close()`) : fermer l'application ferme la connexion, et un `dropDatabase` posé ensuite reste en attente pour
  toujours (la suite ne finit pas, `Test suite failed to run` au `afterAll`). (2) Sous MongoDB, deux transactions qui
  écrivent le même document se gênent d'elles-mêmes (conflit d'écriture, la seconde est rejouée par
  `withTransaction`) : une mutation qui retire seulement la condition de révision **survit** ; le verrou se prouve en
  sortant l'incrément de la transaction. (3) `MSYS_NO_PATHCONV=1` aussi devant `docker run -v …:/mutations`, sinon
  Git Bash réécrit le chemin du conteneur.
- **STORY-1048** : (1) un script de mutations qui compte les `✕` ne voit rien quand jest joue plusieurs suites (pas de
  détail par test) : lire `Tests: N failed` et l'absence de `Test suite failed to run`. (2) Les routes d'administration du
  LC fictif passent la garde du module : sur une pile sans catalogue, publier le droit sur `entitlement.changed` par
  `kafka-console-producer.sh` du conteneur Kafka (`orgId`, `moduleCode: assureur-fictif`, `status: ACTIVE`,
  `occurredAt`, `eventId`) ; deux services sur le même groupe de consommateurs se partagent le message. (3) Un pilote
  qui écrit dans le volume d'échange tourne sous l'uid du service (`--user 1000:1000`), sinon le LC ne peut plus créer
  `entree`. (4) `AUTH_ISSUER` et `AUTH_AUDIENCE` sont exigées par `validateEnv` (un `docker run` sans elles sort en 1).

- **Prettier réécrit une copie « à l'octet »** si on lui passe le dossier : STORY-1046 l'a fait sur les schémas C13
  copiés, aussitôt recopiés ; `.prettierignore` de `prospera-assureur-fictif` les exclut désormais
  (`src/modules/*/instance/contrat/*.schema.json`). Toujours revérifier les empreintes après un `prettier --write`.
- `node --test` sous Node 24 (plateforme) résume en `ℹ tests 513 / ℹ pass … / ℹ fail 0`, pas en `# tests` : un `grep`
  sur l'ancien format ne trouve rien et casse la chaîne de commandes.
- Une pile du LC fictif sans auth-service : un petit émetteur RS256 (JWKS + `/jeton?identite=MOTEUR&org=…`) sur le
  réseau `grp-d_default`, et `AUTH_JWKS_URI` pointé dessus ; `publicKey` de `generateKeyPairSync` est déjà un
  `KeyObject` (pas de `createPublicKey` dessus).
- **Verrou Docker du poste** (`MoneyVibes_Apps\.verrou-docker`, une ligne : groupe, story, heure) : B l'a adopté sur ce
  poste ; D le prend avant toute pile ou image et le rend après `down -v`. Une attente de B (STORY-942) a duré ~30 min :
  D a avancé 1033 → 1035 sur des branches empilées pendant ce temps, puis a tout prouvé et fusionné d'une traite.

- Le poste de D est **partagé avec B** (piles `grp-b`) : toujours `docker compose -p grp-d …`, jamais un `down` sans
  `-p` ; ne jamais écrire dans les copies de travail de B (`_wt-b-stories`, `prospera-plateforme`).
- Un JSON écrit par heredoc perd ses antislashs (`"^.+\.(t|j)s$"` de `jest-int.json`) : outil d'écriture seulement.

- Poste de D : Node 25 en local. Le client Kafka de Confluent est natif : les tests se jouent dans le stage
  `verification` du `Dockerfile` (Node 24), `npm ci --ignore-scripts` suffit en local pour `tsc` et le lint.
- Plateforme sous Node 24 sans toucher au `node_modules` du poste :
  `git -c core.autocrlf=false archive HEAD | docker run --rm -i node:24-slim sh -c 'mkdir /w && cd /w && tar -x && npm ci && npm run typecheck && npm test'`
  (sous le verrou ; un test de B y est ignoré : la matrice du catalogue n'est pas dans le conteneur).
- AD-20 ne nomme que quelques exceptions (« les faits que les spines fixent font foi ») : avant de déclarer un nom
  « hors catalogue », chercher sa source (spines, PRD des verticales, `git grep` dans `prospera-paiement-service`).
  STORY-1045 : 25 noms des manifestes en avaient tous une.
