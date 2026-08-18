# Story AP-INT-2 : Lever les vérifications en attente du backend — **le point de rendez-vous unique** des tests bloqués de la console

Status: ready-for-dev *(déclencheur atteint — voir §Déclencheur)*

**Epic :** AP-EPIC-000 — Socle admin & sécurité
**Points :** 3 · **Sprint :** 9 *(à tirer dès que le backend atterrit — voir §Déclencheur)* · **App :** `frontend-admin-panel`
**API :** kyc-service (:3002), admin-panel BFF (:3010)
**Réf. plan :** `frontend-sprint-status.yaml` · **Origine :** `AP-INT-1` · `tickets/TICKET-BACKEND-ap-int-1-revue-kyc-sans-document.md`
**Backend prêt :** ✅ **OUI — vérifié le 2026-08-18.** `STORY-179`, `180`, `181`, `182`, `183` et `184` sont **toutes `done`**. ⚠️ Le périmètre a **rétréci** entre-temps : `STORY-182` a été consommée par **AP-26** *(`If-Match`)* et `STORY-184` par **AP-27** *(référence de dossier)* — vérifier ce qui reste réellement à lever avant de tirer les 3 points.
**Dépendances :** `AP-INT-1` *(livrée)*
**Maître Scrum (frontend) :** MightyRaven

---

## À quoi sert cette story

**C'est le seul endroit où chercher ce qui n'est pas vérifié dans la console.**

AP-INT-1 a écrit les tests qui manquaient. Certains ne peuvent pas s'exécuter tant que le backend n'a
pas livré : ils sont dans le dépôt, marqués, et **ils se présentent aujourd'hui comme une couverture
alors qu'ils n'en sont pas une**. Les laisser éparpillés dans un fichier e2e revenait à parier que
quelqu'un rouvrirait le bon fichier au bon moment.

> ⚠️ **Un `test.skip` n'est pas un test qui passe.** La suite est verte, le rapport dit « 29 tests »,
> et trois d'entre eux n'ont rien vérifié. C'est la pire des situations : un trou qui a l'apparence
> d'une garantie. Cette story existe pour que ce trou ait une **adresse** et une **date de fermeture**.

---

## Déclencheur

Cette story se tire **dès que `STORY-179` et `STORY-180` sont mergées** — pas à la fin du sprint
backend. Ce sont elles qui rendent la revue KYC observable ; les quatre autres ferment des points
plus fins et peuvent suivre.

| Backend | Ce que ça débloque ici |
|---|---|
| **`STORY-179`** *(URL présignée publique)* | § A — le document s'affiche enfin |
| **`STORY-180`** *(jeu de données de revue)* | § B — les trois `test.skip` s'exécutent |
| `STORY-181` *(DTO typé)* | § C — les casts manuels disparaissent |
| `STORY-182` *(concurrence)* | § D — l'écran de conflit devient atteignable **ou** est supprimé |
| `STORY-183` + `184` *(historique, référence)* | § E — l'en-tête et l'historique cessent d'afficher des valeurs neutralisées |

---

## Périmètre — les vérifications à lever, une par une

### A. Le `test.fail()` sur l'URL présignée *(dépend de `STORY-179`)*

`e2e/integration-gate.spec.ts` porte un test **délibérément marqué en échec attendu** : « l'URL
présignée est joignable DEPUIS LE NAVIGATEUR ». Il charge la pièce depuis le contexte de la page,
pas depuis Node — parce qu'une URL ne se vérifie qu'avec le client qui la consommera *(FE-023)*.

⇒ **Retirer l'appel à `test.fail()`.** ⚠️ Si le test devient vert alors que `test.fail()` est encore
là, Playwright le signale en **échec** : c'est voulu, c'est le rappel automatique que cette story
doit être tirée.

### B. Les trois `test.skip` faute de dossier *(dépend de `STORY-180`)*

Trois tests se sautent quand la file `UNDER_REVIEW` est vide : le contrat `url`/`reviewStatus` du
détail, l'URL présignée, et le **parcours navigateur de la revue KYC**.

⇒ Ces `skip` doivent devenir des **exécutions réelles**. Si un `skip` subsiste après `STORY-180`,
c'est que le seed ne produit pas ce qu'il promet — et c'est un défaut de la story backend, pas une
tolérance à accorder ici.

### C. Les casts manuels de la fiche détail *(dépend de `STORY-181`)*

`orgs-client.ts` recaste `dto.identity`, `dto.kyc` et `dto.entitlements` à la main : le Swagger du
BFF les déclare en `type: Object`, donc les types générés valent `Record<string, never>`.

⇒ Régénérer *(`npm run gen:api`)*, **supprimer les casts**, et vérifier que le typecheck passe sans
eux. C'est la seule preuve que le contrat protège réellement quelque chose.

### D. L'écran de conflit KYC *(dépend de `STORY-182`)*

`KycConflictError` et son rendu existent et sont **inatteignables** — rien en amont ne produit le
signal. Deux issues, selon l'arbitrage de `STORY-182` :

- **le service porte la concurrence** ⇒ ajouter le test à deux sessions *(deux onglets, même dossier,
  le second voit le conflit au lieu d'écraser)* ;
- **le dernier gagne** ⇒ **supprimer** l'écran et l'erreur. ⚠️ Les garder « au cas où » est ce qui
  fait croire à la relecture que le cas est traité.

### E. Les valeurs neutralisées de l'en-tête *(dépend de `STORY-183` + `184`)*

Aujourd'hui : `ref` reçoit l'`orgId` *(l'écran affiche « ORG-x · ORG-x », redondant mais vrai)*,
`attempt`/`total` sont codés en dur à `1/1` *(ce qui masque la mention)*, `history` et la timeline de
la fiche sont vides en permanence.

⇒ Brancher les vrais champs, et vérifier la mention « soumission n sur N » sur un dossier **resoumis**.

### Hors périmètre

- Le décompte de pièces de la file KYC. ⚠️ **C'est une dette FRONT, pas une attente backend** : le
  ticket a refusé d'en faire une demande *(le serveur devrait ouvrir chaque dossier pour alimenter
  une colonne d'agrément)*. L'écran doit **cesser d'afficher « 0 pièce »**, ce qui est faux — à
  traiter dans une story d'écran, pas ici.
- `registrationId` / `memberSince` / `verified` : inventions front actées, leur retour est une
  décision PO.

---

## Critères d'acceptation

- [ ] **Plus aucun `test.skip` ni `test.fail()`** dans `e2e/integration-gate.spec.ts` — ou chacun de
      ceux qui restent est justifié par écrit dans cette story.
- [ ] ⚡ **Le document réel s'affiche** dans la visionneuse, vérifié dans un navigateur depuis
      `:3110`. C'est la preuve unique que la revue KYC est utilisable.
- [ ] Le parcours complet de revue passe de bout en bout : file → dossier → marque par pièce →
      décision → le dossier quitte la file.
- [ ] `orgs-client.ts` ne contient plus de cast de contournement, et le typecheck passe.
- [ ] L'écran de conflit est soit **testé**, soit **supprimé** — pas laissé en l'état.
- [ ] Suite verte **sans skip masquant** : le nombre de tests exécutés est vérifié, pas seulement la
      couleur du rapport.

---

## Definition of Done

- [ ] Les 6 critères vérifiés · `lint` 0 · `tsc` propre
- [ ] ⚡ Une capture ou un enregistrement du **document réel affiché** — c'est ce qui n'a jamais
      existé depuis le début de la console
- [ ] Chaque § A→E est soit levé, soit re-tracé avec sa raison *(une story de rattrapage qui laisse
      un trou sans le nommer recrée exactement le problème qu'elle ferme)*
- [ ] Branche `ap-int-2`, commits préfixés `AP-INT-2`, PR rebase-mergée sur `dev`

---

## Historique

- **2026-08-04** — créée par `AP-INT-1`, à la demande du PO : regrouper en **un seul endroit** les
  vérifications que le backend ne permet pas encore, plutôt que de les disséminer dans le code de
  test. ⚡ Le motif est celui qui a déjà coûté cher deux fois à ce programme : *une dette confortable
  est une dette invisible*.
