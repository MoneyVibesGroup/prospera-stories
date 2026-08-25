# STORY-387 : Les montants des refus sortent en unités mineures, et le geste manque là où il coûte le plus

**Epic :** EPIC-021 — Import & migration Sage (reprise à-nouveaux)
**Réf. :** décision PO du 2026-08-23, à la revue de maquette **FE-047** — *« le service doit dire cela, ce n'est pas à l'écran de le faire »*
**Priorité :** Should Have
**Story Points :** 2
**Statut :** done
**Date de clôture :** 2026-08-25
**Complexité :** low
**Sprint :** 20
**Service :** `balance-service` (`:3007`)

---

## Le constat

### ① Un montant de refus est publié dans la représentation de **stockage**

Le contrat canonique porte les montants en **unités mineures XOF** (valeur × 100) — c'est juste, et
ça ne se discute pas *pour les données*. Mais les **messages de refus** les recopient tels quels :

> « Balance déséquilibrée (FR-A25) — équilibre des soldes non satisfait : écart de **2 450 000 000**
> (unités mineures XOF) entre 41 238 000 000 au débit et 41 483 000 000 au crédit. »

Le comptable qui lit cette phrase cherche **24 500 000 F CFA**. Il lit un nombre cent fois trop grand,
suivi d'une parenthèse technique qui lui demande de faire la conversion de tête, au moment précis où
il vient d'être refusé.

⚠️ **Et le service est le seul à pouvoir la faire correctement.** Il connaît la devise du dossier
(`fiscal.devise`) et l'échelle du contrat ; l'écran, lui, devrait ré-appliquer une règle de
présentation à une phrase qu'il n'a pas produite — c'est-à-dire parser du texte pour le réécrire.

### ② Le refus qui coûte le plus cher est le seul à ne pas dire quoi faire

Ce module **sait** nommer le geste. Ses propres exceptions le font, et bien :

| refus | ce qu'il dit de faire |
|---|---|
| `BALANCE_SOURCE_NON_VALIDEE` | « validez la balance de clôture avant de générer les à-nouveaux » |
| `RESULTAT_NON_DETERMINE` | « déterminez le résultat de l'exercice avant de générer les à-nouveaux » |
| `SOCLE_INTROUVABLE` | « générez-le avant d'affecter le résultat » |
| `SOCLE_DEJA_GENERE` | « il ne se régénère pas » |
| **déséquilibre (FR-A25)** | **— rien.** Il énonce un écart et s'arrête. |

Or c'est le seul dont la cause est **ailleurs** : elle est dans la balance de clôture N-1, pas dans le
geste que l'utilisateur vient de faire. Sans le dire, le refus laisse chercher au mauvais endroit —
exactement le motif « refus loin de la cause, cause jamais nommée » que STORY-172 a corrigé ailleurs,
et que `ResultatNonDetermineException` a été écrite pour éviter sur ce même écran.

---

## Ce qu'il faut livrer

1. **Le montant lisible sort du service.** Tout montant cité dans un **message** de refus est rendu
   dans l'unité que l'utilisateur lit (24 500 000 F CFA), la valeur machine restant disponible en
   `details` *(cf. **STORY-386** pour la structure)*. Périmètre : les refus de
   `balance.validator.ts` et de `reprise.exceptions.ts` qui citent un montant — aujourd'hui le
   déséquilibre FR-A25 et `AffectationIncompleteException`.
2. **Le refus d'équilibre nomme son geste**, sur le patron des quatre autres : la correction se fait
   dans la balance de clôture de l'exercice repris.
3. **Aucun changement sur les données.** Les DTO de réponse gardent leurs unités mineures : la story
   porte sur ce que le service **dit**, jamais sur ce qu'il **sert**.

---

## Critères d'acceptation

1. Le message d'un refus FR-A25 cite l'écart dans l'unité lue par l'utilisateur, avec sa devise, sans
   parenthèse technique demandant une conversion.
2. Ce message nomme le geste qui corrige, et il désigne la balance source — pas l'écran courant.
3. `AffectationIncompleteException` suit la même règle sur `resultat` et `total` *(son `details`
   chiffré, lui, ne change pas : c'est ce que le client calcule)*.
4. Les DTO de réponse sont inchangés — vérifié par diff d'OpenAPI.
5. La devise vient du dossier, jamais d'une constante `XOF` codée en dur : `cima-assurances` et les
   futurs référentiels hors zone franc ne doivent pas hériter d'un libellé faux.

---

## Notes

- **Décision PO explicite, pas une préférence d'implémentation** : à la revue de FE-047 le
  2026-08-23, le front proposait d'ajouter lui-même la conversion en francs et la phrase du geste. Le
  PO l'a refusé — *« le service doit dire cela car ce n'est pas à l'écran de le faire »*. FE-047 rend
  donc le message du serveur **tel quel** en attendant cette story.
- Se livre naturellement **avec STORY-386**, qui touche la même exception ; les deux restent
  séparables (386 = le contrat, 387 = ce qu'il dit).

---

## Progress Tracking

**Statut : `done`** — implémentée, vérifiée en docker, revue, sécurisée et mergée le 2026-08-25.

### Décision de conception — D-387-1 : la devise vient du **profil société**, pas du paquet fiscal

L'énoncé désigne `fiscal.devise`, qui est le champ du **paquet fiscal** (`pays × année`). Vérifié avant
de le câbler : **le manifeste ne publie qu'un seul paquet, `togo@2026`**. Le lire dans
`controleurDeCompte` — traversé par les **trois** adaptateurs du hub à chaque soumission — ferait
dépendre *toute écriture de balance* d'un artefact **absent pour tout exercice clos une autre année**.
Un refus neuf, sur le chemin chaud, pour un simple libellé de message : le remède serait pire que le mal,
et sur la voie Kafka une erreur de paramétrage levée là n'est codifiée par aucun `catch` de l'ingestion
(poison pill documenté dans `controleurDeCompte`).

La devise est donc lue au **profil société** — `ProfilSociete.devise`, dont la doc dit mot pour mot
« Devise du dossier », déclarée par l'organisation, indexée, toujours lisible. Repli assumé sur
`DEVISE_PAR_DEFAUT` quand aucun profil n'existe encore (la saisie est **progressive**) : c'est la valeur
que le schéma écrirait de toute façon à la création, définie au **seul** endroit qui déclare les devises
du service — pas la constante en dur que l'AC-5 interdit. ⚠️ Grain `orgId`, comme le profil lui-même
(index unique `{orgId}`) : son re-scopage en `(orgId, dossierId)` est différé depuis STORY-236, et cette
méthode le suivra sans changer d'appelant.

### Décision de conception — D-387-2 : le geste est **contextuel**, dérivé de `origine`

L'AC-2 demande que le refus d'équilibre nomme le geste et **désigne la balance source**. Or ce `422`
est levé par les **sept** routes d'écriture qui traversent `BalanceValidator` : dépôt direct, import
fichier, import Sage, agrégation des cahiers, provisions, socle. « Corrigez la balance de clôture de
l'exercice repris » est vrai **pour le socle et pour lui seul** — servi à un import Sage, il enverrait
le cabinet chercher au mauvais endroit, c'est-à-dire le défaut même que la story ferme, retourné contre
elle.

Le geste est donc conditionné à `balance.origine === 'A_NOUVEAUX'`, et **dérivé de la balance
elle-même**, jamais d'un drapeau d'appelant qui pourrait la contredire. Sur les autres chemins la cause
est dans ce que l'utilisateur vient de déposer, et le message la donne déjà (grandeur + écart chiffré) :
rien à ajouter qui ne soit du bruit.

### Périmètre — un troisième refus est entré, un quatrième non

L'énoncé cadre « les refus de `balance.validator.ts` et de `reprise.exceptions.ts` **qui citent un
montant** », en énumérant FR-A25 et `AffectationIncompleteException`. Le refus de **double solde**
(`Compte « 411 » à double solde : 600 au débit et 400 au crédit (unités mineures XOF)`) cite lui aussi
deux montants, avec exactement la parenthèse technique que la story condamne : il est traité.

En revanche `validerQuatreColonnes` (« doit être un entier ≥ 0 … (unités mineures XOF) ») **n'est pas
touché** : il décrit l'unité **attendue en entrée**, il ne cite aucun montant. Le mentionner ici pour
qu'il ne se redécouvre pas comme un oubli.

### Ce qui a été livré

| | |
|---|---|
| `montants.ts` *(neuf)* | le formateur **partagé** remonte d'`ingestion/` sous un nom qui dit ce qu'il fait — `formaterMontantXof` n'a jamais rien eu de togolais, il divise par 100 et groupe par milliers, et son nom affirmait la devise que cette story retire. Ses trois appelants historiques (rejets d'ingestion, minimum de TPU, seuils de régime) suivent. `formaterMontantAvecDevise` **conserve le signe** : un écart dit de quel côté la balance penche. |
| `BalanceDesequilibreeException` | montants lisibles + devise + geste contextuel. `details` **inchangé** — la valeur machine reste en unités mineures, c'est elle que le client recalcule. |
| `AffectationIncompleteException` | disait *qu'*on s'était trompé sans dire **de combien** ; cite désormais résultat et total répartis. `details` inchangé. |
| `ControleurDeCompte.devise` | même nature que `referentiel` : une donnée de l'organisation que le validateur **pur** ne peut pas aller chercher. |
| `BalanceService.deviseDuDossier` | seul point de résolution, appelé par le contrôleur de comptes **et** par la reprise — cette dernière **dans sa branche de refus seulement** : le chemin qui affecte réellement ne paie pas la lecture. |
| `ORIGINE_A_NOUVEAUX` | redescend dans `types/balance-canonique`, à côté d'`ORIGINES_BALANCE` : une exception **pure** n'a rien à importer d'un repository Mongoose. Toujours **une** définition — la raison invoquée en STORY-359 ne change pas. |

### Portes de qualité

`eslint --max-warnings 0` **0** · `nest build` **OK** · `test:cov` **2 969 / 2 969**, couverture
**98,98 st / 91,83 br / 98,17 fn / 99,06 li** (seuils 65/90/90/90 ; `montants.ts`, `balance.validator.ts`,
`balance-desequilibree.exception.ts` et `reprise.exceptions.ts` à **100 %**) · `test:e2e` **681 / 681**
(678 + 3). Chiffres relevés **après** les correctifs de revue.

### AC-4 — « DTO de réponse inchangés, vérifié par diff d'OpenAPI »

Le document publié a été **dumpé sur les deux révisions** (même harnais que
`openapi-contract.e2e-spec.ts`, 30 contrôleurs montés) et comparé :

```
git checkout dev      → openapi-dev.json      (514 262 octets)
git checkout MNV-387  → openapi-MNV-387.json
diff → AUCUNE DIFFÉRENCE
```

Le contrat publié est **byte-identique**. La story ne porte que sur ce que le service **dit**.

### Table de mutations exécutée (chacune restaurée)

| Mutation | Test attendu rouge | Constat |
|---|---|---|
| le geste est neutralisé (toujours `''`) | AC-2 « nomme le geste … sur un socle » | 🔴 1 rouge |
| la devise ne vient plus du dossier (`'XOF'` au point d'appel du validateur) | AC-5 « rend la devise du DOSSIER » | 🔴 1 rouge |
| l'écart repart en unités mineures brutes | e2e ×2 (message HTTP réel) | 🔴 2 rouges |
| `balance.origine` n'est plus passée au refus | AC-2 | 🔴 1 rouge |
| `deviseDuDossier` ignore le profil et rend le défaut | `deviseDuDossier` ×2 | 🔴 2 rouges |
| le refus d'affectation redevient muet sur les montants | « en rendant les deux montants » | 🔴 1 rouge |

🪤 **La 2ᵉ mutation a d'abord rougi POUR LA MAUVAISE RAISON.** Coder `'XOF'` en dur *dans l'exception*
rendait le paramètre `devise` inutilisé ⇒ `TS6133`, donc une suite qui **ne compile pas** (`Tests: 0
total`) — « rouge » sans qu'aucune assertion n'ait jugé quoi que ce soit. Rejouée **au point d'appel**
(`validerEquilibre(balance, 'XOF')`), où `comptes.devise` cesse d'être lu sans qu'aucun symbole ne
devienne orphelin : `tsc --noEmit` muet, et le seul test rouge est celui de l'AC-5. *(Même piège qu'en
STORY-179, STORY-385 et STORY-386.)*

### Vérification docker réelle — 2026-08-25

`mongo` + `kafka` + `redis` + `auth-service` + `balance-service` ; `/api/v1/health` →
`{"mongodb":"up","kafka":"up"}`. Amorçage : compte `verif387@…` (org `6a8cde6d…4eb0`),
`emailVerifiedAt` posé en base, read-models `orgkycstatuses` `APPROVED`, `orgbalanceentitlements`
`ACTIVE` + `referentiel: syscohada-revise@2.1`, `dossiers_dossier` `ACTIF` ;
`whoami/balance-access` → `{"access":"granted"}`.

| # | Appel | HTTP | Ce que le cabinet LIT — et ce qui est prouvé |
|---|---|---|---|
| 1 | `POST /dossiers/{d}/balances`, soldes rompus (5 000 / 3 000 unités mineures) | **422** | « *écart de **20 XOF** entre **50 XOF** au débit et **30 XOF** au crédit.* » — et **rien de plus** : aucun geste inventé sur un dépôt direct. `details` inchangé : `{grandeur:"soldes", ecart:2000, totalDebit:5000, totalCredit:3000}` ⇒ **la donnée reste en unités mineures, la phrase seule a changé** |
| 2 | `POST /dossiers/{d}/balance/a-nouveaux`, `dryRun:false`, sur une clôture N-1 portant `AB12` | **422** | « *écart de **-3 200 000 XOF** … * ***La correction se fait dans la balance de clôture de l'exercice repris, pas sur ce socle : il n'en est que le report.*** » ⇒ **AC-2 sur la vraie stack**, geste présent **et** désignant la source. Le signe `-` survit au formatage |
| 3 | idem sur une clôture 2023 saine (résultat 14 000 000 porté par `13`) | **201** | socle persisté, `balanceSourceId` chaîné — **non-régression** : le chemin nominal ne refuse rien |
| 4 | `POST …/balance/affectation-resultat`, 10 000 000 répartis sur 14 000 000 | **400** | « *… : **140 000 XOF** à affecter, **100 000 XOF** répartis.* » ⇒ **AC-3** ; `details` toujours `{resultat:14000000, total:10000000}` |
| 5 | `profils_societe.devise = 'XAF'` posé, **puis le cas 1 rejoué à l'identique** | **422** | « *écart de **20 XAF** entre **50 XAF** au débit et **30 XAF** au crédit.* » ⇒ **AC-5 discriminé** : même balance, même dépôt, même code — seule la devise **déclarée par le dossier** a bougé, et le message a suivi |
| 6 | après les cas 1, 2 et 5 | — | `balances` de l'exercice 2025 = **0** ⇒ les refus n'écrivent **rien** ; le seul socle en base est celui du cas 3 (`origine: A_NOUVEAUX`, chaîné) |

⚠️ **Le cas 5 est le seul qui DISCRIMINE l'AC-5** : les cas 1 à 4 passeraient aussi avec un `XOF` codé
en dur. C'est lui, et la mutation n°2, qui prouvent que la devise vient réellement du dossier.

### Revue de code (⑥)

**2 constats**, tous deux non bloquants, **corrigés** avant le merge (commit dédié `845e961`).

1. **Un second facteur d'échelle homonyme.** `montants.ts` redéfinissait
   `UNITES_MINEURES_PAR_UNITE` alors que `referentiel/montants-paquet.ts` l'**exporte déjà**, avec sa
   propre spec qui l'assert à `100`. Deux symboles homonymes exportés dans le même service : l'auto-import
   en propose un au hasard, et le jour où l'un change — une devise à trois décimales — l'autre reste. C'est
   mot pour mot le « deux copies d'une même valeur finissent par diverger » de STORY-138/149. La constante
   est désormais **importée** ; `montants.ts` reste pur (`montants-paquet.ts` n'importe rien).
2. **Un repli qui laissait passer un montant sans unité.** `deviseDuDossier` repliait en `??`, qui ne
   rattrape que `null`/`undefined`. Un profil écrit **hors Mongoose** — script de migration, reprise de
   données — peut porter une `devise` **vide** : le refus sortait alors « *écart de 20  entre 50  au débit
   et 30  au crédit* », un montant **sans unité**, c'est-à-dire l'exact contraire de ce que la story livre.
   Passé en `||` (aucune devise valide n'est falsy — le repli ne masque donc jamais une valeur légitime),
   plus un test qui rougit sous la mutation inverse.

⚡ **Le second correctif a été rejoué en docker, et le rejeu a d'abord MENTI.** Avec `devise: ''` posée en
base, le service continuait de rendre « écart de 20  » alors que le conteneur portait bien la source
corrigée (`docker exec … grep` → ligne 207 en `||`) : **`nest --watch` n'avait pas recompilé**. Après
`docker compose restart balance-service` (logs : `Found 0 errors. Watching for file changes.`), le même
appel, sur la même donnée, rend « écart de **20 XOF** ». Le rejeu **discrimine** donc réellement le
correctif — avant/après sur un état de base identique. *(Piège déjà consigné :
`hot-reload-ment-verif-docker`.)*

**Constats écartés, pour qu'ils ne se redécouvrent pas :**

- `ingestion.regles.ts` compose encore son motif de rejet en `` `… ${formaterMontantMineur(ecart)} XOF …` ``
  — **XOF en dur**, mais c'est un **rejet d'ingestion** consigné sur la voie Kafka, ni un refus de
  `balance.validator.ts` ni de `reprise.exceptions.ts` : hors du périmètre énoncé. Le corriger exigerait de
  faire descendre la devise jusqu'à `rejetDepuisErreur`, fonction **pure** sans accès à l'organisation ;
- `fiscal/tpu.regles.ts` écrit de même `` `${formaterMontantMineur(minimum)} XOF` `` dans la **formule** d'un
  calcul de TPU — même raison, autre module ;
- `validerQuatreColonnes` conserve « *doit être un entier ≥ 0 … (unités mineures XOF)* » : il décrit
  l'**unité attendue en entrée**, il ne cite **aucun montant**. Le périmètre de la story vise les refus
  « qui citent un montant ».

### Revue de sécurité (⑦)

**0 vulnérabilité.** Vérifié et écarté explicitement :

- **la devise interpolée dans le message ne peut pas être une chaîne arbitraire** : la seule surface
  d'écriture publique est `CreerProfilSocieteDto`/`ModifierProfilSocieteDto`, où `devise` porte
  `@IsIn([...DEVISES_SUPPORTEES])` — une **liste fermée** (`['XOF']`) — derrière le `ValidationPipe` global
  en `whitelist` + `forbidNonWhitelisted`. Aucun chemin OCR n'écrit ce champ. Il n'y a donc pas d'injection
  de contenu possible dans la phrase de refus, et le message ne transite d'ailleurs par aucun contexte
  HTML/SQL — c'est un champ JSON ;
- **aucune divulgation neuve** : les quatre montants étaient **déjà** publiés, dans le message d'avant et
  dans `details` depuis STORY-386 ; seule leur **échelle d'affichage** change. Le geste est une constante
  et **ne nomme aucun identifiant** (« la balance de clôture de l'exercice repris » — ni id, ni nom, ni
  date) ;
- **aucune lecture cross-tenant** : `deviseDuDossier` filtre sur le seul `orgId` **issu du JWT**, converti
  en `Types.ObjectId` (cast strict — pas d'objet client injectable dans le filtre), et n'est atteint
  qu'après `Throttler → JwtAuth (RS256) → EmailVerified → Roles`, `@RequiresBalanceAccess` (KYC +
  entitlement) et `@RequiresDossierScope` ;
- **pas d'amplification** : une lecture indexée (`profils_societe` porte un index **unique** `{orgId}`) par
  **soumission**, jamais par ligne de balance ;
- **intégrité comptable préservée** : `formaterMontantAvecDevise` ne produit que des **phrases** — aucun
  DTO, aucun événement, aucun `details` n'emprunte le formateur (il **tronque**, ce qui serait faux sur une
  donnée). Le document OpenAPI byte-identique et le `details` inchangé en docker le prouvent des deux côtés ;
- **contrat d'événement intact** : `balance.submitted` n'est pas touché — aucun second dépôt impliqué.
