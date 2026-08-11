# TICKET frontend — la console affiche l'`orgId` en guise de référence de dossier KYC

**Type :** contrat amont désormais disponible, client à câbler
**Dépôt :** `frontend-admin-panel` (console `:3110`)
**Débloqué par :** **STORY-184** (`kyc-service` + `admin-panel`, mergée le 2026-08-11)
**Ouvert par :** STORY-184, 2026-08-11
**Priorité :** Should — l'écran est **vrai** aujourd'hui, il n'est pas exploitable.

---

## Le problème

`src/features/kyc/api/kyc-client.ts` rend, faute d'amont à l'époque (écarts nº2 et nº3 d'AP-INT-0) :

```ts
ref: dto.orgId,      // « 507f1f… · 507f1f… » à l'écran : redondant mais VRAI
attempt: 1, total: 1 // neutralise la mention « soumission n sur N »
```

Un `ObjectId` n'est **ni dictable au téléphone ni recopiable sans faute**, et il désigne
l'**organisation**, pas son dossier : il ne distingue donc pas deux soumissions successives. Il n'y a
rien à communiquer au cabinet — « votre dossier **KYC-0007** » est une phrase de support, « votre
dossier 507f1f77bcf86cd799439011 » n'en est pas une.

⚡ Le **filigrane** de la visionneuse porte `file.ref` : chaque page consultée est aujourd'hui
estampillée d'un identifiant d'organisation. Il se corrige **par ricochet**, sans qu'une ligne du
composant change.

## Ce que l'amont sert désormais (livré et mergé, rien à attendre)

Les deux champs sont **requis** au contrat — jamais absents, aucun repli à prévoir — et publiés par le
BFF sur **le détail comme sur la file** :

| Route | Champs |
|---|---|
| `GET /admin/orgs/{orgId}` → bloc `kyc` (BFF `:3010`) | `reference: "KYC-0007"`, `nombreSoumissions: 2` |
| `GET /kyc-admin/{orgId}` (`kyc-service`, source du détail) | idem |
| `GET /admin/kyc-reviews` → `items[]` (BFF) | idem, sur chaque ligne |

- **`reference`** est **stable dans le temps** : allouée une fois à la création du dossier, jamais
  recalculée, jamais réécrite — y compris après une décision ou une re-soumission. C'est cette
  chaîne-là qui part dans un e-mail au cabinet.
- **`nombreSoumissions`** est **un seul entier** : le rang de la soumission courante lui est égal (un
  dossier n'expose que son cycle le plus récent). L'écran ne doit afficher la mention que si
  `> 1` — c'est la **re**-soumission qui est une information.

⚠️ **La file et la fiche doivent afficher la MÊME référence.** Ne câbler que le détail ferait
apparaître `KYC-0007` sur la fiche et un `orgId` dans la file, pour le même dossier.

## Résolution attendue

```ts
// toKycFile (détail)
ref: dto.reference,
attempt: dto.nombreSoumissions,
total: dto.nombreSoumissions,

// fetchKycQueue (ligne de file)
ref: item.reference,
attempt: item.nombreSoumissions,
total: item.nombreSoumissions,
```

- [ ] Régénérer les types (`npm run gen:api`, stack backend démarrée) : `kyc.ts` et `admin.ts`
      portent les deux champs.
- [ ] Câbler le détail **et** la file (cf. extrait ci-dessus).
- [ ] Mettre à jour `kyc-client.test.ts` : le test « les champs inventés par le front sont
      neutralisés, pas fabriqués » **dit désormais l'inverse de la vérité** — il doit vérifier que
      `ref` vaut la référence et **n'est plus** l'`orgId`. Ajouter un cas `nombreSoumissions: 1` : un
      `1/1` codé en dur et un vrai `1` sont indiscernables à l'écran, seule une assertion les sépare.
- [ ] `KycFile.history` reste hors sujet ici (reliquat de `STORY-183`).

## Definition of Done

- [ ] L'en-tête de la revue affiche la référence, **et plus l'`orgId`**.
- [ ] « soumission 2/2 » apparaît sur un dossier re-soumis — le semis de démonstration de
      `kyc-service` en fournit un sur toute stack de développement (`docker compose down -v` puis
      `up`), précisément pour rendre ce cas observable.
- [ ] Le filigrane de la visionneuse porte la référence du dossier.

## Une implémentation de référence existe déjà — à titre de spécification

Le backend a écrit et **prouvé** ce câblage en local pendant STORY-184 (branche locale `MNV-184`,
commit `1ff5ad3`, non poussée faute de droits d'écriture sur ce dépôt). Il comprend l'e2e
Playwright **« 4 bis »** de `e2e/kyc-chain.spec.ts`, qui passe contre le stack réel : il vérifie que
l'en-tête affiche la référence, que l'`orgId` n'y est plus visible, et que « soumission 2/2 »
apparaît — le dossier re-soumis étant **choisi dans la file** par `nombreSoumissions > 1`, jamais
codé en dur. À demander si utile, plutôt qu'à réinventer.
