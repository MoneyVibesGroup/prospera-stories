# STORY-406 : `GET …/rapprochement/ecarts` sans `compteId` lit les relevés de TOUTE l'organisation

Status: ready-for-dev

**Épic :** EPIC-022 — Rapprochement bancaire (relevés + mobile money) · *clôturé le 2026-07-30 ;
cette story y atterrit sans le rouvrir, comme STORY-402*
**Service :** `balance-service` (`:3007`) — `modules/rapprochement`
**Points :** 3 · **Sprint :** S20
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
