# STORY-411 : `GET …/rapprochement/ecarts` sans `compteId` lit les relevés de TOUTE l'organisation

> ⛔ **RENUMÉROTÉE 406 → 411 le 2026-08-25, à la fusion.** **Collision d'id réelle** : deux stories
> différentes ont pris « STORY-406 » le même jour, dans deux sessions concurrentes qui ne
> partageaient aucun commit — (a) celle-ci, ouverte en instruisant la maquette FE-049
> (`balance-service`), et (b) « Un octet nul dans la recherche rend `500` » (`dossier-service`),
> ouverte à la revue de sécurité de STORY-383. Le `git log -S` de chaque session voyait l'id libre,
> et le `git fetch` du jour avait échoué faute de réseau.
>
> ⇒ **Règle appliquée — l'id publié gagne.** (b) était déjà sur `origin/main` **et déjà clôturée**
> (`b0a5760`) : elle **garde 406**. Celle-ci était locale, non poussée : elle devient **STORY-411**.
> C'est la **deuxième** collision du même genre après STORY-396 → STORY-403.
>
> ⚠️ **Ce que ça enseigne, au-delà de la règle** : un `git fetch` qui **échoue** ne rend pas la
> vérification « faite en local » — il la rend **impossible**. Quand le réseau manque, l'id pris
> est un **pari**, et il faut l'écrire comme tel dans le tracker pour que la fusion le rejoue.

Status: in_progress

**Épic :** EPIC-022 — Rapprochement bancaire (relevés + mobile money) · *clôturé le 2026-07-30 ;
cette story y atterrit sans le rouvrir, comme STORY-402*
**Service :** `balance-service` (`:3007`) — `modules/rapprochement`
**Points :** 3 · **Sprint :** S20 · **Complexité :** medium
**Origine :** relevée le **2026-08-25** en construisant la maquette **FE-049**, en lisant
`rapprochement.service.ts` pour savoir ce que l'écran des écarts pouvait honnêtement affirmer.

---

## Le fait, relevé à la source

`listerEcarts` est **dossier-scopé** par son contrôleur. Son corps ne l'est qu'à moitié :

```ts
// rapprochement.service.ts — listerEcarts
const compteId = query.compteId ? (await this.comptes.trouver(user, query.compteId))… : undefined;

const [engagees, lignesReleve, lignesCahier, decisions] = await Promise.all([
  this.appariements.lignesConfirmees(orgId, dossierId, exercice),
  compteId
    ? this.releves.lister(orgId, compteId, exercice)
    : this.releves.listerParOrg(orgId, exercice),   // ⛔ TOUTE l'organisation
  this.chargerCahiers(orgId, dossierId, exercice),  // ✅ le dossier
  this.qualifications.parLigne(orgId, dossierId),
]);
```

⛔ **`compteId` est déclaré FACULTATIF au contrat** (`ListerEcartsQueryDto`). Omis, la réponse
mélange **les lignes de relevé de tous les clients du cabinet** aux écarts du dossier ouvert.

---

## Ce que ça coûte, concrètement

Le comptable lit « 3 encaissements non déclarés · 5 200 000 F » et va chercher chez son client des
versements qui appartiennent à un **autre dossier**. Rien ne le prévient : la réponse ne publie ni
`dossierId`, ni le compte de rattachement de chaque ligne — `EcartResponseDto` porte bien un
`compteTresorerieId`, mais rien ne dit à quel *client* ce compte appartient (c'est précisément
l'objet de STORY-402).

⚡ **La forme du défaut est celle qu'aucun outil n'attrape** : pas d'erreur, pas de code HTTP, des
montants plausibles. Et il est **asymétrique** — le côté cahier est correctement chargé par
dossier, si bien que la moitié de l'écran est juste. C'est ce qui le rend crédible.

⚠️ **STORY-402 ne le referme pas.** Elle déplace les relevés sous `dossiers/:dossierId/…` ; ce
`listerParOrg` restera un appel org-large **à l'intérieur** d'un service dossier-scopé tant qu'il
n'est pas nommément corrigé. Les deux stories sont voisines, pas redondantes.

---

## Périmètre

**Inclus**

- La branche « pas de `compteId` » charge les relevés **du dossier**, jamais de l'organisation.
  Après STORY-402 c'est `listerParDossier(orgId, dossierId, exercice)` ; avant elle, la seule
  lecture sûre est **le refus** (voir l'arbitrage ci-dessous).
- Un **arbitrage écrit** sur le devenir de `compteId` facultatif :
  - soit il devient **obligatoire** — l'appel sans compte n'a de sens que si « tous les comptes du
    dossier » est une portée exprimable, ce qu'elle n'est pas aujourd'hui ;
  - soit il reste facultatif et signifie **explicitement** « tous les comptes de CE dossier », ce
    qui exige STORY-402 comme préalable.
- Un test qui **prouve la portée** : deux dossiers d'une même organisation, chacun avec son compte
  et ses lignes ; les écarts du dossier A ne citent aucune ligne du dossier B.

**Hors périmètre**

- Le re-scopage des routes de trésorerie : c'est STORY-402.
- L'asymétrie **assumée** relevé / cahier lorsqu'un `compteId` EST fourni : côté relevé le compte
  demandé, côté cahier tout le dossier. Ce n'est pas un défaut — une recette encaissée sur TMoney
  ne doit pas ressortir « sans encaissement » parce qu'on rapproche la banque. FE-049 l'écrit à
  l'écran.

---

## Conception — les trois décisions écrites avant d'être codées

### D-411-1 · L'arbitrage : `compteId` reste FACULTATIF, et signifie « tous les comptes de CE dossier »

La story pose deux issues. La seconde — « facultatif = toute la trésorerie du dossier » — exigeait
**STORY-402 comme préalable** ; celle-ci est **clôturée le 2026-08-28**, les lignes de relevé
portent désormais un `dossierId` propre et l'appel `listerParDossier(orgId, dossierId, exercice)`
est **exprimable**. L'issue « obligatoire » n'a donc plus de justification : elle ne se défendait
que par l'**impossibilité technique** d'exprimer la portée « tous les comptes du dossier ».

⚡ **Et rendre `compteId` obligatoire retirerait la seule question que l'écran sait poser d'entrée** :
« qu'est-ce qui, dans la trésorerie de ce dossier, n'est justifié nulle part ? ». Un cabinet dont
le client a une banque **et** deux comptes mobile money devrait sinon ouvrir l'écran trois fois et
faire la réunion des trois réponses de tête — alors que l'appariement, lui, est déjà calculé sur
l'ensemble du dossier (`chargerCahiers` est dossier-scopé depuis STORY-236). Le rendre obligatoire
casserait aussi le contrat d'un consommateur publié (rupture pour tout appelant qui l'omet) pour
**refermer une faille qui n'est pas dans le caractère facultatif du paramètre, mais dans la lecture
qu'il déclenche**.

⛔ **Ce qui change vraiment, donc : la lecture, pas le contrat.** `listerParOrg(orgId, exercice)`
devient `listerParDossier(orgId, dossierId, exercice)`. Le `dossierId` ne vient pas de la requête —
il vient du **scope d'URL** déjà exigé par le contrôleur (`exigerDossierId`), celui-là même qui
borne les cahiers, les appariements et les qualifications de la même méthode. Aucune nouvelle
surface, aucun nouveau paramètre.

**AC-2 est un livrable de contrat** : la description Swagger de `compteId` décrit aujourd'hui un
**filtre** (« restreint les écarts côté relevé à ce compte ») sans jamais dire ce que son **absence**
signifie. Elle publiera désormais les deux portées, nommément.

⚠️ **Et elle publie une vérité PÉRIMÉE à corriger au même endroit** (note de la story) : « les écarts
côté cahier restent calculés sur toute l'**organisation** » est faux depuis **STORY-236** —
`chargerCahiers(orgId, dossierId, exercice)` les charge **par dossier**. Une prose périmée sur la
portée est exactement ce qui fait recopier l'ancienne vérité dans l'écran suivant : c'est ainsi que
FE-049 aurait pu être dessiné sur une promesse fausse. L'asymétrie **réelle** — et assumée, hors
périmètre — est ailleurs : quand un `compteId` EST fourni, le relevé est borné au compte demandé
tandis que le cahier reste sur tout le dossier.

### D-411-2 · L'index se pose AVEC son lecteur — et l'ancien part du même geste

STORY-402 a laissé **deux hooks inertes nommément adressés à cette story**, aux deux extrémités du
même index :

1. `ligne-releve.schema.ts` refusait de poser `{dossierId, exercice.debut, date}` — « un index sans
   lecteur coûte à chaque écriture de la plus grosse collection du module ». Son lecteur arrive
   ici : l'index se pose ici.
2. `dossiers-migration.service.ts` refusait de supprimer `lignes_releve.orgId_1_compteTresorerieId_1_date_1`
   — **dernier index préfixé `orgId`** de la collection — parce que `listerParOrg` filtrait encore
   `{orgId, exercice.*}` et qu'un cabinet à plusieurs millions de lignes aurait fait un **COLLSCAN
   multi-tenant** à chaque ouverture de l'écran. Ce lecteur disparaît ici : l'index part ici.

⚡ **C'est un défaut de PLAN qu'on ferme, pas un défaut de résultat** (leçon STORY-383) : les deux
moitiés sont **invisibles au HTTP** — mêmes réponses, mêmes montants, mêmes codes. Ne poser que le
re-scopage laisserait la nouvelle lecture sans index et l'ancienne dépense d'écriture sans lecteur ;
le geste n'est juste qu'**entier**.

⚠️ Le commentaire de `releves.repository.ts` affirme, lui, que « l'index `{dossierId, exercice.debut,
date}` est **déjà en place** pour ce jour-là ». **C'est faux** — le schéma dit explicitement le
contraire. Deux commentaires écrits dans la même story se contredisaient ; seul le schéma fait foi.
Corrigé au passage.

### D-411-3 · `listerParOrg` est SUPPRIMÉE, pas laissée à côté

Une méthode org-large **sans appelant** n'est pas neutre : c'est le geste le plus court pour l'écran
suivant, publié dans un dépôt dont toutes les autres méthodes sont dossier-scopées et
fail-closed. La garder « au cas où » rejouerait exactement le défaut que cette story ferme, une
story plus tard et sans revue. Le dépôt ne doit plus offrir **aucune** lecture org-large : c'est
l'invariant que le test de portée gardera.

⚠️ **Conséquence sur le test qui la gardait** : `tresorerie.repositories.spec.ts` fige aujourd'hui la
portée org-large de `listerParOrg` « pour que la story qui la refermera le fasse en connaissance de
cause ». Ce test a rempli son office ; il devient le test de la portée **dossier**.

---

## Critères d'acceptation

1. Aucune lecture de `listerEcarts` ne franchit la frontière du dossier, avec ou sans `compteId`.
2. Le sort de `compteId` (obligatoire, ou « tous les comptes du dossier ») est **tranché et
   documenté** dans le Swagger — la description actuelle décrit un filtre, pas une portée.
3. Un test à deux dossiers d'un même tenant prouve le cloisonnement (le cloisonnement
   inter-organisations, lui, n'a jamais été en cause).

---

## Notes

- ⚠️ **Écart de documentation à corriger au passage** : `ListerEcartsQueryDto` affirme que « les
  écarts côté cahier restent calculés sur toute l'**organisation** » alors que le code les charge
  **par dossier** (`chargerCahiers(orgId, dossierId, exercice)`) depuis STORY-236. Une prose
  périmée sur la portée est exactement ce qui fait recopier l'ancienne vérité dans l'écran suivant.
- Consommateur nommé : **FE-049**, qui envoie **toujours** `compteId` et le garde par un test —
  mais une garde de client n'est pas une garde de serveur.
- ⚠️ Id vérifié libre le 2026-08-25 : absent de `stories/`, absent de `origin/main`, et l'unique
  occurrence dans `git log -S` est un **renumérotage annulé** (une STORY-185 fiscale renommée
  406 le 2026-08-04 puis renumérotée à nouveau — plus aucune référence vivante).

---

## Progress Tracking

**2026-08-28 — conception écrite avant le code, statut `in_progress`.**
Branche `MNV-411` ouverte sur `docs/` (base `main`) et sur `balance-service` (base `dev`, après
`git fetch` — `origin/dev` porte bien les 3 commits de STORY-402, préalable de D-411-1).
Décisions **D-411-1 / D-411-2 / D-411-3** posées avant la première ligne de code : l'arbitrage sur
`compteId`, le geste entier sur les deux index, la suppression de `listerParOrg`.
Statut aligné aux 3 endroits (en-tête, `sprint-status.yaml`, cette section).
