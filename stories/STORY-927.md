# STORY-927 : Le jeu de démonstration du cabinet (`jeu-demonstration@1`, données seules)

Status: done

**Complexité :** petite à moyenne (un dossier de données, un générateur à graine fixe ; aucun code de service)

**Épic :** EPIC-160 (le contenu des jeux de démonstration, un par verticale), EPIC-147 (l'essai prospect)
**Dépôt :** `MoneyVibesGroup/prospera-plateforme` (PR **#25**, `dev` **`e958bd6`**), dossier `jeux-demonstration/cabinet-demo-togo/`
**Plage :** groupe A, n° 8 du lot 3 (`coordination/PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §2). Source : STORY-953 (B, contrat
`jeu-demonstration@1`, `contrats-instance-v1`) et la demande « → A, C, D (2026-11-16) : le contrat du jeu de démonstration
est publié » du journal de B. Fiche écrite avant le push, après la lecture du contrat, du vérificateur et des services.
**Suite :** STORY-928 (les routes C13 d'import et d'effacement dans balance et bilan).

---

## Ce que le contrat demande, et ce qui existait

- Un jeu est un **dossier** : `jeu.json` (code, version, verticale, titre, `generateur` éventuel, une part par module dans
  l'ordre d'import, par objet un fichier, son nombre d'enregistrements et son sha256) et des fichiers de données (un
  tableau JSON d'objets). `npm run jeu:verifier -- <dossier>` contrôle le contrat, les empreintes et les nombres.
- Le plan du lot 3 donne à A **les données seules** dans `prospera-plateforme`, dépôt tenu par B : un dossier de plus, ni
  script, ni contrat, ni README, ni `package.json`.
- **Il n'existe aucun schéma d'objet pour balance ni pour bilan** (`contrats/objets/` ne contient qu'un `.gitkeep` ;
  les deux manifestes déclarent `objetsDeReprise: []`). Le « format du schéma d'objet du module » est donc celui que les
  services portent déjà ; il est fixé ci-dessous (D-927-3) pour que STORY-928 le serve sans le redécouvrir.
- Le dossier du client (la société) n'est pas un module : `dossier-service` est du socle, sans manifeste ni route C13.

## Décisions (recommandations appliquées, contestables)

- **D-927-1 — Le jeu porte le module `balance` seul ; `bilan` n'a rien à y mettre.** Le bilan n'ingère que des soldes : il
  calcule ses états à la demande depuis la balance validée (`balance.created`, décision D14). Ce qu'il tient en propre
  (jeux d'états, hypothèses du prévisionnel, ajustements de rattachement) est dérivé ou lié à des identifiants de jeux
  d'états qu'un fichier statique ne peut pas porter : l'inventer serait fabriquer un format de bilan. Un jeu n'exige pas
  qu'un module y figure (une part par module **qui a des objets**). En 928, la route d'import de `bilan` répond donc
  « rien à importer » et sa route d'effacement efface ce qu'il a calculé ; le bilan de la démonstration se produit **à
  partir de la balance importée et validée**.
- **D-927-2 — Le dossier (la société) vit dans la part `balance`, comme objet `profil-societe`.** Le profil société
  (identité, forme juridique, capital, actionnaires, dirigeants, et les deux axes) est déjà à `balance-service`
  (`profil.societe.consolide`, droit `balance:profil:administrer`). Il passe **avant** les balances (une dépendance avant
  son dépendant). Les enregistrements portent `dossierRef` (`DEMO-NEGOCE-TOGO`), la clef du dossier **dans le jeu** : la
  partie A ne connaît pas l'identifiant du dossier à l'avance, et STORY-928 le résout (voir « Pour STORY-928 »).
- **D-927-3 — Formats : ceux des services.**
  - `profil-societe` : le corps de création du profil de `balance-service` (`CreerProfilSocieteDto` : `raisonSociale`,
    `sigle`, `formeJuridique`, `nif`, `rccm`, `numeroCnss`, `dateCreation`, `pays`, `devise`, `objetSocial`, `codeNaema`,
    `secteur`, `capitalSocial` en unités mineures, `actionnaires`, `adresse`, `email`, `telephone`, `dirigeants`) +
    `dossierRef` + `systemeComptable` (`SN`) et `regimeFiscal` (`REEL`), que le DTO d'écriture refuse (déterminés par
    STORY-080) : ils décrivent la **décision d'axes** du dossier de démonstration, à poser par l'import, pas par le DTO.
  - `balance` : l'objet `balance` de `balance.submitted` v1 (`docs/schemas/balance.submitted.v1.schema.json`), **sans**
    `orgId` ni `dossierId` (posés par la partie A et par la résolution de `dossierRef`), avec `dossierRef` : `exercice`
    (`debut`, `fin` ISO), `source: "direct"`, `referentiel: "SN"`, `devise: "XOF"`, `version: 1`, `lignes` aux quatre
    colonnes (`mouvementDebit`, `mouvementCredit`, `soldeDebiteur`, `soldeCrediteur`, entiers en unités mineures XOF),
    `niveauPreuve: "fichier"`, `checksum` = sceau v2 de `balance-service` (sha256 de `{ exercice, source, referentiel,
    version, lignes triées par compte }`), recalculé par le générateur selon `balance.checksum.ts`. Un enregistrement
    est **une balance entière** (lignes embarquées), pour que son sceau reste atomique.
- **D-927-4 — Un client fictif, sans rien de réel.** « DÉMO NÉGOCE TOGO SARL », négoce de quincaillerie, Lomé ; NIF
  `DEMO-0000001`, RCCM `TG-DEMO-2019-B-00001`, CNSS `DEMO-000001` (formats qui passent les gardes de saisie du profil et
  sont manifestement faux) ; associés « DEMO Akouvi » et « DEMO Komla » ; e-mail en `.invalid` ; téléphone
  `+228 00 00 00 01` ; adresse déclarée fictive.
- **D-927-5 — Deux exercices clos, 2024 et 2025, à la même version 1.** De quoi comparer un exercice à son précédent (le
  bilan comparatif). 2025 s'ouvre sur la clôture de 2024 **après** affectation du résultat au report à nouveau (la réserve
  légale est déjà à son plafond de 20 % du capital). Balances « générales » : `source: direct`, aucune `origine`.
- **D-927-6 — Comptes : ceux du plan SYSCOHADA révisé 2.3 du paquet de `balance-service`**, au niveau de détail 3 à 4
  chiffres, tous rattachés au plan par préfixe et tous couverts par la table de passage (les amortissements `2844` et
  `2845` suivent la règle `NET_ACTIF` de leur compte d'immobilisation). Les comptes de classe 2 à 5 qui sont d'un seul sens
  portent un solde net d'un seul côté (jamais deux soldes).
- **D-927-7 — Le générateur est dans le dossier du jeu**, `generateur/generer.mjs` (JavaScript sans dépendance, hors du
  typecheck et des tests racines : aucun fichier de B touché). `source` du `generateur` le nomme à l'étiquette
  **`jeu-cabinet-v1`** ; l'étiquette est à poser par B (je n'en crée pas dans son dépôt). Même graine, mêmes octets.
- **D-927-8 — La graine est `20270115`** (la date de l'essai), paramètres `premierExercice: 2024`, `exercices: 2`,
  `referentiel: "SN"`. La graine ne fait varier que de petits écarts (±3 à 5 %) sur des montants de départ choisis à la
  main ; la structure comptable est fixe.

## Le jeu livré

`jeux-demonstration/cabinet-demo-togo/` — `cabinet-demo-togo@1.0.0`, verticale `CABINET`.

| Part (module) | Objet | Fichier | Enregistrements | sha256 |
|---|---|---|--:|---|
| `balance` | `profil-societe` | `balance/profil-societe.json` | 1 | `d857ba6d97592ce772d36cce3aecd0f923adfbfe6adae822321146efddfcbffa` |
| `balance` | `balance` | `balance/balance.json` | 2 (2024, 2025 ; 36 lignes chacune) | `32a8f1806a5bc08dc6c4a5fffab24afcd9b205fc3c6b9fb3442ee041f5cbab41` |

`jeu.json` : sha256 `21416d732d88f33497051ef4ecf4395004384442fbaf77241cc2ae23a50ffd80` (1 142 octets).

Le contenu, en bref (milliers de XOF, soldes) :

| | 2024 | 2025 |
|---|--:|--:|
| Ventes de marchandises (701) | ≈ 265 300 | ≈ 282 800 |
| Résultat avant impôt (impôt à 27 %) | ≈ 16 800 | ≈ 17 000 |
| Résultat net | ≈ 12 250 | ≈ 12 400 |
| Capitaux propres avant résultat (101, 111, 121) | 26 500 | 38 750 |
| Emprunt (162) | 15 000 | 12 000 |
| Banque (521) | ≈ 21 000 | ≈ 26 900 |

Les balances sortent d'un petit grand livre de démonstration (à-nouveaux, ventes à 18 % de TVA, achats, services avec
TVA déductible, paie à 17,5 % de charges patronales et retenues salariales, règlements, investissement de l'année,
amortissements, emprunt à 9,5 %, TVA nette, impôt sur les bénéfices) agrégé par compte : **équilibrées par construction**
(Σ mouvements débit = Σ mouvements crédit ; Σ soldes débiteurs = Σ soldes créditeurs), avec `soldeDébiteur − soldeCréditeur
= mouvementDébit − mouvementCrédit` sur chaque ligne et trésorerie jamais négative.

## Preuves

- `npm run jeu:verifier -- jeux-demonstration/cabinet-demo-togo` : `cabinet-demo-togo@1.0.0 (CABINET) : conforme,
  1 part(s), 3 enregistrement(s).` Idem sur un `git -c core.autocrlf=false archive` extrait (aucun CR dans les fichiers).
- Jeu témoin de B : `temoin@1.0.0 (TEMOIN) : conforme, 1 part(s), 5 enregistrement(s).` ; `test/contrats-instance.test.ts`
  17/17.
- Rejouer la génération (`node …/generer.mjs <dossier>`) rend les mêmes trois empreintes, à l'octet.
- Contrôles hors dépôt (script jetable) : chaque balance validée contre le schéma `balance.submitted` v1 (à `dossierRef`
  près) ; chaque compte rattaché au plan 2.3 par préfixe et à ≤ 6 chiffres.
- `npm test` et `npm run typecheck` racines : **le dossier n'y est pas ramassé** (pas de `.ts`, pas de `test/`), donc rien
  à rejouer ; les motifs de `tsconfig.json` et de `package.json` ne le voient pas.
- Pas de Docker (données seules).

## Pour STORY-928 (balance, bilan)

1. **Importer `profil-societe` avant `balance`** (ordre des parts et des objets). La route d'import de `balance` crée le
   profil de l'organisation et pose la décision d'axes du dossier de démonstration (`SN`, `REEL`).
2. **`dossierRef` → `dossierId`** : le jeu ne porte aucun identifiant de dossier. L'import de `profil-societe` doit
   obtenir (ou créer) le dossier de démonstration de l'organisation et retenir `dossierRef → dossierId` ; l'import de
   `balance` le lit. Si `dossier-service` n'expose pas de création appelable par le moteur, c'est à nommer (ticket), pas à
   contourner ici.
3. **Une balance importée est un `balance.submitted`** : `orgId` posé par la partie A, `checksum` inchangé (hors `orgId` et
   `dossierId`, qui n'entrent pas dans le sceau), `occurredAt` de l'import, `eventId` dérivé de la clef d'idempotence. Le
   hub la reçoit à l'état `BROUILLON` : la démonstration doit la **valider** pour que `balance.created` parte au bilan.
4. **`bilan`** n'a pas d'objet dans le jeu (D-927-1) : l'import ne fait rien et répond sans enregistrement ; le bilan se
   calcule de la balance validée.
5. L'effacement efface tout ce que le module tient de l'organisation : balances, profil, et pour le bilan ses jeux d'états
   calculés (accusé `EFFACE`, puis `DEJA_EFFACE`).

## Modules du cabinet hors jeu

| Module | Pourquoi |
|---|---|
| `bilan` | rien de stocké à importer : états dérivés de la balance validée (D-927-1) ; routes C13 en 928 |
| `fiscal` (déclarations) | pas de route C13 en février ; le paquet fiscal vient du catalogue ; `SANS_ROUTE` au certificat |
| `dossier` | socle, pas un module commercial ; le dossier est créé à partir de `profil-societe` (D-927-2) |
| `consolidation`, `conseil`, `ged`, `expertises`, autres | pas de route C13 en février ; `SANS_ROUTE` s'ils sont installés, à n'y laisser que s'ils ne gardent rien de l'organisation (à vérifier au moment de la mise en service) |

## Écarts et dettes

- L'étiquette `jeu-cabinet-v1` n'existe pas encore (demande à B).
- Le « Qui écrit dans quel dossier » du README de B ne nomme pas `jeux-demonstration/cabinet-demo-togo/` (groupe A) ; même
  remarque que pour le jeu de l'assurance, groupe D (demande à B).
- Le catalogue de l'espace d'essai lit `JEUX_DEMONSTRATION_DIR` : le dossier `generateur/` à côté des fichiers de données
  est ignoré par le vérificateur ; si le catalogue copie tout le dossier dans l'image, il copie aussi le générateur
  (quelques Ko, inoffensif).
