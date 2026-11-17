# STORY-956 : `kit-cible` 1.0.1 ; le README et les scripts racines de la plateforme avec `encours/`

Status: done

**Complexité :** moyenne (trois défauts du kit, une suite publiée élargie, une entrée de dossier dans les fichiers racines)

**Épic :** EPIC-161 (le kit des cibles)
**Dépôts :** `MoneyVibesGroup/prospera-plateforme` (`bibliotheques/kit-cible/`, `contrats/reprise/`, scripts, README et
fichiers racines)
**Plage :** groupe B, n° 1 du lot 3 (`coordination/PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §3, ligne 956 ; D-L3-5).
**Jalon :** étiquette `kit-cible-v1.0.1` **avant le 04/12**. Débloque D-1047 (README) et D-1055 (kit 1.0.1).

---

## Pourquoi

La relecture de `kit-cible` 1.0.0 par A (`coordination/relecture-kit-cible-1.0.0-groupe-A.md`) conclut : **une 1.0.1
est nécessaire, modeste**. Trois défauts de correction :

- **D1** : une clé d'origine en double dans un lot perd une ligne en silence. En `SIMULER`, le kit rend
  `[CREE, MODIFIE]`, en `APPLIQUER` `[CREE, CREE]`, et la seconde ligne n'est jamais écrite ;
- **D2** : les messages de refus sortent du contrat (environ 32 000 caractères pour 500 objets, quand `refus-reprise`
  plafonne `message` à 1 024 et la `raison` d'un résultat à 512) ;
- **D3** : `montantsRequis` et `etats` sont déclarés, mais le kit ne les applique jamais. « Jamais de zéro » (FR-7)
  repose donc sur le `juger` de chaque module.

Il y a aussi des trous dans la suite de conformité que `pdv` jouera : le cloisonnement par organisation, l'atomicité,
les cas couverts par les seuls tests du témoin, et la route `controles`.

D-L3-5 : le dossier `encours/` de D (EPIC-225) entre dans `prospera-plateforme`. B l'ajoute au README et aux scripts
racines, comme pour les dossiers de C et de D au lot 2 (STORY-941).

## Ce qui doit être vrai à la fin (plan du lot 3, §3, ligne 1)

| Exigence | Fait |
|---|---|
| D1 : clé en double = refus nommé, le même en SIMULER et APPLIQUER | oui : 422 `CLE_EN_DOUBLE` sur la requête, corps identique dans les deux modes, rien d'écrit (reproduction de A comprise) |
| D2 : messages plafonnés à 1 024 (`message`) et 512 (`raison`, `erreurs[].message`) | oui : dans `RefusRequete` (tout refus) et pour toute `raison` ; 500 objets de régime inconnu → message de 1 024 |
| D3 : `montantsRequis` et `etats` appliqués par le kit | oui : 422 `SCHEMA_NON_CONFORME` ; état retenu hors circuit → `REFUSE_PAR_LA_CIBLE` ; le témoin n'écrit plus la règle |
| La suite publiée couvre le cloisonnement, l'atomicité, les cas du témoin et `controles` | oui : 22 cas (13 à la 1.0.0) |
| `kit-cible` 1.0.1, étiquette `kit-cible-v1.0.1` poussée avant le 04/12 | oui : plateforme #22, `189183f` sur `dev`, étiquette posée et poussée le 17/11 |
| `encours/` dans le README et dans les scripts `test` et `typecheck` | oui : motifs posés d'avance (D-956-6), garde des scripts racines |
| Preuves : tests (Node 24), lint des fichiers touchés, typecheck, build de la distribution, mutations des corrections | oui (ci-dessous) |
| « ⚠ Contrats » du journal B avant la fusion ; A prévenu (relecture de la 1.0.1) ; D prévenu (README) | oui : annonce fusionnée avant le code (stories #580) ; « → A » et « → D » au journal de B |

## Décisions (prises par défaut, contestables)

- **D-956-1 : D1 donne un refus de REQUÊTE, 422 `CLE_EN_DOUBLE`.** Le kit ne retient pas la règle « la dernière
  l'emporte ». Une clé (`cleOrigine` ou alias) portée par deux lignes de la même requête refuse la requête entière,
  avant le schéma d'objet. Rien n'est jugé, rien n'est écrit, et le corps est le même en `SIMULER` et en `APPLIQUER`.
  `erreurs` donne chaque ligne fautive (`index`, `chemin` `/objets/<i>/cleOrigine` ou `/objets/<i>/alias/<j>`) et la
  première ligne qui portait la clé. La raison : fusionner relève de la Reprise, sous contrôle (FR-12), et la spine dit
  « jamais de fusion côté cible » (AD-9). Une ligne dont un alias répète sa propre `cleOrigine` reste admise, puisqu'elle
  ne désigne qu'un objet. **Contrat** : un code de requête de plus, `CLE_EN_DOUBLE`, dans `refus-reprise@1`. Le champ
  `code` est un motif et non une liste fermée, donc c'est un ajout. Hors du périmètre : le même `(lotId, versionLot)`
  rejoué dans une AUTRE requête rend le résultat gardé sans comparer le contenu (D7 de la relecture, conforme à AD-4).
- **D-956-2 : D2 se plafonne dans le kit, à un seul endroit par forme.**
  - Le constructeur de `RefusRequete` borne `message` à 1 024, `erreurs[].message` à 512, `erreurs[].chemin` à 256 et
    `erreurs` à 100. Tous les refus y passent, y compris un refus de garde ou un refus levé par un module.
  - La `raison` d'un résultat d'objet est bornée à 512 (refus, requalification, verdict différent).
  - Les bornes se comptent en points de code, comme `maxLength`. Un texte coupé finit par « … ».
- **D-956-3 : D3 suit la règle de la spine.**
  - Un montant requis absent est un écart de schéma, de la même famille que `CHAMP_OBLIGATOIRE_ABSENT` (spine de la
    Reprise, l. 128). Un champ de `montantsRequis` absent (ou `null`) que la ligne ne marque pas dans `montantsASaisir`,
    ou une valeur de `champEtat` hors de `etats`, refuse donc la **requête** : 422 `SCHEMA_NON_CONFORME`, avec
    `index` et `chemin` (`/objets/<i>/champs/<champ>`), le même en `SIMULER` et en `APPLIQUER`. C'est déjà le
    traitement d'un régime non admis.
  - Un `etatRetenu` rendu par le `juger` du module hors de `etats` vient d'un défaut du module. Le kit ferme :
    l'objet est `REFUSE` / `REFUSE_PAR_LA_CIBLE`, avec la raison.
  - Aucun code d'objet n'est ajouté à `reponse-reprise@1`.
  - Au démarrage, un montant requis déclaré `required` dans le schéma est refusé (`DeclarationInvalide`). Absent, il
    doit pouvoir se marquer « à saisir ».
- **D-956-4 : l'atomicité se prouve par une panne fournie par la suite.** La suite exporte `PanneDeConformite` :
  le banc du module enveloppe ses raccords (`panne.envelopper(raccord)`), et la suite arme une panne qui fait lever la
  2ᵉ écriture de fiche d'un `APPLIQUER`. Elle vérifie ensuite que rien n'est resté : ni clé, ni fiche atteignable, ni
  résultat, ni version du lot. **Le cas est exigé** : un banc sans `panne` le fait échouer, avec un message qui le
  dit. Aucun module n'a encore embarqué la 1.0.0 (D-1055 sera le premier, sur la 1.0.1).
- **D-956-5 : les cas du témoin passent dans la suite publiée.** Les cas génériques sont joués par tout module :
  `rattacherA`, `OBJET_INCONNU`, la majeure différente et le corps de plus de 1 Mio. Les cas propres au module passent
  par deux entrées facultatives du profil :
  - `circuit` : `REQUALIFIE`, `REFUSE_PAR_LA_CIBLE`, et l'état hors du circuit ;
  - `regimeNonAdmis`.
  Un profil qui ne les donne pas voit ces cas nommés par `casSansObjet`.
- **D-956-6 : `encours/` n'existe pas encore sur `origin/dev`.** Les motifs sont posés d'avance, comme `series/`,
  `vocabulaires/` et `contrats/distributeur/` au lot 2 : `encours/test/**/*.test.ts` dans `npm test` (`node --test`
  ignore un motif sans fichier), `encours/**/*.ts` dans le typecheck. La garde `test/scripts-racines.test.ts` compte
  `encours` parmi les dossiers de D lus « même avant d'exister ». D-1047 n'a donc besoin d'aucune PR de B.
- **D-956-7 : D4 à D8 de la relecture restent ouverts** (hors de la ligne 956 du plan).
  - D4 (deux `APPLIQUER` concurrents, E11000) se traitera avant que `pdv` s'appuie sur la concurrence.
  - D5 à D8 sont notés au journal de B.

## Ce qui a été livré (plateforme #22, `189183f` sur `dev`, étiquette `kit-cible-v1.0.1`)

1. **Le kit** (`bibliotheques/kit-cible/src/`) :
   - `cible.ts` : refus `CLE_EN_DOUBLE` avant le schéma d'objet ; montants requis et état du circuit dans la
     vérification du schéma ; état retenu hors circuit refusé ; `raison` bornée ;
   - `types.ts` : `BORNES`, `borner` ; `RefusRequete` borne tout corps de refus ;
   - `schema-objet.ts` : montant requis `required` refusé au démarrage.
2. **Le contrat** : `CLE_EN_DOUBLE` dans `refus-reprise@1` et dans les deux OpenAPI (générés par
   `npm run contrats:reprise`).
3. **La suite publiée** (`conformite.ts`) : 22 cas, et `PanneDeConformite` / `ErreurDePanne`. Le profil gagne
   `circuit` et `regimeNonAdmis`. La cible témoin les déclare tous les deux ; sa `commande` n'applique plus le montant
   requis, son état n'est plus fermé par un `enum`, et sa surcharge `valeursDeControle` écrit exprès.
4. **La distribution** régénérée (`npm run kit:distribuer`, version 1.0.1 dans `EMPREINTES.json`).
5. **Les fichiers racines** : `encours/` au README, dans `npm test`, dans le typecheck et dans la garde
   `test/scripts-racines.test.ts`.

## Preuves

- **Node 24** (`node:24-slim`, export LF du commit, sous le verrou, projet `grp-b`) :
  - `npm ci` ✔, `npm run typecheck` ✔ (ESM et CommonJS) ;
  - `npm test` : **490 passés, 0 échec, 1 sauté** (la matrice du catalogue, absente du conteneur, comme à 947) ;
  - la suite sur **MongoDB 8.0 en jeu de répliques** : **23/23** (les 22 cas, plus l'index unique sous deux
    transactions concurrentes). `SIMULER` de 500 objets : 5,2 s ; chaîne de 600 objets : 19 s ; cloisonnement et
    atomicité verts sur un vrai MongoDB.
- **Après le rebase sur `dev`** (D-1045 fusionnée entre-temps, dossiers disjoints) : typecheck ✔, `npm test`
  **513/513** (Node 25).
- **Mutations**, chacune rouge sur une assertion :
  - `test/mutation.test.ts` : **25** (15 de la 1.0.0 + 10 de la 1.0.1). Ces 10 couvrent D1 (clé, alias), D2
    (message, erreurs, raison, raison de requalification) et D3 (montant requis, état, état retenu, montant
    `required`) ;
  - `test/mutation-conformite.test.ts` : **29** jouées par la suite publiée (15 + 14). Les 14 couvrent D1, D2, D3
    (montant, état), `rattacherA`, `controles` qui écrit, 1 Mio, régime non admis, saisie sur un historique, valeur
    saisie hors schéma, l'atomicité perdue (le magasin garde ce qu'une transaction en échec a écrit) et trois fuites
    de cloisonnement (version du lot, résultat d'idempotence, fiche lue dans toutes les organisations).
- **Lint** : le dépôt n'a ni ESLint ni Prettier ; le contrôle statique est le typecheck strict, comme à 947.
- **Fins de ligne** : `git diff --stat` et `--ignore-cr-at-eol` identiques avant le commit.

## Pour la suite

- **D-1055** (import réseau par la Reprise) et tout module cible copient la distribution à `kit-cible-v1.0.1`.
  Leur banc fournit `panne` et enveloppe chaque raccord.
- **A** relit la 1.0.1 (journal de B, « → A »).
- **D-1047** peut créer `encours/` sans PR de B.
- **Restent ouverts** (D-956-7) : D4 (deux `APPLIQUER` concurrents du même lot, E11000 rendu en 500 au lieu d'un
  rejeu ; à traiter avant que `pdv` s'appuie sur la concurrence), D5 (`saisirMontant` ne type pas sa demande), D6
  (version de lot par `lotId`), D7 (même `(lotId, versionLot)` rejoué avec un autre contenu), D8 (`provenance.lotId`
  non confronté, clé non NFC). Et la copie de la garde dans la distribution (`239ebe7c…`) diffère de celle de
  paiement (`a830c449…`).
