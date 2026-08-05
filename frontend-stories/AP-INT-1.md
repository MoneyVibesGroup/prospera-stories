# Story AP-INT-1 : La console atteignait-elle vraiment son backend ? — audit d'AP-INT-0 et réparation de trois défauts

Status: done ✅ *(exécutée le 2026-08-04, branche `ap-int-0`)*

**Epic :** AP-EPIC-000 — Socle admin & sécurité
**Points :** 5 · **Sprint :** 8 *(prolonge AP-INT-0, même branche)* · **App :** `frontend-admin-panel`
**API :** admin-panel BFF (:3010), auth-service (:3001), kyc-service (:3002), platform-catalog-service (:3003)
**Réf. plan :** `frontend-sprint-status.yaml` · **Ticket ouvert :** `tickets/TICKET-BACKEND-ap-int-1-revue-kyc-sans-document.md`
**Backend prêt :** ✅ pour ce qui est livré ici — ⛔ **six manques découverts**, portés par `AP-INT-2`
**Dépendances :** AP-INT-0 *(bascule des 4 clients)*
**Maître Scrum (frontend) :** MightyRaven

---

## Le problème

AP-INT-0 a basculé les quatre clients sur le vrai backend et déclaré la console branchée. **Un
audit ligne à ligne montre que l'un des quatre n'atteignait jamais son service.**

L'écran de revue KYC visait `/kyc/admin/kyc/:orgId`. Le préfixe logique `/kyc` n'étant pas retiré,
`resolveApiUrl` produisait `:3002/api/v1/**kyc/**admin/kyc/:orgId` — alors que la route réelle est
`/api/v1/admin/kyc/:orgId` *(`@Controller('admin/kyc')`)*. **404 sur tous les dossiers**, rendu à
l'écran comme « cette organisation n'a aucun dossier ».

> ⚡ **Pourquoi 275 tests verts ne l'ont pas vu.** Ils mockent `apiFetch` : ils n'assertent donc que
> le chemin **logique** — celui-là même qui était faux. Un test unitaire ne peut pas distinguer un
> chemin plausible d'un chemin juste ; seule la résolution d'URL ou un appel réel le peut.

**Cause racine du chemin faux, et elle est structurelle :** le préfixe logique `/admin` est
monopolisé par le BFF depuis l'arbitrage d'AP-INT-0. Les routes d'administration de `kyc-service`
n'avaient donc **plus aucun préfixe atteignable** — le renommage ne suffisait pas, il fallait un
préfixe qui se réécrive.

---

## Ce qui a été livré

### 1. `/kyc-admin` — un préfixe logique qui se réécrit en `/admin/kyc`

`ServiceRoute` reçoit un champ `rewrite`. Le contrat de préfixes reste stable, et le cas où « un
préfixe logique n'est pas un nom d'hôte mais une **famille de routes** » est désormais nommé dans le
code. Couvert par `services.test.ts` — **le seul test unitaire capable de voir ce type de défaut**.

### 2. La détection du 404 portait sur un champ qui n'existe pas

`fetchKycFile` testait `error.status`. `ApiError` expose **`statusCode`**. La branche « pas de
dossier » était donc morte : un 404 légitime remontait en écran d'erreur.

> ⚠️ **Le test le couvrait, et le validait faux.** Il fabriquait `Object.assign(new Error(), { status: 404 })`
> — une forme d'erreur que la production ne produit jamais. Il teste désormais un vrai `ApiError`,
> plus une panne réseau *(sans statut)*, qui ne doit surtout pas passer pour « pas de dossier ».

### 3. La visionneuse **dessinait** le document au lieu de l'afficher

`DocumentSheet` *(148 lignes)* reconstruisait une feuille RCCM/CFE à partir du type de pièce et de
l'extraction OCR. Assumé le temps des fixtures — **inacceptable après la bascule** : l'opérateur
croyait examiner un justificatif, il regardait un gabarit rempli par le front.

Le composant est **supprimé**. La visionneuse affiche le fichier à son URL présignée
*(`<iframe sandbox="">` pour les PDF, `<img>` pour les images)*, filigrane et traçage conservés.
`reviewStatus` est mappé et **pré-charge le brouillon de marques** — un dossier repris n'affiche plus
« non statuée » sur des pièces déjà tranchées.

⚠️ Le compteur de pages a été **retiré** : `pages` n'existe pas au contrat, valait `1` en dur, et
aurait menti sur un document de trois pages. Un PDF pagine lui-même.

### 4. Deux filtres sans serveur, offerts à l'utilisateur

`OrgsFilters` proposait un filtre « statut KYC » et cinq verticales inventées ; `fetchOrgs`
n'envoyait **ni l'un ni l'autre**. Cocher ne changeait pas une ligne, et la barre affichait
« Filtres actifs ». Ils sont remplacés par le **statut d'identité**, seul filtre réellement porté par
`ListOrgsQueryDto`, désormais envoyé.

> ⚠️ Le double de test **filtrait**, lui, sur ces deux critères : il testait l'écran « tel qu'il est
> conçu » et rendait le défaut invisible. Un double complice du défaut qu'il devrait révéler.

### 5. Les exigences d'environnement étaient inversées

Héritées de l'app cliente : le **BFF** et le **catalogue** — dont dépendent les trois écrans
principaux — étaient **optionnels** *(l'app démarrait pour échouer au premier clic)*, et
**expert-comptable**, qu'aucun écran n'appelle, était **requis**. Remis à l'endroit.

---

## Preuve — Integration Gate étendu

L'Integration Gate d'AP-INT-0 couvrait la liste et le catalogue en navigateur. **Il n'ouvrait ni la
fiche détail, ni la revue KYC** — c'est-à-dire précisément les écrans où vivaient les trois défauts.
22 → 29 tests :

- garde de non-régression sur le chemin `/admin/kyc` *(le mauvais chemin doit rester en 404)* ;
- contrat `url` + `reviewStatus` sur le détail d'un dossier ;
- idempotence de l'octroi *(201 puis 200)* et révocation — **aucune écriture d'entitlement n'était testée** ;
- trois parcours navigateur neufs : fiche détail, **revue KYC**, filtre réellement appliqué.

⚠️ **Ces e2e n'ont pas été exécutés dans cette passe** : ils exigent le stack docker et le seed
administrateur. Ils compilent et Playwright les liste — c'est tout ce qui est affirmé ici.

**Vérifié, en revanche :** `lint` 0 erreur · `tsc` propre · **287 tests unitaires verts** *(275 → 287)*.

---

## Ce que cette story n'a PAS pu faire — ⇒ `AP-INT-2`

En réparant le transport, six manques backend apparaissent. **Aucun ne se corrige côté front**, et
tous ont été tracés dans un ticket, converti en `STORY-179` → `STORY-184` *(backend, sprint 20)*.

Le plus lourd : `kyc-service` signe ses URL présignées sur l'endpoint **interne** de MinIO
*(`minio:9000`)*. La console affiche donc désormais le vrai document… **dans un cadre vide**, parce
que le navigateur ne peut pas résoudre cet hôte. C'est la leçon de FE-023, redécouverte sur un
second service.

⇒ **Toutes les vérifications qui en dépendent sont regroupées dans `AP-INT-2`**, y compris les trois
`test.skip` et le `test.fail()` déjà écrits dans ce dépôt.

---

## Definition of Done

- [x] Les 3 défauts corrigés, chacun avec le test qui l'aurait attrapé
- [x] `lint` 0 · `tsc` propre · 287 tests unitaires verts
- [x] Integration Gate étendu aux écrans non couverts *(écrit, non exécuté — cf. `AP-INT-2`)*
- [x] Six manques backend tracés en ticket **et** convertis en stories numérotées
- [ ] PR relue et mergée dans `dev`

---

## Convention Git

- Branche : **`ap-int-0`** *(prolonge la story précédente — même branche, commits préfixés `AP-INT-1`)*.

---

## Historique

- **2026-08-04** — créée après un audit d'intégration demandé sur la branche `ap-int-0`. Elle
  documente ce qu'AP-INT-0 croyait avoir livré et ce qui l'était réellement. ⚡ **La leçon à
  retenir :** un bug de transport rend invisibles tous les manques situés derrière lui — tant qu'un
  écran ne parle pas à son service, il ne peut rien apprendre de lui.
