# STORY-429 : Le sens « −/+ » des quatre postes de variation de stocks n'est pas publié — le front ne peut le rendre qu'en codant en dur le référentiel

Status: ready-for-dev

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

- [ ] AC-1 — `MappingRule` gagne un champ optionnel `sensAffichage: '+' | '-' | '-/+'`,
      **donnée du paquet**, distinct de `regle` (qui reste la règle de **calcul**).
- [ ] AC-2 — `PosteResultat` publie `sensAffichage`, repris du paquet ; à défaut, dérivé de
      `regle` (`PRODUIT` → `+`, `CHARGE` → `−`) pour rester rétro-compatible.
- [ ] AC-3 — Le paquet `syscohada-revise` marque `-/+` sur `RB`, `RD`, `RF`, `TE`. Les postes
      `TF` et `TG`, laissés **sans marque** sur le formulaire officiel, portent leur sens dérivé
      (`+`) : la maquette a tranché en faveur de la lisibilité, et la story le documente plutôt
      que de reproduire un blanc du formulaire.
- [ ] AC-4 — `sfd-bceao@2.0` ne déclare aucun `sensAffichage` ⇒ tous dérivés, **aucune
      régression** (agnosticisme P7).
- [ ] AC-5 — Test : `RB` avec un solde **créditeur** rend `montantN < 0` **et**
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
