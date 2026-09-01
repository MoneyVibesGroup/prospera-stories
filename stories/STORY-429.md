# STORY-429 : Le sens « −/+ » des quatre postes de variation de stocks n'est pas publié — le front ne peut le rendre qu'en codant en dur le référentiel

Status: done

**Épic :** EPIC-010 — États financiers (`bilan-service`)
**Service :** `bilan-service` (`:3004`) — paquet référentiel + `dto/compte-resultat-response.dto.ts`
**Points :** 2 · **Sprint :** à slotter
**Origine :** maquette **FE-032**, 2026-08-27.

---

## Le fait

Le formulaire du compte de résultat porte une **colonne de sens** — `+`, `−`, ou **`−/+`** — et
elle n'est pas décorative : elle dit ce que la ligne **fait au résultat**, ce qu'un montant seul
ne dit pas.

Quatre postes y portent **`−/+`**, parce que leur sens s'inverse d'un exercice à l'autre :

| poste | libellé | comptes |
|---|---|---|
| `RB` | Variation de stocks de marchandises | `6031` |
| `RD` | Variation de stocks de matières premières et fournitures liées | `6032` |
| `RF` | Variation de stocks d'autres approvisionnements | `6033` |
| `TE` | Production stockée (ou déstockage) | `73` |

Le contrat ne publie que `sens: 'PRODUIT' | 'CHARGE'`, qui vaut `CHARGE` pour `RB`/`RD`/`RF` et
`PRODUIT` pour `TE` — dans les deux cas un signe **fixe**. Le `−/+` n'en est **pas dérivable**.

## Ce n'est pas théorique

Sur le jeu d'essai de FE-032, `RB` vaut **+250 000** en 2025 (le stock a monté ⇒ la charge est
négative) et **−120 000** en 2024 (déstockage). Une colonne qui afficherait `−` en tête de ces
deux lignes serait **fausse une année sur deux**, et le montant seul ne rattrape pas : un
lecteur pressé lit « charge » et se demande pourquoi elle est positive.

## Pourquoi le front ne peut pas s'en tirer seul

Coder `['RB','RD','RF','TE']` dans l'écran, c'est inscrire **la structure SYSCOHADA dans le
frontend** — exactement ce que l'invariant **P7** protège partout ailleurs dans ce module
(« *aucune structure de CR ni convention comptable codée en dur* »). Le jour où un cabinet est
octroyé en `sfd-bceao@2.0`, la liste devient fausse et **rien ne le dit**.

---

## Critères d'acceptation

- [x] AC-1 — `MappingRule` gagne un champ optionnel `sensAffichage: '+' | '-' | '-/+'`,
      **donnée du paquet**, distinct de `regle` (qui reste la règle de **calcul**).
- [x] AC-2 — `PosteResultat` publie `sensAffichage`, repris du paquet ; à défaut, dérivé de
      `regle` (`PRODUIT` → `+`, `CHARGE` → `−`) pour rester rétro-compatible.
- [x] AC-3 — Le paquet `syscohada-revise` marque `-/+` sur `RB`, `RD`, `RF`, `TE`. Les postes
      `TF` et `TG`, laissés **sans marque** sur le formulaire officiel, portent leur sens dérivé
      (`+`) : la maquette a tranché en faveur de la lisibilité, et la story le documente plutôt
      que de reproduire un blanc du formulaire.
- [x] AC-4 — `sfd-bceao@2.0` ne déclare aucun `sensAffichage` ⇒ tous dérivés, **aucune
      régression** (agnosticisme P7).
- [x] AC-5 — Test : `RB` avec un solde **créditeur** rend `montantN < 0` **et**
      `sensAffichage: '-/+'` ; le même poste avec un solde débiteur rend `montantN > 0` et le
      même `sensAffichage`. La marque ne dépend pas du millésime — c'est tout son intérêt.

## Vigilance

- ⛔ **Ne pas faire dépendre `sensAffichage` du signe du montant.** C'est une propriété du
  **poste**, pas de l'exercice : une marque qui bascule d'un exercice à l'autre serait illisible
  et ferait diverger deux liasses du même dossier.
- ⚠️ La **présentation en négatif** des charges est une décision d'écran (le contrat les rend
  positives, `montant = Σ débit − crédit`) : cette story ne la change pas.

## Conséquences ailleurs

- **FE-032** rend la colonne aujourd'hui en codant les 4 codes en dur, et **l'écrit à l'écran**.

---

## ⛔ LA FICHE SE CONTREDIT SUR LE SIGNE — et c'est le jeu d'essai FE-032 qui est du mauvais côté

> « `RB` vaut **+250 000** en 2025 (le stock a monté ⇒ la charge est **négative**) »

Les deux moitiés de la phrase s'excluent. **L'AC-5 tranche dans l'autre sens** (« solde
**créditeur** ⇒ `montantN < 0` ») et **le code suit l'AC** — c'est la convention SYSCOHADA :
`6031` crédité (le stock monte) ⇒ `montant = Σ débit − crédit = −250 000`. Mesuré en docker.

⚠️ **Conséquence pour le front, à relayer** : si le jeu d'essai de **FE-032** porte réellement
`+250 000` pour un exercice où le stock a monté, il est de **signe opposé** à ce que le
service renvoie — l'écran validerait sa colonne `-/+` sur des montants qui ne viendront
jamais. Aucune ligne de code à changer côté service.

---

## Progress Tracking

**Statut : `done`** — implémentée, validée, revue (code + sécurité), **vérification docker
réelle rejouée sur l'état final**, **DEUX PR rebase-mergées ensemble** : `bilan-service`
**#59** et `balance-service` **#85**.

### Ce qui est livré

- **AC-1** — `MappingRule.sensAffichage?: '+' | '-' | '-/+'`, **donnée du paquet**, distincte
  de `regle` (règle de **calcul**). Champ additif émis **en dernier** : toute ligne non
  marquée reste byte-identique, et **3 des 5 artefacts n'ont pas bougé** (`sfd@1.0`,
  `sfd@2.0`, `cima@1.0`) — la discipline est mesurée, pas affirmée.
- **AC-2** — `PosteResultat` le publie **toujours** : du paquet, sinon dérivé de `sens`.
- **AC-3** — quatre postes marqués `-/+` : `RB` (6031), `RD` (6032), `RF` (6033), `TE` (73).
  `TF`/`TG`, blancs du formulaire, portent leur sens dérivé `+`.
- **AC-4** — `sfd-bceao@2.0` n'en déclare aucun : tout dérivé, aucune régression.
- **AC-5** — `RB` garde `-/+` que son solde soit créditeur (`-250 000`) ou débiteur
  (`+120 000`). ⛔ **Propriété du poste, jamais du montant.**

### Portes DoD

Lint 0 warning · build OK · `bilan-service` **1 292 unitaires + 354 e2e**, couverture
**98,60 / 93,44 / 98,31 / 98,57** · `balance-service` **3 584 unitaires + 884 e2e**.
`MOTEUR_VERSION` 1.3.0 → 1.4.0. **5 mutations, 5 rouges**, aucune par erreur de compilation
— dont « dériver la marque du signe du montant », exactement ce que la Vigilance interdit.

### Vérification docker — Mongo réel, référentiels réels, rejouée après les correctifs de revue

| Mesure | Résultat |
|---|---|
| stock qui **monte** (`603100` créditeur) | `RB` → `sensAffichage: '-/+'`, `montantN: -250 000` |
| **déstockage** (`603100` débiteur) | `RB` → **le même** `'-/+'`, `montantN: +120 000` |
| dérivés | `TA` → `'+'`, `RA` → `'-'`, `TF`/`TG` → `'+'` |
| agnosticisme `sfd-bceao@2.0` | aucun `-/+`, **tous** dérivés de la règle de calcul |
| contrat servi | `SensAffichage` en `enum` `['+','-','-/+']`, champ **requis**, `example: '+'` |
| ⚡ **append-only prouvé** | le même jeu rouvert puis re-validé : **v1** garde `bilan-engine@1.3.0` **sans** le champ, **v2** porte `1.4.0` avec `RB = {montantN: -250 000, sensAffichage: '-/+'}` |

### Revue de code — 5 constats, tous traités (commit dédié)

⚡⚡ **MOYEN — le générateur jetait un marqueur mal saisi en SILENCE, et la fiche écrit le
marqueur avec DEUX caractères différents.** Mesuré : en remplaçant le `-` ASCII par le moins
typographique `−` (U+2212), le build passe, le poste perd sa marque et repart en sens
**dérivé** — « faux une année sur deux », le défaut même que la story ferme. Et **le checksum
ne bouge pas** : le signal « rien n'a changé » devient indiscernable de « rien à faire ».
⚠️ Le piège n'est pas théorique : **cette fiche écrit `−/+` en U+2212 dans 4 de ses 7
occurrences**. ⇒ `build.mjs` **lève** désormais, en nommant la ligne, le champ et le piège ;
la garde couvre les **quatre** marqueurs additifs. Corollaire : le vocabulaire existait en
**trois** copies alors que son JSDoc affirmait « sans être recopiée nulle part » — il est
désormais déclaré dans le **contrat du paquet**, et ré-exporté par les états.

⚡ **MOYEN — le contrat affirmait « les deux montants sont POSITIFS »**, ce que l'AC-5 dément
systématiquement sur les quatre lignes instruites. Un front qui lit le contrat en déduirait
`Math.abs()` et afficherait la colonne `-/+` correctement **en face d'un montant faux d'un
signe** — la story livrerait la moitié de son objet. Corrigé aux quatre endroits qui le
répétaient.

MINEURS — l'en-tête « les **cinq** digests bougent ensemble » de STORY-428 chapeautait deux
valeurs qui datent de 429, alors que celle-ci n'en a bougé que **deux** : lu comme une règle,
il ferait mettre les cinq à jour d'un bloc et **neutraliserait le filet** pour trois paquets
inchangés · l'`example: '-/+'` rendait la fiche de modèle Swagger auto-contradictoire (`TA`
porte `+`).

### Revue de sécurité — aucune vulnérabilité (confiance ≥ 80)

Vérifié par calcul : **8/8 checksums** conformes aux octets dans les deux dépôts, build
**reproductible**, byte-identité inter-dépôts tenue, **zéro** digest périmé dans tout
`PROSPERA/`, **zéro point de code nouveau** dans les artefacts. Injection de formule écartée
sur mesure : `sensAffichage` **n'atteint aucune cellule** (`modele-liasse.ts` projette champ
par champ), `rendu-excel.ts` écrit une **chaîne** (XLSX ne réévalue pas), et le seul CSV de
la plateforme ne consomme pas ce champ. Le générateur qui lève n'est **ni au runtime ni en
CI** — outil de poste, sources versionnées. Non-répudiation intacte : `sensAffichage` est
**absent du `DocumentExport`**, donc l'empreinte d'un ré-export d'une version figée ne bouge
pas.

### Bornes assumées, nommées plutôt que tues

- ⚠️ **Deuxième révision en place de `syscohada-revise@2.1` dans la même journée** (après
  STORY-428) : une **troisième cohorte** de snapshots. La doctrine et sa borne sont écrites
  au registre (cf. STORY-428) ; `referentielHomogene` tient compte du checksum depuis.
- ⚠️ **`+/-` n'est pas exprimable** : le formulaire note vraisemblablement `TE` en `+/-`
  (produit d'abord) et non `-/+`. L'AC-3 impose littéralement `-/+` sur les quatre, `sens`
  désambiguïse, et le rendu reste juste (« le sens s'inverse ») — mais la limite
  d'expressivité de l'énumération mérite d'être connue si CIMA ou SFD transcrivent un jour
  leur colonne.
- `PosteSig` **n'a pas** reçu le champ : les paliers `XA..XI` ne portent pas de colonne de
  sens au formulaire (leur valeur est déjà signée), et la story ne parle que de
  `PosteResultat`.
