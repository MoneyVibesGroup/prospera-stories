# STORY-442 : Le `contexte` d'un événement d'audit est stocké et jamais publié — une ligne `EXPORT_EFFECTUE` ne dit pas ce qui a été exporté

Status: done

**Épic :** EPIC-012 — Validation, immutabilité, exercices, audit
**Service :** `bilan-service`
**Points :** 2 · **Complexité :** low · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-034** (cycle brouillon → validé, snapshot immuable, piste d'audit), 2026-08-27.
Relevé en lisant les contrôleurs de `bilan-service` sur `origin/dev`.

---

## Le fait

`AuditEvent` porte un champ `contexte` documenté ainsi dans le schéma :

> *Contexte additif (STORY-073) — porté par `EXPORT_EFFECTUE` : format, statut, version,
> `snapshotId`, `versionHypothesesId`, `modeleVersion`|`moteurVersion`, empreinte.*

`AuditEventResponseDto.from()` construit `{ id, type, userId, cible, horodatage }` — **`contexte`
n'y est pas**. La donnée la plus riche du journal est écrite, indexée, conservée… et invisible.

Une ligne « EXPORT_EFFECTUE » sans son contexte ne répond à aucune des questions qu'on lui pose :
**quel format** ? **quelle version** ? **le fichier remis au client correspond-il au snapshot qui
fait foi** ?

## Critères d'acceptation

- [x] AC-1 — `AuditEventResponseDto` publie `contexte: Record<string, string|number|null> | null`.
- [x] AC-2 — Les documents antérieurs (sans le champ) rendent `null` — rétrocompatibilité déjà
      prévue par le schéma.
- [x] AC-3 — Le `contexte` est **inerte pour le filtrage** : il ne devient pas un critère de
      requête (ce serait un index non prévu sur un champ libre).
- [x] AC-4 — L'OpenAPI documente les clés connues par type d'action, sans les figer au type.

## Conséquences ailleurs

- Se livre avec **STORY-443** (le journal n'a ni pagination ni fenêtre) : les deux touchent le
  même DTO et la même route.
- Sans elle, l'écran d'export **FE-038** ne pourra pas répondre à « quelle version le client
  a-t-il reçue ? » depuis le journal.


## Progress Tracking

**Statut : `done`** — implémentée, validée, revue (code + sécurité), **vérification docker rejouée
sur l'état final**, PR `bilan-service` **#74** (2 commits) rebase-mergée sur `dev` le 2026-09-03.

Branches créées **avant** la première ligne de code :

```
docs             MNV-442
bilan-service    MNV-442
```

⚠️ **Périmètre tenu** : la fiche note que la story « se livre avec **STORY-443** » (pagination du
journal). STORY-443 **n'est pas** dans cette livraison. ⚠️ La revue signale toutefois que cette PR
**augmente le coût** du défaut que 443 doit fermer : la route rend le journal **entier** du dossier,
et chaque ligne `EXPORT_EFFECTUE` gagne ~235 octets — à peu près un doublement du poids d'une ligne.
443 devient la prochaine chose à livrer, plutôt qu'un suivi optionnel.

### Ce qui est livré

| AC | Livré |
|---|---|
| AC-1 | `contexte` publié. |
| AC-2 | `null` pour un document antérieur au champ **et** pour toute action qui n'en porte pas. |
| AC-3 | **Inerte pour le filtrage**, dit à l'endroit où quelqu'un voudrait l'ajouter, et figé par un e2e discriminant. |
| AC-4 | `additionalProperties` — **jamais un `object` opaque** (dette STORY-181/376) — les huit clés documentées, et le fait qu'elles **ne sont pas figées au type**. |

### ⚡⚡ Revue de code — six affirmations du contrat que le code ne tenait pas

Aucun défaut de **comportement**. Six défauts de **prose publiée**, c'est-à-dire de ce que le client
va croire :

1. **`format` documenté `PDF|XLSX`** — le code écrit `pdf`/`xlsx` en **minuscules**
   (`FormatExport`). Un écran qui compare à `'PDF'` d'après l'exemple publié ne matche **jamais**
   aucune ligne, sans erreur.
2. **L'exemple publiait `statut: 'VALIDE'`**, une valeur que le code n'écrit **jamais** : elle
   appartient au cycle de vie du **jeu d'états**, pas à la **source** de l'export
   (`BROUILLON`|`VERSION`). Un jeu `VALIDE` exporté sans `?version` produit `statut: "BROUILLON"` —
   deux vocabulaires qui **se contredisent sur la même ligne** (motif STORY-403).
3. ⛔ **`empreinte` présentée comme le sha256 du fichier remis.** C'est celui du **contenu
   canonique**, calculé **avant datation et avant rendu** : un PDF embarque sa date de création et
   n'est pas reproductible octet à octet. Un contrôleur qui ferait `sha256sum` sur le fichier reçu
   conclurait **toujours** à une altération, sans que rien n'ait bougé.
4. « Les deux exports peuplent des sous-ensembles différents » — **faux** : ils écrivent toujours
   les **mêmes huit clés**, seul varie lesquelles valent `null`.
5. La justification du `?? null` était fausse : **Mongoose applique `default: null` à
   l'hydratation**, donc un document antérieur rend `null`, jamais `undefined` (piège déjà fiché en
   STORY-184). Le filet reste — il couvre une lecture `.lean()` — mais ne porte plus une raison
   inexacte.
6. `nullable` posé **à côté** d'un `oneOf` sans `type` frère n'a pas d'effet garanti en OpenAPI 3.0,
   et **chaque** ligne d'export porte au moins deux `null`. Déplacé **dans** chaque branche.

### ⛔⛔ Et ma vérification docker ne pouvait pas voir ① ni ②

J'avais semé la ligne de test en **recopiant l'exemple du DTO** — c'est-à-dire **la prose à
valider**. Une vérification qui relit une donnée fabriquée à partir de ce qu'elle prétend éprouver
ne prouve rien. Elle est rejouée sur la **seule ligne réellement produite par le code** :
`format: "xlsx"`, `statut: "BROUILLON"`, `version: null`, `moteurVersion: "bilan-engine@1.9.0"` —
exactement ce que le contrat corrigé documente.

### ⚡ Revue de sécurité — aucun bloquant, un durcissement traité autrement

La carte est publiée **sans liste blanche** : le schéma est un chemin `Mixed`, la projection recopie
par référence, le contrat autorise toute clé. Rien de sensible n'y entre aujourd'hui — l'inventaire
exhaustif des écrivains donne **deux** sites d'appel, dont un seul non nul, et les huit valeurs sont
**toutes calculées côté service**, aucune ne venant d'un corps de requête. Mais **toute clé future
sortirait toute seule**, et le diff qui la verse serait un appel d'une ligne dans un contrôleur.

⛔ Poser une liste blanche contredirait **frontalement** l'AC-4, qui déclare l'inverse de façon
délibérée. Le constat est donc traité par un **avertissement au point d'écriture**
(`AuditService.journaliser`), là où une story future le lirait — même remède qu'au constat de portée
de STORY-441.

⚠️ **L'empreinte lisible par un `TENANT_USER` n'est pas un affaiblissement** : la route d'audit et
la route d'export portent la **même** chaîne d'habilitation — qui peut lire l'empreinte peut déjà
télécharger le document qu'elle hache — et le journal n'expose aucune route de mutation. Avant, la
preuve était écrite et **illisible** ; une preuve non consultable ne prouve rien.

⚠️ Deux nuances préexistantes, désormais **dites au contrat** parce que cette ligne est maintenant
présentée comme une preuve : l'empreinte ne porte pas sur les octets remis (ci-dessus), et une
erreur d'audit est **avalée** pour ne jamais faire échouer un export — **l'absence d'une ligne ne
prouve pas l'absence d'export**.

### Vérification

Lint 0 warning · build OK · **1 578** unitaires + **417** e2e verts · couverture
**98,79 / 93,87 / 98,73 / 98,81** · **2 mutations rouges par assertion** (retirer le `?? null` ;
faire du contexte un critère de requête — mutée en filtrage **en mémoire**, donc compilable, pour
qu'un rouge d'erreur de compilation ne prouve rien).

**Vérification docker rejouée sur l'état final**, après `docker restart` — ⚠️ le hot-reload avait
menti une nouvelle fois, le conteneur ne servait pas encore le champ :

| critère | mesure par la route réelle |
|---|---|
| AC-1 | les huit clés servies sur la ligne **produite par le code** |
| AC-2 | ligne antérieure au champ ⇒ `contexte: null`, **clé présente** dans le JSON |
| AC-3 | un paramètre `contexte` ne change rien : mêmes lignes rendues |
| AC-4 | `additionalProperties: {oneOf: [string, number], nullable dans chaque branche}` |
