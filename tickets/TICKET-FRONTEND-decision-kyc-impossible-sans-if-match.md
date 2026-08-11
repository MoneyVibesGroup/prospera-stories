# TICKET frontend — ⛔ la console ne peut plus approuver ni rejeter un dossier KYC (`428` systématique)

**Type :** régression fonctionnelle bloquante (contrat amont durci, client jamais adapté)
**Dépôt :** `frontend-admin-panel` (console `:3110`)
**Causé par :** **STORY-182** (`kyc-service`) — concurrence optimiste des décisions KYC
**Ouvert par :** STORY-184, 2026-08-11 *(constaté en lançant l'e2e navigateur, hors périmètre)*
**Priorité :** **Must** — l'acte central de la console est inopérant depuis STORY-182.

---

## Le problème

`STORY-182` a rendu l'en-tête **`If-Match` obligatoire** sur toute décision de dossier : une décision
doit nommer l'état sur lequel elle se fonde, faute de quoi l'appelant négligent écraserait le travail
d'un autre opérateur. La console, elle, n'a jamais été adaptée : `submitDecision` et `rejectFile`
(`src/features/kyc/api/kyc-client.ts`) appellent le BFF **sans aucun en-tête** :

```ts
await apiFetch(`/admin/orgs/${encodeURIComponent(input.orgId)}/kyc/approve`, {
  method: "POST",
});
```

**Toute décision retourne donc `428`**, avec le corps :

```json
{ "statusCode": 428, "error": "Precondition Required",
  "message": "Précondition requise : la décision doit nommer l’état du dossier sur lequel elle se fonde.",
  "code": "PRECONDITION_REQUISE" }
```

⚠️ **Ce n'est pas une hypothèse** : mesuré au `curl` sur le BFF `:3010` contre une stack neuve, puis
reproduit au navigateur — l'étape 5 de `e2e/kyc-chain.spec.ts` (« l'opérateur ouvre le dossier et
l'approuve depuis la console ») échoue sur ce point précis, après avoir correctement posé les marques
pièce par pièce. Les marques **par pièce** passent, elles : `STORY-182` les a délibérément laissées
hors précondition (deux opérateurs qui marquent deux pièces différentes ne sont pas en conflit).

⚡ **Pourquoi personne ne l'a vu** : les tests unitaires de la console mockent `apiFetch` et
n'assertent que le chemin logique appelé, jamais les en-têtes ; et l'e2e navigateur n'est pas dans la
CI backend. La console était verte et inopérante — le même motif qu'AP-INT-0.

## Ce que l'amont met à disposition (déjà servi, rien à livrer côté backend)

`GET /admin/orgs/{orgId}` (BFF) et `GET /kyc-admin/{orgId}` (`kyc-service`) portent **déjà** l'`etag`
**dans le corps de la réponse** — et non seulement dans l'en-tête HTTP, précisément parce que le BFF
ne relaie que les corps :

```json
{ "orgId": "…", "status": "UNDER_REVIEW", "reference": "KYC-0002",
  "etag": "\"adfdbb61524dd3ddf309a5febeb6acb1\"", "documents": [ … ] }
```

Cet ETag couvre le profil **et** les pièces courantes : il bouge dès qu'un dépôt ou une marque par
pièce survient pendant la revue.

## Résolution attendue

- [ ] `KycFile` transporte l'`etag` lu au chargement du dossier (`toKycFile` le laisse tomber
      aujourd'hui).
- [ ] `submitDecision` et `rejectFile` le rejouent en `If-Match` sur
      `POST /admin/orgs/{orgId}/kyc/approve|reject`.
- [ ] ⚠️ **L'ETag rejoué doit être celui de la lecture sur laquelle l'opérateur a jugé**, pas une
      relecture faite juste avant d'envoyer : relire pour obtenir un ETag frais désarme complètement
      la précondition — elle validerait un état que l'opérateur n'a jamais vu. C'est le seul piège de
      ce ticket, et il produit un code qui « marche ».
- [ ] ⚠️ Les marques **par pièce** restent **sans** `If-Match` (l'amont les refuserait autrement de
      juger nécessaire une précondition qu'il n'exige pas).
- [ ] `409` de l'amont → l'écran de conflit **existe déjà** (`KycConflictError`, jusqu'ici
      inatteignable) : le corps porte `details.raison`
      (`DECISION_CONCURRENTE` | `DOSSIER_MODIFIE`), `details.decisionGagnante` (verdict, auteur,
      date, motif) et `details.etagCourant`, rejouable après relecture.
- [ ] `428` ne doit plus pouvoir survenir : s'il survient, c'est un oubli d'en-tête, pas un conflit —
      le distinguer du `409` dans le message affiché.

## Definition of Done

- [ ] Un opérateur approuve et rejette un dossier depuis la console, contre le stack réel.
- [ ] L'étape 5 de `e2e/kyc-chain.spec.ts` repasse au vert **sans être assouplie**.
- [ ] Un test couvre l'en-tête effectivement envoyé (et non le seul chemin appelé) — sans quoi la
      régression se rejoue à l'identique.
