# STORY-650 : Money Vibes agit POUR une organisation — contrôleurs d'administration, `orgId` explicite, et la liste blanche de ce qui est délégable

Status: ready-for-dev

**Épic :** EPIC-025 — Fondation RBAC (catalogue de permissions, rôles, portée)
**Service :** `paiement-service` (`:3005`) + `notification-service` (`:3008`)
**Points :** 8 · **Sprint :** ⚠️ **NON SLOTTÉE** — le S32 proposé le 2026-09-05 a été **clôturé** (27/27) avant l’intégration de cette fiche ; le slotting reste à rendre au prochain sprint-planning. Elle se tire avec STORY-166/167, dont elle dépend. ⚠️ **RENUMÉROTÉE DEUX FOIS le 2026-09-08** (ex-STORY-599, puis brièvement 631) : la branche locale `r1-rbac-tenant` n’était pas poussée, et le cadrage PI-SPI du 2026-09-05 a repris 599 et 600 en ne balayant que les branches distantes. Le tracker de `main` demandait cette renumérotation. ⚠️ La plage **631 → 649** est ensuite revenue au plan de convergence des rails C et D (document du 2026-09-08) : ces deux fiches se posent donc au-delà, en 650 et 651.
**Prérequis :** **STORY-166** (socle de rôles) · **STORY-167** (surcharge par organisation) — les deux `not_started` au S31
**Origine :** arbitrage PO du 2026-09-04, **Q2 = oui** : *« je dois pouvoir le faire pour lui… mais le client doit le voir dans son journal, c'est important pour la traçabilité »*.

---

## Le fait

**Aucune route de ces deux services n'est appelable par un opérateur plateforme.** Vérifié dans le
code le 2026-09-04 : les quatre familles servies (`comptes-encaissement`, `contacts`, `modeles`,
`passerelles`) prennent l'organisation de `@CurrentUser('tenantId')`. `passerelles.controller.ts` le
revendique comme une propriété de sécurité, et il a raison :

> *« Aucune route ne prend d'identifiant d'organisation, ni en chemin, ni en corps, ni en requête.
> C'est ce qui rend FR-N54 vrai **par construction** plutôt que par vigilance : il n'existe aucune
> valeur à falsifier. »*

Or un opérateur Money Vibes est **org-less** : pas de `tenantId`, donc aucune de ces routes. Le
support ne peut rien faire pour un client, et **AP-13 suppose exactement le contraire** depuis sa
rédaction (*« l'administration saisit **pour** un client »*).

## Le mécanisme n'est pas à inventer — il existe deux fois

| Précédent | Forme |
|---|---|
| `kyc-service/src/modules/kyc/kyc-admin.controller.ts` | `GET /:orgId` · `POST /:orgId/approve` · `POST /:orgId/reject` · `POST /:orgId/documents/:documentId/approve` |
| `platform-catalog-service/.../entitlements.controller.ts` | `PUT /:orgId/:moduleCode` · `DELETE /:orgId/:moduleCode` · `GET /:orgId` |

Un **contrôleur `*-admin` séparé**, un **`orgId` explicite en chemin**, une **permission
plateforme**. Money Vibes approuve déjà un KYC et octroie déjà un entitlement *pour* un client par
ce chemin (STORY-048, `done`). Cette story l'étend aux deux services, **sans concept nouveau**.

⛔ **La voie écartée, et pourquoi.** Donner au support une *membership* dans chaque organisation
cliente : il faudrait la créer et la retirer dans **chacune**, le support hériterait de la portée de
lecture d'un membre, et surtout **le journal du client dirait « un membre a fait X »** — pas
« Money Vibes a fait X », c'est-à-dire l'inverse de ce que l'arbitrage demande.

## Ce que ça coûte, et qu'il faut écrire

⚠️ **La garantie de FR-N54 passe de « par construction » à « par vigilance ».** Ce n'est pas une
raison de renoncer, c'est une raison de la compenser — et les AC ci-dessous sont cette compensation.
Le point de rupture serait un `orgId` **optionnel** ajouté aux routes existantes : il paraîtrait
économique, et un jour quelqu'un le rendrait lisible depuis le corps de la requête.

## Critères d'acceptation

- [ ] AC-1 — **Contrôleurs séparés**, un par service : `comptes-encaissement-admin`,
      `passerelles-admin`, `modeles-admin`. ⛔ **Aucun paramètre d'organisation ajouté à une route
      existante** — les routes de tenant restent exactement telles qu'elles sont, `orgId` du jeton
      compris. Un test de contrat le prouve en comparant les signatures avant/après.
- [ ] AC-2 — L'`orgId` est **en chemin**, jamais dans le corps ni en requête, comme chez
      `kyc-admin`. Une organisation inconnue rend **`404`**, jamais `403` (anti-énumération, règle
      déjà tenue par les quatre familles).
- [ ] AC-3 — ⛔ **Un jeton TENANT sur une route d'administration rend `404`.** C'est le patron exact
      de STORY-597 AC-3, à recopier : la route ne doit pas seulement refuser, elle ne doit pas
      **exister** pour un client. Prouvé par mutation : retirer la garde fait virer le test au rouge.
- [ ] AC-4 — ⛔⛔ **Liste blanche explicite des actes délégables, déclarée en code et testée.**
      **Configuration ⇒ oui · Argent ⇒ non.**
      | Délégable | Non délégable |
      |---|---|
      | déclarer un compte d'encaissement · armer une passerelle · corriger un modèle | déclarer un encaissement · valider un encaissement · enregistrer une annulation · attribuer une grâce |
      ⚡ **Le motif n'est pas la prudence, c'est `NFR-1` (« Prospera ne détient jamais les fonds »)
      et `AD-11`.** Un opérateur qui pourrait déclarer *et* valider à la place du client viderait la
      séparation des pouvoirs de STORY-241 de son objet — et **elle ne le verrait pas**, puisqu'elle
      s'établit contre le journal, où les deux actes porteraient le même auteur.
- [ ] AC-5 — Les **secrets restent non restituables par ce chemin aussi** : un opérateur peut
      *écrire* les identifiants d'un fournisseur ou d'une passerelle, **jamais les relire**. C'est
      la ligne qu'AP-13 avait déjà trouvée (*« saisit pour un client, sans jamais pouvoir relire »*)
      et que STORY-243 tient côté chiffrement.
- [ ] AC-6 — Le **titulaire d'un compte d'encaissement n'est jamais pré-rempli avec Money Vibes**
      (AP-13, `422 TITULAIRE_REQUIS`). Un opérateur qui saisit pour un client saisit **le titulaire
      du client**.
- [ ] AC-7 — Chaque acte délégué émet l'entrée de journal de **STORY-651**. ⛔ Un acte délégable qui
      n'écrit pas au journal du client **ne passe pas la DoD** : la traçabilité est la condition de
      l'arbitrage, pas son complément.

## Ce qui NE fait PAS partie de cette story

- L'extension du catalogue aux droits de tenant : **STORY-166/167**.
- La console qui appelle ces routes : **AP-13** (comptes d'encaissement), **AP-30/32/33**.
- L'usurpation d'identité au sens strict (agir *sous* l'identité du client) : écartée, voir ci-dessus.

## Notes

- Voir [[STORY-166]], [[STORY-167]], [[STORY-651]], [[STORY-241]], [[STORY-243]], [[STORY-048]],
  [[AP-13]], `kyc-admin.controller.ts` et `entitlements.controller.ts` (les deux précédents).
