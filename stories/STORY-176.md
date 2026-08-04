# STORY-176 : La revue KYC **pièce par pièce** — un motif qui existe, un acte métier, un chemin

**Epic :** EPIC-025 — RBAC plateforme *(exploitation de la console)*
**Réf. :** ticket §D · **AP-03** · **STORY-107** (file KYC au BFF) · **STORY-128** (verdict par pièce)
**Découverte par :** AP-INT-0, en branchant la revue KYC
**Priorité :** Should Have — ⚠️ **arbitrage à rendre avant de coder** *(voir §Décision attendue)*
**Story Points :** 5 *(⬆️ 3→5 le 2026-08-04, voir §Amendement)*
**Statut :** À faire
**Créée le :** 2026-08-04
**Sprint :** 21
**Service :** ⚠️ **DEUX dépôts, deux branches, deux PR** — `kyc-service` (`:3002`) **puis**
`prospera-admin-panel-service` (`:3010`). Voir §Découpage.

---

## ⚡ Amendement du 2026-08-04 — la story reposait sur une prémisse fausse

**Telle qu'écrite ce matin, cette story ne pouvait pas passer sa propre recette.**

Son périmètre annonçait un corps `{ reason }` sur le rejet d'une pièce, et son critère nº 4 disait
que « un motif de rejet vide ou trop court est refusé **par l'amont** ». Vérification faite sur
l'OpenAPI vivant de `kyc-service` :

```ts
// types générés depuis /api/docs-json de kyc-service
KycAdminController_rejectDocument_v1: {
  parameters: { path: { orgId: string; documentId: string } };
  requestBody?: never;          // ⚠️ AUCUN corps accepté
  responses: { 200: AdminKycDocumentReviewDto, 401, 403, 404, 409 };
}
```

Et la description de la route l'assume explicitement : *« **Sans motif** : le `rejectionReason`
reste porté par le **dossier** (`POST /admin/kyc/{orgId}/reject`), qui est aussi le seul motif que
l'e-mail au cabinet sait transporter (FR-006). »*

**Conséquences si on livrait le proxy tel quel :**

1. Un pass-through **strict** relaierait fidèlement un corps que l'amont **ne lit pas**. Le motif
   partirait dans le vide, à un saut de plus qu'aujourd'hui.
2. Le critère nº 4 serait **invérifiable** : l'amont ne peut pas refuser un motif trop court, il ne
   le reçoit pas.
3. La console, elle, **envoie déjà ce motif** et l'exige à dix caractères minimum
   *(`features/kyc/api/kyc-client.ts`, `MOTIF_MIN_LENGTH` de `features/kyc/types.ts`)*. Un opérateur
   rédige donc, aujourd'hui, une phrase que personne ne lira jamais.

⇒ **Le proxy n'est pas le problème, c'est la moitié visible du problème.** Cette story gagne donc un
**premier incrément amont** : `kyc-service` accepte, valide et persiste un motif par pièce. Le
pass-through vient ensuite, et n'a alors plus rien d'un relais à vide.

---

## Le constat

Le BFF expose `POST /admin/orgs/:orgId/kyc/approve|reject` — la décision **globale** du dossier.
Mais `kyc-service` porte aussi
`POST /admin/kyc/:orgId/documents/:documentId/approve|reject` — la marque **par pièce**, qui est
très exactement ce que fait l'écran de revue : l'opérateur statue chaque document, puis consolide.

**Le BFF ne proxifie pas ces deux routes.** La console doit donc emprunter **deux chemins pour un
seul acte métier** : le BFF pour la décision, `kyc-service` en direct pour chaque pièce.

**Ce que ça coûte, concrètement :**

- Deux origines à autoriser au lieu d'une, deux surfaces à durcir.
- La jointure de droits se joue à deux endroits : rien ne garantit qu'un opérateur autorisé à
  marquer une pièce le soit à décider du dossier, ni l'inverse.
- Le jour où le BFF ajoute une règle *(journalisation, garde-fou, agrégation)*, elle s'appliquera à
  la décision globale et **pas** aux marques — une asymétrie que personne n'aura décidée.

**Et, depuis l'amendement :** le rejet d'une pièce ne transporte **aucune raison**. Le seul motif du
système est porté par le **dossier** — or la décision, elle, se prend **pièce par pièce**. Un
dossier de deux pièces dont une seule est refusée produit soit un motif global qui ne dit pas
laquelle, soit rien du tout.

---

## Pourquoi le motif du dossier ne peut pas en tenir lieu

C'est le même raisonnement que pour `grantedAt` en STORY-177 : un champ qui sert deux gestes n'en
sert bien aucun.

`rejectionReason` est posé par `POST /admin/kyc/:orgId/reject`, qui **rejette le dossier entier**.
Or l'écran de revue produit couramment un état où **certaines pièces passent et d'autres non** — le
dossier n'est alors pas rejeté, il attend une correction ciblée. Dans ce cas, `rejectionReason`
n'est même pas écrit : il n'y a pas eu de rejet global.

⇒ Le cabinet reçoit « votre dossier demande une correction » et **doit deviner laquelle**. C'est
exactement le genre d'aller-retour que la revue pièce par pièce (STORY-128) avait pour but de
supprimer.

---

## Décision attendue AVANT de coder

Deux issues se défendent, et le programme a déjà payé pour avoir laissé ce genre de question
ouverte *(cf. `GAP-bff-admin-sans-consommateur` : trois routes commandées pour un front qui ne
passait pas par le BFF)* :

| Issue | Conséquence |
|---|---|
| **① Proxifier** *(par défaut)* | Cohérent avec l'arbitrage d'AP-INT-0 : le BFF est le chemin de la console. Cette story livre le proxy |
| ② **Acter le direct** | Alors il faut le **dire dans `AP-03`** et dans la table de routage — pas le laisser découvrir à l'implémentation. **⚠️ L'incrément 1 reste dû dans les deux cas** : il ne dépend pas du chemin emprunté |

⚠️ **Ce qui ne se défend pas, c'est de ne pas trancher.**

---

## Découpage — deux incréments, dans cet ordre

⚠️ **Cette story déroge à la règle « 1 dépôt, 1 branche, 1 PR »**, et c'est délibéré : les deux
incréments sont **inséparables sur le fond** *(proxifier un motif que l'amont jette n'apporte
rien)*, mais **strictement séquentiels sur la forme**. Deux branches, deux PR, l'amont d'abord.
La dérogation est écrite ici pour qu'elle soit **décidée** et non subie.

### Incrément 1 — `kyc-service` : le motif par pièce existe *(3 pts, branche `MNV-176-kyc`)*

- **`RejectKycDocumentDto { reason: string }`** sur
  `POST /api/v1/admin/kyc/:orgId/documents/:documentId/reject`.
  - `@IsString()`, `@IsNotEmpty()`, **`@MinLength(10)`** — la même borne que celle que la console
    impose déjà côté saisie *(`MOTIF_MIN_LENGTH = 10`)*, pour que la règle vive **d'un seul côté**.
  - `@MaxLength(500)` — un motif est une phrase, pas un rapport.
  - **`forbidNonWhitelisted`** comme partout ailleurs : un champ inconnu fait **400**, il n'est pas
    ignoré.
- **Persistance** sur le document : `reviewRejectionReason`, à côté de `reviewStatus` et
  `reviewedAt` — et **`reviewedBy`**, qui manque aussi : un verdict sans auteur n'est pas auditable.
- **Relecture** : les trois champs sont exposés dans **`AdminKycDocumentDto`**, sinon une revue
  reprise réaffiche « rejetée » sans dire pourquoi ni par qui — le défaut exact que STORY-128 a
  laissé ouvert.
- **Effacement au remplacement** : quand le cabinet reverse une pièce, la nouvelle version repart en
  `PENDING` **sans** motif hérité. Traîner le motif de la version précédente ferait lire un reproche
  sur un document que personne n'a encore ouvert.
- ⚡ **`approve` ne prend pas de corps.** L'asymétrie est voulue : on ne motive pas une acceptation.

> **Hors périmètre de l'incrément 1 :** la **cause** d'un rejet (`CONTENU` vs `ILLISIBLE`), que la
> console distingue pourtant à l'écran (`fix` / `unreadable`). Un `reason` libre la porte en texte ;
> la typer relève d'un arbitrage produit, pas d'un correctif de contrat. **Tracé, pas traité** — à
> rouvrir si le besoin de statistiques par cause apparaît.

### Incrément 2 — BFF : un seul chemin *(2 pts, branche `MNV-176`)*

- `POST /admin/orgs/:orgId/kyc/documents/:documentId/approve`
- `POST /admin/orgs/:orgId/kyc/documents/:documentId/reject` *(corps `{ reason }`, **désormais réel**)*

Pass-through **strict** : mêmes codes, mêmes corps d'erreur, relais du bearer. Le BFF n'ajoute
aucune règle métier — il unifie le **chemin**, pas la sémantique. En particulier il **ne revalide
pas** la longueur du motif : la borne appartient à l'amont, la dupliquer créerait deux vérités qui
divergeront.

⚠️ Chemin sous `/admin/orgs/:orgId/...`, aligné sur les routes de décision existantes : la console
lit tout le dossier d'une organisation sous le même préfixe.

---

## Critères d'acceptation

**Incrément 1 — `kyc-service`**

1. `POST /admin/kyc/:orgId/documents/:id/reject` **exige** un `reason` ; un corps absent, vide ou de
   moins de 10 caractères répond **400**, avec le champ fautif nommé.
2. Le motif est **persisté** et relu par `GET /admin/kyc/:orgId` : `AdminKycDocumentDto` porte
   `reviewRejectionReason`, `reviewedBy` et `reviewedAt`.
3. `approve` **refuse** un corps (`400`) et laisse `reviewRejectionReason` à `null`.
4. Le dépôt d'une nouvelle version d'une pièce la remet en `PENDING` **sans motif hérité**.
5. L'OpenAPI décrit le DTO ; sa description ne dit plus « sans motif ».

**Incrément 2 — BFF**

6. Les deux routes existent et relaient vers `kyc-service` **sans altérer le corps**.
7. Les codes d'erreur amont sont **préservés** (400, 403, 404, 409, 422) — un pass-through qui
   écrase un 409 en 500 rend le conflit indiagnosticable.
8. Le bearer de l'opérateur est relayé ; le BFF n'emprunte **aucune** identité de service.
9. Un motif trop court est refusé **par l'amont** (400 relayé tel quel), **pas réinventé ici** —
   critère désormais vérifiable, ce qui était l'objet de l'amendement.
10. ⚡ Preuve navigateur depuis `:3110` : marquer une pièce **avec motif**, rouvrir le dossier et
    **relire ce motif**, puis décider du dossier — **par le seul BFF**, zéro appel direct à `:3002`.

---

## Definition of Done

- [ ] Arbitrage tranché et **consigné** dans `AP-03` et dans le ticket
- [ ] Les 10 critères vérifiés · `lint` 0 · couverture ≥ 90 %
- [ ] **Vérification docker** : rejeter une pièce avec motif → fermer → rouvrir le dossier → **le
      motif est là, avec son auteur et sa date**
- [ ] ⚡ La console est rebranchée : `submitDecision` n'emprunte **plus qu'un** amont, et le
      `json: { reason }` de `kyc-client.ts` cesse d'être un appel dans le vide — c'est le signal que
      la dette est soldée
- [ ] Branche `MNV-176-kyc` **puis** `MNV-176`, PR rebase-mergées sur `dev` **dans cet ordre**

---

## Lié

- **STORY-185** — le dossier « à compléter » : le motif par pièce est ce que cet état **transporte**.
  Les deux ensemble font qu'un cabinet sait *quoi* corriger et *qu'il doit* le faire ; l'une sans
  l'autre laisse la moitié du chemin.
- **STORY-183** — historique des décisions : un motif non persisté n'a rien à raconter à
  l'historique. 176 §incrément 1 est **en amont** de 183 sur ce point précis.
