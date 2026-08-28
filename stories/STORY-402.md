# STORY-402 : Les comptes de trésorerie sont restés ORG-KEYÉS — « une org = une société » recâblé par la porte de derrière

Status: in_progress

**Épic :** EPIC-022 — Rapprochement bancaire (relevés + mobile money) · *clôturé le 2026-07-30 ;
cette story y atterrit sans le rouvrir, comme STORY-401 dans EPIC-011/012*
**Service :** `balance-service` (`:3007`) — `modules/tresorerie`
**Points :** 5 · **Sprint :** S20 · **Complexité :** high
**Origine :** relevée le **2026-08-25** en instruisant **FE-049** (rapprochement bancaire) —
c'est-à-dire en cherchant, contrôleur par contrôleur, ce qui était réellement actionnable.

---

## Le fait, relevé à la source

Trois contrôleurs, deux portées, et elles ne s'accordent pas :

```ts
// rapprochement.controller.ts       ✅ scopé au dossier
@Controller({ path: 'dossiers/:dossierId/rapprochement', version: '1' })

// comptes-tresorerie.controller.ts  ⛔ scopé à l'ORGANISATION
@Controller({ path: 'tresorerie/comptes', version: '1' })

// releves.controller.ts             ⛔ scopé à l'ORGANISATION
@Controller({ path: 'tresorerie/:compteId/releves', version: '1' })
```

⛔ **On rapproche dans un dossier des relevés qui n'appartiennent à aucun dossier.**

---

## Ce que ça coûte, concrètement

Un compte bancaire appartient à une **société**, jamais à un cabinet. Tel quel, un cabinet de
vingt clients voit **une seule liste** de comptes bancaires : ceux de la boulangerie, du garage et
de la pharmacie, mélangés, sous le nom du dossier ouvert.

⚡ **C'est le risque n°2 dans sa forme la plus pure** — celui que tout le bloc FE-EPIC-008 a
démonté, réinstallé **par la porte de derrière** : aucune erreur, aucun symptôme, des chiffres
plausibles. Et le rapprochement bancaire est précisément l'écran où une confusion de périmètre
produit des **appariements faux** plutôt qu'un simple affichage trompeur.

⛔ **Non contournable côté client, et c'est ce qui distingue cette story des précédentes.** Les
contournements de FE-030, FE-043 ou FE-044 étaient pauvres mais possibles. Ici, le DTO de compte
**ne publie aucun `dossierId`** : le front ne peut ni filtrer, ni avertir, ni même *savoir* qu'il
affiche les comptes d'un autre client. Il n'y a rien à dégrader — il n'y a rien à lire.

⇒ **Conséquence pour FE-049 : la story frontend n'est PAS entièrement actionnable.** Le volet
« relevés » attend celle-ci. Le volet rapprochement proprement dit (`dossiers/:id/rapprochement`)
l'est, lui, dès aujourd'hui.

---

## Périmètre

**Inclus**

- Les deux familles passent sous `dossiers/:dossierId/…` :
  `dossiers/:dossierId/tresorerie/comptes` et `dossiers/:dossierId/tresorerie/:compteId/releves`.
- `DossierGate` (celui de STORY-357) appliqué aux deux, avec les mêmes refus que le reste du
  service — `DOSSIER_INTROUVABLE`, `DOSSIER_ARCHIVE` sur les écritures seules (D9).
- `dossierId` **publié au contrat** sur le DTO de compte et sur celui de relevé : sans lui,
  aucun client ne peut vérifier ce qu'il affiche, et l'écart se reproduirait silencieusement au
  prochain écran.
- **Migration des documents existants.** ⚠️ C'est la moitié qui coûte, et elle n'est pas
  mécanique : un compte bancaire déjà saisi n'a **pas** de dossier, et rien dans la donnée ne dit
  lequel choisir. Une org à **un seul** dossier se migre sans ambiguïté ; une org à plusieurs
  demande un arbitrage — à trancher à la conception, et à **écrire**, jamais à deviner en script.
- L'index d'unicité suit la nouvelle clé.
- ⚡ **La garde d'exercice clos de l'import**, qui est le dégât CONCRET de cette portée et qui
  s'est révélé en instruisant la maquette FE-049 : `releves.service.ts` ne connaît pas de dossier,
  il résout donc « Mon cabinet » et retombe sur l'`orgId` s'il ne le trouve pas
  (`const dossierId = dossierCabinet ?? orgId;`). ⇒ **un relevé s'importe dans un exercice CLOS du
  client**, alors que le pointage (dossier-scopé, lui) le refuse en `EXERCICE_CLOS`. Deux gardes
  du même service disent le contraire l'une de l'autre sur la même période, et c'est la
  permissive qui écrit. Le re-scopage la referme mécaniquement — **à condition qu'un test le
  prouve**, sans quoi rien ne dira qu'elle a jamais été ouverte.

**Hors périmètre**

- `profil-societe` et `profil-societe/ocr`, org-keyés eux aussi et **explicitement exclus de
  STORY-236**. Ils ont leur propre séquence (elle conditionne FE-040/041/042) et les mélanger ici
  ferait une story dont on ne saurait pas dire si elle est finie.
- `balances/suggest-comptes` et `referentiels` : org-keyés **à juste titre** — ils lisent le
  référentiel du **cabinet**, aucune donnée de dossier n'y transite. Vérifié avant de les écarter,
  pour ne pas fabriquer un faux positif de plus dans cette liste.

---

## Conception — les trois décisions écrites avant d'être codées

### D-402-1 · Règle de migration des documents existants (AC-5)

**Cible : le dossier « Mon cabinet »** (`estLeCabinet: true`) de l'organisation, pour
`comptes_tresorerie` — exactement le rattachement que **STORY-356** a appliqué aux 7 autres
collections du service.

⚡ **Ce n'est pas un arbitrage, c'est la mise en base de ce que le code résolvait DÉJÀ à chaque
appel.** `comptes-tresorerie.service.ts` et `releves.service.ts` font tous deux
`resoudreDossierIdCabinet(orgId) ?? orgId` : le dossier lu aujourd'hui pour la ventilation et pour
la garde d'exercice **est** le cabinet. Rattacher au cabinet ne change donc **aucun comportement
observé** — cela fige une résolution qui était refaite à chaque requête, et qui retombait
silencieusement sur l'`orgId` quand elle échouait.

**Org à plusieurs dossiers — la réponse explicite que l'AC-5 exige : on ne devine pas, et on ne
demande pas non plus.** Rien, dans un compte saisi avant cette story, ne dit de quel client il
est : ni le libellé (libre), ni le compte comptable (`521` est une racine partagée), ni l'auteur.
Choisir « le seul dossier actif » ou « le plus récent » **fabriquerait une provenance** — la
faute exacte que STORY-370 interdit ailleurs dans ce service. Le cabinet est le seul rattachement
que la donnée justifie.

⛔ **Conséquence assumée, à annoncer au cabinet** : un compte bancaire du client X saisi avant
cette story apparaît sous « Mon cabinet », **pas** sous le dossier de X. Le geste de reprise est
de le **re-déclarer** dans le dossier du client puis d'y **ré-importer** ses relevés — l'empreinte
anti-doublon étant portée par `(dossier, compte, checksum)`, le ré-import n'a rien à dédupliquer
contre l'ancien compte. Aucune route de ré-affectation n'est ouverte ici : elle relève de
STORY-407 (retrait d'un relevé), qui n'existe pas encore.

⚠️ **Les lignes de relevé ne se résolvent JAMAIS par leur `orgId`** : `lignes_releve.dossierId`
est celui **de leur compte** (`compteTresorerieId`), jamais celui du cabinet résolu à part. Les
deux donnent aujourd'hui le même résultat — et c'est précisément pourquoi il faut écrire lequel
fait foi : une ligne dont le dossier divergerait de son compte serait **invisible depuis le
dossier qui l'a importée tout en restant comptée dans ses totaux**, soit le mode de panne muet que
cette story ferme.

**Zéro orphelin, sinon sortie en erreur** — même discipline que STORY-356 : `dossierId` n'est
rendu `required` qu'une fois la migration convergée.

### D-402-2 · L'index unique obsolète se supprime NOMMÉMENT

⚠️ **Mongoose crée les nouveaux index et ne supprime JAMAIS les anciens** (leçon STORY-357).
`comptes_tresorerie` porte aujourd'hui `{orgId, libelle}` **unique**. Laissé en place à côté du
nouveau `{dossierId, libelle}`, il refuse en `E11000` que deux dossiers du même cabinet déclarent
chacun « BOA — compte courant » : **exactement la collision que cette story vient corriger**, mais
sans plus aucune ligne de code applicative pour la nommer — le symptôme serait un 409
« libellé existant » sur un libellé que le dossier n'a jamais utilisé. La migration le **drop**
explicitement, et la vérification docker l'observe sur `db.comptes_tresorerie.getIndexes()`.

Même geste pour `lignes_releve` : `{orgId, compteTresorerieId, checksumLigne}` →
`{dossierId, compteTresorerieId, checksumLigne}`. Celui-là n'est pas nuisible (un compte
n'appartient qu'à un dossier, les deux clés sont équivalentes en effet), mais le laisser ferait
mentir l'invariant « aucun index d'unicité de ce service ne reste préfixé `orgId` » que
STORY-236 a posé et gardé par un test.

### D-402-3 · Ce que ce re-scopage NE ferme PAS — hooks inertes nommés

- `RelevesRepository.listerParOrg` (écarts demandés **sans** `compteId`) et
  `trouverUneParOrg` (qualification d'un écart par `ligneId` seul) restent **org-larges** : ce
  sont deux lectures du module `rapprochement`, et elles sont le périmètre nommé de **STORY-411**.
  Elles survivent délibérément à ce re-scopage — le commentaire de code le dit, pour que la
  prochaine lecture ne les prenne pas pour un oubli.
- L'index `{orgId, lignesReleve}` **unique partiel** d'`appariements` reste préfixé `orgId`. Sa
  justification d'origine tombe (les relevés cessent d'être visibles depuis tous les dossiers du
  cabinet) mais la contrainte reste **strictement plus forte** que son équivalent dossier-keyé :
  la relâcher n'apporterait rien et rouvrirait la porte au même mouvement bancaire justifiant deux
  comptabilités. Seul le **commentaire** qui la motive est corrigé — laisser une justification
  devenue fausse est ce qui fait revenir un défaut.
- `profil-societe` et `profil-societe/ocr` : hors périmètre, séquence propre (cf. *Périmètre*).

---

## Critères d'acceptation

1. Les comptes de trésorerie et leurs relevés se lisent et s'écrivent sous `dossiers/:dossierId/…`,
   et **uniquement** là.
2. Un compte créé dans le dossier A est **invisible** depuis le dossier B de la même organisation —
   un test le prouve sur deux dossiers d'un même tenant, pas sur deux tenants (le cloisonnement
   inter-organisations, lui, n'a jamais été en cause).
3. `dossierId` est publié au contrat sur les deux DTO de lecture.
4. Les deux familles répondent aux refus de dossier comme le reste du service, `DOSSIER_ARCHIVE`
   sur les écritures seules.
5. La règle de migration des documents existants est **écrite** dans la story avant d'être codée,
   et le cas « org à plusieurs dossiers » a une réponse explicite — fût-elle « on ne migre pas
   automatiquement, on demande ».

---

## Notes

- ⚠️ **Même forme que STORY-401, et le même piège d'épic** : EPIC-022 est clôturé depuis le
  2026-07-30. Cette story y atterrit **sans le rouvrir** — elle corrige une portée, elle n'ajoute
  pas de fonction.
- ⚠️ **Ce que la migration de STORY-236 n'a pas emporté** est plus large qu'on ne le croit :
  `balance`, `cahiers`, `rattachement`, `fiscal`, `exercices`, `imports`, `pieces/ocr` sont passés
  au dossier ; `tresorerie` (2 contrôleurs) et `profil-societe` (2 contrôleurs) ne le sont pas.
  ⇒ Le relevé complet vaut mieux que la découverte au coup par coup : c'est **la troisième fois**
  qu'un écran frontend découvre un survivant org-keyé en essayant de le consommer.
- ⚠️ **Deux voisines, ouvertes le même jour par la même lecture, et qui ne se recouvrent pas** :
  **STORY-411** (les écarts sans `compteId` lisent les relevés de toute l'organisation — un appel
  org-large *à l'intérieur* d'un service dossier-scopé, qui survivra à ce re-scopage s'il n'est pas
  nommément corrigé) et **STORY-407** (aucune route ne retire un relevé importé — ce qui rend
  l'erreur de compte que cette portée rend probable **définitive**).
- Consommateur nommé : **FE-049**.

---

## Progress Tracking

**Statut : `in_progress`** — branches `MNV-402` ouvertes sur `docs` et `balance-service`.
Conception écrite (D-402-1/2/3) **avant** le code, comme l'AC-5 l'exige.
