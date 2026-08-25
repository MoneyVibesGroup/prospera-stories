# STORY-402 : Les comptes de trésorerie sont restés ORG-KEYÉS — « une org = une société » recâblé par la porte de derrière

Status: ready-for-dev

**Épic :** EPIC-022 — Rapprochement bancaire (relevés + mobile money) · *clôturé le 2026-07-30 ;
cette story y atterrit sans le rouvrir, comme STORY-401 dans EPIC-011/012*
**Service :** `balance-service` (`:3007`) — `modules/tresorerie`
**Points :** 5 · **Sprint :** S20
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

**Hors périmètre**

- `profil-societe` et `profil-societe/ocr`, org-keyés eux aussi et **explicitement exclus de
  STORY-236**. Ils ont leur propre séquence (elle conditionne FE-040/041/042) et les mélanger ici
  ferait une story dont on ne saurait pas dire si elle est finie.
- `balances/suggest-comptes` et `referentiels` : org-keyés **à juste titre** — ils lisent le
  référentiel du **cabinet**, aucune donnée de dossier n'y transite. Vérifié avant de les écarter,
  pour ne pas fabriquer un faux positif de plus dans cette liste.

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
- Consommateur nommé : **FE-049**.
